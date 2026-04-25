---
read_when:
    - คุณต้องการทำความเข้าใจแบ็กเอนด์หน่วยความจำเริ่มต้น
    - คุณต้องการกำหนดค่า embedding provider หรือการค้นหาแบบไฮบริด
summary: แบ็กเอนด์หน่วยความจำแบบ SQLite ที่เป็นค่าเริ่มต้น พร้อมการค้นหาแบบคีย์เวิร์ด เวกเตอร์ และแบบไฮบริด
title: เอนจินหน่วยความจำในตัว
x-i18n:
    generated_at: "2026-04-25T13:45:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

เอนจินในตัวคือแบ็กเอนด์หน่วยความจำเริ่มต้น โดยจะจัดเก็บดัชนีหน่วยความจำของคุณไว้ในฐานข้อมูล SQLite แยกตามเอเจนต์ และไม่ต้องมี dependency เพิ่มเติมเพื่อเริ่มต้นใช้งาน

## สิ่งที่มีให้

- **การค้นหาแบบคีย์เวิร์ด** ผ่านการทำดัชนีข้อความเต็มแบบ FTS5 (การให้คะแนน BM25)
- **การค้นหาแบบเวกเตอร์** ผ่าน embedding จาก provider ที่รองรับใดก็ได้
- **การค้นหาแบบไฮบริด** ที่รวมทั้งสองแบบเข้าด้วยกันเพื่อให้ได้ผลลัพธ์ที่ดีที่สุด
- **การรองรับ CJK** ผ่านการตัดคำแบบ trigram สำหรับภาษาจีน ญี่ปุ่น และเกาหลี
- **การเร่งความเร็วด้วย sqlite-vec** สำหรับคำค้นหาแบบเวกเตอร์ภายในฐานข้อมูล (ไม่บังคับ)

## เริ่มต้นใช้งาน

หากคุณมี API key สำหรับ OpenAI, Gemini, Voyage หรือ Mistral เอนจินในตัวจะตรวจจับได้อัตโนมัติและเปิดใช้การค้นหาแบบเวกเตอร์ โดยไม่ต้องตั้งค่า

หากต้องการระบุ provider อย่างชัดเจน:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

หากไม่มี embedding provider จะใช้ได้เฉพาะการค้นหาแบบคีย์เวิร์ดเท่านั้น

หากต้องการบังคับใช้ local embedding provider ในตัว ให้ติดตั้งแพ็กเกจ runtime เสริม `node-llama-cpp` ไว้ข้าง OpenClaw แล้วชี้ `local.modelPath` ไปยังไฟล์ GGUF:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## embedding provider ที่รองรับ

| Provider | ID        | ตรวจจับอัตโนมัติ | หมายเหตุ                              |
| -------- | --------- | ---------------- | ------------------------------------- |
| OpenAI   | `openai`  | ใช่              | ค่าเริ่มต้น: `text-embedding-3-small` |
| Gemini   | `gemini`  | ใช่              | รองรับหลายโมดัล (ภาพ + เสียง)         |
| Voyage   | `voyage`  | ใช่              |                                       |
| Mistral  | `mistral` | ใช่              |                                       |
| Ollama   | `ollama`  | ไม่              | แบบ local, ต้องตั้งค่าเอง             |
| Local    | `local`   | ใช่ (ก่อนสุด)    | runtime `node-llama-cpp` แบบเสริม     |

การตรวจจับอัตโนมัติจะเลือก provider แรกที่สามารถ resolve API key ได้ ตามลำดับที่แสดงไว้ ตั้งค่า `memorySearch.provider` เพื่อแทนที่พฤติกรรมนี้

## การทำดัชนีทำงานอย่างไร

OpenClaw จะทำดัชนี `MEMORY.md` และ `memory/*.md` เป็นชิ้นข้อมูล (~400 โทเค็น โดยมีส่วนซ้อนทับ 80 โทเค็น) และจัดเก็บไว้ในฐานข้อมูล SQLite แยกตามเอเจนต์

- **ตำแหน่งดัชนี:** `~/.openclaw/memory/<agentId>.sqlite`
- **การเฝ้าดูไฟล์:** การเปลี่ยนแปลงไฟล์หน่วยความจำจะทริกเกอร์การทำดัชนีใหม่แบบ debounce (1.5 วินาที)
- **การทำดัชนีใหม่อัตโนมัติ:** เมื่อ embedding provider, โมเดล หรือการตั้งค่า chunking เปลี่ยนไป ระบบจะสร้างดัชนีทั้งหมดใหม่โดยอัตโนมัติ
- **สั่งทำดัชนีใหม่ตามต้องการ:** `openclaw memory index --force`

<Info>
คุณยังสามารถทำดัชนีไฟล์ Markdown ที่อยู่นอก workspace ได้ด้วย
`memorySearch.extraPaths` ดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/reference/memory-config#additional-memory-paths)
</Info>

## ควรใช้เมื่อใด

เอนจินในตัวเป็นตัวเลือกที่เหมาะสำหรับผู้ใช้ส่วนใหญ่:

- ใช้งานได้ทันทีโดยไม่ต้องมี dependency เพิ่มเติม
- รองรับทั้งการค้นหาแบบคีย์เวิร์ดและแบบเวกเตอร์ได้ดี
- รองรับ embedding provider ทุกตัว
- การค้นหาแบบไฮบริดรวมข้อดีของทั้งสองแนวทางการดึงข้อมูล

พิจารณาเปลี่ยนไปใช้ [QMD](/th/concepts/memory-qmd) หากคุณต้องการ reranking, query expansion หรืออยากทำดัชนีไดเรกทอรีนอก workspace

พิจารณา [Honcho](/th/concepts/memory-honcho) หากคุณต้องการหน่วยความจำข้ามเซสชันพร้อมการสร้างโมเดลผู้ใช้อัตโนมัติ

## การแก้ไขปัญหา

**ปิดการค้นหาหน่วยความจำอยู่หรือไม่?** ตรวจสอบ `openclaw memory status` หากตรวจไม่พบ provider ให้ตั้งค่าอย่างชัดเจนหรือเพิ่ม API key

**ตรวจไม่พบ local provider?** ยืนยันว่ามีพาธ local อยู่จริง แล้วรัน:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

ทั้งคำสั่ง CLI แบบสแตนด์อโลนและ Gateway ใช้ provider id `local` เดียวกัน
หากตั้ง provider เป็น `auto` ระบบจะพิจารณา local embeddings ก่อนก็ต่อเมื่อ
`memorySearch.local.modelPath` ชี้ไปยังไฟล์ local ที่มีอยู่จริง

**ผลลัพธ์เก่าหรือไม่อัปเดต?** รัน `openclaw memory index --force` เพื่อสร้างใหม่ ตัว watcher อาจพลาดการเปลี่ยนแปลงได้ในบางกรณีที่พบไม่บ่อย

**โหลด sqlite-vec ไม่ได้?** OpenClaw จะ fallback ไปใช้ cosine similarity ในโปรเซสโดยอัตโนมัติ ตรวจสอบบันทึกเพื่อดูข้อผิดพลาดการโหลดที่เจาะจง

## การกำหนดค่า

สำหรับการตั้งค่า embedding provider, การปรับแต่งการค้นหาแบบไฮบริด (weights, MMR, temporal
decay), การทำดัชนีแบบแบตช์, หน่วยความจำหลายโมดัล, sqlite-vec, extra paths และตัวเลือก config อื่นทั้งหมด ดูที่
[ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config)

## ที่เกี่ยวข้อง

- [ภาพรวมหน่วยความจำ](/th/concepts/memory)
- [การค้นหาหน่วยความจำ](/th/concepts/memory-search)
- [Active Memory](/th/concepts/active-memory)
