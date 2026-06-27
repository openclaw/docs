---
read_when:
    - คุณต้องการอ่านหรือแก้ไขการกำหนดค่าโดยไม่ต้องโต้ตอบ
sidebarTitle: Config
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-06-27T17:19:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

ตัวช่วยการกำหนดค่าสำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: รับ/ตั้งค่า/แพตช์/ยกเลิกการตั้งค่า/ไฟล์/สคีมา/ตรวจสอบความถูกต้องของค่าตามพาธ และพิมพ์ไฟล์กำหนดค่าที่ใช้งานอยู่ รันโดยไม่มีคำสั่งย่อยเพื่อเปิดตัวช่วยกำหนดค่า (เหมือนกับ `openclaw configure`)

<Note>
เมื่อ `OPENCLAW_NIX_MODE=1` OpenClaw จะถือว่า `openclaw.json` เปลี่ยนแปลงไม่ได้ คำสั่งแบบอ่านอย่างเดียว เช่น `config get`, `config file`, `config schema` และ `config validate` ยังคงทำงานได้ แต่ตัวเขียนการกำหนดค่าจะปฏิเสธ Agents ควรแก้ไขซอร์ส Nix ของการติดตั้งแทน สำหรับดิสทริบิวชัน nix-openclaw ของบุคคลที่หนึ่ง ให้ใช้ [เริ่มต้นใช้งาน nix-openclaw อย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) และตั้งค่าภายใต้ `programs.openclaw.config` หรือ `instances.<name>.config`
</Note>

## ตัวเลือกระดับราก

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ระบุซ้ำได้ เมื่อคุณรัน `openclaw config` โดยไม่มีคำสั่งย่อย
</ParamField>

ส่วนที่รองรับสำหรับการตั้งค่าแบบมีคำแนะนำ: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

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

พิมพ์สคีมา JSON ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout เป็น JSON

<AccordionGroup>
  <Accordion title="สิ่งที่รวมอยู่">
    - สคีมาการกำหนดค่าระดับรากปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับรากสำหรับเครื่องมือแก้ไข
    - เมตาดาต้าเอกสาร `title` และ `description` ของฟิลด์ที่ Control UI ใช้
    - โหนดอ็อบเจ็กต์ซ้อน, wildcard (`*`) และรายการอาร์เรย์ (`[]`) จะสืบทอดเมตาดาต้า `title` / `description` เดียวกันเมื่อมีเอกสารของฟิลด์ที่ตรงกัน
    - สาขา `anyOf` / `oneOf` / `allOf` จะสืบทอดเมตาดาต้าเอกสารเดียวกันด้วยเมื่อมีเอกสารของฟิลด์ที่ตรงกัน
    - เมตาดาต้าสคีมาของ Plugin + ช่องทางแบบสดอย่างเต็มความสามารถ เมื่อโหลดแมนิเฟสต์รันไทม์ได้
    - สคีมาสำรองที่สะอาด แม้ว่าการกำหนดค่าปัจจุบันจะไม่ถูกต้อง

  </Accordion>
  <Accordion title="RPC รันไทม์ที่เกี่ยวข้อง">
    `config.schema.lookup` ส่งคืนพาธการกำหนดค่าที่ทำให้เป็นมาตรฐานแล้วหนึ่งรายการ พร้อมโหนดสคีมาแบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป), เมตาดาต้าคำใบ้ UI ที่ตรงกัน และสรุปลูกโดยตรง ใช้สำหรับการเจาะลึกแบบจำกัดตามพาธใน Control UI หรือไคลเอนต์แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

ไพป์ไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือตรวจสอบความถูกต้องด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### พาธ

พาธใช้สัญลักษณ์จุดหรือวงเล็บเหลี่ยม ใส่เครื่องหมายคำพูดให้พาธแบบวงเล็บเหลี่ยมในตัวอย่างเชลล์ เพื่อให้เชลล์อย่าง zsh ไม่ขยาย `[0]` เป็น glob ก่อนที่ OpenClaw จะได้รับพาธ:

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

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อทำได้ มิฉะนั้นจะถือว่าเป็นสตริง ใช้ `--strict-json` เพื่อบังคับให้แยกวิเคราะห์ JSON5 `--json` ยังคงรองรับในฐานะนามแฝงแบบเก่า

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` พิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

<Note>
การกำหนดอ็อบเจ็กต์จะแทนที่พาธเป้าหมายโดยค่าเริ่มต้น พาธ map/list ที่ได้รับการป้องกันซึ่งมักเก็บรายการที่ผู้ใช้เพิ่ม เช่น `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` และ `auth.profiles` จะปฏิเสธการแทนที่ที่จะลบรายการที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
</Note>

ใช้ `--merge` เมื่อเพิ่มรายการไปยัง map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ให้มาเป็นค่าเป้าหมายทั้งหมด

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
    โหมดตัวสร้างผู้ให้บริการกำหนดเป้าหมายเฉพาะพาธ `secrets.providers.<alias>` เท่านั้น:

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
การกำหนด SecretRef จะถูกปฏิเสธบนพื้นผิว runtime-mutable ที่ไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น Webhook สำหรับการผูกเธรด Discord และ JSON ข้อมูลรับรอง WhatsApp) ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์แบบแบตช์ใช้เพย์โหลดแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งความจริงเสมอ `--strict-json` / `--json` ไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบแบตช์

## `config patch`

ใช้ `config patch` เมื่อคุณต้องการวางหรือไพป์แพตช์รูปทรงการกำหนดค่า แทนการรันคำสั่ง `config set` ตามพาธจำนวนมาก อินพุตคืออ็อบเจ็กต์ JSON5 อ็อบเจ็กต์จะรวมแบบเรียกซ้ำ อาร์เรย์และค่าสเกลาร์จะแทนที่ค่าเป้าหมาย และ `null` จะลบพาธเป้าหมาย

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

คุณยังสามารถไพป์แพตช์ผ่าน stdin ได้ ซึ่งมีประโยชน์สำหรับสคริปต์ตั้งค่าระยะไกล:

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

ใช้ `--replace-path <path>` เมื่ออ็อบเจ็กต์หรืออาร์เรย์หนึ่งรายการต้องกลายเป็นค่าที่ให้มาอย่างแน่นอนแทนที่จะถูกแพตช์แบบเรียกซ้ำ:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` รันการตรวจสอบสคีมาและการแก้ไขได้ของ SecretRef โดยไม่เขียน Exec-backed SecretRefs จะถูกข้ามโดยค่าเริ่มต้นระหว่าง dry-run; เพิ่ม `--allow-exec` เมื่อคุณตั้งใจให้ dry-run เรียกใช้คำสั่งของผู้ให้บริการ

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
  <Accordion title="พฤติกรรม dry-run">
    - โหมดตัวสร้าง: รันการตรวจสอบการแก้ไขได้ของ SecretRef สำหรับ refs/providers ที่เปลี่ยน
    - โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): รันการตรวจสอบสคีมาพร้อมการตรวจสอบการแก้ไขได้ของ SecretRef
    - การตรวจสอบนโยบายยังรันสำหรับพื้นผิวเป้าหมาย SecretRef ที่ทราบว่าไม่รองรับ
    - การตรวจสอบนโยบายประเมินการกำหนดค่าหลังการเปลี่ยนแปลงทั้งหมด ดังนั้นการเขียนอ็อบเจ็กต์แม่ (เช่น การตั้งค่า `hooks` เป็นอ็อบเจ็กต์) จึงไม่สามารถข้ามการตรวจสอบพื้นผิวที่ไม่รองรับได้
    - การตรวจสอบ Exec SecretRef จะถูกข้ามโดยค่าเริ่มต้นระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงของคำสั่ง
    - ใช้ `--allow-exec` กับ `--dry-run` เพื่อเลือกเปิดใช้การตรวจสอบ Exec SecretRef (อาจเรียกใช้คำสั่งของผู้ให้บริการ)
    - `--allow-exec` ใช้ได้เฉพาะ dry-run และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ --dry-run --json">
    `--dry-run --json` พิมพ์รายงานที่เครื่องอ่านได้:

    - `ok`: การรันจำลองผ่านหรือไม่
    - `operations`: จำนวนการกำหนดค่าที่ประเมินแล้ว
    - `checks`: มีการตรวจสอบ schema/การ resolve หรือไม่
    - `checks.resolvabilityComplete`: การตรวจสอบการ resolve ทำงานจนเสร็จสมบูรณ์หรือไม่ (เป็น false เมื่อข้าม exec refs)
    - `refsChecked`: จำนวน refs ที่ถูก resolve จริงระหว่างการรันจำลอง
    - `skippedExecRefs`: จำนวน exec refs ที่ถูกข้ามเพราะไม่ได้ตั้งค่า `--allow-exec`
    - `errors`: ความล้มเหลวแบบมีโครงสร้างสำหรับ path ที่ขาดหาย, schema, หรือการ resolve เมื่อ `ok=false`

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
  <Accordion title="หากการรันจำลองล้มเหลว">
    - `config schema validation failed`: รูปแบบ config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง; แก้ path/value หรือรูปแบบอ็อบเจกต์ provider/ref
    - `Config policy validation failed: unsupported SecretRef usage`: ย้ายข้อมูลประจำตัวนั้นกลับไปเป็นอินพุต plaintext/string และใช้ SecretRefs เฉพาะบนพื้นผิวที่รองรับเท่านั้น
    - `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงไม่สามารถ resolve ได้ในขณะนี้ (env var ขาดหาย, file pointer ไม่ถูกต้อง, exec provider ล้มเหลว, หรือ provider/source ไม่ตรงกัน)
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: การรันจำลองข้าม exec refs; รันซ้ำพร้อม `--allow-exec` หากคุณต้องการตรวจสอบการ resolve ของ exec
    - สำหรับโหมดแบตช์ ให้แก้รายการที่ล้มเหลวแล้วรัน `--dry-run` ซ้ำก่อนเขียน

  </Accordion>
</AccordionGroup>

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่นที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config หลังการเปลี่ยนแปลงทั้งหมดก่อน commit ลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema หรือดูเหมือนเป็นการเขียนทับแบบทำลายข้อมูล config ที่ใช้งานอยู่จะไม่ถูกแตะต้อง และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้างกันเป็น `openclaw.json.rejected.*`

<Warning>
path ของ config ที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` แบบ symlink ไม่รองรับการเขียน; ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรงไปยังไฟล์จริงแทน
</Warning>

ควรใช้ CLI เขียนสำหรับการแก้ไขเล็ก ๆ:

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

ยังอนุญาตให้เขียนโดยตรงผ่าน editor ได้ แต่ Gateway ที่กำลังทำงานจะถือว่าไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ การแก้ไขโดยตรงที่ไม่ถูกต้องจะทำให้ startup ล้มเหลวหรือถูกข้ามโดย hot reload; Gateway จะไม่เขียน `openclaw.json` ใหม่ รัน `openclaw doctor --fix` เพื่อซ่อม config ที่มี prefix/ถูกเขียนทับ หรือกู้คืนสำเนา last-known-good ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับการซ่อมของ doctor การเปลี่ยนแปลง schema ของ Plugin หรือความคลาดเคลื่อนของ `minHostVersion` จะส่งเสียงเตือนต่อไปแทนที่จะ rollback การตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้อง เช่น models, providers, auth profiles, channels, gateway exposure, tools, memory, browser, หรือ cron config

## คำสั่งย่อย

- `config file`: พิมพ์ path ของไฟล์ config ที่ใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งเริ่มต้น) path ควรระบุไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ท gateway หลังแก้ไข

## ตรวจสอบความถูกต้อง

ตรวจสอบ config ปัจจุบันกับ schema ที่ใช้งานอยู่โดยไม่ต้องเริ่ม gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ภายในเครื่องเพื่อให้ agent แบบฝังตัวเปรียบเทียบ config ที่ใช้งานอยู่กับเอกสาร ขณะที่คุณตรวจสอบแต่ละการเปลี่ยนแปลงจาก terminal เดียวกัน:

<Note>
หากการตรวจสอบยังล้มเหลว ให้เริ่มด้วย `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` ไม่ได้ข้ามตัวป้องกัน config ที่ไม่ถูกต้อง
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

ลูปการซ่อมทั่วไป:

<Steps>
  <Step title="เปรียบเทียบกับเอกสาร">
    ขอให้ agent เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำวิธีแก้ที่เล็กที่สุด
  </Step>
  <Step title="ใช้การแก้ไขแบบเจาะจง">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="ตรวจสอบซ้ำ">
    รัน `openclaw config validate` ซ้ำหลังการเปลี่ยนแปลงแต่ละครั้ง
  </Step>
  <Step title="Doctor สำหรับปัญหา runtime">
    หากการตรวจสอบผ่านแล้วแต่ runtime ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อรับความช่วยเหลือด้าน migration และการซ่อม
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
