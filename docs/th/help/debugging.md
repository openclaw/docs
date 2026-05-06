---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูขณะปรับแก้ซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู สตรีมโมเดลดิบ และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-06T09:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อผู้ให้บริการผสม reasoning เข้าไปในข้อความปกติ

## การแทนที่ค่าดีบักขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่าการแทนที่คอนฟิกแบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดไว้โดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่หาได้ยากโดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างการแทนที่ค่าทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่ Plugin เป็นเจ้าของในเซสชันเดียว
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่นสรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับเอาต์พุตสถานะ/tool แบบ verbose ตามปกติ และใช้
`/debug` ต่อไปสำหรับการแทนที่คอนฟิกแบบเฉพาะรันไทม์

## trace วงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแยกเฟสในตัวสำหรับเมทาดาทา Plugin, การค้นพบ, registry,
runtime mirror, การกลายพันธุ์ของคอนฟิก และงานรีเฟรช trace นี้เป็นแบบ opt-in และเขียน
ไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON จึงยัง parse ได้

ตัวอย่าง:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

เอาต์พุตตัวอย่าง:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

ใช้สิ่งนี้สำหรับการตรวจสอบวงจรชีวิต Plugin ก่อนหันไปใช้ CPU profiler
หากคำสั่งกำลังรันจาก source checkout ให้เลือกวัดรันไทม์ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลัง `pnpm build`; `pnpm openclaw ...`
จะวัดโอเวอร์เฮดของ source-runner ด้วย

## การโปรไฟล์การเริ่มต้น CLI และคำสั่ง

ใช้ startup benchmark ที่เช็กอินไว้เมื่อคำสั่งรู้สึกช้า:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการโปรไฟล์แบบครั้งเดียวผ่าน source runner ปกติ ให้ตั้งค่า
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner จะเพิ่มแฟล็ก Node CPU profile และเขียน `.cpuprofile` สำหรับ
คำสั่ง ใช้สิ่งนี้ก่อนเพิ่ม instrumentation ชั่วคราวในโค้ดคำสั่ง

สำหรับอาการค้างตอนเริ่มต้นที่ดูเหมือนงานระบบไฟล์แบบซิงโครนัสหรือ module-loader
ให้เพิ่มแฟล็ก trace I/O แบบซิงค์ของ Node ผ่าน source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` เปิดใช้แฟล็กนี้โดยค่าเริ่มต้นสำหรับ Gateway child ที่ถูก watch
ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=0` เพื่อระงับเอาต์พุต trace I/O แบบซิงค์ของ Node ในโหมด watch

## โหมด watch ของ Gateway

เพื่อการวนแก้ไขที่รวดเร็ว ให้รัน gateway ใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือรูปแบบเฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จากเทอร์มินัลแบบโต้ตอบ
เชลล์ที่ไม่โต้ตอบ, CI และ agent exec calls จะคงสถานะ detached และพิมพ์คำแนะนำการ attach
แทน attach ด้วยตนเองเมื่อต้องการ:

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

ปิด auto-attach โดยยังคงการจัดการ tmux ไว้:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

โปรไฟล์เวลา CPU ของ Gateway ที่ถูก watch เมื่อตรวจแก้ hotspot ช่วงเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

watch wrapper จะใช้ `--benchmark` ก่อนเรียกใช้ Gateway และเขียน
V8 `.cpuprofile` หนึ่งไฟล์ต่อการออกของ Gateway child ใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต gateway ที่ถูก watch เพื่อ
flush โปรไฟล์ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อคุณต้องการเก็บโปรไฟล์ไว้ที่อื่น
ใช้ `--benchmark-no-force` เมื่อคุณต้องการให้ child ที่ benchmark ข้ามการล้างพอร์ต
`--force` ตามค่าเริ่มต้น และล้มเหลวอย่างรวดเร็วหากพอร์ต Gateway ถูกใช้งานอยู่แล้ว
โหมด benchmark จะระงับสแปม trace sync-I/O โดยค่าเริ่มต้น ตั้งค่า
`OPENCLAW_TRACE_SYNC_IO=1` พร้อม `--benchmark` เมื่อคุณต้องการทั้ง CPU
profiles และ stack traces ของ Node sync-I/O อย่างชัดเจน ในโหมด benchmark บล็อก trace เหล่านั้น
จะถูกเขียนไปยัง `gateway-watch-output.log` ใต้ไดเรกทอรี benchmark และ
ถูกกรองออกจาก pane ของเทอร์มินัล; log Gateway ปกติยังคงมองเห็นได้

tmux wrapper จะส่งตัวเลือก runtime ที่ไม่ใช่ความลับซึ่งใช้กันทั่วไป เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
credentials ของผู้ให้บริการไว้ใน profile/config ปกติของคุณ หรือใช้โหมด foreground ดิบ
สำหรับ secret ชั่วคราวแบบครั้งเดียว
หาก Gateway ที่ถูก watch ออกระหว่างการเริ่มต้น watcher จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งและรีสตาร์ต Gateway child
ใช้ `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เมื่อคุณต้องการดูความล้มเหลวตอนเริ่มต้นเดิม
โดยไม่มีรอบซ่อมแซมเฉพาะ dev
pane ของ tmux ที่จัดการแล้วยังตั้งค่าเริ่มต้นเป็น log Gateway แบบมีสีเพื่อให้อ่านง่าย;
ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับการ build ใต้ `src/`, ไฟล์ซอร์สของ extension,
เมทาดาทา `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json`, และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลงเมทาดาทา extension จะรีสตาร์ต
gateway โดยไม่บังคับให้ `tsdown` rebuild; การเปลี่ยนแปลงซอร์สและคอนฟิกยังคง
rebuild `dist` ก่อน

เพิ่มแฟล็ก CLI ของ gateway ใด ๆ หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งผ่านใน
ทุกครั้งที่รีสตาร์ต การรันคำสั่ง watch เดิมซ้ำจะ respawn pane ของ tmux ที่มีชื่อไว้ และ
watcher ดิบยังคงใช้ล็อก single-watcher เพื่อให้ parent watcher ที่ซ้ำกัน
ถูกแทนที่แทนที่จะสะสมขึ้นเรื่อย ๆ

## Dev profile + dev gateway (--dev)

ใช้ dev profile เพื่อแยก state และเปิดใช้งานชุดตั้งค่าที่ปลอดภัย ใช้แล้วทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` **สอง** แบบ:

- **Global `--dev` (profile):** แยก state ไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่าเริ่มต้นพอร์ต gateway เป็น `19001` (พอร์ตที่ derive จะเลื่อนตาม)
- **`gateway --dev`: บอก Gateway ให้สร้างคอนฟิกเริ่มต้น +
  workspace โดยอัตโนมัติ** เมื่อไม่มีอยู่ (และข้าม BOOTSTRAP.md)

โฟลว์ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่ได้ติดตั้งแบบ global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่ทำ:

1. **การแยก Profile** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำหากไม่มี (`gateway.mode=local`, bind loopback)
   - ตั้งค่า `agent.workspace` เป็น dev workspace
   - ตั้งค่า `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - สร้างไฟล์ workspace เริ่มต้นหากไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3-PO** (protocol droid)
   - ข้ามผู้ให้บริการ channel ในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

โฟลว์รีเซ็ต (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็ก profile แบบ **global** และถูก runner บางตัวกลืนไป หากคุณต้องระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้างคอนฟิก, credentials, sessions และ dev workspace (โดยใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างชุดตั้งค่า dev เริ่มต้นใหม่

<Tip>
หาก gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึก raw stream (OpenClaw)

OpenClaw สามารถบันทึก **raw assistant stream** ก่อนการกรอง/จัดรูปแบบใด ๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงเป็น plain text deltas
(หรือเป็น thinking blocks แยกต่างหาก)

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การ override path แบบไม่บังคับ:

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

## การบันทึก raw chunk (pi-mono)

เพื่อจับ **raw OpenAI-compat chunks** ก่อนถูก parse เป็นบล็อก
pi-mono มี logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

path แบบไม่บังคับ:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: สิ่งนี้ถูก emit เฉพาะโดยโปรเซสที่ใช้ผู้ให้บริการ
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- raw stream logs อาจมี prompts เต็มรูปแบบ, เอาต์พุต tool และข้อมูลผู้ใช้
- เก็บ logs ไว้ในเครื่องและลบหลังดีบักเสร็จ
- หากคุณแชร์ logs ให้ล้าง secrets และ PII ก่อน

## การดีบักใน VSCode

source maps จำเป็นต่อการเปิดใช้การดีบักใน IDE ที่อิง VSCode เพราะไฟล์ที่สร้างจำนวนมากจะลงท้ายด้วยชื่อแบบ hashed ซึ่งเป็นส่วนหนึ่งของกระบวนการ build คอนฟิก `launch.json` ที่รวมมาจะ target บริการ Gateway แต่สามารถปรับอย่างรวดเร็วเพื่อวัตถุประสงค์อื่นได้:

1. **Rebuild and Debug Gateway** - ดีบักบริการ Gateway หลังสร้าง build ใหม่
2. **Debug Gateway** - ดีบักบริการ Gateway ของ build ที่มีอยู่แล้ว

### การตั้งค่า

คอนฟิก **Rebuild and Debug Gateway** เริ่มต้นมาพร้อมทุกอย่างที่ต้องใช้ โดยจะลบโฟลเดอร์ `/dist` โดยอัตโนมัติและ rebuild โปรเจกต์พร้อมเปิดใช้การดีบัก:

1. เปิดแผง **Run and Debug** จาก Activity Bar หรือกด `Ctrl`+`Shift`+`D`
2. ใน IDE ตรวจสอบให้แน่ใจว่าเลือก **Rebuild and Debug Gateway** ในดรอปดาวน์คอนฟิก จากนั้นกดปุ่ม **Start Debugging**

อีกทางเลือกหนึ่ง - หากคุณต้องการจัดการกระบวนการ build และ debug ด้วยตนเอง:

1. เปิดเทอร์มินัลและเปิดใช้ source maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. ในเทอร์มินัลเดียวกัน ให้ rebuild โปรเจกต์: `pnpm clean:dist && pnpm build`
3. ใน IDE เลือกตัวเลือก **Debug Gateway** ในดรอปดาวน์คอนฟิก **Run and Debug** จากนั้นกดปุ่ม **Start Debugging**

ตอนนี้คุณสามารถตั้ง breakpoints ในไฟล์ซอร์ส TypeScript ของคุณ (ไดเรกทอรี `src/`) และ debugger จะ map breakpoints ไปยัง JavaScript ที่ compile แล้วได้อย่างถูกต้องผ่าน source maps คุณจะสามารถตรวจสอบตัวแปร, step through code และตรวจสอบ call stacks ได้ตามที่คาดไว้

### หมายเหตุ

- หากใช้ตัวเลือก **"Rebuild and Debug Gateway"** - ทุกครั้งที่เปิด debugger ระบบจะลบโฟลเดอร์ `/dist` ทั้งหมดและรัน `pnpm build` เต็มรูปแบบโดยเปิดใช้ source maps ก่อนเริ่ม Gateway
- หากใช้ตัวเลือก **"Debug Gateway"** - debug sessions สามารถเริ่มและหยุดได้ตลอดเวลาโดยไม่กระทบโฟลเดอร์ `/dist` แต่คุณต้องใช้โปรเซสเทอร์มินัลแยกต่างหากเพื่อทั้งเปิดใช้การดีบักและจัดการรอบการ build
- แก้ไขการตั้งค่า `launch.json` สำหรับ `args` เพื่อดีบักส่วนอื่นของโปรเจกต์
- หากคุณต้องใช้ OpenClaw CLI ที่ build แล้วสำหรับงานอื่น (เช่น `dashboard --no-open` หาก debug session ของคุณสร้าง auth token ใหม่) คุณสามารถเรียกใช้ในเทอร์มินัลอื่นเป็น `node ./openclaw.mjs` หรือสร้าง shell alias เช่น `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
