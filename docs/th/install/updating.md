---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างขัดข้องหลังจากการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งทั่วทั้งระบบหรือจากซอร์สโค้ด) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-05-04T07:05:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

ทำให้ OpenClaw เป็นปัจจุบันอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด โดยจะตรวจจับประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor`, และรีสตาร์ต Gateway

```bash
openclaw update
```

หากต้องการสลับช่องทางหรือระบุเวอร์ชันเป้าหมาย:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` ไม่รองรับ `--verbose` สำหรับการวินิจฉัยการอัปเดต ให้ใช้
`--dry-run` เพื่อดูตัวอย่างการดำเนินการที่วางแผนไว้, `--json` สำหรับผลลัพธ์แบบมีโครงสร้าง, หรือ
`openclaw update status --json` เพื่อตรวจสอบสถานะช่องทางและความพร้อมใช้งาน ตัวติดตั้ง
มีแฟล็ก `--verbose` ของตัวเอง แต่แฟล็กนั้นไม่ได้เป็นส่วนหนึ่งของ
`openclaw update`

`--channel beta` จะเลือก beta เป็นหลัก แต่รันไทม์จะย้อนกลับไปใช้ stable/latest เมื่อ
แท็ก beta หายไปหรือเก่ากว่ารุ่น stable ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ dist-tag beta ดิบของ npm สำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
สถานะ, คอนฟิก, ข้อมูลประจำตัว, และเวิร์กสเปซของคุณไว้ใน `~/.openclaw`; โดยจะเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้เท่านั้น

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

รันพร้อม `--dry-run` ก่อนเพื่อดูตัวอย่างการสลับโหมดการติดตั้งที่แน่นอน:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

ช่องทาง `dev` จะทำให้แน่ใจว่ามี git checkout, สร้างมัน, และติดตั้ง CLI แบบ global
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแบบแพ็กเกจ หาก
Gateway ติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรชข้อมูลเมตาของบริการ
และรีสตาร์ตบริการนั้น เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้ามการเริ่มต้นใช้งาน หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังจากขั้นตอนติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า แต่จะรันการติดตั้งแพ็กเกจ
global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนไว้กับเวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm, หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

ควรใช้ `openclaw update` สำหรับการติดตั้งที่มีการควบคุมดูแล เพราะสามารถประสาน
การสลับแพ็กเกจกับบริการ Gateway ที่กำลังทำงานอยู่ได้ หากคุณอัปเดตแบบ manual ขณะที่
Gateway ที่จัดการอยู่กำลังทำงาน ให้รีสตาร์ต Gateway ทันทีหลังจากตัวจัดการแพ็กเกจ
ทำงานเสร็จ เพื่อไม่ให้โปรเซสเก่ายังคงให้บริการจากไฟล์แพ็กเกจที่ถูกแทนที่แล้ว

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global จะติดตั้งเป้าหมายลงใน
prefix npm ชั่วคราวก่อน, ตรวจสอบรายการ `dist` ที่แพ็กไว้, แล้วจึงสลับ
แผนผังแพ็กเกจที่สะอาดเข้าไปใน prefix global จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm ทับซ้อน
แพ็กเกจใหม่ลงบนไฟล์ค้างเก่าจากแพ็กเกจเดิม หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองอีกครั้งหนึ่งด้วย `--omit=optional` การลองใหม่นี้ช่วยโฮสต์ที่ dependency
แบบ optional ที่เป็น native ไม่สามารถคอมไพล์ได้ ขณะที่ยังคงแสดงความล้มเหลวเดิม
หาก fallback ก็ล้มเหลวเช่นกัน

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อขั้นสูงสำหรับการติดตั้ง npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวขณะรันไทม์ แม้ว่าไดเรกทอรีแพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม การติดตั้งแพ็กเกจ Plugin จะอยู่ในราก npm/git ที่ OpenClaw เป็นเจ้าของภายใต้ไดเรกทอรีคอนฟิกของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไขแผนผังแพ็กเกจ OpenClaw

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับรูปแบบนี้ เพราะคำสั่งติดตั้ง/อัปเดต Plugin จะเขียนนอกไดเรกทอรีแพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="Hardened systemd units">
    ให้สิทธิ์ OpenClaw เขียนไปยังรากคอนฟิก/สถานะ เพื่อให้การติดตั้ง Plugin แบบ explicit, การอัปเดต Plugin, และการล้างข้อมูลโดย doctor สามารถบันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin แบบ explicit OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์แบบ best-effort สำหรับโวลุ่มเป้าหมาย พื้นที่เหลือน้อยจะสร้างคำเตือนพร้อม path ที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ quota ของไฟล์ซิสเต็ม, snapshot, และโวลุ่มเครือข่ายอาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้งจริงด้วยตัวจัดการแพ็กเกจและการตรวจสอบหลังติดตั้งยังคงเป็นหลักฐานชี้ขาด
  </Accordion>
</AccordionGroup>

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่เป็นค่าเริ่มต้น เปิดใช้งานใน `~/.openclaw/openclaw.json`:

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

| ช่องทาง  | พฤติกรรม                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` แล้วจึงใช้การอัปเดตพร้อม jitter แบบกำหนดแน่นอนทั่ว `stableJitterHours` (การทยอยปล่อยแบบกระจาย) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และใช้การอัปเดตทันที                              |
| `dev`    | ไม่มีการใช้การอัปเดตโดยอัตโนมัติ ใช้ `openclaw update` แบบ manual                                                           |

Gateway ยังบันทึกคำใบ้การอัปเดตเมื่อเริ่มทำงานด้วย (ปิดได้ด้วย `update.checkOnStart: false`)
สำหรับการดาวน์เกรดหรือการกู้คืนจากเหตุการณ์ ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ในสภาพแวดล้อมของ Gateway เพื่อบล็อกการใช้การอัปเดตอัตโนมัติ แม้จะกำหนดค่า `update.auto.enabled` ไว้แล้วก็ตาม คำใบ้การอัปเดตตอนเริ่มทำงานยังคงรันได้ เว้นแต่ `update.checkOnStart` จะถูกปิดด้วย

การอัปเดตตัวจัดการแพ็กเกจที่ร้องขอผ่าน handler ของ control-plane ของ Gateway สด
จะบังคับให้รีสตาร์ตการอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากการสลับแพ็กเกจ
วิธีนี้หลีกเลี่ยงการทิ้งโปรเซสเก่าในหน่วยความจำไว้นานพอที่จะ lazy-load ชังก์
จากแผนผังแพ็กเกจที่ถูกแทนที่ไปแล้ว คำสั่งเชลล์ `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มีการควบคุมดูแล เพราะสามารถหยุดและ
รีสตาร์ตบริการรอบการอัปเดตได้

## หลังจากอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้ายคอนฟิก, ตรวจสอบนโยบาย DM, และตรวจสอบสุขภาพ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ต Gateway

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

หากต้องการกลับไปยังล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่านข้อความ output อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkout ตัวอัปเดตจะ bootstrap `pnpm` โดยอัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` แบบ manual (หรือเปิด `corepack` อีกครั้ง) แล้วรันการอัปเดตใหม่
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสอบสุขภาพหลังอัปเดต
- [การย้าย](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
