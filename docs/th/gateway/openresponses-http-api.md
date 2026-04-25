---
read_when:
    - การผสานรวมไคลเอนต์ที่สื่อสารด้วย OpenResponses API
    - คุณต้องการอินพุตแบบอิงรายการ การเรียกใช้ client tool หรือ SSE events
summary: แสดง endpoint HTTP `/v1/responses` ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T13:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

Gateway ของ OpenClaw สามารถให้บริการ endpoint `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses

endpoint นี้จะ **ปิดใช้งานโดยค่าเริ่มต้น** ต้องเปิดใช้ในคอนฟิกก่อน

- `POST /v1/responses`
- ใช้พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

ภายใน คำขอจะถูกรันเป็นการทำงานของเอเจนต์บน Gateway ตามปกติ (เส้นทางโค้ดเดียวกับ
`openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์อนุญาต/คอนฟิกจะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

พฤติกรรมในการปฏิบัติงานตรงกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- ใช้เส้นทางการยืนยันตัวตน HTTP ของ Gateway ที่ตรงกัน:
  - shared-secret auth (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
  - trusted-proxy auth (`gateway.auth.mode="trusted-proxy"`): identity-aware proxy headers จาก trusted proxy source แบบ non-loopback ที่กำหนดค่าไว้
  - private-ingress open auth (`gateway.auth.mode="none"`): ไม่ต้องมี auth header
- ถือว่า endpoint นี้มีสิทธิ์เข้าถึงระดับ operator เต็มรูปแบบสำหรับอินสแตนซ์ gateway
- สำหรับโหมด shared-secret auth (`token` และ `password`) ให้ละเลยค่า `x-openclaw-scopes` ที่ประกาศผ่าน bearer ซึ่งแคบกว่า และคืนค่าค่าเริ่มต้น operator แบบเต็มตามปกติ
- สำหรับโหมด HTTP ที่มี trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) ให้ใช้ `x-openclaw-scopes` เมื่อมี และหากไม่มีให้ fallback ไปยังชุด scope เริ่มต้นของ operator ตามปกติ
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` หรือ `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เมื่อคุณต้องการ override backend model ของเอเจนต์ที่เลือกไว้
- ใช้ `x-openclaw-session-key` สำหรับการกำหนดเส้นทาง session แบบชัดเจน
- ใช้ `x-openclaw-message-channel` เมื่อคุณต้องการบริบท synthetic ingress channel ที่ไม่ใช่ค่าเริ่มต้น

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ละเลย `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope เริ่มต้นของ operator แบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turns บน endpoint นี้เป็น owner-sender turns
- โหมด HTTP ที่มี trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ใช้ `x-openclaw-scopes` เมื่อมี header นี้
  - fallback ไปยังชุด scope เริ่มต้นของ operator ตามปกติเมื่อไม่มี header
  - จะสูญเสีย owner semantics ก็ต่อเมื่อผู้เรียกจงใจลด scopes และไม่รวม `operator.admin`

เปิดหรือปิด endpoint นี้ได้ด้วย `gateway.http.endpoints.responses.enabled`

พื้นผิวความเข้ากันได้เดียวกันนี้ยังรวมถึง:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

สำหรับคำอธิบายแบบ canonical เกี่ยวกับวิธีที่โมเดลที่กำหนดเป้าหมายเอเจนต์, `openclaw/default`, embeddings pass-through และ backend model overrides ทำงานร่วมกัน โปรดดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract) และ [Model list and agent routing](/th/gateway/openai-http-api#model-list-and-agent-routing)

## พฤติกรรมของ Session

โดยค่าเริ่มต้น endpoint นี้จะเป็น **stateless ต่อคำขอ** (สร้าง session key ใหม่ทุกครั้งที่เรียก)

หากคำขอมีสตริง `user` ของ OpenResponses อยู่ Gateway จะ derive session key ที่เสถียร
จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้ agent session เดียวกันร่วมกันได้

## รูปแบบคำขอ (ที่รองรับ)

คำขอใช้รูปแบบตาม OpenResponses API พร้อมอินพุตแบบอิงรายการ รองรับในปัจจุบัน:

- `input`: สตริงหรืออาร์เรย์ของ item objects
- `instructions`: merge เข้าไปใน system prompt
- `tools`: คำจำกัดความ client tool (function tools)
- `tool_choice`: กรองหรือบังคับ client tools
- `stream`: เปิดใช้การสตรีมแบบ SSE
- `max_output_tokens`: ขีดจำกัดเอาต์พุตแบบ best-effort (ขึ้นอยู่กับ provider)
- `user`: การกำหนดเส้นทาง session แบบเสถียร

ยอมรับได้แต่ **ปัจจุบันจะถูกละเลย**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

รองรับ:

- `previous_response_id`: OpenClaw จะใช้ response session เดิมซ้ำเมื่อคำขอยังคงอยู่ภายในขอบเขตเดียวกันของ agent/user/requested-session

## รายการ (input)

### `message`

roles: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายเข้าไปใน system prompt
- item `user` หรือ `function_call_output` รายการล่าสุดจะกลายเป็น “ข้อความปัจจุบัน”
- ข้อความ user/assistant ก่อนหน้านั้นจะถูกรวมเป็นประวัติเพื่อใช้เป็นบริบท

### `function_call_output` (tools แบบ turn-based)

ส่งผลลัพธ์ของ tool กลับไปยังโมเดล:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` และ `item_reference`

ระบบยอมรับเพื่อความเข้ากันได้ของ schema แต่จะละเลยเมื่อสร้าง prompt

## Tools (function tools ฝั่ง client)

ส่ง tools ผ่าน `tools: [{ type: "function", function: { name, description?, parameters? } }]`

หากเอเจนต์ตัดสินใจเรียก tool การตอบกลับจะคืนค่า output item แบบ `function_call`
จากนั้นคุณส่งคำขอต่อเนื่องพร้อม `function_call_output` เพื่อดำเนิน turn ต่อ

## รูปภาพ (`input_image`)

รองรับแหล่งข้อมูลแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

MIME types ที่อนุญาต (ปัจจุบัน): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
ขนาดสูงสุด (ปัจจุบัน): 10MB

## ไฟล์ (`input_file`)

รองรับแหล่งข้อมูลแบบ base64 หรือ URL:

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

MIME types ที่อนุญาต (ปัจจุบัน): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`

ขนาดสูงสุด (ปัจจุบัน): 5MB

พฤติกรรมปัจจุบัน:

- เนื้อหาไฟล์จะถูก decode และเพิ่มเข้าไปใน **system prompt** ไม่ใช่ user message
  ดังนั้นจึงคงความเป็นชั่วคราวไว้ (ไม่ถูกบันทึกลงใน session history)
- ข้อความไฟล์ที่ decode แล้วจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนจะถูกเพิ่มเข้าไป
  ดังนั้น bytes ของไฟล์จะถูกมองเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้
- บล็อกที่ถูก inject จะใช้เครื่องหมายขอบเขตแบบชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดข้อมูลเมตา
  `Source: External`
- เส้นทาง input ไฟล์นี้จงใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาว
  เพื่อรักษา prompt budget; เครื่องหมายขอบเขตและข้อมูลเมตายังคงอยู่
- ระบบจะ parse PDFs เพื่อดึงข้อความก่อน หากพบข้อความน้อย หน้าแรกๆ จะถูก
  rasterize เป็นรูปภาพและส่งให้โมเดล และบล็อกไฟล์ที่ inject จะใช้
  placeholder `[PDF content rendered to images]`

การ parse PDF มาจาก Plugin `document-extract` ที่มาพร้อมระบบ ซึ่งใช้
legacy build ของ `pdfjs-dist` ที่เหมาะกับ Node (ไม่มี worker) ส่วน modern PDF.js build
ต้องการ browser workers/DOM globals จึงไม่ได้ใช้ใน Gateway

ค่าเริ่มต้นของการดึงผ่าน URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (รวมจำนวน parts แบบ URL ของ `input_file` + `input_image` ต่อคำขอ)
- คำขอถูกป้องกันไว้แล้ว (การ resolve DNS, การบล็อก private IP, redirect caps, timeouts)
- รองรับ hostname allowlists แบบทางเลือกต่อ input type (`files.urlAllowlist`, `images.urlAllowlist`)
  - host แบบตรงตัว: `"cdn.example.com"`
  - subdomains แบบ wildcard: `"*.assets.example.com"` (ไม่ตรงกับ apex)
  - allowlists ที่ว่างหรือไม่ระบุ หมายถึงไม่มีข้อจำกัดเรื่อง hostname allowlist
- หากต้องการปิดการดึงข้อมูลแบบ URL ทั้งหมด ให้ตั้ง `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดไฟล์ + รูปภาพ (คอนฟิก)

สามารถปรับค่าเริ่มต้นได้ภายใต้ `gateway.http.endpoints.responses`:

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
- แหล่งข้อมูล `input_image` แบบ HEIC/HEIF จะถูกยอมรับและ normalize เป็น JPEG ก่อนส่งต่อให้ provider

หมายเหตุด้านความปลอดภัย:

- URL allowlists จะถูกบังคับใช้ก่อนดึงข้อมูลและในทุก redirect hop
- การใส่ hostname ลงใน allowlist ไม่ได้ข้ามการบล็อก private/internal IP
- สำหรับ gateways ที่เปิดสู่สาธารณะ ให้ใช้ network egress controls เพิ่มเติมจาก app-level guards
  ดู [Security](/th/gateway/security)

## การสตรีม (SSE)

ตั้ง `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัด event อยู่ในรูป `event: <type>` และ `data: <json>`
- สตรีมจะจบด้วย `data: [DONE]`

ประเภท event ที่ส่งออกในปัจจุบัน:

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

`usage` จะถูกเติมค่าเมื่อ provider ที่อยู่ข้างใต้รายงานจำนวน token
OpenClaw จะ normalize aliases แบบ OpenAI ทั่วไปก่อนที่ตัวนับเหล่านั้นจะไปถึง
พื้นผิว downstream อย่าง status/session รวมถึง `input_tokens` / `output_tokens`
และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้ JSON object รูปแบบนี้:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีทั่วไป:

- `401` ไม่มี auth หรือ auth ไม่ถูกต้อง
- `400` request body ไม่ถูกต้อง
- `405` ใช้ method ไม่ถูกต้อง

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

แบบสตรีม:

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

- [OpenAI chat completions](/th/gateway/openai-http-api)
- [OpenAI](/th/providers/openai)
