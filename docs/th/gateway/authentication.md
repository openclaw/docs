---
read_when:
    - การแก้ไขปัญหาการยืนยันตัวตนของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บข้อมูลรับรอง
summary: 'การยืนยันตัวตนของโมเดล: OAuth, API keys, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-04-25T13:46:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
หน้านี้ครอบคลุมการยืนยันตัวตนของ **provider โมเดล** (API keys, OAuth, การใช้ Claude CLI ซ้ำ และ setup-token ของ Anthropic) สำหรับการยืนยันตัวตนของ **การเชื่อมต่อ gateway** (token, password, trusted-proxy) โปรดดู [Configuration](/th/gateway/configuration) และ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับทั้ง OAuth และ API keys สำหรับ provider ของโมเดล สำหรับ
โฮสต์ gateway ที่เปิดทำงานตลอดเวลา API keys มักเป็นตัวเลือกที่คาดการณ์ได้มากที่สุด รองรับ
โฟลว์แบบ subscription/OAuth ด้วยเช่นกันเมื่อสอดคล้องกับรูปแบบบัญชีของ provider ของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับโฟลว์ OAuth แบบเต็มและโครงร่าง
การจัดเก็บ
สำหรับการยืนยันตัวตนแบบ SecretRef (`env`/`file`/`exec` providers) โปรดดู [Secrets Management](/th/gateway/secrets)
สำหรับกฎ eligibility/reason-code ของข้อมูลรับรองที่ใช้โดย `models status --probe` โปรดดู
[Auth Credential Semantics](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (API key, ได้กับทุก provider)

หากคุณกำลังรัน gateway แบบอายุยาว ให้เริ่มด้วย API key สำหรับ
provider ที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วย API key ยังคงเป็นการตั้งค่าเซิร์ฟเวอร์ที่
คาดการณ์ได้มากที่สุด แต่ OpenClaw ก็รองรับการใช้การล็อกอิน Claude CLI ในเครื่องซ้ำด้วย

1. สร้าง API key ในคอนโซลของ provider ของคุณ
2. ใส่คีย์นี้ไว้บน **โฮสต์ gateway** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway ทำงานภายใต้ systemd/launchd ควรใส่คีย์ไว้ใน
   `~/.openclaw/.env` เพื่อให้ดีมอนอ่านได้:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

จากนั้นรีสตาร์ตดีมอน (หรือรีสตาร์ตโปรเซส Gateway ของคุณ) และตรวจสอบอีกครั้ง:

```bash
openclaw models status
openclaw doctor
```

หากคุณไม่ต้องการจัดการ env vars ด้วยตนเอง การเริ่มต้นใช้งานสามารถจัดเก็บ
API keys เพื่อให้ดีมอนใช้งานได้: `openclaw onboard`

ดู [Help](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: ความเข้ากันได้ของ Claude CLI และ token

การยืนยันตัวตนด้วย setup-token ของ Anthropic ยังคงพร้อมใช้งานใน OpenClaw ในฐานะ
เส้นทาง token ที่รองรับ ตั้งแต่นั้นมาเจ้าหน้าที่ของ Anthropic ได้แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p`
เป็นสิ่งที่ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ เมื่อ
สามารถใช้ Claude CLI ซ้ำได้บนโฮสต์ เส้นทางนี้จึงเป็นตัวเลือกที่แนะนำในตอนนี้

สำหรับโฮสต์ gateway แบบอายุยาว Anthropic API key ยังคงเป็นการตั้งค่าที่
คาดการณ์ได้มากที่สุด หากคุณต้องการใช้การล็อกอิน Claude ที่มีอยู่บนโฮสต์เดียวกันซ้ำ ให้ใช้
เส้นทาง Anthropic Claude CLI ในการเริ่มต้นใช้งาน/การกำหนดค่า

การตั้งค่าโฮสต์ที่แนะนำสำหรับการใช้ Claude CLI ซ้ำ:

```bash
# รันบนโฮสต์ gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

นี่คือการตั้งค่าแบบสองขั้นตอน:

1. ล็อกอิน Claude Code เข้ากับ Anthropic บนโฮสต์ gateway ก่อน
2. บอก OpenClaw ให้สลับการเลือกโมเดล Anthropic ไปใช้ backend `claude-cli`
   ในเครื่อง และจัดเก็บโปรไฟล์การยืนยันตัวตน OpenClaw ที่ตรงกัน

หาก `claude` ไม่ได้อยู่บน `PATH` ให้ติดตั้ง Claude Code ก่อนหรือกำหนด
`agents.defaults.cliBackends.claude-cli.command` เป็นพาธจริงของไบนารี

การป้อน token ด้วยตนเอง (ใช้ได้กับทุก provider; เขียนลง `auth-profiles.json` + อัปเดตคอนฟิก):

```bash
openclaw models auth paste-token --provider openrouter
```

ยังรองรับ auth profile refs สำหรับข้อมูลรับรองแบบคงที่ด้วย:

- ข้อมูลรับรอง `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- ข้อมูลรับรอง `token` สามารถใช้ `tokenRef: { source, provider, id }`
- โปรไฟล์โหมด OAuth ไม่รองรับข้อมูลรับรองแบบ SecretRef; หากตั้งค่า `auth.profiles.<id>.mode` เป็น `"oauth"` อินพุต `keyRef`/`tokenRef` ที่รองรับด้วย SecretRef สำหรับโปรไฟล์นั้นจะถูกปฏิเสธ

การตรวจสอบที่เหมาะกับงานอัตโนมัติ (ออกด้วยรหัส `1` เมื่อหมดอายุ/ไม่มี, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

การ probe การยืนยันตัวตนแบบสด:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถวของ probe อาจมาจาก auth profiles, ข้อมูลรับรองจาก env หรือ `models.json`
- หาก `auth.order.<provider>` แบบชัดเจนละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน
  `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนการลองใช้งาน
- หากมีการยืนยันตัวตนอยู่แต่ OpenClaw ไม่สามารถ resolve ผู้สมัครโมเดลที่ probe ได้สำหรับ
  provider นั้น probe จะรายงาน `status: no_model`
- ช่วง cooldown ของ rate-limit อาจผูกกับขอบเขตของโมเดล โปรไฟล์ที่อยู่ในช่วง cooldown สำหรับ
  โมเดลหนึ่งอาจยังใช้งานได้กับโมเดลพี่น้องบน provider เดียวกัน

สคริปต์ ops แบบไม่บังคับ (systemd/Termux) มีเอกสารไว้ที่นี่:
[Auth monitoring scripts](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุเกี่ยวกับ Anthropic

backend `claude-cli` ของ Anthropic ได้รับการรองรับอีกครั้ง

- เจ้าหน้าที่ของ Anthropic แจ้งเราว่าเส้นทางการผสานรวม OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นสิ่งที่ได้รับอนุญาต
  สำหรับการรันที่รองรับโดย Anthropic เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic API keys ยังคงเป็นตัวเลือกที่คาดการณ์ได้มากที่สุดสำหรับโฮสต์ gateway
  แบบอายุยาวและการควบคุมการเรียกเก็บเงินฝั่งเซิร์ฟเวอร์อย่างชัดเจน

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุนเวียน API key (gateway)

provider บางรายรองรับการลองคำขอใหม่ด้วยคีย์สำรองเมื่อการเรียก API
ติด rate limit ของ provider

- ลำดับความสำคัญ:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override เดี่ยว)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- provider ของ Google จะรวม `GOOGLE_API_KEY` เป็น fallback เพิ่มเติมด้วย
- รายการคีย์เดียวกันจะถูกลบค่าซ้ำก่อนใช้งาน
- OpenClaw จะลองด้วยคีย์ถัดไปเฉพาะสำหรับข้อผิดพลาดจาก rate-limit เท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` หรือ
  `workers_ai ... quota limit exceeded`)
- ข้อผิดพลาดที่ไม่ใช่ rate-limit จะไม่ถูกลองใหม่ด้วยคีย์สำรอง
- หากคีย์ทั้งหมดล้มเหลว ระบบจะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย

## การควบคุมว่าจะใช้ข้อมูลรับรองใด

### รายเซสชัน (คำสั่งแชต)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อตรึงข้อมูลรับรองของ provider ที่ระบุสำหรับเซสชันปัจจุบัน (ตัวอย่าง profile id: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบย่อ; ใช้ `/model status` สำหรับมุมมองแบบเต็ม (candidates + auth profile ถัดไป รวมถึงรายละเอียด endpoint ของ provider เมื่อมีการกำหนดค่า)

### รายเอเจนต์ (override ผ่าน CLI)

ตั้งค่า override ลำดับ auth profile แบบชัดเจนสำหรับเอเจนต์ (จัดเก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อระบุเอเจนต์เฉพาะ; ละไว้เพื่อใช้เอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้
เมื่อคุณแก้ไขปัญหาเรื่องลำดับ `openclaw models status --probe` จะแสดงโปรไฟล์ที่จัดเก็บไว้แต่ถูกละเว้น
เป็น `excluded_by_auth_order` แทนที่จะข้ามไปอย่างเงียบ ๆ
เมื่อคุณแก้ไขปัญหาเรื่อง cooldown โปรดจำไว้ว่าช่วง cooldown ของ rate-limit อาจผูกอยู่กับ
model id หนึ่งตัว แทนที่จะเป็นทั้งโปรไฟล์ของ provider

## การแก้ไขปัญหา

### "No credentials found"

หากไม่มีโปรไฟล์ Anthropic ให้กำหนดค่า Anthropic API key บน
**โฮสต์ gateway** หรือตั้งค่าเส้นทาง setup-token ของ Anthropic แล้วตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### token ใกล้หมดอายุ/หมดอายุแล้ว

รัน `openclaw models status` เพื่อยืนยันว่าโปรไฟล์ใดกำลังจะหมดอายุ หากโปรไฟล์ token
ของ Anthropic ไม่มีอยู่หรือหมดอายุแล้ว ให้รีเฟรชการตั้งค่านั้นผ่าน
setup-token หรือย้ายไปใช้ Anthropic API key

## ที่เกี่ยวข้อง

- [การจัดการ Secrets](/th/gateway/secrets)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การจัดเก็บการยืนยันตัวตน](/th/concepts/oauth)
