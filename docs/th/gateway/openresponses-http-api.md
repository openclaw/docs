---
read_when:
    - การผสานรวมไคลเอนต์ที่สื่อสารผ่าน OpenResponses API
    - คุณต้องการอินพุตแบบรายการ การเรียกใช้เครื่องมือฝั่งไคลเอนต์ หรือเหตุการณ์ SSE
summary: เปิดให้ใช้งาน HTTP endpoint `/v1/responses` ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: API ของ OpenResponses
x-i18n:
    generated_at: "2026-07-20T06:03:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bfd6ca3bf0cecd761fde865b41a95cff3fc5681f74f31b3adae5cd2e0b0be95
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway สามารถให้บริการ endpoint ที่เข้ากันได้กับ OpenResponses ที่ `POST /v1/responses` โดย **ปิดใช้งานเป็นค่าเริ่มต้น** และใช้พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

คำขอจะทำงานเหมือนการเรียกใช้เอเจนต์ Gateway ตามปกติ (ใช้เส้นทางโค้ดเดียวกับ `openclaw agent`) ดังนั้นการกำหนดเส้นทาง สิทธิ์ และการกำหนดค่าจึงตรงกับ Gateway

เปิดหรือปิดใช้งานด้วย `gateway.http.endpoints.responses.enabled` เมื่อเปิดใช้งาน พื้นผิวความเข้ากันได้เดียวกันนี้จะให้บริการ `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` และ `POST /v1/chat/completions` ด้วย

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

ลักษณะการทำงานตรงกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- เส้นทางการยืนยันตัวตนตรงกับ `gateway.auth.mode`: ความลับร่วม (`token`/`password`) ใช้ `Authorization: Bearer <token-or-password>`; พร็อกซีที่เชื่อถือได้ใช้ส่วนหัวพร็อกซีที่รับรู้ข้อมูลประจำตัว (พร็อกซีลูปแบ็กบนโฮสต์เดียวกันต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true` พร้อมทางเลือกสำรองโดยตรงบนโฮสต์เดียวกันผ่าน `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` เมื่อไม่มีส่วนหัว `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); `none` บนทางเข้าของเครือข่ายส่วนตัวไม่ต้องใช้ส่วนหัวการยืนยันตัวตน ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)
- ให้ถือว่า endpoint นี้มีสิทธิ์ผู้ปฏิบัติงานเต็มรูปแบบต่ออินสแตนซ์ Gateway
- โหมดการยืนยันตัวตนด้วยความลับร่วมจะไม่สนใจ `x-openclaw-scopes` ที่ประกาศผ่าน bearer ซึ่งมีขอบเขตแคบกว่า และคืนค่าชุดขอบเขตเริ่มต้นเต็มรูปแบบของผู้ปฏิบัติงาน ได้แก่ `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write` การสนทนาผ่าน endpoint นี้จะถือว่าเป็นการสนทนาจากผู้ส่งที่เป็นเจ้าของ
- โหมด HTTP ที่มีข้อมูลประจำตัวที่เชื่อถือได้ (พร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"`) จะใช้ `x-openclaw-scopes` หากมี มิฉะนั้นจะใช้ชุดขอบเขตเริ่มต้นของผู้ปฏิบัติงานแทน ความหมายเชิงเจ้าของจะสูญหายเฉพาะเมื่อผู้เรียกจำกัดขอบเขตอย่างชัดเจนและไม่ระบุ `operator.admin`
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` หรือส่วนหัว `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เพื่อแทนที่โมเดลแบ็กเอนด์ของเอเจนต์ที่เลือก (ต้องใช้ `operator.admin` บนเส้นทางการยืนยันตัวตนที่มีข้อมูลประจำตัว)
- ใช้ `x-openclaw-session-key` เพื่อกำหนดเส้นทางเซสชันอย่างชัดเจน (จะถูกปฏิเสธด้วย `400 invalid_request_error` หากใช้เนมสเปซที่สงวนไว้ ได้แก่ `subagent:`, `cron:`, `acp:`)
- ใช้ `x-openclaw-message-channel` สำหรับบริบทช่องทางเข้าจำลองที่ไม่ใช่ค่าเริ่มต้น

สำหรับคำอธิบายมาตรฐานเกี่ยวกับโมเดลเป้าหมายของเอเจนต์, `openclaw/default`, การส่ง embeddings ผ่าน และการแทนที่โมเดลแบ็กเอนด์ โปรดดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract)

ดู [ขอบเขตของผู้ปฏิบัติงาน](/th/gateway/operator-scopes) และ [ความปลอดภัย](/th/gateway/security)

## ลักษณะการทำงานของเซสชัน

โดยค่าเริ่มต้น endpoint นี้จะ **ไม่เก็บสถานะระหว่างคำขอ** (ระบบจะสร้างคีย์เซสชันใหม่ในการเรียกแต่ละครั้ง)

หากคำขอมีสตริง OpenResponses `user` Gateway จะสร้างคีย์เซสชันที่คงที่จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้เซสชันเอเจนต์ร่วมกันได้

`previous_response_id` จะใช้เซสชันของการตอบกลับก่อนหน้าอีกครั้งเมื่อคำขอยังคงอยู่ภายในขอบเขตเอเจนต์/ผู้ใช้/เซสชันที่ร้องขอเดียวกัน (จับคู่ด้วยหัวข้อการยืนยันตัวตน รหัสเอเจนต์ และ `x-openclaw-session-key`)

## รูปแบบคำขอ

| ฟิลด์                                                            | การรองรับ                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | สตริงหรืออาร์เรย์ของออบเจ็กต์รายการ                                                                                               |
| `instructions`                                                   | ผสานเข้ากับพรอมต์ระบบ                                                                                                 |
| `tools`                                                          | คำจำกัดความเครื่องมือของไคลเอนต์ (เครื่องมือฟังก์ชัน)                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` หรือ `{ "type": "function", "name": "..." }` เพื่อกรองหรือบังคับใช้เครื่องมือไคลเอนต์                |
| `stream`                                                         | เปิดใช้งานการสตรีม SSE                                                                                                         |
| `max_output_tokens`                                              | ขีดจำกัดเอาต์พุตแบบพยายามอย่างดีที่สุด (ขึ้นอยู่กับผู้ให้บริการ)                                                                                 |
| `temperature`                                                    | ค่าอุณหภูมิการสุ่มตัวอย่างแบบพยายามอย่างดีที่สุด แบ็กเอนด์ Codex Responses ที่ใช้ ChatGPT จะไม่สนใจค่านี้ เนื่องจากใช้การสุ่มตัวอย่างแบบคงที่ฝั่งเซิร์ฟเวอร์ |
| `top_p`                                                          | การสุ่มตัวอย่างแบบนิวเคลียสโดยพยายามอย่างดีที่สุด มีข้อควรระวังของ Codex Responses เช่นเดียวกับ `temperature`                                                    |
| `user`                                                           | การกำหนดเส้นทางเซสชันแบบคงที่                                                                                                        |
| `previous_response_id`                                           | ความต่อเนื่องของเซสชัน (ดูด้านบน)                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | ยอมรับแต่ปัจจุบันไม่ได้นำไปใช้                                                                                                |

## รายการ (อินพุต)

### `message`

บทบาท: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายพรอมต์ระบบ
- รายการ `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น "ข้อความปัจจุบัน"
- ข้อความของผู้ใช้/ผู้ช่วยก่อนหน้านี้จะรวมเป็นประวัติเพื่อใช้เป็นบริบท

### `function_call_output` (เครื่องมือแบบแบ่งเป็นรอบ)

ส่งผลลัพธ์ของเครื่องมือกลับไปยังโมเดล:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` และ `item_reference`

ยอมรับเพื่อความเข้ากันได้ของสคีมา แต่จะไม่นำไปใช้เมื่อสร้างพรอมต์

## เครื่องมือ (เครื่องมือฟังก์ชันฝั่งไคลเอนต์)

ระบุเครื่องมือด้วย `tools: [{ type: "function", name, description?, parameters? }]`

หากเอเจนต์เรียกใช้เครื่องมือ การตอบกลับจะส่งคืนรายการเอาต์พุต `function_call` ส่งคำขอติดตามผลพร้อม `function_call_output` เพื่อดำเนินรอบต่อ

สำหรับ `tool_choice: "required"` และ `tool_choice` ที่ตรึงกับฟังก์ชัน endpoint จะจำกัดชุดเครื่องมือฟังก์ชันของไคลเอนต์ที่เปิดเผย สั่งให้รันไทม์เรียกใช้เครื่องมือไคลเอนต์ก่อนตอบกลับ และปฏิเสธรอบหากไม่มีการเรียกเครื่องมือไคลเอนต์แบบมีโครงสร้างที่ตรงกัน ตามสัญญา `/v1/chat/completions` คำขอแบบไม่สตรีมจะส่งคืน `502` พร้อม `api_error`; คำขอแบบสตรีมจะปล่อยเหตุการณ์ `response.failed`

## รูปภาพ (`input_image`)

รองรับแหล่งที่มาแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

ประเภท MIME ที่อนุญาต (ค่าเริ่มต้น): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif` ขนาดสูงสุด (ค่าเริ่มต้น): 10MB

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

ประเภท MIME ที่อนุญาต (ค่าเริ่มต้น): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf` ขนาดสูงสุด (ค่าเริ่มต้น): 5MB

ลักษณะการทำงานปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มลงใน **พรอมต์ระบบ** ไม่ใช่ข้อความของผู้ใช้ จึงเป็นข้อมูลชั่วคราว (ไม่จัดเก็บไว้ในประวัติเซสชัน)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนเพิ่มเข้าไป ดังนั้นไบต์ของไฟล์จึงถูกถือเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้ บล็อกที่แทรกจะใช้เครื่องหมายขอบเขตอย่างชัดเจน (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) และบรรทัดข้อมูลเมตา `Source: External` โดยตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อรักษางบประมาณพรอมต์ แต่เครื่องหมายขอบเขตและข้อมูลเมตายังคงมีผล
- ระบบจะแยกวิเคราะห์ข้อความจาก PDF ก่อน หากพบข้อความน้อย หน้าแรก ๆ จะถูกแรสเตอร์เป็นรูปภาพและส่งให้โมเดล และบล็อกไฟล์ที่แทรกจะใช้ตัวยึดตำแหน่ง `[PDF content rendered to images]`

การแยกวิเคราะห์ PDF ให้บริการโดย Plugin `document-extract` ที่มาพร้อมระบบ ซึ่งใช้ `clawpdf` และรันไทม์ PDFium WebAssembly ที่รวมอยู่ในแพ็กเกจสำหรับการแยกข้อความและเรนเดอร์หน้า

ค่าเริ่มต้นของการดึงข้อมูล URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (ส่วน `input_file` + `input_image` ที่อิง URL รวมต่อคำขอ)
- คำขอได้รับการป้องกัน (การแก้ชื่อ DNS, การบล็อก IP ส่วนตัว, ขีดจำกัดการเปลี่ยนเส้นทาง, การหมดเวลา)
- รองรับรายการชื่อโฮสต์ที่อนุญาตแบบเลือกใช้สำหรับอินพุตแต่ละประเภท (`files.urlAllowlist`, `images.urlAllowlist`): โฮสต์ที่ตรงกันทุกประการ (`"cdn.example.com"`) หรือโดเมนย่อยแบบไวลด์การ์ด (`"*.assets.example.com"` ซึ่งไม่ตรงกับโดเมนราก) หากรายการที่อนุญาตว่างหรือไม่ได้ระบุ หมายความว่าไม่มีข้อจำกัดจากรายการชื่อโฮสต์ที่อนุญาต
- หากต้องการปิดการดึงข้อมูลผ่าน URL ทั้งหมด ให้ตั้งค่า `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดของไฟล์และรูปภาพ

endpoint ใช้ขีดจำกัดเนื้อหาคำขอในตัวที่ 20 MB นโยบายแหล่งที่มา
ของไฟล์และรูปภาพยังคงกำหนดค่าได้ภายใต้ `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
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
            maxChars: 60000,
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

| คีย์                      | ค่าเริ่มต้น   |
| ------------------------ | --------- |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

แหล่งที่มา HEIC/HEIF `input_image` จะถูกปรับให้เป็น JPEG ก่อนส่งไปยังผู้ให้บริการผ่านตัวประมวลผลรูปภาพที่ใช้ร่วมกันของ OpenClaw (Rastermill) ซึ่งจะใช้ตัวแปลงของระบบ (`sips`, ImageMagick, GraphicsMagick หรือ ffmpeg) เป็นทางเลือกสำรองสำหรับรูปแบบที่ต้องรองรับตัวแปลงสัญญาณภายนอก

หมายเหตุด้านความปลอดภัย: ระบบจะบังคับใช้รายการอนุญาต URL ก่อนดึงข้อมูลและในทุกขั้นตอนของการเปลี่ยนเส้นทาง การอนุญาตชื่อโฮสต์ไม่ได้เป็นการข้ามการบล็อก IP ส่วนตัว/ภายใน สำหรับ Gateway ที่เปิดให้เข้าถึงจากอินเทอร์เน็ต ให้ใช้การควบคุมทราฟฟิกขาออกของเครือข่ายเพิ่มเติมจากมาตรการป้องกันระดับแอป ดู[ความปลอดภัย](/th/gateway/security)

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events:

- `Content-Type: text/event-stream`
- แต่ละบรรทัดของเหตุการณ์คือ `event: <type>` และ `data: <json>`
- สตรีมสิ้นสุดด้วย `data: [DONE]`

ประเภทเหตุการณ์ที่ส่งออกในปัจจุบัน: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (เมื่อเกิดข้อผิดพลาด)

## การใช้งาน

`usage` จะมีข้อมูลเมื่อผู้ให้บริการพื้นฐานรายงานจำนวนโทเค็น OpenClaw จะทำให้ชื่อแทนแบบ OpenAI ที่ใช้ทั่วไปเป็นมาตรฐานก่อนที่ตัวนับเหล่านั้นจะไปถึงส่วนแสดงสถานะ/เซสชันปลายทาง รวมถึง `input_tokens` / `output_tokens` และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้วัตถุ JSON ดังนี้:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีที่พบบ่อย: `400` เนื้อหาคำขอไม่ถูกต้อง, `401` ไม่มีการยืนยันตัวตนหรือการยืนยันตัวตนไม่ถูกต้อง, `403` ไม่มีขอบเขตสิทธิ์ของผู้ดำเนินการ, `405` ใช้เมธอดไม่ถูกต้อง, `429` มีความพยายามยืนยันตัวตนที่ล้มเหลวมากเกินไป (พร้อม `Retry-After`)

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

- [การเติมข้อความแชตของ OpenAI](/th/gateway/openai-http-api)
- [ขอบเขตสิทธิ์ของผู้ดำเนินการ](/th/gateway/operator-scopes)
- [OpenAI](/th/providers/openai)
