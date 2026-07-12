---
read_when:
    - คุณเรียกใช้ `clawhub package validate` และต้องแก้ไขข้อบกพร่องที่ตรวจพบใน Plugin
    - ClawHub ปฏิเสธหรือแจ้งคำเตือนขณะเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนเผยแพร่
summary: แก้ไขข้อบกพร่องที่พบจากการตรวจสอบแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-12T15:58:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขข้อผิดพลาดการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการตรวจพบจาก
การสแกนแพ็กเกจอัตโนมัติได้อีกด้วย หน้านี้ครอบคลุมผลการตรวจพบสำหรับผู้เขียน ซึ่งหมายถึง
ผลการตรวจพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในข้อมูลเมตาของแพ็กเกจ ไฟล์ manifest การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่

หน้านี้ไม่ครอบคลุมผลการตรวจพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำในการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้น
มีไว้สำหรับผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากแก้ไขแล้ว ให้เรียกใช้อีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการตรวจพบสำหรับผู้เขียน

| รหัส                                    | เริ่มต้นที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มข้อมูลเมตาของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเริ่มต้นของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเริ่มต้นที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [กรอกข้อมูลเมตาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้กับ API ของ Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [ปรับรุ่นขั้นต่ำของโฮสต์ให้สอดคล้องกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [ปรับรุ่นของแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [นำข้อมูลเมตาแพ็กเกจ OpenClaw ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเริ่มต้นไว้ในผลลัพธ์ของ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมข้อมูลเมตาไว้ในผลลัพธ์ของ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [นำฟิลด์ manifest ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [นำคีย์สัญญาที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากราก](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [นำการนำเข้า SDK ที่สงวนไว้ใช้ออก](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงที่เก็บเซสชันทั้งหมด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียนที่เก็บเซสชันทั้งหมด](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์บทถอดความแบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วยบทถอดความระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยังข้อมูลเมตาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [ทำสำเนาตัวแปรสภาพแวดล้อมของช่องทางไว้ในข้อมูลเมตาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [นำการอ้างอิงสคีมา manifest ด้านความปลอดภัยที่ไม่พร้อมใช้งานออก](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [นำไฟล์ manifest ด้านความปลอดภัยที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## ข้อมูลเมตาของแพ็กเกจ

### package-json-missing

รากของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm รุ่น จุดเริ่มต้น หรือข้อมูลเมตาของ OpenClaw ได้

- เพิ่ม `package.json` ที่มี `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ดูตัวอย่างแพ็กเกจขั้นต่ำที่ [การสร้าง Plugin](/th/plugins/building-plugins)
  และดูการแบ่งแยกระหว่างแพ็กเกจกับ manifest ที่ [manifest ของ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศข้อมูลเมตา
ของแพ็กเกจ OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมข้อมูลเมตาของจุดเริ่มต้น เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มข้อมูลเมตาด้านความเข้ากันได้และการติดตั้ง เมื่อจะเผยแพร่หรือติดตั้งแพ็กเกจ
  ผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีข้อมูลเมตาของแพ็กเกจอยู่ แต่ไม่ได้ประกาศจุดเริ่มต้น
รันไทม์ของ OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเริ่มต้นของ Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่สร้างแล้ว
- เก็บพาธจุดเริ่มต้นทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเริ่มต้นของ Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเริ่มต้นของ OpenClaw แต่ไฟล์ที่อ้างอิงไม่มีอยู่
ในแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- สร้างแพ็กเกจหากจุดเริ่มต้นถูกสร้างลงใน `dist`
- อัปเดตข้อมูลเมตาหากย้ายจุดเริ่มต้นแล้ว
- ดู [จุดเริ่มต้นของ Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถระบุได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- กรอก `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้ง
  มากกว่าหนึ่งแหล่ง
- ใช้ `openclaw.install.minHostVersion` สำหรับรุ่นขั้นต่ำของโฮสต์ OpenClaw
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API ของ Plugin OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ลงใน `package.json`
- ใช้รุ่น API ของ Plugin OpenClaw หรือค่าขั้นต่ำของ semver ที่คุณใช้สร้างและทดสอบ
- แยกค่านี้ออกจากรุ่นของแพ็กเกจ รุ่นของแพ็กเกจใช้อธิบาย
  รีลีสของ Plugin ส่วน `openclaw.compat.pluginApi` ใช้อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

รุ่นขั้นต่ำของโฮสต์ในแพ็กเกจไม่ตรงกับข้อมูลเมตารุ่น OpenClaw
ที่ใช้สร้างแพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบข้อมูลเมตาการสร้างของ OpenClaw ภายในแพ็กเกจ เช่น รุ่น OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- ปรับรุ่นขั้นต่ำของโฮสต์ให้ตรงกับช่วงรุ่นโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

รุ่นของแพ็กเกจและรุ่นของ manifest Plugin ไม่ตรงกัน

- ให้ใช้ `package.json#version` เป็นรุ่นรีลีสของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกัน หรือนำ
  ข้อมูลเมตารุ่น manifest ที่ล้าสมัยออกเมื่อข้อมูลเมตาของแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่แพ็กเกจรุ่นใหม่หลังจากเปลี่ยนข้อมูลเมตาที่เผยแพร่แล้ว
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่ใช่ข้อมูลเมตาแพ็กเกจ
OpenClaw ที่รองรับ

- นำฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle` ออก
- เก็บข้อมูลเมตาของ Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บข้อมูลเมตาของจุดเริ่มต้นแพ็กเกจ ความเข้ากันได้ การติดตั้ง การตั้งค่า และแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- เรียกใช้ `npm pack --dry-run` จากรากของแพ็กเกจ
- แก้ไขข้อมูลเมตาของแพ็กเกจที่ไม่ถูกต้อง สคริปต์วงจรชีวิตที่เสียหาย หรือรายการไฟล์ที่
  ทำให้การแพ็กล้มเหลว
- นำ `private: true` ออก หากแพ็กเกจนี้มีไว้สำหรับการเผยแพร่ต่อสาธารณะ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มี
ไฟล์จุดเริ่มต้นที่ประกาศไว้ใน `package.json#openclaw`

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- สร้างจุดเริ่มต้นที่สร้างขึ้นโดยอัตโนมัติก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การสร้าง เพื่อให้รวม
  จุดเริ่มต้นที่ประกาศไว้
- ดู [จุดเริ่มต้นของ Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วไม่มีข้อมูลเมตาของ OpenClaw ซึ่งมีอยู่ในแพ็กเกจ
ต้นฉบับของคุณ

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์ข้อมูลเมตาที่ถูกรวมไว้
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่ามี `openclaw.plugin.json` รวมอยู่ด้วย เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้ข้อมูลเมตาของแพ็กเกจถูกยกเว้น
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ข้อมูลเมตาของ manifest

### manifest-name-missing

ไฟล์ manifest ดั้งเดิมของ Plugin ไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- กำหนดให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และใช้ `id` เป็นรหัสคงที่สำหรับเครื่อง
- ดู [ไฟล์ manifest ของ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

ไฟล์ manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละฟิลด์กับ
  [ข้อมูลอ้างอิงฟิลด์ของ manifest](/th/plugins/manifest#top-level-field-reference)
- นำฟิลด์ที่กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายข้อมูลเมตาของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนการใส่ไว้ใน manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

ไฟล์ manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิงของ contracts](/th/plugins/manifest#contracts-reference)
- นำคีย์สัญญาที่ไม่รองรับออก
- ย้ายพฤติกรรมขณะรันไปไว้ในโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะข้อมูลเมตาแบบคงที่เกี่ยวกับความเป็นเจ้าของความสามารถ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## การย้าย SDK และความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก barrel หลักของ SDK ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก barrel หลักด้วยการนำเข้าจากพาธย่อยสาธารณะที่เจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วยจุดเข้าใช้งานของช่องทาง
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาพาธนำเข้าที่แคบที่สุด
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าพาธ SDK ที่สงวนไว้สำหรับ Plugin ที่รวมมากับระบบหรือสำหรับความเข้ากันได้
ภายใน

- แทนที่การนำเข้า SDK ภายในที่สงวนไว้ของ OpenClaw ด้วยพาธย่อยสาธารณะ
  `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ร้องขอ API สาธารณะจาก OpenClaw
- ใช้ [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกพาธนำเข้าที่รองรับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังคงใช้ตัวช่วยที่เลิกใช้แล้วสำหรับโหลดคลังเซสชันทั้งหมด
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์คลังเซสชันทั้งหมด
- ใช้ `loadSessionStore(...)` ต่อไปเฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้
  ยังคงรองรับ OpenClaw รุ่นเก่าที่จำเป็นต้องใช้ตัวช่วยนี้
- ดู [API ขณะรัน](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังคงใช้ตัวช่วยเขียนคลังเซสชันทั้งหมดที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ในรายการเซสชันที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้างรายการเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์คลังเซสชันทั้งหมด
- ใช้ตัวช่วยเขียนทั้งคลังต่อไปเฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้
  ยังคงรองรับ OpenClaw รุ่นเก่าที่จำเป็นต้องใช้ตัวช่วยเหล่านี้
- ดู [API ขณะรัน](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังคงใช้ตัวช่วยพาธไฟล์เซสชันที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านข้อมูลเมตาของเซสชันตามข้อมูลระบุตัวตนของเอเจนต์และเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อจัดเก็บข้อมูลเมตาของเซสชัน
- ใช้ตัวช่วยข้อมูลระบุตัวตนหรือเป้าหมายของบันทึกบทสนทนา เมื่อโค้ดกำลังเตรียม
  การดำเนินการกับบันทึกบทสนทนา
- อย่าจัดเก็บหรือพึ่งพาพาธไฟล์บันทึกบทสนทนาแบบเดิม
- ดู [API ขณะรัน](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังคงใช้ตัวช่วยเป้าหมายไฟล์บันทึกบทสนทนาที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเพียงข้อมูลระบุตัวตน
  สาธารณะของเซสชัน
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการเป้าหมายแบบมีโครงสร้าง
  สำหรับการดำเนินการกับบันทึกบทสนทนา
- หลีกเลี่ยงการอ่านหรือสร้างเป้าหมายไฟล์บันทึกบทสนทนาแบบเดิมโดยตรง
- ใช้ตัวช่วยแบบเดิมต่อไปเฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ยังคง
  รองรับ OpenClaw รุ่นเก่าที่จำเป็นต้องใช้ตัวช่วยนี้
- ดู [API ขณะรัน](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังคงใช้ตัวช่วยบันทึกบทสนทนาระดับล่างที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับเพิ่มข้อมูลต่อท้ายบันทึกบทสนทนา
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต
  บันทึกบทสนทนา
- ควรใช้พื้นผิวรันไทม์ของบันทึกบทสนทนาแบบมีโครงสร้าง เพื่อให้ OpenClaw สามารถใช้
  ขอบเขตธุรกรรมและการจัดการข้อมูลระบุตัวตนที่ถูกต้อง
- ใช้ตัวช่วยบันทึกบทสนทนาระดับล่างต่อไปเฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้
  ยังคงรองรับ OpenClaw รุ่นเก่าที่จำเป็นต้องใช้ตัวช่วยเหล่านี้
- ดู [API ขณะรัน](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังคงใช้ฮุก `before_agent_start` แบบเดิม

- ย้ายงานแทนที่โมเดลหรือผู้ให้บริการไปยัง `before_model_resolve`
- ย้ายงานแก้ไขพรอมต์หรือบริบทไปยัง `before_prompt_build`
- ใช้ `before_agent_start` ต่อไปเฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ยังคง
  รองรับ OpenClaw รุ่นเก่าที่จำเป็นต้องใช้ฮุกนี้
- ดู [ฮุก](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

ไฟล์ manifest ยังคงใช้ข้อมูลเมตาการยืนยันตัวตนของผู้ให้บริการแบบเดิม `providerAuthEnvVars`

- ทำสำเนาข้อมูลเมตาตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เฉพาะเป็นข้อมูลเมตาสำหรับความเข้ากันได้ ตราบเท่าที่ช่วง
  OpenClaw ที่คุณรองรับยังจำเป็นต้องใช้
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

ไฟล์ manifest ใช้ข้อมูลเมตาตัวแปรสภาพแวดล้อมของช่องทางแบบเดิมหรือรุ่นเก่า โดยไม่มีข้อมูลเมตา
การตั้งค่าหรือการกำหนดค่าปัจจุบันที่ ClawHub คาดหวัง

- กำหนดข้อมูลเมตาตัวแปรสภาพแวดล้อมของช่องทางในรูปแบบเชิงประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะการตั้งค่า
  ได้โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- ทำสำเนาการตั้งค่าช่องทางที่ขับเคลื่อนด้วยตัวแปรสภาพแวดล้อมไปยังข้อมูลเมตาการตั้งค่าปัจจุบัน การกำหนดค่าช่องทาง หรือ
  ช่องทางของแพ็กเกจที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เฉพาะเป็นข้อมูลเมตาสำหรับความเข้ากันได้ ตราบเท่าที่ OpenClaw
  รุ่นเก่าที่ยังรองรับยังจำเป็นต้องใช้
- ดู [ไฟล์ manifest ของ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ไฟล์ manifest ด้านความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจมี `openclaw.security.json` พร้อมการอ้างอิงสคีมาที่ ClawHub
ไม่รับรู้ว่าพร้อมใช้งาน

- นำ URL ของสคีมาออก หากใช้เพื่อให้คำแนะนำเท่านั้น
- ใช้สคีมาแบบกำหนดรุ่นที่มีเอกสารกำกับ หลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจมีไฟล์ manifest ด้านความปลอดภัยที่ไม่รองรับ

- นำ `openclaw.security.json` ออก จนกว่า OpenClaw จะจัดทำเอกสารสคีมา manifest ด้านความปลอดภัย
  แบบกำหนดรุ่นและพฤติกรรมของ ClawHub
- จัดทำเอกสารพฤติกรรมที่อ่อนไหวต่อความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README จนกว่าจะมีสัญญาของ manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## เนื้อหาที่เกี่ยวข้อง

- [CLI ของ ClawHub](/th/clawhub/cli)
- [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ไฟล์ manifest ของ Plugin](/th/plugins/manifest)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
