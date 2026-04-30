---
read_when:
    - การผสานรวมเครื่องมือที่คาดหวัง OpenAI Chat Completions
summary: เปิดให้ใช้งานเอนด์พอยต์ HTTP /v1/chat/completions ที่เข้ากันได้กับ OpenAI จาก Gateway
title: การเติมข้อความแชทให้สมบูรณ์ของ OpenAI
x-i18n:
    generated_at: "2026-04-30T09:53:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw สามารถให้บริการปลายทาง Chat Completions ขนาดเล็กที่เข้ากันได้กับ OpenAI ได้

ปลายทางนี้ **ปิดใช้งานตามค่าเริ่มต้น** เปิดใช้งานใน config ก่อน

- `POST /v1/chat/completions`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้งานพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI ของ Gateway แล้ว พื้นผิวนี้จะให้บริการด้วย:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

ภายใต้ระบบ คำขอจะถูกดำเนินการเป็นการรันเอเจนต์ Gateway ปกติ (codepath เดียวกับ `openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์/config จะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน

ใช้การกำหนดค่าการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ที่พบบ่อย:

- การยืนยันตัวตนด้วย shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP ที่มีข้อมูลระบุตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  กำหนดเส้นทางผ่านพร็อกซีที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และให้พร็อกซีนั้นฉีด
  ส่วนหัวข้อมูลระบุตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดบน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ส่วนหัวการยืนยันตัวตน

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจากแหล่ง
  พร็อกซีที่เชื่อถือได้ซึ่งกำหนดค่าไว้; พร็อกซี local loopback บนโฮสต์เดียวกันต้องกำหนด
  `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- หากมีการกำหนดค่า `gateway.auth.rateLimit` และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป ปลายทางจะส่งคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่าปลายทางนี้เป็นพื้นผิวที่มี **สิทธิ์เข้าถึงระดับผู้ควบคุมเต็มรูปแบบ** สำหรับอินสแตนซ์ Gateway

- การยืนยันตัวตน HTTP bearer ที่นี่ไม่ใช่โมเดลขอบเขตต่อผู้ใช้แบบจำกัด
- token/password ของ Gateway ที่ถูกต้องสำหรับปลายทางนี้ควรถูกปฏิบัติเหมือนข้อมูลประจำตัวของเจ้าของ/ผู้ควบคุม
- คำขอรันผ่านเส้นทางเอเจนต์ control-plane เดียวกับการกระทำของผู้ควบคุมที่เชื่อถือได้
- ไม่มีขอบเขตเครื่องมือแบบแยกสำหรับผู้ที่ไม่ใช่เจ้าของ/ต่อผู้ใช้บนปลายทางนี้; เมื่อผู้เรียกผ่านการยืนยันตัวตน Gateway ที่นี่ OpenClaw จะถือว่าผู้เรียกนั้นเป็นผู้ควบคุมที่เชื่อถือได้สำหรับ Gateway นี้
- สำหรับโหมดการยืนยันตัวตนแบบ shared-secret (`token` และ `password`) ปลายทางจะกู้คืนค่าเริ่มต้นของผู้ควบคุมเต็มรูปแบบตามปกติ แม้ว่าผู้เรียกจะส่งส่วนหัว `x-openclaw-scopes` ที่แคบกว่ามา
- โหมด HTTP ที่มีข้อมูลระบุตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นจะ fallback ไปยังชุดขอบเขตค่าเริ่มต้นของผู้ควบคุมตามปกติ
- หากนโยบายเอเจนต์เป้าหมายอนุญาตเครื่องมือที่ละเอียดอ่อน ปลายทางนี้สามารถใช้เครื่องมือเหล่านั้นได้
- ให้ปลายทางนี้อยู่บน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงต่ออินเทอร์เน็ตสาธารณะ

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - เพิกเฉยต่อ `x-openclaw-scopes` ที่แคบกว่า
  - กู้คืนชุดขอบเขตผู้ควบคุมค่าเริ่มต้นแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turns บนปลายทางนี้เป็น owner-sender turns
- โหมด HTTP ที่มีข้อมูลระบุตัวตนที่เชื่อถือได้ (เช่น การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้ หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนของอัตลักษณ์ภายนอกหรือขอบเขตการปรับใช้ที่เชื่อถือได้บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมีส่วนหัวอยู่
  - fallback ไปยังชุดขอบเขตผู้ควบคุมค่าเริ่มต้นตามปกติเมื่อไม่มีส่วนหัว
  - จะสูญเสียความหมายของเจ้าของเฉพาะเมื่อผู้เรียกจำกัดขอบเขตอย่างชัดเจนและละเว้น `operator.admin`

ดู [ความปลอดภัย](/th/gateway/security) และ [การเข้าถึงระยะไกล](/th/gateway/remote)

## สัญญาโมเดลแบบเอเจนต์เป็นหลัก

OpenClaw ถือว่าฟิลด์ `model` ของ OpenAI เป็น **เป้าหมายเอเจนต์** ไม่ใช่ id โมเดลของผู้ให้บริการแบบดิบ

- `model: "openclaw"` กำหนดเส้นทางไปยังเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้
- `model: "openclaw/default"` ก็กำหนดเส้นทางไปยังเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้เช่นกัน
- `model: "openclaw/<agentId>"` กำหนดเส้นทางไปยังเอเจนต์เฉพาะ

ส่วนหัวคำขอที่ไม่บังคับ:

- `x-openclaw-model: <provider/model-or-bare-id>` แทนที่โมเดล backend สำหรับเอเจนต์ที่เลือก
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับเป็นการแทนที่เพื่อความเข้ากันได้
- `x-openclaw-session-key: <sessionKey>` ควบคุมการกำหนดเส้นทาง session อย่างสมบูรณ์
- `x-openclaw-message-channel: <channel>` ตั้งค่าบริบท synthetic ingress channel สำหรับพรอมป์และนโยบายที่รับรู้ช่องทาง

alias เพื่อความเข้ากันได้ที่ยังยอมรับ:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## การเปิดใช้งานปลายทาง

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

## การปิดใช้งานปลายทาง

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

## พฤติกรรมของ session

ตามค่าเริ่มต้น ปลายทางนี้เป็นแบบ **stateless ต่อคำขอ** (มีการสร้าง session key ใหม่ในแต่ละการเรียก)

หากคำขอมีสตริง `user` ของ OpenAI อยู่ Gateway จะ derive session key ที่เสถียรจากค่านั้น เพื่อให้การเรียกซ้ำสามารถแชร์ session ของเอเจนต์ได้

## เหตุผลที่พื้นผิวนี้สำคัญ

นี่คือชุดความเข้ากันได้ที่ให้ประโยชน์สูงสุดสำหรับ frontend และเครื่องมือแบบ self-hosted:

- การตั้งค่า Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แชต OpenAI ที่มีอยู่มักเริ่มต้นด้วย `/v1/chat/completions` ได้
- ไคลเอนต์ที่เป็น agent-native มากขึ้นเรื่อย ๆ มักต้องการ `/v1/responses`

## รายการโมเดลและการกำหนดเส้นทางเอเจนต์

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    รายการเป้าหมายเอเจนต์ของ OpenClaw

    id ที่ส่งคืนคือรายการ `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
    ใช้ค่าเหล่านี้โดยตรงเป็นค่า `model` ของ OpenAI

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    รายการนี้แสดงเป้าหมายเอเจนต์ระดับบนสุด ไม่ใช่โมเดลผู้ให้บริการ backend และไม่ใช่ sub-agent

    sub-agent ยังคงเป็นโทโพโลยีการดำเนินการภายใน ไม่ปรากฏเป็น pseudo-model

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` คือ alias ที่เสถียรสำหรับเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้

    หมายความว่าไคลเอนต์สามารถใช้ id ที่คาดเดาได้ค่าเดียวต่อไป แม้ว่า id ของเอเจนต์ค่าเริ่มต้นจริงจะเปลี่ยนระหว่างสภาพแวดล้อม

  </Accordion>
  <Accordion title="How do I override the backend model?">
    ใช้ `x-openclaw-model`

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากคุณละเว้นส่วนนี้ เอเจนต์ที่เลือกจะรันด้วยตัวเลือกโมเดลที่กำหนดค่าปกติของมัน

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` ใช้ id `model` แบบเป้าหมายเอเจนต์เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อคุณต้องการโมเดล embedding เฉพาะ ให้ส่งใน `x-openclaw-model`
    หากไม่มีส่วนหัวนั้น คำขอจะถูกส่งผ่านไปยังการตั้งค่า embedding ปกติของเอเจนต์ที่เลือก

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัด event คือ `data: <json>`
- สตรีมจบด้วย `data: [DONE]`

## การตั้งค่า Open WebUI แบบเร็ว

สำหรับการเชื่อมต่อ Open WebUI พื้นฐาน:

- URL ฐาน: `http://127.0.0.1:18789/v1`
- URL ฐานของ Docker บน macOS: `http://host.docker.internal:18789/v1`
- คีย์ API: bearer token ของ Gateway ของคุณ
- โมเดล: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดง `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id โมเดลแชต
- หากคุณต้องการผู้ให้บริการ/โมเดล backend เฉพาะสำหรับเอเจนต์นั้น ให้ตั้งค่าโมเดลค่าเริ่มต้นปกติของเอเจนต์ หรือส่ง `x-openclaw-model`

smoke แบบเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากค่านั้นส่งคืน `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย URL ฐานและ token เดียวกัน

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

- `/v1/models` ส่งคืนเป้าหมายเอเจนต์ของ OpenClaw ไม่ใช่แค็ตตาล็อกผู้ให้บริการแบบดิบ
- `openclaw/default` มีอยู่เสมอ เพื่อให้ id ที่เสถียรหนึ่งค่าสามารถใช้ได้ข้ามสภาพแวดล้อม
- การแทนที่ผู้ให้บริการ/โมเดล backend อยู่ใน `x-openclaw-model` ไม่ใช่ฟิลด์ `model` ของ OpenAI
- `/v1/embeddings` รองรับ `input` เป็นสตริงหรืออาร์เรย์ของสตริง

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
