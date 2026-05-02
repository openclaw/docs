---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่เดิม
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์
summary: วิธีที่ OpenClaw อัปเกรด Matrix Plugin ก่อนหน้าแบบแทนที่เดิม รวมถึงข้อจำกัดในการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง.
title: การย้ายข้อมูล Matrix
x-i18n:
    generated_at: "2026-05-02T22:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

อัปเกรดจาก Plugin `matrix` สาธารณะก่อนหน้าไปยังการใช้งานปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะทำในที่เดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- ช่องทางยังคงเป็น `matrix`
- การกำหนดค่าของคุณยังอยู่ใต้ `channels.matrix`
- ข้อมูลรับรองที่แคชไว้ยังอยู่ใต้ `~/.openclaw/credentials/matrix/`
- สถานะ runtime ยังอยู่ใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์การกำหนดค่าหรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่

## การย้ายข้อมูลทำอะไรให้อัตโนมัติ

เมื่อ Gateway เริ่มทำงาน และเมื่อคุณรัน [`openclaw doctor --fix`](/th/gateway/doctor), OpenClaw จะพยายามซ่อมแซมสถานะ Matrix เก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้ายข้อมูล Matrix ที่ดำเนินการได้จะเปลี่ยนแปลงสถานะบนดิสก์ OpenClaw จะสร้างหรือใช้สแนปช็อตกู้คืนเฉพาะทางซ้ำ

เมื่อคุณใช้ `openclaw update` ตัวกระตุ้นที่แน่นอนจะขึ้นอยู่กับวิธีติดตั้ง OpenClaw:

- การติดตั้งจากซอร์สจะรัน `openclaw doctor --fix` ระหว่างขั้นตอนอัปเดต แล้วรีสตาร์ต Gateway โดยค่าเริ่มต้น
- การติดตั้งผ่าน package manager จะอัปเดตแพ็กเกจ รันรอบ doctor แบบไม่โต้ตอบ แล้วพึ่งพาการรีสตาร์ต Gateway ค่าเริ่มต้นเพื่อให้การเริ่มทำงานทำการย้ายข้อมูล Matrix ให้เสร็จ
- หากคุณใช้ `openclaw update --no-restart` การย้ายข้อมูล Matrix ที่พึ่งพาการเริ่มทำงานจะถูกเลื่อนออกไปจนกว่าคุณจะรัน `openclaw doctor --fix` ในภายหลังและรีสตาร์ต Gateway

การย้ายข้อมูลอัตโนมัติครอบคลุม:

- การสร้างหรือใช้สแนปช็อตก่อนย้ายข้อมูลซ้ำใต้ `~/Backups/openclaw-migrations/`
- การใช้ข้อมูลรับรอง Matrix ที่แคชไว้ของคุณซ้ำ
- การคงการเลือกบัญชีและการกำหนดค่า `channels.matrix` เดิมไว้
- การย้าย sync store แบบแบนของ Matrix ที่เก่าที่สุดไปยังตำแหน่งปัจจุบันที่แยกตามบัญชี
- การย้าย crypto store แบบแบนของ Matrix ที่เก่าที่สุดไปยังตำแหน่งปัจจุบันที่แยกตามบัญชี เมื่อสามารถระบุบัญชีปลายทางได้อย่างปลอดภัย
- การดึงคีย์ถอดรหัสข้อมูลสำรอง room-key ของ Matrix ที่เคยบันทึกไว้จาก rust crypto store เก่า เมื่อคีย์นั้นมีอยู่ในเครื่อง
- การใช้ root การจัดเก็บ token-hash ที่มีอยู่และสมบูรณ์ที่สุดซ้ำสำหรับบัญชี Matrix, homeserver และผู้ใช้เดียวกันเมื่อ access token เปลี่ยนในภายหลัง
- การสแกน root การจัดเก็บ token-hash ข้างเคียงเพื่อหาเมทาดาทาการกู้คืนสถานะเข้ารหัสที่ค้างอยู่ เมื่อ access token ของ Matrix เปลี่ยนแต่ข้อมูลประจำตัวบัญชี/อุปกรณ์ยังคงเดิม
- การกู้คืน room keys ที่สำรองไว้เข้าสู่ crypto store ใหม่ในการเริ่ม Matrix ครั้งถัดไป

รายละเอียดสแนปช็อต:

- OpenClaw เขียนไฟล์ตัวทำเครื่องหมายที่ `~/.openclaw/matrix/migration-snapshot.json` หลังจากสแนปช็อตสำเร็จ เพื่อให้รอบเริ่มทำงานและรอบซ่อมแซมภายหลังสามารถใช้ archive เดิมซ้ำได้
- สแนปช็อตการย้ายข้อมูล Matrix อัตโนมัติเหล่านี้สำรองเฉพาะ config + state (`includeWorkspace: false`)
- หาก Matrix มีเพียงสถานะการย้ายข้อมูลระดับคำเตือนเท่านั้น เช่น เพราะ `userId` หรือ `accessToken` ยังขาดอยู่ OpenClaw จะยังไม่สร้างสแนปช็อต เพราะยังไม่มีการเปลี่ยนแปลง Matrix ที่ดำเนินการได้
- หากขั้นตอนสแนปช็อตล้มเหลว OpenClaw จะข้ามการย้ายข้อมูล Matrix สำหรับรอบนั้น แทนที่จะเปลี่ยนแปลงสถานะโดยไม่มีจุดกู้คืน

เกี่ยวกับการอัปเกรดหลายบัญชี:

- store แบบแบนของ Matrix ที่เก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์แบบ store เดียว ดังนั้น OpenClaw จึงย้ายข้อมูลไปยังเป้าหมายบัญชี Matrix ที่ระบุได้เพียงบัญชีเดียว
- store Matrix แบบเก่าที่แยกตามบัญชีอยู่แล้วจะถูกตรวจพบและเตรียมต่อบัญชี Matrix ที่กำหนดค่าไว้

## สิ่งที่การย้ายข้อมูลทำให้อัตโนมัติไม่ได้

Plugin Matrix สาธารณะก่อนหน้า **ไม่ได้** สร้างข้อมูลสำรอง room-key ของ Matrix โดยอัตโนมัติ มันคงสถานะ crypto ในเครื่องและขอการยืนยันอุปกรณ์ แต่ไม่ได้รับประกันว่า room keys ของคุณถูกสำรองไปยัง homeserver แล้ว

นั่นหมายความว่าการติดตั้งแบบเข้ารหัสบางชุดสามารถย้ายข้อมูลได้เพียงบางส่วนเท่านั้น

OpenClaw ไม่สามารถกู้คืนโดยอัตโนมัติได้:

- room keys ที่มีเฉพาะในเครื่องและไม่เคยถูกสำรอง
- สถานะเข้ารหัสเมื่อยังไม่สามารถระบุบัญชี Matrix ปลายทางได้ เพราะ `homeserver`, `userId` หรือ `accessToken` ยังไม่พร้อมใช้งาน
- การย้ายข้อมูลอัตโนมัติของ store Matrix แบบแบนที่ใช้ร่วมกันหนึ่งรายการ เมื่อกำหนดค่าหลายบัญชี Matrix แต่ไม่ได้ตั้งค่า `channels.matrix.defaultAccount`
- การติดตั้ง Plugin ผ่านพาธกำหนดเองที่ pin ไว้กับพาธ repo แทนแพ็กเกจ Matrix มาตรฐาน
- คีย์กู้คืนที่ขาดหายเมื่อ store เก่ามีคีย์ที่สำรองไว้ แต่ไม่ได้เก็บคีย์ถอดรหัสไว้ในเครื่อง

ขอบเขตคำเตือนปัจจุบัน:

- การติดตั้ง Plugin Matrix ผ่านพาธกำหนดเองจะแสดงทั้งตอน Gateway เริ่มทำงานและใน `openclaw doctor`

หากการติดตั้งเก่าของคุณมีประวัติเข้ารหัสเฉพาะในเครื่องที่ไม่เคยสำรอง ข้อความเข้ารหัสเก่าบางรายการอาจยังอ่านไม่ได้หลังอัปเกรด

## ขั้นตอนอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Plugin Matrix ตามปกติ
   ควรใช้ `openclaw update` แบบธรรมดาโดยไม่มี `--no-restart` เพื่อให้การเริ่มทำงานทำการย้ายข้อมูล Matrix ให้เสร็จทันที
2. รัน:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานย้ายข้อมูลที่ดำเนินการได้ doctor จะสร้างหรือใช้สแนปช็อตก่อนย้ายข้อมูลซ้ำก่อน และพิมพ์พาธ archive

3. เริ่มหรือรีสตาร์ต Gateway
4. ตรวจสอบสถานะการยืนยันและการสำรองปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ใส่คีย์กู้คืนสำหรับบัญชี Matrix ที่คุณกำลังซ่อมในตัวแปรสภาพแวดล้อมเฉพาะบัญชี สำหรับบัญชีค่าเริ่มต้นบัญชีเดียว `MATRIX_RECOVERY_KEY` ใช้ได้ สำหรับหลายบัญชี ให้ใช้ตัวแปรหนึ่งตัวต่อบัญชี เช่น `MATRIX_RECOVERY_KEY_ASSISTANT` และเพิ่ม `--account assistant` ในคำสั่ง

6. หาก OpenClaw บอกว่าต้องใช้คีย์กู้คืน ให้รันคำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน ให้รันคำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   หากคีย์กู้คืนได้รับการยอมรับและข้อมูลสำรองใช้งานได้ แต่ `Cross-signing verified`
   ยังเป็น `no` ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อีกตัว:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอในไคลเอนต์ Matrix อีกตัว เปรียบเทียบ emoji หรือทศนิยม
   และพิมพ์ `yes` เฉพาะเมื่อค่าตรงกันเท่านั้น คำสั่งจะจบสำเร็จเฉพาะ
   หลังจาก `Cross-signing verified` กลายเป็น `yes`

8. หากคุณตั้งใจละทิ้งประวัติเก่าที่กู้คืนไม่ได้และต้องการ baseline สำรองใหม่สำหรับข้อความในอนาคต ให้รัน:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. หากยังไม่มีข้อมูลสำรองคีย์ฝั่งเซิร์ฟเวอร์ ให้สร้างรายการหนึ่งสำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## วิธีทำงานของการย้ายข้อมูลเข้ารหัส

การย้ายข้อมูลเข้ารหัสเป็นกระบวนการสองระยะ:

1. การเริ่มทำงานหรือ `openclaw doctor --fix` สร้างหรือใช้สแนปช็อตก่อนย้ายข้อมูลซ้ำ หากการย้ายข้อมูลเข้ารหัสดำเนินการได้
2. การเริ่มทำงานหรือ `openclaw doctor --fix` ตรวจสอบ crypto store ของ Matrix เก่าผ่านการติดตั้ง Plugin Matrix ที่ใช้งานอยู่
3. หากพบคีย์ถอดรหัสข้อมูลสำรอง OpenClaw จะเขียนคีย์นั้นเข้าสู่โฟลว์ recovery-key ใหม่และทำเครื่องหมายว่าการกู้คืน room-key ค้างอยู่
4. ในการเริ่ม Matrix ครั้งถัดไป OpenClaw จะกู้คืน room keys ที่สำรองไว้เข้าสู่ crypto store ใหม่โดยอัตโนมัติ

หาก store เก่ารายงาน room keys ที่ไม่เคยถูกสำรอง OpenClaw จะเตือนแทนที่จะแสร้งว่ากู้คืนสำเร็จ

## ข้อความทั่วไปและความหมาย

### ข้อความการอัปเกรดและการตรวจพบ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบสถานะ Matrix บนดิสก์เก่าและย้ายเข้าสู่เลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ต้องทำ: ไม่ต้องทำอะไร เว้นแต่ผลลัพธ์เดียวกันจะมีคำเตือนด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้าง archive กู้คืนก่อนเปลี่ยนแปลงสถานะ Matrix
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ออกมาไว้จนกว่าคุณจะยืนยันว่าการย้ายข้อมูลสำเร็จ

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบตัวทำเครื่องหมายสแนปช็อตการย้ายข้อมูล Matrix ที่มีอยู่ และใช้ archive นั้นซ้ำแทนการสร้างข้อมูลสำรองซ้ำ
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ออกมาไว้จนกว่าคุณจะยืนยันว่าการย้ายข้อมูลสำเร็จ

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มีสถานะ Matrix เก่าอยู่ แต่ OpenClaw ไม่สามารถแมปไปยังบัญชี Matrix ปัจจุบันได้ เพราะ Matrix ยังไม่ได้กำหนดค่า
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ต Gateway

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบสถานะเก่า แต่ยังไม่สามารถระบุ root บัญชี/อุปกรณ์ปัจจุบันที่แน่นอนได้
- สิ่งที่ต้องทำ: เริ่ม Gateway หนึ่งครั้งด้วยการเข้าสู่ระบบ Matrix ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` อีกครั้งหลังจากมีข้อมูลรับรองที่แคชไว้

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ store Matrix แบบแบนที่ใช้ร่วมกันหนึ่งรายการ แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix ที่ตั้งชื่อไว้บัญชีใดควรรับข้อมูลนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ แล้วรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ต Gateway

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งใหม่ที่แยกตามบัญชีมี sync หรือ crypto store อยู่แล้ว ดังนั้น OpenClaw จึงไม่เขียนทับโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่าบัญชีปัจจุบันเป็นบัญชีที่ถูกต้องก่อนลบหรือย้ายเป้าหมายที่ขัดแย้งด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้ายสถานะ Matrix เก่า แต่การดำเนินการระบบไฟล์ล้มเหลว
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ระบบไฟล์และสถานะดิสก์ แล้วรัน `openclaw doctor --fix` อีกครั้ง

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบ store Matrix เข้ารหัสเก่า แต่ไม่มีการกำหนดค่า Matrix ปัจจุบันให้แนบเข้าด้วย
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ต Gateway

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: มี store เข้ารหัสอยู่ แต่ OpenClaw ไม่สามารถตัดสินใจอย่างปลอดภัยได้ว่าเป็นของบัญชี/อุปกรณ์ปัจจุบันใด
- สิ่งที่ต้องทำ: เริ่ม Gateway หนึ่งครั้งด้วยการเข้าสู่ระบบ Matrix ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` อีกครั้งหลังจากมีข้อมูลรับรองที่แคชไว้

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ legacy crypto store แบบแบนที่ใช้ร่วมกันหนึ่งรายการ แต่ปฏิเสธที่จะเดาว่าบัญชี Matrix ที่ตั้งชื่อไว้บัญชีใดควรรับข้อมูลนั้น
- สิ่งที่ต้องทำ: ตั้งค่า `channels.matrix.defaultAccount` เป็นบัญชีที่ต้องการ แล้วรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ต Gateway

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบสถานะ Matrix เก่า แต่การย้ายข้อมูลยังถูกบล็อกเพราะขาดข้อมูลระบุตัวตนหรือข้อมูลรับรอง
- สิ่งที่ต้องทำ: ทำการเข้าสู่ระบบ Matrix หรือการตั้งค่า config ให้เสร็จ แล้วรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ต Gateway

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบสถานะ Matrix เข้ารหัสเก่า แต่โหลด helper entrypoint จาก Plugin Matrix ที่ปกติใช้ตรวจสอบ store นั้นไม่ได้
- สิ่งที่ต้องทำ: ติดตั้งใหม่หรือซ่อมแซม Plugin Matrix (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ repo checkout) แล้วรัน `openclaw doctor --fix` อีกครั้งหรือรีสตาร์ต Gateway

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบพาธไฟล์ตัวช่วยที่หลุดออกจากรากของ Plugin หรือไม่ผ่านการตรวจสอบขอบเขต Plugin จึงปฏิเสธที่จะนำเข้าไฟล์นั้น
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่จากพาธที่เชื่อถือได้ จากนั้นรัน `openclaw doctor --fix` อีกครั้ง หรือรีสตาร์ท gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะเปลี่ยนแปลงสถานะ Matrix เพราะไม่สามารถสร้างสแนปช็อตสำหรับกู้คืนก่อน
- สิ่งที่ต้องทำ: แก้ไขข้อผิดพลาดของการสำรองข้อมูล แล้วรัน `openclaw doctor --fix` อีกครั้ง หรือรีสตาร์ท gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: fallback ฝั่งไคลเอนต์ Matrix พบพื้นที่จัดเก็บแบบแบนเดิม แต่การย้ายล้มเหลว ตอนนี้ OpenClaw จะยกเลิก fallback นั้นแทนที่จะเริ่มด้วย store ใหม่แบบเงียบๆ
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์หรือข้อขัดแย้ง รักษาสถานะเดิมไว้ไม่ให้เสียหาย แล้วลองอีกครั้งหลังแก้ไขข้อผิดพลาด

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกตรึงไว้กับการติดตั้งจากพาธ ดังนั้นการอัปเดต mainline จะไม่แทนที่ด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อต้องการกลับไปใช้ Matrix Plugin ค่าเริ่มต้น

### ข้อความการกู้คืนสถานะที่เข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: กู้คืนคีย์ห้องที่สำรองไว้เข้าสู่ crypto store ใหม่สำเร็จแล้ว
- สิ่งที่ต้องทำ: โดยปกติไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: คีย์ห้องเก่าบางรายการมีอยู่เฉพาะใน store ภายในเครื่องเดิม และไม่เคยถูกอัปโหลดไปยังข้อมูลสำรองของ Matrix
- สิ่งที่ต้องทำ: คาดว่าประวัติที่เข้ารหัสเก่าบางส่วนจะยังไม่พร้อมใช้งาน เว้นแต่คุณจะกู้คืนคีย์เหล่านั้นด้วยตนเองจากไคลเอนต์อื่นที่ยืนยันแล้วได้

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- ความหมาย: มีข้อมูลสำรองอยู่ แต่ OpenClaw ไม่สามารถกู้คืน recovery key โดยอัตโนมัติ
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบ encrypted store เดิม แต่ไม่สามารถตรวจสอบอย่างปลอดภัยพอเพื่อเตรียมการกู้คืน
- สิ่งที่ต้องทำ: รัน `openclaw doctor --fix` อีกครั้ง หากยังเกิดซ้ำ ให้รักษาไดเรกทอรีสถานะเดิมไว้ไม่ให้เสียหาย และกู้คืนโดยใช้ไคลเอนต์ Matrix อื่นที่ยืนยันแล้วร่วมกับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบข้อขัดแย้งของ backup key และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่า recovery key ใดถูกต้องก่อนลองคำสั่งกู้คืนใดๆ อีกครั้ง

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือข้อจำกัดจริงของรูปแบบพื้นที่จัดเก็บเดิม
- สิ่งที่ต้องทำ: คีย์ที่สำรองไว้ยังสามารถกู้คืนได้ แต่ประวัติที่เข้ารหัสแบบ local-only อาจยังไม่พร้อมใช้งาน

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืนแล้ว แต่ Matrix ส่งคืนข้อผิดพลาด
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup status` แล้วลองอีกครั้งด้วย `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

### ข้อความการกู้คืนด้วยตนเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw รู้ว่าคุณควรมี backup key แต่คีย์นั้นยังไม่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore` หรือกำหนด `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: อุปกรณ์นี้ยังไม่มี recovery key ที่จัดเก็บไว้
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY` รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` จากนั้นกู้คืนข้อมูลสำรอง

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- ความหมาย: คีย์ที่จัดเก็บไว้ไม่ตรงกับข้อมูลสำรอง Matrix ที่ active
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY` เป็นคีย์ที่ถูกต้อง แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

หากคุณยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าซึ่งกู้คืนไม่ได้ คุณสามารถรีเซ็ต
baseline ข้อมูลสำรองปัจจุบันด้วย `openclaw matrix verify backup reset --yes` แทนได้ เมื่อ
backup secret ที่จัดเก็บไว้เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
backup key ใหม่โหลดได้อย่างถูกต้องหลังรีสตาร์ท

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- ความหมาย: มีข้อมูลสำรองอยู่ แต่อุปกรณ์นี้ยังไม่เชื่อถือ cross-signing chain มากพอ
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนกู้คืนโดยไม่ได้ระบุ recovery key ทั้งที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: รันคำสั่งอีกครั้งพร้อม `--recovery-key-stdin` เช่น `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Invalid Matrix recovery key: ...`

- ความหมาย: คีย์ที่ระบุไม่สามารถแยกวิเคราะห์ได้ หรือไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองอีกครั้งด้วย recovery key ที่ตรงจากไคลเอนต์ Matrix หรือไฟล์ recovery-key ของคุณ

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: OpenClaw สามารถใช้ recovery key ได้ แต่ Matrix ยังไม่ได้
  สร้างความเชื่อถือ identity แบบ cross-signing เต็มรูปแบบสำหรับอุปกรณ์นี้ ตรวจสอบ
  เอาต์พุตคำสั่งสำหรับ `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` และ `Device verified by owner`
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify self` ยอมรับคำขอใน
  ไคลเอนต์ Matrix อื่น เปรียบเทียบ SAS แล้วพิมพ์ `yes` เฉพาะเมื่อค่าตรงกัน
  คำสั่งจะรอจนกว่าจะมีความเชื่อถือ identity ของ Matrix เต็มรูปแบบก่อนรายงานว่าสำเร็จ ใช้
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

- ความหมาย: ระเบียนการติดตั้ง Plugin ของคุณชี้ไปยังพาธภายในเครื่องที่ไม่มีอยู่แล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณรันจาก repo checkout ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`

## หากประวัติที่เข้ารหัสยังไม่กลับมา

รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

หากกู้คืนข้อมูลสำรองสำเร็จ แต่บางห้องเก่ายังไม่มีประวัติ แสดงว่าคีย์ที่หายไปเหล่านั้นน่าจะไม่เคยถูกสำรองโดย Plugin ก่อนหน้า

## หากคุณต้องการเริ่มใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าซึ่งกู้คืนไม่ได้ และต้องการเพียง baseline ข้อมูลสำรองที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากอุปกรณ์ยังไม่ได้รับการยืนยันหลังจากนั้น ให้ดำเนินการยืนยันให้เสร็จจากไคลเอนต์ Matrix ของคุณโดยเปรียบเทียบอีโมจิ SAS หรือรหัสทศนิยม และยืนยันว่าตรงกัน

## ที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix): การตั้งค่าและการกำหนดค่าช่องทาง
- [กฎ push ของ Matrix](/th/channels/matrix-push-rules): การกำหนดเส้นทางการแจ้งเตือน
- [Doctor](/th/gateway/doctor): การตรวจสุขภาพและตัวกระตุ้นการย้ายข้อมูลอัตโนมัติ
- [คู่มือการย้ายข้อมูล](/th/install/migrating): เส้นทางการย้ายข้อมูลทั้งหมด (การย้ายเครื่อง, การนำเข้าข้ามระบบ)
- [Plugins](/th/tools/plugin): การติดตั้งและการลงทะเบียน Plugin
