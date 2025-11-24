import { FanRequirements } from "@matter/main/devices/fan";
/**
 * Implementation of the OnOff cluster for our fan.
 */
export class Fan extends FanRequirements.OnOffServer {
    override initialize() {
        this.reactTo(this.events.onOff$Changed, this.#stateChanged);
    }

    #stateChanged(value: boolean) {
        console.log(`Fan is now ${value ? "working" : "stopped"}`);
    }
}

