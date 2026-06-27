---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างเสียหลังจากการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบ global หรือจากซอร์ส) พร้อมกลยุทธ์การย้อนกลับ
title: กำลังอัปเดต
x-i18n:
    generated_at: "2026-06-27T17:45:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

ดูแลให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีที่เร็วที่สุดในการอัปเดต คำสั่งนี้จะตรวจหาประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ต Gateway

```bash
openclaw update
```

หากต้องการสลับช่องทางหรือระบุเวอร์ชันเป้าหมาย:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # ดูตัวอย่างโดยไม่ปรับใช้
```

`openclaw update` ไม่รับ `--verbose` สำหรับการวินิจฉัยการอัปเดต ให้ใช้
`--dry-run` เพื่อดูตัวอย่างการดำเนินการที่วางแผนไว้, `--json` สำหรับผลลัพธ์แบบมีโครงสร้าง หรือ
`openclaw update status --json` เพื่อตรวจสอบช่องทางและสถานะความพร้อมใช้งาน
ตัวติดตั้งมีแฟล็ก `--verbose` ของตัวเอง แต่แฟล็กนั้นไม่ใช่ส่วนหนึ่งของ
`openclaw update`

`--channel beta` จะเลือก beta ก่อน แต่ runtime จะถอยกลับไปใช้ stable/latest เมื่อ
แท็ก beta หายไปหรือเก่ากว่า release stable ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag ดิบสำหรับการอัปเดตแพ็กเกจครั้งเดียว

ใช้ `--channel dev` สำหรับ checkout GitHub `main` แบบเคลื่อนที่ต่อเนื่องถาวร สำหรับการอัปเดตแพ็กเกจ
`--tag main` จะแมปไปยัง `github:openclaw/openclaw#main` สำหรับการรันครั้งเดียว และ
สเปกแหล่งที่มาจาก GitHub/git จะถูกแพ็กเป็น tarball ชั่วคราวก่อนการติดตั้ง
npm แบบ staged

สำหรับ Plugin ที่มีการจัดการ fallback ของช่องทาง beta จะเป็นคำเตือน: การอัปเดต core
ยังสำเร็จได้ในขณะที่ Plugin ใช้ release default/latest ที่บันทึกไว้ เพราะไม่มี
Plugin beta ให้ใช้

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้ง npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
state, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; มันเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้

```bash
# การติดตั้งแพ็กเกจ npm -> checkout git ที่แก้ไขได้
openclaw update --channel dev

# checkout git -> การติดตั้งแพ็กเกจ npm
openclaw update --channel stable
```

รันพร้อม `--dry-run` ก่อนเพื่อดูตัวอย่างการสลับโหมดการติดตั้งที่แน่นอน:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

ช่องทาง `dev` จะรับประกันว่ามี checkout git, build และติดตั้ง CLI แบบ global
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแพ็กเกจ หาก
Gateway ติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรช metadata ของ service
และรีสตาร์ต เว้นแต่คุณจะส่ง `--no-restart`

สำหรับการติดตั้งแพ็กเกจที่มี service Gateway ที่มีการจัดการ `openclaw update` จะกำหนดเป้าหมาย
package root ที่ service นั้นใช้ หากคำสั่ง `openclaw` ใน shell มาจาก
การติดตั้งอื่น ตัวอัปเดตจะพิมพ์ root ทั้งสองและพาธ Node ของ service ที่มีการจัดการ
การอัปเดตแพ็กเกจจะใช้ package manager ที่เป็นเจ้าของ service
root และตรวจสอบ Node ของ service ที่มีการจัดการเทียบกับ engine ของ target release
ก่อนแทนที่แพ็กเกจ

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังระยะติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า; มันรันการติดตั้ง
แพ็กเกจ global โดยตรงและสามารถกู้คืนการติดตั้ง npm ที่อัปเดตค้างบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนไว้กับเวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

ควรใช้ `openclaw update` สำหรับการติดตั้งที่มีการดูแล เพราะมันประสาน
การสลับแพ็กเกจกับ service Gateway ที่กำลังทำงานได้ หากคุณอัปเดตด้วยตนเองบน
การติดตั้งที่มีการดูแล ให้หยุด Gateway ที่มีการจัดการก่อนที่ package manager จะเริ่ม
Package manager จะแทนที่ไฟล์ในตำแหน่งเดิม และ Gateway ที่กำลังทำงานอยู่อาจพยายาม
โหลดไฟล์ core หรือ Plugin ระหว่างที่ package tree ถูกสลับค้างครึ่งหนึ่งชั่วคราวได้
รีสตาร์ต Gateway หลังจาก package manager เสร็จ เพื่อให้ service ใช้
การติดตั้งใหม่

สำหรับการติดตั้ง Linux system-global ที่ root เป็นเจ้าของ หาก `openclaw update` ล้มเหลวด้วย
`EACCES` และคุณกู้คืนด้วย system npm ให้หยุด Gateway ไว้ตลอดช่วง
การแทนที่แพ็กเกจด้วยตนเอง ใช้แฟล็กโปรไฟล์ `openclaw` หรือ environment เดียวกัน
ที่คุณใช้ตามปกติสำหรับ Gateway นั้น แทนที่ `/usr/bin/npm` ด้วย system npm
ที่เป็นเจ้าของ global prefix ที่ root เป็นเจ้าของบนโฮสต์ของคุณ:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

จากนั้นตรวจสอบ service:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global มันจะติดตั้งเป้าหมายลงใน
npm prefix ชั่วคราวก่อน, ตรวจสอบ inventory ของ `dist` ที่แพ็กมา แล้วจึงสลับ
package tree ที่สะอาดเข้าไปใน global prefix จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm ซ้อน
แพ็กเกจใหม่ทับไฟล์ค้างจากแพ็กเกจเก่า หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองอีกครั้งหนึ่งด้วย `--omit=optional` การลองซ้ำนี้ช่วยโฮสต์ที่
optional dependencies แบบ native ไม่สามารถคอมไพล์ได้ ขณะเดียวกันยังคงแสดงความล้มเหลวเดิมไว้
หาก fallback ก็ล้มเหลวด้วย

คำสั่งอัปเดต npm และอัปเดต Plugin ที่ OpenClaw จัดการยังล้าง quarantine
`min-release-age` ของ npm สำหรับกระบวนการ npm ลูกด้วย npm อาจรายงาน
นโยบายนั้นเป็น cutoff `before` ที่ได้มา; ทั้งสองมีประโยชน์สำหรับนโยบาย quarantine
ของ supply chain ทั่วไป แต่การอัปเดต OpenClaw โดยชัดแจ้งหมายถึง "ติดตั้ง
OpenClaw release ที่เลือกตอนนี้"

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อขั้นสูงเกี่ยวกับการติดตั้ง npm

<AccordionGroup>
  <Accordion title="Package tree แบบอ่านอย่างเดียว">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่าไดเรกทอรีแพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม การติดตั้งแพ็กเกจ Plugin อยู่ใน root npm/git ที่ OpenClaw เป็นเจ้าของภายใต้ไดเรกทอรี config ของผู้ใช้ และการเริ่มต้น Gateway จะไม่แก้ไข package tree ของ OpenClaw

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นั้นเพราะคำสั่งติดตั้ง/อัปเดต Plugin เขียนภายนอกไดเรกทอรีแพ็กเกจ global นั้น

  </Accordion>
  <Accordion title="systemd unit ที่ harden แล้ว">
    ให้ OpenClaw มีสิทธิ์เขียน root ของ config/state เพื่อให้การติดตั้ง Plugin อย่างชัดแจ้ง, การอัปเดต Plugin และการ cleanup ของ doctor สามารถบันทึกการเปลี่ยนแปลงได้:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="การตรวจสอบพื้นที่ดิสก์ล่วงหน้า">
    ก่อนการอัปเดตแพ็กเกจและการติดตั้ง Plugin อย่างชัดแจ้ง OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์ของ volume เป้าหมายแบบ best-effort พื้นที่เหลือน้อยจะสร้างคำเตือนพร้อมพาธที่ตรวจสอบ แต่ไม่บล็อกการอัปเดต เพราะ quota ของ filesystem, snapshot และ network volume อาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้งด้วย package manager จริงและการตรวจสอบหลังติดตั้งยังคงเป็นแหล่งอ้างอิงหลัก
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

| ช่องทาง  | พฤติกรรม                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` แล้วปรับใช้พร้อม jitter แบบ deterministic ภายใน `stableJitterHours` (การ rollout แบบกระจาย) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และปรับใช้ทันที                              |
| `dev`    | ไม่มีการปรับใช้อัตโนมัติ ใช้ `openclaw update` ด้วยตนเอง                                                           |

Gateway ยังบันทึกคำแนะนำการอัปเดตตอน startup ด้วย (ปิดใช้งานด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืนจาก incident ให้ตั้ง `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการปรับใช้อัตโนมัติแม้จะกำหนดค่า `update.auto.enabled` แล้วก็ตาม คำแนะนำการอัปเดตตอน startup ยังรันได้ เว้นแต่จะปิดใช้งาน `update.checkOnStart` ด้วย

การอัปเดตผ่าน package manager ที่ร้องขอผ่าน handler ของ control plane Gateway แบบ live
จะไม่แทนที่ package tree ภายในกระบวนการ Gateway ที่กำลังทำงาน บนการติดตั้ง service
ที่มีการจัดการ Gateway จะเริ่ม handoff แบบ detached, ออก และปล่อยให้
เส้นทาง CLI ปกติ `openclaw update --yes --json` หยุด service, แทนที่
แพ็กเกจ, รีเฟรช metadata ของ service, รีสตาร์ต, ตรวจสอบเวอร์ชันและ
ความสามารถในการเข้าถึงของ Gateway และกู้คืน macOS LaunchAgent ที่ติดตั้งแล้วแต่ยังไม่โหลด
เมื่อเป็นไปได้ หาก Gateway ไม่สามารถทำ handoff นั้นอย่างปลอดภัย `update.run` จะรายงาน
คำสั่ง shell ที่ปลอดภัยแทนการรัน package manager ในกระบวนการ

## หลังอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, audit นโยบาย DM และตรวจสอบสุขภาพของ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

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
`npm view openclaw version` แสดงเวอร์ชันที่เผยแพร่ในปัจจุบัน
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

- รัน `openclaw doctor` อีกครั้งและอ่าน output อย่างระมัดระวัง
- สำหรับ `openclaw update --channel dev` บน source checkout ตัวอัปเดตจะ bootstrap `pnpm` อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิดใช้งาน `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสอบสุขภาพหลังอัปเดต
- [การย้ายเวอร์ชัน](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
