---
read_when:
    - การอัปเกรดการติดตั้ง Matrix ที่มีอยู่เดิม
    - การย้ายประวัติ Matrix ที่เข้ารหัสและสถานะอุปกรณ์【อ่านข้อความเต็มanalysis to=final code arsenal/json নয়
summary: OpenClaw อัปเกรด Matrix Plugin เดิมแบบแทนที่ของเดิมอย่างไร รวมถึงขีดจำกัดในการกู้คืนสถานะที่เข้ารหัสและขั้นตอนการกู้คืนด้วยตนเอง
title: การย้ายระบบ Matrix
x-i18n:
    generated_at: "2026-04-26T11:34:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

หน้านี้ครอบคลุมการอัปเกรดจาก `matrix` Plugin สาธารณะรุ่นก่อนหน้าไปยัง implementation ปัจจุบัน

สำหรับผู้ใช้ส่วนใหญ่ การอัปเกรดจะเป็นแบบแทนที่ของเดิม:

- Plugin ยังคงเป็น `@openclaw/matrix`
- channel ยังคงเป็น `matrix`
- config ของคุณยังคงอยู่ภายใต้ `channels.matrix`
- credentials ที่แคชไว้ยังคงอยู่ภายใต้ `~/.openclaw/credentials/matrix/`
- runtime state ยังคงอยู่ภายใต้ `~/.openclaw/matrix/`

คุณไม่จำเป็นต้องเปลี่ยนชื่อคีย์ใน config หรือติดตั้ง Plugin ใหม่ภายใต้ชื่อใหม่

## สิ่งที่การย้ายระบบทำให้อัตโนมัติ

เมื่อ gateway เริ่มทำงาน และเมื่อคุณรัน [`openclaw doctor --fix`](/th/gateway/doctor) OpenClaw จะพยายามซ่อมแซม Matrix state แบบเก่าโดยอัตโนมัติ
ก่อนที่ขั้นตอนการย้ายระบบ Matrix ที่ดำเนินการได้จริงจะเปลี่ยน on-disk state OpenClaw จะสร้างหรือใช้ recovery snapshot แบบเจาะจงซ้ำก่อนเสมอ

เมื่อคุณใช้ `openclaw update` ตัวกระตุ้นที่แน่ชัดจะขึ้นอยู่กับวิธีที่ติดตั้ง OpenClaw:

- การติดตั้งจากซอร์สจะรัน `openclaw doctor --fix` ระหว่าง flow การอัปเดต แล้วรีสตาร์ต gateway โดยค่าเริ่มต้น
- การติดตั้งผ่าน package manager จะอัปเดตแพ็กเกจ รัน doctor pass แบบ non-interactive แล้วพึ่งพาการรีสตาร์ต gateway ตามค่าเริ่มต้น เพื่อให้การเริ่มทำงานทำ Matrix migration จนเสร็จ
- หากคุณใช้ `openclaw update --no-restart` Matrix migration ที่อิงกับการเริ่มทำงานจะถูกเลื่อนไปจนกว่าคุณจะรัน `openclaw doctor --fix` และรีสตาร์ต gateway ในภายหลัง

การย้ายระบบอัตโนมัติครอบคลุม:

- การสร้างหรือใช้ pre-migration snapshot ซ้ำภายใต้ `~/Backups/openclaw-migrations/`
- การใช้ Matrix credentials ที่แคชไว้ซ้ำ
- การคงการเลือกบัญชีเดิมและ config `channels.matrix`
- การย้าย Matrix sync store แบบ flat ที่เก่าที่สุดไปยังตำแหน่งแบบ account-scoped ปัจจุบัน
- การย้าย Matrix crypto store แบบ flat ที่เก่าที่สุดไปยังตำแหน่งแบบ account-scoped ปัจจุบัน เมื่อสามารถ resolve บัญชีเป้าหมายได้อย่างปลอดภัย
- การดึง room-key backup decryption key ของ Matrix ที่เคยบันทึกไว้จาก rust crypto store เดิม เมื่อมีคีย์นั้นอยู่ในเครื่อง
- การใช้ token-hash storage root เดิมที่สมบูรณ์ที่สุดซ้ำสำหรับ Matrix account, homeserver และ user เดียวกัน เมื่อ access token เปลี่ยนในภายหลัง
- การสแกน token-hash storage roots ข้างเคียงเพื่อหาข้อมูล metadata สำหรับการกู้คืน encrypted-state ที่รอดำเนินการ เมื่อ Matrix access token เปลี่ยน แต่ตัวตนของ account/device ยังคงเดิม
- การกู้คืน room keys ที่สำรองไว้กลับเข้า crypto store ใหม่ในครั้งถัดไปที่ Matrix เริ่มทำงาน

รายละเอียดของ snapshot:

- OpenClaw จะเขียน marker file ที่ `~/.openclaw/matrix/migration-snapshot.json` หลังสร้าง snapshot สำเร็จ เพื่อให้การเริ่มทำงานและ repair pass ภายหลังสามารถใช้ archive เดิมซ้ำได้
- Matrix migration snapshots อัตโนมัติเหล่านี้จะสำรองเฉพาะ config + state (`includeWorkspace: false`)
- หาก Matrix มีเพียง migration state ระดับคำเตือนเท่านั้น เช่น เพราะยังไม่มี `userId` หรือ `accessToken` OpenClaw จะยังไม่สร้าง snapshot เนื่องจากยังไม่มี Matrix mutation ใดที่ดำเนินการได้จริง
- หากขั้นตอน snapshot ล้มเหลว OpenClaw จะข้าม Matrix migration ในรอบนั้น แทนการเปลี่ยน state โดยไม่มีจุดกู้คืน

เกี่ยวกับการอัปเกรดแบบหลายบัญชี:

- Matrix store แบบ flat ที่เก่าที่สุด (`~/.openclaw/matrix/bot-storage.json` และ `~/.openclaw/matrix/crypto/`) มาจากเลย์เอาต์แบบ single-store ดังนั้น OpenClaw จึงย้ายมันไปยัง Matrix account เป้าหมายที่ resolve ได้เพียงบัญชีเดียวเท่านั้น
- Matrix stores แบบ legacy ที่เป็น account-scoped อยู่แล้ว จะถูกตรวจพบและเตรียมแยกตาม Matrix account ที่กำหนดค่าไว้แต่ละบัญชี

## สิ่งที่การย้ายระบบทำให้อัตโนมัติไม่ได้

`matrix` Plugin สาธารณะรุ่นก่อนหน้า **ไม่ได้** สร้าง Matrix room-key backups โดยอัตโนมัติ มันบันทึก local crypto state และร้องขอการยืนยันอุปกรณ์ แต่ไม่ได้รับประกันว่า room keys ของคุณถูกสำรองไปยัง homeserver

นั่นหมายความว่าการติดตั้งที่เข้ารหัสบางรายการสามารถย้ายระบบได้เพียงบางส่วนเท่านั้น

OpenClaw ไม่สามารถกู้คืนโดยอัตโนมัติได้ในกรณีต่อไปนี้:

- room keys ที่มีอยู่เฉพาะในเครื่องและไม่เคยถูกสำรอง
- encrypted state เมื่อยัง resolve Matrix account เป้าหมายไม่ได้ เพราะ `homeserver`, `userId` หรือ `accessToken` ยังไม่พร้อมใช้งาน
- การย้ายระบบอัตโนมัติของ Matrix store แบบ flat ที่ใช้ร่วมกันหนึ่งชุด เมื่อมีการกำหนดค่า Matrix accounts หลายรายการแต่ไม่ได้ตั้ง `channels.matrix.defaultAccount`
- การติดตั้งผ่าน custom plugin path ที่ปักหมุดไว้กับ repo path แทนแพ็กเกจ Matrix มาตรฐาน
- recovery key ที่หายไป ในกรณีที่ store เดิมมี backed-up keys แต่ไม่ได้เก็บ decryption key ไว้ในเครื่อง

ขอบเขตคำเตือนปัจจุบัน:

- การติดตั้ง Matrix Plugin ผ่าน custom path จะแสดงโดยทั้งการเริ่มทำงานของ gateway และ `openclaw doctor`

หากการติดตั้งเก่าของคุณมี encrypted history แบบ local-only ที่ไม่เคยถูกสำรอง ข้อความที่เข้ารหัสเก่าบางส่วนอาจยังคงอ่านไม่ได้หลังการอัปเกรด

## flow การอัปเกรดที่แนะนำ

1. อัปเดต OpenClaw และ Matrix Plugin ตามปกติ
   ควรใช้ `openclaw update` แบบปกติโดยไม่ใส่ `--no-restart` เพื่อให้การเริ่มทำงานทำ Matrix migration จนเสร็จทันที
2. รัน:

   ```bash
   openclaw doctor --fix
   ```

   หาก Matrix มีงานย้ายระบบที่ดำเนินการได้จริง doctor จะสร้างหรือใช้ pre-migration snapshot เดิมซ้ำก่อน แล้วพิมพ์พาธของ archive ออกมา

3. เริ่มหรือรีสตาร์ต gateway
4. ตรวจสอบสถานะการยืนยันและการสำรองปัจจุบัน:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ใส่ recovery key สำหรับ Matrix account ที่คุณกำลังซ่อมแซมลงในตัวแปรสภาพแวดล้อมเฉพาะบัญชี สำหรับบัญชี default เดียว `MATRIX_RECOVERY_KEY` ก็เพียงพอ สำหรับหลายบัญชี ให้ใช้ตัวแปรแยกต่อบัญชี เช่น `MATRIX_RECOVERY_KEY_ASSISTANT` และเพิ่ม `--account assistant` ในคำสั่ง

6. หาก OpenClaw แจ้งว่าต้องใช้ recovery key ให้รันคำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน ให้รันคำสั่งสำหรับบัญชีที่ตรงกัน:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   หาก recovery key ถูกยอมรับและ backup ใช้งานได้ แต่ `Cross-signing verified`
   ยังเป็น `no` ให้ทำ self-verification ให้เสร็จจาก Matrix client อื่น:

   ```bash
   openclaw matrix verify self
   ```

   ยอมรับคำขอใน Matrix client อื่น เปรียบเทียบ emoji หรือตัวเลขทศนิยม
   แล้วพิมพ์ `yes` เฉพาะเมื่อค่าตรงกัน คำสั่งจะออกสำเร็จ
   ก็ต่อเมื่อ `Cross-signing verified` กลายเป็น `yes`

8. หากคุณตั้งใจจะละทิ้งประวัติเก่าที่กู้คืนไม่ได้ และต้องการ baseline ของ backup ใหม่สำหรับข้อความในอนาคต ให้รัน:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. หากยังไม่มี server-side key backup ให้สร้างไว้สำหรับการกู้คืนในอนาคต:

   ```bash
   openclaw matrix verify bootstrap
   ```

## วิธีการทำงานของการย้ายระบบแบบเข้ารหัส

การย้ายระบบแบบเข้ารหัสเป็นกระบวนการสองขั้นตอน:

1. ตอนเริ่มทำงานหรือเมื่อรัน `openclaw doctor --fix` ระบบจะสร้างหรือใช้ pre-migration snapshot เดิมซ้ำ หาก encrypted migration ดำเนินการได้จริง
2. ตอนเริ่มทำงานหรือเมื่อรัน `openclaw doctor --fix` ระบบจะตรวจสอบ Matrix crypto store เดิมผ่าน Matrix Plugin ที่ติดตั้งอยู่
3. หากพบ backup decryption key OpenClaw จะเขียนคีย์นั้นเข้าไปใน flow ของ recovery-key ใหม่ และทำเครื่องหมายว่า room-key restore ยังรอดำเนินการ
4. ในการเริ่มทำงานของ Matrix ครั้งถัดไป OpenClaw จะกู้คืน room keys ที่สำรองไว้กลับเข้า crypto store ใหม่โดยอัตโนมัติ

หาก store เดิมรายงานว่ามี room keys ที่ไม่เคยถูกสำรอง OpenClaw จะเตือน แทนที่จะแสร้งว่ากู้คืนสำเร็จ

## ข้อความที่พบบ่อยและความหมาย

### ข้อความเกี่ยวกับการอัปเกรดและการตรวจพบ

`Matrix plugin upgraded in place.`

- ความหมาย: ตรวจพบ Matrix state เดิมบนดิสก์และย้ายเข้าสู่เลย์เอาต์ปัจจุบันแล้ว
- สิ่งที่ต้องทำ: ไม่ต้องทำอะไร เว้นแต่ว่าผลลัพธ์เดียวกันนั้นจะมีคำเตือนรวมอยู่ด้วย

`Matrix migration snapshot created before applying Matrix upgrades.`

- ความหมาย: OpenClaw สร้าง recovery archive ก่อนเปลี่ยน Matrix state
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ไว้นั้นไว้จนกว่าคุณจะยืนยันได้ว่าการย้ายระบบสำเร็จ

`Matrix migration snapshot reused before applying Matrix upgrades.`

- ความหมาย: OpenClaw พบ Matrix migration snapshot marker ที่มีอยู่แล้ว และใช้ archive เดิมซ้ำแทนการสร้าง backup ซ้ำ
- สิ่งที่ต้องทำ: เก็บพาธ archive ที่พิมพ์ไว้นั้นไว้จนกว่าคุณจะยืนยันได้ว่าการย้ายระบบสำเร็จ

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: มี Matrix state แบบเก่าอยู่ แต่ OpenClaw ยังแมปมันกับ Matrix account ปัจจุบันไม่ได้ เพราะยังไม่ได้กำหนดค่า Matrix
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: OpenClaw พบ state แบบเก่า แต่ยังไม่สามารถระบุราก account/device ปัจจุบันที่แน่ชัดได้
- สิ่งที่ต้องทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลังจากมี cached credentials แล้ว

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ Matrix store แบบ flat ที่ใช้ร่วมกันหนึ่งชุด แต่ปฏิเสธที่จะเดาว่าควรย้ายไปยัง Matrix account ที่ตั้งชื่อไว้ตัวใด
- สิ่งที่ต้องทำ: ตั้ง `channels.matrix.defaultAccount` ให้เป็นบัญชีที่ตั้งใจใช้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix legacy sync store not migrated because the target already exists (...)`

- ความหมาย: ตำแหน่งแบบ account-scoped ใหม่มี sync หรือ crypto store อยู่แล้ว ดังนั้น OpenClaw จึงไม่เขียนทับให้อัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบว่าบัญชีปัจจุบันเป็นบัญชีที่ถูกต้อง ก่อนลบหรือย้าย target ที่ขัดกันด้วยตนเอง

`Failed migrating Matrix legacy sync store (...)` หรือ `Failed migrating Matrix legacy crypto store (...)`

- ความหมาย: OpenClaw พยายามย้าย Matrix state แบบเก่าแล้ว แต่การดำเนินการกับระบบไฟล์ล้มเหลว
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์และสถานะดิสก์ แล้วรัน `openclaw doctor --fix` ใหม่

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- ความหมาย: OpenClaw พบ Matrix store แบบเข้ารหัสเก่า แต่ยังไม่มี Matrix config ปัจจุบันให้ผูกใช้งาน
- สิ่งที่ต้องทำ: กำหนดค่า `channels.matrix` แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- ความหมาย: มี encrypted store อยู่ แต่ OpenClaw ยังตัดสินอย่างปลอดภัยไม่ได้ว่ามันเป็นของ account/device ปัจจุบันใด
- สิ่งที่ต้องทำ: เริ่ม gateway หนึ่งครั้งด้วย Matrix login ที่ใช้งานได้ หรือรัน `openclaw doctor --fix` ใหม่หลัง cached credentials พร้อมใช้งาน

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- ความหมาย: OpenClaw พบ legacy crypto store แบบ flat ที่ใช้ร่วมกันหนึ่งชุด แต่ปฏิเสธที่จะเดาว่าควรย้ายไปยัง Matrix account ที่ตั้งชื่อไว้ตัวใด
- สิ่งที่ต้องทำ: ตั้ง `channels.matrix.defaultAccount` ให้เป็นบัญชีที่ตั้งใจใช้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- ความหมาย: OpenClaw ตรวจพบ Matrix state แบบเก่า แต่การย้ายระบบยังติดอยู่เพราะขาดข้อมูลตัวตนหรือ credentials
- สิ่งที่ต้องทำ: ทำ Matrix login หรือการตั้งค่า config ให้เสร็จ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- ความหมาย: OpenClaw พบ Matrix state แบบเข้ารหัสเก่า แต่ไม่สามารถโหลด helper entrypoint จาก Matrix Plugin ซึ่งปกติใช้ตรวจสอบ store นั้นได้
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่หรือซ่อมแซม (`openclaw plugins install @openclaw/matrix` หรือ `openclaw plugins install ./path/to/local/matrix-plugin` สำหรับ repo checkout) แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- ความหมาย: OpenClaw พบพาธไฟล์ helper ที่ออกนอก plugin root หรือไม่ผ่านการตรวจสอบขอบเขตของ Plugin จึงปฏิเสธการ import
- สิ่งที่ต้องทำ: ติดตั้ง Matrix Plugin ใหม่จากพาธที่เชื่อถือได้ แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- ความหมาย: OpenClaw ปฏิเสธที่จะเปลี่ยน Matrix state เพราะยังสร้าง recovery snapshot ก่อนหน้าไม่ได้
- สิ่งที่ต้องทำ: แก้ปัญหา backup ก่อน แล้วรัน `openclaw doctor --fix` ใหม่หรือรีสตาร์ต gateway

`Failed migrating legacy Matrix client storage: ...`

- ความหมาย: fallback ฝั่งไคลเอนต์ของ Matrix พบ storage แบบ flat เก่า แต่การย้ายล้มเหลว ตอนนี้ OpenClaw จะยกเลิก fallback นั้นแทนที่จะเริ่มด้วย store ใหม่แบบเงียบ ๆ
- สิ่งที่ต้องทำ: ตรวจสอบสิทธิ์ของระบบไฟล์หรือความขัดแย้ง คง state เดิมไว้ แล้วลองใหม่หลังจากแก้ข้อผิดพลาดแล้ว

`Matrix is installed from a custom path: ...`

- ความหมาย: Matrix ถูกปักหมุดไว้กับการติดตั้งแบบพาธ ดังนั้นการอัปเดตสายหลักจะไม่แทนที่มันด้วยแพ็กเกจ Matrix มาตรฐานของ repo โดยอัตโนมัติ
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` เมื่อคุณต้องการกลับไปใช้ Matrix Plugin เริ่มต้น

### ข้อความเกี่ยวกับการกู้คืนสถานะแบบเข้ารหัส

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- ความหมาย: room keys ที่สำรองไว้ถูกกู้คืนเข้า crypto store ใหม่สำเร็จแล้ว
- สิ่งที่ต้องทำ: โดยปกติไม่ต้องทำอะไร

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- ความหมาย: room keys เก่าบางส่วนมีอยู่เฉพาะใน store เดิมภายในเครื่อง และไม่เคยถูกอัปโหลดไปยัง Matrix backup
- สิ่งที่ต้องทำ: คาดหวังได้ว่าประวัติที่เข้ารหัสเก่าบางส่วนจะยังใช้งานไม่ได้ เว้นแต่คุณจะสามารถกู้คืนคีย์เหล่านั้นด้วยตนเองจากไคลเอนต์อื่นที่ได้รับการยืนยันแล้ว

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- ความหมาย: มี backup อยู่ แต่ OpenClaw ไม่สามารถกู้ recovery key ได้โดยอัตโนมัติ
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- ความหมาย: OpenClaw พบ encrypted store เดิม แต่ไม่สามารถตรวจสอบมันได้อย่างปลอดภัยเพียงพอสำหรับการเตรียมกู้คืน
- สิ่งที่ต้องทำ: รัน `openclaw doctor --fix` ใหม่ หากยังเกิดซ้ำ ให้คงไดเรกทอรี state เดิมไว้ และกู้คืนโดยใช้ Matrix client อื่นที่ได้รับการยืนยันแล้วร่วมกับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- ความหมาย: OpenClaw ตรวจพบความขัดแย้งของ backup key และปฏิเสธที่จะเขียนทับไฟล์ recovery-key ปัจจุบันโดยอัตโนมัติ
- สิ่งที่ต้องทำ: ตรวจสอบก่อนว่า recovery key ใดถูกต้องก่อนลองรันคำสั่งกู้คืนอีกครั้ง

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- ความหมาย: นี่คือขีดจำกัดที่เลี่ยงไม่ได้ของรูปแบบ storage แบบเก่า
- สิ่งที่ต้องทำ: ยังสามารถกู้คืน backed-up keys ได้ แต่ encrypted history แบบ local-only อาจยังคงใช้งานไม่ได้

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- ความหมาย: Plugin ใหม่พยายามกู้คืนแล้ว แต่ Matrix คืนข้อผิดพลาดกลับมา
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup status` แล้วลองใหม่ด้วย `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

### ข้อความเกี่ยวกับการกู้คืนด้วยตนเอง

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- ความหมาย: OpenClaw ทราบว่าคุณควรมี backup key แต่คีย์นั้นยังไม่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify backup restore` หรือกำหนด `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` หากจำเป็น

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- ความหมาย: ขณะนี้อุปกรณ์นี้ยังไม่มี recovery key ถูกจัดเก็บไว้
- สิ่งที่ต้องทำ: กำหนด `MATRIX_RECOVERY_KEY`, รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` แล้วจึงกู้คืน backup

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- ความหมาย: คีย์ที่เก็บไว้ไม่ตรงกับ Matrix backup ที่ใช้งานอยู่
- สิ่งที่ต้องทำ: ตั้ง `MATRIX_RECOVERY_KEY` เป็นคีย์ที่ถูกต้อง แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

หากคุณยอมรับการสูญเสีย encrypted history เก่าที่กู้คืนไม่ได้ คุณสามารถรีเซ็ต
backup baseline ปัจจุบันได้แทนด้วย `openclaw matrix verify backup reset --yes` เมื่อ
stored backup secret เสียหาย การรีเซ็ตนั้นอาจสร้าง secret storage ใหม่ด้วย เพื่อให้
backup key ใหม่โหลดได้ถูกต้องหลังรีสตาร์ต

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- ความหมาย: มี backup อยู่ แต่ขณะนี้อุปกรณ์นี้ยังไม่เชื่อ trust chain ของ cross-signing อย่างแน่นหนาพอ
- สิ่งที่ต้องทำ: ตั้ง `MATRIX_RECOVERY_KEY` แล้วรัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Matrix recovery key is required`

- ความหมาย: คุณพยายามทำขั้นตอนกู้คืนโดยไม่ส่ง recovery key ทั้งที่จำเป็นต้องใช้
- สิ่งที่ต้องทำ: รันคำสั่งอีกครั้งพร้อม `--recovery-key-stdin` เช่น `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`

`Invalid Matrix recovery key: ...`

- ความหมาย: recovery key ที่ให้มาไม่สามารถ parse ได้ หรือไม่ตรงกับรูปแบบที่คาดไว้
- สิ่งที่ต้องทำ: ลองใหม่ด้วย recovery key แบบตรงตัวจาก Matrix client หรือไฟล์ recovery-key ของคุณ

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- ความหมาย: OpenClaw สามารถใช้ recovery key ได้ แต่ Matrix ยังไม่ได้
  สร้างความเชื่อถือของตัวตนแบบ cross-signing อย่างสมบูรณ์สำหรับอุปกรณ์นี้ ตรวจสอบ
  เอาต์พุตของคำสั่งว่ามี `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` และ `Device verified by owner` หรือไม่
- สิ่งที่ต้องทำ: รัน `openclaw matrix verify self`, ยอมรับคำขอใน
  Matrix client อื่น เปรียบเทียบ SAS แล้วพิมพ์ `yes` เฉพาะเมื่อค่าตรงกัน คำสั่ง
  จะรอจนมี Matrix identity trust อย่างสมบูรณ์ก่อนจึงจะรายงานว่าทำสำเร็จ ใช้
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  เฉพาะเมื่อคุณตั้งใจจะแทนที่ cross-signing identity ปัจจุบันเท่านั้น

`Matrix key backup is not active on this device after loading from secret storage.`

- ความหมาย: secret storage ไม่ได้สร้าง backup session ที่ active บนอุปกรณ์นี้
- สิ่งที่ต้องทำ: ยืนยันอุปกรณ์ก่อน จากนั้นตรวจสอบอีกครั้งด้วย `openclaw matrix verify backup status`

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- ความหมาย: อุปกรณ์นี้ไม่สามารถกู้คืนจาก secret storage ได้จนกว่าการยืนยันอุปกรณ์จะเสร็จสิ้น
- สิ่งที่ต้องทำ: รัน `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` ก่อน

### ข้อความเกี่ยวกับการติดตั้ง Plugin แบบกำหนดเอง

`Matrix is installed from a custom path that no longer exists: ...`

- ความหมาย: record การติดตั้ง Plugin ของคุณชี้ไปยัง local path ที่ไม่มีอยู่อีกแล้ว
- สิ่งที่ต้องทำ: ติดตั้งใหม่ด้วย `openclaw plugins install @openclaw/matrix` หรือหากคุณกำลังรันจาก repo checkout ให้ใช้ `openclaw plugins install ./path/to/local/matrix-plugin`

## หาก encrypted history ยังไม่กลับมา

รันการตรวจสอบเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

หาก backup กู้คืนสำเร็จ แต่ห้องเก่าบางห้องยังขาดประวัติอยู่ คีย์ที่หายไปเหล่านั้นน่าจะไม่เคยถูกสำรองโดย Plugin ตัวก่อนหน้า

## หากคุณต้องการเริ่มต้นใหม่สำหรับข้อความในอนาคต

หากคุณยอมรับการสูญเสีย encrypted history เก่าที่กู้คืนไม่ได้ และต้องการเพียง backup baseline ที่สะอาดสำหรับอนาคต ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

หากหลังจากนั้นอุปกรณ์ยังไม่ถูกยืนยัน ให้ทำการยืนยันจาก Matrix client ของคุณให้เสร็จ โดยเปรียบเทียบ SAS emoji หรือรหัสตัวเลขทศนิยมและยืนยันว่าตรงกัน

## หน้าที่เกี่ยวข้อง

- [Matrix](/th/channels/matrix)
- [Doctor](/th/gateway/doctor)
- [การย้ายระบบ](/th/install/migrating)
- [Plugins](/th/tools/plugin)
