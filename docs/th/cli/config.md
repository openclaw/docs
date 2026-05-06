---
read_when:
    - คุณต้องการอ่านหรือแก้ไขการกำหนดค่าแบบไม่โต้ตอบ
sidebarTitle: Config
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-05-06T17:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

ตัวช่วยการกำหนดค่าสำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: get/set/patch/unset/file/schema/validate ค่าตามพาธ และแสดงไฟล์ config ที่ใช้งานอยู่ เรียกใช้โดยไม่มีคำสั่งย่อยเพื่อเปิดตัวช่วยกำหนดค่า (เหมือนกับ `openclaw configure`)

<Note>
เมื่อ `OPENCLAW_NIX_MODE=1` OpenClaw จะถือว่า `openclaw.json` เปลี่ยนแปลงไม่ได้ คำสั่งอ่านอย่างเดียว เช่น `config get`, `config file`, `config schema` และ `config validate` ยังคงใช้งานได้ แต่คำสั่งที่เขียน config จะปฏิเสธแทน เอเจนต์ควรแก้ไขซอร์ส Nix ของการติดตั้งแทน สำหรับดิสทริบิวชัน nix-openclaw ของทีมหลัก ให้ใช้ [เริ่มต้นใช้งาน nix-openclaw อย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) และตั้งค่าภายใต้ `programs.openclaw.config` หรือ `instances.<name>.config`
</Note>

## ตัวเลือกระดับราก

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ระบุซ้ำได้ เมื่อคุณเรียกใช้ `openclaw config` โดยไม่มีคำสั่งย่อย
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

แสดง JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout เป็น JSON

<AccordionGroup>
  <Accordion title="สิ่งที่รวมอยู่">
    - สคีมา config ระดับรากปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับรากสำหรับเครื่องมือแก้ไข
    - เมตาดาทาเอกสาร `title` และ `description` ของฟิลด์ที่ Control UI ใช้
    - โหนดออบเจ็กต์ซ้อน, wildcard (`*`) และรายการอาร์เรย์ (`[]`) จะสืบทอดเมตาดาทา `title` / `description` เดียวกันเมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - สาขา `anyOf` / `oneOf` / `allOf` จะสืบทอดเมตาดาทาเอกสารเดียวกันด้วยเมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - เมตาดาทาสคีมาของ Plugin + ช่องทางแบบสดเท่าที่ทำได้ เมื่อสามารถโหลด manifest ของ runtime ได้
    - สคีมาสำรองที่สะอาด แม้ config ปัจจุบันจะไม่ถูกต้อง

  </Accordion>
  <Accordion title="RPC ของ runtime ที่เกี่ยวข้อง">
    `config.schema.lookup` คืนพาธ config ที่ทำให้เป็นรูปแบบมาตรฐานแล้วหนึ่งพาธ พร้อมโหนดสคีมาแบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป), เมตาดาทาคำใบ้ UI ที่ตรงกัน และสรุปลูกโดยตรง ใช้สำหรับการเจาะลึกแบบจำกัดตามพาธใน Control UI หรือไคลเอนต์กำหนดเอง
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

พาธใช้รูปแบบ dot หรือ bracket:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

ใช้ดัชนีรายการเอเจนต์เพื่อเจาะจงเอเจนต์ตัวใดตัวหนึ่ง:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อทำได้ มิฉะนั้นจะถือว่าเป็นสตริง ใช้ `--strict-json` เพื่อบังคับให้ต้องแยกวิเคราะห์ JSON5 `--json` ยังรองรับอยู่ในฐานะนามแฝงแบบเดิม

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` แสดงค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

<Note>
โดยค่าเริ่มต้น การกำหนดออบเจ็กต์จะแทนที่พาธเป้าหมาย พาธ map/list ที่ได้รับการป้องกันและมักเก็บรายการที่ผู้ใช้เพิ่ม เช่น `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` และ `auth.profiles` จะปฏิเสธการแทนที่ที่จะลบรายการที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
</Note>

ใช้ `--merge` เมื่อเพิ่มรายการลงใน map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ระบุกลายเป็นค่าเป้าหมายทั้งหมด

## โหมดของ `config set`

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
  <Tab title="โหมดตัวสร้างผู้ให้บริการ">
    โหมดตัวสร้างผู้ให้บริการเจาะจงเฉพาะพาธ `secrets.providers.<alias>` เท่านั้น:

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
การกำหนด SecretRef จะถูกปฏิเสธบนพื้นผิวที่แก้ไขได้ขณะ runtime ซึ่งไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น Webhook สำหรับการผูกเธรดของ Discord และ JSON ข้อมูลรับรอง WhatsApp) ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์แบบแบตช์จะใช้ payload แบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งข้อมูลอ้างอิงหลักเสมอ `--strict-json` / `--json` ไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบแบตช์

## `config patch`

ใช้ `config patch` เมื่อคุณต้องการวางหรือ pipe แพตช์ที่มีโครงสร้างแบบ config แทนการเรียกใช้คำสั่ง `config set` แบบอิงพาธจำนวนมาก อินพุตเป็นออบเจ็กต์ JSON5 ออบเจ็กต์จะ merge แบบ recursive ส่วนอาร์เรย์และค่าสเกลาร์จะแทนที่ค่าเป้าหมาย และ `null` จะลบพาธเป้าหมาย

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

ใช้ `--replace-path <path>` เมื่อออบเจ็กต์หรืออาร์เรย์หนึ่งต้องกลายเป็นค่าที่ระบุแบบตรงทั้งหมด แทนที่จะถูกแพตช์แบบ recursive:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` รันการตรวจสอบสคีมาและการตรวจสอบว่า SecretRef สามารถ resolve ได้โดยไม่เขียนข้อมูล SecretRef ที่อิง exec จะถูกข้ามโดยค่าเริ่มต้นระหว่างการรันแบบทดลอง เพิ่ม `--allow-exec` เมื่อคุณตั้งใจให้การรันแบบทดลองเรียกใช้คำสั่งของผู้ให้บริการ

โหมดพาธ/ค่าแบบ JSON ยังคงรองรับทั้ง SecretRef และผู้ให้บริการ:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กของตัวสร้างผู้ให้บริการ

เป้าหมายของตัวสร้างผู้ให้บริการต้องใช้ `secrets.providers.<alias>` เป็นพาธ

<AccordionGroup>
  <Accordion title="แฟล็กทั่วไป">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="ผู้ให้บริการ env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ระบุซ้ำได้)

  </Accordion>
  <Accordion title="ผู้ให้บริการไฟล์ (--provider-source file)">
    - `--provider-path <path>` (จำเป็น)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="ผู้ให้บริการ exec (--provider-source exec)">
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

## การรันแบบทดลอง

ใช้ `--dry-run` เพื่อตรวจสอบความถูกต้องของการเปลี่ยนแปลงโดยไม่เขียน `openclaw.json`

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
  <Accordion title="พฤติกรรมของการรันแบบทดลอง">
    - โหมดตัวสร้าง: รันการตรวจสอบว่า SecretRef สามารถ resolve ได้สำหรับ refs/providers ที่เปลี่ยน
    - โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): รันการตรวจสอบสคีมา พร้อมการตรวจสอบว่า SecretRef สามารถ resolve ได้
    - การตรวจสอบนโยบายจะรันสำหรับพื้นผิวเป้าหมาย SecretRef ที่ทราบว่าไม่รองรับด้วย
    - การตรวจสอบนโยบายจะประเมิน config ทั้งหมดหลังการเปลี่ยนแปลง ดังนั้นการเขียนออบเจ็กต์แม่ (เช่น การตั้งค่า `hooks` เป็นออบเจ็กต์) จึงไม่สามารถเลี่ยงการตรวจสอบพื้นผิวที่ไม่รองรับได้
    - การตรวจสอบ SecretRef แบบ exec จะถูกข้ามโดยค่าเริ่มต้นระหว่างการรันแบบทดลองเพื่อหลีกเลี่ยงผลข้างเคียงของคำสั่ง
    - ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเลือกเปิดใช้การตรวจสอบ SecretRef แบบ exec (อาจเรียกใช้คำสั่งของผู้ให้บริการ)
    - `--allow-exec` ใช้ได้เฉพาะการรันแบบทดลองเท่านั้น และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ของ --dry-run --json">
    `--dry-run --json` แสดงรายงานที่เครื่องอ่านได้:

    - `ok`: ระบุว่าการทดลองรันผ่านหรือไม่
    - `operations`: จำนวนการกำหนดค่าที่ประเมิน
    - `checks`: ระบุว่ามีการตรวจสอบสคีมา/การ resolve หรือไม่
    - `checks.resolvabilityComplete`: ระบุว่าการตรวจสอบการ resolve ทำงานจนเสร็จสมบูรณ์หรือไม่ (เป็น false เมื่อข้าม refs แบบ exec)
    - `refsChecked`: จำนวน refs ที่ resolve จริงระหว่างการทดลองรัน
    - `skippedExecRefs`: จำนวน refs แบบ exec ที่ข้ามเพราะไม่ได้ตั้งค่า `--allow-exec`
    - `errors`: ความล้มเหลวของสคีมา/การ resolve แบบมีโครงสร้างเมื่อ `ok=false`

  </Accordion>
</AccordionGroup>

### รูปแบบเอาต์พุต JSON

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
  <Accordion title="หากการทดลองรันล้มเหลว">
    - `config schema validation failed`: รูปแบบคอนฟิกหลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง ให้แก้พาธ/ค่า หรือรูปแบบออบเจ็กต์ provider/ref
    - `Config policy validation failed: unsupported SecretRef usage`: ย้าย credential นั้นกลับไปเป็นอินพุตแบบข้อความธรรมดา/string และใช้ SecretRefs เฉพาะบนพื้นผิวที่รองรับเท่านั้น
    - `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ไม่สามารถ resolve ได้ในขณะนี้ (env var หายไป, ตัวชี้ไฟล์ไม่ถูกต้อง, provider แบบ exec ล้มเหลว หรือ provider/source ไม่ตรงกัน)
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: การทดลองรันข้าม refs แบบ exec ให้รันซ้ำพร้อม `--allow-exec` หากคุณต้องตรวจสอบการ resolve แบบ exec
    - สำหรับโหมด batch ให้แก้รายการที่ล้มเหลวแล้วรัน `--dry-run` อีกครั้งก่อนเขียน

  </Accordion>
</AccordionGroup>

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียนคอนฟิกอื่นที่ OpenClaw เป็นเจ้าของจะตรวจสอบคอนฟิกเต็มรูปแบบหลังการเปลี่ยนแปลงก่อนบันทึกลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบสคีมาหรือดูเหมือนเป็นการเขียนทับที่ทำลายข้อมูล คอนฟิกที่ใช้งานอยู่จะถูกปล่อยไว้เหมือนเดิม และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้างกันเป็น `openclaw.json.rejected.*`

<Warning>
พาธคอนฟิกที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` แบบ symlink ไม่รองรับการเขียน ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ตรงไปยังไฟล์จริงแทน
</Warning>

ควรใช้ CLI เขียนสำหรับการแก้ไขขนาดเล็ก:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบ payload ที่บันทึกไว้และแก้รูปแบบคอนฟิกทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

ยังอนุญาตให้เขียนโดยตรงด้วย editor ได้ แต่ Gateway ที่กำลังทำงานจะถือว่าไม่เชื่อถือจนกว่าจะตรวจสอบผ่าน การแก้ไขโดยตรงที่ไม่ถูกต้องจะทำให้การเริ่มต้นล้มเหลวหรือถูกข้ามโดย hot reload; Gateway จะไม่เขียน `openclaw.json` ใหม่ รัน `openclaw doctor --fix` เพื่อซ่อมคอนฟิกที่มี prefix/ถูกเขียนทับ หรือกู้คืนสำเนาที่ทราบว่าดีล่าสุด ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับการซ่อมด้วย doctor การเปลี่ยนแปลงสคีมาของ Plugin หรือความคลาดเคลื่อนของ `minHostVersion` จะยังแสดงข้อผิดพลาดอย่างชัดเจนแทนที่จะย้อนกลับการตั้งค่าของผู้ใช้ที่ไม่เกี่ยวข้อง เช่น models, providers, auth profiles, channels, gateway exposure, tools, memory, browser หรือ cron config

## คำสั่งย่อย

- `config file`: พิมพ์พาธไฟล์คอนฟิกที่ใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งเริ่มต้น) พาธควรระบุไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ท gateway หลังการแก้ไข

## ตรวจสอบ

ตรวจสอบคอนฟิกปัจจุบันกับสคีมาที่ใช้งานอยู่โดยไม่เริ่ม gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ภายในเครื่องเพื่อให้เอเจนต์แบบฝังตัวเปรียบเทียบคอนฟิกที่ใช้งานอยู่กับเอกสาร ขณะที่คุณตรวจสอบแต่ละการเปลี่ยนแปลงจากเทอร์มินัลเดียวกัน:

<Note>
หากการตรวจสอบยังล้มเหลวอยู่ ให้เริ่มด้วย `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` ไม่ข้าม guard สำหรับคอนฟิกที่ไม่ถูกต้อง
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
    ขอให้เอเจนต์เปรียบเทียบคอนฟิกปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และแนะนำการแก้ไขที่เล็กที่สุด
  </Step>
  <Step title="ใช้การแก้ไขแบบเจาะจง">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="ตรวจสอบซ้ำ">
    รัน `openclaw config validate` อีกครั้งหลังการเปลี่ยนแปลงแต่ละครั้ง
  </Step>
  <Step title="ใช้ doctor สำหรับปัญหารันไทม์">
    หากการตรวจสอบผ่านแต่รันไทม์ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อรับความช่วยเหลือด้าน migration และการซ่อม
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
