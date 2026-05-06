---
read_when:
    - คุณต้องการใช้รุ่นพรีวิวของ Tencent Hy3 กับ OpenClaw
    - คุณต้องตั้งค่าคีย์ API ของ TokenHub
summary: การตั้งค่า Tencent Cloud TokenHub สำหรับ Hy3 รุ่นพรีวิว
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:29:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud จัดส่งมาเป็น Plugin ผู้ให้บริการที่บันเดิลมากับ OpenClaw โดยให้เข้าถึง Tencent Hy3 preview ผ่านเอ็นด์พอยต์ TokenHub (`tencent-tokenhub`) ด้วย API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ         | ค่า                                                 |
| ---------------- | ----------------------------------------------------- |
| รหัสผู้ให้บริการ      | `tencent-tokenhub`                                    |
| Plugin           | บันเดิลมา, `enabledByDefault: true`                     |
| ตัวแปร env สำหรับการยืนยันตัวตน     | `TOKENHUB_API_KEY`                                    |
| แฟล็กการเริ่มต้นใช้งาน  | `--auth-choice tokenhub-api-key`                      |
| แฟล็ก CLI โดยตรง  | `--tokenhub-api-key <key>`                            |
| API              | เข้ากันได้กับ OpenAI (`openai-completions`)              |
| URL ฐานเริ่มต้น | `https://tokenhub.tencentmaas.com/v1`                 |
| URL ฐานส่วนกลาง  | `https://tokenhub-intl.tencentmaas.com/v1` (เขียนทับค่าได้) |
| โมเดลเริ่มต้น    | `tencent-tokenhub/hy3-preview`                        |

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้างคีย์ TokenHub API">
    สร้างคีย์ API ใน Tencent Cloud TokenHub หากคุณเลือกขอบเขตการเข้าถึงแบบจำกัดสำหรับคีย์ ให้รวม **Hy3 preview** ไว้ในโมเดลที่อนุญาตด้วย
  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
  <Step title="ตรวจสอบโมเดล">
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

| อ้างอิงโมเดล                      | ชื่อ                   | อินพุต | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | ค่าเริ่มต้น; รองรับการใช้เหตุผล |

Hy3 preview คือโมเดลภาษา MoE ขนาดใหญ่ของ Tencent Hunyuan สำหรับการใช้เหตุผล การทำตามคำสั่งในบริบทยาว โค้ด และเวิร์กโฟลว์ของเอเจนต์ ตัวอย่างที่เข้ากันได้กับ OpenAI ของ Tencent ใช้ `hy3-preview` เป็นรหัสโมเดล และรองรับการเรียกใช้เครื่องมือแบบ chat-completions มาตรฐาน รวมถึง `reasoning_effort`

<Tip>
  รหัสโมเดลคือ `hy3-preview` อย่าสับสนกับโมเดล `HY-3D-*` ของ Tencent ซึ่งเป็น API สำหรับการสร้าง 3D และไม่ใช่โมเดลแชตของ OpenClaw ที่ผู้ให้บริการนี้กำหนดค่าไว้
</Tip>

## การกำหนดราคาแบบแบ่งระดับ

แค็ตตาล็อกที่บันเดิลมาจัดส่งมาพร้อมเมทาดาทาต้นทุนแบบแบ่งระดับ ซึ่งปรับตามความยาวของหน้าต่างอินพุต ดังนั้นการประมาณต้นทุนจึงถูกเติมให้โดยไม่ต้องเขียนทับค่าด้วยตนเอง

| ช่วงโทเค็นอินพุต | อัตราอินพุต | อัตราเอาต์พุต | การอ่านแคช |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

อัตราคิดเป็นต่อหนึ่งล้านโทเค็นในสกุล USD ตามที่ Tencent ประกาศไว้ เขียนทับการกำหนดราคาใต้ `models.providers.tencent-tokenhub` เฉพาะเมื่อคุณต้องการพื้นผิวที่แตกต่าง

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="เขียนทับเอ็นด์พอยต์">
    OpenClaw ใช้เอ็นด์พอยต์ `https://tokenhub.tencentmaas.com/v1` ของ Tencent Cloud เป็นค่าเริ่มต้น Tencent ยังมีเอกสารเอ็นด์พอยต์ TokenHub ระหว่างประเทศด้วย:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    เขียนทับเอ็นด์พอยต์เฉพาะเมื่อบัญชีหรือภูมิภาค TokenHub ของคุณกำหนดให้ต้องใช้เท่านั้น

  </Accordion>

  <Accordion title="ความพร้อมใช้งานของสภาพแวดล้อมสำหรับดีมอน">
    หาก Gateway ทำงานเป็นบริการที่มีการจัดการ (launchd, systemd, Docker), `TOKENHUB_API_KEY` ต้องมองเห็นได้สำหรับโปรเซสนั้น ตั้งค่าไว้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้สภาพแวดล้อมของ launchd, systemd หรือ Docker exec อ่านได้

    <Warning>
      คีย์ที่ตั้งไว้เฉพาะใน `~/.profile` จะไม่มองเห็นได้สำหรับโปรเซส Gateway ที่มีการจัดการ ใช้ไฟล์ env หรือ seam การกำหนดค่าเพื่อความพร้อมใช้งานแบบถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรมการเฟลโอเวอร์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    หน้าผลิตภัณฑ์ TokenHub ของ Tencent Cloud
  </Card>
  <Card title="การ์ดโมเดล Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    รายละเอียดและเบนช์มาร์กของ Tencent Hunyuan Hy3 preview
  </Card>
</CardGroup>
