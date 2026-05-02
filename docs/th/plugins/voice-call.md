---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงสำหรับระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายสนทนาเสียงขาเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-02T10:26:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก,
การสนทนาหลายรอบ, เสียงเรียลไทม์แบบฟูลดูเพล็กซ์, การถอดเสียงแบบสตรีมมิง,
และสายขาเข้าพร้อมนโยบายรายการอนุญาต

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในกระบวนการ Gateway** หากคุณใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่รัน
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
      <Tab title="จากโฟลเดอร์ในเครื่อง (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว เวอร์ชันแพ็กเกจนั้น
    มาจากชุดแพ็กเกจภายนอกที่เก่ากว่า ให้ใช้บิลด์ OpenClaw
    ที่แพ็กเกจแล้วในปัจจุบันหรือพาธโฟลเดอร์ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

    รีสตาร์ท Gateway หลังจากนั้นเพื่อให้ Plugin โหลด

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าคอนฟิกใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับรูปแบบเต็ม) อย่างน้อยต้องมี:
    `provider`, ข้อมูลรับรองของผู้ให้บริการ, `fromNumber` และ URL Webhook
    ที่เข้าถึงได้จากสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ง่ายในบันทึกแชตและเทอร์มินัล โดยตรวจสอบ
    การเปิดใช้ Plugin, ข้อมูลรับรองของผู้ให้บริการ, การเปิดเผย Webhook และตรวจว่า
    มีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ทำงานอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="ทดสอบแบบ Smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็น dry run โดยค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกแบบสั้นจริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve เป็น **URL Webhook สาธารณะ**
หาก `publicUrl`, URL tunnel, URL Tailscale หรือ serve fallback
resolve เป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการเครือข่ายโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลรับรอง
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่ายังไม่สมบูรณ์พร้อมคีย์ที่ขาดหาย
และข้ามการเริ่ม runtime คำสั่ง การเรียก RPC และเครื่องมือของเอเจนต์ยังคง
คืนค่าคอนฟิกผู้ให้บริการที่ขาดหายอย่างตรงไปตรงมาเมื่อใช้งาน

<Note>
ข้อมูลรับรอง voice-call รองรับ SecretRefs `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะ resolve ผ่านพื้นผิว SecretRef มาตรฐาน ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
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
  <Accordion title="หมายเหตุเกี่ยวกับการเปิดเผยผู้ให้บริการและความปลอดภัย">
    - Twilio, Telnyx และ Plivo ทั้งหมดต้องใช้ URL Webhook ที่ **เข้าถึงได้จากสาธารณะ**
    - `mock` คือผู้ให้บริการ dev ในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
    - บน ngrok free tier ให้ตั้ง `publicUrl` เป็น URL ngrok ที่ตรงกันทุกประการ การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (เอเจนต์ ngrok ในเครื่อง) สำหรับ dev ในเครื่องเท่านั้น
    - URL ngrok free-tier อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial ได้ หาก `publicUrl` เลื่อนไป ลายเซ็น Twilio จะล้มเหลว Production: ควรใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อสตรีมมิง">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ได้ยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ได้ยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดทั้งหมด (pending + active)

  </Accordion>
  <Accordion title="การย้ายคอนฟิกแบบเดิม">
    คอนฟิกเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    `streaming.*` แบบเดิม จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    runtime fallback ยังคงยอมรับคีย์ voice-call แบบเก่าในตอนนี้ แต่
    พาธการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim เป็น
    ชั่วคราว

    คีย์สตรีมมิงที่ย้ายอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## ขอบเขตเซสชัน

โดยค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้การโทรซ้ำจาก
ผู้โทรรายเดิมยังคงมีหน่วยความจำการสนทนา ตั้งค่า `sessionScope: "per-call"` เมื่อ
การโทรผ่านผู้ให้บริการเครือข่ายโทรศัพท์แต่ละครั้งควรเริ่มด้วยบริบทใหม่ เช่น reception,
booking, IVR หรือโฟลว์บริดจ์ Google Meet ที่หมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมที่ต่างกัน

## การสนทนาด้วยเสียงเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์แบบฟูลดูเพล็กซ์สำหรับเสียงสายสด
โดยแยกจาก `streaming` ซึ่งส่งต่อเสียงไปยังผู้ให้บริการถอดเสียง
เรียลไทม์เท่านั้น

<Warning>
`realtime.enabled` ไม่สามารถใช้ร่วมกับ `streaming.enabled` ได้ เลือก
โหมดเสียงหนึ่งโหมดต่อการโทรหนึ่งครั้ง
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงเรียลไทม์ที่บันเดิลมา: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของแต่ละราย
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ `openclaw_agent_consult` ที่ใช้ร่วมกันตามค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้ Voice Call จะค้นหาหน่วยความจำที่จัดทำดัชนี/บริบทเซสชันสำหรับคำถาม consult ก่อน แล้วคืนสนิปเป็ตเหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยังเอเจนต์ consult เต็มรูปแบบเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงเรียลไทม์ลงทะเบียนอยู่เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult จะใช้เซสชันการโทรที่จัดเก็บไว้ซ้ำเมื่อมี จากนั้น fallback ไปยัง `sessionScope` ที่กำหนดค่าไว้ (`per-phone` ตามค่าเริ่มต้น หรือ `per-call` สำหรับการโทรที่แยกบริบท)

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติให้ใช้ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือเอเจนต์ปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือ consult `realtime.tools` แบบกำหนดเองยังคงถูกส่งต่อไปยังผู้ให้บริการเรียลไทม์                               |

### ตัวอย่างผู้ให้บริการเรียลไทม์

<Tabs>
  <Tab title="Google Gemini Live">
    ค่าเริ่มต้น: API key จาก `realtime.providers.google.apiKey`,
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
[ผู้ให้บริการ OpenAI](/th/providers/openai) สำหรับตัวเลือกเสียงเรียลไทม์เฉพาะผู้ให้บริการ

## การถอดเสียงแบบสตรีมมิง

`streaming` เลือกผู้ให้บริการถอดเสียงเรียลไทม์สำหรับเสียงสายสด

พฤติกรรม runtime ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือกเสริม หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบ realtime รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบ realtime ที่รวมมาด้วย: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` สำหรับสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบ realtime พร้อมแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการใดลงทะเบียน Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ทั้ง Plugin ล้มเหลว

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
    endpoint `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราสุ่มตัวอย่าง `8000`;
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

Voice Call ใช้คอนฟิกหลัก `messages.tts` สำหรับเสียงพูดแบบสตรีมมิง
ในการโทร คุณสามารถ override ได้ภายใต้คอนฟิก Plugin ด้วย
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
**ระบบเสียงพูดของ Microsoft จะถูกละเว้นสำหรับการโทรเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
transport ของ Microsoft ปัจจุบันไม่ได้เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุพฤติกรรม:

- คีย์เดิม `tts.<provider>` ภายในคอนฟิก Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมโดย `openclaw doctor --fix`; คอนฟิกที่ commit แล้วควรใช้ `tts.providers.<provider>`
- Core TTS จะถูกใช้เมื่อเปิดใช้ Twilio media streaming; มิฉะนั้นการโทรจะ fallback ไปใช้เสียง native ของผู้ให้บริการ
- หาก Twilio media stream ทำงานอยู่แล้ว Voice Call จะไม่ fallback ไปยัง TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นเสียงสองแบบ
- เมื่อ TTS สำหรับโทรศัพท์ fallback ไปยังผู้ให้บริการรอง Voice Call จะบันทึกคำเตือนพร้อมลำดับผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อการดีบัก
- เมื่อ Twilio barge-in หรือการรื้อสตรีมล้างคิว TTS ที่ค้างอยู่ คำขอเล่นเสียงที่อยู่ในคิวจะถูกปิดสถานะแทนที่จะปล่อยให้ผู้โทรค้างรอการเล่นเสียงให้เสร็จ

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
Plugin จะ normalize ค่า `From` ที่ผู้ให้บริการส่งมาและเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook จะยืนยันการส่งจากผู้ให้บริการและ
ความถูกต้องครบถ้วนของ payload แต่ **ไม่ได้** พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรอง caller-ID ไม่ใช่ตัวตนผู้โทร
ที่แข็งแรง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบ agent ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางต่อหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งตัวรับสายสำหรับหมายเลขโทรศัพท์หลาย
หมายเลข และแต่ละหมายเลขควรทำงานเหมือนสายที่ต่างกัน ตัวอย่างเช่น หมายเลขหนึ่ง
อาจใช้ผู้ช่วยส่วนตัวแบบเป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิกธุรกิจ
agent ตอบกลับคนละตัว และเสียง TTS คนละเสียง

เส้นทางจะถูกเลือกจากหมายเลข `To` ที่โทรเข้า ซึ่งผู้ให้บริการส่งมา คีย์ต้องเป็น
หมายเลข E.164 เมื่อมีสายเข้า Voice Call จะ resolve เส้นทางที่ตรงกันหนึ่งครั้ง
เก็บเส้นทางที่ตรงกันไว้ในระเบียนการโทร และใช้คอนฟิกที่มีผลนั้นซ้ำ
สำหรับคำทักทาย เส้นทางตอบกลับอัตโนมัติแบบคลาสสิก เส้นทางปรึกษาแบบ realtime และการเล่นเสียง
TTS หากไม่มีเส้นทางตรงกัน จะใช้คอนฟิก Voice Call ส่วนกลาง
การโทรขาออกไม่ใช้ `numbers`; ให้ส่งเป้าหมายขาออก ข้อความ และ
session อย่างชัดเจนเมื่อเริ่มการโทร

Route overrides รองรับในปัจจุบัน:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่า route `tts` จะ deep-merge ทับคอนฟิก Voice Call `tts` ส่วนกลาง ดังนั้น
โดยทั่วไปคุณสามารถ override เฉพาะเสียงของผู้ให้บริการได้:

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

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตคำพูดที่เข้มงวดไว้กับ
system prompt:

```text
{"spoken":"..."}
```

Voice Call ดึงข้อความคำพูดแบบป้องกันความผิดพลาด:

- ละเว้น payload ที่ทำเครื่องหมายเป็นเนื้อหา reasoning/error
- แยกวิเคราะห์ JSON โดยตรง, fenced JSON หรือคีย์ `"spoken"` แบบ inline
- fallback ไปยังข้อความธรรมดาและลบย่อหน้านำที่น่าจะเป็นการวางแผน/เมตา

วิธีนี้ทำให้การเล่นเสียงพูดมุ่งเน้นข้อความสำหรับผู้โทรและหลีกเลี่ยง
การรั่วไหลข้อความวางแผนลงในเสียง

### พฤติกรรมการเริ่มต้นบทสนทนา

สำหรับการโทร `conversation` ขาออก การจัดการข้อความแรกจะผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิว barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายแรกกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงแรกเริ่มล้มเหลว การโทรจะกลับสู่ `listening` และข้อความแรกจะยังอยู่ในคิวเพื่อ retry
- การเล่นเสียงแรกเริ่มสำหรับ Twilio streaming จะเริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีดีเลย์เพิ่มเติม
- Barge-in จะยกเลิกการเล่นเสียงที่ทำงานอยู่และล้างรายการ Twilio TTS ที่อยู่ในคิวแต่ยังไม่ได้เล่น รายการที่ถูกล้างจะ resolve เป็น skipped ดังนั้นลอจิกการตอบกลับต่อเนื่องจึงดำเนินต่อได้โดยไม่ต้องรอเสียงที่ไม่มีวันเล่น
- บทสนทนาเสียงแบบ realtime ใช้ turn เปิดของ realtime stream เอง Voice Call จะ **ไม่** โพสต์การอัปเดต TwiML `<Say>` เดิมสำหรับข้อความแรกเริ่มนั้น ดังนั้น session `<Connect><Stream>` ขาออกจึงยังเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อ Twilio stream ตัดการเชื่อมต่อ

เมื่อ Twilio media stream ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
สิ้นสุดการโทรโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ระหว่างช่วงเวลานั้น การสิ้นสุดอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมใดลงทะเบียนใหม่หลังพ้นช่วงผ่อนผัน การโทรจะถูกสิ้นสุดเพื่อป้องกันสายที่ยัง active ค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อสิ้นสุดสายที่ไม่เคยได้รับ Webhook ปลายทาง
(ตัวอย่างเช่น สายในโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้น
คือ `0` (ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
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

เมื่อมี proxy หรือ tunnel อยู่หน้า Gateway, Plugin จะ
สร้าง URL สาธารณะขึ้นใหม่สำหรับการตรวจสอบ signature ตัวเลือกเหล่านี้
ควบคุมว่าจะเชื่อถือ header ที่ forward มาใดบ้าง:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  โฮสต์ allowlist จาก header การ forward
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือ header ที่ forward มาโดยไม่มี allowlist
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือ header ที่ forward มาเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการเท่านั้น
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกัน replay** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูก replay และยัง valid จะได้รับการยืนยันแต่ข้าม side effect
- turn ของบทสนทนา Twilio มี token ต่อ turn ใน callback `<Gather>` ดังนั้น callback คำพูดที่เก่าหรือถูก replay จะไม่สามารถตอบสนอง turn transcript ที่รออยู่ใหม่กว่าได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body เมื่อไม่มี header signature ที่ผู้ให้บริการกำหนด
- Webhook ของ voice-call ใช้โปรไฟล์ body ก่อนยืนยันตัวตนที่ใช้ร่วมกัน (64 KB / 5 วินาที) พร้อม cap in-flight ต่อ IP ก่อนการตรวจสอบ signature

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

เมื่อ Gateway ทำงานอยู่แล้ว คำสั่ง `voicecall` เชิงปฏิบัติการจะมอบหมาย
ไปยัง runtime voice-call ที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ bind
เซิร์ฟเวอร์ Webhook ตัวที่สอง หากไม่มี Gateway ที่เข้าถึงได้ คำสั่งจะ fallback ไปยัง
runtime CLI แบบ standalone

`latency` อ่าน `calls.jsonl` จากพาธจัดเก็บการโทรด้วยเสียงเริ่มต้น
ใช้ `--file <path>` เพื่อชี้ไปยังล็อกอื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ไว้ที่ N ระเบียนล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตรวม p50/p90/p99
สำหรับเวลาแฝงของเทิร์นและเวลารอฟัง

## เครื่องมือ Agent

ชื่อเครื่องมือ: `voice_call`.

| การดำเนินการ | อาร์กิวเมนต์ |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

repo นี้มาพร้อมเอกสาร skill ที่สอดคล้องกันที่ `skills/voice-call/SKILL.md`.

## Gateway RPC

| เมธอด | อาร์กิวเมนต์ |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` เท่านั้น การโทรในโหมดแจ้งเตือน
ควรใช้ `voicecall.dtmf` หลังจากมีการโทรแล้ว หากต้องใช้ตัวเลขหลังเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าล้มเหลวที่การเปิดเผย Webhook

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่เรียกใช้ Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo`, `webhook-exposure` ต้องเป็นสีเขียว
`publicUrl` ที่กำหนดค่าไว้จะยังล้มเหลวเมื่อชี้ไปยังพื้นที่เครือข่ายภายในหรือส่วนตัว
เพราะผู้ให้บริการโทรศัพท์ไม่สามารถเรียกกลับเข้ามายังที่อยู่เหล่านั้นได้ อย่าใช้
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`.

การโทรออกโหมดแจ้งเตือนของ Twilio ส่ง `<Say>` TwiML เริ่มต้นโดยตรงใน
คำขอสร้างการโทร ดังนั้นข้อความพูดแรกจึงไม่ขึ้นกับการที่ Twilio ดึง Webhook TwiML
ยังคงต้องมี Webhook สาธารณะสำหรับ status callback, การโทรสนทนา, DTMF ก่อนเชื่อมต่อ,
สตรีมแบบเรียลไทม์ และการควบคุมการโทรหลังเชื่อมต่อ

ใช้เส้นทางเปิดเผยสาธารณะอย่างใดอย่างหนึ่ง:

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

`voicecall smoke` เป็นการทดสอบแบบไม่ส่งผลจริง เว้นแต่คุณส่ง `--yes`.

### ข้อมูลรับรองของผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลรับรองที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`.

ข้อมูลรับรองต้องมีอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ภายในเครื่อง
จะไม่ส่งผลต่อ Gateway ที่กำลังทำงานอยู่ จนกว่าจะรีสตาร์ตหรือโหลด
สภาพแวดล้อมใหม่

### การโทรเริ่มต้นได้แต่ Webhook ของผู้ให้บริการไม่มาถึง

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

- `publicUrl` ชี้ไปยังพาธที่ต่างจาก `serve.path`.
- URL tunnel เปลี่ยนหลังจาก Gateway เริ่มทำงาน
- proxy ส่งต่อคำขอ แต่ตัดหรือเขียน host/proto header ใหม่
- firewall หรือ DNS ส่งชื่อโฮสต์สาธารณะไปยังที่อื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้ Voice Call Plugin

เมื่อมี reverse proxy หรือ tunnel อยู่หน้า Gateway ให้ตั้งค่า
`webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้
`webhookSecurity.trustedProxyIPs` สำหรับที่อยู่ proxy ที่รู้จัก ใช้
`webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขต proxy อยู่ภายใต้
การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจสอบกับ URL สาธารณะที่ OpenClaw สร้างขึ้นใหม่
จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL Webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึง
  scheme, host และ path.
- สำหรับ URL ของ ngrok free-tier ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ tunnel เปลี่ยน
- ตรวจสอบว่า proxy เก็บ host และ proto header เดิมไว้ หรือกำหนดค่า
  `webhookSecurity.allowedHosts`.
- อย่าเปิดใช้ `skipSignatureVerification` นอกการทดสอบภายในเครื่อง

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมแบบโทรเข้า Twilio ขั้นแรกให้ยืนยัน Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นยืนยันการรับส่งของ Google Meet โดยตรง:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบ
หมายเลขโทรเข้า Meet, PIN และ `--dtmf-sequence` การโทรศัพท์อาจทำงานปกติ
ในขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet ส่งลำดับ DTMF ของ Meet และข้อความแนะนำไปยัง `voicecall.start`.
สำหรับการโทร Twilio, Voice Call จะให้บริการ DTMF TwiML ก่อน เปลี่ยนเส้นทางกลับไปยัง
Webhook แล้วเปิดสตรีมสื่อแบบเรียลไทม์ เพื่อให้ข้อความแนะนำที่บันทึกไว้ถูกสร้างขึ้น
หลังจากผู้เข้าร่วมทางโทรศัพท์เข้าร่วมการประชุมแล้ว

ใช้ `openclaw logs --follow` สำหรับ trace ช่วงสด การเข้าร่วม Twilio Meet
ที่ปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้กับ Voice Call
- Voice Call จัดเก็บ DTMF TwiML ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้และให้บริการก่อนการจัดการแบบเรียลไทม์
- Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับการโทร Twilio
- bridge แบบเรียลไทม์เริ่มต้นพร้อมคำทักทายเริ่มต้นที่อยู่ในคิว

`openclaw voicecall tail` ยังคงแสดงระเบียนการโทรที่บันทึกถาวรไว้ มีประโยชน์สำหรับ
สถานะการโทรและทรานสคริปต์ แต่ไม่ใช่ทุกการเปลี่ยนผ่านของ Webhook/เรียลไทม์
จะปรากฏที่นั่น

### การโทรแบบเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ
`streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับการโทร Twilio แบบเรียลไทม์ ให้ตรวจสอบด้วยว่า:

- มี Plugin ผู้ให้บริการแบบเรียลไทม์โหลดและลงทะเบียนอยู่
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับโปรเซส Gateway
- `openclaw logs --follow` แสดงว่า TwiML แบบเรียลไทม์ถูกให้บริการ, bridge แบบเรียลไทม์
  เริ่มต้นแล้ว และคำทักทายเริ่มต้นถูกใส่คิวแล้ว

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [การแปลงข้อความเป็นเสียง](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
