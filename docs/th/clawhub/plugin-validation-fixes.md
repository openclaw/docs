---
read_when:
    - คุณเรียกใช้ clawhub package validate แล้วและจำเป็นต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือแสดงคำเตือนระหว่างเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการปล่อยรุ่น
summary: แก้ไขข้อค้นพบจากการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-04T18:23:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบความถูกต้องของแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการตรวจพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมผลการตรวจพบสำหรับผู้เขียน ซึ่งหมายถึง
ผลการตรวจพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในข้อมูลเมตาแพ็กเกจ, แมนิเฟสต์, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่

หน้านี้ไม่ครอบคลุมผลการตรวจพบความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใดๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการตรวจพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มข้อมูลเมตาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเข้าใช้งานแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเข้าใช้งานที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [กรอกข้อมูลเมตาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [ปรับเวอร์ชันโฮสต์ขั้นต่ำให้สอดคล้องกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [ปรับเวอร์ชันแพ็กเกจและแมนิเฟสต์ให้สอดคล้องกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [นำข้อมูลเมตาแพ็กเกจ OpenClaw ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเข้าใช้งานในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมข้อมูลเมตาในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของแมนิเฟสต์](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [นำฟิลด์แมนิเฟสต์ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [นำคีย์สัญญาที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากราก](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [นำการนำเข้า SDK ที่สงวนไว้ออก](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงที่เก็บทั้งเซสชัน](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียนที่เก็บทั้งเซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยเส้นทางไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ transcript แบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วย transcript ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยังข้อมูลเมตาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อนตัวแปรสภาพแวดล้อมของช่องทางในข้อมูลเมตาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [นำการอ้างอิงสคีมาแมนิเฟสต์ความปลอดภัยที่ใช้ไม่ได้ออก](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [นำไฟล์แมนิเฟสต์ความปลอดภัยที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## ข้อมูลเมตาแพ็กเกจ

### package-json-missing

รากของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, จุดเข้าใช้งาน หรือข้อมูลเมตา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจส่งมอบ Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [แมนิเฟสต์ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกส่วนระหว่างแพ็กเกจกับแมนิเฟสต์
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศข้อมูลเมตาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมข้อมูลเมตาจุดเข้าใช้งาน เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มข้อมูลเมตาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีข้อมูลเมตาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศจุดเข้าใช้งานรันไทม์ของ
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเข้าใช้งาน Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่สร้างแล้ว
- เก็บเส้นทางจุดเข้าใช้งานทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเข้าใช้งาน OpenClaw แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละเส้นทางใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- สร้างแพ็กเกจหากจุดเข้าใช้งานถูกสร้างไปไว้ใน `dist`
- อัปเดตข้อมูลเมตาหากจุดเข้าใช้งานถูกย้าย
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- กรอก `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  ให้เลือกใช้
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือค่า semver ขั้นต่ำที่คุณสร้างและทดสอบ
  เทียบไว้
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  รุ่นของ Plugin ส่วน `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับข้อมูลเมตาเวอร์ชัน OpenClaw
ที่แพ็กเกจถูกสร้างเทียบไว้

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบข้อมูลเมตาการสร้างของ OpenClaw ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- ปรับเวอร์ชันโฮสต์ขั้นต่ำให้สอดคล้องกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชันแมนิเฟสต์ Plugin ไม่ตรงกัน

- แนะนำให้ใช้ `package.json#version` เป็นเวอร์ชันรุ่นแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกัน หรือนำ
  ข้อมูลเมตาเวอร์ชันแมนิเฟสต์ที่ล้าสมัยออกเมื่อข้อมูลเมตาแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่เวอร์ชันแพ็กเกจใหม่หลังจากเปลี่ยนข้อมูลเมตาที่เผยแพร่แล้ว
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับ
ในฐานะข้อมูลเมตาแพ็กเกจ OpenClaw

- นำฟิลด์ที่ไม่รองรับออก เช่น `openclaw.bundle`
- เก็บข้อมูลเมตา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บจุดเข้าใช้งานแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และข้อมูลเมตาแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

แพ็กเกจไม่สามารถแพ็กเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จากรากของแพ็กเกจ
- แก้ไขข้อมูลเมตาแพ็กเกจที่ไม่ถูกต้อง, สคริปต์ lifecycle ที่เสีย หรือรายการไฟล์ที่
  ทำให้การแพ็กล้มเหลว
- นำ `private: true` ออก หากแพ็กเกจนี้ตั้งใจเผยแพร่สู่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
จุดเข้าใช้งานที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวม
- สร้างจุดเข้าใช้งานที่สร้างขึ้นโดยอัตโนมัติก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การสร้างเพื่อให้จุดเข้าใช้งานที่ประกาศไว้
  ถูกรวมเข้าไป
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วขาดข้อมูลเมตา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ข้อมูลเมตาที่ถูกรวม
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมเมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้ข้อมูลเมตาแพ็กเกจถูกตัดออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ข้อมูลเมตาแมนิเฟสต์

### manifest-name-missing

แมนิเฟสต์ Plugin แบบเนทีฟไม่มีชื่อที่แสดง

- เพิ่มฟิลด์ `name` ที่ไม่ว่างใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็นรหัสเครื่องที่เสถียร
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

แมนิเฟสต์ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบแต่ละฟิลด์ระดับบนสุดกับ
  [อ้างอิงฟิลด์แมนิเฟสต์](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์ที่กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมทาดาทาของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนแมนิเฟสต์
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

แมนิเฟสต์ประกาศคีย์ที่ไม่รองรับไว้ภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [อ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ contract ที่ไม่รองรับ
- ย้ายพฤติกรรมรันไทม์ไปไว้ในโค้ดการลงทะเบียน Plugin และจำกัด `contracts`
  ให้เหลือเฉพาะเมทาดาทาแบบสแตติกสำหรับความเป็นเจ้าของความสามารถ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก barrel SDK ระดับรูทที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก root-barrel ด้วยการนำเข้าจากเส้นทางย่อยสาธารณะแบบเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วยจุดเข้า channel
- ใช้ [แบบแผนการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาการนำเข้าที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าเส้นทาง SDK ที่สงวนไว้สำหรับ Plugin ที่บันเดิลมาด้วยหรือความเข้ากันได้
ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วยเส้นทางย่อยสาธารณะ
  `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API สาธารณะของ OpenClaw
- ใช้ [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังคงใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังคงใช้ตัวช่วยเขียน whole-session-store ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ในรายการเซสชันที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้างรายการเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บตัวช่วยเขียน whole-store ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังคงใช้ตัวช่วยเส้นทางไฟล์เซสชันที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านเมทาดาทาเซสชันตาม agent และตัวตนเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อบันทึกเมทาดาทาเซสชัน
- ใช้ตัวช่วยตัวตน transcript หรือเป้าหมาย เมื่อโค้ดกำลังเตรียมการดำเนินการ
  transcript
- อย่าบันทึกหรือพึ่งพาเส้นทางไฟล์ transcript แบบเดิม
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังคงใช้ตัวช่วยเป้าหมายไฟล์ transcript ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเฉพาะตัวตนเซสชันสาธารณะ
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการเป้าหมายการดำเนินการ
  transcript แบบมีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้างเป้าหมายไฟล์ transcript แบบเดิมโดยตรง
- เก็บตัวช่วยเดิมไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังคงใช้ตัวช่วย transcript ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการต่อท้าย transcript
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต
  transcript
- ควรใช้พื้นผิวรันไทม์ transcript แบบมีโครงสร้าง เพื่อให้ OpenClaw ใช้ขอบเขต
  ธุรกรรมและการจัดการตัวตนที่ถูกต้องได้
- เก็บตัวช่วย transcript ระดับต่ำไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อย Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังคงใช้ hook `before_agent_start` แบบเดิม

- ย้ายงาน override model หรือ provider ไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

แมนิเฟสต์ยังคงใช้เมทาดาทาการยืนยันตัวตน provider แบบเดิม `providerAuthEnvVars`

- สะท้อนเมทาดาทา env-var ของ provider ไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ขณะที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [อ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

แมนิเฟสต์ใช้เมทาดาทา env-var ของ channel แบบเดิมหรือแบบเก่า โดยไม่มีเมทาดาทา
setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ให้เมทาดาทา env-var ของ channel เป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลดรันไทม์ channel
- สะท้อน setup ของ channel ที่ขับเคลื่อนด้วย env ไปยัง setup, config ของ channel หรือ
  เมทาดาทา channel ของแพ็กเกจปัจจุบันที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ขณะที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้มัน
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest) และ
  [Plugin สำหรับ channel](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## แมนิเฟสต์ความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจส่ง `openclaw.security.json` พร้อมการอ้างอิง schema ที่ ClawHub
ไม่รับรู้ว่าพร้อมใช้งาน

- ลบ URL ของ schema หากเป็นเพียงคำแนะนำ
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจส่งไฟล์แมนิเฟสต์ความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะมีเอกสารสำหรับ schema แมนิเฟสต์
  ความปลอดภัยแบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่อ่อนไหวด้านความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณ จนกว่าจะมีสัญญาของแมนิเฟสต์
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
