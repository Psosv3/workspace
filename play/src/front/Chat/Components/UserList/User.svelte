<script lang="ts">
    import { AvailabilityStatus } from "@workadventure/messages";
    import highlightWords from "highlight-words";
    import { localUserStore } from "../../../Connection/LocalUserStore";
    import { availabilityStatusStore } from "../../../Stores/MediaStore";
    import { getColorHexOfStatus } from "../../../Utils/AvailabilityStatus";
    import { ChatUser } from "../../Connection/ChatConnection";
    import { LL } from "../../../../i18n/i18n-svelte";
    import { chatSearchBarValue } from "../../Stores/ChatStore";
    import { defaultColor, defaultWoka } from "../../Connection/Matrix/MatrixChatConnection";
    import { openChatRoom } from "../../Utils";
    import { gameManager } from "../../../Phaser/Game/GameManager";
    import UserActionButton from "./UserActionButton.svelte";
    import { IconLoader, IconSend } from "@wa-icons";

    export let user: ChatUser;

    let showRoomCreationInProgress = false;

    $: ({ chatId, availabilityStatus, username = "", color, isAdmin, avatarUrl } = user);

    $: isMe = user.chatId === localUserStore.getChatId() || user.chatId === localUserStore.getLocalUser()?.uuid;

    $: userStatus = isMe ? availabilityStatusStore : availabilityStatus;

    $: chunks = highlightWords({
        text: username.match(/\[\d*]/) ? username.substring(0, username.search(/\[\d*]/)) : username,
        query: $chatSearchBarValue,
    });

    $: roomCreationInProgress = gameManager.chatConnection.roomCreationInProgress;

    function getNameOfAvailabilityStatus(status: AvailabilityStatus) {
        switch (status) {
            case AvailabilityStatus.ONLINE:
                return $LL.chat.status.online();
            case AvailabilityStatus.AWAY:
                return $LL.chat.status.away();
            case AvailabilityStatus.BUSY:
                return $LL.chat.status.busy();
            case AvailabilityStatus.DO_NOT_DISTURB:
                return $LL.chat.status.do_not_disturb();
            case AvailabilityStatus.BACK_IN_A_MOMENT:
                return $LL.chat.status.back_in_a_moment();
            case AvailabilityStatus.JITSI:
            case AvailabilityStatus.BBB:
                return $LL.chat.status.meeting();
            case AvailabilityStatus.SPEAKER:
                return $LL.chat.status.megaphone();
            case AvailabilityStatus.SILENT:
            default:
                return $LL.chat.status.unavailable();
        }
    }

    let loadingDirectRoomAccess = false;
</script>

{#if loadingDirectRoomAccess}
    <div class="min-h-[60px] text-md flex gap-2 justify-center flex-row items-center p-1">
        <IconLoader class="animate-spin" />
    </div>
{:else}
    <div class="flex flex-col px-2 pb-2 user">
        <div
            class="wa-chat-item {isAdmin
                ? 'admin'
                : 'user'} group/chatItem relative mb-[1px] text-md flex gap-2 flex-row items-center hover:bg-white transition-all hover:bg-opacity-10 hover:rounded hover:!cursor-pointer px-2 py-2 cursor-pointer"
        >
            <div
                class="relative wa-avatar {!$userStatus ? 'opacity-50' : ''} cursor-default w-7 h-7 rounded-md"
                style={`background-color: ${color ?? defaultColor}`}
            >
                <div class="w-7 h-7 rounded-md overflow-hidden">
                    <div
                        class="translate-y-[3px] -translate-x-[3px] group-hover/chatItem:translate-y-[0] transition-all"
                    >
                        <img
                            class="w-8 h-8 cursor-default"
                            style="image-rendering: pixelated;"
                            src={avatarUrl ?? defaultWoka}
                            alt="Avatar"
                        />
                    </div>
                </div>
            </div>
            <div class={`flex-auto ml-1 ${!$userStatus && "opacity-50"}  cursor-default`}>
                <div class="flex items-center h-4">
                    <div class="text-sm font-bold mb-0 cursor-default flex items-center">
                        {#each chunks as chunk (chunk.key)}
                            <div class={`${chunk.match ? "text-light-blue" : ""}  cursor-default`}>
                                {chunk.text}
                            </div>
                        {/each}
                        {#if username && username.match(/\[\d*]/)}
                            <div class="font-light text-xs text-gray cursor-default">
                                #{username
                                    .match(/\[\d*]/)
                                    ?.join()
                                    ?.replace("[", "")
                                    ?.replace("]", "")}
                            </div>
                        {/if}
                        {#if isAdmin}
                            <div
                                class="text-xxs bg-secondary rounded-sm px-1 py-0.5 ml-1"
                                title={$LL.chat.role.admin()}
                            >
                                {$LL.chat.role.adminShort()}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="text-xs mb-0 font-condensed opacity-75 cursor-default self-end">
                    {#if isMe}
                        {$LL.chat.you()}
                    {:else if $userStatus}
                        <div class="flex items-center brightness-150" style="color:{getColorHexOfStatus($userStatus)}">
                            {#if $userStatus}
                                <div
                                    class="rounded-full mr-1 h-1.5 w-1.5"
                                    style="background:{getColorHexOfStatus($userStatus)}"
                                />
                            {/if}
                            {getNameOfAvailabilityStatus($userStatus ?? 0)}
                        </div>
                    {:else}
                        {$LL.chat.userList.disconnected()}
                    {/if}
                </div>
            </div>
            <div class="group-hover/chatItem:opacity-100 opacity-0 transition-all">
                {#if !isMe}
                    <UserActionButton {user} />
                {/if}
            </div>
            {#if !isMe && !showRoomCreationInProgress}
                <button
                    class="transition-all group-hover/chatItem:bg-white/10 p-1 rounded-md aspect-square flex items-center justify-center text-white group-hover/chatItem:opacity-100 opacity-0 m-0"
                    on:click|stopPropagation={() => {
                        if (user.chatId !== user.uuid && !isMe) {
                            showRoomCreationInProgress = true;
                            openChatRoom(chatId)
                                .catch((error) => console.error(error))
                                .finally(() => {
                                    showRoomCreationInProgress = false;
                                });
                        }
                    }}
                >
                    <IconSend font-size="16" />
                </button>
            {:else if $roomCreationInProgress && showRoomCreationInProgress}
                <div class="min-h-[30px] text-md flex gap-2 justify-center flex-row items-center p-1">
                    <IconLoader class="animate-spin" />
                </div>
            {/if}
        </div>
    </div>

    <style lang="scss">
        .status {
            background-color: var(--color);
        }
    </style>
{/if}
