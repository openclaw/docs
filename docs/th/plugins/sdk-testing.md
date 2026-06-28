---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตี้ทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่รวมมาในชุด
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับยูทิลิตีทดสอบ รูปแบบ และการบังคับใช้ lint สำหรับ Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่หรือไม่?** คู่มือวิธีใช้มีตัวอย่างการทดสอบแบบลงมือทำ:
  [การทดสอบ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีทดสอบ

subpath ตัวช่วยทดสอบเหล่านี้เป็น entrypoint ซอร์สภายใน repo สำหรับการทดสอบ Plugin ที่ bundle มากับ OpenClaw เอง ไม่ใช่ package export สำหรับ Plugin ภายนอก และอาจ import Vitest หรือ dependency สำหรับการทดสอบที่ใช้เฉพาะใน repo อื่น ๆ

**การ import mock ของ Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**การ import สัญญา runtime ของ agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**การ import สัญญาช่องทาง:** `openclaw/plugin-sdk/channel-contract-testing`

**การ import ตัวช่วยทดสอบช่องทาง:** `openclaw/plugin-sdk/channel-test-helpers`

**การ import การทดสอบเป้าหมายช่องทาง:** `openclaw/plugin-sdk/channel-target-testing`

**การ import สัญญา Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**การ import การทดสอบ runtime ของ Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**การ import สัญญาผู้ให้บริการ:** `openclaw/plugin-sdk/provider-test-contracts`

**การ import mock HTTP ของผู้ให้บริการ:** `openclaw/plugin-sdk/provider-http-test-mocks`

**การ import การทดสอบสภาพแวดล้อม/เครือข่าย:** `openclaw/plugin-sdk/test-env`

**การ import fixture ทั่วไป:** `openclaw/plugin-sdk/test-fixtures`

**การ import mock builtin ของ Node:** `openclaw/plugin-sdk/test-node-mocks`

ภายใน repo ของ OpenClaw ให้เลือกใช้ subpath เฉพาะด้านล่างสำหรับการทดสอบ Plugin ที่ bundle มาใหม่ barrel แบบกว้าง
`openclaw/plugin-sdk/testing` เป็นเพียงความเข้ากันได้แบบ legacy เท่านั้น
guardrail ของ repo จะปฏิเสธ real import ใหม่จาก `plugin-sdk/testing` และ
`plugin-sdk/test-utils`; ชื่อเหล่านั้นยังคงอยู่เฉพาะในฐานะพื้นผิวความเข้ากันได้ที่เลิกใช้งานแล้วสำหรับการทดสอบ compatibility-record

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

| รายการส่งออก                                        | วัตถุประสงค์                                                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                | สร้าง mock API ของ Plugin แบบขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                                      |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญา auth-profile ที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`                  |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งมอบที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`               |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจัดประเภท fallback ที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`          |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`                          |
| `expectChannelInboundContextContract`                | ตรวจยืนยันรูปทรงบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                                 |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีสัญญาเพย์โหลดขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                               |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                        |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีสัญญาการกระทำของข้อความช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                       |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีสัญญาการตั้งค่าช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                               |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีสัญญาสถานะช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                    |
| `expectDirectoryIds`                                 | ตรวจยืนยัน id ไดเรกทอรีของช่องทางจากฟังก์ชันรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `assertBundledChannelEntries`                        | ตรวจยืนยันว่า entrypoint ของช่องทางที่บันเดิลไว้เปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                            |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบเวลาประทับของ envelope แบบกำหนดได้แน่นอน นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                       |
| `expectPairingReplyText`                             | ตรวจยืนยันข้อความตอบกลับการจับคู่ของช่องทางและดึงรหัสออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                                              |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                                               |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งรายการในการทดสอบ smoke ของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                      |
| `registerProviderPlugin`                             | จับผู้ให้บริการทุกชนิดจาก Plugin หนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                             |
| `registerProviderPlugins`                            | จับการลงทะเบียนผู้ให้บริการข้าม Plugin หลายรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                        |
| `requireRegisteredProvider`                          | ตรวจยืนยันว่าคอลเลกชันผู้ให้บริการมี id อยู่ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                             |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin แบบ mock นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                              |
| `createPluginRuntimeMock`                            | สร้างพื้นผิวรันไทม์ของ Plugin แบบ mock นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                    |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                         |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ของตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                                   |
| `expectPassthroughReplayPolicy`                      | ตรวจยืนยันว่านโยบาย replay ของผู้ให้บริการส่งผ่านเครื่องมือและเมทาดาทาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`    |
| `runRealtimeSttLiveTest`                             | รันการทดสอบสดผู้ให้บริการ STT แบบเรียลไทม์ด้วยฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                           |
| `normalizeTranscriptForMatch`                        | ทำเอาต์พุต transcript สดให้เป็นรูปแบบมาตรฐานก่อนการตรวจยืนยันแบบ fuzzy นำเข้าจาก `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                           |
| `expectExplicitMusicGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                            |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่เข้ากันได้กับ DashScope และสำเร็จ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                       |
| `getProviderHttpMocks`                               | เข้าถึง mock HTTP/auth ของผู้ให้บริการใน Vitest แบบ opt-in นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                           |
| `installProviderHttpMockCleanup`                     | รีเซ็ต mock HTTP/auth ของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                         |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการ resolve เป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                                |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่ม reaction ack หรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                                              |
| `removeAckReactionAfterReply`                        | ลบ reaction ack หลังการส่งมอบคำตอบ นำเข้าจาก `plugin-sdk/channel-feedback`                                                                           |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                            |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ว่าง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                               |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ของ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`          |
| `createRequestCaptureJsonFetch`                      | จับคำขอ fetch แบบ JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                                         |
| `withServer`                                         | รันการทดสอบกับเซิร์ฟเวอร์ HTTP แบบใช้แล้วทิ้งในเครื่อง นำเข้าจาก `plugin-sdk/test-env`                                                              |
| `createMockIncomingRequest`                          | สร้างออบเจกต์คำขอ HTTP ขาเข้าแบบขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                                              |
| `withFetchPreconnect`                                | รันการทดสอบ fetch โดยติดตั้ง hook preconnect ไว้ นำเข้าจาก `plugin-sdk/test-env`                                                                     |
| `withEnv` / `withEnvAsync`                           | แก้ไขตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                                                       |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์ทดสอบระบบไฟล์แบบแยกส่วน นำเข้าจาก `plugin-sdk/test-env`                                                                               |
| `createMockServerResponse`                           | สร้าง mock การตอบกลับของเซิร์ฟเวอร์ HTTP แบบขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                                 |
| `createCliRuntimeCapture`                            | จับเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                               |
| `importFreshModule`                                  | นำเข้าโมดูล ESM ด้วยโทเค็น query ใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                                                         |
| `bundledPluginRoot` / `bundledPluginFile`            | resolve พาธฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่บันเดิลไว้ นำเข้าจาก `plugin-sdk/test-fixtures`                                                   |
| `mockNodeBuiltinModule`                              | ติดตั้ง mock บิวต์อิน Node แบบแคบใน Vitest นำเข้าจาก `plugin-sdk/test-node-mocks`                                                                    |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบ sandbox นำเข้าจาก `plugin-sdk/test-fixtures`                                                                                      |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ skill นำเข้าจาก `plugin-sdk/test-fixtures`                                                                                           |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความ transcript ของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจดูและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                         |
| `sanitizeTerminalText`                               | ทำเอาต์พุตเทอร์มินัลให้ปลอดภัยสำหรับการตรวจยืนยัน นำเข้าจาก `plugin-sdk/test-fixtures`                                                              |
| `countLines` / `hasBalancedFences`                   | ตรวจยืนยันรูปทรงเอาต์พุตการแบ่ง chunk นำเข้าจาก `plugin-sdk/test-fixtures`                                                                           |
| `runProviderCatalog`                                 | เรียกใช้ hook แคตตาล็อกผู้ให้บริการด้วย dependency สำหรับการทดสอบ                                                                                    |
| `resolveProviderWizardOptions`                       | resolve ตัวเลือกของวิซาร์ดตั้งค่าผู้ให้บริการในการทดสอบสัญญา                                                                                        |
| `resolveProviderModelPickerEntries`                  | resolve รายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา                                                                                           |
| `buildProviderPluginMethodChoice`                    | สร้าง id ตัวเลือกวิซาร์ดผู้ให้บริการสำหรับการตรวจยืนยัน                                                                                              |
| `setProviderWizardProvidersResolverForTest`          | ฉีดผู้ให้บริการของวิซาร์ดผู้ให้บริการสำหรับการทดสอบแบบแยกส่วน                                                                                      |
| `createProviderUsageFetch`                           | สร้าง fixture สำหรับการดึงข้อมูลการใช้งานผู้ให้บริการ                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | หยุดและกู้คืนตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | สร้าง prompter ของวิซาร์ดตั้งค่าแบบจำลอง                                                                                                     |
| `createRuntimeTaskFlow`                              | สร้างสถานะ TaskFlow ของรันไทม์แบบแยกส่วน                                                                                                  |
| `typedCases`                                         | รักษาประเภทลิเทอรัลสำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดสัญญาของ Plugin ที่บันเดิลมาด้วยยังใช้เส้นทางย่อยสำหรับการทดสอบของ SDK สำหรับตัวช่วย fixture เฉพาะการทดสอบของ registry, manifest, public-artifact และ runtime ชุดทดสอบเฉพาะ core ที่พึ่งพา inventory ของ OpenClaw ที่บันเดิลมาด้วยจะอยู่ภายใต้ `src/plugins/contracts`
ให้เก็บการทดสอบ extension ใหม่ไว้บนเส้นทางย่อย SDK แบบเจาะจงที่มีเอกสารกำกับ เช่น
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทนการ import compatibility barrel แบบกว้าง
`plugin-sdk/testing`, ไฟล์ repo `src/**` หรือสะพาน repo
`test/helpers/*` โดยตรง

### ประเภท

เส้นทางย่อยสำหรับการทดสอบแบบเจาะจงยัง re-export ประเภทที่มีประโยชน์ในไฟล์ทดสอบด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การระบุเป้าหมายการทดสอบ

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การระบุเป้าหมายของ channel:

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

Unit test ที่ส่ง mock `api` ที่เขียนเองไปยัง `register(api)` จะไม่ได้ทดสอบ
ด่านการยอมรับของ loader ของ OpenClaw ให้เพิ่ม smoke test ที่หนุนด้วย loader อย่างน้อยหนึ่งรายการ
สำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณพึ่งพา โดยเฉพาะ hooks และ
ความสามารถแบบ exclusive เช่น memory

loader จริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อ metadata ที่จำเป็นขาดหาย หรือเมื่อ
Plugin เรียก capability API ที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อ hook และ
`api.registerMemoryCapability(...)` ต้องให้ manifest ของ Plugin หรือ entry ที่ export
ประกาศ `kind: "memory"`

### การทดสอบการเข้าถึง runtime config

ควรใช้ mock runtime ของ Plugin แบบใช้ร่วมกันจาก `openclaw/plugin-sdk/plugin-test-runtime`
mock ของ `runtime.config.loadConfig()` และ `runtime.config.writeConfigFile(...)`
ที่เลิกใช้แล้วจะ throw โดยค่าเริ่มต้น เพื่อให้การทดสอบจับการใช้งานใหม่ของ compatibility API ได้ ให้ override
mock เหล่านั้นเฉพาะเมื่อการทดสอบครอบคลุมพฤติกรรมความเข้ากันได้แบบ legacy อย่างชัดเจนเท่านั้น

### Unit testing a channel plugin

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

### Unit testing a provider plugin

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

### การทดสอบด้วย stub ราย instance

ควรใช้ stub ราย instance แทนการ mutate prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contract tests (Plugin ใน repo)

Plugin ที่บันเดิลมาด้วยมี contract tests ที่ตรวจสอบ ownership ของการลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยัน:

- Plugin ใดลงทะเบียน provider ใด
- Plugin ใดลงทะเบียน speech provider ใด
- ความถูกต้องของรูปทรงการลงทะเบียน
- การสอดคล้องตามสัญญาของ runtime

### การรันการทดสอบตามขอบเขต

สำหรับ Plugin เฉพาะรายการ:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

สำหรับ contract tests เท่านั้น:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## การบังคับใช้ lint (Plugin ใน repo)

มีกฎสามข้อที่ `pnpm check` บังคับใช้สำหรับ Plugin ใน repo:

1. **ห้าม import จาก root แบบ monolithic** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้าม import `src/` โดยตรง** -- Plugin ไม่สามารถ import `../../src/` โดยตรงได้
3. **ห้าม self-import** -- Plugin ไม่สามารถ import เส้นทางย่อย `plugin-sdk/<name>` ของตัวเองได้

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

หากการรันในเครื่องทำให้เกิดแรงกดดันด้านหน่วยความจำ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- ข้อตกลงการ import
- [Plugin ของ SDK สำหรับ Channel](/th/plugins/sdk-channel-plugins) -- interface ของ channel Plugin
- [Plugin ของ SDK สำหรับ Provider](/th/plugins/sdk-provider-plugins) -- hooks ของ provider Plugin
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
