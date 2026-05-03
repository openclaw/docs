---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างใช้งานไม่ได้หลังจากอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (ติดตั้งแบบโกลบอลหรือจากซอร์ส) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-05-03T21:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

อัปเดต OpenClaw ให้เป็นปัจจุบันอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด คำสั่งนี้ตรวจหาประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor`, และรีสตาร์ต Gateway

```bash
openclaw update
```

หากต้องการสลับช่องทางหรือตั้งเป้าเป็นเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` ไม่รับ `--verbose` สำหรับการวินิจฉัยการอัปเดต ให้ใช้
`--dry-run` เพื่อดูตัวอย่างการดำเนินการที่วางแผนไว้, `--json` สำหรับผลลัพธ์แบบมีโครงสร้าง, หรือ
`openclaw update status --json` เพื่อตรวจสอบสถานะช่องทางและความพร้อมใช้งาน
ตัวติดตั้งมีแฟล็ก `--verbose` ของตัวเอง แต่แฟล็กนั้นไม่ได้เป็นส่วนหนึ่งของ
`openclaw update`

`--channel beta` จะเลือก beta ก่อน แต่ runtime จะ fallback ไปที่ stable/latest เมื่อ
แท็ก beta ไม่มีอยู่หรือเก่ากว่ารีลีส stable ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag ดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้ง npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
สถานะ, config, credentials, และ workspace ของคุณไว้ใน `~/.openclaw`; มันจะเปลี่ยนเฉพาะ
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

ช่องทาง `dev` ทำให้มั่นใจว่ามี git checkout, build มัน, และติดตั้ง CLI แบบ global
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแพ็กเกจ หาก
Gateway ติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรช service metadata
และรีสตาร์ต เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังจากขั้นตอนติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า; มันรันการติดตั้งแพ็กเกจ
global โดยตรงและสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนไว้ที่เวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm, หรือ bun แบบแมนนวล

```bash
npm i -g openclaw@latest
```

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global มันจะติดตั้งเป้าหมายลงใน
temporary npm prefix ก่อน, ตรวจสอบ packaged `dist` inventory, แล้วจึงสลับ
package tree ที่สะอาดเข้าไปใน global prefix จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm ซ้อนทับ
แพ็กเกจใหม่ลงบนไฟล์เก่าที่ค้างจากแพ็กเกจเดิม หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองอีกครั้งหนึ่งพร้อม `--omit=optional` การลองซ้ำนี้ช่วยโฮสต์ที่ native
optional dependencies คอมไพล์ไม่ได้ ขณะเดียวกันก็ยังทำให้เห็น failure เดิม
หาก fallback ล้มเหลวเช่นกัน

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อการติดตั้ง npm ขั้นสูง

<AccordionGroup>
  <Accordion title="Package tree แบบอ่านอย่างเดียว">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่า directory แพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม การติดตั้งแพ็กเกจ Plugin จะอยู่ใน npm/git roots ที่ OpenClaw เป็นเจ้าของภายใต้ directory config ของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไข package tree ของ OpenClaw

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใน directory ที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นี้เพราะคำสั่งติดตั้ง/อัปเดต Plugin จะเขียนนอก directory แพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="systemd units ที่ทำให้แข็งแรงขึ้น">
    ให้ OpenClaw มีสิทธิ์เขียนไปยัง config/state roots ของมัน เพื่อให้การติดตั้ง Plugin แบบ explicit, การอัปเดต Plugin, และการล้างข้อมูลของ doctor สามารถบันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="การตรวจสอบพื้นที่ดิสก์ล่วงหน้า">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin แบบ explicit, OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์แบบ best-effort สำหรับ volume เป้าหมาย พื้นที่เหลือน้อยจะสร้างคำเตือนพร้อม path ที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ filesystem quotas, snapshots, และ network volumes อาจเปลี่ยนหลังจากการตรวจสอบได้ การติดตั้งของ package-manager จริงและการตรวจสอบหลังติดตั้งยังคงเป็นแหล่งอ้างอิงหลัก
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

| ช่องทาง | พฤติกรรม                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` แล้วจึง apply พร้อม deterministic jitter ทั่ว `stableJitterHours` (กระจาย rollout) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และ apply ทันที                              |
| `dev`    | ไม่มีการ apply อัตโนมัติ ใช้ `openclaw update` แบบแมนนวล                                                           |

Gateway ยัง log คำแนะนำการอัปเดตเมื่อเริ่มต้นด้วย (ปิดได้ด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืนจากเหตุการณ์ ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการ apply อัตโนมัติ แม้เมื่อกำหนดค่า `update.auto.enabled` ไว้ คำแนะนำการอัปเดตตอนเริ่มต้นยังคงรันได้ เว้นแต่ `update.checkOnStart` จะถูกปิดด้วย

การอัปเดต package-manager ที่ร้องขอผ่าน handler ของ live Gateway control-plane
จะบังคับให้รีสตาร์ตการอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากสลับแพ็กเกจ
วิธีนี้หลีกเลี่ยงการปล่อย process ในหน่วยความจำเก่าให้อยู่ต่อไปนานพอที่จะ lazy-load chunks
จาก package tree ที่ถูกแทนที่ไปแล้ว Shell `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มีการกำกับดูแล เพราะมันสามารถหยุดและ
รีสตาร์ต service รอบการอัปเดตได้

## หลังจากอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, audit นโยบาย DM, และตรวจสอบสุขภาพ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ต Gateway

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

หากต้องการกลับไปเป็นล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่านผลลัพธ์อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkouts, ตัวอัปเดตจะ auto-bootstrap `pnpm` เมื่อจำเป็น หากคุณเห็น pnpm/corepack bootstrap error ให้ติดตั้ง `pnpm` แบบแมนนวล (หรือเปิดใช้งาน `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสอบสุขภาพหลังการอัปเดต
- [การย้ายข้อมูล](/th/install/migrating): คู่มือการย้ายข้อมูลเวอร์ชันหลัก
