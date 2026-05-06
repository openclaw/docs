---
read_when:
    - คุณต้องการใช้ Cerebras กับ OpenClaw
    - คุณต้องระบุตัวแปรสภาพแวดล้อมของคีย์ API สำหรับ Cerebras หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Cerebras (การยืนยันตัวตน + การเลือกโมเดล)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) ให้บริการ inference ความเร็วสูงที่เข้ากันได้กับ OpenAI บนฮาร์ดแวร์ inference แบบกำหนดเอง OpenClaw มี Plugin ผู้ให้บริการ Cerebras ที่บันเดิลมาให้ พร้อมแค็ตตาล็อกแบบคงที่จำนวนสี่โมเดล

| คุณสมบัติ        | ค่า                                    |
| --------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ     | `cerebras`                               |
| Plugin          | บันเดิลมาให้, `enabledByDefault: true`        |
| ตัวแปร env สำหรับการยืนยันตัวตน    | `CEREBRAS_API_KEY`                       |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice cerebras-api-key`         |
| แฟล็ก CLI โดยตรง | `--cerebras-api-key <key>`               |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`) |
| Base URL        | `https://api.cerebras.ai/v1`             |
| โมเดลเริ่มต้น   | `cerebras/zai-glm-4.7`                   |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ใน [Cerebras Cloud Console](https://cloud.cerebras.ai)
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

    รายการควรมีโมเดลที่บันเดิลมาให้ครบทั้งสี่โมเดล หาก `CEREBRAS_API_KEY` ไม่สามารถ resolve ได้ `openclaw models status --json` จะรายงานข้อมูลรับรองที่ขาดหายภายใต้ `auth.unusableProfiles`

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

OpenClaw มาพร้อมแค็ตตาล็อก Cerebras แบบคงที่ซึ่งสะท้อน endpoint สาธารณะที่เข้ากันได้กับ OpenAI โมเดลทั้งสี่ใช้ context 128k และ token เอาต์พุตสูงสุด 8,192 ร่วมกัน

| การอ้างอิงโมเดล                                 | ชื่อ                 | การให้เหตุผล | หมายเหตุ                                  |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | ใช่       | โมเดลเริ่มต้น; โมเดลให้เหตุผลแบบพรีวิว |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | ใช่       | โมเดลให้เหตุผลสำหรับโปรดักชัน             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | ไม่ใช่        | โมเดลที่ไม่ให้เหตุผลแบบพรีวิว            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | ไม่ใช่        | โมเดลสำหรับโปรดักชันที่เน้นความเร็ว         |

<Warning>
  Cerebras ทำเครื่องหมาย `zai-glm-4.7` และ `qwen-3-235b-a22b-instruct-2507` เป็นโมเดลพรีวิว และมีเอกสารระบุว่า `llama3.1-8b` รวมถึง `qwen-3-235b-a22b-instruct-2507` จะถูกยกเลิกการใช้งานในวันที่ 27 พฤษภาคม 2026 ตรวจสอบหน้ารายการโมเดลที่รองรับของ Cerebras ก่อนพึ่งพาโมเดลเหล่านี้สำหรับเวิร์กโหลดโปรดักชัน
</Warning>

## การกำหนดค่าด้วยตนเอง

โดยทั่วไป Plugin ที่บันเดิลมาให้หมายความว่าคุณต้องใช้เพียง API key เท่านั้น ใช้การกำหนดค่า `models.providers.cerebras` อย่างชัดเจนเมื่อคุณต้องการแทนที่เมตาดาต้าของโมเดล หรือเรียกใช้ใน `mode: "merge"` กับแค็ตตาล็อกแบบคงที่:

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
  หาก Gateway ทำงานเป็น daemon (launchd, systemd, Docker) ให้ตรวจสอบว่า `CEREBRAS_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` key ที่อยู่เฉพาะใน `~/.profile` จะไม่ช่วย service ที่มีการจัดการ เว้นแต่จะนำเข้า env แยกต่างหาก
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับ effort สำหรับการให้เหตุผลของโมเดล Cerebras สองโมเดลที่รองรับการให้เหตุผล
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ Agent และการกำหนดค่าโมเดล
  </Card>
  <Card title="FAQ เกี่ยวกับโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์การยืนยันตัวตน การสลับโมเดล และการแก้ข้อผิดพลาด "no profile"
  </Card>
</CardGroup>
