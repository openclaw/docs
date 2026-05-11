---
read_when:
    - การวินิจฉัยการหมุนเวียนโปรไฟล์การยืนยันตัวตน ช่วงพักรอ หรือพฤติกรรมการสลับไปใช้โมเดลสำรอง
    - การอัปเดตกฎการสลับระบบเมื่อขัดข้องสำหรับโปรไฟล์การยืนยันตัวตนหรือโมเดล
    - ทำความเข้าใจว่าการแทนที่โมเดลระดับเซสชันทำงานร่วมกับการลองซ้ำแบบสำรองอย่างไร
sidebarTitle: Model failover
summary: วิธีที่ OpenClaw หมุนเวียนโปรไฟล์การยืนยันตัวตนและถอยกลับข้ามโมเดลต่าง ๆ
title: การสลับไปใช้โมเดลสำรอง
x-i18n:
    generated_at: "2026-05-11T20:28:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw จัดการความล้มเหลวเป็นสองขั้นตอน:

1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการปัจจุบัน
2. **การ fallback ของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

เอกสารนี้อธิบายกฎขณะรันไทม์และข้อมูลที่รองรับกฎเหล่านั้น

## โฟลว์รันไทม์

สำหรับการรันข้อความปกติ OpenClaw จะประเมินตัวเลือกตามลำดับนี้:

<Steps>
  <Step title="Resolve session state">
    แก้ไขสถานะโมเดลของเซสชันที่ใช้งานอยู่และค่ากำหนดโปรไฟล์การยืนยันตัวตน
  </Step>
  <Step title="Build candidate chain">
    สร้างลำดับตัวเลือกโมเดลจากการเลือกโมเดลปัจจุบันและนโยบาย fallback สำหรับแหล่งที่มาของการเลือกนั้น ค่าเริ่มต้นที่กำหนดไว้ โมเดลหลักของงาน cron และโมเดล fallback ที่เลือกโดยอัตโนมัติสามารถใช้ fallback ที่กำหนดไว้ได้ ส่วนการเลือกเซสชันโดยผู้ใช้อย่างชัดเจนจะเข้มงวด
  </Step>
  <Step title="Try the current provider">
    ลองใช้ผู้ให้บริการปัจจุบันพร้อมกฎการหมุนเวียน/คูลดาวน์ของโปรไฟล์การยืนยันตัวตน
  </Step>
  <Step title="Advance on failover-worthy errors">
    หากผู้ให้บริการนั้นถูกใช้จนหมดด้วยข้อผิดพลาดที่ควร failover ให้ย้ายไปยังตัวเลือกโมเดลถัดไป
  </Step>
  <Step title="Persist fallback override">
    บันทึก override ของ fallback ที่เลือกไว้ก่อนเริ่ม retry เพื่อให้ตัวอ่านเซสชันอื่นเห็นผู้ให้บริการ/โมเดลเดียวกับที่ runner กำลังจะใช้ override ของโมเดลที่บันทึกไว้จะถูกทำเครื่องหมายเป็น `modelOverrideSource: "auto"`
  </Step>
  <Step title="Roll back narrowly on failure">
    หากตัวเลือก fallback ล้มเหลว ให้ย้อนกลับเฉพาะฟิลด์ override ของเซสชันที่เป็นของ fallback เมื่อฟิลด์เหล่านั้นยังคงตรงกับตัวเลือกที่ล้มเหลวนั้น
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    หากทุกตัวเลือกล้มเหลว ให้ throw `FallbackSummaryError` พร้อมรายละเอียดรายความพยายามและเวลาหมดอายุคูลดาวน์ที่เร็วที่สุดเมื่อทราบค่า
  </Step>
</Steps>

นี่ตั้งใจให้แคบกว่า "บันทึกและกู้คืนทั้งเซสชัน" reply runner จะบันทึกเฉพาะฟิลด์การเลือกโมเดลที่ตนเองเป็นเจ้าของสำหรับ fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

วิธีนี้ป้องกันไม่ให้การ retry fallback ที่ล้มเหลวเขียนทับการเปลี่ยนแปลงเซสชันอื่นที่ใหม่กว่าและไม่เกี่ยวข้อง เช่น การเปลี่ยน `/model` ด้วยตนเอง หรือการอัปเดตการหมุนเวียนเซสชันที่เกิดขึ้นระหว่างที่ความพยายามนั้นกำลังรัน

## นโยบายแหล่งที่มาของการเลือก

OpenClaw แยกผู้ให้บริการ/โมเดลที่เลือกออกจากเหตุผลที่ถูกเลือก แหล่งที่มานั้นควบคุมว่าอนุญาตให้ใช้ลำดับ fallback หรือไม่:

- **ค่าเริ่มต้นที่กำหนดไว้**: `agents.defaults.model.primary` ใช้ `agents.defaults.model.fallbacks`
- **โมเดลหลักของ agent**: `agents.list[].model` จะเข้มงวด เว้นแต่ว่าอ็อบเจกต์โมเดลของ agent นั้นมี `fallbacks` ของตัวเอง ใช้ `fallbacks: []` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน หรือระบุรายการที่ไม่ว่างเพื่อให้ agent นั้นเลือกใช้ model fallback
- **Auto fallback override**: fallback ขณะรันไทม์จะเขียน `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` และโมเดลต้นทางที่เลือกไว้ก่อน retry auto override นั้นสามารถเดินต่อไปตามลำดับ fallback ที่กำหนดไว้ และจะถูกล้างโดย `/new`, `/reset` และ `sessions.reset` การรัน Heartbeat ที่ไม่มี `heartbeat.model` อย่างชัดเจนจะล้าง direct auto override ด้วยเมื่อ origin ของมันไม่ตรงกับค่าเริ่มต้นที่กำหนดไว้ในปัจจุบันอีกต่อไป
- **User session override**: `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` จะเขียน `modelOverrideSource: "user"` นี่คือการเลือกเซสชันแบบตรงตัว หากผู้ให้บริการ/โมเดลที่เลือกไว้ล้มเหลวก่อนสร้างคำตอบ OpenClaw จะรายงานความล้มเหลวแทนการตอบจาก fallback ที่กำหนดไว้ซึ่งไม่เกี่ยวข้อง
- **Legacy session override**: รายการเซสชันรุ่นเก่าอาจมี `modelOverride` โดยไม่มี `modelOverrideSource` OpenClaw ถือว่ารายการเหล่านั้นเป็น user override เพื่อไม่ให้การเลือกเก่าอย่างชัดเจนถูกแปลงเป็นพฤติกรรม fallback โดยเงียบ
- **โมเดล payload ของ Cron**: `payload.model` / `--model` ของงาน cron คือโมเดลหลักของงาน ไม่ใช่ user session override โมเดลนี้ใช้ fallback ที่กำหนดไว้ เว้นแต่งานจะระบุ `payload.fallbacks`; `payload.fallbacks: []` ทำให้การรัน cron เข้มงวด

## ที่เก็บการยืนยันตัวตน (คีย์ + OAuth)

OpenClaw ใช้ **โปรไฟล์การยืนยันตัวตน** สำหรับทั้ง API keys และ OAuth tokens

- ความลับอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (แบบเดิม: `~/.openclaw/agent/auth-profiles.json`)
- สถานะการกำหนดเส้นทางการยืนยันตัวตนขณะรันไทม์อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-state.json`
- Config `auth.profiles` / `auth.order` เป็น **เมทาดาทา + การกำหนดเส้นทางเท่านั้น** (ไม่มีความลับ)
- ไฟล์ OAuth แบบเดิมที่ใช้สำหรับนำเข้าเท่านั้น: `~/.openclaw/credentials/oauth.json` (นำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

รายละเอียดเพิ่มเติม: [OAuth](/th/concepts/oauth)

ประเภทข้อมูลรับรอง:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` สำหรับผู้ให้บริการบางราย)

## ID โปรไฟล์

การเข้าสู่ระบบ OAuth จะสร้างโปรไฟล์แยกกันเพื่อให้หลายบัญชีอยู่ร่วมกันได้

- ค่าเริ่มต้น: `provider:default` เมื่อไม่มีอีเมล
- OAuth พร้อมอีเมล: `provider:<email>` (เช่น `google-antigravity:user@gmail.com`)

โปรไฟล์อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ภายใต้ `profiles`

## ลำดับการหมุนเวียน

เมื่อผู้ให้บริการมีหลายโปรไฟล์ OpenClaw จะเลือกลำดับดังนี้:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (หากตั้งค่าไว้)
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` ที่กรองตามผู้ให้บริการ
  </Step>
  <Step title="Stored profiles">
    รายการใน `auth-profiles.json` สำหรับผู้ให้บริการ
  </Step>
</Steps>

หากไม่ได้กำหนดลำดับไว้อย่างชัดเจน OpenClaw จะใช้ลำดับแบบ round-robin:

- **คีย์หลัก:** ประเภทโปรไฟล์ (**OAuth ก่อน API keys**)
- **คีย์รอง:** `usageStats.lastUsed` (เก่าที่สุดก่อน ภายในแต่ละประเภท)
- **โปรไฟล์ที่อยู่ในคูลดาวน์/ถูกปิดใช้งาน** จะถูกย้ายไปท้ายสุด เรียงตามเวลาหมดอายุที่เร็วที่สุด

### การยึดติดกับเซสชัน (เป็นมิตรกับแคช)

OpenClaw **ปักหมุดโปรไฟล์การยืนยันตัวตนที่เลือกต่อเซสชัน** เพื่อให้แคชของผู้ให้บริการยังอุ่นอยู่ OpenClaw **ไม่** หมุนเวียนทุกคำขอ โปรไฟล์ที่ปักหมุดจะถูกใช้ซ้ำจนกว่า:

- เซสชันถูกรีเซ็ต (`/new` / `/reset`)
- Compaction เสร็จสมบูรณ์ (ตัวนับ compaction เพิ่มขึ้น)
- โปรไฟล์อยู่ในคูลดาวน์/ถูกปิดใช้งาน

การเลือกด้วยตนเองผ่าน `/model …@<profileId>` จะตั้งค่า **user override** สำหรับเซสชันนั้น และจะไม่ถูกหมุนเวียนอัตโนมัติจนกว่าจะเริ่มเซสชันใหม่

<Note>
โปรไฟล์ที่ปักหมุดอัตโนมัติ (เลือกโดย session router) จะถูกถือเป็น **ค่ากำหนด**: จะถูกลองก่อน แต่ OpenClaw อาจหมุนเวียนไปยังโปรไฟล์อื่นเมื่อมี rate limit/timeout เมื่อโปรไฟล์เดิมกลับมาใช้งานได้อีกครั้ง การรันใหม่สามารถเลือกใช้โปรไฟล์นั้นอีกครั้งได้โดยไม่ต้องเปลี่ยนโมเดลหรือรันไทม์ที่เลือกไว้ โปรไฟล์ที่ผู้ใช้ปักหมุดจะล็อกอยู่กับโปรไฟล์นั้น หากล้มเหลวและมีการกำหนด model fallback ไว้ OpenClaw จะย้ายไปยังโมเดลถัดไปแทนการสลับโปรไฟล์
</Note>

### การสมัครใช้งาน OpenAI Codex พร้อม API-key สำรอง

สำหรับโมเดล agent ของ OpenAI การยืนยันตัวตนและรันไทม์แยกจากกัน `openai/gpt-*` ยังคงอยู่บน
Codex harness ขณะที่การยืนยันตัวตนสามารถหมุนเวียนระหว่างโปรไฟล์การสมัครใช้งาน Codex และ
API-key สำรองของ OpenAI ได้

ใช้ `auth.order.openai` สำหรับลำดับที่ผู้ใช้เห็น:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

โปรไฟล์การสมัครใช้งาน Codex ที่มีอยู่แล้วอาจยังใช้
ID โปรไฟล์แบบเดิม `openai-codex:*` API-key สำรองที่จัดลำดับไว้สามารถเป็นโปรไฟล์ API-key
`openai:*` ปกติได้ เมื่อการสมัครใช้งานถึงขีดจำกัดการใช้งาน Codex
OpenClaw จะบันทึกเวลา reset ที่แน่นอนเมื่อ Codex ให้มา ลองใช้โปรไฟล์การยืนยันตัวตนถัดไป
ตามลำดับ และคงการรันไว้ภายใน Codex harness เมื่อเวลา reset
ผ่านไปแล้ว โปรไฟล์การสมัครใช้งานจะมีสิทธิ์ใช้งานอีกครั้ง และการเลือกอัตโนมัติครั้งถัดไป
สามารถกลับไปใช้โปรไฟล์นั้นได้

ใช้โปรไฟล์ที่ผู้ใช้ปักหมุดเฉพาะเมื่อคุณต้องการบังคับใช้บัญชี/คีย์หนึ่งสำหรับ
เซสชันนั้น โปรไฟล์ที่ผู้ใช้ปักหมุดตั้งใจให้เข้มงวดและจะไม่กระโดด
ไปยังโปรไฟล์อื่นโดยเงียบ

## คูลดาวน์

เมื่อโปรไฟล์ล้มเหลวเนื่องจากข้อผิดพลาดการยืนยันตัวตน/rate-limit (หรือ timeout ที่ดูเหมือน rate limiting) OpenClaw จะทำเครื่องหมายว่าอยู่ในคูลดาวน์และย้ายไปยังโปรไฟล์ถัดไป

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    กลุ่ม rate-limit นั้นกว้างกว่า `429` ธรรมดา: ยังรวมข้อความจากผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` และขีดจำกัด usage-window เป็นรอบ เช่น `weekly/monthly limit reached`

    ข้อผิดพลาด format/invalid-request มักเป็นแบบสิ้นสุด เพราะการ retry payload เดิมจะล้มเหลวแบบเดิม ดังนั้น OpenClaw จะแสดงข้อผิดพลาดเหล่านั้นแทนการหมุนเวียนโปรไฟล์การยืนยันตัวตน เส้นทาง retry-repair ที่ทราบสามารถเลือกใช้ได้อย่างชัดเจน: เช่น ความล้มเหลวของการตรวจสอบ ID การเรียก tool ของ Cloud Code Assist จะถูก sanitize และ retry หนึ่งครั้งผ่านนโยบาย `allowFormatRetry` ข้อผิดพลาด stop-reason ที่เข้ากันได้กับ OpenAI เช่น `Unhandled stop reason: error`, `stop reason: error` และ `reason: error` จะถูกจัดประเภทเป็นสัญญาณ timeout/failover

    ข้อความเซิร์ฟเวอร์ทั่วไปอาจถูกจัดอยู่ในกลุ่ม timeout นั้นด้วยเมื่อแหล่งที่มาตรงกับรูปแบบชั่วคราวที่ทราบ เช่น ข้อความ stream-wrapper แบบเปล่าของ pi-ai `An unknown error occurred` จะถูกถือว่าควร failover สำหรับผู้ให้บริการทุกเจ้า เพราะ pi-ai ส่งข้อความนี้เมื่อสตรีมของผู้ให้บริการจบด้วย `stopReason: "aborted"` หรือ `stopReason: "error"` โดยไม่มีรายละเอียดเฉพาะ payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว เช่น `internal server error`, `unknown error, 520`, `upstream error` หรือ `backend error` ก็ถือเป็น timeout ที่ควร failover เช่นกัน

    ข้อความ upstream ทั่วไปเฉพาะ OpenRouter เช่น `Provider returned error` แบบเปล่าจะถือเป็น timeout เฉพาะเมื่อบริบทของผู้ให้บริการเป็น OpenRouter จริงๆ ข้อความ fallback ภายในทั่วไป เช่น `LLM request failed with an unknown error.` ยังคงใช้แนวทางอนุรักษ์นิยมและไม่ trigger failover ด้วยตัวเอง

  </Accordion>
  <Accordion title="SDK retry-after caps">
    SDK ของผู้ให้บริการบางตัวอาจ sleep เป็นเวลา `Retry-After` ที่ยาวนานก่อนคืนการควบคุมให้ OpenClaw สำหรับ SDK ที่อิง Stainless เช่น Anthropic และ OpenAI OpenClaw จะจำกัดการรอ `retry-after-ms` / `retry-after` ภายใน SDK ไว้ที่ 60 วินาทีโดยค่าเริ่มต้น และแสดงผล response ที่ retry ได้ซึ่งยาวกว่านั้นทันที เพื่อให้เส้นทาง failover นี้รันได้ ปรับแต่งหรือปิด cap ด้วย `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; ดู [พฤติกรรมการ retry](/th/concepts/retry)
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    คูลดาวน์ rate-limit สามารถจำกัดขอบเขตตามโมเดลได้เช่นกัน:

    - OpenClaw บันทึก `cooldownModel` สำหรับความล้มเหลว rate-limit เมื่อทราบ ID โมเดลที่ล้มเหลว
    - โมเดลพี่น้องบนผู้ให้บริการเดียวกันยังสามารถลองได้เมื่อคูลดาวน์ถูกจำกัดขอบเขตไว้กับโมเดลอื่น
    - หน้าต่าง billing/disabled ยังคงบล็อกทั้งโปรไฟล์ข้ามโมเดล

  </Accordion>
</AccordionGroup>

คูลดาวน์ใช้ exponential backoff:

- 1 นาที
- 5 นาที
- 25 นาที
- 1 ชั่วโมง (cap)

สถานะถูกเก็บใน `auth-state.json` ภายใต้ `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## การปิดใช้งานจาก billing

ความล้มเหลวด้าน billing/credit (เช่น "insufficient credits" / "credit balance too low") จะถูกถือว่าควร failover แต่โดยปกติไม่ใช่เรื่องชั่วคราว แทนที่จะใช้คูลดาวน์สั้นๆ OpenClaw จะทำเครื่องหมายโปรไฟล์เป็น **disabled** (พร้อม backoff ที่ยาวกว่า) และหมุนเวียนไปยังโปรไฟล์/ผู้ให้บริการถัดไป

<Note>
ไม่ใช่ทุก response ที่มีลักษณะ billing จะเป็น `402` และไม่ใช่ทุก HTTP `402` จะเข้ามาในส่วนนี้ OpenClaw คงข้อความ billing ที่ชัดเจนไว้ในเลน billing แม้ผู้ให้บริการจะคืน `401` หรือ `403` แทน แต่ matcher เฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของ matcher นั้น (เช่น OpenRouter `403 Key limit exceeded`)

ระหว่างนี้ ข้อผิดพลาดชั่วคราว `402` สำหรับหน้าต่างการใช้งานและขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซจะถูกจัดประเภทเป็น `rate_limit` เมื่อข้อความดูเหมือนลองใหม่ได้ (เช่น `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` หรือ `organization spending limit exceeded`) รายการเหล่านี้จะอยู่บนเส้นทางคูลดาวน์/เฟลโอเวอร์สั้น แทนที่จะเป็นเส้นทางปิดใช้งานการเรียกเก็บเงินแบบยาว
</Note>

สถานะถูกจัดเก็บใน `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

ค่าเริ่มต้น:

- แบ็กออฟของการเรียกเก็บเงินเริ่มที่ **5 ชั่วโมง** เพิ่มเป็นสองเท่าต่อความล้มเหลวของการเรียกเก็บเงินแต่ละครั้ง และจำกัดสูงสุดที่ **24 ชั่วโมง**
- ตัวนับแบ็กออฟจะรีเซ็ตหากโปรไฟล์ไม่ล้มเหลวเป็นเวลา **24 ชั่วโมง** (กำหนดค่าได้)
- การลองใหม่เมื่อโอเวอร์โหลดอนุญาตให้ **หมุนเวียนโปรไฟล์ภายในผู้ให้บริการเดียวกัน 1 ครั้ง** ก่อน fallback โมเดล
- การลองใหม่เมื่อโอเวอร์โหลดใช้แบ็กออฟ **0 ms** ตามค่าเริ่มต้น

## fallback โมเดล

หากโปรไฟล์ทั้งหมดของผู้ให้บริการล้มเหลว OpenClaw จะย้ายไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks` สิ่งนี้ใช้กับความล้มเหลวของการยืนยันตัวตน ขีดจำกัดอัตรา และการหมดเวลาที่ใช้การหมุนเวียนโปรไฟล์จนหมดแล้ว (ข้อผิดพลาดอื่นจะไม่เลื่อน fallback) ข้อผิดพลาดของผู้ให้บริการที่ไม่เปิดเผยรายละเอียดเพียงพอยังคงถูกติดป้ายอย่างแม่นยำในสถานะ fallback: `empty_response` หมายความว่าผู้ให้บริการไม่ได้ส่งข้อความหรือสถานะที่ใช้งานได้กลับมา, `no_error_details` หมายความว่าผู้ให้บริการส่งกลับมาอย่างชัดเจนว่า `Unknown error (no error details in response)`, และ `unclassified` หมายความว่า OpenClaw เก็บพรีวิวดิบไว้ แต่ยังไม่มีตัวจัดประเภทใดตรงกับมัน

ข้อผิดพลาดโอเวอร์โหลดและขีดจำกัดอัตราจะถูกจัดการเชิงรุกกว่าคูลดาวน์การเรียกเก็บเงิน ตามค่าเริ่มต้น OpenClaw อนุญาตให้ลองใหม่ด้วยโปรไฟล์ยืนยันตัวตนของผู้ให้บริการเดียวกันหนึ่งครั้ง จากนั้นสลับไปยัง fallback โมเดลถัดไปที่กำหนดค่าไว้โดยไม่รอ สัญญาณผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะอยู่ในกลุ่มโอเวอร์โหลดนั้น ปรับค่านี้ได้ด้วย `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` และ `auth.cooldowns.rateLimitedProfileRotations`

เมื่อการรันเริ่มจากค่าเริ่มต้นหลักที่กำหนดค่าไว้, ค่าหลักของงาน cron, ค่าหลักของ agent ที่มี fallback ชัดเจน, หรือการ override fallback ที่เลือกอัตโนมัติ OpenClaw สามารถเดินตามสาย fallback ที่กำหนดค่าไว้ซึ่งตรงกันได้ ค่าหลักของ agent ที่ไม่มี fallback ชัดเจนและการเลือกของผู้ใช้โดยตรง (เช่น `/model ollama/qwen3.5:27b`, ตัวเลือกโมเดล, `sessions.patch` หรือการ override ผู้ให้บริการ/โมเดลแบบครั้งเดียวผ่าน CLI) เป็นแบบเคร่งครัด: หากผู้ให้บริการ/โมเดลนั้นเข้าถึงไม่ได้หรือล้มเหลวก่อนสร้างคำตอบ OpenClaw จะรายงานความล้มเหลวแทนที่จะตอบจาก fallback ที่ไม่เกี่ยวข้อง

### กฎของสาย candidate

OpenClaw สร้างรายการ candidate จาก `provider/model` ที่ถูกร้องขอในปัจจุบัน พร้อม fallback ที่กำหนดค่าไว้

<AccordionGroup>
  <Accordion title="Rules">
    - โมเดลที่ถูกร้องขอจะอยู่ลำดับแรกเสมอ
    - fallback ที่กำหนดค่าไว้อย่างชัดเจนจะถูกตัดรายการซ้ำออก แต่ไม่ถูกกรองด้วย allowlist ของโมเดล รายการเหล่านี้ถือเป็นเจตนาของผู้ปฏิบัติงานอย่างชัดเจน
    - หากการรันปัจจุบันอยู่บน fallback ที่กำหนดค่าไว้แล้วในตระกูลผู้ให้บริการเดียวกัน OpenClaw จะยังใช้สายที่กำหนดค่าไว้ทั้งหมดต่อไป
    - เมื่อไม่ได้ส่ง fallback override ชัดเจนมา fallback ที่กำหนดค่าไว้จะถูกลองก่อนค่าหลักที่กำหนดค่าไว้ แม้ว่าโมเดลที่ถูกร้องขอจะใช้ผู้ให้บริการคนละราย
    - เมื่อไม่ได้ส่ง fallback override ชัดเจนให้ตัวรัน fallback ค่าหลักที่กำหนดค่าไว้จะถูกต่อท้าย เพื่อให้สายสามารถกลับไปอยู่ที่ค่าเริ่มต้นปกติได้เมื่อ candidate ก่อนหน้าถูกใช้จนหมด
    - เมื่อผู้เรียกส่ง `fallbacksOverride` ตัวรันจะใช้เฉพาะโมเดลที่ถูกร้องขอพร้อมรายการ override นั้น รายการว่างจะปิดใช้งาน fallback โมเดล และป้องกันไม่ให้ค่าหลักที่กำหนดค่าไว้ถูกต่อท้ายเป็นเป้าหมายลองใหม่แบบซ่อน

  </Accordion>
</AccordionGroup>

### ข้อผิดพลาดใดที่เลื่อน fallback

<Tabs>
  <Tab title="Continues on">
    - ความล้มเหลวของการยืนยันตัวตน
    - ขีดจำกัดอัตราและการใช้คูลดาวน์จนหมด
    - ข้อผิดพลาดโอเวอร์โหลด/ผู้ให้บริการไม่ว่าง
    - ข้อผิดพลาดเฟลโอเวอร์ที่มีลักษณะเหมือนการหมดเวลา
    - การปิดใช้งานการเรียกเก็บเงิน
    - `LiveSessionModelSwitchError` ซึ่งถูกปรับให้อยู่ในเส้นทางเฟลโอเวอร์ เพื่อไม่ให้โมเดลที่คงอยู่เก่าแล้วสร้างลูปลองใหม่ชั้นนอก
    - ข้อผิดพลาดอื่นที่ไม่รู้จักเมื่อยังมี candidate เหลืออยู่

  </Tab>
  <Tab title="Does not continue on">
    - การยกเลิกอย่างชัดเจนที่ไม่ได้มีลักษณะเหมือนการหมดเวลา/เฟลโอเวอร์
    - ข้อผิดพลาด context overflow ที่ควรอยู่ภายในตรรกะ compaction/ลองใหม่ (เช่น `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` หรือ `ollama error: context length exceeded`)
    - ข้อผิดพลาดไม่รู้จักขั้นสุดท้ายเมื่อไม่มี candidate เหลืออยู่

  </Tab>
</Tabs>

### พฤติกรรมการข้ามคูลดาวน์เทียบกับการ probe

เมื่อโปรไฟล์ยืนยันตัวตนทุกโปรไฟล์สำหรับผู้ให้บริการอยู่ในคูลดาวน์แล้ว OpenClaw จะไม่ข้ามผู้ให้บริการนั้นตลอดไปโดยอัตโนมัติ แต่จะตัดสินใจแยกตาม candidate:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - ความล้มเหลวของการยืนยันตัวตนแบบคงอยู่จะข้ามผู้ให้บริการทั้งหมดทันที
    - การปิดใช้งานการเรียกเก็บเงินมักถูกข้าม แต่ candidate หลักยังสามารถถูก probe ตามการ throttle เพื่อให้กู้คืนได้โดยไม่ต้องรีสตาร์ต
    - candidate หลักอาจถูก probe ใกล้เวลาหมดอายุคูลดาวน์ โดยมีการ throttle แยกตามผู้ให้บริการ
    - fallback sibling ภายในผู้ให้บริการเดียวกันสามารถถูกลองได้แม้อยู่ในคูลดาวน์ เมื่อความล้มเหลวดูเป็นแบบชั่วคราว (`rate_limit`, `overloaded` หรือไม่รู้จัก) สิ่งนี้สำคัญเป็นพิเศษเมื่อขีดจำกัดอัตราผูกกับขอบเขตโมเดล และโมเดล sibling อาจยังฟื้นตัวได้ทันที
    - probe คูลดาวน์แบบชั่วคราวถูกจำกัดไว้ที่หนึ่งครั้งต่อผู้ให้บริการต่อการรัน fallback เพื่อไม่ให้ผู้ให้บริการรายเดียวทำให้ fallback ข้ามผู้ให้บริการหยุดชะงัก

  </Accordion>
</AccordionGroup>

## การ override เซสชันและการสลับโมเดลสด

การเปลี่ยนโมเดลของเซสชันเป็นสถานะร่วม ตัวรันที่ใช้งานอยู่, คำสั่ง `/model`, การอัปเดต compaction/เซสชัน และการปรับสถานะเซสชันสดให้ตรงกัน ล้วนอ่านหรือเขียนบางส่วนของรายการเซสชันเดียวกัน

นั่นหมายความว่าการลองใหม่ด้วย fallback ต้องประสานกับการสลับโมเดลสด:

- เฉพาะการเปลี่ยนโมเดลที่ผู้ใช้ขับเคลื่อนอย่างชัดเจนเท่านั้นที่จะทำเครื่องหมายการสลับสดที่รอดำเนินการ ซึ่งรวมถึง `/model`, `session_status(model=...)` และ `sessions.patch`
- การเปลี่ยนโมเดลที่ระบบขับเคลื่อน เช่น การหมุนเวียน fallback, การ override heartbeat หรือ compaction จะไม่ทำเครื่องหมายการสลับสดที่รอดำเนินการด้วยตัวเอง
- การ override โมเดลที่ผู้ใช้ขับเคลื่อนถือเป็นการเลือกที่เจาะจงสำหรับนโยบาย fallback ดังนั้นผู้ให้บริการที่เลือกไว้แต่เข้าถึงไม่ได้จะแสดงเป็นความล้มเหลว แทนที่จะถูกปิดบังด้วย `agents.defaults.model.fallbacks`
- ก่อนที่การลองใหม่ด้วย fallback จะเริ่ม ตัวรันคำตอบจะคงค่าฟิลด์ fallback override ที่เลือกไว้ลงในรายการเซสชัน
- การ override fallback อัตโนมัติจะยังถูกเลือกไว้ในเทิร์นถัดไป เพื่อให้ OpenClaw ไม่ probe ค่าหลักที่ทราบว่าเสียในทุกข้อความ `/new`, `/reset` และ `sessions.reset` จะล้าง override ที่มาจากอัตโนมัติและพาเซสชันกลับไปยังค่าเริ่มต้นที่กำหนดค่าไว้
- `/status` แสดงโมเดลที่เลือก และเมื่อสถานะ fallback แตกต่างกัน จะแสดงโมเดล fallback ที่ใช้งานอยู่พร้อมเหตุผล
- การปรับสถานะเซสชันสดให้ตรงกันจะให้ความสำคัญกับ override เซสชันที่คงอยู่มากกว่าฟิลด์โมเดลรันไทม์ที่เก่าแล้ว
- หากข้อผิดพลาดการสลับสดชี้ไปยัง candidate ถัดไปในสาย fallback ที่ใช้งานอยู่ OpenClaw จะกระโดดไปยังโมเดลที่เลือกนั้นโดยตรง แทนที่จะเดินผ่าน candidate ที่ไม่เกี่ยวข้องก่อน
- หากการลอง fallback ล้มเหลว ตัวรันจะย้อนกลับเฉพาะฟิลด์ override ที่ตัวเองเขียน และเฉพาะเมื่อฟิลด์เหล่านั้นยังตรงกับ candidate ที่ล้มเหลวนั้น

สิ่งนี้ป้องกัน race แบบคลาสสิก:

<Steps>
  <Step title="Primary fails">
    โมเดลหลักที่เลือกไว้ล้มเหลว
  </Step>
  <Step title="Fallback chosen in memory">
    candidate fallback ถูกเลือกในหน่วยความจำ
  </Step>
  <Step title="Session store still says old primary">
    ที่เก็บเซสชันยังคงสะท้อนค่าหลักเดิม
  </Step>
  <Step title="Live reconciliation reads stale state">
    การปรับสถานะเซสชันสดให้ตรงกันอ่านสถานะเซสชันที่เก่าแล้ว
  </Step>
  <Step title="Retry snapped back">
    การลองใหม่ถูกดึงกลับไปยังโมเดลเดิมก่อนที่การลอง fallback จะเริ่ม
  </Step>
</Steps>

fallback override ที่คงอยู่จะปิดหน้าต่างนั้น และการย้อนกลับแบบแคบจะรักษาการเปลี่ยนเซสชันแบบแมนนวลหรือรันไทม์ที่ใหม่กว่าไว้ครบถ้วน

## การสังเกตการณ์และสรุปความล้มเหลว

`runWithModelFallback(...)` บันทึกรายละเอียดรายความพยายามที่ป้อนเข้าสู่ล็อกและข้อความคูลดาวน์ที่แสดงต่อผู้ใช้:

- ผู้ให้บริการ/โมเดลที่ลอง
- เหตุผล (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` และเหตุผลเฟลโอเวอร์ที่คล้ายกัน)
- สถานะ/โค้ดที่เป็นทางเลือก
- สรุปข้อผิดพลาดที่มนุษย์อ่านได้

ล็อก `model_fallback_decision` แบบมีโครงสร้างยังรวมฟิลด์ `fallbackStep*` แบบแบน เมื่อ candidate ล้มเหลว ถูกข้าม หรือ fallback ถัดไปสำเร็จ ฟิลด์เหล่านี้ทำให้การเปลี่ยนผ่านที่ลองชัดเจน (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) เพื่อให้ตัวส่งออกล็อกและการวินิจฉัยสามารถสร้างความล้มเหลวของค่าหลักขึ้นใหม่ได้ แม้ fallback ปลายทางจะล้มเหลวด้วยก็ตาม

เมื่อ candidate ทุกตัวล้มเหลว OpenClaw จะโยน `FallbackSummaryError` ตัวรันคำตอบชั้นนอกสามารถใช้สิ่งนั้นเพื่อสร้างข้อความที่เฉพาะเจาะจงขึ้น เช่น "โมเดลทั้งหมดถูกจำกัดอัตราชั่วคราว" และรวมเวลาหมดอายุคูลดาวน์ที่เร็วที่สุดเมื่อทราบ

สรุปคูลดาวน์นั้นรับรู้ตามโมเดล:

- ขีดจำกัดอัตราที่ผูกกับขอบเขตโมเดลซึ่งไม่เกี่ยวข้องจะถูกละเว้นสำหรับสายผู้ให้บริการ/โมเดลที่ลอง
- หากบล็อกที่เหลือเป็นขีดจำกัดอัตราที่ผูกกับขอบเขตโมเดลซึ่งตรงกัน OpenClaw จะรายงานเวลาหมดอายุล่าสุดที่ตรงกันและยังคงบล็อกโมเดลนั้น

## การกำหนดค่าที่เกี่ยวข้อง

ดู [การกำหนดค่า Gateway](/th/gateway/configuration) สำหรับ:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- การกำหนดเส้นทาง `agents.defaults.imageModel`

ดู [โมเดล](/th/concepts/models) สำหรับภาพรวมการเลือกโมเดลและ fallback ที่กว้างขึ้น
