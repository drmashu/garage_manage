#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ServerNode,
  Time,
} from "@matter/main";

import { ShutterEndpoint } from "./devices/shutter.js";
import { LightEndpoint } from "./devices/light.js";
import { FanEndpoint } from "./devices/fan.js";

const deviceName = "GarageManage";
const vendorName = "KGS Lab.";
const productName = "GarageManage001";

const passcode = 19750608;
const discriminator = 3840;
const vendorId = 0xfff1;
const productId = 0x8000;
const port = 5540;
const uniqueId = Time.nowMs().toString();

/**
 * Matter サーバノードを作成.
 */
const server = await ServerNode.create({
  id: uniqueId,

  productDescription: {
    name: deviceName,
  },

  commissioning: {
    passcode,
    discriminator,
  },

  basicInformation: {
    vendorName,
    productName,
    vendorId,
    productId,
    serialNumber: `gm001-${uniqueId}`,
  },
});

await server.add(ShutterEndpoint);
await server.add(LightEndpoint);
await server.add(FanEndpoint);

await server.run();
