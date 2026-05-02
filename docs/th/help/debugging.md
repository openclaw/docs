---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูขณะปรับแก้ซ้ำไปมา
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู, สตรีมโมเดลดิบ และการติดตามการรั่วไหลของการให้เหตุผล'
title: การดีบัก
x-i18n:
    generated_at: "2026-05-02T10:18:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม โดยเฉพาะเมื่อผู้ให้บริการผสมเหตุผลลงในข้อความปกติ

## การแทนที่การดีบักของรันไทม์

ใช้ `/debug` ในแชตเพื่อตั้งค่าการแทนที่คอนฟิกแบบ **เฉพาะรันไทม์** (หน่วยความจำ ไม่ใช่ดิสก์)
`/debug` ถูกปิดใช้งานโดยค่าเริ่มต้น เปิดใช้งานด้วย `commands.debug: true`
สิ่งนี้มีประโยชน์เมื่อคุณต้องสลับการตั้งค่าที่ไม่ค่อยพบโดยไม่ต้องแก้ไข `openclaw.json`

ตัวอย่าง:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` ล้างการแทนที่ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุตร่องรอยของเซสชัน

ใช้ `/trace` เมื่อคุณต้องการดูบรรทัดร่องรอย/ดีบักที่ Plugin เป็นเจ้าของในหนึ่งเซสชัน
โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ

ตัวอย่าง:

```text
/trace
/trace on
/trace off
```

ใช้ `/trace` สำหรับการวินิจฉัย Plugin เช่น สรุปดีบักของ Active Memory
ใช้ `/verbose` ต่อไปสำหรับเอาต์พุตสถานะ/เครื่องมือแบบ verbose ปกติ และใช้
`/debug` ต่อไปสำหรับการแทนที่คอนฟิกแบบเฉพาะรันไทม์

## ร่องรอยวงจรชีวิตของ Plugin

ใช้ `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เมื่อคำสั่งวงจรชีวิตของ Plugin รู้สึกช้า
และคุณต้องการรายละเอียดเฟสในตัวสำหรับเมทาดาทาของ Plugin, การค้นพบ, รีจิสทรี,
มิเรอร์รันไทม์, การเปลี่ยนแปลงคอนฟิก และงานรีเฟรช ร่องรอยเป็นแบบเลือกเปิดและเขียน
ไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON จึงยังคงแยกวิเคราะห์ได้

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

ใช้สิ่งนี้สำหรับการตรวจสอบวงจรชีวิตของ Plugin ก่อนหันไปใช้ตัวทำโปรไฟล์ CPU
ถ้าคำสั่งกำลังรันจากเช็กเอาต์ซอร์ส ให้เลือกวัดรันไทม์ที่บิลด์แล้ว
ด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; `pnpm openclaw ...`
ยังวัดโอเวอร์เฮดของตัวรันซอร์สด้วย

## การจับเวลาดีบัก CLI ชั่วคราว

OpenClaw เก็บ `src/cli/debug-timing.ts` เป็นตัวช่วยขนาดเล็กสำหรับการตรวจสอบภายในเครื่อง
โดยตั้งใจไม่เชื่อมเข้ากับการเริ่มต้น CLI, การกำหนดเส้นทางคำสั่ง,
หรือคำสั่งใด ๆ โดยค่าเริ่มต้น ใช้เฉพาะระหว่างดีบักคำสั่งที่ช้า จากนั้น
ลบ import และ span ก่อนลงการเปลี่ยนแปลงพฤติกรรม

ใช้สิ่งนี้เมื่อคำสั่งช้าและคุณต้องการรายละเอียดเฟสอย่างรวดเร็วก่อน
ตัดสินใจว่าจะใช้ตัวทำโปรไฟล์ CPU หรือแก้ระบบย่อยเฉพาะ

### เพิ่ม span ชั่วคราว

เพิ่มตัวช่วยใกล้โค้ดที่คุณกำลังตรวจสอบ ตัวอย่างเช่น ระหว่างดีบัก
`openclaw models list` แพตช์ชั่วคราวใน
`src/commands/models/list.list-command.ts` อาจหน้าตาแบบนี้:

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

- ขึ้นต้นชื่อเฟสชั่วคราวด้วย `debug:`
- เพิ่ม span เพียงไม่กี่จุดรอบส่วนที่สงสัยว่าช้า
- เลือกใช้เฟสกว้าง ๆ เช่น `registry`, `auth_store` หรือ `rows` แทนชื่อ helper
- ใช้ `time()` สำหรับงานแบบซิงโครนัส และ `timeAsync()` สำหรับพรอมิส
- รักษา stdout ให้สะอาด ตัวช่วยเขียนไปยัง stderr ดังนั้นเอาต์พุตคำสั่ง JSON จึงยังคงแยกวิเคราะห์ได้
- ลบ import และ span ชั่วคราวก่อนเปิด PR แก้ไขขั้นสุดท้าย
- ใส่เอาต์พุตการจับเวลา หรือสรุปสั้น ๆ ใน issue หรือ PR ที่อธิบายการปรับปรุงประสิทธิภาพ

### รันพร้อมเอาต์พุตที่อ่านง่าย

โหมดอ่านง่ายเหมาะที่สุดสำหรับการดีบักสด:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

เอาต์พุตตัวอย่างจากการตรวจสอบ `models list` ชั่วคราว:

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

| เฟส                                      |        เวลา | ความหมาย                                                                                                |
| ---------------------------------------- | ----------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20.3s | การโหลดสโตร์ auth-profile เป็นต้นทุนที่ใหญ่ที่สุดและควรตรวจสอบก่อน                                      |
| `debug:models:list:ensure_models_json`   |        5.0s | การซิงก์ `models.json` มีต้นทุนมากพอให้ตรวจสอบเรื่องแคชหรือเงื่อนไขการข้าม                              |
| `debug:models:list:load_model_registry`  |        5.9s | การสร้างรีจิสทรีและงานความพร้อมใช้งานของผู้ให้บริการก็เป็นต้นทุนที่มีนัยสำคัญเช่นกัน                    |
| `debug:models:list:read_registry_models` |        2.4s | การอ่านโมเดลรีจิสทรีทั้งหมดไม่ฟรีและอาจสำคัญสำหรับ `--all`                                             |
| เฟสเพิ่มแถว                              | รวม 3.2s    | การสร้างแถวที่แสดงห้าแถวยังคงใช้เวลาหลายวินาที ดังนั้นเส้นทางการกรองสมควรถูกตรวจสอบให้ละเอียดขึ้น     |
| `debug:models:list:print_model_table`    |         0ms | การเรนเดอร์ไม่ใช่คอขวด                                                                                  |

ข้อค้นพบเหล่านั้นเพียงพอที่จะนำทางแพตช์ถัดไปโดยไม่ต้องเก็บโค้ดจับเวลาไว้ใน
เส้นทางโปรดักชัน

### รันพร้อมเอาต์พุต JSON

ใช้โหมด JSON เมื่อคุณต้องการบันทึกหรือเปรียบเทียบข้อมูลการจับเวลา:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

แต่ละบรรทัด stderr เป็นออบเจ็กต์ JSON หนึ่งรายการ:

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

### ทำความสะอาดก่อนลงงาน

ก่อนเปิด PR ขั้นสุดท้าย:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

คำสั่งควรไม่คืนไซต์เรียก instrumentation ชั่วคราว เว้นแต่ PR
กำลังเพิ่มพื้นผิวการวินิจฉัยถาวรอย่างชัดเจน สำหรับการแก้ประสิทธิภาพปกติ
ให้เก็บเฉพาะการเปลี่ยนแปลงพฤติกรรม, การทดสอบ และบันทึกสั้น ๆ พร้อมหลักฐานการจับเวลา

สำหรับฮอตสปอต CPU ที่ลึกกว่า ให้ใช้การทำโปรไฟล์ของ Node (`--cpu-prof`) หรือตัวทำโปรไฟล์ภายนอก
แทนการเพิ่ม wrapper จับเวลาเพิ่มเติม

## โหมดเฝ้าดู Gateway

เพื่อวนแก้ไขได้เร็ว ให้รัน Gateway ภายใต้ตัวเฝ้าดูไฟล์:

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น สิ่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ
`openclaw-gateway-watch-main` (หรือรูปแบบเฉพาะโปรไฟล์/พอร์ต เช่น
`openclaw-gateway-watch-dev-19001`) และแนบอัตโนมัติจากเทอร์มินัลแบบโต้ตอบ
เชลล์แบบไม่โต้ตอบ, CI และการเรียก exec ของเอเจนต์จะยังคงแยกอยู่และพิมพ์
คำแนะนำการแนบแทน แนบด้วยตนเองเมื่อจำเป็น:

```bash
tmux attach -t openclaw-gateway-watch-main
```

พาเนล tmux รันตัวเฝ้าดิบ:

```bash
node scripts/watch-node.mjs gateway --force
```

ใช้โหมด foreground เมื่อไม่ต้องการ tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

ปิดการแนบอัตโนมัติขณะยังคงการจัดการ tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

wrapper ของ tmux ส่งตัวเลือกไม่ลับของรันไทม์ที่ใช้บ่อย เช่น
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` เข้าไปในพาเนล ใส่
ข้อมูลรับรองของผู้ให้บริการไว้ในโปรไฟล์/คอนฟิกปกติของคุณ หรือใช้โหมด foreground ดิบ
สำหรับความลับชั่วคราวเฉพาะครั้ง
พาเนล tmux ที่จัดการแล้วยังตั้งค่าเริ่มต้นให้บันทึก Gateway มีสีเพื่อให้อ่านง่าย
ตั้ง `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

ตัวเฝ้าดูจะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับการบิลด์ใต้ `src/`, ไฟล์ซอร์สของ Plugin,
เมทาดาทา `package.json` และ `openclaw.plugin.json` ของ Plugin, `tsconfig.json`,
`package.json` และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลงเมทาดาทาของ Plugin จะรีสตาร์ต
Gateway โดยไม่บังคับให้บิลด์ `tsdown` ใหม่ ส่วนการเปลี่ยนแปลงซอร์สและคอนฟิกยังคง
บิลด์ `dist` ก่อน

เพิ่มแฟล็ก CLI ของ Gateway ใด ๆ หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งต่อใน
ทุกการรีสตาร์ต การรันคำสั่ง watch เดิมซ้ำจะสร้างพาเนล tmux ที่มีชื่อขึ้นใหม่ และ
ตัวเฝ้าดิบยังคงใช้ล็อกตัวเฝ้าเดี่ยว ดังนั้นตัวเฝ้าพาเรนต์ที่ซ้ำกันจะถูกแทนที่
แทนที่จะสะสมเพิ่มขึ้น

## โปรไฟล์ dev + Gateway dev (--dev)

ใช้โปรไฟล์ dev เพื่อแยกสถานะและเริ่มชุดตั้งค่าที่ปลอดภัยและทิ้งได้สำหรับ
การดีบัก มีแฟล็ก `--dev` **สอง** แบบ:

- **`--dev` แบบโกลบอล (โปรไฟล์):** แยกสถานะไว้ใต้ `~/.openclaw-dev` และ
  ตั้งค่าพอร์ต Gateway เริ่มต้นเป็น `19001` (พอร์ตที่อนุมานจะเลื่อนตาม)
- **`gateway --dev`: บอก Gateway ให้สร้างคอนฟิก + เวิร์กสเปซเริ่มต้นอัตโนมัติ**
  เมื่อไม่มีอยู่ (และข้าม BOOTSTRAP.md)

โฟลว์ที่แนะนำ (โปรไฟล์ dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

ถ้าคุณยังไม่มีการติดตั้งแบบโกลบอล ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งนี้ทำอะไร:

1. **การแยกโปรไฟล์** (`--dev` แบบโกลบอล)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (เบราว์เซอร์/แคนวาสเลื่อนตาม)

2. **Bootstrap dev** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำถ้าไม่มี (`gateway.mode=local`, ผูกกับ loopback)
   - ตั้ง `agent.workspace` เป็นเวิร์กสเปซ dev
   - ตั้ง `agent.skipBootstrap=true` (ไม่มี BOOTSTRAP.md)
   - ใส่ไฟล์เวิร์กสเปซเริ่มต้นถ้าไม่มี:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - อัตลักษณ์เริ่มต้น: **C3‑PO** (ดรอยด์พิธีการ)
   - ข้ามผู้ให้บริการช่องทางในโหมด dev (`OPENCLAW_SKIP_CHANNELS=1`)

โฟลว์รีเซ็ต (เริ่มใหม่สะอาด):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็กโปรไฟล์แบบ **โกลบอล** และถูกบาง runner กลืนไป ถ้าคุณต้องการเขียนให้ชัด ให้ใช้รูปแบบ env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` ล้างคอนฟิก, ข้อมูลรับรอง, เซสชัน และเวิร์กสเปซ dev (ใช้
`trash` ไม่ใช่ `rm`) จากนั้นสร้างชุดตั้งค่า dev เริ่มต้นขึ้นใหม่

<Tip>
ถ้า Gateway ที่ไม่ใช่ dev กำลังรันอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึกสตรีมดิบ (OpenClaw)

OpenClaw สามารถบันทึก **สตรีมผู้ช่วยแบบดิบ** ก่อนการกรอง/จัดรูปแบบใดๆ ได้
นี่เป็นวิธีที่ดีที่สุดในการดูว่า reasoning มาถึงในรูปแบบเดลตาข้อความธรรมดา
(หรือเป็นบล็อก thinking แยกต่างหาก)

เปิดใช้งานผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การแทนที่พาธแบบไม่บังคับ:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น:

`~/.openclaw/logs/raw-stream.jsonl`

## การบันทึกชังก์ดิบ (pi-mono)

หากต้องการจับ **ชังก์ดิบที่เข้ากันได้กับ OpenAI** ก่อนที่ชังก์เหล่านั้นจะถูกแยกวิเคราะห์เป็นบล็อก
pi-mono มี logger แยกต่างหาก:

```bash
PI_RAW_STREAM=1
```

พาธแบบไม่บังคับ:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

ไฟล์เริ่มต้น:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> หมายเหตุ: รายการนี้จะถูกส่งออกโดยโปรเซสที่ใช้ provider
> `openai-completions` ของ pi-mono เท่านั้น

## หมายเหตุด้านความปลอดภัย

- บันทึกสตรีมดิบอาจรวมถึง prompt ฉบับเต็ม, ผลลัพธ์จากเครื่องมือ และข้อมูลผู้ใช้
- เก็บบันทึกไว้ในเครื่องและลบหลังจากดีบักเสร็จ
- หากคุณแชร์บันทึก ให้ลบข้อมูลลับและ PII ออกก่อน

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [คำถามที่พบบ่อย](/th/help/faq)
