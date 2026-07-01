---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ไปเป็นสถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง Plugin SDK สมัยใหม่
title: การย้ายข้อมูล Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:48:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างไปสู่สถาปัตยกรรม Plugin
สมัยใหม่ที่มีการนำเข้าแบบเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณสร้างขึ้นก่อน
สถาปัตยกรรมใหม่ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยน

ระบบ Plugin เดิมมีพื้นผิวแบบเปิดกว้างสองส่วนที่ทำให้ Plugin สามารถนำเข้า
ทุกอย่างที่ต้องการจากจุดเข้าใช้งานเดียว:

- **`openclaw/plugin-sdk/compat`** - การนำเข้าเดียวที่ re-export ตัวช่วยหลายสิบรายการ
  ถูกเพิ่มเข้ามาเพื่อให้ Plugin แบบ hook รุ่นเก่ายังคงทำงานได้ระหว่างที่กำลังสร้าง
  สถาปัตยกรรม Plugin ใหม่
- **`openclaw/plugin-sdk/infra-runtime`** - barrel ตัวช่วย runtime แบบกว้างที่ผสม
  เหตุการณ์ระบบ, สถานะ Heartbeat, คิวการส่งมอบ, ตัวช่วย fetch/proxy,
  ตัวช่วยไฟล์, ชนิดการอนุมัติ และยูทิลิตีที่ไม่เกี่ยวข้องกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel ความเข้ากันได้ของ config แบบกว้าง
  ที่ยังคงพกตัวช่วย load/write โดยตรงที่เลิกใช้แล้วไว้ระหว่างช่วงการย้ายระบบ
- **`openclaw/extension-api`** - สะพานที่ให้ Plugin เข้าถึงตัวช่วยฝั่งโฮสต์โดยตรง
  เช่นตัวรันเอเจนต์แบบฝัง
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ส่วนขยายแบบ bundled
  สำหรับ embedded-runner เท่านั้นที่ถูกลบแล้ว ซึ่งเคยสังเกตเหตุการณ์ของ embedded-runner
  เช่น `tool_result` ได้

พื้นผิวการนำเข้าแบบกว้างตอนนี้ **เลิกใช้แล้ว** ยังคงทำงานได้ใน runtime
แต่ Plugin ใหม่ต้องไม่ใช้พื้นผิวเหล่านี้ และ Plugin ที่มีอยู่ควรย้ายระบบก่อน
รีลีส major ถัดไปจะลบออก API การลงทะเบียน extension factory สำหรับ embedded-runner
เท่านั้นถูกลบแล้ว ให้ใช้ middleware สำหรับผลลัพธ์เครื่องมือแทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน change เดียวกับที่
เพิ่มสิ่งทดแทน การเปลี่ยนแปลง contract ที่ทำให้แตกหักต้องผ่าน compatibility adapter,
diagnostics, เอกสาร และช่วงเลิกใช้งานก่อน ข้อนี้ใช้กับการนำเข้า SDK, ฟิลด์ manifest,
API การตั้งค่า, hook และพฤติกรรมการลงทะเบียน runtime

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกลบในรีลีส major ในอนาคต
  Plugin ที่ยังนำเข้าจากพื้นผิวเหล่านี้จะแตกเมื่อถึงเวลานั้น
  การลงทะเบียน embedded extension factory รุ่นเก่าโหลดไม่ได้แล้วในตอนนี้
</Warning>

## เหตุผลที่เปลี่ยน

แนวทางเดิมก่อให้เกิดปัญหา:

- **เริ่มต้นช้า** - การนำเข้าตัวช่วยหนึ่งรายการโหลดโมดูลที่ไม่เกี่ยวข้องกันหลายสิบรายการ
- **การพึ่งพาแบบวนรอบ** - การ re-export แบบกว้างทำให้สร้าง import cycle ได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีบอกว่า export ใดเสถียรหรือเป็นภายใน

Plugin SDK สมัยใหม่แก้ปัญหานี้: แต่ละเส้นทางนำเข้า (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กที่พึ่งพาตัวเอง มีวัตถุประสงค์ชัดเจน และมี contract ที่มีเอกสารกำกับ

seam เพื่อความสะดวกของ provider รุ่นเก่าสำหรับช่องทางแบบ bundled ก็ถูกลบแล้วเช่นกัน
seam ตัวช่วยที่ผูกแบรนด์ช่องทางเป็นทางลัดส่วนตัวของ mono-repo ไม่ใช่
contract ของ Plugin ที่เสถียร ให้ใช้ subpath SDK แบบ generic ที่แคบแทน ภายใน workspace
Plugin แบบ bundled ให้เก็บตัวช่วยที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ
`runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider แบบ bundled ปัจจุบัน:

- Anthropic เก็บตัวช่วย stream เฉพาะ Claude ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตนเอง
- OpenAI เก็บ provider builder, ตัวช่วยโมเดลเริ่มต้น และ realtime provider
  builder ไว้ใน `api.ts` ของตนเอง
- OpenRouter เก็บ provider builder และตัวช่วย onboarding/config ไว้ใน
  `api.ts` ของตนเอง

## แผนการย้ายระบบ Talk และเสียงแบบ realtime

โค้ด Realtime voice, telephony, meeting และ browser Talk กำลังย้ายจาก
การทำบัญชี turn เฉพาะแต่ละ surface ไปยังตัวควบคุมเซสชัน Talk ร่วมที่ export โดย
`openclaw/plugin-sdk/realtime-voice` ตัวควบคุมใหม่นี้เป็นเจ้าของ envelope เหตุการณ์ Talk
ทั่วไป, สถานะ turn ที่ active, สถานะ capture, สถานะ output-audio, ประวัติเหตุการณ์ล่าสุด
และการปฏิเสธ stale-turn Plugin provider ควรยังเป็นเจ้าของเซสชัน realtime เฉพาะ vendor
ต่อไป ส่วน Plugin surface ควรยังเป็นเจ้าของรายละเอียดเฉพาะของ capture, playback,
telephony และ meeting ต่อไป

การย้ายระบบ Talk นี้ตั้งใจให้เป็นการแตกหักแบบสะอาด:

1. เก็บ primitive ของ controller/runtime ร่วมไว้ใน
   `plugin-sdk/realtime-voice`
2. ย้าย surface แบบ bundled ไปยังตัวควบคุมร่วม: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime และ native push-to-talk
3. แทนที่กลุ่ม Talk RPC เดิมด้วย API สุดท้าย `talk.session.*` และ
   `talk.client.*`
4. ประกาศช่องเหตุการณ์ Talk สดหนึ่งช่องใน Gateway
   `hello-ok.features.events`: `talk.event`
5. ลบ endpoint HTTP realtime เดิมและเส้นทาง override คำสั่งในเวลารับ request ทั้งหมด

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่กำลัง
สร้าง adapter ระดับล่างหรือ test fixture ให้ใช้ตัวควบคุมร่วมเป็นหลัก
เพื่อให้ไม่สามารถ emit เหตุการณ์ที่อยู่ในขอบเขต turn โดยไม่มี turn id,
การเรียก `turnEnd` / `turnCancel` ที่ stale ไม่สามารถล้าง active turn ที่ใหม่กว่า
และเหตุการณ์ lifecycle ของ output-audio คงเส้นคงวาข้าม telephony, meetings,
browser relay, managed-room handoff และ client Talk แบบ native

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

เซสชัน WebRTC/provider-websocket ที่ browser เป็นเจ้าของใช้ `talk.client.create`
เพราะ browser เป็นเจ้าของการเจรจากับ provider และ media transport ขณะที่
Gateway เป็นเจ้าของ credential, instructions และนโยบายเครื่องมือ `talk.session.*` คือ
surface ร่วมที่ Gateway จัดการสำหรับ gateway-relay realtime, gateway-relay
transcription และเซสชัน STT/TTS แบบ native ของ managed-room

config รุ่นเก่าที่วาง selector ของ realtime ไว้ข้าง `talk.provider` /
`talk.providers` ควรซ่อมด้วย `openclaw doctor --fix`; runtime Talk
จะไม่ตีความ config provider สำหรับ speech/TTS เป็น config provider สำหรับ realtime ใหม่

ชุดผสม `talk.session.create` ที่รองรับตั้งใจให้มีขนาดเล็ก:

| โหมด            | Transport       | Brain           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียง provider แบบ full-duplex ถูก bridge ผ่าน Gateway; การเรียกเครื่องมือถูก route ผ่านเครื่องมือ agent-consult      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | เฉพาะ streaming STT; caller ส่งเสียง input และรับเหตุการณ์ transcript                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ห้อง native/client | ห้องสไตล์ push-to-talk และ walkie-talkie ที่ client เป็นเจ้าของ capture/playback และ Gateway เป็นเจ้าของสถานะ turn |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ห้อง native/client | โหมดห้องสำหรับ admin เท่านั้นสำหรับ surface first-party ที่เชื่อถือได้ซึ่ง execute การกระทำเครื่องมือของ Gateway โดยตรง                  |

แผนที่ method ที่ถูกลบ:

| เดิม                              | ใหม่                                                      |
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

  | วิธีการ                          | ใช้กับ                                              | สัญญา                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | ผนวกชิ้นส่วนเสียง PCM แบบ base64 เข้ากับเซสชันผู้ให้บริการที่เป็นของการเชื่อมต่อ Gateway เดียวกัน                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่มรอบผู้ใช้ของ managed-room                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | จบรอบที่ใช้งานอยู่หลังจากตรวจสอบ stale-turn แล้ว                                                                                                                                         |
  | `talk.session.cancelTurn`       | เซสชันทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงาน capture/ผู้ให้บริการ/agent/TTS ที่ใช้งานอยู่สำหรับรอบหนึ่ง                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุดเอาต์พุตเสียงของผู้ช่วยโดยไม่จำเป็นต้องจบรอบผู้ใช้                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำ tool call ของผู้ให้บริการที่ relay ส่งออกมาให้เสร็จสมบูรณ์ ส่ง `options.willContinue` สำหรับเอาต์พุตชั่วคราว หรือ `options.suppressResponse` เพื่อทำให้ call สำเร็จโดยไม่มีการตอบกลับจากผู้ช่วยอีกครั้ง |
  | `talk.session.steer`            | เซสชัน Talk ที่มี agent หนุนหลัง                              | ส่งการควบคุมด้วยเสียง `status`, `steer`, `cancel` หรือ `followup` ไปยัง embedded run ที่ใช้งานอยู่ซึ่ง resolve จากเซสชัน Talk                                                                |
  | `talk.session.close`            | เซสชันแบบรวมทั้งหมด                                    | หยุดเซสชัน relay หรือเพิกถอนสถานะ managed-room แล้วลืม id เซสชันแบบรวม                                                                                                    |

  อย่าเพิ่มกรณีพิเศษของผู้ให้บริการหรือแพลตฟอร์มในคอร์เพื่อให้สิ่งนี้ทำงาน
  คอร์เป็นเจ้าของความหมายของเซสชัน Talk ส่วน Plugin ผู้ให้บริการเป็นเจ้าของการตั้งค่าเซสชันของผู้จำหน่าย
  Voice-call และ Google Meet เป็นเจ้าของ adapter สำหรับโทรศัพท์/การประชุม ส่วนเบราว์เซอร์และแอปเนทีฟ
  เป็นเจ้าของ UX การจับภาพ/เล่นเสียงของอุปกรณ์

  ## นโยบายความเข้ากันได้

  สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้ทำตามลำดับนี้:

  1. เพิ่มสัญญาใหม่
  2. คงพฤติกรรมเก่าไว้โดยเดินผ่าน compatibility adapter
  3. ส่ง diagnostic หรือคำเตือนที่ระบุชื่อเส้นทางเก่าและสิ่งที่ใช้แทน
  4. ครอบคลุมทั้งสองเส้นทางในเทสต์
  5. จัดทำเอกสารการเลิกใช้และเส้นทางการย้าย
  6. ลบหลังจากหน้าต่างเวลาการย้ายที่ประกาศไว้เท่านั้น โดยปกติใน major release

  ผู้ดูแลสามารถตรวจสอบคิวการย้ายปัจจุบันได้ด้วย
  `pnpm plugins:boundary-report` ใช้ `pnpm plugins:boundary-report:summary` สำหรับ
  จำนวนแบบย่อ, `--owner <id>` สำหรับ Plugin หนึ่งตัวหรือเจ้าของความเข้ากันได้หนึ่งราย และ
  `pnpm plugins:boundary-report:ci` เมื่อ CI gate ควรล้มเหลวเมื่อมี
  บันทึกความเข้ากันได้ที่ครบกำหนด, การ import SDK reserved ข้ามเจ้าของ หรือ subpath ของ SDK reserved
  ที่ไม่ได้ใช้ รายงานจะจัดกลุ่มบันทึกความเข้ากันได้ที่เลิกใช้แล้ว
  ตามวันที่ลบ นับการอ้างอิงในโค้ด/เอกสารภายใน
  แสดงการ import SDK reserved ข้ามเจ้าของ และสรุป bridge SDK แบบ private
  ของ memory-host เพื่อให้การล้างความเข้ากันได้ยังคงชัดเจนแทนที่จะ
  อาศัยการค้นหาแบบเฉพาะกิจ subpath ของ SDK reserved ต้องมีการติดตามการใช้งานโดยเจ้าของ
  ควรลบ helper export ที่ reserved และไม่ได้ใช้จาก SDK สาธารณะ

  หากฟิลด์ manifest ยังเป็นที่ยอมรับ ผู้เขียน Plugin สามารถใช้ต่อได้จนกว่า
  เอกสารและ diagnostic จะระบุเป็นอย่างอื่น โค้ดใหม่ควรใช้สิ่งทดแทน
  ที่จัดทำเอกสารไว้ แต่ Plugin ที่มีอยู่ไม่ควรพังระหว่าง minor release
  ตามปกติ

  ## วิธีการย้าย

  <Steps>
  <Step title="ย้าย helper สำหรับโหลด/เขียน config ของ runtime">
    Plugin ที่ bundled ควรหยุดเรียก
    `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ควรใช้ config ที่ถูก
    ส่งเข้าไปใน call path ที่ใช้งานอยู่แล้ว handler อายุยาวที่ต้องการ
    snapshot ของกระบวนการปัจจุบันสามารถใช้ `api.runtime.config.current()` ได้ เครื่องมือ agent
    อายุยาวควรใช้ `ctx.getRuntimeConfig()` ของ tool context ภายใน
    `execute` เพื่อให้เครื่องมือที่สร้างก่อนการเขียน config ยังคงเห็น
    runtime config ที่ refresh แล้ว

    การเขียน config ต้องผ่าน transactional helper และเลือก
    นโยบายหลังเขียน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อผู้เรียกรู้ว่า
    การเปลี่ยนแปลงต้องใช้การ restart gateway แบบสะอาด และ
    `afterWrite: { mode: "none", reason: "..." }` เฉพาะเมื่อผู้เรียกเป็นเจ้าของ
    งานติดตามผลและตั้งใจต้องการระงับ reload planner
    ผลลัพธ์ mutation มีสรุป `followUp` แบบมี type สำหรับเทสต์และ logging;
    gateway ยังคงรับผิดชอบการนำไปใช้หรือจัดกำหนดการ restart
    `loadConfig` และ `writeConfigFile` ยังคงเป็น helper ความเข้ากันได้
    ที่เลิกใช้แล้วสำหรับ Plugin ภายนอกในช่วงหน้าต่างการย้าย และเตือนหนึ่งครั้งด้วย
    compatibility code `runtime-config-load-write` Plugin ที่ bundled และโค้ด runtime
    ของ repo ได้รับการป้องกันด้วย guardrail ของ scanner ใน
    `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งาน Plugin สำหรับ production ใหม่
    จะล้มเหลวทันที, การเขียน config โดยตรงจะล้มเหลว, method ของ gateway server ต้องใช้
    runtime snapshot ของคำขอ, helper สำหรับส่ง/action/client ของ runtime channel
    ต้องรับ config จาก boundary ของตน และโมดูล runtime อายุยาวต้องมี
    การเรียก `loadConfig()` แบบ ambient ที่อนุญาตเป็นศูนย์

    โค้ด Plugin ใหม่ควรหลีกเลี่ยงการ import compatibility barrel แบบกว้าง
    `openclaw/plugin-sdk/config-runtime` ด้วย ใช้ subpath ของ SDK แบบแคบ
    ที่ตรงกับงาน:

    | ความต้องการ | Import |
    | --- | --- |
    | type ของ config เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertion ของ config ที่โหลดแล้วและการค้นหา config ของ plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่าน snapshot ของ runtime ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียน config | `openclaw/plugin-sdk/config-mutation` |
    | helper ของ session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config ของตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helper runtime ของ group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | การ resolve secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | การ override model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin ที่ bundled และเทสต์ของ Plugin เหล่านั้นถูก scanner ป้องกันจาก barrel แบบกว้าง
    เพื่อให้ import และ mock อยู่เฉพาะกับพฤติกรรมที่ต้องการ barrel แบบกว้าง
    ยังคงมีอยู่เพื่อความเข้ากันได้ภายนอก แต่โค้ดใหม่ไม่ควร
    พึ่งพามัน

  </Step>

  <Step title="ย้ายส่วนขยาย tool-result แบบ embedded ไปเป็น middleware">
    Plugin ที่ bundled ต้องแทนที่ handler tool-result ของ
    `api.registerEmbeddedExtensionFactory(...)` ที่ใช้ได้เฉพาะ embedded-runner
    ด้วย middleware ที่เป็นกลางต่อ runtime

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    อัปเดต manifest ของ Plugin ในเวลาเดียวกัน:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin ที่ติดตั้งแล้วสามารถ register tool-result middleware ได้เช่นกันเมื่อถูก
    เปิดใช้อย่างชัดเจนและประกาศ runtime ทุกตัวที่กำหนดเป้าหมายไว้ใน
    `contracts.agentToolResultMiddleware` การ register middleware ที่ติดตั้งแล้วแต่ไม่ได้ประกาศ
    จะถูกปฏิเสธ

  </Step>

  <Step title="ย้าย handler แบบ approval-native ไปยัง capability facts">
    Plugin channel ที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบเนทีฟผ่าน
    `approvalCapability.nativeRuntime` พร้อม registry runtime-context ที่ใช้ร่วมกัน

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery ที่เฉพาะกับ approval ออกจาก wiring เดิมของ `plugin.auth` /
      `plugin.approvals` ไปยัง `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจากสัญญา channel-plugin
      สาธารณะแล้ว; ย้ายฟิลด์ delivery/native/render ไปไว้บน `approvalCapability`
    - `plugin.auth` ยังคงอยู่สำหรับ flow login/logout ของ channel เท่านั้น; hook auth ของ approval
      ตรงนั้นจะไม่ถูกอ่านโดยคอร์อีกต่อไป
    - Register วัตถุ runtime ที่ channel เป็นเจ้าของ เช่น client, token หรือแอป Bolt
      ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง notice reroute ที่ Plugin เป็นเจ้าของจาก handler approval แบบเนทีฟ;
      ตอนนี้คอร์เป็นเจ้าของ notice routed-elsewhere จากผลลัพธ์ delivery จริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้จัดเตรียม
      surface `createPluginRuntime().channel` จริง stub บางส่วนจะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับ layout capability ของ approval ปัจจุบัน

  </Step>

  <Step title="ตรวจสอบพฤติกรรม fallback ของ Windows wrapper">
    หาก Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` wrapper ของ Windows
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

    หากผู้เรียกของคุณไม่ได้ตั้งใจพึ่งพา shell fallback อย่าตั้งค่า
    `allowShellFallback` และจัดการ error ที่ถูก throw แทน

  </Step>

  <Step title="ค้นหา import ที่เลิกใช้แล้ว">
    ค้นหาใน Plugin ของคุณสำหรับ import จาก surface ที่เลิกใช้แล้วเหล่านี้:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="แทนที่ด้วย import ที่เจาะจง">
    แต่ละ export จาก surface เก่าจะ map ไปยังเส้นทาง import สมัยใหม่ที่เฉพาะเจาะจง:

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

    รูปแบบเดียวกันนี้ใช้กับตัวช่วยบริดจ์เดิมอื่นๆ ด้วย:

    | การนำเข้าแบบเก่า | รายการเทียบเท่าสมัยใหม่ |
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
    แต่โค้ดใหม่ควรนำเข้าพื้นผิวตัวช่วยแบบเจาะจงที่ต้องใช้จริง:

    | ความต้องการ | การนำเข้า |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยการปลุก Heartbeat เหตุการณ์ และการมองเห็น | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการส่งมอบที่รอดำเนินการ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | เทเลเมทรีกิจกรรมช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคชดีดูปในหน่วยความจำ | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยเส้นทางไฟล์/สื่อในเครื่องที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` ที่รับรู้ดิสแพตเชอร์ | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วยพร็อกซีและ `fetch` แบบมีการป้องกัน | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบายดิสแพตเชอร์ SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/การแก้ไขการอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | เพย์โหลดการตอบกลับการอนุมัติและตัวช่วยคำสั่ง | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของทรานสปอร์ต | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | ภาวะพร้อมกันของงานอะซิงค์แบบมีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การบังคับแปลงเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อกอะซิงค์เฉพาะกระบวนการ | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่บันเดิลมาถูกสแกนเนอร์ป้องกันไม่ให้ใช้ `infra-runtime` ดังนั้นโค้ดในรีโป
    จะไม่สามารถถอยกลับไปใช้บาร์เรลแบบกว้างได้

  </Step>

  <Step title="Migrate channel route helpers">
    โค้ดเส้นทางช่องทางใหม่ควรใช้ `openclaw/plugin-sdk/channel-route`
    ชื่อ route-key และ comparable-target รุ่นเก่ายังคงอยู่ในฐานะนามแฝงเพื่อความเข้ากันได้
    ระหว่างช่วงเวลาการย้าย แต่ Plugin ใหม่ควรใช้ชื่อเส้นทาง
    ที่อธิบายพฤติกรรมโดยตรง:

    | ตัวช่วยเก่า | ตัวช่วยสมัยใหม่ |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วยเส้นทางสมัยใหม่ทำให้ `{ channel, to, accountId, threadId }`
    เป็นมาตรฐานอย่างสม่ำเสมอในคำอนุมัติเนทีฟ การระงับการตอบกลับ ดีดูปขาเข้า
    การส่งมอบ Cron และการกำหนดเส้นทางเซสชัน

    อย่าเพิ่มการใช้งานใหม่ของ `ChannelMessagingAdapter.parseExplicitTarget` หรือ
    ตัวช่วย loaded-route ที่มีพาร์เซอร์รองรับ (`parseExplicitTargetForLoadedChannel`
    หรือ `resolveRouteTargetForLoadedChannel`) หรือ
    `resolveChannelRouteTargetWithParser(...)` จาก `plugin-sdk/channel-route`
    ฮุกเหล่านี้เลิกแนะนำให้ใช้แล้ว และคงไว้เฉพาะสำหรับ Plugin รุ่นเก่าในช่วง
    เวลาการย้ายเท่านั้น Plugin ช่องทางใหม่ควรใช้
    `messaging.targetResolver.resolveTarget(...)` สำหรับการทำให้รหัสเป้าหมายเป็นมาตรฐาน
    และการย้อนกลับเมื่อไม่พบไดเรกทอรี ใช้ `messaging.inferTargetChatType(...)` เมื่อแกนหลัก
    ต้องการชนิดเพียร์ตั้งแต่ต้น และใช้ `messaging.resolveOutboundSessionRoute(...)`
    สำหรับเซสชันแบบเนทีฟของผู้ให้บริการและอัตลักษณ์เธรด

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงเส้นทางการนำเข้า

  <Accordion title="ตารางเส้นทาง import ทั่วไป">
  | เส้นทาง import | วัตถุประสงค์ | exports สำคัญ |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วย entry ของ Plugin แบบมาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | umbrella re-export แบบเดิมสำหรับนิยาม/ตัวสร้าง entry ของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export สคีมา config ระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วย entry สำหรับ provider เดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้าง entry ของช่องทางแบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดตั้งค่าที่ใช้ร่วมกัน | ตัวแปล setup, prompt รายการที่อนุญาต, ตัวสร้างสถานะ setup |
  | `plugin-sdk/setup-runtime` | ตัวช่วย runtime ระหว่าง setup | `createSetupTranslator`, adapter patch setup ที่ import ได้อย่างปลอดภัย, ตัวช่วย lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup ที่มอบหมายต่อ |
  | `plugin-sdk/setup-adapter-runtime` | alias adapter setup ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือ setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/config/action-gate |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การทำให้ account-id เป็นมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + fallback ค่าเริ่มต้น |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบแคบ | ตัวช่วยรายการบัญชี/account-action |
  | `plugin-sdk/channel-setup` | adapter วิซาร์ด setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | primitive สำหรับจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเชื่อมต่อ prefix การตอบกลับ, typing, และการส่งจากแหล่งที่มา | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | factory adapter config และตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมา config | เฉพาะ primitive สคีมา config ช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไป |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมา config ที่ bundled | เฉพาะ Plugin ที่ bundled และดูแลโดย OpenClaw เท่านั้น; Plugin ใหม่ต้องกำหนดสคีมาเฉพาะ Plugin เอง |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมา config ที่ bundled ซึ่งเลิกใช้แล้ว | alias เพื่อความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่ bundled และยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วย config คำสั่ง Telegram | การทำให้ชื่อคำสั่งเป็นมาตรฐาน, การตัดคำอธิบาย, การตรวจสอบซ้ำ/ขัดแย้ง |
  | `plugin-sdk/channel-policy` | การ resolve นโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | ตัวช่วย envelope ขาเข้า | ตัวช่วย route + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-inbound` | ตัวช่วยรับขาเข้า | การสร้าง context, การจัดรูปแบบ, roots, runners, dispatch การตอบกลับที่เตรียมไว้, และ predicate สำหรับ dispatch |
  | `plugin-sdk/messaging-targets` | เส้นทาง import การแยกวิเคราะห์ target ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์ target ทั่วไป, `plugin-sdk/channel-route` สำหรับการเปรียบเทียบ route, และ `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` ที่ Plugin เป็นเจ้าของสำหรับการ resolve target เฉพาะ provider |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | ตัวช่วย lifecycle ข้อความขาออก | adapter ข้อความ, ใบรับ, ตัวช่วยส่งแบบคงทน, ตัวช่วย live preview/streaming, ตัวเลือกตอบกลับ, ตัวช่วย lifecycle, identity ขาออก, และการวางแผน payload |
  | `plugin-sdk/channel-streaming` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย thread-binding | lifecycle ของ thread-binding และตัวช่วย adapter |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย payload สื่อแบบเดิม | ตัวสร้าง payload สื่อของ Agent สำหรับเลย์เอาต์ฟิลด์แบบเดิม |
  | `plugin-sdk/channel-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว | เฉพาะยูทิลิตี runtime ช่องทางแบบเดิม |
  | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การส่ง | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | ที่เก็บข้อมูล Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วย runtime แบบกว้าง | ตัวช่วย runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | ตัวช่วย env runtime แบบแคบ | ตัวช่วย logger/runtime env, timeout, retry, และ backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วย runtime ของ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/hooks/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline ของ hook | ตัวช่วย pipeline ของ Webhook/internal hook ที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วย lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วย process | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วย runtime ของ CLI | การจัดรูปแบบคำสั่ง, waits, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | client Gateway, ตัวช่วยเริ่มต้นที่ event-loop พร้อมใช้งาน, และตัวช่วย patch สถานะช่องทาง |
  | `plugin-sdk/config-runtime` | shim ความเข้ากันได้ของ config ที่เลิกใช้แล้ว | แนะนำให้ใช้ `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram ที่ fallback-stable เมื่อ surface สัญญาของ Telegram ที่ bundled ไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วย prompt การอนุมัติ | payload การอนุมัติ exec/Plugin, ตัวช่วย capability/profile การอนุมัติ, routing/runtime การอนุมัติแบบ native, และการจัดรูปแบบเส้นทางแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การ resolve ผู้อนุมัติ, auth action ในแชทเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วย client การอนุมัติ | ตัวช่วย profile/filter การอนุมัติ exec แบบ native |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วย delivery การอนุมัติ | adapter capability/delivery การอนุมัติแบบ native |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย gateway การอนุมัติ | ตัวช่วย resolve Gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วย adapter การอนุมัติ | ตัวช่วยโหลด adapter การอนุมัติแบบ native ขนาดเบาสำหรับ entrypoint ช่องทาง hot |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย handler การอนุมัติ | ตัวช่วย runtime handler การอนุมัติแบบกว้างขึ้น; แนะนำให้ใช้ช่องทาง adapter/gateway ที่แคบกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วย target การอนุมัติ | ตัวช่วย binding target/account การอนุมัติแบบ native |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยตอบกลับการอนุมัติ | ตัวช่วย payload ตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย runtime-context ของช่องทาง | ตัวช่วย register/get/watch runtime-context ของช่องทางทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | ตัวช่วย trust ที่ใช้ร่วมกัน, การ gate DM, ไฟล์/พาธที่จำกัดด้วย root, external-content, และการเก็บ secret |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วยรายการ host ที่อนุญาตและนโยบาย private-network |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วย runtime SSRF | pinned-dispatcher, guarded fetch, ตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วย event ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | ตัวช่วย wake, event, และ visibility ของ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิว delivery | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe | cache dedupe ในหน่วยความจำ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยเข้าถึงไฟล์ | ตัวช่วยพาธไฟล์/สื่อ local ที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของ transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยนโยบายการอนุมัติ exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | ตัวช่วย cache แบบมีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วย gate diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยจัดรูปแบบ error | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วย graph ของ error |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy แบบ wrapped | `resolveFetch`, ตัวช่วย proxy, ตัวช่วย option ของ EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยทำ host ให้เป็นมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย retry | `RetryConfig`, `retryAsync`, runner นโยบาย |
  | `plugin-sdk/allow-from` | การจัดรูปแบบรายการที่อนุญาตและการแมป input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | การ gate คำสั่งและตัวช่วย surface คำสั่ง | `resolveControlCommandGate`, ตัวช่วย authorization ผู้ส่ง, ตัวช่วย registry คำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | renderer สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์ input secret | ตัวช่วย input secret |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | ยูทิลิตี target ของ Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วย guard body ของ Webhook | ตัวช่วยอ่าน/จำกัด body ของคำขอ |
  | `plugin-sdk/reply-runtime` | runtime การตอบกลับที่ใช้ร่วมกัน | dispatch ขาเข้า, Heartbeat, planner การตอบกลับ, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch การตอบกลับแบบแคบ | finalize, dispatch provider, และตัวช่วย label การสนทนา |
  | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับ | `createChannelHistoryWindow`; export ความเข้ากันได้ของ map-helper ที่เลิกใช้แล้ว เช่น `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, และ `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผน reference การตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วย chunk การตอบกลับ | ตัวช่วย chunking ข้อความ/markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วย store ของ session | ตัวช่วยพาธ store + updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วยพาธ state | ตัวช่วยไดเรกทอรี state และ OAuth |
  | `plugin-sdk/routing` | ตัวช่วยการกำหนดเส้นทาง/คีย์เซสชัน | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยทำให้คีย์เซสชันเป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี, ค่าเริ่มต้นสถานะรันไทม์, ตัวช่วยเมตาดาต้าประเด็น |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วยตัวแก้เป้าหมาย | ตัวช่วยตัวแก้เป้าหมายที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้สตริงเป็นรูปแบบมาตรฐาน | ตัวช่วยทำให้ slug/สตริงเป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL คำขอ | ดึง URL แบบสตริงจากอินพุตลักษณะคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบจับเวลา | ตัวรันคำสั่งแบบจับเวลาพร้อม stdout/stderr ที่ทำให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
  | `plugin-sdk/tool-payload` | การดึงเพย์โหลดของเครื่องมือ | ดึงเพย์โหลดที่ทำให้เป็นรูปแบบมาตรฐานจากอ็อบเจกต์ผลลัพธ์เครื่องมือ |
  | `plugin-sdk/tool-send` | การดึงข้อมูลการส่งของเครื่องมือ | ดึงฟิลด์เป้าหมายการส่งแบบมาตรฐานจากอาร์กิวเมนต์เครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ประเภทการตอบกลับข้อความ | ประเภทเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการในเครื่อง/โฮสต์เองที่คัดสรรไว้ | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการที่โฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการที่โฮสต์เองและเข้ากันได้กับ OpenAI แบบเฉพาะเจาะจง | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการที่โฮสต์เองชุดเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยยืนยันตัวตนรันไทม์ของผู้ให้บริการ | ตัวช่วยแก้ค่า API-key ในรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยตั้งค่า API-key ของผู้ให้บริการ | ตัวช่วยเริ่มต้นใช้งาน API-key/เขียนโปรไฟล์ |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยเลือกผู้ให้บริการ | การเลือกผู้ให้บริการจากค่าที่กำหนดหรืออัตโนมัติ และการรวมค่ากำหนดผู้ให้บริการดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วย env-var ของผู้ให้บริการ | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/รีเพลย์ของผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายรีเพลย์ที่ใช้ร่วมกัน, ตัวช่วยปลายทางผู้ให้บริการ, และตัวช่วยทำให้ model-id เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์การเริ่มต้นใช้งานผู้ให้บริการ | ตัวช่วยค่ากำหนดการเริ่มต้นใช้งาน |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/ปลายทางของผู้ให้บริการทั่วไป รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยค่ากำหนด web-search ของผู้ให้บริการ | ตัวช่วยค่ากำหนด/ข้อมูลประจำตัว web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องการการเดินสายเปิดใช้ Plugin |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของผู้ให้บริการ | ตัวช่วยสัญญาค่ากำหนด/ข้อมูลประจำตัว web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, และตัวตั้งค่า/ตัวรับข้อมูลประจำตัวแบบกำหนดขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, และการล้างสคีมา + การวินิจฉัยของ DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, และตัวช่วยการใช้งานผู้ให้บริการอื่นๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วยตัวครอบสตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภทตัวครอบสตรีม, และตัวช่วยตัวครอบ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วยทรานสปอร์ตของผู้ให้บริการ | ตัวช่วยทรานสปอร์ตเนทีฟของผู้ให้บริการ เช่น guarded fetch, การดึงข้อความผลลัพธ์เครื่องมือ, การแปลงข้อความทรานสปอร์ต, และสตรีมเหตุการณ์ทรานสปอร์ตที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิวอะซิงก์แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึง/แปลง/จัดเก็บสื่อ, การตรวจมิติของวิดีโอที่ใช้ ffprobe, และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน, การเลือกตัวเลือก, และข้อความโมเดลที่ขาดหายสำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยความเข้าใจสื่อ | ประเภทผู้ให้บริการความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยรูปภาพ/เสียงฝั่งผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | การส่งออกความเข้ากันได้ด้านข้อความแบบกว้างที่เลิกใช้แล้ว | ใช้ `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, และ `logging-core` |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งข้อความเป็นชิ้น | ตัวช่วยแบ่งข้อความขาออกเป็นชิ้น |
  | `plugin-sdk/speech` | ตัวช่วยเสียงพูด | ประเภทผู้ให้บริการเสียงพูด พร้อมตัวช่วย directive, registry, การตรวจสอบความถูกต้องฝั่งผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | คอร์เสียงพูดที่ใช้ร่วมกัน | ประเภทผู้ให้บริการเสียงพูด, registry, directives, การทำให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยการถอดเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วย registry, และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วย registry/การแก้ค่า, ตัวช่วยเซสชัน bridge, คิว talk-back ของเอเจนต์ที่ใช้ร่วมกัน, การควบคุมเสียงของรันที่ใช้งานอยู่, สุขภาพทรานสคริปต์/เหตุการณ์, การระงับเสียงสะท้อน, การจับคู่คำถามปรึกษา, การประสานงาน forced-consult, การติดตามบริบทของเทิร์น, การติดตามกิจกรรมเอาต์พุต, และตัวช่วยปรึกษาบริบทแบบเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วยการสร้างภาพ | ประเภทผู้ให้บริการการสร้างภาพ พร้อมตัวช่วย asset ภาพ/data URL และตัวสร้างผู้ให้บริการภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | คอร์การสร้างภาพที่ใช้ร่วมกัน | ประเภทการสร้างภาพ, failover, auth, และตัวช่วย registry |
  | `plugin-sdk/music-generation` | ตัวช่วยการสร้างเพลง | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์ของการสร้างเพลง |
  | `plugin-sdk/music-generation-core` | คอร์การสร้างเพลงที่ใช้ร่วมกัน | ประเภทการสร้างเพลง, ตัวช่วย failover, การค้นหาผู้ให้บริการ, และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วยการสร้างวิดีโอ | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์ของการสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | คอร์การสร้างวิดีโอที่ใช้ร่วมกัน | ประเภทการสร้างวิดีโอ, ตัวช่วย failover, การค้นหาผู้ให้บริการ, และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การทำให้เพย์โหลดการตอบกลับแบบโต้ตอบเป็นรูปแบบมาตรฐาน/การลดรูป |
  | `plugin-sdk/channel-config-primitives` | primitive ของค่ากำหนดช่องทาง | primitive ของสคีมาค่ากำหนดช่องทางแบบแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยเขียนค่ากำหนดช่องทาง | ตัวช่วยการอนุญาตเขียนค่ากำหนดช่องทาง |
  | `plugin-sdk/channel-plugin-common` | prelude ช่องทางที่ใช้ร่วมกัน | การส่งออก prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยค่ากำหนด allowlist | ตัวช่วยแก้ไข/อ่านค่ากำหนด allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยการตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วย guard สำหรับ Direct-DM | ตัวช่วยนโยบาย guard ก่อนเข้ารหัสแบบแคบ |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | primitive ของตัวช่วยช่องทางแบบ passive/สถานะ และ ambient proxy |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | registry เป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
  | `plugin-sdk/webhook-path` | alias พาธ Webhook ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/ในเครื่อง |
  | `plugin-sdk/zod` | การส่งออกซ้ำความเข้ากันได้ของ Zod ที่เลิกใช้แล้ว | นำเข้า `zod` จาก `zod` โดยตรง |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่บันเดิลมา | พื้นผิวตัวช่วยตัวจัดการหน่วยความจำ/ค่ากำหนด/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์เอนจินหน่วยความจำ | ฟาซาดรันไทม์ดัชนี/ค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-embedding-registry` | registry embedding หน่วยความจำ | ตัวช่วย registry ผู้ให้บริการ embedding หน่วยความจำแบบเบา |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจิน foundation ของโฮสต์หน่วยความจำ | การส่งออกเอนจิน foundation ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจิน embedding ของโฮสต์หน่วยความจำ | สัญญา embedding หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการในเครื่อง, และตัวช่วยแบตช์/ระยะไกลทั่วไป; ผู้ให้บริการระยะไกลแบบรูปธรรมอยู่ใน Plugin เจ้าของของตน |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | การส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจินที่เก็บข้อมูลของโฮสต์หน่วยความจำ | การส่งออกเอนจินที่เก็บข้อมูลของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | alias เหตุการณ์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะโฮสต์หน่วยความจำ | ตัวช่วยสถานะโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์คอร์ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์คอร์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | alias รันไทม์คอร์ของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยรันไทม์คอร์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | alias บันทึกเหตุการณ์ของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | alias ไฟล์/รันไทม์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย markdown ที่จัดการแล้ว | ตัวช่วย markdown ที่จัดการแล้วและใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้เคียงกับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | ฟาซาดค้นหา Active Memory | ฟาซาดรันไทม์ตัวจัดการค้นหา active-memory แบบ lazy |
  | `plugin-sdk/memory-host-status` | alias สถานะโฮสต์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | ยูทิลิตีทดสอบ | barrel ความเข้ากันได้ที่เลิกใช้แล้วภายในรีโป; ใช้พาธย่อยทดสอบภายในรีโปแบบเจาะจง เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยสำหรับการย้ายที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ของคอมไพเลอร์อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports ถูกสร้างจาก
ชุดย่อยสาธารณะ

seam ตัวช่วยของ bundled-plugin ที่สงวนไว้ถูกปลดระวางจาก export map ของ SDK
สาธารณะแล้ว ยกเว้น facade สำหรับความเข้ากันได้ที่มีการจัดทำเอกสารไว้อย่างชัดเจน เช่น
shim `plugin-sdk/discord` ที่เลิกใช้แล้วแต่ยังคงไว้สำหรับแพ็กเกจ
`@openclaw/discord@2026.3.13` ที่เผยแพร่แล้ว ตัวช่วยเฉพาะเจ้าของอยู่ภายใน
แพ็กเกจ Plugin ที่เป็นเจ้าของนั้น; พฤติกรรมโฮสต์ที่ใช้ร่วมกันควรย้ายผ่านสัญญา SDK
ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`

ใช้อิมพอร์ตที่แคบที่สุดซึ่งตรงกับงาน หากคุณหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถามผู้ดูแลว่าสัญญาทั่วไปใด
ควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้ที่มีผลอยู่

การเลิกใช้ที่แคบลงซึ่งมีผลทั่วทั้ง plugin SDK, สัญญา provider,
พื้นผิว runtime, และ manifest แต่ละรายการยังทำงานได้ในวันนี้ แต่จะถูกลบออก
ในรุ่น major ในอนาคต รายการใต้แต่ละข้อจะจับคู่ API เก่าเข้ากับตัวแทนที่เป็น canonical

<AccordionGroup>
  <Accordion title="ตัวสร้างความช่วยเหลือ command-auth → command-status">
    **เก่า (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม, export เดิม
    เพียงแค่อิมพอร์ตจาก subpath ที่แคบกว่า `command-auth`
    re-export สิ่งเหล่านี้เป็น stub สำหรับ compat

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วย Mention gating → resolveInboundMentionDecision">
    **เก่า**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`.

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` - ส่งคืน
    อ็อบเจ็กต์การตัดสินใจรายการเดียวแทนการเรียกสองรายการที่แยกกัน

    Plugin ช่องทางปลายน้ำ (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนไปใช้แล้ว

  </Accordion>

  <Accordion title="shim ของ channel runtime และตัวช่วย channel actions">
    `openclaw/plugin-sdk/channel-runtime` เป็น shim สำหรับความเข้ากันได้สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่าอิมพอร์ตจากโค้ดใหม่; ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียนอ็อบเจ็กต์
    runtime

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions` ถูก
    เลิกใช้ควบคู่กับ export ช่องทาง "actions" แบบ raw เปิดเผยความสามารถ
    ผ่านพื้นผิว `presentation` เชิงความหมายแทน - Plugin ช่องทาง
    ประกาศว่าสามารถเรนเดอร์อะไร (cards, buttons, selects) แทนที่จะระบุชื่อ
    action แบบ raw ที่ยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของผู้ให้บริการค้นเว็บ → createTool() บน Plugin">
    **เก่า**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`.

    **ใหม่**: implement `createTool(...)` โดยตรงบน provider plugin
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน tool wrapper อีกต่อไป

  </Accordion>

  <Accordion title="ซองข้อความช่องทางแบบ plaintext → BodyForAgent">
    **เก่า**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้างซอง prompt แบบ plaintext
    แบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อก user-context แบบมีโครงสร้าง Plugin ช่องทาง
    แนบเมตาดาทาการ routing (thread, topic, reply-to, reactions) เป็น
    ฟิลด์แบบมีชนิด แทนการต่อรวมเข้าไปในสตริง prompt ตัวช่วย
    `formatAgentEnvelope(...)` ยังรองรับสำหรับซองที่สังเคราะห์ขึ้นเพื่อส่งให้
    assistant แต่ซอง plaintext ขาเข้ากำลังจะถูกยกเลิก

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received`, และ Plugin
    ช่องทางแบบกำหนดเองใด ๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **เก่า**: `api.on("deactivate", handler)`.

    **ใหม่**: `api.on("gateway_stop", handler)`. event และ context เป็น
    สัญญา cleanup ตอน shutdown เดียวกัน; เปลี่ยนเฉพาะชื่อ hook

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

    `deactivate` ยังคงถูกเชื่อมไว้เป็น alias สำหรับความเข้ากันได้ที่เลิกใช้แล้วจนถึงหลัง
    2026-08-16

  </Accordion>

  <Accordion title="hook subagent_spawning → การผูก core thread">
    **เก่า**: `api.on("subagent_spawning", handler)` ที่ส่งคืน
    `threadBindingReady` หรือ `deliveryOrigin`.

    **ใหม่**: ให้ core เตรียมการผูก subagent แบบ `thread: true` ผ่าน
    adapter การผูก session ของช่องทาง ใช้ `api.on("subagent_spawned", handler)`
    เฉพาะสำหรับการสังเกตหลัง launch

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
    `PluginHookSubagentSpawningResult`, และ
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ยังคงอยู่เฉพาะในฐานะ
    พื้นผิวสำหรับความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ Plugin ภายนอกย้ายระบบ

  </Accordion>

  <Accordion title="ชนิดการค้นพบ Provider → ชนิดแค็ตตาล็อก provider">
    alias ชนิด discovery สี่รายการตอนนี้เป็น wrapper บาง ๆ เหนือชนิด
    ยุค catalog:

    | Alias เก่า                 | ชนิดใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึงถุง static `ProviderCapabilities` แบบ legacy - Plugin provider
    ควรใช้ hook provider ที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas`, และ `wrapStreamFn` แทนอ็อบเจ็กต์ static

  </Accordion>

  <Accordion title="hook นโยบาย Thinking → resolveThinkingProfile">
    **เก่า** (hook แยกสามรายการบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, และ
    `resolveDefaultThinkingLevel(ctx)`.

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่ส่งคืน
    `ProviderThinkingProfile` พร้อม `id` แบบ canonical, `label` แบบไม่บังคับ, และ
    รายการ level ที่จัดอันดับแล้ว OpenClaw downgrade ค่าที่จัดเก็บไว้ซึ่งล้าสมัยตาม
    อันดับของ profile โดยอัตโนมัติ

    context มี `provider`, `modelId`, `reasoning` ที่ merge แล้วแบบไม่บังคับ,
    และ fact `compat` ของโมเดลที่ merge แล้วแบบไม่บังคับ Plugin provider สามารถใช้
    fact catalog เหล่านั้นเพื่อเปิดเผย profile เฉพาะโมเดลได้เฉพาะเมื่อสัญญา
    request ที่กำหนดค่ารองรับ

    implement hook เดียวแทนสามรายการ hook legacy ยังทำงานในช่วงหน้าต่าง
    การเลิกใช้ แต่จะไม่ถูก compose กับผลลัพธ์ profile

  </Accordion>

  <Accordion title="ผู้ให้บริการ auth ภายนอก → contracts.externalAuthProviders">
    **เก่า**: implement hook auth ภายนอกโดยไม่ประกาศ provider
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

  <Accordion title="การค้นหา env-var ของ Provider → setup.providers[].envVars">
    ฟิลด์ manifest **เก่า**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **ใหม่**: mirror การค้นหา env-var เดิมเข้าไปใน `setup.providers[].envVars`
    บน manifest สิ่งนี้รวมเมตาดาทา env สำหรับ setup/status ไว้ในที่เดียว
    และหลีกเลี่ยงการบูต plugin runtime เพียงเพื่อตอบการค้นหา env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน adapter สำหรับความเข้ากันได้
    จนกว่าหน้าต่างการเลิกใช้จะปิด

  </Accordion>

  <Accordion title="การลงทะเบียน Plugin หน่วยความจำ → registerMemoryCapability">
    **เก่า**: การเรียกแยกสามรายการ -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **ใหม่**: การเรียกเดียวบน memory-state API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    slot เดิม, การเรียกลงทะเบียนเดียว ตัวช่วย prompt และ corpus แบบเติมเพิ่ม
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="API ผู้ให้บริการ embedding ของหน่วยความจำ">
    **เก่า**: `api.registerMemoryEmbeddingProvider(...)` พร้อม
    `contracts.memoryEmbeddingProviders`.

    **ใหม่**: `api.registerEmbeddingProvider(...)` พร้อม
    `contracts.embeddingProviders`.

    สัญญา provider embedding ทั่วไปสามารถใช้ซ้ำนอกหน่วยความจำได้ และเป็น
    เส้นทางที่รองรับสำหรับ provider ใหม่ API การลงทะเบียนเฉพาะหน่วยความจำ
    ยังคงถูกเชื่อมไว้เป็นความเข้ากันได้ที่เลิกใช้แล้วระหว่างที่ provider ที่มีอยู่ย้ายระบบ
    รายงานการตรวจสอบ Plugin รายงานการใช้งานที่ไม่ใช่แบบ bundled ว่าเป็นหนี้ความเข้ากันได้

  </Accordion>

  <Accordion title="เปลี่ยนชื่อชนิดข้อความ session ของ Subagent">
    alias ชนิด legacy สองรายการยังคง export จาก `src/plugins/runtime/types.ts`:

    | เก่า                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    เมธอด runtime `readSession` ถูกเลิกใช้เพื่อแทนที่ด้วย
    `getSessionMessages` signature เดิม; เมธอดเก่าเรียกต่อไปยังเมธอดใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เก่า**: `runtime.tasks.flow` (เอกพจน์) ส่งคืน accessor ของ task-flow แบบ live

    **ใหม่**: `runtime.tasks.managedFlows` เก็บ runtime การแก้ไข TaskFlow
    แบบ managed สำหรับ Plugin ที่สร้าง, อัปเดต, ยกเลิก, หรือรัน task ลูกจาก
    flow ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียงการอ่านแบบ DTO

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factory ของ embedded extension → middleware สำหรับ agent tool-result">
    ครอบคลุมอยู่ใน "วิธีย้ายระบบ → ย้าย embedded tool-result extensions ไปเป็น
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: เส้นทาง embedded-runner-only
    `api.registerEmbeddedExtensionFactory(...)` ที่ถูกลบออก ถูกแทนที่ด้วย
    `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime ที่ชัดเจน
    ใน `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias หนึ่งบรรทัดสำหรับ `OpenClawConfig` ควรใช้ชื่อ canonical

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้ระดับ extension (ภายใน Plugin ช่องทาง/provider แบบ bundled ใต้
`extensions/`) ถูกติดตามภายใน barrel `api.ts` และ `runtime-api.ts`
ของแต่ละรายการ สิ่งเหล่านี้ไม่กระทบสัญญา Plugin บุคคลที่สาม และไม่ได้แสดงไว้
ที่นี่ หากคุณ consume barrel ภายในของ Plugin แบบ bundled โดยตรง ให้อ่าน
คอมเมนต์การเลิกใช้ใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การลบ

| เมื่อใด                   | สิ่งที่เกิดขึ้น                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**                | พื้นผิวที่เลิกใช้งานแล้วจะแสดงคำเตือนขณะรันไทม์                               |
| **รุ่น major ถัดไป** | พื้นผิวที่เลิกใช้งานแล้วจะถูกลบออก; Plugin ที่ยังใช้งานอยู่จะล้มเหลว |

Plugin หลักทั้งหมดถูกย้ายไปแล้ว Plugin ภายนอกควรย้าย
ก่อนรุ่น major ถัดไป

## การระงับคำเตือนชั่วคราว

ตั้งค่าตัวแปรสภาพแวดล้อมเหล่านี้ขณะทำงานย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางออกชั่วคราว ไม่ใช่วิธีแก้ปัญหาถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงการนำเข้า subpath ฉบับเต็ม
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การสร้าง Plugin ผู้ให้บริการ
- [ภายใน Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [Manifest ของ Plugin](/th/plugins/manifest) - ข้อมูลอ้างอิงสคีมา manifest
