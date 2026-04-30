---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่รวมมาให้
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-04-30T10:09:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับยูทิลิตี้ รูปแบบ และการบังคับใช้ lint สำหรับ Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่ใช่ไหม?** คู่มือวิธีทำมีตัวอย่างการทดสอบแบบลงมือทำ:
  [การทดสอบ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตี้การทดสอบ

**การนำเข้า mock ของ Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**การนำเข้า contract ของรันไทม์ Agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**การนำเข้า contract ของช่องทาง:** `openclaw/plugin-sdk/channel-contract-testing`

**การนำเข้า helper การทดสอบช่องทาง:** `openclaw/plugin-sdk/channel-test-helpers`

**การนำเข้าการทดสอบเป้าหมายช่องทาง:** `openclaw/plugin-sdk/channel-target-testing`

**การนำเข้า contract ของ Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**การนำเข้าการทดสอบรันไทม์ Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**การนำเข้า contract ของผู้ให้บริการ:** `openclaw/plugin-sdk/provider-test-contracts`

**การนำเข้า mock HTTP ของผู้ให้บริการ:** `openclaw/plugin-sdk/provider-http-test-mocks`

**การนำเข้าการทดสอบสภาพแวดล้อม/เครือข่าย:** `openclaw/plugin-sdk/test-env`

**การนำเข้า fixture ทั่วไป:** `openclaw/plugin-sdk/test-fixtures`

**การนำเข้า mock ของ Node builtin:** `openclaw/plugin-sdk/test-node-mocks`

แนะนำให้ใช้ subpath ที่เจาะจงด้านล่างสำหรับการทดสอบ Plugin ใหม่ barrel แบบกว้าง
`openclaw/plugin-sdk/testing` มีไว้เพื่อความเข้ากันได้แบบ legacy เท่านั้น
guardrails ของ repo จะปฏิเสธการนำเข้าจริงใหม่จาก `plugin-sdk/testing` และ
`plugin-sdk/test-utils`; ชื่อเหล่านั้นยังคงอยู่เฉพาะในฐานะพื้นผิวความเข้ากันได้ที่เลิกแนะนำแล้ว
สำหรับ Plugin ภายนอกและการทดสอบบันทึกความเข้ากันได้

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

### export ที่มีอยู่

| การส่งออก                                           | วัตถุประสงค์                                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้างม็อก API ของ Plugin ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญาโปรไฟล์การยืนยันตัวตนที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจัดประเภท fallback ที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาเครื่องมือไดนามิกสำหรับการทดสอบสัญญารันไทม์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | ยืนยันรูปทรงบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีสัญญา payload ขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีสัญญาการกระทำต่อข้อความทั่วไปของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีสัญญาการตั้งค่าทั่วไปของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีสัญญาสถานะทั่วไปของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | ยืนยัน id ไดเรกทอรีของช่องทางจากฟังก์ชันรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | ยืนยันว่าจุดเข้าใช้งานช่องทางที่บันเดิลมาเปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบเวลาประทับของ envelope แบบกำหนดผลลัพธ์ได้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | ยืนยันข้อความตอบกลับการจับคู่ของช่องทางและแยกรหัสออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งรายการในการทดสอบ smoke ของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | จับชนิดผู้ให้บริการทั้งหมดจาก Plugin เดียว นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | จับการลงทะเบียนผู้ให้บริการข้ามหลาย Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | ยืนยันว่าคอลเลกชันผู้ให้บริการมี id อยู่ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin แบบม็อก นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | ยืนยันว่านโยบาย replay ของผู้ให้บริการส่งผ่านเครื่องมือและเมตาดาต้าที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | เรียกใช้การทดสอบสดผู้ให้บริการ STT แบบเรียลไทม์พร้อมฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | ทำให้เอาต์พุตทรานสคริปต์สดเป็นมาตรฐานก่อนการยืนยันแบบ fuzzy นำเข้าจาก `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | ยืนยันว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | ยืนยันว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่สำเร็จและเข้ากันได้กับ DashScope นำเข้าจาก `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | เข้าถึงม็อก Vitest สำหรับ HTTP/การยืนยันตัวตนของผู้ให้บริการแบบเลือกใช้ นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | รีเซ็ตม็อก HTTP/การยืนยันตัวตนของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดการแก้เป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มปฏิกิริยา ack หรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | ลบปฏิกิริยา ack หลังส่งการตอบกลับ นำเข้าจาก `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ว่าง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | จับคำขอ fetch JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                     |
| `withServer`                                         | เรียกใช้การทดสอบกับเซิร์ฟเวอร์ HTTP ในเครื่องแบบใช้แล้วทิ้ง นำเข้าจาก `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | สร้างออบเจ็กต์คำขอ HTTP ขาเข้าขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | เรียกใช้การทดสอบ fetch โดยติดตั้ง hook preconnect แล้ว นำเข้าจาก `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | แพตช์ตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์การทดสอบระบบไฟล์แบบแยกส่วน นำเข้าจาก `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | สร้างม็อกการตอบกลับเซิร์ฟเวอร์ HTTP ขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | จับเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | นำเข้าโมดูล ESM พร้อมโทเค็น query ใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | แก้เส้นทางฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่บันเดิลมา นำเข้าจาก `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | ติดตั้งม็อก Vitest สำหรับ builtin ของ Node แบบจำกัดขอบเขต นำเข้าจาก `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบ sandbox นำเข้าจาก `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ skill นำเข้าจาก `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความทรานสคริปต์ของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจสอบและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำความสะอาดเอาต์พุตเทอร์มินัลสำหรับการยืนยัน นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | ยืนยันรูปทรงเอาต์พุตการแบ่ง chunk นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | ดำเนินการ hook แค็ตตาล็อกผู้ให้บริการพร้อมดีเพนเดนซีทดสอบ                                                                                   |
| `resolveProviderWizardOptions`                       | แก้ตัวเลือกวิซาร์ดการตั้งค่าผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `resolveProviderModelPickerEntries`                  | แก้รายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `buildProviderPluginMethodChoice`                    | สร้าง id ตัวเลือกวิซาร์ดผู้ให้บริการสำหรับการยืนยัน                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | ฉีดผู้ให้บริการของวิซาร์ดผู้ให้บริการสำหรับการทดสอบแบบแยกส่วน                                                                                      |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์สำหรับการดึงข้อมูลการใช้งานของผู้ให้บริการ                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | แช่แข็งและกู้คืนตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | สร้างตัวแจ้งพร้อมต์ของวิซาร์ดการตั้งค่าที่จำลองไว้                                                                                                     |
| `createRuntimeTaskFlow`                              | สร้างสถานะ task-flow ขณะรันไทม์แบบแยกอิสระ                                                                                                  |
| `typedCases`                                         | รักษาชนิดลิเทอรัลสำหรับการทดสอบแบบ table-driven นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดสัญญาของ Plugin ที่รวมมาด้วยยังใช้พาธย่อยสำหรับการทดสอบของ SDK สำหรับ helper ของ fixture เฉพาะการทดสอบ
สำหรับ registry, manifest, อาร์ติแฟกต์สาธารณะ และ runtime ชุดทดสอบเฉพาะ core
ที่พึ่งพาคลังรายการ OpenClaw ที่รวมมาด้วยจะยังอยู่ภายใต้ `src/plugins/contracts`
เก็บการทดสอบ extension ใหม่ไว้บนพาธย่อย SDK แบบเจาะจงที่มีเอกสารกำกับ เช่น
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทนการ import
barrel ความเข้ากันได้แบบกว้าง `plugin-sdk/testing`, ไฟล์ `src/**` ของ repo หรือ
bridge `test/helpers/*` ของ repo โดยตรง

### ประเภท

พาธย่อยสำหรับการทดสอบแบบเจาะจงยัง re-export ประเภทที่มีประโยชน์ในไฟล์ทดสอบด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การทดสอบการแก้ target

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การแก้ target ของช่องทาง:

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

การทดสอบหน่วยที่ส่ง mock `api` ที่เขียนเองให้ `register(api)` ไม่ได้ทดสอบ
gate การยอมรับของ loader ของ OpenClaw เพิ่ม smoke test ที่มี loader รองรับอย่างน้อยหนึ่งรายการ
สำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณพึ่งพา โดยเฉพาะ hook และ
capability แบบ exclusive เช่น memory

loader จริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อ metadata ที่จำเป็นขาดหาย หรือเมื่อ
Plugin เรียก capability API ที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อ hook และ
`api.registerMemoryCapability(...)` ต้องให้ manifest ของ Plugin หรือ entry ที่ export
ประกาศ `kind: "memory"`

### การทดสอบการเข้าถึง config ของ runtime

ควรใช้ mock runtime ของ Plugin แบบแชร์จาก `openclaw/plugin-sdk/channel-test-helpers`
เมื่อทดสอบ Plugin ช่องทางที่รวมมาด้วย mock `runtime.config.loadConfig()` และ
`runtime.config.writeConfigFile(...)` ที่เลิกใช้แล้วจะ throw ตามค่าเริ่มต้น เพื่อให้การทดสอบจับการใช้งานใหม่
ของ API ความเข้ากันได้ ให้ override mock เหล่านั้นเฉพาะเมื่อการทดสอบ
ครอบคลุมพฤติกรรมความเข้ากันได้แบบ legacy อย่างชัดเจน

### การทดสอบหน่วย Plugin ช่องทาง

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

### การทดสอบหน่วย Plugin ผู้ให้บริการ

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

### การทดสอบด้วย stub รายอินสแตนซ์

ควรใช้ stub รายอินสแตนซ์แทนการแก้ไข prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ใน repo)

Plugin ที่รวมมาด้วยมีการทดสอบสัญญาที่ตรวจสอบความเป็นเจ้าของการลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยัน:

- Plugin ใดลงทะเบียนผู้ให้บริการใด
- Plugin ใดลงทะเบียนผู้ให้บริการเสียงพูดใด
- ความถูกต้องของรูปทรงการลงทะเบียน
- การปฏิบัติตามสัญญา runtime

### การรันการทดสอบตาม scope

สำหรับ Plugin เฉพาะ:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

สำหรับการทดสอบสัญญาเท่านั้น:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## การบังคับใช้ lint (Plugin ใน repo)

มีกฎสามข้อที่ `pnpm check` บังคับใช้กับ Plugin ใน repo:

1. **ห้าม import จาก root แบบ monolithic** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้าม import `src/` โดยตรง** -- Plugin ไม่สามารถ import `../../src/` โดยตรง
3. **ห้าม self-import** -- Plugin ไม่สามารถ import พาธย่อย `plugin-sdk/<name>` ของตัวเอง

Plugin ภายนอกไม่อยู่ภายใต้กฎ lint เหล่านี้ แต่แนะนำให้ทำตาม
รูปแบบเดียวกัน

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

หากการรันภายในเครื่องทำให้เกิดแรงกดดันด้านหน่วยความจำ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- แบบแผนการ import
- [Plugin ช่องทาง SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin ช่องทาง
- [Plugin ผู้ให้บริการ SDK](/th/plugins/sdk-provider-plugins) -- hook ของ Plugin ผู้ให้บริการ
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้น
