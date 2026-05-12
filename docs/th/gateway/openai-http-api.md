---
read_when:
    - การผสานรวมเครื่องมือที่ต้องการ OpenAI Chat Completions
summary: ให้บริการปลายทาง HTTP /v1/chat/completions ที่เข้ากันได้กับ OpenAI จาก Gateway
title: การเติมข้อความแชตของ OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw สามารถให้บริการเอนด์พอยต์ Chat Completions ขนาดเล็กที่เข้ากันได้กับ OpenAI ได้.

เอนด์พอยต์นี้ถูก**ปิดใช้งานโดยค่าเริ่มต้น** เปิดใช้งานในคอนฟิกก่อน.

- `POST /v1/chat/completions`
- พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้งานพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI ของ Gateway แล้ว พื้นผิวนั้นยังให้บริการ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

เบื้องหลัง คำขอจะถูกดำเนินการเป็นการรันเอเจนต์ Gateway ปกติ (codepath เดียวกับ `openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ.

## การยืนยันตัวตน

ใช้คอนฟิกการยืนยันตัวตนของ Gateway.

เส้นทางการยืนยันตัวตน HTTP ที่พบบ่อย:

- การยืนยันตัวตนด้วย shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มี trusted identity (`gateway.auth.mode="trusted-proxy"`):
  route ผ่านพร็อกซีที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และให้พร็อกซีนั้นใส่
  ส่วนหัวตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดสำหรับ private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องมีส่วนหัวการยืนยันตัวตน

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`).
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`).
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่งพร็อกซีที่เชื่อถือได้ซึ่งกำหนดค่าไว้ พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่าอย่างชัดเจน
  `gateway.auth.trustedProxy.allowLoopback = true`.
- หากกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป เอนด์พอยต์จะคืนค่า `429` พร้อม `Retry-After`.

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่าเอนด์พอยต์นี้เป็นพื้นผิว **full operator-access** สำหรับอินสแตนซ์ Gateway.

- การยืนยันตัวตนแบบ HTTP bearer ที่นี่ไม่ใช่โมเดลขอบเขตต่อผู้ใช้แบบแคบ.
- ควรถือว่าโทเค็น/รหัสผ่าน Gateway ที่ถูกต้องสำหรับเอนด์พอยต์นี้เป็นข้อมูลประจำตัวของเจ้าของ/ผู้ปฏิบัติการ.
- คำขอจะรันผ่านเส้นทางเอเจนต์ control-plane เดียวกับการกระทำของผู้ปฏิบัติการที่เชื่อถือได้.
- เอนด์พอยต์นี้ไม่มีขอบเขตเครื่องมือแบบแยกสำหรับ non-owner/ต่อผู้ใช้ เมื่อผู้เรียกผ่านการยืนยันตัวตนของ Gateway ที่นี่แล้ว OpenClaw จะถือว่าผู้เรียกนั้นเป็นผู้ปฏิบัติการที่เชื่อถือได้สำหรับ Gateway นี้.
- สำหรับโหมดการยืนยันตัวตนแบบ shared-secret (`token` และ `password`) เอนด์พอยต์จะคืนค่าเริ่มต้นแบบ full operator ตามปกติ แม้ว่าผู้เรียกจะส่งส่วนหัว `x-openclaw-scopes` ที่แคบกว่ามาก็ตาม.
- โหมด HTTP ที่มี trusted identity (เช่น การยืนยันตัวตนผ่าน trusted proxy หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมี และมิฉะนั้นจะ fallback ไปยังชุดขอบเขตค่าเริ่มต้นของ operator ตามปกติ.
- หากนโยบายเอเจนต์เป้าหมายอนุญาตเครื่องมือที่อ่อนไหว เอนด์พอยต์นี้สามารถใช้เครื่องมือเหล่านั้นได้.
- เก็บเอนด์พอยต์นี้ไว้บน loopback/tailnet/private ingress เท่านั้น อย่าเปิดเผยโดยตรงสู่ public internet.

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุดขอบเขต operator ค่าเริ่มต้นเต็มรูปแบบ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turns บนเอนด์พอยต์นี้เป็น owner-sender turns
- โหมด HTTP ที่มี trusted identity (เช่น การยืนยันตัวตนผ่าน trusted proxy หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตน outer trusted identity หรือขอบเขต deployment บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมีส่วนหัวนี้
  - fallback ไปยังชุดขอบเขตค่าเริ่มต้นของ operator ตามปกติเมื่อไม่มีส่วนหัวนี้
  - จะสูญเสียความหมายแบบ owner ก็ต่อเมื่อผู้เรียกจำกัดขอบเขตอย่างชัดเจนและละเว้น `operator.admin`

ดู [ความปลอดภัย](/th/gateway/security) และ [การเข้าถึงระยะไกล](/th/gateway/remote).

## สัญญาโมเดลแบบยึดเอเจนต์เป็นหลัก

OpenClaw ถือว่าฟิลด์ OpenAI `model` เป็น**เป้าหมายเอเจนต์** ไม่ใช่ id โมเดลของผู้ให้บริการโดยตรง.

- `model: "openclaw"` route ไปยังเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้.
- `model: "openclaw/default"` ก็ route ไปยังเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้เช่นกัน.
- `model: "openclaw/<agentId>"` route ไปยังเอเจนต์เฉพาะ.

ส่วนหัวคำขอที่เลือกได้:

- `x-openclaw-model: <provider/model-or-bare-id>` แทนที่โมเดลแบ็กเอนด์สำหรับเอเจนต์ที่เลือก.
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับเป็นการแทนที่เพื่อความเข้ากันได้.
- `x-openclaw-session-key: <sessionKey>` ควบคุมการ route เซสชันทั้งหมด.
- `x-openclaw-message-channel: <channel>` ตั้งค่าบริบทช่องทาง ingress สังเคราะห์สำหรับพรอมป์และนโยบายที่รับรู้ช่องทาง.

alias เพื่อความเข้ากันได้ที่ยังยอมรับ:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## การเปิดใช้งานเอนด์พอยต์

ตั้งค่า `gateway.http.endpoints.chatCompletions.enabled` เป็น `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## การปิดใช้งานเอนด์พอยต์

ตั้งค่า `gateway.http.endpoints.chatCompletions.enabled` เป็น `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## พฤติกรรมของเซสชัน

โดยค่าเริ่มต้น เอนด์พอยต์นี้เป็นแบบ**ไร้สถานะต่อคำขอ** (สร้าง session key ใหม่ในแต่ละครั้งที่เรียก).

หากคำขอมีสตริง OpenAI `user` Gateway จะสร้าง session key ที่เสถียรจากค่านั้น เพื่อให้การเรียกซ้ำสามารถแชร์เซสชันเอเจนต์ได้.

## เหตุผลที่พื้นผิวนี้สำคัญ

นี่คือชุดความเข้ากันได้ที่ให้ผลคุ้มค่าสูงสุดสำหรับฟรอนต์เอนด์และเครื่องมือที่ self-hosted:

- การตั้งค่า Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`.
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`.
- ไคลเอนต์แชต OpenAI ที่มีอยู่มักเริ่มต้นด้วย `/v1/chat/completions` ได้.
- ไคลเอนต์ที่เป็น agent-native มากขึ้นเรื่อย ๆ มักชอบ `/v1/responses`.

## รายการโมเดลและการ route เอเจนต์

<AccordionGroup>
  <Accordion title="`/v1/models` คืนค่าอะไร?">
    รายการเป้าหมายเอเจนต์ของ OpenClaw.

    id ที่คืนมาคือรายการ `openclaw`, `openclaw/default` และ `openclaw/<agentId>`.
    ใช้ค่าเหล่านี้โดยตรงเป็นค่า OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` แสดงรายการเอเจนต์หรือ sub-agents?">
    แสดงรายการเป้าหมายเอเจนต์ระดับบนสุด ไม่ใช่โมเดลผู้ให้บริการแบ็กเอนด์และไม่ใช่ sub-agents.

    Sub-agents ยังคงเป็น topology การดำเนินการภายใน และจะไม่ปรากฏเป็น pseudo-models.

  </Accordion>
  <Accordion title="ทำไมจึงมี `openclaw/default`?">
    `openclaw/default` คือ alias ที่เสถียรสำหรับเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้.

    นั่นหมายความว่าไคลเอนต์สามารถใช้ id ที่คาดเดาได้ค่าเดียวต่อไป แม้ว่า id เอเจนต์ค่าเริ่มต้นจริงจะเปลี่ยนไปในแต่ละสภาพแวดล้อม.

  </Accordion>
  <Accordion title="ฉันจะแทนที่โมเดลแบ็กเอนด์ได้อย่างไร?">
    ใช้ `x-openclaw-model`.

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากคุณละเว้นค่านี้ เอเจนต์ที่เลือกจะรันด้วยตัวเลือกโมเดลที่กำหนดค่าไว้ตามปกติ.

  </Accordion>
  <Accordion title="embeddings เข้ากับสัญญานี้อย่างไร?">
    `/v1/embeddings` ใช้ id `model` แบบเป้าหมายเอเจนต์เดียวกัน.

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`.
    เมื่อคุณต้องการโมเดล embedding เฉพาะ ให้ส่งใน `x-openclaw-model`.
    หากไม่มีส่วนหัวนั้น คำขอจะส่งผ่านไปยังการตั้งค่า embedding ปกติของเอเจนต์ที่เลือก.

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดเหตุการณ์คือ `data: <json>`
- สตรีมสิ้นสุดด้วย `data: [DONE]`

## สัญญาเครื่องมือแชต

`/v1/chat/completions` รองรับชุดย่อย function-tool ที่เข้ากันได้กับไคลเอนต์ OpenAI Chat ทั่วไป.

### ฟิลด์คำขอที่รองรับ

- `tools`: อาร์เรย์ของ `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` turns ติดตามผล
- `messages[*].tool_call_id` สำหรับผูกผลลัพธ์เครื่องมือกลับไปยังการเรียกเครื่องมือก่อนหน้า
- `max_completion_tokens`: number; ขีดจำกัดต่อการเรียกสำหรับ completion tokens ทั้งหมด (รวม reasoning tokens). ชื่อฟิลด์ OpenAI Chat Completions ปัจจุบัน แนะนำให้ใช้เมื่อส่งทั้ง `max_completion_tokens` และ `max_tokens`.
- `max_tokens`: number; alias แบบ legacy ที่ยอมรับเพื่อความเข้ากันได้ย้อนหลัง จะถูกละเว้นเมื่อมี `max_completion_tokens` อยู่ด้วย.

เมื่อตั้งค่าฟิลด์ใดฟิลด์หนึ่ง ค่าจะถูกส่งต่อไปยังผู้ให้บริการต้นทางผ่านช่องทาง stream-param ของเอเจนต์ ชื่อฟิลด์จริงบน wire ที่ส่งไปยังผู้ให้บริการต้นทางจะถูกเลือกโดย provider transport: `max_completion_tokens` สำหรับเอนด์พอยต์ตระกูล OpenAI และ `max_tokens` สำหรับผู้ให้บริการที่ยอมรับเฉพาะชื่อ legacy เท่านั้น (เช่น Mistral และ Chutes).

### รูปแบบที่ไม่รองรับ

เอนด์พอยต์จะคืนค่า `400 invalid_request_error` สำหรับรูปแบบเครื่องมือที่ไม่รองรับ รวมถึง:

- `tools` ที่ไม่ใช่อาร์เรย์
- รายการเครื่องมือที่ไม่ใช่ function
- ไม่มี `tool.function.name`
- รูปแบบ `tool_choice` เช่น `allowed_tools` และ `custom`
- `tool_choice: "required"` (ยังไม่บังคับใช้ใน runtime; จะรองรับเมื่อมีการใช้งานการบังคับใช้อย่างเข้มงวด)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (เหตุผลเดียวกับ `required`)
- ค่า `tool_choice.function.name` ที่ไม่ตรงกับ `tools` ที่ให้มา

### รูปร่างการตอบกลับเครื่องมือแบบไม่สตรีม

เมื่อเอเจนต์ตัดสินใจเรียกใช้เครื่องมือ การตอบกลับจะใช้:

- `choices[0].finish_reason = "tool_calls"`
- รายการ `choices[0].message.tool_calls[]` พร้อม:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (สตริง JSON)

คำอธิบายของ assistant ก่อนการเรียกเครื่องมือจะถูกคืนใน `choices[0].message.content` (อาจว่างเปล่า).

### รูปร่างการตอบกลับเครื่องมือแบบสตรีม

เมื่อ `stream: true` การเรียกเครื่องมือจะถูกส่งออกเป็นชังก์ SSE แบบเพิ่มทีละส่วน:

- delta บทบาท assistant เริ่มต้น
- delta คำอธิบายของ assistant ที่เลือกได้
- ชังก์ `delta.tool_calls` หนึ่งชิ้นหรือมากกว่า ซึ่งพกพา identity ของเครื่องมือและ fragments ของอาร์กิวเมนต์
- ชังก์สุดท้ายพร้อม `finish_reason: "tool_calls"`
- `data: [DONE]`

หาก `stream_options.include_usage=true` จะส่งชังก์ usage ปิดท้ายก่อน `[DONE]`.

### ลูปติดตามผลของเครื่องมือ

หลังจากได้รับ `tool_calls` ไคลเอนต์ควรดำเนินการฟังก์ชันที่ร้องขอ แล้วส่งคำขอติดตามผลที่มี:

- ข้อความ tool-call ของ assistant ก่อนหน้า
- ข้อความ `role: "tool"` หนึ่งรายการหรือมากกว่าพร้อม `tool_call_id` ที่ตรงกัน

สิ่งนี้ช่วยให้การรันเอเจนต์ Gateway ดำเนินลูป reasoning เดิมต่อและสร้างคำตอบ assistant สุดท้ายได้.

## การตั้งค่า Open WebUI อย่างรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI พื้นฐาน:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker บน macOS base URL: `http://host.docker.internal:18789/v1`
- API key: โทเค็น bearer ของ Gateway ของคุณ
- Model: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดงรายการ `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id โมเดลแชต
- หากคุณต้องการผู้ให้บริการ/โมเดลแบ็กเอนด์เฉพาะสำหรับเอเจนต์นั้น ให้ตั้งค่าโมเดลค่าเริ่มต้นปกติของเอเจนต์ หรือส่ง `x-openclaw-model`

Quick smoke:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากคำสั่งนั้นคืนค่า `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย base URL และโทเค็นเดียวกัน.

## ตัวอย่าง

แบบไม่สตรีม:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

แบบสตรีม:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

แสดงรายการโมเดล:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

ดึงข้อมูลโมเดลหนึ่งรายการ:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

สร้าง embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

หมายเหตุ:

- `/v1/models` ส่งคืนเป้าหมายเอเจนต์ของ OpenClaw ไม่ใช่แค็ตตาล็อกผู้ให้บริการดิบ
- `openclaw/default` มีอยู่เสมอ เพื่อให้ ID ที่เสถียรหนึ่งรายการใช้งานได้ข้ามสภาพแวดล้อม
- การแทนที่ผู้ให้บริการ/โมเดลของแบ็กเอนด์ควรอยู่ใน `x-openclaw-model` ไม่ใช่ฟิลด์ `model` ของ OpenAI
- `/v1/embeddings` รองรับ `input` เป็นสตริงหรืออาร์เรย์ของสตริง

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
