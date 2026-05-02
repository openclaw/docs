---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องใช้ยูทิลิตีสำหรับการทดสอบจาก SDK ของ Plugin
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ Plugin ที่รวมมาให้
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับยูทิลิตี้ทดสอบ รูปแบบ และการบังคับใช้ lint สำหรับ Plugin ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่ใช่ไหม?** คู่มือวิธีใช้มีตัวอย่างการทดสอบที่ทำไว้ให้แล้ว:
  [การทดสอบ Plugin ช่องทาง](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตี้ทดสอบ

**การนำเข้า mock ของ Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**การนำเข้าสัญญารันไทม์ของ Agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**การนำเข้าสัญญาช่องทาง:** `openclaw/plugin-sdk/channel-contract-testing`

**การนำเข้าตัวช่วยทดสอบช่องทาง:** `openclaw/plugin-sdk/channel-test-helpers`

**การนำเข้าการทดสอบเป้าหมายช่องทาง:** `openclaw/plugin-sdk/channel-target-testing`

**การนำเข้าสัญญา Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**การนำเข้าการทดสอบรันไทม์ Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**การนำเข้าสัญญาผู้ให้บริการ:** `openclaw/plugin-sdk/provider-test-contracts`

**การนำเข้า mock HTTP ของผู้ให้บริการ:** `openclaw/plugin-sdk/provider-http-test-mocks`

**การนำเข้าการทดสอบสภาพแวดล้อม/เครือข่าย:** `openclaw/plugin-sdk/test-env`

**การนำเข้า fixture ทั่วไป:** `openclaw/plugin-sdk/test-fixtures`

**การนำเข้า mock บิวท์อินของ Node:** `openclaw/plugin-sdk/test-node-mocks`

ควรใช้พาธย่อยแบบเจาะจงด้านล่างสำหรับการทดสอบ Plugin ใหม่ barrel กว้าง
`openclaw/plugin-sdk/testing` มีไว้สำหรับความเข้ากันได้แบบเดิมเท่านั้น
กฎป้องกันของ repo จะปฏิเสธการนำเข้าจริงใหม่จาก `plugin-sdk/testing` และ
`plugin-sdk/test-utils`; ชื่อเหล่านั้นยังคงอยู่เฉพาะในฐานะพื้นผิวความเข้ากันได้
ที่เลิกใช้แล้วสำหรับ Plugin ภายนอกและการทดสอบบันทึกความเข้ากันได้

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

### การส่งออกที่พร้อมใช้งาน

| การส่งออก                                           | วัตถุประสงค์                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | สร้างม็อก API ของ Plugin ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียนโดยตรง นำเข้าจาก `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ฟิกซ์เจอร์สัญญาโปรไฟล์การตรวจสอบสิทธิ์ที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ฟิกซ์เจอร์สัญญาการระงับการส่งมอบที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ฟิกซ์เจอร์สัญญาการจัดประเภทการสำรองที่ใช้ร่วมกันสำหรับอะแดปเตอร์รันไทม์ของเอเจนต์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | สร้างฟิกซ์เจอร์สคีมาเครื่องมือแบบไดนามิกสำหรับการทดสอบสัญญารันไทม์แบบเนทีฟ นำเข้าจาก `plugin-sdk/agent-runtime-test-contracts`          |
| `expectChannelInboundContextContract`                | ตรวจยืนยันรูปแบบบริบทขาเข้าของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | ติดตั้งกรณีสัญญาเพย์โหลดขาออกของช่องทาง นำเข้าจาก `plugin-sdk/channel-contract-testing`                                                |
| `createStartAccountContext`                          | สร้างบริบทวงจรชีวิตบัญชีของช่องทาง นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                          |
| `installChannelActionsContractSuite`                 | ติดตั้งกรณีสัญญาการกระทำกับข้อความของช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                      |
| `installChannelSetupContractSuite`                   | ติดตั้งกรณีสัญญาการตั้งค่าช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                 |
| `installChannelStatusContractSuite`                  | ติดตั้งกรณีสัญญาสถานะช่องทางแบบทั่วไป นำเข้าจาก `plugin-sdk/channel-test-helpers`                                                      |
| `expectDirectoryIds`                                 | ตรวจยืนยันรหัสไดเรกทอรีของช่องทางจากฟังก์ชันรายการไดเรกทอรี นำเข้าจาก `plugin-sdk/channel-test-helpers`                              |
| `assertBundledChannelEntries`                        | ตรวจยืนยันว่าจุดเข้าใช้งานของช่องทางที่รวมมาเปิดเผยสัญญาสาธารณะที่คาดไว้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                 |
| `formatEnvelopeTimestamp`                            | จัดรูปแบบเวลาประทับของซองข้อมูลแบบกำหนดซ้ำได้ นำเข้าจาก `plugin-sdk/channel-test-helpers`                                             |
| `expectPairingReplyText`                             | ตรวจยืนยันข้อความตอบกลับการจับคู่ของช่องทางและดึงโค้ดออกมา นำเข้าจาก `plugin-sdk/channel-test-helpers`                               |
| `describePluginRegistrationContract`                 | ติดตั้งการตรวจสอบสัญญาการลงทะเบียน Plugin นำเข้าจาก `plugin-sdk/plugin-test-contracts`                                                 |
| `registerSingleProviderPlugin`                       | ลงทะเบียน Plugin ผู้ให้บริการหนึ่งรายการในการทดสอบ smoke ของตัวโหลด นำเข้าจาก `plugin-sdk/plugin-test-runtime`                       |
| `registerProviderPlugin`                             | จับชนิดผู้ให้บริการทั้งหมดจาก Plugin หนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `registerProviderPlugins`                            | จับการลงทะเบียนผู้ให้บริการจากหลาย Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                   |
| `requireRegisteredProvider`                          | ตรวจยืนยันว่าคอลเลกชันผู้ให้บริการมีรหัสหนึ่งรายการ นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                        |
| `createRuntimeEnv`                                   | สร้างสภาพแวดล้อมรันไทม์ CLI/Plugin แบบม็อก นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                                  |
| `createPluginSetupWizardStatus`                      | สร้างตัวช่วยสถานะการตั้งค่าสำหรับ Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime`                                           |
| `describeOpenAIProviderRuntimeContract`              | ติดตั้งการตรวจสอบสัญญารันไทม์ตระกูลผู้ให้บริการ นำเข้าจาก `plugin-sdk/provider-test-contracts`                                       |
| `expectPassthroughReplayPolicy`                      | ตรวจยืนยันว่านโยบายการเล่นซ้ำของผู้ให้บริการส่งผ่านเครื่องมือและเมทาดาทาที่ผู้ให้บริการเป็นเจ้าของ นำเข้าจาก `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | เรียกใช้การทดสอบสดของผู้ให้บริการ STT แบบเรียลไทม์พร้อมฟิกซ์เจอร์เสียงที่ใช้ร่วมกัน นำเข้าจาก `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | ปรับผลลัพธ์ถอดเสียงสดให้เป็นรูปแบบมาตรฐานก่อนการตรวจยืนยันแบบ fuzzy นำเข้าจาก `plugin-sdk/provider-test-contracts`                 |
| `expectExplicitVideoGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการวิดีโอประกาศความสามารถของโหมดการสร้างอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`           |
| `expectExplicitMusicGenerationCapabilities`          | ตรวจยืนยันว่าผู้ให้บริการเพลงประกาศความสามารถในการสร้าง/แก้ไขอย่างชัดเจน นำเข้าจาก `plugin-sdk/provider-test-contracts`             |
| `mockSuccessfulDashscopeVideoTask`                   | ติดตั้งการตอบกลับงานวิดีโอที่สำเร็จและเข้ากันได้กับ DashScope นำเข้าจาก `plugin-sdk/provider-test-contracts`                        |
| `getProviderHttpMocks`                               | เข้าถึงม็อก HTTP/การตรวจสอบสิทธิ์ของผู้ให้บริการสำหรับ Vitest แบบเลือกใช้ นำเข้าจาก `plugin-sdk/provider-http-test-mocks`            |
| `installProviderHttpMockCleanup`                     | รีเซ็ตม็อก HTTP/การตรวจสอบสิทธิ์ของผู้ให้บริการหลังการทดสอบแต่ละครั้ง นำเข้าจาก `plugin-sdk/provider-http-test-mocks`               |
| `installCommonResolveTargetErrorCases`               | กรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการระบุเป้าหมาย นำเข้าจาก `plugin-sdk/channel-target-testing`                      |
| `shouldAckReaction`                                  | ตรวจสอบว่าช่องทางควรเพิ่มรีแอ็กชันตอบรับหรือไม่ นำเข้าจาก `plugin-sdk/channel-feedback`                                               |
| `removeAckReactionAfterReply`                        | ลบรีแอ็กชันตอบรับหลังการส่งมอบการตอบกลับ นำเข้าจาก `plugin-sdk/channel-feedback`                                                       |
| `createTestRegistry`                                 | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ช่องทาง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`             |
| `createEmptyPluginRegistry`                          | สร้างฟิกซ์เจอร์รีจิสทรี Plugin ว่าง นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | ติดตั้งฟิกซ์เจอร์รีจิสทรีสำหรับการทดสอบรันไทม์ของ Plugin นำเข้าจาก `plugin-sdk/plugin-test-runtime` หรือ `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | จับคำขอ fetch แบบ JSON ในการทดสอบตัวช่วยสื่อ นำเข้าจาก `plugin-sdk/test-env`                                                          |
| `withServer`                                         | เรียกใช้การทดสอบกับเซิร์ฟเวอร์ HTTP ภายในแบบใช้แล้วทิ้ง นำเข้าจาก `plugin-sdk/test-env`                                              |
| `createMockIncomingRequest`                          | สร้างอ็อบเจกต์คำขอ HTTP ขาเข้าขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                                 |
| `withFetchPreconnect`                                | เรียกใช้การทดสอบ fetch โดยติดตั้งฮุก preconnect ไว้ นำเข้าจาก `plugin-sdk/test-env`                                                   |
| `withEnv` / `withEnvAsync`                           | แพตช์ตัวแปรสภาพแวดล้อมชั่วคราว นำเข้าจาก `plugin-sdk/test-env`                                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | สร้างฟิกซ์เจอร์ทดสอบระบบไฟล์แบบแยก นำเข้าจาก `plugin-sdk/test-env`                                                                    |
| `createMockServerResponse`                           | สร้างม็อกการตอบกลับเซิร์ฟเวอร์ HTTP ขั้นต่ำ นำเข้าจาก `plugin-sdk/test-env`                                                           |
| `createCliRuntimeCapture`                            | จับเอาต์พุตรันไทม์ CLI ในการทดสอบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                |
| `importFreshModule`                                  | นำเข้าโมดูล ESM พร้อมโทเค็นคิวรีใหม่เพื่อข้ามแคชโมดูล นำเข้าจาก `plugin-sdk/test-fixtures`                                           |
| `bundledPluginRoot` / `bundledPluginFile`            | ระบุพาธฟิกซ์เจอร์ซอร์สหรือ dist ของ Plugin ที่รวมมา นำเข้าจาก `plugin-sdk/test-fixtures`                                             |
| `mockNodeBuiltinModule`                              | ติดตั้งม็อก Vitest แบบแคบสำหรับโมดูลในตัวของ Node นำเข้าจาก `plugin-sdk/test-node-mocks`                                              |
| `createSandboxTestContext`                           | สร้างบริบททดสอบแซนด์บ็อกซ์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                                       |
| `writeSkill`                                         | เขียนฟิกซ์เจอร์ Skills นำเข้าจาก `plugin-sdk/test-fixtures`                                                                            |
| `makeAgentAssistantMessage`                          | สร้างฟิกซ์เจอร์ข้อความทรานสคริปต์ของเอเจนต์ นำเข้าจาก `plugin-sdk/test-fixtures`                                                     |
| `peekSystemEvents` / `resetSystemEventsForTest`      | ตรวจดูและรีเซ็ตฟิกซ์เจอร์เหตุการณ์ระบบ นำเข้าจาก `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | ทำความสะอาดเอาต์พุตเทอร์มินัลสำหรับการตรวจยืนยัน นำเข้าจาก `plugin-sdk/test-fixtures`                                                |
| `countLines` / `hasBalancedFences`                   | ตรวจยืนยันรูปแบบเอาต์พุตการแบ่งชิ้น นำเข้าจาก `plugin-sdk/test-fixtures`                                                             |
| `runProviderCatalog`                                 | ดำเนินการฮุกแค็ตตาล็อกผู้ให้บริการพร้อมดีเพนเดนซีสำหรับการทดสอบ                                                                       |
| `resolveProviderWizardOptions`                       | ระบุตัวเลือกวิซาร์ดการตั้งค่าผู้ให้บริการในการทดสอบสัญญา                                                                              |
| `resolveProviderModelPickerEntries`                  | ระบุรายการตัวเลือกโมเดลของผู้ให้บริการในการทดสอบสัญญา                                                                                  |
| `buildProviderPluginMethodChoice`                    | สร้างรหัสตัวเลือกวิซาร์ดผู้ให้บริการสำหรับการตรวจยืนยัน                                                                                |
| `setProviderWizardProvidersResolverForTest`          | ฉีดผู้ให้บริการของวิซาร์ดผู้ให้บริการสำหรับการทดสอบแบบแยก                                                                              |
| `createProviderUsageFetch`                           | สร้างฟิกซ์เจอร์สำหรับการดึงข้อมูลการใช้งานของผู้ให้บริการ                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | หยุดและกู้คืนตัวจับเวลาสำหรับการทดสอบที่ไวต่อเวลา นำเข้าจาก `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | สร้างตัวพร้อมต์ของตัวช่วยตั้งค่าแบบจำลอง                                                                                                     |
| `createRuntimeTaskFlow`                              | สร้างสถานะ task-flow ของรันไทม์แบบแยกโดดเดี่ยว                                                                                                  |
| `typedCases`                                         | รักษาประเภทลิเทอรัลสำหรับการทดสอบแบบขับเคลื่อนด้วยตาราง นำเข้าจาก `plugin-sdk/test-fixtures`                                                    |

ชุดทดสอบสัญญาของ bundled Plugin ยังใช้พาธย่อยการทดสอบของ SDK สำหรับตัวช่วย fixture แบบใช้เฉพาะในการทดสอบสำหรับ
registry, manifest, public-artifact และ runtime ด้วย ชุดทดสอบที่เป็น core-only
ซึ่งพึ่งพา inventory ของ OpenClaw ที่ bundled ไว้จะยังอยู่ภายใต้ `src/plugins/contracts`
ให้วางการทดสอบ extension ใหม่ไว้บนพาธย่อย SDK ที่เน้นเฉพาะและมีเอกสารกำกับ เช่น
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทนการ import
compatibility barrel กว้าง ๆ อย่าง `plugin-sdk/testing`, ไฟล์ `src/**` ของ repo หรือ bridge
`test/helpers/*` ของ repo โดยตรง

### ชนิดข้อมูล

พาธย่อยการทดสอบที่เน้นเฉพาะยัง re-export ชนิดข้อมูลที่มีประโยชน์ในไฟล์ทดสอบด้วย:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## การทดสอบการ resolve เป้าหมาย

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การ resolve เป้าหมายของแชนเนล:

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

Unit test ที่ส่ง mock `api` ที่เขียนเองให้กับ `register(api)` จะไม่ได้ทดสอบ
ด่านยอมรับของ loader ของ OpenClaw เพิ่ม smoke test ที่มี loader รองรับอย่างน้อยหนึ่งรายการ
สำหรับแต่ละพื้นผิวการลงทะเบียนที่ Plugin ของคุณพึ่งพา โดยเฉพาะ hook และ
ความสามารถแบบ exclusive เช่น memory

loader จริงจะทำให้การลงทะเบียน Plugin ล้มเหลวเมื่อ metadata ที่จำเป็นขาดหายไป หรือเมื่อ
Plugin เรียก capability API ที่ตนเองไม่ได้เป็นเจ้าของ ตัวอย่างเช่น
`api.registerHook(...)` ต้องมีชื่อ hook และ
`api.registerMemoryCapability(...)` ต้องให้ manifest ของ Plugin หรือ entry
ที่ export ออกมาประกาศ `kind: "memory"`

### การทดสอบการเข้าถึง config ของ runtime

ควรใช้ mock runtime ของ Plugin แบบใช้ร่วมกันจาก `openclaw/plugin-sdk/channel-test-helpers`
เมื่อทดสอบ Plugin แชนเนลที่ bundled ไว้ mock `runtime.config.loadConfig()` และ
`runtime.config.writeConfigFile(...)` ที่ deprecated จะ throw ตามค่าเริ่มต้น เพื่อให้การทดสอบตรวจพบ
การใช้งาน compatibility API ใหม่ ให้ override mock เหล่านั้นเฉพาะเมื่อการทดสอบ
ครอบคลุมพฤติกรรมความเข้ากันได้แบบ legacy อย่างชัดเจน

### การทดสอบ unit ของ Plugin แชนเนล

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

### การทดสอบ unit ของ Provider Plugin

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

### การทดสอบด้วย stub ต่ออินสแตนซ์

ควรใช้ stub ต่ออินสแตนซ์แทนการ mutate prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ใน repo)

Plugin ที่ bundled ไว้มี contract test ที่ตรวจสอบความเป็นเจ้าของการลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยันว่า:

- Plugin ใดลงทะเบียน provider ใด
- Plugin ใดลงทะเบียน speech provider ใด
- ความถูกต้องของรูปทรงการลงทะเบียน
- การปฏิบัติตามสัญญาของ runtime

### การรันการทดสอบแบบ scoped

สำหรับ Plugin เฉพาะ:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

สำหรับ contract test เท่านั้น:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## การบังคับใช้ lint (Plugin ใน repo)

มีกฎสามข้อที่ `pnpm check` บังคับใช้กับ Plugin ใน repo:

1. **ห้าม import จาก root แบบ monolithic** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้าม import `src/` โดยตรง** -- Plugin ไม่สามารถ import `../../src/` โดยตรงได้
3. **ห้าม self-import** -- Plugin ไม่สามารถ import พาธย่อย `plugin-sdk/<name>` ของตนเองได้

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

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- แบบแผนการ import
- [Plugin แชนเนลของ SDK](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซ Plugin แชนเนล
- [Provider Plugin ของ SDK](/th/plugins/sdk-provider-plugins) -- hook ของ Provider Plugin
- [การสร้าง Plugin](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
