---
read_when:
    - การกำหนดค่า SecretRefs สำหรับข้อมูลประจำตัวของผู้ให้บริการและการอ้างอิง `auth-profiles.json`
    - ใช้งานการโหลดข้อมูลลับซ้ำ การตรวจสอบ การกำหนดค่า และการนำไปใช้อย่างปลอดภัยในสภาพแวดล้อมการผลิต
    - ทำความเข้าใจการล้มเหลวทันทีเมื่อเริ่มต้น การกรองพื้นผิวที่ไม่ใช้งาน และพฤติกรรมใช้สถานะล่าสุดที่ทราบว่าใช้งานได้
sidebarTitle: Secrets management
summary: 'การจัดการความลับ: ข้อกำหนดของ SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการล้างข้อมูลแบบทางเดียวอย่างปลอดภัย'
title: การจัดการข้อมูลลับ
x-i18n:
    generated_at: "2026-04-30T09:55:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw รองรับ SecretRefs แบบเพิ่มได้ จึงไม่จำเป็นต้องจัดเก็บข้อมูลรับรองที่รองรับไว้เป็นข้อความธรรมดาในการกำหนดค่า

<Note>
ข้อความธรรมดายังใช้งานได้ SecretRefs เป็นแบบเลือกใช้แยกตามข้อมูลรับรองแต่ละรายการ
</Note>

## เป้าหมายและโมเดลรันไทม์

Secret จะถูกแปลงเป็นสแนปช็อตรันไทม์ในหน่วยความจำ

- การแปลงทำแบบทันทีระหว่างการเปิดใช้งาน ไม่ใช่แบบรอใช้จริงบนเส้นทางคำขอ
- การเริ่มต้นล้มเหลวทันทีเมื่อ SecretRef ที่มีผลใช้งานไม่สามารถแปลงได้
- การโหลดใหม่ใช้การสลับแบบ atomic: สำเร็จทั้งหมด หรือคงสแนปช็อตล่าสุดที่ทราบว่าใช้งานได้ไว้
- การละเมิดนโยบาย SecretRef (เช่น โปรไฟล์ auth โหมด OAuth ที่ใช้ร่วมกับอินพุต SecretRef) จะทำให้การเปิดใช้งานล้มเหลวก่อนสลับรันไทม์
- คำขอรันไทม์อ่านจากสแนปช็อตในหน่วยความจำที่ใช้งานอยู่เท่านั้น
- หลังจากการเปิดใช้งาน/โหลดการกำหนดค่าสำเร็จครั้งแรก เส้นทางโค้ดรันไทม์จะอ่านสแนปช็อตในหน่วยความจำที่ใช้งานอยู่นั้นต่อไป จนกว่าการโหลดใหม่สำเร็จจะสลับสแนปช็อต
- เส้นทางการส่งออกก็อ่านจากสแนปช็อตที่ใช้งานอยู่นั้นเช่นกัน (เช่น การส่งการตอบกลับ/เธรดของ Discord และการส่งแอ็กชันของ Telegram); เส้นทางเหล่านี้จะไม่แปลง SecretRefs ใหม่ในทุกการส่ง

สิ่งนี้ช่วยกันการขัดข้องของผู้ให้บริการ secret ออกจากเส้นทางคำขอที่ใช้งานหนัก

## การกรองพื้นผิวที่ใช้งานอยู่

SecretRefs จะถูกตรวจสอบเฉพาะบนพื้นผิวที่มีผลใช้งานอยู่เท่านั้น

- พื้นผิวที่เปิดใช้งาน: refs ที่ยังไม่ได้แปลงจะบล็อกการเริ่มต้น/การโหลดใหม่
- พื้นผิวที่ไม่ใช้งาน: refs ที่ยังไม่ได้แปลงจะไม่บล็อกการเริ่มต้น/การโหลดใหม่
- refs ที่ไม่ใช้งานจะส่ง diagnostics แบบไม่ร้ายแรงพร้อมรหัส `SECRETS_REF_IGNORED_INACTIVE_SURFACE`

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - รายการช่องทาง/บัญชีที่ปิดใช้งาน
    - ข้อมูลรับรองช่องทางระดับบนสุดที่ไม่มีบัญชีที่เปิดใช้งานใดสืบทอดไปใช้
    - พื้นผิวเครื่องมือ/ฟีเจอร์ที่ปิดใช้งาน
    - คีย์เฉพาะผู้ให้บริการค้นหาเว็บที่ไม่ได้ถูกเลือกโดย `tools.web.search.provider` ในโหมด auto (ไม่ได้ตั้งค่าผู้ให้บริการ) คีย์จะถูกตรวจตามลำดับความสำคัญเพื่อการตรวจจับผู้ให้บริการอัตโนมัติจนกว่าจะมีรายการหนึ่งแปลงได้ หลังจากเลือกแล้ว คีย์ของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ใช้งานจนกว่าจะถูกเลือก
    - วัสดุ auth สำหรับ SSH ของ sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` รวมถึงค่าทับซ้อนราย agent) จะใช้งานเฉพาะเมื่อ backend sandbox ที่มีผลคือ `ssh` สำหรับ agent เริ่มต้นหรือ agent ที่เปิดใช้งาน
    - SecretRefs ของ `gateway.remote.token` / `gateway.remote.password` จะใช้งานหากข้อใดข้อหนึ่งต่อไปนี้เป็นจริง:
      - `gateway.mode=remote`
      - มีการกำหนดค่า `gateway.remote.url`
      - `gateway.tailscale.mode` เป็น `serve` หรือ `funnel`
      - ในโหมด local ที่ไม่มีพื้นผิว remote เหล่านั้น:
        - `gateway.remote.token` จะใช้งานเมื่อ token auth ชนะได้และไม่มีการกำหนดค่า env/auth token
        - `gateway.remote.password` จะใช้งานเฉพาะเมื่อ password auth ชนะได้และไม่มีการกำหนดค่า env/auth password
    - SecretRef ของ `gateway.auth.token` จะไม่ใช้งานสำหรับการแปลง auth ตอนเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN` เพราะอินพุต token จาก env ชนะสำหรับรันไทม์นั้น

  </Accordion>
</AccordionGroup>

## diagnostics ของพื้นผิว auth ของ Gateway

เมื่อมีการกำหนดค่า SecretRef บน `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` หรือ `gateway.remote.password` การเริ่มต้น/โหลดใหม่ของ gateway จะบันทึกสถานะพื้นผิวอย่างชัดเจน:

- `active`: SecretRef เป็นส่วนหนึ่งของพื้นผิว auth ที่มีผลและต้องแปลงได้
- `inactive`: SecretRef ถูกละเว้นสำหรับรันไทม์นี้ เพราะพื้นผิว auth อื่นชนะ หรือเพราะ remote auth ถูกปิดใช้งาน/ไม่ได้ใช้งาน

รายการเหล่านี้จะถูกบันทึกด้วย `SECRETS_GATEWAY_AUTH_SURFACE` และมีเหตุผลที่นโยบายพื้นผิวที่ใช้งานอยู่ใช้ประกอบอยู่ด้วย เพื่อให้คุณเห็นได้ว่าทำไมข้อมูลรับรองจึงถูกถือว่าใช้งานอยู่หรือไม่ใช้งาน

## preflight การอ้างอิงระหว่าง onboarding

เมื่อ onboarding ทำงานในโหมด interactive และคุณเลือกการจัดเก็บแบบ SecretRef, OpenClaw จะตรวจสอบ preflight ก่อนบันทึก:

- Env refs: ตรวจสอบชื่อ env var และยืนยันว่ามีค่าที่ไม่ว่างมองเห็นได้ระหว่างการตั้งค่า
- Provider refs (`file` หรือ `exec`): ตรวจสอบการเลือกผู้ให้บริการ แปลง `id` และตรวจชนิดของค่าที่แปลงได้
- เส้นทางใช้ซ้ำ Quickstart: เมื่อ `gateway.auth.token` เป็น SecretRef อยู่แล้ว onboarding จะแปลงค่าก่อน probe/dashboard bootstrap (สำหรับ refs แบบ `env`, `file` และ `exec`) โดยใช้เกต fail-fast เดียวกัน

หากการตรวจสอบล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่

## สัญญา SecretRef

ใช้รูปทรงอ็อบเจกต์เดียวกันทุกที่:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    การตรวจสอบ:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องตรงกับ `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    การตรวจสอบ:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องเป็น JSON pointer แบบสัมบูรณ์ (`/...`)
    - การ escape ตาม RFC6901 ในเซกเมนต์: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    การตรวจสอบ:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องตรงกับ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` ต้องไม่มี `.` หรือ `..` เป็นเซกเมนต์พาธที่คั่นด้วยสแลช (เช่น `a/../b` จะถูกปฏิเสธ)

  </Tab>
</Tabs>

## การกำหนดค่าผู้ให้บริการ

กำหนดผู้ให้บริการภายใต้ `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env provider">
    - allowlist แบบไม่บังคับผ่าน `allowlist`
    - ค่า env ที่หายไป/ว่างจะทำให้การแปลงล้มเหลว

  </Accordion>
  <Accordion title="File provider">
    - อ่านไฟล์ local จาก `path`
    - `mode: "json"` คาดหวัง payload เป็นอ็อบเจกต์ JSON และแปลง `id` เป็น pointer
    - `mode: "singleValue"` คาดหวัง ref id `"value"` และส่งคืนเนื้อหาไฟล์
    - พาธต้องผ่านการตรวจ ownership/permission
    - หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับพาธได้ การแปลงจะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้งค่า `allowInsecurePath: true` บนผู้ให้บริการนั้นเพื่อข้ามการตรวจความปลอดภัยของพาธ

  </Accordion>
  <Accordion title="Exec provider">
    - รันพาธไบนารีแบบสัมบูรณ์ที่กำหนดไว้ โดยไม่ใช้ shell
    - โดยค่าเริ่มต้น `command` ต้องชี้ไปยังไฟล์ปกติ (ไม่ใช่ symlink)
    - ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธคำสั่งที่เป็น symlink (เช่น Homebrew shims) OpenClaw จะตรวจสอบพาธเป้าหมายที่แปลงแล้ว
    - จับคู่ `allowSymlinkCommand` กับ `trustedDirs` สำหรับพาธของ package manager (เช่น `["/opt/homebrew"]`)
    - รองรับ timeout, no-output timeout, ขีดจำกัดจำนวนไบต์ของเอาต์พุต, env allowlist และไดเรกทอรีที่เชื่อถือได้
    - หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับพาธคำสั่งได้ การแปลงจะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้งค่า `allowInsecurePath: true` บนผู้ให้บริการนั้นเพื่อข้ามการตรวจความปลอดภัยของพาธ

    payload คำขอ (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    payload คำตอบ (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    ข้อผิดพลาดแยกตาม id แบบไม่บังคับ:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## ตัวอย่างการผสาน Exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อมของเซิร์ฟเวอร์ MCP

env vars ของเซิร์ฟเวอร์ MCP ที่กำหนดค่าผ่าน `plugins.entries.acpx.config.mcpServers` รองรับ SecretInput สิ่งนี้ช่วยกัน API keys และ token ออกจาก config ข้อความธรรมดา:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

ค่าสตริงข้อความธรรมดายังใช้งานได้ Env-template refs เช่น `${MCP_SERVER_API_KEY}` และอ็อบเจกต์ SecretRef จะถูกแปลงระหว่างการเปิดใช้งาน gateway ก่อนที่ process ของเซิร์ฟเวอร์ MCP จะถูก spawn เช่นเดียวกับพื้นผิว SecretRef อื่น ๆ refs ที่ยังไม่ได้แปลงจะบล็อกการเปิดใช้งานเฉพาะเมื่อ Plugin `acpx` มีผลใช้งานอยู่

## วัสดุ auth สำหรับ SSH ของ sandbox

backend sandbox `ssh` ของ core รองรับ SecretRefs สำหรับวัสดุ auth ของ SSH ด้วย:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

พฤติกรรมรันไทม์:

- OpenClaw แก้ค่า refs เหล่านี้ระหว่างการเปิดใช้งาน sandbox ไม่ใช่แบบ lazy ระหว่างการเรียก SSH แต่ละครั้ง
- ค่าที่แก้แล้วจะถูกเขียนลงไฟล์ชั่วคราวด้วยสิทธิ์ที่จำกัด และใช้ในคอนฟิก SSH ที่สร้างขึ้น
- หาก backend ของ sandbox ที่มีผลไม่ใช่ `ssh` refs เหล่านี้จะยังไม่ทำงานและไม่บล็อกการเริ่มต้นระบบ

## พื้นผิวข้อมูลประจำตัวที่รองรับ

ข้อมูลประจำตัวที่รองรับและไม่รองรับแบบ canonical แสดงไว้ใน:

- [พื้นผิวข้อมูลประจำตัวของ SecretRef](/th/reference/secretref-credential-surface)

<Note>
ข้อมูลประจำตัวที่ mint ระหว่าง runtime หรือหมุนเวียนได้ และข้อมูลสำหรับ refresh ของ OAuth ถูกตั้งใจแยกออกจากการแก้ค่า SecretRef แบบอ่านอย่างเดียว
</Note>

## พฤติกรรมและลำดับความสำคัญที่ต้องมี

- ฟิลด์ที่ไม่มี ref: ไม่เปลี่ยนแปลง
- ฟิลด์ที่มี ref: จำเป็นต้องมีบนพื้นผิวที่ใช้งานอยู่ระหว่างการเปิดใช้งาน
- หากมีทั้ง plaintext และ ref อยู่พร้อมกัน ref จะมีลำดับความสำคัญเหนือกว่าในเส้นทางลำดับความสำคัญที่รองรับ
- ตัวบ่งชี้การปกปิด `__OPENCLAW_REDACTED__` ถูกสงวนไว้สำหรับการปกปิด/กู้คืนคอนฟิกภายใน และจะถูกปฏิเสธหากส่งมาเป็นข้อมูลคอนฟิก literal

สัญญาณคำเตือนและ audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (คำเตือน runtime)
- `REF_SHADOWED` (ผลการ audit เมื่อข้อมูลประจำตัวใน `auth-profiles.json` มีลำดับความสำคัญเหนือ refs ใน `openclaw.json`)

พฤติกรรมความเข้ากันได้ของ Google Chat:

- `serviceAccountRef` มีลำดับความสำคัญเหนือ plaintext `serviceAccount`
- ค่า plaintext จะถูกละเว้นเมื่อมี sibling ref ตั้งค่าไว้

## ตัวกระตุ้นการเปิดใช้งาน

การเปิดใช้งาน secret จะทำงานเมื่อ:

- เริ่มต้นระบบ (preflight และการเปิดใช้งานขั้นสุดท้าย)
- เส้นทาง hot-apply ของการ reload คอนฟิก
- เส้นทาง restart-check ของการ reload คอนฟิก
- reload ด้วยตนเองผ่าน `secrets.reload`
- preflight ของ Gateway config write RPC (`config.set` / `config.apply` / `config.patch`) เพื่อตรวจสอบว่า SecretRef บนพื้นผิวที่ใช้งานอยู่สามารถแก้ค่าได้ภายใน payload คอนฟิกที่ส่งมา ก่อนบันทึกการแก้ไข

สัญญาการเปิดใช้งาน:

- เมื่อสำเร็จ จะสลับ snapshot แบบ atomic
- การเริ่มต้นระบบล้มเหลวจะยกเลิกการเริ่มต้น Gateway
- การ reload ระหว่าง runtime ล้มเหลวจะคง snapshot ล่าสุดที่ทราบว่าใช้งานได้ดีไว้
- preflight ของ Write-RPC ล้มเหลวจะปฏิเสธคอนฟิกที่ส่งมา และคงทั้งคอนฟิกบนดิสก์กับ snapshot runtime ที่ใช้งานอยู่ไว้โดยไม่เปลี่ยนแปลง
- การระบุ channel token แบบต่อการเรียกอย่างชัดเจนให้กับ outbound helper/tool call จะไม่กระตุ้นการเปิดใช้งาน SecretRef; จุดเปิดใช้งานยังคงเป็นการเริ่มต้นระบบ, reload และ `secrets.reload` อย่างชัดเจน

## สัญญาณ degraded และ recovered

เมื่อการเปิดใช้งานระหว่าง reload ล้มเหลวหลังจากสถานะปกติ OpenClaw จะเข้าสู่สถานะ secrets แบบ degraded

รหัส system event และ log แบบ one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

พฤติกรรม:

- Degraded: runtime จะคง snapshot ล่าสุดที่ทราบว่าใช้งานได้ดีไว้
- Recovered: ส่งออกหนึ่งครั้งหลังการเปิดใช้งานสำเร็จครั้งถัดไป
- ความล้มเหลวซ้ำขณะอยู่ในสถานะ degraded อยู่แล้วจะ log คำเตือน แต่ไม่ส่ง event ซ้ำมากเกินไป
- การ fail-fast ตอนเริ่มต้นระบบจะไม่ส่ง event degraded เพราะ runtime ยังไม่เคย active

## การแก้ค่าในเส้นทางคำสั่ง

เส้นทางคำสั่งสามารถเลือกใช้การแก้ค่า SecretRef ที่รองรับผ่าน Gateway snapshot RPC ได้

มีพฤติกรรมกว้าง ๆ สองแบบ:

<Tabs>
  <Tab title="เส้นทางคำสั่งแบบเข้มงวด">
    ตัวอย่างเช่น เส้นทาง remote-memory ของ `openclaw memory` และ `openclaw qr --remote` เมื่อจำเป็นต้องใช้ remote shared-secret refs เส้นทางเหล่านี้อ่านจาก snapshot ที่ใช้งานอยู่และ fail fast เมื่อ SecretRef ที่จำเป็นไม่พร้อมใช้งาน
  </Tab>
  <Tab title="เส้นทางคำสั่งแบบอ่านอย่างเดียว">
    ตัวอย่างเช่น `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` และ flow ซ่อม doctor/config แบบอ่านอย่างเดียว เส้นทางเหล่านี้ก็เลือกใช้ snapshot ที่ใช้งานอยู่ก่อนเช่นกัน แต่จะ degrade แทนการ abort เมื่อ SecretRef เป้าหมายไม่พร้อมใช้งานในเส้นทางคำสั่งนั้น

    พฤติกรรมแบบอ่านอย่างเดียว:

    - เมื่อ Gateway กำลังทำงาน คำสั่งเหล่านี้จะอ่านจาก snapshot ที่ใช้งานอยู่ก่อน
    - หากการแก้ค่าของ Gateway ไม่สมบูรณ์หรือ Gateway ไม่พร้อมใช้งาน คำสั่งจะพยายาม fallback ในเครื่องแบบเจาะจงสำหรับพื้นผิวคำสั่งนั้น
    - หาก SecretRef เป้าหมายยังไม่พร้อมใช้งาน คำสั่งจะดำเนินต่อด้วยเอาต์พุตแบบอ่านอย่างเดียวที่ degraded และ diagnostics ที่ชัดเจน เช่น "configured but unavailable in this command path"
    - พฤติกรรม degraded นี้มีผลเฉพาะภายในคำสั่งเท่านั้น ไม่ได้ลดความเข้มงวดของเส้นทางเริ่มต้น runtime, reload หรือ send/auth

  </Tab>
</Tabs>

หมายเหตุอื่น ๆ:

- การ refresh snapshot หลังจากการหมุน secret ใน backend จัดการด้วย `openclaw secrets reload`
- เมธอด Gateway RPC ที่เส้นทางคำสั่งเหล่านี้ใช้: `secrets.resolve`

## เวิร์กโฟลว์ audit และ configure

flow เริ่มต้นสำหรับ operator:

<Steps>
  <Step title="Audit สถานะปัจจุบัน">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="คอนฟิก SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Audit ซ้ำ">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    ผลการตรวจพบประกอบด้วย:

    - ค่า plaintext ที่เก็บอยู่ (`openclaw.json`, `auth-profiles.json`, `.env` และ `agents/*/agent/models.json` ที่สร้างขึ้น)
    - เศษค้างของ header provider ที่ละเอียดอ่อนแบบ plaintext ในรายการ `models.json` ที่สร้างขึ้น
    - refs ที่แก้ค่าไม่ได้
    - การ shadow ตามลำดับความสำคัญ (`auth-profiles.json` มีลำดับความสำคัญเหนือ refs ใน `openclaw.json`)
    - เศษค้าง legacy (`auth.json`, ข้อเตือน OAuth)

    หมายเหตุ exec:

    - โดยค่าเริ่มต้น audit จะข้ามการตรวจสอบว่า exec SecretRef แก้ค่าได้หรือไม่ เพื่อหลีกเลี่ยงผลข้างเคียงของคำสั่ง
    - ใช้ `openclaw secrets audit --allow-exec` เพื่อ execute exec providers ระหว่าง audit

    หมายเหตุเศษค้างของ header:

    - การตรวจจับ header provider ที่ละเอียดอ่อนอิง heuristic จากชื่อ (ชื่อและส่วนย่อยของ header สำหรับ auth/credential ที่พบบ่อย เช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

  </Accordion>
  <Accordion title="secrets configure">
    ตัวช่วยแบบ interactive ที่:

    - คอนฟิก `secrets.providers` ก่อน (`env`/`file`/`exec`, เพิ่ม/แก้ไข/ลบ)
    - ให้คุณเลือกฟิลด์ที่รองรับซึ่งมี secret ใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับ scope ของ agent หนึ่งรายการ
    - สามารถสร้าง mapping `auth-profiles.json` ใหม่ได้โดยตรงใน target picker
    - เก็บรายละเอียด SecretRef (`source`, `provider`, `id`)
    - เรียกใช้การแก้ค่าแบบ preflight
    - สามารถ apply ได้ทันที

    หมายเหตุ exec:

    - Preflight จะข้ามการตรวจสอบ exec SecretRef เว้นแต่ตั้งค่า `--allow-exec`
    - หากคุณ apply โดยตรงจาก `configure --apply` และแผนมี exec refs/providers ให้ตั้งค่า `--allow-exec` ไว้สำหรับขั้นตอน apply ด้วย

    โหมดที่มีประโยชน์:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    ค่าเริ่มต้นการ apply ของ `configure`:

    - ล้างข้อมูลประจำตัวแบบ static ที่ตรงกันออกจาก `auth-profiles.json` สำหรับ providers เป้าหมาย
    - ล้างรายการ `api_key` แบบ static legacy ออกจาก `auth.json`
    - ล้างบรรทัด secret ที่รู้จักและตรงกันออกจาก `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Apply แผนที่บันทึกไว้:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    หมายเหตุ exec:

    - dry-run จะข้ามการตรวจสอบ exec เว้นแต่ตั้งค่า `--allow-exec`
    - โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRefs/providers เว้นแต่ตั้งค่า `--allow-exec`

    สำหรับรายละเอียดสัญญาของ target/path แบบเข้มงวดและกฎการปฏิเสธที่แน่นอน โปรดดู [สัญญาแผน Secrets Apply](/th/gateway/secrets-plan-contract)

  </Accordion>
</AccordionGroup>

## นโยบายความปลอดภัยแบบทางเดียว

<Warning>
OpenClaw ตั้งใจไม่เขียน rollback backups ที่มีค่า secret plaintext ในอดีต
</Warning>

โมเดลความปลอดภัย:

- preflight ต้องสำเร็จก่อนโหมดเขียน
- การเปิดใช้งาน runtime จะถูกตรวจสอบก่อน commit
- apply อัปเดตไฟล์ด้วยการแทนที่ไฟล์แบบ atomic และพยายาม restore ให้ดีที่สุดเมื่อเกิดความล้มเหลว

## หมายเหตุความเข้ากันได้ของ auth legacy

สำหรับข้อมูลประจำตัวแบบ static runtime จะไม่ขึ้นกับที่จัดเก็บ auth legacy แบบ plaintext อีกต่อไป

- แหล่งข้อมูลประจำตัวของ runtime คือ snapshot ในหน่วยความจำที่แก้ค่าแล้ว
- รายการ `api_key` แบบ static legacy จะถูกล้างเมื่อพบ
- พฤติกรรมความเข้ากันได้ที่เกี่ยวกับ OAuth ยังคงแยกต่างหาก

## หมายเหตุ Web UI

SecretInput unions บางรายการคอนฟิกในโหมด raw editor ได้ง่ายกว่าในโหมด form

## ที่เกี่ยวข้อง

- [การยืนยันตัวตน](/th/gateway/authentication) — การตั้งค่า auth
- [CLI: secrets](/th/cli/secrets) — คำสั่ง CLI
- [ตัวแปรสภาพแวดล้อม](/th/help/environment) — ลำดับความสำคัญของสภาพแวดล้อม
- [พื้นผิวข้อมูลประจำตัวของ SecretRef](/th/reference/secretref-credential-surface) — พื้นผิวข้อมูลประจำตัว
- [สัญญาแผน Secrets Apply](/th/gateway/secrets-plan-contract) — รายละเอียดสัญญาของแผน
- [ความปลอดภัย](/th/gateway/security) — ท่าทีด้านความปลอดภัย
