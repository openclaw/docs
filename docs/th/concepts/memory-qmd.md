---
read_when:
    - คุณต้องการตั้งค่า QMD เป็นแบ็กเอนด์หน่วยความจำของคุณ
    - คุณต้องการฟีเจอร์หน่วยความจำขั้นสูง เช่น การจัดอันดับใหม่หรือพาธที่ทำดัชนีเพิ่มเติม
summary: sidecar การค้นหาแบบ local-first พร้อม BM25, เวกเตอร์, การจัดอันดับใหม่ และการขยายคำค้น
title: เอนจินหน่วยความจำ QMD
x-i18n:
    generated_at: "2026-04-25T13:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) คือ sidecar การค้นหาแบบ local-first ที่ทำงาน
ควบคู่กับ OpenClaw โดยรวม BM25, การค้นหาแบบเวกเตอร์ และการจัดอันดับใหม่ไว้ใน
ไบนารีเดียว และสามารถทำดัชนีเนื้อหาที่นอกเหนือจากไฟล์หน่วยความจำในเวิร์กสเปซของคุณได้

## สิ่งที่เพิ่มจากเอนจินในตัว

- **การจัดอันดับใหม่และการขยายคำค้น** เพื่อให้เรียกคืนข้อมูลได้ดีขึ้น
- **ทำดัชนีไดเรกทอรีเพิ่มเติม** -- เอกสารโปรเจกต์ บันทึกของทีม หรืออะไรก็ได้บนดิสก์
- **ทำดัชนีทรานสคริปต์ของเซสชัน** -- เพื่อเรียกคืนบทสนทนาก่อนหน้า
- **ทำงานในเครื่องทั้งหมด** -- ทำงานร่วมกับแพ็กเกจ runtime แบบเลือกติดตั้ง node-llama-cpp และ
  ดาวน์โหลดโมเดล GGUF อัตโนมัติ
- **fallback อัตโนมัติ** -- หาก QMD ใช้งานไม่ได้ OpenClaw จะ fallback ไปใช้
  เอนจินในตัวอย่างราบรื่น

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- ติดตั้ง QMD: `npm install -g @tobilu/qmd` หรือ `bun install -g @tobilu/qmd`
- บิลด์ SQLite ที่อนุญาตให้ใช้ extensions (`brew install sqlite` บน macOS)
- QMD ต้องอยู่ใน `PATH` ของ gateway
- macOS และ Linux ใช้งานได้ทันที Windows รองรับได้ดีที่สุดผ่าน WSL2

### เปิดใช้งาน

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw จะสร้างโฮม QMD แบบ self-contained ภายใต้
`~/.openclaw/agents/<agentId>/qmd/` และจัดการ lifecycle ของ sidecar
โดยอัตโนมัติ -- ระบบจะดูแล collections, การอัปเดต และการรัน embedding ให้เอง
ระบบจะเลือกใช้รูปแบบ collection และคำสั่ง query ของ MCP ใน QMD รุ่นปัจจุบันก่อน แต่ยัง fallback ไปใช้
แฟล็ก collection แบบเดิม `--mask` และชื่อเครื่องมือ MCP แบบเก่าเมื่อจำเป็น
การ reconcile ตอนบูตยังสร้าง managed collection ที่เก่าค้างกลับไปเป็น
รูปแบบ canonical อีกครั้ง เมื่อยังมี QMD collection รุ่นเก่าที่ใช้ชื่อเดียวกันอยู่

## วิธีการทำงานของ sidecar

- OpenClaw จะสร้าง collection จากไฟล์หน่วยความจำในเวิร์กสเปซของคุณและ
  `memory.qmd.paths` ที่กำหนดค่าไว้ จากนั้นรัน `qmd update` + `qmd embed` ตอนบูต
  และเป็นระยะ ๆ (ค่าเริ่มต้นทุก 5 นาที)
- collection เวิร์กสเปซเริ่มต้นจะติดตาม `MEMORY.md` พร้อมกับ tree `memory/`
  โดย `memory.md` ตัวพิมพ์เล็กจะไม่ถูกทำดัชนีเป็นไฟล์หน่วยความจำราก
- การรีเฟรชตอนบูตจะทำงานเบื้องหลังเพื่อไม่ให้การเริ่มแชตถูกบล็อก
- การค้นหาจะใช้ `searchMode` ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `search`; รองรับ
  `vsearch` และ `query` ด้วย) หากโหมดหนึ่งล้มเหลว OpenClaw จะ retry ด้วย `qmd query`
- หาก QMD ล้มเหลวทั้งหมด OpenClaw จะ fallback ไปใช้เอนจิน SQLite ในตัว

<Info>
การค้นหาครั้งแรกอาจช้า -- QMD จะดาวน์โหลดโมเดล GGUF อัตโนมัติ (~2 GB) สำหรับ
การจัดอันดับใหม่และการขยายคำค้นในการรัน `qmd query` ครั้งแรก
</Info>

## การเขียนทับโมเดล

ตัวแปรสภาพแวดล้อมของโมเดล QMD จะถูกส่งผ่านจากโปรเซส gateway
โดยไม่เปลี่ยนแปลง ดังนั้นคุณสามารถปรับแต่ง QMD แบบ global ได้โดยไม่ต้องเพิ่มการกำหนดค่า OpenClaw ใหม่:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

หลังจากเปลี่ยนโมเดล embedding ให้รัน embeddings ใหม่เพื่อให้ดัชนีตรงกับ
พื้นที่เวกเตอร์ใหม่

## การทำดัชนีพาธเพิ่มเติม

ชี้ QMD ไปยังไดเรกทอรีเพิ่มเติมเพื่อให้ค้นหาได้:

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

ส่วนนำข้อความจากพาธเพิ่มเติมจะปรากฏเป็น `qmd/<collection>/<relative-path>` ใน
ผลการค้นหา `memory_get` เข้าใจ prefix นี้และจะอ่านจากราก collection ที่ถูกต้อง

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

ทรานสคริปต์จะถูกส่งออกเป็นเทิร์น User/Assistant ที่ผ่านการทำให้ปลอดภัยแล้วลงใน QMD
collection เฉพาะภายใต้ `~/.openclaw/agents/<id>/qmd/sessions/`

## ขอบเขตการค้นหา

โดยค่าเริ่มต้น ผลการค้นหา QMD จะถูกแสดงในเซสชัน direct และ channel
(ไม่รวมกลุ่ม) กำหนดค่า `memory.qmd.scope` เพื่อเปลี่ยนพฤติกรรมนี้:

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
ชนิดแชตที่อนุมานได้เพื่อให้การดีบักผลลัพธ์ว่างทำได้ง่ายขึ้น

## การอ้างอิงแหล่งที่มา

เมื่อ `memory.citations` เป็น `auto` หรือ `on` ส่วนนำข้อความจากการค้นหาจะมี
ส่วนท้าย `Source: <path#line>` ตั้งค่า `memory.citations = "off"` เพื่อตัดส่วนท้ายนี้ออก
แต่ยังคงส่งพาธให้เอเจนต์ภายในต่อไป

## ควรใช้เมื่อใด

เลือก QMD เมื่อคุณต้องการ:

- การจัดอันดับใหม่เพื่อให้ได้ผลลัพธ์คุณภาพสูงขึ้น
- ค้นหาเอกสารโปรเจกต์หรือบันทึกที่อยู่นอกเวิร์กสเปซ
- เรียกคืนบทสนทนาในเซสชันที่ผ่านมา
- การค้นหาแบบทำงานในเครื่องทั้งหมดโดยไม่ต้องใช้ API key

สำหรับการตั้งค่าที่ง่ายกว่า [เอนจินในตัว](/th/concepts/memory-builtin) ทำงานได้ดี
โดยไม่ต้องมี dependency เพิ่มเติม

## การแก้ไขปัญหา

**ไม่พบ QMD?** ตรวจสอบให้แน่ใจว่าไบนารีอยู่ใน `PATH` ของ gateway หาก OpenClaw
ทำงานเป็นบริการ ให้สร้าง symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`

**การค้นหาครั้งแรกช้ามาก?** QMD ดาวน์โหลดโมเดล GGUF เมื่อใช้งานครั้งแรก ให้วอร์มล่วงหน้า
ด้วย `qmd query "test"` โดยใช้ XDG dirs เดียวกับที่ OpenClaw ใช้

**การค้นหาหมดเวลา?** เพิ่ม `memory.qmd.limits.timeoutMs` (ค่าเริ่มต้น: 4000ms)
ตั้งเป็น `120000` สำหรับฮาร์ดแวร์ที่ช้ากว่า

**ผลลัพธ์ว่างในแชตกลุ่ม?** ตรวจสอบ `memory.qmd.scope` -- ค่าเริ่มต้น
อนุญาตเฉพาะเซสชัน direct และ channel

**การค้นหาหน่วยความจำรากจู่ ๆ กว้างเกินไป?** รีสตาร์ต gateway หรือรอ
การ reconcile ตอนเริ่มต้นครั้งถัดไป OpenClaw จะสร้าง managed collection ที่เก่าค้างกลับเป็น
รูปแบบ canonical ของ `MEMORY.md` และ `memory/` เมื่อพบความขัดแย้ง
ของชื่อเดียวกัน

**รีโปชั่วคราวที่มองเห็นได้จากเวิร์กสเปซทำให้เกิด `ENAMETOOLONG` หรือการทำดัชนีเสียหาย?**
ปัจจุบันการไล่ traversal ของ QMD เป็นไปตามพฤติกรรมของสแกนเนอร์ QMD ที่ใช้จริง แทนที่จะเป็น
กฎ symlink ในตัวของ OpenClaw ให้เก็บ monorepo checkout ชั่วคราวไว้ใต้
ไดเรกทอรีซ่อน เช่น `.tmp/` หรืออยู่นอก QMD root ที่ถูกทำดัชนี จนกว่า QMD จะรองรับ
การ traversal ที่ปลอดภัยต่อ cycle หรือมีตัวควบคุมการยกเว้นแบบชัดเจน

## การกำหนดค่า

สำหรับพื้นผิวการกำหนดค่าแบบเต็ม (`memory.qmd.*`), โหมดการค้นหา, ช่วงเวลาอัปเดต,
กฎ scope และตัวเลือกปรับแต่งอื่น ๆ ทั้งหมด โปรดดู
[Memory configuration reference](/th/reference/memory-config)

## ที่เกี่ยวข้อง

- [Memory overview](/th/concepts/memory)
- [Builtin memory engine](/th/concepts/memory-builtin)
- [Honcho memory](/th/concepts/memory-honcho)
