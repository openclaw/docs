---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างใช้งานไม่ได้หลังจากอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบทั่วทั้งระบบหรือจากซอร์ส) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-04-30T10:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีที่เร็วที่สุดในการอัปเดต คำสั่งนี้จะตรวจหาประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ท Gateway

```bash
openclaw update
```

หากต้องการสลับช่องทางหรือกำหนดเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # ดูตัวอย่างโดยไม่ปรับใช้
```

`--channel beta` จะเลือก beta ก่อน แต่ runtime จะถอยกลับไปใช้ stable/latest เมื่อ
ไม่มีแท็ก beta หรือเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag ดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
state, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; โดยจะเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้

```bash
# การติดตั้งแพ็กเกจ npm -> git checkout ที่แก้ไขได้
openclaw update --channel dev

# git checkout -> การติดตั้งแพ็กเกจ npm
openclaw update --channel stable
```

รันด้วย `--dry-run` ก่อนเพื่อดูตัวอย่างการสลับโหมดการติดตั้งที่แน่นอน:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

ช่องทาง `dev` จะรับประกันว่ามี git checkout, build และติดตั้ง global CLI
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแพ็กเกจ หาก
Gateway ติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรช metadata ของบริการ
และรีสตาร์ท เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังจากช่วงติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า แต่จะรันการติดตั้ง
แพ็กเกจ global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตไปบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการตรึงการกู้คืนกับเวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm หรือ bun แบบแมนนวล

```bash
npm i -g openclaw@latest
```

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global คำสั่งนี้จะติดตั้งเป้าหมายลงใน
npm prefix ชั่วคราวก่อน ตรวจสอบ inventory ของ `dist` ที่บรรจุมาในแพ็กเกจ จากนั้นสลับ
package tree ที่สะอาดเข้าไปยัง global prefix จริง วิธีนี้หลีกเลี่ยงไม่ให้ npm วาง
แพ็กเกจใหม่ทับไฟล์เก่าที่ค้างมาจากแพ็กเกจเดิม หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองใหม่หนึ่งครั้งด้วย `--omit=optional` การลองใหม่นั้นช่วยโฮสต์ที่ native
optional dependencies คอมไพล์ไม่ได้ ขณะเดียวกันยังคงแสดงข้อผิดพลาดเดิม
หาก fallback ล้มเหลวด้วย

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อขั้นสูงสำหรับการติดตั้ง npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw ถือว่าการติดตั้งแบบ global ที่บรรจุเป็นแพ็กเกจเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่าไดเรกทอรีแพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม dependencies สำหรับ runtime ของ Plugin ที่รวมมาจะถูกจัดวางลงในไดเรกทอรี runtime ที่เขียนได้แทนการแก้ไข package tree วิธีนี้ป้องกันไม่ให้ `openclaw update` แข่งกับ Gateway ที่กำลังทำงานอยู่หรือ local agent ที่กำลังซ่อม dependencies ของ Plugin ระหว่างการติดตั้งเดียวกัน

    การตั้งค่า npm บางแบบบน Linux ติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นั้นผ่านเส้นทาง staging ภายนอกเดียวกัน

  </Accordion>
  <Accordion title="Hardened systemd units">
    ตั้งค่าไดเรกทอรี stage ที่เขียนได้ซึ่งรวมอยู่ใน `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` ยังรับรายการเส้นทางได้ด้วย OpenClaw จะแก้หา dependencies สำหรับ runtime ของ Plugin ที่รวมมาโดยไล่จากซ้ายไปขวาข้าม root ที่ระบุไว้ ถือว่า root ก่อนหน้าเป็น layer ที่ติดตั้งไว้ล่วงหน้าแบบอ่านอย่างเดียว และติดตั้งหรือซ่อมเฉพาะลงใน root สุดท้ายที่เขียนได้:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    หากไม่ได้ตั้งค่า `OPENCLAW_PLUGIN_STAGE_DIR` OpenClaw จะใช้ `$STATE_DIRECTORY` เมื่อ systemd มีให้ จากนั้นถอยกลับไปที่ `~/.openclaw/plugin-runtime-deps` ขั้นตอนการซ่อมจะถือว่า stage นั้นเป็น root ของแพ็กเกจ local ที่ OpenClaw เป็นเจ้าของ และละเว้น user npm prefix กับการตั้งค่า global ดังนั้น config ของ npm สำหรับการติดตั้ง global จะไม่ redirect dependencies ของ Plugin ที่รวมมาไปยัง `~/node_modules` หรือ package tree แบบ global

  </Accordion>
  <Accordion title="Disk-space preflight">
    ก่อนการอัปเดตแพ็กเกจและการซ่อม runtime-dependency ที่รวมมา OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์ของ volume เป้าหมายแบบ best-effort พื้นที่ต่ำจะแสดงคำเตือนพร้อมเส้นทางที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะโควตา filesystem, snapshot และ network volume อาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้ง npm จริง การคัดลอก และการตรวจสอบหลังติดตั้งยังคงเป็นแหล่งอ้างอิงที่มีผลตัดสิน
  </Accordion>
  <Accordion title="Bundled plugin runtime dependencies">
    การติดตั้งแบบแพ็กเกจจะเก็บ dependencies สำหรับ runtime ของ Plugin ที่รวมมาไว้นอก package tree แบบอ่านอย่างเดียว เมื่อเริ่มต้นและระหว่าง `openclaw doctor --fix` OpenClaw จะซ่อม dependencies สำหรับ runtime เฉพาะ Plugin ที่รวมมาซึ่ง active ใน config, active ผ่าน config ช่องทางแบบ legacy หรือเปิดใช้งานโดยค่าเริ่มต้นใน manifest ที่รวมมาเท่านั้น state การ auth ของช่องทางที่บันทึกไว้เพียงอย่างเดียวจะไม่ทำให้เกิดการซ่อม runtime-dependency ตอน Gateway startup

    การปิดใช้งานอย่างชัดเจนมีผลเหนือกว่า Plugin หรือช่องทางที่ถูกปิดใช้งานจะไม่ได้รับการซ่อม dependencies สำหรับ runtime เพียงเพราะมีอยู่ในแพ็กเกจ Plugin ภายนอกและเส้นทางโหลดแบบกำหนดเองยังคงใช้ `openclaw plugins install` หรือ `openclaw plugins update`

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
| `stable` | รอ `stableDelayHours` จากนั้นปรับใช้ด้วย jitter แบบกำหนดได้ล่วงหน้าตลอด `stableJitterHours` (การ rollout แบบกระจาย) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และปรับใช้ทันที                              |
| `dev`    | ไม่มีการปรับใช้อัตโนมัติ ใช้ `openclaw update` ด้วยตนเอง                                                           |

Gateway ยังบันทึกคำแนะนำการอัปเดตเมื่อเริ่มต้นด้วย (ปิดด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืนจาก incident ให้ตั้งค่า `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการปรับใช้อัตโนมัติ แม้จะกำหนดค่า `update.auto.enabled` ไว้แล้วก็ตาม คำแนะนำการอัปเดตตอนเริ่มต้นยังสามารถทำงานได้ เว้นแต่ `update.checkOnStart` จะถูกปิดด้วย

## หลังอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, audit นโยบาย DM และตรวจสอบสุขภาพของ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

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

- รัน `openclaw doctor` อีกครั้งและอ่านผลลัพธ์อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkout ตัวอัปเดตจะ bootstrap `pnpm` อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิดใช้งาน `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการอัปเดต
- [การย้ายระบบ](/th/install/migrating): คู่มือการย้าย major version
