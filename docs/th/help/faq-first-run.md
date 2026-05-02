---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการเรียกใช้ครั้งแรก
    - การเลือกการตรวจสอบสิทธิ์และการสมัครรับข้อมูลของผู้ให้บริการ
    - ไม่สามารถเข้าถึง docs.openclaw.ai, ไม่สามารถเปิดแดชบอร์ด, การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการใช้งานครั้งแรก — การติดตั้ง การเริ่มใช้งาน การตรวจสอบสิทธิ์ การสมัครใช้งาน ความล้มเหลวเริ่มต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าเมื่อใช้งานครั้งแรก'
x-i18n:
    generated_at: "2026-05-02T22:19:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  คู่มือเริ่มต้นอย่างรวดเร็วและถาม-ตอบสำหรับการรันครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การยืนยันตัวตน เซสชัน
  และการแก้ปัญหา ดู [คำถามที่พบบ่อย](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดปัญหา วิธีที่เร็วที่สุดในการแก้ให้ไปต่อได้">
    ใช้เอเจนต์ AI ในเครื่องที่สามารถ **เห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณี "ฉันติดปัญหา" ส่วนใหญ่เป็น **ปัญหาคอนฟิกหรือสภาพแวดล้อมในเครื่อง**
    ที่ผู้ช่วยจากระยะไกลไม่สามารถตรวจสอบได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่าน repo, รันคำสั่ง, ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่อง
    ของคุณได้ (PATH, บริการ, สิทธิ์, ไฟล์ยืนยันตัวตน) ให้เครื่องมือเหล่านี้เข้าถึง **ซอร์สเช็กเอาต์เต็มชุด** ผ่าน
    การติดตั้งแบบปรับแก้ได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    คำสั่งนี้ติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสาร และ
    วิเคราะห์เวอร์ชันจริงที่คุณกำลังรันอยู่ได้ คุณสามารถสลับกลับไปใช้เวอร์ชันเสถียรภายหลังได้เสมอ
    โดยรันตัวติดตั้งใหม่โดยไม่ใช้ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับดูแล** การแก้ไข (ทีละขั้น) แล้วค่อยรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ช่วยให้การเปลี่ยนแปลงมีขนาดเล็กและตรวจสอบย้อนหลังได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือแนวทางแก้ไข โปรดเปิด issue ใน GitHub หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์เอาต์พุตเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: ภาพรวมเร็วๆ ของสถานะ Gateway/เอเจนต์ + คอนฟิกพื้นฐาน
    - `openclaw models status`: ตรวจสอบการยืนยันตัวตนของผู้ให้บริการ + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบความถูกต้องและซ่อมแซมปัญหาคอนฟิก/สถานะที่พบบ่อย

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    วงจรดีบักอย่างรวดเร็ว: [60 วินาทีแรกหากมีบางอย่างเสีย](/th/help/faq#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [อัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามการทำงานอยู่เรื่อยๆ เหตุผลการข้ามหมายถึงอะไร?">
    เหตุผลการข้าม Heartbeat ที่พบบ่อย:

    - `quiet-hours`: อยู่นอกช่วงเวลาทำงานที่กำหนดไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงร่างว่าง/เฉพาะหัวข้อ
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดอยู่ แต่ยังไม่มีช่วงเวลางานใดถึงกำหนด
    - `alerts-disabled`: ปิดการมองเห็น Heartbeat ทั้งหมด (`showOk`, `showAlerts` และ `useIndicator` ปิดทั้งหมด)

    ในโหมดงาน เวลาครบกำหนดจะเลื่อนไปข้างหน้าหลังจากการรัน Heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายงานว่าเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [Automation และงาน](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo แนะนำให้รันจากซอร์สและใช้การเริ่มต้นใช้งาน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดยังสามารถสร้างแอสเซต UI โดยอัตโนมัติได้ด้วย หลังการเริ่มต้นใช้งาน ปกติคุณจะรัน Gateway บนพอร์ต **18789**

    จากซอร์ส (ผู้มีส่วนร่วม/dev):

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

  <Accordion title="ฉันจะเปิดแดชบอร์ดหลังการเริ่มต้นใช้งานได้อย่างไร?">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็น) ทันทีหลังการเริ่มต้นใช้งาน และยังพิมพ์ลิงก์ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ไว้บนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนแดชบอร์ดบน localhost เทียบกับระยะไกลได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบถามหาการยืนยันตัวตนแบบ shared-secret ให้วางโทเค็นหรือรหัสผ่านที่กำหนดไว้ในการตั้งค่า Control UI
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนด shared secret ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ได้อยู่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คง bind เป็น loopback, รัน `openclaw gateway --tailscale serve`, เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` เฮดเดอร์ตัวตนจะผ่านการยืนยันตัวตนของ Control UI/WebSocket (ไม่ต้องวาง shared secret, ถือว่าโฮสต์ Gateway เชื่อถือได้); HTTP APIs ยังต้องใช้การยืนยันตัวตนแบบ shared-secret เว้นแต่คุณจงใจใช้ private-ingress `none` หรือการยืนยันตัวตน HTTP แบบ trusted-proxy
      ความพยายามยืนยันตัวตน Serve ที่ผิดและเกิดพร้อมกันจากไคลเอนต์เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึกไว้ ดังนั้นการลองซ้ำผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่าการยืนยันตัวตนด้วยรหัสผ่าน), เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันในการตั้งค่าแดชบอร์ด
    - **reverse proxy ที่รับรู้ตัวตน**: วาง Gateway ไว้หลังพร็อกซีที่เชื่อถือได้, กำหนด `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของพร็อกซี พร็อกซี loopback บนโฮสต์เดียวกันต้องกำหนด `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` การยืนยันตัวตนแบบ shared-secret ยังคงใช้ผ่านอุโมงค์นี้ วางโทเค็นหรือรหัสผ่านที่กำหนดไว้หากถูกถาม

    ดู [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับโหมด bind และรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ทำไมจึงมีคอนฟิกการอนุมัติ exec สองชุดสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองชุดควบคุมคนละเลเยอร์:

    - `approvals.exec`: ส่งต่อพรอมป์การอนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องนั้นทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบ native สำหรับการอนุมัติ exec

    นโยบาย exec ของโฮสต์ยังคงเป็นด่านอนุมัติจริง คอนฟิกแชตควบคุมเพียงว่า
    พรอมป์การอนุมัติจะปรากฏที่ใดและผู้ใช้จะตอบได้อย่างไร

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางร่วม
    - หากช่อง native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย ตอนนี้ OpenClaw จะเปิดใช้การอนุมัติ native แบบ DM-first โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `channels.<channel>.execApprovals.enabled` หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติแบบ native ให้ใช้ UI native นั้นเป็นเส้นทางหลัก เอเจนต์ควรใส่คำสั่ง `/approve` แบบแมนนวลก็ต่อเมื่อผลลัพธ์ของเครื่องมือระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นเส้นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อพรอมป์ต้องถูกส่งต่อไปยังแชตอื่นหรือห้องปฏิบัติการที่ระบุอย่างชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการโพสต์พรอมป์การอนุมัติกลับไปยังห้อง/หัวข้อต้นทางอย่างชัดเจน
    - การอนุมัติ Plugin แยกต่างหากอีกครั้ง: โดยค่าเริ่มต้นใช้ `/approve` ในแชตเดียวกัน, มีการส่งต่อ `approvals.plugin` แบบเลือกใช้ได้ และมีเพียงบางช่อง native ที่คงการจัดการ plugin-approval-native ไว้ด้านบน

    สรุปสั้นๆ: การส่งต่อมีไว้สำหรับการกำหนดเส้นทาง ส่วนคอนฟิกไคลเอนต์ native มีไว้สำหรับ UX เฉพาะช่องที่สมบูรณ์ขึ้น
    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` Bun **ไม่แนะนำ** สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้หรือไม่?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 core** และดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากต้องการพื้นที่เผื่อเพิ่มเติม (ล็อก, สื่อ, บริการอื่นๆ), **แนะนำ 2GB** แต่ไม่ใช่
    ขั้นต่ำแบบบังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับ
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือการรันคำสั่ง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับอะไรสำหรับการติดตั้งบน Raspberry Pi หรือไม่?">
    สรุปสั้นๆ: ใช้งานได้ แต่ควรคาดว่าจะมีจุดที่ยังไม่เรียบเนียน

    - ใช้ระบบปฏิบัติการแบบ **64-bit** และคง Node >= 22
    - แนะนำให้ใช้ **การติดตั้งแบบปรับแก้ได้ (git)** เพื่อให้ดูล็อกและอัปเดตได้เร็ว
    - เริ่มโดยไม่เปิดช่อง/Skills แล้วค่อยเพิ่มทีละรายการ
    - หากพบปัญหาไบนารีแปลกๆ มักเป็นปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ wake up my friend / การเริ่มต้นใช้งานไม่ฟักตัว ควรทำอย่างไร?">
    หน้าจอนั้นขึ้นอยู่กับการที่ Gateway เข้าถึงได้และยืนยันตัวตนแล้ว TUI ยังส่ง
    "Wake up, my friend!" โดยอัตโนมัติเมื่อฟักตัวครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นโดย **ไม่มีการตอบกลับ**
    และโทเค็นยังอยู่ที่ 0 แปลว่าเอเจนต์ไม่เคยรัน

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

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่าอุโมงค์/การเชื่อมต่อ Tailscale พร้อมใช้งาน และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปยังเครื่องใหม่ (Mac mini) โดยไม่ต้องเริ่มต้นใช้งานใหม่ได้หรือไม่?">
    ได้ คัดลอก **ไดเรกทอรีสถานะ** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    จะคงบอทของคุณให้ "เหมือนเดิมทุกประการ" (หน่วยความจำ, ประวัติเซสชัน, การยืนยันตัวตน และสถานะช่อง)
    ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ตบริการ Gateway

    วิธีนี้จะรักษาคอนฟิก, โปรไฟล์การยืนยันตัวตน, creds ของ WhatsApp, เซสชัน และหน่วยความจำไว้ หากคุณอยู่ใน
    โหมดระยะไกล โปรดจำว่าโฮสต์ gateway เป็นเจ้าของที่เก็บเซสชันและ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณไปยัง GitHub แปลว่าคุณกำลังสำรอง
    **หน่วยความจำ + ไฟล์ bootstrap** แต่ **ไม่ได้** สำรองประวัติเซสชันหรือการยืนยันตัวตน สิ่งเหล่านั้นอยู่
    ภายใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้ายระบบ](/th/install/migrating), [สิ่งต่างๆ อยู่ที่ใดบนดิสก์](/th/help/faq#where-things-live-on-disk),
    [workspace ของเอเจนต์](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [โหมดระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูสิ่งใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ดู changelog ใน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ที่สุดอยู่ด้านบน หากส่วนบนสุดทำเครื่องหมายว่า **Unreleased** ส่วนที่มีวันที่ถัดลงมา
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการถูกจัดกลุ่มตาม **ไฮไลต์**, **การเปลี่ยนแปลง** และ
    **การแก้ไข** (รวมถึงส่วนเอกสาร/อื่นๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="ไม่สามารถเข้าถึง docs.openclaw.ai (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางส่วนบล็อก `docs.openclaw.ai` อย่างผิดพลาดผ่าน Xfinity
    Advanced Security ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ในรายการอนุญาต แล้วลองใหม่
    โปรดช่วยเราเลิกบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าเว็บไซต์ไม่ได้ เอกสารจะถูกมิเรอร์ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่โค้ดคนละสาย:

    - `latest` = stable
    - `beta` = บิลด์ล่วงหน้าสำหรับทดสอบ

    โดยปกติ release แบบ stable จะเข้า **beta** ก่อน จากนั้นขั้นตอน
    promotion ที่ระบุชัดเจนจะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` ผู้ดูแลยังสามารถ
    publish ตรงไปที่ `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลัง promotion

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev ให้ดูแอคคอร์เดียนด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลัง promotion)
    **Dev** คือ head ที่เปลี่ยนตลอดของ `main` (git); เมื่อ publish แล้ว จะใช้ npm dist-tag `dev`

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

    คำสั่งนี้จะสลับไปยังสาขา `main` และอัปเดตจาก source

    2. **การติดตั้งแบบแก้ไขได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะให้ repo ในเครื่องที่คุณแก้ไขได้ จากนั้นอัปเดตผ่าน git

    หากคุณต้องการ clone ใหม่เองแบบสะอาด ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="โดยปกติการติดตั้งและ onboarding ใช้เวลานานเท่าไร?">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวน channel/model ที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูปดีบักแบบเร็วใน [ฉันติดอยู่](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะดู feedback เพิ่มได้อย่างไร?">
    รันตัวติดตั้งอีกครั้งพร้อม **verbose output**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง Beta พร้อม verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    คำสั่งเทียบเท่าบน Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหาที่พบบ่อยบน Windows มีสองอย่าง:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดและเปิด PowerShell ใหม่ แล้วรันตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบ path:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ของคุณ (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดและเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากคุณต้องการการตั้งค่า Windows ที่ราบรื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบเนทีฟ
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความจีนเพี้ยน - ควรทำอย่างไร?">
    โดยปกติเป็นการไม่ตรงกันของ console code page บน shell ของ Windows แบบเนทีฟ

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติในโปรไฟล์ terminal อื่น

    วิธีแก้ชั่วคราวอย่างรวดเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้นรีสตาร์ท Gateway แล้วลองคำสั่งอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยังทำให้เกิดปัญหานี้ซ้ำได้บน OpenClaw ล่าสุด ให้ติดตาม/รายงานที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่านี้อย่างไร?">
    ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณมี source และเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    บอตของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - เส้นทางเร็วสำหรับ Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - คำแนะนำแบบละเอียด: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [การติดตั้งและการอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    ใช้ Linux VPS ใดก็ได้ ติดตั้งบนเซิร์ฟเวอร์ แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือการติดตั้งบน cloud/VPS อยู่ที่ไหน?">
    เรามี **ศูนย์รวม hosting** สำหรับผู้ให้บริการทั่วไป เลือกหนึ่งตัวแล้วทำตามคู่มือ:

    - [VPS hosting](/th/vps) (ผู้ให้บริการทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานบน cloud: **Gateway รันอยู่บนเซิร์ฟเวอร์** และคุณเข้าถึงได้
    จากแล็ปท็อป/โทรศัพท์ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือว่า host เป็นแหล่งข้อมูลหลักและสำรองข้อมูลไว้

    คุณสามารถจับคู่ **nodes** (Mac/iOS/Android/headless) กับ cloud Gateway นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือรันคำสั่งบนแล็ปท็อปของคุณขณะที่ยังเก็บ
    Gateway ไว้บน cloud

    ศูนย์รวม: [แพลตฟอร์ม](/th/platforms) การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** flow การอัปเดตอาจรีสตาร์ท
    Gateway (ซึ่งจะตัด session ที่ใช้งานอยู่), อาจต้องมี git checkout ที่สะอาด และ
    อาจ prompt เพื่อขอการยืนยัน วิธีที่ปลอดภัยกว่า: รันการอัปเดตจาก shell ในฐานะ operator

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้อง automate จาก agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **local mode** คำสั่งนี้จะพาคุณทำสิ่งต่อไปนี้:

    - **การตั้งค่า model/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือก model ในเครื่อง เช่น LM Studio)
    - ตำแหน่ง **Workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง bundled channel plugins เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **skills**

    นอกจากนี้ยังเตือนหาก model ที่คุณกำหนดค่าไม่เป็นที่รู้จักหรือขาด auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription ของ Claude หรือ OpenAI เพื่อรันสิ่งนี้ไหม?">
    ไม่จำเป็น คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **model ที่ใช้เฉพาะในเครื่อง** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ Subscription (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธีเสริมสำหรับยืนยันตัวตนกับ provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งใช้งานจริงคือ:

    - **Anthropic API key**: การคิดค่าบริการ Anthropic API ตามปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: ทีมงาน Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้ `claude -p`
      ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับ gateway host ที่ใช้งานระยะยาว Anthropic API keys ยังคงเป็นการตั้งค่าที่
    คาดการณ์ได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอก
    เช่น OpenClaw

    OpenClaw ยังรองรับตัวเลือก hosted แบบ subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [Local models](/th/gateway/local-models), [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่มี API key ได้ไหม?">
    ได้

    ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้ `claude -p` ได้รับการอนุมัติ
    สำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดการณ์ได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="รองรับ Claude subscription auth (Claude Pro หรือ Max) ไหม?">
    รองรับ

    ทีมงาน Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การนำ Claude CLI กลับมาใช้และการใช้ `claude -p` ได้รับการอนุมัติสำหรับ integration นี้
    เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
    สำหรับ production หรือ workload แบบผู้ใช้หลายคน การยืนยันตัวตนด้วย Anthropic API key ยังคงเป็นตัวเลือกที่
    ปลอดภัยกว่าและคาดการณ์ได้มากกว่า หากคุณต้องการตัวเลือก hosted แบบ subscription-style อื่น ๆ
    ใน OpenClaw ให้ดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/glm)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    หมายความว่า **quota/rate limit ของ Anthropic** ของคุณหมดสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอจนกว่าช่วงเวลาจะรีเซ็ตหรืออัปเกรดแผนของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่ม limit ตามต้องการ

    หากข้อความคือ:
    `Extra usage is required for long context requests` โดยเฉพาะ แสดงว่าคำขอกำลังพยายามใช้
    Anthropic 1M context beta (`context1m: true`) ซึ่งใช้ได้เฉพาะเมื่อ
    credential ของคุณมีสิทธิ์สำหรับการคิดค่าบริบทแบบยาว (การเรียกเก็บเงินผ่าน API key หรือเส้นทาง
    เข้าสู่ระบบ Claude ของ OpenClaw โดยเปิด Extra Usage ไว้)

    เคล็ดลับ: ตั้งค่า **fallback model** เพื่อให้ OpenClaw ตอบต่อไปได้เมื่อ provider ถูก rate limit
    ดู [Models](/th/cli/models), [OAuth](/th/concepts/oauth), และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    รองรับ OpenClaw มี provider **Amazon Bedrock (Converse)** ที่มาพร้อมในตัว เมื่อมีตัวบ่งชี้ env ของ AWS อยู่ OpenClaw จะค้นพบ catalog ของ Bedrock แบบ streaming/text โดยอัตโนมัติ และผสานเข้ามาเป็น provider `amazon-bedrock` แบบโดยนัยได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการ provider ด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [Model providers](/th/providers/models) หากคุณต้องการ flow แบบ managed key การใช้ proxy ที่เข้ากันได้กับ OpenAI ไว้หน้า Bedrock ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การ auth ของ Codex ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"` สำหรับการตั้งค่าทั่วไป:
    การ auth ด้วย subscription ของ ChatGPT/Codex พร้อมการดำเนินการ app-server แบบ native ของ Codex ใช้
    `openai-codex/gpt-5.5` เฉพาะเมื่อคุณต้องการ Codex OAuth ผ่าน
    PI runner เริ่มต้น ใช้ `openai/gpt-5.5` โดยไม่ override runtime ของ Codex สำหรับ
    การเข้าถึงผ่าน OpenAI API key โดยตรง
    ดู [Model providers](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง openai-codex?">
    `openai-codex` คือ id ของ provider และ auth-profile สำหรับ ChatGPT/Codex OAuth
    นอกจากนี้ยังเป็น prefix โมเดล PI แบบชัดเจนสำหรับ Codex OAuth ด้วย:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = การ auth ด้วย subscription ของ ChatGPT/Codex พร้อม runtime native ของ Codex
    - `openai-codex/gpt-5.5` = เส้นทาง Codex OAuth ใน PI
    - `openai/gpt-5.5` โดยไม่มีการ override runtime ของ Codex = เส้นทาง OpenAI API key โดยตรงใน PI
    - `openai-codex:...` = auth profile id ไม่ใช่ model ref

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการ auth ด้วย subscription ของ ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` สำหรับ runtime native ของ Codex
    ให้คง model ref เป็น `openai/gpt-5.5` และตั้งค่า
    `agentRuntime.id: "codex"` ใช้ model ref `openai-codex/*` เฉพาะสำหรับการรัน PI
    เท่านั้น

  </Accordion>

  <Accordion title="ทำไมขีดจำกัดของ Codex OAuth จึงต่างจาก ChatGPT web ได้?">
    Codex OAuth ใช้กรอบโควตาตามแผนที่ OpenAI จัดการ ในทางปฏิบัติ
    ขีดจำกัดเหล่านี้อาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงกรอบ usage/quota ของ provider ที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่ไม่ได้สร้างหรือปรับสิทธิ์ของ ChatGPT web
    ให้กลายเป็นการเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อม API key

  </Accordion>

  <Accordion title="รองรับการ auth ด้วย subscription ของ OpenAI (Codex OAuth) หรือไม่?">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างเต็มรูปแบบ
    OpenAI อนุญาตให้ใช้ subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    อย่าง OpenClaw อย่างชัดเจน Onboarding สามารถรัน OAuth flow ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [Model providers](/th/concepts/model-providers), และ [Onboarding (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร?">
    Gemini CLI ใช้ **plugin auth flow** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่ใน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway

    การดำเนินการนี้จะเก็บ OAuth tokens ใน auth profiles บนโฮสต์ Gateway รายละเอียด: [Model providers](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดล local ใช้สำหรับแชตทั่วไปได้ไหม?">
    โดยปกติไม่ได้ OpenClaw ต้องการบริบทขนาดใหญ่และความปลอดภัยสูง การ์ดขนาดเล็กจะตัดเนื้อหาและรั่วไหล หากจำเป็นต้องใช้ ให้รัน build โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันได้ในเครื่อง (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/quantized จะเพิ่มความเสี่ยงด้าน prompt injection - ดู [Security](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะจำกัดทราฟฟิกของโมเดลที่โฮสต์ให้อยู่ในภูมิภาคเฉพาะได้อย่างไร?">
    เลือก endpoint ที่ pin ภูมิภาคไว้ OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM ให้เลือก variant ที่โฮสต์ในสหรัฐฯ เพื่อเก็บข้อมูลไว้ในภูมิภาค คุณยังสามารถแสดง Anthropic/OpenAI ควบคู่กับตัวเลือกเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งานขณะเคารพ provider ตามภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux ได้ (Windows ผ่าน WSL2) Mac mini เป็นตัวเลือกเสริม - บางคน
    ซื้อไว้เป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก เซิร์ฟเวอร์ที่บ้าน หรือกล่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องมี Mac เฉพาะสำหรับ **เครื่องมือที่ใช้ได้เฉพาะบน macOS** เท่านั้น สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันบน Mac ใดก็ได้ และ Gateway สามารถรันบน Linux หรือที่อื่นได้ หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะบน macOS ให้รัน Gateway บน Mac หรือจับคู่ node macOS

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes), [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องมี Mac mini เพื่อรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่อง** ที่ลงชื่อเข้าใช้ Messages ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ส่วน Gateway สามารถรันบน Linux หรือที่อื่นได้

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และรันเซิร์ฟเวอร์ BlueBubbles บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes),
    [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อกับ MacBook Pro ของฉันได้ไหม?">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่กัน) ได้ Nodes ไม่ได้รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบที่พบบ่อย:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node แล้วจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดูสถานะ

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม?">
    Bun **ไม่แนะนำให้ใช้** เราพบ bug runtime โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ gateway ที่เสถียร

    หากคุณยังต้องการทดลองใช้ Bun ให้ทำบน gateway ที่ไม่ใช่ production
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom?">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ username ของ bot

    ขั้นตอนตั้งค่าจะขอเฉพาะ user ID แบบตัวเลข หากคุณมีรายการ `@username` แบบเก่าใน config อยู่แล้ว `openclaw doctor --fix` อาจพยายาม resolve ให้ได้

    ปลอดภัยกว่า (ไม่ใช้ bot ภายนอก):

    - DM bot ของคุณ แล้วรัน `openclaw logs --follow` และอ่าน `from.id`

    Bot API ทางการ:

    - DM bot ของคุณ แล้วเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    ภายนอก (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้ไหม?">
    ได้ ผ่าน **multi-agent routing** ผูก **DM** ของ WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, sender E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนมี workspace และ session store ของตัวเอง การตอบกลับยังมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็น global ต่อบัญชี WhatsApp ดู [Multi-Agent Routing](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรัน agent "fast chat" และ agent "Opus for coding" ได้ไหม?'>
    ได้ ใช้ multi-agent routing: กำหนด default model ของตัวเองให้ agent แต่ละตัว แล้วผูก inbound routes (บัญชี provider หรือ peers เฉพาะ) กับ agent แต่ละตัว ตัวอย่าง config อยู่ใน [Multi-Agent Routing](/th/concepts/multi-agent) ดูเพิ่มเติมที่ [Models](/th/concepts/models) และ [Configuration](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้บน Linux ได้ไหม?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าแบบรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจสอบให้แน่ใจว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix ของ brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน non-login shells
    build ล่าสุดยัง prepend ไดเรกทอรี bin ของผู้ใช้ที่พบบ่อยบนบริการ Linux systemd ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, และ `FNM_DIR` เมื่อมีการตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้ง git แบบแก้ไขได้กับการติดตั้ง npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout source แบบเต็ม แก้ไขได้ เหมาะที่สุดสำหรับ contributor
      คุณรัน build ในเครื่องและ patch โค้ด/เอกสารได้
    - **การติดตั้ง npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ "แค่รัน"
      อัปเดตมาจาก npm dist-tags

    เอกสาร: [Getting started](/th/start/getting-started), [Updating](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้ง npm และ git ภายหลังได้ไหม?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    การดำเนินการนี้ **ไม่ลบข้อมูลของคุณ** - เปลี่ยนเฉพาะการติดตั้งโค้ดของ OpenClaw
    สถานะของคุณ (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) จะยังไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน updater จะรัน
    การติดตามผลของ Doctor, refresh แหล่งที่มาของ Plugin สำหรับ channel เป้าหมาย และ
    restart gateway เว้นแต่คุณส่ง `--no-restart`

    installer สามารถบังคับโหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [Backup strategy](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS?">
    คำตอบสั้น ๆ: **หากคุณต้องการความน่าเชื่อถือแบบ 24/7 ให้ใช้ VPS** หากคุณต้องการ
    ความยุ่งยากน้อยที่สุดและยอมรับ sleep/restarts ได้ ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์, เข้าถึงไฟล์ในเครื่องได้โดยตรง, มีหน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** การพักเครื่อง/เครือข่ายหลุด = การเชื่อมต่อถูกตัด, การอัปเดต/รีบูต OS ทำให้หยุดชะงัก, ต้องเปิดเครื่องค้างไว้

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดทำงานตลอดเวลา, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อปพักเครื่อง, ดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักทำงานแบบไม่มีหน้าจอ (ใช้ภาพหน้าจอ), เข้าถึงไฟล์ได้เฉพาะจากระยะไกล, คุณต้องใช้ SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ทั้งหมดทำงานจาก VPS ได้ดี ข้อแลกเปลี่ยนจริงเพียงอย่างเดียวคือ **เบราว์เซอร์แบบไม่มีหน้าจอ** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยมีปัญหา Gateway ตัดการเชื่อมต่อมาก่อน ใช้เครื่อง local จะดีมากเมื่อคุณกำลังใช้งาน Mac อยู่และต้องการเข้าถึงไฟล์ในเครื่อง หรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดทำงานตลอดเวลา, มีการหยุดชะงักจากการพักเครื่อง/รีบูตน้อยกว่า, สิทธิ์สะอาดกว่า, ดูแลให้ทำงานต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานจริงได้ไม่มีปัญหา แต่คาดว่าจะมีช่วงหยุดเมื่อเครื่องพักหรืออัปเดต

    หากคุณต้องการข้อดีของทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **Node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec ในเครื่อง ดู [Node](/th/nodes)
    สำหรับแนวทางด้านความปลอดภัย อ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และ OS ที่แนะนำคืออะไร?">
    OpenClaw มีน้ำหนักเบา สำหรับ Gateway พื้นฐาน + ช่องแชตหนึ่งช่อง:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB หรือมากกว่าเพื่อเผื่อทรัพยากร (บันทึก, สื่อ, หลายช่อง) เครื่องมือ Node และการทำ browser automation อาจใช้ทรัพยากรมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้ง Linux ผ่านการทดสอบดีที่สุดบนระบบนั้น

    เอกสาร: [Linux](/th/platforms/linux), [โฮสติ้ง VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันสามารถรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้ปฏิบัติต่อ VM เหมือนกับ VPS: ต้องเปิดอยู่ตลอดเวลา, เข้าถึงได้, และมี
    RAM เพียงพอสำหรับ Gateway และช่องใดๆ ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB หรือมากกว่าหากคุณรันหลายช่อง, browser automation, หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    หากคุณใช้ Windows, **WSL2 คือการตั้งค่าแบบ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด ดู [Windows](/th/platforms/windows), [โฮสติ้ง VPS](/th/vps)
    หากคุณกำลังรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (โมเดล, เซสชัน, gateway, ความปลอดภัย, และอื่นๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
