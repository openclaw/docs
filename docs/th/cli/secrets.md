---
read_when:
    - การแก้ไขการอ้างอิงข้อมูลลับใหม่ขณะรันไทม์
    - การตรวจสอบข้อความธรรมดาที่ตกค้างและการอ้างอิงที่ยังไม่ได้แก้ไข
    - การกำหนดค่า SecretRefs และการใช้การเปลี่ยนแปลงการลบข้อมูลแบบทางเดียว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw secrets` (โหลดใหม่ ตรวจสอบ กำหนดค่า ใช้งาน)
title: ข้อมูลลับ
x-i18n:
    generated_at: "2026-07-12T15:55:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

จัดการ SecretRef และรักษาสแนปช็อตรันไทม์ที่ใช้งานอยู่ให้พร้อมทำงานอย่างถูกต้อง

| คำสั่ง      | บทบาท                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC (`secrets.reload`): แก้ไขการอ้างอิงใหม่และสลับสแนปช็อตรันไทม์เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น (ไม่เขียนการกำหนดค่า)                                                                          |
| `audit`     | สแกนแบบอ่านอย่างเดียวในพื้นที่จัดเก็บการกำหนดค่า/การยืนยันตัวตน/โมเดลที่สร้างขึ้นและข้อมูลตกค้างแบบเก่า เพื่อตรวจหาข้อความธรรมดา การอ้างอิงที่แก้ไขไม่ได้ และความคลาดเคลื่อนของลำดับความสำคัญ (ข้ามการอ้างอิง exec เว้นแต่ระบุ `--allow-exec`) |
| `configure` | ตัววางแผนแบบโต้ตอบสำหรับตั้งค่าผู้ให้บริการ จับคู่เป้าหมาย และตรวจสอบล่วงหน้า (ต้องใช้ TTY)                                                                                                             |
| `apply`     | ดำเนินการตามแผนที่บันทึกไว้ (`--dry-run` ตรวจสอบความถูกต้องเท่านั้นและข้ามการตรวจสอบ exec โดยค่าเริ่มต้น ส่วนโหมดเขียนจะปฏิเสธแผนที่มี exec เว้นแต่ระบุ `--allow-exec`) จากนั้นล้างข้อมูลข้อความธรรมดาที่ตกค้างตามเป้าหมาย |

วงจรการทำงานที่แนะนำสำหรับผู้ปฏิบัติงาน:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

หากแผนของคุณมี SecretRef/ผู้ให้บริการแบบ `exec` ให้ระบุ `--allow-exec` ในคำสั่ง `apply` ทั้งแบบ dry-run และแบบเขียน

รหัสออกสำหรับ CI/เกต:

- `audit --check` คืนค่า `1` เมื่อพบปัญหา
- การอ้างอิงที่แก้ไขไม่ได้คืนค่า `2` (ไม่ว่าจะระบุ `--check` หรือไม่)

ที่เกี่ยวข้อง: [การจัดการข้อมูลลับ](/th/gateway/secrets) · [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface) · [ความปลอดภัย](/th/gateway/security)

## โหลดสแนปช็อตรันไทม์ใหม่

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

ใช้เมธอด Gateway RPC `secrets.reload` หากการแก้ไขการอ้างอิงล้มเหลว Gateway จะเก็บสแนปช็อตล่าสุดที่ทราบว่าทำงานได้และส่งคืนข้อผิดพลาด (ไม่มีการเปิดใช้งานเพียงบางส่วน) การตอบกลับ JSON มี `warningCount`

ตัวเลือก: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`

## ตรวจสอบ

สแกนสถานะของ OpenClaw เพื่อหา:

- การจัดเก็บข้อมูลลับเป็นข้อความธรรมดา
- การอ้างอิงที่แก้ไขไม่ได้
- ความคลาดเคลื่อนของลำดับความสำคัญ (ข้อมูลประจำตัวใน `auth-profiles.json` บดบังการอ้างอิงใน `openclaw.json`)
- ข้อมูลตกค้างใน `agents/*/agent/models.json` ที่สร้างขึ้น (ค่า `apiKey` ของผู้ให้บริการและส่วนหัวที่ละเอียดอ่อนของผู้ให้บริการ)
- ข้อมูลตกค้างแบบเก่า (รายการในพื้นที่จัดเก็บการยืนยันตัวตนแบบเก่าและข้อความเตือน OAuth)

การตรวจหาส่วนหัวที่ละเอียดอ่อนของผู้ให้บริการอาศัยฮิวริสติกจากชื่อ โดยจะแจ้งส่วนหัวที่ชื่อตรงกับส่วนประกอบทั่วไปเกี่ยวกับการยืนยันตัวตน/ข้อมูลประจำตัว (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`)

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
- รหัสผลการตรวจพบ: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## กำหนดค่า (ตัวช่วยแบบโต้ตอบ)

สร้างการเปลี่ยนแปลงสำหรับผู้ให้บริการและ SecretRef แบบโต้ตอบ เรียกใช้การตรวจสอบล่วงหน้า และเลือกใช้การเปลี่ยนแปลง:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

ลำดับการทำงาน: ตั้งค่าผู้ให้บริการก่อน (เพิ่ม/แก้ไข/ลบนามแฝง `secrets.providers`) จากนั้นจับคู่ข้อมูลประจำตัว (เลือกฟิลด์และกำหนดการอ้างอิง `{source, provider, id}`) แล้วจึงตรวจสอบล่วงหน้าและเลือกใช้การเปลี่ยนแปลง

แฟล็ก:

- `--providers-only`: กำหนดค่าเฉพาะ `secrets.providers` และข้ามการจับคู่ข้อมูลประจำตัว
- `--skip-provider-setup`: ข้ามการตั้งค่าผู้ให้บริการและจับคู่ข้อมูลประจำตัวกับผู้ให้บริการที่มีอยู่
- `--agent <id>`: จำกัดขอบเขตการค้นหาเป้าหมายและการเขียน `auth-profiles.json` ไว้ที่พื้นที่จัดเก็บของเอเจนต์หนึ่งราย
- `--allow-exec`: อนุญาตการตรวจสอบ exec SecretRef ระหว่างการตรวจสอบล่วงหน้า/การใช้การเปลี่ยนแปลง (อาจเรียกใช้คำสั่งของผู้ให้บริการ)

ไม่สามารถใช้ `--providers-only` ร่วมกับ `--skip-provider-setup` ได้

หมายเหตุ:

- ต้องใช้ TTY แบบโต้ตอบ
- กำหนดเป้าหมายฟิลด์ที่มีข้อมูลลับใน `openclaw.json` รวมถึง `auth-profiles.json` สำหรับขอบเขตเอเจนต์ที่เลือก พื้นผิวมาตรฐานที่รองรับ: [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- รองรับการสร้างการจับคู่ใหม่ใน `auth-profiles.json` โดยตรงผ่านขั้นตอนตัวเลือก
- เรียกใช้การแก้ไขการอ้างอิงล่วงหน้าก่อนใช้การเปลี่ยนแปลง
- แผนที่สร้างขึ้นจะเปิดใช้ตัวเลือกการล้างข้อมูลโดยค่าเริ่มต้น (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`) การใช้การเปลี่ยนแปลงกับค่าข้อความธรรมดาที่ล้างแล้วไม่สามารถย้อนกลับได้
- หากไม่ระบุ `--apply` CLI จะยังคงถาม `Apply this plan now?` หลังการตรวจสอบล่วงหน้า
- เมื่อระบุ `--apply` (แต่ไม่ระบุ `--yes`) CLI จะถามยืนยันเพิ่มเติมสำหรับการย้ายข้อมูลที่ย้อนกลับไม่ได้
- `--json` แสดงแผนและรายงานการตรวจสอบล่วงหน้า แต่ยังคงต้องใช้ TTY แบบโต้ตอบ

### ความปลอดภัยของผู้ให้บริการ exec

การติดตั้งผ่าน Homebrew มักเปิดเผยไบนารีแบบ symlink ใต้ `/opt/homebrew/bin/*` ให้ตั้งค่า `allowSymlinkCommand: true` เฉพาะเมื่อจำเป็นสำหรับพาธของตัวจัดการแพ็กเกจที่เชื่อถือได้ และใช้ร่วมกับ `trustedDirs` (เช่น `["/opt/homebrew"]`) บน Windows หากไม่สามารถตรวจสอบ ACL สำหรับพาธของผู้ให้บริการได้ OpenClaw จะปฏิเสธการทำงานโดยค่าเริ่มต้น สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้งค่า `allowInsecurePath: true` ในผู้ให้บริการนั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

## ใช้แผนที่บันทึกไว้

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` ตรวจสอบความถูกต้องล่วงหน้าโดยไม่เขียนไฟล์ และข้ามการตรวจสอบ exec SecretRef โดยค่าเริ่มต้นในโหมด dry-run โหมดเขียนจะปฏิเสธแผนที่มี SecretRef/ผู้ให้บริการแบบ exec เว้นแต่ระบุ `--allow-exec` ใช้ `--allow-exec` เพื่อยินยอมให้ตรวจสอบ/เรียกใช้ผู้ให้บริการแบบ exec ในโหมดใดโหมดหนึ่ง

สิ่งที่ `apply` อาจอัปเดต:

- `openclaw.json` (เป้าหมาย SecretRef และการเพิ่มหรืออัปเดต/ลบผู้ให้บริการ)
- `auth-profiles.json` (การล้างข้อมูลตามเป้าหมายผู้ให้บริการ)
- ข้อมูลตกค้างใน `auth.json` แบบเก่า
- คีย์ข้อมูลลับที่รู้จักใน `~/.openclaw/.env` ซึ่งค่าถูกย้ายแล้ว

รายละเอียดสัญญาของแผน (พาธเป้าหมายที่อนุญาต กฎการตรวจสอบความถูกต้อง และความหมายเมื่อเกิดความล้มเหลว): [สัญญาแผนการใช้ข้อมูลลับ](/th/gateway/secrets-plan-contract)

### เหตุผลที่ไม่มีข้อมูลสำรองสำหรับย้อนกลับ

`secrets apply` ตั้งใจไม่เขียนข้อมูลสำรองสำหรับย้อนกลับที่มีค่าข้อความธรรมดาเดิม ความปลอดภัยมาจากการตรวจสอบล่วงหน้าอย่างเข้มงวดร่วมกับการใช้การเปลี่ยนแปลงที่เกือบเป็นอะตอมมิก พร้อมพยายามคืนค่าในหน่วยความจำเมื่อเกิดความล้มเหลว

## ตัวอย่าง

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

หาก `audit --check` ยังคงรายงานการตรวจพบข้อความธรรมดา ให้อัปเดตพาธเป้าหมายที่เหลือตามรายงาน แล้วเรียกใช้การตรวจสอบอีกครั้ง

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การจัดการข้อมูลลับ](/th/gateway/secrets)
- [SecretRef ของ Vault](/plugins/vault)
