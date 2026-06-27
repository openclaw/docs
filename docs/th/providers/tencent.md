---
read_when:
    - คุณต้องการใช้ Tencent Hy3 พรีวิวกับ OpenClaw
    - คุณต้องตั้งค่าคีย์ API ของ TokenHub
summary: การตั้งค่า Tencent Cloud TokenHub สำหรับตัวอย่าง Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

ติดตั้ง Plugin ผู้ให้บริการ Tencent Cloud อย่างเป็นทางการเพื่อเข้าถึง Tencent Hy3 preview ผ่านปลายทาง TokenHub (`tencent-tokenhub`) โดยใช้ API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ         | ค่า                                                   |
| ---------------- | ----------------------------------------------------- |
| รหัสผู้ให้บริการ | `tencent-tokenhub`                                    |
| แพ็กเกจ          | `@openclaw/tencent-provider`                          |
| ตัวแปรสภาพแวดล้อมสำหรับยืนยันตัวตน | `TOKENHUB_API_KEY`                  |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice tokenhub-api-key`                 |
| แฟล็ก CLI โดยตรง | `--tokenhub-api-key <key>`                            |
| API              | เข้ากันได้กับ OpenAI (`openai-completions`)           |
| URL ฐานเริ่มต้น  | `https://tokenhub.tencentmaas.com/v1`                 |
| URL ฐานส่วนกลาง  | `https://tokenhub-intl.tencentmaas.com/v1` (แทนที่) |
| โมเดลเริ่มต้น    | `tencent-tokenhub/hy3-preview`                        |

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    สร้างคีย์ API ใน Tencent Cloud TokenHub หากคุณเลือกขอบเขตการเข้าถึงแบบจำกัดสำหรับคีย์ ให้รวม **Hy3 preview** ไว้ในโมเดลที่อนุญาตด้วย
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## แค็ตตาล็อกในตัว

| อ้างอิงโมเดล                  | ชื่อ                   | อินพุต | บริบท  | เอาต์พุตสูงสุด | หมายเหตุ                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | เริ่มต้น; เปิดใช้การให้เหตุผล |

Hy3 preview คือโมเดลภาษา MoE ขนาดใหญ่ของ Tencent Hunyuan สำหรับการให้เหตุผล การทำตามคำสั่งที่มีบริบทยาว โค้ด และเวิร์กโฟลว์ของเอเจนต์ ตัวอย่างที่เข้ากันได้กับ OpenAI ของ Tencent ใช้ `hy3-preview` เป็นรหัสโมเดล และรองรับการเรียกใช้เครื่องมือแบบ chat-completions มาตรฐาน รวมถึง `reasoning_effort`

<Tip>
  รหัสโมเดลคือ `hy3-preview` อย่าสับสนกับโมเดล `HY-3D-*` ของ Tencent ซึ่งเป็น API สำหรับการสร้าง 3D และไม่ใช่โมเดลแชตของ OpenClaw ที่ผู้ให้บริการนี้กำหนดค่าไว้
</Tip>

## การกำหนดราคาแบบหลายระดับ

แค็ตตาล็อกผู้ให้บริการมาพร้อมเมทาดาทาต้นทุนแบบหลายระดับที่ปรับตามความยาวหน้าต่างอินพุต ดังนั้นการประมาณต้นทุนจะถูกเติมโดยไม่ต้องแทนที่ด้วยตนเอง

| ช่วงโทเค็นอินพุต | อัตราอินพุต | อัตราเอาต์พุต | การอ่านแคช |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

อัตราคิดต่อหนึ่งล้านโทเค็นเป็น USD ตามที่ Tencent ประกาศไว้ แทนที่การกำหนดราคาภายใต้ `models.providers.tencent-tokenhub` เฉพาะเมื่อคุณต้องการพื้นผิวอื่น

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw ใช้ปลายทาง `https://tokenhub.tencentmaas.com/v1` ของ Tencent Cloud เป็นค่าเริ่มต้น Tencent ยังจัดทำเอกสารปลายทาง TokenHub ระหว่างประเทศไว้ด้วย:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    แทนที่ปลายทางเฉพาะเมื่อบัญชีหรือภูมิภาค TokenHub ของคุณต้องการเท่านั้น

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    หาก Gateway ทำงานเป็นบริการที่จัดการอยู่ (launchd, systemd, Docker), `TOKENHUB_API_KEY` ต้องมองเห็นได้สำหรับกระบวนการนั้น ตั้งค่าไว้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้สภาพแวดล้อมของ launchd, systemd หรือ Docker exec อ่านได้

    <Warning>
      คีย์ที่ export เฉพาะในเชลล์แบบโต้ตอบจะไม่มองเห็นได้สำหรับกระบวนการ Gateway ที่จัดการอยู่ ใช้ไฟล์ env หรือรอยต่อการกำหนดค่าเพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    หน้าผลิตภัณฑ์ TokenHub ของ Tencent Cloud
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    รายละเอียดและเบนช์มาร์กของ Tencent Hunyuan Hy3 preview
  </Card>
</CardGroup>
