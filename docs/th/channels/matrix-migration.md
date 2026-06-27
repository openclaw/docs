---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์
summary: OpenClaw อัปเกรด Matrix Plugin เดิมในตำแหน่งเดิมอย่างไร รวมถึงข้อจำกัดการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง
title: การย้ายข้อมูล Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

อัปเกรดจาก Plugin สาธารณะ `matrix` เวอร์ชันก่อนหน้าไปยังการใช้งานปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะทำในตำแหน่งเดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- ช่องทางยังคงเป็น `matrix`
- การตั้งค่าของคุณยังคงอยู่ใต้ `channels.matrix`
- ข้อมูลประจำตัวที่แคชไว้ยังคงอยู่ใต้ `~/.openclaw/credentials/matrix/`
- สถานะรันไทม์ยังคงอยู่ใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์การตั้งค่าหรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่
แพ็กเกจราก `openclaw` ไม่ได้รวมโค้ดรันไทม์ Matrix หรือดีเพนเดนซี Matrix SDK
ไว้อีกต่อไป หาก `openclaw channels status` แสดงว่า Matrix ถูกตั้งค่าแล้วแต่
Plugin หายไปหลังการอัปเดต ให้รัน `openclaw doctor --fix` หรือ
`openclaw plugins install @openclaw/matrix`; อย่าติดตั้งแพ็กเกจ Matrix SDK
ลงในแพ็กเกจราก OpenClaw

## การย้ายข้อมูลทำอะไรโดยอัตโนมัติ

เมื่อ Gateway เริ่มทำงาน และเมื่อคุณรัน [`openclaw doctor --fix`](/th/gateway/doctor) OpenClaw จะพยายามซ่อมแซมสถานะ Matrix เก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้ายข้อมูล Matrix ที่ดำเนินการได้จะเปลี่ยนแปลงสถานะบนดิสก์ OpenClaw จะสร้างหรือใช้สแนปช็อตกู้คืนเฉพาะจุดซ้ำ

เมื่อคุณใช้ `openclaw update` ตัวกระตุ้นที่แน่นอนจะขึ้นอยู่กับวิธีติดตั้ง OpenClaw:

- การติดตั้งจากซอร์สรัน `openclaw doctor --fix` ระหว่างโฟลว์อัปเดต จากนั้นเริ่ม Gateway ใหม่ตามค่าเริ่มต้น
- การติดตั้งผ่านตัวจัดการแพ็กเกจจะอัปเดตแพ็กเกจ รัน doctor แบบไม่โต้ตอบหนึ่งรอบ จากนั้นพึ่งพาการเริ่ม Gateway ใหม่ตามค่าเริ่มต้นเพื่อให้การเริ่มต้นทำงานเสร็จสิ้นการย้ายข้อมูล Matrix
- หากคุณใช้ `openclaw update --no-restart` การย้ายข้อมูล Matrix ที่อิงกับการเริ่มต้นระบบจะถูกเลื่อนออกไปจนกว่าคุณจะรัน `openclaw doctor --fix` และเริ่ม Gateway ใหม่ในภายหลัง

การย้ายข้อมูลอัตโนมัติครอบคลุม:

- การสร้างหรือใช้สแนปช็อตก่อนย้ายข้อมูลซ้ำภายใต้ `~/Backups/openclaw-migrations/`
- การใช้ข้อมูลประจำตัว Matrix ที่แคชไว้ของคุณซ้ำ
- การคงการเลือกบัญชีเดิมและการตั้งค่า `channels.matrix`
- การย้ายที่เก็บซิงค์ Matrix แบบแบนที่เก่าที่สุดไปยังตำแหน่งปัจจุบันที่ผูกกับบัญชี
- การย้ายที่เก็บคริปโต Matrix แบบแบนที่เก่าที่สุดไปยังตำแหน่งปัจจุบันที่ผูกกับบัญชี เมื่อสามารถระบุบัญชีเป้าหมายได้อย่างปลอดภัย
- การดึงคีย์ถอดรหัสสำรอง room-key ของ Matrix ที่เคยบันทึกไว้จากที่เก็บ rust crypto เก่า เมื่อคีย์นั้นมีอยู่ในเครื่อง
- การใช้รากที่เก็บ token-hash เดิมที่สมบูรณ์ที่สุดสำหรับบัญชี Matrix, homeserver และผู้ใช้เดียวกัน เมื่อ access token เปลี่ยนในภายหลัง
- การสแกนรากที่เก็บ token-hash ข้างเคียงเพื่อหาเมตาดาต้ากู้คืนสถานะเข้ารหัสที่ค้างอยู่ เมื่อ access token ของ Matrix เปลี่ยนแต่ข้อมูลระบุตัวตนบัญชี/อุปกรณ์ยังคงเหมือนเดิม
- การกู้คืน room keys ที่สำรองไว้ลงในที่เก็บคริปโตใหม่ในการเริ่มต้น Matrix ครั้งถัดไป

รายละเอียดสแนปช็อต:

- OpenClaw เขียนไฟล์มาร์กเกอร์ที่ `~/.openclaw/matrix/migration-snapshot.json` หลังจากสแนปช็อตสำเร็จ เพื่อให้การเริ่มต้นและรอบซ่อมแซมภายหลังสามารถใช้ไฟล์เก็บถาวรเดียวกันซ้ำได้
- สแนปช็อตการย้ายข้อมูล Matrix อัตโนมัติเหล่านี้สำรองเฉพาะการตั้งค่า + สถานะ (`includeWorkspace: false`)
- หาก Matrix มีเฉพาะสถานะการย้ายข้อมูลระดับคำเตือนเท่านั้น เช่น เพราะ `userId` หรือ `accessToken` ยังขาดอยู่ OpenClaw จะยังไม่สร้างสแนปช็อต เพราะยังไม่มีการเปลี่ยนแปลง Matrix ใดที่ดำเนินการได้
- หากขั้นตอนสแนปช็อตล้มเหลว OpenClaw จะข้ามการย้ายข้อมูล Matrix สำหรับรอบนั้นแทนที่จะเปลี่ยนแปลงสถานะโดยไม่มีจุดกู้คืน

เกี่ยวกับการอัปเกรดหลายบัญชี:

- ที่เก็บ Matrix แบบแบนที่เก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์แบบที่เก็บเดียว ดังนั้น OpenClaw จึงย้ายได้เฉพาะไปยังเป้าหมายบัญชี Matrix หนึ่งบัญชีที่ระบุได้
- ที่เก็บ Matrix เก่าแบบผูกกับบัญชีอยู่แล้วจะถูกตรวจพบและเตรียมต่อบัญชี Matrix ที่ตั้งค่าไว้

## สิ่งที่การย้ายข้อมูลทำโดยอัตโนมัติไม่ได้

Plugin Matrix สาธารณะก่อนหน้า **ไม่ได้** สร้างการสำรอง room-key ของ Matrix โดยอัตโนมัติ มันเก็บสถานะคริปโตในเครื่องและร้องขอการยืนยันอุปกรณ์ แต่ไม่ได้รับประกันว่า room keys ของคุณถูกสำรองไปยัง homeserver แล้ว

นั่นหมายความว่าการติดตั้งแบบเข้ารหัสบางรายการอาจย้ายข้อมูลได้เพียงบางส่วนเท่านั้น

OpenClaw ไม่สามารถกู้คืนโดยอัตโนมัติได้:

- room keys ที่มีเฉพาะในเครื่องและไม่เคยถูกสำรอง
- สถานะเข้ารหัสเมื่อยังไม่สามารถระบุบัญชี Matrix เป้าหมายได้ เพราะ `homeserver`, `userId` หรือ `accessToken` ยังไม่พร้อมใช้งาน
- การย้ายข้อมูลอัตโนมัติของที่เก็บ Matrix แบบแบนที่ใช้ร่วมกันหนึ่งชุด เมื่อมีการตั้งค่าบัญชี Matrix หลายบัญชีแต่ไม่ได้ตั้งค่า `channels.matrix.defaultAccount`
- การติดตั้งผ่านเส้นทาง Plugin แบบกำหนดเองที่ตรึงไว้กับเส้นทาง repo แทนแพ็กเกจ Matrix มาตรฐาน
- คีย์กู้คืนที่หายไป เมื่อที่เก็บเก่ามีคีย์ที่สำรองไว้แต่ไม่ได้เก็บคีย์ถอดรหัสไว้ในเครื่อง

ขอบเขตคำเตือนปัจจุบัน:

- การติดตั้งผ่านเส้นทาง Plugin Matrix แบบกำหนดเองจะแสดงโดยทั้งการเริ่มต้น Gateway และ `openclaw doctor`

หากการติดตั้งเก่าของคุณมีประวัติเข้ารหัสเฉพาะในเครื่องที่ไม่เคยสำรอง ข้อความเข้ารหัสเก่าบางส่วนอาจยังอ่านไม่ได้หลังอัปเกรด

## โฟลว์อัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Plugin Matrix ตามปกติ
   แนะนำให้ใช้ `openclaw update` ธรรมดาโดยไม่มี `--no-restart` เพื่อให้การเริ่มต้นทำงานเสร็จสิ้นการย้ายข้อมูล Matrix ได้ทันที
2. รัน:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานย้ายข้อมูลที่ดำเนินการได้ doctor จะสร้างหรือใช้สแนปช็อตก่อนย้ายข้อมูลซ้ำก่อน และพิมพ์เส้นทางไฟล์เก็บถาวร

3. เริ่มหรือเริ่ม Gateway ใหม่
4. ตรวจสอบสถานะการยืนยันและการสำรองปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ใส่คีย์กู้คืนสำหรับบัญชี Matrix ที่คุณกำลังซ่อมแซมไว้ในตัวแปรสภาพแวดล้อมเฉพาะบัญชี สำหรับบัญชีเริ่มต้นบัญชีเดียว ใช้ `MATRIX_RECOVERY_KEY` ได้ สำหรับหลายบัญชี ให้ใช้หนึ่งตัวแปรต่อบัญชี เช่น `MATRIX_RECOVERY_KEY_ASSISTANT` และเพิ่ม `--account assistant` ในคำสั่ง

6. หาก OpenClaw แจ้งว่าต้องใช้คีย์กู้คืน ให้รันคำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน ให้รันคำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   หากคีย์กู้คืนได้รับการยอมรับและการสำรองใช้งานได้ แต่ `Cross-signing verified`
   ยังเป็น `no` ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อื่น:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอในไคลเอนต์ Matrix อื่น เปรียบเทียบอีโมจิหรือเลขทศนิยม
   และพิมพ์ `yes` เฉพาะเมื่อค่าตรงกันเท่านั้น คำสั่งจะออกสำเร็จหลังจาก
   `Cross-signing verified` กลายเป็น `yes` เท่านั้น

8. หากคุณตั้งใจละทิ้งประวัติเก่าที่กู้คืนไม่ได้และต้องการ baseline การสำรองใหม่สำหรับข้อความในอนาคต ให้รัน:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. หากยังไม่มีการสำรองคีย์ฝั่งเซิร์ฟเวอร์ ให้สร้างรายการหนึ่งสำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## การย้ายข้อมูลเข้ารหัสทำงานอย่างไร

การย้ายข้อมูลเข้ารหัสเป็นกระบวนการสองขั้น:

1. การเริ่มต้นหรือ `openclaw doctor --fix` สร้างหรือใช้สแนปช็อตก่อนย้ายข้อมูลซ้ำ หากการย้ายข้อมูลเข้ารหัสดำเนินการได้
2. การเริ่มต้นหรือ `openclaw doctor --fix` ตรวจสอบที่เก็บคริปโต Matrix เก่าผ่านการติดตั้ง Plugin Matrix ที่ใช้งานอยู่
3. หากพบคีย์ถอดรหัสสำรอง OpenClaw จะเขียนคีย์นั้นลงในโฟลว์คีย์กู้คืนใหม่และทำเครื่องหมายว่าการกู้คืน room-key ค้างอยู่
4. ในการเริ่มต้น Matrix ครั้งถัดไป OpenClaw จะกู้คืน room keys ที่สำรองไว้ลงในที่เก็บคริปโตใหม่โดยอัตโนมัติ

หากที่เก็บเก่ารายงาน room keys ที่ไม่เคยสำรอง OpenClaw จะแจ้งเตือนแทนที่จะแสร้งว่าการกู้คืนสำเร็จ

## ข้อความทั่วไปและความหมาย

### ข้อความอัปเกรดและการตรวจพบ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบสถานะ Matrix เก่าบนดิสก์และย้ายไปยังเลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ต้องทำ: ไม่ต้องทำอะไร เว้นแต่เอาต์พุตเดียวกันจะมีคำเตือนด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้างไฟล์เก็บถาวรกู้คืนก่อนเปลี่ยนแปลงสถานะ Matrix
- สิ่งที่ต้องทำ: เก็บเส้นทางไฟล์เก็บถาวรที่พิมพ์ไว้จนกว่าคุณจะยืนยันว่าการย้ายข้อมูลสำเร็จ

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบมาร์กเกอร์สแนปช็อตการย้ายข้อมูล Matrix ที่มีอยู่ และใช้ไฟล์เก็บถาวรนั้นซ้ำแทนการสร้างข้อมูลสำรองซ้ำ
- สิ่งที่ต้องทำ: เก็บเส้นทางไฟล์เก็บถาวรที่พิมพ์ไว้จนกว่าคุณจะยืนยันว่าการย้ายข้อมูลสำเร็จ

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มีสถานะ Matrix เก่าอยู่ แต่ OpenClaw ไม่สามารถแมปไปยังบัญชี Matrix ปัจจุบันได้ เพราะยังไม่ได้ตั้งค่า Matrix
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix` จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือเริ่ม Gateway ใหม่

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบสถานะเก่า แต่ยังไม่สามารถระบุรากบัญชี/อุปกรณ์ปัจจุบันที่แน่นอนได้
- สิ่งที่ต้องทำ: เริ่ม Gateway หนึ่งครั้งด้วยการเข้าสู่ระบบ Matrix ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` อีกครั้งหลังจากมีข้อมูลประจำตัวที่แคชไว้แล้ว

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบที่เก็บ Matrix แบบแบนที่ใช้ร่วมกันหนึ่งชุด แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix ที่มีชื่อบัญชีใดควรรับที่เก็บนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือเริ่ม Gateway ใหม่

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งใหม่แบบผูกกับบัญชีมีที่เก็บซิงค์หรือที่เก็บคริปโตอยู่แล้ว ดังนั้น OpenClaw จึงไม่ได้เขียนทับโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่าบัญชีปัจจุบันเป็นบัญชีที่ถูกต้องก่อนลบหรือย้ายเป้าหมายที่ขัดแย้งกันด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` หรือ `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้ายสถานะ Matrix เก่า แต่การดำเนินการของระบบไฟล์ล้มเหลว
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ระบบไฟล์และสถานะดิสก์ จากนั้นรัน `openclaw doctor --fix` อีกครั้ง

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบที่เก็บ Matrix แบบเข้ารหัสเก่า แต่ไม่มีการตั้งค่า Matrix ปัจจุบันให้ผูกกับที่เก็บนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix` จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือเริ่ม Gateway ใหม่

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: มีที่เก็บเข้ารหัสอยู่ แต่ OpenClaw ไม่สามารถตัดสินใจได้อย่างปลอดภัยว่ามันเป็นของบัญชี/อุปกรณ์ปัจจุบันใด
- สิ่งที่ต้องทำ: เริ่ม Gateway หนึ่งครั้งด้วยการเข้าสู่ระบบ Matrix ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` อีกครั้งหลังจากมีข้อมูลประจำตัวที่แคชไว้แล้ว

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบที่เก็บคริปโตเก่าแบบแบนที่ใช้ร่วมกันหนึ่งชุด แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix ที่มีชื่อบัญชีใดควรรับที่เก็บนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือเริ่ม Gateway ใหม่

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบสถานะ Matrix เก่า แต่การย้ายข้อมูลยังถูกบล็อกเพราะขาดข้อมูลระบุตัวตนหรือข้อมูลประจำตัว
- สิ่งที่ต้องทำ: ทำการเข้าสู่ระบบ Matrix หรือการตั้งค่าให้เสร็จ จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือเริ่ม Gateway ใหม่

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบสถานะ Matrix แบบเข้ารหัสเก่า แต่ไม่สามารถโหลด entrypoint ตัวช่วยจาก Matrix Plugin ที่ปกติใช้ตรวจสอบที่เก็บนั้นได้
- สิ่งที่ต้องทำ: ติดตั้งใหม่หรือซ่อมแซม Matrix Plugin (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ checkout ของ repo) แล้วรัน `openclaw doctor --fix` อีกครั้ง หรือรีสตาร์ท gateway

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบพาธไฟล์ตัวช่วยที่หลุดออกจากรากของ Plugin หรือไม่ผ่านการตรวจสอบขอบเขต Plugin จึงปฏิเสธที่จะ import
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่จากพาธที่เชื่อถือได้ แล้วรัน `openclaw doctor --fix` อีกครั้ง หรือรีสตาร์ท gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะแก้ไขสถานะ Matrix เพราะไม่สามารถสร้าง snapshot สำหรับกู้คืนก่อนได้
- สิ่งที่ต้องทำ: แก้ข้อผิดพลาดของการสำรองข้อมูล แล้วรัน `openclaw doctor --fix` อีกครั้ง หรือรีสตาร์ท gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: fallback ฝั่งไคลเอนต์ Matrix พบที่เก็บแบบ flat เก่า แต่การย้ายล้มเหลว ตอนนี้ OpenClaw จะยกเลิก fallback นั้น แทนที่จะเริ่มด้วยที่เก็บใหม่แบบเงียบๆ
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์หรือความขัดแย้งต่างๆ เก็บสถานะเก่าไว้ให้สมบูรณ์ แล้วลองใหม่หลังแก้ข้อผิดพลาด

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกตรึงไว้กับการติดตั้งจากพาธ ดังนั้นการอัปเดตสายหลักจะไม่แทนที่ด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อต้องการกลับไปใช้ Matrix Plugin เริ่มต้น

### ข้อความการกู้คืนสถานะที่เข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: กู้คืนกุญแจห้องที่สำรองไว้เข้าสู่ที่เก็บคริปโตใหม่สำเร็จแล้ว
- สิ่งที่ต้องทำ: โดยปกติไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: กุญแจห้องเก่าบางรายการมีอยู่เฉพาะในที่เก็บภายในเครื่องเก่า และไม่เคยถูกอัปโหลดไปยังข้อมูลสำรอง Matrix
- สิ่งที่ต้องทำ: คาดว่าประวัติที่เข้ารหัสเก่าบางส่วนจะยังไม่พร้อมใช้งาน เว้นแต่คุณจะกู้กุญแจเหล่านั้นด้วยตนเองจากไคลเอนต์อื่นที่ยืนยันแล้วได้

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- ความหมาย: มีข้อมูลสำรองอยู่ แต่ OpenClaw ไม่สามารถกู้คืนกุญแจสำหรับกู้คืนได้โดยอัตโนมัติ
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบที่เก็บที่เข้ารหัสเก่า แต่ไม่สามารถตรวจสอบอย่างปลอดภัยพอที่จะเตรียมการกู้คืนได้
- สิ่งที่ต้องทำ: รัน `openclaw doctor --fix` อีกครั้ง หากเกิดซ้ำ ให้เก็บไดเรกทอรีสถานะเก่าไว้ให้สมบูรณ์ และกู้คืนโดยใช้ไคลเอนต์ Matrix อื่นที่ยืนยันแล้ว พร้อม `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบความขัดแย้งของกุญแจสำรอง และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่ากุญแจกู้คืนใดถูกต้องก่อนลองคำสั่งกู้คืนใดๆ อีกครั้ง

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือข้อจำกัดตายตัวของรูปแบบที่เก็บเก่า
- สิ่งที่ต้องทำ: กุญแจที่สำรองไว้ยังคงกู้คืนได้ แต่ประวัติที่เข้ารหัสแบบ local-only อาจยังไม่พร้อมใช้งาน

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืน แต่ Matrix ส่งข้อผิดพลาดกลับมา
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup status` แล้วลองใหม่ด้วย `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

### ข้อความการกู้คืนด้วยตนเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw รู้ว่าคุณควรมีกุญแจสำรอง แต่กุญแจนั้นยังไม่ทำงานบนอุปกรณ์นี้
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore` หรือกำหนด `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: อุปกรณ์นี้ยังไม่ได้เก็บกุญแจกู้คืนไว้ในปัจจุบัน
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY` รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` แล้วกู้คืนข้อมูลสำรอง

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- ความหมาย: กุญแจที่เก็บไว้ไม่ตรงกับข้อมูลสำรอง Matrix ที่ใช้งานอยู่
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY` เป็นกุญแจที่ถูกต้อง แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

หากคุณยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าที่กู้คืนไม่ได้ คุณสามารถรีเซ็ต
baseline ข้อมูลสำรองปัจจุบันด้วย `openclaw matrix verify backup reset --yes` แทนได้ เมื่อ
ความลับข้อมูลสำรองที่เก็บไว้เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
กุญแจสำรองใหม่โหลดได้ถูกต้องหลังรีสตาร์ท

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- ความหมาย: มีข้อมูลสำรองอยู่ แต่อุปกรณ์นี้ยังไม่เชื่อถือ cross-signing chain อย่างเพียงพอ
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนกู้คืนโดยไม่ได้ระบุกุญแจกู้คืน ทั้งที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: รันคำสั่งอีกครั้งพร้อม `--recovery-key-stdin` เช่น `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Invalid Matrix recovery key: ...`

- ความหมาย: ไม่สามารถแยกวิเคราะห์กุญแจที่ให้มาได้ หรือกุญแจไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองใหม่ด้วยกุญแจกู้คืนที่ตรงทุกตัวอักษรจากไคลเอนต์ Matrix หรือไฟล์ recovery-key ของคุณ

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: OpenClaw สามารถใช้กุญแจกู้คืนได้ แต่ Matrix ยังไม่ได้
  สร้างความเชื่อถือ identity แบบ cross-signing เต็มรูปแบบสำหรับอุปกรณ์นี้ ตรวจสอบ
  เอาต์พุตคำสั่งสำหรับ `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` และ `Device verified by owner`
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify self` ยอมรับคำขอในไคลเอนต์
  Matrix อื่น เปรียบเทียบ SAS แล้วพิมพ์ `yes` เฉพาะเมื่อค่าตรงกัน คำสั่ง
  จะรอจนมีความเชื่อถือ identity ของ Matrix เต็มรูปแบบก่อนรายงานว่าสำเร็จ ใช้
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  เฉพาะเมื่อคุณตั้งใจจะเปลี่ยน identity แบบ cross-signing ปัจจุบัน

`Matrix key backup is not active on this device after loading from secret storage.`

- ความหมาย: secret storage ไม่ได้สร้างเซสชันข้อมูลสำรองที่ใช้งานอยู่บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ก่อน แล้วตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- ความหมาย: อุปกรณ์นี้ไม่สามารถกู้คืนจาก secret storage ได้จนกว่าการยืนยันอุปกรณ์จะเสร็จสมบูรณ์
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` ก่อน

### ข้อความการติดตั้ง Plugin แบบกำหนดเอง

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: ระเบียนการติดตั้ง Plugin ของคุณชี้ไปยังพาธภายในเครื่องที่หายไปแล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณรันจาก checkout ของ repo ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`

## หากประวัติที่เข้ารหัสยังไม่กลับมา

รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

หากกู้คืนข้อมูลสำรองสำเร็จ แต่ห้องเก่าบางห้องยังขาดประวัติอยู่ กุญแจที่หายไปเหล่านั้นอาจไม่เคยถูกสำรองโดย Plugin ก่อนหน้า

## หากคุณต้องการเริ่มใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าที่กู้คืนไม่ได้ และต้องการเพียง baseline ข้อมูลสำรองที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากอุปกรณ์ยังไม่ถูกยืนยันหลังจากนั้น ให้ยืนยันให้เสร็จจากไคลเอนต์ Matrix ของคุณโดยเปรียบเทียบอีโมจิ SAS หรือรหัสทศนิยม แล้วยืนยันว่าตรงกัน

## ที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix): การตั้งค่าและการกำหนดค่าช่องทาง
- [กฎ push ของ Matrix](/th/channels/matrix-push-rules): การกำหนดเส้นทางการแจ้งเตือน
- [ตัวตรวจสุขภาพ](/th/gateway/doctor): การตรวจสุขภาพและตัวกระตุ้นการย้ายข้อมูลอัตโนมัติ
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด (การย้ายเครื่อง, การ import ข้ามระบบ)
- [Plugin](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
