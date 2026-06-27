---
read_when:
    - คุณต้องการใช้ Cloudflare AI Gateway กับ OpenClaw
    - คุณต้องมี ID บัญชี, ID ของ Gateway หรือตัวแปรสภาพแวดล้อมสำหรับคีย์ API
summary: การตั้งค่า Cloudflare AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Gateway AI ของ Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:12:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway อยู่หน้า API ของผู้ให้บริการ และช่วยให้คุณเพิ่มการวิเคราะห์ การแคช และการควบคุมได้ สำหรับ Anthropic นั้น OpenClaw ใช้ Anthropic Messages API ผ่านปลายทาง Gateway ของคุณ

| คุณสมบัติ | ค่า                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| ผู้ให้บริการ | `cloudflare-ai-gateway`                                                                  |
| URL ฐาน      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| โมเดลเริ่มต้น | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| คีย์ API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (คีย์ API ของผู้ให้บริการของคุณสำหรับคำขอผ่าน Gateway) |

<Note>
สำหรับโมเดล Anthropic ที่กำหนดเส้นทางผ่าน Cloudflare AI Gateway ให้ใช้ **คีย์ Anthropic API** ของคุณเป็นคีย์ผู้ให้บริการ
</Note>

เมื่อเปิดใช้การคิดสำหรับโมเดล Anthropic Messages แล้ว OpenClaw จะตัดรอบการเติมข้อความล่วงหน้าของผู้ช่วยที่ต่อท้ายออก
ก่อนส่งเพย์โหลดผ่าน Cloudflare AI Gateway
Anthropic ปฏิเสธการเติมคำตอบล่วงหน้าเมื่อใช้การคิดแบบขยาย ส่วนการเติมล่วงหน้าแบบปกติ
ที่ไม่ใช้การคิดยังคงใช้งานได้

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Set the provider API key and Gateway details">
    เรียกใช้ออนบอร์ดดิ้งและเลือกตัวเลือกการยืนยันตัวตนของ Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    ระบบจะถาม ID บัญชี, ID ของ gateway และคีย์ API ของคุณ

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
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
  <Accordion title="Authenticated gateways">
    หากคุณเปิดใช้การยืนยันตัวตนของ Gateway ใน Cloudflare ให้เพิ่มส่วนหัว `cf-aig-authorization` สิ่งนี้เป็นส่วนที่ใช้ **เพิ่มเติมจาก** คีย์ API ของผู้ให้บริการของคุณ

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
    ส่วนหัว `cf-aig-authorization` ใช้ยืนยันตัวตนกับ Cloudflare Gateway เอง ส่วนคีย์ API ของผู้ให้บริการ (เช่น คีย์ Anthropic ของคุณ) ใช้ยืนยันตัวตนกับผู้ให้บริการต้นทาง
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `CLOUDFLARE_AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับกระบวนการนั้น

    <Warning>
    คีย์ที่ export ไว้เฉพาะใน shell แบบโต้ตอบจะไม่ช่วย daemon ของ launchd/systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่ากระบวนการ gateway อ่านค่าได้
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานของ failover
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
