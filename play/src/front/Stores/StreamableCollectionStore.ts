import { Readable, derived, get, writable } from "svelte/store";
import { createNestedStore } from "@workadventure/store-utils";
import { GameScene } from "../Phaser/Game/GameScene";
import { JitsiTrackWrapper } from "../Streaming/Jitsi/JitsiTrackWrapper";
import { JitsiTrackStreamWrapper } from "../Streaming/Jitsi/JitsiTrackStreamWrapper";
import { TrackWrapper } from "../Streaming/Common/TrackWrapper";
import { ScreenSharingPeer } from "../WebRtc/ScreenSharingPeer";
import { LayoutMode } from "../WebRtc/LayoutManager";
import { PeerStatus } from "../WebRtc/VideoPeer";
import { SpaceUserExtended } from "../Space/SpaceFilter/SpaceFilter";
import { VideoConfig } from "../Api/Events/Ui/PlayVideoEvent";
import { screenSharingLocalMedia } from "./ScreenSharingStore";
import { peerStore, screenSharingStreamStore } from "./PeerStore";
import { highlightedEmbedScreen } from "./HighlightedEmbedScreenStore";
import { gameSceneStore } from "./GameSceneStore";
import { embedScreenLayoutStore } from "./EmbedScreensStore";
import { highlightFullScreen } from "./ActionsCamStore";
import { scriptingVideoStore } from "./ScriptingVideoStore";

//export type Streamable = RemotePeer | ScreenSharingLocalMedia | JitsiTrackStreamWrapper;

export interface MediaStoreStreamable {
    type: "mediaStore";
    readonly streamStore: Readable<MediaStream | undefined>;
}

export interface JitsiTrackStreamable {
    type: "jitsiTrack";
    jitsiTrackStreamWrapper: JitsiTrackStreamWrapper;
}

export interface ScriptingVideoStreamable {
    type: "scripting";
    url: string;
    config: VideoConfig;
}

export interface AttachableVideo {
    attach: (container: HTMLElement) => void;
}

export interface Streamable {
    readonly uniqueId: string;
    readonly media: MediaStoreStreamable | JitsiTrackStreamable | ScriptingVideoStreamable;
    readonly volumeStore: Readable<number[] | undefined> | undefined;
    readonly hasVideo: Readable<boolean>;
    readonly hasAudio: Readable<boolean>;
    readonly isMuted: Readable<boolean>;
    readonly statusStore: Readable<PeerStatus>;
    readonly getExtendedSpaceUser: () => Promise<SpaceUserExtended> | undefined;
    readonly name: Readable<string>;
    readonly showVoiceIndicator: Readable<boolean>;
    readonly pictureStore: Readable<string | undefined>;
}

const broadcastTracksStore = createNestedStore<GameScene | undefined, Map<string, TrackWrapper>>(
    gameSceneStore,
    (gameScene) => (gameScene ? gameScene.broadcastService.getTracks() : writable<Map<string, TrackWrapper>>(new Map()))
);

const jitsiTracksStore = derived([broadcastTracksStore], ([$broadcastTracksStore]) => {
    const jitsiTracks = new Map<string, JitsiTrackWrapper>();
    for (const [key, value] of $broadcastTracksStore) {
        if (value instanceof JitsiTrackWrapper) {
            jitsiTracks.set(key, value);
        }
    }
    return jitsiTracks;
});

/**
 * A store that contains everything that can produce a stream (so the peers + the local screen sharing stream)
 */
function createStreamableCollectionStore(): Readable<Map<string, Streamable>> {
    return derived(
        [broadcastTracksStore, screenSharingStreamStore, peerStore, screenSharingLocalMedia, scriptingVideoStore],
        (
            [
                $broadcastTracksStore,
                $screenSharingStreamStore,
                $peerStore,
                $screenSharingLocalMedia,
                $scriptingVideoStore,
            ] /*, set*/
        ) => {
            const peers = new Map<string, Streamable>();

            const addPeer = (peer: Streamable) => {
                peers.set(peer.uniqueId, peer);
                // if peer is SreenSharing, change for presentation Layout mode
                if (peer instanceof ScreenSharingPeer) {
                    embedScreenLayoutStore.set(LayoutMode.Presentation);
                }
            };

            $screenSharingStreamStore.forEach(addPeer);
            $peerStore.forEach(addPeer);
            $scriptingVideoStore.forEach(addPeer);

            $broadcastTracksStore.forEach((trackWrapper) => {
                if (trackWrapper instanceof JitsiTrackWrapper) {
                    const cameraTrackWrapper = trackWrapper.cameraTrackWrapper;
                    if (/*!cameraTrackWrapper.isEmpty() &&*/ !trackWrapper.isLocal) {
                        addPeer(cameraTrackWrapper);
                    }
                    const screenSharingTrackWrapper = trackWrapper.screenSharingTrackWrapper;
                    if (
                        !screenSharingTrackWrapper.isEmpty() &&
                        screenSharingTrackWrapper.jitsiTrackWrapper.getImmediateSpaceUser()?.screenSharingState !==
                            false
                    ) {
                        addPeer(screenSharingTrackWrapper);
                    }
                }
            });

            if (
                $screenSharingLocalMedia &&
                $screenSharingLocalMedia.media.type === "mediaStore" &&
                get($screenSharingLocalMedia.media.streamStore)
            ) {
                addPeer($screenSharingLocalMedia);
            }

            const $highlightedEmbedScreen = get(highlightedEmbedScreen);

            if ($highlightedEmbedScreen && !peers.has($highlightedEmbedScreen.uniqueId)) {
                highlightedEmbedScreen.removeHighlight();
                highlightFullScreen.set(false);
            }

            return peers;
        }
    );
}

export const streamableCollectionStore = createStreamableCollectionStore();

// No need to unsubscribe, the store is global
// eslint-disable-next-line svelte/no-ignored-unsubscribe
streamableCollectionStore.subscribe((streamableCollection) => {
    // If the highlightedEmbedScreen is not in the streamableCollection, we remove the highlight
    const $highlightedEmbedScreen = get(highlightedEmbedScreen);
    if ($highlightedEmbedScreen && !streamableCollection.has($highlightedEmbedScreen.uniqueId)) {
        highlightedEmbedScreen.removeHighlight();
        highlightFullScreen.set(false);
    }
});

export const myJitsiCameraStore = derived([jitsiTracksStore], ([$jitsiTracksStore]) => {
    for (const jitsiTrackWrapper of $jitsiTracksStore.values()) {
        if (jitsiTrackWrapper.isLocal) {
            const cameraTrackWrapper = jitsiTrackWrapper.cameraTrackWrapper;
            /*if (cameraTrackWrapper.isEmpty()) {
                return null;
            }*/
            return cameraTrackWrapper;
        }
    }
    return null;
});
