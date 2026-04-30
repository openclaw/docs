---
read_when:
    - การผสานรวมไคลเอนต์ที่สื่อสารด้วย OpenResponses API
    - คุณต้องการอินพุตแบบรายการ การเรียกใช้เครื่องมือของไคลเอนต์ หรือเหตุการณ์ SSE
summary: เปิดเผยปลายทาง HTTP /v1/responses ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: API ของ OpenResponses
x-i18n:
    generated_at: "2026-04-30T09:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw สามารถให้บริการ endpoint `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses

endpoint นี้ **ปิดใช้งานตามค่าเริ่มต้น** ให้เปิดใช้งานใน config ก่อน

- `POST /v1/responses`
- พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

ภายใน คำขอจะถูกดำเนินการเป็นการรัน agent ของ Gateway ตามปกติ (codepath เดียวกับ
`openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ

## การตรวจสอบสิทธิ์ ความปลอดภัย และการกำหนดเส้นทาง

พฤติกรรมการทำงานตรงกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- ใช้เส้นทางตรวจสอบสิทธิ์ HTTP ของ Gateway ที่ตรงกัน:
  - การตรวจสอบสิทธิ์แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
  - การตรวจสอบสิทธิ์แบบ trusted-proxy (`gateway.auth.mode="trusted-proxy"`): proxy header ที่รับรู้ตัวตนจากแหล่ง trusted proxy ที่กำหนดค่าไว้; proxy แบบ same-host loopback ต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
  - การตรวจสอบสิทธิ์แบบเปิดสำหรับ private-ingress (`gateway.auth.mode="none"`): ไม่มี auth header
- ถือว่า endpoint นี้มีสิทธิ์เข้าถึงระดับ operator เต็มรูปแบบสำหรับอินสแตนซ์ gateway
- สำหรับโหมดตรวจสอบสิทธิ์แบบ shared-secret (`token` และ `password`) ให้ละเว้นค่า `x-openclaw-scopes` ที่ประกาศโดย bearer ซึ่งแคบกว่า และกู้คืนค่าเริ่มต้น operator เต็มรูปแบบตามปกติ
- สำหรับโหมด HTTP ที่มี trusted identity (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) ให้ใช้ `x-openclaw-scopes` เมื่อมี และมิฉะนั้นให้กลับไปใช้ชุด scope เริ่มต้นของ operator ตามปกติ
- เลือก agent ด้วย `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` หรือ `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เมื่อต้องการ override backend model ของ agent ที่เลือก
- ใช้ `x-openclaw-session-key` สำหรับการกำหนดเส้นทาง session อย่างชัดเจน
- ใช้ `x-openclaw-message-channel` เมื่อต้องการบริบท synthetic ingress channel ที่ไม่ใช่ค่าเริ่มต้น

เมทริกซ์การตรวจสอบสิทธิ์:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ละเว้น `x-openclaw-scopes` ที่แคบกว่า
  - กู้คืนชุด scope operator เริ่มต้นเต็มรูปแบบ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turn บน endpoint นี้เป็น turn แบบ owner-sender
- โหมด HTTP ที่มี trusted identity (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ใช้ `x-openclaw-scopes` เมื่อมี header นี้
  - กลับไปใช้ชุด scope เริ่มต้นของ operator ตามปกติเมื่อไม่มี header นี้
  - สูญเสีย owner semantics เฉพาะเมื่อ caller ลด scopes อย่างชัดเจนและละเว้น `operator.admin`

เปิดหรือปิด endpoint นี้ด้วย `gateway.http.endpoints.responses.enabled`

พื้นผิวความเข้ากันได้เดียวกันยังรวมถึง:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

สำหรับคำอธิบายตามหลักว่ารูปแบบ agent-target models, `openclaw/default`, embeddings pass-through และ backend model overrides ทำงานร่วมกันอย่างไร ดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract) และ [รายการ model และการกำหนดเส้นทาง agent](/th/gateway/openai-http-api#model-list-and-agent-routing)

## พฤติกรรมของ session

ตามค่าเริ่มต้น endpoint นี้เป็นแบบ **stateless ต่อคำขอ** (สร้าง session key ใหม่ในแต่ละครั้งที่เรียก)

หากคำขอมีสตริง `user` ของ OpenResponses, Gateway จะสร้าง session key ที่คงที่
จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้ agent session ร่วมกันได้

## รูปแบบคำขอ (รองรับ)

คำขอทำตาม OpenResponses API พร้อม input แบบ item-based การรองรับปัจจุบัน:

- `input`: สตริงหรือ array ของ object item
- `instructions`: รวมเข้าใน system prompt
- `tools`: นิยาม tool ฝั่ง client (function tools)
- `tool_choice`: กรองหรือบังคับใช้ client tools
- `stream`: เปิดใช้งาน SSE streaming
- `max_output_tokens`: ขีดจำกัด output แบบ best-effort (ขึ้นกับ provider)
- `user`: การกำหนดเส้นทาง session ที่คงที่

ยอมรับแต่ **ปัจจุบันละเว้น**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

รองรับ:

- `previous_response_id`: OpenClaw จะนำ response session ก่อนหน้ากลับมาใช้เมื่อคำขอยังคงอยู่ภายใน scope เดียวกันของ agent/user/requested-session

## Items (input)

### `message`

Roles: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายไปยัง system prompt
- item `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น “current message”
- ข้อความ user/assistant ก่อนหน้าจะรวมเป็น history สำหรับบริบท

### `function_call_output` (tools แบบ turn-based)

ส่งผลลัพธ์ tool กลับไปยัง model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` และ `item_reference`

ยอมรับเพื่อความเข้ากันได้ของ schema แต่จะละเว้นเมื่อสร้าง prompt

## Tools (client-side function tools)

ระบุ tools ด้วย `tools: [{ type: "function", function: { name, description?, parameters? } }]`

หาก agent ตัดสินใจเรียก tool, response จะคืน item output แบบ `function_call`
จากนั้นคุณส่งคำขอติดตามผลพร้อม `function_call_output` เพื่อดำเนิน turn ต่อ

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

พฤติกรรมปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มไปยัง **system prompt** ไม่ใช่ข้อความ user
  ดังนั้นจึงคงเป็นแบบ ephemeral (ไม่ persist ใน session history)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนเพิ่มเข้าไป
  ดังนั้น bytes ของไฟล์จึงถูกปฏิบัติเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้
- block ที่ inject ใช้ marker ขอบเขตชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัด metadata
  `Source: External`
- เส้นทาง file-input นี้จงใจละเว้น banner `SECURITY NOTICE:` แบบยาวเพื่อ
  รักษางบประมาณ prompt; marker ขอบเขตและ metadata ยังคงอยู่ครบ
- PDF จะถูกแยกข้อความก่อน หากพบข้อความน้อย หน้าแรก ๆ จะถูก
  rasterize เป็นรูปภาพและส่งไปยัง model และ block ไฟล์ที่ inject จะใช้
  placeholder `[PDF content rendered to images]`

การ parse PDF จัดหาโดย Plugin `document-extract` ที่รวมมาให้ ซึ่งใช้
legacy build ของ `pdfjs-dist` ที่เป็นมิตรกับ Node (ไม่มี worker) build PDF.js สมัยใหม่
คาดหวัง browser workers/DOM globals ดังนั้นจึงไม่ได้ใช้ใน Gateway

ค่าเริ่มต้นการ fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (จำนวนส่วน `input_file` + `input_image` ที่อิง URL รวมต่อคำขอ)
- คำขอมี guard ป้องกัน (การ resolve DNS, การบล็อก private IP, เพดาน redirect, timeout)
- รองรับ hostname allowlists แบบเลือกได้ต่อชนิด input (`files.urlAllowlist`, `images.urlAllowlist`)
  - host แบบตรงตัว: `"cdn.example.com"`
  - wildcard subdomains: `"*.assets.example.com"` (ไม่ match apex)
  - allowlists ที่ว่างหรือละเว้นหมายถึงไม่มีข้อจำกัด hostname allowlist
- หากต้องการปิดการ fetch ที่อิง URL ทั้งหมด ให้ตั้งค่า `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดไฟล์ + รูปภาพ (config)

ค่าเริ่มต้นสามารถปรับได้ภายใต้ `gateway.http.endpoints.responses`:

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

ค่าเริ่มต้นเมื่อไม่ได้ระบุ:

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
- แหล่ง `input_image` แบบ HEIC/HEIF จะถูกยอมรับและ normalize เป็น JPEG ก่อนส่งให้ provider

หมายเหตุด้านความปลอดภัย:

- URL allowlists จะถูกบังคับใช้ก่อน fetch และบน redirect hops
- การ allowlist hostname ไม่ได้ bypass การบล็อก private/internal IP
- สำหรับ gateways ที่เปิดสู่ internet ให้ใช้การควบคุม network egress เพิ่มเติมจาก guard ระดับแอป
  ดู [ความปลอดภัย](/th/gateway/security)

## Streaming (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัด event คือ `event: <type>` และ `data: <json>`
- stream จบด้วย `data: [DONE]`

ชนิด event ที่ปล่อยออกในปัจจุบัน:

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

`usage` จะถูกเติมเมื่อ provider พื้นฐานรายงานจำนวน token
OpenClaw normalize alias แบบ OpenAI ทั่วไปก่อนที่ counter เหล่านั้นจะไปถึง
พื้นผิวสถานะ/session downstream รวมถึง `input_tokens` / `output_tokens`
และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้ JSON object เช่น:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีทั่วไป:

- `401` auth หายไป/ไม่ถูกต้อง
- `400` request body ไม่ถูกต้อง
- `405` method ผิด

## ตัวอย่าง

ไม่ streaming:

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

Streaming:

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
