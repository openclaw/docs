---
read_when:
    - คุณต้องการสลับระหว่างรุ่นเสถียร/เบต้า/dev
    - คุณต้องการตรึงเวอร์ชัน แท็ก หรือ SHA ที่เฉพาะเจาะจง
    - คุณกำลังติดแท็กหรือเผยแพร่รุ่นก่อนเผยแพร่
sidebarTitle: Release Channels
summary: 'ช่องทาง stable, beta และ dev: ความหมาย การสลับ การปักตรึง และการติดแท็ก'
title: ช่องทางการเผยแพร่
x-i18n:
    generated_at: "2026-04-30T09:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# ช่องทางการพัฒนา

OpenClaw มีช่องทางอัปเดตสามช่องทาง:

- **stable**: npm dist-tag `latest` แนะนำสำหรับผู้ใช้ส่วนใหญ่
- **beta**: npm dist-tag `beta` เมื่อเป็นเวอร์ชันปัจจุบัน หากไม่มี beta หรือเก่ากว่า
  รุ่น stable ล่าสุด ขั้นตอนอัปเดตจะย้อนกลับไปใช้ `latest`
- **dev**: หัวล่าสุดที่เคลื่อนตามของ `main` (git) npm dist-tag: `dev` (เมื่อเผยแพร่)
  สาขา `main` ใช้สำหรับการทดลองและการพัฒนาอย่างต่อเนื่อง อาจมี
  ฟีเจอร์ที่ยังไม่สมบูรณ์หรือการเปลี่ยนแปลงที่ทำให้เข้ากันไม่ได้ อย่าใช้กับ Gateway ในการใช้งานจริง

โดยปกติเราจะส่ง build ของ stable ไปที่ **beta** ก่อน ทดสอบที่นั่น แล้วจึงเรียกใช้
ขั้นตอนโปรโมตอย่างชัดเจนที่ย้าย build ซึ่งตรวจสอบแล้วไปยัง `latest` โดยไม่
เปลี่ยนหมายเลขเวอร์ชัน ผู้ดูแลยังสามารถเผยแพร่รุ่น stable
ไปยัง `latest` โดยตรงได้เมื่อจำเป็น Dist-tags เป็นแหล่งข้อมูลจริงสำหรับการติดตั้ง npm

## การสลับช่องทาง

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` จะคงค่าที่คุณเลือกไว้ใน config (`update.channel`) และจัดวิธี
ติดตั้งให้สอดคล้องกัน:

- **`stable`** (การติดตั้งแบบ package): อัปเดตผ่าน npm dist-tag `latest`
- **`beta`** (การติดตั้งแบบ package): เลือกใช้ npm dist-tag `beta` ก่อน แต่จะย้อนกลับไปใช้
  `latest` เมื่อไม่มี `beta` หรือเก่ากว่า tag stable ปัจจุบัน
- **`stable`** (การติดตั้งแบบ git): checkout git tag ของ stable ล่าสุด
- **`beta`** (การติดตั้งแบบ git): เลือกใช้ git tag ของ beta ล่าสุดก่อน แต่จะย้อนกลับไปใช้
  git tag ของ stable ล่าสุดเมื่อไม่มี beta หรือเก่ากว่า
- **`dev`**: ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น `~/openclaw`, override ด้วย
  `OPENCLAW_GIT_DIR`), สลับไปที่ `main`, rebase บน upstream, build และ
  ติดตั้ง CLI แบบ global จาก checkout นั้น

<Tip>
หากคุณต้องการใช้ stable และ dev ควบคู่กัน ให้มี clone สองชุดและชี้ Gateway ของคุณไปที่ชุด stable
</Tip>

## การระบุเวอร์ชันหรือ tag แบบครั้งเดียว

ใช้ `--tag` เพื่อระบุ dist-tag, เวอร์ชัน หรือ package spec เฉพาะสำหรับการอัปเดตครั้งเดียว
**โดยไม่**เปลี่ยนช่องทางที่บันทึกไว้ของคุณ:

```bash
# ติดตั้งเวอร์ชันเฉพาะ
openclaw update --tag 2026.4.1-beta.1

# ติดตั้งจาก beta dist-tag (ครั้งเดียว ไม่บันทึกถาวร)
openclaw update --tag beta

# ติดตั้งจากสาขา main ของ GitHub (npm tarball)
openclaw update --tag main

# ติดตั้ง npm package spec เฉพาะ
openclaw update --tag openclaw@2026.4.1-beta.1
```

หมายเหตุ:

- `--tag` ใช้กับ **การติดตั้งแบบ package (npm) เท่านั้น** การติดตั้งแบบ Git จะไม่สนใจค่านี้
- tag จะไม่ถูกบันทึกถาวร การเรียก `openclaw update` ครั้งถัดไปจะใช้ช่องทางที่คุณกำหนดไว้
  ตามปกติ
- การป้องกันการ downgrade: หากเวอร์ชันเป้าหมายเก่ากว่าเวอร์ชันปัจจุบันของคุณ
  OpenClaw จะขอการยืนยัน (ข้ามด้วย `--yes`)
- `--channel beta` ต่างจาก `--tag beta`: ขั้นตอนแบบ channel สามารถย้อนกลับไปใช้
  stable/latest ได้เมื่อไม่มี beta หรือ beta เก่ากว่า ส่วน `--tag beta` จะระบุเป้าหมายเป็น
  dist-tag `beta` แบบดิบสำหรับการรันครั้งนั้นเท่านั้น

## Dry run

ดูตัวอย่างว่า `openclaw update` จะทำอะไรโดยไม่แก้ไขจริง:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run จะแสดงช่องทางที่มีผล เวอร์ชันเป้าหมาย การดำเนินการที่วางแผนไว้ และ
ระบุว่าจำเป็นต้องยืนยันการ downgrade หรือไม่

## Plugins และช่องทาง

เมื่อคุณสลับช่องทางด้วย `openclaw update` OpenClaw จะซิงค์แหล่งที่มาของ Plugin
ด้วย:

- `dev` เลือกใช้ Plugin ที่ bundled มาจาก git checkout ก่อน
- `stable` และ `beta` กู้คืน package ของ Plugin ที่ติดตั้งผ่าน npm
- Plugin ที่ติดตั้งผ่าน npm จะถูกอัปเดตหลังจากการอัปเดต core เสร็จสิ้น

## การตรวจสอบสถานะปัจจุบัน

```bash
openclaw update status
```

แสดงช่องทางที่ใช้งานอยู่ ชนิดการติดตั้ง (git หรือ package) เวอร์ชันปัจจุบัน และ
แหล่งที่มา (config, git tag, git branch หรือค่าเริ่มต้น)

## แนวทางปฏิบัติที่ดีที่สุดในการ tag

- tag รุ่นที่คุณต้องการให้ git checkout ไปถึง (`vYYYY.M.D` สำหรับ stable,
  `vYYYY.M.D-beta.N` สำหรับ beta)
- `vYYYY.M.D.beta.N` ก็รองรับเพื่อความเข้ากันได้เช่นกัน แต่ควรใช้ `-beta.N`
- tag แบบเดิม `vYYYY.M.D-<patch>` ยังได้รับการยอมรับว่าเป็น stable (ไม่ใช่ beta)
- รักษา tag ให้ไม่เปลี่ยนแปลง: อย่าย้ายหรือใช้ tag ซ้ำ
- npm dist-tags ยังคงเป็นแหล่งข้อมูลจริงสำหรับการติดตั้ง npm:
  - `latest` -> stable
  - `beta` -> build ผู้ท้าชิงหรือ build stable ที่ส่งไป beta ก่อน
  - `dev` -> snapshot ของ main (ไม่บังคับ)

## ความพร้อมใช้งานของแอป macOS

build ของ Beta และ dev อาจ **ไม่มี** release ของแอป macOS ซึ่งเป็นเรื่องปกติ:

- git tag และ npm dist-tag ยังสามารถเผยแพร่ได้
- ระบุว่า "ไม่มี build ของ macOS สำหรับ beta นี้" ใน release notes หรือ changelog

## ที่เกี่ยวข้อง

- [การอัปเดต](/th/install/updating)
- [กลไกภายในของตัวติดตั้ง](/th/install/installer)
