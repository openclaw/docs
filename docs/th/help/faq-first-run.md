---
read_when:
    - การติดตั้งใหม่ การ Onboard ที่ค้างอยู่ หรือข้อผิดพลาดในการรันครั้งแรก
    - การเลือก auth และ subscriptions ของ provider
    - เข้าใช้งาน docs.openclaw.ai ไม่ได้ เปิดแดชบอร์ดไม่ได้ การติดตั้งค้างอยู่
sidebarTitle: First-run FAQ
summary: 'คำถามที่พบบ่อย: การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก — การติดตั้ง, onboard, auth, subscriptions และความล้มเหลวในช่วงเริ่มต้นครั้งแรก'
title: 'คำถามที่พบบ่อย: การตั้งค่าครั้งแรก'
x-i18n:
    generated_at: "2026-04-26T11:32:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  คำถามและคำตอบสำหรับการเริ่มต้นอย่างรวดเร็วและการรันครั้งแรก สำหรับการใช้งานประจำวัน โมเดล auth sessions
  และการแก้ไขปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

  <AccordionGroup>
  <Accordion title="ฉันติดปัญหาอยู่ วิธีที่เร็วที่สุดในการหลุดจากปัญหาคืออะไร">
    ใช้เอเจนต์ AI บนเครื่องที่สามารถ **มองเห็นเครื่องของคุณได้** วิธีนี้มีประสิทธิภาพมากกว่าการถาม
    ใน Discord มาก เพราะกรณีส่วนใหญ่ของ "ฉันติดปัญหาอยู่" มักเป็น **ปัญหา config หรือ environment บนเครื่อง**
    ซึ่งผู้ช่วยจากระยะไกลตรวจสอบไม่ได้

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    เครื่องมือเหล่านี้สามารถอ่าน repo, รันคำสั่ง, ตรวจสอบล็อก และช่วยแก้ปัญหาการตั้งค่าระดับเครื่องของคุณ
    (PATH, services, permissions, auth files) ให้สิทธิ์พวกมันเข้าถึง **source checkout แบบเต็ม**
    ผ่านการติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะติดตั้ง OpenClaw **จาก git checkout** เพื่อให้เอเจนต์สามารถอ่านโค้ด + เอกสาร และ
    วิเคราะห์ตามเวอร์ชันจริงที่คุณกำลังใช้งานอยู่ได้ คุณสามารถสลับกลับไปใช้ stable ได้เสมอในภายหลัง
    โดยรันตัวติดตั้งอีกครั้งโดยไม่ใส่ `--install-method git`

    เคล็ดลับ: ขอให้เอเจนต์ **วางแผนและกำกับดูแล** การแก้ปัญหา (ทีละขั้นตอน) แล้วค่อยรันเฉพาะ
    คำสั่งที่จำเป็น วิธีนี้ช่วยให้การเปลี่ยนแปลงมีขนาดเล็กและตรวจสอบย้อนหลังได้ง่ายขึ้น

    หากคุณพบ bug จริงหรือมีวิธีแก้ โปรดเปิด GitHub issue หรือส่ง PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    เริ่มต้นด้วยคำสั่งเหล่านี้ (แชร์เอาต์พุตเมื่อขอความช่วยเหลือ):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    สิ่งที่คำสั่งเหล่านี้ทำ:

    - `openclaw status`: snapshot แบบรวดเร็วของสุขภาพ gateway/agent + config พื้นฐาน
    - `openclaw models status`: ตรวจสอบ auth ของ provider + ความพร้อมใช้งานของโมเดล
    - `openclaw doctor`: ตรวจสอบและซ่อมแซมปัญหา config/state ทั่วไป

    การตรวจสอบผ่าน CLI อื่นที่มีประโยชน์: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`

    วงจรดีบักแบบรวดเร็ว: [60 วินาทีแรกเมื่อมีบางอย่างเสีย](#first-60-seconds-if-something-is-broken)
    เอกสารการติดตั้ง: [ติดตั้ง](/th/install), [แฟล็กของตัวติดตั้ง](/th/install/installer), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Heartbeat ข้ามตลอด เหตุผลที่ข้ามแต่ละแบบหมายถึงอะไร">
    เหตุผลทั่วไปที่ Heartbeat ถูกข้าม:

    - `quiet-hours`: อยู่นอกช่วง active-hours ที่กำหนดไว้
    - `empty-heartbeat-file`: มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงสร้างว่าง/หัวข้อเท่านั้น
    - `no-tasks-due`: เปิด task mode ของ `HEARTBEAT.md` อยู่ แต่ยังไม่มี task interval ใดครบกำหนด
    - `alerts-disabled`: ปิดการมองเห็น Heartbeat ทั้งหมดอยู่ (`showOk`, `showAlerts` และ `useIndicator` ปิดทั้งหมด)

    ใน task mode timestamp ของกำหนดเวลาจะถูกเลื่อนไปข้างหน้าก็ต่อเมื่อมีการรัน Heartbeat จริง
    เสร็จสมบูรณ์เท่านั้น การรันที่ถูกข้ามจะไม่ถือว่า task เสร็จแล้ว

    เอกสาร: [Heartbeat](/th/gateway/heartbeat), [Automation & Tasks](/th/automation)

  </Accordion>

  <Accordion title="วิธีที่แนะนำในการติดตั้งและตั้งค่า OpenClaw">
    repo แนะนำให้รันจาก source และใช้ onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดยังสามารถ build asset ของ UI ให้โดยอัตโนมัติได้ หลัง onboarding แล้ว โดยทั่วไปคุณจะรัน Gateway บนพอร์ต **18789**

    จาก source (contributors/dev):

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

  <Accordion title="หลัง onboarding แล้วจะเปิดแดชบอร์ดอย่างไร">
    วิซาร์ดจะเปิดเบราว์เซอร์ของคุณด้วย URL ของแดชบอร์ดแบบสะอาด (ไม่มีโทเค็นใน URL) ทันทีหลัง onboarding และยังพิมพ์ลิงก์ไว้ในสรุปด้วย ให้เปิดแท็บนั้นค้างไว้; หากมันไม่เปิดขึ้นมา ให้คัดลอก/วาง URL ที่พิมพ์ออกมาบนเครื่องเดียวกัน
  </Accordion>

  <Accordion title="จะยืนยันตัวตนกับแดชบอร์ดบน localhost เทียบกับรีโมตอย่างไร">
    **Localhost (เครื่องเดียวกัน):**

    - เปิด `http://127.0.0.1:18789/`
    - หากระบบขอ shared-secret auth ให้วางโทเค็นหรือรหัสผ่านที่กำหนดไว้ลงใน Control UI settings
    - แหล่งที่มาของโทเค็น: `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
    - แหล่งที่มาของรหัสผ่าน: `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
    - หากยังไม่มีการกำหนด shared secret ให้สร้างโทเค็นด้วย `openclaw doctor --generate-gateway-token`

    **ไม่ใช่บน localhost:**

    - **Tailscale Serve** (แนะนำ): คง bind แบบ loopback ไว้ รัน `openclaw gateway --tailscale serve` แล้วเปิด `https://<magicdns>/` หาก `gateway.auth.allowTailscale` เป็น `true`, identity header จะเพียงพอสำหรับ Control UI/WebSocket auth (ไม่ต้องวาง shared secret โดยถือว่าโฮสต์ gateway เชื่อถือได้); ส่วน HTTP APIs ยังต้องใช้ shared-secret auth เว้นแต่คุณจะตั้งใจใช้ `none` สำหรับ private-ingress หรือ trusted-proxy HTTP auth
      ความพยายาม auth ผ่าน Serve ที่ไม่ถูกต้องพร้อมกันจากไคลเอนต์เดียวกันจะถูกทำให้เป็นลำดับก่อนที่ตัวจำกัด failed-auth จะบันทึก ดังนั้นการลองผิดครั้งที่สองอาจแสดง `retry later` ได้แล้ว
    - **Tailnet bind**: รัน `openclaw gateway --bind tailnet --token "<token>"` (หรือกำหนดค่า password auth) เปิด `http://<tailscale-ip>:18789/` แล้ววาง shared secret ที่ตรงกันใน dashboard settings
    - **Identity-aware reverse proxy**: วาง Gateway ไว้หลัง trusted proxy ที่ไม่ใช่ loopback กำหนด `gateway.auth.mode: "trusted-proxy"` แล้วเปิด URL ของ proxy
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/` shared-secret auth ยังคงมีผลผ่าน tunnel; ให้วางโทเค็นหรือรหัสผ่านที่กำหนดไว้หากระบบถาม

    ดู [แดชบอร์ด](/th/web/dashboard) และ [พื้นผิวเว็บ](/th/web) สำหรับรายละเอียดโหมด bind และ auth

  </Accordion>

  <Accordion title="เหตุใดจึงมี config สำหรับการอนุมัติ exec ในแชตสองแบบ">
    ทั้งสองแบบควบคุมคนละชั้น:

    - `approvals.exec`: ส่งต่อพรอมป์อนุมัติไปยังปลายทางแชต
    - `channels.<channel>.execApprovals`: ทำให้ช่องทางนั้นทำหน้าที่เป็น native approval client สำหรับการอนุมัติ exec

    นโยบาย exec ของโฮสต์ยังคงเป็นประตูอนุมัติที่แท้จริง ส่วน config ของแชตมีหน้าที่ควบคุมเพียงว่าพรอมป์อนุมัติ
    จะปรากฏที่ใด และผู้คนจะตอบกลับได้อย่างไร

    ในการติดตั้งส่วนใหญ่ คุณ **ไม่** จำเป็นต้องใช้ทั้งสองอย่าง:

    - หากแชตรองรับคำสั่งและการตอบกลับอยู่แล้ว `/approve` ในแชตเดียวกันจะใช้งานได้ผ่านเส้นทางที่ใช้ร่วมกัน
    - หากช่องทาง native ที่รองรับสามารถอนุมานผู้อนุมัติได้อย่างปลอดภัย OpenClaw จะเปิดใช้การอนุมัติแบบ native ที่เริ่มจาก DM ให้อัตโนมัติ เมื่อ `channels.<channel>.execApprovals.enabled` ไม่ได้ถูกตั้งค่าไว้หรือเป็น `"auto"`
    - เมื่อมีการ์ด/ปุ่มอนุมัติแบบ native ให้ใช้ได้ native UI นั้นจะเป็นเส้นทางหลัก; เอเจนต์ควรใส่คำสั่ง `/approve` แบบ manual ก็ต่อเมื่อผลลัพธ์ของเครื่องมือระบุว่าแชตอนุมัติใช้งานไม่ได้ หรือการอนุมัติแบบ manual เป็นเส้นทางเดียว
    - ใช้ `approvals.exec` เฉพาะเมื่อพรอมป์ต้องถูกส่งต่อไปยังแชตอื่นหรือห้อง ops แบบ explicit ด้วย
    - ใช้ `channels.<channel>.execApprovals.target: "channel"` หรือ `"both"` เฉพาะเมื่อคุณต้องการให้พรอมป์อนุมัติถูกโพสต์กลับไปยังห้อง/หัวข้อที่เป็นต้นทางอย่างชัดเจน
    - การอนุมัติของ Plugin แยกออกไปอีก: โดยค่าเริ่มต้นจะใช้ `/approve` ในแชตเดียวกัน, การส่งต่อ `approvals.plugin` แบบไม่บังคับ และมีเพียงบางช่องทาง native เท่านั้นที่คงการจัดการ plugin-approval-native ซ้อนเพิ่มไว้

    สรุปสั้น ๆ: การส่งต่อมีไว้สำหรับการกำหนดเส้นทาง ส่วน config ของ native client มีไว้สำหรับ UX ที่ดียิ่งขึ้นเฉพาะช่องทาง
    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>

  <Accordion title="ฉันต้องใช้ runtime อะไร">
    ต้องใช้ Node **>= 22** และแนะนำ `pnpm` ไม่แนะนำ Bun สำหรับ Gateway
  </Accordion>

  <Accordion title="รันบน Raspberry Pi ได้หรือไม่">
    ได้ Gateway มีน้ำหนักเบา - เอกสารระบุว่าใช้ **RAM 512MB-1GB**, **1 คอร์** และดิสก์ประมาณ **500MB**
    ก็เพียงพอสำหรับการใช้งานส่วนตัว และยังระบุด้วยว่า **Raspberry Pi 4 สามารถรันได้**

    หากคุณต้องการเผื่อทรัพยากรเพิ่ม (ล็อก สื่อ หรือ services อื่น) แนะนำ **2GB** แต่
    ไม่ใช่ขั้นต่ำแบบบังคับ

    เคล็ดลับ: Pi/VPS ขนาดเล็กสามารถโฮสต์ Gateway ได้ และคุณสามารถจับคู่ **nodes** บนแล็ปท็อป/โทรศัพท์ของคุณเพื่อใช้
    หน้าจอ กล้อง canvas ในเครื่อง หรือการรันคำสั่ง ดู [Nodes](/th/nodes)

  </Accordion>

  <Accordion title="มีคำแนะนำสำหรับการติดตั้งบน Raspberry Pi ไหม">
    สรุปสั้น ๆ: ใช้งานได้ แต่คาดว่าจะมีจุดขรุขระอยู่บ้าง

    - ใช้ OS แบบ **64-bit** และใช้ Node >= 22
    - แนะนำการติดตั้งแบบ **hackable (git)** เพื่อให้คุณดูล็อกและอัปเดตได้รวดเร็ว
    - เริ่มต้นโดยไม่เปิด channels/skills แล้วค่อยเพิ่มทีละอย่าง
    - หากคุณเจอปัญหา binary แปลก ๆ มักเป็นปัญหา **ความเข้ากันได้กับ ARM**

    เอกสาร: [Linux](/th/platforms/linux), [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="มันค้างที่ wake up my friend / onboarding ไม่ยอมฟักออกมา ต้องทำอย่างไร">
    หน้าจอนั้นขึ้นอยู่กับว่า Gateway เข้าถึงได้และยืนยันตัวตนได้หรือไม่ นอกจากนี้ TUI ยังส่ง
    "Wake up, my friend!" ให้อัตโนมัติในการฟักครั้งแรกด้วย หากคุณเห็นบรรทัดนั้นแต่ **ไม่มีการตอบกลับ**
    และโทเค็นยังคงเป็น 0 แสดงว่าเอเจนต์ไม่เคยรันเลย

    1. รีสตาร์ต Gateway:

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

    หาก Gateway อยู่ระยะไกล ให้แน่ใจว่า tunnel/Tailscale เชื่อมต่ออยู่ และ UI
    ชี้ไปยัง Gateway ที่ถูกต้อง ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันสามารถย้ายการตั้งค่าไปเครื่องใหม่ (Mac mini) โดยไม่ต้องทำ onboarding ใหม่ได้หรือไม่">
    ได้ คัดลอก **state directory** และ **workspace** แล้วรัน Doctor หนึ่งครั้ง วิธีนี้
    จะคงให้บอตของคุณ "เหมือนเดิมทุกอย่าง" (memory, session history, auth และ channel
    state) ตราบใดที่คุณคัดลอก **ทั้งสองตำแหน่ง**:

    1. ติดตั้ง OpenClaw บนเครื่องใหม่
    2. คัดลอก `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`) จากเครื่องเก่า
    3. คัดลอก workspace ของคุณ (ค่าเริ่มต้น: `~/.openclaw/workspace`)
    4. รัน `openclaw doctor` และรีสตาร์ต service ของ Gateway

    วิธีนี้จะคง config, auth profiles, ข้อมูลรับรองของ WhatsApp, sessions และ memory ไว้ หากคุณอยู่ใน
    remote mode โปรดจำไว้ว่าโฮสต์ gateway เป็นเจ้าของ session store และ workspace

    **สำคัญ:** หากคุณเพียง commit/push workspace ไปยัง GitHub เท่านั้น คุณกำลังสำรอง
    **memory + bootstrap files** แต่ **ไม่ใช่** session history หรือ auth สิ่งเหล่านั้นอยู่
    ภายใต้ `~/.openclaw/` (เช่น `~/.openclaw/agents/<agentId>/sessions/`)

    ที่เกี่ยวข้อง: [การย้ายระบบ](/th/install/migrating), [สิ่งต่าง ๆ อยู่ที่ใดบนดิสก์](#where-things-live-on-disk),
    [workspace ของเอเจนต์](/th/concepts/agent-workspace), [Doctor](/th/gateway/doctor),
    [Remote mode](/th/gateway/remote)

  </Accordion>

  <Accordion title="ฉันจะดูได้อย่างไรว่ามีอะไรใหม่ในเวอร์ชันล่าสุด">
    ตรวจสอบ changelog บน GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    รายการล่าสุดอยู่ด้านบนสุด หากส่วนบนสุดถูกทำเครื่องหมายว่า **Unreleased** ส่วนที่มีวันที่ถัดลงมา
    คือเวอร์ชันที่ปล่อยใช้งานล่าสุด รายการต่าง ๆ จะถูกจัดกลุ่มเป็น **Highlights**, **Changes** และ
    **Fixes** (รวมถึงส่วน docs/other เมื่อจำเป็น)

  </Accordion>

  <Accordion title="เข้าใช้งาน docs.openclaw.ai ไม่ได้ (SSL error)">
    การเชื่อมต่อ Comcast/Xfinity บางรายการบล็อก `docs.openclaw.ai` ผิดพลาดผ่าน Xfinity
    Advanced Security ให้ปิดฟีเจอร์นั้นหรือใส่ `docs.openclaw.ai` ลงใน allowlist แล้วลองใหม่
    โปรดช่วยเราปลดบล็อกโดยรายงานที่นี่: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)

    หากคุณยังเข้าเว็บไซต์ไม่ได้ เอกสารถูก mirror ไว้บน GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="ความแตกต่างระหว่าง stable และ beta">
    **Stable** และ **beta** เป็น **npm dist-tag** ไม่ใช่สายโค้ดแยกกัน:

    - `latest` = stable
    - `beta` = บิลด์ล่วงหน้าสำหรับการทดสอบ

    โดยปกติ stable release จะไปลงที่ **beta** ก่อน จากนั้นจะมีขั้นตอน
    promotion แบบ explicit ที่ย้ายเวอร์ชันเดียวกันนั้นไปยัง `latest` ผู้ดูแลยังสามารถ
    publish ตรงไปที่ `latest` ได้เมื่อจำเป็น นั่นจึงเป็นเหตุผลว่าทำไม beta และ stable อาจ
    ชี้ไปยัง **เวอร์ชันเดียวกัน** หลังการ promotion

    ดูว่ามีอะไรเปลี่ยนไป:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    สำหรับ one-liner ในการติดตั้งและความแตกต่างระหว่าง beta กับ dev ดู accordion ด้านล่าง

  </Accordion>

  <Accordion title="ฉันจะติดตั้งเวอร์ชัน beta ได้อย่างไร และ beta ต่างจาก dev อย่างไร?">
    **Beta** คือ npm dist-tag `beta` (อาจตรงกับ `latest` หลังการ promotion)
    **Dev** คือ head ที่เคลื่อนที่อยู่ของ `main` (git); เมื่อมีการ publish จะใช้ npm dist-tag `dev`

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    ตัวติดตั้งสำหรับ Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    รายละเอียดเพิ่มเติม: [Development channels](/th/install/development-channels) และ [แฟล็กของตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะลองใช้บิตล่าสุดได้อย่างไร?">
    มีสองทางเลือก:

    1. **ช่องทาง Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    คำสั่งนี้จะสลับไปที่สาขา `main` และอัปเดตจาก source

    2. **การติดตั้งแบบ hackable (จากเว็บไซต์ตัวติดตั้ง):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    วิธีนี้จะให้ repo ในเครื่องที่คุณแก้ไขได้ จากนั้นอัปเดตผ่าน git

    หากคุณต้องการ clone เองแบบสะอาด ให้ใช้:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [Development channels](/th/install/development-channels),
    [ติดตั้ง](/th/install)

  </Accordion>

  <Accordion title="โดยทั่วไปการติดตั้งและ onboarding ใช้เวลานานเท่าไร?">
    โดยคร่าว ๆ:

    - **ติดตั้ง:** 2-5 นาที
    - **Onboarding:** 5-15 นาที ขึ้นอยู่กับจำนวน channels/models ที่คุณกำหนดค่า

    หากค้าง ให้ดู [ตัวติดตั้งค้าง](#quick-start-and-first-run-setup)
    และวงจรดีบักแบบรวดเร็วใน [ฉันติดปัญหาอยู่](#quick-start-and-first-run-setup)

  </Accordion>

  <Accordion title="ตัวติดตั้งค้าง? ฉันจะดูข้อมูลเพิ่มเติมได้อย่างไร?">
    รันตัวติดตั้งใหม่พร้อม **เอาต์พุตแบบ verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    ติดตั้ง beta พร้อม verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    สำหรับการติดตั้งแบบ hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    คำสั่งเทียบเท่าสำหรับ Windows (PowerShell):

    ```powershell
    # install.ps1 ยังไม่มีแฟล็ก -Verbose โดยเฉพาะ
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    ตัวเลือกเพิ่มเติม: [แฟล็กของตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="การติดตั้งบน Windows บอกว่า git not found หรือ openclaw not recognized">
    ปัญหาทั่วไปบน Windows มีสองอย่าง:

    **1) npm error spawn git / git not found**

    - ติดตั้ง **Git for Windows** และตรวจสอบให้แน่ใจว่า `git` อยู่ใน PATH
    - ปิดแล้วเปิด PowerShell ใหม่ จากนั้นรันตัวติดตั้งอีกครั้ง

    **2) openclaw is not recognized หลังติดตั้ง**

    - โฟลเดอร์ npm global bin ของคุณไม่ได้อยู่ใน PATH
    - ตรวจสอบพาธ:

      ```powershell
      npm config get prefix
      ```

    - เพิ่มไดเรกทอรีนั้นเข้าไปใน PATH ของผู้ใช้ (บน Windows ไม่ต้องมี suffix `\bin`; ในระบบส่วนใหญ่จะเป็น `%AppData%\npm`)
    - ปิดแล้วเปิด PowerShell ใหม่หลังอัปเดต PATH

    หากคุณต้องการการตั้งค่าบน Windows ที่ลื่นที่สุด ให้ใช้ **WSL2** แทน Windows แบบเนทีฟ
    เอกสาร: [Windows](/th/platforms/windows)

  </Accordion>

  <Accordion title="เอาต์พุต exec บน Windows แสดงข้อความภาษาจีนเพี้ยน - ฉันควรทำอย่างไร?">
    โดยทั่วไปนี่เป็นปัญหา console code page ไม่ตรงกันบนเชลล์ Windows แบบเนทีฟ

    อาการ:

    - เอาต์พุต `system.run`/`exec` แสดงภาษาจีนเป็นตัวอักษรเพี้ยน
    - คำสั่งเดียวกันแสดงผลปกติในโปรไฟล์เทอร์มินัลอื่น

    วิธีแก้ชั่วคราวแบบรวดเร็วใน PowerShell:

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

    หากคุณยังพบปัญหานี้บน OpenClaw เวอร์ชันล่าสุด ให้ติดตาม/รายงานที่:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="เอกสารไม่ตอบคำถามของฉัน - ฉันจะได้คำตอบที่ดีกว่านี้อย่างไร?">
    ใช้การติดตั้งแบบ **hackable (git)** เพื่อให้คุณมี source และ docs แบบเต็มในเครื่อง แล้วถาม
    บอตของคุณ (หรือ Claude/Codex) _จากในโฟลเดอร์นั้น_ เพื่อให้มันอ่าน repo และตอบได้อย่างแม่นยำ

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    รายละเอียดเพิ่มเติม: [ติดตั้ง](/th/install) และ [แฟล็กของตัวติดตั้ง](/th/install/installer)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน Linux ได้อย่างไร?">
    คำตอบสั้น ๆ: ทำตามคู่มือ Linux แล้วรัน onboarding

    - เส้นทางแบบรวดเร็วบน Linux + การติดตั้ง service: [Linux](/th/platforms/linux)
    - คำแนะนำแบบเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started)
    - ตัวติดตั้ง + การอัปเดต: [การติดตั้งและการอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง OpenClaw บน VPS ได้อย่างไร?">
    Linux VPS ใด ๆ ก็ใช้ได้ ติดตั้งบนเซิร์ฟเวอร์ แล้วใช้ SSH/Tailscale เพื่อเข้าถึง Gateway

    คู่มือ: [exe.dev](/th/install/exe-dev), [Hetzner](/th/install/hetzner), [Fly.io](/th/install/fly)
    การเข้าถึงระยะไกล: [Gateway remote](/th/gateway/remote)

  </Accordion>

  <Accordion title="คู่มือการติดตั้งบนคลาวด์/VPS อยู่ที่ไหน?">
    เรามี **ฮับสำหรับการโฮสต์** ที่รวมผู้ให้บริการยอดนิยมไว้ เลือกหนึ่งรายการแล้วทำตามคู่มือ:

    - [โฮสติ้ง VPS](/th/vps) (รวมผู้ให้บริการทั้งหมดไว้ในที่เดียว)
    - [Fly.io](/th/install/fly)
    - [Hetzner](/th/install/hetzner)
    - [exe.dev](/th/install/exe-dev)

    วิธีการทำงานบนคลาวด์: **Gateway รันอยู่บนเซิร์ฟเวอร์** และคุณเข้าถึงมัน
    จากแล็ปท็อป/โทรศัพท์ผ่าน Control UI (หรือ Tailscale/SSH) state + workspace ของคุณ
    อยู่บนเซิร์ฟเวอร์ ดังนั้นให้ถือว่าโฮสต์เป็นแหล่งข้อมูลจริงและสำรองข้อมูลไว้

    คุณสามารถจับคู่ **nodes** (Mac/iOS/Android/headless) เข้ากับ Gateway บนคลาวด์นั้นเพื่อเข้าถึง
    หน้าจอ/กล้อง/canvas ในเครื่อง หรือรันคำสั่งบนแล็ปท็อปของคุณ ขณะที่ยังคงให้
    Gateway อยู่บนคลาวด์

    ฮับ: [Platforms](/th/platforms) การเข้าถึงระยะไกล: [Gateway remote](/th/gateway/remote)
    Nodes: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันสามารถขอให้ OpenClaw อัปเดตตัวเองได้หรือไม่?">
    คำตอบสั้น ๆ: **ทำได้ แต่ไม่แนะนำ** flow การอัปเดตอาจรีสตาร์ต
    Gateway (ซึ่งทำให้เซสชันที่กำลังใช้งานอยู่หลุด), อาจต้องใช้ git checkout ที่สะอาด และ
    อาจถามเพื่อยืนยัน วิธีที่ปลอดภัยกว่าคือรันการอัปเดตจากเชลล์ในฐานะโอเปอเรเตอร์

    ใช้ CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    หากคุณจำเป็นต้องทำอัตโนมัติจากเอเจนต์:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    เอกสาร: [อัปเดต](/th/cli/update), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="Onboarding ทำอะไรบ้างจริง ๆ ?">
    `openclaw onboard` คือเส้นทางการตั้งค่าที่แนะนำ ใน **local mode** มันจะพาคุณผ่าน:

    - **การตั้งค่า model/auth** (OAuth ของ provider, API keys, Anthropic setup-token รวมถึงตัวเลือกโมเดลในเครื่อง เช่น LM Studio)
    - ตำแหน่ง **workspace** + ไฟล์ bootstrap
    - **การตั้งค่า Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage รวมถึง channel plugins ที่รวมมาให้ เช่น QQ Bot)
    - **การติดตั้ง daemon** (LaunchAgent บน macOS; systemd user unit บน Linux/WSL2)
    - **การตรวจสอบสุขภาพระบบ** และการเลือก **Skills**

    มันยังจะแจ้งเตือนด้วยหากโมเดลที่คุณกำหนดค่าไว้ไม่รู้จักหรือไม่มี auth

  </Accordion>

  <Accordion title="ฉันจำเป็นต้องมี subscription ของ Claude หรือ OpenAI เพื่อรันสิ่งนี้หรือไม่?">
    ไม่ คุณสามารถรัน OpenClaw ด้วย **API keys** (Anthropic/OpenAI/อื่น ๆ) หรือด้วย
    **โมเดลในเครื่องเท่านั้น** เพื่อให้ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ Subscriptions (Claude
    Pro/Max หรือ OpenAI Codex) เป็นเพียงวิธีเลือกใช้สำหรับการยืนยันตัวตนกับ provider เหล่านั้น

    สำหรับ Anthropic ใน OpenClaw การแบ่งแบบใช้งานจริงคือ:

    - **Anthropic API key**: คิดค่าบริการตาม Anthropic API ปกติ
    - **Claude CLI / Claude subscription auth ใน OpenClaw**: ทีมงาน Anthropic
      แจ้งเราว่าการใช้งานแบบนี้ได้รับอนุญาตอีกครั้งแล้ว และ OpenClaw กำลังถือว่าการใช้งาน `claude -p`
      เป็นการใช้งานที่ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    สำหรับโฮสต์ gateway แบบ long-lived, Anthropic API key ยังคงเป็นการตั้งค่าที่
    คาดเดาได้มากกว่า OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือภายนอกอย่าง OpenClaw

    OpenClaw ยังรองรับตัวเลือกแบบ hosted subscription อื่น ๆ รวมถึง
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** และ
    **Z.AI / GLM Coding Plan**

    เอกสาร: [Anthropic](/th/providers/anthropic), [OpenAI](/th/providers/openai),
    [Qwen Cloud](/th/providers/qwen),
    [MiniMax](/th/providers/minimax), [GLM Models](/th/providers/glm),
    [โมเดลในเครื่อง](/th/gateway/local-models), [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันสามารถใช้ Claude Max subscription โดยไม่ใช้ API key ได้หรือไม่?">
    ได้

    ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบสไตล์ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น
    OpenClaw จึงถือว่า Claude subscription auth และการใช้งาน `claude -p` เป็นสิ่งที่ได้รับอนุญาต
    สำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ หากคุณต้องการ
    การตั้งค่าฝั่งเซิร์ฟเวอร์ที่คาดเดาได้มากที่สุด ให้ใช้ Anthropic API key แทน

  </Accordion>

  <Accordion title="รองรับ Claude subscription auth (Claude Pro หรือ Max) หรือไม่?">
    รองรับ

    ทีมงาน Anthropic แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
    การใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นสิ่งที่ได้รับอนุญาตสำหรับการผสานรวมนี้
    เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่

    Anthropic setup-token ยังใช้ได้เป็นเส้นทางโทเค็นที่รองรับใน OpenClaw แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้งาน
    สำหรับงาน production หรือเวิร์กโหลดหลายผู้ใช้ Anthropic API key auth ยังคงเป็น
    ทางเลือกที่ปลอดภัยและคาดเดาได้มากกว่า หากคุณต้องการตัวเลือก hosted แบบ subscription อื่น
    ใน OpenClaw ดู [OpenAI](/th/providers/openai), [Qwen / Model
    Cloud](/th/providers/qwen), [MiniMax](/th/providers/minimax) และ [GLM
    Models](/th/providers/glm)

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="เหตุใดฉันจึงเห็น HTTP 429 rate_limit_error จาก Anthropic?">
    นั่นหมายความว่า **quota/rate limit ของ Anthropic** ของคุณถูกใช้จนหมดสำหรับช่วงเวลาปัจจุบัน หากคุณ
    ใช้ **Claude CLI** ให้รอจนกว่าช่วงเวลานั้นจะรีเซ็ตหรืออัปเกรดแพ็กเกจของคุณ หากคุณ
    ใช้ **Anthropic API key** ให้ตรวจสอบ Anthropic Console
    สำหรับ usage/billing และเพิ่มลิมิตตามต้องการ

    หากข้อความระบุชัดว่า:
    `Extra usage is required for long context requests` แสดงว่าคำขอกำลังพยายามใช้
    1M context beta ของ Anthropic (`context1m: true`) ซึ่งจะใช้ได้ก็ต่อเมื่อ
    ข้อมูลรับรองของคุณมีสิทธิ์สำหรับการคิดค่าบริการแบบ long-context (การคิดค่าบริการด้วย API key หรือ
    เส้นทาง Claude-login ของ OpenClaw ที่เปิด Extra Usage ไว้)

    เคล็ดลับ: ตั้งค่า **fallback model** เพื่อให้ OpenClaw ยังสามารถตอบกลับได้ในขณะที่ provider ตัวหนึ่งกำลังติด rate limit
    ดู [โมเดล](/th/cli/models), [OAuth](/th/concepts/oauth) และ
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/th/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)

  </Accordion>

  <Accordion title="รองรับ AWS Bedrock หรือไม่?">
    รองรับ OpenClaw มี provider **Amazon Bedrock (Converse)** ที่รวมมาให้ เมื่อมี AWS env markers อยู่ OpenClaw จะสามารถค้นพบแค็ตตาล็อก Bedrock แบบ streaming/text โดยอัตโนมัติและรวมเข้ามาเป็น provider `amazon-bedrock` แบบ implicit; มิฉะนั้นคุณสามารถเปิดใช้ `plugins.entries.amazon-bedrock.config.discovery.enabled` อย่างชัดเจนหรือเพิ่มรายการ provider แบบ manual ได้ ดู [Amazon Bedrock](/th/providers/bedrock) และ [ผู้ให้บริการโมเดล](/th/providers/models) หากคุณชอบ flow แบบ managed key ก็ยังสามารถใช้ OpenAI-compatible proxy ที่อยู่หน้า Bedrock ได้เช่นกัน
  </Accordion>

  <Accordion title="Codex auth ทำงานอย่างไร?">
    OpenClaw รองรับ **OpenAI Code (Codex)** ผ่าน OAuth (การลงชื่อเข้าใช้ ChatGPT) ใช้
    `openai-codex/gpt-5.5` สำหรับ Codex OAuth ผ่าน PI runner ค่าเริ่มต้น ใช้
    `openai/gpt-5.5` สำหรับการเข้าถึงโดยตรงผ่าน OpenAI API key GPT-5.5 ยังสามารถใช้
    subscription/OAuth ผ่าน `openai-codex/gpt-5.5` หรือรันผ่าน native Codex app-server
    ด้วย `openai/gpt-5.5` และ `agentRuntime.id: "codex"` ได้
    ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="เหตุใด OpenClaw จึงยังพูดถึง openai-codex อยู่?">
    `openai-codex` คือ provider และ auth-profile id สำหรับ ChatGPT/Codex OAuth
    และยังเป็น PI model prefix แบบ explicit สำหรับ Codex OAuth ด้วย:

    - `openai/gpt-5.5` = เส้นทาง OpenAI API-key โดยตรงปัจจุบันใน PI
    - `openai-codex/gpt-5.5` = เส้นทาง Codex OAuth ใน PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = เส้นทาง native Codex app-server
    - `openai-codex:...` = auth profile id ไม่ใช่ model ref

    หากคุณต้องการเส้นทางการคิดค่าบริการ/ลิมิตโดยตรงของ OpenAI Platform ให้ตั้งค่า
    `OPENAI_API_KEY` หากคุณต้องการ auth แบบ subscription ของ ChatGPT/Codex ให้ลงชื่อเข้าใช้ด้วย
    `openclaw models auth login --provider openai-codex` และใช้
    model ref แบบ `openai-codex/*` สำหรับการรัน PI

  </Accordion>

  <Accordion title="เหตุใดลิมิตของ Codex OAuth จึงอาจต่างจาก ChatGPT บนเว็บ?">
    Codex OAuth ใช้หน้าต่าง quota ที่จัดการโดย OpenAI และขึ้นกับแพ็กเกจ ในทางปฏิบัติ
    ลิมิตเหล่านั้นอาจต่างจากประสบการณ์บนเว็บไซต์/แอป ChatGPT แม้ว่า
    ทั้งสองอย่างจะผูกกับบัญชีเดียวกันก็ตาม

    OpenClaw สามารถแสดง usage/quota window ของ provider ที่มองเห็นอยู่ในขณะนั้นได้ใน
    `openclaw models status` แต่จะไม่สร้างหรือ normalize สิทธิ์แบบ ChatGPT-web
    ให้กลายเป็นการเข้าถึง API โดยตรง หากคุณต้องการเส้นทางการคิดค่าบริการ/ลิมิตโดยตรงของ OpenAI Platform
    ให้ใช้ `openai/*` พร้อม API key

  </Accordion>

  <Accordion title="รองรับ OpenAI subscription auth (Codex OAuth) หรือไม่?">
    รองรับ OpenClaw รองรับ **OpenAI Code (Codex) subscription OAuth** อย่างสมบูรณ์
    OpenAI อนุญาตอย่างชัดเจนให้ใช้ subscription OAuth ในเครื่องมือ/เวิร์กโฟลว์ภายนอก
    เช่น OpenClaw onboarding สามารถรัน flow ของ OAuth ให้คุณได้

    ดู [OAuth](/th/concepts/oauth), [ผู้ให้บริการโมเดล](/th/concepts/model-providers) และ [Onboarding (CLI)](/th/start/wizard)

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Gemini CLI OAuth ได้อย่างไร?">
    Gemini CLI ใช้ **plugin auth flow** ไม่ใช่ client id หรือ secret ใน `openclaw.json`

    ขั้นตอน:

    1. ติดตั้ง Gemini CLI ในเครื่อง เพื่อให้ `gemini` อยู่บน `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. เปิดใช้ Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. โมเดลค่าเริ่มต้นหลัง login: `google-gemini-cli/gemini-3-flash-preview`
    5. หากคำขอล้มเหลว ให้ตั้ง `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway

    วิธีนี้จะเก็บ OAuth token ไว้ใน auth profile บนโฮสต์ gateway รายละเอียด: [ผู้ให้บริการโมเดล](/th/concepts/model-providers)

  </Accordion>

  <Accordion title="โมเดลในเครื่องเหมาะสำหรับแชตทั่วไปหรือไม่?">
    โดยทั่วไปไม่เหมาะ OpenClaw ต้องการบริบทขนาดใหญ่ + ความปลอดภัยที่แข็งแรง; โมเดลขนาดเล็กจะตัดทอนและรั่วได้ หากจำเป็นจริง ๆ ให้รันบิลด์โมเดล **ที่ใหญ่ที่สุด** ที่คุณสามารถรันในเครื่องได้ (LM Studio) และดู [/gateway/local-models](/th/gateway/local-models) โมเดลขนาดเล็ก/แบบ quantized เพิ่มความเสี่ยงด้าน prompt-injection - ดู [ความปลอดภัย](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันจะทำให้ทราฟฟิกของ hosted model อยู่ในภูมิภาคที่กำหนดได้อย่างไร?">
    เลือกปลายทางที่ pin ภูมิภาคไว้ OpenRouter เปิดตัวเลือกที่โฮสต์ในสหรัฐสำหรับ MiniMax, Kimi และ GLM; ให้เลือกตัวเลือกที่โฮสต์ในสหรัฐเพื่อคงข้อมูลไว้ในภูมิภาคนั้น คุณยังสามารถแสดง Anthropic/OpenAI ควบคู่ไปกับสิ่งเหล่านี้ได้โดยใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งาน ขณะเดียวกันก็ยังเคารพ provider ที่กำหนดภูมิภาคไว้ที่คุณเลือก
  </Accordion>

  <Accordion title="ฉันต้องซื้อ Mac Mini เพื่อติดตั้งสิ่งนี้หรือไม่?">
    ไม่ OpenClaw รันได้บน macOS หรือ Linux (Windows ผ่าน WSL2) Mac mini เป็นทางเลือกเท่านั้น - บางคน
    ซื้อมาใช้เป็นโฮสต์แบบ always-on แต่ VPS ขนาดเล็ก, home server หรือเครื่องระดับ Raspberry Pi ก็ใช้ได้เช่นกัน

    คุณต้องใช้ Mac **เฉพาะสำหรับเครื่องมือที่ใช้ได้เฉพาะบน macOS** เท่านั้น สำหรับ iMessage ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) (แนะนำ) - เซิร์ฟเวอร์ BlueBubbles รันได้บน Mac ใดก็ได้ และ Gateway สามารถรันบน Linux หรือที่อื่นได้ หากคุณต้องการเครื่องมืออื่นที่ใช้ได้เฉพาะบน macOS ให้รัน Gateway บน Mac หรือจับคู่ macOS node

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes), [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันต้องมี Mac mini สำหรับรองรับ iMessage หรือไม่?">
    คุณต้องมี **อุปกรณ์ macOS สักเครื่องหนึ่ง** ที่ลงชื่อเข้าใช้ Messages อยู่ โดย **ไม่จำเป็น** ต้องเป็น Mac mini -
    Mac เครื่องใดก็ได้ **ใช้ [BlueBubbles](/th/channels/bluebubbles)** (แนะนำ) สำหรับ iMessage - เซิร์ฟเวอร์ BlueBubbles รันบน macOS ส่วน Gateway สามารถรันบน Linux หรือที่อื่นได้

    การติดตั้งที่พบบ่อย:

    - รัน Gateway บน Linux/VPS และรันเซิร์ฟเวอร์ BlueBubbles บน Mac ใดก็ได้ที่ลงชื่อเข้าใช้ Messages
    - รันทุกอย่างบน Mac หากคุณต้องการการตั้งค่าแบบเครื่องเดียวที่ง่ายที่สุด

    เอกสาร: [BlueBubbles](/th/channels/bluebubbles), [Nodes](/th/nodes),
    [Mac remote mode](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ถ้าฉันซื้อ Mac mini เพื่อรัน OpenClaw ฉันจะเชื่อมมันกับ MacBook Pro ได้ไหม?">
    ได้ **Mac mini สามารถรัน Gateway ได้** และ MacBook Pro ของคุณสามารถเชื่อมต่อเป็น
    **node** (อุปกรณ์คู่หู) ได้ Nodes ไม่ได้รัน Gateway - มันให้ความสามารถเพิ่มเติม
    เช่น หน้าจอ/กล้อง/canvas และ `system.run` บนอุปกรณ์นั้น

    รูปแบบที่พบบ่อย:

    - Gateway อยู่บน Mac mini (always-on)
    - MacBook Pro รันแอป macOS หรือโฮสต์ node และจับคู่กับ Gateway
    - ใช้ `openclaw nodes status` / `openclaw nodes list` เพื่อดูสถานะ

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

  </Accordion>

  <Accordion title="ฉันสามารถใช้ Bun ได้หรือไม่?">
    **ไม่แนะนำ** ให้ใช้ Bun เราพบ runtime bug โดยเฉพาะกับ WhatsApp และ Telegram
    ให้ใช้ **Node** สำหรับ gateway ที่ต้องการความเสถียร

    หากคุณยังต้องการทดลองกับ Bun ให้ทำบน gateway ที่ไม่ใช่ production
    และไม่มี WhatsApp/Telegram

  </Accordion>

  <Accordion title="Telegram: ใน allowFrom ต้องใส่อะไร?">
    `channels.telegram.allowFrom` คือ **Telegram user ID ของผู้ส่งที่เป็นมนุษย์** (แบบตัวเลข) ไม่ใช่ username ของบอต

    การตั้งค่าจะขอเฉพาะ user ID แบบตัวเลข หากคุณมีรายการ `@username` แบบเดิมอยู่ใน config แล้ว `openclaw doctor --fix` สามารถลอง resolve ให้ได้

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    - ส่ง DM ไปยังบอตของคุณ จากนั้นรัน `openclaw logs --follow` แล้วอ่านค่า `from.id`

    Bot API อย่างเป็นทางการ:

    - ส่ง DM ไปยังบอตของคุณ จากนั้นเรียก `https://api.telegram.org/bot<bot_token>/getUpdates` แล้วอ่านค่า `message.from.id`

    บุคคลที่สาม (เป็นส่วนตัวน้อยกว่า):

    - ส่ง DM ไปที่ `@userinfobot` หรือ `@getidsbot`

    ดู [/channels/telegram](/th/channels/telegram#access-control-and-activation)

  </Accordion>

  <Accordion title="หลายคนสามารถใช้หมายเลข WhatsApp เดียวกับอินสแตนซ์ OpenClaw คนละตัวได้หรือไม่?">
    ได้ ผ่าน **การกำหนดเส้นทางหลายเอเจนต์** ผูก **DM** ของ WhatsApp ของผู้ส่งแต่ละคน (peer `kind: "direct"`, E.164 ของผู้ส่ง เช่น `+15551234567`) เข้ากับ `agentId` คนละตัว เพื่อให้แต่ละคนมี workspace และ session store ของตัวเอง การตอบกลับจะยังคงออกมาจาก **บัญชี WhatsApp เดียวกัน** และการควบคุมการเข้าถึง DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) เป็นแบบส่วนกลางต่อบัญชี WhatsApp ดู [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) และ [WhatsApp](/th/channels/whatsapp)
  </Accordion>

  <Accordion title='ฉันสามารถรันเอเจนต์ "แชตเร็ว" และเอเจนต์ "Opus สำหรับเขียนโค้ด" ได้หรือไม่?'>
    ได้ ใช้การกำหนดเส้นทางหลายเอเจนต์: กำหนดโมเดลค่าเริ่มต้นของแต่ละเอเจนต์ จากนั้นผูกเส้นทางขาเข้า (บัญชี provider หรือ peer เฉพาะ) เข้ากับแต่ละเอเจนต์ ตัวอย่าง config อยู่ใน [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) ดูเพิ่มเติมที่ [โมเดล](/th/concepts/models) และ [การกำหนดค่า](/th/gateway/configuration)
  </Accordion>

  <Accordion title="Homebrew ใช้บน Linux ได้หรือไม่?">
    ได้ Homebrew รองรับ Linux (Linuxbrew) การตั้งค่าแบบรวดเร็ว:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    หากคุณรัน OpenClaw ผ่าน systemd ให้ตรวจสอบว่า PATH ของ service มี `/home/linuxbrew/.linuxbrew/bin` (หรือ brew prefix ของคุณ) เพื่อให้เครื่องมือที่ติดตั้งด้วย `brew` resolve ได้ใน non-login shell
    บิลด์ล่าสุดยัง prepend ไดเรกทอรี user bin ทั่วไปบน Linux systemd services ด้วย (เช่น `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) และเคารพ `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` และ `FNM_DIR` เมื่อมีการตั้งค่าไว้

  </Accordion>

  <Accordion title="ความแตกต่างระหว่างการติดตั้งแบบ hackable git กับ npm install">
    - **การติดตั้งแบบ hackable (git):** มี source checkout เต็มรูปแบบ แก้ไขได้ เหมาะที่สุดสำหรับผู้ร่วมพัฒนา
      คุณ build ในเครื่องและแก้ไขโค้ด/เอกสารได้
    - **npm install:** การติดตั้ง CLI แบบ global ไม่มี repo เหมาะที่สุดสำหรับ "แค่รันมัน"
      การอัปเดตมาจาก npm dist-tags

    เอกสาร: [เริ่มต้นใช้งาน](/th/start/getting-started), [การอัปเดต](/th/install/updating)

  </Accordion>

  <Accordion title="ฉันสามารถสลับไปมาระหว่างการติดตั้งแบบ npm และ git ได้ภายหลังหรือไม่?">
    ได้ ใช้ `openclaw update --channel ...` เมื่อมีการติดตั้ง OpenClaw อยู่แล้ว
    วิธีนี้ **จะไม่ลบข้อมูลของคุณ** - มันเปลี่ยนเฉพาะการติดตั้งโค้ดของ OpenClaw
    state (`~/.openclaw`) และ workspace (`~/.openclaw/workspace`) ของคุณจะไม่ถูกแตะต้อง

    จาก npm ไปเป็น git:

    ```bash
    openclaw update --channel dev
    ```

    จาก git ไปเป็น npm:

    ```bash
    openclaw update --channel stable
    ```

    เพิ่ม `--dry-run` เพื่อดูตัวอย่างการสลับโหมดที่วางแผนไว้ก่อน updater จะรัน
    Doctor follow-up, รีเฟรช source ของ Plugin สำหรับช่องทางเป้าหมาย และ
    รีสตาร์ต gateway เว้นแต่คุณจะส่ง `--no-restart`

    ตัวติดตั้งก็สามารถบังคับใช้โหมดใดโหมดหนึ่งได้เช่นกัน:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    เคล็ดลับการสำรองข้อมูล: ดู [กลยุทธ์การสำรองข้อมูล](#where-things-live-on-disk)

  </Accordion>

  <Accordion title="ฉันควรรัน Gateway บนแล็ปท็อปหรือบน VPS?">
    คำตอบสั้น ๆ: **ถ้าคุณต้องการความน่าเชื่อถือแบบ 24/7 ให้ใช้ VPS** หากคุณต้องการ
    ความฝืดต่ำที่สุดและยอมรับเรื่อง sleep/restart ได้ ให้รันในเครื่อง

    **แล็ปท็อป (Gateway ในเครื่อง)**

    - **ข้อดี:** ไม่มีค่าเซิร์ฟเวอร์, เข้าถึงไฟล์ในเครื่องได้โดยตรง, มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้
    - **ข้อเสีย:** sleep/เครือข่ายหลุด = การเชื่อมต่อหลุด, การอัปเดต OS/รีบูตทำให้หยุดชะงัก, เครื่องต้องไม่หลับ

    **VPS / คลาวด์**

    - **ข้อดี:** always-on, เครือข่ายเสถียร, ไม่มีปัญหาแล็ปท็อป sleep, ดูแลง่ายกว่าในการให้รันต่อเนื่อง
    - **ข้อเสีย:** มักรันแบบ headless (ใช้ภาพหน้าจอแทน), เข้าถึงไฟล์ได้จากระยะไกลเท่านั้น, คุณต้อง SSH เพื่ออัปเดต

    **หมายเหตุเฉพาะของ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord ใช้งานได้ดีทั้งหมดจาก VPS สิ่งที่ต้องแลกจริง ๆ มีเพียง **เบราว์เซอร์แบบ headless** เทียบกับหน้าต่างที่มองเห็นได้ ดู [เบราว์เซอร์](/th/tools/browser)

    **ค่าเริ่มต้นที่แนะนำ:** ใช้ VPS หากก่อนหน้านี้คุณเคยมีปัญหา gateway หลุด การรันในเครื่องเหมาะมากเมื่อคุณใช้งาน Mac อยู่ตลอดและต้องการเข้าถึงไฟล์ในเครื่องหรือทำ UI automation ด้วยเบราว์เซอร์ที่มองเห็นได้

  </Accordion>

  <Accordion title="การรัน OpenClaw บนเครื่องเฉพาะมีความสำคัญแค่ไหน?">
    ไม่จำเป็น แต่ **แนะนำเพื่อความน่าเชื่อถือและการแยกขาด**

    - **โฮสต์เฉพาะ (VPS/Mac mini/Pi):** always-on, มีการหยุดชะงักจาก sleep/reboot น้อยกว่า, permissions สะอาดกว่า, ดูแลง่ายกว่าให้รันต่อเนื่อง
    - **แล็ปท็อป/เดสก์ท็อปร่วมใช้งาน:** ใช้ได้ดีมากสำหรับการทดสอบและการใช้งานจริงแบบ active แต่คาดว่าจะมีการหยุดชั่วคราวเมื่อเครื่อง sleep หรืออัปเดต

    หากคุณต้องการสิ่งที่ดีที่สุดของทั้งสองแบบ ให้คง Gateway ไว้บนโฮสต์เฉพาะ และจับคู่แล็ปท็อปของคุณเป็น **node** สำหรับเครื่องมือหน้าจอ/กล้อง/exec ในเครื่อง ดู [Nodes](/th/nodes)
    สำหรับแนวทางด้านความปลอดภัย โปรดอ่าน [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อกำหนดขั้นต่ำของ VPS และ OS ที่แนะนำคืออะไร?">
    OpenClaw มีน้ำหนักเบา สำหรับ Gateway พื้นฐาน + หนึ่งช่องทางแชต:

    - **ขั้นต่ำที่สุด:** 1 vCPU, RAM 1GB, ดิสก์ ~500MB
    - **แนะนำ:** 1-2 vCPU, RAM 2GB หรือมากกว่าเพื่อเผื่อทรัพยากร (ล็อก, สื่อ, หลายช่องทาง) เครื่องมือ Node และ browser automation อาจใช้ทรัพยากรมาก

    OS: ใช้ **Ubuntu LTS** (หรือ Debian/Ubuntu รุ่นใหม่ใดก็ได้) เส้นทางการติดตั้งบน Linux ถูกทดสอบดีที่สุดบนระบบเหล่านั้น

    เอกสาร: [Linux](/th/platforms/linux), [โฮสติ้ง VPS](/th/vps)

  </Accordion>

  <Accordion title="ฉันสามารถรัน OpenClaw ใน VM ได้หรือไม่ และมีข้อกำหนดอะไรบ้าง?">
    ได้ ให้ปฏิบัติต่อ VM เหมือน VPS: ต้องเปิดอยู่ตลอดเวลา เข้าถึงได้ และมี
    RAM เพียงพอสำหรับ Gateway และ channels ที่คุณเปิดใช้

    แนวทางพื้นฐาน:

    - **ขั้นต่ำที่สุด:** 1 vCPU, RAM 1GB
    - **แนะนำ:** RAM 2GB หรือมากกว่า หากคุณรันหลายช่องทาง browser automation หรือ media tools
    - **OS:** Ubuntu LTS หรือ Debian/Ubuntu รุ่นใหม่อื่น ๆ

    หากคุณใช้ Windows, **WSL2 คือการตั้งค่าแบบ VM ที่ง่ายที่สุด** และมีความเข้ากันได้กับเครื่องมือดีที่สุด ดู [Windows](/th/platforms/windows), [โฮสติ้ง VPS](/th/vps)
    หากคุณกำลังรัน macOS ใน VM ดู [macOS VM](/th/install/macos-vm)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก (โมเดล, เซสชัน, gateway, ความปลอดภัย และอื่น ๆ)
- [ภาพรวมการติดตั้ง](/th/install)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การแก้ไขปัญหา](/th/help/troubleshooting)
