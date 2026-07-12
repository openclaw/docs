---
read_when:
    - คุณต้องการใช้ Cloudflare AI Gateway กับ OpenClaw
    - คุณต้องมี ID บัญชี, ID ของ Gateway หรือตัวแปรสภาพแวดล้อมสำหรับคีย์ API
summary: การตั้งค่า Cloudflare AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Gateway AI ของ Cloudflare
x-i18n:
    generated_at: "2026-07-12T16:34:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) ทำงานอยู่หน้า API ของผู้ให้บริการ และเพิ่มการวิเคราะห์ การแคช และการควบคุม สำหรับ Anthropic นั้น OpenClaw ใช้ Anthropic Messages API ผ่านปลายทาง Gateway ของคุณ

| คุณสมบัติ      | ค่า                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| ผู้ให้บริการ      | `cloudflare-ai-gateway`                                                                  |
| Plugin        | แพ็กเกจภายนอกอย่างเป็นทางการ (`@openclaw/cloudflare-ai-gateway-provider`)                   |
| URL ฐาน      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| โมเดลเริ่มต้น | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| คีย์ API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (คีย์ API ของผู้ให้บริการสำหรับคำขอที่ส่งผ่าน Gateway) |

<Note>
สำหรับโมเดล Anthropic ที่กำหนดเส้นทางผ่าน Cloudflare AI Gateway ให้ใช้ **คีย์ API ของ Anthropic** เป็นคีย์ผู้ให้บริการ
</Note>

เมื่อเปิดใช้งานการคิดสำหรับโมเดล Anthropic Messages ทาง OpenClaw จะลบ
เทิร์นพรีฟิลของผู้ช่วยที่อยู่ท้ายสุดก่อนส่งเพย์โหลดผ่าน Cloudflare AI Gateway
Anthropic ปฏิเสธการพรีฟิลคำตอบเมื่อใช้การคิดแบบขยาย แต่ยังคงใช้
การพรีฟิลแบบปกติที่ไม่ใช้การคิดได้

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API ของผู้ให้บริการและรายละเอียด Gateway">
    เรียกใช้กระบวนการเริ่มต้นใช้งานและเลือกตัวเลือกการยืนยันตัวตนของ Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    ระบบจะขอ ID บัญชี, ID เกตเวย์ และคีย์ API ของคุณ

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลลงในการกำหนดค่า OpenClaw ของคุณ:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## ตัวอย่างแบบไม่โต้ตอบ

สำหรับการตั้งค่าด้วยสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Gateway ที่มีการยืนยันตัวตน">
    หากคุณเปิดใช้งานการยืนยันตัวตนของ Gateway ใน Cloudflare ให้เพิ่มส่วนหัว `cf-aig-authorization` โดยต้องใช้ **เพิ่มเติมจาก** คีย์ API ของผู้ให้บริการ

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    ส่วนหัว `cf-aig-authorization` ใช้ยืนยันตัวตนกับ Cloudflare Gateway โดยตรง ส่วนคีย์ API ของผู้ให้บริการ (เช่น คีย์ Anthropic ของคุณ) ใช้ยืนยันตัวตนกับผู้ให้บริการต้นทาง
    </Tip>

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่าโปรเซสนั้นสามารถเข้าถึง `CLOUDFLARE_AI_GATEWAY_API_KEY` ได้

    <Warning>
    คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วยให้ดีมอน launchd/systemd ใช้งานได้ เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นไปยังดีมอนด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส Gateway สามารถอ่านคีย์ได้
    </Warning>

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
