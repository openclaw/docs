---
read_when:
    - การผสานรวมไคลเอนต์ที่สื่อสารด้วย OpenResponses API
    - คุณต้องการอินพุตแบบรายการ การเรียกใช้เครื่องมือฝั่งไคลเอนต์ หรือเหตุการณ์ SSE
summary: เปิดเผยเอนด์พอยต์ HTTP /v1/responses ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-27T17:36:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw สามารถให้บริการปลายทาง `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses

ปลายทางนี้ถูก**ปิดใช้งานโดยค่าเริ่มต้น** เปิดใช้ใน config ก่อน

- `POST /v1/responses`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

เบื้องหลัง คำขอจะถูกดำเนินการเป็นการรันเอเจนต์ Gateway ปกติ (codepath เดียวกับ
`openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

พฤติกรรมการปฏิบัติงานตรงกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- ใช้เส้นทางการยืนยันตัวตน HTTP ของ Gateway ที่ตรงกัน:
  - การยืนยันตัวตนด้วย shared-secret (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
  - การยืนยันตัวตนแบบ trusted-proxy (`gateway.auth.mode="trusted-proxy"`): ส่วนหัวพร็อกซีที่รับรู้ตัวตนจากแหล่งพร็อกซีที่เชื่อถือได้และกำหนดค่าไว้; พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
  - fallback โดยตรงในเครื่องของ trusted-proxy: ผู้เรียกจากโฮสต์เดียวกันที่ไม่มีส่วนหัว `Forwarded`, `X-Forwarded-*`, หรือ `X-Real-IP` สามารถใช้ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - การยืนยันตัวตนแบบเปิดสำหรับ private-ingress (`gateway.auth.mode="none"`): ไม่มีส่วนหัว auth
- ถือว่าปลายทางนี้มีสิทธิ์ผู้ปฏิบัติการเต็มรูปแบบสำหรับอินสแตนซ์ Gateway
- สำหรับโหมดการยืนยันตัวตนด้วย shared-secret (`token` และ `password`) ให้ละเว้นค่า `x-openclaw-scopes` ที่ bearer ประกาศไว้แบบแคบกว่า และคืนค่าเริ่มต้นผู้ปฏิบัติการเต็มรูปแบบตามปกติ
- สำหรับโหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตน trusted proxy หรือ `gateway.auth.mode="none"`) ให้เคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นให้ fallback ไปยังชุด scope เริ่มต้นของผู้ปฏิบัติการตามปกติ
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, หรือ `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เมื่อต้องการแทนที่โมเดล backend ของเอเจนต์ที่เลือก
- ใช้ `x-openclaw-session-key` สำหรับการกำหนดเส้นทางเซสชันอย่างชัดเจน
- ใช้ `x-openclaw-message-channel` เมื่อต้องการบริบทช่องทาง ingress สังเคราะห์ที่ไม่ใช่ค่าเริ่มต้น

เมทริกซ์ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ละเว้น `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope เริ่มต้นของผู้ปฏิบัติการเต็มรูปแบบ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่ารอบแชตบนปลายทางนี้เป็นรอบแบบ owner-sender
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตน trusted proxy หรือ `gateway.auth.mode="none"` บน private ingress)
  - เคารพ `x-openclaw-scopes` เมื่อมีส่วนหัวอยู่
  - fallback ไปยังชุด scope เริ่มต้นของผู้ปฏิบัติการตามปกติเมื่อไม่มีส่วนหัว
  - จะเสียความหมายแบบเจ้าของเฉพาะเมื่อผู้เรียกจำกัด scope อย่างชัดเจนและละเว้น `operator.admin`

เปิดหรือปิดปลายทางนี้ด้วย `gateway.http.endpoints.responses.enabled`

พื้นผิวความเข้ากันได้เดียวกันยังรวมถึง:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

สำหรับคำอธิบายมาตรฐานว่าโมเดลที่กำหนดเป้าหมายเอเจนต์, `openclaw/default`, embeddings pass-through, และการแทนที่โมเดล backend ทำงานร่วมกันอย่างไร โปรดดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract) และ [รายการโมเดลและการกำหนดเส้นทางเอเจนต์](/th/gateway/openai-http-api#model-list-and-agent-routing)

## พฤติกรรมเซสชัน

โดยค่าเริ่มต้น ปลายทางนี้เป็นแบบ**ไร้สถานะต่อคำขอ** (สร้าง session key ใหม่ในแต่ละครั้งที่เรียก)

หากคำขอมีสตริง OpenResponses `user` Gateway จะสร้าง session key ที่เสถียร
จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้เซสชันเอเจนต์ร่วมกันได้

## รูปแบบคำขอ (ที่รองรับ)

คำขอเป็นไปตาม OpenResponses API โดยใช้อินพุตแบบรายการ รายการที่รองรับปัจจุบัน:

- `input`: สตริงหรืออาร์เรย์ของอ็อบเจ็กต์รายการ
- `instructions`: รวมเข้ากับ system prompt
- `tools`: นิยามเครื่องมือฝั่งไคลเอนต์ (function tools)
- `tool_choice`: `"auto"`, `"none"`, `"required"`, หรือ `{ "type": "function", "name": "..." }` เพื่อกรองหรือกำหนดให้ใช้เครื่องมือฝั่งไคลเอนต์
- `stream`: เปิดใช้การสตรีม SSE
- `max_output_tokens`: ขีดจำกัดเอาต์พุตแบบ best-effort (ขึ้นกับผู้ให้บริการ)
- `temperature`: อุณหภูมิการสุ่มตัวอย่างแบบ best-effort ที่ส่งต่อไปยังผู้ให้บริการ ถูกละเว้นโดย backend Codex Responses ที่อิง ChatGPT ซึ่งใช้การสุ่มตัวอย่างฝั่งเซิร์ฟเวอร์แบบคงที่
- `top_p`: nucleus sampling แบบ best-effort ที่ส่งต่อไปยังผู้ให้บริการ มีข้อควรระวังของ Codex Responses เช่นเดียวกับ `temperature`
- `user`: การกำหนดเส้นทางเซสชันที่เสถียร

รับได้แต่**ขณะนี้ถูกละเว้น**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

รองรับ:

- `previous_response_id`: OpenClaw ใช้เซสชันคำตอบก่อนหน้าซ้ำเมื่อคำขอยังคงอยู่ภายใน scope ของเอเจนต์/ผู้ใช้/เซสชันที่ร้องขอเดียวกัน

## รายการ (อินพุต)

### `message`

บทบาท: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายเข้าใน system prompt
- รายการ `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น “ข้อความปัจจุบัน”
- ข้อความ user/assistant ก่อนหน้าจะถูกรวมเป็นประวัติเพื่อใช้เป็นบริบท

### `function_call_output` (เครื่องมือแบบตามรอบ)

ส่งผลลัพธ์เครื่องมือกลับไปยังโมเดล:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` และ `item_reference`

รับไว้เพื่อความเข้ากันได้ของ schema แต่ถูกละเว้นเมื่อสร้าง prompt

## เครื่องมือ (function tools ฝั่งไคลเอนต์)

ระบุเครื่องมือด้วย `tools: [{ type: "function", name, description?, parameters? }]`

หากเอเจนต์ตัดสินใจเรียกเครื่องมือ คำตอบจะส่งคืนรายการเอาต์พุต `function_call`
จากนั้นคุณส่งคำขอติดตามผลพร้อม `function_call_output` เพื่อดำเนินรอบต่อ

สำหรับ `tool_choice: "required"` และ `tool_choice` ที่ปักหมุดฟังก์ชันไว้ ปลายทางจะจำกัดชุด function-tool ฝั่งไคลเอนต์ที่เปิดเผย สั่งให้ runtime เรียกเครื่องมือฝั่งไคลเอนต์ก่อนตอบ และปฏิเสธรอบนั้นหากไม่มีการเรียก client-tool แบบมีโครงสร้างที่ตรงกัน สัญญานี้ใช้กับรายการ HTTP `tools` ที่ผู้เรียกระบุ ไม่ใช่เครื่องมือเอเจนต์ภายใน OpenClaw ทุกตัว คำขอแบบไม่สตรีมส่งคืน `502` พร้อม `api_error`; คำขอแบบสตรีมปล่อยเหตุการณ์ `response.failed` ซึ่งตรงกับสัญญา `/v1/chat/completions`

## รูปภาพ (`input_image`)

รองรับแหล่งที่มาแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

ประเภท MIME ที่อนุญาต (ปัจจุบัน): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
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

ประเภท MIME ที่อนุญาต (ปัจจุบัน): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`

ขนาดสูงสุด (ปัจจุบัน): 5MB

พฤติกรรมปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มไปยัง **system prompt** ไม่ใช่ข้อความผู้ใช้
  จึงยังคงเป็นชั่วคราว (ไม่ถูกบันทึกในประวัติเซสชัน)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนถูกเพิ่ม
  ดังนั้นไบต์ของไฟล์จะถูกถือเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้
- บล็อกที่ฉีดเข้าไปใช้ตัวทำเครื่องหมายขอบเขตอย่างชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัด metadata
  `Source: External`
- เส้นทางอินพุตไฟล์นี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อ
  รักษางบประมาณ prompt; ตัวทำเครื่องหมายขอบเขตและ metadata ยังคงอยู่
- PDF จะถูกแยกข้อความก่อน หากพบข้อความน้อย หน้าแรกๆ จะถูก
  rasterize เป็นรูปภาพและส่งให้โมเดล และบล็อกไฟล์ที่ฉีดเข้าไปจะใช้
  placeholder `[PDF content rendered to images]`

การแยกวิเคราะห์ PDF จัดหาโดย Plugin `document-extract` ที่ bundled มา ซึ่งใช้
`clawpdf` และ runtime PDFium WebAssembly ที่แพ็กมาด้วยสำหรับการแยกข้อความและ
การเรนเดอร์หน้า

ค่าเริ่มต้นของการดึง URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (จำนวนส่วน `input_file` + `input_image` ที่อิง URL รวมต่อคำขอ)
- คำขอถูกป้องกันไว้ (การแก้ DNS, การบล็อก IP ส่วนตัว, ขีดจำกัด redirect, timeout)
- รองรับ allowlist ของ hostname แบบไม่บังคับแยกตามประเภทอินพุต (`files.urlAllowlist`, `images.urlAllowlist`)
  - โฮสต์ตรงตัว: `"cdn.example.com"`
  - โดเมนย่อยแบบ wildcard: `"*.assets.example.com"` (ไม่ตรงกับ apex)
  - allowlist ที่ว่างหรือถูกละเว้นหมายถึงไม่มีข้อจำกัด allowlist ของ hostname
- หากต้องการปิดการดึงข้อมูลตาม URL ทั้งหมด ให้ตั้งค่า `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดไฟล์ + รูปภาพ (config)

ปรับค่าเริ่มต้นได้ใต้ `gateway.http.endpoints.responses`:

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

ค่าเริ่มต้นเมื่อถูกละเว้น:

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
- แหล่งที่มา HEIC/HEIF `input_image` จะถูกรับเมื่อมีตัวแปลงของระบบ และจะถูกทำให้เป็น JPEG ก่อนส่งไปยังผู้ให้บริการ ตัวแปลงที่รองรับคือ macOS `sips`, ImageMagick, GraphicsMagick, หรือ ffmpeg

หมายเหตุด้านความปลอดภัย:

- URL allowlist ถูกบังคับใช้ก่อนดึงข้อมูลและในแต่ละ hop ของ redirect
- การเพิ่ม hostname ลง allowlist ไม่ได้ข้ามการบล็อก IP ส่วนตัว/ภายใน
- สำหรับ gateway ที่เปิดสู่อินเทอร์เน็ต ให้ใช้การควบคุม network egress เพิ่มเติมนอกเหนือจาก guard ระดับแอป
  ดู [ความปลอดภัย](/th/gateway/security)

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดเหตุการณ์คือ `event: <type>` และ `data: <json>`
- สตรีมสิ้นสุดด้วย `data: [DONE]`

ประเภทเหตุการณ์ที่ปล่อยในปัจจุบัน:

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

`usage` จะถูกเติมเมื่อผู้ให้บริการเบื้องล่างรายงานจำนวน token
OpenClaw ทำให้ alias ทั่วไปสไตล์ OpenAI เป็นรูปแบบมาตรฐานก่อนที่ตัวนับเหล่านั้นจะไปถึง
พื้นผิวสถานะ/เซสชัน downstream รวมถึง `input_tokens` / `output_tokens`
และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้ JSON object เช่น:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีทั่วไป:

- `401` auth หายไป/ไม่ถูกต้อง
- `400` body คำขอไม่ถูกต้อง
- `405` method ผิด

## ตัวอย่าง

แบบไม่สตรีม:

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

การสตรีม:

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
