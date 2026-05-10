---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้ใช้สถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK ของ Plugin สมัยใหม่
title: การย้ายไปใช้ Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:51:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้าง ไปสู่สถาปัตยกรรม Plugin
สมัยใหม่ที่มี import แบบเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณสร้างขึ้นก่อน
สถาปัตยกรรมใหม่ คู่มือนี้จะช่วยให้คุณย้ายระบบได้

## สิ่งที่กำลังเปลี่ยนแปลง

ระบบ Plugin แบบเก่าให้พื้นผิวแบบเปิดกว้างสองส่วน ซึ่งทำให้ Plugin สามารถ import
ทุกสิ่งที่ต้องใช้จากจุดเข้าเดียวได้:

- **`openclaw/plugin-sdk/compat`** - import เดียวที่ re-export ตัวช่วยหลายสิบรายการ
  ถูกเพิ่มเข้ามาเพื่อให้ Plugin รุ่นเก่าที่อิง hook ยังทำงานได้ระหว่างที่
  สถาปัตยกรรม Plugin ใหม่กำลังถูกสร้าง
- **`openclaw/plugin-sdk/infra-runtime`** - barrel ตัวช่วย runtime แบบกว้างที่
  รวม event ของระบบ, สถานะ Heartbeat, คิวการส่งมอบ, ตัวช่วย fetch/proxy,
  ตัวช่วยไฟล์, ประเภทการอนุมัติ และยูทิลิตีที่ไม่เกี่ยวข้องไว้ด้วยกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel ความเข้ากันได้ของ config แบบกว้าง
  ที่ยังคงมีตัวช่วย load/write โดยตรงที่เลิกใช้แล้วระหว่างช่วง migration
- **`openclaw/extension-api`** - bridge ที่ให้ Plugin เข้าถึงตัวช่วยฝั่ง host
  ได้โดยตรง เช่น embedded agent runner
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ของ bundled extension
  เฉพาะ Pi ที่ถูกนำออกแล้ว ซึ่งเคยสังเกต event ของ embedded-runner เช่น
  `tool_result` ได้

พื้นผิว import แบบกว้างเหล่านี้ตอนนี้ **เลิกใช้แล้ว** ยังทำงานได้ที่ runtime
แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายออกก่อน release major
ถัดไปจะนำออก API สำหรับลงทะเบียน embedded extension factory เฉพาะ Pi
ถูกนำออกแล้ว; ให้ใช้ tool-result middleware แทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน change เดียวกับ
ที่เพิ่มสิ่งทดแทน การเปลี่ยนแปลง contract ที่ทำให้ใช้งานร่วมกันไม่ได้ต้องผ่าน
compatibility adapter, diagnostics, เอกสาร และช่วง deprecation ก่อน
หลักการนี้ใช้กับ SDK imports, manifest fields, setup APIs, hooks และพฤติกรรม
การลงทะเบียน runtime

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกนำออกใน release major ในอนาคต
  Plugin ที่ยังคง import จากพื้นผิวเหล่านี้จะพังเมื่อถึงเวลานั้น
  การลงทะเบียน embedded extension factory เฉพาะ Pi ไม่ถูกโหลดอีกต่อไปแล้ว
</Warning>

## เหตุผลที่เปลี่ยนแปลง

แนวทางเดิมทำให้เกิดปัญหา:

- **เริ่มต้นช้า** - การ import ตัวช่วยเดียวโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบรายการ
- **dependency แบบวงกลม** - re-export แบบกว้างทำให้สร้าง import cycle ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีบอกว่า export ใดเสถียรและ export ใดเป็น internal

Plugin SDK สมัยใหม่แก้ปัญหานี้: แต่ละ import path (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กที่แยกตัวเอง มีวัตถุประสงค์ชัดเจนและมี contract ที่ documented

seam อำนวยความสะดวกของ provider รุ่นเก่าสำหรับ bundled channels ก็ถูกนำออกแล้วเช่นกัน
seam ตัวช่วยที่ผูกกับแบรนด์ channel เป็นทางลัดส่วนตัวของ mono-repo ไม่ใช่
contract ของ Plugin ที่เสถียร ให้ใช้ SDK subpath แบบ generic และแคบแทน ภายใน
workspace ของ bundled Plugin ให้เก็บตัวช่วยที่ provider เป็นเจ้าของไว้ใน `api.ts`
หรือ `runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง bundled provider ปัจจุบัน:

- Anthropic เก็บตัวช่วย stream เฉพาะ Claude ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตัวเอง
- OpenAI เก็บ provider builders, ตัวช่วย default-model และ realtime provider
  builders ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ provider builder และตัวช่วย onboarding/config ไว้ใน
  `api.ts` ของตัวเอง

## แผน migration สำหรับ Talk และเสียงเรียลไทม์

โค้ด Talk สำหรับเสียงเรียลไทม์, โทรศัพท์, การประชุม และเบราว์เซอร์ กำลังย้ายจาก
การทำ turn bookkeeping เฉพาะ surface ไปสู่ Talk session controller แบบใช้ร่วมกัน
ที่ export โดย `openclaw/plugin-sdk/realtime-voice` controller ใหม่เป็นเจ้าของ
ซอง event ของ Talk ร่วมกัน, สถานะ active turn, สถานะ capture, สถานะ output-audio,
ประวัติ event ล่าสุด และการปฏิเสธ stale-turn Plugin ของ provider ควรยังคงเป็น
เจ้าของ session เรียลไทม์เฉพาะ vendor; Plugin ของ surface ควรยังคงเป็นเจ้าของ
รายละเอียดเฉพาะของ capture, playback, โทรศัพท์ และการประชุม

migration ของ Talk นี้ตั้งใจให้เป็นการเปลี่ยนแบบ breaking-clean:

1. เก็บ controller/runtime primitives ที่ใช้ร่วมกันไว้ใน
   `plugin-sdk/realtime-voice`
2. ย้าย bundled surfaces ไปใช้ controller ที่ใช้ร่วมกัน: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime และ native push-to-talk
3. แทนที่ตระกูล Talk RPC เก่าด้วย API สุดท้าย `talk.session.*` และ
   `talk.client.*`
4. ประกาศ live Talk event channel หนึ่งรายการใน Gateway
   `hello-ok.features.events`: `talk.event`
5. ลบ endpoint HTTP เรียลไทม์เก่า และ path override instruction ขณะ request
   ทั้งหมด

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่กำลัง implement
adapter ระดับต่ำหรือ test fixture ให้ใช้ controller ที่ใช้ร่วมกันแทน เพื่อให้
event ที่อยู่ใน scope ของ turn ไม่สามารถถูก emit โดยไม่มี turn id, การเรียก
`turnEnd` / `turnCancel` ที่ stale ไม่สามารถล้าง active turn ที่ใหม่กว่า และ
event lifecycle ของ output-audio สอดคล้องกันในโทรศัพท์, การประชุม, browser relay,
managed-room handoff และ native Talk clients

รูปทรง API สาธารณะเป้าหมายคือ:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

session ของ WebRTC/provider-websocket ที่เบราว์เซอร์เป็นเจ้าของใช้ `talk.client.create`
เพราะเบราว์เซอร์เป็นเจ้าของการ negotiate กับ provider และ media transport ขณะที่
Gateway เป็นเจ้าของ credentials, instructions และ tool policy `talk.session.*`
เป็น surface ร่วมที่ Gateway จัดการสำหรับ gateway-relay realtime, gateway-relay
transcription และ session STT/TTS แบบ native ของ managed-room

config รุ่นเก่าที่วาง realtime selectors ไว้ข้าง `talk.provider` /
`talk.providers` ควรถูกซ่อมด้วย `openclaw doctor --fix`; runtime Talk
จะไม่ตีความ config provider ของ speech/TTS เป็น config provider ของ realtime

ชุดค่าที่รองรับสำหรับ `talk.session.create` ถูกตั้งใจให้มีขนาดเล็ก:

| Mode            | Transport       | Brain           | Owner              | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียง provider แบบ full-duplex ที่ bridge ผ่าน Gateway; tool calls ถูก route ผ่าน tool agent-consult      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | เฉพาะ streaming STT; caller ส่ง input audio และรับ transcript events                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | ห้องสไตล์ push-to-talk และ walkie-talkie ที่ client เป็นเจ้าของ capture/playback และ Gateway เป็นเจ้าของสถานะ turn |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | โหมดห้องสำหรับ admin เท่านั้น สำหรับ first-party surfaces ที่ trusted ซึ่ง execute Gateway tool actions โดยตรง                  |

แผนที่ method ที่ถูกนำออก:

| Old                              | New                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

ชุดคำศัพท์ควบคุมแบบรวมยังตั้งใจให้แคบเช่นกัน:

| Method                          | Applies to                                              | Contract                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | append ชิ้นเสียง PCM แบบ base64 ไปยัง session provider ที่เป็นเจ้าของโดยการเชื่อมต่อ Gateway เดียวกัน                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่ม turn ของผู้ใช้ใน managed-room                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | สิ้นสุด active turn หลังจากตรวจสอบ stale-turn                                                                                                                                         |
| `talk.session.cancelTurn`       | all Gateway-owned sessions                              | ยกเลิกงาน active capture/provider/agent/TTS สำหรับ turn หนึ่ง                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุด output เสียงของ assistant โดยไม่จำเป็นต้องสิ้นสุด turn ของผู้ใช้                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำ provider tool call ที่ relay emit ให้เสร็จสมบูรณ์; ส่ง `options.willContinue` สำหรับ output ชั่วคราว หรือ `options.suppressResponse` เพื่อตอบสนอง call โดยไม่มี response จาก assistant อีกครั้ง |
| `talk.session.close`            | all unified sessions                                    | หยุด relay sessions หรือ revoke สถานะ managed-room จากนั้นลืม unified session id                                                                                                    |

  อย่าเพิ่มกรณีพิเศษของ provider หรือแพลตฟอร์มใน core เพื่อทำให้สิ่งนี้ทำงานได้
  core เป็นเจ้าของความหมายของเซสชัน Talk ส่วน provider plugins เป็นเจ้าของการตั้งค่าเซสชันของ vendor
  Voice-call และ Google Meet เป็นเจ้าของอะแดปเตอร์โทรศัพท์/การประชุม Browser และ native
  apps เป็นเจ้าของ UX การจับภาพ/เล่นกลับของอุปกรณ์

  ## นโยบายความเข้ากันได้

  สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้ให้ทำตามลำดับนี้:

  1. เพิ่มสัญญาใหม่
  2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้
  3. ส่ง diagnostic หรือคำเตือนที่ระบุชื่อพาธเดิมและสิ่งที่ใช้แทน
  4. ครอบคลุมทั้งสองพาธในเทสต์
  5. จัดทำเอกสารการเลิกใช้และพาธการย้าย
  6. ลบออกหลังจากหน้าต่างการย้ายที่ประกาศไว้เท่านั้น โดยปกติใน major release

  maintainers สามารถตรวจสอบคิวการย้ายปัจจุบันได้ด้วย
  `pnpm plugins:boundary-report` ใช้ `pnpm plugins:boundary-report:summary` สำหรับ
  จำนวนแบบกะทัดรัด, `--owner <id>` สำหรับ Plugin เดียวหรือเจ้าของความเข้ากันได้ และ
  `pnpm plugins:boundary-report:ci` เมื่อ CI gate ควรล้มเหลวจากระเบียน
  ความเข้ากันได้ที่ครบกำหนด, การ import SDK ที่สงวนไว้ข้ามเจ้าของ หรือ SDK
  subpaths ที่สงวนไว้แต่ไม่ได้ใช้ รายงานจะจัดกลุ่มระเบียนความเข้ากันได้ที่เลิกใช้แล้ว
  ตามวันที่ลบ, นับการอ้างอิงในโค้ด/เอกสารภายในเครื่อง, แสดงการ import SDK ที่สงวนไว้ข้ามเจ้าของ
  และสรุป bridge SDK ของ private memory-host เพื่อให้การล้างความเข้ากันได้ชัดเจน
  แทนที่จะพึ่งพาการค้นหาเฉพาะกิจ SDK subpaths ที่สงวนไว้ต้องมีการใช้งานของเจ้าของที่ติดตามไว้
  ควรลบ helper exports ที่สงวนไว้แต่ไม่ได้ใช้ออกจาก SDK สาธารณะ

  หาก manifest field ยังยอมรับอยู่ ผู้เขียน Plugin สามารถใช้ต่อไปได้จนกว่า
  เอกสารและ diagnostic จะระบุเป็นอย่างอื่น โค้ดใหม่ควรใช้สิ่งที่เอกสารระบุให้ใช้แทน
  แต่ Plugin ที่มีอยู่ไม่ควรแตกใน minor releases ตามปกติ

  ## วิธีการย้าย

  <Steps>
  <Step title="ย้าย helpers สำหรับโหลด/เขียน runtime config">
    bundled plugins ควรหยุดเรียก
    `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ให้ใช้ config ที่ถูกส่งเข้า
    active call path อยู่แล้วเป็นหลัก handlers ที่มีอายุยาวซึ่งต้องการ snapshot
    ของ process ปัจจุบันสามารถใช้ `api.runtime.config.current()` ได้ tools ของ agent
    ที่มีอายุยาวควรใช้ `ctx.getRuntimeConfig()` ของ tool context ภายใน
    `execute` เพื่อให้ tool ที่ถูกสร้างก่อนการเขียน config ยังคงเห็น
    runtime config ที่ refresh แล้ว

    การเขียน config ต้องผ่าน transactional helpers และเลือกนโยบาย
    หลังเขียน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อ caller รู้ว่า
    การเปลี่ยนแปลงต้องการ gateway restart ที่สะอาด และใช้
    `afterWrite: { mode: "none", reason: "..." }` เฉพาะเมื่อ caller เป็นเจ้าของ
    งานติดตามผลและตั้งใจต้องการปิด reload planner
    ผลลัพธ์การ mutate จะมีสรุป `followUp` ที่มีชนิดข้อมูลสำหรับเทสต์และการ logging;
    gateway ยังคงรับผิดชอบในการนำ restart ไปใช้หรือจัดตาราง
    `loadConfig` และ `writeConfigFile` ยังคงเป็น helpers ความเข้ากันได้ที่เลิกใช้แล้ว
    สำหรับ Plugin ภายนอกระหว่างหน้าต่างการย้าย และเตือนหนึ่งครั้งด้วย
    compatibility code `runtime-config-load-write` bundled plugins และ runtime code
    ใน repo ได้รับการปกป้องด้วย scanner guardrails ใน
    `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งานใหม่ใน production plugin
    จะล้มเหลวทันที, การเขียน config โดยตรงจะล้มเหลว, methods ของ gateway server ต้องใช้
    request runtime snapshot, runtime channel send/action/client helpers
    ต้องรับ config จาก boundary ของตน และ runtime modules ที่มีอายุยาว
    อนุญาตให้มีการเรียก `loadConfig()` แบบ ambient ได้เป็นศูนย์ครั้ง

    โค้ด Plugin ใหม่ควรหลีกเลี่ยงการ import compatibility barrel แบบกว้าง
    `openclaw/plugin-sdk/config-runtime` ด้วย ใช้ SDK subpath แบบแคบที่ตรงกับงาน:

    | ความต้องการ | Import |
    | --- | --- |
    | ชนิดของ config เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertion ของ config ที่โหลดแล้วและการค้นหา plugin-entry config | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่าน snapshot ของ runtime ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียน config | `openclaw/plugin-sdk/config-mutation` |
    | session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | config ตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | การ resolve secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    bundled plugins และเทสต์ของพวกมันมี scanner ป้องกันการใช้ barrel แบบกว้าง
    เพื่อให้ imports และ mocks อยู่เฉพาะในพฤติกรรมที่ต้องใช้เท่านั้น barrel แบบกว้าง
    ยังคงมีอยู่เพื่อความเข้ากันได้ภายนอก แต่โค้ดใหม่ไม่ควร
    พึ่งพามัน

  </Step>

  <Step title="ย้ายส่วนขยาย tool-result ของ Pi ไปยัง middleware">
    bundled plugins ต้องแทนที่ tool-result handlers เฉพาะ Pi
    `api.registerEmbeddedExtensionFactory(...)` ด้วย
    middleware ที่เป็นกลางต่อ runtime

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    อัปเดต manifest ของ Plugin ในเวลาเดียวกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin ภายนอกไม่สามารถลงทะเบียน tool-result middleware ได้เพราะมันสามารถ
    เขียน output ของ tool ที่มีความน่าเชื่อถือสูงใหม่ก่อนที่ model จะเห็น

  </Step>

  <Step title="ย้าย approval-native handlers ไปยัง capability facts">
    channel plugins ที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบ native ผ่าน
    `approvalCapability.nativeRuntime` พร้อมกับ runtime-context registry ที่ใช้ร่วมกัน

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery เฉพาะ approval ออกจาก wiring เดิม `plugin.auth` /
      `plugin.approvals` และไปไว้ที่ `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจากสัญญา channel-plugin สาธารณะแล้ว;
      ย้าย delivery/native/render fields ไปไว้ที่ `approvalCapability`
    - `plugin.auth` ยังคงใช้สำหรับ flows การ login/logout ของ channel เท่านั้น; hooks ของ approval auth
      ที่นั่นจะไม่ถูก core อ่านอีกต่อไป
    - ลงทะเบียน runtime objects ที่ channel เป็นเจ้าของ เช่น clients, tokens หรือ Bolt
      apps ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง notices การ reroute ที่ Plugin เป็นเจ้าของจาก native approval handlers;
      ตอนนี้ core เป็นเจ้าของ notices แบบ routed-elsewhere จากผลลัพธ์ delivery จริง
    - เมื่อส่ง `channelRuntime` เข้า `createChannelManager(...)` ให้ระบุ
      surface `createPluginRuntime().channel` จริง Partial stubs จะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับ layout approval capability ปัจจุบัน

  </Step>

  <Step title="ตรวจสอบพฤติกรรม fallback ของ Windows wrapper">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` wrappers ของ Windows
    `.cmd`/`.bat` ที่ resolve ไม่ได้จะ fail closed แล้ว เว้นแต่คุณจะส่ง
    `allowShellFallback: true` อย่างชัดเจน

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    หาก caller ของคุณไม่ได้ตั้งใจพึ่งพา shell fallback อย่าตั้งค่า
    `allowShellFallback` และให้จัดการ error ที่ถูก throw แทน

  </Step>

  <Step title="ค้นหา imports ที่เลิกใช้แล้ว">
    ค้นหา Plugin ของคุณสำหรับ imports จาก surface ที่เลิกใช้แล้วรายการใดรายการหนึ่ง:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วย imports ที่เจาะจง">
    แต่ละ export จาก surface เดิมจะ map ไปยัง import path สมัยใหม่ที่เฉพาะเจาะจง:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    สำหรับ helpers ฝั่ง host ให้ใช้ plugin runtime ที่ inject เข้ามาแทนการ import
    โดยตรง:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันใช้กับ legacy bridge helpers อื่นด้วย:

    | import เดิม | สิ่งที่เทียบเท่าสมัยใหม่ |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="แทนที่ infra-runtime imports แบบกว้าง">
    `openclaw/plugin-sdk/infra-runtime` ยังคงมีอยู่เพื่อความเข้ากันได้ภายนอก
    แต่โค้ดใหม่ควร import surface helper ที่เจาะจงตามที่จำเป็นจริง:

    | ความต้องการ | Import |
    | --- | --- |
    | system event queue helpers | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat wake, event และ visibility helpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การ drain pending delivery queue | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | telemetry ของ channel activity | `openclaw/plugin-sdk/channel-activity-runtime` |
    | dedupe caches ในหน่วยความจำ | `openclaw/plugin-sdk/dedupe-runtime` |
    | helpers สำหรับพาธ local-file/media ที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch ที่รู้จัก dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | proxy และ guarded fetch helpers | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิด approval request/resolution | `openclaw/plugin-sdk/approval-runtime` |
    | approval reply payload และ command helpers | `openclaw/plugin-sdk/approval-reply-runtime` |
    | error formatting helpers | `openclaw/plugin-sdk/error-runtime` |
    | การรอ transport readiness | `openclaw/plugin-sdk/transport-ready-runtime` |
    | secure token helpers | `openclaw/plugin-sdk/secure-random-runtime` |
    | bounded async task concurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | numeric coercion | `openclaw/plugin-sdk/number-runtime` |
    | process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | file locks | `openclaw/plugin-sdk/file-lock` |

    bundled plugins มี scanner ป้องกัน `infra-runtime` ดังนั้นโค้ดใน repo
    จึงไม่สามารถถอยกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="ย้าย channel route helpers">
    โค้ด channel route ใหม่ควรใช้ `openclaw/plugin-sdk/channel-route`
    ชื่อ route-key และ comparable-target แบบเก่ายังคงอยู่เป็น aliases
    เพื่อความเข้ากันได้ระหว่างหน้าต่างการย้าย แต่ Plugin ใหม่ควรใช้ชื่อ route
    ที่อธิบายพฤติกรรมโดยตรง:

    | ตัวช่วยเก่า | ตัวช่วยสมัยใหม่ |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วย route สมัยใหม่จะ normalize `{ channel, to, accountId, threadId }`
    อย่างสอดคล้องกันใน native approvals, reply suppression, inbound dedupe,
    การส่ง Cron และ session routing หาก Plugin ของคุณเป็นเจ้าของไวยากรณ์ target
    แบบกำหนดเอง ให้ใช้ `resolveChannelRouteTargetWithParser(...)` เพื่อปรับ
    parser นั้นให้เข้ากับสัญญา route target เดียวกัน

  </Step>

  <Step title="สร้างและทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงเส้นทาง import

  <Accordion title="ตารางพาธการนำเข้าที่ใช้บ่อย">
  | พาธการนำเข้า | วัตถุประสงค์ | รายการส่งออกสำคัญ |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยรายการเข้า Plugin ตามมาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | การส่งออกซ้ำแบบครอบคลุมรุ่นเก่าสำหรับนิยาม/ตัวสร้างรายการเข้าของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | การส่งออกสคีมาการกำหนดค่าระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยรายการเข้าสำหรับผู้ให้บริการรายเดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้างรายการเข้าของช่องทางแบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน | พรอมป์ allowlist, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | ตัวช่วยรันไทม์ขณะตั้งค่า | อะแดปเตอร์แพตช์การตั้งค่าที่นำเข้าได้อย่างปลอดภัย, ตัวช่วยบันทึกการค้นหา, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าแบบมอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | alias ของอะแดปเตอร์การตั้งค่าที่เลิกใช้แล้ว | ใช้ `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/การกำหนดค่า/action-gate |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การทำ account-id ให้เป็นมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + ตัวช่วย fallback ค่าเริ่มต้น |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบเจาะจง | ตัวช่วยรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | อะแดปเตอร์วิซาร์ดการตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเชื่อมต่อคำนำหน้าการตอบกลับ, การพิมพ์, และการส่งมอบต้นทาง | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | factory อะแดปเตอร์การกำหนดค่าและตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมาการกำหนดค่า | primitive สคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไปเท่านั้น |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าที่บันเดิลมา | เฉพาะ Plugin ที่บันเดิลมาและดูแลโดย OpenClaw เท่านั้น; Plugin ใหม่ต้องกำหนดสคีมาเฉพาะ Plugin เอง |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมาการกำหนดค่าที่บันเดิลมาและเลิกใช้แล้ว | alias เพื่อความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่บันเดิลมาและยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยการกำหนดค่าคำสั่ง Telegram | การทำชื่อคำสั่งให้เป็นมาตรฐาน, การตัดแต่งคำอธิบาย, การตรวจสอบรายการซ้ำ/ความขัดแย้ง |
  | `plugin-sdk/channel-policy` | การแก้นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | ตัวช่วยสถานะบัญชีและวงจรชีวิตสตรีมฉบับร่าง | `createAccountStatusSink`, ตัวช่วยการสรุปพรีวิวฉบับร่าง |
  | `plugin-sdk/inbound-envelope` | ตัวช่วยซองข้อมูลขาเข้า | ตัวช่วยเส้นทางที่ใช้ร่วมกัน + ตัวสร้างซองข้อมูล |
  | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยการตอบกลับขาเข้า | ตัวช่วยบันทึกและ dispatch ที่ใช้ร่วมกัน |
  | `plugin-sdk/messaging-targets` | การแยกวิเคราะห์เป้าหมายการส่งข้อความ | ตัวช่วยแยกวิเคราะห์/จับคู่เป้าหมาย |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | ตัวช่วย dependency สำหรับการส่งขาออก | การค้นหา `resolveOutboundSendDep` แบบเบาโดยไม่นำเข้ารันไทม์ขาออกเต็มรูปแบบ |
  | `plugin-sdk/outbound-runtime` | ตัวช่วยรันไทม์ขาออก | ตัวช่วยการส่งมอบขาออก, delegate ตัวตน/การส่ง, เซสชัน, การจัดรูปแบบ, และการวางแผน payload |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยการผูกเธรด | ตัวช่วยวงจรชีวิตและอะแดปเตอร์ของการผูกเธรด |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย payload สื่อรุ่นเก่า | ตัวสร้าง payload สื่อของ Agent สำหรับเลย์เอาต์ฟิลด์รุ่นเก่า |
  | `plugin-sdk/channel-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว | เฉพาะยูทิลิตีรันไทม์ช่องทางรุ่นเก่าเท่านั้น |
  | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การส่ง | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | ที่เก็บ Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วยรันไทม์แบบกว้าง | ตัวช่วยรันไทม์/การบันทึก/สำรองข้อมูล/ติดตั้ง Plugin |
  | `plugin-sdk/runtime-env` | ตัวช่วยสภาพแวดล้อมรันไทม์แบบเจาะจง | Logger/สภาพแวดล้อมรันไทม์, timeout, retry, และ backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วยรันไทม์ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/hooks/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วย hook pipeline | ตัวช่วย pipeline ของ Webhook/hook ภายในที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วยรันไทม์ lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วยโปรเซส | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วยรันไทม์ CLI | การจัดรูปแบบคำสั่ง, การรอ, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | ไคลเอนต์ Gateway, ตัวช่วยเริ่มแบบ event-loop-ready, และตัวช่วยแพตช์สถานะช่องทาง |
  | `plugin-sdk/config-runtime` | shim ความเข้ากันได้ของการกำหนดค่าที่เลิกใช้แล้ว | ควรใช้ `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram ที่เสถียรเมื่อ fallback เมื่อ surface contract ของ Telegram ที่บันเดิลมาไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วยพรอมป์การอนุมัติ | payload การอนุมัติ exec/Plugin, ตัวช่วย capability/profile การอนุมัติ, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติ native, และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การแก้ approver, auth การดำเนินการในแชทเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วยไคลเอนต์การอนุมัติ | ตัวช่วย profile/filter การอนุมัติ exec native |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วยการส่งมอบการอนุมัติ | อะแดปเตอร์ capability/การส่งมอบการอนุมัติ native |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย Gateway การอนุมัติ | ตัวช่วยการแก้ Gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยอะแดปเตอร์การอนุมัติ | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติ native แบบเบาสำหรับ entrypoint ช่องทางที่เป็น hot path |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย handler การอนุมัติ | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างกว่า; ควรใช้ seam อะแดปเตอร์/Gateway ที่เจาะจงกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วยการผูกเป้าหมาย/บัญชีการอนุมัติ native |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยการตอบกลับการอนุมัติ | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย runtime-context ของช่องทาง | ตัวช่วย register/get/watch runtime-context ของช่องทางทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | trust ที่ใช้ร่วมกัน, การ gate DM, ตัวช่วยไฟล์/พาธที่จำกัดภายในราก, external-content, และการรวบรวม secret |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วย allowlist โฮสต์และนโยบายเครือข่ายส่วนตัว |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วยรันไทม์ SSRF | dispatcher แบบ pinned, fetch ที่มี guard, ตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วยเหตุการณ์ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | ตัวช่วย wake, event, และ visibility ของ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิวการส่งมอบ | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe | แคช dedupe ในหน่วยความจำ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยการเข้าถึงไฟล์ | ตัวช่วยพาธไฟล์/สื่อภายในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของ transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | ตัวช่วยแคชแบบมีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วยการ gate การวินิจฉัย | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยการจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วยกราฟข้อผิดพลาด |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy แบบห่อหุ้ม | `resolveFetch`, ตัวช่วย proxy, ตัวช่วยตัวเลือก EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยการทำโฮสต์ให้เป็นมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย retry | `RetryConfig`, `retryAsync`, ตัวเรียกใช้นโยบาย |
  | `plugin-sdk/allow-from` | การจัดรูปแบบ allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | การแมปอินพุต allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | การ gate คำสั่งและตัวช่วย surface คำสั่ง | `resolveControlCommandGate`, ตัวช่วยการอนุญาตผู้ส่ง, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | ตัวเรนเดอร์สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์อินพุต secret | ตัวช่วยอินพุต secret |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | ยูทิลิตีเป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วย guard เนื้อหา Webhook | ตัวช่วยอ่าน/จำกัดขนาดเนื้อหาคำขอ |
  | `plugin-sdk/reply-runtime` | รันไทม์การตอบกลับที่ใช้ร่วมกัน | dispatch ขาเข้า, Heartbeat, ตัววางแผนการตอบกลับ, การแบ่งเป็น chunk |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch การตอบกลับแบบเจาะจง | ตัวช่วย finalize, dispatch ผู้ให้บริการ, และป้ายกำกับบทสนทนา |
  | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับ | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reference การตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วย chunk การตอบกลับ | ตัวช่วยแบ่ง chunk ข้อความ/markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วยที่เก็บเซสชัน | ตัวช่วยพาธที่เก็บ + updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วยพาธสถานะ | ตัวช่วยไดเรกทอรีสถานะและ OAuth |
  | `plugin-sdk/routing` | ตัวช่วยการกำหนดเส้นทาง/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยการทำ session-key ให้เป็นมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี, ค่าเริ่มต้น runtime-state, ตัวช่วย metadata ของ issue |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยการทำสตริงให้เป็นมาตรฐาน | ตัวช่วยการทำ slug/สตริงให้เป็นมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL คำขอ | ดึง URL แบบสตริงจากอินพุตที่คล้ายคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบจับเวลา | ตัวเรียกใช้คำสั่งแบบจับเวลาพร้อม stdout/stderr ที่ทำให้เป็นมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
  | `plugin-sdk/tool-payload` | การแยกเพย์โหลดของเครื่องมือ | แยกเพย์โหลดที่ทำให้เป็นมาตรฐานจากออบเจกต์ผลลัพธ์ของเครื่องมือ |
  | `plugin-sdk/tool-send` | การแยกการส่งของเครื่องมือ | แยกฟิลด์เป้าหมายการส่งแบบบัญญัติจากอาร์กิวเมนต์ของเครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวช่วย logger ของระบบย่อยและการปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ประเภทการตอบกลับข้อความ | ประเภทเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่า provider แบบคัดสรรสำหรับโลคัล/โฮสต์เอง | ตัวช่วยค้นพบ/กำหนดค่า provider แบบโฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่า provider แบบโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะเจาะจง | ตัวช่วยค้นพบ/กำหนดค่า provider แบบโฮสต์เองเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการยืนยันตัวตนรันไทม์ของ provider | ตัวช่วยการแก้ค่า API key ระหว่างรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการตั้งค่า API key ของ provider | ตัวช่วย onboarding/เขียนโปรไฟล์สำหรับ API key |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของ provider | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยการเลือก provider | การเลือก provider แบบกำหนดค่าไว้หรืออัตโนมัติ และการผสานการกำหนดค่า provider ดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วย env-var ของ provider | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของ provider |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/การ replay ของ provider ที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของ provider และตัวช่วยทำให้ model-id เป็นมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อก provider ที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์ onboarding ของ provider | ตัวช่วยการกำหนดค่า onboarding |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของ provider | ตัวช่วยความสามารถ HTTP/endpoint ทั่วไปของ provider รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของ provider | ตัวช่วยการลงทะเบียน/แคช provider แบบ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า web-search ของ provider | ตัวช่วยการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบสำหรับ provider ที่ไม่ต้องการการเชื่อมต่อเปิดใช้ Plugin |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วย contract ของ web-search ของ provider | ตัวช่วย contract การกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวรับข้อมูลรับรองแบบมีขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของ provider | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของ provider แบบ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาของ provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา Gemini + การวินิจฉัย |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานของ provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งาน provider อื่น ๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วย wrapper สตรีมของ provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท wrapper สตรีม และตัวช่วย wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ของ provider | ตัวช่วย transport แบบ native ของ provider เช่น guarded fetch, การแปลงข้อความ transport และสตรีมเหตุการณ์ transport ที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิว async แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วย fetch/แปลง/จัดเก็บสื่อ, การตรวจหามิติของวิดีโอด้วย ffprobe และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน, การเลือก candidate และข้อความเมื่อโมเดลขาดหายสำหรับการสร้างรูปภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยการทำความเข้าใจสื่อ | ประเภท provider สำหรับการทำความเข้าใจสื่อ พร้อม export ตัวช่วยรูปภาพ/เสียงที่หันหน้าให้ provider |
  | `plugin-sdk/text-runtime` | export ความเข้ากันได้ของข้อความแบบกว้างที่เลิกใช้แล้ว | ใช้ `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` และ `logging-core` |
  | `plugin-sdk/text-chunking` | ตัวช่วยการแบ่งข้อความเป็นชิ้น | ตัวช่วยการแบ่งข้อความขาออกเป็นชิ้น |
  | `plugin-sdk/speech` | ตัวช่วยคำพูด | ประเภท provider คำพูด พร้อม directive, registry, ตัวช่วยตรวจสอบที่หันหน้าให้ provider และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | คอร์คำพูดที่ใช้ร่วมกัน | ประเภท provider คำพูด, registry, directive, การทำให้เป็นมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยการถอดเสียงแบบเรียลไทม์ | ประเภท provider, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ประเภท provider, ตัวช่วย registry/การแก้ค่า, ตัวช่วยเซสชัน bridge, คิว talk-back ของ agent ที่ใช้ร่วมกัน, สุขภาพ transcript/event, การยับยั้ง echo และตัวช่วยปรึกษาบริบทแบบเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วยการสร้างรูปภาพ | ประเภท provider การสร้างรูปภาพ พร้อมตัวช่วย asset รูปภาพ/data URL และตัวสร้าง provider รูปภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | คอร์การสร้างรูปภาพที่ใช้ร่วมกัน | ประเภทการสร้างรูปภาพ, failover, การยืนยันตัวตน และตัวช่วย registry |
  | `plugin-sdk/music-generation` | ตัวช่วยการสร้างเพลง | ประเภท provider/request/result สำหรับการสร้างเพลง |
  | `plugin-sdk/music-generation-core` | คอร์การสร้างเพลงที่ใช้ร่วมกัน | ประเภทการสร้างเพลง, ตัวช่วย failover, การค้นหา provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วยการสร้างวิดีโอ | ประเภท provider/request/result สำหรับการสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | คอร์การสร้างวิดีโอที่ใช้ร่วมกัน | ประเภทการสร้างวิดีโอ, ตัวช่วย failover, การค้นหา provider และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การทำให้เป็นมาตรฐาน/การลดรูปเพย์โหลดการตอบกลับแบบโต้ตอบ |
  | `plugin-sdk/channel-config-primitives` | primitive การกำหนดค่าช่องทาง | primitive สคีมาการกำหนดค่าช่องทางแบบแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยการเขียนการกำหนดค่าช่องทาง | ตัวช่วยการอนุญาตการเขียนการกำหนดค่าช่องทาง |
  | `plugin-sdk/channel-plugin-common` | prelude ช่องทางที่ใช้ร่วมกัน | export prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วย snapshot/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยการกำหนดค่า allowlist | ตัวช่วยแก้ไข/อ่านการกำหนดค่า allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยการตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm` | ตัวช่วย DM โดยตรง | ตัวช่วยการยืนยันตัวตน/guard สำหรับ DM โดยตรงที่ใช้ร่วมกัน |
  | `plugin-sdk/extension-shared` | ตัวช่วย extension ที่ใช้ร่วมกัน | primitive ตัวช่วย passive-channel/status และ ambient proxy |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | registry เป้าหมาย Webhook และตัวช่วยติดตั้ง route |
  | `plugin-sdk/webhook-path` | alias พาธ webhook ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/โลคัล |
  | `plugin-sdk/zod` | re-export ความเข้ากันได้ของ Zod ที่เลิกใช้แล้ว | import `zod` จาก `zod` โดยตรง |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่บันเดิลมา | พื้นผิวตัวช่วย memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์ของเอนจินหน่วยความจำ | facade รันไทม์ index/search ของหน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจิน foundation ของโฮสต์หน่วยความจำ | export เอนจิน foundation ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจิน embedding ของโฮสต์หน่วยความจำ | contract ของ embedding หน่วยความจำ, การเข้าถึง registry, provider โลคัล และตัวช่วย batch/remote ทั่วไป; provider ระยะไกลแบบเจาะจงอยู่ใน Plugin ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | export เอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจิน storage ของโฮสต์หน่วยความจำ | export เอนจิน storage ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของโฮสต์หน่วยความจำ | ตัวช่วย multimodal ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์หน่วยความจำ | ตัวช่วย query ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | alias เหตุการณ์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะโฮสต์หน่วยความจำ | ตัวช่วยสถานะโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์คอร์ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์คอร์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | alias รันไทม์คอร์ของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วยรันไทม์คอร์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | alias บันทึกเหตุการณ์ของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | alias ไฟล์/รันไทม์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย markdown ที่จัดการให้ | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้หน่วยความจำ |
  | `plugin-sdk/memory-host-search` | facade การค้นหา Active Memory | facade รันไทม์ของ search-manager สำหรับ active-memory แบบ lazy |
  | `plugin-sdk/memory-host-status` | alias สถานะโฮสต์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | ยูทิลิตีทดสอบ | barrel ความเข้ากันได้ที่เลิกใช้แล้วแบบ repo-local; ใช้ subpath ทดสอบแบบ repo-local ที่เฉพาะเจาะจง เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้จงใจให้เป็นชุดย่อยสำหรับการย้ายที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ของคอมไพเลอร์อยู่ที่
`scripts/lib/plugin-sdk-entrypoints.json`; package exports จะถูกสร้างจาก
ชุดย่อยสาธารณะ

seam ตัวช่วยของ Plugin ที่รวมมากับแพ็กเกจซึ่งสงวนไว้ ถูกถอดออกจาก export map
ของ SDK สาธารณะแล้ว ยกเว้น compatibility facade ที่มีเอกสารชัดเจน เช่น shim
`plugin-sdk/discord` ที่เลิกใช้แล้วแต่ยังคงไว้สำหรับแพ็กเกจ
`@openclaw/discord@2026.3.13` ที่เผยแพร่ไปแล้ว ตัวช่วยเฉพาะ owner จะอยู่ภายใน
แพ็กเกจ Plugin ที่เป็นเจ้าของนั้น พฤติกรรม host ที่ใช้ร่วมกันควรย้ายผ่านสัญญา
SDK แบบทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`

ใช้อิมพอร์ตที่แคบที่สุดซึ่งตรงกับงาน หากหา export ไม่พบ ให้ตรวจสอบซอร์สที่
`src/plugin-sdk/` หรือถาม maintainers ว่าสัญญาทั่วไปใดควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้ที่ยังมีผลอยู่

การเลิกใช้ที่แคบลงซึ่งใช้กับ plugin SDK, สัญญา provider, พื้นผิว runtime และ manifest แต่ละรายการยังคงทำงานได้ในวันนี้ แต่จะถูกลบออกใน major release ในอนาคต รายการใต้แต่ละหัวข้อจะ map API เก่าไปยังตัวแทนที่เป็น canonical

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม, export เดิม
    เพียงแค่อิมพอร์ตจาก subpath ที่แคบกว่า `command-auth`
    จะ re-export รายการเหล่านี้เป็น compat stub

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **เดิม**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`.

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` - คืนค่า
    object การตัดสินใจเดียว แทนการเรียกสองครั้งที่แยกกัน

    Plugin ช่องทางปลายน้ำ (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนแล้ว

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` เป็น compatibility shim สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่าอิมพอร์ตจากโค้ดใหม่ ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับการลงทะเบียน object
    runtime

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions` ถูกเลิกใช้
    พร้อมกับ export ช่องทาง "actions" แบบดิบ ให้เปิดเผย capability ผ่านพื้นผิว
    `presentation` เชิงความหมายแทน - Plugin ช่องทางประกาศว่าตน render อะไร
    (cards, buttons, selects) ไม่ใช่ชื่อ action ดิบใดที่ยอมรับ

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`.

    **ใหม่**: implement `createTool(...)` โดยตรงบน provider Plugin
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน wrapper ของเครื่องมืออีกต่อไป

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **เดิม**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้าง prompt envelope
    แบบ plaintext แบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อม block บริบทผู้ใช้แบบมีโครงสร้าง
    Plugin ช่องทางแนบ metadata การจัดเส้นทาง (thread, topic, reply-to, reactions)
    เป็น field ที่มี type แทนการต่อเข้ากับ prompt string ตัวช่วย
    `formatAgentEnvelope(...)` ยังรองรับสำหรับ envelope ที่สังเคราะห์ขึ้นเพื่อ
    assistant แต่ envelope plaintext ขาเข้ากำลังจะถูกเลิกใช้

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received`, และ Plugin
    ช่องทางกำหนดเองใดๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    type alias สำหรับ discovery สี่รายการตอนนี้เป็น wrapper บางๆ เหนือ type
    ยุค catalog:

    | alias เดิม                 | type ใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง static bag `ProviderCapabilities` แบบเดิม - provider Plugin
    ควรใช้ hook ของ provider ที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas`, และ `wrapStreamFn` แทน object แบบ static

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **เดิม** (hook แยกสามรายการบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, และ
    `resolveDefaultThinkingLevel(ctx)`.

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่คืนค่า
    `ProviderThinkingProfile` พร้อม `id` แบบ canonical, `label` ที่ไม่บังคับ,
    และรายการ level ที่จัดอันดับแล้ว OpenClaw จะ downgrade ค่าที่เก็บไว้ซึ่งล้าสมัย
    ตามอันดับ profile โดยอัตโนมัติ

    implement hook เดียวแทนสามรายการ hook เดิมยังทำงานระหว่างช่วงเลิกใช้
    แต่จะไม่ถูก compose กับผลลัพธ์ profile

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **เดิม**: implement `resolveExternalOAuthProfiles(...)` โดยไม่ประกาศ
    provider ใน Plugin manifest

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน Plugin manifest
    **และ** implement `resolveExternalAuthProfiles(...)` เส้นทาง "auth
    fallback" เดิมจะ emit คำเตือนตอน runtime และจะถูกลบออก

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    field manifest **เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **ใหม่**: mirror การ lookup env-var เดิมลงใน `setup.providers[].envVars`
    บน manifest วิธีนี้รวม metadata env สำหรับ setup/status ไว้ที่เดียว
    และหลีกเลี่ยงการ boot runtime ของ Plugin เพียงเพื่อตอบ lookup env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter จนกว่าช่วงเลิกใช้จะปิดลง

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **เดิม**: การเรียกแยกสามครั้ง -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **ใหม่**: การเรียกเดียวบน memory-state API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    slot เดิมทั้งหมด ใช้การเรียกลงทะเบียนเดียว ตัวช่วย memory แบบ additive
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    type alias เดิมสองรายการยังคง export จาก `src/plugins/runtime/types.ts`:

    | เดิม                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    method runtime `readSession` ถูกเลิกใช้ เพื่อใช้
    `getSessionMessages` แทน signature เดิม; method เดิมจะเรียกต่อไปยัง
    method ใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) คืนค่า accessor ของ task-flow แบบ live

    **ใหม่**: `runtime.tasks.managedFlows` คง runtime การ mutate TaskFlow
    แบบ managed ไว้สำหรับ Plugin ที่สร้าง อัปเดต ยกเลิก หรือรัน child tasks
    จาก flow ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียงการอ่านแบบ DTO

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ครอบคลุมใน "วิธีย้าย → ย้าย extension ผลลัพธ์เครื่องมือของ Pi ไปเป็น
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: เส้นทาง Pi-only
    `api.registerEmbeddedExtensionFactory(...)` ที่ถูกลบออก ถูกแทนที่ด้วย
    `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime ที่ชัดเจน
    ใน `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias หนึ่งบรรทัดของ `OpenClawConfig` ควรใช้ชื่อ canonical

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้ระดับ extension (ภายใน Plugin ช่องทาง/provider ที่รวมมากับแพ็กเกจภายใต้
`extensions/`) ถูกติดตามไว้ใน barrel `api.ts` และ `runtime-api.ts`
ของตนเอง สิ่งเหล่านี้ไม่กระทบสัญญา Plugin ของ third-party และไม่ได้แสดงรายการไว้
ที่นี่ หากคุณใช้ barrel local ของ Plugin ที่รวมมากับแพ็กเกจโดยตรง ให้อ่าน
ความคิดเห็นเรื่องการเลิกใช้ใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การลบ

| เมื่อใด                   | สิ่งที่จะเกิดขึ้น                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**                | พื้นผิวที่เลิกใช้จะ emit คำเตือน runtime                               |
| **major release ถัดไป** | พื้นผิวที่เลิกใช้จะถูกลบออก; Plugin ที่ยังใช้อยู่จะล้มเหลว |

Plugin core ทั้งหมดถูกย้ายแล้ว Plugin ภายนอกควรย้ายก่อน major release ถัดไป

## การระงับคำเตือนชั่วคราว

ตั้ง environment variables เหล่านี้ขณะทำงานย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นช่องทางหลีกเลี่ยงชั่วคราว ไม่ใช่วิธีแก้ถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - อ้างอิงการอิมพอร์ต subpath ฉบับเต็ม
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Provider Plugins](/th/plugins/sdk-provider-plugins) - การสร้าง provider Plugin
- [ภายในของ Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) - อ้างอิง schema ของ manifest
