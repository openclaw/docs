---
read_when:
    - คุณต้องการใช้ Chutes กับ OpenClaw
    - คุณต้องการเส้นทางการตั้งค่า OAuth หรือ API key
    - คุณต้องการทราบพฤติกรรมของ model เริ่มต้น, alias หรือการค้นหา model
summary: การตั้งค่า Chutes (OAuth หรือ API key, การค้นหา model, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-24T09:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai) เปิดให้ใช้งานแคตตาล็อก model แบบโอเพนซอร์สผ่าน API ที่เข้ากันได้กับ OpenAI โดย OpenClaw รองรับทั้ง browser OAuth และการยืนยันตัวตนด้วย API key โดยตรงสำหรับ provider `chutes` ที่มาพร้อมกัน

| คุณสมบัติ | ค่า                         |
| -------- | --------------------------- |
| Provider | `chutes`                    |
| API      | เข้ากันได้กับ OpenAI        |
| Base URL | `https://llm.chutes.ai/v1`  |
| Auth     | OAuth หรือ API key (ดูด้านล่าง) |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="รัน flow การ onboarding ด้วย OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw จะเปิด flow บนเบราว์เซอร์ในเครื่อง หรือแสดง URL + flow แบบวาง redirect
        บนโฮสต์ระยะไกล/ไม่มีหัวหน้าจอ โทเค็น OAuth จะรีเฟรชอัตโนมัติผ่าน auth
        profile ของ OpenClaw
      </Step>
      <Step title="ตรวจสอบ model เริ่มต้น">
        หลัง onboarding แล้ว model เริ่มต้นจะถูกตั้งเป็น
        `chutes/zai-org/GLM-4.7-TEE` และมีการลงทะเบียนแคตตาล็อก Chutes
        ที่มาพร้อมกันไว้แล้ว
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="รับ API key">
        สร้างคีย์ได้ที่
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="รัน flow การ onboarding ด้วย API key">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="ตรวจสอบ model เริ่มต้น">
        หลัง onboarding แล้ว model เริ่มต้นจะถูกตั้งเป็น
        `chutes/zai-org/GLM-4.7-TEE` และมีการลงทะเบียนแคตตาล็อก Chutes
        ที่มาพร้อมกันไว้แล้ว
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
ทั้งสองเส้นทางการยืนยันตัวตนจะลงทะเบียนแคตตาล็อก Chutes ที่มาพร้อมกัน และตั้ง model เริ่มต้นเป็น `chutes/zai-org/GLM-4.7-TEE` ตัวแปรสภาพแวดล้อมใน runtime คือ `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`
</Note>

## พฤติกรรมการค้นหา

เมื่อมีการยืนยันตัวตนของ Chutes ให้ใช้งาน OpenClaw จะ query แคตตาล็อก Chutes ด้วย credential นั้น และใช้ model ที่ค้นพบได้ หากการค้นหาล้มเหลว OpenClaw จะ fallback ไปใช้แคตตาล็อกแบบ static ที่มาพร้อมกัน เพื่อให้ onboarding และการเริ่มต้นระบบยังทำงานได้

## alias เริ่มต้น

OpenClaw ลงทะเบียน alias เพื่อความสะดวก 3 รายการสำหรับแคตตาล็อก Chutes ที่มาพร้อมกัน:

| Alias           | model เป้าหมาย                                       |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## แคตตาล็อกเริ่มต้นในตัว

แคตตาล็อก fallback ที่มาพร้อมกันมี ref ของ Chutes ปัจจุบันดังนี้:

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

## ตัวอย่าง config

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
  <Accordion title="การ override สำหรับ OAuth">
    คุณสามารถปรับแต่ง flow ของ OAuth ได้ด้วยตัวแปรสภาพแวดล้อมแบบไม่บังคับ:

    | ตัวแปร | วัตถุประสงค์ |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth client ID แบบกำหนดเอง |
    | `CHUTES_CLIENT_SECRET` | OAuth client secret แบบกำหนดเอง |
    | `CHUTES_OAUTH_REDIRECT_URI` | redirect URI แบบกำหนดเอง |
    | `CHUTES_OAUTH_SCOPES` | OAuth scopes แบบกำหนดเอง |

    ดู [เอกสาร OAuth ของ Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    สำหรับข้อกำหนดของแอป redirect และข้อมูลช่วยเหลือ

  </Accordion>

  <Accordion title="หมายเหตุ">
    - การค้นหาแบบ API key และ OAuth ต่างก็ใช้ provider id เดียวกันคือ `chutes`
    - model ของ Chutes จะถูกลงทะเบียนเป็น `chutes/<model-id>`
    - หากการค้นหาล้มเหลวระหว่างเริ่มต้นระบบ จะใช้แคตตาล็อก static ที่มาพร้อมกันโดยอัตโนมัติ

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    กฎของ provider, ref ของ model และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema config แบบเต็ม รวมถึงการตั้งค่าของ provider
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Chutes และเอกสาร API
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    สร้างและจัดการ API key ของ Chutes
  </Card>
</CardGroup>
