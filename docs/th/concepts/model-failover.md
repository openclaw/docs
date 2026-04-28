---
read_when:
    - การวินิจฉัยการหมุนเวียนโปรไฟล์การยืนยันตัวตน cooldowns หรือพฤติกรรม model fallback
    - การอัปเดตกฎ failover สำหรับโปรไฟล์การยืนยันตัวตนหรือโมเดล
    - การทำความเข้าใจว่าการ override โมเดลของเซสชันโต้ตอบกับการลองใหม่แบบ fallback อย่างไร
sidebarTitle: Model failover
summary: วิธีที่ OpenClaw หมุนเวียนโปรไฟล์การยืนยันตัวตนและ fallback ข้ามโมเดลต่าง ๆ
title: Model failover
x-i18n:
    generated_at: "2026-04-26T11:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw จัดการความล้มเหลวเป็นสองขั้นตอน:

1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายใน provider ปัจจุบัน
2. **Model fallback** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

เอกสารนี้อธิบายกฎของรันไทม์และข้อมูลที่รองรับกฎเหล่านั้น

## ลำดับการทำงานของรันไทม์

สำหรับการรันข้อความปกติ OpenClaw จะประเมิน candidates ตามลำดับนี้:

<Steps>
  <Step title="Resolve สถานะเซสชัน">
    resolve โมเดลของเซสชันที่ใช้งานอยู่และค่ากำหนดโปรไฟล์การยืนยันตัวตน
  </Step>
  <Step title="สร้าง candidate chain">
    สร้าง model candidate chain จากโมเดลเซสชันที่เลือกอยู่ในปัจจุบัน จากนั้นตามด้วย `agents.defaults.model.fallbacks` ตามลำดับ และลงท้ายด้วย primary ที่ตั้งค่าไว้เมื่อการรันเริ่มต้นจาก override
  </Step>
  <Step title="ลอง provider ปัจจุบัน">
    ลอง provider ปัจจุบันโดยใช้กฎการหมุนเวียนโปรไฟล์การยืนยันตัวตน/cooldown
  </Step>
  <Step title="เลื่อนไปต่อเมื่อเกิดข้อผิดพลาดที่ควร failover">
    หาก provider นั้นถูกใช้จนหมดด้วยข้อผิดพลาดที่ควร failover ให้ย้ายไปยัง model candidate ถัดไป
  </Step>
  <Step title="persist fallback override">
    persist fallback override ที่เลือกไว้ก่อนเริ่ม retry เพื่อให้ตัวอ่านเซสชันอื่นเห็น provider/model เดียวกับที่ runner กำลังจะใช้
  </Step>
  <Step title="ย้อนกลับอย่างจำกัดเมื่อเกิดความล้มเหลว">
    หาก fallback candidate ล้มเหลว ให้ย้อนกลับเฉพาะฟิลด์ override ของเซสชันที่ fallback เป็นเจ้าของ และเฉพาะเมื่อยังตรงกับ candidate ที่ล้มเหลวนั้น
  </Step>
  <Step title="โยน FallbackSummaryError หากใช้หมดแล้ว">
    หากทุก candidate ล้มเหลว ให้โยน `FallbackSummaryError` พร้อมรายละเอียดรายความพยายาม และเวลาหมด cooldown ที่ใกล้ที่สุดเมื่อทราบ
  </Step>
</Steps>

สิ่งนี้ตั้งใจให้แคบกว่าการ "บันทึกและกู้คืนทั้งเซสชัน" reply runner จะ persist เฉพาะฟิลด์การเลือกโมเดลที่มันเป็นเจ้าของสำหรับ fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

สิ่งนี้ป้องกันไม่ให้ fallback retry ที่ล้มเหลวไปเขียนทับการเปลี่ยนแปลงเซสชันอื่นที่ใหม่กว่าและไม่เกี่ยวข้อง เช่น การเปลี่ยน `/model` แบบ manual หรือการอัปเดตการหมุนเซสชันที่เกิดขึ้นระหว่างที่ความพยายามนั้นกำลังรัน

## ที่เก็บ auth (keys + OAuth)

OpenClaw ใช้ **โปรไฟล์การยืนยันตัวตน** สำหรับทั้ง API keys และ OAuth tokens

- secrets อยู่ที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (แบบเดิม: `~/.openclaw/agent/auth-profiles.json`)
- สถานะ runtime auth-routing อยู่ที่ `~/.openclaw/agents/<agentId>/agent/auth-state.json`
- config `auth.profiles` / `auth.order` เป็น **metadata + routing เท่านั้น** (ไม่มี secrets)
- ไฟล์ OAuth แบบเดิมสำหรับ import อย่างเดียว: `~/.openclaw/credentials/oauth.json` (จะถูก import เข้า `auth-profiles.json` เมื่อใช้งานครั้งแรก)

รายละเอียดเพิ่มเติม: [OAuth](/th/concepts/oauth)

ประเภทของ credentials:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` สำหรับบาง providers)

## Profile IDs

การล็อกอินด้วย OAuth จะสร้าง profiles ที่แตกต่างกัน เพื่อให้หลายบัญชีอยู่ร่วมกันได้

- ค่าเริ่มต้น: `provider:default` เมื่อไม่มี email
- OAuth พร้อม email: `provider:<email>` (เช่น `google-antigravity:user@gmail.com`)

profiles จะอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ภายใต้ `profiles`

## ลำดับการหมุนเวียน

เมื่อ provider มีหลาย profiles, OpenClaw จะเลือกลำดับแบบนี้:

<Steps>
  <Step title="config แบบ explicit">
    `auth.order[provider]` (หากตั้งไว้)
  </Step>
  <Step title="profiles ที่ตั้งค่าไว้">
    `auth.profiles` ที่กรองตาม provider
  </Step>
  <Step title="profiles ที่เก็บไว้">
    entries ใน `auth-profiles.json` สำหรับ provider
  </Step>
</Steps>

หากไม่มีการตั้งค่าลำดับแบบ explicit, OpenClaw จะใช้ลำดับแบบ round‑robin:

- **คีย์หลัก:** ประเภทของ profile (**OAuth มาก่อน API keys**)
- **คีย์รอง:** `usageStats.lastUsed` (เก่าที่สุดก่อน ภายในแต่ละประเภท)
- **profiles ที่อยู่ใน cooldown/disabled** จะถูกย้ายไปท้ายสุด โดยเรียงตามเวลาหมดอายุที่เร็วที่สุด

### Session stickiness (เป็นมิตรกับ cache)

OpenClaw จะ **ปักโปรไฟล์การยืนยันตัวตนที่เลือกไว้ต่อเซสชัน** เพื่อให้ cache ของ provider อุ่นอยู่ มันจะ **ไม่** หมุนเวียนทุกคำขอ โปรไฟล์ที่ปักไว้จะถูกใช้ซ้ำจนกว่า:

- เซสชันจะถูกรีเซ็ต (`/new` / `/reset`)
- Compaction เสร็จสมบูรณ์ (จำนวน compaction เพิ่มขึ้น)
- profile อยู่ใน cooldown/disabled

การเลือกด้วยตนเองผ่าน `/model …@<profileId>` จะตั้ง **user override** สำหรับเซสชันนั้น และจะไม่หมุนอัตโนมัติจนกว่าจะเริ่มเซสชันใหม่

<Note>
โปรไฟล์ที่ถูกปักอัตโนมัติ (เลือกโดย session router) จะถูกมองเป็น **ความพึงพอใจ**: จะถูกลองก่อน แต่ OpenClaw อาจหมุนไปยังโปรไฟล์อื่นเมื่อเจอ rate limits/timeouts ส่วนโปรไฟล์ที่ผู้ใช้ปักไว้จะล็อกอยู่กับโปรไฟล์นั้น; หากล้มเหลวและมีการตั้งค่า model fallbacks ไว้ OpenClaw จะย้ายไปยังโมเดลถัดไปแทนการสลับโปรไฟล์
</Note>

### ทำไม OAuth จึง "ดูเหมือนหายไป"

หากคุณมีทั้งโปรไฟล์ OAuth และโปรไฟล์ API key สำหรับ provider เดียวกัน round‑robin อาจสลับระหว่างทั้งสองข้ามข้อความต่าง ๆ ได้ถ้าไม่ได้ปักไว้ หากต้องการบังคับให้ใช้โปรไฟล์เดียว:

- ปักด้วย `auth.order[provider] = ["provider:profileId"]`, หรือ
- ใช้ per-session override ผ่าน `/model …` พร้อม profile override (เมื่อ UI/พื้นผิวแชตของคุณรองรับ)

## Cooldowns

เมื่อ profile ล้มเหลวเพราะข้อผิดพลาดด้าน auth/rate-limit (หรือ timeout ที่ดูเหมือน rate limiting) OpenClaw จะทำเครื่องหมายให้อยู่ใน cooldown และย้ายไปยัง profile ถัดไป

<AccordionGroup>
  <Accordion title="อะไรบ้างที่เข้ากลุ่ม rate-limit / timeout">
    กลุ่ม rate-limit นี้กว้างกว่าแค่ `429`: มันยังรวมข้อความจาก provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` และข้อจำกัดหน้าต่างการใช้งานแบบเป็นช่วง เช่น `weekly/monthly limit reached`

    ข้อผิดพลาดแบบ format/invalid-request (เช่น ความล้มเหลวในการตรวจสอบ tool call ID ของ Cloud Code Assist) จะถูกมองว่าเป็นข้อผิดพลาดที่ควร failover และใช้ cooldown เดียวกัน ข้อผิดพลาด stop-reason แบบ OpenAI-compatible เช่น `Unhandled stop reason: error`, `stop reason: error` และ `reason: error` จะถูกจัดประเภทเป็นสัญญาณ timeout/failover

    ข้อความเซิร์ฟเวอร์ทั่วไปก็อาจเข้ากลุ่ม timeout นี้ได้เมื่อแหล่งที่มาตรงกับรูปแบบ transient ที่รู้จัก ตัวอย่างเช่น ข้อความ stream-wrapper แบบเปล่า `An unknown error occurred` ของ pi-ai จะถูกมองว่าเป็นข้อผิดพลาดที่ควร failover สำหรับทุก provider เพราะ pi-ai ส่งข้อความนี้เมื่อสตรีมของ provider จบด้วย `stopReason: "aborted"` หรือ `stopReason: "error"` โดยไม่มีรายละเอียดเฉพาะ ส่วน JSON payloads แบบ `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว เช่น `internal server error`, `unknown error, 520`, `upstream error` หรือ `backend error` ก็จะถูกมองว่าเป็น timeout ที่ควร failover เช่นกัน

    ข้อความ upstream ทั่วไปแบบเฉพาะของ OpenRouter เช่น `Provider returned error` แบบเปล่า จะถูกมองเป็น timeout เฉพาะเมื่อบริบทของ provider เป็น OpenRouter จริง ๆ ข้อความ fallback ภายในทั่วไป เช่น `LLM request failed with an unknown error.` จะยังคงระมัดระวังและจะไม่ทริกเกอร์ failover ด้วยตัวเอง

  </Accordion>
  <Accordion title="เพดาน retry-after ของ SDK">
    SDK ของ provider บางตัวอาจ sleep ตามหน้าต่าง `Retry-After` ที่ยาว ก่อนคืนการควบคุมให้ OpenClaw สำหรับ SDK ที่อิง Stainless เช่น Anthropic และ OpenAI, OpenClaw จะจำกัดการรอ `retry-after-ms` / `retry-after` ภายใน SDK ไว้ที่ 60 วินาทีโดยค่าเริ่มต้น และจะแสดง responses ที่ retry ได้ซึ่งยาวกว่านั้นทันที เพื่อให้เส้นทาง failover นี้ทำงานได้ ปรับแต่งหรือปิดเพดานนี้ได้ด้วย `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; ดู [Retry behavior](/th/concepts/retry)
  </Accordion>
  <Accordion title="Cooldowns แบบ model-scoped">
    cooldowns ของ rate-limit สามารถผูกกับโมเดลได้ด้วย:

    - OpenClaw จะบันทึก `cooldownModel` สำหรับความล้มเหลวจาก rate-limit เมื่อทราบ id ของโมเดลที่ล้มเหลว
    - โมเดลพี่น้องบน provider เดียวกันยังสามารถถูกลองได้ เมื่อ cooldown ถูกผูกกับโมเดลอื่น
    - หน้าต่าง billing/disabled ยังคงบล็อกทั้ง profile ข้ามทุกโมเดล

  </Accordion>
</AccordionGroup>

cooldowns ใช้ exponential backoff:

- 1 นาที
- 5 นาที
- 25 นาที
- 1 ชั่วโมง (ค่าสูงสุด)

สถานะจะถูกเก็บใน `auth-state.json` ภายใต้ `usageStats`:

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

ความล้มเหลวด้าน billing/credit (เช่น "insufficient credits" / "credit balance too low") จะถูกมองว่าเป็นข้อผิดพลาดที่ควร failover แต่โดยปกติไม่ใช่ปัญหาชั่วคราว แทนที่จะใช้ cooldown สั้น ๆ OpenClaw จะทำเครื่องหมาย profile เป็น **disabled** (พร้อม backoff ที่ยาวกว่า) และหมุนไปยัง profile/provider ถัดไป

<Note>
ไม่ใช่ทุก response ที่ดูเหมือนปัญหา billing จะเป็น `402` และไม่ใช่ทุก HTTP `402` จะเข้ามาในกลุ่มนี้ OpenClaw จะเก็บข้อความ billing แบบ explicit ไว้ใน lane ของ billing แม้ provider จะคืน `401` หรือ `403` แทน แต่ตัวจับคู่เฉพาะ provider จะยังถูกจำกัดอยู่กับ provider เจ้าของเท่านั้น (เช่น OpenRouter `403 Key limit exceeded`)

ในขณะเดียวกัน ข้อผิดพลาด `402` ชั่วคราวเกี่ยวกับหน้าต่างการใช้งานและ organization/workspace spend-limit จะถูกจัดเป็น `rate_limit` เมื่อข้อความดูเหมือน retry ได้ (เช่น `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` หรือ `organization spending limit exceeded`) กรณีเหล่านี้จะยังอยู่บนเส้นทาง cooldown/failover แบบสั้น แทนเส้นทาง billing-disable แบบยาว
</Note>

สถานะถูกเก็บใน `auth-state.json`:

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

- billing backoff เริ่มที่ **5 ชั่วโมง**, เพิ่มเป็นสองเท่าต่อความล้มเหลวด้าน billing แต่ละครั้ง และจำกัดสูงสุดที่ **24 ชั่วโมง**
- ตัวนับ backoff จะรีเซ็ตหาก profile ไม่ล้มเหลวเป็นเวลา **24 ชั่วโมง** (ปรับตั้งได้)
- overloaded retries อนุญาต **การหมุนเวียน profile บน provider เดียวกัน 1 ครั้ง** ก่อน model fallback
- overloaded retries ใช้ backoff **0 ms** โดยค่าเริ่มต้น

## Model fallback

หากทุก profiles สำหรับ provider หนึ่งล้มเหลว OpenClaw จะย้ายไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks` สิ่งนี้ใช้กับความล้มเหลวด้าน auth, rate limits และ timeouts ที่ใช้การหมุน profile จนหมด (ข้อผิดพลาดประเภทอื่นจะไม่เลื่อน fallback)

ข้อผิดพลาด overloaded และ rate-limit จะถูกจัดการเชิงรุกมากกว่าการ cooldown ด้าน billing โดยค่าเริ่มต้น OpenClaw อนุญาตการ retry โปรไฟล์การยืนยันตัวตนบน provider เดียวกันหนึ่งครั้ง จากนั้นจึงสลับไปยัง model fallback ถัดไปที่ตั้งค่าไว้โดยไม่รอ สัญญาณว่า provider ยุ่ง เช่น `ModelNotReadyException` จะอยู่ในกลุ่ม overloaded นี้ ปรับแต่งได้ด้วย `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` และ `auth.cooldowns.rateLimitedProfileRotations`

เมื่อการรันเริ่มต้นด้วย model override (hooks หรือ CLI), fallbacks จะยังคงจบที่ `agents.defaults.model.primary` หลังจากลอง fallbacks ที่ตั้งค่าไว้แล้ว

### กฎของ candidate chain

OpenClaw จะสร้าง candidate list จาก `provider/model` ที่ร้องขอในปัจจุบัน บวกกับ fallbacks ที่ตั้งค่าไว้

<AccordionGroup>
  <Accordion title="กฎ">
    - โมเดลที่ร้องขอจะอยู่ลำดับแรกเสมอ
    - fallbacks แบบ explicit ที่ตั้งค่าไว้จะถูกลบรายการซ้ำ แต่จะไม่ถูกกรองด้วย allowlist ของโมเดล มันถูกมองว่าเป็นเจตนาของผู้ปฏิบัติการแบบ explicit
    - หากการรันปัจจุบันอยู่บน fallback ที่ตั้งค่าไว้แล้วภายในตระกูล provider เดียวกัน OpenClaw จะยังคงใช้ chain ที่ตั้งค่าไว้ทั้งหมด
    - หากการรันปัจจุบันอยู่บน provider ที่ต่างจาก config และโมเดลปัจจุบันนั้นยังไม่ได้เป็นส่วนหนึ่งของ configured fallback chain, OpenClaw จะไม่ผนวก configured fallbacks ที่ไม่เกี่ยวข้องจาก provider อื่น
    - เมื่อการรันเริ่มต้นจาก override, configured primary จะถูกผนวกต่อท้าย เพื่อให้ chain สามารถกลับไปลงที่ค่าเริ่มต้นปกติได้เมื่อ candidates ก่อนหน้าหมดแล้ว

  </Accordion>
</AccordionGroup>

### ข้อผิดพลาดใดบ้างที่ทำให้ fallback เดินหน้าต่อ

<Tabs>
  <Tab title="ดำเนินต่อเมื่อ">
    - ความล้มเหลวด้าน auth
    - rate limits และการใช้ cooldown จนหมด
    - ข้อผิดพลาดแบบ overloaded/provider-busy
    - ข้อผิดพลาด failover ที่มีลักษณะเป็น timeout
    - การปิดใช้งานจาก billing
    - `LiveSessionModelSwitchError` ซึ่งจะถูกทำให้เป็นปกติให้อยู่ในเส้นทาง failover เพื่อไม่ให้โมเดลที่ persist ไว้แต่ล้าสมัยสร้าง outer retry loop
    - ข้อผิดพลาดอื่นที่ไม่รู้จัก เมื่อยังมี candidates เหลืออยู่

  </Tab>
  <Tab title="จะไม่ดำเนินต่อเมื่อ">
    - การยกเลิกแบบ explicit ที่ไม่ได้มีลักษณะเป็น timeout/failover
    - ข้อผิดพลาด context overflow ที่ควรอยู่ภายในตรรกะ compaction/retry (เช่น `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` หรือ `ollama error: context length exceeded`)
    - ข้อผิดพลาดไม่ทราบสาเหตุขั้นสุดท้ายเมื่อไม่มี candidates เหลือแล้ว

  </Tab>
</Tabs>

### พฤติกรรมการข้าม cooldown เทียบกับการ probe

เมื่อทุกโปรไฟล์การยืนยันตัวตนของ provider หนึ่งอยู่ใน cooldown อยู่แล้ว OpenClaw จะไม่ข้าม provider นั้นไปตลอดโดยอัตโนมัติ มันจะตัดสินใจเป็นราย candidate:

<AccordionGroup>
  <Accordion title="การตัดสินใจราย candidate">
    - ความล้มเหลวด้าน auth แบบคงอยู่จะข้ามทั้ง provider ทันที
    - การปิดใช้งานจาก billing โดยปกติจะถูกข้าม แต่ primary candidate ยังสามารถถูก probe ได้แบบจำกัดอัตรา เพื่อให้กู้คืนได้โดยไม่ต้องรีสตาร์ต
    - primary candidate อาจถูก probe ใกล้ช่วงหมด cooldown โดยมีการจำกัดอัตราแยกตาม provider
    - fallback siblings บน provider เดียวกันอาจถูกลองได้แม้อยู่ใน cooldown เมื่อความล้มเหลวดูเป็นแบบชั่วคราว (`rate_limit`, `overloaded` หรือ unknown) สิ่งนี้สำคัญเป็นพิเศษเมื่อ rate limit ถูกผูกกับโมเดล และโมเดลพี่น้องอาจกลับมาใช้งานได้ทันที
    - transient cooldown probes ถูกจำกัดไว้ที่หนึ่งครั้งต่อ provider ต่อหนึ่ง fallback run เพื่อไม่ให้ provider เดียวทำให้ fallback ข้าม provider อื่นหยุดชะงัก

  </Accordion>
</AccordionGroup>

## Session overrides และการสลับโมเดลแบบ live

การเปลี่ยนโมเดลของเซสชันเป็นสถานะที่ใช้ร่วมกัน active runner, คำสั่ง `/model`, การอัปเดต compaction/session และ live-session reconciliation ล้วนอ่านหรือเขียนบางส่วนของรายการเซสชันเดียวกัน

ซึ่งหมายความว่า fallback retries ต้องประสานงานกับการสลับโมเดลแบบ live:

- มีเพียงการเปลี่ยนโมเดลแบบ explicit ที่ผู้ใช้เป็นผู้เริ่มเท่านั้นที่จะทำเครื่องหมายว่ามี pending live switch ซึ่งรวมถึง `/model`, `session_status(model=...)` และ `sessions.patch`
- การเปลี่ยนโมเดลที่ขับเคลื่อนโดยระบบ เช่น fallback rotation, overrides ของ Heartbeat หรือ Compaction จะไม่ทำเครื่องหมาย pending live switch ด้วยตัวเอง
- ก่อนเริ่ม fallback retry, reply runner จะ persist ฟิลด์ fallback override ที่เลือกไว้ไปยังรายการเซสชัน
- live-session reconciliation จะให้ความสำคัญกับ session overrides ที่ persist ไว้เหนือฟิลด์โมเดลของรันไทม์ที่ล้าสมัย
- หาก fallback attempt ล้มเหลว runner จะย้อนกลับเฉพาะฟิลด์ override ที่มันเขียน และเฉพาะเมื่อฟิลด์เหล่านั้นยังตรงกับ candidate ที่ล้มเหลวนั้น

สิ่งนี้ป้องกัน race แบบคลาสสิก:

<Steps>
  <Step title="Primary ล้มเหลว">
    โมเดล primary ที่เลือกไว้ล้มเหลว
  </Step>
  <Step title="เลือก fallback ในหน่วยความจำ">
    เลือก fallback candidate ในหน่วยความจำ
  </Step>
  <Step title="session store ยังบอกว่าเป็น primary เดิม">
    session store ยังคงสะท้อน primary เดิม
  </Step>
  <Step title="live reconciliation อ่านสถานะที่ล้าสมัย">
    live-session reconciliation อ่านสถานะเซสชันที่ล้าสมัย
  </Step>
  <Step title="retry ถูกดีดกลับ">
    retry ถูกดีดกลับไปยังโมเดลเดิมก่อนที่ fallback attempt จะเริ่ม
  </Step>
</Steps>

fallback override ที่ persist ไว้จะปิดช่องว่างนั้น และการย้อนกลับแบบจำกัดจะช่วยรักษาการเปลี่ยนแปลงเซสชันแบบ manual หรือจากรันไทม์ที่ใหม่กว่าไว้

## การสังเกตการณ์และสรุปความล้มเหลว

`runWithModelFallback(...)` จะบันทึกรายละเอียดรายความพยายาม ซึ่งป้อนให้กับ logs และข้อความ cooldown ที่ผู้ใช้มองเห็น:

- provider/model ที่พยายามใช้
- เหตุผล (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` และเหตุผล failover ที่คล้ายกัน)
- status/code แบบไม่บังคับ
- สรุปข้อผิดพลาดที่มนุษย์อ่านเข้าใจได้

เมื่อทุก candidate ล้มเหลว OpenClaw จะโยน `FallbackSummaryError` outer reply runner สามารถใช้สิ่งนี้เพื่อสร้างข้อความที่เฉพาะเจาะจงยิ่งขึ้น เช่น "ทุกโมเดลถูกจำกัดอัตราชั่วคราว" และใส่เวลาหมด cooldown ที่ใกล้ที่สุดเมื่อทราบ

สรุป cooldown นี้รับรู้ระดับโมเดล:

- rate limits แบบ model-scoped ที่ไม่เกี่ยวข้องจะถูกละเลยสำหรับ provider/model chain ที่พยายามใช้
- หากสิ่งที่ยังบล็อกอยู่คือ rate limit แบบ model-scoped ที่ตรงกัน OpenClaw จะรายงานเวลาหมดอายุล่าสุดที่ตรงกันซึ่งยังบล็อกโมเดลนั้นอยู่

## config ที่เกี่ยวข้อง

ดู [การกำหนดค่า Gateway](/th/gateway/configuration) สำหรับ:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

ดู [โมเดล](/th/concepts/models) สำหรับภาพรวมที่กว้างขึ้นของการเลือกโมเดลและ fallback
