---
read_when:
    - คุณต้องการแผนผังที่ครบถ้วนของเอกสาร
summary: ศูนย์รวมที่ลิงก์ไปยังเอกสาร OpenClaw ทุกหน้า
title: ศูนย์รวมเอกสาร
x-i18n:
    generated_at: "2026-05-06T09:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c5822f46d0c4014ec5874d06c40f9adbe4439e8164cc75709e15c519b3e11af
    source_path: start/hubs.md
    workflow: 16
---

<Note>
หากคุณยังใหม่กับ OpenClaw ให้เริ่มที่ [เริ่มต้นใช้งาน](/th/start/getting-started)
</Note>

ใช้ฮับเหล่านี้เพื่อค้นหาทุกหน้า รวมถึงบทเจาะลึกและเอกสารอ้างอิงที่ไม่ปรากฏในแถบนำทางด้านซ้าย

## เริ่มที่นี่

- [ดัชนี](/th)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การเริ่มต้นใช้งาน](/th/start/onboarding)
- [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- [การตั้งค่า](/th/start/setup)
- [Dashboard (Gateway ภายในเครื่อง)](http://127.0.0.1:18789/)
- [ความช่วยเหลือ](/th/help)
- [ไดเรกทอรีเอกสาร](/th/start/docs-directory)
- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [ผู้ช่วย OpenClaw](/th/start/openclaw)
- [ผลงานตัวอย่าง](/th/start/showcase)
- [ตำนาน](/th/start/lore)

## การติดตั้ง + การอัปเดต

- [Docker](/th/install/docker)
- [Nix](/th/install/nix)
- [การอัปเดต / การย้อนกลับ](/th/install/updating)
- [เวิร์กโฟลว์ Bun (ทดลอง)](/th/install/bun)

## แนวคิดหลัก

- [สถาปัตยกรรม](/th/concepts/architecture)
- [ฟีเจอร์](/th/concepts/features)
- [ฮับเครือข่าย](/th/network)
- [รันไทม์ของเอเจนต์](/th/concepts/agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [หน่วยความจำ](/th/concepts/memory)
- [ลูปเอเจนต์](/th/concepts/agent-loop)
- [การสตรีม + การแบ่งชังก์](/th/concepts/streaming)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [Compaction](/th/concepts/compaction)
- [เซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [เครื่องมือเซสชัน](/th/concepts/session-tool)
- [คิว](/th/concepts/queue)
- [คำสั่งแบบสแลช](/th/tools/slash-commands)
- [อะแดปเตอร์ RPC](/th/reference/rpc)
- [สคีมา TypeBox](/th/concepts/typebox)
- [การจัดการเขตเวลา](/th/concepts/timezone)
- [สถานะการปรากฏตัว](/th/concepts/presence)
- [การค้นพบ + การขนส่ง](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
- [OAuth](/th/concepts/oauth)

## ผู้ให้บริการ + ทางเข้า

- [ฮับช่องทางแชท](/th/channels)
- [ฮับผู้ให้บริการโมเดล](/th/providers/models)
- [WhatsApp](/th/channels/whatsapp)
- [Telegram](/th/channels/telegram)
- [Slack](/th/channels/slack)
- [Discord](/th/channels/discord)
- [Mattermost](/th/channels/mattermost)
- [Signal](/th/channels/signal)
- [BlueBubbles (iMessage)](/th/channels/bluebubbles)
- [QQ Bot](/th/channels/qqbot)
- [iMessage (เดิม)](/th/channels/imessage)
- [การแยกวิเคราะห์ตำแหน่ง](/th/channels/location)
- [WebChat](/th/web/webchat)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + การดำเนินงาน

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [โมเดลเครือข่าย](/th/network#core-model)
- [การจับคู่ Gateway](/th/gateway/pairing)
- [ล็อก Gateway](/th/gateway/gateway-lock)
- [กระบวนการเบื้องหลัง](/th/gateway/background-process)
- [สถานะสุขภาพ](/th/gateway/health)
- [Heartbeat](/th/gateway/heartbeat)
- [Doctor](/th/gateway/doctor)
- [การบันทึกล็อก](/th/gateway/logging)
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)
- [Dashboard](/th/web/dashboard)
- [Control UI](/th/web/control-ui)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [README ของ Gateway ระยะไกล](/th/gateway/remote-gateway-readme)
- [Tailscale](/th/gateway/tailscale)
- [ความปลอดภัย](/th/gateway/security)
- [การแก้ไขปัญหา](/th/gateway/troubleshooting)

## เครื่องมือ + ระบบอัตโนมัติ

- [พื้นผิวเครื่องมือ](/th/tools)
- [OpenProse](/th/prose)
- [ข้อมูลอ้างอิง CLI](/th/cli)
- [เครื่องมือ Exec](/th/tools/exec)
- [เครื่องมือ PDF](/th/tools/pdf)
- [โหมดยกระดับสิทธิ์](/th/tools/elevated)
- [งาน Cron](/th/automation/cron-jobs)
- [ระบบอัตโนมัติและงาน](/th/automation)
- [การคิด + แบบละเอียด](/th/tools/thinking)
- [โมเดล](/th/concepts/models)
- [เอเจนต์ย่อย](/th/tools/subagents)
- [CLI ส่งเอเจนต์](/th/tools/agent-send)
- [Terminal UI](/th/web/tui)
- [การควบคุมเบราว์เซอร์](/th/tools/browser)
- [เบราว์เซอร์ (การแก้ไขปัญหา Linux)](/th/tools/browser-linux-troubleshooting)
- [โพล](/th/cli/message)

## Node สื่อ เสียง

- [ภาพรวม Node](/th/nodes)
- [กล้อง](/th/nodes/camera)
- [รูปภาพ](/th/nodes/images)
- [เสียง](/th/nodes/audio)
- [คำสั่งตำแหน่ง](/th/nodes/location-command)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [โหมดสนทนา](/th/nodes/talk)

## แพลตฟอร์ม

- [ภาพรวมแพลตฟอร์ม](/th/platforms)
- [macOS](/th/platforms/macos)
- [iOS](/th/platforms/ios)
- [Android](/th/platforms/android)
- [Windows (WSL2)](/th/platforms/windows)
- [Linux](/th/platforms/linux)
- [พื้นผิวเว็บ](/th/web)

## แอปคู่หู macOS (ขั้นสูง)

- [การตั้งค่าสภาพแวดล้อมพัฒนา macOS](/th/platforms/mac/dev-setup)
- [แถบเมนู macOS](/th/platforms/mac/menu-bar)
- [การปลุกด้วยเสียงบน macOS](/th/platforms/mac/voicewake)
- [โอเวอร์เลย์เสียงบน macOS](/th/platforms/mac/voice-overlay)
- [macOS WebChat](/th/platforms/mac/webchat)
- [macOS Canvas](/th/platforms/mac/canvas)
- [กระบวนการลูกของ macOS](/th/platforms/mac/child-process)
- [สถานะสุขภาพ macOS](/th/platforms/mac/health)
- [ไอคอน macOS](/th/platforms/mac/icon)
- [การบันทึกล็อก macOS](/th/platforms/mac/logging)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
- [macOS ระยะไกล](/th/platforms/mac/remote)
- [การลงนาม macOS](/th/platforms/mac/signing)
- [macOS gateway (launchd)](/th/platforms/mac/bundled-gateway)
- [macOS XPC](/th/platforms/mac/xpc)
- [macOS skills](/th/platforms/mac/skills)
- [macOS Peekaboo](/th/platforms/mac/peekaboo)

## Plugins

- [ภาพรวม Plugins](/th/tools/plugin)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [ฮุก Plugin](/th/plugins/hooks)
- [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- [เครื่องมือเอเจนต์](/th/plugins/building-plugins#registering-agent-tools)
- [บันเดิล Plugin](/th/plugins/bundles)
- [Plugins ชุมชน](/th/plugins/community)
- [คู่มือสูตรความสามารถ](/th/plugins/adding-capabilities)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
- [Plugin ผู้ใช้ Zalo](/th/plugins/zalouser)

## พื้นที่ทำงาน + เทมเพลต

- [Skills](/th/tools/skills)
- [ClawHub](/th/tools/clawhub)
- [การกำหนดค่า Skills](/th/tools/skills-config)
- [AGENTS เริ่มต้น](/th/reference/AGENTS.default)
- [เทมเพลต: AGENTS](/th/reference/templates/AGENTS)
- [เทมเพลต: BOOTSTRAP](/th/reference/templates/BOOTSTRAP)
- [เทมเพลต: HEARTBEAT](/th/reference/templates/HEARTBEAT)
- [เทมเพลต: IDENTITY](/th/reference/templates/IDENTITY)
- [เทมเพลต: SOUL](/th/reference/templates/SOUL)
- [เทมเพลต: TOOLS](/th/reference/templates/TOOLS)
- [เทมเพลต: USER](/th/reference/templates/USER)

## โครงการ

- [เครดิต](/th/reference/credits)

## การทดสอบ + การเผยแพร่

- [การทดสอบ](/th/reference/test)
- [นโยบายการเผยแพร่](/th/reference/RELEASING)
- [โมเดลอุปกรณ์](/th/reference/device-models)

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
