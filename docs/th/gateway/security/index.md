---
read_when:
    - การเพิ่มฟีเจอร์ที่ขยายการเข้าถึงหรือการทำงานอัตโนมัติ
summary: ข้อพิจารณาด้านความปลอดภัยและโมเดลภัยคุกคามสำหรับการรัน AI gateway ที่มีสิทธิ์เข้าถึง shell
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-04-25T13:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a63386bac5db060ff1edc2260aae4a192ac666fc82956c8538915a970205215c
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **โมเดลความเชื่อถือของผู้ช่วยส่วนตัว** แนวทางนี้ตั้งอยู่บนสมมติฐานว่ามี
  ขอบเขตผู้ปฏิบัติการที่เชื่อถือได้หนึ่งขอบเขตต่อ gateway (โมเดลผู้ใช้เดี่ยวแบบผู้ช่วยส่วนตัว)
  OpenClaw **ไม่ใช่** ขอบเขตความปลอดภัยแบบหลายผู้เช่าที่ต้านทานผู้ใช้ไม่หวังดี
  สำหรับผู้ใช้หลายคนที่เป็นปฏิปักษ์กันและใช้เอเจนต์หรือ gateway เดียวร่วมกัน หากคุณต้องการ
  การทำงานแบบความเชื่อถือผสมหรือมีผู้ใช้เชิงปฏิปักษ์ ให้แยกขอบเขตความเชื่อถือ
  (gateway + ข้อมูลรับรองแยกกัน และควรแยก OS users หรือโฮสต์ด้วย)
</Warning>

## เริ่มจากขอบเขตก่อน: โมเดลความปลอดภัยของผู้ช่วยส่วนตัว

แนวทางความปลอดภัยของ OpenClaw ตั้งอยู่บนการติดตั้งใช้งานแบบ **ผู้ช่วยส่วนตัว**: หนึ่งขอบเขตผู้ปฏิบัติการที่เชื่อถือได้ อาจมีหลายเอเจนต์ได้

- สถานะความปลอดภัยที่รองรับ: หนึ่งผู้ใช้/ขอบเขตความเชื่อถือต่อหนึ่ง gateway (ควรเป็นหนึ่ง OS user/host/VPS ต่อหนึ่งขอบเขต)
- ไม่ใช่ขอบเขตความปลอดภัยที่รองรับ: gateway/เอเจนต์เดียวที่ถูกใช้งานร่วมกันโดยผู้ใช้ที่ไม่เชื่อใจกันหรือเป็นปฏิปักษ์กัน
- หากต้องการการแยกสำหรับผู้ใช้ที่เป็นปฏิปักษ์กัน ให้แยกตามขอบเขตความเชื่อถือ (gateway + ข้อมูลรับรองแยกกัน และควรแยก OS users/hosts ด้วย)
- หากมีผู้ใช้ที่ไม่เชื่อใจกันหลายคนสามารถส่งข้อความถึงเอเจนต์ตัวเดียวที่เปิดใช้เครื่องมือ ให้ถือว่าพวกเขากำลังใช้สิทธิ์ของเครื่องมือที่ถูกมอบหมายให้เอเจนต์นั้นร่วมกัน

หน้านี้อธิบายการทำ hardening **ภายในโมเดลนี้** ไม่ได้อ้างว่าให้การแยกแบบหลายผู้เช่าที่ต้านทานผู้โจมตีบน gateway ที่แชร์ร่วมกันหนึ่งตัว

## ตรวจสอบอย่างรวดเร็ว: `openclaw security audit`

ดูเพิ่มเติม: [การพิสูจน์อย่างเป็นทางการ (โมเดลความปลอดภัย)](/th/security/formal-verification)

รันคำสั่งนี้เป็นประจำ (โดยเฉพาะหลังจากเปลี่ยนคอนฟิกหรือเปิดเผยพื้นผิวเครือข่าย):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` จะคงขอบเขตอย่างแคบโดยตั้งใจ: มันจะเปลี่ยนนโยบายกลุ่มเปิดทั่วไปให้เป็น allowlists, คืนค่า `logging.redactSensitive: "tools"`, ทำให้สิทธิ์ของไฟล์ state/config/include-file เข้มงวดขึ้น และใช้การรีเซ็ต Windows ACL แทน
POSIX `chmod` เมื่อรันบน Windows

มันจะตรวจพบ footguns ที่พบบ่อย (การเปิดเผย Gateway auth, การเปิดเผย browser control, elevated allowlists, สิทธิ์ระบบไฟล์, exec approvals ที่ผ่อนปรนเกินไป และการเปิดเครื่องมือในช่องทางแบบเปิด)

OpenClaw เป็นทั้งผลิตภัณฑ์และการทดลอง: คุณกำลังเชื่อมพฤติกรรมของโมเดลแนวหน้ากับพื้นผิวการส่งข้อความจริงและเครื่องมือจริง **ไม่มีการตั้งค่าที่ “ปลอดภัยสมบูรณ์แบบ”** เป้าหมายคือการตั้งค่าอย่างมีเจตนาเกี่ยวกับ:

- ใครสามารถคุยกับบอตของคุณได้
- บอตได้รับอนุญาตให้กระทำที่ใด
- บอตสามารถแตะต้องอะไรได้บ้าง

เริ่มจากสิทธิ์เข้าถึงที่เล็กที่สุดที่ยังใช้งานได้ แล้วค่อยขยายเมื่อคุณมั่นใจมากขึ้น

### การติดตั้งใช้งานและความเชื่อถือในโฮสต์

OpenClaw สมมติว่าโฮสต์และขอบเขตคอนฟิกเป็นสิ่งที่เชื่อถือได้:

- หากใครสามารถแก้ไข state/config ของโฮสต์ Gateway ได้ (`~/.openclaw` รวมถึง `openclaw.json`) ให้ถือว่าบุคคลนั้นเป็นผู้ปฏิบัติการที่เชื่อถือได้
- การรัน Gateway เดียวสำหรับผู้ปฏิบัติการหลายคนที่ไม่เชื่อใจกันหรือเป็นปฏิปักษ์กัน **ไม่ใช่การตั้งค่าที่แนะนำ**
- สำหรับทีมที่มีความเชื่อถือผสมกัน ให้แยกขอบเขตความเชื่อถือด้วย gateways แยกกัน (หรืออย่างน้อยแยก OS users/hosts)
- ค่าเริ่มต้นที่แนะนำ: หนึ่งผู้ใช้ต่อหนึ่งเครื่อง/โฮสต์ (หรือ VPS), หนึ่ง gateway สำหรับผู้ใช้นั้น และมีหนึ่งหรือหลายเอเจนต์ใน gateway นั้น
- ภายในอินสแตนซ์ Gateway เดียว การเข้าถึง operator ที่ยืนยันตัวตนแล้วคือบทบาท control-plane ที่เชื่อถือได้ ไม่ใช่บทบาท tenant แยกต่อผู้ใช้
- ตัวระบุเซสชัน (`sessionKey`, session IDs, labels) เป็นตัวเลือกการกำหนดเส้นทาง ไม่ใช่โทเค็นการอนุญาต
- หากมีหลายคนสามารถส่งข้อความถึงเอเจนต์ตัวเดียวที่เปิดใช้เครื่องมือ แต่ละคนสามารถชี้นำชุดสิทธิ์เดียวกันนั้นได้ การแยกเซสชัน/หน่วยความจำต่อผู้ใช้ช่วยเรื่องความเป็นส่วนตัว แต่ไม่ได้เปลี่ยนเอเจนต์ที่แชร์ร่วมกันให้กลายเป็นการอนุญาตโฮสต์แบบแยกต่อผู้ใช้

### พื้นที่ทำงาน Slack แบบแชร์ร่วมกัน: ความเสี่ยงจริง

หาก “ทุกคนใน Slack สามารถส่งข้อความถึงบอตได้” ความเสี่ยงหลักคือสิทธิ์ของเครื่องมือที่ถูกมอบหมาย:

- ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้สามารถชักนำให้เกิดการเรียกใช้เครื่องมือ (`exec`, browser, network/file tools) ภายในนโยบายของเอเจนต์;
- การฉีดพรอมป์/เนื้อหาจากผู้ส่งคนหนึ่งสามารถก่อให้เกิดการกระทำที่กระทบต่อ state, อุปกรณ์ หรือผลลัพธ์ที่ใช้ร่วมกัน;
- หากเอเจนต์ที่ใช้ร่วมกันมีข้อมูลรับรอง/ไฟล์ที่ละเอียดอ่อน ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้อาจชี้นำการรั่วไหลของข้อมูลผ่านการใช้เครื่องมือได้

ควรใช้เอเจนต์/gateways แยกกันพร้อมเครื่องมือน้อยที่สุดสำหรับเวิร์กโฟลว์ของทีม; เก็บเอเจนต์ที่มีข้อมูลส่วนบุคคลไว้เป็นส่วนตัว

### เอเจนต์ที่แชร์กันในบริษัท: รูปแบบที่ยอมรับได้

ยอมรับได้เมื่อทุกคนที่ใช้เอเจนต์นั้นอยู่ในขอบเขตความเชื่อถือเดียวกัน (เช่น ทีมหนึ่งในบริษัท) และเอเจนต์นั้นถูกจำกัดขอบเขตอย่างเคร่งครัดให้ใช้กับงานเท่านั้น

- รันบนเครื่อง/VM/container เฉพาะ;
- ใช้ OS user + browser/profile/accounts เฉพาะสำหรับ runtime นั้น;
- อย่าลงชื่อเข้าใช้ runtime นั้นด้วยบัญชี Apple/Google ส่วนตัว หรือ password-manager/browser profiles ส่วนตัว

หากคุณผสมตัวตนส่วนตัวและของบริษัทไว้ใน runtime เดียวกัน คุณจะทำให้การแยกยุบลงและเพิ่มความเสี่ยงในการเปิดเผยข้อมูลส่วนบุคคล

## แนวคิดเรื่องความเชื่อถือระหว่าง Gateway และ Node

ให้มอง Gateway และ Node เป็นโดเมนความเชื่อถือของผู้ปฏิบัติการเดียวกัน แต่มีบทบาทต่างกัน:

- **Gateway** คือ control plane และพื้นผิวนโยบาย (`gateway.auth`, นโยบายเครื่องมือ, การกำหนดเส้นทาง)
- **Node** คือพื้นผิวการทำงานระยะไกลที่จับคู่กับ Gateway นั้น (คำสั่ง, การกระทำของอุปกรณ์, ความสามารถเฉพาะของโฮสต์)
- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้วถือว่าได้รับความเชื่อถือในขอบเขตของ Gateway หลังการจับคู่ การกระทำของ node ถือเป็นการกระทำของผู้ปฏิบัติการที่เชื่อถือได้บน node นั้น
- `sessionKey` คือการเลือกการกำหนดเส้นทาง/บริบท ไม่ใช่การยืนยันตัวตนต่อผู้ใช้
- การอนุมัติ Exec (allowlist + ask) เป็น guardrails สำหรับเจตนาของผู้ปฏิบัติการ ไม่ใช่การแยกแบบหลายผู้เช่าที่ต้านทานผู้โจมตี
- ค่าเริ่มต้นของผลิตภัณฑ์ OpenClaw สำหรับการตั้งค่าแบบผู้ปฏิบัติการเดี่ยวที่เชื่อถือได้คือการอนุญาต host exec บน `gateway`/`node` โดยไม่ต้องมีพรอมป์การอนุมัติ (`security="full"`, `ask="off"` เว้นแต่คุณจะทำให้เข้มงวดขึ้น) ค่าเริ่มต้นนี้เป็น UX ที่ตั้งใจไว้ ไม่ใช่ช่องโหว่โดยตัวมันเอง
- การอนุมัติ Exec จะผูกกับบริบทคำขอที่ตรงกันทุกประการและ operand ของไฟล์ท้องถิ่นแบบพยายามเต็มที่; มันไม่ได้จำลองเส้นทาง loader ของ runtime/interpreter ทุกแบบในเชิงความหมาย ใช้ sandboxing และการแยกโฮสต์เพื่อสร้างขอบเขตที่แข็งแรง

หากคุณต้องการการแยกสำหรับผู้ใช้ที่เป็นปฏิปักษ์กัน ให้แยกขอบเขตความเชื่อถือด้วย OS user/host และรัน gateways แยกกัน

## เมทริกซ์ขอบเขตความเชื่อถือ

ใช้สิ่งนี้เป็นโมเดลแบบเร็วเมื่อต้องประเมินความเสี่ยง:

| ขอบเขตหรือตัวควบคุม                                     | ความหมาย                                      | สิ่งที่มักถูกตีความผิด                                                          |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | ยืนยันตัวตนของผู้เรียกต่อ Gateway APIs        | "ต้องมีลายเซ็นต่อข้อความในทุกเฟรมจึงจะปลอดภัย"                                |
| `sessionKey`                                              | คีย์กำหนดเส้นทางสำหรับการเลือกบริบท/เซสชัน    | "Session key คือขอบเขตการยืนยันตัวตนของผู้ใช้"                                  |
| guardrails ของพรอมป์/เนื้อหา                              | ลดความเสี่ยงจากการใช้โมเดลในทางที่ผิด          | "การฉีดพรอมป์เพียงอย่างเดียวพิสูจน์การข้ามการยืนยันตัวตน"                       |
| `canvas.eval` / browser evaluate                          | ความสามารถของผู้ปฏิบัติการที่ตั้งใจไว้เมื่อเปิดใช้ | "primitive ของ JS eval ใด ๆ ถือเป็นช่องโหว่โดยอัตโนมัติในโมเดลความเชื่อถือนี้" |
| shell `!` ของ TUI ในเครื่อง                               | การรันในเครื่องที่ผู้ปฏิบัติการเรียกโดยชัดเจน  | "คำสั่ง shell ในเครื่องที่อำนวยความสะดวกคือการฉีดจากระยะไกล"                    |
| การจับคู่ Node และคำสั่งของ Node                          | การรันระยะไกลระดับผู้ปฏิบัติการบนอุปกรณ์ที่จับคู่ | "การควบคุมอุปกรณ์ระยะไกลควรถูกมองเป็นการเข้าถึงของผู้ใช้ที่ไม่เชื่อถือได้โดยค่าเริ่มต้น" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | นโยบาย opt-in สำหรับการลงทะเบียน node บนเครือข่ายที่เชื่อถือได้ | "allowlist ที่ปิดไว้โดยค่าเริ่มต้นคือช่องโหว่การจับคู่อัตโนมัติโดยอัตโนมัติ" |

## สิ่งที่ไม่ถือเป็นช่องโหว่โดยการออกแบบ

<Accordion title="ผลการตรวจพบทั่วไปที่อยู่นอกขอบเขต">

รูปแบบเหล่านี้ถูกรายงานบ่อย และมักถูกปิดเป็น no-action เว้นแต่
จะมีการแสดงให้เห็นถึงการข้ามขอบเขตจริง:

- chain ที่อาศัยเพียง prompt injection โดยไม่มีการข้ามนโยบาย การยืนยันตัวตน หรือ sandbox
- ข้ออ้างที่ตั้งอยู่บนสมมติฐานว่ามีการทำงานแบบหลายผู้เช่าที่เป็นปฏิปักษ์กันบนโฮสต์หรือคอนฟิกร่วมกันหนึ่งชุด
- ข้ออ้างที่จัดให้เส้นทางการอ่านปกติของผู้ปฏิบัติการ (เช่น
  `sessions.list` / `sessions.preview` / `chat.history`) เป็น
  IDOR ในการตั้งค่า shared-gateway
- ผลการตรวจพบในการติดตั้งแบบ localhost-only (เช่น HSTS บน
  gateway ที่ใช้ loopback เท่านั้น)
- ผลการตรวจพบลายเซ็น inbound webhook ของ Discord สำหรับเส้นทางขาเข้าที่ไม่มีอยู่
  ใน repo นี้
- รายงานที่ถือว่า metadata ของการจับคู่ node เป็นชั้นอนุมัติต่อคำสั่งที่ซ่อนอยู่ชั้นที่สองสำหรับ `system.run`,
  ทั้งที่ขอบเขตการรันจริงยังคงเป็นนโยบายคำสั่ง node แบบส่วนกลางของ gateway บวกกับ exec
  approvals ของ node เอง
- รายงานที่ถือว่า `gateway.nodes.pairing.autoApproveCidrs` ที่ตั้งค่าไว้เป็น
  ช่องโหว่โดยตัวมันเอง การตั้งค่านี้ปิดไว้เป็นค่าเริ่มต้น ต้องมี
  รายการ CIDR/IP ที่กำหนดอย่างชัดเจน ใช้ได้เฉพาะกับการจับคู่ `role: node` ครั้งแรกที่ไม่มี requested scopes,
  และไม่อนุมัติ operator/browser/Control UI,
  WebChat, การอัปเกรด role, การอัปเกรด scope, การเปลี่ยน metadata,
  การเปลี่ยน public-key หรือเส้นทาง trusted-proxy header ของ loopback บนโฮสต์เดียวกันโดยอัตโนมัติ
- ผลการตรวจพบแบบ "ไม่มีการอนุญาตต่อผู้ใช้" ที่ปฏิบัติต่อ `sessionKey` ราวกับเป็น
  auth token

</Accordion>

## baseline ที่ทำให้แข็งแรงใน 60 วินาที

ใช้ baseline นี้ก่อน แล้วค่อยเปิดใช้เครื่องมืออีกครั้งแบบเลือกเฉพาะต่อเอเจนต์ที่เชื่อถือได้:

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

การตั้งค่านี้จะทำให้ Gateway ใช้ได้เฉพาะในเครื่อง, แยก DM และปิดเครื่องมือ control-plane/runtime โดยค่าเริ่มต้น

## กฎแบบเร็วสำหรับกล่องข้อความที่แชร์ร่วมกัน

หากมีมากกว่าหนึ่งคนที่สามารถส่ง DM ถึงบอตของคุณได้:

- ตั้งค่า `session.dmScope: "per-channel-peer"` (หรือ `"per-account-channel-peer"` สำหรับช่องทางแบบหลายบัญชี)
- คง `dmPolicy: "pairing"` หรือ allowlists ที่เข้มงวดไว้
- อย่ารวม DM แบบแชร์ร่วมกับการเข้าถึงเครื่องมือแบบกว้าง
- สิ่งนี้ช่วยทำ hardening สำหรับกล่องข้อความที่ร่วมมือกัน/แชร์ร่วมกัน แต่ไม่ได้ออกแบบมาเป็นการแยก co-tenant แบบต้านทานผู้โจมตีเมื่อผู้ใช้แชร์สิทธิ์เขียนโฮสต์/คอนฟิกร่วมกัน

## โมเดลการมองเห็นบริบท

OpenClaw แยกสองแนวคิดออกจากกัน:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`dmPolicy`, `groupPolicy`, allowlists, mention gates)
- **การมองเห็นบริบท**: บริบทเสริมใดถูก inject เข้าไปในอินพุตของโมเดล (เนื้อหาคำตอบ, ข้อความอ้างอิง, ประวัติเธรด, metadata ที่ถูกส่งต่อ)

Allowlists ควบคุมการทริกเกอร์และการอนุญาตคำสั่ง ส่วนการตั้งค่า `contextVisibility` ควบคุมว่าบริบทเสริม (คำตอบที่อ้างอิง, root ของเธรด, ประวัติที่ดึงมา) จะถูกกรองอย่างไร:

- `contextVisibility: "all"` (ค่าเริ่มต้น) จะเก็บบริบทเสริมตามที่ได้รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บคำตอบอ้างอิงที่ชัดเจนไว้หนึ่งรายการ

ตั้งค่า `contextVisibility` ได้ต่อช่องทางหรือแต่ละห้อง/บทสนทนา ดู [แชตกลุ่ม](/th/channels/groups#context-visibility-and-allowlists) สำหรับรายละเอียดการตั้งค่า

แนวทางการประเมินคำแนะนำด้านความปลอดภัย:

- ข้ออ้างที่เพียงแสดงว่า "โมเดลสามารถเห็นข้อความอ้างอิงหรือข้อความย้อนหลังจากผู้ส่งที่ไม่อยู่ใน allowlist" เป็นผลการทำ hardening ที่แก้ได้ด้วย `contextVisibility` ไม่ใช่การข้ามขอบเขตการยืนยันตัวตนหรือ sandbox โดยตัวมันเอง
- เพื่อให้มีผลกระทบด้านความปลอดภัย รายงานยังคงต้องแสดงให้เห็นถึงการข้ามขอบเขตความเชื่อถือ (การยืนยันตัวตน, นโยบาย, sandbox, การอนุมัติ หรือขอบเขตอื่นที่มีการบันทึกไว้)

## สิ่งที่ audit ตรวจสอบ (ระดับสูง)

- **การเข้าถึงขาเข้า** (นโยบาย DM, นโยบายกลุ่ม, allowlists): คนแปลกหน้าสามารถทริกเกอร์บอตได้หรือไม่?
- **รัศมีผลกระทบของเครื่องมือ** (เครื่องมือ elevated + ห้องแบบเปิด): prompt injection สามารถลุกลามเป็นการกระทำกับ shell/ไฟล์/เครือข่ายได้หรือไม่?
- **การคลาดเคลื่อนของการอนุมัติ Exec** (`security=full`, `autoAllowSkills`, allowlists ของ interpreter ที่ไม่มี `strictInlineEval`): guardrails ของ host-exec ยังทำงานอย่างที่คุณเข้าใจอยู่หรือไม่?
  - `security="full"` เป็นคำเตือนเชิงท่าทีโดยรวม ไม่ใช่หลักฐานของบั๊ก นี่คือค่าเริ่มต้นที่เลือกไว้สำหรับการตั้งค่าแบบผู้ช่วยส่วนตัวที่เชื่อถือได้; ทำให้เข้มงวดขึ้นเฉพาะเมื่อโมเดลภัยคุกคามของคุณต้องการการอนุมัติหรือ guardrails แบบ allowlist
- **การเปิดเผยเครือข่าย** (Gateway bind/auth, Tailscale Serve/Funnel, auth tokens ที่อ่อนแอ/สั้น)
- **การเปิดเผย browser control** (remote nodes, relay ports, remote CDP endpoints)
- **สุขอนามัยของดิสก์ในเครื่อง** (permissions, symlinks, config includes, พาธของ “synced folder”)
- **Plugins** (plugins โหลดโดยไม่มี allowlist แบบชัดเจน)
- **policy drift/misconfig** (มีการกำหนดค่า sandbox docker settings แต่ปิด sandbox mode อยู่; รูปแบบ `gateway.nodes.denyCommands` ที่ไม่มีผลเพราะการจับคู่ตรงกับชื่อคำสั่งเท่านั้นแบบ exact (เช่น `system.run`) และไม่ตรวจข้อความ shell; รายการ `gateway.nodes.allowCommands` ที่อันตราย; `tools.profile="minimal"` ส่วนกลางถูก override ด้วย profiles ต่อเอเจนต์; เครื่องมือที่ Plugin เป็นเจ้าของเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน)
- **runtime expectation drift** (เช่น สมมติว่า implicit exec ยังหมายถึง `sandbox` ทั้งที่ตอนนี้ค่าเริ่มต้นของ `tools.exec.host` คือ `auto`, หรือกำหนด `tools.exec.host="sandbox"` อย่างชัดเจนทั้งที่ sandbox mode ปิดอยู่)
- **สุขอนามัยของโมเดล** (เตือนเมื่อโมเดลที่กำหนดค่าดูเป็นแบบ legacy; ไม่ใช่การบล็อกแบบเข้มงวด)

หากคุณรันด้วย `--deep` OpenClaw จะพยายาม probe Gateway แบบสดอย่างพยายามเต็มที่ด้วย

## แผนผังการจัดเก็บข้อมูลรับรอง

ใช้ส่วนนี้เมื่อกำลังตรวจสอบสิทธิ์เข้าถึงหรือตัดสินใจว่าจะสำรองข้อมูลอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; symlinks จะถูกปฏิเสธ)
- **Discord bot token**: config/env หรือ SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **auth profiles ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ของความลับแบบ file-backed (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`

## รายการตรวจสอบ security audit

เมื่อ audit แสดงผลการตรวจพบ ให้ปฏิบัติตามลำดับความสำคัญนี้:

1. **ทุกอย่างที่เป็น “open” + เปิดใช้เครื่องมือ**: ล็อก DM/กลุ่มก่อน (pairing/allowlists) แล้วจึงทำให้นโยบายเครื่องมือ/sandboxing เข้มงวดขึ้น
2. **การเปิดเผยเครือข่ายสาธารณะ** (bind กับ LAN, Funnel, ไม่มี auth): แก้ไขทันที
3. **การเปิดเผย browser control ระยะไกล**: ให้ปฏิบัติต่อมันเสมือนเป็นสิทธิ์ของผู้ปฏิบัติการ (tailnet-only, จับคู่ nodes อย่างตั้งใจ, หลีกเลี่ยงการเปิดเผยสู่สาธารณะ)
4. **Permissions**: ตรวจให้แน่ใจว่า state/config/credentials/auth ไม่สามารถอ่านได้โดย group/world
5. **Plugins**: โหลดเฉพาะสิ่งที่คุณเชื่อถืออย่างชัดเจนเท่านั้น
6. **การเลือกโมเดล**: ควรใช้โมเดลสมัยใหม่ที่แข็งแรงต่อคำสั่งสำหรับบอตที่มีเครื่องมือ

## อภิธานศัพท์ของ security audit

แต่ละผลการตรวจพบของ audit จะมีคีย์ `checkId` แบบมีโครงสร้าง (เช่น
`gateway.bind_no_auth` หรือ `tools.exec.security_full_configured`) คลาสความรุนแรงระดับ critical ที่พบบ่อย:

- `fs.*` — permissions ของระบบไฟล์สำหรับ state, config, credentials, auth profiles
- `gateway.*` — bind mode, auth, Tailscale, Control UI, trusted-proxy setup
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — hardening แยกตามพื้นผิว
- `plugins.*`, `skills.*` — supply chain ของ plugin/skill และผลการสแกน
- `security.exposure.*` — การตรวจสอบแบบข้ามส่วนที่นโยบายการเข้าถึงมาบรรจบกับรัศมีผลกระทบของเครื่องมือ

ดูแค็ตตาล็อกแบบเต็มพร้อมระดับความรุนแรง คีย์สำหรับการแก้ไข และการรองรับ auto-fix ได้ที่
[Security audit checks](/th/gateway/security/audit-checks)

## Control UI ผ่าน HTTP

Control UI ต้องใช้ **secure context** (HTTPS หรือ localhost) เพื่อสร้างอัตลักษณ์อุปกรณ์
`gateway.controlUi.allowInsecureAuth` เป็นสวิตช์ความเข้ากันได้ในเครื่อง:

- บน localhost มันอนุญาตให้ยืนยันตัวตนของ Control UI ได้โดยไม่มีอัตลักษณ์อุปกรณ์ เมื่อหน้าเว็บ
  ถูกโหลดผ่าน HTTP ที่ไม่ปลอดภัย
- มันไม่ได้ข้ามการตรวจสอบ pairing
- มันไม่ได้ผ่อนคลายข้อกำหนดเรื่องอัตลักษณ์อุปกรณ์สำหรับการเข้าถึงระยะไกล (ที่ไม่ใช่ localhost)

ควรใช้ HTTPS (Tailscale Serve) หรือเปิด UI ที่ `127.0.0.1`

สำหรับกรณี break-glass เท่านั้น `gateway.controlUi.dangerouslyDisableDeviceAuth`
จะปิดการตรวจสอบอัตลักษณ์อุปกรณ์ทั้งหมด นี่เป็นการลดระดับความปลอดภัยอย่างรุนแรง;
ควรปิดไว้ เว้นแต่คุณกำลังดีบักอยู่จริง ๆ และสามารถย้อนกลับได้อย่างรวดเร็ว

แยกจากแฟล็กอันตรายเหล่านั้น `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
สามารถยอมรับเซสชัน Control UI แบบ **operator** ได้โดยไม่มีอัตลักษณ์อุปกรณ์ นี่คือ
พฤติกรรมของโหมด auth ที่ตั้งใจไว้ ไม่ใช่ทางลัดของ `allowInsecureAuth` และยังคง
ไม่ขยายไปยังเซสชัน Control UI แบบ node-role

`openclaw security audit` จะเตือนเมื่อการตั้งค่านี้ถูกเปิดใช้

## สรุปแฟล็กที่ไม่ปลอดภัยหรืออันตราย

`openclaw security audit` จะยก `config.insecure_or_dangerous_flags` เมื่อ
มีการเปิดใช้สวิตช์ดีบักที่ไม่ปลอดภัย/อันตรายที่รู้จัก ควรปล่อยให้ค่าเหล่านี้ไม่ถูกตั้งใน
production

<AccordionGroup>
  <Accordion title="แฟล็กที่ audit ติดตามอยู่ในปัจจุบัน">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`
  </Accordion>

  <Accordion title="คีย์ `dangerous*` / `dangerously*` ทั้งหมดในสคีมาคอนฟิก">
    Control UI และ browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    การจับคู่ชื่อของช่องทาง (ทั้งช่องทางที่มากับระบบและ Plugin; มีได้ต่อ
    `accounts.<accountId>` ด้วยเมื่อเกี่ยวข้อง):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (ช่องทาง Plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (ช่องทาง Plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (ช่องทาง Plugin)

    การเปิดเผยเครือข่าย:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (รวมถึงต่อบัญชี)

    Sandbox Docker (ค่าเริ่มต้น + ต่อเอเจนต์):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## การกำหนดค่า reverse proxy

หากคุณรัน Gateway หลัง reverse proxy (nginx, Caddy, Traefik เป็นต้น) ให้กำหนดค่า
`gateway.trustedProxies` เพื่อให้จัดการ forwarded-client IP ได้อย่างถูกต้อง

เมื่อ Gateway ตรวจพบ proxy headers จากที่อยู่ซึ่ง **ไม่** อยู่ใน `trustedProxies` มันจะ **ไม่** ถือว่าการเชื่อมต่อเป็นไคลเอนต์ในเครื่อง หากปิดใช้งาน gateway auth การเชื่อมต่อเหล่านั้นจะถูกปฏิเสธ วิธีนี้ช่วยป้องกันการข้ามการยืนยันตัวตนที่อาจเกิดขึ้นเมื่อการเชื่อมต่อผ่าน proxy ดูเหมือนมาจาก localhost และได้รับความเชื่อถือโดยอัตโนมัติ

`gateway.trustedProxies` ยังถูกใช้โดย `gateway.auth.mode: "trusted-proxy"` ด้วย แต่โหมด auth นั้นเข้มงวดกว่า:

- trusted-proxy auth **fail closed สำหรับ proxies ที่มาจาก loopback**
- reverse proxies แบบ loopback บนโฮสต์เดียวกันยังสามารถใช้ `gateway.trustedProxies` เพื่อตรวจจับไคลเอนต์ในเครื่องและจัดการ forwarded IP ได้
- สำหรับ reverse proxies แบบ loopback บนโฮสต์เดียวกัน ให้ใช้ token/password auth แทน `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP ของ reverse proxy
  # ไม่บังคับ ค่าเริ่มต้น false
  # เปิดใช้เฉพาะเมื่อ proxy ของคุณไม่สามารถให้ X-Forwarded-For ได้
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

เมื่อกำหนดค่า `trustedProxies` แล้ว Gateway จะใช้ `X-Forwarded-For` ในการระบุ client IP โดยจะละเว้น `X-Real-IP` เป็นค่าเริ่มต้น เว้นแต่จะตั้งค่า `gateway.allowRealIpFallback: true` อย่างชัดเจน

trusted proxy headers ไม่ได้ทำให้การจับคู่อุปกรณ์ node กลายเป็นสิ่งที่เชื่อถือได้โดยอัตโนมัติ
`gateway.nodes.pairing.autoApproveCidrs` เป็นนโยบายของผู้ปฏิบัติการอีกตัวหนึ่งที่ปิดไว้
เป็นค่าเริ่มต้น แม้จะเปิดใช้งานแล้ว เส้นทาง trusted-proxy header ที่มาจาก loopback
ก็จะถูกตัดออกจาก node auto-approval เพราะผู้เรียกในเครื่องสามารถปลอมแปลง
headers เหล่านั้นได้

พฤติกรรมที่ดีของ reverse proxy (เขียนทับ forwarding headers ที่รับเข้ามา):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

พฤติกรรมที่ไม่ดีของ reverse proxy (append/เก็บ forwarding headers ที่ไม่เชื่อถือได้ไว้):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## หมายเหตุเรื่อง HSTS และ origin

- OpenClaw gateway เน้น local/loopback เป็นอันดับแรก หากคุณทำ TLS termination ที่ reverse proxy ให้ตั้ง HSTS บนโดเมน HTTPS ฝั่ง proxy นั้น
- หาก gateway เป็นผู้ทำ HTTPS termination เอง คุณสามารถตั้ง `gateway.http.securityHeaders.strictTransportSecurity` เพื่อปล่อย HSTS header จากการตอบกลับของ OpenClaw ได้
- แนวทางการติดตั้งใช้งานโดยละเอียดอยู่ใน [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts)
- สำหรับการติดตั้งใช้งาน Control UI ที่ไม่ใช่ loopback โดยค่าเริ่มต้นจำเป็นต้องมี `gateway.controlUi.allowedOrigins`
- `gateway.controlUi.allowedOrigins: ["*"]` เป็นนโยบาย browser-origin แบบอนุญาตทั้งหมดโดยชัดเจน ไม่ใช่ค่าเริ่มต้นที่ผ่านการ harden แล้ว ควรหลีกเลี่ยงนอกการทดสอบในเครื่องที่ควบคุมอย่างเข้มงวด
- ความล้มเหลวในการยืนยันตัวตนจาก browser-origin บน loopback ยังคงถูกจำกัดอัตราแม้จะเปิดใช้
  loopback exemption ทั่วไปไว้ แต่คีย์ lockout จะผูกต่อค่า `Origin`
  ที่ normalize แล้ว แทนที่จะใช้ bucket localhost ร่วมกันหนึ่งชุด
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด Host-header origin fallback; ให้ถือว่าเป็นนโยบายอันตรายที่ผู้ปฏิบัติการเลือกใช้
- ให้ปฏิบัติต่อ DNS rebinding และพฤติกรรม proxy-host header เป็นประเด็น hardening ของการติดตั้งใช้งาน; ควรทำให้ `trustedProxies` แคบ และหลีกเลี่ยงการเปิดเผย gateway โดยตรงสู่สาธารณะอินเทอร์เน็ต

## บันทึกเซสชันในเครื่องถูกเก็บไว้บนดิสก์

OpenClaw จัดเก็บ transcript ของเซสชันไว้บนดิสก์ภายใต้ `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
สิ่งนี้จำเป็นต่อความต่อเนื่องของเซสชันและ (แบบไม่บังคับ) การทำดัชนีหน่วยความจำของเซสชัน แต่ก็หมายความว่า
**โปรเซส/ผู้ใช้ใดก็ตามที่เข้าถึงระบบไฟล์ได้สามารถอ่านบันทึกเหล่านั้นได้** ให้ถือว่าการเข้าถึงดิสก์คือขอบเขต
ความเชื่อถือ และล็อก permissions ของ `~/.openclaw` ให้แน่นหนา (ดูส่วน audit ด้านล่าง) หากคุณต้องการ
การแยกที่แข็งแรงกว่าระหว่างเอเจนต์ ให้รันภายใต้ OS users แยกกันหรือโฮสต์แยกกัน

## การรันของ Node (`system.run`)

หากมีการจับคู่ macOS node ไว้ Gateway สามารถเรียก `system.run` บน node นั้นได้ นี่คือ **การรันโค้ดจากระยะไกล** บน Mac:

- ต้องมีการจับคู่ Node (การอนุมัติ + token)
- การจับคู่ Gateway node ไม่ใช่พื้นผิวการอนุมัติต่อคำสั่ง มันใช้สร้างอัตลักษณ์/ความเชื่อถือของ node และการออก token
- Gateway ใช้นโยบายคำสั่ง node แบบ coarse ระดับส่วนกลางผ่าน `gateway.nodes.allowCommands` / `denyCommands`
- ควบคุมบน Mac ผ่าน **Settings → Exec approvals** (`security` + `ask` + allowlist)
- นโยบาย `system.run` ต่อ Node คือไฟล์ exec approvals ของ node เอง (`exec.approvals.node.*`) ซึ่งอาจเข้มงวดหรือผ่อนปรนมากกว่านโยบาย command-ID ระดับส่วนกลางของ gateway
- Node ที่รันด้วย `security="full"` และ `ask="off"` กำลังปฏิบัติตามโมเดลผู้ปฏิบัติการที่เชื่อถือได้ตามค่าเริ่มต้น ให้ถือว่านี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่การติดตั้งใช้งานของคุณจะกำหนดชัดเจนว่าต้องมีท่าทีการอนุมัติหรือ allowlist ที่เข้มงวดกว่า
- โหมดการอนุมัติจะผูกกับบริบทคำขอที่ตรงกันทุกประการ และเมื่อเป็นไปได้จะผูกกับ operand ของสคริปต์/ไฟล์ท้องถิ่นที่เป็นรูปธรรมหนึ่งรายการ หาก OpenClaw ไม่สามารถระบุไฟล์ท้องถิ่นโดยตรงได้อย่างแน่ชัดเพียงหนึ่งรายการสำหรับคำสั่ง interpreter/runtime การรันที่ต้องมีการอนุมัติจะถูกปฏิเสธ แทนที่จะอ้างว่าครอบคลุมเชิงความหมายอย่างสมบูรณ์
- สำหรับ `host=node` การรันที่มีการอนุมัติรองรับจะจัดเก็บ `systemRunPlan` ที่เตรียมแบบ canonical ไว้ด้วย
  การส่งต่อที่ได้รับอนุมัติในภายหลังจะใช้แผนที่เก็บไว้นั้นซ้ำ และ gateway
  จะปฏิเสธการแก้ไข command/cwd/session context ของผู้เรียกหลังจาก
  สร้างคำขออนุมัติแล้ว
- หากคุณไม่ต้องการการรันระยะไกล ให้ตั้งค่า security เป็น **deny** และลบการจับคู่ node สำหรับ Mac เครื่องนั้น

ความแตกต่างนี้สำคัญต่อการประเมิน:

- node ที่จับคู่แล้วเชื่อมต่อใหม่พร้อมประกาศรายการคำสั่งที่ต่างออกไป ไม่ถือเป็นช่องโหว่โดยตัวมันเอง หากนโยบาย global ของ Gateway และ exec approvals ในเครื่องของ node ยังบังคับใช้ขอบเขตการรันจริงอยู่
- รายงานที่ปฏิบัติต่อ metadata ของการจับคู่ node ราวกับเป็นชั้นอนุมัติต่อคำสั่งแบบซ่อนอีกชั้น มักเป็นความสับสนด้านนโยบาย/UX มากกว่าการข้ามขอบเขตความปลอดภัย

## Skills แบบไดนามิก (watcher / remote nodes)

OpenClaw สามารถรีเฟรชรายการ Skills กลางเซสชันได้:

- **Skills watcher**: การเปลี่ยนแปลงใน `SKILL.md` สามารถอัปเดต snapshot ของ Skills ในเทิร์นถัดไปของเอเจนต์
- **Remote nodes**: การเชื่อมต่อ macOS node สามารถทำให้ Skills ที่ใช้ได้เฉพาะบน macOS มีสิทธิ์ใช้งานได้ (อิงจากการ probe ไบนารี)

ให้ถือว่าโฟลเดอร์ของ skill เป็น **โค้ดที่เชื่อถือได้** และจำกัดผู้ที่สามารถแก้ไขได้

## โมเดลภัยคุกคาม

ผู้ช่วย AI ของคุณสามารถ:

- รันคำสั่ง shell ตามอำเภอใจ
- อ่าน/เขียนไฟล์
- เข้าถึงบริการเครือข่าย
- ส่งข้อความหาใครก็ได้ (หากคุณให้สิทธิ์ WhatsApp แก่มัน)

คนที่ส่งข้อความหาคุณสามารถ:

- พยายามหลอกให้ AI ของคุณทำสิ่งที่ไม่ดี
- ใช้วิศวกรรมสังคมเพื่อเข้าถึงข้อมูลของคุณ
- สอดส่องหารายละเอียดโครงสร้างพื้นฐาน

## แนวคิดหลัก: ควบคุมการเข้าถึงก่อนความฉลาด

ความล้มเหลวส่วนใหญ่ที่นี่ไม่ใช่การโจมตีซับซ้อน — แต่มักเป็น “มีคนส่งข้อความหาบอต แล้วบอตก็ทำตามที่เขาขอ”

จุดยืนของ OpenClaw:

- **ตัวตนมาก่อน:** ตัดสินใจก่อนว่าใครคุยกับบอตได้ (DM pairing / allowlists / “open” แบบชัดเจน)
- **ขอบเขตถัดมา:** ตัดสินใจว่าบอตได้รับอนุญาตให้กระทำที่ใด (group allowlists + mention gating, tools, sandboxing, device permissions)
- **โมเดลไว้ท้ายสุด:** สมมติว่าโมเดลสามารถถูกชักจูงได้; ออกแบบให้การชักจูงนั้นมีรัศมีผลกระทบจำกัด

## โมเดลการอนุญาตคำสั่ง

Slash commands และ directives จะได้รับการยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น การอนุญาตได้มาจาก
channel allowlists/pairing บวกกับ `commands.useAccessGroups` (ดู [Configuration](/th/gateway/configuration)
และ [Slash commands](/th/tools/slash-commands)) หาก channel allowlist ว่างหรือมี `"*"`,
คำสั่งจะถือว่าเปิดสำหรับช่องทางนั้นโดยปริยาย

`/exec` เป็นเพียงความสะดวกแบบใช้เฉพาะในเซสชันสำหรับผู้ปฏิบัติการที่ได้รับอนุญาต มัน **ไม่** เขียนคอนฟิกหรือ
เปลี่ยนเซสชันอื่น

## ความเสี่ยงของเครื่องมือ control plane

มีเครื่องมือในตัว 2 ตัวที่สามารถเปลี่ยนแปลง control plane แบบถาวรได้:

- `gateway` สามารถตรวจสอบคอนฟิกด้วย `config.schema.lookup` / `config.get` และสามารถเปลี่ยนแปลงแบบถาวรด้วย `config.apply`, `config.patch` และ `update.run`
- `cron` สามารถสร้างงานตามกำหนดเวลาที่ทำงานต่อไปได้แม้แชต/งานต้นทางจะจบแล้ว

เครื่องมือ runtime `gateway` แบบ owner-only ยังคงปฏิเสธการเขียนทับ
`tools.exec.ask` หรือ `tools.exec.security`; alias แบบเดิมของ `tools.bash.*` จะถูก
normalize ไปยังเส้นทาง exec ที่ได้รับการปกป้องเดียวกันก่อนการเขียน
การแก้ไข `gateway config.apply` และ `gateway config.patch` ที่ขับเคลื่อนโดยเอเจนต์จะ
fail-closed โดยค่าเริ่มต้น: มีเพียงชุดแคบ ๆ ของเส้นทาง prompt, model และ mention-gating
เท่านั้นที่เอเจนต์ปรับได้ ดังนั้นต้นไม้คอนฟิกที่มีความละเอียดอ่อนใหม่จึงถูกปกป้อง
เว้นแต่จะถูกเพิ่มลงใน allowlist โดยเจตนา

สำหรับเอเจนต์/พื้นผิวใดก็ตามที่จัดการเนื้อหาที่ไม่เชื่อถือได้ ให้ปฏิเสธเครื่องมือเหล่านี้เป็นค่าเริ่มต้น:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` จะบล็อกเฉพาะการกระทำ restart เท่านั้น มันไม่ได้ปิดการทำงานของ `gateway` สำหรับการกระทำ config/update

## Plugins

Plugins รัน **ในโปรเซสเดียวกัน** กับ Gateway ให้ถือว่าพวกมันเป็นโค้ดที่เชื่อถือได้:

- ติดตั้งเฉพาะ Plugins จากแหล่งที่คุณเชื่อถือ
- ควรใช้ `plugins.allow` แบบ allowlists อย่างชัดเจน
- ตรวจสอบคอนฟิกของ Plugin ก่อนเปิดใช้
- รีสตาร์ต Gateway หลังเปลี่ยนแปลง Plugin
- หากคุณติดตั้งหรืออัปเดต Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`) ให้ปฏิบัติต่อมันเหมือนการรันโค้ดที่ไม่เชื่อถือ:
  - เส้นทางการติดตั้งคือไดเรกทอรีต่อ Plugin ภายใต้ plugin install root ที่กำลังใช้งาน
  - OpenClaw รันการสแกนโค้ดอันตรายในตัวก่อนการติดตั้ง/อัปเดต ผลการตรวจพบระดับ `critical` จะถูกบล็อกโดยค่าเริ่มต้น
  - OpenClaw ใช้ `npm pack` แล้วรัน `npm install --omit=dev` ในไดเรกทอรีนั้น (npm lifecycle scripts สามารถรันโค้ดระหว่างการติดตั้งได้)
  - ควรระบุเวอร์ชันแบบตรึงแน่นอน (`@scope/pkg@1.2.3`) และตรวจสอบโค้ดที่แตกออกบนดิสก์ก่อนเปิดใช้
  - `--dangerously-force-unsafe-install` ใช้เฉพาะกรณี break-glass สำหรับ false positives จากการสแกนในตัวระหว่างโฟลว์ install/update ของ Plugin เท่านั้น มันไม่ได้ข้ามการบล็อกตามนโยบายของ hook `before_install` ของ Plugin และไม่ได้ข้ามความล้มเหลวจากการสแกน
  - การติดตั้ง dependency ของ Skills ที่รองรับโดย Gateway ใช้การแยก dangerous/suspicious แบบเดียวกัน: ผลการตรวจพบระดับ `critical` ในตัวจะถูกบล็อก เว้นแต่ผู้เรียกจะตั้ง `dangerouslyForceUnsafeInstall` อย่างชัดเจน ส่วนผลการตรวจพบที่ suspicious ยังคงเป็นเพียงคำเตือน `openclaw skills install` ยังคงเป็นโฟลว์แยกต่างหากสำหรับการดาวน์โหลด/ติดตั้ง Skills จาก ClawHub

รายละเอียด: [Plugins](/th/tools/plugin)

## โมเดลการเข้าถึง DM: pairing, allowlist, open, disabled

ทุกช่องทางที่รองรับ DM ในปัจจุบันรองรับนโยบาย DM (`dmPolicy` หรือ `*.dm.policy`) ที่ควบคุม DM ขาเข้า **ก่อน** ประมวลผลข้อความ:

- `pairing` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบสั้น และบอตจะเพิกเฉยต่อข้อความของพวกเขาจนกว่าจะได้รับการอนุมัติ รหัสจะหมดอายุภายใน 1 ชั่วโมง; การส่ง DM ซ้ำจะไม่ส่งรหัสใหม่ซ้ำจนกว่าจะมีการสร้างคำขอใหม่ คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง** โดยค่าเริ่มต้น
- `allowlist`: ผู้ส่งที่ไม่รู้จักจะถูกบล็อก (ไม่มี handshake สำหรับ pairing)
- `open`: อนุญาตให้ใครก็ได้ส่ง DM ได้ (สาธารณะ) **ต้อง** ให้ channel allowlist มี `"*"` รวมอยู่ด้วย (เป็นการ opt-in แบบชัดเจน)
- `disabled`: เพิกเฉยต่อ DM ขาเข้าทั้งหมด

อนุมัติผ่าน CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

รายละเอียด + ไฟล์บนดิสก์: [Pairing](/th/channels/pairing)

## การแยกเซสชันของ DM (โหมดหลายผู้ใช้)

โดยค่าเริ่มต้น OpenClaw จะกำหนดเส้นทาง **DM ทั้งหมดเข้าสู่เซสชันหลัก** เพื่อให้ผู้ช่วยของคุณมีความต่อเนื่องข้ามอุปกรณ์และช่องทางต่าง ๆ หากมี **หลายคน**
ที่สามารถส่ง DM ถึงบอตได้ (DM แบบ open หรือ allowlist ที่มีหลายคน) ให้พิจารณาแยกเซสชันของ DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

วิธีนี้ช่วยป้องกันการรั่วไหลของบริบทข้ามผู้ใช้ ขณะที่ยังคงแยกแชตกลุ่มออกจากกัน

นี่คือขอบเขตของบริบทการส่งข้อความ ไม่ใช่ขอบเขตผู้ดูแลโฮสต์ หากผู้ใช้เป็นปฏิปักษ์กันและแชร์โฮสต์/คอนฟิก Gateway เดียวกัน ให้รัน gateways แยกกันต่อขอบเขตความเชื่อถือแทน

### โหมด DM แบบปลอดภัย (แนะนำ)

ให้ถือว่าสไนเป็ตข้างต้นคือ **โหมด DM แบบปลอดภัย**:

- ค่าเริ่มต้น: `session.dmScope: "main"` (DM ทั้งหมดแชร์เซสชันเดียวเพื่อความต่อเนื่อง)
- ค่าเริ่มต้นของ local CLI onboarding: จะเขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า (และคงค่าที่ตั้งไว้อย่างชัดเจนเดิมไว้)
- โหมด DM แบบปลอดภัย: `session.dmScope: "per-channel-peer"` (แต่ละคู่ channel+sender จะได้บริบท DM ที่แยกจากกัน)
- การแยก peer ข้ามช่องทาง: `session.dmScope: "per-peer"` (แต่ละผู้ส่งจะมีหนึ่งเซสชันข้ามทุกช่องทางประเภทเดียวกัน)

หากคุณรันหลายบัญชีบนช่องทางเดียวกัน ให้ใช้ `per-account-channel-peer` แทน หากบุคคลเดียวกันติดต่อคุณมาจากหลายช่องทาง ให้ใช้ `session.identityLinks` เพื่อรวมเซสชัน DM เหล่านั้นเข้าเป็นตัวตน canonical เดียว ดู [Session Management](/th/concepts/session) และ [Configuration](/th/gateway/configuration)

## Allowlists สำหรับ DM และกลุ่ม

OpenClaw มีสองชั้นแยกกันสำหรับ “ใครสามารถทริกเกอร์ฉันได้?”:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; แบบเดิม: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ใครได้รับอนุญาตให้คุยกับบอตใน direct messages
  - เมื่อ `dmPolicy="pairing"` การอนุมัติจะถูกเขียนไปยัง pairing allowlist store ที่ผูกกับบัญชีภายใต้ `~/.openclaw/credentials/` (`<channel>-allowFrom.json` สำหรับบัญชีค่าเริ่มต้น, `<channel>-<accountId>-allowFrom.json` สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น) แล้ว merge กับ config allowlists
- **Group allowlist** (เฉพาะช่องทาง): กลุ่ม/ช่องทาง/guild ใดที่บอตจะยอมรับข้อความจากอย่างสิ้นเชิง
  - รูปแบบที่พบบ่อย:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ค่าเริ่มต้นต่อกลุ่ม เช่น `requireMention`; เมื่อมีการตั้งค่านี้ มันยังทำหน้าที่เป็น group allowlist ด้วย (ใส่ `"*"` เพื่อคงพฤติกรรม allow-all)
    - `groupPolicy="allowlist"` + `groupAllowFrom`: จำกัดว่าใครสามารถทริกเกอร์บอต _ภายใน_ เซสชันของกลุ่ม (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists ต่อพื้นผิว + ค่าเริ่มต้นของการกล่าวถึง
  - การตรวจสอบกลุ่มจะรันตามลำดับนี้: `groupPolicy`/group allowlists ก่อน แล้วค่อย mention/reply activation
  - การตอบกลับข้อความของบอต (implicit mention) **จะไม่** ข้าม allowlists ของผู้ส่ง เช่น `groupAllowFrom`
  - **หมายเหตุด้านความปลอดภัย:** ให้ถือว่า `dmPolicy="open"` และ `groupPolicy="open"` เป็นการตั้งค่าทางเลือกสุดท้าย ควรแทบไม่ใช้เลย; ควรใช้ pairing + allowlists เว้นแต่คุณจะเชื่อถือสมาชิกทุกคนในห้องนั้นอย่างเต็มที่

รายละเอียด: [Configuration](/th/gateway/configuration) และ [Groups](/th/channels/groups)

## Prompt injection (คืออะไร และทำไมจึงสำคัญ)

Prompt injection คือเมื่อผู้โจมตีสร้างข้อความที่ชักจูงโมเดลให้ทำสิ่งที่ไม่ปลอดภัย (“ignore your instructions”, “dump your filesystem”, “follow this link and run commands” เป็นต้น)

แม้จะมี system prompts ที่แข็งแรง **prompt injection ก็ยังไม่ใช่ปัญหาที่ถูกแก้แล้ว** system prompt guardrails เป็นเพียงแนวทางแบบนุ่มนวลเท่านั้น; การบังคับใช้อย่างแข็งเกิดจากนโยบายเครื่องมือ, การอนุมัติ Exec, sandboxing และ channel allowlists (และผู้ปฏิบัติการสามารถปิดสิ่งเหล่านี้ได้โดยการออกแบบ) สิ่งที่ช่วยได้ในทางปฏิบัติคือ:

- ควรล็อก DM ขาเข้าให้แน่นหนา (pairing/allowlists)
- ควรใช้ mention gating ในกลุ่ม; หลีกเลี่ยงบอตแบบ “always-on” ในห้องสาธารณะ
- ให้ถือว่าลิงก์ ไฟล์แนบ และคำสั่งที่วางเข้ามาเป็นสิ่งที่เป็นปฏิปักษ์โดยค่าเริ่มต้น
- รันการใช้เครื่องมือที่มีความละเอียดอ่อนใน sandbox; เก็บความลับให้อยู่นอกระบบไฟล์ที่เอเจนต์เข้าถึงได้
- หมายเหตุ: sandboxing เป็นแบบ opt-in หากปิด sandbox mode อยู่ `host=auto` แบบ implicit จะ resolve ไปยังโฮสต์ gateway ส่วน `host=sandbox` แบบชัดเจนจะ fail closed เพราะไม่มี sandbox runtime ให้ใช้ ตั้งค่า `host=gateway` หากคุณต้องการให้พฤติกรรมนั้นเป็นสิ่งที่ระบุชัดในคอนฟิก
- จำกัดเครื่องมือความเสี่ยงสูง (`exec`, `browser`, `web_fetch`, `web_search`) ให้กับเอเจนต์ที่เชื่อถือได้หรือ allowlists แบบชัดเจน
- หากคุณทำ allowlist ให้ interpreter (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`) ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline eval ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- การวิเคราะห์ shell approval ยังปฏิเสธรูปแบบ POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) ภายใน **unquoted heredocs** ด้วย ดังนั้นเนื้อหา heredoc ที่อยู่ใน allowlist จะไม่สามารถแอบส่ง shell expansion ผ่านการตรวจสอบ allowlist ในฐานะข้อความธรรมดาได้ ให้ใส่เครื่องหมายคำพูดรอบ heredoc terminator (เช่น `<<'EOF'`) เพื่อเลือกใช้ความหมายแบบ literal body; unquoted heredocs ที่จะเกิด variable expansion จะถูกปฏิเสธ
- **การเลือกโมเดลมีความสำคัญ:** โมเดลรุ่นเก่า/เล็ก/legacy มีความทนทานต่อ prompt injection และการใช้เครื่องมือผิดวัตถุประสงค์ต่ำกว่าอย่างมีนัยสำคัญ สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแรงต่อคำสั่งและดีที่สุดเท่าที่มี

สัญญาณเตือนที่ควรถือว่าไม่น่าเชื่อถือ:

- “อ่านไฟล์/URL นี้แล้วทำตามที่มันบอกทุกอย่าง”
- “เพิกเฉยต่อ system prompt หรือกฎความปลอดภัยของคุณ”
- “เปิดเผยคำสั่งที่ซ่อนอยู่หรือผลลัพธ์ของเครื่องมือของคุณ”
- “วางเนื้อหาทั้งหมดของ ~/.openclaw หรือบันทึกล็อกของคุณ”

## การล้าง special token ของเนื้อหาภายนอก

OpenClaw จะตัด literal ของ special token ที่พบบ่อยใน chat-template ของ self-hosted LLM ออกจากเนื้อหาภายนอกและ metadata ที่ถูกห่อหุ้มก่อนที่จะไปถึงโมเดล ตระกูล marker ที่ครอบคลุมได้แก่โทเค็นบทบาท/เทิร์นของ Qwen/ChatML, Llama, Gemma, Mistral, Phi และ GPT-OSS

เหตุผล:

- backends แบบ OpenAI-compatible ที่ครอบ self-hosted models บางตัวอาจเก็บ special tokens ที่ปรากฏในข้อความของผู้ใช้ไว้ แทนที่จะปกปิดมัน ผู้โจมตีที่สามารถเขียนลงในเนื้อหาภายนอกขาเข้า (หน้าเว็บที่ดึงมา, เนื้อหาอีเมล, เอาต์พุตจากเครื่องมืออ่านไฟล์) จึงอาจฉีดขอบเขตบทบาท `assistant` หรือ `system` ปลอมและหลุดจาก guardrails ของการห่อเนื้อหาได้
- การล้างนี้เกิดที่ชั้นการห่อเนื้อหาภายนอก จึงใช้ได้สม่ำเสมอทั้งกับเครื่องมือ fetch/read และเนื้อหาขาเข้าจากช่องทาง แทนที่จะผูกกับ provider รายตัว
- คำตอบขาออกของโมเดลมีตัวล้างแยกอีกตัวอยู่แล้ว ซึ่งตัด scaffolding ที่รั่วไหล เช่น `<tool_call>`, `<function_calls>` และสิ่งที่คล้ายกันออกจากคำตอบที่ผู้ใช้เห็น ตัวล้างเนื้อหาภายนอกคือตัวคู่กันในฝั่งขาเข้า

สิ่งนี้ไม่ได้แทนที่ hardening อื่น ๆ ในหน้านี้ — `dmPolicy`, allowlists, exec approvals, sandboxing และ `contextVisibility` ยังคงทำงานหลัก มันเพียงปิดช่องทางข้ามระดับ tokenizer เฉพาะอย่างหนึ่งสำหรับ self-hosted stacks ที่ส่งข้อความของผู้ใช้ต่อไปพร้อม special tokens เดิม

## แฟล็กสำหรับข้ามการป้องกันเนื้อหาภายนอกที่ไม่ปลอดภัย

OpenClaw มีแฟล็กข้ามอย่างชัดเจนที่ปิดการห่อเนื้อหาภายนอกเพื่อความปลอดภัย:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- ฟิลด์ payload ของ Cron `allowUnsafeExternalContent`

คำแนะนำ:

- ควรปล่อยให้ unset/false ใน production
- เปิดใช้ชั่วคราวเฉพาะเพื่อการดีบักที่มีขอบเขตแคบมาก
- หากเปิดใช้ ให้แยกเอเจนต์นั้นออก (sandbox + เครื่องมือน้อยที่สุด + namespace ของเซสชันเฉพาะ)

หมายเหตุด้านความเสี่ยงของ hooks:

- payload ของ hook เป็นเนื้อหาที่ไม่น่าเชื่อถือ แม้ว่าการส่งมาจะมาจากระบบที่คุณควบคุมเองก็ตาม (เนื้อหาจากเมล/เอกสาร/เว็บอาจมี prompt injection)
- การใช้โมเดลระดับอ่อนเพิ่มความเสี่ยงนี้ สำหรับระบบอัตโนมัติที่ขับเคลื่อนด้วย hooks ควรใช้โมเดลระดับที่แข็งแรงและทันสมัย พร้อมทั้งใช้นโยบายเครื่องมือที่เข้มงวด (`tools.profile: "messaging"` หรือเข้มงวดกว่า) รวมถึง sandboxing เมื่อเป็นไปได้

### Prompt injection ไม่ได้ต้องอาศัย DM สาธารณะ

แม้จะมี **เพียงคุณเท่านั้น** ที่สามารถส่งข้อความถึงบอต Prompt injection ก็ยังเกิดขึ้นได้ผ่าน
**เนื้อหาที่ไม่น่าเชื่อถือ** ใด ๆ ที่บอตอ่าน (ผลการค้นหา/ดึงเว็บ, หน้า browser,
อีเมล, เอกสาร, ไฟล์แนบ, logs/code ที่วางเข้ามา) กล่าวอีกอย่างคือ: ผู้ส่งไม่ใช่
พื้นผิวภัยคุกคามเพียงอย่างเดียว; **ตัวเนื้อหาเอง** ก็สามารถพกคำสั่งเชิงปฏิปักษ์มาได้

เมื่อเปิดใช้เครื่องมือ ความเสี่ยงทั่วไปคือการดึงบริบทออกไปหรือกระตุ้น
การเรียกใช้เครื่องมือ ลดรัศมีผลกระทบได้โดย:

- ใช้ **reader agent** แบบอ่านอย่างเดียวหรือปิดเครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
  แล้วค่อยส่งสรุปให้เอเจนต์หลักของคุณ
- ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ เว้นแต่จำเป็น
- สำหรับอินพุต URL ของ OpenResponses (`input_file` / `input_image`) ให้ตั้งค่า
  `gateway.http.endpoints.responses.files.urlAllowlist` และ
  `gateway.http.endpoints.responses.images.urlAllowlist` ให้แคบ และคง `maxUrlParts` ให้ต่ำ
  allowlists ที่ว่างจะถือว่า unset; ใช้ `files.allowUrl: false` / `images.allowUrl: false`
  หากคุณต้องการปิดการดึง URL ทั้งหมด
- สำหรับอินพุตไฟล์ของ OpenResponses ข้อความ `input_file` ที่ถูกถอดรหัสแล้วยังคงถูก inject เป็น
  **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** อย่าถือว่าข้อความจากไฟล์เชื่อถือได้เพียงเพราะ
  Gateway ถอดรหัสมันในเครื่อง เส้นทางที่ inject ยังคงพก boundary markers แบบชัดเจน
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` พร้อม metadata `Source: External`
  แม้ว่าเส้นทางนี้จะไม่แสดงแบนเนอร์ `SECURITY NOTICE:` ที่ยาวกว่า
- การห่อแบบใช้ marker เดียวกันนี้ยังถูกใช้เมื่อความเข้าใจสื่อดึงข้อความ
  จากเอกสารแนบก่อนผนวกข้อความนั้นเข้ากับ media prompt
- เปิดใช้ sandboxing และ allowlists ของเครื่องมือแบบเข้มงวดสำหรับเอเจนต์ใดก็ตามที่แตะต้องอินพุตที่ไม่น่าเชื่อถือ
- เก็บความลับให้อยู่นอก prompts; ส่งผ่าน env/config บนโฮสต์ gateway แทน

### backends ของ self-hosted LLM

backends แบบ OpenAI-compatible ที่โฮสต์เอง เช่น vLLM, SGLang, TGI, LM Studio
หรือ tokenizer stacks แบบกำหนดเองของ Hugging Face อาจต่างจาก hosted providers ในวิธีที่
จัดการ special tokens ของ chat-template หาก backend tokenizes สตริง literal
เช่น `<|im_start|>`, `<|start_header_id|>` หรือ `<start_of_turn>` ให้เป็น
โทเค็นโครงสร้างของ chat-template ภายในเนื้อหาผู้ใช้ ข้อความที่ไม่น่าเชื่อถืออาจพยายาม
ปลอมขอบเขตบทบาทที่ระดับ tokenizer ได้

OpenClaw จะตัด literal ของ special token ที่พบบ่อยในแต่ละตระกูลโมเดลออกจาก
เนื้อหาภายนอกที่ถูกห่อหุ้มก่อนส่งไปยังโมเดล ควรเปิดใช้การห่อเนื้อหาภายนอกไว้ และควรใช้การตั้งค่า backend ที่แยกหรือ escape special
tokens ในเนื้อหาที่ผู้ใช้ส่งมาเมื่อมีให้ใช้งาน Hosted providers เช่น OpenAI
และ Anthropic มีการล้างฝั่งคำขอของตัวเองอยู่แล้ว

### ความแข็งแรงของโมเดล (หมายเหตุด้านความปลอดภัย)

ความต้านทานต่อ prompt injection **ไม่ได้เท่ากัน** ในทุกระดับของโมเดล โมเดลที่เล็กกว่า/ถูกกว่าโดยทั่วไปอ่อนแอต่อการใช้เครื่องมือผิดวัตถุประสงค์และการยึดครองคำสั่งมากกว่า โดยเฉพาะภายใต้พรอมป์เชิงปฏิปักษ์

<Warning>
สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือเอเจนต์ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ ความเสี่ยงจาก prompt injection กับโมเดลรุ่นเก่า/เล็กมักสูงเกินไป อย่ารันภาระงานเหล่านั้นบนโมเดลระดับอ่อน
</Warning>

คำแนะนำ:

- **ใช้โมเดลรุ่นล่าสุด ระดับดีที่สุด** สำหรับบอตใดก็ตามที่สามารถรันเครื่องมือหรือแตะต้องไฟล์/เครือข่ายได้
- **อย่าใช้โมเดลระดับเก่า/อ่อนกว่า/เล็กกว่า** สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือกล่องข้อความขาเข้าที่ไม่น่าเชื่อถือ; ความเสี่ยงจาก prompt injection สูงเกินไป
- หากจำเป็นต้องใช้โมเดลเล็ก **ให้ลดรัศมีผลกระทบ** (เครื่องมืออ่านอย่างเดียว, sandboxing ที่เข้มงวด, การเข้าถึงระบบไฟล์ให้น้อยที่สุด, allowlists ที่เข้มงวด)
- เมื่อรันโมเดลเล็ก **ให้เปิด sandboxing สำหรับทุกเซสชัน** และ **ปิด web_search/web_fetch/browser** เว้นแต่อินพุตจะถูกควบคุมอย่างแน่นหนา
- สำหรับผู้ช่วยส่วนตัวแบบแชตล้วนที่อินพุตเชื่อถือได้และไม่มีเครื่องมือ โมเดลเล็กมักเพียงพอ

## Reasoning และเอาต์พุตแบบ verbose ในกลุ่ม

`/reasoning`, `/verbose` และ `/trace` สามารถเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ หรือการวินิจฉัยของ Plugin ที่
ไม่ได้ตั้งใจให้เผยในช่องทางสาธารณะ ในการตั้งค่าแบบกลุ่ม ให้ถือว่าสิ่งเหล่านี้เป็น **ดีบักเท่านั้น**
และควรปิดไว้ เว้นแต่คุณจะต้องการจริง ๆ

คำแนะนำ:

- ควรปิด `/reasoning`, `/verbose` และ `/trace` ในห้องสาธารณะ
- หากจะเปิดใช้ ให้เปิดเฉพาะใน DM ที่เชื่อถือได้หรือห้องที่ควบคุมอย่างเข้มงวด
- จำไว้ว่า: เอาต์พุตแบบ verbose และ trace อาจรวม args ของเครื่องมือ, URLs, การวินิจฉัยของ Plugin และข้อมูลที่โมเดลเห็น

## ตัวอย่างการทำ hardening ของคอนฟิก

### สิทธิ์ของไฟล์

เก็บ config + state ให้เป็นส่วนตัวบนโฮสต์ gateway:

- `~/.openclaw/openclaw.json`: `600` (ผู้ใช้อ่าน/เขียนได้เท่านั้น)
- `~/.openclaw`: `700` (เฉพาะผู้ใช้)

`openclaw doctor` สามารถเตือนและเสนอให้ทำให้สิทธิ์เหล่านี้เข้มงวดขึ้นได้

### การเปิดเผยเครือข่าย (bind, port, firewall)

Gateway รวม **WebSocket + HTTP** ไว้บนพอร์ตเดียว:

- ค่าเริ่มต้น: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

พื้นผิว HTTP นี้รวมถึง Control UI และ canvas host:

- Control UI (SPA assets) (base path ค่าเริ่มต้น `/`)
- Canvas host: `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/` (HTML/JS ตามอำเภอใจ; ให้ถือเป็นเนื้อหาที่ไม่น่าเชื่อถือ)

หากคุณโหลดเนื้อหา canvas ใน browser ปกติ ให้ปฏิบัติต่อมันเหมือนหน้าเว็บที่ไม่น่าเชื่อถือทั่วไป:

- อย่าเปิดเผย canvas host ให้กับเครือข่าย/ผู้ใช้ที่ไม่น่าเชื่อถือ
- อย่าทำให้เนื้อหา canvas แชร์ origin เดียวกับพื้นผิวเว็บที่มีสิทธิ์สูง เว้นแต่คุณจะเข้าใจผลกระทบอย่างถ่องแท้

bind mode ควบคุมว่า Gateway ฟังอยู่ที่ใด:

- `gateway.bind: "loopback"` (ค่าเริ่มต้น): มีเพียงไคลเอนต์ในเครื่องเท่านั้นที่เชื่อมต่อได้
- bind ที่ไม่ใช่ loopback (`"lan"`, `"tailnet"`, `"custom"`) จะขยายพื้นผิวการโจมตี ใช้เฉพาะเมื่อมี gateway auth (shared token/password หรือ trusted proxy แบบ non-loopback ที่กำหนดค่าอย่างถูกต้อง) และมี firewall จริง

กฎแบบง่าย:

- ควรใช้ Tailscale Serve แทน LAN binds (Serve จะคง Gateway ไว้บน loopback และให้ Tailscale จัดการการเข้าถึง)
- หากจำเป็นต้อง bind กับ LAN ให้ firewall พอร์ตนั้นด้วย allowlist ของ source IP ที่แคบ; อย่า port-forward มันอย่างกว้างขวาง
- อย่าเปิดเผย Gateway แบบไม่ยืนยันตัวตนบน `0.0.0.0` เด็ดขาด

### การเปิดพอร์ต Docker กับ UFW

หากคุณรัน OpenClaw ด้วย Docker บน VPS โปรดจำไว้ว่าพอร์ตคอนเทนเนอร์ที่ถูก publish
(`-p HOST:CONTAINER` หรือ Compose `ports:`) จะถูกกำหนดเส้นทางผ่าน forwarding
chains ของ Docker ไม่ได้ผ่านเพียงกฎ `INPUT` ของโฮสต์เท่านั้น

เพื่อให้ทราฟฟิกของ Docker สอดคล้องกับนโยบายไฟร์วอลล์ของคุณ ให้บังคับใช้กฎใน
`DOCKER-USER` (chain นี้จะถูกประเมินก่อนกฎ accept ของ Docker เอง)
บน distro สมัยใหม่จำนวนมาก `iptables`/`ip6tables` ใช้ frontend แบบ `iptables-nft`
และยังคงใช้กฎเหล่านี้กับ backend ของ nftables

ตัวอย่าง allowlist ขั้นต่ำ (IPv4):

```bash
# /etc/ufw/after.rules (เพิ่มต่อท้ายเป็น section *filter แยกของตัวเอง)
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

IPv6 มี tables แยกต่างหาก ให้เพิ่มนโยบายที่ตรงกันใน `/etc/ufw/after6.rules` หาก
Docker IPv6 ถูกเปิดใช้งาน

หลีกเลี่ยงการ hardcode ชื่ออินเทอร์เฟซอย่าง `eth0` ในสไนเป็ตเอกสาร ชื่ออินเทอร์เฟซ
แตกต่างกันไปตามอิมเมจของ VPS (`ens3`, `enp*` เป็นต้น) และความไม่ตรงกันอาจทำให้
กฎ deny ของคุณถูกข้ามโดยไม่ตั้งใจ

การตรวจสอบแบบเร็วหลัง reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

พอร์ตภายนอกที่คาดหวังควรมีเฉพาะสิ่งที่คุณตั้งใจเปิดเผยเท่านั้น (สำหรับการตั้งค่าส่วนใหญ่:
SSH + พอร์ต reverse proxy ของคุณ)

### การค้นพบ mDNS/Bonjour

Gateway จะ broadcast การมีอยู่ของมันผ่าน mDNS (`_openclaw-gw._tcp` บนพอร์ต 5353) สำหรับการค้นพบอุปกรณ์ในเครื่อง ในโหมด full ระบบจะรวม TXT records ที่อาจเปิดเผยรายละเอียดการปฏิบัติการ:

- `cliPath`: พาธระบบไฟล์แบบเต็มไปยังไบนารี CLI (เปิดเผยชื่อผู้ใช้และตำแหน่งการติดตั้ง)
- `sshPort`: โฆษณาว่ามี SSH บนโฮสต์
- `displayName`, `lanHost`: ข้อมูลชื่อโฮสต์

**ข้อพิจารณาด้านความปลอดภัยเชิงปฏิบัติการ:** การเผยแพร่รายละเอียดโครงสร้างพื้นฐานทำให้การสอดแนมทำได้ง่ายขึ้นสำหรับทุกคนในเครือข่ายภายใน แม้แต่ข้อมูลที่ดู "ไม่เป็นอันตราย" เช่น พาธของไฟล์ระบบและการเปิดให้ใช้ SSH ก็ช่วยให้ผู้โจมตีทำแผนที่สภาพแวดล้อมของคุณได้

**คำแนะนำ:**

1. **โหมดขั้นต่ำ** (ค่าเริ่มต้น, แนะนำสำหรับ Gateway ที่เปิดเผยสู่ภายนอก): ละเว้นฟิลด์ที่มีความละเอียดอ่อนจากการประกาศ mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **ปิดใช้งานทั้งหมด** หากคุณไม่จำเป็นต้องใช้การค้นหาอุปกรณ์ในเครือข่ายภายใน:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **โหมดเต็ม** (ต้องเลือกใช้เอง): รวม `cliPath` + `sshPort` ในระเบียน TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **ตัวแปรสภาพแวดล้อม** (อีกทางเลือกหนึ่ง): ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=1` เพื่อปิดใช้งาน mDNS โดยไม่ต้องแก้ไขการตั้งค่า

ในโหมดขั้นต่ำ Gateway ยังคงประกาศข้อมูลเพียงพอสำหรับการค้นหาอุปกรณ์ (`role`, `gatewayPort`, `transport`) แต่จะไม่รวม `cliPath` และ `sshPort` แอปที่ต้องการข้อมูลพาธ CLI สามารถดึงข้อมูลดังกล่าวผ่านการเชื่อมต่อ WebSocket ที่มีการยืนยันตัวตนแทนได้

### ล็อกดาวน์ Gateway WebSocket (การยืนยันตัวตนแบบ local)

การยืนยันตัวตนของ Gateway **ถูกบังคับใช้โดยค่าเริ่มต้น** หากไม่มีการกำหนดเส้นทางการยืนยันตัวตนของ gateway ที่ถูกต้อง
Gateway จะปฏิเสธการเชื่อมต่อ WebSocket (ปิดแบบ fail-closed)

การตั้งค่าเริ่มต้นจะสร้างโทเค็นโดยค่าเริ่มต้น (แม้สำหรับ loopback) ดังนั้น
ไคลเอนต์ภายในเครื่องต้องยืนยันตัวตน

ตั้งค่าโทเค็นเพื่อให้ไคลเอนต์ WS **ทั้งหมด** ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor สามารถสร้างให้คุณได้: `openclaw doctor --generate-gateway-token`

หมายเหตุ: `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์
โดยตัวมันเอง **ไม่ได้** ปกป้องการเข้าถึง WS ภายในเครื่อง
เส้นทางการเรียกใช้แบบ local สามารถใช้ `gateway.remote.*` เป็นตัวสำรองได้ก็ต่อเมื่อยังไม่ได้ตั้งค่า `gateway.auth.*`
หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน
SecretRef แต่ไม่สามารถ resolve ได้ ระบบจะล้มเหลวแบบปิด (ไม่มีการใช้ remote fallback มาบดบังความล้มเหลว)
ทางเลือกเพิ่มเติม: ปักหมุด TLS ของ remote ด้วย `gateway.remote.tlsFingerprint` เมื่อใช้ `wss://`
`ws://` แบบข้อความล้วนอนุญาตเฉพาะ loopback โดยค่าเริ่มต้น สำหรับเส้นทาง
เครือข่ายส่วนตัวที่เชื่อถือได้ ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในโปรเซสของไคลเอนต์เป็น
มาตรการฉุกเฉิน การตั้งค่านี้ตั้งใจให้ใช้ผ่านสภาพแวดล้อมของโปรเซสเท่านั้น ไม่ใช่
คีย์การตั้งค่า `openclaw.json`
การจับคู่อุปกรณ์บนมือถือ และเส้นทาง gateway แบบกำหนดเองหรือสแกนบน Android มีข้อเข้มงวดยิ่งกว่า:
รองรับ cleartext สำหรับ loopback แต่สำหรับ private-LAN, link-local, `.local` และ
โฮสต์เนมที่ไม่มีจุด ต้องใช้ TLS เว้นแต่คุณจะเลือกใช้เส้นทาง cleartext สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้อย่างชัดเจน

การจับคู่อุปกรณ์ภายในเครื่อง:

- การจับคู่อุปกรณ์จะได้รับการอนุมัติอัตโนมัติสำหรับการเชื่อมต่อ local loopback โดยตรง เพื่อให้
  ไคลเอนต์บนโฮสต์เดียวกันใช้งานได้ราบรื่น
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local สำหรับ
  โฟลว์ helper แบบ shared-secret ที่เชื่อถือได้
- การเชื่อมต่อผ่าน tailnet และ LAN รวมถึงการ bind tailnet บนโฮสต์เดียวกัน จะถือเป็น
  remote สำหรับการจับคู่ และยังคงต้องได้รับการอนุมัติ
- หลักฐานจาก forwarded-header ในคำขอ loopback จะทำให้ไม่ถือเป็น
  ความเป็น local แบบ loopback การอนุมัติอัตโนมัติสำหรับ metadata-upgrade ถูกจำกัดขอบเขตอย่างเข้มงวด ดู
  [Gateway pairing](/th/gateway/pairing) สำหรับกฎทั้งสองส่วน

โหมดยืนยันตัวตน:

- `gateway.auth.mode: "token"`: โทเค็น bearer ที่ใช้ร่วมกัน (แนะนำสำหรับการตั้งค่าส่วนใหญ่)
- `gateway.auth.mode: "password"`: การยืนยันตัวตนด้วยรหัสผ่าน (แนะนำให้ตั้งค่าผ่าน env: `OPENCLAW_GATEWAY_PASSWORD`)
- `gateway.auth.mode: "trusted-proxy"`: เชื่อถือ reverse proxy ที่รับรู้ตัวตนเพื่อยืนยันตัวตนผู้ใช้และส่งข้อมูลตัวตนผ่าน header (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เช็กลิสต์การหมุนเวียนข้อมูลลับ (token/password):

1. สร้าง/ตั้งค่าค่าลับใหม่ (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_PASSWORD`)
2. รีสตาร์ต Gateway (หรือรีสตาร์ตแอป macOS หากแอปนั้นดูแล Gateway)
3. อัปเดตไคลเอนต์ remote ทั้งหมด (`gateway.remote.token` / `.password` บนเครื่องที่เรียกใช้ Gateway)
4. ตรวจสอบว่าคุณไม่สามารถเชื่อมต่อด้วยข้อมูลรับรองเดิมได้อีกต่อไป

### ส่วนหัวตัวตนของ Tailscale Serve

เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ค่าเริ่มต้นสำหรับ Serve) OpenClaw
จะยอมรับส่วนหัวตัวตนของ Tailscale Serve (`tailscale-user-login`) สำหรับการยืนยันตัวตนของ
Control UI/WebSocket OpenClaw จะตรวจสอบตัวตนโดย resolve
ที่อยู่ `x-forwarded-for` ผ่าน Tailscale daemon ภายในเครื่อง (`tailscale whois`)
แล้วจับคู่กับ header การทำงานนี้จะเกิดขึ้นเฉพาะกับคำขอที่มาถึง loopback
และมี `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host`
ตามที่ Tailscale แทรกเข้ามา
สำหรับเส้นทางการตรวจสอบตัวตนแบบ async นี้ ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกัน
จะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว
ดังนั้นการลองใหม่แบบไม่ถูกต้องพร้อมกันจาก Serve client เดียวกัน อาจทำให้ครั้งที่สอง
ถูกล็อกเอาต์ทันที แทนที่จะวิ่งแข่งผ่านไปเหมือนเป็นความไม่ตรงกันธรรมดาสองครั้ง
ปลายทาง HTTP API (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนด้วยส่วนหัวตัวตนของ Tailscale โดยยังคงเป็นไปตาม
โหมดยืนยันตัวตน HTTP ที่กำหนดไว้ของ gateway

หมายเหตุสำคัญเกี่ยวกับขอบเขต:

- การยืนยันตัวตน HTTP bearer ของ Gateway โดยผลแล้วคือสิทธิ์ผู้ปฏิบัติการแบบทั้งหมดหรือไม่มีเลย
- ให้ถือว่าข้อมูลรับรองที่สามารถเรียก `/v1/chat/completions`, `/v1/responses` หรือ `/api/channels/*` ได้ เป็นความลับของผู้ปฏิบัติการที่มีสิทธิ์เต็มรูปแบบสำหรับ gateway นั้น
- บนพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI การยืนยันตัวตน bearer แบบ shared-secret จะคืนค่าขอบเขตผู้ปฏิบัติการเริ่มต้นแบบเต็ม (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) และ semantics แบบ owner สำหรับ agent turns; ค่า `x-openclaw-scopes` ที่แคบกว่าจะไม่ลดสิทธิ์ในเส้นทาง shared-secret นี้
- semantics ของขอบเขตต่อคำขอบน HTTP จะมีผลเฉพาะเมื่อคำขอนั้นมาจากโหมดที่มีตัวตนกำกับ เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress
- ในโหมดที่มีตัวตนกำกับดังกล่าว หากละเว้น `x-openclaw-scopes` ระบบจะย้อนกลับไปใช้ชุดขอบเขตผู้ปฏิบัติการเริ่มต้นตามปกติ; ให้ส่ง header นี้อย่างชัดเจนเมื่อคุณต้องการชุดขอบเขตที่แคบกว่า
- `/tools/invoke` ใช้กฎ shared-secret เดียวกัน: token/password bearer auth จะถือเป็นสิทธิ์ผู้ปฏิบัติการเต็มรูปแบบเช่นกัน ขณะที่โหมดที่มีตัวตนกำกับยังคงเคารพขอบเขตที่ประกาศไว้
- อย่าแชร์ข้อมูลรับรองเหล่านี้กับผู้เรียกที่ไม่น่าเชื่อถือ; ให้แยก Gateway ตามขอบเขตความเชื่อถือจะดีกว่า

**สมมติฐานด้านความไว้วางใจ:** การยืนยันตัวตนของ Serve แบบไม่มีโทเค็น ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้
อย่าถือว่านี่คือการป้องกันจากโปรเซสบนโฮสต์เดียวกันที่เป็นอันตราย หากมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถือ
อาจรันอยู่บนโฮสต์ของ gateway ให้ปิด `gateway.auth.allowTailscale`
และบังคับใช้การยืนยันตัวตนแบบ shared-secret อย่างชัดเจนด้วย `gateway.auth.mode: "token"` หรือ
`"password"`

**กฎความปลอดภัย:** อย่าส่งต่อ headers เหล่านี้จาก reverse proxy ของคุณเอง หาก
คุณ terminate TLS หรือทำ proxy อยู่หน้าตัว gateway ให้ปิด
`gateway.auth.allowTailscale` และใช้การยืนยันตัวตนแบบ shared-secret (`gateway.auth.mode:
"token"` หรือ `"password"`) หรือ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
แทน

Trusted proxies:

- หากคุณ terminate TLS อยู่หน้าตัว Gateway ให้ตั้งค่า `gateway.trustedProxies` เป็น IP ของพร็อกซีของคุณ
- OpenClaw จะเชื่อถือ `x-forwarded-for` (หรือ `x-real-ip`) จาก IP เหล่านั้นเพื่อระบุ IP ของไคลเอนต์สำหรับการตรวจสอบการจับคู่แบบ local และการตรวจสอบ HTTP auth/local
- ตรวจสอบให้แน่ใจว่าพร็อกซีของคุณ **เขียนทับ** `x-forwarded-for` และบล็อกการเข้าถึงพอร์ต Gateway โดยตรง

ดู [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

### ควบคุมเบราว์เซอร์ผ่าน node host (แนะนำ)

หาก Gateway ของคุณเป็น remote แต่เบราว์เซอร์ทำงานอยู่บนอีกเครื่องหนึ่ง ให้รัน **node host**
บนเครื่องที่มีเบราว์เซอร์ แล้วให้ Gateway ทำ proxy การทำงานของเบราว์เซอร์ (ดู [Browser tool](/th/tools/browser))
ให้ถือว่าการจับคู่ node เทียบเท่ากับสิทธิ์ผู้ดูแลระบบ

รูปแบบที่แนะนำ:

- ให้ Gateway และ node host อยู่ใน tailnet เดียวกัน (Tailscale)
- จับคู่ node อย่างตั้งใจ; ปิดการกำหนดเส้นทาง browser proxy หากคุณไม่ต้องการใช้

ควรหลีกเลี่ยง:

- การเปิดเผยพอร์ต relay/control ผ่าน LAN หรืออินเทอร์เน็ตสาธารณะ
- Tailscale Funnel สำหรับปลายทางควบคุมเบราว์เซอร์ (การเปิดเผยต่อสาธารณะ)

### ความลับบนดิสก์

ให้ถือว่าทุกอย่างภายใต้ `~/.openclaw/` (หรือ `$OPENCLAW_STATE_DIR/`) อาจมีความลับหรือข้อมูลส่วนตัว:

- `openclaw.json`: การตั้งค่าอาจรวมโทเค็น (gateway, remote gateway), การตั้งค่าผู้ให้บริการ และ allowlist
- `credentials/**`: ข้อมูลรับรองของช่องทาง (ตัวอย่าง: ข้อมูลรับรอง WhatsApp), pairing allowlist, การนำเข้า OAuth แบบเดิม
- `agents/<agentId>/agent/auth-profiles.json`: คีย์ API, โปรไฟล์โทเค็น, โทเค็น OAuth และ `keyRef`/`tokenRef` แบบทางเลือก
- `secrets.json` (ไม่บังคับ): payload ความลับแบบไฟล์ที่ใช้โดยผู้ให้บริการ SecretRef แบบ `file` (`secrets.providers`)
- `agents/<agentId>/agent/auth.json`: ไฟล์ความเข้ากันได้แบบเดิม รายการ `api_key` แบบคงที่จะถูกล้างเมื่อพบ
- `agents/<agentId>/sessions/**`: ทรานสคริปต์ของเซสชัน (`*.jsonl`) + เมทาดาทาการกำหนดเส้นทาง (`sessions.json`) ที่อาจมีข้อความส่วนตัวและผลลัพธ์จากเครื่องมือ
- แพ็กเกจ Plugin ที่มาพร้อมระบบ: Plugin ที่ติดตั้งไว้ (รวมถึง `node_modules/` ของมัน)
- `sandboxes/**`: เวิร์กสเปซ sandbox ของเครื่องมือ; อาจสะสมสำเนาของไฟล์ที่คุณอ่าน/เขียนภายใน sandbox

คำแนะนำในการเสริมความปลอดภัย:

- กำหนดสิทธิ์ให้เข้มงวด (`700` สำหรับไดเรกทอรี, `600` สำหรับไฟล์)
- ใช้การเข้ารหัสดิสก์ทั้งลูกบนโฮสต์ gateway
- หากโฮสต์ถูกใช้งานร่วมกัน ให้ใช้บัญชีผู้ใช้ระบบปฏิบัติการเฉพาะสำหรับ Gateway

### ไฟล์ `.env` ของ workspace

OpenClaw โหลดไฟล์ `.env` ภายใน workspace สำหรับ agents และ tools แต่จะไม่อนุญาตให้ไฟล์เหล่านั้นเขียนทับการควบคุมรันไทม์ของ gateway แบบเงียบ ๆ

- คีย์ใดก็ตามที่ขึ้นต้นด้วย `OPENCLAW_*` จะถูกบล็อกจากไฟล์ `.env` ของ workspace ที่ไม่น่าเชื่อถือ
- การตั้งค่าปลายทางของช่องทางสำหรับ Matrix, Mattermost, IRC และ Synology Chat ก็ถูกบล็อกจากการเขียนทับผ่าน `.env` ของ workspace เช่นกัน ดังนั้น workspace ที่ถูกโคลนมาจะไม่สามารถเปลี่ยนเส้นทางทราฟฟิกของ connector ที่มาพร้อมระบบผ่านการตั้งค่าปลายทางภายในเครื่องได้ คีย์ env ของปลายทาง (เช่น `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) ต้องมาจากสภาพแวดล้อมของโปรเซส gateway หรือ `env.shellEnv` ไม่ใช่จาก `.env` ที่โหลดจาก workspace
- การบล็อกนี้เป็นแบบ fail-closed: ตัวแปรควบคุมรันไทม์ตัวใหม่ที่เพิ่มเข้ามาในรุ่นอนาคตจะไม่สามารถสืบทอดจาก `.env` ที่ถูกเช็กอินหรือถูกผู้โจมตีจัดเตรียมไว้ได้; คีย์นั้นจะถูกละเลยและ gateway จะคงค่าของตัวเองไว้
- ตัวแปรสภาพแวดล้อมของโปรเซส/ระบบปฏิบัติการที่เชื่อถือได้ (shell ของ gateway เอง, launchd/systemd unit, app bundle) ยังคงมีผล — ข้อจำกัดนี้มีผลเฉพาะกับการโหลดไฟล์ `.env`

เหตุผล: ไฟล์ `.env` ของ workspace มักอยู่ข้างโค้ด agent, ถูก commit โดยไม่ตั้งใจ หรือถูกเขียนโดย tools การบล็อก prefix `OPENCLAW_*` ทั้งหมดหมายความว่า หากมีการเพิ่มแฟล็ก `OPENCLAW_*` ใหม่ในภายหลัง ก็จะไม่มีวันถดถอยไปเป็นการสืบทอดแบบเงียบ ๆ จากสถานะของ workspace ได้

### บันทึกและทรานสคริปต์ (การปกปิดข้อมูลและระยะเวลาการเก็บรักษา)

บันทึกและทรานสคริปต์อาจทำให้ข้อมูลสำคัญรั่วไหลได้ แม้ว่าการควบคุมการเข้าถึงจะถูกต้องแล้วก็ตาม:

- บันทึกของ Gateway อาจมีสรุปของเครื่องมือ ข้อผิดพลาด และ URL
- ทรานสคริปต์ของเซสชันอาจมีความลับที่วางไว้ เนื้อหาไฟล์ เอาต์พุตคำสั่ง และลิงก์

คำแนะนำ:

- เปิดการปกปิดข้อมูลสำคัญในสรุปเครื่องมือไว้ (`logging.redactSensitive: "tools"`; ค่าเริ่มต้น)
- เพิ่มแพตเทิร์นที่กำหนดเองสำหรับสภาพแวดล้อมของคุณผ่าน `logging.redactPatterns` (โทเค็น, โฮสต์เนม, URL ภายใน)
- เมื่อต้องแชร์ข้อมูลวินิจฉัย ให้ใช้ `openclaw status --all` (วางได้เลย, ปกปิดความลับแล้ว) แทนบันทึกดิบ
- ลบทรานสคริปต์ของเซสชันเก่าและไฟล์บันทึกหากคุณไม่จำเป็นต้องเก็บไว้นาน

รายละเอียด: [Logging](/th/gateway/logging)

### DM: ใช้การจับคู่โดยค่าเริ่มต้น

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### กลุ่ม: บังคับให้ต้องมีการ mention ทุกที่

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

### แยกเบอร์โทรศัพท์ (WhatsApp, Signal, Telegram)

สำหรับช่องทางที่อิงหมายเลขโทรศัพท์ ให้พิจารณาใช้งาน AI ของคุณบนหมายเลขโทรศัพท์ที่แยกจากหมายเลขส่วนตัว:

- หมายเลขส่วนตัว: บทสนทนาของคุณยังคงเป็นส่วนตัว
- หมายเลขบอท: AI จัดการการสนทนาเหล่านี้ ภายใต้ขอบเขตที่เหมาะสม

### โหมดอ่านอย่างเดียว (ผ่าน sandbox และ tools)

คุณสามารถสร้างโปรไฟล์แบบอ่านอย่างเดียวได้โดยรวม:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (หรือ `"none"` หากไม่ต้องการให้เข้าถึง workspace)
- รายการ allow/deny ของ tools ที่บล็อก `write`, `edit`, `apply_patch`, `exec`, `process` เป็นต้น

ตัวเลือกการเสริมความปลอดภัยเพิ่มเติม:

- `tools.exec.applyPatch.workspaceOnly: true` (ค่าเริ่มต้น): ทำให้มั่นใจว่า `apply_patch` จะไม่สามารถเขียน/ลบนอกไดเรกทอรี workspace ได้ แม้จะปิด sandboxing อยู่ก็ตาม ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` แตะไฟล์นอก workspace จริง ๆ เท่านั้น
- `tools.fs.workspaceOnly: true` (ไม่บังคับ): จำกัดพาธของ `read`/`write`/`edit`/`apply_patch` และพาธการโหลดภาพอัตโนมัติของ native prompt ให้อยู่ภายในไดเรกทอรี workspace เท่านั้น (มีประโยชน์หากวันนี้คุณยังอนุญาต absolute paths และต้องการ guardrail เดียวที่ครอบคลุม)
- จำกัดรากของ filesystem ให้แคบ: หลีกเลี่ยงรากที่กว้างเกินไป เช่นโฮมไดเรกทอรีของคุณ สำหรับ workspaces/sandbox workspaces ของ agent รากที่กว้างเกินไปอาจเปิดให้เครื่องมือ filesystem เข้าถึงไฟล์ local ที่ละเอียดอ่อน (เช่น state/config ภายใต้ `~/.openclaw`)

### ค่าพื้นฐานที่ปลอดภัย (คัดลอก/วาง)

การตั้งค่า “ปลอดภัยโดยค่าเริ่มต้น” ชุดหนึ่งที่ทำให้ Gateway เป็นส่วนตัว บังคับให้ DM ต้องจับคู่ และหลีกเลี่ยงบอทกลุ่มที่ทำงานตลอดเวลา:

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

หากคุณต้องการให้การรันเครื่องมือ “ปลอดภัยกว่าโดยค่าเริ่มต้น” ด้วย ให้เพิ่ม sandbox + ปฏิเสธเครื่องมืออันตรายสำหรับ agent ที่ไม่ใช่ owner (ตัวอย่างอยู่ด้านล่างใน “โปรไฟล์การเข้าถึงต่อ agent”)

ค่าพื้นฐานในตัวสำหรับ agent turns ที่ขับเคลื่อนด้วยแชต: ผู้ส่งที่ไม่ใช่ owner จะไม่สามารถใช้ tools `cron` หรือ `gateway` ได้

## Sandboxing (แนะนำ)

เอกสารเฉพาะ: [Sandboxing](/th/gateway/sandboxing)

มีสองแนวทางที่ทำงานเสริมกัน:

- **รัน Gateway ทั้งหมดใน Docker** (ขอบเขตระดับ container): [Docker](/th/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, gateway อยู่บนโฮสต์ + tools ถูกแยกด้วย sandbox; Docker เป็น backend ค่าเริ่มต้น): [Sandboxing](/th/gateway/sandboxing)

หมายเหตุ: เพื่อป้องกันการเข้าถึงข้าม agent ให้คง `agents.defaults.sandbox.scope` ไว้ที่ `"agent"` (ค่าเริ่มต้น)
หรือ `"session"` หากต้องการการแยกต่อเซสชันที่เข้มงวดยิ่งขึ้น `scope: "shared"` จะใช้
container/workspace ร่วมกันหนึ่งชุด

นอกจากนี้ควรพิจารณาการเข้าถึง workspace ของ agent ภายใน sandbox ด้วย:

- `agents.defaults.sandbox.workspaceAccess: "none"` (ค่าเริ่มต้น) จะไม่อนุญาตให้เข้าถึง agent workspace; tools จะรันกับ sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` จะเมานต์ agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดการใช้ `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` จะเมานต์ agent workspace แบบอ่าน/เขียนที่ `/workspace`
- `sandbox.docker.binds` เพิ่มเติมจะถูกตรวจสอบกับ source paths ที่ผ่านการ normalize และ canonicalize แล้ว กลเม็ด symlink ของ parent และ alias ของโฮมแบบ canonical จะยังคง fail-closed หาก resolve ไปยังรากที่ถูกบล็อก เช่น `/etc`, `/var/run` หรือไดเรกทอรี credentials ภายใต้โฮมของระบบปฏิบัติการ

ข้อสำคัญ: `tools.elevated` คือช่องทางหลุดออกจาก baseline แบบ global ที่ทำให้รัน exec นอก sandbox ได้ effective host จะเป็น `gateway` โดยค่าเริ่มต้น หรือเป็น `node` เมื่อกำหนด exec target เป็น `node` จำกัด `tools.elevated.allowFrom` ให้แคบ และอย่าเปิดให้กับผู้ใช้ที่ไม่น่าเชื่อถือ คุณยังสามารถจำกัด elevated ราย agent เพิ่มเติมผ่าน `agents.list[].tools.elevated` ได้ ดู [Elevated Mode](/th/tools/elevated)

### Guardrail สำหรับการมอบหมายไปยัง sub-agent

หากคุณอนุญาต session tools ให้ถือว่าการรัน sub-agent ที่ถูกมอบหมายเป็นการตัดสินใจด้านขอบเขตอีกชั้นหนึ่ง:

- ปฏิเสธ `sessions_spawn` เว้นแต่ agent นั้นจำเป็นต้องมีการมอบหมายจริง ๆ
- จำกัด `agents.defaults.subagents.allowAgents` และ overrides ต่อ agent ใน `agents.list[].subagents.allowAgents` ให้เหลือเฉพาะ target agents ที่เชื่อถือได้และปลอดภัย
- สำหรับ workflow ใดก็ตามที่ต้องคง sandbox ไว้ ให้เรียก `sessions_spawn` ด้วย `sandbox: "require"` (ค่าเริ่มต้นคือ `inherit`)
- `sandbox: "require"` จะล้มเหลวทันทีเมื่อ runtime ของ child เป้าหมายไม่มี sandbox

## ความเสี่ยงของการควบคุมเบราว์เซอร์

การเปิดใช้การควบคุมเบราว์เซอร์ทำให้โมเดลสามารถควบคุมเบราว์เซอร์จริงได้
หากโปรไฟล์เบราว์เซอร์นั้นมีเซสชันที่ล็อกอินอยู่แล้ว โมเดลจะ
เข้าถึงบัญชีและข้อมูลเหล่านั้นได้ ให้ถือว่าโปรไฟล์เบราว์เซอร์เป็น **สถานะที่ละเอียดอ่อน**:

- ควรใช้โปรไฟล์เฉพาะสำหรับ agent (โปรไฟล์ `openclaw` ซึ่งเป็นค่าเริ่มต้น)
- หลีกเลี่ยงการชี้ agent ไปยังโปรไฟล์ใช้งานส่วนตัวประจำวันของคุณ
- ปิด host browser control สำหรับ agents ที่อยู่ใน sandbox เว้นแต่คุณจะเชื่อถือพวกมัน
- API ควบคุมเบราว์เซอร์แบบ loopback แบบ standalone รองรับเฉพาะ shared-secret auth
  (gateway token bearer auth หรือรหัสผ่านของ gateway) เท่านั้น ไม่รองรับ
  trusted-proxy หรือส่วนหัวตัวตนของ Tailscale Serve
- ให้ถือว่าการดาวน์โหลดของเบราว์เซอร์เป็นอินพุตที่ไม่น่าเชื่อถือ; ควรใช้ไดเรกทอรีดาวน์โหลดที่แยกออกมา
- หากเป็นไปได้ ให้ปิด browser sync/password managers ในโปรไฟล์ของ agent (ลด blast radius)
- สำหรับ gateway แบบ remote ให้ถือว่า “browser control” เทียบเท่ากับ “สิทธิ์ผู้ปฏิบัติการ” ต่อทุกสิ่งที่โปรไฟล์นั้นเข้าถึงได้
- ให้ Gateway และ node hosts อยู่ใน tailnet เท่านั้น; หลีกเลี่ยงการเปิดเผยพอร์ต browser control ไปยัง LAN หรืออินเทอร์เน็ตสาธารณะ
- ปิด browser proxy routing เมื่อคุณไม่จำเป็นต้องใช้ (`gateway.nodes.browser.mode="off"`)
- โหมด existing-session ของ Chrome MCP **ไม่ได้** “ปลอดภัยกว่า”; มันสามารถทำงานแทนคุณได้ในทุกสิ่งที่โปรไฟล์ Chrome บนโฮสต์นั้นเข้าถึงได้

### นโยบาย Browser SSRF (เข้มงวดโดยค่าเริ่มต้น)

นโยบายการนำทางของเบราว์เซอร์ใน OpenClaw เข้มงวดโดยค่าเริ่มต้น: ปลายทางแบบ private/internal จะยังถูกบล็อก เว้นแต่คุณจะเลือกอนุญาตอย่างชัดเจน

- ค่าเริ่มต้น: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่ได้ถูกตั้งค่าไว้ ดังนั้นการนำทางของเบราว์เซอร์จะยังบล็อกปลายทางแบบ private/internal/special-use
- alias แบบเดิม: `browser.ssrfPolicy.allowPrivateNetwork` ยังรองรับเพื่อความเข้ากันได้
- โหมด opt-in: ตั้งค่า `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพื่ออนุญาตปลายทางแบบ private/internal/special-use
- ในโหมดเข้มงวด ให้ใช้ `hostnameAllowlist` (แพตเทิร์นเช่น `*.example.com`) และ `allowedHostnames` (ข้อยกเว้นโฮสต์แบบตรงตัว รวมถึงชื่อที่ปกติถูกบล็อกอย่าง `localhost`) สำหรับข้อยกเว้นแบบชัดเจน
- การนำทางจะถูกตรวจสอบก่อนคำขอ และตรวจสอบซ้ำแบบ best-effort กับ URL `http(s)` สุดท้ายหลังการนำทาง เพื่อลดการ pivot ผ่าน redirect

ตัวอย่างนโยบายแบบเข้มงวด:

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

## โปรไฟล์การเข้าถึงต่อ agent (หลาย agent)

เมื่อใช้การกำหนดเส้นทางแบบหลาย agent แต่ละ agent สามารถมี sandbox + นโยบาย tools ของตัวเองได้:
ใช้สิ่งนี้เพื่อให้สิทธิ์ **เข้าถึงเต็มรูปแบบ**, **อ่านอย่างเดียว** หรือ **ไม่ให้เข้าถึง**
เป็นราย agent ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดทั้งหมด
และกฎลำดับความสำคัญ

กรณีใช้งานทั่วไป:

- agent ส่วนตัว: สิทธิ์เต็มรูปแบบ, ไม่มี sandbox
- agent สำหรับครอบครัว/งาน: sandboxed + tools แบบอ่านอย่างเดียว
- agent สาธารณะ: sandboxed + ไม่มี tools ด้าน filesystem/shell

### ตัวอย่าง: สิทธิ์เต็มรูปแบบ (ไม่มี sandbox)

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

### ตัวอย่าง: tools แบบอ่านอย่างเดียว + workspace แบบอ่านอย่างเดียว

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

### ตัวอย่าง: ไม่ให้เข้าถึง filesystem/shell (แต่อนุญาตการส่งข้อความผ่าน provider)

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
        // Session tools อาจเปิดเผยข้อมูลละเอียดอ่อนจากทรานสคริปต์ โดยค่าเริ่มต้น OpenClaw จำกัด tools เหล่านี้
        // ไว้ที่เซสชันปัจจุบัน + เซสชัน subagent ที่ spawn ออกมา แต่คุณสามารถจำกัดให้เข้มงวดยิ่งขึ้นได้หากจำเป็น
        // ดู `tools.sessions.visibility` ในเอกสารอ้างอิงการตั้งค่า
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

หาก AI ของคุณทำสิ่งที่ไม่พึงประสงค์:

### ควบคุมสถานการณ์

1. **หยุดมัน:** หยุดแอป macOS (หากแอปนั้นดูแล Gateway) หรือยุติโปรเซส `openclaw gateway` ของคุณ
2. **ปิดการเปิดเผย:** ตั้งค่า `gateway.bind: "loopback"` (หรือปิด Tailscale Funnel/Serve) จนกว่าคุณจะเข้าใจว่าเกิดอะไรขึ้น
3. **หยุดการเข้าถึง:** เปลี่ยน DM/กลุ่มที่มีความเสี่ยงเป็น `dmPolicy: "disabled"` / บังคับ mention และลบรายการ `"*"` แบบอนุญาตทั้งหมด หากก่อนหน้านี้คุณเคยตั้งไว้

### หมุนเวียนข้อมูลลับ (ให้ถือว่าถูกเจาะแล้วหากมีความลับรั่วไหล)

1. หมุนเวียน Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) และรีสตาร์ต
2. หมุนเวียนข้อมูลลับของไคลเอนต์ remote (`gateway.remote.token` / `.password`) บนทุกเครื่องที่สามารถเรียกใช้ Gateway ได้
3. หมุนเวียนข้อมูลรับรองของ provider/API (ข้อมูลรับรอง WhatsApp, โทเค็น Slack/Discord, คีย์ model/API ใน `auth-profiles.json` และค่า payload ความลับที่เข้ารหัสเมื่อมีการใช้งาน)

### ตรวจสอบ

1. ตรวจสอบบันทึกของ Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (หรือ `logging.file`)
2. ตรวจสอบทรานสคริปต์ที่เกี่ยวข้อง: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. ตรวจสอบการเปลี่ยนแปลงการตั้งค่าล่าสุด (ทุกอย่างที่อาจขยายการเข้าถึง: `gateway.bind`, `gateway.auth`, นโยบาย dm/group, `tools.elevated`, การเปลี่ยนแปลง Plugin)
4. รัน `openclaw security audit --deep` อีกครั้ง และยืนยันว่า critical findings ได้รับการแก้ไขแล้ว

### รวบรวมข้อมูลสำหรับรายงาน

- เวลาเกิดเหตุ, ระบบปฏิบัติการของโฮสต์ gateway + เวอร์ชัน OpenClaw
- ทรานสคริปต์ของเซสชัน + log tail สั้น ๆ (หลังจากปกปิดข้อมูลแล้ว)
- สิ่งที่ผู้โจมตีส่งมา + สิ่งที่ agent ทำ
- Gateway ถูกเปิดเผยออกไปนอก loopback หรือไม่ (LAN/Tailscale Funnel/Serve)

## การสแกนความลับด้วย detect-secrets

CI รัน pre-commit hook ของ `detect-secrets` ในงาน `secrets`
การ push ไปยัง `main` จะรันการสแกนทุกไฟล์เสมอ ส่วน pull request จะใช้
เส้นทางแบบเร็วสำหรับไฟล์ที่มีการเปลี่ยนแปลงเมื่อมี base commit ให้ใช้งาน และจะ fallback ไปสแกนทุกไฟล์
ในกรณีอื่น หากล้มเหลว แปลว่ามีผู้ต้องสงสัยรายใหม่ที่ยังไม่อยู่ใน baseline

### หาก CI ล้มเหลว

1. ทำซ้ำในเครื่อง:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ทำความเข้าใจกับเครื่องมือ:
   - `detect-secrets` ใน pre-commit จะรัน `detect-secrets-hook` ด้วย
     baseline และ excludes ของ repo
   - `detect-secrets audit` จะเปิดการตรวจสอบแบบโต้ตอบเพื่อทำเครื่องหมายแต่ละรายการใน baseline
     ว่าเป็นของจริงหรือ false positive
3. สำหรับความลับจริง: หมุนเวียน/ลบออก จากนั้นรันการสแกนใหม่เพื่ออัปเดต baseline
4. สำหรับ false positives: รันการ audit แบบโต้ตอบและทำเครื่องหมายว่าเป็น false:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. หากคุณต้องการ excludes ใหม่ ให้เพิ่มลงใน `.detect-secrets.cfg` และสร้าง
   baseline ใหม่ด้วยแฟลก `--exclude-files` / `--exclude-lines` ที่ตรงกัน (ไฟล์ config
   นี้มีไว้เพื่ออ้างอิงเท่านั้น; detect-secrets จะไม่อ่านมันโดยอัตโนมัติ)

commit `.secrets.baseline` ที่อัปเดตแล้ว เมื่อมันสะท้อนสถานะที่ต้องการ

## การรายงานประเด็นด้านความปลอดภัย

พบช่องโหว่ใน OpenClaw หรือไม่? โปรดรายงานอย่างรับผิดชอบ:

1. อีเมล: [security@openclaw.ai](mailto:security@openclaw.ai)
2. อย่าโพสต์สาธารณะจนกว่าจะได้รับการแก้ไข
3. เราจะให้เครดิตคุณ (เว้นแต่คุณต้องการไม่เปิดเผยตัวตน)
