---
read_when:
    - คุณต้องการวิเคราะห์ PDF จาก agents
    - คุณต้องการพารามิเตอร์และข้อจำกัดของเครื่องมือ PDF อย่างละเอียด exact
    - คุณกำลังดีบักโหมด PDF แบบเนทีฟเทียบกับ fallback สำหรับการแยกข้อมูล
summary: วิเคราะห์เอกสาร PDF หนึ่งฉบับหรือหลายฉบับด้วยการรองรับแบบเนทีฟของ provider และ fallback สำหรับการแยกข้อมูล
title: เครื่องมือ PDF
x-i18n:
    generated_at: "2026-04-25T14:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` ใช้วิเคราะห์เอกสาร PDF หนึ่งฉบับหรือหลายฉบับและส่งคืนข้อความ

พฤติกรรมโดยย่อ:

- โหมด provider แบบเนทีฟสำหรับ provider โมเดล Anthropic และ Google
- โหมด fallback สำหรับการแยกข้อมูลสำหรับ provider อื่น ๆ (แยกข้อความก่อน แล้วใช้ภาพของหน้าเมื่อจำเป็น)
- รองรับอินพุตเดี่ยว (`pdf`) หรือหลายรายการ (`pdfs`) สูงสุด 10 PDF ต่อการเรียกหนึ่งครั้ง

## ความพร้อมใช้งาน

เครื่องมือนี้จะถูกลงทะเบียนก็ต่อเมื่อ OpenClaw สามารถ resolve config โมเดลที่รองรับ PDF สำหรับ agent ได้:

1. `agents.defaults.pdfModel`
2. fallback ไปที่ `agents.defaults.imageModel`
3. fallback ไปที่โมเดลเซสชัน/ค่าเริ่มต้นที่ resolve แล้วของ agent
4. หาก provider PDF แบบเนทีฟรองรับการยืนยันตัวตน ให้เลือกใช้ก่อน candidate fallback แบบ image ทั่วไป

หากไม่สามารถ resolve โมเดลที่ใช้งานได้ เครื่องมือ `pdf` จะไม่ถูกเปิดเผย

หมายเหตุด้านความพร้อมใช้งาน:

- ลำดับ fallback รับรู้สถานะการยืนยันตัวตน `provider/model` ที่กำหนดค่าไว้จะนับได้ก็ต่อเมื่อ
  OpenClaw สามารถยืนยันตัวตนกับ provider นั้นสำหรับ agent ได้จริง
- provider PDF แบบเนทีฟในปัจจุบันคือ **Anthropic** และ **Google**
- หาก provider ของเซสชัน/ค่าเริ่มต้นที่ resolve แล้วมีโมเดล vision/PDF
  ที่กำหนดค่าไว้แล้ว เครื่องมือ PDF จะใช้โมเดลนั้นซ้ำก่อน fallback ไปยัง provider อื่นที่รองรับการยืนยันตัวตน

## ข้อมูลอ้างอิงอินพุต

<ParamField path="pdf" type="string">
พาธหรือ URL ของ PDF หนึ่งฉบับ
</ParamField>

<ParamField path="pdfs" type="string[]">
พาธหรือ URL ของ PDF หลายฉบับ รวมกันได้สูงสุด 10 รายการ
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
พรอมป์ต์สำหรับการวิเคราะห์
</ParamField>

<ParamField path="pages" type="string">
ตัวกรองหน้า เช่น `1-5` หรือ `1,3,7-9`
</ParamField>

<ParamField path="model" type="string">
การ override โมเดลแบบไม่บังคับในรูปแบบ `provider/model`
</ParamField>

<ParamField path="maxBytesMb" type="number">
ขีดจำกัดขนาดต่อ PDF หน่วย MB ค่าเริ่มต้นคือ `agents.defaults.pdfMaxBytesMb` หรือ `10`
</ParamField>

หมายเหตุเกี่ยวกับอินพุต:

- `pdf` และ `pdfs` จะถูกรวมและ dedupe ก่อนโหลด
- หากไม่มีการระบุอินพุต PDF เครื่องมือจะส่งข้อผิดพลาด
- `pages` จะถูกแยกเป็นหมายเลขหน้าแบบเริ่มนับจาก 1, dedupe, เรียงลำดับ และ clamp ตามจำนวนหน้าสูงสุดที่กำหนดไว้
- `maxBytesMb` มีค่าเริ่มต้นเป็น `agents.defaults.pdfMaxBytesMb` หรือ `10`

## การอ้างอิง PDF ที่รองรับ

- พาธไฟล์ภายในเครื่อง (รวมถึงการขยาย `~`)
- URL แบบ `file://`
- URL แบบ `http://` และ `https://`
- การอ้างอิงขาเข้าที่ OpenClaw จัดการให้ เช่น `media://inbound/<id>`

หมายเหตุเกี่ยวกับการอ้างอิง:

- URI scheme อื่น ๆ (เช่น `ftp://`) จะถูกปฏิเสธพร้อม `unsupported_pdf_reference`
- ในโหมด sandbox URL ระยะไกลแบบ `http(s)` จะถูกปฏิเสธ
- เมื่อเปิดใช้นโยบายไฟล์แบบ workspace-only พาธไฟล์ภายในเครื่องที่อยู่นอก root ที่อนุญาตจะถูกปฏิเสธ
- การอ้างอิงขาเข้าที่มีการจัดการไว้และพาธที่ replay ภายใต้ inbound media store ของ OpenClaw จะได้รับอนุญาตภายใต้นโยบายไฟล์แบบ workspace-only

## โหมดการทำงาน

### โหมด provider แบบเนทีฟ

โหมดเนทีฟจะใช้กับ provider `anthropic` และ `google`
เครื่องมือจะส่งไบต์ PDF ดิบไปยัง API ของ provider โดยตรง

ข้อจำกัดของโหมดเนทีฟ:

- ไม่รองรับ `pages` หากตั้งค่าไว้ เครื่องมือจะส่งข้อผิดพลาดกลับ
- รองรับอินพุต PDF หลายฉบับ โดยแต่ละ PDF จะถูกส่งเป็น native document block / inline PDF part ก่อนพรอมป์ต์

### โหมด fallback สำหรับการแยกข้อมูล

โหมด fallback จะใช้กับ provider ที่ไม่ใช่แบบเนทีฟ

ลำดับการทำงาน:

1. แยกข้อความจากหน้าที่เลือกไว้ (สูงสุด `agents.defaults.pdfMaxPages`, ค่าเริ่มต้น `20`)
2. หากความยาวข้อความที่แยกได้ต่ำกว่า `200` ตัวอักษร ให้เรนเดอร์หน้าที่เลือกเป็นภาพ PNG และรวมเข้าไป
3. ส่งเนื้อหาที่แยกได้พร้อมพรอมป์ต์ไปยังโมเดลที่เลือก

รายละเอียดของ fallback:

- การแยกภาพของหน้าใช้ pixel budget ที่ `4,000,000`
- หากโมเดลเป้าหมายไม่รองรับอินพุตภาพและไม่มีข้อความที่แยกได้ เครื่องมือจะส่งข้อผิดพลาด
- หากการแยกข้อความสำเร็จ แต่การแยกภาพต้องใช้ vision บน
  โมเดลแบบข้อความล้วน OpenClaw จะตัดภาพที่เรนเดอร์ออกและดำเนินการต่อ
  ด้วยข้อความที่แยกได้
- fallback สำหรับการแยกข้อมูลใช้ Plugin `document-extract` ที่บันเดิลมา Plugin นี้เป็นเจ้าของ
  `pdfjs-dist`; ส่วน `@napi-rs/canvas` จะใช้เฉพาะเมื่อมี fallback สำหรับการเรนเดอร์ภาพเท่านั้น

## Config

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับรายละเอียดของแต่ละฟิลด์แบบครบถ้วน

## รายละเอียดเอาต์พุต

เครื่องมือจะส่งคืนข้อความใน `content[0].text` และเมทาดาทาแบบมีโครงสร้างใน `details`

ฟิลด์ `details` ทั่วไป:

- `model`: model ref ที่ resolve แล้ว (`provider/model`)
- `native`: `true` สำหรับโหมด provider แบบเนทีฟ, `false` สำหรับ fallback
- `attempts`: ความพยายาม fallback ที่ล้มเหลวก่อนสำเร็จ

ฟิลด์พาธ:

- อินพุต PDF เดี่ยว: `details.pdf`
- อินพุต PDF หลายฉบับ: `details.pdfs[]` พร้อมรายการ `pdf`
- เมทาดาทาการเขียนพาธใหม่ใน sandbox (เมื่อมี): `rewrittenFrom`

## พฤติกรรมเมื่อเกิดข้อผิดพลาด

- ไม่มีอินพุต PDF: โยนข้อผิดพลาด `pdf required: provide a path or URL to a PDF document`
- มี PDF มากเกินไป: ส่งคืนข้อผิดพลาดแบบมีโครงสร้างใน `details.error = "too_many_pdfs"`
- scheme ของการอ้างอิงไม่รองรับ: ส่งคืน `details.error = "unsupported_pdf_reference"`
- โหมดเนทีฟพร้อม `pages`: โยนข้อผิดพลาดที่ชัดเจน `pages is not supported with native PDF providers`

## ตัวอย่าง

PDF เดี่ยว:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

PDF หลายฉบับ:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

โมเดล fallback แบบกรองหน้า:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## ที่เกี่ยวข้อง

- [ภาพรวม Tools](/th/tools) — tools ของ agent ทั้งหมดที่มีให้ใช้งาน
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — config `pdfMaxBytesMb` และ `pdfMaxPages`
