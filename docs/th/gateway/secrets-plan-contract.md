---
read_when:
    - การสร้างหรือตรวจสอบแผน `openclaw secrets apply`
    - การแก้ไขข้อผิดพลาด `Invalid plan target path`
    - ทำความเข้าใจลักษณะการทำงานของการตรวจสอบชนิดและพาธเป้าหมาย
summary: 'สัญญาสำหรับแผน `secrets apply`: การตรวจสอบความถูกต้องของเป้าหมาย การจับคู่พาธ และขอบเขตเป้าหมาย `auth-profiles.json`'
title: สัญญาของแผนการนำข้อมูลลับไปใช้
x-i18n:
    generated_at: "2026-07-12T16:09:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

หน้านี้กำหนดสัญญาที่เข้มงวดซึ่งบังคับใช้โดย `openclaw secrets apply` หากเป้าหมายไม่ตรงตามกฎเหล่านี้ การนำไปใช้จะล้มเหลวก่อนแก้ไขไฟล์ใด ๆ

## รูปแบบไฟล์แผน

`openclaw secrets apply --from <plan.json>` ต้องการอาร์เรย์ `targets` ที่ประกอบด้วยเป้าหมายของแผน:

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

`openclaw secrets configure` สร้างแผนในรูปแบบนี้ คุณสามารถเขียนหรือแก้ไขแผนด้วยตนเองได้เช่นกัน

## การเพิ่มหรืออัปเดตและการลบผู้ให้บริการ

แผนอาจมีฟิลด์ระดับบนสุดที่ไม่บังคับสองฟิลด์ ซึ่งแก้ไขแมป `secrets.providers` ควบคู่กับการเขียนแต่ละเป้าหมาย:

- `providerUpserts` -- ออบเจ็กต์ที่ใช้ชื่อแฝงของผู้ให้บริการเป็นคีย์ แต่ละค่าคือคำจำกัดความของผู้ให้บริการ (มีรูปแบบเดียวกับที่ยอมรับภายใต้ `secrets.providers.<alias>` ใน `openclaw.json` เช่น ผู้ให้บริการ `exec` หรือ `file`)
- `providerDeletes` -- อาร์เรย์ของชื่อแฝงผู้ให้บริการที่จะลบ

`providerUpserts` ทำงานก่อน `targets` ดังนั้น `target.ref.provider` จึงสามารถอ้างอิงชื่อแฝงผู้ให้บริการที่แผนเดียวกันเพิ่มผ่าน `providerUpserts` ได้ หากไม่มีลำดับนี้ แผนที่อ้างอิงชื่อแฝงซึ่งยังไม่ได้กำหนดค่าใน `openclaw.json` จะล้มเหลวพร้อมข้อความ `provider "<alias>" is not configured`

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

ผู้ให้บริการ Exec ที่เพิ่มผ่าน `providerUpserts` ยังคงอยู่ภายใต้กฎการยินยอมให้ใช้ exec ใน [พฤติกรรมการยินยอมสำหรับผู้ให้บริการ Exec](#exec-provider-consent-behavior): แผนที่มีผู้ให้บริการ exec ต้องระบุ `--allow-exec` ในโหมดเขียน

## ขอบเขตเป้าหมายที่รองรับ

เป้าหมายของแผนได้รับการยอมรับสำหรับพาธข้อมูลรับรองที่รองรับใน [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)

## พฤติกรรมของชนิดเป้าหมาย

`target.type` ต้องเป็นชนิดเป้าหมายที่รู้จัก และ `target.path` ที่ปรับให้อยู่ในรูปแบบมาตรฐานต้องตรงกับรูปแบบพาธที่ลงทะเบียนไว้สำหรับชนิดนั้น

ชนิดเป้าหมายบางชนิดยอมรับชื่อแฝงเพื่อความเข้ากันได้เป็น `target.type` สำหรับแผนที่มีอยู่ นอกเหนือจากชื่อชนิดมาตรฐาน:

| ชนิดมาตรฐาน                         | ชื่อแฝงที่ยอมรับ                                |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## กฎการตรวจสอบพาธ

แต่ละเป้าหมายจะได้รับการตรวจสอบตามเงื่อนไขทั้งหมดต่อไปนี้:

- `type` ต้องเป็นชนิดเป้าหมายที่รู้จัก
- `path` ต้องเป็นพาธแบบจุดที่ไม่ว่างเปล่า
- สามารถละ `pathSegments` ได้ หากระบุไว้ เมื่อปรับให้อยู่ในรูปแบบมาตรฐานแล้วต้องได้พาธเดียวกับ `path` ทุกประการ
- เซกเมนต์ต้องห้ามจะถูกปฏิเสธ ได้แก่ `__proto__`, `prototype`, `constructor`
- พาธที่ปรับให้อยู่ในรูปแบบมาตรฐานต้องตรงกับรูปแบบพาธที่ลงทะเบียนไว้สำหรับชนิดเป้าหมาย
- หากกำหนด `providerId` หรือ `accountId` ค่าดังกล่าวต้องตรงกับรหัสที่เข้ารหัสอยู่ในพาธ
- เป้าหมายใน `auth-profiles.json` ต้องมี `agentId`
- เมื่อสร้างการแมปใหม่ใน `auth-profiles.json` ให้ระบุ `authProfileProvider`

## พฤติกรรมเมื่อล้มเหลว

หากเป้าหมายไม่ผ่านการตรวจสอบ การนำไปใช้จะจบการทำงานพร้อมข้อผิดพลาดลักษณะนี้:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

แผนที่ไม่ถูกต้องจะไม่มีการยืนยันการเขียนใด ๆ โดยการแก้ไขเป้าหมายและการตรวจสอบพาธจะทำงานก่อนแตะต้องไฟล์ใด ๆ นอกจากนี้ เมื่อแผนที่ถูกต้องเริ่มเขียน การนำไปใช้จะสร้างสแนปช็อตของทุกไฟล์ที่จะแก้ไขไว้ก่อน และกู้คืนสแนปช็อตเหล่านั้นหากการเขียนในภายหลังระหว่างการทำงานครั้งเดียวกันล้มเหลว ดังนั้นการเขียนเพียงบางส่วนจะไม่ทำให้สถานะการกำหนดค่า โปรไฟล์การยืนยันตัวตน หรือสภาพแวดล้อมไม่สอดคล้องกัน

## พฤติกรรมการยินยอมสำหรับผู้ให้บริการ Exec

- โดยค่าเริ่มต้น `--dry-run` จะข้ามการตรวจสอบ SecretRef แบบ exec
- แผนที่มี SecretRef/ผู้ให้บริการแบบ exec จะถูกปฏิเสธในโหมดเขียน เว้นแต่จะกำหนด `--allow-exec`
- เมื่อตรวจสอบหรือนำแผนที่มี exec ไปใช้ ให้ส่ง `--allow-exec` ทั้งในคำสั่งทดลองทำงานและคำสั่งเขียน

## หมายเหตุเกี่ยวกับขอบเขตการทำงานขณะรันและการตรวจสอบ

- รายการใน `auth-profiles.json` ที่มีเฉพาะการอ้างอิง (`keyRef`/`tokenRef`) จะรวมอยู่ในการแก้ไขข้อมูลรับรองขณะรันและความครอบคลุมของการตรวจสอบ
- `secrets apply` เขียนเป้าหมาย `openclaw.json` ที่รองรับ เป้าหมาย `auth-profiles.json` ที่รองรับ และขั้นตอนล้างข้อมูลที่ไม่บังคับสามขั้นตอนซึ่งเปิดใช้ทั้งหมดโดยค่าเริ่มต้น ได้แก่ `scrubEnv` (ลบค่าข้อความธรรมดาที่โยกย้ายแล้วออกจาก `.env`), `scrubAuthProfilesForProviderTargets` (ล้างข้อความธรรมดาและข้อมูลอ้างอิงที่ไม่ได้ใช้ซึ่งตกค้างใน `auth-profiles.json` สำหรับผู้ให้บริการที่แผนเพิ่งโยกย้าย) และ `scrubLegacyAuthJson` (ลบรายการ `api_key` ที่โยกย้ายแล้วออกจากแหล่งจัดเก็บ `auth.json` แบบเดิม) กำหนด `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` หรือ `options.scrubLegacyAuthJson` เป็น `false` ในแผนเพื่อข้ามขั้นตอนนั้น

## การตรวจสอบสำหรับผู้ปฏิบัติงาน

```bash
# ตรวจสอบแผนโดยไม่เขียนข้อมูล
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# จากนั้นนำไปใช้จริง
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# สำหรับแผนที่มี exec ให้เลือกอนุญาตอย่างชัดเจนในทั้งสองโหมด
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

หากการนำไปใช้ล้มเหลวพร้อมข้อความพาธเป้าหมายไม่ถูกต้อง ให้สร้างแผนใหม่ด้วย `openclaw secrets configure` หรือแก้ไขพาธเป้าหมายให้เป็นรูปแบบที่รองรับข้างต้น

## เอกสารที่เกี่ยวข้อง

- [การจัดการข้อมูลลับ](/th/gateway/secrets)
- [CLI `secrets`](/th/cli/secrets)
- [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
