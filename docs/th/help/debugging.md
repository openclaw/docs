---
read_when:
    - คุณจำเป็นต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาการรั่วไหลของกระบวนการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูระหว่างการพัฒนาแบบวนซ้ำ
    - คุณต้องมีเวิร์กโฟลว์การดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู สตรีมดิบจากโมเดล และการติดตามการรั่วไหลของกระบวนการให้เหตุผล'
title: การแก้ไขข้อบกพร่อง
x-i18n:
    generated_at: "2026-07-12T16:14:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม การวนรอบพัฒนา Gateway และการทำโปรไฟล์การเริ่มต้น

## การแทนที่ค่าดีบักขณะรันไทม์

`/debug` ตั้งค่าการแทนที่การกำหนดค่าแบบ **เฉพาะขณะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่บนดิสก์) โดยค่าเริ่มต้นจะปิดใช้งาน เปิดใช้ด้วย `commands.debug: true`

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` จะล้างค่าที่แทนที่ทั้งหมดและกลับไปใช้การกำหนดค่าบนดิสก์

## เอาต์พุตการติดตามเซสชัน

`/trace` แสดงบรรทัดการติดตาม/ดีบักที่ Plugin เป็นเจ้าของสำหรับหนึ่งเซสชัน โดยไม่ต้องเปิดโหมดรายละเอียดเต็มรูปแบบ ใช้สำหรับการวินิจฉัย Plugin เช่น สรุปการดีบัก Active Memory ส่วนเอาต์พุตสถานะ/เครื่องมือทั่วไปให้ใช้ `/verbose`

```text
/trace
/trace on
/trace off
```

## การติดตามวงจรชีวิตของ Plugin

ตั้งค่า `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เพื่อดูรายละเอียดทีละเฟสของเมทาดาทา Plugin การค้นหา รีจิสทรี มิเรอร์รันไทม์ การเปลี่ยนแปลงการกำหนดค่า และงานรีเฟรช ระบบจะเขียนไปยัง stderr เพื่อให้เอาต์พุตคำสั่ง JSON ยังคงแยกวิเคราะห์ได้

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

ใช้วิธีนี้ก่อนเลือกใช้ตัวทำโปรไฟล์ CPU หากทำงานจากซอร์สเช็กเอาต์ ให้วัดรันไทม์ที่บิลด์แล้วด้วย `node dist/entry.js ...` หลังจาก `pnpm build` ส่วน `pnpm openclaw ...` จะรวมโอเวอร์เฮดของตัวรันซอร์สไว้ในการวัดด้วย

## การทำโปรไฟล์การเริ่มต้นและคำสั่งของ CLI

เบนช์มาร์กการเริ่มต้นที่รวมอยู่ในรีโพซิทอรี:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

สำหรับการทำโปรไฟล์ครั้งเดียวผ่านตัวรันซอร์สปกติ ให้ตั้งค่า `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ตัวรันซอร์สจะเพิ่มแฟล็กโปรไฟล์ CPU ของ Node และเขียนไฟล์ `.cpuprofile` สำหรับคำสั่งนั้น ใช้วิธีนี้ก่อนเพิ่มเครื่องมือตรวจวัดชั่วคราวลงในโค้ดคำสั่ง

สำหรับการค้างระหว่างเริ่มต้นที่ดูเหมือนเกิดจากงานระบบไฟล์แบบซิงโครนัสหรือตัวโหลดโมดูล ให้เพิ่มแฟล็กติดตาม I/O แบบซิงโครนัสของ Node ผ่านตัวรันซอร์ส:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` จะปิดแฟล็กนี้ไว้โดยค่าเริ่มต้นสำหรับโปรเซสลูก Gateway ที่เฝ้าดูอยู่ ให้ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` เมื่อต้องการเอาต์พุตการติดตาม I/O แบบซิงโครนัสในโหมดเฝ้าดูด้วย

## โหมดเฝ้าดู Gateway

```bash
pnpm gateway:watch
```

โดยค่าเริ่มต้น คำสั่งนี้จะเริ่มหรือรีสตาร์ตเซสชัน tmux ชื่อ `openclaw-gateway-watch-<profile>` (เช่น `openclaw-gateway-watch-main`) และจะเพิ่มส่วนต่อท้ายพอร์ต เช่น `openclaw-gateway-watch-dev-19001` เฉพาะเมื่อ `OPENCLAW_GATEWAY_PORT` แตกต่างจากพอร์ตเริ่มต้น `18789` ระบบจะเชื่อมต่ออัตโนมัติจากเทอร์มินัลแบบโต้ตอบ ส่วนเชลล์แบบไม่โต้ตอบ, CI และการเรียกใช้งานโดยเอเจนต์จะยังคงแยกออกและพิมพ์คำแนะนำในการเชื่อมต่อแทน:

```bash
tmux attach -t openclaw-gateway-watch-main
```

บานหน้าต่าง tmux จะเรียกใช้ตัวเฝ้าดูโดยตรง:

```bash
node scripts/watch-node.mjs gateway --force
```

หยุดบริการ Gateway ที่ติดตั้งไว้ก่อนเฝ้าดูพอร์ตเดียวกัน:

```bash
pnpm openclaw gateway stop
```

แฟล็ก `--force` ของตัวเฝ้าดูจะล้างตัวรับฟังปัจจุบัน แต่ไม่ได้ปิดใช้งานบริการที่มีระบบกำกับดูแล มิฉะนั้น บริการ launchd, systemd หรือ Scheduled Task อาจเริ่มทำงานใหม่และแทนที่ Gateway ที่กำลังเฝ้าดูอยู่

โหมดเบื้องหน้าโดยไม่ใช้ tmux:

```bash
pnpm gateway:watch:raw
# หรือ
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

คงการจัดการ tmux ไว้แต่ปิดการเชื่อมต่ออัตโนมัติ:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

ทำโปรไฟล์เวลา CPU ของ Gateway ที่เฝ้าดูอยู่เมื่อดีบักจุดร้อนระหว่างเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

ตัวห่อหุ้มการเฝ้าดูจะรับ `--benchmark` ไว้ก่อนเรียกใช้ Gateway และเขียนไฟล์ V8 `.cpuprofile` หนึ่งไฟล์ต่อการจบการทำงานของโปรเซสลูก Gateway ไว้ใต้ `.artifacts/gateway-watch-profiles/` หยุดหรือรีสตาร์ต Gateway ที่เฝ้าดูอยู่เพื่อเขียนโปรไฟล์ปัจจุบันให้เสร็จ จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: เขียนโปรไฟล์ไปยังตำแหน่งอื่น
- `--benchmark-no-force`: ข้ามการล้างพอร์ตด้วย `--force` ซึ่งเป็นค่าเริ่มต้น และล้มเหลวทันทีหากพอร์ต Gateway ถูกใช้งานอยู่แล้ว

โหมดเบนช์มาร์กจะระงับเอาต์พุตติดตาม I/O แบบซิงโครนัสจำนวนมากโดยค่าเริ่มต้น ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` ร่วมกับ `--benchmark` เพื่อรับทั้งโปรไฟล์ CPU และสแต็กเทรซ I/O แบบซิงโครนัส ในโหมดเบนช์มาร์ก บล็อกการติดตามเหล่านั้นจะถูกเขียนไปยัง `gateway-watch-output.log` ภายใต้ไดเรกทอรีเบนช์มาร์ก (และถูกกรองออกจากบานหน้าต่างเทอร์มินัล) ขณะที่บันทึก Gateway ปกติยังคงมองเห็นได้

ตัวห่อหุ้ม tmux จะส่งตัวเลือกขณะรันไทม์ทั่วไปที่ไม่ใช่ข้อมูลลับเข้าไปในบานหน้าต่าง รวมถึง `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` ให้ใส่ข้อมูลประจำตัวของผู้ให้บริการไว้ในโปรไฟล์/การกำหนดค่าปกติ หรือใช้โหมดเบื้องหน้าโดยตรงสำหรับข้อมูลลับชั่วคราวแบบใช้ครั้งเดียว

หาก Gateway ที่เฝ้าดูอยู่จบการทำงานระหว่างเริ่มต้น ตัวเฝ้าดูจะเรียกใช้ `openclaw doctor --fix --non-interactive` หนึ่งครั้งแล้วรีสตาร์ตโปรเซสลูก Gateway ตั้งค่า `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อดูความล้มเหลวระหว่างเริ่มต้นดั้งเดิมโดยไม่มีขั้นตอนซ่อมแซมสำหรับการพัฒนาเท่านั้น

บานหน้าต่าง tmux ที่มีการจัดการจะใช้บันทึก Gateway แบบมีสีโดยค่าเริ่มต้น ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

ตัวเฝ้าดูจะรีสตาร์ตเมื่อไฟล์ที่เกี่ยวข้องกับการบิลด์ภายใต้ `src/`, ไฟล์ซอร์สของส่วนขยาย, เมทาดาทา `package.json` และ `openclaw.plugin.json` ของส่วนขยาย, `tsconfig.json`, `package.json` และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนเมทาดาทาของส่วนขยายจะรีสตาร์ต Gateway โดยไม่บังคับให้บิลด์ใหม่ ส่วนการเปลี่ยนแปลงซอร์สและการกำหนดค่าจะยังคงบิลด์ `dist` ใหม่ก่อน

เพิ่มแฟล็ก CLI ของ Gateway หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งต่อทุกครั้งที่รีสตาร์ต การเรียกคำสั่งเฝ้าดูเดิมซ้ำจะสร้างบานหน้าต่าง tmux ที่มีชื่อนั้นใหม่ ตัวเฝ้าดูโดยตรงจะใช้ล็อกสำหรับตัวเฝ้าดูเพียงตัวเดียว เพื่อแทนที่โปรเซสแม่ของตัวเฝ้าดูที่ซ้ำกันแทนที่จะปล่อยให้สะสม

## โปรไฟล์สำหรับการพัฒนา + Gateway สำหรับการพัฒนา (--dev)

มีแฟล็ก `--dev` **สองแฟล็กที่แยกจากกัน**:

- **`--dev` ส่วนกลาง (โปรไฟล์):** แยกสถานะไว้ใต้ `~/.openclaw-dev` และกำหนดพอร์ต Gateway เริ่มต้นเป็น `19001` (พอร์ตที่อนุมานตามมาจะเลื่อนตาม)
- **`gateway --dev`:** สั่งให้ Gateway สร้างการกำหนดค่าเริ่มต้นและพื้นที่ทำงานโดยอัตโนมัติเมื่อยังไม่มี (และข้ามการบูตสแตรป)

ขั้นตอนที่แนะนำ (โปรไฟล์สำหรับการพัฒนา + การบูตสแตรปสำหรับการพัฒนา):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากไม่มีการติดตั้งส่วนกลาง ให้เรียกใช้ CLI ผ่าน `pnpm openclaw ...`

สิ่งที่คำสั่งนี้ทำ:

1. **การแยกโปรไฟล์** (`--dev` ส่วนกลาง)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (พอร์ตเบราว์เซอร์/แคนวาสจะเลื่อนตาม)

2. **การบูตสแตรปสำหรับการพัฒนา** (`gateway --dev`)
   - เขียนการกำหนดค่าขั้นต่ำหากยังไม่มี (`gateway.mode=local`, ผูกกับ local loopback)
   - ตั้งค่า `agents.defaults.workspace` เป็นพื้นที่ทำงานสำหรับการพัฒนา และ `agents.defaults.skipBootstrap=true`
   - สร้างไฟล์เริ่มต้นในพื้นที่ทำงานหากยังไม่มี: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`
   - อัตลักษณ์เริ่มต้น: **C3-PO** (ดรอยด์พิธีการ)
   - `pnpm gateway:dev` ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อข้ามผู้ให้บริการช่องทาง

ขั้นตอนรีเซ็ต (เริ่มต้นใหม่ทั้งหมด):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็กโปรไฟล์ **ส่วนกลาง** และตัวรันบางตัวจะรับแฟล็กนี้ไป หากต้องการระบุอย่างชัดเจน ให้ใช้รูปแบบตัวแปรสภาพแวดล้อม:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้างการกำหนดค่า ข้อมูลประจำตัว เซสชัน และพื้นที่ทำงานสำหรับการพัฒนา (ย้ายไปถังขยะ ไม่ได้ลบถาวร) จากนั้นสร้างการตั้งค่าสำหรับการพัฒนาเริ่มต้นขึ้นใหม่

<Tip>
หากมี Gateway ที่ไม่ใช่สำหรับการพัฒนากำลังทำงานอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึกสตรีมดิบ

OpenClaw สามารถบันทึก **สตรีมดิบของผู้ช่วย** ก่อนการกรอง/จัดรูปแบบใด ๆ วิธีนี้เหมาะที่สุดสำหรับตรวจสอบว่าเหตุผลกำลังเข้ามาในรูปเดลตาข้อความธรรมดา (หรือเป็นบล็อกการคิดแยกต่างหาก) หรือไม่

เปิดใช้ผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

ระบุพาธอื่นได้ตามต้องการ:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

ตัวแปรสภาพแวดล้อมที่ให้ผลเทียบเท่า:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

ไฟล์เริ่มต้น: `~/.openclaw/logs/raw-stream.jsonl`

## หมายเหตุด้านความปลอดภัย

- บันทึกสตรีมดิบอาจมีพรอมต์ฉบับเต็ม เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บบันทึกไว้ภายในเครื่องและลบหลังจากดีบักเสร็จ
- หากแชร์บันทึก ให้ลบข้อมูลลับและข้อมูลระบุตัวบุคคลออกก่อน

## การดีบักใน VSCode

จำเป็นต้องใช้ซอร์สแมป เนื่องจากกระบวนการบิลด์แฮชชื่่อไฟล์ที่สร้างขึ้น `launch.json` ที่รวมมาด้วยกำหนดเป้าหมายเป็นบริการ Gateway:

1. **Rebuild and Debug Gateway** - ลบ `/dist` และบิลด์ใหม่โดยเปิดใช้การดีบักก่อนเริ่ม Gateway
2. **Debug Gateway** - ดีบักบิลด์ที่มีอยู่โดยไม่แก้ไข `/dist`

### การตั้งค่า

1. เปิด **Run and Debug** (แถบกิจกรรม หรือ `Ctrl`+`Shift`+`D`)
2. เลือก **Rebuild and Debug Gateway** แล้วกด **Start Debugging**

หากต้องการจัดการวงจรการบิลด์/ดีบักด้วยตนเองแทน:

1. เปิดใช้ซอร์สแมปในเทอร์มินัล:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. บิลด์ใหม่: `pnpm clean:dist && pnpm build`
3. เลือก **Debug Gateway** แล้วกด **Start Debugging**

ตั้งจุดหยุดในไฟล์ TypeScript ภายใต้ `src/` ตัวดีบักจะแมปจุดเหล่านั้นไปยัง JavaScript ที่คอมไพล์แล้วผ่านซอร์สแมป

### หมายเหตุ

- **Rebuild and Debug Gateway** จะลบ `/dist` และเรียกใช้ `pnpm build` แบบเต็มโดยเปิดใช้ซอร์สแมปทุกครั้งที่เริ่ม
- **Debug Gateway** สามารถเริ่ม/หยุดได้โดยไม่กระทบ `/dist` แต่คุณต้องจัดการวงจรการบิลด์ในเทอร์มินัลแยกต่างหาก
- แก้ไข `args` ใน `launch.json` เพื่อดีบักคำสั่งย่อย CLI อื่น
- หากต้องการใช้ CLI ที่บิลด์แล้วสำหรับงานอื่น (เช่น `dashboard --no-open` หากเซสชันดีบักของคุณสร้างโทเค็นการยืนยันตัวตนใหม่) ให้เรียกใช้จากเทอร์มินัลอื่น: `node ./openclaw.mjs` หรือนามแฝง เช่น `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [คำถามที่พบบ่อย](/th/help/faq)
