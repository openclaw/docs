---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการเรียกใช้ครั้งแรก
    - การเลือกการยืนยันตัวตนและการสมัครใช้งานผู้ให้บริการ
    - ไม่สามารถเข้าถึง docs.openclaw.ai, ไม่สามารถเปิดแดชบอร์ดได้, การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นใช้งานอย่างรวดเร็วและการตั้งค่าในการเรียกใช้ครั้งแรก — การติดตั้ง, การเริ่มต้นใช้งาน, การตรวจสอบสิทธิ์, การสมัครสมาชิก, ความล้มเหลวเริ่มแรก'
title: 'คำถามที่พบบ่อย: การตั้งค่าเมื่อเริ่มใช้งานครั้งแรก'
x-i18n:
    generated_at: "2026-05-07T13:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  คำถามและคำตอบสำหรับการเริ่มต้นอย่างรวดเร็วและการใช้งานครั้งแรก สำหรับการใช้งานประจำวัน โมเดล การยืนยันตัวตน เซสชัน
  และการแก้ปัญหา โปรดดู [คำถามที่พบบ่อย](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดปัญหา วิธีที่เร็วที่สุดในการแก้">
    ใช้เอเจนต์ AI ภายในเครื่องที่สามารถ **เห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณี "ฉันติดปัญหา" ส่วนใหญ่เป็น **ปัญหาการตั้งค่าหรือสภาพแวดล้อมภายในเครื่อง** ที่
    ผู้ช่วยระยะไกลตรวจสอบไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่านรีโป รันคำสั่ง ตรวจสอบบันทึก และช่วยแก้การตั้งค่า
    ระดับเครื่องของคุณได้ (PATH, services, permissions, auth files) ให้เครื่องมือเหล่านี้เข้าถึง **ซอร์สทั้งหมดที่ checkout มา** ผ่าน
    การติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    คำสั่งนี้ติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสาร และ
    วิเคราะห์เวอร์ชันจริงที่คุณกำลังใช้งานได้ คุณสามารถสลับกลับไปใช้เวอร์ชันเสถียรภายหลังได้เสมอ
    โดยรันตัวติดตั้งใหม่โดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับ** การแก้ไข (ทีละขั้นตอน) แล้วค่อยสั่งรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ทำให้การเปลี่ยนแปลงเล็กและตรวจสอบย้อนหลังได้ง่ายขึ้น

    หากคุณพบข้อบกพร่องจริงหรือวิธีแก้ โปรดสร้าง GitHub issue หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์ผลลัพธ์เมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: ภาพรวมอย่างรวดเร็วของสถานะ gateway/agent + การตั้งค่าพื้นฐาน
    - `openclaw models status`: ตรวจสอบ provider auth + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบและซ่อมปัญหา config/state ที่พบบ่อย

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    วงจรดีบักอย่างรวดเร็ว: [60 วินาทีแรกหากมีบางอย่างเสีย](/th/help/faq#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [อัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามอยู่เรื่อย ๆ เหตุผลการข้ามหมายความว่าอย่างไร?">
    เหตุผลทั่วไปที่ Heartbeat ถูกข้าม:

    - `quiet-hours`: อยู่นอกช่วง active-hours ที่ตั้งค่าไว้
    - `empty-heartbeat-file`: `HEARTBEAT.md` มีอยู่ แต่มีเพียงโครงว่างว่างหรือมีเฉพาะส่วนหัว
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดใช้งานอยู่ แต่ยังไม่มีช่วงเวลางานใดถึงกำหนด
    - `alerts-disabled`: ปิดการมองเห็น Heartbeat ทั้งหมด (`showOk`, `showAlerts`, และ `useIndicator` ปิดทั้งหมด)

    ในโหมดงาน เวลาครบกำหนดจะเลื่อนไปข้างหน้าก็ต่อเมื่อการรัน Heartbeat จริง
    เสร็จสิ้นแล้วเท่านั้น การรันที่ถูกข้ามจะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [Automation & Tasks](/th/automation).

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    รีโปแนะนำให้รันจากซอร์สและใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดยังสามารถสร้างแอสเซ็ต UI ให้อัตโนมัติได้ด้วย หลัง onboarding โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

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
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL แดชบอร์ดแบบสะอาด (ไม่มีโทเค็นใน URL) ทันทีหลัง onboarding และยังพิมพ์ลิงก์ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ออกมาในเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะยืนยันตัวตนแดชบอร์ดบน localhost เทียบกับระยะไกลได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอ shared-secret auth ให้วางโทเค็นหรือรหัสผ่านที่ตั้งค่าไว้ลงในการตั้งค่า Control UI
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้ตั้งค่า shared secret ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ได้อยู่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คง bind เป็น loopback ไว้ รัน `openclaw gateway --tailscale serve` เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` ส่วนหัว identity จะผ่าน Control UI/WebSocket auth (ไม่ต้องวาง shared secret ถือว่าเชื่อถือ gateway host); HTTP APIs ยังต้องใช้ shared-secret auth เว้นแต่คุณจะจงใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม Serve auth ที่ผิดพลาดพร้อมกันจาก client เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึก ทำให้การลองซ้ำที่ผิดครั้งที่สองสามารถแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่า password auth) เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันในการตั้งค่าแดชบอร์ด
    - **รีเวิร์สพร็อกซีที่รับรู้ identity**: วาง Gateway ไว้หลังพร็อกซีที่เชื่อถือได้ กำหนดค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของพร็อกซี พร็อกซี loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/` shared-secret auth ยังมีผลผ่าน tunnel ให้วางโทเค็นหรือรหัสผ่านที่ตั้งค่าไว้หากถูกถาม

    ดู [Dashboard](/th/web/dashboard) และ [Web surfaces](/th/web) สำหรับโหมด bind และรายละเอียด auth

  </Accordion>

  <Accordion title="ทำไมจึงมี config การอนุมัติ exec สองรายการสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อ approval prompts ไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องทางนั้นทำหน้าที่เป็น native approval client สำหรับ exec approvals

    นโยบาย exec ของโฮสต์ยังคงเป็นด่านอนุมัติจริง การตั้งค่าแชตควบคุมเพียงว่า approval
    prompts จะแสดงที่ไหนและผู้คนตอบได้อย่างไร

    ในการตั้งค่าส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งคู่:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่านเส้นทางที่ใช้ร่วมกัน
    - หาก native channel ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย OpenClaw จะเปิด DM-first native approvals ให้อัตโนมัติเมื่อไม่ได้ตั้งค่า `channels.<channel>.execApprovals.enabled` หรือเป็น `"auto"`
    - เมื่อมี native approval cards/buttons ให้ใช้งาน UI แบบ native นั้นคือเส้นทางหลัก เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์เครื่องมือระบุว่า chat approvals ใช้งานไม่ได้ หรือ manual approval เป็นเส้นทางเดียวเท่านั้น
    - ใช้ `approvals.exec` เฉพาะเมื่อ prompts ต้องถูกส่งต่อไปยังแชตอื่นหรือห้อง ops ที่ระบุไว้อย่างชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้ approval prompts ถูกโพสต์กลับไปยังห้อง/topic ต้นทางอย่างชัดเจน
    - Plugin approvals แยกออกมาอีกชั้น: โดยค่าเริ่มต้นใช้ `/approve` ในแชตเดียวกัน มี `approvals.plugin` สำหรับส่งต่อเป็นตัวเลือก และมีเพียง native channels บางรายการที่ยังคงซ้อนการจัดการ plugin-approval-native ไว้

    สรุปสั้น ๆ: forwarding ใช้สำหรับการกำหนดเส้นทาง ส่วน native client config ใช้สำหรับ UX เฉพาะช่องทางที่สมบูรณ์ขึ้น
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 core** และพื้นที่ดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 สามารถรันได้**

    หากต้องการพื้นที่เผื่อเพิ่มเติม (บันทึก สื่อ บริการอื่น) แนะนำให้ใช้ **2GB** แต่
    ไม่ใช่ขั้นต่ำที่บังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับ
    หน้าจอ/กล้อง/canvas ภายในเครื่อง หรือการสั่งรันคำสั่ง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับสำหรับการติดตั้งบน Raspberry Pi ไหม?">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีจุดสะดุดบ้าง

    - ใช้ OS แบบ **64-bit** และใช้ Node >= 22
    - ควรใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้ดูบันทึกและอัปเดตได้เร็ว
    - เริ่มโดยยังไม่เปิด channels/skills จากนั้นค่อยเพิ่มทีละรายการ
    - หากพบปัญหา binary แปลก ๆ โดยทั่วไปจะเป็นปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [Install](/th/install)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ wake up my friend / onboarding ไม่ hatch ควรทำอย่างไร?">
    หน้าจอนั้นขึ้นอยู่กับว่า Gateway เข้าถึงได้และยืนยันตัวตนแล้วหรือไม่ TUI ยังส่ง
    "Wake up, my friend!" อัตโนมัติในการ hatch ครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นโดย **ไม่มีคำตอบ**
    และโทเค็นยังอยู่ที่ 0 แปลว่าเอเจนต์ไม่เคยรัน

    1. รีสตาร์ท Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. ตรวจสอบสถานะ + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. หากยังค้างอยู่ ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่า tunnel/การเชื่อมต่อ Tailscale ทำงานอยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [Remote access](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปยังเครื่องใหม่ (Mac mini) โดยไม่ต้องทำ onboarding ใหม่ได้ไหม?">
    ได้ คัดลอก **state directory** และ **workspace** จากนั้นรัน Doctor หนึ่งครั้ง วิธีนี้
    จะรักษาบอตของคุณให้ "เหมือนเดิมทุกประการ" (memory, session history, auth และ channel
    state) ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ทบริการ Gateway

    วิธีนี้จะเก็บ config, auth profiles, WhatsApp creds, sessions และ memory ไว้ หากคุณอยู่ใน
    โหมดระยะไกล โปรดจำไว้ว่า gateway host เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณขึ้น GitHub คุณกำลังสำรอง
    **memory + bootstrap files** แต่ **ไม่ได้** สำรอง session history หรือ auth สิ่งเหล่านี้อยู่
    ใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [Migrating](/th/install/migrating), [Where things live on disk](/th/help/faq#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูสิ่งใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ตรวจสอบ changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ล่าสุดอยู่ด้านบน หากส่วนบนสุดถูกทำเครื่องหมายว่า **Unreleased** ส่วนถัดไปที่มีวันที่
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการจะถูกจัดกลุ่มตาม **Highlights**, **Changes** และ
    **Fixes** (รวมถึงส่วนเอกสาร/อื่น ๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้าถึง docs.openclaw.ai ไม่ได้ (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` อย่างไม่ถูกต้องผ่าน Xfinity
    Advanced Security ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ในรายการอนุญาต แล้วลองใหม่
    โปรดช่วยเราเลิกบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าถึงไซต์ไม่ได้ เอกสารจะถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่สายโค้ดแยกกัน:

    - `latest` = stable
    - `beta` = บิลด์ล่วงหน้าสำหรับทดสอบ

    โดยทั่วไป release แบบ stable จะลงที่ **beta** ก่อน จากนั้นขั้นตอน
    promotion ที่ชัดเจนจะย้ายเวอร์ชันเดียวกันนั้นไปที่ `latest` Maintainer ยังสามารถ
    publish ตรงไปที่ `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลัง promotion

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev ให้ดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลัง promotion)
    **Dev** คือ head ที่เคลื่อนที่ของ `main` (git); เมื่อ publish แล้ว จะใช้ npm dist-tag `dev`

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

    คำสั่งนี้จะสลับไปที่ branch `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งที่แก้ไขได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    นั่นจะให้ repo ในเครื่องที่คุณแก้ไขได้ แล้วอัปเดตผ่าน git

    หากคุณต้องการ clone ใหม่แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="การติดตั้งและ onboarding มักใช้เวลานานเท่าไร?">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวน channels/models ที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูปดีบักแบบเร็วใน [ฉันค้างอยู่](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะดู feedback เพิ่มเติมได้อย่างไร?">
    รันตัวติดตั้งอีกครั้งพร้อม **output แบบละเอียด**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง Beta พร้อม output แบบละเอียด:

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

  <Accordion title="การติดตั้ง Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหา Windows ที่พบบ่อยมีสองข้อ:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นรันตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบ path:

      ```powershell
      npm config get prefix
      ```

    - เพิ่ม directory นั้นไปยัง user PATH ของคุณ (บน Windows ไม่ต้องมี suffix `\bin`; บนระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากคุณต้องการ setup Windows ที่ราบรื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบ native
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="output ของ exec บน Windows แสดงข้อความภาษาจีนผิดเพี้ยน - ฉันควรทำอย่างไร?">
    โดยปกติเป็นปัญหา console code page ไม่ตรงกันบน shell ของ Windows แบบ native

    อาการ:

    - output ของ `system.run`/`exec` render ภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันดูปกติใน terminal profile อื่น

    วิธีเลี่ยงแบบเร็วใน PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    จากนั้น restart Gateway แล้วลองคำสั่งของคุณอีกครั้ง:

    ```powershell
    openclaw gateway restart
    ```

    หากคุณยัง reproduce ปัญหานี้บน OpenClaw ล่าสุดได้ ให้ติดตาม/รายงานที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่าได้อย่างไร?">
    ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณมีซอร์สและเอกสารทั้งหมดในเครื่อง จากนั้นถาม
    bot ของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - ทางลัด Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - คำแนะนำแบบครบถ้วน: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [ติดตั้งและอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    VPS ที่เป็น Linux ใด ๆ ก็ใช้ได้ ติดตั้งบน server แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือติดตั้ง cloud/VPS อยู่ที่ไหน?">
    เรามี **hosting hub** สำหรับผู้ให้บริการทั่วไป เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (ผู้ให้บริการทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีทำงานใน cloud: **Gateway รันบน server** และคุณเข้าถึงได้
    จาก laptop/phone ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บน server ดังนั้นให้ถือว่า host เป็น source of truth และสำรองข้อมูลไว้

    คุณสามารถ pair **nodes** (Mac/iOS/Android/headless) กับ Gateway บน cloud นั้นเพื่อเข้าถึง
    screen/camera/canvas ในเครื่อง หรือรันคำสั่งบน laptop ของคุณ ขณะที่คง
    Gateway ไว้ใน cloud

    Hub: [แพลตฟอร์ม](/th/platforms) การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** flow การอัปเดตอาจ restart
    Gateway (ซึ่งทำให้ session ที่ใช้งานอยู่หลุด), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจถามให้ยืนยัน ปลอดภัยกว่า: รันการอัปเดตจาก shell ในฐานะ operator

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณต้อง automate จาก agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือ path setup ที่แนะนำ ใน **local mode** คำสั่งนี้จะพาคุณผ่าน:

    - **การตั้งค่า Model/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือก model ในเครื่อง เช่น LM Studio)
    - ตำแหน่ง **Workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง bundled channel plugins เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **Health checks** และการเลือก **Skills**

    นอกจากนี้ยังเตือนหาก model ที่คุณกำหนดค่าไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription ของ Claude หรือ OpenAI เพื่อรันสิ่งนี้ไหม?">
    ไม่จำเป็น คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **models แบบ local-only** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ Subscription (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธีเสริมสำหรับ authenticate providers เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งที่ใช้งานจริงคือ:

    - **Anthropic API key**: การคิดค่าบริการ Anthropic API ปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: staff ของ Anthropic
      บอกเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw กำลังถือว่าการใช้งาน `claude -p`
      ได้รับอนุญาตสำหรับ integration นี้ เว้นแต่ Anthropic จะ publish policy ใหม่

    สำหรับ gateway hosts ที่ใช้งานระยะยาว Anthropic API keys ยังเป็น setup ที่
    คาดเดาได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับ
    tools ภายนอกอย่าง OpenClaw

    OpenClaw ยังรองรับตัวเลือกแบบ hosted subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [Local models](/th/gateway/local-models), [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่มี API key ได้ไหม?">
    ได้

    staff ของ Anthropic บอกเราว่าการใช้งาน Claude CLI แบบ OpenClaw-style ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้งาน `claude -p` ได้รับอนุญาต
    สำหรับ integration นี้ เว้นแต่ Anthropic จะ publish policy ใหม่ หากคุณต้องการ
    setup ฝั่ง server ที่คาดเดาได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับ Claude subscription auth (Claude Pro หรือ Max) ไหม?">
    รองรับ

    staff ของ Anthropic บอกเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การ reuse Claude CLI และการใช้งาน `claude -p` ได้รับอนุญาตสำหรับ integration นี้
    เว้นแต่ Anthropic จะ publish policy ใหม่

    Anthropic setup-token ยังพร้อมใช้งานเป็น path token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw prefer การ reuse Claude CLI และ `claude -p` เมื่อพร้อมใช้งาน
    สำหรับ workloads แบบ production หรือ multi-user การ auth ด้วย Anthropic API key ยังเป็น
    ทางเลือกที่ปลอดภัยและคาดเดาได้มากกว่า หากคุณต้องการตัวเลือก hosted
    แบบ subscription-style อื่นใน OpenClaw โปรดดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/glm)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    นั่นหมายความว่า **quota/rate limit ของ Anthropic** ของคุณหมดแล้วสำหรับ window ปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอให้ window reset หรือ upgrade plan ของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับ usage/billing และเพิ่ม limits ตามจำเป็น

    หากข้อความเป็น:
    `Extra usage is required for long context requests` โดยเฉพาะ คำขอกำลังพยายามใช้
    Anthropic 1M context beta (`context1m: true`) ซึ่งทำงานได้เฉพาะเมื่อ
    credential ของคุณมีสิทธิ์สำหรับการเรียกเก็บเงินแบบ long-context (การเรียกเก็บเงินด้วย API key หรือ
    เส้นทาง OpenClaw Claude-login ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **fallback model** เพื่อให้ OpenClaw ตอบกลับต่อได้ในขณะที่ provider ถูกจำกัดอัตราการใช้งาน
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth), และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    รองรับ OpenClaw มี provider **Amazon Bedrock (Converse)** ที่มาพร้อมในตัว เมื่อมี AWS env markers อยู่ OpenClaw สามารถค้นหา catalog Bedrock แบบ streaming/text โดยอัตโนมัติและรวมเป็น provider `amazon-bedrock` โดยนัยได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจนหรือเพิ่มรายการ provider ด้วยตนเอง ดู [Amazon Bedrock](/th/providers/bedrock) และ [provider โมเดล](/th/providers/models) หากคุณต้องการ managed key flow พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="Codex auth ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` กับ `agentRuntime.id: "codex"` สำหรับการตั้งค่าทั่วไป:
    auth แบบสมัครสมาชิก ChatGPT/Codex พร้อมการประมวลผล native Codex app-server ใช้
    `openai-codex/gpt-5.5` เฉพาะเมื่อคุณต้องการ Codex OAuth ผ่าน runtime
    Codex เริ่มต้น การเข้าถึงด้วย OpenAI API-key โดยตรงยังคงใช้ได้สำหรับพื้นผิว
    OpenAI API ที่ไม่ใช่ agent และสำหรับโมเดล agent ผ่านโปรไฟล์ API-key
    `openai-codex` แบบเรียงลำดับ
    ดู [provider โมเดล](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง openai-codex?">
    `openai-codex` คือ provider และ auth-profile id สำหรับ ChatGPT/Codex OAuth
    config รุ่นเก่ายังเคยใช้เป็นคำนำหน้าโมเดลด้วย:

    - `openai/gpt-5.5` = auth แบบสมัครสมาชิก ChatGPT/Codex พร้อม native Codex runtime สำหรับ agent turns
    - `openai-codex/gpt-5.5` = เส้นทางโมเดลรุ่นเก่าที่ซ่อมโดย `openclaw doctor --fix`
    - `openai/gpt-5.5` บวกโปรไฟล์ API-key `openai-codex` แบบเรียงลำดับ = auth ด้วย API-key สำหรับโมเดล agent ของ OpenAI
    - `openai-codex:...` = auth profile id ไม่ใช่ model ref

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการ auth แบบสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` คงค่า model ref เป็น
    `openai/gpt-5.5`; model refs `openai-codex/*` เป็น config รุ่นเก่าที่
    `openclaw doctor --fix` เขียนใหม่

  </Accordion>

  <Accordion title="ทำไมขีดจำกัด Codex OAuth จึงต่างจาก ChatGPT web ได้?">
    Codex OAuth ใช้ quota windows ที่ OpenAI จัดการและขึ้นกับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดง provider usage/quota windows ที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ ChatGPT-web ให้เป็น
    การเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform
    โดยตรง ให้ใช้ `openai/*` พร้อม API key

  </Accordion>

  <Accordion title="รองรับ OpenAI subscription auth (Codex OAuth) หรือไม่?">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างเต็มรูปแบบ
    OpenAI อนุญาตการใช้ subscription OAuth อย่างชัดเจนในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw Onboarding สามารถเรียกใช้ OAuth flow ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [provider โมเดล](/th/concepts/model-providers), และ [Onboarding (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร?">
    Gemini CLI ใช้ **plugin auth flow** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่บน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังเข้าสู่ระบบ: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway

    สิ่งนี้จะเก็บ OAuth tokens ใน auth profiles บนโฮสต์ gateway รายละเอียด: [provider โมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดล local เหมาะสำหรับแชตทั่วไปหรือไม่?">
    โดยปกติไม่เหมาะ OpenClaw ต้องการ context ขนาดใหญ่ + safety ที่แข็งแรง; การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็น ให้รัน build โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันในเครื่องได้ (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/quantized เพิ่มความเสี่ยง prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะเก็บ traffic ของ hosted model ไว้ในภูมิภาคเฉพาะได้อย่างไร?">
    เลือก endpoints ที่ตรึงภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM; เลือก variant ที่โฮสต์ในสหรัฐฯ เพื่อให้ข้อมูลอยู่ในภูมิภาคนั้น คุณยังคงแสดง Anthropic/OpenAI ร่วมกับตัวเลือกเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งานขณะเคารพ provider แบบกำหนดภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux (Windows ผ่าน WSL2) ได้ Mac mini เป็นตัวเลือกเสริม - บางคน
    ซื้อมาเป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก, home server หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac เฉพาะ **เครื่องมือที่ใช้ได้เฉพาะ macOS** เท่านั้น สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันบน Mac ใดก็ได้ และ Gateway สามารถรันบน Linux หรือที่อื่นได้ หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะ macOS ให้รัน Gateway บน Mac หรือจับคู่ macOS node

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes), [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องมี Mac mini เพื่อรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS บางเครื่อง** ที่ลงชื่อเข้าใช้ Messages ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ขณะที่ Gateway สามารถรันบน Linux หรือที่อื่นได้

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และรันเซิร์ฟเวอร์ BlueBubbles บน Mac เครื่องใดก็ได้ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes),
    [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="หากฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อกับ MacBook Pro ได้ไหม?">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่ขนาน) Nodes ไม่ได้รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น screen/camera/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือ node host และจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดู

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม?">
    **ไม่แนะนำ** Bun เราพบ runtime bugs โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ gateways ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน gateway ที่ไม่ใช่ production
    โดยไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom?">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ชื่อผู้ใช้บอท

    การตั้งค่าจะถามหา numeric user IDs เท่านั้น หากคุณมีรายการ `@username` รุ่นเก่าใน config อยู่แล้ว `openclaw doctor --fix` สามารถพยายาม resolve ให้ได้

    ปลอดภัยกว่า (ไม่มีบอทบุคคลที่สาม):

    - DM บอทของคุณ จากนั้นรัน `openclaw logs --follow` และอ่าน `from.id`

    Official Bot API:

    - DM บอทของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` และอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกับ OpenClaw instances คนละตัวได้หรือไม่?">
    ได้ ผ่าน **multi-agent routing** ผูก WhatsApp **DM** ของผู้ส่งแต่ละคน (peer `kind: "direct"`, ผู้ส่ง E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนได้ workspace และ session store ของตนเอง การตอบกลับยังคงมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็น global ต่อบัญชี WhatsApp ดู [Multi-Agent Routing](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรัน agent "fast chat" และ agent "Opus for coding" ได้ไหม?'>
    ได้ ใช้ multi-agent routing: ให้ agent แต่ละตัวมีโมเดลเริ่มต้นของตนเอง จากนั้นผูก inbound routes (บัญชี provider หรือ peers เฉพาะ) กับ agent แต่ละตัว ตัวอย่าง config อยู่ใน [Multi-Agent Routing](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ทำงานบน Linux ได้ไหม?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าอย่างรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจสอบให้แน่ใจว่า service PATH มี `/home/linuxbrew/.linuxbrew/bin` (หรือ brew prefix ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน non-login shells
    build ล่าสุดยัง prepend common user bin dirs บน Linux systemd services ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, และ `FNM_DIR` เมื่อตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้ง git แบบ hackable และการติดตั้ง npm">
    - **การติดตั้งแบบ Hackable (git):** checkout source เต็มรูปแบบ แก้ไขได้ เหมาะที่สุดสำหรับ contributors
      คุณรัน builds ในเครื่องและ patch code/docs ได้
    - **การติดตั้ง npm:** ติดตั้ง global CLI ไม่มี repo เหมาะที่สุดสำหรับ "แค่รันใช้งาน"
      อัปเดตมาจาก npm dist-tags

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้ง npm และ git ภายหลังได้ไหม?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **ไม่ลบข้อมูลของคุณ** - แค่เปลี่ยนการติดตั้งโค้ด OpenClaw เท่านั้น
    state (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) ของคุณจะไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่าง mode switch ที่วางแผนไว้ก่อน updater จะรัน
    Doctor follow-ups, รีเฟรช plugin sources สำหรับ channel เป้าหมาย และ
    รีสตาร์ท gateway เว้นแต่คุณจะส่ง `--no-restart`

    installer สามารถบังคับโหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS?">
    คำตอบสั้น ๆ: **หากคุณต้องการความน่าเชื่อถือ 24/7 ให้ใช้ VPS** หากคุณต้องการ
    ความยุ่งยากต่ำที่สุดและยอมรับการ sleep/restarts ได้ ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ภายในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์ เข้าถึงไฟล์ภายในเครื่องได้โดยตรง มีหน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** การพักเครื่อง/เครือข่ายหลุด = การเชื่อมต่อถูกตัด การอัปเดต/รีบูตระบบปฏิบัติการทำให้สะดุด ต้องเปิดเครื่องไว้ตลอด

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ทำงานจาก VPS ได้ทั้งหมด ข้อแลกเปลี่ยนที่แท้จริงมีเพียง **เบราว์เซอร์แบบไม่มีหน้าจอ** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยเจอ Gateway หลุดมาก่อน การใช้งานภายในเครื่องเหมาะมากเมื่อคุณกำลังใช้ Mac อยู่และต้องการเข้าถึงไฟล์ภายในเครื่องหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** เปิดตลอดเวลา มีการสะดุดจากการพักเครื่อง/รีบูตน้อยกว่า สิทธิ์สะอาดกว่า ดูแลให้รันต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** เหมาะสำหรับการทดสอบและการใช้งานจริงขณะใช้อยู่ แต่คาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่องพักหรืออัปเดต

    หากคุณต้องการข้อดีของทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec ภายในเครื่อง ดู [Nodes](/th/nodes)
    สำหรับคำแนะนำด้านความปลอดภัย โปรดอ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และระบบปฏิบัติการที่แนะนำคืออะไร?">
    OpenClaw ใช้ทรัพยากรน้อย สำหรับ Gateway พื้นฐาน + หนึ่งช่องทางแชต:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB, ดิสก์ประมาณ 500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อเผื่อทรัพยากร (บันทึก สื่อ หลายช่องทาง) เครื่องมือ Node และการทำงานอัตโนมัติของเบราว์เซอร์อาจใช้ทรัพยากรสูง

    ระบบปฏิบัติการ: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ได้รับการทดสอบดีที่สุดที่นั่น

    เอกสาร: [Linux](/th/platforms/linux), [การโฮสต์ VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้ปฏิบัติต่อ VM เหมือน VPS: ต้องเปิดอยู่เสมอ เข้าถึงได้ และมี RAM เพียงพอ
    สำหรับ Gateway และช่องทางใด ๆ ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำสุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป หากคุณรันหลายช่องทาง การทำงานอัตโนมัติของเบราว์เซอร์ หรือเครื่องมือสื่อ
    - **ระบบปฏิบัติการ:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    หากคุณใช้ Windows, **WSL2 เป็นรูปแบบการตั้งค่า VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด
    ดู [Windows](/th/platforms/windows), [การโฮสต์ VPS](/th/vps)
    หากคุณรัน macOS ใน VM โปรดดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (โมเดล เซสชัน Gateway ความปลอดภัย และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
