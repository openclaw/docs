---
read_when:
    - การผสานรวมไคลเอนต์ที่สื่อสารด้วย OpenResponses API
    - คุณต้องการอินพุตแบบอิงรายการ การเรียกใช้เครื่องมือฝั่งไคลเอนต์ หรือเหตุการณ์ SSE
summary: เปิดให้บริการปลายทาง HTTP /v1/responses ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: API ของ OpenResponses
x-i18n:
    generated_at: "2026-05-06T09:14:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw의 Gateway สามารถให้บริการปลายทาง `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses

ปลายทางนี้ถูก**ปิดใช้งานโดยค่าเริ่มต้น** เปิดใช้งานใน config ก่อน

- `POST /v1/responses`
- พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

ภายใน คำขอจะถูกดำเนินการเหมือนการรันเอเจนต์ Gateway ตามปกติ (เส้นทางโค้ดเดียวกับ
`openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์/config จะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

ลักษณะการทำงานด้านปฏิบัติการตรงกับ [การเติมเต็มแชตของ OpenAI](/th/gateway/openai-http-api):

- ใช้เส้นทางยืนยันตัวตน HTTP ของ Gateway ที่ตรงกัน:
  - การยืนยันตัวตนด้วยความลับร่วม (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
  - การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`): ส่วนหัวพร็อกซีที่รับรู้ตัวตนจากแหล่งพร็อกซีที่เชื่อถือได้ที่กำหนดค่าไว้ พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
  - การยืนยันตัวตนแบบเปิดสำหรับช่องทางเข้าแบบส่วนตัว (`gateway.auth.mode="none"`): ไม่มีส่วนหัวการยืนยันตัวตน
- ถือว่าปลายทางนี้เป็นสิทธิ์ผู้ปฏิบัติการเต็มรูปแบบสำหรับอินสแตนซ์ Gateway
- สำหรับโหมดการยืนยันตัวตนด้วยความลับร่วม (`token` และ `password`) ให้ละเว้นค่า `x-openclaw-scopes` ที่ bearer ระบุให้แคบลง และคืนค่าค่าเริ่มต้นผู้ปฏิบัติการเต็มรูปแบบตามปกติ
- สำหรับโหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"`) ให้เคารพ `x-openclaw-scopes` เมื่อมี และหากไม่มีให้ย้อนกลับไปใช้ชุด scope เริ่มต้นปกติของผู้ปฏิบัติการ
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` หรือ `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เมื่อคุณต้องการแทนที่โมเดลแบ็กเอนด์ของเอเจนต์ที่เลือก
- ใช้ `x-openclaw-session-key` สำหรับการกำหนดเส้นทางเซสชันแบบชัดเจน
- ใช้ `x-openclaw-message-channel` เมื่อคุณต้องการบริบทช่องทางเข้าแบบสังเคราะห์ที่ไม่ใช่ค่าเริ่มต้น

ตารางการยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครองความลับผู้ปฏิบัติการ Gateway ที่ใช้ร่วมกัน
  - ละเว้น `x-openclaw-scopes` ที่แคบลง
  - คืนค่าชุด scope เริ่มต้นเต็มรูปแบบของผู้ปฏิบัติการ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า turn แชตบนปลายทางนี้เป็น turn จากผู้ส่งที่เป็นเจ้าของ
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนแบบพร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"` บนช่องทางเข้าแบบส่วนตัว)
  - เคารพ `x-openclaw-scopes` เมื่อมีส่วนหัวนี้
  - ย้อนกลับไปใช้ชุด scope เริ่มต้นปกติของผู้ปฏิบัติการเมื่อไม่มีส่วนหัวนี้
  - จะเสียความหมายของเจ้าของก็ต่อเมื่อผู้เรียกจำกัด scope ให้แคบลงอย่างชัดเจนและละเว้น `operator.admin`

เปิดหรือปิดปลายทางนี้ด้วย `gateway.http.endpoints.responses.enabled`

พื้นผิวความเข้ากันได้เดียวกันยังรวมถึง:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

สำหรับคำอธิบายมาตรฐานว่าโมเดลที่กำหนดเป้าหมายเอเจนต์, `openclaw/default`, การส่งต่อ embeddings และการแทนที่โมเดลแบ็กเอนด์ทำงานร่วมกันอย่างไร โปรดดู [การเติมเต็มแชตของ OpenAI](/th/gateway/openai-http-api#agent-first-model-contract) และ [รายการโมเดลและการกำหนดเส้นทางเอเจนต์](/th/gateway/openai-http-api#model-list-and-agent-routing)

## ลักษณะการทำงานของเซสชัน

โดยค่าเริ่มต้น ปลายทางนี้เป็นแบบ**ไม่มีสถานะต่อคำขอ** (สร้างคีย์เซสชันใหม่ในการเรียกแต่ละครั้ง)

หากคำขอมีสตริง `user` ของ OpenResponses Gateway จะสร้างคีย์เซสชันที่เสถียร
จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้เซสชันเอเจนต์ร่วมกันได้

## รูปแบบคำขอ (ที่รองรับ)

คำขอทำตาม API OpenResponses ด้วยอินพุตแบบรายการ การรองรับปัจจุบัน:

- `input`: สตริงหรืออาร์เรย์ของอ็อบเจ็กต์รายการ
- `instructions`: รวมเข้าในพรอมป์ระบบ
- `tools`: นิยามเครื่องมือของไคลเอนต์ (เครื่องมือฟังก์ชัน)
- `tool_choice`: กรองหรือบังคับใช้เครื่องมือของไคลเอนต์
- `stream`: เปิดใช้งานการสตรีม SSE
- `max_output_tokens`: ขีดจำกัดเอาต์พุตแบบพยายามดีที่สุด (ขึ้นกับผู้ให้บริการ)
- `user`: การกำหนดเส้นทางเซสชันที่เสถียร

รับได้แต่**ปัจจุบันถูกละเว้น**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

รองรับ:

- `previous_response_id`: OpenClaw ใช้เซสชันคำตอบก่อนหน้าซ้ำเมื่อคำขอยังคงอยู่ในขอบเขตเอเจนต์/ผู้ใช้/เซสชันที่ร้องขอเดียวกัน

## รายการ (`input`)

### `message`

บทบาท: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายในพรอมป์ระบบ
- รายการ `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น “ข้อความปัจจุบัน”
- ข้อความ user/assistant ก่อนหน้าจะถูกรวมเป็นประวัติเพื่อใช้เป็นบริบท

### `function_call_output` (เครื่องมือแบบอิง turn)

ส่งผลลัพธ์เครื่องมือกลับไปยังโมเดล:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` และ `item_reference`

รับเพื่อความเข้ากันได้ของสคีมา แต่ละเว้นเมื่อสร้างพรอมป์

## เครื่องมือ (เครื่องมือฟังก์ชันฝั่งไคลเอนต์)

ให้เครื่องมือด้วย `tools: [{ type: "function", function: { name, description?, parameters? } }]`

หากเอเจนต์ตัดสินใจเรียกเครื่องมือ คำตอบจะส่งคืนรายการเอาต์พุต `function_call`
จากนั้นคุณส่งคำขอติดตามผลด้วย `function_call_output` เพื่อดำเนิน turn ต่อ

## รูปภาพ (`input_image`)

รองรับแหล่งที่มาแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

ชนิด MIME ที่อนุญาต (ปัจจุบัน): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
ขนาดสูงสุด (ปัจจุบัน): 10MB

## ไฟล์ (`input_file`)

รองรับแหล่งที่มาแบบ base64 หรือ URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

ชนิด MIME ที่อนุญาต (ปัจจุบัน): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`

ขนาดสูงสุด (ปัจจุบัน): 5MB

ลักษณะการทำงานปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มเข้าใน**พรอมป์ระบบ** ไม่ใช่ข้อความผู้ใช้
  ดังนั้นจึงคงเป็นแบบชั่วคราว (ไม่ถูกเก็บถาวรในประวัติเซสชัน)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกห่อเป็น**เนื้อหาภายนอกที่ไม่น่าเชื่อถือ**ก่อนเพิ่มเข้าไป
  ดังนั้นไบต์ของไฟล์จะถูกถือเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้
- บล็อกที่แทรกใช้เครื่องหมายขอบเขตที่ชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมทาดาทา
  `Source: External`
- เส้นทางอินพุตไฟล์นี้จงใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อ
  รักษางบประมาณพรอมป์ เครื่องหมายขอบเขตและเมทาดาทายังคงอยู่ครบ
- PDF จะถูกแยกข้อความก่อน หากพบข้อความน้อย หน้าแรก ๆ จะถูก
  แปลงเป็นภาพแรสเตอร์และส่งต่อให้โมเดล และบล็อกไฟล์ที่แทรกจะใช้
  ตัวแทนข้อความ `[PDF content rendered to images]`

การแยกวิเคราะห์ PDF จัดทำโดย Plugin `document-extract` ที่บันเดิลมา ซึ่งใช้บิลด์ legacy ของ `pdfjs-dist` ที่ใช้งานกับ Node ได้ดี (ไม่มีเวิร์กเกอร์) บิลด์ PDF.js สมัยใหม่คาดหวังเวิร์กเกอร์ของเบราว์เซอร์/ตัวแปรโกลบอล DOM จึงไม่ได้ใช้ใน Gateway

ค่าเริ่มต้นของการดึงข้อมูลจาก URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (จำนวนส่วน `input_file` + `input_image` ที่อิง URL ทั้งหมดต่อคำขอ)
- คำขอมีการป้องกัน (การแปลงชื่อ DNS, การบล็อก IP ส่วนตัว, เพดานการเปลี่ยนเส้นทาง, หมดเวลา)
- รองรับรายการอนุญาตชื่อโฮสต์แบบไม่บังคับตามชนิดอินพุต (`files.urlAllowlist`, `images.urlAllowlist`)
  - โฮสต์แบบตรงตัว: `"cdn.example.com"`
  - โดเมนย่อยแบบไวลด์การ์ด: `"*.assets.example.com"` (ไม่ตรงกับโดเมนราก)
  - รายการอนุญาตที่ว่างหรือไม่ได้ระบุหมายถึงไม่มีข้อจำกัดรายการอนุญาตชื่อโฮสต์
- หากต้องการปิดการดึงข้อมูลที่อิง URL ทั้งหมด ให้ตั้งค่า `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดไฟล์ + รูปภาพ (การกำหนดค่า)

ปรับค่าเริ่มต้นได้ภายใต้ `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

ค่าเริ่มต้นเมื่อไม่ระบุ:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- แหล่งที่มา HEIC/HEIF `input_image` จะถูกรับและทำให้เป็น JPEG ก่อนส่งให้ผู้ให้บริการ

หมายเหตุด้านความปลอดภัย:

- รายการอนุญาต URL จะถูกบังคับใช้ก่อนการดึงข้อมูลและในแต่ละขั้นของการเปลี่ยนเส้นทาง
- การใส่ชื่อโฮสต์ไว้ในรายการอนุญาตไม่ได้ข้ามการบล็อก IP ส่วนตัว/ภายใน
- สำหรับ Gateway ที่เปิดสู่อินเทอร์เน็ต ให้ใช้การควบคุมการออกเครือข่ายเพิ่มเติมจากการป้องกันระดับแอป
  ดู [ความปลอดภัย](/th/gateway/security)

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดเหตุการณ์คือ `event: <type>` และ `data: <json>`
- สตรีมจบด้วย `data: [DONE]`

ชนิดเหตุการณ์ที่ส่งออกในปัจจุบัน:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (เมื่อเกิดข้อผิดพลาด)

## การใช้งาน

`usage` จะถูกเติมค่าเมื่อผู้ให้บริการเบื้องหลังรายงานจำนวนโทเค็น
OpenClaw ทำให้นามแฝงทั่วไปแบบ OpenAI อยู่ในรูปแบบมาตรฐานก่อนที่ตัวนับเหล่านั้นจะไปถึง
พื้นผิวสถานะ/เซสชันปลายทาง รวมถึง `input_tokens` / `output_tokens`
และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้อ็อบเจ็กต์ JSON ลักษณะนี้:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีทั่วไป:

- `401` ไม่มี/การยืนยันตัวตนไม่ถูกต้อง
- `400` เนื้อหาคำขอไม่ถูกต้อง
- `405` เมธอดผิด

## ตัวอย่าง

ไม่สตรีม:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

สตรีม:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## ที่เกี่ยวข้อง

- [การเติมเต็มแชตของ OpenAI](/th/gateway/openai-http-api)
- [OpenAI](/th/providers/openai)
