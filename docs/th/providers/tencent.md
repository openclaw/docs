---
read_when:
    - คุณต้องการใช้ Tencent hy3 กับ OpenClaw
    - คุณต้องตั้งค่าคีย์ API ของ TokenHub หรือ TokenPlan
summary: การตั้งค่า Tencent Cloud TokenHub และ TokenPlan สำหรับ hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T16:39:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

ติดตั้ง Plugin ผู้ให้บริการอย่างเป็นทางการของ Tencent Cloud เพื่อเข้าถึง Tencent Hy3 ผ่านปลายทางสองรายการ ได้แก่ TokenHub (`tencent-tokenhub`) และ TokenPlan (`tencent-tokenplan`) โดยใช้ API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ                  | ค่า                                                    |
| ------------------------- | ----------------------------------------------------- |
| รหัสผู้ให้บริการ              | `tencent-tokenhub`, `tencent-tokenplan`               |
| แพ็กเกจ                    | `@openclaw/tencent-provider`                          |
| ตัวแปรสภาพแวดล้อมการยืนยันตัวตนของ TokenHub     | `TOKENHUB_API_KEY`                                    |
| ตัวแปรสภาพแวดล้อมการยืนยันตัวตนของ TokenPlan    | `TOKENPLAN_API_KEY`                                   |
| แฟล็กเริ่มต้นใช้งาน TokenHub  | `--auth-choice tokenhub-api-key`                      |
| แฟล็กเริ่มต้นใช้งาน TokenPlan | `--auth-choice tokenplan-api-key`                     |
| แฟล็ก CLI โดยตรงของ TokenHub  | `--tokenhub-api-key <key>`                            |
| แฟล็ก CLI โดยตรงของ TokenPlan | `--tokenplan-api-key <key>`                           |
| API                       | เข้ากันได้กับ OpenAI (`openai-completions`)              |
| URL ฐานของ TokenHub         | `https://tokenhub.tencentmaas.com/v1`                 |
| URL ฐานส่วนกลางของ TokenHub  | `https://tokenhub-intl.tencentmaas.com/v1` (แทนที่ค่าเดิม) |
| URL ฐานของ TokenPlan        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| โมเดลเริ่มต้น                | `tencent-tokenhub/hy3`                                |

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Create a Tencent API key">
    สร้างคีย์ API สำหรับ Tencent Cloud TokenHub และ TokenPlan หากคุณเลือกขอบเขตการเข้าถึงแบบจำกัดสำหรับคีย์ ให้รวม **hy3** (และ **hy3 preview** หากคุณวางแผนจะใช้กับ TokenHub) ไว้ในโมเดลที่อนุญาต
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash TokenHub onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
จำเป็นต้องใช้ `--accept-risk` ร่วมกับ `--non-interactive`
</Note>

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล                      | ชื่อ                    | อินพุต | บริบท   | เอาต์พุตสูงสุด | หมายเหตุ             |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | ข้อความ  | 256,000 | 64,000     | รองรับการใช้เหตุผล |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | ข้อความ  | 256,000 | 64,000     | รองรับการใช้เหตุผล |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | ข้อความ  | 256,000 | 64,000     | รองรับการใช้เหตุผล |

hy3 คือโมเดลภาษา MoE ขนาดใหญ่ของ Tencent Hunyuan สำหรับการใช้เหตุผล การทำตามคำสั่งที่มีบริบทยาว โค้ด และเวิร์กโฟลว์ของเอเจนต์ ตัวอย่างที่เข้ากันได้กับ OpenAI ของ Tencent ใช้ `hy3` เป็นรหัสโมเดล และรองรับการเรียกใช้เครื่องมือผ่าน chat completions มาตรฐาน รวมถึง `reasoning_effort`

<Tip>
  รหัสโมเดลคือ `hy3` อย่าสับสนกับโมเดล `HY-3D-*` ของ Tencent ซึ่งเป็น API สำหรับสร้างเนื้อหา 3 มิติ และไม่ใช่โมเดลแชต OpenClaw ที่ผู้ให้บริการนี้กำหนดค่าไว้
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Endpoint override">
    แค็ตตาล็อกในตัวของ OpenClaw ใช้ปลายทาง `https://tokenhub.tencentmaas.com/v1` ของ Tencent Cloud ให้แทนที่ค่านี้เฉพาะเมื่อบัญชีหรือภูมิภาค TokenHub ของคุณต้องใช้ปลายทางอื่น:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    หาก Gateway ทำงานเป็นบริการที่มีการจัดการ (launchd, systemd, Docker) กระบวนการดังกล่าวต้องมองเห็น `TOKENHUB_API_KEY` และ `TOKENPLAN_API_KEY` กำหนดค่าเหล่านี้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้สภาพแวดล้อมการเรียกใช้ของ launchd, systemd หรือ Docker สามารถอ่านค่าได้

    <Warning>
      คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏต่อกระบวนการ Gateway ที่มีการจัดการ ใช้ไฟล์สภาพแวดล้อมหรือจุดเชื่อมต่อการกำหนดค่าเพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    หน้าผลิตภัณฑ์ TokenHub ของ Tencent Cloud
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    รายละเอียดและเกณฑ์มาตรฐานของ Tencent Hunyuan Hy3 preview
  </Card>
</CardGroup>
