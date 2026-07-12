---
read_when:
    - คุณต้องการใช้ Cerebras กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API ของ Cerebras หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Cerebras (การยืนยันตัวตน + การเลือกโมเดล)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T16:36:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) ให้บริการการอนุมานความเร็วสูงที่เข้ากันได้กับ OpenAI บนฮาร์ดแวร์การอนุมานแบบกำหนดเอง Plugin มาพร้อมแค็ตตาล็อกแบบคงที่ที่มีสี่โมเดล (ไม่มีการค้นหาแบบสด)

| คุณสมบัติ                  | ค่า                                                        |
| ------------------------- | --------------------------------------------------------- |
| รหัสผู้ให้บริการ           | `cerebras`                                                |
| Plugin                    | แพ็กเกจภายนอกอย่างเป็นทางการ (`@openclaw/cerebras-provider`) |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `CEREBRAS_API_KEY`                                        |
| แฟล็กการเริ่มต้นใช้งาน      | `--auth-choice cerebras-api-key`                          |
| แฟล็ก CLI โดยตรง           | `--cerebras-api-key <key>`                                |
| API                       | เข้ากันได้กับ OpenAI (`openai-completions`)                |
| URL ฐาน                   | `https://api.cerebras.ai/v1`                              |
| โมเดลเริ่มต้น              | `cerebras/zai-glm-4.7`                                    |

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ใน [Cerebras Cloud Console](https://cloud.cerebras.ai)
  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider cerebras
    ```

    แสดงรายการโมเดลแบบคงที่ทั้งสี่รายการ หากไม่สามารถหา `CEREBRAS_API_KEY` ได้ `openclaw models status --json` จะรายงานข้อมูลรับรองที่ขาดหายไปภายใต้ `auth.unusableProfiles`

  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## แค็ตตาล็อกในตัว

โมเดลทั้งสี่ใช้หน้าต่างบริบทร่วมกันขนาด 128k และรองรับโทเค็นเอาต์พุตสูงสุด 8,192 โทเค็น

| การอ้างอิงโมเดล                            | ชื่อ                  | การให้เหตุผล | หมายเหตุ                                      |
| ----------------------------------------- | -------------------- | ----------- | -------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ใช่          | โมเดลเริ่มต้น; โมเดลให้เหตุผลรุ่นตัวอย่าง       |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ใช่          | โมเดลให้เหตุผลสำหรับการใช้งานจริง               |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ไม่          | โมเดลไม่ให้เหตุผลรุ่นตัวอย่าง                   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | ไม่          | โมเดลที่เน้นความเร็วสำหรับการใช้งานจริง           |

<Warning>
Cerebras ระบุว่า `zai-glm-4.7` และ `qwen-3-235b-a22b-instruct-2507` เป็นโมเดลรุ่นตัวอย่าง และมีเอกสารระบุว่าจะเลิกสนับสนุน `llama3.1-8b` รวมถึง `qwen-3-235b-a22b-instruct-2507` ในวันที่ 27 พฤษภาคม 2026 โปรดตรวจสอบ[หน้ารายการโมเดลที่รองรับ](https://inference-docs.cerebras.ai/models/overview)ของ Cerebras ก่อนนำโมเดลเหล่านี้ไปใช้กับภาระงานจริง
</Warning>

## การกำหนดค่าด้วยตนเอง

การตั้งค่าส่วนใหญ่ต้องการเพียงคีย์ API ใช้การกำหนดค่า `models.providers.cerebras` อย่างชัดเจนเพื่อแทนที่ข้อมูลเมตาของโมเดล หรือทำงานใน `mode: "merge"` ร่วมกับแค็ตตาล็อกแบบคงที่:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
หาก Gateway ทำงานเป็นดีมอน (launchd, systemd, Docker) โปรดตรวจสอบว่าโปรเซสนั้นเข้าถึง `CEREBRAS_API_KEY` ได้ เช่น กำหนดไว้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วยให้บริการที่มีการจัดการใช้งานได้ เว้นแต่จะนำเข้าสภาพแวดล้อมแยกต่างหาก
</Note>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามในการให้เหตุผลสำหรับโมเดล Cerebras สองโมเดลที่รองรับการให้เหตุผล
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
  <Card title="คำถามที่พบบ่อยเกี่ยวกับโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์การยืนยันตัวตน การสลับโมเดล และการแก้ไขข้อผิดพลาด "ไม่พบโปรไฟล์"
  </Card>
</CardGroup>
