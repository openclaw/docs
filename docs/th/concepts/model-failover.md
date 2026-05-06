---
read_when:
    - การวินิจฉัยการหมุนเวียนโปรไฟล์การยืนยันตัวตน ช่วงพักรอ หรือพฤติกรรมการใช้โมเดลสำรอง
    - การอัปเดตกฎการเฟลโอเวอร์สำหรับโปรไฟล์การตรวจสอบสิทธิ์หรือโมเดล
    - ทำความเข้าใจว่าการกำหนดทับโมเดลระดับเซสชันมีปฏิสัมพันธ์กับการลองใหม่โดยถอยกลับไปใช้ตัวสำรองอย่างไร
sidebarTitle: Model failover
summary: วิธีที่ OpenClaw หมุนเวียนโปรไฟล์การยืนยันตัวตนและสลับไปใช้โมเดลสำรอง
title: การสลับไปใช้โมเดลสำรอง
x-i18n:
    generated_at: "2026-05-06T09:09:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw จัดการความล้มเหลวเป็นสองขั้นตอน:

1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการปัจจุบัน
2. **การสำรองโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

เอกสารนี้อธิบายกฎขณะรันและข้อมูลที่รองรับกฎเหล่านั้น

## โฟลว์ขณะรัน

สำหรับการรันข้อความปกติ OpenClaw จะประเมินตัวเลือกตามลำดับนี้:

<Steps>
  <Step title="Resolve session state">
    แก้ไขสถานะโมเดลเซสชันที่ใช้งานอยู่และการตั้งค่าโปรไฟล์การยืนยันตัวตน
  </Step>
  <Step title="Build candidate chain">
    สร้างสายตัวเลือกโมเดลจากการเลือกโมเดลปัจจุบันและนโยบายการสำรองสำหรับแหล่งที่มาของการเลือกนั้น ค่าเริ่มต้นที่กำหนดไว้ โมเดลหลักของงาน cron และโมเดลสำรองที่เลือกอัตโนมัติสามารถใช้รายการสำรองที่กำหนดไว้ได้ ส่วนการเลือกเซสชันโดยผู้ใช้อย่างชัดเจนจะเข้มงวด
  </Step>
  <Step title="Try the current provider">
    ลองใช้ผู้ให้บริการปัจจุบันพร้อมกฎการหมุนเวียน/คูลดาวน์โปรไฟล์การยืนยันตัวตน
  </Step>
  <Step title="Advance on failover-worthy errors">
    หากผู้ให้บริการนั้นถูกใช้จนหมดด้วยข้อผิดพลาดที่ควรสลับไปใช้ตัวสำรอง ให้ย้ายไปยังตัวเลือกโมเดลถัดไป
  </Step>
  <Step title="Persist fallback override">
    บันทึก override ของตัวสำรองที่เลือกไว้ก่อนเริ่มลองใหม่ เพื่อให้ตัวอ่านเซสชันอื่นเห็นผู้ให้บริการ/โมเดลเดียวกับที่ runner กำลังจะใช้ override โมเดลที่บันทึกไว้จะถูกทำเครื่องหมายเป็น `modelOverrideSource: "auto"`
  </Step>
  <Step title="Roll back narrowly on failure">
    หากตัวเลือกสำรองล้มเหลว ให้ย้อนกลับเฉพาะฟิลด์ override ของเซสชันที่ตัวสำรองเป็นเจ้าของ เมื่อฟิลด์เหล่านั้นยังตรงกับตัวเลือกที่ล้มเหลวนั้น
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    หากทุกตัวเลือกล้มเหลว ให้โยน `FallbackSummaryError` พร้อมรายละเอียดต่อการพยายามแต่ละครั้งและเวลาสิ้นสุดคูลดาวน์ที่เร็วที่สุดเมื่อทราบ
  </Step>
</Steps>

สิ่งนี้ตั้งใจให้แคบกว่า "บันทึกและกู้คืนทั้งเซสชัน" reply runner จะบันทึกเฉพาะฟิลด์การเลือกโมเดลที่ตนเป็นเจ้าของสำหรับการสำรอง:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

วิธีนี้ป้องกันไม่ให้การลองสำรองที่ล้มเหลวเขียนทับการเปลี่ยนแปลงเซสชันอื่นที่ใหม่กว่าและไม่เกี่ยวข้อง เช่น การเปลี่ยน `/model` ด้วยตนเองหรือการอัปเดตการหมุนเวียนเซสชันที่เกิดขึ้นระหว่างที่การพยายามกำลังทำงานอยู่

## นโยบายแหล่งที่มาของการเลือก

OpenClaw แยกผู้ให้บริการ/โมเดลที่เลือกออกจากเหตุผลที่เลือก แหล่งที่มานั้นควบคุมว่าจะอนุญาตให้ใช้สายสำรองหรือไม่:

- **ค่าเริ่มต้นที่กำหนดไว้**: `agents.defaults.model.primary` ใช้ `agents.defaults.model.fallbacks`
- **โมเดลหลักของ agent**: `agents.list[].model` จะเข้มงวด เว้นแต่ว่าออบเจ็กต์โมเดลของ agent นั้นมี `fallbacks` ของตัวเอง ใช้ `fallbacks: []` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน หรือระบุรายการที่ไม่ว่างเพื่อเลือกให้ agent นั้นใช้การสำรองโมเดล
- **override ตัวสำรองอัตโนมัติ**: ตัวสำรองขณะรันจะเขียน `providerOverride`, `modelOverride` และ `modelOverrideSource: "auto"` ก่อนลองใหม่ override อัตโนมัตินั้นสามารถเดินต่อไปตามสายสำรองที่กำหนดไว้ และจะถูกล้างโดย `/new`, `/reset` และ `sessions.reset`
- **override เซสชันของผู้ใช้**: `/model`, ตัวเลือกโมเดล, `session_status(model=...)` และ `sessions.patch` เขียน `modelOverrideSource: "user"` นั่นคือการเลือกเซสชันแบบแน่นอน หากผู้ให้บริการ/โมเดลที่เลือกล้มเหลวก่อนสร้างคำตอบ OpenClaw จะรายงานความล้มเหลวแทนการตอบจากตัวสำรองที่กำหนดไว้ซึ่งไม่เกี่ยวข้อง
- **override เซสชันแบบเดิม**: รายการเซสชันรุ่นเก่าอาจมี `modelOverride` โดยไม่มี `modelOverrideSource` OpenClaw ถือว่าสิ่งเหล่านั้นเป็น override ของผู้ใช้ เพื่อไม่ให้การเลือกเก่าที่ชัดเจนถูกแปลงเป็นพฤติกรรมสำรองอย่างเงียบๆ
- **โมเดล payload ของ Cron**: `payload.model` / `--model` ของงาน cron เป็นโมเดลหลักของงาน ไม่ใช่ override เซสชันของผู้ใช้ ใช้รายการสำรองที่กำหนดไว้ เว้นแต่งานจะระบุ `payload.fallbacks`; `payload.fallbacks: []` ทำให้การรัน cron เข้มงวด

## พื้นที่จัดเก็บการยืนยันตัวตน (คีย์ + OAuth)

OpenClaw ใช้ **โปรไฟล์การยืนยันตัวตน** สำหรับทั้ง API keys และโทเค็น OAuth

- ความลับอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (เดิม: `~/.openclaw/agent/auth-profiles.json`)
- สถานะการกำหนดเส้นทางการยืนยันตัวตนขณะรันอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-state.json`
- การตั้งค่า `auth.profiles` / `auth.order` เป็น **เมทาดาทา + การกำหนดเส้นทางเท่านั้น** (ไม่มีความลับ)
- ไฟล์ OAuth เดิมสำหรับนำเข้าเท่านั้น: `~/.openclaw/credentials/oauth.json` (นำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

รายละเอียดเพิ่มเติม: [OAuth](/th/concepts/oauth)

ประเภทข้อมูลรับรอง:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` สำหรับผู้ให้บริการบางราย)

## ID โปรไฟล์

การเข้าสู่ระบบ OAuth สร้างโปรไฟล์แยกกันเพื่อให้หลายบัญชีอยู่ร่วมกันได้

- ค่าเริ่มต้น: `provider:default` เมื่อไม่มีอีเมล
- OAuth พร้อมอีเมล: `provider:<email>` (เช่น `google-antigravity:user@gmail.com`)

โปรไฟล์อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ภายใต้ `profiles`

## ลำดับการหมุนเวียน

เมื่อผู้ให้บริการมีหลายโปรไฟล์ OpenClaw จะเลือกลำดับดังนี้:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (หากตั้งไว้)
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` ที่กรองตามผู้ให้บริการ
  </Step>
  <Step title="Stored profiles">
    รายการใน `auth-profiles.json` สำหรับผู้ให้บริการ
  </Step>
</Steps>

หากไม่ได้กำหนดลำดับอย่างชัดเจน OpenClaw จะใช้ลำดับแบบ round-robin:

- **คีย์หลัก:** ประเภทโปรไฟล์ (**OAuth ก่อน API keys**)
- **คีย์รอง:** `usageStats.lastUsed` (เก่าที่สุดก่อน ภายในแต่ละประเภท)
- **โปรไฟล์ที่อยู่ในคูลดาวน์/ถูกปิดใช้งาน** จะถูกย้ายไปท้ายสุด เรียงตามเวลาหมดอายุที่เร็วที่สุด

### ความคงตัวของเซสชัน (เป็นมิตรกับแคช)

OpenClaw **ตรึงโปรไฟล์การยืนยันตัวตนที่เลือกไว้ต่อเซสชัน** เพื่อให้แคชของผู้ให้บริการยังอุ่นอยู่ จะ **ไม่** หมุนเวียนทุกคำขอ โปรไฟล์ที่ตรึงไว้จะถูกใช้ซ้ำจนกว่า:

- เซสชันถูกรีเซ็ต (`/new` / `/reset`)
- Compaction เสร็จสิ้น (จำนวน compaction เพิ่มขึ้น)
- โปรไฟล์อยู่ในคูลดาวน์/ถูกปิดใช้งาน

การเลือกด้วยตนเองผ่าน `/model …@<profileId>` ตั้งค่า **override ของผู้ใช้** สำหรับเซสชันนั้น และจะไม่ถูกหมุนเวียนอัตโนมัติจนกว่าเซสชันใหม่จะเริ่ม

<Note>
โปรไฟล์ที่ตรึงอัตโนมัติ (เลือกโดย router ของเซสชัน) จะถือเป็น **ค่ากำหนด**: จะถูกลองก่อน แต่ OpenClaw อาจหมุนเวียนไปยังโปรไฟล์อื่นเมื่อเจอ rate limits/timeouts โปรไฟล์ที่ผู้ใช้ตรึงไว้จะล็อกอยู่กับโปรไฟล์นั้น หากล้มเหลวและมีการกำหนดรายการสำรองโมเดลไว้ OpenClaw จะย้ายไปยังโมเดลถัดไปแทนการสลับโปรไฟล์
</Note>

### ทำไม OAuth อาจ "ดูเหมือนหายไป"

หากคุณมีทั้งโปรไฟล์ OAuth และโปรไฟล์ API key สำหรับผู้ให้บริการเดียวกัน round-robin อาจสลับระหว่างสองโปรไฟล์นั้นข้ามข้อความ เว้นแต่ว่าจะถูกตรึงไว้ หากต้องการบังคับใช้โปรไฟล์เดียว:

- ตรึงด้วย `auth.order[provider] = ["provider:profileId"]` หรือ
- ใช้ override ต่อเซสชันผ่าน `/model …` พร้อม override โปรไฟล์ (เมื่อ UI/พื้นผิวแชทของคุณรองรับ)

## คูลดาวน์

เมื่อโปรไฟล์ล้มเหลวเพราะข้อผิดพลาดด้านการยืนยันตัวตน/rate-limit (หรือ timeout ที่ดูเหมือน rate limiting) OpenClaw จะทำเครื่องหมายว่าอยู่ในคูลดาวน์และย้ายไปยังโปรไฟล์ถัดไป

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    กลุ่ม rate-limit นี้กว้างกว่า `429` ธรรมดา: ยังรวมข้อความจากผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` และขีดจำกัดหน้าต่างการใช้งานตามช่วงเวลา เช่น `weekly/monthly limit reached`

    ข้อผิดพลาดด้านรูปแบบ/คำขอไม่ถูกต้อง (เช่น ความล้มเหลวในการตรวจสอบ ID การเรียกเครื่องมือของ Cloud Code Assist) จะถือว่าเป็นข้อผิดพลาดที่ควรสลับไปใช้ตัวสำรองและใช้คูลดาวน์เดียวกัน ข้อผิดพลาด stop-reason ที่เข้ากันได้กับ OpenAI เช่น `Unhandled stop reason: error`, `stop reason: error` และ `reason: error` จะถูกจัดประเภทเป็นสัญญาณ timeout/failover

    ข้อความเซิร์ฟเวอร์ทั่วไปอาจอยู่ในกลุ่ม timeout นั้นได้เช่นกันเมื่อแหล่งที่มาตรงกับรูปแบบชั่วคราวที่รู้จัก ตัวอย่างเช่น ข้อความ stream-wrapper เปล่าๆ ของ pi-ai ว่า `An unknown error occurred` จะถือว่าเป็นข้อผิดพลาดที่ควรสลับไปใช้ตัวสำรองสำหรับผู้ให้บริการทุกราย เพราะ pi-ai ส่งข้อความนี้เมื่อสตรีมของผู้ให้บริการจบด้วย `stopReason: "aborted"` หรือ `stopReason: "error"` โดยไม่มีรายละเอียดเฉพาะ payload แบบ JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว เช่น `internal server error`, `unknown error, 520`, `upstream error` หรือ `backend error` จะถือว่าเป็น timeout ที่ควรสลับไปใช้ตัวสำรองเช่นกัน

    ข้อความ upstream ทั่วไปเฉพาะ OpenRouter เช่น `Provider returned error` แบบเปล่าๆ จะถือว่าเป็น timeout เฉพาะเมื่อบริบทของผู้ให้บริการเป็น OpenRouter จริงๆ ข้อความ fallback ภายในทั่วไป เช่น `LLM request failed with an unknown error.` ยังคงใช้แนวทางอนุรักษ์นิยมและไม่กระตุ้น failover ด้วยตัวเอง

  </Accordion>
  <Accordion title="SDK retry-after caps">
    SDK ของผู้ให้บริการบางรายอาจรอหน้าต่าง `Retry-After` ที่ยาวนานก่อนคืนการควบคุมให้ OpenClaw สำหรับ SDK ที่ใช้ Stainless เช่น Anthropic และ OpenAI OpenClaw จะจำกัดการรอ `retry-after-ms` / `retry-after` ภายใน SDK ไว้ที่ 60 วินาทีโดยค่าเริ่มต้น และแสดงผลตอบสนองที่ลองใหม่ได้ซึ่งยาวกว่านั้นทันที เพื่อให้เส้นทาง failover นี้ทำงานได้ ปรับแต่งหรือปิดการจำกัดได้ด้วย `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; ดู [พฤติกรรมการลองใหม่](/th/concepts/retry)
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    คูลดาวน์ rate-limit สามารถจำกัดขอบเขตตามโมเดลได้ด้วย:

    - OpenClaw บันทึก `cooldownModel` สำหรับความล้มเหลวแบบ rate-limit เมื่อทราบ id ของโมเดลที่ล้มเหลว
    - โมเดลพี่น้องบนผู้ให้บริการเดียวกันยังสามารถถูกลองได้เมื่อคูลดาวน์จำกัดขอบเขตไว้ที่โมเดลอื่น
    - หน้าต่าง billing/disabled ยังคงบล็อกทั้งโปรไฟล์ข้ามโมเดล

  </Accordion>
</AccordionGroup>

คูลดาวน์ใช้ exponential backoff:

- 1 นาที
- 5 นาที
- 25 นาที
- 1 ชั่วโมง (ขีดจำกัดสูงสุด)

สถานะถูกจัดเก็บใน `auth-state.json` ภายใต้ `usageStats`:

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

ความล้มเหลวด้าน billing/credit (เช่น "insufficient credits" / "credit balance too low") จะถือว่าเป็นข้อผิดพลาดที่ควรสลับไปใช้ตัวสำรอง แต่โดยปกติไม่ใช่ความล้มเหลวชั่วคราว แทนที่จะใช้คูลดาวน์สั้น OpenClaw จะทำเครื่องหมายโปรไฟล์เป็น **disabled** (พร้อม backoff ที่ยาวกว่า) และหมุนเวียนไปยังโปรไฟล์/ผู้ให้บริการถัดไป

<Note>
ไม่ใช่ทุกผลตอบกลับที่มีลักษณะ billing จะเป็น `402` และไม่ใช่ทุก HTTP `402` จะเข้ากลุ่มนี้ OpenClaw จะคงข้อความ billing ที่ชัดเจนไว้ในสาย billing แม้ผู้ให้บริการจะส่งคืน `401` หรือ `403` แทน แต่ matcher เฉพาะผู้ให้บริการยังคงจำกัดขอบเขตไว้กับผู้ให้บริการที่เป็นเจ้าของ matcher นั้น (เช่น OpenRouter `403 Key limit exceeded`)

ในขณะเดียวกัน ข้อผิดพลาด `402` ชั่วคราวเกี่ยวกับหน้าต่างการใช้งานและขีดจำกัดค่าใช้จ่ายของ organization/workspace จะถูกจัดประเภทเป็น `rate_limit` เมื่อข้อความดูเหมือนลองใหม่ได้ (เช่น `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` หรือ `organization spending limit exceeded`) สิ่งเหล่านั้นจะอยู่บนเส้นทางคูลดาวน์สั้น/failover แทนเส้นทาง billing-disable ที่ยาว
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

- Billing backoff เริ่มที่ **5 ชั่วโมง** เพิ่มเป็นสองเท่าต่อความล้มเหลวด้าน billing แต่ละครั้ง และจำกัดสูงสุดที่ **24 ชั่วโมง**
- ตัวนับ backoff จะรีเซ็ตหากโปรไฟล์ไม่ได้ล้มเหลวมา **24 ชั่วโมง** (กำหนดค่าได้)
- การลองใหม่เมื่อ overloaded อนุญาตให้ **หมุนเวียนโปรไฟล์ของผู้ให้บริการเดียวกัน 1 ครั้ง** ก่อนสำรองโมเดล
- การลองใหม่เมื่อ overloaded ใช้ **0 ms backoff** โดยค่าเริ่มต้น

## การสำรองโมเดล

หากทุกโปรไฟล์ของผู้ให้บริการล้มเหลว OpenClaw จะย้ายไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks` สิ่งนี้ใช้กับความล้มเหลวด้านการยืนยันตัวตน rate limits และ timeouts ที่ใช้การหมุนเวียนโปรไฟล์จนหมด (ข้อผิดพลาดอื่นจะไม่เลื่อนไปยังตัวสำรอง) ข้อผิดพลาดของผู้ให้บริการที่ไม่ได้เปิดเผยรายละเอียดเพียงพอยังคงถูกระบุอย่างแม่นยำในสถานะ fallback: `empty_response` หมายถึงผู้ให้บริการไม่ได้ส่งข้อความหรือสถานะที่ใช้งานได้กลับมา, `no_error_details` หมายถึงผู้ให้บริการส่งคืน `Unknown error (no error details in response)` อย่างชัดเจน และ `unclassified` หมายถึง OpenClaw เก็บตัวอย่างดิบไว้ แต่ยังไม่มี classifier ใดตรงกับตัวอย่างนั้น

เมื่อเกิดข้อผิดพลาดจากโหลดเกินและ rate-limit ระบบจะจัดการอย่างจริงจังกว่า billing cooldowns ตามค่าเริ่มต้น OpenClaw อนุญาตให้ลอง auth-profile ของผู้ให้บริการรายเดิมซ้ำหนึ่งครั้ง จากนั้นจะสลับไปยัง model fallback ที่กำหนดค่าถัดไปโดยไม่รอ สัญญาณว่าผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะอยู่ในกลุ่มโหลดเกินนี้ ปรับแต่งได้ด้วย `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` และ `auth.cooldowns.rateLimitedProfileRotations`

เมื่อการรันเริ่มจาก primary เริ่มต้นที่กำหนดไว้, primary ของงาน Cron, primary ของเอเจนต์ที่มี fallbacks ระบุชัดเจน หรือ fallback override ที่เลือกอัตโนมัติ OpenClaw สามารถไล่ไปตาม fallback chain ที่กำหนดค่าไว้ซึ่งตรงกันได้ ส่วน primary ของเอเจนต์ที่ไม่มี fallbacks ระบุชัดเจนและการเลือกของผู้ใช้แบบระบุชัดเจน (เช่น `/model ollama/qwen3.5:27b`, ตัวเลือกโมเดล, `sessions.patch` หรือ provider/model overrides แบบครั้งเดียวของ CLI) จะเป็นแบบเข้มงวด: หาก provider/model นั้นเข้าถึงไม่ได้หรือล้มเหลวก่อนสร้างคำตอบ OpenClaw จะรายงานความล้มเหลวแทนที่จะตอบจาก fallback ที่ไม่เกี่ยวข้อง

### กฎของ candidate chain

OpenClaw สร้างรายการ candidate จาก `provider/model` ที่ร้องขออยู่ในปัจจุบันร่วมกับ fallbacks ที่กำหนดค่าไว้

<AccordionGroup>
  <Accordion title="กฎ">
    - โมเดลที่ร้องขอจะอยู่เป็นลำดับแรกเสมอ
    - fallbacks ที่กำหนดค่าไว้อย่างชัดเจนจะถูกลบรายการซ้ำ แต่ไม่ถูกกรองด้วย model allowlist โดยถือว่าเป็นเจตนาของผู้ดูแลระบบที่ระบุชัดเจน
    - หากการรันปัจจุบันอยู่บน fallback ที่กำหนดค่าไว้แล้วใน provider family เดียวกัน OpenClaw จะใช้ chain ที่กำหนดค่าไว้ทั้งหมดต่อไป
    - หากการรันปัจจุบันอยู่บน provider ที่ต่างจาก config และโมเดลปัจจุบันนั้นยังไม่ได้เป็นส่วนหนึ่งของ fallback chain ที่กำหนดค่าไว้ OpenClaw จะไม่ต่อ fallbacks ที่กำหนดค่าไว้ซึ่งไม่เกี่ยวข้องจาก provider อื่นเข้ามา
    - เมื่อไม่มี fallback override แบบชัดเจนส่งให้ fallback runner ระบบจะต่อ primary ที่กำหนดค่าไว้ไว้ท้ายสุด เพื่อให้ chain สามารถกลับมาตั้งหลักที่ค่าเริ่มต้นปกติได้เมื่อ candidate ก่อนหน้าถูกใช้จนหมดแล้ว
    - เมื่อ caller ส่ง `fallbacksOverride` runner จะใช้โมเดลที่ร้องขอพร้อมรายการ override นั้นเท่านั้น รายการว่างจะปิดใช้งาน model fallback และป้องกันไม่ให้ primary ที่กำหนดค่าไว้ถูกต่อท้ายเป็นเป้าหมาย retry แบบซ่อนอยู่

  </Accordion>
</AccordionGroup>

### ข้อผิดพลาดใดที่ทำให้ fallback เดินหน้าต่อ

<Tabs>
  <Tab title="ดำเนินต่อเมื่อ">
    - auth failures
    - rate limits และ cooldown exhaustion
    - ข้อผิดพลาด overloaded/provider-busy
    - ข้อผิดพลาด failover ที่มีลักษณะเป็น timeout
    - billing disables
    - `LiveSessionModelSwitchError` ซึ่งถูก normalize ให้เป็นเส้นทาง failover เพื่อไม่ให้โมเดลที่ persist ไว้และล้าสมัยสร้าง outer retry loop
    - ข้อผิดพลาดอื่นที่ไม่รู้จักเมื่อยังมี candidates เหลืออยู่

  </Tab>
  <Tab title="ไม่ดำเนินต่อเมื่อ">
    - explicit aborts ที่ไม่ได้มีลักษณะเป็น timeout/failover
    - ข้อผิดพลาด context overflow ที่ควรอยู่ภายในตรรกะ compaction/retry (เช่น `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` หรือ `ollama error: context length exceeded`)
    - ข้อผิดพลาด unknown สุดท้ายเมื่อไม่มี candidates เหลืออยู่

  </Tab>
</Tabs>

### พฤติกรรมการข้าม cooldown เทียบกับ probe

เมื่อ auth profile ทุกตัวสำหรับ provider หนึ่งอยู่ใน cooldown อยู่แล้ว OpenClaw จะไม่ข้าม provider นั้นโดยอัตโนมัติตลอดไป แต่จะตัดสินใจเป็นราย candidate:

<AccordionGroup>
  <Accordion title="การตัดสินใจราย candidate">
    - auth failures แบบถาวรจะข้ามทั้ง provider ทันที
    - billing disables โดยทั่วไปจะถูกข้าม แต่ primary candidate ยังสามารถถูก probe แบบ throttle ได้ เพื่อให้กู้คืนได้โดยไม่ต้องเริ่มใหม่
    - primary candidate อาจถูก probe ใกล้เวลาหมดอายุ cooldown พร้อม throttle แยกตาม provider
    - fallback siblings ของ provider เดียวกันสามารถถูกลองได้แม้อยู่ใน cooldown เมื่อความล้มเหลวดูลักษณะชั่วคราว (`rate_limit`, `overloaded` หรือ unknown) เรื่องนี้สำคัญเป็นพิเศษเมื่อ rate limit ผูกกับโมเดล และ sibling model อาจยังกลับมาใช้ได้ทันที
    - transient cooldown probes ถูกจำกัดไว้ที่หนึ่งครั้งต่อ provider ต่อ fallback run เพื่อไม่ให้ provider เดียวทำให้ fallback ข้าม provider ค้าง

  </Accordion>
</AccordionGroup>

## Session overrides และการสลับโมเดลแบบ live

การเปลี่ยนโมเดลของ session เป็น shared state active runner, คำสั่ง `/model`, การอัปเดต compaction/session และ live-session reconciliation ล้วนอ่านหรือเขียนบางส่วนของ session entry เดียวกัน

นั่นหมายความว่า fallback retries ต้องประสานกับการสลับโมเดลแบบ live:

- เฉพาะการเปลี่ยนโมเดลที่ขับเคลื่อนโดยผู้ใช้แบบชัดเจนเท่านั้นที่จะทำเครื่องหมาย pending live switch ซึ่งรวมถึง `/model`, `session_status(model=...)` และ `sessions.patch`
- การเปลี่ยนโมเดลที่ขับเคลื่อนโดยระบบ เช่น fallback rotation, heartbeat overrides หรือ compaction จะไม่ทำเครื่องหมาย pending live switch ด้วยตัวเอง
- model overrides ที่ขับเคลื่อนโดยผู้ใช้จะถูกถือเป็นการเลือกแบบ exact สำหรับนโยบาย fallback ดังนั้น provider ที่เลือกไว้แล้วเข้าถึงไม่ได้จะแสดงเป็นความล้มเหลว แทนที่จะถูกซ่อนด้วย `agents.defaults.model.fallbacks`
- ก่อน fallback retry เริ่ม reply runner จะ persist ช่อง fallback override ที่เลือกไว้ลงใน session entry
- auto fallback overrides จะยังคงถูกเลือกใน turn ถัดไป เพื่อไม่ให้ OpenClaw probe primary ที่ทราบว่าเสียทุกข้อความ `/new`, `/reset` และ `sessions.reset` จะล้าง overrides ที่มาจาก auto และคืน session กลับไปยังค่าเริ่มต้นที่กำหนดไว้
- `/status` แสดงโมเดลที่เลือก และเมื่อสถานะ fallback แตกต่าง จะแสดง active fallback model และเหตุผล
- live-session reconciliation ให้ความสำคัญกับ persisted session overrides มากกว่า runtime model fields ที่ล้าสมัย
- หากข้อผิดพลาด live-switch ชี้ไปยัง candidate ที่อยู่ถัดไปใน active fallback chain OpenClaw จะข้ามไปยังโมเดลที่เลือกนั้นโดยตรง แทนที่จะไล่ผ่าน candidates ที่ไม่เกี่ยวข้องก่อน
- หาก fallback attempt ล้มเหลว runner จะ rollback เฉพาะ override fields ที่ตัวเองเขียน และเฉพาะเมื่อ fields เหล่านั้นยังตรงกับ candidate ที่ล้มเหลวนั้น

สิ่งนี้ป้องกัน race แบบคลาสสิก:

<Steps>
  <Step title="Primary ล้มเหลว">
    โมเดล primary ที่เลือกไว้ล้มเหลว
  </Step>
  <Step title="เลือก fallback ในหน่วยความจำ">
    เลือก fallback candidate ในหน่วยความจำ
  </Step>
  <Step title="Session store ยังบอกว่าเป็น primary เก่า">
    Session store ยังสะท้อน primary เก่าอยู่
  </Step>
  <Step title="Live reconciliation อ่านสถานะล้าสมัย">
    Live-session reconciliation อ่านสถานะ session ที่ล้าสมัย
  </Step>
  <Step title="Retry ถูกดีดกลับ">
    retry ถูกดีดกลับไปยังโมเดลเก่าก่อนที่ fallback attempt จะเริ่ม
  </Step>
</Steps>

persisted fallback override จะปิดช่องว่างนั้น และ rollback แบบแคบจะรักษาการเปลี่ยนแปลง session แบบ manual หรือ runtime ที่ใหม่กว่าไว้เหมือนเดิม

## Observability และสรุปความล้มเหลว

`runWithModelFallback(...)` บันทึกรายละเอียดราย attempt ที่ป้อนเข้าสู่ logs และข้อความ cooldown ที่แสดงต่อผู้ใช้:

- provider/model ที่ลอง
- เหตุผล (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` และเหตุผล failover ที่คล้ายกัน)
- status/code แบบ optional
- สรุปข้อผิดพลาดที่มนุษย์อ่านได้

logs แบบมีโครงสร้าง `model_fallback_decision` ยังรวม fields แบบแบน `fallbackStep*` เมื่อ candidate ล้มเหลว ถูกข้าม หรือ fallback ถัดไปสำเร็จ fields เหล่านี้ทำให้ transition ที่ลองเกิดขึ้นชัดเจน (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) เพื่อให้ log และ diagnostic exporters สามารถประกอบ primary failure กลับขึ้นมาได้ แม้ terminal fallback จะล้มเหลวด้วยก็ตาม

เมื่อ candidate ทุกตัวล้มเหลว OpenClaw จะโยน `FallbackSummaryError` outer reply runner สามารถใช้สิ่งนั้นสร้างข้อความที่เฉพาะเจาะจงขึ้น เช่น "โมเดลทั้งหมดถูก rate-limit ชั่วคราว" และรวมเวลาหมดอายุ cooldown ที่เร็วที่สุดเมื่อทราบ

สรุป cooldown นั้นรู้บริบทของโมเดล:

- rate limits แบบ model-scoped ที่ไม่เกี่ยวข้องจะถูกละเว้นสำหรับ provider/model chain ที่พยายามใช้
- หาก block ที่เหลือเป็น rate limit แบบ model-scoped ที่ตรงกัน OpenClaw จะรายงาน expiry ล่าสุดที่ตรงกันซึ่งยังบล็อกโมเดลนั้นอยู่

## Config ที่เกี่ยวข้อง

ดู [การกำหนดค่า Gateway](/th/gateway/configuration) สำหรับ:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- การ routing ของ `agents.defaults.imageModel`

ดู [Models](/th/concepts/models) สำหรับภาพรวมการเลือกโมเดลและ fallback ที่กว้างขึ้น
