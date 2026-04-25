---
read_when:
    - คุณต้องการใช้โมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องตั้งค่า `XIAOMI_API_KEY`
summary: ใช้โมเดล Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo คือแพลตฟอร์ม API สำหรับโมเดล **MiMo** OpenClaw ใช้
ปลายทาง OpenAI-compatible ของ Xiaomi พร้อมการยืนยันตัวตนด้วย API key

| คุณสมบัติ | ค่า                            |
| --------- | ------------------------------ |
| Provider  | `xiaomi`                       |
| Auth      | `XIAOMI_API_KEY`               |
| API       | OpenAI-compatible              |
| Base URL  | `https://api.xiaomimimo.com/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ใน [คอนโซล Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## แค็ตตาล็อกในตัว

| Model ref              | อินพุต       | บริบท      | เอาต์พุตสูงสุด | Reasoning | หมายเหตุ      |
| ---------------------- | ------------ | ---------- | -------------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text         | 262,144    | 8,192          | ไม่รองรับ | โมเดลเริ่มต้น |
| `xiaomi/mimo-v2-pro`   | text         | 1,048,576  | 32,000         | รองรับ    | บริบทขนาดใหญ่ |
| `xiaomi/mimo-v2-omni`  | text, image  | 262,144    | 32,000         | รองรับ    | Multimodal    |

<Tip>
ref โมเดลเริ่มต้นคือ `xiaomi/mimo-v2-flash` ระบบจะ inject provider ให้อัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` หรือมี auth profile อยู่แล้ว
</Tip>

## Text-to-speech

Plugin `xiaomi` ที่มาพร้อมระบบยังลงทะเบียน Xiaomi MiMo เป็น speech provider สำหรับ
`messages.tts` ด้วย โดยจะเรียกสัญญา TTS ของ chat-completions ของ Xiaomi พร้อมข้อความเป็น
ข้อความ `assistant` และคำแนะนำด้านสไตล์แบบทางเลือกเป็นข้อความ `user`

| คุณสมบัติ | ค่า                                     |
| --------- | --------------------------------------- |
| TTS id    | `xiaomi` (`mimo` alias)                 |
| Auth      | `XIAOMI_API_KEY`                        |
| API       | `POST /v1/chat/completions` พร้อม `audio` |
| ค่าเริ่มต้น | `mimo-v2.5-tts`, เสียง `mimo_default`   |
| เอาต์พุต   | MP3 โดยค่าเริ่มต้น; WAV เมื่อมีการตั้งค่า |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "สดใส เป็นธรรมชาติ และมีน้ำเสียงสนทนา",
        },
      },
    },
  },
}
```

เสียงในตัวที่รองรับ ได้แก่ `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` และ `Dean` รองรับ `mimo-v2-tts` สำหรับบัญชี MiMo
TTS รุ่นเก่าด้วย โดยค่าเริ่มต้นจะใช้โมเดล TTS MiMo-V2.5 ปัจจุบัน สำหรับปลายทาง
voice note เช่น Feishu และ Telegram นั้น OpenClaw จะทรานส์โค้ดเอาต์พุตของ Xiaomi เป็น Opus 48kHz
ด้วย `ffmpeg` ก่อนส่งมอบ

## ตัวอย่าง config

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="พฤติกรรมการ inject อัตโนมัติ">
    provider `xiaomi` จะถูก inject ให้อัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` ในสภาพแวดล้อมของคุณ หรือมี auth profile อยู่แล้ว คุณไม่จำเป็นต้องกำหนด provider ด้วยตนเอง เว้นแต่คุณต้องการ override metadata ของโมเดลหรือ base URL
  </Accordion>

  <Accordion title="รายละเอียดของโมเดล">
    - **mimo-v2-flash** — น้ำหนักเบาและรวดเร็ว เหมาะสำหรับงานข้อความทั่วไป ไม่รองรับ reasoning
    - **mimo-v2-pro** — รองรับ reasoning พร้อม context window ขนาด 1M token สำหรับงานเอกสารยาว
    - **mimo-v2-omni** — โมเดล multimodal ที่รองรับ reasoning และรับอินพุตได้ทั้งข้อความและภาพ

    <Note>
    ทุกโมเดลใช้ prefix `xiaomi/` (เช่น `xiaomi/mimo-v2-pro`)
    </Note>

  </Accordion>

  <Accordion title="การแก้ปัญหา">
    - หากโมเดลไม่ปรากฏ ให้ยืนยันว่าได้ตั้งค่า `XIAOMI_API_KEY` และค่านั้นถูกต้อง
    - เมื่อ Gateway รันเป็น daemon ให้ตรวจสอบว่าคีย์พร้อมใช้งานสำหรับโปรเซสนั้น (เช่นใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน interactive shell ของคุณจะไม่มองเห็นได้จากโปรเซส gateway ที่ถูกจัดการโดย daemon ให้ใช้ `~/.openclaw/.env` หรือ config `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างต่อเนื่อง
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการตั้งค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="คอนโซล Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการ API key
  </Card>
</CardGroup>
