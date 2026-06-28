---
read_when:
    - การ resolve ref ของ secret ใหม่ขณะรันไทม์
    - การตรวจสอบร่องรอยข้อความล้วนและ ref ที่ยัง resolve ไม่ได้
    - การกำหนดค่า SecretRef และใช้การเปลี่ยนแปลงการล้างแบบทางเดียว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw secrets` (รีโหลด ตรวจสอบ กำหนดค่า ใช้งาน)
title: Secrets
x-i18n:
    generated_at: "2026-04-24T09:04:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw secrets`

ใช้ `openclaw secrets` เพื่อจัดการ SecretRef และรักษา snapshot ของ runtime ที่กำลังใช้งานให้อยู่ในสภาพดี

บทบาทของคำสั่ง:

- `reload`: Gateway RPC (`secrets.reload`) ที่ resolve ref ใหม่และสลับ snapshot ของ runtime เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น (ไม่มีการเขียน config)
- `audit`: การสแกนแบบอ่านอย่างเดียวของที่เก็บ configuration/auth/generated-model และร่องรอยแบบ legacy เพื่อหาข้อความล้วน ref ที่ยัง resolve ไม่ได้ และ precedence drift (ref แบบ exec จะถูกข้ามเว้นแต่จะตั้ง `--allow-exec`)
- `configure`: ตัวช่วยวางแผนแบบโต้ตอบสำหรับการตั้งค่าผู้ให้บริการ การแมปเป้าหมาย และ preflight (ต้องใช้ TTY)
- `apply`: ดำเนินการตามแผนที่บันทึกไว้ (`--dry-run` สำหรับตรวจสอบอย่างเดียว; dry-run จะข้ามการตรวจสอบ exec โดยค่าเริ่มต้น และโหมดเขียนจะปฏิเสธแผนที่มี exec เว้นแต่จะตั้ง `--allow-exec`) จากนั้นล้างร่องรอยข้อความล้วนตามเป้าหมาย

ลูปการทำงานของผู้ปฏิบัติการที่แนะนำ:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

หากแผนของคุณมี `exec` SecretRef/ผู้ให้บริการ ให้ส่ง `--allow-exec` ทั้งในคำสั่ง apply แบบ dry-run และแบบเขียน

หมายเหตุเรื่อง exit code สำหรับ CI/gates:

- `audit --check` จะคืนค่า `1` เมื่อพบรายการ
- ref ที่ยัง resolve ไม่ได้จะคืนค่า `2`

ที่เกี่ยวข้อง:

- คู่มือ Secrets: [Secrets Management](/th/gateway/secrets)
- พื้นผิวข้อมูลรับรอง: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- คู่มือ Security: [Security](/th/gateway/security)

## รีโหลด snapshot ของ runtime

resolve ref ของ secret ใหม่และสลับ snapshot ของ runtime แบบอะตอมมิก

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

หมายเหตุ:

- ใช้ Gateway RPC method `secrets.reload`
- หากการ resolve ล้มเหลว Gateway จะเก็บ snapshot ล่าสุดที่ใช้งานได้ไว้และคืนค่าข้อผิดพลาด (ไม่มีการเปิดใช้งานบางส่วน)
- การตอบกลับแบบ JSON มี `warningCount`

ตัวเลือก:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

สแกนสถานะของ OpenClaw เพื่อหา:

- การเก็บ secret แบบข้อความล้วน
- ref ที่ยัง resolve ไม่ได้
- precedence drift (ข้อมูลรับรองใน `auth-profiles.json` ที่บัง ref ใน `openclaw.json`)
- ร่องรอยใน `agents/*/agent/models.json` ที่สร้างขึ้น (`apiKey` ของผู้ให้บริการและ header ผู้ให้บริการที่ละเอียดอ่อน)
- ร่องรอยแบบ legacy (รายการในที่เก็บ auth แบบเก่า การเตือน OAuth)

หมายเหตุเรื่องร่องรอยใน header:

- การตรวจจับ header ผู้ให้บริการที่ละเอียดอ่อนใช้ heuristic ตามชื่อ (ชื่อ header ทั่วไปที่ใช้ auth/credential และชิ้นส่วนเช่น `authorization`, `x-api-key`, `token`, `secret`, `password` และ `credential`)

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

พฤติกรรมการออก:

- `--check` จะออกด้วยรหัสที่ไม่เป็นศูนย์เมื่อพบรายการ
- ref ที่ยัง resolve ไม่ได้จะออกด้วยรหัสที่ไม่เป็นศูนย์ที่มีลำดับความสำคัญสูงกว่า

จุดเด่นของรูปแบบรายงาน:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- รหัสการพบ:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (ตัวช่วยแบบโต้ตอบ)

สร้างการเปลี่ยนแปลงของผู้ให้บริการและ SecretRef แบบโต้ตอบ รัน preflight และเลือก apply ได้:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

โฟลว์:

- ตั้งค่าผู้ให้บริการก่อน (`add/edit/remove` สำหรับ alias ใน `secrets.providers`)
- การแมปข้อมูลรับรองทีหลัง (เลือกฟิลด์และกำหนด ref แบบ `{source, provider, id}`)
- preflight และ apply แบบเลือกได้ในตอนท้าย

แฟล็ก:

- `--providers-only`: กำหนดค่าเฉพาะ `secrets.providers` เท่านั้น ข้ามการแมปข้อมูลรับรอง
- `--skip-provider-setup`: ข้ามการตั้งค่าผู้ให้บริการและแมปข้อมูลรับรองไปยังผู้ให้บริการที่มีอยู่
- `--agent <id>`: จำกัดการค้นหาเป้าหมายและการเขียน `auth-profiles.json` ไปยังที่เก็บของเอเจนต์หนึ่งตัว
- `--allow-exec`: อนุญาตการตรวจสอบ exec SecretRef ระหว่าง preflight/apply (อาจมีการรันคำสั่งของผู้ให้บริการ)

หมายเหตุ:

- ต้องใช้ TTY แบบโต้ตอบ
- คุณไม่สามารถใช้ `--providers-only` ร่วมกับ `--skip-provider-setup` ได้
- `configure` กำหนดเป้าหมายฟิลด์ที่มี secret ใน `openclaw.json` พร้อมทั้ง `auth-profiles.json` สำหรับขอบเขตเอเจนต์ที่เลือก
- `configure` รองรับการสร้างการแมป `auth-profiles.json` ใหม่โดยตรงในโฟลว์ตัวเลือก
- พื้นผิวที่รองรับแบบมาตรฐาน: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- มันจะทำ preflight resolution ก่อน apply
- หาก preflight/apply มี exec ref ให้คง `--allow-exec` ไว้สำหรับทั้งสองขั้นตอน
- แผนที่สร้างขึ้นจะเปิดตัวเลือก scrub เป็นค่าเริ่มต้น (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` เปิดทั้งหมด)
- เส้นทาง apply เป็นแบบทางเดียวสำหรับค่าข้อความล้วนที่ถูก scrub
- หากไม่มี `--apply`, CLI จะยังถาม `Apply this plan now?` หลัง preflight
- เมื่อใช้ `--apply` (และไม่มี `--yes`) CLI จะถามยืนยันเพิ่มเติมแบบย้อนกลับไม่ได้
- `--json` จะแสดงแผน + รายงาน preflight แต่คำสั่งนี้ยังคงต้องใช้ TTY แบบโต้ตอบ

หมายเหตุด้านความปลอดภัยของผู้ให้บริการ exec:

- การติดตั้งผ่าน Homebrew มักเปิดเผยไบนารีแบบ symlink ภายใต้ `/opt/homebrew/bin/*`
- ให้ตั้ง `allowSymlinkCommand: true` เฉพาะเมื่อจำเป็นสำหรับพาธของ package manager ที่เชื่อถือได้ และใช้คู่กับ `trustedDirs` (เช่น `["/opt/homebrew"]`)
- บน Windows หากไม่สามารถตรวจสอบ ACL สำหรับพาธของผู้ให้บริการได้ OpenClaw จะ fail closed สำหรับพาธที่เชื่อถือได้เท่านั้น ให้ตั้ง `allowInsecurePath: true` บนผู้ให้บริการนั้นเพื่อข้ามการตรวจสอบความปลอดภัยของพาธ

## Apply แผนที่บันทึกไว้

apply หรือ preflight แผนที่สร้างไว้ก่อนหน้า:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

พฤติกรรมของ exec:

- `--dry-run` จะตรวจสอบ preflight โดยไม่เขียนไฟล์
- การตรวจสอบ exec SecretRef จะถูกข้ามโดยค่าเริ่มต้นใน dry-run
- โหมดเขียนจะปฏิเสธแผนที่มี exec SecretRef/ผู้ให้บริการ เว้นแต่จะตั้ง `--allow-exec`
- ใช้ `--allow-exec` เพื่อเลือกเปิดการตรวจสอบ/ดำเนินการผู้ให้บริการ exec ในทั้งสองโหมด

รายละเอียดสัญญาของแผน (พาธเป้าหมายที่อนุญาต กฎการตรวจสอบ และความหมายของความล้มเหลว):

- [Secrets Apply Plan Contract](/th/gateway/secrets-plan-contract)

สิ่งที่ `apply` อาจอัปเดต:

- `openclaw.json` (เป้าหมาย SecretRef + upsert/delete ของผู้ให้บริการ)
- `auth-profiles.json` (scrub เป้าหมายของผู้ให้บริการ)
- ร่องรอย `auth.json` แบบเก่า
- คีย์ secret ที่รู้จักใน `~/.openclaw/.env` ซึ่งค่าของมันถูกย้ายแล้ว

## ทำไมจึงไม่มี backup สำหรับ rollback

`secrets apply` ตั้งใจไม่เขียน backup สำหรับ rollback ที่มีค่าข้อความล้วนเดิม

ความปลอดภัยมาจาก strict preflight + apply แบบกึ่งอะตอมมิกพร้อมการกู้คืนในหน่วยความจำแบบ best-effort เมื่อเกิดความล้มเหลว

## ตัวอย่าง

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

หาก `audit --check` ยังรายงานการพบข้อความล้วน ให้อัปเดตพาธเป้าหมายที่ยังเหลืออยู่ตามที่รายงาน แล้วรัน audit ใหม่

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การจัดการ Secrets](/th/gateway/secrets)
