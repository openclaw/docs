---
read_when:
    - การเพิ่มฟีเจอร์ที่ขยายการเข้าถึงหรือระบบอัตโนมัติ
summary: ข้อพิจารณาด้านความปลอดภัยและโมเดลภัยคุกคามสำหรับการรัน AI gateway ที่มีสิทธิ์เข้าถึง shell
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-04-26T11:31:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 982a3164178822475c3ac3d871eb83d77c9d7cb0980ad93c781565110755e022
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **โมเดลความเชื่อถือของผู้ช่วยส่วนตัว** คำแนะนำนี้ตั้งอยู่บนสมมติฐานว่า
  มีขอบเขตผู้ปฏิบัติการที่เชื่อถือได้หนึ่งขอบเขตต่อ gateway (โมเดลผู้ใช้คนเดียว
  แบบผู้ช่วยส่วนตัว) OpenClaw **ไม่ใช่** ขอบเขตความปลอดภัยแบบหลายผู้เช่าที่เป็นปฏิปักษ์
  สำหรับผู้ใช้หลายคนที่ไม่ไว้วางใจกันซึ่งใช้ agent หรือ gateway เดียวร่วมกัน
  หากคุณต้องการการทำงานแบบความเชื่อถือปะปนกันหรือมีผู้ใช้เชิงปฏิปักษ์
  ให้แยกขอบเขตความเชื่อถือ (gateway + credentials แยกกัน และควรใช้ OS users หรือ hosts แยกกัน)
</Warning>

## เริ่มจากขอบเขต: โมเดลความปลอดภัยแบบผู้ช่วยส่วนตัว

คำแนะนำด้านความปลอดภัยของ OpenClaw ตั้งอยู่บนสมมติฐานของการติดตั้งแบบ **ผู้ช่วยส่วนตัว**: มีขอบเขตผู้ปฏิบัติการที่เชื่อถือได้หนึ่งขอบเขต และอาจมี agents หลายตัวได้

- แนวทางความปลอดภัยที่รองรับ: ผู้ใช้/ขอบเขตความเชื่อถือหนึ่งรายต่อ gateway หนึ่งตัว (ควรเป็นหนึ่ง OS user/host/VPS ต่อหนึ่งขอบเขต)
- สิ่งที่ไม่ใช่ขอบเขตความปลอดภัยที่รองรับ: gateway/agent ตัวเดียวที่ใช้ร่วมกันโดยผู้ใช้ที่ไม่ไว้วางใจกันหรือเป็นปฏิปักษ์ต่อกัน
- หากต้องการการแยกผู้ใช้เชิงปฏิปักษ์ ให้แยกตามขอบเขตความเชื่อถือ (gateway + credentials แยกกัน และควรใช้ OS users/hosts แยกกัน)
- หากมีผู้ใช้ที่ไม่ไว้วางใจกันหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้ tool ได้หนึ่งตัว ให้ถือว่าพวกเขาใช้สิทธิ์ tool ที่ถูกมอบหมายให้ agent ตัวนั้นร่วมกัน

หน้านี้อธิบายการเสริมความแข็งแกร่ง **ภายในโมเดลนี้** โดยไม่ได้อ้างว่ามีการแยกแบบ hostile multi-tenant บน gateway ที่ใช้ร่วมกันหนึ่งตัว

## ตรวจสอบอย่างรวดเร็ว: `openclaw security audit`

ดูเพิ่มเติม: [Formal Verification (Security Models)](/th/security/formal-verification)

รันสิ่งนี้เป็นประจำ (โดยเฉพาะหลังเปลี่ยน config หรือเปิดพื้นผิวเครือข่าย):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` ถูกจำกัดขอบเขตไว้โดยตั้งใจ: มันจะเปลี่ยน open group
policies ทั่วไปให้เป็น allowlists, กู้คืน `logging.redactSensitive: "tools"`,
ทำให้สิทธิ์ของ state/config/include-file เข้มงวดขึ้น และใช้การรีเซ็ต Windows ACL แทน
POSIX `chmod` เมื่อรันบน Windows

มันจะทำเครื่องหมาย footguns ที่พบบ่อย (การเปิดเผย Gateway auth, การเปิดเผย browser control, elevated allowlists, สิทธิ์ของระบบไฟล์, การอนุมัติ exec ที่ผ่อนเกินไป และการเปิด tool ให้ช่องทางแบบเปิดกว้าง)

OpenClaw เป็นทั้งผลิตภัณฑ์และการทดลอง: คุณกำลังเชื่อมพฤติกรรมของโมเดลระดับ frontier เข้ากับพื้นผิวการส่งข้อความจริงและ tools จริง **ไม่มีการตั้งค่าที่ “ปลอดภัยสมบูรณ์แบบ”** เป้าหมายคือการตั้งใจให้ชัดเจนเกี่ยวกับ:

- ใครบ้างที่สามารถคุยกับบอตของคุณได้
- บอตได้รับอนุญาตให้ทำงานที่ไหน
- บอตสามารถแตะต้องอะไรได้บ้าง

เริ่มจากสิทธิ์ที่น้อยที่สุดแต่ยังใช้งานได้ แล้วค่อยขยายเมื่อคุณมั่นใจมากขึ้น

### การติดตั้งใช้งานและความเชื่อถือของโฮสต์

OpenClaw ถือว่าโฮสต์และขอบเขต config เป็นสิ่งที่เชื่อถือได้:

- หากใครสามารถแก้ไข state/config ของโฮสต์ Gateway (`~/.openclaw` รวมถึง `openclaw.json`) ให้ถือว่าบุคคลนั้นเป็นผู้ปฏิบัติการที่เชื่อถือได้
- การรัน Gateway หนึ่งตัวให้ผู้ปฏิบัติการหลายคนที่ไม่ไว้วางใจกัน/เป็นปฏิปักษ์ต่อกันใช้ร่วมกัน **ไม่ใช่การตั้งค่าที่แนะนำ**
- สำหรับทีมที่มีความเชื่อถือปะปนกัน ให้แยกขอบเขตความเชื่อถือด้วย gateways แยกกัน (หรืออย่างน้อยใช้ OS users/hosts แยกกัน)
- ค่าเริ่มต้นที่แนะนำ: หนึ่งผู้ใช้ต่อหนึ่งเครื่อง/host (หรือ VPS), หนึ่ง gateway สำหรับผู้ใช้นั้น และหนึ่งหรือหลาย agents ภายใน gateway นั้น
- ภายใน Gateway หนึ่ง instance การเข้าถึงของ operator ที่ยืนยันตัวตนแล้วเป็นบทบาท control-plane ที่เชื่อถือได้ ไม่ใช่บทบาทผู้เช่าแยกต่อผู้ใช้
- ตัวระบุเซสชัน (`sessionKey`, session IDs, labels) เป็นตัวเลือกสำหรับการกำหนดเส้นทาง ไม่ใช่โทเค็นการอนุญาต
- หากมีหลายคนสามารถส่งข้อความถึง agent ที่เปิดใช้ tool ได้หนึ่งตัว ทุกคนเหล่านั้นสามารถชี้นำชุดสิทธิ์เดียวกันนั้นได้ การแยกเซสชัน/หน่วยความจำต่อผู้ใช้ช่วยเรื่องความเป็นส่วนตัว แต่ไม่ได้เปลี่ยน shared agent ให้กลายเป็นการอนุญาตระดับโฮสต์ต่อผู้ใช้

### Slack workspace ที่ใช้ร่วมกัน: ความเสี่ยงจริง

หาก "ทุกคนใน Slack ส่งข้อความถึงบอตได้" ความเสี่ยงหลักคือสิทธิ์ tool ที่ถูกมอบหมาย:

- ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้สามารถชักนำให้เกิดการเรียก tool (`exec`, browser, network/file tools) ภายในนโยบายของ agent;
- prompt/content injection จากผู้ส่งคนหนึ่งอาจก่อให้เกิดการกระทำที่กระทบกับ state, devices หรือ outputs ที่ใช้ร่วมกัน;
- หาก shared agent หนึ่งตัวมี credentials/files ที่อ่อนไหว ผู้ส่งที่ได้รับอนุญาตคนใดก็อาจชี้นำการรั่วไหลของข้อมูลผ่านการใช้ tool ได้

ใช้ agents/gateways แยกกันพร้อม tools ขั้นต่ำสำหรับ workflow ของทีม; เก็บ agents ที่มีข้อมูลส่วนตัวให้เป็นส่วนตัว

### agent ที่ใช้ร่วมกันในบริษัท: รูปแบบที่ยอมรับได้

สิ่งนี้ยอมรับได้เมื่อทุกคนที่ใช้ agent ตัวนั้นอยู่ในขอบเขตความเชื่อถือเดียวกัน (เช่น ทีมหนึ่งในบริษัท) และ agent ถูกจำกัดขอบเขตอย่างเคร่งครัดเฉพาะงานธุรกิจ

- รันบนเครื่อง/VM/container เฉพาะ;
- ใช้ OS user + browser/profile/accounts เฉพาะสำหรับ runtime นั้น;
- อย่าลงชื่อเข้าใช้ runtime นั้นด้วยบัญชี Apple/Google ส่วนตัว หรือ password-manager/browser profiles ส่วนตัว

หากคุณผสมตัวตนส่วนตัวและของบริษัทไว้ใน runtime เดียวกัน คุณจะทำให้การแยกพังลงและเพิ่มความเสี่ยงในการเปิดเผยข้อมูลส่วนตัว

## แนวคิดเรื่องความเชื่อถือของ Gateway และ Node

ให้มองว่า Gateway และ Node เป็นโดเมนความเชื่อถือของผู้ปฏิบัติการเดียวกัน แต่มีบทบาทต่างกัน:

- **Gateway** คือ control plane และพื้นผิวของนโยบาย (`gateway.auth`, นโยบาย tool, routing)
- **Node** คือพื้นผิวการรันจากระยะไกลที่จับคู่กับ Gateway นั้น (commands, device actions, ความสามารถเฉพาะบนโฮสต์)
- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้วจะถือว่าเชื่อถือได้ในขอบเขตของ Gateway หลังจาก pairing แล้ว การกระทำของ node จะถือเป็นการกระทำของ operator ที่เชื่อถือได้บน node นั้น
- direct loopback backend clients ที่ยืนยันตัวตนด้วย gateway
  token/password ที่ใช้ร่วมกัน สามารถทำ internal control-plane RPCs ได้โดยไม่ต้องแสดงตัวตนอุปกรณ์ของผู้ใช้
  นี่ไม่ใช่การข้าม pairing ของ remote หรือ browser: network
  clients, node clients, device-token clients และ explicit device identities ยังคงต้องผ่าน pairing และการบังคับใช้ scope-upgrade
- `sessionKey` คือการเลือกเส้นทาง/บริบท ไม่ใช่ auth ต่อผู้ใช้
- การอนุมัติ exec (allowlist + ask) เป็นราวป้องกันสำหรับเจตนาของ operator ไม่ใช่การแยกแบบ hostile multi-tenant
- ค่าเริ่มต้นของผลิตภัณฑ์ OpenClaw สำหรับการตั้งค่าแบบ trusted single-operator คือให้ host exec บน `gateway`/`node` ทำได้โดยไม่ต้องมี approval prompts (`security="full"`, `ask="off"` เว้นแต่คุณจะทำให้เข้มงวดขึ้น) ค่าเริ่มต้นนี้เป็นเรื่อง UX โดยเจตนา ไม่ใช่ช่องโหว่ในตัวมันเอง
- การอนุมัติ exec จะ bind กับบริบทคำขอที่ตรงกันทุกประการและ operands ของไฟล์โลคัลแบบ direct เท่าที่ทำได้ โดยไม่ได้สร้างแบบจำลองเชิงความหมายของทุกเส้นทาง loader ของ runtime/interpreter ใช้ sandboxing และการแยกโฮสต์หากต้องการขอบเขตที่แข็งแรง

หากคุณต้องการการแยกผู้ใช้เชิงปฏิปักษ์ ให้แยกขอบเขตความเชื่อถือด้วย OS user/host และรัน gateways แยกกัน

## ตารางขอบเขตความเชื่อถือ

ใช้สิ่งนี้เป็นโมเดลแบบรวดเร็วเมื่อต้องประเมินความเสี่ยง:

| ขอบเขตหรือตัวควบคุม                                   | ความหมาย                                     | การตีความผิดที่พบบ่อย                                                         |
| ------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `gateway.auth` (token/password/trusted-proxy/device auth) | ยืนยันตัวตนผู้เรียกไปยัง gateway APIs        | "ต้องมีลายเซ็นต่อข้อความทุกเฟรมจึงจะปลอดภัย"                                 |
| `sessionKey`                                           | คีย์การกำหนดเส้นทางเพื่อเลือกบริบท/เซสชัน     | "session key คือขอบเขต auth ของผู้ใช้"                                         |
| prompt/content guardrails                              | ลดความเสี่ยงจากการใช้โมเดลในทางที่ผิด         | "prompt injection เพียงอย่างเดียวพิสูจน์การข้าม auth ได้"                     |
| `canvas.eval` / browser evaluate                       | เป็นความสามารถของ operator โดยเจตนาเมื่อเปิดใช้ | "primitive ของ JS eval ใด ๆ เป็นช่องโหว่โดยอัตโนมัติในโมเดลความเชื่อถือนี้" |
| local TUI `!` shell                                    | การรันแบบโลคัลที่ operator เรียกเองอย่างชัดเจน | "คำสั่ง shell ในเครื่องเพื่อความสะดวกคือ remote injection"                    |
| Node pairing และ node commands                         | การรันจากระยะไกลระดับ operator บนอุปกรณ์ที่จับคู่แล้ว | "การควบคุมอุปกรณ์ระยะไกลควรถูกมองเป็นการเข้าถึงของผู้ใช้ที่ไม่เชื่อถือได้โดยค่าเริ่มต้น" |
| `gateway.nodes.pairing.autoApproveCidrs`               | นโยบาย opt-in สำหรับการลงทะเบียน node บนเครือข่ายที่เชื่อถือได้ | "allowlist ที่ปิดไว้โดยค่าเริ่มต้นคือช่องโหว่ pairing โดยอัตโนมัติ"           |

## สิ่งที่ไม่ถือเป็นช่องโหว่โดยการออกแบบ

<Accordion title="กรณีที่พบได้บ่อยและอยู่นอกขอบเขต">

รูปแบบเหล่านี้มักถูกรายงาน และโดยทั่วไปจะปิดเป็น no-action เว้นแต่
จะมีการแสดงการข้ามขอบเขตจริง:

- chain ที่เป็นเพียง prompt-injection โดยไม่มีการข้ามนโยบาย, auth หรือ sandbox
- ข้ออ้างที่ตั้งอยู่บนสมมติฐานว่ามีการทำงานแบบ hostile multi-tenant บนโฮสต์เดียวหรือ
  config เดียวที่ใช้ร่วมกัน
- ข้ออ้างที่จัดเส้นทางการอ่านของ operator ตามปกติ (เช่น
  `sessions.list` / `sessions.preview` / `chat.history`) เป็น IDOR ในการตั้งค่า
  shared-gateway
- ข้อค้นพบที่เกี่ยวกับการติดตั้งแบบ localhost-only (เช่น HSTS บน gateway ที่มีแต่ loopback เท่านั้น)
- ข้อค้นพบเรื่องลายเซ็น inbound webhook ของ Discord สำหรับ inbound paths ที่ไม่มีอยู่ใน repo นี้
- รายงานที่มอง metadata ของ node pairing เป็นชั้นอนุมัติต่อคำสั่งลับชั้นที่สองสำหรับ `system.run`
  ทั้งที่ขอบเขตการรันจริงยังคงเป็นนโยบายคำสั่ง node แบบ global ของ gateway รวมกับการอนุมัติ exec
  ของ node เอง
- รายงานที่มอง `gateway.nodes.pairing.autoApproveCidrs` ที่ตั้งค่าไว้เป็น
  ช่องโหว่ในตัวมันเอง การตั้งค่านี้ปิดอยู่โดยค่าเริ่มต้น ต้องการ CIDR/IP entries
  แบบ explicit ใช้เฉพาะกับ first-time `role: node` pairing โดยไม่มี requested scopes และ
  ไม่ได้ auto-approve operator/browser/Control UI,
  WebChat, role upgrades, scope upgrades, metadata changes, public-key changes
  หรือเส้นทาง same-host loopback trusted-proxy header
- ข้อค้นพบแบบ "Missing per-user authorization" ที่มอง `sessionKey` เป็น
  auth token

</Accordion>

## baseline ที่เสริมความแข็งแกร่งแล้วใน 60 วินาที

ใช้ baseline นี้ก่อน แล้วค่อยเปิด tools กลับมาเฉพาะต่อ trusted agent:

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

สิ่งนี้จะทำให้ Gateway เป็น local-only, แยก DMs และปิด tools ด้าน control-plane/runtime โดยค่าเริ่มต้น

## กฎแบบรวดเร็วสำหรับ shared inbox

หากมีมากกว่าหนึ่งคนสามารถส่ง DM ถึงบอตของคุณได้:

- ตั้ง `session.dmScope: "per-channel-peer"` (หรือ `"per-account-channel-peer"` สำหรับช่องทางหลายบัญชี)
- คง `dmPolicy: "pairing"` หรือใช้ allowlists ที่เข้มงวด
- อย่านำ shared DMs ไปรวมกับการเข้าถึง tool แบบกว้าง
- สิ่งนี้ช่วยเสริมความแข็งแกร่งให้ cooperative/shared inboxes แต่ไม่ได้ถูกออกแบบเป็นการแยกแบบ hostile co-tenant เมื่อผู้ใช้มีสิทธิ์เขียน host/config ร่วมกัน

## โมเดลการมองเห็นบริบท

OpenClaw แยกสองแนวคิดออกจากกัน:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์ agent ได้ (`dmPolicy`, `groupPolicy`, allowlists, mention gates)
- **การมองเห็นบริบท**: บริบทเสริมใดบ้างที่จะถูก inject เข้าไปในอินพุตของโมเดล (เนื้อหาคำตอบ, ข้อความอ้างอิง, ประวัติเธรด, forwarded metadata)

Allowlists ใช้กำกับการทริกเกอร์และการอนุญาตคำสั่ง การตั้งค่า `contextVisibility` ควบคุมว่าบริบทเสริม (การตอบกลับที่อ้างอิง, thread roots, fetched history) จะถูกกรองอย่างไร:

- `contextVisibility: "all"` (ค่าเริ่มต้น) จะคงบริบทเสริมไว้ตามที่ได้รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บข้อความตอบกลับแบบ quoted ที่ explicit ไว้หนึ่งรายการ

ตั้ง `contextVisibility` ได้แยกตามช่องทางหรือแยกตามห้อง/บทสนทนา ดู [แชตกลุ่ม](/th/channels/groups#context-visibility-and-allowlists) สำหรับรายละเอียดการตั้งค่า

แนวทางการประเมินคำแนะนำด้านความปลอดภัย:

- ข้ออ้างที่แสดงเพียงว่า "โมเดลสามารถเห็นข้อความ quoted หรือข้อความย้อนหลังจากผู้ส่งที่ไม่อยู่ใน allowlist" เป็นข้อค้นพบด้านการเสริมความแข็งแกร่งที่แก้ได้ด้วย `contextVisibility` ไม่ใช่การข้ามขอบเขต auth หรือ sandbox ด้วยตัวมันเอง
- เพื่อให้มีผลกระทบด้านความปลอดภัย รายงานยังคงต้องแสดงการข้ามขอบเขตความเชื่อถือที่พิสูจน์ได้ (auth, policy, sandbox, approval หรือขอบเขตอื่นที่มีการระบุไว้)

## สิ่งที่ audit ตรวจสอบ (ระดับสูง)

- **การเข้าถึงขาเข้า** (นโยบาย DM, นโยบายกลุ่ม, allowlists): คนแปลกหน้าสามารถทริกเกอร์บอตได้หรือไม่?
- **รัศมีผลกระทบของ tool** (elevated tools + ห้องแบบเปิด): prompt injection อาจกลายเป็นการกระทำผ่าน shell/file/network ได้หรือไม่?
- **ความคลาดเคลื่อนของการอนุมัติ exec** (`security=full`, `autoAllowSkills`, interpreter allowlists โดยไม่มี `strictInlineEval`): guardrails ของ host-exec ยังทำงานอย่างที่คุณคิดอยู่หรือไม่?
  - `security="full"` เป็นคำเตือนเชิงท่าทีแบบกว้าง ไม่ใช่หลักฐานว่ามีบั๊ก มันเป็นค่าเริ่มต้นที่เลือกไว้สำหรับการตั้งค่าแบบผู้ช่วยส่วนตัวที่เชื่อถือได้; ให้ทำให้เข้มงวดขึ้นเฉพาะเมื่อโมเดลภัยคุกคามของคุณต้องการ guardrails แบบ approval หรือ allowlist
- **การเปิดเผยทางเครือข่าย** (Gateway bind/auth, Tailscale Serve/Funnel, auth tokens ที่อ่อนหรือสั้น)
- **การเปิดเผย browser control** (remote nodes, relay ports, remote CDP endpoints)
- **สุขลักษณะของดิสก์ในเครื่อง** (สิทธิ์, symlinks, config includes, paths แบบ “synced folder”)
- **Plugins** (plugins โหลดโดยไม่มี allowlist แบบ explicit)
- **policy drift/misconfig** (ตั้งค่า sandbox docker ไว้แต่ปิด sandbox mode; รูปแบบ `gateway.nodes.denyCommands` ที่ไม่มีผลเพราะการจับคู่ตรงกับชื่อคำสั่งแบบ exact เท่านั้น (เช่น `system.run`) และไม่ตรวจสอบข้อความ shell; entries ที่อันตรายใน `gateway.nodes.allowCommands`; `tools.profile="minimal"` แบบ global ถูก override ด้วย profiles ต่อ agent; tools ที่เป็นเจ้าของโดย Plugin เข้าถึงได้ภายใต้นโยบาย tool ที่ผ่อนเกินไป)
- **runtime expectation drift** (เช่น คิดว่า implicit exec ยังหมายถึง `sandbox` ทั้งที่ `tools.exec.host` ตอนนี้มีค่าเริ่มต้นเป็น `auto` หรือการตั้ง `tools.exec.host="sandbox"` แบบ explicit ขณะที่ sandbox mode ปิดอยู่)
- **สุขลักษณะของโมเดล** (เตือนเมื่อโมเดลที่ตั้งค่าไว้ดูเป็นรุ่น legacy; ไม่ใช่การบล็อกแบบ hard)

หากคุณรัน `--deep`, OpenClaw จะพยายาม probe Gateway แบบ live อย่าง best-effort ด้วย

## แผนที่การเก็บ credentials

ใช้สิ่งนี้เมื่อตรวจสอบการเข้าถึงหรือตัดสินใจว่าจะสำรองข้อมูลอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (รับเฉพาะไฟล์ปกติ; ปฏิเสธ symlinks)
- **Discord bot token**: config/env หรือ SecretRef (providers แบบ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์การยืนยันตัวตนของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ของ secrets ที่อิงกับไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`

## เช็กลิสต์ security audit

เมื่อ audit แสดงข้อค้นพบ ให้ถือว่านี่คือลำดับความสำคัญ:

1. **ทุกอย่างที่ “เปิด” + เปิดใช้ tools**: ล็อก DMs/กลุ่มก่อน (pairing/allowlists) จากนั้นค่อยทำให้นโยบาย tool/sandboxing เข้มงวดขึ้น
2. **การเปิดเผยต่อเครือข่ายสาธารณะ** (LAN bind, Funnel, ไม่มี auth): แก้ทันที
3. **การเปิดเผย browser control จากระยะไกล**: ให้มองเหมือนการเข้าถึงระดับ operator (tailnet-only, pair nodes อย่างตั้งใจ, หลีกเลี่ยงการเปิดเผยสู่สาธารณะ)
4. **สิทธิ์**: ตรวจให้แน่ใจว่า state/config/credentials/auth ไม่สามารถถูกอ่านได้โดย group/world
5. **Plugins**: โหลดเฉพาะสิ่งที่คุณเชื่อถืออย่าง explicit เท่านั้น
6. **การเลือกโมเดล**: เลือกใช้โมเดลสมัยใหม่ที่เสริมความแข็งแกร่งด้าน instructions สำหรับบอตที่มี tools

## ศัพท์ใน security audit

ข้อค้นพบของ audit แต่ละรายการถูกระบุด้วย `checkId` แบบมีโครงสร้าง (เช่น
`gateway.bind_no_auth` หรือ `tools.exec.security_full_configured`) กลุ่มความรุนแรงระดับวิกฤตที่พบบ่อย:

- `fs.*` — สิทธิ์ของระบบไฟล์บน state, config, credentials, auth profiles
- `gateway.*` — bind mode, auth, Tailscale, Control UI, การตั้งค่า trusted-proxy
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — การเสริมความแข็งแกร่งแยกตามพื้นผิว
- `plugins.*`, `skills.*` — supply chain ของ Plugin/Skill และข้อค้นพบจากการสแกน
- `security.exposure.*` — การตรวจสอบข้ามส่วน ที่นโยบายการเข้าถึงมาบรรจบกับรัศมีผลกระทบของ tool

ดูแค็ตตาล็อกแบบเต็มพร้อมระดับความรุนแรง, fix keys และการรองรับ auto-fix ได้ที่
[Security audit checks](/th/gateway/security/audit-checks)

## Control UI ผ่าน HTTP

Control UI ต้องการ **secure context** (HTTPS หรือ localhost) เพื่อสร้าง device
identity `gateway.controlUi.allowInsecureAuth` เป็นตัวสลับความเข้ากันได้แบบโลคัล:

- บน localhost จะอนุญาต Control UI auth โดยไม่มี device identity เมื่อหน้า
  ถูกโหลดผ่าน HTTP ที่ไม่ปลอดภัย
- มันไม่ข้ามการตรวจสอบ pairing
- มันไม่ผ่อนปรนข้อกำหนด device identity สำหรับ remote (ที่ไม่ใช่ localhost)

ควรใช้ HTTPS (Tailscale Serve) หรือเปิด UI บน `127.0.0.1`

สำหรับกรณี break-glass เท่านั้น `gateway.controlUi.dangerouslyDisableDeviceAuth`
จะปิดการตรวจสอบ device identity ทั้งหมด นี่คือการลดระดับความปลอดภัยอย่างรุนแรง;
ควรปิดไว้ เว้นแต่คุณกำลังดีบักอย่างจริงจังและสามารถย้อนกลับได้อย่างรวดเร็ว

แยกจาก flags อันตรายเหล่านั้น `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
สามารถอนุญาตเซสชัน Control UI ของ **operator** โดยไม่มี device identity ได้ นี่คือ
พฤติกรรมของ auth mode โดยเจตนา ไม่ใช่ทางลัดของ `allowInsecureAuth` และก็ยัง
ไม่ครอบคลุมถึงเซสชัน Control UI แบบ node-role

`openclaw security audit` จะเตือนเมื่อเปิดใช้การตั้งค่านี้

## สรุป flags ที่ไม่ปลอดภัยหรืออันตราย

`openclaw security audit` จะยก `config.insecure_or_dangerous_flags` ขึ้นมาเมื่อ
มีการเปิดใช้ debug switches ที่รู้ว่าไม่ปลอดภัย/อันตราย ควรปล่อย unset ไว้ใน
production

<AccordionGroup>
  <Accordion title="flags ที่ audit ติดตามอยู่ในปัจจุบัน">
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

    การจับคู่ชื่อตามช่องทาง (ทั้ง bundled และ plugin channels; ใช้ได้แยกต่อ
    `accounts.<accountId>` เมื่อรองรับ):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (plugin channel)
    - `channels.zalouser.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.irc.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.mattermost.dangerouslyAllowNameMatching` (plugin channel)

    การเปิดเผยทางเครือข่าย:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (ใช้ได้แยกต่อบัญชีด้วย)

    Sandbox Docker (defaults + ต่อ agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## การกำหนดค่า reverse proxy

หากคุณรัน Gateway หลัง reverse proxy (nginx, Caddy, Traefik ฯลฯ) ให้กำหนดค่า
`gateway.trustedProxies` เพื่อให้จัดการ forwarded-client IP ได้อย่างถูกต้อง

เมื่อ Gateway ตรวจพบ proxy headers จากที่อยู่ที่ **ไม่** อยู่ใน `trustedProxies` มันจะ **ไม่** ปฏิบัติต่อการเชื่อมต่อว่าเป็น local clients หากปิด gateway auth อยู่ การเชื่อมต่อเหล่านั้นจะถูกปฏิเสธ สิ่งนี้ป้องกันการข้าม authentication ที่การเชื่อมต่อผ่าน proxy จะดูเหมือนมาจาก localhost และได้รับความเชื่อถือโดยอัตโนมัติ

`gateway.trustedProxies` ยังป้อนให้ `gateway.auth.mode: "trusted-proxy"` ด้วย แต่ auth mode นั้นเข้มงวดกว่า:

- trusted-proxy auth **fail-closed สำหรับ proxies ที่มาจาก loopback-source**
- reverse proxies แบบ same-host loopback ยังสามารถใช้ `gateway.trustedProxies` สำหรับการตรวจจับ local-client และการจัดการ forwarded IP ได้
- สำหรับ reverse proxies แบบ same-host loopback ให้ใช้ token/password auth แทน `gateway.auth.mode: "trusted-proxy"`

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

เมื่อมีการตั้งค่า `trustedProxies` Gateway จะใช้ `X-Forwarded-For` เพื่อกำหนด client IP โดย `X-Real-IP` จะถูกละเลยโดยค่าเริ่มต้น เว้นแต่จะตั้ง `gateway.allowRealIpFallback: true` แบบ explicit

trusted proxy headers ไม่ได้ทำให้ node device pairing กลายเป็นที่เชื่อถือโดยอัตโนมัติ
`gateway.nodes.pairing.autoApproveCidrs` เป็นนโยบายของ operator แยกต่างหากที่ปิดไว้โดยค่าเริ่มต้น
แม้จะเปิดใช้ ก็ยังยกเว้นเส้นทาง trusted-proxy header ที่มาจาก loopback-source
จาก node auto-approval เพราะผู้เรียกแบบโลคัลสามารถปลอมแปลง
headers เหล่านั้นได้

พฤติกรรม reverse proxy ที่ดี (เขียนทับ incoming forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

พฤติกรรม reverse proxy ที่ไม่ดี (ต่อท้าย/เก็บ forwarding headers ที่ไม่น่าเชื่อถือไว้):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## หมายเหตุเรื่อง HSTS และ origin

- OpenClaw gateway ออกแบบมาให้เป็น local/loopback ก่อน หากคุณ terminate TLS ที่ reverse proxy ให้ตั้ง HSTS บนโดเมน HTTPS ฝั่ง proxy ตรงนั้น
- หาก gateway เป็นผู้ terminate HTTPS เอง คุณสามารถตั้ง `gateway.http.securityHeaders.strictTransportSecurity` เพื่อให้ส่ง HSTS header จาก responses ของ OpenClaw ได้
- คำแนะนำการติดตั้งแบบละเอียดอยู่ที่ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts)
- สำหรับการติดตั้ง Control UI ที่ไม่ใช่ loopback, โดยค่าเริ่มต้นจำเป็นต้องตั้ง `gateway.controlUi.allowedOrigins`
- `gateway.controlUi.allowedOrigins: ["*"]` เป็นนโยบาย browser-origin แบบ allow-all ที่ explicit ไม่ใช่ค่าเริ่มต้นที่เสริมความแข็งแกร่งแล้ว ควรหลีกเลี่ยงนอกเหนือจากการทดสอบแบบโลคัลที่ควบคุมอย่างเข้มงวด
- ความล้มเหลวด้าน browser-origin auth บน loopback ยังคงถูก rate-limit แม้ว่า
  จะเปิดใช้ general loopback exemption อยู่ แต่ lockout key จะถูกกำหนดขอบเขตแยกตามค่า `Origin` ที่ normalize แล้ว แทนที่จะใช้ bucket localhost ร่วมกันหนึ่งอัน
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิดโหมด Host-header origin fallback; ให้ถือว่าเป็นนโยบายอันตรายที่ operator เลือกเอง
- ให้มอง DNS rebinding และพฤติกรรม proxy-host header เป็นประเด็นเสริมความแข็งแกร่งของการติดตั้ง; คุม `trustedProxies` ให้แคบ และหลีกเลี่ยงการเปิด gateway สู่ public internet โดยตรง

## session logs แบบโลคัลอยู่บนดิสก์

OpenClaw เก็บ session transcripts ไว้บนดิสก์ภายใต้ `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
สิ่งนี้จำเป็นต่อความต่อเนื่องของเซสชัน และ (ถ้าเปิดใช้) การทำดัชนีหน่วยความจำของเซสชัน แต่ก็หมายความว่า
**process/user ใดก็ตามที่มีสิทธิ์เข้าถึงระบบไฟล์สามารถอ่าน logs เหล่านั้นได้** ให้ถือว่าการเข้าถึงดิสก์เป็นขอบเขต
ความเชื่อถือ และล็อกสิทธิ์ของ `~/.openclaw` ให้แน่น (ดูหัวข้อ audit ด้านล่าง) หากคุณต้องการ
การแยกที่แข็งแรงกว่านี้ระหว่าง agents ให้รันพวกมันภายใต้ OS users แยกกัน หรือ hosts แยกกัน

## การรันคำสั่งของ Node (`system.run`)

หากมีการ pair macOS node แล้ว Gateway สามารถเรียก `system.run` บน node นั้นได้ สิ่งนี้คือ **การรันโค้ดจากระยะไกล** บน Mac:

- ต้องมี node pairing (การอนุมัติ + token)
- Gateway node pairing ไม่ใช่พื้นผิวอนุมัติแยกต่อคำสั่ง มันใช้สร้างตัวตน/ความเชื่อถือของ node และการออก token
- Gateway ใช้นโยบายคำสั่ง node แบบหยาบในระดับ global ผ่าน `gateway.nodes.allowCommands` / `denyCommands`
- ควบคุมบน Mac ผ่าน **Settings → Exec approvals** (`security` + `ask` + allowlist)
- นโยบาย `system.run` ต่อ node คือไฟล์การอนุมัติ exec ของ node เอง (`exec.approvals.node.*`) ซึ่งอาจเข้มงวดหรือผ่อนกว่านโยบาย command-ID แบบ global ของ gateway ก็ได้
- node ที่รันด้วย `security="full"` และ `ask="off"` กำลังทำตามโมเดล trusted-operator แบบค่าเริ่มต้น ให้มองว่านี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่การติดตั้งของคุณจะต้องการท่าทีการอนุมัติหรือ allowlist ที่เข้มงวดกว่านี้อย่างชัดเจน
- โหมด approval จะ bind กับบริบทคำขอแบบตรงกันทุกประการ และเมื่อทำได้ จะ bind กับ operand ของสคริปต์/ไฟล์โลคัลที่เป็นรูปธรรมเพียงหนึ่งรายการ หาก OpenClaw ไม่สามารถระบุไฟล์โลคัลแบบ direct ได้อย่างชัดเจนเพียงหนึ่งรายการสำหรับคำสั่ง interpreter/runtime การรันที่พึ่งพา approval จะถูกปฏิเสธ แทนที่จะอ้างว่าครอบคลุมเชิงความหมายทั้งหมด
- สำหรับ `host=node`, การรันที่รองรับ approval จะเก็บ
  `systemRunPlan` ที่เตรียมไว้แบบ canonical; การส่งต่อที่ได้รับอนุมัติในภายหลังจะนำ plan ที่เก็บไว้นั้นกลับมาใช้ และ gateway
  validation จะปฏิเสธการแก้ไข command/cwd/session context ของผู้เรียกหลังจากสร้างคำขอ approval แล้ว
- หากคุณไม่ต้องการการรันจากระยะไกล ให้ตั้ง security เป็น **deny** และลบ node pairing สำหรับ Mac เครื่องนั้น

ความแตกต่างนี้สำคัญต่อการประเมิน:

- node ที่ pair ไว้และเชื่อมต่อใหม่พร้อมประกาศรายการคำสั่งที่ต่างออกไป ไม่ได้เป็นช่องโหว่ด้วยตัวมันเอง หากนโยบาย global ของ Gateway และ exec approvals แบบโลคัลของ node ยังบังคับใช้ขอบเขตการรันจริงอยู่
- รายงานที่มอง metadata ของ node pairing เป็นชั้นอนุมัติแอบแฝงต่อคำสั่งอีกชั้นหนึ่ง มักเป็นความสับสนด้านนโยบาย/UX ไม่ใช่การข้ามขอบเขตความปลอดภัย

## Dynamic Skills (watcher / remote nodes)

OpenClaw สามารถรีเฟรชรายการ Skills กลางเซสชันได้:

- **Skills watcher**: การเปลี่ยนแปลง `SKILL.md` สามารถอัปเดต snapshot ของ Skills ได้ในเทิร์นเอเจนต์ถัดไป
- **Remote nodes**: การเชื่อมต่อ macOS node สามารถทำให้ Skills ที่ใช้ได้เฉพาะบน macOS กลายเป็นตัวเลือกที่เข้าเกณฑ์ (อิงจากการ probe bin)

ให้ถือว่าโฟลเดอร์ Skill เป็น **โค้ดที่เชื่อถือได้** และจำกัดว่าใครสามารถแก้ไขได้

## โมเดลภัยคุกคาม

ผู้ช่วย AI ของคุณสามารถ:

- รันคำสั่ง shell ตามอำเภอใจ
- อ่าน/เขียนไฟล์
- เข้าถึงบริการเครือข่าย
- ส่งข้อความถึงใครก็ได้ (หากคุณให้สิทธิ์ WhatsApp)

คนที่ส่งข้อความถึงคุณสามารถ:

- พยายามหลอกให้ AI ของคุณทำสิ่งไม่ดี
- ใช้วิศวกรรมสังคมเพื่อเข้าถึงข้อมูลของคุณ
- สืบค้นรายละเอียดเกี่ยวกับโครงสร้างพื้นฐาน

## แนวคิดหลัก: ควบคุมการเข้าถึงก่อนความฉลาด

ความล้มเหลวส่วนใหญ่ที่นี่ไม่ใช่การโจมตีซับซ้อน — แต่เป็นแบบ “มีคนส่งข้อความหาบอต แล้วบอตก็ทำตามที่ถูกสั่ง”

จุดยืนของ OpenClaw:

- **Identity ก่อน:** ตัดสินใจก่อนว่าใครบ้างที่คุยกับบอตได้ (DM pairing / allowlists / “open” แบบ explicit)
- **Scope ถัดมา:** ตัดสินใจว่าบอตได้รับอนุญาตให้ทำงานที่ไหน (group allowlists + mention gating, tools, sandboxing, device permissions)
- **Model เป็นลำดับสุดท้าย:** สมมติว่าโมเดลอาจถูกชักจูงได้; ออกแบบให้การชักจูงมีรัศมีผลกระทบจำกัด

## โมเดลการอนุญาตคำสั่ง

slash commands และ directives จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** การอนุญาตถูกอนุมานจาก
channel allowlists/pairing บวกกับ `commands.useAccessGroups` (ดู [การกำหนดค่า](/th/gateway/configuration)
และ [Slash commands](/th/tools/slash-commands)) หาก channel allowlist ว่างหรือมี `"*"`,
คำสั่งต่าง ๆ จะถือว่าเปิดสำหรับช่องทางนั้นโดยมีผลในทางปฏิบัติ

`/exec` เป็นความสะดวกเฉพาะเซสชันสำหรับ operators ที่ได้รับอนุญาต มัน **ไม่** เขียน config หรือ
เปลี่ยนเซสชันอื่น

## ความเสี่ยงของ tools ใน control plane

มี built-in tools สองตัวที่สามารถสร้างการเปลี่ยนแปลงแบบคงอยู่ใน control plane ได้:

- `gateway` สามารถตรวจสอบ config ได้ด้วย `config.schema.lookup` / `config.get` และสามารถเปลี่ยนแปลงแบบคงอยู่ได้ด้วย `config.apply`, `config.patch` และ `update.run`
- `cron` สามารถสร้างงานที่ตั้งเวลาไว้ซึ่งยังคงทำงานต่อหลังจากแชต/งานต้นทางสิ้นสุดแล้ว

`gateway` runtime tool แบบ owner-only ยังคงปฏิเสธที่จะเขียนทับ
`tools.exec.ask` หรือ `tools.exec.security`; aliases แบบเดิมของ `tools.bash.*` จะถูก
normalize ไปยังเส้นทาง exec ที่ได้รับการป้องกันเดียวกันก่อนการเขียน
การแก้ไข `gateway config.apply` และ `gateway config.patch` ที่ขับเคลื่อนโดย agent
จะ fail-closed โดยค่าเริ่มต้น: มีเพียงชุด path แคบ ๆ ของ prompt, model และ mention-gating
เท่านั้นที่ agent ปรับได้ ดังนั้นต้นไม้ config ที่อ่อนไหวใหม่ ๆ จึงได้รับการปกป้อง
เว้นแต่จะถูกเพิ่มเข้า allowlist โดยเจตนา

สำหรับ agent/surface ใด ๆ ที่จัดการเนื้อหาที่ไม่น่าเชื่อถือ ให้ deny สิ่งเหล่านี้โดยค่าเริ่มต้น:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` บล็อกเฉพาะการกระทำ restart มันไม่ได้ปิดการทำงาน config/update ของ `gateway`

## Plugins

Plugins รัน **ในโปรเซสเดียวกัน** กับ Gateway ให้ถือว่าเป็นโค้ดที่เชื่อถือได้:

- ติดตั้ง Plugins เฉพาะจากแหล่งที่คุณเชื่อถือ
- ควรใช้ allowlists แบบ explicit ใน `plugins.allow`
- ตรวจสอบ config ของ Plugin ก่อนเปิดใช้งาน
- รีสตาร์ต Gateway หลังมีการเปลี่ยนแปลง Plugin
- หากคุณติดตั้งหรืออัปเดต Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), ให้ถือว่าเหมือนกำลังรันโค้ดที่ไม่น่าเชื่อถือ:
  - เส้นทางการติดตั้งคือไดเรกทอรีต่อ Plugin ภายใต้ plugin install root ที่ใช้งานอยู่
  - OpenClaw รันการสแกนโค้ดอันตรายในตัวก่อนติดตั้ง/อัปเดต ข้อค้นพบระดับ `critical` จะบล็อกโดยค่าเริ่มต้น
  - OpenClaw ใช้ `npm pack` แล้วรัน `npm install --omit=dev --ignore-scripts` แบบ local ต่อโปรเจ็กต์ในไดเรกทอรีนั้น การตั้งค่า npm install แบบ global ที่สืบทอดมาจะถูกละเลย เพื่อให้ dependencies อยู่ภายใต้เส้นทางติดตั้งของ Plugin
  - ควรใช้เวอร์ชันแบบ pinned และ exact (`@scope/pkg@1.2.3`) และตรวจสอบโค้ดที่ unpack แล้วบนดิสก์ก่อนเปิดใช้งาน
  - `--dangerously-force-unsafe-install` ใช้สำหรับ break-glass เท่านั้น ในกรณี false positives จากการสแกนในตัวของ flow การติดตั้ง/อัปเดต Plugin มันไม่ข้ามบล็อกจากนโยบาย hook `before_install` ของ Plugin และไม่ข้ามความล้มเหลวจากการสแกน
  - การติดตั้ง dependency ของ Skills ที่มี Gateway หนุนหลัง ใช้การแยก dangerous/suspicious แบบเดียวกัน: ข้อค้นพบ `critical` ในตัวจะบล็อก เว้นแต่ผู้เรียกจะตั้ง `dangerouslyForceUnsafeInstall` อย่าง explicit ขณะที่ข้อค้นพบ suspicious จะยังคงเพียงเตือนเท่านั้น `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub ที่แยกต่างหาก

รายละเอียด: [Plugins](/th/tools/plugin)

## โมเดลการเข้าถึง DM: pairing, allowlist, open, disabled

ทุกช่องทางที่รองรับ DM ในปัจจุบันรองรับนโยบาย DM (`dmPolicy` หรือ `*.dm.policy`) ที่ใช้คุม DMs ขาเข้า **ก่อน** ที่ข้อความจะถูกประมวลผล:

- `pairing` (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing สั้น ๆ และบอตจะเพิกเฉยต่อข้อความของพวกเขาจนกว่าจะได้รับการอนุมัติ รหัสจะหมดอายุใน 1 ชั่วโมง; การส่ง DM ซ้ำจะไม่ส่งรหัสใหม่จนกว่าจะมีการสร้างคำขอใหม่ คำขอที่รออยู่จะถูกจำกัดที่ **3 ต่อช่องทาง** โดยค่าเริ่มต้น
- `allowlist`: ผู้ส่งที่ไม่รู้จักจะถูกบล็อก (ไม่มี pairing handshake)
- `open`: อนุญาตให้ใครก็ได้ส่ง DM (สาธารณะ) **ต้องการ** ให้ channel allowlist รวม `"*"` ไว้ด้วย (opt-in แบบ explicit)
- `disabled`: เพิกเฉยต่อ DMs ขาเข้าทั้งหมด

อนุมัติผ่าน CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

รายละเอียด + ไฟล์บนดิสก์: [Pairing](/th/channels/pairing)

## การแยกเซสชัน DM (โหมดหลายผู้ใช้)

โดยค่าเริ่มต้น OpenClaw จะกำหนดเส้นทาง **DM ทั้งหมดเข้าเซสชันหลัก** เพื่อให้ผู้ช่วยของคุณมีความต่อเนื่องข้ามอุปกรณ์และช่องทาง หากมี **หลายคน** สามารถส่ง DM ถึงบอตได้ (DMs แบบเปิดหรือ allowlist หลายคน) ให้พิจารณาแยกเซสชัน DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

สิ่งนี้ช่วยป้องกันการรั่วไหลของบริบทข้ามผู้ใช้ ขณะยังคงแยกแชตกลุ่มไว้

นี่คือขอบเขตด้านบริบทการส่งข้อความ ไม่ใช่ขอบเขตผู้ดูแลระบบระดับโฮสต์ หากผู้ใช้เป็นปฏิปักษ์ต่อกันและใช้ Gateway host/config เดียวกัน ให้รัน gateways แยกตามขอบเขตความเชื่อถือแทน

### โหมด DM ที่ปลอดภัย (แนะนำ)

ให้มอง snippet ด้านบนว่าเป็น **secure DM mode**:

- ค่าเริ่มต้น: `session.dmScope: "main"` (DMs ทั้งหมดใช้เซสชันเดียวเพื่อความต่อเนื่อง)
- ค่าเริ่มต้นของ local CLI onboarding: เขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า (และคงค่าที่ explicit ไว้เดิม)
- Secure DM mode: `session.dmScope: "per-channel-peer"` (แต่ละคู่ channel+sender จะได้บริบท DM แยกกัน)
- การแยก peer ข้ามช่องทาง: `session.dmScope: "per-peer"` (แต่ละผู้ส่งได้หนึ่งเซสชันข้ามทุกช่องทางชนิดเดียวกัน)

หากคุณรันหลายบัญชีบนช่องทางเดียวกัน ให้ใช้ `per-account-channel-peer` แทน หากบุคคลเดียวกันติดต่อคุณผ่านหลายช่องทาง ให้ใช้ `session.identityLinks` เพื่อรวมเซสชัน DM เหล่านั้นให้เป็นตัวตน canonical เดียว ดู [การจัดการเซสชัน](/th/concepts/session) และ [การกำหนดค่า](/th/gateway/configuration)

## Allowlists สำหรับ DMs และกลุ่ม

OpenClaw มีสองชั้นแยกกันสำหรับคำถาม “ใครสามารถทริกเกอร์ฉันได้?”:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; แบบเดิม: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ใครได้รับอนุญาตให้คุยกับบอตในข้อความโดยตรง
  - เมื่อ `dmPolicy="pairing"`, การอนุมัติจะถูกเขียนลง store ของ pairing allowlist แยกตามบัญชีภายใต้ `~/.openclaw/credentials/` (`<channel>-allowFrom.json` สำหรับบัญชีค่าเริ่มต้น, `<channel>-<accountId>-allowFrom.json` สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น) แล้ว merge กับ config allowlists
- **Group allowlist** (เฉพาะแต่ละช่องทาง): กลุ่ม/ช่องทาง/guilds ใดบ้างที่บอตจะยอมรับข้อความจากตั้งแต่แรก
  - รูปแบบที่พบบ่อย:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ค่าเริ่มต้นแยกต่อกลุ่ม เช่น `requireMention`; เมื่อมีการตั้งค่า มันจะทำหน้าที่เป็น group allowlist ด้วย (ใส่ `"*"` เพื่อคงพฤติกรรมอนุญาตทุกกลุ่ม)
    - `groupPolicy="allowlist"` + `groupAllowFrom`: จำกัดว่าใครสามารถทริกเกอร์บอต _ภายใน_ เซสชันกลุ่มได้ (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)
    - `channels.discord.guilds` / `channels.slack.channels`: allowlists แยกตามพื้นผิว + ค่าเริ่มต้นของการกล่าวถึง
  - การตรวจสอบกลุ่มจะรันตามลำดับนี้: `groupPolicy`/group allowlists ก่อน จากนั้น mention/reply activation
  - การตอบกลับข้อความของบอต (implicit mention) **ไม่** ข้าม sender allowlists เช่น `groupAllowFrom`
  - **หมายเหตุด้านความปลอดภัย:** ให้มอง `dmPolicy="open"` และ `groupPolicy="open"` เป็นการตั้งค่าทางเลือกสุดท้าย ควรแทบไม่ใช้เลย; ควรใช้ pairing + allowlists เว้นแต่คุณจะเชื่อถือสมาชิกทุกคนในห้องอย่างเต็มที่

รายละเอียด: [การกำหนดค่า](/th/gateway/configuration) และ [กลุ่ม](/th/channels/groups)

## Prompt injection (มันคืออะไร และทำไมจึงสำคัญ)

Prompt injection คือเมื่อผู้โจมตีสร้างข้อความที่ชักจูงโมเดลให้ทำสิ่งที่ไม่ปลอดภัย (“ignore your instructions”, “dump your filesystem”, “follow this link and run commands” ฯลฯ)

แม้จะมี system prompts ที่แข็งแรง **prompt injection ก็ยังไม่ใช่ปัญหาที่แก้ได้สมบูรณ์** system prompt guardrails เป็นเพียงคำแนะนำแบบอ่อน; การบังคับใช้แบบแข็งมาจากนโยบาย tool, การอนุมัติ exec, sandboxing และ channel allowlists (และ operators ก็สามารถปิดสิ่งเหล่านี้ได้โดยการออกแบบ) สิ่งที่ช่วยได้ในทางปฏิบัติคือ:

- คง DMs ขาเข้าให้ล็อกไว้ (pairing/allowlists)
- ควรใช้ mention gating ในกลุ่ม; หลีกเลี่ยงบอตแบบ “always-on” ในห้องสาธารณะ
- ให้มองลิงก์, ไฟล์แนบ และคำสั่งที่วางเข้ามาเป็นสิ่งที่ไม่น่าเชื่อถือโดยค่าเริ่มต้น
- รันการใช้ tool ที่อ่อนไหวใน sandbox; เก็บ secrets ให้อยู่นอกระบบไฟล์ที่ agent เข้าถึงได้
- หมายเหตุ: sandboxing เป็นแบบ opt-in หากปิด sandbox mode, implicit `host=auto` จะ resolve ไปยังโฮสต์ gateway ส่วน `host=sandbox` แบบ explicit จะยัง fail-closed เพราะไม่มี sandbox runtime ให้ใช้ ตั้ง `host=gateway` หากคุณต้องการให้พฤติกรรมนี้ชัดเจนใน config
- จำกัด tools ความเสี่ยงสูง (`exec`, `browser`, `web_fetch`, `web_search`) ให้ใช้ได้เฉพาะ trusted agents หรือ explicit allowlists
- หากคุณ allowlist interpreters (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline eval ยังคงต้องได้รับการอนุมัติแบบ explicit
- การวิเคราะห์ shell approval ยังปฏิเสธรูปแบบ POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) ภายใน **unquoted heredocs** ด้วย ดังนั้นเนื้อหา heredoc ที่อยู่ใน allowlist จะไม่สามารถแอบให้ shell expansion หลุดผ่านการตรวจทาน allowlist ในฐานะข้อความธรรมดาได้ ให้ใส่เครื่องหมายคำพูดที่ตัวจบ heredoc (เช่น `<<'EOF'`) เพื่อเลือกใช้ semantics แบบเนื้อหาตรงตัว; unquoted heredocs ที่อาจมีการขยายตัวแปรจะถูกปฏิเสธ
- **การเลือกโมเดลมีความสำคัญ:** โมเดลที่เก่ากว่า/เล็กกว่า/legacy จะมีความทนทานต่อ prompt injection และการใช้ tool ผิดวัตถุประสงค์ต่ำกว่าอย่างชัดเจน สำหรับ agents ที่เปิดใช้ tool ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแรงด้าน instruction มากที่สุดเท่าที่มี

สัญญาณอันตรายที่ควรมองว่าไม่น่าเชื่อถือ:

- “Read this file/URL and do exactly what it says.”
- “Ignore your system prompt or safety rules.”
- “Reveal your hidden instructions or tool outputs.”
- “Paste the full contents of ~/.openclaw or your logs.”

## การทำให้ special-token ของเนื้อหาภายนอกปลอดภัย

OpenClaw จะลบ literal ของ special-token ทั่วไปจาก chat templates ของ self-hosted LLM ออกจาก external content และ metadata ที่ถูกห่อไว้ ก่อนจะส่งถึงโมเดล ตระกูล marker ที่ครอบคลุมรวมถึงโทเค็นบทบาท/เทิร์นของ Qwen/ChatML, Llama, Gemma, Mistral, Phi และ GPT-OSS

เหตุผล:

- OpenAI-compatible backends ที่เป็นหน้าบ้านให้ self-hosted models บางตัว อาจเก็บ special tokens ที่ปรากฏในข้อความของผู้ใช้ไว้ แทนที่จะปิดบังไว้ ผู้โจมตีที่สามารถเขียนลงใน inbound external content ได้ (หน้าเว็บที่ fetch มา, เนื้อหาอีเมล, output ของเครื่องมืออ่านไฟล์) อาจฉีดขอบเขตบทบาท `assistant` หรือ `system` แบบสังเคราะห์ และหลบออกจาก wrapped-content guardrails ได้
- การทำให้ปลอดภัยจะเกิดขึ้นที่ชั้นการห่อ external-content ดังนั้นจึงมีผลสม่ำเสมอทั้งกับ fetch/read tools และเนื้อหาขาเข้าจากช่องทางต่าง ๆ แทนที่จะทำแยกต่อ provider
- responses ขาออกของโมเดลมี sanitizer แยกต่างหากอยู่แล้ว ที่ลบ `<tool_call>`, `<function_calls>` และ scaffolding คล้ายกันออกจากคำตอบที่ผู้ใช้มองเห็น external-content sanitizer คือคู่ขาเข้าของสิ่งนั้น

สิ่งนี้ไม่ได้แทนที่การเสริมความแข็งแกร่งอื่น ๆ ในหน้านี้ — `dmPolicy`, allowlists, การอนุมัติ exec, sandboxing และ `contextVisibility` ยังคงเป็นตัวทำงานหลัก มันเพียงปิดช่องโหว่เฉพาะชั้น tokenizer ต่อ self-hosted stacks ที่ส่งต่อข้อความผู้ใช้พร้อม special tokens แบบคงเดิม

## flags สำหรับข้ามความปลอดภัยของ external content

OpenClaw มี bypass flags แบบ explicit ที่ปิดการห่อความปลอดภัยของ external-content:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload field `allowUnsafeExternalContent`

คำแนะนำ:

- ควรปล่อย unset/false ไว้ใน production
- เปิดใช้ชั่วคราวเฉพาะการดีบักที่มีขอบเขตแคบมาก
- หากเปิดใช้ ให้แยก agent นั้นออก (sandbox + tools ขั้นต่ำ + namespace ของเซสชันเฉพาะ)

หมายเหตุความเสี่ยงของ Hooks:

- payloads ของ hook เป็นเนื้อหาที่ไม่น่าเชื่อถือ แม้การส่งมาจะมาจากระบบที่คุณควบคุมอยู่ (mail/docs/web content ก็อาจมี prompt injection ได้)
- tiers ของโมเดลที่อ่อนแอกว่าจะเพิ่มความเสี่ยงนี้ สำหรับระบบอัตโนมัติที่ขับเคลื่อนด้วย hook ควรใช้โมเดลรุ่นใหม่ที่แข็งแรง และคุม tool policy ให้แน่น (`tools.profile: "messaging"` หรือเข้มกว่านั้น) พร้อม sandboxing เมื่อเป็นไปได้

### Prompt injection ไม่จำเป็นต้องมี DMs สาธารณะ

แม้ว่า **มีเพียงคุณเท่านั้น** ที่ส่งข้อความถึงบอตได้ prompt injection ก็ยังเกิดขึ้นได้ผ่าน
**เนื้อหาที่ไม่น่าเชื่อถือ** ใด ๆ ที่บอตอ่าน (ผลลัพธ์จาก web search/fetch,
หน้าใน browser, อีเมล, เอกสาร, ไฟล์แนบ, logs/code ที่วางเข้ามา) กล่าวอีกอย่างคือ: ผู้ส่งไม่ใช่
พื้นผิวภัยคุกคามเพียงอย่างเดียว แต่ **ตัวเนื้อหาเอง** ก็สามารถพกพาคำสั่งแบบเชิงปฏิปักษ์มาได้

เมื่อเปิดใช้ tools ความเสี่ยงโดยทั่วไปคือการดึงบริบทออกไปหรือการทริกเกอร์
tool calls ลดรัศมีผลกระทบได้โดย:

- ใช้ **reader agent** แบบ read-only หรือปิด tools เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
  แล้วค่อยส่งสรุปให้ agent หลักของคุณ
- ปิด `web_search` / `web_fetch` / `browser` สำหรับ agents ที่เปิดใช้ tool เว้นแต่จำเป็น
- สำหรับ OpenResponses URL inputs (`input_file` / `input_image`), ตั้ง
  `gateway.http.endpoints.responses.files.urlAllowlist` และ
  `gateway.http.endpoints.responses.images.urlAllowlist` ให้เข้มงวด และคง `maxUrlParts` ให้ต่ำ
  allowlists ที่ว่างจะถือว่าไม่ได้ตั้ง; ใช้ `files.allowUrl: false` / `images.allowUrl: false`
  หากคุณต้องการปิดการ fetch URL ทั้งหมด
- สำหรับ OpenResponses file inputs, ข้อความ `input_file` ที่ถอดรหัสแล้วจะยังถูก inject เป็น
  **external content ที่ไม่น่าเชื่อถือ** อย่าพึ่งพาว่าข้อความจากไฟล์จะเชื่อถือได้เพียงเพราะ
  Gateway ถอดรหัสมันแบบโลคัล injected block ยังคงมี
  markers ขอบเขต `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` แบบ explicit พร้อม `Source: External`
  metadata แม้เส้นทางนี้จะละ banner `SECURITY NOTICE:` ที่ยาวกว่าออกไป
- การห่อแบบใช้ marker เดียวกันนี้ยังถูกใช้เมื่อ media-understanding ดึงข้อความ
  จากเอกสารที่แนบมาก่อนจะผนวกข้อความนั้นเข้าใน media prompt
- เปิดใช้ sandboxing และ strict tool allowlists สำหรับ agent ใดก็ตามที่แตะต้องอินพุตที่ไม่น่าเชื่อถือ
- เก็บ secrets ให้อยู่นอก prompts; ส่งผ่าน env/config บนโฮสต์ gateway แทน

### Self-hosted LLM backends

OpenAI-compatible self-hosted backends เช่น vLLM, SGLang, TGI, LM Studio,
หรือ custom Hugging Face tokenizer stacks อาจต่างจาก hosted providers ในวิธีที่
special tokens ของ chat-template ถูกจัดการ หาก backend ตัวใด tokenize literal strings
เช่น `<|im_start|>`, `<|start_header_id|>` หรือ `<start_of_turn>` ให้เป็น
โทเค็นเชิงโครงสร้างของ chat-template ภายในเนื้อหาของผู้ใช้ ข้อความที่ไม่น่าเชื่อถือก็อาจพยายาม
ปลอมขอบเขตของบทบาทที่ชั้น tokenizer ได้

OpenClaw จะลบ literal ของ special-token ทั่วไปของตระกูลโมเดลจาก wrapped
external content ก่อนส่งไปยังโมเดล ควรเปิดใช้การห่อ external-content
ไว้เสมอ และควรใช้การตั้งค่า backend ที่แยกหรือ escape special
tokens ในเนื้อหาที่ผู้ใช้ให้มา เมื่อมีให้ใช้ ส่วน hosted providers เช่น OpenAI
และ Anthropic มีการทำให้คำขอปลอดภัยฝั่ง request ของตัวเองอยู่แล้ว

### ความแข็งแรงของโมเดล (หมายเหตุด้านความปลอดภัย)

ความต้านทานต่อ prompt injection **ไม่ได้เท่ากัน** ในทุก tier ของโมเดล โมเดลที่เล็กกว่า/ถูกกว่าโดยทั่วไปจะอ่อนไหวต่อการใช้ tool ผิดวัตถุประสงค์และการ hijack คำสั่งมากกว่า โดยเฉพาะเมื่อเจอกับ prompts แบบเชิงปฏิปักษ์

<Warning>
สำหรับ agents ที่เปิดใช้ tool หรือ agents ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ ความเสี่ยงของ prompt injection กับโมเดลที่เก่ากว่า/เล็กกว่ามักสูงเกินไป อย่ารัน workloads เหล่านั้นบนโมเดล tier ที่อ่อน
</Warning>

คำแนะนำ:

- **ใช้โมเดลรุ่นล่าสุด ระดับดีที่สุด** สำหรับบอตใด ๆ ที่สามารถรัน tools หรือแตะต้อง files/networks ได้
- **อย่าใช้ tiers ที่เก่ากว่า/อ่อนกว่า/เล็กกว่า** สำหรับ agents ที่เปิดใช้ tool หรือ inboxes ที่ไม่น่าเชื่อถือ; ความเสี่ยงของ prompt injection สูงเกินไป
- หากจำเป็นต้องใช้โมเดลที่เล็กกว่า **ให้ลดรัศมีผลกระทบ** (tools แบบ read-only, sandboxing ที่เข้ม, การเข้าถึงระบบไฟล์ขั้นต่ำ, allowlists ที่เข้มงวด)
- เมื่อรันโมเดลขนาดเล็ก **ให้เปิดใช้ sandboxing สำหรับทุกเซสชัน** และ **ปิด `web_search`/`web_fetch`/`browser`** เว้นแต่อินพุตจะถูกควบคุมอย่างเข้มงวด
- สำหรับผู้ช่วยส่วนตัวแบบแชตอย่างเดียว ที่รับอินพุตที่เชื่อถือได้และไม่มี tools โมเดลขนาดเล็กก็มักเพียงพอ

## Reasoning และผลลัพธ์แบบ verbose ในกลุ่ม

`/reasoning`, `/verbose` และ `/trace` อาจเปิดเผย reasoning ภายใน, output ของ tool
หรือการวินิจฉัยของ Plugin ที่
ไม่ได้ตั้งใจให้เห็นในช่องทางสาธารณะ ในการตั้งค่ากลุ่ม ให้ถือว่าเป็น **debug
only** และปิดไว้ เว้นแต่คุณจำเป็นต้องใช้จริง ๆ

คำแนะนำ:

- ปิด `/reasoning`, `/verbose` และ `/trace` ไว้ในห้องสาธารณะ
- หากจะเปิดใช้ ให้เปิดเฉพาะใน DMs ที่เชื่อถือได้หรือห้องที่ควบคุมอย่างเข้มงวด
- จำไว้ว่า: output แบบ verbose และ trace อาจมี tool args, URLs, การวินิจฉัยของ Plugin และข้อมูลที่โมเดลเห็น

## ตัวอย่างการเสริมความแข็งแกร่งของ config

### สิทธิ์ของไฟล์

เก็บ config + state ให้เป็นส่วนตัวบนโฮสต์ gateway:

- `~/.openclaw/openclaw.json`: `600` (ผู้ใช้เท่านั้นที่อ่าน/เขียนได้)
- `~/.openclaw`: `700` (ผู้ใช้เท่านั้น)

`openclaw doctor` สามารถเตือนและเสนอให้ทำสิทธิ์เหล่านี้ให้เข้มงวดขึ้นได้

### การเปิดเผยทางเครือข่าย (bind, port, firewall)

Gateway multiplex **WebSocket + HTTP** บนพอร์ตเดียว:

- ค่าเริ่มต้น: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

พื้นผิว HTTP นี้รวมถึง Control UI และ canvas host:

- Control UI (SPA assets) (base path ค่าเริ่มต้น `/`)
- Canvas host: `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/` (HTML/JS ตามอำเภอใจ; ให้ถือว่าเป็นเนื้อหาที่ไม่น่าเชื่อถือ)

หากคุณโหลดเนื้อหา canvas ใน browser ปกติ ให้ปฏิบัติกับมันเหมือนหน้าเว็บที่ไม่น่าเชื่อถืออื่น ๆ:

- อย่าเปิดเผย canvas host ให้เครือข่าย/ผู้ใช้ที่ไม่น่าเชื่อถือ
- อย่าทำให้เนื้อหา canvas ใช้ origin เดียวกับพื้นผิวเว็บที่มีสิทธิ์สูง เว้นแต่คุณจะเข้าใจผลกระทบอย่างถ่องแท้

bind mode ควบคุมว่า Gateway จะรับฟังที่ไหน:

- `gateway.bind: "loopback"` (ค่าเริ่มต้น): มีเฉพาะ local clients เท่านั้นที่เชื่อมต่อได้
- การ bind ที่ไม่ใช่ loopback (`"lan"`, `"tailnet"`, `"custom"`) จะขยายพื้นผิวการโจมตี ใช้ได้เฉพาะเมื่อมี gateway auth (shared token/password หรือ trusted proxy แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้อง) และมี firewall จริง

กฎจำง่าย:

- ควรใช้ Tailscale Serve มากกว่า LAN binds (Serve จะคง Gateway ไว้บน loopback และให้ Tailscale จัดการการเข้าถึง)
- หากจำเป็นต้อง bind ไปยัง LAN ให้จำกัดพอร์ตด้วย firewall เป็น allowlist ของ source IPs ที่แคบ; อย่าทำ port-forward แบบกว้าง
- อย่าเปิด Gateway แบบไม่มีการยืนยันตัวตนบน `0.0.0.0` เด็ดขาด

### Docker port publishing พร้อม UFW

หากคุณรัน OpenClaw ด้วย Docker บน VPS โปรดจำไว้ว่า published container ports
(`-p HOST:CONTAINER` หรือ Compose `ports:`) จะถูกกำหนดเส้นทางผ่าน forwarding chains ของ Docker
ไม่ใช่ผ่านกฎ `INPUT` ของโฮสต์อย่างเดียว

เพื่อให้ทราฟฟิก Docker สอดคล้องกับนโยบาย firewall ของคุณ ให้บังคับใช้กฎใน
`DOCKER-USER` (chain นี้จะถูกประเมินก่อนกฎ accept ของ Docker เอง)
บน distros สมัยใหม่จำนวนมาก `iptables`/`ip6tables` ใช้ frontend แบบ `iptables-nft`
และยังคงใช้กฎเหล่านี้กับ backend ของ nftables

ตัวอย่าง allowlist ขั้นต่ำ (IPv4):

```bash
# /etc/ufw/after.rules (append เป็น section *filter ของตัวเอง)
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
เปิดใช้ Docker IPv6

หลีกเลี่ยงการ hardcode ชื่อ interface เช่น `eth0` ใน snippets ของเอกสาร ชื่อ interface
แตกต่างกันไปตาม images ของ VPS (`ens3`, `enp*` ฯลฯ) และหากไม่ตรงกันอาจทำให้
deny rule ของคุณถูกข้ามโดยไม่ได้ตั้งใจ

การตรวจสอบอย่างรวดเร็วหลัง reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

พอร์ตภายนอกที่คาดหวังควรมีเฉพาะสิ่งที่คุณตั้งใจเปิดเผย (สำหรับการตั้งค่าส่วนใหญ่:
SSH + พอร์ต reverse proxy ของคุณ)

### การค้นหาแบบ mDNS/Bonjour

Gateway จะ broadcast การมีอยู่ของมันผ่าน mDNS (`_openclaw-gw._tcp` บนพอร์ต 5353) สำหรับการค้นหาอุปกรณ์ในเครือข่ายโลคัล ในโหมด full สิ่งนี้รวม TXT records ที่อาจเปิดเผยรายละเอียดเชิงปฏิบัติการ:

- `cliPath`: filesystem path เต็มไปยังไบนารี CLI (เปิดเผย username และตำแหน่งการติดตั้ง)
- `sshPort`: โฆษณาว่ามี SSH บนโฮสต์
- `displayName`, `lanHost`: ข้อมูลชื่อโฮสต์

**ข้อพิจารณาด้านความปลอดภัยเชิงปฏิบัติการ:** การประกาศรายละเอียดของโครงสร้างพื้นฐานทำให้การสอดแนมทำได้ง่ายขึ้นสำหรับทุกคนในเครือข่ายโลคัล แม้ข้อมูลที่ดู “ไม่อันตราย” อย่าง filesystem paths และการมีอยู่ของ SSH ก็ช่วยให้ผู้โจมตีทำแผนที่สภาพแวดล้อมของคุณได้

**คำแนะนำ:**

1. **โหมด minimal** (ค่าเริ่มต้น, แนะนำสำหรับ gateways ที่ถูกเปิดเผย): ละฟิลด์ที่อ่อนไหวออกจาก mDNS broadcasts:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **ปิดทั้งหมด** หากคุณไม่ต้องการการค้นหาอุปกรณ์แบบโลคัล:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **โหมด full** (opt-in): รวม `cliPath` + `sshPort` ใน TXT records:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **ตัวแปรสภาพแวดล้อม** (ทางเลือก): ตั้ง `OPENCLAW_DISABLE_BONJOUR=1` เพื่อปิด mDNS โดยไม่ต้องแก้ config

ในโหมด minimal Gateway ยังคง broadcast ข้อมูลเพียงพอสำหรับการค้นหาอุปกรณ์ (`role`, `gatewayPort`, `transport`) แต่จะละ `cliPath` และ `sshPort` ออก แอปที่ต้องการข้อมูล path ของ CLI สามารถดึงผ่านการเชื่อมต่อ WebSocket ที่ยืนยันตัวตนแล้วได้แทน

### ล็อก WebSocket ของ Gateway ให้แน่น (local auth)

Gateway auth **จำเป็นโดยค่าเริ่มต้น** หากไม่มีการกำหนดเส้นทาง gateway auth ที่ถูกต้อง
Gateway จะปฏิเสธการเชื่อมต่อ WebSocket (fail‑closed)

Onboarding จะสร้าง token โดยค่าเริ่มต้น (แม้สำหรับ loopback) ดังนั้น
local clients ต้องยืนยันตัวตน

ตั้ง token เพื่อให้ **WS clients ทุกตัว** ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor สามารถสร้างให้คุณได้: `openclaw doctor --generate-gateway-token`

หมายเหตุ: `gateway.remote.token` / `.password` เป็นแหล่ง credentials ฝั่ง client
มัน **ไม่ได้** ปกป้อง local WS access ด้วยตัวมันเอง
เส้นทางการเรียกแบบโลคัลสามารถใช้ `gateway.remote.*` เป็น fallback ได้ก็ต่อเมื่อ `gateway.auth.*`
ยังไม่ได้ตั้งค่า
หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดแบบ explicit ผ่าน
SecretRef และ resolve ไม่ได้ การ resolve จะ fail-closed (ไม่มี remote fallback มาปกปิด)
เพิ่มเติม: pin remote TLS ได้ด้วย `gateway.remote.tlsFingerprint` เมื่อใช้ `wss://`
`ws://` แบบ plaintext ใช้ได้กับ loopback เท่านั้นโดยค่าเริ่มต้น สำหรับเส้นทาง
private-network ที่เชื่อถือได้ ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บน process
ของ client เป็น break-glass สิ่งนี้จงใจให้เป็นเพียง process environment เท่านั้น ไม่ใช่
config key ใน `openclaw.json`
Mobile pairing และเส้นทาง gateway แบบ manual หรือ scanned บน Android จะเข้มงวดกว่า:
cleartext ยอมรับได้สำหรับ loopback แต่ private-LAN, link-local, `.local` และ
hostnames แบบไม่มี dot ต้องใช้ TLS เว้นแต่คุณจะเลือกเปิดเส้นทาง
cleartext บน trusted private-network อย่าง explicit

Local device pairing:

- device pairing จะถูกอนุมัติอัตโนมัติสำหรับการเชื่อมต่อ loopback แบบโลคัลโดยตรง เพื่อให้
  same-host clients ใช้งานได้ลื่นไหล
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local
  สำหรับ trusted shared-secret helper flows
- การเชื่อมต่อผ่าน tailnet และ LAN รวมถึง same-host tailnet binds จะถูกมองเป็น
  remote สำหรับ pairing และยังคงต้องได้รับการอนุมัติ
- หลักฐานจาก forwarded-header บนคำขอ loopback จะทำให้คำขอนั้นหมดสถานะ
  loopback locality metadata-upgrade auto-approval ถูกจำกัดขอบเขตอย่างแคบ ดู
  [Gateway pairing](/th/gateway/pairing) สำหรับทั้งสองกฎ

Auth modes:

- `gateway.auth.mode: "token"`: shared bearer token (แนะนำสำหรับการตั้งค่าส่วนใหญ่)
- `gateway.auth.mode: "password"`: password auth (ควรตั้งผ่าน env: `OPENCLAW_GATEWAY_PASSWORD`)
- `gateway.auth.mode: "trusted-proxy"`: เชื่อถือ identity-aware reverse proxy ให้ยืนยันตัวตนผู้ใช้และส่งต่อ identity ผ่าน headers (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เช็กลิสต์การหมุนเวียน (token/password):

1. สร้าง/ตั้ง secret ใหม่ (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_PASSWORD`)
2. รีสตาร์ต Gateway (หรือรีสตาร์ตแอป macOS หากมันเป็นผู้ดูแล Gateway)
3. อัปเดต remote clients (`gateway.remote.token` / `.password` บนเครื่องที่เรียกเข้า Gateway)
4. ตรวจสอบว่าคุณไม่สามารถเชื่อมต่อด้วย credentials เก่าได้อีกต่อไป

### Tailscale Serve identity headers

เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ค่าเริ่มต้นสำหรับ Serve), OpenClaw
จะยอมรับ Tailscale Serve identity headers (`tailscale-user-login`) สำหรับการยืนยันตัวตนของ Control
UI/WebSocket โดย OpenClaw จะตรวจสอบ identity ด้วยการ resolve
ที่อยู่ `x-forwarded-for` ผ่าน local Tailscale daemon (`tailscale whois`) แล้วจับคู่กับ
header สิ่งนี้จะทำงานเฉพาะกับคำขอที่เข้า loopback
และมี `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ตามที่
Tailscale inject มา
สำหรับเส้นทางตรวจสอบ identity แบบ async นี้ ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกัน
จะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้น bad retries พร้อมกัน
จาก Serve client เดียวอาจทำให้ความพยายามครั้งที่สองถูก lock out ทันที
แทนที่จะหลุดผ่านไปสองครั้งในฐานะ mismatch ปกติ
HTTP API endpoints (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้ Tailscale identity-header auth โดยจะยังคงปฏิบัติตาม
โหมด HTTP auth ของ gateway ที่ตั้งค่าไว้

หมายเหตุสำคัญเรื่องขอบเขต:

- Gateway HTTP bearer auth มีผลในทางปฏิบัติเป็นการเข้าถึงระดับ operator แบบ all-or-nothing
- ให้ถือว่า credentials ที่สามารถเรียก `/v1/chat/completions`, `/v1/responses` หรือ `/api/channels/*` ได้ เป็น secrets ระดับ operator แบบ full-access สำหรับ gateway นั้น
- บนพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI, shared-secret bearer auth จะคืนค่า default operator scopes เต็มรูปแบบ (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) และ owner semantics สำหรับ agent turns; ค่า `x-openclaw-scopes` ที่แคบกว่าจะไม่ลดทอน shared-secret path นี้
- semantics ของ scope ต่อคำขอบน HTTP จะใช้ได้เฉพาะเมื่อคำขอมาจากโหมดที่มี identity เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress
- ในโหมดแบบมี identity เหล่านั้น หากละ `x-openclaw-scopes` ไว้ ระบบจะ fallback ไปยังชุด operator default scopes ตามปกติ; ให้ส่ง header นี้แบบ explicit เมื่อคุณต้องการชุด scope ที่แคบกว่า
- `/tools/invoke` ใช้กฎ shared-secret เดียวกัน: token/password bearer auth จะถูกมองเป็น full operator access ที่จุดนั้นเช่นกัน ขณะที่โหมดแบบมี identity ยังคงเคารพ scopes ที่ประกาศไว้
- อย่าแชร์ credentials เหล่านี้กับผู้เรียกที่ไม่น่าเชื่อถือ; ควรใช้ gateways แยกกันต่อขอบเขตความเชื่อถือ

**สมมติฐานด้านความเชื่อถือ:** tokenless Serve auth ถือว่าโฮสต์ gateway เป็นสิ่งที่เชื่อถือได้
อย่ามองว่านี่คือการป้องกันต่อ processes บนโฮสต์เดียวกันที่เป็นปฏิปักษ์ หากมีโค้ดโลคัลที่ไม่น่าเชื่อถือ
อาจรันบนโฮสต์ gateway ได้ ให้ปิด `gateway.auth.allowTailscale`
และบังคับใช้ shared-secret auth แบบ explicit ด้วย `gateway.auth.mode: "token"` หรือ
`"password"`

**กฎด้านความปลอดภัย:** อย่าส่งต่อ headers เหล่านี้จาก reverse proxy ของคุณเอง หาก
คุณ terminate TLS หรือทำ proxy อยู่หน้า gateway ให้ปิด
`gateway.auth.allowTailscale` และใช้ shared-secret auth (`gateway.auth.mode:
"token"` หรือ `"password"`) หรือ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
แทน

Trusted proxies:

- หากคุณ terminate TLS อยู่หน้า Gateway ให้ตั้ง `gateway.trustedProxies` เป็น IPs ของ proxy ของคุณ
- OpenClaw จะเชื่อถือ `x-forwarded-for` (หรือ `x-real-ip`) จาก IPs เหล่านั้นเพื่อกำหนด client IP สำหรับ local pairing checks และ HTTP auth/local checks
- ตรวจสอบให้แน่ใจว่า proxy ของคุณ **เขียนทับ** `x-forwarded-for` และบล็อกการเข้าถึง Gateway port โดยตรง

ดู [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

### Browser control ผ่าน node host (แนะนำ)

หาก Gateway ของคุณอยู่ระยะไกล แต่ browser รันอยู่บนอีกเครื่องหนึ่ง ให้รัน **node host**
บนเครื่องที่มี browser แล้วให้ Gateway ทำ proxy การกระทำของ browser (ดู [Browser tool](/th/tools/browser))
ให้มอง node pairing เหมือนการเข้าถึงระดับผู้ดูแลระบบ

รูปแบบที่แนะนำ:

- ให้ Gateway และ node host อยู่ใน tailnet เดียวกัน (Tailscale)
- pair node อย่างตั้งใจ; ปิด browser proxy routing หากคุณไม่ต้องการใช้

สิ่งที่ควรหลีกเลี่ยง:

- การเปิดเผย relay/control ports ผ่าน LAN หรือ public Internet
- Tailscale Funnel สำหรับ browser control endpoints (การเปิดเผยสู่สาธารณะ)

### Secrets บนดิสก์

ให้สมมติว่าสิ่งใดก็ตามภายใต้ `~/.openclaw/` (หรือ `$OPENCLAW_STATE_DIR/`) อาจมี secrets หรือข้อมูลส่วนตัว:

- `openclaw.json`: config อาจมี tokens (gateway, remote gateway), การตั้งค่า provider และ allowlists
- `credentials/**`: credentials ของช่องทาง (ตัวอย่าง: WhatsApp creds), pairing allowlists, legacy OAuth imports
- `agents/<agentId>/agent/auth-profiles.json`: API keys, token profiles, OAuth tokens และ `keyRef`/`tokenRef` แบบไม่บังคับ
- `secrets.json` (ไม่บังคับ): payload ของ secret แบบอิงไฟล์ที่ใช้โดย `file` SecretRef providers (`secrets.providers`)
- `agents/<agentId>/agent/auth.json`: ไฟล์ compatibility แบบเดิม entries แบบ static `api_key` จะถูก scrub เมื่อพบ
- `agents/<agentId>/sessions/**`: session transcripts (`*.jsonl`) + routing metadata (`sessions.json`) ที่อาจมีข้อความส่วนตัวและ output ของ tool
- bundled plugin packages: Plugins ที่ติดตั้งแล้ว (รวมทั้ง `node_modules/` ของมัน)
- `sandboxes/**`: workspaces ของ tool sandbox; อาจสะสมสำเนาของไฟล์ที่คุณอ่าน/เขียนภายใน sandbox

เคล็ดลับการเสริมความแข็งแกร่ง:

- คุมสิทธิ์ให้แน่น (`700` สำหรับ dirs, `600` สำหรับ files)
- ใช้การเข้ารหัสดิสก์ทั้งลูกบนโฮสต์ gateway
- ควรใช้บัญชี OS เฉพาะสำหรับ Gateway หากโฮสต์นั้นใช้ร่วมกัน

### ไฟล์ `.env` ของ workspace

OpenClaw จะโหลดไฟล์ `.env` ภายใน workspace สำหรับ agents และ tools แต่จะไม่ยอมให้ไฟล์เหล่านั้น override ตัวควบคุม runtime ของ gateway แบบเงียบ ๆ

- คีย์ใดก็ตามที่ขึ้นต้นด้วย `OPENCLAW_*` จะถูกบล็อกจากไฟล์ `.env` ของ workspace ที่ไม่น่าเชื่อถือ
- การตั้งค่า endpoint ของช่องทางสำหรับ Matrix, Mattermost, IRC และ Synology Chat ก็ถูกบล็อกจากการ override ผ่าน `.env` ของ workspace เช่นกัน ดังนั้น workspaces ที่ clone มาไม่สามารถเปลี่ยนทิศทางทราฟฟิกของ bundled connector ผ่าน local endpoint config ได้ endpoint env keys (เช่น `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) ต้องมาจาก process environment ของ gateway หรือ `env.shellEnv` ไม่ใช่จาก `.env` ที่โหลดจาก workspace
- การบล็อกนี้เป็นแบบ fail-closed: runtime-control variable ใหม่ที่เพิ่มเข้ามาในรีลีสอนาคตจะไม่สามารถถูกสืบทอดจาก `.env` ที่ถูก commit ไว้หรือที่ผู้โจมตีส่งมาได้แบบเงียบ ๆ; คีย์นั้นจะถูกละเลยและ gateway จะคงค่าของตัวเองไว้
- ตัวแปรสภาพแวดล้อมของ process/OS ที่เชื่อถือได้ (shell ของ gateway เอง, launchd/systemd unit, app bundle) ยังคงมีผล — สิ่งนี้จำกัดเฉพาะการโหลดไฟล์ `.env` เท่านั้น

เหตุผล: ไฟล์ `.env` ของ workspace มักอยู่ข้าง ๆ โค้ดของ agent, ถูก commit โดยไม่ตั้งใจ หรือถูกเขียนโดย tools การบล็อก prefix `OPENCLAW_*` ทั้งหมดหมายความว่าการเพิ่ม flag `OPENCLAW_*` ใหม่ในภายหลังจะไม่มีวันถอยหลังกลายเป็นการสืบทอดจากสถานะของ workspace แบบเงียบ ๆ ได้

### Logs และ transcripts (การปกปิดข้อมูลและการเก็บรักษา)

Logs และ transcripts อาจรั่วข้อมูลที่อ่อนไหวได้ แม้การควบคุมการเข้าถึงจะถูกต้องแล้ว:

- Gateway logs อาจรวม tool summaries, errors และ URLs
- Session transcripts อาจรวม secrets ที่วางเข้ามา, เนื้อหาไฟล์, command output และลิงก์

คำแนะนำ:

- คงการปกปิดข้อมูลของ tool summary ไว้ (`logging.redactSensitive: "tools"`; ค่าเริ่มต้น)
- เพิ่ม patterns แบบกำหนดเองสำหรับสภาพแวดล้อมของคุณผ่าน `logging.redactPatterns` (tokens, hostnames, internal URLs)
- เมื่อแชร์ข้อมูลวินิจฉัย ควรใช้ `openclaw status --all` (วางต่อได้, ปกปิด secrets แล้ว) แทน raw logs
- ลบ session transcripts และ log files เก่า หากคุณไม่ต้องการการเก็บระยะยาว

รายละเอียด: [Logging](/th/gateway/logging)

### DMs: ใช้ pairing โดยค่าเริ่มต้น

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### กลุ่ม: บังคับให้ต้องกล่าวถึงทุกที่

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

ในแชตกลุ่ม ให้ตอบเฉพาะเมื่อมีการกล่าวถึงอย่างชัดเจน

### แยกหมายเลขกัน (WhatsApp, Signal, Telegram)

สำหรับช่องทางที่อิงหมายเลขโทรศัพท์ ให้พิจารณารัน AI ของคุณบนหมายเลขโทรศัพท์ที่แยกจากหมายเลขส่วนตัว:

- หมายเลขส่วนตัว: บทสนทนาของคุณยังคงเป็นส่วนตัว
- หมายเลขบอต: AI จะจัดการสิ่งเหล่านี้ โดยมีขอบเขตที่เหมาะสม

### โหมดอ่านอย่างเดียว (ผ่าน sandbox และ tools)

คุณสามารถสร้างโปรไฟล์แบบอ่านอย่างเดียวได้โดยผสาน:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (หรือ `"none"` หากไม่ต้องการให้เข้าถึง workspace เลย)
- รายการ allow/deny ของ tools ที่บล็อก `write`, `edit`, `apply_patch`, `exec`, `process` ฯลฯ

ตัวเลือกเสริมความแข็งแกร่งเพิ่มเติม:

- `tools.exec.applyPatch.workspaceOnly: true` (ค่าเริ่มต้น): ทำให้มั่นใจว่า `apply_patch` ไม่สามารถเขียน/ลบนอกไดเรกทอรี workspace ได้ แม้จะปิด sandboxing อยู่ก็ตาม ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` แตะไฟล์นอก workspace จริง ๆ
- `tools.fs.workspaceOnly: true` (ไม่บังคับ): จำกัด paths ของ `read`/`write`/`edit`/`apply_patch` และ native prompt image auto-load paths ให้อยู่ภายในไดเรกทอรี workspace (มีประโยชน์หากวันนี้คุณอนุญาต absolute paths อยู่และต้องการ guardrail เดียวที่ใช้ได้ทั้งหมด)
- คุม filesystem roots ให้แคบ: หลีกเลี่ยง roots กว้าง ๆ อย่างโฮมไดเรกทอรีของคุณสำหรับ agent workspaces/sandbox workspaces roots ที่กว้างอาจเปิดเผยไฟล์โลคัลที่อ่อนไหว (เช่น state/config ภายใต้ `~/.openclaw`) ให้ filesystem tools เข้าถึงได้

### baseline ที่ปลอดภัย (คัดลอก/วาง)

config “ค่าเริ่มต้นที่ปลอดภัย” แบบหนึ่ง ที่คง Gateway ให้เป็นส่วนตัว บังคับ DM pairing และหลีกเลี่ยงบอตกลุ่มแบบ always-on:

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

หากคุณต้องการการรัน tool แบบ “ปลอดภัยกว่าโดยค่าเริ่มต้น” ด้วย ให้เพิ่ม sandbox + deny tools ที่อันตรายสำหรับ agent ที่ไม่ใช่เจ้าของ (ดูตัวอย่างด้านล่างใน “โปรไฟล์การเข้าถึงแยกต่อ agent”)

baseline ที่มีมาให้สำหรับ agent turns ที่ขับเคลื่อนด้วยแชต: ผู้ส่งที่ไม่ใช่เจ้าของไม่สามารถใช้ tools `cron` หรือ `gateway` ได้

## Sandboxing (แนะนำ)

เอกสารเฉพาะ: [Sandboxing](/th/gateway/sandboxing)

มีสองแนวทางที่เสริมกัน:

- **รัน Gateway ทั้งหมดใน Docker** (ขอบเขตระดับ container): [Docker](/th/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, ใช้ host gateway + tools ที่แยกด้วย sandbox; Docker เป็น backend ค่าเริ่มต้น): [Sandboxing](/th/gateway/sandboxing)

หมายเหตุ: เพื่อป้องกันการเข้าถึงข้าม agent ให้คง `agents.defaults.sandbox.scope` ไว้ที่ `"agent"` (ค่าเริ่มต้น)
หรือ `"session"` เพื่อการแยกต่อเซสชันที่เข้มงวดกว่า `scope: "shared"` ใช้
container/workspace ร่วมเพียงตัวเดียว

ควรพิจารณาเรื่องการเข้าถึง workspace ของ agent ภายใน sandbox ด้วย:

- `agents.defaults.sandbox.workspaceAccess: "none"` (ค่าเริ่มต้น) จะปิดกั้น agent workspace; tools จะรันกับ sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` จะ mount agent workspace แบบ read-only ที่ `/agent` (ปิดการทำงานของ `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` จะ mount agent workspace แบบ read/write ที่ `/workspace`
- `sandbox.docker.binds` เพิ่มเติมจะถูกตรวจสอบกับ source paths ที่ normalize และ canonicalize แล้ว กลเม็ดแบบ parent-symlink และ canonical home aliases จะยัง fail-closed หาก resolve เข้า roots ที่ถูกบล็อก เช่น `/etc`, `/var/run` หรือไดเรกทอรี credentials ภายใต้โฮมของระบบปฏิบัติการ

ข้อสำคัญ: `tools.elevated` คือช่องทางหลบออกจาก baseline แบบ global ที่รัน exec นอก sandbox effective host คือ `gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อกำหนด exec target เป็น `node` คุม `tools.elevated.allowFrom` ให้แคบ และอย่าเปิดใช้กับคนแปลกหน้า คุณสามารถจำกัด elevated เพิ่มเติมแยกต่อ agent ได้ด้วย `agents.list[].tools.elevated` ดู [Elevated Mode](/th/tools/elevated)

### guardrail สำหรับการมอบหมาย sub-agent

หากคุณอนุญาต session tools ให้มองการรัน sub-agent แบบมอบหมายเป็นการตัดสินใจเรื่องขอบเขตอีกชั้นหนึ่ง:

- deny `sessions_spawn` เว้นแต่ agent นั้นจำเป็นต้องใช้การมอบหมายจริง ๆ
- คุม `agents.defaults.subagents.allowAgents` และ overrides แบบต่อ agent ใน `agents.list[].subagents.allowAgents` ให้อนุญาตเฉพาะ target agents ที่ทราบว่าปลอดภัย
- สำหรับ workflow ใดก็ตามที่ต้องคงอยู่ใน sandbox ให้เรียก `sessions_spawn` ด้วย `sandbox: "require"` (ค่าเริ่มต้นคือ `inherit`)
- `sandbox: "require"` จะล้มเหลวทันทีเมื่อ child runtime เป้าหมายไม่ได้ถูก sandbox

## ความเสี่ยงของ browser control

การเปิดใช้ browser control ทำให้โมเดลสามารถควบคุม browser จริงได้
หาก browser profile นั้นมีเซสชันที่ล็อกอินไว้แล้ว โมเดลก็สามารถ
เข้าถึงบัญชีและข้อมูลเหล่านั้นได้ ให้ถือว่า browser profiles เป็น **สถานะที่อ่อนไหว**:

- ควรใช้ profile เฉพาะสำหรับ agent (profile ค่าเริ่มต้นคือ `openclaw`)
- หลีกเลี่ยงการชี้ agent ไปยัง profile ส่วนตัวที่คุณใช้ประจำวัน
- ปิด host browser control สำหรับ agents ที่ถูก sandbox เว้นแต่คุณจะเชื่อถือพวกมัน
- standalone loopback browser control API จะยอมรับเฉพาะ shared-secret auth
  (gateway token bearer auth หรือ gateway password) เท่านั้น มันไม่ใช้
  trusted-proxy หรือ Tailscale Serve identity headers
- ให้มอง browser downloads เป็นอินพุตที่ไม่น่าเชื่อถือ; ควรใช้ไดเรกทอรีดาวน์โหลดที่แยกไว้
- ปิด browser sync/password managers ใน profile ของ agent หากทำได้ (ลดรัศมีผลกระทบ)
- สำหรับ remote gateways ให้ถือว่า “browser control” เทียบเท่ากับ “operator access” ต่อสิ่งใดก็ตามที่ profile นั้นเข้าถึงได้
- คุมให้ Gateway และ node hosts อยู่ใน tailnet เท่านั้น; หลีกเลี่ยงการเปิดเผย browser control ports ไปยัง LAN หรือ public Internet
- ปิด browser proxy routing เมื่อคุณไม่ต้องการใช้ (`gateway.nodes.browser.mode="off"`)
- Chrome MCP existing-session mode **ไม่ได้** “ปลอดภัยกว่า”; มันสามารถทำงานแทนคุณบนสิ่งใดก็ตามที่ host Chrome profile นั้นเข้าถึงได้

### นโยบาย Browser SSRF (เข้มงวดโดยค่าเริ่มต้น)

นโยบาย browser navigation ของ OpenClaw เข้มงวดโดยค่าเริ่มต้น: ปลายทางแบบ private/internal จะยังถูกบล็อก เว้นแต่คุณจะเลือกเปิดใช้อย่าง explicit

- ค่าเริ่มต้น: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่ได้ถูกตั้งไว้ ดังนั้น browser navigation จะยังคงบล็อกปลายทางแบบ private/internal/special-use
- alias แบบเดิม: `browser.ssrfPolicy.allowPrivateNetwork` ยังยอมรับได้เพื่อความเข้ากันได้
- โหมด opt-in: ตั้ง `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพื่ออนุญาตปลายทางแบบ private/internal/special-use
- ใน strict mode ให้ใช้ `hostnameAllowlist` (patterns เช่น `*.example.com`) และ `allowedHostnames` (ข้อยกเว้นแบบ host ตรงตัว รวมถึงชื่อที่ปกติถูกบล็อกอย่าง `localhost`) สำหรับข้อยกเว้นแบบ explicit
- การนำทางจะถูกตรวจสอบก่อน request และตรวจซ้ำแบบ best-effort กับ `http(s)` URL สุดท้ายหลังการนำทาง เพื่อลดการ pivot ผ่าน redirect

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

## โปรไฟล์การเข้าถึงแยกต่อ agent (หลาย agent)

ด้วยการกำหนดเส้นทางแบบหลาย agent แต่ละ agent สามารถมี sandbox + tool policy ของตัวเองได้:
ใช้สิ่งนี้เพื่อกำหนดสิทธิ์ **เต็ม**, **อ่านอย่างเดียว** หรือ **ไม่มีสิทธิ์** แยกต่อ agent
ดู [Sandbox & Tools แบบหลาย agent](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดเต็ม
และกฎลำดับความสำคัญ

กรณีใช้งานที่พบบ่อย:

- agent ส่วนตัว: สิทธิ์เต็ม, ไม่มี sandbox
- agent สำหรับครอบครัว/งาน: sandboxed + tools แบบอ่านอย่างเดียว
- agent สาธารณะ: sandboxed + ไม่มี tools สำหรับ filesystem/shell

### ตัวอย่าง: สิทธิ์เต็ม (ไม่มี sandbox)

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

### ตัวอย่าง: ไม่มีสิทธิ์ filesystem/shell (แต่อนุญาต provider messaging)

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
        // Session tools อาจเปิดเผยข้อมูลอ่อนไหวจาก transcripts โดยค่าเริ่มต้น OpenClaw จำกัด tools เหล่านี้
        // ไว้ที่เซสชันปัจจุบัน + เซสชันของ subagent ที่ถูก spawn แต่คุณสามารถบีบให้แคบลงอีกได้หากจำเป็น
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

1. **หยุดมัน:** หยุดแอป macOS (หากมันเป็นผู้ดูแล Gateway) หรือยุติ process `openclaw gateway`
2. **ปิดการเปิดเผย:** ตั้ง `gateway.bind: "loopback"` (หรือปิด Tailscale Funnel/Serve) จนกว่าคุณจะเข้าใจว่าเกิดอะไรขึ้น
3. **ระงับการเข้าถึง:** เปลี่ยน DMs/กลุ่มที่เสี่ยงเป็น `dmPolicy: "disabled"` / บังคับให้ต้องกล่าวถึง และลบรายการ allow-all แบบ `"*"` หากคุณเคยมี

### หมุนเวียนข้อมูลลับ (ให้สมมติว่าถูก compromise หาก secrets รั่ว)

1. หมุนเวียน Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) และรีสตาร์ต
2. หมุนเวียน remote client secrets (`gateway.remote.token` / `.password`) บนทุกเครื่องที่สามารถเรียกเข้า Gateway ได้
3. หมุนเวียน provider/API credentials (WhatsApp creds, Slack/Discord tokens, model/API keys ใน `auth-profiles.json` และค่าใน encrypted secrets payload เมื่อมีการใช้)

### Audit

1. ตรวจสอบ Gateway logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (หรือ `logging.file`)
2. ตรวจสอบ transcript(s) ที่เกี่ยวข้อง: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. ตรวจสอบการเปลี่ยนแปลง config ล่าสุด (สิ่งใดก็ตามที่อาจขยายการเข้าถึง: `gateway.bind`, `gateway.auth`, นโยบาย dm/group, `tools.elevated`, การเปลี่ยนแปลง Plugins)
4. รัน `openclaw security audit --deep` อีกครั้ง และยืนยันว่าข้อค้นพบระดับ critical ได้รับการแก้ไขแล้ว

### รวบรวมข้อมูลสำหรับรายงาน

- เวลาเกิดเหตุ, OS ของโฮสต์ gateway + เวอร์ชัน OpenClaw
- session transcript(s) + log tail สั้น ๆ (หลังจากปกปิดข้อมูลแล้ว)
- สิ่งที่ผู้โจมตีส่งมา + สิ่งที่ agent ทำ
- Gateway ถูกเปิดเผยนอก loopback หรือไม่ (LAN/Tailscale Funnel/Serve)

## Secret scanning ด้วย detect-secrets

CI จะรัน pre-commit hook ของ `detect-secrets` ใน job `secrets`
การ push ไปยัง `main` จะรัน all-files scan เสมอ ส่วน pull requests จะใช้เส้นทาง
แบบ changed-file ที่เร็วกว่าเมื่อมี base commit และจะ fallback ไปเป็น all-files scan
ในกรณีอื่น หากมันล้มเหลว แปลว่ามี candidates ใหม่ที่ยังไม่อยู่ใน baseline

### หาก CI ล้มเหลว

1. จำลองปัญหาในเครื่อง:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ทำความเข้าใจเครื่องมือ:
   - `detect-secrets` ใน pre-commit จะรัน `detect-secrets-hook` โดยใช้
     baseline และ excludes ของ repo
   - `detect-secrets audit` จะเปิดการตรวจสอบแบบ interactive เพื่อทำเครื่องหมายแต่ละรายการใน baseline
     ว่าเป็นของจริงหรือ false positive
3. สำหรับ secrets จริง: หมุนเวียน/ลบออก แล้วรันการสแกนอีกครั้งเพื่ออัปเดต baseline
4. สำหรับ false positives: รัน interactive audit และทำเครื่องหมายว่าเป็น false:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. หากคุณต้องการ excludes ใหม่ ให้เพิ่มเข้า `.detect-secrets.cfg` และสร้าง
   baseline ใหม่ด้วย flags `--exclude-files` / `--exclude-lines` ที่ตรงกัน (ไฟล์ config
   นี้มีไว้เป็นข้อมูลอ้างอิงเท่านั้น; detect-secrets ไม่ได้อ่านมันโดยอัตโนมัติ)

commit `.secrets.baseline` ที่อัปเดตแล้วเมื่อมันสะท้อนสถานะที่ตั้งใจไว้

## การรายงานปัญหาด้านความปลอดภัย

พบช่องโหว่ใน OpenClaw หรือ? โปรดรายงานอย่างรับผิดชอบ:

1. อีเมล: [security@openclaw.ai](mailto:security@openclaw.ai)
2. อย่าโพสต์สาธารณะจนกว่าจะมีการแก้ไข
3. เราจะให้เครดิตคุณ (เว้นแต่คุณต้องการไม่เปิดเผยตัวตน)
