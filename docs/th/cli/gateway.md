---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตน โหมดการ bind และการเชื่อมต่อของ Gateway
    - การค้นหา Gateway ผ่าน Bonjour (ภายในเครือข่าย + DNS-SD แบบพื้นที่กว้าง)
    - การผสานรวมตัวควบคุมดูแลกระบวนการ Gateway ภายนอก
sidebarTitle: Gateway
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-21T16:26:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0188d7c79571ebf8f350295775625533a83cb2eb909bcc8763e8ce81806d2214
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, Node, เซสชัน, ฮุก) คำสั่งย่อยทั้งหมดด้านล่างอยู่ภายใต้ `openclaw gateway ...`

<CardGroup cols={3}>
  <Card title="การค้นหาด้วย Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครือข่าย + DNS-SD บริเวณกว้าง
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
openclaw gateway run   # รูปแบบชัดเจนที่ให้ผลเทียบเท่ากัน
```

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานเมื่อเริ่มต้น">
    - จะไม่ยอมเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้เฉพาะกิจ/การพัฒนา ซึ่งจะข้ามการตรวจสอบนี้โดยไม่เขียนหรือซ่อมแซมการกำหนดค่า
    - เมื่อพบการกำหนดค่าที่ไม่ถูกต้องแต่ซ่อมแซมได้ระหว่างการเริ่มต้น เทอร์มินัลแบบโต้ตอบจะเสนอให้เรียกใช้ `openclaw doctor --fix` และลองเริ่มต้นใหม่หนึ่งครั้งหลังได้รับความยินยอม การเรียกใช้แบบไม่โต้ตอบจะไม่ซ่อมแซมโดยอัตโนมัติ แต่จะแสดงคำสั่งแทน หากการกำหนดค่าหลังซ่อมแซมยังไม่ถูกต้อง การเริ่มต้นจะยังคงหยุดอยู่
    - `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากมีไฟล์การกำหนดค่าอยู่แต่ไม่มี `gateway.mode` ระบบจะถือว่าการกำหนดค่าเสียหาย/ถูกเขียนทับ และ Gateway จะไม่คาดเดา `local` ให้ โปรดเริ่มขั้นตอนเริ่มต้นใช้งานอีกครั้ง ตั้งค่าคีย์ด้วยตนเอง หรือส่ง `--allow-unconfigured`
    - ระบบจะบล็อกการผูกกับที่อยู่นอกเหนือจาก loopback หากไม่มีการยืนยันตัวตน
    - ค่า `--bind` ได้แก่ `lan`, `tailnet` และ `custom` ปัจจุบันจะจำแนกผ่านเส้นทาง IPv4 เท่านั้น การตั้งค่าโฮสต์ของตนเองที่รองรับเฉพาะ IPv6 ต้องมี sidecar IPv4 หรือพร็อกซีอยู่ด้านหน้า Gateway
    - `SIGUSR1` จะทริกเกอร์การเริ่มกระบวนการใหม่ภายในโปรเซสเมื่อได้รับอนุญาต `commands.restart` (ค่าเริ่มต้น: เปิดใช้งาน) ควบคุม `SIGUSR1` ที่ส่งมาจากภายนอก ให้ตั้งเป็น `false` เพื่อบล็อกการเริ่มกระบวนการใหม่ด้วยสัญญาณ OS แบบกำหนดเอง เครื่องมือ `gateway` สำหรับเอเจนต์เป็นแบบอ่านอย่างเดียว เอเจนต์จะขอเริ่มกระบวนการใหม่ผ่านเครื่องมือมอบหมาย `openclaw` ที่มนุษย์อนุมัติ
    - `SIGINT`/`SIGTERM` จะหยุดโปรเซสแต่ไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเอง หากห่อหุ้ม CLI ด้วย TUI หรืออินพุตโหมด raw โปรดคืนค่าเทอร์มินัลด้วยตนเองก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจากการกำหนดค่า/ตัวแปรสภาพแวดล้อม โดยทั่วไปคือ `18789`)
</ParamField>
<ParamField path="--bind <mode>" type="string">
  โหมดการผูก: `loopback` (ค่าเริ่มต้น), `lan`, `tailnet`, `auto`, `custom`
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็นร่วมสำหรับ `connect.params.auth.token` ค่าเริ่มต้นคือ `OPENCLAW_GATEWAY_TOKEN` เมื่อตั้งค่าไว้
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
  เริ่มทำงานโดยไม่บังคับใช้ `gateway.mode=local` สำหรับการบูตสแตรปเฉพาะกิจ/การพัฒนาเท่านั้น โดยจะไม่บันทึกหรือซ่อมแซมการกำหนดค่า
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้างการกำหนดค่าและพื้นที่ทำงานสำหรับการพัฒนาหากไม่มี (ข้าม `BOOTSTRAP.md`)
</ParamField>
<ParamField path="--dev-ambient-channels" type="boolean">
  อนุญาตให้ Gateway สำหรับการพัฒนากำหนดค่าช่องทางโดยอัตโนมัติจากตัวแปรสภาพแวดล้อมที่มีอยู่ ต้องใช้ `--dev`
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ตการกำหนดค่าสำหรับการพัฒนา ข้อมูลรับรอง เซสชัน และพื้นที่ทำงาน ต้องใช้ `--dev`
</ParamField>
<ParamField path="--force" type="boolean">
  ยุติตัวรับฟังที่มีอยู่บนพอร์ตเป้าหมายก่อนเริ่มทำงาน ในเชลล์แบบไม่โต้ตอบ ระบบจะไม่ยอมยุติตัวรับฟัง Gateway ที่ยืนยันแล้ว ให้ใช้ `--dev` หรือ `--profile` แบบแยกส่วนที่มีพอร์ตว่างแทน
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกล็อกแบบละเอียดไปยัง stdout/stderr
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะล็อกแบ็กเอนด์ CLI ในคอนโซล (เปิดใช้งาน stdout/stderr ด้วย)
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  รูปแบบล็อก WebSocket: `auto`, `full`, `compact`
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบลงใน JSONL
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ JSONL ของสตรีมดิบ
</ParamField>

`--claude-cli-logs` เป็นนามแฝงที่เลิกใช้แล้วสำหรับ `--cli-backend-logs`

สำหรับ `--bind custom` ให้ตั้ง `gateway.customBindHost` เป็นที่อยู่ IPv4 ที่อยู่ใดก็ตามนอกเหนือจาก `127.0.0.1` หรือ `0.0.0.0` ต้องมี `127.0.0.1` บนพอร์ตเดียวกันสำหรับไคลเอนต์ในโฮสต์เดียวกันด้วย การเริ่มต้นจะล้มเหลวหากตัวรับฟังตัวใดตัวหนึ่งไม่สามารถผูกได้ ไวลด์การ์ด `0.0.0.0` จะไม่เพิ่มนามแฝงที่จำเป็นแยกต่างหาก การตั้งค่าโฮสต์ของตนเองที่รองรับเฉพาะ IPv6 ต้องมี sidecar IPv4 หรือพร็อกซีอยู่ด้านหน้า Gateway

## เริ่ม Gateway ใหม่

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` จะขอให้ Gateway ที่กำลังทำงานตรวจสอบงานที่ใช้งานอยู่ล่วงหน้า และกำหนดการเริ่มใหม่แบบรวมหนึ่งครั้งหลังงานเหล่านั้นเสร็จสิ้น การรอจำกัดไว้ที่ 5 นาที เมื่อหมดเวลาที่กำหนด ระบบจะบังคับเริ่มใหม่ `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait`

`--skip-deferral` จะข้ามเกตการเลื่อนเวลาตามงานที่ใช้งานอยู่สำหรับการเริ่มใหม่แบบปลอดภัย ทำให้ Gateway เริ่มใหม่ทันทีแม้มีรายงานตัวขัดขวาง ต้องใช้ร่วมกับ `--safe` โปรดใช้เมื่อการเลื่อนเวลาค้างอยู่กับงานที่ทำงานไม่หยุด

`--wait <duration>` จะแทนที่ช่วงเวลาที่อนุญาตให้ระบายงานสำหรับการเริ่มใหม่แบบธรรมดา (ไม่ใช่แบบปลอดภัย) รองรับค่ามิลลิวินาทีเปล่าหรือส่วนต่อท้ายหน่วย `ms`, `s`, `m`, `h`, `d` (เช่น `30s`, `5m`, `1h30m`) ส่วน `--wait 0` จะรอไม่มีกำหนด ใช้ร่วมกับ `--force` หรือ `--safe` ไม่ได้

`--force` จะข้ามการระบายงานที่ใช้งานอยู่และเริ่มใหม่ทันที `restart` แบบธรรมดา (ไม่มีแฟล็ก) จะคงลักษณะการเริ่มใหม่ของตัวจัดการบริการที่มีอยู่

<Warning>
`--password` แบบอินไลน์อาจปรากฏในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, ตัวแปรสภาพแวดล้อม หรือ `gateway.auth.password` ที่อ้างอิงผ่าน SecretRef
</Warning>

### ตัวควบคุมภายนอก

ตั้งค่า `OPENCLAW_SUPERVISOR_MODE=external` เฉพาะเมื่อมีตัวจัดการโปรเซสอื่นเป็นเจ้าของวงจรชีวิตของ Gateway ในโหมดนี้:

- `openclaw gateway restart` จะคงลักษณะการทำงานแบบปลอดภัย แบบบังคับ และแบบรอตามเวลาที่กำหนดไว้ โดยกำหนดเป้าหมายไปยัง Gateway ที่กำลังทำงานและผ่านการยืนยัน แทน launchd, systemd หรือ Task Scheduler
- ระบบจะปฏิเสธการติดตั้ง เริ่ม หยุด และถอนการติดตั้งบริการแบบเนทีฟ พร้อมแนะนำให้ใช้ตัวควบคุมภายนอก
- ระบบจะปฏิเสธการอัปเดตตัวเองของ OpenClaw เพื่อให้ตัวควบคุมสามารถหยุด Gateway แทนที่และจัดเตรียมรันไทม์ให้เสร็จสมบูรณ์ แล้วเริ่มใหม่ได้อย่างปลอดภัย
- การเริ่มใหม่ด้วยโปรเซสใหม่จะเขียนข้อมูลส่งต่อ SQLite ที่มีขอบเขตก่อนออกอย่างเรียบร้อย หากการบันทึกถาวรล้มเหลว Gateway จะย้อนกลับไปใช้การเริ่มใหม่ภายในโปรเซสแทนการออกโดยไม่มีข้อมูลส่งต่อที่นำไปใช้ได้

`OPENCLAW_SERVICE_REPAIR_POLICY=external` ยังคงเป็นนโยบายซ่อมแซมของ Doctor ที่แยกต่างหาก โดยไม่ได้ประกาศความเป็นเจ้าของรันไทม์ ตัวควบคุมที่ต้องการลักษณะการทำงานทั้งสองแบบควรตั้งค่าตัวแปรทั้งคู่

ตัวควบคุมภายนอกสามารถเจรจาและใช้ข้อมูลส่งต่อการเริ่มใหม่ผ่านสัญญาสำหรับเครื่องที่ซ่อนอยู่:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

โปรโตคอลเวอร์ชัน `1` รองรับการดำเนินการ `consume` การใช้ข้อมูลจะตรวจสอบ PID ที่คาดไว้และฟิลด์ข้อมูลส่งต่อที่มีขอบเขตภายในธุรกรรม SQLite แบบทันทีหนึ่งรายการ ข้อมูลส่งต่อที่ยอมรับแล้วจะถูกลบก่อนส่งคืนผลสำเร็จ ดังนั้นผู้ใช้ข้อมูลพร้อมกันหรือผู้ใช้ซ้ำจึงไม่สามารถยอมรับข้อมูลเดียวกันได้ทั้งคู่ ระบบจะเก็บข้อมูลที่ PID ไม่ตรงกันไว้ให้เจ้าของที่ตรงกัน ส่วนแถวที่ไม่มี หมดอายุ หรือไม่ถูกต้องจะไม่อนุญาตให้เริ่มใหม่

คำขอสำหรับเครื่องที่ถูกต้องจะส่งคืน JSON ด้วยรหัสออก `0` รวมถึงผลลัพธ์ที่ไม่ใช่การเริ่มใหม่ อาร์กิวเมนต์ที่ไม่ถูกต้องจะส่งคืน `reason: "invalid-expected-pid"` พร้อมรหัสออก `2` ส่วนความล้มเหลวของที่เก็บสถานะจะส่งคืน `reason: "store-unavailable"` พร้อมรหัสออก `1` ตัวควบคุมควรตรวจสอบ `capabilities` บนรันไทม์หรือตัวเรียกใช้ที่แน่นอนซึ่งจะใช้งาน แทนการอนุมานการรองรับจากสตริงเวอร์ชัน OpenClaw หรืออ่านสคีมา SQLite ส่วนตัวโดยตรง

### การทำโปรไฟล์ Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` จะบันทึกเวลาของแต่ละระยะระหว่างการเริ่มต้น รวมถึงความล่าช้า `eventLoopMax` รายระยะและเวลาของตารางค้นหา Plugin (ดัชนีที่ติดตั้ง, รีจิสทรีไฟล์กำกับ, การวางแผนการเริ่มต้น, งานแผนผังเจ้าของ)
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` จะบันทึกบรรทัด `restart trace:` ที่มีขอบเขตเฉพาะการเริ่มใหม่ ได้แก่ การจัดการสัญญาณ การระบายงานที่ใช้งานอยู่ ระยะการปิดระบบ การเริ่มครั้งถัดไป เวลาที่พร้อมใช้งาน และเมตริกหน่วยความจำ
- `OPENCLAW_DIAGNOSTICS=timeline` ร่วมกับ `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` จะเขียนไทม์ไลน์การวินิจฉัยการเริ่มต้นแบบ JSONL ด้วยความพยายามสูงสุดสำหรับชุดทดสอบ QA ภายนอก (เทียบเท่าการกำหนดค่า `diagnostics.flags: ["timeline"]` แต่พาธยังคงกำหนดได้ผ่านตัวแปรสภาพแวดล้อมเท่านั้น) เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event loop
- `pnpm build` แล้วตามด้วย `pnpm test:startup:gateway -- --runs 5 --warmup 1` จะวัดประสิทธิภาพการเริ่มต้น Gateway เทียบกับจุดเข้า CLI ที่สร้างแล้ว ได้แก่ เอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, เวลาการติดตามการเริ่มต้น, ความล่าช้าของ event loop และเวลาของตารางค้นหา Plugin
- `pnpm build` แล้วตามด้วย `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` จะวัดประสิทธิภาพการเริ่มใหม่ภายในโปรเซสบน macOS หรือ Linux (ไม่รองรับบน Windows และการเริ่มใหม่ต้องใช้ `SIGUSR1`) โดยใช้ `SIGUSR1` เปิดใช้งานการติดตามทั้งสองแบบในโปรเซสลูก และบันทึก `/healthz` ถัดไป, `/readyz` ถัดไป, เวลาหยุดทำงาน, เวลาที่พร้อมใช้งาน, CPU, RSS และเมตริกการติดตามการเริ่มใหม่
- `/healthz` คือสถานะการทำงาน ส่วน `/readyz` คือความพร้อมใช้งานจริง ให้ถือว่าบรรทัดการติดตามและผลการวัดประสิทธิภาพเป็นสัญญาณระบุเจ้าของ ไม่ใช่ข้อสรุปด้านประสิทธิภาพที่สมบูรณ์จากช่วงหรือตัวอย่างเพียงหนึ่งรายการ

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มีการจัดรูปแบบ/ตัวหมุน)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI โดยคงเค้าโครงสำหรับมนุษย์ไว้

  </Tab>
  <Tab title="ตัวเลือกร่วม">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: โทเค็น Gateway
    - `--password <password>`: รหัสผ่าน Gateway
    - `--timeout <ms>`: เวลาหมดเวลา/งบเวลา (ค่าเริ่มต้นแตกต่างกันตามคำสั่ง โปรดดูแต่ละคำสั่งด้านล่าง)
    - `--expect-final`: รอการตอบกลับ "สุดท้าย" (การเรียกของเอเจนต์)

  </Tab>
</Tabs>

<Note>
เมื่อตั้งค่า `--url` แล้ว CLI จะไม่ย้อนกลับไปใช้ข้อมูลรับรองจากการกำหนดค่าหรือตัวแปรสภาพแวดล้อม โปรดส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุไว้อย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` เป็นโพรบตรวจสอบความพร้อมทำงาน: จะตอบกลับทันทีที่เซิร์ฟเวอร์สามารถตอบ HTTP ได้ ส่วน `/readyz` เข้มงวดกว่าและยังคงแสดงสถานะสีแดงขณะที่ sidecar ของ plugin ช่องทาง หรือ hook ที่กำหนดค่าไว้ระหว่างการเริ่มต้นระบบยังปรับเข้าสู่ภาวะปกติไม่เสร็จ การตอบกลับ `/readyz` แบบละเอียดจากภายในเครื่องหรือที่ผ่านการยืนยันตัวตนจะมีบล็อกการวินิจฉัย `eventLoop` (ความล่าช้า การใช้งาน อัตราส่วนคอร์ CPU และแฟล็ก `degraded`)

<ParamField path="--port <port>" type="number">
  กำหนดเป้าหมายเป็น Gateway แบบลูปแบ็กภายในเครื่องบนพอร์ตนี้ แทนที่ `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียกครั้งนี้
</ParamField>

### `gateway usage-cost`

ดึงข้อมูลสรุปค่าใช้จ่ายการใช้งานจากบันทึกเซสชัน

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
  จำกัดขอบเขตข้อมูลสรุปไว้ที่ ID ของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมข้อมูลจากเอเจนต์ที่กำหนดค่าไว้ทั้งหมด ใช้ร่วมกับ `--agent` ไม่ได้
</ParamField>

### `gateway stability`

ดึงข้อมูลล่าสุดจากตัวบันทึกเสถียรภาพเพื่อการวินิจฉัยของ Gateway ที่กำลังทำงาน

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
  กรองตามประเภทเหตุการณ์วินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับการวินิจฉัยที่ระบุ
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่านบันเดิลเสถียรภาพที่บันทึกไว้อย่างถาวรแทนการเรียก Gateway ที่กำลังทำงาน `--bundle latest` (หรือระบุเพียง `--bundle`) จะเลือกบันเดิลใหม่ล่าสุดภายใต้ไดเรกทอรีสถานะ หรือจะส่งพาธ JSON ของบันเดิลโดยตรงก็ได้
</ParamField>
<ParamField path="--export" type="boolean">
  เขียนไฟล์ zip ข้อมูลวินิจฉัยสำหรับฝ่ายสนับสนุนที่แชร์ได้ แทนการแสดงรายละเอียดเสถียรภาพ
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและลักษณะการทำงานของบันเดิล">
    - ระเบียนจะเก็บข้อมูลเมตาด้านการดำเนินงาน ได้แก่ ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน ID การอนุมัติ ชื่อช่องทาง/plugin และข้อมูลสรุปเซสชันที่ปกปิดแล้ว โดยไม่รวมข้อความแชต เนื้อหา Webhook เอาต์พุตจากเครื่องมือ เนื้อหาคำขอ/การตอบกลับดิบ โทเค็น คุกกี้ ค่าความลับ ชื่อโฮสต์ และ ID เซสชันดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งานตัวบันทึกทั้งหมด
    - การออกจาก Gateway เนื่องจากข้อผิดพลาดร้ายแรง การหมดเวลาระหว่างปิดระบบ และความล้มเหลวในการเริ่มต้นหลังรีสตาร์ต จะเขียนสแนปช็อตการวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อตัวบันทึกมีเหตุการณ์ ตรวจสอบบันเดิลใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุตบันเดิลด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียนไฟล์ zip ข้อมูลวินิจฉัยภายในเครื่องซึ่งออกแบบมาสำหรับรายงานข้อบกพร่อง สำหรับโมเดลความเป็นส่วนตัวและเนื้อหาบันเดิล โปรดดู [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธไฟล์ zip เอาต์พุต ค่าเริ่มต้นเป็นไฟล์ส่งออกสำหรับฝ่ายสนับสนุนภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ผ่านการล้างข้อมูลแล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์บันทึกสูงสุดที่จะตรวจสอบ
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
  ข้ามการค้นหาบันเดิลเสถียรภาพที่บันทึกไว้อย่างถาวร
</ParamField>
<ParamField path="--json" type="boolean">
  แสดงพาธที่เขียน ขนาด และรายการกำกับในรูปแบบ JSON
</ParamField>

ไฟล์ส่งออกจะรวม: `manifest.json` (รายการไฟล์), `summary.md` (ข้อมูลสรุป Markdown), `diagnostics.json` (ข้อมูลสรุประดับบนสุดของการกำหนดค่า/บันทึก/การค้นพบ/เสถียรภาพ/สถานะ/สถานภาพ), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` และ `stability/latest.json` เมื่อมีบันเดิลอยู่

ไฟล์นี้ออกแบบมาเพื่อการแชร์ โดยเก็บรายละเอียดด้านการดำเนินงานที่เป็นประโยชน์ต่อการแก้ไขข้อบกพร่อง ได้แก่ ฟิลด์บันทึกที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่กำหนดค่าไว้ พอร์ต ID ของ plugin/ผู้ให้บริการ การตั้งค่าคุณสมบัติที่ไม่เป็นความลับ และข้อความบันทึกด้านการดำเนินงานที่ปกปิดแล้ว พร้อมทั้งละเว้นหรือปกปิดข้อความแชต เนื้อหา Webhook เอาต์พุตจากเครื่องมือ ข้อมูลประจำตัว คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความพรอมต์/คำสั่ง ชื่อโฮสต์ และค่าความลับ เมื่อข้อความบันทึกดูเหมือนเป็นข้อความเพย์โหลดจากผู้ใช้/แชต/เครื่องมือ (เช่น "ผู้ใช้กล่าวว่า", "ข้อความแชต", "เอาต์พุตจากเครื่องมือ", "เนื้อหา Webhook") ไฟล์ส่งออกจะเก็บไว้เพียงข้อเท็จจริงว่ามีการละเว้นข้อความ พร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมโพรบการเชื่อมต่อ/การยืนยันตัวตนที่เลือกใช้ได้

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายโพรบที่ระบุอย่างชัดเจน ระบบยังคงโพรบรีโมตที่กำหนดค่าไว้และ localhost
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
  ข้ามโพรบการเชื่อมต่อ (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับโพรบการเชื่อมต่อเป็นโพรบการอ่าน และออกด้วยรหัสที่ไม่ใช่ศูนย์หากล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้ว่าการกำหนดค่า CLI ภายในเครื่องจะหายไปหรือไม่ถูกต้อง
    - เอาต์พุตเริ่มต้นยืนยันสถานะบริการ การเชื่อมต่อ WebSocket และความสามารถในการยืนยันตัวตนที่มองเห็นได้ขณะจับมือเชื่อมต่อ ไม่ใช่การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - โพรบจะไม่เปลี่ยนแปลงข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก โดยจะใช้โทเค็นอุปกรณ์ที่แคชไว้อยู่แล้วเมื่อมี แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - แก้ค่า SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้ยืนยันตัวตนของโพรบเมื่อทำได้ หาก SecretRef ที่จำเป็นแก้ค่าไม่ได้ `--json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของโพรบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจนหรือแก้ไขแหล่งข้อมูลความลับ คำเตือนการยืนยันตัวตนที่แก้ค่าไม่ได้จะถูกระงับเมื่อโพรบสำเร็จ
    - เอาต์พุต JSON จะมี `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่านี้ โดย `--require-rpc` สามารถใช้เพย์โหลด RPC ของ `status.runtimeVersion` เป็นทางเลือกได้ หากโพรบการจับมือเชื่อมต่อไม่สามารถให้ข้อมูลเมตาเวอร์ชัน
    - ใช้ `--require-rpc` ในสคริปต์/ระบบอัตโนมัติ เมื่อบริการที่รับฟังอยู่เพียงอย่างเดียวยังไม่เพียงพอ และต้องการให้ RPC ขอบเขตการอ่านมีสถานภาพดีด้วย
    - `--deep` จะสแกนหาการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่มีลักษณะคล้าย Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูล (โดยทั่วไปให้เรียกใช้ Gateway หนึ่งรายการต่อเครื่อง) และรายงานการส่งมอบการรีสตาร์ตล่าสุดของตัวควบคุมเมื่อเกี่ยวข้อง
    - `--deep` ยังเรียกใช้การตรวจสอบความถูกต้องของการกำหนดค่าในโหมดที่รับรู้ plugin (`pluginValidation: "full"`) และแสดงคำเตือนรายการกำกับของ plugin (เช่น ข้อมูลเมตาการกำหนดค่าช่องทางที่ขาดหายไป) ส่วน `gateway status` เริ่มต้นจะคงเส้นทางอ่านอย่างเดียวที่รวดเร็วซึ่งข้ามการตรวจสอบ plugin
    - เอาต์พุตสำหรับมนุษย์จะแสดงพาธไฟล์บันทึกที่แก้ค่าแล้ว พร้อมพาธ/ความถูกต้องของการกำหนดค่าฝั่ง CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ
    - เอาต์พุตสำหรับมนุษย์จะมี `Gateway heap:` พร้อมขีดจำกัดที่ใช้และวิธีคำนวณแบบปรับเปลี่ยนได้ ส่วนเอาต์พุต JSON จะแสดงรายงานเดียวกันเป็น `service.gatewayHeap`

  </Accordion>
  <Accordion title="การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนใน Linux systemd">
    - การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนของบริการจะอ่านทั้ง `Environment=` และ `EnvironmentFile=` จากยูนิต (รวมถึง `%h` พาธที่อยู่ในเครื่องหมายอัญประกาศ ไฟล์หลายรายการ และไฟล์ `-` ที่เลือกใช้ได้)
    - แก้ค่า SecretRef ของ `gateway.auth.token` โดยใช้สภาพแวดล้อมรันไทม์ที่รวมกัน (สภาพแวดล้อมคำสั่งบริการก่อน แล้วจึงใช้สภาพแวดล้อมกระบวนการเป็นทางเลือก)
    - การตรวจสอบความคลาดเคลื่อนของโทเค็นจะข้ามการแก้ค่าโทเค็นจากการกำหนดค่า เมื่อการยืนยันตัวตนด้วยโทเค็นไม่ได้ทำงานจริง (`gateway.auth.mode` ถูกตั้งค่าอย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่าโหมดในกรณีที่รหัสผ่านสามารถมีผลเหนือกว่าและไม่มีตัวเลือกโทเค็นใดมีผลเหนือกว่าได้)

  </Accordion>
</AccordionGroup>

### `gateway probe`

คำสั่ง "ดีบักทุกอย่าง" โดยจะโพรบสิ่งต่อไปนี้เสมอ:

- Gateway รีโมตที่กำหนดค่าไว้ (หากตั้งค่าไว้) และ
- localhost (ลูปแบ็ก) **แม้ว่าจะกำหนดค่ารีโมตไว้ก็ตาม**

การส่ง `--url` จะเพิ่มเป้าหมายที่ระบุอย่างชัดเจนไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายเป้าหมายเป็น `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` และ `Local loopback`

<Note>
หากเข้าถึงเป้าหมายโพรบได้หลายรายการ ระบบจะแสดงทั้งหมด ทันเนล SSH, URL TLS/พร็อกซี และ URL รีโมตที่กำหนดค่าไว้สามารถชี้ไปยัง Gateway เดียวกันได้ แม้จะใช้พอร์ตการรับส่งข้อมูลต่างกัน โดย `multiple_gateways` สงวนไว้สำหรับ Gateway ที่เข้าถึงได้ซึ่งแยกจากกันหรือมีข้อมูลประจำตัวกำกวม รองรับการเรียกใช้ Gateway หลายรายการสำหรับโปรไฟล์ที่แยกจากกัน (เช่น บอตกู้ระบบ) แต่การติดตั้งส่วนใหญ่จะเรียกใช้ Gateway เพียงรายการเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายโพรบลูปแบ็กภายในเครื่องและพอร์ตรีโมตของทันเนล SSH หากไม่มี `--url` ตัวเลือกนี้จะเลือกเฉพาะเป้าหมายลูปแบ็กภายในเครื่อง แทน URL สภาพแวดล้อมของ Gateway พอร์ตสภาพแวดล้อม หรือเป้าหมายรีโมตที่กำหนดค่าไว้
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่ามีเป้าหมายอย่างน้อยหนึ่งรายการยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบสามารถยืนยันได้เกี่ยวกับการยืนยันตัวตน โดยแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด โดยรายงานเป็นความสามารถในการเข้าถึงที่ **ลดระดับ** ไม่ใช่ความล้มเหลวโดยสมบูรณ์
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า WebSocket เชื่อมต่อแล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว ซึ่งถือว่า **ลดระดับ** เช่นกัน ไม่ใช่ไม่สามารถเข้าถึงได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้อยู่แล้ว แต่ไม่สร้างข้อมูลประจำตัวอุปกรณ์หรือสถานะการจับคู่สำหรับครั้งแรก
    - รหัสออกจะไม่ใช่ศูนย์เฉพาะเมื่อไม่สามารถเข้าถึงเป้าหมายที่โพรบทั้งหมดได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: เข้าถึงเป้าหมายได้อย่างน้อยหนึ่งรายการ
    - `degraded`: มีเป้าหมายอย่างน้อยหนึ่งรายการยอมรับการเชื่อมต่อ แต่ดำเนินการวินิจฉัย RPC แบบรายละเอียดทั้งหมดไม่เสร็จสมบูรณ์
    - `capability`: ความสามารถที่ดีที่สุดที่พบในบรรดาเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดที่จะถือเป็นเป้าหมายหลักที่ใช้งานอยู่ โดยเรียงตามลำดับดังนี้: URL ที่ระบุไว้อย่างชัดเจน, ทันเนล SSH, รีโมตที่กำหนดค่าไว้, ลูปแบ็กภายในเครื่อง
    - `warnings[]`: ระเบียนคำเตือนที่รวบรวมโดยพยายามให้ได้มากที่สุด พร้อม `code`, `message` และ `targetIds` ซึ่งเป็นตัวเลือก
    - `network`: คำแนะนำ URL สำหรับลูปแบ็กภายในเครื่อง/tailnet ที่ได้มาจากการกำหนดค่าปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` / `discovery.count`: งบประมาณการค้นหา/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบการตรวจสอบนี้

    ต่อเป้าหมาย (`targets[].connect`): `ok` (ความสามารถในการเข้าถึง + การจำแนกสถานะที่ลดระดับ), `rpcOk` (RPC แบบรายละเอียดทั้งหมดสำเร็จ), `scopeLimited` (RPC รายละเอียดล้มเหลวเนื่องจากไม่มีขอบเขตผู้ดำเนินการ)

    ต่อเป้าหมาย (`targets[].auth`): รายงาน `role` และ `scopes` ใน `hello-ok` เมื่อมีข้อมูล พร้อมการจำแนก `capability` ที่แสดงออกมา

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่าทันเนล SSH ล้มเหลว คำสั่งจึงเปลี่ยนไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: สามารถเข้าถึง Gateway ที่มีข้อมูลระบุตัวตนแตกต่างกัน หรือ OpenClaw ไม่สามารถพิสูจน์ได้ว่าเป้าหมายที่เข้าถึงได้นั้นเป็น Gateway เดียวกัน ทันเนล SSH, URL พร็อกซี หรือ URL รีโมตที่กำหนดค่าไว้ซึ่งชี้ไปยัง Gateway เดียวกันจะไม่ทำให้เกิดคำเตือนนี้
    - `auth_secretref_unresolved`: ไม่สามารถแก้ไข SecretRef สำหรับการตรวจสอบสิทธิ์ที่กำหนดค่าไว้ของเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: เชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบการอ่านถูกจำกัดเนื่องจากไม่มี `operator.read`
    - `local_tls_runtime_unavailable`: เปิดใช้งาน TLS ของ Gateway ภายในเครื่อง แต่ OpenClaw ไม่สามารถโหลดลายนิ้วมือใบรับรองภายในเครื่องได้

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (ทำงานเทียบเท่าแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้สามารถเข้าถึง Gateway รีโมตที่รับการเชื่อมต่อเฉพาะลูปแบ็กได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (พอร์ตมีค่าเริ่มต้นเป็น `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ข้อมูลระบุตัวตน
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ Gateway รายการแรกที่ค้นพบเป็นเป้าหมาย SSH จากเอนด์พอยต์การค้นหาที่แก้ไขแล้ว (`local.` รวมถึงโดเมนเครือข่ายบริเวณกว้างที่กำหนดค่าไว้ หากมี) ระบบจะไม่สนใจคำแนะนำที่มีเฉพาะ TXT
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
  งบประมาณเวลาหมด
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC รูปแบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อนเพย์โหลดสุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุต JSON ที่เครื่องอ่านได้
</ParamField>

<Note>
`--params` ต้องเป็น JSON ที่ถูกต้อง และแต่ละเมธอดจะตรวจสอบรูปแบบพารามิเตอร์ของตนเอง (ฟิลด์ส่วนเกินหรือฟิลด์ที่ตั้งชื่อผิดจะถูกปฏิเสธ)
</Note>

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ติดตั้งด้วยแรปเปอร์

ใช้ `--wrapper` เมื่อบริการที่มีการจัดการต้องเริ่มต้นผ่านไฟล์ปฏิบัติการอื่น เช่น ชิมของตัวจัดการข้อมูลลับหรือตัวช่วยสำหรับเรียกใช้ในนามผู้ใช้อื่น แรปเปอร์จะรับอาร์กิวเมนต์ปกติของ Gateway และมีหน้าที่เรียกใช้ `openclaw` หรือ Node ด้วยอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

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

นอกจากนี้ยังสามารถตั้งค่าแรปเปอร์ผ่านสภาพแวดล้อมได้ `gateway install` จะตรวจสอบว่าพาธดังกล่าวเป็นไฟล์ปฏิบัติการ เขียนแรปเปอร์ลงใน `ProgramArguments` ของบริการ และเก็บ `OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการบังคับติดตั้งใหม่ การอัปเดต และการซ่อมแซมโดย doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการนำ wrapper ที่บันทึกไว้ออก ให้ล้าง `OPENCLAW_WRAPPER` ขณะติดตั้งใหม่:

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
    - `gateway start` เป็นแบบ idempotent: เมื่อบริการที่มีการจัดการกำลังทำงานอยู่แล้ว ระบบจะรายงานกระบวนการที่กำลังทำงานและไม่แก้ไขใด ๆ ส่วนบริการที่โหลดไว้แต่หยุดทำงานอยู่จะเริ่มทำงานเช่นเดิม
    - ใช้ `gateway restart` เพื่อเริ่มบริการที่มีการจัดการใหม่ อย่าเรียก `gateway stop` ต่อด้วย `gateway start` เพื่อใช้แทนการเริ่มใหม่
    - ในเชลล์แบบไม่โต้ตอบ `gateway stop` ต้องใช้ `--force` ส่วนเทอร์มินัลแบบโต้ตอบยังคงทำงานโดยไม่แสดงพรอมต์เช่นเดิม สำหรับระบบอัตโนมัติและการทดสอบ ควรใช้ `gateway run --dev` หรือ `--profile` ที่แยกออกมาต่างหากพร้อมพอร์ตที่ว่าง
    - บน macOS โดยค่าเริ่มต้น `gateway stop` จะใช้ `launchctl bootout` ซึ่งนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่บันทึกสถานะปิดใช้งานไว้ การกู้คืนอัตโนมัติของ KeepAlive จึงยังคงทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` สามารถเปิดใช้งานอีกครั้งได้อย่างเรียบร้อยโดยไม่ต้องใช้ `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เริ่มทำงานอีกจนกว่าจะมีการเรียก `gateway start` อย่างชัดเจนครั้งถัดไป ใช้ตัวเลือกนี้เมื่อต้องการให้การหยุดด้วยตนเองยังคงมีผลหลังรีบูต
    - การเปลี่ยนแปลงวงจรชีวิตของ Gateway จะเพิ่มระเบียนการตรวจสอบแบบคีย์-ค่าตามความพยายามที่ดีที่สุดลงใน `<state-dir>/logs/gateway-restart.log` ซึ่งรวมถึงการเริ่ม หยุด และเริ่มใหม่ผ่าน CLI คำขอเริ่มใหม่อย่างปลอดภัย การเริ่มใหม่โดย supervisor และการส่งมอบงานแบบแยกกระบวนการ
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การกำหนดขนาดฮีปของ Gateway ที่มีการจัดการ">
    - `gateway install` เขียนค่า `NODE_OPTIONS` ที่ใช้กับฮีปเท่านั้นสำหรับบริการ Gateway ที่มีการจัดการ โดยตั้งเป้าไว้ที่ 50% ของหน่วยความจำที่ถูกจำกัดเมื่อ Node รายงานขีดจำกัดของคอนเทนเนอร์หรือบริการ มิฉะนั้นจะใช้ 50% ของหน่วยความจำจริง
    - ช่วงเป้าหมายตามค่าปกติคือ 2048–8192 MiB พร้อมขีดจำกัดเพิ่มเติมที่สงวนพื้นที่สำหรับหน่วยความจำเนทีฟไว้ 75% บนโฮสต์ขนาดเล็ก ขีดจำกัดพื้นที่สำรองนี้อาจทำให้ขีดจำกัดที่นำไปใช้ต่ำกว่าค่าขั้นต่ำตามค่าปกติที่ 2048 MiB
    - ค่า `--max-old-space-size` ที่ระบุไว้อย่างชัดเจนและถูกต้องซึ่งจัดเก็บอยู่ในบริการที่ติดตั้งแล้วจะถูกเก็บรักษาไว้ระหว่างการบังคับติดตั้งใหม่และการซ่อมแซมโดย doctor แฟล็ก `NODE_OPTIONS` อื่น ๆ จะไม่ถูกนำไปใช้กับบริการที่มีการจัดการ
    - ค่า `NODE_OPTIONS` จากสภาพแวดล้อมเชลล์จะไม่แทนที่นโยบายนี้ ใช้ `gateway status` หรือ `doctor` เพื่อตรวจสอบค่าที่ติดตั้งไว้ และเรียก `openclaw gateway install --force` เพื่อสร้างเมตาดาต้าบริการรุ่นเก่าที่ไม่มีการตั้งค่าฮีปที่มีการจัดการขึ้นใหม่
    - นโยบายนี้ใช้เฉพาะกับบริการ Gateway ที่มีการจัดการเท่านั้น `gateway run` ที่ทำงานเบื้องหน้า บริการ Node และหน่วย supervisor ที่เขียนขึ้นเองจะยังคงใช้การกำหนดค่ารันไทม์ของตนเอง

  </Accordion>
  <Accordion title="การตรวจสอบสิทธิ์และ SecretRef ขณะติดตั้ง">
    - เมื่อการตรวจสอบสิทธิ์ด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` ได้รับการจัดการด้วย SecretRef คำสั่ง `gateway install` จะตรวจสอบว่าสามารถแก้ไข SecretRef ได้ แต่จะไม่บันทึกโทเค็นที่แก้ไขแล้วลงในเมตาดาต้าสภาพแวดล้อมของบริการ
    - หากการตรวจสอบสิทธิ์ด้วยโทเค็นต้องใช้โทเค็น แต่ไม่สามารถแก้ไข SecretRef ของโทเค็นที่กำหนดค่าไว้ได้ การติดตั้งจะล้มเหลวแบบปิดแทนที่จะบันทึกข้อความธรรมดาสำรอง
    - สำหรับการตรวจสอบสิทธิ์ด้วยรหัสผ่านบน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบอินไลน์
    - ในโหมดตรวจสอบสิทธิ์ที่อนุมาน ค่า `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดด้านโทเค็นในการติดตั้ง เมื่อติดตั้งบริการที่มีการจัดการ ให้ใช้การกำหนดค่าแบบถาวร (`gateway.auth.password` หรือ `env` ในการกำหนดค่า)
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกระงับจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` จะสแกนหาบีคอนของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour แบบเครือข่ายบริเวณกว้าง): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS พร้อมเซิร์ฟเวอร์ DNS โปรดดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้งานการค้นหาผ่าน Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศบีคอน

คำใบ้ TXT ในทุกบีคอน: `role` (คำใบ้บทบาทของ Gateway), `transport` (คำใบ้การรับส่งข้อมูล เช่น `gateway`), `gatewayPort` (พอร์ต WebSocket ซึ่งโดยทั่วไปคือ `18789`), `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี), `gatewayTls` / `gatewayTlsSha256` (เปิดใช้งาน TLS และลายนิ้วมือใบรับรอง) ระบบจะเผยแพร่ `sshPort` และ `cliPath` เฉพาะในโหมดการค้นหาแบบเต็ม (`discovery.mdns.mode: "full"`; ค่าเริ่มต้นคือ `"minimal"` ซึ่งจะละเว้นค่าเหล่านี้ โดยไคลเอนต์จะใช้พอร์ต `22` เป็นค่าเริ่มต้นสำหรับเป้าหมาย SSH)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  ระยะหมดเวลาต่อคำสั่ง (เรียกดู/แก้ไข)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดใช้งานการจัดรูปแบบ/ตัวบ่งชี้การโหลดด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- สแกน `local.` รวมถึงโดเมนเครือข่ายบริเวณกว้างที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ไขแล้ว ไม่ได้มาจากคำใบ้เฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- `discovery.mdns.mode` ควบคุมการเผยแพร่ `sshPort`/`cliPath` ทั้งบน mDNS ของ `local.` และ DNS-SD แบบเครือข่ายบริเวณกว้าง (ดูด้านบน)

</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
