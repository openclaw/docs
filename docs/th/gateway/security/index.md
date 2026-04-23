---
read_when:
    - การเพิ่มฟีเจอร์ที่ขยายการเข้าถึงหรือระบบอัตโนมัติ
summary: ข้อพิจารณาด้านความปลอดภัยและโมเดลภัยคุกคามสำหรับการรัน AI gateway ที่มีสิทธิ์เข้าถึง shell
title: Security
x-i18n:
    generated_at: "2026-04-23T10:18:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdc8d9a0eef88294d9f831ec4f24eb90b00631b9266d69df888a62468cb1dea
    source_path: gateway/security/index.md
    workflow: 15
---

# Security

<Warning>
**โมเดลความไว้วางใจแบบผู้ช่วยส่วนตัว:** แนวทางนี้ตั้งอยู่บนสมมติฐานว่ามีขอบเขตผู้ปฏิบัติงานที่เชื่อถือได้หนึ่งขอบเขตต่อ gateway หนึ่งตัว (โมเดลผู้ใช้คนเดียว/ผู้ช่วยส่วนตัว)
OpenClaw **ไม่ใช่** ขอบเขตความปลอดภัยแบบ multi-tenant ที่เป็นปฏิปักษ์ สำหรับผู้ใช้หลายคนที่ไม่ไว้วางใจกันและใช้ agent/gateway เดียวร่วมกัน
หากคุณต้องการการทำงานแบบความไว้วางใจผสมหรือมีผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกขอบเขตความไว้วางใจ (gateway + ข้อมูลรับรองแยกกัน และควรแยกผู้ใช้ OS/โฮสต์ด้วย)
</Warning>

**ในหน้านี้:** [โมเดลความไว้วางใจ](#scope-first-personal-assistant-security-model) | [การ audit แบบรวดเร็ว](#quick-check-openclaw-security-audit) | [baseline แบบเสริมความปลอดภัย](#hardened-baseline-in-60-seconds) | [โมเดลการเข้าถึง DM](#dm-access-model-pairing-allowlist-open-disabled) | [การทำให้ config แข็งแรงขึ้น](#configuration-hardening-examples) | [การตอบสนองต่อเหตุการณ์](#incident-response)

## กำหนดขอบเขตก่อน: โมเดลความปลอดภัยแบบผู้ช่วยส่วนตัว

แนวทางด้านความปลอดภัยของ OpenClaw ตั้งอยู่บนสมมติฐานของการติดตั้งใช้งานแบบ **ผู้ช่วยส่วนตัว**: หนึ่งขอบเขตผู้ปฏิบัติงานที่เชื่อถือได้ อาจมีหลาย agent ได้

- ท่าทีด้านความปลอดภัยที่รองรับ: หนึ่งผู้ใช้/ขอบเขตความไว้วางใจต่อหนึ่ง gateway (แนะนำให้หนึ่งผู้ใช้ OS/โฮสต์/VPS ต่อหนึ่งขอบเขต)
- ไม่ใช่ขอบเขตความปลอดภัยที่รองรับ: gateway/agent ร่วมกันหนึ่งชุดที่ถูกใช้โดยผู้ใช้ที่ไม่ไว้วางใจกันหรือเป็นปฏิปักษ์ต่อกัน
- หากต้องการการแยกผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกตามขอบเขตความไว้วางใจ (gateway + ข้อมูลรับรองแยกกัน และควรแยกผู้ใช้ OS/โฮสต์ด้วย)
- หากมีผู้ใช้ที่ไม่ไว้วางใจกันหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้เครื่องมือหนึ่งตัวได้ ให้ถือว่าพวกเขาใช้สิทธิ์เครื่องมือที่ถูกมอบหมายให้ agent ตัวนั้นร่วมกัน

หน้านี้อธิบายการทำให้ระบบแข็งแรงขึ้น **ภายในโมเดลนั้น** ไม่ได้อ้างว่ามีการแยก isolation แบบ multi-tenant ที่เป็นปฏิปักษ์บน gateway ที่ใช้ร่วมกันหนึ่งตัว

## ตรวจสอบอย่างรวดเร็ว: `openclaw security audit`

ดูเพิ่มเติม: [Formal Verification (Security Models)](/th/security/formal-verification)

ให้รันสิ่งนี้เป็นประจำ (โดยเฉพาะหลังจากเปลี่ยน config หรือเปิดเผยพื้นผิวเครือข่าย):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` ถูกตั้งใจให้มีขอบเขตแคบ: มันจะเปลี่ยนนโยบายกลุ่มแบบเปิดที่พบบ่อย
เป็น allowlist, คืนค่า `logging.redactSensitive: "tools"`, ทำให้
สิทธิ์ของไฟล์ state/config/include-file เข้มงวดยิ่งขึ้น และใช้การรีเซ็ต ACL ของ Windows แทน
POSIX `chmod` เมื่อรันบน Windows

มันจะตรวจจับ footgun ที่พบบ่อย (การเปิดเผย auth ของ Gateway, การเปิดเผยการควบคุม browser, allowlist ที่ยกระดับสิทธิ์, สิทธิ์ของไฟล์ระบบ, การอนุมัติ exec ที่ผ่อนปรน และการเปิดเผยเครื่องมือผ่านช่องทางแบบเปิด)

OpenClaw เป็นทั้งผลิตภัณฑ์และงานทดลอง: คุณกำลังเชื่อมพฤติกรรมของ frontier model เข้ากับพื้นผิวการส่งข้อความจริงและเครื่องมือจริง **ไม่มีการตั้งค่าแบบ “ปลอดภัยสมบูรณ์”** เป้าหมายคือการตั้งค่าอย่างมีเจตนาเกี่ยวกับ:

- ใครที่สามารถคุยกับบอตของคุณได้
- บอตได้รับอนุญาตให้กระทำที่ไหน
- บอตแตะต้องอะไรได้บ้าง

เริ่มจากการให้สิทธิ์น้อยที่สุดที่ยังใช้งานได้ แล้วค่อย ๆ ขยายเมื่อคุณมั่นใจมากขึ้น

### การติดตั้งใช้งานและความไว้วางใจต่อโฮสต์

OpenClaw ถือว่าโฮสต์และขอบเขต config เป็นสิ่งที่เชื่อถือได้:

- หากใครสามารถแก้ไข state/config ของโฮสต์ Gateway (`~/.openclaw` รวมถึง `openclaw.json`) ได้ ให้ถือว่าบุคคลนั้นเป็นผู้ปฏิบัติงานที่เชื่อถือได้
- การรัน Gateway เดียวสำหรับผู้ปฏิบัติงานหลายคนที่ไม่ไว้วางใจกันหรือเป็นปฏิปักษ์กัน **ไม่ใช่การตั้งค่าที่แนะนำ**
- สำหรับทีมที่มีความไว้วางใจแบบผสม ให้แยกขอบเขตความไว้วางใจด้วย gateway แยกกัน (หรืออย่างน้อยแยกผู้ใช้ OS/โฮสต์)
- ค่าเริ่มต้นที่แนะนำ: หนึ่งผู้ใช้ต่อหนึ่งเครื่อง/โฮสต์ (หรือ VPS), หนึ่ง gateway สำหรับผู้ใช้นั้น และมีหนึ่งหรือหลาย agent ภายใน gateway นั้น
- ภายในอินสแตนซ์ Gateway เดียว การเข้าถึงของผู้ปฏิบัติงานที่ยืนยันตัวตนแล้วถือเป็นบทบาท control-plane ที่เชื่อถือได้ ไม่ใช่บทบาท tenant รายผู้ใช้
- ตัวระบุเซสชัน (`sessionKey`, session ID, label) เป็นตัวเลือกการกำหนดเส้นทาง ไม่ใช่โทเค็นการอนุญาต
- หากมีหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้เครื่องมือหนึ่งตัวได้ แต่ละคนก็สามารถชี้นำชุดสิทธิ์เดียวกันนั้นได้ การแยกเซสชัน/memory รายผู้ใช้ช่วยเรื่องความเป็นส่วนตัว แต่ไม่ได้เปลี่ยน agent ที่ใช้ร่วมกันให้กลายเป็นการอนุญาตระดับโฮสต์แบบรายผู้ใช้

### พื้นที่ทำงาน Slack แบบใช้ร่วมกัน: ความเสี่ยงจริง

หาก "ทุกคนใน Slack สามารถส่งข้อความหาบอตได้" ความเสี่ยงหลักคือสิทธิ์เครื่องมือที่ถูกมอบหมาย:

- ผู้ส่งที่ได้รับอนุญาตคนใดก็ตามสามารถกระตุ้นการเรียกเครื่องมือ (`exec`, browser, เครื่องมือเครือข่าย/ไฟล์) ภายใต้นโยบายของ agent;
- การฉีดคำสั่งผ่าน prompt/เนื้อหาจากผู้ส่งคนหนึ่งอาจทำให้เกิดการกระทำที่มีผลต่อ state, อุปกรณ์ หรือเอาต์พุตที่ใช้ร่วมกัน;
- หาก agent ร่วมกันหนึ่งตัวมีข้อมูลรับรอง/ไฟล์ที่ละเอียดอ่อน ผู้ส่งที่ได้รับอนุญาตคนใดก็ตามอาจสามารถขับให้เกิดการดึงข้อมูลออกผ่านการใช้เครื่องมือได้

ให้ใช้ agent/gateway แยกกันพร้อมเครื่องมือน้อยที่สุดสำหรับเวิร์กโฟลว์ของทีม; เก็บ agent ที่มีข้อมูลส่วนตัวให้เป็นส่วนตัว

### agent ที่ใช้ร่วมกันในบริษัท: รูปแบบที่ยอมรับได้

สิ่งนี้ยอมรับได้เมื่อทุกคนที่ใช้ agent ตัวนั้นอยู่ในขอบเขตความไว้วางใจเดียวกัน (เช่น ทีมหนึ่งในบริษัท) และ agent ถูกจำกัดขอบเขตเป็นงานธุรกิจอย่างเคร่งครัด

- รันบนเครื่อง/VM/container แบบเฉพาะ;
- ใช้ผู้ใช้ OS + browser/profile/account แบบเฉพาะสำหรับรันไทม์นั้น;
- อย่าล็อกอินรันไทม์นั้นเข้ากับบัญชี Apple/Google ส่วนตัวหรือโปรไฟล์ตัวจัดการรหัสผ่าน/browser ส่วนตัว

หากคุณผสมตัวตนส่วนตัวและตัวตนบริษัทในรันไทม์เดียวกัน คุณจะทำให้การแยกนั้นพังลงและเพิ่มความเสี่ยงในการเปิดเผยข้อมูลส่วนตัว

## แนวคิดเรื่องความไว้วางใจของ Gateway และ Node

ให้ถือว่า Gateway และ Node เป็นโดเมนความไว้วางใจของผู้ปฏิบัติงานเดียวกัน แต่มีบทบาทต่างกัน:

- **Gateway** คือ control plane และพื้นผิวนโยบาย (`gateway.auth`, นโยบายเครื่องมือ, การกำหนดเส้นทาง)
- **Node** คือพื้นผิวการรันระยะไกลที่จับคู่กับ Gateway นั้น (คำสั่ง, การกระทำกับอุปกรณ์, ความสามารถในเครื่องของโฮสต์)
- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้วถือว่าเชื่อถือได้ในขอบเขตของ Gateway หลังจากจับคู่แล้ว การกระทำบน node ถือเป็นการกระทำของผู้ปฏิบัติงานที่เชื่อถือได้บน node นั้น
- `sessionKey` คือการเลือกเส้นทาง/บริบท ไม่ใช่การยืนยันตัวตนรายผู้ใช้
- การอนุมัติ exec (allowlist + ask) เป็น guardrail สำหรับเจตนาของผู้ปฏิบัติงาน ไม่ใช่ isolation แบบ hostile multi-tenant
- ค่าเริ่มต้นของผลิตภัณฑ์ OpenClaw สำหรับการตั้งค่าผู้ปฏิบัติงานเดี่ยวที่เชื่อถือได้ คืออนุญาต host exec บน `gateway`/`node` โดยไม่ต้องมีพรอมต์ขออนุมัติ (`security="full"`, `ask="off"` เว้นแต่คุณจะทำให้เข้มงวดขึ้น) ค่าเริ่มต้นนี้เป็นเรื่องของ UX โดยตั้งใจ ไม่ใช่ช่องโหว่โดยตัวมันเอง
- การอนุมัติ exec จะผูกกับบริบทคำขอแบบตรงตัวและโอเปอแรนด์ไฟล์ในเครื่องโดยตรงแบบ best-effort ไม่ได้ทำโมเดลเชิงความหมายของทุกเส้นทาง runtime/interpreter loader ใช้ sandbox และการแยกโฮสต์สำหรับขอบเขตที่แข็งแรง

หากคุณต้องการการแยกจากผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกขอบเขตความไว้วางใจตามผู้ใช้ OS/โฮสต์และรัน gateway แยกกัน

## เมทริกซ์ขอบเขตความไว้วางใจ

ใช้สิ่งนี้เป็นโมเดลแบบรวดเร็วเมื่อประเมินความเสี่ยง:

| ขอบเขตหรือการควบคุม                                     | สิ่งที่มันหมายถึง                                | สิ่งที่มักถูกเข้าใจผิด                                                          |
| -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | ยืนยันตัวตนผู้เรียกไปยัง API ของ gateway         | "ต้องมีลายเซ็นต่อข้อความทุกเฟรมจึงจะปลอดภัย"                                  |
| `sessionKey`                                              | คีย์กำหนดเส้นทางสำหรับการเลือกบริบท/เซสชัน       | "Session key คือขอบเขตการยืนยันตัวตนของผู้ใช้"                                  |
| Prompt/content guardrail                                  | ลดความเสี่ยงจากการใช้โมเดลในทางที่ผิด            | "prompt injection เพียงอย่างเดียวพิสูจน์ได้ว่า auth ถูก bypass"                |
| `canvas.eval` / browser evaluate                          | ความสามารถของผู้ปฏิบัติงานที่ตั้งใจเปิดใช้       | "primitive ของ JS eval ใด ๆ เป็นช่องโหว่อัตโนมัติในโมเดลความไว้วางใจนี้"      |
| local TUI `!` shell                                       | การรันในเครื่องที่ผู้ปฏิบัติงานสั่งอย่างชัดเจน   | "คำสั่ง shell แบบสะดวกในเครื่องคือการฉีดคำสั่งจากระยะไกล"                     |
| การจับคู่ Node และคำสั่งของ Node                         | การรันระยะไกลระดับผู้ปฏิบัติงานบนอุปกรณ์ที่จับคู่ | "ควรถือการควบคุมอุปกรณ์ระยะไกลเป็นการเข้าถึงของผู้ใช้ที่ไม่น่าเชื่อถือโดยค่าเริ่มต้น" |

## สิ่งที่ไม่ถือเป็นช่องโหว่โดยการออกแบบ

รูปแบบเหล่านี้มักถูกรายงานและมักปิดเป็น no-action เว้นแต่จะแสดงการ bypass ขอบเขตจริงได้:

- สายโซ่แบบ prompt-injection-only ที่ไม่มีการ bypass นโยบาย/auth/sandbox
- ข้อกล่าวอ้างที่ตั้งอยู่บนสมมติฐานของการใช้งาน hostile multi-tenant บนโฮสต์/config ที่ใช้ร่วมกันหนึ่งตัว
- ข้อกล่าวอ้างที่จัดให้การเข้าถึงเส้นทางอ่านของผู้ปฏิบัติงานตามปกติ (เช่น `sessions.list`/`sessions.preview`/`chat.history`) เป็น IDOR ในการตั้งค่า shared-gateway
- ผลการตรวจพบในการติดตั้งแบบ localhost-only (เช่น HSTS บน gateway แบบ loopback-only)
- รายงานเรื่องลายเซ็น Webhook ขาเข้าของ Discord สำหรับพาธขาเข้าที่ไม่มีอยู่ใน repo นี้
- รายงานที่มองว่า metadata การจับคู่ node เป็นชั้นการอนุมัติแยกต่อคำสั่งที่ซ่อนอยู่สำหรับ `system.run` ทั้งที่ขอบเขตการรันจริงยังคงเป็นนโยบายคำสั่ง node แบบ global ของ gateway บวกกับการอนุมัติ exec ของ node เอง
- ผลการตรวจพบเรื่อง "ไม่มีการอนุญาตรายผู้ใช้" ที่มองว่า `sessionKey` เป็นโทเค็น auth

## baseline แบบเสริมความปลอดภัยใน 60 วินาที

ใช้ baseline นี้ก่อน แล้วค่อยเปิดใช้เครื่องมือกลับทีละรายการสำหรับ agent ที่เชื่อถือได้:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

สิ่งนี้จะทำให้ Gateway ใช้งานได้เฉพาะในเครื่อง แยก DM ออกจากกัน และปิดเครื่องมือ control-plane/runtime โดยค่าเริ่มต้น

## กฎแบบรวดเร็วสำหรับกล่องข้อความขาเข้าที่ใช้ร่วมกัน

หากมีมากกว่าหนึ่งคนที่สามารถ DM หาบอตของคุณได้:

- ตั้งค่า `session.dmScope: "per-channel-peer"` (หรือ `"per-account-channel-peer"` สำหรับช่องทางแบบหลายบัญชี)
- ใช้ `dmPolicy: "pairing"` หรือ allowlist ที่เข้มงวด
- ห้ามรวม DM ที่ใช้ร่วมกันกับการเข้าถึงเครื่องมือแบบกว้าง
- สิ่งนี้ช่วยทำให้กล่องข้อความขาเข้าที่ใช้ร่วมกัน/แบบร่วมมือกันแข็งแรงขึ้น แต่ไม่ได้ถูกออกแบบให้เป็น hostile co-tenant isolation เมื่อผู้ใช้มีสิทธิ์เขียนโฮสต์/config ร่วมกัน

## โมเดลการมองเห็นบริบท

OpenClaw แยกสองแนวคิดออกจากกัน:

- **การอนุญาตการทริกเกอร์**: ใครสามารถทริกเกอร์ agent ได้ (`dmPolicy`, `groupPolicy`, allowlist, mention gate)
- **การมองเห็นบริบท**: บริบทเสริมใดจะถูกฉีดเข้าไปในอินพุตของโมเดล (เนื้อหาการตอบกลับ, ข้อความอ้างอิง, ประวัติเธรด, metadata ของการส่งต่อ)

allowlist ใช้ควบคุมการทริกเกอร์และการอนุญาตคำสั่ง การตั้งค่า `contextVisibility` ควบคุมว่าบริบทเสริม (การตอบกลับแบบอ้างอิง, root ของเธรด, ประวัติที่ดึงมา) จะถูกกรองอย่างไร:

- `contextVisibility: "all"` (ค่าเริ่มต้น) จะคงบริบทเสริมตามที่ได้รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บการตอบกลับแบบอ้างอิงโดยชัดแจ้งหนึ่งรายการไว้

ตั้งค่า `contextVisibility` ได้รายช่องทางหรือรายห้อง/บทสนทนา ดู [Group Chats](/th/channels/groups#context-visibility-and-allowlists) สำหรับรายละเอียดการตั้งค่า

แนวทางในการประเมิน advisory:

- ข้อกล่าวอ้างที่แสดงเพียงว่า "โมเดลมองเห็นข้อความอ้างอิงหรือข้อความย้อนหลังจากผู้ส่งที่ไม่อยู่ใน allowlist ได้" เป็นผลการตรวจพบเชิง hardening ที่แก้ไขได้ด้วย `contextVisibility` ไม่ใช่การ bypass ขอบเขต auth หรือ sandbox โดยตัวมันเอง
- เพื่อให้มีผลกระทบด้านความปลอดภัย รายงานยังคงต้องแสดงการ bypass ขอบเขตความไว้วางใจที่พิสูจน์ได้ (auth, policy, sandbox, approval หรือขอบเขตอื่นที่มีเอกสารระบุไว้)

## สิ่งที่การ audit ตรวจสอบ (ระดับสูง)

- **การเข้าถึงขาเข้า** (นโยบาย DM, นโยบายกลุ่ม, allowlist): คนแปลกหน้าสามารถทริกเกอร์บอตได้หรือไม่?
- **รัศมีผลกระทบของเครื่องมือ** (เครื่องมือยกระดับสิทธิ์ + ห้องแบบเปิด): prompt injection สามารถกลายเป็นการกระทำกับ shell/ไฟล์/เครือข่ายได้หรือไม่?
- **การเปลี่ยนแปลงของการอนุมัติ exec** (`security=full`, `autoAllowSkills`, allowlist ของ interpreter โดยไม่มี `strictInlineEval`): guardrail ของ host-exec ยังทำงานอย่างที่คุณคิดอยู่หรือไม่?
  - `security="full"` เป็นคำเตือนเรื่องท่าทีโดยรวม ไม่ใช่หลักฐานว่ามีบั๊ก เป็นค่าเริ่มต้นที่เลือกไว้สำหรับการตั้งค่าแบบผู้ช่วยส่วนตัวที่เชื่อถือได้; ทำให้เข้มงวดขึ้นเฉพาะเมื่อโมเดลภัยคุกคามของคุณต้องการ guardrail แบบ approval หรือ allowlist
- **การเปิดเผยผ่านเครือข่าย** (การ bind/auth ของ Gateway, Tailscale Serve/Funnel, โทเค็น auth ที่อ่อนหรือสั้น)
- **การเปิดเผยการควบคุม browser** (Node ระยะไกล, พอร์ต relay, ปลายทาง CDP ระยะไกล)
- **สุขอนามัยของดิสก์ในเครื่อง** (สิทธิ์การเข้าถึง, symlink, config include, พาธแบบ “synced folder”)
- **Plugins** (Plugin โหลดได้โดยไม่มี allowlist แบบระบุชัด)
- **policy drift/misconfig** (มีการกำหนดค่า sandbox docker ทั้งที่โหมด sandbox ปิดอยู่; รูปแบบ `gateway.nodes.denyCommands` ที่ไม่มีผลจริงเพราะการจับคู่เป็นแบบชื่อคำสั่งตรงตัวเท่านั้น เช่น `system.run` และไม่ตรวจสอบข้อความ shell; รายการ `gateway.nodes.allowCommands` ที่อันตราย; `tools.profile="minimal"` แบบ global ถูก override โดยโปรไฟล์ราย agent; เครื่องมือที่ Plugin เป็นเจ้าของเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน)
- **runtime expectation drift** (เช่น คิดว่า implicit exec ยังหมายถึง `sandbox` ทั้งที่ตอนนี้ค่าเริ่มต้นของ `tools.exec.host` คือ `auto` หรือกำหนด `tools.exec.host="sandbox"` แบบชัดเจนทั้งที่โหมด sandbox ปิดอยู่)
- **สุขอนามัยของโมเดล** (เตือนเมื่อโมเดลที่กำหนดค่าดูเป็นรุ่นเก่า; ไม่ใช่การบล็อกแบบบังคับ)

หากคุณรัน `--deep` OpenClaw จะพยายาม probe Gateway แบบสดเท่าที่ทำได้

## แผนผังการจัดเก็บข้อมูลรับรอง

ใช้สิ่งนี้เมื่อตรวจสอบการเข้าถึงหรือตัดสินใจว่าจะสำรองข้อมูลอะไรบ้าง:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (รับเฉพาะไฟล์ปกติ; ปฏิเสธ symlink)
- **Discord bot token**: config/env หรือ SecretRef (provider แบบ env/file/exec)
- **โทเค็น Slack**: config/env (`channels.slack.*`)
- **allowlist สำหรับการจับคู่**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **auth profile ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ของ secret แบบอิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบเดิม**: `~/.openclaw/credentials/oauth.json`

## รายการตรวจสอบ security audit

เมื่อการ audit พิมพ์ผลการตรวจพบ ให้ถือว่านี่คือลำดับความสำคัญ:

1. **ทุกอย่างที่เป็น “open” + เปิดใช้เครื่องมือ**: ล็อก DM/กลุ่มก่อน (pairing/allowlist) จากนั้นทำให้นโยบายเครื่องมือ/sandbox เข้มงวดยิ่งขึ้น
2. **การเปิดเผยผ่านเครือข่ายสาธารณะ** (bind กับ LAN, Funnel, ไม่มี auth): แก้ไขทันที
3. **การเปิดเผยการควบคุม browser จากระยะไกล**: ให้ถือว่าเทียบเท่าการเข้าถึงของผู้ปฏิบัติงาน (ใช้เฉพาะ tailnet, จับคู่ Node อย่างตั้งใจ, หลีกเลี่ยงการเปิดเผยสู่สาธารณะ)
4. **สิทธิ์การเข้าถึง**: ตรวจสอบให้แน่ใจว่า state/config/credentials/auth ไม่สามารถถูกอ่านได้โดยกลุ่มหรือทุกคน
5. **Plugins**: โหลดเฉพาะสิ่งที่คุณเชื่อถืออย่างชัดเจนเท่านั้น
6. **การเลือกโมเดล**: เลือกใช้โมเดลสมัยใหม่ที่แข็งแรงต่อ instruction สำหรับบอตที่มีเครื่องมือทุกตัว

## อภิธานศัพท์ของ security audit

ผลการตรวจพบแต่ละรายการจากการ audit จะถูกกำหนดด้วย `checkId` แบบมีโครงสร้าง (เช่น
`gateway.bind_no_auth` หรือ `tools.exec.security_full_configured`) กลุ่มความรุนแรงระดับ critical ที่พบบ่อย:

- `fs.*` — สิทธิ์ของ filesystem บน state, config, credentials, auth profile
- `gateway.*` — โหมด bind, auth, Tailscale, Control UI, การตั้งค่า trusted-proxy
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — การทำให้แต่ละพื้นผิวแข็งแรงขึ้น
- `plugins.*`, `skills.*` — ห่วงโซ่อุปทานของ Plugin/Skill และผลการสแกน
- `security.exposure.*` — การตรวจสอบแบบครอบคลุมที่นโยบายการเข้าถึงมาบรรจบกับรัศมีผลกระทบของเครื่องมือ

ดูแค็ตตาล็อกทั้งหมดพร้อมระดับความรุนแรง, คีย์ fix และการรองรับ auto-fix ได้ที่
[Security audit checks](/th/gateway/security/audit-checks)

## Control UI ผ่าน HTTP

Control UI ต้องการ **secure context** (HTTPS หรือ localhost) เพื่อสร้าง device
identity `gateway.controlUi.allowInsecureAuth` เป็นสวิตช์ความเข้ากันได้สำหรับระบบ local:

- บน localhost มันอนุญาตให้มี auth สำหรับ Control UI ได้โดยไม่มี device identity เมื่อหน้า
  ถูกโหลดผ่าน HTTP ที่ไม่ปลอดภัย
- มันไม่ได้ bypass การตรวจสอบการจับคู่
- มันไม่ได้ผ่อนปรนข้อกำหนด device identity สำหรับอุปกรณ์ระยะไกล (ที่ไม่ใช่ localhost)

ควรใช้ HTTPS (Tailscale Serve) หรือเปิด UI ที่ `127.0.0.1`

ใช้เฉพาะในกรณี break-glass เท่านั้น `gateway.controlUi.dangerouslyDisableDeviceAuth`
จะปิดการตรวจสอบ device identity ทั้งหมด นี่คือการลดระดับความปลอดภัยอย่างรุนแรง;
ให้ปิดไว้ เว้นแต่คุณกำลังดีบักอยู่จริงและสามารถย้อนกลับได้อย่างรวดเร็ว

แยกจากแฟลกอันตรายเหล่านั้น การใช้ `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
สามารถอนุญาตเซสชัน Control UI ของ **ผู้ปฏิบัติงาน** ได้โดยไม่มี device identity นี่คือ
พฤติกรรมของโหมด auth ที่ตั้งใจไว้ ไม่ใช่ทางลัดของ `allowInsecureAuth` และก็ยัง
ไม่ขยายไปถึงเซสชัน Control UI ที่มีบทบาทเป็น Node

`openclaw security audit` จะเตือนเมื่อเปิดใช้การตั้งค่านี้

## สรุปแฟลกที่ไม่ปลอดภัยหรืออันตราย

`openclaw security audit` จะยก `config.insecure_or_dangerous_flags` เมื่อ
มีการเปิดใช้สวิตช์ดีบักที่ทราบว่าไม่ปลอดภัย/อันตราย ให้ปล่อยสิ่งเหล่านี้ว่างไว้ใน
production

<AccordionGroup>
  <Accordion title="แฟลกที่การ audit ติดตามในปัจจุบัน">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`
  </Accordion>

  <Accordion title="คีย์ `dangerous*` / `dangerously*` ทั้งหมดใน schema ของ config">
    Control UI และ browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    การจับคู่ตามชื่อของช่องทาง (ช่องทางที่มาพร้อมระบบและช่องทางแบบ Plugin; ใช้ได้ราย
    `accounts.<accountId>` ด้วยเมื่อรองรับ):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (ช่องทางแบบ Plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (ช่องทางแบบ Plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (ช่องทางแบบ Plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (ช่องทางแบบ Plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (ช่องทางแบบ Plugin)

    การเปิดเผยผ่านเครือข่าย:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (รวมถึงรายบัญชีด้วย)

    Sandbox Docker (ค่าเริ่มต้น + ราย agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## การกำหนดค่า Reverse Proxy

หากคุณรัน Gateway ไว้หลัง reverse proxy (nginx, Caddy, Traefik เป็นต้น) ให้กำหนดค่า
`gateway.trustedProxies` เพื่อให้จัดการ IP ไคลเอนต์ที่ถูกส่งต่อมาได้อย่างถูกต้อง

เมื่อ Gateway ตรวจพบ proxy header จากที่อยู่ที่ **ไม่ได้** อยู่ใน `trustedProxies` มันจะ **ไม่** ถือว่าการเชื่อมต่อเป็นไคลเอนต์ในเครื่อง หากปิด gateway auth อยู่ การเชื่อมต่อนั้นจะถูกปฏิเสธ สิ่งนี้ช่วยป้องกันการ bypass การยืนยันตัวตนที่อาจเกิดขึ้นเมื่อการเชื่อมต่อผ่าน proxy ดูเหมือนมาจาก localhost และได้รับความไว้วางใจโดยอัตโนมัติ

`gateway.trustedProxies` ยังถูกใช้โดย `gateway.auth.mode: "trusted-proxy"` ด้วย แต่โหมด auth นี้เข้มงวดยิ่งกว่า:

- auth แบบ trusted-proxy **จะปิดล้มเหลวบน proxy ที่มาจาก loopback**
- reverse proxy แบบ loopback บนโฮสต์เดียวกันยังคงใช้ `gateway.trustedProxies` สำหรับการตรวจจับไคลเอนต์ในเครื่องและการจัดการ forwarded IP ได้
- สำหรับ reverse proxy แบบ loopback บนโฮสต์เดียวกัน ให้ใช้ auth แบบ token/password แทน `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP ของ reverse proxy
  # ไม่บังคับ ค่าเริ่มต้น false
  # เปิดใช้เฉพาะเมื่อ proxy ของคุณไม่สามารถส่ง X-Forwarded-For ได้
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

เมื่อมีการกำหนดค่า `trustedProxies` Gateway จะใช้ `X-Forwarded-For` เพื่อระบุ IP ของไคลเอนต์ โดยค่าเริ่มต้น `X-Real-IP` จะถูกเพิกเฉย เว้นแต่จะตั้ง `gateway.allowRealIpFallback: true` อย่างชัดเจน

พฤติกรรม reverse proxy ที่ดี (เขียนทับ forwarding header ที่เข้ามา):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

พฤติกรรม reverse proxy ที่ไม่ดี (ต่อท้าย/คง forwarding header ที่ไม่น่าเชื่อถือไว้):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## หมายเหตุเรื่อง HSTS และ origin

- OpenClaw gateway ออกแบบแบบ local/loopback ก่อน หากคุณยุติ TLS ที่ reverse proxy ให้ตั้ง HSTS บนโดเมน HTTPS ฝั่ง proxy นั้น
- หาก gateway เป็นผู้ยุติ HTTPS เอง คุณสามารถตั้ง `gateway.http.securityHeaders.strictTransportSecurity` เพื่อส่ง HSTS header จากการตอบกลับของ OpenClaw ได้
- แนวทางการติดตั้งใช้งานโดยละเอียดอยู่ใน [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts)
- สำหรับการติดตั้งใช้งาน Control UI ที่ไม่ใช่ loopback โดยค่าเริ่มต้นจำเป็นต้องมี `gateway.controlUi.allowedOrigins`
- `gateway.controlUi.allowedOrigins: ["*"]` เป็นนโยบายอนุญาต browser-origin ทั้งหมดแบบระบุชัด ไม่ใช่ค่าเริ่มต้นแบบแข็งแรง หลีกเลี่ยงการใช้ค่านี้นอกการทดสอบ local ที่ควบคุมอย่างเข้มงวด
- ความล้มเหลวของ auth แบบ browser-origin บน loopback ยังคงถูกจำกัดอัตราแม้จะ
  เปิดข้อยกเว้น loopback ทั่วไปไว้ แต่คีย์การล็อกจะถูกจำกัดขอบเขตตามค่า `Origin`
  ที่ normalize แล้ว ไม่ใช่ใช้ bucket localhost ร่วมกันเพียงอันเดียว
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด fallback ของ origin ตาม Host-header; ให้ถือว่าเป็นนโยบายอันตรายที่ผู้ปฏิบัติงานเลือกเปิดเอง
- ให้ถือว่า DNS rebinding และพฤติกรรม Host header ของ proxy เป็นประเด็นด้าน hardening ในการติดตั้งใช้งาน; รักษา `trustedProxies` ให้แคบ และหลีกเลี่ยงการเปิดเผย gateway สู่สาธารณะโดยตรง

## log ของเซสชันในเครื่องถูกเก็บไว้บนดิสก์

OpenClaw เก็บ transcript ของเซสชันไว้บนดิสก์ภายใต้ `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
สิ่งนี้จำเป็นสำหรับความต่อเนื่องของเซสชันและ (ถ้าเลือกใช้) การทำดัชนี session memory แต่ก็หมายความว่า
**โปรเซส/ผู้ใช้ใดก็ตามที่เข้าถึง filesystem ได้สามารถอ่าน log เหล่านั้นได้** ให้ถือว่าการเข้าถึงดิสก์คือขอบเขต
ความไว้วางใจ และล็อกสิทธิ์ของ `~/.openclaw` ให้แน่นหนา (ดูส่วนการ audit ด้านล่าง) หากคุณต้องการ
การแยกที่แข็งแรงกว่าระหว่าง agent ให้รันแต่ละตัวภายใต้ผู้ใช้ OS แยกกันหรือโฮสต์แยกกัน

## การรันคำสั่งบน Node (`system.run`)

หากมีการจับคู่ macOS Node ไว้ Gateway สามารถเรียก `system.run` บน Node นั้นได้ นี่คือ **การรันโค้ดจากระยะไกล** บน Mac:

- ต้องมีการจับคู่ Node (การอนุมัติ + โทเค็น)
- การจับคู่ Node ของ Gateway ไม่ใช่พื้นผิวการอนุมัติรายคำสั่ง แต่เป็นการสร้างตัวตน/ความไว้วางใจของ Node และการออกโทเค็น
- Gateway ใช้นโยบายคำสั่งของ Node แบบ global อย่างหยาบผ่าน `gateway.nodes.allowCommands` / `denyCommands`
- ควบคุมบน Mac ผ่าน **Settings → Exec approvals** (`security` + `ask` + allowlist)
- นโยบาย `system.run` ราย Node คือไฟล์ exec approvals ของ Node เอง (`exec.approvals.node.*`) ซึ่งอาจเข้มงวดหรือผ่อนปรนกว่านโยบาย command-ID แบบ global ของ gateway ก็ได้
- Node ที่รันด้วย `security="full"` และ `ask="off"` กำลังทำงานตามโมเดลผู้ปฏิบัติงานที่เชื่อถือได้แบบค่าเริ่มต้น ให้ถือว่านี่เป็นพฤติกรรมที่คาดหมาย เว้นแต่การติดตั้งใช้งานของคุณจะต้องการจุดยืนด้าน approval หรือ allowlist ที่เข้มงวดกว่านี้อย่างชัดเจน
- โหมด approval จะผูกกับบริบทคำขอแบบตรงตัว และเมื่อเป็นไปได้ จะผูกกับโอเปอแรนด์สคริปต์/ไฟล์ในเครื่องที่เป็นรูปธรรมเพียงรายการเดียว หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องโดยตรงเพียงไฟล์เดียวได้อย่างชัดเจนสำหรับคำสั่ง interpreter/runtime ระบบจะปฏิเสธการรันแบบมี approval-backed แทนที่จะอ้างว่าครอบคลุมเชิงความหมายทั้งหมด
- สำหรับ `host=node` การรันแบบ approval-backed ยังจัดเก็บ
  `systemRunPlan` ที่เตรียมไว้แบบ canonical ด้วย; การส่งต่อที่ได้รับอนุมัติในภายหลังจะใช้ plan ที่จัดเก็บไว้นั้นซ้ำ และ
  การตรวจสอบของ gateway จะปฏิเสธการแก้ไข command/cwd/session context จากผู้เรียกหลังจากสร้างคำขออนุมัติแล้ว
- หากคุณไม่ต้องการการรันจากระยะไกล ให้ตั้งค่า security เป็น **deny** และยกเลิกการจับคู่ Node สำหรับ Mac เครื่องนั้น

ความแตกต่างนี้สำคัญต่อการประเมิน:

- Node ที่จับคู่แล้วซึ่งเชื่อมต่อใหม่และประกาศรายการคำสั่งที่ต่างออกไป ไม่ถือเป็นช่องโหว่โดยตัวมันเอง หากนโยบาย global ของ Gateway และ exec approvals ในเครื่องของ Node ยังคงบังคับใช้ขอบเขตการรันจริงอยู่
- รายงานที่มอง metadata การจับคู่ Node เป็นชั้น approval รายคำสั่งแบบซ่อนเร้นชั้นที่สอง มักเป็นความสับสนด้านนโยบาย/UX ไม่ใช่การ bypass ขอบเขตความปลอดภัย

## Skills แบบไดนามิก (watcher / Node ระยะไกล)

OpenClaw สามารถรีเฟรชรายการ Skills กลางเซสชันได้:

- **Skills watcher**: การเปลี่ยนแปลงใน `SKILL.md` สามารถอัปเดต snapshot ของ Skills ในเทิร์นถัดไปของ agent
- **Node ระยะไกล**: การเชื่อมต่อ macOS Node สามารถทำให้ Skills ที่ใช้ได้เฉพาะบน macOS มีสิทธิ์ใช้งานได้ (อิงจากการ probe `bin`)

ให้ถือว่าโฟลเดอร์ Skill เป็น **โค้ดที่เชื่อถือได้** และจำกัดว่าใครสามารถแก้ไขได้

## โมเดลภัยคุกคาม

ผู้ช่วย AI ของคุณสามารถ:

- รันคำสั่ง shell ใดก็ได้
- อ่าน/เขียนไฟล์
- เข้าถึงบริการเครือข่าย
- ส่งข้อความถึงใครก็ได้ (หากคุณให้สิทธิ์เข้าถึง WhatsApp กับมัน)

คนที่ส่งข้อความหาคุณสามารถ:

- พยายามหลอก AI ของคุณให้ทำสิ่งไม่ดี
- ใช้วิศวกรรมสังคมเพื่อเข้าถึงข้อมูลของคุณ
- สืบค้นรายละเอียดของโครงสร้างพื้นฐาน

## แนวคิดหลัก: ควบคุมการเข้าถึงก่อนความฉลาด

ความล้มเหลวส่วนใหญ่ที่นี่ไม่ใช่การโจมตีซับซ้อน — แต่คือ “มีคนส่งข้อความหาบอต แล้วบอตก็ทำตามที่ถูกขอ”

จุดยืนของ OpenClaw:

- **ตัวตนมาก่อน:** ตัดสินใจก่อนว่าใครสามารถคุยกับบอตได้ (การจับคู่ DM / allowlist / การเปิดแบบชัดเจน)
- **ขอบเขตถัดมา:** ตัดสินใจว่าบอตได้รับอนุญาตให้กระทำที่ไหน (allowlist ของกลุ่ม + mention gating, เครื่องมือ, sandboxing, สิทธิ์ของอุปกรณ์)
- **โมเดลเป็นลำดับสุดท้าย:** สมมติว่าโมเดลอาจถูกชักจูงได้; ออกแบบให้การชักจูงนั้นมีรัศมีผลกระทบจำกัด

## โมเดลการอนุญาตคำสั่ง

Slash command และ directive จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น การอนุญาตได้มาจาก
allowlist/การจับคู่ของช่องทาง ร่วมกับ `commands.useAccessGroups` (ดู [Configuration](/th/gateway/configuration)
และ [Slash commands](/th/tools/slash-commands)) หาก allowlist ของช่องทางว่างเปล่าหรือมี `"*"`,
คำสั่งจะถือว่าเปิดใช้งานอย่างมีผลสำหรับช่องทางนั้น

`/exec` เป็นเพียงทางลัดระดับเซสชันสำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต มัน **ไม่** เขียน config หรือ
เปลี่ยนเซสชันอื่น

## ความเสี่ยงของเครื่องมือ control plane

มีเครื่องมือในตัวสองตัวที่สามารถทำการเปลี่ยนแปลงแบบคงอยู่ใน control plane ได้:

- `gateway` สามารถตรวจสอบ config ด้วย `config.schema.lookup` / `config.get` และสามารถเปลี่ยนแปลงแบบคงอยู่ได้ด้วย `config.apply`, `config.patch` และ `update.run`
- `cron` สามารถสร้างงานตามตารางเวลาที่ทำงานต่อไปได้แม้หลังจากแชต/งานต้นทางจะสิ้นสุดลงแล้ว

เครื่องมือรันไทม์ `gateway` ที่ใช้ได้เฉพาะเจ้าของยังคงปฏิเสธการเขียนทับ
`tools.exec.ask` หรือ `tools.exec.security`; alias แบบเดิมของ `tools.bash.*`
จะถูก normalize ไปยังพาธ exec ที่ป้องกันเดียวกันก่อนเขียน

สำหรับ agent/พื้นผิวใดก็ตามที่จัดการเนื้อหาที่ไม่น่าเชื่อถือ ให้ปฏิเสธสิ่งเหล่านี้โดยค่าเริ่มต้น:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` บล็อกเฉพาะการกระทำ restart เท่านั้น มันไม่ได้ปิดใช้งานการกระทำ config/update ของ `gateway`

## Plugins

Plugins ทำงาน **ใน-process** ร่วมกับ Gateway ให้ถือว่าเป็นโค้ดที่เชื่อถือได้:

- ติดตั้งเฉพาะ Plugin จากแหล่งที่คุณเชื่อถือ
- ควรใช้ allowlist แบบระบุชัดใน `plugins.allow`
- ตรวจสอบ config ของ Plugin ก่อนเปิดใช้งาน
- รีสตาร์ต Gateway หลังเปลี่ยนแปลง Plugin
- หากคุณติดตั้งหรืออัปเดต Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`) ให้ถือว่าเหมือนการรันโค้ดที่ไม่น่าเชื่อถือ:
  - พาธการติดตั้งคือไดเรกทอรีราย Plugin ภายใต้รากการติดตั้ง Plugin ที่ใช้งานอยู่
  - OpenClaw จะรันการสแกนโค้ดอันตรายในตัวก่อนการติดตั้ง/อัปเดต ผลการตรวจพบระดับ `critical` จะบล็อกโดยค่าเริ่มต้น
  - OpenClaw ใช้ `npm pack` แล้วรัน `npm install --omit=dev` ในไดเรกทอรีนั้น (npm lifecycle script สามารถรันโค้ดระหว่างติดตั้งได้)
  - ควรใช้เวอร์ชันที่ pin แบบตรงตัว (`@scope/pkg@1.2.3`) และตรวจสอบโค้ดที่แตกไฟล์แล้วบนดิสก์ก่อนเปิดใช้งาน
  - `--dangerously-force-unsafe-install` ใช้เฉพาะกรณี break-glass สำหรับ false positive จากการสแกนในตัวระหว่าง flow การติดตั้ง/อัปเดต Plugin เท่านั้น มันไม่ได้ bypass การบล็อกจากนโยบาย hook `before_install` ของ Plugin และไม่ได้ bypass ความล้มเหลวจากการสแกน
  - การติดตั้ง dependency ของ Skill ที่อาศัย Gateway จะใช้การแยก dangerous/suspicious แบบเดียวกัน: ผลการตรวจพบระดับ `critical` จากระบบในตัวจะบล็อก เว้นแต่ผู้เรียกจะตั้ง `dangerouslyForceUnsafeInstall` อย่างชัดเจน ส่วนผลการตรวจพบระดับ suspicious จะยังคงเป็นเพียงคำเตือน `openclaw skills install` ยังคงเป็น flow แยกสำหรับการดาวน์โหลด/ติดตั้ง Skill จาก ClawHub

รายละเอียด: [Plugins](/th/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## โมเดลการเข้าถึง DM (pairing / allowlist / open / disabled)

ทุกช่องทางปัจจุบันที่รองรับ DM รองรับนโยบาย DM (`dmPolicy` หรือ `*.dm.policy`) ที่ใช้ควบคุม DM ขาเข้า **ก่อน** ประมวลผลข้อความ:

- `pairing` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่สั้น ๆ และบอตจะเพิกเฉยต่อข้อความของพวกเขาจนกว่าจะได้รับอนุมัติ รหัสจะหมดอายุหลัง 1 ชั่วโมง; การส่ง DM ซ้ำจะไม่ส่งรหัสใหม่จนกว่าจะมีคำขอใหม่เกิดขึ้น จำนวนคำขอที่ค้างอยู่ถูกจำกัดไว้ที่ **3 ต่อช่องทาง** โดยค่าเริ่มต้น
- `allowlist`: ผู้ส่งที่ไม่รู้จักจะถูกบล็อก (ไม่มีขั้นตอน pairing handshake)
- `open`: อนุญาตให้ใครก็ได้ส่ง DM (สาธารณะ) **ต้องใช้** allowlist ของช่องทางที่มี `"*"` อยู่ด้วย (เป็นการเลือกเปิดใช้งานอย่างชัดเจน)
- `disabled`: เพิกเฉยต่อ DM ขาเข้าทั้งหมด

อนุมัติผ่าน CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

รายละเอียด + ไฟล์บนดิสก์: [Pairing](/th/channels/pairing)

## การแยกเซสชัน DM (โหมดหลายผู้ใช้)

โดยค่าเริ่มต้น OpenClaw จะกำหนดเส้นทาง **DM ทั้งหมดไปยังเซสชันหลัก** เพื่อให้ผู้ช่วยของคุณมีความต่อเนื่องข้ามอุปกรณ์และช่องทาง หากมี **หลายคน** ที่สามารถส่ง DM หาบอตได้ (DM แบบเปิดหรือ allowlist หลายคน) ให้พิจารณาแยกเซสชัน DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

สิ่งนี้ช่วยป้องกันการรั่วไหลของบริบทข้ามผู้ใช้ ขณะเดียวกันก็ยังคงแยกแชตกลุ่มไว้อยู่

นี่คือขอบเขตของบริบทการส่งข้อความ ไม่ใช่ขอบเขตสิทธิ์ผู้ดูแลโฮสต์ หากผู้ใช้เป็นปฏิปักษ์ต่อกันและใช้โฮสต์/config ของ Gateway เดียวกัน ให้รัน gateway แยกตามขอบเขตความไว้วางใจแทน

### โหมด DM ที่ปลอดภัย (แนะนำ)

ให้ถือว่าส่วน config ด้านบนคือ **โหมด DM ที่ปลอดภัย**:

- ค่าเริ่มต้น: `session.dmScope: "main"` (DM ทั้งหมดใช้เซสชันเดียวกันเพื่อความต่อเนื่อง)
- ค่าเริ่มต้นของ local CLI onboarding: เขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่าไว้ (และคงค่าที่ตั้งไว้อย่างชัดเจนเดิมไว้)
- โหมด DM ที่ปลอดภัย: `session.dmScope: "per-channel-peer"` (แต่ละคู่ช่องทาง+ผู้ส่งจะได้บริบท DM ที่แยกจากกัน)
- การแยก peer ข้ามช่องทาง: `session.dmScope: "per-peer"` (ผู้ส่งแต่ละคนจะได้หนึ่งเซสชันข้ามทุกช่องทางชนิดเดียวกัน)

หากคุณใช้หลายบัญชีในช่องทางเดียวกัน ให้ใช้ `per-account-channel-peer` แทน หากบุคคลเดียวกันติดต่อคุณมาจากหลายช่องทาง ให้ใช้ `session.identityLinks` เพื่อรวมเซสชัน DM เหล่านั้นเข้าเป็นตัวตน canonical เดียว ดู [Session Management](/th/concepts/session) และ [Configuration](/th/gateway/configuration)

## Allowlists (DM + กลุ่ม) - คำศัพท์

OpenClaw มีชั้น “ใครสามารถทริกเกอร์ฉันได้?” แยกกันสองชั้น:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; แบบเดิม: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ใครได้รับอนุญาตให้คุยกับบอตในข้อความส่วนตัว
  - เมื่อ `dmPolicy="pairing"` การอนุมัติจะถูกเขียนลงใน store ของ pairing allowlist ตามขอบเขตบัญชีภายใต้ `~/.openclaw/credentials/` (`<channel>-allowFrom.json` สำหรับบัญชีค่าเริ่มต้น, `<channel>-<accountId>-allowFrom.json` สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น) แล้ว merge กับ allowlist ใน config
- **Group allowlist** (เฉพาะช่องทาง): กลุ่ม/ช่อง/guild ใดที่บอตจะยอมรับข้อความจากได้เลย
  - รูปแบบที่พบบ่อย:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ค่าเริ่มต้นรายกลุ่ม เช่น `requireMention`; เมื่อกำหนดไว้ มันยังทำหน้าที่เป็น group allowlist ด้วย (ใส่ `"*"` เพื่อคงพฤติกรรมอนุญาตทุกกลุ่ม)
    - `groupPolicy="allowlist"` + `groupAllowFrom`: จำกัดว่าใครสามารถทริกเกอร์บอต _ภายใน_ เซสชันกลุ่มได้ (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)
    - `channels.discord.guilds` / `channels.slack.channels`: allowlist รายพื้นผิว + ค่าเริ่มต้นเรื่อง mention
  - การตรวจสอบกลุ่มจะรันตามลำดับนี้: `groupPolicy`/group allowlist ก่อน, mention/reply activation เป็นลำดับที่สอง
  - การตอบกลับข้อความของบอต (implicit mention) **ไม่ได้** bypass allowlist ของผู้ส่ง เช่น `groupAllowFrom`
  - **หมายเหตุด้านความปลอดภัย:** ให้ถือว่า `dmPolicy="open"` และ `groupPolicy="open"` เป็นการตั้งค่าทางเลือกสุดท้าย ควรแทบไม่ใช้เลย; ควรใช้ pairing + allowlist เว้นแต่คุณจะเชื่อถือทุกคนในห้องนั้นอย่างเต็มที่

รายละเอียด: [Configuration](/th/gateway/configuration) และ [Groups](/th/channels/groups)

## Prompt injection (มันคืออะไร และทำไมจึงสำคัญ)

Prompt injection คือเมื่อผู้โจมตีสร้างข้อความที่ชักจูงโมเดลให้ทำสิ่งที่ไม่ปลอดภัย (“เพิกเฉยต่อคำสั่งของคุณ”, “ดัมพ์ filesystem ของคุณ”, “ตามลิงก์นี้แล้วรันคำสั่ง” เป็นต้น)

แม้จะมี system prompt ที่แข็งแรง **prompt injection ก็ยังไม่ใช่ปัญหาที่แก้ได้แล้ว** guardrail ใน system prompt เป็นเพียงแนวทางแบบอ่อนเท่านั้น; การบังคับใช้แบบแข็งมาจากนโยบายเครื่องมือ, การอนุมัติ exec, sandboxing และ allowlist ของช่องทาง (และผู้ปฏิบัติงานก็สามารถปิดสิ่งเหล่านี้ได้โดยการออกแบบ) สิ่งที่ช่วยได้จริงในทางปฏิบัติ:

- ล็อก DM ขาเข้าให้แน่น (pairing/allowlist)
- ควรใช้ mention gating ในกลุ่ม; หลีกเลี่ยงบอต “always-on” ในห้องสาธารณะ
- ให้ถือว่าลิงก์, ไฟล์แนบ และคำสั่งที่วางเข้ามา เป็นสิ่งที่เป็นปฏิปักษ์โดยค่าเริ่มต้น
- รันการใช้เครื่องมือที่ละเอียดอ่อนภายใน sandbox; เก็บ secret ให้อยู่นอก filesystem ที่ agent เข้าถึงได้
- หมายเหตุ: sandboxing เป็นแบบ opt-in หากปิดโหมด sandbox, `host=auto` แบบ implicit จะ resolve ไปยังโฮสต์ของ gateway ส่วน `host=sandbox` แบบ explicit จะยังคงล้มเหลวแบบปิด เพราะไม่มี sandbox runtime ให้ใช้ ตั้ง `host=gateway` หากคุณต้องการให้พฤติกรรมนั้นชัดเจนใน config
- จำกัดเครื่องมือความเสี่ยงสูง (`exec`, `browser`, `web_fetch`, `web_search`) ให้ใช้เฉพาะกับ agent ที่เชื่อถือได้หรือ allowlist แบบชัดเจน
- หากคุณใส่ interpreter ไว้ใน allowlist (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`) ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline eval ยังต้องได้รับการอนุมัติอย่างชัดเจน
- การวิเคราะห์การอนุมัติ shell ยังปฏิเสธรูปแบบ POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) ภายใน **heredoc ที่ไม่ใส่เครื่องหมายคำพูด** ด้วย ดังนั้นเนื้อหา heredoc ที่อยู่ใน allowlist จะไม่สามารถแอบส่ง shell expansion ผ่านการตรวจสอบ allowlist ในฐานะข้อความล้วนได้ ให้ใส่เครื่องหมายคำพูดรอบตัวปิด heredoc (เช่น `<<'EOF'`) เพื่อเลือกใช้ความหมายแบบ literal body; heredoc ที่ไม่ใส่เครื่องหมายคำพูดและจะทำให้มีการขยายตัวแปรจะถูกปฏิเสธ
- **การเลือกโมเดลสำคัญ:** โมเดลรุ่นเก่า/ขนาดเล็ก/แบบ legacy มีความทนทานต่อ prompt injection และการใช้เครื่องมือผิดวัตถุประสงค์ต่ำกว่ามาก สำหรับ agent ที่เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแรงต่อ instruction และมีความสามารถสูงที่สุดที่คุณเข้าถึงได้

สัญญาณเตือนที่ควรถือว่าไม่น่าเชื่อถือ:

- “อ่านไฟล์/URL นี้แล้วทำตามที่มันบอกทุกอย่าง”
- “เพิกเฉยต่อ system prompt หรือกฎความปลอดภัยของคุณ”
- “เปิดเผยคำสั่งที่ซ่อนอยู่หรือเอาต์พุตของเครื่องมือของคุณ”
- “วางเนื้อหาทั้งหมดของ ~/.openclaw หรือ log ของคุณมา”

## การ sanitize special token ในเนื้อหาภายนอก

OpenClaw จะตัด literal ของ special token ที่พบบ่อยใน chat template ของ self-hosted LLM ออกจากเนื้อหาภายนอกและ metadata ที่ถูกครอบไว้ ก่อนที่ข้อมูลเหล่านั้นจะไปถึงโมเดล ตระกูล marker ที่ครอบคลุมรวมถึง token สำหรับบทบาท/เทิร์นของ Qwen/ChatML, Llama, Gemma, Mistral, Phi และ GPT-OSS

เหตุผล:

- backend แบบเข้ากันได้กับ OpenAI ที่ครอบ self-hosted model บางตัวอาจคง special token ที่ปรากฏในข้อความผู้ใช้ไว้ แทนที่จะ mask มัน ผู้โจมตีที่สามารถเขียนเนื้อหาภายนอกขาเข้าได้ (หน้าเว็บที่ถูกดึงมา, เนื้อหาอีเมล, เอาต์พุตจากเครื่องมืออ่านไฟล์) อาจใช้สิ่งนี้ฉีดขอบเขตบทบาท `assistant` หรือ `system` ปลอม และหลุดจาก guardrail ของเนื้อหาที่ถูกครอบไว้ได้
- การ sanitize จะเกิดขึ้นที่ชั้นการครอบเนื้อหาภายนอก จึงใช้ได้สม่ำเสมอทั้งกับเครื่องมือ fetch/read และเนื้อหาขาเข้าจากช่องทางต่าง ๆ แทนที่จะผูกอยู่กับ provider รายตัว
- คำตอบขาออกของโมเดลมี sanitizer แยกต่างหากอยู่แล้ว ซึ่งจะตัดโครงสร้างอย่าง `<tool_call>`, `<function_calls>` และลักษณะคล้ายกันออกจากคำตอบที่ผู้ใช้มองเห็น ตัว sanitizer ของเนื้อหาภายนอกคือคู่ตรงข้ามฝั่งขาเข้า

สิ่งนี้ไม่ได้มาแทนที่การทำให้แข็งแรงขึ้นแบบอื่นในหน้านี้ — `dmPolicy`, allowlist, การอนุมัติ exec, sandboxing และ `contextVisibility` ยังคงเป็นกลไกหลัก มันช่วยปิดการ bypass เฉพาะอย่างหนึ่งในชั้น tokenizer สำหรับสแตก self-hosted ที่ส่งต่อข้อความผู้ใช้พร้อม special token แบบไม่แก้ไข

## แฟลก bypass สำหรับเนื้อหาภายนอกที่ไม่ปลอดภัย

OpenClaw มีแฟลก bypass แบบระบุชัดที่ปิดการครอบความปลอดภัยของเนื้อหาภายนอก:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- ฟิลด์ payload ของ Cron `allowUnsafeExternalContent`

คำแนะนำ:

- ปล่อยค่าเหล่านี้ให้ว่าง/เป็น false ใน production
- เปิดใช้ชั่วคราวเฉพาะเพื่อการดีบักแบบจำกัดขอบเขตอย่างเข้มงวด
- หากเปิดใช้ ให้แยก agent นั้นออกมา (sandbox + เครื่องมือน้อยที่สุด + namespace ของเซสชันแบบเฉพาะ)

หมายเหตุเรื่องความเสี่ยงของ hook:

- payload ของ hook คือเนื้อหาที่ไม่น่าเชื่อถือ แม้ว่าการส่งมาจะมาจากระบบที่คุณควบคุมอยู่ก็ตาม (เมล/เอกสาร/เนื้อหาเว็บสามารถมี prompt injection ได้)
- โมเดลชั้นที่อ่อนกว่าจะเพิ่มความเสี่ยงนี้ สำหรับระบบอัตโนมัติที่ขับเคลื่อนด้วย hook ควรใช้โมเดลสมัยใหม่ที่แข็งแรง และคงนโยบายเครื่องมือให้แน่น (`tools.profile: "messaging"` หรือเข้มกว่านั้น) พร้อม sandboxing เมื่อเป็นไปได้

### Prompt injection ไม่จำเป็นต้องมี DM สาธารณะ

แม้ว่าจะมีเพียง **คุณคนเดียว** ที่ส่งข้อความหาบอตได้ prompt injection ก็ยังเกิดขึ้นได้ผ่าน
**เนื้อหาที่ไม่น่าเชื่อถือ** ใด ๆ ที่บอตอ่าน (ผลลัพธ์ web search/fetch, หน้า browser,
อีเมล, เอกสาร, ไฟล์แนบ, log/code ที่วางเข้ามา) กล่าวอีกนัยหนึ่ง: ผู้ส่งไม่ใช่
พื้นผิวภัยคุกคามเพียงอย่างเดียว; **ตัวเนื้อหาเอง** ก็สามารถมีคำสั่งที่เป็นปฏิปักษ์ได้

เมื่อเปิดใช้เครื่องมือ ความเสี่ยงโดยทั่วไปคือการดึงบริบทออกหรือการกระตุ้น
การเรียกเครื่องมือ ลดรัศมีผลกระทบได้โดย:

- ใช้ **reader agent** ที่อ่านอย่างเดียวหรือปิดเครื่องมือ เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
  แล้วจึงส่งต่อสรุปไปยัง agent หลักของคุณ
- ปิด `web_search` / `web_fetch` / `browser` สำหรับ agent ที่เปิดใช้เครื่องมือ เว้นแต่จำเป็น
- สำหรับอินพุต URL ของ OpenResponses (`input_file` / `input_image`) ให้ตั้งค่า
  `gateway.http.endpoints.responses.files.urlAllowlist` และ
  `gateway.http.endpoints.responses.images.urlAllowlist` ให้แคบ และตั้ง `maxUrlParts` ให้ต่ำ
  allowlist ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `files.allowUrl: false` / `images.allowUrl: false`
  หากคุณต้องการปิดการดึง URL ทั้งหมด
- สำหรับอินพุตไฟล์ของ OpenResponses ข้อความ `input_file` ที่ถูกถอดรหัสแล้วยังคงถูกฉีดเข้าไปเป็น
  **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** อย่าถือว่าข้อความในไฟล์น่าเชื่อถือเพียงเพราะ
  Gateway ถอดรหัสมันในเครื่อง บล็อกที่ถูกฉีดยังคงมี marker ขอบเขตแบบชัดเจน
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` พร้อม metadata `Source: External`
  แม้ว่าเส้นทางนี้จะละแบนเนอร์ `SECURITY NOTICE:` ที่ยาวกว่าออกไป
- การครอบด้วย marker แบบเดียวกันนี้ยังถูกใช้เมื่อระบบทำความเข้าใจสื่อดึงข้อความ
  จากเอกสารที่แนบมาก่อนจะผนวกข้อความนั้นเข้ากับ media prompt
- เปิดใช้ sandboxing และ allowlist เครื่องมือแบบเข้มงวดสำหรับ agent ใดก็ตามที่แตะต้องอินพุตที่ไม่น่าเชื่อถือ
- เก็บ secret ออกจาก prompt; ส่งผ่าน env/config บนโฮสต์ gateway แทน

### backend ของ self-hosted LLM

backend ของ self-hosted LLM ที่เข้ากันได้กับ OpenAI เช่น vLLM, SGLang, TGI, LM Studio
หรือสแตก tokenizer แบบกำหนดเองของ Hugging Face อาจมีพฤติกรรมต่างจาก provider ที่โฮสต์ให้ ในเรื่อง
การจัดการ special token ของ chat template หาก backend ทำ tokenization กับสตริง literal
เช่น `<|im_start|>`, `<|start_header_id|>` หรือ `<start_of_turn>` ให้เป็น
token เชิงโครงสร้างของ chat template ภายในเนื้อหาของผู้ใช้ ข้อความที่ไม่น่าเชื่อถือก็อาจพยายาม
ปลอมขอบเขตบทบาทที่ชั้น tokenizer ได้

OpenClaw จะตัด literal ของ special token ที่พบบ่อยในตระกูลโมเดลออกจาก
เนื้อหาภายนอกที่ถูกครอบไว้ก่อนส่งไปยังโมเดล ให้คงการครอบเนื้อหาภายนอก
ไว้เสมอ และควรใช้การตั้งค่า backend ที่แยกหรือ escape special
token ในเนื้อหาที่ผู้ใช้ส่งมา หากมี provider ที่โฮสต์ให้ เช่น OpenAI
และ Anthropic มีการ sanitize ฝั่งคำขอของตัวเองอยู่แล้ว

### ความแข็งแรงของโมเดล (หมายเหตุด้านความปลอดภัย)

ความต้านทานต่อ prompt injection **ไม่เท่ากัน** ในแต่ละชั้นของโมเดล โมเดลที่เล็กกว่า/ถูกกว่าโดยทั่วไปจะอ่อนไหวต่อการใช้เครื่องมือผิดวัตถุประสงค์และการยึดคำสั่งมากกว่า โดยเฉพาะเมื่อเจอกับพรอมต์ที่เป็นปฏิปักษ์

<Warning>
สำหรับ agent ที่เปิดใช้เครื่องมือหรือ agent ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ ความเสี่ยงจาก prompt injection เมื่อใช้โมเดลรุ่นเก่า/ขนาดเล็กมักสูงเกินไป อย่ารันงานเหล่านั้นบนโมเดลชั้นที่อ่อน
</Warning>

คำแนะนำ:

- **ใช้โมเดลรุ่นล่าสุดและชั้นที่ดีที่สุด** สำหรับบอตใดก็ตามที่สามารถรันเครื่องมือหรือแตะต้องไฟล์/เครือข่ายได้
- **อย่าใช้โมเดลชั้นที่เก่า/อ่อน/เล็กกว่า** สำหรับ agent ที่เปิดใช้เครื่องมือหรือกล่องข้อความขาเข้าที่ไม่น่าเชื่อถือ; ความเสี่ยงจาก prompt injection สูงเกินไป
- หากจำเป็นต้องใช้โมเดลที่เล็กกว่า **ให้ลดรัศมีผลกระทบ** (เครื่องมือแบบอ่านอย่างเดียว, sandboxing ที่เข้มงวด, การเข้าถึง filesystem ให้น้อยที่สุด, allowlist ที่เข้มงวด)
- เมื่อรันโมเดลขนาดเล็ก **ให้เปิด sandboxing สำหรับทุกเซสชัน** และ **ปิด web_search/web_fetch/browser** เว้นแต่อินพุตจะถูกควบคุมอย่างเข้มงวด
- สำหรับผู้ช่วยส่วนตัวแบบแชตอย่างเดียวที่มีอินพุตที่เชื่อถือได้และไม่มีเครื่องมือ โมเดลขนาดเล็กมักใช้งานได้

<a id="reasoning-verbose-output-in-groups"></a>

## Reasoning และเอาต์พุตแบบ verbose ในกลุ่ม

`/reasoning`, `/verbose` และ `/trace` อาจเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ
หรือข้อมูลวินิจฉัยของ Plugin ที่
ไม่ได้ตั้งใจให้ปรากฏในช่องสาธารณะ ในการตั้งค่าแบบกลุ่ม ให้ถือว่าสิ่งเหล่านี้เป็น **debug
เท่านั้น** และปิดไว้ เว้นแต่คุณจำเป็นต้องใช้จริง

คำแนะนำ:

- ปิด `/reasoning`, `/verbose` และ `/trace` ในห้องสาธารณะ
- หากจะเปิดใช้ ให้เปิดเฉพาะใน DM ที่เชื่อถือได้หรือห้องที่ควบคุมอย่างเข้มงวด
- โปรดจำไว้ว่า เอาต์พุตแบบ verbose และ trace อาจรวมอาร์กิวเมนต์ของเครื่องมือ, URL, ข้อมูลวินิจฉัยของ Plugin และข้อมูลที่โมเดลมองเห็น

## การทำให้ config แข็งแรงขึ้น (ตัวอย่าง)

### สิทธิ์ของไฟล์

เก็บ config + state ให้เป็นส่วนตัวบนโฮสต์ gateway:

- `~/.openclaw/openclaw.json`: `600` (ผู้ใช้อ่าน/เขียนได้เท่านั้น)
- `~/.openclaw`: `700` (เฉพาะผู้ใช้)

`openclaw doctor` สามารถเตือนและเสนอให้ทำสิทธิ์เหล่านี้ให้เข้มงวดยิ่งขึ้นได้

### การเปิดเผยผ่านเครือข่าย (bind, พอร์ต, firewall)

Gateway ทำ multiplex ทั้ง **WebSocket + HTTP** บนพอร์ตเดียว:

- ค่าเริ่มต้น: `18789`
- config/flag/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

พื้นผิว HTTP นี้รวมถึง Control UI และ canvas host:

- Control UI (asset ของ SPA) (base path ค่าเริ่มต้น `/`)
- Canvas host: `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/` (HTML/JS ตามอำเภอใจ; ให้ถือว่าเป็นเนื้อหาที่ไม่น่าเชื่อถือ)

หากคุณโหลดเนื้อหา canvas ใน browser ปกติ ให้ถือเหมือนหน้าเว็บที่ไม่น่าเชื่อถือทั่วไป:

- อย่าเปิดเผย canvas host ให้กับเครือข่าย/ผู้ใช้ที่ไม่น่าเชื่อถือ
- อย่าให้เนื้อหา canvas ใช้ origin เดียวกับพื้นผิวเว็บที่มีสิทธิ์ เว้นแต่คุณจะเข้าใจผลกระทบทั้งหมดอย่างครบถ้วน

โหมด bind ควบคุมว่า Gateway จะรับฟังที่ใด:

- `gateway.bind: "loopback"` (ค่าเริ่มต้น): มีเพียงไคลเอนต์ในเครื่องเท่านั้นที่เชื่อมต่อได้
- การ bind ที่ไม่ใช่ loopback (`"lan"`, `"tailnet"`, `"custom"`) จะขยายพื้นผิวการโจมตี ใช้เฉพาะเมื่อมี gateway auth (shared token/password หรือ trusted proxy ที่ไม่ใช่ loopback ซึ่งกำหนดค่าอย่างถูกต้อง) และมี firewall จริง

กฎคร่าว ๆ:

- ควรใช้ Tailscale Serve แทนการ bind กับ LAN (Serve จะคง Gateway ไว้บน loopback และให้ Tailscale จัดการการเข้าถึง)
- หากจำเป็นต้อง bind กับ LAN ให้ใช้ firewall จำกัดพอร์ตให้เหลือ allowlist ของ source IP ที่แคบ; อย่าทำ port-forward แบบกว้าง
- อย่าเปิดเผย Gateway โดยไม่มีการยืนยันตัวตนบน `0.0.0.0` เด็ดขาด

### การ publish พอร์ต Docker ร่วมกับ UFW

หากคุณรัน OpenClaw ด้วย Docker บน VPS โปรดจำไว้ว่าพอร์ตของ container ที่ publish
(`-p HOST:CONTAINER` หรือ Compose `ports:`) จะถูกกำหนดเส้นทางผ่าน forwarding chain ของ Docker
ไม่ใช่เฉพาะกฎ `INPUT` ของโฮสต์เท่านั้น

เพื่อให้ทราฟฟิกของ Docker สอดคล้องกับนโยบาย firewall ของคุณ ให้บังคับใช้กฎใน
`DOCKER-USER` (chain นี้จะถูกประเมินก่อนกฎ accept ของ Docker เอง)
บนดิสโทรสมัยใหม่หลายตัว `iptables`/`ip6tables` ใช้ frontend แบบ `iptables-nft`
และยังคงใช้กฎเหล่านี้กับ backend ของ nftables

ตัวอย่าง allowlist ขั้นต่ำ (IPv4):

```bash
# /etc/ufw/after.rules (ต่อท้ายเป็น section *filter แยกของตัวเอง)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 มีตารางแยกต่างหาก เพิ่มนโยบายที่สอดคล้องกันใน `/etc/ufw/after6.rules` หาก
เปิดใช้ Docker IPv6

หลีกเลี่ยงการ hardcode ชื่ออินเทอร์เฟซอย่าง `eth0` ในตัวอย่างเอกสาร ชื่ออินเทอร์เฟซ
แตกต่างกันไปตามอิมเมจ VPS (`ens3`, `enp*` เป็นต้น) และการไม่ตรงกันอาจทำให้
กฎ deny ของคุณถูกข้ามโดยไม่ตั้งใจ

การตรวจสอบอย่างรวดเร็วหลัง reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

พอร์ตภายนอกที่คาดหวังควรมีเฉพาะสิ่งที่คุณตั้งใจเปิดเผย (สำหรับระบบส่วนใหญ่:
SSH + พอร์ต reverse proxy ของคุณ)

### การค้นพบผ่าน mDNS/Bonjour

Gateway จะประกาศตัวเองผ่าน mDNS (`_openclaw-gw._tcp` บนพอร์ต 5353) สำหรับการค้นหาอุปกรณ์ในเครื่อง ในโหมด full จะรวมระเบียน TXT ที่อาจเปิดเผยรายละเอียดการปฏิบัติการ:

- `cliPath`: พาธ filesystem แบบเต็มไปยังไบนารี CLI (เปิดเผยชื่อผู้ใช้และตำแหน่งติดตั้ง)
- `sshPort`: โฆษณาความพร้อมใช้งานของ SSH บนโฮสต์
- `displayName`, `lanHost`: ข้อมูลชื่อโฮสต์

**ข้อพิจารณาด้านความปลอดภัยเชิงปฏิบัติการ:** การประกาศรายละเอียดโครงสร้างพื้นฐานทำให้การสืบค้นง่ายขึ้นสำหรับใครก็ตามในเครือข่ายภายใน แม้แต่ข้อมูลที่ดู “ไม่อันตราย” อย่างพาธของ filesystem และความพร้อมของ SSH ก็ช่วยให้ผู้โจมตีทำแผนที่สภาพแวดล้อมของคุณได้

**คำแนะนำ:**

1. **โหมด minimal** (ค่าเริ่มต้น แนะนำสำหรับ gateway ที่มีการเปิดเผย): ตัดฟิลด์ที่ละเอียดอ่อนออกจากการประกาศผ่าน mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **ปิดทั้งหมด** หากคุณไม่ต้องการการค้นหาอุปกรณ์ในเครื่อง:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **โหมด full** (แบบ opt-in): รวม `cliPath` + `sshPort` ในระเบียน TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **ตัวแปรสภาพแวดล้อม** (ทางเลือก): ตั้ง `OPENCLAW_DISABLE_BONJOUR=1` เพื่อปิด mDNS โดยไม่ต้องแก้ config

ในโหมด minimal Gateway ยังประกาศข้อมูลพอสำหรับการค้นหาอุปกรณ์ (`role`, `gatewayPort`, `transport`) แต่จะละ `cliPath` และ `sshPort` ออก แอปที่ต้องการข้อมูลพาธ CLI สามารถดึงข้อมูลนี้ผ่านการเชื่อมต่อ WebSocket ที่ยืนยันตัวตนแล้วแทน

### ล็อก WebSocket ของ Gateway ให้แน่น (local auth)

โดยค่าเริ่มต้น **จำเป็นต้องมี** gateway auth หากไม่มีการกำหนดค่าเส้นทาง gateway auth ที่ถูกต้อง
Gateway จะปฏิเสธการเชื่อมต่อ WebSocket (ล้มเหลวแบบปิด)

Onboarding จะสร้างโทเค็นโดยค่าเริ่มต้น (แม้แต่สำหรับ loopback) ดังนั้น
ไคลเอนต์ในเครื่องจึงต้องยืนยันตัวตน

ตั้งค่าโทเค็นเพื่อให้ไคลเอนต์ WS **ทั้งหมด** ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor สามารถสร้างให้คุณได้: `openclaw doctor --generate-gateway-token`

หมายเหตุ: `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์ มัน
ไม่ได้ปกป้องการเข้าถึง WS ในเครื่องด้วยตัวมันเอง
เส้นทางการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้ก็ต่อเมื่อ `gateway.auth.*`
ยังไม่ได้ตั้งค่า
หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน
SecretRef แล้ว resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาปกปิด)
ตัวเลือกเสริม: pin TLS ระยะไกลด้วย `gateway.remote.tlsFingerprint` เมื่อใช้ `wss://`
โดยค่าเริ่มต้น `ws://` แบบ plaintext ใช้ได้เฉพาะ loopback เท่านั้น สำหรับเส้นทาง
private-network ที่เชื่อถือได้ ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บนโปรเซสไคลเอนต์ในกรณี break-glass

การจับคู่อุปกรณ์ในเครื่อง:

- การจับคู่อุปกรณ์จะได้รับการอนุมัติโดยอัตโนมัติสำหรับการเชื่อมต่อ loopback ในเครื่องโดยตรง เพื่อให้
  ไคลเอนต์บนโฮสต์เดียวกันทำงานได้ลื่นไหล
- OpenClaw ยังมีเส้นทางการเชื่อมต่อกับตัวเองภายใน backend/container-local แบบแคบ สำหรับ
  flow ของ helper ที่ใช้ shared secret และเชื่อถือได้
- การเชื่อมต่อแบบ tailnet และ LAN รวมถึงการ bind แบบ tailnet บนโฮสต์เดียวกัน จะถือว่าเป็นการเชื่อมต่อระยะไกลสำหรับการจับคู่ และยังต้องได้รับการอนุมัติ
- หลักฐานจาก forwarded header บนคำขอ loopback จะทำให้ไม่ถือว่าเป็น
  local แบบ loopback อีกต่อไป การอนุมัติอัตโนมัติสำหรับ metadata-upgrade ถูกจำกัดขอบเขตไว้อย่างแคบ ดู
  [Gateway pairing](/th/gateway/pairing) สำหรับทั้งสองกฎ

โหมด auth:

- `gateway.auth.mode: "token"`: bearer token แบบใช้ร่วมกัน (แนะนำสำหรับการตั้งค่าส่วนใหญ่)
- `gateway.auth.mode: "password"`: การยืนยันตัวตนด้วยรหัสผ่าน (ควรกำหนดผ่าน env: `OPENCLAW_GATEWAY_PASSWORD`)
- `gateway.auth.mode: "trusted-proxy"`: เชื่อถือ reverse proxy ที่รู้ตัวตนเพื่อยืนยันตัวตนผู้ใช้และส่งตัวตนผ่าน header (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

รายการตรวจสอบการหมุนเวียน (token/password):

1. สร้าง/ตั้ง secret ใหม่ (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_PASSWORD`)
2. รีสตาร์ต Gateway (หรือรีสตาร์ตแอป macOS หากมันเป็นผู้ควบคุม Gateway)
3. อัปเดตไคลเอนต์ระยะไกลทั้งหมด (`gateway.remote.token` / `.password` บนเครื่องที่เรียกใช้ Gateway)
4. ตรวจสอบให้แน่ใจว่าคุณไม่สามารถเชื่อมต่อด้วยข้อมูลรับรองเดิมได้อีก

### เฮดเดอร์ตัวตนของ Tailscale Serve

เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ค่าเริ่มต้นสำหรับ Serve) OpenClaw
จะยอมรับเฮดเดอร์ตัวตนของ Tailscale Serve (`tailscale-user-login`) สำหรับการยืนยันตัวตนของ Control
UI/WebSocket OpenClaw จะตรวจสอบตัวตนโดย resolve
ที่อยู่ `x-forwarded-for` ผ่าน Tailscale daemon ในเครื่อง (`tailscale whois`)
และจับคู่กับเฮดเดอร์ การทำงานนี้จะเกิดขึ้นเฉพาะกับคำขอที่มาถึง loopback
และมี `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ตามที่
Tailscale ฉีดเข้ามา
สำหรับเส้นทางตรวจสอบตัวตนแบบ async นี้ ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกัน
จะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้นการลองผิดแบบพร้อมกัน
จากไคลเอนต์ Serve ตัวเดียวกันอาจทำให้ครั้งที่สองถูกล็อกทันที
แทนที่จะวิ่งแข่งกันเป็นเพียงความไม่ตรงกันสองครั้ง
ปลายทาง HTTP API (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้ auth ด้วยเฮดเดอร์ตัวตนของ Tailscale มันยังคงทำงานตามโหมด HTTP auth
ของ gateway ที่กำหนดไว้

หมายเหตุสำคัญเรื่องขอบเขต:

- HTTP bearer auth ของ Gateway มีผลเป็นการเข้าถึงระดับผู้ปฏิบัติงานแบบ all-or-nothing โดยแท้จริง
- ให้ถือว่าข้อมูลรับรองที่สามารถเรียก `/v1/chat/completions`, `/v1/responses` หรือ `/api/channels/*` ได้ เป็น secret ระดับผู้ปฏิบัติงานที่เข้าถึงได้เต็มสำหรับ gateway นั้น
- บนพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI การใช้ bearer auth แบบ shared secret จะคืนขอบเขตผู้ปฏิบัติงานค่าเริ่มต้นทั้งหมด (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) และ semantics แบบเจ้าของสำหรับเทิร์นของ agent; ค่า `x-openclaw-scopes` ที่แคบกว่าจะไม่ลดสิทธิ์ในเส้นทาง shared-secret นี้
- semantics ของขอบเขตรายคำขอบน HTTP จะมีผลเฉพาะเมื่อคำขอมาจากโหมดที่มีตัวตน เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน ingress แบบ private
- ในโหมดที่มีตัวตนเหล่านั้น หากละ `x-openclaw-scopes` ระบบจะ fallback ไปใช้ชุดขอบเขตผู้ปฏิบัติงานปกติแบบค่าเริ่มต้น; ให้ส่งเฮดเดอร์นี้อย่างชัดเจนเมื่อคุณต้องการชุดขอบเขตที่แคบกว่า
- `/tools/invoke` ใช้กฎ shared-secret แบบเดียวกัน: bearer auth แบบ token/password จะถูกถือว่าเป็นการเข้าถึงของผู้ปฏิบัติงานแบบเต็มเช่นกัน ในขณะที่โหมดที่มีตัวตนยังคงเคารพขอบเขตที่ประกาศไว้
- อย่าแชร์ข้อมูลรับรองเหล่านี้กับผู้เรียกที่ไม่น่าเชื่อถือ; ควรใช้ gateway แยกตามขอบเขตความไว้วางใจ

**สมมติฐานด้านความไว้วางใจ:** auth ของ Serve แบบไม่มีโทเค็นถือว่าโฮสต์ของ gateway เป็นสิ่งที่เชื่อถือได้
อย่าถือว่านี่คือการป้องกันจากโปรเซสที่เป็นปฏิปักษ์บนโฮสต์เดียวกัน หากมีความเป็นไปได้ว่า
จะมีโค้ดในเครื่องที่ไม่น่าเชื่อถือรันอยู่บนโฮสต์ของ gateway ให้ปิด `gateway.auth.allowTailscale`
และบังคับใช้ shared-secret auth แบบชัดเจนด้วย `gateway.auth.mode: "token"` หรือ
`"password"`

**กฎด้านความปลอดภัย:** อย่าส่งต่อเฮดเดอร์เหล่านี้จาก reverse proxy ของคุณเอง หาก
คุณยุติ TLS หรือทำ proxy อยู่หน้าก gateway ให้ปิด
`gateway.auth.allowTailscale` และใช้ shared-secret auth (`gateway.auth.mode:
"token"` หรือ `"password"`) หรือ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
แทน

trusted proxy:

- หากคุณยุติ TLS ไว้หน้าก Gateway ให้ตั้ง `gateway.trustedProxies` เป็น IP ของ proxy ของคุณ
- OpenClaw จะเชื่อถือ `x-forwarded-for` (หรือ `x-real-ip`) จาก IP เหล่านั้นเพื่อระบุ IP ของไคลเอนต์สำหรับการตรวจสอบการจับคู่ในเครื่อง และการตรวจสอบ HTTP auth/local
- ตรวจสอบให้แน่ใจว่า proxy ของคุณ **เขียนทับ** `x-forwarded-for` และบล็อกการเข้าถึงพอร์ต Gateway โดยตรง

ดู [Tailscale](/th/gateway/tailscale) และ [Web overview](/th/web)

### การควบคุม browser ผ่านโฮสต์ Node (แนะนำ)

หาก Gateway ของคุณอยู่ระยะไกล แต่ browser รันอยู่บนอีกเครื่องหนึ่ง ให้รัน **โฮสต์ Node**
บนเครื่องที่มี browser แล้วให้ Gateway ทำ proxy การกระทำของ browser (ดู [Browser tool](/th/tools/browser))
ให้ถือว่าการจับคู่ Node เทียบเท่าการเข้าถึงระดับผู้ดูแล

รูปแบบที่แนะนำ:

- ให้ Gateway และโฮสต์ Node อยู่บน tailnet เดียวกัน (Tailscale)
- จับคู่ Node อย่างตั้งใจ; ปิดการกำหนดเส้นทาง browser proxy หากคุณไม่ต้องการใช้

หลีกเลี่ยง:

- การเปิดเผยพอร์ต relay/control ผ่าน LAN หรืออินเทอร์เน็ตสาธารณะ
- Tailscale Funnel สำหรับปลายทางควบคุม browser (การเปิดเผยสาธารณะ)

### ความลับบนดิสก์

ให้ถือว่าสิ่งใดก็ตามภายใต้ `~/.openclaw/` (หรือ `$OPENCLAW_STATE_DIR/`) อาจมี secret หรือข้อมูลส่วนตัว:

- `openclaw.json`: config อาจมีโทเค็น (gateway, remote gateway), การตั้งค่า provider และ allowlist
- `credentials/**`: ข้อมูลรับรองของช่องทาง (เช่น WhatsApp creds), pairing allowlist, การนำเข้า OAuth แบบเดิม
- `agents/<agentId>/agent/auth-profiles.json`: API key, token profile, OAuth token และ `keyRef`/`tokenRef` แบบไม่บังคับ
- `secrets.json` (ไม่บังคับ): payload ของ secret แบบอิงไฟล์ที่ใช้โดย provider `file` ของ SecretRef (`secrets.providers`)
- `agents/<agentId>/agent/auth.json`: ไฟล์รองรับแบบ legacy รายการ `api_key` แบบคงที่จะถูกล้างออกเมื่อพบ
- `agents/<agentId>/sessions/**`: transcript ของเซสชัน (`*.jsonl`) + metadata การกำหนดเส้นทาง (`sessions.json`) ซึ่งอาจมีข้อความส่วนตัวและเอาต์พุตของเครื่องมือ
- แพ็กเกจ Plugin ที่มาพร้อมระบบ: Plugins ที่ติดตั้งไว้ (รวมถึง `node_modules/` ของมัน)
- `sandboxes/**`: workspace ของ sandbox สำหรับเครื่องมือ; อาจสะสมสำเนาของไฟล์ที่คุณอ่าน/เขียนภายใน sandbox

เคล็ดลับในการทำให้แข็งแรงขึ้น:

- ทำสิทธิ์ให้แน่น (`700` สำหรับไดเรกทอรี, `600` สำหรับไฟล์)
- ใช้การเข้ารหัสดิสก์ทั้งลูกบนโฮสต์ gateway
- ควรใช้บัญชีผู้ใช้ OS แบบเฉพาะสำหรับ Gateway หากโฮสต์ถูกใช้งานร่วมกัน

### ไฟล์ `.env` ของ workspace

OpenClaw โหลดไฟล์ `.env` ใน workspace สำหรับ agent และเครื่องมือ แต่จะไม่ยอมให้ไฟล์เหล่านั้นเขียนทับตัวควบคุมรันไทม์ของ gateway แบบเงียบ ๆ

- คีย์ใดก็ตามที่ขึ้นต้นด้วย `OPENCLAW_*` จะถูกบล็อกจากไฟล์ `.env` ของ workspace ที่ไม่น่าเชื่อถือ
- การตั้งค่า endpoint ของช่องทางสำหรับ Matrix, Mattermost, IRC และ Synology Chat ก็ถูกบล็อกจากการ override ผ่าน `.env` ของ workspace เช่นกัน ดังนั้น workspace ที่ถูกโคลนจะไม่สามารถเปลี่ยนเส้นทางทราฟฟิกของ connector ที่มาพร้อมระบบผ่าน config endpoint ในเครื่องได้ คีย์ env ของ endpoint (เช่น `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) ต้องมาจาก process environment ของ gateway หรือ `env.shellEnv` ไม่ใช่จาก `.env` ที่โหลดจาก workspace
- การบล็อกทำงานแบบ fail-closed: ตัวแปรควบคุมรันไทม์ใหม่ที่เพิ่มเข้ามาในรุ่นถัดไปจะไม่สามารถถูกสืบทอดมาจาก `.env` ที่อยู่ใน repo หรือ `.env` ที่ผู้โจมตีส่งมาได้; คีย์นั้นจะถูกเพิกเฉยและ gateway จะคงค่าของตัวเองไว้
- ตัวแปรสภาพแวดล้อมของ process/OS ที่เชื่อถือได้ (shell ของ gateway เอง, unit ของ launchd/systemd, app bundle) ยังคงมีผล — ข้อจำกัดนี้ใช้เฉพาะกับการโหลดไฟล์ `.env`

เหตุผล: ไฟล์ `.env` ของ workspace มักอยู่ข้างโค้ด agent ถูก commit โดยไม่ตั้งใจ หรือถูกเขียนโดยเครื่องมือ การบล็อกทั้ง prefix `OPENCLAW_*` หมายความว่าแม้ในอนาคตจะมีการเพิ่มแฟลก `OPENCLAW_*` ใหม่ ก็จะไม่มีทางถดถอยไปเป็นการสืบทอดค่าแบบเงียบจาก state ของ workspace ได้

### log และ transcript (การปกปิดข้อมูลและการเก็บรักษา)

log และ transcript อาจทำให้ข้อมูลละเอียดอ่อนรั่วไหลได้ แม้จะตั้งค่าการควบคุมการเข้าถึงถูกต้องแล้ว:

- log ของ Gateway อาจมีสรุปของเครื่องมือ, ข้อผิดพลาด และ URL
- transcript ของเซสชันอาจมี secret ที่ถูกวางเข้ามา, เนื้อหาไฟล์, เอาต์พุตคำสั่ง และลิงก์

คำแนะนำ:

- เปิดการปกปิดข้อมูลในสรุปเครื่องมือไว้ (`logging.redactSensitive: "tools"`; ค่าเริ่มต้น)
- เพิ่มรูปแบบของคุณเองสำหรับสภาพแวดล้อมผ่าน `logging.redactPatterns` (โทเค็น, ชื่อโฮสต์, URL ภายใน)
- เมื่อต้องแชร์ข้อมูลวินิจฉัย ควรใช้ `openclaw status --all` (คัดลอกวางได้, ปกปิด secret แล้ว) แทน log ดิบ
- ลบ transcript ของเซสชันเก่าและไฟล์ log หากคุณไม่ต้องการเก็บไว้นาน

รายละเอียด: [Logging](/th/gateway/logging)

### DM: ใช้ pairing โดยค่าเริ่มต้น

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### กลุ่ม: บังคับให้ต้อง mention ทุกที่

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

ในแชตกลุ่ม ให้ตอบกลับเฉพาะเมื่อมีการ mention อย่างชัดเจน

### แยกหมายเลขออกจากกัน (WhatsApp, Signal, Telegram)

สำหรับช่องทางที่อิงหมายเลขโทรศัพท์ ให้พิจารณารัน AI ของคุณบนหมายเลขโทรศัพท์ที่แยกจากหมายเลขส่วนตัวของคุณ:

- หมายเลขส่วนตัว: บทสนทนาของคุณยังคงเป็นส่วนตัว
- หมายเลขบอต: AI จะจัดการสิ่งเหล่านี้ภายใต้ขอบเขตที่เหมาะสม

### โหมดอ่านอย่างเดียว (ผ่าน sandbox และเครื่องมือ)

คุณสามารถสร้างโปรไฟล์แบบอ่านอย่างเดียวได้โดยผสม:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (หรือ `"none"` หากไม่ให้เข้าถึง workspace)
- รายการอนุญาต/ปฏิเสธของเครื่องมือที่บล็อก `write`, `edit`, `apply_patch`, `exec`, `process` เป็นต้น

ตัวเลือกการทำให้แข็งแรงขึ้นเพิ่มเติม:

- `tools.exec.applyPatch.workspaceOnly: true` (ค่าเริ่มต้น): รับประกันว่า `apply_patch` จะไม่สามารถเขียน/ลบนอกไดเรกทอรี workspace ได้ แม้จะปิด sandboxing อยู่ก็ตาม ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` แตะไฟล์นอก workspace
- `tools.fs.workspaceOnly: true` (ไม่บังคับ): จำกัดพาธของ `read`/`write`/`edit`/`apply_patch` และพาธ auto-load รูปภาพใน prompt แบบ native ให้อยู่ภายในไดเรกทอรี workspace (มีประโยชน์หากวันนี้คุณอนุญาต absolute path อยู่ และต้องการ guardrail เดียว)
- รักษา filesystem root ให้แคบ: หลีกเลี่ยง root ที่กว้าง เช่น home directory ของคุณสำหรับ workspace ของ agent/workspace ของ sandbox root ที่กว้างอาจเปิดเผยไฟล์ในเครื่องที่ละเอียดอ่อน (เช่น state/config ภายใต้ `~/.openclaw`) ให้กับเครื่องมือ filesystem

### baseline ที่ปลอดภัย (คัดลอก/วาง)

config แบบ “ปลอดภัยโดยค่าเริ่มต้น” ชุดหนึ่งที่ทำให้ Gateway เป็นส่วนตัว ต้องใช้ DM pairing และหลีกเลี่ยงบอตกลุ่มแบบ always-on:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

หากคุณต้องการให้การรันเครื่องมือ “ปลอดภัยกว่าโดยค่าเริ่มต้น” ด้วย ให้เพิ่ม sandbox + ปฏิเสธเครื่องมืออันตรายสำหรับ agent ที่ไม่ใช่เจ้าของ (ตัวอย่างด้านล่างใน “Per-agent access profiles”)

baseline ในตัวสำหรับเทิร์นของ agent ที่ขับเคลื่อนด้วยแชต: ผู้ส่งที่ไม่ใช่เจ้าของไม่สามารถใช้เครื่องมือ `cron` หรือ `gateway` ได้

## Sandboxing (แนะนำ)

เอกสารเฉพาะ: [Sandboxing](/th/gateway/sandboxing)

มีสองแนวทางที่เสริมกัน:

- **รัน Gateway ทั้งชุดใน Docker** (ขอบเขตของ container): [Docker](/th/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, โฮสต์ gateway + เครื่องมือที่ถูกแยกใน sandbox; Docker คือ backend ค่าเริ่มต้น): [Sandboxing](/th/gateway/sandboxing)

หมายเหตุ: เพื่อป้องกันการเข้าถึงข้าม agent ให้คง `agents.defaults.sandbox.scope` ไว้ที่ `"agent"` (ค่าเริ่มต้น)
หรือใช้ `"session"` เพื่อการแยกระดับรายเซสชันที่เข้มงวดยิ่งขึ้น `scope: "shared"` จะใช้
container/workspace เดียวร่วมกัน

นอกจากนี้ให้พิจารณาการเข้าถึง workspace ของ agent ภายใน sandbox ด้วย:

- `agents.defaults.sandbox.workspaceAccess: "none"` (ค่าเริ่มต้น) จะไม่ให้เข้าถึง workspace ของ agent; เครื่องมือจะทำงานกับ sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` จะ mount workspace ของ agent แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` จะ mount workspace ของ agent แบบอ่าน/เขียนที่ `/workspace`
- `sandbox.docker.binds` เพิ่มเติมจะถูกตรวจสอบกับ source path ที่ normalize และ canonicalize แล้ว กลอุบาย parent-symlink และ alias ของ home แบบ canonical จะยังคงล้มเหลวแบบปิด หากมัน resolve เข้าไปยัง root ที่ถูกบล็อก เช่น `/etc`, `/var/run` หรือไดเรกทอรีข้อมูลรับรองภายใต้ home ของ OS

สำคัญ: `tools.elevated` คือช่องทางหลุดจาก baseline แบบ global ที่รัน exec นอก sandbox effective host คือ `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อกำหนดเป้าหมาย exec เป็น `node` รักษา `tools.elevated.allowFrom` ให้แคบ และอย่าเปิดให้คนแปลกหน้าใช้ คุณยังสามารถจำกัด elevated เพิ่มเติมราย agent ได้ผ่าน `agents.list[].tools.elevated` ดู [Elevated Mode](/th/tools/elevated)

### guardrail สำหรับการมอบหมายไปยัง sub-agent

หากคุณอนุญาตเครื่องมือ session ให้ถือว่าการรัน sub-agent ที่ถูกมอบหมายเป็นอีกหนึ่งการตัดสินใจเรื่องขอบเขต:

- ปฏิเสธ `sessions_spawn` เว้นแต่ agent นั้นต้องการการมอบหมายจริง ๆ
- จำกัด `agents.defaults.subagents.allowAgents` และ override ราย agent ใน `agents.list[].subagents.allowAgents` ให้เหลือเฉพาะ agent เป้าหมายที่ทราบว่าปลอดภัย
- สำหรับเวิร์กโฟลว์ใดก็ตามที่ต้องคงอยู่ใน sandbox ให้เรียก `sessions_spawn` พร้อม `sandbox: "require"` (ค่าเริ่มต้นคือ `inherit`)
- `sandbox: "require"` จะล้มเหลวทันทีเมื่อรันไทม์ลูกเป้าหมายไม่ได้อยู่ใน sandbox

## ความเสี่ยงของการควบคุม browser

การเปิดใช้การควบคุม browser จะทำให้โมเดลสามารถขับ browser จริงได้
หากโปรไฟล์ browser นั้นมีเซสชันที่ล็อกอินอยู่แล้ว โมเดลก็อาจ
เข้าถึงบัญชีและข้อมูลเหล่านั้นได้ ให้ถือว่าโปรไฟล์ browser เป็น **state ที่ละเอียดอ่อน**:

- ควรใช้โปรไฟล์เฉพาะสำหรับ agent (โปรไฟล์ค่าเริ่มต้น `openclaw`)
- หลีกเลี่ยงการชี้ agent ไปยังโปรไฟล์ใช้งานประจำวันส่วนตัวของคุณ
- ปิดการควบคุม browser บนโฮสต์สำหรับ agent ที่อยู่ใน sandbox เว้นแต่คุณจะเชื่อถือมัน
- API สำหรับการควบคุม browser แบบ standalone loopback จะยอมรับเฉพาะ shared-secret auth
  (bearer auth ด้วย gateway token หรือ gateway password) เท่านั้น มันไม่ใช้
  trusted-proxy หรือเฮดเดอร์ตัวตนของ Tailscale Serve
- ให้ถือว่าการดาวน์โหลดของ browser เป็นอินพุตที่ไม่น่าเชื่อถือ; ควรใช้ไดเรกทอรีดาวน์โหลดที่แยกต่างหาก
- ปิด browser sync/password manager ในโปรไฟล์ของ agent หากเป็นไปได้ (ช่วยลดรัศมีผลกระทบ)
- สำหรับ gateway ระยะไกล ให้ถือว่า “การควบคุม browser” เทียบเท่ากับ “การเข้าถึงระดับผู้ปฏิบัติงาน” ต่อทุกสิ่งที่โปรไฟล์นั้นเข้าถึงได้
- ให้ Gateway และโฮสต์ Node อยู่บน tailnet เท่านั้น; หลีกเลี่ยงการเปิดเผยพอร์ตควบคุม browser สู่ LAN หรืออินเทอร์เน็ตสาธารณะ
- ปิดการกำหนดเส้นทาง browser proxy เมื่อไม่ต้องใช้ (`gateway.nodes.browser.mode="off"`)
- โหมด existing-session ของ Chrome MCP **ไม่ได้** “ปลอดภัยกว่า”; มันสามารถทำงานแทนคุณบนทุกสิ่งที่โปรไฟล์ Chrome ของโฮสต์นั้นเข้าถึงได้

### นโยบาย Browser SSRF (เข้มงวดโดยค่าเริ่มต้น)

นโยบายการนำทาง browser ของ OpenClaw เข้มงวดโดยค่าเริ่มต้น: ปลายทาง private/internal จะยังถูกบล็อก เว้นแต่คุณจะเลือกเปิดใช้งานเองอย่างชัดเจน

- ค่าเริ่มต้น: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่ได้ถูกตั้งค่า ดังนั้นการนำทางด้วย browser จะยังคงบล็อกปลายทาง private/internal/special-use
- alias แบบเดิม: `browser.ssrfPolicy.allowPrivateNetwork` ยังยอมรับได้เพื่อความเข้ากันได้
- โหมด opt-in: ตั้ง `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพื่ออนุญาตปลายทาง private/internal/special-use
- ใน strict mode ให้ใช้ `hostnameAllowlist` (แพตเทิร์นเช่น `*.example.com`) และ `allowedHostnames` (ข้อยกเว้นของโฮสต์แบบตรงตัว รวมถึงชื่อที่ถูกบล็อกอย่าง `localhost`) สำหรับข้อยกเว้นแบบชัดเจน
- การนำทางจะถูกตรวจสอบก่อนส่งคำขอ และตรวจสอบซ้ำแบบ best-effort กับ URL `http(s)` สุดท้ายหลังการนำทาง เพื่อลดการ pivot ผ่าน redirect

ตัวอย่างนโยบายแบบ strict:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## โปรไฟล์การเข้าถึงราย agent (หลาย agent)

ด้วยการกำหนดเส้นทางแบบหลาย agent แต่ละ agent สามารถมีนโยบาย sandbox + เครื่องมือของตัวเองได้:
ใช้สิ่งนี้เพื่อให้ **เข้าถึงเต็มรูปแบบ**, **อ่านอย่างเดียว** หรือ **ไม่ให้เข้าถึงเลย** ราย agent
ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดทั้งหมด
และกฎลำดับความสำคัญ

กรณีใช้งานทั่วไป:

- agent ส่วนตัว: เข้าถึงเต็มรูปแบบ, ไม่มี sandbox
- agent สำหรับครอบครัว/งาน: อยู่ใน sandbox + เครื่องมืออ่านอย่างเดียว
- agent สาธารณะ: อยู่ใน sandbox + ไม่มีเครื่องมือ filesystem/shell

### ตัวอย่าง: เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### ตัวอย่าง: เครื่องมืออ่านอย่างเดียว + workspace แบบอ่านอย่างเดียว

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### ตัวอย่าง: ไม่มีการเข้าถึง filesystem/shell (ยังอนุญาต provider messaging)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // เครื่องมือ session อาจเปิดเผยข้อมูลละเอียดอ่อนจาก transcript โดยค่าเริ่มต้น OpenClaw จะจำกัดเครื่องมือเหล่านี้
        // ไว้ที่เซสชันปัจจุบัน + เซสชัน subagent ที่ spawn ขึ้น แต่คุณสามารถบีบให้แคบกว่านี้ได้หากต้องการ
        // ดู `tools.sessions.visibility` ในเอกสารอ้างอิงการกำหนดค่า
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## การตอบสนองต่อเหตุการณ์

หาก AI ของคุณทำสิ่งที่ไม่ดี:

### ควบคุมสถานการณ์

1. **หยุดมัน:** หยุดแอป macOS (หากมันเป็นผู้ควบคุม Gateway) หรือ terminate โปรเซส `openclaw gateway`
2. **ปิดการเปิดเผย:** ตั้ง `gateway.bind: "loopback"` (หรือปิด Tailscale Funnel/Serve) จนกว่าคุณจะเข้าใจว่าเกิดอะไรขึ้น
3. **หยุดการเข้าถึง:** เปลี่ยน DM/กลุ่มที่มีความเสี่ยงให้เป็น `dmPolicy: "disabled"` / บังคับ mention และลบรายการอนุญาตทุกคน `"*"` หากคุณเคยใช้ไว้

### หมุนเวียน (ให้ถือว่าถูก compromise หาก secret รั่ว)

1. หมุนเวียน Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) แล้วรีสตาร์ต
2. หมุนเวียน secret ของไคลเอนต์ระยะไกล (`gateway.remote.token` / `.password`) บนทุกเครื่องที่สามารถเรียก Gateway ได้
3. หมุนเวียนข้อมูลรับรองของ provider/API (WhatsApp creds, โทเค็น Slack/Discord, model/API key ใน `auth-profiles.json` และค่าภายใน payload ของ secret ที่เข้ารหัสเมื่อมีการใช้งาน)

### ตรวจสอบ

1. ตรวจสอบ log ของ Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (หรือ `logging.file`)
2. ตรวจสอบ transcript ที่เกี่ยวข้อง: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. ตรวจสอบการเปลี่ยนแปลง config ล่าสุด (ทุกสิ่งที่อาจขยายการเข้าถึง: `gateway.bind`, `gateway.auth`, นโยบาย DM/กลุ่ม, `tools.elevated`, การเปลี่ยนแปลง Plugin)
4. รัน `openclaw security audit --deep` อีกครั้ง และยืนยันว่าผลการตรวจพบระดับ critical ได้รับการแก้ไขแล้ว

### รวบรวมสำหรับรายงาน

- timestamp, OS ของโฮสต์ gateway + เวอร์ชัน OpenClaw
- transcript ของเซสชัน + log tail แบบสั้น (หลังปกปิดข้อมูลแล้ว)
- สิ่งที่ผู้โจมตีส่งมา + สิ่งที่ agent ทำ
- Gateway ถูกเปิดเผยเกิน loopback หรือไม่ (LAN/Tailscale Funnel/Serve)

## Secret Scanning (detect-secrets)

CI รัน pre-commit hook ของ `detect-secrets` ใน job `secrets`
การ push ไปยัง `main` จะรันการสแกนทุกไฟล์เสมอ ส่วน pull request จะใช้เส้นทางลัดแบบเปลี่ยนเฉพาะไฟล์เมื่อมี base commit ให้ใช้งาน และจะ fallback ไปสแกนทุกไฟล์ในกรณีอื่น หากล้มเหลว แปลว่ามี candidate ใหม่ที่ยังไม่อยู่ใน baseline

### หาก CI ล้มเหลว

1. ทำซ้ำในเครื่อง:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ทำความเข้าใจเครื่องมือ:
   - `detect-secrets` ใน pre-commit จะรัน `detect-secrets-hook` พร้อม baseline
     และ exclude ของ repo
   - `detect-secrets audit` จะเปิดการตรวจสอบแบบโต้ตอบเพื่อทำเครื่องหมายแต่ละรายการใน baseline
     ว่าเป็นของจริงหรือ false positive
3. สำหรับ secret จริง: หมุนเวียน/ลบออก จากนั้นรันการสแกนอีกครั้งเพื่ออัปเดต baseline
4. สำหรับ false positive: รันการ audit แบบโต้ตอบและทำเครื่องหมายว่าเป็น false:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. หากคุณต้องการ exclude ใหม่ ให้เพิ่มลงใน `.detect-secrets.cfg` และสร้าง
   baseline ใหม่ด้วยแฟลก `--exclude-files` / `--exclude-lines` ที่สอดคล้องกัน (ไฟล์ config
   นี้มีไว้เป็นข้อมูลอ้างอิงเท่านั้น; detect-secrets จะไม่อ่านมันโดยอัตโนมัติ)

commit `.secrets.baseline` ที่อัปเดตแล้ว เมื่อมันสะท้อนสถานะที่ตั้งใจไว้

## การรายงานปัญหาด้านความปลอดภัย

พบบั๊กช่องโหว่ใน OpenClaw ใช่หรือไม่? โปรดรายงานอย่างรับผิดชอบ:

1. อีเมล: [security@openclaw.ai](mailto:security@openclaw.ai)
2. อย่าโพสต์สาธารณะจนกว่าจะแก้ไขแล้ว
3. เราจะให้เครดิตคุณ (เว้นแต่คุณต้องการไม่เปิดเผยตัวตน)
