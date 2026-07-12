---
read_when:
    - การรัน QA เดสก์ท็อป Slack ของ Mantis จาก GitHub หรือในเครื่อง
    - การแก้ไขข้อบกพร่องเมื่อ Mantis ทำงานบนเดสก์ท็อป Slack ช้า
    - การเลือกโหมดซอร์ส โหมดไฮเดรตล่วงหน้า หรือโหมดลีสพร้อมใช้งาน
    - การโพสต์หลักฐานภาพหน้าจอและวิดีโอลงใน PR
summary: 'คู่มือปฏิบัติงานสำหรับผู้ดูแลระบบในการทำ QA เดสก์ท็อป Slack ด้วย Mantis: การสั่งงานผ่าน GitHub, CLI ภายในเครื่อง, การเตรียมสัญญาเช่า VNC ให้พร้อมใช้งาน, โหมดการเติมข้อมูล, การตีความเวลา, อาร์ติแฟกต์ และการจัดการความล้มเหลว'
title: คู่มือการปฏิบัติงาน Mantis สำหรับ Slack บนเดสก์ท็อป
x-i18n:
    generated_at: "2026-07-12T16:04:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA คือช่องทางทดสอบด้วย UI จริงสำหรับบั๊กประเภท Slack ที่ต้องใช้
เดสก์ท็อป Linux, การกู้คืนผ่าน VNC, Slack Web, Gateway ของ OpenClaw จริง, ภาพหน้าจอ,
วิดีโอ และความคิดเห็นหลักฐานใน PR ใช้ช่องทางนี้เมื่อการทดสอบหน่วยหรือช่องทางทดสอบ Slack
แบบสดที่ไม่มีส่วนติดต่อผู้ใช้ไม่สามารถพิสูจน์บั๊กได้

## โมเดลการจัดเก็บ

Mantis ใช้พื้นที่จัดเก็บสามชั้น:

- **อิมเมจของผู้ให้บริการ** - Crabbox เป็นเจ้าของและจัดเก็บไว้ในบัญชีผู้ให้บริการคลาวด์
  มีความสามารถของเครื่อง (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, เครื่องมือบิลด์แบบเนทีฟ) และไดเรกทอรีแคชว่าง
- **สถานะลีสที่อุ่นพร้อมใช้** - เซสชันของผู้ปฏิบัติงานปัจจุบันเป็นเจ้าของ สามารถเก็บ
  โปรไฟล์เบราว์เซอร์ที่เข้าสู่ระบบแล้ว, `/var/cache/crabbox/pnpm` และการเช็กเอาต์ซอร์ส
  ที่เตรียมไว้ขณะที่ลีสยังทำงานอยู่
- **อาร์ติแฟกต์ของ Mantis** - การรัน OpenClaw เป็นเจ้าของ อยู่ภายใต้
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions อัปโหลดอาร์ติแฟกต์เหล่านี้ และ GitHub App
  ของ Mantis แสดงความคิดเห็นพร้อมหลักฐานแบบฝังใน PR

ห้ามฝังข้อมูลลับ, คุกกี้ของเบราว์เซอร์, สถานะการเข้าสู่ระบบ Slack, การเช็กเอาต์รีโพซิทอรี,
`node_modules` หรือ `dist/` ลงในอิมเมจของผู้ให้บริการโดยเด็ดขาด

## การสั่งงานผ่าน GitHub

เรียกใช้เวิร์กโฟลว์จาก `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` ถูกจำกัดเนื่องจากเวิร์กโฟลว์ใช้ข้อมูลประจำตัวจริง โดยต้องแก้ค่าได้เป็น
บรรพบุรุษของ `main` ปัจจุบัน, แท็กรีลีส หรือเฮดของ PR ที่เปิดอยู่ใน
`openclaw/openclaw`

เวิร์กโฟลว์สร้างสิ่งต่อไปนี้:

- อาร์ติแฟกต์ที่อัปโหลด `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- ความคิดเห็นแบบฝังใน PR จาก GitHub App ของ Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- บันทึกระยะไกล: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

ความคิดเห็นใน PR จะได้รับการอัปเดตในตำแหน่งเดิมผ่านเครื่องหมายซ่อน `<!-- mantis-slack-desktop-smoke -->`

## CLI ภายในเครื่อง

การพิสูจน์จากซอร์สบนเครื่องที่ยังไม่อุ่น:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

เก็บ VM ไว้เพื่อกู้คืนผ่าน VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

เปิด VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

ใช้ลีสที่อุ่นพร้อมใช้ซ้ำ:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อพื้นที่ทำงานระยะไกลที่นำกลับมาใช้ซ้ำมี
`node_modules` และ `dist/` ที่บิลด์แล้ว มิฉะนั้น Mantis จะหยุดทำงานแบบปิดกั้น

พิสูจน์ UI การอนุมัติแบบเนทีฟของ Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` ใช้ร่วมกับ `--gateway-setup` ไม่ได้ โดยจะรันสถานการณ์แบบเลือกรับ
`slack-approval-exec-native` และ `slack-approval-plugin-native`
เว้นแต่คุณจะส่ง `--scenario` จุดตรวจสอบการอนุมัติอย่างชัดเจน ส่วนสถานการณ์ Slack อื่น
จะถูกปฏิเสธก่อน VM เริ่มทำงาน ตัวรัน QA ของ Slack จะเขียนไฟล์ JSON ของแต่ละจุดตรวจสอบ
จากข้อความ API ของ Slack จริงที่ตรวจพบ จากนั้นตัวเฝ้าดูระยะไกลจะแสดงผลข้อความนั้นเป็น
`approval-checkpoints/<scenario>-pending.png` และ
`approval-checkpoints/<scenario>-resolved.png` การรันจะล้มเหลวหากไฟล์ JSON
ของจุดตรวจสอบ, หลักฐานข้อความ, ไฟล์ JSON การตอบรับ หรือภาพหน้าจอที่แสดงผลรายการใด
ขาดหายหรือว่างเปล่า

ลีส GitHub Actions ที่ยังไม่อุ่นไม่มีคุกกี้ของ Slack Web ดังนั้นการจับภาพจากเบราว์เซอร์
อาจไปสิ้นสุดที่หน้าลงชื่อเข้าใช้ Slack สำหรับหลักฐานจุดตรวจสอบการอนุมัติ ให้เชื่อถือ
ภาพจุดตรวจสอบที่แสดงผลและอาร์ติแฟกต์ QA ของ Slack แทน
`slack-desktop-smoke.png` ใช้ลีสที่อุ่นพร้อมใช้ซึ่งเก็บไว้และมีโปรไฟล์ Slack Web
ที่เข้าสู่ระบบด้วยตนเองแล้ว เฉพาะเมื่อภาพหน้าจอของเบราว์เซอร์ต้องแสดง Slack Web
โดยตรงเท่านั้น

## โหมดการเตรียมสภาพแวดล้อม

| โหมด          | ใช้เมื่อ                                  | พฤติกรรมระยะไกล                                                                       | ข้อแลกเปลี่ยน                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | การพิสูจน์ PR ปกติ, เครื่องที่ยังไม่อุ่น, CI        | รัน `pnpm install --frozen-lockfile --prefer-offline` และ `pnpm build` ภายใน VM | ช้าที่สุด แต่ให้หลักฐานจากการเช็กเอาต์ซอร์สที่แข็งแรงที่สุด                 |
| `prehydrated` | คุณตั้งใจเตรียมลีสที่นำกลับมาใช้ซ้ำไว้แล้ว | ต้องมี `node_modules` และ `dist/` อยู่แล้ว และข้ามการติดตั้ง/บิลด์                     | รวดเร็ว แต่ใช้ได้เฉพาะกับลีสที่อุ่นพร้อมใช้ซึ่งผู้ปฏิบัติงานควบคุม |

GitHub Actions จะเตรียมการเช็กเอาต์ตัวเลือกก่อนรัน VM เสมอ โดยแคชที่เก็บ pnpm
ตามระบบปฏิบัติการ, เวอร์ชัน Node และไฟล์ล็อก การรัน `source` ใน VM
จะใช้ `/var/cache/crabbox/pnpm` ซ้ำด้วยเมื่อมีอยู่

## การตีความระยะเวลา

`mantis-slack-desktop-smoke-report.md` มีระยะเวลาของแต่ละช่วง:

- `crabbox.warmup` - การบูตของผู้ให้บริการคลาวด์, ความพร้อมของเดสก์ท็อป/เบราว์เซอร์ และ SSH
- `crabbox.inspect` - การค้นหาข้อมูลเมตาของลีส
- `credentials.prepare` - การขอลีสข้อมูลประจำตัวจาก Convex
- `crabbox.remote_run` - การซิงค์, การเปิดเบราว์เซอร์, การติดตั้ง/บิลด์ OpenClaw หรือ
  การตรวจสอบการเตรียมสภาพแวดล้อม, การเริ่ม Gateway, การจับภาพหน้าจอ และการบันทึกวิดีโอ
- `artifacts.copy` - การใช้ rsync คัดลอกกลับจาก VM

`crabbox.remote_run` อาจแสดง `accepted` เมื่อ Crabbox ส่งคืนสถานะระยะไกลที่ไม่ใช่ศูนย์
แต่ Mantis คัดลอกข้อมูลเมตาที่พิสูจน์ได้ว่าการตั้งค่า Gateway ของ OpenClaw เสร็จสมบูรณ์
หรือคำสั่ง QA ของ Slack เองออกจากการทำงานสำเร็จ ให้ถือว่า `accepted` คือผ่านพร้อมคำอธิบาย
ไม่ใช่สถานการณ์ที่ล้มเหลว

หากการรันช้า:

- หากช่วงอุ่นเครื่องใช้เวลาส่วนใหญ่: อบล่วงหน้าหรือเลื่อนระดับอิมเมจผู้ให้บริการ Crabbox ที่ดีกว่า
- หาก `remote_run` ใช้เวลาส่วนใหญ่ใน `source`: ใช้ลีสที่อุ่นพร้อมใช้, ปรับปรุงการใช้ที่เก็บ pnpm
  ซ้ำ หรือย้ายสิ่งที่เครื่องต้องมีล่วงหน้าไปยังอิมเมจของผู้ให้บริการ
- หาก `remote_run` ใช้เวลาส่วนใหญ่ใน `prehydrated`: พื้นที่ทำงานระยะไกลยังไม่พร้อมจริง
  หรือการตั้งค่า Gateway/เบราว์เซอร์/Slack ทำงานช้า
- หากการคัดลอกอาร์ติแฟกต์ใช้เวลาส่วนใหญ่: ตรวจสอบขนาดวิดีโอและเนื้อหาในไดเรกทอรีอาร์ติแฟกต์

## รายการตรวจสอบหลักฐาน

ความคิดเห็นใน PR ที่ดีควรแสดง:

- รหัสสถานการณ์และ SHA ของตัวเลือก
- URL การรัน GitHub Actions และ URL อาร์ติแฟกต์
- ภาพหน้าจอจุดตรวจสอบการอนุมัติแบบฝัง หรือภาพหน้าจอ Slack Web จากลีสที่อุ่นพร้อมใช้
  ซึ่งเข้าสู่ระบบแล้ว
- ตัวอย่างภาพเคลื่อนไหวแบบฝังเมื่อมี
- ลิงก์ MP4 ฉบับเต็มและ MP4 ที่ตัดแต่งแล้ว
- สถานะผ่าน/ไม่ผ่านและสรุประยะเวลาจากรายงาน

อย่าคอมมิตภาพหน้าจอหรือวิดีโอลงในรีโพซิทอรี ให้เก็บไว้ในอาร์ติแฟกต์ของ GitHub
Actions หรือความคิดเห็นใน PR

## การจัดการความล้มเหลว

หากเวิร์กโฟลว์ล้มเหลวก่อนรัน VM ให้ตรวจสอบงาน Actions ก่อน
สาเหตุทั่วไป ได้แก่ `candidate_ref` ที่ไม่น่าเชื่อถือ, ข้อมูลลับของสภาพแวดล้อมที่ขาดหาย
หรือการติดตั้ง/บิลด์ตัวเลือกที่ล้มเหลว

หากการรัน VM ล้มเหลวแต่คัดลอกภาพหน้าจอกลับมาแล้ว ให้ตรวจสอบ:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

หากการรันเก็บลีสไว้ ให้เปิด VNC ด้วยคำสั่ง `crabbox vnc ...` จากรายงาน
จากนั้นหยุดลีสเมื่อเสร็จ:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

หากการเข้าสู่ระบบ Slack หมดอายุ ให้แก้ไขผ่าน VNC บนลีสที่เก็บไว้ แล้วรันซ้ำด้วย
`--lease-id` อย่าฝังโปรไฟล์เบราว์เซอร์นั้นลงในอิมเมจของผู้ให้บริการ

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวม QA](/th/concepts/qa-e2e-automation)
- [ช่องทาง Slack](/th/channels/slack)
- [การทดสอบ](/th/help/testing)
