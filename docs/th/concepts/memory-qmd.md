---
read_when:
    - คุณต้องการตั้งค่า QMD เป็นแบ็กเอนด์หน่วยความจำของคุณ
    - คุณต้องการฟีเจอร์หน่วยความจำขั้นสูง เช่น การจัดอันดับใหม่หรือพาธที่ทำดัชนีเพิ่มเติม
summary: ไซด์คาร์การค้นหาที่เน้นเครื่องภายในเป็นหลัก พร้อม BM25, เวกเตอร์, การจัดอันดับซ้ำ และการขยายคิวรี
title: เอนจินหน่วยความจำ QMD
x-i18n:
    generated_at: "2026-06-27T17:26:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) เป็น sidecar การค้นหาแบบเน้นการทำงานในเครื่องเป็นหลักที่รัน
ควบคู่กับ OpenClaw โดยรวม BM25, การค้นหาแบบเวกเตอร์ และการจัดอันดับซ้ำไว้ใน
ไบนารีเดียว และสามารถทำดัชนีเนื้อหานอกเหนือจากไฟล์หน่วยความจำในเวิร์กสเปซของคุณได้

## สิ่งที่เพิ่มจากเอนจินในตัว

- **การจัดอันดับซ้ำและการขยายคำค้น** เพื่อการเรียกคืนผลลัพธ์ที่ดีขึ้น
- **ทำดัชนีไดเรกทอรีเพิ่มเติม** -- เอกสารโปรเจกต์, บันทึกของทีม, อะไรก็ได้บนดิสก์
- **ทำดัชนีทรานสคริปต์ของเซสชัน** -- เรียกคืนบทสนทนาก่อนหน้า
- **ทำงานในเครื่องทั้งหมด** -- รันด้วย Plugin ผู้ให้บริการ llama.cpp อย่างเป็นทางการและ
  ดาวน์โหลดโมเดล GGUF อัตโนมัติ
- **สำรองอัตโนมัติ** -- หาก QMD ใช้งานไม่ได้ OpenClaw จะถอยกลับไปใช้
  เอนจินในตัวอย่างราบรื่น

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- ติดตั้ง QMD: `npm install -g @tobilu/qmd` หรือ `bun install -g @tobilu/qmd`
- บิลด์ SQLite ที่อนุญาตส่วนขยาย (`brew install sqlite` บน macOS)
- QMD ต้องอยู่ใน `PATH` ของ Gateway
- macOS และ Linux ใช้งานได้ทันที Windows รองรับดีที่สุดผ่าน WSL2

### เปิดใช้งาน

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw สร้างโฮม QMD แบบครบในตัวเองไว้ใต้
`~/.openclaw/agents/<agentId>/qmd/` และจัดการวงจรชีวิตของ sidecar
โดยอัตโนมัติ -- collections, การอัปเดต และการรัน embedding จะถูกจัดการให้คุณ
โดยจะเลือกใช้รูปแบบ collection และคำค้น MCP ของ QMD ปัจจุบันก่อน แต่ยังถอยกลับไปใช้
แฟล็กรูปแบบ collection ทางเลือกและชื่อเครื่องมือ MCP รุ่นเก่าเมื่อจำเป็น
การกระทบยอดตอนบูตยังสร้าง managed collections ที่ค้างเก่าให้กลับไปเป็น
รูปแบบมาตรฐานอีกครั้งเมื่อยังมี collection QMD รุ่นเก่าที่ใช้ชื่อเดียวกันอยู่

## sidecar ทำงานอย่างไร

- OpenClaw สร้าง collections จากไฟล์หน่วยความจำในเวิร์กสเปซของคุณและ
  `memory.qmd.paths` ที่กำหนดค่าไว้ จากนั้นรัน `qmd update` เมื่อเปิดตัวจัดการ QMD
  และรันเป็นระยะหลังจากนั้น (ค่าเริ่มต้นทุก 5 นาที) การรีเฟรชเหล่านี้รันผ่าน
  subprocesses ของ QMD ไม่ใช่การไล่ตรวจระบบไฟล์ภายในโปรเซส โหมด semantic
  ยังรัน `qmd embed` ด้วย
- collection เวิร์กสเปซเริ่มต้นติดตาม `MEMORY.md` รวมถึงต้นไม้ `memory/`
  `memory.md` ตัวพิมพ์เล็กจะไม่ถูกทำดัชนีเป็นไฟล์หน่วยความจำราก
- สแกนเนอร์ของ QMD เองจะข้าม path ที่ซ่อนอยู่และไดเรกทอรี dependency/build
  ทั่วไป เช่น `.git`, `.cache`, `node_modules`, `vendor`, `dist` และ
  `build` การเริ่ม Gateway จะไม่เริ่มต้น QMD ตามค่าเริ่มต้น ดังนั้นการบูตแบบ cold boot
  จะหลีกเลี่ยงการนำเข้า runtime หน่วยความจำหรือสร้าง watcher ที่อยู่ยาวก่อนที่
  หน่วยความจำจะถูกใช้ครั้งแรก
- หากคุณต้องการให้เริ่มต้น QMD ตอนเริ่ม Gateway อยู่ดี ให้ตั้ง
  `memory.qmd.update.startup` เป็น `idle` หรือ `immediate` เมื่อใช้
  `memory.qmd.update.onBoot: true` การเริ่มต้นจะรันการรีเฟรชครั้งแรก เมื่อใช้
  `onBoot: false` การเริ่มต้นจะข้ามการรีเฟรชทันทีนั้น แต่ยังเปิดตัวจัดการ
  ที่อยู่ยาวเมื่อมีการกำหนดค่าช่วงเวลา update หรือ embed เพื่อให้ QMD
  เป็นเจ้าของ watcher และ timer ปกติของตัวเองได้
- การค้นหาใช้ `searchMode` ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `search`; รองรับ
  `vsearch` และ `query` ด้วย) `search` เป็น BM25 เท่านั้น ดังนั้น OpenClaw
  จะข้ามการตรวจ readiness ของเวกเตอร์ semantic และการบำรุงรักษา embedding ในโหมดนั้น
  หากโหมดหนึ่งล้มเหลว OpenClaw จะลองใหม่ด้วย `qmd query`
- เมื่อ `searchMode` เป็น `query` ให้ตั้ง `memory.qmd.rerank` เป็น `false`
  เพื่อใช้เส้นทางคำค้น hybrid ของ QMD โดยไม่มี reranker OpenClaw ส่ง
  `--no-rerank` ไปยังเส้นทาง QMD CLI โดยตรง และส่ง `rerank: false` ไปยัง
  เครื่องมือคำค้น MCP ของ QMD ตัวเลือกนี้ต้องใช้ QMD 2.1 หรือใหม่กว่า
- เมื่อ QMD รุ่นที่ใช้งานประกาศตัวกรองหลาย collection OpenClaw จะจัดกลุ่ม
  collections จากแหล่งเดียวกันเข้าเป็นการเรียกค้น QMD ครั้งเดียว QMD รุ่นเก่า
  จะยังใช้ fallback ต่อ collection ที่เข้ากันได้
- หาก QMD ล้มเหลวทั้งหมด OpenClaw จะถอยกลับไปใช้เอนจิน SQLite ในตัว
  ความพยายามซ้ำใน chat-turn จะหน่วงสั้น ๆ หลังจากการเปิดล้มเหลว เพื่อไม่ให้
  ไบนารีที่หายไปหรือ dependency ของ sidecar ที่เสียสร้างพายุการลองซ้ำ;
  `openclaw memory status` และ probe CLI แบบครั้งเดียวจะยังตรวจ QMD ใหม่โดยตรง

<Info>
การค้นหาครั้งแรกอาจช้า -- QMD ดาวน์โหลดโมเดล GGUF อัตโนมัติ (~2 GB) สำหรับ
การจัดอันดับซ้ำและการขยายคำค้นในการรัน `qmd query` ครั้งแรก
</Info>

## ประสิทธิภาพการค้นหาและความเข้ากันได้

OpenClaw รักษาเส้นทางค้นหา QMD ให้เข้ากันได้ทั้งกับการติดตั้ง QMD ปัจจุบันและรุ่นเก่า

เมื่อเริ่มต้น OpenClaw จะตรวจข้อความ help ของ QMD ที่ติดตั้งแล้วหนึ่งครั้งต่อ manager
หากไบนารีประกาศว่ารองรับตัวกรองหลาย collection OpenClaw จะค้นหา collections
จากแหล่งเดียวกันทั้งหมดด้วยคำสั่งเดียว:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

วิธีนี้หลีกเลี่ยงการเริ่ม subprocess ของ QMD หนึ่งตัวต่อ collection หน่วยความจำถาวรทุกตัว
collections ของทรานสคริปต์เซสชันยังอยู่ในกลุ่มแหล่งที่มาของตัวเอง ดังนั้นการค้นหาแบบผสม
`memory` + `sessions` ยังคงให้ input สำหรับตัวกระจายผลลัพธ์จากทั้งสองแหล่ง

บิลด์ QMD รุ่นเก่ารับตัวกรอง collection ได้เพียงตัวเดียว เมื่อ OpenClaw ตรวจพบบิลด์
เหล่านั้น จะคงเส้นทางความเข้ากันได้ไว้และค้นหาแต่ละ collection แยกกันก่อนรวมและ
ลบผลลัพธ์ซ้ำ

หากต้องการตรวจ contract ที่ติดตั้งด้วยตนเอง ให้รัน:

```bash
qmd --help | grep -i collection
```

help ของ QMD ปัจจุบันระบุว่าตัวกรอง collection สามารถกำหนดเป้าหมายได้หนึ่ง collection
หรือมากกว่า help รุ่นเก่ามักอธิบาย collection เดียว

## การ override โมเดล

ตัวแปรสภาพแวดล้อมโมเดลของ QMD ถูกส่งผ่านจากโปรเซส Gateway โดยไม่เปลี่ยนแปลง
ดังนั้นคุณสามารถปรับแต่ง QMD โดยรวมได้โดยไม่ต้องเพิ่ม config ใหม่ของ OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

หลังจากเปลี่ยนโมเดล embedding ให้รัน embeddings ใหม่เพื่อให้ดัชนีตรงกับ
พื้นที่เวกเตอร์ใหม่

## การทำดัชนี path เพิ่มเติม

ชี้ QMD ไปยังไดเรกทอรีเพิ่มเติมเพื่อทำให้ค้นหาได้:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

snippets จาก path เพิ่มเติมจะแสดงเป็น `qmd/<collection>/<relative-path>` ใน
ผลลัพธ์การค้นหา `memory_get` เข้าใจ prefix นี้และอ่านจากราก collection ที่ถูกต้อง

## การทำดัชนีทรานสคริปต์ของเซสชัน

เปิดใช้การทำดัชนีเซสชันเพื่อเรียกคืนบทสนทนาก่อนหน้า:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

ทรานสคริปต์ถูกส่งออกเป็น turn ของ User/Assistant ที่ผ่านการล้างข้อมูลแล้วไปยัง
collection QMD เฉพาะใต้ `~/.openclaw/agents/<id>/qmd/sessions/`

## ขอบเขตการค้นหา

ตามค่าเริ่มต้น ผลลัพธ์การค้นหา QMD จะแสดงในเซสชันโดยตรงและเซสชันช่องทาง
(ไม่ใช่กลุ่ม) กำหนดค่า `memory.qmd.scope` เพื่อเปลี่ยนสิ่งนี้:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

เมื่อ scope ปฏิเสธการค้นหา OpenClaw จะบันทึกคำเตือนพร้อม channel และ
ประเภท chat ที่อนุมานได้ เพื่อให้ดีบักผลลัพธ์ว่างได้ง่ายขึ้น

## การอ้างอิง

เมื่อ `memory.citations` เป็น `auto` หรือ `on` snippets การค้นหาจะมี footer
`Source: <path#line>` ตั้ง `memory.citations = "off"` เพื่อละ footer
ขณะที่ยังส่ง path ให้ agent ภายใน

## ควรใช้เมื่อใด

เลือก QMD เมื่อคุณต้องการ:

- การจัดอันดับซ้ำเพื่อผลลัพธ์คุณภาพสูงขึ้น
- ค้นหาเอกสารโปรเจกต์หรือบันทึกนอกเวิร์กสเปซ
- เรียกคืนบทสนทนาเซสชันที่ผ่านมา
- การค้นหาในเครื่องทั้งหมดโดยไม่ต้องใช้ API keys

สำหรับการตั้งค่าที่เรียบง่ายกว่า [เอนจินในตัว](/th/concepts/memory-builtin) ใช้งานได้ดี
โดยไม่ต้องมี dependencies เพิ่มเติม

## การแก้ไขปัญหา

**ไม่พบ QMD?** ตรวจสอบให้แน่ใจว่าไบนารีอยู่ใน `PATH` ของ Gateway หาก OpenClaw
รันเป็น service ให้สร้าง symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`

หาก `qmd --version` ใช้งานได้ใน shell ของคุณ แต่ OpenClaw ยังรายงาน
`spawn qmd ENOENT` โปรเซส Gateway น่าจะมี `PATH` ต่างจาก
interactive shell ของคุณ ระบุไบนารีอย่างชัดเจน:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

ใช้ `command -v qmd` ในสภาพแวดล้อมที่ติดตั้ง QMD แล้วตรวจอีกครั้งด้วย
`openclaw memory status --deep`

**การค้นหาครั้งแรกช้ามาก?** QMD ดาวน์โหลดโมเดล GGUF ในการใช้งานครั้งแรก
อุ่นเครื่องล่วงหน้าด้วย `qmd query "test"` โดยใช้ XDG dirs เดียวกับที่ OpenClaw ใช้

**มี subprocesses ของ QMD จำนวนมากระหว่างค้นหา?** อัปเดต QMD หากทำได้ OpenClaw ใช้
หนึ่งโปรเซสสำหรับการค้นหาแบบหลาย collection จากแหล่งเดียวกันเฉพาะเมื่อ QMD ที่ติดตั้ง
ประกาศว่ารองรับตัวกรอง `-c` หลายตัว มิฉะนั้นจะคง fallback ต่อ collection แบบเก่า
ไว้เพื่อความถูกต้อง

**QMD แบบ BM25 เท่านั้นยังพยายาม build llama.cpp?** ตั้ง
`memory.qmd.searchMode = "search"` OpenClaw ถือว่าโหมดนั้นเป็น lexical-only,
ไม่รัน probe สถานะเวกเตอร์ของ QMD หรือการบำรุงรักษา embedding และปล่อยให้
การตรวจ readiness แบบ semantic เป็นของการตั้งค่า `vsearch` หรือ `query`

**การค้นหา timeout?** เพิ่ม `memory.qmd.limits.timeoutMs` (ค่าเริ่มต้น: 4000ms)
ตั้งเป็น `120000` สำหรับฮาร์ดแวร์ที่ช้ากว่า

**ผลลัพธ์ว่างในแชตกลุ่ม?** ตรวจ `memory.qmd.scope` -- ค่าเริ่มต้นอนุญาตเฉพาะ
เซสชัน direct และ channel

**การค้นหาหน่วยความจำรากกว้างเกินไปกะทันหัน?** รีสตาร์ต Gateway หรือรอ
การกระทบยอดตอนเริ่มต้นครั้งถัดไป OpenClaw สร้าง managed collections ที่ค้างเก่า
กลับไปเป็นรูปแบบ `MEMORY.md` และ `memory/` มาตรฐานเมื่อพบความขัดแย้งชื่อเดียวกัน

**repo ชั่วคราวที่มองเห็นได้จากเวิร์กสเปซทำให้เกิด `ENAMETOOLONG` หรือทำดัชนีเสีย?**
การ traversal ของ QMD ตอนนี้ตามพฤติกรรมสแกนเนอร์ QMD ที่อยู่ข้างใต้ แทนที่จะตาม
กฎ symlink ในตัวของ OpenClaw เก็บ checkout monorepo ชั่วคราวไว้ใต้ไดเรกทอรีซ่อน
เช่น `.tmp/` หรือนอกราก QMD ที่ทำดัชนี จนกว่า QMD จะเปิด traversal ที่ปลอดภัยต่อ cycle
หรือ controls การยกเว้นอย่างชัดเจน

## การกำหนดค่า

สำหรับพื้นผิว config ทั้งหมด (`memory.qmd.*`), โหมดค้นหา, ช่วงเวลาอัปเดต,
กฎ scope และปุ่มปรับอื่นทั้งหมด ดู
[ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config)

## ที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [เอนจินหน่วยความจำในตัว](/th/concepts/memory-builtin)
- [หน่วยความจำ Honcho](/th/concepts/memory-honcho)
