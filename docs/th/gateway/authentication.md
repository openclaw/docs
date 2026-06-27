---
read_when:
    - การดีบักการตรวจสอบสิทธิ์ของโมเดลหรือการหมดอายุของ OAuth
    - การจัดทำเอกสารเกี่ยวกับการยืนยันตัวตนหรือการจัดเก็บข้อมูลรับรอง
summary: 'การยืนยันตัวตนของโมเดล: OAuth, คีย์ API, การใช้ Claude CLI ซ้ำ และ Anthropic setup-token'
title: การยืนยันตัวตน
x-i18n:
    generated_at: "2026-06-27T17:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
หน้านี้เป็นเอกสารอ้างอิงการยืนยันตัวตนสำหรับ **ผู้ให้บริการโมเดล** (คีย์ API, OAuth, การใช้ Claude CLI ซ้ำ และ Anthropic setup-token) สำหรับการยืนยันตัวตนของ **การเชื่อมต่อ Gateway** (token, password, trusted-proxy) โปรดดู [การกำหนดค่า](/th/gateway/configuration) และ [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)
</Note>

OpenClaw รองรับ OAuth และคีย์ API สำหรับผู้ให้บริการโมเดล สำหรับโฮสต์ Gateway
ที่ทำงานตลอดเวลา คีย์ API มักเป็นตัวเลือกที่คาดการณ์ได้มากที่สุด โฟลว์แบบ Subscription/OAuth
ก็รองรับเช่นกันเมื่อสอดคล้องกับรูปแบบบัญชีผู้ให้บริการของคุณ

ดู [/concepts/oauth](/th/concepts/oauth) สำหรับโฟลว์ OAuth และโครงร่างพื้นที่จัดเก็บ
ทั้งหมด
สำหรับการยืนยันตัวตนแบบ SecretRef (`env`/`file`/`exec` providers) โปรดดู [การจัดการความลับ](/th/gateway/secrets)
สำหรับกฎสิทธิ์การใช้ข้อมูลประจำตัว/รหัสเหตุผลที่ใช้โดย `models status --probe` โปรดดู
[ความหมายของข้อมูลประจำตัวสำหรับการยืนยันตัวตน](/th/auth-credential-semantics)

## การตั้งค่าที่แนะนำ (คีย์ API, ผู้ให้บริการใดก็ได้)

หากคุณกำลังใช้งาน Gateway ที่อยู่ระยะยาว ให้เริ่มด้วยคีย์ API สำหรับผู้ให้บริการ
ที่คุณเลือก
สำหรับ Anthropic โดยเฉพาะ การยืนยันตัวตนด้วยคีย์ API ยังเป็นการตั้งค่าเซิร์ฟเวอร์
ที่คาดการณ์ได้มากที่สุด แต่ OpenClaw ยังรองรับการใช้การเข้าสู่ระบบ Claude CLI ในเครื่องซ้ำด้วย

1. สร้างคีย์ API ในคอนโซลผู้ให้บริการของคุณ
2. วางไว้บน **โฮสต์ Gateway** (เครื่องที่รัน `openclaw gateway`)

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. หาก Gateway ทำงานภายใต้ systemd/launchd ให้แนะนำให้ใส่คีย์ไว้ใน
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

หากคุณไม่ต้องการจัดการ env vars ด้วยตัวเอง onboarding สามารถจัดเก็บ
คีย์ API สำหรับให้ daemon ใช้งานได้: `openclaw onboard`

ดู [ความช่วยเหลือ](/th/help) สำหรับรายละเอียดเกี่ยวกับการสืบทอด env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd)

## Anthropic: Claude CLI และความเข้ากันได้ของ token

การยืนยันตัวตนแบบ Anthropic setup-token ยังมีอยู่ใน OpenClaw ในฐานะเส้นทาง token
ที่รองรับ เจ้าหน้าที่ Anthropic ได้แจ้งเราภายหลังว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p`
เป็นสิ่งที่ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ เมื่อ
การใช้ Claude CLI ซ้ำพร้อมใช้งานบนโฮสต์ นั่นคือเส้นทางที่แนะนำในตอนนี้

สำหรับโฮสต์ Gateway ที่อยู่ระยะยาว คีย์ API ของ Anthropic ยังเป็นการตั้งค่า
ที่คาดการณ์ได้มากที่สุด หากคุณต้องการใช้การเข้าสู่ระบบ Claude ที่มีอยู่บนโฮสต์เดียวกันซ้ำ ให้ใช้
เส้นทาง Anthropic Claude CLI ใน onboarding/configure

การตั้งค่าโฮสต์ที่แนะนำสำหรับการใช้ Claude CLI ซ้ำ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

นี่เป็นการตั้งค่าแบบสองขั้นตอน:

1. เข้าสู่ระบบ Claude Code เองกับ Anthropic บนโฮสต์ Gateway
2. บอกให้ OpenClaw เปลี่ยนการเลือกโมเดล Anthropic ไปใช้ backend `claude-cli`
   ในเครื่อง และจัดเก็บโปรไฟล์การยืนยันตัวตน OpenClaw ที่ตรงกัน

หาก `claude` ไม่อยู่ใน `PATH` ให้ติดตั้ง Claude Code ก่อน หรือกำหนด
`agents.defaults.cliBackends.claude-cli.command` เป็นเส้นทาง binary จริง

การป้อน token ด้วยตนเอง (ผู้ให้บริการใดก็ได้; เขียนไปยังพื้นที่จัดเก็บการยืนยันตัวตน SQLite ต่อ agent + อัปเดต config):

```bash
openclaw models auth paste-token --provider openrouter
```

พื้นที่จัดเก็บโปรไฟล์การยืนยันตัวตนเก็บเฉพาะข้อมูลประจำตัวเท่านั้น ไฟล์ `auth-profiles.json` แบบเก่าใช้รูปทรงมาตรฐานนี้:

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

ตอนนี้ OpenClaw อ่านโปรไฟล์การยืนยันตัวตนจาก `openclaw-agent.sqlite` ของ agent แต่ละตัว หากการติดตั้งเก่ายังมี `auth-profiles.json`, `auth-state.json` หรือไฟล์โปรไฟล์การยืนยันตัวตนแบบแบน เช่น `{ "openrouter": { "apiKey": "..." } }` ให้รัน `openclaw doctor --fix` เพื่อนำเข้าไปยัง SQLite; doctor จะเก็บข้อมูลสำรองพร้อม timestamp ไว้ข้างไฟล์ JSON ต้นฉบับ รายละเอียด endpoint เช่น `baseUrl`, `api`, model ids, headers และ timeouts ควรอยู่ใต้ `models.providers.<id>` ใน `openclaw.json` หรือ `models.json` ไม่ใช่ในโปรไฟล์การยืนยันตัวตน

เส้นทางการยืนยันตัวตนภายนอก เช่น Bedrock `auth: "aws-sdk"` ก็ไม่ใช่ข้อมูลประจำตัวเช่นกัน หากคุณต้องการเส้นทาง Bedrock ที่มีชื่อ ให้ใส่ `auth.profiles.<id>.mode: "aws-sdk"` ใน `openclaw.json`; อย่าเขียน `type: "aws-sdk"` ลงในพื้นที่จัดเก็บโปรไฟล์การยืนยันตัวตน `openclaw doctor --fix` จะย้าย marker AWS SDK แบบเก่าจากพื้นที่จัดเก็บข้อมูลประจำตัวไปยัง metadata ของ config

โปรไฟล์การยืนยันตัวตนแบบ refs ยังรองรับข้อมูลประจำตัวแบบ static ด้วย:

- ข้อมูลประจำตัว `api_key` สามารถใช้ `keyRef: { source, provider, id }`
- ข้อมูลประจำตัว `token` สามารถใช้ `tokenRef: { source, provider, id }`
- โปรไฟล์โหมด OAuth ไม่รองรับข้อมูลประจำตัว SecretRef; หาก `auth.profiles.<id>.mode` ถูกตั้งค่าเป็น `"oauth"` อินพุต `keyRef`/`tokenRef` ที่อิง SecretRef สำหรับโปรไฟล์นั้นจะถูกปฏิเสธ

การตรวจสอบที่เหมาะกับ automation (ออกด้วย `1` เมื่อหมดอายุ/ขาดหาย, `2` เมื่อใกล้หมดอายุ):

```bash
openclaw models status --check
```

การ probe การยืนยันตัวตนแบบ live:

```bash
openclaw models status --probe
```

หมายเหตุ:

- แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน, ข้อมูลประจำตัว env หรือ `models.json`
- หาก `auth.order.<provider>` แบบ explicit ละเว้นโปรไฟล์ที่จัดเก็บไว้ probe จะรายงาน
  `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้
- หากมีการยืนยันตัวตนอยู่ แต่ OpenClaw ไม่สามารถ resolve candidate โมเดลที่ probe ได้สำหรับ
  ผู้ให้บริการนั้น probe จะรายงาน `status: no_model`
- cooldown จาก rate-limit อาจผูกกับขอบเขตโมเดล โปรไฟล์ที่อยู่ในช่วง cooling down สำหรับ
  โมเดลหนึ่งยังอาจใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน

สคริปต์ปฏิบัติการเสริม (systemd/Termux) มีเอกสารไว้ที่นี่:
[สคริปต์ตรวจสอบการยืนยันตัวตน](/th/help/scripts#auth-monitoring-scripts)

## หมายเหตุ Anthropic

backend `claude-cli` ของ Anthropic รองรับอีกครั้งแล้ว

- เจ้าหน้าที่ Anthropic แจ้งเราว่าเส้นทางการผสานรวม OpenClaw นี้ได้รับอนุญาตอีกครั้ง
- ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นสิ่งที่ได้รับอนุญาต
  สำหรับการรันที่อิง Anthropic เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- คีย์ API ของ Anthropic ยังคงเป็นตัวเลือกที่คาดการณ์ได้มากที่สุดสำหรับโฮสต์ Gateway
  ที่อยู่ระยะยาว และการควบคุมการเรียกเก็บเงินฝั่งเซิร์ฟเวอร์อย่างชัดเจน

## การตรวจสอบสถานะการยืนยันตัวตนของโมเดล

```bash
openclaw models status
openclaw doctor
```

## พฤติกรรมการหมุนเวียนคีย์ API (Gateway)

ผู้ให้บริการบางรายรองรับการลอง request ซ้ำด้วยคีย์ทางเลือกเมื่อ API call
ชน rate limit ของผู้ให้บริการ

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
- ข้อผิดพลาดที่ไม่ใช่ rate-limit จะไม่ถูกลองซ้ำด้วยคีย์ทางเลือก
- หากทุกคีย์ล้มเหลว ระบบจะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย

## การลบการยืนยันตัวตนของผู้ให้บริการขณะที่ Gateway กำลังทำงาน

เมื่อการยืนยันตัวตนของผู้ให้บริการถูกลบผ่าน control plane ของ Gateway, OpenClaw จะลบ
โปรไฟล์การยืนยันตัวตนที่บันทึกไว้สำหรับผู้ให้บริการนั้น และ abort chat หรือ agent run ที่กำลังทำงาน
ซึ่งผู้ให้บริการโมเดลที่เลือกตรงกับผู้ให้บริการที่ถูกลบ run ที่ถูก abort จะ emit
เหตุการณ์การยกเลิก chat และ lifecycle ตามปกติพร้อม
`stopReason: "auth-revoked"` เพื่อให้ client ที่เชื่อมต่ออยู่แสดงได้ว่า run ถูก
หยุดเพราะข้อมูลประจำตัวถูกลบ

การลบการยืนยันตัวตนที่บันทึกไว้ไม่ได้ revoke คีย์ที่ผู้ให้บริการ ให้ rotate หรือ revoke
คีย์ในแดชบอร์ดผู้ให้บริการเมื่อคุณต้องการทำให้ฝั่งผู้ให้บริการเป็นโมฆะ

## การควบคุมว่าจะใช้ข้อมูลประจำตัวใด

### OpenAI และ id `openai-codex` แบบเก่า

โปรไฟล์คีย์ API ของ OpenAI และโปรไฟล์ ChatGPT/Codex OAuth ต่างใช้ id ผู้ให้บริการมาตรฐาน
`openai` config ใหม่ควรใช้ profile ids `openai:*` และ
`auth.order.openai`

หากคุณเห็น `openai-codex` ใน config เก่า, auth profile ids หรือ
`auth.order.openai-codex` ให้ถือว่าเป็นอินพุต migration แบบเก่า อย่าสร้างโปรไฟล์
`openai-codex` ใหม่ ให้รัน:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor จะเขียน profile ids `openai-codex:*` แบบเก่าและรายการ
`auth.order.openai-codex` ใหม่ไปยังเส้นทางการยืนยันตัวตน `openai` มาตรฐาน สำหรับ
การ routing เฉพาะโมเดล/runtime ของ OpenAI โปรดดู [OpenAI](/th/providers/openai)

### ระหว่างการเข้าสู่ระบบ (CLI)

ใช้ `openclaw models auth login --provider <id> --profile-id <profileId>` สำหรับ
ผู้ให้บริการที่รองรับโปรไฟล์การยืนยันตัวตนแบบมีชื่อระหว่างการเข้าสู่ระบบ

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

นี่เป็นวิธีที่ง่ายที่สุดในการแยกการเข้าสู่ระบบ OAuth หลายรายการสำหรับผู้ให้บริการเดียวกัน
ไว้ภายใน agent เดียว

ใช้ `--force` เมื่อโปรไฟล์ผู้ให้บริการที่บันทึกไว้ค้าง, หมดอายุ หรือผูกกับ
บัญชีผิด และคำสั่งเข้าสู่ระบบปกติยังคงนำกลับมาใช้ซ้ำ `--force` จะลบ
โปรไฟล์การยืนยันตัวตนที่บันทึกไว้สำหรับผู้ให้บริการนั้นในไดเรกทอรี agent ที่เลือก จากนั้น
รันโฟลว์การยืนยันตัวตนของผู้ให้บริการเดิมอีกครั้ง มันไม่ได้ revoke ข้อมูลประจำตัวที่
ผู้ให้บริการ; rotate หรือ revoke ในแดชบอร์ดผู้ให้บริการเมื่อคุณต้องการ
ทำให้ฝั่งผู้ให้บริการเป็นโมฆะ

```bash
openclaw models auth login --provider anthropic --force
```

### ต่อเซสชัน (คำสั่ง chat)

ใช้ `/model <alias-or-id>@<profileId>` เพื่อ pin ข้อมูลประจำตัวของผู้ให้บริการเฉพาะสำหรับเซสชันปัจจุบัน (ตัวอย่าง profile ids: `anthropic:default`, `anthropic:work`)

ใช้ `/model` (หรือ `/model list`) สำหรับตัวเลือกแบบ compact; ใช้ `/model status` สำหรับมุมมองเต็ม (candidates + โปรไฟล์การยืนยันตัวตนถัดไป รวมถึงรายละเอียด endpoint ของผู้ให้บริการเมื่อกำหนดค่าไว้)

### ต่อ agent (CLI override)

ตั้งค่า override ลำดับโปรไฟล์การยืนยันตัวตนแบบ explicit สำหรับ agent (จัดเก็บในสถานะการยืนยันตัวตน SQLite ของ agent นั้น):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

ใช้ `--agent <id>` เพื่อกำหนดเป้าหมาย agent เฉพาะ; ละเว้นเพื่อใช้ agent เริ่มต้นที่กำหนดค่าไว้
เมื่อคุณ debug ปัญหาลำดับ `openclaw models status --probe` จะแสดงโปรไฟล์ที่จัดเก็บไว้
ซึ่งถูกละเว้นเป็น `excluded_by_auth_order` แทนที่จะข้ามไปเงียบ ๆ
เมื่อคุณ debug ปัญหา cooldown โปรดจำว่า cooldown จาก rate-limit อาจผูกกับ
model id หนึ่งรายการแทนที่จะเป็นโปรไฟล์ผู้ให้บริการทั้งหมด

หากคุณเปลี่ยนลำดับการยืนยันตัวตนหรือการ pin โปรไฟล์สำหรับ chat ที่กำลังทำงานอยู่แล้ว
ให้ส่ง `/new` หรือ `/reset` ใน chat นั้นเพื่อเริ่มเซสชันใหม่ เซสชันที่มีอยู่
สามารถคงการเลือกโมเดล/โปรไฟล์ปัจจุบันไว้ได้จนกว่าจะ reset

## การแก้ไขปัญหา

### "No credentials found"

หากโปรไฟล์ Anthropic ขาดหาย ให้กำหนดค่าคีย์ API ของ Anthropic บน
**โฮสต์ Gateway** หรือตั้งค่าเส้นทาง Anthropic setup-token จากนั้นตรวจสอบอีกครั้ง:

```bash
openclaw models status
```

### Token ใกล้หมดอายุ/หมดอายุ

รัน `openclaw models status` เพื่อยืนยันว่าโปรไฟล์ใดกำลังจะหมดอายุ หาก
โปรไฟล์ token ของ Anthropic ขาดหายหรือหมดอายุ ให้ refresh การตั้งค่านั้นผ่าน
setup-token หรือ migrate ไปใช้คีย์ API ของ Anthropic

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [พื้นที่จัดเก็บการยืนยันตัวตน](/th/concepts/oauth)
