---
read_when:
    - คุณต้องการใช้โมเดล GLM ใน OpenClaw
    - คุณต้องใช้รูปแบบการตั้งชื่อโมเดลและการตั้งค่า
summary: ภาพรวมตระกูลโมเดล GLM และวิธีใช้งานใน OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM เป็นตระกูลโมเดล (ไม่ใช่บริษัท) ที่ใช้งานได้ผ่านแพลตฟอร์ม [Z.AI](https://z.ai) ใน OpenClaw โมเดล GLM เข้าถึงได้ผ่านผู้ให้บริการ `zai` ที่บันเดิลมาให้ โดยใช้การอ้างอิงอย่าง `zai/glm-5.1`

| คุณสมบัติ            | ค่า                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ         | `zai`                                                                       |
| Plugin              | บันเดิลมาให้, `enabledByDefault: true`                                           |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน       | `ZAI_API_KEY` หรือ `Z_AI_API_KEY`                                             |
| ตัวเลือกการเริ่มต้นใช้งาน  | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | เข้ากันได้กับ OpenAI                                                           |
| URL ฐานเริ่มต้น    | `https://api.z.ai/api/paas/v4`                                              |
| ค่าเริ่มต้นที่แนะนำ   | `zai/glm-5.1`                                                               |
| โมเดลภาพเริ่มต้น | `zai/glm-4.6v`                                                              |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เลือกเส้นทางการยืนยันตัวตนและเรียกใช้การเริ่มต้นใช้งาน">
    เลือกตัวเลือกการเริ่มต้นใช้งานที่ตรงกับแผนและภูมิภาค Z.AI ของคุณ ตัวเลือกทั่วไป `zai-api-key` จะตรวจจับปลายทางที่ตรงกันจากรูปแบบคีย์โดยอัตโนมัติ ใช้ตัวเลือกภูมิภาคแบบชัดเจนเมื่อคุณต้องการบังคับใช้ Coding Plan หรือพื้นผิว API ทั่วไปแบบเฉพาะเจาะจง

    | ตัวเลือกการยืนยันตัวตน         | เหมาะที่สุดสำหรับ                                            |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | คีย์ API ทั่วไปพร้อมการตรวจจับปลายทางอัตโนมัติ        |
    | `zai-coding-global` | ผู้ใช้ Coding Plan (ทั่วโลก)                          |
    | `zai-coding-cn`     | ผู้ใช้ Coding Plan (ภูมิภาคจีน)                    |
    | `zai-global`        | API ทั่วไป (ทั่วโลก)                                |
    | `zai-cn`            | API ทั่วไป (ภูมิภาคจีน)                          |

    <CodeGroup>

```bash Auto-detect
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash General API (global)
openclaw onboard --auth-choice zai-global
```

```bash General API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="ตั้งค่า GLM เป็นโมเดลเริ่มต้น">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="ตรวจสอบว่ามีโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` ช่วยให้ OpenClaw ตรวจจับปลายทาง Z.AI ที่ตรงกันจากรูปแบบคีย์และใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ ใช้ตัวเลือกภูมิภาคแบบชัดเจนเมื่อคุณต้องการตรึง Coding Plan หรือพื้นผิว API ทั่วไปแบบเฉพาะเจาะจง
</Tip>

## แค็ตตาล็อกในตัว

ผู้ให้บริการ `zai` ที่บันเดิลมาให้จะตั้งต้นการอ้างอิงโมเดล GLM จำนวน 13 รายการ ทุกรายการรองรับการให้เหตุผล เว้นแต่จะระบุไว้เป็นอย่างอื่น `glm-5v-turbo` และ `glm-4.6v` รับอินพุตภาพได้เช่นเดียวกับข้อความ

| การอ้างอิงโมเดล            | หมายเหตุ                                              |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | โมเดลเริ่มต้น การให้เหตุผล, เฉพาะข้อความ, บริบท 202k |
| `zai/glm-5`          | การให้เหตุผล, เฉพาะข้อความ, บริบท 202k                |
| `zai/glm-5-turbo`    | การให้เหตุผล, เฉพาะข้อความ, บริบท 202k                |
| `zai/glm-5v-turbo`   | การให้เหตุผล, ข้อความ + ภาพ, บริบท 202k             |
| `zai/glm-4.7`        | การให้เหตุผล, เฉพาะข้อความ, บริบท 204k                |
| `zai/glm-4.7-flash`  | การให้เหตุผล, เฉพาะข้อความ, บริบท 200k                |
| `zai/glm-4.7-flashx` | การให้เหตุผล, เฉพาะข้อความ                              |
| `zai/glm-4.6`        | การให้เหตุผล, เฉพาะข้อความ                              |
| `zai/glm-4.6v`       | การให้เหตุผล, ข้อความ + ภาพ โมเดลภาพเริ่มต้น      |
| `zai/glm-4.5`        | การให้เหตุผล, เฉพาะข้อความ                              |
| `zai/glm-4.5-air`    | การให้เหตุผล, เฉพาะข้อความ                              |
| `zai/glm-4.5-flash`  | การให้เหตุผล, เฉพาะข้อความ                              |
| `zai/glm-4.5v`       | การให้เหตุผล, ข้อความ + ภาพ                           |

<Note>
  เวอร์ชันและความพร้อมใช้งานของ GLM อาจเปลี่ยนแปลงได้ เรียกใช้ `openclaw models list --provider zai` เพื่อดูแถวแค็ตตาล็อกที่เวอร์ชันที่คุณติดตั้งรู้จัก และตรวจสอบเอกสารของ Z.AI สำหรับโมเดลที่เพิ่มใหม่หรือเลิกใช้งานแล้ว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การตรวจจับปลายทางอัตโนมัติ">
    เมื่อคุณใช้ตัวเลือกการยืนยันตัวตน `zai-api-key` OpenClaw จะตรวจสอบรูปแบบคีย์เพื่อกำหนด URL ฐานของ Z.AI ที่ถูกต้อง ตัวเลือกภูมิภาคแบบชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) จะแทนที่การตรวจจับอัตโนมัติและตรึงปลายทางโดยตรง
  </Accordion>

  <Accordion title="รายละเอียดผู้ให้บริการ">
    โมเดล GLM ให้บริการโดยผู้ให้บริการรันไทม์ `zai` สำหรับการกำหนดค่าผู้ให้บริการแบบครบถ้วน ปลายทางภูมิภาค และความสามารถเพิ่มเติม โปรดดู [หน้าผู้ให้บริการ Z.AI](/th/providers/zai)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการ Z.AI" href="/th/providers/zai" icon="server">
    การกำหนดค่าผู้ให้บริการ Z.AI แบบครบถ้วนและปลายทางภูมิภาค
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับ `/think` สำหรับตระกูล GLM ที่มีความสามารถด้านการให้เหตุผล
  </Card>
  <Card title="คำถามที่พบบ่อยเกี่ยวกับโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์การยืนยันตัวตน การสลับโมเดล และการแก้ไขข้อผิดพลาด "no profile"
  </Card>
</CardGroup>
