---
read_when:
    - คุณต้องการอ่านหรือแก้ไข config แบบไม่โต้ตอบ
sidebarTitle: Config
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Config
x-i18n:
    generated_at: "2026-04-26T11:25:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

ตัวช่วย Config สำหรับการแก้ไขแบบไม่โต้ตอบใน `openclaw.json`: อ่าน/ตั้งค่า/ยกเลิกการตั้งค่า/ไฟล์/schema/validate ค่าตามพาธ และพิมพ์ไฟล์ config ที่กำลังใช้งานอยู่ เรียกใช้โดยไม่ระบุ subcommand เพื่อเปิดตัวช่วยตั้งค่า (เช่นเดียวกับ `openclaw configure`)

## ตัวเลือกระดับราก

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วนการตั้งค่าแบบมีคำแนะนำที่ใช้ซ้ำได้เมื่อคุณรัน `openclaw config` โดยไม่มี subcommand
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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

พิมพ์ JSON schema ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout ในรูปแบบ JSON

<AccordionGroup>
  <Accordion title="สิ่งที่รวมอยู่">
    - schema ของ root config ปัจจุบัน พร้อมฟิลด์สตริง `$schema` ที่ระดับรากสำหรับเครื่องมือในตัวแก้ไข
    - เมทาดาต้าเอกสาร `title` และ `description` ของฟิลด์ที่ใช้โดย Control UI
    - โหนดแบบ object ซ้อน, wildcard (`*`) และรายการในอาร์เรย์ (`[]`) จะสืบทอดเมทาดาต้า `title` / `description` เดียวกันเมื่อมีเอกสารประกอบของฟิลด์ที่ตรงกัน
    - สาขา `anyOf` / `oneOf` / `allOf` ก็สืบทอดเมทาดาต้าเอกสารเดียวกันด้วยเมื่อมีเอกสารประกอบของฟิลด์ที่ตรงกัน
    - เมทาดาต้า schema ของ Plugin + channel แบบสดเท่าที่ทำได้ เมื่อสามารถโหลด manifest ของ runtime ได้
    - schema fallback ที่สะอาดแม้ config ปัจจุบันจะไม่ถูกต้อง

  </Accordion>
  <Accordion title="RPC ของ runtime ที่เกี่ยวข้อง">
    `config.schema.lookup` จะคืนค่าพาธ config แบบ normalized หนึ่งพาธ พร้อมโหนด schema แบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป), เมทาดาต้า UI hint ที่ตรงกัน และสรุปลูกโดยตรง ใช้สำหรับการเจาะลึกแบบกำหนดขอบเขตตามพาธใน Control UI หรือไคลเอนต์แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

ส่งผลลัพธ์ไปยังไฟล์เมื่อคุณต้องการตรวจสอบหรือตรวจสอบความถูกต้องด้วยเครื่องมืออื่น:

```bash
openclaw config schema > openclaw.schema.json
```

### พาธ

พาธใช้รูปแบบ dot หรือ bracket:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

ใช้ดัชนีรายการเอเจนต์เพื่อกำหนดเป้าหมายเอเจนต์ที่เฉพาะเจาะจง:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## ค่า

ค่าจะถูกแยกวิเคราะห์เป็น JSON5 เมื่อทำได้; มิฉะนั้นจะถือเป็นสตริง ใช้ `--strict-json` เพื่อบังคับให้แยกวิเคราะห์เป็น JSON5 โดย `--json` ยังรองรับอยู่ในฐานะชื่อเรียกเดิม

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` จะพิมพ์ค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

<Note>
การกำหนดค่า object จะเขียนทับพาธเป้าหมายตามค่าเริ่มต้น พาธ map/list ที่ได้รับการป้องกันซึ่งมักเก็บรายการที่ผู้ใช้เพิ่มเอง เช่น `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` และ `auth.profiles` จะปฏิเสธการเขียนทับที่ทำให้รายการเดิมหายไป เว้นแต่คุณจะส่ง `--replace`
</Note>

ใช้ `--merge` เมื่อต้องการเพิ่มรายการลงใน map เหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อคุณตั้งใจให้ค่าที่ระบุกลายเป็นค่าเป้าหมายทั้งหมดโดยสมบูรณ์

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
  <Tab title="โหมดตัวสร้าง Provider">
    โหมดตัวสร้าง Provider กำหนดเป้าหมายได้เฉพาะพาธ `secrets.providers.<alias>` เท่านั้น:

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
การกำหนดค่า SecretRef จะถูกปฏิเสธบนพื้นผิว runtime-mutable ที่ไม่รองรับ (เช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น Webhook สำหรับ Discord thread-binding และ WhatsApp creds JSON) ดู [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์แบบแบตช์จะใช้ payload ของแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งข้อมูลจริงเสมอ `--strict-json` / `--json` จะไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบแบตช์

โหมด JSON path/value ยังคงรองรับทั้ง SecretRef และ Provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## แฟล็กตัวสร้าง Provider

เป้าหมายของตัวสร้าง Provider ต้องใช้ `secrets.providers.<alias>` เป็นพาธ

<AccordionGroup>
  <Accordion title="แฟล็กร่วม">
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

ตัวอย่าง exec provider แบบ hardened:

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

ใช้ `--dry-run` เพื่อตรวจสอบความถูกต้องของการเปลี่ยนแปลงโดยไม่เขียนลง `openclaw.json`

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
    - โหมดตัวสร้าง: เรียกใช้การตรวจสอบความสามารถในการ resolve ของ SecretRef สำหรับ ref/provider ที่เปลี่ยนแปลง
    - โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): เรียกใช้การตรวจสอบ schema พร้อมกับการตรวจสอบความสามารถในการ resolve ของ SecretRef
    - การตรวจสอบนโยบายจะทำงานด้วยสำหรับพื้นผิวเป้าหมาย SecretRef ที่ไม่รองรับซึ่งรู้จักอยู่แล้ว
    - การตรวจสอบนโยบายจะประเมิน config ทั้งหมดหลังการเปลี่ยนแปลง ดังนั้นการเขียน object ระดับแม่ (เช่น การตั้งค่า `hooks` เป็น object) จะไม่สามารถหลบเลี่ยงการตรวจสอบพื้นผิวที่ไม่รองรับได้
    - การตรวจสอบ SecretRef แบบ exec จะถูกข้ามตามค่าเริ่มต้นระหว่าง dry-run เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
    - ใช้ `--allow-exec` ร่วมกับ `--dry-run` เพื่อเลือกเปิดการตรวจสอบ SecretRef แบบ exec (การทำเช่นนี้อาจรันคำสั่งของ provider)
    - `--allow-exec` ใช้ได้เฉพาะกับ dry-run และจะเกิดข้อผิดพลาดหากใช้โดยไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ของ --dry-run --json">
    `--dry-run --json` จะพิมพ์รายงานที่อ่านได้ด้วยเครื่อง:

    - `ok`: dry-run ผ่านหรือไม่
    - `operations`: จำนวนการกำหนดค่าที่ถูกประเมิน
    - `checks`: การตรวจสอบ schema/ความสามารถในการ resolve ได้รันหรือไม่
    - `checks.resolvabilityComplete`: การตรวจสอบความสามารถในการ resolve รันจนเสร็จสมบูรณ์หรือไม่ (เป็น false เมื่อข้าม exec refs)
    - `refsChecked`: จำนวน ref ที่ถูก resolve จริงระหว่าง dry-run
    - `skippedExecRefs`: จำนวน exec ref ที่ถูกข้ามเพราะไม่ได้ตั้ง `--allow-exec`
    - `errors`: ความล้มเหลวของ schema/ความสามารถในการ resolve แบบมีโครงสร้างเมื่อ `ok=false`

  </Accordion>
</AccordionGroup>

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
      ref?: string, // มีอยู่สำหรับข้อผิดพลาดด้าน resolvability
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
  <Tab title="ตัวอย่างเมื่อไม่สำเร็จ">
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
          "message": "Error: ยังไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อม \"MISSING_TEST_SECRET\"",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="หาก dry-run ไม่สำเร็จ">
    - `config schema validation failed`: รูปร่าง config หลังการเปลี่ยนแปลงของคุณไม่ถูกต้อง; แก้ไขพาธ/ค่า หรือรูปร่าง object ของ provider/ref
    - `Config policy validation failed: unsupported SecretRef usage`: ย้ายข้อมูลรับรองนั้นกลับไปใช้การป้อนแบบ plaintext/string และใช้ SecretRef เฉพาะบนพื้นผิวที่รองรับเท่านั้น
    - `SecretRef assignment(s) could not be resolved`: provider/ref ที่อ้างอิงอยู่ไม่สามารถ resolve ได้ในขณะนี้ (ตัวแปร env หายไป, file pointer ไม่ถูกต้อง, exec provider ล้มเหลว, หรือ provider/source ไม่ตรงกัน)
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ข้าม exec refs; รันใหม่ด้วย `--allow-exec` หากคุณต้องการตรวจสอบความสามารถในการ resolve ของ exec
    - สำหรับโหมดแบตช์ ให้แก้ไขรายการที่ล้มเหลวและรัน `--dry-run` อีกครั้งก่อนเขียนจริง

  </Accordion>
</AccordionGroup>

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียน config อื่นที่ OpenClaw เป็นเจ้าของ จะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อนบันทึกลงดิสก์ หาก payload ใหม่ไม่ผ่านการตรวจสอบ schema หรือดูเหมือนเป็นการเขียนทับแบบทำลายล้าง config ที่กำลังใช้งานจะไม่ถูกแตะต้อง และ payload ที่ถูกปฏิเสธจะถูกบันทึกไว้ข้าง ๆ เป็น `openclaw.json.rejected.*`

<Warning>
พาธ config ที่กำลังใช้งานต้องเป็นไฟล์ปกติ เลย์เอาต์ `openclaw.json` ที่เป็น symlink ไม่รองรับสำหรับการเขียน; ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ไปยังไฟล์จริงโดยตรงแทน
</Warning>

ควรใช้การเขียนผ่าน CLI สำหรับการแก้ไขเล็กน้อย:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบ payload ที่บันทึกไว้และแก้ไขรูปร่าง config ทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

ยังคงอนุญาตให้เขียนโดยตรงผ่านตัวแก้ไขได้ แต่ Gateway ที่กำลังรันจะถือว่าค่าเหล่านั้นไม่น่าเชื่อถือจนกว่าจะตรวจสอบผ่าน การแก้ไขโดยตรงที่ไม่ถูกต้องอาจถูกกู้คืนจากสำเนาสำรองที่ดีล่าสุดระหว่างการเริ่มต้นระบบหรือ hot reload ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับ config ที่เสียหายทั้งระบบ เช่น ข้อผิดพลาดการ parse, ความล้มเหลวของ schema ระดับราก, ความล้มเหลวของ legacy migration หรือความล้มเหลวผสมระหว่าง Plugin และ root หากการตรวจสอบล้มเหลวเฉพาะภายใต้ `plugins.entries.<id>...` OpenClaw จะคง `openclaw.json` ที่กำลังใช้งานไว้และรายงานปัญหาเฉพาะของ Plugin แทนการกู้คืน `.last-good` วิธีนี้ช่วยป้องกันไม่ให้การเปลี่ยนแปลง schema ของ Plugin หรือความไม่ตรงกันของ `minHostVersion` ย้อนคืนการตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้อง เช่น models, providers, auth profiles, channels, การเปิดเผย Gateway, tools, memory, browser หรือ config ของ Cron

## คำสั่งย่อย

- `config file`: พิมพ์พาธไฟล์ config ที่กำลังใช้งานอยู่ (resolve จาก `OPENCLAW_CONFIG_PATH` หรือจากตำแหน่งค่าเริ่มต้น) พาธนี้ควรเป็นชื่อของไฟล์ปกติ ไม่ใช่ symlink

รีสตาร์ต Gateway หลังจากแก้ไข

## ตรวจสอบความถูกต้อง

ตรวจสอบ config ปัจจุบันกับ schema ที่ใช้งานอยู่โดยไม่ต้องเริ่ม Gateway

```bash
openclaw config validate
openclaw config validate --json
```

หลังจาก `openclaw config validate` ผ่านแล้ว คุณสามารถใช้ TUI ภายในเครื่องเพื่อให้อเอเจนต์แบบฝังตัวเปรียบเทียบ config ที่กำลังใช้งานกับเอกสาร ขณะเดียวกันคุณตรวจสอบแต่ละการเปลี่ยนแปลงจากเทอร์มินัลเดียวกันได้:

<Note>
หากการตรวจสอบล้มเหลวอยู่แล้ว ให้เริ่มจาก `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` จะไม่ข้ามตัวป้องกัน config ที่ไม่ถูกต้อง
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

ลูปการซ่อมแซมทั่วไป:

<Steps>
  <Step title="เปรียบเทียบกับเอกสาร">
    ขอให้เอเจนต์เปรียบเทียบ config ปัจจุบันของคุณกับหน้าเอกสารที่เกี่ยวข้อง และเสนอการแก้ไขที่เล็กที่สุด
  </Step>
  <Step title="ใช้การแก้ไขแบบเจาะจง">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="ตรวจสอบใหม่">
    รัน `openclaw config validate` อีกครั้งหลังจากแต่ละการเปลี่ยนแปลง
  </Step>
  <Step title="Doctor สำหรับปัญหา runtime">
    หากการตรวจสอบผ่านแล้วแต่ runtime ยังไม่สมบูรณ์ ให้รัน `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อรับความช่วยเหลือด้านการย้ายข้อมูลและการซ่อมแซม
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Configuration](/th/gateway/configuration)
