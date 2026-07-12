---
read_when:
    - คุณกำลังปรับใช้ OpenClaw บน VM ระบบคลาวด์ด้วย Docker
    - คุณต้องใช้โฟลว์ร่วมสำหรับการสร้างไบนารี การเก็บข้อมูลถาวร และการอัปเดต
summary: ขั้นตอนรันไทม์ของ VM Docker ที่ใช้ร่วมกันสำหรับโฮสต์ Gateway ของ OpenClaw ที่ทำงานระยะยาว
title: รันไทม์ VM ของ Docker
x-i18n:
    generated_at: "2026-07-12T16:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

ขั้นตอนรันไทม์ร่วมกันสำหรับการติดตั้ง Docker บน VM เช่น GCP, Hetzner และผู้ให้บริการ VPS ที่คล้ายกัน

## ฝังไบนารีที่จำเป็นลงในอิมเมจ

การติดตั้งไบนารีภายในคอนเทนเนอร์ที่กำลังทำงานเป็นกับดัก เพราะทุกอย่างที่ติดตั้ง
ขณะรันไทม์จะหายไปเมื่อรีสตาร์ต ให้ฝังไบนารีภายนอกทั้งหมดที่ Skills ต้องใช้
ลงในอิมเมจในขั้นตอนการสร้าง

ตัวอย่างด้านล่างครอบคลุมไบนารีเพียงสามรายการ โดยเรียงตามตัวอักษร:

- `gog` (จาก `gogcli`) สำหรับเข้าถึง Gmail
- `goplaces` สำหรับ Google Places
- `wacli` สำหรับ WhatsApp

รายการเหล่านี้เป็นเพียงตัวอย่าง ไม่ใช่รายการทั้งหมด ให้ติดตั้งไบนารีมากเท่าที่
Skills ของคุณต้องใช้โดยใช้รูปแบบเดียวกัน เมื่อคุณเพิ่ม Skills ที่ต้องใช้
ไบนารีใหม่ในภายหลัง:

1. อัปเดต Dockerfile
2. สร้างอิมเมจใหม่
3. รีสตาร์ตคอนเทนเนอร์

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
URL ข้างต้นเป็นเพียงตัวอย่าง สำหรับ VM ที่ใช้สถาปัตยกรรม ARM ให้เลือกแอสเซ็ต `arm64` หากต้องการให้การสร้างทำซ้ำได้อย่างแน่นอน ให้ตรึง URL ของรีลีสที่ระบุเวอร์ชัน
</Note>

## สร้างและเริ่มทำงาน

```bash
docker compose build
docker compose up -d openclaw-gateway
```

หากการสร้างล้มเหลวด้วยข้อความ `Killed` หรือรหัสออก 137 ระหว่าง `pnpm install --frozen-lockfile` แสดงว่า VM มีหน่วยความจำไม่เพียงพอ ให้ใช้เครื่องระดับที่ใหญ่ขึ้นก่อนลองอีกครั้ง

ตรวจสอบไบนารี:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

ผลลัพธ์ที่คาดไว้:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

ตรวจสอบว่า Gateway ทำงานอยู่:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

การที่ `/healthz` ตอบกลับด้วยสถานะ 200 ยืนยันว่าโพรเซส Gateway กำลังรับฟังและทำงานปกติ ส่วน `HEALTHCHECK` ที่มีมาในอิมเมจจะตรวจสอบปลายทางเดียวกันเป็นระยะ

## สิ่งใดจัดเก็บถาวรไว้ที่ใด

OpenClaw ทำงานใน Docker แต่ Docker ไม่ใช่แหล่งข้อมูลหลัก สถานะทั้งหมดที่ต้องเก็บระยะยาวต้องคงอยู่ได้หลังการรีสตาร์ต การสร้างใหม่ และการเริ่มระบบใหม่

| องค์ประกอบ              | ตำแหน่ง                                               | กลไกการจัดเก็บถาวร  | หมายเหตุ                                                                                                               |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| การกำหนดค่า Gateway         | `/home/node/.openclaw/`                                | การเมานต์โวลุ่มจากโฮสต์      | รวม `openclaw.json`                                                                                            |
| ข้อมูลประจำตัวของช่องทาง/ผู้ให้บริการ | `/home/node/.openclaw/credentials/`                    | การเมานต์โวลุ่มจากโฮสต์      | ข้อมูลประจำตัวของช่องทางและผู้ให้บริการ                                                                            |
| โปรไฟล์การยืนยันตัวตนของโมเดล    | `/home/node/.openclaw/agents/`                         | การเมานต์โวลุ่มจากโฮสต์      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, คีย์ API)                                                       |
| ไฟล์คีย์ OAuth แบบเดิม  | `/home/node/.config/openclaw/`                         | การเมานต์โวลุ่มจากโฮสต์      | รองรับความเข้ากันได้แบบอ่านอย่างเดียวสำหรับไฟล์เสริม OAuth ก่อนการย้ายข้อมูล โดย `openclaw doctor --fix` จะย้ายข้อมูลเหล่านี้ไปยัง `auth-profiles.json` |
| การกำหนดค่า Skills          | `/home/node/.openclaw/skills/`                         | การเมานต์โวลุ่มจากโฮสต์      | สถานะระดับ Skills                                                                                                   |
| พื้นที่ทำงานของเอเจนต์        | `/home/node/.openclaw/workspace/`                      | การเมานต์โวลุ่มจากโฮสต์      | โค้ดและอาร์ติแฟกต์ของเอเจนต์                                                                                            |
| เซสชัน WhatsApp       | `/home/node/.openclaw/`                                | การเมานต์โวลุ่มจากโฮสต์      | เก็บสถานะการเข้าสู่ระบบด้วย QR                                                                                                  |
| พวงกุญแจ Gmail          | `/home/node/.openclaw/`                                | โวลุ่มจากโฮสต์ + รหัสผ่าน | ต้องใช้ `GOG_KEYRING_PASSWORD`                                                                                     |
| แพ็กเกจ Plugin        | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | การเมานต์โวลุ่มจากโฮสต์      | ตำแหน่งรากของแพ็กเกจ Plugin ที่ดาวน์โหลดได้                                                                                   |
| ไบนารีภายนอก      | `/usr/local/bin/`                                      | อิมเมจ Docker           | ต้องฝังลงในอิมเมจระหว่างการสร้าง                                                                                         |
| รันไทม์ Node           | ระบบไฟล์ของคอนเทนเนอร์                                   | อิมเมจ Docker           | สร้างใหม่ทุกครั้งที่สร้างอิมเมจ                                                                                           |
| แพ็กเกจระบบปฏิบัติการ            | ระบบไฟล์ของคอนเทนเนอร์                                   | อิมเมจ Docker           | ห้ามติดตั้งขณะรันไทม์                                                                                           |
| คอนเทนเนอร์ Docker       | ชั่วคราว                                              | รีสตาร์ตได้            | ทำลายได้อย่างปลอดภัย                                                                                                     |

## การอัปเดต

เมื่อต้องการอัปเดต OpenClaw บน VM:

```bash
git pull
docker compose build
docker compose up -d
```

## เนื้อหาที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Podman](/th/install/podman)
- [ClawDock](/th/install/clawdock)
