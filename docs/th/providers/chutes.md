---
read_when:
    - คุณต้องการใช้ Chutes กับ OpenClaw
    - คุณต้องใช้ขั้นตอนการตั้งค่า OAuth หรือคีย์ API
    - คุณต้องการโมเดลเริ่มต้น นามแฝง หรือพฤติกรรมการค้นหาโมเดล
summary: การตั้งค่า Chutes (OAuth หรือคีย์ API, การค้นหาโมเดล, นามแฝง)
title: Chutes
x-i18n:
    generated_at: "2026-07-19T07:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 57ea5112105f19028c1a348b4d7fec4cf7ef12de00b1b2de9c152057bf5033a9
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) เปิดให้ใช้แค็ตตาล็อกโมเดลโอเพนซอร์สผ่าน API ที่เข้ากันได้กับ OpenAI โดย OpenClaw รองรับทั้ง OAuth ผ่านเบราว์เซอร์และการตรวจสอบสิทธิ์ด้วยคีย์ API

| คุณสมบัติ         | ค่า                                                   |
| ---------------- | ------------------------------------------------------- |
| ผู้ให้บริการ         | `chutes`                                                |
| Plugin           | แพ็กเกจภายนอกอย่างเป็นทางการ (`@openclaw/chutes-provider`) |
| API              | เข้ากันได้กับ OpenAI                                       |
| URL ฐาน         | `https://llm.chutes.ai/v1`                              |
| การตรวจสอบสิทธิ์             | OAuth หรือคีย์ API (ดูด้านล่าง)                            |
| ตัวแปรสภาพแวดล้อมรันไทม์ | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` ใช้สำหรับระบุโทเค็นการเข้าถึง OAuth ที่ได้รับมาแล้วโดยตรง
(เช่น ใน CI) โดยข้ามขั้นตอนแบบโต้ตอบผ่านเบราว์เซอร์ด้านล่าง

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

ทั้งสองวิธีจะตั้งโมเดลเริ่มต้นเป็น `chutes/zai-org/GLM-5-TEE` และลงทะเบียน
แค็ตตาล็อก Chutes

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="เรียกใช้ขั้นตอนการเริ่มต้นใช้งาน OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw จะเปิดขั้นตอนผ่านเบราว์เซอร์ในเครื่อง หรือแสดง URL พร้อมขั้นตอน
        วางการเปลี่ยนเส้นทางกลับบนโฮสต์ระยะไกล/แบบไม่มีหน้าจอ โทเค็น OAuth จะรีเฟรชอัตโนมัติผ่านโปรไฟล์
        การตรวจสอบสิทธิ์ของ OpenClaw
      </Step>
    </Steps>
  </Tab>
  <Tab title="คีย์ API">
    <Steps>
      <Step title="รับคีย์ API">
        สร้างคีย์ได้ที่
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
      </Step>
      <Step title="เรียกใช้ขั้นตอนการเริ่มต้นใช้งานคีย์ API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## ลักษณะการค้นพบ

เมื่อมีข้อมูลการตรวจสอบสิทธิ์ Chutes แล้ว OpenClaw จะส่งคำขอไปยัง `GET /v1/models` ด้วย
ข้อมูลรับรองนั้นและใช้โมเดลที่ค้นพบ โดยแคชไว้ 5 นาทีต่อ
ข้อมูลรับรอง เมื่อคีย์หมดอายุ/ไม่ได้รับอนุญาต (HTTP 401) OpenClaw จะลองอีกครั้งหนึ่ง
โดยไม่มีข้อมูลรับรอง หากการค้นพบยังคงไม่ส่งคืนแถวใด ล้มเหลว หรือส่งคืน
สถานะอื่นที่ไม่ใช่ 2xx ระบบจะกลับไปใช้แค็ตตาล็อกแบบคงที่ที่รวมมาให้ (การค้นพบ
ทั้งด้วยคีย์ API และ OAuth ใช้เส้นทางเดียวกันนี้) หากการค้นพบล้มเหลวเมื่อเริ่มทำงาน
ระบบจะใช้แค็ตตาล็อกแบบคงที่โดยอัตโนมัติ

## นามแฝงเริ่มต้น

OpenClaw ลงทะเบียนนามแฝงเพื่อความสะดวกสองรายการสำหรับแค็ตตาล็อก Chutes:

| นามแฝง           | โมเดลเป้าหมาย                           |
| --------------- | -------------------------------------- |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/moonshotai/Kimi-K2.5-TEE`      |

## แค็ตตาล็อกเริ่มต้นในตัว

แค็ตตาล็อกสำรองที่รวมมาให้ประกอบด้วยโมเดลห้ารายการต่อไปนี้ซึ่งให้บริการอยู่ในปัจจุบัน:

| การอ้างอิงโมเดล                              |
| -------------------------------------- |
| `chutes/zai-org/GLM-5-TEE`             |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE`      |
| `chutes/MiniMaxAI/MiniMax-M2.5-TEE`    |
| `chutes/Qwen/Qwen3.5-397B-A17B-TEE`    |

เรียกใช้ `openclaw models list --all --provider chutes` เพื่อดูรายการทั้งหมด

## ตัวอย่างการกำหนดค่า

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-5-TEE" },
      models: {
        "chutes/zai-org/GLM-5-TEE": { alias: "Chutes GLM 5" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การแทนที่ค่า OAuth">
    ปรับแต่งขั้นตอน OAuth ด้วยตัวแปรสภาพแวดล้อมที่ไม่บังคับ:

    | ตัวแปร | วัตถุประสงค์ |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | รหัสไคลเอนต์ OAuth (จะแจ้งให้ป้อนหากไม่ได้ตั้งค่า) |
    | `CHUTES_CLIENT_SECRET` | ข้อมูลลับไคลเอนต์ OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI การเปลี่ยนเส้นทาง (ค่าเริ่มต้น `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | ขอบเขตที่คั่นด้วยช่องว่าง (ค่าเริ่มต้น `openid profile chutes:invoke`) |

    ดู[เอกสาร OAuth ของ Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    สำหรับข้อกำหนดของแอปการเปลี่ยนเส้นทางและความช่วยเหลือ

  </Accordion>

  <Accordion title="หมายเหตุ">
    - โมเดล Chutes จะลงทะเบียนเป็น `chutes/<model-id>`
    - Chutes ไม่รายงานการใช้โทเค็นระหว่างการสตรีม (`supportsUsageInStreaming: false`) แต่ยอดรวมการใช้งานจะยังคงแสดงเมื่อสตรีมเสร็จสมบูรณ์

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    แดชบอร์ดและเอกสาร API ของ Chutes
  </Card>
  <Card title="คีย์ API ของ Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    สร้างและจัดการคีย์ API ของ Chutes
  </Card>
</CardGroup>
