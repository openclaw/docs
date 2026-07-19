---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของกระบวนการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูระหว่างการปรับแก้ซ้ำๆ
    - คุณต้องมีกระบวนการดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู สตรีมโมเดลดิบ และการติดตามการรั่วไหลของกระบวนการให้เหตุผล'
title: การแก้ไขข้อบกพร่อง
x-i18n:
    generated_at: "2026-07-19T07:14:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc06b15958dc4a7607a9bce98794e61d82bba42fd943419cd00ca8bceef0b7c4
    source_path: help/debugging.md
    workflow: 16
---

เครื่องมือช่วยดีบักสำหรับเอาต์พุตแบบสตรีม การวนพัฒนา Gateway และการทำโปรไฟล์การเริ่มต้นระบบ

## การแทนที่ค่าดีบักขณะรันไทม์

`/debug` กำหนดค่าคอนฟิกแทนที่สำหรับ **ขณะรันไทม์เท่านั้น** (ในหน่วยความจำ ไม่ใช่บนดิสก์) ค่าเริ่มต้นคือปิดใช้งาน เปิดใช้งานด้วย `commands.debug: true`

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` ล้างค่าที่แทนที่ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุตการติดตามเซสชัน

`/trace` แสดงบรรทัดการติดตาม/ดีบักที่ Plugin เป็นเจ้าของสำหรับหนึ่งเซสชัน โดยไม่เปิดโหมดรายละเอียดเต็มรูปแบบ ใช้สำหรับการวินิจฉัย Plugin เช่น สรุปการดีบัก Active Memory และใช้ `/verbose` สำหรับเอาต์พุตสถานะ/เครื่องมือตามปกติ

```text
/trace
/trace on
/trace off
```

## การติดตามวงจรชีวิต Plugin

ตั้งค่า `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เพื่อดูรายละเอียดแต่ละเฟสของเมทาดาทา Plugin การค้นหา รีจิสทรี มิเรอร์รันไทม์ การแก้ไขคอนฟิก และงานรีเฟรช ระบบจะเขียนไปยัง stderr เพื่อให้เอาต์พุตคำสั่ง JSON ยังคงแยกวิเคราะห์ได้
เมื่อเปิดใช้การติดตามนี้ ความล้มเหลวในการโหลด Plugin จะรวมสแต็กเทรซไว้ด้วย

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

ใช้วิธีนี้ก่อนหันไปใช้ตัวทำโปรไฟล์ CPU จากซอร์สเช็กเอาต์ ให้วัดรันไทม์ที่สร้างแล้วด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; ส่วน `pnpm openclaw ...` จะวัดโอเวอร์เฮดของตัวรันซอร์สด้วย

สำหรับการจับเวลาการโหลดโมดูลแบบซิงโครนัส ให้ใช้พื้นผิวการวินิจฉัยที่ใช้ร่วมกันแทนสวิตช์สภาพแวดล้อมเฉพาะ Plugin แยกต่างหาก:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## การทำโปรไฟล์การเริ่มต้น CLI และคำสั่ง

เบนช์มาร์กการเริ่มต้นที่เช็กอินไว้:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการทำโปรไฟล์แบบครั้งเดียวผ่านตัวรันซอร์สตามปกติ ให้ตั้งค่า `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ตัวรันซอร์สจะเพิ่มแฟล็กโปรไฟล์ CPU ของ Node และเขียน `.cpuprofile` สำหรับคำสั่ง ใช้วิธีนี้ก่อนเพิ่มเครื่องมือวัดชั่วคราวลงในโค้ดคำสั่ง

สำหรับการเริ่มต้นที่ค้างและดูเหมือนเกิดจากงานระบบไฟล์หรือตัวโหลดโมดูลแบบซิงโครนัส ให้เพิ่มแฟล็กติดตาม I/O แบบซิงโครนัสของ Node ผ่านตัวรันซอร์ส:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` จะปิดแฟล็กนี้ไว้โดยค่าเริ่มต้นสำหรับโปรเซสลูก Gateway ที่เฝ้าดูอยู่ ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` เมื่อต้องการเอาต์พุตการติดตาม I/O แบบซิงโครนัสในโหมดเฝ้าดูด้วย

## โหมดเฝ้าดู Gateway

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น คำสั่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ `openclaw-gateway-watch-<profile>` (ตัวอย่างเช่น `openclaw-gateway-watch-main`) โดยจะเพิ่มส่วนต่อท้ายพอร์ต เช่น `openclaw-gateway-watch-dev-19001` เฉพาะเมื่อ `OPENCLAW_GATEWAY_PORT` แตกต่างจากพอร์ตเริ่มต้น `18789` ระบบจะแนบเซสชันโดยอัตโนมัติจากเทอร์มินัลแบบโต้ตอบ ส่วนเชลล์แบบไม่โต้ตอบ CI และการเรียกดำเนินการของเอเจนต์จะยังคงแยกออกและพิมพ์คำแนะนำในการแนบเซสชันแทน:

```bash
tmux attach -t openclaw-gateway-watch-main
# อ่านเอาต์พุตล่าสุดโดยไม่ต้องแนบเซสชัน
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

เพนใช้ tmux `remain-on-exit` ดังนั้นความล้มเหลวระหว่างการเริ่มต้นจะยังคงพร้อมให้แนบหรือจับเอาต์พุต แทนที่จะลบเซสชัน การเรียก `pnpm gateway:watch` อีกครั้งจะสร้างเพนนั้นใหม่

เพน tmux เรียกใช้ตัวเฝ้าดูโดยตรง:

```bash
node scripts/watch-node.mjs gateway --force
```

ก่อนเฝ้าดูพอร์ตที่กำหนดค่าไว้/พอร์ตเริ่มต้น ตัวครอบ tmux จะหยุดบริการ Gateway ที่ติดตั้งไว้ของโปรไฟล์ที่ใช้งานอยู่ ซึ่งมอบพอร์ตให้ตัวเฝ้าดูจากซอร์สโดยไม่ให้ launchd, systemd หรือ Scheduled Task เริ่มโปรเซสใหม่และเข้ามาแทนที่ บริการยังคงติดตั้งอยู่ ให้คืนค่าหลังจบเซสชันเฝ้าดูด้วย:

```bash
pnpm openclaw gateway start
```

เมื่อ `--port` หรือ `OPENCLAW_GATEWAY_PORT` ที่ระบุอย่างชัดเจนแตกต่างจากพอร์ตที่มีผลจริงของบริการที่ติดตั้ง ตัวครอบจะปล่อยให้บริการทำงานต่อไป เพื่อให้ Gateway ทั้งสองทำงานเคียงข้างกันได้

โหมดเบื้องหน้าโดยไม่ใช้ tmux:

```bash
pnpm gateway:watch:raw
# หรือ
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

โหมดโดยตรงจะไม่จัดการบริการที่ติดตั้งไว้ ให้เรียก `pnpm openclaw gateway stop` ก่อนเมื่อบริการใช้พอร์ตเดียวกัน

คงการจัดการ tmux ไว้แต่ปิดการแนบอัตโนมัติ:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

ทำโปรไฟล์เวลา CPU ของ Gateway ที่เฝ้าดูอยู่เมื่อตรวจสอบฮอตสปอตระหว่างการเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

ตัวครอบการเฝ้าดูจะใช้ `--benchmark` ก่อนเรียก Gateway และเขียน V8 `.cpuprofile` หนึ่งไฟล์ต่อการออกของโปรเซสลูก Gateway ไว้ใต้ `.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต Gateway ที่เฝ้าดูเพื่อฟลัชโปรไฟล์ปัจจุบัน จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: เขียนโปรไฟล์ไปยังตำแหน่งอื่น
- `--benchmark-no-force`: ข้ามการล้างพอร์ตเริ่มต้น `--force` และล้มเหลวทันทีหากพอร์ต Gateway ถูกใช้งานอยู่แล้ว

โหมดเบนช์มาร์กจะระงับเอาต์พุตติดตาม I/O แบบซิงโครนัสจำนวนมากโดยค่าเริ่มต้น ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` ร่วมกับ `--benchmark` เพื่อรับทั้งโปรไฟล์ CPU และสแต็กเทรซ I/O แบบซิงโครนัส ในโหมดเบนช์มาร์ก บล็อกการติดตามเหล่านี้จะถูกส่งไปยัง `gateway-watch-output.log` ใต้ไดเรกทอรีเบนช์มาร์ก (และถูกกรองออกจากเพนเทอร์มินัล) ขณะที่บันทึก Gateway ตามปกติยังคงมองเห็นได้

ตัวครอบ tmux จะส่งตัวเลือกเลือกรันไทม์ทั่วไปที่ไม่เป็นความลับเข้าไปในเพน รวมถึง `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` ให้ใส่ข้อมูลประจำตัวของผู้ให้บริการไว้ในโปรไฟล์/คอนฟิกตามปกติ หรือใช้โหมดเบื้องหน้าโดยตรงสำหรับข้อมูลลับชั่วคราวแบบครั้งเดียว

หาก Gateway ที่เฝ้าดูออกระหว่างการเริ่มต้น ตัวเฝ้าดูจะเรียก `openclaw doctor --fix --non-interactive` หนึ่งครั้งและรีสตาร์ตโปรเซสลูก Gateway ตั้งค่า `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อดูความล้มเหลวในการเริ่มต้นเดิมโดยไม่ผ่านการซ่อมแซมเฉพาะการพัฒนา

เพน tmux ที่จัดการไว้จะใช้บันทึก Gateway แบบมีสีโดยค่าเริ่มต้น ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

ตัวเฝ้าดูจะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับการสร้างภายใต้ `src/`, ไฟล์ซอร์สส่วนขยาย, เมทาดาทา `package.json` และ `openclaw.plugin.json` ของส่วนขยาย, `tsconfig.json`, `package.json` และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนเมทาดาทาส่วนขยายจะรีสตาร์ต Gateway โดยไม่บังคับให้สร้างใหม่ ส่วนการเปลี่ยนซอร์สและคอนฟิกยังคงสร้าง `dist` ใหม่ก่อน

เพิ่มแฟล็ก CLI ของ Gateway หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งผ่านในการรีสตาร์ตแต่ละครั้ง การเรียกคำสั่งเฝ้าดูเดิมอีกครั้งจะสร้างเพน tmux ที่มีชื่อนั้นใหม่ ตัวเฝ้าดูโดยตรงใช้ล็อกตัวเฝ้าดูเดียว เพื่อแทนที่โปรเซสแม่ของตัวเฝ้าดูที่ซ้ำกันแทนที่จะปล่อยให้สะสม

## โปรไฟล์พัฒนา + Gateway สำหรับการพัฒนา (--dev)

มีแฟล็ก `--dev` ที่ **แยกจากกัน** สองรายการ:

- **`--dev` ส่วนกลาง (โปรไฟล์):** แยกสถานะไว้ภายใต้ `~/.openclaw-dev` และกำหนดพอร์ต Gateway เริ่มต้นเป็น `19001` (พอร์ตที่คำนวณต่อเนื่องจะเลื่อนตาม)
- **`gateway --dev`:** สั่งให้ Gateway สร้างคอนฟิกเริ่มต้นและเวิร์กสเปซโดยอัตโนมัติเมื่อไม่มี (และข้ามบูตสแตรป)

ขั้นตอนที่แนะนำ (โปรไฟล์พัฒนา + บูตสแตรปสำหรับการพัฒนา):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากไม่มีการติดตั้งแบบส่วนกลาง ให้เรียกใช้ CLI ผ่าน `pnpm openclaw ...`

สิ่งที่จะเกิดขึ้น:

1. **การแยกโปรไฟล์** (`--dev` ส่วนกลาง)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (พอร์ตเบราว์เซอร์/แคนวาสจะเลื่อนตาม)

2. **บูตสแตรปสำหรับการพัฒนา** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำหากไม่มี (`gateway.mode=local`, ผูกกับลูปแบ็ก)
   - ตั้งค่า `agents.defaults.workspace` ไปยังเวิร์กสเปซสำหรับการพัฒนาและ `agents.defaults.skipBootstrap=true`
   - สร้างไฟล์ตั้งต้นในเวิร์กสเปซหากไม่มี: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`
   - อัตลักษณ์เริ่มต้น: **C3-PO** (ดรอยด์พิธีสาร)
   - `pnpm gateway:dev` ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อข้ามผู้ให้บริการช่องทาง

ขั้นตอนรีเซ็ต (เริ่มต้นใหม่):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็กโปรไฟล์ **ส่วนกลาง** และตัวรันบางตัวจะนำแฟล็กนี้ไปใช้ หากต้องการระบุให้ชัดเจน ให้ใช้รูปแบบตัวแปรสภาพแวดล้อม:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` ล้างคอนฟิก ข้อมูลประจำตัว เซสชัน และเวิร์กสเปซสำหรับการพัฒนา (ย้ายไปถังขยะ ไม่ได้ลบ) จากนั้นสร้างการตั้งค่าพัฒนาเริ่มต้นใหม่

<Tip>
หากมี Gateway ที่ไม่ใช่สำหรับการพัฒนาทำงานอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึกสตรีมดิบ

OpenClaw สามารถบันทึก **สตรีมดิบของผู้ช่วย** ก่อนการกรอง/จัดรูปแบบใด ๆ นี่เป็นวิธีที่ดีที่สุดในการดูว่าเหตุผลมาถึงในรูปเดลตาข้อความธรรมดา (หรือเป็นบล็อกการคิดแยกต่างหาก)

เปิดใช้งานผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

ระบุพาธอื่นได้ตามต้องการ:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

ตัวแปรสภาพแวดล้อมที่เทียบเท่า:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น: `~/.openclaw/logs/raw-stream.jsonl`

## หมายเหตุด้านความปลอดภัย

- บันทึกสตรีมดิบอาจมีพรอมต์ฉบับเต็ม เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บบันทึกไว้ในเครื่องและลบหลังดีบักเสร็จ
- หากแชร์บันทึก ให้ลบข้อมูลลับและ PII ออกก่อน

## การดีบักใน VSCode

จำเป็นต้องใช้ซอร์สแมป เนื่องจากกระบวนการสร้างจะแฮชชื่อไฟล์ที่สร้างขึ้น `launch.json` ที่ให้มามีเป้าหมายเป็นบริการ Gateway:

1. **สร้างใหม่และดีบัก Gateway** - ลบ `/dist` และสร้างใหม่โดยเปิดการดีบักก่อนเริ่ม Gateway
2. **ดีบัก Gateway** - ดีบักบิลด์ที่มีอยู่โดยไม่แก้ไข `/dist`

### การตั้งค่า

1. เปิด **Run and Debug** (แถบกิจกรรม หรือ `Ctrl`+`Shift`+`D`)
2. เลือก **Rebuild and Debug Gateway** แล้วกด **Start Debugging**

หากต้องการจัดการรอบการสร้าง/ดีบักด้วยตนเองแทน:

1. เปิดใช้ซอร์สแมปในเทอร์มินัล:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. สร้างใหม่: `pnpm clean:dist && pnpm build`
3. เลือก **Debug Gateway** แล้วกด **Start Debugging**

ตั้งเบรกพอยต์ในไฟล์ TypeScript `src/`; ดีบักเกอร์จะแมปไฟล์เหล่านั้นไปยัง JavaScript ที่คอมไพล์แล้วผ่านซอร์สแมป

### หมายเหตุ

- **สร้างใหม่และดีบัก Gateway** จะลบ `/dist` และเรียก `pnpm build` แบบเต็มโดยเปิดซอร์สแมปทุกครั้งที่เริ่ม
- **ดีบัก Gateway** สามารถเริ่ม/หยุดได้โดยไม่กระทบ `/dist` แต่ต้องจัดการรอบการสร้างในเทอร์มินัลแยกต่างหาก
- แก้ไข `launch.json` `args` เพื่อดีบักคำสั่งย่อย CLI อื่น
- หากต้องการใช้ CLI ที่สร้างแล้วสำหรับงานอื่น (ตัวอย่างเช่น `dashboard --no-open` หากเซสชันดีบักสร้างโทเค็นรับรองความถูกต้องใหม่) ให้เรียกจากเทอร์มินัลอื่น: `node ./openclaw.mjs` หรือนามแฝง เช่น `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [คำถามที่พบบ่อย](/th/help/faq)
