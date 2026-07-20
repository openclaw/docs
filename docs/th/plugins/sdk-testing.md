---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีสำหรับการทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่มาพร้อมกับระบบ
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-07-20T06:04:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c6c050826dae3cd2c794d50b2dd95e20e6533d838161cce037742ee5fdf7e0e
    source_path: plugins/sdk-testing.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับยูทิลิตี รูปแบบ และการบังคับใช้ lint ในการทดสอบ Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่ใช่ไหม** คู่มือวิธีใช้มีตัวอย่างการทดสอบที่ทำให้ดู:
  [การทดสอบ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีการทดสอบ

พาธย่อยเหล่านี้เป็นจุดเข้าซอร์สภายในรีโพสำหรับการทดสอบ Plugin ที่รวมมากับ OpenClaw
พาธเหล่านี้ไม่ได้เผยแพร่เป็น export ของ `package.json` สำหรับ
Plugin ของบุคคลที่สาม และอาจนำเข้า Vitest หรือการขึ้นต่อกันสำหรับการทดสอบอื่นๆ
ที่ใช้เฉพาะภายในรีโพ

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
import { isLiveTestEnabled } from "openclaw/plugin-sdk/test-live";
import { createRequestCaptureJsonFetch } from "openclaw/plugin-sdk/test-media-understanding";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

ใช้พาธย่อยเฉพาะเหล่านี้สำหรับการทดสอบ Plugin ที่รวมมาด้วย barrel
`openclaw/plugin-sdk/testing` เดิมใช้เฉพาะภายในรีโพ ไม่รวมอยู่ในแพ็กเกจ
ที่เผยแพร่ และถูกนำออกแล้ว alias `openclaw/plugin-sdk/test-utils`
เดิมถูกนำออกพร้อมกัน `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) ทำให้การทดสอบส่วนขยายใช้
พาธย่อยสำหรับการทดสอบเฉพาะที่ระบุไว้ข้างต้นต่อไป

### export ที่พร้อมใช้งาน

| การส่งออก                                               | วัตถุประสงค์                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้าง API จำลองขั้นต่ำสำหรับ Plugin เพื่อใช้ในการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญาโปรไฟล์การยืนยันตัวตนที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจำแนกประเภททางเลือกสำรองที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาของเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | ตรวจสอบรูปแบบบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีทดสอบสัญญาเพย์โหลดขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีทดสอบสัญญาการดำเนินการกับข้อความทั่วไปของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีทดสอบสัญญาการตั้งค่าช่องทางทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีทดสอบสัญญาสถานะช่องทางทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | ตรวจสอบ ID ไดเรกทอรีของช่องทางจากฟังก์ชันแสดงรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | ตรวจสอบว่าจุดเริ่มต้นของช่องทางที่รวมมาในชุดเปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบการประทับเวลาของเอนเวโลปให้กำหนดผลลัพธ์ได้แน่นอน นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | ตรวจสอบข้อความตอบกลับการจับคู่ช่องทางและแยกรหัสออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ของผู้ให้บริการหนึ่งรายการในการทดสอบเบื้องต้นของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | บันทึกประเภทผู้ให้บริการทั้งหมดจาก Plugin หนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | บันทึกการลงทะเบียนผู้ให้บริการจาก Plugin หลายรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | ตรวจสอบว่าคอลเลกชันผู้ให้บริการมี ID ที่กำหนด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin จำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | สร้างพื้นผิวรันไทม์ Plugin จำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | สร้างตัวแจ้งคำถามของวิซาร์ดการตั้งค่าแบบจำลอง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | สร้างสถานะขั้นตอนงานของรันไทม์ที่แยกออกจากกัน นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | เรียกใช้ฮุกแค็ตตาล็อกผู้ให้บริการพร้อมการขึ้นต่อกันสำหรับการทดสอบ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | แก้ไขตัวเลือกวิซาร์ดการตั้งค่าผู้ให้บริการในการทดสอบสัญญา นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | แก้ไขรายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | สร้าง ID ตัวเลือกวิซาร์ดผู้ให้บริการสำหรับการตรวจสอบ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | ฉีดผู้ให้บริการของวิซาร์ดผู้ให้บริการสำหรับการทดสอบแบบแยกส่วน นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ของตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | ตรวจสอบว่านโยบายการเล่นซ้ำของผู้ให้บริการส่งผ่านเครื่องมือและเมทาดาทาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | เรียกใช้การทดสอบผู้ให้บริการ STT แบบเรียลไทม์สดด้วยฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | ปรับเอาต์พุตบทถอดเสียงสดให้เป็นมาตรฐานก่อนการตรวจสอบแบบคลุมเครือ นำเข้าจาก `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | ตรวจสอบว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | ตรวจสอบว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบสนองงานวิดีโอที่เข้ากันได้กับ DashScope ซึ่งสำเร็จ นำเข้าจาก `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | เข้าถึงม็อก HTTP/การยืนยันตัวตนของผู้ให้บริการแบบเลือกใช้สำหรับ Vitest นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | รีเซ็ตม็อก HTTP/การยืนยันตัวตนของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการแก้ไขเป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มรีแอ็กชันตอบรับหรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | ลบรีแอ็กชันตอบรับหลังส่งการตอบกลับแล้ว นำเข้าจาก `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin เปล่า นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | บันทึกคำขอดึงข้อมูล JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-media-understanding`                                     |
| `isLiveTestEnabled`                                  | ควบคุมการทดสอบผู้ให้บริการสดแบบเลือกใช้ นำเข้าจาก `plugin-sdk/test-live`                                                                      |
| `collectProviderApiKeys`                             | ค้นหาข้อมูลประจำตัวสำหรับการทดสอบผู้ให้บริการสด นำเข้าจาก `plugin-sdk/test-live-auth`                                                    |
| `parseProviderModelMap`                              | แยกวิเคราะห์การแทนที่โมเดลสำหรับการทดสอบสดของเพลง/วิดีโอ นำเข้าจาก `plugin-sdk/test-media-generation`                                              |
| `withServer`                                         | เรียกใช้การทดสอบกับเซิร์ฟเวอร์ HTTP ภายในแบบใช้แล้วทิ้ง นำเข้าจาก `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | สร้างออบเจ็กต์คำขอ HTTP ขาเข้าขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | เรียกใช้การทดสอบการดึงข้อมูลโดยติดตั้งฮุกเชื่อมต่อล่วงหน้าไว้ นำเข้าจาก `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | แพตช์ตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์ทดสอบระบบไฟล์ที่แยกออกจากกัน นำเข้าจาก `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | สร้างม็อกการตอบสนองของเซิร์ฟเวอร์ HTTP ขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์การดึงข้อมูลการใช้งานของผู้ให้บริการ นำเข้าจาก `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | หยุดและคืนค่าตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | บันทึกเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | นำเข้าโมดูล ESM ด้วยโทเค็นคิวรีใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | แก้ไขพาธฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่รวมมาในชุด นำเข้าจาก `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | ติดตั้งม็อก Vitest แบบจำกัดสำหรับโมดูลในตัวของ Node นำเข้าจาก `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | สร้างบริบทการทดสอบแซนด์บ็อกซ์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ Skills นำเข้าจาก `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความบทถอดเสียงของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจสอบและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำความสะอาดเอาต์พุตเทอร์มินัลสำหรับการตรวจสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | ตรวจสอบรูปแบบเอาต์พุตของการแบ่งส่วน นำเข้าจาก `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | รักษาชนิดลิเทอรัลสำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดทดสอบสัญญาของ Plugin ที่รวมมาให้ยังใช้พาธย่อยสำหรับการทดสอบของ SDK เหล่านี้สำหรับ
ตัวช่วย fixture ของรีจิสทรี แมนิเฟสต์ อาร์ติแฟกต์สาธารณะ และรันไทม์ที่ใช้เฉพาะในการทดสอบ
ส่วนชุดทดสอบเฉพาะคอร์ที่ขึ้นกับรายการ OpenClaw ที่รวมมาให้จะยังคงอยู่ภายใต้
`src/plugins/contracts` แทน

### ชนิดข้อมูล

พาธย่อยสำหรับการทดสอบแบบเจาะจงยังส่งออกชนิดข้อมูลที่มีประโยชน์ในไฟล์ทดสอบอีกครั้งด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การทดสอบการแปลงเป้าหมาย

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การแปลงเป้าหมายของช่องทาง:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("การแปลงเป้าหมายของ my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // ตรรกะการแปลงเป้าหมายของช่องทาง
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // เพิ่มกรณีทดสอบเฉพาะช่องทาง
  it("ควรแปลงเป้าหมาย @username ได้", () => {
    // ...
  });
});
```

## รูปแบบการทดสอบ

### การทดสอบสัญญาการลงทะเบียน

การทดสอบหน่วยที่ส่งม็อก `api` ซึ่งเขียนขึ้นเองไปยัง `register(api)` จะไม่
ทดสอบเกตการยอมรับของตัวโหลด OpenClaw เพิ่มการทดสอบ smoke ที่ใช้ตัวโหลด
อย่างน้อยหนึ่งรายการสำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณต้องใช้ โดยเฉพาะ
ฮุกและความสามารถแบบเอกสิทธิ์ เช่น หน่วยความจำ

ตัวโหลดจริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อไม่มีข้อมูลเมตาที่จำเป็น หรือ
Plugin เรียก API ความสามารถที่ตนไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อฮุก และ
`api.registerMemoryCapability(...)` กำหนดให้แมนิเฟสต์ของ Plugin หรือรายการที่ส่งออก
ประกาศ `kind: "memory"`

### การทดสอบการเข้าถึงการกำหนดค่ารันไทม์

ควรใช้ม็อกรันไทม์ Plugin ที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/plugin-test-runtime` ตัวช่วยการกำหนดค่ารันไทม์ของม็อกนี้จำลอง
API สำหรับสแนปช็อตปัจจุบันและการแก้ไข

### การทดสอบหน่วยสำหรับ Plugin ช่องทาง

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("ควรแปลงบัญชีจากการกำหนดค่าได้", () => {
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

  it("ควรตรวจสอบบัญชีโดยไม่สร้างข้อมูลลับขึ้นจริง", () => {
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
  it("ควรแปลงโมเดลแบบไดนามิกได้", () => {
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

### การม็อกรันไทม์ Plugin

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้ม็อกรันไทม์ในการทดสอบ:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "ไม่ได้ตั้งค่ารันไทม์ทดสอบ",
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

### การทดสอบด้วย stub แยกตามอินสแตนซ์

ควรใช้ stub แยกตามอินสแตนซ์แทนการแก้ไขโปรโตไทป์:

```typescript
// แนะนำ: stub แยกตามอินสแตนซ์
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// หลีกเลี่ยง: การแก้ไขโปรโตไทป์
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ภายในรีโพ)

Plugin ที่รวมมาให้มีการทดสอบสัญญาซึ่งตรวจสอบความเป็นเจ้าของการลงทะเบียน:

```bash
pnpm test src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยัน:

- Plugin ใดลงทะเบียนผู้ให้บริการใด
- Plugin ใดลงทะเบียนผู้ให้บริการเสียงพูดใด
- ความถูกต้องของรูปแบบการลงทะเบียน
- การปฏิบัติตามสัญญารันไทม์

### การเรียกใช้การทดสอบแบบกำหนดขอบเขต

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

## การบังคับใช้ lint (Plugin ภายในรีโพ)

`scripts/run-additional-boundary-checks.mjs` เรียกใช้ชุดการตรวจสอบขอบเขตการนำเข้า
`lint:plugins:*` ใน CI โดยแต่ละรายการสามารถเรียกใช้แยกกันในเครื่องได้เช่นกัน:

| คำสั่ง                                                        | สิ่งที่บังคับใช้                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Plugin ที่รวมมาให้ไม่สามารถนำเข้า root barrel แบบรวมศูนย์ `openclaw/plugin-sdk` ได้              |
| `pnpm run lint:plugins:no-extension-src-imports`               | ไฟล์ส่วนขยายสำหรับโปรดักชันไม่สามารถนำเข้าทรี `src/**` ของรีโพโดยตรงได้ (`../../src/...`)  |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | ไฟล์ทดสอบส่วนขยายไม่สามารถนำเข้า alias การทดสอบ SDK ที่ถูกนำออกแล้ว หรือตัวช่วยทดสอบอื่นที่ใช้เฉพาะคอร์ได้ |

Plugin ภายนอกไม่อยู่ภายใต้กฎ lint เหล่านี้ แต่แนะนำให้ปฏิบัติตาม
รูปแบบเดียวกัน

## การกำหนดค่าการทดสอบ

OpenClaw ใช้ Vitest 4 พร้อมการรายงานความครอบคลุมของ V8 เพื่อให้ข้อมูล สำหรับการทดสอบ Plugin:

```bash
# เรียกใช้การทดสอบทั้งหมด
pnpm test

# เรียกใช้การทดสอบ Plugin ที่ระบุ
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# เรียกใช้ด้วยตัวกรองชื่อการทดสอบที่ระบุ
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# เรียกใช้พร้อมการวัดความครอบคลุม
pnpm test:coverage
```

หากการเรียกใช้ในเครื่องทำให้หน่วยความจำตึงตัว:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- รูปแบบการนำเข้า
- [Plugin ช่องทางสำหรับ SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin ช่องทาง
- [Plugin ผู้ให้บริการสำหรับ SDK](/th/plugins/sdk-provider-plugins) -- ฮุกของ Plugin ผู้ให้บริการ
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
