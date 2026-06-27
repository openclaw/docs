---
read_when:
    - การผสานรวมเครื่องมือที่คาดหวัง OpenAI Chat Completions
summary: เปิดให้ใช้งานปลายทาง HTTP /v1/chat/completions ที่เข้ากันได้กับ OpenAI จาก Gateway
title: การเติมข้อความแชทของ OpenAI
x-i18n:
    generated_at: "2026-06-27T17:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway ของ OpenClaw สามารถให้บริการปลายทาง Chat Completions ขนาดเล็กที่เข้ากันได้กับ OpenAI

ปลายทางนี้ถูก**ปิดใช้งานโดยค่าเริ่มต้น** เปิดใช้งานใน config ก่อน

- `POST /v1/chat/completions`
- พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้งานพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI ของ Gateway แล้ว ระบบจะให้บริการสิ่งต่อไปนี้ด้วย:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

เบื้องหลังคำขอจะถูกดำเนินการเป็นการรันเอเจนต์ Gateway ปกติ (codepath เดียวกับ `openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ

## การตรวจสอบสิทธิ์

ใช้การกำหนดค่าการตรวจสอบสิทธิ์ของ Gateway

เส้นทางการตรวจสอบสิทธิ์ HTTP ทั่วไป:

- การตรวจสอบสิทธิ์แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การตรวจสอบสิทธิ์ HTTP ที่มีตัวตนที่เชื่อถือได้ (`gateway.auth.mode="trusted-proxy"`):
  ส่งผ่าน proxy ที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และปล่อยให้ proxy แทรก
  identity headers ที่จำเป็น
- การตรวจสอบสิทธิ์แบบเปิดสำหรับ private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง trusted proxy ที่กำหนดค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า
  `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- ผู้เรียกภายในบนโฮสต์เดียวกันที่ข้าม proxy สามารถใช้
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` เป็น fallback แบบ local direct
  ได้ หลักฐาน header ใดๆ อย่าง `Forwarded`, `X-Forwarded-*`, หรือ `X-Real-IP`
  จะทำให้คำขอยังคงอยู่บนเส้นทาง trusted-proxy แทน
- หากกำหนดค่า `gateway.auth.rateLimit` และเกิดการตรวจสอบสิทธิ์ล้มเหลวมากเกินไป ปลายทางจะส่งคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่าปลายทางนี้เป็นพื้นผิวที่มี**สิทธิ์เข้าถึงของผู้ปฏิบัติงานเต็มรูปแบบ**สำหรับอินสแตนซ์ Gateway

- HTTP bearer auth ที่นี่ไม่ใช่โมเดล scope รายผู้ใช้แบบจำกัด
- Gateway token/password ที่ถูกต้องสำหรับปลายทางนี้ควรถูกปฏิบัติเหมือน credential ของเจ้าของ/ผู้ปฏิบัติงาน
- คำขอจะรันผ่านเส้นทาง control-plane agent เดียวกับการดำเนินการของผู้ปฏิบัติงานที่เชื่อถือได้
- ไม่มีขอบเขตเครื่องมือแบบ non-owner/รายผู้ใช้แยกต่างหากบนปลายทางนี้; เมื่อผู้เรียกผ่าน Gateway auth ที่นี่แล้ว OpenClaw จะถือว่าผู้เรียกนั้นเป็นผู้ปฏิบัติงานที่เชื่อถือได้สำหรับ Gateway นี้
- สำหรับโหมดการตรวจสอบสิทธิ์แบบ shared-secret (`token` และ `password`) ปลายทางจะคืนค่า default ของผู้ปฏิบัติงานเต็มรูปแบบตามปกติ แม้ผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่า
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมีอยู่ และมิฉะนั้นจะ fallback ไปยังชุด scope default ของผู้ปฏิบัติงานตามปกติ
- หากนโยบายเอเจนต์เป้าหมายอนุญาตเครื่องมือที่ละเอียดอ่อน ปลายทางนี้สามารถใช้เครื่องมือเหล่านั้นได้
- เก็บปลายทางนี้ไว้เฉพาะบน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดเผยโดยตรงต่ออินเทอร์เน็ตสาธารณะ

เมทริกซ์การตรวจสอบสิทธิ์:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ละเว้น `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope default ของผู้ปฏิบัติงานเต็มรูปแบบ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ปฏิบัติต่อ chat turns บนปลายทางนี้เป็น turns จาก owner-sender
- โหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ตรวจสอบสิทธิ์ตัวตนภายนอกที่เชื่อถือได้หรือขอบเขต deployment บางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมี header อยู่
  - fallback ไปยังชุด scope default ของผู้ปฏิบัติงานตามปกติเมื่อไม่มี header
  - จะเสีย semantics ของเจ้าของเฉพาะเมื่อผู้เรียกจำกัด scopes อย่างชัดเจนและละ `operator.admin`
  - ต้องใช้ `operator.admin` สำหรับการควบคุมคำขอระดับเจ้าของ เช่น `x-openclaw-model`

ดู [ความปลอดภัย](/th/gateway/security) และ [การเข้าถึงระยะไกล](/th/gateway/remote)

## ควรใช้ปลายทางนี้เมื่อใด

ใช้ `/v1/chat/completions` เมื่อคุณกำลังผสานรวม tooling หรือ backend ฝั่งแอปที่เชื่อถือได้เข้ากับ Gateway ที่มีอยู่ และสามารถเก็บ credential ของผู้ปฏิบัติงาน Gateway ได้อย่างปลอดภัย

- ควรใช้วิธีนี้แทนการเพิ่ม channel ในตัวใหม่ เมื่อการผสานรวมของคุณเป็นเพียงพื้นผิวผู้ปฏิบัติงาน/ไคลเอนต์อีกแบบสำหรับ Gateway เดียวกัน
- สำหรับ native mobile clients ที่เชื่อมต่อโดยตรงไปยัง Gateway ระยะไกล ควรใช้ [WebChat](/th/web/webchat) หรือ [Gateway Protocol](/th/gateway/protocol) และ implement flow paired-device bootstrap/device-token เพื่อให้อุปกรณ์ไม่ต้องใช้ shared HTTP token/password
- สร้าง channel plugin แทน เมื่อคุณกำลังผสานรวมเครือข่ายการส่งข้อความภายนอกที่มีผู้ใช้ ห้อง การส่งผ่าน Webhook หรือ outbound transport ของตัวเอง ดู [การสร้าง plugins](/th/plugins/building-plugins)

## สัญญาโมเดลแบบ agent-first

OpenClaw ถือว่า field `model` ของ OpenAI เป็น**เป้าหมายเอเจนต์** ไม่ใช่ provider model id ดิบ

- `model: "openclaw"` route ไปยังเอเจนต์ default ที่กำหนดค่าไว้
- `model: "openclaw/default"` ก็ route ไปยังเอเจนต์ default ที่กำหนดค่าไว้เช่นกัน
- `model: "openclaw/<agentId>"` route ไปยังเอเจนต์เฉพาะ

headers คำขอที่เลือกใช้ได้:

- `x-openclaw-model: <provider/model-or-bare-id>` override backend model สำหรับเอเจนต์ที่เลือก ผู้เรียกแบบ shared-secret bearer สามารถใช้ header นี้ได้ ผู้เรียกที่มีตัวตน เช่น trusted-proxy หรือคำขอ private no-auth ingress ที่มี `x-openclaw-scopes` ต้องใช้ `operator.admin`; ผู้เรียกแบบ write-only จะได้รับ `403 missing scope: operator.admin`
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับเป็น compatibility override
- `x-openclaw-session-key: <sessionKey>` ควบคุม session routing อย่างชัดเจน ค่าต้องไม่ใช้ namespaces ของ session ภายในที่สงวนไว้ เช่น `subagent:`, `cron:`, หรือ `acp:`; คำขอเหล่านั้นจะถูกปฏิเสธด้วย `400 invalid_request_error`
- `x-openclaw-message-channel: <channel>` ตั้งค่าบริบท synthetic ingress channel สำหรับ prompts และ policies ที่รับรู้ channel

compatibility aliases ที่ยังยอมรับ:

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

โดยค่าเริ่มต้น ปลายทางนี้เป็นแบบ**ไร้สถานะต่อคำขอ** (สร้าง session key ใหม่ในแต่ละครั้งที่เรียก)

หากคำขอมี string `user` ของ OpenAI Gateway จะ derive session key ที่เสถียรจากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้ session ของเอเจนต์ร่วมกันได้

สำหรับแอปแบบกำหนดเอง default ที่ปลอดภัยที่สุดคือใช้ค่า `user` เดิมซ้ำต่อ thread การสนทนา หลีกเลี่ยง identifiers ระดับบัญชี เว้นแต่คุณต้องการให้การสนทนาหรืออุปกรณ์หลายรายการใช้ session เดียวของ OpenClaw ร่วมกันอย่างชัดเจน ใช้ `x-openclaw-session-key` เฉพาะเมื่อคุณต้องการควบคุม routing อย่างชัดเจนข้ามไคลเอนต์หรือ threads หลายรายการ และเลือก keys ที่แอปพลิเคชันเป็นเจ้าของซึ่งไม่ขึ้นต้นด้วย namespaces ภายในที่สงวนไว้ เช่น `subagent:`, `cron:`, หรือ `acp:`

## เหตุผลที่พื้นผิวนี้สำคัญ

นี่คือชุด compatibility ที่ให้ leverage สูงสุดสำหรับ self-hosted frontends และ tooling:

- การตั้งค่า Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แชท OpenAI ที่มีอยู่มักเริ่มต้นด้วย `/v1/chat/completions` ได้
- ไคลเอนต์ที่เป็น agent-native มากขึ้นมีแนวโน้มชอบ `/v1/responses`

## รายการโมเดลและ agent routing

<AccordionGroup>
  <Accordion title="`/v1/models` ส่งคืนอะไร?">
    รายการ agent-target ของ OpenClaw

    ids ที่ส่งคืนคือ entries `openclaw`, `openclaw/default`, และ `openclaw/<agentId>`
    ใช้ค่าเหล่านี้โดยตรงเป็นค่า `model` ของ OpenAI

  </Accordion>
  <Accordion title="`/v1/models` แสดงรายการ agents หรือ sub-agents?">
    แสดงรายการเป้าหมายเอเจนต์ระดับบน ไม่ใช่ backend provider models และไม่ใช่ sub-agents

    Sub-agents ยังคงเป็น topology การดำเนินการภายใน ไม่ปรากฏเป็น pseudo-models

  </Accordion>
  <Accordion title="ทำไมจึงรวม `openclaw/default` ไว้?">
    `openclaw/default` คือ alias ที่เสถียรสำหรับเอเจนต์ default ที่กำหนดค่าไว้

    ซึ่งหมายความว่าไคลเอนต์สามารถใช้ id ที่คาดการณ์ได้เพียงค่าเดียวต่อไป แม้ id ของเอเจนต์ default จริงจะเปลี่ยนไประหว่าง environments

  </Accordion>
  <Accordion title="ฉันจะ override backend model ได้อย่างไร?">
    ใช้ `x-openclaw-model` นี่คือ override ระดับเจ้าของ: ใช้ได้กับเส้นทาง Gateway shared-secret bearer token/password และต้องใช้ `operator.admin` บนเส้นทาง HTTP ที่มีตัวตน เช่น trusted proxy auth

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากคุณละไว้ เอเจนต์ที่เลือกจะรันด้วยการเลือกโมเดลที่กำหนดค่าไว้ตามปกติ

  </Accordion>
  <Accordion title="embeddings เข้ากับสัญญานี้อย่างไร?">
    `/v1/embeddings` ใช้ ids `model` แบบ agent-target เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อคุณต้องการ embedding model เฉพาะ ให้ส่งค่านั้นใน `x-openclaw-model` จากผู้เรียกแบบ shared-secret หรือผู้เรียกที่มีตัวตนพร้อม `operator.admin`
    หากไม่มี header นั้น คำขอจะส่งผ่านไปยังการตั้งค่า embedding ปกติของเอเจนต์ที่เลือก

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับเหตุการณ์ที่เซิร์ฟเวอร์ส่ง (Server-Sent Events: SSE):

- `Content-Type: text/event-stream`
- แต่ละ event line คือ `data: <json>`
- stream สิ้นสุดด้วย `data: [DONE]`

## สัญญาเครื่องมือแชท

`/v1/chat/completions` รองรับ subset ของ function-tool ที่เข้ากันได้กับไคลเอนต์ OpenAI Chat ทั่วไป

### fields คำขอที่รองรับ

- `tools`: array ของ `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"`, หรือ `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` turns ติดตามผล
- `messages[*].tool_call_id` สำหรับผูก tool results กลับไปยัง tool call ก่อนหน้า
- `max_completion_tokens`: number; เพดานต่อการเรียกสำหรับ completion tokens ทั้งหมด (รวม reasoning tokens) ชื่อ field ปัจจุบันของ OpenAI Chat Completions; แนะนำให้ใช้เมื่อส่งทั้ง `max_completion_tokens` และ `max_tokens`
- `max_tokens`: number; legacy alias ที่ยอมรับเพื่อความเข้ากันได้ย้อนหลัง จะถูกละเว้นเมื่อมี `max_completion_tokens` อยู่ด้วย
- `temperature`: number; sampling temperature แบบ best-effort ที่ส่งต่อไปยัง upstream provider ผ่านช่องทาง stream-param ของเอเจนต์
- `top_p`: number; nucleus sampling แบบ best-effort ที่ส่งต่อไปยัง upstream provider ผ่านช่องทาง stream-param ของเอเจนต์
- `frequency_penalty`: number; frequency penalty แบบ best-effort ที่ส่งต่อไปยัง upstream provider ผ่านช่องทาง stream-param ของเอเจนต์ ช่วงที่ validated: -2.0 ถึง 2.0 ส่งคืน `400 invalid_request_error` สำหรับค่านอกช่วง
- `presence_penalty`: number; presence penalty แบบ best-effort ที่ส่งต่อไปยัง upstream provider ผ่านช่องทาง stream-param ของเอเจนต์ ช่วงที่ validated: -2.0 ถึง 2.0 ส่งคืน `400 invalid_request_error` สำหรับค่านอกช่วง
- `seed`: number (integer); seed แบบ best-effort ที่ส่งต่อไปยัง upstream provider ผ่านช่องทาง stream-param ของเอเจนต์ ส่งคืน `400 invalid_request_error` สำหรับค่าที่ไม่ใช่จำนวนเต็ม
- `stop`: string หรือ array ของ strings สูงสุด 4 รายการ; stop sequences แบบ best-effort ที่ส่งต่อไปยัง upstream provider ผ่านช่องทาง stream-param ของเอเจนต์ ส่งคืน `400 invalid_request_error` สำหรับ sequences มากกว่า 4 รายการหรือ entries ที่ไม่ใช่ string/ว่างเปล่า

เมื่อมีการตั้งค่าฟิลด์ขีดจำกัดโทเค็นฟิลด์ใดฟิลด์หนึ่ง ค่านั้นจะถูกส่งต่อไปยังผู้ให้บริการต้นทางผ่านช่อง stream-param ของเอเจนต์ ชื่อฟิลด์จริงบนสายที่ส่งไปยังผู้ให้บริการต้นทางจะถูกเลือกโดย transport ของผู้ให้บริการ: `max_completion_tokens` สำหรับ endpoint ตระกูล OpenAI และ `max_tokens` สำหรับผู้ให้บริการที่ยอมรับได้เฉพาะชื่อแบบเดิมเท่านั้น (เช่น Mistral และ Chutes) ฟิลด์การสุ่มตัวอย่าง (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) ใช้ช่อง stream-param เดียวกัน; แบ็กเอนด์ Codex Responses ที่อิง ChatGPT จะตัดฟิลด์เหล่านี้ออกฝั่งเซิร์ฟเวอร์ เนื่องจากใช้การสุ่มตัวอย่างแบบคงที่ `stop` ก็เดินทางผ่านช่อง stream-param เช่นกัน และแมปไปยังฟิลด์ stop ของ transport (`stop` สำหรับแบ็กเอนด์ Chat Completions, `stop_sequences` สำหรับ Anthropic); OpenAI Responses API ไม่มีพารามิเตอร์ stop ดังนั้น `stop` จะไม่ถูกนำไปใช้กับโมเดลที่ใช้แบ็กเอนด์ Responses

### ตัวแปรที่ไม่รองรับ

endpoint ส่งคืน `400 invalid_request_error` สำหรับตัวแปรเครื่องมือที่ไม่รองรับ รวมถึง:

- `tools` ที่ไม่ใช่อาร์เรย์
- รายการเครื่องมือที่ไม่ใช่ฟังก์ชัน
- ไม่มี `tool.function.name`
- ตัวแปร `tool_choice` เช่น `allowed_tools` และ `custom`
- ค่า `tool_choice.function.name` ที่ไม่ตรงกับ `tools` ที่ระบุ

สำหรับ `tool_choice: "required"` และ `tool_choice` ที่ปักหมุดฟังก์ชัน endpoint จะจำกัดชุด function-tool ฝั่งไคลเอนต์ที่เปิดเผย สั่งให้ runtime เรียกเครื่องมือไคลเอนต์ก่อนตอบกลับ และส่งคืนข้อผิดพลาดหากการตอบกลับของเอเจนต์ไม่มีการเรียกเครื่องมือไคลเอนต์แบบมีโครงสร้างที่ตรงกัน สัญญานี้ใช้กับรายการ HTTP `tools` ที่ผู้เรียกส่งมา ไม่ใช่เครื่องมือเอเจนต์ภายในทั้งหมดของ OpenClaw

### รูปแบบการตอบกลับเครื่องมือแบบไม่สตรีม

เมื่อเอเจนต์ตัดสินใจเรียกเครื่องมือ การตอบกลับจะใช้:

- `choices[0].finish_reason = "tool_calls"`
- รายการ `choices[0].message.tool_calls[]` ที่มี:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (สตริง JSON)

คำบรรยายของผู้ช่วยก่อนการเรียกเครื่องมือจะถูกส่งคืนใน `choices[0].message.content` (อาจว่างเปล่า)

### รูปแบบการตอบกลับเครื่องมือแบบสตรีม

เมื่อ `stream: true` การเรียกเครื่องมือจะถูกปล่อยออกมาเป็นชิ้นส่วน SSE แบบเพิ่มทีละส่วน:

- delta บทบาทผู้ช่วยเริ่มต้น
- delta คำบรรยายของผู้ช่วยแบบเลือกได้
- ชิ้นส่วน `delta.tool_calls` หนึ่งชิ้นหรือมากกว่าที่มีข้อมูลระบุตัวตนของเครื่องมือและส่วนย่อยของอาร์กิวเมนต์
- ชิ้นส่วนสุดท้ายที่มี `finish_reason: "tool_calls"`
- `data: [DONE]`

หาก `stream_options.include_usage=true` จะมีการปล่อยชิ้นส่วน usage ต่อท้ายก่อน `[DONE]`

### ลูปติดตามผลของเครื่องมือ

หลังจากได้รับ `tool_calls` ไคลเอนต์ควรเรียกใช้ฟังก์ชันที่ร้องขอ แล้วส่งคำขอติดตามผลที่มี:

- ข้อความการเรียกเครื่องมือของผู้ช่วยก่อนหน้า
- ข้อความ `role: "tool"` หนึ่งข้อความหรือมากกว่าพร้อม `tool_call_id` ที่ตรงกัน

สิ่งนี้ทำให้การรันเอเจนต์ของ Gateway สามารถดำเนินลูปการให้เหตุผลเดิมต่อและสร้างคำตอบสุดท้ายของผู้ช่วยได้

## การตั้งค่า Open WebUI อย่างรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI พื้นฐาน:

- URL ฐาน: `http://127.0.0.1:18789/v1`
- URL ฐานของ Docker บน macOS: `http://host.docker.internal:18789/v1`
- คีย์ API: โทเค็น bearer ของ Gateway ของคุณ
- โมเดล: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดงรายการ `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id โมเดลแชท
- หากคุณต้องการผู้ให้บริการ/โมเดลแบ็กเอนด์เฉพาะสำหรับเอเจนต์นั้น ให้ตั้งค่าโมเดลเริ่มต้นปกติของเอเจนต์ หรือส่ง `x-openclaw-model` จากผู้เรียกที่ใช้ shared-secret หรือผู้เรียกที่มีตัวตนพร้อม `operator.admin`

การทดสอบ smoke อย่างรวดเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากค่านั้นส่งคืน `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย URL ฐานและโทเค็นเดียวกัน

## ตัวอย่าง

เซสชันที่เสถียรสำหรับการสนทนาของแอปหนึ่งรายการ:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

ใช้ค่า `user` เดิมซ้ำในการเรียกภายหลังสำหรับการสนทนานั้น เพื่อดำเนินเซสชันเอเจนต์เดิมต่อ

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
- `openclaw/default` มีอยู่เสมอ เพื่อให้ id ที่เสถียรหนึ่งค่าทำงานได้ข้ามสภาพแวดล้อม
- การ override ผู้ให้บริการ/โมเดลแบ็กเอนด์ควรอยู่ใน `x-openclaw-model` ไม่ใช่ฟิลด์ OpenAI `model` บนเส้นทาง HTTP auth ที่มีตัวตน header นี้ต้องใช้ `operator.admin`
- `/v1/embeddings` รองรับ `input` เป็นสตริงหรืออาร์เรย์ของสตริง

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
