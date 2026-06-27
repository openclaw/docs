---
read_when:
    - การติดตั้งใหม่ การเริ่มต้นใช้งานค้าง หรือข้อผิดพลาดในการเรียกใช้ครั้งแรก
    - การเลือกการยืนยันตัวตนและการสมัครใช้งานผู้ให้บริการ
    - เข้าถึง docs.openclaw.ai ไม่ได้ เปิดแดชบอร์ดไม่ได้ การติดตั้งค้าง
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นอย่างรวดเร็วและการตั้งค่าในการใช้งานครั้งแรก — การติดตั้ง, การเริ่มใช้งาน, การยืนยันตัวตน, การสมัครใช้งาน, ข้อผิดพลาดเริ่มต้น'
title: 'คำถามที่พบบ่อย: การตั้งค่าครั้งแรก'
x-i18n:
    generated_at: "2026-06-27T17:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  ถาม-ตอบสำหรับเริ่มต้นอย่างรวดเร็วและการรันครั้งแรก สำหรับการใช้งานประจำวัน โมเดล auth เซสชัน
  และการแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดอยู่ วิธีที่เร็วที่สุดในการไปต่อ">
    ใช้เอเจนต์ AI ในเครื่องที่สามารถ **มองเห็นเครื่องของคุณ** ได้ วิธีนี้มีประสิทธิภาพกว่าการถาม
    ใน Discord มาก เพราะกรณี "ฉันติดอยู่" ส่วนใหญ่เป็น **ปัญหาคอนฟิกหรือสภาพแวดล้อมในเครื่อง** ที่
    ผู้ช่วยระยะไกลตรวจสอบไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้อ่าน repo, รันคำสั่ง, ตรวจสอบล็อก และช่วยแก้การตั้งค่าระดับเครื่อง
    ของคุณได้ (PATH, services, permissions, auth files) ให้ **ซอร์ส checkout แบบเต็ม** แก่เครื่องมือ
    ผ่านการติดตั้งแบบแก้ไขได้ (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์อ่านโค้ด + เอกสาร และ
    ให้เหตุผลกับเวอร์ชันจริงที่คุณกำลังรันได้ คุณสามารถสลับกลับไปใช้ stable ภายหลังได้เสมอ
    โดยรันตัวติดตั้งอีกครั้งโดยไม่มี `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและควบคุมดูแล** การแก้ไข (ทีละขั้นตอน) จากนั้นค่อยรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ทำให้การเปลี่ยนแปลงเล็กและตรวจสอบง่ายขึ้น

    หากคุณพบข้อบกพร่องหรือวิธีแก้จริง โปรดเปิด issue บน GitHub หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มด้วยคำสั่งเหล่านี้ (แชร์เอาต์พุตเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: ภาพรวมเร็วของสุขภาพ gateway/agent + คอนฟิกพื้นฐาน
    - `openclaw models status`: ตรวจสอบ provider auth + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบและซ่อมปัญหาคอนฟิก/สถานะทั่วไป

    การตรวจสอบ CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    ลูปดีบักเร็ว: [60 วินาทีแรกหากมีบางอย่างเสีย](/th/help/faq#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กตัวติดตั้ง](/th/install/installer), [อัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามอยู่เรื่อย ๆ เหตุผลการข้ามหมายถึงอะไร?">
    เหตุผลการข้าม Heartbeat ที่พบบ่อย:

    - `quiet-hours`: อยู่นอกช่วง active-hours ที่กำหนดค่าไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเฉพาะช่องว่าง ความเห็น หัวข้อ fence หรือโครงรายการตรวจสอบว่าง
    - `no-tasks-due`: โหมดงานของ `HEARTBEAT.md` เปิดอยู่ แต่ยังไม่มีช่วงเวลางานใดถึงกำหนด
    - `alerts-disabled`: การแสดงผล Heartbeat ทั้งหมดถูกปิด (`showOk`, `showAlerts`, และ `useIndicator` ปิดทั้งหมด)

    ในโหมดงาน timestamp ที่ถึงกำหนดจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน Heartbeat จริง
    เสร็จสมบูรณ์ การรันที่ถูกข้ามจะไม่ทำเครื่องหมายงานว่าเสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [Automation](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo แนะนำให้รันจากซอร์สและใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดสามารถ build แอสเซ็ต UI โดยอัตโนมัติได้ด้วย หลัง onboarding โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

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

  <Accordion title="ฉันจะเปิด dashboard หลัง onboarding ได้อย่างไร?">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL dashboard ที่สะอาด (ไม่มี token) ทันทีหลัง onboarding และพิมพ์ลิงก์ไว้ในสรุปด้วย เปิดแท็บนั้นค้างไว้ หากไม่ได้เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ไว้บนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="ฉันจะ authenticate dashboard บน localhost เทียบกับ remote ได้อย่างไร?">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอ shared-secret auth ให้วาง token หรือรหัสผ่านที่กำหนดค่าไว้ลงในการตั้งค่า Control UI
    - แหล่ง token: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่ได้กำหนดค่า shared secret ให้สร้าง token ด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่ localhost:**

    - **Tailscale Serve** (แนะนำ): คง bind loopback ไว้ รัน `openclaw gateway --tailscale serve` เปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true` identity headers จะผ่าน auth ของ Control UI/WebSocket (ไม่ต้องวาง shared secret โดยถือว่า gateway host เชื่อถือได้); HTTP APIs ยังต้องใช้ shared-secret auth เว้นแต่คุณตั้งใจใช้ private-ingress `none` หรือ trusted-proxy HTTP auth
      ความพยายาม Serve auth ที่ไม่ถูกต้องพร้อมกันจาก client เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึก ดังนั้นการลองผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่า password auth) เปิด `http://<tailscale-ip>:18789/` จากนั้นวาง shared secret ที่ตรงกันในการตั้งค่า dashboard
    - **reverse proxy ที่รู้ identity**: วาง Gateway ไว้หลัง proxy ที่เชื่อถือได้ กำหนดค่า `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของ proxy proxy loopback บน host เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/` shared-secret auth ยังมีผลผ่าน tunnel; วาง token หรือรหัสผ่านที่กำหนดค่าไว้หากมี prompt

    ดู [Dashboard](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับโหมด bind และรายละเอียด auth

  </Accordion>

  <Accordion title="ทำไมจึงมีคอนฟิก exec approval สองชุดสำหรับการอนุมัติผ่านแชต?">
    ทั้งสองควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อ prompt การอนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ channel นั้นทำหน้าที่เป็น client การอนุมัติ native สำหรับ exec approvals

    นโยบาย exec ของ host ยังเป็นด่านอนุมัติจริง คอนฟิกแชตควบคุมแค่ว่า prompt การอนุมัติ
    จะปรากฏที่ใดและผู้คนจะตอบได้อย่างไร

    ในการตั้งค่าส่วนใหญ่คุณ **ไม่** จำเป็นต้องใช้ทั้งคู่:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะทำงานผ่าน path ที่ใช้ร่วมกัน
    - หาก channel native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย ตอนนี้ OpenClaw จะเปิดใช้การอนุมัติ native แบบ DM-first โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `channels.<channel>.execApprovals.enabled` หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติ native ให้ใช้ UI native นั้นเป็น path หลัก; เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์เครื่องมือบอกว่า chat approvals ไม่พร้อมใช้งาน หรือ manual approval เป็น path เดียวเท่านั้น
    - ใช้ `approvals.exec` เฉพาะเมื่อ prompt ต้องถูกส่งต่อไปยังแชตอื่นหรือห้อง ops ที่ระบุชัดเจนด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้ prompt การอนุมัติถูกโพสต์กลับไปยังห้อง/topic ต้นทางอย่างชัดเจน
    - การอนุมัติ Plugin แยกออกไปอีก: ใช้ `/approve` ในแชตเดียวกันโดยค่าเริ่มต้น มีการส่งต่อ `approvals.plugin` เป็นตัวเลือก และมีเพียงบาง channel native ที่ยังคงจัดการ plugin-approval-native เพิ่มเติม

    เวอร์ชันสั้น: forwarding มีไว้สำหรับ routing ส่วนคอนฟิก native client มีไว้สำหรับ UX เฉพาะ channel ที่สมบูรณ์ขึ้น
    ดู [Exec Approvals](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร?">
    ต้องใช้ Node **>= 22** แนะนำให้ใช้ `pnpm` ไม่แนะนำให้ใช้ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้ไหม?">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่า **RAM 512MB-1GB**, **1 core** และดิสก์ประมาณ **500MB**
    เพียงพอสำหรับการใช้งานส่วนตัว และระบุว่า **Raspberry Pi 4 รันได้**

    หากคุณต้องการเผื่อพื้นที่เพิ่ม (ล็อก สื่อ บริการอื่น) แนะนำ **2GB** แต่ไม่ใช่
    ขั้นต่ำที่บังคับ

    เคล็ดลับ: Raspberry Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณสำหรับ
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือการรันคำสั่ง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีเคล็ดลับสำหรับการติดตั้งบน Raspberry Pi ไหม?">
    เวอร์ชันสั้น: ใช้งานได้ แต่คาดว่าจะมีจุดขรุขระบ้าง

    - ใช้ OS แบบ **64-bit** และคง Node >= 22
    - แนะนำให้ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณดูล็อกและอัปเดตได้เร็ว
    - เริ่มโดยไม่ใช้ channels/skills แล้วค่อยเพิ่มทีละรายการ
    - หากเจอปัญหา binary แปลก ๆ โดยปกติจะเป็นปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="ค้างอยู่ที่ wake up my friend / onboarding จะไม่ hatch ตอนนี้ต้องทำอย่างไร?">
    หน้าจอนั้นขึ้นกับการที่ Gateway เข้าถึงได้และผ่านการ authenticate แล้ว TUI ยังส่ง
    "Wake up, my friend!" โดยอัตโนมัติเมื่อ hatch ครั้งแรก หากคุณเห็นบรรทัดนั้นโดย **ไม่มีการตอบกลับ**
    และ token ยังคงเป็น 0 แสดงว่าเอเจนต์ไม่เคยรัน

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

    3. หากยังค้าง ให้รัน:

    ```bash
    openclaw doctor
    ```

    หาก Gateway เป็น remote ให้ตรวจสอบว่า tunnel/การเชื่อมต่อ Tailscale เปิดอยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันย้ายการตั้งค่าไปยังเครื่องใหม่ (Mac mini) โดยไม่ทำ onboarding ใหม่ได้ไหม?">
    ได้ คัดลอก **ไดเรกทอรีสถานะ** และ **workspace** จากนั้นรัน Doctor หนึ่งครั้ง วิธีนี้
    จะคง bot ของคุณให้ "เหมือนเดิมทุกประการ" (memory, ประวัติเซสชัน, auth และสถานะ channel)
    ตราบใดที่คุณคัดลอก **ทั้งสอง** ตำแหน่ง:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเดิม
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ทบริการ Gateway

    วิธีนี้จะเก็บรักษาคอนฟิก โปรไฟล์ auth, creds ของ WhatsApp, เซสชัน และ memory หากคุณอยู่ใน
    โหมด remote โปรดจำว่า gateway host เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ของคุณไปยัง GitHub คุณกำลังสำรอง
    **memory + bootstrap files** แต่ **ไม่ใช่** ประวัติเซสชันหรือ auth สิ่งเหล่านั้นอยู่
    ใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้าย](/th/install/migrating), [สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์](/th/help/faq#where-things-live-on-disk),
    [Agent workspace](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [โหมด remote](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูว่ามีอะไรใหม่ในเวอร์ชันล่าสุดได้ที่ไหน?">
    ตรวจสอบ changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการใหม่ล่าสุดอยู่ด้านบน หากส่วนบนสุดถูกทำเครื่องหมายว่า **Unreleased** ส่วนถัดไปที่มีวันที่
    คือเวอร์ชันล่าสุดที่เผยแพร่แล้ว รายการถูกจัดกลุ่มตาม **Highlights**, **Changes** และ
    **Fixes** (รวมถึงส่วนเอกสาร/อื่น ๆ เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้าถึง docs.openclaw.ai ไม่ได้ (ข้อผิดพลาด SSL)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` ผ่าน Xfinity
    Advanced Security อย่างไม่ถูกต้อง ให้ปิดใช้งานหรือเพิ่ม `docs.openclaw.ai` ใน allowlist แล้วลองอีกครั้ง
    โปรดช่วยเราเลิกบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าถึงไซต์ไม่ได้ เอกสารจะถูกมิเรอร์ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** คือ **npm dist-tags** ไม่ใช่สายโค้ดแยกกัน:

    - `latest` = stable
    - `beta` = บิลด์ระยะแรกสำหรับทดสอบ

    โดยปกติ release แบบ stable จะลงที่ **beta** ก่อน จากนั้นขั้นตอน
    โปรโมตอย่างชัดเจนจะย้ายเวอร์ชันเดียวกันนั้นไปยัง `latest` ผู้ดูแลยังสามารถ
    publish ตรงไปที่ `latest` ได้เมื่อจำเป็น นี่คือเหตุผลที่ beta และ stable อาจ
    ชี้ไปที่ **เวอร์ชันเดียวกัน** หลังจากโปรโมตแล้ว

    ดูสิ่งที่เปลี่ยนแปลง:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับคำสั่งติดตั้งแบบบรรทัดเดียวและความแตกต่างระหว่าง beta กับ dev โปรดดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta แตกต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังจากโปรโมตแล้ว)
    **Dev** คือ head ที่เคลื่อนไหวของ `main` (git); เมื่อ publish แล้ว จะใช้ npm dist-tag `dev`

    คำสั่งบรรทัดเดียว (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้ง Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [ช่องทางการพัฒนา](/th/install/development-channels) และ [แฟล็กของตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="ฉันจะลองบิตล่าสุดได้อย่างไร?">
    สองตัวเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปยัง branch `main` และอัปเดตจากซอร์ส

    2. **การติดตั้งที่แก้ไขได้ (จากไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะให้ repo ในเครื่องที่คุณแก้ไขได้ แล้วอัปเดตผ่าน git

    หากคุณต้องการ clone แบบสะอาดด้วยตนเอง ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [ช่องทางการพัฒนา](/th/install/development-channels),
    [ติดตั้ง](/th/install).

  </Accordion>

  <Accordion title="การติดตั้งและ onboarding โดยปกติใช้เวลานานเท่าไร?">
    แนวทางคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวนช่องทาง/โมเดลที่คุณกำหนดค่า

    หากค้าง ให้ใช้ [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และลูปดีบักเร็วใน [ฉันติดอยู่](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะดู feedback เพิ่มได้อย่างไร?">
    เรียกใช้ตัวติดตั้งอีกครั้งพร้อม **เอาต์พุตแบบละเอียด**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง beta พร้อมรายละเอียด:

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

    ตัวเลือกเพิ่มเติม: [แฟล็กของตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="การติดตั้งบน Windows แจ้งว่าไม่พบ git หรือไม่รู้จัก openclaw">
    ปัญหาทั่วไปสองอย่างบน Windows:

    **1) ข้อผิดพลาด npm spawn git / ไม่พบ git**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH ของคุณ
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นเรียกใช้ตัวติดตั้งอีกครั้ง

    **2) ไม่รู้จัก openclaw หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบ path:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นไปยัง PATH ของผู้ใช้ของคุณ (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่คือ `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังจากอัปเดต PATH

    สำหรับการตั้งค่าเดสก์ท็อป ให้ใช้แอป **Windows Hub** แบบเนทีฟ สำหรับการตั้งค่าแบบ terminal-only
    รองรับทั้งตัวติดตั้ง PowerShell และเส้นทาง WSL2 Gateway
    เอกสาร: [Windows](/th/platforms/windows).

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ควรทำอย่างไร?">
    โดยปกติเกิดจาก code page ของคอนโซลไม่ตรงกันบนเชลล์ Windows แบบเนทีฟ

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็น mojibake
    - คำสั่งเดียวกันแสดงผลปกติในโปรไฟล์เทอร์มินัลอื่น

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

    หากคุณยังทำซ้ำปัญหานี้ได้บน OpenClaw ล่าสุด ให้ติดตาม/รายงานที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ได้ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่าได้อย่างไร?">
    ใช้ **การติดตั้งแบบแก้ไขได้ (git)** เพื่อให้คุณมีซอร์สและเอกสารครบถ้วนในเครื่อง จากนั้นถาม
    บอตของคุณ (หรือ Claude/Codex) _จากโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กของตัวติดตั้ง](/th/install/installer).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux จากนั้นเรียกใช้ onboarding

    - เส้นทางด่วนสำหรับ Linux + การติดตั้ง service: [Linux](/th/platforms/linux).
    - คำแนะนำแบบละเอียด: [เริ่มต้นใช้งาน](/th/start/getting-started).
    - ตัวติดตั้ง + การอัปเดต: [ติดตั้งและอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    VPS ที่เป็น Linux ใด ๆ ก็ใช้ได้ ติดตั้งบนเซิร์ฟเวอร์ จากนั้นใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly).
    การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title="คู่มือติดตั้ง cloud/VPS อยู่ที่ไหน?">
    เรามี **ฮับโฮสติ้ง** ที่รวมผู้ให้บริการทั่วไป เลือกหนึ่งรายการและทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (ผู้ให้บริการทั้งหมดในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีการทำงานบน cloud: **Gateway รันบนเซิร์ฟเวอร์** และคุณเข้าถึงได้
    จากแล็ปท็อป/โทรศัพท์ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือ host เป็นแหล่งข้อมูลจริงและสำรองข้อมูลไว้

    คุณสามารถ pair **nodes** (Mac/iOS/Android/headless) กับ cloud Gateway นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือรันคำสั่งบนแล็ปท็อปของคุณ โดยยังคงให้
    Gateway อยู่บน cloud

    ฮับ: [แพลตฟอร์ม](/th/platforms). การเข้าถึงระยะไกล: [Gateway ระยะไกล](/th/gateway/remote).
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes).

  </Accordion>

  <Accordion title="ฉันสามารถขอให้ OpenClaw อัปเดตตัวเองได้ไหม?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** โฟลว์การอัปเดตอาจรีสตาร์ท
    Gateway (ซึ่งจะตัด session ที่ใช้งานอยู่), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจขอการยืนยัน ปลอดภัยกว่า: รันการอัปเดตจาก shell ในฐานะ operator

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

    เอกสาร: [อัปเดต](/th/cli/update), [กำลังอัปเดต](/th/install/updating).

  </Accordion>

  <Accordion title="onboarding ทำอะไรจริง ๆ?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **โหมด local** จะพาคุณทำ:

    - **การตั้งค่าโมเดล/auth** (provider OAuth, API keys, Anthropic setup-token รวมถึงตัวเลือกโมเดล local เช่น LM Studio)
    - ตำแหน่ง **Workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง channel plugins ที่ bundle มา เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - การเลือก **health checks** และ **skills**

    นอกจากนี้ยังเตือนหากโมเดลที่คุณกำหนดค่าไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันต้องมี subscription ของ Claude หรือ OpenAI เพื่อรันสิ่งนี้หรือไม่?">
    ไม่ คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **โมเดลแบบ local-only** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ Subscriptions (Claude
    Pro/Max หรือ OpenAI Codex) เป็นวิธีเสริมสำหรับยืนยันตัวตนกับ provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งใช้งานจริงคือ:

    - **Anthropic API key**: การคิดค่าบริการ Anthropic API ตามปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: เจ้าหน้าที่ Anthropic
      แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง และ OpenClaw ถือว่าการใช้ `claude -p`
      ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับ host gateway ที่ใช้งานระยะยาว Anthropic API keys ยังคงเป็นการตั้งค่าที่
    คาดเดาได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอก
    เช่น OpenClaw

    OpenClaw ยังรองรับตัวเลือก hosted แบบ subscription-style อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [Z.AI (GLM)](/th/providers/zai),
    [โมเดล local](/th/gateway/local-models), [โมเดล](/th/concepts/models).

  </Accordion>

  <Accordion title="ฉันใช้ Claude Max subscription โดยไม่มี API key ได้ไหม?">
    ได้

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw-style ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้ `claude -p` ได้รับการอนุมัติ
    สำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดเดาได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="คุณรองรับ Claude subscription auth (Claude Pro หรือ Max) หรือไม่?">
    รองรับ

    เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับการอนุมัติสำหรับ integration นี้
    เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ต้องการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งานมากกว่า
    สำหรับงาน production หรือ workload แบบหลายผู้ใช้ auth ด้วย Anthropic API key ยังคงเป็น
    ตัวเลือกที่ปลอดภัยกว่าและคาดเดาได้มากกว่า หากคุณต้องการตัวเลือก hosted แบบ
    subscription-style อื่นใน OpenClaw โปรดดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="ทำไมฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    นั่นหมายความว่า **quota/rate limit ของ Anthropic** ของคุณหมดแล้วสำหรับ window ปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอให้ window reset หรืออัปเกรดแผนของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับการใช้งาน/การเรียกเก็บเงิน และเพิ่ม limits ตามจำเป็น

    หากข้อความระบุเฉพาะว่า:
    `Extra usage is required for long context requests` แสดงว่าคำขอกำลังพยายามใช้
    หน้าต่างบริบท 1M ของ Anthropic (โมเดล Claude 4.x แบบ 1M ที่พร้อม GA หรือคอนฟิกเดิม
    `context1m: true`) ซึ่งจะทำงานได้ก็ต่อเมื่อข้อมูลรับรองของคุณมีสิทธิ์
    สำหรับการคิดค่าบริบทขนาดยาว (การเรียกเก็บเงินด้วยคีย์ API หรือเส้นทางล็อกอิน Claude ของ OpenClaw
    ที่เปิดใช้ Extra Usage)

    เคล็ดลับ: ตั้งค่า **fallback model** เพื่อให้ OpenClaw ตอบต่อได้ขณะที่ผู้ให้บริการถูกจำกัดอัตรา
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth) และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    รองรับ OpenClaw มีผู้ให้บริการ **Amazon Bedrock (Converse)** แบบ bundled เมื่อมีตัวบ่งชี้ env ของ AWS อยู่ OpenClaw สามารถค้นหาแค็ตตาล็อก Bedrock แบบสตรีม/ข้อความโดยอัตโนมัติ และผสานเป็นผู้ให้บริการ `amazon-bedrock` โดยนัยได้ มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจน หรือเพิ่มรายการผู้ให้บริการด้วยตนเองได้ ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณต้องการโฟลว์คีย์แบบจัดการ พร็อกซีที่เข้ากันได้กับ OpenAI หน้า Bedrock ก็ยังเป็นตัวเลือกที่ใช้ได้
  </Accordion>

  <Accordion title="การยืนยันตัวตน Codex ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai/gpt-5.5` สำหรับการตั้งค่าทั่วไป: การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม
    การดำเนินการด้วยเซิร์ฟเวอร์แอป Codex แบบ native อ้างอิง Codex GPT เดิมคือ
    คอนฟิกเดิมที่ซ่อมด้วย `openclaw doctor --fix` การเข้าถึงด้วยคีย์ API ของ OpenAI โดยตรง
    ยังพร้อมใช้งานสำหรับพื้นผิว OpenAI API ที่ไม่ใช่ agent และสำหรับโมเดล agent
    ผ่านโปรไฟล์คีย์ API `openai` แบบจัดลำดับ
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
  </Accordion>

  <Accordion title="ทำไม OpenClaw ยังกล่าวถึง prefix OpenAI Codex เดิม?">
    `openai` คือ id ของผู้ให้บริการและโปรไฟล์การยืนยันตัวตนสำหรับทั้งคีย์ OpenAI API และ
    ChatGPT/Codex OAuth คุณอาจยังเห็น prefix OpenAI Codex เดิมในคอนฟิกเดิมและ
    คำเตือนการย้ายข้อมูล
    คอนฟิกเก่ายังใช้สิ่งนี้เป็น prefix ของโมเดลด้วย:

    - `openai/gpt-5.5` = การยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex พร้อม runtime Codex แบบ native สำหรับรอบ agent
    - อ้างอิง Codex GPT-5.5 เดิม = เส้นทางโมเดลเดิมที่ซ่อมด้วย `openclaw doctor --fix`
    - `openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API `openai` แบบจัดลำดับ = การยืนยันตัวตนด้วยคีย์ API สำหรับโมเดล agent ของ OpenAI
    - id โปรไฟล์การยืนยันตัวตน Codex เดิม = id โปรไฟล์การยืนยันตัวตนเดิมที่ย้ายด้วย `openclaw doctor --fix`

    หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai` คงอ้างอิงโมเดลไว้เป็น
    `openai/gpt-5.5`; อ้างอิงโมเดล Codex เดิมเป็นคอนฟิกเดิมที่
    `openclaw doctor --fix` จะเขียนใหม่

  </Accordion>

  <Accordion title="ทำไมขีดจำกัด Codex OAuth จึงต่างจากเว็บ ChatGPT ได้?">
    Codex OAuth ใช้หน้าต่างโควตาที่ OpenAI จัดการและขึ้นกับแผน ในทางปฏิบัติ
    ขีดจำกัดเหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดงหน้าต่างการใช้งาน/โควตาของผู้ให้บริการที่มองเห็นได้ในปัจจุบันใน
    `openclaw models status` แต่จะไม่สร้างหรือปรับสิทธิ์ ChatGPT-web ให้เป็น
    การเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการเรียกเก็บเงิน/ขีดจำกัดของ OpenAI Platform โดยตรง
    ให้ใช้ `openai/*` พร้อมคีย์ API

  </Accordion>

  <Accordion title="รองรับการยืนยันตัวตนด้วยการสมัครสมาชิก OpenAI (Codex OAuth) หรือไม่?">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างเต็มรูปแบบ
    OpenAI อนุญาตการใช้งาน subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw อย่างชัดเจน การเริ่มต้นใช้งานสามารถรันโฟลว์ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร?">
    Gemini CLI ใช้ **โฟลว์การยืนยันตัวตนของ plugin** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่องเพื่อให้ `gemini` อยู่ใน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ plugin: `openclaw plugins enable google`
    3. ล็อกอิน: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลเริ่มต้นหลังล็อกอิน: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway

    สิ่งนี้จัดเก็บโทเค็น OAuth ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดล local เหมาะสำหรับการแชตทั่วไปหรือไม่?">
    โดยปกติไม่เหมาะ OpenClaw ต้องการบริบทขนาดใหญ่และความปลอดภัยที่แข็งแรง; การ์ดขนาดเล็กจะตัดทอนและรั่วไหล หากจำเป็นต้องใช้ ให้รัน build โมเดลที่ **ใหญ่ที่สุด** ที่คุณรันได้ในเครื่อง (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลที่เล็กกว่า/ผ่านการ quantize เพิ่มความเสี่ยง prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะเก็บทราฟฟิกโมเดลที่โฮสต์ไว้ในภูมิภาคเฉพาะได้อย่างไร?">
    เลือก endpoints ที่ตรึงภูมิภาค OpenRouter มีตัวเลือกที่โฮสต์ในสหรัฐฯ สำหรับ MiniMax, Kimi และ GLM; เลือก variant ที่โฮสต์ในสหรัฐฯ เพื่อเก็บข้อมูลไว้ในภูมิภาค คุณยังสามารถแสดงรายการ Anthropic/OpenAI ควบคู่กับรายการเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งานขณะเคารพผู้ให้บริการตามภูมิภาคที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ต้อง OpenClaw รันบน macOS หรือ Linux (Windows ผ่าน WSL2) ได้ Mac mini เป็นตัวเลือกเสริม - บางคน
    ซื้อไว้เป็นโฮสต์ที่เปิดตลอดเวลา แต่ VPS ขนาดเล็ก, home server หรือกล่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac เฉพาะ **สำหรับเครื่องมือที่ใช้ได้บน macOS เท่านั้น** สำหรับ iMessage ให้ใช้ [iMessage](/th/channels/imessage) พร้อม `imsg` บน Mac เครื่องใดก็ได้ที่ลงชื่อเข้าใช้ Messages หาก Gateway รันบน Linux หรือที่อื่น ให้ตั้งค่า `channels.imessage.cliPath` เป็น wrapper SSH ที่รัน `imsg` บน Mac เครื่องนั้น หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะ macOS ให้รัน Gateway บน Mac หรือจับคู่โหนด macOS

    เอกสาร: [iMessage](/th/channels/imessage), [โหนด](/th/nodes), [โหมดรีโมต Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องมี Mac mini เพื่อรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่อง** ที่ลงชื่อเข้าใช้ Messages ไม่จำเป็นต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ใช้ได้ **ใช้ [iMessage](/th/channels/imessage)** พร้อม `imsg`; Gateway สามารถรันบน Mac เครื่องนั้น หรือรันที่อื่นพร้อม wrapper SSH `cliPath` ได้

    การตั้งค่าทั่วไป:

    - รัน Gateway บน Linux/VPS และตั้งค่า `channels.imessage.cliPath` เป็น wrapper SSH ที่รัน `imsg` บน Mac ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [iMessage](/th/channels/imessage), [โหนด](/th/nodes),
    [โหมดรีโมต Mac](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันเชื่อมต่อกับ MacBook Pro ของฉันได้ไหม?">
    ได้ **Mac mini สามารถรัน Gateway** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **โหนด** (อุปกรณ์คู่หู) โหนดไม่ได้รัน Gateway - แต่ให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบทั่วไป:

    - Gateway บน Mac mini (เปิดตลอดเวลา)
    - MacBook Pro รันแอป macOS หรือโฮสต์โหนด และจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดูสถานะ

    เอกสาร: [โหนด](/th/nodes), [CLI โหนด](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันใช้ Bun ได้ไหม?">
    **ไม่แนะนำ** ให้ใช้ Bun เราพบข้อบกพร่อง runtime โดยเฉพาะกับ WhatsApp และ Telegram
    ใช้ **Node** สำหรับ gateway ที่เสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน gateway ที่ไม่ใช่ production
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ต้องใส่อะไรใน allowFrom?">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (ตัวเลข) ไม่ใช่ username ของบอต

    การตั้งค่าจะขอเฉพาะ user ID แบบตัวเลข หากคุณมีรายการ `@username` เดิมในคอนฟิกอยู่แล้ว `openclaw doctor --fix` สามารถพยายาม resolve ให้ได้

    ปลอดภัยกว่า (ไม่มีบอตของบุคคลที่สาม):

    - DM บอตของคุณ จากนั้นรัน `openclaw logs --follow` แล้วอ่าน `from.id`

    Bot API อย่างเป็นทางการ:

    - DM บอตของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` แล้วอ่าน `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - DM `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw ต่างกันได้ไหม?">
    ได้ ผ่าน **การกำหนดเส้นทางหลาย agent** ผูก WhatsApp **DM** ของผู้ส่งแต่ละคน (peer `kind: "direct"`, ผู้ส่ง E.164 เช่น `+15551234567`) กับ `agentId` ที่ต่างกัน เพื่อให้แต่ละคนมี workspace และ session store ของตัวเอง คำตอบยังคงส่งจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นค่าระดับ global ต่อบัญชี WhatsApp ดู [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันรัน agent แบบ "แชตเร็ว" และ agent แบบ "Opus สำหรับเขียนโค้ด" ได้ไหม?'>
    ได้ ใช้การกำหนดเส้นทางหลาย agent: ให้แต่ละ agent มีโมเดลเริ่มต้นของตัวเอง จากนั้นผูกเส้นทางขาเข้า (บัญชีผู้ให้บริการหรือ peer เฉพาะ) กับแต่ละ agent ตัวอย่างคอนฟิกอยู่ใน [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent) ดูเพิ่มเติม [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ทำงานบน Linux ได้ไหม?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าแบบเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ตรวจสอบให้แน่ใจว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ prefix brew ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน shell ที่ไม่ใช่ login
    build ล่าสุดยังเติม common user bin dirs บน service systemd ของ Linux ไว้ข้างหน้า (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อถูกตั้งค่า

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้ง git แบบแก้ไขได้กับการติดตั้ง npm">
    - **การติดตั้งแบบแก้ไขได้ (git):** checkout ซอร์สเต็ม แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณรัน build ในเครื่องและ patch โค้ด/เอกสารได้
    - **การติดตั้ง npm:** ติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ "แค่รันใช้งาน"
      การอัปเดตมาจาก npm dist-tags

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสลับระหว่างการติดตั้ง npm และ git ภายหลังได้ไหม?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อ OpenClaw ติดตั้งอยู่แล้ว
    สิ่งนี้ **จะไม่ลบข้อมูลของคุณ** - เปลี่ยนเฉพาะการติดตั้งโค้ด OpenClaw เท่านั้น
    state (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) ของคุณยังไม่ถูกแตะต้อง

    จาก npm ไป git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไป npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน updater จะรัน
    งานติดตามผลของ Doctor, รีเฟรชซอร์ส plugin สำหรับ channel เป้าหมาย และ
    รีสตาร์ท gateway เว้นแต่คุณจะส่ง `--no-restart`

    installer สามารถบังคับใช้โหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](/th/help/faq#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือ VPS?">
    คำตอบสั้น ๆ: **ถ้าคุณต้องการความเสถียรตลอด 24/7 ให้ใช้ VPS** ถ้าคุณต้องการ
    ความยุ่งยากน้อยที่สุดและรับได้กับการ sleep/restart ให้รันแบบโลคัล

    **แล็ปท็อป (Gateway แบบโลคัล)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์, เข้าถึงไฟล์โลคัลได้โดยตรง, หน้าต่างเบราว์เซอร์แบบสด
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = การเชื่อมต่อถูกตัด, การอัปเดต OS/การรีบูตทำให้สะดุด, ต้องเปิดเครื่องไว้ตลอด

    **VPS / คลาวด์**

    - **ข้อดี:** เปิดใช้งานตลอดเวลา, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อป sleep, ดูแลให้รันต่อเนื่องได้ง่ายกว่า
    - **ข้อเสีย:** มักรันแบบไม่มีหน้าจอ (ใช้ภาพหน้าจอ), เข้าถึงไฟล์ระยะไกลเท่านั้น, คุณต้อง SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ทั้งหมดทำงานได้ดีจาก VPS สิ่งเดียวที่ต้องแลกจริง ๆ คือ **เบราว์เซอร์แบบไม่มีหน้าจอ** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากคุณเคยเจอ Gateway ตัดการเชื่อมต่อมาก่อน แบบโลคัลเหมาะมากเมื่อคุณกำลังใช้ Mac อยู่และต้องการเข้าถึงไฟล์โลคัลหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะมีความสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความเสถียรและการแยกสภาพแวดล้อม**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Raspberry Pi):** เปิดใช้งานตลอดเวลา, มีการสะดุดจาก sleep/รีบูตน้อยกว่า, สิทธิ์สะอาดกว่า, ดูแลให้รันต่อเนื่องได้ง่ายกว่า
    - **แล็ปท็อป/เดสก์ท็อปที่ใช้ร่วมกัน:** ใช้ทดสอบและใช้งานจริงขณะเปิดเครื่องได้สบาย แต่ควรคาดว่าจะมีการหยุดพักเมื่อเครื่อง sleep หรืออัปเดต

    ถ้าคุณต้องการข้อดีของทั้งสองแบบ ให้เก็บ Gateway ไว้บนโฮสต์เฉพาะและจับคู่แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec แบบโลคัล ดู [Nodes](/th/nodes)
    สำหรับคำแนะนำด้านความปลอดภัย โปรดอ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และ OS ที่แนะนำคืออะไร?">
    OpenClaw ใช้ทรัพยากรเบา สำหรับ Gateway พื้นฐาน + ช่องแชตหนึ่งช่อง:

    - **ขั้นต่ำที่สุด:** 1 vCPU, RAM 1GB, ดิสก์ ~500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB ขึ้นไปเพื่อมีทรัพยากรเผื่อ (บันทึก, สื่อ, หลายช่อง) เครื่องมือ Node และระบบอัตโนมัติของเบราว์เซอร์อาจใช้ทรัพยากรมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ได้รับการทดสอบดีที่สุดที่นั่น

    เอกสาร: [Linux](/th/platforms/linux), [โฮสติ้ง VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันรัน OpenClaw ใน VM ได้ไหม และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้ปฏิบัติกับ VM เหมือน VPS: ต้องเปิดตลอดเวลา, เข้าถึงได้, และมี
    RAM เพียงพอสำหรับ Gateway และช่องทางใด ๆ ที่คุณเปิดใช้

    คำแนะนำพื้นฐาน:

    - **ขั้นต่ำที่สุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB ขึ้นไป หากคุณรันหลายช่องทาง, ระบบอัตโนมัติของเบราว์เซอร์, หรือเครื่องมือสื่อ
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น

    หากคุณใช้ Windows ให้ใช้ **Windows Hub** สำหรับการตั้งค่าเดสก์ท็อป หรือ WSL2 เมื่อ
    คุณต้องการ VM Gateway แบบ Linux โดยเฉพาะพร้อมความเข้ากันได้กับเครื่องมือที่กว้าง
    ดู [Windows](/th/platforms/windows), [โฮสติ้ง VPS](/th/vps)
    หากคุณรัน macOS ใน VM โปรดดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (โมเดล, เซสชัน, gateway, ความปลอดภัย, และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
