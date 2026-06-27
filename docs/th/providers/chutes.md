---
read_when:
    - คุณต้องการใช้ Chutes กับ OpenClaw
    - คุณต้องใช้เส้นทางการตั้งค่า OAuth หรือ API key
    - คุณต้องการโมเดลเริ่มต้น นามแฝง หรือพฤติกรรมการค้นพบ
summary: การตั้งค่า Chutes (OAuth หรือคีย์ API, การค้นหาโมเดล, นามแฝง)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:11:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) เปิดเผยแค็ตตาล็อกโมเดลโอเพนซอร์สผ่าน API
ที่เข้ากันได้กับ OpenAI OpenClaw รองรับทั้ง OAuth ผ่านเบราว์เซอร์และการยืนยันตัวตน
ด้วยคีย์ API โดยตรงสำหรับ provider `chutes`

| คุณสมบัติ | ค่า                          |
| -------- | ---------------------------- |
| Provider | `chutes`                     |
| API      | เข้ากันได้กับ OpenAI        |
| Base URL | `https://llm.chutes.ai/v1`   |
| Auth     | OAuth หรือคีย์ API (ดูด้านล่าง) |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="เรียกใช้โฟลว์เริ่มต้นใช้งาน OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw จะเปิดโฟลว์เบราว์เซอร์ในเครื่อง หรือแสดง URL + โฟลว์วางค่า redirect
        บนโฮสต์ระยะไกล/ไม่มีหน้าจอ โทเค็น OAuth จะรีเฟรชอัตโนมัติผ่านโปรไฟล์การยืนยันตัวตนของ OpenClaw
      </Step>
      <Step title="ตรวจสอบโมเดลเริ่มต้น">
        หลังจากเริ่มต้นใช้งานแล้ว โมเดลเริ่มต้นจะถูกตั้งเป็น
        `chutes/zai-org/GLM-4.7-TEE` และแค็ตตาล็อกแบบคงที่ของ Chutes จะถูก
        ลงทะเบียน
      </Step>
    </Steps>
  </Tab>
  <Tab title="คีย์ API">
    <Steps>
      <Step title="รับคีย์ API">
        สร้างคีย์ที่
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
      </Step>
      <Step title="เรียกใช้โฟลว์เริ่มต้นใช้งานคีย์ API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="ตรวจสอบโมเดลเริ่มต้น">
        หลังจากเริ่มต้นใช้งานแล้ว โมเดลเริ่มต้นจะถูกตั้งเป็น
        `chutes/zai-org/GLM-4.7-TEE` และแค็ตตาล็อกแบบคงที่ของ Chutes จะถูก
        ลงทะเบียน
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
เส้นทางการยืนยันตัวตนทั้งสองแบบจะลงทะเบียนแค็ตตาล็อกแบบคงที่ของ Chutes และตั้งโมเดลเริ่มต้นเป็น
`chutes/zai-org/GLM-4.7-TEE` ตัวแปรสภาพแวดล้อมรันไทม์: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`
</Note>

## พฤติกรรมการค้นหา

เมื่อมีการยืนยันตัวตนของ Chutes พร้อมใช้งาน OpenClaw จะค้นหาแค็ตตาล็อก Chutes ด้วย
ข้อมูลรับรองนั้นและใช้โมเดลที่ค้นพบ หากการค้นหาล้มเหลว OpenClaw จะถอยกลับไปใช้
แค็ตตาล็อกแบบคงที่ เพื่อให้การเริ่มต้นใช้งานและการเริ่มระบบยังคงทำงานได้

## นามแฝงเริ่มต้น

OpenClaw ลงทะเบียนนามแฝงเพื่อความสะดวกสามรายการสำหรับแค็ตตาล็อกแบบคงที่ของ Chutes:

| นามแฝง         | โมเดลเป้าหมาย                                      |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## แค็ตตาล็อกเริ่มต้นในตัว

แค็ตตาล็อกถอยกลับแบบคงที่มี refs ปัจจุบันของ Chutes:

| Model ref                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

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
  <Accordion title="การเขียนทับ OAuth">
    คุณสามารถปรับแต่งโฟลว์ OAuth ด้วยตัวแปรสภาพแวดล้อมเพิ่มเติมได้:

    | ตัวแปร | วัตถุประสงค์ |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | รหัสไคลเอนต์ OAuth แบบกำหนดเอง |
    | `CHUTES_CLIENT_SECRET` | ความลับไคลเอนต์ OAuth แบบกำหนดเอง |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI การเปลี่ยนเส้นทางแบบกำหนดเอง |
    | `CHUTES_OAUTH_SCOPES` | ขอบเขต OAuth แบบกำหนดเอง |

    ดู [เอกสาร OAuth ของ Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    สำหรับข้อกำหนดของแอป redirect และความช่วยเหลือ

  </Accordion>

  <Accordion title="หมายเหตุ">
    - การค้นหาด้วยคีย์ API และ OAuth ใช้รหัส provider `chutes` เดียวกัน
    - โมเดล Chutes จะถูกลงทะเบียนเป็น `chutes/<model-id>`
    - หากการค้นหาล้มเหลวตอนเริ่มระบบ ระบบจะใช้แค็ตตาล็อกแบบคงที่โดยอัตโนมัติ

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎ provider, refs ของโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าเต็มรูปแบบ รวมถึงการตั้งค่า provider
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Chutes และเอกสาร API
  </Card>
  <Card title="คีย์ API ของ Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    สร้างและจัดการคีย์ API ของ Chutes
  </Card>
</CardGroup>
