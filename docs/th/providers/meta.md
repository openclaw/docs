---
read_when:
    - คุณต้องการใช้ Meta กับ OpenClaw
    - คุณต้องกำหนดตัวแปรสภาพแวดล้อม MODEL_API_KEY หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Meta (การยืนยันตัวตน + การเลือกโมเดล muse-spark-1.1)
title: เมตา
x-i18n:
    generated_at: "2026-07-12T16:35:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** ใช้ **Responses API** ที่เข้ากันได้กับ OpenAI (`POST /v1/responses`)
สำหรับโมเดลการให้เหตุผล `muse-spark-1.1` โดยผู้ให้บริการนี้จัดส่งมาในรูปแบบ
Plugin ที่รวมมากับ OpenClaw

| คุณสมบัติ              | ค่า                                |
| ---------------------- | ---------------------------------- |
| รหัสผู้ให้บริการ       | `meta`                             |
| Plugin                 | ผู้ให้บริการที่รวมมาให้            |
| ตัวแปรสภาพแวดล้อมการยืนยันตัวตน | `MODEL_API_KEY`          |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice meta-api-key`       |
| แฟล็ก CLI โดยตรง       | `--meta-api-key <key>`             |
| API                    | Responses API (`openai-responses`) |
| URL ฐาน                | `https://api.meta.ai/v1`           |
| โมเดลเริ่มต้น          | `meta/muse-spark-1.1`              |
| การให้เหตุผลเริ่มต้น   | `high` (`reasoning.effort`)        |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    <CodeGroup>

```bash การเริ่มต้นใช้งาน
openclaw onboard --auth-choice meta-api-key
```

```bash แฟล็กโดยตรง
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash เฉพาะตัวแปรสภาพแวดล้อม
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider meta
    ```

    แสดงรายการแค็ตตาล็อกแบบคงที่ของ `muse-spark-1.1` หากไม่สามารถระบุค่า `MODEL_API_KEY` ได้
    `openclaw models status --json` จะรายงานข้อมูลประจำตัวที่ขาดหายไปภายใต้
    `auth.unusableProfiles`

  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล        | ชื่อ           | การให้เหตุผล | หน้าต่างบริบท | เอาต์พุตสูงสุด |
| ---------------------- | -------------- | ------------ | -------------- | -------------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | ใช่          | 1,048,576      | 131,072        |

ความสามารถ:

- อินพุตข้อความและรูปภาพ
- การเรียกใช้เครื่องมือและการสตรีม
- ระดับความพยายามในการให้เหตุผล: `minimal`, `low`, `medium`, `high`, `xhigh` (ค่าเริ่มต้น: `high`)
- การเล่นซ้ำการให้เหตุผลแบบเข้ารหัสโดยไม่เก็บสถานะ (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` ไม่รองรับ `reasoning.effort: "none"` OpenClaw จะแมป
`--thinking off` เป็น `minimal` สำหรับผู้ให้บริการนี้
</Warning>

## การกำหนดค่าด้วยตนเอง

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
หาก Gateway ทำงานเป็นดีมอน (launchd, systemd, Docker) โปรดตรวจสอบว่า
โปรเซสนั้นสามารถเข้าถึง `MODEL_API_KEY` ได้ เช่น กำหนดไว้ใน
`~/.openclaw/.env` หรือผ่าน `env.shellEnv` คีย์ที่ส่งออกเฉพาะใน
เชลล์แบบโต้ตอบจะไม่ช่วยให้บริการที่มีการจัดการใช้งานได้ เว้นแต่จะนำเข้า
ตัวแปรสภาพแวดล้อมแยกต่างหาก
</Note>

## การทดสอบเบื้องต้น

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

การทดสอบแบบใช้งานจริงใช้ `muse-spark-1.1` กับ `POST /v1/responses`

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามในการให้เหตุผลสำหรับ muse-spark-1.1
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
