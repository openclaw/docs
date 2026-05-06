---
read_when:
    - การผสานรวมเครื่องมือที่คาดหวัง OpenAI Chat Completions
summary: เปิดให้ใช้งานจุดปลายทาง HTTP /v1/chat/completions ที่เข้ากันได้กับ OpenAI จาก Gateway
title: การเติมข้อความแชทของ OpenAI
x-i18n:
    generated_at: "2026-05-06T09:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway สามารถให้บริการเอนด์พอยต์ Chat Completions ขนาดเล็กที่เข้ากันได้กับ OpenAI

เอนด์พอยต์นี้ถูก**ปิดใช้งานตามค่าเริ่มต้น** เปิดใช้งานใน config ก่อน

- `POST /v1/chat/completions`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้งานพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI ของ Gateway แล้ว จะให้บริการด้วย:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

ภายใต้ระบบ คำขอจะถูกดำเนินการเป็นการรัน agent ของ Gateway ตามปกติ (codepath เดียวกับ `openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน

ใช้การกำหนดค่า auth ของ Gateway

เส้นทาง auth ของ HTTP ที่พบบ่อย:

- shared-secret auth (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- HTTP auth ที่มีตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  route ผ่าน proxy ที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และให้ proxy แทรก
  identity headers ที่จำเป็น
- private-ingress open auth (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่งที่มา trusted proxy ที่กำหนดค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกันต้องกำหนด
  `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- หากมีการกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวของ auth มากเกินไป เอนด์พอยต์จะส่งคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่าเอนด์พอยต์นี้เป็นพื้นผิวที่มี**สิทธิ์เข้าถึงระดับผู้ปฏิบัติการเต็มรูปแบบ**สำหรับอินสแตนซ์ gateway

- HTTP bearer auth ที่นี่ไม่ใช่โมเดล scope ต่อผู้ใช้แบบจำกัด
- token/password ของ Gateway ที่ถูกต้องสำหรับเอนด์พอยต์นี้ควรถูกถือเหมือน credential ของ owner/operator
- คำขอจะทำงานผ่านเส้นทาง agent ของ control-plane เดียวกับการกระทำของผู้ปฏิบัติการที่เชื่อถือได้
- ไม่มีขอบเขต tool แยกต่างหากสำหรับ non-owner/per-user บนเอนด์พอยต์นี้; เมื่อผู้เรียกผ่าน Gateway auth ที่นี่ OpenClaw จะถือว่าผู้เรียกนั้นเป็นผู้ปฏิบัติการที่เชื่อถือได้สำหรับ gateway นี้
- สำหรับโหมด shared-secret auth (`token` และ `password`) เอนด์พอยต์จะคืนค่าเริ่มต้นผู้ปฏิบัติการแบบเต็มตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่า
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นจะ fallback ไปยังชุด scope เริ่มต้นของผู้ปฏิบัติการตามปกติ
- หาก policy ของ agent เป้าหมายอนุญาต tool ที่ละเอียดอ่อน เอนด์พอยต์นี้สามารถใช้ tool เหล่านั้นได้
- เก็บเอนด์พอยต์นี้ไว้เฉพาะบน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงต่ออินเทอร์เน็ตสาธารณะ

เมทริกซ์ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - เพิกเฉยต่อ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด default operator scope แบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turns บนเอนด์พอยต์นี้เป็น owner-sender turns
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนของตัวตนภายนอกที่เชื่อถือได้หรือขอบเขต deployment บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมี header อยู่
  - fallback ไปยังชุด scope เริ่มต้นของผู้ปฏิบัติการตามปกติเมื่อไม่มี header
  - จะเสีย semantics ของ owner ก็ต่อเมื่อผู้เรียกจำกัด scope ให้แคบลงอย่างชัดเจนและละ `operator.admin`

ดู [ความปลอดภัย](/th/gateway/security) และ [การเข้าถึงระยะไกล](/th/gateway/remote)

## สัญญาโมเดลแบบให้ agent มาก่อน

OpenClaw ถือว่าฟิลด์ OpenAI `model` เป็น**เป้าหมาย agent** ไม่ใช่ id ของโมเดล provider ดิบ

- `model: "openclaw"` route ไปยัง agent เริ่มต้นที่กำหนดค่าไว้
- `model: "openclaw/default"` ก็ route ไปยัง agent เริ่มต้นที่กำหนดค่าไว้เช่นกัน
- `model: "openclaw/<agentId>"` route ไปยัง agent เฉพาะตัว

headers คำขอที่เลือกใช้ได้:

- `x-openclaw-model: <provider/model-or-bare-id>` override โมเดล backend สำหรับ agent ที่เลือก
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับเป็น compatibility override
- `x-openclaw-session-key: <sessionKey>` ควบคุม session routing อย่างเต็มที่
- `x-openclaw-message-channel: <channel>` ตั้งค่าบริบท synthetic ingress channel สำหรับ prompt และ policy ที่รับรู้ channel

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

## พฤติกรรม session

ตามค่าเริ่มต้น เอนด์พอยต์นี้เป็นแบบ**ไร้สถานะต่อคำขอ** (มีการสร้าง session key ใหม่ทุกครั้งที่เรียก)

หากคำขอมีสตริง OpenAI `user` Gateway จะสร้าง session key ที่เสถียรจากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้ session ของ agent ร่วมกันได้

## เหตุผลที่พื้นผิวนี้สำคัญ

นี่คือชุดความเข้ากันได้ที่ให้ผลคุ้มค่าสูงสุดสำหรับ frontend และ tooling ที่โฮสต์เอง:

- การตั้งค่า Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- client chat OpenAI ที่มีอยู่มักเริ่มต้นได้ด้วย `/v1/chat/completions`
- client ที่เป็น agent-native มากขึ้นเรื่อย ๆ นิยมใช้ `/v1/responses`

## รายการโมเดลและ agent routing

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    รายการเป้าหมาย agent ของ OpenClaw

    ids ที่ส่งคืนคือรายการ `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
    ใช้ค่าเหล่านี้โดยตรงเป็นค่า OpenAI `model`

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    จะแสดงรายการเป้าหมาย agent ระดับบนสุด ไม่ใช่โมเดล backend provider และไม่ใช่ sub-agents

    Sub-agents ยังคงเป็น topology การดำเนินการภายใน และไม่ปรากฏเป็น pseudo-models

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` คือ alias ที่เสถียรสำหรับ agent เริ่มต้นที่กำหนดค่าไว้

    นั่นหมายความว่า client สามารถใช้ id ที่คาดเดาได้หนึ่งค่าได้ต่อไป แม้ว่า id ของ agent เริ่มต้นจริงจะเปลี่ยนไประหว่างสภาพแวดล้อม

  </Accordion>
  <Accordion title="How do I override the backend model?">
    ใช้ `x-openclaw-model`

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากคุณละไว้ agent ที่เลือกจะทำงานด้วยตัวเลือกโมเดลที่กำหนดค่าไว้ตามปกติ

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` ใช้ ids `model` แบบเป้าหมาย agent เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อต้องการ embedding model เฉพาะ ให้ส่งใน `x-openclaw-model`
    หากไม่มี header นั้น คำขอจะส่งผ่านไปยังการตั้งค่า embedding ตามปกติของ agent ที่เลือก

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัด event คือ `data: <json>`
- Stream จบด้วย `data: [DONE]`

## การตั้งค่า Open WebUI อย่างรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI ขั้นพื้นฐาน:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker บน macOS base URL: `http://host.docker.internal:18789/v1`
- API key: Gateway bearer token ของคุณ
- Model: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดงรายการ `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id โมเดล chat
- หากคุณต้องการ backend provider/model เฉพาะสำหรับ agent นั้น ให้ตั้งค่าโมเดลเริ่มต้นปกติของ agent หรือส่ง `x-openclaw-model`

smoke อย่างรวดเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากส่งคืน `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย base URL และ token เดียวกัน

## ตัวอย่าง

ไม่ใช่ streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

- `/v1/models` ส่งคืนเป้าหมาย agent ของ OpenClaw ไม่ใช่ catalogs ของ provider ดิบ
- `openclaw/default` มีอยู่เสมอ เพื่อให้ id ที่เสถียรหนึ่งค่าทำงานข้ามสภาพแวดล้อมได้
- backend provider/model override ควรอยู่ใน `x-openclaw-model` ไม่ใช่ฟิลด์ OpenAI `model`
- `/v1/embeddings` รองรับ `input` เป็นสตริงหรือ array ของสตริง

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
