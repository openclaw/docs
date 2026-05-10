---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีสำหรับทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่บันเดิลมา
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-05-10T19:52:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

เอกสารอ้างอิงสำหรับยูทิลิตีทดสอบ รูปแบบ และการบังคับใช้ lint สำหรับ
Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่หรือไม่?** คู่มือวิธีใช้งานมีตัวอย่างการทดสอบที่ทำให้ดูแล้ว:
  [การทดสอบ Plugin ของช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีทดสอบ

พาธย่อยของตัวช่วยทดสอบเหล่านี้เป็นจุดเข้าใช้งานซอร์สภายใน repo สำหรับการทดสอบ
Plugin ที่จัดรวมมากับ OpenClaw เอง พาธเหล่านี้ไม่ใช่ export ของแพ็กเกจสำหรับ Plugin
ของบุคคลที่สาม

**การนำเข้า mock สำหรับ API ของ Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**การนำเข้า contract ของรันไทม์ Agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**การนำเข้า contract ของช่องทาง:** `openclaw/plugin-sdk/channel-contract-testing`

**การนำเข้าตัวช่วยทดสอบช่องทาง:** `openclaw/plugin-sdk/channel-test-helpers`

**การนำเข้าการทดสอบเป้าหมายของช่องทาง:** `openclaw/plugin-sdk/channel-target-testing`

**การนำเข้า contract ของ Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**การนำเข้าการทดสอบรันไทม์ของ Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**การนำเข้า contract ของผู้ให้บริการ:** `openclaw/plugin-sdk/provider-test-contracts`

**การนำเข้า mock HTTP ของผู้ให้บริการ:** `openclaw/plugin-sdk/provider-http-test-mocks`

**การนำเข้าการทดสอบสภาพแวดล้อม/เครือข่าย:** `openclaw/plugin-sdk/test-env`

**การนำเข้า fixture ทั่วไป:** `openclaw/plugin-sdk/test-fixtures`

**การนำเข้า mock สำหรับ Node builtin:** `openclaw/plugin-sdk/test-node-mocks`

สำหรับการทดสอบ Plugin ใหม่ ให้เลือกใช้พาธย่อยแบบเจาะจงด้านล่างนี้เป็นหลัก barrel
`openclaw/plugin-sdk/testing` แบบกว้างมีไว้เพื่อความเข้ากันได้กับระบบเดิมเท่านั้น
guardrail ของ repo จะปฏิเสธการนำเข้าใหม่ที่ใช้งานจริงจาก `plugin-sdk/testing` และ
`plugin-sdk/test-utils`; ชื่อเหล่านั้นยังคงอยู่เฉพาะในฐานะ surface ความเข้ากันได้
ที่เลิกแนะนำแล้วสำหรับการทดสอบ compatibility-record

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

### export ที่ใช้ได้

| การส่งออก                                             | วัตถุประสงค์                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้าง API ของ Plugin จำลองขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญาโปรไฟล์การยืนยันตัวตนที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจัดประเภทการสำรองที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์เนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | ยืนยันรูปทรงบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีสัญญาเพย์โหลดขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีสัญญาการกระทำกับข้อความของช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีสัญญาการตั้งค่าช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีสัญญาสถานะช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | ยืนยัน ID ไดเรกทอรีของช่องทางจากฟังก์ชันแสดงรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | ยืนยันว่า entrypoint ของช่องทางที่รวมมาเปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบเวลาประทับของซองหุ้มแบบกำหนดผลลัพธ์ได้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | ยืนยันข้อความตอบกลับการจับคู่ของช่องทางและดึงรหัสออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งตัวในการทดสอบ smoke ของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | จับชนิดผู้ให้บริการทั้งหมดจาก Plugin หนึ่งตัว นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | จับการลงทะเบียนผู้ให้บริการข้าม Plugin หลายตัว นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | ยืนยันว่าคอลเลกชันผู้ให้บริการมี ID หนึ่งอยู่ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin แบบจำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ระดับตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | ยืนยันว่านโยบายการเล่นซ้ำของผู้ให้บริการส่งผ่านเครื่องมือและเมทาดาทาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | รันการทดสอบสดของผู้ให้บริการ STT แบบเรียลไทม์ด้วยฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | ทำให้เอาต์พุตถอดความสดเป็นมาตรฐานก่อนการยืนยันแบบคลุมเครือ นำเข้าจาก `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | ยืนยันว่าผู้ให้บริการวิดีโอประกาศความสามารถโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | ยืนยันว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่เข้ากันได้กับ DashScope และสำเร็จ นำเข้าจาก `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | เข้าถึง mock ของ HTTP/การยืนยันตัวตนผู้ให้บริการสำหรับ Vitest แบบเลือกใช้ นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | รีเซ็ต mock ของ HTTP/การยืนยันตัวตนผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดของการแปลงเป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มรีแอ็กชันตอบรับหรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | ลบรีแอ็กชันตอบรับหลังส่งการตอบกลับ นำเข้าจาก `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ว่าง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ของ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | จับคำขอ fetch แบบ JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                     |
| `withServer`                                         | รันการทดสอบกับเซิร์ฟเวอร์ HTTP ภายในที่ใช้แล้วทิ้ง นำเข้าจาก `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | สร้างออบเจ็กต์คำขอ HTTP ขาเข้าขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | รันการทดสอบ fetch โดยติดตั้งฮุกการเชื่อมต่อล่วงหน้าไว้ นำเข้าจาก `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | แพตช์ตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์ทดสอบระบบไฟล์แบบแยกส่วน นำเข้าจาก `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | สร้าง mock การตอบกลับเซิร์ฟเวอร์ HTTP ขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | จับเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | นำเข้าโมดูล ESM พร้อมโทเค็นคำค้นใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | แปลงเส้นทางฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่รวมมา นำเข้าจาก `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | ติดตั้ง mock ของโมดูลในตัว Node แบบแคบสำหรับ Vitest นำเข้าจาก `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบแซนด์บ็อกซ์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ Skills นำเข้าจาก `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความถอดความของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจสอบและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำความสะอาดเอาต์พุตเทอร์มินัลสำหรับการยืนยัน นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | ยืนยันรูปทรงเอาต์พุตการแบ่งชิ้น นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | เรียกใช้ฮุกแค็ตตาล็อกผู้ให้บริการพร้อมดีเพนเดนซีสำหรับทดสอบ                                                                                   |
| `resolveProviderWizardOptions`                       | แปลงตัวเลือกตัวช่วยตั้งค่าผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `resolveProviderModelPickerEntries`                  | แปลงรายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `buildProviderPluginMethodChoice`                    | สร้าง ID ตัวเลือกของตัวช่วยตั้งค่าผู้ให้บริการสำหรับการยืนยัน                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | ฉีดผู้ให้บริการของตัวช่วยตั้งค่าผู้ให้บริการสำหรับการทดสอบแบบแยกส่วน                                                                                      |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์สำหรับดึงข้อมูลการใช้งานผู้ให้บริการ                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | หยุดและกู้คืนตัวจับเวลาสำหรับการทดสอบที่อ่อนไหวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | สร้างตัวแจ้งพรอมต์ของตัวช่วยตั้งค่าจำลอง                                                                                                     |
| `createRuntimeTaskFlow`                              | สร้างสถานะ TaskFlow ของรันไทม์แบบแยก isolated                                                                                                  |
| `typedCases`                                         | รักษาประเภทลิเทอรัลสำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดสัญญาของ Plugin ที่บันเดิลมายังใช้พาธย่อยการทดสอบของ SDK สำหรับตัวช่วย fixture เฉพาะการทดสอบ
ด้านรีจิสทรี, manifest, อาร์ติแฟกต์สาธารณะ และรันไทม์ ชุดทดสอบเฉพาะ core
ที่พึ่งพา inventory ของ OpenClaw ที่บันเดิลมาจะยังอยู่ภายใต้ `src/plugins/contracts`
ให้วางการทดสอบ extension ใหม่ไว้บนพาธย่อย SDK ที่มีเอกสารกำกับและมีขอบเขตชัดเจน เช่น
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทนการนำเข้า
barrel ความเข้ากันได้แบบกว้าง `plugin-sdk/testing`, ไฟล์ `src/**` ของ repo หรือบริดจ์
`test/helpers/*` ของ repo โดยตรง

### ชนิดข้อมูล

พาธย่อยการทดสอบแบบมีขอบเขตชัดเจนยัง re-export ชนิดข้อมูลที่มีประโยชน์ในไฟล์ทดสอบด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การแก้เป้าหมายการทดสอบ

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การแก้เป้าหมายของช่องทาง:

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

Unit test ที่ส่ง mock `api` ที่เขียนเองให้ `register(api)` จะไม่ได้ทดสอบ
ด่านยอมรับของ loader ของ OpenClaw ให้เพิ่ม smoke test ที่หนุนด้วย loader อย่างน้อยหนึ่งรายการ
สำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณพึ่งพา โดยเฉพาะ hook และ
ความสามารถแบบเอกสิทธิ์ เช่น memory

loader จริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อ metadata ที่จำเป็นขาดหาย หรือเมื่อ
Plugin เรียก API ความสามารถที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อ hook และ
`api.registerMemoryCapability(...)` ต้องให้ manifest ของ Plugin หรือ entry ที่ export
ประกาศ `kind: "memory"`

### การทดสอบการเข้าถึง config ของรันไทม์

ให้ใช้ mock รันไทม์ Plugin แบบใช้ร่วมกันจาก `openclaw/plugin-sdk/channel-test-helpers`
เมื่อทดสอบ Plugin ช่องทางที่บันเดิลมา mock `runtime.config.loadConfig()` ที่เลิกแนะนำแล้วและ
`runtime.config.writeConfigFile(...)` จะ throw เป็นค่าเริ่มต้น เพื่อให้การทดสอบจับการใช้งานใหม่
ของ API ความเข้ากันได้ได้ ให้ override mock เหล่านั้นเฉพาะเมื่อการทดสอบ
ครอบคลุมพฤติกรรมความเข้ากันได้แบบ legacy อย่างชัดเจนเท่านั้น

### การทดสอบ Unit test สำหรับ Plugin ช่องทาง

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

### การทดสอบ Unit test สำหรับ Plugin provider

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

### การ mock รันไทม์ Plugin

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้ mock รันไทม์ในการทดสอบ:

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

ควรใช้ stub รายอินสแตนซ์มากกว่าการแก้ไข prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ใน repo)

Plugin ที่บันเดิลมามีการทดสอบสัญญาที่ตรวจสอบ ownership การลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยัน:

- Plugin ใดลงทะเบียน provider ใด
- Plugin ใดลงทะเบียน provider เสียงพูดใด
- ความถูกต้องของรูปทรงการลงทะเบียน
- การปฏิบัติตามสัญญารันไทม์

### การรันการทดสอบแบบกำหนดขอบเขต

สำหรับ Plugin เฉพาะ:

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

มีกฎสามข้อที่ `pnpm check` บังคับใช้สำหรับ Plugin ใน repo:

1. **ห้ามนำเข้าจาก root แบบรวมศูนย์** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้ามนำเข้า `src/` โดยตรง** -- Plugin ไม่สามารถนำเข้า `../../src/` โดยตรงได้
3. **ห้าม self-import** -- Plugin ไม่สามารถนำเข้าพาธย่อย `plugin-sdk/<name>` ของตัวเองได้

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

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- ข้อตกลงการนำเข้า
- [Plugin ช่องทางของ SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin ช่องทาง
- [Plugin provider ของ SDK](/th/plugins/sdk-provider-plugins) -- hook ของ Plugin provider
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
