---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์
summary: วิธีที่ OpenClaw อัปเกรด Plugin Matrix เดิมแบบแทนที่ รวมถึงข้อจำกัดในการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง
title: การย้ายข้อมูล Matrix
x-i18n:
    generated_at: "2026-04-30T09:37:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

อัปเกรดจาก Plugin `matrix` สาธารณะก่อนหน้านี้ไปยังการใช้งานปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะทำทับของเดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- ช่องทางยังคงเป็น `matrix`
- คอนฟิกของคุณยังคงอยู่ใต้ `channels.matrix`
- ข้อมูลรับรองที่แคชไว้ยังคงอยู่ใต้ `~/.openclaw/credentials/matrix/`
- สถานะรันไทม์ยังคงอยู่ใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์คอนฟิกหรือติดตั้ง Plugin ใหม่ด้วยชื่อใหม่

## สิ่งที่การย้ายข้อมูลทำโดยอัตโนมัติ

เมื่อ Gateway เริ่มทำงาน และเมื่อคุณเรียกใช้ [`openclaw doctor --fix`](/th/gateway/doctor) OpenClaw จะพยายามซ่อมแซมสถานะ Matrix เก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้ายข้อมูล Matrix ที่ดำเนินการได้จะเปลี่ยนแปลงสถานะบนดิสก์ OpenClaw จะสร้างหรือนำสแนปช็อตกู้คืนเฉพาะจุดกลับมาใช้

เมื่อคุณใช้ `openclaw update` ตัวกระตุ้นที่แน่นอนขึ้นอยู่กับวิธีติดตั้ง OpenClaw:

- การติดตั้งจากซอร์สจะเรียกใช้ `openclaw doctor --fix` ระหว่างขั้นตอนอัปเดต แล้วรีสตาร์ท Gateway ตามค่าเริ่มต้น
- การติดตั้งผ่านตัวจัดการแพ็กเกจจะอัปเดตแพ็กเกจ เรียก doctor แบบไม่โต้ตอบ แล้วพึ่งพาการรีสตาร์ท Gateway ตามค่าเริ่มต้นเพื่อให้การเริ่มต้นทำงานสามารถทำการย้ายข้อมูล Matrix ให้เสร็จ
- หากคุณใช้ `openclaw update --no-restart` การย้ายข้อมูล Matrix ที่พึ่งพาการเริ่มต้นทำงานจะถูกเลื่อนออกไปจนกว่าคุณจะเรียกใช้ `openclaw doctor --fix` และรีสตาร์ท Gateway ในภายหลัง

การย้ายข้อมูลอัตโนมัติครอบคลุม:

- การสร้างหรือนำสแนปช็อตก่อนการย้ายข้อมูลใต้ `~/Backups/openclaw-migrations/` กลับมาใช้
- การนำข้อมูลรับรอง Matrix ที่แคชไว้ของคุณกลับมาใช้
- การคงการเลือกบัญชีและคอนฟิก `channels.matrix` เดิมไว้
- การย้ายที่เก็บซิงก์ Matrix แบบแบนที่เก่าที่สุดไปยังตำแหน่งแบบผูกกับบัญชีในปัจจุบัน
- การย้ายที่เก็บคริปโต Matrix แบบแบนที่เก่าที่สุดไปยังตำแหน่งแบบผูกกับบัญชีในปัจจุบันเมื่อสามารถระบุบัญชีปลายทางได้อย่างปลอดภัย
- การดึงคีย์ถอดรหัสสำรองคีย์ห้อง Matrix ที่เคยบันทึกไว้จากที่เก็บคริปโต rust เก่า เมื่อคีย์นั้นมีอยู่ภายในเครื่อง
- การนำรากที่เก็บโทเค็นแฮชเดิมที่สมบูรณ์ที่สุดกลับมาใช้สำหรับบัญชี Matrix, homeserver และผู้ใช้เดียวกันเมื่อ access token เปลี่ยนในภายหลัง
- การสแกนรากที่เก็บโทเค็นแฮชที่อยู่ข้างเคียงเพื่อหาข้อมูลเมตาการกู้คืนสถานะเข้ารหัสที่ค้างอยู่ เมื่อ access token ของ Matrix เปลี่ยนแต่ตัวตนบัญชี/อุปกรณ์ยังเหมือนเดิม
- การกู้คืนคีย์ห้องที่สำรองไว้เข้าไปในที่เก็บคริปโตใหม่ในการเริ่มต้น Matrix ครั้งถัดไป

รายละเอียดสแนปช็อต:

- OpenClaw เขียนไฟล์เครื่องหมายไว้ที่ `~/.openclaw/matrix/migration-snapshot.json` หลังจากสร้างสแนปช็อตสำเร็จ เพื่อให้การเริ่มต้นทำงานและการซ่อมแซมครั้งต่อไปนำอาร์ไคฟ์เดิมกลับมาใช้ได้
- สแนปช็อตการย้ายข้อมูล Matrix อัตโนมัติเหล่านี้สำรองเฉพาะคอนฟิกและสถานะ (`includeWorkspace: false`)
- หาก Matrix มีเฉพาะสถานะการย้ายข้อมูลระดับคำเตือน เช่นเพราะ `userId` หรือ `accessToken` ยังขาดอยู่ OpenClaw จะยังไม่สร้างสแนปช็อต เพราะยังไม่มีการเปลี่ยนแปลง Matrix ใดที่ดำเนินการได้
- หากขั้นตอนสแนปช็อตล้มเหลว OpenClaw จะข้ามการย้ายข้อมูล Matrix สำหรับรอบนั้นแทนที่จะเปลี่ยนแปลงสถานะโดยไม่มีจุดกู้คืน

เกี่ยวกับการอัปเกรดหลายบัญชี:

- ที่เก็บ Matrix แบบแบนที่เก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์ที่เก็บเดียว ดังนั้น OpenClaw จึงย้ายข้อมูลเข้าไปยังเป้าหมายบัญชี Matrix ที่ระบุได้เพียงบัญชีเดียวเท่านั้น
- ที่เก็บ Matrix แบบเดิมที่ผูกกับบัญชีอยู่แล้วจะถูกตรวจพบและเตรียมแยกตามบัญชี Matrix ที่กำหนดค่าไว้

## สิ่งที่การย้ายข้อมูลทำโดยอัตโนมัติไม่ได้

Plugin Matrix สาธารณะก่อนหน้านี้ **ไม่ได้** สร้างข้อมูลสำรองคีย์ห้อง Matrix โดยอัตโนมัติ มันคงสถานะคริปโตภายในเครื่องและร้องขอการยืนยันอุปกรณ์ แต่ไม่ได้รับประกันว่าคีย์ห้องของคุณถูกสำรองไปยัง homeserver

นั่นหมายความว่าการติดตั้งแบบเข้ารหัสบางรายการสามารถย้ายข้อมูลได้เพียงบางส่วนเท่านั้น

OpenClaw ไม่สามารถกู้คืนโดยอัตโนมัติได้:

- คีย์ห้องที่มีเฉพาะในเครื่องและไม่เคยถูกสำรอง
- สถานะเข้ารหัสเมื่อยังไม่สามารถระบุบัญชี Matrix ปลายทางได้ เพราะ `homeserver`, `userId` หรือ `accessToken` ยังไม่พร้อมใช้งาน
- การย้ายข้อมูลอัตโนมัติของที่เก็บ Matrix แบบแบนที่ใช้ร่วมกันหนึ่งรายการ เมื่อมีการกำหนดค่าหลายบัญชี Matrix แต่ไม่ได้ตั้งค่า `channels.matrix.defaultAccount`
- การติดตั้ง Plugin ด้วยพาธแบบกำหนดเองที่ปักหมุดไว้กับพาธ repo แทนแพ็กเกจ Matrix มาตรฐาน
- คีย์กู้คืนที่ขาดหายไปเมื่อที่เก็บเก่ามีคีย์ที่สำรองไว้แต่ไม่ได้เก็บคีย์ถอดรหัสไว้ภายในเครื่อง

ขอบเขตคำเตือนปัจจุบัน:

- การติดตั้ง Plugin Matrix ด้วยพาธแบบกำหนดเองจะแสดงทั้งโดยการเริ่มต้น Gateway และ `openclaw doctor`

หากการติดตั้งเก่าของคุณมีประวัติที่เข้ารหัสเฉพาะในเครื่องซึ่งไม่เคยถูกสำรอง ข้อความเข้ารหัสเก่าบางรายการอาจยังอ่านไม่ได้หลังอัปเกรด

## ขั้นตอนอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Plugin Matrix ตามปกติ
   แนะนำให้ใช้ `openclaw update` แบบธรรมดาโดยไม่มี `--no-restart` เพื่อให้การเริ่มต้นทำงานสามารถทำการย้ายข้อมูล Matrix ให้เสร็จทันที
2. เรียกใช้:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานย้ายข้อมูลที่ดำเนินการได้ doctor จะสร้างหรือนำสแนปช็อตก่อนการย้ายข้อมูลกลับมาใช้ก่อน แล้วพิมพ์พาธอาร์ไคฟ์

3. เริ่มหรือรีสตาร์ท Gateway
4. ตรวจสอบสถานะการยืนยันและการสำรองข้อมูลปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ใส่คีย์กู้คืนสำหรับบัญชี Matrix ที่คุณกำลังซ่อมไว้ในตัวแปรสภาพแวดล้อมแบบเจาะจงบัญชี สำหรับบัญชีเริ่มต้นบัญชีเดียว `MATRIX_RECOVERY_KEY` ใช้ได้ สำหรับหลายบัญชี ให้ใช้ตัวแปรหนึ่งตัวต่อหนึ่งบัญชี เช่น `MATRIX_RECOVERY_KEY_ASSISTANT` และเพิ่ม `--account assistant` ในคำสั่ง

6. หาก OpenClaw บอกว่าจำเป็นต้องใช้คีย์กู้คืน ให้เรียกใช้คำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน ให้เรียกใช้คำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   หากยอมรับคีย์กู้คืนแล้วและการสำรองข้อมูลใช้งานได้ แต่ `Cross-signing verified`
   ยังเป็น `no` ให้ทำการยืนยันตัวเองให้เสร็จจากไคลเอนต์ Matrix อื่น:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอในไคลเอนต์ Matrix อื่น เปรียบเทียบอีโมจิหรือทศนิยม
   แล้วพิมพ์ `yes` เฉพาะเมื่อมันตรงกัน คำสั่งจะจบสำเร็จเฉพาะ
   หลังจาก `Cross-signing verified` กลายเป็น `yes`

8. หากคุณตั้งใจละทิ้งประวัติเก่าที่กู้คืนไม่ได้และต้องการฐานข้อมูลสำรองใหม่สำหรับข้อความในอนาคต ให้เรียกใช้:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. หากยังไม่มีข้อมูลสำรองคีย์ฝั่งเซิร์ฟเวอร์ ให้สร้างรายการหนึ่งสำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## การย้ายข้อมูลแบบเข้ารหัสทำงานอย่างไร

การย้ายข้อมูลแบบเข้ารหัสเป็นกระบวนการสองระยะ:

1. การเริ่มต้นทำงานหรือ `openclaw doctor --fix` จะสร้างหรือนำสแนปช็อตก่อนการย้ายข้อมูลกลับมาใช้ หากการย้ายข้อมูลแบบเข้ารหัสดำเนินการได้
2. การเริ่มต้นทำงานหรือ `openclaw doctor --fix` จะตรวจสอบที่เก็บคริปโต Matrix เก่าผ่านการติดตั้ง Plugin Matrix ที่ใช้งานอยู่
3. หากพบคีย์ถอดรหัสข้อมูลสำรอง OpenClaw จะเขียนคีย์นั้นเข้าสู่โฟลว์คีย์กู้คืนใหม่และทำเครื่องหมายว่าการกู้คืนคีย์ห้องค้างอยู่
4. ในการเริ่มต้น Matrix ครั้งถัดไป OpenClaw จะกู้คืนคีย์ห้องที่สำรองไว้เข้าไปในที่เก็บคริปโตใหม่โดยอัตโนมัติ

หากที่เก็บเก่ารายงานคีย์ห้องที่ไม่เคยถูกสำรอง OpenClaw จะเตือนแทนที่จะแสร้งว่าการกู้คืนสำเร็จ

## ข้อความที่พบบ่อยและความหมาย

### ข้อความการอัปเกรดและการตรวจพบ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบสถานะ Matrix บนดิสก์แบบเก่าและย้ายข้อมูลเข้าสู่เลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ต้องทำ: ไม่ต้องทำอะไร เว้นแต่เอาต์พุตเดียวกันจะมีคำเตือนด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้างอาร์ไคฟ์กู้คืนก่อนเปลี่ยนแปลงสถานะ Matrix
- สิ่งที่ต้องทำ: เก็บพาธอาร์ไคฟ์ที่พิมพ์ไว้จนกว่าคุณจะยืนยันว่าการย้ายข้อมูลสำเร็จ

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบเครื่องหมายสแนปช็อตการย้ายข้อมูล Matrix ที่มีอยู่ และนำอาร์ไคฟ์นั้นกลับมาใช้แทนการสร้างข้อมูลสำรองซ้ำ
- สิ่งที่ต้องทำ: เก็บพาธอาร์ไคฟ์ที่พิมพ์ไว้จนกว่าคุณจะยืนยันว่าการย้ายข้อมูลสำเร็จ

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มีสถานะ Matrix เก่าอยู่ แต่ OpenClaw ไม่สามารถแมปเข้ากับบัญชี Matrix ปัจจุบันได้ เพราะยังไม่ได้กำหนดค่า Matrix
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วเรียกใช้ `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบสถานะเก่า แต่ยังไม่สามารถระบุรากบัญชี/อุปกรณ์ปัจจุบันที่แน่นอนได้
- สิ่งที่ต้องทำ: เริ่ม Gateway หนึ่งครั้งด้วยการเข้าสู่ระบบ Matrix ที่ใช้งานได้ หรือเรียกใช้ `openclaw doctor --fix` อีกครั้งหลังจากมีข้อมูลรับรองที่แคชไว้

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบที่เก็บ Matrix แบบแบนที่ใช้ร่วมกันหนึ่งรายการ แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix ที่มีชื่อบัญชีใดควรรับข้อมูลนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ แล้วเรียกใช้ `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งแบบผูกกับบัญชีใหม่มีที่เก็บซิงก์หรือที่เก็บคริปโตอยู่แล้ว ดังนั้น OpenClaw จึงไม่ได้เขียนทับโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่าบัญชีปัจจุบันเป็นบัญชีที่ถูกต้องก่อนลบหรือย้ายเป้าหมายที่ขัดแย้งด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` หรือ `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้ายสถานะ Matrix เก่า แต่การทำงานของระบบไฟล์ล้มเหลว
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ระบบไฟล์และสถานะดิสก์ แล้วเรียกใช้ `openclaw doctor --fix` อีกครั้ง

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบที่เก็บ Matrix แบบเข้ารหัสเก่า แต่ไม่มีคอนฟิก Matrix ปัจจุบันให้ผูกเข้าด้วย
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วเรียกใช้ `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: มีที่เก็บเข้ารหัสอยู่ แต่ OpenClaw ไม่สามารถตัดสินใจได้อย่างปลอดภัยว่ามันเป็นของบัญชี/อุปกรณ์ปัจจุบันใด
- สิ่งที่ต้องทำ: เริ่ม Gateway หนึ่งครั้งด้วยการเข้าสู่ระบบ Matrix ที่ใช้งานได้ หรือเรียกใช้ `openclaw doctor --fix` อีกครั้งหลังจากมีข้อมูลรับรองที่แคชไว้

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบที่เก็บคริปโตแบบเดิมชนิดแบนที่ใช้ร่วมกันหนึ่งรายการ แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix ที่มีชื่อบัญชีใดควรรับข้อมูลนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ แล้วเรียกใช้ `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบสถานะ Matrix เก่า แต่การย้ายข้อมูลยังติดอยู่เพราะข้อมูลตัวตนหรือข้อมูลรับรองขาดหาย
- สิ่งที่ต้องทำ: ทำการเข้าสู่ระบบ Matrix หรือการตั้งค่าคอนฟิกให้เสร็จ แล้วเรียกใช้ `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบสถานะ Matrix ที่เข้ารหัสแบบเก่า แต่ไม่สามารถโหลด helper entrypoint จาก Matrix Plugin ที่ปกติใช้ตรวจสอบ store นั้นได้
- สิ่งที่ต้องทำ: ติดตั้งใหม่หรือซ่อมแซม Matrix Plugin (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ repo checkout) จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway
- หาก npm รายงานว่าแพ็กเกจ Matrix ที่ OpenClaw เป็นเจ้าของเลิกใช้แล้ว ให้ใช้
  Plugin ที่รวมมากับ OpenClaw build แบบแพ็กเกจล่าสุด หรือใช้พาธ checkout ในเครื่องจนกว่า
  แพ็กเกจ npm รุ่นใหม่กว่าจะถูกเผยแพร่

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบพาธไฟล์ helper ที่หลุดออกจาก root ของ Plugin หรือไม่ผ่านการตรวจสอบขอบเขต Plugin จึงปฏิเสธที่จะ import ไฟล์นั้น
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่จากพาธที่เชื่อถือได้ จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะเปลี่ยนสถานะ Matrix เพราะไม่สามารถสร้าง snapshot สำหรับกู้คืนได้ก่อน
- สิ่งที่ต้องทำ: แก้ไขข้อผิดพลาดของการสำรองข้อมูล จากนั้นรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ท Gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: fallback ฝั่งไคลเอนต์ Matrix พบ storage แบบแบนเก่า แต่ย้ายไม่สำเร็จ ตอนนี้ OpenClaw จะยกเลิก fallback นั้นแทนที่จะเริ่มด้วย store ใหม่แบบเงียบ ๆ
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ระบบไฟล์หรือความขัดแย้งต่าง ๆ เก็บสถานะเก่าไว้เหมือนเดิม แล้วลองใหม่หลังจากแก้ไขข้อผิดพลาด

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกตรึงไว้กับการติดตั้งจากพาธ ดังนั้นการอัปเดตสายหลักจะไม่แทนที่ด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อคุณต้องการกลับไปใช้ Matrix Plugin เริ่มต้น
- หาก npm รายงานว่าแพ็กเกจ Matrix ที่ OpenClaw เป็นเจ้าของเลิกใช้แล้ว ให้ใช้ Plugin
  ที่รวมมากับ OpenClaw build แบบแพ็กเกจล่าสุดจนกว่าแพ็กเกจ npm รุ่นใหม่กว่า
  จะถูกเผยแพร่

### ข้อความกู้คืนสถานะที่เข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: room key ที่สำรองไว้ถูกกู้คืนเข้าสู่ crypto store ใหม่สำเร็จแล้ว
- สิ่งที่ต้องทำ: โดยปกติไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: room key เก่าบางรายการมีอยู่เฉพาะใน local store เก่าและไม่เคยถูกอัปโหลดไปยังข้อมูลสำรอง Matrix
- สิ่งที่ต้องทำ: คาดว่า history ที่เข้ารหัสเก่าบางส่วนจะยังไม่พร้อมใช้งาน เว้นแต่คุณจะกู้คืน key เหล่านั้นด้วยตนเองจากไคลเอนต์อื่นที่ยืนยันแล้วได้

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- ความหมาย: มีข้อมูลสำรองอยู่ แต่ OpenClaw ไม่สามารถกู้คืน recovery key ได้โดยอัตโนมัติ
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบ store ที่เข้ารหัสแบบเก่า แต่ไม่สามารถตรวจสอบได้อย่างปลอดภัยเพียงพอเพื่อเตรียมการกู้คืน
- สิ่งที่ต้องทำ: รัน `openclaw doctor --fix` อีกครั้ง หากเกิดซ้ำ ให้เก็บไดเรกทอรีสถานะเก่าไว้เหมือนเดิม แล้วกู้คืนโดยใช้ไคลเอนต์ Matrix อื่นที่ยืนยันแล้วร่วมกับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบความขัดแย้งของ backup key และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่า recovery key ใดถูกต้องก่อนลองคำสั่งกู้คืนใด ๆ อีกครั้ง

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือข้อจำกัดตายตัวของรูปแบบ storage เก่า
- สิ่งที่ต้องทำ: key ที่สำรองไว้ยังคงกู้คืนได้ แต่ history ที่เข้ารหัสซึ่งมีเฉพาะในเครื่องอาจยังไม่พร้อมใช้งาน

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืนแล้ว แต่ Matrix ส่งข้อผิดพลาดกลับมา
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup status` จากนั้นลองอีกครั้งด้วย `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

### ข้อความกู้คืนด้วยตนเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw ทราบว่าคุณควรมี backup key แต่ key นั้นยังไม่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore` หรือตั้งค่า `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: อุปกรณ์นี้ยังไม่ได้เก็บ recovery key ไว้ในขณะนี้
- สิ่งที่ต้องทำ: ตั้งค่า `MATRIX_RECOVERY_KEY` รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` จากนั้นกู้คืนข้อมูลสำรอง

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- ความหมาย: key ที่จัดเก็บไว้ไม่ตรงกับข้อมูลสำรอง Matrix ที่ active อยู่
- สิ่งที่ต้องทำ: ตั้งค่า `MATRIX_RECOVERY_KEY` เป็น key ที่ถูกต้อง แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

หากคุณยอมรับการสูญเสีย history เก่าที่เข้ารหัสและกู้คืนไม่ได้ คุณสามารถรีเซ็ต
baseline ข้อมูลสำรองปัจจุบันด้วย `openclaw matrix verify backup reset --yes` แทนได้ เมื่อ
secret ของข้อมูลสำรองที่จัดเก็บไว้เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
backup key ใหม่โหลดได้ถูกต้องหลังรีสตาร์ท

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- ความหมาย: มีข้อมูลสำรองอยู่ แต่อุปกรณ์นี้ยังไม่เชื่อถือ cross-signing chain มากพอ
- สิ่งที่ต้องทำ: ตั้งค่า `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนกู้คืนโดยไม่ได้ให้ recovery key ทั้งที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: รันคำสั่งอีกครั้งพร้อม `--recovery-key-stdin` เช่น `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Invalid Matrix recovery key: ...`

- ความหมาย: key ที่ให้มาไม่สามารถแยกวิเคราะห์ได้ หรือไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองอีกครั้งด้วย recovery key ที่ตรงทุกตัวอักษรจากไคลเอนต์ Matrix หรือไฟล์ recovery-key ของคุณ

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: OpenClaw สามารถใช้ recovery key ได้ แต่ Matrix ยังไม่ได้
  สร้างความเชื่อถือ identity แบบ cross-signing อย่างสมบูรณ์สำหรับอุปกรณ์นี้ ตรวจสอบ
  output ของคำสั่งสำหรับ `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` และ `Device verified by owner`
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify self` ยอมรับคำขอในไคลเอนต์
  Matrix อื่น เปรียบเทียบ SAS แล้วพิมพ์ `yes` เฉพาะเมื่อค่าตรงกันเท่านั้น
  คำสั่งจะรอให้มีความเชื่อถือ identity ของ Matrix อย่างสมบูรณ์ก่อนรายงานว่าสำเร็จ ใช้
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  เฉพาะเมื่อคุณตั้งใจจะแทนที่ cross-signing identity ปัจจุบันเท่านั้น

`Matrix key backup is not active on this device after loading from secret storage.`

- ความหมาย: secret storage ไม่ได้สร้างเซสชันข้อมูลสำรองที่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ก่อน จากนั้นตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- ความหมาย: อุปกรณ์นี้ไม่สามารถกู้คืนจาก secret storage ได้จนกว่าการยืนยันอุปกรณ์จะเสร็จสมบูรณ์
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` ก่อน

### ข้อความการติดตั้ง Plugin แบบกำหนดเอง

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: ระเบียนการติดตั้ง Plugin ของคุณชี้ไปยังพาธในเครื่องที่ไม่มีอยู่แล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณรันจาก repo checkout ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`
- หาก npm รายงานว่าแพ็กเกจ Matrix ที่ OpenClaw เป็นเจ้าของเลิกใช้แล้ว ให้ใช้
  Plugin ที่รวมมากับ OpenClaw build แบบแพ็กเกจล่าสุด หรือใช้พาธ checkout ในเครื่องจนกว่า
  แพ็กเกจ npm รุ่นใหม่กว่าจะถูกเผยแพร่

## หาก history ที่เข้ารหัสยังไม่กลับมา

รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

หากข้อมูลสำรองกู้คืนสำเร็จ แต่ห้องเก่าบางห้องยังไม่มี history แสดงว่า key ที่หายไปเหล่านั้นอาจไม่เคยถูกสำรองโดย Plugin ก่อนหน้า

## หากคุณต้องการเริ่มใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสีย history เก่าที่เข้ารหัสและกู้คืนไม่ได้ และต้องการเพียง baseline ข้อมูลสำรองที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากอุปกรณ์ยังไม่ได้รับการยืนยันหลังจากนั้น ให้ยืนยันให้เสร็จจากไคลเอนต์ Matrix ของคุณ โดยเปรียบเทียบอีโมจิ SAS หรือรหัสทศนิยม และยืนยันว่าตรงกัน

## ที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix): การตั้งค่าและ config ของช่องทาง
- [กฎ push ของ Matrix](/th/channels/matrix-push-rules): การกำหนดเส้นทางการแจ้งเตือน
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพและ trigger การย้ายข้อมูลอัตโนมัติ
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด (การย้ายเครื่อง การ import ข้ามระบบ)
- [Plugin](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
