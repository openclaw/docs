---
read_when:
    - การดีบักการยืนยันตัวตนของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บข้อมูลรับรอง
summary: 'การยืนยันตัวตนของโมเดล: OAuth, คีย์ API, การใช้ Claude CLI ซ้ำ และ Anthropic setup-token'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-04-30T09:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
หน้านี้คือเอกสารอ้างอิงการยืนยันตัวตนของ **ผู้ให้บริการโมเดล** (คีย์ API, OAuth, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic) สำหรับการยืนยันตัวตนของ **การเชื่อมต่อ Gateway** (token, password, trusted-proxy) โปรดดู [การกำหนดค่า](/th/gateway/configuration) และ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับ OAuth และคีย์ API สำหรับผู้ให้บริการโมเดล สำหรับโฮสต์ Gateway
ที่เปิดทำงานตลอดเวลา คีย์ API มักเป็นตัวเลือกที่คาดการณ์ได้มากที่สุด นอกจากนี้ยังรองรับโฟลว์
การสมัครใช้งาน/OAuth เมื่อโฟลว์เหล่านั้นตรงกับรูปแบบบัญชีผู้ให้บริการของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับโฟลว์ OAuth และรูปแบบการจัดเก็บทั้งหมด
สำหรับการยืนยันตัวตนแบบ SecretRef (ผู้ให้บริการ `env`/`file`/`exec`) โปรดดู [การจัดการ Secrets](/th/gateway/secrets)
สำหรับกฎสิทธิ์ใช้งานของข้อมูลรับรอง/รหัสเหตุผลที่ใช้โดย `models status --probe` โปรดดู
[ความหมายของข้อมูลรับรองการยืนยันตัวตน](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (คีย์ API, ผู้ให้บริการใดก็ได้)

หากคุณกำลังใช้งาน Gateway ที่มีอายุการทำงานยาวนาน ให้เริ่มด้วยคีย์ API สำหรับผู้ให้บริการ
ที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วยคีย์ API ยังคงเป็นการตั้งค่าเซิร์ฟเวอร์ที่
คาดการณ์ได้มากที่สุด แต่ OpenClaw ยังรองรับการใช้การเข้าสู่ระบบ Claude CLI ในเครื่องซ้ำด้วย

1. สร้างคีย์ API ในคอนโซลของผู้ให้บริการของคุณ
2. ใส่คีย์ไว้บน **โฮสต์ Gateway** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway รันภายใต้ systemd/launchd ให้แนะนำให้ใส่คีย์ใน
   `~/.openclaw/.env` เพื่อให้ daemon อ่านได้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

จากนั้นรีสตาร์ต daemon (หรือรีสตาร์ตกระบวนการ Gateway ของคุณ) แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
openclaw doctor
```

หากคุณไม่ต้องการจัดการ env vars ด้วยตัวเอง onboarding สามารถจัดเก็บ
คีย์ API สำหรับให้ daemon ใช้งานได้: `openclaw onboard`

ดู [ความช่วยเหลือ](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: ความเข้ากันได้ของ Claude CLI และ token

การยืนยันตัวตนด้วย setup-token ของ Anthropic ยังคงพร้อมใช้งานใน OpenClaw เป็นเส้นทาง token
ที่รองรับ เจ้าหน้าที่ Anthropic ได้แจ้งเราหลังจากนั้นว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p`
ได้รับการอนุญาตสำหรับการผสานการทำงานนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ เมื่อ
การใช้ Claude CLI ซ้ำพร้อมใช้งานบนโฮสต์ ตอนนี้เส้นทางนั้นเป็นเส้นทางที่แนะนำ

สำหรับโฮสต์ Gateway ที่มีอายุการทำงานยาวนาน คีย์ API ของ Anthropic ยังคงเป็นการตั้งค่า
ที่คาดการณ์ได้มากที่สุด หากคุณต้องการใช้การเข้าสู่ระบบ Claude ที่มีอยู่บนโฮสต์เดียวกันซ้ำ ให้ใช้
เส้นทาง Anthropic Claude CLI ใน onboarding/configure

การตั้งค่าโฮสต์ที่แนะนำสำหรับการใช้ Claude CLI ซ้ำ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

นี่คือการตั้งค่าแบบสองขั้นตอน:

1. เข้าสู่ระบบ Claude Code เองกับ Anthropic บนโฮสต์ Gateway
2. บอก OpenClaw ให้เปลี่ยนการเลือกโมเดล Anthropic ไปใช้ backend `claude-cli`
   ในเครื่อง และจัดเก็บโปรไฟล์การยืนยันตัวตน OpenClaw ที่ตรงกัน

หาก `claude` ไม่อยู่บน `PATH` ให้ติดตั้ง Claude Code ก่อน หรือตั้งค่า
`agents.defaults.cliBackends.claude-cli.command` เป็นพาธไบนารีจริง

การป้อน token ด้วยตนเอง (ผู้ให้บริการใดก็ได้; เขียน `auth-profiles.json` + อัปเดต config):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` จัดเก็บเฉพาะข้อมูลรับรอง รูปแบบมาตรฐานคือ:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw คาดหวังรูปแบบมาตรฐาน `version` + `profiles` ขณะรันไทม์ หากการติดตั้งที่เก่ากว่ายังมีไฟล์แบบแบน เช่น `{ "openrouter": { "apiKey": "..." } }` ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่เป็นโปรไฟล์คีย์ API แบบ `openrouter:default`; doctor จะเก็บสำเนา `.legacy-flat.*.bak` ไว้ข้างไฟล์เดิม รายละเอียด endpoint เช่น `baseUrl`, `api`, id โมเดล, headers และ timeouts ควรอยู่ภายใต้ `models.providers.<id>` ใน `openclaw.json` หรือ `models.json` ไม่ใช่ใน `auth-profiles.json`

รองรับ refs ของโปรไฟล์การยืนยันตัวตนสำหรับข้อมูลรับรองแบบคงที่ด้วย:

- ข้อมูลรับรอง `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- ข้อมูลรับรอง `token` สามารถใช้ `tokenRef: { source, provider, id }`
- โปรไฟล์โหมด OAuth ไม่รองรับข้อมูลรับรอง SecretRef; หากตั้งค่า `auth.profiles.<id>.mode` เป็น `"oauth"` อินพุต `keyRef`/`tokenRef` ที่รองรับด้วย SecretRef สำหรับโปรไฟล์นั้นจะถูกปฏิเสธ

การตรวจสอบที่เหมาะกับระบบอัตโนมัติ (ออกด้วย `1` เมื่อหมดอายุ/ไม่มีอยู่, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

การ probe การยืนยันตัวตนแบบสด:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน, ข้อมูลรับรอง env หรือ `models.json`
- หาก `auth.order.<provider>` ที่ระบุอย่างชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน
  `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้
- หากมีการยืนยันตัวตนอยู่ แต่ OpenClaw ไม่สามารถ resolve ตัวเลือกโมเดลที่ probe ได้สำหรับ
  ผู้ให้บริการนั้น probe จะรายงาน `status: no_model`
- cooldown จาก rate-limit สามารถผูกกับขอบเขตโมเดลได้ โปรไฟล์ที่กำลัง cooldown สำหรับโมเดลหนึ่ง
  ยังอาจใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน

สคริปต์ ops เสริม (systemd/Termux) มีเอกสารไว้ที่นี่:
[สคริปต์ตรวจสอบการยืนยันตัวตน](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุ Anthropic

backend `claude-cli` ของ Anthropic รองรับอีกครั้งแล้ว

- เจ้าหน้าที่ Anthropic แจ้งเราว่าเส้นทางการผสานการทำงานของ OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` ได้รับการอนุญาต
  สำหรับการรันที่รองรับโดย Anthropic เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- คีย์ API ของ Anthropic ยังคงเป็นตัวเลือกที่คาดการณ์ได้มากที่สุดสำหรับโฮสต์ Gateway
  ที่มีอายุการทำงานยาวนาน และการควบคุมการเรียกเก็บเงินฝั่งเซิร์ฟเวอร์อย่างชัดเจน

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุนเวียนคีย์ API (Gateway)

ผู้ให้บริการบางรายรองรับการลองคำขอซ้ำด้วยคีย์ทางเลือก เมื่อการเรียก API
ชนกับ rate limit ของผู้ให้บริการ

- ลำดับความสำคัญ:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override เดี่ยว)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ผู้ให้บริการ Google ยังรวม `GOOGLE_API_KEY` เป็น fallback เพิ่มเติมด้วย
- รายการคีย์เดียวกันจะถูก deduplicate ก่อนใช้งาน
- OpenClaw จะลองซ้ำด้วยคีย์ถัดไปเฉพาะสำหรับข้อผิดพลาด rate-limit เท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` หรือ
  `workers_ai ... quota limit exceeded`)
- ข้อผิดพลาดที่ไม่ใช่ rate-limit จะไม่ถูกลองซ้ำด้วยคีย์สำรอง
- หากคีย์ทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย

## การควบคุมว่าจะใช้ข้อมูลรับรองใด

### ต่อเซสชัน (คำสั่งแชต)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อ pin ข้อมูลรับรองผู้ให้บริการเฉพาะสำหรับเซสชันปัจจุบัน (ตัวอย่าง profile ids: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบกะทัดรัด; ใช้ `/model status` สำหรับมุมมองทั้งหมด (candidates + โปรไฟล์การยืนยันตัวตนถัดไป รวมถึงรายละเอียด endpoint ของผู้ให้บริการเมื่อกำหนดค่าไว้)

### ต่อ agent (CLI override)

ตั้งค่า override ลำดับโปรไฟล์การยืนยันตัวตนอย่างชัดเจนสำหรับ agent (จัดเก็บใน `auth-state.json` ของ agent นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อกำหนดเป้าหมาย agent เฉพาะ; ละไว้เพื่อใช้ agent เริ่มต้นที่กำหนดค่าไว้
เมื่อคุณ debug ปัญหาลำดับ `openclaw models status --probe` จะแสดงโปรไฟล์
ที่จัดเก็บซึ่งถูกละเว้นเป็น `excluded_by_auth_order` แทนที่จะข้ามไปโดยไม่บอก
เมื่อคุณ debug ปัญหา cooldown โปรดจำไว้ว่า cooldown จาก rate-limit อาจผูกกับ
id โมเดลหนึ่งแทนที่จะเป็นโปรไฟล์ผู้ให้บริการทั้งหมด

## การแก้ไขปัญหา

### "No credentials found"

หากโปรไฟล์ Anthropic หายไป ให้กำหนดค่าคีย์ API ของ Anthropic บน
**โฮสต์ Gateway** หรือตั้งค่าเส้นทาง setup-token ของ Anthropic แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### Token ใกล้หมดอายุ/หมดอายุแล้ว

รัน `openclaw models status` เพื่อยืนยันว่าโปรไฟล์ใดกำลังจะหมดอายุ หากโปรไฟล์
token ของ Anthropic หายไปหรือหมดอายุ ให้ refresh การตั้งค่านั้นผ่าน
setup-token หรือย้ายไปใช้คีย์ API ของ Anthropic

## ที่เกี่ยวข้อง

- [การจัดการ Secrets](/th/gateway/secrets)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [ที่จัดเก็บการยืนยันตัวตน](/th/concepts/oauth)
