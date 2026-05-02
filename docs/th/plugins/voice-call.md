---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายโทรเข้าด้วยเสียงผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกสำหรับเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-02T22:22:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

ปลั๊กอินสำหรับให้ OpenClaw โทรด้วยเสียง รองรับการแจ้งเตือนขาออก,
การสนทนาหลายรอบ, เสียงเรียลไทม์แบบฟูลดูเพล็กซ์, การถอดเสียงแบบสตรีมมิง,
และสายขาเข้าพร้อมนโยบายรายการอนุญาต

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (การพัฒนา/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในกระบวนการ Gateway** หากคุณใช้
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

    ใช้แพ็กเกจเปล่าเพื่อตามแท็กรุ่นทางการปัจจุบัน ตรึงเป็น
    เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้

    รีสตาร์ท Gateway หลังจากนั้นเพื่อให้ Plugin โหลด

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าคอนฟิกใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับรูปแบบเต็ม) อย่างน้อยต้องมี:
    `provider`, ข้อมูลรับรองของผู้ให้บริการ, `fromNumber`, และ URL ของ Webhook
    ที่เข้าถึงได้สาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบ
    การเปิดใช้ Plugin, ข้อมูลรับรองของผู้ให้บริการ, การเปิดเผย Webhook,
    และว่ามีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่เปิดอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="ทดสอบแบบ Smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองรายการเป็น dry run โดยค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกสั้น ๆ จริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้องแก้ค่าเป็น **URL ของ Webhook สาธารณะ**
หาก `publicUrl`, URL ของ tunnel, URL ของ Tailscale หรือ serve fallback
แก้ค่าเป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่รับ Webhook จากผู้ให้บริการเครือข่ายไม่ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกขาดข้อมูลรับรอง,
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่ายังไม่สมบูรณ์พร้อมคีย์ที่ขาด
และข้ามการเริ่ม runtime คำสั่ง, การเรียก RPC และเครื่องมือ agent ยังคง
คืนค่าการกำหนดค่าผู้ให้บริการที่ขาดอย่างตรงตัวเมื่อใช้งาน

<Note>
ข้อมูลรับรอง voice-call รองรับ SecretRefs `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` แก้ค่าผ่านพื้นผิว SecretRef มาตรฐาน; ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
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
    - Twilio, Telnyx และ Plivo ทั้งหมดต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้สาธารณะ**
    - `mock` เป็นผู้ให้บริการสำหรับการพัฒนาในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` เป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
    - บนระดับฟรีของ ngrok ให้ตั้งค่า `publicUrl` เป็น URL ของ ngrok ที่แน่นอน; การตรวจสอบลายเซ็นจะบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (agent ในเครื่องของ ngrok) สำหรับการพัฒนาในเครื่องเท่านั้น
    - URL ระดับฟรีของ Ngrok อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial; หาก `publicUrl` เบี่ยงไป ลายเซ็นของ Twilio จะล้มเหลว สำหรับโปรดักชัน: ควรใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="เพดานการเชื่อมต่อสตรีมมิง">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ตรวจสอบสิทธิ์ทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดซ็อกเก็ต pre-start ที่ยังไม่ตรวจสอบสิทธิ์ต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดทั้งหมด (pending + active)

  </Accordion>
  <Accordion title="การย้ายคอนฟิกแบบเดิม">
    คอนฟิกเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    `streaming.*` แบบเดิม จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    runtime fallback ยังคงยอมรับคีย์ voice-call เก่าในตอนนี้ แต่
    เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim
    เป็นเพียงชั่วคราว

    คีย์สตรีมมิงที่ย้ายโดยอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

โดยค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้การโทรซ้ำจาก
ผู้โทรคนเดิมคงหน่วยความจำการสนทนาไว้ ตั้งค่า `sessionScope: "per-call"` เมื่อ
การโทรของผู้ให้บริการเครือข่ายแต่ละครั้งควรเริ่มด้วยบริบทใหม่ เช่น แผนกต้อนรับ,
การจอง, IVR หรือโฟลว์บริดจ์ Google Meet ที่หมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมคนละครั้ง

## การสนทนาด้วยเสียงเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์แบบฟูลดูเพล็กซ์สำหรับเสียงสดของสายโทร
แยกจาก `streaming` ซึ่งส่งต่อเสียงไปยังผู้ให้บริการถอดเสียงเรียลไทม์เท่านั้น

<Warning>
ไม่สามารถรวม `realtime.enabled` กับ `streaming.enabled` ได้ เลือก
โหมดเสียงหนึ่งโหมดต่อสาย
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นตัวเลือก หากไม่ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงเรียลไทม์ที่ลงทะเบียนไว้รายแรก
- ผู้ให้บริการเสียงเรียลไทม์ที่รวมมา: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการเหล่านั้น
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ `openclaw_agent_consult` ที่ใช้ร่วมกันโดยค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น, ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะค้นหาบริบทหน่วยความจำ/เซสชันที่ทำดัชนีไว้สำหรับคำถาม consult ก่อน และคืน snippet เหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยัง consult agent เต็มรูปแบบเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงเรียลไทม์ที่ลงทะเบียนเลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult ใช้เซสชันสายโทรที่เก็บไว้เมื่อมี จากนั้น fallback ไปยัง `sessionScope` ที่กำหนดค่าไว้ (`per-phone` โดยค่าเริ่มต้น หรือ `per-call` สำหรับสายที่แยกบริบท)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัด agent ปกติให้ใช้ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือ consult และให้ agent ปกติใช้นโยบายเครื่องมือ agent ตามปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือ consult `realtime.tools` แบบกำหนดเองยังคงถูกส่งผ่านไปยังผู้ให้บริการเรียลไทม์                               |

### ตัวอย่างผู้ให้บริการเรียลไทม์

<Tabs>
  <Tab title="Google Gemini Live">
    ค่าเริ่มต้น: คีย์ API จาก `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` หรือ `GOOGLE_GENERATIVE_AI_API_KEY`; โมเดล
    `gemini-2.5-flash-native-audio-preview-12-2025`; เสียง `Kore`

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

`streaming` เลือกผู้ให้บริการถอดเสียงเรียลไทม์สำหรับเสียงสดของสายโทร

พฤติกรรม runtime ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือกเสริม หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่มาพร้อมแพ็กเกจ: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการแต่ละราย
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบเรียลไทม์พร้อมแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการที่ลงทะเบียนไว้ Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

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
    ปลายทาง `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราสุ่มตัวอย่าง `8000`;
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

## TTS สำหรับการโทร

Voice Call ใช้คอนฟิกหลัก `messages.tts` สำหรับการสตรีม
เสียงพูดในการโทร คุณสามารถเขียนทับได้ใต้คอนฟิก Plugin ด้วย
**รูปแบบเดียวกัน** — โดยจะ deep-merge กับ `messages.tts`

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
**Microsoft speech จะถูกละเว้นสำหรับการโทรด้วยเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
การขนส่งของ Microsoft ในปัจจุบันไม่เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุเกี่ยวกับลักษณะการทำงาน:

- คีย์ `tts.<provider>` แบบเดิมภายในคอนฟิก Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมแซมโดย `openclaw doctor --fix`; คอนฟิกที่คอมมิตควรใช้ `tts.providers.<provider>`
- ใช้ TTS หลักเมื่อเปิดใช้การสตรีมสื่อของ Twilio; มิฉะนั้นการโทรจะถอยกลับไปใช้เสียงดั้งเดิมของผู้ให้บริการ
- หากสตรีมสื่อของ Twilio กำลังทำงานอยู่ Voice Call จะไม่ถอยกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นเสียงสองแบบ
- เมื่อ TTS สำหรับโทรศัพท์ถอยกลับไปยังผู้ให้บริการรอง Voice Call จะบันทึกคำเตือนพร้อมเชนผู้ให้บริการ (`from`, `to`, `attempts`) สำหรับการดีบัก
- เมื่อ barge-in ของ Twilio หรือการรื้อสตรีมล้างคิว TTS ที่รออยู่ คำขอเล่นเสียงที่อยู่ในคิวจะสิ้นสุดสถานะแทนที่จะทำให้ผู้โทรค้างระหว่างรอการเล่นเสียงเสร็จสิ้น

### ตัวอย่าง TTS

<Tabs>
  <Tab title="เฉพาะ TTS หลัก">
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
  <Tab title="เขียนทับเป็น ElevenLabs (เฉพาะการโทร)">
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
  <Tab title="เขียนทับโมเดล OpenAI (deep-merge)">
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

## สายโทรเข้า

นโยบายขาเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายโทรเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นหน้าจอกรอง caller-ID ที่มีความเชื่อมั่นต่ำ
Plugin จะทำให้ค่า `From` ที่ผู้ให้บริการส่งมาเป็นรูปแบบปกติและเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook ยืนยันความถูกต้องของการส่งจากผู้ให้บริการและ
ความสมบูรณ์ของเพย์โหลด แต่ไม่ได้ **พิสูจน์** ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรอง caller-ID ไม่ใช่อัตลักษณ์ผู้โทร
ที่แข็งแรง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางแยกตามหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งรายการรับสายสำหรับหมายเลขโทรศัพท์หลาย
หมายเลข และแต่ละหมายเลขควรทำงานเหมือนสายคนละสาย ตัวอย่างเช่น หมายเลขหนึ่ง
อาจใช้ผู้ช่วยส่วนตัวโทนเป็นกันเอง ขณะที่อีกหมายเลขหนึ่งใช้บุคลิกทางธุรกิจ
เอเจนต์ตอบกลับคนละตัว และเสียง TTS คนละเสียง

เส้นทางถูกเลือกจากหมายเลข `To` ที่ผู้ให้บริการส่งมา คีย์ต้องเป็นหมายเลข
E.164 เมื่อมีสายเข้า Voice Call จะระบุเส้นทางที่ตรงกันหนึ่งครั้ง
เก็บเส้นทางที่ตรงกันไว้ในระเบียนการโทร และนำคอนฟิกที่มีผลนั้นกลับมาใช้ซ้ำ
สำหรับคำทักทาย เส้นทางตอบกลับอัตโนมัติแบบคลาสสิก เส้นทางปรึกษาแบบเรียลไทม์
และการเล่นเสียง TTS หากไม่มีเส้นทางใดตรงกัน จะใช้คอนฟิก Voice Call ส่วนกลาง
สายโทรออกไม่ใช้ `numbers`; ให้ส่งเป้าหมายขาออก ข้อความ และ
เซสชันอย่างชัดเจนเมื่อเริ่มการโทร

การเขียนทับเส้นทางรองรับรายการต่อไปนี้ในปัจจุบัน:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่าเส้นทาง `tts` จะ deep-merge ทับคอนฟิก `tts` ส่วนกลางของ Voice Call ดังนั้น
โดยปกติคุณสามารถเขียนทับเฉพาะเสียงของผู้ให้บริการได้:

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

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตคำพูดแบบเข้มงวดเข้ากับ
พรอมป์ระบบ:

```text
{"spoken":"..."}
```

Voice Call แยกข้อความคำพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ทำเครื่องหมายเป็นเนื้อหา reasoning/error
- แยกวิเคราะห์ JSON ตรง, JSON ใน fence หรือคีย์ `"spoken"` แบบอินไลน์
- ถอยกลับไปใช้ข้อความธรรมดาและลบย่อหน้าเกริ่นนำที่น่าจะเป็นการวางแผน/เมตา

สิ่งนี้ช่วยให้การเล่นเสียงคำพูดมุ่งเน้นที่ข้อความสำหรับผู้โทรและหลีกเลี่ยง
การรั่วไหลของข้อความวางแผนเข้าไปในเสียง

### ลักษณะการทำงานเมื่อเริ่มการสนทนา

สำหรับสาย `conversation` ขาออก การจัดการข้อความแรกผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิว barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายแรกกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงแรกเริ่มล้มเหลว การโทรจะกลับไปเป็น `listening` และข้อความแรกยังคงอยู่ในคิวเพื่อรอลองใหม่
- การเล่นเสียงแรกเริ่มสำหรับการสตรีม Twilio จะเริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีดีเลย์เพิ่มเติม
- barge-in จะยกเลิกการเล่นเสียงที่กำลังทำงานและล้างรายการ TTS ของ Twilio ที่เข้าคิวแล้วแต่ยังไม่ได้เริ่มเล่น รายการที่ถูกล้างจะ resolve เป็น skipped เพื่อให้ลอจิกการตอบกลับถัดไปดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาเสียงแบบเรียลไทม์ใช้เทิร์นเปิดของสตรีมเรียลไทม์เอง Voice Call **จะไม่** โพสต์อัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความแรกเริ่มนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจะยังคงแนบอยู่

### ระยะผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อของ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
จบการโทรโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ในช่วงเวลานั้น การจบอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังระยะผ่อนผัน การโทรจะถูกจบเพื่อป้องกันสายที่ค้างอยู่ในสถานะแอคทีฟ

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ Webhook ปลายทาง
(ตัวอย่างเช่น สายโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้น
คือ `0` (ปิดใช้งาน)

ช่วงที่แนะนำ:

- **โปรดักชัน:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
- ตั้งค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติสามารถเสร็จสิ้นได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อมีพร็อกซีหรือทันเนลอยู่หน้า Gateway Plugin จะ
สร้าง URL สาธารณะขึ้นใหม่เพื่อการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้
ควบคุมว่าจะเชื่อถือส่วนหัวที่ส่งต่อใด:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  โฮสต์ allowlist จากส่วนหัวการส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือส่วนหัวที่ส่งต่อโดยไม่มี allowlist
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือส่วนหัวที่ส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องแต่เล่นซ้ำจะได้รับการตอบรับแต่ถูกข้ามสำหรับผลข้างเคียง
- เทิร์นการสนทนาของ Twilio มีโทเค็นต่อเทิร์นในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กคำพูดที่ค้าง/เล่นซ้ำจึงไม่สามารถตอบสนองเทิร์นถอดเสียงที่รออยู่ใหม่กว่าได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านบอดี้เมื่อส่วนหัวลายเซ็นที่ผู้ให้บริการกำหนดขาดหายไป
- Webhook ของ voice-call ใช้โปรไฟล์บอดี้ก่อนยืนยันตัวตนร่วมกัน (64 KB / 5 วินาที) พร้อมขีดจำกัด in-flight ต่อ IP ก่อนตรวจสอบลายเซ็น

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

เมื่อ Gateway กำลังทำงานอยู่แล้ว คำสั่ง `voicecall` เชิงปฏิบัติการจะมอบหมาย
ไปยัง runtime ของ voice-call ที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ bind
เซิร์ฟเวอร์ Webhook ตัวที่สอง หากติดต่อ Gateway ไม่ได้ คำสั่งจะถอยกลับไปใช้
runtime ของ CLI แบบสแตนด์อโลน

`latency` อ่าน `calls.jsonl` จากพาธพื้นที่จัดเก็บ voice-call เริ่มต้น
ใช้ `--file <path>` เพื่อชี้ไปยังล็อกอื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ไว้ที่ระเบียน N รายการล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตมี p50/p90/p99
สำหรับเวลาแฝงของเทิร์นและเวลารอฟัง

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `voice_call`.

| การกระทำ        | อาร์กิวเมนต์                              |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

รีโพนี้มาพร้อมเอกสารทักษะที่ตรงกันที่ `skills/voice-call/SKILL.md`.

## RPC ของ Gateway

| เมธอด               | อาร์กิวเมนต์                              |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` เท่านั้น การโทรในโหมดแจ้งเตือน
ควรใช้ `voicecall.dtmf` หลังจากมีสายแล้ว หากต้องใช้ตัวเลขหลังเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าล้มเหลวจากการเปิดเผย Webhook

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่รัน Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo`, `webhook-exposure` ต้องเป็นสีเขียว
`publicUrl` ที่กำหนดค่าไว้ยังล้มเหลวได้เมื่อชี้ไปยังพื้นที่เครือข่ายภายในเครื่องหรือส่วนตัว
เพราะผู้ให้บริการโทรศัพท์ไม่สามารถเรียกกลับมายังที่อยู่เหล่านั้นได้ อย่าใช้
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`.

สายออกในโหมดแจ้งเตือนของ Twilio ส่ง TwiML `<Say>` เริ่มต้นโดยตรงใน
คำขอสร้างสาย ดังนั้นข้อความพูดแรกจึงไม่ขึ้นกับการที่ Twilio ดึง TwiML จาก Webhook
ยังคงต้องมี Webhook สาธารณะสำหรับคอลแบ็กสถานะ, การโทรแบบสนทนา, DTMF ก่อนเชื่อมต่อ,
สตรีมเรียลไทม์ และการควบคุมสายหลังเชื่อมต่อ

ใช้พาธเปิดเผยสาธารณะหนึ่งรายการ:

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

หลังเปลี่ยนการกำหนดค่า ให้รีสตาร์ตหรือโหลด Gateway ใหม่ แล้วเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการทดสอบแบบไม่ส่งผลจริง เว้นแต่คุณจะส่ง `--yes`.

### ข้อมูลรับรองของผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลรับรองที่ต้องใช้:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`.

ข้อมูลรับรองต้องมีอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ภายในเครื่อง
จะไม่มีผลกับ Gateway ที่กำลังรันอยู่จนกว่าจะรีสตาร์ตหรือโหลด
สภาพแวดล้อมใหม่

### สายเริ่มต้นได้แต่ Webhook ของผู้ให้บริการไม่มาถึง

ยืนยันว่าคอนโซลของผู้ให้บริการชี้ไปยัง URL Webhook สาธารณะที่ถูกต้องทุกอักขระ:

```text
https://voice.example.com/voice/webhook
```

จากนั้นตรวจสอบสถานะรันไทม์:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

สาเหตุทั่วไป:

- `publicUrl` ชี้ไปยังพาธที่ต่างจาก `serve.path`.
- URL ทันเนลเปลี่ยนหลังจาก Gateway เริ่มทำงานแล้ว
- พร็อกซีส่งต่อคำขอแต่ตัดหรือเขียนส่วนหัว host/proto ใหม่
- ไฟร์วอลล์หรือ DNS ส่งชื่อโฮสต์สาธารณะไปยังที่อื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้งาน Plugin Voice Call

เมื่อมี reverse proxy หรือทันเนลอยู่หน้า Gateway ให้ตั้งค่า
`webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้
`webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่รู้จัก ใช้
`webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตพร็อกซีอยู่ภายใต้
การควบคุมของคุณ

### การยืนยันลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจสอบกับ URL สาธารณะที่ OpenClaw สร้างขึ้นใหม่
จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL Webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกอักขระ รวมถึง
  scheme, host และ path.
- สำหรับ URL ระดับฟรีของ ngrok ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ของทันเนลเปลี่ยน
- ตรวจสอบว่าพร็อกซีคงส่วนหัว host และ proto เดิมไว้ หรือกำหนดค่า
  `webhookSecurity.allowedHosts`.
- อย่าเปิดใช้ `skipSignatureVerification` นอกการทดสอบภายในเครื่อง

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
หมายเลขโทรเข้า Meet, PIN และ `--dtmf-sequence` สายโทรศัพท์อาจปกติดีในขณะที่
การประชุมปฏิเสธหรือไม่สนใจลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet ส่งลำดับ DTMF ของ Meet และข้อความแนะนำไปยัง `voicecall.start`.
สำหรับสาย Twilio, Voice Call จะให้บริการ TwiML ของ DTMF ก่อน เปลี่ยนเส้นทางกลับไปยัง
Webhook แล้วเปิดสตรีมสื่อเรียลไทม์เพื่อให้สร้างข้อความแนะนำที่บันทึกไว้
หลังจากผู้เข้าร่วมทางโทรศัพท์เข้าร่วมการประชุมแล้ว

ใช้ `openclaw logs --follow` สำหรับร่องรอยระยะสด การเข้าร่วม Twilio Meet
ที่ปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้ Voice Call
- Voice Call จัดเก็บ TwiML ของ DTMF ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้งานและให้บริการก่อนการจัดการเรียลไทม์
- Voice Call ให้บริการ TwiML เรียลไทม์สำหรับสาย Twilio
- บริดจ์เรียลไทม์เริ่มต้นพร้อมคำทักทายเริ่มต้นที่ถูกเข้าคิวไว้

`openclaw voicecall tail` ยังคงแสดงระเบียนสายที่คงอยู่ ซึ่งมีประโยชน์สำหรับ
สถานะสายและทรานสคริปต์ แต่ไม่ใช่ทุกการเปลี่ยนผ่านของ Webhook/เรียลไทม์จะปรากฏ
ที่นั่น

### สายเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ
`streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับสาย Twilio แบบเรียลไทม์ ให้ตรวจสอบเพิ่มเติมว่า:

- มีการโหลดและลงทะเบียน Plugin ผู้ให้บริการเรียลไทม์แล้ว
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับกระบวนการ Gateway
- `openclaw logs --follow` แสดงว่าให้บริการ TwiML เรียลไทม์แล้ว บริดจ์เรียลไทม์
  เริ่มต้นแล้ว และคำทักทายเริ่มต้นถูกเข้าคิวแล้ว

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [ข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
