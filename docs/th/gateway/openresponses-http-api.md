---
read_when:
    - การผสานรวมไคลเอนต์ที่สื่อสารด้วย OpenResponses API
    - คุณต้องการอินพุตแบบรายการ การเรียกใช้เครื่องมือฝั่งไคลเอนต์ หรือเหตุการณ์ SSE
summary: เปิดเผยปลายทาง HTTP `/v1/responses` ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T16:07:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway สามารถให้บริการเอนด์พอยต์ `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses โดยเอนด์พอยต์นี้ **ปิดใช้งานโดยค่าเริ่มต้น** และใช้พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

คำขอจะทำงานในรูปแบบการรันเอเจนต์ Gateway ตามปกติ (ใช้เส้นทางโค้ดเดียวกับ `openclaw agent`) ดังนั้นการกำหนดเส้นทาง สิทธิ์ และการกำหนดค่าจึงตรงกับ Gateway ของคุณ

เปิดหรือปิดใช้งานด้วย `gateway.http.endpoints.responses.enabled` เมื่อเปิดใช้งาน พื้นผิวความเข้ากันได้เดียวกันนี้จะให้บริการ `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` และ `POST /v1/chat/completions` ด้วย

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

ลักษณะการทำงานสอดคล้องกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- เส้นทางการยืนยันตัวตนสอดคล้องกับ `gateway.auth.mode`: แบบข้อมูลลับที่ใช้ร่วมกัน (`token`/`password`) ใช้ `Authorization: Bearer <token-or-password>`; แบบพร็อกซีที่เชื่อถือใช้ส่วนหัวของพร็อกซีที่รับรู้ข้อมูลประจำตัว (พร็อกซี local loopback บนโฮสต์เดียวกันต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true` พร้อมทางเลือกสำรองสำหรับการเชื่อมต่อโดยตรงบนโฮสต์เดียวกันผ่าน `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` เมื่อไม่มีส่วนหัว `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); `none` บนช่องทางขาเข้าส่วนตัวไม่ต้องใช้ส่วนหัวการยืนยันตัวตน ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือ](/th/gateway/trusted-proxy-auth)
- ให้ถือว่าเอนด์พอยต์นี้มีสิทธิ์ผู้ควบคุมอย่างเต็มรูปแบบสำหรับอินสแตนซ์ Gateway
- โหมดการยืนยันตัวตนแบบข้อมูลลับที่ใช้ร่วมกันจะไม่สนใจ `x-openclaw-scopes` ที่ประกาศผ่าน bearer ซึ่งมีขอบเขตแคบกว่า และคืนค่าชุดขอบเขตผู้ควบคุมเริ่มต้นแบบเต็ม ได้แก่ `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write` รอบการสนทนาบนเอนด์พอยต์นี้จะถือว่าเป็นรอบที่ส่งโดยเจ้าของ
- โหมด HTTP ที่มีข้อมูลประจำตัวที่เชื่อถือ (พร็อกซีที่เชื่อถือ หรือ `gateway.auth.mode="none"`) จะใช้ `x-openclaw-scopes` หากมี มิฉะนั้นจะใช้ชุดขอบเขตผู้ควบคุมเริ่มต้นเป็นทางเลือกสำรอง ความหมายของการเป็นเจ้าของจะสูญหายเฉพาะเมื่อผู้เรียกจำกัดขอบเขตอย่างชัดเจนและไม่รวม `operator.admin`
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` หรือส่วนหัว `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เพื่อแทนที่โมเดลแบ็กเอนด์ของเอเจนต์ที่เลือก (ต้องมี `operator.admin` บนเส้นทางการยืนยันตัวตนที่มีข้อมูลประจำตัว)
- ใช้ `x-openclaw-session-key` เพื่อกำหนดเส้นทางเซสชันอย่างชัดเจน (จะถูกปฏิเสธด้วย `400 invalid_request_error` หากใช้เนมสเปซที่สงวนไว้ ได้แก่ `subagent:`, `cron:`, `acp:`)
- ใช้ `x-openclaw-message-channel` สำหรับบริบทช่องทางขาเข้าสังเคราะห์ที่ไม่ใช่ค่าเริ่มต้น

สำหรับคำอธิบายมาตรฐานเกี่ยวกับโมเดลที่กำหนดเป้าหมายเอเจนต์, `openclaw/default`, การส่งต่อ embeddings และการแทนที่โมเดลแบ็กเอนด์ โปรดดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract)

ดู [ขอบเขตผู้ควบคุม](/th/gateway/operator-scopes) และ [ความปลอดภัย](/th/gateway/security)

## ลักษณะการทำงานของเซสชัน

โดยค่าเริ่มต้น เอนด์พอยต์นี้ **ไม่เก็บสถานะสำหรับแต่ละคำขอ** (ระบบจะสร้างคีย์เซสชันใหม่ในแต่ละครั้งที่เรียก)

หากคำขอมีสตริง OpenResponses `user` Gateway จะสร้างคีย์เซสชันแบบคงที่จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้เซสชันเอเจนต์ร่วมกันได้

`previous_response_id` จะนำเซสชันของการตอบกลับก่อนหน้ากลับมาใช้ เมื่อคำขอยังคงอยู่ภายในขอบเขตเอเจนต์/ผู้ใช้/เซสชันที่ร้องขอเดียวกัน (จับคู่ด้วยประธานการยืนยันตัวตน รหัสเอเจนต์ และ `x-openclaw-session-key`)

## รูปแบบคำขอ

| ฟิลด์                                                            | การรองรับ                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | สตริงหรืออาร์เรย์ของออบเจ็กต์รายการ                                                                                               |
| `instructions`                                                   | ผสานเข้ากับพรอมต์ระบบ                                                                                                 |
| `tools`                                                          | ข้อกำหนดเครื่องมือของไคลเอนต์ (เครื่องมือฟังก์ชัน)                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` หรือ `{ "type": "function", "name": "..." }` เพื่อกรองหรือบังคับใช้เครื่องมือของไคลเอนต์                |
| `stream`                                                         | เปิดใช้งานการสตรีม SSE                                                                                                         |
| `max_output_tokens`                                              | ขีดจำกัดเอาต์พุตแบบพยายามให้ดีที่สุด (ขึ้นอยู่กับผู้ให้บริการ)                                                                                 |
| `temperature`                                                    | ค่าอุณหภูมิการสุ่มตัวอย่างแบบพยายามให้ดีที่สุด แบ็กเอนด์ Codex Responses ที่ใช้ ChatGPT จะไม่สนใจค่านี้ เนื่องจากใช้การสุ่มตัวอย่างคงที่ฝั่งเซิร์ฟเวอร์ |
| `top_p`                                                          | การสุ่มตัวอย่างแบบนิวเคลียสโดยพยายามให้ดีที่สุด มีข้อควรระวังของ Codex Responses เช่นเดียวกับ `temperature`                                                    |
| `user`                                                           | การกำหนดเส้นทางเซสชันแบบคงที่                                                                                                        |
| `previous_response_id`                                           | ความต่อเนื่องของเซสชัน (ดูด้านบน)                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | ยอมรับค่า แต่ขณะนี้ยังไม่ได้นำไปใช้                                                                                                |

## รายการ (`input`)

### `message`

บทบาท: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายพรอมต์ระบบ
- รายการ `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น "ข้อความปัจจุบัน"
- ข้อความของผู้ใช้/ผู้ช่วยก่อนหน้าจะรวมเป็นประวัติเพื่อใช้เป็นบริบท

### `function_call_output` (เครื่องมือแบบแบ่งตามรอบ)

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

หากเอเจนต์เรียกใช้เครื่องมือ การตอบกลับจะส่งคืนรายการเอาต์พุต `function_call` ส่งคำขอต่อเนื่องพร้อม `function_call_output` เพื่อดำเนินรอบต่อไป

สำหรับ `tool_choice: "required"` และ `tool_choice` ที่ตรึงฟังก์ชัน เอนด์พอยต์จะจำกัดชุดเครื่องมือฟังก์ชันของไคลเอนต์ที่เปิดเผย สั่งให้รันไทม์เรียกเครื่องมือของไคลเอนต์ก่อนตอบกลับ และปฏิเสธรอบหากไม่มีการเรียกเครื่องมือของไคลเอนต์แบบมีโครงสร้างที่ตรงกัน ซึ่งสอดคล้องกับสัญญาของ `/v1/chat/completions` คำขอที่ไม่สตรีมจะส่งคืน `502` พร้อม `api_error`; คำขอแบบสตรีมจะส่งเหตุการณ์ `response.failed`

## รูปภาพ (`input_image`)

รองรับแหล่งข้อมูลแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

ประเภท MIME ที่อนุญาต (ค่าเริ่มต้น): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif` ขนาดสูงสุด (ค่าเริ่มต้น): 10MB

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

ประเภท MIME ที่อนุญาต (ค่าเริ่มต้น): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf` ขนาดสูงสุด (ค่าเริ่มต้น): 5MB

ลักษณะการทำงานปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มลงใน **พรอมต์ระบบ** ไม่ใช่ข้อความของผู้ใช้ จึงคงอยู่เพียงชั่วคราว (ไม่ถูกบันทึกไว้ในประวัติเซสชัน)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกครอบเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนเพิ่มเข้าไป เพื่อให้ไบต์ของไฟล์ถูกมองเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้ บล็อกที่แทรกจะใช้เครื่องหมายขอบเขตอย่างชัดเจน (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) และบรรทัดข้อมูลเมตา `Source: External` โดยจงใจละแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อรักษางบประมาณพรอมต์ แต่เครื่องหมายขอบเขตและข้อมูลเมตายังคงมีผล
- ระบบจะแยกวิเคราะห์ข้อความจาก PDF ก่อน หากพบข้อความน้อย หน้าแรก ๆ จะถูกแรสเตอร์เป็นรูปภาพและส่งให้โมเดล และบล็อกไฟล์ที่แทรกจะใช้ตัวยึดตำแหน่ง `[PDF content rendered to images]`

การแยกวิเคราะห์ PDF ให้บริการโดย Plugin `document-extract` ที่รวมมาให้ ซึ่งใช้ `clawpdf` และรันไทม์ PDFium WebAssembly ที่บรรจุมาด้วยสำหรับการแยกข้อความและการเรนเดอร์หน้า

ค่าเริ่มต้นของการดึงข้อมูลจาก URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (จำนวนส่วน `input_file` + `input_image` ที่อิง URL รวมต่อคำขอ)
- คำขอได้รับการป้องกัน (การแปลงชื่อ DNS, การบล็อก IP ส่วนตัว, ขีดจำกัดการเปลี่ยนเส้นทาง, การหมดเวลา)
- รองรับรายการชื่อโฮสต์ที่อนุญาตซึ่งกำหนดหรือไม่ก็ได้สำหรับอินพุตแต่ละประเภท (`files.urlAllowlist`, `images.urlAllowlist`): โฮสต์แบบตรงทั้งหมด (`"cdn.example.com"`) หรือโดเมนย่อยแบบไวลด์การ์ด (`"*.assets.example.com"` ซึ่งไม่ตรงกับโดเมนราก) รายการที่ว่างหรือไม่ได้ระบุหมายถึงไม่มีข้อจำกัดจากรายการชื่อโฮสต์ที่อนุญาต
- หากต้องการปิดการดึงข้อมูลผ่าน URL ทั้งหมด ให้ตั้งค่า `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดไฟล์และรูปภาพ (การกำหนดค่า)

สามารถปรับค่าเริ่มต้นภายใต้ `gateway.http.endpoints.responses`:

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

ค่าเริ่มต้นเมื่อไม่ได้ระบุ:

| คีย์                      | ค่าเริ่มต้น   |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
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

แหล่งข้อมูล `input_image` แบบ HEIC/HEIF จะถูกแปลงเป็น JPEG ก่อนส่งให้ผู้ให้บริการผ่านตัวประมวลผลรูปภาพที่ใช้ร่วมกันของ OpenClaw (Rastermill) ซึ่งจะใช้ตัวแปลงของระบบ (`sips`, ImageMagick, GraphicsMagick หรือ ffmpeg) เป็นทางเลือกสำรองสำหรับรูปแบบที่ต้องรองรับโคเดกภายนอก

หมายเหตุด้านความปลอดภัย: รายการ URL ที่อนุญาตจะถูกบังคับใช้ก่อนดึงข้อมูลและในแต่ละช่วงของการเปลี่ยนเส้นทาง การอนุญาตชื่อโฮสต์ไม่ได้ข้ามการบล็อก IP ส่วนตัว/ภายใน สำหรับ Gateway ที่เปิดให้เข้าถึงจากอินเทอร์เน็ต ให้ใช้การควบคุมทราฟฟิกเครือข่ายขาออกร่วมกับกลไกป้องกันระดับแอปพลิเคชัน ดู [ความปลอดภัย](/th/gateway/security)

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events:

- `Content-Type: text/event-stream`
- แต่ละบรรทัดของเหตุการณ์อยู่ในรูปแบบ `event: <type>` และ `data: <json>`
- สตรีมสิ้นสุดด้วย `data: [DONE]`

ประเภทเหตุการณ์ที่ส่งออกในปัจจุบัน ได้แก่ `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (เมื่อเกิดข้อผิดพลาด)

## การใช้งาน

`usage` จะมีข้อมูลเมื่อผู้ให้บริการเบื้องหลังรายงานจำนวนโทเค็น OpenClaw จะปรับชื่อแทนที่ใช้กันทั่วไปในรูปแบบ OpenAI ให้เป็นมาตรฐานก่อนที่ตัวนับเหล่านั้นจะส่งต่อไปยังส่วนแสดงสถานะ/เซสชันปลายทาง รวมถึง `input_tokens` / `output_tokens` และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้วัตถุ JSON ในลักษณะดังนี้:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีทั่วไป: `400` เนื้อหาคำขอไม่ถูกต้อง, `401` ไม่มีข้อมูลยืนยันตัวตนหรือข้อมูลไม่ถูกต้อง, `403` ไม่มีขอบเขตสิทธิ์ของผู้ดำเนินการ, `405` ใช้เมธอดไม่ถูกต้อง, `429` มีความพยายามยืนยันตัวตนที่ล้มเหลวมากเกินไป (พร้อม `Retry-After`)

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

## เนื้อหาที่เกี่ยวข้อง

- [การเติมข้อความแชตของ OpenAI](/th/gateway/openai-http-api)
- [ขอบเขตสิทธิ์ของผู้ดำเนินการ](/th/gateway/operator-scopes)
- [OpenAI](/th/providers/openai)
