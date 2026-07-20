---
read_when:
    - ต้องการอ่านหรือแก้ไขการกำหนดค่าแบบไม่โต้ตอบ
sidebarTitle: Config
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: การกำหนดค่า
x-i18n:
    generated_at: "2026-07-20T16:02:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dafc3a8e8c6d27fc86ab6c417593bd753f4326a65768b1cb073bfa6fffceaea
    source_path: cli/config.md
    workflow: 16
---

ตัวช่วยแบบไม่โต้ตอบสำหรับ `openclaw.json`: รับ/ตั้งค่า/แพตช์/ยกเลิกการตั้งค่าค่าตามพาธ แสดงสคีมา ตรวจสอบความถูกต้อง หรือแสดงพาธไฟล์ที่ใช้งานอยู่ เรียกใช้ `openclaw config` โดยไม่มีคำสั่งย่อยเพื่อเปิดวิซาร์ดแบบมีคำแนะนำเดียวกับ `openclaw configure`

<Note>
เมื่อ `OPENCLAW_NIX_MODE=1` OpenClaw จะถือว่า `openclaw.json` เปลี่ยนแปลงไม่ได้ คำสั่งแบบอ่านอย่างเดียว (`config get`, `config file`, `config schema`, `config validate`) ยังคงทำงานได้ แต่คำสั่งเขียนการกำหนดค่าจะปฏิเสธการทำงาน ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งแทน สำหรับดิสทริบิวชัน nix-openclaw อย่างเป็นทางการ ให้ใช้ [คู่มือเริ่มต้นใช้งานฉบับย่อของ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) และตั้งค่าภายใต้ `programs.openclaw.config` หรือ `instances.<name>.config`
</Note>

## ตัวเลือกระดับราก

<ParamField path="--section <section>" type="string">
  ตัวกรองส่วนของการตั้งค่าแบบมีคำแนะนำที่ระบุซ้ำได้ เมื่อเรียกใช้ `openclaw config` โดยไม่มีคำสั่งย่อย
</ParamField>

ส่วนที่มีคำแนะนำ: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

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

### พาธ

ใช้รูปแบบจุดหรือวงเล็บเหลี่ยม ให้ใส่เครื่องหมายคำพูดครอบพาธแบบวงเล็บเหลี่ยมในตัวอย่างเชลล์ เพื่อไม่ให้ zsh ขยาย glob ของ `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

อ่านค่าจากสแนปช็อตการกำหนดค่าที่ปกปิดข้อมูลแล้ว (จะไม่แสดงข้อมูลลับ) `--json` จะแสดงค่าดิบเป็น JSON มิฉะนั้น สตริง/ตัวเลข/บูลีนจะแสดงโดยไม่มีการจัดรูปแบบ และออบเจ็กต์/อาร์เรย์จะแสดงเป็น JSON ที่จัดรูปแบบแล้ว

เมื่อไม่มีพาธดังกล่าว `--json` จะเขียน `{ "error": "Config path not found: <path>" }` ไปยัง stdout และจบการทำงานด้วยสถานะ 1 หากไม่มี `--json` ข้อวินิจฉัยจะยังคงอยู่บน stderr

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

แสดงพาธไฟล์การกำหนดค่าที่ใช้งานอยู่ ซึ่งแปลงค่าจาก `OPENCLAW_CONFIG_PATH` หรือตำแหน่งเริ่มต้น พาธนี้ระบุไฟล์ปกติ ไม่ใช่ลิงก์สัญลักษณ์ โปรดดู [ความปลอดภัยในการเขียน](#write-safety)

### `config schema`

แสดงสคีมา JSON ที่สร้างขึ้นสำหรับ `openclaw.json` ไปยัง stdout

<AccordionGroup>
  <Accordion title="สิ่งที่รวมอยู่">
    - สคีมาการกำหนดค่าระดับรากปัจจุบัน พร้อมฟิลด์สตริง `$schema` ระดับรากสำหรับเครื่องมือตัวแก้ไข
    - ข้อมูลเมตาเอกสารของฟิลด์ `title` / `description` ที่ Control UI ใช้
    - โหนดออบเจ็กต์ซ้อน ไวลด์การ์ด (`*`) และรายการอาร์เรย์ (`[]`) จะสืบทอดข้อมูลเมตา `title` / `description` เดียวกัน เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - แขนง `anyOf` / `oneOf` / `allOf` จะสืบทอดข้อมูลเมตาเอกสารเดียวกันด้วย
    - ข้อมูลเมตาสคีมาของ Plugin และช่องทางแบบสดตามความสามารถที่ทำได้ เมื่อสามารถโหลดไฟล์กำกับรันไทม์ได้
    - สคีมาสำรองที่สมบูรณ์ แม้ว่าการกำหนดค่าปัจจุบันจะไม่ถูกต้อง

  </Accordion>
  <Accordion title="RPC รันไทม์ที่เกี่ยวข้อง">
    `config.schema.lookup` จะส่งคืนพาธการกำหนดค่าที่ปรับเป็นมาตรฐานแล้วหนึ่งพาธ พร้อมโหนดสคีมาแบบตื้น (`title`, `description`, `type`, `enum`, `const`, ขอบเขตทั่วไป) ข้อมูลเมตาคำแนะนำ UI ที่ตรงกัน และข้อมูลสรุปของโหนดย่อยระดับถัดไป ใช้สำหรับการเจาะดูข้อมูลเฉพาะพาธใน Control UI หรือไคลเอนต์ที่กำหนดเอง
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

ตรวจสอบความถูกต้องของการกำหนดค่าปัจจุบันเทียบกับสคีมาที่ใช้งานอยู่ โดยไม่เริ่ม Gateway

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
หากการตรวจสอบความถูกต้องล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure` หรือ `openclaw doctor --fix` `openclaw chat` จะไม่ข้ามตัวป้องกันการกำหนดค่าที่ไม่ถูกต้อง
</Note>

## ค่า

ระบบจะแยกวิเคราะห์ค่าเป็น JSON5 เมื่อทำได้ มิฉะนั้นจะถือว่าเป็นสตริงดิบ ใช้ `--strict-json` เพื่อบังคับให้ใช้ JSON มาตรฐานโดยไม่มีการย้อนกลับไปใช้สตริง (จากนั้นไวยากรณ์ที่มีเฉพาะใน JSON5 เช่น ความคิดเห็น เครื่องหมายจุลภาคท้ายรายการ หรือคีย์ที่ไม่มีเครื่องหมายคำพูดจะถูกปฏิเสธ) `--json` เป็นนามแฝงแบบเดิมของ `--strict-json` บน `config set`

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` จะแสดงค่าดิบเป็น JSON แทนข้อความที่จัดรูปแบบสำหรับเทอร์มินัล

เมื่อการเขียนเปลี่ยน `agents.defaults.model` หรือ `agents.list[].model` ของแต่ละเอเจนต์ OpenClaw จะแก้ไขค่าโมเดลหลักหรือโมเดลสำรองแต่ละรายการที่เปลี่ยนแปลงผ่านแค็ตตาล็อกผู้ให้บริการที่กำหนดค่าไว้ก่อนเขียน การอ้างอิงโมเดลที่ไม่รู้จักจะถูกปฏิเสธโดยไม่เปลี่ยนการกำหนดค่าที่ใช้งานอยู่ เรียกใช้ `openclaw models list` เพื่อดูโมเดลที่พร้อมใช้งาน

<Note>
โดยค่าเริ่มต้น การกำหนดออบเจ็กต์จะแทนที่พาธเป้าหมาย พาธที่มีการป้องกันซึ่งมักเก็บรายการที่ผู้ใช้เพิ่มจะปฏิเสธการแทนที่ที่ทำให้รายการเดิมถูกลบ เว้นแต่จะส่ง `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` และ `auth.profiles`
</Note>

ใช้ `--merge` เมื่อเพิ่มรายการลงในแมปเหล่านั้น:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

ใช้ `--replace` เฉพาะเมื่อต้องการให้ค่าที่ระบุกลายเป็นค่าเป้าหมายทั้งหมดโดยเจตนา

## โหมด `config set`

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
    กำหนดเป้าหมายได้เฉพาะพาธ `secrets.providers.<alias>`:

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

    ไฟล์แบตช์จำกัดขนาดไว้ที่ 8 MiB

  </Tab>
</Tabs>

<Warning>
การกำหนด SecretRef จะถูกปฏิเสธบนพื้นผิวที่รันไทม์รองรับการเปลี่ยนแปลงไม่ได้ (ตัวอย่างเช่น `hooks.token`, `commands.ownerDisplaySecret`, โทเค็น Webhook สำหรับการผูกเธรด Discord และ JSON ข้อมูลประจำตัว WhatsApp) โปรดดู [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
</Warning>

การแยกวิเคราะห์แบบแบตช์จะใช้เพย์โหลดแบตช์ (`--batch-json`/`--batch-file`) เป็นแหล่งข้อมูลจริงเสมอ `--strict-json` / `--json` จะไม่เปลี่ยนพฤติกรรมการแยกวิเคราะห์แบบแบตช์

โหมดพาธ/ค่า JSON ยังใช้กับ SecretRef และผู้ให้บริการโดยตรงได้ด้วย:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### แฟล็กตัวสร้างผู้ให้บริการ

เป้าหมายของตัวสร้างผู้ให้บริการต้องใช้ `secrets.providers.<alias>` เป็นพาธ

<AccordionGroup>
  <Accordion title="แฟล็กทั่วไป">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="ผู้ให้บริการสภาพแวดล้อม (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ระบุซ้ำได้)

  </Accordion>
  <Accordion title="ผู้ให้บริการไฟล์ (--provider-source file)">
    - `--provider-path <path>` (จำเป็น)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="ผู้ให้บริการการเรียกใช้คำสั่ง (--provider-source exec)">
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

ตัวอย่างผู้ให้บริการการเรียกใช้คำสั่งที่เสริมความปลอดภัย:

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

## `config patch`

วางหรือส่งแพตช์ JSON5 ที่มีรูปทรงเหมือนการกำหนดค่าผ่านไปป์ แทนการเรียกใช้คำสั่ง `config set` แบบอิงพาธหลายครั้ง ออบเจ็กต์จะผสานแบบเวียนเกิด อาร์เรย์และค่าสเกลาร์จะแทนที่เป้าหมาย และ `null` จะลบพาธเป้าหมาย

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

ไฟล์แพตช์จำกัดขนาดไว้ที่ 8 MiB แพตช์ `--stdin` ที่ส่งผ่านไปป์จำกัดขนาดไว้ที่ 1 MiB

ส่งแพตช์ผ่าน stdin สำหรับสคริปต์ตั้งค่าระยะไกล:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

ใช้ `--replace-path <path>` เมื่อออบเจ็กต์หรืออาร์เรย์หนึ่งรายการต้องกลายเป็นค่าที่ระบุอย่างตรงตัว แทนที่จะถูกแพตช์แบบเวียนเกิด:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` จะเรียกใช้การตรวจสอบสคีมาและความสามารถในการแก้ค่า SecretRef โดยไม่เขียนข้อมูล SecretRef ที่ใช้ exec จะถูกข้ามโดยค่าเริ่มต้นระหว่างการทดลองทำงาน ให้เพิ่ม `--allow-exec` เมื่อคุณตั้งใจให้การทดลองทำงานเรียกใช้คำสั่งของผู้ให้บริการ

## การทดลองทำงาน

`--dry-run` จะตรวจสอบความถูกต้องของการเปลี่ยนแปลงโดยไม่เขียน `openclaw.json` ใช้ได้กับ `config set`, `config patch` และ `config unset`

```bash
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
  <Accordion title="ลักษณะการทำงานของการทดลองทำงาน">
    - โหมดตัวสร้าง: เรียกใช้การตรวจสอบความสามารถในการแก้ค่า SecretRef สำหรับข้อมูลอ้างอิง/ผู้ให้บริการที่เปลี่ยนแปลง
    - โหมด JSON (`--strict-json`, `--json` หรือโหมดแบตช์): เรียกใช้การตรวจสอบสคีมาร่วมกับการตรวจสอบความสามารถในการแก้ค่า SecretRef
    - การตรวจสอบนโยบายจะดำเนินการกับการกำหนดค่าทั้งหมดหลังการเปลี่ยนแปลง ดังนั้นการเขียนออบเจ็กต์ระดับแม่ (เช่น การตั้งค่า `hooks` เป็นออบเจ็กต์) จึงไม่สามารถข้ามการตรวจสอบพื้นผิวที่ไม่รองรับได้
    - การตรวจสอบ SecretRef แบบ exec จะถูกข้ามโดยค่าเริ่มต้นเพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง ให้ส่ง `--allow-exec` เพื่อเลือกเปิดใช้ (การดำเนินการนี้อาจเรียกใช้คำสั่งของผู้ให้บริการ) `--allow-exec` ใช้ได้เฉพาะกับการทดลองทำงานและจะเกิดข้อผิดพลาดหากไม่มี `--dry-run`

  </Accordion>
  <Accordion title="ฟิลด์ของ --dry-run --json">
    - `ok`: การทดลองทำงานผ่านหรือไม่
    - `operations`: จำนวนการกำหนดค่าที่ประเมิน
    - `checks`: มีการเรียกใช้การตรวจสอบสคีมา/ความสามารถในการแก้ค่าหรือไม่
    - `checks.resolvabilityComplete`: การตรวจสอบความสามารถในการแก้ค่าดำเนินการจนเสร็จสมบูรณ์หรือไม่ (เป็น false เมื่อข้ามข้อมูลอ้างอิงแบบ exec)
    - `refsChecked`: จำนวนข้อมูลอ้างอิงที่แก้ค่าจริงระหว่างการทดลองทำงาน
    - `skippedExecRefs`: จำนวนข้อมูลอ้างอิงแบบ exec ที่ข้ามเนื่องจากไม่ได้ตั้งค่า `--allow-exec`
    - `errors`: ความล้มเหลวแบบมีโครงสร้างจากพาธที่ขาดหาย สคีมา หรือความสามารถในการแก้ค่า เมื่อ `ok=false`

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
      kind: "missing-path" | "schema" | "resolvability" | "model",
      message: string,
      ref?: string, // มีอยู่สำหรับข้อผิดพลาดด้านความสามารถในการแก้ค่า
    },
  ],
}
```

<Tabs>
  <Tab title="ตัวอย่างที่สำเร็จ">
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
  <Tab title="ตัวอย่างที่ล้มเหลว">
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
          "message": "ข้อผิดพลาด: ไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อม \"MISSING_TEST_SECRET\"",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="หากการทดลองทำงานล้มเหลว">
    - `config schema validation failed`: รูปแบบการกำหนดค่าหลังการเปลี่ยนแปลงไม่ถูกต้อง ให้แก้ไขพาธ/ค่า หรือรูปแบบออบเจ็กต์ผู้ให้บริการ/ข้อมูลอ้างอิง
    - `Config policy validation failed: unsupported SecretRef usage`: ย้ายข้อมูลรับรองนั้นกลับไปเป็นอินพุตข้อความธรรมดา/สตริง และใช้ SecretRef เฉพาะบนพื้นผิวที่รองรับ
    - `SecretRef assignment(s) could not be resolved`: ขณะนี้ไม่สามารถแก้ค่าผู้ให้บริการ/ข้อมูลอ้างอิงที่อ้างถึงได้ (ตัวแปรสภาพแวดล้อมขาดหาย ตัวชี้ไฟล์ไม่ถูกต้อง ผู้ให้บริการ exec ล้มเหลว หรือผู้ให้บริการ/แหล่งที่มาไม่ตรงกัน)
    - `model reference validation failed`: ไม่รู้จักโมเดลข้อความหลักหรือสำรองที่เปลี่ยนแปลง ให้เรียกใช้ `openclaw models list` และเลือกโมเดลที่พร้อมใช้งาน
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: เรียกใช้อีกครั้งด้วย `--allow-exec` หากต้องการตรวจสอบความสามารถในการแก้ค่าแบบ exec
    - สำหรับโหมดแบตช์ ให้แก้ไขรายการที่ล้มเหลวและเรียกใช้ `--dry-run` อีกครั้งก่อนเขียนข้อมูล

  </Accordion>
</AccordionGroup>

## การนำการเปลี่ยนแปลงไปใช้

หลังจาก `config set` / `config patch` / `config unset` สำเร็จแต่ละครั้ง CLI จะแสดงคำแนะนำหนึ่งในสามแบบ เพื่อให้ทราบว่า Gateway จำเป็นต้องเริ่มใหม่หรือไม่:

| คำแนะนำ                                                | ความหมาย                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | พาธที่เปลี่ยนแปลงจำเป็นต้องเริ่มระบบใหม่ทั้งหมด |
| `Change will apply without restarting the gateway.` | การโหลดใหม่แบบทันทีจะรับการเปลี่ยนแปลงโดยอัตโนมัติ |
| `No gateway restart needed.`                        | ไม่มีสิ่งที่เกี่ยวข้องกับรันไทม์เปลี่ยนแปลง |

การเขียนไปยัง `plugins.entries` (หรือพาธย่อยใดๆ) จำเป็นต้องเริ่มระบบใหม่เสมอ เนื่องจาก CLI ไม่สามารถยืนยันได้ว่าโหลดข้อมูลเมตาการโหลดใหม่ของ Plugin ทุกตัวแล้ว

## ความปลอดภัยในการเขียน

`openclaw config set` และตัวเขียนการกำหนดค่าอื่นๆ ที่ OpenClaw เป็นเจ้าของจะตรวจสอบการกำหนดค่าทั้งหมดหลังการเปลี่ยนแปลงก่อนบันทึกลงดิสก์ หากเพย์โหลดใหม่ไม่ผ่านการตรวจสอบสคีมาหรือดูเหมือนเป็นการเขียนทับแบบทำลายข้อมูล การกำหนดค่าที่ใช้งานอยู่จะไม่ถูกแก้ไข และเพย์โหลดที่ถูกปฏิเสธจะถูกบันทึกไว้ข้างกันในชื่อ `openclaw.json.rejected.*`

การเขียนที่ OpenClaw เป็นเจ้าของจะแปลง JSON5 เป็น JSON มาตรฐานอีกครั้ง เมื่อแหล่งข้อมูลมีความคิดเห็น ตัวเขียนจะแจ้งเตือนทันทีก่อนนำความคิดเห็นออก หากจำเป็นต้องเก็บความคิดเห็นไว้ ให้ใช้โปรแกรมแก้ไขโดยตรง

<Warning>
พาธการกำหนดค่าที่ใช้งานอยู่ต้องเป็นไฟล์ปกติ ไม่รองรับการเขียนไปยังโครงสร้าง `openclaw.json` ที่ใช้ลิงก์สัญลักษณ์ ให้ใช้ `OPENCLAW_CONFIG_PATH` เพื่อชี้ไปยังไฟล์จริงโดยตรงแทน
</Warning>

ควรใช้การเขียนผ่าน CLI สำหรับการแก้ไขเล็กน้อย:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

หากการเขียนถูกปฏิเสธ ให้ตรวจสอบเพย์โหลดที่บันทึกไว้และแก้ไขรูปแบบการกำหนดค่าทั้งหมด:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

ยังคงสามารถเขียนด้วยโปรแกรมแก้ไขโดยตรงได้ แต่ Gateway ที่กำลังทำงานจะถือว่าการเขียนดังกล่าวไม่น่าเชื่อถือจนกว่าจะผ่านการตรวจสอบ การแก้ไขโดยตรงที่ไม่ถูกต้องจะทำให้การเริ่มต้นล้มเหลวหรือถูกข้ามระหว่างการโหลดใหม่แบบทันที โดย Gateway จะไม่เขียน `openclaw.json` ใหม่ เรียกใช้ `openclaw doctor --fix` เพื่อซ่อมแซมการกำหนดค่าที่มีคำนำหน้า/ถูกเขียนทับ หรือกู้คืนสำเนาล่าสุดที่ทราบว่าใช้งานได้ โปรดดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config)

การกู้คืนทั้งไฟล์สงวนไว้สำหรับการซ่อมแซมด้วย doctor การเปลี่ยนแปลงสคีมาของ Plugin หรือความคลาดเคลื่อนของ `minHostVersion` จะยังคงแสดงข้อผิดพลาดอย่างชัดเจนแทนที่จะย้อนกลับการตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้อง เช่น การกำหนดค่าโมเดล ผู้ให้บริการ โปรไฟล์การยืนยันตัวตน ช่องทาง การเปิดเผย Gateway เครื่องมือ หน่วยความจำ เบราว์เซอร์ หรือ Cron

## วงจรการซ่อมแซม

หลังจาก `openclaw config validate` ผ่านแล้ว ให้ใช้ TUI ภายในเครื่องเพื่อให้เอเจนต์แบบฝังเปรียบเทียบการกำหนดค่าที่ใช้งานอยู่กับเอกสาร ขณะที่คุณตรวจสอบการเปลี่ยนแปลงแต่ละรายการจากเทอร์มินัลเดียวกัน:

```bash
openclaw chat
```

ภายใน TUI เครื่องหมาย `!` ที่อยู่ด้านหน้าจะเรียกใช้คำสั่งเชลล์ภายในเครื่องตามตัวอักษร (หลังจากมีพรอมต์ยืนยันหนึ่งครั้งต่อเซสชัน):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="เปรียบเทียบกับเอกสาร">
    ขอให้เอเจนต์เปรียบเทียบการกำหนดค่าปัจจุบันกับหน้าเอกสารที่เกี่ยวข้องและเสนอการแก้ไขที่เล็กที่สุด
  </Step>
  <Step title="ใช้การแก้ไขแบบเจาะจง">
    ใช้การแก้ไขแบบเจาะจงด้วย `openclaw config set` หรือ `openclaw configure`
  </Step>
  <Step title="ตรวจสอบอีกครั้ง">
    เรียกใช้ `openclaw config validate` อีกครั้งหลังการเปลี่ยนแปลงแต่ละครั้ง
  </Step>
  <Step title="ใช้ Doctor สำหรับปัญหารันไทม์">
    หากการตรวจสอบผ่านแต่รันไทม์ยังทำงานผิดปกติ ให้เรียกใช้ `openclaw doctor` หรือ `openclaw doctor --fix` เพื่อรับความช่วยเหลือด้านการย้ายข้อมูลและการซ่อมแซม
  </Step>
</Steps>

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดค่า](/th/gateway/configuration)
