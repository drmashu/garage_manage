#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * Copyright 2025 KGS Lab. NAGASAWA Takahiro
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  Bytes,
  DeviceTypeId,
  Endpoint,
  Environment,
  LogDestination,
  LogLevel,
  Logger,
  ServerNode,
  StorageService,
  Time,
  VendorId,
} from "@matter/main";
import {
  MovementDirection,
  MovementType,
  WindowCoveringServer,
} from "@matter/main/behaviors/window-covering";

import { WindowCoveringDevice } from "@matter/main/devices/window-covering";
import { OnOffLightDevice } from "@matter/main/devices/on-off-light";
import { FanDevice } from "@matter/main/devices/fan";

import { ShutterEndpoint } from "./devices/shutter.js";
import { LightEndpoint } from "./devices/light.js";
import { FanEndpoint } from "./devices/fan.js"

/** Initialize configuration values */
const {
  deviceName,
  vendorName,
  passcode,
  discriminator,
  vendorId,
  productName,
  productId,
  port,
  uniqueId,
} = await getConfiguration();

const environment = Environment.default;
const storage = environment.get(StorageService);

/**
 * Matter サーバノードを作成.
 */
const server = new ServerNode({
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

/**
 * 設定取得
 */
async function getConfiguration() {

  console.log(`Storage location: ${storage.location} (Directory)`);
  const deviceStorage = (await storage.open("device")).createContext(
    "data"
  );

  const deviceName = "GarageManage";
  const vendorName = "KGS Lab.";
  const passcode =
    environment.vars.number("passcode") ??
    (await deviceStorage.get("passcode", 19750608));
  const discriminator =
    environment.vars.number("discriminator") ??
    (await deviceStorage.get("discriminator", 3840));
  const vendorId =
    environment.vars.number("vendorid") ??
    (await deviceStorage.get("vendorid", 0xfff1));
  const productName = "GarageManage001";
  const productId =
    environment.vars.number("productid") ??
    (await deviceStorage.get("productid", 0x8000));

  const port = environment.vars.number("port") ?? 5540;

  const nowMs = Time.nowMs().toString();
  const uniqueId =
    environment.vars.string("uniqueid") ??
    (await deviceStorage.get("uniqueid", nowMs));

  console.log(`uniqueId: ${uniqueId} / ${nowMs}`);

  // Persist basic data to keep them also on restart
  await deviceStorage.set({
    passcode,
    discriminator,
    vendorid: vendorId,
    productid: productId,
    uniqueid: uniqueId,
  });

  return {
    deviceName,
    vendorName,
    passcode,
    discriminator,
    vendorId,
    productName,
    productId,
    port,
    uniqueId,
  };
}
