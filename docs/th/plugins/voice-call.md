---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงผ่านระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายเรียกเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-07-19T07:23:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ebadf26f53314f77154396b57323dcf1330c39e3bf5296630e4c11cabf42c209
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin: การแจ้งเตือนขาออก การสนทนา
หลายรอบ เสียงแบบเรียลไทม์สองทางพร้อมกัน การถอดเสียงแบบสตรีม และ
สายเรียกเข้าพร้อมนโยบายรายการที่อนุญาต

**ผู้ให้บริการ:** `mock` (สำหรับการพัฒนา ไม่ใช้เครือข่าย), `plivo` (Voice API + การโอนสายด้วย XML +
เสียง GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams)

<Note>
Plugin Voice Call ทำงาน **ภายในกระบวนการ Gateway** หากใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่เรียกใช้
Gateway แล้วรีสตาร์ท Gateway เพื่อโหลด Plugin
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    <Tabs>
      <Tab title="จาก npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="จากโฟลเดอร์ภายในเครื่อง (สำหรับการพัฒนา)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    ใช้แพ็กเกจเปล่าเพื่อติดตามแท็กรุ่นปัจจุบัน ปักหมุด
    เวอร์ชันที่แน่นอนเฉพาะเมื่อต้องการให้การติดตั้งทำซ้ำได้ หลังจากนั้นให้รีสตาร์ท Gateway
    เพื่อให้โหลด Plugin

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าภายใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่าง) อย่างน้อยต้องมี: `provider`, ข้อมูลรับรองของผู้ให้บริการ,
    `fromNumber` และ URL ของ Webhook ที่เข้าถึงได้จากสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    ตรวจสอบการเปิดใช้งาน Plugin ข้อมูลรับรองของผู้ให้บริการ การเปิดเผย Webhook และ
    ตรวจสอบว่ามีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ทำงานอยู่

  </Step>
  <Step title="ทดสอบเบื้องต้น">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    โดยค่าเริ่มต้น ทั้งสองคำสั่งเป็นการทดลองรัน เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกแบบสั้น:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้องได้ผลลัพธ์เป็น **URL ของ Webhook สาธารณะ**
หาก `publicUrl`, URL ของทันเนล, URL ของ Tailscale หรือทางเลือกสำรองของ serve
ได้ผลลัพธ์เป็นลูปแบ็กหรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการเครือข่ายโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลรับรอง บันทึกการเริ่มต้น
Gateway จะแสดงคำเตือนว่าการตั้งค่าไม่สมบูรณ์พร้อมคีย์ที่ขาดหาย และข้าม
การเริ่มรันไทม์ คำสั่ง การเรียก RPC และเครื่องมือเอเจนต์ยังคงส่งคืน
การกำหนดค่าที่ขาดหายอย่างแม่นยำเมื่อมีการใช้งาน

<Note>
ข้อมูลรับรองของ Voice Call รองรับ SecretRefs โดย `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะได้รับการแก้ไขผ่านพื้นผิว SecretRef มาตรฐาน ดู[พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // หรือ "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // หรือ TWILIO_FROM_NUMBER สำหรับ Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards มีอะไรให้ช่วยไหม",
              responseSystemPrompt: "คุณเป็นผู้เชี่ยวชาญด้านการ์ดเบสบอลที่ตอบอย่างกระชับ",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
            // region: "ie1", // ไม่บังคับ: us1 | ie1 | au1; ค่าเริ่มต้นคือ us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // คีย์สาธารณะของ Webhook Telnyx จาก Mission Control Portal
            // (Base64; สามารถตั้งค่าผ่าน TELNYX_PUBLIC_KEY ได้เช่นกัน)
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // เซิร์ฟเวอร์ Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // การรักษาความปลอดภัยของ Webhook (แนะนำสำหรับทันเนล/พร็อกซี)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // การเปิดเผยต่อสาธารณะ (เลือกหนึ่งรายการ)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* Twilio เท่านั้น ดูการถอดเสียงแบบสตรีม */ },
          realtime: { enabled: false /* ดูการสนทนาด้วยเสียงแบบเรียลไทม์ */ },
        },
      },
    },
  },
}
```

### ข้อมูลอ้างอิงการกำหนดค่า

คีย์ระดับบนสุดภายใต้ `plugins.entries.voice-call.config` ที่ไม่ได้แสดงไว้ด้านบน:

| คีย์                             | ค่าเริ่มต้น      | หมายเหตุ                                                                                              |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | สวิตช์หลักสำหรับเปิด/ปิด                                                                              |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open` ดู[สายเรียกเข้า](#inbound-calls)             |
| `allowFrom`                     | `[]`         | รายการ E.164 ที่อนุญาตสำหรับ `inboundPolicy: "allowlist"`                                                  |
| `maxDurationSeconds`            | `300`        | ขีดจำกัดระยะเวลาสูงสุดต่อสายที่บังคับใช้โดยไม่คำนึงถึงสถานะการรับสาย                                 |
| `staleCallReaperSeconds`        | `120`        | ดู[ตัวเก็บกวาดสายที่ค้าง](#stale-call-reaper) `0` ปิดใช้งานคุณสมบัตินี้                                      |
| `silenceTimeoutMs`              | `800`        | การตรวจจับช่วงเงียบเมื่อสิ้นสุดการพูดสำหรับขั้นตอนแบบดั้งเดิม (ไม่ใช่เรียลไทม์)                               |
| `transcriptTimeoutMs`           | `180000`     | ระยะเวลารอสูงสุดสำหรับบทถอดเสียงของผู้โทรก่อนยกเลิกรอบนั้น                                       |
| `ringTimeoutMs`                 | `30000`      | ระยะหมดเวลารอสัญญาณเรียกสำหรับสายขาออก                                                                   |
| `maxConcurrentCalls`            | `1`          | สายขาออกที่เกินขีดจำกัดนี้จะถูกปฏิเสธ                                                     |
| `outbound.notifyHangupDelaySec` | `3`          | จำนวนวินาทีที่รอหลังจาก TTS ก่อนวางสายอัตโนมัติในโหมด notify                                       |
| `skipSignatureVerification`     | `false`      | สำหรับการทดสอบภายในเครื่องเท่านั้น ห้ามเปิดใช้งานในการใช้งานจริง                                                    |
| `store`                         | ไม่ได้ตั้งค่า        | เขียนทับพาธเริ่มต้นของ `$OPENCLAW_STATE_DIR/voice-calls` (โดยปกติคือ `~/.openclaw/voice-calls`) |
| `agentId`                       | `"main"`     | เอเจนต์ที่ใช้สร้างการตอบกลับและจัดเก็บเซสชัน                                            |
| `responseModel`                 | ไม่ได้ตั้งค่า        | เขียนทับโมเดลเริ่มต้นสำหรับการตอบกลับแบบดั้งเดิม (ไม่ใช่เรียลไทม์)                                  |
| `responseSystemPrompt`          | สร้างขึ้น    | พรอมต์ระบบที่กำหนดเองสำหรับการตอบกลับแบบดั้งเดิม                                                        |
| `responseTimeoutMs`             | `30000`      | ระยะหมดเวลาสำหรับการสร้างการตอบกลับแบบดั้งเดิม (มิลลิวินาที)                                                      |

Twilio ใช้ตำแหน่งข้อมูล REST ของ US1 เป็นค่าเริ่มต้น หากต้องการประมวลผลสายใน Region
นอกสหรัฐอเมริกาที่รองรับ ให้ตั้งค่า `twilio.region` เป็น `ie1` หรือ `au1` และใช้ข้อมูลรับรองจาก
Region นั้น ดู
[คู่มือ REST API นอกสหรัฐอเมริกาของ Twilio](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับการเปิดเผยและความปลอดภัยของผู้ให้บริการ">
    - Twilio, Telnyx และ Plivo ต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้จากสาธารณะ** ทั้งหมด
    - `mock` เป็นผู้ให้บริการสำหรับการพัฒนาภายในเครื่อง (ไม่มีการเรียกใช้เครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบภายในเครื่องเท่านั้น
    - ในแพ็กเกจฟรีของ ngrok ให้ตั้งค่า `publicUrl` เป็น URL ของ ngrok ที่ตรงกันทุกประการ โดยจะบังคับใช้การตรวจสอบลายเซ็นเสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็นลูปแบ็ก (เอเจนต์ภายในเครื่องของ ngrok) สำหรับการพัฒนาภายในเครื่องเท่านั้น
    - URL ของแพ็กเกจฟรี ngrok อาจเปลี่ยนแปลงหรือเพิ่มพฤติกรรมหน้าคั่น หาก `publicUrl` เปลี่ยนไป ลายเซ็นของ Twilio จะล้มเหลว สำหรับการใช้งานจริง: ควรใช้โดเมนที่เสถียรหรือฟันเนลของ Tailscale

  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อแบบสตรีม">
    - `streaming.preStartTimeoutMs` (ค่าเริ่มต้น `5000`) ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` (ค่าเริ่มต้น `32`) จำกัดจำนวนรวมของซ็อกเก็ตก่อนเริ่มต้นที่ยังไม่ได้ตรวจสอบสิทธิ์
    - `streaming.maxPendingConnectionsPerIp` (ค่าเริ่มต้น `4`) จำกัดซ็อกเก็ตก่อนเริ่มต้นที่ยังไม่ได้ตรวจสอบสิทธิ์ต่อ IP ต้นทาง
    - `streaming.maxConnections` (ค่าเริ่มต้น `128`) จำกัดซ็อกเก็ตสตรีมสื่อที่เปิดอยู่ทั้งหมด (รอดำเนินการ + ทำงานอยู่)

  </Accordion>
  <Accordion title="การย้ายข้อมูลการกำหนดค่าแบบเดิม">
    การแยกวิเคราะห์การกำหนดค่าจะปรับคีย์แบบเดิมเหล่านี้ให้เป็นรูปแบบมาตรฐานโดยอัตโนมัติและบันทึก
    คำเตือนที่ระบุพาธทดแทน โดยชิมนี้จะถูกนำออกในรุ่น
    ในอนาคต (`2026.6.0`) ดังนั้นให้เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่คอมมิตไว้
    ใหม่เป็นรูปแบบมาตรฐาน:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` ถูกนำออกแล้ว (ขณะนี้บริบทแบบเรียลไทม์ใช้พรอมต์เอเจนต์ที่สร้างขึ้น)

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

โดยค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้สายที่โทรซ้ำจาก
ผู้โทรรายเดิมยังคงความจำของการสนทนา ตั้งค่า `sessionScope: "per-call"` เมื่อ
ต้องการให้แต่ละสายของผู้ให้บริการเครือข่ายโทรศัพท์เริ่มต้นด้วยบริบทใหม่ เช่น ขั้นตอนของแผนกต้อนรับ
การจอง IVR หรือบริดจ์ Google Meet ซึ่งหมายเลขโทรศัพท์เดียวกันอาจ
เป็นตัวแทนของการประชุมต่างกัน

Voice Call จัดเก็บคีย์เซสชันที่สร้างขึ้นภายใต้เนมสเปซของเอเจนต์ที่กำหนดค่าไว้
(`agent:<agentId>:voice:*`) คีย์การผสานการทำงานแบบระบุชัดเจนที่ยังไม่ผ่านการประมวลผลจะถูกแก้ไขไปยัง
เนมสเปซเดียวกัน: คีย์มาตรฐาน `agent:<configuredAgentId>:*` จะคง
เจ้าของนั้นไว้และปฏิบัติตามการใช้นามแฝง `session.mainKey`/ขอบเขตส่วนกลางของแกนหลัก ส่วนอินพุต
`agent:*` จากภายนอกหรือที่มีรูปแบบไม่ถูกต้องจะถูกกำหนดขอบเขตเป็นคีย์ทึบภายใต้เอเจนต์
ที่กำหนดค่าไว้ และ `global` กับ `unknown` ยังคงเป็นตัวบ่งชี้ส่วนกลาง

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงแบบเรียลไทม์สองทางพร้อมกันสำหรับเสียงการโทรสด
โดยแยกจาก `streaming` ซึ่งส่งต่อเสียงไปยังผู้ให้บริการ
ถอดเสียงแบบเรียลไทม์เท่านั้น

<Warning>
ไม่สามารถใช้ `realtime.enabled` ร่วมกับ `streaming.enabled` ได้ ให้เลือก
โหมดเสียงหนึ่งโหมดต่อสาย
</Warning>

พฤติกรรมของรันไทม์ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio และ Telnyx
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงแบบเรียลไทม์ที่รวมมาให้: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการแต่ละราย
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- โดยค่าเริ่มต้น Voice Call เปิดให้ใช้เครื่องมือเรียลไทม์ `openclaw_agent_consult` ที่ใช้ร่วมกัน โมเดลเรียลไทม์สามารถเรียกใช้เครื่องมือนี้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ตามปกติ
- `realtime.consultPolicy` สามารถเพิ่มคำแนะนำว่าโมเดลเรียลไทม์ควรเรียก `openclaw_agent_consult` เมื่อใดได้
- `realtime.agentContext.enabled` ปิดอยู่โดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะแทรกข้อมูลระบุตัวตนของเอเจนต์แบบจำกัดขนาดและแคปซูลไฟล์พื้นที่ทำงานที่เลือกไว้ลงในคำสั่งของผู้ให้บริการเรียลไทม์เมื่อตั้งค่าเซสชัน
- `realtime.fastContext.enabled` ปิดอยู่โดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะค้นหาคำถามสำหรับการปรึกษาในบริบทหน่วยความจำ/เซสชันที่จัดทำดัชนีไว้ก่อน และส่งส่วนย่อยเหล่านั้นกลับไปยังโมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อนเปลี่ยนไปใช้เอเจนต์สำหรับการปรึกษาแบบเต็ม เฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true เท่านั้น
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงแบบเรียลไทม์ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อแบบเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- `inboundPolicy` ต้องไม่เป็น `"disabled"` เมื่อ `realtime.enabled` เป็น true โดย `validateProviderConfig` จะปฏิเสธชุดค่านี้
- คีย์เซสชันการปรึกษาจะใช้เซสชันการโทรที่จัดเก็บไว้ซ้ำเมื่อมี จากนั้นจึงใช้ `sessionScope` ที่กำหนดค่าไว้เป็นทางเลือก (`per-phone` โดยค่าเริ่มต้น หรือ `per-call` สำหรับการโทรแบบแยก)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการเรียกใช้การปรึกษา:

| นโยบาย           | ลักษณะการทำงาน                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดให้ใช้เครื่องมือการปรึกษาและจำกัดเอเจนต์ปกติให้ใช้เฉพาะ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดให้ใช้เครื่องมือการปรึกษาและอนุญาตให้เอเจนต์ปกติใช้นโยบายเครื่องมือของเอเจนต์ตามปกติ                                                      |
| `none`           | ไม่เปิดให้ใช้เครื่องมือการปรึกษา แต่ยังคงส่งต่อ `realtime.tools` แบบกำหนดเองไปยังผู้ให้บริการเรียลไทม์                               |

`realtime.consultPolicy` ควบคุมเฉพาะคำสั่งสำหรับโมเดลเรียลไทม์:

| นโยบาย        | คำแนะนำ                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | ใช้พรอมต์เริ่มต้นต่อไปและให้ผู้ให้บริการตัดสินใจว่าเมื่อใดควรเรียกเครื่องมือการปรึกษา              |
| `substantive` | ตอบบทสนทนาเชื่อมโยงง่าย ๆ โดยตรง และปรึกษาก่อนตอบข้อเท็จจริง ใช้หน่วยความจำ เครื่องมือ หรือบริบท |
| `always`      | ปรึกษาก่อนทุกคำตอบที่มีสาระสำคัญ                                                        |

### บริบทเสียงของเอเจนต์

เปิดใช้ `realtime.agentContext` เมื่อบริดจ์เสียงควรให้เสียงเหมือนเอเจนต์
OpenClaw ที่กำหนดค่าไว้ โดยไม่ต้องเสียเวลาไปกลับสำหรับการปรึกษาเอเจนต์แบบเต็มใน
การโต้ตอบทั่วไป แคปซูลบริบทจะถูกเพิ่มครั้งเดียวเมื่อสร้างเซสชันเรียลไทม์
จึงไม่เพิ่มเวลาแฝงต่อการโต้ตอบแต่ละครั้ง การเรียก
`openclaw_agent_consult` ยังคงเรียกใช้เอเจนต์ OpenClaw แบบเต็มและควรใช้
สำหรับงานเครื่องมือ ข้อมูลปัจจุบัน การค้นหน่วยความจำ หรือสถานะพื้นที่ทำงาน

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### ตัวอย่างผู้ให้บริการเรียลไทม์

<Tabs>
  <Tab title="Google Gemini Live">
    ค่าเริ่มต้น: คีย์ API จาก `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    หรือ `GOOGLE_API_KEY`; โมเดล `gemini-3.1-flash-live-preview`;
    เสียง `Kore` โดยค่าเริ่มต้น `sessionResumption` และ `contextWindowCompression` จะเปิดอยู่
    สำหรับการโทรที่ยาวขึ้นและเชื่อมต่อใหม่ได้ ใช้ `silenceDurationMs`,
    `startSensitivity` และ `endSensitivity` เพื่อปรับให้ผลัดกันพูดได้เร็วขึ้นบน
    เสียงโทรศัพท์

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "พูดให้กระชับ เรียก openclaw_agent_consult ก่อนใช้เครื่องมือที่ต้องให้เหตุผลเชิงลึก",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

ดูตัวเลือกเสียงแบบเรียลไทม์เฉพาะผู้ให้บริการที่ [ผู้ให้บริการ Google](/th/providers/google) และ
[ผู้ให้บริการ OpenAI](/th/providers/openai)

## การถอดเสียงแบบสตรีม

`streaming` เชื่อมต่อ Twilio Media Streams กับผู้ให้บริการถอดเสียงแบบเรียลไทม์
เส้นทางสตรีมแบบดั้งเดิมต้องใช้ `provider: "twilio"`; การกำหนดค่าด้วย
Telnyx, Plivo หรือ mock จะถูกปฏิเสธ เสียงสดของ Telnyx ใช้เส้นทาง
`realtime.enabled` ที่ตรวจสอบสิทธิ์แยกต่างหากแทน

ลักษณะการทำงานของรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่รวมมาให้: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการแต่ละราย
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบเรียลไทม์พร้อมใช้งานแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการลงทะเบียนไว้ Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

### ตัวอย่างผู้ให้บริการสตรีม

<Tabs>
  <Tab title="OpenAI">
    ค่าเริ่มต้น: คีย์ API `streaming.providers.openai.apiKey` หรือ
    `OPENAI_API_KEY`; โมเดล `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // ไม่บังคับหากตั้งค่า OPENAI_API_KEY ไว้
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    ค่าเริ่มต้น: คีย์ API `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY` (จะ
    ใช้โปรไฟล์การตรวจสอบสิทธิ์ OAuth ของ xAI เป็นทางเลือกหากไม่ได้ตั้งค่าทั้งสองค่า); ปลายทาง
    `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราการสุ่มตัวอย่าง `8000`;
    `endpointingMs: 800`; `interimResults: true`

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // ไม่บังคับหากตั้งค่า XAI_API_KEY ไว้
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS สำหรับการโทร

Voice Call ใช้การกำหนดค่า `messages.tts` หลักสำหรับการสตรีมเสียงพูดใน
การโทร คุณสามารถเขียนทับได้ภายใต้การกำหนดค่า Plugin โดยใช้ **โครงสร้างเดียวกัน** —
ระบบจะผสานแบบลึกกับ `messages.tts`

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**ระบบจะไม่ใช้เสียงพูดของ Microsoft สำหรับการโทรด้วยเสียง** การสังเคราะห์เสียงสำหรับโทรศัพท์ต้องใช้
ผู้ให้บริการที่รองรับเอาต์พุตเป้าหมายสำหรับโทรศัพท์ แต่ผู้ให้บริการเสียงพูดของ Microsoft
ไม่รองรับ จึงข้ามผู้ให้บริการนี้สำหรับการโทรและลองใช้ผู้ให้บริการรายอื่นใน
ลำดับทางเลือกแทน
</Warning>

หมายเหตุเกี่ยวกับลักษณะการทำงาน:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะได้รับการซ่อมแซมโดย `openclaw doctor --fix`; การกำหนดค่าที่คอมมิตควรใช้ `tts.providers.<provider>`
- ระบบจะใช้ TTS หลักเมื่อเปิดใช้การสตรีมสื่อของ Twilio มิฉะนั้นการโทรจะเปลี่ยนไปใช้เสียงที่มากับผู้ให้บริการ
- หากสตรีมสื่อของ Twilio ทำงานอยู่แล้ว Voice Call จะไม่เปลี่ยนไปใช้ `<Say>` ของ TwiML หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นเสียงสองเส้นทาง
- เมื่อ TTS สำหรับโทรศัพท์เปลี่ยนไปใช้ผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมลำดับผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อการแก้ไขข้อบกพร่อง
- เมื่อการแทรกเสียงของ Twilio หรือการยุติสตรีมล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่อยู่ในคิวจะสิ้นสุดอย่างถูกต้องแทนที่จะปล่อยให้ผู้โทรที่กำลังรอการเล่นเสียงเสร็จสิ้นค้างอยู่

### ตัวอย่าง TTS

<Tabs>
  <Tab title="เฉพาะ TTS หลัก">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="แทนที่ด้วย ElevenLabs (เฉพาะการโทร)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="แทนที่โมเดล OpenAI (ผสานแบบลึก)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                speakerVoice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## สายเรียกเข้า

นโยบายสายเรียกเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายเรียกเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "สวัสดี! มีอะไรให้ช่วยไหม?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรองหมายเลขผู้โทรที่มีระดับความเชื่อมั่นต่ำ Plugin
จะปรับค่า `From` ที่ผู้ให้บริการส่งมาให้อยู่ในรูปแบบมาตรฐาน แล้วเปรียบเทียบกับ `allowFrom`
การตรวจสอบ Webhook จะยืนยันตัวตนของการส่งข้อมูลจากผู้ให้บริการและความสมบูรณ์ของเพย์โหลด
แต่ **ไม่** ได้พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร PSTN/VoIP ให้ถือว่า
`allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่การยืนยันตัวตนผู้โทรที่มีความน่าเชื่อถือสูง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางตามหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งตัวรับสายของหมายเลขโทรศัพท์หลาย
หมายเลข และแต่ละหมายเลขควรทำงานเสมือนเป็นคนละสาย ตัวอย่างเช่น
หมายเลขหนึ่งสามารถใช้ผู้ช่วยส่วนตัวที่เป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิก
เชิงธุรกิจ เอเจนต์ตอบกลับที่ต่างกัน และเสียง TTS ที่ต่างกัน

ระบบจะเลือกเส้นทางจากหมายเลข `To` ที่ถูกโทรเข้าซึ่งผู้ให้บริการส่งมา คีย์ต้อง
เป็นหมายเลข E.164 เมื่อมีสายเรียกเข้า Voice Call จะหา
เส้นทางที่ตรงกันหนึ่งครั้ง บันทึกเส้นทางที่ตรงกันไว้ในระเบียนการโทร และใช้
การกำหนดค่าที่มีผลนั้นซ้ำสำหรับคำทักทาย เส้นทางตอบกลับอัตโนมัติแบบดั้งเดิม เส้นทาง
ให้คำปรึกษาแบบเรียลไทม์ และการเล่น TTS หากไม่มีเส้นทางที่ตรงกัน ระบบจะใช้การกำหนดค่า
Voice Call ส่วนกลาง สายโทรออกจะไม่ใช้ `numbers`; ให้ส่งเป้าหมาย
ข้อความ และเซสชันของสายโทรออกอย่างชัดเจนเมื่อเริ่มการโทร

ขณะนี้การแทนที่ค่าของเส้นทางรองรับ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่าของเส้นทาง `tts` จะผสานแบบลึกทับการกำหนดค่า `tts` ของ Voice Call ส่วนกลาง ดังนั้น
โดยทั่วไปจึงแทนที่เฉพาะเสียงของผู้ให้บริการได้:

```json5
{
  inboundGreeting: "สวัสดีจากสายหลัก",
  responseSystemPrompt: "คุณคือผู้ช่วยเสียงเริ่มต้น",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards มีอะไรให้ช่วยไหม?",
      responseSystemPrompt: "คุณคือผู้เชี่ยวชาญด้านการ์ดเบสบอลที่ตอบอย่างกระชับ",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### ข้อกำหนดของผลลัพธ์เสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะเพิ่มข้อกำหนดของผลลัพธ์เสียงพูดที่เข้มงวดต่อท้าย
พรอมต์ระบบ โดยกำหนดให้ตอบกลับเป็น JSON แบบ `{"spoken":"..."}` Voice Call
จะดึงข้อความสำหรับพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ทำเครื่องหมายว่าเป็นเนื้อหาการให้เหตุผล/ข้อผิดพลาด
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน fenced block หรือคีย์ `"spoken"` แบบอินไลน์
- ย้อนกลับไปใช้ข้อความธรรมดาและลบย่อหน้าเกริ่นนำที่น่าจะเป็นข้อความวางแผน/เมตา

วิธีนี้ช่วยให้เสียงที่เล่นมุ่งเน้นข้อความสำหรับผู้โทร และหลีกเลี่ยงการเปิดเผย
ข้อความวางแผนลงในเสียง

### พฤติกรรมเมื่อเริ่มการสนทนา

สำหรับสายโทรออก `conversation` การจัดการข้อความแรกจะเชื่อมโยงกับสถานะ
การเล่นแบบสด:

- การล้างคิวเมื่อพูดแทรกและการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังเล่นอยู่เท่านั้น
- หากการเล่นครั้งแรกล้มเหลว สายจะกลับสู่ `listening` และข้อความเริ่มต้นจะยังอยู่ในคิวเพื่อให้ลองใหม่
- การเล่นครั้งแรกสำหรับการสตรีมของ Twilio จะเริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีความล่าช้าเพิ่มเติม
- การพูดแทรกจะยกเลิกการเล่นที่กำลังดำเนินอยู่และล้างรายการ TTS ของ Twilio ที่อยู่ในคิวแต่ยังไม่เริ่มเล่น รายการที่ถูกล้างจะเสร็จสิ้นด้วยสถานะข้าม เพื่อให้ตรรกะการตอบกลับถัดไปดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาด้วยเสียงแบบเรียลไทม์ใช้ช่วงสนทนาเปิดของสตรีมเรียลไทม์เอง Voice Call จะ **ไม่** โพสต์การอัปเดต TwiML แบบเดิม `<Say>` สำหรับข้อความเริ่มต้นนั้น เพื่อให้เซสชันขาออก `<Connect><Stream>` ยังคงเชื่อมต่ออยู่

### ระยะผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อของ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
วางสายโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ภายในช่วงเวลาดังกล่าว ระบบจะยกเลิกการวางสายอัตโนมัติ
- หากไม่มีสตรีมลงทะเบียนใหม่หลังหมดระยะผ่อนผัน ระบบจะวางสายเพื่อป้องกันไม่ให้สายค้างอยู่ในสถานะใช้งาน

## ตัวเก็บกวาดสายที่ค้าง

ใช้ `staleCallReaperSeconds` (ค่าเริ่มต้น **120**) เพื่อวางสายที่ไม่เคย
มีผู้รับและไม่เคยเข้าสู่สถานะการสนทนาแบบสด เช่น สายโหมดแจ้งเตือน
ที่ผู้ให้บริการไม่เคยส่ง Webhook ปลายทาง ตั้งค่าเป็น `0` เพื่อ
ปิดใช้งาน

ตัวเก็บกวาดจะทำงานทุก 30 วินาที และวางสายเฉพาะสายที่ไม่มี
การประทับเวลา `answeredAt` และยังไม่ได้อยู่ในสถานะปลายทางหรือสถานะสด
(`speaking`/`listening`) ดังนั้นตัวจับเวลานี้จะไม่เก็บกวาดการสนทนาที่มีผู้รับสายแล้ว
ส่วน `maxDurationSeconds` (ค่าเริ่มต้น 300) เป็นขีดจำกัดแยกต่างหากที่
วางสายซึ่งมีผู้รับแล้วแต่ใช้เวลานานเกินไป

สำหรับโฟลว์แบบแจ้งเตือนที่ผู้ให้บริการเครือข่ายอาจส่ง Webhook การเรียกเข้า/รับสาย
ล่าช้า ให้เพิ่ม `staleCallReaperSeconds` ให้สูงกว่าค่าเริ่มต้น เพื่อไม่ให้
สายที่ช้าแต่เป็นปกติถูกเก็บกวาดเร็วเกินไป ช่วง `120`-`300` วินาทีเหมาะสมสำหรับระบบที่ใช้งานจริง

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## ความปลอดภัยของ Webhook

เมื่อมีพร็อกซีหรือทันเนลอยู่หน้า Gateway Plugin จะสร้าง
URL สาธารณะขึ้นใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่า
จะเชื่อถือส่วนหัวที่ส่งต่อใดบ้าง:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  รายการอนุญาตของโฮสต์จากส่วนหัวการส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือส่วนหัวที่ส่งต่อโดยไม่ต้องมีรายการอนุญาต
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือส่วนหัวที่ส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio, Telnyx และ Plivo คำขอ Webhook ที่ถูกต้องแต่เล่นซ้ำจะได้รับการตอบรับ แต่จะข้ามผลข้างเคียง
- แต่ละช่วงสนทนาของ Twilio จะมีโทเค็นประจำช่วงในคอลแบ็ก `<Gather>` เพื่อไม่ให้คอลแบ็กเสียงพูดที่เก่าหรือถูกเล่นซ้ำตอบสนองช่วงถอดเสียงที่ใหม่กว่าซึ่งกำลังรออยู่ได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านเนื้อหา เมื่อไม่มีส่วนหัวลายเซ็นที่ผู้ให้บริการกำหนด
- Webhook ของ voice-call ใช้โปรไฟล์การอ่านเนื้อหาก่อนยืนยันตัวตนที่ใช้ร่วมกัน (ขนาดเนื้อหาสูงสุด 64 KB, หมดเวลาอ่าน 5 วินาที) พร้อมขีดจำกัดคำขอที่กำลังดำเนินการต่อคีย์ (โดยค่าเริ่มต้น 8 คำขอพร้อมกันต่อคีย์) ก่อนตรวจสอบลายเซ็น

ตัวอย่างที่ใช้โฮสต์สาธารณะคงที่:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "สวัสดีจาก OpenClaw"
openclaw voicecall start --to "+15555550123"   # ชื่อแทนของ call
openclaw voicecall continue --call-id <id> --message "มีคำถามไหม?"
openclaw voicecall speak --call-id <id> --message "รอสักครู่"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # สรุปเวลาแฝงของช่วงสนทนาจากบันทึก
openclaw voicecall expose --mode funnel
```

เมื่อ Gateway ทำงานอยู่แล้ว คำสั่งดำเนินงาน `voicecall`
จะมอบหมายให้รันไทม์ voice-call ที่ Gateway เป็นเจ้าของ เพื่อไม่ให้ CLI ผูกกับ
เซิร์ฟเวอร์ Webhook ตัวที่สอง หากไม่สามารถเข้าถึง Gateway ได้ คำสั่งจะย้อนกลับไปใช้
รันไทม์ CLI แบบสแตนด์อโลน

`latency` จะอ่าน `calls.jsonl` จากพาธจัดเก็บเริ่มต้นของ voice-call ใช้
`--file <path>` เพื่อระบุบันทึกอื่น และใช้ `--last <n>` เพื่อจำกัด
การวิเคราะห์เฉพาะ N ระเบียนล่าสุด (ค่าเริ่มต้น 200) ผลลัพธ์ประกอบด้วยค่าต่ำสุด/สูงสุด/เฉลี่ย,
p50 และ p95 สำหรับเวลาแฝงของช่วงสนทนาและเวลารอฟัง

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `voice_call`

| การดำเนินการ          | อาร์กิวเมนต์                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call มาพร้อม Skills สำหรับเอเจนต์ที่สอดคล้องกัน

## RPC ของ Gateway

| วิธีการ                      | อาร์กิวเมนต์                                                             | หมายเหตุ                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | ย้อนกลับไปใช้การกำหนดค่า `toNumber` เมื่อไม่ได้ระบุ `to`                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | เหมือนกับ `initiate` แต่ยอมรับ `dtmfSequence` ก่อนเชื่อมต่อด้วย           |
| `voicecall.continue`        | `callId`, `message`                                              | บล็อกจนกว่ารอบการโต้ตอบจะเสร็จสิ้น และส่งคืนบทสนทนา                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | รูปแบบอะซิงโครนัส: ส่งคืน `operationId` ทันที                      |
| `voicecall.continue.result` | `operationId`                                                    | ตรวจสอบการดำเนินการ `voicecall.continue.start` ที่รอดำเนินการเพื่อรับผลลัพธ์      |
| `voicecall.speak`           | `callId`, `message`                                              | พูดโดยไม่รอ และใช้บริดจ์แบบเรียลไทม์เมื่อ `realtime.enabled` |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | ละเว้น `callId` เพื่อแสดงรายการสายที่ใช้งานอยู่ทั้งหมด                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` เท่านั้น สายในโหมดแจ้งเตือน
ที่ต้องการส่งตัวเลขหลังเชื่อมต่อควรใช้ `voicecall.dtmf` หลังจากมีสายแล้ว

## การแก้ไขปัญหา

### การตั้งค่าการเปิดเผย Webhook ล้มเหลว

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่เรียกใช้ Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo` นั้น `webhook-exposure` ต้องเป็นสีเขียว แม้กำหนดค่า
`publicUrl` แล้วก็ยังล้มเหลวหากชี้ไปยังพื้นที่เครือข่ายภายในหรือส่วนตัว
เนื่องจากผู้ให้บริการโทรกลับไปยังที่อยู่เหล่านั้นไม่ได้
อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` หรือช่วง NAT ระดับผู้ให้บริการอื่น
เป็น `publicUrl`

สายโทรออกในโหมดแจ้งเตือนของ Twilio จะส่ง TwiML เริ่มต้น `<Say>` โดยตรง
ในคำขอสร้างสาย ดังนั้นข้อความเสียงแรกจึงไม่ขึ้นอยู่กับการที่
Twilio ดึง TwiML จาก Webhook แต่ยังคงต้องมี Webhook สาธารณะสำหรับคอลแบ็กสถานะ
สายสนทนา DTMF ก่อนเชื่อมต่อ สตรีมแบบเรียลไทม์ และ
การควบคุมสายหลังเชื่อมต่อ

ใช้ช่องทางเปิดเผยต่อสาธารณะหนึ่งช่องทาง:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // หรือ
          tunnel: { provider: "ngrok" },
          // หรือ
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

หลังเปลี่ยนการกำหนดค่า ให้เริ่มต้นใหม่หรือโหลด Gateway ใหม่ แล้วเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการทดลองทำงาน เว้นแต่จะส่ง `--yes`

### ข้อมูลประจำตัวของผู้ให้บริการใช้ไม่ได้

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลประจำตัวที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber` หรือ `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` และ
  `TELNYX_PUBLIC_KEY`
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber` หรือ
  `PLIVO_AUTH_ID` และ `PLIVO_AUTH_TOKEN`

ข้อมูลประจำตัวต้องอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ภายในเครื่อง
จะไม่ส่งผลต่อ Gateway ที่กำลังทำงานอยู่จนกว่าจะเริ่มต้นใหม่หรือโหลด
สภาพแวดล้อมใหม่

### สายเริ่มทำงานแต่ Webhook ของผู้ให้บริการไม่เข้ามา

ยืนยันว่าคอนโซลของผู้ให้บริการชี้ไปยัง URL ของ Webhook สาธารณะที่ตรงกันทุกประการ:

```text
https://voice.example.com/voice/webhook
```

จากนั้นตรวจสอบสถานะรันไทม์:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

สาเหตุที่พบบ่อย:

- `publicUrl` ชี้ไปยังพาธอื่นที่ไม่ใช่ `serve.path`
- URL ของทันเนลเปลี่ยนไปหลังจาก Gateway เริ่มทำงาน
- พร็อกซีส่งต่อคำขอ แต่ตัดหรือเขียนส่วนหัวโฮสต์/โปรโตคอลใหม่
- ไฟร์วอลล์หรือ DNS กำหนดเส้นทางชื่อโฮสต์สาธารณะไปยังที่อื่นที่ไม่ใช่ Gateway
- Gateway เริ่มต้นใหม่โดยไม่ได้เปิดใช้ Plugin Voice Call

เมื่อมีรีเวิร์สพร็อกซีหรือทันเนลอยู่หน้า Gateway ให้ตั้งค่า
`webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้
`webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่ทราบ ใช้
`webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตพร็อกซี
อยู่ภายใต้การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ระบบตรวจสอบลายเซ็นของผู้ให้บริการกับ URL สาธารณะที่ OpenClaw สร้างขึ้นใหม่
จากคำขอขาเข้า หากลายเซ็นไม่ผ่าน:

- ยืนยันว่า URL ของ Webhook ผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึงรูปแบบ โฮสต์ และพาธ
- สำหรับ URL ของ ngrok ระดับฟรี ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ของทันเนลเปลี่ยน
- ตรวจสอบว่าพร็อกซีรักษาส่วนหัวโฮสต์และโปรโตคอลเดิมไว้ หรือกำหนดค่า `webhookSecurity.allowedHosts`
- อย่าเปิดใช้ `skipSignatureVerification` นอกการทดสอบภายในเครื่อง

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมผ่านหมายเลขโทรเข้า Twilio ขั้นแรกให้ตรวจสอบ Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบทรานสปอร์ต Google Meet อย่างชัดเจน:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบหมายเลข
โทรเข้าของ Meet, PIN และ `--dtmf-sequence` สายโทรศัพท์อาจทำงานปกติ
ขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet เริ่มช่วงการโทรผ่าน Twilio ด้วย `voicecall.start` พร้อม
ลำดับ DTMF ก่อนเชื่อมต่อ ลำดับที่สร้างจาก PIN จะรวม
`voiceCall.dtmfDelayMs` ของ Plugin Google Meet (ค่าเริ่มต้น **12000 ms**) เป็นตัวเลขรอของ Twilio
ที่นำหน้า เนื่องจากพรอมต์โทรเข้าของ Meet อาจมาถึงล่าช้า จากนั้น Voice Call
จะเปลี่ยนเส้นทางกลับไปยังการจัดการแบบเรียลไทม์ก่อนขอคำทักทายเริ่มต้น

ใช้ `openclaw logs --follow` สำหรับการติดตามเฟสแบบสด การเข้าร่วม Meet
ผ่าน Twilio ที่ทำงานปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วมผ่าน Twilio ให้ Voice Call
- Voice Call จัดเก็บ TwiML ของ DTMF ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้และให้บริการก่อนการจัดการแบบเรียลไทม์
- Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับสาย Twilio
- Google Meet ขอเสียงพูดแนะนำด้วย `voicecall.speak` หลังช่วงหน่วงหลัง DTMF

`openclaw voicecall tail` ยังคงแสดงระเบียนสายที่บันทึกไว้ ซึ่งมีประโยชน์สำหรับ
สถานะสายและบทสนทนา แต่ไม่ได้แสดงทุกการเปลี่ยนผ่านของ Webhook/เรียลไทม์
ในนั้น

### สายแบบเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว: `realtime.enabled` และ
`streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับสาย Twilio/Telnyx แบบเรียลไทม์ ให้ตรวจสอบด้วยว่า:

- มีการโหลดและลงทะเบียน Plugin ผู้ให้บริการแบบเรียลไทม์
- ไม่ได้ตั้งค่า `realtime.provider` หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับกระบวนการ Gateway
- `openclaw logs --follow` แสดงว่ามีการให้บริการ TwiML แบบเรียลไทม์ บริดจ์แบบเรียลไทม์เริ่มทำงาน และคำทักทายเริ่มต้นถูกเพิ่มเข้าคิว

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [การแปลงข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
