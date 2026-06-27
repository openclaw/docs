---
read_when:
    - เรียกใช้ QA เดสก์ท็อป Slack ของ Mantis จาก GitHub หรือในเครื่อง
    - การดีบักการรันเดสก์ท็อป Slack ของ Mantis ที่ช้า
    - การเลือกโหมดซอร์ส, prehydrated หรือ warm-lease
    - การโพสต์หลักฐานภาพหน้าจอและวิดีโอไปยัง PR
summary: 'คู่มือปฏิบัติงานสำหรับผู้ควบคุมสำหรับ QA เดสก์ท็อป Mantis Slack: GitHub dispatch, CLI ภายในเครื่อง, สัญญาเช่า VNC ที่อุ่นไว้, โหมด hydrate, การตีความเวลา, artifacts และการจัดการความล้มเหลว.'
title: รันบุ๊กเดสก์ท็อป Slack ของ Mantis
x-i18n:
    generated_at: "2026-06-27T17:26:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA คือเลน UI จริงสำหรับบั๊กระดับเดียวกับ Slack ที่ต้องใช้
เดสก์ท็อป Linux, การกู้คืนผ่าน VNC, Slack Web, Gateway OpenClaw จริง, ภาพหน้าจอ,
วิดีโอ และคอมเมนต์หลักฐานบน PR

ใช้เมื่อ unit test หรือเลน Slack live แบบ headless ไม่สามารถพิสูจน์บั๊กได้

## โมเดลการจัดเก็บ

Mantis ใช้เลเยอร์การจัดเก็บที่แตกต่างกันสามชั้น:

- อิมเมจผู้ให้บริการ: Crabbox เป็นเจ้าของและจัดเก็บไว้ในบัญชีผู้ให้บริการคลาวด์
  ภายในมีความสามารถของเครื่อง เช่น Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, เครื่องมือ build แบบ native และไดเรกทอรีแคชว่าง
- สถานะ lease อุ่น: เซสชันผู้ปฏิบัติงานปัจจุบันเป็นเจ้าของ อาจมีโปรไฟล์เบราว์เซอร์
  ที่เข้าสู่ระบบแล้ว, `/var/cache/crabbox/pnpm` และ checkout ซอร์สที่เตรียมไว้
  ขณะที่ lease ยังมีชีวิตอยู่
- อาร์ติแฟกต์ Mantis: รัน OpenClaw เป็นเจ้าของ อยู่ใต้
  `.artifacts/qa-e2e/mantis/...` จากนั้น GitHub Actions จะอัปโหลด และ
  Mantis GitHub App จะคอมเมนต์หลักฐานแบบ inline บน PR

ห้ามใส่ secrets, คุกกี้เบราว์เซอร์, สถานะการเข้าสู่ระบบ Slack, checkout ของ repository,
`node_modules` หรือ `dist/` ลงในอิมเมจผู้ให้บริการที่ prebake ไว้

## GitHub dispatch

รัน workflow จาก `main`:

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

ค่า `candidate_ref` ที่อนุญาตถูกจำกัดโดยตั้งใจ เพราะ workflow
ใช้ข้อมูลรับรอง live: ancestry ของ `main` ปัจจุบัน, release tags หรือ head ของ PR ที่เปิดอยู่
จาก `openclaw/openclaw`

workflow จะเขียน:

- อาร์ติแฟกต์ที่อัปโหลด: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- คอมเมนต์ PR แบบ inline จาก Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- ล็อก remote เช่น `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` และ `ffmpeg.log`

คอมเมนต์ PR จะถูกอัปเดตในตำแหน่งเดิมด้วย marker ที่ซ่อนอยู่
`<!-- mantis-slack-desktop-smoke -->`

## CLI ภายในเครื่อง

หลักฐานซอร์สแบบ cold:

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

เก็บ VM ไว้สำหรับการกู้คืนผ่าน VNC:

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

ใช้ lease อุ่นซ้ำ:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace remote ที่ใช้ซ้ำมี
`node_modules` และ `dist/` ที่ build แล้วเท่านั้น Mantis จะ fail closed หากสิ่งเหล่านี้
หายไป

พิสูจน์ UI การอนุมัติ native ของ Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

โหมด approval checkpoint ใช้ร่วมกับ `--gateway-setup` ไม่ได้ โดยจะรัน scenario
แบบ opt-in `slack-approval-exec-native` และ `slack-approval-plugin-native`
เว้นแต่คุณจะส่ง flag `--scenario` สำหรับ approval checkpoint อย่างชัดเจน; scenario Slack อื่น
จะถูกปฏิเสธก่อน VM เริ่มทำงาน Slack QA runner จะเขียนไฟล์ JSON ของแต่ละ checkpoint
จากข้อความ Slack API จริงที่ตรวจพบ จากนั้น watcher บน remote จะแสดงผล snapshot
ข้อความนั้นเป็น `approval-checkpoints/<scenario>-pending.png` และ
`approval-checkpoints/<scenario>-resolved.png` รันจะล้มเหลวหาก checkpoint
JSON, หลักฐานข้อความ, ack JSON หรือภาพหน้าจอที่เรนเดอร์ใด ๆ หายไปหรือว่างเปล่า

lease แบบ cold ของ GitHub Actions ไม่มีคุกกี้ Slack Web ดังนั้นการจับภาพเบราว์เซอร์
อาจไปจบที่หน้าเข้าสู่ระบบ Slack สำหรับหลักฐาน approval checkpoint ให้เชื่อถือ
ภาพ checkpoint ที่เรนเดอร์แล้วและอาร์ติแฟกต์ Slack QA แทน
`slack-desktop-smoke.png` ใช้ lease อุ่นที่เก็บไว้พร้อมโปรไฟล์ Slack Web
ที่เข้าสู่ระบบด้วยตนเอง เฉพาะเมื่อภาพหน้าจอเบราว์เซอร์จำเป็นต้องแสดง Slack Web เอง

## โหมด hydrate

| โหมด          | ใช้เมื่อ                                  | พฤติกรรมบน remote                                                                       | ข้อแลกเปลี่ยน                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | หลักฐาน PR ปกติ, เครื่อง cold, CI        | รัน `pnpm install --frozen-lockfile --prefer-offline` และ `pnpm build` ภายใน VM | ช้าที่สุด แต่ให้หลักฐานจาก source checkout แข็งแรงที่สุด                 |
| `prehydrated` | คุณตั้งใจเตรียม lease ที่ใช้ซ้ำไว้แล้ว | ต้องมี `node_modules` และ `dist/` อยู่แล้ว; ข้าม install/build                     | เร็ว แต่ใช้ได้เฉพาะกับ lease อุ่นที่ผู้ปฏิบัติงานควบคุม |

GitHub Actions จะเตรียม candidate checkout ก่อนรัน VM เสมอ pnpm store ของมัน
จะถูกแคชตาม OS, เวอร์ชัน Node และ lockfile รันซอร์สบน VM ยังใช้
`/var/cache/crabbox/pnpm` เมื่อมีอยู่ด้วย

## การตีความเวลา

`mantis-slack-desktop-smoke-report.md` มีเวลาของแต่ละ phase:

- `crabbox.warmup`: การ boot ผู้ให้บริการคลาวด์, ความพร้อมของเดสก์ท็อป/เบราว์เซอร์ และ SSH
- `crabbox.inspect`: การค้นหา metadata ของ lease
- `credentials.prepare`: การได้มาของ lease ข้อมูลรับรอง Convex
- `crabbox.remote_run`: sync, เปิดเบราว์เซอร์, install/build OpenClaw หรือ
  ตรวจสอบ hydrate, เริ่ม Gateway, ภาพหน้าจอ และการจับภาพวิดีโอ
- `artifacts.copy`: rsync กลับจาก VM

`crabbox.remote_run` อาจถูกทำเครื่องหมายเป็น `accepted` เมื่อ Crabbox ส่งคืนสถานะ
remote ที่ไม่ใช่ศูนย์หลังจาก Mantis คัดลอก metadata ที่พิสูจน์ว่า setup ของ Gateway
OpenClaw เสร็จสมบูรณ์แล้ว หรือคำสั่ง Slack QA เองออกสำเร็จ
ให้ถือว่า `accepted` เป็นผ่านพร้อมคำอธิบาย ไม่ใช่ scenario ที่ล้มเหลว

หากรันช้า:

- warmup เป็นส่วนหลัก: prebake หรือ promote อิมเมจผู้ให้บริการ Crabbox ที่ดีกว่า;
- remote_run เป็นส่วนหลักใน `source`: ใช้ lease อุ่น, ปรับปรุงการใช้ pnpm store ซ้ำ
  หรือย้ายข้อกำหนดของเครื่องเข้าไปในอิมเมจผู้ให้บริการ;
- remote_run เป็นส่วนหลักใน `prehydrated`: workspace remote ยังไม่พร้อมจริง
  หรือ setup ของ Gateway/เบราว์เซอร์/Slack ช้า;
- artifact copy เป็นส่วนหลัก: ตรวจสอบขนาดวิดีโอและเนื้อหาของไดเรกทอรีอาร์ติแฟกต์

## เช็กลิสต์หลักฐาน

คอมเมนต์ PR ที่ดีควรแสดง:

- id ของ scenario และ candidate SHA;
- URL รัน GitHub Actions;
- URL อาร์ติแฟกต์;
- ภาพหน้าจอ approval checkpoint แบบ inline หรือภาพหน้าจอ Slack Web จาก lease อุ่น
  ที่เข้าสู่ระบบแล้ว;
- preview แบบเคลื่อนไหว inline เมื่อมี;
- ลิงก์ MP4 เต็มและ MP4 ที่ตัดแล้ว;
- สถานะผ่าน/ล้มเหลว;
- สรุปเวลาในรายงานที่แนบมา

ห้าม commit ภาพหน้าจอหรือวิดีโอลงใน repository ให้เก็บไว้ในอาร์ติแฟกต์ของ GitHub
Actions หรือในคอมเมนต์ PR

## การจัดการความล้มเหลว

หาก workflow ล้มเหลวก่อนรัน VM ให้ตรวจสอบงาน Actions ก่อน สาเหตุทั่วไปคือ
`candidate_ref` ที่ไม่น่าเชื่อถือ, environment secrets หายไป หรือ candidate
install/build ล้มเหลว

หากรัน VM ล้มเหลวแต่คัดลอกภาพหน้าจอกลับมาแล้ว ให้ตรวจสอบ:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

หากรันเก็บ lease ไว้ ให้เปิด VNC ด้วยคำสั่ง `crabbox vnc ...` จากรายงาน
หยุด lease เมื่อเสร็จแล้ว:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

หากการเข้าสู่ระบบ Slack หมดอายุ ให้ซ่อมใน VNC บน lease ที่เก็บไว้ แล้วรันซ้ำด้วย
`--lease-id` ห้าม bake โปรไฟล์เบราว์เซอร์นั้นลงในอิมเมจผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวม QA](/th/concepts/qa-e2e-automation)
- [ช่องทาง Slack](/th/channels/slack)
- [การทดสอบ](/th/help/testing)
