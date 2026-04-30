---
read_when:
    - คุณต้องการใช้ Cloudflare AI Gateway ร่วมกับ OpenClaw
    - คุณต้องมี ID บัญชี, ID ของ Gateway หรือ env var ของคีย์ API
summary: การตั้งค่า Cloudflare AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-30T10:11:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway อยู่หน้า API ของผู้ให้บริการ และช่วยให้คุณเพิ่มการวิเคราะห์ แคช และการควบคุมได้ สำหรับ Anthropic นั้น OpenClaw ใช้ Anthropic Messages API ผ่านปลายทาง Gateway ของคุณ

| คุณสมบัติ      | ค่า                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| ผู้ให้บริการ      | `cloudflare-ai-gateway`                                                                  |
| URL ฐาน      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| โมเดลเริ่มต้น | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| คีย์ API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (คีย์ API ของผู้ให้บริการสำหรับคำขอผ่าน Gateway) |

<Note>
สำหรับโมเดล Anthropic ที่ส่งผ่าน Cloudflare AI Gateway ให้ใช้ **คีย์ API ของ Anthropic** เป็นคีย์ผู้ให้บริการ
</Note>

เมื่อเปิดใช้การคิดสำหรับโมเดล Anthropic Messages แล้ว OpenClaw จะตัดเทิร์นพรีฟิลของ
assistant ที่ต่อท้ายออกก่อนส่ง payload ผ่าน Cloudflare AI Gateway
Anthropic ปฏิเสธการพรีฟิลการตอบกลับเมื่อใช้ extended thinking ขณะที่การพรีฟิล
แบบไม่คิดตามปกติยังคงใช้ได้

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API ของผู้ให้บริการและรายละเอียด Gateway">
    เรียกใช้ onboarding แล้วเลือกตัวเลือกการยืนยันตัวตน Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    ระบบจะแจ้งให้ป้อน ID บัญชี, ID gateway และคีย์ API ของคุณ

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลในคอนฟิก OpenClaw ของคุณ:

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

สำหรับการตั้งค่าแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่านบรรทัดคำสั่ง:

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
  <Accordion title="Gateway ที่ยืนยันตัวตนแล้ว">
    หากคุณเปิดใช้การยืนยันตัวตน Gateway ใน Cloudflare ให้เพิ่มส่วนหัว `cf-aig-authorization` ซึ่งเป็นสิ่งที่ต้องใช้ **เพิ่มเติมจาก** คีย์ API ของผู้ให้บริการของคุณ

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
    ส่วนหัว `cf-aig-authorization` ใช้ยืนยันตัวตนกับ Cloudflare Gateway เอง ขณะที่คีย์ API ของผู้ให้บริการ (เช่น คีย์ Anthropic ของคุณ) ใช้ยืนยันตัวตนกับผู้ให้บริการ upstream
    </Tip>

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `CLOUDFLARE_AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่อยู่เฉพาะใน `~/.profile` จะไม่ช่วย daemon ของ launchd/systemd เว้นแต่ว่าสภาพแวดล้อมนั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway อ่านคีย์ได้
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
