---
read_when:
    - คุณต้องการใช้ Fireworks กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมคีย์ Fireworks API หรือรหัสโมเดลเริ่มต้น
    - คุณกำลังดีบักพฤติกรรม thinking-off ของ Kimi บน Fireworks
summary: การตั้งค่า Fireworks (การยืนยันตัวตน + การเลือกรุ่น)
title: ดอกไม้ไฟ
x-i18n:
    generated_at: "2026-06-27T18:13:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) เปิดให้ใช้โมเดลแบบ open-weight และโมเดลที่กำหนดเส้นทางผ่าน API ที่เข้ากันได้กับ OpenAI ติดตั้ง Plugin ผู้ให้บริการ Fireworks อย่างเป็นทางการเพื่อใช้โมเดล Kimi สองรายการที่จัดไว้ในแคตตาล็อกล่วงหน้า และโมเดลหรือ router id ใดๆ ของ Fireworks ขณะรันไทม์

| คุณสมบัติ        | ค่า                                                   |
| --------------- | ------------------------------------------------------ |
| Provider id     | `fireworks` (นามแฝง: `fireworks-ai`)                    |
| แพ็กเกจ         | `@openclaw/fireworks-provider`                         |
| ตัวแปรสภาพแวดล้อมสำหรับยืนยันตัวตน | `FIREWORKS_API_KEY`                                    |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice fireworks-api-key`                      |
| แฟล็ก CLI โดยตรง | `--fireworks-api-key <key>`                            |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`)               |
| URL ฐาน        | `https://api.fireworks.ai/inference/v1`                |
| โมเดลเริ่มต้น   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| นามแฝงเริ่มต้น   | `Kimi K2.5 Turbo`                                      |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
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

    การเริ่มต้นใช้งานจะจัดเก็บคีย์ไว้กับผู้ให้บริการ `fireworks` ในโปรไฟล์การยืนยันตัวตนของคุณ และตั้งค่า router **Fire Pass** Kimi K2.5 Turbo เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    รายการควรมี `Kimi K2.6` และ `Kimi K2.5 Turbo (Fire Pass)` หาก `FIREWORKS_API_KEY` ยังไม่ถูกแก้ค่า `openclaw models status --json` จะรายงานข้อมูลรับรองที่หายไปไว้ใต้ `auth.unusableProfiles`

  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

สำหรับการติดตั้งด้วยสคริปต์หรือ CI ให้ส่งทุกอย่างผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## แคตตาล็อกในตัว

| Model ref                                              | ชื่อ                        | อินพุต        | บริบท | เอาต์พุตสูงสุด | การคิด             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | ข้อความ + รูปภาพ | 262,144 | 262,144    | บังคับปิด           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | ข้อความ + รูปภาพ | 256,000 | 256,000    | บังคับปิด (ค่าเริ่มต้น) |

<Note>
  OpenClaw ตรึงโมเดล Kimi ทั้งหมดของ Fireworks เป็น `thinking: off` เพราะ Fireworks ปฏิเสธพารามิเตอร์การคิดของ Kimi ในโปรดักชัน การกำหนดเส้นทางโมเดลเดียวกันผ่าน [Moonshot](/th/providers/moonshot) โดยตรงจะคงเอาต์พุตการใช้เหตุผลของ Kimi ไว้ ดู [โหมดการคิด](/th/tools/thinking) สำหรับการสลับระหว่างผู้ให้บริการ
</Note>

## id โมเดล Fireworks แบบกำหนดเอง

OpenClaw รับโมเดลหรือ router id ใดๆ ของ Fireworks ขณะรันไทม์ ใช้ id ตรงตามที่ Fireworks แสดง และเติมคำนำหน้า `fireworks/` การแก้ค่าแบบไดนามิกจะโคลนเทมเพลต Fire Pass (อินพุตข้อความ + รูปภาพ, API ที่เข้ากันได้กับ OpenAI, ต้นทุนเริ่มต้นเป็นศูนย์) และปิดการคิดโดยอัตโนมัติเมื่อ id ตรงกับรูปแบบ Kimi id แบบไดนามิกของ GLM จะถูกทำเครื่องหมายเป็นข้อความเท่านั้น เว้นแต่คุณจะกำหนดค่ารายการโมเดลแบบกำหนดเองพร้อมอินพุตรูปภาพ

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
    ทุก model ref ของ Fireworks ใน OpenClaw เริ่มต้นด้วย `fireworks/` ตามด้วย id หรือเส้นทาง router ที่ตรงตามแพลตฟอร์ม Fireworks ตัวอย่างเช่น:

    - โมเดล Router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - โมเดลโดยตรง: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw จะตัดคำนำหน้า `fireworks/` ออกเมื่อสร้างคำขอ API และส่งเส้นทางที่เหลือไปยัง endpoint ของ Fireworks เป็นฟิลด์ `model` ที่เข้ากันได้กับ OpenAI

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 ส่งคืน 400 หากคำขอมีพารามิเตอร์ `reasoning_*` แม้ว่า Kimi จะรองรับการคิดผ่าน API ของ Moonshot เองก็ตาม นโยบายผู้ให้บริการ (`extensions/fireworks/thinking-policy.ts`) ประกาศเฉพาะระดับการคิด `off` สำหรับ id โมเดล Kimi ดังนั้นการสลับ `/think` ด้วยตนเองและพื้นผิวนโยบายผู้ให้บริการจึงสอดคล้องกับสัญญารันไทม์

    หากต้องการใช้การใช้เหตุผลของ Kimi แบบครบวงจร ให้กำหนดค่า [ผู้ให้บริการ Moonshot](/th/providers/moonshot) และกำหนดเส้นทางโมเดลเดียวกันผ่านผู้ให้บริการนั้น

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    หาก Gateway รันเป็นบริการที่จัดการอยู่ (launchd, systemd, Docker) คีย์ Fireworks ต้องมองเห็นได้สำหรับโปรเซสนั้น ไม่ใช่แค่เชลล์แบบโต้ตอบของคุณ

    <Warning>
      คีย์ที่ export เฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วย daemon ของ launchd หรือ systemd เว้นแต่ environment นั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้โปรเซส gateway อ่านได้
    </Warning>

    บน macOS คำสั่ง `openclaw gateway install` จะเชื่อม `~/.openclaw/.env` เข้ากับไฟล์ environment ของ LaunchAgent อยู่แล้ว ให้รันการติดตั้งอีกครั้ง (หรือ `openclaw doctor --fix`) หลังจากหมุนเวียนคีย์

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="Thinking modes" href="/th/tools/thinking" icon="brain">
    ระดับ `/think`, นโยบายผู้ให้บริการ และการกำหนดเส้นทางโมเดลที่รองรับการใช้เหตุผล
  </Card>
  <Card title="Moonshot" href="/th/providers/moonshot" icon="moon">
    รัน Kimi พร้อมเอาต์พุตการคิดแบบเนทีฟผ่าน API ของ Moonshot เอง
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
