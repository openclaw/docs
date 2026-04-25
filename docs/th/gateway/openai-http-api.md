---
read_when:
    - การผสานรวมเครื่องมือที่คาดหวัง OpenAI Chat Completions
summary: เปิดเผยปลายทาง HTTP `/v1/chat/completions` ที่เข้ากันได้กับ OpenAI จาก Gateway
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-25T13:48:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

Gateway ของ OpenClaw สามารถให้บริการปลายทาง Chat Completions ขนาดเล็กที่เข้ากันได้กับ OpenAI

ปลายทางนี้ **ปิดใช้งานเป็นค่าเริ่มต้น** ต้องเปิดใช้ในการกำหนดค่าก่อน

- `POST /v1/chat/completions`
- ใช้พอร์ตเดียวกับ Gateway (มัลติเพล็กซ์ WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้พื้นผิว HTTP ที่เข้ากันได้กับ OpenAI ของ Gateway แล้ว ระบบจะให้บริการด้วย:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

ภายใต้ระบบ คำขอจะถูกรันเป็นการรัน Agent ของ Gateway ตามปกติ (เส้นทางโค้ดเดียวกับ `openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์/การกำหนดค่าจึงตรงกับ Gateway ของคุณ

## การยืนยันตัวตน

ใช้การกำหนดค่าการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ที่ใช้บ่อย:

- การยืนยันตัวตนด้วย shared secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP แบบมี identity ที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่าน proxy ที่รองรับ identity ตามที่กำหนด และให้มัน inject
  identity header ที่จำเป็น
- การยืนยันตัวตนแบบ open สำหรับ private ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  trusted proxy source แบบ non-loopback ที่กำหนดไว้; proxy แบบ loopback บนโฮสต์เดียวกัน
  ไม่ผ่านเงื่อนไขของโหมดนี้
- หากมีการกำหนด `gateway.auth.rateLimit` และเกิดความล้มเหลวด้านการยืนยันตัวตนมากเกินไป ปลายทางจะส่งกลับ `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่าปลายทางนี้เป็นพื้นผิว **การเข้าถึงระดับ operator แบบเต็ม** สำหรับอินสแตนซ์ gateway นี้

- bearer auth ผ่าน HTTP ที่นี่ไม่ใช่โมเดลขอบเขตแบบแคบต่อผู้ใช้
- token/password ของ Gateway ที่ใช้ได้กับปลายทางนี้ควรถูกมองว่าเป็นข้อมูลรับรองของ owner/operator
- คำขอจะวิ่งผ่านเส้นทาง Agent ของ control plane เดียวกับการกระทำของ operator ที่เชื่อถือได้
- ไม่มีขอบเขตเครื่องมือแยกต่างหากแบบ non-owner/per-user บนปลายทางนี้; เมื่อผู้เรียกผ่านการยืนยันตัวตนของ Gateway ได้แล้ว OpenClaw จะถือว่าผู้เรียกนั้นเป็น operator ที่เชื่อถือได้สำหรับ gateway นี้
- สำหรับโหมดการยืนยันตัวตนแบบ shared secret (`token` และ `password`) ปลายทางจะกู้คืนค่าเริ่มต้น operator แบบเต็มตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่ามาก็ตาม
- โหมด HTTP แบบมี identity ที่เชื่อถือได้ (ตัวอย่างเช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) จะยอมรับ `x-openclaw-scopes` เมื่อมี header นี้ และมิฉะนั้นจะ fallback ไปยังชุด scope operator เริ่มต้นตามปกติ
- หากนโยบายของ Agent เป้าหมายอนุญาตเครื่องมือที่อ่อนไหว ปลายทางนี้ก็สามารถใช้เครื่องมือเหล่านั้นได้
- ควรเก็บปลายทางนี้ไว้บน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยออกสู่อินเทอร์เน็ตสาธารณะโดยตรง

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - กู้คืนชุด scope operator เริ่มต้นแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่าเทิร์นแชตบนปลายทางนี้เป็นเทิร์นจากผู้ส่งแบบ owner
- โหมด HTTP แบบมี identity ที่เชื่อถือได้ (ตัวอย่างเช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนของ identity ภายนอกหรือขอบเขต deployment ที่เชื่อถือได้
  - ยอมรับ `x-openclaw-scopes` เมื่อมี header นี้
  - fallback ไปยังชุด scope operator เริ่มต้นตามปกติเมื่อไม่มี header
  - จะสูญเสียความหมายแบบ owner เฉพาะเมื่อผู้เรียกจำกัด scope ลงอย่างชัดเจนและไม่ระบุ `operator.admin`

ดู [Security](/th/gateway/security) และ [Remote access](/th/gateway/remote)

## สัญญา model แบบ agent-first

OpenClaw มองฟิลด์ `model` ของ OpenAI เป็น **เป้าหมายของ Agent** ไม่ใช่ id ของโมเดลผู้ให้บริการแบบดิบ

- `model: "openclaw"` จะกำหนดเส้นทางไปยัง Agent เริ่มต้นที่กำหนดไว้
- `model: "openclaw/default"` ก็จะกำหนดเส้นทางไปยัง Agent เริ่มต้นที่กำหนดไว้เช่นกัน
- `model: "openclaw/<agentId>"` จะกำหนดเส้นทางไปยัง Agent ที่ระบุ

request header แบบไม่บังคับ:

- `x-openclaw-model: <provider/model-or-bare-id>` เขียนทับโมเดลแบ็กเอนด์สำหรับ Agent ที่เลือก
- `x-openclaw-agent-id: <agentId>` ยังรองรับในฐานะการเขียนทับเพื่อความเข้ากันได้
- `x-openclaw-session-key: <sessionKey>` ควบคุมการกำหนดเส้นทางเซสชันแบบเต็ม
- `x-openclaw-message-channel: <channel>` ตั้งค่าบริบท synthetic ingress channel สำหรับ prompt และนโยบายที่รับรู้ช่องทาง

ยังยอมรับ compatibility alias:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## การเปิดใช้ปลายทาง

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

## การปิดใช้ปลายทาง

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

โดยค่าเริ่มต้น ปลายทางนี้จะ **stateless ต่อคำขอ** (มีการสร้าง session key ใหม่ทุกครั้งที่เรียก)

หากคำขอมีสตริง `user` ของ OpenAI อยู่ด้วย Gateway จะสร้าง session key ที่เสถียรจากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้เซสชันของ Agent ร่วมกันได้

## ทำไมพื้นผิวนี้จึงสำคัญ

นี่คือชุดความเข้ากันได้ที่ให้ประโยชน์สูงสุดสำหรับ frontend และเครื่องมือแบบ self-hosted:

- การตั้งค่า Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แชต OpenAI ที่มีอยู่มักเริ่มต้นได้ด้วย `/v1/chat/completions`
- ไคลเอนต์ที่เป็น agent-native มากขึ้นเรื่อย ๆ มักเลือกใช้ `/v1/responses`

## รายการโมเดลและการกำหนดเส้นทางของ Agent

<AccordionGroup>
  <Accordion title="`/v1/models` ส่งกลับอะไร?">
    รายการเป้าหมาย Agent ของ OpenClaw

    id ที่ส่งกลับคือ `openclaw`, `openclaw/default` และรายการ `openclaw/<agentId>`
    ใช้มันโดยตรงเป็นค่า `model` ของ OpenAI ได้

  </Accordion>
  <Accordion title="`/v1/models` แสดง Agents หรือ sub-agents?">
    มันแสดงรายการเป้าหมาย Agent ระดับบนสุด ไม่ใช่โมเดลผู้ให้บริการแบ็กเอนด์ และไม่ใช่ sub-agents

    sub-agents ยังคงเป็นโทโพโลยีการรันภายใน และจะไม่แสดงเป็น pseudo-models

  </Accordion>
  <Accordion title="ทำไมจึงมี `openclaw/default`?">
    `openclaw/default` คือ alias ที่เสถียรสำหรับ Agent เริ่มต้นที่กำหนดไว้

    นั่นหมายความว่าไคลเอนต์สามารถใช้ id ที่คาดเดาได้เพียงตัวเดียวต่อไปได้ แม้ว่า id จริงของ Agent เริ่มต้นจะเปลี่ยนไปตาม environment

  </Accordion>
  <Accordion title="จะเขียนทับโมเดลแบ็กเอนด์ได้อย่างไร?">
    ใช้ `x-openclaw-model`

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากคุณไม่ระบุ Agent ที่เลือกจะรันด้วยการเลือกโมเดลตามการกำหนดค่าปกติของมัน

  </Accordion>
  <Accordion title="embeddings เข้ากับสัญญานี้อย่างไร?">
    `/v1/embeddings` ใช้ id `model` แบบเป้าหมาย Agent เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อคุณต้องการโมเดล embedding เฉพาะ ให้ส่งใน `x-openclaw-model`
    หากไม่มี header นี้ คำขอจะถูกส่งผ่านไปยังการตั้งค่า embedding ปกติของ Agent ที่เลือก

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดของ event จะเป็น `data: <json>`
- สตรีมจบด้วย `data: [DONE]`

## การตั้งค่า Open WebUI อย่างรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI แบบพื้นฐาน:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL สำหรับ Docker บน macOS: `http://host.docker.internal:18789/v1`
- API key: bearer token ของ Gateway ของคุณ
- Model: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดง `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id ของ chat model
- หากคุณต้องการแบ็กเอนด์ provider/model เฉพาะสำหรับ Agent นั้น ให้ตั้งค่าโมเดลเริ่มต้นตามปกติของ Agent หรือตั้ง `x-openclaw-model`

การทดสอบแบบรวดเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากคำสั่งนี้ส่งกลับ `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย base URL และ token เดียวกัน

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

ดึงโมเดลหนึ่งรายการ:

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

- `/v1/models` ส่งกลับเป้าหมาย Agent ของ OpenClaw ไม่ใช่ catalog ของผู้ให้บริการแบบดิบ
- `openclaw/default` มีอยู่เสมอ เพื่อให้ id ที่เสถียรเพียงตัวเดียวใช้ได้ข้าม environment
- การเขียนทับ provider/model ของแบ็กเอนด์ควรอยู่ใน `x-openclaw-model` ไม่ใช่ในฟิลด์ `model` ของ OpenAI
- `/v1/embeddings` รองรับ `input` ทั้งแบบสตริงหรืออาร์เรย์ของสตริง

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
