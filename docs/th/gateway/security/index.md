---
read_when:
    - การเพิ่มฟีเจอร์ที่ขยายการเข้าถึงหรือการทำงานอัตโนมัติ
summary: ข้อควรพิจารณาด้านความปลอดภัยและแบบจำลองภัยคุกคามสำหรับการใช้งานเกตเวย์ AI ที่มีสิทธิ์เข้าถึงเชลล์
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-05-07T13:18:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8706977504b52a225c08deadeddb60ac6791933297637d41885d0b859ca28406
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **โมเดลความเชื่อถือของผู้ช่วยส่วนตัว** คำแนะนำนี้ถือว่ามีขอบเขตผู้ควบคุมที่เชื่อถือได้หนึ่งขอบเขตต่อ gateway (โมเดลผู้ใช้เดี่ยวแบบผู้ช่วยส่วนตัว)
  OpenClaw **ไม่ใช่** ขอบเขตความปลอดภัยแบบ multi-tenant ที่ทนต่อผู้ใช้ไม่ประสงค์ดีหลายรายที่ใช้ agent หรือ gateway เดียวร่วมกัน หากคุณต้องการการทำงานแบบความเชื่อถือผสมหรือมีผู้ใช้ไม่ประสงค์ดี ให้แยกขอบเขตความเชื่อถือ (gateway + ข้อมูลประจำตัวแยกกัน และควรเป็นผู้ใช้หรือโฮสต์ OS แยกกัน)
</Warning>

## กำหนดขอบเขตก่อน: โมเดลความปลอดภัยของผู้ช่วยส่วนตัว

คำแนะนำด้านความปลอดภัยของ OpenClaw ถือว่าเป็นการติดตั้งใช้งานแบบ **ผู้ช่วยส่วนตัว**: ขอบเขตผู้ควบคุมที่เชื่อถือได้หนึ่งขอบเขต และอาจมีหลาย agent

- สถานะความปลอดภัยที่รองรับ: ผู้ใช้/ขอบเขตความเชื่อถือหนึ่งรายต่อ gateway (ควรใช้ผู้ใช้ OS/โฮสต์/VPS หนึ่งชุดต่อขอบเขต)
- ไม่ใช่ขอบเขตความปลอดภัยที่รองรับ: gateway/agent ร่วมหนึ่งชุดที่ใช้โดยผู้ใช้ซึ่งไม่เชื่อถือกันหรือเป็นปรปักษ์ต่อกัน
- หากต้องมีการแยกผู้ใช้ไม่ประสงค์ดี ให้แยกตามขอบเขตความเชื่อถือ (gateway + ข้อมูลประจำตัวแยกกัน และควรเป็นผู้ใช้/โฮสต์ OS แยกกัน)
- หากผู้ใช้ที่ไม่น่าเชื่อถือหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้เครื่องมือหนึ่งตัวได้ ให้ถือว่าพวกเขาใช้สิทธิ์เครื่องมือที่มอบหมายชุดเดียวกันสำหรับ agent นั้นร่วมกัน

หน้านี้อธิบายการเสริมความปลอดภัย **ภายในโมเดลนั้น** ไม่ได้อ้างว่ามีการแยกแบบ multi-tenant ที่ทนต่อผู้ไม่ประสงค์ดีบน gateway ร่วมหนึ่งชุด

## ตรวจสอบอย่างรวดเร็ว: `openclaw security audit`

ดูเพิ่มเติม: [การตรวจสอบยืนยันอย่างเป็นทางการ (โมเดลความปลอดภัย)](/th/security/formal-verification)

เรียกใช้สิ่งนี้เป็นประจำ (โดยเฉพาะหลังเปลี่ยน config หรือเปิดเผยพื้นผิวเครือข่าย):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` ถูกตั้งใจให้มีขอบเขตแคบ: จะเปลี่ยนนโยบายกลุ่มที่เปิดทั่วไปให้เป็น allowlist, คืนค่า `logging.redactSensitive: "tools"`, รัดกุมสิทธิ์ของ state/config/include-file และใช้การรีเซ็ต ACL ของ Windows แทน POSIX `chmod` เมื่อรันบน Windows

คำสั่งนี้จะระบุ footgun ทั่วไป (การเปิดเผยการยืนยันตัวตนของ Gateway, การเปิดเผยการควบคุมเบราว์เซอร์, allowlist ที่ยกระดับสิทธิ์, สิทธิ์ระบบไฟล์, การอนุมัติ exec ที่ผ่อนปรน และการเปิดเผยเครื่องมือในช่องทางที่เปิดกว้าง)

OpenClaw เป็นทั้งผลิตภัณฑ์และการทดลอง: คุณกำลังเชื่อมพฤติกรรมของโมเดลชายขอบเข้ากับพื้นผิวการส่งข้อความจริงและเครื่องมือจริง **ไม่มีการตั้งค่าใดที่ “ปลอดภัยสมบูรณ์แบบ”** เป้าหมายคือการตั้งใจพิจารณาเกี่ยวกับ:

- ใครสามารถคุยกับ bot ของคุณได้
- bot ได้รับอนุญาตให้ดำเนินการที่ใด
- bot สามารถแตะต้องอะไรได้

เริ่มจากสิทธิ์ที่เล็กที่สุดซึ่งยังทำงานได้ แล้วค่อยขยายเมื่อคุณมั่นใจมากขึ้น

### การติดตั้งใช้งานและความเชื่อถือของโฮสต์

OpenClaw ถือว่าโฮสต์และขอบเขต config นั้นเชื่อถือได้:

- หากใครสามารถแก้ไข state/config ของโฮสต์ Gateway (`~/.openclaw` รวมถึง `openclaw.json`) ให้ถือว่าบุคคลนั้นเป็นผู้ควบคุมที่เชื่อถือได้
- การรัน Gateway หนึ่งชุดสำหรับผู้ควบคุมหลายรายที่ไม่เชื่อถือกันหรือเป็นปรปักษ์ต่อกัน **ไม่ใช่การตั้งค่าที่แนะนำ**
- สำหรับทีมที่มีความเชื่อถือผสม ให้แยกขอบเขตความเชื่อถือด้วย gateway แยกกัน (หรืออย่างน้อยผู้ใช้/โฮสต์ OS แยกกัน)
- ค่าเริ่มต้นที่แนะนำ: ผู้ใช้หนึ่งรายต่อเครื่อง/โฮสต์ (หรือ VPS), gateway หนึ่งชุดสำหรับผู้ใช้นั้น และ agent หนึ่งตัวหรือมากกว่าใน gateway นั้น
- ภายในอินสแตนซ์ Gateway หนึ่งชุด การเข้าถึงของผู้ควบคุมที่ยืนยันตัวตนแล้วคือบทบาท control-plane ที่เชื่อถือได้ ไม่ใช่บทบาท tenant ต่อผู้ใช้
- ตัวระบุเซสชัน (`sessionKey`, session IDs, labels) เป็นตัวเลือกเส้นทาง ไม่ใช่โทเค็นอนุญาต
- หากหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้เครื่องมือหนึ่งตัวได้ แต่ละคนสามารถกำกับชุดสิทธิ์เดียวกันนั้นได้ การแยกเซสชัน/หน่วยความจำรายผู้ใช้ช่วยเรื่องความเป็นส่วนตัว แต่ไม่ได้เปลี่ยน agent ร่วมให้เป็นการอนุญาตโฮสต์รายผู้ใช้

### การดำเนินการไฟล์ที่ปลอดภัย

OpenClaw ใช้ `@openclaw/fs-safe` สำหรับการเข้าถึงไฟล์ที่จำกัดด้วยราก, การเขียนแบบ atomic, การแตก archive, workspace ชั่วคราว และตัวช่วยไฟล์ลับ ค่าเริ่มต้นของ OpenClaw ปิดตัวช่วย POSIX Python แบบเลือกใช้ได้ของ fs-safe; ตั้ง `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` หรือ `require` เฉพาะเมื่อคุณต้องการการเสริมความแข็งแกร่งของการกลายพันธุ์แบบ fd-relative เพิ่มเติมและรองรับ runtime ของ Python ได้

รายละเอียด: [การดำเนินการไฟล์ที่ปลอดภัย](/th/gateway/security/secure-file-operations)

### เวิร์กสเปซ Slack ร่วม: ความเสี่ยงจริง

หาก “ทุกคนใน Slack สามารถส่งข้อความถึง bot ได้” ความเสี่ยงหลักคือสิทธิ์เครื่องมือที่มอบหมาย:

- ผู้ส่งที่ได้รับอนุญาตทุกคนสามารถชักนำให้เกิดการเรียกเครื่องมือ (`exec`, เบราว์เซอร์, เครื่องมือเครือข่าย/ไฟล์) ภายในนโยบายของ agent ได้
- การฉีด prompt/เนื้อหาจากผู้ส่งคนหนึ่งอาจทำให้เกิดการกระทำที่ส่งผลต่อ state อุปกรณ์ หรือผลลัพธ์ร่วม
- หาก agent ร่วมหนึ่งตัวมีข้อมูลประจำตัว/ไฟล์ที่ละเอียดอ่อน ผู้ส่งที่ได้รับอนุญาตทุกคนอาจสามารถขับให้เกิดการรั่วไหลผ่านการใช้เครื่องมือได้

ใช้ agent/gateway แยกกันพร้อมเครื่องมือน้อยที่สุดสำหรับเวิร์กโฟลว์ทีม; เก็บ agent ที่มีข้อมูลส่วนบุคคลไว้เป็นส่วนตัว

### agent ที่ใช้ร่วมกันในบริษัท: รูปแบบที่ยอมรับได้

รูปแบบนี้ยอมรับได้เมื่อทุกคนที่ใช้ agent นั้นอยู่ในขอบเขตความเชื่อถือเดียวกัน (เช่น ทีมบริษัทหนึ่งทีม) และ agent ถูกจำกัดขอบเขตไว้สำหรับธุรกิจอย่างเคร่งครัด

- รันบนเครื่อง/VM/container เฉพาะ
- ใช้ผู้ใช้ OS เฉพาะ + เบราว์เซอร์/profile/account เฉพาะสำหรับ runtime นั้น
- อย่าลงชื่อเข้าใช้ runtime นั้นด้วยบัญชี Apple/Google ส่วนตัว หรือ profile ของตัวจัดการรหัสผ่าน/เบราว์เซอร์ส่วนตัว

หากคุณผสมข้อมูลประจำตัวส่วนตัวและของบริษัทบน runtime เดียวกัน คุณจะทำให้การแยกหายไปและเพิ่มความเสี่ยงการเปิดเผยข้อมูลส่วนบุคคล

## แนวคิดความเชื่อถือของ Gateway และ node

ให้ถือว่า Gateway และ node เป็นโดเมนความเชื่อถือของผู้ควบคุมเดียวกัน โดยมีบทบาทต่างกัน:

- **Gateway** คือ control plane และพื้นผิวนโยบาย (`gateway.auth`, นโยบายเครื่องมือ, การกำหนดเส้นทาง)
- **Node** คือพื้นผิวการประมวลผลระยะไกลที่จับคู่กับ Gateway นั้น (คำสั่ง, การกระทำของอุปกรณ์, ความสามารถภายในโฮสต์)
- caller ที่ยืนยันตัวตนกับ Gateway แล้วจะถือว่าเชื่อถือได้ในขอบเขต Gateway หลังการจับคู่ การกระทำของ node จะถือว่าเป็นการกระทำของผู้ควบคุมที่เชื่อถือได้บน node นั้น
- ระดับขอบเขตของผู้ควบคุมและการตรวจสอบขณะอนุมัติสรุปไว้ใน
  [ขอบเขตผู้ควบคุม](/th/gateway/operator-scopes)
- ไคลเอนต์แบ็กเอนด์ loopback โดยตรงที่ยืนยันตัวตนด้วย token/password ของ gateway ร่วม สามารถทำ RPC control-plane ภายในได้โดยไม่ต้องแสดงตัวตนอุปกรณ์ของผู้ใช้ นี่ไม่ใช่การเลี่ยงการจับคู่ระยะไกลหรือเบราว์เซอร์: ไคลเอนต์เครือข่าย, ไคลเอนต์ node, ไคลเอนต์ device-token และตัวตนอุปกรณ์แบบชัดแจ้งยังคงผ่านการจับคู่และการบังคับใช้การอัปเกรดขอบเขต
- `sessionKey` คือการเลือกเส้นทาง/บริบท ไม่ใช่ auth รายผู้ใช้
- การอนุมัติ Exec (allowlist + ask) เป็น guardrail สำหรับเจตนาของผู้ควบคุม ไม่ใช่การแยกแบบ multi-tenant ที่ทนต่อผู้ไม่ประสงค์ดี
- ค่าเริ่มต้นของผลิตภัณฑ์ OpenClaw สำหรับการตั้งค่าผู้ควบคุมเดี่ยวที่เชื่อถือได้คืออนุญาต host exec บน `gateway`/`node` โดยไม่ต้องมี prompt ขออนุมัติ (`security="full"`, `ask="off"` เว้นแต่คุณจะรัดกุมเอง) ค่าเริ่มต้นนี้เป็น UX ที่ตั้งใจไว้ ไม่ใช่ช่องโหว่โดยตัวมันเอง
- การอนุมัติ Exec ผูกกับบริบทคำขอแบบตรงตัวและ operand ไฟล์ภายในเครื่องโดยตรงตาม best-effort; ไม่ได้จำลองเส้นทาง loader ของ runtime/interpreter ทุกแบบในเชิงความหมาย ใช้ sandboxing และการแยกโฮสต์สำหรับขอบเขตที่แข็งแรง

หากคุณต้องการการแยกผู้ใช้ไม่ประสงค์ดี ให้แยกขอบเขตความเชื่อถือตามผู้ใช้/โฮสต์ OS และรัน gateway แยกกัน

## เมทริกซ์ขอบเขตความเชื่อถือ

ใช้สิ่งนี้เป็นโมเดลด่วนเมื่อ triage ความเสี่ยง:

| ขอบเขตหรือการควบคุม                                       | ความหมาย                                     | การเข้าใจผิดที่พบบ่อย                                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | ยืนยันตัวตน caller ต่อ API ของ gateway             | “ต้องมีลายเซ็นรายข้อความในทุก frame จึงจะปลอดภัย”                    |
| `sessionKey`                                              | คีย์กำหนดเส้นทางสำหรับการเลือก context/session         | “Session key คือขอบเขต auth ของผู้ใช้”                                         |
| guardrail ของ prompt/เนื้อหา                                 | ลดความเสี่ยงการใช้โมเดลในทางที่ผิด                           | “prompt injection เพียงอย่างเดียวพิสูจน์ auth bypass”                                   |
| `canvas.eval` / browser evaluate                          | ความสามารถของผู้ควบคุมที่ตั้งใจให้มีเมื่อเปิดใช้      | “primitive JS eval ใดๆ เป็น vuln โดยอัตโนมัติในโมเดลความเชื่อถือนี้”           |
| เชลล์ `!` ของ TUI ภายในเครื่อง                                       | การประมวลผลภายในเครื่องที่ผู้ควบคุมทริกเกอร์อย่างชัดแจ้ง       | “คำสั่งอำนวยความสะดวกของเชลล์ภายในเครื่องคือ remote injection”                         |
| การจับคู่ Node และคำสั่ง node                            | การประมวลผลระยะไกลระดับผู้ควบคุมบนอุปกรณ์ที่จับคู่แล้ว | “ควรถือว่าการควบคุมอุปกรณ์ระยะไกลเป็นการเข้าถึงของผู้ใช้ที่ไม่น่าเชื่อถือโดยค่าเริ่มต้น” |
| `gateway.nodes.pairing.autoApproveCidrs`                  | นโยบายการลงทะเบียน node บนเครือข่ายที่เชื่อถือได้แบบ opt-in     | “allowlist ที่ปิดเป็นค่าเริ่มต้นคือช่องโหว่การจับคู่อัตโนมัติ”       |

## ไม่ใช่ช่องโหว่โดยการออกแบบ

<Accordion title="ข้อค้นพบทั่วไปที่อยู่นอกขอบเขต">

รูปแบบเหล่านี้ถูกรายงานบ่อย และมักถูกปิดว่าไม่ต้องดำเนินการ เว้นแต่จะแสดงให้เห็นการเลี่ยงขอบเขตจริง:

- เชนที่มีเฉพาะ prompt injection โดยไม่มีการเลี่ยงนโยบาย, auth หรือ sandbox
- ข้อกล่าวอ้างที่สมมติการทำงานแบบ multi-tenant ที่ทนต่อผู้ไม่ประสงค์ดีบนโฮสต์หรือ config ร่วมหนึ่งชุด
- ข้อกล่าวอ้างที่จัดประเภทการเข้าถึงเส้นทางอ่านปกติของผู้ควบคุม (เช่น `sessions.list` / `sessions.preview` / `chat.history`) ว่าเป็น IDOR ในการตั้งค่า shared-gateway
- ข้อค้นพบการติดตั้งใช้งานเฉพาะ localhost (เช่น HSTS บน gateway ที่เป็น loopback-only)
- ข้อค้นพบลายเซ็น inbound webhook ของ Discord สำหรับเส้นทาง inbound ที่ไม่มีอยู่ใน repo นี้
- รายงานที่ถือว่า metadata การจับคู่ node เป็นชั้นการอนุมัติรายคำสั่งชั้นที่สองแบบซ่อนสำหรับ `system.run` ทั้งที่ขอบเขตการประมวลผลจริงยังคงเป็นนโยบายคำสั่ง node ระดับ global ของ gateway รวมกับการอนุมัติ exec ของ node เอง
- รายงานที่ถือว่า `gateway.nodes.pairing.autoApproveCidrs` ที่ตั้งค่าไว้เป็นช่องโหว่โดยตัวมันเอง การตั้งค่านี้ปิดเป็นค่าเริ่มต้น ต้องมีรายการ CIDR/IP อย่างชัดแจ้ง ใช้เฉพาะกับการจับคู่ `role: node` ครั้งแรกที่ไม่มี scopes ที่ร้องขอ และไม่อนุมัติ operator/browser/Control UI, WebChat, การอัปเกรด role, การอัปเกรด scope, การเปลี่ยน metadata, การเปลี่ยน public-key หรือเส้นทาง header trusted-proxy แบบ loopback บนโฮสต์เดียวกันโดยอัตโนมัติ เว้นแต่เปิดใช้ auth แบบ loopback trusted-proxy อย่างชัดแจ้งแล้ว
- ข้อค้นพบ “ไม่มีการอนุญาตรายผู้ใช้” ที่ถือว่า `sessionKey` เป็น auth token

</Accordion>

## baseline ที่เสริมความปลอดภัยใน 60 วินาที

ใช้ baseline นี้ก่อน แล้วค่อยเปิดใช้เครื่องมืออีกครั้งแบบเลือกเฉพาะสำหรับ agent ที่เชื่อถือได้:

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

สิ่งนี้ทำให้ Gateway เป็นแบบ local-only, แยก DM และปิดใช้เครื่องมือ control-plane/runtime เป็นค่าเริ่มต้น

## กฎด่วนสำหรับ inbox ร่วม

หากมีมากกว่าหนึ่งคนที่สามารถ DM bot ของคุณได้:

- ตั้ง `session.dmScope: "per-channel-peer"` (หรือ `"per-account-channel-peer"` สำหรับช่องทางหลายบัญชี)
- ใช้ `dmPolicy: "pairing"` หรือ allowlist ที่เข้มงวด
- อย่ารวม DM ร่วมกับการเข้าถึงเครื่องมือแบบกว้าง
- สิ่งนี้ช่วยเสริมความปลอดภัยให้ inbox แบบร่วมมือ/ใช้ร่วมกัน แต่ไม่ได้ออกแบบมาเป็นการแยก co-tenant ที่ทนต่อผู้ไม่ประสงค์ดีเมื่อผู้ใช้แชร์สิทธิ์เขียนโฮสต์/config กัน

## โมเดลการมองเห็นบริบท

OpenClaw แยกสองแนวคิดออกจากกัน:

- **การอนุญาตการทริกเกอร์**: ใครสามารถทริกเกอร์ agent (`dmPolicy`, `groupPolicy`, allowlist, mention gate)
- **การมองเห็นบริบท**: บริบทเสริมใดถูกฉีดเข้าอินพุตของโมเดล (เนื้อหาการตอบกลับ, ข้อความที่ quote, ประวัติ thread, metadata ที่ forward)

allowlist ควบคุมการทริกเกอร์และการอนุญาตคำสั่ง การตั้งค่า `contextVisibility` ควบคุมวิธีกรองบริบทเสริม (การตอบกลับที่ quote, รากของ thread, ประวัติที่ดึงมา):

- `contextVisibility: "all"` (ค่าเริ่มต้น) เก็บบริบทเสริมตามที่ได้รับมา
- `contextVisibility: "allowlist"` กรองบริบทเสริมเพื่อส่งไปยังผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังเก็บการตอบกลับที่อ้างอิงไว้อย่างชัดเจนหนึ่งรายการ

ตั้งค่า `contextVisibility` ต่อช่องทางหรือต่อห้อง/การสนทนา ดูรายละเอียดการตั้งค่าได้ที่ [แชทกลุ่ม](/th/channels/groups#context-visibility-and-allowlists)

คำแนะนำการคัดแยก advisory:

- รายงานที่แสดงเพียงว่า "โมเดลเห็นข้อความที่ถูกอ้างอิงหรือข้อความประวัติจากผู้ส่งที่ไม่ได้อยู่ใน allowlist ได้" เป็นประเด็น hardening ที่แก้ได้ด้วย `contextVisibility` ไม่ใช่การข้ามขอบเขต auth หรือ sandbox ในตัวมันเอง
- เพื่อให้มีผลกระทบด้านความปลอดภัย รายงานยังต้องแสดงการข้ามขอบเขตความไว้วางใจที่พิสูจน์ได้ (auth, นโยบาย, sandbox, approval หรือขอบเขตอื่นที่มีเอกสารกำกับ)

## สิ่งที่การ audit ตรวจสอบ (ภาพรวมระดับสูง)

- **การเข้าถึงขาเข้า** (นโยบาย DM, นโยบายกลุ่ม, allowlists): คนแปลกหน้าสั่งให้บอตทำงานได้หรือไม่?
- **รัศมีผลกระทบของเครื่องมือ** (เครื่องมือที่ยกระดับสิทธิ์ + ห้องเปิด): prompt injection อาจกลายเป็นการกระทำกับ shell/ไฟล์/เครือข่ายได้หรือไม่?
- **การเบี่ยงเบนของ approval สำหรับ exec** (`security=full`, `autoAllowSkills`, allowlists ของ interpreter ที่ไม่มี `strictInlineEval`): guardrails สำหรับ host-exec ยังทำงานตามที่คุณคิดอยู่หรือไม่?
  - `security="full"` เป็นคำเตือนสถานะโดยกว้าง ไม่ใช่หลักฐานของบั๊ก เป็นค่าเริ่มต้นที่เลือกไว้สำหรับการตั้งค่า trusted personal-assistant; ปรับให้เข้มขึ้นเฉพาะเมื่อโมเดลภัยคุกคามของคุณต้องการ approval หรือ guardrails แบบ allowlist
- **การเปิดเผยผ่านเครือข่าย** (Gateway bind/auth, Tailscale Serve/Funnel, โทเค็น auth ที่อ่อน/สั้น)
- **การเปิดเผยการควบคุมเบราว์เซอร์** (remote nodes, relay ports, remote CDP endpoints)
- **สุขอนามัยของดิสก์เครื่อง** (permissions, symlinks, config includes, พาธ "synced folder")
- **Plugins** (plugins โหลดโดยไม่มี allowlist ที่ชัดเจน)
- **การเบี่ยงเบน/การตั้งค่าผิดของนโยบาย** (ตั้งค่า sandbox docker แล้วแต่โหมด sandbox ปิดอยู่; รูปแบบ `gateway.nodes.denyCommands` ไม่มีผล เพราะการจับคู่เป็นชื่อคำสั่งแบบตรงตัวเท่านั้น (เช่น `system.run`) และไม่ตรวจข้อความ shell; รายการ `gateway.nodes.allowCommands` ที่อันตราย; `tools.profile="minimal"` ระดับ global ถูกแทนที่ด้วยโปรไฟล์ต่อ agent; เครื่องมือที่ plugin เป็นเจ้าของเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน)
- **การเบี่ยงเบนของความคาดหวัง runtime** (เช่น สมมติว่า implicit exec ยังหมายถึง `sandbox` ขณะที่ `tools.exec.host` ตอนนี้มีค่าเริ่มต้นเป็น `auto` หรือกำหนด `tools.exec.host="sandbox"` อย่างชัดเจนขณะที่โหมด sandbox ปิดอยู่)
- **สุขอนามัยของโมเดล** (เตือนเมื่อโมเดลที่ตั้งค่าไว้ดูเป็นรุ่นเก่า; ไม่ใช่การบล็อกแบบเด็ดขาด)

หากคุณรัน `--deep` OpenClaw จะพยายาม probe Gateway แบบ live ตามความสามารถที่ทำได้ด้วย

## แผนที่การจัดเก็บ credential

ใช้ส่วนนี้เมื่อตรวจสอบการเข้าถึงหรือตัดสินใจว่าจะสำรองข้อมูลใด:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **โทเค็นบอต Telegram**: config/env หรือ `channels.telegram.tokenFile` (ต้องเป็นไฟล์ปกติเท่านั้น; ปฏิเสธ symlink)
- **โทเค็นบอต Discord**: config/env หรือ SecretRef (providers แบบ env/file/exec)
- **โทเค็น Slack**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ auth ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **สถานะ Codex runtime**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **payload secrets ที่อ้างอิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`

## เช็กลิสต์ security audit

เมื่อ audit แสดง findings ให้จัดการตามลำดับความสำคัญนี้:

1. **อะไรก็ตามที่ "เปิด" + เปิดใช้เครื่องมือ**: ล็อก DM/กลุ่มก่อน (pairing/allowlists) จากนั้นปรับนโยบายเครื่องมือ/sandboxing ให้เข้มขึ้น
2. **การเปิดเผยเครือข่ายสาธารณะ** (LAN bind, Funnel, ไม่มี auth): แก้ทันที
3. **การเปิดเผยการควบคุมเบราว์เซอร์ระยะไกล**: ปฏิบัติเหมือนเป็นการเข้าถึงระดับ operator (เฉพาะ tailnet, pair nodes อย่างตั้งใจ, หลีกเลี่ยงการเปิดเผยสาธารณะ)
4. **Permissions**: ตรวจให้แน่ใจว่า state/config/credentials/auth ไม่สามารถอ่านได้โดย group/world
5. **Plugins**: โหลดเฉพาะสิ่งที่คุณไว้วางใจอย่างชัดเจนเท่านั้น
6. **การเลือกโมเดล**: เลือกโมเดลสมัยใหม่ที่เสริมความแข็งแรงต่อคำสั่งสำหรับบอตใด ๆ ที่มีเครื่องมือ

## อภิธาน security audit

finding แต่ละรายการของ audit จะอ้างอิงด้วย `checkId` แบบมีโครงสร้าง (เช่น
`gateway.bind_no_auth` หรือ `tools.exec.security_full_configured`) กลุ่ม severity ระดับวิกฤตที่พบบ่อย:

- `fs.*` - permissions ของ filesystem สำหรับ state, config, credentials, auth profiles
- `gateway.*` - โหมด bind, auth, Tailscale, Control UI, การตั้งค่า trusted-proxy
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - hardening รายพื้นผิว
- `plugins.*`, `skills.*` - supply chain ของ plugin/skill และ findings จากการสแกน
- `security.exposure.*` - การตรวจสอบข้ามส่วนที่นโยบายการเข้าถึงบรรจบกับรัศมีผลกระทบของเครื่องมือ

ดู catalog ฉบับเต็มพร้อมระดับ severity, fix keys และการรองรับ auto-fix ได้ที่
[การตรวจสอบ security audit](/th/gateway/security/audit-checks)

## Control UI ผ่าน HTTP

Control UI ต้องใช้ **secure context** (HTTPS หรือ localhost) เพื่อสร้าง identity
ของอุปกรณ์ `gateway.controlUi.allowInsecureAuth` เป็น toggle ความเข้ากันได้สำหรับเครื่อง:

- บน localhost จะอนุญาตให้ใช้ Control UI auth โดยไม่มี device identity เมื่อโหลดหน้าเว็บผ่าน HTTP ที่ไม่ปลอดภัย
- ไม่ได้ข้ามการตรวจสอบ pairing
- ไม่ได้ผ่อนคลายข้อกำหนด device identity สำหรับ remote (ที่ไม่ใช่ localhost)

ควรใช้ HTTPS (Tailscale Serve) หรือเปิด UI บน `127.0.0.1`

สำหรับสถานการณ์ break-glass เท่านั้น `gateway.controlUi.dangerouslyDisableDeviceAuth`
จะปิดการตรวจสอบ device identity ทั้งหมด นี่เป็นการลดระดับความปลอดภัยอย่างรุนแรง;
ปิดไว้เสมอ เว้นแต่คุณกำลังดีบักอยู่จริงและสามารถย้อนกลับได้อย่างรวดเร็ว

แยกจาก flag อันตรายเหล่านั้น `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
สามารถอนุญาต session ของ Control UI ระดับ **operator** ได้โดยไม่มี device identity นี่เป็น
พฤติกรรมของ auth-mode ที่ตั้งใจไว้ ไม่ใช่ทางลัดของ `allowInsecureAuth` และยังคง
ไม่ขยายไปถึง session ของ Control UI บทบาท node

`openclaw security audit` จะเตือนเมื่อเปิดใช้การตั้งค่านี้

## สรุป flag ที่ไม่ปลอดภัยหรืออันตราย

`openclaw security audit` จะยก `config.insecure_or_dangerous_flags` เมื่อ
เปิดใช้สวิตช์ debug ที่ทราบว่าไม่ปลอดภัย/อันตราย ให้ไม่ตั้งค่าเหล่านี้ใน
production

<AccordionGroup>
  <Accordion title="Flags ที่ audit ติดตามในวันนี้">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="คีย์ `dangerous*` / `dangerously*` ทั้งหมดใน config schema">
    Control UI และเบราว์เซอร์:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    การจับคู่ชื่อช่องทาง (ช่องทางที่ bundled และ plugin; มีให้ใช้งานแบบต่อ
    `accounts.<accountId>` ด้วยเมื่อเกี่ยวข้อง):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (ช่องทาง plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (ช่องทาง plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (ช่องทาง plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (ช่องทาง plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (ช่องทาง plugin)

    การเปิดเผยผ่านเครือข่าย:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (แบบต่อบัญชีด้วย)

    Sandbox Docker (ค่าเริ่มต้น + ต่อ agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## การตั้งค่า reverse proxy

หากคุณรัน Gateway หลัง reverse proxy (nginx, Caddy, Traefik ฯลฯ) ให้ตั้งค่า
`gateway.trustedProxies` เพื่อจัดการ forwarded-client IP อย่างถูกต้อง

เมื่อ Gateway ตรวจพบ proxy headers จากที่อยู่ที่ **ไม่ได้** อยู่ใน `trustedProxies` จะ **ไม่** ถือว่า connections เป็น local clients หากปิด gateway auth อยู่ connections เหล่านั้นจะถูกปฏิเสธ วิธีนี้ป้องกันการข้าม authentication ที่ proxied connections อาจดูเหมือนมาจาก localhost และได้รับความไว้วางใจอัตโนมัติ

`gateway.trustedProxies` ยังป้อนให้ `gateway.auth.mode: "trusted-proxy"` ด้วย แต่ auth mode นั้นเข้มงวดกว่า:

- trusted-proxy auth **ล้มเหลวแบบปิดสำหรับ proxy ที่มีแหล่งที่มาเป็น loopback ตามค่าเริ่มต้น**
- reverse proxies แบบ loopback บน host เดียวกันสามารถใช้ `gateway.trustedProxies` สำหรับการตรวจจับ local-client และการจัดการ forwarded IP
- reverse proxies แบบ loopback บน host เดียวกันจะผ่าน `gateway.auth.mode: "trusted-proxy"` ได้เฉพาะเมื่อ `gateway.auth.trustedProxy.allowLoopback = true`; มิฉะนั้นให้ใช้ token/password auth

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

เมื่อกำหนดค่า `trustedProxies` แล้ว Gateway จะใช้ `X-Forwarded-For` เพื่อระบุ IP ของ client `X-Real-IP` จะถูกละเว้นตามค่าเริ่มต้น เว้นแต่จะตั้งค่า `gateway.allowRealIpFallback: true` อย่างชัดเจน

Trusted proxy headers ไม่ได้ทำให้การ pair อุปกรณ์ node ได้รับความไว้วางใจโดยอัตโนมัติ
`gateway.nodes.pairing.autoApproveCidrs` เป็นนโยบาย operator แยกต่างหากที่ปิดตามค่าเริ่มต้น
แม้จะเปิดใช้แล้ว เส้นทาง trusted-proxy header ที่มีแหล่งที่มาเป็น loopback
จะถูกตัดออกจาก node auto-approval เพราะผู้เรียกจากเครื่องสามารถปลอม headers เหล่านั้นได้
รวมถึงเมื่อเปิดใช้ loopback trusted-proxy auth อย่างชัดเจนแล้วก็ตาม

พฤติกรรม reverse proxy ที่ดี (เขียนทับ incoming forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

พฤติกรรม reverse proxy ที่ไม่ดี (append/preserve untrusted forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## หมายเหตุ HSTS และ origin

- OpenClaw gateway ให้ความสำคัญกับ local/loopback ก่อน หากคุณ terminate TLS ที่ reverse proxy ให้ตั้งค่า HSTS บนโดเมน HTTPS ฝั่ง proxy ที่นั่น
- หาก gateway เอง terminate HTTPS คุณสามารถตั้ง `gateway.http.securityHeaders.strictTransportSecurity` เพื่อปล่อย header HSTS จาก responses ของ OpenClaw
- คำแนะนำการ deploy โดยละเอียดอยู่ใน [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts)
- สำหรับการ deploy Control UI ที่ไม่ใช่ loopback ต้องมี `gateway.controlUi.allowedOrigins` ตามค่าเริ่มต้น
- `gateway.controlUi.allowedOrigins: ["*"]` เป็นนโยบาย browser-origin แบบอนุญาตทั้งหมดอย่างชัดเจน ไม่ใช่ค่าเริ่มต้นที่ hardened หลีกเลี่ยงการใช้นอกการทดสอบบนเครื่องที่ควบคุมอย่างเข้มงวด
- ความล้มเหลวของ browser-origin auth บน loopback ยังคงถูก rate-limit แม้เมื่อเปิดใช้
  ข้อยกเว้น loopback ทั่วไป แต่คีย์ lockout จะถูกจำกัดขอบเขตต่อ
  ค่า `Origin` ที่ normalize แล้ว แทนที่จะเป็น bucket localhost เดียวร่วมกัน
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด Host-header origin fallback; ให้ถือเป็นนโยบายอันตรายที่ operator เลือกไว้
- ปฏิบัติต่อ DNS rebinding และพฤติกรรม proxy-host header เป็นประเด็น hardening ของ deployment; คุม `trustedProxies` ให้แคบและหลีกเลี่ยงการเปิดเผย gateway โดยตรงต่ออินเทอร์เน็ตสาธารณะ

## บันทึก session บนเครื่องอยู่บนดิสก์

OpenClaw จัดเก็บทรานสคริปต์ของเซสชันไว้บนดิสก์ภายใต้ `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
สิ่งนี้จำเป็นสำหรับความต่อเนื่องของเซสชันและ (ทางเลือก) การทำดัชนีหน่วยความจำเซสชัน แต่ก็หมายความว่า
**โปรเซส/ผู้ใช้ใดๆ ที่มีสิทธิ์เข้าถึงระบบไฟล์สามารถอ่านล็อกเหล่านั้นได้** ให้ถือว่าสิทธิ์เข้าถึงดิสก์เป็นขอบเขตความไว้วางใจ
และจำกัดสิทธิ์บน `~/.openclaw` ให้รัดกุม (ดูส่วนการตรวจสอบด้านล่าง) หากคุณต้องการ
การแยกกันที่แข็งแรงกว่าระหว่างเอเจนต์ ให้รันเอเจนต์เหล่านั้นภายใต้ผู้ใช้ OS แยกกันหรือโฮสต์แยกกัน

## การดำเนินการ Node (`system.run`)

หากจับคู่ Node macOS ไว้แล้ว Gateway สามารถเรียกใช้ `system.run` บน Node นั้นได้ นี่คือ **การดำเนินการโค้ดจากระยะไกล** บน Mac:

- ต้องมีการจับคู่ Node (การอนุมัติ + โทเค็น)
- การจับคู่ Gateway Node ไม่ใช่พื้นผิวการอนุมัติรายคำสั่ง แต่เป็นการสร้างตัวตน/ความไว้วางใจของ Node และการออกโทเค็น
- Gateway ใช้นโยบายคำสั่ง Node แบบรวมระดับโลกอย่างกว้างผ่าน `gateway.nodes.allowCommands` / `denyCommands`
- ควบคุมบน Mac ผ่าน **การตั้งค่า → การอนุมัติ Exec** (`security` + `ask` + allowlist)
- นโยบาย `system.run` ราย Node คือไฟล์การอนุมัติ exec ของ Node เอง (`exec.approvals.node.*`) ซึ่งอาจเข้มงวดกว่าหรือผ่อนปรนกว่านโยบาย ID คำสั่งรวมระดับโลกของ Gateway
- Node ที่รันด้วย `security="full"` และ `ask="off"` กำลังทำตามโมเดลผู้ปฏิบัติการที่เชื่อถือได้ตามค่าเริ่มต้น ให้ถือว่านั่นเป็นพฤติกรรมที่คาดไว้ เว้นแต่การติดตั้งใช้งานของคุณต้องการจุดยืนด้านการอนุมัติหรือ allowlist ที่เข้มงวดกว่าอย่างชัดเจน
- โหมดการอนุมัติผูกบริบทคำขอที่ตรงกัน และเมื่อเป็นไปได้ จะผูกโอเปอแรนด์สคริปต์/ไฟล์โลคัลที่เป็นรูปธรรมหนึ่งรายการ หาก OpenClaw ไม่สามารถระบุไฟล์โลคัลโดยตรงได้พอดีหนึ่งไฟล์สำหรับคำสั่ง interpreter/runtime การดำเนินการที่อิงการอนุมัติจะถูกปฏิเสธ แทนที่จะสัญญาว่าครอบคลุมความหมายทั้งหมด
- สำหรับ `host=node` การรันที่อิงการอนุมัติยังจัดเก็บ
  `systemRunPlan` ที่เตรียมไว้ในรูปแบบมาตรฐานด้วย การส่งต่อที่อนุมัติในภายหลังจะนำแผนนั้นที่จัดเก็บไว้กลับมาใช้ และการตรวจสอบของ gateway
  จะปฏิเสธการแก้ไขคำสั่ง/cwd/บริบทเซสชันจากผู้เรียกหลังจากสร้างคำขอ
  การอนุมัติแล้ว
- หากคุณไม่ต้องการการดำเนินการจากระยะไกล ให้ตั้งค่า security เป็น **deny** และลบการจับคู่ Node สำหรับ Mac เครื่องนั้น

ความแตกต่างนี้สำคัญต่อการคัดแยกปัญหา:

- Node ที่จับคู่แล้วซึ่งเชื่อมต่อใหม่และประกาศรายการคำสั่งที่ต่างออกไป ไม่ได้เป็นช่องโหว่ในตัวเอง หากนโยบายรวมระดับโลกของ Gateway และการอนุมัติ exec โลคัลของ Node ยังคงบังคับใช้ขอบเขตการดำเนินการจริง
- รายงานที่ถือว่าเมทาดาทาการจับคู่ Node เป็นชั้นการอนุมัติรายคำสั่งที่ซ่อนอยู่อีกชั้น มักเป็นความสับสนด้านนโยบาย/UX ไม่ใช่การข้ามขอบเขตความปลอดภัย

## Skills แบบไดนามิก (watcher / Node ระยะไกล)

OpenClaw สามารถรีเฟรชรายการ Skills ระหว่างเซสชันได้:

- **Skills watcher**: การเปลี่ยนแปลง `SKILL.md` สามารถอัปเดตสแนปช็อต Skills ในเทิร์นถัดไปของเอเจนต์
- **Node ระยะไกล**: การเชื่อมต่อ Node macOS สามารถทำให้ Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานได้ (อิงจากการตรวจสอบ bin)

ให้ถือว่าโฟลเดอร์ Skills เป็น **โค้ดที่เชื่อถือได้** และจำกัดผู้ที่แก้ไขได้

## โมเดลภัยคุกคาม

ผู้ช่วย AI ของคุณสามารถ:

- ดำเนินการคำสั่งเชลล์ใดๆ ก็ได้
- อ่าน/เขียนไฟล์
- เข้าถึงบริการเครือข่าย
- ส่งข้อความถึงใครก็ได้ (หากคุณให้สิทธิ์เข้าถึง WhatsApp)

คนที่ส่งข้อความถึงคุณสามารถ:

- พยายามหลอก AI ของคุณให้ทำสิ่งไม่ดี
- ใช้วิศวกรรมสังคมเพื่อเข้าถึงข้อมูลของคุณ
- ตรวจสอบรายละเอียดโครงสร้างพื้นฐาน

## แนวคิดหลัก: การควบคุมการเข้าถึงก่อนความฉลาด

ความล้มเหลวส่วนใหญ่ที่นี่ไม่ใช่ช่องโหว่ล้ำลึก แต่เป็น "มีคนส่งข้อความหาบอต แล้วบอตก็ทำตามที่เขาขอ"

จุดยืนของ OpenClaw:

- **ตัวตนมาก่อน:** ตัดสินใจว่าใครคุยกับบอตได้ (การจับคู่ DM / allowlists / "open" ที่ระบุชัดเจน)
- **ขอบเขตถัดมา:** ตัดสินใจว่าบอตได้รับอนุญาตให้ดำเนินการที่ใด (allowlists กลุ่ม + การเปิดใช้งานด้วยการ mention, เครื่องมือ, sandboxing, สิทธิ์อุปกรณ์)
- **โมเดลสุดท้าย:** สมมติว่าโมเดลถูกชักจูงได้ ออกแบบให้การชักจูงมีรัศมีผลกระทบจำกัด

## โมเดลการอนุญาตคำสั่ง

คำสั่ง Slash และ directives จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น การอนุญาตได้มาจาก
allowlists/การจับคู่ของช่องทาง รวมถึง `commands.useAccessGroups` (ดู [การกำหนดค่า](/th/gateway/configuration)
และ [คำสั่ง Slash](/th/tools/slash-commands)) หาก allowlist ของช่องทางว่างเปล่าหรือมี `"*"`,
คำสั่งจะเปิดใช้งานได้โดยปริยายสำหรับช่องทางนั้น

`/exec` เป็นเพียงความสะดวกระดับเซสชันสำหรับผู้ปฏิบัติการที่ได้รับอนุญาตเท่านั้น มัน **ไม่** เขียน config หรือ
เปลี่ยนเซสชันอื่น

## ความเสี่ยงของเครื่องมือ control plane

เครื่องมือในตัวสองรายการสามารถทำการเปลี่ยนแปลง control-plane แบบถาวรได้:

- `gateway` สามารถตรวจสอบ config ด้วย `config.schema.lookup` / `config.get` และสามารถทำการเปลี่ยนแปลงถาวรด้วย `config.apply`, `config.patch`, และ `update.run`
- `cron` สามารถสร้างงานตามกำหนดเวลาที่รันต่อไปหลังจากแชต/งานเดิมสิ้นสุดลง

เครื่องมือ runtime `gateway` สำหรับเจ้าของเท่านั้นยังคงปฏิเสธการเขียนทับ
`tools.exec.ask` หรือ `tools.exec.security`; alias ดั้งเดิม `tools.bash.*` จะถูก
ทำให้เป็นมาตรฐานไปยังพาธ exec ที่ได้รับการป้องกันเดียวกันก่อนการเขียน
การแก้ไข `gateway config.apply` และ `gateway config.patch` ที่ขับเคลื่อนโดยเอเจนต์จะ
fail-closed ตามค่าเริ่มต้น: มีเพียงชุดพาธ prompt, model, และ mention-gating
ที่แคบเท่านั้นที่เอเจนต์ปรับได้ ดังนั้นทรี config ที่ละเอียดอ่อนใหม่จึงได้รับการปกป้อง
เว้นแต่จะถูกเพิ่มเข้า allowlist โดยตั้งใจ

สำหรับเอเจนต์/พื้นผิวใดๆ ที่จัดการเนื้อหาที่ไม่น่าเชื่อถือ ให้ปฏิเสธรายการเหล่านี้ตามค่าเริ่มต้น:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` บล็อกเฉพาะการดำเนินการ restart เท่านั้น มันไม่ได้ปิดใช้งานการดำเนินการ config/update ของ `gateway`

## Plugins

Plugins รัน **ในโปรเซสเดียวกัน** กับ Gateway ให้ถือว่าเป็นโค้ดที่เชื่อถือได้:

- ติดตั้ง Plugins จากแหล่งที่คุณเชื่อถือเท่านั้น
- แนะนำให้ใช้ `plugins.allow` allowlists ที่ระบุชัดเจน
- ตรวจทาน config ของ Plugin ก่อนเปิดใช้งาน
- รีสตาร์ท Gateway หลังจากเปลี่ยนแปลง Plugin
- หากคุณติดตั้งหรืออัปเดต Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`) ให้ถือว่าเหมือนการรันโค้ดที่ไม่น่าเชื่อถือ:
  - พาธติดตั้งคือไดเรกทอรีราย Plugin ภายใต้รากการติดตั้ง Plugin ที่ใช้งานอยู่
  - OpenClaw รันการสแกนโค้ดอันตรายในตัวก่อนติดตั้ง/อัปเดต การพบรายการระดับ `critical` จะบล็อกตามค่าเริ่มต้น
  - การติดตั้ง Plugin ผ่าน npm และ git จะรันการปรับ dependency ผ่าน package-manager ให้ลงตัวเฉพาะในโฟลว์ติดตั้ง/อัปเดตที่ระบุชัดเจนเท่านั้น พาธโลคัลและไฟล์ archive จะถูกถือเป็นแพ็กเกจ Plugin ที่สมบูรณ์ในตัวเอง OpenClaw คัดลอก/อ้างอิงสิ่งเหล่านั้นโดยไม่รัน `npm install`
  - แนะนำให้ตรึงเวอร์ชันแบบเจาะจงแน่นอน (`@scope/pkg@1.2.3`) และตรวจสอบโค้ดที่แตกออกมาบนดิสก์ก่อนเปิดใช้งาน
  - `--dangerously-force-unsafe-install` ใช้เฉพาะกรณีฉุกเฉินสำหรับผลบวกเทียมของการสแกนในตัวบนโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น มันไม่ข้ามการบล็อกตามนโยบายของ hook `before_install` ของ Plugin และไม่ข้ามความล้มเหลวของการสแกน
  - การติดตั้ง dependency ของ Skills ที่อิง Gateway ใช้การแยก dangerous/suspicious แบบเดียวกัน: การพบรายการ `critical` ในตัวจะบล็อก เว้นแต่ผู้เรียกจะตั้งค่า `dangerouslyForceUnsafeInstall` อย่างชัดเจน ขณะที่การพบรายการ suspicious ยังเป็นเพียงคำเตือนเท่านั้น `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง Skills ของ ClawHub ที่แยกต่างหาก

รายละเอียด: [Plugins](/th/tools/plugin)

## โมเดลการเข้าถึง DM: pairing, allowlist, open, disabled

ช่องทางปัจจุบันทั้งหมดที่รองรับ DM รองรับนโยบาย DM (`dmPolicy` หรือ `*.dm.policy`) ที่กั้น DM ขาเข้า **ก่อน** ประมวลผลข้อความ:

- `pairing` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่สั้นๆ และบอตจะเพิกเฉยต่อข้อความของพวกเขาจนกว่าจะได้รับอนุมัติ รหัสหมดอายุหลัง 1 ชั่วโมง DM ซ้ำจะไม่ส่งรหัสใหม่จนกว่าจะสร้างคำขอใหม่ คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง** ตามค่าเริ่มต้น
- `allowlist`: ผู้ส่งที่ไม่รู้จักจะถูกบล็อก (ไม่มี handshake การจับคู่)
- `open`: อนุญาตให้ใครก็ได้ส่ง DM (สาธารณะ) **ต้องการ** ให้ allowlist ของช่องทางมี `"*"` (การเลือกเข้าร่วมอย่างชัดเจน)
- `disabled`: เพิกเฉยต่อ DM ขาเข้าทั้งหมด

อนุมัติผ่าน CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

รายละเอียด + ไฟล์บนดิสก์: [การจับคู่](/th/channels/pairing)

## การแยกเซสชัน DM (โหมดหลายผู้ใช้)

ตามค่าเริ่มต้น OpenClaw จะส่ง **DM ทั้งหมดเข้าสู่เซสชันหลัก** เพื่อให้ผู้ช่วยของคุณมีความต่อเนื่องข้ามอุปกรณ์และช่องทาง หาก **หลายคน** สามารถ DM หาบอตได้ (DM แบบเปิดหรือ allowlist หลายคน) ให้พิจารณาแยกเซสชัน DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

สิ่งนี้ป้องกันการรั่วไหลของบริบทข้ามผู้ใช้ ขณะยังคงแยกแชตกลุ่มไว้

นี่เป็นขอบเขตบริบทการส่งข้อความ ไม่ใช่ขอบเขตผู้ดูแลโฮสต์ หากผู้ใช้เป็นปฏิปักษ์ต่อกันและใช้โฮสต์/config Gateway เดียวกัน ให้รัน gateways แยกกันตามขอบเขตความไว้วางใจแทน

### โหมด DM ปลอดภัย (แนะนำ)

ให้ถือว่าสนิปเป็ตด้านบนเป็น **โหมด DM ปลอดภัย**:

- ค่าเริ่มต้น: `session.dmScope: "main"` (DM ทั้งหมดแชร์เซสชันเดียวเพื่อความต่อเนื่อง)
- ค่าเริ่มต้นของการเริ่มต้นใช้งาน CLI โลคัล: เขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า (คงค่าที่ระบุชัดเจนเดิมไว้)
- โหมด DM ปลอดภัย: `session.dmScope: "per-channel-peer"` (แต่ละคู่ช่องทาง+ผู้ส่งได้บริบท DM ที่แยกกัน)
- การแยก peer ข้ามช่องทาง: `session.dmScope: "per-peer"` (ผู้ส่งแต่ละคนได้หนึ่งเซสชันข้ามทุกช่องทางประเภทเดียวกัน)

หากคุณรันหลายบัญชีบนช่องทางเดียวกัน ให้ใช้ `per-account-channel-peer` แทน หากคนเดียวกันติดต่อคุณบนหลายช่องทาง ให้ใช้ `session.identityLinks` เพื่อรวมเซสชัน DM เหล่านั้นเป็นตัวตนมาตรฐานเดียว ดู [การจัดการเซสชัน](/th/concepts/session) และ [การกำหนดค่า](/th/gateway/configuration)

## Allowlists สำหรับ DM และกลุ่ม

OpenClaw มีชั้น "ใครกระตุ้นฉันได้?" แยกกันสองชั้น:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; ดั้งเดิม: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ใครได้รับอนุญาตให้คุยกับบอตในข้อความส่วนตัว
  - เมื่อ `dmPolicy="pairing"` การอนุมัติจะถูกเขียนไปยังที่เก็บ pairing allowlist ที่ผูกกับบัญชีภายใต้ `~/.openclaw/credentials/` (`<channel>-allowFrom.json` สำหรับบัญชีค่าเริ่มต้น, `<channel>-<accountId>-allowFrom.json` สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น) แล้วรวมกับ config allowlists
- **Group allowlist** (เฉพาะช่องทาง): กลุ่ม/ช่องทาง/guild ใดที่บอตจะรับข้อความเข้ามาเลย
  - รูปแบบทั่วไป:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ค่าเริ่มต้นรายกลุ่ม เช่น `requireMention`; เมื่อตั้งค่าแล้ว ยังทำหน้าที่เป็น group allowlist ด้วย (ใส่ `"*"` เพื่อคงพฤติกรรมอนุญาตทั้งหมดไว้)
    - `groupPolicy="allowlist"` + `groupAllowFrom`: จำกัดว่าใครสามารถกระตุ้นบอต _ภายใน_ เซสชันกลุ่ม (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists รายพื้นผิว + ค่าเริ่มต้นของ mention
  - การตรวจสอบกลุ่มรันตามลำดับนี้: `groupPolicy`/group allowlists ก่อน, การเปิดใช้งานด้วย mention/reply เป็นลำดับสอง
  - การตอบกลับข้อความของบอต (mention โดยนัย) **ไม่** ข้าม sender allowlists เช่น `groupAllowFrom`
  - **หมายเหตุด้านความปลอดภัย:** ให้ถือว่า `dmPolicy="open"` และ `groupPolicy="open"` เป็นการตั้งค่าทางเลือกสุดท้าย ควรใช้น้อยมาก แนะนำให้ใช้ pairing + allowlists เว้นแต่คุณจะเชื่อถือสมาชิกทุกคนในห้องอย่างเต็มที่

รายละเอียด: [การกำหนดค่า](/th/gateway/configuration) และ [กลุ่ม](/th/channels/groups)

## Prompt injection (คืออะไร และทำไมจึงสำคัญ)

Prompt injection คือการที่ผู้โจมตีสร้างข้อความที่ชักจูงโมเดลให้ทำสิ่งไม่ปลอดภัย ("เพิกเฉยต่อคำสั่งของคุณ", "dump ระบบไฟล์ของคุณ", "ตามลิงก์นี้แล้วรันคำสั่ง" เป็นต้น)

แม้จะมี system prompts ที่แข็งแรง **prompt injection ก็ยังไม่ได้ถูกแก้ได้หมด** guardrails ของ system prompt เป็นเพียงแนวทางแบบอ่อนเท่านั้น การบังคับใช้อย่างแข็งแรงมาจากนโยบายเครื่องมือ, การอนุมัติ exec, sandboxing, และ channel allowlists (และผู้ปฏิบัติการสามารถปิดสิ่งเหล่านี้ได้โดยตั้งใจ) สิ่งที่ช่วยได้จริงในทางปฏิบัติ:

- ล็อกดาวน์ DM ขาเข้าไว้ (การจับคู่/allowlists)
- ควรใช้การกั้นด้วยการ mention ในกลุ่ม; หลีกเลี่ยง bot แบบ "always-on" ในห้องสาธารณะ
- ถือว่าลิงก์ ไฟล์แนบ และคำสั่งที่วางมาเป็นอันตรายโดยค่าเริ่มต้น
- รันการเรียกใช้เครื่องมือที่ละเอียดอ่อนใน sandbox; เก็บความลับไว้นอกระบบไฟล์ที่ agent เข้าถึงได้
- หมายเหตุ: sandboxing เป็นแบบเลือกเปิดใช้ หากปิดโหมด sandbox ค่า `host=auto` โดยนัยจะ resolve ไปยัง gateway host ส่วน `host=sandbox` ที่ระบุชัดเจนจะยัง fail closed เพราะไม่มี sandbox runtime ให้ใช้ ตั้งค่า `host=gateway` หากต้องการให้พฤติกรรมนั้นชัดเจนใน config
- จำกัดเครื่องมือความเสี่ยงสูง (`exec`, `browser`, `web_fetch`, `web_search`) ให้ใช้ได้เฉพาะ agent ที่เชื่อถือได้หรือ allowlists ที่ระบุชัดเจน
- หากคุณ allowlist interpreter (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`) ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline eval ยังต้องได้รับการอนุมัติอย่างชัดเจน
- การวิเคราะห์การอนุมัติ shell ยังปฏิเสธรูปแบบ POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) ภายใน **heredoc ที่ไม่ได้ quote** ดังนั้นเนื้อหา heredoc ที่อยู่ใน allowlist จึงไม่สามารถลักลอบให้ shell expansion ผ่านการตรวจ allowlist ในฐานะข้อความธรรมดาได้ ให้ quote ตัวปิด heredoc (เช่น `<<'EOF'`) เพื่อเลือกใช้ความหมายของเนื้อหาแบบ literal; heredoc ที่ไม่ได้ quote ซึ่งจะ expand ตัวแปรจะถูกปฏิเสธ
- **การเลือกโมเดลสำคัญ:** โมเดลเก่า/เล็กกว่า/legacy มีความทนทานต่อ prompt injection และการใช้เครื่องมือในทางที่ผิดต่ำกว่ามาก สำหรับ agent ที่เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดและเสริมความเข้มงวดด้านคำสั่งมากที่สุดเท่าที่มี

สัญญาณเตือนที่ควรถือว่าไม่น่าเชื่อถือ:

- "อ่านไฟล์/URL นี้แล้วทำตามที่บอกทุกอย่าง"
- "ละเว้น system prompt หรือกฎความปลอดภัยของคุณ"
- "เปิดเผยคำสั่งที่ซ่อนอยู่หรือเอาต์พุตของเครื่องมือ"
- "วางเนื้อหาทั้งหมดของ ~/.openclaw หรือ log ของคุณ"

## การทำความสะอาด special-token ของเนื้อหาภายนอก

OpenClaw จะลบ literal ของ special-token ทั่วไปจาก chat-template ของ LLM แบบ self-hosted ออกจากเนื้อหาภายนอกและ metadata ที่ถูกห่อไว้ก่อนส่งถึงโมเดล กลุ่ม marker ที่ครอบคลุมรวมถึง token บทบาท/เทิร์นของ Qwen/ChatML, Llama, Gemma, Mistral, Phi และ GPT-OSS

เหตุผล:

- Backend ที่เข้ากันได้กับ OpenAI ซึ่งอยู่หน้าโมเดล self-hosted บางครั้งจะคง special token ที่ปรากฏในข้อความผู้ใช้ไว้ แทนที่จะ mask ออก ผู้โจมตีที่สามารถเขียนลงในเนื้อหาภายนอกขาเข้า (หน้าเว็บที่ fetch มา เนื้อหาอีเมล เอาต์พุตของเครื่องมืออ่านเนื้อหาไฟล์) อาจ inject ขอบเขตบทบาท `assistant` หรือ `system` สังเคราะห์ แล้วหลบ guardrail ของ wrapped-content ได้
- การทำความสะอาดเกิดขึ้นที่ชั้นการห่อเนื้อหาภายนอก จึงใช้สม่ำเสมอข้ามเครื่องมือ fetch/read และเนื้อหาช่องทางขาเข้า แทนที่จะเป็นแบบแยกตาม provider
- คำตอบขาออกของโมเดลมี sanitizer แยกต่างหากอยู่แล้ว ซึ่งลบ `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` ที่รั่วออกมา และ scaffolding runtime ภายในที่คล้ายกัน ออกจากคำตอบที่ผู้ใช้มองเห็นที่ขอบเขตการส่งมอบช่องทางขั้นสุดท้าย external-content sanitizer คือส่วนคู่ขาเข้า

สิ่งนี้ไม่ได้แทนที่การ hardening อื่น ๆ บนหน้านี้ - `dmPolicy`, allowlists, การอนุมัติ exec, sandboxing และ `contextVisibility` ยังคงเป็นกลไกหลัก สิ่งนี้ปิดช่องทาง bypass เฉพาะหนึ่งจุดที่ชั้น tokenizer ต่อ stack แบบ self-hosted ที่ส่งต่อข้อความผู้ใช้พร้อม special token แบบเดิม

## flag bypass เนื้อหาภายนอกที่ไม่ปลอดภัย

OpenClaw มี flag bypass แบบชัดเจนที่ปิดการห่อความปลอดภัยของเนื้อหาภายนอก:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- ฟิลด์ payload ของ Cron `allowUnsafeExternalContent`

แนวทาง:

- คงค่าเหล่านี้ไว้เป็น unset/false ใน production
- เปิดใช้เฉพาะชั่วคราวสำหรับการ debug ที่มีขอบเขตแคบมาก
- หากเปิดใช้ ให้ isolate agent นั้น (sandbox + เครื่องมือน้อยที่สุด + namespace ของ session เฉพาะ)

หมายเหตุความเสี่ยงของ hook:

- Payload ของ hook เป็นเนื้อหาที่ไม่น่าเชื่อถือ แม้การส่งมอบจะมาจากระบบที่คุณควบคุม (เนื้อหา mail/docs/web สามารถมี prompt injection ได้)
- Tier ของโมเดลที่อ่อนเพิ่มความเสี่ยงนี้ สำหรับ automation ที่ขับเคลื่อนด้วย hook ควรใช้ tier โมเดลสมัยใหม่ที่แข็งแกร่ง และรักษานโยบายเครื่องมือให้เข้มงวด (`tools.profile: "messaging"` หรือเข้มงวดกว่า) รวมถึง sandboxing เมื่อเป็นไปได้

### Prompt injection ไม่จำเป็นต้องมี DM สาธารณะ

แม้ว่า **มีเพียงคุณ** ที่ส่งข้อความหา bot ได้ prompt injection ก็ยังเกิดขึ้นได้ผ่าน
**เนื้อหาที่ไม่น่าเชื่อถือ** ใด ๆ ที่ bot อ่าน (ผลลัพธ์ web search/fetch, หน้า browser,
อีเมล, docs, ไฟล์แนบ, log/code ที่วางมา) กล่าวอีกอย่างคือ: ผู้ส่งไม่ใช่
พื้นผิวภัยคุกคามเดียว; **ตัวเนื้อหาเอง** สามารถพกพาคำสั่งเชิงโจมตีได้

เมื่อเปิดใช้เครื่องมือ ความเสี่ยงโดยทั่วไปคือการ exfiltrate context หรือ trigger
tool call ลด blast radius โดย:

- ใช้ **reader agent** แบบ read-only หรือปิดเครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
  แล้วส่งสรุปไปยัง agent หลักของคุณ
- ปิด `web_search` / `web_fetch` / `browser` สำหรับ agent ที่เปิดใช้เครื่องมือ เว้นแต่จำเป็น
- สำหรับ input URL ของ OpenResponses (`input_file` / `input_image`) ให้ตั้ง
  `gateway.http.endpoints.responses.files.urlAllowlist` และ
  `gateway.http.endpoints.responses.images.urlAllowlist` ให้เข้มงวด และรักษา `maxUrlParts` ให้ต่ำ
  allowlists ว่างจะถูกถือว่าไม่ได้ตั้งค่า; ใช้ `files.allowUrl: false` / `images.allowUrl: false`
  หากต้องการปิดการ fetch URL ทั้งหมด
- สำหรับ input ไฟล์ของ OpenResponses ข้อความ `input_file` ที่ decode แล้วจะยังถูก inject เป็น
  **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** อย่าพึ่งพาว่าข้อความไฟล์นั้นเชื่อถือได้เพียงเพราะ
  Gateway decode ในเครื่องแล้ว block ที่ถูก inject ยังคงมี marker ขอบเขต
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` อย่างชัดเจน พร้อม metadata `Source: External`
  แม้ path นี้จะละ banner `SECURITY NOTICE:` ที่ยาวกว่า
- การห่อด้วย marker แบบเดียวกันถูกใช้เมื่อ media-understanding ดึงข้อความ
  จากเอกสารแนบก่อนต่อท้ายข้อความนั้นเข้าไปใน media prompt
- เปิดใช้ sandboxing และ strict tool allowlists สำหรับ agent ใด ๆ ที่แตะ input ที่ไม่น่าเชื่อถือ
- เก็บความลับออกจาก prompt; ส่งผ่าน env/config บน gateway host แทน

### Backend LLM แบบ self-hosted

Backend แบบ self-hosted ที่เข้ากันได้กับ OpenAI เช่น vLLM, SGLang, TGI, LM Studio,
หรือ stack tokenizer ของ Hugging Face แบบกำหนดเอง อาจต่างจาก provider แบบ hosted ในวิธีจัดการ
special token ของ chat-template หาก backend tokenize string literal
เช่น `<|im_start|>`, `<|start_header_id|>` หรือ `<start_of_turn>` เป็น
token เชิงโครงสร้างของ chat-template ภายในเนื้อหาผู้ใช้ ข้อความที่ไม่น่าเชื่อถืออาจพยายาม
ปลอมขอบเขตบทบาทที่ชั้น tokenizer

OpenClaw จะลบ literal ของ special-token ทั่วไปตามกลุ่มโมเดลออกจาก
เนื้อหาภายนอกที่ถูกห่อไว้ก่อน dispatch ไปยังโมเดล เปิดการห่อเนื้อหาภายนอกไว้
และควรใช้การตั้งค่า backend ที่ split หรือ escape special
token ในเนื้อหาที่ผู้ใช้ให้มาเมื่อมีให้ใช้ Provider แบบ hosted เช่น OpenAI
และ Anthropic ใช้การทำความสะอาดฝั่ง request ของตัวเองอยู่แล้ว

### ความแข็งแกร่งของโมเดล (หมายเหตุด้านความปลอดภัย)

ความต้านทานต่อ prompt injection **ไม่** สม่ำเสมอข้าม tier ของโมเดล โมเดลที่เล็กกว่า/ถูกกว่ามักไวต่อการใช้เครื่องมือในทางที่ผิดและการ hijack คำสั่งมากกว่า โดยเฉพาะภายใต้ prompt เชิงโจมตี

<Warning>
สำหรับ agent ที่เปิดใช้เครื่องมือหรือ agent ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ ความเสี่ยง prompt-injection กับโมเดลเก่า/เล็กกว่ามักสูงเกินไป อย่ารัน workload เหล่านั้นบน tier โมเดลที่อ่อน
</Warning>

คำแนะนำ:

- **ใช้โมเดลรุ่นล่าสุดใน tier ที่ดีที่สุด** สำหรับ bot ใด ๆ ที่สามารถรันเครื่องมือหรือแตะไฟล์/เครือข่ายได้
- **อย่าใช้ tier ที่เก่ากว่า/อ่อนกว่า/เล็กกว่า** สำหรับ agent ที่เปิดใช้เครื่องมือหรือ inbox ที่ไม่น่าเชื่อถือ; ความเสี่ยง prompt-injection สูงเกินไป
- หากจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ **ลด blast radius** (เครื่องมือ read-only, sandboxing ที่แข็งแกร่ง, การเข้าถึงระบบไฟล์น้อยที่สุด, allowlists ที่เข้มงวด)
- เมื่อรันโมเดลขนาดเล็ก ให้ **เปิดใช้ sandboxing สำหรับทุก session** และ **ปิด web_search/web_fetch/browser** เว้นแต่ input จะถูกควบคุมอย่างเข้มงวด
- สำหรับผู้ช่วยส่วนตัวแบบ chat-only ที่มี input เชื่อถือได้และไม่มีเครื่องมือ โมเดลที่เล็กกว่ามักใช้ได้

## Reasoning และเอาต์พุต verbose ในกลุ่ม

`/reasoning`, `/verbose` และ `/trace` สามารถเปิดเผย reasoning ภายใน เอาต์พุตของเครื่องมือ
หรือ diagnostics ของ Plugin ที่
ไม่ได้ตั้งใจให้ไปยังช่องทางสาธารณะ ในบริบทกลุ่ม ให้ถือว่าเป็น **debug
เท่านั้น** และปิดไว้ เว้นแต่คุณจำเป็นต้องใช้จริง ๆ

แนวทาง:

- ปิด `/reasoning`, `/verbose` และ `/trace` ไว้ในห้องสาธารณะ
- หากคุณเปิดใช้ ให้ทำเฉพาะใน DM ที่เชื่อถือได้หรือห้องที่ควบคุมอย่างเข้มงวด
- จำไว้ว่า: เอาต์พุต verbose และ trace อาจรวม args ของเครื่องมือ, URLs, diagnostics ของ Plugin และข้อมูลที่โมเดลเห็น

## ตัวอย่างการ hardening configuration

### สิทธิ์ไฟล์

เก็บ config + state ให้เป็นส่วนตัวบน gateway host:

- `~/.openclaw/openclaw.json`: `600` (ผู้ใช้อ่าน/เขียนได้เท่านั้น)
- `~/.openclaw`: `700` (ผู้ใช้เท่านั้น)

`openclaw doctor` สามารถเตือนและเสนอให้ปรับสิทธิ์เหล่านี้ให้เข้มงวดขึ้น

### การเปิดเผยเครือข่าย (bind, port, firewall)

Gateway multiplex **WebSocket + HTTP** บน port เดียว:

- ค่าเริ่มต้น: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

พื้นผิว HTTP นี้รวมถึง Control UI และ canvas host:

- Control UI (SPA assets) (base path ค่าเริ่มต้น `/`)
- Canvas host: `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/` (HTML/JS ตามอำเภอใจ; ถือว่าเป็นเนื้อหาที่ไม่น่าเชื่อถือ)

หากคุณโหลดเนื้อหา canvas ใน browser ปกติ ให้ถือว่าเหมือนหน้าเว็บที่ไม่น่าเชื่อถืออื่น ๆ:

- อย่าเปิดเผย canvas host ต่อเครือข่าย/ผู้ใช้ที่ไม่น่าเชื่อถือ
- อย่าทำให้เนื้อหา canvas ใช้ origin เดียวกับพื้นผิวเว็บที่มีสิทธิ์สูง เว้นแต่คุณเข้าใจผลกระทบอย่างถ่องแท้

โหมด bind ควบคุมว่า Gateway ฟังที่ใด:

- `gateway.bind: "loopback"` (ค่าเริ่มต้น): เฉพาะ client ในเครื่องเท่านั้นที่เชื่อมต่อได้
- bind ที่ไม่ใช่ loopback (`"lan"`, `"tailnet"`, `"custom"`) ขยายพื้นผิวการโจมตี ใช้เฉพาะพร้อม gateway auth (shared token/password หรือ trusted proxy ที่กำหนดค่าอย่างถูกต้อง) และ firewall จริง

หลักปฏิบัติทั่วไป:

- ควรใช้ Tailscale Serve แทน LAN binds (Serve ทำให้ Gateway อยู่บน local loopback และ Tailscale จัดการการเข้าถึง)
- หากจำเป็นต้อง bind ไปยัง LAN ให้ firewall port ให้เหลือ allowlist ของ source IP ที่แคบ; อย่า port-forward แบบกว้าง
- อย่าเปิดเผย Gateway แบบไม่มีการยืนยันตัวตนบน `0.0.0.0`

### การ publish port ของ Docker ด้วย UFW

หากคุณรัน OpenClaw ด้วย Docker บน VPS โปรดจำว่า port ของ container ที่ publish
(`-p HOST:CONTAINER` หรือ Compose `ports:`) จะถูก route ผ่าน forwarding
chain ของ Docker ไม่ใช่เฉพาะกฎ `INPUT` ของ host

เพื่อให้ traffic ของ Docker สอดคล้องกับนโยบาย firewall ของคุณ ให้บังคับใช้กฎใน
`DOCKER-USER` (chain นี้ถูกประเมินก่อนกฎ accept ของ Docker เอง)
บน distro สมัยใหม่จำนวนมาก `iptables`/`ip6tables` ใช้ frontend `iptables-nft`
และยังคงใช้กฎเหล่านี้กับ backend nftables

ตัวอย่าง allowlist ขั้นต่ำ (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
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

IPv6 มีตารางแยกต่างหาก เพิ่มนโยบายที่ตรงกันใน `/etc/ufw/after6.rules` หาก
เปิดใช้ Docker IPv6

หลีกเลี่ยงการ hardcode ชื่อ interface เช่น `eth0` ใน snippet ของ docs ชื่อ interface
แตกต่างกันไปตาม image ของ VPS (`ens3`, `enp*` ฯลฯ) และการไม่ตรงกันอาจทำให้
ข้ามกฎ deny ของคุณโดยไม่ตั้งใจ

การตรวจสอบอย่างรวดเร็วหลัง reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

port ภายนอกที่คาดหวังควรมีเฉพาะสิ่งที่คุณตั้งใจเปิดเผย (สำหรับ setup ส่วนใหญ่:
SSH + port ของ reverse proxy ของคุณ)

### การค้นพบ mDNS/Bonjour

เมื่อเปิดใช้ Plugin `bonjour` ที่ bundle มา Gateway จะ broadcast การมีอยู่ของมันผ่าน mDNS (`_openclaw-gw._tcp` บน port 5353) สำหรับการค้นหาอุปกรณ์ในเครื่อง ในโหมด full สิ่งนี้รวมถึง TXT record ที่อาจเปิดเผยรายละเอียดการปฏิบัติงาน:

- `cliPath`: พาธระบบไฟล์แบบเต็มไปยังไบนารี CLI (เปิดเผยชื่อผู้ใช้และตำแหน่งติดตั้ง)
- `sshPort`: ประกาศความพร้อมใช้งานของ SSH บนโฮสต์
- `displayName`, `lanHost`: ข้อมูลชื่อโฮสต์

**ข้อพิจารณาด้านความปลอดภัยในการปฏิบัติการ:** การกระจายรายละเอียดโครงสร้างพื้นฐานทำให้ทุกคนบนเครือข่ายภายในทำ reconnaissance ได้ง่ายขึ้น แม้ข้อมูลที่ดู "ไม่เป็นอันตราย" เช่นพาธระบบไฟล์และความพร้อมใช้งานของ SSH ก็ช่วยให้ผู้โจมตีทำแผนผังสภาพแวดล้อมของคุณได้

**คำแนะนำ:**

1. **ปิดใช้งาน Bonjour ไว้ เว้นแต่จำเป็นต้องใช้การค้นพบบน LAN** Bonjour เริ่มทำงานอัตโนมัติบนโฮสต์ macOS และเป็นแบบต้องเลือกเปิดใช้บนที่อื่น URL ของ Gateway โดยตรง, Tailnet, SSH หรือ DNS-SD แบบพื้นที่กว้างจะหลีกเลี่ยง local multicast

2. **โหมดขั้นต่ำ** (ค่าเริ่มต้นเมื่อเปิดใช้ Bonjour และแนะนำสำหรับ Gateway ที่เปิดเผยออกมา): ละเว้นฟิลด์ที่ละเอียดอ่อนจากการกระจาย mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **ปิดโหมด mDNS** หากคุณต้องการเปิดใช้ Plugin ไว้แต่ระงับการค้นพบอุปกรณ์ภายใน:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **โหมดเต็ม** (ต้องเลือกเปิดใช้): รวม `cliPath` + `sshPort` ในระเบียน TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **ตัวแปรสภาพแวดล้อม** (ทางเลือก): ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=1` เพื่อปิดใช้งาน mDNS โดยไม่ต้องเปลี่ยน config

เมื่อเปิดใช้ Bonjour ในโหมดขั้นต่ำ Gateway จะกระจายข้อมูลเพียงพอสำหรับการค้นพบอุปกรณ์ (`role`, `gatewayPort`, `transport`) แต่จะละเว้น `cliPath` และ `sshPort` แอปที่ต้องการข้อมูลพาธ CLI สามารถดึงข้อมูลผ่านการเชื่อมต่อ WebSocket ที่ผ่านการยืนยันตัวตนแทนได้

### ล็อก Gateway WebSocket ให้แน่นหนา (การยืนยันตัวตนภายใน)

การยืนยันตัวตนของ Gateway **จำเป็นตามค่าเริ่มต้น** หากไม่มีการกำหนดค่าพาธการยืนยันตัวตนของ gateway ที่ถูกต้อง
Gateway จะปฏิเสธการเชื่อมต่อ WebSocket (ปิดเมื่อผิดพลาด)

Onboarding จะสร้างโทเค็นตามค่าเริ่มต้น (แม้สำหรับ loopback) ดังนั้น
ไคลเอนต์ภายในต้องยืนยันตัวตน

ตั้งค่าโทเค็นเพื่อให้ไคลเอนต์ WS **ทั้งหมด** ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor สามารถสร้างให้คุณได้: `openclaw doctor --generate-gateway-token`

<Note>
`gateway.remote.token` และ `gateway.remote.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์ สิ่งเหล่านี้ **ไม่ได้** ปกป้องการเข้าถึง WS ภายในด้วยตัวเอง พาธการเรียกภายในสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*` หากกำหนดค่า `gateway.auth.token` หรือ `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง)
</Note>
ทางเลือก: ปักหมุด TLS ระยะไกลด้วย `gateway.remote.tlsFingerprint` เมื่อใช้ `wss://`
ข้อความธรรมดา `ws://` เป็นแบบ loopback-only ตามค่าเริ่มต้น สำหรับพาธเครือข่ายส่วนตัวที่เชื่อถือได้
ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บนโปรเซสไคลเอนต์เป็น
ทางออกฉุกเฉิน สิ่งนี้ตั้งใจให้เป็นสภาพแวดล้อมของโปรเซสเท่านั้น ไม่ใช่คีย์ config
`openclaw.json`
การจับคู่มือถือและเส้นทาง Gateway ของ Android แบบป้อนเองหรือสแกนเข้มงวดกว่า:
ยอมรับ cleartext สำหรับ loopback แต่ private-LAN, link-local, `.local` และ
ชื่อโฮสต์ที่ไม่มีจุดต้องใช้ TLS เว้นแต่คุณจะเลือกใช้พาธ cleartext ของ
เครือข่ายส่วนตัวที่เชื่อถือได้อย่างชัดเจน

การจับคู่อุปกรณ์ภายใน:

- การจับคู่อุปกรณ์ได้รับการอนุมัติอัตโนมัติสำหรับการเชื่อมต่อ local loopback โดยตรงเพื่อให้
  ไคลเอนต์บนโฮสต์เดียวกันใช้งานได้ราบรื่น
- OpenClaw ยังมีพาธ self-connect แบบ backend/container-local ที่แคบสำหรับ
  โฟลว์ตัวช่วย shared-secret ที่เชื่อถือได้
- การเชื่อมต่อ Tailnet และ LAN รวมถึง same-host tailnet binds จะถือเป็น
  ระยะไกลสำหรับการจับคู่และยังต้องได้รับการอนุมัติ
- หลักฐาน forwarded-header ในคำขอ loopback จะทำให้คุณสมบัติความเป็น
  loopback locality ถูกตัดสิทธิ์ การอนุมัติอัตโนมัติสำหรับ metadata-upgrade มีขอบเขตแคบ ดู
  [การจับคู่ Gateway](/th/gateway/pairing) สำหรับทั้งสองกฎ

โหมดการยืนยันตัวตน:

- `gateway.auth.mode: "token"`: โทเค็น bearer ที่ใช้ร่วมกัน (แนะนำสำหรับการตั้งค่าส่วนใหญ่)
- `gateway.auth.mode: "password"`: การยืนยันตัวตนด้วยรหัสผ่าน (ควรตั้งค่าผ่าน env: `OPENCLAW_GATEWAY_PASSWORD`)
- `gateway.auth.mode: "trusted-proxy"`: เชื่อถือ reverse proxy ที่รู้ตัวตนเพื่อยืนยันตัวตนผู้ใช้และส่งตัวตนผ่าน headers (ดู [การยืนยันตัวตนด้วย Trusted Proxy](/th/gateway/trusted-proxy-auth))

รายการตรวจสอบการหมุนเวียน (โทเค็น/รหัสผ่าน):

1. สร้าง/ตั้งค่า secret ใหม่ (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_PASSWORD`)
2. รีสตาร์ท Gateway (หรือรีสตาร์ทแอป macOS หากแอปนั้นดูแล Gateway)
3. อัปเดตไคลเอนต์ระยะไกลใดๆ (`gateway.remote.token` / `.password` บนเครื่องที่เรียกเข้า Gateway)
4. ตรวจสอบว่าคุณไม่สามารถเชื่อมต่อด้วยข้อมูลรับรองเดิมได้อีกต่อไป

### Headers ตัวตนของ Tailscale Serve

เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ค่าเริ่มต้นสำหรับ Serve), OpenClaw
ยอมรับ headers ตัวตนของ Tailscale Serve (`tailscale-user-login`) สำหรับการยืนยันตัวตน Control
UI/WebSocket OpenClaw ตรวจสอบตัวตนโดยแก้ที่อยู่
`x-forwarded-for` ผ่าน daemon Tailscale ภายใน (`tailscale whois`)
และจับคู่กับ header สิ่งนี้จะทริกเกอร์เฉพาะคำขอที่เข้าถึง loopback
และมี `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ตามที่
Tailscale ฉีดเข้ามา
สำหรับพาธตรวจสอบตัวตนแบบ async นี้ ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกัน
จะถูกจัดลำดับก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้นการลองซ้ำที่ผิดพร้อมกัน
จากไคลเอนต์ Serve เดียวจึงสามารถล็อกความพยายามครั้งที่สองทันที
แทนที่จะแข่งผ่านไปเป็น mismatch ปกติสองครั้ง
HTTP API endpoints (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนผ่าน identity-header ของ Tailscale สิ่งเหล่านี้ยังคงทำตามโหมด
การยืนยันตัวตน HTTP ที่กำหนดค่าของ gateway

หมายเหตุขอบเขตสำคัญ:

- การยืนยันตัวตน bearer ของ HTTP บน Gateway เท่ากับการเข้าถึงผู้ปฏิบัติงานแบบทั้งหมดหรือไม่มีเลย
- ปฏิบัติต่อข้อมูลรับรองที่เรียก `/v1/chat/completions`, `/v1/responses` หรือ `/api/channels/*` ได้ว่าเป็น operator secrets ที่มีสิทธิ์เต็มสำหรับ Gateway นั้น
- บนพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI การยืนยันตัวตน bearer ด้วย shared-secret จะคืนค่า scopes ผู้ปฏิบัติงานค่าเริ่มต้นแบบเต็ม (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) และ semantics ของเจ้าของสำหรับ agent turns; ค่า `x-openclaw-scopes` ที่แคบกว่าจะไม่ลดพาธ shared-secret นั้น
- Semantics ของ scope ต่อคำขอบน HTTP ใช้เฉพาะเมื่อคำขอมาจากโหมดที่มีตัวตน เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress
- ในโหมดที่มีตัวตนเหล่านั้น การละเว้น `x-openclaw-scopes` จะ fallback เป็นชุด scope ค่าเริ่มต้นปกติของผู้ปฏิบัติงาน; ส่ง header อย่างชัดเจนเมื่อคุณต้องการชุด scope ที่แคบกว่า
- `/tools/invoke` ทำตามกฎ shared-secret เดียวกัน: การยืนยันตัวตน bearer ด้วย token/password จะถือเป็นการเข้าถึงผู้ปฏิบัติงานเต็มเช่นกัน ขณะที่โหมดที่มีตัวตนยังคงเคารพ scopes ที่ประกาศไว้
- อย่าแชร์ข้อมูลรับรองเหล่านี้กับผู้เรียกที่ไม่น่าเชื่อถือ; ควรใช้ Gateway แยกต่อขอบเขตความเชื่อถือ

**สมมติฐานความเชื่อถือ:** การยืนยันตัวตน Serve แบบไม่มีโทเค็นถือว่าโฮสต์ Gateway เชื่อถือได้
อย่าถือว่าสิ่งนี้เป็นการป้องกันโปรเซสบนโฮสต์เดียวกันที่เป็นอันตราย หากโค้ดภายใน
ที่ไม่น่าเชื่อถืออาจทำงานบนโฮสต์ Gateway ให้ปิดใช้งาน `gateway.auth.allowTailscale`
และบังคับใช้การยืนยันตัวตน shared-secret อย่างชัดเจนด้วย `gateway.auth.mode: "token"` หรือ
`"password"`

**กฎความปลอดภัย:** อย่าส่งต่อ headers เหล่านี้จาก reverse proxy ของคุณเอง หาก
คุณ terminate TLS หรือ proxy อยู่หน้า Gateway ให้ปิดใช้งาน
`gateway.auth.allowTailscale` และใช้การยืนยันตัวตน shared-secret (`gateway.auth.mode:
"token"` หรือ `"password"`) หรือ [การยืนยันตัวตนด้วย Trusted Proxy](/th/gateway/trusted-proxy-auth)
แทน

Trusted proxies:

- หากคุณ terminate TLS อยู่หน้า Gateway ให้ตั้งค่า `gateway.trustedProxies` เป็น IP ของ proxy ของคุณ
- OpenClaw จะเชื่อถือ `x-forwarded-for` (หรือ `x-real-ip`) จาก IP เหล่านั้นเพื่อกำหนด IP ของไคลเอนต์สำหรับการตรวจสอบการจับคู่ภายในและการตรวจสอบ HTTP auth/local
- ตรวจสอบให้แน่ใจว่า proxy ของคุณ **เขียนทับ** `x-forwarded-for` และบล็อกการเข้าถึงพอร์ต Gateway โดยตรง

ดู [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

### การควบคุมเบราว์เซอร์ผ่าน node host (แนะนำ)

หาก Gateway ของคุณอยู่ระยะไกลแต่เบราว์เซอร์ทำงานบนอีกเครื่อง ให้รัน **node host**
บนเครื่องเบราว์เซอร์และให้ Gateway proxy การกระทำของเบราว์เซอร์ (ดู [เครื่องมือเบราว์เซอร์](/th/tools/browser))
ปฏิบัติต่อการจับคู่ node เหมือนการเข้าถึง admin

รูปแบบที่แนะนำ:

- ให้ Gateway และ node host อยู่บน tailnet เดียวกัน (Tailscale)
- จับคู่ node อย่างตั้งใจ; ปิดใช้งาน browser proxy routing หากคุณไม่ต้องการใช้

หลีกเลี่ยง:

- การเปิดเผยพอร์ต relay/control ผ่าน LAN หรืออินเทอร์เน็ตสาธารณะ
- Tailscale Funnel สำหรับ endpoint การควบคุมเบราว์เซอร์ (การเปิดเผยสาธารณะ)

### Secrets บนดิสก์

ถือว่าสิ่งใดก็ตามภายใต้ `~/.openclaw/` (หรือ `$OPENCLAW_STATE_DIR/`) อาจมี secrets หรือข้อมูลส่วนตัว:

- `openclaw.json`: config อาจมีโทเค็น (gateway, remote gateway), การตั้งค่าผู้ให้บริการ และ allowlists
- `credentials/**`: ข้อมูลรับรองช่องทาง (ตัวอย่าง: creds ของ WhatsApp), allowlists การจับคู่, การนำเข้า OAuth legacy
- `agents/<agentId>/agent/auth-profiles.json`: API keys, token profiles, OAuth tokens และ `keyRef`/`tokenRef` ที่เป็นทางเลือก
- `agents/<agentId>/agent/codex-home/**`: บัญชี app-server ของ Codex ต่อ agent, config, Skills, plugins, สถานะ thread ดั้งเดิม และ diagnostics
- `secrets.json` (ทางเลือก): payload secret ที่อิงไฟล์ ซึ่งใช้โดยผู้ให้บริการ SecretRef แบบ `file` (`secrets.providers`)
- `agents/<agentId>/agent/auth.json`: ไฟล์ compatibility legacy รายการ `api_key` แบบ static จะถูก scrub เมื่อตรวจพบ
- `agents/<agentId>/sessions/**`: transcripts ของ session (`*.jsonl`) + metadata การ routing (`sessions.json`) ที่อาจมีข้อความส่วนตัวและเอาต์พุตเครื่องมือ
- bundled plugin packages: plugins ที่ติดตั้งแล้ว (รวมถึง `node_modules/` ของพวกมัน)
- `sandboxes/**`: workspace sandbox ของเครื่องมือ; อาจสะสมสำเนาไฟล์ที่คุณอ่าน/เขียนภายใน sandbox

เคล็ดลับการเสริมความแข็งแรง:

- รักษา permission ให้เข้มงวด (`700` บน dirs, `600` บน files)
- ใช้การเข้ารหัสดิสก์ทั้งลูกบนโฮสต์ Gateway
- ควรใช้บัญชีผู้ใช้ OS เฉพาะสำหรับ Gateway หากโฮสต์ถูกแชร์

### ไฟล์ `.env` ของ Workspace

OpenClaw โหลดไฟล์ `.env` ภายใน workspace สำหรับ agents และ tools แต่จะไม่ยอมให้ไฟล์เหล่านั้น override การควบคุม runtime ของ Gateway อย่างเงียบๆ

- คีย์ใดๆ ที่ขึ้นต้นด้วย `OPENCLAW_*` จะถูกบล็อกจากไฟล์ `.env` ของ workspace ที่ไม่น่าเชื่อถือ
- การตั้งค่า endpoint ของช่องทางสำหรับ Matrix, Mattermost, IRC และ Synology Chat จะถูกบล็อกจากการ override ผ่าน `.env` ของ workspace เช่นกัน ดังนั้น workspace ที่ clone มาจึงไม่สามารถ redirect traffic ของ bundled connector ผ่าน config endpoint ภายในได้ คีย์ env ของ endpoint (เช่น `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) ต้องมาจากสภาพแวดล้อมของโปรเซส Gateway หรือ `env.shellEnv` ไม่ใช่จาก `.env` ที่โหลดจาก workspace
- การบล็อกเป็นแบบ fail-closed: ตัวแปร runtime-control ใหม่ที่เพิ่มในรุ่นอนาคตไม่สามารถถูกสืบทอดจาก `.env` ที่ check-in หรือผู้โจมตีจัดหาให้ได้; คีย์จะถูกละเว้นและ Gateway จะรักษาค่าของตัวเองไว้
- ตัวแปรสภาพแวดล้อมของโปรเซส/OS ที่เชื่อถือได้ (shell ของ Gateway เอง, launchd/systemd unit, app bundle) ยังคงมีผล - สิ่งนี้จำกัดเฉพาะการโหลดไฟล์ `.env`

เหตุผล: ไฟล์ `.env` ของ workspace มักอยู่ข้างโค้ด agent, ถูก commit โดยไม่ตั้งใจ หรือถูกเขียนโดยเครื่องมือ การบล็อก prefix `OPENCLAW_*` ทั้งหมดหมายความว่าการเพิ่ม flag `OPENCLAW_*` ใหม่ภายหลังจะไม่มีทางถดถอยไปสู่การสืบทอดจากสถานะ workspace อย่างเงียบๆ

### Logs และ transcripts (การปกปิดข้อมูลและการเก็บรักษา)

Logs และ transcripts อาจรั่วไหลข้อมูลที่ละเอียดอ่อนได้แม้เมื่อการควบคุมการเข้าถึงถูกต้อง:

- Logs ของ Gateway อาจมีสรุปเครื่องมือ ข้อผิดพลาด และ URLs
- Session transcripts อาจมี secrets ที่วางไว้, เนื้อหาไฟล์, เอาต์พุตคำสั่ง และลิงก์

คำแนะนำ:

- เปิดการปกปิดข้อมูลของ log และ transcript ไว้ (`logging.redactSensitive: "tools"`; ค่าเริ่มต้น)
- เพิ่มรูปแบบกำหนดเองสำหรับสภาพแวดล้อมของคุณผ่าน `logging.redactPatterns` (โทเค็น, ชื่อโฮสต์, URLs ภายใน)
- เมื่อแชร์ diagnostics ควรใช้ `openclaw status --all` (วางได้, secrets ถูกปกปิด) แทน raw logs
- ล้าง session transcripts และไฟล์ log เก่าหากคุณไม่ต้องการเก็บรักษาระยะยาว

รายละเอียด: [Logging](/th/gateway/logging)

### DMs: จับคู่ตามค่าเริ่มต้น

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Groups: ต้องมี mention ทุกที่

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

ในแชตกลุ่ม ให้ตอบกลับเฉพาะเมื่อมีการกล่าวถึงอย่างชัดเจนเท่านั้น

### แยกหมายเลข (WhatsApp, Signal, Telegram)

สำหรับช่องทางที่อิงหมายเลขโทรศัพท์ ให้พิจารณาใช้งาน AI ของคุณบนหมายเลขโทรศัพท์ที่แยกจากหมายเลขส่วนตัว:

- หมายเลขส่วนตัว: การสนทนาของคุณยังคงเป็นส่วนตัว
- หมายเลขบอต: AI จัดการหมายเลขเหล่านี้ พร้อมขอบเขตที่เหมาะสม

### โหมดอ่านอย่างเดียว (ผ่าน sandbox และเครื่องมือ)

คุณสามารถสร้างโปรไฟล์อ่านอย่างเดียวได้โดยการรวม:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (หรือ `"none"` หากไม่ต้องการให้เข้าถึงพื้นที่ทำงาน)
- รายการอนุญาต/ปฏิเสธเครื่องมือที่บล็อก `write`, `edit`, `apply_patch`, `exec`, `process` ฯลฯ

ตัวเลือกเพิ่มความแข็งแรงเพิ่มเติม:

- `tools.exec.applyPatch.workspaceOnly: true` (ค่าเริ่มต้น): ทำให้แน่ใจว่า `apply_patch` ไม่สามารถเขียน/ลบนอกไดเรกทอรีพื้นที่ทำงานได้ แม้เมื่อปิด sandboxing ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` แตะไฟล์นอกพื้นที่ทำงานเท่านั้น
- `tools.fs.workspaceOnly: true` (ไม่บังคับ): จำกัดพาธ `read`/`write`/`edit`/`apply_patch` และพาธโหลดรูปภาพใน prompt แบบ native อัตโนมัติให้อยู่ในไดเรกทอรีพื้นที่ทำงาน (มีประโยชน์หากวันนี้คุณอนุญาตพาธแบบ absolute และต้องการรั้วป้องกันเดียว)
- จำกัดรากของระบบไฟล์ให้แคบ: หลีกเลี่ยงรากที่กว้าง เช่น ไดเรกทอรี home ของคุณ สำหรับพื้นที่ทำงานของ agent/พื้นที่ทำงาน sandbox รากที่กว้างอาจเปิดเผยไฟล์ภายในเครื่องที่ละเอียดอ่อน (เช่น state/config ใต้ `~/.openclaw`) ให้กับเครื่องมือระบบไฟล์

### ค่าพื้นฐานที่ปลอดภัย (คัดลอก/วาง)

คอนฟิก "ค่าเริ่มต้นที่ปลอดภัย" แบบหนึ่งที่ทำให้ Gateway เป็นส่วนตัว ต้องมีการจับคู่ DM และหลีกเลี่ยงบอตกลุ่มที่เปิดตลอดเวลา:

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

หากคุณต้องการให้การเรียกใช้เครื่องมือ "ปลอดภัยกว่าเป็นค่าเริ่มต้น" ด้วย ให้เพิ่ม sandbox + ปฏิเสธเครื่องมืออันตรายสำหรับ agent ที่ไม่ใช่เจ้าของ (ตัวอย่างด้านล่างใน "โปรไฟล์การเข้าถึงราย agent")

ค่าพื้นฐานในตัวสำหรับรอบการทำงานของ agent ที่ขับเคลื่อนด้วยแชต: ผู้ส่งที่ไม่ใช่เจ้าของไม่สามารถใช้เครื่องมือ `cron` หรือ `gateway` ได้

## Sandboxing (แนะนำ)

เอกสารเฉพาะ: [Sandboxing](/th/gateway/sandboxing)

สองแนวทางที่เสริมกัน:

- **เรียกใช้ Gateway ทั้งหมดใน Docker** (ขอบเขตของคอนเทนเนอร์): [Docker](/th/install/docker)
- **sandbox ของเครื่องมือ** (`agents.defaults.sandbox`, host gateway + เครื่องมือที่แยกด้วย sandbox; Docker คือ backend ค่าเริ่มต้น): [Sandboxing](/th/gateway/sandboxing)

<Note>
เพื่อป้องกันการเข้าถึงข้าม agent ให้คง `agents.defaults.sandbox.scope` ไว้ที่ `"agent"` (ค่าเริ่มต้น) หรือ `"session"` สำหรับการแยกต่อ session ที่เข้มงวดกว่า `scope: "shared"` ใช้คอนเทนเนอร์หรือพื้นที่ทำงานเดียว
</Note>

พิจารณาการเข้าถึงพื้นที่ทำงานของ agent ภายใน sandbox ด้วย:

- `agents.defaults.sandbox.workspaceAccess: "none"` (ค่าเริ่มต้น) ทำให้พื้นที่ทำงานของ agent ถูกห้ามเข้าถึง; เครื่องมือทำงานกับพื้นที่ทำงาน sandbox ใต้ `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` เมานต์พื้นที่ทำงานของ agent แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้งาน `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` เมานต์พื้นที่ทำงานของ agent แบบอ่าน/เขียนที่ `/workspace`
- `sandbox.docker.binds` เพิ่มเติมจะถูกตรวจสอบเทียบกับพาธต้นทางที่ normalize และ canonicalize แล้ว เทคนิค parent-symlink และ alias ของ home แบบ canonical ยังคงถูกปิดกั้นอย่างปลอดภัยหาก resolve เข้าไปยังรากที่ถูกบล็อก เช่น `/etc`, `/var/run` หรือไดเรกทอรีข้อมูลรับรองใต้ home ของ OS

<Warning>
`tools.elevated` คือช่องทางหลบออกจากค่าพื้นฐานระดับ global ที่เรียกใช้ exec นอก sandbox host ที่มีผลคือ `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อกำหนด target ของ exec เป็น `node` จำกัด `tools.elevated.allowFrom` ให้แน่นและอย่าเปิดให้คนแปลกหน้า คุณสามารถจำกัด elevated เพิ่มเติมต่อ agent ได้ผ่าน `agents.list[].tools.elevated` ดู [โหมด Elevated](/th/tools/elevated)
</Warning>

### รั้วป้องกันการมอบหมาย sub-agent

หากคุณอนุญาตเครื่องมือ session ให้ถือว่าการรัน sub-agent ที่ถูกมอบหมายเป็นการตัดสินใจเรื่องขอบเขตอีกชั้นหนึ่ง:

- ปฏิเสธ `sessions_spawn` เว้นแต่ agent ต้องการการมอบหมายจริง ๆ
- จำกัด `agents.defaults.subagents.allowAgents` และ override `agents.list[].subagents.allowAgents` ราย agent ใด ๆ ให้อยู่เฉพาะ target agents ที่ทราบว่าปลอดภัย
- สำหรับ workflow ใด ๆ ที่ต้องคงอยู่ใน sandbox ให้เรียก `sessions_spawn` ด้วย `sandbox: "require"` (ค่าเริ่มต้นคือ `inherit`)
- `sandbox: "require"` จะล้มเหลวอย่างรวดเร็วเมื่อ runtime ของ child เป้าหมายไม่ได้อยู่ใน sandbox

## ความเสี่ยงของการควบคุมเบราว์เซอร์

การเปิดใช้การควบคุมเบราว์เซอร์ทำให้โมเดลสามารถขับเบราว์เซอร์จริงได้
หากโปรไฟล์เบราว์เซอร์นั้นมี session ที่ล็อกอินอยู่แล้ว โมเดลสามารถ
เข้าถึงบัญชีและข้อมูลเหล่านั้นได้ ให้ถือว่าโปรไฟล์เบราว์เซอร์เป็น **สถานะที่ละเอียดอ่อน**:

- ควรใช้โปรไฟล์เฉพาะสำหรับ agent (โปรไฟล์ `openclaw` ค่าเริ่มต้น)
- หลีกเลี่ยงการชี้ agent ไปยังโปรไฟล์ส่วนตัวที่คุณใช้ประจำวัน
- ปิดการควบคุมเบราว์เซอร์บน host สำหรับ agent ที่อยู่ใน sandbox เว้นแต่คุณเชื่อถือ agent เหล่านั้น
- API ควบคุมเบราว์เซอร์แบบ loopback แยกต่างหากเคารพเฉพาะการยืนยันตัวตนด้วย shared-secret
  (gateway token bearer auth หรือรหัสผ่าน gateway) ไม่ได้ใช้
  trusted-proxy หรือ header ระบุตัวตน Tailscale Serve
- ถือว่าการดาวน์โหลดจากเบราว์เซอร์เป็น input ที่ไม่น่าเชื่อถือ; ควรใช้ไดเรกทอรีดาวน์โหลดที่แยกไว้
- ปิด browser sync/password managers ในโปรไฟล์ agent หากเป็นไปได้ (ลด blast radius)
- สำหรับ remote gateways ให้ถือว่า "การควบคุมเบราว์เซอร์" เทียบเท่ากับ "สิทธิ์เข้าถึงของผู้ปฏิบัติงาน" ต่อทุกอย่างที่โปรไฟล์นั้นเข้าถึงได้
- จำกัด Gateway และ node hosts ให้อยู่เฉพาะ tailnet; หลีกเลี่ยงการเปิดพอร์ตควบคุมเบราว์เซอร์ต่อ LAN หรืออินเทอร์เน็ตสาธารณะ
- ปิดการกำหนดเส้นทาง proxy ของเบราว์เซอร์เมื่อคุณไม่ต้องการ (`gateway.nodes.browser.mode="off"`)
- โหมด existing-session ของ Chrome MCP **ไม่ใช่** "ปลอดภัยกว่า"; มันสามารถทำหน้าที่เป็นคุณในทุกอย่างที่โปรไฟล์ Chrome บน host นั้นเข้าถึงได้

### นโยบาย SSRF ของเบราว์เซอร์ (เข้มงวดเป็นค่าเริ่มต้น)

นโยบายการนำทางเบราว์เซอร์ของ OpenClaw เข้มงวดเป็นค่าเริ่มต้น: ปลายทาง private/internal จะยังถูกบล็อก เว้นแต่คุณ opt in อย่างชัดเจน

- ค่าเริ่มต้น: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่ถูกตั้งค่า ดังนั้นการนำทางเบราว์เซอร์ยังคงบล็อกปลายทาง private/internal/special-use
- Alias เดิม: `browser.ssrfPolicy.allowPrivateNetwork` ยังยอมรับเพื่อความเข้ากันได้
- โหมด opt-in: ตั้ง `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพื่ออนุญาตปลายทาง private/internal/special-use
- ในโหมดเข้มงวด ให้ใช้ `hostnameAllowlist` (pattern เช่น `*.example.com`) และ `allowedHostnames` (ข้อยกเว้น host แบบตรงตัว รวมถึงชื่อที่ถูกบล็อก เช่น `localhost`) สำหรับข้อยกเว้นที่ชัดเจน
- การนำทางถูกตรวจสอบก่อน request และตรวจซ้ำแบบ best-effort บน URL `http(s)` สุดท้ายหลังการนำทาง เพื่อลดการ pivot ผ่าน redirect

ตัวอย่างนโยบายเข้มงวด:

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

## โปรไฟล์การเข้าถึงราย agent (multi-agent)

ด้วยการกำหนดเส้นทางแบบ multi-agent แต่ละ agent สามารถมี sandbox + นโยบายเครื่องมือของตัวเอง:
ใช้สิ่งนี้เพื่อให้ **สิทธิ์เข้าถึงเต็มรูปแบบ**, **อ่านอย่างเดียว** หรือ **ไม่มีสิทธิ์เข้าถึง** ต่อ agent
ดูรายละเอียดทั้งหมดและกฎ precedence ได้ที่ [Sandbox และเครื่องมือแบบ Multi-Agent](/th/tools/multi-agent-sandbox-tools)

กรณีใช้งานทั่วไป:

- Agent ส่วนตัว: สิทธิ์เข้าถึงเต็มรูปแบบ, ไม่มี sandbox
- Agent ครอบครัว/งาน: อยู่ใน sandbox + เครื่องมืออ่านอย่างเดียว
- Agent สาธารณะ: อยู่ใน sandbox + ไม่มีเครื่องมือระบบไฟล์/shell

### ตัวอย่าง: สิทธิ์เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)

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

### ตัวอย่าง: เครื่องมืออ่านอย่างเดียว + พื้นที่ทำงานอ่านอย่างเดียว

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

### ตัวอย่าง: ไม่มีสิทธิ์เข้าถึงระบบไฟล์/shell (อนุญาตการส่งข้อความของ provider)

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
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
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

หาก AI ของคุณทำบางสิ่งที่ไม่ดี:

### ควบคุมสถานการณ์

1. **หยุดมัน:** หยุดแอป macOS (หากแอปกำกับดูแล Gateway) หรือ terminate process `openclaw gateway` ของคุณ
2. **ปิดการเปิดเผย:** ตั้ง `gateway.bind: "loopback"` (หรือปิดใช้งาน Tailscale Funnel/Serve) จนกว่าคุณจะเข้าใจว่าเกิดอะไรขึ้น
3. **แช่แข็งการเข้าถึง:** สลับ DM/กลุ่มที่มีความเสี่ยงเป็น `dmPolicy: "disabled"` / ต้องมีการกล่าวถึง และลบรายการอนุญาตทั้งหมด `"*"` หากคุณมีรายการเหล่านั้น

### หมุนเวียน (ถือว่าถูก compromise หาก secrets รั่ว)

1. หมุนเวียนการยืนยันตัวตน Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) และเริ่มใหม่
2. หมุนเวียน secrets ของ remote client (`gateway.remote.token` / `.password`) บนเครื่องใด ๆ ที่สามารถเรียก Gateway ได้
3. หมุนเวียนข้อมูลรับรอง provider/API (ข้อมูลรับรอง WhatsApp, โทเคน Slack/Discord, คีย์ model/API ใน `auth-profiles.json` และค่า payload ของ secrets ที่เข้ารหัสเมื่อใช้)

### ตรวจสอบ

1. ตรวจสอบ log ของ Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (หรือ `logging.file`)
2. ตรวจทาน transcript ที่เกี่ยวข้อง: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. ตรวจทานการเปลี่ยนแปลงคอนฟิกล่าสุด (สิ่งใดก็ตามที่อาจขยายการเข้าถึง: `gateway.bind`, `gateway.auth`, นโยบาย dm/group, `tools.elevated`, การเปลี่ยนแปลง Plugin)
4. รัน `openclaw security audit --deep` อีกครั้งและยืนยันว่า findings ระดับ critical ถูกแก้ไขแล้ว

### รวบรวมสำหรับรายงาน

- Timestamp, OS ของ host gateway + เวอร์ชัน OpenClaw
- Transcript ของ session + tail log สั้น ๆ (หลัง redact)
- สิ่งที่ผู้โจมตีส่ง + สิ่งที่ agent ทำ
- Gateway ถูกเปิดเผยเกิน loopback หรือไม่ (LAN/Tailscale Funnel/Serve)

## การสแกน secrets

CI รัน hook pre-commit `detect-private-key` กับ repository หากมัน
ล้มเหลว ให้ลบหรือหมุนเวียน key material ที่ commit ไปแล้ว จากนั้น reproduce ในเครื่อง:

```bash
pre-commit run --all-files detect-private-key
```

## การรายงานปัญหาความปลอดภัย

พบช่องโหว่ใน OpenClaw หรือไม่ โปรดรายงานอย่างรับผิดชอบ:

1. อีเมล: [security@openclaw.ai](mailto:security@openclaw.ai)
2. อย่าโพสต์สาธารณะจนกว่าจะแก้ไขแล้ว
3. เราจะให้เครดิตคุณ (เว้นแต่คุณต้องการไม่เปิดเผยตัวตน)
