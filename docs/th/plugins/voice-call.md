---
read_when:
    - คุณต้องการโทรออกด้วยเสียงจาก OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin การโทรด้วยเสียง
    - คุณต้องการเสียงแบบเรียลไทม์หรือการถอดเสียงแบบสตรีมมิงบนระบบโทรศัพท์
sidebarTitle: Voice call
summary: โทรออกและรับสายด้วยเสียงขาเข้าผ่าน Twilio, Telnyx หรือ Plivo พร้อมตัวเลือกเสียงแบบเรียลไทม์และการถอดเสียงแบบสตรีมมิง
title: Plugin การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-10T19:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

การโทรด้วยเสียงสำหรับ OpenClaw ผ่าน Plugin รองรับการแจ้งเตือนขาออก
การสนทนาหลายรอบ เสียงแบบเรียลไทม์ฟูลดูเพล็กซ์ การถอดเสียงแบบสตรีมมิง
และสายขาเข้าพร้อมนโยบาย allowlist

**ผู้ให้บริการปัจจุบัน:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (การพัฒนา/ไม่มีเครือข่าย)

<Note>
Plugin Voice Call ทำงาน **ภายในกระบวนการ Gateway** หากคุณใช้
Gateway ระยะไกล ให้ติดตั้งและกำหนดค่า Plugin บนเครื่องที่รัน
Gateway จากนั้นรีสตาร์ต Gateway เพื่อโหลด Plugin
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

    ใช้แพ็กเกจเปล่าเพื่อใช้ตามแท็กรุ่นทางการปัจจุบัน ปักหมุด
    เวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

    รีสตาร์ต Gateway หลังจากนั้นเพื่อให้ Plugin โหลดขึ้นมา

  </Step>
  <Step title="Configure provider and webhook">
    ตั้งค่าคอนฟิกภายใต้ `plugins.entries.voice-call.config` (ดู
    [การกำหนดค่า](#configuration) ด้านล่างสำหรับโครงสร้างทั้งหมด) อย่างน้อยต้องมี:
    `provider`, ข้อมูลรับรองของผู้ให้บริการ, `fromNumber` และ URL ของ Webhook
    ที่เข้าถึงได้แบบสาธารณะ
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    เอาต์พุตเริ่มต้นอ่านได้ในบันทึกแชตและเทอร์มินัล โดยตรวจสอบว่า
    Plugin ถูกเปิดใช้งาน ข้อมูลรับรองของผู้ให้บริการ การเปิดเผย Webhook
    และมีโหมดเสียงเพียงโหมดเดียว (`streaming` หรือ `realtime`) ที่เปิดใช้งาน
    ใช้ `--json` สำหรับสคริปต์

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    ทั้งสองคำสั่งเป็นการรันจำลองตามค่าเริ่มต้น เพิ่ม `--yes` เพื่อโทรแจ้งเตือน
    ขาออกแบบสั้นจริง:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
สำหรับ Twilio, Telnyx และ Plivo การตั้งค่าต้อง resolve ได้เป็น **URL ของ Webhook แบบสาธารณะ**
หาก `publicUrl`, URL ของ tunnel, URL ของ Tailscale หรือ serve fallback
resolve ไปยัง loopback หรือพื้นที่เครือข่ายส่วนตัว การตั้งค่าจะล้มเหลวแทนที่จะ
เริ่มผู้ให้บริการที่ไม่สามารถรับ Webhook จากผู้ให้บริการโทรศัพท์ได้
</Warning>

## การกำหนดค่า

หาก `enabled: true` แต่ผู้ให้บริการที่เลือกไม่มีข้อมูลรับรอง
การเริ่มต้น Gateway จะบันทึกคำเตือนว่าการตั้งค่ายังไม่สมบูรณ์พร้อมคีย์ที่ขาด
และข้ามการเริ่ม runtime คำสั่ง การเรียก RPC และเครื่องมือของเอเจนต์ยังคง
ส่งคืนการกำหนดค่าผู้ให้บริการที่ขาดอย่างตรงตัวเมื่อใช้งาน

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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx และ Plivo ทั้งหมดต้องใช้ URL ของ Webhook ที่ **เข้าถึงได้แบบสาธารณะ**
    - `mock` เป็นผู้ให้บริการสำหรับการพัฒนาในเครื่อง (ไม่มีการเรียกเครือข่าย)
    - Telnyx ต้องใช้ `telnyx.publicKey` (หรือ `TELNYX_PUBLIC_KEY`) เว้นแต่ `skipSignatureVerification` เป็น true
    - `skipSignatureVerification` ใช้สำหรับการทดสอบในเครื่องเท่านั้น
    - บน ngrok ระดับฟรี ให้ตั้งค่า `publicUrl` เป็น URL ของ ngrok ที่ตรงกันทุกตัวอักษร การตรวจสอบลายเซ็นจะถูกบังคับใช้เสมอ
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` อนุญาต Webhook ของ Twilio ที่มีลายเซ็นไม่ถูกต้อง **เฉพาะ** เมื่อ `tunnel.provider="ngrok"` และ `serve.bind` เป็น loopback (เอเจนต์ ngrok ในเครื่อง) สำหรับการพัฒนาในเครื่องเท่านั้น
    - URL ระดับฟรีของ Ngrok อาจเปลี่ยนหรือเพิ่มพฤติกรรม interstitial ได้ หาก `publicUrl` คลาดเคลื่อน ลายเซ็นของ Twilio จะล้มเหลว สำหรับ production: ควรใช้โดเมนที่เสถียรหรือ funnel ของ Tailscale

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` ปิดซ็อกเก็ตที่ไม่เคยส่งเฟรม `start` ที่ถูกต้อง
    - `streaming.maxPendingConnections` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ผ่านการยืนยันตัวตนทั้งหมด
    - `streaming.maxPendingConnectionsPerIp` จำกัดจำนวนซ็อกเก็ต pre-start ที่ยังไม่ผ่านการยืนยันตัวตนต่อ IP ต้นทาง
    - `streaming.maxConnections` จำกัดจำนวนซ็อกเก็ต media stream ที่เปิดอยู่ทั้งหมด (pending + active)

  </Accordion>
  <Accordion title="Legacy config migrations">
    คอนฟิกเก่าที่ใช้ `provider: "log"`, `twilio.from` หรือคีย์ OpenAI แบบเก่าใน
    `streaming.*` จะถูกเขียนใหม่โดย `openclaw doctor --fix`
    runtime fallback ยังคงยอมรับคีย์ voice-call เก่าในตอนนี้ แต่
    เส้นทางการเขียนใหม่คือ `openclaw doctor --fix` และ compat shim เป็นเพียง
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

ตามค่าเริ่มต้น Voice Call ใช้ `sessionScope: "per-phone"` เพื่อให้การโทรซ้ำจาก
ผู้โทรรายเดิมเก็บหน่วยความจำการสนทนาไว้ ตั้งค่า `sessionScope: "per-call"` เมื่อ
การโทรผ่านผู้ให้บริการแต่ละครั้งควรเริ่มด้วยบริบทใหม่ เช่น แผนกต้อนรับ
การจอง IVR หรือโฟลว์ bridge ของ Google Meet ที่หมายเลขโทรศัพท์เดียวกันอาจ
แทนการประชุมคนละครั้ง

## การสนทนาด้วยเสียงแบบเรียลไทม์

`realtime` เลือกผู้ให้บริการเสียงแบบเรียลไทม์ฟูลดูเพล็กซ์สำหรับเสียงการโทรสด
ส่วนนี้แยกจาก `streaming` ซึ่งเพียงส่งต่อเสียงไปยัง
ผู้ให้บริการถอดเสียงแบบเรียลไทม์เท่านั้น

<Warning>
`realtime.enabled` ใช้ร่วมกับ `streaming.enabled` ไม่ได้ ให้เลือก
โหมดเสียงหนึ่งโหมดต่อการโทร
</Warning>

พฤติกรรม runtime ปัจจุบัน:

- รองรับ `realtime.enabled` สำหรับ Twilio Media Streams
- `realtime.provider` เป็นตัวเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการเสียงแบบเรียลไทม์รายแรกที่ลงทะเบียนไว้
- ผู้ให้บริการเสียงแบบเรียลไทม์ที่รวมมาด้วย: Google Gemini Live (`google`) และ OpenAI (`openai`) ซึ่งลงทะเบียนโดย Plugin ของผู้ให้บริการนั้น
- คอนฟิกดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ภายใต้ `realtime.providers.<providerId>`
- Voice Call เปิดเผยเครื่องมือเรียลไทม์ `openclaw_agent_consult` ที่ใช้ร่วมกันตามค่าเริ่มต้น โมเดลเรียลไทม์สามารถเรียกใช้ได้เมื่อผู้โทรขอการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
- `realtime.consultPolicy` เพิ่มคำแนะนำเพิ่มเติมสำหรับกรณีที่โมเดลเรียลไทม์ควรเรียก `openclaw_agent_consult`
- `realtime.agentContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้งาน Voice Call จะฉีดตัวตนเอเจนต์แบบจำกัด ข้อความระบบทับค่าเดิม และ capsule ของไฟล์ workspace ที่เลือก เข้าไปในคำสั่งของผู้ให้บริการเรียลไทม์ระหว่างการตั้งค่าเซสชัน
- `realtime.fastContext.enabled` ปิดโดยค่าเริ่มต้น เมื่อเปิดใช้งาน Voice Call จะค้นหาหน่วยความจำ/บริบทเซสชันที่ทำดัชนีไว้สำหรับคำถาม consult ก่อน และส่งคืน snippet เหล่านั้นให้โมเดลเรียลไทม์ภายใน `realtime.fastContext.timeoutMs` ก่อน fallback ไปยังเอเจนต์ consult เต็มรูปแบบเฉพาะเมื่อ `realtime.fastContext.fallbackToConsult` เป็น true
- หาก `realtime.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการเสียงแบบเรียลไทม์ที่ลงทะเบียนไว้เลย Voice Call จะบันทึกคำเตือนและข้ามสื่อเรียลไทม์แทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว
- คีย์เซสชัน consult ใช้เซสชันการโทรที่จัดเก็บไว้ซ้ำเมื่อมี จากนั้น fallback ไปยัง `sessionScope` ที่กำหนดค่าไว้ (`per-phone` ตามค่าเริ่มต้น หรือ `per-call` สำหรับการโทรที่แยกกัน)

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
| `auto`        | ใช้ prompt เริ่มต้นต่อไปและให้ผู้ให้บริการตัดสินใจว่าจะเรียกเครื่องมือ consult เมื่อใด              |
| `substantive` | ตอบบทสนทนาเชื่อมต่อแบบง่ายโดยตรง และ consult ก่อนข้อเท็จจริง หน่วยความจำ เครื่องมือ หรือบริบท |
| `always`      | consult ก่อนคำตอบที่มีสาระทุกครั้ง                                                        |

### บริบทเสียงของเอเจนต์

เปิดใช้งาน `realtime.agentContext` เมื่อ voice bridge ควรให้เสียงเหมือน
เอเจนต์ OpenClaw ที่กำหนดค่าไว้โดยไม่ต้องเสียรอบการเดินทางของ agent-consult เต็มรูปแบบใน
รอบสนทนาปกติ capsule ของบริบทจะถูกเพิ่มหนึ่งครั้งเมื่อสร้างเซสชันเรียลไทม์
ดังนั้นจึงไม่เพิ่ม latency ต่อรอบ การเรียกไปยัง
`openclaw_agent_consult` ยังคงรันเอเจนต์ OpenClaw เต็มรูปแบบ และควรใช้
สำหรับงานเครื่องมือ ข้อมูลปัจจุบัน การค้นหาหน่วยความจำ หรือสถานะ workspace

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
    ค่าเริ่มต้น: คีย์ API จาก `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` หรือ `GOOGLE_GENERATIVE_AI_API_KEY`; โมเดล
    `gemini-2.5-flash-native-audio-preview-12-2025`; เสียง `Kore`
    `sessionResumption` และ `contextWindowCompression` เปิดเป็นค่าเริ่มต้นสำหรับสายที่ยาวขึ้น
    และเชื่อมต่อใหม่ได้ ใช้ `silenceDurationMs`, `startSensitivity` และ
    `endSensitivity` เพื่อปรับการสลับรอบสนทนาให้เร็วขึ้นบนเสียงโทรศัพท์

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

- `streaming.provider` เป็นค่าทางเลือก หากไม่ได้ตั้งค่า Voice Call จะใช้ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่ลงทะเบียนรายแรก
- ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่รวมมาให้: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) และ xAI (`xai`) ซึ่งลงทะเบียนโดย Plugin ผู้ให้บริการของตน
- การกำหนดค่าดิบที่ผู้ให้บริการเป็นเจ้าของอยู่ใต้ `streaming.providers.<providerId>`
- หลังจาก Twilio ส่งข้อความ `start` ของสตรีมที่ยอมรับแล้ว Voice Call จะลงทะเบียนสตรีมทันที จัดคิวสื่อขาเข้าผ่านผู้ให้บริการถอดเสียงระหว่างที่ผู้ให้บริการกำลังเชื่อมต่อ และเริ่มคำทักทายแรกหลังจากการถอดเสียงแบบเรียลไทม์พร้อมแล้วเท่านั้น
- หาก `streaming.provider` ชี้ไปยังผู้ให้บริการที่ไม่ได้ลงทะเบียน หรือไม่มีผู้ให้บริการใดลงทะเบียน Voice Call จะบันทึกคำเตือนและข้ามการสตรีมสื่อแทนที่จะทำให้ Plugin ทั้งหมดล้มเหลว

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
    endpoint `wss://api.x.ai/v1/stt`; การเข้ารหัส `mulaw`; อัตราสุ่มตัวอย่าง `8000`;
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
เสียงพูดในการโทร คุณสามารถเขียนทับภายใต้การกำหนดค่า Plugin ด้วย
**รูปแบบเดียวกัน** — โดยจะผสานแบบลึกกับ `messages.tts`

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
**ระบบเสียงพูดของ Microsoft จะถูกละเว้นสำหรับการโทรด้วยเสียง** เสียงโทรศัพท์ต้องใช้ PCM;
ทรานสปอร์ต Microsoft ปัจจุบันไม่ได้เปิดเผยเอาต์พุต PCM สำหรับโทรศัพท์
</Warning>

หมายเหตุด้านพฤติกรรม:

- คีย์ `tts.<provider>` แบบเดิมภายในการกำหนดค่า Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) จะถูกซ่อมโดย `openclaw doctor --fix`; การกำหนดค่าที่ commit แล้วควรใช้ `tts.providers.<provider>`
- TTS หลักจะถูกใช้เมื่อเปิดใช้งานการสตรีมสื่อของ Twilio; ไม่เช่นนั้นการโทรจะย้อนกลับไปใช้เสียงเนทีฟของผู้ให้บริการ
- หากสตรีมสื่อ Twilio ทำงานอยู่แล้ว Voice Call จะไม่ย้อนกลับไปใช้ TwiML `<Say>` หาก TTS สำหรับโทรศัพท์ใช้งานไม่ได้ในสถานะนั้น คำขอเล่นเสียงจะล้มเหลวแทนที่จะผสมเส้นทางการเล่นเสียงสองเส้นทาง
- เมื่อ TTS สำหรับโทรศัพท์ย้อนกลับไปใช้ผู้ให้บริการรอง Voice Call จะบันทึกคำเตือนพร้อมลำดับผู้ให้บริการ (`from`, `to`, `attempts`) เพื่อการดีบัก
- เมื่อการแทรกพูดของ Twilio หรือการรื้อสตรีมล้างคิว TTS ที่รอดำเนินการ คำขอเล่นเสียงที่อยู่ในคิวจะถูกปิดสถานะแทนที่จะปล่อยให้ผู้โทรค้างรอให้การเล่นเสียงเสร็จสิ้น

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
  <Tab title="เขียนทับโมเดล OpenAI (ผสานแบบลึก)">
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

นโยบายสายโทรเข้ามีค่าเริ่มต้นเป็น `disabled` หากต้องการเปิดใช้สายโทรเข้า ให้ตั้งค่า:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` เป็นการคัดกรองหมายเลขผู้โทรที่มีความมั่นใจต่ำ
Plugin จะทำให้ค่า `From` ที่ผู้ให้บริการส่งมาอยู่ในรูปแบบมาตรฐานและเปรียบเทียบกับ
`allowFrom` การยืนยัน Webhook พิสูจน์ตัวตนการส่งจากผู้ให้บริการและ
ความครบถ้วนของเพย์โหลด แต่ **ไม่ได้** พิสูจน์ความเป็นเจ้าของหมายเลขผู้โทร
PSTN/VoIP ให้ถือว่า `allowFrom` เป็นการกรองหมายเลขผู้โทร ไม่ใช่ตัวตน
ผู้โทรที่เชื่อถือได้สูง
</Warning>

การตอบกลับอัตโนมัติใช้ระบบตัวแทน ปรับแต่งด้วย `responseModel`,
`responseSystemPrompt` และ `responseTimeoutMs`

### การกำหนดเส้นทางแยกตามหมายเลข

ใช้ `numbers` เมื่อ Plugin Voice Call หนึ่งรายการรับสายสำหรับหมายเลขโทรศัพท์หลายหมายเลข
และแต่ละหมายเลขควรทำงานเหมือนสายคนละสาย ตัวอย่างเช่น หมายเลขหนึ่ง
อาจใช้ผู้ช่วยส่วนตัวแบบเป็นกันเอง ขณะที่อีกหมายเลขใช้บุคลิกธุรกิจ
ตัวแทนตอบกลับคนละตัว และเสียง TTS คนละเสียง

เส้นทางจะถูกเลือกจากหมายเลข `To` ที่โทรเข้า ซึ่งผู้ให้บริการส่งมา คีย์ต้องเป็น
หมายเลข E.164 เมื่อมีสายเข้า Voice Call จะ resolve เส้นทางที่ตรงกันหนึ่งครั้ง
เก็บเส้นทางที่ตรงกันไว้ในระเบียนการโทร และใช้การกำหนดค่าที่มีผลนั้นซ้ำ
สำหรับคำทักทาย เส้นทางการตอบกลับอัตโนมัติแบบคลาสสิก เส้นทาง consult แบบเรียลไทม์ และการเล่น
TTS หากไม่มีเส้นทางใดตรงกัน จะใช้การกำหนดค่า Voice Call ส่วนกลาง
สายโทรออกไม่ใช้ `numbers`; ส่งเป้าหมายขาออก ข้อความ และ
เซสชันอย่างชัดเจนเมื่อเริ่มการโทร

การเขียนทับเส้นทางรองรับในปัจจุบัน:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

ค่าเส้นทาง `tts` จะผสานแบบลึกทับการกำหนดค่า `tts` ส่วนกลางของ Voice Call ดังนั้น
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

สำหรับการตอบกลับอัตโนมัติ Voice Call จะต่อท้ายสัญญาเอาต์พุตคำพูดที่เข้มงวดเข้ากับ
พรอมป์ระบบ:

```text
{"spoken":"..."}
```

Voice Call ดึงข้อความเสียงพูดอย่างระมัดระวัง:

- ละเว้นเพย์โหลดที่ทำเครื่องหมายเป็นเนื้อหาการให้เหตุผล/ข้อผิดพลาด
- แยกวิเคราะห์ JSON โดยตรง, JSON ใน fence หรือคีย์ `"spoken"` แบบ inline
- ย้อนกลับไปใช้ข้อความธรรมดาและลบย่อหน้านำเข้าที่น่าจะเป็นการวางแผน/เมตา

สิ่งนี้ทำให้การเล่นเสียงพูดเน้นข้อความที่ส่งถึงผู้โทรและหลีกเลี่ยง
การรั่วไหลของข้อความการวางแผนไปยังเสียง

### พฤติกรรมเมื่อเริ่มต้นการสนทนา

สำหรับสาย `conversation` ขาออก การจัดการข้อความแรกผูกกับสถานะ
การเล่นเสียงสด:

- การล้างคิวเมื่อมีการแทรกพูดและการตอบกลับอัตโนมัติจะถูกระงับเฉพาะขณะที่คำทักทายแรกกำลังพูดอยู่
- หากการเล่นเสียงเริ่มต้นล้มเหลว สายจะกลับไปเป็น `listening` และข้อความเริ่มต้นจะยังคงอยู่ในคิวเพื่อ retry
- การเล่นเสียงเริ่มต้นสำหรับการสตรีม Twilio เริ่มเมื่อสตรีมเชื่อมต่อโดยไม่มีความล่าช้าเพิ่มเติม
- การแทรกพูดยกเลิกการเล่นเสียงที่ทำงานอยู่และล้างรายการ Twilio TTS ที่อยู่ในคิวแต่ยังไม่ได้เล่น รายการที่ถูกล้างจะ resolve เป็นข้ามแล้ว ดังนั้นลอจิกการตอบกลับถัดไปจึงดำเนินต่อได้โดยไม่ต้องรอเสียงที่จะไม่มีวันเล่น
- การสนทนาเสียงแบบเรียลไทม์ใช้ turn เปิดของสตรีมเรียลไทม์เอง Voice Call จะ **ไม่** โพสต์อัปเดต TwiML `<Say>` แบบเดิมสำหรับข้อความเริ่มต้นนั้น ดังนั้นเซสชัน `<Connect><Stream>` ขาออกจึงยังคงแนบอยู่

### ระยะผ่อนผันเมื่อสตรีม Twilio ตัดการเชื่อมต่อ

เมื่อสตรีมสื่อ Twilio ตัดการเชื่อมต่อ Voice Call จะรอ **2000 ms** ก่อน
จบสายโดยอัตโนมัติ:

- หากสตรีมเชื่อมต่อใหม่ในช่วงเวลาดังกล่าว การจบอัตโนมัติจะถูกยกเลิก
- หากไม่มีสตรีมลงทะเบียนใหม่หลังระยะผ่อนผัน สายจะถูกจบเพื่อป้องกันไม่ให้สายที่ active ค้างอยู่

## ตัวเก็บกวาดสายค้าง

ใช้ `staleCallReaperSeconds` เพื่อจบสายที่ไม่เคยได้รับ Webhook
ปลายทาง (ตัวอย่างเช่น สายในโหมดแจ้งเตือนที่ไม่เคยเสร็จสมบูรณ์) ค่าเริ่มต้น
คือ `0` (ปิดใช้งาน)

ช่วงที่แนะนำ:

- **โปรดักชัน:** `120`–`300` วินาทีสำหรับโฟลว์แบบแจ้งเตือน
- ตั้งค่านี้ให้ **สูงกว่า `maxDurationSeconds`** เพื่อให้การเรียกปกติทำงานจนจบได้ จุดเริ่มต้นที่ดีคือ `maxDurationSeconds + 30–60` วินาที

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

เมื่อมีพร็อกซีหรือทันเนลอยู่หน้า Gateway Plugin จะสร้าง URL สาธารณะใหม่สำหรับการตรวจสอบลายเซ็น ตัวเลือกเหล่านี้ควบคุมว่าจะเชื่อถือเฮดเดอร์ที่ส่งต่อใดบ้าง:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  อนุญาตโฮสต์จากเฮดเดอร์การส่งต่อ
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  เชื่อถือเฮดเดอร์ที่ส่งต่อโดยไม่มีรายการอนุญาต
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  เชื่อถือเฮดเดอร์ที่ส่งต่อเฉพาะเมื่อ IP ระยะไกลของคำขอตรงกับรายการเท่านั้น
</ParamField>

การป้องกันเพิ่มเติม:

- เปิดใช้ **การป้องกันการเล่นซ้ำ** ของ Webhook สำหรับ Twilio และ Plivo คำขอ Webhook ที่ถูกต้องซึ่งถูกเล่นซ้ำจะได้รับการตอบรับ แต่จะถูกข้ามสำหรับผลข้างเคียง
- เทิร์นการสนทนาของ Twilio มีโทเค็นต่อเทิร์นในคอลแบ็ก `<Gather>` ดังนั้นคอลแบ็กเสียงพูดที่เก่า/ถูกเล่นซ้ำจึงไม่สามารถตอบสนองเทิร์นถอดเสียงที่รอดำเนินการใหม่กว่าได้
- คำขอ Webhook ที่ไม่ได้ยืนยันตัวตนจะถูกปฏิเสธก่อนอ่านบอดี้เมื่อไม่มีเฮดเดอร์ลายเซ็นที่ผู้ให้บริการกำหนด
- Webhook ของ voice-call ใช้โปรไฟล์บอดี้ก่อนการยืนยันตัวตนแบบแชร์ (64 KB / 5 วินาที) พร้อมขีดจำกัดคำขอที่กำลังดำเนินอยู่ต่อ IP ก่อนการตรวจสอบลายเซ็น

ตัวอย่างที่มีโฮสต์สาธารณะแบบคงที่:

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

เมื่อ Gateway ทำงานอยู่แล้ว คำสั่ง `voicecall` สำหรับปฏิบัติการจะมอบหมายงานให้รันไทม์ voice-call ที่ Gateway เป็นเจ้าของ เพื่อให้ CLI ไม่ผูกเซิร์ฟเวอร์ Webhook ตัวที่สอง หากติดต่อ Gateway ไม่ได้ คำสั่งจะถอยกลับไปใช้รันไทม์ CLI แบบสแตนด์อโลน

`latency` อ่าน `calls.jsonl` จากพาธที่เก็บข้อมูล voice-call เริ่มต้น ใช้ `--file <path>` เพื่อชี้ไปยังล็อกอื่น และ `--last <n>` เพื่อจำกัดการวิเคราะห์ให้เหลือ N รายการสุดท้าย (ค่าเริ่มต้น 200) เอาต์พุตมี p50/p90/p99 สำหรับเวลาแฝงของเทิร์นและเวลารอฟัง

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `voice_call`

| การดำเนินการ | อาร์กิวเมนต์ |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message` |
| `speak_to_user` | `callId`, `message` |
| `send_dtmf` | `callId`, `digits` |
| `end_call` | `callId` |
| `get_status` | `callId` |

รีโพนี้มาพร้อมเอกสาร Skills ที่ตรงกันที่ `skills/voice-call/SKILL.md`

## Gateway RPC

| เมธอด | อาร์กิวเมนต์ |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message` |
| `voicecall.speak` | `callId`, `message` |
| `voicecall.dtmf` | `callId`, `digits` |
| `voicecall.end` | `callId` |
| `voicecall.status` | `callId` |

`dtmfSequence` ใช้ได้เฉพาะกับ `mode: "conversation"` การโทรในโหมดแจ้งเตือนควรใช้ `voicecall.dtmf` หลังจากมีการโทรแล้ว หากต้องการส่งตัวเลขหลังเชื่อมต่อ

## การแก้ปัญหา

### การตั้งค่าล้มเหลวในการเปิดเผย Webhook

เรียกใช้การตั้งค่าจากสภาพแวดล้อมเดียวกับที่รัน Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

สำหรับ `twilio`, `telnyx` และ `plivo` ค่า `webhook-exposure` ต้องเป็นสีเขียว `publicUrl` ที่กำหนดค่าไว้ยังคงล้มเหลวได้เมื่อชี้ไปยังพื้นที่เครือข่ายภายในเครื่องหรือเครือข่ายส่วนตัว เพราะผู้ให้บริการโทรศัพท์ไม่สามารถเรียกกลับไปยังที่อยู่เหล่านั้นได้ อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

การโทรออกในโหมดแจ้งเตือนของ Twilio ส่ง TwiML `<Say>` เริ่มต้นโดยตรงในคำขอสร้างการโทร ดังนั้นข้อความพูดแรกจึงไม่ขึ้นกับการที่ Twilio ดึง TwiML ของ Webhook แต่ยังจำเป็นต้องมี Webhook สาธารณะสำหรับคอลแบ็กสถานะ การโทรแบบสนทนา DTMF ก่อนเชื่อมต่อ สตรีมเรียลไทม์ และการควบคุมการโทรหลังเชื่อมต่อ

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

หลังเปลี่ยนการกำหนดค่า ให้รีสตาร์ตหรือโหลด Gateway ใหม่ จากนั้นเรียกใช้:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการรันทดสอบโดยไม่ลงมือจริง เว้นแต่คุณส่ง `--yes`

### ข้อมูลประจำตัวของผู้ให้บริการล้มเหลว

ตรวจสอบผู้ให้บริการที่เลือกและฟิลด์ข้อมูลประจำตัวที่จำเป็น:

- Twilio: `twilio.accountSid`, `twilio.authToken` และ `fromNumber` หรือ `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` และ `TWILIO_FROM_NUMBER`
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` และ `fromNumber`
- Plivo: `plivo.authId`, `plivo.authToken` และ `fromNumber`

ข้อมูลประจำตัวต้องมีอยู่บนโฮสต์ Gateway การแก้ไขโปรไฟล์เชลล์ภายในเครื่องไม่มีผลกับ Gateway ที่กำลังทำงานอยู่จนกว่าจะรีสตาร์ตหรือโหลดสภาพแวดล้อมใหม่

### การโทรเริ่มได้ แต่ Webhook ของผู้ให้บริการไม่มาถึง

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

สาเหตุที่พบบ่อย:

- `publicUrl` ชี้ไปยังพาธที่ต่างจาก `serve.path`
- URL ทันเนลเปลี่ยนหลังจาก Gateway เริ่มทำงาน
- พร็อกซีส่งต่อคำขอแต่ตัดหรือเขียนเฮดเดอร์ host/proto ใหม่
- ไฟร์วอลล์หรือ DNS ส่งชื่อโฮสต์สาธารณะไปยังที่อื่นที่ไม่ใช่ Gateway
- Gateway ถูกรีสตาร์ตโดยไม่ได้เปิดใช้ Plugin Voice Call

เมื่อมี reverse proxy หรือทันเนลอยู่หน้า Gateway ให้ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์สาธารณะ หรือใช้ `webhookSecurity.trustedProxyIPs` สำหรับที่อยู่พร็อกซีที่ทราบแน่ชัด ใช้ `webhookSecurity.trustForwardingHeaders` เฉพาะเมื่อขอบเขตพร็อกซีอยู่ภายใต้การควบคุมของคุณ

### การตรวจสอบลายเซ็นล้มเหลว

ลายเซ็นของผู้ให้บริการจะถูกตรวจสอบกับ URL สาธารณะที่ OpenClaw สร้างใหม่จากคำขอขาเข้า หากลายเซ็นล้มเหลว:

- ยืนยันว่า URL Webhook ของผู้ให้บริการตรงกับ `publicUrl` ทุกอักขระ รวมถึงสกีม โฮสต์ และพาธ
- สำหรับ URL ระดับฟรีของ ngrok ให้อัปเดต `publicUrl` เมื่อชื่อโฮสต์ของทันเนลเปลี่ยน
- ตรวจสอบว่าพร็อกซีรักษาเฮดเดอร์ host และ proto เดิมไว้ หรือกำหนดค่า `webhookSecurity.allowedHosts`
- อย่าเปิดใช้ `skipSignatureVerification` นอกการทดสอบภายในเครื่อง

### การเข้าร่วม Google Meet ผ่าน Twilio ล้มเหลว

Google Meet ใช้ Plugin นี้สำหรับการเข้าร่วมผ่านเบอร์โทรเข้าของ Twilio ตรวจสอบ Voice Call ก่อน:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

จากนั้นตรวจสอบทรานสปอร์ต Google Meet โดยตรง:

```bash
openclaw googlemeet setup --transport twilio
```

หาก Voice Call เป็นสีเขียวแต่ผู้เข้าร่วม Meet ไม่เคยเข้าร่วม ให้ตรวจสอบหมายเลขโทรเข้า Meet, PIN และ `--dtmf-sequence` การโทรอาจทำงานปกติในขณะที่การประชุมปฏิเสธหรือเพิกเฉยต่อลำดับ DTMF ที่ไม่ถูกต้อง

Google Meet เริ่มเลกโทรศัพท์ Twilio ผ่าน `voicecall.start` พร้อมลำดับ DTMF ก่อนเชื่อมต่อ ลำดับที่ได้จาก PIN จะรวม `voiceCall.dtmfDelayMs` ของ Plugin Google Meet เป็นตัวเลขรอของ Twilio นำหน้า ค่าเริ่มต้นคือ 12 วินาที เพราะพรอมป์โทรเข้า Meet อาจมาช้า จากนั้น Voice Call จะเปลี่ยนเส้นทางกลับไปยังการจัดการแบบเรียลไทม์ก่อนร้องขอคำทักทายเริ่มต้น

ใช้ `openclaw logs --follow` สำหรับร่องรอยเฟสแบบสด การเข้าร่วม Twilio Meet ที่สมบูรณ์จะบันทึกลำดับนี้:

- Google Meet มอบหมายการเข้าร่วม Twilio ให้ Voice Call
- Voice Call เก็บ TwiML DTMF ก่อนเชื่อมต่อ
- TwiML เริ่มต้นของ Twilio ถูกใช้และให้บริการก่อนการจัดการแบบเรียลไทม์
- Voice Call ให้บริการ TwiML เรียลไทม์สำหรับการโทร Twilio
- Google Meet ขอเสียงพูดแนะนำตัวด้วย `voicecall.speak` หลังดีเลย์หลัง DTMF

`openclaw voicecall tail` ยังคงแสดงระเบียนการโทรที่เก็บไว้ถาวร ซึ่งมีประโยชน์สำหรับสถานะการโทรและบทถอดเสียง แต่ทรานซิชัน Webhook/เรียลไทม์ไม่ได้ปรากฏที่นั่นทุกครั้ง

### การโทรเรียลไทม์ไม่มีเสียงพูด

ยืนยันว่าเปิดใช้โหมดเสียงเพียงโหมดเดียว `realtime.enabled` และ `streaming.enabled` ไม่สามารถเป็น true พร้อมกันได้

สำหรับการโทร Twilio แบบเรียลไทม์ ให้ตรวจสอบเพิ่มเติมว่า:

- Plugin ผู้ให้บริการเรียลไทม์ถูกโหลดและลงทะเบียนแล้ว
- `realtime.provider` ไม่ได้ตั้งค่าไว้ หรือระบุชื่อผู้ให้บริการที่ลงทะเบียนแล้ว
- คีย์ API ของผู้ให้บริการพร้อมใช้งานสำหรับโปรเซส Gateway
- `openclaw logs --follow` แสดงว่ามีการให้บริการ TwiML เรียลไทม์ บริดจ์เรียลไทม์เริ่มทำงาน และคำทักทายเริ่มต้นถูกเข้าคิวแล้ว

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [แปลงข้อความเป็นเสียงพูด](/th/tools/tts)
- [ปลุกด้วยเสียง](/th/nodes/voicewake)
