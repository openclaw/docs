---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมด watch ขณะทำซ้ำเพื่อปรับแก้
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู สตรีมโมเดลดิบ และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-06-27T17:40:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อผู้ให้บริการผสมเหตุผลเข้ากับข้อความปกติ

## การแทนที่ค่าดีบักขณะรันไทม์

ใช้ `/debug` ในแชทเพื่อตั้งค่าการแทนที่ config แบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ได้เขียนลงดิสก์)
`/debug` ถูกปิดใช้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`
วิธีนี้สะดวกเมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยได้ใช้โดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างการแทนที่ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/ดีบักที่ Plugin เป็นเจ้าของในเซสชันเดียว
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่น สรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับสถานะ verbose และเอาต์พุตเครื่องมือแบบปกติ และใช้
`/debug` ต่อไปสำหรับการแทนที่ config แบบเฉพาะรันไทม์

## trace วงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแจกแจงเฟสในตัวสำหรับเมตาดาตา Plugin, การค้นพบ, registry,
runtime mirror, การเปลี่ยนแปลง config และงานรีเฟรช trace นี้เป็นแบบเลือกเปิดและเขียน
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

ใช้สิ่งนี้เพื่อตรวจสอบวงจรชีวิต Plugin ก่อนจะหันไปใช้ CPU profiler
หากคำสั่งรันจาก source checkout ให้เลือกวัดรันไทม์ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; `pnpm openclaw ...`
จะวัด overhead ของ source-runner ด้วยเช่นกัน

## การโปรไฟล์การเริ่มต้น CLI และคำสั่ง

ใช้ benchmark การเริ่มต้นที่เช็คอินไว้เมื่อคำสั่งรู้สึกช้า:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการโปรไฟล์ครั้งเดียวผ่าน source runner ปกติ ให้ตั้ง
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner จะเพิ่มแฟล็ก Node CPU profile และเขียน `.cpuprofile` สำหรับ
คำสั่ง ใช้วิธีนี้ก่อนเพิ่ม instrumentation ชั่วคราวลงในโค้ดคำสั่ง

สำหรับอาการค้างตอนเริ่มต้นที่ดูเหมือนงานระบบไฟล์แบบ synchronous หรืองาน module-loader
ให้เพิ่มแฟล็ก sync I/O trace ของ Node ผ่าน source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` จะปิดแฟล็กนี้โดยค่าเริ่มต้นสำหรับ Gateway child ที่ถูก watch
ตั้ง `OPENCLAW_TRACE_SYNC_IO=1` เมื่อคุณต้องการเอาต์พุต Node
sync I/O trace ในโหมด watch อย่างชัดเจน

## โหมด watch ของ Gateway

สำหรับการวนแก้ไขอย่างรวดเร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น คำสั่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จากเทอร์มินัลแบบโต้ตอบ
shell แบบไม่โต้ตอบ, CI และการเรียก agent exec จะยังคง detached และพิมพ์คำแนะนำ
การ attach แทน attach เองเมื่อจำเป็น:

```bash
tmux attach -t openclaw-gateway-watch-main
```

pane ของ tmux จะรัน watcher ดิบ:

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

โปรไฟล์เวลา CPU ของ Gateway ที่ถูก watch เมื่อดีบัก hotspot ตอนเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

watch wrapper จะ consume `--benchmark` ก่อนเรียกใช้ Gateway และเขียน
V8 `.cpuprofile` หนึ่งไฟล์ต่อการออกของ Gateway child แต่ละครั้งไว้ใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต gateway ที่ถูก watch เพื่อ
flush profile ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อคุณต้องการเก็บ profile ไว้ที่อื่น
ใช้ `--benchmark-no-force` เมื่อคุณต้องการให้ child ที่ถูก benchmark ข้ามการ cleanup port
ค่าเริ่มต้น `--force` และ fail fast หากพอร์ต Gateway ถูกใช้งานอยู่แล้ว
โหมด benchmark จะกด spam ของ sync-I/O trace โดยค่าเริ่มต้น ตั้ง
`OPENCLAW_TRACE_SYNC_IO=1` ร่วมกับ `--benchmark` เมื่อคุณต้องการทั้ง CPU
profile และ stack trace ของ Node sync-I/O อย่างชัดเจน ในโหมด benchmark บล็อก trace เหล่านั้น
จะถูกเขียนไปยัง `gateway-watch-output.log` ใต้ไดเรกทอรี benchmark และ
ถูกกรองออกจาก pane ของเทอร์มินัล; log ปกติของ Gateway ยังคงมองเห็นได้

tmux wrapper จะส่งตัวเลือก runtime ที่ไม่ใช่ความลับทั่วไป เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
credentials ของ provider ไว้ใน profile/config ปกติของคุณ หรือใช้โหมด raw foreground
สำหรับความลับชั่วคราวแบบครั้งเดียว
หาก Gateway ที่ถูก watch ออกระหว่างการเริ่มต้น watcher จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งและรีสตาร์ต Gateway child
ใช้ `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เมื่อคุณต้องการดูความล้มเหลวตอนเริ่มต้นเดิม
โดยไม่มีรอบซ่อมสำหรับ dev เท่านั้น
pane ของ tmux ที่ถูกจัดการยังใช้ log Gateway แบบมีสีเป็นค่าเริ่มต้นเพื่อให้อ่านง่าย;
ตั้ง `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ตเมื่อมีไฟล์ที่เกี่ยวข้องกับ build ใต้ `src/`, ไฟล์ source ของ extension,
เมตาดาตา `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json` และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลงเมตาดาตา extension จะรีสตาร์ต
gateway โดยไม่บังคับ rebuild `tsdown`; การเปลี่ยนแปลง source และ config ยังจะ
rebuild `dist` ก่อน

เพิ่มแฟล็ก CLI ของ gateway ใด ๆ หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งผ่านใน
การรีสตาร์ตแต่ละครั้ง การรันคำสั่ง watch เดิมซ้ำจะ respawn pane tmux ที่มีชื่อนั้น และ
raw watcher ยังคงรักษา lock แบบ single-watcher ของตัวเองไว้ ดังนั้น parent watcher ที่ซ้ำกัน
จะถูกแทนที่แทนที่จะสะสมเพิ่ม

## Dev profile + dev gateway (`--dev`)

ใช้ dev profile เพื่อแยก state และเปิดชุดตั้งค่าที่ปลอดภัย ใช้แล้วทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` **สอง** แบบ:

- **Global `--dev` (profile):** แยก state ไว้ใต้ `~/.openclaw-dev` และ
  ตั้งพอร์ต gateway ค่าเริ่มต้นเป็น `19001` (พอร์ตที่ derive มาจะเลื่อนตาม)
- **`gateway --dev`: บอกให้ Gateway สร้าง config +
  workspace ค่าเริ่มต้นโดยอัตโนมัติ** เมื่อไม่มีอยู่ (และข้าม BOOTSTRAP.md)

flow ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่มี global install ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่คำสั่งนี้ทำ:

1. **การแยก profile** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียน config ขั้นต่ำหากไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้ง `agent.workspace` เป็น dev workspace
   - ตั้ง `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - seed ไฟล์ workspace หากไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity ค่าเริ่มต้น: **C3-PO** (protocol droid)
   - ข้าม provider ของ channel ในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

flow สำหรับ reset (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็ก profile แบบ **global** และ runner บางตัวจะ consume ไป หากคุณต้องระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะลบ config, credentials, sessions และ dev workspace (ใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างชุด dev ค่าเริ่มต้นใหม่

<Tip>
หาก gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การ logging สตรีมดิบ (OpenClaw)

OpenClaw สามารถ log **สตรีม assistant ดิบ** ก่อนการกรอง/จัดรูปแบบใด ๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงเป็น plain text deltas
(หรือเป็นบล็อก thinking แยกต่างหาก)

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

override path แบบเลือกได้:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

env vars ที่เทียบเท่า:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์ค่าเริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การ logging chunk ดิบที่เข้ากันได้กับ OpenAI

เพื่อจับ **chunk ดิบที่เข้ากันได้กับ OpenAI** ก่อนที่จะถูก parse เป็นบล็อก
ให้เปิดใช้ transport logger:

```bash
OPENCLAW_RAW_STREAM=1
```

path แบบเลือกได้:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

ไฟล์ค่าเริ่มต้น:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## หมายเหตุด้านความปลอดภัย

- log สตรีมดิบอาจรวม prompt เต็ม, เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บ log ไว้ในเครื่องและลบหลังดีบักเสร็จ
- หากคุณแชร์ log ให้ลบความลับและ PII ออกก่อน

## การดีบักใน VSCode

จำเป็นต้องใช้ source maps เพื่อเปิดใช้การดีบักใน IDE ที่ใช้ VSCode เพราะไฟล์ที่ generated จำนวนมากจะลงท้ายด้วยชื่อที่ hash เป็นส่วนหนึ่งของกระบวนการ build configuration `launch.json` ที่รวมมาจะ target บริการ Gateway แต่สามารถปรับใช้เพื่อวัตถุประสงค์อื่นได้อย่างรวดเร็ว:

1. **สร้างใหม่และดีบัก Gateway** - ดีบักบริการ Gateway หลังจากสร้าง build ใหม่
2. **ดีบัก Gateway** - ดีบักบริการ Gateway ของ build ที่มีอยู่แล้ว

### การตั้งค่า

configuration ค่าเริ่มต้น **สร้างใหม่และดีบัก Gateway** มีทุกอย่างพร้อมใช้ โดยจะลบโฟลเดอร์ `/dist` โดยอัตโนมัติและ rebuild โปรเจกต์โดยเปิดใช้การดีบัก:

1. เปิดแผง **Run and Debug** จาก Activity Bar หรือกด `Ctrl`+`Shift`+`D`
2. ใน IDE ตรวจสอบว่าเลือก **สร้างใหม่และดีบัก Gateway** ใน dropdown configuration แล้วกดปุ่ม **เริ่มดีบัก**

อีกทางหนึ่ง - หากคุณต้องการจัดการกระบวนการ build และดีบักด้วยตัวเอง:

1. เปิดเทอร์มินัลและเปิดใช้ source maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. ในเทอร์มินัลเดียวกัน ให้ rebuild โปรเจกต์: `pnpm clean:dist && pnpm build`
3. ใน IDE เลือกตัวเลือก **ดีบัก Gateway** ใน dropdown configuration **Run and Debug** แล้วกดปุ่ม **เริ่มดีบัก**

ตอนนี้คุณสามารถตั้ง breakpoint ในไฟล์ source TypeScript ของคุณ (ไดเรกทอรี `src/`) และ debugger จะ map breakpoint ไปยัง JavaScript ที่ compile แล้วได้อย่างถูกต้องผ่าน source maps คุณจะสามารถตรวจสอบตัวแปร, step ผ่านโค้ด และตรวจดู call stack ได้ตามที่คาดไว้

### หมายเหตุ

- หากใช้ตัวเลือก **"สร้างใหม่และดีบัก Gateway"** - ทุกครั้งที่เปิด debugger ระบบจะลบโฟลเดอร์ `/dist` ทั้งหมดและรัน `pnpm build` เต็มรูปแบบโดยเปิดใช้ source maps ก่อนเริ่ม Gateway
- หากใช้ตัวเลือก **"ดีบัก Gateway"** - สามารถเริ่มและหยุดเซสชันดีบักได้ทุกเมื่อโดยไม่กระทบโฟลเดอร์ `/dist` แต่คุณต้องใช้ process เทอร์มินัลแยกต่างหากเพื่อทั้งเปิดใช้การดีบักและจัดการ build cycle
- แก้ไขการตั้งค่า `launch.json` สำหรับ `args` เพื่อดีบักส่วนอื่นของโปรเจกต์
- หากคุณต้องใช้ OpenClaw CLI ที่ build แล้วสำหรับงานอื่น (เช่น `dashboard --no-open` หากเซสชันดีบักของคุณสร้าง auth token ใหม่) คุณสามารถ execute ในเทอร์มินัลอื่นเป็น `node ./openclaw.mjs` หรือสร้าง shell alias เช่น `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [คำถามที่พบบ่อย](/th/help/faq)
