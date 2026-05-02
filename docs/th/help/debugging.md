---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมด watch ขณะพัฒนาแบบวนซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู, สตรีมโมเดลดิบ และการติดตามการรั่วไหลของเหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-02T22:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อผู้ให้บริการผสมเหตุผลเข้าไปในข้อความปกติ

## การแทนที่ค่าดีบักขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่าการแทนที่คอนฟิกแบบ **runtime-only** (หน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดไว้โดยค่าเริ่มต้น เปิดใช้ด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยใช้โดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างการแทนที่ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุตการติดตามเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่ Plugin เป็นเจ้าของในหนึ่งเซสชัน
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่น สรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับสถานะ verbose และเอาต์พุตเครื่องมือตามปกติ และใช้
`/debug` ต่อไปสำหรับการแทนที่คอนฟิกแบบ runtime-only

## การติดตามวงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแยกเฟสในตัวสำหรับเมตาดาต้า Plugin, การค้นพบ, registry,
runtime mirror, การเปลี่ยนแปลงคอนฟิก และงานรีเฟรช การติดตามนี้เป็นแบบ opt-in และเขียน
ไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON จึงยังคง parse ได้

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
หากคำสั่งกำลังรันจาก source checkout ให้เลือกวัด runtime ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลัง `pnpm build`; `pnpm openclaw ...`
จะวัด overhead ของ source-runner ด้วย

## การเริ่มต้น CLI และการทำ profiling คำสั่ง

ใช้ benchmark การเริ่มต้นที่อยู่ใน repo เมื่อคำสั่งรู้สึกช้า:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการทำ profiling แบบครั้งเดียวผ่าน source runner ตามปกติ ให้ตั้งค่า
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner จะเพิ่มแฟล็ก Node CPU profile และเขียน `.cpuprofile` สำหรับ
คำสั่ง ใช้สิ่งนี้ก่อนเพิ่ม instrumentation ชั่วคราวลงในโค้ดคำสั่ง

## โหมดเฝ้าดู Gateway

สำหรับการวนปรับแก้ที่รวดเร็ว ให้รัน Gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะโปรไฟล์/พอร์ต เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จากเทอร์มินัลแบบโต้ตอบ
เชลล์แบบ non-interactive, CI และ agent exec calls จะยัง detached อยู่และพิมพ์คำแนะนำการ attach
แทน แนบด้วยตนเองเมื่อจำเป็น:

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

ปิด auto-attach ขณะที่ยังคงการจัดการ tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

ทำ profile เวลา CPU ของ Gateway ที่ถูกเฝ้าดูเมื่อดีบักจุดร้อนด้าน startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

watch wrapper จะ consume `--benchmark` ก่อนเรียกใช้ Gateway และเขียน
V8 `.cpuprofile` หนึ่งไฟล์ต่อการออกของ child Gateway ใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต Gateway ที่ถูกเฝ้าดูเพื่อ
flush profile ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อคุณต้องการเก็บ profile ไว้ที่อื่น

tmux wrapper จะส่งต่อ runtime selector ที่ไม่ใช่ความลับที่ใช้บ่อย เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
ข้อมูลรับรองของผู้ให้บริการไว้ใน profile/config ปกติของคุณ หรือใช้โหมด raw foreground
สำหรับความลับชั่วคราวแบบครั้งเดียว
pane ของ tmux ที่จัดการไว้ยังตั้งค่าเริ่มต้นให้ log ของ Gateway มีสีเพื่อให้อ่านง่าย
ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ตเมื่อมีไฟล์ที่เกี่ยวข้องกับการ build ใต้ `src/`, ไฟล์ source ของ extension,
เมตาดาต้า `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json`, และ `tsdown.config.ts` เปลี่ยนแปลง เมตาดาต้า extension ที่เปลี่ยนแปลงจะรีสตาร์ต
Gateway โดยไม่บังคับ rebuild `tsdown`; การเปลี่ยนแปลง source และ config ยังคง
rebuild `dist` ก่อน

เพิ่มแฟล็ก CLI ของ Gateway ใด ๆ หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งต่อใน
แต่ละครั้งที่รีสตาร์ต การรันคำสั่ง watch เดิมซ้ำจะ respawn pane ของ tmux ตามชื่อ และ
raw watcher ยังรักษาล็อก single-watcher ของตนไว้ เพื่อให้ watcher parent ที่ซ้ำกัน
ถูกแทนที่แทนที่จะสะสมเพิ่มขึ้น

## Dev profile + dev Gateway (--dev)

ใช้ dev profile เพื่อแยก state และสร้างชุดตั้งค่าที่ปลอดภัยและทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` **สอง** แบบ:

- **Global `--dev` (profile):** แยก state ไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่าเริ่มต้นของพอร์ต Gateway เป็น `19001` (พอร์ตที่ derive จะเลื่อนตามไปด้วย)
- **`gateway --dev`: บอกให้ Gateway สร้างคอนฟิกเริ่มต้น +
  workspace โดยอัตโนมัติ** เมื่อไม่มีอยู่ (และข้าม BOOTSTRAP.md)

ขั้นตอนที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่ทำ:

1. **การแยก profile** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำหากไม่มีอยู่ (`gateway.mode=local`, bind loopback)
   - ตั้งค่า `agent.workspace` เป็น dev workspace
   - ตั้งค่า `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - seed ไฟล์ workspace หากไม่มีอยู่:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3‑PO** (protocol droid)
   - ข้าม channel provider ใน dev mode (`OPENCLAW_SKIP_CHANNELS=1`)

ขั้นตอน reset (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็ก profile แบบ **global** และถูกบาง runner กินไป หากคุณต้องระบุให้ชัดเจน ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้างคอนฟิก, ข้อมูลรับรอง, เซสชัน และ dev workspace (โดยใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้าง dev setup เริ่มต้นขึ้นใหม่

<Tip>
หาก Gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึก raw stream (OpenClaw)

OpenClaw สามารถบันทึก **raw assistant stream** ก่อนการ filtering/formatting ใด ๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงเป็น plain text deltas
(หรือเป็น thinking blocks แยกต่างหาก) หรือไม่

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การแทนที่ path แบบ optional:

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

เพื่อจับ **raw OpenAI-compat chunks** ก่อนที่สิ่งเหล่านี้จะถูก parse เป็น block,
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
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- log ของ raw stream อาจรวม prompt แบบเต็ม, เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บ log ไว้ในเครื่องและลบทิ้งหลังดีบัก
- หากคุณแชร์ log ให้ scrub secrets และ PII ก่อน

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
