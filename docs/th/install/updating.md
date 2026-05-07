---
read_when:
    - การอัปเดต OpenClaw
    - บางอย่างใช้งานไม่ได้หลังจากการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบโกลบอลหรือจากซอร์สโค้ด) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-05-07T13:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด โดยจะตรวจจับประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ท Gateway

```bash
openclaw update
```

หากต้องการสลับแชนเนลหรือระบุเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` ไม่รับ `--verbose` สำหรับการวินิจฉัยการอัปเดต ให้ใช้
`--dry-run` เพื่อดูตัวอย่างการดำเนินการที่วางแผนไว้, `--json` สำหรับผลลัพธ์แบบมีโครงสร้าง หรือ
`openclaw update status --json` เพื่อตรวจสอบสถานะแชนเนลและความพร้อมใช้งาน
ตัวติดตั้งมีแฟล็ก `--verbose` ของตัวเอง แต่แฟล็กนั้นไม่ได้เป็นส่วนหนึ่งของ
`openclaw update`

`--channel beta` จะให้ความสำคัญกับ beta แต่ runtime จะ fallback ไปยัง stable/latest เมื่อ
ไม่มีแท็ก beta หรือแท็กนั้นเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag ดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [แชนเนลสำหรับการพัฒนา](/th/install/development-channels) สำหรับความหมายของแชนเนล

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้แชนเนลเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะคง
state, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; โดยจะเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้

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

แชนเนล `dev` จะตรวจให้แน่ใจว่ามี git checkout, build มัน และติดตั้ง global CLI
จาก checkout นั้น แชนเนล `stable` และ `beta` ใช้การติดตั้งแบบแพ็กเกจ หาก
ติดตั้ง Gateway ไว้อยู่แล้ว `openclaw update` จะรีเฟรช metadata ของบริการ
และรีสตาร์ท เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังจากขั้นตอนการติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า แต่จะรันการติดตั้ง
แพ็กเกจแบบ global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการ pin การกู้คืนไปยังเวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm หรือ bun แบบแมนนวล

```bash
npm i -g openclaw@latest
```

แนะนำให้ใช้ `openclaw update` สำหรับการติดตั้งที่มีการควบคุม เพราะสามารถประสาน
การสลับแพ็กเกจกับบริการ Gateway ที่กำลังทำงานอยู่ได้ หากคุณอัปเดตแบบแมนนวลขณะที่
Gateway ที่จัดการอยู่กำลังทำงาน ให้รีสตาร์ท Gateway ทันทีหลังจาก package
manager ทำงานเสร็จ เพื่อไม่ให้ process เก่ายังให้บริการจากไฟล์แพ็กเกจที่ถูกแทนที่แล้ว

เมื่อ `openclaw update` จัดการการติดตั้ง global npm มันจะติดตั้งเป้าหมายลงใน
npm prefix ชั่วคราวก่อน, ตรวจสอบ inventory ของ `dist` ที่แพ็กมา แล้วจึงสลับ
package tree ที่สะอาดเข้าไปยัง global prefix จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm overlay
แพ็กเกจใหม่ทับไฟล์ค้างจากแพ็กเกจเก่า หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองซ้ำหนึ่งครั้งพร้อม `--omit=optional` การลองซ้ำนั้นช่วยโฮสต์ที่
native optional dependencies คอมไพล์ไม่ได้ ขณะยังคงแสดงความล้มเหลวเดิม
หาก fallback ก็ล้มเหลวเช่นกัน

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อการติดตั้ง npm ขั้นสูง

<AccordionGroup>
  <Accordion title="Package tree แบบอ่านอย่างเดียว">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่าไดเรกทอรีแพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม การติดตั้งแพ็กเกจ Plugin จะอยู่ใน npm/git roots ที่ OpenClaw เป็นเจ้าของใต้ไดเรกทอรี config ของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไข package tree ของ OpenClaw

    การตั้งค่า npm บางแบบบน Linux ติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับเลย์เอาต์นั้น เพราะคำสั่งติดตั้ง/อัปเดต Plugin จะเขียนนอกไดเรกทอรีแพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="systemd units ที่เสริมความแข็งแรง">
    ให้ OpenClaw มีสิทธิ์เขียนไปยัง roots ของ config/state เพื่อให้การติดตั้ง Plugin แบบ explicit, การอัปเดต Plugin และการ cleanup ของ doctor สามารถบันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="การตรวจพื้นที่ดิสก์ล่วงหน้า">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin แบบ explicit OpenClaw จะพยายามตรวจพื้นที่ดิสก์แบบ best-effort สำหรับ volume เป้าหมาย พื้นที่ต่ำจะสร้างคำเตือนพร้อม path ที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ filesystem quotas, snapshots และ network volumes อาจเปลี่ยนแปลงได้หลังการตรวจ การติดตั้งของ package-manager จริงและการตรวจสอบหลังติดตั้งยังคงเป็นหลักฐานชี้ขาด
  </Accordion>
</AccordionGroup>

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่ตามค่าเริ่มต้น เปิดใช้งานใน `~/.openclaw/openclaw.json`:

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

| แชนเนล  | พฤติกรรม                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` จากนั้นนำไปใช้พร้อม jitter แบบกำหนดแน่นอนทั่ว `stableJitterHours` (การ rollout แบบกระจาย) |
| `beta`   | ตรวจทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และนำไปใช้ทันที                              |
| `dev`    | ไม่มีการนำไปใช้โดยอัตโนมัติ ใช้ `openclaw update` แบบแมนนวล                                                           |

Gateway ยังบันทึก hint การอัปเดตตอนเริ่มต้นด้วย (ปิดด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืนจากเหตุการณ์ ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการนำไปใช้อัตโนมัติ แม้จะกำหนดค่า `update.auto.enabled` ไว้ก็ตาม hint การอัปเดตตอนเริ่มต้นยังคงรันได้ เว้นแต่จะปิด `update.checkOnStart` ด้วย

การอัปเดตผ่าน package-manager ที่ร้องขอผ่าน handler ของ live Gateway control-plane
จะบังคับให้รีสตาร์ทการอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากสลับแพ็กเกจ
วิธีนี้หลีกเลี่ยงการปล่อยให้ process เก่าในหน่วยความจำอยู่นานพอที่จะ lazy-load chunks
จาก package tree ที่ถูกแทนที่ไปแล้ว Shell `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มีการควบคุม เพราะสามารถหยุดและ
รีสตาร์ทบริการรอบการอัปเดตได้

## หลังจากอัปเดต

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

### Pin เวอร์ชัน (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` แสดงเวอร์ชันที่เผยแพร่ปัจจุบัน
</Tip>

### Pin commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปยังล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่าน output อย่างรอบคอบ
- สำหรับ `openclaw update --channel dev` บน source checkouts ตัวอัปเดตจะ bootstrap `pnpm` ให้อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` แบบแมนนวล (หรือเปิดใช้งาน `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการอัปเดต
- [การย้ายเวอร์ชัน](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
