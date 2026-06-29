---
read_when:
    - คุณต้องการอ่านหรือแก้ไขการกำหนดค่าแบบไม่โต้ตอบ
sidebarTitle: Config
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-06-28T22:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

ตัวช่วยกำหนดค่าสำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/patch/unset/file/schema/validate ค่าตามพาธ และพิมพ์ไฟล์กำหนดค่าที่ใช้งานอยู่ เรียกใช้โดยไม่มีคำสั่งย่อยเพื่อเปิดวิซาร์ดการกำหนดค่า (เหมือนกับ `openclaw configure`)

<Note>
เมื่อ `OPENCLAW_NIX_MODE=1` OpenClaw จะถือว่า `openclaw.json` เป็นแบบแก้ไขไม่ได้ คำสั่งแบบอ่านอย่างเดียว เช่น `config get`, `config file`, `config schema` และ `config validate` ยังใช้งานได้ แต่ตัวเขียนค่ากำหนดค่าจะปฏิเสธ Agents ควรแก้ไขซอร์ส Nix สำหรับการติดตั้งแทน สำหรับดิสทริบิวชัน nix-openclaw ของผู้พัฒนาโดยตรง ให้ใช้ [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) และตั้งค่าภายใต้ `programs.openclaw.config` หรือ `instances.<name>.config`
</Note>

## ตัวเลือกราก

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ใช้ซ้ำได้เมื่อคุณเรียกใช้ `openclaw config` โดยไม่มีคำสั่งย่อย
</ParamField>

ส่วนแบบมีคำแนะนำที่รองรับ: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

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
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
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

พิมพ์ JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout เป็น JSON

<AccordionGroup>
  <Accordion title="What it includes">
    - schema กำหนดค่ารากปัจจุบัน พร้อมฟิลด์สตริงราก `$schema` สำหรับเครื่องมือแก้ไข
    - เมทาดาทาเอกสารของฟิลด์ `title` และ `description` ที่ Control UI ใช้
    - โหนดอ็อบเจ็กต์ซ้อน, wildcard (`*`) และรายการอาร์เรย์ (`[]`) จะสืบทอดเมทาดาทา `title` / `description` เดียวกันเมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - สาขา `anyOf` / `oneOf` / `allOf` จะสืบทอดเมทาดาทาเอกสารเดียวกันด้วยเมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - เมทาดาทา schema ของ Plugin + ช่องทางแบบสดตามความพยายามที่ดีที่สุด เมื่อโหลด manifest ของ runtime ได้
    - schema สำรองที่สะอาดแม้เมื่อ config ปัจจุบันไม่ถูกต้อง

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` ส่งคืนพาธ config ที่ทำให้เป็นมาตรฐานหนึ่งพาธพร้อมโหนด schema แบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป), เมทาดาทาคำใบ้ UI ที่ตรงกัน และสรุปลูกโดยตรง ใช้สำหรับการเจาะลึกตามพาธใน Control UI หรือไคลเอนต์แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

ส่งผ่าน pipe ไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือ validate ด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### พาธ

พาธใช้รูปแบบจุดหรือวงเล็บเหลี่ยม ใส่เครื่องหมายอัญประกาศให้พาธแบบวงเล็บเหลี่ยมในตัวอย่าง shell เพื่อให้ shell เช่น zsh ไม่ขยาย `[0]` เป็น glob ก่อนที่ OpenClaw จะได้รับพาธ:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

ใช้ดัชนีรายการ agent เพื่อกำหนดเป้าหมาย agent เฉพาะ:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อทำได้ มิฉะนั้นจะถือว่าเป็นสตริง ใช้ `--strict-json` เพื่อบังคับให้แยกวิเคราะห์เป็น JSON มาตรฐานโดยไม่มีการ fallback เป็นสตริง `--json` ยังรองรับในฐานะ alias เดิมของ `--strict-json`

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

เมื่อเปิดใช้ `--strict-json` ไวยากรณ์ที่มีเฉพาะใน JSON5 เช่น comment, trailing comma หรือคีย์อ็อบเจ็กต์ที่ไม่ใส่อัญประกาศจะถูกปฏิเสธ ละ `--strict-json` สำหรับการแยกวิเคราะห์ค่า JSON5 พร้อม fallback เป็นสตริงดิบ

`config get <path> --json` พิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

<Note>
การกำหนดอ็อบเจ็กต์จะแทนที่พาธเป้าหมายโดยค่าเริ่มต้น พาธ map/list ที่ได้รับการป้องกันซึ่งมักเก็บรายการที่ผู้ใช้เพิ่ม เช่น `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` และ `auth.profiles` จะปฏิเสธการแทนที่ที่ทำให้รายการที่มีอยู่ถูกลบ เว้นแต่คุณส่ง `--replace`
</Note>

ใช้ `--merge` เมื่อเพิ่มรายการเข้า map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ระบุกลายเป็นค่าเป้าหมายทั้งหมด

## โหมดของ `config set`

`openclaw config set` รองรับรูปแบบการกำหนดค่า 4 แบบ:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
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
  <Tab title="Batch mode">
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
การกำหนด SecretRef จะถูกปฏิเสธบนพื้นผิวที่ runtime เปลี่ยนได้แต่ไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, token ของ webhook สำหรับการผูก thread ของ Discord และ JSON ข้อมูลประจำตัวของ WhatsApp) ดู [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์แบบ batch จะใช้ payload ของ batch (`--batch-json`/`--batch-file`) เป็นแหล่งข้อมูลจริงเสมอ `--strict-json` / `--json` ไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบ batch

## `config patch`

ใช้ `config patch` เมื่อคุณต้องการวางหรือ pipe patch ที่มีรูปทรงเหมือน config แทนการเรียกใช้คำสั่ง `config set` ตามพาธจำนวนมาก อินพุตเป็นอ็อบเจ็กต์ JSON5 อ็อบเจ็กต์จะ merge แบบ recursive, อาร์เรย์และค่าสเกลาร์จะแทนที่ค่าเป้าหมาย และ `null` จะลบพาธเป้าหมาย

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

คุณยังสามารถ pipe patch ผ่าน stdin ได้ ซึ่งมีประโยชน์สำหรับสคริปต์ตั้งค่าระยะไกล:

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

ใช้ `--replace-path <path>` เมื่ออ็อบเจ็กต์หรืออาร์เรย์หนึ่งต้องกลายเป็นค่าที่ระบุไว้อย่างตรงตัว แทนที่จะถูก patch แบบ recursive:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` เรียกใช้การตรวจสอบ schema และความสามารถในการ resolve ของ SecretRef โดยไม่เขียน Exec-backed SecretRefs จะถูกข้ามโดยค่าเริ่มต้นระหว่าง dry-run; เพิ่ม `--allow-exec` เมื่อคุณตั้งใจให้ dry-run รันคำสั่ง provider

โหมดพาธ/ค่าแบบ JSON ยังคงรองรับทั้ง SecretRefs และ providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## flag ของตัวสร้าง Provider

เป้าหมายของตัวสร้าง Provider ต้องใช้ `secrets.providers.<alias>` เป็นพาธ

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ใช้ซ้ำได้)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (จำเป็น)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (จำเป็น)
    - `--provider-arg <arg>` (ใช้ซ้ำได้)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (ใช้ซ้ำได้)
    - `--provider-pass-env <ENV_VAR>` (ใช้ซ้ำได้)
    - `--provider-trusted-dir <path>` (ใช้ซ้ำได้)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

ตัวอย่าง exec provider ที่ทำให้ปลอดภัยขึ้น:

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
    - โหมด Builder: รันการตรวจสอบความสามารถในการ resolve ของ SecretRef สำหรับ refs/providers ที่เปลี่ยนแปลง
    - โหมด JSON (`--strict-json`, `--json` หรือโหมด batch): รันการตรวจสอบ schema พร้อมกับการตรวจสอบความสามารถในการ resolve ของ SecretRef
    - การตรวจสอบนโยบายจะรันสำหรับพื้นผิวเป้าหมาย SecretRef ที่ทราบว่าไม่รองรับด้วย
    - การตรวจสอบนโยบายประเมิน config ทั้งหมดหลังการเปลี่ยนแปลง ดังนั้นการเขียน parent-object (เช่น การตั้งค่า `hooks` เป็น object) จึงไม่สามารถเลี่ยงการตรวจสอบพื้นผิวที่ไม่รองรับได้
    - โดยค่าเริ่มต้น การตรวจสอบ Exec SecretRef จะถูกข้ามระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
    - ใช้ `--allow-exec` พร้อมกับ `--dry-run` เพื่อเลือกเปิดการตรวจสอบ exec SecretRef (ซึ่งอาจ execute คำสั่ง provider)
    - `--allow-exec` ใช้ได้เฉพาะ dry-run และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ของ --dry-run --json">
    `--dry-run --json` พิมพ์รายงานที่เครื่องอ่านได้:

    - `ok`: dry-run ผ่านหรือไม่
    - `operations`: จำนวน assignment ที่ประเมิน
    - `checks`: การตรวจสอบ schema/resolvability ถูกรันหรือไม่
    - `checks.resolvabilityComplete`: การตรวจสอบความสามารถในการ resolve รันจนเสร็จหรือไม่ (เป็น false เมื่อ exec refs ถูกข้าม)
    - `refsChecked`: จำนวน refs ที่ถูก resolve จริงระหว่าง dry-run
    - `skippedExecRefs`: จำนวน exec refs ที่ถูกข้ามเพราะไม่ได้ตั้งค่า `--allow-exec`
    - `errors`: ความล้มเหลวแบบมีโครงสร้างของ missing-path, schema หรือ resolvability เมื่อ `ok=false`

  </Accordion>
</AccordionGroup>

### รูปแบบเอาต์พุต JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="ตัวอย่างสำเร็จ">
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
  <Tab title="ตัวอย่างล้มเหลว">
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
    - `config schema validation failed`: รูปแบบ config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง ให้แก้ path/value หรือรูปแบบ object ของ provider/ref
    - `Config policy validation failed: unsupported SecretRef usage`: ย้าย credential นั้นกลับไปเป็นอินพุต plaintext/string และเก็บ SecretRefs ไว้เฉพาะบนพื้นผิวที่รองรับเท่านั้น
    - `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ไม่สามารถ resolve ได้ในขณะนี้ (env var หายไป, file pointer ไม่ถูกต้อง, exec provider ล้มเหลว หรือ provider/source ไม่ตรงกัน)
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec refs; รันซ้ำพร้อม `--allow-exec` หากคุณต้องการตรวจสอบความสามารถในการ resolve ของ exec
    - สำหรับโหมด batch ให้แก้รายการที่ล้มเหลวแล้วรัน `--dry-run` ซ้ำก่อนเขียน

  </Accordion>
</AccordionGroup>

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่นที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อน commit ลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema หรือดูเหมือนเป็นการ clobber แบบทำลายข้อมูล active config จะถูกปล่อยไว้ตามเดิม และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้าง ๆ เป็น `openclaw.json.rejected.*`

<Warning>
path ของ active config ต้องเป็นไฟล์ปกติ layout ของ `openclaw.json` ที่เป็น symlink ไม่รองรับการเขียน ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ไปยังไฟล์จริงโดยตรงแทน
</Warning>

ควรใช้การเขียนผ่าน CLI สำหรับการแก้ไขเล็ก ๆ:

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

การเขียนผ่าน editor โดยตรงยังคงอนุญาต แต่ Gateway ที่กำลังรันจะถือว่าไม่น่าเชื่อถือจนกว่าจะตรวจสอบผ่าน การแก้ไขโดยตรงที่ไม่ถูกต้องจะทำให้ startup ล้มเหลวหรือถูกข้ามโดย hot reload; Gateway จะไม่เขียน `openclaw.json` ใหม่ รัน `openclaw doctor --fix` เพื่อซ่อม config ที่ถูก prefix/clobber หรือกู้คืนสำเนา last-known-good ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับการซ่อมโดย doctor การเปลี่ยน schema ของ Plugin หรือความคลาดเคลื่อนของ `minHostVersion` จะยังแสดงข้อผิดพลาดชัดเจนแทนที่จะ rollback การตั้งค่าผู้ใช้อื่นที่ไม่เกี่ยวข้อง เช่น models, providers, auth profiles, channels, gateway exposure, tools, memory, browser หรือ cron config

## คำสั่งย่อย

- `config file`: พิมพ์ path ของไฟล์ active config (resolve จาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งเริ่มต้น) path ควรระบุไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ท gateway หลังการแก้ไข

## ตรวจสอบ

ตรวจสอบ config ปัจจุบันกับ active schema โดยไม่เริ่ม gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ภายในเครื่องเพื่อให้อเจนต์แบบฝังตัวเปรียบเทียบ active config กับเอกสาร ขณะที่คุณตรวจสอบแต่ละการเปลี่ยนแปลงจาก terminal เดียวกัน:

<Note>
หากการตรวจสอบล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` จะไม่ข้าม guard ของ invalid-config
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
  <Step title="เปรียบเทียบกับเอกสาร">
    ขอให้อเจนต์เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำการแก้ไขที่เล็กที่สุด
  </Step>
  <Step title="ใช้การแก้ไขแบบเจาะจง">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="ตรวจสอบซ้ำ">
    รัน `openclaw config validate` ซ้ำหลังการเปลี่ยนแปลงแต่ละครั้ง
  </Step>
  <Step title="Doctor สำหรับปัญหาระหว่าง runtime">
    หากการตรวจสอบผ่านแต่ runtime ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อขอความช่วยเหลือด้าน migration และการซ่อม
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
