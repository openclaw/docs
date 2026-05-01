---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องใช้เสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรด้วยเสียงขาออกและรับสายด้วยเสียงขาเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-01T10:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6334e5418e0fb530fc5d372ee1ada06ba987ce86bbf70746ee4ffe4c3ed4844e
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก,
การสนทนาหลายรอบ, เสียงแบบเรียลไทม์ฟูลดูเพล็กซ์, การถอดเสียงแบบสตรีมมิง
และสายเรียกเข้าพร้อมนโยบาย allowlist

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในกระบวนการ Gateway** หากคุณใช้
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
      <Tab title="จากโฟลเดอร์ภายในเครื่อง (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของเลิกใช้แล้ว เวอร์ชันแพ็กเกจนั้น
    มาจากชุดแพ็กเกจภายนอกที่เก่ากว่า ให้ใช้บิลด์ OpenClaw แบบแพ็กเกจปัจจุบัน
    หรือเส้นทางโฟลเดอร์ภายในเครื่องจนกว่าจะเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

    หลังจากนั้นให้รีสตาร์ท Gateway เพื่อให้ Plugin โหลด

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าการกำหนดค่าภายใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับรูปแบบเต็ม) อย่างน้อยต้องมี:
    `provider`, ข้อมูลรับรองของผู้ให้บริการ, `fromNumber` และ URL Webhook
    ที่เข้าถึงได้แบบสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบ
    การเปิดใช้งาน Plugin, ข้อมูลรับรองของผู้ให้บริการ, การเปิดเผย Webhook และตรวจว่า
    มีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ทำงานอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="ทดสอบแบบ smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็น dry run โดยค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกสั้นๆ จริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้องระบุได้เป็น **URL Webhook สาธารณะ**
หาก `publicUrl`, URL tunnel, URL Tailscale หรือ serve fallback
ระบุได้เป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลรับรอง
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่ายังไม่สมบูรณ์พร้อมคีย์ที่ขาดหายไป และ
ข้ามการเริ่ม runtime คำสั่ง, การเรียก RPC และเครื่องมือเอเจนต์ยังคง
ส่งคืนการกำหนดค่าผู้ให้บริการที่ขาดหายไปอย่างตรงตัวเมื่อใช้งาน

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
  <Accordion title="หมายเหตุเกี่ยวกับการเปิดเผยและความปลอดภัยของผู้ให้บริการ">
    - Twilio, Telnyx และ Plivo ต้องใช้ URL Webhook ที่ **เข้าถึงได้แบบสาธารณะ**
    - `mock` เป็นผู้ให้บริการ dev ภายในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องมี `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบภายในเครื่องเท่านั้น
    - บนระดับฟรีของ ngrok ให้ตั้งค่า `publicUrl` เป็น URL ngrok ที่ตรงกันทุกประการ การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (เอเจนต์ภายในเครื่องของ ngrok) เท่านั้น สำหรับ dev ภายในเครื่องเท่านั้น
    - URL ระดับฟรีของ Ngrok อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial ได้ หาก `publicUrl` เบี่ยงเบน ลายเซ็น Twilio จะล้มเหลว สำหรับการใช้งานจริง: ควรใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อสตรีมมิง">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ได้ยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดซ็อกเก็ต pre-start ที่ยังไม่ได้ยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดอยู่ทั้งหมด (pending + active)

  </Accordion>
  <Accordion title="การย้ายการกำหนดค่าเดิม">
    การกำหนดค่ารุ่นเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    `streaming.*` รุ่นเดิม จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    Runtime fallback ยังคงยอมรับคีย์ voice-call เก่าในตอนนี้ แต่
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

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงแบบเรียลไทม์ฟูลดูเพล็กซ์สำหรับเสียงการโทรสด
แยกจาก `streaming` ซึ่งจะส่งต่อเสียงไปยังผู้ให้บริการถอดเสียง
แบบเรียลไทม์เท่านั้น

<Warning>
`realtime.enabled` ไม่สามารถใช้ร่วมกับ `streaming.enabled` ได้ เลือก
โหมดเสียงหนึ่งโหมดต่อการโทรหนึ่งครั้ง
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- `realtime.enabled` รองรับ Twilio Media Streams
- `realtime.provider` เป็นค่าไม่บังคับ หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงแบบเรียลไทม์ที่รวมมาให้: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่า raw ที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ที่ใช้ร่วมกัน `openclaw_agent_consult` โดยค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้งาน Voice Call จะค้นหาบริบทหน่วยความจำ/เซสชันที่ทำดัชนีไว้สำหรับคำถาม consult ก่อน และส่งคืน snippet เหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยังเอเจนต์ consult แบบเต็มก็ต่อเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงแบบเรียลไทม์ลงทะเบียนอยู่เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult จะใช้เซสชันเสียงที่มีอยู่ซ้ำเมื่อใช้ได้ จากนั้น fallback ไปยังหมายเลขโทรศัพท์ของผู้โทร/ผู้รับ เพื่อให้การเรียก consult ต่อเนื่องคงบริบทไว้ระหว่างการโทร

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติไว้ที่ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือเอเจนต์ปกติ                                                      |
| `none`           | ไม่เปิดเผยเครื่องมือ consult ส่วน `realtime.tools` แบบกำหนดเองยังคงถูกส่งผ่านไปยังผู้ให้บริการเรียลไทม์                               |

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
[ผู้ให้บริการ OpenAI](/th/providers/openai) สำหรับตัวเลือกเสียงแบบเรียลไทม์
เฉพาะผู้ให้บริการ

## การถอดเสียงแบบสตรีมมิง

`streaming` เลือกผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับเสียงการโทรสด

พฤติกรรม runtime ปัจจุบัน:

- `streaming.provider` เป็นทางเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่ลงทะเบียนไว้รายแรก
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่รวมมาให้: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของแต่ละราย
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `streaming.providers.<providerId>`
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
    เอนด์พอยต์ `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราสุ่มตัวอย่าง `8000`;
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

Voice Call ใช้การกำหนดค่า `messages.tts` ของแกนหลักสำหรับการสตรีม
เสียงพูดในการโทร คุณสามารถแทนที่ได้ใต้คอนฟิก Plugin ด้วย
**รูปแบบเดียวกัน** — โดยจะผสานเชิงลึกกับ `messages.tts`

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
ทรานสปอร์ต Microsoft ปัจจุบันไม่ได้เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายในคอนฟิก Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมแซมโดย `openclaw doctor --fix`; คอนฟิกที่คอมมิตควรใช้ `tts.providers.<provider>`
- จะใช้ TTS แกนหลักเมื่อเปิดใช้การสตรีมสื่อ Twilio; มิฉะนั้นการโทรจะย้อนกลับไปใช้เสียงแบบเนทีฟของผู้ให้บริการ
- หากสตรีมสื่อ Twilio ทำงานอยู่แล้ว Voice Call จะไม่ย้อนกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนการผสมสองเส้นทางการเล่นเสียง
- เมื่อ TTS สำหรับโทรศัพท์ย้อนกลับไปใช้ผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมลำดับผู้ให้บริการ (`from`, `to`, `attempts`) สำหรับการดีบัก
- เมื่อ Twilio barge-in หรือการรื้อถอนสตรีมล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่อยู่ในคิวจะสิ้นสุดสถานะแทนที่จะทำให้ผู้โทรค้างอยู่ระหว่างรอการเล่นเสียงเสร็จสมบูรณ์

### ตัวอย่าง TTS

<Tabs>
  <Tab title="TTS แกนหลักเท่านั้น">
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
  <Tab title="แทนที่เป็น ElevenLabs (เฉพาะการโทร)">
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
  <Tab title="แทนที่โมเดล OpenAI (ผสานเชิงลึก)">
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
Plugin จะทำให้ค่า `From` ที่ผู้ให้บริการส่งมาอยู่ในรูปแบบมาตรฐานและเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook จะยืนยันการส่งจากผู้ให้บริการและ
ความสมบูรณ์ของเพย์โหลด แต่ **ไม่ได้** พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่อัตลักษณ์
ผู้โทรที่แข็งแรง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบเอเจนต์ ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### สัญญาเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตเสียงพูดแบบเข้มงวดใน
พรอมป์ระบบ:

```text
{"spoken":"..."}
```

Voice Call แยกข้อความเสียงพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ทำเครื่องหมายเป็นเนื้อหา reasoning/error
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน fenced block หรือคีย์ `"spoken"` แบบอินไลน์
- ย้อนกลับไปใช้ข้อความธรรมดาและลบย่อหน้านำเข้าที่ดูเป็นการวางแผน/เมตาออก

สิ่งนี้ทำให้การเล่นเสียงพูดมุ่งเน้นข้อความที่ส่งถึงผู้โทรและหลีกเลี่ยง
การรั่วไหลของข้อความวางแผนเข้าไปในเสียง

### พฤติกรรมเริ่มต้นการสนทนา

สำหรับการโทร `conversation` ขาออก การจัดการข้อความแรกจะผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิวจาก barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงเริ่มต้นล้มเหลว การโทรจะกลับไปที่ `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อลองใหม่
- การเล่นเสียงเริ่มต้นสำหรับการสตรีม Twilio จะเริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีการหน่วงเวลาเพิ่มเติม
- Barge-in จะยกเลิกการเล่นเสียงที่ทำงานอยู่และล้างรายการ Twilio TTS ที่อยู่ในคิวแต่ยังไม่ได้เล่น รายการที่ถูกล้างจะ resolve เป็น skipped เพื่อให้ตรรกะการตอบกลับต่อเนื่องทำงานต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาเสียงแบบเรียลไทม์ใช้เทิร์นเปิดของสตรีมเรียลไทม์เอง Voice Call จะ **ไม่** โพสต์การอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความเริ่มต้นนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจึงยังคงเชื่อมต่ออยู่

### ระยะผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
สิ้นสุดการโทรอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ภายในช่วงเวลานั้น การสิ้นสุดอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังพ้นระยะผ่อนผัน การโทรจะถูกสิ้นสุดเพื่อป้องกันการโทรที่ยังค้างเป็น active

## ตัวเก็บกวาดการโทรค้าง

ใช้ `staleCallReaperSeconds` เพื่อสิ้นสุดการโทรที่ไม่เคยได้รับ Webhook
ปลายทาง (เช่น การโทรโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้น
คือ `0` (ปิดใช้งาน)

ช่วงที่แนะนำ:

- **โปรดักชัน:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
- ให้ค่านี้ **สูงกว่า `maxDurationSeconds`** เพื่อให้การโทรปกติจบได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อมีพร็อกซีหรือทันเนลอยู่หน้า Gateway, Plugin จะสร้าง URL สาธารณะใหม่
สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่าเฮดเดอร์ forwarded ใด
เชื่อถือได้:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  รายชื่อโฮสต์ที่อนุญาตจากเฮดเดอร์ forwarding
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือเฮดเดอร์ forwarded โดยไม่มี allowlist
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือเฮดเดอร์ forwarded เฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องแต่ถูกเล่นซ้ำจะได้รับการยอมรับแต่ข้ามผลข้างเคียง
- เทิร์นการสนทนา Twilio มีโทเค็นต่อเทิร์นในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กเสียงพูดที่ค้าง/ถูกเล่นซ้ำจึงไม่สามารถตอบสนองเทิร์น transcript ที่รอดำเนินการใหม่กว่าได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านบอดีเมื่อไม่มีเฮดเดอร์ลายเซ็นที่ผู้ให้บริการกำหนด
- Webhook voice-call ใช้โปรไฟล์บอดีก่อนยืนยันตัวตนที่ใช้ร่วมกัน (64 KB / 5 วินาที) พร้อมเพดานคำขอที่กำลังดำเนินอยู่ต่อ IP ก่อนการตรวจสอบลายเซ็น

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

เมื่อ Gateway กำลังทำงานอยู่แล้ว คำสั่งปฏิบัติการ `voicecall` จะมอบหมายงาน
ไปยังรันไทม์ voice-call ที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ bind
เซิร์ฟเวอร์ Webhook ตัวที่สอง หากเข้าถึง Gateway ไม่ได้ คำสั่งจะย้อนกลับไปใช้
รันไทม์ CLI แบบ standalone

`latency` อ่าน `calls.jsonl` จากพาธจัดเก็บ voice-call เริ่มต้น
ใช้ `--file <path>` เพื่อชี้ไปยังบันทึกอื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ไว้ที่ N ระเบียนสุดท้าย (ค่าเริ่มต้น 200) เอาต์พุตรวม p50/p90/p99
สำหรับ latency ของเทิร์นและเวลา listen-wait

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

รีโปนี้มาพร้อมเอกสาร skill ที่ตรงกันที่ `skills/voice-call/SKILL.md`

## Gateway RPC

| เมธอด               | อาร์กิวเมนต์                              |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` การโทรโหมดแจ้งเตือน
ควรใช้ `voicecall.dtmf` หลังจากมีการโทรแล้ว หากต้องใช้ตัวเลขหลังเชื่อมต่อ

## การแก้ไขปัญหา

### การตั้งค่าล้มเหลวในการเปิดเผย Webhook

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่เรียกใช้ Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo` ค่า `webhook-exposure` ต้องเป็นสีเขียว `publicUrl` ที่กำหนดค่าไว้ยังคงล้มเหลวได้เมื่อชี้ไปยังพื้นที่เครือข่ายภายในหรือส่วนตัว เพราะผู้ให้บริการโทรศัพท์ไม่สามารถเรียกกลับเข้ามายังที่อยู่เหล่านั้นได้ ห้ามใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

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

### ข้อมูลประจำตัวของผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลประจำตัวที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ `fromNumber`
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`

ข้อมูลประจำตัวต้องมีอยู่บนโฮสต์ของ Gateway การแก้ไขโปรไฟล์เชลล์ในเครื่องจะไม่มีผลกับ Gateway ที่กำลังทำงานอยู่จนกว่าจะรีสตาร์ตหรือโหลดสภาพแวดล้อมใหม่

### การโทรเริ่มต้นได้แต่ Webhook ของผู้ให้บริการไม่มาถึง

ยืนยันว่าคอนโซลของผู้ให้บริการชี้ไปยัง URL Webhook สาธารณะที่ถูกต้องตรงกันทุกประการ:

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
- URL ของ tunnel เปลี่ยนหลังจาก Gateway เริ่มทำงาน
- พร็อกซีส่งต่อคำขอแต่ลบหรือเขียนทับส่วนหัว host/proto
- ไฟร์วอลล์หรือ DNS ส่งเส้นทางชื่อโฮสต์สาธารณะไปยังที่อื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้ Voice Call Plugin

เมื่อมี reverse proxy หรือ tunnel อยู่หน้า Gateway ให้ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้ `webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่ทราบแน่นอน ใช้ `webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตของพร็อกซีอยู่ภายใต้การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจเทียบกับ URL สาธารณะที่ OpenClaw สร้างขึ้นใหม่จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL Webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกประการ รวมถึง scheme, host และ path
- สำหรับ URL ของ ngrok ระดับฟรี ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ของ tunnel เปลี่ยน
- ตรวจสอบให้แน่ใจว่าพร็อกซีคงส่วนหัว host และ proto เดิมไว้ หรือกำหนดค่า `webhookSecurity.allowedHosts`
- อย่าเปิดใช้ `skipSignatureVerification` นอกเหนือจากการทดสอบภายในเครื่อง

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมผ่านการโทรเข้า Twilio ก่อนอื่นให้ตรวจสอบ Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบการขนส่งของ Google Meet โดยตรง:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบหมายเลขโทรเข้า Meet, PIN และ `--dtmf-sequence` การโทรศัพท์อาจทำงานปกติได้ในขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet ส่งลำดับ DTMF ของ Meet และข้อความแนะนำไปยัง `voicecall.start` สำหรับการโทร Twilio นั้น Voice Call จะให้บริการ DTMF TwiML ก่อน จากนั้นเปลี่ยนเส้นทางกลับไปยัง Webhook แล้วจึงเปิดสตรีมสื่อแบบเรียลไทม์ เพื่อให้ข้อความแนะนำที่บันทึกไว้ถูกสร้างขึ้นหลังจากผู้เข้าร่วมทางโทรศัพท์เข้าร่วมการประชุมแล้ว

ใช้ `openclaw logs --follow` สำหรับ trace ช่วงการทำงานสด การเข้าร่วม Twilio Meet ที่ทำงานปกติจะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้ Voice Call
- Voice Call จัดเก็บ TwiML ของ DTMF ก่อนเชื่อมต่อ
- Twilio TwiML เริ่มต้นถูกใช้งานและให้บริการก่อนการจัดการแบบเรียลไทม์
- Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับการโทร Twilio
- สะพานเชื่อมแบบเรียลไทม์เริ่มต้นพร้อมคิวคำทักทายเริ่มต้น

`openclaw voicecall tail` ยังคงแสดงระเบียนการโทรที่จัดเก็บไว้ ซึ่งมีประโยชน์สำหรับสถานะการโทรและทรานสคริปต์ แต่ไม่ใช่ทุกการเปลี่ยนผ่านของ Webhook/เรียลไทม์จะปรากฏที่นั่น

### การโทรแบบเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ `streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับการโทร Twilio แบบเรียลไทม์ ให้ตรวจสอบเพิ่มเติมว่า:

- Plugin ผู้ให้บริการแบบเรียลไทม์ถูกโหลดและลงทะเบียนแล้ว
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับโปรเซส Gateway
- `openclaw logs --follow` แสดงว่ามีการให้บริการ TwiML แบบเรียลไทม์ สะพานเชื่อมแบบเรียลไทม์เริ่มต้นแล้ว และคำทักทายเริ่มต้นถูกเข้าคิวแล้ว

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [ข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
