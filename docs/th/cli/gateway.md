---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การแก้ไขข้อบกพร่องด้านการยืนยันตัวตน โหมดการผูก และการเชื่อมต่อของ Gateway
    - การค้นหา Gateway ผ่าน Bonjour (ภายในเครื่อง + DNS-SD แบบเครือข่ายบริเวณกว้าง)
    - การผสานรวมตัวควบคุมกระบวนการ Gateway ภายนอก
sidebarTitle: Gateway
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-19T08:44:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b7b8be9139e975be1a890e7a6fe09af526aaa4261d92198d4388a06e6d13216
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, Node, เซสชัน, ฮุก) คำสั่งย่อยทั้งหมดด้านล่างอยู่ภายใต้ `openclaw gateway ...`

<CardGroup cols={3}>
  <Card title="การค้นหาด้วย Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบเครือข่ายบริเวณกว้าง
  </Card>
  <Card title="ภาพรวมการค้นหา" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์การกำหนดค่า Gateway ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

```bash
openclaw gateway
openclaw gateway run   # เทียบเท่ากัน เป็นรูปแบบที่ระบุชัดเจน
```

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานเมื่อเริ่มต้น">
    - จะไม่ยอมเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้เฉพาะกิจ/การพัฒนา โดยจะข้ามตัวป้องกันนี้โดยไม่เขียนหรือซ่อมแซมการกำหนดค่า
    - เมื่อพบการกำหนดค่าที่ไม่ถูกต้องแต่ซ่อมแซมได้ระหว่างการเริ่มต้น เทอร์มินัลแบบโต้ตอบจะเสนอให้เรียกใช้ `openclaw doctor --fix` และลองเริ่มต้นอีกครั้งหนึ่งหลังได้รับความยินยอม การเรียกใช้แบบไม่โต้ตอบจะไม่ซ่อมแซมโดยอัตโนมัติ และจะแสดงคำสั่งแทน หากการกำหนดค่าหลังซ่อมแซมยังไม่ถูกต้อง การเริ่มต้นจะยังคงหยุดอยู่
    - `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากมีไฟล์การกำหนดค่าอยู่แต่ไม่มี `gateway.mode` ระบบจะถือว่าการกำหนดค่าเสียหาย/ถูกเขียนทับ และ Gateway จะไม่คาดเดา `local` ให้ โปรดเรียกใช้กระบวนการเริ่มต้นใช้งานอีกครั้ง ตั้งค่าคีย์ด้วยตนเอง หรือส่ง `--allow-unconfigured`
    - ระบบจะบล็อกการผูกนอกเหนือจากลูปแบ็กหากไม่มีการยืนยันตัวตน
    - ค่า `--bind` ได้แก่ `lan`, `tailnet` และ `custom` ปัจจุบันจะถูกแปลงผ่านเส้นทาง IPv4 เท่านั้น การตั้งค่าโฮสต์ที่จัดเตรียมเองและรองรับเฉพาะ IPv6 จำเป็นต้องมีไซด์คาร์ IPv4 หรือพร็อกซีอยู่หน้า Gateway
    - `SIGUSR1` จะทริกเกอร์การเริ่มกระบวนการใหม่ภายในโปรเซสเมื่อได้รับอนุญาต `commands.restart` (ค่าเริ่มต้น: เปิดใช้งาน) ควบคุม `SIGUSR1` ที่ส่งมาจากภายนอก ตั้งค่าเป็น `false` เพื่อบล็อกการเริ่มกระบวนการใหม่ด้วยสัญญาณระบบปฏิบัติการด้วยตนเอง เครื่องมือ `gateway` สำหรับเอเจนต์เป็นแบบอ่านอย่างเดียว เอเจนต์จะขอเริ่มกระบวนการใหม่ผ่านเครื่องมือมอบหมาย `openclaw` ที่มนุษย์อนุมัติ
    - `SIGINT`/`SIGTERM` จะหยุดโปรเซสแต่ไม่คืนค่าสถานะเทอร์มินัลที่กำหนดเอง หากครอบ CLI ด้วย TUI หรืออินพุตโหมดดิบ ให้คืนค่าเทอร์มินัลด้วยตนเองก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจากการกำหนดค่า/สภาพแวดล้อม โดยปกติคือ `18789`)
</ParamField>
<ParamField path="--bind <mode>" type="string">
  โหมดการผูก: `loopback` (ค่าเริ่มต้น), `lan`, `tailnet`, `auto`, `custom`
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็นที่ใช้ร่วมกันสำหรับ `connect.params.auth.token` ค่าเริ่มต้นคือ `OPENCLAW_GATEWAY_TOKEN` เมื่อตั้งค่าไว้
</ParamField>
<ParamField path="--auth <mode>" type="string">
  โหมดการยืนยันตัวตน: `none`, `token`, `password`, `trusted-proxy`
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านสำหรับ `--auth password`
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน Gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  การเปิดให้เข้าถึงผ่าน Tailscale: `off`, `serve`, `funnel`
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิดระบบ
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  เริ่มทำงานโดยไม่บังคับใช้ `gateway.mode=local` ใช้สำหรับการบูตเฉพาะกิจ/การพัฒนาเท่านั้น โดยจะไม่บันทึกถาวรหรือซ่อมแซมการกำหนดค่า
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้างการกำหนดค่าและพื้นที่ทำงานสำหรับการพัฒนาหากยังไม่มี (ข้าม `BOOTSTRAP.md`)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ตการกำหนดค่าสำหรับการพัฒนา ข้อมูลประจำตัว เซสชัน และพื้นที่ทำงาน ต้องใช้ `--dev`
</ParamField>
<ParamField path="--force" type="boolean">
  ปิดตัวรับฟังที่มีอยู่บนพอร์ตเป้าหมายก่อนเริ่มทำงาน ในเชลล์แบบไม่โต้ตอบ ตัวเลือกนี้จะไม่ยอมปิดตัวรับฟัง Gateway ที่ผ่านการตรวจสอบแล้ว ให้ใช้ `--dev` หรือ `--profile` ที่แยกออกมาต่างหากพร้อมพอร์ตว่างแทน
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกล็อกแบบละเอียดไปยัง stdout/stderr
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะล็อกแบ็กเอนด์ของ CLI ในคอนโซล (และเปิดใช้งาน stdout/stderr ด้วย)
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  รูปแบบล็อก WebSocket: `auto`, `full`, `compact`
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมดิบของโมเดลลงใน JSONL
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ JSONL ของสตรีมดิบ
</ParamField>

`--claude-cli-logs` เป็นนามแฝงที่เลิกใช้แล้วของ `--cli-backend-logs`

สำหรับ `--bind custom` ให้ตั้งค่า `gateway.customBindHost` เป็นที่อยู่ IPv4 ที่อยู่อื่นใดนอกเหนือจาก `127.0.0.1` หรือ `0.0.0.0` ยังกำหนดให้ต้องมี `127.0.0.1` บนพอร์ตเดียวกันสำหรับไคลเอนต์บนโฮสต์เดียวกัน การเริ่มต้นจะล้มเหลวหากตัวรับฟังใดตัวหนึ่งไม่สามารถผูกได้ ไวลด์การ์ด `0.0.0.0` จะไม่เพิ่มนามแฝงที่จำเป็นแยกต่างหาก การตั้งค่าโฮสต์ที่จัดเตรียมเองและรองรับเฉพาะ IPv6 จำเป็นต้องมีไซด์คาร์ IPv4 หรือพร็อกซีอยู่หน้า Gateway

## เริ่มกระบวนการ Gateway ใหม่

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` จะขอให้ Gateway ที่กำลังทำงานตรวจสอบงานที่ดำเนินอยู่ล่วงหน้า และกำหนดเวลาเริ่มกระบวนการใหม่แบบรวมเป็นครั้งเดียวหลังจากงานเหล่านั้นเสร็จสิ้น ระยะเวลารอถูกจำกัดด้วย `gateway.reload.deferralTimeoutMs` (ค่าเริ่มต้น: 5 นาที / `300000`) เมื่อหมดเวลาที่กำหนด ระบบจะบังคับเริ่มกระบวนการใหม่ ตั้งค่า `deferralTimeoutMs: 0` เพื่อรอโดยไม่มีกำหนด (พร้อมคำเตือนเป็นระยะว่ายังรอดำเนินการอยู่) แทนการบังคับ `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait`

`--skip-deferral` จะข้ามตัวป้องกันการเลื่อนเวลาเนื่องจากงานที่ดำเนินอยู่ในการเริ่มกระบวนการใหม่แบบปลอดภัย ทำให้ Gateway เริ่มกระบวนการใหม่ทันทีแม้มีรายงานตัวขัดขวาง ต้องใช้ร่วมกับ `--safe` ให้ใช้เมื่อการเลื่อนเวลาค้างอยู่กับงานที่ทำงานไม่หยุด

`--wait <duration>` จะแทนที่ระยะเวลารอให้งานเสร็จสำหรับการเริ่มกระบวนการใหม่แบบปกติ (ไม่ใช่แบบปลอดภัย) รองรับค่ามิลลิวินาทีเปล่าหรือส่วนต่อท้ายหน่วย `ms`, `s`, `m`, `h`, `d` (เช่น `30s`, `5m`, `1h30m`) ส่วน `--wait 0` จะรอโดยไม่มีกำหนด ไม่สามารถใช้ร่วมกับ `--force` หรือ `--safe`

`--force` จะข้ามการรอให้งานที่ดำเนินอยู่เสร็จและเริ่มกระบวนการใหม่ทันที ส่วน `restart` แบบปกติ (ไม่มีแฟล็ก) จะคงลักษณะการเริ่มกระบวนการใหม่ของตัวจัดการบริการที่มีอยู่

<Warning>
`--password` ที่ระบุโดยตรงอาจปรากฏในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, ตัวแปรสภาพแวดล้อม หรือ `gateway.auth.password` ที่อ้างอิงผ่าน SecretRef
</Warning>

### ตัวควบคุมภายนอก

ตั้งค่า `OPENCLAW_SUPERVISOR_MODE=external` เฉพาะเมื่อตัวจัดการโปรเซสอื่นเป็นผู้ดูแลวงจรชีวิตของ Gateway ในโหมดนี้:

- `openclaw gateway restart` จะคงลักษณะการทำงานแบบปลอดภัย แบบบังคับ และแบบรอที่มีขอบเขตไว้ ขณะกำหนดเป้าหมายไปยัง Gateway ที่กำลังทำงานและผ่านการตรวจสอบแล้ว แทน launchd, systemd หรือ Task Scheduler
- ระบบจะปฏิเสธการติดตั้ง เริ่ม หยุด และถอนการติดตั้งบริการแบบเนทีฟ พร้อมคำแนะนำให้ใช้ตัวควบคุมภายนอก
- ระบบจะปฏิเสธการอัปเดตตัวเองของ OpenClaw เพื่อให้ตัวควบคุมสามารถหยุด Gateway แทนที่และดำเนินการรันไทม์ให้เสร็จสมบูรณ์ แล้วเริ่มใหม่ได้อย่างปลอดภัย
- การเริ่มกระบวนการใหม่ด้วยโปรเซสใหม่จะเขียนข้อมูลส่งต่อที่มีขอบเขตลงใน SQLite ก่อนออกอย่างเรียบร้อย หากการบันทึกถาวรล้มเหลว Gateway จะกลับไปใช้การเริ่มกระบวนการใหม่ภายในโปรเซสแทนการออกโดยไม่มีข้อมูลส่งต่อที่ใช้งานได้

`OPENCLAW_SERVICE_REPAIR_POLICY=external` ยังคงเป็นนโยบายซ่อมแซมของ Doctor ที่แยกต่างหาก และไม่ได้ประกาศความเป็นเจ้าของรันไทม์ ตัวควบคุมที่ต้องการทั้งสองลักษณะการทำงานควรตั้งค่าตัวแปรทั้งสอง

ตัวควบคุมภายนอกสามารถเจรจาและรับข้อมูลส่งต่อการเริ่มกระบวนการใหม่ผ่านสัญญาสำหรับเครื่องที่ซ่อนอยู่:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

โปรโตคอลเวอร์ชัน `1` รองรับการดำเนินการ `consume` การรับข้อมูลจะตรวจสอบ PID ที่คาดไว้และฟิลด์ข้อมูลส่งต่อที่มีขอบเขตภายในทรานแซกชัน SQLite แบบทันทีหนึ่งรายการ ข้อมูลส่งต่อที่ยอมรับแล้วจะถูกลบก่อนส่งคืนผลสำเร็จ ดังนั้นผู้รับข้อมูลที่ทำงานพร้อมกันหรือเล่นซ้ำจึงไม่สามารถยอมรับข้อมูลเดียวกันได้ทั้งคู่ กรณี PID ไม่ตรงกัน ข้อมูลจะยังคงอยู่สำหรับเจ้าของที่ตรงกัน ส่วนแถวที่ไม่มีอยู่ หมดอายุ หรือไม่ถูกต้องจะไม่อนุญาตให้เริ่มกระบวนการใหม่

คำขอสำหรับเครื่องที่ถูกต้องจะส่งคืน JSON พร้อมรหัสออก `0` รวมถึงผลลัพธ์ที่ไม่มีการเริ่มกระบวนการใหม่ อาร์กิวเมนต์ที่ไม่ถูกต้องจะส่งคืน `reason: "invalid-expected-pid"` พร้อมรหัสออก `2` ส่วนความล้มเหลวของที่เก็บสถานะจะส่งคืน `reason: "store-unavailable"` พร้อมรหัสออก `1` ตัวควบคุมควรตรวจสอบ `capabilities` บนรันไทม์หรือตัวเรียกใช้ที่แน่นอนซึ่งจะใช้งาน แทนการอนุมานการรองรับจากสตริงเวอร์ชันของ OpenClaw หรืออ่านสคีมา SQLite ส่วนตัวโดยตรง

### การทำโปรไฟล์ Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` จะบันทึกระยะเวลาของแต่ละเฟสระหว่างการเริ่มต้น รวมถึงความล่าช้า `eventLoopMax` รายเฟสและระยะเวลาของตารางค้นหา Plugin (ดัชนีที่ติดตั้ง รีจิสทรีแมนิเฟสต์ การวางแผนเริ่มต้น และงานแมปเจ้าของ)
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` จะบันทึกบรรทัด `restart trace:` ที่จำกัดขอบเขตตามการเริ่มกระบวนการใหม่ ได้แก่ การจัดการสัญญาณ การรอให้งานที่ดำเนินอยู่เสร็จ เฟสการปิดระบบ การเริ่มต้นครั้งถัดไป ระยะเวลาจนพร้อมใช้งาน และเมตริกหน่วยความจำ
- `OPENCLAW_DIAGNOSTICS=timeline` ร่วมกับ `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` จะเขียนไทม์ไลน์การวินิจฉัยการเริ่มต้นแบบ JSONL โดยพยายามอย่างดีที่สุด สำหรับชุดทดสอบ QA ภายนอก (เทียบเท่ากับการกำหนดค่า `diagnostics.flags: ["timeline"]` โดยพาธยังคงตั้งค่าได้ผ่านสภาพแวดล้อมเท่านั้น) เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่างลูปเหตุการณ์
- `pnpm build` แล้วตามด้วย `pnpm test:startup:gateway -- --runs 5 --warmup 1` จะวัดประสิทธิภาพการเริ่มต้น Gateway เทียบกับจุดเข้าของ CLI ที่สร้างแล้ว ได้แก่ เอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, ระยะเวลาในเทรซการเริ่มต้น, ความล่าช้าของลูปเหตุการณ์ และระยะเวลาของตารางค้นหา Plugin
- `pnpm build` แล้วตามด้วย `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` จะวัดประสิทธิภาพการเริ่มกระบวนการใหม่ภายในโปรเซสบน macOS หรือ Linux (ไม่รองรับบน Windows และการเริ่มกระบวนการใหม่ต้องใช้ `SIGUSR1`) โดยใช้ `SIGUSR1` เปิดใช้งานเทรซทั้งสองในโปรเซสลูก และบันทึก `/healthz` ถัดไป, `/readyz` ถัดไป, ช่วงเวลาหยุดทำงาน, ระยะเวลาจนพร้อมใช้งาน, CPU, RSS และเมตริกเทรซการเริ่มกระบวนการใหม่
- `/healthz` คือการตรวจสอบว่ายังทำงานอยู่ ส่วน `/readyz` คือการตรวจสอบความพร้อมใช้งานจริง ให้ถือว่าบรรทัดเทรซและเอาต์พุตการวัดประสิทธิภาพเป็นสัญญาณระบุเจ้าของ ไม่ใช่ข้อสรุปด้านประสิทธิภาพที่สมบูรณ์จากช่วงเวลาหรือตัวอย่างเดียว

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่งสอบถามทั้งหมดใช้ RPC ผ่าน WebSocket

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านเข้าใจง่ายสำหรับมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มีการจัดรูปแบบ/ตัวแสดงการโหลด)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI โดยยังคงเค้าโครงสำหรับมนุษย์

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: โทเค็น Gateway
    - `--password <password>`: รหัสผ่าน Gateway
    - `--timeout <ms>`: ระยะหมดเวลา/ขอบเขตเวลา (ค่าเริ่มต้นแตกต่างกันไปในแต่ละคำสั่ง โปรดดูแต่ละคำสั่งด้านล่าง)
    - `--expect-final`: รอการตอบกลับ "สุดท้าย" (การเรียกของเอเจนต์)

  </Tab>
</Tabs>

<Note>
เมื่อตั้งค่า `--url` CLI จะไม่กลับไปใช้ข้อมูลประจำตัวจากการกำหนดค่าหรือสภาพแวดล้อม โปรดส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` เป็นโพรบตรวจสอบความพร้อมทำงาน: โดยจะส่งคืนทันทีที่เซิร์ฟเวอร์สามารถตอบ HTTP ได้ ส่วน `/readyz` เข้มงวดกว่าและยังคงแสดงเป็นสีแดงขณะที่ไซด์คาร์ Plugin ช่องทาง หรือฮุกที่กำหนดค่าไว้ในช่วงเริ่มต้นระบบยังอยู่ระหว่างการปรับเข้าสู่ภาวะพร้อมใช้งาน การตอบกลับ `/readyz` แบบละเอียดที่มาจากภายในเครื่องหรือผ่านการยืนยันตัวตนจะมีบล็อกการวินิจฉัย `eventLoop` (ความล่าช้า การใช้งาน อัตราส่วนแกน CPU และแฟล็ก `degraded`)

<ParamField path="--port <port>" type="number">
  กำหนดเป้าหมายเป็น Gateway แบบลูปแบ็กภายในเครื่องบนพอร์ตนี้ โดยแทนที่ `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียกครั้งนี้
</ParamField>

### `gateway usage-cost`

ดึงข้อมูลสรุปต้นทุนการใช้งานจากบันทึกเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>
<ParamField path="--agent <id>" type="string">
  จำกัดขอบเขตข้อมูลสรุปไว้ที่รหัสเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมข้อมูลจากเอเจนต์ที่กำหนดค่าไว้ทั้งหมด ไม่สามารถใช้ร่วมกับ `--agent` ได้
</ParamField>

### `gateway stability`

ดึงข้อมูลล่าสุดจากตัวบันทึกเสถียรภาพสำหรับการวินิจฉัยของ Gateway ที่กำลังทำงาน

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  จำนวนเหตุการณ์ล่าสุดสูงสุดที่จะรวม (สูงสุด `1000`)
</ParamField>
<ParamField path="--type <type>" type="string">
  กรองตามประเภทเหตุการณ์การวินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับการวินิจฉัยที่ระบุ
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่านบันเดิลเสถียรภาพที่บันทึกไว้แทนการเรียก Gateway ที่กำลังทำงาน โดย `--bundle latest` (หรือระบุเพียง `--bundle`) จะเลือกบันเดิลใหม่ล่าสุดภายใต้ไดเรกทอรีสถานะ หรือจะส่งพาธ JSON ของบันเดิลโดยตรงก็ได้
</ParamField>
<ParamField path="--export" type="boolean">
  เขียนไฟล์ zip การวินิจฉัยสำหรับการสนับสนุนที่แชร์ได้ แทนการพิมพ์รายละเอียดเสถียรภาพ
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและลักษณะการทำงานของบันเดิล">
    - ระเบียนจะเก็บเมตาดาต้าการทำงาน ได้แก่ ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน รหัสการอนุมัติ ชื่อช่องทาง/Plugin และข้อมูลสรุปเซสชันที่ปกปิดแล้ว โดยไม่รวมข้อความแชต เนื้อหา Webhook เอาต์พุตของเครื่องมือ เนื้อหาคำขอ/การตอบกลับดิบ โทเค็น คุกกี้ ค่าความลับ ชื่อโฮสต์ และรหัสเซสชันดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งานตัวบันทึกทั้งหมด
    - การออกจาก Gateway เนื่องจากข้อผิดพลาดร้ายแรง การหมดเวลาขณะปิดระบบ และความล้มเหลวในการเริ่มต้นหลังรีสตาร์ต จะเขียนสแนปช็อตการวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อตัวบันทึกมีเหตุการณ์ ตรวจสอบบันเดิลใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุตบันเดิลด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียนไฟล์ zip การวินิจฉัยภายในเครื่องที่ออกแบบมาสำหรับรายงานข้อบกพร่อง สำหรับโมเดลความเป็นส่วนตัวและเนื้อหาของบันเดิล โปรดดู [การส่งออกข้อมูลการวินิจฉัย](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธของไฟล์ zip เอาต์พุต ค่าเริ่มต้นคือการส่งออกสำหรับการสนับสนุนภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ผ่านการทำให้ปลอดภัยสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์ของบันทึกสูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับสแนปช็อตสถานภาพ
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็น Gateway สำหรับสแนปช็อตสถานภาพ
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่าน Gateway สำหรับสแนปช็อตสถานภาพ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  ระยะหมดเวลาของสแนปช็อตสถานะ/สถานภาพ
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหาบันเดิลเสถียรภาพที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และแมนิเฟสต์เป็น JSON
</ParamField>

การส่งออกจะรวม: `manifest.json` (รายการไฟล์), `summary.md` (ข้อมูลสรุป Markdown), `diagnostics.json` (ข้อมูลสรุประดับบนสุดของการกำหนดค่า/บันทึก/การค้นพบ/เสถียรภาพ/สถานะ/สถานภาพ), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` และ `stability/latest.json` เมื่อมีบันเดิลอยู่

ไฟล์นี้ออกแบบมาให้แชร์ได้ โดยเก็บรายละเอียดการทำงานที่เป็นประโยชน์ต่อการแก้จุดบกพร่อง ได้แก่ ฟิลด์บันทึกที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่กำหนดค่าไว้ พอร์ต รหัส Plugin/ผู้ให้บริการ การตั้งค่าคุณสมบัติที่ไม่เป็นความลับ และข้อความบันทึกการทำงานที่ปกปิดแล้ว พร้อมทั้งละเว้นหรือปกปิดข้อความแชต เนื้อหา Webhook เอาต์พุตของเครื่องมือ ข้อมูลประจำตัว คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความพรอมต์/คำสั่ง ชื่อโฮสต์ และค่าความลับ เมื่อข้อความบันทึกมีลักษณะเหมือนข้อความเพย์โหลดจากผู้ใช้/แชต/เครื่องมือ (เช่น "ผู้ใช้กล่าวว่า", "ข้อความแชต", "เอาต์พุตของเครื่องมือ", "เนื้อหา Webhook") การส่งออกจะเก็บไว้เพียงข้อเท็จจริงว่าข้อความถูกละเว้นพร้อมจำนวนไบต์เท่านั้น

### `gateway status`

แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมโพรบการเชื่อมต่อ/การยืนยันตัวตนที่เลือกใช้ได้

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายโพรบที่ระบุอย่างชัดเจน โดยยังคงโพรบปลายทางระยะไกลที่กำหนดค่าไว้และ localhost
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วยโทเค็นสำหรับโพรบ
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับโพรบ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  ระยะหมดเวลาของโพรบ
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้ามโพรบการเชื่อมต่อ (มุมมองบริการเท่านั้น)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับโพรบการเชื่อมต่อเป็นโพรบการอ่านและออกด้วยสถานะไม่ใช่ศูนย์หากล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - ยังคงพร้อมใช้งานสำหรับการวินิจฉัยแม้ว่าการกำหนดค่า CLI ภายในเครื่องจะไม่มีอยู่หรือไม่ถูกต้อง
    - เอาต์พุตเริ่มต้นยืนยันสถานะบริการ การเชื่อมต่อ WebSocket และความสามารถในการยืนยันตัวตนที่มองเห็นได้ขณะแฮนด์เชก ไม่ใช่การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - โพรบจะไม่เปลี่ยนแปลงข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก โดยจะใช้โทเค็นอุปกรณ์ที่แคชไว้อยู่แล้วเมื่อมี แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - แก้ค่า SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้ยืนยันตัวตนของโพรบเมื่อทำได้ หากไม่สามารถแก้ค่า SecretRef ที่จำเป็นได้ `--json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของโพรบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจนหรือแก้ไขแหล่งข้อมูลความลับ คำเตือนเกี่ยวกับการยืนยันตัวตนที่แก้ค่าไม่ได้จะถูกระงับเมื่อโพรบสำเร็จ
    - เอาต์พุต JSON จะมี `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่านี้ โดย `--require-rpc` สามารถใช้เพย์โหลด RPC ของ `status.runtimeVersion` เป็นทางเลือกได้ หากโพรบแฮนด์เชกไม่สามารถให้เมตาดาต้าเวอร์ชัน
    - ใช้ `--require-rpc` ในสคริปต์/ระบบอัตโนมัติเมื่อบริการที่กำลังรับฟังเพียงอย่างเดียวยังไม่เพียงพอ และต้องการให้ RPC ขอบเขตการอ่านมีสถานภาพดีด้วย
    - `--deep` จะสแกนหาการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่มีลักษณะคล้าย Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำในการทำความสะอาด (โดยทั่วไปให้เรียกใช้ Gateway หนึ่งรายการต่อเครื่อง) และรายงานการส่งต่อการรีสตาร์ตของตัวควบคุมล่าสุดเมื่อเกี่ยวข้อง
    - `--deep` ยังเรียกใช้การตรวจสอบความถูกต้องของการกำหนดค่าในโหมดที่รับรู้ Plugin (`pluginValidation: "full"`) และแสดงคำเตือนจากแมนิเฟสต์ Plugin (เช่น เมตาดาต้าการกำหนดค่าช่องทางขาดหาย) ส่วน `gateway status` เริ่มต้นจะคงเส้นทางแบบอ่านอย่างเดียวที่รวดเร็วซึ่งข้ามการตรวจสอบ Plugin
    - เอาต์พุตสำหรับมนุษย์จะมีพาธไฟล์บันทึกที่แก้ค่าแล้ว พร้อมพาธ/ความถูกต้องของการกำหนดค่าฝั่ง CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ
    - เอาต์พุตสำหรับมนุษย์จะมี `Gateway heap:` พร้อมขีดจำกัดที่ใช้และที่มาของการคำนวณแบบปรับตัว เอาต์พุต JSON จะแสดงรายงานเดียวกันเป็น `service.gatewayHeap`

  </Accordion>
  <Accordion title="การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนใน Linux systemd">
    - การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนของบริการจะอ่านทั้ง `Environment=` และ `EnvironmentFile=` จากยูนิต (รวมถึง `%h` พาธที่มีเครื่องหมายคำพูด ไฟล์หลายไฟล์ และไฟล์ `-` ที่เลือกใช้ได้)
    - แก้ค่า SecretRef ของ `gateway.auth.token` โดยใช้สภาพแวดล้อมรันไทม์ที่ผสานแล้ว (สภาพแวดล้อมคำสั่งบริการก่อน จากนั้นใช้สภาพแวดล้อมกระบวนการเป็นทางเลือก)
    - การตรวจสอบความคลาดเคลื่อนของโทเค็นจะข้ามการแก้ค่าโทเค็นจากการกำหนดค่า เมื่อการยืนยันตัวตนด้วยโทเค็นไม่ได้เปิดใช้งานจริง (`gateway.auth.mode` ระบุเป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้งค่าโหมดในกรณีที่รหัสผ่านมีสิทธิ์เหนือกว่าและไม่มีโทเค็นตัวเลือกใดมีสิทธิ์เหนือกว่า)

  </Accordion>
</AccordionGroup>

### `gateway probe`

คำสั่ง "แก้จุดบกพร่องทุกอย่าง" โดยจะโพรบรายการต่อไปนี้เสมอ:

- Gateway ระยะไกลที่กำหนดค่าไว้ (หากมี) และ
- localhost (ลูปแบ็ก) **แม้ว่าจะกำหนดค่าปลายทางระยะไกลไว้ก็ตาม**

การส่ง `--url` จะเพิ่มเป้าหมายที่ระบุอย่างชัดเจนไว้ก่อนหน้าทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายกำกับเป้าหมายเป็น `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` และ `Local loopback`

<Note>
หากเข้าถึงเป้าหมายโพรบได้หลายรายการ ระบบจะพิมพ์ทั้งหมด ทันเนล SSH, URL TLS/พร็อกซี และ URL ระยะไกลที่กำหนดค่าไว้ อาจชี้ไปยัง Gateway เดียวกันแม้ใช้พอร์ตการรับส่งข้อมูลต่างกัน โดย `multiple_gateways` สงวนไว้สำหรับ Gateway ที่เข้าถึงได้ซึ่งแตกต่างกันหรือมีข้อมูลประจำตัวกำกวม รองรับการเรียกใช้ Gateway หลายรายการสำหรับโปรไฟล์ที่แยกจากกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่เรียกใช้ Gateway เพียงรายการเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายโพรบลูปแบ็กภายในเครื่องและพอร์ตระยะไกลของทันเนล SSH หากไม่มี `--url` ตัวเลือกนี้จะเลือกเฉพาะเป้าหมายลูปแบ็กภายในเครื่องแทน URL สภาพแวดล้อมของ Gateway ที่กำหนดค่าไว้ พอร์ตสภาพแวดล้อม หรือเป้าหมายระยะไกล
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายถึงมีอย่างน้อยหนึ่งเป้าหมายที่ยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบสามารถยืนยันได้เกี่ยวกับการยืนยันตัวตน โดยแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายถึงการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายถึงการเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านมีข้อจำกัด โดยรายงานเป็นความสามารถในการเข้าถึงที่ **ลดระดับ** ไม่ใช่ความล้มเหลวโดยสมบูรณ์
    - `Read probe: failed` หลัง `Connect: ok` หมายถึง WebSocket เชื่อมต่อแล้ว แต่การวินิจฉัยการอ่านในขั้นตอนถัดไปหมดเวลาหรือล้มเหลว ซึ่งถือว่า **ลดระดับ** เช่นกัน ไม่ใช่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้อยู่แล้ว แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์หรือสถานะการจับคู่สำหรับครั้งแรก
    - รหัสออกจะไม่ใช่ศูนย์เฉพาะเมื่อไม่สามารถเข้าถึงเป้าหมายที่โพรบได้เลย

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: สามารถเข้าถึงเป้าหมายได้อย่างน้อยหนึ่งรายการ
    - `degraded`: มีเป้าหมายอย่างน้อยหนึ่งรายการที่ยอมรับการเชื่อมต่อ แต่ดำเนินการวินิจฉัย RPC แบบละเอียดทั้งหมดไม่เสร็จสมบูรณ์
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดสำหรับถือเป็นเป้าหมายหลักที่ใช้งานอยู่ โดยเรียงตามลำดับดังนี้: URL ที่ระบุอย่างชัดเจน, ทันเนล SSH, รีโมตที่กำหนดค่าไว้, ลูปแบ็กภายในเครื่อง
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามให้ดีที่สุด ซึ่งมี `code`, `message` และ `targetIds` ซึ่งเป็นตัวเลือก
    - `network`: คำแนะนำ URL สำหรับลูปแบ็กภายในเครื่อง/tailnet ที่ได้มาจากการกำหนดค่าปัจจุบันและระบบเครือข่ายของโฮสต์
    - `discovery.timeoutMs` / `discovery.count`: งบประมาณการค้นหา/จำนวนผลลัพธ์จริงที่ใช้ในการตรวจสอบรอบนี้

    ต่อเป้าหมาย (`targets[].connect`): `ok` (ความสามารถในการเข้าถึง + การจำแนกสถานะที่ลดระดับ), `rpcOk` (RPC แบบละเอียดทั้งหมดสำเร็จ), `scopeLimited` (RPC แบบละเอียดล้มเหลวเนื่องจากไม่มีขอบเขตผู้ดำเนินการ)

    ต่อเป้าหมาย (`targets[].auth`): รายงาน `role` และ `scopes` ใน `hello-ok` เมื่อพร้อมใช้งาน พร้อมการจำแนก `capability` ที่แสดงขึ้นมา

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่าทันเนล SSH ล้มเหลว คำสั่งจึงเปลี่ยนกลับไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: สามารถเข้าถึง Gateway ที่มีข้อมูลประจำตัวต่างกัน หรือ OpenClaw ไม่สามารถพิสูจน์ได้ว่าเป้าหมายที่เข้าถึงได้นั้นเป็น Gateway เดียวกัน ทันเนล SSH, URL พร็อกซี หรือ URL รีโมตที่กำหนดค่าให้ชี้ไปยัง Gateway เดียวกันจะไม่ทำให้เกิดคำเตือนนี้
    - `auth_secretref_unresolved`: ไม่สามารถแก้ไข SecretRef สำหรับการตรวจสอบสิทธิ์ที่กำหนดค่าไว้ของเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: เชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบการอ่านถูกจำกัดเนื่องจากไม่มี `operator.read`
    - `local_tls_runtime_unavailable`: เปิดใช้งาน TLS ของ Gateway ภายในเครื่อง แต่ OpenClaw ไม่สามารถโหลดลายนิ้วมือใบรับรองภายในเครื่องได้

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (ทำงานสอดคล้องกับแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้สามารถเข้าถึง Gateway รีโมตที่รับเฉพาะลูปแบ็กได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (พอร์ตเริ่มต้นคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ข้อมูลประจำตัว
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ Gateway รายการแรกที่ค้นพบเป็นเป้าหมาย SSH จากปลายทางการค้นหาที่แก้ไขแล้ว (`local.` รวมถึงโดเมนแบบพื้นที่กว้างที่กำหนดค่าไว้ หากมี) ระบบจะละเว้นคำแนะนำที่มาจาก TXT เท่านั้น
</ParamField>

ค่าเริ่มต้นของการกำหนดค่า (ไม่บังคับ): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับล่าง

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  สตริงออบเจ็กต์ JSON สำหรับพารามิเตอร์
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็นของ Gateway
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  งบประมาณการหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC แบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อนเพย์โหลดสุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุต JSON ที่เครื่องอ่านได้
</ParamField>

<Note>
`--params` ต้องเป็น JSON ที่ถูกต้อง และแต่ละเมธอดจะตรวจสอบรูปแบบพารามิเตอร์ของตนเอง (ระบบจะปฏิเสธฟิลด์ส่วนเกินหรือฟิลด์ที่ตั้งชื่อไม่ถูกต้อง)
</Note>

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ติดตั้งพร้อมตัวห่อหุ้ม

ใช้ `--wrapper` เมื่อบริการที่มีการจัดการต้องเริ่มทำงานผ่านโปรแกรมสั่งทำงานอื่น เช่น ชิมของตัวจัดการข้อมูลลับหรือตัวช่วยเรียกใช้ในนามผู้ใช้อื่น ตัวห่อหุ้มจะรับอาร์กิวเมนต์ Gateway ตามปกติ และมีหน้าที่เรียกใช้ `openclaw` หรือ Node ด้วยอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

นอกจากนี้ยังกำหนดตัวห่อหุ้มผ่านสภาพแวดล้อมได้ด้วย `gateway install` จะตรวจสอบว่าพาธเป็นไฟล์ที่เรียกใช้ได้ เขียนตัวห่อหุ้มลงใน `ProgramArguments` ของบริการ และบันทึก `OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมด้วย doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการลบตัวห่อหุ้มที่บันทึกไว้ ให้ล้าง `OPENCLAW_WRAPPER` ขณะติดตั้งใหม่:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (ค่าเริ่มต้น: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="ลักษณะการทำงานของวงจรชีวิต">
    - `gateway start` เป็นแบบไอดิมโพเทนต์: เมื่อบริการที่มีการจัดการทำงานอยู่แล้ว ระบบจะรายงานกระบวนการที่กำลังทำงานและไม่เปลี่ยนแปลงกระบวนการนั้น ส่วนบริการที่โหลดแล้วแต่หยุดอยู่จะเริ่มทำงานเช่นเดิม
    - ใช้ `gateway restart` เพื่อเริ่มบริการที่มีการจัดการใหม่ อย่าต่อคำสั่ง `gateway stop` และ `gateway start` เพื่อใช้แทนการเริ่มใหม่
    - ในเชลล์แบบไม่โต้ตอบ `gateway stop` ต้องใช้ `--force` ส่วนเทอร์มินัลแบบโต้ตอบยังคงทำงานโดยไม่แสดงพรอมต์เช่นเดิม สำหรับระบบอัตโนมัติและการทดสอบ ควรใช้ `gateway run --dev` หรือ `--profile` แบบแยกส่วนพร้อมพอร์ตที่ว่าง
    - บน macOS โดยค่าเริ่มต้น `gateway stop` จะใช้ `launchctl bootout` ซึ่งจะนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่บันทึกการปิดใช้งานไว้ — การกู้คืนอัตโนมัติของ KeepAlive จะยังคงทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` จะเปิดใช้งานอีกครั้งได้อย่างเรียบร้อยโดยไม่ต้องใช้ `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เริ่มกระบวนการใหม่จนกว่าจะเรียก `gateway start` อย่างชัดเจนครั้งถัดไป ใช้ตัวเลือกนี้เมื่อต้องการให้การหยุดด้วยตนเองยังคงมีผลหลังรีบูต
    - การเปลี่ยนแปลงวงจรชีวิตของ Gateway จะเพิ่มระเบียนการตรวจสอบแบบคีย์-ค่าโดยพยายามให้ดีที่สุดต่อท้าย `<state-dir>/logs/gateway-restart.log` ซึ่งรวมถึงการดำเนินการเริ่ม หยุด และเริ่มใหม่ผ่าน CLI, คำขอเริ่มใหม่อย่างปลอดภัย, การเริ่มใหม่โดยตัวควบคุม และการส่งมอบแบบแยกกระบวนการ
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การกำหนดขนาดฮีปของ Gateway ที่มีการจัดการ">
    - `gateway install` จะเขียนค่า `NODE_OPTIONS` สำหรับฮีปเท่านั้นให้กับบริการ Gateway ที่มีการจัดการ โดยกำหนดเป้าหมายเป็น 50% ของหน่วยความจำที่ถูกจำกัดเมื่อ Node รายงานขีดจำกัดของคอนเทนเนอร์หรือบริการ มิฉะนั้นจะเป็น 50% ของหน่วยความจำกายภาพ
    - ช่วงเป้าหมายปกติคือ 2048–8192 MiB พร้อมขีดจำกัดพื้นที่สำรองสำหรับหน่วยความจำเนทีฟเพิ่มเติมที่ 75% สำหรับโฮสต์ขนาดเล็ก ขีดจำกัดพื้นที่สำรองนี้อาจทำให้ขีดจำกัดที่นำไปใช้ต่ำกว่าค่าขั้นต่ำปกติ 2048 MiB
    - ค่า `--max-old-space-size` ที่ระบุไว้อย่างชัดเจนและถูกต้องซึ่งจัดเก็บอยู่แล้วในบริการที่ติดตั้งจะยังคงอยู่เมื่อมีการติดตั้งใหม่แบบบังคับและการซ่อมแซมด้วย doctor ส่วนแฟล็ก `NODE_OPTIONS` อื่นจะไม่ถูกนำไปใช้กับบริการที่มีการจัดการ
    - `NODE_OPTIONS` ของเชลล์โดยรอบจะไม่แทนที่นโยบายนี้ ใช้ `gateway status` หรือ `doctor` เพื่อตรวจสอบค่าที่ติดตั้ง เรียกใช้ `openclaw gateway install --force` เพื่อสร้างข้อมูลเมตาของบริการรุ่นเก่าที่ยังไม่มีการตั้งค่าฮีปที่มีการจัดการขึ้นใหม่
    - นโยบายนี้ใช้กับบริการ Gateway ที่มีการจัดการเท่านั้น `gateway run` ที่ทำงานเบื้องหน้า บริการ Node และหน่วยตัวควบคุมที่เขียนด้วยตนเองจะยังคงใช้การกำหนดค่ารันไทม์ของตนเอง

  </Accordion>
  <Accordion title="การตรวจสอบสิทธิ์และ SecretRef ขณะติดตั้ง">
    - เมื่อการตรวจสอบสิทธิ์ด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่าสามารถแก้ไข SecretRef ได้ แต่จะไม่บันทึกโทเค็นที่แก้ไขแล้วลงในข้อมูลเมตาสภาพแวดล้อมของบริการ
    - หากการตรวจสอบสิทธิ์ด้วยโทเค็นต้องใช้โทเค็น แต่ไม่สามารถแก้ไข SecretRef ของโทเค็นที่กำหนดค่าไว้ได้ การติดตั้งจะล้มเหลวแบบปิดแทนการบันทึกข้อความธรรมดาสำรอง
    - สำหรับการตรวจสอบสิทธิ์ด้วยรหัสผ่านบน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบอินไลน์
    - ในโหมดการตรวจสอบสิทธิ์แบบอนุมาน `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดโทเค็นสำหรับการติดตั้ง ให้ใช้การกำหนดค่าถาวร (`gateway.auth.password` หรือ `env` ในการกำหนดค่า) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้งค่า `gateway.auth.mode` ระบบจะบล็อกการติดตั้งจนกว่าจะกำหนดโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` จะสแกนหาบีคอนของ Gateway (`_openclaw-gw._tcp`)

- DNS-SD แบบมัลติแคสต์: `local.`
- DNS-SD แบบยูนิแคสต์ (Bonjour แบบพื้นที่กว้าง): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) แล้วตั้งค่า DNS แบบแยกและเซิร์ฟเวอร์ DNS โปรดดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้งานการค้นหาผ่าน Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศบีคอน

คำแนะนำ TXT ในทุกบีคอน: `role` (คำแนะนำบทบาท Gateway), `transport` (คำแนะนำการรับส่งข้อมูล เช่น `gateway`), `gatewayPort` (พอร์ต WebSocket ซึ่งโดยปกติคือ `18789`), `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อพร้อมใช้งาน), `gatewayTls` / `gatewayTlsSha256` (เปิดใช้งาน TLS + ลายนิ้วมือใบรับรอง) ระบบจะเผยแพร่ `sshPort` และ `cliPath` เฉพาะในโหมดการค้นหาแบบเต็ม (`discovery.mdns.mode: "full"`; ค่าเริ่มต้นคือ `"minimal"` ซึ่งจะละเว้นค่าเหล่านี้ — จากนั้นไคลเอนต์จะใช้พอร์ต `22` เป็นค่าเริ่มต้นสำหรับเป้าหมาย SSH)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  ระยะหมดเวลาต่อคำสั่ง (เรียกดู/แก้ไข)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดใช้งานการจัดรูปแบบ/ตัวแสดงการโหลดด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- สแกน `local.` รวมถึงโดเมนแบบพื้นที่กว้างที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON ได้มาจากปลายทางบริการที่แก้ไขแล้ว ไม่ใช่จากคำแนะนำที่มาจาก TXT เท่านั้น เช่น `lanHost` หรือ `tailnetDns`
- `discovery.mdns.mode` ควบคุมการเผยแพร่ `sshPort`/`cliPath` ทั้งบน mDNS `local.` และ DNS-SD แบบพื้นที่กว้าง (ดูด้านบน)

</Note>

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
