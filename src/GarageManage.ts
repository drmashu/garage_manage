#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServerNode } from "@matter/main";
import { MovementDirection, MovementType, WindowCoveringServer } from "@matter/main/behaviors/window-covering";

import { WindowCoveringDevice } from "@matter/main/devices/window-covering";
import { OnOffLightDevice } from "@matter/main/devices/on-off-light";
import { FanDevice } from "@matter/main/devices/fan";

import { Shutter,Light,Fan } from "./devices/index.js"

/**
 * Our Matter node.
 */
const node = new ServerNode({
    id: "GarageManage001",

    productDescription: {

    },

    commissioning: {
        passcode: 19750608,
        discriminator: 3840,
    },

    basicInformation: {
        vendorName: "KGS Lab.",
        productName: "GarageManage 001",
        vendorId: 0xfff1,
        productId: 0x8000,
        serialNumber: "gm001-00000001",
    },

    parts: [
        {
            type: WindowCoveringDevice.with(Shutter),
            id: "shutter",
        },

        {
            type: OnOffLightDevice.with(Light),
            id: "light",
        },

        {
            type: FanDevice.with(Fan),
            id: "fan",
        },
    ],
});

await node.run();
