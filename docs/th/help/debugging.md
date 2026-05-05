---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูระหว่างการปรับแก้ซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู, สตรีมโมเดลดิบ และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-05T01:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อ provider ผสมการให้เหตุผลเข้ากับข้อความปกติ

## การ override ดีบักขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่า override ของคอนฟิกแบบ **เฉพาะรันไทม์** (หน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยพบโดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้าง override ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่ Plugin เป็นเจ้าของในหนึ่งเซสชัน
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่น สรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับสถานะ verbose ปกติ/เอาต์พุตเครื่องมือ และใช้
`/debug` ต่อไปสำหรับ override คอนฟิกแบบเฉพาะรันไทม์

## Trace วงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแจกแจงเฟสในตัวสำหรับเมตาดาต้า Plugin, discovery, registry,
runtime mirror, การปรับคอนฟิก และงาน refresh trace นี้เป็นแบบ opt-in และเขียน
ไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON ยังคง parse ได้

ตัวอย่าง:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

ตัวอย่างเอาต์พุต:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

ใช้สิ่งนี้สำหรับการตรวจสอบวงจรชีวิต Plugin ก่อนหันไปใช้ CPU profiler
ถ้าคำสั่งรันจาก source checkout ให้เลือกวัดรันไทม์ที่ build แล้วด้วย
`node dist/entry.js ...` หลังจาก `pnpm build`; `pnpm openclaw ...`
ยังวัด overhead ของ source-runner ด้วย

## การ profiling ตอนเริ่ม CLI และคำสั่ง

ใช้ benchmark การเริ่มต้นที่อยู่ใน repo เมื่อคำสั่งรู้สึกช้า:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการ profiling แบบครั้งเดียวผ่าน source runner ปกติ ให้ตั้งค่า
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner จะเพิ่มแฟล็ก CPU profile ของ Node และเขียน `.cpuprofile` สำหรับ
คำสั่ง ใช้สิ่งนี้ก่อนเพิ่ม instrumentation ชั่วคราวลงในโค้ดคำสั่ง

สำหรับการค้างตอนเริ่มที่ดูเหมือนงาน filesystem แบบ synchronous หรือ module-loader
ให้เพิ่มแฟล็ก trace sync I/O ของ Node ผ่าน source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` เปิดใช้แฟล็กนี้โดยค่าเริ่มต้นสำหรับ child ของ Gateway ที่ถูก watch
ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=0` เพื่อระงับเอาต์พุต trace sync I/O ของ Node ในโหมด watch

## โหมด watch ของ Gateway

สำหรับการวนแก้เร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จากเทอร์มินัลแบบ interactive
เชลล์แบบ non-interactive, CI, และการเรียก exec ของ agent จะยังคง detached และพิมพ์
คำแนะนำการ attach แทน attach ด้วยตนเองเมื่อจำเป็น:

```bash
tmux attach -t openclaw-gateway-watch-main
```

pane ของ tmux รัน watcher แบบดิบ:

```bash
node scripts/watch-node.mjs gateway --force
```

ใช้โหมด foreground เมื่อไม่ต้องการ tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

ปิด auto-attach โดยยังคงการจัดการ tmux ไว้:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profile เวลา CPU ของ Gateway ที่ถูก watch เมื่อดีบัก hotspot ตอนเริ่ม/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

wrapper ของ watch จะใช้ `--benchmark` ก่อนเรียก Gateway และเขียน
V8 `.cpuprofile` หนึ่งไฟล์ต่อการ exit ของ child Gateway ภายใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต gateway ที่ถูก watch เพื่อ
flush profile ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อคุณต้องการเก็บ profile ไว้ที่อื่น
ใช้ `--benchmark-no-force` เมื่อคุณต้องการให้ child ที่ benchmark ข้ามการ cleanup port
เริ่มต้น `--force` และล้มเหลวอย่างรวดเร็วถ้า port ของ Gateway ถูกใช้งานอยู่แล้ว
โหมด benchmark ระงับ spam ของ trace sync-I/O โดยค่าเริ่มต้น ตั้งค่า
`OPENCLAW_TRACE_SYNC_IO=1` พร้อม `--benchmark` เมื่อคุณต้องการทั้ง CPU
profiles และ stack traces sync-I/O ของ Node อย่างชัดเจน ในโหมด benchmark บล็อก trace เหล่านั้น
จะถูกเขียนไปยัง `gateway-watch-output.log` ภายใต้ไดเรกทอรี benchmark และถูกกรองออกจาก
pane ของเทอร์มินัล; log ปกติของ Gateway ยังคงมองเห็นได้

wrapper ของ tmux ส่ง runtime selector ทั่วไปที่ไม่ใช่ความลับ เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
ข้อมูลรับรอง provider ไว้ใน profile/config ปกติของคุณ หรือใช้โหมด foreground แบบดิบ
สำหรับความลับชั่วคราวแบบครั้งเดียว
ถ้า Gateway ที่ถูก watch exit ระหว่างการเริ่มต้น watcher จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งและรีสตาร์ต child ของ Gateway
ใช้ `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เมื่อคุณต้องการความล้มเหลวตอนเริ่มต้นเดิม
โดยไม่มี pass ซ่อมแซมสำหรับ dev เท่านั้น
pane ของ tmux ที่จัดการไว้ยังใช้ log Gateway แบบมีสีเป็นค่าเริ่มต้นเพื่อให้อ่านง่าย;
ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับ build ภายใต้ `src/`, ไฟล์ source ของ extension,
เมตาดาต้า `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json`, และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลงเมตาดาต้า extension จะรีสตาร์ต
gateway โดยไม่บังคับ rebuild `tsdown`; การเปลี่ยนแปลง source และ config ยังคง
rebuild `dist` ก่อน

เพิ่มแฟล็ก CLI ของ gateway ใดๆ หลัง `gateway:watch` และแฟล็กเหล่านั้นจะถูกส่งต่อใน
ทุกการรีสตาร์ต การรันคำสั่ง watch เดิมซ้ำจะ respawn pane tmux ที่ตั้งชื่อไว้ และ
watcher แบบดิบยังคงรักษา lock แบบ single-watcher เพื่อให้ watcher parent ที่ซ้ำกัน
ถูกแทนที่แทนที่จะสะสมเพิ่มขึ้น

## Dev profile + dev gateway (--dev)

ใช้ dev profile เพื่อแยก state และเริ่มชุดตั้งค่าที่ปลอดภัยและทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` **สอง** แบบ:

- **Global `--dev` (profile):** แยก state ไว้ภายใต้ `~/.openclaw-dev` และ
  ตั้งค่า port ของ gateway เป็น `19001` ตามค่าเริ่มต้น (port ที่ derived จะเลื่อนตาม)
- **`gateway --dev`: บอก Gateway ให้สร้างคอนฟิกเริ่มต้น +
  workspace โดยอัตโนมัติ** เมื่อไม่มีอยู่ (และข้าม BOOTSTRAP.md)

flow ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

ถ้าคุณยังไม่มีการติดตั้ง global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งนี้ทำอะไร:

1. **การแยก Profile** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำถ้ายังไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้งค่า `agent.workspace` เป็น dev workspace
   - ตั้งค่า `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - seed ไฟล์ workspace ถ้ายังไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3‑PO** (protocol droid)
   - ข้าม channel providers ในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

flow รีเซ็ต (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็ก profile แบบ **global** และถูก runner บางตัวกินไป ถ้าคุณต้องการระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้างคอนฟิก, ข้อมูลรับรอง, เซสชัน, และ dev workspace (โดยใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างชุดตั้งค่า dev เริ่มต้นใหม่

<Tip>
ถ้า gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึก raw stream (OpenClaw)

OpenClaw สามารถ log **สตรีม assistant ดิบ** ก่อนการกรอง/จัดรูปแบบใดๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่าการให้เหตุผลมาถึงเป็น plain text deltas
(หรือเป็น thinking blocks แยกต่างหาก)

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

path override ที่เป็นทางเลือก:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

env vars ที่เทียบเท่า:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การบันทึก chunk ดิบ (pi-mono)

เพื่อจับ **chunk ดิบที่เข้ากันได้กับ OpenAI** ก่อนที่จะถูก parse เป็นบล็อก
pi-mono มี logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

path ที่เป็นทางเลือก:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: สิ่งนี้ถูก emit โดย process ที่ใช้ provider
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- log raw stream อาจรวม prompt เต็ม, เอาต์พุตเครื่องมือ, และข้อมูลผู้ใช้
- เก็บ log ไว้ในเครื่องและลบหลังจากดีบักเสร็จ
- ถ้าคุณแชร์ log ให้ลบความลับและ PII ออกก่อน

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
