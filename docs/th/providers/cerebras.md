---
read_when:
    - คุณต้องการใช้ Cerebras กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมคีย์ API ของ Cerebras หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Cerebras (การยืนยันตัวตน + การเลือกโมเดล)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T10:11:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) ให้บริการการอนุมานความเร็วสูงที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                         |
| -------- | ---------------------------- |
| ผู้ให้บริการ | `cerebras`                   |
| การยืนยันตัวตน | `CEREBRAS_API_KEY`           |
| API      | เข้ากันได้กับ OpenAI            |
| URL ฐาน | `https://api.cerebras.ai/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ใน [Cerebras Cloud Console](https://cloud.cerebras.ai)
  </Step>
  <Step title="เรียกใช้การเริ่มใช้งาน">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="ตรวจสอบว่ามีโมเดลให้ใช้งาน">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## แคตตาล็อกในตัว

OpenClaw มาพร้อมแคตตาล็อก Cerebras แบบคงที่สำหรับปลายทางสาธารณะที่เข้ากันได้กับ OpenAI:

| การอ้างอิงโมเดล                                 | ชื่อ                 | หมายเหตุ                                  |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | โมเดลเริ่มต้น; โมเดลเหตุผลรุ่นพรีวิว |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | โมเดลเหตุผลสำหรับการใช้งานจริง             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | โมเดลไม่มีเหตุผลรุ่นพรีวิว            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | โมเดลสำหรับการใช้งานจริงที่เน้นความเร็ว         |

<Warning>
Cerebras ระบุว่า `zai-glm-4.7` และ `qwen-3-235b-a22b-instruct-2507` เป็นโมเดลพรีวิว และมีเอกสารระบุว่า `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` จะเลิกใช้งานในวันที่ 27 พฤษภาคม 2026 ตรวจสอบหน้ารายการโมเดลที่รองรับของ Cerebras ก่อนพึ่งพาโมเดลเหล่านี้สำหรับการใช้งานจริง
</Warning>

## การกำหนดค่าด้วยตนเอง

Plugin ที่มาพร้อมแพ็กเกจมักหมายความว่าคุณต้องใช้เพียงคีย์ API เท่านั้น ใช้การกำหนดค่า
`models.providers.cerebras` แบบชัดเจนเมื่อคุณต้องการแทนที่เมทาดาทาของโมเดล:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบว่า `CEREBRAS_API_KEY`
พร้อมใช้งานสำหรับกระบวนการนั้น เช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`
</Note>
