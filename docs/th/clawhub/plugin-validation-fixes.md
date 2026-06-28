---
read_when:
    - คุณรัน clawhub package validate แล้วจำเป็นต้องแก้ไข findings ของ plugin
    - ClawHub ปฏิเสธหรือเตือนระหว่างการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขข้อพบในการตรวจสอบแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-06-28T00:11:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการตรวจพบจาก
การสแกนแพ็กเกจแบบอัตโนมัติได้ด้วย หน้านี้ครอบคลุมผลการตรวจพบสำหรับผู้เขียน ซึ่งหมายถึง
ผลการตรวจพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในเมตาดาต้าแพ็กเกจ, manifest, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่

หน้านี้ไม่ครอบคลุมผลการตรวจพบความครอบคลุมของ Plugin Inspector ภายใน หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใด ๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการตรวจพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมตาดาต้าแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศ entrypoint ของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่ entrypoint ที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมตาดาต้าการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดเวอร์ชัน host ขั้นต่ำให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดเวอร์ชันแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบเมตาดาต้าแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมตาดาต้าในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์ contract ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จาก root](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้าย env vars ของ provider ไปยังเมตาดาต้าการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [ทำสำเนา env vars ของ channel ในเมตาดาต้าปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิงสคีมา security manifest ที่ใช้งานไม่ได้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ security manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมตาดาต้าแพ็กเกจ

### package-json-missing

root ของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, entrypoint หรือเมตาดาต้า OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจส่งมอบ Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [Plugin manifest](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกระหว่างแพ็กเกจกับ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศเมตาดาต้าแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมเมตาดาต้า entrypoint เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มเมตาดาต้าความเข้ากันได้และการติดตั้งเมื่อจะเผยแพร่แพ็กเกจหรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีเมตาดาต้าแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศ entrypoint runtime ของ
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบ native
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด
  JavaScript ที่ build แล้ว
- เก็บ path ของ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แล้ว แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละ path ใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหาก entrypoint ถูกสร้างเข้าไปใน `dist`
- อัปเดตเมตาดาต้าหาก entrypoint ถูกย้าย
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าแพ็กเกจควรถูกติดตั้งหรืออัปเดตอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชัน host OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ลงใน `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือ semver floor ที่คุณ build และทดสอบ
  มาแล้ว
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบายการปล่อย
  Plugin; `openclaw.compat.pluginApi` อธิบาย contract ของ API host
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชัน host ขั้นต่ำของแพ็กเกจไม่ตรงกับเมตาดาต้าเวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมตาดาต้า build ของ OpenClaw ใด ๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการปล่อย
- จัดเวอร์ชัน host ขั้นต่ำให้ตรงกับช่วงเวอร์ชัน host ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจกับเวอร์ชัน Plugin manifest ไม่ตรงกัน

- ให้ใช้ `package.json#version` เป็นเวอร์ชันปล่อยของแพ็กเกจก่อน
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  เมตาดาต้าเวอร์ชัน manifest ที่ล้าสมัยเมื่อเมตาดาต้าแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังเปลี่ยนเมตาดาต้าที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่ใช่เมตาดาต้าแพ็กเกจ
OpenClaw ที่รองรับ

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บเมตาดาต้า Plugin แบบ native ไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และเมตาดาต้าแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จาก root ของแพ็กเกจ
- แก้ไขเมตาดาต้าแพ็กเกจที่ไม่ถูกต้อง, lifecycle scripts ที่เสีย หรือรายการ files ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
entrypoint ที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- build entrypoint ที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือเอาต์พุต build เพื่อให้รวม entrypoint ที่ประกาศไว้
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วไม่มีเมตาดาต้า OpenClaw ที่มีอยู่ในแพ็กเกจต้นทาง
ของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์เมตาดาต้าที่ถูกรวมไว้
- ตรวจให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบ native
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมตาดาต้าแพ็กเกจถูกตัดออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมตาดาต้า manifest

### manifest-name-missing

manifest ของ Plugin แบบ native ไม่มีชื่อที่แสดง

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็น id เครื่องที่เสถียร
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

Plugin manifest มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละฟิลด์กับ
  [ข้อมูลอ้างอิงฟิลด์ระดับบนสุดของไฟล์กำกับ](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายข้อมูลเมตาของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw`
  ที่รองรับแทนไฟล์กำกับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

ไฟล์กำกับประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิง `contracts`](/th/plugins/manifest#contracts-reference)
- ลบคีย์สัญญาที่ไม่รองรับ
- ย้ายพฤติกรรมรันไทม์ไปไว้ในโค้ดการลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะข้อมูลเมตาความเป็นเจ้าของความสามารถแบบคงที่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## การย้ายข้อมูล SDK และความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจากบาร์เรล SDK รากที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจากบาร์เรลรากด้วยการนำเข้าซับพาธสาธารณะที่เจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วยจุดเข้าใช้งานของช่องทาง
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [ซับพาธของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาการนำเข้าที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าเส้นทาง SDK ที่สงวนไว้สำหรับ Plugin ที่รวมมาด้วยหรือความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วยซับพาธ
  `openclaw/plugin-sdk/*` สาธารณะที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณหรือ
  ขอ API สาธารณะของ OpenClaw
- ใช้ [ซับพาธของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้ายข้อมูล SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วยสโตร์เซสชันทั้งชุดที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์สโตร์เซสชันทั้งชุด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะในขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยนี้
- ดู [API รันไทม์](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ฮุก `before_agent_start` แบบเดิม

- ย้ายงานการแทนที่โมเดลหรือผู้ให้บริการไปที่ `before_model_resolve`
- ย้ายงานการแก้ไขพรอมป์หรือบริบทไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะในขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยัง
  รองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ฮุกนี้
- ดู [ฮุก](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

ไฟล์กำกับยังใช้ข้อมูลเมตาการยืนยันตัวตนผู้ให้บริการ `providerAuthEnvVars` แบบเดิม

- สะท้อนข้อมูลเมตา env-var ของผู้ให้บริการไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เฉพาะเป็นข้อมูลเมตาความเข้ากันได้ในขณะที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้ายข้อมูล SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

ไฟล์กำกับใช้ข้อมูลเมตา env-var ของช่องทางแบบเดิมหรือเก่ากว่า โดยไม่มีข้อมูลเมตา setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- เก็บข้อมูลเมตา env-var ของช่องทางให้เป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- สะท้อนการ setup ช่องทางที่ขับเคลื่อนด้วย env ไปยัง setup ปัจจุบัน, config ช่องทาง หรือ
  ข้อมูลเมตาช่องทางของแพ็กเกจที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เฉพาะเป็นข้อมูลเมตาความเข้ากันได้ในขณะที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้มัน
- ดู [ไฟล์กำกับ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ไฟล์กำกับความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมการอ้างอิง schema ที่ ClawHub
ไม่รู้จักว่าใช้งานได้

- ลบ URL ของ schema หากเป็นเพียงคำแนะนำ
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับเฉพาะหลังจาก OpenClaw เผยแพร่แล้ว
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์กำกับความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสาร schema ไฟล์กำกับความปลอดภัยแบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่อ่อนไหวด้านความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณจนกว่าสัญญาไฟล์กำกับจะมีอยู่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ไฟล์กำกับ Plugin](/th/plugins/manifest)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
