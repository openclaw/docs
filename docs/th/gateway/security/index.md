---
read_when:
    - การเพิ่มฟีเจอร์ที่ขยายการเข้าถึงหรือระบบอัตโนมัติ
summary: ข้อพิจารณาด้านความปลอดภัยและโมเดลภัยคุกคามสำหรับการรัน AI gateway ที่มีสิทธิ์เข้าถึง shell
title: Security
x-i18n:
    generated_at: "2026-04-24T09:12:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e8cfc2bd0b4519f60d10b10b3496869a1668d57905926607f597aa34e4ce6de
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **โมเดลความเชื่อถือแบบผู้ช่วยส่วนตัว** แนวทางนี้ตั้งอยู่บนสมมติฐานว่ามีขอบเขตผู้ปฏิบัติงานที่เชื่อถือได้หนึ่งขอบเขตต่อหนึ่ง gateway (โมเดลผู้ใช้เดี่ยวแบบผู้ช่วยส่วนตัว)
  OpenClaw **ไม่ใช่** ขอบเขตความปลอดภัยแบบหลายผู้เช่าที่ต้านทานผู้ใช้ที่เป็นปฏิปักษ์ซึ่งใช้เอเจนต์หรือ gateway ร่วมกัน หากคุณต้องการการทำงานแบบความเชื่อถือผสมหรือมีผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกขอบเขตความเชื่อถือ (gateway + ข้อมูลรับรองแยกกัน และ ideally แยก OS user หรือโฮสต์ด้วย)
</Warning>

## เริ่มจากขอบเขต: โมเดลความปลอดภัยแบบผู้ช่วยส่วนตัว

แนวทางความปลอดภัยของ OpenClaw ตั้งอยู่บนการติดตั้งใช้งานแบบ **ผู้ช่วยส่วนตัว**: มีขอบเขตผู้ปฏิบัติงานที่เชื่อถือได้หนึ่งขอบเขต อาจมีหลายเอเจนต์ก็ได้

- สถานะความปลอดภัยที่รองรับ: ผู้ใช้/ขอบเขตความเชื่อถือหนึ่งรายต่อหนึ่ง gateway (ควรเป็นหนึ่ง OS user/โฮสต์/VPS ต่อหนึ่งขอบเขต)
- สิ่งที่ไม่ใช่ขอบเขตความปลอดภัยที่รองรับ: gateway/เอเจนต์เดียวที่ใช้ร่วมกันโดยผู้ใช้ที่ไม่ไว้ใจกันหรือเป็นปฏิปักษ์ต่อกัน
- หากต้องการการแยกผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกตามขอบเขตความเชื่อถือ (gateway + ข้อมูลรับรองแยกกัน และ ideally แยก OS user/โฮสต์)
- หากผู้ใช้ที่ไม่ไว้ใจกันหลายรายสามารถส่งข้อความหาเอเจนต์ที่ใช้เครื่องมือได้หนึ่งตัว ให้ถือว่าพวกเขากำลังใช้สิทธิ์ของเครื่องมือชุดเดียวกันที่ถูกมอบหมายให้เอเจนต์ตัวนั้นร่วมกัน

หน้านี้อธิบายการเสริมความปลอดภัย **ภายในโมเดลนี้** โดยไม่ได้อ้างว่ามีการแยกหลายผู้เช่าแบบต้านทานศัตรูบน gateway ที่ใช้ร่วมกันตัวเดียว

## ตรวจแบบเร็ว: `openclaw security audit`

ดูเพิ่มเติม: [Formal Verification (Security Models)](/th/security/formal-verification)

ให้รันสิ่งนี้เป็นประจำ (โดยเฉพาะหลังเปลี่ยนคอนฟิกหรือเปิดเผยพื้นผิวเครือข่าย):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` จะตั้งใจทำงานในขอบเขตแคบ: มันจะสลับนโยบายกลุ่มแบบเปิดที่พบบ่อยให้เป็น allowlist, คืนค่า `logging.redactSensitive: "tools"`, ทำให้สิทธิ์ของ state/config/include-file เข้มงวดขึ้น และใช้การรีเซ็ต Windows ACL แทน POSIX `chmod` เมื่อรันบน Windows

มันจะเตือนถึง footgun ที่พบบ่อย (การเปิดเผย Gateway auth, การเปิดเผยการควบคุมเบราว์เซอร์, allowlist ที่ยกระดับสิทธิ์, สิทธิ์ของไฟล์ระบบ, exec approval ที่ผ่อนปรนเกินไป และการเปิดใช้เครื่องมือผ่านช่องทางแบบเปิด)

OpenClaw เป็นทั้งผลิตภัณฑ์และการทดลอง: คุณกำลังเชื่อมพฤติกรรมของ frontier model เข้ากับพื้นผิวการส่งข้อความจริงและเครื่องมือจริง **ไม่มีการตั้งค่าที่ “ปลอดภัยสมบูรณ์แบบ”** เป้าหมายคือการตั้งใจให้ชัดเจนเกี่ยวกับ:

- ใครบ้างที่สามารถคุยกับบอตของคุณได้
- ที่ใดบ้างที่บอตได้รับอนุญาตให้กระทำ
- บอตสามารถแตะต้องอะไรได้บ้าง

เริ่มจากสิทธิ์ที่เล็กที่สุดที่ยังใช้งานได้ แล้วค่อยขยายเมื่อคุณมั่นใจมากขึ้น

### การติดตั้งใช้งานและความเชื่อถือในโฮสต์

OpenClaw ถือว่าโฮสต์และขอบเขตคอนฟิกเป็นสิ่งที่เชื่อถือได้:

- หากใครสามารถแก้ไขสถานะ/คอนฟิกของโฮสต์ Gateway ได้ (`~/.openclaw` รวมถึง `openclaw.json`) ให้ถือว่าคนนั้นเป็นผู้ปฏิบัติงานที่เชื่อถือได้
- การรัน Gateway เดียวสำหรับผู้ปฏิบัติงานหลายรายที่ไม่ไว้ใจกัน/เป็นปฏิปักษ์ต่อกัน **ไม่ใช่การตั้งค่าที่แนะนำ**
- สำหรับทีมที่มีความเชื่อถือผสม ให้แยกขอบเขตความเชื่อถือด้วย gateway แยกกัน (หรืออย่างน้อยแยก OS user/โฮสต์)
- ค่าปริยายที่แนะนำ: หนึ่งผู้ใช้ต่อหนึ่งเครื่อง/โฮสต์ (หรือ VPS), หนึ่ง gateway สำหรับผู้ใช้นั้น และมีเอเจนต์หนึ่งตัวหรือมากกว่าใน gateway นั้น
- ภายในอินสแตนซ์ Gateway เดียว การเข้าถึงของ operator ที่ยืนยันตัวตนแล้วเป็นบทบาท control-plane ที่เชื่อถือได้ ไม่ใช่บทบาทผู้เช่ารายผู้ใช้
- ตัวระบุเซสชัน (`sessionKey`, session ID, label) เป็นตัวเลือกสำหรับการ route ไม่ใช่โทเค็นการยืนยันสิทธิ์
- หากมีหลายคนส่งข้อความหาเอเจนต์ที่ใช้เครื่องมือได้หนึ่งตัว คนเหล่านั้นแต่ละคนสามารถชี้นำชุดสิทธิ์เดียวกันนั้นได้ การแยกเซสชัน/Memory รายผู้ใช้ช่วยเรื่องความเป็นส่วนตัว แต่ไม่ได้เปลี่ยนเอเจนต์ที่ใช้ร่วมกันให้กลายเป็นการยืนยันสิทธิ์ของโฮสต์แบบรายผู้ใช้

### เวิร์กสเปซ Slack ที่ใช้ร่วมกัน: ความเสี่ยงจริง

หาก “ทุกคนใน Slack สามารถส่งข้อความหาบอตได้” ความเสี่ยงหลักคือสิทธิ์ของเครื่องมือที่ถูกมอบหมาย:

- ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้สามารถชักนำให้เกิดการเรียกใช้เครื่องมือ (`exec`, เบราว์เซอร์, เครื่องมือเครือข่าย/ไฟล์) ภายใต้นโยบายของเอเจนต์;
- prompt/content injection จากผู้ส่งคนหนึ่งอาจก่อให้เกิดการกระทำที่ส่งผลต่อสถานะ อุปกรณ์ หรือผลลัพธ์ที่ใช้ร่วมกัน;
- หากเอเจนต์ที่ใช้ร่วมกันหนึ่งตัวมีข้อมูลรับรอง/ไฟล์ที่อ่อนไหว ผู้ส่งที่ได้รับอนุญาตคนใดก็ได้อาจชี้นำให้เกิดการรั่วไหลผ่านการใช้เครื่องมือได้

ใช้เอเจนต์/เกตเวย์แยกกันพร้อมเครื่องมือเท่าที่จำเป็นสำหรับเวิร์กโฟลว์ของทีม; เก็บเอเจนต์ที่มีข้อมูลส่วนตัวไว้เป็นส่วนตัว

### เอเจนต์ที่ใช้ร่วมกันในบริษัท: รูปแบบที่ยอมรับได้

สิ่งนี้ยอมรับได้เมื่อทุกคนที่ใช้เอเจนต์นั้นอยู่ในขอบเขตความเชื่อถือเดียวกัน (เช่น ทีมหนึ่งในบริษัทเดียวกัน) และเอเจนต์นั้นอยู่ในขอบเขตงานธุรกิจอย่างเข้มงวด

- รันบนเครื่อง/VM/container เฉพาะ;
- ใช้ OS user + เบราว์เซอร์/โปรไฟล์/บัญชีเฉพาะสำหรับรันไทม์นั้น;
- อย่าล็อกอินรันไทม์นั้นเข้ากับบัญชี Apple/Google ส่วนตัว หรือโปรไฟล์ของตัวจัดการรหัสผ่าน/เบราว์เซอร์ส่วนตัว

หากคุณผสมตัวตนส่วนตัวและตัวตนบริษัทไว้ในรันไทม์เดียวกัน คุณจะทำให้การแยกนั้นพังลงและเพิ่มความเสี่ยงของการเปิดเผยข้อมูลส่วนตัว

## แนวคิดเรื่องความเชื่อถือของ Gateway และ Node

ให้ถือว่า Gateway และ Node เป็นโดเมนความเชื่อถือของ operator เดียวกัน แต่มีบทบาทต่างกัน:

- **Gateway** คือ control plane และพื้นผิวนโยบาย (`gateway.auth`, นโยบายเครื่องมือ, การ route)
- **Node** คือพื้นผิวการทำงานระยะไกลที่จับคู่กับ Gateway นั้น (คำสั่ง, การกระทำบนอุปกรณ์, ความสามารถเฉพาะเครื่อง)
- ผู้เรียกที่ยืนยันตัวตนกับ Gateway ได้ ถือว่าเชื่อถือได้ในขอบเขตของ Gateway หลังจากจับคู่แล้ว การกระทำบน Node ถือเป็นการกระทำของ operator ที่เชื่อถือได้บน Node นั้น
- `sessionKey` คือการเลือก route/บริบท ไม่ใช่ auth รายผู้ใช้
- Exec approval (allowlist + ask) เป็น guardrail สำหรับเจตนาของ operator ไม่ใช่การแยกหลายผู้เช่าแบบต้านทานผู้ใช้ที่เป็นปฏิปักษ์
- ค่าปริยายของผลิตภัณฑ์ OpenClaw สำหรับการตั้งค่าแบบ trusted single-operator คืออนุญาต host exec บน `gateway`/`node` โดยไม่ต้องมีพรอมป์ขออนุมัติ (`security="full"`, `ask="off"` เว้นแต่คุณจะทำให้เข้มงวดขึ้น) ค่าปริยายนี้ตั้งใจเพื่อ UX ไม่ใช่ช่องโหว่โดยตัวมันเอง
- Exec approval จะผูกกับบริบทของคำขอแบบตรงตัวและ operand ของไฟล์ในเครื่องแบบ direct เท่าที่ทำได้; มันไม่ได้สร้างโมเดลเชิงความหมายสำหรับทุกเส้นทางของ runtime/interpreter loader ใช้ sandboxing และ host isolation หากต้องการขอบเขตที่แข็งแรง

หากคุณต้องการการแยกผู้ใช้ที่เป็นปฏิปักษ์ ให้แยกขอบเขตความเชื่อถือด้วย OS user/โฮสต์ และรัน gateway แยกกัน

## เมทริกซ์ขอบเขตความเชื่อถือ

ใช้สิ่งนี้เป็นโมเดลแบบเร็วเมื่อประเมินความเสี่ยง:

| ขอบเขตหรือการควบคุม                                   | ความหมาย                                           | ความเข้าใจผิดที่พบบ่อย                                                       |
| ------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | ยืนยันตัวตนผู้เรียกต่อ Gateway API                | "ต้องมีลายเซ็นต่อข้อความทุกเฟรมถึงจะปลอดภัย"                                 |
| `sessionKey`                                           | คีย์สำหรับ route ในการเลือกบริบท/เซสชัน          | "Session key เป็นขอบเขต auth ของผู้ใช้"                                       |
| Prompt/content guardrail                               | ลดความเสี่ยงจากการใช้โมเดลในทางที่ผิด             | "Prompt injection เพียงอย่างเดียวพิสูจน์การข้าม auth ได้แล้ว"                 |
| `canvas.eval` / browser evaluate                       | ความสามารถของ operator ที่ตั้งใจเปิดเมื่อเปิดใช้   | "primitive สำหรับ JS eval ทุกตัวถือเป็นช่องโหว่โดยอัตโนมัติในโมเดลความเชื่อถือนี้" |
| Local TUI `!` shell                                    | การรันในเครื่องที่ operator เป็นผู้ทริกเกอร์อย่างชัดเจน | "คำสั่ง shell แบบสะดวกในเครื่องคือการ inject จากระยะไกล"                      |
| การจับคู่ Node และคำสั่งของ Node                      | การรันระยะไกลระดับ operator บนอุปกรณ์ที่จับคู่แล้ว | "การควบคุมอุปกรณ์ระยะไกลควรถูกมองเป็นการเข้าถึงของผู้ใช้ที่ไม่เชื่อถือได้โดยค่าปริยาย" |

## สิ่งที่ไม่ถือเป็นช่องโหว่โดยการออกแบบ

<Accordion title="กรณีที่พบได้บ่อยซึ่งอยู่นอกขอบเขต">
  รูปแบบเหล่านี้ถูกรายงานบ่อย และมักถูกปิดว่าไม่ต้องดำเนินการ เว้นแต่
  จะพิสูจน์การข้ามขอบเขตจริงได้:

- โซ่เหตุการณ์ที่มีเพียง prompt injection โดยไม่มีการข้ามนโยบาย auth หรือ sandbox
- ข้อกล่าวอ้างที่ตั้งอยู่บนสมมติฐานว่าใช้งานแบบ hostile multi-tenant บนโฮสต์เดียวหรือ
  คอนฟิกเดียว
- ข้อกล่าวอ้างที่จัดการเข้าถึงเส้นทางอ่านของ operator ตามปกติ (เช่น
  `sessions.list` / `sessions.preview` / `chat.history`) ว่าเป็น IDOR ใน
  การตั้งค่า shared-gateway
- ข้อค้นพบที่เกิดเฉพาะกับการติดตั้งแบบ localhost-only (เช่น HSTS บน gateway
  ที่เปิดเฉพาะ loopback)
- ข้อค้นพบเรื่องลายเซ็น inbound webhook ของ Discord สำหรับเส้นทางขาเข้าที่ไม่มี
  อยู่ใน repo นี้
- รายงานที่มอง metadata ของการจับคู่ Node ว่าเป็นชั้นการอนุมัติซ่อนอยู่ชั้นที่สองแบบรายคำสั่ง
  สำหรับ `system.run` ทั้งที่ขอบเขตการรันจริงยังคงเป็นนโยบายคำสั่ง Node ระดับ global ของ gateway
  บวกกับ exec approval ของ Node เอง
- ข้อค้นพบเรื่อง "ขาดการยืนยันสิทธิ์รายผู้ใช้" ที่ถือว่า `sessionKey` เป็น
  auth token
</Accordion>

## baseline แบบ hardened ใน 60 วินาที

ใช้ baseline นี้ก่อน แล้วค่อยเปิดเครื่องมือกลับเป็นรายเอเจนต์ที่เชื่อถือได้:

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

สิ่งนี้จะคง Gateway ไว้แบบ local-only, แยก DM และปิดเครื่องมือฝั่ง control-plane/runtime เป็นค่าปริยาย

## กฎแบบเร็วสำหรับกล่องข้อความที่ใช้ร่วมกัน

หากมีมากกว่าหนึ่งคนที่สามารถส่ง DM หาบอตของคุณได้:

- ตั้ง `session.dmScope: "per-channel-peer"` (หรือ `"per-account-channel-peer"` สำหรับช่องทางแบบหลายบัญชี)
- คง `dmPolicy: "pairing"` หรือใช้ allowlist แบบเข้มงวด
- อย่าผสม DM ที่ใช้ร่วมกันเข้ากับการเข้าถึงเครื่องมือแบบกว้าง
- สิ่งนี้ช่วยเสริมความแข็งแรงสำหรับกล่องข้อความแบบร่วมมือ/ใช้ร่วมกัน แต่ไม่ได้ถูกออกแบบเป็นการแยก co-tenant แบบต้านทานศัตรูเมื่อผู้ใช้มีสิทธิ์เขียน host/config ร่วมกัน

## โมเดลการมองเห็นบริบท

OpenClaw แยกสองแนวคิดออกจากกัน:

- **การยืนยันสิทธิ์ในการทริกเกอร์**: ใครบ้างที่สามารถทริกเกอร์เอเจนต์ได้ (`dmPolicy`, `groupPolicy`, allowlist, mention gate)
- **การมองเห็นบริบท**: บริบทเสริมใดบ้างที่ถูก inject เข้าไปในอินพุตของโมเดล (เนื้อหาการตอบกลับ, ข้อความที่อ้างอิง, ประวัติเธรด, metadata ของการส่งต่อ)

Allowlists ใช้ควบคุมการทริกเกอร์และการยืนยันสิทธิ์ของคำสั่ง ส่วนการตั้งค่า `contextVisibility` ควบคุมว่าบริบทเสริม (การตอบกลับแบบ quote, root ของ thread, ประวัติที่ดึงมา) จะถูกกรองอย่างไร:

- `contextVisibility: "all"` (ค่าปริยาย) จะคงบริบทเสริมไว้ตามที่ได้รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจ allowlist ที่กำลังใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บ explicit quoted reply ไว้หนึ่งรายการ

ตั้งค่า `contextVisibility` ได้ทั้งรายช่องทางหรือรายห้อง/บทสนทนา ดู [Group Chats](/th/channels/groups#context-visibility-and-allowlists) สำหรับรายละเอียดการตั้งค่า

แนวทางในการ triage เชิงคำแนะนำ:

- ข้อกล่าวอ้างที่แสดงเพียงว่า "โมเดลมองเห็นข้อความที่อ้างอิงหรือข้อความย้อนหลังจากผู้ส่งที่ไม่ได้อยู่ใน allowlist ได้" ถือเป็นข้อค้นพบด้านการ hardening ที่แก้ได้ด้วย `contextVisibility` ไม่ใช่การข้ามขอบเขต auth หรือ sandbox โดยตัวมันเอง
- หากจะถือว่ากระทบด้านความปลอดภัย รายงานยังต้องแสดงการข้ามขอบเขตความเชื่อถือที่พิสูจน์ได้ (auth, policy, sandbox, approval หรือขอบเขตอื่นที่มีการบันทึกไว้)

## สิ่งที่ audit ตรวจสอบ (ระดับสูง)

- **การเข้าถึงขาเข้า** (`dmPolicy`, `groupPolicy`, allowlist): คนแปลกหน้าสามารถทริกเกอร์บอตได้หรือไม่?
- **รัศมีผลกระทบของเครื่องมือ** (เครื่องมือที่ยกระดับสิทธิ์ + ห้องแบบเปิด): prompt injection สามารถกลายเป็นการกระทำผ่าน shell/ไฟล์/เครือข่ายได้หรือไม่?
- **การเบี่ยงเบนของ exec approval** (`security=full`, `autoAllowSkills`, allowlist ของ interpreter ที่ไม่มี `strictInlineEval`): guardrail ของ host-exec ยังทำงานตามที่คุณคิดอยู่หรือไม่?
  - `security="full"` เป็นคำเตือนเรื่องท่าทีด้านความปลอดภัยแบบกว้าง ไม่ใช่หลักฐานว่ามีบั๊ก มันคือค่าปริยายที่เลือกไว้สำหรับการตั้งค่าแบบผู้ช่วยส่วนตัวที่เชื่อถือได้; ให้ทำให้เข้มงวดขึ้นเฉพาะเมื่อโมเดลภัยคุกคามของคุณต้องการ guardrail แบบ approval หรือ allowlist
- **การเปิดเผยผ่านเครือข่าย** (Gateway bind/auth, Tailscale Serve/Funnel, โทเค็น auth ที่อ่อนหรือสั้นเกินไป)
- **การเปิดเผยการควบคุมเบราว์เซอร์** (Node ระยะไกล, relay port, remote CDP endpoint)
- **สุขอนามัยของดิสก์ภายในเครื่อง** (สิทธิ์, symlink, config include, พาธแบบ “synced folder”)
- **Plugin** (โหลด Plugin โดยไม่มี allowlist แบบ explicit)
- **การเบี่ยงเบนของนโยบาย/การตั้งค่าผิดพลาด** (เช่น ตั้งค่า sandbox docker ไว้แต่ปิด sandbox mode; แพตเทิร์น `gateway.nodes.denyCommands` ที่ไม่มีผลเพราะจับคู่ตามชื่อคำสั่งแบบตรงตัวเท่านั้น (เช่น `system.run`) และไม่ตรวจข้อความ shell; รายการ `gateway.nodes.allowCommands` ที่อันตราย; `tools.profile="minimal"` แบบ global ถูก override ด้วยโปรไฟล์รายเอเจนต์; เครื่องมือที่ Plugin เป็นเจ้าของยังเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน)
- **ความเบี่ยงเบนจากความคาดหวังของรันไทม์** (เช่น คิดว่า implicit exec ยังคงหมายถึง `sandbox` ทั้งที่ตอนนี้ `tools.exec.host` มีค่าปริยายเป็น `auto`, หรือกำหนด `tools.exec.host="sandbox"` อย่างชัดเจนทั้งที่ปิด sandbox mode อยู่)
- **สุขอนามัยของโมเดล** (เตือนเมื่อโมเดลที่กำหนดค่าดูเหมือนเป็นรุ่น legacy; ไม่ใช่การบล็อกแบบแข็ง)

หากคุณรัน `--deep`, OpenClaw จะพยายาม probe Gateway แบบ live ตามความสามารถที่ทำได้

## แผนผังการจัดเก็บข้อมูลรับรอง

ใช้สิ่งนี้เมื่อตรวจสอบการเข้าถึงหรือตัดสินใจว่าจะสำรองอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **โทเค็นบอต Telegram**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; ไม่รับ symlink)
- **โทเค็นบอต Discord**: config/env หรือ SecretRef (env/file/exec providers)
- **โทเค็น Slack**: config/env (`channels.slack.*`)
- **allowlist สำหรับการจับคู่**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าปริยาย)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าปริยาย)
- **auth profile ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ของ Secrets ที่เก็บในไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **OAuth import แบบ legacy**: `~/.openclaw/credentials/oauth.json`

## เช็กลิสต์ security audit

เมื่อ audit พิมพ์ข้อค้นพบออกมา ให้จัดลำดับความสำคัญแบบนี้:

1. **อะไรก็ตามที่ “เปิด” + เปิดใช้เครื่องมืออยู่**: ล็อก DM/กลุ่มก่อน (pairing/allowlist) จากนั้นค่อยทำให้นโยบายเครื่องมือ/sandboxing เข้มงวดขึ้น
2. **การเปิดเผยต่อเครือข่ายสาธารณะ** (bind แบบ LAN, Funnel, ไม่มี auth): แก้ทันที
3. **การเปิดเผยการควบคุมเบราว์เซอร์จากระยะไกล**: ให้ถือว่าเทียบเท่าการเข้าถึงของ operator (tailnet-only, จับคู่ Node อย่างตั้งใจ, หลีกเลี่ยงการเปิดสู่สาธารณะ)
4. **สิทธิ์**: ตรวจให้แน่ใจว่า state/config/credentials/auth ไม่สามารถถูกอ่านได้โดย group/world
5. **Plugin**: โหลดเฉพาะสิ่งที่คุณเชื่อถืออย่างชัดเจนเท่านั้น
6. **การเลือกโมเดล**: ควรเลือกโมเดลสมัยใหม่ที่มี instruction hardening สำหรับบอตใดก็ตามที่ใช้เครื่องมือ

## อภิธานศัพท์ของ security audit

ข้อค้นพบแต่ละรายการใน audit จะมีคีย์เป็น `checkId` แบบมีโครงสร้าง (เช่น
`gateway.bind_no_auth` หรือ `tools.exec.security_full_configured`) กลุ่ม severity ระดับวิกฤตที่พบบ่อย:

- `fs.*` — สิทธิ์ของไฟล์ระบบบน state, config, credentials, auth profile
- `gateway.*` — bind mode, auth, Tailscale, Control UI, การตั้งค่า trusted-proxy
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — การ harden รายพื้นผิว
- `plugins.*`, `skills.*` — supply chain ของ Plugin/skill และข้อค้นพบจากการสแกน
- `security.exposure.*` — การตรวจแบบครอบคลุมหลายส่วน เมื่อ access policy มาบรรจบกับรัศมีผลกระทบของเครื่องมือ

ดูแค็ตตาล็อกทั้งหมดพร้อมระดับ severity, fix key และการรองรับ auto-fix ได้ที่
[Security audit checks](/th/gateway/security/audit-checks)

## Control UI ผ่าน HTTP

Control UI ต้องใช้ **secure context** (HTTPS หรือ localhost) เพื่อสร้าง device
identity `gateway.controlUi.allowInsecureAuth` เป็น toggle เพื่อความเข้ากันได้ในเครื่อง:

- บน localhost มันอนุญาตให้ทำ auth กับ Control UI โดยไม่มี device identity เมื่อโหลดหน้า
  ผ่าน HTTP ที่ไม่ปลอดภัย
- มันไม่ข้ามการตรวจ pairing
- มันไม่ผ่อนปรนข้อกำหนดเรื่อง device identity สำหรับระยะไกล (non-localhost)

ควรใช้ HTTPS (Tailscale Serve) หรือเปิด UI บน `127.0.0.1`

สำหรับกรณี break-glass เท่านั้น `gateway.controlUi.dangerouslyDisableDeviceAuth`
จะปิดการตรวจสอบ device identity ทั้งหมด นี่คือการลดระดับความปลอดภัยอย่างรุนแรง;
ควรปิดไว้ เว้นแต่คุณกำลังดีบักอยู่จริง ๆ และสามารถย้อนกลับได้อย่างรวดเร็ว

แยกจากแฟล็กอันตรายเหล่านั้น `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จสามารถยอมรับเซสชัน Control UI ของ **operator** ได้โดยไม่มี device identity นี่คือ
พฤติกรรมที่ตั้งใจไว้ของ auth mode ไม่ใช่ทางลัดแบบ `allowInsecureAuth` และยัง
ไม่ครอบคลุมไปถึงเซสชัน Control UI ที่มีบทบาทเป็น Node

`openclaw security audit` จะเตือนเมื่อมีการเปิดใช้งานการตั้งค่านี้

## สรุปแฟล็กที่ไม่ปลอดภัยหรืออันตราย

`openclaw security audit` จะยก `config.insecure_or_dangerous_flags` ขึ้นเมื่อ
มีการเปิดใช้สวิตช์ debug ที่รู้ว่าไม่ปลอดภัย/อันตราย ควรปล่อยให้ไม่มีการตั้งค่าเหล่านี้ใน
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

  <Accordion title="คีย์ `dangerous*` / `dangerously*` ทั้งหมดใน config schema">
    Control UI และเบราว์เซอร์:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    การจับคู่ชื่อของช่องทาง (ทั้งช่องทาง bundled และช่องทางจาก Plugin; และมีให้ใช้ต่อ
    `accounts.<accountId>` ด้วยเมื่อเกี่ยวข้อง):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (ช่องทางจาก Plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (ช่องทางจาก Plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (ช่องทางจาก Plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (ช่องทางจาก Plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (ช่องทางจาก Plugin)

    การเปิดเผยผ่านเครือข่าย:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (รวมถึงต่อบัญชีด้วย)

    Sandbox Docker (ค่าเริ่มต้น + รายเอเจนต์):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## การกำหนดค่า reverse proxy

หากคุณรัน Gateway หลัง reverse proxy (nginx, Caddy, Traefik ฯลฯ) ให้กำหนดค่า
`gateway.trustedProxies` เพื่อจัดการ forwarded-client IP อย่างถูกต้อง

เมื่อ Gateway ตรวจพบ proxy header จากที่อยู่ที่ **ไม่อยู่** ใน `trustedProxies` มันจะ **ไม่** มองการเชื่อมต่อว่าเป็น local client หากปิด gateway auth อยู่ การเชื่อมต่อนั้นจะถูกปฏิเสธ สิ่งนี้ป้องกันการข้ามการยืนยันตัวตนซึ่งมิฉะนั้นแล้วการเชื่อมต่อที่ผ่าน proxy อาจดูเหมือนมาจาก localhost และได้รับความเชื่อถือโดยอัตโนมัติ

`gateway.trustedProxies` ยังถูกใช้โดย `gateway.auth.mode: "trusted-proxy"` ด้วย แต่ auth mode นั้นเข้มงวดกว่า:

- trusted-proxy auth **fail closed เมื่อ proxy ต้นทางเป็น loopback**
- reverse proxy แบบ loopback บนโฮสต์เดียวกันยังคงใช้ `gateway.trustedProxies` สำหรับการตรวจ local-client และการจัดการ forwarded IP ได้
- สำหรับ reverse proxy แบบ loopback บนโฮสต์เดียวกัน ให้ใช้ token/password auth แทน `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP ของ reverse proxy
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

เมื่อกำหนด `trustedProxies` แล้ว Gateway จะใช้ `X-Forwarded-For` เพื่อระบุ IP ของ client ส่วน `X-Real-IP` จะถูกละเลยเป็นค่าปริยาย เว้นแต่จะตั้ง `gateway.allowRealIpFallback: true` อย่างชัดเจน

พฤติกรรมที่ดีของ reverse proxy (เขียนทับ incoming forwarding header):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

พฤติกรรมที่ไม่ดีของ reverse proxy (ต่อท้าย/คง forwarding header ที่ไม่น่าเชื่อถือไว้):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## หมายเหตุเกี่ยวกับ HSTS และ origin

- OpenClaw gateway เน้น local/loopback ก่อน หากคุณทำ TLS termination ที่ reverse proxy ให้ตั้ง HSTS บนโดเมน HTTPS ฝั่ง proxy ตรงนั้น
- หาก gateway เป็นผู้ทำ HTTPS termination เอง คุณสามารถตั้ง `gateway.http.securityHeaders.strictTransportSecurity` เพื่อให้ OpenClaw ส่ง HSTS header ออกไปใน response ได้
- แนวทางการติดตั้งใช้งานโดยละเอียดอยู่ใน [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts)
- สำหรับ deployment ของ Control UI ที่ไม่ใช่ loopback ต้องตั้ง `gateway.controlUi.allowedOrigins` เป็นค่าปริยาย
- `gateway.controlUi.allowedOrigins: ["*"]` เป็นนโยบาย browser-origin แบบอนุญาตทั้งหมดอย่างชัดเจน ไม่ใช่ค่าปริยายแบบ hardened ควรหลีกเลี่ยงนอกเหนือจากการทดสอบในเครื่องที่ควบคุมอย่างเข้มงวด
- ความล้มเหลวของ browser-origin auth บน loopback ยังคงถูก rate-limit แม้ว่า
  จะเปิดการยกเว้น loopback ทั่วไปอยู่ แต่คีย์ lockout จะถูกกำหนดขอบเขตตามค่า `Origin`
  ที่ normalize แล้ว แทนที่จะใช้ bucket localhost ร่วมกัน bucket เดียว
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิดโหมด Host-header origin fallback; ให้ถือว่านี่เป็นนโยบายที่อันตรายซึ่ง operator เลือกเอง
- ให้ถือว่า DNS rebinding และพฤติกรรม proxy-host header เป็นประเด็นด้าน hardening ของ deployment; ควรตั้ง `trustedProxies` ให้แคบและหลีกเลี่ยงการเปิดเผย gateway ตรงสู่สาธารณะบนอินเทอร์เน็ต

## log ของเซสชันในเครื่องอยู่บนดิสก์

OpenClaw จัดเก็บทรานสคริปต์ของเซสชันไว้บนดิสก์ภายใต้ `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
สิ่งนี้จำเป็นสำหรับความต่อเนื่องของเซสชันและ (หากเปิดใช้) การทำดัชนี session memory แต่ก็หมายความว่า
**โพรเซส/ผู้ใช้ใดก็ตามที่เข้าถึงไฟล์ระบบได้สามารถอ่าน log เหล่านั้นได้** ให้ถือว่าการเข้าถึงดิสก์คือขอบเขต
ความเชื่อถือ และล็อกสิทธิ์ของ `~/.openclaw` ให้แน่น (ดูส่วน audit ด้านล่าง) หากคุณต้องการ
การแยกที่แข็งแรงกว่าระหว่างเอเจนต์ ให้รันพวกมันภายใต้ OS user แยกกันหรือโฮสต์แยกกัน

## การรันบน Node (`system.run`)

หากมีการจับคู่ Node บน macOS แล้ว Gateway สามารถเรียก `system.run` บน Node นั้นได้ นี่คือ **การรันโค้ดจากระยะไกล** บน Mac:

- ต้องใช้การจับคู่ Node (อนุมัติ + โทเค็น)
- การจับคู่ Node ของ Gateway ไม่ใช่พื้นผิวการอนุมัติแบบรายคำสั่ง มันใช้เพื่อสร้างตัวตน/ความเชื่อถือของ Node และออกโทเค็น
- Gateway ใช้นโยบายคำสั่งของ Node แบบหยาบในระดับ global ผ่าน `gateway.nodes.allowCommands` / `denyCommands`
- ควบคุมบน Mac ผ่าน **Settings → Exec approvals** (`security` + `ask` + `allowlist`)
- นโยบาย `system.run` แบบราย Node คือไฟล์ exec approval ของ Node เอง (`exec.approvals.node.*`) ซึ่งอาจเข้มงวดหรือผ่อนปรนกว่านโยบาย command-ID แบบ global ของ gateway ก็ได้
- Node ที่รันด้วย `security="full"` และ `ask="off"` กำลังทำงานตามโมเดล trusted-operator ค่าปริยาย ให้ถือว่านี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่ deployment ของคุณจะต้องการท่าทีด้าน approval หรือ allowlist ที่เข้มงวดกว่านี้อย่างชัดเจน
- โหมด approval จะผูกกับบริบทของคำขอแบบตรงตัว และถ้าทำได้จะผูกกับ operand ของสคริปต์/ไฟล์ในเครื่องเพียงหนึ่งรายการ หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องแบบ direct ได้แบบตรงตัวเพียงหนึ่งรายการสำหรับคำสั่ง interpreter/runtime การรันที่อาศัย approval จะถูกปฏิเสธ แทนที่จะสัญญาว่าครอบคลุมเชิงความหมายอย่างสมบูรณ์
- สำหรับ `host=node`, การรันที่อาศัย approval ยังจัดเก็บ
  `systemRunPlan` แบบ canonical ที่เตรียมไว้ด้วย; การส่งต่อที่ได้รับอนุมัติในภายหลังจะใช้แผนที่เก็บไว้นั้นซ้ำ และ
  validation ฝั่ง gateway จะปฏิเสธการแก้ไข command/cwd/บริบทของเซสชันจากผู้เรียกหลังจากสร้างคำขออนุมัติแล้ว
- หากคุณไม่ต้องการการรันจากระยะไกล ให้ตั้ง security เป็น **deny** และยกเลิกการจับคู่ Node สำหรับ Mac เครื่องนั้น

ความแตกต่างนี้สำคัญต่อการ triage:

- Node ที่จับคู่แล้วเชื่อมต่อใหม่พร้อมประกาศรายการคำสั่งต่างออกไป ไม่ถือเป็นช่องโหว่โดยตัวมันเอง หากนโยบาย global ของ Gateway และ exec approval ในเครื่องของ Node ยังบังคับใช้ขอบเขตการรันจริงอยู่
- รายงานที่มอง metadata ของการจับคู่ Node ว่าเป็นชั้นการอนุมัติซ่อนอยู่ชั้นที่สองแบบรายคำสั่ง มักเป็นความสับสนด้านนโยบาย/UX มากกว่าการข้ามขอบเขตความปลอดภัย

## Skills แบบ dynamic (watcher / remote nodes)

OpenClaw สามารถรีเฟรชรายการ Skills กลางเซสชันได้:

- **Skills watcher**: การเปลี่ยนแปลง `SKILL.md` สามารถอัปเดต snapshot ของ Skills ได้ใน agent turn ถัดไป
- **Remote nodes**: การเชื่อมต่อ Node บน macOS สามารถทำให้ Skills ที่ใช้ได้เฉพาะบน macOS มีคุณสมบัติใช้งานได้ (อิงจากการ probe ไบนารี)

ให้ถือว่าโฟลเดอร์ skill เป็น **โค้ดที่เชื่อถือได้** และจำกัดว่าใครบ้างที่สามารถแก้ไขได้

## โมเดลภัยคุกคาม

ผู้ช่วย AI ของคุณสามารถ:

- รันคำสั่ง shell ใดก็ได้
- อ่าน/เขียนไฟล์
- เข้าถึงบริการเครือข่าย
- ส่งข้อความหาใครก็ได้ (หากคุณให้สิทธิ์ WhatsApp แก่มัน)

ผู้ที่ส่งข้อความหาคุณสามารถ:

- พยายามหลอก AI ของคุณให้ทำสิ่งที่ไม่ดี
- social engineer เพื่อเข้าถึงข้อมูลของคุณ
- probe หารายละเอียดโครงสร้างพื้นฐาน

## แนวคิดหลัก: ควบคุมการเข้าถึงก่อนความฉลาด

ความล้มเหลวส่วนใหญ่ที่นี่ไม่ใช่การโจมตีซับซ้อน — แต่มักเป็นแค่ “มีคนส่งข้อความหาบอต แล้วบอตทำตามที่เขาขอ”

ท่าทีของ OpenClaw:

- **Identity ก่อน:** ตัดสินใจก่อนว่าใครพูดกับบอตได้ (DM pairing / allowlist / การเปิดแบบ explicit)
- **Scope ถัดไป:** ตัดสินใจว่าบอตได้รับอนุญาตให้กระทำที่ไหนบ้าง (allowlist ของกลุ่ม + mention gating, เครื่องมือ, sandboxing, สิทธิ์ของอุปกรณ์)
- **Model ทีหลัง:** ให้ถือว่าโมเดลอาจถูกชักจูงได้; ออกแบบให้ผลกระทบจากการถูกชักจูงมีขอบเขตจำกัด

## โมเดลการยืนยันสิทธิ์ของคำสั่ง

Slash command และ directive จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น การยืนยันสิทธิ์จะได้มาจาก
allowlist/pairing ของช่องทาง ร่วมกับ `commands.useAccessGroups` (ดู [Configuration](/th/gateway/configuration)
และ [Slash commands](/th/tools/slash-commands)) หาก allowlist ของช่องทางว่างหรือมี `"*"` อยู่
คำสั่งจะถือว่าเปิดใช้งานได้จริงสำหรับช่องทางนั้น

`/exec` เป็นเพียง convenience แบบ session-only สำหรับ operator ที่ได้รับอนุญาต มัน **ไม่** เขียนคอนฟิกหรือ
เปลี่ยนเซสชันอื่น

## ความเสี่ยงของเครื่องมือฝั่ง control plane

มีเครื่องมือ built-in สองตัวที่สามารถเปลี่ยนแปลง control plane แบบถาวรได้:

- `gateway` สามารถตรวจสอบคอนฟิกด้วย `config.schema.lookup` / `config.get` และสามารถทำการเปลี่ยนแปลงถาวรด้วย `config.apply`, `config.patch` และ `update.run`
- `cron` สามารถสร้างงานตามเวลาที่ทำงานต่อไปได้แม้แชต/งานต้นทางจะสิ้นสุดลงแล้ว

เครื่องมือ runtime `gateway` ที่ใช้ได้เฉพาะเจ้าของยังคงปฏิเสธการเขียนทับ
`tools.exec.ask` หรือ `tools.exec.security`; alias แบบ legacy ของ `tools.bash.*` จะถูก
normalize ไปยังพาธ exec ที่ได้รับการป้องกันเดียวกันก่อนการเขียน

สำหรับเอเจนต์/พื้นผิวใดก็ตามที่จัดการเนื้อหาที่ไม่เชื่อถือ ให้ปฏิเสธสิ่งเหล่านี้เป็นค่าปริยาย:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` จะบล็อกเฉพาะ action การรีสตาร์ต มันไม่ได้ปิดการทำงานของ `gateway` ในส่วน config/update

## Plugin

Plugin ทำงาน **ในโพรเซสเดียวกัน** กับ Gateway ให้ถือว่าเป็นโค้ดที่เชื่อถือได้:

- ติดตั้ง Plugin เฉพาะจากแหล่งที่คุณเชื่อถือ
- ควรใช้ `plugins.allow` allowlist แบบ explicit
- ตรวจสอบคอนฟิกของ Plugin ก่อนเปิดใช้งาน
- รีสตาร์ต Gateway หลังเปลี่ยนแปลง Plugin
- หากคุณติดตั้งหรืออัปเดต Plugin (`openclaw plugins install <package>`, `openclaw plugins update <id>`) ให้ถือว่าเหมือนการรันโค้ดที่ไม่เชื่อถือ:
  - เส้นทางการติดตั้งคือไดเรกทอรีราย Plugin ภายใต้รากการติดตั้ง Plugin ที่กำลังใช้งานอยู่
  - OpenClaw จะรันการสแกนโค้ดอันตรายแบบ built-in ก่อนติดตั้ง/อัปเดต ข้อค้นพบระดับ `critical` จะถูกบล็อกเป็นค่าปริยาย
  - OpenClaw ใช้ `npm pack` แล้วจึงรัน `npm install --omit=dev` ในไดเรกทอรีนั้น (npm lifecycle script สามารถรันโค้ดระหว่างติดตั้งได้)
  - ควรใช้เวอร์ชันแบบปักหมุดตรงตัว (`@scope/pkg@1.2.3`) และตรวจสอบโค้ดที่แตกไฟล์แล้วบนดิสก์ก่อนเปิดใช้งาน
  - `--dangerously-force-unsafe-install` ใช้เป็น break-glass เท่านั้น สำหรับ false positive ของการสแกน built-in ใน flow ติดตั้ง/อัปเดต Plugin มันไม่ได้ข้ามบล็อกนโยบายของ Plugin `before_install` hook และไม่ได้ข้ามความล้มเหลวจากการสแกน
  - การติดตั้ง dependency ของ skill ที่รองรับด้วย Gateway ใช้การแยกระหว่าง dangerous/suspicious แบบเดียวกัน: ข้อค้นพบระดับ `critical` ของ built-in จะถูกบล็อก เว้นแต่ผู้เรียกจะตั้ง `dangerouslyForceUnsafeInstall` อย่างชัดเจน ขณะที่ข้อค้นพบแบบ suspicious จะยังคงเป็นเพียงคำเตือน `openclaw skills install` ยังคงเป็น flow แยกสำหรับดาวน์โหลด/ติดตั้ง skill จาก ClawHub

รายละเอียด: [Plugins](/th/tools/plugin)

## โมเดลการเข้าถึง DM: pairing, allowlist, open, disabled

ช่องทางทั้งหมดในปัจจุบันที่รองรับ DM รองรับนโยบาย DM (`dmPolicy` หรือ `*.dm.policy`) ที่ควบคุม DM ขาเข้า **ก่อน** ข้อความจะถูกประมวลผล:

- `pairing` (ค่าปริยาย): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบสั้น และบอตจะละเลยข้อความของพวกเขาจนกว่าจะได้รับการอนุมัติ รหัสหมดอายุหลัง 1 ชั่วโมง; DM ซ้ำจะไม่ส่งรหัสใหม่จนกว่าจะมีการสร้างคำขอใหม่ คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง** โดยค่าปริยาย
- `allowlist`: ผู้ส่งที่ไม่รู้จักจะถูกบล็อก (ไม่มี pairing handshake)
- `open`: อนุญาตให้ใครก็ได้ส่ง DM (สาธารณะ) **ต้องใช้** allowlist ของช่องทางที่มี `"*"` อยู่ (เป็นการ opt-in แบบ explicit)
- `disabled`: ละเลย DM ขาเข้าทั้งหมด

อนุมัติผ่าน CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

รายละเอียด + ไฟล์บนดิสก์: [Pairing](/th/channels/pairing)

## การแยกเซสชันของ DM (โหมดหลายผู้ใช้)

โดยค่าปริยาย OpenClaw จะ route **DM ทั้งหมดเข้า main session** เพื่อให้ผู้ช่วยของคุณมีความต่อเนื่องข้ามอุปกรณ์และช่องทาง หากมี **หลายคน**
ที่สามารถส่ง DM หาบอตได้ (DM แบบเปิดหรือ allowlist หลายคน) ควรพิจารณาแยกเซสชันของ DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

สิ่งนี้ป้องกันการรั่วไหลของบริบทข้ามผู้ใช้ ขณะเดียวกันยังคงแยกแชตกลุ่มไว้

นี่คือขอบเขตของบริบทด้านการส่งข้อความ ไม่ใช่ขอบเขตการดูแลโฮสต์ หากผู้ใช้เป็นปฏิปักษ์ต่อกันและใช้ Gateway host/config ร่วมกัน ให้รัน gateway แยกกันตามขอบเขตความเชื่อถือแทน

### Secure DM mode (แนะนำ)

ให้ถือว่า snippet ด้านบนคือ **secure DM mode**:

- ค่าปริยาย: `session.dmScope: "main"` (DM ทั้งหมดใช้เซสชันเดียวร่วมกันเพื่อความต่อเนื่อง)
- ค่าเริ่มต้นของ local CLI onboarding: จะเขียน `session.dmScope: "per-channel-peer"` เมื่อยังไม่ได้ตั้งค่า (คงค่าที่ตั้ง explicit ไว้เดิม)
- Secure DM mode: `session.dmScope: "per-channel-peer"` (แต่ละคู่ channel+sender จะได้บริบท DM แยกกัน)
- การแยก peer ข้ามช่องทาง: `session.dmScope: "per-peer"` (ผู้ส่งแต่ละคนได้หนึ่งเซสชันข้ามทุกช่องทางชนิดเดียวกัน)

หากคุณรันหลายบัญชีบนช่องทางเดียวกัน ให้ใช้ `per-account-channel-peer` แทน หากบุคคลคนเดียวกันติดต่อคุณมาจากหลายช่องทาง ให้ใช้ `session.identityLinks` เพื่อรวม DM session เหล่านั้นให้เป็นตัวตน canonical เดียว ดู [Session Management](/th/concepts/session) และ [Configuration](/th/gateway/configuration)

## Allowlists สำหรับ DM และกลุ่ม

OpenClaw มีชั้น “ใครทริกเกอร์ฉันได้?” แยกกันสองชั้น:

- **DM allowlist** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; แบบ legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ใครบ้างได้รับอนุญาตให้คุยกับบอตใน direct message
  - เมื่อ `dmPolicy="pairing"` การอนุมัติจะถูกเขียนลงในที่เก็บ pairing allowlist ตามขอบเขตบัญชีภายใต้ `~/.openclaw/credentials/` (`<channel>-allowFrom.json` สำหรับบัญชีค่าปริยาย, `<channel>-<accountId>-allowFrom.json` สำหรับบัญชีที่ไม่ใช่ค่าปริยาย) แล้ว merge ร่วมกับ allowlist จากคอนฟิก
- **Group allowlist** (เฉพาะแต่ละช่องทาง): กลุ่ม/ช่อง/guild ใดบ้างที่บอตจะยอมรับข้อความจากมันเลย
  - รูปแบบที่พบบ่อย:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: ค่าเริ่มต้นรายกลุ่มเช่น `requireMention`; เมื่อมีการตั้งค่าไว้ มันยังทำหน้าที่เป็น group allowlist ด้วย (ใส่ `"*"` เพื่อคงพฤติกรรม allow-all)
    - `groupPolicy="allowlist"` + `groupAllowFrom`: จำกัดว่าใครสามารถทริกเกอร์บอต _ภายใน_ เซสชันกลุ่มได้ (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams)
    - `channels.discord.guilds` / `channels.slack.channels`: allowlist รายพื้นผิว + ค่า mention เริ่มต้น
  - การตรวจกลุ่มจะรันตามลำดับนี้: `groupPolicy`/group allowlist ก่อน, การเปิดใช้งานด้วย mention/reply เป็นอันดับสอง
  - การตอบกลับข้อความของบอต (implicit mention) **ไม่** ข้าม allowlist ของผู้ส่งอย่าง `groupAllowFrom`
  - **หมายเหตุด้านความปลอดภัย:** ให้ถือว่า `dmPolicy="open"` และ `groupPolicy="open"` เป็นการตั้งค่าทางเลือกสุดท้าย ควรใช้น้อยที่สุด; ควรใช้ pairing + allowlist เว้นแต่คุณจะเชื่อถือทุกคนในห้องนั้นอย่างเต็มที่

รายละเอียด: [Configuration](/th/gateway/configuration) และ [Groups](/th/channels/groups)

## Prompt injection (คืออะไร ทำไมจึงสำคัญ)

Prompt injection คือเมื่อผู้โจมตีสร้างข้อความเพื่อชักจูงโมเดลให้ทำสิ่งที่ไม่ปลอดภัย (“เพิกเฉยต่อคำสั่งของคุณ”, “ดัมพ์ไฟล์ระบบของคุณ”, “ตามลิงก์นี้และรันคำสั่ง” เป็นต้น)

แม้จะมี system prompt ที่แข็งแรง **prompt injection ก็ยังไม่ใช่ปัญหาที่แก้ได้แล้ว** guardrail ใน system prompt เป็นเพียงคำแนะนำแบบนุ่มนวลเท่านั้น; การบังคับใช้จริงมาจากนโยบายเครื่องมือ, exec approval, sandboxing และ allowlist ของช่องทาง (และ operator ก็สามารถปิดสิ่งเหล่านี้ได้โดยการออกแบบ) สิ่งที่ช่วยได้ในทางปฏิบัติ:

- ล็อก DM ขาเข้าให้แน่น (pairing/allowlist)
- ควรใช้ mention gating ในกลุ่ม; หลีกเลี่ยงบอตแบบ “always-on” ในห้องสาธารณะ
- ให้ถือว่าลิงก์ ไฟล์แนบ และคำสั่งที่วางมา เป็นสิ่งที่เป็นปฏิปักษ์โดยค่าปริยาย
- รันการใช้เครื่องมือที่อ่อนไหวใน sandbox; เก็บ secrets ให้อยู่นอกไฟล์ระบบที่เอเจนต์เข้าถึงได้
- หมายเหตุ: sandboxing เป็นแบบ opt-in หากปิด sandbox mode อยู่ `host=auto` แบบ implicit จะ resolve ไปที่ gateway host ส่วน `host=sandbox` แบบ explicit จะยัง fail closed เพราะไม่มี sandbox runtime พร้อมใช้งาน ตั้ง `host=gateway` หากคุณต้องการให้พฤติกรรมนี้ explicit ในคอนฟิก
- จำกัดเครื่องมือความเสี่ยงสูง (`exec`, `browser`, `web_fetch`, `web_search`) ให้ใช้กับเอเจนต์ที่เชื่อถือได้หรือ allowlist แบบ explicit
- หากคุณทำ allowlist ให้ interpreter (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`) ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline eval ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- การวิเคราะห์ shell approval ยังปฏิเสธรูปแบบ POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) ภายใน **unquoted heredoc** ด้วย ดังนั้น body ของ heredoc ที่อยู่ใน allowlist จะไม่สามารถแอบใช้ shell expansion ผ่านการตรวจ allowlist ในฐานะข้อความล้วนได้ ให้ใส่ quote ที่ตัวจบ heredoc (เช่น `<<'EOF'`) เพื่อเลือกใช้ semantics ของ body แบบ literal; unquoted heredoc ที่จะมีการขยายตัวแปรจะถูกปฏิเสธ
- **การเลือกโมเดลมีความสำคัญ:** โมเดลที่เก่ากว่า/เล็กกว่า/legacy มีความทนทานต่อ prompt injection และการใช้เครื่องมือในทางที่ผิดต่ำกว่ามาก สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแรงด้าน instruction มากที่สุดเท่าที่มี

สัญญาณอันตรายที่ควรถือว่าไม่น่าเชื่อถือ:

- “อ่านไฟล์/URL นี้แล้วทำตามที่มันบอกทุกอย่าง”
- “เพิกเฉยต่อ system prompt หรือกฎความปลอดภัยของคุณ”
- “เปิดเผยคำสั่งที่ซ่อนอยู่หรือผลลัพธ์ของเครื่องมือของคุณ”
- “วางเนื้อหาทั้งหมดของ ~/.openclaw หรือ log ของคุณ”

## การทำ sanitize special token ของ external content

OpenClaw จะตัด literal ของ special token ใน chat-template ของ LLM ที่โฮสต์เองซึ่งพบบ่อย ออกจาก external content และ metadata ที่ถูกห่อไว้ก่อนที่จะไปถึงโมเดล กลุ่ม marker ที่ครอบคลุมได้แก่ token ของ Qwen/ChatML, Llama, Gemma, Mistral, Phi และ GPT-OSS สำหรับบทบาท/เทิร์น

เหตุผล:

- แบ็กเอนด์ที่เข้ากันได้กับ OpenAI ซึ่งครอบ self-hosted model บางตัว อาจคง special token ที่ปรากฏในข้อความของผู้ใช้ไว้ แทนที่จะ mask หากผู้โจมตีสามารถเขียนลงใน external content ขาเข้าได้ (หน้าเว็บที่ถูก fetch, เนื้อหาอีเมล, เอาต์พุตของเครื่องมืออ่านไฟล์) เขาอาจฉีดขอบเขตบทบาท `assistant` หรือ `system` แบบสังเคราะห์และหลบออกจาก guardrail ของ wrapped-content ได้
- การทำ sanitize เกิดขึ้นที่เลเยอร์การห่อ external-content จึงครอบคลุมอย่างสม่ำเสมอทั้งเครื่องมือ fetch/read และเนื้อหาขาเข้าจากช่องทาง แทนที่จะเป็นราย provider
- คำตอบขาออกจากโมเดลมี sanitizer แยกต่างหากอยู่แล้ว ซึ่งจะตัด `<tool_call>`, `<function_calls>` และ scaffolding ที่คล้ายกันที่รั่วออกมาจากคำตอบที่ผู้ใช้มองเห็นได้ external-content sanitizer คือคู่กันสำหรับฝั่งขาเข้า

สิ่งนี้ไม่ได้มาแทน hardening อื่น ๆ บนหน้านี้ — `dmPolicy`, allowlist, exec approval, sandboxing และ `contextVisibility` ยังคงเป็นกลไกหลัก มันปิดช่องทางข้ามเฉพาะจุดหนึ่งที่ชั้น tokenizer สำหรับสแตก self-hosted ที่ส่งต่อข้อความของผู้ใช้พร้อม special token แบบครบถ้วน

## แฟล็กข้าม external content ที่ไม่ปลอดภัย

OpenClaw มีแฟล็กสำหรับข้ามที่ระบุชัดเจนซึ่งจะปิดการห่อความปลอดภัยของ external-content:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- ฟิลด์ payload ของ Cron `allowUnsafeExternalContent`

คำแนะนำ:

- ควรปล่อยให้ unset/false ใน production
- เปิดใช้ชั่วคราวเฉพาะเพื่อการดีบักที่มีขอบเขตแคบมากเท่านั้น
- หากเปิดใช้ ให้แยกเอเจนต์นั้นออก (sandbox + เครื่องมือน้อยที่สุด + namespace ของเซสชันแบบเฉพาะ)

หมายเหตุความเสี่ยงของ hook:

- payload ของ hook คือเนื้อหาที่ไม่เชื่อถือ แม้การส่งมาจะมาจากระบบที่คุณควบคุมก็ตาม (เนื้อหาเมล/เอกสาร/เว็บอาจมี prompt injection ได้)
- โมเดล tier ที่อ่อนจะเพิ่มความเสี่ยงนี้ สำหรับระบบอัตโนมัติที่ขับเคลื่อนด้วย hook ควรใช้โมเดล tier ที่แข็งแรงและทันสมัย พร้อมคงนโยบายเครื่องมือให้แคบ (`tools.profile: "messaging"` หรือเข้มงวดกว่านั้น) และใช้ sandboxing หากเป็นไปได้

### Prompt injection ไม่จำเป็นต้องอาศัย DM สาธารณะ

แม้ว่า **มีเพียงคุณเท่านั้น** ที่สามารถส่งข้อความหาบอตได้ prompt injection ก็ยังเกิดขึ้นได้ผ่าน
**เนื้อหาที่ไม่เชื่อถือ** ใด ๆ ที่บอตอ่าน (ผลลัพธ์จาก web search/fetch, หน้าเว็บในเบราว์เซอร์,
อีเมล, เอกสาร, ไฟล์แนบ, log/โค้ดที่วางมา) กล่าวอีกนัยหนึ่ง: ผู้ส่งไม่ใช่พื้นผิวภัยคุกคามเพียงอย่างเดียว; **เนื้อหาเอง**
ก็อาจมีคำสั่งเชิงปฏิปักษ์ได้

เมื่อเปิดใช้เครื่องมือ ความเสี่ยงโดยทั่วไปคือการดึงบริบทออกไปหรือการทริกเกอร์
การเรียกใช้เครื่องมือ ลดรัศมีผลกระทบได้โดย:

- ใช้ **reader agent** ที่เป็นแบบอ่านอย่างเดียวหรือปิดใช้เครื่องมือ เพื่อสรุปเนื้อหาที่ไม่เชื่อถือ
  แล้วค่อยส่งสรุปนั้นให้เอเจนต์หลักของคุณ
- ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ เว้นแต่จำเป็น
- สำหรับ OpenResponses URL input (`input_file` / `input_image`) ให้ตั้ง
  `gateway.http.endpoints.responses.files.urlAllowlist` และ
  `gateway.http.endpoints.responses.images.urlAllowlist` ให้แคบ และตั้ง `maxUrlParts` ต่ำ
  allowlist ที่ว่างจะถือว่าเหมือนไม่ได้ตั้งค่า; ใช้ `files.allowUrl: false` / `images.allowUrl: false`
  หากคุณต้องการปิดการดึง URL ไปเลย
- สำหรับ OpenResponses file input ข้อความ `input_file` ที่ถอดรหัสแล้วจะยังถูก inject เป็น
  **external content ที่ไม่เชื่อถือ** อย่าถือว่าข้อความในไฟล์เชื่อถือได้เพียงเพราะ
  Gateway เป็นผู้ถอดรหัสมันในเครื่อง บล็อกที่ถูก inject ยังคงมี marker ขอบเขต
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` แบบชัดเจน พร้อม metadata `Source: External`
  แม้ว่าเส้นทางนี้จะละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวกว่า
- การห่อด้วย marker แบบเดียวกันนี้จะถูกใช้เมื่อ media-understanding ดึงข้อความ
  จากเอกสารที่แนบมา ก่อนจะนำข้อความนั้นไปต่อท้าย media prompt
- เปิดใช้ sandboxing และ allowlist ของเครื่องมือแบบเข้มงวดสำหรับเอเจนต์ใดก็ตามที่แตะต้องอินพุตที่ไม่เชื่อถือ
- เก็บ secrets ให้อยู่นอกพรอมป์; ส่งผ่าน env/config บนโฮสต์ gateway แทน

### แบ็กเอนด์ LLM ที่โฮสต์เอง

แบ็กเอนด์ self-hosted ที่เข้ากันได้กับ OpenAI เช่น vLLM, SGLang, TGI, LM Studio,
หรือสแตก tokenizer แบบกำหนดเองของ Hugging Face อาจแตกต่างจาก provider ที่โฮสต์ให้ ในวิธีที่
special token ของ chat-template ถูกจัดการ หากแบ็กเอนด์ tokenize สตริง literal
เช่น `<|im_start|>`, `<|start_header_id|>` หรือ `<start_of_turn>` ให้เป็น
โทเค็นโครงสร้างของ chat-template ภายในเนื้อหาของผู้ใช้ ข้อความที่ไม่เชื่อถือสามารถพยายาม
ปลอมขอบเขตบทบาทที่ชั้น tokenizer ได้

OpenClaw จะตัด literal ของ special token ในตระกูลโมเดลที่พบบ่อยออกจาก
external content ที่ถูกห่อไว้ก่อนส่งไปยังโมเดล ควรเปิดการห่อ external-content
ไว้ และเลือกใช้การตั้งค่าแบ็กเอนด์ที่แยกหรือ escape special
token ในเนื้อหาที่ผู้ใช้ส่งมาเมื่อมีตัวเลือกนั้น provider ที่โฮสต์ให้ เช่น OpenAI
และ Anthropic มีการทำ sanitize ฝั่ง request ของตัวเองอยู่แล้ว

### ความแข็งแรงของโมเดล (หมายเหตุด้านความปลอดภัย)

ความต้านทานต่อ prompt injection **ไม่ได้สม่ำเสมอ** กันในทุก tier ของโมเดล โมเดลที่เล็กกว่า/ถูกกว่าโดยทั่วไปจะอ่อนไหวต่อการใช้เครื่องมือผิดวัตถุประสงค์และการยึดคำสั่งมากกว่า โดยเฉพาะเมื่อเจอพรอมป์เชิงปฏิปักษ์

<Warning>
สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ หรือเอเจนต์ที่อ่านเนื้อหาที่ไม่เชื่อถือ ความเสี่ยงจาก prompt injection เมื่อใช้โมเดลที่เก่ากว่า/เล็กกว่ามักสูงเกินไป อย่ารันเวิร์กโหลดเหล่านั้นบนโมเดล tier ที่อ่อน
</Warning>

คำแนะนำ:

- **ใช้โมเดล tier สูงสุดของรุ่นล่าสุด** สำหรับบอตใดก็ตามที่สามารถรันเครื่องมือหรือแตะต้องไฟล์/เครือข่ายได้
- **อย่าใช้ tier ที่เก่ากว่า/อ่อนกว่า/เล็กกว่า** สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือ inbox ที่ไม่เชื่อถือ; ความเสี่ยงจาก prompt injection สูงเกินไป
- หากคุณจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ **ลดรัศมีผลกระทบ** (เครื่องมือแบบอ่านอย่างเดียว, sandboxing ที่เข้มงวด, การเข้าถึงไฟล์ระบบให้น้อยที่สุด, allowlist แบบเข้มงวด)
- เมื่อรันโมเดลเล็ก ให้ **เปิดใช้ sandboxing สำหรับทุกเซสชัน** และ **ปิด web_search/web_fetch/browser** เว้นแต่จะควบคุมอินพุตได้อย่างแน่นหนา
- สำหรับผู้ช่วยส่วนตัวที่เป็นแชตอย่างเดียว มีอินพุตที่เชื่อถือได้ และไม่มีเครื่องมือ โมเดลที่เล็กกว่ามักใช้งานได้ดี

## Reasoning และเอาต์พุตแบบ verbose ในกลุ่ม

`/reasoning`, `/verbose` และ `/trace` อาจเปิดเผย reasoning ภายใน, เอาต์พุตของเครื่องมือ หรือ diagnostics ของ Plugin ที่ไม่ได้ตั้งใจให้เผยแพร่ในช่องสาธารณะ ในการตั้งค่าแบบกลุ่ม ให้ถือว่าสิ่งเหล่านี้เป็น **debug เท่านั้น** และควรปิดไว้ เว้นแต่คุณจำเป็นต้องใช้จริง ๆ อย่างชัดเจน

คำแนะนำ:

- ควรปิด `/reasoning`, `/verbose` และ `/trace` ในห้องสาธารณะ
- หากจะเปิดใช้ ควรเปิดเฉพาะใน DM ที่เชื่อถือได้หรือห้องที่ควบคุมอย่างเข้มงวด
- โปรดจำไว้ว่า: เอาต์พุตแบบ verbose และ trace อาจมี arg ของเครื่องมือ, URL, diagnostics ของ Plugin และข้อมูลที่โมเดลได้เห็น

## ตัวอย่างการ harden คอนฟิก

### สิทธิ์ของไฟล์

เก็บ config + state ให้เป็นส่วนตัวบนโฮสต์ gateway:

- `~/.openclaw/openclaw.json`: `600` (อ่าน/เขียนได้เฉพาะผู้ใช้)
- `~/.openclaw`: `700` (เฉพาะผู้ใช้)

`openclaw doctor` สามารถเตือนและเสนอให้ทำสิทธิ์เหล่านี้ให้เข้มงวดขึ้นได้

### การเปิดเผยผ่านเครือข่าย (bind, port, firewall)

Gateway ทำ multiplex **WebSocket + HTTP** บนพอร์ตเดียว:

- ค่าปริยาย: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

พื้นผิว HTTP นี้รวมถึง Control UI และ canvas host:

- Control UI (asset ของ SPA) (base path ค่าปริยาย `/`)
- Canvas host: `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/` (HTML/JS ตามอำเภอใจ; ให้ถือว่าเป็นเนื้อหาที่ไม่เชื่อถือ)

หากคุณโหลดเนื้อหา canvas ในเบราว์เซอร์ปกติ ให้ถือว่าเหมือนหน้าเว็บที่ไม่เชื่อถือทั่วไป:

- อย่าเปิดเผย canvas host ให้กับเครือข่าย/ผู้ใช้ที่ไม่เชื่อถือ
- อย่าทำให้เนื้อหา canvas ใช้ origin เดียวกับพื้นผิวเว็บที่มีสิทธิ์สูง เว้นแต่คุณจะเข้าใจผลกระทบอย่างถ่องแท้

bind mode ควบคุมว่า Gateway จะฟังที่ใด:

- `gateway.bind: "loopback"` (ค่าปริยาย): มีเพียง local client เท่านั้นที่เชื่อมต่อได้
- bind ที่ไม่ใช่ loopback (`"lan"`, `"tailnet"`, `"custom"`) จะขยายพื้นผิวการโจมตี ใช้เฉพาะเมื่อมี gateway auth (token/password แบบใช้ร่วมกัน หรือ trusted proxy แบบ non-loopback ที่กำหนดค่าอย่างถูกต้อง) และมี firewall จริง

กฎคร่าว ๆ:

- ควรใช้ Tailscale Serve แทน bind แบบ LAN (Serve จะคง Gateway ไว้บน loopback และให้ Tailscale จัดการการเข้าถึง)
- หากจำเป็นต้อง bind ไปยัง LAN ให้ใช้ firewall จำกัดพอร์ตนั้นด้วย allowlist ของ source IP ที่แคบ; อย่า port-forward แบบกว้าง
- อย่าเปิดเผย Gateway แบบไม่ยืนยันตัวตนบน `0.0.0.0`

### การ publish พอร์ต Docker ร่วมกับ UFW

หากคุณรัน OpenClaw ด้วย Docker บน VPS โปรดจำไว้ว่าพอร์ตของคอนเทนเนอร์ที่ publish
(`-p HOST:CONTAINER` หรือ Compose `ports:`) จะถูก route ผ่าน forwarding
chain ของ Docker ไม่ใช่ผ่านเพียงกฎ `INPUT` ของโฮสต์

เพื่อให้ทราฟฟิก Docker สอดคล้องกับนโยบาย firewall ของคุณ ให้บังคับใช้กฎใน
`DOCKER-USER` (chain นี้จะถูกประเมินก่อนกฎ accept ของ Docker เอง)
บนดิสโทรสมัยใหม่หลายตัว `iptables`/`ip6tables` ใช้ frontend แบบ `iptables-nft`
และยังคงใช้กฎเหล่านี้กับ backend ของ nftables

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

IPv6 ใช้ตารางแยกต่างหาก ให้เพิ่มนโยบายที่สอดคล้องกันใน `/etc/ufw/after6.rules` หาก
เปิดใช้ Docker IPv6 อยู่

หลีกเลี่ยงการ hardcode ชื่อ interface เช่น `eth0` ใน snippet ของเอกสาร ชื่อ interface
แตกต่างกันไปตาม image ของ VPS (`ens3`, `enp*` ฯลฯ) และการไม่ตรงกันอาจทำให้
deny rule ของคุณถูกข้ามโดยไม่ได้ตั้งใจ

การตรวจสอบแบบเร็วหลัง reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

พอร์ตภายนอกที่คาดว่าจะเห็นควรเป็นเฉพาะสิ่งที่คุณตั้งใจเปิดเผยเท่านั้น (สำหรับการตั้งค่าส่วนใหญ่:
SSH + พอร์ตของ reverse proxy ของคุณ)

### mDNS/Bonjour discovery

Gateway จะประกาศตัวเองผ่าน mDNS (`_openclaw-gw._tcp` บนพอร์ต 5353) สำหรับการค้นหาอุปกรณ์ในเครือข่ายท้องถิ่น ในโหมด full จะมี TXT record ที่อาจเปิดเผยรายละเอียดการปฏิบัติงาน:

- `cliPath`: พาธไฟล์ระบบแบบเต็มไปยังไบนารีของ CLI (เปิดเผยชื่อผู้ใช้และตำแหน่งการติดตั้ง)
- `sshPort`: ประกาศว่ามี SSH พร้อมใช้งานบนโฮสต์
- `displayName`, `lanHost`: ข้อมูลชื่อโฮสต์

**ข้อพิจารณาด้านความปลอดภัยในการปฏิบัติงาน:** การประกาศรายละเอียดโครงสร้างพื้นฐานทำให้การ reconnaissance ง่ายขึ้นสำหรับใครก็ตามในเครือข่ายท้องถิ่น แม้แต่ข้อมูลที่ดู “ไม่อันตราย” อย่างพาธของไฟล์ระบบและการมี SSH ก็ช่วยให้ผู้โจมตีทำแผนที่สภาพแวดล้อมของคุณได้

**คำแนะนำ:**

1. **โหมด minimal** (ค่าปริยาย แนะนำสำหรับ gateway ที่ถูกเปิดเผย): ตัดฟิลด์ที่อ่อนไหวออกจากการประกาศผ่าน mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **ปิดทั้งหมด** หากคุณไม่ต้องการการค้นหาอุปกรณ์ในเครือข่ายท้องถิ่น:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **โหมด full** (ต้อง opt-in): รวม `cliPath` + `sshPort` ใน TXT record:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **ตัวแปรแวดล้อม** (ทางเลือก): ตั้ง `OPENCLAW_DISABLE_BONJOUR=1` เพื่อปิด mDNS โดยไม่ต้องแก้คอนฟิก

ในโหมด minimal Gateway จะยังคงประกาศข้อมูลเพียงพอสำหรับการค้นหาอุปกรณ์ (`role`, `gatewayPort`, `transport`) แต่จะไม่รวม `cliPath` และ `sshPort` แอปที่ต้องการข้อมูลพาธ CLI สามารถดึงผ่านการเชื่อมต่อ WebSocket ที่ยืนยันตัวตนแล้วได้แทน

### ล็อก Gateway WebSocket ให้แน่น (auth ในเครื่อง)

Gateway auth **จำเป็นโดยค่าปริยาย** หากไม่มีการกำหนดเส้นทาง gateway auth ที่ถูกต้อง
Gateway จะปฏิเสธการเชื่อมต่อ WebSocket (fail‑closed)

Onboarding จะสร้าง token ให้เป็นค่าปริยาย (แม้แต่สำหรับ loopback) ดังนั้น
local client จึงต้องยืนยันตัวตน

ตั้ง token เพื่อให้ **WS client ทุกตัว** ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor สามารถสร้างให้คุณได้: `openclaw doctor --generate-gateway-token`

หมายเหตุ: `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์
พวกมัน **ไม่ได้** ป้องกันการเข้าถึง WS ในเครื่องด้วยตัวเอง
เส้นทางการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้ก็ต่อเมื่อ `gateway.auth.*`
ยังไม่ได้ตั้งค่า
หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน
SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาปกปิด)
ทางเลือกเพิ่มเติม: ปักหมุด TLS ระยะไกลด้วย `gateway.remote.tlsFingerprint` เมื่อใช้ `wss://`
โดยค่าปริยาย `ws://` แบบ plaintext ใช้ได้เฉพาะ loopback เท่านั้น สำหรับเส้นทาง
trusted private-network ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บน process ฝั่งไคลเอนต์
เป็น break-glass โดยตั้งใจให้เป็นเพียง process environment เท่านั้น ไม่ใช่
คีย์คอนฟิกใน `openclaw.json`

การจับคู่อุปกรณ์ในเครื่อง:

- การจับคู่อุปกรณ์จะถูกอนุมัติอัตโนมัติสำหรับการเชื่อมต่อ loopback ในเครื่องโดยตรง เพื่อให้
  ไคลเอนต์บนโฮสต์เดียวกันลื่นไหล
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local สำหรับ
  helper flow แบบ shared-secret ที่เชื่อถือได้
- การเชื่อมต่อผ่าน tailnet และ LAN รวมถึง tailnet bind บนโฮสต์เดียวกัน จะถูกมองเป็น
  remote สำหรับการจับคู่ และยังต้องได้รับการอนุมัติ
- หลักฐานจาก forwarded-header บนคำขอแบบ loopback จะทำให้การเป็น loopback
  หลุดคุณสมบัติ ความสามารถในการ auto-approve สำหรับ metadata-upgrade ถูกจำกัดขอบเขตไว้อย่างแคบ ดู
  [Gateway pairing](/th/gateway/pairing) สำหรับกฎทั้งสองชุด

โหมด auth:

- `gateway.auth.mode: "token"`: bearer token แบบใช้ร่วมกัน (แนะนำสำหรับการตั้งค่าส่วนใหญ่)
- `gateway.auth.mode: "password"`: auth แบบรหัสผ่าน (ควรตั้งผ่าน env: `OPENCLAW_GATEWAY_PASSWORD`)
- `gateway.auth.mode: "trusted-proxy"`: เชื่อถือ reverse proxy ที่รับรู้ตัวตนให้ยืนยันตัวตนผู้ใช้ และส่งต่อ identity ผ่าน header (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เช็กลิสต์การหมุนค่า (token/password):

1. สร้าง/ตั้ง secret ใหม่ (`gateway.auth.token` หรือ `OPENCLAW_GATEWAY_PASSWORD`)
2. รีสตาร์ต Gateway (หรือรีสตาร์ตแอป macOS หากแอปนั้นเป็นผู้ควบคุม Gateway)
3. อัปเดตไคลเอนต์ระยะไกลทั้งหมด (`gateway.remote.token` / `.password` บนเครื่องที่เรียกใช้ Gateway)
4. ตรวจสอบว่าคุณไม่สามารถเชื่อมต่อด้วยข้อมูลรับรองเก่าได้อีก

### Tailscale Serve identity header

เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ค่าปริยายสำหรับ Serve), OpenClaw
จะยอมรับ Tailscale Serve identity header (`tailscale-user-login`) สำหรับการยืนยันตัวตนของ Control
UI/WebSocket OpenClaw จะตรวจสอบตัวตนโดย resolve ที่อยู่
`x-forwarded-for` ผ่าน Tailscale daemon ในเครื่อง (`tailscale whois`)
แล้วจับคู่กับ header สิ่งนี้จะทำงานเฉพาะกับคำขอที่มาถึง loopback
และมี `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ที่
Tailscale inject มา
สำหรับเส้นทางการตรวจสอบตัวตนแบบ async นี้ ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}`
เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว การ retry ที่ผิดพร้อมกัน
จาก Serve client เดียวกันจึงอาจทำให้ครั้งที่สองถูก lockout ทันที
แทนที่จะหลุดผ่านไปเป็นการไม่ตรงกันธรรมดาสองครั้ง
HTTP API endpoint (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**จะไม่** ใช้ auth ผ่าน Tailscale identity-header พวกมันยังคงใช้โหมด HTTP auth
ที่กำหนดไว้ของ gateway

หมายเหตุสำคัญเรื่องขอบเขต:

- Gateway HTTP bearer auth มีผลเทียบเท่าการเข้าถึงของ operator แบบ all-or-nothing
- ให้ถือว่าข้อมูลรับรองที่สามารถเรียก `/v1/chat/completions`, `/v1/responses` หรือ `/api/channels/*` ได้ เป็น secret ของ operator แบบ full-access สำหรับ gateway นั้น
- บนพื้นผิว HTTP ที่เข้ากันได้กับ OpenAI การใช้ bearer auth แบบ shared-secret จะกู้คืน scope ค่าปริยายทั้งหมดของ operator (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) และ semantics ของ owner สำหรับ agent turn; ค่า `x-openclaw-scopes` ที่แคบกว่าไม่สามารถลดสิทธิ์ของเส้นทาง shared-secret นั้นได้
- semantics ของ scope แบบรายคำขอบน HTTP จะมีผลก็ต่อเมื่อคำขอนั้นมาจากโหมดที่มีตัวตนกำกับ เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน ingress แบบส่วนตัว
- ในโหมดที่มีตัวตนกำกับเหล่านั้น หากไม่ส่ง `x-openclaw-scopes` จะ fallback ไปใช้ชุด scope ค่าปริยายของ operator ตามปกติ; ให้ส่ง header นี้อย่างชัดเจนเมื่อคุณต้องการชุด scope ที่แคบกว่า
- `/tools/invoke` ใช้กฎ shared-secret แบบเดียวกัน: bearer auth แบบ token/password ถูกมองว่าเป็นการเข้าถึงแบบ full operator เช่นกัน ส่วนโหมดที่มีตัวตนกำกับยังคงเคารพ scope ที่ประกาศไว้
- อย่าแชร์ข้อมูลรับรองเหล่านี้กับผู้เรียกที่ไม่เชื่อถือ; ควรใช้ gateway แยกกันตามขอบเขตความเชื่อถือ

**สมมติฐานเรื่องความเชื่อถือ:** auth แบบ Serve ที่ไม่ใช้ token ถือว่าโฮสต์ gateway เป็นสิ่งที่เชื่อถือได้
อย่าถือว่านี่เป็นการป้องกันต่อโพรเซสบนโฮสต์เดียวกันที่เป็นปฏิปักษ์ หากมีโค้ดในเครื่องที่ไม่เชื่อถือ
อาจรันบนโฮสต์ gateway ได้ ให้ปิด `gateway.auth.allowTailscale`
และบังคับใช้ auth แบบ shared-secret อย่างชัดเจนด้วย `gateway.auth.mode: "token"` หรือ
`"password"`

**กฎด้านความปลอดภัย:** อย่าส่งต่อ header เหล่านี้จาก reverse proxy ของคุณเอง หาก
คุณทำ TLS termination หรือ proxy อยู่หน้าตัว gateway ให้ปิด
`gateway.auth.allowTailscale` และใช้ auth แบบ shared-secret (`gateway.auth.mode:
"token"` หรือ `"password"`) หรือ [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)
แทน

Trusted proxy:

- หากคุณทำ TLS termination อยู่หน้าตัว Gateway ให้ตั้ง `gateway.trustedProxies` เป็น IP ของ proxy ของคุณ
- OpenClaw จะเชื่อถือ `x-forwarded-for` (หรือ `x-real-ip`) จาก IP เหล่านั้นเพื่อระบุ IP ของไคลเอนต์สำหรับการตรวจ local pairing และการตรวจ HTTP auth/local
- ตรวจให้แน่ใจว่า proxy ของคุณ **เขียนทับ** `x-forwarded-for` และบล็อกการเข้าถึงพอร์ต Gateway โดยตรง

ดู [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

### การควบคุมเบราว์เซอร์ผ่าน host แบบ Node (แนะนำ)

หาก Gateway ของคุณอยู่ระยะไกล แต่เบราว์เซอร์ทำงานบนอีกเครื่องหนึ่ง ให้รัน **node host**
บนเครื่องเบราว์เซอร์ แล้วให้ Gateway เป็นตัว proxy การกระทำของเบราว์เซอร์ (ดู [เครื่องมือ Browser](/th/tools/browser))
ให้ถือว่าการจับคู่ Node เทียบเท่าการเข้าถึงระดับผู้ดูแลระบบ

รูปแบบที่แนะนำ:

- ให้ Gateway และ node host อยู่ใน tailnet เดียวกัน (Tailscale)
- จับคู่ Node อย่างตั้งใจ; ปิด browser proxy routing หากคุณไม่ต้องการใช้

สิ่งที่ควรหลีกเลี่ยง:

- การเปิดเผย relay/control port ผ่าน LAN หรืออินเทอร์เน็ตสาธารณะ
- การใช้ Tailscale Funnel กับ endpoint สำหรับควบคุมเบราว์เซอร์ (เป็นการเปิดเผยสู่สาธารณะ)

### Secrets บนดิสก์

ให้ถือว่าสิ่งใดก็ตามภายใต้ `~/.openclaw/` (หรือ `$OPENCLAW_STATE_DIR/`) อาจมี secret หรือข้อมูลส่วนตัว:

- `openclaw.json`: คอนฟิกอาจมีโทเค็น (gateway, remote gateway), การตั้งค่า provider และ allowlist
- `credentials/**`: ข้อมูลรับรองของช่องทาง (ตัวอย่าง: WhatsApp creds), allowlist สำหรับ pairing, OAuth import แบบ legacy
- `agents/<agentId>/agent/auth-profiles.json`: API key, token profile, OAuth token และ `keyRef`/`tokenRef` แบบไม่บังคับ
- `secrets.json` (ไม่บังคับ): payload ของ secret แบบ file-backed ที่ใช้โดย SecretRef provider แบบ `file` (`secrets.providers`)
- `agents/<agentId>/agent/auth.json`: ไฟล์เพื่อความเข้ากันได้แบบ legacy รายการ `api_key` แบบ static จะถูกล้างออกเมื่อพบ
- `agents/<agentId>/sessions/**`: ทรานสคริปต์ของเซสชัน (`*.jsonl`) + metadata ของการ route (`sessions.json`) ซึ่งอาจมีข้อความส่วนตัวและเอาต์พุตของเครื่องมือ
- แพ็กเกจ Plugin ที่มาพร้อมระบบ: Plugin ที่ติดตั้งไว้ (รวมถึง `node_modules/` ของมัน)
- `sandboxes/**`: workspace ของ tool sandbox; อาจสะสมสำเนาไฟล์ที่คุณอ่าน/เขียนภายใน sandbox

คำแนะนำในการ harden:

- ควรตั้งสิทธิ์ให้แน่น (`700` สำหรับไดเรกทอรี, `600` สำหรับไฟล์)
- ใช้ full-disk encryption บนโฮสต์ gateway
- ควรใช้บัญชี OS user เฉพาะสำหรับ Gateway หากโฮสต์นั้นมีการใช้ร่วมกัน

### ไฟล์ `.env` ของ workspace

OpenClaw จะโหลดไฟล์ `.env` ใน workspace สำหรับเอเจนต์และเครื่องมือ แต่จะไม่ยอมให้ไฟล์เหล่านั้น override การควบคุมรันไทม์ของ gateway แบบเงียบ ๆ

- คีย์ใดก็ตามที่ขึ้นต้นด้วย `OPENCLAW_*` จะถูกบล็อกจากไฟล์ `.env` ของ workspace ที่ไม่เชื่อถือ
- การตั้งค่า endpoint ของช่องทางสำหรับ Matrix, Mattermost, IRC และ Synology Chat ก็ถูกบล็อกจาก workspace `.env` เช่นกัน ดังนั้น workspace ที่ถูก clone มาไม่สามารถเปลี่ยนเส้นทางทราฟฟิกของ bundled connector ผ่านคอนฟิก endpoint ในเครื่องได้ คีย์ env ของ endpoint (เช่น `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) ต้องมาจาก process environment ของ gateway หรือ `env.shellEnv` ไม่ใช่จาก `.env` ที่ถูกโหลดจาก workspace
- การบล็อกนี้เป็นแบบ fail-closed: ตัวแปรควบคุมรันไทม์ใหม่ที่ถูกเพิ่มใน release ในอนาคตจะไม่สามารถถูกสืบทอดจาก `.env` ที่ถูก commit หรือผู้โจมตีใส่มาได้อย่างเงียบ ๆ; คีย์นั้นจะถูกละเลยและ gateway จะคงค่าของตัวเองไว้
- ตัวแปร environment ของ process/OS ที่เชื่อถือได้ (shell ของ gateway เอง, unit ของ launchd/systemd, app bundle) ยังคงมีผลอยู่ — ข้อจำกัดนี้ใช้เฉพาะกับการโหลดไฟล์ `.env`

เหตุผล: ไฟล์ `.env` ของ workspace มักอยู่ติดกับโค้ดของเอเจนต์, ถูก commit โดยไม่ตั้งใจ หรือถูกเขียนโดยเครื่องมือ การบล็อกทั้ง prefix `OPENCLAW_*` หมายความว่าการเพิ่มแฟล็ก `OPENCLAW_*` ใหม่ในภายหลัง จะไม่ถอยหลังกลับไปกลายเป็นการสืบทอดค่าจากสถานะของ workspace แบบเงียบ ๆ ได้เลย

### Log และทรานสคริปต์ (การปกปิดและการเก็บรักษา)

Log และทรานสคริปต์อาจรั่วไหลข้อมูลอ่อนไหวได้ แม้ว่าการควบคุมการเข้าถึงจะถูกต้อง:

- log ของ Gateway อาจมีสรุปของเครื่องมือ ข้อผิดพลาด และ URL
- ทรานสคริปต์ของเซสชันอาจมี secret ที่วางมา เนื้อหาไฟล์ เอาต์พุตคำสั่ง และลิงก์

คำแนะนำ:

- ควรเปิดการปกปิดสรุปของเครื่องมือไว้ (`logging.redactSensitive: "tools"`; ค่าปริยาย)
- เพิ่มแพตเทิร์นแบบกำหนดเองสำหรับสภาพแวดล้อมของคุณผ่าน `logging.redactPatterns` (โทเค็น ชื่อโฮสต์ URL ภายใน)
- เมื่อแชร์ข้อมูลวินิจฉัย ควรใช้ `openclaw status --all` (วางได้ทันที, ปกปิด secret แล้ว) แทน raw log
- ตัดทิ้งทรานสคริปต์ของเซสชันเก่าและไฟล์ log หากคุณไม่จำเป็นต้องเก็บไว้นาน

รายละเอียด: [Logging](/th/gateway/logging)

### DM: ใช้ pairing เป็นค่าปริยาย

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### กลุ่ม: ต้อง mention ทุกที่

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

ในแชตกลุ่ม ให้ตอบเฉพาะเมื่อมีการ mention อย่างชัดเจน

### แยกหมายเลขกัน (WhatsApp, Signal, Telegram)

สำหรับช่องทางที่อิงกับหมายเลขโทรศัพท์ ควรพิจารณารัน AI ของคุณบนหมายเลขโทรศัพท์คนละหมายเลขกับหมายเลขส่วนตัวของคุณ:

- หมายเลขส่วนตัว: การสนทนาของคุณยังคงเป็นส่วนตัว
- หมายเลขบอต: AI จะจัดการแทน โดยมีขอบเขตที่เหมาะสม

### โหมดอ่านอย่างเดียว (ผ่าน sandbox และเครื่องมือ)

คุณสามารถสร้างโปรไฟล์แบบอ่านอย่างเดียวได้โดยผสม:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (หรือ `"none"` หากไม่ต้องการให้เข้าถึง workspace เลย)
- allow/deny list ของเครื่องมือที่บล็อก `write`, `edit`, `apply_patch`, `exec`, `process` ฯลฯ

ตัวเลือก hardening เพิ่มเติม:

- `tools.exec.applyPatch.workspaceOnly: true` (ค่าปริยาย): ทำให้มั่นใจว่า `apply_patch` ไม่สามารถเขียน/ลบภายนอกไดเรกทอรี workspace ได้ แม้จะปิด sandboxing อยู่ ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` แตะไฟล์นอก workspace จริง ๆ
- `tools.fs.workspaceOnly: true` (ไม่บังคับ): จำกัดพาธของ `read`/`write`/`edit`/`apply_patch` และพาธ auto-load ของภาพใน native prompt ให้อยู่ในไดเรกทอรี workspace (มีประโยชน์หากวันนี้คุณอนุญาต absolute path อยู่และต้องการ guardrail เดียว)
- ควรตั้งรากของไฟล์ระบบให้แคบ: หลีกเลี่ยงรากที่กว้างอย่างโฮมไดเรกทอรีของคุณสำหรับ workspace/sandbox workspace ของเอเจนต์ รากที่กว้างอาจเปิดเผยไฟล์ในเครื่องที่อ่อนไหว (เช่น state/config ใต้ `~/.openclaw`) ให้กับเครื่องมือไฟล์ระบบ

### baseline ที่ปลอดภัย (คัดลอก/วาง)

คอนฟิก “ค่าปริยายที่ปลอดภัย” ชุดหนึ่ง ที่คง Gateway ไว้เป็นส่วนตัว ต้องใช้ DM pairing และหลีกเลี่ยงบอตกลุ่มแบบ always-on:

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

หากคุณต้องการการรันเครื่องมือแบบ “ปลอดภัยกว่าเป็นค่าปริยาย” ด้วย ให้เพิ่ม sandbox + ปฏิเสธเครื่องมืออันตรายสำหรับเอเจนต์ที่ไม่ใช่เจ้าของ (ดูตัวอย่างด้านล่างหัวข้อ “Per-agent access profiles”)

baseline ที่มีมาในตัวสำหรับ agent turn ที่ขับเคลื่อนด้วยแชต: ผู้ส่งที่ไม่ใช่เจ้าของจะไม่สามารถใช้เครื่องมือ `cron` หรือ `gateway` ได้

## Sandboxing (แนะนำ)

เอกสารเฉพาะ: [Sandboxing](/th/gateway/sandboxing)

มีสองแนวทางที่เสริมกัน:

- **รัน Gateway ทั้งหมดใน Docker** (ขอบเขตของ container): [Docker](/th/install/docker)
- **Tool sandbox** (`agents.defaults.sandbox`, gateway บนโฮสต์ + เครื่องมือที่แยกด้วย sandbox; Docker คือแบ็กเอนด์ค่าปริยาย): [Sandboxing](/th/gateway/sandboxing)

หมายเหตุ: เพื่อป้องกันการเข้าถึงข้ามเอเจนต์ ให้คง `agents.defaults.sandbox.scope` เป็น `"agent"` (ค่าปริยาย)
หรือใช้ `"session"` หากต้องการการแยกที่เข้มงวดกว่ารายเซสชัน `scope: "shared"` จะใช้
container/workspace เดียวกัน

ควรพิจารณาการเข้าถึง workspace ของเอเจนต์ภายใน sandbox ด้วย:

- `agents.defaults.sandbox.workspaceAccess: "none"` (ค่าปริยาย) จะทำให้ agent workspace เข้าถึงไม่ได้; เครื่องมือจะรันบน sandbox workspace ภายใต้ `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` จะ mount agent workspace แบบอ่านอย่างเดียวที่ `/agent` (ปิดใช้ `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` จะ mount agent workspace แบบอ่าน/เขียนที่ `/workspace`
- `sandbox.docker.binds` เพิ่มเติมจะถูก validate เทียบกับ source path ที่ normalize และ canonicalize แล้ว กลอุบายแบบ parent-symlink และ canonical home alias จะยัง fail closed หาก resolve เข้าไปยังรากที่ถูกบล็อก เช่น `/etc`, `/var/run` หรือไดเรกทอรีข้อมูลรับรองภายใต้โฮมของระบบปฏิบัติการ

ข้อสำคัญ: `tools.elevated` คือ escape hatch ระดับ global ที่ใช้รัน exec นอก sandbox effective host จะเป็น `gateway` โดยค่าปริยาย หรือเป็น `node` เมื่อกำหนดเป้าหมาย exec ไปที่ `node` ควรจำกัด `tools.elevated.allowFrom` ให้แคบ และอย่าเปิดใช้สำหรับคนแปลกหน้า คุณยังสามารถจำกัด elevated เพิ่มเติมรายเอเจนต์ผ่าน `agents.list[].tools.elevated` ได้ ดู [Elevated Mode](/th/tools/elevated)

### guardrail สำหรับการมอบหมายให้ซับเอเจนต์

หากคุณอนุญาตเครื่องมือของเซสชัน ให้ถือว่าการรันซับเอเจนต์แบบมอบหมายเป็นอีกหนึ่งการตัดสินใจเรื่องขอบเขต:

- ปฏิเสธ `sessions_spawn` เว้นแต่เอเจนต์จะจำเป็นต้องใช้การมอบหมายจริง ๆ
- จำกัด `agents.defaults.subagents.allowAgents` และ override รายเอเจนต์ใน `agents.list[].subagents.allowAgents` ไว้เฉพาะเอเจนต์เป้าหมายที่ปลอดภัยและรู้จักแล้ว
- สำหรับเวิร์กโฟลว์ใดก็ตามที่ต้องคงอยู่ใน sandbox ให้เรียก `sessions_spawn` พร้อม `sandbox: "require"` (ค่าปริยายคือ `inherit`)
- `sandbox: "require"` จะ fail fast เมื่อรันไทม์ของ child เป้าหมายไม่ได้ถูก sandbox

## ความเสี่ยงของการควบคุมเบราว์เซอร์

การเปิดใช้การควบคุมเบราว์เซอร์ทำให้โมเดลสามารถควบคุมเบราว์เซอร์จริงได้
หากโปรไฟล์ของเบราว์เซอร์นั้นมีเซสชันที่ล็อกอินอยู่แล้ว โมเดลสามารถ
เข้าถึงบัญชีและข้อมูลเหล่านั้นได้ ให้ถือว่าโปรไฟล์เบราว์เซอร์เป็น **สถานะที่อ่อนไหว**:

- ควรใช้โปรไฟล์เฉพาะสำหรับเอเจนต์ (โปรไฟล์ `openclaw` ค่าปริยาย)
- หลีกเลี่ยงการชี้เอเจนต์ไปยังโปรไฟล์ใช้งานประจำส่วนตัวของคุณ
- ควรปิดการควบคุมเบราว์เซอร์บนโฮสต์สำหรับเอเจนต์ที่อยู่ใน sandbox เว้นแต่คุณจะเชื่อถือพวกมัน
- API แบบ standalone loopback browser control จะยอมรับเฉพาะ shared-secret auth
  (gateway token bearer auth หรือ gateway password) เท่านั้น มันไม่ใช้
  trusted-proxy หรือ Tailscale Serve identity header
- ให้ถือว่าไฟล์ดาวน์โหลดจากเบราว์เซอร์เป็นอินพุตที่ไม่เชื่อถือ; ควรใช้ไดเรกทอรีดาวน์โหลดแบบแยก
- ควรปิด browser sync/password manager ในโปรไฟล์ของเอเจนต์ หากทำได้ (ลดรัศมีผลกระทบ)
- สำหรับ Gateway ระยะไกล ให้ถือว่า “การควบคุมเบราว์เซอร์” เทียบเท่ากับ “การเข้าถึงระดับ operator” ต่อทุกสิ่งที่โปรไฟล์นั้นเข้าถึงได้
- ให้ Gateway และ Node host อยู่แบบ tailnet-only; หลีกเลี่ยงการเปิดเผยพอร์ตควบคุมเบราว์เซอร์ไปยัง LAN หรืออินเทอร์เน็ตสาธารณะ
- ปิด browser proxy routing เมื่อไม่จำเป็น (`gateway.nodes.browser.mode="off"`)
- โหมด Chrome MCP existing-session **ไม่** “ปลอดภัยกว่า”; มันสามารถทำงานเป็นคุณกับทุกสิ่งที่โปรไฟล์ Chrome บนโฮสต์นั้นเข้าถึงได้

### นโยบาย SSRF ของเบราว์เซอร์ (strict โดยค่าปริยาย)

นโยบายการนำทางของเบราว์เซอร์ใน OpenClaw เข้มงวดโดยค่าปริยาย: ปลายทางแบบ private/internal จะยังถูกบล็อก เว้นแต่คุณจะ opt in อย่างชัดเจน

- ค่าปริยาย: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่ถูกตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จะยังบล็อกปลายทางแบบ private/internal/special-use
- alias แบบ legacy: `browser.ssrfPolicy.allowPrivateNetwork` ยังรับได้เพื่อความเข้ากันได้
- โหมด opt-in: ตั้ง `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เพื่ออนุญาตปลายทางแบบ private/internal/special-use
- ในโหมด strict ให้ใช้ `hostnameAllowlist` (pattern เช่น `*.example.com`) และ `allowedHostnames` (ข้อยกเว้นของ host แบบตรงตัว รวมถึงชื่อที่ถูกบล็อกอย่าง `localhost`) สำหรับข้อยกเว้นที่ explicit
- การนำทางจะถูกตรวจสอบก่อนคำขอ และตรวจซ้ำแบบ best-effort กับ URL `http(s)` สุดท้ายหลังการนำทาง เพื่อลดการ pivot ผ่าน redirect

ตัวอย่างนโยบาย strict:

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

## โปรไฟล์การเข้าถึงรายเอเจนต์ (หลายเอเจนต์)

เมื่อใช้การ route หลายเอเจนต์ แต่ละเอเจนต์สามารถมีนโยบาย sandbox + เครื่องมือของตัวเองได้:
ใช้สิ่งนี้เพื่อให้สิทธิ์ **เต็ม**, **อ่านอย่างเดียว** หรือ **ไม่มีสิทธิ์** รายเอเจนต์
ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดแบบเต็ม
และกฎลำดับความสำคัญ

กรณีใช้งานที่พบบ่อย:

- เอเจนต์ส่วนตัว: เข้าถึงได้เต็ม ไม่มี sandbox
- เอเจนต์ครอบครัว/ที่ทำงาน: อยู่ใน sandbox + เครื่องมือแบบอ่านอย่างเดียว
- เอเจนต์สาธารณะ: อยู่ใน sandbox + ไม่มีเครื่องมือ shell/ไฟล์ระบบ

### ตัวอย่าง: เข้าถึงได้เต็ม (ไม่มี sandbox)

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

### ตัวอย่าง: เครื่องมือแบบอ่านอย่างเดียว + workspace แบบอ่านอย่างเดียว

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

### ตัวอย่าง: ไม่มีสิทธิ์เข้าถึงไฟล์ระบบ/shell (แต่ยังอนุญาต messaging ของ provider)

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

หาก AI ของคุณทำสิ่งที่ไม่ดี:

### ควบคุมสถานการณ์

1. **หยุดมัน:** หยุดแอป macOS (หากแอปนั้นควบคุม Gateway) หรือ kill โพรเซส `openclaw gateway`
2. **ปิดการเปิดเผย:** ตั้ง `gateway.bind: "loopback"` (หรือปิด Tailscale Funnel/Serve) จนกว่าคุณจะเข้าใจว่าเกิดอะไรขึ้น
3. **แช่แข็งการเข้าถึง:** สลับ DM/กลุ่มที่มีความเสี่ยงไปใช้ `dmPolicy: "disabled"` / require mention และลบรายการ `"*"` แบบ allow-all หากคุณเคยตั้งไว้

### หมุนค่า (ให้ถือว่าถูกโจมตีแล้วหากมี secret รั่วไหล)

1. หมุน Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) แล้วรีสตาร์ต
2. หมุน secret ของ remote client (`gateway.remote.token` / `.password`) บนทุกเครื่องที่สามารถเรียกใช้ Gateway
3. หมุนข้อมูลรับรองของ provider/API (WhatsApp creds, โทเค็น Slack/Discord, model/API key ใน `auth-profiles.json` และค่าของ encrypted secrets payload เมื่อมีการใช้)

### ตรวจสอบ

1. ตรวจ log ของ Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (หรือ `logging.file`)
2. ตรวจทานทรานสคริปต์ที่เกี่ยวข้อง: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
3. ตรวจทานการเปลี่ยนแปลงคอนฟิกล่าสุด (สิ่งใดก็ตามที่อาจขยายการเข้าถึง: `gateway.bind`, `gateway.auth`, นโยบาย dm/group, `tools.elevated`, การเปลี่ยนแปลง Plugin)
4. รัน `openclaw security audit --deep` ใหม่ และยืนยันว่าข้อค้นพบระดับวิกฤตได้รับการแก้ไขแล้ว

### รวบรวมข้อมูลสำหรับรายงาน

- เวลาเกิดเหตุ, OS ของโฮสต์ gateway + เวอร์ชัน OpenClaw
- ทรานสคริปต์ของเซสชัน + log tail แบบสั้น (หลังปกปิดข้อมูลแล้ว)
- สิ่งที่ผู้โจมตีส่งมา + สิ่งที่เอเจนต์ทำ
- Gateway ถูกเปิดเผยออกนอก loopback หรือไม่ (LAN/Tailscale Funnel/Serve)

## Secret scanning ด้วย detect-secrets

CI จะรัน pre-commit hook ของ `detect-secrets` ใน job `secrets`
การ push ไปที่ `main` จะรันการสแกนทุกไฟล์เสมอ ส่วน pull request จะใช้
เส้นทางเร็วแบบ changed-file เมื่อมี base commit พร้อม และจะ fallback ไปสแกนทุกไฟล์
ในกรณีอื่น หากล้มเหลว แปลว่ามี candidate ใหม่ที่ยังไม่อยู่ใน baseline

### หาก CI ล้มเหลว

1. ทำซ้ำในเครื่อง:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ทำความเข้าใจเครื่องมือ:
   - `detect-secrets` ใน pre-commit จะรัน `detect-secrets-hook` พร้อม baseline
     และ exclude ของ repo
   - `detect-secrets audit` จะเปิดหน้าตรวจทานแบบโต้ตอบ เพื่อทำเครื่องหมายแต่ละรายการใน baseline
     ว่าเป็นของจริงหรือ false positive
3. สำหรับ secret จริง: หมุนค่า/ลบมันออก แล้วรันการสแกนใหม่เพื่ออัปเดต baseline
4. สำหรับ false positive: รัน interactive audit และทำเครื่องหมายว่าเป็น false:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. หากคุณต้องการ exclude ใหม่ ให้เพิ่มลงใน `.detect-secrets.cfg` แล้วสร้าง
   baseline ใหม่ด้วยแฟล็ก `--exclude-files` / `--exclude-lines` ที่ตรงกัน (ไฟล์ config
   นี้เป็นเพียงข้อมูลอ้างอิง; detect-secrets ไม่ได้อ่านโดยอัตโนมัติ)

commit `.secrets.baseline` ที่อัปเดตแล้ว เมื่อมันสะท้อนสถานะที่ตั้งใจไว้

## การรายงานปัญหาด้านความปลอดภัย

พบช่องโหว่ใน OpenClaw ใช่ไหม? โปรดรายงานอย่างมีความรับผิดชอบ:

1. อีเมล: [security@openclaw.ai](mailto:security@openclaw.ai)
2. อย่าโพสต์สาธารณะจนกว่าจะได้รับการแก้ไข
3. เราจะให้เครดิตคุณ (เว้นแต่คุณต้องการไม่เปิดเผยตัวตน)
