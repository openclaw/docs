---
read_when:
    - การผสานรวมเครื่องมือที่ต้องการ OpenAI Chat Completions
summary: เปิดให้ใช้งานเอนด์พอยต์ HTTP /v1/chat/completions ที่เข้ากันได้กับ OpenAI จาก Gateway
title: การเติมเต็มแชทของ OpenAI
x-i18n:
    generated_at: "2026-05-11T20:30:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw สามารถให้บริการ endpoint Chat Completions ขนาดเล็กที่เข้ากันได้กับ OpenAI

endpoint นี้ถูก**ปิดใช้งานตามค่าเริ่มต้น** เปิดใช้งานในการกำหนดค่าก่อน

- `POST /v1/chat/completions`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้งานพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI ของ Gateway แล้ว จะให้บริการสิ่งเหล่านี้ด้วย:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

เบื้องหลัง คำขอจะถูกดำเนินการเป็นการรัน agent ของ Gateway ตามปกติ (codepath เดียวกับ `openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน

ใช้การกำหนดค่า auth ของ Gateway

เส้นทาง auth HTTP ทั่วไป:

- auth แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- auth HTTP แบบ trusted identity-bearing (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่าน proxy ที่รับรู้ identity ตามที่กำหนดค่าไว้ และให้ proxy ใส่
  header ของ identity ที่จำเป็น
- auth แบบเปิดสำหรับ private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง proxy ที่ trusted ซึ่งกำหนดค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกันต้องระบุ
  `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- หากกำหนดค่า `gateway.auth.rateLimit` ไว้และเกิด auth failure มากเกินไป endpoint จะคืนค่า `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิว **full operator-access** สำหรับอินสแตนซ์ gateway

- HTTP bearer auth ที่นี่ไม่ใช่โมเดล scope รายผู้ใช้แบบแคบ
- token/password ของ Gateway ที่ถูกต้องสำหรับ endpoint นี้ควรถูกปฏิบัติเหมือนข้อมูลรับรอง owner/operator
- คำขอรันผ่านเส้นทาง agent ของ control-plane เดียวกับการดำเนินการของ operator ที่ trusted
- ไม่มีขอบเขตเครื่องมือแบบ non-owner/รายผู้ใช้แยกต่างหากบน endpoint นี้; เมื่อผู้เรียกผ่าน auth ของ Gateway ที่นี่แล้ว OpenClaw จะถือว่าผู้เรียกนั้นเป็น operator ที่ trusted สำหรับ gateway นี้
- สำหรับโหมด auth แบบ shared-secret (`token` และ `password`) endpoint จะคืนค่าเริ่มต้น full operator ตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่า
- โหมด HTTP แบบ trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และหากไม่มีจะ fallback ไปยังชุด scope เริ่มต้นของ operator ตามปกติ
- หาก policy ของ agent เป้าหมายอนุญาตเครื่องมือที่ละเอียดอ่อน endpoint นี้สามารถใช้เครื่องมือเหล่านั้นได้
- เก็บ endpoint นี้ไว้บน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงสู่ public internet

เมทริกซ์ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope เริ่มต้นของ operator แบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turn บน endpoint นี้เป็น turn ของ owner-sender
- โหมด HTTP แบบ trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนของ identity ภายนอกที่ trusted หรือขอบเขต deployment บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมี header อยู่
  - fallback ไปยังชุด scope เริ่มต้นของ operator ตามปกติเมื่อไม่มี header
  - จะสูญเสีย semantics ของ owner เฉพาะเมื่อผู้เรียกจำกัด scopes ให้แคบลงอย่างชัดเจนและละเว้น `operator.admin`

ดู [ความปลอดภัย](/th/gateway/security) และ [การเข้าถึงระยะไกล](/th/gateway/remote)

## สัญญาโมเดลแบบ agent-first

OpenClaw ถือว่า field `model` ของ OpenAI เป็น**เป้าหมาย agent** ไม่ใช่ id โมเดล provider ดิบ

- `model: "openclaw"` route ไปยัง agent เริ่มต้นที่กำหนดค่าไว้
- `model: "openclaw/default"` ก็ route ไปยัง agent เริ่มต้นที่กำหนดค่าไว้เช่นกัน
- `model: "openclaw/<agentId>"` route ไปยัง agent ที่ระบุ

header คำขอแบบไม่บังคับ:

- `x-openclaw-model: <provider/model-or-bare-id>` override โมเดล backend สำหรับ agent ที่เลือก
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับเป็น compatibility override
- `x-openclaw-session-key: <sessionKey>` ควบคุม session routing ทั้งหมด
- `x-openclaw-message-channel: <channel>` ตั้งค่า context ช่องทาง ingress สังเคราะห์สำหรับ prompt และ policy ที่รับรู้ channel

compatibility alias ที่ยังยอมรับ:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## การเปิดใช้งาน endpoint

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

## การปิดใช้งาน endpoint

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

## พฤติกรรม session

ตามค่าเริ่มต้น endpoint นี้เป็นแบบ**ไร้สถานะต่อคำขอ** (สร้าง session key ใหม่ในแต่ละ call)

หากคำขอมี string `user` ของ OpenAI Gateway จะ derive session key ที่เสถียรจากค่านั้น เพื่อให้ call ซ้ำสามารถใช้ session ของ agent ร่วมกันได้

## เหตุผลที่พื้นผิวนี้สำคัญ

นี่คือชุดความเข้ากันได้ที่ให้ประโยชน์สูงสุดสำหรับ frontend และ tooling แบบ self-hosted:

- การตั้งค่า Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- client chat ของ OpenAI ที่มีอยู่มักเริ่มต้นด้วย `/v1/chat/completions` ได้
- client ที่เป็น agent-native มากขึ้นเรื่อย ๆ มักชอบ `/v1/responses`

## รายการโมเดลและ agent routing

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    รายการเป้าหมาย agent ของ OpenClaw

    id ที่คืนมาคือรายการ `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
    ใช้รายการเหล่านี้เป็นค่า `model` ของ OpenAI ได้โดยตรง

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    แสดงรายการเป้าหมาย agent ระดับบนสุด ไม่ใช่โมเดล provider backend และไม่ใช่ sub-agent

    sub-agent ยังคงเป็น topology การดำเนินการภายใน จะไม่ปรากฏเป็น pseudo-model

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` คือ alias ที่เสถียรสำหรับ agent เริ่มต้นที่กำหนดค่าไว้

    หมายความว่า client สามารถใช้ id ที่คาดเดาได้หนึ่งตัวต่อไป แม้ว่า id ของ agent เริ่มต้นจริงจะเปลี่ยนระหว่าง environment

  </Accordion>
  <Accordion title="How do I override the backend model?">
    ใช้ `x-openclaw-model`

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากคุณละเว้น header นี้ agent ที่เลือกจะรันด้วยตัวเลือกโมเดลที่กำหนดค่าไว้ตามปกติ

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` ใช้ id `model` แบบ agent-target เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อคุณต้องการโมเดล embedding ที่ระบุ ให้ส่งใน `x-openclaw-model`
    หากไม่มี header นั้น คำขอจะส่งต่อไปยังการตั้งค่า embedding ปกติของ agent ที่เลือก

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัด event คือ `data: <json>`
- stream จบด้วย `data: [DONE]`

## สัญญาเครื่องมือ chat

`/v1/chat/completions` รองรับ subset ของ function-tool ที่เข้ากันได้กับ client OpenAI Chat ทั่วไป

### field คำขอที่รองรับ

- `tools`: array ของ `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- turn ติดตามผล `messages[*].role: "tool"`
- `messages[*].tool_call_id` สำหรับผูกผลลัพธ์เครื่องมือกลับไปยังการเรียกเครื่องมือก่อนหน้า

### variant ที่ไม่รองรับ

endpoint คืนค่า `400 invalid_request_error` สำหรับ variant ของเครื่องมือที่ไม่รองรับ รวมถึง:

- `tools` ที่ไม่ใช่ array
- รายการเครื่องมือที่ไม่ใช่ function
- ขาด `tool.function.name`
- variant ของ `tool_choice` เช่น `allowed_tools` และ `custom`
- `tool_choice: "required"` (ยังไม่ได้บังคับใช้ใน runtime; จะรองรับเมื่อมีการใช้งาน hard enforcement แล้ว)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (เหตุผลเดียวกับ `required`)
- ค่า `tool_choice.function.name` ที่ไม่ตรงกับ `tools` ที่ให้มา

### รูปร่างการตอบกลับเครื่องมือแบบไม่สตรีม

เมื่อ agent ตัดสินใจเรียกเครื่องมือ การตอบกลับจะใช้:

- `choices[0].finish_reason = "tool_calls"`
- รายการ `choices[0].message.tool_calls[]` พร้อม:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON string)

commentary ของ assistant ก่อนการเรียกเครื่องมือจะถูกคืนใน `choices[0].message.content` (อาจว่างได้)

### รูปร่างการตอบกลับเครื่องมือแบบสตรีม

เมื่อ `stream: true` การเรียกเครื่องมือจะถูก emit เป็น chunk SSE แบบ incremental:

- delta role ของ assistant เริ่มต้น
- delta commentary ของ assistant แบบไม่บังคับ
- chunk `delta.tool_calls` หนึ่งรายการหรือมากกว่า ซึ่งมี identity ของเครื่องมือและ fragment ของ argument
- chunk สุดท้ายพร้อม `finish_reason: "tool_calls"`
- `data: [DONE]`

หาก `stream_options.include_usage=true` จะ emit chunk usage ปิดท้ายก่อน `[DONE]`

### loop การติดตามผลของเครื่องมือ

หลังจากได้รับ `tool_calls` แล้ว client ควรดำเนินการ function ที่ร้องขอและส่งคำขอติดตามผลซึ่งรวมถึง:

- ข้อความ tool-call ของ assistant ก่อนหน้า
- ข้อความ `role: "tool"` หนึ่งรายการหรือมากกว่าที่มี `tool_call_id` ตรงกัน

สิ่งนี้ช่วยให้การรัน agent ของ gateway ดำเนิน reasoning loop เดิมต่อไปและสร้างคำตอบสุดท้ายของ assistant

## การตั้งค่า Open WebUI อย่างรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI พื้นฐาน:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL ของ Docker บน macOS: `http://host.docker.internal:18789/v1`
- API key: bearer token ของ Gateway ของคุณ
- Model: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดงรายการ `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id ของโมเดล chat
- หากคุณต้องการ provider/model backend ที่ระบุสำหรับ agent นั้น ให้ตั้งค่าโมเดลเริ่มต้นปกติของ agent หรือส่ง `x-openclaw-model`

smoke แบบเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากคำสั่งนั้นคืนค่า `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย base URL และ token เดียวกัน

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

- `/v1/models` คืนค่าเป้าหมาย agent ของ OpenClaw ไม่ใช่แค็ตตาล็อก provider ดิบ
- `openclaw/default` มีอยู่เสมอเพื่อให้ id ที่เสถียรหนึ่งตัวทำงานข้าม environment ได้
- การ override provider/model backend ควรอยู่ใน `x-openclaw-model` ไม่ใช่ field `model` ของ OpenAI
- `/v1/embeddings` รองรับ `input` เป็น string หรือ array ของ string

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
