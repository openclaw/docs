---
read_when:
    - คุณต้องการสลับระหว่างเวอร์ชันเสถียร/เบต้า/พัฒนา
    - คุณต้องการตรึงเวอร์ชัน แท็ก หรือ SHA ที่ระบุ
    - คุณกำลังติดแท็กหรือเผยแพร่รุ่นก่อนเผยแพร่จริง
sidebarTitle: Release Channels
summary: 'แชนเนลเสถียร เบต้า และ dev: ความหมาย การสลับ การตรึง และการติดแท็ก'
title: ช่องทางการเผยแพร่
x-i18n:
    generated_at: "2026-05-06T09:18:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw มีช่องทางอัปเดตสามช่องทาง:

- **stable**: npm dist-tag `latest` แนะนำสำหรับผู้ใช้ส่วนใหญ่
- **beta**: npm dist-tag `beta` เมื่อเป็นเวอร์ชันปัจจุบัน หากไม่มี beta หรือ beta เก่ากว่า
  รุ่น stable ล่าสุด โฟลว์การอัปเดตจะย้อนกลับไปใช้ `latest`
- **dev**: หัวล่าสุดที่เปลี่ยนไปเรื่อย ๆ ของ `main` (git) npm dist-tag: `dev` (เมื่อเผยแพร่แล้ว)
  สาขา `main` ใช้สำหรับการทดลองและการพัฒนาอย่างต่อเนื่อง อาจมีฟีเจอร์
  ที่ยังไม่สมบูรณ์หรือการเปลี่ยนแปลงที่ทำให้เข้ากันไม่ได้ อย่าใช้กับ Gateway สำหรับการใช้งานจริง

โดยปกติเราจะจัดส่งบิลด์ stable ไปที่ **beta** ก่อน ทดสอบที่นั่น แล้วจึงเรียกใช้
ขั้นตอนการโปรโมตอย่างชัดเจนที่ย้ายบิลด์ที่ตรวจสอบแล้วไปยัง `latest` โดยไม่
เปลี่ยนหมายเลขเวอร์ชัน Maintainer ยังสามารถเผยแพร่รุ่น stable
ไปยัง `latest` โดยตรงได้เมื่อจำเป็น Dist-tags คือแหล่งข้อมูลจริงสำหรับการติดตั้งผ่าน npm

## การสลับช่องทาง

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` จะบันทึกตัวเลือกของคุณไว้ใน config (`update.channel`) และจัดแนว
วิธีการติดตั้ง:

- **`stable`** (การติดตั้งแพ็กเกจ): อัปเดตผ่าน npm dist-tag `latest`
- **`beta`** (การติดตั้งแพ็กเกจ): เลือกใช้ npm dist-tag `beta` ก่อน แต่จะย้อนกลับไปใช้
  `latest` เมื่อไม่มี `beta` หรือเก่ากว่าแท็ก stable ปัจจุบัน
- **`stable`** (การติดตั้งจาก git): checkout แท็ก git ของ stable ล่าสุด
- **`beta`** (การติดตั้งจาก git): เลือกใช้แท็ก git ของ beta ล่าสุดก่อน แต่จะย้อนกลับไปใช้
  แท็ก git ของ stable ล่าสุดเมื่อไม่มี beta หรือเก่ากว่า
- **`dev`**: ทำให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น `~/openclaw`, เขียนทับได้ด้วย
  `OPENCLAW_GIT_DIR`), สลับไปที่ `main`, rebase บน upstream, build และ
  ติดตั้ง CLI แบบ global จาก checkout นั้น

<Tip>
หากคุณต้องการใช้ stable และ dev ควบคู่กัน ให้เก็บ clone ไว้สองชุดและชี้ Gateway ของคุณไปที่ชุด stable
</Tip>

## การกำหนดเป้าหมายเวอร์ชันหรือแท็กแบบครั้งเดียว

ใช้ `--tag` เพื่อกำหนดเป้าหมาย dist-tag, เวอร์ชัน หรือ package spec ที่เฉพาะเจาะจงสำหรับการ
อัปเดตครั้งเดียว **โดยไม่** เปลี่ยนช่องทางที่บันทึกไว้ของคุณ:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

หมายเหตุ:

- `--tag` ใช้กับ **การติดตั้งแพ็กเกจ (npm) เท่านั้น** การติดตั้งจาก git จะไม่สนใจค่านี้
- แท็กจะไม่ถูกบันทึกไว้ ครั้งถัดไปที่คุณเรียก `openclaw update` จะใช้ช่องทางที่คุณกำหนดค่าไว้
  ตามปกติ
- การป้องกันการดาวน์เกรด: หากเวอร์ชันเป้าหมายเก่ากว่าเวอร์ชันปัจจุบันของคุณ
  OpenClaw จะถามเพื่อยืนยัน (ข้ามได้ด้วย `--yes`)
- `--channel beta` แตกต่างจาก `--tag beta`: โฟลว์ของช่องทางสามารถย้อนกลับไปใช้
  stable/latest เมื่อไม่มี beta หรือ beta เก่ากว่า ขณะที่ `--tag beta` จะกำหนดเป้าหมาย
  dist-tag `beta` แบบดิบสำหรับการรันครั้งนั้น

## การจำลองการทำงาน

ดูตัวอย่างว่า `openclaw update` จะทำอะไรโดยไม่ทำการเปลี่ยนแปลง:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

การจำลองการทำงานจะแสดงช่องทางที่มีผล เวอร์ชันเป้าหมาย การกระทำที่วางแผนไว้ และ
ระบุว่าจะต้องยืนยันการดาวน์เกรดหรือไม่

## Plugin และช่องทาง

เมื่อคุณสลับช่องทางด้วย `openclaw update` OpenClaw จะซิงค์แหล่งที่มาของ Plugin
ด้วย:

- `dev` เลือกใช้ Plugin ที่มาพร้อมกันจาก git checkout ก่อน
- `stable` และ `beta` กู้คืนแพ็กเกจ Plugin ที่ติดตั้งผ่าน npm
- Plugin ที่ติดตั้งผ่าน npm จะถูกอัปเดตหลังจากการอัปเดต core เสร็จสิ้น

## การตรวจสอบสถานะปัจจุบัน

```bash
openclaw update status
```

แสดงช่องทางที่ใช้งานอยู่ ประเภทการติดตั้ง (git หรือแพ็กเกจ) เวอร์ชันปัจจุบัน และ
แหล่งที่มา (config, แท็ก git, สาขา git หรือค่าเริ่มต้น)

## แนวทางปฏิบัติที่ดีในการแท็ก

- แท็กรุ่นที่คุณต้องการให้ git checkout ไปลงที่นั้น (`vYYYY.M.D` สำหรับ stable,
  `vYYYY.M.D-beta.N` สำหรับ beta)
- `vYYYY.M.D.beta.N` ยังได้รับการรู้จำเพื่อความเข้ากันได้ แต่ควรใช้ `-beta.N`
- แท็กเดิม `vYYYY.M.D-<patch>` ยังคงได้รับการรู้จำว่าเป็น stable (ไม่ใช่ beta)
- รักษาแท็กให้ไม่เปลี่ยนแปลง: อย่าย้ายหรือใช้แท็กซ้ำ
- npm dist-tags ยังคงเป็นแหล่งข้อมูลจริงสำหรับการติดตั้งผ่าน npm:
  - `latest` -> stable
  - `beta` -> บิลด์ candidate หรือบิลด์ stable ที่ส่งเข้า beta ก่อน
  - `dev` -> snapshot ของ main (ไม่บังคับ)

## ความพร้อมใช้งานของแอป macOS

บิลด์ beta และ dev อาจ **ไม่มี** รุ่นแอป macOS รวมอยู่ด้วย ซึ่งไม่เป็นไร:

- แท็ก git และ npm dist-tag ยังสามารถเผยแพร่ได้
- ระบุว่า "ไม่มีบิลด์ macOS สำหรับ beta นี้" ใน release notes หรือ changelog

## ที่เกี่ยวข้อง

- [การอัปเดต](/th/install/updating)
- [รายละเอียดภายในของตัวติดตั้ง](/th/install/installer)
