---
read_when:
    - คุณต้องการโทรด้วยเสียงขาออกจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin สำหรับการโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายเสียงขาเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-06T09:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก,
การสนทนาแบบหลายรอบ, เสียงเรียลไทม์แบบ full-duplex, การถอดเสียงแบบสตรีมมิง,
และสายเรียกเข้าพร้อมนโยบาย allowlist

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (สำหรับพัฒนา/ไม่มีเครือข่าย)

<Note>
Voice Call plugin ทำงาน **ภายในกระบวนการ Gateway** หากคุณใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่รัน
Gateway จากนั้นรีสตาร์ท Gateway เพื่อโหลด Plugin
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
      <Tab title="จากโฟลเดอร์ในเครื่อง (พัฒนา)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    ใช้แพ็กเกจเปล่าเพื่อตามแท็กรีลีสทางการปัจจุบัน ปักหมุด
    เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

    หลังจากนั้นให้รีสตาร์ท Gateway เพื่อให้โหลด Plugin

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าคอนฟิกใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับรูปแบบทั้งหมด) ขั้นต่ำต้องมี:
    `provider`, ข้อมูลประจำตัวของผู้ให้บริการ, `fromNumber`, และ URL Webhook
    ที่เข้าถึงได้จากสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบ
    การเปิดใช้งาน Plugin, ข้อมูลประจำตัวของผู้ให้บริการ, การเปิดเผย Webhook,
    และว่ามีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ทำงานอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="ทดสอบเบื้องต้น">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็นการรันแบบ dry run โดยค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกสั้น ๆ จริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve เป็น **URL Webhook สาธารณะ**
หาก `publicUrl`, URL tunnel, URL Tailscale หรือ fallback ของ serve
resolve เป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกขาดข้อมูลประจำตัว
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่าไม่สมบูรณ์พร้อมคีย์ที่ขาด
และข้ามการเริ่ม runtime คำสั่ง, การเรียก RPC และเครื่องมือเอเจนต์จะยังคง
ส่งคืนค่ากำหนดผู้ให้บริการที่ขาดอยู่ตามจริงเมื่อใช้งาน

<Note>
ข้อมูลประจำตัวของ Voice-call รองรับ SecretRefs `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะ resolve ผ่านพื้นผิว SecretRef มาตรฐาน ดู [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
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
                  openai: { voice: "alloy" },
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
  <Accordion title="หมายเหตุด้านการเปิดเผยผู้ให้บริการและความปลอดภัย">
    - Twilio, Telnyx และ Plivo ทั้งหมดต้องใช้ URL Webhook ที่ **เข้าถึงได้จากสาธารณะ**
    - `mock` คือผู้ให้บริการสำหรับการพัฒนาในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` เป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
    - บน ngrok free tier ให้ตั้ง `publicUrl` เป็น URL ngrok ที่แน่นอน ระบบจะบังคับใช้การตรวจสอบลายเซ็นเสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (เอเจนต์ในเครื่องของ ngrok) สำหรับการพัฒนาในเครื่องเท่านั้น
    - URL ของ Ngrok free-tier อาจเปลี่ยนหรือเพิ่มพฤติกรรมหน้าแทรกกลางได้ หาก `publicUrl` เปลี่ยนไป ลายเซ็นของ Twilio จะล้มเหลว โปรดักชัน: ควรใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อสตรีมมิง">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ตรวจสอบสิทธิ์ทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ตรวจสอบสิทธิ์ต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดทั้งหมด (รอดำเนินการ + ทำงานอยู่)

  </Accordion>
  <Accordion title="การย้ายคอนฟิกแบบเก่า">
    คอนฟิกเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    แบบเก่าของ `streaming.*` จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    Runtime fallback ยังยอมรับคีย์ voice-call เก่าในตอนนี้ แต่
    เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และ shim ความเข้ากันได้เป็น
    แบบชั่วคราว

    คีย์สตรีมมิงที่ย้ายอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

ตามค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้การโทรซ้ำจาก
ผู้โทรคนเดิมคงหน่วยความจำการสนทนาไว้ ตั้ง `sessionScope: "per-call"` เมื่อ
แต่ละสายของผู้ให้บริการโทรศัพท์ควรเริ่มด้วยบริบทใหม่ เช่น งานต้อนรับ,
การจอง, IVR หรือโฟลว์สะพาน Google Meet ที่หมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมต่างกัน

## การสนทนาเสียงเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์แบบ full-duplex สำหรับเสียงของสาย
สด โดยแยกจาก `streaming` ซึ่งเพียงส่งต่อเสียงไปยัง
ผู้ให้บริการถอดเสียงเรียลไทม์เท่านั้น

<Warning>
ไม่สามารถใช้ `realtime.enabled` ร่วมกับ `streaming.enabled` ได้ เลือก
โหมดเสียงหนึ่งโหมดต่อสาย
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นค่าทางเลือก หากไม่ได้ตั้ง Voice Call จะใช้ผู้ให้บริการเสียงเรียลไทม์ตัวแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงเรียลไทม์ที่รวมมาให้: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ที่ใช้ร่วมกัน `openclaw_agent_consult` โดยค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.consultPolicy` เพิ่มคำแนะนำแบบไม่บังคับว่าโมเดลเรียลไทม์ควรเรียก `openclaw_agent_consult` เมื่อใด
- `realtime.agentContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะใส่ข้อมูลประจำตัวเอเจนต์ที่มีขอบเขตจำกัด การ override system prompt และแคปซูลไฟล์เวิร์กสเปซที่เลือกเข้าไปในคำสั่งของผู้ให้บริการเรียลไทม์เมื่อตั้งค่าเซสชัน
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะค้นหาหน่วยความจำ/บริบทเซสชันที่ทำดัชนีไว้สำหรับคำถาม consult ก่อน แล้วส่งคืน snippet เหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยังเอเจนต์ consult แบบเต็มเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงเรียลไทม์ที่ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ทั้ง Plugin ล้มเหลว
- คีย์เซสชัน consult ใช้เซสชันการโทรที่จัดเก็บไว้ซ้ำเมื่อมี จากนั้น fallback ไปยัง `sessionScope` ที่กำหนดค่าไว้ (`per-phone` โดยค่าเริ่มต้น หรือ `per-call` สำหรับการโทรที่แยกบริบท)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติให้ใช้ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือเอเจนต์ปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือ consult `realtime.tools` แบบกำหนดเองยังคงถูกส่งผ่านไปยังผู้ให้บริการเรียลไทม์                               |

`realtime.consultPolicy` ควบคุมเฉพาะคำสั่งของโมเดลเรียลไทม์:

| นโยบาย        | คำแนะนำ                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | ใช้พรอมป์เริ่มต้นต่อไปและให้ผู้ให้บริการตัดสินใจว่าจะเรียกเครื่องมือ consult เมื่อใด              |
| `substantive` | ตอบข้อความเชื่อมบทสนทนาง่าย ๆ โดยตรง และ consult ก่อนข้อเท็จจริง หน่วยความจำ เครื่องมือ หรือบริบท |
| `always`      | consult ก่อนทุกคำตอบที่มีเนื้อหาสำคัญ                                                        |

### บริบทเสียงของเอเจนต์

เปิดใช้ `realtime.agentContext` เมื่อสะพานเสียงควรให้เสียงเหมือน
เอเจนต์ OpenClaw ที่กำหนดค่าไว้โดยไม่ต้องจ่ายค่า round trip ของ agent-consult แบบเต็มใน
รอบสนทนาปกติ แคปซูลบริบทจะถูกเพิ่มครั้งเดียวเมื่อสร้างเซสชันเรียลไทม์
ดังนั้นจึงไม่เพิ่ม latency ต่อรอบ การเรียกไปยัง
`openclaw_agent_consult` ยังคงรันเอเจนต์ OpenClaw แบบเต็ม และควรใช้
สำหรับงานเครื่องมือ ข้อมูลปัจจุบัน การค้นหาหน่วยความจำ หรือสถานะเวิร์กสเปซ

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
              includeSystemPrompt: true,
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
    ค่าเริ่มต้น: API key จาก `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` หรือ `GOOGLE_GENERATIVE_AI_API_KEY`; โมเดล
    `gemini-2.5-flash-native-audio-preview-12-2025`; เสียง `Kore`
    `sessionResumption` และ `contextWindowCompression` เปิดเป็นค่าเริ่มต้นสำหรับการโทรที่ยาวขึ้น
    และเชื่อมต่อใหม่ได้ ใช้ `silenceDurationMs`, `startSensitivity` และ
    `endSensitivity` เพื่อปรับการผลัดกันพูดให้เร็วขึ้นบนเสียงโทรศัพท์

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
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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
[ผู้ให้บริการ OpenAI](/th/providers/openai) สำหรับตัวเลือกเสียงแบบเรียลไทม์
เฉพาะผู้ให้บริการ

## การถอดเสียงแบบสตรีมมิง

`streaming` เลือกผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับเสียงการโทรสด

พฤติกรรมรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่รวมมาด้วย: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงขณะที่ผู้ให้บริการเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบเรียลไทม์พร้อมแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการใดลงทะเบียน Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

### ตัวอย่างผู้ให้บริการสตรีมมิง

<Tabs>
  <Tab title="OpenAI">
    ค่าเริ่มต้น: API key `streaming.providers.openai.apiKey` หรือ
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
    ค่าเริ่มต้น: API key `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY`;
    เอนด์พอยต์ `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราสุ่มตัวอย่าง `8000`;
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

Voice Call ใช้การกำหนดค่า `messages.tts` หลักสำหรับเสียงพูดแบบสตรีมมิง
ในการโทร คุณสามารถแทนที่ได้ภายใต้การกำหนดค่า Plugin ด้วย
**รูปแบบเดียวกัน** — โดยจะรวมเชิงลึกกับ `messages.tts`

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**ระบบเสียงพูดของ Microsoft ถูกละเว้นสำหรับการโทรเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
ทรานสปอร์ต Microsoft ปัจจุบันไม่เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมโดย `openclaw doctor --fix`; การกำหนดค่าที่คอมมิตแล้วควรใช้ `tts.providers.<provider>`
- Core TTS จะถูกใช้เมื่อเปิดใช้การสตรีมสื่อของ Twilio; ไม่เช่นนั้นการโทรจะย้อนกลับไปใช้เสียงเนทีฟของผู้ให้บริการ
- หากสตรีมสื่อของ Twilio ทำงานอยู่แล้ว Voice Call จะไม่ย้อนกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนการผสมเส้นทางการเล่นสองเส้นทาง
- เมื่อ TTS สำหรับโทรศัพท์ย้อนกลับไปใช้ผู้ให้บริการรอง Voice Call จะบันทึกคำเตือนพร้อมเชนผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อการดีบัก
- เมื่อการแทรกพูดของ Twilio หรือการรื้อสตรีมล้างคิว TTS ที่ค้างอยู่ คำขอเล่นเสียงที่อยู่ในคิวจะเสร็จสิ้นแทนที่จะปล่อยให้ผู้โทรค้างรอการเล่นเสียงให้จบ

### ตัวอย่าง TTS

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
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
                voiceId: "pMsXgVXv3BLzUgSXRplE",
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
                voice: "marin",
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

ค่าเริ่มต้นของนโยบายขาเข้าคือ `disabled` หากต้องการเปิดใช้การโทรขาเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรองหมายเลขผู้โทรที่มีความน่าเชื่อถือต่ำ
Plugin จะปรับค่า `From` ที่ผู้ให้บริการส่งมาให้อยู่ในรูปแบบมาตรฐาน แล้วนำไปเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook ยืนยันการส่งจากผู้ให้บริการและ
ความถูกต้องครบถ้วนของเพย์โหลด แต่ไม่ได้พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP อย่างชัดเจน ให้ถือว่า `allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่
การยืนยันตัวตนผู้โทรที่แข็งแรง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งได้ด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางรายหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งตัวรับสายสำหรับหมายเลขโทรศัพท์หลายหมายเลข
และแต่ละหมายเลขควรทำงานเหมือนสายคนละสาย ตัวอย่างเช่น หมายเลขหนึ่งอาจใช้
ผู้ช่วยส่วนตัวแบบเป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิกทางธุรกิจ
เอเจนต์ตอบกลับอีกตัวหนึ่ง และเสียง TTS อีกแบบหนึ่ง

เส้นทางจะถูกเลือกจากหมายเลข `To` ที่โทรเข้า ซึ่งผู้ให้บริการส่งมา คีย์ต้องเป็น
หมายเลข E.164 เมื่อมีสายเข้า Voice Call จะระบุเส้นทางที่ตรงกันหนึ่งครั้ง
เก็บเส้นทางที่จับคู่ไว้ในระเบียนสาย และนำการกำหนดค่าที่มีผลนั้นกลับมาใช้ซ้ำ
สำหรับคำทักทาย เส้นทางการตอบกลับอัตโนมัติแบบคลาสสิก เส้นทางปรึกษาแบบเรียลไทม์ และการเล่นเสียง TTS
หากไม่มีเส้นทางใดตรงกัน จะใช้การกำหนดค่า Voice Call ส่วนกลาง
สายขาออกจะไม่ใช้ `numbers`; ให้ส่งเป้าหมายขาออก ข้อความ และ
เซสชันอย่างชัดเจนเมื่อเริ่มต้นสาย

การแทนที่เส้นทางในปัจจุบันรองรับ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่าเส้นทาง `tts` จะผสานแบบลึกทับการกำหนดค่า `tts` ของ Voice Call ส่วนกลาง ดังนั้น
โดยทั่วไปคุณสามารถแทนที่เฉพาะเสียงของผู้ให้บริการได้:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### สัญญาเอาต์พุตคำพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะเพิ่มสัญญาเอาต์พุตคำพูดที่เข้มงวดต่อท้าย
พรอมป์ระบบ:

```text
{"spoken":"..."}
```

Voice Call จะแยกข้อความสำหรับพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ถูกทำเครื่องหมายว่าเป็นเนื้อหาการให้เหตุผล/ข้อผิดพลาด
- แยกวิเคราะห์ JSON โดยตรง, JSON ในบล็อก fenced หรือคีย์ `"spoken"` แบบอินไลน์
- ถอยกลับไปใช้ข้อความธรรมดา และลบย่อหน้านำเข้าที่น่าจะเป็นการวางแผน/เมตาออก

สิ่งนี้ช่วยให้การเล่นเสียงพูดมุ่งเน้นที่ข้อความสำหรับผู้โทร และหลีกเลี่ยง
การรั่วไหลของข้อความวางแผนลงในเสียง

### พฤติกรรมการเริ่มต้นการสนทนา

สำหรับสาย `conversation` ขาออก การจัดการข้อความแรกจะผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิวเมื่อพูดแทรกและการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงเริ่มต้นล้มเหลว สายจะกลับไปเป็น `listening` และข้อความเริ่มต้นจะยังค้างในคิวเพื่อรอลองใหม่
- การเล่นเสียงเริ่มต้นสำหรับการสตรีมของ Twilio จะเริ่มเมื่อสตรีมเชื่อมต่อ โดยไม่มีดีเลย์เพิ่มเติม
- การพูดแทรกจะยกเลิกการเล่นเสียงที่กำลังทำงานอยู่ และล้างรายการ Twilio TTS ที่เข้าคิวแต่ยังไม่ได้เล่น รายการที่ถูกล้างจะ resolve เป็น skipped เพื่อให้ตรรกะการตอบกลับถัดไปดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาเสียงแบบเรียลไทม์ใช้เทิร์นเปิดของสตรีมเรียลไทม์เอง Voice Call จะไม่โพสต์การอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความเริ่มต้นนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจะยังคงเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อของ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
จบสายโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ภายในช่วงเวลาดังกล่าว การจบสายอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังพ้นช่วงผ่อนผัน สายจะถูกจบเพื่อป้องกันไม่ให้มีสายที่ยังทำงานค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ Webhook
ปลายทาง เช่น สายในโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์ ค่าเริ่มต้น
คือ `0` (ปิดใช้)

ช่วงที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
- ตั้งค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้การเรียกปกติทำงานเสร็จได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อมีพร็อกซีหรือทันเนลอยู่หน้า Gateway Plugin จะประกอบ URL สาธารณะขึ้นใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่าจะเชื่อถือเฮดเดอร์ที่ถูกส่งต่อรายการใด:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  รายชื่อโฮสต์ที่อนุญาตจากเฮดเดอร์การส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือเฮดเดอร์ที่ถูกส่งต่อโดยไม่มีรายการที่อนุญาต
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือเฮดเดอร์ที่ถูกส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องแต่ถูกเล่นซ้ำจะได้รับการตอบรับ แต่จะถูกข้ามสำหรับผลข้างเคียง
- เทิร์นการสนทนา Twilio มีโทเค็นต่อเทิร์นในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กคำพูดที่เก่าหรือถูกเล่นซ้ำจะไม่สามารถตอบสนองเทิร์นถอดเสียงที่รออยู่รายการใหม่กว่าได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านบอดีเมื่อไม่มีเฮดเดอร์ลายเซ็นที่ผู้ให้บริการต้องการ
- Webhook ของ voice-call ใช้โปรไฟล์บอดีก่อนยืนยันตัวตนที่ใช้ร่วมกัน (64 KB / 5 วินาที) พร้อมขีดจำกัดคำขอที่กำลังประมวลผลต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างที่มีโฮสต์สาธารณะที่เสถียร:

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

เมื่อ Gateway ทำงานอยู่แล้ว คำสั่งปฏิบัติการ `voicecall` จะมอบหมายงานให้รันไทม์ voice-call ที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ผูกเซิร์ฟเวอร์ Webhook ตัวที่สอง หากติดต่อ Gateway ไม่ได้ คำสั่งจะถอยกลับไปใช้รันไทม์ CLI แบบสแตนด์อโลน

`latency` อ่าน `calls.jsonl` จากพาธจัดเก็บ voice-call เริ่มต้น ใช้ `--file <path>` เพื่อชี้ไปยังล็อกอื่น และใช้ `--last <n>` เพื่อจำกัดการวิเคราะห์ไว้ที่ระเบียน N รายการสุดท้าย (ค่าเริ่มต้น 200) เอาต์พุตมี p50/p90/p99 สำหรับเวลาแฝงของเทิร์นและเวลารอการฟัง

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `voice_call`

| การดำเนินการ | อาร์กิวเมนต์ |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

รีโพนี้มาพร้อมเอกสาร Skills ที่ตรงกันที่ `skills/voice-call/SKILL.md`

## Gateway RPC

| เมธอด | อาร์กิวเมนต์ |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` การเรียกในโหมดแจ้งเตือนควรใช้ `voicecall.dtmf` หลังจากมีสายแล้ว หากต้องการส่งตัวเลขหลังการเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าล้มเหลวในการเปิดเผย Webhook

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่เรียกใช้ Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo` ค่า `webhook-exposure` ต้องเป็นสีเขียว `publicUrl` ที่กำหนดค่าไว้จะยังล้มเหลวเมื่อชี้ไปยังพื้นที่เครือข่ายท้องถิ่นหรือส่วนตัว เพราะผู้ให้บริการโทรศัพท์ไม่สามารถเรียกกลับไปยังที่อยู่เหล่านั้นได้ อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

การโทรออกของ Twilio ในโหมดแจ้งเตือนจะส่ง TwiML `<Say>` เริ่มต้นโดยตรงในคำขอสร้างสาย ดังนั้นข้อความพูดแรกจึงไม่ขึ้นกับการที่ Twilio ดึง TwiML จาก Webhook อย่างไรก็ตาม ยังต้องมี Webhook สาธารณะสำหรับคอลแบ็กสถานะ สายสนทนา DTMF ก่อนเชื่อมต่อ สตรีมเรียลไทม์ และการควบคุมสายหลังเชื่อมต่อ

ใช้เส้นทางเปิดเผยสาธารณะหนึ่งเส้นทาง:

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

หลังจากเปลี่ยนการกำหนดค่า ให้รีสตาร์ตหรือโหลด Gateway ใหม่ แล้วเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการทดสอบแบบ dry run เว้นแต่คุณจะส่ง `--yes`

### ข้อมูลประจำตัวผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลประจำตัวที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber`
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`

ข้อมูลประจำตัวต้องมีอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ในเครื่องจะไม่มีผลกับ Gateway ที่กำลังทำงานอยู่จนกว่าจะรีสตาร์ตหรือโหลดสภาพแวดล้อมใหม่

### สายเริ่มได้แต่ Webhook ของผู้ให้บริการไม่มาถึง

ยืนยันว่าคอนโซลของผู้ให้บริการชี้ไปยัง URL Webhook สาธารณะที่ตรงกันทุกประการ:

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
- URL ทันเนลเปลี่ยนหลังจาก Gateway เริ่มทำงาน
- พร็อกซีส่งต่อคำขอแต่ตัดหรือเขียนเฮดเดอร์ host/proto ใหม่
- ไฟร์วอลล์หรือ DNS ส่งชื่อโฮสต์สาธารณะไปยังที่อื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้ Voice Call plugin

เมื่อมี reverse proxy หรือทันเนลอยู่หน้า Gateway ให้ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้ `webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่ทราบ ใช้ `webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตพร็อกซีอยู่ภายใต้การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจเทียบกับ URL สาธารณะที่ OpenClaw ประกอบขึ้นใหม่จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL Webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึงสกีม โฮสต์ และพาธ
- สำหรับ URL ngrok แบบ free-tier ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ของทันเนลเปลี่ยน
- ตรวจสอบให้แน่ใจว่าพร็อกซีคงค่าเฮดเดอร์โฮสต์และโปรโตเดิมไว้ หรือกำหนดค่า `webhookSecurity.allowedHosts`
- อย่าเปิดใช้ `skipSignatureVerification` นอกการทดสอบในเครื่อง

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมผ่านการโทรเข้า Twilio ก่อนอื่นให้ตรวจสอบ Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบทรานสปอร์ต Google Meet โดยตรง:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบหมายเลขโทรเข้า Meet, PIN และ `--dtmf-sequence` สายโทรศัพท์อาจทำงานปกติในขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet เริ่มขาโทรศัพท์ Twilio ผ่าน `voicecall.start` ด้วยลำดับ DTMF ก่อนเชื่อมต่อ ลำดับที่ได้จาก PIN จะมี `voiceCall.dtmfDelayMs` ของ Plugin Google Meet เป็นตัวเลขรอของ Twilio นำหน้า ค่าเริ่มต้นคือ 12 วินาที เพราะพรอมป์โทรเข้า Meet อาจมาช้า จากนั้น Voice Call จะเปลี่ยนเส้นทางกลับไปยังการจัดการแบบเรียลไทม์ก่อนที่จะขอคำทักทายเริ่มต้น

ใช้ `openclaw logs --follow` สำหรับร่องรอยเฟสสด การเข้าร่วม Twilio Meet ที่ปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้ Voice Call
- Voice Call จัดเก็บ TwiML DTMF ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้และเสิร์ฟก่อนการจัดการแบบเรียลไทม์
- Voice Call เสิร์ฟ TwiML แบบเรียลไทม์สำหรับสาย Twilio
- Google Meet ขอคำพูดแนะนำด้วย `voicecall.speak` หลังจากดีเลย์หลัง DTMF

`openclaw voicecall tail` ยังคงแสดงระเบียนสายที่คงไว้ เหมาะสำหรับสถานะสายและถอดเสียง แต่ไม่ใช่ทุกการเปลี่ยนผ่านของ Webhook/เรียลไทม์ที่จะปรากฏที่นั่น

### สายเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ `streaming.enabled` ไม่สามารถเป็นจริงพร้อมกันได้

สำหรับสาย Twilio แบบเรียลไทม์ ให้ตรวจสอบเพิ่มเติมว่า:

- โหลดและลงทะเบียน Plugin ผู้ให้บริการเรียลไทม์แล้ว
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานในโปรเซส Gateway
- `openclaw logs --follow` แสดงว่ามีการเสิร์ฟ TwiML แบบเรียลไทม์ เริ่มบริดจ์เรียลไทม์ และจัดคิวคำทักทายเริ่มต้นแล้ว

## ที่เกี่ยวข้อง

- [โหมดคุย](/th/nodes/talk)
- [แปลงข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
