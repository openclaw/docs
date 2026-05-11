---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างใช้งานไม่ได้หลังการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งทั้งระบบหรือจากซอร์สโค้ด) พร้อมกลยุทธ์การย้อนกลับ
title: กำลังอัปเดต
x-i18n:
    generated_at: "2026-05-11T20:32:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดเสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด โดยจะตรวจหาประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ท Gateway

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

`openclaw update` ไม่รับ `--verbose` สำหรับการวินิจฉัยการอัปเดต ให้ใช้
`--dry-run` เพื่อดูตัวอย่างการดำเนินการที่วางแผนไว้, `--json` สำหรับผลลัพธ์แบบมีโครงสร้าง หรือ
`openclaw update status --json` เพื่อตรวจสอบสถานะช่องทางและความพร้อมใช้งาน
ตัวติดตั้งมีแฟล็ก `--verbose` ของตัวเอง แต่แฟล็กนั้นไม่ใช่ส่วนหนึ่งของ
`openclaw update`

`--channel beta` จะให้ความสำคัญกับ beta แต่ runtime จะถอยกลับไปใช้ stable/latest เมื่อ
ไม่มีแท็ก beta หรือแท็กนั้นเก่ากว่ารุ่น stable ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจครั้งเดียว

สำหรับ Plugin ที่มีการจัดการ การถอยกลับของช่องทาง beta จะเป็นคำเตือน: การอัปเดต core ยัง
สำเร็จได้ในขณะที่ Plugin ใช้รุ่น default/latest ที่บันทึกไว้ เพราะไม่มี
Plugin beta ให้ใช้

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
สถานะ, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; โดยจะเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้เท่านั้น

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

รันด้วย `--dry-run` ก่อนเพื่อดูตัวอย่างการสลับโหมดการติดตั้งที่แน่นอน:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

ช่องทาง `dev` จะรับประกันว่ามี git checkout, build และติดตั้ง CLI แบบ global
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแบบแพ็กเกจ หาก
Gateway ติดตั้งไว้แล้ว `openclaw update` จะรีเฟรช metadata ของ service
และรีสตาร์ท เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือกอื่น: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังจากขั้นตอนการติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า แต่จะรันการติดตั้ง
แพ็กเกจ global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนไว้กับเวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือกอื่น: npm, pnpm หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

ควรใช้ `openclaw update` สำหรับการติดตั้งที่มีการกำกับดูแล เพราะสามารถประสาน
การสลับแพ็กเกจกับ service Gateway ที่กำลังทำงานอยู่ได้ หากคุณอัปเดตแบบ manual ขณะที่
Gateway ที่มีการจัดการกำลังทำงานอยู่ ให้รีสตาร์ท Gateway ทันทีหลังจาก package
manager เสร็จสิ้น เพื่อไม่ให้โปรเซสเก่ายังคงให้บริการจากไฟล์แพ็กเกจที่ถูกแทนที่แล้ว

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global จะติดตั้งเป้าหมายลงใน
npm prefix ชั่วคราวก่อน ตรวจสอบ inventory ของ `dist` ที่แพ็กมา แล้วจึงสลับ
package tree ที่สะอาดเข้าไปใน global prefix จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm ซ้อน
แพ็กเกจใหม่ทับไฟล์ค้างจากแพ็กเกจเก่า หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองอีกครั้งหนึ่งด้วย `--omit=optional` การลองซ้ำนั้นช่วย host ที่ native
optional dependencies คอมไพล์ไม่ได้ ขณะที่ยังคงแสดงข้อผิดพลาดเดิมให้เห็น
หาก fallback ก็ล้มเหลวด้วย

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อขั้นสูงเกี่ยวกับการติดตั้ง npm

<AccordionGroup>
  <Accordion title="package tree แบบอ่านอย่างเดียว">
    OpenClaw ถือว่าการติดตั้งแบบ global ที่แพ็กมาเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่าไดเรกทอรีแพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบัน การติดตั้งแพ็กเกจ Plugin จะอยู่ใน root npm/git ที่ OpenClaw เป็นเจ้าของภายใต้ไดเรกทอรี config ของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไข package tree ของ OpenClaw

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นั้นเพราะคำสั่งติดตั้ง/อัปเดต Plugin จะเขียนภายนอกไดเรกทอรีแพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="systemd units ที่เพิ่มความแข็งแกร่ง">
    ให้สิทธิ์เขียนแก่ OpenClaw สำหรับ root ของ config/state เพื่อให้การติดตั้ง Plugin แบบ explicit, การอัปเดต Plugin และการล้างข้อมูลของ doctor สามารถบันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="การตรวจสอบพื้นที่ดิสก์ล่วงหน้า">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin แบบ explicit OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์ของ volume เป้าหมายแบบ best-effort พื้นที่เหลือน้อยจะแสดงคำเตือนพร้อม path ที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ quota ของ filesystem, snapshot และ network volume อาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้งของ package-manager จริงและการตรวจสอบหลังติดตั้งยังคงเป็นแหล่งอ้างอิงที่เชื่อถือได้
  </Accordion>
</AccordionGroup>

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่โดย default เปิดใช้งานใน `~/.openclaw/openclaw.json`:

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

| ช่องทาง | พฤติกรรม |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` จากนั้นนำไปใช้พร้อม jitter แบบ deterministic ตลอดช่วง `stableJitterHours` (การ rollout แบบกระจาย) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (default: รายชั่วโมง) และนำไปใช้ทันที |
| `dev`    | ไม่มีการนำไปใช้อัตโนมัติ ใช้ `openclaw update` แบบ manual |

Gateway ยังบันทึกคำแนะนำการอัปเดตเมื่อเริ่มต้นด้วย (ปิดได้ด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืนจาก incident ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการนำไปใช้อัตโนมัติ แม้จะกำหนดค่า `update.auto.enabled` ไว้แล้วก็ตาม คำแนะนำการอัปเดตตอนเริ่มต้นยังคงรันได้ เว้นแต่จะปิด `update.checkOnStart` ด้วย

การอัปเดตผ่าน package-manager ที่ร้องขอผ่าน live Gateway control-plane handler
จะบังคับการรีสตาร์ทอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากสลับแพ็กเกจ
วิธีนี้หลีกเลี่ยงการปล่อยโปรเซสเก่าในหน่วยความจำไว้นานพอที่จะ lazy-load chunks
จาก package tree ที่ถูกแทนที่แล้ว Shell `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มีการกำกับดูแล เพราะสามารถหยุดและ
รีสตาร์ท service ระหว่างการอัปเดตได้

## หลังอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, audit นโยบาย DM และตรวจสุขภาพ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

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
`npm view openclaw version` แสดงเวอร์ชันที่เผยแพร่อยู่ในปัจจุบัน
</Tip>

### ตรึง commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปใช้ล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่านผลลัพธ์อย่างรอบคอบ
- สำหรับ `openclaw update --channel dev` บน source checkout ตัวอัปเดตจะ bootstrap `pnpm` อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` แบบ manual (หรือเปิดใช้ `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังอัปเดต
- [การย้ายเวอร์ชัน](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
