---
read_when:
    - คุณต้องการโฮสต์ Linux ราคาประหยัดที่เปิดทำงานตลอดเวลาสำหรับ Gateway
    - คุณต้องการเข้าถึงอินเทอร์เฟซควบคุมจากระยะไกลโดยไม่ต้องรัน VPS ของคุณเอง
summary: เรียกใช้ OpenClaw Gateway บน exe.dev (VM + พร็อกซี HTTPS) เพื่อการเข้าถึงจากระยะไกล
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T10:00:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

เป้าหมาย: OpenClaw Gateway ทำงานบน VM ของ exe.dev และเข้าถึงได้จากแล็ปท็อปของคุณผ่าน: `https://<vm-name>.exe.xyz`

หน้านี้ถือว่าคุณใช้ image **exeuntu** เริ่มต้นของ exe.dev หากคุณเลือก distro อื่น ให้เทียบแพ็กเกจให้เหมาะสม

## เส้นทางด่วนสำหรับผู้เริ่มต้น

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. กรอก auth key/token ของคุณตามต้องการ
3. คลิก "Agent" ถัดจาก VM ของคุณ แล้วรอให้ Shelley จัดเตรียมระบบให้เสร็จ
4. เปิด `https://<vm-name>.exe.xyz/` และยืนยันตัวตนด้วย shared secret ที่กำหนดค่าไว้ (คู่มือนี้ใช้ token auth เป็นค่าเริ่มต้น แต่ password auth ก็ใช้ได้เช่นกันหากคุณเปลี่ยน `gateway.auth.mode`)
5. อนุมัติคำขอจับคู่อุปกรณ์ที่รอดำเนินการด้วย `openclaw devices approve <requestId>`

## สิ่งที่คุณต้องมี

- บัญชี exe.dev
- สิทธิ์เข้าถึงเครื่องเสมือน [exe.dev](https://exe.dev) ด้วย `ssh exe.dev` (ไม่บังคับ)

## ติดตั้งอัตโนมัติด้วย Shelley

Shelley ซึ่งเป็น agent ของ [exe.dev](https://exe.dev) สามารถติดตั้ง OpenClaw ได้ทันทีด้วย
พรอมต์ของเรา พรอมต์ที่ใช้มีดังนี้:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## การติดตั้งด้วยตนเอง

## 1) สร้าง VM

จากอุปกรณ์ของคุณ:

```bash
ssh exe.dev new
```

จากนั้นเชื่อมต่อ:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
เก็บ VM นี้ให้เป็นแบบ **stateful** OpenClaw จัดเก็บ `openclaw.json`, `auth-profiles.json` ต่อ agent, session และสถานะ channel/provider ไว้ใต้ `~/.openclaw/` รวมถึง workspace ใต้ `~/.openclaw/workspace/`
</Tip>

## 2) ติดตั้งสิ่งที่ต้องมีก่อน (บน VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) ติดตั้ง OpenClaw

เรียกใช้สคริปต์ติดตั้ง OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) ตั้งค่า nginx ให้ proxy OpenClaw ไปยัง port 8000

แก้ไข `/etc/nginx/sites-enabled/default` ด้วย

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

เขียนทับ forwarding headers แทนการเก็บ chain ที่ client ส่งมา
OpenClaw เชื่อถือ metadata ของ IP ที่ forward มาเฉพาะจาก proxy ที่กำหนดค่าไว้อย่างชัดเจนเท่านั้น
และ chain แบบ append-style ของ `X-Forwarded-For` จะถูกถือว่าเป็นความเสี่ยงด้านการเสริมความปลอดภัย

## 5) เข้าถึง OpenClaw และมอบสิทธิ์

เข้าถึง `https://<vm-name>.exe.xyz/` (ดู output ของ Control UI จาก onboarding) หากระบบถามการยืนยันตัวตน ให้วาง
shared secret ที่กำหนดค่าไว้จาก VM คู่มือนี้ใช้ token auth ดังนั้นให้ดึง `gateway.auth.token`
ด้วย `openclaw config get gateway.auth.token` (หรือสร้างด้วย `openclaw doctor --generate-gateway-token`)
หากคุณเปลี่ยน Gateway ไปใช้ password auth ให้ใช้ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แทน
อนุมัติอุปกรณ์ด้วย `openclaw devices list` และ `openclaw devices approve <requestId>` หากไม่แน่ใจ ให้ใช้ Shelley จากเบราว์เซอร์ของคุณ

## ตั้งค่า channel ระยะไกล

สำหรับโฮสต์ระยะไกล ควรใช้คำสั่ง `config patch` เพียงครั้งเดียวแทนการเรียก `config set` ผ่าน SSH หลายครั้ง เก็บ token จริงไว้ในสภาพแวดล้อมของ VM หรือ `~/.openclaw/.env` และใส่เฉพาะ SecretRefs ใน `openclaw.json`

บน VM ให้สภาพแวดล้อมของ service มี secret ที่ต้องใช้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

จากเครื่อง local ของคุณ ให้สร้างไฟล์ patch แล้ว pipe ไปยัง VM:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

ใช้ `--replace-path` เมื่อ allowlist ที่ซ้อนอยู่ควรกลายเป็นค่าของ patch แบบตรงทั้งหมด เช่น เมื่อแทนที่ allowlist ของ Discord channel:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## การเข้าถึงระยะไกล

การเข้าถึงระยะไกลจัดการโดยการยืนยันตัวตนของ [exe.dev](https://exe.dev) โดย
ค่าเริ่มต้น traffic HTTP จาก port 8000 จะถูก forward ไปยัง `https://<vm-name>.exe.xyz`
พร้อม email auth

## การอัปเดต

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

คู่มือ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [Gateway ระยะไกล](/th/gateway/remote)
- [ภาพรวมการติดตั้ง](/th/install)
