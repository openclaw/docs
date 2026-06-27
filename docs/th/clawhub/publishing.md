---
read_when:
    - การเผยแพร่ Skills หรือ Plugin
    - การดีบักข้อผิดพลาดเกี่ยวกับเจ้าของหรือขอบเขตแพ็กเกจ
    - การเพิ่ม UI สำหรับเผยแพร่, CLI หรือพฤติกรรมแบ็กเอนด์
summary: วิธีการทำงานของการเผยแพร่ ClawHub สำหรับ Skills, Plugin, เจ้าของ, ขอบเขต, รุ่นเผยแพร่ และการรีวิว.
x-i18n:
    generated_at: "2026-06-27T17:18:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# การเผยแพร่

การเผยแพร่จะส่งโฟลเดอร์ Skills หรือแพ็กเกจ Plugin ไปยัง ClawHub ภายใต้เจ้าของที่คุณ
เลือก ClawHub จะตรวจสอบว่า token ของคุณสามารถเผยแพร่ให้เจ้าของนั้นได้ ตรวจสอบ
metadata, ชื่อ, เวอร์ชัน, ไฟล์ และข้อมูลแหล่งที่มา จากนั้นจัดเก็บ release
และเริ่มการตรวจสอบความปลอดภัยอัตโนมัติ

หากการตรวจสอบไม่ผ่าน จะไม่มีสิ่งใดถูกเผยแพร่ release ใหม่อาจยังไม่ปรากฏใน
พื้นผิวการติดตั้งและดาวน์โหลดปกติจนกว่าการรีวิวจะเสร็จสิ้น

## Skills

เส้นทางการเผยแพร่ที่ง่ายที่สุดคือ CLI ลงชื่อเข้าใช้ แล้วเผยแพร่โฟลเดอร์ Skills
ในเครื่อง:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

ใช้ `--owner <handle>` เมื่อเผยแพร่ไปยังเจ้าของแบบองค์กร เว้นไว้เพื่อเผยแพร่ในฐานะ
ผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว การเผยแพร่จะข้ามเนื้อหาที่ไม่เปลี่ยนแปลง Skills ใหม่จะเริ่ม
ที่ `1.0.0` และการเปลี่ยนแปลงภายหลังจะเผยแพร่เป็นเวอร์ชัน patch ถัดไปโดยอัตโนมัติ ส่ง
`--version` เฉพาะเมื่อคุณต้องการระบุเวอร์ชันอย่างชัดเจน

สำหรับ repo แค็ตตาล็อก ให้ใช้
[`skill-publish.yml` workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ที่นำกลับมาใช้ใหม่ได้ของ ClawHub โดยจะเรียก `skill publish` สำหรับโฟลเดอร์ Skills
ระดับแรกแต่ละโฟลเดอร์ภายใต้ `root` (ค่าเริ่มต้น:
`skills`) หรือเฉพาะโฟลเดอร์ที่ระบุเป็น `skill_path`

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

ใช้ `dry_run: true` เพื่อดูตัวอย่าง Skills ใหม่และที่เปลี่ยนแปลงโดยไม่เผยแพร่

## Plugin

Plugin ใช้ชื่อแพ็กเกจแบบ npm ชื่อแพ็กเกจที่มี scope จะมีเจ้าของอยู่ใน
ส่วนแรกของชื่อ:

```text
@owner/package-name
```

scope ต้องตรงกับเจ้าของการเผยแพร่ที่เลือก หากแพ็กเกจของคุณชื่อ
`@openclaw/dronzer` จะเผยแพร่ได้เฉพาะในฐานะ `@openclaw` เท่านั้น หากคุณเผยแพร่ในฐานะ
`@vintageayu` ให้เปลี่ยนชื่อแพ็กเกจเป็น `@vintageayu/dronzer`

สิ่งนี้ป้องกันไม่ให้แพ็กเกจอ้าง namespace ขององค์กรที่ผู้เผยแพร่ไม่ได้
ควบคุม

หากคุณเป็นเจ้าของโดยชอบธรรมขององค์กร แบรนด์ scope แพ็กเกจ handle เจ้าของ หรือ
namespace ที่ถูกอ้างสิทธิ์หรือสงวนไว้แล้วบน ClawHub ให้เปิด
[ปัญหาการอ้างสิทธิ์องค์กร / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่อ่อนไหว ดู
[การอ้างสิทธิ์องค์กรและ namespace](/th/clawhub/namespace-claims) เพื่อดูสิ่งที่ควรรวมไว้และสิ่งที่
ไม่ควรใส่ในปัญหาสาธารณะ

### ก่อนเผยแพร่ Plugin

- เลือกเจ้าของที่ตรงกับ scope ของแพ็กเกจ
- รวม `openclaw.plugin.json` ไว้ด้วย Plugin ที่เป็นโค้ดยังต้องมี `package.json` พร้อม
  `openclaw.compat.pluginApi` และ `openclaw.build.openclawVersion`
- หากต้องการแสดงไอคอนการ์ด Plugin แบบกำหนดเอง ให้เพิ่ม `icon` ใน `openclaw.plugin.json` พร้อม
  URL รูปภาพ HTTPS ใดก็ได้
- รวม repository แหล่งที่มาและ metadata ของ commit ที่เจาะจง หรือใช้ CLI จาก
  checkout ที่อิงกับ GitHub เพื่อให้ตรวจจับข้อมูลเหล่านั้นได้
- รัน `clawhub package validate <source>` ก่อนเผยแพร่ สำหรับผลการตรวจพบเกี่ยวกับแพ็กเกจ,
  manifest, การ import SDK หรือ artifact โปรดดู
  [การแก้ไขการตรวจสอบ Plugin](/th/clawhub/plugin-validation-fixes)
- รัน `clawhub package publish <source> --dry-run` ก่อนสร้าง release
- คาดว่า release ใหม่จะยังไม่ปรากฏในพื้นผิวการติดตั้งสาธารณะจนกว่าการตรวจสอบความปลอดภัย
  อัตโนมัติและการยืนยันจะเสร็จสิ้น

### การเผยแพร่ที่เชื่อถือได้สำหรับแพ็กเกจ

การตั้งค่าการเผยแพร่ที่เชื่อถือได้สำหรับแพ็กเกจมีสองขั้นตอน:

1. เผยแพร่แพ็กเกจหนึ่งครั้งผ่าน `clawhub package publish` แบบปกติที่ทำด้วยตนเองหรือยืนยันตัวตนด้วย token
   สิ่งนี้จะสร้างแถวแพ็กเกจและกำหนดผู้จัดการแพ็กเกจที่สามารถเปลี่ยน config
   ผู้เผยแพร่ที่เชื่อถือได้ของแพ็กเกจ
2. ผู้จัดการแพ็กเกจตั้งค่า config ผู้เผยแพร่ที่เชื่อถือได้ของ GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

หลังจากตั้งค่า config แล้ว การเผยแพร่ผ่าน GitHub Actions ที่รองรับในอนาคตสามารถใช้
OIDC/การเผยแพร่ที่เชื่อถือได้โดยไม่ต้องเก็บ token ของ ClawHub ที่มีอายุยาวไว้ใน
repository repository และชื่อไฟล์ workflow ที่กำหนดไว้ต้องตรงกับ
claim OIDC ของ GitHub Actions หากคุณส่ง `--environment <name>` ด้วย claim environment
ของ GitHub Actions ต้องตรงกับชื่อนั้นทุกประการ

ClawHub จะยืนยัน repository GitHub ที่กำหนดไว้เมื่อตั้งค่า config ผู้เผยแพร่ที่เชื่อถือได้
repository สาธารณะสามารถยืนยันได้ผ่าน metadata สาธารณะของ GitHub
repository ส่วนตัวต้องให้ ClawHub มีสิทธิ์เข้าถึง GitHub สำหรับ repository นั้น
เช่น ผ่านการติดตั้ง ClawHub GitHub App ในอนาคต หรือ integration GitHub
อื่นที่ได้รับอนุญาต

workflow เผยแพร่แพ็กเกจที่นำกลับมาใช้ใหม่ได้ในปัจจุบันรองรับการเผยแพร่ที่เชื่อถือได้แบบไม่ใช้ secret
สำหรับการเผยแพร่ `workflow_dispatch` เมื่อมี `id-token: write`
การเผยแพร่จริงจากการ push tag ยังต้องใช้ `clawhub_token` ดังนั้นให้มี
`CLAWHUB_TOKEN` พร้อมใช้งานสำหรับ release จาก tag, การเผยแพร่ครั้งแรก, แพ็กเกจที่ไม่น่าเชื่อถือ,
หรือการเผยแพร่กรณีฉุกเฉิน

ตรวจสอบหรือลบ config ด้วย:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

การลบ config ผู้เผยแพร่ที่เชื่อถือได้คือเส้นทาง rollback โดยจะปิดการสร้าง token
สำหรับการเผยแพร่ที่เชื่อถือได้ในอนาคตจนกว่าผู้จัดการแพ็กเกจจะตั้งค่า config อีกครั้ง

## คำถามที่พบบ่อย

### scope แพ็กเกจต้องตรงกับเจ้าของที่เลือก

หาก scope แพ็กเกจและเจ้าของที่เลือกไม่ตรงกัน ClawHub จะปฏิเสธการ
เผยแพร่:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

ในการแก้ไข ให้เลือกเจ้าของที่ระบุโดย scope ของแพ็กเกจ หรือเปลี่ยนชื่อ
แพ็กเกจเพื่อให้ scope ตรงกับเจ้าของที่คุณสามารถเผยแพร่ในฐานะนั้นได้

หากชื่อแพ็กเกจมี scope ที่ถูกต้องอยู่แล้ว แต่แพ็กเกจเป็นของผู้เผยแพร่
ที่ไม่ถูกต้อง ให้โอนความเป็นเจ้าของแทน:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

ใช้การโอนแพ็กเกจหรือ Skills เฉพาะเมื่อคุณมีสิทธิ์ admin ทั้งกับ
เจ้าของปัจจุบันและผู้เผยแพร่ปลายทาง การโอนแพ็กเกจไม่ได้อนุญาตให้คุณ
เผยแพร่เข้าสู่ scope ที่คุณจัดการไม่ได้

หากคุณไม่มีสิทธิ์เข้าถึงเจ้าของปัจจุบัน แต่เชื่อว่าองค์กร โปรเจกต์ หรือ
แบรนด์ของคุณเป็นเจ้าของ namespace โดยชอบธรรม ให้เปิด
[ปัญหาการอ้างสิทธิ์องค์กร / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่อ่อนไหวเพื่อให้เจ้าหน้าที่รีวิว ดู
[การอ้างสิทธิ์องค์กรและ namespace](/th/clawhub/namespace-claims) ก่อนยื่นเรื่อง

สิ่งนี้ปกป้อง namespace ขององค์กร แพ็กเกจชื่อ `@openclaw/dronzer` อ้างสิทธิ์
namespace `@openclaw` ดังนั้นมีเพียงผู้เผยแพร่ที่มีสิทธิ์เข้าถึงเจ้าของ `@openclaw`
เท่านั้นที่เผยแพร่ได้
