---
read_when:
    - คุณต้องการใช้ Cerebras กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API ของ Cerebras หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Cerebras (การยืนยันตัวตน + การเลือกโมเดล)
title: Cerebras
x-i18n:
    generated_at: "2026-07-19T07:57:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 716eef83155ef80d9aa61bd55ed83e3e38ad22720ae055bce7eb9c2cbfb6cf41
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) ให้บริการอนุมานความเร็วสูงที่เข้ากันได้กับ OpenAI บนฮาร์ดแวร์อนุมานที่ออกแบบเฉพาะ Plugin มาพร้อมแค็ตตาล็อกแบบคงที่ซึ่งมีสองโมเดล (ไม่มีการค้นหาแบบเรียลไทม์)

| คุณสมบัติ        | ค่า                                                     |
| --------------- | --------------------------------------------------------- |
| รหัสผู้ให้บริการ     | `cerebras`                                                |
| Plugin          | แพ็กเกจภายนอกอย่างเป็นทางการ (`@openclaw/cerebras-provider`) |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `CEREBRAS_API_KEY`                                        |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice cerebras-api-key`                          |
| แฟล็ก CLI โดยตรง | `--cerebras-api-key <key>`                                |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`)                  |
| URL ฐาน        | `https://api.cerebras.ai/v1`                              |
| โมเดลเริ่มต้น   | `cerebras/zai-glm-4.7`                                    |

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
  <Step title="ดำเนินการเริ่มต้นใช้งาน">
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

    แสดงรายการโมเดลแบบคงที่ทั้งสอง หาก `CEREBRAS_API_KEY` ยังไม่ได้รับการแก้ไข `openclaw models status --json` จะรายงานข้อมูลประจำตัวที่ขาดหายไปภายใต้ `auth.unusableProfiles`

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

ทั้งสองโมเดลใช้หน้าต่างบริบทขนาด 128k และโทเค็นเอาต์พุตสูงสุด 8,192 โทเค็น

| การอ้างอิงโมเดล               | ชื่อ         | การให้เหตุผล | หมายเหตุ                                  |
| ----------------------- | ------------ | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`  | Z.ai GLM 4.7 | ใช่       | โมเดลเริ่มต้น; โมเดลการให้เหตุผลรุ่นพรีวิว |
| `cerebras/gpt-oss-120b` | GPT OSS 120B | ใช่       | โมเดลการให้เหตุผลสำหรับระบบใช้งานจริง             |

## การกำหนดค่าด้วยตนเอง

การตั้งค่าส่วนใหญ่ต้องการเพียงคีย์ API ใช้การกำหนดค่า `models.providers.cerebras` แบบชัดเจนเพื่อเขียนทับข้อมูลเมตาของโมเดล หรือเรียกใช้ใน `mode: "merge"` กับแค็ตตาล็อกแบบคงที่:

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
หาก Gateway ทำงานเป็นดีมอน (launchd, systemd, Docker) โปรดตรวจสอบว่า `CEREBRAS_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วยให้บริการที่มีการจัดการทำงานได้ เว้นแต่จะนำเข้าสภาพแวดล้อมแยกต่างหาก
</Note>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามในการให้เหตุผลสำหรับโมเดล Cerebras สองรุ่นที่รองรับการให้เหตุผล
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
  <Card title="คำถามที่พบบ่อยเกี่ยวกับโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์การยืนยันตัวตน การสลับโมเดล และการแก้ไขข้อผิดพลาด "no profile"
  </Card>
</CardGroup>
