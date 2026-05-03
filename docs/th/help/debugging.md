---
read_when:
    - คุณจำเป็นต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของกระบวนการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูการเปลี่ยนแปลงระหว่างปรับแก้แบบวนซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือสำหรับการดีบัก: โหมดเฝ้าดู, สตรีมดิบจากโมเดล และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-03T21:34:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยสำหรับดีบักเอาต์พุตสตรีม โดยเฉพาะเมื่อผู้ให้บริการผสมเหตุผลเข้ากับข้อความปกติ

## การ override ดีบักขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่า override เฉพาะรันไทม์ (ในหน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.debug: true`
มีประโยชน์เมื่อต้องสลับการตั้งค่าที่ไม่ค่อยพบโดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` ล้าง override ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อต้องการดูบรรทัด trace/ดีบักที่ Plugin เป็นเจ้าของในเซสชันเดียว
โดยไม่ต้องเปิดโหมด verbose แบบเต็ม

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่น สรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับเอาต์พุตสถานะ/เครื่องมือแบบ verbose ตามปกติ และใช้
`/debug` ต่อไปสำหรับการ override คอนฟิกเฉพาะรันไทม์

## trace วงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแยกเฟสในตัวสำหรับ metadata ของ Plugin, การค้นหา, registry,
runtime mirror, การกลายคอนฟิก และงาน refresh trace นี้ต้องเลือกเปิดเองและเขียน
ไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON จึงยัง parse ได้

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

ใช้สิ่งนี้สำหรับการตรวจสอบวงจรชีวิต Plugin ก่อนจะใช้ CPU profiler
หากคำสั่งกำลังรันจาก source checkout ให้แนะนำให้วัดรันไทม์ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; `pnpm openclaw ...`
ยังวัดโอเวอร์เฮดของ source-runner ด้วย

## การ profiling การเริ่มต้น CLI และคำสั่ง

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

source runner จะเพิ่มแฟล็ก Node CPU profile และเขียน `.cpuprofile` สำหรับ
คำสั่ง ใช้สิ่งนี้ก่อนเพิ่ม instrumentation ชั่วคราวลงในโค้ดคำสั่ง

## โหมด watch ของ Gateway

สำหรับการวนแก้ไขที่รวดเร็ว ให้รัน Gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จากเทอร์มินัลแบบ interactive
เชลล์ non-interactive, CI และการเรียก exec ของ agent จะยัง detached และพิมพ์
คำแนะนำการ attach แทน attach เองเมื่อต้องการ:

```bash
tmux attach -t openclaw-gateway-watch-main
```

pane ของ tmux รัน watcher ดิบ:

```bash
node scripts/watch-node.mjs gateway --force
```

ใช้โหมด foreground เมื่อไม่ต้องการ tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

ปิด auto-attach โดยยังคงให้ tmux จัดการอยู่:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profile เวลา CPU ของ Gateway ที่ถูก watch เมื่อต้องดีบักจุดร้อนของการเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

watch wrapper จะใช้ `--benchmark` ก่อนเรียก Gateway และเขียน V8 `.cpuprofile`
หนึ่งไฟล์ต่อการออกของ child Gateway แต่ละครั้งภายใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต Gateway ที่ถูก watch เพื่อ
flush profile ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อต้องการให้ profile อยู่ที่อื่น
ใช้ `--benchmark-no-force` เมื่อต้องการให้ child ที่ benchmark ข้ามการ cleanup port
เริ่มต้น `--force` และล้มเหลวอย่างรวดเร็วหาก port ของ Gateway ถูกใช้งานอยู่แล้ว

tmux wrapper จะพาตัวเลือก runtime ที่ไม่ใช่ความลับที่พบบ่อย เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
credential ของผู้ให้บริการไว้ใน profile/config ปกติของคุณ หรือใช้โหมด foreground ดิบ
สำหรับความลับชั่วคราวแบบครั้งเดียว
หาก Gateway ที่ถูก watch ออกระหว่างการเริ่มต้น watcher จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งและรีสตาร์ต child Gateway
ใช้ `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เมื่อต้องการความล้มเหลวการเริ่มต้นเดิม
โดยไม่มีรอบซ่อมสำหรับ dev เท่านั้น
pane ของ tmux ที่จัดการแล้วยังตั้งค่าเริ่มต้นให้ใช้ log Gateway แบบมีสีเพื่อให้อ่านง่าย;
ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ตเมื่อมีไฟล์ที่เกี่ยวข้องกับการ build ภายใต้ `src/`, ไฟล์ source ของ extension,
metadata `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json` และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลง metadata ของ extension
จะรีสตาร์ต Gateway โดยไม่บังคับ rebuild `tsdown`; การเปลี่ยนแปลง source และ config ยัง
rebuild `dist` ก่อน

เพิ่มแฟล็ก CLI ของ Gateway ใดๆ หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งต่อใน
แต่ละครั้งที่รีสตาร์ต การรันคำสั่ง watch เดิมซ้ำจะสร้าง pane tmux ที่มีชื่อเดิมขึ้นใหม่ และ
watcher ดิบยังคงใช้ lock แบบ single-watcher เพื่อให้ parent watcher ที่ซ้ำกันถูกแทนที่
แทนที่จะสะสมเพิ่มขึ้น

## profile dev + Gateway dev (--dev)

ใช้ profile dev เพื่อแยก state และเริ่มชุดตั้งค่าที่ปลอดภัย ใช้แล้วทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` **สอง** ตัว:

- **`--dev` แบบ global (profile):** แยก state ไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่าเริ่มต้น port ของ Gateway เป็น `19001` (port ที่ derived จะเลื่อนตาม)
- **`gateway --dev`: บอก Gateway ให้สร้าง config + workspace เริ่มต้นอัตโนมัติ**
  เมื่อยังไม่มี (และข้าม BOOTSTRAP.md)

ลำดับที่แนะนำ (profile dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่คำสั่งนี้ทำ:

1. **การแยก profile** (`--dev` แบบ global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **bootstrap dev** (`gateway --dev`)
   - เขียน config ขั้นต่ำหากยังไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้งค่า `agent.workspace` เป็น workspace dev
   - ตั้งค่า `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - seed ไฟล์ workspace หากยังไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3‑PO** (protocol droid)
   - ข้ามผู้ให้บริการ channel ในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

ลำดับการ reset (เริ่มใหม่สะอาด):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็ก profile แบบ **global** และ runner บางตัวจะกินแฟล็กนี้ไป หากคุณต้องระบุให้ชัดเจน ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้าง config, credential, session และ workspace dev (ใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างชุดตั้งค่า dev เริ่มต้นใหม่

<Tip>
หาก Gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึก stream ดิบ (OpenClaw)

OpenClaw สามารถบันทึก **stream ของ assistant แบบดิบ** ก่อนการ filtering/formatting ใดๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงเป็น delta ข้อความล้วน
(หรือเป็น thinking block แยกต่างหาก)

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

override path เพิ่มเติม:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

env var ที่เทียบเท่า:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การบันทึก chunk ดิบ (pi-mono)

เพื่อจับ **chunk OpenAI-compat แบบดิบ** ก่อนถูก parse เป็น block
pi-mono มี logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

path เพิ่มเติม:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: สิ่งนี้จะถูกส่งออกโดย process ที่ใช้ provider
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- log stream ดิบอาจมี prompt เต็ม, เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บ log ไว้ในเครื่องและลบหลังดีบักเสร็จ
- หากคุณแชร์ log ให้ลบความลับและ PII ออกก่อน

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
