---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูขณะปรับแก้ซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู, สตรีมโมเดลดิบ, และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-02T20:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อผู้ให้บริการผสม reasoning เข้าไปในข้อความปกติ

## การแทนที่เพื่อดีบักขณะรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่าการแทนที่ config แบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น; เปิดใช้ด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยพบโดยไม่แก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างการแทนที่ทั้งหมดและกลับไปใช้ config บนดิสก์

## เอาต์พุต trace ของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัด trace/debug ที่ Plugin เป็นเจ้าของในหนึ่งเซสชัน
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่นสรุปดีบัก Active Memory
ใช้ `/verbose` ต่อไปสำหรับเอาต์พุตสถานะ/tool แบบ verbose ตามปกติ และใช้
`/debug` ต่อไปสำหรับการแทนที่ config แบบเฉพาะรันไทม์

## trace lifecycle ของ Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่ง lifecycle ของ Plugin รู้สึกช้า
และคุณต้องการการแยกเฟสในตัวสำหรับ metadata, discovery, registry,
runtime mirror, การกลายพันธุ์ของ config และงาน refresh ของ Plugin trace นี้เป็นแบบ opt-in และเขียน
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

ใช้สิ่งนี้สำหรับการสืบสวน lifecycle ของ Plugin ก่อนหันไปใช้ CPU profiler
หากคำสั่งกำลังรันจาก source checkout ให้เลือกวัดรันไทม์ที่ build แล้ว
ด้วย `node dist/entry.js ...` หลัง `pnpm build`; `pnpm openclaw ...`
จะวัด overhead ของ source-runner ด้วย

## การจับเวลาเพื่อดีบัก CLI ชั่วคราว

OpenClaw เก็บ `src/cli/debug-timing.ts` ไว้เป็นตัวช่วยขนาดเล็กสำหรับการสืบสวนในเครื่อง
โดยตั้งใจไม่ผูกเข้ากับการเริ่มต้น CLI, การ routing คำสั่ง,
หรือคำสั่งใดๆ เป็นค่าเริ่มต้น ใช้เฉพาะขณะดีบักคำสั่งที่ช้า จากนั้น
ลบ import และ spans ก่อน land การเปลี่ยนแปลงพฤติกรรม

ใช้สิ่งนี้เมื่อคำสั่งช้าและคุณต้องการการแยกเฟสอย่างรวดเร็วก่อน
ตัดสินใจว่าจะใช้ CPU profiler หรือแก้ไข subsystem เฉพาะ

### เพิ่ม spans ชั่วคราว

เพิ่มตัวช่วยใกล้โค้ดที่คุณกำลังสืบสวน ตัวอย่างเช่น ขณะดีบัก
`openclaw models list` แพตช์ชั่วคราวใน
`src/commands/models/list.list-command.ts` อาจมีหน้าตาแบบนี้:

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

- เติม prefix ชื่อเฟสชั่วคราวด้วย `debug:`
- เพิ่ม spans เพียงไม่กี่รายการรอบส่วนที่สงสัยว่าช้า
- เลือกใช้เฟสกว้างๆ เช่น `registry`, `auth_store`, หรือ `rows` แทนชื่อ
  helper
- ใช้ `time()` สำหรับงานแบบ synchronous และ `timeAsync()` สำหรับ promises
- รักษา stdout ให้สะอาด ตัวช่วยจะเขียนไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON จึงยัง
  parse ได้
- ลบ imports และ spans ชั่วคราวก่อนเปิด PR แก้ไขสุดท้าย
- ใส่เอาต์พุต timing หรือสรุปสั้นๆ ใน issue หรือ PR ที่อธิบาย
  การปรับให้เหมาะสม

### รันด้วยเอาต์พุตที่อ่านง่าย

โหมดอ่านง่ายเหมาะที่สุดสำหรับการดีบักสด:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

ตัวอย่างเอาต์พุตจากการสืบสวน `models list` ชั่วคราว:

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

| เฟส                                     |       เวลา | ความหมาย                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | การโหลด auth-profile store เป็นต้นทุนที่มากที่สุดและควรถูกสืบสวนก่อน                       |
| `debug:models:list:ensure_models_json`   |       5.0s | การ sync `models.json` แพงพอที่จะตรวจสอบเรื่อง caching หรือเงื่อนไขการข้าม                    |
| `debug:models:list:load_model_registry`  |       5.9s | การสร้าง registry และงาน availability ของผู้ให้บริการก็เป็นต้นทุนที่มีนัยสำคัญเช่นกัน                         |
| `debug:models:list:read_registry_models` |       2.4s | การอ่านโมเดล registry ทั้งหมดไม่ฟรี และอาจมีความสำคัญสำหรับ `--all`                                     |
| เฟสการเพิ่มแถว                        | รวม 3.2s | การสร้างห้าแถวที่แสดงยังใช้เวลาหลายวินาที ดังนั้น path การกรองควรถูกตรวจสอบใกล้ขึ้น |
| `debug:models:list:print_model_table`    |        0ms | การ render ไม่ใช่คอขวด                                                                        |

ข้อค้นพบเหล่านั้นเพียงพอที่จะชี้นำแพตช์ถัดไปโดยไม่ต้องเก็บโค้ด timing ไว้ใน
production paths

### รันด้วยเอาต์พุต JSON

ใช้โหมด JSON เมื่อคุณต้องการบันทึกหรือเปรียบเทียบข้อมูล timing:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

แต่ละบรรทัด stderr คือ JSON object หนึ่งรายการ:

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

ก่อนเปิด PR สุดท้าย:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

คำสั่งควรไม่คืนค่า call sites ของ instrumentation ชั่วคราว เว้นแต่ PR
กำลังเพิ่มพื้นผิวการวินิจฉัยถาวรอย่างชัดเจน สำหรับการแก้ไข performance
ตามปกติ ให้เก็บไว้เฉพาะการเปลี่ยนแปลงพฤติกรรม, tests, และบันทึกสั้นๆ พร้อมหลักฐาน
timing

สำหรับ CPU hotspots ที่ลึกกว่า ให้ใช้ Node profiling (`--cpu-prof`) หรือ profiler ภายนอก
แทนการเพิ่ม timing wrappers เพิ่มเติม

## โหมด watch ของ Gateway

เพื่อการวนแก้ไขที่รวดเร็ว ให้รัน gateway ภายใต้ file watcher:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ทเซสชัน tmux ที่ชื่อ
`openclaw-gateway-watch-main` (หรือ variant เฉพาะ profile/port เช่น
`openclaw-gateway-watch-dev-19001`) และ auto-attach จาก terminal แบบ interactive
shell แบบ non-interactive, CI, และ agent exec calls จะยัง detached และพิมพ์
คำแนะนำการ attach แทน attach ด้วยตนเองเมื่อจำเป็น:

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

ปิด auto-attach ขณะยังคงให้ tmux จัดการ:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profile เวลา CPU ของ Gateway ที่ watch อยู่เมื่อดีบัก startup/runtime hotspots:

```bash
pnpm gateway:watch --benchmark
```

watch wrapper จะใช้ `--benchmark` ก่อนเรียก Gateway และเขียน
V8 `.cpuprofile` หนึ่งไฟล์ต่อการ exit ของ child Gateway ใต้
`.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ท gateway ที่ watch อยู่เพื่อ
flush profile ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

ใช้ `--benchmark-dir <path>` เมื่อคุณต้องการวาง profiles ไว้ที่อื่น

tmux wrapper จะส่ง runtime selectors ทั่วไปที่ไม่ใช่ความลับ เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, และ `OPENCLAW_SKIP_CHANNELS` เข้าไปใน pane ใส่
credentials ของผู้ให้บริการไว้ใน profile/config ปกติของคุณ หรือใช้โหมด foreground ดิบ
สำหรับ secrets ชั่วคราวแบบใช้ครั้งเดียว
pane tmux ที่จัดการให้ยังใช้ค่าเริ่มต้นเป็น logs ของ Gateway แบบมีสีเพื่อให้อ่านง่าย;
ตั้ง `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

watcher จะรีสตาร์ทเมื่อมีไฟล์ที่เกี่ยวข้องกับ build ใต้ `src/`, ไฟล์ source ของ extension,
metadata `package.json` และ `openclaw.plugin.json` ของ extension, `tsconfig.json`,
`package.json`, และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยน metadata ของ extension จะรีสตาร์ท
gateway โดยไม่บังคับ rebuild `tsdown`; การเปลี่ยน source และ config ยังคง
rebuild `dist` ก่อน

เพิ่ม flags ใดๆ ของ gateway CLI หลัง `gateway:watch` แล้ว flags เหล่านั้นจะถูกส่งต่อใน
แต่ละการรีสตาร์ท การรันคำสั่ง watch เดิมซ้ำจะ respawn pane tmux ที่ตั้งชื่อไว้ และ
watcher ดิบยังคงใช้ single-watcher lock เพื่อให้ watcher parents ที่ซ้ำกัน
ถูกแทนที่แทนการสะสม

## Dev profile + dev gateway (`--dev`)

ใช้ dev profile เพื่อแยก state และเริ่ม setup ที่ปลอดภัย ใช้แล้วทิ้งได้สำหรับ
การดีบัก มี flags `--dev` **สอง** แบบ:

- **Global `--dev` (profile):** แยก state ใต้ `~/.openclaw-dev` และ
  ตั้งค่า default ของ gateway port เป็น `19001` (derived ports จะเลื่อนตาม)
- **`gateway --dev`: บอกให้ Gateway auto-create config +
  workspace ค่าเริ่มต้น** เมื่อไม่มี (และข้าม BOOTSTRAP.md)

flow ที่แนะนำ (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากคุณยังไม่มี global install ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่ทำ:

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
   - identity ค่าเริ่มต้น: **C3‑PO** (protocol droid)
   - ข้าม channel providers ใน dev mode (`OPENCLAW_SKIP_CHANNELS=1`)

flow การ reset (เริ่มใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็กโปรไฟล์ **ส่วนกลาง** และถูกบาง runner กินไป หากคุณต้องการระบุให้ชัดเจน ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้าง config, credentials, sessions และเวิร์กสเปซ dev (โดยใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างการตั้งค่า dev เริ่มต้นขึ้นใหม่

<Tip>
หาก Gateway ที่ไม่ใช่ dev กำลังทำงานอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึก raw stream (OpenClaw)

OpenClaw สามารถบันทึก **raw assistant stream** ก่อนการกรอง/จัดรูปแบบใด ๆ ได้
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงเป็นเดลตาข้อความธรรมดาหรือไม่
(หรือเป็นบล็อก thinking แยกต่างหาก)

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การแทนที่ path แบบไม่บังคับ:

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

เพื่อจับ **raw OpenAI-compat chunks** ก่อนที่จะถูกแยกวิเคราะห์เป็นบล็อก
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

> หมายเหตุ: สิ่งนี้จะถูกปล่อยออกมาโดยกระบวนการที่ใช้ provider
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- บันทึก raw stream อาจมีพรอมป์เต็ม, output ของ tool และข้อมูลผู้ใช้
- เก็บบันทึกไว้ในเครื่องและลบทิ้งหลังจากดีบักเสร็จ
- หากคุณแชร์บันทึก ให้ลบ secrets และ PII ออกก่อน

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [FAQ](/th/help/faq)
