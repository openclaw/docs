---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงผ่านระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายเรียกเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกสำหรับเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-07-12T16:32:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin: การแจ้งเตือนขาออก การสนทนา
แบบหลายรอบ เสียงเรียลไทม์แบบสองทิศทางพร้อมกัน การถอดเสียงแบบสตรีม และ
สายเรียกเข้าที่ใช้นโยบายรายการอนุญาต

**ผู้ให้บริการ:** `mock` (สำหรับการพัฒนา ไม่ใช้เครือข่าย), `plivo` (Voice API + การโอนสายด้วย XML +
เสียงพูด GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams)

<Note>
Plugin Voice Call ทำงาน **ภายในโพรเซส Gateway** หากคุณใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่เรียกใช้
Gateway แล้วรีสตาร์ต Gateway เพื่อโหลด Plugin
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
      <Tab title="จากโฟลเดอร์ภายในเครื่อง (การพัฒนา)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    ใช้แพ็กเกจเปล่าเพื่อใช้แท็กรีลีสปัจจุบัน ระบุเวอร์ชันที่แน่นอน
เฉพาะเมื่อต้องการให้การติดตั้งทำซ้ำได้ หลังจากนั้นให้รีสตาร์ต Gateway
เพื่อให้โหลด Plugin

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าภายใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่าง) อย่างน้อยต้องมี `provider` ข้อมูลประจำตัว
    ของผู้ให้บริการ `fromNumber` และ URL ของ Webhook ที่เข้าถึงได้จากสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    ตรวจสอบการเปิดใช้งาน Plugin ข้อมูลประจำตัวของผู้ให้บริการ การเปิดให้เข้าถึง Webhook และ
    ตรวจสอบว่ามีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่เปิดใช้งานอยู่

  </Step>
  <Step title="ทดสอบเบื้องต้น">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็นการทดลองโดยไม่ดำเนินการจริงตามค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกแบบสั้น:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้องได้ **URL ของ Webhook สาธารณะ**
หาก `publicUrl`, URL ของทันเนล, URL ของ Tailscale หรือทางเลือกสำรองของเซิร์ฟเวอร์
ชี้ไปยัง local loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนการ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการโทรคมนาคมได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลประจำตัว Gateway
จะบันทึกคำเตือนว่าการตั้งค่าไม่สมบูรณ์พร้อมคีย์ที่ขาดหายไปเมื่อเริ่มทำงาน และข้าม
การเริ่มรันไทม์ คำสั่ง การเรียก RPC และเครื่องมือเอเจนต์ยังคงส่งคืน
การกำหนดค่าที่ขาดหายไปอย่างเจาะจงเมื่อถูกใช้งาน

<Note>
ข้อมูลประจำตัวของการโทรด้วยเสียงรองรับ SecretRefs โดย `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะได้รับการแปลงค่าผ่านส่วนเชื่อมต่อ SecretRef มาตรฐาน โปรดดู [ส่วนเชื่อมต่อข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
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
            // region: "ie1", // optional: us1 | ie1 | au1; defaults to us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### ข้อมูลอ้างอิงการกำหนดค่า

คีย์ระดับบนสุดภายใต้ `plugins.entries.voice-call.config` ที่ไม่ได้แสดงไว้ด้านบน:

| คีย์                             | ค่าเริ่มต้น      | หมายเหตุ                                                                                  |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | สวิตช์หลักสำหรับเปิด/ปิด                                                                  |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open` ดู [สายเรียกเข้า](#inbound-calls) |
| `allowFrom`                     | `[]`         | รายการหมายเลข E.164 ที่อนุญาตสำหรับ `inboundPolicy: "allowlist"`                                      |
| `maxDurationSeconds`            | `300`        | ขีดจำกัดระยะเวลาสูงสุดแบบตายตัวต่อสาย โดยบังคับใช้ไม่ว่าสายจะถูกรับแล้วหรือไม่                     |
| `staleCallReaperSeconds`        | `120`        | ดู [ตัวเก็บกวาดสายที่ค้าง](#stale-call-reaper) ค่า `0` จะปิดใช้งาน                          |
| `silenceTimeoutMs`              | `800`        | การตรวจจับความเงียบเมื่อสิ้นสุดคำพูดสำหรับโฟลว์แบบดั้งเดิม (ไม่ใช่เรียลไทม์)                   |
| `transcriptTimeoutMs`           | `180000`     | เวลารอสูงสุดสำหรับข้อความถอดเสียงของผู้โทร ก่อนจะยกเลิกรอบนั้น                           |
| `ringTimeoutMs`                 | `30000`      | ระยะเวลาหมดเวลารอสัญญาณเรียกสำหรับสายขาออก                                                       |
| `maxConcurrentCalls`            | `1`          | สายขาออกที่เกินขีดจำกัดนี้จะถูกปฏิเสธ                                         |
| `outbound.notifyHangupDelaySec` | `3`          | จำนวนวินาทีที่รอหลัง TTS ก่อนวางสายอัตโนมัติในโหมดแจ้งเตือน                           |
| `skipSignatureVerification`     | `false`      | สำหรับการทดสอบภายในเครื่องเท่านั้น ห้ามเปิดใช้งานในระบบใช้งานจริง                                        |
| `store`                         | ไม่ได้ตั้งค่า        | เขียนทับพาธบันทึกการโทรเริ่มต้น `~/.openclaw/voice-calls`                         |
| `agentId`                       | `"main"`     | เอเจนต์ที่ใช้สร้างการตอบกลับและจัดเก็บเซสชัน                                |
| `responseModel`                 | ไม่ได้ตั้งค่า        | เขียนทับโมเดลเริ่มต้นสำหรับการตอบกลับแบบดั้งเดิม (ไม่ใช่เรียลไทม์)                      |
| `responseSystemPrompt`          | สร้างขึ้น    | พรอมต์ระบบแบบกำหนดเองสำหรับการตอบกลับแบบดั้งเดิม                                            |
| `responseTimeoutMs`             | `30000`      | ระยะหมดเวลาสำหรับการสร้างการตอบกลับแบบดั้งเดิม (มิลลิวินาที)                                          |

Twilio ใช้ปลายทาง REST แบบ US1 ตามค่าเริ่มต้น หากต้องการประมวลผลสายเรียกเข้าใน
ภูมิภาคนอกสหรัฐฯ ที่รองรับ ให้ตั้งค่า `twilio.region` เป็น `ie1` หรือ `au1` และใช้ข้อมูลประจำตัวจาก
ภูมิภาคนั้น ดู
[คู่มือ REST API นอกสหรัฐฯ ของ Twilio](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับการเปิดให้เข้าถึงและความปลอดภัยของผู้ให้บริการ">
    - Twilio, Telnyx และ Plivo ต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้จากสาธารณะ**
    - `mock` เป็นผู้ให้บริการสำหรับการพัฒนาภายในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องมี `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็นจริง
    - `skipSignatureVerification` ใช้สำหรับการทดสอบภายในเครื่องเท่านั้น
    - สำหรับแพ็กเกจฟรีของ ngrok ให้ตั้งค่า `publicUrl` เป็น URL ของ ngrok ที่ตรงกันทุกประการ โดยจะบังคับใช้การตรวจสอบลายเซ็นเสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น local loopback (เอเจนต์ภายในเครื่องของ ngrok) สำหรับการพัฒนาภายในเครื่องเท่านั้น
    - URL ของแพ็กเกจฟรี ngrok อาจเปลี่ยนแปลงหรือเพิ่มหน้าคั่นกลาง หาก `publicUrl` เปลี่ยนไป ลายเซ็นของ Twilio จะล้มเหลว สำหรับระบบใช้งานจริง ควรใช้โดเมนที่คงที่หรือฟันเนลของ Tailscale

  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อแบบสตรีม">
    - `streaming.preStartTimeoutMs` (ค่าเริ่มต้น `5000`) ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` (ค่าเริ่มต้น `32`) จำกัดจำนวนซ็อกเก็ตก่อนเริ่มที่ยังไม่ผ่านการยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` (ค่าเริ่มต้น `4`) จำกัดจำนวนซ็อกเก็ตก่อนเริ่มที่ยังไม่ผ่านการยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` (ค่าเริ่มต้น `128`) จำกัดซ็อกเก็ตสตรีมสื่อที่เปิดอยู่ทั้งหมด (รอดำเนินการ + ทำงานอยู่)

  </Accordion>
  <Accordion title="การย้ายการกำหนดค่าแบบเก่า">
    การแยกวิเคราะห์การกำหนดค่าจะปรับคีย์แบบเก่าเหล่านี้ให้เป็นรูปแบบมาตรฐานโดยอัตโนมัติ และบันทึก
    คำเตือนที่ระบุพาธทดแทน โดยชิมนี้จะถูกนำออกในรีลีส
    ในอนาคต (`2026.6.0`) ดังนั้นให้เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้
    ใหม่เป็นรูปแบบมาตรฐาน:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` ถูกนำออกแล้ว (บริบทเรียลไทม์ใช้พรอมต์เอเจนต์ที่สร้างขึ้นแล้วในขณะนี้)

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

ตามค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้การโทรซ้ำจาก
ผู้โทรรายเดิมยังคงใช้หน่วยความจำการสนทนา ตั้งค่า `sessionScope: "per-call"` เมื่อ
การโทรผ่านผู้ให้บริการโทรคมนาคมแต่ละครั้งควรเริ่มต้นด้วยบริบทใหม่ เช่น โฟลว์ของแผนกต้อนรับ
การจอง IVR หรือบริดจ์ Google Meet ซึ่งหมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมคนละรายการ

Voice Call จัดเก็บคีย์เซสชันที่สร้างขึ้นภายใต้เนมสเปซของเอเจนต์ที่กำหนดค่าไว้
(`agent:<agentId>:voice:*`) คีย์การผสานรวมแบบระบุชัดเจนที่ยังไม่ผ่านการประมวลผลจะถูกแปลงค่าไปยัง
เนมสเปซเดียวกัน: คีย์มาตรฐาน `agent:<configuredAgentId>:*` จะคง
เจ้าของนั้นไว้และใช้การกำหนดนามแฝง `session.mainKey`/ขอบเขตส่วนกลางของแกนหลัก ส่วนอินพุต
`agent:*` ที่มาจากภายนอกหรือมีรูปแบบไม่ถูกต้องจะถูกกำหนดขอบเขตเป็นคีย์ทึบภายใต้เอเจนต์
ที่กำหนดค่าไว้ ส่วน `global` และ `unknown` ยังคงเป็นค่าเซนทิเนลส่วนกลาง

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์แบบสองทิศทางพร้อมกันสำหรับเสียงการโทรสด
โดยแยกจาก `streaming` ซึ่งส่งต่อเสียงไปยังผู้ให้บริการ
ถอดเสียงแบบเรียลไทม์เท่านั้น

<Warning>
ไม่สามารถใช้ `realtime.enabled` ร่วมกับ `streaming.enabled` ได้ ให้เลือก
โหมดเสียงหนึ่งโหมดต่อการโทรหนึ่งสาย
</Warning>

ลักษณะการทำงานของรันไทม์ในปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio และ Telnyx
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงแบบเรียลไทม์ที่มาพร้อมระบบ ได้แก่ Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการแต่ละราย
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- โดยค่าเริ่มต้น Voice Call จะเปิดใช้เครื่องมือเรียลไทม์ร่วม `openclaw_agent_consult` โมเดลเรียลไทม์สามารถเรียกใช้เครื่องมือนี้เมื่อผู้โทรขอการวิเคราะห์เชิงลึก ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ตามปกติ
- `realtime.consultPolicy` สามารถเพิ่มคำแนะนำเกี่ยวกับกรณีที่โมเดลเรียลไทม์ควรเรียก `openclaw_agent_consult`
- `realtime.agentContext.enabled` ปิดอยู่โดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะแทรกข้อมูลประจำตัวของเอเจนต์ที่มีขอบเขตจำกัดและแคปซูลไฟล์พื้นที่ทำงานที่เลือกไว้ลงในคำสั่งสำหรับผู้ให้บริการแบบเรียลไทม์ขณะตั้งค่าเซสชัน
- `realtime.fastContext.enabled` ปิดอยู่โดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะค้นหาคำถามสำหรับการปรึกษาในบริบทหน่วยความจำ/เซสชันที่ทำดัชนีไว้ก่อน และส่งส่วนข้อความเหล่านั้นกลับไปยังโมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` โดยจะย้อนกลับไปใช้เอเจนต์สำหรับการปรึกษาแบบเต็มรูปแบบเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็นจริง
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงแบบเรียลไทม์ลงทะเบียนอยู่เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อแบบเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- `inboundPolicy` ต้องไม่เป็น `"disabled"` เมื่อ `realtime.enabled` เป็นจริง โดย `validateProviderConfig` จะปฏิเสธการตั้งค่าร่วมกันดังกล่าว
- คีย์เซสชันสำหรับการปรึกษาจะใช้เซสชันการโทรที่จัดเก็บไว้ซ้ำเมื่อมี จากนั้นจึงย้อนกลับไปใช้ `sessionScope` ที่กำหนดค่าไว้ (ค่าเริ่มต้นคือ `per-phone` หรือใช้ `per-call` สำหรับการโทรที่แยกจากกัน)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการเรียกใช้การปรึกษา:

| นโยบาย          | ลักษณะการทำงาน                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือสำหรับการปรึกษา และจำกัดเอเจนต์ปกติให้ใช้ได้เฉพาะ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือสำหรับการปรึกษา และอนุญาตให้เอเจนต์ปกติใช้นโยบายเครื่องมือของเอเจนต์ตามปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือสำหรับการปรึกษา แต่ยังคงส่งต่อ `realtime.tools` แบบกำหนดเองไปยังผู้ให้บริการแบบเรียลไทม์                               |

`realtime.consultPolicy` ควบคุมเฉพาะคำสั่งสำหรับโมเดลเรียลไทม์:

| นโยบาย        | คำแนะนำ                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | ใช้พรอมต์เริ่มต้นต่อไป และให้ผู้ให้บริการตัดสินใจว่าเมื่อใดควรเรียกเครื่องมือสำหรับการปรึกษา              |
| `substantive` | ตอบข้อความสนทนาเชื่อมโยงง่าย ๆ โดยตรง และปรึกษาก่อนใช้ข้อเท็จจริง หน่วยความจำ เครื่องมือ หรือบริบท |
| `always`      | ปรึกษาก่อนตอบคำตอบที่มีสาระทุกครั้ง                                                        |

### บริบทเสียงของเอเจนต์

เปิดใช้ `realtime.agentContext` เมื่อบริดจ์เสียงควรให้เสียงเหมือนเอเจนต์
OpenClaw ที่กำหนดค่าไว้ โดยไม่ต้องเสียเวลาเดินทางไปกลับเพื่อปรึกษาเอเจนต์แบบเต็มรูปแบบใน
รอบการสนทนาทั่วไป แคปซูลบริบทจะถูกเพิ่มหนึ่งครั้งเมื่อสร้างเซสชันเรียลไทม์
จึงไม่เพิ่มเวลาแฝงในแต่ละรอบการสนทนา การเรียก
`openclaw_agent_consult` ยังคงเรียกใช้เอเจนต์ OpenClaw แบบเต็มรูปแบบ และควรใช้
สำหรับงานที่ใช้เครื่องมือ ข้อมูลปัจจุบัน การค้นหาหน่วยความจำ หรือสถานะของพื้นที่ทำงาน

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

### ตัวอย่างผู้ให้บริการแบบเรียลไทม์

<Tabs>
  <Tab title="Google Gemini Live">
    ค่าเริ่มต้น: คีย์ API จาก `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    หรือ `GOOGLE_API_KEY`; โมเดล `gemini-3.1-flash-live-preview`;
    เสียง `Kore` โดย `sessionResumption` และ `contextWindowCompression` เปิดอยู่ตามค่าเริ่มต้น
    สำหรับการโทรที่ยาวนานและเชื่อมต่อใหม่ได้ ใช้ `silenceDurationMs`,
    `startSensitivity` และ `endSensitivity` เพื่อปรับให้ผลัดกันพูดได้รวดเร็วยิ่งขึ้นบน
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
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
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

ดู[ผู้ให้บริการ Google](/th/providers/google) และ
[ผู้ให้บริการ OpenAI](/th/providers/openai) สำหรับตัวเลือกเสียงแบบเรียลไทม์
เฉพาะของผู้ให้บริการ

## การถอดเสียงแบบสตรีม

`streaming` เลือกผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับเสียงการโทรสด

ลักษณะการทำงานของรันไทม์ในปัจจุบัน:

- `streaming.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่มาพร้อมระบบ ได้แก่ Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการแต่ละราย
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ได้รับการยอมรับ Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบเรียลไทม์พร้อมใช้งานแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการใดลงทะเบียนไว้ Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

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
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
    ค่าเริ่มต้น: คีย์ API `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY` (หาก
    ไม่ได้ตั้งค่าทั้งคู่ จะย้อนกลับไปใช้โปรไฟล์การยืนยันตัวตน OAuth ของ xAI); ปลายทาง
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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

Voice Call ใช้การกำหนดค่า `messages.tts` ของแกนหลักสำหรับการสตรีมเสียงพูดใน
การโทร คุณสามารถเขียนทับได้ภายใต้การกำหนดค่าของ Plugin โดยใช้**โครงสร้างเดียวกัน** —
ระบบจะผสานแบบลึกเข้ากับ `messages.tts`

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
**ระบบจะละเว้นเสียงพูดของ Microsoft สำหรับการโทรด้วยเสียง** การสังเคราะห์เสียงผ่านโทรศัพท์ต้องใช้
ผู้ให้บริการที่รองรับเอาต์พุตเป้าหมายสำหรับระบบโทรศัพท์ แต่ผู้ให้บริการเสียงพูดของ Microsoft
ไม่รองรับ ดังนั้นระบบจะข้ามผู้ให้บริการนี้สำหรับการโทรและลองผู้ให้บริการรายอื่นใน
ลำดับการย้อนกลับแทน
</Warning>

หมายเหตุเกี่ยวกับลักษณะการทำงาน:

- `openclaw doctor --fix` จะซ่อมแซมคีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่าของ Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`); การกำหนดค่าที่คอมมิตควรใช้ `tts.providers.<provider>`
- ระบบจะใช้ TTS ของแกนหลักเมื่อเปิดใช้การสตรีมสื่อของ Twilio มิฉะนั้นการโทรจะย้อนกลับไปใช้เสียงที่ผู้ให้บริการรองรับโดยตรง
- หากสตรีมสื่อของ Twilio ทำงานอยู่แล้ว Voice Call จะไม่ย้อนกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับระบบโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นเสียงสองเส้นทางเข้าด้วยกัน
- เมื่อ TTS สำหรับระบบโทรศัพท์ย้อนกลับไปใช้ผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมลำดับผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อใช้แก้ไขข้อบกพร่อง
- เมื่อการแทรกเสียงของผู้โทรหรือการยุติสตรีมของ Twilio ล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่อยู่ในคิวจะได้รับการยุติสถานะ แทนที่จะค้างและทำให้ผู้โทรรอการเล่นเสียงเสร็จสิ้น

### ตัวอย่าง TTS

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นกลไกคัดกรองหมายเลขผู้โทรที่มีระดับความน่าเชื่อถือต่ำ Plugin
จะปรับค่า `From` ที่ผู้ให้บริการส่งมาให้อยู่ในรูปแบบมาตรฐาน แล้วนำไปเปรียบเทียบกับ `allowFrom`
การตรวจสอบ Webhook จะยืนยันว่าการส่งมาจากผู้ให้บริการจริงและเพย์โหลดไม่ถูกแก้ไข
แต่ **ไม่ได้** พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร PSTN/VoIP ให้ถือว่า
`allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่การยืนยันตัวตนผู้โทรที่รัดกุม
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งได้ด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางตามหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งรายการรับสายจากหมายเลขโทรศัพท์หลายหมายเลข
และแต่ละหมายเลขควรทำงานเสมือนเป็นคนละสาย ตัวอย่างเช่น
หมายเลขหนึ่งสามารถใช้ผู้ช่วยส่วนตัวที่มีลักษณะเป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิกทางธุรกิจ
เอเจนต์ตอบกลับคนละตัว และเสียง TTS คนละเสียง

ระบบจะเลือกเส้นทางจากหมายเลข `To` ที่ถูกโทรซึ่งผู้ให้บริการส่งมา คีย์ต้องเป็น
หมายเลขรูปแบบ E.164 เมื่อมีสายเข้า Voice Call จะค้นหาเส้นทางที่ตรงกันหนึ่งครั้ง
จัดเก็บเส้นทางที่ตรงกันไว้ในระเบียนการโทร และนำการกำหนดค่าที่มีผลนั้นกลับมาใช้กับ
ข้อความทักทาย เส้นทางตอบกลับอัตโนมัติแบบดั้งเดิม เส้นทางปรึกษาแบบเรียลไทม์
และการเล่นเสียง TTS หากไม่มีเส้นทางที่ตรงกัน ระบบจะใช้การกำหนดค่า Voice Call ส่วนกลาง
สายโทรออกจะไม่ใช้ `numbers`; ให้ส่งเป้าหมายขาออก ข้อความ และเซสชัน
อย่างชัดเจนเมื่อเริ่มการโทร

ปัจจุบันการแทนที่ค่าของเส้นทางรองรับ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่า `tts` ของเส้นทางจะผสานแบบลึกทับการกำหนดค่า `tts` ส่วนกลางของ Voice Call ดังนั้น
โดยทั่วไปคุณสามารถแทนที่เฉพาะเสียงของผู้ให้บริการได้:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### ข้อตกลงเอาต์พุตคำพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะเพิ่มข้อตกลงเอาต์พุตคำพูดที่เข้มงวดต่อท้าย
พรอมต์ระบบ โดยกำหนดให้ตอบกลับเป็น JSON รูปแบบ `{"spoken":"..."}` Voice Call
จะแยกข้อความสำหรับพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ระบุว่าเป็นเนื้อหาการให้เหตุผลหรือข้อผิดพลาด
- แยกวิเคราะห์ JSON โดยตรง, JSON ในกรอบโค้ด หรือคีย์ `"spoken"` แบบอินไลน์
- หากไม่สำเร็จ จะใช้ข้อความธรรมดาและลบย่อหน้านำที่มีแนวโน้มเป็นการวางแผนหรือข้อความเมตา

วิธีนี้ทำให้เสียงที่เล่นเน้นเฉพาะข้อความสำหรับผู้โทร
และหลีกเลี่ยงการรั่วไหลของข้อความการวางแผนเข้าไปในเสียง

### ลักษณะการทำงานเมื่อเริ่มการสนทนา

สำหรับสายโทรออกแบบ `conversation` การจัดการข้อความแรกจะผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิวเมื่อผู้โทรพูดแทรกและการตอบกลับอัตโนมัติจะถูกระงับเฉพาะช่วงที่ข้อความทักทายเริ่มต้นกำลังถูกพูดอยู่เท่านั้น
- หากการเล่นเสียงเริ่มต้นล้มเหลว สายจะกลับสู่สถานะ `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อรอลองใหม่
- การเล่นเสียงเริ่มต้นสำหรับการสตรีม Twilio จะเริ่มเมื่อเชื่อมต่อสตรีมโดยไม่มีความล่าช้าเพิ่มเติม
- การพูดแทรกจะยกเลิกการเล่นเสียงที่กำลังทำงานและล้างรายการ TTS ของ Twilio ที่อยู่ในคิวแต่ยังไม่ได้เล่น รายการที่ถูกล้างจะเสร็จสิ้นด้วยสถานะข้าม เพื่อให้ตรรกะการตอบกลับถัดไปดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาด้วยเสียงแบบเรียลไทม์จะใช้รอบเปิดการสนทนาของสตรีมเรียลไทม์เอง Voice Call จะ **ไม่** ส่งการอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความเริ่มต้นนั้น เพื่อให้เซสชันขาออก `<Connect><Stream>` ยังคงเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อของ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 มิลลิวินาที**
ก่อนสิ้นสุดสายโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ภายในช่วงเวลาดังกล่าว การสิ้นสุดอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังช่วงผ่อนผัน สายจะสิ้นสุดเพื่อป้องกันสายที่ยังคงค้างอยู่ในสถานะใช้งาน

## ตัวเก็บกวาดสายที่ค้าง

ใช้ `staleCallReaperSeconds` (ค่าเริ่มต้น **120**) เพื่อสิ้นสุดสายที่ไม่เคยมีผู้รับ
และไม่เคยเข้าสู่สถานะการสนทนาสด เช่น สายโหมดแจ้งเตือน
ที่ผู้ให้บริการไม่เคยส่ง Webhook สถานะสิ้นสุด ตั้งค่าเป็น `0` เพื่อ
ปิดใช้งาน

ตัวเก็บกวาดจะทำงานทุก 30 วินาที และจะสิ้นสุดเฉพาะสายที่ไม่มี
การประทับเวลา `answeredAt` และยังไม่อยู่ในสถานะสิ้นสุดหรือสถานะสด
(`speaking`/`listening`) ดังนั้นการสนทนาที่รับสายแล้วจะไม่ถูกตัวจับเวลานี้เก็บกวาด
ส่วน `maxDurationSeconds` (ค่าเริ่มต้น 300) เป็นขีดจำกัดแยกต่างหากที่
สิ้นสุดสายที่รับแล้วแต่ดำเนินต่อเป็นเวลานานเกินไป

สำหรับโฟลว์แบบแจ้งเตือนซึ่งผู้ให้บริการเครือข่ายอาจส่ง Webhook การเรียกเข้า/รับสายได้ช้า
ให้เพิ่ม `staleCallReaperSeconds` ให้สูงกว่าค่าเริ่มต้น เพื่อไม่ให้
สายที่ช้าแต่ยังเป็นปกติถูกเก็บกวาดก่อนเวลา ช่วง `120`-`300` วินาทีเป็นช่วงที่เหมาะสม
สำหรับระบบใช้งานจริง

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

เมื่อมีพร็อกซีหรือทักเนลอยู่หน้า Gateway Plugin จะสร้าง
URL สาธารณะขึ้นใหม่เพื่อใช้ตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่า
จะเชื่อถือส่วนหัวที่ส่งต่อใดบ้าง:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  รายการโฮสต์ที่อนุญาตจากส่วนหัวการส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือส่วนหัวที่ส่งต่อโดยไม่ต้องมีรายการอนุญาต
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือส่วนหัวที่ส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการส่งซ้ำ** ของ Webhook สำหรับ Twilio, Telnyx และ Plivo คำขอ Webhook ที่ถูกต้องแต่ส่งซ้ำจะได้รับการตอบรับ แต่จะข้ามผลข้างเคียง
- แต่ละรอบการสนทนาของ Twilio มีโทเค็นประจำรอบในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กคำพูดที่เก่าหรือถูกส่งซ้ำจะไม่สามารถตอบสนองรอบทรานสคริปต์ใหม่กว่าที่กำลังรออยู่ได้
- คำขอ Webhook ที่ไม่ได้รับการยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านเนื้อหา เมื่อไม่มีส่วนหัวลายเซ็นที่ผู้ให้บริการกำหนด
- Webhook ของ voice-call ใช้โปรไฟล์การอ่านเนื้อหาก่อนยืนยันตัวตนที่ใช้ร่วมกัน (เนื้อหาสูงสุด 64 KB, หมดเวลาอ่าน 5 วินาที) พร้อมขีดจำกัดคำขอที่กำลังประมวลผลต่อคีย์ (ค่าเริ่มต้น 8 คำขอพร้อมกันต่อคีย์) ก่อนตรวจสอบลายเซ็น

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
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

เมื่อ Gateway ทำงานอยู่แล้ว คำสั่งดำเนินงาน `voicecall`
จะมอบหมายให้รันไทม์ voice-call ที่ Gateway เป็นเจ้าของ เพื่อไม่ให้ CLI ผูกกับ
เซิร์ฟเวอร์ Webhook ตัวที่สอง หากไม่สามารถเข้าถึง Gateway ได้ คำสั่งจะสลับไปใช้
รันไทม์ CLI แบบสแตนด์อโลน

`latency` อ่าน `calls.jsonl` จากเส้นทางจัดเก็บเริ่มต้นของ voice-call ใช้
`--file <path>` เพื่อชี้ไปยังบันทึกอื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ไว้ที่ระเบียน N รายการล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตประกอบด้วยค่าต่ำสุด/สูงสุด/เฉลี่ย,
p50 และ p95 สำหรับเวลาแฝงของแต่ละรอบและเวลารอการฟัง

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `voice_call`

| การดำเนินการ    | อาร์กิวเมนต์                               |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call มาพร้อม Skills สำหรับเอเจนต์ที่สอดคล้องกัน

## RPC ของ Gateway

| เมธอด                      | อาร์กิวเมนต์                                                     | หมายเหตุ                                                                 |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | สลับไปใช้การกำหนดค่า `toNumber` เมื่อไม่ระบุ `to`                        |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | เหมือนกับ `initiate` แต่รองรับ `dtmfSequence` ก่อนเชื่อมต่อด้วย           |
| `voicecall.continue`        | `callId`, `message`                                              | บล็อกจนกว่ารอบจะเสร็จสิ้น และส่งคืนทรานสคริปต์                           |
| `voicecall.continue.start`  | `callId`, `message`                                              | รูปแบบอะซิงโครนัส: ส่งคืน `operationId` ทันที                            |
| `voicecall.continue.result` | `operationId`                                                    | สำรวจการดำเนินการ `voicecall.continue.start` ที่กำลังรอเพื่อรับผลลัพธ์   |
| `voicecall.speak`           | `callId`, `message`                                              | พูดโดยไม่รอ และใช้บริดจ์เรียลไทม์เมื่อเปิด `realtime.enabled`            |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | ไม่ต้องระบุ `callId` หากต้องการแสดงสายที่กำลังใช้งานทั้งหมด              |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"`; สายในโหมดแจ้งเตือน
ควรใช้ `voicecall.dtmf` หลังจากสร้างสายแล้ว หากต้องส่งตัวเลขหลังเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าการเปิดเผย Webhook ล้มเหลว

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่รัน Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo` สถานะ `webhook-exposure` ต้องเป็นสีเขียว
`publicUrl` ที่กำหนดค่าไว้จะยังคงล้มเหลวเมื่อชี้ไปยังพื้นที่เครือข่ายภายในหรือส่วนตัว
เพราะผู้ให้บริการเครือข่ายไม่สามารถเรียกกลับเข้ามายังที่อยู่เหล่านั้นได้
อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` หรือช่วง NAT
ระดับผู้ให้บริการเครือข่ายอื่นเป็น `publicUrl`

สายโทรออกในโหมดแจ้งเตือนของ Twilio จะส่ง TwiML `<Say>` เริ่มต้น
โดยตรงในคำขอสร้างสาย ดังนั้นข้อความเสียงแรกจึงไม่ต้องพึ่งพา
การที่ Twilio ดึง TwiML จาก Webhook แต่ยังคงต้องมี Webhook สาธารณะสำหรับคอลแบ็กสถานะ
สายสนทนา DTMF ก่อนเชื่อมต่อ สตรีมเรียลไทม์ และ
การควบคุมสายหลังเชื่อมต่อ

ใช้ช่องทางเปิดเผยสาธารณะเพียงช่องทางเดียว:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

หลังเปลี่ยนการกำหนดค่า ให้เริ่มใหม่หรือโหลด Gateway ใหม่ จากนั้นเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการทดลองทำงานโดยไม่มีผลจริง เว้นแต่คุณจะส่ง `--yes`

### ข้อมูลประจำตัวของผู้ให้บริการใช้งานไม่ได้

ตรวจสอบผู้ให้บริการที่เลือกและช่องข้อมูลประจำตัวที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber` หรือ `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` และ
  `TELNYX_PUBLIC_KEY`
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber` หรือ
  `PLIVO_AUTH_ID` และ `PLIVO_AUTH_TOKEN`

ข้อมูลประจำตัวต้องอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ในเครื่อง
จะไม่มีผลต่อ Gateway ที่กำลังทำงานอยู่ จนกว่าจะรีสตาร์ตหรือโหลด
สภาพแวดล้อมใหม่

### เริ่มการโทรได้ แต่ Webhook จากผู้ให้บริการมาไม่ถึง

ยืนยันว่าคอนโซลของผู้ให้บริการชี้ไปยัง URL สาธารณะของ Webhook ที่ถูกต้องทุกประการ:

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

- `publicUrl` ชี้ไปยังพาธที่แตกต่างจาก `serve.path`
- URL ของทันเนลเปลี่ยนไปหลังจาก Gateway เริ่มทำงาน
- พร็อกซีส่งต่อคำขอ แต่ลบหรือเขียนส่วนหัวโฮสต์/โปรโตคอลใหม่
- ไฟร์วอลล์หรือ DNS กำหนดเส้นทางชื่อโฮสต์สาธารณะไปยังตำแหน่งอื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้ Plugin Voice Call

เมื่อมีรีเวิร์สพร็อกซีหรือทันเนลอยู่หน้า Gateway ให้ตั้งค่า
`webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้
`webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่ทราบแน่นอน ใช้
`webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตของพร็อกซี
อยู่ภายใต้การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจสอบกับ URL สาธารณะที่ OpenClaw สร้างขึ้นใหม่
จากคำขอขาเข้า หากการตรวจสอบลายเซ็นล้มเหลว:

- ยืนยันว่า URL ของ Webhook ฝั่งผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึงรูปแบบ โฮสต์ และพาธ
- สำหรับ URL ระดับฟรีของ ngrok ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ของทันเนลเปลี่ยน
- ตรวจสอบให้แน่ใจว่าพร็อกซีคงส่วนหัวโฮสต์และโปรโตคอลเดิมไว้ หรือกำหนดค่า `webhookSecurity.allowedHosts`
- อย่าเปิดใช้ `skipSignatureVerification` นอกเหนือจากการทดสอบในเครื่อง

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้เพื่อเข้าร่วมผ่านหมายเลขโทรเข้าของ Twilio ขั้นแรกให้ตรวจสอบ Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบการขนส่งของ Google Meet อย่างชัดเจน:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call ทำงานปกติ แต่ผู้เข้าร่วม Meet ไม่เข้าร่วม ให้ตรวจสอบหมายเลข
โทรเข้าของ Meet, PIN และ `--dtmf-sequence` สายโทรศัพท์อาจทำงานปกติ
ในขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet เริ่มต้นช่วงการโทรผ่านโทรศัพท์ของ Twilio ด้วย `voicecall.start` พร้อม
ลำดับ DTMF ก่อนเชื่อมต่อ ลำดับที่สร้างจาก PIN จะรวม
`voiceCall.dtmfDelayMs` ของ Plugin Google Meet (ค่าเริ่มต้น **12000 ms**) เป็นเลขรอของ Twilio
ที่นำหน้าลำดับ เนื่องจากข้อความแจ้งสำหรับการโทรเข้า Meet อาจมาช้า จากนั้น Voice Call
จะเปลี่ยนเส้นทางกลับไปยังการจัดการแบบเรียลไทม์ ก่อนมีการร้องขอคำทักทายแนะนำ

ใช้ `openclaw logs --follow` เพื่อติดตามเฟสแบบสด การเข้าร่วม Meet ผ่าน Twilio
ที่ทำงานปกติจะบันทึกลำดับดังนี้:

- Google Meet มอบหมายการเข้าร่วมผ่าน Twilio ให้ Voice Call
- Voice Call จัดเก็บ TwiML สำหรับ DTMF ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้และให้บริการก่อนการจัดการแบบเรียลไทม์
- Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับสาย Twilio
- Google Meet ร้องขอเสียงพูดแนะนำด้วย `voicecall.speak` หลังพ้นระยะหน่วงหลัง DTMF

`openclaw voicecall tail` ยังคงแสดงระเบียนการโทรที่บันทึกถาวร ซึ่งมีประโยชน์สำหรับ
สถานะการโทรและข้อความถอดเสียง แต่การเปลี่ยนผ่านของ Webhook/แบบเรียลไทม์
ไม่ได้ปรากฏที่นั่นทุกครั้ง

### สายแบบเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้งานโหมดเสียงเพียงโหมดเดียว: `realtime.enabled` และ
`streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับสาย Twilio/Telnyx แบบเรียลไทม์ ให้ตรวจสอบเพิ่มเติมว่า:

- Plugin ผู้ให้บริการแบบเรียลไทม์ถูกโหลดและลงทะเบียนแล้ว
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับโพรเซส Gateway
- `openclaw logs --follow` แสดงว่า TwiML แบบเรียลไทม์ถูกให้บริการ บริดจ์แบบเรียลไทม์เริ่มทำงาน และคำทักทายเริ่มต้นถูกเพิ่มเข้าคิวแล้ว

## เนื้อหาที่เกี่ยวข้อง

- [โหมดสนทนา](/th/nodes/talk)
- [การแปลงข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
