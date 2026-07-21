---
read_when:
    - คุณต้องตรวจสอบเอาต์พุตดิบของโมเดลเพื่อหาร่องรอยการรั่วไหลของกระบวนการให้เหตุผล
    - คุณต้องการเรียกใช้ Gateway ในโหมดเฝ้าดูระหว่างการพัฒนาแบบวนซ้ำ
    - คุณต้องมีกระบวนการดีบักที่ทำซ้ำได้
summary: 'เครื่องมือดีบัก: โหมดเฝ้าดู สตรีมข้อมูลดิบจากโมเดล และการติดตามการรั่วไหลของกระบวนการใช้เหตุผล'
title: การแก้ไขข้อบกพร่อง
x-i18n:
    generated_at: "2026-07-21T15:22:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 651976deb52841711f6c29be0a36359d5d05ef0b0bd21bba6f89620b5b024487
    source_path: help/debugging.md
    workflow: 16
---

ตัวช่วยดีบักสำหรับเอาต์พุตแบบสตรีม การวนพัฒนา Gateway และการทำโปรไฟล์การเริ่มต้นระบบ

## การแทนที่ค่าดีบักขณะรันไทม์

`/debug` ตั้งค่าการแทนที่คอนฟิกแบบ **เฉพาะรันไทม์** (อยู่ในหน่วยความจำ ไม่ใช่บนดิสก์) โดยค่าเริ่มต้นจะปิดไว้ เปิดใช้งานด้วย `commands.debug: true`

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` ล้างค่าการแทนที่ทั้งหมดและกลับไปใช้คอนฟิกบนดิสก์

## เอาต์พุตการติดตามเซสชัน

`/trace` แสดงบรรทัดการติดตาม/ดีบักที่ Plugin เป็นเจ้าของสำหรับหนึ่งเซสชัน โดยไม่ต้องเปิดโหมด verbose เต็มรูปแบบ ใช้สำหรับการวินิจฉัย Plugin เช่น สรุปการดีบัก Active Memory และใช้ `/verbose` สำหรับเอาต์พุตสถานะ/เครื่องมือตามปกติ

```text
/trace
/trace on
/trace off
```

## การติดตามวงจรชีวิตของ Plugin

ตั้งค่า `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` เพื่อดูรายละเอียดแบบแยกแต่ละเฟสของเมทาดาทา Plugin การค้นหา รีจิสทรี มิเรอร์รันไทม์ การเปลี่ยนแปลงคอนฟิก และงานรีเฟรช โดยจะเขียนไปยัง stderr เพื่อให้เอาต์พุตคำสั่ง JSON ยังคงแยกวิเคราะห์ได้
เมื่อเปิดการติดตามนี้ ความล้มเหลวในการโหลด Plugin จะรวมสแต็กเทรซไว้ด้วย

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

ใช้วิธีนี้ก่อนเลือกใช้ตัวทำโปรไฟล์ CPU จากเช็กเอาต์ซอร์ส ให้วัดรันไทม์ที่สร้างแล้วด้วย `node dist/entry.js ...` หลังจาก `pnpm build`; ส่วน `pnpm openclaw ...` จะรวมการวัดโอเวอร์เฮดของตัวรันซอร์สด้วย

สำหรับการวัดเวลาการโหลดโมดูลแบบซิงโครนัส ให้ใช้พื้นผิวการวินิจฉัยร่วมแทนสวิตช์สภาพแวดล้อมที่แยกไว้เฉพาะ Plugin:

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

สำหรับการทำโปรไฟล์ครั้งเดียวผ่านตัวรันซอร์สตามปกติ ให้ตั้งค่า `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ตัวรันซอร์สจะเพิ่มแฟล็กโปรไฟล์ CPU ของ Node และเขียน `.cpuprofile` สำหรับคำสั่ง ใช้วิธีนี้ก่อนเพิ่มเครื่องมือวัดชั่วคราวลงในโค้ดคำสั่ง

สำหรับอาการค้างระหว่างเริ่มต้นที่ดูเหมือนเกิดจากระบบไฟล์แบบซิงโครนัสหรืองานของตัวโหลดโมดูล ให้เพิ่มแฟล็กติดตาม I/O แบบซิงโครนัสของ Node ผ่านตัวรันซอร์ส:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` จะปล่อยให้แฟล็กนี้ปิดอยู่ตามค่าเริ่มต้นสำหรับโปรเซสลูก Gateway ที่เฝ้าดู ให้ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` เมื่อต้องการเอาต์พุตการติดตาม I/O แบบซิงโครนัสในโหมดเฝ้าดูด้วย

## โหมดเฝ้าดู Gateway

```bash
pnpm gateway:watch
```

ตามค่าเริ่มต้น คำสั่งนี้จะเริ่มหรือเริ่มเซสชัน tmux ชื่อ `openclaw-gateway-watch-<profile>` ใหม่ (ตัวอย่างเช่น `openclaw-gateway-watch-main`) โดยจะเพิ่มส่วนต่อท้ายพอร์ต เช่น `openclaw-gateway-watch-dev-19001` เฉพาะเมื่อ `OPENCLAW_GATEWAY_PORT` แตกต่างจากพอร์ตเริ่มต้น `18789` เท่านั้น ระบบจะแนบเซสชันโดยอัตโนมัติจากเทอร์มินัลแบบโต้ตอบ ส่วนเชลล์แบบไม่โต้ตอบ, CI และการเรียกใช้ exec ของเอเจนต์จะยังคงแยกออกจากเซสชันและพิมพ์คำแนะนำการแนบแทน:

```bash
tmux attach -t openclaw-gateway-watch-main
# อ่านเอาต์พุตล่าสุดโดยไม่ต้องแนบเซสชัน
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

พาเนลใช้ `remain-on-exit` ของ tmux ดังนั้นความล้มเหลวระหว่างเริ่มต้นจะยังคงอยู่ให้แนบหรือบันทึกเอาต์พุตได้ แทนที่จะลบเซสชัน การเรียก `pnpm gateway:watch` อีกครั้งจะสร้างพาเนลนั้นใหม่

พาเนล tmux จะรันตัวเฝ้าดูโดยตรง:

```bash
node scripts/watch-node.mjs gateway --force
```

ก่อนเฝ้าดูพอร์ตที่กำหนดค่าไว้/พอร์ตเริ่มต้น แรปเปอร์ tmux จะหยุดบริการ Gateway ที่ติดตั้งไว้ของโปรไฟล์ที่ใช้งานอยู่ วิธีนี้ส่งมอบพอร์ตให้ตัวเฝ้าดูซอร์สโดยไม่ให้ launchd, systemd หรือ Scheduled Task สร้างโปรเซสใหม่และแทนที่ตัวเฝ้าดู บริการจะยังคงติดตั้งอยู่ ให้คืนค่าหลังจากเซสชันเฝ้าดูด้วย:

```bash
pnpm openclaw gateway start
```

เมื่อ `--port` หรือ `OPENCLAW_GATEWAY_PORT` ที่ระบุอย่างชัดเจนแตกต่างจากพอร์ตที่มีผลของบริการที่ติดตั้งไว้ แรปเปอร์จะปล่อยให้บริการทำงานต่อไป เพื่อให้ Gateway ทั้งสองทำงานเคียงข้างกันได้

โหมดเบื้องหน้าโดยไม่ใช้ tmux:

```bash
pnpm gateway:watch:raw
# หรือ
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

โหมดโดยตรงจะไม่จัดการบริการที่ติดตั้งไว้ ให้รัน `pnpm openclaw gateway stop` ก่อนเมื่อบริการใช้พอร์ตเดียวกัน

คงการจัดการ tmux ไว้แต่ปิดการแนบอัตโนมัติ:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

ทำโปรไฟล์เวลา CPU ของ Gateway ที่เฝ้าดูเมื่อดีบักฮอตสปอตระหว่างเริ่มต้น/รันไทม์:

```bash
pnpm gateway:watch --benchmark
```

แรปเปอร์เฝ้าดูจะใช้ `--benchmark` ก่อนเรียกใช้ Gateway และเขียน `.cpuprofile` ของ V8 หนึ่งไฟล์ต่อการออกของโปรเซสลูก Gateway ไว้ภายใต้ `.artifacts/gateway-watch-profiles/` หยุดหรือเริ่ม Gateway ที่เฝ้าดูใหม่เพื่อเขียนโปรไฟล์ปัจจุบันให้เสร็จ จากนั้นเปิดด้วย Chrome DevTools หรือ Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: เขียนโปรไฟล์ไปยังตำแหน่งอื่น
- `--benchmark-no-force`: ข้ามการล้างพอร์ตเริ่มต้น `--force` และล้มเหลวทันทีหากพอร์ต Gateway ถูกใช้งานอยู่แล้ว

โหมดเบนช์มาร์กจะระงับข้อความรบกวนจากการติดตาม I/O แบบซิงโครนัสตามค่าเริ่มต้น ตั้งค่า `OPENCLAW_TRACE_SYNC_IO=1` ร่วมกับ `--benchmark` เพื่อรับทั้งโปรไฟล์ CPU และสแต็กเทรซ I/O แบบซิงโครนัส ในโหมดเบนช์มาร์ก บล็อกการติดตามเหล่านั้นจะถูกเขียนไปยัง `gateway-watch-output.log` ภายใต้ไดเรกทอรีเบนช์มาร์ก (และถูกกรองออกจากพาเนลเทอร์มินัล) ขณะที่บันทึก Gateway ตามปกติยังคงมองเห็นได้

แรปเปอร์ tmux จะส่งต่อตัวเลือกรันไทม์ทั่วไปที่ไม่เป็นความลับไปยังพาเนล รวมถึง `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` และ `OPENCLAW_SKIP_CHANNELS` ให้ใส่ข้อมูลประจำตัวของผู้ให้บริการไว้ในโปรไฟล์/คอนฟิกตามปกติ หรือใช้โหมดเบื้องหน้าโดยตรงสำหรับข้อมูลลับชั่วคราวที่ใช้ครั้งเดียว

หาก Gateway ที่เฝ้าดูออกระหว่างเริ่มต้น ตัวเฝ้าดูจะรัน `openclaw doctor --fix --non-interactive` หนึ่งครั้งแล้วเริ่มโปรเซสลูก Gateway ใหม่ ตั้งค่า `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อดูความล้มเหลวระหว่างเริ่มต้นเดิมโดยไม่ผ่านขั้นตอนซ่อมแซมสำหรับการพัฒนาเท่านั้น

พาเนล tmux ที่มีการจัดการจะใช้บันทึก Gateway แบบมีสีตามค่าเริ่มต้น ตั้งค่า `FORCE_COLOR=0` เมื่อเริ่ม `pnpm gateway:watch` เพื่อปิดเอาต์พุต ANSI

ตัวเฝ้าดูจะเริ่มใหม่เมื่อไฟล์ที่เกี่ยวข้องกับการสร้างภายใต้ `src/`, ไฟล์ซอร์สของส่วนขยาย, เมทาดาทา `package.json` และ `openclaw.plugin.json` ของส่วนขยาย, `tsconfig.json`, `package.json` และ `tsdown.config.ts` เปลี่ยนแปลง การเปลี่ยนแปลงเมทาดาทาของส่วนขยายจะเริ่ม Gateway ใหม่โดยไม่บังคับให้สร้างใหม่ ส่วนการเปลี่ยนแปลงซอร์สและคอนฟิกจะยังคงสร้าง `dist` ใหม่ก่อน

เพิ่มแฟล็ก CLI ของ Gateway หลัง `gateway:watch` แล้วแฟล็กเหล่านั้นจะถูกส่งต่อในการเริ่มใหม่แต่ละครั้ง การเรียกคำสั่งเฝ้าดูเดิมอีกครั้งจะสร้างพาเนล tmux ที่มีชื่อนั้นใหม่ ตัวเฝ้าดูโดยตรงจะใช้ล็อกตัวเฝ้าดูเดี่ยว เพื่อแทนที่โปรเซสหลักของตัวเฝ้าดูที่ซ้ำกันแทนที่จะปล่อยให้สะสม

## โปรไฟล์พัฒนา + Gateway สำหรับพัฒนา (--dev)

มีแฟล็ก `--dev` **แยกกัน** สองรายการ:

- **`--dev` ส่วนกลาง (โปรไฟล์):** แยกสถานะไว้ภายใต้ `~/.openclaw-dev` และตั้งค่าพอร์ต Gateway เริ่มต้นเป็น `19001` (พอร์ตที่คำนวณต่อเนื่องจะเลื่อนตาม)
- **`gateway --dev`:** สั่งให้ Gateway สร้างคอนฟิกเริ่มต้น + เวิร์กสเปซโดยอัตโนมัติเมื่อยังไม่มี (และข้าม bootstrap)

ขั้นตอนที่แนะนำ (โปรไฟล์พัฒนา + bootstrap สำหรับพัฒนา):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

หากไม่ได้ติดตั้งแบบส่วนกลาง ให้รัน CLI ผ่าน `pnpm openclaw ...`

สิ่งที่กระบวนการนี้ทำ:

1. **การแยกโปรไฟล์** (`--dev` ส่วนกลาง)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (พอร์ตเบราว์เซอร์/แคนวาสจะเลื่อนตาม)

2. **Bootstrap สำหรับพัฒนา** (`gateway --dev`)
   - เขียนคอนฟิกขั้นต่ำหากยังไม่มี (`gateway.mode=local`, ผูกกับ loopback)
   - ตั้งค่า `agents.defaults.workspace` เป็นเวิร์กสเปซสำหรับพัฒนาและ `agents.defaults.skipBootstrap=true`
   - สร้างไฟล์เริ่มต้นในเวิร์กสเปซหากยังไม่มี: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`
   - ข้อมูลประจำตัวเริ่มต้น: **C3-PO** (ดรอยด์พิธีการ)
   - `pnpm gateway:dev` ยังตั้งค่า `OPENCLAW_SKIP_CHANNELS=1` เพื่อข้ามผู้ให้บริการช่องทางด้วย

Gateway สำหรับพัฒนาจะเพิกเฉยต่อทริกเกอร์สภาพแวดล้อมของช่องทางโดยค่าเริ่มต้น ดังนั้นข้อมูลประจำตัวที่รับช่วงมาจากเชลล์จะไม่เชื่อมต่ออินสแตนซ์สำหรับพัฒนาเข้ากับบริการช่องทางจริง คอนฟิก `channels.<id>` ที่ระบุอย่างชัดเจนยังคงทำงาน ส่ง `--dev-ambient-channels` ร่วมกับ `--dev` เพื่อคืนค่าการกำหนดค่าช่องทางอัตโนมัติจากสภาพแวดล้อมสำหรับการรันครั้งนั้น

ขั้นตอนรีเซ็ต (เริ่มใหม่ทั้งหมด):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` เป็นแฟล็กโปรไฟล์ **ส่วนกลาง** และตัวรันบางตัวจะนำแฟล็กนี้ไปใช้ก่อน หากจำเป็นต้องระบุอย่างชัดเจน ให้ใช้รูปแบบตัวแปรสภาพแวดล้อม:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` จะล้างคอนฟิก ข้อมูลประจำตัว เซสชัน และเวิร์กสเปซสำหรับพัฒนา (ย้ายไปถังขยะ ไม่ได้ลบถาวร) จากนั้นสร้างการตั้งค่าพัฒนาเริ่มต้นใหม่

<Tip>
หาก Gateway ที่ไม่ใช่สำหรับพัฒนากำลังทำงานอยู่แล้ว (launchd หรือ systemd) ให้หยุดก่อน:

```bash
openclaw gateway stop
```

</Tip>

## การบันทึกสตรีมดิบ

OpenClaw สามารถบันทึก **สตรีมดิบของผู้ช่วย** ก่อนการกรอง/จัดรูปแบบใด ๆ วิธีนี้เหมาะที่สุดสำหรับตรวจสอบว่าการให้เหตุผลเข้ามาเป็นเดลตาข้อความธรรมดา (หรือเป็นบล็อกการคิดแยกต่างหาก)

เปิดใช้งานผ่าน CLI:

```bash
pnpm gateway:watch --raw-stream
```

การแทนที่พาธซึ่งเป็นตัวเลือกเสริม:

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

- บันทึกสตรีมดิบอาจมีพรอมต์ทั้งหมด เอาต์พุตเครื่องมือ และข้อมูลผู้ใช้
- เก็บบันทึกไว้ภายในเครื่องและลบหลังจากดีบักเสร็จ
- หากแชร์บันทึก ให้ลบข้อมูลลับและ PII ออกก่อน

## การดีบักใน VSCode

จำเป็นต้องใช้ซอร์สแมป เนื่องจากกระบวนการสร้างจะแฮชชื่่อไฟล์ที่สร้างขึ้น `launch.json` ที่รวมไว้กำหนดเป้าหมายไปยังบริการ Gateway:

1. **Rebuild and Debug Gateway** - ลบ `/dist` และสร้างใหม่โดยเปิดใช้งานการดีบักก่อนเริ่ม Gateway
2. **Debug Gateway** - ดีบักบิลด์ที่มีอยู่โดยไม่แตะต้อง `/dist`

### การตั้งค่า

1. เปิด **Run and Debug** (Activity Bar หรือ `Ctrl`+`Shift`+`D`)
2. เลือก **Rebuild and Debug Gateway** แล้วกด **Start Debugging**

หากต้องการจัดการรอบการสร้าง/ดีบักด้วยตนเองแทน:

1. เปิดใช้งานซอร์สแมปในเทอร์มินัล:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. สร้างใหม่: `pnpm clean:dist && pnpm build`
3. เลือก **Debug Gateway** แล้วกด **Start Debugging**

ตั้งค่าเบรกพอยต์ในไฟล์ TypeScript `src/`; ดีบักเกอร์จะแมปไฟล์เหล่านั้นไปยัง JavaScript ที่คอมไพล์แล้วผ่านซอร์สแมป

### หมายเหตุ

- **Rebuild and Debug Gateway** จะลบ `/dist` และรัน `pnpm build` แบบเต็มพร้อมซอร์สแมปทุกครั้งที่เปิด
- **Debug Gateway** สามารถเริ่ม/หยุดได้โดยไม่กระทบ `/dist` แต่ต้องจัดการรอบการสร้างในเทอร์มินัลแยกต่างหาก
- แก้ไข `args` ของ `launch.json` เพื่อดีบักคำสั่งย่อย CLI อื่น
- หากต้องการใช้ CLI ที่สร้างแล้วสำหรับงานอื่น (ตัวอย่างเช่น `dashboard --no-open` หากเซสชันดีบักสร้างโทเค็นการยืนยันตัวตนใหม่) ให้รันจากเทอร์มินัลอื่น: `node ./openclaw.mjs` หรือนามแฝง เช่น `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## ที่เกี่ยวข้อง

- [การแก้ไขปัญหา](/th/help/troubleshooting)
- [คำถามที่พบบ่อย](/th/help/faq)
