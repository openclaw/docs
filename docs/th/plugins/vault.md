---
read_when:
    - คุณต้องการให้ OpenClaw อ่านคีย์ API จาก HashiCorp Vault
    - คุณกำลังตั้งค่า SecretRefs บนเครื่องภายในหรือเซิร์ฟเวอร์
    - คุณต้องกำหนดค่าข้อมูลประจำตัวของผู้ให้บริการโมเดลที่จัดเก็บใน Vault
summary: ใช้ Plugin Vault ที่รวมมาให้เพื่อแก้ไข SecretRefs จาก HashiCorp Vault
title: SecretRefs ของ Vault
x-i18n:
    generated_at: "2026-07-12T16:34:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRef ของ Vault

Plugin Vault ที่รวมมาให้ช่วยให้ OpenClaw แก้ค่า SecretRef แบบ `exec` จาก
HashiCorp Vault ได้เมื่อ Gateway เริ่มทำงานและเมื่อโหลดซ้ำ OpenClaw จัดเก็บ
การอ้างอิง Vault ไว้ในการกำหนดค่า เก็บค่าที่แก้แล้วไว้ในสแนปช็อตข้อมูลลับในหน่วยความจำ
และไม่เขียนคีย์ API ที่แก้แล้วกลับไปยัง `openclaw.json`

ใช้วิธีนี้เมื่อคุณใช้งาน Vault อยู่แล้ว หรือต้องการเก็บคีย์ของผู้ให้บริการโมเดลไว้นอก
ไฟล์การกำหนดค่าของ OpenClaw สำหรับโมเดลรันไทม์ของ SecretRef โปรดดู
[การจัดการข้อมูลลับ](/th/gateway/secrets)

## ก่อนเริ่มต้น

สิ่งที่ต้องมี:

- OpenClaw ที่มี Plugin `vault` แบบรวมมาให้พร้อมใช้งาน
- เซิร์ฟเวอร์ Vault ที่เข้าถึงได้
- การยืนยันตัวตน Vault ที่สามารถสร้างโทเค็นไคลเอนต์ซึ่งมีสิทธิ์อ่านพาธข้อมูลลับ
  ที่ OpenClaw ต้องแก้ค่า
- สภาพแวดล้อมที่เริ่ม Gateway ต้องมี `VAULT_ADDR` และอย่างใดอย่างหนึ่งต่อไปนี้:
  `VAULT_TOKEN`, `OPENCLAW_VAULT_AUTH_METHOD=token_file` ร่วมกับ `VAULT_TOKEN_FILE`
  หรือการเข้าสู่ระบบ JWT/Kubernetes ที่กำหนดค่าไว้

ตัวแก้ค่าจะสื่อสารกับ Vault ผ่าน HTTP จาก Node โดย Gateway ไม่จำเป็นต้องมี
Vault CLI เพื่อแก้ค่า SecretRef

เปิดใช้งาน Plugin ที่รวมมาให้ก่อนเรียกใช้คำสั่ง `openclaw vault`:

```bash
openclaw plugins enable vault
```

## จัดเก็บคีย์ผู้ให้บริการใน Vault

โดยค่าเริ่มต้น OpenClaw ใช้ KV v2 ที่เมานต์ไว้ที่ `secret` ซึ่งตรงกับ
ตัวอย่างเซิร์ฟเวอร์สำหรับการพัฒนาของ Vault สำหรับ Vault ที่ใช้งานจริง ให้ตั้งค่า
`OPENCLAW_VAULT_KV_MOUNT` เป็นพาธเมานต์ KV จริงของคุณก่อนสร้างรหัส SecretRef
เมื่อใช้ค่าเริ่มต้นของ OpenClaw รหัส SecretRef นี้:

```text
providers/openrouter/apiKey
```

จะอ่านฟิลด์ Vault นี้:

```text
secret/data/providers/openrouter -> apiKey
```

วิธีหนึ่งในการสร้างด้วย Vault CLI คือ:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

ใช้โทเค็นไคลเอนต์ที่จำกัดขอบเขตสำหรับ OpenClaw ไม่ใช่โทเค็นรูท สำหรับโครงสร้าง
KV v2 เริ่มต้น นโยบายขั้นต่ำสำหรับคีย์ผู้ให้บริการโมเดลมีลักษณะดังนี้:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## ทำให้ Gateway มองเห็น Vault

สำหรับ Gateway ภายในเครื่องที่ไม่ได้ทำงานในคอนเทนเนอร์ ให้ส่งออกการตั้งค่า Vault
ในเชลล์เดียวกับที่ใช้เริ่ม OpenClaw วิธีการยืนยันตัวตนเริ่มต้นจะอ่านโทเค็นไคลเอนต์
Vault จาก `VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

หาก Vault Agent เขียนไฟล์ปลายทางโทเค็น ให้ใช้การยืนยันตัวตนด้วยไฟล์โทเค็น:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

สำหรับเซิร์ฟเวอร์ Vault ที่ลงนามโดย CA ส่วนตัว ให้ติดตั้ง CA นั้นในคลังความเชื่อถือ
ของโฮสต์และเปิดใช้งานความเชื่อถือระบบของ Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

หรือระบุชุด PEM โดยตรง:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

ตัวแปรเหล่านี้ต้องมีอยู่เมื่อ OpenClaw เริ่มทำงาน Plugin Vault จะส่งต่อ
ตัวแปรเหล่านี้ไปยังกระบวนการแก้ค่า

สำหรับการยืนยันตัวตน JWT แบบไม่โต้ตอบ ให้ใช้ไฟล์ JWT ของเวิร์กโหลดและบทบาท Vault
ชนิด `jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

ไฟล์ JWT ควรเป็นโทเค็นเวิร์กโหลดที่ฉายเข้าไป เช่น โทเค็นบัญชีบริการ Kubernetes
ที่มีกลุ่มเป้าหมายซึ่งบทบาท Vault ยอมรับ
การเข้าสู่ระบบ OIDC ผ่านเบราว์เซอร์แบบโต้ตอบมีประโยชน์สำหรับผู้ใช้ แต่รันไทม์ของ Gateway
ต้องใช้การเข้าสู่ระบบ JWT แบบไม่โต้ตอบหรือไฟล์โทเค็น

สำหรับวิธีการยืนยันตัวตน Kubernetes ของ Vault ให้ใช้ `kubernetes` วิธีนี้มีไว้สำหรับ
Gateway ที่ทำงานเป็นพ็อด โดยเมานต์เริ่มต้นคือ `kubernetes` และไฟล์ JWT เริ่มต้น
คือพาธโทเค็นบัญชีบริการมาตรฐาน:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

ตั้งค่า `OPENCLAW_VAULT_AUTH_MOUNT` เฉพาะเมื่อ Vault เมานต์การยืนยันตัวตน Kubernetes
ไว้ที่ตำแหน่งอื่นนอกเหนือจาก `auth/kubernetes` ตั้งค่า `OPENCLAW_VAULT_JWT_FILE`
เฉพาะเมื่อโทเค็นบัญชีบริการถูกฉายไว้ที่พาธแบบกำหนดเอง

การตั้งค่าเพิ่มเติม:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

ตรวจสอบว่าเชลล์ปัจจุบันมองเห็นอะไรได้บ้าง:

```bash
openclaw vault status
```

เมื่อกำหนดค่าผู้ให้บริการข้อมูลลับที่ใช้ Vault มากกว่าหนึ่งราย ให้เลือกด้วยนามแฝง:

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` จะไม่แสดง `VAULT_TOKEN` โดยจะรายงานเพียงว่าได้ตั้งค่า
โทเค็น ไฟล์โทเค็น และไฟล์ JWT แล้วหรือไม่

<Warning>
หาก Gateway ทำงานเป็นบริการ, LaunchAgent, ยูนิต systemd, งานตามกำหนดเวลา หรือ
คอนเทนเนอร์ สภาพแวดล้อมรันไทม์นั้นต้องได้รับตัวแปร Vault ชุดเดียวกัน
การตั้งค่าตัวแปรในเชลล์แบบโต้ตอบพิสูจน์ได้เฉพาะเชลล์นั้น ไม่ใช่ Gateway
ที่กำลังทำงานอยู่แล้ว
</Warning>

## สร้างและใช้แผน SecretRef

สร้างแผนที่แมปคีย์ API ของผู้ให้บริการโมเดล OpenRouter ไปยัง Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

ใช้และตรวจสอบแผน:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

ใช้ `--allow-exec` เนื่องจาก Plugin Vault แก้ค่าผ่านผู้ให้บริการ SecretRef แบบ exec
ที่ OpenClaw จัดการ

หาก Gateway ยังไม่ทำงาน ให้เริ่มตามปกติหลังใช้แผน แทนการเรียกใช้
`openclaw secrets reload`

## กำหนดค่าคีย์ผู้ให้บริการเพิ่มเติม

ทางลัดในตัว:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

คีย์ผู้ให้บริการหลายรายการในแผนเดียว:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

ผู้ให้บริการที่รวมมาให้แต่ไม่มีทางลัด หรือผู้ให้บริการโมเดลที่เข้ากันได้กับ OpenAI
และผู้ให้บริการโมเดลแบบกำหนดเองที่กำหนดค่าไว้แล้ว ให้ใช้ `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

`--provider-key <provider=id>` แต่ละรายการจะเขียน SecretRef ไปยัง
`models.providers.<provider>.apiKey` สำหรับผู้ให้บริการแบบกำหนดเอง คำสั่งนี้จะไม่สร้าง
การตั้งค่า `baseUrl`, `api` หรือ `models` ของผู้ให้บริการ ให้กำหนดค่าเหล่านั้นก่อน

ใช้ `--target <path=id>` สำหรับพาธเป้าหมาย SecretRef ที่รู้จัก:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

พาธเป้าหมายเปล่าจะใช้กับ `openclaw.json` ใช้
`auth-profiles:<agentId>:<path>` สำหรับเป้าหมาย `auth-profiles.json` ที่มีอยู่
พาธเป้าหมายต้องเป็นเป้าหมาย SecretRef ของ OpenClaw ที่ลงทะเบียนไว้ คำสั่งตั้งค่า
จะไม่สร้างข้อมูลลับที่ตั้งชื่อได้อย่างอิสระใน OpenClaw โดย Vault ยังคงเป็น
ที่จัดเก็บข้อมูลลับ และ OpenClaw จะจัดเก็บ SecretRef เฉพาะในฟิลด์การกำหนดค่า
ที่รองรับเท่านั้น

## รูปแบบรหัส SecretRef

รหัส SecretRef ของ Vault ใช้รูปแบบนี้:

```text
<vault-secret-path>/<field>
```

ตัวอย่าง:

| รหัส SecretRef                 | การอ่าน Vault แบบ KV v2 เริ่มต้น   | ฟิลด์ที่ส่งคืน |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

ฟิลด์ Vault ที่ส่งคืนต้องเป็นสตริง

สำหรับ KV v1 ให้ตั้งค่า:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

จากนั้น `providers/openrouter/apiKey` จะอ่าน:

```text
secret/providers/openrouter -> apiKey
```

## สิ่งที่ OpenClaw จัดเก็บ

การใช้แผนตั้งค่า Vault จะจัดเก็บผู้ให้บริการที่ Plugin จัดการ:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

ฟิลด์ข้อมูลประจำตัวจะชี้ไปยังผู้ให้บริการนั้น:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

ค่าที่แก้แล้วจะอยู่เฉพาะในสแนปช็อตข้อมูลลับของรันไทม์ที่ใช้งานอยู่

## คอนเทนเนอร์และการติดตั้งใช้งานที่มีการจัดการ

Gateway ที่ทำงานในคอนเทนเนอร์ยังคงใช้ Plugin และการกำหนดค่า SecretRef เดียวกัน
คอนเทนเนอร์ต้องได้รับ:

- `VAULT_ADDR`
- แหล่งการยืนยันตัวตนหนึ่งรายการ:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` ร่วมกับ `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` ร่วมกับ `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE` และ `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` ร่วมกับ `OPENCLAW_VAULT_AUTH_ROLE`;
    สามารถแทนที่ `OPENCLAW_VAULT_AUTH_MOUNT` หรือ `OPENCLAW_VAULT_JWT_FILE` ได้
- `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` และ
  `OPENCLAW_VAULT_KV_VERSION` ซึ่งเป็นตัวเลือก

เมื่อใช้ Kubernetes ควรเลือก `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`
เมื่อ Vault ได้กำหนดค่าการยืนยันตัวตน Kubernetes สำหรับคลัสเตอร์ไว้แล้ว ใช้
`OPENCLAW_VAULT_AUTH_METHOD=jwt` เฉพาะเมื่อ Vault ถูกกำหนดค่าให้ถือว่าคลัสเตอร์
เป็นผู้ออก JWT/OIDC ทั่วไป ทั้งสองตัวเลือกดีกว่าการเก็บโทเค็น Vault ที่มีอายุยาวนาน
ไว้ในข้อมูลลับของ Kubernetes การติดตั้งใช้งานด้วยไซด์คาร์หรือตัวฉีดของ Vault Agent
สามารถใช้ `token_file` แทนได้

สำหรับการตั้งค่า Vault แบบหลายผู้เช่า ให้เก็บการกำหนดเส้นทางผู้เช่าไว้ในนโยบาย Vault
และการกำหนดค่าการติดตั้งใช้งาน OpenClaw ไม่จำเป็นต้องมีเมานต์ บทบาท หรือพาธที่ตายตัว:
สภาพแวดล้อมของ Gateway แต่ละแห่งสามารถตั้งค่า `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE` และรหัส SecretRef ของตนเองได้ หาก Gateway ที่ใช้ร่วมกัน
หนึ่งแห่งต้องแก้ค่าสำหรับผู้ใช้ Vault หลายรายพร้อมกัน ให้ใช้ผู้ให้บริการ exec
ที่กำหนดค่าด้วยตนเองซึ่งครอบสภาพแวดล้อมการยืนยันตัวตนที่แยกจากกัน หรือแยกผู้เช่า
ไปยังสภาพแวดล้อม Gateway หลายแห่งที่มีสภาพแวดล้อม Vault แยกกัน

## เนื้อหาที่เกี่ยวข้อง

- [การจัดการข้อมูลลับ](/th/gateway/secrets)
- [`openclaw secrets`](/th/cli/secrets)
- [รายการ Plugin](/th/plugins/plugin-inventory)
