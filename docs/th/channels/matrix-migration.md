---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์
summary: วิธีที่ OpenClaw อัปเกรด Plugin Matrix เดิมในตำแหน่งเดิม รวมถึงข้อจำกัดในการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง
title: การย้ายข้อมูล Matrix
x-i18n:
    generated_at: "2026-07-16T18:44:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

อัปเกรดจาก Plugin สาธารณะรุ่นก่อนหน้า `matrix` เป็นการใช้งานปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะคงสิ่งต่าง ๆ ไว้ดังเดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- ช่องทางยังคงเป็น `matrix`
- การกำหนดค่าของคุณยังคงอยู่ภายใต้ `channels.matrix`
- ข้อมูลประจำตัวที่แคชไว้ยังคงอยู่ภายใต้ `~/.openclaw/credentials/matrix/`
- สถานะรันไทม์ยังคงอยู่ภายใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์การกำหนดค่าหรือติดตั้ง Plugin ใหม่ด้วยชื่อใหม่
แพ็กเกจหลัก `openclaw` จะไม่รวมโค้ดรันไทม์ Matrix หรือการขึ้นต่อกันของ Matrix SDK
อีกต่อไป หาก `openclaw channels status` แสดงว่ามีการกำหนดค่า Matrix แล้ว แต่ยังไม่ได้ติดตั้ง
Plugin ให้เรียกใช้ `openclaw doctor --fix` หรือ
`openclaw plugins install @openclaw/matrix`; อย่าติดตั้งแพ็กเกจ Matrix SDK
ลงในแพ็กเกจหลัก OpenClaw

## สิ่งที่การย้ายข้อมูลดำเนินการโดยอัตโนมัติ

การย้ายข้อมูล Matrix จะทำงานเมื่อคุณเรียกใช้ [`openclaw doctor --fix`](/th/gateway/doctor) และจะทำงานเป็นทางเลือกสำรองเมื่อไคลเอนต์ Matrix เริ่มต้นและยังพบสถานะไฟล์เสริมอยู่ข้างที่เก็บ SQLite

การย้ายข้อมูลอัตโนมัติครอบคลุมสิ่งต่อไปนี้:

- นำข้อมูลประจำตัว Matrix ที่แคชไว้ของคุณกลับมาใช้
- คงการเลือกบัญชีเดิมและการกำหนดค่า `channels.matrix`
- นำเข้าสถานะไฟล์เสริม (`bot-storage.json` แคชการซิงค์, `recovery-key.json`, `legacy-crypto-migration.json`, สแนปช็อต IndexedDB) ไปยังสถานะ Matrix ใน SQLite; ไฟล์ที่ย้ายแล้วจะถูกเก็บถาวรโดยเติมส่วนต่อท้าย `.migrated`
- นำรากที่เก็บแฮชโทเค็นเดิมซึ่งสมบูรณ์ที่สุดสำหรับบัญชี Matrix, โฮมเซิร์ฟเวอร์, ผู้ใช้ และอุปกรณ์เดียวกันกลับมาใช้ เมื่อโทเค็นการเข้าถึงมีการเปลี่ยนแปลงในภายหลัง

## การอัปเกรดจาก OpenClaw รุ่นก่อน 2026.4

รุ่นต่าง ๆ จนถึงสายรุ่น 2026.6 ยังย้ายเค้าโครง Matrix แบบที่เก็บเดียวในระดับเดียวกันดั้งเดิม
(`~/.openclaw/matrix/bot-storage.json` รวมถึง
`~/.openclaw/matrix/crypto/`) และเตรียมการกู้คืนสถานะที่เข้ารหัสจาก
ที่เก็บการเข้ารหัส Rust เดิม รุ่นปัจจุบันไม่รองรับการย้ายข้อมูลดังกล่าวอีกต่อไป

หากคุณกำลังอัปเกรดการติดตั้งที่ยังใช้เค้าโครงแบบระดับเดียวกัน ให้
อัปเกรดเป็นรุ่น 2026.6 ก่อน เรียกใช้ `openclaw doctor --fix` แล้วเริ่ม Gateway
หนึ่งครั้ง เพื่อย้ายที่เก็บแบบระดับเดียวกันและคีย์ห้องใด ๆ ที่กู้คืนได้ จากนั้นจึงอัปเดต
เป็นรุ่นล่าสุด

Plugin Matrix สาธารณะรุ่นก่อนไม่ได้สร้างข้อมูลสำรองคีย์ห้อง Matrix โดยอัตโนมัติ หากการติดตั้งเดิมของคุณมีประวัติที่เข้ารหัสซึ่งอยู่ในเครื่องเท่านั้นและไม่เคยสำรองไว้ ข้อความที่เข้ารหัสเก่าบางส่วนอาจยังคงอ่านไม่ได้หลังการอัปเกรด ไม่ว่าจะใช้เส้นทางการย้ายข้อมูลใดก็ตาม

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

5. ใส่คีย์กู้คืนสำหรับบัญชี Matrix ที่คุณกำลังซ่อมแซมไว้ในตัวแปรสภาพแวดล้อมเฉพาะบัญชี สำหรับบัญชีเริ่มต้นบัญชีเดียว ใช้ `MATRIX_RECOVERY_KEY` ได้ สำหรับหลายบัญชี ให้ใช้ตัวแปรหนึ่งตัวต่อบัญชี ตัวอย่างเช่น `MATRIX_RECOVERY_KEY_ASSISTANT` และเพิ่ม `--account assistant` ในคำสั่ง

6. หาก OpenClaw แจ้งว่าจำเป็นต้องใช้คีย์กู้คืน ให้เรียกใช้คำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน ให้เรียกใช้คำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   หากระบบยอมรับคีย์กู้คืนและสามารถใช้ข้อมูลสำรองได้ แต่ `Cross-signing verified`
   ยังคงเป็น `no` ให้ทำการยืนยันตนเองให้เสร็จสมบูรณ์จากไคลเอนต์ Matrix อื่น:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอในไคลเอนต์ Matrix อื่น เปรียบเทียบอีโมจิหรือตัวเลขทศนิยม
   และพิมพ์ `yes` เฉพาะเมื่อตรงกันเท่านั้น คำสั่งจะรอจนกว่าอัตลักษณ์ Matrix
   จะได้รับความเชื่อถืออย่างสมบูรณ์ก่อนรายงานว่าสำเร็จ

8. หากคุณตั้งใจละทิ้งประวัติเก่าที่กู้คืนไม่ได้และต้องการสร้างข้อมูลสำรองตั้งต้นใหม่สำหรับข้อความในอนาคต ให้เรียกใช้:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อต้องการให้คีย์กู้คืนเดิมไม่สามารถปลดล็อกข้อมูลสำรองใหม่ได้อีกต่อไป

9. หากยังไม่มีข้อมูลสำรองคีย์ฝั่งเซิร์ฟเวอร์ ให้สร้างข้อมูลสำรองไว้สำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## ข้อความทั่วไปและความหมาย

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: ทางเลือกสำรองฝั่งไคลเอนต์ Matrix พบสถานะไฟล์เสริม แต่การนำเข้าไปยัง SQLite ล้มเหลว OpenClaw จะย้อนกลับการย้ายที่เสร็จสมบูรณ์แล้วและยกเลิกทางเลือกสำรองดังกล่าว แทนที่จะเริ่มต้นด้วยที่เก็บใหม่โดยไม่มีการแจ้งเตือน
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ระบบไฟล์หรือข้อขัดแย้ง รักษาสถานะเดิมไว้โดยไม่เปลี่ยนแปลง และลองอีกครั้งหลังจากแก้ไขข้อผิดพลาดแล้ว

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกตรึงไว้กับการติดตั้งจากพาธ ดังนั้นการอัปเดตสายหลักจะไม่แทนที่ด้วยแพ็กเกจ Matrix เริ่มต้นโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อต้องการกลับไปใช้ Plugin Matrix เริ่มต้น

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: ระเบียนการติดตั้ง Plugin ของคุณชี้ไปยังพาธภายในเครื่องที่ไม่มีอยู่แล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณกำลังเรียกใช้จากการเช็กเอาต์รีโพ ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin` นอกจากนี้ `openclaw doctor --fix` ยังสามารถลบการอ้างอิง Plugin Matrix ที่ล้าสมัยให้คุณได้

### ข้อความการกู้คืนด้วยตนเอง

`openclaw matrix verify status` และ `openclaw matrix verify backup status` จะแสดงบรรทัด `Backup issue:` พร้อมคำแนะนำ `Next steps:` เมื่อข้อมูลสำรองคีย์ห้องบนอุปกรณ์นี้ไม่อยู่ในสถานะสมบูรณ์:

| ปัญหาของข้อมูลสำรอง                                                          | ความหมาย                                            | วิธีแก้ไข                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | ไม่มีข้อมูลสำหรับกู้คืน                            | `openclaw matrix verify bootstrap` เพื่อสร้างข้อมูลสำรองคีย์ห้อง                                                                            |
| `backup decryption key is not loaded on this device`                  | มีคีย์อยู่แต่ยังไม่ทำงานที่นี่                  | `openclaw matrix verify backup restore`; หากยังโหลดคีย์ไม่ได้ ให้ส่งคีย์กู้คืนผ่านไพป์ด้วย `--recovery-key-stdin`                |
| `backup decryption key could not be loaded from secret storage (...)` | การโหลดที่เก็บข้อมูลลับล้มเหลวหรือไม่ได้รับการรองรับ       | ส่งคีย์กู้คืนผ่านไพป์: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | คีย์ที่เก็บไว้ไม่ตรงกับข้อมูลสำรองที่ใช้งานอยู่บนเซิร์ฟเวอร์ | เรียกใช้ `verify backup restore --recovery-key-stdin` อีกครั้งด้วยคีย์ของข้อมูลสำรองที่ใช้งานอยู่บนเซิร์ฟเวอร์ หรือใช้ `verify backup reset --yes` เพื่อสร้างข้อมูลตั้งต้นใหม่ |
| `backup signature chain is not trusted by this device`                | อุปกรณ์ยังไม่เชื่อถือสายการลงนามข้ามอุปกรณ์  | `verify device --recovery-key-stdin` จากนั้นใช้ `verify self` จากไคลเอนต์อื่นที่ยืนยันแล้ว หากความเชื่อถือยังไม่สมบูรณ์                        |
| `backup exists but is not active on this device`                      | มีข้อมูลสำรองบนเซิร์ฟเวอร์ แต่เซสชันภายในเครื่องไม่ทำงาน      | ยืนยันอุปกรณ์ก่อน แล้วตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`                                                         |
| `backup trust state could not be fully determined`                    | การวินิจฉัยยังไม่สามารถสรุปผลได้                      | `openclaw matrix verify status --verbose`                                                                                                 |

ข้อผิดพลาดการกู้คืนอื่น ๆ:

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนการกู้คืนโดยไม่ได้ระบุคีย์กู้คืน ทั้งที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: เรียกใช้คำสั่งอีกครั้งโดยระบุ `--recovery-key-stdin` ตัวอย่างเช่น `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Invalid Matrix recovery key: ...`

- ความหมาย: ไม่สามารถแยกวิเคราะห์คีย์ที่ระบุได้ หรือคีย์ไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองอีกครั้งโดยใช้คีย์กู้คืนที่ถูกต้องจากไคลเอนต์ Matrix หรือจากการส่งออกคีย์กู้คืน

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: คีย์กู้คืนปลดล็อกข้อมูลสำรองที่ใช้งานได้แล้ว แต่ Matrix ยังไม่ได้สร้างความเชื่อถืออัตลักษณ์จากการลงนามข้ามอุปกรณ์อย่างสมบูรณ์สำหรับอุปกรณ์นี้ ตรวจสอบผลลัพธ์คำสั่งสำหรับ `Recovery key accepted`, `Backup usable`, `Cross-signing verified` และ `Device verified by owner`
- สิ่งที่ต้องทำ: เรียกใช้ `openclaw matrix verify self` ยอมรับคำขอในไคลเอนต์ Matrix อื่น เปรียบเทียบ SAS และพิมพ์ `yes` เฉพาะเมื่อตรงกันเท่านั้น ใช้ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจแทนที่อัตลักษณ์การลงนามข้ามอุปกรณ์ปัจจุบัน

หากคุณยอมรับการสูญเสียประวัติเก่าที่เข้ารหัสและกู้คืนไม่ได้ คุณสามารถรีเซ็ต
ข้อมูลสำรองตั้งต้นปัจจุบันด้วย `openclaw matrix verify backup reset --yes` แทนได้ เมื่อ
ข้อมูลลับของข้อมูลสำรองที่เก็บไว้เสียหาย การรีเซ็ตดังกล่าวจะซ่อมแซมที่เก็บข้อมูลลับด้วย เพื่อให้
สามารถโหลดคีย์ข้อมูลสำรองใหม่ได้อย่างถูกต้องหลังเริ่มระบบใหม่

## หากประวัติที่เข้ารหัสยังไม่กลับมา

เรียกใช้การตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

หากกู้คืนข้อมูลสำรองสำเร็จ แต่ห้องเก่าบางห้องยังไม่มีประวัติ เป็นไปได้ว่าคีย์ที่หายไปเหล่านั้นไม่เคยได้รับการสำรองโดย Plugin รุ่นก่อนหน้า

## หากต้องการเริ่มต้นใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสียประวัติเก่าที่เข้ารหัสและกู้คืนไม่ได้ และต้องการเพียงข้อมูลสำรองตั้งต้นที่สะอาดสำหรับการใช้งานต่อไป ให้เรียกใช้คำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากอุปกรณ์ยังไม่ได้รับการยืนยันหลังจากนั้น ให้ยืนยันให้เสร็จสมบูรณ์จากไคลเอนต์ Matrix โดยเปรียบเทียบอีโมจิ SAS หรือรหัสตัวเลขทศนิยม และยืนยันว่าตรงกัน

## ที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix): การตั้งค่าช่องทางและการกำหนดค่า
- [กฎการพุชของ Matrix](/th/channels/matrix-push-rules): การกำหนดเส้นทางการแจ้งเตือน
- [Doctor](/th/gateway/doctor): การตรวจสอบสถานะและทริกเกอร์การย้ายข้อมูลอัตโนมัติ
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด (การย้ายเครื่องและการนำเข้าข้ามระบบ)
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
