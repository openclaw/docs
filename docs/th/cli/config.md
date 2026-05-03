---
read_when:
    - คุณต้องการอ่านหรือแก้ไขการกำหนดค่าแบบไม่โต้ตอบ
sidebarTitle: Config
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-03T21:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

ตัวช่วย config สำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/patch/unset/file/schema/validate ค่าตามพาธ และพิมพ์ไฟล์ config ที่ใช้งานอยู่ เรียกใช้โดยไม่ระบุคำสั่งย่อยเพื่อเปิดตัวช่วยตั้งค่า configure wizard (เหมือนกับ `openclaw configure`)

## ตัวเลือกระดับ Root

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วน guided-setup แบบระบุซ้ำได้ เมื่อคุณเรียกใช้ `openclaw config` โดยไม่มีคำสั่งย่อย
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

พิมพ์สคีมา JSON ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout ในรูปแบบ JSON

<AccordionGroup>
  <Accordion title="สิ่งที่รวมอยู่">
    - สคีมา config ระดับ Root ปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับ Root สำหรับเครื่องมือแก้ไข
    - เมทาดาทาเอกสารของฟิลด์ `title` และ `description` ที่ Control UI ใช้
    - โหนด object ซ้อน, wildcard (`*`) และ array-item (`[]`) จะสืบทอดเมทาดาทา `title` / `description` เดียวกัน เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - สาขา `anyOf` / `oneOf` / `allOf` จะสืบทอดเมทาดาทาเอกสารเดียวกันด้วย เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - เมทาดาทาสคีมา Plugin + ช่องทางแบบ live ที่พยายามให้ดีที่สุด เมื่อสามารถโหลด runtime manifests ได้
    - สคีมาสำรองที่สะอาดแม้ config ปัจจุบันจะไม่ถูกต้อง

  </Accordion>
  <Accordion title="RPC runtime ที่เกี่ยวข้อง">
    `config.schema.lookup` คืนค่าพาธ config ที่ถูกทำให้เป็นมาตรฐานหนึ่งรายการ พร้อมโหนดสคีมาแบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป), เมทาดาทาคำใบ้ UI ที่ตรงกัน และสรุปลูกระดับถัดไป ใช้สำหรับเจาะลึกตามพาธใน Control UI หรือไคลเอนต์แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

ไพป์ลงไฟล์เมื่อคุณต้องการตรวจสอบหรือ validate ด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### พาธ

พาธใช้รูปแบบ dot หรือ bracket notation:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

ใช้ดัชนีรายการ agent เพื่อกำหนดเป้าหมาย agent ที่เฉพาะเจาะจง:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อเป็นไปได้ มิฉะนั้นจะถือว่าเป็นสตริง ใช้ `--strict-json` เพื่อบังคับให้แยกวิเคราะห์ JSON5 `--json` ยังคงรองรับในฐานะนามแฝงแบบเดิม

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` พิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

<Note>
การกำหนด object จะแทนที่พาธเป้าหมายตามค่าเริ่มต้น พาธ map/list ที่ได้รับการป้องกันซึ่งมักเก็บรายการที่ผู้ใช้เพิ่ม เช่น `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` และ `auth.profiles` จะปฏิเสธการแทนที่ที่ทำให้รายการเดิมถูกลบ เว้นแต่คุณส่ง `--replace`
</Note>

ใช้ `--merge` เมื่อเพิ่มรายการลงใน map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ระบุกลายเป็นค่าเป้าหมายทั้งหมด

## โหมด `config set`

`openclaw config set` รองรับรูปแบบการกำหนดค่าสี่แบบ:

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
  <Tab title="โหมดตัวสร้าง Provider">
    โหมดตัวสร้าง Provider กำหนดเป้าหมายเฉพาะพาธ `secrets.providers.<alias>` เท่านั้น:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="โหมด Batch">
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
การกำหนด SecretRef จะถูกปฏิเสธบน surface ที่ runtime-mutable แต่ไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น webhook สำหรับการผูกเธรดของ Discord และ JSON credentials ของ WhatsApp) ดู [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์ batch จะใช้ payload ของ batch (`--batch-json`/`--batch-file`) เป็นแหล่งความจริงเสมอ `--strict-json` / `--json` ไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์ batch

## `config patch`

ใช้ `config patch` เมื่อคุณต้องการวางหรือไพป์ patch ที่มีรูปทรงเหมือน config แทนการรันคำสั่ง `config set` ตามพาธจำนวนมาก อินพุตเป็น object JSON5 object จะ merge แบบ recursive, array และค่า scalar จะแทนที่ค่าเป้าหมาย และ `null` จะลบพาธเป้าหมาย

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

คุณยังสามารถไพป์ patch ผ่าน stdin ได้ ซึ่งมีประโยชน์สำหรับสคริปต์ตั้งค่าระยะไกล:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

ตัวอย่าง patch:

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

ใช้ `--replace-path <path>` เมื่อ object หรือ array หนึ่งรายการต้องกลายเป็นค่าที่ระบุอย่างแน่นอน แทนที่จะถูก patch แบบ recursive:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` รันการตรวจสอบสคีมาและความสามารถในการ resolve ของ SecretRef โดยไม่เขียนไฟล์ SecretRefs ที่หนุนด้วย exec จะถูกข้ามตามค่าเริ่มต้นระหว่าง dry-run; เพิ่ม `--allow-exec` เมื่อคุณตั้งใจให้ dry-run execute คำสั่ง provider

โหมดพาธ/ค่า JSON ยังคงรองรับทั้ง SecretRefs และ providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กตัวสร้าง Provider

เป้าหมายตัวสร้าง Provider ต้องใช้ `secrets.providers.<alias>` เป็นพาธ

<AccordionGroup>
  <Accordion title="แฟล็กทั่วไป">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Provider แบบ env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ระบุซ้ำได้)

  </Accordion>
  <Accordion title="Provider แบบ file (--provider-source file)">
    - `--provider-path <path>` (จำเป็น)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Provider แบบ exec (--provider-source exec)">
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

ตัวอย่าง exec provider ที่เสริมความปลอดภัย:

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

ใช้ `--dry-run` เพื่อ validate การเปลี่ยนแปลงโดยไม่เขียน `openclaw.json`

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
  <Accordion title="พฤติกรรม dry-run">
    - โหมดตัวสร้าง: รันการตรวจสอบความสามารถในการ resolve ของ SecretRef สำหรับ refs/providers ที่เปลี่ยนแปลง
    - โหมด JSON (`--strict-json`, `--json` หรือโหมด batch): รันการ validate สคีมาและการตรวจสอบความสามารถในการ resolve ของ SecretRef
    - การ validate นโยบายจะรันสำหรับ surface เป้าหมาย SecretRef ที่ทราบว่าไม่รองรับด้วย
    - การตรวจสอบนโยบายจะประเมิน config หลังการเปลี่ยนแปลงทั้งหมด ดังนั้นการเขียน parent-object (เช่น ตั้งค่า `hooks` เป็น object) จึงไม่สามารถข้ามการ validate surface ที่ไม่รองรับได้
    - การตรวจสอบ Exec SecretRef จะถูกข้ามตามค่าเริ่มต้นระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
    - ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเลือกเข้าร่วมการตรวจสอบ exec SecretRef (อาจ execute คำสั่ง provider)
    - `--allow-exec` ใช้ได้เฉพาะ dry-run และจะ error หากใช้โดยไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ --dry-run --json">
    `--dry-run --json` พิมพ์รายงานที่ machine-readable:

    - `ok`: dry-run ผ่านหรือไม่
    - `operations`: จำนวนการกำหนดค่าที่ประเมิน
    - `checks`: มีการรันการตรวจสอบสคีมา/ความสามารถในการ resolve หรือไม่
    - `checks.resolvabilityComplete`: การตรวจสอบความสามารถในการ resolve รันจนเสร็จหรือไม่ (เป็น false เมื่อ exec refs ถูกข้าม)
    - `refsChecked`: จำนวน refs ที่ถูก resolve จริงระหว่าง dry-run
    - `skippedExecRefs`: จำนวน exec refs ที่ถูกข้ามเพราะไม่ได้ตั้งค่า `--allow-exec`
    - `errors`: ความล้มเหลวของสคีมา/ความสามารถในการ resolve แบบมีโครงสร้าง เมื่อ `ok=false`

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
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: รูปแบบ config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง แก้ path/value หรือรูปแบบออบเจ็กต์ provider/ref
    - `Config policy validation failed: unsupported SecretRef usage`: ย้ายข้อมูลรับรองนั้นกลับไปเป็นอินพุตแบบ plaintext/string และใช้ SecretRefs เฉพาะบนพื้นผิวที่รองรับเท่านั้น
    - `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ยัง resolve ไม่ได้ในขณะนี้ (ขาด env var, ตัวชี้ไฟล์ไม่ถูกต้อง, exec provider ล้มเหลว หรือ provider/source ไม่ตรงกัน)
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec refs; เรียกซ้ำด้วย `--allow-exec` หากคุณต้องการตรวจสอบ exec resolvability
    - สำหรับโหมด batch ให้แก้รายการที่ล้มเหลวแล้วเรียก `--dry-run` ซ้ำก่อนเขียน

  </Accordion>
</AccordionGroup>

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่น ๆ ที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อน commit ลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema หรือดูเหมือนเป็นการเขียนทับแบบทำลายข้อมูล active config จะไม่ถูกแตะต้อง และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้าง ๆ เป็น `openclaw.json.rejected.*`

<Warning>
path ของ active config ต้องเป็นไฟล์ปกติ layout ของ `openclaw.json` ที่เป็น symlink ไม่รองรับการเขียน ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรงไปยังไฟล์จริงแทน
</Warning>

แนะนำให้ใช้ CLI เขียนสำหรับการแก้ไขเล็ก ๆ:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบ payload ที่บันทึกไว้และแก้รูปแบบ config ทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

ยังอนุญาตให้เขียนด้วย editor โดยตรงได้ แต่ Gateway ที่กำลังทำงานจะถือว่าสิ่งเหล่านั้นไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ การแก้ไขโดยตรงที่ไม่ถูกต้องจะทำให้การเริ่มต้นล้มเหลว หรือถูกข้ามโดย hot reload; Gateway จะไม่เขียน `openclaw.json` ใหม่ เรียก `openclaw doctor --fix` เพื่อซ่อม config ที่มี prefix/ถูกเขียนทับ หรือกู้คืนสำเนา last-known-good ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับการซ่อมโดย doctor การเปลี่ยนแปลง schema ของ Plugin หรือความคลาดเคลื่อนของ `minHostVersion` จะยังแสดงข้อผิดพลาดอย่างชัดเจนแทนที่จะ rollback การตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้อง เช่น models, providers, auth profiles, channels, gateway exposure, tools, memory, browser หรือ cron config

## คำสั่งย่อย

- `config file`: พิมพ์ path ของไฟล์ active config (resolve จาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งเริ่มต้น) path ควรระบุไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ท gateway หลังแก้ไข

## ตรวจสอบ

ตรวจสอบ config ปัจจุบันกับ active schema โดยไม่เริ่ม gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ภายในเครื่องเพื่อให้ agent แบบฝังตัวเปรียบเทียบ active config กับเอกสาร ขณะที่คุณตรวจสอบแต่ละการเปลี่ยนแปลงจาก terminal เดียวกัน:

<Note>
หากการตรวจสอบล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` ไม่ได้ข้าม guard สำหรับ config ที่ไม่ถูกต้อง
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

วงจรการซ่อมทั่วไป:

<Steps>
  <Step title="Compare with docs">
    ขอให้ agent เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำการแก้ไขที่เล็กที่สุด
  </Step>
  <Step title="Apply targeted edits">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="Re-validate">
    เรียก `openclaw config validate` ซ้ำหลังการเปลี่ยนแปลงแต่ละครั้ง
  </Step>
  <Step title="Doctor for runtime issues">
    หากการตรวจสอบผ่านแต่ runtime ยังไม่ปกติ ให้เรียก `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อขอความช่วยเหลือด้าน migration และการซ่อม
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
