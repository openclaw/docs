---
read_when:
    - คุณกำลังปรับใช้ OpenClaw บน VM บนคลาวด์ด้วย Docker
    - คุณต้องใช้กระบวนการเตรียมไบนารีที่ใช้ร่วมกัน การคงอยู่ของข้อมูล และขั้นตอนการอัปเดต
summary: ขั้นตอนรันไทม์ Docker VM ที่ใช้ร่วมกันสำหรับโฮสต์ OpenClaw Gateway ที่ใช้งานระยะยาว
title: รันไทม์ Docker VM
x-i18n:
    generated_at: "2026-04-30T09:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

ขั้นตอนรันไทม์ร่วมสำหรับการติดตั้ง Docker บน VM เช่น GCP, Hetzner และผู้ให้บริการ VPS ลักษณะเดียวกัน

## ฝังไบนารีที่จำเป็นไว้ในอิมเมจ

การติดตั้งไบนารีภายในคอนเทนเนอร์ที่กำลังรันอยู่เป็นกับดัก
สิ่งใดก็ตามที่ติดตั้งตอนรันไทม์จะหายไปเมื่อรีสตาร์ท

ไบนารีภายนอกทั้งหมดที่ Skills ต้องใช้ต้องถูกติดตั้งตอนสร้างอิมเมจ

ตัวอย่างด้านล่างแสดงไบนารีทั่วไปสามรายการเท่านั้น:

- `gog` (จาก `gogcli`) สำหรับการเข้าถึง Gmail
- `goplaces` สำหรับ Google Places
- `wacli` สำหรับ WhatsApp

รายการเหล่านี้เป็นตัวอย่าง ไม่ใช่รายการทั้งหมด
คุณสามารถติดตั้งไบนารีได้มากเท่าที่จำเป็นโดยใช้รูปแบบเดียวกัน

หากคุณเพิ่ม Skills ใหม่ในภายหลังซึ่งพึ่งพาไบนารีเพิ่มเติม คุณต้อง:

1. อัปเดต Dockerfile
2. สร้างอิมเมจใหม่
3. รีสตาร์ทคอนเทนเนอร์

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
URL ข้างต้นเป็นตัวอย่าง สำหรับ VM ที่ใช้ ARM ให้เลือกแอสเซต `arm64` สำหรับบิลด์ที่ทำซ้ำได้ ให้ตรึง URL รุ่นเผยแพร่แบบระบุเวอร์ชัน
</Note>

## สร้างและเริ่มใช้งาน

```bash
docker compose build
docker compose up -d openclaw-gateway
```

หากการบิลด์ล้มเหลวด้วย `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แสดงว่า VM มีหน่วยความจำไม่พอ
ใช้คลาสเครื่องที่ใหญ่ขึ้นก่อนลองใหม่

ตรวจสอบไบนารี:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

เอาต์พุตที่คาดหวัง:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

ตรวจสอบ Gateway:

```bash
docker compose logs -f openclaw-gateway
```

เอาต์พุตที่คาดหวัง:

```
[gateway] listening on ws://0.0.0.0:18789
```

## สิ่งใดคงอยู่ที่ใด

OpenClaw รันใน Docker แต่ Docker ไม่ใช่แหล่งข้อมูลหลัก
สถานะที่ใช้งานระยะยาวทั้งหมดต้องคงอยู่หลังการรีสตาร์ท การสร้างใหม่ และการรีบูต

| ส่วนประกอบ | ตำแหน่ง | กลไกการคงอยู่ | หมายเหตุ |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| การกำหนดค่า Gateway | `/home/node/.openclaw/` | เมานต์โวลุ่มโฮสต์ | รวม `openclaw.json`, `.env` |
| โปรไฟล์การยืนยันตัวตนโมเดล | `/home/node/.openclaw/agents/` | เมานต์โวลุ่มโฮสต์ | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| การกำหนดค่า Skill | `/home/node/.openclaw/skills/` | เมานต์โวลุ่มโฮสต์ | สถานะระดับ Skill |
| พื้นที่ทำงานของเอเจนต์ | `/home/node/.openclaw/workspace/` | เมานต์โวลุ่มโฮสต์ | โค้ดและอาร์ติแฟกต์ของเอเจนต์ |
| เซสชัน WhatsApp | `/home/node/.openclaw/` | เมานต์โวลุ่มโฮสต์ | เก็บการเข้าสู่ระบบด้วย QR ไว้ |
| คีย์ริง Gmail | `/home/node/.openclaw/` | โวลุ่มโฮสต์ + รหัสผ่าน | ต้องใช้ `GOG_KEYRING_PASSWORD` |
| การพึ่งพารันไทม์ของ Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | โวลุ่มที่ตั้งชื่อใน Docker | การพึ่งพา Plugin ที่บันเดิลที่สร้างขึ้นและมิเรอร์รันไทม์ |
| ไบนารีภายนอก | `/usr/local/bin/` | อิมเมจ Docker | ต้องฝังไว้ตอนสร้าง |
| รันไทม์ Node | ระบบไฟล์คอนเทนเนอร์ | อิมเมจ Docker | สร้างใหม่ทุกครั้งที่สร้างอิมเมจ |
| แพ็กเกจ OS | ระบบไฟล์คอนเทนเนอร์ | อิมเมจ Docker | อย่าติดตั้งตอนรันไทม์ |
| คอนเทนเนอร์ Docker | ชั่วคราว | รีสตาร์ทได้ | ทำลายทิ้งได้อย่างปลอดภัย |

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
