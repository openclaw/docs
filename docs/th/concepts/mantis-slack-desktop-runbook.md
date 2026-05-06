---
read_when:
    - การรัน QA เดสก์ท็อปของ Mantis Slack จาก GitHub หรือในเครื่อง
    - การดีบักการรัน Mantis Slack บนเดสก์ท็อปที่ช้า
    - การเลือกโหมดแหล่งที่มา, เติมข้อมูลไว้ล่วงหน้า หรือสัญญาเช่าแบบพร้อมใช้งาน
    - การโพสต์หลักฐานภาพหน้าจอและวิดีโอไปยัง PR
summary: 'คู่มือปฏิบัติงานสำหรับผู้ปฏิบัติการ QA เดสก์ท็อป Mantis Slack: การ dispatch ของ GitHub, CLI ภายในเครื่อง, lease VNC ที่วอร์มไว้, โหมด hydrate, การตีความเวลา, อาร์ติแฟกต์ และการจัดการความล้มเหลว.'
title: คู่มือปฏิบัติการสำหรับ Slack บนเดสก์ท็อปของ Mantis
x-i18n:
    generated_at: "2026-05-06T09:08:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA คือเลน UI จริงสำหรับบั๊กระดับเดียวกับ Slack ที่ต้องใช้
เดสก์ท็อป Linux, VNC สำหรับกู้คืน, Slack Web, Gateway ของ OpenClaw จริง, ภาพหน้าจอ,
วิดีโอ และคอมเมนต์หลักฐานใน PR

ใช้เมื่อ unit test หรือเลน Slack live แบบ headless ไม่สามารถพิสูจน์บั๊กได้

## โมเดลการจัดเก็บ

Mantis ใช้เลเยอร์การจัดเก็บที่แตกต่างกันสามชั้น:

- อิมเมจของผู้ให้บริการ: Crabbox เป็นเจ้าของและจัดเก็บในบัญชีผู้ให้บริการคลาวด์
  ภายในมีความสามารถของเครื่อง เช่น Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, เครื่องมือ native build และไดเรกทอรีแคชว่าง
- สถานะ lease ที่อุ่นไว้: เซสชัน operator ปัจจุบันเป็นเจ้าของ สามารถมี
  โปรไฟล์เบราว์เซอร์ที่ล็อกอินแล้ว, `/var/cache/crabbox/pnpm` และ source
  checkout ที่เตรียมไว้ขณะที่ lease ยังมีชีวิตอยู่
- อาร์ทิแฟกต์ของ Mantis: งานรันของ OpenClaw เป็นเจ้าของ อยู่ภายใต้
  `.artifacts/qa-e2e/mantis/...` จากนั้น GitHub Actions จะอัปโหลด และ
  Mantis GitHub App จะคอมเมนต์หลักฐานแบบ inline ใน PR

ห้ามใส่ความลับ, คุกกี้เบราว์เซอร์, สถานะการล็อกอิน Slack, repository checkouts,
`node_modules` หรือ `dist/` ลงในอิมเมจผู้ให้บริการที่อบไว้ล่วงหน้า

## การ dispatch ของ GitHub

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

ค่า `candidate_ref` ที่อนุญาตถูกจำกัดอย่างตั้งใจ เพราะ workflow
ใช้ credentials จริง: บรรพบุรุษของ `main` ปัจจุบัน, release tags หรือ head ของ PR ที่เปิดอยู่
จาก `openclaw/openclaw`

workflow เขียน:

- อาร์ทิแฟกต์ที่อัปโหลด: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- คอมเมนต์ PR แบบ inline จาก Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- log ระยะไกล เช่น `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` และ `ffmpeg.log`

คอมเมนต์ PR จะถูกอัปเดตที่เดิมด้วย marker ที่ซ่อนอยู่
`<!-- mantis-slack-desktop-smoke -->`

## CLI ภายในเครื่อง

หลักฐานแบบ cold source:

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

ใช้ lease ที่อุ่นไว้ซ้ำ:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

ใช้ `--hydrate-mode prehydrated` เฉพาะเมื่อ workspace ระยะไกลที่นำกลับมาใช้ซ้ำนั้น
มี `node_modules` และ `dist/` ที่ build แล้ว Mantis จะ fail closed หากสิ่งเหล่านั้น
ขาดหายไป

## โหมด Hydrate

| โหมด          | ใช้เมื่อ                                  | พฤติกรรมระยะไกล                                                                       | ข้อแลกเปลี่ยน                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | หลักฐาน PR ปกติ, เครื่อง cold, CI        | รัน `pnpm install --frozen-lockfile --prefer-offline` และ `pnpm build` ภายใน VM | ช้าที่สุด, เป็นหลักฐาน source-checkout ที่แข็งแรงที่สุด                 |
| `prehydrated` | คุณตั้งใจเตรียม lease ที่นำกลับมาใช้ซ้ำ | ต้องมี `node_modules` และ `dist/` อยู่แล้ว; ข้าม install/build                     | เร็ว แต่ใช้ได้เฉพาะกับ warm leases ที่ operator ควบคุม |

GitHub Actions จะเตรียม candidate checkout ก่อนการรัน VM เสมอ
pnpm store ของมันถูกแคชตาม OS, เวอร์ชัน Node และ lockfile การรัน source ใน VM ยัง
ใช้ `/var/cache/crabbox/pnpm` เมื่อมีอยู่ด้วย

## การตีความเวลา

`mantis-slack-desktop-smoke-report.md` รวมเวลาของแต่ละเฟส:

- `crabbox.warmup`: การ boot ของผู้ให้บริการคลาวด์, ความพร้อมของ desktop/browser และ SSH
- `crabbox.inspect`: การค้นหา metadata ของ lease
- `credentials.prepare`: การได้มาซึ่ง lease ของ credential จาก Convex
- `crabbox.remote_run`: sync, การเปิดเบราว์เซอร์, การ install/build ของ OpenClaw หรือ
  การตรวจสอบ hydrate, การเริ่มต้น Gateway, ภาพหน้าจอ และการจับวิดีโอ
- `artifacts.copy`: rsync กลับจาก VM

`crabbox.remote_run` สามารถถูกทำเครื่องหมายเป็น `accepted` เมื่อ Crabbox ส่งคืนสถานะระยะไกลที่ไม่ใช่ศูนย์
หลังจาก Mantis คัดลอก metadata ที่พิสูจน์ว่า Gateway ของ OpenClaw
ยังมีชีวิตอยู่และการตั้งค่าเสร็จสมบูรณ์แล้ว ให้ถือว่า `accepted` เป็น pass-with-explanation
ไม่ใช่ scenario ที่ล้มเหลว

หากการรันช้า:

- warmup ใช้เวลามากที่สุด: อบอิมเมจล่วงหน้าหรือโปรโมตอิมเมจผู้ให้บริการ Crabbox ที่ดีกว่า;
- remote_run ใช้เวลามากที่สุดใน `source`: ใช้ warm lease, ปรับปรุงการใช้ pnpm store ซ้ำ
  หรือย้าย prerequisites ของเครื่องเข้าไปในอิมเมจผู้ให้บริการ;
- remote_run ใช้เวลามากที่สุดใน `prehydrated`: workspace ระยะไกลยังไม่พร้อมจริง
  หรือการตั้งค่า gateway/browser/Slack ช้า;
- การคัดลอกอาร์ทิแฟกต์ใช้เวลามากที่สุด: ตรวจสอบขนาดวิดีโอและเนื้อหาในไดเรกทอรีอาร์ทิแฟกต์

## เช็กลิสต์หลักฐาน

คอมเมนต์ PR ที่ดีควรแสดง:

- scenario id และ candidate SHA;
- URL ของ GitHub Actions run;
- URL ของอาร์ทิแฟกต์;
- ภาพหน้าจอแบบ inline;
- animated preview แบบ inline เมื่อมี;
- ลิงก์ MP4 เต็มและ MP4 ที่ตัดแล้ว;
- สถานะผ่าน/ล้มเหลว;
- สรุปเวลาในรายงานที่แนบมา

อย่า commit ภาพหน้าจอหรือวิดีโอลงใน repository ให้เก็บไว้ในอาร์ทิแฟกต์ของ GitHub
Actions หรือคอมเมนต์ PR

## การจัดการความล้มเหลว

หาก workflow ล้มเหลวก่อนการรัน VM ให้ตรวจสอบ job ของ Actions ก่อน สาเหตุทั่วไป
คือ `candidate_ref` ที่ไม่น่าเชื่อถือ, environment secrets ที่ขาดหาย หรือ candidate
install/build ล้มเหลว

หากการรัน VM ล้มเหลวแต่ภาพหน้าจอถูกคัดลอกกลับมาแล้ว ให้ตรวจสอบ:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

หากการรันเก็บ lease ไว้ ให้เปิด VNC ด้วยคำสั่ง `crabbox vnc ...` ในรายงาน
หยุด lease เมื่อเสร็จแล้ว:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

หากการล็อกอิน Slack หมดอายุ ให้ซ่อมใน VNC บน lease ที่เก็บไว้และรันซ้ำด้วย
`--lease-id` อย่าอบโปรไฟล์เบราว์เซอร์นั้นลงในอิมเมจผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวม QA](/th/concepts/qa-e2e-automation)
- [ช่องทาง Slack](/th/channels/slack)
- [การทดสอบ](/th/help/testing)
