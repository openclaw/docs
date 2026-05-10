---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของข้อมูลการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมด watch ระหว่างปรับแก้ซ้ำ ๆ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู, สตรีมดิบจากโมเดล และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-10T19:41:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยสำหรับการดีบักเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อ provider ผสม reasoning เข้าไปในข้อความปกติ

## การแทนที่ค่าดีบักขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่าการแทนที่คอนฟิกแบบ**เฉพาะขณะรันไทม์** (หน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้งานด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยใช้โดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างการแทนที่ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่ Plugin เป็นเจ้าของในหนึ่งเซสชัน
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่นสรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับเอาต์พุตสถานะ/เครื่องมือแบบ verbose ปกติ และใช้
`/debug` ต่อไปสำหรับการแทนที่คอนฟิกแบบเฉพาะขณะรันไทม์

## trace วงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแยกย่อย phase ในตัวสำหรับเมทาดาทา Plugin, discovery, registry,
runtime mirror, การแก้ไขคอนฟิก และงาน refresh trace นี้เป็นแบบ opt-in และเขียนไปที่ stderr
ดังนั้นเอาต์พุตคำสั่ง JSON จึงยัง parse ได้

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

ใช้สิ่งนี้เพื่อตรวจสอบวงจรชีวิต Plugin ก่อนหันไปใช้ CPU profiler
ถ้าคำสั่งกำลังรันจาก source checkout ให้เลือกวัดรันไทม์ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; `pnpm openclaw ...`
ยังวัด overhead ของ source-runner ด้วย

## การเริ่มต้น CLI และการทำโปรไฟล์คำสั่ง

ใช้ benchmark การเริ่มต้นที่อยู่ใน repo เมื่อคำสั่งรู้สึกช้า:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการทำโปรไฟล์แบบครั้งเดียวผ่าน source runner ปกติ ให้ตั้งค่า
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner จะเพิ่ม flag โปรไฟล์ CPU ของ Node และเขียน `.cpuprofile` สำหรับ
คำสั่ง ใช้สิ่งนี้ก่อนเพิ่ม instrumentation ชั่วคราวในโค้ดคำสั่ง

สำหรับอาการค้างตอนเริ่มต้นที่ดูเหมือนงานระบบไฟล์แบบ synchronous หรืองาน module-loader
ให้เพิ่ม flag trace sync I/O ของ Node ผ่าน source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` จะปล่อยให้ flag นี้ปิดอยู่ตามค่าเริ่มต้นสำหรับ child
Gateway ที่ถูก watch ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` เมื่อคุณต้องการเอาต์พุต
trace sync I/O ของ Node ในโหมด watch อย่างชัดเจน

## โหมด watch ของ Gateway

เพื่อการ iterate ที่รวดเร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น คำสั่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และแนบอัตโนมัติจากเทอร์มินัลแบบ interactive
shell ที่ไม่ interactive, CI และการเรียก exec ของ agent จะยังคง detached และพิมพ์
คำแนะนำการแนบแทน แนบด้วยตนเองเมื่อจำเป็น:

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

ทำโปรไฟล์เวลา CPU ของ Gateway ที่ถูก watch เมื่อดีบัก hotspot ตอนเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

wrapper ของ watch จะ consume `--benchmark` ก่อนเรียกใช้ Gateway และเขียน
V8 `.cpuprofile` หนึ่งไฟล์ต่อการออกของ child Gateway แต่ละครั้งไว้ใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต gateway ที่ถูก watch
เพื่อ flush โปรไฟล์ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อคุณต้องการเก็บโปรไฟล์ไว้ที่อื่น
ใช้ `--benchmark-no-force` เมื่อคุณต้องการให้ child ที่ถูก benchmark ข้ามการล้าง port
ด้วย `--force` ตามค่าเริ่มต้น และ fail fast หาก port ของ Gateway ถูกใช้งานอยู่แล้ว
โหมด benchmark จะ suppress spam ของ sync-I/O trace ตามค่าเริ่มต้น ตั้งค่า
`OPENCLAW_TRACE_SYNC_IO=1` ร่วมกับ `--benchmark` เมื่อคุณต้องการทั้งโปรไฟล์ CPU
และ stack trace ของ sync-I/O ของ Node อย่างชัดเจน ในโหมด benchmark บล็อก trace เหล่านั้น
จะถูกเขียนไปยัง `gateway-watch-output.log` ใต้ไดเรกทอรี benchmark และถูกกรองออกจาก
pane ของเทอร์มินัล log ปกติของ Gateway จะยังมองเห็นได้

wrapper ของ tmux จะพา selector รันไทม์ที่ไม่ใช่ความลับและใช้บ่อย เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
credential ของ provider ไว้ใน profile/config ปกติของคุณ หรือใช้โหมด foreground ดิบ
สำหรับความลับชั่วคราวแบบครั้งเดียว
ถ้า Gateway ที่ถูก watch ออกระหว่างการเริ่มต้น watcher จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งและรีสตาร์ต child ของ Gateway
ใช้ `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เมื่อคุณต้องการ failure การเริ่มต้นเดิม
โดยไม่มี pass ซ่อมแซมเฉพาะ dev
pane tmux ที่จัดการไว้ยังตั้งค่าเริ่มต้นให้ log ของ Gateway มีสีเพื่อให้อ่านง่าย
ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับการ build ใต้ `src/`, ไฟล์ source ของ extension,
เมทาดาทา `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json`, และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลงเมทาดาทา extension
จะรีสตาร์ต gateway โดยไม่บังคับให้ rebuild `tsdown`; การเปลี่ยนแปลง source และคอนฟิก
ยังคง rebuild `dist` ก่อน

เพิ่ม flag CLI ของ gateway หลัง `gateway:watch` และ flag เหล่านั้นจะถูกส่งผ่านไปใน
แต่ละการรีสตาร์ต การรันคำสั่ง watch เดิมอีกครั้งจะ respawn pane tmux ที่มีชื่อนั้น และ
watcher ดิบยังคงรักษา lock แบบ single-watcher เพื่อให้ parent watcher ที่ซ้ำกัน
ถูกแทนที่แทนที่จะกองซ้อนกัน

## โปรไฟล์ dev + gateway dev (--dev)

ใช้โปรไฟล์ dev เพื่อแยก state และเริ่ม setup ที่ปลอดภัยและทิ้งได้สำหรับ
การดีบัก มี flag `--dev` **สอง** แบบ:

- **global `--dev` (profile):** แยก state ไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่า port ของ gateway เป็น `19001` ตามค่าเริ่มต้น (port ที่ derive มาจะเลื่อนตาม)
- **`gateway --dev`: บอก Gateway ให้สร้างคอนฟิกเริ่มต้น +
  workspace โดยอัตโนมัติ** เมื่อไม่มีอยู่ (และข้าม BOOTSTRAP.md)

flow ที่แนะนำ (โปรไฟล์ dev + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

ถ้าคุณยังไม่มีการติดตั้งแบบ global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่ทำ:

1. **การแยกโปรไฟล์** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำถ้ายังไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้งค่า `agent.workspace` เป็น workspace dev
   - ตั้งค่า `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - seed ไฟล์ workspace ถ้ายังไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3-PO** (protocol droid)
   - ข้าม channel provider ในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

flow รีเซ็ต (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็น flag โปรไฟล์แบบ **global** และถูก runner บางตัวกลืนไป หากคุณต้องระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้างคอนฟิก, credential, เซสชัน และ workspace dev (โดยใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้าง setup dev เริ่มต้นขึ้นใหม่

<Tip>
ถ้า gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การ log stream ดิบ (OpenClaw)

OpenClaw สามารถ log **stream ดิบของ assistant** ก่อนการกรอง/จัดรูปแบบใด ๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงในรูป delta ข้อความธรรมดา
(หรือเป็นบล็อก thinking แยกต่างหาก)

เปิดใช้งานผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การ override path แบบ optional:

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

## การ log chunk ดิบ (pi-mono)

เพื่อจับ **chunk ดิบที่เข้ากันได้กับ OpenAI** ก่อนถูก parse เป็นบล็อก
pi-mono มี logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

path แบบ optional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: สิ่งนี้จะถูก emit เฉพาะโดย process ที่ใช้ provider
> `openai-completions` ของ pi-mono

## หมายเหตุด้านความปลอดภัย

- log ของ stream ดิบอาจรวม prompt เต็มรูปแบบ, เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บ log ไว้ในเครื่องและลบหลังดีบักเสร็จ
- หากคุณแชร์ log ให้ scrub ความลับและ PII ก่อน

## การดีบักใน VSCode

source map จำเป็นสำหรับการเปิดใช้งานการดีบักใน IDE ที่ใช้ VSCode เพราะไฟล์ที่ generate จำนวนมากลงท้ายด้วยชื่อที่ถูก hash เป็นส่วนหนึ่งของกระบวนการ build คอนฟิก `launch.json` ที่รวมมา target ไปที่บริการ Gateway แต่สามารถปรับใช้อย่างรวดเร็วเพื่อวัตถุประสงค์อื่นได้:

1. **Rebuild and Debug Gateway** - ดีบักบริการ Gateway หลังจากสร้าง build ใหม่
2. **Debug Gateway** - ดีบักบริการ Gateway ของ build ที่มีอยู่แล้ว

### การตั้งค่า

คอนฟิก **Rebuild and Debug Gateway** เริ่มต้นมีทุกอย่างพร้อมให้แล้ว โดยจะลบโฟลเดอร์ `/dist` โดยอัตโนมัติและ rebuild project พร้อมเปิดใช้งานการดีบัก:

1. เปิด panel **Run and Debug** จาก Activity Bar หรือกด `Ctrl`+`Shift`+`D`
2. ใน IDE ตรวจสอบให้แน่ใจว่าเลือก **Rebuild and Debug Gateway** ใน dropdown คอนฟิกแล้ว จากนั้นกดปุ่ม **Start Debugging**

อีกทางหนึ่ง - หากคุณต้องการจัดการกระบวนการ build และ debug ด้วยตนเอง:

1. เปิดเทอร์มินัลและเปิดใช้งาน source map:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. ในเทอร์มินัลเดียวกัน rebuild project: `pnpm clean:dist && pnpm build`
3. ใน IDE เลือกตัวเลือก **Debug Gateway** ใน dropdown คอนฟิก **Run and Debug** แล้วกดปุ่ม **Start Debugging**

ตอนนี้คุณสามารถตั้ง breakpoint ในไฟล์ source TypeScript ของคุณ (ไดเรกทอรี `src/`) และ debugger จะ map breakpoint ไปยัง JavaScript ที่ compile แล้วได้อย่างถูกต้องผ่าน source map คุณจะสามารถตรวจสอบตัวแปร, step ผ่านโค้ด และตรวจสอบ call stack ได้ตามที่คาดไว้

### หมายเหตุ

- หากใช้ตัวเลือก **"Rebuild and Debug Gateway"** - ทุกครั้งที่เปิด debugger ระบบจะลบโฟลเดอร์ `/dist` ทั้งหมดและรัน `pnpm build` แบบเต็มพร้อมเปิด source map ก่อนเริ่ม Gateway
- หากใช้ตัวเลือก **"Debug Gateway"** - session ดีบักสามารถเริ่มและหยุดได้ทุกเมื่อโดยไม่กระทบโฟลเดอร์ `/dist` แต่คุณต้องใช้ process เทอร์มินัลแยกต่างหากเพื่อทั้งเปิดใช้งานการดีบักและจัดการวงจร build
- แก้ไขการตั้งค่า `launch.json` สำหรับ `args` เพื่อดีบักส่วนอื่นของ project
- หากคุณต้องใช้ CLI ของ OpenClaw ที่ build แล้วสำหรับงานอื่น (เช่น `dashboard --no-open` หาก session ดีบักของคุณ spawn auth token ใหม่) คุณสามารถ execute ในเทอร์มินัลอื่นเป็น `node ./openclaw.mjs` หรือสร้าง shell alias เช่น `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
