#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { FanRequirements } from "@matter/main/devices/fan";

const GPIO_SW_TOGGLE_FAN = 18;
const GPIO_DEV_FAN = 25;

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

