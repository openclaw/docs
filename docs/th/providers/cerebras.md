---
read_when:
    - คุณต้องการใช้ Cerebras กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมคีย์ API ของ Cerebras หรือตัวเลือกการตรวจสอบสิทธิ์ผ่าน CLI
summary: การตั้งค่า Cerebras (การยืนยันตัวตน + การเลือกรุ่น)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) ให้บริการการอนุมานความเร็วสูงที่เข้ากันได้กับ OpenAI บนฮาร์ดแวร์การอนุมานแบบกำหนดเอง Plugin ผู้ให้บริการ Cerebras มีแค็ตตาล็อกแบบคงที่จำนวนสี่โมเดล

| คุณสมบัติ        | ค่า                                    |
| --------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ     | `cerebras`                               |
| Plugin          | แพ็กเกจภายนอกอย่างเป็นทางการ                |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `CEREBRAS_API_KEY`                       |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice cerebras-api-key`         |
| แฟล็ก CLI โดยตรง | `--cerebras-api-key <key>`               |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน        | `https://api.cerebras.ai/v1`             |
| โมเดลเริ่มต้น   | `cerebras/zai-glm-4.7`                   |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

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

```bash การเริ่มต้นใช้งาน
openclaw onboard --auth-choice cerebras-api-key
```

```bash แฟล็กโดยตรง
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash ใช้เฉพาะสภาพแวดล้อม
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider cerebras
    ```

    รายการควรมีโมเดลแบบคงที่ครบทั้งสี่รายการ หาก `CEREBRAS_API_KEY` ไม่สามารถแก้ไขค่าได้ `openclaw models status --json` จะรายงานข้อมูลรับรองที่ขาดหายภายใต้ `auth.unusableProfiles`

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

OpenClaw มาพร้อมแค็ตตาล็อก Cerebras แบบคงที่ซึ่งสะท้อนปลายทางสาธารณะที่เข้ากันได้กับ OpenAI โมเดลทั้งสี่ใช้บริบท 128k และโทเค็นเอาต์พุตสูงสุด 8,192 เท่ากัน

| อ้างอิงโมเดล                                 | ชื่อ                 | การใช้เหตุผล | หมายเหตุ                                  |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ใช่       | โมเดลเริ่มต้น; โมเดลใช้เหตุผลแบบพรีวิว |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ใช่       | โมเดลใช้เหตุผลสำหรับงานจริง             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ไม่        | โมเดลไม่ใช้เหตุผลแบบพรีวิว            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | ไม่        | โมเดลสำหรับงานจริงที่เน้นความเร็ว         |

<Warning>
  Cerebras ระบุว่า `zai-glm-4.7` และ `qwen-3-235b-a22b-instruct-2507` เป็นโมเดลพรีวิว และเอกสารระบุว่า `llama3.1-8b` รวมถึง `qwen-3-235b-a22b-instruct-2507` จะเลิกใช้งานในวันที่ 27 พฤษภาคม 2026 ตรวจสอบหน้าโมเดลที่รองรับของ Cerebras ก่อนพึ่งพาโมเดลเหล่านี้สำหรับภาระงานจริง
</Warning>

## การกำหนดค่าด้วยตนเอง

โดยปกติ Plugin นี้หมายความว่าคุณต้องใช้เพียงคีย์ API เท่านั้น ใช้การกำหนดค่า `models.providers.cerebras` อย่างชัดเจนเมื่อคุณต้องการแทนที่เมทาดาทาของโมเดลหรือเรียกใช้ใน `mode: "merge"` กับแค็ตตาล็อกแบบคงที่:

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
  หาก Gateway ทำงานเป็นดีมอน (launchd, systemd, Docker) ตรวจสอบให้แน่ใจว่า `CEREBRAS_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` คีย์ที่ export ไว้เฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วยบริการที่ถูกจัดการ เว้นแต่จะนำเข้าสภาพแวดล้อมแยกต่างหาก
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามในการใช้เหตุผลสำหรับโมเดล Cerebras สองโมเดลที่รองรับการใช้เหตุผล
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ Agent และการกำหนดค่าโมเดล
  </Card>
  <Card title="คำถามที่พบบ่อยเกี่ยวกับโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์การยืนยันตัวตน การสลับโมเดล และการแก้ข้อผิดพลาด "no profile"
  </Card>
</CardGroup>
