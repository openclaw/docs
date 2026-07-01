---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้เป็นสถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK ของ Plugin สมัยใหม่
title: การย้ายข้อมูล Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างไปเป็นสถาปัตยกรรม Plugin สมัยใหม่
ที่มีการนำเข้าแบบเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณถูกสร้างก่อน
สถาปัตยกรรมใหม่นี้ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยน

ระบบ Plugin แบบเก่าให้พื้นผิวแบบเปิดกว้างสองส่วนที่ทำให้ Plugin สามารถนำเข้า
ทุกอย่างที่ต้องการจากจุดเข้าใช้งานเดียว:

- **`openclaw/plugin-sdk/compat`** - การนำเข้าเดียวที่ส่งออกซ้ำ helper หลายสิบตัว
  ถูกเพิ่มเข้ามาเพื่อให้ Plugin รุ่นเก่าที่อิง hook ยังทำงานได้ ระหว่างที่
  สถาปัตยกรรม Plugin ใหม่กำลังถูกสร้าง
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper รันไทม์แบบกว้างที่
  ผสมเหตุการณ์ระบบ สถานะ Heartbeat คิวการส่ง helper สำหรับ fetch/proxy
  helper ไฟล์ ชนิด approval และยูทิลิตีที่ไม่เกี่ยวข้องกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel ความเข้ากันได้ของ config แบบกว้าง
  ที่ยังคงมี helper โหลด/เขียนโดยตรงที่เลิกใช้แล้วระหว่างช่วงย้ายระบบ
- **`openclaw/extension-api`** - สะพานที่ให้ Plugin เข้าถึง helper ฝั่งโฮสต์โดยตรง
  เช่นตัวรันเอเจนต์แบบฝัง
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ส่วนขยายที่มาพร้อมชุด
  เฉพาะตัวรันแบบฝังซึ่งถูกนำออกแล้ว และเคยสังเกตเหตุการณ์ของตัวรันแบบฝังได้ เช่น
  `tool_result`

พื้นผิวการนำเข้าแบบกว้างตอนนี้ **เลิกใช้แล้ว** พื้นผิวเหล่านี้ยังทำงานได้ในรันไทม์
แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายก่อน
รุ่น major ถัดไปจะนำออก API ลงทะเบียน extension factory เฉพาะตัวรันแบบฝัง
ถูกนำออกแล้ว ให้ใช้ middleware สำหรับผลลัพธ์เครื่องมือแทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน change เดียวกัน
กับที่เพิ่มตัวแทนเข้ามา การเปลี่ยนแปลง contract ที่ทำให้แตกต้องผ่าน
adapter ความเข้ากันได้ diagnostics เอกสาร และช่วงเลิกใช้งานก่อน
ข้อนี้ใช้กับการนำเข้า SDK, ฟิลด์ manifest, setup API, hook และพฤติกรรม
การลงทะเบียนรันไทม์

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกนำออกในรุ่น major ในอนาคต
  Plugin ที่ยังนำเข้าจากพื้นผิวเหล่านี้จะเสียเมื่อถึงเวลานั้น
  การลงทะเบียน embedded extension factory แบบเดิมไม่โหลดแล้วในปัจจุบัน
</Warning>

## เหตุผลที่เปลี่ยนแปลง

แนวทางเดิมก่อปัญหา:

- **เริ่มต้นช้า** - การนำเข้า helper หนึ่งตัวโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบตัว
- **dependency แบบวงจร** - การส่งออกซ้ำแบบกว้างทำให้สร้างวงจรการนำเข้าได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีบอกว่า export ใดเสถียรหรือเป็น internal

Plugin SDK สมัยใหม่แก้ปัญหานี้: แต่ละเส้นทางนำเข้า (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กที่แยกตัวเอง มีวัตถุประสงค์ชัดเจน และมี contract ที่ระบุในเอกสาร

ช่องทาง convenience seam ของ provider แบบเดิมสำหรับ channel ที่มาพร้อมชุดก็ถูกนำออกแล้วเช่นกัน
helper seam ที่ติดแบรนด์ channel เป็นทางลัดส่วนตัวของ mono-repo ไม่ใช่
contract Plugin ที่เสถียร ให้ใช้ subpath SDK ทั่วไปแบบแคบแทน ภายใน workspace ของ Plugin
ที่มาพร้อมชุด ให้เก็บ helper ที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ
`runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider ที่มาพร้อมชุดปัจจุบัน:

- Anthropic เก็บ helper สตรีมเฉพาะ Claude ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตัวเอง
- OpenAI เก็บ builder ของ provider, helper โมเดลเริ่มต้น และ builder provider
  แบบ realtime ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ builder ของ provider และ helper onboarding/config ไว้ใน
  `api.ts` ของตัวเอง

## แผนย้าย Talk และเสียงแบบเรียลไทม์

โค้ดเสียงแบบเรียลไทม์ โทรศัพท์ การประชุม และ Talk บนเบราว์เซอร์กำลังย้ายจาก
การทำบัญชี turn เฉพาะพื้นผิวไปยังตัวควบคุมเซสชัน Talk ร่วมที่ export โดย
`openclaw/plugin-sdk/realtime-voice` ตัวควบคุมใหม่นี้เป็นเจ้าของ envelope เหตุการณ์ Talk
ร่วม สถานะ turn ที่ active สถานะ capture สถานะ output-audio ประวัติเหตุการณ์ล่าสุด
และการปฏิเสธ stale-turn Plugin provider ควรยังคงเป็นเจ้าของเซสชัน realtime
เฉพาะ vendor ส่วน Plugin พื้นผิวควรยังคงเป็นเจ้าของ capture,
playback, telephony และความเฉพาะตัวของ meeting

การย้าย Talk นี้ตั้งใจให้ breaking-clean:

1. เก็บ primitive ของ controller/runtime ร่วมไว้ใน
   `plugin-sdk/realtime-voice`
2. ย้ายพื้นผิวที่มาพร้อมชุดไปยัง controller ร่วม: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime และ native push-to-talk
3. แทนที่กลุ่ม Talk RPC เก่าด้วย API สุดท้าย `talk.session.*` และ
   `talk.client.*`
4. ประกาศช่องเหตุการณ์ Talk แบบ live หนึ่งช่องใน Gateway
   `hello-ok.features.events`: `talk.event`
5. ลบ endpoint HTTP realtime เก่าและเส้นทาง override instruction ณ เวลา request ทั้งหมด

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่กำลัง
สร้าง adapter ระดับต่ำหรือ test fixture ให้ใช้ controller ร่วมเป็นหลัก
เพื่อให้เหตุการณ์ที่ผูกกับ turn ไม่สามารถถูกส่งออกโดยไม่มี turn id, การเรียก `turnEnd` /
`turnCancel` ที่ stale ไม่สามารถล้าง active turn ที่ใหม่กว่า และเหตุการณ์ lifecycle
ของ output-audio ยังคงสอดคล้องกันใน telephony, meetings, browser relay, managed-room
handoff และไคลเอนต์ Talk แบบ native

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

เซสชัน WebRTC/provider-websocket ที่เบราว์เซอร์เป็นเจ้าของใช้ `talk.client.create`
เพราะเบราว์เซอร์เป็นเจ้าของการเจรจากับ provider และ media transport ขณะที่
Gateway เป็นเจ้าของ credentials, instructions และนโยบายเครื่องมือ `talk.session.*` คือ
พื้นผิวร่วมที่ Gateway จัดการสำหรับ gateway-relay realtime, gateway-relay
transcription และเซสชัน STT/TTS แบบ native ของ managed-room

config เดิมที่วางตัวเลือก realtime ไว้ข้าง `talk.provider` /
`talk.providers` ควรถูกซ่อมด้วย `openclaw doctor --fix`; รันไทม์ Talk
จะไม่ตีความ config provider ของ speech/TTS เป็น config provider แบบ realtime ใหม่

ชุดผสม `talk.session.create` ที่รองรับถูกตั้งใจให้มีขนาดเล็ก:

| โหมด            | Transport       | Brain           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียง provider แบบ full-duplex ถูกเชื่อมผ่าน Gateway; การเรียกเครื่องมือถูก route ผ่านเครื่องมือ agent-consult      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | เฉพาะ streaming STT; caller ส่งเสียง input และรับเหตุการณ์ transcript                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ห้อง native/client | ห้องสไตล์ push-to-talk และ walkie-talkie ที่ client เป็นเจ้าของ capture/playback และ Gateway เป็นเจ้าของสถานะ turn |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ห้อง native/client | โหมดห้องสำหรับ admin เท่านั้นสำหรับพื้นผิว first-party ที่เชื่อถือได้ซึ่ง execute action เครื่องมือของ Gateway โดยตรง                  |

แผนที่ method ที่ถูกนำออก:

| เก่า                              | ใหม่                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` หรือ `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

คำศัพท์ควบคุมแบบรวมตั้งใจให้แคบเช่นกัน:

  | เมธอด                          | ใช้กับ                                              | สัญญา                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | ผนวกชิ้นส่วนเสียง PCM แบบ base64 เข้ากับเซสชันของผู้ให้บริการที่เป็นของการเชื่อมต่อ Gateway เดียวกัน                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่มรอบผู้ใช้แบบ managed-room                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | จบรอบที่ใช้งานอยู่หลังจากตรวจสอบ stale-turn                                                                                                                                         |
  | `talk.session.cancelTurn`       | เซสชันทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงาน capture/provider/agent/TTS ที่ใช้งานอยู่สำหรับรอบหนึ่ง                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุดเอาต์พุตเสียงของผู้ช่วยโดยไม่จำเป็นต้องจบรอบของผู้ใช้                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำการเรียกเครื่องมือของผู้ให้บริการที่ relay ส่งออกมาให้เสร็จสมบูรณ์; ส่ง `options.willContinue` สำหรับเอาต์พุตระหว่างทาง หรือ `options.suppressResponse` เพื่อทำให้การเรียกสมบูรณ์โดยไม่มีคำตอบผู้ช่วยเพิ่มเติม |
  | `talk.session.steer`            | เซสชัน Talk ที่มี agent หนุนหลัง                              | ส่งการควบคุมด้วยเสียงแบบ `status`, `steer`, `cancel` หรือ `followup` ไปยัง embedded run ที่ใช้งานอยู่ซึ่ง resolve จากเซสชัน Talk                                                                |
  | `talk.session.close`            | เซสชันรวมทั้งหมด                                    | หยุดเซสชัน relay หรือเพิกถอนสถานะ managed-room แล้วลืม unified session id                                                                                                    |

  อย่าเพิ่มกรณีพิเศษของผู้ให้บริการหรือแพลตฟอร์มใน core เพื่อให้สิ่งนี้ทำงาน
  Core เป็นเจ้าของความหมายของเซสชัน Talk Plugin ของผู้ให้บริการเป็นเจ้าของการตั้งค่าเซสชันของ vendor
  voice-call และ Google Meet เป็นเจ้าของอะแดปเตอร์โทรศัพท์/การประชุม Browser และแอป native
  เป็นเจ้าของ UX การจับ/เล่นอุปกรณ์

  ## นโยบายความเข้ากันได้

  สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้จะทำตามลำดับนี้:

  1. เพิ่มสัญญาใหม่
  2. คงพฤติกรรมเก่าไว้โดยเดินผ่านอะแดปเตอร์ความเข้ากันได้
  3. ส่ง diagnostic หรือคำเตือนที่ระบุชื่อ path เก่าและสิ่งที่ใช้แทน
  4. ครอบคลุมทั้งสอง path ในการทดสอบ
  5. จัดทำเอกสารการเลิกใช้และ path การย้าย
  6. ลบออกหลังจากหน้าต่างเวลาการย้ายที่ประกาศไว้เท่านั้น โดยปกติใน major release

  ผู้ดูแลสามารถ audit คิวการย้ายปัจจุบันด้วย
  `pnpm plugins:boundary-report` ใช้ `pnpm plugins:boundary-report:summary` สำหรับ
  จำนวนแบบกระชับ, `--owner <id>` สำหรับ Plugin หนึ่งตัวหรือเจ้าของความเข้ากันได้หนึ่งราย และ
  `pnpm plugins:boundary-report:ci` เมื่อ CI gate ควร fail เมื่อมีรายการ
  ความเข้ากันได้ที่ครบกำหนด, การ import SDK ที่สงวนไว้ข้ามเจ้าของ, หรือ subpath SDK ที่สงวนไว้แต่ไม่ได้ใช้
  รายงานจะจัดกลุ่มรายการความเข้ากันได้ที่เลิกใช้แล้ว
  ตามวันที่ลบ นับการอ้างอิงในโค้ด/เอกสารภายในเครื่อง
  แสดงการ import SDK ที่สงวนไว้ข้ามเจ้าของ และสรุป private
  memory-host SDK bridge เพื่อให้การล้างความเข้ากันได้ชัดเจนแทนที่จะ
  พึ่งพาการค้นหาเฉพาะหน้า subpath SDK ที่สงวนไว้ต้องมีการใช้งานของเจ้าของที่ติดตามไว้;
  helper export ที่สงวนไว้แต่ไม่ได้ใช้ควรถูกลบออกจาก SDK สาธารณะ

  หาก manifest field ยังถูกรับอยู่ ผู้เขียน Plugin สามารถใช้งานต่อได้จนกว่า
  เอกสารและ diagnostic จะบอกเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้
  สิ่งทดแทนที่ระบุไว้ในเอกสาร แต่ Plugin ที่มีอยู่ไม่ควรพังระหว่าง
  minor release ตามปกติ

  ## วิธีย้าย

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Plugin ที่ bundled ควรหยุดเรียก
    `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ควรใช้ config ที่
    ถูกส่งเข้ามาใน active call path อยู่แล้ว handler ที่มีอายุยาวซึ่งต้องการ
    snapshot ของ process ปัจจุบันสามารถใช้ `api.runtime.config.current()` ได้ เครื่องมือ agent
    ที่มีอายุยาวควรใช้ `ctx.getRuntimeConfig()` ของ tool context ภายใน
    `execute` เพื่อให้เครื่องมือที่สร้างก่อนการเขียน config ยังเห็น
    runtime config ที่รีเฟรชแล้ว

    การเขียน config ต้องผ่าน transactional helpers และเลือก
    นโยบายหลังเขียน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อ caller รู้ว่า
    การเปลี่ยนแปลงต้องใช้การ restart gateway แบบสะอาด และ
    `afterWrite: { mode: "none", reason: "..." }` เฉพาะเมื่อ caller เป็นเจ้าของ
    งาน follow-up และตั้งใจต้องการระงับ reload planner
    ผลลัพธ์ mutation มีสรุป `followUp` แบบ typed สำหรับการทดสอบและ logging;
    gateway ยังคงรับผิดชอบการนำไปใช้หรือกำหนดเวลา restart
    `loadConfig` และ `writeConfigFile` ยังคงอยู่ในฐานะ helper ความเข้ากันได้ที่เลิกใช้แล้ว
    สำหรับ Plugin ภายนอกในช่วงหน้าต่างการย้าย และเตือนหนึ่งครั้งด้วย
    compatibility code `runtime-config-load-write` Plugin ที่ bundled และโค้ด runtime
    ใน repo ได้รับการป้องกันด้วย scanner guardrails ใน
    `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งาน Plugin production ใหม่
    จะ fail ทันที, การเขียน config โดยตรงจะ fail, เมธอด gateway server ต้องใช้
    runtime snapshot ของ request, helper runtime channel send/action/client
    ต้องรับ config จาก boundary ของตน และโมดูล runtime ที่มีอายุยาวมี
    การเรียก `loadConfig()` แบบ ambient ที่อนุญาตเป็นศูนย์

    โค้ด Plugin ใหม่ควรหลีกเลี่ยงการ import broad
    compatibility barrel `openclaw/plugin-sdk/config-runtime` ด้วย ใช้
    subpath SDK แบบแคบที่ตรงกับงาน:

    | ความต้องการ | Import |
    | --- | --- |
    | ประเภท config เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertion ของ config ที่โหลดแล้วและการ lookup config ของ plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่าน snapshot runtime ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียน config | `openclaw/plugin-sdk/config-mutation` |
    | helper session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config ตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helper runtime ของนโยบายกลุ่ม | `openclaw/plugin-sdk/runtime-group-policy` |
    | การ resolve secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | การ override model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin ที่ bundled และการทดสอบของ Plugin เหล่านั้นถูก scanner-guarded ไม่ให้ใช้ broad
    barrel เพื่อให้ import และ mock อยู่เฉพาะกับพฤติกรรมที่ต้องใช้ broad
    barrel ยังคงมีอยู่เพื่อความเข้ากันได้ภายนอก แต่โค้ดใหม่ไม่ควร
    พึ่งพามัน

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Plugin ที่ bundled ต้องแทนที่ handler tool-result แบบ
    `api.registerEmbeddedExtensionFactory(...)` ที่ใช้เฉพาะ embedded-runner ด้วย
    middleware ที่ไม่ขึ้นกับ runtime

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    อัปเดต manifest ของ Plugin พร้อมกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin ที่ติดตั้งแล้วสามารถลงทะเบียน tool-result middleware ได้เช่นกันเมื่อ
    ถูกเปิดใช้อย่างชัดเจนและประกาศทุก runtime เป้าหมายใน
    `contracts.agentToolResultMiddleware` การลงทะเบียน middleware ที่ติดตั้งแล้วแต่
    ไม่ได้ประกาศจะถูกปฏิเสธ

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugin ช่องทางที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบ native ผ่าน
    `approvalCapability.nativeRuntime` รวมกับ registry runtime-context ที่ใช้ร่วมกัน

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery เฉพาะ approval ออกจาก wiring เดิม `plugin.auth` /
      `plugin.approvals` และไปไว้ที่ `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจากสัญญา channel-plugin
      สาธารณะแล้ว; ย้าย field delivery/native/render ไปไว้ที่ `approvalCapability`
    - `plugin.auth` ยังคงอยู่สำหรับ flow login/logout ของช่องทางเท่านั้น; hook auth
      ของ approval ที่นั่นจะไม่ถูกอ่านโดย core อีกต่อไป
    - ลงทะเบียน runtime object ที่ช่องทางเป็นเจ้าของ เช่น client, token หรือ Bolt
      app ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่งประกาศ reroute ที่ Plugin เป็นเจ้าของจาก native approval handler;
      ตอนนี้ core เป็นเจ้าของประกาศ routed-elsewhere จากผลลัพธ์การส่งจริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้ระบุ
      surface `createPluginRuntime().channel` จริง stub บางส่วนจะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับ layout approval capability ปัจจุบัน

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` wrapper Windows
    `.cmd`/`.bat` ที่ resolve ไม่ได้ตอนนี้จะ fail closed เว้นแต่คุณจะส่ง
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
    `allowShellFallback` และจัดการ error ที่ throw ออกมาแทน

  </Step>

  <Step title="Find deprecated imports">
    ค้นหา import จาก surface ที่เลิกใช้แล้วอย่างใดอย่างหนึ่งใน Plugin ของคุณ:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    export แต่ละรายการจาก surface เก่าจะ map ไปยัง path import สมัยใหม่ที่เฉพาะเจาะจง:

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

    สำหรับ helper ฝั่ง host ให้ใช้ plugin runtime ที่ inject เข้ามาแทนการ import
    โดยตรง:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับตัวช่วยบริดจ์รุ่นเก่าอื่นๆ ด้วย:

    | อิมพอร์ตเก่า | รายการเทียบเท่าสมัยใหม่ |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ตัวช่วยที่เก็บเซสชัน | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก
    แต่โค้ดใหม่ควรอิมพอร์ตพื้นผิวตัวช่วยที่เจาะจงซึ่งต้องใช้จริง:

    | ความต้องการ | อิมพอร์ต |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยการปลุก เหตุการณ์ และการมองเห็นของ Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการส่งมอบที่ค้างอยู่ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | เทเลเมทรีกิจกรรมช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคชกำจัดรายการซ้ำในหน่วยความจำ | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยเส้นทางไฟล์/สื่อในเครื่องที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` ที่รับรู้ dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วยพร็อกซีและ `fetch` ที่มีการป้องกัน | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย dispatcher สำหรับ SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/การแก้ไขการอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | ตัวช่วยเพย์โหลดการตอบกลับการอนุมัติและคำสั่ง | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของการขนส่ง | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | การทำงานพร้อมกันของงาน async แบบมีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การบังคับชนิดเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อก async ภายในโปรเซส | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่บันเดิลมาถูกสแกนเนอร์ป้องกันไม่ให้ใช้ `infra-runtime` ดังนั้นโค้ดในรีโป
    จึงไม่สามารถถอยกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="Migrate channel route helpers">
    โค้ดเส้นทางช่องทางใหม่ควรใช้ `openclaw/plugin-sdk/channel-route`
    ชื่อ route-key และ comparable-target รุ่นเก่ายังคงอยู่เป็นนามแฝงเพื่อความเข้ากันได้
    ระหว่างช่วงการย้าย แต่ Plugin ใหม่ควรใช้ชื่อเส้นทาง
    ที่อธิบายพฤติกรรมโดยตรง:

    | ตัวช่วยเก่า | ตัวช่วยสมัยใหม่ |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วยเส้นทางสมัยใหม่จะทำให้ `{ channel, to, accountId, threadId }`
    เป็นมาตรฐานอย่างสม่ำเสมอทั้งการอนุมัติแบบเนทีฟ การระงับการตอบกลับ การกำจัดรายการซ้ำขาเข้า
    การส่งมอบ Cron และการกำหนดเส้นทางเซสชัน

    อย่าเพิ่มการใช้งานใหม่ของ `ChannelMessagingAdapter.parseExplicitTarget` หรือ
    ตัวช่วย loaded-route ที่ใช้พาร์เซอร์หนุนหลัง (`parseExplicitTargetForLoadedChannel`
    หรือ `resolveRouteTargetForLoadedChannel`) หรือ
    `resolveChannelRouteTargetWithParser(...)` จาก `plugin-sdk/channel-route`
    ฮุกเหล่านี้เลิกใช้แล้วและยังคงอยู่เฉพาะสำหรับ Plugin รุ่นเก่าในช่วง
    การย้ายเท่านั้น Plugin ช่องทางใหม่ควรใช้
    `messaging.targetResolver.resolveTarget(...)` สำหรับการทำให้ id เป้าหมายเป็นมาตรฐาน
    และ fallback เมื่อไม่พบไดเรกทอรี ใช้ `messaging.inferTargetChatType(...)` เมื่อแกนหลัก
    ต้องการชนิด peer ตั้งแต่ต้น และใช้ `messaging.resolveOutboundSessionRoute(...)`
    สำหรับเซสชันแบบเนทีฟของผู้ให้บริการและอัตลักษณ์ของเธรด

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงเส้นทางอิมพอร์ต

  <Accordion title="ตารางเส้นทาง import ที่พบบ่อย">
  | เส้นทาง import | วัตถุประสงค์ | รายการส่งออกหลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยรายการเข้า Plugin แบบมาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | การ re-export แบบรวมศูนย์เดิมสำหรับนิยาม/ตัวสร้างรายการเข้าของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | การส่งออกสคีมาคอนฟิกราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยรายการเข้าผู้ให้บริการรายเดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้างรายการเข้าช่องทางแบบเฉพาะจุด | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดตั้งค่าที่ใช้ร่วมกัน | ตัวแปลการตั้งค่า, พรอมป์ allowlist, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | ตัวช่วยรันไทม์ช่วงตั้งค่า | `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่ import ได้อย่างปลอดภัย, ตัวช่วย lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าแบบมอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | นามแฝงอะแดปเตอร์การตั้งค่าที่เลิกใช้แล้ว | ใช้ `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/คอนฟิก/action-gate |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การปรับ account-id ให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + fallback ค่าเริ่มต้น |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบจำกัดขอบเขต | ตัวช่วยรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | อะแดปเตอร์วิซาร์ดตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเดินสายคำนำหน้าการตอบกลับ, สถานะกำลังพิมพ์, และการส่งจากแหล่งที่มา | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | factory อะแดปเตอร์คอนฟิกและตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมาคอนฟิก | primitive สคีมาคอนฟิกช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไปเท่านั้น |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมาคอนฟิกที่บันเดิลมา | เฉพาะ Plugin ที่บันเดิลและดูแลโดย OpenClaw เท่านั้น; Plugin ใหม่ต้องกำหนดสคีมาภายใน Plugin เอง |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมาคอนฟิกที่บันเดิลและเลิกใช้แล้ว | นามแฝงความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่บันเดิลและยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคอนฟิกคำสั่ง Telegram | การปรับชื่อคำสั่งให้เป็นรูปแบบมาตรฐาน, การตัดคำอธิบาย, การตรวจสอบรายการซ้ำ/ข้อขัดแย้ง |
  | `plugin-sdk/channel-policy` | การ resolve นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | ตัวช่วยซองขาเข้า | ตัวช่วย route ที่ใช้ร่วมกัน + ตัวช่วยสร้างซอง |
  | `plugin-sdk/channel-inbound` | ตัวช่วยรับขาเข้า | การสร้างบริบท, การจัดรูปแบบ, ราก, runner, การ dispatch การตอบกลับที่เตรียมไว้, และ predicate การ dispatch |
  | `plugin-sdk/messaging-targets` | เส้นทาง import การแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมายทั่วไป, `plugin-sdk/channel-route` สำหรับการเปรียบเทียบ route, และ `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` ที่ Plugin เป็นเจ้าของสำหรับการ resolve เป้าหมายเฉพาะผู้ให้บริการ |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | ตัวช่วย lifecycle ข้อความขาออก | อะแดปเตอร์ข้อความ, ใบรับ, ตัวช่วยส่งแบบทนทาน, ตัวช่วยพรีวิวสด/สตรีมมิง, ตัวเลือกการตอบกลับ, ตัวช่วย lifecycle, อัตลักษณ์ขาออก, และการวางแผน payload |
  | `plugin-sdk/channel-streaming` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยการผูกเธรด | lifecycle การผูกเธรดและตัวช่วยอะแดปเตอร์ |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย payload สื่อเดิม | ตัวสร้าง payload สื่อของเอเจนต์สำหรับเลย์เอาต์ฟิลด์เดิม |
  | `plugin-sdk/channel-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว | ยูทิลิตีรันไทม์ช่องทางเดิมเท่านั้น |
  | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การส่ง | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | ที่จัดเก็บ Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วยรันไทม์แบบกว้าง | ตัวช่วยรันไทม์/การบันทึก/การสำรองข้อมูล/การติดตั้ง Plugin |
  | `plugin-sdk/runtime-env` | ตัวช่วย env รันไทม์แบบจำกัดขอบเขต | Logger/runtime env, timeout, retry, และตัวช่วย backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วยรันไทม์ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/ฮุก/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline ฮุก | ตัวช่วย pipeline Webhook/ฮุกภายในที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วยรันไทม์แบบ lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วยโปรเซส | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วยรันไทม์ CLI | การจัดรูปแบบคำสั่ง, การรอ, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | ไคลเอนต์ Gateway, ตัวช่วยเริ่มต้นเมื่อ event loop พร้อม, การ resolve โฮสต์ LAN ที่ประกาศ, และตัวช่วยแพตช์สถานะช่องทาง |
  | `plugin-sdk/config-runtime` | shim ความเข้ากันได้ของคอนฟิกที่เลิกใช้แล้ว | ควรใช้ `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram ที่มี fallback เสถียรเมื่อพื้นผิวสัญญา Telegram ที่บันเดิลไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วยพรอมป์การอนุมัติ | payload การอนุมัติ exec/Plugin, ตัวช่วย capability/profile การอนุมัติ, ตัวช่วย routing/runtime การอนุมัติแบบ native, และการจัดรูปแบบเส้นทางแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การ resolve ผู้อนุมัติ, auth การกระทำในแชตเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วยไคลเอนต์การอนุมัติ | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบ native |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วยการส่งมอบการอนุมัติ | อะแดปเตอร์ capability/การส่งมอบการอนุมัติแบบ native |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย Gateway การอนุมัติ | ตัวช่วย resolve Gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยอะแดปเตอร์การอนุมัติ | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ native น้ำหนักเบาสำหรับ entrypoint ช่องทาง hot |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย handler การอนุมัติ | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างกว่า; ควรใช้ขอบเขตอะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วยผูกเป้าหมาย/บัญชีการอนุมัติแบบ native |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยการตอบกลับการอนุมัติ | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย runtime-context ของช่องทาง | ตัวช่วย register/get/watch runtime-context ของช่องทางทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | ความไว้วางใจที่ใช้ร่วมกัน, gating DM, ตัวช่วยไฟล์/พาธที่จำกัดอยู่ภายในราก, เนื้อหาภายนอก, และตัวช่วยรวบรวมความลับ |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วยนโยบาย allowlist โฮสต์และเครือข่ายส่วนตัว |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วยรันไทม์ SSRF | pinned-dispatcher, guarded fetch, ตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วยเหตุการณ์ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | การปลุก Heartbeat, เหตุการณ์, และตัวช่วยการมองเห็น |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิวการส่งมอบ | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe | แคช dedupe ในหน่วยความจำ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยการเข้าถึงไฟล์ | ตัวช่วยพาธไฟล์/สื่อในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของ transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยนโยบายการอนุมัติ exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | ตัวช่วยแคชที่มีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วย gating การวินิจฉัย | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วยกราฟข้อผิดพลาด |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy ที่ห่อไว้ | `resolveFetch`, ตัวช่วย proxy, ตัวช่วยตัวเลือก EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยปรับโฮสต์ให้เป็นรูปแบบมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย retry | `RetryConfig`, `retryAsync`, runner นโยบาย |
  | `plugin-sdk/allow-from` | การจัดรูปแบบ allowlist และการแมปอินพุต | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | ตัวช่วย gating คำสั่งและพื้นผิวคำสั่ง | `resolveControlCommandGate`, ตัวช่วยการอนุญาตผู้ส่ง, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | renderer สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์อินพุตความลับ | ตัวช่วยอินพุตความลับ |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | ยูทิลิตีเป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วย guard บอดี Webhook | ตัวช่วยอ่าน/จำกัดบอดีคำขอ |
  | `plugin-sdk/reply-runtime` | รันไทม์การตอบกลับที่ใช้ร่วมกัน | การ dispatch ขาเข้า, Heartbeat, ตัววางแผนการตอบกลับ, การแบ่ง chunk |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch การตอบกลับแบบจำกัดขอบเขต | Finalize, การ dispatch ผู้ให้บริการ, และตัวช่วยป้ายกำกับบทสนทนา |
  | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับ | `createChannelHistoryWindow`; การส่งออกความเข้ากันได้ของตัวช่วย map ที่เลิกใช้แล้ว เช่น `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, และ `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reference การตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วย chunk การตอบกลับ | ตัวช่วยแบ่ง chunk ข้อความ/markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วย session store | ตัวช่วยพาธ store + updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วยพาธ state | ตัวช่วยไดเรกทอรี state และ OAuth |
  | `plugin-sdk/routing` | ตัวช่วยการกำหนดเส้นทาง/คีย์เซสชัน | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยปรับคีย์เซสชันให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี, ค่าเริ่มต้นของสถานะรันไทม์, ตัวช่วยเมตาดาต้าของปัญหา |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วยตัวแก้เป้าหมาย | ตัวช่วยตัวแก้เป้าหมายที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับสตริงให้อยู่ในรูปแบบมาตรฐาน | ตัวช่วยปรับ slug/สตริงให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL คำขอ | แยก URL แบบสตริงจากอินพุตที่มีลักษณะคล้ายคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบจับเวลา | ตัวรันคำสั่งแบบจับเวลาพร้อม stdout/stderr ที่ปรับให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับเครื่องมือ/CLI |
  | `plugin-sdk/tool-payload` | การแยกเพย์โหลดของเครื่องมือ | แยกเพย์โหลดที่ปรับให้อยู่ในรูปแบบมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์ของเครื่องมือ |
  | `plugin-sdk/tool-send` | การแยกการส่งของเครื่องมือ | แยกฟิลด์เป้าหมายการส่งแบบมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวช่วย logger ของระบบย่อยและการปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ชนิดการตอบกลับข้อความ | ชนิดเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการในเครื่อง/โฮสต์เองแบบคัดสรร | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการที่โฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการที่โฮสต์เองและเข้ากันได้กับ OpenAI แบบเฉพาะทาง | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการที่โฮสต์เองชุดเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการยืนยันตัวตนผู้ให้บริการขณะรันไทม์ | ตัวช่วยแก้ค่า API-key ของรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยตั้งค่า API-key ของผู้ให้บริการ | ตัวช่วยเริ่มต้นใช้งาน/เขียนโปรไฟล์สำหรับ API-key |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยการเลือกผู้ให้บริการ | การเลือกผู้ให้บริการแบบกำหนดค่าไว้หรืออัตโนมัติ และการรวมค่ากำหนดค่าผู้ให้บริการดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วยตัวแปรสภาพแวดล้อมของผู้ให้บริการ | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/การเล่นซ้ำของผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายการเล่นซ้ำที่ใช้ร่วมกัน, ตัวช่วยปลายทางผู้ให้บริการ และตัวช่วยปรับ model-id ให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์การเริ่มต้นใช้งานผู้ให้บริการ | ตัวช่วยกำหนดค่าการเริ่มต้นใช้งาน |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/ปลายทางทั่วไปของผู้ให้บริการ รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยกำหนดค่า web-search ของผู้ให้บริการ | ตัวช่วยกำหนดค่า/ข้อมูลประจำตัว web-search แบบจำกัดขอบเขตสำหรับผู้ให้บริการที่ไม่ต้องเดินสาย plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของผู้ให้บริการ | ตัวช่วยสัญญากำหนดค่า/ข้อมูลประจำตัว web-search แบบจำกัดขอบเขต เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลประจำตัวตามขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยของ DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งานผู้ให้บริการอื่นๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วยตัวห่อสตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดตัวห่อสตรีม และตัวช่วยตัวห่อที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วยทรานสปอร์ตของผู้ให้บริการ | ตัวช่วยทรานสปอร์ตดั้งเดิมของผู้ให้บริการ เช่น guarded fetch, การแยกข้อความผลลัพธ์เครื่องมือ, การแปลงข้อความทรานสปอร์ต และสตรีมเหตุการณ์ทรานสปอร์ตที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิว async แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึง/แปลง/จัดเก็บสื่อ, การตรวจสอบมิติวิดีโอที่อิง ffprobe และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน, การเลือกผู้สมัคร และข้อความเมื่อไม่มีโมเดลสำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยการทำความเข้าใจสื่อ | ชนิดผู้ให้บริการการทำความเข้าใจสื่อ รวมถึงการส่งออกตัวช่วยภาพ/เสียงสำหรับฝั่งผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | การส่งออกความเข้ากันได้ของข้อความแบบกว้างที่เลิกใช้แล้ว | ใช้ `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` และ `logging-core` |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งข้อความเป็นชิ้น | ตัวช่วยแบ่งข้อความขาออกเป็นชิ้น |
  | `plugin-sdk/speech` | ตัวช่วยเสียงพูด | ชนิดผู้ให้บริการเสียงพูด รวมถึงตัวช่วย directive, registry, validation สำหรับฝั่งผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | แกนเสียงพูดที่ใช้ร่วมกัน | ชนิดผู้ให้บริการเสียงพูด, registry, directives, การปรับให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยการถอดเสียงแบบเรียลไทม์ | ชนิดผู้ให้บริการ, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ชนิดผู้ให้บริการ, ตัวช่วย registry/การแก้ค่า, ตัวช่วยเซสชัน bridge, คิวพูดตอบกลับของเอเจนต์ที่ใช้ร่วมกัน, การควบคุมเสียงของรันที่กำลังทำงาน, สุขภาพของทรานสคริปต์/เหตุการณ์, การลดเสียงสะท้อน, การจับคู่คำถาม consult, การประสาน forced-consult, การติดตามบริบทของเทิร์น, การติดตามกิจกรรมเอาต์พุต และตัวช่วย consult บริบทแบบเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วยสร้างภาพ | ชนิดผู้ให้บริการสร้างภาพ รวมถึงตัวช่วย asset ภาพ/data URL และตัวสร้างผู้ให้บริการภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | แกนการสร้างภาพที่ใช้ร่วมกัน | ชนิดการสร้างภาพ, failover, การยืนยันตัวตน และตัวช่วย registry |
  | `plugin-sdk/music-generation` | ตัวช่วยสร้างเพลง | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
  | `plugin-sdk/music-generation-core` | แกนการสร้างเพลงที่ใช้ร่วมกัน | ชนิดการสร้างเพลง, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วยสร้างวิดีโอ | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | แกนการสร้างวิดีโอที่ใช้ร่วมกัน | ชนิดการสร้างวิดีโอ, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การปรับ/ลดรูปเพย์โหลดการตอบกลับแบบโต้ตอบให้อยู่ในรูปแบบมาตรฐาน |
  | `plugin-sdk/channel-config-primitives` | primitive การกำหนดค่าช่องทาง | primitive ของสคีมากำหนดค่าช่องทางแบบจำกัดขอบเขต |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยเขียนค่ากำหนดช่องทาง | ตัวช่วยอนุญาตการเขียนค่ากำหนดช่องทาง |
  | `plugin-sdk/channel-plugin-common` | prelude ช่องทางที่ใช้ร่วมกัน | การส่งออก prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วยสแนปชอต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยกำหนดค่า allowlist | ตัวช่วยแก้ไข/อ่านค่ากำหนด allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วย guard Direct-DM | ตัวช่วยนโยบาย guard ก่อน crypto แบบจำกัดขอบเขต |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | primitive ของตัวช่วย passive-channel/status และ ambient proxy |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | registry เป้าหมาย Webhook และตัวช่วยติดตั้ง route |
  | `plugin-sdk/webhook-path` | นามแฝงพาธ Webhook ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/ในเครื่อง |
  | `plugin-sdk/zod` | การส่งออกซ้ำความเข้ากันได้ของ Zod ที่เลิกใช้แล้ว | นำเข้า `zod` จาก `zod` โดยตรง |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่บันเดิลมา | พื้นผิวตัวช่วยตัวจัดการหน่วยความจำ/การกำหนดค่า/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์ของเอนจินหน่วยความจำ | ฟาซาดรันไทม์ของดัชนี/การค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-embedding-registry` | registry embedding ของหน่วยความจำ | ตัวช่วย registry ผู้ให้บริการ embedding หน่วยความจำแบบเบา |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจิน foundation ของโฮสต์หน่วยความจำ | การส่งออกเอนจิน foundation ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจิน embedding ของโฮสต์หน่วยความจำ | สัญญา embedding หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการในเครื่อง และตัวช่วย batch/ระยะไกลทั่วไป; ผู้ให้บริการระยะไกลแบบเจาะจงอยู่ใน Plugin เจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | การส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจิน storage ของโฮสต์หน่วยความจำ | การส่งออกเอนจิน storage ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์หน่วยความจำ | ตัวช่วย query ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | นามแฝงเหตุการณ์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะโฮสต์หน่วยความจำ | ตัวช่วยสถานะโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์แกนของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | นามแฝงรันไทม์แกนของโฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อ vendor สำหรับตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | นามแฝงบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ | นามแฝงที่เป็นกลางต่อ vendor สำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | นามแฝงไฟล์/รันไทม์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown แบบจัดการแล้ว | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้กับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | ฟาซาดการค้นหา Active Memory | ฟาซาดรันไทม์ search-manager ของ active-memory แบบ lazy |
  | `plugin-sdk/memory-host-status` | นามแฝงสถานะโฮสต์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | ยูทิลิตีทดสอบ | barrel ความเข้ากันได้ที่เลิกใช้แล้วเฉพาะใน repo; ใช้พาธย่อยทดสอบเฉพาะทางใน repo เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยสำหรับการย้ายข้อมูลที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ของคอมไพเลอร์อยู่ที่
`scripts/lib/plugin-sdk-entrypoints.json`; package exports ถูกสร้างจาก
ชุดย่อยสาธารณะ

seam ตัวช่วยของ bundled-plugin ที่สงวนไว้ถูกเลิกใช้จาก export map ของ SDK
สาธารณะแล้ว ยกเว้น facade ความเข้ากันได้ที่มีเอกสารระบุไว้อย่างชัดเจน เช่น
shim `plugin-sdk/discord` ที่เลิกใช้แล้ว แต่ยังคงไว้สำหรับแพ็กเกจ
`@openclaw/discord@2026.3.13` ที่เผยแพร่แล้ว ตัวช่วยเฉพาะเจ้าของจะอยู่ภายใน
แพ็กเกจ Plugin ที่เป็นเจ้าของนั้น พฤติกรรม host ที่ใช้ร่วมกันควรย้ายผ่านสัญญา SDK
ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`

ใช้ import ที่แคบที่สุดซึ่งตรงกับงาน หากคุณหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถามผู้ดูแลว่า contract ทั่วไปใด
ควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้ที่มีผลอยู่

การเลิกใช้ที่แคบลงซึ่งใช้ข้าม SDK ของ Plugin, contract ของผู้ให้บริการ,
พื้นผิว runtime และ manifest แต่ละรายการยังใช้งานได้ในวันนี้ แต่จะถูกนำออก
ในรุ่น major ในอนาคต รายการใต้แต่ละหัวข้อจะ map API เก่าไปยังตัวแทนที่เป็น canonical

<AccordionGroup>
  <Accordion title="ตัวสร้างความช่วยเหลือ command-auth → command-status">
    **เก่า (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม, export เดิม
    เพียงแต่ import จาก subpath ที่แคบกว่า `command-auth`
    re-export สิ่งเหล่านี้เป็น compat stub

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วย gating สำหรับ mention → resolveInboundMentionDecision">
    **เก่า**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`.

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` - คืนค่าเป็น
    อ็อบเจกต์ decision เดียว แทนการเรียกสองส่วนแยกกัน

    Plugin ช่องทางปลายน้ำ (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนไปใช้แล้ว

  </Accordion>

  <Accordion title="shim runtime ของช่องทางและตัวช่วย actions ของช่องทาง">
    `openclaw/plugin-sdk/channel-runtime` เป็น shim ความเข้ากันได้สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่า import จากโค้ดใหม่ ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียนอ็อบเจกต์
    runtime

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions`
    ถูกเลิกใช้พร้อมกับ export ช่องทางแบบ "actions" ดิบ ให้เปิดเผย capability
    ผ่านพื้นผิว `presentation` เชิงความหมายแทน - Plugin ช่องทาง
    ประกาศสิ่งที่เรนเดอร์ (การ์ด, ปุ่ม, select) แทนชื่อ action ดิบที่ยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของผู้ให้บริการค้นหาเว็บ → createTool() บน Plugin">
    **เก่า**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`.

    **ใหม่**: implement `createTool(...)` โดยตรงบน Plugin ของผู้ให้บริการ
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน tool wrapper อีกต่อไป

  </Accordion>

  <Accordion title="envelope ช่องทางแบบ plaintext → BodyForAgent">
    **เก่า**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้าง envelope prompt
    plaintext แบบแบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อก user-context แบบมีโครงสร้าง
    Plugin ช่องทางแนบ metadata การ routing (thread, topic, reply-to, reactions)
    เป็นฟิลด์ที่มี type แทนการต่อรวมเข้าไปในสตริง prompt ตัวช่วย
    `formatAgentEnvelope(...)` ยังรองรับสำหรับ envelope ที่สังเคราะห์ขึ้น
    เพื่อฝั่งผู้ช่วย แต่ envelope plaintext ขาเข้ากำลังจะถูกยกเลิก

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ Plugin
    ช่องทางแบบกำหนดเองใดๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **เก่า**: `api.on("deactivate", handler)`.

    **ใหม่**: `api.on("gateway_stop", handler)`. event และ context เป็น contract
    cleanup ตอน shutdown เดียวกัน มีเพียงชื่อ hook ที่เปลี่ยน

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` ยังคงเชื่อมไว้เป็น alias ความเข้ากันได้ที่เลิกใช้แล้วจนถึงหลัง
    2026-08-16

  </Accordion>

  <Accordion title="hook subagent_spawning → การผูก thread ของ core">
    **เก่า**: `api.on("subagent_spawning", handler)` ที่คืนค่า
    `threadBindingReady` หรือ `deliveryOrigin`.

    **ใหม่**: ให้ core เตรียมการผูก subagent แบบ `thread: true` ผ่าน adapter
    session-binding ของช่องทาง ใช้ `api.on("subagent_spawned", handler)`
    เฉพาะสำหรับการสังเกตหลังเปิดตัว

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` และ
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ยังคงเป็นเพียง
    พื้นผิวความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ Plugin ภายนอกย้ายระบบ

  </Accordion>

  <Accordion title="type การค้นพบผู้ให้บริการ → type catalog ผู้ให้บริการ">
    type alias สำหรับ discovery สี่รายการตอนนี้เป็น wrapper บางๆ เหนือ
    type ยุค catalog:

    | alias เก่า                 | type ใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง static bag `ProviderCapabilities` แบบเดิม - Plugin ผู้ให้บริการ
    ควรใช้ hook ผู้ให้บริการที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas` และ `wrapStreamFn` แทนอ็อบเจกต์ static

  </Accordion>

  <Accordion title="hook นโยบาย Thinking → resolveThinkingProfile">
    **เก่า** (hook แยกกันสามรายการบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`.

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่คืนค่า
    `ProviderThinkingProfile` พร้อม `id` แบบ canonical, `label` ที่เป็น optional
    และรายการระดับที่จัดอันดับแล้ว OpenClaw จะ downgrade ค่าที่เก็บไว้ซึ่งล้าสมัย
    ตามอันดับ profile โดยอัตโนมัติ

    context มี `provider`, `modelId`, `reasoning` ที่ merge แล้วแบบ optional
    และ facts `compat` ของโมเดลที่ merge แล้วแบบ optional Plugin ผู้ให้บริการ
    สามารถใช้ facts จาก catalog เหล่านั้นเพื่อเปิดเผย profile เฉพาะโมเดล
    เฉพาะเมื่อ contract ของ request ที่กำหนดค่าไว้รองรับ

    implement hook เดียวแทนสาม hook hook แบบเดิมยังใช้งานได้ในช่วงเวลาเลิกใช้
    แต่จะไม่ถูกประกอบร่วมกับผลลัพธ์ profile

  </Accordion>

  <Accordion title="ผู้ให้บริการ auth ภายนอก → contracts.externalAuthProviders">
    **เก่า**: implement hook auth ภายนอกโดยไม่ประกาศผู้ให้บริการ
    ใน manifest ของ Plugin

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน manifest ของ Plugin
    **และ** implement `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="การค้นหา env-var ของผู้ให้บริการ → setup.providers[].envVars">
    ฟิลด์ manifest **เก่า**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **ใหม่**: mirror การค้นหา env-var เดียวกันเข้าไปใน `setup.providers[].envVars`
    บน manifest สิ่งนี้รวม metadata env สำหรับ setup/status ไว้ในที่เดียว
    และหลีกเลี่ยงการบูต runtime ของ Plugin เพียงเพื่อตอบการค้นหา env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน adapter ความเข้ากันได้
    จนกว่าช่วงเวลาเลิกใช้จะปิดลง

  </Accordion>

  <Accordion title="การลงทะเบียน Plugin หน่วยความจำ → registerMemoryCapability">
    **เก่า**: การเรียกแยกกันสามรายการ -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **ใหม่**: การเรียกเดียวบน API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    slot เดิม การเรียกลงทะเบียนเดียว ตัวช่วย prompt และ corpus แบบเพิ่มเติม
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="API ผู้ให้บริการ embedding ของหน่วยความจำ">
    **เก่า**: `api.registerMemoryEmbeddingProvider(...)` พร้อม
    `contracts.memoryEmbeddingProviders`.

    **ใหม่**: `api.registerEmbeddingProvider(...)` พร้อม
    `contracts.embeddingProviders`.

    contract ผู้ให้บริการ embedding ทั่วไปสามารถนำกลับมาใช้ซ้ำนอกหน่วยความจำได้
    และเป็นเส้นทางที่รองรับสำหรับผู้ให้บริการใหม่ API การลงทะเบียนเฉพาะหน่วยความจำ
    ยังคงเชื่อมไว้เป็นความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ผู้ให้บริการเดิมย้ายระบบ
    รายงานการตรวจสอบ Plugin จะรายงานการใช้งานที่ไม่ใช่ bundled เป็นหนี้ความเข้ากันได้

  </Accordion>

  <Accordion title="เปลี่ยนชื่อ type ของข้อความ session ของ subagent">
    type alias รุ่นเก่าสองรายการยังคง export จาก `src/plugins/runtime/types.ts`:

    | เก่า                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    method runtime `readSession` ถูกเลิกใช้เพื่อสนับสนุน
    `getSessionMessages` signature เดิม method เก่าจะเรียกต่อไปยัง method ใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เก่า**: `runtime.tasks.flow` (เอกพจน์) คืนค่า accessor task-flow แบบ live

    **ใหม่**: `runtime.tasks.managedFlows` คง runtime การ mutate TaskFlow
    ที่มีการจัดการไว้สำหรับ Plugin ที่สร้าง, อัปเดต, ยกเลิก หรือรันงานลูกจาก flow
    ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียงการอ่านแบบ DTO

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factory extension แบบฝังตัว → middleware ผลลัพธ์ tool ของ agent">
    ครอบคลุมไว้ใน "วิธีย้ายระบบ → ย้าย extension ผลลัพธ์ tool แบบฝังตัวไปยัง
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: เส้นทางเฉพาะ embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` ที่ถูกนำออก ถูกแทนที่ด้วย
    `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime ที่ชัดเจน
    ใน `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias บรรทัดเดียวสำหรับ `OpenClawConfig` ให้ใช้ชื่อ canonical

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้ระดับ extension (ภายใน Plugin ช่องทาง/ผู้ให้บริการแบบ bundled ภายใต้
`extensions/`) ถูกติดตามภายใน barrel `api.ts` และ `runtime-api.ts` ของแต่ละรายการเอง
สิ่งเหล่านี้ไม่กระทบ contract ของ Plugin ภายนอกและไม่ได้แสดงไว้ที่นี่
หากคุณ consume barrel ภายในของ bundled Plugin โดยตรง ให้อ่านคอมเมนต์การเลิกใช้
ใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การนำออก

| เมื่อใด                   | สิ่งที่เกิดขึ้น                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**                | ส่วนต่อประสานที่เลิกใช้แล้วจะแสดงคำเตือนขณะรัน                               |
| **รุ่นหลักถัดไป** | ส่วนต่อประสานที่เลิกใช้แล้วจะถูกลบออก; Plugin ที่ยังใช้งานอยู่จะล้มเหลว |

Plugin หลักทั้งหมดได้รับการย้ายแล้ว Plugin ภายนอกควรย้าย
ก่อนรุ่นหลักถัดไป

## การระงับคำเตือนชั่วคราว

ตั้งค่าตัวแปรสภาพแวดล้อมเหล่านี้ระหว่างที่คุณทำงานย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นช่องทางเลี่ยงชั่วคราว ไม่ใช่วิธีแก้ปัญหาถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงการนำเข้า subpath แบบเต็ม
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การสร้าง Plugin ผู้ให้บริการ
- [ภายในของ Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) - ข้อมูลอ้างอิงสคีมาแมนิเฟสต์
