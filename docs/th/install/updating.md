---
read_when:
    - การอัปเดต OpenClaw
    - บางอย่างใช้งานไม่ได้หลังการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบโกลบอลหรือจากซอร์ส) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-05-07T01:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีที่เร็วที่สุดในการอัปเดต คำสั่งนี้จะตรวจหาประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ท Gateway

```bash
openclaw update
```

เมื่อต้องการสลับช่องทางหรือระบุเวอร์ชันเป้าหมาย:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # แสดงตัวอย่างโดยไม่ปรับใช้
```

`openclaw update` ไม่รับ `--verbose` สำหรับการวินิจฉัยการอัปเดต ให้ใช้
`--dry-run` เพื่อแสดงตัวอย่างการดำเนินการที่วางแผนไว้, `--json` สำหรับผลลัพธ์แบบมีโครงสร้าง หรือ
`openclaw update status --json` เพื่อตรวจสอบช่องทางและสถานะความพร้อมใช้งาน ตัวติดตั้ง
มีแฟล็ก `--verbose` ของตัวเอง แต่แฟล็กนั้นไม่ได้เป็นส่วนหนึ่งของ
`openclaw update`

`--channel beta` จะให้ความสำคัญกับ beta แต่ runtime จะย้อนกลับไปใช้ stable/latest เมื่อ
ไม่มีแท็ก beta หรือเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ raw npm beta dist-tag สำหรับการอัปเดตแพ็กเกจครั้งเดียว

OpenClaw ยังไม่มีช่องทางอัปเดตแบบ LTS หรือการสนับสนุนรายเดือน เรากำลัง
มุ่งไปสู่สายการสนับสนุนรายเดือนที่เข้ากันได้กับ SemVer แต่ในปัจจุบันช่องทางที่รองรับ
ยังคงเป็น `stable`, `beta` และ `dev`

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
สถานะ, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; โดยเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้

```bash
# ติดตั้งแพ็กเกจ npm -> เช็กเอาต์ git ที่แก้ไขได้
openclaw update --channel dev

# เช็กเอาต์ git -> ติดตั้งแพ็กเกจ npm
openclaw update --channel stable
```

รันพร้อม `--dry-run` ก่อนเพื่อแสดงตัวอย่างการสลับโหมดการติดตั้งแบบละเอียด:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

ช่องทาง `dev` จะทำให้มีการเช็กเอาต์ git, build และติดตั้ง global CLI
จากเช็กเอาต์นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแบบแพ็กเกจ หาก
ติดตั้ง Gateway ไว้แล้ว `openclaw update` จะรีเฟรช service metadata
และรีสตาร์ท เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังขั้นตอนการติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า แต่จะรันการติดตั้ง
แพ็กเกจ global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปแล้วบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนไว้ที่เวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm หรือ bun แบบแมนนวล

```bash
npm i -g openclaw@latest
```

แนะนำให้ใช้ `openclaw update` สำหรับการติดตั้งที่มีการควบคุม เพราะสามารถประสาน
การสลับแพ็กเกจกับบริการ Gateway ที่กำลังทำงานอยู่ได้ หากคุณอัปเดตด้วยตนเองขณะที่
Gateway ที่มีการจัดการกำลังทำงาน ให้รีสตาร์ท Gateway ทันทีหลังจาก package
manager ทำงานเสร็จ เพื่อไม่ให้โปรเซสเก่ายังคงให้บริการจากไฟล์แพ็กเกจ
ที่ถูกแทนที่แล้ว

เมื่อ `openclaw update` จัดการการติดตั้ง global npm คำสั่งจะติดตั้งเป้าหมายลงใน
npm prefix ชั่วคราวก่อน ตรวจสอบ packaged `dist` inventory แล้วจึงสลับ
package tree ที่สะอาดเข้าไปใน global prefix จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm วาง
แพ็กเกจใหม่ทับไฟล์ค้างจากแพ็กเกจเก่า หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองซ้ำหนึ่งครั้งด้วย `--omit=optional` การลองซ้ำนี้ช่วยโฮสต์ที่ native
optional dependencies คอมไพล์ไม่ได้ ขณะที่ยังคงแสดงข้อผิดพลาดเดิม
หาก fallback ก็ล้มเหลวเช่นกัน

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อขั้นสูงเกี่ยวกับการติดตั้ง npm

<AccordionGroup>
  <Accordion title="Package tree แบบอ่านอย่างเดียว">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่าไดเรกทอรีแพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม การติดตั้งแพ็กเกจ Plugin จะอยู่ใน npm/git roots ที่ OpenClaw เป็นเจ้าของภายใต้ไดเรกทอรี config ของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไข package tree ของ OpenClaw

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับรูปแบบนี้เพราะคำสั่งติดตั้ง/อัปเดต Plugin จะเขียนภายนอกไดเรกทอรีแพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="systemd units ที่เพิ่มความแข็งแกร่ง">
    ให้สิทธิ์เขียนแก่ OpenClaw ไปยัง config/state roots เพื่อให้การติดตั้ง Plugin แบบชัดเจน, การอัปเดต Plugin และ doctor cleanup สามารถบันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="การตรวจสอบพื้นที่ดิสก์ล่วงหน้า">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin แบบชัดเจน OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์สำหรับโวลุ่มเป้าหมายแบบดีที่สุดเท่าที่ทำได้ พื้นที่น้อยจะแสดงคำเตือนพร้อมพาธที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะโควตาไฟล์ระบบ, snapshots และโวลุ่มเครือข่ายอาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้งโดย package-manager จริงและการตรวจสอบหลังติดตั้งยังคงเป็นสิ่งที่มีอำนาจตัดสิน
  </Accordion>
</AccordionGroup>

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่โดยค่าเริ่มต้น เปิดใช้งานใน `~/.openclaw/openclaw.json`:

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

| ช่องทาง | ลักษณะการทำงาน                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` จากนั้นปรับใช้พร้อม jitter แบบกำหนดได้ซ้ำได้ภายใน `stableJitterHours` (การปล่อยใช้งานแบบกระจาย) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และปรับใช้ทันที                              |
| `dev`    | ไม่มีการปรับใช้อัตโนมัติ ใช้ `openclaw update` ด้วยตนเอง                                                           |

Gateway ยังบันทึกคำแนะนำการอัปเดตเมื่อเริ่มต้นด้วย (ปิดด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืนจากเหตุการณ์ ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ในสภาพแวดล้อมของ Gateway เพื่อบล็อกการปรับใช้อัตโนมัติแม้จะตั้งค่า `update.auto.enabled` แล้วก็ตาม คำแนะนำการอัปเดตตอนเริ่มต้นยังสามารถทำงานได้ เว้นแต่จะปิด `update.checkOnStart` ด้วย

การอัปเดตผ่าน package-manager ที่ร้องขอผ่านตัวจัดการ live Gateway control-plane
จะบังคับให้รีสตาร์ทการอัปเดตแบบไม่เลื่อนและไม่มี cooldown หลังการสลับแพ็กเกจ วิธีนี้
หลีกเลี่ยงการปล่อยให้โปรเซสเก่าในหน่วยความจำค้างอยู่นานพอที่จะ lazy-load chunks
จาก package tree ที่ถูกแทนที่แล้ว Shell `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มีการควบคุม เพราะสามารถหยุดและ
รีสตาร์ทบริการรอบการอัปเดตได้

## หลังอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, ตรวจสอบ DM policies และตรวจสุขภาพ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ท Gateway

```bash
openclaw gateway restart
```

### ตรวจสอบ

```bash
openclaw health
```

</Steps>

## ย้อนกลับ

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

หากต้องการกลับไปยังเวอร์ชันล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่านผลลัพธ์อย่างรอบคอบ
- สำหรับ `openclaw update --channel dev` บน source checkouts ตัวอัปเดตจะ bootstrap `pnpm` อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาดเกี่ยวกับ pnpm/corepack bootstrap ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิดใช้ `corepack` อีกครั้ง) แล้วรันการอัปเดตใหม่
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการอัปเดต
- [การย้ายระบบ](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
