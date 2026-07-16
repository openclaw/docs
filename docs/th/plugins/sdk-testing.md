---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีสำหรับการทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่มาพร้อมระบบ
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-07-16T19:30:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับยูทิลิตี รูปแบบ และการบังคับใช้ lint ในการทดสอบ Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่หรือไม่** คู่มือวิธีใช้งานมีตัวอย่างการทดสอบที่แสดงขั้นตอนครบถ้วน:
  [การทดสอบ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีสำหรับการทดสอบ

พาธย่อยเหล่านี้เป็นจุดเข้าใช้งานซอร์สภายในรีโพสำหรับการทดสอบ Plugin ที่รวมมากับ OpenClaw
พาธเหล่านี้ไม่ใช่ export `package.json` ที่เผยแพร่สำหรับ Plugin
ของบุคคลที่สาม และอาจ import Vitest หรือ dependency สำหรับการทดสอบอื่นๆ ที่ใช้เฉพาะภายในรีโพ

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

ใช้พาธย่อยเฉพาะเหล่านี้สำหรับการทดสอบ Plugin ที่รวมมาให้ ส่วน barrel
`openclaw/plugin-sdk/testing` เดิมใช้เฉพาะภายในรีโพ ถูกแยกออกจากแพ็กเกจ
ที่จัดส่ง และถูกนำออกแล้ว alias รุ่นเก่า `openclaw/plugin-sdk/test-utils`
ยังคงใช้เฉพาะภายในรีโพ ส่วน `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) จะปฏิเสธ import ใหม่ของ alias ดังกล่าว
ในการทดสอบส่วนขยาย

### export ที่พร้อมใช้งาน

| รายการส่งออก                                               | วัตถุประสงค์                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้าง API จำลองขั้นต่ำสำหรับ Plugin เพื่อใช้ในการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญาโปรไฟล์การยืนยันตัวตนที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจำแนกประเภททางเลือกสำรองที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาของเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | ตรวจสอบรูปแบบบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีทดสอบสัญญาเพย์โหลดขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีทดสอบสัญญาการดำเนินการกับข้อความช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีทดสอบสัญญาการตั้งค่าช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีทดสอบสัญญาสถานะช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | ตรวจสอบ ID ไดเรกทอรีช่องทางจากฟังก์ชันแสดงรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | ตรวจสอบว่าจุดเข้าใช้งานของช่องทางที่รวมมาในชุดเปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบการประทับเวลาของเอนเวโลปให้คงที่แน่นอน นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | ตรวจสอบข้อความตอบกลับการจับคู่ช่องทางและแยกรหัสออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งรายการในการทดสอบเบื้องต้นของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | บันทึกผู้ให้บริการทุกชนิดจาก Plugin หนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | บันทึกการลงทะเบียนผู้ให้บริการจาก Plugin หลายรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | ตรวจสอบว่าคอลเลกชันผู้ให้บริการมี ID ที่ระบุ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin จำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | สร้างพื้นผิวรันไทม์ Plugin จำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | สร้างตัวแจ้งคำถามของตัวช่วยตั้งค่าแบบจำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | สร้างสถานะ TaskFlow ของรันไทม์ที่แยกออกจากกัน นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | เรียกใช้ฮุกแคตตาล็อกผู้ให้บริการด้วยการขึ้นต่อกันสำหรับการทดสอบ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | แก้ไขตัวเลือกตัวช่วยตั้งค่าผู้ให้บริการในการทดสอบสัญญา นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | แก้ไขรายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | สร้าง ID ตัวเลือกของตัวช่วยผู้ให้บริการสำหรับการตรวจสอบ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | แทรกผู้ให้บริการของตัวช่วยผู้ให้บริการสำหรับการทดสอบแบบแยกส่วน นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ของตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | ตรวจสอบว่านโยบายการเล่นซ้ำของผู้ให้บริการส่งผ่านเครื่องมือและข้อมูลเมตาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | เรียกใช้การทดสอบผู้ให้บริการ STT แบบเรียลไทม์จริงด้วยฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | ปรับเอาต์พุตข้อความถอดเสียงจริงให้เป็นมาตรฐานก่อนการตรวจสอบแบบคลุมเครือ นำเข้าจาก `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | ตรวจสอบว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างไว้อย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | ตรวจสอบว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขไว้อย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่เข้ากันได้กับ DashScope และสำเร็จ นำเข้าจาก `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | เข้าถึงม็อก Vitest สำหรับ HTTP/การยืนยันตัวตนของผู้ให้บริการแบบเลือกใช้ นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | รีเซ็ตม็อก HTTP/การยืนยันตัวตนของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการแก้ไขเป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มรีแอ็กชันตอบรับหรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | ลบรีแอ็กชันตอบรับหลังส่งคำตอบแล้ว นำเข้าจาก `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ว่าง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | บันทึกคำขอ fetch แบบ JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                     |
| `withServer`                                         | เรียกใช้การทดสอบกับเซิร์ฟเวอร์ HTTP ภายในเครื่องแบบใช้แล้วทิ้ง นำเข้าจาก `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | สร้างออบเจ็กต์คำขอ HTTP ขาเข้าขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | เรียกใช้การทดสอบ fetch โดยติดตั้งฮุก preconnect แล้ว นำเข้าจาก `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | แก้ไขตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์ทดสอบระบบไฟล์ที่แยกออกจากกัน นำเข้าจาก `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | สร้างม็อกการตอบกลับเซิร์ฟเวอร์ HTTP ขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์ fetch การใช้งานของผู้ให้บริการ นำเข้าจาก `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | หยุดและคืนค่าตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | บันทึกเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | นำเข้าโมดูล ESM ด้วยโทเค็นคิวรีใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | แก้ไขพาธฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่รวมมาในชุด นำเข้าจาก `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | ติดตั้งม็อก Vitest แบบจำกัดสำหรับโมดูลในตัวของ Node นำเข้าจาก `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบแซนด์บ็อกซ์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ Skills นำเข้าจาก `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความทรานสคริปต์ของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจสอบและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำความสะอาดเอาต์พุตเทอร์มินัลสำหรับการตรวจสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | ตรวจสอบรูปแบบเอาต์พุตการแบ่งส่วน นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | รักษาชนิดลิเทอรัลสำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดทดสอบสัญญาของ Plugin ที่รวมมาในชุดยังใช้พาธย่อยสำหรับการทดสอบ SDK เหล่านี้สำหรับ
ตัวช่วยฟิกซ์เจอร์รีจิสทรี แมนิเฟสต์ อาร์ติแฟกต์สาธารณะ และรันไทม์ที่ใช้เฉพาะในการทดสอบ
ส่วนชุดทดสอบเฉพาะแกนหลักที่ขึ้นกับรายการคงคลัง OpenClaw ที่รวมมาในชุดจะยังคงอยู่ภายใต้
`src/plugins/contracts` แทน

### ชนิดข้อมูล

ซับพาธสำหรับการทดสอบแบบเจาะจงยังส่งออกชนิดข้อมูลที่มีประโยชน์ในไฟล์ทดสอบอีกครั้งด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การทดสอบการแก้ไขเป้าหมาย

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การแก้ไขเป้าหมายของช่องทาง:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("การแก้ไขเป้าหมายของ my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // ตรรกะการแก้ไขเป้าหมายของช่องทางของคุณ
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // เพิ่มกรณีทดสอบเฉพาะช่องทาง
  it("ควรแก้ไขเป้าหมาย @username ได้", () => {
    // ...
  });
});
```

## รูปแบบการทดสอบ

### การทดสอบสัญญาการลงทะเบียน

การทดสอบหน่วยที่ส่งม็อก `api` ซึ่งเขียนขึ้นเองไปยัง `register(api)` จะไม่
ทดสอบเกตการยอมรับของตัวโหลด OpenClaw ให้เพิ่มการทดสอบควัน
ที่รองรับด้วยตัวโหลดอย่างน้อยหนึ่งรายการสำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณต้องพึ่งพา โดยเฉพาะ
ฮุกและความสามารถแบบเอกสิทธิ์ เช่น หน่วยความจำ

ตัวโหลดจริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อเมทาดาทาที่จำเป็นขาดหายไป หรือ
Plugin เรียก API ความสามารถที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อฮุก และ
`api.registerMemoryCapability(...)` กำหนดให้แมนิเฟสต์ของ Plugin หรือเอนทรี
ที่ส่งออกต้องประกาศ `kind: "memory"`

### การทดสอบการเข้าถึงการกำหนดค่ารันไทม์

ควรใช้ม็อกรันไทม์ Plugin ที่ใช้ร่วมกันจาก `openclaw/plugin-sdk/plugin-test-runtime`
ม็อก `runtime.config.loadConfig()` และ `runtime.config.writeConfigFile(...)`
ของม็อกดังกล่าวจะส่งข้อผิดพลาดตามค่าเริ่มต้น เพื่อให้การทดสอบตรวจพบการใช้งาน API
ความเข้ากันได้ที่เลิกใช้แล้วรายการใหม่ ให้เขียนทับม็อกเหล่านั้นเฉพาะเมื่อการทดสอบครอบคลุม
พฤติกรรมความเข้ากันได้แบบเดิมอย่างชัดเจนเท่านั้น

### การทดสอบหน่วยสำหรับ Plugin ช่องทาง

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("ควรแก้ไขบัญชีจากการกำหนดค่าได้", () => {
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

  it("ควรตรวจสอบบัญชีโดยไม่ทำให้ข้อมูลลับปรากฏเป็นค่าจริง", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // ไม่มีการเปิดเผยค่าโทเค็น
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### การทดสอบหน่วยสำหรับ Plugin ผู้ให้บริการ

```typescript
import { describe, it, expect } from "vitest";

describe("Plugin my-provider", () => {
  it("ควรแก้ไขโมเดลแบบไดนามิกได้", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... บริบท
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("ควรส่งคืนแค็ตตาล็อกเมื่อมีคีย์ API", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... บริบท
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### การจำลองรันไทม์ของ Plugin

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้จำลองรันไทม์ในการทดสอบ:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "ไม่ได้ตั้งค่ารันไทม์สำหรับการทดสอบ",
});

// ในการตั้งค่าการทดสอบ
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... ม็อกอื่นๆ
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... เนมสเปซอื่นๆ
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// หลังการทดสอบ
store.clearRuntime();
```

### การทดสอบด้วยสตับต่ออินสแตนซ์

ควรใช้สตับต่ออินสแตนซ์แทนการแก้ไขโพรโทไทป์:

```typescript
// แนะนำ: สตับต่ออินสแตนซ์
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// หลีกเลี่ยง: การแก้ไขโพรโทไทป์
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ภายในรีโพ)

Plugin ที่รวมมากับระบบมีการทดสอบสัญญาเพื่อยืนยันความเป็นเจ้าของการลงทะเบียน:

```bash
pnpm test src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยัน:

- Plugin ใดลงทะเบียนผู้ให้บริการใด
- Plugin ใดลงทะเบียนผู้ให้บริการเสียงพูดใด
- ความถูกต้องของรูปแบบการลงทะเบียน
- การปฏิบัติตามสัญญารันไทม์

### การเรียกใช้การทดสอบเฉพาะขอบเขต

สำหรับ Plugin ที่ระบุ:

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
`lint:plugins:*` ใน CI โดยแต่ละรายการสามารถเรียกใช้แยกกันภายในเครื่องได้เช่นกัน:

| คำสั่ง                                                        | บังคับใช้                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugin ที่รวมมากับระบบไม่สามารถนำเข้าบาร์เรลราก `openclaw/plugin-sdk` แบบโมโนลิทิกได้             |
| `pnpm run lint:plugins:no-extension-src-imports`               | ไฟล์ส่วนขยายสำหรับการใช้งานจริงไม่สามารถนำเข้าทรี `src/**` ของรีโพโดยตรงได้ (`../../src/...`) |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | ไฟล์ทดสอบส่วนขยายไม่สามารถนำเข้า `plugin-sdk/test-utils` หรือตัวช่วยทดสอบอื่นที่ใช้ได้เฉพาะในแกนหลัก |

Plugin ภายนอกไม่อยู่ภายใต้กฎลินต์เหล่านี้ แต่แนะนำให้ปฏิบัติตาม
รูปแบบเดียวกัน

## การกำหนดค่าการทดสอบ

OpenClaw ใช้ Vitest 4 พร้อมการรายงานความครอบคลุม V8 เพื่อให้ข้อมูล สำหรับการทดสอบ Plugin:

```bash
# เรียกใช้การทดสอบทั้งหมด
pnpm test

# เรียกใช้การทดสอบ Plugin ที่ระบุ
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# เรียกใช้ด้วยตัวกรองชื่อการทดสอบที่ระบุ
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# เรียกใช้พร้อมรายงานความครอบคลุม
pnpm test:coverage
```

หากการเรียกใช้ภายในเครื่องทำให้หน่วยความจำมีภาระสูง:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- ข้อตกลงการนำเข้า
- [Plugin ช่องทาง SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin ช่องทาง
- [Plugin ผู้ให้บริการ SDK](/th/plugins/sdk-provider-plugins) -- ฮุกของ Plugin ผู้ให้บริการ
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
