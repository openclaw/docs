---
read_when:
    - คุณจำเป็นต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของข้อมูลการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูขณะปรับแก้ซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู, สตรีมดิบของโมเดล และการติดตามการรั่วไหลของการใช้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-04-30T09:57:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตสตรีม โดยเฉพาะเมื่อ provider ผสมเหตุผลลงในข้อความปกติ

## การ override debug ขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่า override ของ config แบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยใช้โดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างค่า override ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่ Plugin เป็นเจ้าของในเซสชันเดียว
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่น สรุป debug ของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับเอาต์พุตสถานะ/tool แบบ verbose ปกติ และใช้
`/debug` ต่อไปสำหรับการ override config เฉพาะรันไทม์

## trace วงจรชีวิต Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิต Plugin รู้สึกช้า
และคุณต้องการการแจกแจงเฟสในตัวสำหรับ metadata ของ Plugin, discovery, registry,
runtime mirror, การแก้ไข config และงาน refresh trace นี้เป็นแบบ opt-in และเขียน
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

ใช้สิ่งนี้สำหรับการสืบสวนวงจรชีวิต Plugin ก่อนจะไปใช้ CPU profiler
ถ้าคำสั่งกำลังรันจาก source checkout ให้เลือกวัด runtime ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; `pnpm openclaw ...`
จะวัด overhead ของ source-runner ด้วย

## การจับเวลา debug ของ CLI ชั่วคราว

OpenClaw เก็บ `src/cli/debug-timing.ts` ไว้เป็นตัวช่วยขนาดเล็กสำหรับการสืบสวน
ในเครื่อง โดยตั้งใจไม่เชื่อมเข้ากับการเริ่มต้น CLI, การ route คำสั่ง,
หรือคำสั่งใดๆ โดยค่าเริ่มต้น ใช้เฉพาะขณะดีบักคำสั่งที่ช้า จากนั้น
ลบ import และ span ก่อน land การเปลี่ยนแปลงพฤติกรรม

ใช้สิ่งนี้เมื่อคำสั่งช้าและคุณต้องการการแจกแจงเฟสอย่างรวดเร็วก่อน
ตัดสินใจว่าจะใช้ CPU profiler หรือแก้ subsystem เฉพาะจุด

### เพิ่ม span ชั่วคราว

เพิ่ม helper ใกล้โค้ดที่คุณกำลังสืบสวน ตัวอย่างเช่น ขณะดีบัก
`openclaw models list` แพตช์ชั่วคราวใน
`src/commands/models/list.list-command.ts` อาจมีลักษณะดังนี้:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

แนวทาง:

- เติม prefix ให้ชื่อเฟสชั่วคราวด้วย `debug:`
- เพิ่ม span เพียงไม่กี่จุดรอบส่วนที่สงสัยว่าช้า
- เลือกใช้เฟสกว้างๆ เช่น `registry`, `auth_store` หรือ `rows` แทนชื่อ helper
- ใช้ `time()` สำหรับงานแบบ synchronous และ `timeAsync()` สำหรับ promise
- รักษา stdout ให้สะอาด helper เขียนไปยัง stderr ดังนั้นเอาต์พุต JSON ของคำสั่งจึงยัง parse ได้
- ลบ import และ span ชั่วคราวก่อนเปิด PR แก้ไขขั้นสุดท้าย
- รวมเอาต์พุต timing หรือสรุปสั้นๆ ใน issue หรือ PR ที่อธิบายการเพิ่มประสิทธิภาพ

### รันพร้อมเอาต์พุตที่อ่านง่าย

โหมดอ่านง่ายเหมาะที่สุดสำหรับการดีบักสด:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

เอาต์พุตตัวอย่างจากการสืบสวน `models list` ชั่วคราว:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

ข้อค้นพบจากเอาต์พุตนี้:

| เฟส                                     |        เวลา | ความหมาย                                                                                               |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | การโหลด auth-profile store เป็นค่าใช้จ่ายที่มากที่สุดและควรถูกสืบสวนก่อน                              |
| `debug:models:list:ensure_models_json`   |       5.0s | การ sync `models.json` มีค่าใช้จ่ายมากพอที่จะตรวจเรื่อง caching หรือเงื่อนไขการข้าม                    |
| `debug:models:list:load_model_registry`  |       5.9s | การสร้าง registry และงาน availability ของ provider ก็เป็นค่าใช้จ่ายที่มีนัยสำคัญเช่นกัน              |
| `debug:models:list:read_registry_models` |       2.4s | การอ่าน registry models ทั้งหมดไม่ฟรีและอาจสำคัญสำหรับ `--all`                                        |
| เฟส append row                           | รวม 3.2s  | การสร้างแถวที่แสดงห้าแถวยังใช้เวลาหลายวินาที ดังนั้น path การกรองควรถูกตรวจให้ละเอียดขึ้น             |
| `debug:models:list:print_model_table`    |        0ms | การ render ไม่ใช่คอขวด                                                                                 |

ข้อค้นพบเหล่านี้เพียงพอที่จะนำทางแพตช์ถัดไปโดยไม่ต้องเก็บโค้ด timing ไว้ใน
production paths

### รันพร้อมเอาต์พุต JSON

ใช้โหมด JSON เมื่อคุณต้องการบันทึกหรือเปรียบเทียบข้อมูล timing:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

แต่ละบรรทัด stderr เป็น JSON object หนึ่งรายการ:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### ทำความสะอาดก่อน land

ก่อนเปิด PR ขั้นสุดท้าย:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

คำสั่งควรไม่คืนค่า call site ของ instrumentation ชั่วคราว เว้นแต่ PR
กำลังเพิ่ม diagnostics surface แบบถาวรอย่างชัดเจน สำหรับการแก้ performance
ปกติ ให้เก็บไว้เฉพาะการเปลี่ยนแปลงพฤติกรรม, tests และ note สั้นๆ พร้อมหลักฐาน timing

สำหรับ CPU hotspot ที่ลึกขึ้น ให้ใช้ Node profiling (`--cpu-prof`) หรือ profiler
ภายนอกแทนการเพิ่ม timing wrapper เพิ่มเติม

## โหมด watch ของ Gateway

เพื่อการทำซ้ำอย่างรวดเร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ต tmux session ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จาก terminal แบบ interactive
shell แบบ non-interactive, CI และ agent exec call จะคง detached และพิมพ์คำแนะนำ
การ attach แทน attach ด้วยตนเองเมื่อจำเป็น:

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

tmux wrapper จะนำ runtime selector ทั่วไปที่ไม่ใช่ความลับ เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
credential ของ provider ไว้ใน profile/config ปกติของคุณ หรือใช้โหมด foreground ดิบ
สำหรับความลับชั่วคราวแบบใช้ครั้งเดียว

watcher จะรีสตาร์ตเมื่อมีไฟล์ที่เกี่ยวข้องกับ build ใต้ `src/`, ไฟล์ source ของ extension,
metadata `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json` และ `tsdown.config.ts` เปลี่ยน การเปลี่ยน metadata ของ extension จะรีสตาร์ต
gateway โดยไม่บังคับให้ rebuild `tsdown`; การเปลี่ยน source และ config จะยัง
rebuild `dist` ก่อน

เพิ่ม flag ของ Gateway CLI หลัง `gateway:watch` และ flag เหล่านั้นจะถูกส่งต่อใน
แต่ละการรีสตาร์ต การรันคำสั่ง watch เดิมซ้ำจะ respawn pane ของ tmux ตามชื่อ และ
watcher ดิบยังคงรักษา lock แบบ single-watcher เพื่อให้ parent watcher ที่ซ้ำกัน
ถูกแทนที่แทนที่จะสะสมขึ้นเรื่อยๆ

## Dev profile + dev gateway (`--dev`)

ใช้ dev profile เพื่อแยก state และเริ่ม setup ที่ปลอดภัยและทิ้งได้สำหรับ
การดีบัก มี flag `--dev` อยู่ **สอง** แบบ:

- **Global `--dev` (profile):** แยก state ไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่าเริ่มต้นของ port Gateway เป็น `19001` (port ที่ derive มาจะเลื่อนตาม)
- **`gateway --dev`: บอกให้ Gateway สร้าง config +
  workspace เริ่มต้นอัตโนมัติ** เมื่อขาดอยู่ (และข้าม BOOTSTRAP.md)

flow ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

ถ้าคุณยังไม่มี global install ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่ทำ:

1. **การแยก profile** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas จะเลื่อนตาม)

2. **Dev bootstrap** (`gateway --dev`)
   - เขียน config ขั้นต่ำถ้าขาดอยู่ (`gateway.mode=local`, bind loopback)
   - ตั้ง `agent.workspace` เป็น dev workspace
   - ตั้ง `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - seed ไฟล์ workspace ถ้าขาดอยู่:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   - identity เริ่มต้น: **C3‑PO** (protocol droid)
   - ข้าม channel providers ใน dev mode (`OPENCLAW_SKIP_CHANNELS=1`)

flow การ reset (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็น flag profile แบบ **global** และถูก runner บางตัวกินไป ถ้าคุณต้องระบุให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้าง config, credentials, sessions และ dev workspace (ใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้าง setup dev เริ่มต้นใหม่

<Tip>
ถ้า gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การ log raw stream (OpenClaw)

OpenClaw สามารถ log **raw assistant stream** ก่อนการ filtering/formatting ใดๆ
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงเป็น plain text deltas
(หรือเป็น thinking blocks แยกต่างหาก) หรือไม่

เปิดใช้งานผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การแทนที่พาธแบบเลือกได้:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

ตัวแปรสภาพแวดล้อมที่เทียบเท่ากัน:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การบันทึกชังก์ดิบ (pi-mono)

หากต้องการบันทึก **ชังก์ดิบที่เข้ากันได้กับ OpenAI** ก่อนที่จะถูกแยกวิเคราะห์เป็นบล็อก
pi-mono มีตัวบันทึกแยกต่างหากให้ใช้:

```bash
PI_RAW_STREAM=1
```

พาธแบบเลือกได้:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: สิ่งนี้จะถูกส่งออกโดยเฉพาะจากโปรเซสที่ใช้ provider
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- บันทึกสตรีมดิบอาจมีพรอมป์ทั้งหมด เอาต์พุตของเครื่องมือ และข้อมูลผู้ใช้
- เก็บบันทึกไว้ในเครื่องและลบทิ้งหลังจากดีบักเสร็จ
- หากคุณแชร์บันทึก ให้ลบข้อมูลลับและ PII ออกก่อน

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [คำถามที่พบบ่อย](/th/help/faq)
