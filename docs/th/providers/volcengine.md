---
read_when:
    - คุณต้องการใช้โมเดล Volcano Engine หรือ Doubao กับ OpenClaw
    - คุณต้องตั้งค่าคีย์ API ของ Volcengine
    - คุณต้องการใช้การแปลงข้อความเป็นเสียงพูดของ Volcengine Speech
summary: การตั้งค่า Volcano Engine (โมเดล Doubao, เอนด์พอยต์สำหรับการเขียนโค้ด และ TTS ของ Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-19T07:59:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ac0e86b5b94b0c0f08e76878d16e9c5562e0d3f9923697713bef20ebba5bab2
    source_path: providers/volcengine.md
    workflow: 16
---

ผู้ให้บริการ Volcengine ช่วยให้เข้าถึงโมเดล Doubao และโมเดลของบุคคลที่สามที่โฮสต์บน Volcano Engine โดยมีปลายทางแยกกันสำหรับเวิร์กโหลดทั่วไปและงานเขียนโค้ด Plugin ที่รวมมาให้เดียวกันนี้ยังลงทะเบียน Volcengine Speech เป็นผู้ให้บริการ TTS ด้วย

| รายละเอียด     | ค่า                                                      |
| ---------- | ---------------------------------------------------------- |
| ผู้ให้บริการ  | `volcengine` (ทั่วไป + TTS), `volcengine-plan` (การเขียนโค้ด)   |
| การยืนยันตัวตนของโมเดล | `VOLCANO_ENGINE_API_KEY`                                   |
| การยืนยันตัวตน TTS   | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | โมเดลที่เข้ากันได้กับ OpenAI, BytePlus Seed Speech TTS         |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    เรียกใช้การเริ่มต้นใช้งานแบบโต้ตอบ:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    การดำเนินการนี้จะลงทะเบียนทั้งผู้ให้บริการทั่วไป (`volcengine`) และผู้ให้บริการสำหรับการเขียนโค้ด (`volcengine-plan`) จากคีย์ API เดียว

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
สำหรับการตั้งค่าแบบไม่โต้ตอบ (CI, การเขียนสคริปต์) ให้ส่งคีย์โดยตรง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## ผู้ให้บริการและปลายทาง

| ผู้ให้บริการ          | ปลายทาง                                  | กรณีใช้งาน       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | โมเดลทั่วไป |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | โมเดลสำหรับการเขียนโค้ด  |

<Note>
ผู้ให้บริการทั้งสองได้รับการกำหนดค่าจากคีย์ API เดียว ขั้นตอนการตั้งค่าจะลงทะเบียนทั้งสองโดยอัตโนมัติ และตัวเลือกโมเดลของผู้ให้บริการสำหรับการเขียนโค้ดยังใช้การยืนยันตัวตนของผู้ให้บริการทั่วไปซ้ำด้วย (`volcengine-plan` เป็นนามแฝงการยืนยันตัวตนของ `volcengine`)
</Note>

## แค็ตตาล็อกในตัว

<Tabs>
  <Tab title="ทั่วไป (volcengine)">
    | การอ้างอิงโมเดล                                    | ชื่อ                            | อินพุต       | บริบท |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | ข้อความ, รูปภาพ | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | ข้อความ, รูปภาพ | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | ข้อความ, รูปภาพ | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | ข้อความ, รูปภาพ | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | ข้อความ, รูปภาพ | 256,000 |
  </Tab>
  <Tab title="การเขียนโค้ด (volcengine-plan)">
    | การอ้างอิงโมเดล                                         | ชื่อ                     | อินพุต | บริบท |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | ข้อความ  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | ข้อความ  | 256,000 |
  </Tab>
</Tabs>

แค็ตตาล็อกทั้งสองเป็นแบบคงที่ (ไม่มีการเรียกค้นหา `/models`) และรองรับการบัญชีการใช้งานแบบสตรีมที่เข้ากันได้กับ OpenAI สคีมาเครื่องมือสำหรับผู้ให้บริการทั้งสองจะตัดคีย์เวิร์ด `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` และ `maxContains` ออกโดยอัตโนมัติ เนื่องจาก API การเรียกใช้เครื่องมือของ Volcengine ปฏิเสธคีย์เวิร์ดเหล่านี้

## การแปลงข้อความเป็นเสียงพูด

Volcengine TTS ใช้ BytePlus Seed Speech HTTP API (`voice.ap-southeast-1.bytepluses.com`) และกำหนดค่าแยกจากคีย์ API ของโมเดล Doubao ที่เข้ากันได้กับ OpenAI ในคอนโซล BytePlus ให้เปิด Seed Speech > Settings > API Keys คัดลอกคีย์ API แล้วตั้งค่า:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

จากนั้นเปิดใช้งานใน `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

ฟิลด์ที่ใช้ได้ภายใต้ `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` และ `baseUrl` นอกจากนี้ `!emotion=<value>` ยังใช้เป็นไดเรกทีฟเสียงแบบอินไลน์ได้ เมื่ออนุญาตให้แทนที่การตั้งค่าเสียง

สำหรับเป้าหมายที่เป็นข้อความเสียง OpenClaw จะร้องขอ `ogg_opus` แบบเนทีฟของผู้ให้บริการ ส่วนไฟล์แนบเสียงทั่วไปจะร้องขอ `mp3` นามแฝงผู้ให้บริการ `bytedance` และ `doubao` จะถูกแก้ไปยังผู้ให้บริการเสียงพูดนี้เช่นกัน

รหัสทรัพยากรเริ่มต้นคือ `seed-tts-1.0` ซึ่งเป็นสิทธิ์ที่ BytePlus มอบให้คีย์ API ของ Seed Speech ที่สร้างใหม่โดยค่าเริ่มต้น หากโปรเจกต์มีสิทธิ์ TTS 2.0 ให้ตั้งค่า `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`

<Warning>
`VOLCANO_ENGINE_API_KEY` ใช้สำหรับปลายทางโมเดล ModelArk/Doubao และไม่ใช่คีย์ API ของ Seed Speech การใช้งาน TTS ต้องใช้คีย์ API ของ Seed Speech จาก BytePlus Speech Console หรือคู่ AppID/โทเค็นของ Speech Console รุ่นเก่า
</Warning>

ยังคงรองรับการยืนยันตัวตนด้วย AppID/โทเค็นแบบเดิมสำหรับแอปพลิเคชัน Speech Console รุ่นเก่า:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

ตัวแปรสภาพแวดล้อม TTS อื่นที่เป็นทางเลือก ได้แก่ `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` และ `VOLCENGINE_TTS_BASE_URL` ซึ่งจะแทนที่ฟิลด์การกำหนดค่า `messages.tts.providers.volcengine` ที่สอดคล้องกันเมื่อมีการตั้งค่า

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โมเดลเริ่มต้นหลังการเริ่มต้นใช้งาน">
    `openclaw onboard --auth-choice volcengine-api-key` ตั้งค่า `volcengine-plan/ark-code-latest` เป็นโมเดลเริ่มต้น พร้อมกับลงทะเบียนแค็ตตาล็อกทั่วไป `volcengine`
  </Accordion>

  <Accordion title="พฤติกรรมสำรองของตัวเลือกโมเดล">
    ระหว่างการเลือกโมเดลในการเริ่มต้นใช้งาน/กำหนดค่า ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่มีการกรอง แทนที่จะแสดงตัวเลือกที่จำกัดขอบเขตตามผู้ให้บริการโดยว่างเปล่า
  </Accordion>

  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับกระบวนการดีมอน">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่าตัวแปรสภาพแวดล้อมของโมเดลและ TTS เช่น `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` และ `VOLCENGINE_TTS_TOKEN` พร้อมใช้งานสำหรับกระบวนการนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

<Warning>
เมื่อเรียกใช้ OpenClaw เป็นบริการเบื้องหลัง ตัวแปรสภาพแวดล้อมที่ตั้งค่าในเชลล์แบบโต้ตอบจะไม่ถูกสืบทอดโดยอัตโนมัติ โปรดดูหมายเหตุเกี่ยวกับดีมอนด้านบน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="คำถามที่พบบ่อย" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
