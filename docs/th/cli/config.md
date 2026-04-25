---
read_when:
    - คุณต้องการอ่านหรือแก้ไข config แบบไม่โต้ตอบ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw config` (get/set/unset/file/schema/validate)
title: Config
x-i18n:
    generated_at: "2026-04-25T13:43:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

ตัวช่วย Config สำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/unset/file/schema/validate
ค่าตาม path และพิมพ์ไฟล์ config ที่กำลังใช้งานอยู่ รันโดยไม่ใส่ subcommand เพื่อ
เปิดตัวช่วยตั้งค่า (เช่นเดียวกับ `openclaw configure`)

ตัวเลือกระดับราก:

- `--section <section>`: ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ใช้ซ้ำได้เมื่อคุณรัน `openclaw config` โดยไม่ใส่ subcommand

ส่วนของการตั้งค่าแบบมีคำแนะนำที่รองรับ:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## ตัวอย่าง

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

พิมพ์ JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout ในรูปแบบ JSON

สิ่งที่รวมอยู่:

- root config schema ปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับรากสำหรับเครื่องมือแก้ไข
- ข้อมูลเมตาเอกสาร `title` และ `description` ของฟิลด์ที่ใช้โดย Control UI
- โหนด object แบบซ้อน, wildcard (`*`) และรายการในอาร์เรย์ (`[]`) จะสืบทอดข้อมูลเมตา `title` / `description` เดียวกันเมื่อมีเอกสารของฟิลด์ที่ตรงกัน
- สาขา `anyOf` / `oneOf` / `allOf` ก็จะสืบทอดข้อมูลเมตาเอกสารเดียวกันเช่นกันเมื่อมีเอกสารของฟิลด์ที่ตรงกัน
- ข้อมูลเมตา schema ของ Plugin + channel แบบสดตามความพยายามที่ดีที่สุด เมื่อสามารถโหลด runtime manifests ได้
- schema สำรองที่สะอาดแม้ config ปัจจุบันจะไม่ถูกต้อง

Runtime RPC ที่เกี่ยวข้อง:

- `config.schema.lookup` จะคืนค่า path ของ config ที่ผ่านการทำให้เป็นมาตรฐานแล้วหนึ่งรายการ พร้อม
  โหนด schema แบบตื้น (`title`, `description`, `type`, `enum`, `const`, common bounds),
  ข้อมูลเมตาคำใบ้ UI ที่ตรงกัน และสรุปลูกโดยตรง ใช้สิ่งนี้สำหรับ
  การเจาะลึกตามขอบเขต path ใน Control UI หรือไคลเอนต์แบบกำหนดเอง

```bash
openclaw config schema
```

ส่งต่อผลลัพธ์ไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือตรวจสอบความถูกต้องด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### Paths

Paths ใช้ dot notation หรือ bracket notation:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

ใช้ดัชนีรายการเอเจนต์เพื่อระบุเอเจนต์เฉพาะ:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อเป็นไปได้ มิฉะนั้นจะถือว่าเป็นสตริง
ใช้ `--strict-json` เพื่อบังคับให้แยกวิเคราะห์เป็น JSON5 โดย `--json` ยังคงรองรับเป็น alias แบบเดิม

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` จะพิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

การกำหนดค่าให้ object จะเขียนทับ path เป้าหมายเป็นค่าเริ่มต้น ส่วน path แบบ map/list ที่ได้รับการป้องกัน
ซึ่งมักเก็บรายการที่ผู้ใช้เพิ่มเอง เช่น `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` และ
`auth.profiles` จะปฏิเสธการเขียนทับที่อาจลบรายการเดิม เว้นแต่คุณจะส่ง `--replace`

ใช้ `--merge` เมื่อต้องการเพิ่มรายการลงใน map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ระบุกลายเป็นค่าเป้าหมายทั้งหมดโดยสมบูรณ์

## โหมดของ `config set`

`openclaw config set` รองรับรูปแบบการกำหนดค่า 4 แบบ:

1. โหมดค่า: `openclaw config set <path> <value>`
2. โหมดตัวสร้าง SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. โหมดตัวสร้าง provider (ใช้ได้กับ path `secrets.providers.<alias>` เท่านั้น):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. โหมดแบตช์ (`--batch-json` หรือ `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

หมายเหตุนโยบาย:

- การกำหนดค่า SecretRef จะถูกปฏิเสธบนพื้นผิวที่รันไทม์ไม่รองรับการเปลี่ยนแปลงได้ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, webhook tokens สำหรับ Discord thread-binding และ WhatsApp creds JSON) ดู [SecretRef Credential Surface](/th/reference/secretref-credential-surface)

การแยกวิเคราะห์แบบแบตช์จะใช้ payload ของแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งความจริงเสมอ
`--strict-json` / `--json` จะไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบแบตช์

โหมด JSON path/value ยังคงรองรับทั้ง SecretRefs และ providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กตัวสร้าง provider

เป้าหมายของตัวสร้าง provider ต้องใช้ `secrets.providers.<alias>` เป็น path

แฟล็กทั่วไป:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (ใช้ซ้ำได้)

File provider (`--provider-source file`):

- `--provider-path <path>` (ต้องระบุ)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec provider (`--provider-source exec`):

- `--provider-command <path>` (ต้องระบุ)
- `--provider-arg <arg>` (ใช้ซ้ำได้)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (ใช้ซ้ำได้)
- `--provider-pass-env <ENV_VAR>` (ใช้ซ้ำได้)
- `--provider-trusted-dir <path>` (ใช้ซ้ำได้)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

ตัวอย่าง exec provider แบบเพิ่มความปลอดภัย:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

ใช้ `--dry-run` เพื่อตรวจสอบการเปลี่ยนแปลงโดยไม่เขียน `openclaw.json`

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

พฤติกรรมของ dry-run:

- โหมดตัวสร้าง: เรียกใช้การตรวจสอบความสามารถในการ resolve ของ SecretRef สำหรับ refs/providers ที่เปลี่ยนแปลง
- โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): เรียกใช้การตรวจสอบ schema พร้อมการตรวจสอบความสามารถในการ resolve ของ SecretRef
- การตรวจสอบนโยบายจะทำงานด้วยสำหรับพื้นผิวเป้าหมายของ SecretRef ที่ทราบว่าไม่รองรับ
- การตรวจสอบนโยบายจะประเมิน config แบบเต็มหลังการเปลี่ยนแปลง ดังนั้นการเขียน object ระดับพาเรนต์ (เช่น การตั้ง `hooks` เป็น object) จะไม่สามารถข้ามการตรวจสอบพื้นผิวที่ไม่รองรับได้
- การตรวจสอบ SecretRef แบบ exec จะถูกข้ามเป็นค่าเริ่มต้นระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากการรันคำสั่ง
- ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเปิดใช้การตรวจสอบ SecretRef แบบ exec (สิ่งนี้อาจรันคำสั่งของ provider)
- `--allow-exec` ใช้ได้เฉพาะกับ dry-run และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

`--dry-run --json` จะพิมพ์รายงานที่อ่านได้ด้วยเครื่อง:

- `ok`: dry-run ผ่านหรือไม่
- `operations`: จำนวนการกำหนดค่าที่ประเมิน
- `checks`: มีการตรวจสอบ schema/ความสามารถในการ resolve หรือไม่
- `checks.resolvabilityComplete`: การตรวจสอบความสามารถในการ resolve ทำงานจนเสร็จสมบูรณ์หรือไม่ (`false` เมื่อมีการข้าม exec refs)
- `refsChecked`: จำนวน refs ที่ถูก resolve จริงระหว่าง dry-run
- `skippedExecRefs`: จำนวน exec refs ที่ถูกข้ามเพราะไม่ได้ตั้ง `--allow-exec`
- `errors`: ความล้มเหลวของ schema/การ resolve แบบมีโครงสร้างเมื่อ `ok=false`

### รูปแบบผลลัพธ์ JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // มีอยู่สำหรับข้อผิดพลาดในการ resolve
    },
  ],
}
```

ตัวอย่างเมื่อสำเร็จ:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

ตัวอย่างเมื่อไม่สำเร็จ:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

หาก dry-run ล้มเหลว:

- `config schema validation failed`: รูปร่าง config หลังการเปลี่ยนแปลงไม่ถูกต้อง; แก้ไข path/value หรือรูปร่าง object ของ provider/ref
- `Config policy validation failed: unsupported SecretRef usage`: ย้ายข้อมูลรับรองนั้นกลับไปใช้ plaintext/string input และเก็บ SecretRefs ไว้เฉพาะบนพื้นผิวที่รองรับ
- `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ไม่สามารถ resolve ได้ในขณะนี้ (ตัวแปร env หายไป, file pointer ไม่ถูกต้อง, exec provider ล้มเหลว หรือ provider/source ไม่ตรงกัน)
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec refs; รันใหม่ด้วย `--allow-exec` หากคุณต้องการตรวจสอบความสามารถในการ resolve ของ exec
- สำหรับโหมดแบตช์ ให้แก้ไขรายการที่ล้มเหลวแล้วรัน `--dry-run` ใหม่ก่อนเขียนจริง

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่น ๆ ที่ OpenClaw เป็นเจ้าของ จะตรวจสอบ config แบบเต็ม
หลังการเปลี่ยนแปลงก่อนคอมมิตลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema
หรือดูเหมือนเป็นการเขียนทับแบบทำลายข้อมูล config ที่ใช้งานอยู่จะไม่ถูกแตะต้อง
และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้าง ๆ เป็น `openclaw.json.rejected.*`
path ของ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ รูปแบบ `openclaw.json` แบบ symlink
ไม่รองรับสำหรับการเขียน; ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรงไปยังไฟล์จริงแทน

แนะนำให้ใช้การเขียนผ่าน CLI สำหรับการแก้ไขเล็กน้อย:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบ payload ที่บันทึกไว้และแก้ไขรูปร่าง config แบบเต็ม:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

การเขียนตรงผ่านตัวแก้ไขยังคงทำได้ แต่ Gateway ที่กำลังรันอยู่จะถือว่า
ไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ การแก้ไขตรงที่ไม่ถูกต้องสามารถกู้คืนได้จาก
สำเนาสำรอง last-known-good ระหว่างการเริ่มต้นระบบหรือ hot reload ดู
[Gateway troubleshooting](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)

การกู้คืนทั้งไฟล์จะสงวนไว้สำหรับ config ที่เสียหายในระดับรวมเท่านั้น เช่น parse
errors, ความล้มเหลวของ schema ระดับราก, ความล้มเหลวของการย้ายข้อมูลแบบเดิม หรือความล้มเหลวแบบผสมกันระหว่าง Plugin
และระดับราก หากการตรวจสอบล้มเหลวเฉพาะภายใต้ `plugins.entries.<id>...`,
OpenClaw จะคง `openclaw.json` ที่ใช้งานอยู่ไว้ และรายงาน
ปัญหาเฉพาะของ Plugin แทนการกู้คืน `.last-good` วิธีนี้ป้องกันไม่ให้การเปลี่ยน schema ของ Plugin หรือ
ความไม่สอดคล้องของ `minHostVersion` ย้อนกลับการตั้งค่าของผู้ใช้ส่วนอื่นที่ไม่เกี่ยวข้อง เช่น models,
providers, auth profiles, channels, การเปิดเผย Gateway, tools, memory, browser หรือ
config ของ Cron

## Subcommands

- `config file`: พิมพ์ path ของไฟล์ config ที่กำลังใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งค่าเริ่มต้น) path ควรเป็นไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ต gateway หลังแก้ไข

## ตรวจสอบความถูกต้อง

ตรวจสอบ config ปัจจุบันกับ schema ที่กำลังใช้งานโดยไม่ต้องเริ่ม
gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ในเครื่องเพื่อให้
เอเจนต์แบบฝังในตัวเปรียบเทียบ config ที่กำลังใช้งานกับเอกสาร ขณะที่คุณตรวจสอบ
แต่ละการเปลี่ยนแปลงจากเทอร์มินัลเดียวกันได้

หากการตรวจสอบล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ
`openclaw doctor --fix` `openclaw chat` จะไม่ข้ามตัวป้องกัน
config ที่ไม่ถูกต้อง

```bash
openclaw chat
```

จากนั้นภายใน TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

ลูปการซ่อมแซมทั่วไป:

- ขอให้เอเจนต์เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำการแก้ไขที่เล็กที่สุด
- ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
- รัน `openclaw config validate` ใหม่หลังจากแต่ละการเปลี่ยนแปลง
- หากการตรวจสอบผ่านแล้วแต่รันไทม์ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อขอความช่วยเหลือเรื่องการย้ายข้อมูลและการซ่อมแซม

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Configuration](/th/gateway/configuration)
