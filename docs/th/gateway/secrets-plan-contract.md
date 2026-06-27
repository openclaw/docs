---
read_when:
    - การสร้างหรือการตรวจสอบแผน `openclaw secrets apply`
    - การดีบักข้อผิดพลาด `Invalid plan target path`
    - การทำความเข้าใจประเภทเป้าหมายและพฤติกรรมการตรวจสอบความถูกต้องของพาธ
summary: 'ข้อตกลงสำหรับแผน `secrets apply`: การตรวจสอบเป้าหมาย การจับคู่เส้นทาง และขอบเขตเป้าหมาย `auth-profiles.json`'
title: สัญญาแผนการปรับใช้ข้อมูลลับ
x-i18n:
    generated_at: "2026-06-27T17:38:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

หน้านี้กำหนดสัญญาที่เข้มงวดซึ่ง `openclaw secrets apply` บังคับใช้

หาก target ไม่ตรงตามกฎเหล่านี้ apply จะล้มเหลวก่อนแก้ไข configuration

## รูปแบบไฟล์แผน

`openclaw secrets apply --from <plan.json>` คาดหวังอาร์เรย์ `targets` ของ plan targets:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## การ upsert และการลบผู้ให้บริการ

แผนอาจมีฟิลด์ระดับบนสุดแบบไม่บังคับอีกสองฟิลด์ที่แก้ไขแมป
`secrets.providers` ควบคู่กับการเขียนราย target:

- `providerUpserts` — อ็อบเจ็กต์ที่ใช้ alias ของผู้ให้บริการเป็นคีย์ แต่ละค่าคือ
  นิยามผู้ให้บริการ (รูปแบบเดียวกับที่ยอมรับภายใต้
  `secrets.providers.<alias>` ใน `openclaw.json` เช่น ผู้ให้บริการ `exec` หรือ `file`)
- `providerDeletes` — อาร์เรย์ของ alias ผู้ให้บริการที่จะลบ

`providerUpserts` ทำงานก่อน `targets` ดังนั้น `target.ref.provider` อาจ
อ้างอิง alias ผู้ให้บริการที่แผนเดียวกันเพิ่มเข้ามาใน
`providerUpserts` ได้ หากไม่มีสิ่งนี้ แผนที่อ้างอิง alias ที่ยังไม่ได้
กำหนดค่าใน `openclaw.json` จะล้มเหลวด้วย `provider "<alias>" is not
configured`

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

ผู้ให้บริการ exec ที่เพิ่มผ่าน `providerUpserts` ยังอยู่ภายใต้กฎการยินยอม exec
ใน [พฤติกรรมการยินยอมของผู้ให้บริการ Exec](#exec-provider-consent-behavior):
แผนที่มีผู้ให้บริการ exec ต้องใช้ `--allow-exec` ในโหมดเขียน

## ขอบเขต target ที่รองรับ

ยอมรับ plan targets สำหรับเส้นทางข้อมูลรับรองที่รองรับใน:

- [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)

## พฤติกรรมประเภท target

กฎทั่วไป:

- `target.type` ต้องเป็นที่รู้จักและต้องตรงกับรูปแบบ `target.path` ที่ normalize แล้ว

ยังคงยอมรับ alias เพื่อความเข้ากันได้สำหรับแผนที่มีอยู่:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## กฎการตรวจสอบ path

แต่ละ target จะถูกตรวจสอบด้วยกฎทั้งหมดต่อไปนี้:

- `type` ต้องเป็นประเภท target ที่รู้จัก
- `path` ต้องเป็น dot path ที่ไม่ว่าง
- `pathSegments` สามารถละได้ หากระบุ ต้อง normalize เป็น path เดียวกันทุกประการกับ `path`
- segment ต้องห้ามจะถูกปฏิเสธ: `__proto__`, `prototype`, `constructor`
- path ที่ normalize แล้วต้องตรงกับรูปแบบ path ที่ลงทะเบียนไว้สำหรับประเภท target
- หากตั้งค่า `providerId` หรือ `accountId` ไว้ ค่านั้นต้องตรงกับ id ที่เข้ารหัสใน path
- target ของ `auth-profiles.json` ต้องมี `agentId`
- เมื่อสร้าง mapping ใหม่ของ `auth-profiles.json` ให้รวม `authProfileProvider`

## พฤติกรรมเมื่อเกิดความล้มเหลว

หาก target ไม่ผ่านการตรวจสอบ apply จะออกด้วยข้อผิดพลาดเช่น:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

จะไม่มีการ commit การเขียนใดๆ สำหรับแผนที่ไม่ถูกต้อง

## พฤติกรรมการยินยอมของผู้ให้บริการ Exec

- `--dry-run` ข้ามการตรวจ SecretRef แบบ exec โดยค่าเริ่มต้น
- แผนที่มี exec SecretRefs/providers จะถูกปฏิเสธในโหมดเขียน เว้นแต่จะตั้งค่า `--allow-exec`
- เมื่อตรวจสอบ/ใช้แผนที่มี exec ให้ส่ง `--allow-exec` ทั้งในคำสั่ง dry-run และคำสั่งเขียน

## หมายเหตุขอบเขต runtime และ audit

- รายการ `auth-profiles.json` แบบอ้างอิงเท่านั้น (`keyRef`/`tokenRef`) รวมอยู่ในการ resolve runtime และการครอบคลุม audit
- `secrets apply` เขียน target ของ `openclaw.json` ที่รองรับ, target ของ `auth-profiles.json` ที่รองรับ และ scrub targets แบบไม่บังคับ

## การตรวจสอบสำหรับผู้ปฏิบัติการ

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

หาก apply ล้มเหลวพร้อมข้อความ path target ไม่ถูกต้อง ให้สร้างแผนใหม่ด้วย `openclaw secrets configure` หรือแก้ path target ให้เป็นรูปแบบที่รองรับข้างต้น

## เอกสารที่เกี่ยวข้อง

- [การจัดการ Secrets](/th/gateway/secrets)
- [CLI `secrets`](/th/cli/secrets)
- [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- [อ้างอิง Configuration](/th/gateway/configuration-reference)
