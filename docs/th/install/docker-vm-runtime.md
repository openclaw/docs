---
read_when:
    - คุณกำลังปรับใช้ OpenClaw บน VM บนคลาวด์ด้วย Docker
    - คุณต้องใช้กระบวนการร่วมสำหรับการสร้างไบนารี การคงอยู่ และการอัปเดต
summary: ขั้นตอนรันไทม์ Docker VM แบบใช้ร่วมกันสำหรับโฮสต์ OpenClaw Gateway ที่ทำงานระยะยาว
title: รันไทม์ VM ของ Docker
x-i18n:
    generated_at: "2026-05-02T10:20:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

ขั้นตอน runtime ที่ใช้ร่วมกันสำหรับการติดตั้ง Docker บน VM เช่น GCP, Hetzner และผู้ให้บริการ VPS ที่คล้ายกัน

## ฝัง binary ที่จำเป็นไว้ใน image

การติดตั้ง binary ภายใน container ที่กำลังทำงานอยู่เป็นกับดัก
ทุกอย่างที่ติดตั้งตอน runtime จะหายไปเมื่อ restart

binary ภายนอกทั้งหมดที่ Skills ต้องใช้ต้องติดตั้งตอน build image

ตัวอย่างด้านล่างแสดง binary ทั่วไปเพียงสามรายการ:

- `gog` (จาก `gogcli`) สำหรับเข้าถึง Gmail
- `goplaces` สำหรับ Google Places
- `wacli` สำหรับ WhatsApp

รายการเหล่านี้เป็นตัวอย่าง ไม่ใช่รายการที่ครบถ้วน
คุณสามารถติดตั้ง binary ได้มากเท่าที่ต้องการโดยใช้รูปแบบเดียวกัน

หากคุณเพิ่ม Skills ใหม่ในภายหลังที่ต้องพึ่งพา binary เพิ่มเติม คุณต้อง:

1. อัปเดต Dockerfile
2. build image ใหม่
3. restart containers

**ตัวอย่าง Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
URL ด้านบนเป็นตัวอย่าง สำหรับ VM ที่ใช้ ARM ให้เลือก asset `arm64` สำหรับ build ที่ทำซ้ำได้ ให้ pin URL ของ release ที่ระบุเวอร์ชันไว้
</Note>

## Build และ launch

```bash
docker compose build
docker compose up -d openclaw-gateway
```

หาก build ล้มเหลวด้วย `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แสดงว่า VM มีหน่วยความจำไม่พอ
ใช้ machine class ที่ใหญ่ขึ้นก่อนลองอีกครั้ง

ตรวจสอบ binary:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

ผลลัพธ์ที่คาดหวัง:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

ตรวจสอบ Gateway:

```bash
docker compose logs -f openclaw-gateway
```

ผลลัพธ์ที่คาดหวัง:

```
[gateway] listening on ws://0.0.0.0:18789
```

## สิ่งใดคงอยู่ที่ไหน

OpenClaw ทำงานใน Docker แต่ Docker ไม่ใช่แหล่งข้อมูลจริง
สถานะที่ต้องคงอยู่ในระยะยาวทั้งหมดต้องรอดจากการ restart, rebuild และ reboot

| องค์ประกอบ           | ตำแหน่ง                                                | กลไกการคงอยู่          | หมายเหตุ                                                      |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| การกำหนดค่า Gateway | `/home/node/.openclaw/`                                | host volume mount      | รวม `openclaw.json`, `.env`                                   |
| โปรไฟล์ auth ของโมเดล | `/home/node/.openclaw/agents/`                         | host volume mount      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| การกำหนดค่า Skill    | `/home/node/.openclaw/skills/`                         | host volume mount      | สถานะระดับ Skill                                              |
| workspace ของ agent | `/home/node/.openclaw/workspace/`                      | host volume mount      | โค้ดและ artifact ของ agent                                    |
| session ของ WhatsApp | `/home/node/.openclaw/`                                | host volume mount      | เก็บการ login ด้วย QR ไว้                                     |
| keyring ของ Gmail    | `/home/node/.openclaw/`                                | host volume + password | ต้องใช้ `GOG_KEYRING_PASSWORD`                                |
| package ของ Plugin   | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | host volume mount      | root ของ package Plugin ที่ดาวน์โหลดได้                       |
| binary ภายนอก        | `/usr/local/bin/`                                      | Docker image           | ต้องฝังไว้ตอน build                                           |
| Node runtime         | filesystem ของ container                              | Docker image           | build ใหม่ทุกครั้งที่ build image                             |
| package ของ OS       | filesystem ของ container                              | Docker image           | อย่าติดตั้งตอน runtime                                        |
| Docker container     | ชั่วคราว                                               | restart ได้            | ทำลายทิ้งได้อย่างปลอดภัย                                      |

## การอัปเดต

หากต้องการอัปเดต OpenClaw บน VM:

```bash
git pull
docker compose build
docker compose up -d
```

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Podman](/th/install/podman)
- [ClawDock](/th/install/clawdock)
