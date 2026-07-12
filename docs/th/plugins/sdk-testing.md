---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีสำหรับการทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่มาพร้อมระบบ
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-07-12T16:31:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

เอกสารอ้างอิงสำหรับยูทิลิตี รูปแบบ และการบังคับใช้ lint สำหรับการทดสอบ Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่ใช่ไหม** คู่มือวิธีใช้งานมีตัวอย่างการทดสอบที่แสดงขั้นตอนครบถ้วน:
  [การทดสอบ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีสำหรับการทดสอบ

พาธย่อยเหล่านี้เป็นจุดเริ่มต้นซอร์สภายในรีโพสำหรับการทดสอบ Plugin แบบรวมมากับ OpenClaw เอง พาธเหล่านี้ไม่ได้เป็น export ใน `package.json` ที่เผยแพร่สำหรับ Plugin ของบุคคลที่สาม และอาจนำเข้า Vitest หรือการขึ้นต่อกันสำหรับการทดสอบอื่น ๆ ที่ใช้เฉพาะภายในรีโพ

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

สำหรับการทดสอบ Plugin แบบรวมมากับระบบรายการใหม่ ให้เลือกใช้พาธย่อยที่เจาะจงเหล่านี้ ส่วน barrel แบบกว้าง `openclaw/plugin-sdk/testing` และนามแฝง `openclaw/plugin-sdk/test-utils` มีไว้เพื่อความเข้ากันได้กับระบบเดิมเท่านั้น: `pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) จะปฏิเสธการนำเข้ารายการใหม่จากทั้งสองรายการในไฟล์ทดสอบส่วนขยาย และทั้งสองรายการยังคงมีไว้เฉพาะสำหรับการทดสอบบันทึกความเข้ากันได้เท่านั้น

### export ที่พร้อมใช้งาน

| การส่งออก                                           | วัตถุประสงค์                                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้าง API จำลองขั้นต่ำสำหรับ Plugin เพื่อใช้ในการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                                           |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญาโปรไฟล์การยืนยันตัวตนที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`                     |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`                            |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจำแนกประเภททางเลือกสำรองที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`              |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาของเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`                              |
| `expectChannelInboundContextContract`                | ตรวจยืนยันรูปแบบบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                                          |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีทดสอบสัญญาเพย์โหลดขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                                    |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตของบัญชีช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                                  |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีทดสอบสัญญาการดำเนินการกับข้อความช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                         |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีทดสอบสัญญาการตั้งค่าช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                     |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีทดสอบสัญญาสถานะช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                          |
| `expectDirectoryIds`                                 | ตรวจยืนยันรหัสไดเรกทอรีของช่องทางจากฟังก์ชันแสดงรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                    |
| `assertBundledChannelEntries`                        | ตรวจยืนยันว่าจุดแรกเข้าของช่องทางที่รวมมาให้เปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                                           |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบตราเวลาของเอนเวโลปให้กำหนดผลลัพธ์ได้แน่นอน นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                 |
| `expectPairingReplyText`                             | ตรวจยืนยันข้อความตอบกลับการจับคู่และแยกรหัสออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                                    |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                                                          |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งรายการในการทดสอบเบื้องต้นของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `registerProviderPlugin`                             | บันทึกผู้ให้บริการทุกประเภทจาก Plugin หนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                    |
| `registerProviderPlugins`                            | บันทึกการลงทะเบียนผู้ให้บริการจาก Plugin หลายรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                  |
| `requireRegisteredProvider`                          | ตรวจยืนยันว่าคอลเลกชันผู้ให้บริการมีรหัสที่กำหนด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                     |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin แบบจำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                          |
| `createPluginRuntimeMock`                            | สร้างพื้นผิวรันไทม์ของ Plugin แบบจำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                                |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                     |
| `createTestWizardPrompter`                           | สร้างตัวแจ้งคำถามของตัวช่วยตั้งค่าแบบจำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                           |
| `createRuntimeTaskFlow`                              | สร้างสถานะโฟลว์งานรันไทม์ที่แยกต่างหาก นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                                                |
| `runProviderCatalog`                                 | เรียกใช้ฮุกแค็ตตาล็อกผู้ให้บริการพร้อมการขึ้นต่อกันสำหรับการทดสอบ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                    |
| `resolveProviderWizardOptions`                       | หาค่าตัวเลือกของตัวช่วยตั้งค่าผู้ให้บริการในการทดสอบสัญญา นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                            |
| `resolveProviderModelPickerEntries`                  | หาค่ารายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                               |
| `buildProviderPluginMethodChoice`                    | สร้างรหัสตัวเลือกของตัวช่วยผู้ให้บริการสำหรับการตรวจยืนยัน นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                           |
| `setProviderWizardProvidersResolverForTest`          | แทรกตัวแก้ค่าผู้ให้บริการของตัวช่วยผู้ให้บริการสำหรับการทดสอบแบบแยกส่วน นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ของตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                                               |
| `expectPassthroughReplayPolicy`                      | ตรวจยืนยันว่านโยบายการเล่นซ้ำของผู้ให้บริการส่งผ่านเครื่องมือและข้อมูลเมตาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`            |
| `runRealtimeSttLiveTest`                             | เรียกใช้การทดสอบผู้ให้บริการ STT แบบเรียลไทม์บนระบบจริงด้วยฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                          |
| `normalizeTranscriptForMatch`                        | ปรับเอาต์พุตข้อความถอดเสียงจากระบบจริงให้เป็นมาตรฐานก่อนการตรวจยืนยันแบบคลุมเครือ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                |
| `expectExplicitVideoGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `expectExplicitMusicGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่เข้ากันได้กับ DashScope และสำเร็จ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                                   |
| `getProviderHttpMocks`                               | เข้าถึงม็อก HTTP/การยืนยันตัวตนของผู้ให้บริการสำหรับ Vitest ที่ต้องเลือกใช้โดยชัดแจ้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                           |
| `installProviderHttpMockCleanup`                     | รีเซ็ตม็อก HTTP/การยืนยันตัวตนของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                             |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการแก้ค่าเป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                                               |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มรีแอ็กชันรับทราบหรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                                                       |
| `removeAckReactionAfterReply`                        | ลบรีแอ็กชันรับทราบหลังส่งการตอบกลับแล้ว นำเข้าจาก `plugin-sdk/channel-feedback`                                                                                 |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                                        |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ว่างเปล่า นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                                     |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ของ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                      |
| `createRequestCaptureJsonFetch`                      | บันทึกคำขอ fetch แบบ JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                                                  |
| `withServer`                                         | เรียกใช้การทดสอบกับเซิร์ฟเวอร์ HTTP ภายในที่ใช้แล้วทิ้งได้ นำเข้าจาก `plugin-sdk/test-env`                                                                       |
| `createMockIncomingRequest`                          | สร้างออบเจ็กต์คำขอ HTTP ขาเข้าขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                                                            |
| `withFetchPreconnect`                                | เรียกใช้การทดสอบ fetch โดยติดตั้งฮุก preconnect แล้ว นำเข้าจาก `plugin-sdk/test-env`                                                                             |
| `withEnv` / `withEnvAsync`                           | แพตช์ตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                                                                  |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์การทดสอบระบบไฟล์แบบแยกส่วน นำเข้าจาก `plugin-sdk/test-env`                                                                                         |
| `createMockServerResponse`                           | สร้างม็อกการตอบกลับของเซิร์ฟเวอร์ HTTP ขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                                                   |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์ fetch การใช้งานผู้ให้บริการ นำเข้าจาก `plugin-sdk/test-env`                                                                                      |
| `useFrozenTime` / `useRealTime`                      | หยุดและคืนค่าตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                                                 |
| `createCliRuntimeCapture`                            | บันทึกเอาต์พุตรันไทม์ของ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                                     |
| `importFreshModule`                                  | นำเข้าโมดูล ESM ด้วยโทเค็นคิวรีใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                                                                       |
| `bundledPluginRoot` / `bundledPluginFile`            | หาค่าพาธฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่รวมมาให้ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `mockNodeBuiltinModule`                              | ติดตั้งม็อกโมดูลในตัวของ Node แบบขอบเขตแคบสำหรับ Vitest นำเข้าจาก `plugin-sdk/test-node-mocks`                                                                  |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบแซนด์บ็อกซ์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                                              |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ของ Skills นำเข้าจาก `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความทรานสคริปต์ของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจสอบและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ของระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำความสะอาดเอาต์พุตของเทอร์มินัลสำหรับการตรวจสอบยืนยัน นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | ตรวจสอบยืนยันรูปแบบเอาต์พุตของการแบ่งส่วน นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | รักษาชนิดลิเทอรัลสำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดการทดสอบสัญญาของ Plugin ที่รวมมาให้ยังใช้พาธย่อยสำหรับการทดสอบของ SDK เหล่านี้ด้วย สำหรับตัวช่วย fixture ของรีจิสทรี แมนิเฟสต์ อาร์ติแฟกต์สาธารณะ และรันไทม์ที่ใช้เฉพาะในการทดสอบ
ส่วนชุดการทดสอบเฉพาะแกนหลักที่ขึ้นอยู่กับรายการ OpenClaw ที่รวมมาให้ จะยังคงอยู่ภายใต้
`src/plugins/contracts`

### ชนิดข้อมูล

พาธย่อยสำหรับการทดสอบเฉพาะด้านยังส่งออกชนิดข้อมูลที่มีประโยชน์ในไฟล์ทดสอบซ้ำด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การแก้ไขเป้าหมายในการทดสอบ

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การแก้ไขเป้าหมายของช่องทาง:

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

การทดสอบหน่วยที่ส่งม็อก `api` ซึ่งเขียนขึ้นเองไปยัง `register(api)` จะไม่ได้
ทดสอบเกตการยอมรับของตัวโหลด OpenClaw เพิ่มการทดสอบควันแบบใช้ตัวโหลดอย่างน้อยหนึ่งรายการ
สำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณต้องพึ่งพา โดยเฉพาะ
ฮุกและความสามารถแบบเอกสิทธิ์ เช่น หน่วยความจำ

ตัวโหลดจริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อขาดข้อมูลเมตาที่จำเป็น หรือ
Plugin เรียก API ของความสามารถที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อฮุก และ
`api.registerMemoryCapability(...)` ต้องให้แมนิเฟสต์ของ Plugin หรือรายการที่ส่งออก
ประกาศ `kind: "memory"`

### การทดสอบการเข้าถึงการกำหนดค่ารันไทม์

ควรใช้ม็อกรันไทม์ Plugin ที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/plugin-test-runtime`
ม็อก `runtime.config.loadConfig()` และ `runtime.config.writeConfigFile(...)`
จะส่งข้อผิดพลาดตามค่าเริ่มต้น เพื่อให้การทดสอบตรวจพบการใช้งาน API ความเข้ากันได้
ที่เลิกแนะนำใหม่ ให้แทนที่ม็อกเหล่านั้นเฉพาะเมื่อการทดสอบครอบคลุมพฤติกรรม
ความเข้ากันได้แบบเดิมอย่างชัดเจนเท่านั้น

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

### การม็อกรันไทม์ของ Plugin

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้ม็อกรันไทม์ในการทดสอบ:

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

### การทดสอบด้วยสตับต่ออินสแตนซ์

ควรใช้สตับต่ออินสแตนซ์แทนการแก้ไขโพรโทไทป์:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ภายในรีโพ)

Plugin ที่รวมมาให้มีการทดสอบสัญญาเพื่อตรวจสอบความเป็นเจ้าของการลงทะเบียน:

```bash
pnpm test src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยัน:

- Plugin ใดลงทะเบียนผู้ให้บริการใด
- Plugin ใดลงทะเบียนผู้ให้บริการเสียงพูดใด
- ความถูกต้องของรูปแบบการลงทะเบียน
- การปฏิบัติตามสัญญารันไทม์

### การเรียกใช้การทดสอบแบบจำกัดขอบเขต

สำหรับ Plugin เฉพาะรายการ:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

สำหรับการทดสอบสัญญาเท่านั้น:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## การบังคับใช้ลินต์ (Plugin ภายในรีโพ)

`scripts/run-additional-boundary-checks.mjs` เรียกใช้ชุดการตรวจสอบขอบเขตการนำเข้า
`lint:plugins:*` ใน CI โดยแต่ละรายการยังสามารถเรียกใช้แยกต่างหากในเครื่องได้:

| คำสั่ง                                                        | สิ่งที่บังคับใช้                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugin ที่รวมมาให้ไม่สามารถนำเข้าบาร์เรลราก `openclaw/plugin-sdk` แบบรวมศูนย์ได้                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | ไฟล์ส่วนขยายสำหรับการใช้งานจริงไม่สามารถนำเข้าทรี `src/**` ของรีโพโดยตรง (`../../src/...`) ได้                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | ไฟล์ทดสอบส่วนขยายไม่สามารถนำเข้า `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` หรือตัวช่วยทดสอบเฉพาะแกนหลักอื่น ๆ ได้ |

Plugin ภายนอกไม่อยู่ภายใต้กฎลินต์เหล่านี้ แต่แนะนำให้ปฏิบัติตาม
รูปแบบเดียวกัน

## การกำหนดค่าการทดสอบ

OpenClaw ใช้ Vitest 4 พร้อมการรายงานความครอบคลุม V8 เพื่อให้ข้อมูล สำหรับการทดสอบ Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

หากการเรียกใช้ในเครื่องทำให้หน่วยความจำตึงตัว:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- ข้อตกลงการนำเข้า
- [Plugin ช่องทางของ SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin ช่องทาง
- [Plugin ผู้ให้บริการของ SDK](/th/plugins/sdk-provider-plugins) -- ฮุกของ Plugin ผู้ให้บริการ
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
