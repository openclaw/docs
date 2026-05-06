---
read_when:
    - การดีบักการยืนยันตัวตนของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บข้อมูลรับรอง
summary: 'การยืนยันตัวตนของโมเดล: OAuth, คีย์ API, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-05-06T09:11:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
หน้านี้เป็นเอกสารอ้างอิงการยืนยันตัวตนของ **ผู้ให้บริการโมเดล** (คีย์ API, OAuth, การใช้ Claude CLI ซ้ำ และ Anthropic setup-token) สำหรับการยืนยันตัวตนของ **การเชื่อมต่อ Gateway** (token, password, trusted-proxy) โปรดดู [การกำหนดค่า](/th/gateway/configuration) และ [การยืนยันตัวตนด้วย Trusted Proxy](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับ OAuth และคีย์ API สำหรับผู้ให้บริการโมเดล สำหรับโฮสต์ Gateway
ที่เปิดทำงานตลอดเวลา คีย์ API มักเป็นตัวเลือกที่คาดเดาได้มากที่สุด นอกจากนี้ยังรองรับโฟลว์
Subscription/OAuth เมื่อสอดคล้องกับรูปแบบบัญชีผู้ให้บริการของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับโฟลว์ OAuth แบบเต็มและรูปแบบการจัดเก็บ
สำหรับการยืนยันตัวตนแบบ SecretRef (ผู้ให้บริการ `env`/`file`/`exec`) โปรดดู [การจัดการความลับ](/th/gateway/secrets)
สำหรับกฎคุณสมบัติของข้อมูลรับรอง/รหัสเหตุผลที่ใช้โดย `models status --probe` โปรดดู
[ความหมายของข้อมูลรับรองการยืนยันตัวตน](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (คีย์ API, ผู้ให้บริการใดก็ได้)

หากคุณใช้งาน Gateway ที่มีอายุการใช้งานยาวนาน ให้เริ่มด้วยคีย์ API สำหรับ
ผู้ให้บริการที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วยคีย์ API ยังเป็นการตั้งค่าเซิร์ฟเวอร์
ที่คาดเดาได้มากที่สุด แต่ OpenClaw ยังรองรับการใช้การเข้าสู่ระบบ Claude CLI ในเครื่องซ้ำด้วย

1. สร้างคีย์ API ในคอนโซลของผู้ให้บริการของคุณ
2. วางคีย์ไว้บน **โฮสต์ Gateway** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway รันภายใต้ systemd/launchd แนะนำให้วางคีย์ไว้ใน
   `~/.openclaw/.env` เพื่อให้ daemon อ่านได้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

จากนั้นรีสตาร์ท daemon (หรือรีสตาร์ทกระบวนการ Gateway ของคุณ) แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
openclaw doctor
```

หากคุณไม่ต้องการจัดการ env vars เอง การเริ่มต้นใช้งานสามารถจัดเก็บ
คีย์ API สำหรับให้ daemon ใช้ได้: `openclaw onboard`

ดู [ความช่วยเหลือ](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: ความเข้ากันได้ของ Claude CLI และโทเค็น

การยืนยันตัวตนแบบ Anthropic setup-token ยังมีอยู่ใน OpenClaw ในฐานะเส้นทางโทเค็น
ที่รองรับ ตั้งแต่นั้นมา เจ้าหน้าที่ Anthropic ได้แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p`
ได้รับการอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ เมื่อ
การใช้ Claude CLI ซ้ำพร้อมใช้งานบนโฮสต์ ตอนนี้เส้นทางนั้นเป็นเส้นทางที่แนะนำ

สำหรับโฮสต์ Gateway ที่มีอายุการใช้งานยาวนาน คีย์ API ของ Anthropic ยังคงเป็น
การตั้งค่าที่คาดเดาได้มากที่สุด หากคุณต้องการใช้การเข้าสู่ระบบ Claude ที่มีอยู่บนโฮสต์เดียวกันซ้ำ ให้ใช้
เส้นทาง Anthropic Claude CLI ในการเริ่มต้นใช้งาน/กำหนดค่า

การตั้งค่าโฮสต์ที่แนะนำสำหรับการใช้ Claude CLI ซ้ำ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

นี่เป็นการตั้งค่าแบบสองขั้นตอน:

1. เข้าสู่ระบบ Claude Code เองกับ Anthropic บนโฮสต์ Gateway
2. บอกให้ OpenClaw เปลี่ยนการเลือกโมเดล Anthropic ไปใช้แบ็กเอนด์ `claude-cli`
   ในเครื่อง และจัดเก็บโปรไฟล์การยืนยันตัวตน OpenClaw ที่ตรงกัน

หาก `claude` ไม่อยู่ใน `PATH` ให้ติดตั้ง Claude Code ก่อน หรือกำหนด
`agents.defaults.cliBackends.claude-cli.command` เป็นพาธไบนารีจริง

การป้อนโทเค็นด้วยตนเอง (ผู้ให้บริการใดก็ได้; เขียน `auth-profiles.json` + อัปเดต config):

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

OpenClaw คาดหวังรูปแบบมาตรฐาน `version` + `profiles` ตอนรันไทม์ หากการติดตั้งรุ่นเก่ายังมีไฟล์แบบแบน เช่น `{ "openrouter": { "apiKey": "..." } }` ให้รัน `openclaw doctor --fix` เพื่อเขียนใหม่เป็นโปรไฟล์คีย์ API `openrouter:default`; doctor จะเก็บสำเนา `.legacy-flat.*.bak` ไว้ข้างต้นฉบับ รายละเอียด endpoint เช่น `baseUrl`, `api`, ids ของโมเดล, headers และ timeouts ควรอยู่ภายใต้ `models.providers.<id>` ใน `openclaw.json` หรือ `models.json` ไม่ใช่ใน `auth-profiles.json`

รองรับ refs ของโปรไฟล์การยืนยันตัวตนสำหรับข้อมูลรับรองแบบคงที่ด้วย:

- ข้อมูลรับรอง `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- ข้อมูลรับรอง `token` สามารถใช้ `tokenRef: { source, provider, id }`
- โปรไฟล์โหมด OAuth ไม่รองรับข้อมูลรับรอง SecretRef; หากตั้งค่า `auth.profiles.<id>.mode` เป็น `"oauth"` อินพุต `keyRef`/`tokenRef` ที่มี SecretRef หนุนหลังสำหรับโปรไฟล์นั้นจะถูกปฏิเสธ

การตรวจสอบที่เป็นมิตรกับระบบอัตโนมัติ (ออกด้วย `1` เมื่อหมดอายุ/ไม่มี, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

การ probe การยืนยันตัวตนแบบสด:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน, ข้อมูลรับรอง env หรือ `models.json`
- หาก `auth.order.<provider>` แบบชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน
  `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้
- หากมีการยืนยันตัวตนอยู่ แต่ OpenClaw ไม่สามารถแก้ไขผู้สมัครโมเดลที่ probe ได้สำหรับ
  ผู้ให้บริการนั้น probe จะรายงาน `status: no_model`
- คูลดาวน์จากขีดจำกัดอัตราสามารถผูกกับโมเดลได้ โปรไฟล์ที่กำลังคูลดาวน์สำหรับโมเดลหนึ่ง
  อาจยังใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน

สคริปต์ปฏิบัติการเสริม (systemd/Termux) มีเอกสารที่นี่:
[สคริปต์ตรวจสอบการยืนยันตัวตน](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุ Anthropic

รองรับแบ็กเอนด์ Anthropic `claude-cli` อีกครั้ง

- เจ้าหน้าที่ Anthropic แจ้งเราว่าเส้นทางการผสานรวม OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับการอนุมัติ
  สำหรับการรันที่หนุนหลังด้วย Anthropic เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- คีย์ API ของ Anthropic ยังคงเป็นตัวเลือกที่คาดเดาได้มากที่สุดสำหรับโฮสต์ Gateway
  ที่มีอายุการใช้งานยาวนานและการควบคุมการเรียกเก็บเงินฝั่งเซิร์ฟเวอร์อย่างชัดเจน

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุนเวียนคีย์ API (Gateway)

ผู้ให้บริการบางรายรองรับการลองคำขอใหม่ด้วยคีย์สำรองเมื่อการเรียก API
ชนขีดจำกัดอัตราของผู้ให้บริการ

- ลำดับความสำคัญ:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การแทนที่เดี่ยว)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ผู้ให้บริการ Google ยังรวม `GOOGLE_API_KEY` เป็น fallback เพิ่มเติมด้วย
- รายการคีย์เดียวกันจะถูกลบรายการซ้ำก่อนใช้งาน
- OpenClaw จะลองใหม่ด้วยคีย์ถัดไปเฉพาะสำหรับข้อผิดพลาดขีดจำกัดอัตราเท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` หรือ
  `workers_ai ... quota limit exceeded`)
- ข้อผิดพลาดที่ไม่ใช่ขีดจำกัดอัตราจะไม่ถูกลองใหม่ด้วยคีย์สำรอง
- หากคีย์ทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งล่าสุด

## การควบคุมว่าจะใช้ข้อมูลรับรองใด

### ต่อเซสชัน (คำสั่งแชท)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อปักหมุดข้อมูลรับรองของผู้ให้บริการเฉพาะสำหรับเซสชันปัจจุบัน (ตัวอย่าง ids ของโปรไฟล์: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบย่อ; ใช้ `/model status` สำหรับมุมมองเต็ม (ผู้สมัคร + โปรไฟล์การยืนยันตัวตนถัดไป รวมถึงรายละเอียด endpoint ของผู้ให้บริการเมื่อกำหนดค่าไว้)

### ต่อเอเจนต์ (การแทนที่ CLI)

ตั้งค่าการแทนที่ลำดับโปรไฟล์การยืนยันตัวตนแบบชัดเจนสำหรับเอเจนต์ (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อกำหนดเป้าหมายเอเจนต์เฉพาะ; หากละเว้น จะใช้เอเจนต์เริ่มต้นที่กำหนดค่าไว้
เมื่อคุณดีบักปัญหาลำดับ `openclaw models status --probe` จะแสดงโปรไฟล์ที่จัดเก็บไว้ซึ่งถูกละเว้น
เป็น `excluded_by_auth_order` แทนที่จะข้ามอย่างเงียบ ๆ
เมื่อคุณดีบักปัญหาคูลดาวน์ โปรดจำไว้ว่าคูลดาวน์จากขีดจำกัดอัตราอาจผูกกับ
id ของโมเดลหนึ่งแทนที่จะเป็นโปรไฟล์ผู้ให้บริการทั้งหมด

## การแก้ไขปัญหา

### "No credentials found"

หากโปรไฟล์ Anthropic หายไป ให้กำหนดค่าคีย์ API ของ Anthropic บน
**โฮสต์ Gateway** หรือตั้งค่าเส้นทาง Anthropic setup-token จากนั้นตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### โทเค็นใกล้หมดอายุ/หมดอายุแล้ว

รัน `openclaw models status` เพื่อยืนยันว่าโปรไฟล์ใดกำลังจะหมดอายุ หาก
โปรไฟล์โทเค็น Anthropic หายไปหรือหมดอายุ ให้รีเฟรชการตั้งค่านั้นผ่าน
setup-token หรือย้ายไปใช้คีย์ API ของ Anthropic

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [ที่จัดเก็บการยืนยันตัวตน](/th/concepts/oauth)
