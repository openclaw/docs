---
read_when:
    - คุณต้องการวิเคราะห์ไฟล์ PDF จากเอเจนต์
    - คุณต้องใช้พารามิเตอร์และขีดจำกัดของเครื่องมือ PDF ที่ถูกต้องแม่นยำ
    - คุณกำลังดีบักโหมด PDF แบบเนทีฟเทียบกับการสำรองกลับไปใช้การสกัดข้อมูล
summary: วิเคราะห์เอกสาร PDF หนึ่งฉบับหรือมากกว่าด้วยการรองรับแบบเนทีฟจากผู้ให้บริการและการสำรองด้วยการสกัดข้อมูล
title: เครื่องมือ PDF
x-i18n:
    generated_at: "2026-06-27T18:30:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` วิเคราะห์เอกสาร PDF หนึ่งรายการขึ้นไปและส่งคืนข้อความ

พฤติกรรมโดยย่อ:

- โหมดผู้ให้บริการแบบเนทีฟสำหรับผู้ให้บริการโมเดล Anthropic และ Google
- โหมดสำรองด้วยการแยกข้อมูลสำหรับผู้ให้บริการอื่น (แยกข้อความก่อน แล้วจึงใช้รูปภาพหน้าเมื่อจำเป็น)
- รองรับอินพุตแบบรายการเดียว (`pdf`) หรือหลายรายการ (`pdfs`) สูงสุด 10 PDF ต่อการเรียกหนึ่งครั้ง

## ความพร้อมใช้งาน

เครื่องมือนี้จะถูกลงทะเบียนเฉพาะเมื่อ OpenClaw สามารถแก้ค่า config โมเดลที่รองรับ PDF สำหรับเอเจนต์ได้:

1. `agents.defaults.pdfModel`
2. สำรองไปที่ `agents.defaults.imageModel`
3. สำรองไปที่โมเดลเซสชัน/ค่าเริ่มต้นที่แก้ค่าแล้วของเอเจนต์
4. หากผู้ให้บริการ PDF แบบเนทีฟมีการรองรับด้วยการยืนยันตัวตน ให้เลือกก่อนตัวเลือกสำรองรูปภาพทั่วไป

หากไม่สามารถแก้ค่าโมเดลที่ใช้งานได้ เครื่องมือ `pdf` จะไม่ถูกเปิดเผย

หมายเหตุความพร้อมใช้งาน:

- เชนสำรองรับรู้การยืนยันตัวตน ค่า `provider/model` ที่ตั้งค่าไว้จะนับเฉพาะเมื่อ
  OpenClaw สามารถยืนยันตัวตนกับผู้ให้บริการนั้นสำหรับเอเจนต์ได้จริง
- ผู้ให้บริการ PDF แบบเนทีฟในปัจจุบันคือ **Anthropic** และ **Google**
- หากผู้ให้บริการเซสชัน/ค่าเริ่มต้นที่แก้ค่าแล้วมีโมเดล vision/PDF ที่ตั้งค่าไว้แล้ว
  เครื่องมือ PDF จะใช้โมเดลนั้นก่อนสำรองไปยังผู้ให้บริการอื่นที่รองรับด้วยการยืนยันตัวตน

## อ้างอิงอินพุต

<ParamField path="pdf" type="string">
พาธหรือ URL ของ PDF หนึ่งรายการ
</ParamField>

<ParamField path="pdfs" type="string[]">
พาธหรือ URL ของ PDF หลายรายการ รวมสูงสุด 10 รายการ
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
พรอมป์การวิเคราะห์
</ParamField>

<ParamField path="pages" type="string">
ตัวกรองหน้า เช่น `1-5` หรือ `1,3,7-9`
</ParamField>

<ParamField path="password" type="string">
รหัสผ่านสำหรับ PDF ที่เข้ารหัสในโหมดสำรองด้วยการแยกข้อมูล
</ParamField>

<ParamField path="model" type="string">
การแทนที่โมเดลแบบไม่บังคับในรูปแบบ `provider/model`
</ParamField>

<ParamField path="maxBytesMb" type="number">
ขีดจำกัดขนาดต่อ PDF เป็น MB ค่าเริ่มต้นคือ `agents.defaults.pdfMaxBytesMb` หรือ `10`
</ParamField>

หมายเหตุอินพุต:

- `pdf` และ `pdfs` จะถูกผสานและลบรายการซ้ำก่อนโหลด
- หากไม่ได้ระบุอินพุต PDF เครื่องมือจะแจ้งข้อผิดพลาด
- `pages` จะถูกแยกวิเคราะห์เป็นหมายเลขหน้าแบบเริ่มที่ 1, ลบรายการซ้ำ, เรียงลำดับ และจำกัดให้อยู่ภายในจำนวนหน้าสูงสุดที่ตั้งค่าไว้
- `password` ใช้กับ PDF ทุกไฟล์ในคำขอ และจะถูกใช้โดยโหมดสำรองด้วยการแยกข้อมูลเท่านั้น
- `maxBytesMb` มีค่าเริ่มต้นเป็น `agents.defaults.pdfMaxBytesMb` หรือ `10`

## การอ้างอิง PDF ที่รองรับ

- พาธไฟล์ในเครื่อง (รวมถึงการขยาย `~`)
- URL `file://`
- URL `http://` และ `https://`
- refs ขาเข้าที่ OpenClaw จัดการ เช่น `media://inbound/<id>`

หมายเหตุการอ้างอิง:

- URI scheme อื่น (เช่น `ftp://`) จะถูกปฏิเสธด้วย `unsupported_pdf_reference`
- ในโหมด sandbox, URL ระยะไกล `http(s)` จะถูกปฏิเสธ
- เมื่อเปิดใช้นโยบายไฟล์เฉพาะ workspace พาธไฟล์ในเครื่องที่อยู่นอก root ที่อนุญาตจะถูกปฏิเสธ
- refs ขาเข้าที่จัดการแล้วและพาธที่เล่นซ้ำภายใต้ media store ขาเข้าของ OpenClaw จะได้รับอนุญาตด้วยนโยบายไฟล์เฉพาะ workspace

## โหมดการทำงาน

### โหมดผู้ให้บริการแบบเนทีฟ

โหมดเนทีฟใช้สำหรับผู้ให้บริการ `anthropic` และ `google`
เครื่องมือจะส่งไบต์ PDF ดิบไปยัง API ของผู้ให้บริการโดยตรง

ข้อจำกัดของโหมดเนทีฟ:

- ไม่รองรับ `pages` หากตั้งค่าไว้ เครื่องมือจะส่งคืนข้อผิดพลาด
- ไม่รองรับ `password` ใช้โมเดลที่ไม่ใช่เนทีฟเพื่อวิเคราะห์ PDF ที่เข้ารหัส
- รองรับอินพุตหลาย PDF โดยแต่ละ PDF จะถูกส่งเป็นบล็อกเอกสารเนทีฟ /
  ส่วน PDF แบบ inline ก่อนพรอมป์

### โหมดสำรองด้วยการแยกข้อมูล

โหมดสำรองใช้สำหรับผู้ให้บริการที่ไม่ใช่เนทีฟ

ลำดับงาน:

1. แยกข้อความจากหน้าที่เลือก (สูงสุด `agents.defaults.pdfMaxPages`, ค่าเริ่มต้น `20`)
2. หากความยาวข้อความที่แยกได้ต่ำกว่า `200` อักขระ ให้เรนเดอร์หน้าที่เลือกเป็นรูปภาพ PNG และรวมเข้าไปด้วย
3. ส่งเนื้อหาที่แยกได้พร้อมพรอมป์ไปยังโมเดลที่เลือก

รายละเอียดโหมดสำรอง:

- การแยกรูปภาพหน้าจะใช้งบประมาณพิกเซล `4,000,000`
- PDF ที่เข้ารหัสสามารถเปิดได้ด้วยพารามิเตอร์ระดับบนสุด `password`
- หากโมเดลเป้าหมายไม่รองรับอินพุตรูปภาพและไม่มีข้อความที่แยกได้ เครื่องมือจะแจ้งข้อผิดพลาด
- หากการแยกข้อความสำเร็จ แต่การแยกรูปภาพต้องใช้ vision บนโมเดลแบบข้อความเท่านั้น
  OpenClaw จะตัดรูปภาพที่เรนเดอร์ออกและดำเนินการต่อด้วยข้อความที่แยกได้
- โหมดสำรองด้วยการแยกข้อมูลใช้ Plugin `document-extract` ที่บันเดิลมา Plugin นี้เป็นเจ้าของ
  `clawpdf` ซึ่งให้การแยกข้อความและการเรนเดอร์รูปภาพผ่าน PDFium
  WebAssembly

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

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) สำหรับรายละเอียดฟิลด์ทั้งหมด

## รายละเอียดเอาต์พุต

เครื่องมือส่งคืนข้อความใน `content[0].text` และ metadata แบบมีโครงสร้างใน `details`

ฟิลด์ `details` ทั่วไป:

- `model`: ref โมเดลที่แก้ค่าแล้ว (`provider/model`)
- `native`: `true` สำหรับโหมดผู้ให้บริการแบบเนทีฟ, `false` สำหรับโหมดสำรอง
- `attempts`: ความพยายามสำรองที่ล้มเหลวก่อนสำเร็จ

ฟิลด์พาธ:

- อินพุต PDF เดี่ยว: `details.pdf`
- อินพุต PDF หลายรายการ: `details.pdfs[]` พร้อมรายการ `pdf`
- metadata การเขียนพาธใหม่ของ sandbox (เมื่อใช้ได้): `rewrittenFrom`

## พฤติกรรมข้อผิดพลาด

- อินพุต PDF หายไป: โยน `pdf required: provide a path or URL to a PDF document`
- PDF มากเกินไป: ส่งคืนข้อผิดพลาดแบบมีโครงสร้างใน `details.error = "too_many_pdfs"`
- scheme การอ้างอิงไม่รองรับ: ส่งคืน `details.error = "unsupported_pdf_reference"`
- โหมดเนทีฟพร้อม `pages`: โยนข้อผิดพลาดที่ชัดเจน `pages is not supported with native PDF providers`

## ตัวอย่าง

PDF เดี่ยว:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

PDF หลายรายการ:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

โมเดลสำรองที่กรองหน้า:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF ที่เข้ารหัสพร้อมโหมดสำรองด้วยการแยกข้อมูล:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - config pdfMaxBytesMb และ pdfMaxPages
