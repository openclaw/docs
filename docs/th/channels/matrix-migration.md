---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์
summary: วิธีที่ OpenClaw อัปเกรด Plugin Matrix เดิมโดยตรง รวมถึงข้อจำกัดในการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง
title: การย้ายระบบ Matrix
x-i18n:
    generated_at: "2026-07-19T07:01:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475c96914900a5597f37001264bd3d8f69a69dbd0600f2704c2a1be46924fac4
    source_path: channels/matrix-migration.md
    workflow: 16
---

อัปเกรดจาก Plugin สาธารณะ `matrix` ก่อนหน้าไปเป็นการใช้งานปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะคงสิ่งต่าง ๆ ไว้ดังนี้:

- Plugin ยังคงเป็น `@openclaw/matrix`
- ช่องทางยังคงเป็น `matrix`
- การกำหนดค่าของคุณยังคงอยู่ภายใต้ `channels.matrix`
- ข้อมูลประจำตัวที่แคชไว้จะย้ายไปยังสถานะ Plugin `state/openclaw.sqlite` ที่ใช้ร่วมกัน
- สถานะรันไทม์ยังคงอยู่ภายใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์การกำหนดค่าหรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่
แพ็กเกจราก `openclaw` จะไม่รวมโค้ดรันไทม์ Matrix หรือการขึ้นต่อกันของ Matrix SDK
อีกต่อไป หาก `openclaw channels status` แสดงว่ามีการกำหนดค่า Matrix แล้ว แต่ยังไม่ได้ติดตั้ง
Plugin ให้เรียกใช้ `openclaw doctor --fix` หรือ
`openclaw plugins install @openclaw/matrix`; อย่าติดตั้งแพ็กเกจ Matrix SDK
ลงในแพ็กเกจราก OpenClaw

## สิ่งที่การย้ายข้อมูลดำเนินการโดยอัตโนมัติ

การย้ายข้อมูล Matrix จะทำงานเมื่อคุณเรียกใช้ [`openclaw doctor --fix`](/th/gateway/doctor) ไฟล์เสริมข้างที่เก็บ Matrix โดยเฉพาะยังคงใช้เป็นทางเลือกสำรองเมื่อเริ่มต้นไคลเอนต์ แต่การนำเข้าไฟล์ข้อมูลประจำตัวจะทำผ่าน Doctor เท่านั้น รันไทม์จะอ่านเฉพาะสถานะข้อมูลประจำตัว SQLite ที่เป็นมาตรฐาน

การย้ายข้อมูลด้วย Doctor ครอบคลุมสิ่งต่อไปนี้:

- นำเข้าและตรวจสอบไฟล์ `~/.openclaw/credentials/matrix/credentials*.json` ที่เลิกใช้แล้วก่อนเก็บถาวร
- คงการเลือกบัญชีและการกำหนดค่า `channels.matrix` เดิม
- นำเข้าสถานะไฟล์เสริมที่ใช้ไฟล์ (`bot-storage.json` แคชการซิงค์, `recovery-key.json`, `legacy-crypto-migration.json`, สแนปช็อต IndexedDB) ไปยังสถานะ SQLite ของ Matrix โดยไฟล์ที่ย้ายแล้วจะถูกเก็บถาวรพร้อมส่วนต่อท้าย `.migrated`
- นำรากที่เก็บแฮชโทเค็นเดิมที่สมบูรณ์ที่สุดกลับมาใช้กับบัญชี Matrix, โฮมเซิร์ฟเวอร์, ผู้ใช้ และอุปกรณ์เดียวกัน เมื่อโทเค็นการเข้าถึงเปลี่ยนแปลงในภายหลัง

## การอัปเกรดจาก OpenClaw รุ่นที่เก่ากว่า 2026.4

รุ่นต่าง ๆ จนถึงสายรุ่น 2026.6 ยังย้ายเลย์เอาต์ Matrix แบบที่เก็บเดียวชนิดแบนดั้งเดิม
(`~/.openclaw/matrix/bot-storage.json` รวมถึง
`~/.openclaw/matrix/crypto/`) และเตรียมการกู้คืนสถานะที่เข้ารหัสจาก
ที่เก็บคริปโต Rust แบบเก่า รุ่นปัจจุบันไม่มีการย้ายข้อมูลดังกล่าวแล้ว

หากกำลังอัปเกรดการติดตั้งที่ยังใช้เลย์เอาต์แบบแบน ให้
อัปเกรดเป็นรุ่น 2026.6 ก่อน เรียกใช้ `openclaw doctor --fix` และเริ่ม Gateway
หนึ่งครั้ง เพื่อย้ายที่เก็บแบบแบนและคีย์ห้องที่สามารถกู้คืนได้ จากนั้นจึงอัปเดต
เป็นรุ่นล่าสุด

Plugin Matrix สาธารณะก่อนหน้า **ไม่ได้** สร้างข้อมูลสำรองคีย์ห้อง Matrix โดยอัตโนมัติ หากการติดตั้งเดิมมีประวัติที่เข้ารหัสซึ่งจัดเก็บเฉพาะภายในเครื่องและไม่เคยสำรองไว้ ข้อความที่เข้ารหัสเก่าบางรายการอาจยังคงอ่านไม่ได้หลังการอัปเกรด ไม่ว่าจะใช้เส้นทางการย้ายข้อมูลใดก็ตาม

## ขั้นตอนการอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Plugin Matrix ตามปกติ
2. เรียกใช้:

   ```bash
   openclaw doctor --fix
   ```

3. เริ่มหรือเริ่ม Gateway ใหม่
4. ตรวจสอบสถานะการยืนยันและการสำรองข้อมูลปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ใส่คีย์กู้คืนสำหรับบัญชี Matrix ที่กำลังซ่อมแซมไว้ในตัวแปรสภาพแวดล้อมเฉพาะบัญชี สำหรับบัญชีเริ่มต้นเพียงบัญชีเดียว ใช้ `MATRIX_RECOVERY_KEY` ได้ สำหรับหลายบัญชี ให้ใช้หนึ่งตัวแปรต่อหนึ่งบัญชี เช่น `MATRIX_RECOVERY_KEY_ASSISTANT` และเพิ่ม `--account assistant` ลงในคำสั่ง

6. หาก OpenClaw แจ้งว่าต้องใช้คีย์กู้คืน ให้เรียกใช้คำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน ให้เรียกใช้คำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   หากคีย์กู้คืนได้รับการยอมรับและข้อมูลสำรองใช้งานได้ แต่ `Cross-signing verified`
   ยังคงเป็น `no` ให้ดำเนินการยืนยันตนเองให้เสร็จจากไคลเอนต์ Matrix อื่น:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอในไคลเอนต์ Matrix อื่น เปรียบเทียบอีโมจิหรือตัวเลขฐานสิบ
   และพิมพ์ `yes` เฉพาะเมื่อตรงกัน คำสั่งจะรอจนข้อมูลประจำตัว Matrix
   ได้รับความเชื่อถืออย่างสมบูรณ์ก่อนรายงานว่าสำเร็จ

8. หากคุณตั้งใจละทิ้งประวัติเก่าที่กู้คืนไม่ได้ และต้องการเส้นฐานข้อมูลสำรองใหม่สำหรับข้อความในอนาคต ให้เรียกใช้:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อต้องการไม่ให้คีย์กู้คืนเก่าปลดล็อกข้อมูลสำรองใหม่ได้อีกต่อไป

9. หากยังไม่มีข้อมูลสำรองคีย์ฝั่งเซิร์ฟเวอร์ ให้สร้างข้อมูลสำรองสำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## ข้อความทั่วไปและความหมาย

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: ทางเลือกสำรองฝั่งไคลเอนต์ Matrix พบสถานะไฟล์เสริมที่ใช้ไฟล์ แต่การนำเข้าสู่ SQLite ล้มเหลว OpenClaw จะย้อนคืนการย้ายที่เสร็จสมบูรณ์แล้วและยกเลิกทางเลือกสำรองนั้น แทนที่จะเริ่มต้นด้วยที่เก็บใหม่โดยไม่แจ้งให้ทราบ
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์หรือข้อขัดแย้ง รักษาสถานะเก่าไว้โดยไม่เปลี่ยนแปลง และลองอีกครั้งหลังแก้ไขข้อผิดพลาดแล้ว

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกตรึงไว้กับการติดตั้งจากพาธ ดังนั้นการอัปเดตสายหลักจะไม่แทนที่ด้วยแพ็กเกจ Matrix เริ่มต้นโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อต้องการกลับไปใช้ Plugin Matrix เริ่มต้น

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: ระเบียนการติดตั้ง Plugin ของคุณชี้ไปยังพาธภายในเครื่องที่ไม่มีอยู่แล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากกำลังเรียกใช้จากการเช็กเอาต์รีโพ ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin` นอกจากนี้ `openclaw doctor --fix` ยังสามารถลบการอ้างอิง Plugin Matrix ที่ล้าสมัยให้คุณได้ด้วย

### ข้อความสำหรับการกู้คืนด้วยตนเอง

`openclaw matrix verify status` และ `openclaw matrix verify backup status` จะแสดงบรรทัด `Backup issue:` พร้อมคำแนะนำ `Next steps:` เมื่อข้อมูลสำรองคีย์ห้องบนอุปกรณ์นี้ไม่อยู่ในสถานะสมบูรณ์:

| ปัญหาข้อมูลสำรอง                                                          | ความหมาย                                            | วิธีแก้ไข                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | ไม่มีข้อมูลให้กู้คืน                            | `openclaw matrix verify bootstrap` เพื่อสร้างข้อมูลสำรองคีย์ห้อง                                                                            |
| `backup decryption key is not loaded on this device`                  | มีคีย์อยู่แต่ไม่ได้ใช้งานที่นี่                  | `openclaw matrix verify backup restore`; หากยังโหลดคีย์ไม่ได้ ให้ส่งคีย์กู้คืนผ่านไพป์ไปยัง `--recovery-key-stdin`                |
| `backup decryption key could not be loaded from secret storage (...)` | การโหลดที่เก็บข้อมูลลับล้มเหลวหรือไม่รองรับ       | ส่งคีย์กู้คืนผ่านไพป์: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | คีย์ที่จัดเก็บไว้ไม่ตรงกับข้อมูลสำรองที่ใช้งานอยู่บนเซิร์ฟเวอร์ | เรียกใช้ `verify backup restore --recovery-key-stdin` อีกครั้งโดยใช้คีย์ข้อมูลสำรองที่ใช้งานอยู่บนเซิร์ฟเวอร์ หรือใช้ `verify backup reset --yes` สำหรับเส้นฐานใหม่ |
| `backup signature chain is not trusted by this device`                | อุปกรณ์ยังไม่เชื่อถือสายโซ่การเซ็นข้าม  | ใช้ `verify device --recovery-key-stdin` แล้วใช้ `verify self` จากไคลเอนต์อื่นที่ได้รับการยืนยัน หากความเชื่อถือยังไม่สมบูรณ์                        |
| `backup exists but is not active on this device`                      | มีข้อมูลสำรองบนเซิร์ฟเวอร์ แต่เซสชันภายในเครื่องไม่ได้ใช้งาน      | ยืนยันอุปกรณ์ก่อน แล้วตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`                                                         |
| `backup trust state could not be fully determined`                    | การวินิจฉัยยังไม่ได้ข้อสรุป                      | `openclaw matrix verify status --verbose`                                                                                                 |

ข้อผิดพลาดอื่น ๆ ในการกู้คืน:

`Matrix recovery key is required`

- ความหมาย: คุณพยายามดำเนินขั้นตอนการกู้คืนโดยไม่ได้ระบุคีย์กู้คืน ทั้งที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: เรียกใช้คำสั่งอีกครั้งพร้อม `--recovery-key-stdin` เช่น `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Invalid Matrix recovery key: ...`

- ความหมาย: ไม่สามารถแยกวิเคราะห์คีย์ที่ระบุได้ หรือคีย์ไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองอีกครั้งโดยใช้คีย์กู้คืนที่ถูกต้องทุกอักขระจากไคลเอนต์ Matrix หรือไฟล์ส่งออกคีย์กู้คืน

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: คีย์กู้คืนปลดล็อกข้อมูลสำรองที่ใช้งานได้แล้ว แต่ Matrix ยังไม่ได้สร้างความเชื่อถือข้อมูลประจำตัวแบบการเซ็นข้ามอย่างสมบูรณ์สำหรับอุปกรณ์นี้ ตรวจสอบเอาต์พุตคำสั่งสำหรับ `Recovery key accepted`, `Backup usable`, `Cross-signing verified` และ `Device verified by owner`
- สิ่งที่ต้องทำ: เรียกใช้ `openclaw matrix verify self` ยอมรับคำขอในไคลเอนต์ Matrix อื่น เปรียบเทียบ SAS และพิมพ์ `yes` เฉพาะเมื่อตรงกัน ใช้ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` เฉพาะเมื่อตั้งใจแทนที่ข้อมูลประจำตัวการเซ็นข้ามปัจจุบัน

หากยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าซึ่งกู้คืนไม่ได้ คุณสามารถรีเซ็ต
เส้นฐานข้อมูลสำรองปัจจุบันด้วย `openclaw matrix verify backup reset --yes` แทนได้ เมื่อ
ข้อมูลลับของข้อมูลสำรองที่จัดเก็บไว้เสียหาย การรีเซ็ตนี้จะซ่อมแซมที่เก็บข้อมูลลับด้วย เพื่อให้
โหลดคีย์ข้อมูลสำรองใหม่ได้อย่างถูกต้องหลังเริ่มระบบใหม่

## หากประวัติที่เข้ารหัสยังไม่กลับมา

เรียกใช้การตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

หากกู้คืนข้อมูลสำรองสำเร็จ แต่ประวัติในห้องเก่าบางห้องยังหายไป เป็นไปได้ว่าคีย์ที่หายไปเหล่านั้นไม่เคยได้รับการสำรองโดย Plugin ก่อนหน้า

## หากต้องการเริ่มต้นใหม่สำหรับข้อความในอนาคต

หากยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าซึ่งกู้คืนไม่ได้ และต้องการเพียงเส้นฐานข้อมูลสำรองที่สะอาดสำหรับการใช้งานนับจากนี้ ให้เรียกใช้คำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากอุปกรณ์ยังไม่ได้รับการยืนยันหลังจากนั้น ให้ดำเนินการยืนยันจากไคลเอนต์ Matrix ให้เสร็จโดยเปรียบเทียบอีโมจิ SAS หรือรหัสตัวเลขฐานสิบ และยืนยันว่าตรงกัน

## เนื้อหาที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix): การตั้งค่าและการกำหนดค่าช่องทาง
- [กฎพุชของ Matrix](/th/channels/matrix-push-rules): การกำหนดเส้นทางการแจ้งเตือน
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานะและตัวทริกเกอร์การย้ายข้อมูลอัตโนมัติ
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด (การย้ายเครื่อง การนำเข้าข้ามระบบ)
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
