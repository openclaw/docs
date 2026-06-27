---
read_when:
    - การกำหนดค่า SecretRefs สำหรับข้อมูลรับรองของผู้ให้บริการและการอ้างอิง `auth-profiles.json`
    - ดำเนินการโหลดซ้ำ ตรวจสอบ กำหนดค่า และใช้ความลับอย่างปลอดภัยใน production
    - ทำความเข้าใจพฤติกรรมการ fail-fast ตอนเริ่มต้น การกรองพื้นผิวที่ไม่ได้ใช้งาน และ last-known-good
sidebarTitle: Secrets management
summary: 'การจัดการความลับ: สัญญา SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการขัดข้อมูลแบบทางเดียวอย่างปลอดภัย'
title: การจัดการความลับ
x-i18n:
    generated_at: "2026-06-27T17:38:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw รองรับ SecretRefs แบบเพิ่มได้ เพื่อให้ข้อมูลประจำตัวที่รองรับไม่จำเป็นต้องถูกจัดเก็บเป็นข้อความธรรมดาในการกำหนดค่า

<Note>
ข้อความธรรมดายังคงใช้งานได้ SecretRefs เป็นแบบเลือกใช้แยกตามข้อมูลประจำตัวแต่ละรายการ
</Note>

<Warning>
ข้อมูลประจำตัวแบบข้อความธรรมดายังคงอ่านได้โดยเอเจนต์ หากถูกจัดเก็บไว้ในไฟล์ที่
เอเจนต์ตรวจสอบได้ รวมถึง `openclaw.json`, `auth-profiles.json`, `.env` หรือ
ไฟล์ `agents/*/agent/models.json` ที่สร้างขึ้น SecretRefs ลดขอบเขตผลกระทบในเครื่อง
ดังกล่าวได้ก็ต่อเมื่อข้อมูลประจำตัวที่รองรับทั้งหมดถูกย้ายแล้ว และ
`openclaw secrets audit --check` รายงานว่าไม่มีเศษความลับแบบข้อความธรรมดาหลงเหลือ
</Warning>

## เป้าหมายและโมเดลรันไทม์

ความลับจะถูกแก้ค่าเป็นสแนปช็อตรันไทม์ในหน่วยความจำ

- การแก้ค่าทำแบบกระตือรือร้นระหว่างการเปิดใช้งาน ไม่ใช่แบบหน่วงเวลาบนเส้นทางคำขอ
- การเริ่มต้นล้มเหลวอย่างรวดเร็วเมื่อ SecretRef ที่มีผลใช้งานจริงไม่สามารถแก้ค่าได้
- การโหลดซ้ำใช้การสลับแบบอะตอมิก: สำเร็จทั้งหมด หรือคงสแนปช็อตล่าสุดที่ทราบว่าใช้ได้ไว้
- การละเมิดนโยบาย SecretRef (เช่น โปรไฟล์การยืนยันตัวตนโหมด OAuth ที่ใช้ร่วมกับอินพุต SecretRef) ทำให้การเปิดใช้งานล้มเหลวก่อนสลับรันไทม์
- คำขอรันไทม์อ่านจากสแนปช็อตในหน่วยความจำที่ใช้งานอยู่เท่านั้น
- หลังจากการเปิดใช้งาน/โหลดการกำหนดค่าสำเร็จครั้งแรก เส้นทางโค้ดรันไทม์จะยังคงอ่านสแนปช็อตในหน่วยความจำที่ใช้งานอยู่นั้น จนกว่าการโหลดซ้ำที่สำเร็จจะสลับแทนที่
- เส้นทางการส่งออกก็อ่านจากสแนปช็อตที่ใช้งานอยู่นั้นเช่นกัน (เช่น การส่งการตอบกลับ/เธรดของ Discord และการส่งการดำเนินการของ Telegram); เส้นทางเหล่านี้ไม่แก้ค่า SecretRefs ใหม่ทุกครั้งที่ส่ง

สิ่งนี้ช่วยกันไม่ให้เหตุขัดข้องของผู้ให้บริการความลับไปอยู่บนเส้นทางคำขอร้อน

## ขอบเขตการเข้าถึงของเอเจนต์

SecretRefs ปกป้องข้อมูลประจำตัวไม่ให้คงอยู่ในคอนฟิกที่รองรับและ
พื้นผิวโมเดลที่สร้างขึ้น แต่ไม่ใช่ขอบเขตการแยกกระบวนการ หากข้อมูลประจำตัวแบบ
ข้อความธรรมดายังคงอยู่บนดิสก์ในพาธที่เอเจนต์อ่านได้ เอเจนต์สามารถ
ข้ามการปกปิดระดับ API ได้ด้วยการใช้เครื่องมือไฟล์หรือเชลล์เพื่อตรวจสอบไฟล์นั้น

สำหรับการปรับใช้จริงที่ไฟล์ซึ่งเอเจนต์เข้าถึงได้อยู่ในขอบเขต ให้ถือว่า
การย้าย SecretRef เสร็จสมบูรณ์ก็ต่อเมื่อทั้งหมดนี้เป็นจริง:

- ข้อมูลประจำตัวที่รองรับใช้ SecretRefs แทนค่าข้อความธรรมดา
- เศษข้อความธรรมดาแบบเดิมถูกล้างออกจาก `openclaw.json`,
  `auth-profiles.json`, `.env` และไฟล์ `models.json` ที่สร้างขึ้นแล้ว
- `openclaw secrets audit --check` สะอาดหลังการย้าย
- ข้อมูลประจำตัวที่ยังไม่รองรับหรือมีการหมุนเวียนที่เหลืออยู่ได้รับการปกป้องด้วยการแยกของระบบปฏิบัติการ การแยกคอนเทนเนอร์ หรือพร็อกซีข้อมูลประจำตัวภายนอก

นี่คือเหตุผลที่เวิร์กโฟลว์ audit/configure/apply เป็นด่านการย้ายด้านความปลอดภัย ไม่ใช่
แค่ตัวช่วยเพื่อความสะดวก

<Warning>
SecretRefs ไม่ได้ทำให้ไฟล์ใด ๆ ที่อ่านได้ปลอดภัยโดยอัตโนมัติ ข้อมูลสำรอง คอนฟิกที่คัดลอกไว้
แค็ตตาล็อกโมเดลเก่าที่สร้างขึ้น และคลาสข้อมูลประจำตัวที่ไม่รองรับต้องถูกถือว่า
เป็นความลับสำหรับโปรดักชันจนกว่าจะถูกลบ ย้ายออกนอกขอบเขตความไว้วางใจของเอเจนต์
หรือได้รับการปกป้องด้วยชั้นการแยกแยกต่างหาก
</Warning>

## การกรองพื้นผิวที่ใช้งานอยู่

SecretRefs จะถูกตรวจสอบความถูกต้องเฉพาะบนพื้นผิวที่มีผลใช้งานจริงเท่านั้น

- พื้นผิวที่เปิดใช้งาน: ref ที่แก้ค่าไม่ได้จะบล็อกการเริ่มต้น/โหลดซ้ำ
- พื้นผิวที่ไม่ใช้งาน: ref ที่แก้ค่าไม่ได้จะไม่บล็อกการเริ่มต้น/โหลดซ้ำ
- ref ที่ไม่ใช้งานจะปล่อยการวินิจฉัยแบบไม่ร้ายแรงพร้อมโค้ด `SECRETS_REF_IGNORED_INACTIVE_SURFACE`

<AccordionGroup>
  <Accordion title="ตัวอย่างพื้นผิวที่ไม่ใช้งาน">
    - รายการช่องทาง/บัญชีที่ปิดใช้งาน
    - ข้อมูลประจำตัวช่องทางระดับบนสุดที่ไม่มีบัญชีที่เปิดใช้งานรับสืบทอด
    - พื้นผิวเครื่องมือ/ฟีเจอร์ที่ปิดใช้งาน
    - คีย์เฉพาะผู้ให้บริการเว็บเสิร์ชที่ไม่ได้ถูกเลือกโดย `tools.web.search.provider` ในโหมด auto (ไม่ได้ตั้งผู้ให้บริการ) คีย์จะถูกตรวจตามลำดับความสำคัญเพื่อการตรวจจับผู้ให้บริการอัตโนมัติจนกว่าจะมีรายการหนึ่งแก้ค่าได้ หลังเลือกแล้ว คีย์ของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ใช้งานจนกว่าจะถูกเลือก
    - วัสดุยืนยันตัวตน SSH ของแซนด์บ็อกซ์ (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` รวมถึงการแทนที่รายเอเจนต์) จะใช้งานอยู่เฉพาะเมื่อแบ็กเอนด์แซนด์บ็อกซ์ที่มีผลเป็น `ssh` สำหรับเอเจนต์เริ่มต้นหรือเอเจนต์ที่เปิดใช้งาน
    - SecretRefs ของ `gateway.remote.token` / `gateway.remote.password` จะใช้งานอยู่หากข้อใดข้อหนึ่งต่อไปนี้เป็นจริง:
      - `gateway.mode=remote`
      - มีการกำหนดค่า `gateway.remote.url`
      - `gateway.tailscale.mode` เป็น `serve` หรือ `funnel`
      - ในโหมด local ที่ไม่มีพื้นผิว remote เหล่านั้น:
        - `gateway.remote.token` จะใช้งานอยู่เมื่อการยืนยันตัวตนด้วยโทเคนสามารถชนะได้และไม่มีการกำหนดค่าโทเคน env/auth
        - `gateway.remote.password` จะใช้งานอยู่เฉพาะเมื่อการยืนยันตัวตนด้วยรหัสผ่านสามารถชนะได้และไม่มีการกำหนดค่ารหัสผ่าน env/auth
    - SecretRef ของ `gateway.auth.token` จะไม่ใช้งานสำหรับการแก้ค่าการยืนยันตัวตนตอนเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN` เพราะอินพุตโทเคน env ชนะสำหรับรันไทม์นั้น

  </Accordion>
</AccordionGroup>

## การวินิจฉัยพื้นผิวการยืนยันตัวตนของ Gateway

เมื่อกำหนดค่า SecretRef บน `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` หรือ `gateway.remote.password` การเริ่มต้น/โหลดซ้ำของ Gateway จะบันทึกสถานะพื้นผิวอย่างชัดเจน:

- `active`: SecretRef เป็นส่วนหนึ่งของพื้นผิวการยืนยันตัวตนที่มีผล และต้องแก้ค่าได้
- `inactive`: SecretRef ถูกละเว้นสำหรับรันไทม์นี้เพราะพื้นผิวการยืนยันตัวตนอื่นชนะ หรือเพราะการยืนยันตัวตน remote ถูกปิดใช้งาน/ไม่ได้ใช้งาน

รายการเหล่านี้ถูกบันทึกด้วย `SECRETS_GATEWAY_AUTH_SURFACE` และมีเหตุผลที่นโยบายพื้นผิวที่ใช้งานใช้อยู่ เพื่อให้คุณเห็นได้ว่าทำไมข้อมูลประจำตัวจึงถูกถือว่าใช้งานอยู่หรือไม่ใช้งาน

## การตรวจล่วงหน้าของข้อมูลอ้างอิงระหว่างออนบอร์ด

เมื่อการออนบอร์ดทำงานในโหมดโต้ตอบและคุณเลือกพื้นที่จัดเก็บ SecretRef OpenClaw จะตรวจสอบล่วงหน้าก่อนบันทึก:

- Env refs: ตรวจสอบชื่อ env var และยืนยันว่าค่าที่ไม่ว่างมองเห็นได้ระหว่างการตั้งค่า
- Provider refs (`file` หรือ `exec`): ตรวจสอบการเลือกผู้ให้บริการ แก้ค่า `id` และตรวจชนิดของค่าที่แก้ได้
- เส้นทางการใช้ Quickstart ซ้ำ: เมื่อ `gateway.auth.token` เป็น SecretRef อยู่แล้ว การออนบอร์ดจะแก้ค่าก่อนเริ่ม probe/dashboard bootstrap (สำหรับ ref แบบ `env`, `file` และ `exec`) โดยใช้ด่านล้มเหลวเร็วแบบเดียวกัน

หากการตรวจสอบล้มเหลว การออนบอร์ดจะแสดงข้อผิดพลาดและให้คุณลองใหม่

## สัญญา SecretRef

ใช้รูปทรงออบเจ็กต์เดียวกันทุกที่:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    ฟิลด์ SecretInput ที่รองรับยังยอมรับชอร์ตแฮนด์สตริงแบบตรงตัวด้วย:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    การตรวจสอบความถูกต้อง:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องตรงกับ `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    การตรวจสอบความถูกต้อง:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องเป็น JSON pointer แบบสัมบูรณ์ (`/...`)
    - การ escape แบบ RFC6901 ในเซกเมนต์: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    การตรวจสอบความถูกต้อง:

    - `provider` ต้องตรงกับ `^[a-z][a-z0-9_-]{0,63}$`
    - `id` ต้องตรงกับ `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับ selector เช่น `secret#json_key`)
    - `id` ต้องไม่มี `.` หรือ `..` เป็นเซกเมนต์พาธที่คั่นด้วยเครื่องหมายทับ (เช่น `a/../b` จะถูกปฏิเสธ)

  </Tab>
</Tabs>

## คอนฟิกผู้ให้บริการ

กำหนดผู้ให้บริการใต้ `secrets.providers`:

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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
  <Accordion title="ผู้ให้บริการ Env">
    - allowlist แบบเลือกได้ผ่าน `allowlist`
    - ค่า env ที่หายไป/ว่างทำให้การแก้ค่าล้มเหลว

  </Accordion>
  <Accordion title="ผู้ให้บริการ File">
    - อ่านไฟล์ในเครื่องจาก `path`
    - `mode: "json"` คาดหวัง payload ออบเจ็กต์ JSON และแก้ค่า `id` เป็น pointer
    - `mode: "singleValue"` คาดหวัง ref id `"value"` และคืนค่าเนื้อหาไฟล์
    - พาธต้องผ่านการตรวจสอบความเป็นเจ้าของ/สิทธิ์
    - หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับพาธได้ การแก้ค่าจะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บนผู้ให้บริการนั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

  </Accordion>
  <Accordion title="ผู้ให้บริการ Exec">
    - เรียกใช้พาธไบนารีแบบสัมบูรณ์ที่กำหนดค่าไว้ โดยไม่มีเชลล์
    - ตามค่าเริ่มต้น `command` ต้องชี้ไปยังไฟล์ปกติ (ไม่ใช่ symlink)
    - ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธคำสั่งที่เป็น symlink (เช่น Homebrew shims) OpenClaw จะตรวจสอบพาธเป้าหมายที่แก้ได้
    - จับคู่ `allowSymlinkCommand` กับ `trustedDirs` สำหรับพาธของตัวจัดการแพ็กเกจ (เช่น `["/opt/homebrew"]`)
    - รองรับ timeout, no-output timeout, ขีดจำกัดไบต์เอาต์พุต, env allowlist และไดเรกทอรีที่เชื่อถือได้
    - หมายเหตุ fail-closed บน Windows: หากไม่สามารถตรวจสอบ ACL สำหรับพาธคำสั่งได้ การแก้ค่าจะล้มเหลว สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บนผู้ให้บริการนั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ
    - ผู้ให้บริการ exec ที่ Plugin จัดการสามารถใช้ `pluginIntegration` แทน
      `command`/`args` ที่คัดลอกไว้ OpenClaw จะแก้รายละเอียดคำสั่งปัจจุบัน
      จาก manifest ของ Plugin ที่ติดตั้งระหว่างการเริ่มต้น/โหลดซ้ำ หาก Plugin
      ถูกปิดใช้งาน ถูกลบ ไม่ได้รับความไว้วางใจ หรือไม่ประกาศ integration นั้นอีกต่อไป
      SecretRefs ที่ใช้งานอยู่ซึ่งใช้ผู้ให้บริการนั้นจะล้มเหลวแบบปิด

    Request payload (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Response payload (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    ข้อผิดพลาดแบบเลือกได้ต่อ id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## API keys ที่สำรองด้วยไฟล์

อย่าใส่สตริง `file:...` ในบล็อก `env` ของคอนฟิก บล็อก `env` เป็น
ค่าตรงตัวและไม่แทนที่ ดังนั้น `file:...` จะไม่ถูกแก้ค่า

ให้ใช้ SecretRef แบบไฟล์บนฟิลด์ข้อมูลประจำตัวที่รองรับแทน:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

สำหรับ `mode: "singleValue"` ค่า `id` ของ SecretRef คือ `"value"` สำหรับ
`mode: "json"` ให้ใช้ JSON pointer แบบสัมบูรณ์ เช่น
`"/providers/xai/apiKey"`

ดู [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface) สำหรับ
ฟิลด์คอนฟิกที่ยอมรับ SecretRefs

## ตัวอย่าง integration ของ Exec

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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    ใช้ตัวห่อ resolver เมื่อคุณต้องการให้ id ของ SecretRef แมปไปยังคีย์รายการของ Bitwarden
    Secrets Manager รีโพซิทอรีมี
    `scripts/secrets/openclaw-bws-resolver.mjs`; ติดตั้งหรือคัดลอกไปยังพาธแบบสัมบูรณ์
    ที่เชื่อถือได้บนโฮสต์ที่รัน Gateway

    ข้อกำหนด:

    - ติดตั้ง Bitwarden Secrets Manager CLI (`bws`) บนโฮสต์ Gateway
    - `BWS_ACCESS_TOKEN` พร้อมใช้งานสำหรับบริการ Gateway
    - ส่ง `PATH` ไปยัง resolver หรือกำหนด `BWS_BIN` เป็นพาธไบนารี `bws`
      แบบสัมบูรณ์
    - ต้องกำหนด `BWS_SERVER_URL` ในสภาพแวดล้อมเมื่อใช้อินสแตนซ์ Bitwarden
      ที่โฮสต์เอง

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    resolver จะจัดกลุ่ม id ที่ร้องขอ รัน `bws secret list` และส่งคืน
    ค่าสำหรับฟิลด์ `key` ของ secret ที่ตรงกัน ใช้คีย์ที่เป็นไปตามสัญญา id ของ exec
    SecretRef เช่น `openclaw/providers/openai/apiKey`; คีย์แบบ env-var
    ที่มีขีดล่างจะถูกปฏิเสธก่อน resolver จะรัน หากมี secret ของ Bitwarden
    ที่มองเห็นได้มากกว่าหนึ่งรายการที่มีคีย์ที่ร้องขอเดียวกัน resolver
    จะทำให้ id นั้นล้มเหลวว่าไม่ชัดเจนแทนที่จะเลือกหนึ่งรายการ หลังอัปเดต config แล้ว
    ให้ตรวจสอบพาธ resolver:

    ```bash
    openclaw secrets audit --allow-exec
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
  <Accordion title="password-store (`pass`)">
    ใช้ตัวห่อ resolver ขนาดเล็กเมื่อคุณต้องการให้ id ของ SecretRef แมปโดยตรงไปยัง
    รายการ `pass` บันทึกสิ่งนี้เป็นไฟล์ปฏิบัติการในพาธแบบสัมบูรณ์ที่ผ่าน
    การตรวจสอบพาธ exec-provider ของคุณ เช่น
    `/usr/local/bin/openclaw-pass-resolver` shebang `#!/usr/bin/env node`
    จะแก้ `node` จาก `PATH` ของกระบวนการ resolver ดังนั้นให้รวม `PATH` ใน
    `passEnv` หาก `pass` ไม่ได้อยู่ใน `PATH` นั้น ให้กำหนด `PASS_BIN` ในสภาพแวดล้อมหลัก
    และรวมไว้ใน `passEnv` ด้วย:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    จากนั้นกำหนดค่า exec provider และชี้ `apiKey` ไปยังพาธรายการ `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    เก็บ secret ไว้ที่บรรทัดแรกของรายการ `pass` หรือปรับแต่ง
    wrapper หากคุณต้องการส่งคืนเอาต์พุต `pass show` ทั้งหมดแทน หลังอัปเดต
    config แล้ว ให้ตรวจสอบทั้ง audit แบบคงที่และพาธ exec resolver:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

env vars ของเซิร์ฟเวอร์ MCP ที่กำหนดค่าผ่าน `plugins.entries.acpx.config.mcpServers` รองรับ SecretInput สิ่งนี้ช่วยเก็บ API key และ token ไม่ให้อยู่ใน config แบบข้อความธรรมดา:

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

ค่าสตริงแบบข้อความธรรมดายังคงใช้งานได้ ref แบบ env-template เช่น `${MCP_SERVER_API_KEY}` และอ็อบเจ็กต์ SecretRef จะถูกแก้ระหว่างการเปิดใช้งาน gateway ก่อนสร้างกระบวนการเซิร์ฟเวอร์ MCP เช่นเดียวกับพื้นผิว SecretRef อื่น ๆ ref ที่แก้ไม่ได้จะบล็อกการเปิดใช้งานเฉพาะเมื่อ Plugin `acpx` ทำงานจริง

## วัสดุการยืนยันตัวตน SSH ของ sandbox

แบ็กเอนด์ sandbox `ssh` หลักยังรองรับ SecretRefs สำหรับวัสดุการยืนยันตัวตน SSH:

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

พฤติกรรม runtime:

- OpenClaw แก้ ref เหล่านี้ระหว่างการเปิดใช้งาน sandbox ไม่ใช่แบบ lazy ระหว่างการเรียก SSH แต่ละครั้ง
- ค่าที่แก้แล้วจะถูกเขียนไปยังไฟล์ชั่วคราวพร้อมสิทธิ์แบบจำกัด และใช้ใน config SSH ที่สร้างขึ้น
- หากแบ็กเอนด์ sandbox ที่มีผลไม่ใช่ `ssh` ref เหล่านี้จะยังไม่ทำงานและไม่บล็อกการเริ่มต้น

## พื้นผิวข้อมูลประจำตัวที่รองรับ

ข้อมูลประจำตัวที่รองรับและไม่รองรับแบบ canonical แสดงอยู่ใน:

- [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)

<Note>
ข้อมูลประจำตัวที่ runtime mint หรือหมุนเวียน และวัสดุ refresh ของ OAuth ถูกแยกออกจากการแก้ SecretRef แบบอ่านอย่างเดียวโดยเจตนา
</Note>

## พฤติกรรมที่จำเป็นและลำดับความสำคัญ

- ฟิลด์ที่ไม่มี ref: ไม่เปลี่ยนแปลง
- ฟิลด์ที่มี ref: จำเป็นบนพื้นผิวที่ทำงานอยู่ระหว่างการเปิดใช้งาน
- หากมีทั้งข้อความธรรมดาและ ref อยู่ ref จะมีความสำคัญก่อนบนพาธลำดับความสำคัญที่รองรับ
- sentinel การปกปิด `__OPENCLAW_REDACTED__` ถูกสงวนไว้สำหรับการปกปิด/คืนค่า config ภายใน และจะถูกปฏิเสธหากส่งเป็นข้อมูล config แบบ literal

สัญญาณเตือนและ audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (คำเตือน runtime)
- `REF_SHADOWED` (ผลการตรวจพบ audit เมื่อข้อมูลประจำตัว `auth-profiles.json` มีความสำคัญเหนือกว่า ref ของ `openclaw.json`)

พฤติกรรมความเข้ากันได้ของ Google Chat:

- `serviceAccountRef` มีความสำคัญเหนือกว่า `serviceAccount` แบบข้อความธรรมดา
- ค่าข้อความธรรมดาจะถูกละเว้นเมื่อตั้งค่า ref ข้างเคียง

## ทริกเกอร์การเปิดใช้งาน

การเปิดใช้งาน secret ทำงานเมื่อ:

- เริ่มต้น (preflight รวมถึงการเปิดใช้งานสุดท้าย)
- พาธ hot-apply ของการ reload config
- พาธ restart-check ของการ reload config
- reload ด้วยตนเองผ่าน `secrets.reload`
- preflight ของ Gateway config write RPC (`config.set` / `config.apply` / `config.patch`) สำหรับการแก้ SecretRef บน active-surface ภายใน payload config ที่ส่งมาก่อนบันทึกการแก้ไข

สัญญาการเปิดใช้งาน:

- สำเร็จแล้วจะสลับ snapshot แบบ atomic
- ความล้มเหลวตอนเริ่มต้นจะยกเลิกการเริ่มต้น gateway
- ความล้มเหลวของ runtime reload จะคง snapshot last-known-good ไว้
- ความล้มเหลวของ write-RPC preflight จะปฏิเสธ config ที่ส่งมา และคงทั้ง config บนดิสก์และ snapshot runtime ที่ทำงานอยู่ไว้โดยไม่เปลี่ยนแปลง
- การให้ channel token แบบ per-call ที่ชัดเจนแก่การเรียก outbound helper/tool จะไม่ทริกเกอร์การเปิดใช้งาน SecretRef; จุดเปิดใช้งานยังคงเป็นการเริ่มต้น การ reload และ `secrets.reload` ที่ชัดเจน

## สัญญาณ degraded และ recovered

เมื่อการเปิดใช้งานระหว่าง reload ล้มเหลวหลังจากสถานะปกติ OpenClaw จะเข้าสู่สถานะ secrets แบบ degraded

อีเวนต์ระบบแบบครั้งเดียวและรหัส log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

พฤติกรรม:

- Degraded: runtime คง snapshot last-known-good ไว้
- Recovered: ส่งออกหนึ่งครั้งหลังการเปิดใช้งานครั้งถัดไปสำเร็จ
- ความล้มเหลวซ้ำขณะ degraded อยู่แล้วจะ log คำเตือนแต่ไม่ส่งอีเวนต์ซ้ำ
- Startup fail-fast จะไม่ส่งอีเวนต์ degraded เพราะ runtime ยังไม่เคยทำงาน

## การแก้พาธคำสั่ง

พาธคำสั่งสามารถเลือกใช้การแก้ SecretRef ที่รองรับผ่าน gateway snapshot RPC ได้

มีพฤติกรรมกว้าง ๆ สองแบบ:

<Tabs>
  <Tab title="พาธคำสั่งแบบเข้มงวด">
    ตัวอย่างเช่น พาธหน่วยความจำระยะไกลของ `openclaw memory` และ `openclaw qr --remote` เมื่อจำเป็นต้องใช้การอ้างอิง shared-secret ระยะไกล คำสั่งเหล่านี้อ่านจากสแนปช็อตที่ใช้งานอยู่และล้มเหลวทันทีเมื่อ SecretRef ที่จำเป็นไม่พร้อมใช้งาน
  </Tab>
  <Tab title="พาธคำสั่งแบบอ่านอย่างเดียว">
    ตัวอย่างเช่น `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` และโฟลว์ซ่อมแซม doctor/config แบบอ่านอย่างเดียว คำสั่งเหล่านี้ยังให้ความสำคัญกับสแนปช็อตที่ใช้งานอยู่ แต่จะลดระดับการทำงานแทนการยกเลิกเมื่อ SecretRef เป้าหมายไม่พร้อมใช้งานในพาธคำสั่งนั้น

    พฤติกรรมแบบอ่านอย่างเดียว:

    - เมื่อ Gateway กำลังทำงาน คำสั่งเหล่านี้จะอ่านจากสแนปช็อตที่ใช้งานอยู่ก่อน
    - หากการ resolve ผ่าน Gateway ไม่สมบูรณ์หรือ Gateway ไม่พร้อมใช้งาน คำสั่งจะพยายามใช้ fallback ภายในเครื่องแบบเจาะจงสำหรับพื้นผิวคำสั่งนั้น
    - หาก SecretRef เป้าหมายยังคงไม่พร้อมใช้งาน คำสั่งจะดำเนินต่อด้วยเอาต์พุตแบบอ่านอย่างเดียวที่ลดระดับแล้ว พร้อมการวินิจฉัยอย่างชัดเจน เช่น "กำหนดค่าไว้แล้วแต่ไม่พร้อมใช้งานในพาธคำสั่งนี้"
    - พฤติกรรมที่ลดระดับนี้มีผลเฉพาะภายในคำสั่งเท่านั้น ไม่ได้ทำให้พาธ runtime startup, reload หรือ send/auth อ่อนลง

  </Tab>
</Tabs>

หมายเหตุอื่น:

- การรีเฟรชสแนปช็อตหลังการหมุนเวียน secret ฝั่ง backend จัดการโดย `openclaw secrets reload`
- เมธอด Gateway RPC ที่พาธคำสั่งเหล่านี้ใช้: `secrets.resolve`

## เวิร์กโฟลว์การตรวจสอบและกำหนดค่า

โฟลว์เริ่มต้นสำหรับผู้ปฏิบัติการ:

<Steps>
  <Step title="ตรวจสอบสถานะปัจจุบัน">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="กำหนดค่าและใช้ SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="ตรวจสอบซ้ำ">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

อย่าถือว่าการย้ายข้อมูลเสร็จสมบูรณ์จนกว่าการตรวจสอบซ้ำจะสะอาด หากการตรวจสอบ
ยังรายงานค่าข้อความธรรมดาที่พักอยู่ ความเสี่ยงจากการเข้าถึงของเอเจนต์ยังคงมีอยู่
แม้ว่า runtime APIs จะคืนค่าที่ถูกปกปิดแล้วก็ตาม

หากคุณบันทึกแผนแทนการนำไปใช้ระหว่าง `configure` ให้นำแผนที่บันทึกไว้นั้นไปใช้
ด้วย `openclaw secrets apply --from <plan-path>` ก่อนการตรวจสอบซ้ำ

<AccordionGroup>
  <Accordion title="secrets audit">
    ผลการตรวจพบประกอบด้วย:

    - ค่าข้อความธรรมดาที่พักอยู่ (`openclaw.json`, `auth-profiles.json`, `.env` และ `agents/*/agent/models.json` ที่สร้างขึ้น)
    - เศษส่วน header ของผู้ให้บริการที่มีความอ่อนไหวในรูปแบบข้อความธรรมดาในรายการ `models.json` ที่สร้างขึ้น
    - refs ที่ resolve ไม่ได้
    - การบดบังตามลำดับความสำคัญ (`auth-profiles.json` มีลำดับความสำคัญเหนือ refs ใน `openclaw.json`)
    - เศษส่วน legacy (`auth.json`, การแจ้งเตือน OAuth)

    หมายเหตุ Exec:

    - โดยค่าเริ่มต้น การตรวจสอบจะข้ามการตรวจ SecretRef resolvability แบบ exec เพื่อหลีกเลี่ยงผลข้างเคียงของคำสั่ง
    - ใช้ `openclaw secrets audit --allow-exec` เพื่อเรียกใช้ผู้ให้บริการ exec ระหว่างการตรวจสอบ

    หมายเหตุเกี่ยวกับเศษส่วน header:

    - การตรวจจับ header ของผู้ให้บริการที่มีความอ่อนไหวอิง heuristic จากชื่อ (ชื่อและส่วนย่อยของ header การยืนยันตัวตน/ข้อมูลประจำตัวที่พบบ่อย เช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

  </Accordion>
  <Accordion title="secrets configure">
    ตัวช่วยแบบโต้ตอบที่:

    - กำหนดค่า `secrets.providers` ก่อน (`env`/`file`/`exec`, เพิ่ม/แก้ไข/ลบ)
    - ให้คุณเลือกฟิลด์ที่รองรับและมี secret ใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับขอบเขตเอเจนต์หนึ่งรายการ
    - สามารถสร้างการแมป `auth-profiles.json` ใหม่ได้โดยตรงในตัวเลือกเป้าหมาย
    - เก็บรายละเอียด SecretRef (`source`, `provider`, `id`)
    - เรียกใช้การ resolve แบบ preflight
    - สามารถนำไปใช้ทันที

    หมายเหตุ Exec:

    - Preflight จะข้ามการตรวจ SecretRef แบบ exec เว้นแต่จะตั้งค่า `--allow-exec`
    - หากคุณนำไปใช้โดยตรงจาก `configure --apply` และแผนมี refs/providers แบบ exec ให้ตั้งค่า `--allow-exec` ไว้สำหรับขั้นตอน apply ด้วย

    โหมดที่มีประโยชน์:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    ค่าเริ่มต้นของ apply ใน `configure`:

    - ล้างข้อมูลประจำตัวแบบ static ที่ตรงกันจาก `auth-profiles.json` สำหรับผู้ให้บริการเป้าหมาย
    - ล้างรายการ `api_key` แบบ static legacy จาก `auth.json`
    - ล้างบรรทัด secret ที่รู้จักและตรงกันจาก `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    นำแผนที่บันทึกไว้ไปใช้:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    หมายเหตุ Exec:

    - dry-run จะข้ามการตรวจ exec เว้นแต่จะตั้งค่า `--allow-exec`
    - โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRefs/providers เว้นแต่จะตั้งค่า `--allow-exec`

    สำหรับรายละเอียดสัญญา target/path แบบเข้มงวดและกฎการปฏิเสธที่แน่นอน โปรดดู [สัญญาแผน Secrets Apply](/th/gateway/secrets-plan-contract)

  </Accordion>
</AccordionGroup>

## นโยบายความปลอดภัยทางเดียว

<Warning>
OpenClaw ตั้งใจไม่เขียนข้อมูลสำรองสำหรับ rollback ที่มีค่า secret ข้อความธรรมดาในอดีต
</Warning>

โมเดลความปลอดภัย:

- preflight ต้องสำเร็จก่อนโหมดเขียน
- การเปิดใช้งาน runtime จะได้รับการตรวจสอบความถูกต้องก่อน commit
- apply อัปเดตไฟล์โดยใช้การแทนที่ไฟล์แบบ atomic และพยายาม restore เมื่อเกิดความล้มเหลวอย่างดีที่สุด

## หมายเหตุความเข้ากันได้ของการยืนยันตัวตน legacy

สำหรับข้อมูลประจำตัวแบบ static นั้น runtime ไม่ต้องพึ่งพาที่เก็บการยืนยันตัวตน legacy แบบข้อความธรรมดาอีกต่อไป

- แหล่งข้อมูลประจำตัวของ runtime คือสแนปช็อตในหน่วยความจำที่ resolve แล้ว
- รายการ `api_key` แบบ static legacy จะถูกล้างเมื่อค้นพบ
- พฤติกรรมความเข้ากันได้ที่เกี่ยวข้องกับ OAuth ยังคงแยกต่างหาก

## หมายเหตุ Web UI

ยูเนียน SecretInput บางรายการกำหนดค่าในโหมดตัวแก้ไขแบบ raw ได้ง่ายกว่าในโหมดฟอร์ม

## ที่เกี่ยวข้อง

- [การยืนยันตัวตน](/th/gateway/authentication) — การตั้งค่าการยืนยันตัวตน
- [CLI: secrets](/th/cli/secrets) — คำสั่ง CLI
- [ตัวแปรสภาพแวดล้อม](/th/help/environment) — ลำดับความสำคัญของสภาพแวดล้อม
- [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface) — พื้นผิวข้อมูลประจำตัว
- [สัญญาแผน Secrets Apply](/th/gateway/secrets-plan-contract) — รายละเอียดสัญญาแผน
- [ความปลอดภัย](/th/gateway/security) — แนวทางความปลอดภัย
