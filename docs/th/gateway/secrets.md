---
read_when:
    - การกำหนดค่า SecretRefs สำหรับ credentials ของผู้ให้บริการและ refs ของ `auth-profiles.json`
    - การใช้งานการรีโหลด ตรวจสอบ กำหนดค่า และนำ secrets ไปใช้ในระบบ production อย่างปลอดภัย
    - การทำความเข้าใจ fail-fast ตอนเริ่มต้น การกรองพื้นผิวที่ไม่ใช้งาน และพฤติกรรม last-known-good
sidebarTitle: Secrets management
summary: 'การจัดการ secrets: สัญญา SecretRef, พฤติกรรมของ runtime snapshot และการล้างแบบทางเดียวอย่างปลอดภัย'
title: การจัดการ secrets
x-i18n:
    generated_at: "2026-04-26T11:31:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw รองรับ SecretRefs แบบ additive ดังนั้น credentials ที่รองรับจึงไม่จำเป็นต้องถูกเก็บเป็น plaintext ในคอนฟิก

<Note>
plaintext ยังใช้งานได้ตามปกติ SecretRefs เป็นการเลือกใช้แบบ opt-in ต่อ credential
</Note>

## เป้าหมายและโมเดล runtime

secrets จะถูก resolve ไปเป็น runtime snapshot ในหน่วยความจำ

- การ resolve จะเกิดขึ้นแบบ eager ระหว่าง activation ไม่ใช่แบบ lazy บน request paths
- การเริ่มต้นจะ fail fast เมื่อ SecretRef ที่มีผลใช้งานจริงไม่สามารถ resolve ได้
- การ reload ใช้ atomic swap: สำเร็จทั้งหมด หรือคง snapshot แบบ last-known-good เดิมไว้
- การละเมิดนโยบาย SecretRef (เช่น auth profiles แบบ OAuth mode ที่ใช้ร่วมกับอินพุต SecretRef) จะทำให้ activation ล้มเหลวก่อน runtime swap
- runtime requests จะอ่านจาก active in-memory snapshot เท่านั้น
- หลังจาก config activation/load สำเร็จครั้งแรก เส้นทางโค้ดของ runtime จะอ่านจาก active in-memory snapshot นั้นต่อไปจนกว่าจะมี successful reload ที่สลับมันออก
- เส้นทางการส่งขาออกก็อ่านจาก active snapshot นั้นเช่นกัน (เช่น การส่ง reply/thread ของ Discord และการส่ง actions ของ Telegram); มันจะไม่ resolve SecretRefs ใหม่ทุกครั้งที่ส่ง

สิ่งนี้ช่วยกันไม่ให้เหตุขัดข้องของผู้ให้บริการ secret ไปอยู่บน hot request paths

## การกรองพื้นผิวที่ใช้งานจริง

SecretRefs จะถูกตรวจสอบเฉพาะบนพื้นผิวที่มีผลใช้งานจริงเท่านั้น

- พื้นผิวที่เปิดใช้งาน: refs ที่ resolve ไม่ได้จะบล็อก startup/reload
- พื้นผิวที่ไม่ใช้งาน: refs ที่ resolve ไม่ได้จะไม่บล็อก startup/reload
- refs ที่ไม่ใช้งานจะปล่อย diagnostics แบบไม่ร้ายแรงพร้อมโค้ด `SECRETS_REF_IGNORED_INACTIVE_SURFACE`

<AccordionGroup>
  <Accordion title="ตัวอย่างของพื้นผิวที่ไม่ใช้งาน">
    - รายการ channel/account ที่ปิดใช้งาน
    - credentials ของ channel ระดับบนสุดที่ไม่มีบัญชีที่เปิดใช้งานใดสืบทอดไปใช้
    - พื้นผิวของ tool/feature ที่ปิดใช้งาน
    - คีย์เฉพาะผู้ให้บริการของ web search ที่ไม่ได้ถูกเลือกโดย `tools.web.search.provider` ในโหมดอัตโนมัติ (ไม่ได้ตั้ง provider) ระบบจะตรวจคีย์ตามลำดับความสำคัญเพื่อทำ auto-detection ของ provider จนกว่าจะมีตัวหนึ่ง resolve ได้ หลังจากเลือกแล้ว คีย์ของผู้ให้บริการที่ไม่ได้ถูกเลือกจะถือว่าไม่ใช้งานจนกว่าจะถูกเลือก
    - ข้อมูล auth ของ sandbox SSH (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` รวมถึง overrides ต่อเอเจนต์) จะใช้งานจริงก็ต่อเมื่อ effective sandbox backend เป็น `ssh` สำหรับเอเจนต์ค่าเริ่มต้นหรือเอเจนต์ที่เปิดใช้งาน
    - SecretRefs ของ `gateway.remote.token` / `gateway.remote.password` จะถือว่าใช้งานจริงถ้าข้อใดข้อหนึ่งต่อไปนี้เป็นจริง:
      - `gateway.mode=remote`
      - มีการกำหนด `gateway.remote.url`
      - `gateway.tailscale.mode` เป็น `serve` หรือ `funnel`
      - ใน local mode ที่ไม่มีพื้นผิว remote เหล่านั้น:
        - `gateway.remote.token` จะใช้งานจริงเมื่อ token auth มีโอกาสชนะและไม่มี env/auth token ถูกกำหนดไว้
        - `gateway.remote.password` จะใช้งานจริงเฉพาะเมื่อ password auth มีโอกาสชนะและไม่มี env/auth password ถูกกำหนดไว้
    - SecretRef ของ `gateway.auth.token` จะไม่ใช้งานสำหรับการ resolve auth ตอน startup เมื่อมีการตั้ง `OPENCLAW_GATEWAY_TOKEN` เพราะ token จาก env จะชนะสำหรับ runtime นั้น
  </Accordion>
</AccordionGroup>

## diagnostics ของพื้นผิว Gateway auth

เมื่อมีการกำหนด SecretRef บน `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` หรือ `gateway.remote.password`, startup/reload ของ gateway จะบันทึกสถานะของพื้นผิวอย่างชัดเจน:

- `active`: SecretRef เป็นส่วนหนึ่งของ effective auth surface และต้อง resolve ได้
- `inactive`: SecretRef ถูกเพิกเฉยสำหรับ runtime นี้ เพราะมี auth surface อื่นชนะอยู่ หรือเพราะ remote auth ถูกปิด/ไม่ใช้งาน

รายการเหล่านี้จะถูกบันทึกด้วย `SECRETS_GATEWAY_AUTH_SURFACE` และรวมเหตุผลที่ active-surface policy ใช้ไว้ด้วย เพื่อให้คุณเห็นว่าเหตุใด credential จึงถูกมองว่า active หรือ inactive

## การตรวจสอบอ้างอิงล่วงหน้าระหว่าง onboarding

เมื่อ onboarding ทำงานในโหมดโต้ตอบและคุณเลือกการเก็บแบบ SecretRef, OpenClaw จะรันการตรวจสอบ preflight ก่อนบันทึก:

- env refs: ตรวจสอบชื่อ env var และยืนยันว่ามีค่าที่ไม่ว่างให้เห็นได้ระหว่างการตั้งค่า
- provider refs (`file` หรือ `exec`): ตรวจสอบการเลือก provider, resolve `id` และตรวจสอบชนิดของค่าที่ resolve แล้ว
- เส้นทาง reuse แบบ quickstart: เมื่อ `gateway.auth.token` เป็น SecretRef อยู่แล้ว onboarding จะ resolve มันก่อน probe/dashboard bootstrap (สำหรับ refs แบบ `env`, `file` และ `exec`) โดยใช้ fail-fast gate เดียวกัน

หากการตรวจสอบล้มเหลว onboarding จะแสดงข้อผิดพลาดและให้คุณลองใหม่ได้

## สัญญา SecretRef

ใช้รูปแบบอ็อบเจ็กต์เดียวกันทุกที่:

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
    - ใช้ RFC6901 escaping ใน segments: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    การตรวจสอบ:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องตรงกับ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` ต้องไม่มี `.` หรือ `..` เป็น path segments ที่คั่นด้วย slash (เช่น `a/../b` จะถูกปฏิเสธ)

  </Tab>
</Tabs>

## คอนฟิกของ provider

กำหนด providers ภายใต้ `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // หรือ "singleValue"
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
    - มี allowlist แบบเลือกได้ผ่าน `allowlist`
    - ค่า env ที่ไม่มีหรือว่างจะทำให้การ resolve ล้มเหลว
  </Accordion>
  <Accordion title="File provider">
    - อ่านไฟล์ local จาก `path`
    - `mode: "json"` คาดหวัง payload เป็น JSON object และ resolve `id` เป็น pointer
    - `mode: "singleValue"` คาดหวัง ref id เป็น `"value"` และส่งคืนเนื้อหาของไฟล์
    - path ต้องผ่านการตรวจสอบ ownership/permissions
    - หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับ path ได้ การ resolve จะล้มเหลว สำหรับ paths ที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของ path
  </Accordion>
  <Accordion title="Exec provider">
    - รัน binary path แบบสัมบูรณ์ที่กำหนดไว้ โดยไม่ผ่าน shell
    - โดยค่าเริ่มต้น `command` ต้องชี้ไปยังไฟล์ปกติ (ไม่ใช่ symlink)
    - ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาต command paths แบบ symlink (เช่น Homebrew shims) OpenClaw จะตรวจสอบ resolved target path
    - ควรจับคู่ `allowSymlinkCommand` กับ `trustedDirs` สำหรับ paths ของ package manager (เช่น `["/opt/homebrew"]`)
    - รองรับ timeout, no-output timeout, การจำกัดขนาด bytes ของ output, env allowlist และ trusted dirs
    - หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับ command path ได้ การ resolve จะล้มเหลว สำหรับ paths ที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บน provider นั้นเพื่อข้ามการตรวจสอบความปลอดภัยของ path

    payload ของ request (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    payload ของ response (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    ข้อผิดพลาดต่อ id แบบเลือกได้:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## ตัวอย่างการเชื่อมต่อ exec

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

env vars ของเซิร์ฟเวอร์ MCP ที่กำหนดผ่าน `plugins.entries.acpx.config.mcpServers` รองรับ SecretInput สิ่งนี้ช่วยให้ API keys และ tokens ไม่ต้องอยู่ในคอนฟิกแบบ plaintext:

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

ค่าสตริงแบบ plaintext ยังใช้งานได้ตามปกติ env-template refs เช่น `${MCP_SERVER_API_KEY}` และอ็อบเจ็กต์ SecretRef จะถูก resolve ระหว่าง gateway activation ก่อนที่ process ของเซิร์ฟเวอร์ MCP จะถูกสปินขึ้น เช่นเดียวกับพื้นผิว SecretRef อื่น refs ที่ resolve ไม่ได้จะบล็อก activation เฉพาะเมื่อ plugin `acpx` มีผลใช้งานจริงเท่านั้น

## ข้อมูล auth ของ Sandbox SSH

backend `ssh` ของ sandbox หลักยังรองรับ SecretRefs สำหรับข้อมูล auth ของ SSH ด้วย:

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

พฤติกรรมของ runtime:

- OpenClaw จะ resolve refs เหล่านี้ระหว่างการเปิดใช้งาน sandbox ไม่ใช่แบบ lazy ระหว่างการเรียก SSH แต่ละครั้ง
- ค่าที่ resolve แล้วจะถูกเขียนลงไฟล์ชั่วคราวด้วยสิทธิ์แบบเข้มงวด และนำไปใช้ในคอนฟิก SSH ที่สร้างขึ้น
- หาก effective sandbox backend ไม่ใช่ `ssh`, refs เหล่านี้จะยังคงไม่ใช้งานและจะไม่บล็อก startup

## พื้นผิว credential ที่รองรับ

รายการ canonical ของ credentials ที่รองรับและไม่รองรับอยู่ที่:

- [SecretRef Credential Surface](/th/reference/secretref-credential-surface)

<Note>
credentials ที่ถูกสร้างระหว่าง runtime หรือหมุนเวียนอยู่ตลอด และข้อมูล OAuth refresh จะถูกตั้งใจไม่รวมออกจากการ resolve แบบ SecretRef ที่เป็น read-only
</Note>

## พฤติกรรมและลำดับความสำคัญที่จำเป็น

- ฟิลด์ที่ไม่มี ref: ไม่เปลี่ยนแปลง
- ฟิลด์ที่มี ref: จำเป็นบนพื้นผิวที่ใช้งานจริงระหว่าง activation
- หากมีทั้ง plaintext และ ref อยู่พร้อมกัน ref จะมีผลเหนือกว่าบนเส้นทางลำดับความสำคัญที่รองรับ
- sentinel สำหรับการ redaction `__OPENCLAW_REDACTED__` ถูกสงวนไว้สำหรับการ redaction/restore ของคอนฟิกภายใน และจะถูกปฏิเสธหากส่งมาเป็นข้อมูลคอนฟิก literal

สัญญาณคำเตือนและการตรวจสอบ:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (คำเตือนระหว่าง runtime)
- `REF_SHADOWED` (ผลการตรวจสอบเมื่อ credentials ใน `auth-profiles.json` มีผลเหนือ refs ใน `openclaw.json`)

พฤติกรรมด้านความเข้ากันได้ของ Google Chat:

- `serviceAccountRef` มีผลเหนือกว่า plaintext `serviceAccount`
- ค่า plaintext จะถูกเพิกเฉยเมื่อมี sibling ref ถูกตั้งไว้

## ทริกเกอร์ของ activation

การเปิดใช้งาน secrets จะทำงานเมื่อ:

- Startup (preflight และ final activation)
- เส้นทาง hot-apply ของ config reload
- เส้นทาง restart-check ของ config reload
- การ reload แบบแมนนวลผ่าน `secrets.reload`
- preflight ของ Gateway config write RPC (`config.set` / `config.apply` / `config.patch`) สำหรับความสามารถในการ resolve ของ SecretRef บนพื้นผิวที่ใช้งานจริง ภายใน payload คอนฟิกที่ส่งมาก่อนบันทึกการแก้ไข

สัญญาการเปิดใช้งาน:

- เมื่อสำเร็จจะสลับ snapshot แบบ atomic
- หาก startup ล้มเหลวจะยกเลิกการเริ่มต้น gateway
- หาก runtime reload ล้มเหลวจะคง snapshot แบบ last-known-good ไว้
- หาก preflight ของ write-RPC ล้มเหลวจะปฏิเสธคอนฟิกที่ส่งมา และคงทั้งคอนฟิกบนดิสก์และ active runtime snapshot ไว้โดยไม่เปลี่ยนแปลง
- การระบุ channel token แบบ explicit ต่อการเรียก helper/tool ขาออกหนึ่งครั้ง จะไม่ทริกเกอร์การเปิดใช้งาน SecretRef; จุด activation ยังคงเป็น startup, reload และ `secrets.reload` แบบ explicit เท่านั้น

## สัญญาณ degraded และ recovered

เมื่อ activation ระหว่าง reload ล้มเหลวหลังจากเคยอยู่ในสถานะปกติ OpenClaw จะเข้าสู่ degraded secrets state

โค้ดของ system event และ log แบบ one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

พฤติกรรม:

- Degraded: runtime จะคง snapshot แบบ last-known-good ไว้
- Recovered: จะถูกส่งออกหนึ่งครั้งหลังจาก activation ครั้งถัดไปที่สำเร็จ
- หากล้มเหลวซ้ำขณะ degraded อยู่แล้ว จะบันทึกคำเตือนแต่จะไม่ส่ง events ซ้ำจนล้น
- fail-fast ตอน startup จะไม่ส่ง degraded events เพราะ runtime ยังไม่เคย active

## การ resolve บนเส้นทางคำสั่ง

เส้นทางคำสั่งสามารถเลือกใช้การ resolve SecretRef ที่รองรับได้ผ่าน gateway snapshot RPC

มีพฤติกรรมกว้างๆ สองแบบ:

<Tabs>
  <Tab title="เส้นทางคำสั่งแบบ strict">
    เช่น `openclaw memory` บนเส้นทาง remote-memory และ `openclaw qr --remote` เมื่อมันต้องใช้ refs ของ remote shared-secret โดยคำสั่งเหล่านี้จะอ่านจาก active snapshot และ fail fast เมื่อ SecretRef ที่จำเป็นไม่พร้อมใช้งาน
  </Tab>
  <Tab title="เส้นทางคำสั่งแบบ read-only">
    เช่น `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` และโฟลว์ doctor/config repair แบบ read-only คำสั่งเหล่านี้ก็จะพยายามใช้ active snapshot ก่อนเช่นกัน แต่จะ degrade แทนการยกเลิกเมื่อ SecretRef เป้าหมายไม่พร้อมใช้งานในเส้นทางคำสั่งนั้น

    พฤติกรรมแบบ read-only:

    - เมื่อ gateway กำลังทำงาน คำสั่งเหล่านี้จะอ่านจาก active snapshot ก่อน
    - หากการ resolve ผ่าน gateway ไม่สมบูรณ์หรือ gateway ไม่พร้อมใช้งาน คำสั่งจะพยายามใช้ targeted local fallback สำหรับพื้นผิวคำสั่งนั้นโดยเฉพาะ
    - หาก SecretRef เป้าหมายยังคงไม่พร้อมใช้งาน คำสั่งจะทำงานต่อด้วยผลลัพธ์ read-only แบบ degraded พร้อม diagnostics ที่ชัดเจน เช่น "configured but unavailable in this command path"
    - พฤติกรรม degraded นี้มีผลเฉพาะในระดับคำสั่งเท่านั้น ไม่ได้ทำให้ startup, reload หรือเส้นทาง send/auth ของ runtime อ่อนลง

  </Tab>
</Tabs>

หมายเหตุอื่นๆ:

- การรีเฟรช snapshot หลังการหมุนเวียน secret ที่แบ็กเอนด์จะจัดการด้วย `openclaw secrets reload`
- เมธอด Gateway RPC ที่เส้นทางคำสั่งเหล่านี้ใช้คือ `secrets.resolve`

## เวิร์กโฟลว์การตรวจสอบและการตั้งค่า

โฟลว์เริ่มต้นสำหรับผู้ปฏิบัติงาน:

<Steps>
  <Step title="ตรวจสอบสถานะปัจจุบัน">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="กำหนดค่า SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="ตรวจสอบซ้ำ">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    ผลการตรวจสอบรวมถึง:

    - ค่า plaintext ที่พักอยู่บนดิสก์ (`openclaw.json`, `auth-profiles.json`, `.env` และ `agents/*/agent/models.json` ที่ถูกสร้างขึ้น)
    - คราบ header ของ provider ที่มีความอ่อนไหวแบบ plaintext ในรายการ `models.json` ที่ถูกสร้างขึ้น
    - refs ที่ resolve ไม่ได้
    - การถูก shadow ตามลำดับความสำคัญ (`auth-profiles.json` มีผลเหนือ refs ใน `openclaw.json`)
    - คราบตกค้างแบบเดิม (`auth.json`, ข้อความเตือน OAuth)

    หมายเหตุเกี่ยวกับ exec:

    - โดยค่าเริ่มต้น audit จะข้ามการตรวจสอบความสามารถในการ resolve ของ exec SecretRefs เพื่อหลีกเลี่ยงผลข้างเคียงจากคำสั่ง
    - ใช้ `openclaw secrets audit --allow-exec` เพื่อให้ audit เรียกใช้งาน exec providers

    หมายเหตุเกี่ยวกับคราบ header:

    - การตรวจจับ provider headers ที่มีความอ่อนไหวเป็นแบบอิง heuristic จากชื่อ (ชื่อ header และชิ้นส่วนข้อความที่พบบ่อยเกี่ยวกับ auth/credential เช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

  </Accordion>
  <Accordion title="secrets configure">
    ตัวช่วยแบบโต้ตอบที่:

    - กำหนดค่า `secrets.providers` ก่อน (`env`/`file`/`exec`, เพิ่ม/แก้ไข/ลบ)
    - ให้คุณเลือกฟิลด์ที่รองรับและมี secret ใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับขอบเขตเอเจนต์หนึ่งรายการ
    - สามารถสร้างการแมป `auth-profiles.json` ใหม่ได้โดยตรงในตัวเลือกเป้าหมาย
    - เก็บรายละเอียด SecretRef (`source`, `provider`, `id`)
    - รัน preflight resolution
    - สามารถนำไปใช้ได้ทันที

    หมายเหตุเกี่ยวกับ exec:

    - preflight จะข้ามการตรวจสอบ exec SecretRef เว้นแต่จะตั้ง `--allow-exec`
    - หากคุณนำไปใช้โดยตรงจาก `configure --apply` และแผนมี exec refs/providers ให้คง `--allow-exec` ไว้สำหรับขั้นตอน apply ด้วย

    โหมดที่มีประโยชน์:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    ค่าเริ่มต้นของการ apply จาก `configure`:

    - ล้าง static credentials ที่ตรงกันออกจาก `auth-profiles.json` สำหรับ providers เป้าหมาย
    - ล้างรายการ `api_key` แบบ static แบบเดิมออกจาก `auth.json`
    - ล้างบรรทัด secret ที่ตรงกันและรู้จักออกจาก `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    นำแผนที่บันทึกไว้ไปใช้:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    หมายเหตุเกี่ยวกับ exec:

    - dry-run จะข้ามการตรวจสอบ exec เว้นแต่จะตั้ง `--allow-exec`
    - โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRefs/providers เว้นแต่จะตั้ง `--allow-exec`

    สำหรับรายละเอียดสัญญาเป้าหมาย/path แบบ strict และกฎการปฏิเสธแบบตรงตัว ดู [Secrets Apply Plan Contract](/th/gateway/secrets-plan-contract)

  </Accordion>
</AccordionGroup>

## นโยบายความปลอดภัยแบบทางเดียว

<Warning>
OpenClaw ตั้งใจไม่เขียน rollback backups ที่มีค่า plaintext ของ secrets ในอดีต
</Warning>

โมเดลความปลอดภัย:

- preflight ต้องสำเร็จก่อนโหมดเขียน
- runtime activation จะถูกตรวจสอบก่อน commit
- apply จะอัปเดตไฟล์ด้วย atomic file replacement และพยายาม restore แบบ best-effort หากล้มเหลว

## หมายเหตุเรื่องความเข้ากันได้ของ auth แบบเดิม

สำหรับ static credentials, runtime ไม่ได้พึ่งพาการจัดเก็บ auth แบบ plaintext แบบเดิมอีกต่อไป

- แหล่งที่มาของ runtime credential คือ snapshot ในหน่วยความจำที่ resolve แล้ว
- รายการ `api_key` แบบ static แบบเดิมจะถูกล้างเมื่อพบ
- พฤติกรรมด้านความเข้ากันได้ที่เกี่ยวกับ OAuth ยังคงแยกต่างหาก

## หมายเหตุเกี่ยวกับ Web UI

SecretInput unions บางส่วนจะกำหนดค่าได้ง่ายกว่าในโหมด raw editor มากกว่าโหมด form

## ที่เกี่ยวข้อง

- [Authentication](/th/gateway/authentication) — การตั้งค่า auth
- [CLI: secrets](/th/cli/secrets) — คำสั่ง CLI
- [Environment Variables](/th/help/environment) — ลำดับความสำคัญของ environment
- [SecretRef Credential Surface](/th/reference/secretref-credential-surface) — พื้นผิว credential
- [Secrets Apply Plan Contract](/th/gateway/secrets-plan-contract) — รายละเอียดของสัญญาแผน
- [Security](/th/gateway/security) — แนวทางด้านความปลอดภัย
