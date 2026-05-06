---
read_when:
    - คุณต้องการใช้ Fireworks กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์เอพีไอของ Fireworks หรือรหัสโมเดลเริ่มต้น
    - คุณกำลังดีบักพฤติกรรมเมื่อปิดโหมดการคิดของ Kimi บน Fireworks
summary: การตั้งค่า Fireworks (การยืนยันตัวตน + การเลือกโมเดล)
title: ดอกไม้ไฟ
x-i18n:
    generated_at: "2026-05-06T09:27:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) เปิดให้ใช้โมเดล open-weight และโมเดลแบบ routed ผ่าน API ที่เข้ากันได้กับ OpenAI OpenClaw มี Plugin ผู้ให้บริการ Fireworks แบบ bundled ซึ่งมาพร้อมโมเดล Kimi ที่จัดทำแค็ตตาล็อกไว้ล่วงหน้า 2 รุ่น และรับ model id หรือ router id ใดๆ ของ Fireworks ได้ขณะรันไทม์

| คุณสมบัติ        | ค่า                                                  |
| --------------- | ------------------------------------------------------ |
| รหัสผู้ให้บริการ     | `fireworks` (นามแฝง: `fireworks-ai`)                    |
| Plugin          | bundled, `enabledByDefault: true`                      |
| ตัวแปรสภาพแวดล้อมสำหรับยืนยันตัวตน    | `FIREWORKS_API_KEY`                                    |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice fireworks-api-key`                      |
| แฟล็ก CLI โดยตรง | `--fireworks-api-key <key>`                            |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`)               |
| URL ฐาน        | `https://api.fireworks.ai/inference/v1`                |
| โมเดลเริ่มต้น   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| นามแฝงเริ่มต้น   | `Kimi K2.5 Turbo`                                      |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    การเริ่มต้นใช้งานจะจัดเก็บคีย์ไว้กับผู้ให้บริการ `fireworks` ในโปรไฟล์การยืนยันตัวตนของคุณ และตั้งค่าเราเตอร์ Kimi K2.5 Turbo ของ **Fire Pass** เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    รายการควรมี `Kimi K2.6` และ `Kimi K2.5 Turbo (Fire Pass)` หาก `FIREWORKS_API_KEY` ไม่สามารถ resolve ได้ `openclaw models status --json` จะรายงานข้อมูลรับรองที่หายไปภายใต้ `auth.unusableProfiles`

  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

สำหรับการติดตั้งผ่านสคริปต์หรือ CI ให้ส่งทุกอย่างผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล                                              | ชื่อ                        | อินพุต        | คอนเท็กซ์ | เอาต์พุตสูงสุด | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | ข้อความ + รูปภาพ | 262,144 | 262,144    | บังคับปิด           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | ข้อความ + รูปภาพ | 256,000 | 256,000    | บังคับปิด (ค่าเริ่มต้น) |

<Note>
  OpenClaw ปักหมุดโมเดล Fireworks Kimi ทั้งหมดเป็น `thinking: off` เพราะ Fireworks ปฏิเสธพารามิเตอร์ thinking ของ Kimi ในโปรดักชัน การ route โมเดลเดียวกันผ่าน [Moonshot](/th/providers/moonshot) โดยตรงจะรักษาเอาต์พุตการให้เหตุผลของ Kimi ไว้ ดู [โหมด thinking](/th/tools/thinking) สำหรับการสลับระหว่างผู้ให้บริการ
</Note>

## model id แบบกำหนดเองของ Fireworks

OpenClaw รับ model id หรือ router id ใดๆ ของ Fireworks ได้ขณะรันไทม์ ใช้ id ตรงตามที่ Fireworks แสดงและเติม prefix ด้วย `fireworks/` การ resolve แบบไดนามิกจะ clone เทมเพลต Fire Pass (อินพุตข้อความ + รูปภาพ, API ที่เข้ากันได้กับ OpenAI, ค่าใช้จ่ายเริ่มต้นเป็นศูนย์) และปิด thinking โดยอัตโนมัติเมื่อ id ตรงกับรูปแบบ Kimi

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    การอ้างอิงโมเดล Fireworks ทุกตัวใน OpenClaw เริ่มต้นด้วย `fireworks/` ตามด้วย id หรือเส้นทางเราเตอร์ที่ตรงจากแพลตฟอร์ม Fireworks ตัวอย่างเช่น:

    - โมเดลเราเตอร์: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - โมเดลโดยตรง: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw จะตัด prefix `fireworks/` ออกเมื่อสร้างคำขอ API และส่งเส้นทางที่เหลือไปยัง endpoint ของ Fireworks เป็นฟิลด์ `model` ที่เข้ากันได้กับ OpenAI

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 จะส่งคืน 400 หากคำขอมีพารามิเตอร์ `reasoning_*` แม้ว่า Kimi จะรองรับ thinking ผ่าน API ของ Moonshot เองก็ตาม นโยบายแบบ bundled (`extensions/fireworks/thinking-policy.ts`) จะประกาศเฉพาะระดับ thinking `off` สำหรับ model id ของ Kimi เพื่อให้การสลับ `/think` แบบแมนนวลและพื้นผิวนโยบายผู้ให้บริการสอดคล้องกับสัญญารันไทม์

    หากต้องการใช้การให้เหตุผลของ Kimi แบบครบวงจร ให้กำหนดค่า [ผู้ให้บริการ Moonshot](/th/providers/moonshot) และ route โมเดลเดียวกันผ่านผู้ให้บริการนั้น

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    หาก Gateway ทำงานเป็นบริการที่มีการจัดการ (launchd, systemd, Docker) คีย์ Fireworks ต้องมองเห็นได้สำหรับโปรเซสนั้น ไม่ใช่แค่ shell แบบโต้ตอบของคุณ

    <Warning>
      คีย์ที่อยู่เฉพาะใน `~/.profile` จะไม่ช่วย daemon ของ launchd หรือ systemd เว้นแต่ว่าสภาพแวดล้อมนั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้โปรเซส gateway อ่านได้
    </Warning>

    บน macOS, `openclaw gateway install` จะเชื่อม `~/.openclaw/.env` เข้ากับไฟล์สภาพแวดล้อมของ LaunchAgent อยู่แล้ว ให้รัน install อีกครั้ง (หรือ `openclaw doctor --fix`) หลังจากหมุนเวียนคีย์

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Thinking modes" href="/th/tools/thinking" icon="brain">
    ระดับ `/think` นโยบายผู้ให้บริการ และการ route โมเดลที่มีความสามารถด้านการให้เหตุผล
  </Card>
  <Card title="Moonshot" href="/th/providers/moonshot" icon="moon">
    รัน Kimi พร้อมเอาต์พุต thinking แบบเนทีฟผ่าน API ของ Moonshot เอง
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
