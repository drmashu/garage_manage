#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import { OnOffLightRequirements } from "@matter/main/devices/on-off-light";
import { Gpio } from 'pigpio';

const GPIO_SW_TOGGLE_LIGHT = 17;
const GPIO_SW_DEV_LIGHT = 24;

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

