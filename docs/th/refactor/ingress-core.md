---
read_when:
    - ตรวจสอบสาเหตุที่การรีแฟกเตอร์ส่วนรับเข้าของช่องทางเพิ่มโค้ดมากเกินไป
    - การย้ายนโยบายเส้นทาง คำสั่ง เหตุการณ์ การเปิดใช้งาน หรือกลุ่มการเข้าถึงจาก Plugin ที่บันเดิลมาไปไว้ในแกนหลัก
    - การตรวจสอบว่าตัวช่วยขาเข้าของช่องทางลบโค้ด Plugin ที่รวมมาจริงหรือไม่
sidebarTitle: Ingress core deletion
summary: แผนที่เริ่มจากการลบสำหรับย้ายโค้ดเชื่อมต่อการรับข้อมูลเข้าช่องทางที่ซ้ำกันเข้าไปไว้ในแกนหลัก
title: แผนการลบแกนหลักขาเข้า
x-i18n:
    generated_at: "2026-05-10T19:56:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# แผนการลบแกนกลางขาเข้า

การรีแฟกเตอร์ขาเข้ายังไม่ดีต่อสุขภาพตราบใดที่มันเพิ่มบรรทัดสุทธิหลายพันบรรทัด การรวมศูนย์ไว้ที่แกนกลางจะนับว่ามีผลก็ต่อเมื่อโค้ดโปรดักชันของ Plugin ที่รวมมาในชุดเล็กลง และความเข้ากันได้กับ SDK ของบุคคลที่สามแบบเก่าถูกกักไว้ในชิมของ SDK/แกนกลาง

รูปทรงรันไทม์ที่ต้องการ:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Plugin ที่รวมมาในชุดไม่ควรแปลขาเข้ากลับเป็นรูปทรง `AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` หรือ `{ allowed, reasonCode }` แบบโลคัล เว้นแต่ชนิดนั้นจะเป็น API สาธารณะของ Plugin

## งบประมาณ

วัดเทียบกับ merge-base ของ PR กับ `origin/main` รวมไฟล์ที่ยังไม่ได้ติดตามด้วย

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

งานเก็บกวาดขั้นต่ำที่ยังเหลือ:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

การลบเฉพาะคอมเมนต์ไม่นับเป็นการเก็บกวาด รอบงบประมาณก่อนหน้านี้ใจกว้างเกินไปเพราะรวมคอมเมนต์อธิบายของ QQBot ที่ถูกกู้คืนกลับมา เอกสารนี้ติดตามเฉพาะการย้ายโค้ดที่รันได้/เอกสาร/ทดสอบเท่านั้น

วัดใหม่หลังแต่ละระลอกการเก็บกวาด:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## การวินิจฉัย

รอบแรกเพิ่มเคอร์เนลขาเข้าที่ใช้ร่วมกัน แล้วปล่อยตรรกะการอนุญาตแบบ Plugin-local ไว้ข้างๆ มากเกินไป:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

นั่นทำให้โมเดลซ้ำซ้อน โค้ดโปรดักชันแกนกลางเพิ่มขึ้นประมาณ 3,376 บรรทัด ขณะที่โค้ดโปรดักชันของ Plugin ที่รวมมาในชุดเล็กลง 1,240 บรรทัด นี่ดีกว่ารอบแรก แต่ยังไม่อยู่ในงบประมาณขั้นต่ำ วิธีแก้ยังคงต้องเริ่มจากการลบ:

- ลบ DTO ของ Plugin ที่เพียงแค่เปลี่ยนชื่อฟิลด์ขาเข้า
- ลบการทดสอบที่ยืนยันเฉพาะรูปทรงของ wrapper
- เพิ่มตัวช่วยแกนกลางเฉพาะเมื่อแพตช์เดียวกันลบโค้ด Plugin ที่รวมมาในชุด
- เก็บความเข้ากันได้กับ SDK แบบเก่าไว้ในชิมของ SDK/แกนกลางเท่านั้น
- จัดแพ็กแกนกลางใหม่หลังจากการลบ wrapper เปิดเผยรูปทรงที่เสถียรแล้ว

## จุดร้อน

ไฟล์โปรดักชันของชุดรวมที่ยังเป็นบวกและยังต้องลดขนาด:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

แบรนช์ยังไม่อยู่ในงบประมาณขั้นต่ำ งานที่ยังเกี่ยวข้องกับการรีวิวควรลบโฟลว์การอนุญาตที่ซ้ำซ้อน scaffolding ของ turn หรือการทดสอบ wrapper ก่อนเพิ่ม abstraction แกนกลางอีกตัว

## การอ่านโค้ดปัจจุบัน

ขอบเขตแกนกลางที่ดีต่อสุขภาพมีอยู่แล้วใน `src/channels/message-access/runtime.ts`: มันเป็นเจ้าของ adapter ระบุตัวตน, allowlist ที่มีผล, การอ่าน pairing-store, descriptor ของเส้นทาง, preset ของคำสั่ง/เหตุการณ์, กลุ่มการเข้าถึง และ projection สุดท้ายที่ resolve แล้วของ `ResolvedChannelMessageIngress`

การเติบโตที่เหลือส่วนใหญ่คือ glue ของ Plugin ที่วางทับบนขอบเขตนั้น:

- `extensions/telegram/src/ingress.ts` ห่อการตัดสินใจของแกนกลางในตัวช่วยคำสั่ง/เหตุการณ์เฉพาะ Telegram จากนั้น call site ยังส่ง allowlist ที่ normalize ไว้ล่วงหน้าและรายการเจ้าของเข้ามา
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  และ `extensions/matrix/src/matrix/monitor/access-state.ts` ยังเก็บ DTO นโยบายแบบโลคัลหรือชื่อการตัดสินใจแบบ legacy ไว้ข้างๆ ขาเข้า
- `extensions/signal/src/monitor/access-policy.ts` เก็บการ normalize ตัวตนและคำตอบ pairing ของ Signal ไว้โลคัลอย่างถูกต้อง แต่ยังมีขอบเขต wrapper ที่ควรยุบเป็นการใช้ขาเข้าโดยตรง
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` และ
  `extensions/zalouser/src/monitor.ts` ยังประกอบ route/envelope/turn ซ้ำ ซึ่งสามารถย้ายไปยังตัวช่วย turn ที่ใช้ร่วมกันนอกเคอร์เนลขาเข้าได้

สรุป: การย้ายโค้ดเข้าแกนกลางเพิ่มจะมีประโยชน์ก็ต่อเมื่อมันลบชั้น wrapper ของ Plugin เหล่านี้ในแพตช์เดียวกัน การเพิ่ม abstraction อีกตัวในขณะที่ยังคง return ของ wrapper ไว้จะทำผิดซ้ำเดิม

## ขอบเขต

แกนกลางเป็นเจ้าของนโยบายทั่วไป:

- การ normalize และจับคู่ allowlist
- การขยายกลุ่มการเข้าถึงและ diagnostics
- การอ่าน allowlist ของ DM จาก pairing-store
- เกตของเส้นทาง, ผู้ส่ง, คำสั่ง, เหตุการณ์ และ activation
- การแมป admission: dispatch, drop, skip, observe, pairing
- สถานะที่ redact แล้ว, การตัดสินใจ, diagnostics และ projection ความเข้ากันได้กับ SDK
- descriptor ทั่วไปที่นำกลับมาใช้ซ้ำได้สำหรับตัวตน, เส้นทาง, คำสั่ง, เหตุการณ์, activation และผลลัพธ์

Plugin เป็นเจ้าของข้อเท็จจริงการขนส่งและ side effect:

- ความถูกต้องของ webhook/socket/request
- การดึงตัวตนของแพลตฟอร์มและการ lookup API
- ค่าเริ่มต้นของนโยบายเฉพาะ channel
- การส่ง challenge ของ pairing, คำตอบ, ack, reaction, typing, media, ประวัติ, setup, doctor, สถานะ, log และข้อความที่ผู้ใช้เห็น

แกนกลางต้องคงความไม่ขึ้นกับ channel: ห้ามมี Discord, Slack, Telegram, Matrix, room, guild, space, API client หรือค่าเริ่มต้นเฉพาะ Plugin ใน `src/channels/message-access`

## กฎการยอมรับ

ตัวช่วยแกนกลางใหม่ทุกตัวต้องลบโค้ดโปรดักชันของ Plugin ที่รวมมาในชุดทันที

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

หยุดและออกแบบใหม่หาก:

- LOC ของโปรดักชัน Plugin เพิ่มขึ้น
- การทดสอบโตเร็วกว่าที่โปรดักชันหดลง
- hot path ของชุดรวม return DTO ที่เพียงแค่เปลี่ยนชื่อ `ResolvedChannelMessageIngress`
- ตัวช่วยแกนกลางต้องใช้ channel id, object ของแพลตฟอร์ม, API client หรือค่าเริ่มต้นเฉพาะ channel

## แพ็กเกจงาน

1. แช่งบประมาณไว้
   ใส่ LOC ใน PR, รักษา lint deprecated-ingress ให้เขียว และรวม LOC ก่อน/หลังไว้ใน commit การเก็บกวาด

2. ลบขอบเขต DTO บางๆ
   แทนที่ return ของ wrapper แบบ Plugin-local ด้วย `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` หรือ `ingress` โดยตรง เริ่มจาก QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage และ Tlon ลบการทดสอบรูปทรง wrapper; เก็บการทดสอบพฤติกรรมไว้

3. เพิ่มการจัดประเภทผลลัพธ์เฉพาะเมื่อมีการลบ
   classifier ทั่วไปอาจเปิดเผย `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` และ
   `drop-ingress` ได้ มันต้อง derive จากกราฟการตัดสินใจ ไม่ใช่ reason string และย้าย Plugin อย่างน้อยสามตัวในแพตช์เดียวกัน

4. เพิ่มตัวสร้าง descriptor ของเส้นทางเฉพาะเมื่อมีการลบ
   ตัวช่วยเป้าหมายเส้นทางและผู้ส่งเส้นทางแบบทั่วไปยอมรับได้เฉพาะเมื่อทำให้ Plugin ที่ใช้เส้นทางหนักหดลงทันที: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo และ Zalo Personal

5. เพิ่ม preset ของคำสั่ง/เหตุการณ์เฉพาะเมื่อมีการลบ
   รวมศูนย์รูปทรง text-command, native-command, callback และ origin-subject
   ผู้ใช้คำสั่งต้องมีค่าเริ่มต้นเป็น unauthorized เมื่อไม่มี command gate ทำงาน;
   เหตุการณ์ต้องไม่เริ่ม pairing

6. เพิ่ม preset ตัวตนเฉพาะในที่ที่มันลบ boilerplate ได้
   ตัวช่วย stable-id, stable-id-plus-aliases, phone/e164 และ multi-identifier
   อนุญาตเมื่อค่าดิบเข้าเฉพาะ input ของ adapter และสถานะที่ redact แล้วเก็บ id/count แบบทึบเท่านั้น

7. แชร์การประกอบ turn ที่ได้รับอนุญาต
   นอกเคอร์เนลขาเข้า ให้ลบ scaffolding route/envelope/context/reply ที่ซ้ำกันออกจาก QA Channel, IRC, Nextcloud Talk, Zalo และ Zalo Personal
   แกนกลางอาจเป็นเจ้าของการจัดลำดับ route/session/envelope/dispatch; Plugin เก็บการส่งและ context เฉพาะ channel ไว้

8. กักความเข้ากันได้
   ตัวช่วย SDK ที่ deprecated ยังคง source-compatible แต่ hot path ของชุดรวมต้องไม่นำเข้า facade deprecated ingress หรือ command-auth การทดสอบความเข้ากันได้ควรใช้ Plugin บุคคลที่สามปลอม ไม่ใช่ internals ของ Plugin ที่รวมมาในชุด

9. จัดแพ็กแกนกลางใหม่
   หลังจาก Plugin ใช้ runtime projection โดยตรงแล้ว ให้ยุบโมดูลที่ใช้ครั้งเดียว, ลบ export ที่ไม่ได้ใช้, ย้าย compatibility projection ออกจาก hot path และเก็บการทดสอบที่โฟกัสสำหรับตัวตน, เส้นทาง, คำสั่ง/เหตุการณ์, activation, กลุ่มการเข้าถึง และชิมความเข้ากันได้

## ระลอกการลบ

รันตามลำดับนี้ แต่ละระลอกต้องลด LOC โปรดักชันของชุดรวม

1. ยุบ wrapper, delta Plugin ที่คาดไว้: -400 ถึง -600
   แทนที่ชนิดผลลัพธ์ `resolveXAccess`, `resolveXCommandAccess` และ
   `accessFromIngress` แบบ Plugin-local ด้วยการอ่านโดยตรงจาก
   `ResolvedChannelMessageIngress` เป้าหมายแรก: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter

2. ตัวช่วยผลลัพธ์ที่ใช้ร่วมกัน, delta Plugin ที่คาดไว้: -200 ถึง -350
   เพิ่ม classifier ทั่วไปหนึ่งตัวเฉพาะเมื่อมันลบ ladder ของ
   `shouldBlockControlCommand`, pairing, activation skip, route block และ sender
   block ที่ซ้ำกันใน Plugin อย่างน้อยสามตัว

3. ตัวสร้าง descriptor ของเส้นทาง, delta Plugin ที่คาดไว้: -200 ถึง -350
   ย้ายการประกอบ descriptor เป้าหมายเส้นทางและผู้ส่งเส้นทางที่ซ้ำกันเข้าไปในตัวช่วยแกนกลาง เป้าหมายแรก: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal

4. การแชร์การประกอบ turn, delta Plugin ที่คาดไว้: -250 ถึง -450
   ใช้การจัดลำดับ route/session/envelope/dispatch ร่วมกันสำหรับ Plugin ขาเข้าแบบเรียบง่าย เป้าหมายแรก: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal

5. จัดแพ็กแกนกลางใหม่, delta แกนกลางที่คาดไว้: -300 ถึง -700
   หลังจาก Plugin ใช้ runtime projection โดยตรงแล้ว ให้ลบโมดูลที่ใช้ครั้งเดียว,
   รวมไฟล์เล็กๆ กลับเข้า `runtime.ts` หรือ sibling ที่โฟกัส และแยกไฟล์ความเข้ากันได้ของ SDK ออกจาก hot path ของชุดรวม

6. ตัดแต่งการทดสอบ, delta การทดสอบที่คาดไว้: -300 ถึง -600
   ลบการทดสอบที่ยืนยันเฉพาะรูปทรง wrapper ที่ถูกลบ เก็บการทดสอบพฤติกรรมสำหรับการปฏิเสธคำสั่ง, group fallback, การจับคู่ origin-subject, activation skip,
   กลุ่มการเข้าถึง, pairing และ redaction

รูปทรงขั้นต่ำที่คาดว่าจะลงได้หลังระลอกเหล่านี้:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## ห้ามย้าย

อย่าย้ายค่าเริ่มต้นการกำหนดค่าแพลตฟอร์ม, UX การตั้งค่า, ข้อความ `doctor/fix`, การค้นหา API,
การตรวจสอบสถานะการมีอยู่ของเจ้าของ Slack, การจัดการนามแฝง/การยืนยันของ Matrix, การแยกวิเคราะห์
callback ของ Telegram, การแยกวิเคราะห์ไวยากรณ์คำสั่ง, การลงทะเบียนคำสั่งแบบเนทีฟ, การแยกวิเคราะห์
เพย์โหลดการตอบสนอง, การตอบกลับการจับคู่, การตอบกลับคำสั่ง, การตอบรับ, การพิมพ์, สื่อ, ประวัติ,
หรือบันทึก

## การตรวจสอบยืนยัน

ลูป local loopback แบบเจาะจง:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

ใช้ Testbox สำหรับเกตการเปลี่ยนแปลงแบบกว้าง/หลักฐานชุดทดสอบเต็มรูปแบบ เมื่อแนวโน้ม LOC
อยู่ภายในงบประมาณ

แต่ละแพ็กเกจงานบันทึก:

- LOC ก่อน/หลังแยกตามหมวดหมู่
- wrapper ของ Plugin ที่ถูกลบ
- LOC ของตัวช่วย core ใหม่ หากมี
- การทดสอบแบบเจาะจงที่รัน
- รายการฮอตสปอตที่เหลือ

## เกณฑ์การออก

- import สำหรับการผลิตที่รวมมาด้วยไม่มีแฟซาด channel-access หรือ command-auth ที่เลิกใช้แล้ว
- โค้ดความเข้ากันได้ถูกแยกไว้ในรอยต่อ SDK/core
- Plugin ที่รวมมาด้วยใช้การฉายภาพขาเข้าหรือผลลัพธ์ทั่วไปโดยตรง
- LOC การผลิตของ Plugin ลดลงสุทธิอย่างน้อย 1,500 เมื่อเทียบกับ `origin/main`
- LOC การผลิตของ core <= +1,500 หรือส่วนเกินใดๆ ได้รับการชดเชยในขณะที่ยอดรวมยังคง
  <= +2,000
- การทดสอบตัวแทนครอบคลุมพฤติกรรมการปกปิดข้อมูล, เส้นทาง, คำสั่ง/เหตุการณ์, การเปิดใช้งาน,
  access-group, และ fallback เฉพาะช่องทาง
