---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างใช้งานไม่ได้หลังจากการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบ global หรือจากซอร์ส) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-05-02T10:21:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

อัปเดต OpenClaw ให้เป็นปัจจุบันเสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด ระบบจะตรวจจับประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ท Gateway

```bash
openclaw update
```

หากต้องการสลับช่องทางหรือระบุเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # แสดงตัวอย่างโดยไม่ปรับใช้
```

`--channel beta` จะเลือก beta ก่อน แต่ runtime จะถอยกลับไปใช้ stable/latest เมื่อ
ไม่มีแท็ก beta หรือเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจครั้งเดียว

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ช่องทางเมื่อต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
สถานะ, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; มันเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้

```bash
# การติดตั้งแพ็กเกจ npm -> git checkout ที่แก้ไขได้
openclaw update --channel dev

# git checkout -> การติดตั้งแพ็กเกจ npm
openclaw update --channel stable
```

รันพร้อม `--dry-run` ก่อนเพื่อดูตัวอย่างการสลับโหมดการติดตั้งที่แน่นอน:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

ช่องทาง `dev` จะรับประกันว่ามี git checkout, build มัน และติดตั้ง global CLI
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแบบแพ็กเกจ หาก
Gateway ถูกติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรช metadata ของ service
และรีสตาร์ท เว้นแต่คุณส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังจากขั้นตอนการติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเดิม; มันจะรันการติดตั้ง
แพ็กเกจ global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนไว้ที่เวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global มันจะติดตั้ง target ลงใน
prefix npm ชั่วคราวก่อน, ตรวจสอบ inventory ของ `dist` ที่แพ็กมา แล้วจึงสลับ
ต้นไม้แพ็กเกจที่สะอาดเข้าไปใน prefix global จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm วาง
แพ็กเกจใหม่ทับไฟล์ค้างจากแพ็กเกจเก่า หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองอีกครั้งหนึ่งด้วย `--omit=optional` การลองซ้ำนี้ช่วย host ที่ native
optional dependencies คอมไพล์ไม่ได้ ขณะยังคงแสดงความล้มเหลวเดิมให้เห็น
หาก fallback ก็ล้มเหลวเช่นกัน

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อการติดตั้ง npm ขั้นสูง

<AccordionGroup>
  <Accordion title="ต้นไม้แพ็กเกจแบบอ่านอย่างเดียว">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวขณะ runtime แม้เมื่อไดเรกทอรีแพ็กเกจ global เขียนได้โดยผู้ใช้ปัจจุบัน การติดตั้งแพ็กเกจ Plugin อยู่ในราก npm/git ที่ OpenClaw เป็นเจ้าของภายใต้ไดเรกทอรี config ของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไขต้นไม้แพ็กเกจ OpenClaw

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นั้นเพราะคำสั่งติดตั้ง/อัปเดต Plugin เขียนออกนอกไดเรกทอรีแพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="หน่วย systemd ที่เสริมความแข็งแกร่ง">
    ให้ OpenClaw มีสิทธิ์เขียนไปยังราก config/state ของมัน เพื่อให้การติดตั้ง Plugin แบบชัดเจน, การอัปเดต Plugin และการ cleanup ของ doctor บันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="การตรวจสอบพื้นที่ดิสก์ล่วงหน้า">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin แบบชัดเจน OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์แบบ best-effort สำหรับ volume เป้าหมาย พื้นที่ต่ำจะสร้างคำเตือนพร้อม path ที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ filesystem quotas, snapshots และ network volumes อาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้งด้วย package-manager จริงและการตรวจสอบหลังติดตั้งยังคงเป็นแหล่งยืนยันที่ถือเป็นที่สุด
  </Accordion>
</AccordionGroup>

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่โดยค่าเริ่มต้น เปิดใช้ใน `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| ช่องทาง | พฤติกรรม                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` แล้วจึงปรับใช้พร้อม jitter แบบ deterministic ตลอดช่วง `stableJitterHours` (กระจาย rollout) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และปรับใช้ทันที                              |
| `dev`    | ไม่มีการปรับใช้อัตโนมัติ ใช้ `openclaw update` ด้วยตนเอง                                                           |

Gateway ยังบันทึก hint การอัปเดตเมื่อเริ่มต้นด้วย (ปิดได้ด้วย `update.checkOnStart: false`)
สำหรับ downgrade หรือการกู้คืนจาก incident ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการปรับใช้อัตโนมัติแม้มีการกำหนดค่า `update.auto.enabled` แล้วก็ตาม hint การอัปเดตตอนเริ่มต้นยังสามารถทำงานได้ เว้นแต่ `update.checkOnStart` จะถูกปิดด้วย

การอัปเดตผ่าน package-manager ที่ร้องขอผ่าน live Gateway control-plane handler
จะบังคับให้รีสตาร์ทการอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังการสลับแพ็กเกจ วิธีนี้
หลีกเลี่ยงการปล่อย process เก่าในหน่วยความจำไว้นานพอที่จะ lazy-load chunks
จากต้นไม้แพ็กเกจที่ถูกแทนที่แล้ว Shell `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มีการกำกับดูแล เพราะมันสามารถหยุดและ
รีสตาร์ท service รอบการอัปเดตได้

## หลังจากอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, audit นโยบาย DM และตรวจสอบสุขภาพ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ท Gateway

```bash
openclaw gateway restart
```

### ตรวจสอบ

```bash
openclaw health
```

</Steps>

## Rollback

### ตรึงเวอร์ชัน (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` แสดงเวอร์ชันที่เผยแพร่ปัจจุบัน
</Tip>

### ตรึง commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปยังล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่าน output อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkouts ตัวอัปเดตจะ auto-bootstrap `pnpm` เมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิดใช้ `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสอบสุขภาพหลังการอัปเดต
- [การย้ายเวอร์ชัน](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
