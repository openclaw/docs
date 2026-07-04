---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้เป็นสถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแลรักษา Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK ของ Plugin รุ่นใหม่
title: การย้าย Plugin SDK
x-i18n:
    generated_at: "2026-07-04T15:40:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้างไปสู่สถาปัตยกรรม Plugin สมัยใหม่
ที่มีการนำเข้าแบบเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณถูกสร้างก่อน
สถาปัตยกรรมใหม่ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนแปลง

ระบบ Plugin แบบเก่าให้พื้นผิวแบบเปิดกว้างสองส่วนที่ทำให้ Plugin นำเข้า
ทุกอย่างที่ต้องใช้ได้จากจุดเข้าใช้งานเดียว:

- **`openclaw/plugin-sdk/compat`** - การนำเข้าเดียวที่ส่งออกซ้ำตัวช่วยหลายสิบรายการ
  ถูกเพิ่มมาเพื่อให้ Plugin แบบ hook รุ่นเก่ายังทำงานได้ระหว่างที่
  สถาปัตยกรรม Plugin ใหม่กำลังถูกสร้าง
- **`openclaw/plugin-sdk/infra-runtime`** - ชุดตัวช่วย runtime แบบกว้างที่
  ผสมเหตุการณ์ระบบ สถานะ Heartbeat คิวการส่ง ตัวช่วย fetch/proxy
  ตัวช่วยไฟล์ ชนิด approval และยูทิลิตีที่ไม่เกี่ยวข้องกัน
- **`openclaw/plugin-sdk/config-runtime`** - ชุดความเข้ากันได้ด้าน config แบบกว้าง
  ที่ยังคงพกตัวช่วยโหลด/เขียนโดยตรงที่เลิกใช้แล้วไว้ในช่วงเวลาย้ายระบบ
- **`openclaw/extension-api`** - สะพานที่ให้ Plugin เข้าถึงตัวช่วยฝั่งโฮสต์โดยตรง
  เช่น runner ของเอเจนต์แบบฝัง
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ส่วนขยายแบบ bundled
  สำหรับ embedded-runner เท่านั้นที่ถูกลบแล้ว ซึ่งเคยสังเกตเหตุการณ์ของ embedded-runner
  เช่น `tool_result` ได้

พื้นผิวการนำเข้าแบบกว้างตอนนี้ **เลิกใช้แล้ว** พื้นผิวเหล่านี้ยังทำงานได้ที่ runtime
แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายก่อน
รุ่นหลักถัดไปจะลบออก API สำหรับลงทะเบียน extension factory ที่ใช้กับ embedded-runner เท่านั้น
ถูกลบแล้ว ให้ใช้มิดเดิลแวร์ผลลัพธ์ของเครื่องมือแทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน
การเปลี่ยนแปลงเดียวกับที่เพิ่มสิ่งทดแทน การเปลี่ยนแปลงสัญญาที่ทำให้แตกหักต้อง
ผ่าน adapter ความเข้ากันได้ การวินิจฉัย เอกสาร และช่วงเวลาเลิกใช้ก่อน
สิ่งนี้ใช้กับการนำเข้า SDK ฟิลด์ manifest API การตั้งค่า hook และพฤติกรรม
การลงทะเบียน runtime

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกลบในรุ่นหลักอนาคต
  Plugin ที่ยังนำเข้าจากพื้นผิวเหล่านี้จะพังเมื่อถึงเวลานั้น
  การลงทะเบียน embedded extension factory แบบดั้งเดิมไม่โหลดอีกต่อไปแล้ว
</Warning>

## เหตุผลที่เปลี่ยน

แนวทางเดิมก่อปัญหา:

- **เริ่มต้นช้า** - การนำเข้าตัวช่วยเดียวโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบรายการ
- **การพึ่งพาแบบวนรอบ** - การส่งออกซ้ำแบบกว้างทำให้สร้างวงจรการนำเข้าได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีบอกว่า export ใดเสถียรหรือเป็นของภายใน

Plugin SDK สมัยใหม่แก้ปัญหานี้: แต่ละ path การนำเข้า (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กที่สมบูรณ์ในตัว มีเป้าหมายชัดเจนและมีสัญญาที่บันทึกไว้ในเอกสาร

ช่องทางอำนวยความสะดวกของ provider แบบดั้งเดิมสำหรับช่องทาง bundled ก็ถูกลบแล้วเช่นกัน
ช่องทางตัวช่วยที่ติดแบรนด์ตาม channel เป็นทางลัดส่วนตัวใน mono-repo ไม่ใช่
สัญญา Plugin ที่เสถียร ให้ใช้ subpath SDK แบบทั่วไปที่แคบแทน ภายใน workspace ของ Plugin
แบบ bundled ให้เก็บตัวช่วยที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ
`runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider แบบ bundled ปัจจุบัน:

- Anthropic เก็บตัวช่วยสตรีมเฉพาะ Claude ไว้ในช่องทาง `api.ts` /
  `contract-api.ts` ของตัวเอง
- OpenAI เก็บ provider builder ตัวช่วย default-model และ realtime provider
  builder ไว้ใน `api.ts` ของตัวเอง
- OpenRouter เก็บ provider builder และตัวช่วย onboarding/config ไว้ใน
  `api.ts` ของตัวเอง

## แผนย้ายระบบ Talk และเสียงแบบเรียลไทม์

โค้ด Talk สำหรับเสียงแบบเรียลไทม์ โทรศัพท์ การประชุม และเบราว์เซอร์กำลังย้ายจาก
การทำบัญชี turn เฉพาะพื้นผิวไปยังตัวควบคุมเซสชัน Talk ร่วมที่ export โดย
`openclaw/plugin-sdk/realtime-voice` ตัวควบคุมใหม่นี้เป็นเจ้าของ envelope เหตุการณ์ Talk
ร่วม สถานะ turn ที่ทำงานอยู่ สถานะการจับเสียง สถานะ output-audio ประวัติเหตุการณ์ล่าสุด
และการปฏิเสธ turn ที่หมดอายุ Plugin provider ควรยังเป็นเจ้าของ
เซสชันเรียลไทม์เฉพาะ vendor ต่อไป ส่วน Plugin พื้นผิวควรยังเป็นเจ้าของความเฉพาะของการจับเสียง
การเล่นเสียง โทรศัพท์ และการประชุมต่อไป

การย้าย Talk นี้ตั้งใจให้ตัดของเก่าอย่างสะอาด:

1. เก็บ controller/runtime primitives ร่วมไว้ใน
   `plugin-sdk/realtime-voice`
2. ย้ายพื้นผิว bundled ไปใช้ controller ร่วม: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime และ native push-to-talk
3. แทนที่ชุด Talk RPC เก่าด้วย API สุดท้าย `talk.session.*` และ
   `talk.client.*`
4. ประกาศช่องเหตุการณ์ Talk แบบ live หนึ่งช่องใน Gateway
   `hello-ok.features.events`: `talk.event`
5. ลบ endpoint HTTP เรียลไทม์เก่าและ path override คำสั่งขณะมีคำขอทั้งหมด

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่กำลัง
สร้าง adapter ระดับล่างหรือ test fixture ให้เลือกใช้ controller ร่วม
เพื่อให้เหตุการณ์ที่อยู่ในขอบเขต turn ไม่สามารถถูกปล่อยโดยไม่มี turn id, การเรียก `turnEnd` /
`turnCancel` ที่หมดอายุไม่สามารถล้าง turn ที่ใหม่กว่าและทำงานอยู่ได้ และเหตุการณ์ lifecycle
ของ output-audio ยังคงสอดคล้องกันในโทรศัพท์ การประชุม browser relay, managed-room
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
เพราะเบราว์เซอร์เป็นเจ้าของการเจรจากับ provider และการขนส่งสื่อ ขณะที่
Gateway เป็นเจ้าของข้อมูลประจำตัว คำสั่ง และนโยบายเครื่องมือ `talk.session.*` คือ
พื้นผิวร่วมที่ Gateway จัดการสำหรับ gateway-relay realtime, gateway-relay
transcription และเซสชัน STT/TTS แบบ native ของ managed-room

config แบบดั้งเดิมที่วางตัวเลือกเรียลไทม์ไว้ข้าง `talk.provider` /
`talk.providers` ควรถูกซ่อมด้วย `openclaw doctor --fix`; Talk ที่ runtime
จะไม่ตีความ config provider ด้าน speech/TTS เป็น config provider ด้านเรียลไทม์

ชุดค่าผสม `talk.session.create` ที่รองรับถูกตั้งใจให้มีขนาดเล็ก:

| โหมด            | การขนส่ง       | Brain           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียง provider แบบ full-duplex ที่เชื่อมผ่าน Gateway; การเรียกเครื่องมือถูก route ผ่านเครื่องมือ agent-consult      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT เท่านั้น; caller ส่งเสียงเข้าและรับเหตุการณ์ transcript                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ห้อง native/client | ห้องสไตล์ push-to-talk และ walkie-talkie ที่ไคลเอนต์เป็นเจ้าของการจับเสียง/เล่นเสียง และ Gateway เป็นเจ้าของสถานะ turn |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ห้อง native/client | โหมดห้องสำหรับผู้ดูแลเท่านั้น สำหรับพื้นผิว first-party ที่เชื่อถือได้ซึ่งดำเนินการ action เครื่องมือของ Gateway โดยตรง                  |

แผนที่เมธอดที่ถูกลบ:

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

ชุดคำศัพท์ควบคุมแบบรวมยังถูกทำให้แคบโดยตั้งใจเช่นกัน:

  | วิธีการ                          | ใช้กับ                                              | สัญญา                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | เพิ่มชิ้นส่วนเสียง PCM แบบ base64 ไปยังเซสชันผู้ให้บริการที่เป็นของการเชื่อมต่อ Gateway เดียวกัน                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่มรอบผู้ใช้ของ managed-room                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | สิ้นสุดรอบที่ใช้งานอยู่หลังจากตรวจสอบ stale-turn แล้ว                                                                                                                                         |
  | `talk.session.cancelTurn`       | เซสชันทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงานจับเสียง/ผู้ให้บริการ/เอเจนต์/TTS ที่ใช้งานอยู่สำหรับรอบหนึ่ง                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุดเอาต์พุตเสียงของผู้ช่วย โดยไม่จำเป็นต้องสิ้นสุดรอบของผู้ใช้                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำการเรียกเครื่องมือของผู้ให้บริการที่ relay ปล่อยออกมาให้เสร็จสมบูรณ์; ส่ง `options.willContinue` สำหรับเอาต์พุตระหว่างทาง หรือ `options.suppressResponse` เพื่อทำให้การเรียกสำเร็จโดยไม่มีการตอบกลับจากผู้ช่วยอีกครั้ง |
  | `talk.session.steer`            | เซสชัน Talk ที่มีเอเจนต์รองรับ                              | ส่งการควบคุมแบบพูด `status`, `steer`, `cancel`, หรือ `followup` ไปยังการรันแบบฝังที่ใช้งานอยู่ซึ่งแก้หาได้จากเซสชัน Talk                                                                |
  | `talk.session.close`            | เซสชันแบบรวมทั้งหมด                                    | หยุดเซสชัน relay หรือเพิกถอนสถานะ managed-room แล้วลืม id เซสชันแบบรวม                                                                                                    |

  อย่าเพิ่มกรณีพิเศษของผู้ให้บริการหรือแพลตฟอร์มใน core เพื่อให้สิ่งนี้ทำงานได้
  Core เป็นเจ้าของความหมายของเซสชัน Talk ส่วน Plugin ผู้ให้บริการเป็นเจ้าของการตั้งค่าเซสชันของ vendor
  Voice-call และ Google Meet เป็นเจ้าของอะแดปเตอร์โทรศัพท์/การประชุม Browser และแอปแบบ native
  เป็นเจ้าของ UX การจับเสียง/เล่นเสียงของอุปกรณ์

  ## นโยบายความเข้ากันได้

  สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้ให้ทำตามลำดับนี้:

  1. เพิ่มสัญญาใหม่
  2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้
  3. ส่ง diagnostic หรือคำเตือนที่ระบุชื่อ path เดิมและสิ่งที่ใช้แทน
  4. ครอบคลุมทั้งสอง path ในการทดสอบ
  5. จัดทำเอกสารการเลิกใช้และ path การย้าย
  6. ลบหลังจากหน้าต่างเวลาการย้ายที่ประกาศไว้เท่านั้น โดยปกติอยู่ใน major release

  Maintainer สามารถตรวจสอบคิวการย้ายปัจจุบันได้ด้วย
  `pnpm plugins:boundary-report` ใช้ `pnpm plugins:boundary-report:summary` สำหรับ
  จำนวนแบบย่อ, `--owner <id>` สำหรับ Plugin หนึ่งตัวหรือเจ้าของความเข้ากันได้หนึ่งราย และ
  `pnpm plugins:boundary-report:ci` เมื่อ CI gate ควรล้มเหลวเมื่อมีเรคคอร์ด
  ความเข้ากันได้ที่ครบกำหนด, การ import SDK แบบ reserved ข้ามเจ้าของ, หรือ subpath ของ SDK แบบ reserved
  ที่ไม่ได้ใช้งาน รายงานจะจัดกลุ่มเรคคอร์ด
  ความเข้ากันได้ที่เลิกใช้แล้วตามวันที่ลบ, นับการอ้างอิงในโค้ด/docs ภายในเครื่อง,
  แสดงการ import SDK แบบ reserved ข้ามเจ้าของ, และสรุป private
  memory-host SDK bridge เพื่อให้การล้างความเข้ากันได้ชัดเจนแทนที่จะ
  พึ่งพาการค้นหาแบบ ad hoc subpath ของ SDK แบบ reserved ต้องมีการติดตามการใช้งานตามเจ้าของ;
  helper export แบบ reserved ที่ไม่ได้ใช้งานควรถูกลบออกจาก SDK สาธารณะ

  ถ้า manifest field ยังคงถูกยอมรับ ผู้เขียน Plugin สามารถใช้ต่อไปได้จนกว่า
  docs และ diagnostic จะบอกเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้
  สิ่งทดแทนที่มีเอกสารกำกับ แต่ Plugin ที่มีอยู่ไม่ควรพังระหว่าง
  minor release ปกติ

  ## วิธีการย้าย

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Plugin ที่ bundled ควรหยุดเรียก
    `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ให้เลือกใช้ config ที่
    ถูกส่งเข้ามาใน active call path อยู่แล้ว handler อายุยาวที่ต้องการ
    snapshot ของ process ปัจจุบันสามารถใช้ `api.runtime.config.current()` ได้ เครื่องมือ agent อายุยาว
    ควรใช้ `ctx.getRuntimeConfig()` ของ tool context ภายใน
    `execute` เพื่อให้เครื่องมือที่ถูกสร้างก่อนมีการเขียน config ยังคงเห็น
    runtime config ที่รีเฟรชแล้ว

    การเขียน config ต้องผ่าน helper แบบ transactional และเลือก
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
    การเปลี่ยนแปลงต้องการการ restart gateway แบบสะอาด และใช้
    `afterWrite: { mode: "none", reason: "..." }` เฉพาะเมื่อผู้เรียกเป็นเจ้าของ
    การทำงานต่อและตั้งใจระงับ reload planner
    ผลลัพธ์การ mutation มีสรุป `followUp` แบบมี type สำหรับการทดสอบและ logging;
    gateway ยังคงรับผิดชอบการนำไปใช้หรือการจัดกำหนดการ restart
    `loadConfig` และ `writeConfigFile` ยังคงเป็น helper ความเข้ากันได้
    ที่เลิกใช้แล้วสำหรับ Plugin ภายนอกระหว่างหน้าต่างเวลาการย้าย และเตือนหนึ่งครั้งด้วย
    compatibility code `runtime-config-load-write` Plugin ที่ bundled และโค้ด runtime
    ของ repo ได้รับการป้องกันด้วย scanner guardrail ใน
    `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งาน Plugin แบบ production ใหม่
    จะล้มเหลวทันที, การเขียน config โดยตรงจะล้มเหลว, method ของ gateway server ต้องใช้
    request runtime snapshot, helper การส่ง/action/client ของ runtime channel
    ต้องรับ config จาก boundary ของตัวเอง, และโมดูล runtime อายุยาวต้องมี
    การเรียก `loadConfig()` แบบ ambient ที่อนุญาตเป็นศูนย์

    โค้ด Plugin ใหม่ควรหลีกเลี่ยงการ import compatibility barrel แบบกว้าง
    `openclaw/plugin-sdk/config-runtime` ด้วย ใช้ subpath ของ SDK แบบแคบ
    ที่ตรงกับงาน:

    | ความต้องการ | Import |
    | --- | --- |
    | type ของ config เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertion ของ config ที่โหลดแล้วและการ lookup config ของ plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่าน snapshot ของ runtime ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียน config | `openclaw/plugin-sdk/config-mutation` |
    | helper ของ session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config ของตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helper runtime ของ group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | การ resolve secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | การ override model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin ที่ bundled และการทดสอบของพวกมันมี scanner ป้องกันการใช้ barrel แบบกว้าง
    เพื่อให้ import และ mock อยู่เฉพาะใน behavior ที่ต้องใช้ barrel แบบกว้าง
    ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก แต่โค้ดใหม่ไม่ควร
    พึ่งพามัน

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Plugin ที่ bundled ต้องแทนที่ handler ผลลัพธ์เครื่องมือ
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

    Plugin ที่ติดตั้งแล้วสามารถลงทะเบียน tool-result middleware ได้เช่นกันเมื่อถูก
    เปิดใช้อย่างชัดเจนและประกาศทุก runtime ที่กำหนดเป้าหมายใน
    `contracts.agentToolResultMiddleware` การลงทะเบียน middleware ที่ติดตั้งแล้ว
    แต่ไม่ได้ประกาศจะถูกปฏิเสธ

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugin ช่องทางที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบ native ผ่าน
    `approvalCapability.nativeRuntime` ร่วมกับ registry runtime-context ที่ใช้ร่วมกัน

    การเปลี่ยนแปลงสำคัญ:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery เฉพาะ approval ออกจาก wiring แบบ legacy ของ `plugin.auth` /
      `plugin.approvals` ไปยัง `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจากสัญญา channel-plugin สาธารณะแล้ว;
      ย้าย field delivery/native/render ไปไว้บน `approvalCapability`
    - `plugin.auth` ยังคงอยู่สำหรับ flow login/logout ของช่องทางเท่านั้น; hook auth
      สำหรับ approval ที่นั่นจะไม่ถูก core อ่านอีกต่อไป
    - ลงทะเบียน object runtime ที่ช่องทางเป็นเจ้าของ เช่น client, token, หรือแอป Bolt
      ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่ง notice reroute ที่ Plugin เป็นเจ้าของจาก native approval handler;
      ตอนนี้ core เป็นเจ้าของ notice routed-elsewhere จากผลลัพธ์ delivery จริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้จัดเตรียม
      surface `createPluginRuntime().channel` จริง stub บางส่วนจะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับ layout approval capability ปัจจุบัน

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    ถ้า Plugin ของคุณใช้ `openclaw/plugin-sdk/windows-spawn` wrapper `.cmd`/`.bat` ของ Windows
    ที่ resolve ไม่ได้ตอนนี้จะ fail closed เว้นแต่คุณจะส่ง
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

    ถ้าผู้เรียกของคุณไม่ได้ตั้งใจพึ่งพา shell fallback อย่าตั้งค่า
    `allowShellFallback` และให้จัดการ error ที่ถูก throw แทน

  </Step>

  <Step title="Find deprecated imports">
    ค้นหา Plugin ของคุณสำหรับ import จาก surface ที่เลิกใช้แล้วอย่างใดอย่างหนึ่ง:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    แต่ละ export จาก surface เดิม map ไปยัง path import สมัยใหม่ที่เฉพาะเจาะจง:

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

    | อิมพอร์ตเก่า | ตัวเลือกสมัยใหม่ที่เทียบเท่า |
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
    แต่โค้ดใหม่ควรอิมพอร์ตพื้นผิวตัวช่วยแบบเจาะจงที่ต้องใช้จริง:

    | ความต้องการ | อิมพอร์ต |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยการปลุก Heartbeat เหตุการณ์ และการมองเห็น | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการส่งที่ค้างอยู่ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | เทเลเมทรีกิจกรรมช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคชลดรายการซ้ำในหน่วยความจำและที่มี persistent backing | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยพาธไฟล์/สื่อภายในเครื่องที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch ที่รับรู้ dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วย proxy และ guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/การแก้ไขการอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | ตัวช่วย payload การตอบกลับการอนุมัติและคำสั่ง | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของ transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | การทำงานพร้อมกันของงาน async แบบมีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การแปลงบังคับเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อก async เฉพาะโปรเซส | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่บันเดิลมาจะถูก scanner ป้องกันไม่ให้ใช้ `infra-runtime` ดังนั้นโค้ดใน repo
    จึงไม่สามารถถอยกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="Migrate channel route helpers">
    โค้ด route ของช่องทางใหม่ควรใช้ `openclaw/plugin-sdk/channel-route`
    ชื่อ route-key และ comparable-target รุ่นเก่ายังคงอยู่ในฐานะ alias
    เพื่อความเข้ากันได้ระหว่างช่วงย้ายระบบ แต่ Plugin ใหม่ควรใช้ชื่อ route
    ที่อธิบายพฤติกรรมโดยตรง:

    | ตัวช่วยเก่า | ตัวช่วยสมัยใหม่ |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วย route สมัยใหม่จะ normalize `{ channel, to, accountId, threadId }`
    อย่างสม่ำเสมอในทุกส่วน ทั้งการอนุมัติแบบเนทีฟ การระงับการตอบกลับ การลดรายการซ้ำขาเข้า
    การส่ง Cron และการกำหนด route ของเซสชัน

    อย่าเพิ่มการใช้งานใหม่ของ `ChannelMessagingAdapter.parseExplicitTarget` หรือ
    ตัวช่วย loaded-route ที่มี parser หนุนหลัง (`parseExplicitTargetForLoadedChannel`
    หรือ `resolveRouteTargetForLoadedChannel`) หรือ
    `resolveChannelRouteTargetWithParser(...)` จาก `plugin-sdk/channel-route`
    hook เหล่านี้เลิกใช้แล้วและยังคงอยู่เฉพาะสำหรับ Plugin รุ่นเก่าในช่วงย้ายระบบเท่านั้น
    Plugin ช่องทางใหม่ควรใช้
    `messaging.targetResolver.resolveTarget(...)` สำหรับการ normalize target id
    และ fallback เมื่อไม่พบไดเรกทอรี ใช้ `messaging.inferTargetChatType(...)` เมื่อ core
    ต้องการชนิด peer ล่วงหน้า และใช้ `messaging.resolveOutboundSessionRoute(...)`
    สำหรับเซสชันแบบเนทีฟของ provider และ identity ของเธรด

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## อ้างอิงพาธอิมพอร์ต

  <Accordion title="ตารางพาธนำเข้าที่ใช้ทั่วไป">
  | พาธนำเข้า | วัตถุประสงค์ | รายการส่งออกหลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยรายการเข้า Plugin แบบมาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | การส่งออกซ้ำแบบรวมศูนย์เดิมสำหรับนิยาม/ตัวสร้างรายการเข้าของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | การส่งออกสคีมาการกำหนดค่าระดับราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยรายการเข้าสำหรับผู้ให้บริการเดี่ยว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้างรายการเข้าของช่องทางแบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดตั้งค่าที่ใช้ร่วมกัน | ตัวแปลการตั้งค่า, พรอมต์รายการอนุญาต, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | ตัวช่วย runtime ระหว่างตั้งค่า | `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่นำเข้าได้อย่างปลอดภัย, ตัวช่วยบันทึกการค้นหา, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าที่มอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | นามแฝงอะแดปเตอร์การตั้งค่าที่เลิกใช้แล้ว | ใช้ `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/การกำหนดค่า/ประตูการกระทำ |
  | `plugin-sdk/account-id` | ตัวช่วย account-id | `DEFAULT_ACCOUNT_ID`, การทำให้ account-id เป็นมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + fallback ค่าเริ่มต้น |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบแคบ | ตัวช่วยรายการบัญชี/การกระทำของบัญชี |
  | `plugin-sdk/channel-setup` | อะแดปเตอร์วิซาร์ดตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | พื้นฐานการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเดินสายคำนำหน้าการตอบกลับ, การพิมพ์, และการส่งมอบต้นทาง | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | แฟกทอรีอะแดปเตอร์การกำหนดค่าและตัวช่วยการเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมาการกำหนดค่า | พื้นฐานสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไปเท่านั้น |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าที่บันเดิลมา | เฉพาะ Plugin ที่บันเดิลและดูแลโดย OpenClaw เท่านั้น; Plugin ใหม่ต้องกำหนดสคีมาเฉพาะใน Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมาการกำหนดค่าที่บันเดิลแบบเลิกใช้แล้ว | นามแฝงความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่บันเดิลและยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยการกำหนดค่าคำสั่ง Telegram | การทำชื่อคำสั่งให้เป็นมาตรฐาน, การตัดคำอธิบาย, การตรวจสอบรายการซ้ำ/ข้อขัดแย้ง |
  | `plugin-sdk/channel-policy` | การแปลงนโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | ตัวช่วย envelope ขาเข้า | ตัวช่วยเส้นทางที่ใช้ร่วมกัน + ตัวช่วยสร้าง envelope |
  | `plugin-sdk/channel-inbound` | ตัวช่วยรับขาเข้า | การสร้างบริบท, การจัดรูปแบบ, ราก, runner, การส่งคำตอบที่เตรียมไว้, และ predicate สำหรับ dispatch |
  | `plugin-sdk/messaging-targets` | พาธนำเข้าการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมายทั่วไป, `plugin-sdk/channel-route` สำหรับการเปรียบเทียบเส้นทาง, และ `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` ที่ Plugin เป็นเจ้าของสำหรับการแปลงเป้าหมายเฉพาะผู้ให้บริการ |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | ตัวช่วยวงจรชีวิตข้อความขาออก | อะแดปเตอร์ข้อความ, ใบรับ, ตัวช่วยส่งแบบคงทน, ตัวช่วยพรีวิวสด/สตรีมมิง, ตัวเลือกการตอบกลับ, ตัวช่วยวงจรชีวิต, อัตลักษณ์ขาออก, และการวางแผน payload |
  | `plugin-sdk/channel-streaming` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย thread-binding | วงจรชีวิต thread-binding และตัวช่วยอะแดปเตอร์ |
  | `plugin-sdk/agent-media-payload` | ตัวช่วย payload สื่อแบบเดิม | ตัวสร้าง payload สื่อของ agent สำหรับเลย์เอาต์ฟิลด์แบบเดิม |
  | `plugin-sdk/channel-runtime` | ชิมความเข้ากันได้ที่เลิกใช้แล้ว | ยูทิลิตี runtime ของช่องทางแบบเดิมเท่านั้น |
  | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การส่ง | ชนิดผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | พื้นที่จัดเก็บ Plugin แบบถาวร | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วย runtime แบบกว้าง | ตัวช่วย runtime/การบันทึก/สำรองข้อมูล/ติดตั้ง Plugin |
  | `plugin-sdk/runtime-env` | ตัวช่วย env ของ runtime แบบแคบ | Logger/runtime env, timeout, retry, และตัวช่วย backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วย runtime ของ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/hooks/http/interactive ของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline ของ hook | ตัวช่วย pipeline ของ Webhook/ hook ภายในที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วย lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วย process | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วย CLI runtime | การจัดรูปแบบคำสั่ง, การรอ, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | ไคลเอนต์ Gateway, ตัวช่วยเริ่มแบบพร้อม event-loop, การแปลง host LAN ที่ประกาศ, และตัวช่วยแพตช์สถานะช่องทาง |
  | `plugin-sdk/config-runtime` | ชิมความเข้ากันได้ของการกำหนดค่าที่เลิกใช้แล้ว | ควรใช้ `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram ที่ fallback ได้อย่างเสถียรเมื่อพื้นผิวสัญญาของ Telegram ที่บันเดิลไม่พร้อมใช้งาน |
  | `plugin-sdk/approval-runtime` | ตัวช่วยพรอมต์การอนุมัติ | payload การอนุมัติ exec/Plugin, ตัวช่วยความสามารถ/โปรไฟล์การอนุมัติ, ตัวช่วยการกำหนดเส้นทาง/runtime การอนุมัติแบบเนทีฟ, และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การแปลงผู้อนุมัติ, auth การกระทำในแชตเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วยไคลเอนต์การอนุมัติ | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบเนทีฟ |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วยการส่งมอบการอนุมัติ | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบเนทีฟ |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย Gateway การอนุมัติ | ตัวช่วยแปลง Gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยอะแดปเตอร์การอนุมัติ | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟขนาดเบาสำหรับ entrypoint ของช่องทาง hot |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วย handler การอนุมัติ | ตัวช่วย runtime ของ handler การอนุมัติแบบกว้างกว่า; ควรใช้ขอบเขตอะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วยผูกเป้าหมาย/บัญชีการอนุมัติแบบเนทีฟ |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยการตอบกลับการอนุมัติ | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วย runtime-context ของช่องทาง | ตัวช่วย register/get/watch runtime-context ของช่องทางทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | ตัวช่วย trust, การกั้น DM, ไฟล์/พาธที่จำกัดอยู่ใน root, external-content, และการรวบรวม secret ที่ใช้ร่วมกัน |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วยรายการอนุญาต host และนโยบายเครือข่ายส่วนตัว |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วย SSRF runtime | Pinned-dispatcher, guarded fetch, ตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วยเหตุการณ์ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | ตัวช่วย wake, event, และ visibility ของ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิวการส่งมอบ | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe | แคช dedupe แบบในหน่วยความจำและแบบมีพื้นที่จัดเก็บถาวรหนุนหลัง |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยการเข้าถึงไฟล์ | ตัวช่วยพาธไฟล์/สื่อภายในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของ transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยนโยบายการอนุมัติ exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | ตัวช่วยแคชแบบมีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วยกั้น diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วยกราฟข้อผิดพลาด |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy ที่ครอบไว้ | `resolveFetch`, ตัวช่วย proxy, ตัวช่วยตัวเลือก EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยทำ host ให้เป็นมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วย retry | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | การจัดรูปแบบรายการอนุญาตและการแมปอินพุต | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | ตัวช่วยกั้นคำสั่งและพื้นผิวคำสั่ง | `resolveControlCommandGate`, ตัวช่วยการอนุญาตผู้ส่ง, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | renderer สถานะ/วิธีใช้คำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์อินพุต secret | ตัวช่วยอินพุต secret |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | ยูทิลิตีเป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วย guard ของ body Webhook | ตัวช่วยอ่าน/จำกัด body คำขอ |
  | `plugin-sdk/reply-runtime` | runtime การตอบกลับที่ใช้ร่วมกัน | การ dispatch ขาเข้า, Heartbeat, ตัววางแผนการตอบกลับ, การแบ่งชิ้น |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch การตอบกลับแบบแคบ | Finalize, dispatch ผู้ให้บริการ, และตัวช่วยป้ายกำกับบทสนทนา |
  | `plugin-sdk/reply-history` | ตัวช่วย reply-history | `createChannelHistoryWindow`; รายการส่งออกความเข้ากันได้ของ map-helper ที่เลิกใช้แล้ว เช่น `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, และ `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผนอ้างอิงการตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งชิ้นการตอบกลับ | ตัวช่วยแบ่งชิ้นข้อความ/markdown |
  | `plugin-sdk/session-store-runtime` | ตัวช่วย session store | พาธ store + ตัวช่วย updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วยพาธสถานะ | ตัวช่วยไดเรกทอรีสถานะและ OAuth |
  | `plugin-sdk/routing` | ตัวช่วย routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยการทำให้ session-key เป็นมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี, ค่าเริ่มต้นของสถานะรันไทม์, ตัวช่วยเมทาดาทาของปัญหา |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วยตัวแก้เป้าหมาย | ตัวช่วยตัวแก้เป้าหมายที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยการทำให้สตริงเป็นมาตรฐาน | ตัวช่วยการทำให้ slug/สตริงเป็นมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL คำขอ | ดึง URL สตริงจากอินพุตแบบคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบกำหนดเวลา | ตัวรันคำสั่งแบบกำหนดเวลาพร้อม stdout/stderr ที่ทำให้เป็นมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
  | `plugin-sdk/tool-payload` | การดึงเพย์โหลดเครื่องมือ | ดึงเพย์โหลดที่ทำให้เป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์เครื่องมือ |
  | `plugin-sdk/tool-send` | การดึงการส่งของเครื่องมือ | ดึงฟิลด์เป้าหมายการส่งตามแบบบัญญัติจากอาร์กิวเมนต์เครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยเส้นทางชั่วคราว | ตัวช่วยเส้นทางดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยการปกปิดข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ประเภทการตอบกลับข้อความ | ประเภทเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการในเครื่อง/โฮสต์เองที่คัดสรรแล้ว | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการแบบโฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะจุด | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการแบบโฮสต์เองเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการยืนยันตัวตนรันไทม์ของผู้ให้บริการ | ตัวช่วยการแก้ API key ของรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการตั้งค่า API key ของผู้ให้บริการ | ตัวช่วยเริ่มต้นใช้งาน/เขียนโปรไฟล์ API key |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยการเลือกผู้ให้บริการ | การเลือกผู้ให้บริการจากค่ากำหนดหรืออัตโนมัติ และการรวมค่ากำหนดผู้ให้บริการดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วย env-var ของผู้ให้บริการ | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/รีเพลย์ผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายรีเพลย์ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยการทำ model-id ให้เป็นมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์การเริ่มต้นใช้งานผู้ให้บริการ | ตัวช่วยค่ากำหนดการเริ่มต้นใช้งาน |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของผู้ให้บริการ | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยค่ากำหนด web-search ของผู้ให้บริการ | ตัวช่วยค่ากำหนด/ข้อมูลรับรอง web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องมีการเดินสายเปิดใช้ Plugin |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของผู้ให้บริการ | ตัวช่วยสัญญาค่ากำหนด/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลรับรองตามขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของผู้ให้บริการ | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยของ DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานของผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` และตัวช่วยการใช้งานของผู้ให้บริการอื่น ๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วย wrapper สตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท wrapper สตรีม และตัวช่วย wrapper ที่ใช้ร่วมกันของ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ของผู้ให้บริการ | ตัวช่วย transport ผู้ให้บริการแบบเนทีฟ เช่น guarded fetch, การดึงข้อความ tool-result, การแปลงข้อความ transport และสตรีมเหตุการณ์ transport ที่เขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิว async แบบเรียงลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึง/แปลง/จัดเก็บสื่อ, การตรวจขนาดวิดีโอที่อิง ffprobe และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วย media-generation ที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน, การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดลสำหรับการสร้างภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วย media-understanding | ประเภทผู้ให้บริการความเข้าใจสื่อ พร้อม export ตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | export ความเข้ากันได้ของข้อความแบบกว้างที่เลิกใช้แล้ว | ใช้ `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` และ `logging-core` |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งข้อความเป็นส่วน | ตัวช่วยแบ่งข้อความขาออกเป็นส่วน |
  | `plugin-sdk/speech` | ตัวช่วยเสียงพูด | ประเภทผู้ให้บริการเสียงพูด พร้อมตัวช่วย directive, registry, validation สำหรับผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | แกนเสียงพูดที่ใช้ร่วมกัน | ประเภทผู้ให้บริการเสียงพูด, registry, directive, การทำให้เป็นมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยถอดเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ประเภทผู้ให้บริการ, ตัวช่วย registry/resolution, ตัวช่วยเซสชัน bridge, คิว agent talk-back ที่ใช้ร่วมกัน, การควบคุมเสียง active-run, สุขภาพ transcript/event, การกด echo, การจับคู่คำถามปรึกษา, การประสานงาน forced-consult, การติดตาม turn-context, การติดตามกิจกรรมเอาต์พุต และตัวช่วยปรึกษาบริบทอย่างรวดเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วย image-generation | ประเภทผู้ให้บริการการสร้างภาพ พร้อมตัวช่วย asset รูปภาพ/data URL และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | แกน image-generation ที่ใช้ร่วมกัน | ประเภท image-generation, failover, auth และตัวช่วย registry |
  | `plugin-sdk/music-generation` | ตัวช่วย music-generation | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์ music-generation |
  | `plugin-sdk/music-generation-core` | แกน music-generation ที่ใช้ร่วมกัน | ประเภท music-generation, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วย video-generation | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์ video-generation |
  | `plugin-sdk/video-generation-core` | แกน video-generation ที่ใช้ร่วมกัน | ประเภท video-generation, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การทำให้เป็นมาตรฐาน/ลดรูปเพย์โหลดการตอบกลับแบบโต้ตอบ |
  | `plugin-sdk/channel-config-primitives` | primitive ค่ากำหนดช่องทาง | primitive config-schema ช่องทางแบบแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยการเขียนค่ากำหนดช่องทาง | ตัวช่วยการอนุญาตการเขียนค่ากำหนดช่องทาง |
  | `plugin-sdk/channel-plugin-common` | prelude ช่องทางที่ใช้ร่วมกัน | export prelude Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยค่ากำหนด allowlist | ตัวช่วยแก้ไข/อ่านค่ากำหนด allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยการตัดสินใจเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วย guard สำหรับ Direct-DM | ตัวช่วยนโยบาย guard ก่อน crypto แบบแคบ |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | primitive ตัวช่วย passive-channel/status และ ambient proxy |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | ตัวช่วย registry เป้าหมาย Webhook และการติดตั้ง route |
  | `plugin-sdk/webhook-path` | alias เส้นทาง Webhook ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/ในเครื่อง |
  | `plugin-sdk/zod` | re-export ความเข้ากันได้ของ Zod ที่เลิกใช้แล้ว | import `zod` จาก `zod` โดยตรง |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่ bundled | พื้นผิวตัวช่วยตัวจัดการหน่วยความจำ/ค่ากำหนด/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์เอนจินหน่วยความจำ | facade รันไทม์ดัชนี/ค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-embedding-registry` | registry embedding หน่วยความจำ | ตัวช่วย registry ผู้ให้บริการ embedding หน่วยความจำแบบเบา |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจิน foundation ของโฮสต์หน่วยความจำ | export เอนจิน foundation ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจิน embedding ของโฮสต์หน่วยความจำ | สัญญา embedding หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการในเครื่อง และตัวช่วย batch/remote ทั่วไป; ผู้ให้บริการระยะไกลที่เป็นรูปธรรมอยู่ใน Plugin เจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | export เอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจิน storage ของโฮสต์หน่วยความจำ | export เอนจิน storage ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของโฮสต์หน่วยความจำ | ตัวช่วย multimodal ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์หน่วยความจำ | ตัวช่วย query ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | alias เหตุการณ์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะโฮสต์หน่วยความจำ | ตัวช่วยสถานะโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์ core ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ core ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | alias รันไทม์ core ของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วยรันไทม์ core ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | alias บันทึกเหตุการณ์โฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วยบันทึกเหตุการณ์โฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | alias ไฟล์/รันไทม์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown ที่จัดการแล้ว | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | facade การค้นหา Active Memory | facade รันไทม์ search-manager ของ active-memory แบบ lazy |
  | `plugin-sdk/memory-host-status` | alias สถานะโฮสต์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | ยูทิลิตีทดสอบ | barrel ความเข้ากันได้ที่เลิกใช้แล้วใน repo-local; ใช้ subpath ทดสอบ repo-local แบบเฉพาะจุด เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยสำหรับการย้ายระบบที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ของคอมไพเลอร์อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports จะถูกสร้างจาก
ชุดย่อยสาธารณะ

seams ตัวช่วยของ bundled-plugin ที่สงวนไว้ถูกเลิกใช้จาก export map ของ SDK
สาธารณะแล้ว ยกเว้น facade เพื่อความเข้ากันได้ที่จัดทำเอกสารไว้อย่างชัดเจน เช่น
shim `plugin-sdk/discord` ที่เลิกใช้แล้วแต่ยังคงไว้สำหรับแพ็กเกจที่เผยแพร่แล้ว
`@openclaw/discord@2026.3.13` ตัวช่วยเฉพาะเจ้าของจะอยู่ภายในแพ็กเกจ Plugin
ที่เป็นเจ้าของนั้น พฤติกรรม host ที่ใช้ร่วมกันควรย้ายผ่านสัญญา SDK ทั่วไป
เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`

ใช้อิมพอร์ตที่แคบที่สุดซึ่งตรงกับงาน หากหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถามผู้ดูแลว่า generic contract ใด
ควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้งานที่ยังมีผลอยู่

การเลิกใช้งานที่แคบลงซึ่งมีผลครอบคลุม plugin SDK, provider contract,
runtime surface และ manifest แต่ละรายการยังใช้งานได้ในวันนี้ แต่จะถูกลบออก
ใน major release ในอนาคต รายการใต้แต่ละหัวข้อจะจับคู่ API เดิมกับตัวแทน
มาตรฐานของมัน

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม,
    exports เดิม - เพียงอิมพอร์ตจาก subpath ที่แคบกว่า `command-auth`
    re-export สิ่งเหล่านี้เป็น compat stubs

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
    decision object เดียวแทนการเรียกที่แยกเป็นสองส่วน

    channel plugins ปลายน้ำ (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนแล้ว

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` เป็น compatibility shim สำหรับ
    channel plugins รุ่นเก่า อย่าอิมพอร์ตจากโค้ดใหม่ ให้ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียน runtime
    objects

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions`
    ถูกเลิกใช้พร้อมกับ channel exports แบบ "actions" ดิบ ให้เปิดเผย
    capabilities ผ่าน semantic `presentation` surface แทน - channel plugins
    ประกาศว่ามัน render อะไร (cards, buttons, selects) แทนการประกาศว่ามัน
    ยอมรับชื่อ action ดิบใดบ้าง

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`.

    **ใหม่**: implement `createTool(...)` โดยตรงบน provider plugin
    OpenClaw ไม่จำเป็นต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน tool wrapper อีกต่อไป

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **เดิม**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้าง prompt envelope
    แบบ plaintext แบนจาก inbound channel messages

    **ใหม่**: `BodyForAgent` พร้อม structured user-context blocks
    channel plugins แนบ routing metadata (thread, topic, reply-to, reactions)
    เป็น typed fields แทนการต่อรวมเข้าไปใน prompt string ตัวช่วย
    `formatAgentEnvelope(...)` ยังรองรับสำหรับ envelopes ที่สังเคราะห์เพื่อ
    assistant แต่ inbound plaintext envelopes กำลังจะถูกเลิกใช้

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received` และ
    channel plugin แบบกำหนดเองใด ๆ ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **เดิม**: `api.on("deactivate", handler)`.

    **ใหม่**: `api.on("gateway_stop", handler)`. event และ context เป็น
    สัญญา shutdown cleanup เดียวกัน เปลี่ยนเฉพาะชื่อ hook เท่านั้น

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

    `deactivate` ยังคงเชื่อมไว้เป็น compatibility alias ที่เลิกใช้แล้ว
    จนกว่าจะหลัง 2026-08-16

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **เดิม**: `api.on("subagent_spawning", handler)` ที่คืนค่า
    `threadBindingReady` หรือ `deliveryOrigin`

    **ใหม่**: ให้ core เตรียม subagent bindings แบบ `thread: true` ผ่าน
    channel session-binding adapter ใช้ `api.on("subagent_spawned", handler)`
    เฉพาะสำหรับการสังเกตหลังเริ่มทำงาน

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ยังคงอยู่เฉพาะในฐานะ
    compatibility surfaces ที่เลิกใช้แล้ว ขณะที่ external plugins กำลังย้ายระบบ

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    type aliases สำหรับ discovery สี่รายการตอนนี้เป็น wrappers บาง ๆ บน types
    ยุค catalog:

    | alias เดิม                | type ใหม่                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง static bag `ProviderCapabilities` แบบ legacy - provider plugins
    ควรใช้ provider hooks ที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas` และ `wrapStreamFn` แทน static object

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **เดิม** (สาม hook แยกกันบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` และ
    `resolveDefaultThinkingLevel(ctx)`.

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่คืนค่า
    `ProviderThinkingProfile` พร้อม `id` มาตรฐาน, `label` แบบ optional และ
    รายการระดับที่จัดอันดับแล้ว OpenClaw จะ downgrade ค่าที่จัดเก็บไว้ซึ่ง
    ล้าสมัยตามอันดับของ profile โดยอัตโนมัติ

    context รวม `provider`, `modelId`, `reasoning` ที่ merge แล้วแบบ optional
    และ facts `compat` ของ model ที่ merge แล้วแบบ optional provider plugins
    สามารถใช้ catalog facts เหล่านั้นเพื่อเปิดเผย profile เฉพาะ model ได้
    เฉพาะเมื่อ request contract ที่กำหนดค่ารองรับเท่านั้น

    implement หนึ่ง hook แทนสาม hook hooks แบบ legacy ยังใช้งานได้ระหว่าง
    deprecation window แต่จะไม่ถูก compose กับผลลัพธ์ profile

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **เดิม**: implement external auth hooks โดยไม่ประกาศ provider
    ใน plugin manifest

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน plugin manifest
    **และ** implement `resolveExternalAuthProfiles(...)`

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    manifest field **เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **ใหม่**: mirror การค้นหา env-var เดียวกันเข้าไปใน
    `setup.providers[].envVars` บน manifest สิ่งนี้รวม metadata env ของ
    setup/status ไว้ในที่เดียว และหลีกเลี่ยงการ boot plugin runtime เพียงเพื่อ
    ตอบการค้นหา env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter จนกว่า
    deprecation window จะปิด

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **เดิม**: การเรียกสามครั้งแยกกัน -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **ใหม่**: การเรียกครั้งเดียวบน memory-state API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    slots เดิม, การเรียกลงทะเบียนเดียว ตัวช่วย prompt และ corpus แบบเพิ่มเสริม
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **เดิม**: `api.registerMemoryEmbeddingProvider(...)` พร้อม
    `contracts.memoryEmbeddingProviders`.

    **ใหม่**: `api.registerEmbeddingProvider(...)` พร้อม
    `contracts.embeddingProviders`.

    generic embedding provider contract ใช้ซ้ำนอก memory ได้ และเป็นเส้นทาง
    ที่รองรับสำหรับ providers ใหม่ API ลงทะเบียนเฉพาะ memory ยังคงเชื่อมไว้
    เป็นความเข้ากันได้ที่เลิกใช้แล้ว ขณะที่ providers เดิมกำลังย้ายระบบ
    รายงานการตรวจสอบ Plugin จะรายงานการใช้งานที่ไม่ใช่ bundled เป็นหนี้
    ความเข้ากันได้

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    type aliases แบบ legacy สองรายการยังคง export จาก `src/plugins/runtime/types.ts`:

    | เดิม                          | ใหม่                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method `readSession` ถูกเลิกใช้แล้วเพื่อใช้
    `getSessionMessages` แทน signature เดียวกัน; method เดิมเรียกต่อไปยัง
    method ใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) คืนค่า live task-flow accessor

    **ใหม่**: `runtime.tasks.managedFlows` เก็บ managed TaskFlow mutation
    runtime ไว้สำหรับ plugins ที่สร้าง, อัปเดต, ยกเลิก หรือรัน child tasks
    จาก flow ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเพียงการอ่านแบบ
    DTO-based

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ครอบคลุมอยู่ใน "วิธีย้ายระบบ → ย้าย embedded tool-result extensions ไปยัง
    middleware" ด้านบน รวมไว้ที่นี่เพื่อความครบถ้วน: path
    `api.registerEmbeddedExtensionFactory(...)` แบบ embedded-runner-only ที่ถูกลบ
    ถูกแทนที่ด้วย `api.registerAgentToolResultMiddleware(...)` พร้อมรายการ runtime
    ที่ชัดเจนใน `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` ที่ re-export จาก `openclaw/plugin-sdk` ตอนนี้เป็น
    alias บรรทัดเดียวสำหรับ `OpenClawConfig` แนะนำให้ใช้ชื่อมาตรฐาน

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
การเลิกใช้งานระดับ extension (ภายใน bundled channel/provider plugins ใต้
`extensions/`) ถูกติดตามไว้ใน barrels `api.ts` และ `runtime-api.ts` ของตัวเอง
สิ่งเหล่านี้ไม่กระทบสัญญา Plugin ของบุคคลที่สาม และไม่ได้แสดงไว้ที่นี่
หากคุณ consume local barrel ของ bundled plugin โดยตรง ให้อ่านคอมเมนต์การเลิกใช้
ใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การลบ

| เมื่อใด                 | สิ่งที่จะเกิดขึ้น                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**             | พื้นผิวที่เลิกใช้แล้วจะแสดงคำเตือนขณะรันไทม์                            |
| **รุ่นหลักถัดไป**      | พื้นผิวที่เลิกใช้แล้วจะถูกนำออก; Plugin ที่ยังใช้อยู่จะล้มเหลว          |

Plugin หลักทั้งหมดได้รับการย้ายแล้ว Plugin ภายนอกควรย้าย
ก่อนรุ่นหลักถัดไป

## การระงับคำเตือนชั่วคราว

ตั้งค่าตัวแปรสภาพแวดล้อมเหล่านี้ขณะคุณทำงานย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางออกชั่วคราว ไม่ใช่วิธีแก้ปัญหาถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิงการนำเข้าพาธย่อยทั้งหมด
- [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins) - การสร้าง Plugin ช่องทาง
- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - การสร้าง Plugin ผู้ให้บริการ
- [ภายในของ Plugin](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [ไฟล์กำกับ Plugin](/th/plugins/manifest) - เอกสารอ้างอิงสคีมาไฟล์กำกับ
