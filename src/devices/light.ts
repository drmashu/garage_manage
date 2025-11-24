import { OnOffLightRequirements } from "@matter/main/devices/on-off-light";
import { Gpio } from 'pigpio';

/**
 * 照明のON/OFFサーバ
 */
export class Light extends OnOffLightRequirements.OnOffServer {
    override initialize() {
        this.reactTo(this.events.onOff$Changed, this.#stateChanged);
    }

    #stateChanged(value: boolean) {
        console.log(`Light is now ${value ? "illuminated" : "dark"}`);
    }
}

