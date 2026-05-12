---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการรันครั้งแรก
    - การเลือกการตรวจสอบสิทธิ์และการสมัครสมาชิกกับผู้ให้บริการ
    - ไม่สามารถเข้าถึง docs.openclaw.ai, ไม่สามารถเปิดแดชบอร์ดได้, การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการใช้งานครั้งแรก — การติดตั้ง การเริ่มใช้งาน การยืนยันตัวตน การสมัครสมาชิก ความล้มเหลวเบื้องต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าเมื่อใช้งานครั้งแรก'
x-i18n:
    generated_at: "2026-05-12T00:59:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  คู่มือเริ่มต้นอย่างรวดเร็วและถาม-ตอบสำหรับการใช้งานครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การยืนยันตัวตน เซสชัน
  และการแก้ไขปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการใช้งานครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดขัด วิธีที่เร็วที่สุดในการแก้ปัญหา">
    ใช้เอเจนต์ AI แบบโลคัลที่สามารถ **เห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณี "ฉันติดขัด" ส่วนใหญ่เป็น **ปัญหาคอนฟิกหรือสภาพแวดล้อมในเครื่อง**
    ซึ่งผู้ช่วยระยะไกลไม่สามารถตรวจสอบได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่าน repo, รันคำสั่ง, ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่องของคุณ
    (PATH, services, permissions, auth files) ได้ มอบ **source checkout ทั้งหมด** ให้เครื่องมือเหล่านี้ผ่าน
    การติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    คำสั่งนี้จะติดตั้ง OpenClaw **จาก git checkout** ดังนั้นเอเจนต์จึงอ่านโค้ด + เอกสาร และ
    วิเคราะห์เวอร์ชันที่คุณกำลังรันอยู่ได้อย่างตรงจุด คุณสามารถสลับกลับไปใช้ stable ภายหลังได้เสมอ
    โดยรันตัวติดตั้งอีกครั้งโดยไม่มี `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับดูแล** การแก้ไข (ทีละขั้นตอน) แล้วจึงรันเฉพาะ
    คำสั่งที่จำเป็นเท่านั้น วิธีนี้ทำให้การเปลี่ยนแปลงเล็กและตรวจสอบย้อนหลังได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือวิธีแก้ไข โปรดเปิด GitHub issue หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์เอาต์พุตเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: ภาพรวมอย่างรวดเร็วของสุขภาพ gateway/agent + คอนฟิกพื้นฐาน
    - `openclaw models status`: ตรวจสอบการยืนยันตัวตนของผู้ให้บริการ + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบความถูกต้องและซ่อมแซมปัญหาคอนฟิก/สถานะที่พบบ่อย

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    ลูปดีบักอย่างรวดเร็ว: [60 วินาทีแรกถ้ามีบางอย่างเสีย](/th/help/faq#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามซ้ำ ๆ เหตุผลการข้ามหมายความว่าอย่างไร?">
    เหตุผลการข้าม heartbeat ที่พบบ่อย:

    - `quiet-hours`: อยู่นอกช่วงเวลา active-hours ที่กำหนดค่าไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงร่างว่าง/มีเฉพาะส่วนหัว
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดอยู่ แต่ยังไม่มีช่วงเวลาของงานใดถึงกำหนด
    - `alerts-disabled`: การมองเห็น heartbeat ทั้งหมดถูกปิดใช้งาน (`showOk`, `showAlerts`, และ `useIndicator` ปิดอยู่ทั้งหมด)

    ในโหมดงาน timestamp ครบกำหนดจะถูกเลื่อนต่อเมื่อการรัน heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายงานว่าเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [ระบบอัตโนมัติ](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo แนะนำให้รันจากซอร์สและใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ตัวช่วยตั้งค่าสามารถสร้าง UI assets โดยอัตโนมัติได้ด้วย หลัง onboarding โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

    จากซอร์ส (ผู้ร่วมพัฒนา/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    หากคุณยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw onboard`

  </Accordion>

  <Accordion title="ฉันจะเปิดแดชบอร์ดหลัง onboarding ได้อย่างไร?">
    ตัวช่วยตั้งค่าจะเปิดเบราว์เซอร์ของคุณด้วย URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็น) ทันทีหลัง onboarding และพิมพ์ลิงก์ไว้ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากแท็บไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ไว้บนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนแดชบอร์ดบน localhost เทียบกับรีโมตได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบถามหา shared-secret auth ให้วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้ใน Control UI settings
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนดค่า shared secret ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คง bind loopback ไว้, รัน `openclaw gateway --tailscale serve`, เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` identity headers จะผ่านการยืนยันตัวตนของ Control UI/WebSocket (ไม่ต้องวาง shared secret, ถือว่าโฮสต์ Gateway น่าเชื่อถือ); HTTP APIs ยังต้องใช้ shared-secret auth เว้นแต่คุณตั้งใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม Serve auth ที่ผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ failed-auth limiter จะบันทึก ดังนั้นการลองซ้ำผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่า password auth), เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันในการตั้งค่าแดชบอร์ด
    - **Reverse proxy ที่รับรู้ตัวตน**: วาง Gateway ไว้หลังพร็อกซีที่เชื่อถือได้, กำหนดค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของพร็อกซี พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` shared-secret auth ยังคงมีผลผ่าน tunnel ให้วางโทเค็นหรือรหัสผ่านที่กำหนดค่าไว้หากมีการถาม

    ดู [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับโหมด bind และรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ทำไมมีคอนฟิกอนุมัติ exec สองรายการสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองรายการควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อพรอมป์การอนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องทางนั้นทำหน้าที่เป็นไคลเอนต์อนุมัติแบบ native สำหรับการอนุมัติ exec

    นโยบาย exec ของโฮสต์ยังคงเป็นด่านอนุมัติจริง คอนฟิกแชตควบคุมเพียงว่าพรอมป์
    การอนุมัติจะปรากฏที่ใดและผู้คนสามารถตอบกลับอย่างไร

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางร่วม
    - หากช่องทาง native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย ตอนนี้ OpenClaw จะเปิดใช้การอนุมัติ native แบบ DM-first โดยอัตโนมัติเมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติ native UI แบบ native นั้นคือเส้นทางหลัก; เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า chat approvals ไม่พร้อมใช้งาน หรือ manual approval เป็นเส้นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อพรอมป์ต้องถูกส่งต่อไปยังแชตอื่นหรือห้องปฏิบัติการอย่างชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้พรอมป์การอนุมัติถูกโพสต์กลับไปยังห้อง/หัวข้อต้นทางอย่างชัดเจน
    - การอนุมัติ Plugin แยกออกไปอีกชั้น: ใช้ `/approve` ในแชตเดียวกันเป็นค่าเริ่มต้น, มีการส่งต่อ `approvals.plugin` เป็นทางเลือก และมีเพียงบางช่องทาง native ที่ยังคงมีการจัดการ plugin-approval-native เพิ่มเติม

    สรุปสั้น ๆ: forwarding ใช้สำหรับการกำหนดเส้นทาง ส่วนคอนฟิก native client ใช้สำหรับ UX เฉพาะช่องทางที่สมบูรณ์ขึ้น
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 core**, และพื้นที่ดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนบุคคล และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการพื้นที่เผื่อเพิ่มเติม (ล็อก, สื่อ, บริการอื่น ๆ), **แนะนำ 2GB** แต่ไม่ใช่
    ค่าขั้นต่ำแบบบังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับ
    หน้าจอ/กล้อง/canvas แบบโลคัล หรือการรันคำสั่ง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับสำหรับการติดตั้งบน Raspberry Pi ไหม?">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีส่วนที่ยังไม่ราบรื่น

    - ใช้ระบบปฏิบัติการแบบ **64-bit** และคง Node >= 22
    - เลือกใช้ **การติดตั้งแบบ hackable (git)** เพื่อให้คุณดูล็อกและอัปเดตได้เร็ว
    - เริ่มโดยไม่เปิด channels/skills แล้วค่อยเพิ่มทีละรายการ
    - หากเจอปัญหา binary แปลก ๆ โดยปกติจะเป็นปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ wake up my friend / onboarding ไม่ยอม hatch ต้องทำอย่างไร?">
    หน้าจอนั้นขึ้นอยู่กับว่า Gateway เข้าถึงได้และยืนยันตัวตนแล้วหรือไม่ TUI ยังส่ง
    "Wake up, my friend!" โดยอัตโนมัติเมื่อ hatch ครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นพร้อม **ไม่มีการตอบกลับ**
    และ token ยังคงอยู่ที่ 0 แปลว่าเอเจนต์ไม่เคยรัน

    1. รีสตาร์ต Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะ + การยืนยันตัวตน:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ให้ตรวจสอบว่า tunnel/การเชื่อมต่อ Tailscale เปิดอยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปยังเครื่องใหม่ (Mac mini) โดยไม่ต้องทำ onboarding ใหม่ได้ไหม?">
    ได้ คัดลอก **state directory** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    จะรักษาบอทของคุณให้ "เหมือนเดิมทุกประการ" (memory, session history, auth, และ channel
    state) ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ตบริการ Gateway

    วิธีนี้จะเก็บรักษา config, auth profiles, WhatsApp creds, sessions, และ memory หากคุณอยู่ใน
    remote mode โปรดจำว่าโฮสต์ gateway เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณไปยัง GitHub คุณกำลังสำรองข้อมูล
    **memory + bootstrap files** แต่ **ไม่ใช่** session history หรือ auth สิ่งเหล่านี้อยู่
    ภายใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้ายข้อมูล](/th/install/migrating), [สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์](/th/help/faq#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูว่ามีอะไรใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ตรวจสอบ changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ที่สุดอยู่ด้านบน หากส่วนบนสุดถูกทำเครื่องหมายว่า **Unreleased** ส่วนถัดไปที่มีวันที่
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการถูกจัดกลุ่มตาม **Highlights**, **Changes**, และ
    **Fixes** (รวมถึงส่วน docs/other เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้าถึง docs.openclaw.ai ไม่ได้ (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` อย่างไม่ถูกต้องผ่าน Xfinity
    Advanced Security ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ลง allowlist แล้วลองใหม่
    โปรดช่วยเราเลิกบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าถึงไซต์ไม่ได้ เอกสารถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** เป็น **npm dist-tags** ไม่ใช่สายโค้ดที่แยกกัน:

    - `latest` = stable
    - `beta` =บิลด์ระยะแรกสำหรับการทดสอบ

    โดยปกติ รีลีส stable จะเข้าสู่ **beta** ก่อน จากนั้นขั้นตอน
    โปรโมตอย่างชัดเจนจะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` ผู้ดูแลยังสามารถ
    เผยแพร่ตรงไปยัง `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังการโปรโมต

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev ให้ดู Accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta แตกต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังการโปรโมต)
    **Dev** คือหัวที่เคลื่อนไหวของ `main` (git); เมื่อเผยแพร่ จะใช้ npm dist-tag `dev`

    คำสั่งบรรทัดเดียว (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร?">
    มีสองตัวเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปยังสาขา `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งที่แก้ไขได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้ให้ repo ท้องถิ่นที่คุณแก้ไขได้ แล้วอัปเดตผ่าน git

    หากคุณต้องการ clone แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="การติดตั้งและ onboarding มักใช้เวลานานแค่ไหน?">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวนช่องทาง/โมเดลที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูปดีบักแบบเร็วใน [ฉันติดขัด](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะรับข้อเสนอแนะเพิ่มเติมได้อย่างไร?">
    เรียกใช้ตัวติดตั้งอีกครั้งด้วย **เอาต์พุตแบบละเอียด**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง Beta พร้อมเอาต์พุตแบบละเอียด:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งที่แก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    เทียบเท่าบน Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหาทั่วไปสองอย่างบน Windows:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นเรียกใช้ตัวติดตั้งอีกครั้ง

    **2) หลังติดตั้งแล้วไม่รู้จัก openclaw**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบพาธ:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นไปยัง user PATH ของคุณ (บน Windows ไม่ต้องมีส่วนต่อท้าย `\bin`; ในระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากต้องการการตั้งค่า Windows ที่ราบรื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบ native
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความจีนเพี้ยน - ควรทำอย่างไร?">
    โดยปกตินี่คือการไม่ตรงกันของ console code page บนเชลล์ Windows แบบ native

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติในโปรไฟล์เทอร์มินัลอื่น

    วิธีเลี่ยงแบบเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้นรีสตาร์ต Gateway แล้วลองคำสั่งอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยังทำซ้ำปัญหานี้ได้บน OpenClaw ล่าสุด ให้ติดตาม/รายงานใน:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีขึ้นได้อย่างไร?">
    ใช้ **การติดตั้งที่แก้ไขได้ (git)** เพื่อให้คุณมีซอร์สและเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    บอทของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วเรียกใช้ onboarding

    - เส้นทางด่วนของ Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - คำแนะนำแบบครบถ้วน: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [ติดตั้งและอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    VPS Linux ใด ๆ ก็ใช้ได้ ติดตั้งบนเซิร์ฟเวอร์ แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือติดตั้งบน cloud/VPS อยู่ที่ไหน?">
    เรามี **ฮับโฮสติ้ง** พร้อมผู้ให้บริการทั่วไป เลือกหนึ่งรายการและทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (ผู้ให้บริการทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานบน cloud: **Gateway ทำงานบนเซิร์ฟเวอร์** และคุณเข้าถึงได้
    จากแล็ปท็อป/โทรศัพท์ผ่าน Control UI (หรือ Tailscale/SSH) สถานะ + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือว่าโฮสต์เป็นแหล่งข้อมูลจริงและสำรองข้อมูลไว้

    คุณสามารถจับคู่ **nodes** (Mac/iOS/Android/headless) กับ Gateway บน cloud นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือเรียกใช้คำสั่งบนแล็ปท็อปของคุณ โดยยังคงให้
    Gateway อยู่บน cloud

    ฮับ: [แพลตฟอร์ม](/th/platforms) การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **เป็นไปได้ แต่ไม่แนะนำ** ขั้นตอนอัปเดตสามารถรีสตาร์ต
    Gateway (ซึ่งจะตัดเซสชันที่ใช้งานอยู่), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจขอการยืนยัน ปลอดภัยกว่า: เรียกใช้อัปเดตจากเชลล์ในฐานะผู้ควบคุมระบบ

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้องทำอัตโนมัติจาก agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือเส้นทางตั้งค่าที่แนะนำ ใน **โหมด local** จะพาคุณทำสิ่งเหล่านี้:

    - **การตั้งค่าโมเดล/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือกโมเดล local เช่น LM Studio)
    - ตำแหน่ง **Workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **ช่องทาง** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง Plugin ช่องทางที่รวมมา เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **Skills**

    นอกจากนี้ยังเตือนหากโมเดลที่คุณกำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันต้องมี Claude หรือ OpenAI subscription เพื่อรันสิ่งนี้ไหม?">
    ไม่จำเป็น คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **โมเดลแบบ local-only** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ subscription (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธีเสริมสำหรับยืนยันตัวตนกับ provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งที่ใช้งานจริงคือ:

    - **Anthropic API key**: การคิดค่าบริการ Anthropic API ตามปกติ
    - **Claude CLI / การยืนยันตัวตน Claude subscription ใน OpenClaw**: เจ้าหน้าที่ Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้งาน `claude -p`
      ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับโฮสต์ gateway ที่ใช้งานระยะยาว Anthropic API keys ยังคงเป็นการตั้งค่าที่
    คาดการณ์ได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับ
    เครื่องมือภายนอกอย่าง OpenClaw

    OpenClaw ยังรองรับตัวเลือก hosted แบบ subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [โมเดล local](/th/gateway/local-models), [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่มี API key ได้ไหม?">
    ได้

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw-style ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่าการยืนยันตัวตนด้วย Claude subscription และการใช้งาน `claude -p` ได้รับการอนุมัติ
    สำหรับ integration นี้ เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดการณ์ได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วย Claude subscription (Claude Pro หรือ Max) หรือไม่?">
    รองรับ

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับ integration นี้
    เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังคงพร้อมใช้งานในฐานะเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw เลือกใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งานเป็นหลัก
    สำหรับ production หรือ workload แบบหลายผู้ใช้ การยืนยันตัวตนด้วย Anthropic API key ยังคงเป็น
    ตัวเลือกที่ปลอดภัยกว่าและคาดการณ์ได้มากกว่า หากคุณต้องการตัวเลือก hosted
    แบบ subscription-style อื่นใน OpenClaw โปรดดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/glm)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    นั่นหมายความว่า **โควตา/ขีดจำกัดอัตราของ Anthropic** ของคุณหมดแล้วสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอให้ช่วงเวลารีเซ็ตหรืออัปเกรดแผนของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับ usage/billing และเพิ่มขีดจำกัดตามต้องการ

    หากข้อความเป็นโดยเฉพาะ:
    `Extra usage is required for long context requests` แปลว่าคำขอกำลังพยายามใช้
    beta context 1M ของ Anthropic (`context1m: true`) ซึ่งใช้งานได้เฉพาะเมื่อ
    credential ของคุณมีสิทธิ์สำหรับการคิดค่าบริการ long-context (การคิดค่าบริการ API key หรือ
    เส้นทาง OpenClaw Claude-login ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **โมเดลสำรอง** เพื่อให้ OpenClaw ยังตอบกลับได้ในขณะที่ผู้ให้บริการถูกจำกัดอัตรา
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth), และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่">
    รองรับ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** ที่รวมมาด้วย เมื่อมีเครื่องหมาย env ของ AWS OpenClaw จะค้นพบแค็ตตาล็อก Bedrock แบบสตรีมมิง/ข้อความโดยอัตโนมัติและรวมเข้าเป็นผู้ให้บริการ `amazon-bedrock` โดยนัย มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการผู้ให้บริการด้วยตนเองได้ ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์ที่มีการจัดการ พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การยืนยันตัวตนของ Codex ทำงานอย่างไร">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (ลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` สำหรับการตั้งค่าทั่วไป: การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม
    การดำเนินการผ่านเซิร์ฟเวอร์แอป Codex แบบเนทีฟ การอ้างอิงโมเดล `openai-codex/gpt-*`
    เป็นการกำหนดค่าเดิมที่ซ่อมโดย `openclaw doctor --fix` การเข้าถึงด้วยคีย์ API ของ OpenAI
    โดยตรงยังพร้อมใช้งานสำหรับพื้นผิว API ของ OpenAI ที่ไม่ใช่ agent และสำหรับโมเดล agent
    ผ่านโปรไฟล์คีย์ API `openai-codex` แบบมีลำดับ
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง openai-codex">
    `openai-codex` คือ id ของผู้ให้บริการและโปรไฟล์การยืนยันตัวตนสำหรับ ChatGPT/Codex OAuth
    การกำหนดค่าเก่ากว่ายังเคยใช้เป็นคำนำหน้าโมเดลด้วย:

    - `openai/gpt-5.5` = การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม runtime Codex แบบเนทีฟสำหรับรอบ agent
    - `openai-codex/gpt-5.5` = เส้นทางโมเดลเดิมที่ซ่อมโดย `openclaw doctor --fix`
    - `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API `openai-codex` แบบมีลำดับ = การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดล agent ของ OpenAI
    - `openai-codex:...` = id โปรไฟล์การยืนยันตัวตน ไม่ใช่การอ้างอิงโมเดล

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` เก็บการอ้างอิงโมเดลเป็น
    `openai/gpt-5.5`; การอ้างอิงโมเดล `openai-codex/*` เป็นการกำหนดค่าเดิมที่
    `openclaw doctor --fix` เขียนใหม่

  </Accordion>

  <Accordion title="ทำไมขีดจำกัดของ Codex OAuth จึงต่างจากเว็บ ChatGPT ได้">
    Codex OAuth ใช้กรอบโควตาที่ OpenAI จัดการและขึ้นกับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจแตกต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงกรอบการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ของเว็บ ChatGPT
    ให้เป็นการเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อมคีย์ API

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก OpenAI (Codex OAuth) หรือไม่">
    รองรับ OpenClaw รองรับ **OAuth การสมัครสมาชิก OpenAI Code (Codex)** อย่างเต็มรูปแบบ
    OpenAI อนุญาตการใช้งาน OAuth แบบสมัครสมาชิกในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw อย่างชัดเจน การเริ่มต้นใช้งานสามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers), และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร">
    Gemini CLI ใช้ **โฟลว์การยืนยันตัวตนของ plugin** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่บน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway

    สิ่งนี้จะเก็บโทเค็น OAuth ไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลในเครื่องเหมาะสำหรับแชตทั่วไปหรือไม่">
    โดยทั่วไปไม่เหมาะ OpenClaw ต้องการบริบทขนาดใหญ่ + ความปลอดภัยที่แข็งแรง การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็นจริง ๆ ให้รันบิลด์โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันในเครื่องได้ (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/ผ่านการ quantize เพิ่มความเสี่ยงจาก prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะเก็บทราฟฟิกโมเดลแบบโฮสต์ไว้ในภูมิภาคเฉพาะได้อย่างไร">
    เลือก endpoint ที่ตรึงภูมิภาค OpenRouter เปิดเผยตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi, และ GLM; เลือกเวอร์ชันที่โฮสต์ในสหรัฐฯ เพื่อเก็บข้อมูลไว้ในภูมิภาค คุณยังสามารถแสดง Anthropic/OpenAI ควบคู่กับตัวเลือกเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งานขณะเคารพผู้ให้บริการตามภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux (Windows ผ่าน WSL2) ได้ Mac mini เป็นทางเลือก - บางคน
    ซื้อมาเป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก เซิร์ฟเวอร์ที่บ้าน หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac เฉพาะ **สำหรับเครื่องมือที่ใช้ได้เฉพาะบน macOS** สำหรับ iMessage ให้ใช้ [iMessage](/th/channels/imessage) พร้อม `imsg` บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages หาก Gateway รันบน Linux หรือที่อื่น ให้ตั้งค่า `channels.imessage.cliPath` เป็น wrapper SSH ที่รัน `imsg` บน Mac เครื่องนั้น หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะบน macOS ให้รัน Gateway บน Mac หรือจับคู่ node macOS

    เอกสาร: [iMessage](/th/channels/imessage), [Nodes](/th/nodes), [โหมด Mac ระยะไกล](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องใช้ Mac mini เพื่อรองรับ iMessage หรือไม่">
    คุณต้องมี **อุปกรณ์ macOS บางเครื่อง** ที่ลงชื่อเข้าใช้ Messages อยู่ ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [iMessage](/th/channels/imessage)** พร้อม `imsg`; Gateway สามารถรันบน Mac เครื่องนั้น หรือรันที่อื่นพร้อม wrapper SSH `cliPath` ก็ได้

    การตั้งค่าที่พบบ่อย:

    - รัน Gateway บน Linux/VPS และตั้งค่า `channels.imessage.cliPath` เป็น wrapper SSH ที่รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [iMessage](/th/channels/imessage), [Nodes](/th/nodes),
    [โหมด Mac ระยะไกล](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อกับ MacBook Pro ของฉันได้ไหม">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่ขนาน) Nodes ไม่รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบที่พบบ่อย:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node และจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดู

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม">
    **ไม่แนะนำ** ให้ใช้ Bun เราพบข้อบกพร่องของ runtime โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ gateways ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน gateway ที่ไม่ใช่ production
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ใส่อะไรใน allowFrom">
    `channels.telegram.allowFrom` คือ **ID ผู้ใช้ Telegram ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้ของบอท

    การตั้งค่าจะถามเฉพาะ ID ผู้ใช้แบบตัวเลข หากคุณมีรายการ `@username` เดิมใน config อยู่แล้ว `openclaw doctor --fix` สามารถลอง resolve รายการเหล่านั้นได้

    ปลอดภัยกว่า (ไม่มีบอทของบุคคลที่สาม):

    - DM บอทของคุณ จากนั้นรัน `openclaw logs --follow` และอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - DM บอทของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้ไหม">
    ได้ ผ่าน **การกำหนดเส้นทางหลาย agent** ผูก **DM** WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, ผู้ส่งแบบ E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนมี workspace และที่เก็บ session ของตนเอง การตอบกลับยังคงมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบ global ต่อบัญชี WhatsApp ดู [การกำหนดเส้นทางหลาย agent](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรัน agent "แชตเร็ว" และ agent "Opus สำหรับเขียนโค้ด" ได้ไหม'>
    ได้ ใช้การกำหนดเส้นทางหลาย agent: ให้แต่ละ agent มีโมเดลเริ่มต้นของตนเอง จากนั้นผูกเส้นทางขาเข้า (บัญชีผู้ให้บริการหรือ peer เฉพาะ) กับแต่ละ agent ตัวอย่าง config อยู่ใน [การกำหนดเส้นทางหลาย agent](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ทำงานบน Linux ได้ไหม">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าแบบรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจสอบให้แน่ใจว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน shell ที่ไม่ใช่ login
    บิลด์ล่าสุดยัง prepend ไดเรกทอรี bin ของผู้ใช้ที่พบบ่อยบน service Linux systemd ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, และ `FNM_DIR` เมื่อตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้ง git แบบแก้ไขได้กับการติดตั้ง npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout ซอร์สเต็ม แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณรันบิลด์ในเครื่องและแก้ไขโค้ด/เอกสารได้
    - **การติดตั้ง npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ “แค่รันมัน”
      การอัปเดตมาจาก npm dist-tags

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้ง npm และ git ภายหลังได้ไหม">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **ไม่ลบข้อมูลของคุณ** - เพียงเปลี่ยนการติดตั้งโค้ด OpenClaw เท่านั้น
    state (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) ของคุณจะไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน updater จะรัน
    งานติดตามผลของ Doctor, รีเฟรชซอร์ส plugin สำหรับ channel เป้าหมาย, และ
    รีสตาร์ท gateway เว้นแต่คุณส่ง `--no-restart`

    installer สามารถบังคับโหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS">
    คำตอบสั้น ๆ: **หากคุณต้องการความน่าเชื่อถือ 24/7 ให้ใช้ VPS** หากคุณต้องการ
    แรงเสียดทานต่ำที่สุดและยอมรับการ sleep/restart ได้ ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์ เข้าถึงไฟล์ในเครื่องได้โดยตรง หน้าต่างเบราว์เซอร์แบบ live
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = การเชื่อมต่อขาด, การอัปเดต OS/reboot ขัดจังหวะ, ต้องเปิดเครื่องค้างไว้

    **VPS / cloud**

    - **ข้อดี:** เปิดทำงานตลอดเวลา, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อปเข้าสู่โหมดพัก, ดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักรันแบบไม่มีหน้าจอ (ใช้ภาพหน้าจอ), เข้าถึงไฟล์ได้เฉพาะทางรีโมต, คุณต้องใช้ SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ทั้งหมดทำงานได้ดีจาก VPS ข้อแลกเปลี่ยนจริงเพียงอย่างเดียวคือ **เบราว์เซอร์แบบไม่มีหน้าต่างแสดงผล** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยมีปัญหา Gateway หลุดการเชื่อมต่อมาก่อน แบบโลคัลเหมาะมากเมื่อคุณกำลังใช้งาน Mac อยู่และต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดทำงานตลอดเวลา, การพักเครื่อง/รีบูตขัดจังหวะน้อยกว่า, สิทธิ์สะอาดกว่า, ดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานจริงได้ดีไม่มีปัญหา แต่คาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่องเข้าสู่โหมดพักหรืออัปเดต

    หากคุณต้องการข้อดีทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **Node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec แบบโลคัล ดู [Nodes](/th/nodes)
    สำหรับคำแนะนำด้านความปลอดภัย อ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และ OS ที่แนะนำคืออะไร?">
    OpenClaw มีน้ำหนักเบา สำหรับ Gateway พื้นฐาน + ช่องทางแชตหนึ่งช่องทาง:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ ~500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อเผื่อพื้นที่ใช้งาน (ล็อก, สื่อ, หลายช่องทาง) เครื่องมือ Node และ browser automation อาจใช้ทรัพยากรค่อนข้างมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ได้รับการทดสอบดีที่สุดที่นั่น

    เอกสาร: [Linux](/th/platforms/linux), [โฮสต์ VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันสามารถรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้มอง VM เหมือนกับ VPS: ต้องเปิดทำงานตลอดเวลา, เข้าถึงได้, และมี RAM เพียงพอ
    สำหรับ Gateway และช่องทางใด ๆ ที่คุณเปิดใช้

    คำแนะนำพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป หากคุณรันหลายช่องทาง, browser automation, หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    หากคุณใช้ Windows, **WSL2 เป็นการตั้งค่าแบบ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด ดู [Windows](/th/platforms/windows), [โฮสต์ VPS](/th/vps)
    หากคุณกำลังรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (โมเดล, เซสชัน, Gateway, ความปลอดภัย, และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
