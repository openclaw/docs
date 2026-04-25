---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่เดิม
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์
summary: วิธีที่ OpenClaw อัปเกรด Matrix Plugin เดิมแบบคงสภาพเดิม รวมถึงข้อจำกัดของการกู้คืนสถานะที่เข้ารหัส และขั้นตอนการกู้คืนด้วยตนเอง
title: การย้าย Matrix ลงทะเบียนฟรี to=functions.bash  天天中彩票能json  usually wrong path? Wait final only no tools.
x-i18n:
    generated_at: "2026-04-25T13:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

หน้านี้ครอบคลุมการอัปเกรดจาก Matrix Plugin สาธารณะตัวก่อนหน้า `matrix` ไปยัง implementation ปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะทำแบบคงสภาพเดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- channel ยังคงเป็น `matrix`
- config ของคุณยังคงอยู่ภายใต้ `channels.matrix`
- ข้อมูลรับรองที่แคชไว้ยังคงอยู่ภายใต้ `~/.openclaw/credentials/matrix/`
- สถานะรันไทม์ยังคงอยู่ภายใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์ config หรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่

## สิ่งที่การย้ายทำให้อัตโนมัติ

เมื่อ gateway เริ่มทำงาน และเมื่อคุณรัน [`openclaw doctor --fix`](/th/gateway/doctor) OpenClaw จะพยายามซ่อมแซมสถานะ Matrix แบบเก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้าย Matrix ใด ๆ ที่สามารถดำเนินการได้จะเปลี่ยนแปลงสถานะบนดิสก์ OpenClaw จะสร้างหรือใช้ recovery snapshot แบบเจาะจงเดิมซ้ำ

เมื่อคุณใช้ `openclaw update` ตัวกระตุ้นที่แน่นอนจะขึ้นอยู่กับวิธีติดตั้ง OpenClaw:

- การติดตั้งจาก source จะรัน `openclaw doctor --fix` ระหว่างโฟลว์อัปเดต จากนั้นรีสตาร์ท gateway ตามค่าเริ่มต้น
- การติดตั้งผ่าน package manager จะอัปเดตแพ็กเกจ รัน doctor แบบ non-interactive หนึ่งรอบ จากนั้นอาศัยการรีสตาร์ท gateway ตามค่าเริ่มต้นเพื่อให้ startup ทำการย้าย Matrix ให้เสร็จ
- หากคุณใช้ `openclaw update --no-restart` การย้าย Matrix ที่อาศัย startup จะถูกเลื่อนไปจนกว่าคุณจะรัน `openclaw doctor --fix` และรีสตาร์ท gateway ในภายหลัง

การย้ายอัตโนมัติครอบคลุม:

- การสร้างหรือใช้ pre-migration snapshot ซ้ำภายใต้ `~/Backups/openclaw-migrations/`
- การใช้ข้อมูลรับรอง Matrix ที่แคชไว้ซ้ำ
- การคง account selection เดิมและ config `channels.matrix`
- การย้าย Matrix sync store แบบ flat ที่เก่าที่สุดไปยังตำแหน่งแบบ account-scoped ปัจจุบัน
- การย้าย Matrix crypto store แบบ flat ที่เก่าที่สุดไปยังตำแหน่งแบบ account-scoped ปัจจุบัน เมื่อสามารถ resolve account เป้าหมายได้อย่างปลอดภัย
- การดึงคีย์ถอดรหัส Matrix room-key backup ที่บันทึกไว้ก่อนหน้านี้จาก rust crypto store เก่า เมื่อคีย์นั้นมีอยู่ในเครื่อง
- การใช้ token-hash storage root ที่สมบูรณ์ที่สุดซ้ำสำหรับ Matrix account, homeserver และ user เดียวกัน เมื่อ access token เปลี่ยนในภายหลัง
- การสแกน token-hash storage root ข้างเคียงเพื่อหา metadata ของการกู้คืนสถานะที่เข้ารหัสซึ่งยังรอดำเนินการ เมื่อ Matrix access token เปลี่ยนแต่ identity ของ account/device ยังคงเดิม
- การกู้คืน room key ที่สำรองไว้เข้าสู่ crypto store ใหม่ในการเริ่ม Matrix ครั้งถัดไป

รายละเอียดของ snapshot:

- OpenClaw จะเขียน marker file ที่ `~/.openclaw/matrix/migration-snapshot.json` หลังจาก snapshot สำเร็จ เพื่อให้การเริ่มทำงานและการซ่อมแซมในรอบถัดไปสามารถใช้ archive เดิมซ้ำได้
- Matrix migration snapshot อัตโนมัติเหล่านี้สำรองเฉพาะ config + state เท่านั้น (`includeWorkspace: false`)
- หาก Matrix มีเพียงสถานะการย้ายแบบ warning-only เช่น เพราะยังไม่มี `userId` หรือ `accessToken` OpenClaw จะยังไม่สร้าง snapshot เนื่องจากยังไม่มีการเปลี่ยนแปลง Matrix ที่สามารถดำเนินการได้
- หากขั้นตอน snapshot ล้มเหลว OpenClaw จะข้ามการย้าย Matrix สำหรับรอบนั้น แทนที่จะเปลี่ยนแปลงสถานะโดยไม่มี recovery point

เกี่ยวกับการอัปเกรดหลายบัญชี:

- Matrix store แบบ flat ตัวเก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์แบบ single-store ดังนั้น OpenClaw จึงสามารถย้ายมันไปยัง Matrix account เป้าหมายที่ resolve ได้เพียงหนึ่งรายการเท่านั้น
- Matrix store แบบเดิมที่เป็น account-scoped อยู่แล้วจะถูกตรวจพบและเตรียมไว้แยกตาม Matrix account ที่กำหนดค่าไว้แต่ละบัญชี

## สิ่งที่การย้ายไม่สามารถทำให้อัตโนมัติได้

Matrix Plugin สาธารณะตัวก่อนหน้า **ไม่ได้** สร้าง Matrix room-key backup โดยอัตโนมัติ มันเก็บสถานะ crypto ภายในเครื่องและร้องขอการยืนยันอุปกรณ์ แต่ไม่ได้รับประกันว่า room key ของคุณถูกสำรองไปยัง homeserver

นั่นหมายความว่าการติดตั้งที่เข้ารหัสบางรายการสามารถย้ายได้เพียงบางส่วนเท่านั้น

OpenClaw ไม่สามารถกู้คืนโดยอัตโนมัติได้ในกรณีต่อไปนี้:

- room key แบบ local-only ที่ไม่เคยถูกสำรอง
- สถานะที่เข้ารหัสเมื่อยังไม่สามารถ resolve Matrix account เป้าหมายได้ เพราะยังไม่มี `homeserver`, `userId` หรือ `accessToken`
- การย้ายอัตโนมัติของ Matrix store แบบ flat ที่ใช้ร่วมกันเพียงชุดเดียว เมื่อมีการกำหนดค่า Matrix หลายบัญชีแต่ไม่ได้ตั้ง `channels.matrix.defaultAccount`
- การติดตั้งผ่าน custom plugin path ที่ถูก pin ไว้กับ repo path แทนที่จะเป็นแพ็กเกจ Matrix มาตรฐาน
- recovery key ที่หายไป เมื่อ store เก่ามีคีย์ที่สำรองไว้แต่ไม่ได้เก็บคีย์ถอดรหัสไว้ในเครื่อง

ขอบเขตของคำเตือนปัจจุบัน:

- การติดตั้ง Matrix plugin ผ่าน custom path จะแสดงโดยทั้ง gateway startup และ `openclaw doctor`

หากการติดตั้งเก่าของคุณมีประวัติที่เข้ารหัสแบบ local-only และไม่เคยถูกสำรอง ข้อความที่เข้ารหัสเก่าบางส่วนอาจยังไม่สามารถอ่านได้หลังการอัปเกรด

## โฟลว์การอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Matrix Plugin ตามปกติ
   แนะนำให้ใช้ `openclaw update` แบบปกติโดยไม่ใช้ `--no-restart` เพื่อให้ startup ทำการย้าย Matrix ให้เสร็จทันที
2. รัน:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานย้ายที่สามารถดำเนินการได้ doctor จะสร้างหรือใช้ pre-migration snapshot ซ้ำก่อน แล้วพิมพ์พาธของ archive ออกมา

3. เริ่มหรือรีสตาร์ท gateway
4. ตรวจสอบสถานะการยืนยันและการสำรองปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. หาก OpenClaw แจ้งว่าต้องใช้ recovery key ให้รัน:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. หากอุปกรณ์นี้ยังไม่ผ่านการยืนยัน ให้รัน:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   หาก recovery key ได้รับการยอมรับและ backup ใช้งานได้ แต่ `Cross-signing verified`
   ยังคงเป็น `no` ให้ทำ self-verification ให้เสร็จจาก Matrix client ตัวอื่น:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอใน Matrix client ตัวอื่น เปรียบเทียบอีโมจิหรือตัวเลขทศนิยม
   และพิมพ์ `yes` เฉพาะเมื่อมันตรงกัน คำสั่งจะออกสำเร็จเฉพาะเมื่อ
   `Cross-signing verified` กลายเป็น `yes`

7. หากคุณตั้งใจละทิ้งประวัติเก่าที่ไม่สามารถกู้คืนได้ และต้องการ baseline ของ backup ใหม่สำหรับข้อความในอนาคต ให้รัน:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. หากยังไม่มี server-side key backup ให้สร้างหนึ่งรายการสำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## วิธีการทำงานของการย้ายแบบเข้ารหัส

การย้ายแบบเข้ารหัสเป็นกระบวนการสองขั้นตอน:

1. Startup หรือ `openclaw doctor --fix` จะสร้างหรือใช้ pre-migration snapshot ซ้ำ หากการย้ายแบบเข้ารหัสสามารถดำเนินการได้
2. Startup หรือ `openclaw doctor --fix` จะตรวจสอบ Matrix crypto store เก่าผ่านการติดตั้ง Matrix Plugin ที่ใช้งานอยู่
3. หากพบ backup decryption key OpenClaw จะเขียนมันเข้าไปในโฟลว์ recovery-key ใหม่ และทำเครื่องหมายว่า room-key restore ยังรอดำเนินการ
4. ในการเริ่ม Matrix ครั้งถัดไป OpenClaw จะกู้คืน room key ที่สำรองไว้เข้าสู่ crypto store ใหม่โดยอัตโนมัติ

หาก store เก่ารายงานว่ามี room key ที่ไม่เคยถูกสำรอง OpenClaw จะเตือนแทนที่จะทำเหมือนว่าการกู้คืนสำเร็จ

## ข้อความที่พบบ่อยและความหมาย

### ข้อความเกี่ยวกับการอัปเกรดและการตรวจพบ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบสถานะ Matrix บนดิสก์แบบเก่าและย้ายไปยังเลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ต้องทำ: ไม่ต้องทำอะไร เว้นแต่เอาต์พุตเดียวกันนั้นจะมีคำเตือนรวมอยู่ด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้าง recovery archive ก่อนเปลี่ยนแปลงสถานะ Matrix
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ไว้จนกว่าคุณจะยืนยันได้ว่าการย้ายสำเร็จ

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบ marker ของ Matrix migration snapshot ที่มีอยู่แล้ว และใช้ archive นั้นซ้ำแทนการสร้าง backup ซ้ำอีกชุด
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ไว้จนกว่าคุณจะยืนยันได้ว่าการย้ายสำเร็จ

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มีสถานะ Matrix แบบเก่าอยู่ แต่ OpenClaw ยังไม่สามารถแมปมันเข้ากับ Matrix account ปัจจุบันได้ เพราะยังไม่ได้กำหนดค่า Matrix
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบสถานะแบบเก่า แต่ยังไม่สามารถระบุ root ของ account/device ปัจจุบันที่แน่นอนได้
- สิ่งที่ต้องทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจากมีข้อมูลรับรองที่แคชไว้แล้ว

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ Matrix store แบบ flat ที่ใช้ร่วมกันเพียงหนึ่งชุด แต่ปฏิเสธที่จะเดาว่าควรย้ายไปยัง Matrix account ที่มีชื่อใด
- สิ่งที่ต้องทำ: ตั้ง `channels.matrix.defaultAccount` ให้เป็นบัญชีที่ตั้งใจใช้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งแบบ account-scoped ใหม่มี sync หรือ crypto store อยู่แล้ว ดังนั้น OpenClaw จึงไม่ได้เขียนทับโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่า account ปัจจุบันเป็นบัญชีที่ถูกต้องก่อนลบหรือย้ายเป้าหมายที่ขัดแย้งด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` หรือ `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้ายสถานะ Matrix แบบเก่า แต่การดำเนินการกับ filesystem ล้มเหลว
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของ filesystem และสถานะดิสก์ จากนั้นรัน `openclaw doctor --fix` ใหม่

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบ Matrix store แบบเข้ารหัสเก่า แต่ยังไม่มี Matrix config ปัจจุบันให้ผูกเข้าด้วยกัน
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: มี encrypted store อยู่ แต่ OpenClaw ยังไม่สามารถตัดสินใจอย่างปลอดภัยได้ว่ามันเป็นของ account/device ปัจจุบันตัวใด
- สิ่งที่ต้องทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจากมีข้อมูลรับรองที่แคชไว้แล้ว

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ legacy crypto store แบบ flat ที่ใช้ร่วมกันเพียงชุดเดียว แต่ปฏิเสธที่จะเดาว่าควรย้ายไปยัง Matrix account ที่มีชื่อใด
- สิ่งที่ต้องทำ: ตั้ง `channels.matrix.defaultAccount` ให้เป็นบัญชีที่ตั้งใจใช้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบสถานะ Matrix แบบเก่า แต่การย้ายยังถูกบล็อกด้วยข้อมูล identity หรือข้อมูลรับรองที่ยังขาดอยู่
- สิ่งที่ต้องทำ: ทำ Matrix login หรือการตั้งค่า config ให้เสร็จ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบสถานะ Matrix แบบเข้ารหัสเก่า แต่ไม่สามารถโหลด helper entrypoint จาก Matrix Plugin ที่ปกติใช้ตรวจสอบ store นั้นได้
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่หรือซ่อมแซม (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ repo checkout) แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบพาธไฟล์ helper ที่หลุดออกนอก root ของ Plugin หรือไม่ผ่านการตรวจสอบขอบเขตของ Plugin จึงปฏิเสธที่จะ import มัน
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่จากพาธที่เชื่อถือได้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะเปลี่ยนแปลงสถานะ Matrix เพราะไม่สามารถสร้าง recovery snapshot ได้ก่อน
- สิ่งที่ต้องทำ: แก้ไขข้อผิดพลาดของ backup แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ท gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: กลไก fallback ฝั่งไคลเอนต์ของ Matrix พบ storage แบบ flat เก่า แต่การย้ายล้มเหลว ตอนนี้ OpenClaw จะยกเลิก fallback นั้นแทนการเริ่มต้นแบบเงียบ ๆ ด้วย store ใหม่
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของ filesystem หรือความขัดแย้งต่าง ๆ เก็บสถานะแบบเก่าไว้ให้สมบูรณ์ แล้วลองใหม่หลังจากแก้ไขข้อผิดพลาดแล้ว

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกตรึงไว้กับการติดตั้งจาก path ดังนั้นการอัปเดตตามสายหลักจะไม่แทนที่มันด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อต้องการกลับไปใช้ Matrix Plugin เริ่มต้น

### ข้อความเกี่ยวกับการกู้คืนสถานะที่เข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: room key ที่สำรองไว้ถูกกู้คืนเข้าสู่ crypto store ใหม่สำเร็จแล้ว
- สิ่งที่ต้องทำ: โดยทั่วไปไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: room key เก่าบางรายการมีอยู่เฉพาะใน store เก่าในเครื่อง และไม่เคยถูกอัปโหลดไปยัง Matrix backup
- สิ่งที่ต้องทำ: คาดว่าประวัติที่เข้ารหัสเก่าบางส่วนจะยังไม่พร้อมใช้งาน เว้นแต่คุณจะสามารถกู้คืนคีย์เหล่านั้นด้วยตนเองจากไคลเอนต์ที่ผ่านการยืนยันอีกตัวหนึ่งได้

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- ความหมาย: มี backup อยู่ แต่ OpenClaw ไม่สามารถกู้คืน recovery key ได้โดยอัตโนมัติ
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบ encrypted store เก่า แต่ไม่สามารถตรวจสอบมันได้อย่างปลอดภัยเพียงพอเพื่อเตรียมการกู้คืน
- สิ่งที่ต้องทำ: รัน `openclaw doctor --fix` ใหม่ หากยังเกิดซ้ำ ให้คงไดเรกทอรีสถานะแบบเก่าไว้ และกู้คืนโดยใช้ Matrix client ที่ผ่านการยืนยันอีกตัวหนึ่งร่วมกับ `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบความขัดแย้งของ backup key และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่า recovery key ใดถูกต้องก่อนลองคำสั่ง restore ใด ๆ อีกครั้ง

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือขีดจำกัดที่หลีกเลี่ยงไม่ได้ของรูปแบบ storage แบบเก่า
- สิ่งที่ต้องทำ: คีย์ที่สำรองไว้ยังคงกู้คืนได้ แต่ประวัติที่เข้ารหัสแบบ local-only อาจยังไม่พร้อมใช้งาน

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืนแล้ว แต่ Matrix ส่งข้อผิดพลาดกลับมา
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup status` จากนั้นลองใหม่ด้วย `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` หากจำเป็น

### ข้อความเกี่ยวกับการกู้คืนด้วยตนเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw รู้ว่าคุณควรมี backup key แต่ยังไม่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore` หรือส่ง `--recovery-key` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: อุปกรณ์นี้ยังไม่ได้เก็บ recovery key ไว้ในขณะนี้
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ด้วย recovery key ของคุณก่อน แล้วจึงกู้คืน backup

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- ความหมาย: คีย์ที่เก็บไว้ไม่ตรงกับ Matrix backup ที่ใช้งานอยู่
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ใหม่ด้วยคีย์ที่ถูกต้อง

หากคุณยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าซึ่งกู้คืนไม่ได้ คุณสามารถรีเซ็ต
baseline ของ backup ปัจจุบันได้แทนด้วย `openclaw matrix verify backup reset --yes` เมื่อ
secret ของ backup ที่เก็บไว้เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
backup key ใหม่สามารถโหลดได้อย่างถูกต้องหลังการรีสตาร์ท

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- ความหมาย: มี backup อยู่ แต่เครื่องนี้ยังไม่เชื่อถือ cross-signing chain มากพอ
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ใหม่

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนการกู้คืนโดยไม่ได้ระบุ recovery key ในกรณีที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: รันคำสั่งใหม่พร้อม recovery key ของคุณ

`Invalid Matrix recovery key: ...`

- ความหมาย: คีย์ที่ให้มาไม่สามารถ parse ได้ หรือไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองใหม่ด้วย recovery key แบบตรงตัวจาก Matrix client หรือไฟล์ recovery-key ของคุณ

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: OpenClaw สามารถใช้ recovery key ได้ แต่ Matrix ยังไม่
  สร้างความเชื่อถือของ identity แบบ cross-signing เต็มรูปแบบสำหรับอุปกรณ์นี้ ตรวจสอบ
  เอาต์พุตของคำสั่งสำหรับ `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` และ `Device verified by owner`
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify self`, ยอมรับคำขอใน Matrix client
  อีกตัว เปรียบเทียบ SAS และพิมพ์ `yes` เฉพาะเมื่อมันตรงกัน คำสั่งจะรอ
  จนกว่าจะได้ความเชื่อถือ identity ของ Matrix แบบเต็มก่อนรายงานความสำเร็จ ใช้
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  เฉพาะเมื่อคุณตั้งใจจะแทนที่ identity ของ cross-signing ปัจจุบัน

`Matrix key backup is not active on this device after loading from secret storage.`

- ความหมาย: secret storage ไม่ได้สร้างเซสชัน backup ที่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ก่อน จากนั้นตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- ความหมาย: อุปกรณ์นี้ไม่สามารถกู้คืนจาก secret storage ได้จนกว่าจะยืนยันอุปกรณ์เสร็จ
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify device "<your-recovery-key>"` ก่อน

### ข้อความเกี่ยวกับการติดตั้ง Plugin แบบกำหนดเอง

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: บันทึกการติดตั้ง Plugin ของคุณชี้ไปยังพาธในเครื่องที่ไม่มีอยู่แล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณกำลังรันจาก repo checkout ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`

## หากประวัติที่เข้ารหัสยังไม่กลับมา

รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

หาก backup ถูกกู้คืนสำเร็จ แต่บางห้องเก่ายังไม่มีประวัติ คีย์ที่หายไปเหล่านั้นน่าจะไม่เคยถูกสำรองโดย Plugin ตัวก่อนหน้า

## หากคุณต้องการเริ่มใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสียประวัติที่เข้ารหัสเก่าที่กู้คืนไม่ได้ และต้องการเพียง baseline ของ backup ที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากอุปกรณ์ยังไม่ผ่านการยืนยันหลังจากนั้น ให้ทำการยืนยันให้เสร็จจาก Matrix client ของคุณโดยเปรียบเทียบอีโมจิ SAS หรือรหัสทศนิยม แล้วจึงยืนยันว่าตรงกัน

## หน้าที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix)
- [Doctor](/th/gateway/doctor)
- [การย้าย](/th/install/migrating)
- [Plugins](/th/tools/plugin)
