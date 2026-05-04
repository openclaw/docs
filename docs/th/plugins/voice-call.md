---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายเสียงขาเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-04T07:06:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก,
การสนทนาหลายรอบ, เสียงเรียลไทม์แบบฟูลดูเพล็กซ์, การถอดเสียงแบบสตรีมมิง,
และสายเรียกเข้าพร้อมนโยบาย allowlist

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
Plugin Voice Call ทำงาน **ภายในกระบวนการ Gateway** หากคุณใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่รัน
Gateway จากนั้นรีสตาร์ท Gateway เพื่อโหลด Plugin
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

    ใช้แพ็กเกจเปล่าเพื่อตามแท็กรีลีสอย่างเป็นทางการปัจจุบัน ปักหมุด
    เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

    รีสตาร์ท Gateway หลังจากนั้นเพื่อให้ Plugin โหลด

  </Step>
  <Step title="Configure provider and webhook">
    ตั้งค่าคอนฟิกภายใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับโครงสร้างทั้งหมด) อย่างน้อยต้องมี:
    `provider`, ข้อมูลประจำตัวของผู้ให้บริการ, `fromNumber`, และ URL Webhook
    ที่เข้าถึงได้แบบสาธารณะ
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบ
    การเปิดใช้ Plugin, ข้อมูลประจำตัวของผู้ให้บริการ, การเปิดเผย Webhook,
    และมีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ใช้งานอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็น dry run โดยค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกสั้น ๆ จริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve เป็น **URL Webhook สาธารณะ**
หาก `publicUrl`, URL tunnel, URL Tailscale หรือ serve fallback
resolve เป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ carrier webhooks ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลประจำตัว
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่าไม่สมบูรณ์พร้อมคีย์ที่ขาดหายไป และ
ข้ามการเริ่ม runtime คำสั่ง, การเรียก RPC และเครื่องมือ agent ยังคง
ส่งคืนคอนฟิกผู้ให้บริการที่ขาดหายไปอย่างแม่นยำเมื่อใช้งาน

<Note>
ข้อมูลประจำตัว voice-call รองรับ SecretRefs `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะ resolve ผ่านพื้นผิว SecretRef มาตรฐาน; ดู [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx และ Plivo ทั้งหมดต้องใช้ URL Webhook ที่ **เข้าถึงได้แบบสาธารณะ**
    - `mock` คือผู้ให้บริการ dev ในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` เป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
    - ใน ngrok ระดับฟรี ให้ตั้ง `publicUrl` เป็น URL ngrok ที่แน่นอน; การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Twilio webhooks ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (ngrok local agent) เท่านั้น สำหรับ dev ในเครื่องเท่านั้น
    - URL ระดับฟรีของ Ngrok อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial ได้; หาก `publicUrl` เคลื่อนออกไป ลายเซ็น Twilio จะล้มเหลว Production: แนะนำให้ใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` ปิด socket ที่ไม่เคยส่ง frame `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวน socket pre-start ที่ยังไม่ได้ยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดจำนวน socket pre-start ที่ยังไม่ได้ยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวน socket media stream ที่เปิดอยู่ทั้งหมด (pending + active)

  </Accordion>
  <Accordion title="Legacy config migrations">
    คอนฟิกเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    `streaming.*` แบบ legacy จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    Runtime fallback ยังยอมรับคีย์ voice-call เก่าได้ในตอนนี้ แต่
    เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim เป็น
    ชั่วคราว

    คีย์ streaming ที่ย้ายอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

โดยค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้สายซ้ำจาก
ผู้โทรรายเดิมคงหน่วยความจำการสนทนาไว้ ตั้ง `sessionScope: "per-call"` เมื่อ
แต่ละ carrier call ควรเริ่มด้วยบริบทใหม่ เช่น งานต้อนรับ,
การจอง, IVR หรือ flow สะพาน Google Meet ที่หมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมคนละรายการ

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์แบบฟูลดูเพล็กซ์สำหรับเสียงการโทรสด
โดยแยกจาก `streaming` ซึ่งทำหน้าที่ส่งต่อเสียงไปยัง
ผู้ให้บริการถอดเสียงแบบเรียลไทม์เท่านั้น

<Warning>
`realtime.enabled` ไม่สามารถใช้ร่วมกับ `streaming.enabled` ได้ เลือก
โหมดเสียงหนึ่งโหมดต่อการโทร
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงเรียลไทม์ที่ bundled: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ร่วม `openclaw_agent_consult` โดยค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลเชิงลึก ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้งาน Voice Call จะค้นหาหน่วยความจำ/บริบทเซสชันที่ทำดัชนีไว้สำหรับคำถาม consult ก่อน และส่งคืน snippet เหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยัง consult agent เต็มรูปแบบเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงเรียลไทม์ที่ลงทะเบียนเลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult ใช้เซสชันการโทรที่เก็บไว้เมื่อมี จากนั้น fallback ไปยัง `sessionScope` ที่กำหนดค่าไว้ (`per-phone` โดยค่าเริ่มต้น หรือ `per-call` สำหรับการโทรที่แยกบริบท)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัด agent ปกติไว้ที่ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือ consult และให้ agent ปกติใช้นโยบายเครื่องมือ agent ปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือ consult `realtime.tools` แบบกำหนดเองยังคงถูกส่งผ่านไปยังผู้ให้บริการเรียลไทม์                               |

### ตัวอย่างผู้ให้บริการเรียลไทม์

<Tabs>
  <Tab title="Google Gemini Live">
    ค่าเริ่มต้น: API key จาก `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` หรือ `GOOGLE_GENERATIVE_AI_API_KEY`; โมเดล
    `gemini-2.5-flash-native-audio-preview-12-2025`; เสียง `Kore`
    `sessionResumption` และ `contextWindowCompression` เปิดโดยค่าเริ่มต้นสำหรับการโทรที่ยาวขึ้นและ
    reconnect ได้ ใช้ `silenceDurationMs`, `startSensitivity` และ
    `endSensitivity` เพื่อปรับการสลับตาที่เร็วขึ้นบนเสียงโทรศัพท์

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

`streaming` เลือกผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับเสียงสายสด

พฤติกรรมรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือกเสริม หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่รวมมาให้: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบเรียลไทม์พร้อมแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการใดลงทะเบียนไว้ Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

### ตัวอย่างผู้ให้บริการสตรีมมิง

<Tabs>
  <Tab title="OpenAI">
    ค่าเริ่มต้น: คีย์ API `streaming.providers.openai.apiKey` หรือ
    `OPENAI_API_KEY`; โมเดล `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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
    `endpointingMs: 800`; `interimResults: true`.

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

## TTS สำหรับสายโทรศัพท์

Voice Call ใช้การกำหนดค่า `messages.tts` หลักสำหรับเสียงพูดแบบสตรีมมิง
ในสายโทรศัพท์ คุณสามารถแทนที่ได้ใต้การกำหนดค่า Plugin ด้วย
**รูปแบบเดียวกัน** — ระบบจะผสานเชิงลึกกับ `messages.tts`

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
**Microsoft speech จะถูกละเว้นสำหรับสายเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
ทรานสปอร์ต Microsoft ปัจจุบันไม่ได้เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมแซมโดย `openclaw doctor --fix`; การกำหนดค่าที่คอมมิตควรใช้ `tts.providers.<provider>`
- ใช้ TTS หลักเมื่อเปิดใช้การสตรีมสื่อ Twilio; มิฉะนั้นสายโทรศัพท์จะย้อนกลับไปใช้เสียงเนทีฟของผู้ให้บริการ
- หากสตรีมสื่อ Twilio ทำงานอยู่แล้ว Voice Call จะไม่ย้อนกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นเสียงสองแบบ
- เมื่อ TTS สำหรับโทรศัพท์ย้อนกลับไปใช้ผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมเชนผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อการดีบัก
- เมื่อ Twilio barge-in หรือการรื้อถอนสตรีมล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่เข้าคิวไว้จะจบสถานะแทนที่จะค้างผู้โทรที่รอให้การเล่นเสียงเสร็จ

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

## สายขาเข้า

นโยบายขาเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายขาเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรองหมายเลขผู้โทรที่มีความน่าเชื่อต่ำ
Plugin จะทำให้ค่า `From` ที่ผู้ให้บริการส่งมาอยู่ในรูปแบบปกติและเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook ยืนยันการส่งจากผู้ให้บริการและ
ความสมบูรณ์ของเพย์โหลด แต่ไม่ได้ **พิสูจน์** ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่ตัวตนผู้โทร
ที่แข็งแรง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางรายหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งรายการรับสายสำหรับหมายเลขโทรศัพท์หลายหมายเลข
และแต่ละหมายเลขควรทำงานเหมือนคนละสาย ตัวอย่างเช่น หมายเลขหนึ่ง
สามารถใช้ผู้ช่วยส่วนตัวแบบเป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิกธุรกิจ
เอเจนต์ตอบกลับคนละตัว และเสียง TTS คนละเสียง

เส้นทางจะถูกเลือกจากหมายเลข `To` ที่ผู้ให้บริการส่งมา คีย์ต้องเป็น
หมายเลข E.164 เมื่อสายเข้ามา Voice Call จะระบุเส้นทางที่ตรงกันหนึ่งครั้ง
จัดเก็บเส้นทางที่ตรงกันไว้ในบันทึกสาย และนำการกำหนดค่าที่มีผลนั้นกลับมาใช้
สำหรับคำทักทาย เส้นทางตอบกลับอัตโนมัติแบบคลาสสิก เส้นทางปรึกษาแบบเรียลไทม์ และการเล่นเสียง
TTS หากไม่มีเส้นทางใดตรงกัน จะใช้การกำหนดค่า Voice Call แบบส่วนกลาง
สายขาออกจะไม่ใช้ `numbers`; ให้ส่งเป้าหมายขาออก ข้อความ และ
เซสชันอย่างชัดเจนเมื่อเริ่มสาย

การแทนที่เส้นทางปัจจุบันรองรับ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่าเส้นทาง `tts` จะผสานเชิงลึกทับการกำหนดค่า `tts` ของ Voice Call ส่วนกลาง ดังนั้น
โดยปกติคุณสามารถแทนที่เฉพาะเสียงของผู้ให้บริการได้:

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

### สัญญาเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตเสียงพูดแบบเข้มงวด
เข้ากับพรอมป์ต์ระบบ:

```text
{"spoken":"..."}
```

Voice Call ดึงข้อความคำพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ทำเครื่องหมายเป็นเนื้อหาการให้เหตุผล/ข้อผิดพลาด
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน fenced block หรือคีย์ `"spoken"` แบบอินไลน์
- ย้อนกลับไปใช้ข้อความธรรมดาและลบย่อหน้านำที่น่าจะเป็นการวางแผน/เมตา

สิ่งนี้ช่วยให้การเล่นเสียงพูดเน้นข้อความสำหรับผู้โทรและหลีกเลี่ยง
การรั่วไหลข้อความวางแผนไปยังเสียง

### พฤติกรรมการเริ่มต้นการสนทนา

สำหรับสาย `conversation` ขาออก การจัดการข้อความแรกผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิวจาก barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายแรกกำลังพูดอยู่
- หากการเล่นเสียงแรกเริ่มล้มเหลว สายจะกลับไปเป็น `listening` และข้อความแรกจะยังคงอยู่ในคิวเพื่อรอลองใหม่
- การเล่นเสียงแรกเริ่มสำหรับการสตรีม Twilio จะเริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีความล่าช้าเพิ่มเติม
- Barge-in ยกเลิกการเล่นเสียงที่ทำงานอยู่และล้างรายการ Twilio TTS ที่เข้าคิวไว้แต่ยังไม่ได้เล่น รายการที่ถูกล้างจะ resolve เป็นถูกข้าม เพื่อให้ตรรกะการตอบกลับต่อเนื่องดำเนินต่อได้โดยไม่ต้องรอเสียงที่ไม่มีวันเล่น
- การสนทนาเสียงแบบเรียลไทม์ใช้เทิร์นเปิดของสตรีมเรียลไทม์เอง Voice Call จะ **ไม่** โพสต์อัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความแรกเริ่มนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจึงยังคงเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
สิ้นสุดสายโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อกลับในช่วงเวลานั้น การสิ้นสุดอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังช่วงผ่อนผัน สายจะถูกสิ้นสุดเพื่อป้องกันสายที่ยัง active ค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อสิ้นสุดสายที่ไม่เคยได้รับ Webhook
ปลายทาง (ตัวอย่างเช่น สายโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้น
คือ `0` (ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **โปรดักชัน:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
- ให้ค่านี้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติจบได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อพร็อกซีหรือทันเนลอยู่หน้า Gateway Plugin จะ
สร้าง URL สาธารณะใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้
ควบคุมว่าเฮดเดอร์ที่ส่งต่อใดเชื่อถือได้:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  อนุญาตโฮสต์จากเฮดเดอร์การส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือเฮดเดอร์ที่ส่งต่อโดยไม่ต้องมี allowlist
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือเฮดเดอร์ที่ส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องซึ่งถูกเล่นซ้ำจะได้รับการยืนยัน แต่จะข้ามผลข้างเคียง
- เทิร์นการสนทนา Twilio มีโทเค็นต่อเทิร์นในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กคำพูดที่เก่า/ถูกเล่นซ้ำจึงไม่สามารถทำให้เทิร์นทรานสคริปต์ที่รอดำเนินการใหม่กว่าสำเร็จได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body เมื่อเฮดเดอร์ลายเซ็นที่ผู้ให้บริการต้องการขาดหายไป
- Webhook ของ voice-call ใช้โปรไฟล์ body ก่อนยืนยันตัวตนร่วมกัน (64 KB / 5 วินาที) รวมกับขีดจำกัด in-flight ต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างพร้อมโฮสต์สาธารณะที่เสถียร:

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
ให้รันไทม์การโทรเสียงที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ผูกกับเซิร์ฟเวอร์
webhook ตัวที่สอง หากติดต่อ Gateway ไม่ได้ คำสั่งจะถอยกลับไปใช้รันไทม์
CLI แบบสแตนด์อโลน

`latency` อ่าน `calls.jsonl` จากพาธจัดเก็บการโทรเสียงเริ่มต้น
ใช้ `--file <path>` เพื่อชี้ไปยังบันทึกอื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ไว้ที่ N ระเบียนล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตมี p50/p90/p99
สำหรับเวลาแฝงของรอบสนทนาและเวลารอฟัง

## เครื่องมือ Agent

ชื่อเครื่องมือ: `voice_call`.

| การกระทำ        | อาร์กิวเมนต์                               |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

repo นี้มาพร้อมเอกสาร skill ที่ตรงกันที่ `skills/voice-call/SKILL.md`.

## Gateway RPC

| เมธอด               | อาร์กิวเมนต์                               |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` เท่านั้น การโทรในโหมด
notify ควรใช้ `voicecall.dtmf` หลังจากมีการโทรแล้ว หากต้องใช้ตัวเลขหลังเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าล้มเหลวที่การเปิดเผย webhook

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่เรียกใช้ Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo` นั้น `webhook-exposure` ต้องเป็นสีเขียว
`publicUrl` ที่กำหนดค่าไว้ยังคงล้มเหลวได้เมื่อชี้ไปยังพื้นที่เครือข่าย local
หรือ private เพราะผู้ให้บริการเครือข่ายโทรศัพท์ไม่สามารถเรียกกลับไปยังที่อยู่เหล่านั้นได้
อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`.

การโทรออกของ Twilio ในโหมด notify จะส่ง TwiML `<Say>` เริ่มต้นโดยตรงใน
คำขอ create-call ดังนั้นข้อความพูดแรกจึงไม่ขึ้นกับการที่ Twilio ดึง webhook TwiML
ยังคงต้องใช้ webhook สาธารณะสำหรับ status callbacks, การโทรแบบสนทนา,
DTMF ก่อนเชื่อมต่อ, สตรีมแบบ realtime และการควบคุมสายหลังเชื่อมต่อ

ใช้พาธเปิดเผยสาธารณะหนึ่งแบบ:

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

หลังจากเปลี่ยน config แล้ว ให้รีสตาร์ตหรือโหลด Gateway ใหม่ จากนั้นเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการรันแบบ dry run เว้นแต่คุณจะส่ง `--yes`.

### ข้อมูลรับรองผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลรับรองที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`.

ข้อมูลรับรองต้องมีอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์ shell ในเครื่อง
จะไม่ส่งผลต่อ Gateway ที่กำลังทำงานอยู่จนกว่าจะรีสตาร์ตหรือโหลดสภาพแวดล้อมใหม่

### การโทรเริ่มต้นได้ แต่ webhook ของผู้ให้บริการไม่มาถึง

ยืนยันว่าคอนโซลของผู้ให้บริการชี้ไปยัง URL webhook สาธารณะที่ถูกต้องพอดี:

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

- `publicUrl` ชี้ไปยังพาธที่ต่างจาก `serve.path`.
- URL tunnel เปลี่ยนหลังจาก Gateway เริ่มทำงาน
- proxy ส่งต่อคำขอ แต่ตัดหรือเขียน host/proto headers ใหม่
- firewall หรือ DNS นำชื่อโฮสต์สาธารณะไปยังตำแหน่งอื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้งาน Voice Call Plugin

เมื่อมี reverse proxy หรือ tunnel อยู่หน้า Gateway ให้ตั้งค่า
`webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้
`webhookSecurity.trustedProxyIPs` สำหรับที่อยู่ proxy ที่ทราบแน่ชัด ใช้
`webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขต proxy อยู่ภายใต้
การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจสอบเทียบกับ URL สาธารณะที่ OpenClaw สร้างใหม่
จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึง
  scheme, host และ path.
- สำหรับ URL ของ ngrok free-tier ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ tunnel เปลี่ยน
- ตรวจสอบให้แน่ใจว่า proxy รักษา host และ proto headers เดิมไว้ หรือกำหนดค่า
  `webhookSecurity.allowedHosts`.
- อย่าเปิดใช้ `skipSignatureVerification` นอกการทดสอบ local

### การเข้าร่วม Google Meet ด้วย Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมแบบ dial-in ผ่าน Twilio ก่อนอื่นให้ตรวจสอบ Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบการขนส่งของ Google Meet อย่างชัดเจน:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบหมายเลข
dial-in ของ Meet, PIN และ `--dtmf-sequence` สายโทรศัพท์อาจปกติดีแม้การประชุม
จะปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet ส่งลำดับ DTMF ของ Meet และข้อความแนะนำไปยัง `voicecall.start`.
สำหรับการโทร Twilio นั้น Voice Call จะให้บริการ DTMF TwiML ก่อน เปลี่ยนเส้นทางกลับไปยัง
webhook แล้วจึงเปิดสตรีมสื่อแบบ realtime เพื่อให้ข้อความแนะนำที่บันทึกไว้ถูกสร้าง
หลังจากผู้เข้าร่วมทางโทรศัพท์เข้าร่วมการประชุมแล้ว

ใช้ `openclaw logs --follow` สำหรับ trace ช่วง live การเข้าร่วม Twilio Meet
ที่ทำงานปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้ Voice Call
- Voice Call จัดเก็บ DTMF TwiML ก่อนเชื่อมต่อ
- Twilio initial TwiML ถูกใช้และให้บริการก่อนการจัดการแบบ realtime
- Voice Call ให้บริการ realtime TwiML สำหรับการโทร Twilio
- realtime bridge เริ่มต้นพร้อมคำทักทายเริ่มต้นที่เข้าคิวไว้

`openclaw voicecall tail` ยังคงแสดงระเบียนการโทรที่บันทึกถาวร มีประโยชน์สำหรับ
สถานะการโทรและทรานสคริปต์ แต่ไม่ใช่ทุกการเปลี่ยนผ่านของ webhook/realtime
ที่จะปรากฏที่นั่น

### การโทรแบบ realtime ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้งานโหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ
`streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับการโทร Twilio แบบ realtime ให้ตรวจสอบเพิ่มเติมว่า:

- Plugin ผู้ให้บริการ realtime ถูกโหลดและลงทะเบียนแล้ว
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- API key ของผู้ให้บริการพร้อมใช้งานสำหรับ process ของ Gateway
- `openclaw logs --follow` แสดงว่า realtime TwiML ถูกให้บริการ, realtime bridge
  เริ่มต้นแล้ว และคำทักทายเริ่มต้นถูกเข้าคิวไว้

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [ข้อความเป็นเสียงพูด](/th/tools/tts)
- [ปลุกด้วยเสียง](/th/nodes/voicewake)
