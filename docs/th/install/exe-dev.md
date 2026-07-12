---
read_when:
    - คุณต้องการโฮสต์ Linux ราคาประหยัดที่เปิดทำงานตลอดเวลาสำหรับ Gateway
    - คุณต้องการเข้าถึง UI ควบคุมจากระยะไกลโดยไม่ต้องใช้งาน VPS ของคุณเอง
summary: เรียกใช้ OpenClaw Gateway บน exe.dev (VM + พร็อกซี HTTPS) เพื่อการเข้าถึงจากระยะไกล
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T16:18:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**เป้าหมาย:** ให้ OpenClaw Gateway ทำงานบน VM ของ [exe.dev](https://exe.dev) และเข้าถึงได้ที่ `https://<vm-name>.exe.xyz`

คู่มือนี้ถือว่าใช้ image เริ่มต้น **exeuntu** ของ exe.dev สำหรับดิสโทรอื่น ให้ปรับแพ็กเกจให้สอดคล้องกัน

## สิ่งที่ต้องมี

- บัญชี exe.dev
- สิทธิ์เข้าถึง VM ของ exe.dev ผ่าน `ssh exe.dev` (ไม่บังคับ สำหรับการตั้งค่าด้วยตนเอง)

## วิธีด่วนสำหรับผู้เริ่มต้น

1. เปิด [https://exe.new/openclaw](https://exe.new/openclaw)
2. กรอกคีย์/โทเค็นสำหรับการยืนยันตัวตนตามที่จำเป็น
3. คลิก "Agent" ข้าง VM ของคุณ แล้วรอให้ Shelley จัดเตรียมระบบเสร็จ
4. เปิด `https://<vm-name>.exe.xyz/` และยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกันซึ่งกำหนดค่าไว้ (ค่าเริ่มต้นใช้การยืนยันตัวตนด้วยโทเค็น แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้ได้เช่นกัน หากคุณเปลี่ยน `gateway.auth.mode`)
5. อนุมัติคำขอจับคู่อุปกรณ์ที่รอดำเนินการด้วย `openclaw devices approve <requestId>`

## การติดตั้งอัตโนมัติด้วย Shelley

Shelley ซึ่งเป็นเอเจนต์ของ exe.dev สามารถติดตั้ง OpenClaw จากพรอมต์ได้:

```text
ตั้งค่า OpenClaw (https://docs.openclaw.ai/install) บน VM นี้ ใช้แฟล็กแบบไม่โต้ตอบและยอมรับความเสี่ยงสำหรับการเริ่มต้นใช้งาน openclaw เพิ่มข้อมูลยืนยันตัวตนหรือโทเค็นที่ให้มาตามที่จำเป็น กำหนดค่า nginx ให้ส่งต่อจากพอร์ตเริ่มต้น 18789 ไปยังตำแหน่งรากในไฟล์กำหนดค่าไซต์เริ่มต้นที่เปิดใช้งานอยู่ และตรวจสอบให้แน่ใจว่าเปิดใช้การรองรับ Websocket การจับคู่ทำได้ด้วย "openclaw devices list" และ "openclaw devices approve <request id>" ตรวจสอบให้แน่ใจว่าแดชบอร์ดแสดงว่าสถานะสุขภาพของ OpenClaw เป็นปกติ exe.dev จัดการการส่งต่อจากพอร์ต 8000 ไปยังพอร์ต 80/443 และ HTTPS ให้เรา ดังนั้นปลายทางสุดท้ายที่ "เข้าถึงได้" ควรเป็น <vm-name>.exe.xyz โดยไม่ต้องระบุพอร์ต
```

## การติดตั้งด้วยตนเอง

<Steps>
  <Step title="สร้าง VM">
    จากอุปกรณ์ของคุณ:

    ```bash
    ssh exe.dev new
    ```

    จากนั้นเชื่อมต่อ:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    ให้ VM นี้ **เก็บสถานะถาวร** OpenClaw จัดเก็บ `openclaw.json`, `auth-profiles.json` ของแต่ละเอเจนต์, เซสชัน และสถานะของช่องทาง/ผู้ให้บริการไว้ภายใต้ `~/.openclaw/` รวมถึงพื้นที่ทำงานไว้ภายใต้ `~/.openclaw/workspace/`
    </Tip>

  </Step>

  <Step title="ติดตั้งสิ่งที่ต้องใช้ก่อน (บน VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="ติดตั้ง OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="กำหนดค่า nginx ให้ทำหน้าที่พร็อกซีไปยังพอร์ต 8000">
    แก้ไข `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # การรองรับ WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # ส่วนหัวพร็อกซีมาตรฐาน
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # การตั้งค่าระยะหมดเวลาสำหรับการเชื่อมต่อที่ใช้งานยาวนาน
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    เขียนทับส่วนหัวการส่งต่อแทนการคงสายโซ่ที่ไคลเอนต์ส่งมา OpenClaw เชื่อถือข้อมูลเมตา IP ที่ส่งต่อมาเฉพาะจากพร็อกซีที่กำหนดค่าไว้อย่างชัดเจนเท่านั้น และถือว่าสายโซ่ `X-Forwarded-For` แบบต่อท้ายเป็นความเสี่ยงด้านการเสริมความปลอดภัย

  </Step>

  <Step title="เข้าถึง OpenClaw และอนุมัติอุปกรณ์">
    เปิด `https://<vm-name>.exe.xyz/` (ดูผลลัพธ์ Control UI จากขั้นตอนเริ่มต้นใช้งาน) หากระบบขอการยืนยันตัวตน ให้วางข้อมูลลับที่ใช้ร่วมกันซึ่งกำหนดค่าไว้จาก VM

    คู่มือนี้ใช้การยืนยันตัวตนด้วยโทเค็นเป็นค่าเริ่มต้น ดังนั้นให้ดึง `gateway.auth.token` ด้วย `openclaw config get gateway.auth.token` หรือสร้างใหม่ด้วย `openclaw doctor --n` หากคุณเปลี่ยน Gateway ให้ใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แทน

    อนุมัติอุปกรณ์ด้วย `openclaw devices list` และ `openclaw devices approve <requestId>` หากไม่แน่ใจ ให้ใช้ Shelley จากเบราว์เซอร์ของคุณ

  </Step>
</Steps>

## การตั้งค่าช่องทางระยะไกล

สำหรับโฮสต์ระยะไกล ควรใช้การเรียก `config patch` หนึ่งครั้งแทนการเรียก `config set` ผ่าน SSH หลายครั้ง เก็บโทเค็นจริงไว้ในสภาพแวดล้อมของ VM หรือ `~/.openclaw/.env` และใส่เฉพาะ SecretRefs ใน `openclaw.json` ดูสัญญา SecretRef ฉบับเต็มได้ที่ [การจัดการข้อมูลลับ](/th/gateway/secrets)

บน VM ให้สภาพแวดล้อมของบริการมีข้อมูลลับที่จำเป็น:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

จากเครื่องภายในของคุณ ให้สร้างไฟล์แพตช์และส่งผ่านไปยัง VM:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

ใช้ `--replace-path` เมื่อรายการอนุญาตที่ซ้อนกันควรมีค่าเท่ากับค่าในแพตช์ทุกประการ ตัวอย่างเช่น การแทนที่รายการอนุญาตของช่อง Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

ดูเอกสารอ้างอิงการกำหนดค่าช่องทางฉบับเต็มได้ที่ [Discord](/th/channels/discord) และ [Slack](/th/channels/slack)

## การเข้าถึงระยะไกล

exe.dev จัดการการยืนยันตัวตนสำหรับการเข้าถึงระยะไกล โดยค่าเริ่มต้น ทราฟฟิก HTTP จากพอร์ต 8000 จะถูกส่งต่อไปยัง `https://<vm-name>.exe.xyz` พร้อมการยืนยันตัวตนด้วยอีเมล

## การอัปเดต

```bash
openclaw update
```

ดูการสลับช่องทางและการกู้คืนด้วยตนเองได้ที่ [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [Gateway ระยะไกล](/th/gateway/remote)
- [ภาพรวมการติดตั้ง](/th/install)
