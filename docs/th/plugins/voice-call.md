---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่า หรือพัฒนา Plugin voice-call
summary: 'Plugin Voice Call: การโทรออก + รับสายผ่าน Twilio/Telnyx/Plivo (การติดตั้ง Plugin + config + CLI)'
title: Plugin Voice call
x-i18n:
    generated_at: "2026-04-25T13:56:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนแบบโทรออกและ
การสนทนาหลายรอบพร้อมนโยบายสายเรียกเข้า

provider ปัจจุบัน:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (สำหรับพัฒนา/ไม่มีเครือข่าย)

ภาพรวมแบบเข้าใจเร็ว:

- ติดตั้ง Plugin
- รีสตาร์ต Gateway
- กำหนดค่าภายใต้ `plugins.entries.voice-call.config`
- ใช้ `openclaw voicecall ...` หรือ tool `voice_call`

## ตำแหน่งที่รัน (local เทียบกับ remote)

Plugin Voice Call รัน **ภายในโปรเซสของ Gateway**

หากคุณใช้ Gateway แบบ remote ให้ติดตั้ง/กำหนดค่า Plugin บน **เครื่องที่รัน Gateway** แล้วจึงรีสตาร์ต Gateway เพื่อโหลดมัน

## การติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm (แนะนำ)

```bash
openclaw plugins install @openclaw/voice-call
```

จากนั้นให้รีสตาร์ต Gateway

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ภายในเครื่อง (สำหรับพัฒนา, ไม่ต้องคัดลอก)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

จากนั้นให้รีสตาร์ต Gateway

## Config

ตั้งค่า config ภายใต้ `plugins.entries.voice-call.config`:

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

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // คีย์สาธารณะของ webhook Telnyx จาก Telnyx Mission Control Portal
            // (สตริง Base64; ตั้งค่าได้ผ่าน TELNYX_PUBLIC_KEY เช่นกัน)
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

          // ความปลอดภัยของ Webhook (แนะนำสำหรับ tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // การเปิดเผยสู่สาธารณะ (เลือกหนึ่งอย่าง)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // ไม่บังคับ; หากไม่ตั้งจะใช้ provider ถอดเสียงแบบ realtime ที่ลงทะเบียนไว้ตัวแรก
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // ไม่บังคับหากตั้ง OPENAI_API_KEY ไว้แล้ว
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // ไม่บังคับ; หากไม่ตั้งจะใช้ provider เสียงแบบ realtime ที่ลงทะเบียนไว้ตัวแรก
            toolPolicy: "safe-read-only",
            providers: {
              google: {
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

ตรวจสอบการตั้งค่าก่อนทดสอบกับ provider จริง:

```bash
openclaw voicecall setup
```

เอาต์พุตค่าเริ่มต้นอ่านง่ายในบันทึกแชตและเซสชันเทอร์มินัล โดยจะตรวจสอบว่า
Plugin ถูกเปิดใช้งานอยู่หรือไม่ มี provider และข้อมูลรับรองครบหรือไม่ มีการกำหนด
การเปิดเผย Webhook แล้วหรือไม่ และมี audio mode ทำงานอยู่เพียงโหมดเดียว ใช้
`openclaw voicecall setup --json` สำหรับสคริปต์

สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve เป็น URL ของ Webhook ที่เข้าถึงได้จากสาธารณะ หาก
`publicUrl`, URL ของ tunnel, URL ของ Tailscale หรือ serve fallback ที่กำหนดไว้ resolve ไปยัง
loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะเริ่ม provider
ที่ไม่สามารถรับ carrier webhook จริงได้

สำหรับ smoke test ที่คาดเดาได้และไม่ทำให้แปลกใจ ให้รัน:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

คำสั่งที่สองยังคงเป็น dry run หากต้องการโทรออกแบบ notify สั้น ๆ
ให้เพิ่ม `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

หมายเหตุ:

- Twilio/Telnyx ต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้จากสาธารณะ**
- Plivo ต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้จากสาธารณะ**
- `mock` เป็น provider สำหรับการพัฒนาในเครื่อง (ไม่มีการเรียกเครือข่าย)
- หาก config รุ่นเก่ายังใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI แบบเดิมใน `streaming.*` ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่
- Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
- `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
- หากคุณใช้ ngrok free tier ให้ตั้ง `publicUrl` เป็น URL ngrok ที่ตรงกันทุกประการ; การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะเมื่อ** `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (ngrok local agent) ใช้สำหรับการพัฒนาในเครื่องเท่านั้น
- URL ของ ngrok free tier อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial; หาก `publicUrl` คลาดเคลื่อน การตรวจสอบลายเซ็นของ Twilio จะล้มเหลว สำหรับ production ควรใช้โดเมนที่คงที่หรือ Tailscale funnel
- `realtime.enabled` จะเริ่มการสนทนาเสียงแบบ voice-to-voice เต็มรูปแบบ; อย่าเปิดใช้งานพร้อมกับ `streaming.enabled`
- ค่าเริ่มต้นด้านความปลอดภัยของ streaming:
  - `streaming.preStartTimeoutMs` จะปิด socket ที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
- `streaming.maxPendingConnections` จำกัดจำนวน socket ก่อนเริ่มต้นที่ยังไม่ยืนยันตัวตนทั้งหมด
- `streaming.maxPendingConnectionsPerIp` จำกัดจำนวน socket ก่อนเริ่มต้นที่ยังไม่ยืนยันตัวตนต่อ source IP
- `streaming.maxConnections` จำกัดจำนวน socket ของ media stream ที่เปิดอยู่ทั้งหมด (pending + active)
- fallback ระหว่างรันไทม์ยังคงรับคีย์ voice-call รุ่นเก่าเหล่านั้นอยู่ในตอนนี้ แต่เส้นทางเขียนใหม่คือ `openclaw doctor --fix` และ compat shim นี้เป็นเพียงชั่วคราว

## การสนทนาเสียงแบบ realtime

`realtime` ใช้เลือก provider เสียงแบบ realtime แบบ full duplex สำหรับเสียงโทรสด
แยกจาก `streaming` ซึ่งมีหน้าที่เพียงส่งต่อเสียงไปยัง
provider ถอดเสียงแบบ realtime

พฤติกรรมของรันไทม์ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.enabled` ไม่สามารถใช้ร่วมกับ `streaming.enabled` ได้
- `realtime.provider` เป็นตัวเลือกเพิ่มเติม หากไม่ตั้งค่า Voice Call จะใช้
  provider เสียงแบบ realtime ตัวแรกที่ลงทะเบียนไว้
- provider เสียงแบบ realtime ที่มาพร้อมระบบมี Google Gemini Live (`google`) และ
  OpenAI (`openai`) ซึ่งลงทะเบียนโดย provider Plugins ของแต่ละเจ้า
- config ดิบที่เป็นของ provider จะอยู่ภายใต้ `realtime.providers.<providerId>`
- Voice Call จะเปิดเผย realtime tool ที่ใช้ร่วมกัน `openclaw_agent_consult` โดย
  ค่าเริ่มต้น โมเดล realtime สามารถเรียกใช้ tool นี้ได้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น
  ข้อมูลปัจจุบัน หรือ OpenClaw tools ปกติ
- `realtime.toolPolicy` ควบคุมการรัน consult:
  - `safe-read-only`: เปิดเผย consult tool และจำกัด agent ปกติให้ใช้ได้เฉพาะ
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
    `memory_get`
  - `owner`: เปิดเผย consult tool และอนุญาตให้ agent ปกติใช้นโยบาย tool ปกติของ agent
  - `none`: ไม่เปิดเผย consult tool ส่วน `realtime.tools` แบบกำหนดเองยังคง
    ถูกส่งผ่านไปยัง provider แบบ realtime
- session key ของ consult จะนำ voice session ที่มีอยู่กลับมาใช้เมื่อทำได้ จากนั้น
  จึง fallback ไปยังหมายเลขโทรศัพท์ของผู้โทร/ผู้รับสาย เพื่อให้การเรียก consult ต่อเนื่อง
  คงบริบทไว้ระหว่างสาย
- หาก `realtime.provider` ชี้ไปยัง provider ที่ยังไม่ได้ลงทะเบียน หรือไม่มี
  provider เสียงแบบ realtime ถูกลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้าม
  realtime media แทนที่จะทำให้ทั้ง Plugin ล้มเหลว

ค่าเริ่มต้นของ Google Gemini Live realtime:

- คีย์ API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` หรือ
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

ตัวอย่าง:

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
            instructions: "พูดให้กระชับ เรียก openclaw_agent_consult ก่อนใช้ tools ที่ลึกขึ้น",
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

ใช้ OpenAI แทน:

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
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

ดู [Google provider](/th/providers/google) และ [OpenAI provider](/th/providers/openai)
สำหรับตัวเลือกเสียงแบบ realtime ที่เฉพาะกับ provider

## การถอดเสียงแบบสตรีมมิง

`streaming` ใช้เลือก provider ถอดเสียงแบบ realtime สำหรับเสียงโทรสด

พฤติกรรมของรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือกเพิ่มเติม หากไม่ตั้งค่า Voice Call จะใช้
  provider ถอดเสียงแบบ realtime ตัวแรกที่ลงทะเบียนไว้
- provider ถอดเสียงแบบ realtime ที่มาพร้อมระบบมี Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI
  (`xai`) ซึ่งลงทะเบียนโดย provider Plugins ของแต่ละเจ้า
- config ดิบที่เป็นของ provider จะอยู่ภายใต้ `streaming.providers.<providerId>`
- หาก `streaming.provider` ชี้ไปยัง provider ที่ยังไม่ได้ลงทะเบียน หรือไม่มี
  provider ถอดเสียงแบบ realtime ถูกลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและ
  ข้าม media streaming แทนที่จะทำให้ทั้ง Plugin ล้มเหลว

ค่าเริ่มต้นของ OpenAI streaming transcription:

- คีย์ API: `streaming.providers.openai.apiKey` หรือ `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

ค่าเริ่มต้นของ xAI streaming transcription:

- คีย์ API: `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

ตัวอย่าง:

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
                apiKey: "sk-...", // ไม่บังคับหากตั้ง OPENAI_API_KEY ไว้แล้ว
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

ใช้ xAI แทน:

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
                apiKey: "${XAI_API_KEY}", // ไม่บังคับหากตั้ง XAI_API_KEY ไว้แล้ว
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

คีย์แบบเดิมยังคงถูกย้ายอัตโนมัติโดย `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## ตัวเก็บกวาดสายที่ค้าง stale

ใช้ `staleCallReaperSeconds` เพื่อยุติสายที่ไม่เคยได้รับ terminal webhook
(เช่น สายโหมด notify ที่ไม่เคยสิ้นสุด) ค่าเริ่มต้นคือ `0`
(ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาทีสำหรับโฟลว์แบบ notify
- ควรกำหนดค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติ
  ดำเนินจนจบได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

ตัวอย่าง:

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

เมื่อมี proxy หรือ tunnel อยู่หน้าตัว Gateway Plugin จะประกอบ
URL สาธารณะขึ้นใหม่เพื่อใช้ตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ใช้ควบคุมว่าจะเชื่อถือ
forwarded headers ใดบ้าง

`webhookSecurity.allowedHosts` ใช้ allowlist ของโฮสต์จาก forwarding headers

`webhookSecurity.trustForwardingHeaders` เชื่อถือ forwarded headers โดยไม่ต้องมี allowlist

`webhookSecurity.trustedProxyIPs` จะเชื่อถือ forwarded headers เฉพาะเมื่อ
remote IP ของคำขอตรงกับรายการที่กำหนด

การป้องกัน Webhook replay ถูกเปิดใช้งานสำหรับ Twilio และ Plivo คำขอ Webhook
ที่ถูก replay แม้จะถูกต้องจะได้รับการตอบรับแต่จะไม่ก่อให้เกิด side effects

turn ของการสนทนาใน Twilio จะมีโทเค็นต่อ turn ใน callback ของ `<Gather>` ดังนั้น
callback เสียงพูดที่เก่าหรือถูก replay จะไม่สามารถทำให้ transcript turn
ที่ใหม่กว่าซึ่งกำลังรออยู่สำเร็จได้

คำขอ Webhook ที่ยังไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body หากไม่มี
signature headers ที่ provider นั้นกำหนดไว้

voice-call webhook ใช้โปรไฟล์ body ก่อนยืนยันตัวตนแบบใช้ร่วมกัน (64 KB / 5 วินาที)
ร่วมกับการจำกัดจำนวน in-flight ต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างเมื่อใช้โฮสต์สาธารณะที่คงที่:

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

## TTS สำหรับการโทร

Voice Call ใช้การตั้งค่า `messages.tts` ของ core สำหรับ
การสตรีมเสียงพูดระหว่างสาย คุณสามารถ override ได้ภายใต้ config ของ Plugin ด้วย
**รูปแบบเดียวกัน** — ระบบจะทำ deep-merge กับ `messages.tts`

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

หมายเหตุ:

- คีย์ `tts.<provider>` แบบเดิมภายใน config ของ Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมโดย `openclaw doctor --fix`; config ที่ commit แล้วควรใช้ `tts.providers.<provider>`
- **ระบบจะไม่ใช้ Microsoft speech สำหรับการโทรด้วยเสียง** (เสียงงานโทรศัพท์ต้องใช้ PCM; transport ของ Microsoft ในปัจจุบันยังไม่เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์)
- ระบบจะใช้ TTS ของ core เมื่อเปิดใช้งาน Twilio media streaming; มิฉะนั้นสายจะ fallback ไปใช้เสียง native ของ provider
- หากมี Twilio media stream ทำงานอยู่แล้ว Voice Call จะไม่ fallback ไปใช้ TwiML `<Say>` หากไม่มี telephony TTS ในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมสองเส้นทางการเล่นเสียงเข้าด้วยกัน
- เมื่อ telephony TTS fallback ไปยัง provider สำรอง Voice Call จะบันทึกคำเตือนพร้อมสายโซ่ของ provider (`from`, `to`, `attempts`) เพื่อช่วยในการดีบัก
- เมื่อการ barge-in หรือการ teardown ของสตรีมใน Twilio ล้างคิว TTS ที่กำลังรออยู่
  คำขอเล่นเสียงที่เข้าคิวไว้จะถูกสะสางแทนที่จะปล่อยให้ผู้โทรที่รอการเล่นเสียง
  ค้างอยู่

### ตัวอย่างเพิ่มเติม

ใช้เฉพาะ TTS ของ core (ไม่ override):

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

override เป็น ElevenLabs สำหรับการโทรเท่านั้น (คงค่าเริ่มต้นของ core ไว้ที่อื่น):

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

override เฉพาะโมเดล OpenAI สำหรับการโทร (ตัวอย่าง deep-merge):

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

## สายเรียกเข้า

นโยบายสายเรียกเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายเรียกเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "สวัสดี! มีอะไรให้ฉันช่วยได้บ้าง?",
}
```

`inboundPolicy: "allowlist"` เป็นการคัดกรอง caller ID ที่มีระดับความเชื่อมั่นต่ำ Plugin
จะ normalize ค่า `From` ที่ provider ส่งมา แล้วเปรียบเทียบกับ `allowFrom`
การตรวจสอบ Webhook จะยืนยันการส่งมอบจาก provider และความถูกต้องสมบูรณ์ของ payload แต่
ไม่ได้พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทรบน PSTN/VoIP ให้ถือว่า `allowFrom` เป็นเพียง
การกรอง caller ID ไม่ใช่การยืนยันตัวตนผู้โทรที่เข้มแข็ง

การตอบกลับอัตโนมัติใช้ระบบ agent โดยปรับแต่งได้ด้วย:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### สัญญาเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้าย system prompt ด้วยสัญญาเอาต์พุตเสียงพูดแบบเข้มงวด:

- `{"spoken":"..."}`

จากนั้น Voice Call จะดึงข้อความสำหรับพูดอย่างระมัดระวัง:

- ละเว้น payload ที่ถูกทำเครื่องหมายว่าเป็น reasoning/error content
- parse JSON โดยตรง, JSON ใน fenced block หรือคีย์ `"spoken"` แบบ inline
- fallback ไปใช้ plain text และลบย่อหน้าเกริ่นนำแบบการวางแผน/เมตาที่น่าจะเป็นออก

สิ่งนี้ช่วยให้เสียงที่เล่นออกมามุ่งเน้นที่ข้อความสำหรับผู้โทร และหลีกเลี่ยงการรั่วไหลของข้อความวางแผนไปยังเสียง

### พฤติกรรมการเริ่มต้นการสนทนา

สำหรับสายแบบ `conversation` ที่โทรออก การจัดการข้อความแรกจะผูกกับสถานะการเล่นเสียงสด:

- การล้างคิวจาก barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะในช่วงที่เสียงทักทายแรกกำลังพูดอยู่จริงเท่านั้น
- หากการเล่นเสียงครั้งแรกล้มเหลว สายจะกลับไปที่สถานะ `listening` และข้อความแรกจะยังคงค้างอยู่เพื่อรอลองใหม่
- การเล่นเสียงครั้งแรกสำหรับ Twilio streaming จะเริ่มเมื่อสตรีมเชื่อมต่อ โดยไม่มีการหน่วงเพิ่มเติม
- การ barge-in จะยกเลิกการเล่นเสียงที่กำลังทำงานอยู่ และล้างรายการ TTS ของ Twilio
  ที่เข้าคิวไว้แต่ยังไม่เริ่มเล่น รายการที่ถูกล้างจะ resolve เป็นข้ามไปแล้ว เพื่อให้ตรรกะตอบกลับถัดไป
  ดำเนินต่อได้โดยไม่ต้องรอเสียงที่ไม่มีวันเล่น
- การสนทนาเสียงแบบ realtime จะใช้ opening turn ของสตรีม realtime เอง Voice Call จะไม่ส่งอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความแรกนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจึงยังคงเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อ Twilio stream ตัดการเชื่อมต่อ

เมื่อ Twilio media stream ตัดการเชื่อมต่อ Voice Call จะรอ `2000ms` ก่อนยุติสายอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ภายในช่วงเวลาดังกล่าว การยุติอัตโนมัติจะถูกยกเลิก
- หากไม่มีการลงทะเบียนสตรีมใหม่หลังพ้นช่วงผ่อนผัน สายจะถูกยุติเพื่อป้องกันไม่ให้มีสาย active ค้างอยู่

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias ของ call
openclaw voicecall continue --call-id <id> --message "มีคำถามเพิ่มเติมไหม?"
openclaw voicecall speak --call-id <id> --message "กรุณารอสักครู่"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # สรุป latency ของ turn จากบันทึก
openclaw voicecall expose --mode funnel
```

`latency` จะอ่าน `calls.jsonl` จากพาธจัดเก็บ voice-call ค่าเริ่มต้น ใช้
`--file <path>` เพื่อชี้ไปยังบันทึกอื่น และ `--last <n>` เพื่อจำกัดการวิเคราะห์
เฉพาะ N ระเบียนล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตประกอบด้วย p50/p90/p99 สำหรับ
latency ของ turn และเวลา listen-wait

## Agent tool

ชื่อ tool: `voice_call`

แอ็กชัน:

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `send_dtmf` (`callId`, `digits`)
- `end_call` (`callId`)
- `get_status` (`callId`)

repo นี้มีเอกสาร skill ที่สอดคล้องกันอยู่ที่ `skills/voice-call/SKILL.md`

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## ที่เกี่ยวข้อง

- [Text-to-speech](/th/tools/tts)
- [Talk mode](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
