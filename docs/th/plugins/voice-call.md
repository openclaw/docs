---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายเรียกเข้าแบบเสียงผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-06-27T18:09:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก,
การสนทนาหลายรอบ, เสียงเรียลไทม์แบบฟูลดูเพล็กซ์, การถอดเสียงแบบสตรีมมิง,
และสายเรียกเข้าพร้อมนโยบายรายการที่อนุญาต

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (พัฒนา/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในโปรเซส Gateway** หากคุณใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่รัน
Gateway แล้วรีสตาร์ท Gateway เพื่อโหลด Plugin
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    ใช้แพ็กเกจเปล่าเพื่อตามแท็กรุ่นทางการปัจจุบัน ปักหมุด
    เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

    หลังจากนั้นให้รีสตาร์ท Gateway เพื่อให้ Plugin โหลด

  </Step>
  <Step title="Configure provider and webhook">
    ตั้งค่าการกำหนดค่าภายใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับรูปแบบเต็ม) อย่างน้อยต้องมี:
    `provider`, ข้อมูลประจำตัวของผู้ให้บริการ, `fromNumber`, และ URL Webhook
    ที่เข้าถึงได้แบบสาธารณะ
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบ
    การเปิดใช้งาน Plugin, ข้อมูลประจำตัวของผู้ให้บริการ, การเปิดเผย Webhook,
    และยืนยันว่ามีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ทำงานอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็นการรันแบบไม่ดำเนินการจริงโดยค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทร
    แจ้งเตือนขาออกสั้น ๆ จริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้องแปลงได้เป็น **URL Webhook สาธารณะ**
หาก `publicUrl`, URL อุโมงค์, URL Tailscale หรือ fallback ของการเสิร์ฟ
แปลงได้เป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลประจำตัว
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่าไม่สมบูรณ์พร้อมคีย์ที่ขาดหายไป และ
ข้ามการเริ่มรันไทม์ คำสั่ง, การเรียก RPC และเครื่องมือเอเจนต์ยังคง
ส่งคืนการกำหนดค่าผู้ให้บริการที่ขาดหายไปอย่างตรงตามจริงเมื่อใช้งาน

<Note>
ข้อมูลประจำตัว Voice Call รองรับ SecretRefs `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะแปลงผ่านพื้นผิว SecretRef มาตรฐาน; ดู [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
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
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx และ Plivo ทั้งหมดต้องใช้ URL Webhook ที่ **เข้าถึงได้แบบสาธารณะ**
    - `mock` เป็นผู้ให้บริการสำหรับการพัฒนาในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` เป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
    - ในระดับฟรีของ ngrok ให้ตั้ง `publicUrl` เป็น URL ngrok ที่แน่นอน; การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (เอเจนต์ ngrok ในเครื่อง) ใช้สำหรับการพัฒนาในเครื่องเท่านั้น
    - URL ระดับฟรีของ Ngrok อาจเปลี่ยนหรือเพิ่มพฤติกรรมหน้าแทรกคั่นได้; หาก `publicUrl` เคลื่อน ค่า signature ของ Twilio จะล้มเหลว โปรดักชัน: ควรใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนรวมของซ็อกเก็ตก่อนเริ่มต้นที่ยังไม่ได้ยืนยันตัวตน
    - `streaming.maxPendingConnectionsPerIp` จำกัดซ็อกเก็ตก่อนเริ่มต้นที่ยังไม่ได้ยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนรวมของซ็อกเก็ตสตรีมสื่อที่เปิดอยู่ (รอดำเนินการ + ทำงานอยู่)

  </Accordion>
  <Accordion title="Legacy config migrations">
    การกำหนดค่าเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    `streaming.*` แบบเดิมจะถูกเขียนใหม่โดย `openclaw doctor --fix`
    Runtime fallback ยังคงยอมรับคีย์ voice-call เก่าอยู่ในตอนนี้ แต่
    เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และชิมความเข้ากันได้เป็น
    ชั่วคราว

    คีย์สตรีมมิงที่ย้ายโดยอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

โดยค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้สายที่โทรซ้ำจาก
ผู้โทรคนเดิมยังคงหน่วยความจำการสนทนาไว้ ตั้ง `sessionScope: "per-call"` เมื่อ
การโทรจากผู้ให้บริการแต่ละครั้งควรเริ่มด้วยบริบทใหม่ เช่น งานรับสาย,
การจอง, IVR หรือโฟลว์สะพาน Google Meet ที่หมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมคนละครั้ง

Voice Call เก็บคีย์เซสชันที่สร้างขึ้นภายใต้ namespace ของเอเจนต์ที่กำหนดค่าไว้
(`agent:<agentId>:voice:*`) เพื่อให้หน่วยความจำการโทรอยู่รอดหลังการทำ canonicalization
คีย์เซสชันของ Gateway หลังรีสตาร์ท คีย์การผสานรวมแบบระบุชัดดิบใช้
namespace เอเจนต์เดียวกัน คีย์ `agent:<configuredAgentId>:*` แบบ canonical จะคงเจ้าของนั้นไว้
และ alias หลักของคีย์นั้นเคารพ `session.mainKey` ของ core และขอบเขต global อินพุต `agent:*`
ที่เป็นของต่างเอเจนต์หรือผิดรูปแบบจะถูกกำหนดขอบเขตเป็นคีย์ทึบภายใต้เอเจนต์ที่กำหนดค่าไว้;
`global` และ `unknown` ยังคงเป็น sentinel แบบ global การเริ่มต้น Gateway จะยกระดับคีย์ดิบเก่า
ใน store เริ่มต้นหรือ store ที่ templated ด้วย `{agentId}` เมื่อ path พิสูจน์เจ้าของหนึ่งราย
ใน store กำหนดเองแบบตายตัว แถว legacy ที่กำกวมจะไม่ถูกแตะต้องเพราะ
ไม่มีข้อมูลเพียงพอให้เลือกเจ้าของ; สายใหม่ใช้ประวัติแบบ canonical ที่กำหนดขอบเขตตามเอเจนต์

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์แบบฟูลดูเพล็กซ์สำหรับเสียงการโทรสด
ซึ่งแยกจาก `streaming` ที่เพียงส่งต่อเสียงไปยังผู้ให้บริการถอดเสียง
แบบเรียลไทม์

<Warning>
`realtime.enabled` ใช้ร่วมกับ `streaming.enabled` ไม่ได้ เลือก
โหมดเสียงหนึ่งโหมดต่อการโทร
</Warning>

พฤติกรรมรันไทม์ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงเรียลไทม์ที่รวมมาให้: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ `openclaw_agent_consult` แบบใช้ร่วมกันโดยค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.consultPolicy` เพิ่มคำแนะนำเพิ่มเติมได้ว่าโมเดลเรียลไทม์ควรเรียก `openclaw_agent_consult` เมื่อใด
- `realtime.agentContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้งาน Voice Call จะฉีดตัวตนเอเจนต์แบบมีขอบเขตและแคปซูลไฟล์ workspace ที่เลือกไว้เข้าไปในคำสั่งของผู้ให้บริการเรียลไทม์ตอนตั้งค่าเซสชัน
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้งาน Voice Call จะค้นหาหน่วยความจำ/บริบทเซสชันที่จัดทำดัชนีไว้สำหรับคำถาม consult ก่อน และส่งคืน snippet เหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยังเอเจนต์ consult เต็มรูปแบบเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงเรียลไทม์ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult ใช้เซสชันการโทรที่เก็บไว้ซ้ำเมื่อมี จากนั้น fallback ไปยัง `sessionScope` ที่กำหนดค่าไว้ (`per-phone` โดยค่าเริ่มต้น หรือ `per-call` สำหรับสายที่แยกกัน)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติให้ใช้ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือเอเจนต์ตามปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือ consult `realtime.tools` ที่กำหนดเองยังคงถูกส่งผ่านไปยังผู้ให้บริการเรียลไทม์                               |

`realtime.consultPolicy` ควบคุมเฉพาะคำสั่งของโมเดลเรียลไทม์:

| นโยบาย        | คำแนะนำ                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | คงพรอมป์เริ่มต้นไว้และให้ผู้ให้บริการตัดสินใจว่าจะเรียกเครื่องมือ consult เมื่อใด              |
| `substantive` | ตอบส่วนเชื่อมบทสนทนาง่าย ๆ โดยตรง และ consult ก่อนข้อเท็จจริง, หน่วยความจำ, เครื่องมือ หรือบริบท |
| `always`      | consult ก่อนคำตอบที่มีสาระทุกครั้ง                                                        |

### บริบทเสียงของเอเจนต์

เปิดใช้ `realtime.agentContext` เมื่อสะพานเสียงควรฟังดูเหมือนเอเจนต์ OpenClaw
ที่กำหนดค่าไว้ โดยไม่ต้องเสียรอบไป-กลับแบบ consult กับเอเจนต์เต็มรูปแบบ
ในเทิร์นทั่วไป แคปซูลบริบทจะถูกเพิ่มหนึ่งครั้งเมื่อสร้างเซสชันเรียลไทม์
จึงไม่เพิ่มเวลาแฝงต่อเทิร์น การเรียก
`openclaw_agent_consult` ยังคงรันเอเจนต์ OpenClaw เต็มรูปแบบ และควรใช้
สำหรับงานเครื่องมือ ข้อมูลปัจจุบัน การค้นคืนหน่วยความจำ หรือสถานะเวิร์กสเปซ

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
    ค่าเริ่มต้น: คีย์ API จาก `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` หรือ `GOOGLE_GENERATIVE_AI_API_KEY`; โมเดล
    `gemini-2.5-flash-native-audio-preview-12-2025`; เสียง `Kore`
    `sessionResumption` และ `contextWindowCompression` เปิดเป็นค่าเริ่มต้นสำหรับการโทรที่ยาวขึ้น
    และเชื่อมต่อใหม่ได้ ใช้ `silenceDurationMs`, `startSensitivity` และ
    `endSensitivity` เพื่อปรับจังหวะผลัดกันพูดให้เร็วขึ้นบนเสียงโทรศัพท์

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
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
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

ดู [ผู้ให้บริการ Google](/th/providers/google) และ
[ผู้ให้บริการ OpenAI](/th/providers/openai) สำหรับตัวเลือกเสียงเรียลไทม์
เฉพาะผู้ให้บริการ

## การถอดเสียงแบบสตรีมมิง

`streaming` เลือกผู้ให้บริการถอดเสียงเรียลไทม์สำหรับเสียงการโทรสด

พฤติกรรมรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือกเสริม หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงเรียลไทม์ที่รวมมาให้: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงเรียลไทม์พร้อมแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการใดลงทะเบียน Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อ แทนที่จะทำให้ทั้ง Plugin ล้มเหลว

### ตัวอย่างผู้ให้บริการสตรีมมิง

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
    ค่าเริ่มต้น: คีย์ API `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY`;
    เอนด์พอยต์ `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราตัวอย่าง `8000`;
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

Voice Call ใช้การกำหนดค่า `messages.tts` หลักสำหรับการสตรีม
เสียงพูดในการโทร คุณสามารถแทนที่ได้ภายใต้การกำหนดค่า Plugin ด้วย
**รูปแบบเดียวกัน** ซึ่งจะผสานเชิงลึกกับ `messages.tts`

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
**เสียงพูดของ Microsoft จะถูกละเว้นสำหรับการโทรเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
ทรานสปอร์ต Microsoft ปัจจุบันไม่ได้เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมโดย `openclaw doctor --fix`; การกำหนดค่าที่คอมมิตควรใช้ `tts.providers.<provider>`
- จะใช้ TTS หลักเมื่อเปิดใช้งานการสตรีมสื่อ Twilio; มิฉะนั้นการโทรจะถอยกลับไปใช้เสียงดั้งเดิมของผู้ให้บริการ
- หากสตรีมสื่อ Twilio เปิดใช้งานอยู่แล้ว Voice Call จะไม่ถอยกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนการผสมเส้นทางเล่นเสียงสองเส้นทาง
- เมื่อ TTS สำหรับโทรศัพท์ถอยกลับไปยังผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมเชนผู้ให้บริการ (`from`, `to`, `attempts`) สำหรับการดีบัก
- เมื่อการแทรกพูดของ Twilio หรือการรื้อถอนสตรีมล้างคิว TTS ที่ค้างอยู่ คำขอเล่นเสียงที่อยู่ในคิวจะถูกสรุปผลแทนที่จะค้างผู้โทรที่รอให้การเล่นเสียงเสร็จสิ้น

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

## การโทรขาเข้า

นโยบายขาเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้การโทรขาเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรองหมายเลขผู้โทรที่มีความเชื่อมั่นต่ำ
Plugin จะปรับค่า `From` ที่ผู้ให้บริการส่งมาให้อยู่ในรูปแบบมาตรฐาน และเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook ยืนยันตัวตนการส่งจากผู้ให้บริการและ
ความครบถ้วนของเพย์โหลด แต่ **ไม่ได้** พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ปฏิบัติต่อ `allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่อัตลักษณ์ผู้โทรที่เข้มแข็ง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางรายหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งตัวรับสายสำหรับหมายเลขโทรศัพท์หลายหมายเลข
และแต่ละหมายเลขควรทำงานเหมือนสายที่ต่างกัน ตัวอย่างเช่น หมายเลขหนึ่ง
สามารถใช้ผู้ช่วยส่วนตัวโทนเป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิกธุรกิจ
เอเจนต์ตอบกลับที่ต่างกัน และเสียง TTS ที่ต่างกัน

เส้นทางจะถูกเลือกจากหมายเลข `To` ที่โทรเข้าและผู้ให้บริการส่งมา คีย์ต้องเป็น
หมายเลข E.164 เมื่อมีสายเข้า Voice Call จะ resolve เส้นทางที่ตรงกันหนึ่งครั้ง
เก็บเส้นทางที่ตรงกันไว้ในระเบียนการโทร และใช้การกำหนดค่าที่มีผลนั้นซ้ำ
สำหรับคำทักทาย เส้นทางตอบกลับอัตโนมัติแบบคลาสสิก เส้นทาง consult แบบเรียลไทม์ และการเล่นเสียง TTS
หากไม่มีเส้นทางใดตรงกัน จะใช้การกำหนดค่า Voice Call ส่วนกลาง
การโทรขาออกไม่ใช้ `numbers`; ให้ส่งเป้าหมายขาออก ข้อความ และ
เซสชันอย่างชัดเจนเมื่อเริ่มการโทร

การแทนที่เส้นทางรองรับในปัจจุบัน:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่าเส้นทาง `tts` จะผสานเชิงลึกทับการกำหนดค่า Voice Call `tts` ส่วนกลาง ดังนั้น
โดยปกติคุณสามารถแทนที่เฉพาะเสียงของผู้ให้บริการได้:

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

### สัญญาเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตเสียงพูดที่เข้มงวดเข้ากับ
พรอมป์ระบบ:

```text
{"spoken":"..."}
```

Voice Call ดึงข้อความเสียงพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ทำเครื่องหมายว่าเป็นเนื้อหาการให้เหตุผล/ข้อผิดพลาด
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน fenced block หรือคีย์ `"spoken"` แบบอินไลน์
- ถอยกลับไปใช้ข้อความธรรมดา และลบย่อหน้าเกริ่นนำที่น่าจะเป็นการวางแผน/เมตา

สิ่งนี้ช่วยให้การเล่นเสียงพูดมุ่งเน้นที่ข้อความสำหรับผู้โทร และหลีกเลี่ยง
การรั่วข้อความวางแผนลงในเสียง

### พฤติกรรมเริ่มต้นการสนทนา

สำหรับการโทร `conversation` ขาออก การจัดการข้อความแรกจะผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิวเมื่อแทรกพูดและการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายแรกกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงแรกเริ่มล้มเหลว การโทรจะกลับไปที่ `listening` และข้อความแรกเริ่มยังคงอยู่ในคิวเพื่อรอลองใหม่
- การเล่นเสียงแรกเริ่มสำหรับการสตรีม Twilio เริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีความล่าช้าเพิ่มเติม
- การแทรกพูดจะยกเลิกการเล่นเสียงที่กำลังทำงานและล้างรายการ Twilio TTS ที่อยู่ในคิวแต่ยังไม่ได้เริ่มเล่น รายการที่ล้างแล้วจะ resolve เป็นถูกข้าม ดังนั้นตรรกะการตอบกลับถัดไปจึงดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาด้วยเสียงเรียลไทม์ใช้เทิร์นเปิดของสตรีมเรียลไทม์เอง Voice Call **ไม่** โพสต์การอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความแรกเริ่มนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจึงยังคงเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อตัดการเชื่อมต่อสตรีม Twilio

เมื่อสตรีมสื่อของ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
สิ้นสุดการโทรโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ภายในช่วงเวลานั้น การสิ้นสุดอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังพ้นช่วงผ่อนผัน การโทรจะถูกสิ้นสุดเพื่อป้องกันไม่ให้มีสายที่ยังใช้งานค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อสิ้นสุดสายที่ไม่เคยได้รับ Webhook ปลายทาง
เช่น สายโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์ ค่าเริ่มต้นคือ `0` (ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
- ตั้งค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติจบได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## ความปลอดภัยของ Webhook

เมื่อมีพร็อกซีหรืออุโมงค์อยู่หน้า Gateway, Plugin
จะประกอบ URL สาธารณะขึ้นใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้
ควบคุมว่าเฮดเดอร์ที่ส่งต่อใดเชื่อถือได้:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  รายการอนุญาตของโฮสต์จากเฮดเดอร์การส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือเฮดเดอร์ที่ส่งต่อโดยไม่ต้องมีรายการอนุญาต
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือเฮดเดอร์ที่ส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องแต่ถูกเล่นซ้ำจะได้รับการตอบรับ แต่จะข้ามผลข้างเคียง
- เทิร์นการสนทนาของ Twilio มีโทเค็นต่อเทิร์นในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กคำพูดที่ค้างหรือถูกเล่นซ้ำจะไม่สามารถตอบสนองเทิร์นถอดเสียงที่รอดำเนินการใหม่กว่าได้
- คำขอ Webhook ที่ไม่ผ่านการยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านบอดี เมื่อเฮดเดอร์ลายเซ็นที่ผู้ให้บริการต้องการขาดหาย
- Webhook ของ voice-call ใช้โปรไฟล์บอดีก่อนยืนยันตัวตนแบบใช้ร่วมกัน (64 KB / 5 วินาที) พร้อมขีดจำกัดคำขอที่กำลังดำเนินการต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างที่มีโฮสต์สาธารณะคงที่:

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

เมื่อ Gateway ทำงานอยู่แล้ว คำสั่ง `voicecall` เชิงปฏิบัติการจะมอบหมายงาน
ให้รันไทม์ voice-call ที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ผูกเซิร์ฟเวอร์
Webhook ตัวที่สอง หากเข้าถึง Gateway ไม่ได้ คำสั่งจะถอยไปใช้
รันไทม์ CLI แบบสแตนด์อโลน

`latency` อ่าน `calls.jsonl` จากพาธพื้นที่จัดเก็บ voice-call เริ่มต้น
ใช้ `--file <path>` เพื่อชี้ไปยังบันทึกอื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ให้เหลือ N ระเบียนสุดท้าย (ค่าเริ่มต้น 200) เอาต์พุตมี p50/p90/p99
สำหรับเวลาแฝงของเทิร์นและเวลารอฟัง

## เครื่องมือ Agent

ชื่อเครื่องมือ: `voice_call`

| การกระทำ        | อาร์กิวเมนต์                              |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call มาพร้อมกับ skill ของ Agent ที่ตรงกัน

## Gateway RPC

| เมธอด               | อาร์กิวเมนต์                              |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` เท่านั้น สายในโหมดแจ้งเตือน
ควรใช้ `voicecall.dtmf` หลังจากมีสายแล้ว หากต้องการตัวเลขหลังเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าไม่สามารถเปิดเผย Webhook ได้

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่รัน Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo`, `webhook-exposure` ต้องเป็นสีเขียว
`publicUrl` ที่กำหนดค่าไว้ยังคงล้มเหลวเมื่อชี้ไปยังพื้นที่เครือข่ายท้องถิ่น
หรือส่วนตัว เพราะผู้ให้บริการโทรศัพท์ไม่สามารถเรียกกลับไปยังที่อยู่เหล่านั้นได้
อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

สายโทรออกโหมดแจ้งเตือนของ Twilio ส่ง TwiML `<Say>` เริ่มต้นโดยตรงใน
คำขอสร้างสาย ดังนั้นข้อความพูดแรกจึงไม่ขึ้นกับการที่ Twilio ดึง Webhook TwiML
อย่างไรก็ตาม ยังต้องมี Webhook สาธารณะสำหรับคอลแบ็กสถานะ สายสนทนา DTMF ก่อนเชื่อมต่อ
สตรีมแบบเรียลไทม์ และการควบคุมสายหลังเชื่อมต่อ

ใช้พาธเปิดเผยสาธารณะหนึ่งพาธ:

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

หลังเปลี่ยนการกำหนดค่า ให้รีสตาร์ทหรือโหลด Gateway ใหม่ แล้วเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการทดลองรัน เว้นแต่คุณส่ง `--yes`

### ข้อมูลประจำตัวผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและช่องข้อมูลประจำตัวที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber`
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`

ข้อมูลประจำตัวต้องมีอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ท้องถิ่น
จะไม่ส่งผลต่อ Gateway ที่กำลังทำงานอยู่จนกว่าจะรีสตาร์ทหรือโหลด
สภาพแวดล้อมใหม่

### สายเริ่มต้นได้แต่ Webhook ของผู้ให้บริการไม่มาถึง

ยืนยันว่าคอนโซลผู้ให้บริการชี้ไปยัง URL Webhook สาธารณะที่ถูกต้องตรงกัน:

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

- `publicUrl` ชี้ไปยังพาธที่ต่างจาก `serve.path`
- URL อุโมงค์เปลี่ยนหลังจาก Gateway เริ่มทำงาน
- พร็อกซีส่งต่อคำขอแต่ตัดหรือเขียนเฮดเดอร์ host/proto ใหม่
- ไฟร์วอลล์หรือ DNS ส่งชื่อโฮสต์สาธารณะไปที่อื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ทโดยไม่ได้เปิดใช้ Plugin Voice Call

เมื่อรีเวิร์สพร็อกซีหรืออุโมงค์อยู่หน้า Gateway ให้ตั้งค่า
`webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้
`webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่รู้จัก ใช้
`webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตพร็อกซีอยู่ภายใต้
การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นผู้ให้บริการจะถูกตรวจเทียบกับ URL สาธารณะที่ OpenClaw ประกอบขึ้นใหม่
จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL Webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึง
  สกีมา โฮสต์ และพาธ
- สำหรับ URL ระดับฟรีของ ngrok ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์อุโมงค์เปลี่ยน
- ตรวจสอบให้แน่ใจว่าพร็อกซีคงเฮดเดอร์ host และ proto เดิมไว้ หรือกำหนดค่า
  `webhookSecurity.allowedHosts`
- อย่าเปิดใช้ `skipSignatureVerification` นอกเหนือจากการทดสอบท้องถิ่น

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมแบบโทรเข้า Twilio ก่อนอื่นให้ตรวจสอบ Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบทรานสปอร์ต Google Meet โดยตรง:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบ
หมายเลขโทรเข้า Meet, PIN และ `--dtmf-sequence` สายโทรศัพท์อาจปกติดี
ขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet เริ่มขาโทรศัพท์ Twilio ผ่าน `voicecall.start` พร้อมลำดับ DTMF
ก่อนเชื่อมต่อ ลำดับที่ได้จาก PIN จะรวม `voiceCall.dtmfDelayMs` ของ Plugin
Google Meet เป็นตัวเลขรอของ Twilio นำหน้า ค่าเริ่มต้นคือ 12 วินาที
เพราะพรอมป์โทรเข้าของ Meet อาจมาช้า จากนั้น Voice Call จะเปลี่ยนเส้นทางกลับไปยัง
การจัดการเรียลไทม์ก่อนขอคำทักทายเริ่มต้น

ใช้ `openclaw logs --follow` สำหรับร่องรอยเฟสสด การเข้าร่วม Twilio Meet
ที่ปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้ Voice Call
- Voice Call จัดเก็บ TwiML DTMF ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้และให้บริการก่อนการจัดการเรียลไทม์
- Voice Call ให้บริการ TwiML เรียลไทม์สำหรับสาย Twilio
- Google Meet ขอคำพูดเกริ่นนำด้วย `voicecall.speak` หลังดีเลย์หลัง DTMF

`openclaw voicecall tail` ยังคงแสดงระเบียนสายที่บันทึกถาวรไว้ ซึ่งมีประโยชน์สำหรับ
สถานะสายและบันทึกถอดเสียง แต่ไม่ใช่ทุกการเปลี่ยนผ่านของ Webhook/เรียลไทม์
จะปรากฏที่นั่น

### สายเรียลไทม์ไม่มีคำพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ
`streaming.enabled` ไม่สามารถเป็นจริงพร้อมกันได้

สำหรับสาย Twilio แบบเรียลไทม์ ให้ตรวจสอบเพิ่มเติมว่า:

- มี Plugin ผู้ให้บริการเรียลไทม์โหลดและลงทะเบียนแล้ว
- `realtime.provider` ไม่ได้ตั้งค่า หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับกระบวนการ Gateway
- `openclaw logs --follow` แสดงว่า TwiML เรียลไทม์ถูกให้บริการ บริดจ์เรียลไทม์
  เริ่มทำงาน และคำทักทายเริ่มต้นถูกจัดคิวแล้ว

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [ข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
