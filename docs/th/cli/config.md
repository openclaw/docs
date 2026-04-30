---
read_when:
    - คุณต้องการอ่านหรือแก้ไขการกำหนดค่าแบบไม่โต้ตอบ
sidebarTitle: Config
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-04-30T09:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

ตัวช่วยการตั้งค่าสำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/patch/unset/file/schema/validate ค่าตามพาธและพิมพ์ไฟล์การตั้งค่าที่ใช้งานอยู่ รันโดยไม่มีคำสั่งย่อยเพื่อเปิดตัวช่วยตั้งค่า (เหมือนกับ `openclaw configure`)

## ตัวเลือกระดับราก

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วน guided-setup ที่ระบุซ้ำได้เมื่อคุณรัน `openclaw config` โดยไม่มีคำสั่งย่อย
</ParamField>

ส่วน guided ที่รองรับ: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

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
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

พิมพ์ JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout ในรูปแบบ JSON

<AccordionGroup>
  <Accordion title="สิ่งที่รวมอยู่">
    - สคีมาการตั้งค่าระดับรากปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับรากสำหรับเครื่องมือแก้ไข
    - เมตาดาต้าเอกสารของฟิลด์ `title` และ `description` ที่ Control UI ใช้
    - โหนดอ็อบเจ็กต์ซ้อน, wildcard (`*`), และรายการอาร์เรย์ (`[]`) สืบทอดเมตาดาต้า `title` / `description` เดียวกันเมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - สาขา `anyOf` / `oneOf` / `allOf` สืบทอดเมตาดาต้าเอกสารเดียวกันด้วยเมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - เมตาดาต้าสคีมา Plugin + ช่องทางแบบ live เท่าที่ทำได้ เมื่อสามารถโหลด runtime manifests ได้
    - สคีมาสำรองที่สะอาดแม้การตั้งค่าปัจจุบันไม่ถูกต้อง

  </Accordion>
  <Accordion title="RPC runtime ที่เกี่ยวข้อง">
    `config.schema.lookup` ส่งคืนพาธการตั้งค่าที่ทำให้เป็นมาตรฐานหนึ่งพาธพร้อมโหนดสคีมาแบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป), เมตาดาต้าคำใบ้ UI ที่ตรงกัน และสรุปลูกระดับถัดไป ใช้สำหรับการเจาะลึกแบบจำกัดพาธใน Control UI หรือไคลเอนต์แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

ส่งผ่าน pipe ไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือตรวจสอบความถูกต้องด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### พาธ

พาธใช้สัญกรณ์จุดหรือวงเล็บ:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

ใช้ดัชนีรายการ agent เพื่อระบุ agent เฉพาะ:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อทำได้ มิฉะนั้นจะถูกถือว่าเป็นสตริง ใช้ `--strict-json` เพื่อกำหนดให้ต้องแยกวิเคราะห์ JSON5 `--json` ยังคงรองรับเป็น alias รุ่นเก่า

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` พิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

<Note>
การกำหนดอ็อบเจ็กต์จะแทนที่พาธเป้าหมายตามค่าเริ่มต้น พาธ map/list ที่ได้รับการป้องกันซึ่งมักเก็บรายการที่ผู้ใช้เพิ่ม เช่น `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, และ `auth.profiles` จะปฏิเสธการแทนที่ที่จะลบรายการที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
</Note>

ใช้ `--merge` เมื่อเพิ่มรายการไปยัง map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ให้มากลายเป็นค่าเป้าหมายทั้งหมด

## โหมดของ `config set`

`openclaw config set` รองรับรูปแบบการกำหนดค่า 4 แบบ:

<Tabs>
  <Tab title="โหมดค่า">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="โหมดตัวสร้าง SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="โหมดตัวสร้างผู้ให้บริการ">
    โหมดตัวสร้างผู้ให้บริการระบุเป้าหมายได้เฉพาะพาธ `secrets.providers.<alias>` เท่านั้น:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="โหมดแบตช์">
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

  </Tab>
</Tabs>

<Warning>
การกำหนด SecretRef จะถูกปฏิเสธบนพื้นผิว runtime-mutable ที่ไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น Webhook การผูกเธรดของ Discord และ JSON ข้อมูลรับรองของ WhatsApp) ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์แบตช์ใช้ payload ของแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งความจริงเสมอ `--strict-json` / `--json` ไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบตช์

## `config patch`

ใช้ `config patch` เมื่อคุณต้องการวางหรือ pipe แพตช์ที่มีรูปทรงเหมือนการตั้งค่า แทนการรันคำสั่ง `config set` ตามพาธจำนวนมาก อินพุตเป็นอ็อบเจ็กต์ JSON5 อ็อบเจ็กต์จะ merge แบบเรียกซ้ำ, อาร์เรย์และค่าสเกลาร์จะแทนที่ค่าเป้าหมาย และ `null` จะลบพาธเป้าหมาย

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

คุณยังสามารถ pipe แพตช์ผ่าน stdin ได้ ซึ่งมีประโยชน์สำหรับสคริปต์ตั้งค่าระยะไกล:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

ตัวอย่างแพตช์:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

ใช้ `--replace-path <path>` เมื่ออ็อบเจ็กต์หรืออาร์เรย์หนึ่งต้องกลายเป็นค่าที่ให้มาอย่างตรงตัว แทนที่จะถูกแพตช์แบบเรียกซ้ำ:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` รันการตรวจสอบสคีมาและการแก้ค่า SecretRef ได้โดยไม่เขียน Exec-backed SecretRefs จะถูกข้ามตามค่าเริ่มต้นระหว่าง dry-run; เพิ่ม `--allow-exec` เมื่อคุณตั้งใจให้ dry-run เรียกใช้คำสั่งของผู้ให้บริการ

โหมดพาธ/ค่า JSON ยังคงรองรับทั้ง SecretRefs และผู้ให้บริการ:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กตัวสร้างผู้ให้บริการ

เป้าหมายของตัวสร้างผู้ให้บริการต้องใช้ `secrets.providers.<alias>` เป็นพาธ

<AccordionGroup>
  <Accordion title="แฟล็กทั่วไป">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="ผู้ให้บริการ Env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ระบุซ้ำได้)

  </Accordion>
  <Accordion title="ผู้ให้บริการไฟล์ (--provider-source file)">
    - `--provider-path <path>` (จำเป็น)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="ผู้ให้บริการ Exec (--provider-source exec)">
    - `--provider-command <path>` (จำเป็น)
    - `--provider-arg <arg>` (ระบุซ้ำได้)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (ระบุซ้ำได้)
    - `--provider-pass-env <ENV_VAR>` (ระบุซ้ำได้)
    - `--provider-trusted-dir <path>` (ระบุซ้ำได้)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

ตัวอย่างผู้ให้บริการ exec ที่เสริมความปลอดภัย:

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

<AccordionGroup>
  <Accordion title="พฤติกรรมของ dry-run">
    - โหมดตัวสร้าง: รันการตรวจสอบการแก้ค่า SecretRef ได้สำหรับ refs/ผู้ให้บริการที่เปลี่ยนแปลง
    - โหมด JSON (`--strict-json`, `--json`, หรือโหมดแบตช์): รันการตรวจสอบสคีมาพร้อมการตรวจสอบการแก้ค่า SecretRef ได้
    - การตรวจสอบนโยบายจะรันสำหรับพื้นผิวเป้าหมาย SecretRef ที่ทราบว่าไม่รองรับด้วย
    - การตรวจสอบนโยบายประเมินการตั้งค่าหลังการเปลี่ยนแปลงทั้งหมด ดังนั้นการเขียนอ็อบเจ็กต์แม่ (เช่น ตั้งค่า `hooks` เป็นอ็อบเจ็กต์) จึงไม่สามารถหลีกเลี่ยงการตรวจสอบพื้นผิวที่ไม่รองรับได้
    - การตรวจสอบ Exec SecretRef จะถูกข้ามตามค่าเริ่มต้นระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
    - ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเลือกใช้การตรวจสอบ Exec SecretRef (สิ่งนี้อาจเรียกใช้คำสั่งของผู้ให้บริการ)
    - `--allow-exec` ใช้ได้เฉพาะ dry-run และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ --dry-run --json">
    `--dry-run --json` พิมพ์รายงานที่เครื่องอ่านได้:

    - `ok`: dry-run ผ่านหรือไม่
    - `operations`: จำนวนการกำหนดค่าที่ประเมิน
    - `checks`: การตรวจสอบสคีมา/การแก้ค่าได้ถูกรันหรือไม่
    - `checks.resolvabilityComplete`: การตรวจสอบการแก้ค่าได้รันจนเสร็จสมบูรณ์หรือไม่ (เป็น false เมื่อ exec refs ถูกข้าม)
    - `refsChecked`: จำนวน refs ที่แก้ค่าจริงระหว่าง dry-run
    - `skippedExecRefs`: จำนวน exec refs ที่ถูกข้ามเพราะไม่ได้ตั้งค่า `--allow-exec`
    - `errors`: ความล้มเหลวของสคีมา/การแก้ค่าได้แบบมีโครงสร้างเมื่อ `ok=false`

  </Accordion>
</AccordionGroup>

### รูปทรงเอาต์พุต JSON

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
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="ตัวอย่างเมื่อสำเร็จ">
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
  </Tab>
  <Tab title="ตัวอย่างเมื่อล้มเหลว">
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
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="หาก dry-run ล้มเหลว">
    - `config schema validation failed`: รูปร่าง config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง แก้ path/value หรือรูปร่างออบเจ็กต์ provider/ref
    - `Config policy validation failed: unsupported SecretRef usage`: ย้าย credential นั้นกลับไปเป็นอินพุต plaintext/string และใช้ SecretRefs เฉพาะบนพื้นผิวที่รองรับเท่านั้น
    - `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงไม่สามารถ resolve ได้ในขณะนี้ (env var ขาดหาย, file pointer ไม่ถูกต้อง, exec provider ล้มเหลว หรือ provider/source ไม่ตรงกัน)
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec refs ไป ให้รันใหม่พร้อม `--allow-exec` หากคุณต้องตรวจสอบ exec resolvability
    - สำหรับโหมด batch ให้แก้รายการที่ล้มเหลวแล้วรัน `--dry-run` ใหม่ก่อนเขียน

  </Accordion>
</AccordionGroup>

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่น ๆ ที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อน commit ลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema หรือดูเหมือนเป็นการเขียนทับที่ทำลายข้อมูล config ที่ใช้งานอยู่จะไม่ถูกแตะต้อง และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้าง ๆ ในชื่อ `openclaw.json.rejected.*`

<Warning>
path ของ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ layout ของ `openclaw.json` ที่เป็น symlink ไม่รองรับการเขียน ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรงไปยังไฟล์จริงแทน
</Warning>

ควรใช้ CLI เขียนสำหรับการแก้ไขเล็ก ๆ:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบ payload ที่บันทึกไว้และแก้รูปร่าง config ทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

ยังอนุญาตให้เขียนโดยตรงผ่าน editor ได้ แต่ Gateway ที่กำลังทำงานจะถือว่าไม่น่าเชื่อถือจนกว่าจะตรวจสอบผ่าน การแก้ไขโดยตรงที่ไม่ถูกต้องสามารถกู้คืนจาก backup last-known-good ระหว่าง startup หรือ hot reload ได้ ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับ config ที่เสียในระดับรวม เช่น parse errors, root-level schema failures, legacy migration failures หรือความล้มเหลวปะปนกันของ plugin และ root หาก validation ล้มเหลวเฉพาะใต้ `plugins.entries.<id>...` OpenClaw จะเก็บ `openclaw.json` ที่ใช้งานอยู่ไว้ตามเดิมและรายงานปัญหาเฉพาะ plugin แทนการกู้คืน `.last-good` วิธีนี้ป้องกันไม่ให้การเปลี่ยนแปลง schema ของ plugin หรือ `minHostVersion` ที่เหลื่อมกัน rollback การตั้งค่าผู้ใช้อื่นที่ไม่เกี่ยวข้อง เช่น models, providers, auth profiles, channels, gateway exposure, tools, memory, browser หรือ cron config

## คำสั่งย่อย

- `config file`: พิมพ์ path ของไฟล์ config ที่ใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือ location เริ่มต้น) path ควรเป็นไฟล์ปกติ ไม่ใช่ symlink

Restart gateway หลังการแก้ไข

## Validate

Validate config ปัจจุบันกับ schema ที่ใช้งานอยู่โดยไม่เริ่ม gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI แบบ local เพื่อให้ agent ที่ฝังอยู่เปรียบเทียบ config ที่ใช้งานอยู่กับเอกสาร ขณะที่คุณ validate การเปลี่ยนแปลงแต่ละรายการจาก terminal เดียวกัน:

<Note>
หาก validation ล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` ไม่ข้าม invalid-config guard
</Note>

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

loop การซ่อมแซมทั่วไป:

<Steps>
  <Step title="เปรียบเทียบกับเอกสาร">
    ขอให้ agent เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำการแก้ไขที่เล็กที่สุด
  </Step>
  <Step title="ใช้การแก้ไขแบบเจาะจง">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="Validate อีกครั้ง">
    รัน `openclaw config validate` อีกครั้งหลังการเปลี่ยนแปลงแต่ละรายการ
  </Step>
  <Step title="Doctor สำหรับปัญหา runtime">
    หาก validation ผ่านแต่ runtime ยังไม่ปกติ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อขอความช่วยเหลือด้าน migration และการซ่อมแซม
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
