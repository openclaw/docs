---
read_when:
    - การสร้างหรือรีวิวแผน `openclaw secrets apply`
    - การดีบักข้อผิดพลาด `Invalid plan target path`
    - ทำความเข้าใจพฤติกรรมการตรวจสอบประเภทและพาธของเป้าหมาย
summary: 'ข้อกำหนดสำหรับแผน `secrets apply`: การตรวจสอบความถูกต้องของเป้าหมาย การจับคู่พาธ และขอบเขตเป้าหมาย `auth-profiles.json`'
title: สัญญาแผนการนำข้อมูลลับไปใช้
x-i18n:
    generated_at: "2026-07-19T07:27:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ee8afd958646930af4db3bbad08e033ff79da48890a989d72b361abcbda3bb
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

หน้านี้กำหนดสัญญาที่เข้มงวดซึ่งบังคับใช้โดย `openclaw secrets apply` หากเป้าหมายไม่ตรงตามกฎเหล่านี้ การนำไปใช้จะล้มเหลวก่อนแก้ไขไฟล์ใดๆ

## ข้อกำหนดของไฟล์แผน

`openclaw secrets apply --from <plan.json>` ยอมรับไฟล์ปกติที่มีขนาดไม่เกิน 16 MiB (16,777,216 bytes) ขีดจำกัดนี้ใช้กับไฟล์ที่ซีเรียลไลซ์แล้วทั้งไฟล์ รวมถึงช่องว่าง ไดเรกทอรี, FIFO, ไฟล์อุปกรณ์ และไฟล์ที่มีขนาดเกินขีดจำกัดจะถูกปฏิเสธก่อนการแยกวิเคราะห์ JSON หรือการตรวจสอบเป้าหมาย

`openclaw secrets configure --plan-out <plan.json>` บังคับใช้ขีดจำกัดเดียวกันกับเอาต์พุตที่ซีเรียลไลซ์เป็น UTF-8 ก่อนสร้างไฟล์ แผนที่เขียนด้วยตนเองและเครื่องมือสร้างแผนภายนอกต้องรักษาขนาดไฟล์ที่ซีเรียลไลซ์แล้วให้อยู่ภายในขอบเขตนี้ด้วย

## โครงสร้างไฟล์แผน

`openclaw secrets apply --from <plan.json>` ต้องการอาร์เรย์ `targets` ของเป้าหมายในแผน:

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

`openclaw secrets configure` สร้างแผนในโครงสร้างนี้ นอกจากนี้ยังสามารถเขียนหรือแก้ไขแผนด้วยตนเองได้

## การเพิ่มหรืออัปเดตและการลบผู้ให้บริการ

แผนอาจมีฟิลด์ระดับบนสุดที่ไม่บังคับสองฟิลด์ ซึ่งแก้ไขแมป `secrets.providers` ควบคู่ไปกับการเขียนแต่ละเป้าหมาย:

- `providerUpserts` -- ออบเจ็กต์ที่ใช้ชื่อแฝงของผู้ให้บริการเป็นคีย์ แต่ละค่าคือคำจำกัดความของผู้ให้บริการ (มีโครงสร้างเดียวกับที่ยอมรับภายใต้ `secrets.providers.<alias>` ใน `openclaw.json` เช่น ผู้ให้บริการ `exec` หรือ `file`)
- `providerDeletes` -- อาร์เรย์ของชื่อแฝงผู้ให้บริการที่จะลบ

`providerUpserts` ทำงานก่อน `targets` ดังนั้น `target.ref.provider` จึงสามารถอ้างอิงชื่อแฝงผู้ให้บริการที่แผนเดียวกันเพิ่มผ่าน `providerUpserts` ได้ หากไม่มีลำดับนี้ แผนที่อ้างอิงชื่อแฝงซึ่งยังไม่ได้กำหนดค่าใน `openclaw.json` จะล้มเหลวด้วย `provider "<alias>" is not configured`

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

ผู้ให้บริการ exec ที่เพิ่มผ่าน `providerUpserts` ยังคงอยู่ภายใต้กฎการยินยอมสำหรับ exec ใน [ลักษณะการยินยอมสำหรับผู้ให้บริการ Exec](#exec-provider-consent-behavior): แผนที่มีผู้ให้บริการ exec ต้องใช้ `--allow-exec` ในโหมดเขียน

## ขอบเขตเป้าหมายที่รองรับ

เป้าหมายในแผนได้รับการยอมรับสำหรับพาธข้อมูลประจำตัวที่รองรับใน [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)

## ลักษณะการทำงานของประเภทเป้าหมาย

`target.type` ต้องเป็นประเภทเป้าหมายที่รู้จัก และ `target.path` ที่ปรับให้อยู่ในรูปแบบมาตรฐานแล้วต้องตรงกับโครงสร้างพาธที่ลงทะเบียนไว้สำหรับประเภทนั้น

ประเภทเป้าหมายบางประเภทรับชื่อแฝงเพื่อความเข้ากันได้เป็น `target.type` สำหรับแผนที่มีอยู่ นอกเหนือจากชื่อประเภทมาตรฐาน:

| ประเภทมาตรฐาน                       | ชื่อแฝงที่ยอมรับ                                  |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## กฎการตรวจสอบพาธ

แต่ละเป้าหมายจะได้รับการตรวจสอบตามเงื่อนไขทั้งหมดต่อไปนี้:

- `type` ต้องเป็นประเภทเป้าหมายที่รู้จัก
- `path` ต้องเป็นพาธแบบจุดที่ไม่ว่างเปล่า
- สามารถละ `pathSegments` ได้ หากระบุไว้ ค่าที่ปรับให้อยู่ในรูปแบบมาตรฐานแล้วต้องเป็นพาธเดียวกันกับ `path` ทุกประการ
- เซกเมนต์ต้องห้ามจะถูกปฏิเสธ ได้แก่ `__proto__`, `prototype`, `constructor`
- พาธที่ปรับให้อยู่ในรูปแบบมาตรฐานแล้วต้องตรงกับโครงสร้างพาธที่ลงทะเบียนไว้สำหรับประเภทเป้าหมาย
- หากตั้งค่า `providerId` หรือ `accountId` ค่านั้นต้องตรงกับ ID ที่เข้ารหัสอยู่ในพาธ
- เป้าหมาย `auth-profiles.json` ต้องมี `agentId`
- เมื่อสร้างการแมป `auth-profiles.json` ใหม่ ให้ระบุ `authProfileProvider`

## ลักษณะการทำงานเมื่อเกิดความล้มเหลว

หากเป้าหมายไม่ผ่านการตรวจสอบ การนำไปใช้จะออกพร้อมข้อผิดพลาดในลักษณะต่อไปนี้:

```text
พาธเป้าหมายของแผนไม่ถูกต้องสำหรับ models.providers.apiKey: models.providers.openai.baseUrl
```

จะไม่มีการยืนยันการเขียนใดๆ สำหรับแผนที่ไม่ถูกต้อง เนื่องจากการแก้ไขค่าเป้าหมายและการตรวจสอบพาธทำงานก่อนแตะต้องไฟล์ใดๆ นอกจากนี้ เมื่อแผนที่ถูกต้องเริ่มเขียนแล้ว การนำไปใช้จะสร้างสแนปช็อตของทุกไฟล์ที่ได้รับผลกระทบก่อน และกู้คืนสแนปช็อตเหล่านั้นหากการเขียนในภายหลังภายในการทำงานเดียวกันล้มเหลว ดังนั้นการเขียนเพียงบางส่วนจะไม่ทำให้สถานะการกำหนดค่า โปรไฟล์การยืนยันตัวตน หรือ env ไม่สอดคล้องกัน

## ลักษณะการยินยอมสำหรับผู้ให้บริการ Exec

- `--dry-run` ข้ามการตรวจสอบ SecretRef แบบ exec โดยค่าเริ่มต้น
- แผนที่มี SecretRef/ผู้ให้บริการแบบ exec จะถูกปฏิเสธในโหมดเขียน เว้นแต่จะตั้งค่า `--allow-exec`
- เมื่อตรวจสอบ/นำแผนที่มี exec ไปใช้ ให้ส่ง `--allow-exec` ทั้งในคำสั่งทดลองทำงานและคำสั่งเขียน

## หมายเหตุเกี่ยวกับขอบเขตรันไทม์และการตรวจสอบ

- รายการ `auth-profiles.json` ที่มีเฉพาะการอ้างอิง (`keyRef`/`tokenRef`) จะรวมอยู่ในการแก้ไขค่าข้อมูลประจำตัวระหว่างรันไทม์และความครอบคลุมของการตรวจสอบ
- `secrets apply` เขียนเป้าหมาย `openclaw.json` ที่รองรับ เป้าหมาย `auth-profiles.json` ที่รองรับ และขั้นตอนล้างข้อมูลที่ไม่บังคับสามขั้นตอน ซึ่งเปิดใช้งานทั้งหมดโดยค่าเริ่มต้น ได้แก่ `scrubEnv` (ลบค่าข้อความธรรมดาที่ย้ายแล้วออกจากไฟล์ `.env` ในไดเรกทอรีสถานะที่มีผลและไดเรกทอรีการกำหนดค่าที่ใช้งานอยู่), `scrubAuthProfilesForProviderTargets` (ล้างข้อความธรรมดา/ข้อมูลตกค้างจากการอ้างอิงที่ไม่ได้ใช้งานใน `auth-profiles.json` สำหรับผู้ให้บริการที่แผนเพิ่งย้าย) และ `scrubLegacyAuthJson` (ลบรายการ `api_key` ที่ย้ายแล้วออกจากที่เก็บ `auth.json` แบบเดิม) ตั้งค่า `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` หรือ `options.scrubLegacyAuthJson` เป็น `false` ในแผนเพื่อข้ามขั้นตอนนั้น

## การตรวจสอบสำหรับผู้ปฏิบัติงาน

```bash
# ตรวจสอบแผนโดยไม่เขียน
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# จากนั้นนำไปใช้จริง
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# สำหรับแผนที่มี exec ให้เลือกใช้อย่างชัดเจนในทั้งสองโหมด
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

หากการนำไปใช้ล้มเหลวพร้อมข้อความว่าพาธเป้าหมายไม่ถูกต้อง ให้สร้างแผนใหม่ด้วย `openclaw secrets configure` หรือแก้ไขพาธเป้าหมายให้เป็นโครงสร้างที่รองรับข้างต้น

## เอกสารที่เกี่ยวข้อง

- [การจัดการข้อมูลลับ](/th/gateway/secrets)
- [CLI `secrets`](/th/cli/secrets)
- [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
