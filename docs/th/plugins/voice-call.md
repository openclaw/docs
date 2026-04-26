---
read_when:
    - คุณต้องการโทรออกจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin voice-call
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายเสียงขาเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกสำหรับเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-04-26T11:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก การสนทนาหลายรอบ เสียงแบบเรียลไทม์ full-duplex การถอดเสียงแบบสตรีมมิง และสายเรียกเข้า พร้อมนโยบาย allowlist

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams), `telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput speech), `mock` (สำหรับพัฒนา/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในโปรเซส Gateway** หากคุณใช้ Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่รัน Gateway จากนั้นรีสตาร์ต Gateway เพื่อโหลด Plugin
</Note>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    <Tabs>
      <Tab title="จาก npm (แนะนำ)">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="จากโฟลเดอร์ภายในเครื่อง (สำหรับพัฒนา)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    หลังจากนั้นให้รีสตาร์ต Gateway เพื่อให้ Plugin ถูกโหลด

  </Step>
  <Step title="กำหนดค่าผู้ให้บริการและ Webhook">
    ตั้งค่า config ภายใต้ `plugins.entries.voice-call.config` (ดูรูปแบบทั้งหมดได้ใน [การกำหนดค่า](#configuration) ด้านล่าง) อย่างน้อยที่สุดต้องมี: `provider`, ข้อมูลรับรองของผู้ให้บริการ, `fromNumber` และ URL ของ Webhook ที่เข้าถึงได้จากสาธารณะ
  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตปริยายอ่านได้ง่ายในบันทึกแชตและเทอร์มินัล คำสั่งนี้ตรวจสอบการเปิดใช้งาน Plugin ข้อมูลรับรองของผู้ให้บริการ การเปิดเผย Webhook และตรวจสอบว่ามีโหมดเสียงเพียงหนึ่งแบบ (`streaming` หรือ `realtime`) ที่เปิดใช้งาน ใช้ `--json` สำหรับสคริปต์

  </Step>
  <Step title="ทดสอบแบบ smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็น dry run โดยปริยาย เพิ่ม `--yes` เพื่อโทรแจ้งเตือนขาออกแบบสั้นจริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve ไปยัง **URL ของ Webhook แบบสาธารณะ** หาก `publicUrl`, URL ของ tunnel, URL ของ Tailscale หรือ serve fallback resolve ไปยัง loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะเริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากเครือข่ายผู้ให้บริการโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลรับรอง ระหว่างเริ่มต้น Gateway จะบันทึกคำเตือนว่ายังตั้งค่าไม่ครบ พร้อมคีย์ที่ขาด และข้ามการเริ่มรันไทม์ คำสั่ง การเรียก RPC และ tool ของ agent จะยังคงส่งกลับรายละเอียดการกำหนดค่าของผู้ให้บริการที่ขาดอย่างตรงไปตรงมาเมื่อถูกใช้งาน

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
  <Accordion title="หมายเหตุด้านการเปิดเผยของผู้ให้บริการและความปลอดภัย">
    - Twilio, Telnyx และ Plivo ต่างต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้จากสาธารณะ**
    - `mock` คือผู้ให้บริการสำหรับพัฒนาในเครื่อง (ไม่มีการเรียกผ่านเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` จะเป็น true
    - `skipSignatureVerification` มีไว้สำหรับการทดสอบในเครื่องเท่านั้น
    - บน ngrok ฟรี ให้ตั้ง `publicUrl` เป็น URL ngrok ที่ตรงกันทุกประการ; การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาตให้ Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้องผ่านได้ **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (ngrok local agent) เท่านั้น ใช้สำหรับการพัฒนาในเครื่องเท่านั้น
    - URL ของ ngrok ฟรีอาจเปลี่ยนแปลงหรือเพิ่มพฤติกรรมแบบ interstitial; หาก `publicUrl` เปลี่ยนไป ลายเซ็นของ Twilio จะล้มเหลว ในระบบจริงควรใช้โดเมนคงที่หรือ Tailscale funnel
  </Accordion>
  <Accordion title="ขีดจำกัดการเชื่อมต่อแบบสตรีมมิง">
    - `streaming.preStartTimeoutMs` จะปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ยืนยันตัวตนต่อ source IP
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดอยู่ทั้งหมด (pending + active)
  </Accordion>
  <Accordion title="การย้าย config แบบเดิม">
    config รุ่นเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI แบบเดิมภายใต้ `streaming.*` จะถูกเขียนใหม่โดย `openclaw doctor --fix` ปัจจุบัน runtime fallback ยังยอมรับคีย์ voice-call แบบเก่าเหล่านี้อยู่ แต่เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim นี้เป็นเพียงชั่วคราว

    คีย์สตรีมมิงที่ย้ายอัตโนมัติ:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` ใช้เลือกผู้ให้บริการเสียงแบบเรียลไทม์ full-duplex สำหรับเสียงระหว่างสายสด โดยแยกจาก `streaming` ซึ่งเพียงส่งต่อเสียงไปยังผู้ให้บริการถอดเสียงแบบเรียลไทม์เท่านั้น

<Warning>
ไม่สามารถใช้ `realtime.enabled` ร่วมกับ `streaming.enabled` ได้ ให้เลือกโหมดเสียงเพียงแบบเดียวต่อสาย
</Warning>

พฤติกรรมรันไทม์ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงแบบเรียลไทม์ตัวแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงแบบเรียลไทม์ที่ bundled มา: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการเหล่านั้น
- config ดิบที่เป็นของผู้ให้บริการอยู่ภายใต้ `realtime.providers.<providerId>`
- โดยปริยาย Voice Call จะเปิดเผย realtime tool แบบใช้ร่วมกัน `openclaw_agent_consult` โมเดลแบบเรียลไทม์สามารถเรียกใช้งานได้เมื่อผู้โทรต้องการการให้เหตุผลเชิงลึกกว่าเดิม ข้อมูลปัจจุบัน หรือ tool ปกติของ OpenClaw
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงแบบเรียลไทม์ลงทะเบียนอยู่เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อแบบเรียลไทม์ แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- session key สำหรับ consult จะใช้เซสชันเสียงที่มีอยู่เดิมซ้ำเมื่อเป็นไปได้ และถ้าไม่ได้จะ fallback ไปใช้หมายเลขโทรศัพท์ของผู้โทร/ผู้รับสาย เพื่อให้การเรียก consult ต่อเนื่องคงบริบทระหว่างสายได้

### นโยบาย tool

`realtime.toolPolicy` ควบคุมการรัน consult:

| นโยบาย          | พฤติกรรม                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดเผย consult tool และจำกัด agent ปกติให้ใช้ได้เฉพาะ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get` |
| `owner`          | เปิดเผย consult tool และให้ agent ปกติใช้นโยบาย tool ของ agent ตามปกติ                                                                |
| `none`           | ไม่เปิดเผย consult tool โดย `realtime.tools` แบบกำหนดเองยังคงถูกส่งผ่านไปยังผู้ให้บริการแบบเรียลไทม์                                |

### ตัวอย่างผู้ให้บริการแบบเรียลไทม์

<Tabs>
  <Tab title="Google Gemini Live">
    ค่าปริยาย: API key จาก `realtime.providers.google.apiKey`, `GEMINI_API_KEY` หรือ `GOOGLE_GENERATIVE_AI_API_KEY`; โมเดล `gemini-2.5-flash-native-audio-preview-12-2025`; เสียง `Kore`

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

ดู [ผู้ให้บริการ Google](/th/providers/google) และ [ผู้ให้บริการ OpenAI](/th/providers/openai) สำหรับตัวเลือกเสียงแบบเรียลไทม์ที่เฉพาะกับผู้ให้บริการ

## การถอดเสียงแบบสตรีมมิง

`streaming` ใช้เลือกผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับเสียงสดระหว่างสาย

พฤติกรรมรันไทม์ปัจจุบัน:

- `streaming.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์ตัวแรกที่ลงทะเบียนไว้
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่ bundled มา: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการเหล่านั้น
- config ดิบที่เป็นของผู้ให้บริการอยู่ภายใต้ `streaming.providers.<providerId>`
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีการลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้าม media streaming แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

### ตัวอย่างผู้ให้บริการสตรีมมิง

<Tabs>
  <Tab title="OpenAI">
    ค่าปริยาย: API key จาก `streaming.providers.openai.apiKey` หรือ `OPENAI_API_KEY`; โมเดล `gpt-4o-transcribe`; `silenceDurationMs: 800`; `vadThreshold: 0.5`

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
    ค่าปริยาย: API key จาก `streaming.providers.xai.apiKey` หรือ `XAI_API_KEY`; endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; sample rate `8000`; `endpointingMs: 800`; `interimResults: true`

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

## TTS สำหรับสายโทร

Voice Call ใช้การกำหนดค่า `messages.tts` ของแกนหลักสำหรับการสตรีมเสียงพูดบนสายโทร คุณสามารถ override ได้ภายใต้ config ของ Plugin โดยใช้ **รูปแบบเดียวกัน** — โดยจะ deep-merge กับ `messages.tts`

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
**ระบบเสียงพูดของ Microsoft จะถูกละเว้นสำหรับสายโทร** เสียงโทรศัพท์ต้องใช้ PCM; transport ปัจจุบันของ Microsoft ยังไม่เปิดเผยเอาต์พุต PCM สำหรับระบบโทรศัพท์
</Warning>

หมายเหตุด้านพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายใน config ของ Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมแซมโดย `openclaw doctor --fix`; config ที่บันทึกไว้ควรใช้ `tts.providers.<provider>`
- จะใช้ TTS ของแกนหลักเมื่อเปิดใช้งาน Twilio media streaming; มิฉะนั้นสายจะ fallback ไปใช้เสียงเนทีฟของผู้ให้บริการ
- หากมี Twilio media stream ทำงานอยู่แล้ว Voice Call จะไม่ fallback ไปใช้ TwiML `<Say>` หาก TTS สำหรับระบบโทรศัพท์ไม่พร้อมใช้งานในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนการผสมเส้นทางการเล่นสองแบบเข้าด้วยกัน
- เมื่อ TTS สำหรับระบบโทรศัพท์ fallback ไปยังผู้ให้บริการสำรอง Voice Call จะบันทึกคำเตือนพร้อมสายโซ่ของผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อใช้ดีบัก
- เมื่อ Twilio barge-in หรือการปิด stream ล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่อยู่ในคิวจะถูกปิดสถานะแทนที่จะปล่อยให้ผู้โทรค้างรอการเล่นเสียงจนไม่สิ้นสุด

### ตัวอย่าง TTS

<Tabs>
  <Tab title="ใช้เฉพาะ TTS ของแกนหลัก">
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
  <Tab title="Override เป็น ElevenLabs (เฉพาะสายโทร)">
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
  <Tab title="Override โมเดล OpenAI (deep-merge)">
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

นโยบายขาเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายเรียกเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรอง caller ID ที่มีความเชื่อมั่นต่ำ Plugin จะทำ normalization ค่าของ `From` ที่ผู้ให้บริการส่งมา แล้วเปรียบเทียบกับ `allowFrom` การตรวจสอบ Webhook ยืนยันความถูกต้องของการส่งมอบและความสมบูรณ์ของ payload จากผู้ให้บริการ แต่ **ไม่ได้**พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทรบน PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรอง caller ID ไม่ใช่การยืนยันตัวตนผู้โทรแบบเข้มงวด
</Warning>

การตอบกลับอัตโนมัติใช้ระบบ agent ปรับแต่งได้ด้วย `responseModel`, `responseSystemPrompt` และ `responseTimeoutMs`

### สัญญาของเอาต์พุตเสียงพูด

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อสัญญาเอาต์พุตเสียงพูดแบบเข้มงวดเข้ากับ system prompt:

```text
{"spoken":"..."}
```

Voice Call จะแยกข้อความสำหรับพูดอย่างระมัดระวังดังนี้:

- ละเว้น payload ที่ถูกระบุว่าเป็นเนื้อหาประเภท reasoning/error
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน code fence หรือคีย์ `"spoken"` แบบฝังในบรรทัด
- fallback ไปใช้ข้อความธรรมดา และลบย่อหน้านำที่น่าจะเป็นข้อความวางแผน/เมตาออก

สิ่งนี้ช่วยให้การเล่นเสียงเน้นเฉพาะข้อความที่มีไว้สื่อสารกับผู้โทร และหลีกเลี่ยงการรั่วไหลของข้อความวางแผนออกไปเป็นเสียง

### พฤติกรรมการเริ่มต้นการสนทนา

สำหรับสายขาออกแบบ `conversation` การจัดการข้อความแรกจะผูกกับสถานะการเล่นเสียงสด:

- การล้างคิวจาก barge-in และการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายเริ่มต้นกำลังถูกพูดอยู่จริงเท่านั้น
- หากการเล่นเริ่มต้นล้มเหลว สายจะกลับสู่สถานะ `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อให้ลองใหม่ได้
- การเล่นเริ่มต้นสำหรับ Twilio streaming จะเริ่มเมื่อ stream เชื่อมต่อ โดยไม่มีการหน่วงเพิ่มเติม
- Barge-in จะยกเลิกการเล่นที่กำลังทำงาน และล้างรายการ TTS ของ Twilio ที่อยู่ในคิวแต่ยังไม่เริ่มเล่น รายการที่ถูกล้างจะถูก resolve เป็น skipped เพื่อให้ตรรกะการตอบกลับถัดไปดำเนินต่อได้โดยไม่ต้องรอเสียงที่ไม่มีวันถูกเล่น
- การสนทนาด้วยเสียงแบบเรียลไทม์จะใช้รอบเปิดของ realtime stream เอง Voice Call **จะไม่**ส่งอัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความเริ่มต้นนั้น ดังนั้นเซสชันขาออกแบบ `<Connect><Stream>` จะยังคงเชื่อมต่ออยู่

### ช่วงผ่อนผันเมื่อ Twilio stream ตัดการเชื่อมต่อ

เมื่อ Twilio media stream ถูกตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อนจบสายอัตโนมัติ:

- หาก stream เชื่อมต่อใหม่ภายในช่วงเวลาดังกล่าว การจบสายอัตโนมัติจะถูกยกเลิก
- หากไม่มี stream ลงทะเบียนใหม่หลังช่วงผ่อนผัน สายจะถูกจบเพื่อป้องกันไม่ให้เกิดสาย active ที่ค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ Webhook ปลายทาง (เช่น สายโหมด notify ที่ไม่เสร็จสมบูรณ์) ค่าปริยายคือ `0` (ปิดใช้งาน)

ช่วงค่าที่แนะนำ:

- **Production:** `120`–`300` วินาที สำหรับโฟลว์แบบ notify
- ให้ค่านี้ **สูงกว่า `maxDurationSeconds`** เพื่อให้สายปกติจบได้ ค่าที่แนะนำในการเริ่มต้นคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อมี proxy หรือ tunnel อยู่หน้า Gateway Plugin จะสร้าง URL สาธารณะขึ้นใหม่เพื่อใช้ตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่า header ที่ถูกส่งต่อใดบ้างที่เชื่อถือได้:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist ของ host จาก forwarding headers
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือ forwarded headers โดยไม่ต้องมี allowlist
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือ forwarded headers เฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการนี้
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำของ Webhook** สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องแต่ถูกเล่นซ้ำจะได้รับการตอบรับ แต่จะถูกข้ามผลข้างเคียง
- รอบการสนทนาของ Twilio จะมีโทเค็นต่อรอบใน callback ของ `<Gather>` ดังนั้น callback เสียงพูดที่เก่าหรือถูกเล่นซ้ำจะไม่สามารถตอบสนองรอบ transcript ที่รอดำเนินการใหม่กว่าได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่าน body หากขาด header ลายเซ็นที่ผู้ให้บริการกำหนด
- Webhook ของ voice-call ใช้โปรไฟล์ body ก่อนยืนยันตัวตนแบบใช้ร่วมกัน (64 KB / 5 วินาที) พร้อมขีดจำกัดจำนวนคำขอที่กำลังดำเนินการต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างเมื่อใช้ host สาธารณะที่คงที่:

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

`latency` จะอ่าน `calls.jsonl` จาก path จัดเก็บปริยายของ voice-call ใช้ `--file <path>` เพื่อชี้ไปยังบันทึกอื่น และ `--last <n>` เพื่อจำกัดการวิเคราะห์ไว้ที่ N ระเบียนล่าสุด (ค่าปริยาย 200) เอาต์พุตรวม p50/p90/p99 สำหรับ latency ของรอบและเวลา listen-wait

## tool ของ agent

ชื่อ tool: `voice_call`

| Action          | Args                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

รีโปนี้มีเอกสาร Skills ที่สอดคล้องกันที่ `skills/voice-call/SKILL.md`

## Gateway RPC

| Method               | Args                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## ที่เกี่ยวข้อง

- [โหมดสนทนา](/th/nodes/talk)
- [การแปลงข้อความเป็นเสียงพูด](/th/tools/tts)
- [Voice wake](/th/nodes/voicewake)
