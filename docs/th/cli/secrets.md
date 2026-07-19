---
read_when:
    - การแก้ไขการอ้างอิงข้อมูลลับใหม่ขณะรันไทม์
    - การตรวจสอบข้อความธรรมดาที่ตกค้างและการอ้างอิงที่ยังไม่ได้แก้ไข
    - การกำหนดค่า SecretRefs และการใช้การเปลี่ยนแปลงการล้างข้อมูลแบบทางเดียว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw secrets` (โหลดใหม่ ตรวจสอบ กำหนดค่า นำไปใช้)
title: ข้อมูลลับ
x-i18n:
    generated_at: "2026-07-19T07:07:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61f6f81e358ca2e6a97ac9498186b32f7a74d16052d226c398dad0030d47211e
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

จัดการ SecretRef และรักษาสแนปช็อตรันไทม์ที่ใช้งานอยู่ให้มีสถานะสมบูรณ์

| คำสั่ง     | บทบาท                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC (`secrets.reload`): แก้ไขการอ้างอิงใหม่และเผยแพร่สแนปช็อตรันไทม์ที่รับรู้เจ้าของแบบอะตอมมิก (ไม่เขียนการกำหนดค่า) โดยความล้มเหลวของเจ้าของที่เข้าเกณฑ์อาจเผยแพร่เป็นคำเตือนสถานะ cold หรือ stale |
| `audit`     | สแกนพื้นที่จัดเก็บการกำหนดค่า/การยืนยันตัวตน/โมเดลที่สร้างขึ้นและข้อมูลตกค้างแบบเดิมในโหมดอ่านอย่างเดียว เพื่อตรวจหาข้อความธรรมดา การอ้างอิงที่แก้ไขไม่ได้ และการคลาดเคลื่อนของลำดับความสำคัญ (ข้ามการอ้างอิง exec เว้นแต่ใช้ `--allow-exec`)                      |
| `configure` | เครื่องมือวางแผนแบบโต้ตอบสำหรับการตั้งค่าผู้ให้บริการ การแมปเป้าหมาย และการตรวจสอบล่วงหน้า (ต้องใช้ TTY)                                                                                                       |
| `apply`     | เรียกใช้แผนที่บันทึกไว้ (`--dry-run` จะตรวจสอบเท่านั้นและข้ามการตรวจสอบ exec โดยค่าเริ่มต้น ส่วนโหมดเขียนจะปฏิเสธแผนที่มี exec เว้นแต่ใช้ `--allow-exec`) จากนั้นล้างข้อมูลตกค้างแบบข้อความธรรมดาตามเป้าหมาย |

ลูปการดำเนินงานที่แนะนำ:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

หากแผนมี SecretRef/ผู้ให้บริการแบบ `exec` ให้ส่ง `--allow-exec` ทั้งกับคำสั่ง `apply` แบบทดลองรันและแบบเขียน

รหัสออกสำหรับ CI/เกต:

- `audit --check` คืนค่า `1` เมื่อตรวจพบรายการ
- การอ้างอิงที่แก้ไขไม่ได้จะคืนค่า `2` (ไม่ว่า `--check` จะเป็นค่าใด)

ที่เกี่ยวข้อง: [การจัดการข้อมูลลับ](/th/gateway/secrets) · [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface) · [ความปลอดภัย](/th/gateway/security)

## โหลดสแนปช็อตรันไทม์ใหม่

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

ใช้เมธอด Gateway RPC `secrets.reload` เจ้าของที่มีสถานะสมบูรณ์จะรีเฟรชแยกจากกัน เจ้าของที่ล้มเหลวและเข้าเกณฑ์จะกลายเป็น stale เฉพาะเมื่อข้อมูลระบุตัวตนของการอ้างอิง คำจำกัดความผู้ให้บริการ และสัญญาของเจ้าของส่วนที่ไม่ใช่ข้อมูลลับทั้งหมดไม่มีการเปลี่ยนแปลง ส่วนความล้มเหลวใหม่หรือที่เปลี่ยนแปลงจะกลายเป็น cold การเปิดใช้งานแบบลดระดับนี้จะสำเร็จและรายงาน `warningCount` ความล้มเหลวแบบเข้มงวดหรือที่ไม่ได้แมปจะคืนข้อผิดพลาดและเก็บรักษาสแนปช็อตที่ใช้งานอยู่ก่อนหน้า

ตัวเลือก: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`

## ตรวจสอบ

สแกนสถานะ OpenClaw เพื่อหา:

- การจัดเก็บข้อมูลลับแบบข้อความธรรมดา
- การอ้างอิงที่แก้ไขไม่ได้
- การคลาดเคลื่อนของลำดับความสำคัญ (ข้อมูลประจำตัว `auth-profiles.json` บดบังการอ้างอิง `openclaw.json`)
- ข้อมูลตกค้าง `agents/*/agent/models.json` ที่สร้างขึ้น (ค่า `apiKey` ของผู้ให้บริการและส่วนหัวผู้ให้บริการที่ละเอียดอ่อน)
- ข้อมูลตกค้างแบบเดิม (รายการพื้นที่จัดเก็บการยืนยันตัวตนแบบเดิม การแจ้งเตือน OAuth)

การสแกน `.env` ครอบคลุมไดเรกทอรีสถานะที่มีผลและไดเรกทอรีที่มีการกำหนดค่าที่ใช้งานอยู่ เมื่อทั้งสองพาธระบุไฟล์เดียวกัน ระบบจะสแกนไฟล์นั้นเพียงครั้งเดียว

การตรวจหาส่วนหัวผู้ให้บริการที่ละเอียดอ่อนใช้ฮิวริสติกตามชื่อ โดยจะทำเครื่องหมายส่วนหัวที่ชื่อตรงกับส่วนประกอบทั่วไปเกี่ยวกับการยืนยันตัวตน/ข้อมูลประจำตัว (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`)

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

รูปแบบรายงาน:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- รหัสรายการตรวจพบ: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## กำหนดค่า (ตัวช่วยแบบโต้ตอบ)

สร้างการเปลี่ยนแปลงผู้ให้บริการและ SecretRef แบบโต้ตอบ เรียกใช้การตรวจสอบล่วงหน้า และเลือกนำไปใช้ได้:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

ขั้นตอน: ตั้งค่าผู้ให้บริการก่อน (เพิ่ม/แก้ไข/ลบนามแฝง `secrets.providers`) จากนั้นแมปข้อมูลประจำตัว (เลือกฟิลด์ กำหนดการอ้างอิง `{source, provider, id}`) แล้วจึงตรวจสอบล่วงหน้าและเลือกนำไปใช้

แฟล็ก:

- `--providers-only`: กำหนดค่าเฉพาะ `secrets.providers` และข้ามการแมปข้อมูลประจำตัว
- `--skip-provider-setup`: ข้ามการตั้งค่าผู้ให้บริการ และแมปข้อมูลประจำตัวกับผู้ให้บริการที่มีอยู่
- `--agent <id>`: จำกัดขอบเขตการค้นหาเป้าหมายและการเขียน `auth-profiles.json` ไว้ที่พื้นที่จัดเก็บของเอเจนต์หนึ่งรายการ
- `--allow-exec`: อนุญาตการตรวจสอบ SecretRef แบบ exec ระหว่างการตรวจสอบล่วงหน้า/การนำไปใช้ (อาจเรียกใช้คำสั่งผู้ให้บริการ)

ไม่สามารถใช้ `--providers-only` ร่วมกับ `--skip-provider-setup` ได้

หมายเหตุ:

- ต้องใช้ TTY แบบโต้ตอบ
- กำหนดเป้าหมายฟิลด์ที่มีข้อมูลลับใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับขอบเขตเอเจนต์ที่เลือก พื้นผิวมาตรฐานที่รองรับ: [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- รองรับการสร้างการแมป `auth-profiles.json` ใหม่โดยตรงในขั้นตอนตัวเลือก
- เรียกใช้การแก้ไขค่าระหว่างการตรวจสอบล่วงหน้าก่อนนำไปใช้
- แผนที่สร้างขึ้นจะเปิดใช้ตัวเลือกการล้างข้อมูลโดยค่าเริ่มต้น (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`) การนำไปใช้กับค่าข้อความธรรมดาที่ถูกล้างแล้วไม่สามารถย้อนกลับได้
- `--plan-out` จะปฏิเสธการสร้างแผนที่มีรูปแบบอนุกรม UTF-8 เกิน 16 MiB (16,777,216 ไบต์) ซึ่งตรงกับขีดจำกัดอินพุต `apply --from`
- หากไม่มี `--apply` CLI จะยังคงแสดงข้อความถาม `Apply this plan now?` หลังการตรวจสอบล่วงหน้า
- เมื่อใช้ `--apply` (และไม่มี `--yes`) CLI จะแสดงข้อความยืนยันเพิ่มเติมสำหรับการย้ายข้อมูลที่ย้อนกลับไม่ได้
- `--json` แสดงแผนและรายงานการตรวจสอบล่วงหน้า แต่ยังคงต้องใช้ TTY แบบโต้ตอบ

### ความปลอดภัยของผู้ให้บริการ exec

การติดตั้ง Homebrew มักเปิดเผยไบนารีที่เป็น symlink ภายใต้ `/opt/homebrew/bin/*` ตั้งค่า `allowSymlinkCommand: true` เฉพาะเมื่อจำเป็นสำหรับพาธของตัวจัดการแพ็กเกจที่เชื่อถือได้ โดยใช้ร่วมกับ `trustedDirs` (ตัวอย่างเช่น `["/opt/homebrew"]`) บน Windows หากไม่สามารถตรวจสอบ ACL สำหรับพาธผู้ให้บริการได้ OpenClaw จะปฏิเสธโดยค่าเริ่มต้น สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้งค่า `allowInsecurePath: true` บนผู้ให้บริการนั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

## นำแผนที่บันทึกไว้ไปใช้

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` ตรวจสอบการตรวจสอบล่วงหน้าโดยไม่เขียนไฟล์ และจะข้ามการตรวจสอบ SecretRef แบบ exec โดยค่าเริ่มต้นในการทดลองรัน โหมดเขียนจะปฏิเสธแผนที่มี SecretRef/ผู้ให้บริการแบบ exec เว้นแต่ใช้ `--allow-exec` ใช้ `--allow-exec` เพื่อเลือกเข้าร่วมการตรวจสอบ/การเรียกใช้ผู้ให้บริการ exec ในโหมดใดโหมดหนึ่ง

`--from` ต้องชี้ไปยังไฟล์ปกติที่มีขนาดไม่เกิน 16 MiB (16,777,216 ไบต์) ขีดจำกัดไบต์ใช้กับไฟล์แบบอนุกรมทั้งหมด รวมถึงช่องว่าง

สิ่งที่ `apply` อาจอัปเดต:

- `openclaw.json` (เป้าหมาย SecretRef และการเพิ่มหรืออัปเดต/ลบผู้ให้บริการ)
- `auth-profiles.json` (การล้างข้อมูลเป้าหมายผู้ให้บริการ)
- ข้อมูลตกค้าง `auth.json` แบบเดิม
- ไฟล์ `.env` ในไดเรกทอรีสถานะที่มีผลและไดเรกทอรีการกำหนดค่าที่ใช้งานอยู่ สำหรับคีย์ข้อมูลลับที่รู้จักซึ่งมีการย้ายค่าแล้ว

รายละเอียดสัญญาแผน (พาธเป้าหมายที่อนุญาต กฎการตรวจสอบ ความหมายของความล้มเหลว): [สัญญาแผนการนำข้อมูลลับไปใช้](/th/gateway/secrets-plan-contract)

### เหตุใดจึงไม่มีข้อมูลสำรองสำหรับย้อนกลับ

`secrets apply` มีเจตนาไม่เขียนข้อมูลสำรองสำหรับย้อนกลับที่มีค่าข้อความธรรมดาเดิม ความปลอดภัยมาจากการตรวจสอบล่วงหน้าที่เข้มงวดและการนำไปใช้แบบเกือบอะตอมมิก พร้อมการคืนค่าในหน่วยความจำแบบพยายามอย่างเต็มที่เมื่อเกิดความล้มเหลว

## ตัวอย่าง

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

หาก `audit --check` ยังคงรายงานรายการข้อความธรรมดา ให้อัปเดตพาธเป้าหมายที่รายงานซึ่งเหลืออยู่แล้วเรียกใช้การตรวจสอบอีกครั้ง

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจัดการข้อมูลลับ](/th/gateway/secrets)
- [Vault SecretRef](/th/plugins/vault)
