---
read_when:
    - คุณรัน `clawhub package validate` แล้วและจำเป็นต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนระหว่างการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตเมทาดาทาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขข้อค้นพบจากการตรวจสอบแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-06-28T05:07:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการตรวจพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมผลการตรวจพบสำหรับผู้เขียน ซึ่งหมายถึง
ผลการตรวจพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในข้อมูลเมตาแพ็กเกจ, manifest, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่ของตน

หน้านี้ไม่ครอบคลุมผลการตรวจพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีแนวทางแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับผู้ดูแล
OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใดๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการตรวจพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มข้อมูลเมตาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศ entrypoint แพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่ entrypoint ที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมข้อมูลเมตาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดให้เวอร์ชันโฮสต์ขั้นต่ำตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดให้เวอร์ชันแพ็กเกจและ manifest ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบข้อมูลเมตาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm แพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมข้อมูลเมตาในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์ contract ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK ระดับรูท](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง session store ทั้งหมด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปร env ของ provider ไปยังข้อมูลเมตาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อนตัวแปร env ของช่องทางในข้อมูลเมตาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิง schema manifest ความปลอดภัยที่ไม่พร้อมใช้งาน](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ manifest ความปลอดภัยที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## ข้อมูลเมตาแพ็กเกจ

### package-json-missing

รูทของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงระบุ
แพ็กเกจ npm, เวอร์ชัน, entrypoint หรือข้อมูลเมตา OpenClaw ไม่ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [Plugin manifest](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแบ่งระหว่างแพ็กเกจกับ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศข้อมูลเมตาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมข้อมูลเมตา entrypoint เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มข้อมูลเมตาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีข้อมูลเมตาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศ entrypoint รันไทม์
ของ OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่สร้างแล้ว
- เก็บพาธ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แต่ไฟล์ที่อ้างถึงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- สร้างแพ็กเกจหาก entrypoint ถูกสร้างลงใน `dist`
- อัปเดตข้อมูลเมตาหาก entrypoint ถูกย้าย
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- กรอก `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  พร้อมใช้งาน
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ลงใน `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือ semver floor ที่คุณสร้างและทดสอบ
  ด้วย
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  รุ่นเผยแพร่ของ Plugin ส่วน `openclaw.compat.pluginApi` อธิบาย contract ของ API โฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับข้อมูลเมตาเวอร์ชัน OpenClaw
ที่ใช้สร้างแพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบข้อมูลเมตาการสร้างของ OpenClaw ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- จัดให้เวอร์ชันโฮสต์ขั้นต่ำตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน Plugin manifest ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันเผยแพร่ของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  ข้อมูลเมตาเวอร์ชัน manifest ที่ล้าสมัยเมื่อข้อมูลเมตาแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนข้อมูลเมตาที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่ใช่ข้อมูลเมตาแพ็กเกจ
OpenClaw ที่รองรับ

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บข้อมูลเมตา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และข้อมูลเมตาแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

แพ็กเกจไม่สามารถแพ็กเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จากรูทของแพ็กเกจ
- แก้ไขข้อมูลเมตาแพ็กเกจที่ไม่ถูกต้อง, lifecycle scripts ที่เสีย หรือรายการไฟล์
  ที่ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
entrypoint ที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- สร้าง entrypoint ที่ถูกสร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การสร้าง เพื่อให้ entrypoint ที่ประกาศไว้
  ถูกรวมไว้
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วขาดข้อมูลเมตา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ข้อมูลเมตาที่ถูกรวมไว้
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  ของ OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้ข้อมูลเมตาแพ็กเกจถูกยกเว้น
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ข้อมูลเมตา manifest

### manifest-name-missing

manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่แสดง

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็นรหัสเครื่องที่เสถียร
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

Plugin manifest มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ.

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละรายการกับ
  [ข้อมูลอ้างอิงฟิลด์ของ manifest](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์ที่กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมตาดาต้าของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนที่จะอยู่ใน manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ของ contract ที่ไม่รองรับ
- ย้ายพฤติกรรมของรันไทม์ไปไว้ในโค้ดการลงทะเบียน Plugin และจำกัด `contracts`
  ให้เป็นเฉพาะเมตาดาต้าความเป็นเจ้าของความสามารถแบบสแตติก
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก root SDK barrel ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก root-barrel ด้วยการนำเข้าซับพาธสาธารณะแบบเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย entry ของช่องทาง
- ใช้ [แบบแผนการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [ซับพาธของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาการนำเข้าที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าพาธ SDK ที่สงวนไว้สำหรับ Plugin ที่รวมมาในแพ็กเกจหรือความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วยซับพาธ
  `openclaw/plugin-sdk/*` สาธารณะที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API สาธารณะจาก OpenClaw
- ใช้ [ซับพาธของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกอ็อบเจ็กต์ session store ทั้งหมด
- คง `loadSessionStore(...)` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook รุ่นเก่า `before_agent_start`

- ย้ายงาน override โมเดลหรือผู้ให้บริการไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือบริบทไปที่ `before_prompt_build`
- คง `before_agent_start` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยัง
  รองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ hook นี้
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

manifest ยังใช้เมตาดาต้า auth ของผู้ให้บริการ `providerAuthEnvVars` รุ่นเก่า

- สะท้อนเมตาดาต้า env-var ของผู้ให้บริการไปยัง `setup.providers[].envVars`
- คง `providerAuthEnvVars` ไว้เป็นเมตาดาต้าความเข้ากันได้เท่านั้น ในช่วงที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

manifest ใช้เมตาดาต้า env-var ของช่องทางแบบเดิมหรือรุ่นเก่า โดยไม่มีเมตาดาต้า setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- คงเมตาดาต้า env-var ของช่องทางให้เป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- สะท้อนการตั้งค่าช่องทางที่ขับเคลื่อนด้วย env ไปยัง setup ปัจจุบัน, config ของช่องทาง หรือ
  เมตาดาต้าช่องทางของแพ็กเกจที่ใช้กับรูปแบบ Plugin ของคุณ
- คง `channelEnvVars` ไว้เป็นเมตาดาต้าความเข้ากันได้เท่านั้น ในช่วงที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้
- ดู [manifest ของ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## manifest ความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมข้อมูลอ้างอิง schema ที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- ลบ URL ของ schema หากเป็นเพียงคำแนะนำเท่านั้น
- ใช้ schema แบบระบุเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์ manifest ความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสาร schema ของ manifest
  ความปลอดภัยแบบระบุเวอร์ชันและพฤติกรรมของ ClawHub
- คงพฤติกรรมที่อ่อนไหวด้านความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณ จนกว่าจะมี contract ของ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
