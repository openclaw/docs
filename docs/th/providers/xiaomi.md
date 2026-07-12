---
read_when:
    - คุณต้องการใช้โมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องตั้งค่าการยืนยันตัวตน Xiaomi MiMo หรือ Token Plan
summary: ใช้โมเดลแบบจ่ายตามการใช้งานและ Token Plan ของ Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T16:41:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo คือแพลตฟอร์ม API สำหรับโมเดล **MiMo** โดย Plugin `xiaomi`
ที่มาพร้อมกับระบบ (`enabledByDefault: true` ไม่ต้องติดตั้ง) จะลงทะเบียน
ผู้ให้บริการข้อความสองราย รวมถึงผู้ให้บริการเสียงพูด (TTS) หนึ่งราย:

- `xiaomi` - คีย์แบบจ่ายตามการใช้งาน (`sk-...`)
- `xiaomi-token-plan` - คีย์ Token Plan (`tp-...`) พร้อมค่าปลายทางที่ตั้งไว้ล่วงหน้าตามภูมิภาค

| คุณสมบัติ              | ค่า                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ       | `xiaomi` (จ่ายตามการใช้งาน), `xiaomi-token-plan` (Token Plan)                                                                                      |
| ตัวแปรสภาพแวดล้อมการยืนยันตัวตน | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                             |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| แฟล็ก CLI โดยตรง       | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                       |
| API                    | การเติมข้อความแชตที่เข้ากันได้กับ OpenAI (`openai-completions`)                                                                                    |
| สัญญาเสียงพูด          | `speechProviders: ["xiaomi"]`                                                                                                                       |
| URL ฐาน                | จ่ายตามการใช้งาน: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                        |
| โมเดลเริ่มต้น          | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                           |
| ค่าเริ่มต้น TTS        | `mimo-v2.5-tts`, เสียง `mimo_default`; โมเดลออกแบบเสียง `mimo-v2.5-tts-voicedesign`                                                               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get the right key">
    สร้างคีย์แบบจ่ายตามการใช้งานใน [คอนโซล Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) หรือเปิดหน้าการสมัคร Token Plan แล้วคัดลอก URL ฐานที่เข้ากันได้กับ OpenAI สำหรับภูมิภาค พร้อมคีย์ `tp-...` ที่ตรงกัน
  </Step>

  <Step title="Run onboarding">
    แบบจ่ายตามการใช้งาน:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
การเริ่มต้นใช้งานจะตรวจสอบรูปแบบคีย์และแสดงคำเตือนเมื่อป้อนคีย์ `tp-...` ในขั้นตอนแบบจ่ายตามการใช้งาน หรือป้อนคีย์ `sk-...` ในขั้นตอน Token Plan
</Tip>

## แค็ตตาล็อกแบบจ่ายตามการใช้งาน

| การอ้างอิงโมเดล        | อินพุต      | บริบท    | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ          |
| ---------------------- | ----------- | --------- | --------------- | ------------- | ----------------- |
| `xiaomi/mimo-v2-flash` | ข้อความ     | 262,144   | 8,192           | ไม่รองรับ     | โมเดลเริ่มต้น     |
| `xiaomi/mimo-v2-pro`   | ข้อความ     | 1,048,576 | 32,000          | รองรับ        | บริบทขนาดใหญ่     |
| `xiaomi/mimo-v2-omni`  | ข้อความ, รูปภาพ | 262,144 | 32,000          | รองรับ        | หลายรูปแบบข้อมูล  |

## แค็ตตาล็อก Token Plan

เลือกตัวเลือกการยืนยันตัวตน Token Plan ที่ตรงกับ URL ฐานของภูมิภาคซึ่งแสดงอยู่ในส่วนติดต่อการสมัครใช้งานของ Xiaomi:

| ตัวเลือกการยืนยันตัวตน | URL ฐาน                                    |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| การอ้างอิงโมเดล                   | อินพุต          | บริบท    | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ         |
| --------------------------------- | --------------- | --------- | --------------- | ------------- | ---------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | ข้อความ         | 1,048,576 | 131,072         | รองรับ        | โมเดลเริ่มต้น    |
| `xiaomi-token-plan/mimo-v2.5`     | ข้อความ, รูปภาพ | 1,048,576 | 131,072         | รองรับ        | หลายรูปแบบข้อมูล |

`xiaomi-token-plan` ต้องมี URL ฐานของภูมิภาคจึงจะสามารถระบุปลายทางได้ เส้นทางที่รองรับ
คือการเลือก Token Plan ในขั้นตอนเริ่มต้นใช้งานที่มาพร้อมกับระบบ หรือบล็อกการกำหนดค่า
`models.providers.xiaomi-token-plan` ที่ระบุ `baseUrl` อย่างชัดเจน โดยระบบจะไม่เสนอ
ผู้ให้บริการนี้หากไม่มีรายการใดรายการหนึ่งดังกล่าว

## โมเดลการให้เหตุผล

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` และ `mimo-v2.5-pro` รองรับ
[คำสั่ง `/think`](/th/tools/thinking) ของ OpenClaw ที่ระดับ `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` และ `max` (ค่าเริ่มต้นคือ `high`)
ส่วน `mimo-v2-flash` ไม่รองรับการให้เหตุผล

## การแปลงข้อความเป็นเสียงพูด

Plugin `xiaomi` ที่มาพร้อมกับระบบยังลงทะเบียน Xiaomi MiMo เป็นผู้ให้บริการเสียงพูด
สำหรับ `messages.tts` โดยเรียกใช้สัญญา TTS แบบการเติมข้อความแชตของ Xiaomi
พร้อมส่งข้อความที่จะอ่านเป็นข้อความ `assistant` และส่งคำแนะนำด้านรูปแบบที่ไม่บังคับเป็นข้อความ `user`

| คุณสมบัติ | ค่า                                      |
| --------- | ---------------------------------------- |
| รหัส TTS  | `xiaomi` (นามแฝง `mimo`)                 |
| การยืนยันตัวตน | `XIAOMI_API_KEY`                    |
| API       | `POST /v1/chat/completions` พร้อม `audio` |
| ค่าเริ่มต้น | `mimo-v2.5-tts`, เสียง `mimo_default`  |
| เอาต์พุต  | ค่าเริ่มต้นเป็น MP3; เป็น WAV เมื่อกำหนดค่าไว้ |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

เสียงที่มีมาให้: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean` โมเดลเสียงสำเร็จรูป (`mimo-v2.5-tts`, `mimo-v2-tts`) ใช้
`audio.voice` ดังนั้น OpenClaw จึงส่ง `speakerVoice` สำหรับโมเดลเหล่านี้

โมเดลออกแบบเสียง `mimo-v2.5-tts-voicedesign` สร้างเสียงจากพรอมต์รูปแบบ
ภาษาธรรมชาติแทนรหัสเสียงสำเร็จรูป ตั้งค่า `style` เป็นคำอธิบายเสียงที่ต้องการ
OpenClaw จะส่งค่านี้เป็นข้อความ `user` ส่งข้อความที่จะอ่านเป็นข้อความ `assistant`
และละเว้น `audio.voice` สำหรับโมเดลนี้

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

สำหรับช่องทางที่ขอเป้าหมายการสังเคราะห์เป็นข้อความเสียง (Discord, Feishu,
Matrix, Telegram และ WhatsApp) OpenClaw จะแปลงเอาต์พุตของ Xiaomi เป็น Opus
โมโน 48kHz ด้วย `ffmpeg` ก่อนส่ง

## ตัวอย่างการกำหนดค่า

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

ราคาและแฟล็กความเข้ากันได้มาจากไฟล์กำกับ Plugin ที่มาพร้อมกับระบบ ดังนั้นตัวอย่างการกำหนดค่าจึงละเว้น `cost` และ `compat` เพื่อหลีกเลี่ยงความแตกต่างจากพฤติกรรมขณะทำงาน

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

ราคามาจากไฟล์กำกับที่มาพร้อมกับระบบ (โมเดล Token Plan มีการคิดราคาแบบแบ่งระดับสำหรับการอ่านแคช) ดังนั้นตัวอย่างการกำหนดค่าจึงละเว้น `cost`

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    ผู้ให้บริการ `xiaomi` จะเปิดใช้งานโดยอัตโนมัติเมื่อตั้งค่า `XIAOMI_API_KEY` ในสภาพแวดล้อมหรือมีโปรไฟล์การยืนยันตัวตนอยู่แล้ว ส่วน `xiaomi-token-plan` ต้องมี URL ฐานของภูมิภาค ดังนั้นเส้นทางที่รองรับคือการเลือก Token Plan ในขั้นตอนเริ่มต้นใช้งานที่มาพร้อมกับระบบ หรือบล็อกการกำหนดค่า `models.providers.xiaomi-token-plan` ที่ระบุอย่างชัดเจน
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - มีขนาดเล็กและรวดเร็ว เหมาะสำหรับงานข้อความอเนกประสงค์ ไม่รองรับการให้เหตุผล
    - **mimo-v2-pro** - รองรับการให้เหตุผลพร้อมหน้าต่างบริบท 1 ล้านโทเค็นสำหรับภาระงานเอกสารขนาดยาว
    - **mimo-v2-omni** - โมเดลหลายรูปแบบข้อมูลที่รองรับการให้เหตุผล และรับอินพุตได้ทั้งข้อความและรูปภาพ
    - **mimo-v2.5-pro** - ค่าเริ่มต้นของ Token Plan พร้อมชุดความสามารถด้านการให้เหตุผล V2.5 ปัจจุบันของ Xiaomi
    - **mimo-v2.5** - เส้นทาง V2.5 แบบหลายรูปแบบข้อมูลของ Token Plan

    <Note>
    โมเดลแบบจ่ายตามการใช้งานใช้คำนำหน้า `xiaomi/` ส่วนโมเดล Token Plan ใช้คำนำหน้า `xiaomi-token-plan/`
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - หากโมเดลไม่ปรากฏ ให้ตรวจสอบว่ามีตัวแปรสภาพแวดล้อมของคีย์หรือโปรไฟล์การยืนยันตัวตนที่เกี่ยวข้อง และค่าดังกล่าวถูกต้อง
    - สำหรับ Token Plan ให้ตรวจสอบว่าภูมิภาคที่เลือกในขั้นตอนเริ่มต้นใช้งานตรงกับ URL ฐานในหน้าการสมัคร และคีย์ขึ้นต้นด้วย `tp-`
    - เมื่อ Gateway ทำงานเป็นดีมอน ให้ตรวจสอบว่ากระบวนการดังกล่าวเข้าถึงคีย์ได้ (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งค่าเฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏแก่กระบวนการ Gateway ที่จัดการโดยดีมอน ใช้ `~/.openclaw/.env` หรือการกำหนดค่า `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="Thinking levels" href="/th/tools/thinking" icon="brain">
    ไวยากรณ์คำสั่ง `/think` และการจับคู่ระดับ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับสมบูรณ์
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการคีย์ API
  </Card>
</CardGroup>
