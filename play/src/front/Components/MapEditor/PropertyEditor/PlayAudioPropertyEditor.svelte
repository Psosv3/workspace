<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { PlayAudioPropertyData } from "@workadventure/map-editor";
    import { LL } from "../../../../i18n/i18n-svelte";
    import audioSvg from "../../images/audio-white.svg";
    import PropertyEditorBase from "./PropertyEditorBase.svelte";

    export let property: PlayAudioPropertyData;
    export let isArea = false;
    let optionAdvancedActivated = false;

    const dispatch = createEventDispatcher();

    let HTMLAudioPlayer: HTMLAudioElement;
    let playing = false;
    let errorMessage = "";

    function playAudio() {
        if (!property.audioLink) {
            if (HTMLAudioPlayer) HTMLAudioPlayer.pause();
            return;
        }
        HTMLAudioPlayer.pause();
        HTMLAudioPlayer.src = property.audioLink;
        if (property.volume !== undefined) {
            HTMLAudioPlayer.volume = property.volume;
        }

        HTMLAudioPlayer.onended = () => {
            playing = false;
        };

        errorMessage = "";

        HTMLAudioPlayer.play()
            .then(() => {
                playing = true;
            })
            .catch((error) => {
                playing = false;
                if (error instanceof DOMException) {
                    errorMessage = $LL.mapEditor.properties.audioProperties.error() + ": " + error.message;
                } else {
                    errorMessage = $LL.mapEditor.properties.audioProperties.error();
                }
                console.error(error);
            });
    }

    function stopAudio() {
        if (HTMLAudioPlayer) HTMLAudioPlayer.pause();
        playing = false;
    }

    function onValueChange() {
        errorMessage = "";
        dispatch("change");
        // Fixme: this is a hack to force the map editor to update the property
        dispatch("audioLink", property);
    }

    function onRangeChange() {
        if (property.volume !== undefined) {
            HTMLAudioPlayer.volume = property.volume;
        }
        onValueChange();
    }
</script>

<PropertyEditorBase
    on:close={() => {
        dispatch("close");
    }}
>
    <span slot="header" class="flex justify-center items-center">
        <img class="w-6 mr-1" src={audioSvg} alt={$LL.mapEditor.properties.audioProperties.description()} />
        {$LL.mapEditor.properties.audioProperties.label()}
    </span>
    <span slot="content">
        <div class="value-input">
            <label for="audioLink">{$LL.mapEditor.properties.audioProperties.audioLinkLabel()}</label>
            <div class="flex">
                <input
                    id="audioLink"
                    type="text"
                    placeholder={$LL.mapEditor.properties.audioProperties.audioLinkPlaceholder()}
                    bind:value={property.audioLink}
                    on:change={onValueChange}
                />
                {#if !playing}
                    <button on:click={playAudio} class="m-0 pl-1 pr-0 text-xl"> ▶️ </button>
                {:else}
                    <button on:click={stopAudio} class="m-0 pl-1 pr-0 text-xl"> ⏹️ </button>
                {/if}
            </div>
            <audio class="audio-manager-audioplayer" bind:this={HTMLAudioPlayer} />
        </div>
        <div class="value-input text-danger-500" class:invisible={!errorMessage}>
            ⚠️ {errorMessage}
        </div>
        <div class="value-switch">
            <label for="advancedOption">{$LL.mapEditor.properties.advancedOptions()}</label>
            <input id="advancedOption" type="checkbox" class="input-switch" bind:checked={optionAdvancedActivated} />
        </div>
        <div class:active={optionAdvancedActivated} class="advanced-option px-2">
            {#if isArea === false}
                <div class="value-input flex flex-col">
                    <label for="triggerMessage">{$LL.mapEditor.properties.linkProperties.triggerMessage()}</label>
                    <input
                        id="triggerMessage"
                        type="text"
                        placeholder={$LL.trigger.object()}
                        bind:value={property.triggerMessage}
                        on:change={onValueChange}
                    />
                </div>
            {/if}
            <div class="value-input">
                <label for="volume">{$LL.mapEditor.properties.audioProperties.volumeLabel()}</label>
                <input
                    id="volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    bind:value={property.volume}
                    on:change={onRangeChange}
                />
            </div>
            {#if !property.hideButtonLabel}
                <div class="value-input">
                    <label for="audioButtonLabel">{$LL.mapEditor.entityEditor.buttonLabel()}</label>
                    <input
                        id="audioButtonLabel"
                        type="text"
                        bind:value={property.buttonLabel}
                        on:change={onValueChange}
                    />
                </div>
            {/if}
        </div>
    </span>
</PropertyEditorBase>

<style lang="scss">
    .value-input {
        display: flex;
        width: 100%;
        margin-bottom: 0.5em;
        margin-top: 0.5em;
        flex-direction: column;
        label {
            min-width: fit-content;
            margin-right: 0.5em;
        }
        input {
            flex-grow: 1;
            min-width: 0;
        }
        * {
            margin-bottom: 0;
        }
    }
    .value-switch {
        display: flex;
        width: 100%;
        margin-bottom: 0.5em;
        margin-top: 0.5em;
        align-items: center;
        height: 2.5em;
        label {
            min-width: fit-content;
            margin-right: 0.5em;
            flex-grow: 1;
        }
        input {
            min-width: 0;
        }
        * {
            margin-bottom: 0;
        }
    }
    // .input-switch {
    //     position: relative;
    //     top: 0px;
    //     right: 0px;
    //     bottom: 0px;
    //     left: 0px;
    //     display: inline-block;
    //     height: 1rem;
    //     width: 2rem;
    //     -webkit-appearance: none;
    //     -moz-appearance: none;
    //     appearance: none;
    //     border-radius: 9999px;
    //     border-width: 1px;
    //     border-style: solid;
    //     --border-opacity: 1;
    //     border-color: rgb(77 75 103 / var(--border-opacity));
    //     --bg-opacity: 1;
    //     background-color: rgb(15 31 45 / var(--bg-opacity));
    //     background-image: none;
    //     padding: 0px;
    //     --text-opacity: 1;
    //     color: rgb(242 253 255 / var(--text-opacity));
    //     outline: 2px solid transparent;
    //     outline-offset: 2px;
    //     cursor: url(../../../../../public/static/images/cursor_pointer.png), pointer;
    // }
    // .input-switch::before {
    //     position: absolute;
    //     left: -3px;
    //     top: -3px;
    //     height: 1.25rem;
    //     width: 1.25rem;
    //     border-radius: 9999px;
    //     --bg-opacity: 1;
    //     background-color: rgb(146 142 187 / var(--bg-opacity));
    //     transition-property: all;
    //     transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    //     transition-duration: 150ms;
    //     --content: "";
    //     content: var(--content);
    // }
    // .input-switch:checked {
    //     --border-opacity: 1;
    //     border-color: rgb(146 142 187 / var(--border-opacity));
    // }
    // .input-switch:checked::before {
    //     left: 13px;
    //     top: -3px;
    //     --bg-opacity: 1;
    //     background-color: rgb(65 86 246 / var(--bg-opacity));
    //     content: var(--content);
    //     /*--shadow: 0 0 7px 0 rgba(4, 255, 210, 1);
    //     --shadow-colored: 0 0 7px 0 var(--shadow-color);
    //     box-shadow: var(--ring-offset-shadow, 0 0 #0000), var(--ring-shadow, 0 0 #0000), var(--shadow);*/
    // }
    // .input-switch:disabled {
    //     cursor: not-allowed;
    //     opacity: 0.4;
    // }
    // .advanced-option {
    //     display: none;
    //     &.active {
    //         display: block;
    //     }
    // }
</style>
