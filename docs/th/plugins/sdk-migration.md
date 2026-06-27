---
read_when:
    - คุณเห็นคำเตือน OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - คุณเห็นคำเตือน OPENCLAW_EXTENSION_API_DEPRECATED
    - คุณใช้ api.registerEmbeddedExtensionFactory ก่อน OpenClaw 2026.4.25
    - คุณกำลังอัปเดต Plugin ให้เป็นสถาปัตยกรรม Plugin สมัยใหม่
    - คุณดูแล Plugin ภายนอกของ OpenClaw
sidebarTitle: Migrate to SDK
summary: ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบเดิมไปยัง SDK ของ Plugin สมัยใหม่
title: การย้ายไปใช้ Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:07:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ได้ย้ายจากเลเยอร์ความเข้ากันได้ย้อนหลังแบบกว้าง ไปสู่สถาปัตยกรรม Plugin
สมัยใหม่ที่มีการนำเข้าแบบเจาะจงและมีเอกสารกำกับ หาก Plugin ของคุณถูกสร้างก่อน
สถาปัตยกรรมใหม่ คู่มือนี้จะช่วยคุณย้ายระบบ

## สิ่งที่กำลังเปลี่ยนแปลง

ระบบ Plugin เดิมมีพื้นผิวแบบเปิดกว้างสองส่วนที่ให้ Plugin นำเข้า
ทุกอย่างที่ต้องใช้ได้จากจุดเข้าถึงเดียว:

- **`openclaw/plugin-sdk/compat`** - การนำเข้าเดียวที่ส่งออกตัวช่วยซ้ำหลายสิบรายการ
  ถูกเพิ่มเข้ามาเพื่อให้ Plugin รุ่นเก่าที่อิง hook ยังทำงานได้ระหว่างที่
  สถาปัตยกรรม Plugin ใหม่กำลังถูกสร้าง
- **`openclaw/plugin-sdk/infra-runtime`** - barrel ตัวช่วยรันไทม์แบบกว้างที่
  ผสมเหตุการณ์ระบบ สถานะ Heartbeat คิวการส่งมอบ ตัวช่วย fetch/proxy
  ตัวช่วยไฟล์ ชนิด approval และยูทิลิตีที่ไม่เกี่ยวข้องกัน
- **`openclaw/plugin-sdk/config-runtime`** - barrel ความเข้ากันได้ของคอนฟิกแบบกว้าง
  ที่ยังคงพกตัวช่วย load/write โดยตรงที่เลิกแนะนำแล้วในช่วงหน้าต่างการย้ายระบบ
- **`openclaw/extension-api`** - สะพานที่ให้ Plugin เข้าถึงตัวช่วยฝั่งโฮสต์โดยตรง
  เช่น agent runner แบบฝัง
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ส่วนขยายแบบ bundled สำหรับ embedded-runner เท่านั้นที่ถูกลบแล้ว
  ซึ่งเคยสังเกตเหตุการณ์ของ embedded-runner เช่น
  `tool_result`

พื้นผิวการนำเข้าแบบกว้างตอนนี้ถูก**เลิกแนะนำ**แล้ว พื้นผิวเหล่านี้ยังทำงานได้ในรันไทม์
แต่ Plugin ใหม่ต้องไม่ใช้ และ Plugin ที่มีอยู่ควรย้ายระบบก่อน
รุ่น major ถัดไปที่จะลบพื้นผิวเหล่านี้ออก API การลงทะเบียน extension factory
สำหรับ embedded-runner เท่านั้นถูกลบแล้ว ให้ใช้ middleware ของผลลัพธ์เครื่องมือแทน

OpenClaw จะไม่ลบหรือตีความพฤติกรรม Plugin ที่มีเอกสารกำกับใหม่ใน
การเปลี่ยนแปลงเดียวกับที่เพิ่มสิ่งทดแทน การเปลี่ยนแปลงสัญญาที่ทำให้แตกหักต้องผ่าน
adapter ความเข้ากันได้ การวินิจฉัย เอกสาร และหน้าต่างการเลิกใช้งานก่อน
ข้อกำหนดนี้ใช้กับการนำเข้า SDK, ฟิลด์ manifest, API การตั้งค่า, hook และพฤติกรรม
การลงทะเบียนในรันไทม์

<Warning>
  เลเยอร์ความเข้ากันได้ย้อนหลังจะถูกลบในรุ่น major ในอนาคต
  Plugin ที่ยังนำเข้าจากพื้นผิวเหล่านี้จะพังเมื่อถึงตอนนั้น
  การลงทะเบียน embedded extension factory รุ่นเก่าไม่ถูกโหลดอีกต่อไปแล้ว
</Warning>

## เหตุผลของการเปลี่ยนแปลงนี้

แนวทางเดิมก่อให้เกิดปัญหา:

- **การเริ่มต้นช้า** - การนำเข้าตัวช่วยหนึ่งตัวโหลดโมดูลที่ไม่เกี่ยวข้องหลายสิบรายการ
- **การพึ่งพาแบบวนรอบ** - การส่งออกซ้ำแบบกว้างทำให้สร้างวงจรการนำเข้าได้ง่าย
- **พื้นผิว API ไม่ชัดเจน** - ไม่มีวิธีบอกว่า export ใดเสถียรและ export ใดเป็นภายใน

SDK ของ Plugin สมัยใหม่แก้ปัญหานี้: แต่ละพาธนำเข้า (`openclaw/plugin-sdk/\<subpath\>`)
เป็นโมดูลขนาดเล็กที่เป็นเอกเทศ มีวัตถุประสงค์ชัดเจนและมีสัญญาที่มีเอกสารกำกับ

seam อำนวยความสะดวกของ provider รุ่นเก่าสำหรับช่องทาง bundled ก็ถูกลบแล้วเช่นกัน
seam ตัวช่วยที่ผูกกับแบรนด์ช่องทางเป็นทางลัดส่วนตัวใน mono-repo ไม่ใช่
สัญญา Plugin ที่เสถียร ให้ใช้ subpath ของ SDK แบบทั่วไปที่แคบแทน ภายใน workspace ของ
Plugin แบบ bundled ให้เก็บตัวช่วยที่ provider เป็นเจ้าของไว้ใน `api.ts` หรือ
`runtime-api.ts` ของ Plugin นั้นเอง

ตัวอย่าง provider แบบ bundled ปัจจุบัน:

- Anthropic เก็บตัวช่วยสตรีมเฉพาะ Claude ไว้ใน seam `api.ts` /
  `contract-api.ts` ของตนเอง
- OpenAI เก็บ provider builder, ตัวช่วยโมเดลเริ่มต้น และ realtime provider
  builder ไว้ใน `api.ts` ของตนเอง
- OpenRouter เก็บ provider builder และตัวช่วย onboarding/config ไว้ใน
  `api.ts` ของตนเอง

## แผนการย้าย Talk และเสียงเรียลไทม์

โค้ดเสียงเรียลไทม์ โทรศัพท์ การประชุม และ Talk บนเบราว์เซอร์กำลังย้ายจาก
การจดบันทึก turn เฉพาะแต่ละพื้นผิว ไปยังตัวควบคุม session ของ Talk แบบใช้ร่วมกันที่ส่งออกโดย
`openclaw/plugin-sdk/realtime-voice` ตัวควบคุมใหม่เป็นเจ้าของ envelope เหตุการณ์ Talk
ร่วมกัน สถานะ turn ที่ active สถานะ capture สถานะ output-audio ประวัติเหตุการณ์ล่าสุด
และการปฏิเสธ stale-turn Plugin provider ควรยังคงเป็นเจ้าของ session เรียลไทม์
เฉพาะผู้ขาย ส่วน Plugin พื้นผิวควรยังคงเป็นเจ้าของ capture,
playback, telephony และความเฉพาะตัวของการประชุม

การย้าย Talk นี้ตั้งใจให้เป็นการล้างที่ทำให้แตกหักอย่างชัดเจน:

1. เก็บ primitive ของตัวควบคุม/รันไทม์ที่ใช้ร่วมกันไว้ใน
   `plugin-sdk/realtime-voice`
2. ย้ายพื้นผิว bundled ไปยังตัวควบคุมที่ใช้ร่วมกัน: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime และ native push-to-talk
3. แทนที่ตระกูล RPC Talk เดิมด้วย API สุดท้าย `talk.session.*` และ
   `talk.client.*`
4. ประกาศช่องเหตุการณ์ Talk แบบ live หนึ่งช่องใน Gateway
   `hello-ok.features.events`: `talk.event`
5. ลบ endpoint HTTP เรียลไทม์เดิมและพาธ override คำสั่งขณะรับคำขอทั้งหมด

โค้ดใหม่ไม่ควรเรียก `createTalkEventSequencer(...)` โดยตรง เว้นแต่ว่าโค้ดนั้น
กำลังทำ adapter ระดับต่ำหรือ fixture ทดสอบ ให้ใช้ตัวควบคุมที่ใช้ร่วมกันแทน
เพื่อไม่ให้เหตุการณ์ที่ผูกกับ turn ถูกส่งออกโดยไม่มี turn id, เพื่อไม่ให้การเรียก `turnEnd` /
`turnCancel` ที่ล้าสมัยล้าง turn ที่ active ใหม่กว่าได้ และเพื่อให้เหตุการณ์ lifecycle ของ
output-audio สอดคล้องกันในโทรศัพท์ การประชุม browser relay, managed-room
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

session WebRTC/provider-websocket ที่เบราว์เซอร์เป็นเจ้าของใช้ `talk.client.create`
เพราะเบราว์เซอร์เป็นเจ้าของการเจรจากับ provider และการขนส่งสื่อ ในขณะที่
Gateway เป็นเจ้าของ credential, คำสั่ง และนโยบายเครื่องมือ `talk.session.*` คือ
พื้นผิวร่วมที่ Gateway จัดการสำหรับ gateway-relay realtime, gateway-relay
transcription และ session STT/TTS แบบ native ของ managed-room

คอนฟิกรุ่นเก่าที่วางตัวเลือกเรียลไทม์ไว้ข้าง `talk.provider` /
`talk.providers` ควรถูกซ่อมด้วย `openclaw doctor --fix`; Talk ในรันไทม์
จะไม่ตีความคอนฟิก provider speech/TTS เป็นคอนฟิก provider เรียลไทม์ใหม่

ชุดค่าผสม `talk.session.create` ที่รองรับตั้งใจให้มีขนาดเล็ก:

| โหมด            | การขนส่ง       | Brain           | เจ้าของ              | หมายเหตุ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | เสียง provider แบบ full-duplex ที่เชื่อมผ่าน Gateway; การเรียกเครื่องมือถูก route ผ่านเครื่องมือ agent-consult      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | เฉพาะ streaming STT; ผู้เรียกส่งเสียงขาเข้าและรับเหตุการณ์ transcript                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ห้อง native/client | ห้องรูปแบบ push-to-talk และ walkie-talkie ที่ไคลเอนต์เป็นเจ้าของ capture/playback และ Gateway เป็นเจ้าของสถานะ turn |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ห้อง native/client | โหมดห้องสำหรับผู้ดูแลเท่านั้นสำหรับพื้นผิว first-party ที่เชื่อถือได้ซึ่งดำเนินการ action เครื่องมือของ Gateway โดยตรง                  |

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

คำศัพท์ควบคุมแบบรวมศูนย์ยังตั้งใจให้แคบเช่นกัน:

  | วิธีการ                          | ใช้กับ                                              | สัญญา                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | เพิ่มชิ้นส่วนเสียง PCM แบบ base64 ไปยังเซสชันผู้ให้บริการที่เป็นของการเชื่อมต่อ Gateway เดียวกัน                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | เริ่มเทิร์นผู้ใช้แบบ managed-room                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | จบเทิร์นที่ใช้งานอยู่หลังจากตรวจสอบ stale-turn                                                                                                                                         |
  | `talk.session.cancelTurn`       | เซสชันทั้งหมดที่ Gateway เป็นเจ้าของ                              | ยกเลิกงาน capture/provider/agent/TTS ที่ใช้งานอยู่สำหรับเทิร์นหนึ่ง                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | หยุดเอาต์พุตเสียงของผู้ช่วยโดยไม่จำเป็นต้องจบเทิร์นของผู้ใช้                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ relay ส่งออกมาเสร็จสมบูรณ์; ส่ง `options.willContinue` สำหรับเอาต์พุตชั่วคราว หรือ `options.suppressResponse` เพื่อตอบสนองการเรียกโดยไม่มีการตอบกลับจากผู้ช่วยอีกครั้ง |
  | `talk.session.steer`            | เซสชัน Talk ที่มีเอเจนต์รองรับ                              | ส่งคำสั่งควบคุมแบบพูด `status`, `steer`, `cancel` หรือ `followup` ไปยังรันแบบฝังที่ใช้งานอยู่ซึ่ง resolve จากเซสชัน Talk                                                                |
  | `talk.session.close`            | เซสชันรวมทั้งหมด                                    | หยุดเซสชัน relay หรือเพิกถอนสถานะ managed-room แล้วลืม id เซสชันรวม                                                                                                    |

  อย่าเพิ่มกรณีพิเศษของผู้ให้บริการหรือแพลตฟอร์มใน core เพื่อให้สิ่งนี้ทำงานได้
  Core เป็นเจ้าของความหมายของเซสชัน Talk ส่วน Plugin ผู้ให้บริการเป็นเจ้าของการตั้งค่าเซสชันของผู้ขาย
  Voice-call และ Google Meet เป็นเจ้าของอะแดปเตอร์โทรศัพท์/การประชุม ส่วนเบราว์เซอร์และแอป native
  เป็นเจ้าของ UX การจับเสียง/เล่นเสียงของอุปกรณ์

  ## นโยบายความเข้ากันได้

  สำหรับ Plugin ภายนอก งานด้านความเข้ากันได้ทำตามลำดับนี้:

  1. เพิ่มสัญญาใหม่
  2. คงพฤติกรรมเดิมไว้โดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้
  3. ส่ง diagnostic หรือคำเตือนที่ระบุพาธเดิมและตัวแทนที่ใช้แทน
  4. ครอบคลุมทั้งสองพาธในเทสต์
  5. จัดทำเอกสารการเลิกใช้และพาธการย้าย
  6. ลบเฉพาะหลังจากช่วงเวลาการย้ายที่ประกาศไว้ ซึ่งมักอยู่ในรีลีส major

  ผู้ดูแลสามารถ audit คิวการย้ายปัจจุบันได้ด้วย
  `pnpm plugins:boundary-report` ใช้ `pnpm plugins:boundary-report:summary` สำหรับ
  จำนวนแบบกะทัดรัด, `--owner <id>` สำหรับ Plugin เดียวหรือเจ้าของความเข้ากันได้หนึ่งราย และ
  `pnpm plugins:boundary-report:ci` เมื่อ gate ของ CI ควรล้มเหลวจากระเบียน
  ความเข้ากันได้ที่ครบกำหนด, การนำเข้า SDK แบบ reserved ข้ามเจ้าของ หรือ subpath ของ SDK แบบ reserved
  ที่ไม่ได้ใช้ รายงานจะจัดกลุ่มระเบียน
  ความเข้ากันได้ที่เลิกใช้แล้วตามวันที่ลบ, นับการอ้างอิงในโค้ด/เอกสารภายใน,
  แสดงการนำเข้า SDK แบบ reserved ข้ามเจ้าของ และสรุป bridge ของ SDK memory-host
  แบบ private เพื่อให้การ cleanup ความเข้ากันได้ยังคงชัดเจนแทนที่จะ
  พึ่งพาการค้นหาเฉพาะกิจ subpath ของ SDK แบบ reserved ต้องมีการติดตามการใช้งานตามเจ้าของ;
  export ของ helper แบบ reserved ที่ไม่ได้ใช้ควรถูกลบออกจาก SDK สาธารณะ

  หากฟิลด์ manifest ยังถูกยอมรับอยู่ ผู้เขียน Plugin สามารถใช้ต่อไปได้จนกว่า
  เอกสารและ diagnostic จะระบุเป็นอย่างอื่น โค้ดใหม่ควรเลือกใช้ตัวแทนที่จัดทำเอกสารไว้
  แต่ Plugin ที่มีอยู่ไม่ควรพังระหว่างรีลีส minor ตามปกติ

  ## วิธีการย้าย

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Plugin ที่ bundle มาด้วยควรหยุดเรียก
    `api.runtime.config.loadConfig()` และ
    `api.runtime.config.writeConfigFile(...)` โดยตรง ให้เลือกใช้ config ที่
    ถูกส่งเข้ามาในพาธการเรียกที่ใช้งานอยู่แล้ว ตัวจัดการที่มีอายุยาวและต้องใช้
    snapshot ของ process ปัจจุบันสามารถใช้ `api.runtime.config.current()` ได้ เครื่องมือเอเจนต์
    ที่มีอายุยาวควรใช้ `ctx.getRuntimeConfig()` ของ context เครื่องมือภายใน
    `execute` เพื่อให้เครื่องมือที่ถูกสร้างก่อนการเขียน config ยังคงเห็น
    runtime config ที่ refresh แล้ว

    การเขียน config ต้องผ่าน helper แบบ transactional และเลือก
    นโยบายหลังการเขียน:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    ใช้ `afterWrite: { mode: "restart", reason: "..." }` เมื่อ caller รู้ว่า
    การเปลี่ยนแปลงต้องการการ restart gateway แบบสะอาด และ
    `afterWrite: { mode: "none", reason: "..." }` เฉพาะเมื่อ caller เป็นเจ้าของ
    การติดตามผลและตั้งใจต้องการระงับ reload planner
    ผลลัพธ์ mutation มีสรุป `followUp` แบบมี type สำหรับเทสต์และการ logging;
    gateway ยังคงรับผิดชอบการนำ restart ไปใช้หรือจัดตาราง
    `loadConfig` และ `writeConfigFile` ยังคงอยู่ในฐานะ helper ความเข้ากันได้
    ที่เลิกใช้แล้วสำหรับ Plugin ภายนอกระหว่างช่วงเวลาการย้าย และเตือนหนึ่งครั้งด้วย
    รหัสความเข้ากันได้ `runtime-config-load-write` Plugin ที่ bundle มาด้วยและโค้ด runtime
    ของ repo ได้รับการปกป้องด้วย guardrail ของ scanner ใน
    `pnpm check:deprecated-api-usage` และ
    `pnpm check:no-runtime-action-load-config`: การใช้งาน Plugin ฝั่ง production ใหม่
    จะล้มเหลวทันที, การเขียน config โดยตรงจะล้มเหลว, เมธอดของ gateway server ต้องใช้
    runtime snapshot ของคำขอ, helper ส่ง/action/client ของ runtime channel
    ต้องรับ config จาก boundary ของตัวเอง และโมดูล runtime ที่มีอายุยาวมี
    จำนวนการเรียก `loadConfig()` แบบ ambient ที่อนุญาตเป็นศูนย์

    โค้ด Plugin ใหม่ควรหลีกเลี่ยงการนำเข้า barrel ความเข้ากันได้แบบกว้าง
    `openclaw/plugin-sdk/config-runtime` ด้วย ใช้ subpath ของ SDK แบบแคบ
    ที่ตรงกับงาน:

    | ความต้องการ | การนำเข้า |
    | --- | --- |
    | type ของ config เช่น `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertion ของ config ที่โหลดแล้วและการ lookup config ของ plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | การอ่าน snapshot ของ runtime ปัจจุบัน | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | การเขียน config | `openclaw/plugin-sdk/config-mutation` |
    | helper ของ session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config ตาราง Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helper runtime ของนโยบายกลุ่ม | `openclaw/plugin-sdk/runtime-group-policy` |
    | การ resolve input ลับ | `openclaw/plugin-sdk/secret-input-runtime` |
    | การ override model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin ที่ bundle มาด้วยและเทสต์ของ Plugin เหล่านั้นมี scanner คอยป้องกัน barrel แบบกว้าง
    เพื่อให้การนำเข้าและ mock อยู่เฉพาะในพฤติกรรมที่ต้องใช้ barrel แบบกว้าง
    ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก แต่โค้ดใหม่ไม่ควร
    พึ่งพามัน

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Plugin ที่ bundle มาด้วยต้องแทนที่ตัวจัดการผลลัพธ์เครื่องมือ
    `api.registerEmbeddedExtensionFactory(...)` ที่ใช้ได้เฉพาะ embedded-runner ด้วย
    middleware ที่เป็นกลางต่อ runtime

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

    Plugin ที่ติดตั้งแล้วสามารถ register middleware สำหรับผลลัพธ์เครื่องมือได้เช่นกันเมื่อ Plugin เหล่านั้น
    เปิดใช้งานอย่างชัดเจนและประกาศ runtime ที่เป็นเป้าหมายทุกตัวใน
    `contracts.agentToolResultMiddleware` การ register middleware ที่ติดตั้งแล้วแต่ไม่ได้ประกาศ
    จะถูกปฏิเสธ

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugin channel ที่รองรับ approval ตอนนี้เปิดเผยพฤติกรรม approval แบบ native ผ่าน
    `approvalCapability.nativeRuntime` พร้อม registry runtime-context ที่ใช้ร่วมกัน

    การเปลี่ยนแปลงหลัก:

    - แทนที่ `approvalCapability.handler.loadRuntime(...)` ด้วย
      `approvalCapability.nativeRuntime`
    - ย้าย auth/delivery ที่เฉพาะกับ approval ออกจาก wiring แบบ legacy ของ `plugin.auth` /
      `plugin.approvals` และไปไว้บน `approvalCapability`
    - `ChannelPlugin.approvals` ถูกลบออกจากสัญญา channel-plugin
      สาธารณะแล้ว; ย้ายฟิลด์ delivery/native/render ไปไว้บน `approvalCapability`
    - `plugin.auth` ยังคงมีไว้สำหรับ flow login/logout ของ channel เท่านั้น; hook auth ของ approval
      ที่นั่นจะไม่ถูก core อ่านอีกต่อไป
    - Register object runtime ที่ channel เป็นเจ้าของ เช่น client, token หรือแอป Bolt
      ผ่าน `openclaw/plugin-sdk/channel-runtime-context`
    - อย่าส่งประกาศ reroute ที่ Plugin เป็นเจ้าของจากตัวจัดการ approval แบบ native;
      ตอนนี้ core เป็นเจ้าของประกาศ routed-elsewhere จากผลลัพธ์ delivery จริง
    - เมื่อส่ง `channelRuntime` เข้าไปใน `createChannelManager(...)` ให้ระบุ
      surface `createPluginRuntime().channel` จริง stub แบบ partial จะถูกปฏิเสธ

    ดู `/plugins/sdk-channel-plugins` สำหรับ layout approval capability
    ปัจจุบัน

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
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

    หาก caller ของคุณไม่ได้ตั้งใจพึ่งพา shell fallback อย่าตั้งค่า
    `allowShellFallback` และจัดการ error ที่ throw แทน

  </Step>

  <Step title="Find deprecated imports">
    ค้นหา Plugin ของคุณสำหรับการนำเข้าจาก surface ที่เลิกใช้แล้วตัวใดตัวหนึ่ง:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    แต่ละ export จาก surface เก่าจะ map ไปยังพาธ import สมัยใหม่ที่เฉพาะเจาะจง:

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

    สำหรับ helper ฝั่ง host ให้ใช้ runtime ของ Plugin ที่ inject เข้ามาแทนการนำเข้า
    โดยตรง:

    ```typescript
    // ก่อนหน้า (สะพาน extension-api ที่เลิกใช้แล้ว)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // หลังจากนั้น (runtime ที่ถูกฉีดเข้ามา)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    รูปแบบเดียวกันนี้ใช้กับตัวช่วยสะพานแบบเดิมอื่น ๆ ด้วย:

    | import เดิม | สิ่งทดแทนสมัยใหม่ |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | ตัวช่วย session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="แทนที่การ import infra-runtime แบบกว้าง">
    `openclaw/plugin-sdk/infra-runtime` ยังคงมีอยู่เพื่อความเข้ากันได้กับภายนอก
    แต่โค้ดใหม่ควร import พื้นผิวตัวช่วยเฉพาะที่จำเป็นต้องใช้จริง:

    | ความต้องการ | Import |
    | --- | --- |
    | ตัวช่วยคิวเหตุการณ์ระบบ | `openclaw/plugin-sdk/system-event-runtime` |
    | ตัวช่วยการปลุก Heartbeat เหตุการณ์ และการมองเห็น | `openclaw/plugin-sdk/heartbeat-runtime` |
    | การระบายคิวการส่งที่ค้างอยู่ | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | เทเลเมทรีกิจกรรมช่องทาง | `openclaw/plugin-sdk/channel-activity-runtime` |
    | แคชขจัดรายการซ้ำในหน่วยความจำ | `openclaw/plugin-sdk/dedupe-runtime` |
    | ตัวช่วยพาธไฟล์/สื่อในเครื่องที่ปลอดภัย | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch ที่รับรู้ dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | ตัวช่วย proxy และ fetch ที่มีการป้องกัน | `openclaw/plugin-sdk/fetch-runtime` |
    | ชนิดนโยบาย dispatcher สำหรับ SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | ชนิดคำขอ/การแก้ไขการอนุมัติ | `openclaw/plugin-sdk/approval-runtime` |
    | ตัวช่วย payload การตอบกลับการอนุมัติและคำสั่ง | `openclaw/plugin-sdk/approval-reply-runtime` |
    | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `openclaw/plugin-sdk/error-runtime` |
    | การรอความพร้อมของทรานสปอร์ต | `openclaw/plugin-sdk/transport-ready-runtime` |
    | ตัวช่วยโทเค็นที่ปลอดภัย | `openclaw/plugin-sdk/secure-random-runtime` |
    | ภาวะพร้อมกันของงาน async แบบมีขอบเขต | `openclaw/plugin-sdk/concurrency-runtime` |
    | การบังคับแปลงเป็นตัวเลข | `openclaw/plugin-sdk/number-runtime` |
    | ล็อก async ภายใน process | `openclaw/plugin-sdk/async-lock-runtime` |
    | ล็อกไฟล์ | `openclaw/plugin-sdk/file-lock` |

    Plugin ที่รวมมาในชุดจะถูกตัวสแกนป้องกันไม่ให้ใช้ `infra-runtime` ดังนั้นโค้ดใน repo
    จึงไม่สามารถถอยกลับไปใช้ barrel แบบกว้างได้

  </Step>

  <Step title="ย้ายตัวช่วยเส้นทางช่องทาง">
    โค้ดเส้นทางช่องทางใหม่ควรใช้ `openclaw/plugin-sdk/channel-route`
    ชื่อ route-key และ comparable-target แบบเก่ายังคงอยู่ในฐานะ alias เพื่อความเข้ากันได้
    ระหว่างช่วงการย้าย แต่ Plugin ใหม่ควรใช้ชื่อเส้นทางที่อธิบายพฤติกรรมโดยตรง:

    | ตัวช่วยเดิม | ตัวช่วยสมัยใหม่ |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    ตัวช่วยเส้นทางสมัยใหม่จะทำให้ `{ channel, to, accountId, threadId }`
    เป็นมาตรฐานอย่างสม่ำเสมอทั้งในการอนุมัติแบบเนทีฟ การระงับการตอบกลับ การขจัดรายการซ้ำขาเข้า
    การส่ง Cron และการกำหนดเส้นทาง session

    อย่าเพิ่มการใช้ `ChannelMessagingAdapter.parseExplicitTarget` ใหม่ หรือ
    ตัวช่วย loaded-route ที่มี parser หนุนหลัง (`parseExplicitTargetForLoadedChannel`
    หรือ `resolveRouteTargetForLoadedChannel`) หรือ
    `resolveChannelRouteTargetWithParser(...)` จาก `plugin-sdk/channel-route`
    hook เหล่านี้เลิกใช้แล้วและคงไว้เฉพาะสำหรับ Plugin รุ่นเก่าในช่วงการย้ายเท่านั้น
    Plugin ช่องทางใหม่ควรใช้
    `messaging.targetResolver.resolveTarget(...)` สำหรับการทำให้ target id เป็นมาตรฐาน
    และ fallback เมื่อไม่พบไดเรกทอรี, `messaging.inferTargetChatType(...)` เมื่อ core
    ต้องการชนิด peer ตั้งแต่ต้น และ `messaging.resolveOutboundSessionRoute(...)`
    สำหรับ session แบบเนทีฟของผู้ให้บริการและข้อมูลระบุตัวตนของ thread

  </Step>

  <Step title="บิลด์และทดสอบ">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## ข้อมูลอ้างอิงพาธ import

  <Accordion title="ตารางเส้นทางนำเข้าที่ใช้บ่อย">
  | เส้นทางนำเข้า | วัตถุประสงค์ | รายการส่งออกหลัก |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | ตัวช่วยจุดเข้า Plugin หลักมาตรฐาน | `definePluginEntry` |
  | `plugin-sdk/core` | การส่งออกซ้ำแบบครอบคลุมรุ่นเก่าสำหรับนิยาม/ตัวสร้างจุดเข้าของช่องทาง | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | การส่งออกสคีมาการกำหนดค่าราก | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | ตัวช่วยจุดเข้าสำหรับผู้ให้บริการรายเดียว | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | นิยามและตัวสร้างจุดเข้าของช่องทางแบบเจาะจง | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดตั้งค่าที่ใช้ร่วมกัน | ตัวแปลการตั้งค่า, พรอมป์รายการที่อนุญาต, ตัวสร้างสถานะการตั้งค่า |
  | `plugin-sdk/setup-runtime` | ตัวช่วยรันไทม์ขณะตั้งค่า | `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่ปลอดภัยต่อการนำเข้า, ตัวช่วยบันทึกการค้นหา, `promptResolvedAllowFrom`, `splitSetupEntries`, พร็อกซีการตั้งค่าที่มอบหมาย |
  | `plugin-sdk/setup-adapter-runtime` | นามแฝงอะแดปเตอร์การตั้งค่าที่เลิกใช้แล้ว | ใช้ `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | ตัวช่วยเครื่องมือการตั้งค่า | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | ตัวช่วยหลายบัญชี | ตัวช่วยรายการบัญชี/การกำหนดค่า/ประตูการกระทำ |
  | `plugin-sdk/account-id` | ตัวช่วยรหัสบัญชี | `DEFAULT_ACCOUNT_ID`, การปรับรหัสบัญชีให้เป็นรูปแบบมาตรฐาน |
  | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี | ตัวช่วยค้นหาบัญชี + ทางเลือกสำรองเริ่มต้น |
  | `plugin-sdk/account-helpers` | ตัวช่วยบัญชีแบบแคบ | ตัวช่วยรายการบัญชี/การกระทำของบัญชี |
  | `plugin-sdk/channel-setup` | อะแดปเตอร์วิซาร์ดตั้งค่า | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | พื้นฐานการจับคู่ DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | การเดินสายคำนำหน้าการตอบกลับ, สถานะกำลังพิมพ์, และการส่งมอบแหล่งที่มา | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | โรงงานอะแดปเตอร์การกำหนดค่าและตัวช่วยเข้าถึง DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | ตัวสร้างสคีมาการกำหนดค่า | พื้นฐานสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกันและตัวสร้างทั่วไปเท่านั้น |
  | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าที่รวมมาให้ | เฉพาะ Plugin ที่รวมมาและดูแลโดย OpenClaw เท่านั้น; Plugin ใหม่ต้องกำหนดสคีมาเฉพาะ Plugin เอง |
  | `plugin-sdk/channel-config-schema-legacy` | สคีมาการกำหนดค่าที่รวมมาให้ซึ่งเลิกใช้แล้ว | นามแฝงเพื่อความเข้ากันได้เท่านั้น; ใช้ `plugin-sdk/bundled-channel-config-schema` สำหรับ Plugin ที่รวมมาและยังดูแลอยู่ |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยการกำหนดค่าคำสั่ง Telegram | การปรับชื่อคำสั่งให้เป็นรูปแบบมาตรฐาน, การตัดคำอธิบาย, การตรวจสอบค่าซ้ำ/ข้อขัดแย้ง |
  | `plugin-sdk/channel-policy` | การแก้ไขนโยบายกลุ่ม/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | ตัวช่วยซองข้อความขาเข้า | ตัวช่วยเส้นทางที่ใช้ร่วมกัน + ตัวสร้างซองข้อความ |
  | `plugin-sdk/channel-inbound` | ตัวช่วยรับขาเข้า | การสร้างบริบท, การจัดรูปแบบ, ราก, ตัวรัน, การส่งการตอบกลับที่เตรียมไว้, และเพรดิเคตการส่ง |
  | `plugin-sdk/messaging-targets` | เส้นทางนำเข้าการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมายทั่วไป, `plugin-sdk/channel-route` สำหรับการเปรียบเทียบเส้นทาง, และ `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` ที่ Plugin เป็นเจ้าของสำหรับการแก้ไขเป้าหมายเฉพาะผู้ให้บริการ |
  | `plugin-sdk/outbound-media` | ตัวช่วยสื่อขาออก | การโหลดสื่อขาออกที่ใช้ร่วมกัน |
  | `plugin-sdk/outbound-send-deps` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | ตัวช่วยวงจรชีวิตข้อความขาออก | อะแดปเตอร์ข้อความ, ใบรับ, ตัวช่วยส่งแบบคงทน, ตัวช่วยแสดงตัวอย่างสด/สตรีมมิง, ตัวเลือกการตอบกลับ, ตัวช่วยวงจรชีวิต, อัตลักษณ์ขาออก, และการวางแผนเพย์โหลด |
  | `plugin-sdk/channel-streaming` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยการผูกเธรด | วงจรชีวิตการผูกเธรดและตัวช่วยอะแดปเตอร์ |
  | `plugin-sdk/agent-media-payload` | ตัวช่วยเพย์โหลดสื่อรุ่นเก่า | ตัวสร้างเพย์โหลดสื่อเอเจนต์สำหรับเค้าโครงฟิลด์รุ่นเก่า |
  | `plugin-sdk/channel-runtime` | ชิมความเข้ากันได้ที่เลิกใช้แล้ว | ยูทิลิตีรันไทม์ช่องทางรุ่นเก่าเท่านั้น |
  | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การส่ง | ประเภทผลลัพธ์การตอบกลับ |
  | `plugin-sdk/runtime-store` | พื้นที่จัดเก็บ Plugin แบบคงอยู่ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | ตัวช่วยรันไทม์แบบกว้าง | ตัวช่วยรันไทม์/การบันทึก/การสำรองข้อมูล/การติดตั้ง Plugin |
  | `plugin-sdk/runtime-env` | ตัวช่วยสภาพแวดล้อมรันไทม์แบบแคบ | ตัวช่วยตัวบันทึก/สภาพแวดล้อมรันไทม์, หมดเวลา, ลองซ้ำ, และ backoff |
  | `plugin-sdk/plugin-runtime` | ตัวช่วยรันไทม์ Plugin ที่ใช้ร่วมกัน | ตัวช่วยคำสั่ง/ฮุก/http/อินเทอร์แอกทีฟของ Plugin |
  | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ฮุก | ตัวช่วยไปป์ไลน์ Webhook/ฮุกภายในที่ใช้ร่วมกัน |
  | `plugin-sdk/lazy-runtime` | ตัวช่วยรันไทม์แบบเลซี่ | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | ตัวช่วยกระบวนการ | ตัวช่วย exec ที่ใช้ร่วมกัน |
  | `plugin-sdk/cli-runtime` | ตัวช่วยรันไทม์ CLI | การจัดรูปแบบคำสั่ง, การรอ, ตัวช่วยเวอร์ชัน |
  | `plugin-sdk/gateway-runtime` | ตัวช่วย Gateway | ไคลเอนต์ Gateway, ตัวช่วยเริ่มเมื่อ event loop พร้อม, และตัวช่วยแพตช์สถานะช่องทาง |
  | `plugin-sdk/config-runtime` | ชิมความเข้ากันได้ของการกำหนดค่าที่เลิกใช้แล้ว | ควรใช้ `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, และ `config-mutation` |
  | `plugin-sdk/telegram-command-config` | ตัวช่วยคำสั่ง Telegram | ตัวช่วยตรวจสอบคำสั่ง Telegram ที่เสถียรต่อทางเลือกสำรองเมื่อพื้นผิวสัญญา Telegram ที่รวมมาให้ใช้งานไม่ได้ |
  | `plugin-sdk/approval-runtime` | ตัวช่วยพรอมป์การอนุมัติ | เพย์โหลดการอนุมัติ exec/Plugin, ตัวช่วยความสามารถ/โปรไฟล์การอนุมัติ, การกำหนดเส้นทาง/รันไทม์การอนุมัติเนทีฟ, และการจัดรูปแบบเส้นทางแสดงผลการอนุมัติแบบมีโครงสร้าง |
  | `plugin-sdk/approval-auth-runtime` | ตัวช่วย auth การอนุมัติ | การแก้ไขผู้อนุมัติ, auth การกระทำในแชทเดียวกัน |
  | `plugin-sdk/approval-client-runtime` | ตัวช่วยไคลเอนต์การอนุมัติ | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec เนทีฟ |
  | `plugin-sdk/approval-delivery-runtime` | ตัวช่วยการส่งมอบการอนุมัติ | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติเนทีฟ |
  | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย Gateway การอนุมัติ | ตัวช่วยแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
  | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยอะแดปเตอร์การอนุมัติ | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติเนทีฟขนาดเบาสำหรับจุดเข้าช่องทางที่ร้อน |
  | `plugin-sdk/approval-handler-runtime` | ตัวช่วยตัวจัดการการอนุมัติ | ตัวช่วยรันไทม์ตัวจัดการการอนุมัติที่กว้างกว่า; ควรใช้ขอบอะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
  | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติ | ตัวช่วยผูกเป้าหมาย/บัญชีการอนุมัติเนทีฟ |
  | `plugin-sdk/approval-reply-runtime` | ตัวช่วยการตอบกลับการอนุมัติ | ตัวช่วยเพย์โหลดการตอบกลับการอนุมัติ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | ตัวช่วยบริบทรันไทม์ช่องทาง | ตัวช่วยลงทะเบียน/รับ/เฝ้าดูบริบทรันไทม์ช่องทางทั่วไป |
  | `plugin-sdk/security-runtime` | ตัวช่วยความปลอดภัย | ตัวช่วยความเชื่อถือ, การกั้น DM, ไฟล์/เส้นทางที่จำกัดอยู่ในราก, เนื้อหาภายนอก, และการรวบรวมความลับที่ใช้ร่วมกัน |
  | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF | ตัวช่วยนโยบายรายการโฮสต์ที่อนุญาตและเครือข่ายส่วนตัว |
  | `plugin-sdk/ssrf-runtime` | ตัวช่วยรันไทม์ SSRF | ตัวส่งที่ปักหมุดไว้, fetch ที่มีการป้องกัน, ตัวช่วยนโยบาย SSRF |
  | `plugin-sdk/system-event-runtime` | ตัวช่วยเหตุการณ์ระบบ | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | ตัวช่วย Heartbeat | การปลุก Heartbeat, เหตุการณ์, และตัวช่วยการมองเห็น |
  | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยคิวการส่งมอบ | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | ตัวช่วยกิจกรรมช่องทาง | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | ตัวช่วยขจัดรายการซ้ำ | แคชขจัดรายการซ้ำในหน่วยความจำ |
  | `plugin-sdk/file-access-runtime` | ตัวช่วยเข้าถึงไฟล์ | ตัวช่วยเส้นทางไฟล์/สื่อภายในเครื่องที่ปลอดภัย |
  | `plugin-sdk/transport-ready-runtime` | ตัวช่วยความพร้อมของทรานสปอร์ต | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยนโยบายการอนุมัติ exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | ตัวช่วยแคชที่มีขอบเขต | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | ตัวช่วยกั้นการวินิจฉัย | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | ตัวช่วยจัดรูปแบบข้อผิดพลาด | `formatUncaughtError`, `isApprovalNotFoundError`, ตัวช่วยกราฟข้อผิดพลาด |
  | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch/proxy แบบครอบไว้ | `resolveFetch`, ตัวช่วย proxy, ตัวช่วยตัวเลือก EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | ตัวช่วยปรับโฮสต์ให้เป็นรูปแบบมาตรฐาน | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | ตัวช่วยลองซ้ำ | `RetryConfig`, `retryAsync`, ตัวรันนโยบาย |
  | `plugin-sdk/allow-from` | การจัดรูปแบบรายการที่อนุญาตและการแมปอินพุต | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | การกั้นคำสั่งและตัวช่วยพื้นผิวคำสั่ง | `resolveControlCommandGate`, ตัวช่วยการอนุญาตผู้ส่ง, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก |
  | `plugin-sdk/command-status` | ตัวเรนเดอร์สถานะ/ความช่วยเหลือของคำสั่ง | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | การแยกวิเคราะห์อินพุตความลับ | ตัวช่วยอินพุตความลับ |
  | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ Webhook | ยูทิลิตีเป้าหมาย Webhook |
  | `plugin-sdk/webhook-request-guards` | ตัวช่วยการ์ดเนื้อหาคำขอ Webhook | ตัวช่วยอ่าน/จำกัดเนื้อหาคำขอ |
  | `plugin-sdk/reply-runtime` | รันไทม์การตอบกลับที่ใช้ร่วมกัน | การส่งขาเข้า, Heartbeat, ตัววางแผนการตอบกลับ, การแบ่งเป็นชิ้น |
  | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยส่งการตอบกลับแบบแคบ | การทำให้เสร็จสิ้น, การส่งผ่านผู้ให้บริการ, และตัวช่วยป้ายกำกับการสนทนา |
  | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับ | `createChannelHistoryWindow`; การส่งออกความเข้ากันได้ของตัวช่วยแมปที่เลิกใช้แล้ว เช่น `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, และ `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | การวางแผนการอ้างอิงการตอบกลับ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งการตอบกลับเป็นชิ้น | ตัวช่วยแบ่งข้อความ/markdown เป็นชิ้น |
  | `plugin-sdk/session-store-runtime` | ตัวช่วยพื้นที่จัดเก็บเซสชัน | ตัวช่วยเส้นทางพื้นที่จัดเก็บ + updated-at |
  | `plugin-sdk/state-paths` | ตัวช่วยเส้นทางสถานะ | ตัวช่วยไดเรกทอรีสถานะและ OAuth |
  | `plugin-sdk/routing` | ตัวช่วยการกำหนดเส้นทาง/คีย์เซสชัน | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, ตัวช่วยปรับคีย์เซสชันให้เป็นมาตรฐาน |
  | `plugin-sdk/status-helpers` | ตัวช่วยสถานะช่องทาง | ตัวสร้างสรุปสถานะช่องทาง/บัญชี, ค่าเริ่มต้นของสถานะรันไทม์, ตัวช่วยเมตาดาต้าของปัญหา |
  | `plugin-sdk/target-resolver-runtime` | ตัวช่วยตัวแก้เป้าหมาย | ตัวช่วยตัวแก้เป้าหมายที่ใช้ร่วมกัน |
  | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับสตริงให้เป็นมาตรฐาน | ตัวช่วยปรับ slug/สตริงให้เป็นมาตรฐาน |
  | `plugin-sdk/request-url` | ตัวช่วย URL ของคำขอ | ดึง URL แบบสตริงจากอินพุตที่มีลักษณะเหมือนคำขอ |
  | `plugin-sdk/run-command` | ตัวช่วยคำสั่งแบบจับเวลา | ตัวรันคำสั่งแบบจับเวลาพร้อม stdout/stderr ที่ปรับให้เป็นมาตรฐาน |
  | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
  | `plugin-sdk/tool-payload` | การดึงเพย์โหลดเครื่องมือ | ดึงเพย์โหลดที่ปรับให้เป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์ของเครื่องมือ |
  | `plugin-sdk/tool-send` | การดึงข้อมูลการส่งของเครื่องมือ | ดึงฟิลด์เป้าหมายการส่งมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
  | `plugin-sdk/temp-path` | ตัวช่วยพาธชั่วคราว | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน |
  | `plugin-sdk/logging-core` | ตัวช่วยการบันทึกล็อก | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยปิดทับข้อมูล |
  | `plugin-sdk/markdown-table-runtime` | ตัวช่วยตาราง Markdown | ตัวช่วยโหมดตาราง Markdown |
  | `plugin-sdk/reply-payload` | ชนิดการตอบกลับข้อความ | ชนิดเพย์โหลดการตอบกลับ |
  | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการภายในเครื่อง/โฮสต์เองที่คัดสรรแล้ว | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการแบบโฮสต์เอง |
  | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะเจาะจง | ตัวช่วยค้นหา/กำหนดค่าผู้ให้บริการแบบโฮสต์เองเดียวกัน |
  | `plugin-sdk/provider-auth-runtime` | ตัวช่วยยืนยันตัวตนรันไทม์ของผู้ให้บริการ | ตัวช่วยแก้ API-key ในรันไทม์ |
  | `plugin-sdk/provider-auth-api-key` | ตัวช่วยตั้งค่า API-key ของผู้ให้บริการ | ตัวช่วยเริ่มใช้งาน/เขียนโปรไฟล์สำหรับ API-key |
  | `plugin-sdk/provider-auth-result` | ตัวช่วยผลลัพธ์การยืนยันตัวตนของผู้ให้บริการ | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
  | `plugin-sdk/provider-selection-runtime` | ตัวช่วยเลือกผู้ให้บริการ | การเลือกผู้ให้บริการแบบกำหนดค่าไว้หรืออัตโนมัติ และการผสานการกำหนดค่าผู้ให้บริการดิบ |
  | `plugin-sdk/provider-env-vars` | ตัวช่วย env-var ของผู้ให้บริการ | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
  | `plugin-sdk/provider-model-shared` | ตัวช่วยโมเดล/รีเพลย์ของผู้ให้บริการที่ใช้ร่วมกัน | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายรีเพลย์ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ, และตัวช่วยปรับ model-id ให้เป็นมาตรฐาน |
  | `plugin-sdk/provider-catalog-shared` | ตัวช่วยแค็ตตาล็อกผู้ให้บริการที่ใช้ร่วมกัน | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | แพตช์การเริ่มใช้งานผู้ให้บริการ | ตัวช่วยกำหนดค่าการเริ่มใช้งาน |
  | `plugin-sdk/provider-http` | ตัวช่วย HTTP ของผู้ให้บริการ | ตัวช่วยความสามารถ HTTP/endpoint ทั่วไปของผู้ให้บริการ รวมถึงตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงจากเสียง |
  | `plugin-sdk/provider-web-fetch` | ตัวช่วย web-fetch ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยกำหนดค่า web-search ของผู้ให้บริการ | ตัวช่วยกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องใช้การเชื่อม enable ของ plugin |
  | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา web-search ของผู้ให้บริการ | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, และตัวตั้งค่า/ตัวอ่านข้อมูลรับรองตามขอบเขต |
  | `plugin-sdk/provider-web-search` | ตัวช่วย web-search ของผู้ให้บริการ | ตัวช่วยลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
  | `plugin-sdk/provider-tools` | ตัวช่วยความเข้ากันได้ของเครื่องมือ/สคีมาผู้ให้บริการ | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, และการล้างสคีมา + การวินิจฉัยสำหรับ DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | ตัวช่วยการใช้งานผู้ให้บริการ | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, และตัวช่วยการใช้งานผู้ให้บริการอื่น ๆ |
  | `plugin-sdk/provider-stream` | ตัวช่วยตัวครอบสตรีมของผู้ให้บริการ | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดตัวครอบสตรีม, และตัวช่วยตัวครอบที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | ตัวช่วยทรานสปอร์ตของผู้ให้บริการ | ตัวช่วยทรานสปอร์ตเนทีฟของผู้ให้บริการ เช่น fetch แบบมีการป้องกัน, การแปลงข้อความทรานสปอร์ต, และสตรีมเหตุการณ์ทรานสปอร์ตแบบเขียนได้ |
  | `plugin-sdk/keyed-async-queue` | คิว async แบบมีลำดับ | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกัน | ตัวช่วยดึง/แปลง/จัดเก็บสื่อ, การตรวจขนาดวิดีโอที่อิงกับ ffprobe, และตัวสร้างเพย์โหลดสื่อ |
  | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกัน | ตัวช่วย failover ที่ใช้ร่วมกัน, การเลือกตัวเลือก, และข้อความเมื่อขาดโมเดลสำหรับการสร้างรูปภาพ/วิดีโอ/เพลง |
  | `plugin-sdk/media-understanding` | ตัวช่วยความเข้าใจสื่อ | ชนิดผู้ให้บริการความเข้าใจสื่อพร้อมเอ็กซ์พอร์ตตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
  | `plugin-sdk/text-runtime` | เอ็กซ์พอร์ตความเข้ากันได้ด้านข้อความแบบกว้างที่เลิกใช้แล้ว | ใช้ `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, และ `logging-core` |
  | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งข้อความเป็นชิ้น | ตัวช่วยแบ่งข้อความขาออกเป็นชิ้น |
  | `plugin-sdk/speech` | ตัวช่วยเสียงพูด | ชนิดผู้ให้บริการเสียงพูดพร้อมตัวช่วย directive, registry, validation สำหรับผู้ให้บริการ และตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/speech-core` | แกนเสียงพูดที่ใช้ร่วมกัน | ชนิดผู้ให้บริการเสียงพูด, registry, directives, การปรับให้เป็นมาตรฐาน |
  | `plugin-sdk/realtime-transcription` | ตัวช่วยถอดเสียงแบบเรียลไทม์ | ชนิดผู้ให้บริการ, ตัวช่วย registry, และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
  | `plugin-sdk/realtime-voice` | ตัวช่วยเสียงแบบเรียลไทม์ | ชนิดผู้ให้บริการ, ตัวช่วย registry/การแก้ค่า, ตัวช่วยเซสชัน bridge, คิว talk-back ของเอเจนต์ที่ใช้ร่วมกัน, การควบคุมเสียงของรันที่กำลังทำงาน, สุขภาพทรานสคริปต์/เหตุการณ์, การลดเสียงสะท้อน, การจับคู่คำถาม consult, การประสาน forced-consult, การติดตามบริบทเทิร์น, การติดตามกิจกรรมเอาต์พุต, และตัวช่วย consult บริบทแบบรวดเร็ว |
  | `plugin-sdk/image-generation` | ตัวช่วยสร้างรูปภาพ | ชนิดผู้ให้บริการสร้างรูปภาพ พร้อมตัวช่วย URL ของแอสเซ็ตรูปภาพ/ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
  | `plugin-sdk/image-generation-core` | แกนการสร้างรูปภาพที่ใช้ร่วมกัน | ชนิดการสร้างรูปภาพ, failover, การยืนยันตัวตน, และตัวช่วย registry |
  | `plugin-sdk/music-generation` | ตัวช่วยสร้างเพลง | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
  | `plugin-sdk/music-generation-core` | แกนการสร้างเพลงที่ใช้ร่วมกัน | ชนิดการสร้างเพลง, ตัวช่วย failover, การค้นหาผู้ให้บริการ, และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/video-generation` | ตัวช่วยสร้างวิดีโอ | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
  | `plugin-sdk/video-generation-core` | แกนการสร้างวิดีโอที่ใช้ร่วมกัน | ชนิดการสร้างวิดีโอ, ตัวช่วย failover, การค้นหาผู้ให้บริการ, และการแยกวิเคราะห์ model-ref |
  | `plugin-sdk/interactive-runtime` | ตัวช่วยการตอบกลับแบบโต้ตอบ | การปรับ/ลดรูปเพย์โหลดการตอบกลับแบบโต้ตอบให้เป็นมาตรฐาน |
  | `plugin-sdk/channel-config-primitives` | primitive การกำหนดค่าช่องทาง | primitive ของสคีมาการกำหนดค่าช่องทางแบบแคบ |
  | `plugin-sdk/channel-config-writes` | ตัวช่วยเขียนการกำหนดค่าช่องทาง | ตัวช่วยการอนุญาตเขียนการกำหนดค่าช่องทาง |
  | `plugin-sdk/channel-plugin-common` | prelude ช่องทางที่ใช้ร่วมกัน | เอ็กซ์พอร์ต prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/channel-status` | ตัวช่วยสถานะช่องทาง | ตัวช่วย snapshot/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
  | `plugin-sdk/allowlist-config-edit` | ตัวช่วยกำหนดค่า allowlist | ตัวช่วยแก้ไข/อ่านการกำหนดค่า allowlist |
  | `plugin-sdk/group-access` | ตัวช่วยการเข้าถึงกลุ่ม | ตัวช่วยการตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | facade ความเข้ากันได้ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วย guard สำหรับ Direct-DM | ตัวช่วยนโยบาย guard ก่อนเข้ารหัสแบบแคบ |
  | `plugin-sdk/extension-shared` | ตัวช่วยส่วนขยายที่ใช้ร่วมกัน | primitive ตัวช่วยสำหรับช่องทางแบบ passive/สถานะ และพร็อกซี ambient |
  | `plugin-sdk/webhook-targets` | ตัวช่วยเป้าหมาย Webhook | registry เป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
  | `plugin-sdk/webhook-path` | alias พาธ webhook ที่เลิกใช้แล้ว | ใช้ `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | ตัวช่วยสื่อเว็บที่ใช้ร่วมกัน | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่อง |
  | `plugin-sdk/zod` | re-export ความเข้ากันได้ของ Zod ที่เลิกใช้แล้ว | นำเข้า `zod` จาก `zod` โดยตรง |
  | `plugin-sdk/memory-core` | ตัวช่วย memory-core ที่ bundled | พื้นผิวตัวช่วยตัวจัดการหน่วยความจำ/การกำหนดค่า/ไฟล์/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์ของเอนจินหน่วยความจำ | facade รันไทม์ดัชนี/ค้นหาหน่วยความจำ |
  | `plugin-sdk/memory-core-host-embedding-registry` | registry embedding ของหน่วยความจำ | ตัวช่วย registry ผู้ให้บริการ embedding หน่วยความจำแบบเบา |
  | `plugin-sdk/memory-core-host-engine-foundation` | เอนจินรากฐานของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินรากฐานของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-embeddings` | เอนจิน embedding ของโฮสต์หน่วยความจำ | สัญญา embedding หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการภายในเครื่อง, และตัวช่วย batch/remote ทั่วไป; ผู้ให้บริการระยะไกลแบบเจาะจงอยู่ใน plugins ที่เป็นเจ้าของ |
  | `plugin-sdk/memory-core-host-engine-qmd` | เอนจิน QMD ของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจิน QMD ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-engine-storage` | เอนจินจัดเก็บข้อมูลของโฮสต์หน่วยความจำ | เอ็กซ์พอร์ตเอนจินจัดเก็บข้อมูลของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-events` | alias เหตุการณ์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-cli` | รันไทม์ CLI ของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-core` | รันไทม์แกนของโฮสต์หน่วยความจำ | ตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-core` | alias รันไทม์แกนของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยรันไทม์แกนของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-events` | alias journal เหตุการณ์ของโฮสต์หน่วยความจำ | alias ที่เป็นกลางต่อผู้ขายสำหรับตัวช่วย journal เหตุการณ์ของโฮสต์หน่วยความจำ |
  | `plugin-sdk/memory-host-files` | alias ไฟล์/รันไทม์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | ตัวช่วย markdown ที่จัดการแล้ว | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ plugins ใกล้เคียงกับหน่วยความจำ |
  | `plugin-sdk/memory-host-search` | facade การค้นหา Active Memory | facade รันไทม์ตัวจัดการการค้นหา active-memory แบบ lazy |
  | `plugin-sdk/memory-host-status` | alias สถานะโฮสต์หน่วยความจำที่เลิกใช้แล้ว | ใช้ `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | ยูทิลิตีทดสอบ | barrel ความเข้ากันได้ที่เลิกใช้แล้วภายใน repo; ใช้ subpath ทดสอบภายใน repo แบบเจาะจง เช่น `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, และ `plugin-sdk/test-fixtures` |
</Accordion>

ตารางนี้ตั้งใจให้เป็นชุดย่อยสำหรับการย้ายที่ใช้ร่วมกัน ไม่ใช่พื้นผิว SDK
ทั้งหมด รายการ entrypoint ของ compiler อยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports ถูกสร้างจาก
ชุดย่อยสาธารณะ

seams ตัวช่วยสำหรับ bundled-plugin ที่สงวนไว้ถูกปลดระวางจาก export map
ของ SDK สาธารณะแล้ว ยกเว้น facade ความเข้ากันได้ที่มีการบันทึกไว้อย่างชัดเจน เช่น
shim `plugin-sdk/discord` ที่เลิกใช้แล้วซึ่งยังคงไว้สำหรับแพ็กเกจ
`@openclaw/discord@2026.3.13` ที่เผยแพร่แล้ว ตัวช่วยเฉพาะ owner อยู่ภายใน
แพ็กเกจ Plugin ที่เป็นเจ้าของ; พฤติกรรม host ที่ใช้ร่วมกันควรย้ายผ่าน contract SDK
ทั่วไป เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
และ `plugin-sdk/plugin-config-runtime`

ใช้ import ที่แคบที่สุดซึ่งตรงกับงาน หากหา export ไม่พบ
ให้ตรวจสอบซอร์สที่ `src/plugin-sdk/` หรือถาม maintainers ว่า contract ทั่วไปใด
ควรเป็นเจ้าของสิ่งนั้น

## การเลิกใช้งานที่มีผลอยู่

การเลิกใช้งานที่แคบลงซึ่งมีผลทั่วทั้ง plugin SDK, provider contract,
runtime surface, และ manifest แต่ละรายการยังใช้งานได้ในวันนี้ แต่จะถูกลบออก
ใน major release ในอนาคต รายการใต้แต่ละข้อจะจับคู่ API เดิมกับสิ่งทดแทน
ที่เป็น canonical

<AccordionGroup>
  <Accordion title="ตัวสร้าง help ของ command-auth → command-status">
    **เดิม (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **ใหม่ (`openclaw/plugin-sdk/command-status`)**: signature เดิม, export เดิม
    เพียง import จาก subpath ที่แคบกว่า `command-auth`
    re-export สิ่งเหล่านี้เป็น compat stubs

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="ตัวช่วย Mention gating → resolveInboundMentionDecision">
    **เดิม**: `resolveInboundMentionRequirement({ facts, policy })` และ
    `shouldDropInboundForMention(...)` จาก
    `openclaw/plugin-sdk/channel-inbound` หรือ
    `openclaw/plugin-sdk/channel-mention-gating`.

    **ใหม่**: `resolveInboundMentionDecision({ facts, policy })` - คืนค่าเป็น
    decision object เดียว แทนการเรียกสองครั้งที่แยกกัน

    Plugin ช่องทางปลายน้ำ (Slack, Discord, Matrix, MS Teams) ได้เปลี่ยนไปใช้แล้ว

  </Accordion>

  <Accordion title="Channel runtime shim และตัวช่วย channel actions">
    `openclaw/plugin-sdk/channel-runtime` เป็น compatibility shim สำหรับ
    Plugin ช่องทางรุ่นเก่า อย่า import จากโค้ดใหม่; ใช้
    `openclaw/plugin-sdk/channel-runtime-context` สำหรับลงทะเบียน runtime
    objects

    ตัวช่วย `channelActions*` ใน `openclaw/plugin-sdk/channel-actions` ถูกเลิกใช้
    ควบคู่กับ export ช่องทาง "actions" แบบ raw ให้เปิดเผย capabilities
    ผ่านพื้นผิว `presentation` เชิงความหมายแทน - Plugin ช่องทาง
    ประกาศสิ่งที่ตน render (cards, buttons, selects) แทนที่จะประกาศชื่อ action แบบ raw
    ที่ยอมรับ

  </Accordion>

  <Accordion title="ตัวช่วย tool() ของ provider ค้นหาเว็บ → createTool() บน plugin">
    **เดิม**: factory `tool()` จาก `openclaw/plugin-sdk/provider-web-search`.

    **ใหม่**: implement `createTool(...)` โดยตรงบน provider plugin
    OpenClaw ไม่ต้องใช้ตัวช่วย SDK เพื่อลงทะเบียน tool wrapper อีกต่อไป

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **เดิม**: `formatInboundEnvelope(...)` (และ
    `ChannelMessageForAgent.channelEnvelope`) เพื่อสร้าง prompt envelope แบบ plaintext
    แบนจากข้อความช่องทางขาเข้า

    **ใหม่**: `BodyForAgent` พร้อมบล็อก user-context แบบมีโครงสร้าง Plugin ช่องทาง
    แนบ routing metadata (thread, topic, reply-to, reactions) เป็น
    ฟิลด์แบบ typed แทนการต่อรวมเข้าไปใน prompt string ตัวช่วย
    `formatAgentEnvelope(...)` ยังรองรับสำหรับ envelope ที่สังเคราะห์ขึ้น
    สำหรับฝั่ง assistant แต่ inbound plaintext envelopes กำลังจะถูกเลิกใช้

    พื้นที่ที่ได้รับผลกระทบ: `inbound_claim`, `message_received`, และ Plugin ช่องทาง custom ใดๆ
    ที่ post-process ข้อความ `channelEnvelope`

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **เดิม**: `api.on("deactivate", handler)`.

    **ใหม่**: `api.on("gateway_stop", handler)`. event และ context เป็น
    contract cleanup ตอน shutdown เดียวกัน; เปลี่ยนเฉพาะชื่อ hook

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

    `deactivate` ยังคงเชื่อมไว้เป็น compatibility alias ที่เลิกใช้แล้วจนถึงหลัง
    2026-08-16

  </Accordion>

  <Accordion title="hook subagent_spawning → การ bind thread ของ core">
    **เดิม**: `api.on("subagent_spawning", handler)` ที่คืนค่า
    `threadBindingReady` หรือ `deliveryOrigin`.

    **ใหม่**: ให้ core เตรียม subagent bindings แบบ `thread: true` ผ่าน
    channel session-binding adapter ใช้ `api.on("subagent_spawned", handler)`
    สำหรับการสังเกตหลัง launch เท่านั้น

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
    compatibility surfaces ที่เลิกใช้แล้วขณะที่ Plugin ภายนอกย้ายระบบ

  </Accordion>

  <Accordion title="ประเภท Provider discovery → ประเภท provider catalog">
    type aliases สำหรับ discovery สี่รายการตอนนี้เป็น wrapper บางๆ เหนือ
    ประเภทในยุค catalog:

    | alias เดิม                 | ประเภทใหม่                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    รวมถึง static bag `ProviderCapabilities` แบบ legacy - Plugin provider
    ควรใช้ provider hooks ที่ชัดเจน เช่น `buildReplayPolicy`,
    `normalizeToolSchemas`, และ `wrapStreamFn` แทน object แบบ static

  </Accordion>

  <Accordion title="hook นโยบาย Thinking → resolveThinkingProfile">
    **เดิม** (สาม hook แยกกันบน `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, และ
    `resolveDefaultThinkingLevel(ctx)`.

    **ใหม่**: `resolveThinkingProfile(ctx)` รายการเดียวที่คืนค่าเป็น
    `ProviderThinkingProfile` พร้อม `id` ที่เป็น canonical, `label` แบบ optional, และ
    รายการ level ที่จัดอันดับแล้ว OpenClaw downgrade ค่าที่จัดเก็บไว้ซึ่งล้าสมัยตาม rank
    ของ profile โดยอัตโนมัติ

    context รวม `provider`, `modelId`, `reasoning` ที่ merge แล้วแบบ optional,
    และ facts `compat` ของ model ที่ merge แล้วแบบ optional Plugin provider สามารถใช้
    facts จาก catalog เหล่านั้นเพื่อเปิดเผย profile เฉพาะ model เฉพาะเมื่อ
    request contract ที่ตั้งค่าไว้รองรับ

    implement hook เดียวแทนสาม hook hook legacy ยังทำงานได้ระหว่าง
    deprecation window แต่จะไม่ถูก compose กับผลลัพธ์ profile

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **เดิม**: implement external auth hooks โดยไม่ได้ประกาศ provider
    ใน plugin manifest

    **ใหม่**: ประกาศ `contracts.externalAuthProviders` ใน plugin manifest
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
    ฟิลด์ manifest **เดิม**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **ใหม่**: mirror การค้นหา env-var เดียวกันเข้าไปใน `setup.providers[].envVars`
    บน manifest สิ่งนี้รวม metadata env สำหรับ setup/status ไว้ในที่เดียว
    และหลีกเลี่ยงการ boot plugin runtime เพียงเพื่อตอบการค้นหา env-var

    `providerAuthEnvVars` ยังคงรองรับผ่าน compatibility adapter
    จนกว่า deprecation window จะปิด

  </Accordion>

  <Accordion title="การลงทะเบียน Memory plugin → registerMemoryCapability">
    **เดิม**: การเรียกสามรายการแยกกัน -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **ใหม่**: การเรียกเดียวบน memory-state API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    slots เดิม, การเรียกลงทะเบียนเดียว ตัวช่วย prompt และ corpus แบบ additive
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) ไม่ได้รับผลกระทบ

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **เดิม**: `api.registerMemoryEmbeddingProvider(...)` พร้อม
    `contracts.memoryEmbeddingProviders`.

    **ใหม่**: `api.registerEmbeddingProvider(...)` พร้อม
    `contracts.embeddingProviders`.

    contract embedding provider ทั่วไปใช้ซ้ำนอก memory ได้ และเป็น
    path ที่รองรับสำหรับ providers ใหม่ API การลงทะเบียนเฉพาะ memory
    ยังคงเชื่อมไว้เป็น compatibility ที่เลิกใช้แล้วขณะที่ providers ที่มีอยู่ย้ายระบบ
    รายงานการตรวจสอบ Plugin จะรายงานการใช้งานที่ไม่ใช่ bundled ว่าเป็น compatibility debt

  </Accordion>

  <Accordion title="เปลี่ยนชื่อประเภทข้อความเซสชัน Subagent">
    type aliases แบบ legacy สองรายการที่ยัง export จาก `src/plugins/runtime/types.ts`:

    | เดิม                           | ใหม่                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    method runtime `readSession` ถูกเลิกใช้แล้ว โดยให้ใช้
    `getSessionMessages` แทน signature เดิม; method เดิมเรียกต่อไปยัง
    method ใหม่

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **เดิม**: `runtime.tasks.flow` (เอกพจน์) คืนค่า live task-flow accessor

    **ใหม่**: `runtime.tasks.managedFlows` เก็บ runtime การ mutation ของ TaskFlow
    ที่จัดการแล้วสำหรับ Plugin ที่สร้าง, อัปเดต, ยกเลิก, หรือรัน child tasks จาก
    flow ใช้ `runtime.tasks.flows` เมื่อ Plugin ต้องการเฉพาะการอ่านแบบ DTO-based

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    ครอบคลุมใน "วิธีย้ายระบบ → ย้าย embedded tool-result extensions ไปยัง
    middleware" ข้างต้น รวมไว้ที่นี่เพื่อความครบถ้วน: path `api.registerEmbeddedExtensionFactory(...)`
    ที่ถูกลบและใช้ได้เฉพาะ embedded-runner ถูกแทนที่ด้วย
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
การเลิกใช้งานระดับ extension (ภายใน Plugin ช่องทาง/provider แบบ bundled ภายใต้
`extensions/`) ถูกติดตามภายใน barrel `api.ts` และ `runtime-api.ts`
ของตัวเอง สิ่งเหล่านี้ไม่กระทบ contract ของ Plugin third-party และไม่ได้แสดงไว้
ที่นี่ หากคุณ consume barrel local ของ Plugin แบบ bundled โดยตรง ให้อ่าน
ความคิดเห็น deprecation ใน barrel นั้นก่อนอัปเกรด
</Note>

## ไทม์ไลน์การลบ

| เมื่อใด                   | สิ่งที่เกิดขึ้น                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **ตอนนี้**                | พื้นผิวที่เลิกใช้แล้วจะแสดงคำเตือนขณะรันไทม์                               |
| **รุ่นหลักถัดไป** | พื้นผิวที่เลิกใช้แล้วจะถูกลบออก; Plugin ที่ยังใช้งานอยู่จะล้มเหลว |

Plugin หลักทั้งหมดได้รับการย้ายแล้ว Plugin ภายนอกควรย้าย
ก่อนรุ่นหลักถัดไป

## การระงับคำเตือนชั่วคราว

ตั้งค่าตัวแปรสภาพแวดล้อมเหล่านี้ระหว่างที่คุณกำลังย้าย:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

นี่เป็นทางออกชั่วคราว ไม่ใช่วิธีแก้ปัญหาถาวร

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/plugins/building-plugins) - สร้าง Plugin แรกของคุณ
- [ภาพรวม SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิงการนำเข้า subpath ฉบับเต็ม
- [Channel Plugins](/th/plugins/sdk-channel-plugins) - การสร้าง channel plugins
- [Provider Plugins](/th/plugins/sdk-provider-plugins) - การสร้าง provider plugins
- [Plugin Internals](/th/plugins/architecture) - เจาะลึกสถาปัตยกรรม
- [Plugin Manifest](/th/plugins/manifest) - ข้อมูลอ้างอิงสคีมา manifest
