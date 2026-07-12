---
read_when:
    - คุณต้องการใช้ Chutes กับ OpenClaw
    - คุณต้องใช้ขั้นตอนการตั้งค่า OAuth หรือคีย์ API
    - คุณต้องการโมเดลเริ่มต้น นามแฝง หรือลักษณะการทำงานของการค้นหา
summary: การตั้งค่า Chutes (OAuth หรือคีย์ API, การค้นหาโมเดล, นามแฝง)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T16:34:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) เปิดให้เข้าถึงแค็ตตาล็อกโมเดลโอเพนซอร์สผ่าน API
ที่เข้ากันได้กับ OpenAI โดย OpenClaw รองรับทั้ง OAuth ผ่านเบราว์เซอร์และการยืนยันตัวตนด้วยคีย์ API

| คุณสมบัติ         | ค่า                                                   |
| ---------------- | ------------------------------------------------------- |
| ผู้ให้บริการ         | `chutes`                                                |
| Plugin           | แพ็กเกจภายนอกอย่างเป็นทางการ (`@openclaw/chutes-provider`) |
| API              | เข้ากันได้กับ OpenAI                                       |
| URL ฐาน         | `https://llm.chutes.ai/v1`                              |
| การยืนยันตัวตน             | OAuth หรือคีย์ API (ดูด้านล่าง)                            |
| ตัวแปรสภาพแวดล้อมรันไทม์ | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` ใช้ระบุโทเค็นการเข้าถึง OAuth ที่ได้รับมาแล้วโดยตรง
(เช่น ใน CI) โดยข้ามขั้นตอนแบบโต้ตอบผ่านเบราว์เซอร์ด้านล่าง

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

ทั้งสองวิธีจะตั้งค่าโมเดลเริ่มต้นเป็น `chutes/zai-org/GLM-4.7-TEE` และลงทะเบียน
แค็ตตาล็อก Chutes

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="เรียกใช้ขั้นตอนเริ่มต้นใช้งาน OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw จะเปิดขั้นตอนผ่านเบราว์เซอร์ภายในเครื่อง หรือแสดง URL พร้อมขั้นตอน
        วางข้อมูลการเปลี่ยนเส้นทางบนโฮสต์ระยะไกล/ไม่มีส่วนแสดงผล โทเค็น OAuth จะรีเฟรชโดยอัตโนมัติ
        ผ่านโปรไฟล์การยืนยันตัวตนของ OpenClaw
      </Step>
    </Steps>
  </Tab>
  <Tab title="คีย์ API">
    <Steps>
      <Step title="รับคีย์ API">
        สร้างคีย์ได้ที่
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
      </Step>
      <Step title="เรียกใช้ขั้นตอนเริ่มต้นใช้งานคีย์ API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## พฤติกรรมการค้นหา

เมื่อมีข้อมูลยืนยันตัวตนของ Chutes แล้ว OpenClaw จะเรียก `GET /v1/models` ด้วย
ข้อมูลรับรองนั้น และใช้โมเดลที่ค้นพบ โดยแคชไว้ 5 นาทีต่อข้อมูลรับรองหนึ่งชุด
หากคีย์หมดอายุหรือไม่ได้รับอนุญาต (HTTP 401) OpenClaw จะลองอีกครั้งหนึ่ง
โดยไม่ใช้ข้อมูลรับรอง หากการค้นหายังคงไม่ส่งคืนแถวข้อมูล ล้มเหลว หรือส่งคืนสถานะอื่นใด
ที่ไม่ใช่ 2xx ระบบจะถอยกลับไปใช้แค็ตตาล็อกแบบคงที่ที่รวมมาให้ (การค้นหาด้วยคีย์ API
และ OAuth ใช้เส้นทางเดียวกันนี้) หากการค้นหาล้มเหลวระหว่างเริ่มต้น ระบบจะใช้
แค็ตตาล็อกแบบคงที่โดยอัตโนมัติ

## นามแฝงเริ่มต้น

OpenClaw ลงทะเบียนนามแฝงเพื่อความสะดวกสามรายการสำหรับแค็ตตาล็อก Chutes:

| นามแฝง           | โมเดลเป้าหมาย                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## แค็ตตาล็อกเริ่มต้นในตัว

แค็ตตาล็อกสำรองที่รวมมาให้มี 47 โมเดล ตัวอย่างตัวแทนของการอ้างอิงปัจจุบัน:

| การอ้างอิงโมเดล                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

เรียกใช้ `openclaw models list --all --provider chutes` เพื่อดูรายการทั้งหมด

## ตัวอย่างการกำหนดค่า

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การแทนที่ค่า OAuth">
    ปรับแต่งขั้นตอน OAuth ด้วยตัวแปรสภาพแวดล้อมที่เลือกใช้ได้:

    | ตัวแปร | วัตถุประสงค์ |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | รหัสไคลเอนต์ OAuth (ระบบจะถามหากไม่ได้ตั้งค่า) |
    | `CHUTES_CLIENT_SECRET` | ข้อมูลลับไคลเอนต์ OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI การเปลี่ยนเส้นทาง (ค่าเริ่มต้น `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | ขอบเขตที่คั่นด้วยช่องว่าง (ค่าเริ่มต้น `openid profile chutes:invoke`) |

    ดู[เอกสาร OAuth ของ Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    สำหรับข้อกำหนดของแอปการเปลี่ยนเส้นทางและความช่วยเหลือ

  </Accordion>

  <Accordion title="หมายเหตุ">
    - โมเดล Chutes ลงทะเบียนในรูปแบบ `chutes/<model-id>`
    - Chutes ไม่รายงานการใช้โทเค็นระหว่างการสตรีม (`supportsUsageInStreaming: false`) แต่ยอดการใช้งานรวมจะยังคงแสดงเมื่อสตรีมเสร็จสิ้น

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Chutes และเอกสาร API
  </Card>
  <Card title="คีย์ API ของ Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    สร้างและจัดการคีย์ API ของ Chutes
  </Card>
</CardGroup>
