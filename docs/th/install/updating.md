---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างขัดข้องหลังจากการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งทั่วทั้งระบบหรือจากซอร์สโค้ด) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-05-01T10:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
    source_path: install/updating.md
    workflow: 16
---

ทำให้ OpenClaw ทันสมัยอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด โดยจะตรวจหาประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ท Gateway

```bash
openclaw update
```

หากต้องการเปลี่ยนช่องทางหรือระบุเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` จะให้ความสำคัญกับ beta แต่ runtime จะย้อนกลับไปใช้ stable/latest เมื่อ
ไม่มีแท็ก beta หรือเก่ากว่ารุ่น stable ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจครั้งเดียว

ดู [ช่องทางการพัฒนา](/th/install/development-channels) สำหรับความหมายของช่องทาง

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ช่องทางเมื่อคุณต้องการเปลี่ยนประเภทการติดตั้ง ตัวอัปเดตจะเก็บ
สถานะ, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; โดยจะเปลี่ยนเฉพาะ
การติดตั้งโค้ด OpenClaw ที่ CLI และ Gateway ใช้

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

ช่องทาง `dev` จะทำให้มี git checkout, build และติดตั้ง CLI ระดับ global
จาก checkout นั้น ช่องทาง `stable` และ `beta` ใช้การติดตั้งแบบแพ็กเกจ หาก
Gateway ติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรช metadata ของ service
และรีสตาร์ท เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งเฉพาะผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

หาก `openclaw update` ล้มเหลวหลังขั้นตอนติดตั้งแพ็กเกจ npm ให้รัน
ตัวติดตั้งอีกครั้ง ตัวติดตั้งจะไม่เรียกตัวอัปเดตเก่า แต่จะรันการติดตั้ง
แพ็กเกจระดับ global โดยตรง และสามารถกู้คืนการติดตั้ง npm ที่อัปเดตค้างบางส่วนได้

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

หากต้องการ pin การกู้คืนไว้ที่เวอร์ชันหรือ dist-tag เฉพาะ ให้เพิ่ม `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## ทางเลือก: npm, pnpm หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

เมื่อ `openclaw update` จัดการการติดตั้ง npm ระดับ global จะติดตั้งเป้าหมายลงใน
npm prefix ชั่วคราวก่อน ตรวจสอบ inventory ของ `dist` ที่แพ็กไว้ จากนั้นสลับ
package tree ที่สะอาดเข้าไปยัง global prefix จริง วิธีนี้หลีกเลี่ยงการที่ npm วาง
แพ็กเกจใหม่ทับไฟล์ค้างเก่าจากแพ็กเกจเดิม หากคำสั่งติดตั้งล้มเหลว
OpenClaw จะลองอีกครั้งหนึ่งด้วย `--omit=optional` การลองซ้ำนี้ช่วย host ที่ native
optional dependencies compile ไม่ได้ พร้อมกับยังทำให้เห็น failure เดิม
หาก fallback ก็ล้มเหลวเช่นกัน

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### หัวข้อการติดตั้ง npm ขั้นสูง

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw ถือว่าการติดตั้ง global แบบแพ็กเกจเป็นแบบอ่านอย่างเดียวใน runtime แม้ว่า directory แพ็กเกจ global จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม bundled plugin runtime dependencies จะถูกจัดเตรียมไว้ใน directory runtime ที่เขียนได้แทนการแก้ไข package tree วิธีนี้ป้องกันไม่ให้ `openclaw update` แข่งกับ Gateway หรือ agent ในเครื่องที่กำลังรันอยู่และซ่อมแซม plugin dependencies ระหว่างการติดตั้งเดียวกัน

    การตั้งค่า npm บน Linux บางแบบติดตั้งแพ็กเกจ global ไว้ใต้ directory ที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นั้นผ่าน staging path ภายนอกเดียวกัน

  </Accordion>
  <Accordion title="Hardened systemd units">
    ตั้งค่า stage directory ที่เขียนได้ซึ่งรวมอยู่ใน `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` ยังรับรายการ path ได้ด้วย OpenClaw จะ resolve bundled plugin runtime dependencies จากซ้ายไปขวาข้าม roots ที่ระบุไว้ ถือว่า roots ก่อนหน้าเป็น layer ที่ติดตั้งไว้ล่วงหน้าแบบอ่านอย่างเดียว และติดตั้งหรือซ่อมแซมเฉพาะใน root สุดท้ายที่เขียนได้:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    หากไม่ได้ตั้งค่า `OPENCLAW_PLUGIN_STAGE_DIR` OpenClaw จะใช้ `$STATE_DIRECTORY` เมื่อ systemd จัดเตรียมไว้ให้ จากนั้นจะย้อนกลับไปใช้ `~/.openclaw/plugin-runtime-deps` ขั้นตอนซ่อมแซมจะถือว่า stage นั้นเป็น local package root ที่ OpenClaw เป็นเจ้าของ และละเว้น user npm prefix และการตั้งค่า global ดังนั้น config npm สำหรับ global install จะไม่ redirect bundled plugin dependencies ไปยัง `~/node_modules` หรือ package tree ระดับ global

  </Accordion>
  <Accordion title="Disk-space preflight">
    ก่อนการอัปเดตแพ็กเกจและการซ่อมแซม bundled runtime-dependency OpenClaw จะพยายามตรวจสอบพื้นที่ดิสก์แบบ best-effort สำหรับ volume เป้าหมาย พื้นที่ต่ำจะสร้างคำเตือนพร้อม path ที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ quota ของ filesystem, snapshot และ volume เครือข่ายอาจเปลี่ยนหลังการตรวจสอบได้ การติดตั้ง npm, การคัดลอก และการตรวจสอบหลังติดตั้งจริงยังคงเป็นแหล่งอ้างอิงที่มีอำนาจตัดสิน
  </Accordion>
  <Accordion title="Bundled plugin runtime dependencies">
    การติดตั้งแบบแพ็กเกจจะกัน bundled plugin runtime dependencies ออกจาก package tree แบบอ่านอย่างเดียว เมื่อ startup และระหว่าง `openclaw doctor --fix` OpenClaw จะซ่อมแซม runtime dependencies เฉพาะสำหรับ bundled plugins ที่ active ใน config, active ผ่าน config ช่องทาง legacy หรือเปิดใช้โดยค่า default ของ bundled manifest สถานะ auth ของช่องทางที่ persist ไว้เพียงอย่างเดียวจะไม่ trigger การซ่อมแซม runtime-dependency ตอน Gateway startup

    การปิดใช้อย่างชัดเจนมีผลเหนือกว่า Plugin หรือช่องทางที่ disabled จะไม่ได้รับการซ่อม runtime dependencies เพียงเพราะมันมีอยู่ในแพ็กเกจ External plugins และ custom load paths ยังคงใช้ `openclaw plugins install` หรือ `openclaw plugins update`

  </Accordion>
</AccordionGroup>

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่ตามค่า default เปิดใช้งานได้ใน `~/.openclaw/openclaw.json`:

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
| `stable` | รอ `stableDelayHours` แล้วจึง apply พร้อม deterministic jitter ภายใน `stableJitterHours` (กระจาย rollout) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่า default: ทุกชั่วโมง) และ apply ทันที                              |
| `dev`    | ไม่มีการ apply อัตโนมัติ ใช้ `openclaw update` แบบ manual                                                           |

Gateway ยัง log คำแนะนำการอัปเดตตอน startup ด้วย (ปิดได้ด้วย `update.checkOnStart: false`)
สำหรับการ downgrade หรือการกู้คืน incident ให้ตั้งค่า `OPENCLAW_NO_AUTO_UPDATE=1` ใน environment ของ Gateway เพื่อบล็อกการ apply อัตโนมัติแม้เมื่อ config `update.auto.enabled` ไว้แล้ว คำแนะนำการอัปเดตตอน startup ยังสามารถรันได้ เว้นแต่ `update.checkOnStart` จะถูกปิดด้วย

การอัปเดต package-manager ที่ร้องขอผ่าน live Gateway control-plane handler
จะบังคับการรีสตาร์ทหลังสลับแพ็กเกจแบบไม่เลื่อนเวลาและไม่มี cooldown วิธีนี้
หลีกเลี่ยงการปล่อย process ในหน่วยความจำเก่าค้างไว้นานพอที่จะ lazy-load chunks
จาก package tree ที่ถูกแทนที่ไปแล้ว Shell `openclaw update`
ยังคงเป็นเส้นทางที่แนะนำสำหรับการติดตั้งที่มี supervisor เพราะสามารถหยุดและ
รีสตาร์ท service รอบการอัปเดตได้

## หลังอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

 migrate config, audit นโยบาย DM และตรวจสอบสุขภาพของ Gateway รายละเอียด: [Doctor](/th/gateway/doctor)

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

หากต้องการกลับไปเวอร์ชันล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่าน output อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkouts ตัวอัปเดตจะ bootstrap `pnpm` อัตโนมัติเมื่อจำเป็น หากคุณเห็น error การ bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` แบบ manual (หรือเปิดใช้ `corepack` อีกครั้ง) แล้วรันการอัปเดตซ้ำ
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install): วิธีติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพหลังการอัปเดต
- [การย้ายระบบ](/th/install/migrating): คู่มือการย้ายเวอร์ชันหลัก
