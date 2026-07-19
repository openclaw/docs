---
read_when:
    - คุณต้องการใช้ Fireworks กับ OpenClaw
    - ต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API ของ Fireworks หรือรหัสโมเดลเริ่มต้น
    - คุณกำลังดีบักพฤติกรรมปิดการคิดของ Kimi บน Fireworks
summary: การตั้งค่า Fireworks (การยืนยันตัวตน + การเลือกโมเดล)
title: Fireworks
x-i18n:
    generated_at: "2026-07-19T07:32:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7720b23b69aa716d2e2903f5644bb74f81ca1c5e753f71d72d4d7a25c0747884
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) ให้บริการโมเดลแบบ open-weight และโมเดลที่กำหนดเส้นทางผ่าน API ที่เข้ากันได้กับ OpenAI ติดตั้ง Plugin ผู้ให้บริการ Fireworks อย่างเป็นทางการเพื่อใช้โมเดล Kimi ที่จัดทำแค็ตตาล็อกไว้ล่วงหน้า 2 โมเดล รวมถึงโมเดลหรือรหัสเราเตอร์ใดๆ ของ Fireworks ขณะรันไทม์

| คุณสมบัติ        | ค่า                                                  |
| --------------- | ------------------------------------------------------ |
| รหัสผู้ให้บริการ     | `fireworks` (นามแฝง: `fireworks-ai`)                    |
| แพ็กเกจ         | `@openclaw/fireworks-provider`                         |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `FIREWORKS_API_KEY`                                    |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice fireworks-api-key`                      |
| แฟล็ก CLI โดยตรง | `--fireworks-api-key <key>`                            |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`)               |
| URL ฐาน        | `https://api.fireworks.ai/inference/v1`                |
| โมเดลเริ่มต้น   | `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` |
| นามแฝงเริ่มต้น   | `Kimi K2.6 Turbo`                                      |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="ตั้งค่าคีย์ API ของ Fireworks">
    <CodeGroup>

```bash การเริ่มต้นใช้งาน
openclaw onboard --auth-choice fireworks-api-key
```

```bash แฟล็กโดยตรง
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash เฉพาะตัวแปรสภาพแวดล้อม
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    การเริ่มต้นใช้งานจะจัดเก็บคีย์สำหรับผู้ให้บริการ `fireworks` ในโปรไฟล์การยืนยันตัวตนของคุณ และตั้งค่าเราเตอร์ Kimi K2.6 Turbo **Fire Pass** เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider fireworks
    ```

    รายการควรมี `Kimi K2.6` และ `Kimi K2.6 Turbo (Fire Pass)` หากไม่สามารถแก้ไข `FIREWORKS_API_KEY` ได้ `openclaw models status --json` จะรายงานข้อมูลประจำตัวที่ขาดหายไปภายใต้ `auth.unusableProfiles`

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

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล                                              | ชื่อ                        | อินพุต        | บริบท | เอาต์พุตสูงสุด | การคิด             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | ข้อความ + รูปภาพ | 262,144 | 262,144    | บังคับปิด           |
| `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` | Kimi K2.6 Turbo (Fire Pass) | ข้อความ + รูปภาพ | 256,000 | 256,000    | บังคับปิด (ค่าเริ่มต้น) |

<Note>
  OpenClaw กำหนดโมเดล Kimi ทั้งหมดของ Fireworks ให้ใช้ `thinking: off` เนื่องจาก Kimi บน Fireworks อาจเปิดเผยลำดับความคิดในคำตอบที่มองเห็นได้ เว้นแต่คำขอจะปิดการคิดอย่างชัดเจน การกำหนดเส้นทางโมเดลเดียวกันผ่าน [Moonshot](/th/providers/moonshot) โดยตรงจะคงเอาต์พุตการใช้เหตุผลของ Kimi ไว้ ดูวิธีสลับระหว่างผู้ให้บริการได้ที่ [โหมดการคิด](/th/tools/thinking)
</Note>

## รหัสโมเดล Fireworks แบบกำหนดเอง

OpenClaw รองรับรหัสโมเดลหรือเราเตอร์ใดๆ ของ Fireworks ขณะรันไทม์ ใช้รหัสที่ Fireworks แสดงทุกอักขระและเติม `fireworks/` ไว้ข้างหน้า การแก้ไขแบบไดนามิกจะโคลนเทมเพลต Fire Pass (อินพุตข้อความ + รูปภาพ, API ที่เข้ากันได้กับ OpenAI, ค่าใช้จ่ายเริ่มต้นเป็นศูนย์) และปิดการคิดโดยอัตโนมัติเมื่อรหัสตรงกับรูปแบบ Kimi รหัสไดนามิกของ GLM จะถูกกำหนดให้รองรับเฉพาะข้อความ เว้นแต่คุณจะกำหนดค่ารายการโมเดลแบบกำหนดเองที่รองรับอินพุตรูปภาพ

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
  <Accordion title="การเติมคำนำหน้ารหัสโมเดลทำงานอย่างไร">
    การอ้างอิงโมเดล Fireworks ทุกรายการใน OpenClaw เริ่มต้นด้วย `fireworks/` ตามด้วยรหัสหรือพาธเราเตอร์จากแพลตฟอร์ม Fireworks ทุกอักขระ ตัวอย่างเช่น:

    - โมเดลเราเตอร์: `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo`
    - โมเดลโดยตรง: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw จะตัดคำนำหน้า `fireworks/` ออกเมื่อสร้างคำขอ API และส่งพาธที่เหลือไปยังปลายทาง Fireworks ในฐานะฟิลด์ `model` ที่เข้ากันได้กับ OpenAI

  </Accordion>

  <Accordion title="เหตุใดจึงบังคับปิดการคิดสำหรับ Kimi">
    Fireworks ให้บริการ Kimi โดยไม่มีช่องทางการใช้เหตุผลแยกต่างหาก ดังนั้นลำดับความคิดอาจปรากฏในสตรีม `content` ที่มองเห็นได้ ในทุกคำขอ Kimi ของ Fireworks นั้น OpenClaw จะส่ง `thinking: { type: "disabled" }` และตัด `reasoning`, `reasoning_effort` และ `reasoningEffort` ออกจากเพย์โหลด (`extensions/fireworks/stream.ts`) นโยบายผู้ให้บริการ (`extensions/fireworks/thinking-policy.ts`) ประกาศเฉพาะระดับการคิด `off` สำหรับรหัสโมเดล Kimi เพื่อให้การสลับ `/think` ด้วยตนเองและส่วนติดต่อของนโยบายผู้ให้บริการสอดคล้องกับสัญญารันไทม์

    หากต้องการใช้การให้เหตุผลของ Kimi ตั้งแต่ต้นจนจบ ให้กำหนดค่า [ผู้ให้บริการ Moonshot](/th/providers/moonshot) และกำหนดเส้นทางโมเดลเดียวกันผ่านผู้ให้บริการดังกล่าว

  </Accordion>

  <Accordion title="ความพร้อมใช้งานของสภาพแวดล้อมสำหรับดีมอน">
    หาก Gateway ทำงานเป็นบริการที่มีการจัดการ (launchd, systemd, Docker) คีย์ Fireworks ต้องมองเห็นได้โดยกระบวนการนั้น ไม่ใช่เฉพาะเชลล์แบบโต้ตอบของคุณ

    <Warning>
      คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วยดีมอน launchd หรือ systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นไปยังดีมอนด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้กระบวนการ Gateway อ่านได้
    </Warning>

    OpenClaw โหลด `~/.openclaw/.env` เมื่อโหลดการกำหนดค่า ดังนั้นคีย์ที่จัดเก็บไว้ในตำแหน่งดังกล่าวจะเข้าถึงบริการ Gateway ที่มีการจัดการได้ในทุกแพลตฟอร์ม รีสตาร์ต Gateway (หรือเรียกใช้ `openclaw doctor --fix` อีกครั้ง) หลังจากหมุนเวียนคีย์

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อเกิดการเฟลโอเวอร์
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับ `/think` นโยบายผู้ให้บริการ และการกำหนดเส้นทางโมเดลที่รองรับการใช้เหตุผล
  </Card>
  <Card title="Moonshot" href="/th/providers/moonshot" icon="moon">
    เรียกใช้ Kimi พร้อมเอาต์พุตการคิดแบบเนทีฟผ่าน API ของ Moonshot เอง
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
