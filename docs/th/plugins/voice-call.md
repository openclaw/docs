---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin voice-call
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายโทรเข้าด้วยเสียงผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-04-30T10:10:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก
การสนทนาหลายรอบ เสียงแบบเรียลไทม์ full-duplex การถอดเสียงแบบสตรีมมิง
และสายเรียกเข้าพร้อมนโยบาย allowlist

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (พัฒนา/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในโปรเซส Gateway** หากคุณใช้
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
      <Tab title="จากโฟลเดอร์ภายในเครื่อง (พัฒนา)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว เวอร์ชันแพ็กเกจนั้น
    มาจากสายแพ็กเกจภายนอกที่เก่ากว่า ให้ใช้บิลด์ OpenClaw แบบแพ็กเกจปัจจุบัน
    หรือพาธโฟลเดอร์ภายในเครื่องจนกว่าจะเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

    รีสตาร์ท Gateway หลังจากนั้นเพื่อให้โหลด Plugin

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่าคอนฟิกใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับรูปแบบเต็ม) ขั้นต่ำต้องมี:
    `provider`, ข้อมูลรับรองของผู้ให้บริการ, `fromNumber` และ URL Webhook
    ที่เข้าถึงได้จากสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบว่า
    เปิดใช้ Plugin แล้วหรือไม่ ข้อมูลรับรองของผู้ให้บริการ การเปิดเผย Webhook
    และมีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่ทำงานอยู่ ใช้
    `--json` สำหรับสคริปต์

  </Step>
  <Step title="ทดสอบเบื้องต้น">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็นการทดลองรันตามค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือนขาออก
    สั้น ๆ จริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve เป็น **URL Webhook สาธารณะ**
หาก `publicUrl`, URL อุโมงค์, URL Tailscale หรือ fallback ของ serve
resolve เป็น loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการเครือข่ายโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกขาดข้อมูลรับรอง
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่ายังไม่สมบูรณ์พร้อมคีย์ที่ขาด
และข้ามการเริ่ม runtime คำสั่ง การเรียก RPC และเครื่องมือของ agent จะยังคง
ส่งคืนค่าคอนฟิกผู้ให้บริการที่ขาดไปอย่างแม่นยำเมื่อใช้งาน

<Note>
ข้อมูลรับรอง voice-call รองรับ SecretRefs `plugins.entries.voice-call.config.twilio.authToken` และ `plugins.entries.voice-call.config.tts.providers.*.apiKey` จะ resolve ผ่านพื้นผิว SecretRef มาตรฐาน ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
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
  <Accordion title="หมายเหตุเกี่ยวกับการเปิดเผยผู้ให้บริการและความปลอดภัย">
    - Twilio, Telnyx และ Plivo ล้วนต้องใช้ URL Webhook ที่ **เข้าถึงได้จากสาธารณะ**
    - `mock` เป็นผู้ให้บริการสำหรับการพัฒนาภายในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` เป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบภายในเครื่องเท่านั้น
    - ในระดับฟรีของ ngrok ให้ตั้ง `publicUrl` เป็น URL ngrok ที่ตรงกันทุกประการ การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (agent ภายในเครื่องของ ngrok) ใช้สำหรับการพัฒนาภายในเครื่องเท่านั้น
    - URL ระดับฟรีของ Ngrok อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial ได้ หาก `publicUrl` เปลี่ยนไป ลายเซ็น Twilio จะล้มเหลว โปรดักชัน: แนะนำให้ใช้โดเมนที่เสถียรหรือ Tailscale funnel

  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อสตรีมมิง">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดซ็อกเก็ต pre-start ที่ยังไม่ยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดอยู่ทั้งหมด (pending + active)

  </Accordion>
  <Accordion title="การย้ายคอนฟิกแบบดั้งเดิม">
    คอนฟิกเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI
    แบบดั้งเดิมใต้ `streaming.*` จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    fallback ของ runtime ยังคงยอมรับคีย์ voice-call เก่าในตอนนี้ แต่
    พาธการเขียนใหม่คือ `openclaw doctor --fix` และ shim ความเข้ากันได้นี้
    เป็นแบบชั่วคราว

    คีย์สตรีมมิงที่ย้ายอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงเรียลไทม์ full-duplex สำหรับเสียงสายโทรสด
โดยแยกจาก `streaming` ซึ่งมีหน้าที่ส่งต่อเสียงไปยังผู้ให้บริการถอดเสียง
แบบเรียลไทม์เท่านั้น

<Warning>
`realtime.enabled` ไม่สามารถใช้ร่วมกับ `streaming.enabled` ได้ เลือกโหมดเสียงหนึ่งโหมด
ต่อหนึ่งสายโทร
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นค่าทางเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงเรียลไทม์ที่ลงทะเบียนไว้รายแรก
- ผู้ให้บริการเสียงเรียลไทม์ที่รวมมาให้: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- คอนฟิก raw ที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ที่ใช้ร่วมกัน `openclaw_agent_consult` ตามค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลเชิงลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงเรียลไทม์ลงทะเบียนอยู่เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult จะใช้เซสชันเสียงเดิมซ้ำเมื่อมี จากนั้น fallback ไปยังหมายเลขโทรศัพท์ของผู้โทร/ผู้รับ เพื่อให้การเรียก consult ต่อเนื่องรักษาบริบทระหว่างสายโทรได้

### นโยบายเครื่องมือ

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย           | พฤติกรรม                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผยเครื่องมือ consult และจำกัด agent ปกติไว้ที่ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
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

`streaming` เลือกผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับเสียงสายโทรสด

พฤติกรรม runtime ปัจจุบัน:

- `streaming.provider` เป็นค่าทางเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่ลงทะเบียนไว้รายแรก
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่รวมมาให้: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- คอนฟิก raw ที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `streaming.providers.<providerId>`
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีการลงทะเบียนไว้ Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

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
    ปลายทาง `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราตัวอย่าง `8000`;
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

Voice Call ใช้การกำหนดค่า `messages.tts` หลักสำหรับการสตรีม
เสียงพูดในการโทร คุณสามารถเขียนทับได้ภายใต้การกำหนดค่า Plugin ด้วย
**รูปแบบเดียวกัน** — โดยจะผสานเชิงลึกกับ `messages.tts`.

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
**Microsoft speech จะถูกละเว้นสำหรับการโทรเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
ทรานสปอร์ต Microsoft ปัจจุบันไม่เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมแซมโดย `openclaw doctor --fix`; การกำหนดค่าที่คอมมิตควรใช้ `tts.providers.<provider>`.
- TTS หลักจะถูกใช้เมื่อเปิดใช้งาน Twilio media streaming; มิฉะนั้นการโทรจะย้อนกลับไปใช้เสียงแบบเนทีฟของผู้ให้บริการ
- หาก Twilio media stream กำลังใช้งานอยู่แล้ว Voice Call จะไม่ย้อนกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนการผสมเส้นทางการเล่นเสียงสองแบบ
- เมื่อ TTS สำหรับโทรศัพท์ย้อนกลับไปใช้ผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมลำดับผู้ให้บริการ (`from`, `to`, `attempts`) สำหรับการดีบัก
- เมื่อ Twilio barge-in หรือการรื้อถอน stream ล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่อยู่ในคิวจะสิ้นสุดสถานะแทนที่จะปล่อยให้ผู้โทรค้างรอการเล่นเสียงเสร็จสิ้น

### ตัวอย่าง TTS

<Tabs>
  <Tab title="TTS หลักเท่านั้น">
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
  <Tab title="การเขียนทับโมเดล OpenAI (ผสานเชิงลึก)">
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

นโยบายขาเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้งานการโทรขาเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรอง caller ID ที่มีความน่าเชื่อต่ำ
Plugin จะทำให้ค่า `From` ที่ผู้ให้บริการส่งมาอยู่ในรูปแบบมาตรฐานและเปรียบเทียบกับ
`allowFrom` การตรวจสอบ Webhook ยืนยันตัวตนการส่งมอบจากผู้ให้บริการและ
ความครบถ้วนของ payload แต่ **ไม่ได้** พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรอง caller ID ไม่ใช่ตัวตนผู้โทร
ที่มั่นคง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบ agent ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`.

### สัญญาเอาต์พุตคำพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตคำพูดที่เข้มงวดเข้าไปใน
system prompt:

```text
{"spoken":"..."}
```

Voice Call แยกข้อความคำพูดอย่างระมัดระวัง:

- ละเว้น payload ที่ทำเครื่องหมายว่าเป็นเนื้อหา reasoning/error
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน fenced block หรือคีย์ `"spoken"` แบบ inline
- ย้อนกลับไปใช้ข้อความธรรมดาและลบย่อหน้านำที่น่าจะเป็นการวางแผน/เมตา

วิธีนี้ทำให้การเล่นเสียงพูดเน้นที่ข้อความสำหรับผู้โทรและหลีกเลี่ยง
การรั่วไหลของข้อความวางแผนเข้าสู่เสียง

### พฤติกรรมการเริ่มต้นบทสนทนา

สำหรับการโทร `conversation` ขาออก การจัดการข้อความแรกจะผูกกับสถานะ
การเล่นเสียงแบบสด:

- การล้างคิว barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังพูดอยู่เท่านั้น
- หากการเล่นเสียงเริ่มต้นล้มเหลว การโทรจะกลับไปเป็น `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อรอลองใหม่
- การเล่นเสียงเริ่มต้นสำหรับ Twilio streaming จะเริ่มเมื่อ stream เชื่อมต่อโดยไม่มีความล่าช้าเพิ่มเติม
- Barge-in จะยกเลิกการเล่นเสียงที่กำลังทำงานอยู่และล้างรายการ Twilio TTS ที่เข้าคิวแต่ยังไม่เริ่มเล่น รายการที่ถูกล้างจะ resolve เป็น skipped เพื่อให้ตรรกะการตอบกลับถัดไปดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- บทสนทนาเสียงแบบเรียลไทม์ใช้ turn เปิดของ realtime stream เอง Voice Call **จะไม่** โพสต์การอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความเริ่มต้นนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจึงยังคงเชื่อมอยู่

### ระยะผ่อนผันเมื่อ Twilio stream ตัดการเชื่อมต่อ

เมื่อ Twilio media stream ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
จบการโทรโดยอัตโนมัติ:

- หาก stream เชื่อมต่อใหม่ในช่วงเวลานั้น การจบอัตโนมัติจะถูกยกเลิก
- หากไม่มี stream ลงทะเบียนใหม่หลังระยะผ่อนผัน การโทรจะถูกจบเพื่อป้องกันไม่ให้มีสายที่ยังทำงานค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ terminal
webhook (เช่น สายในโหมด notify ที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้น
คือ `0` (ปิดใช้งาน)

ช่วงที่แนะนำ:

- **โปรดักชัน:** `120`–`300` วินาทีสำหรับโฟลว์แบบ notify
- รักษาค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติจบได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อมีพร็อกซีหรือ tunnel อยู่ด้านหน้า Gateway, Plugin จะ
สร้าง URL สาธารณะขึ้นใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้
ควบคุมว่าจะเชื่อถือ forwarded headers ใด:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  โฮสต์ allowlist จาก forwarding headers
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือ forwarded headers โดยไม่มี allowlist
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือ forwarded headers เฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการ
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้งาน **การป้องกัน replay** ของ Webhook สำหรับ Twilio และ Plivo คำขอ webhook ที่ถูกต้องแต่ถูก replay จะได้รับการตอบรับแต่ถูกข้ามผลข้างเคียง
- Turn ของบทสนทนา Twilio รวมโทเค็นต่อ turn ใน callback `<Gather>` เพื่อให้ callback คำพูดที่ค้าง/ถูก replay ไม่สามารถตอบสนอง turn transcript ที่รอดำเนินการใหม่กว่าได้
- คำขอ webhook ที่ไม่ผ่านการยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body เมื่อไม่มี headers ลายเซ็นที่ผู้ให้บริการกำหนด
- Webhook ของ voice-call ใช้โปรไฟล์ body ก่อนยืนยันตัวตนที่ใช้ร่วมกัน (64 KB / 5 วินาที) พร้อมเพดาน in-flight ต่อ IP ก่อนการตรวจสอบลายเซ็น

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

`latency` อ่าน `calls.jsonl` จากเส้นทางจัดเก็บ voice-call เริ่มต้น
ใช้ `--file <path>` เพื่อชี้ไปยัง log อื่น และ `--last <n>` เพื่อจำกัด
การวิเคราะห์ไว้ที่ระเบียน N รายการล่าสุด (ค่าเริ่มต้น 200) เอาต์พุตมี p50/p90/p99
สำหรับเวลาแฝงของ turn และเวลา listen-wait

## เครื่องมือ Agent

ชื่อเครื่องมือ: `voice_call`.

| การกระทำ        | อาร์กิวเมนต์             |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

รีโพนี้มาพร้อมเอกสาร skill ที่สอดคล้องกันที่ `skills/voice-call/SKILL.md`.

## Gateway RPC

| เมธอด               | อาร์กิวเมนต์             |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [ข้อความเป็นเสียงพูด](/th/tools/tts)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
