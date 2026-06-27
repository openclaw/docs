---
read_when:
    - คุณต้องการสลับระหว่างรุ่นเสถียร/เบต้า/พัฒนา
    - คุณต้องการตรึงเวอร์ชัน แท็ก หรือ SHA ที่ระบุ
    - คุณกำลังติดแท็กหรือเผยแพร่รุ่นก่อนเผยแพร่จริง
sidebarTitle: Release Channels
summary: 'ช่อง stable, beta และ dev: ความหมายเชิงพฤติกรรม การสลับ การปักหมุด และการติดแท็ก'
title: ช่องทางการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-06-27T17:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw จัดส่งช่องทางอัปเดต 3 ช่องทาง:

- **stable**: npm dist-tag `latest` แนะนำสำหรับผู้ใช้ส่วนใหญ่
- **beta**: npm dist-tag `beta` เมื่อเป็นเวอร์ชันปัจจุบัน หากไม่มี beta หรือเก่ากว่า
  รีลีส stable ล่าสุด โฟลว์อัปเดตจะถอยกลับไปใช้ `latest`
- **dev**: ส่วนหัวที่เคลื่อนไปเรื่อย ๆ ของ `main` (git) npm dist-tag: `dev` (เมื่อเผยแพร่แล้ว)
  แบรนช์ `main` ใช้สำหรับการทดลองและการพัฒนาที่ดำเนินอยู่ อาจมีฟีเจอร์
  ที่ยังไม่สมบูรณ์หรือการเปลี่ยนแปลงที่ทำให้เข้ากันไม่ได้ ห้ามใช้กับ gateway สำหรับโปรดักชัน

โดยปกติเราจะจัดส่งบิลด์ stable ไปที่ **beta** ก่อน ทดสอบที่นั่น แล้วจึงรัน
ขั้นตอนโปรโมตแบบชัดเจนที่ย้ายบิลด์ที่ตรวจสอบแล้วไปยัง `latest` โดยไม่
เปลี่ยนหมายเลขเวอร์ชัน ผู้ดูแลยังสามารถเผยแพร่รีลีส stable
โดยตรงไปยัง `latest` ได้เมื่อจำเป็น Dist-tags เป็นแหล่งข้อมูลจริงสำหรับการติดตั้งผ่าน npm

## การสลับช่องทาง

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` จะบันทึกตัวเลือกของคุณไว้ใน config (`update.channel`) และจัดวิธี
การติดตั้งให้สอดคล้องกัน:

- **`stable`** (การติดตั้งแพ็กเกจ): อัปเดตผ่าน npm dist-tag `latest`
- **`beta`** (การติดตั้งแพ็กเกจ): เลือกใช้ npm dist-tag `beta` ก่อน แต่จะถอยกลับไปใช้
  `latest` เมื่อไม่มี `beta` หรือเก่ากว่าแท็ก stable ปัจจุบัน
- **`stable`** (การติดตั้ง git): เช็กเอาต์แท็ก git stable ล่าสุด โดยไม่รวม
  แท็ก semver prerelease เช่น `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` และ suffix prerelease
  อื่น ๆ
- **`beta`** (การติดตั้ง git): เลือกใช้แท็ก git beta ล่าสุดก่อน แต่จะถอยกลับไปใช้
  แท็ก git stable ล่าสุดเมื่อไม่มี beta หรือเก่ากว่า
- **`dev`**: ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น `~/openclaw` หรือ
  `$OPENCLAW_HOME/openclaw` เมื่อตั้งค่า `OPENCLAW_HOME`; override ด้วย
  `OPENCLAW_GIT_DIR`), สลับไปที่ `main`, rebase บน upstream, build และ
  ติดตั้ง CLI แบบ global จาก checkout นั้น

<Tip>
หากคุณต้องการใช้ stable และ dev ควบคู่กัน ให้เก็บ clone ไว้สองชุดและชี้ gateway ของคุณไปที่ชุด stable
</Tip>

## การระบุเวอร์ชันหรือแท็กแบบครั้งเดียว

ใช้ `--tag` เพื่อระบุ dist-tag, เวอร์ชัน หรือ package spec เฉพาะสำหรับการ
อัปเดตครั้งเดียว **โดยไม่** เปลี่ยนช่องทางที่บันทึกไว้ของคุณ:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

หมายเหตุ:

- `--tag` ใช้กับ **การติดตั้งแพ็กเกจ (npm) เท่านั้น** การติดตั้ง git จะละเว้นค่านี้
- แท็กจะไม่ถูกบันทึกไว้ การรัน `openclaw update` ครั้งถัดไปจะใช้ช่องทาง
  ที่คุณกำหนดค่าไว้ตามปกติ
- สำหรับการติดตั้งแพ็กเกจ OpenClaw จะ pre-pack GitHub/git source specs ลงใน
  tarball ชั่วคราวก่อนการติดตั้ง npm แบบ staged ใช้ `--channel dev` หรือ
  `--install-method git --version main` เมื่อคุณต้องการ checkout `main`
  ที่เคลื่อนไปเรื่อย ๆ เป็นการติดตั้งแบบถาวรของคุณ
- การป้องกันการ downgrade: หากเวอร์ชันเป้าหมายเก่ากว่าเวอร์ชันปัจจุบันของคุณ
  OpenClaw จะถามเพื่อยืนยัน (ข้ามได้ด้วย `--yes`)
- `--channel beta` แตกต่างจาก `--tag beta`: โฟลว์ช่องทางสามารถถอยกลับไปใช้
  stable/latest เมื่อไม่มี beta หรือเก่ากว่า ขณะที่ `--tag beta` ระบุไปที่
  dist-tag `beta` ดิบสำหรับการรันครั้งนั้นครั้งเดียว

## Dry run

ดูตัวอย่างว่า `openclaw update` จะทำอะไรโดยไม่ทำการเปลี่ยนแปลง:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run จะแสดงช่องทางที่มีผล เวอร์ชันเป้าหมาย การดำเนินการที่วางแผนไว้ และ
บอกว่าจะต้องยืนยันการ downgrade หรือไม่

## Plugins และช่องทาง

เมื่อคุณสลับช่องทางด้วย `openclaw update` OpenClaw จะซิงก์แหล่งที่มาของ plugin
ด้วย:

- `dev` เลือกใช้ plugin ที่ bundled มาจาก git checkout ก่อน
- `stable` และ `beta` กู้คืนแพ็กเกจ plugin ที่ติดตั้งผ่าน npm
- plugin ที่ติดตั้งผ่าน npm จะถูกอัปเดตหลังจากการอัปเดต core เสร็จสิ้น

## การตรวจสอบสถานะปัจจุบัน

```bash
openclaw update status
```

แสดงช่องทางที่ใช้งานอยู่ ประเภทการติดตั้ง (git หรือ package), เวอร์ชันปัจจุบัน และ
แหล่งที่มา (config, git tag, git branch หรือค่าเริ่มต้น)

## แนวปฏิบัติที่ดีในการติดแท็ก

- ติดแท็กรีลีสที่คุณต้องการให้ git checkout ไปลงที่นั่น (`vYYYY.M.PATCH` สำหรับ stable,
  `vYYYY.M.PATCH-beta.N` สำหรับ beta; suffix semver prerelease ที่มีชื่อ เช่น
  `-alpha.N`, `-rc.N` และ `-next.N` ไม่ใช่เป้าหมาย stable)
- แท็ก stable แบบตัวเลขรุ่นเก่า เช่น `vYYYY.M.PATCH-1` และ `v1.0.1-1` ยัง
  ถูกจดจำเป็นแท็ก git stable เพื่อความเข้ากันได้
- `vYYYY.M.PATCH.beta.N` ก็ถูกจดจำเพื่อความเข้ากันได้เช่นกัน แต่ควรใช้ `-beta.N`
- ทำให้แท็กไม่เปลี่ยนแปลง: ห้ามย้ายหรือนำแท็กกลับมาใช้ซ้ำ
- npm dist-tags ยังคงเป็นแหล่งข้อมูลจริงสำหรับการติดตั้งผ่าน npm:
  - `latest` -> stable
  - `beta` -> บิลด์ candidate หรือบิลด์ stable ที่ปล่อยผ่าน beta ก่อน
  - `dev` -> สแนปช็อต main (ไม่บังคับ)

## ความพร้อมใช้งานของแอป macOS

บิลด์ Beta และ dev อาจ **ไม่มี** รีลีสแอป macOS ซึ่งไม่เป็นไร:

- ยังสามารถเผยแพร่ git tag และ npm dist-tag ได้
- ระบุว่า "ไม่มีบิลด์ macOS สำหรับ beta นี้" ในบันทึกรีลีสหรือ changelog

## ที่เกี่ยวข้อง

- [การอัปเดต](/th/install/updating)
- [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer)
