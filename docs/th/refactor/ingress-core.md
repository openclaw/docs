---
read_when:
    - ตรวจสอบสาเหตุที่การปรับโครงสร้างโค้ดขาเข้าของช่องทางเพิ่มโค้ดมากเกินไป
    - การย้ายนโยบายเส้นทาง คำสั่ง เหตุการณ์ การเปิดใช้งาน หรือกลุ่มการเข้าถึงจาก Plugin ที่รวมมาให้ไปยังแกนหลัก
    - ตรวจสอบว่าตัวช่วยรับข้อมูลเข้าของช่องทางลบโค้ด Plugin ที่รวมมาให้จริงหรือไม่
sidebarTitle: Ingress core deletion
summary: แผนแบบลบก่อนสำหรับย้ายโค้ดเชื่อมประสานการรับเข้าของช่องทางที่ซ้ำกันไปไว้ในแกนหลัก.
title: แผนการลบแกนหลักส่วนรับเข้า
x-i18n:
    generated_at: "2026-05-12T01:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# แผนการลบแกนกลาง ingress

การปรับโครงสร้าง ingress ยังไม่ดีต่อสุขภาพของโค้ดเมื่อมันเพิ่มบรรทัดสุทธิหลายพันบรรทัด การรวมศูนย์ในแกนกลางจะนับว่ามีความหมายก็ต่อเมื่อโค้ดโปรดักชันของ Plugin แบบบันเดิลเล็กลง และความเข้ากันได้กับ SDK บุคคลที่สามรุ่นเก่าถูกกักไว้ในชิมของ SDK/แกนกลาง

รูปร่างรันไทม์ที่ต้องการ:

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

Plugin แบบบันเดิลไม่ควรแปล ingress กลับเป็นรูปร่างภายในอย่าง `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` หรือ
`{ allowed, reasonCode }` เว้นแต่ชนิดนั้นเป็น API สาธารณะของ Plugin

## งบประมาณ

วัดเทียบกับ merge-base ของ PR กับ `origin/main` รวมไฟล์ที่ยังไม่ถูกติดตาม

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

งานเก็บกวาดขั้นต่ำที่เหลือ:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

การลบเฉพาะคอมเมนต์ไม่นับเป็นการเก็บกวาด รอบงบประมาณก่อนหน้าผ่อนปรนเกินไป เพราะรวมคอมเมนต์อธิบายของ QQBot ที่ถูกนำกลับมาแล้ว เอกสารนี้ติดตามเฉพาะการย้ายโค้ดที่รันได้/เอกสาร/ทดสอบเท่านั้น

วัดใหม่หลังงานเก็บกวาดแต่ละระลอก:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## การวินิจฉัย

รอบแรกเพิ่มเคอร์เนล ingress ที่ใช้ร่วมกัน แล้วทิ้งการอนุญาตภายใน Plugin ไว้ข้างๆ มากเกินไป:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

สิ่งนั้นทำให้โมเดลซ้ำซ้อน โค้ดโปรดักชันแกนกลางเพิ่มขึ้นประมาณ 3,376 บรรทัด ขณะที่โค้ดโปรดักชันของ Plugin แบบบันเดิลลดลง 1,240 บรรทัด ซึ่งดีกว่ารอบแรก แต่ยังไม่อยู่ในงบประมาณขั้นต่ำ วิธีแก้ยังคงต้องเริ่มจากการลบ:

- ลบ DTO ของ Plugin ที่เพียงแค่เปลี่ยนชื่อฟิลด์ ingress
- ลบการทดสอบที่ยืนยันเฉพาะรูปร่างของ wrapper
- เพิ่ม helper แกนกลางเฉพาะเมื่อแพตช์เดียวกันลบโค้ด Plugin แบบบันเดิล
- เก็บความเข้ากันได้กับ SDK รุ่นเก่าไว้ในชิม SDK/แกนกลางเท่านั้น
- จัดแพ็กแกนกลางใหม่หลังจากการลบ wrapper เปิดให้เห็นรูปร่างที่เสถียร

## จุดร้อน

ไฟล์โปรดักชันแบบบันเดิลที่เป็นบวกและยังต้องลดลง:

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

แบรนช์ยังไม่อยู่ในงบประมาณขั้นต่ำ งานที่เหลือซึ่งเกี่ยวข้องกับการรีวิวควรลบโฟลว์การอนุญาตที่ซ้ำซ้อน โครงสร้างรองรับของ turn หรือการทดสอบ wrapper ก่อนเพิ่ม abstraction แกนกลางอีกตัว

## การอ่านโค้ดปัจจุบัน

seam แกนกลางที่ดีต่อสุขภาพมีอยู่แล้วใน `src/channels/message-access/runtime.ts`:
มันเป็นเจ้าของ identity adapters, effective allowlists, การอ่าน pairing-store, route descriptors, command/event presets, access groups และ projection สุดท้ายของ
`ResolvedChannelMessageIngress` ที่ resolve แล้ว

การเติบโตที่เหลือส่วนใหญ่เป็น glue ของ Plugin ที่ซ้อนอยู่บน seam นั้น:

- `extensions/telegram/src/ingress.ts` ห่อ decision แกนกลางไว้ใน helper คำสั่ง/เหตุการณ์เฉพาะ Telegram แล้ว call site ยังส่ง allowlist ที่ normalize ล่วงหน้าและรายชื่อ owner ที่คำนวณไว้แล้ว
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  และ `extensions/matrix/src/matrix/monitor/access-state.ts` ยังเก็บ DTO นโยบายภายในหรือชื่อ decision แบบ legacy ไว้ข้าง ingress
- `extensions/signal/src/monitor/access-policy.ts` เก็บการ normalize identity ของ Signal และคำตอบ pairing ไว้ภายในอย่างถูกต้อง แต่ยังมี seam แบบ wrapper ที่ควรถูกยุบเป็นการ consume ingress โดยตรง
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` และ
  `extensions/zalouser/src/monitor.ts` ยังประกอบ route/envelope/turn ซ้ำ ซึ่งสามารถย้ายไปยัง shared turn helpers นอกเคอร์เนล ingress ได้

ข้อสรุป: การย้ายโค้ดเพิ่มเข้าแกนกลางจะมีประโยชน์ก็ต่อเมื่อมันลบชั้น wrapper ของ Plugin เหล่านี้ในแพตช์เดียวกัน การเพิ่ม abstraction อีกตัวโดยยังปล่อยให้ wrapper return อยู่ เป็นการทำผิดซ้ำเดิม

## ขอบเขต

แกนกลางเป็นเจ้าของนโยบายทั่วไป:

- การ normalize และ match allowlist
- การขยาย access-group และ diagnostics
- การอ่าน allowlist ของ DM จาก pairing-store
- route, sender, command, event และ activation gates
- การ map admission: dispatch, drop, skip, observe, pairing
- สถานะที่ redact แล้ว, decisions, diagnostics และ projection ความเข้ากันได้กับ SDK
- descriptors ทั่วไปที่ใช้ซ้ำได้สำหรับ identity, route, command, event, activation และ outcomes

Plugin เป็นเจ้าของ transport facts และ side effects:

- ความแท้จริงของ webhook/socket/request
- การดึง identity ของแพลตฟอร์มและการ lookup API
- ค่าเริ่มต้นนโยบายเฉพาะ channel
- การส่ง pairing challenge, replies, acks, reactions, typing, media, history,
  setup, doctor, status, logs และข้อความที่ผู้ใช้เห็น

แกนกลางต้องเป็นกลางต่อ channel: ห้ามมี Discord, Slack, Telegram, Matrix, room,
guild, space, API client หรือค่าเริ่มต้นเฉพาะ Plugin ใน
`src/channels/message-access`

## กฎการยอมรับ

helper แกนกลางใหม่ทุกตัวต้องลบโค้ดโปรดักชันของ Plugin แบบบันเดิลทันที

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

หยุดและออกแบบใหม่ถ้า:

- LOC ของโปรดักชัน Plugin เพิ่มขึ้น
- การทดสอบโตเร็วกว่าที่โปรดักชันหดลง
- hot path แบบบันเดิล return DTO ที่เพียงแค่เปลี่ยนชื่อ `ResolvedChannelMessageIngress`
- helper แกนกลางต้องใช้ channel id, platform object, API client หรือค่าเริ่มต้นเฉพาะ channel

## แพ็กเกจงาน

1. ตรึงงบประมาณ
   ใส่ LOC ใน PR, รักษา lint deprecated-ingress ให้เขียว และใส่ LOC ก่อน/หลังใน commit เก็บกวาด

2. ลบ seam DTO แบบบาง
   แทน return ของ wrapper ภายใน Plugin ด้วย `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` หรือ `ingress` โดยตรง เริ่มจาก
   QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage และ
   Tlon ลบการทดสอบรูปร่าง wrapper; เก็บการทดสอบพฤติกรรมไว้

3. เพิ่มการจัดประเภท outcome เฉพาะเมื่อมีการลบ
   classifier ทั่วไปอาจ expose `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` และ
   `drop-ingress` มันต้อง derive จาก decision graph ไม่ใช่ reason strings
   และต้อง migrate อย่างน้อยสาม Plugin ในแพตช์เดียวกัน

4. เพิ่ม route descriptor builders เฉพาะเมื่อมีการลบ
   helper ทั่วไปสำหรับ route target และ route sender ยอมรับได้เฉพาะเมื่อมันทำให้ Plugin ที่ใช้ route หนักเล็กลงทันที: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo และ Zalo Personal

5. เพิ่ม command/event presets เฉพาะเมื่อมีการลบ
   รวมศูนย์รูปร่าง text-command, native-command, callback และ origin-subject
   ผู้ consume command ต้อง default เป็น unauthorized เมื่อไม่มี command gate รัน
   เหตุการณ์ต้องไม่เริ่ม pairing

6. เพิ่ม identity presets เฉพาะที่มันลบ boilerplate
   helper สำหรับ stable-id, stable-id-plus-aliases, phone/e164 และ multi-identifier
   อนุญาตเมื่อ raw values เข้าเฉพาะ input ของ adapter และสถานะที่ redact แล้วเก็บ opaque ids/counts

7. แชร์การประกอบ turn ที่ได้รับอนุญาต
   นอกเคอร์เนล ingress ให้ลบโครงสร้างรองรับ route/envelope/context/reply ที่ซ้ำจาก QA Channel, IRC, Nextcloud Talk, Zalo และ Zalo Personal
   แกนกลางอาจเป็นเจ้าของการเรียงลำดับ route/session/envelope/dispatch; Plugin เก็บ delivery และ context เฉพาะ channel ไว้

8. กัก compatibility
   helper SDK ที่เลิกใช้แล้วยังคง source-compatible แต่ hot path แบบบันเดิลต้องไม่นำเข้า facade ของ deprecated ingress หรือ command-auth การทดสอบ compatibility ควรใช้ Plugin บุคคลที่สามปลอม ไม่ใช่ internals ของ Plugin แบบบันเดิล

9. จัดแพ็กแกนกลางใหม่
   หลังจาก Plugin consume runtime projections โดยตรงแล้ว ให้ยุบโมดูลที่ใช้ครั้งเดียว ลบ export ที่ไม่ได้ใช้ ย้าย compatibility projection ออกจาก hot paths และเก็บการทดสอบที่โฟกัสสำหรับ identity,
   route, command/event, activation, access groups และ compatibility shims

## ระลอกการลบ

รันตามลำดับนี้ แต่ละระลอกต้องลด LOC โปรดักชันแบบบันเดิล

1. ยุบ wrapper, plugin delta ที่คาดหวัง: -400 ถึง -600
   แทนชนิดผลลัพธ์ของ `resolveXAccess`, `resolveXCommandAccess` และ
   `accessFromIngress` ภายใน Plugin ด้วยการอ่านโดยตรงจาก
   `ResolvedChannelMessageIngress` เป้าหมายแรก: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter

2. helper outcome ที่ใช้ร่วมกัน, plugin delta ที่คาดหวัง: -200 ถึง -350
   เพิ่ม classifier ทั่วไปหนึ่งตัวเฉพาะเมื่อมันลบ ladder ซ้ำของ
   `shouldBlockControlCommand`, pairing, activation skip, route block และ sender
   block ข้ามอย่างน้อยสาม Plugin

3. route descriptor builders, plugin delta ที่คาดหวัง: -200 ถึง -350
   ย้ายการประกอบ route target และ route sender descriptor ที่ซ้ำไปยัง helper
   แกนกลาง เป้าหมายแรก: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal

4. การแชร์ turn assembly, plugin delta ที่คาดหวัง: -250 ถึง -450
   ใช้การเรียงลำดับ route/session/envelope/dispatch ร่วมกันสำหรับ Plugin inbound
   แบบง่าย เป้าหมายแรก: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal

5. จัดแพ็กแกนกลางใหม่, core delta ที่คาดหวัง: -300 ถึง -700
   หลังจาก Plugin consume runtime projections โดยตรง ให้ลบโมดูลที่ใช้ครั้งเดียว
   merge ไฟล์เล็กกลับเข้า `runtime.ts` หรือ sibling ที่โฟกัส และแยกไฟล์ความเข้ากันได้กับ SDK ออกจาก hot paths แบบบันเดิล

6. ตัดแต่งการทดสอบ, test delta ที่คาดหวัง: -300 ถึง -600
   ลบการทดสอบที่ยืนยันเฉพาะรูปร่าง wrapper ที่ถูกลบแล้ว เก็บการทดสอบพฤติกรรมสำหรับ
   command denial, group fallback, origin-subject matching, activation skip,
   access groups, pairing และ redaction

รูปร่างขั้นต่ำที่คาดหวังเมื่อลงหลังระลอกเหล่านี้:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## ห้ามย้าย

อย่าย้ายค่าเริ่มต้นของการกำหนดค่าแพลตฟอร์ม, UX การตั้งค่า, ข้อความ doctor/fix, การค้นหา API,
การตรวจสอบ owner-presence ของ Slack, การจัดการ alias/verification ของ Matrix, การแยกวิเคราะห์ callback ของ Telegram,
การแยกวิเคราะห์ไวยากรณ์คำสั่ง, การลงทะเบียนคำสั่งแบบ native, การแยกวิเคราะห์ payload ของ reaction, การตอบกลับการจับคู่, การตอบกลับคำสั่ง, acks, typing, media, history,
หรือ logs

## การตรวจสอบ

ลูปภายในเครื่องแบบเจาะจง:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

ใช้ Testbox สำหรับหลักฐาน changed gates/full-suite แบบกว้างเมื่อแนวโน้ม LOC
อยู่ภายในงบประมาณ

แต่ละชุดงานบันทึก:

- LOC ก่อน/หลังตามหมวดหมู่
- wrapper ของ Plugin ที่ลบแล้ว
- LOC ของ helper ใหม่ใน core หากมี
- การทดสอบแบบเจาะจงที่รัน
- รายการ hotspot ที่เหลือ

## เกณฑ์การออก

- import ของ production ที่มาพร้อมกันไม่มี facade ของ channel-access หรือ command-auth ที่เลิกใช้แล้ว
- โค้ดความเข้ากันได้ถูกแยกไว้ที่ seam ของ SDK/core
- Plugin ที่มาพร้อมกันใช้ ingress projection หรือ outcome แบบทั่วไปโดยตรง
- LOC ของ production ใน Plugin เป็นค่าลบสุทธิอย่างน้อย 1,500 เมื่อเทียบกับ `origin/main`
- LOC ของ production ใน core คือ `<= +1,500` หรือส่วนที่เกินใดๆ ต้องถูกชดเชยโดยที่ยอดรวม
  ยังอยู่ที่ `<= +2,000`
- การทดสอบตัวแทนครอบคลุมพฤติกรรม redaction, route, command/event, activation,
  access-group, และ fallback เฉพาะ channel
