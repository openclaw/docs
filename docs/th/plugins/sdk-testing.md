---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีทดสอบจาก Plugin SDK
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่รวมมาด้วย
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-06-27T18:09:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับยูทิลิตีทดสอบ รูปแบบ และการบังคับใช้ lint สำหรับ
plugins ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่หรือไม่?** คู่มือวิธีใช้งานมีตัวอย่างการทดสอบแบบลงมือทำ:
  [การทดสอบ Channel plugin](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Provider plugin](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีทดสอบ

subpaths ของ test-helper เหล่านี้เป็น entrypoints ของซอร์สภายใน repo สำหรับการทดสอบ bundled plugin ของ OpenClaw เอง
ไม่ใช่ package exports สำหรับ plugins ของบุคคลที่สาม และ
อาจ import Vitest หรือ dependencies สำหรับการทดสอบที่ใช้เฉพาะใน repo อื่นๆ

**การ import mock ของ Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**การ import contract ของ agent runtime:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**การ import contract ของ channel:** `openclaw/plugin-sdk/channel-contract-testing`

**การ import helper สำหรับทดสอบ channel:** `openclaw/plugin-sdk/channel-test-helpers`

**การ import การทดสอบ target ของ channel:** `openclaw/plugin-sdk/channel-target-testing`

**การ import contract ของ Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**การ import การทดสอบ runtime ของ Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**การ import contract ของ provider:** `openclaw/plugin-sdk/provider-test-contracts`

**การ import mock ของ HTTP provider:** `openclaw/plugin-sdk/provider-http-test-mocks`

**การ import การทดสอบ environment/network:** `openclaw/plugin-sdk/test-env`

**การ import fixture ทั่วไป:** `openclaw/plugin-sdk/test-fixtures`

**การ import mock ของ Node builtin:** `openclaw/plugin-sdk/test-node-mocks`

ภายใน repo ของ OpenClaw ให้เลือกใช้ subpaths แบบเฉพาะด้านล่างสำหรับการทดสอบ bundled
plugin ใหม่ barrel แบบกว้าง
`openclaw/plugin-sdk/testing` มีไว้เพื่อความเข้ากันได้แบบ legacy เท่านั้น
guardrails ของ repo จะปฏิเสธ real imports ใหม่จาก `plugin-sdk/testing` และ
`plugin-sdk/test-utils`; ชื่อเหล่านั้นคงอยู่เฉพาะในฐานะ surfaces สำหรับความเข้ากันได้ที่ deprecated
สำหรับการทดสอบ compatibility-record

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Exports ที่พร้อมใช้งาน

| Export                                               | วัตถุประสงค์                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้าง mock API ของ Plugin แบบขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | fixture สัญญาโปรไฟล์การยืนยันตัวตนที่ใช้ร่วมกันสำหรับตัวปรับต่อรันไทม์เอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | fixture สัญญาการระงับการส่งข้อความที่ใช้ร่วมกันสำหรับตัวปรับต่อรันไทม์เอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | fixture สัญญาการจัดประเภท fallback ที่ใช้ร่วมกันสำหรับตัวปรับต่อรันไทม์เอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | สร้าง fixture สคีมาเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | ตรวจยืนยันรูปทรงบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีสัญญา payload ขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีสัญญาการกระทำของข้อความช่องทางทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีสัญญาการตั้งค่าช่องทางทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีสัญญาสถานะช่องทางทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | ตรวจยืนยัน ids ไดเรกทอรีของช่องทางจากฟังก์ชันรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | ตรวจยืนยัน entrypoint ช่องทางที่บันเดิลไว้เปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบ timestamp ของ envelope แบบกำหนดผลได้แน่นอน นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | ตรวจยืนยันข้อความตอบกลับการจับคู่ของช่องทางและแยกโค้ดของข้อความนั้น นำเข้าจาก `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งรายการในการทดสอบ smoke ของ loader นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | จับชนิดผู้ให้บริการทั้งหมดจาก Plugin หนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | จับการลงทะเบียนผู้ให้บริการข้ามหลาย Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | ตรวจยืนยันว่าคอลเลกชันผู้ให้บริการมี id อยู่ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin แบบ mock นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | ตรวจยืนยันนโยบาย replay ของผู้ให้บริการส่งผ่านเครื่องมือและข้อมูลเมตาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | รันการทดสอบสดของผู้ให้บริการ STT แบบเรียลไทม์พร้อม fixture เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | ทำเอาต์พุต transcript สดให้เป็นรูปแบบมาตรฐานก่อน assertion แบบ fuzzy นำเข้าจาก `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่เข้ากันได้กับ DashScope และสำเร็จ นำเข้าจาก `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | เข้าถึง mock HTTP/auth ของผู้ให้บริการสำหรับ Vitest แบบ opt-in นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | รีเซ็ต mock HTTP/auth ของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการแก้ปลายทาง นำเข้าจาก `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มรีแอ็กชัน ack หรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | ลบรีแอ็กชัน ack หลังจากส่งการตอบกลับแล้ว นำเข้าจาก `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | สร้าง fixture รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | สร้าง fixture รีจิสทรี Plugin ว่าง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | ติดตั้ง fixture รีจิสทรีสำหรับการทดสอบรันไทม์ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | จับคำขอ fetch แบบ JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                     |
| `withServer`                                         | รันการทดสอบกับเซิร์ฟเวอร์ HTTP ภายในเครื่องแบบใช้แล้วทิ้ง นำเข้าจาก `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | สร้างอ็อบเจกต์คำขอ HTTP ขาเข้าแบบขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | รันการทดสอบ fetch โดยติดตั้ง hook preconnect แล้ว นำเข้าจาก `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | แพตช์ตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้าง fixture การทดสอบระบบไฟล์แบบแยกโดดเดี่ยว นำเข้าจาก `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | สร้าง mock การตอบกลับเซิร์ฟเวอร์ HTTP แบบขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | จับเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | นำเข้าโมดูล ESM พร้อม query token ใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | แก้ path fixture ของซอร์สหรือ dist ของ Plugin ที่บันเดิลไว้ นำเข้าจาก `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | ติดตั้ง mock ของ Node builtin สำหรับ Vitest แบบแคบ นำเข้าจาก `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบ sandbox นำเข้าจาก `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | เขียน fixture ของ skill นำเข้าจาก `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | สร้าง fixture ข้อความ transcript ของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจสอบและรีเซ็ต fixture เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำเอาต์พุตเทอร์มินัลให้ปลอดภัยสำหรับ assertion นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | ตรวจยืนยันรูปทรงเอาต์พุตการแบ่ง chunk นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | เรียกใช้ hook แค็ตตาล็อกผู้ให้บริการพร้อม dependency สำหรับการทดสอบ                                                                                   |
| `resolveProviderWizardOptions`                       | แก้ตัวเลือกตัวช่วยตั้งค่าผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `resolveProviderModelPickerEntries`                  | แก้รายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `buildProviderPluginMethodChoice`                    | สร้าง ids ตัวเลือกตัวช่วยตั้งค่าผู้ให้บริการสำหรับ assertion                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | ฉีดผู้ให้บริการของตัวช่วยตั้งค่าผู้ให้บริการสำหรับการทดสอบแบบแยกโดดเดี่ยว                                                                                      |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์สำหรับดึงข้อมูลการใช้งานผู้ให้บริการ                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | ตรึงและกู้คืนตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | สร้างพรอมป์เตอร์ตัวช่วยตั้งค่าแบบจำลอง                                                                                                     |
| `createRuntimeTaskFlow`                              | สร้างสถานะ task-flow ของรันไทม์แบบแยกอิสระ                                                                                                  |
| `typedCases`                                         | คงประเภท literal สำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดสัญญา Plugin ที่บันเดิลมาพร้อมกันยังใช้ subpath การทดสอบของ SDK สำหรับ helper เฉพาะการทดสอบด้าน registry, manifest, public-artifact และ runtime fixture ด้วย ชุดทดสอบเฉพาะ core ที่พึ่งพา inventory ของ OpenClaw ที่บันเดิลมาพร้อมกันจะยังอยู่ใต้ `src/plugins/contracts` เก็บการทดสอบ extension ใหม่ไว้บน subpath SDK แบบเฉพาะจุดที่มีเอกสารกำกับ เช่น `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทนการ import compatibility barrel กว้างๆ อย่าง `plugin-sdk/testing`, ไฟล์ `src/**` ของ repo หรือ bridge `test/helpers/*` ของ repo โดยตรง

### ชนิด

subpath การทดสอบแบบเฉพาะจุดยัง re-export ชนิดที่มีประโยชน์ในไฟล์ทดสอบด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การทดสอบการแปลง target

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับการแปลง target ของ channel:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## รูปแบบการทดสอบ

### การทดสอบสัญญาการลงทะเบียน

Unit test ที่ส่ง mock `api` ที่เขียนเองให้กับ `register(api)` จะไม่ได้ทดสอบ acceptance gate ของ loader ใน OpenClaw ให้เพิ่ม smoke test ที่มี loader รองรับอย่างน้อยหนึ่งรายการสำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณพึ่งพา โดยเฉพาะ hook และ capability แบบ exclusive เช่น memory

loader จริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อ metadata ที่จำเป็นขาดหายไป หรือเมื่อ Plugin เรียก capability API ที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น `api.registerHook(...)` ต้องมีชื่อ hook และ `api.registerMemoryCapability(...)` ต้องให้ manifest ของ Plugin หรือ entry ที่ export ประกาศ `kind: "memory"`

### การทดสอบการเข้าถึง runtime config

ควรใช้ mock runtime ของ Plugin แบบใช้ร่วมกันจาก `openclaw/plugin-sdk/channel-test-helpers` เมื่อทดสอบ Plugin channel ที่บันเดิลมาพร้อมกัน mock `runtime.config.loadConfig()` และ `runtime.config.writeConfigFile(...)` ที่เลิกแนะนำแล้วจะ throw โดยปริยาย เพื่อให้การทดสอบจับการใช้งาน compatibility API ใหม่ได้ override mock เหล่านั้นเฉพาะเมื่อการทดสอบครอบคลุมพฤติกรรมความเข้ากันได้แบบ legacy อย่างชัดเจนเท่านั้น

### การทดสอบ unit สำหรับ Plugin channel

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### การทดสอบ unit สำหรับ Plugin provider

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### การ mock runtime ของ Plugin

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้ mock runtime ในการทดสอบ:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### การทดสอบด้วย stub ต่อ instance

ควรใช้ stub ต่อ instance แทนการแก้ไข prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ใน repo)

Plugin ที่บันเดิลมาพร้อมกันมีการทดสอบสัญญาที่ตรวจสอบ ownership ของการลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยันว่า:

- Plugin ใดลงทะเบียน provider ใด
- Plugin ใดลงทะเบียน speech provider ใด
- ความถูกต้องของรูปทรงการลงทะเบียน
- การปฏิบัติตามสัญญา runtime

### การรันการทดสอบแบบกำหนดขอบเขต

สำหรับ Plugin เฉพาะรายการ:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

สำหรับการทดสอบสัญญาเท่านั้น:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## การบังคับใช้ lint (Plugin ใน repo)

มีกฎสามข้อที่ `pnpm check` บังคับใช้กับ Plugin ใน repo:

1. **ห้าม import จาก root แบบ monolithic** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้าม import `src/` โดยตรง** -- Plugin ไม่สามารถ import `../../src/` ได้โดยตรง
3. **ห้าม self-import** -- Plugin ไม่สามารถ import subpath `plugin-sdk/<name>` ของตนเองได้

Plugin ภายนอกไม่อยู่ภายใต้กฎ lint เหล่านี้ แต่แนะนำให้ทำตามรูปแบบเดียวกัน

## การกำหนดค่าการทดสอบ

OpenClaw ใช้ Vitest พร้อม threshold coverage ของ V8 สำหรับการทดสอบ Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

หากการรันในเครื่องทำให้เกิดแรงกดดันด้านหน่วยความจำ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- รูปแบบการ import
- [Plugin channel ของ SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin channel
- [Plugin provider ของ SDK](/th/plugins/sdk-provider-plugins) -- hook ของ Plugin provider
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
