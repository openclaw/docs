---
read_when:
    - คุณต้องการแผนผังเอกสารประกอบที่ครบถ้วน
summary: ศูนย์รวมที่เชื่อมโยงไปยังเอกสาร OpenClaw ทุกหน้า
title: ศูนย์รวมเอกสาร
x-i18n:
    generated_at: "2026-07-12T16:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b51fc77155b2e7ed6cb6e36d375585ebd457c3d89f97c4151877d1aae20717f
    source_path: start/hubs.md
    workflow: 16
---

<Note>
หากคุณเพิ่งเริ่มใช้ OpenClaw ให้เริ่มจาก [เริ่มต้นใช้งาน](/th/start/getting-started)
</Note>

ใช้ศูนย์รวมเหล่านี้เพื่อค้นหาทุกหน้า รวมถึงเนื้อหาเชิงลึกและเอกสารอ้างอิงที่ไม่ปรากฏในแถบนำทางด้านซ้าย

## เริ่มที่นี่

- [ดัชนี](/th)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การเริ่มต้นใช้งานระบบ](/th/start/onboarding)
- [การเริ่มต้นใช้งานระบบ (CLI)](/th/start/wizard)
- [การตั้งค่า](/th/start/setup)
- [แดชบอร์ด (Gateway ภายในเครื่อง)](http://127.0.0.1:18789/)
- [ความช่วยเหลือ](/th/help)
- [ไดเรกทอรีเอกสาร](/th/start/docs-directory)
- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [ผู้ช่วย OpenClaw](/th/start/openclaw)
- [ตัวอย่างผลงาน](/th/start/showcase)
- [เรื่องราวเบื้องหลัง](/th/start/lore)

## การติดตั้งและการอัปเดต

- [Docker](/th/install/docker)
- [Nix](/th/install/nix)
- [การอัปเดต / การย้อนกลับ](/th/install/updating)
- [เวิร์กโฟลว์ Bun (ทดลอง)](/th/install/bun)

## แนวคิดหลัก

- [สถาปัตยกรรม](/th/concepts/architecture)
- [คุณลักษณะ](/th/concepts/features)
- [ศูนย์รวมเครือข่าย](/th/network)
- [รันไทม์ของเอเจนต์](/th/concepts/agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [หน่วยความจำ](/th/concepts/memory)
- [ลูปของเอเจนต์](/th/concepts/agent-loop)
- [การสตรีมและการแบ่งส่วน](/th/concepts/streaming)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [Compaction](/th/concepts/compaction)
- [เซสชัน](/th/concepts/session)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [เครื่องมือเซสชัน](/th/concepts/session-tool)
- [คิว](/th/concepts/queue)
- [คำสั่งแบบทับ](/th/tools/slash-commands)
- [อะแดปเตอร์ RPC](/th/reference/rpc)
- [สคีมา TypeBox](/th/concepts/typebox)
- [การจัดการเขตเวลา](/th/concepts/timezone)
- [สถานะการออนไลน์](/th/concepts/presence)
- [การค้นหาและการรับส่งข้อมูล](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [ข้อความกลุ่ม](/th/channels/group-messages)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
- [OAuth](/th/concepts/oauth)

## ผู้ให้บริการและช่องทางขาเข้า

- [ศูนย์รวมช่องทางแชต](/th/channels)
- [ศูนย์รวมผู้ให้บริการโมเดล](/th/providers/models)
- [Discord](/th/channels/discord)
- [iMessage](/th/channels/imessage)
- [Mattermost](/th/channels/mattermost)
- [QQ Bot](/th/channels/qqbot)
- [Signal](/th/channels/signal)
- [Slack](/th/channels/slack)
- [Telegram](/th/channels/telegram)
- [WebChat](/th/web/webchat)
- [WhatsApp](/th/channels/whatsapp)
- [การแยกวิเคราะห์ตำแหน่งที่ตั้ง](/th/channels/location)
- [Webhook](/th/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)

## Gateway และการดำเนินงาน

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [โมเดลเครือข่าย](/th/network#core-model)
- [การจับคู่ Gateway](/th/gateway/pairing)
- [การล็อก Gateway](/th/gateway/gateway-lock)
- [กระบวนการเบื้องหลัง](/th/gateway/background-process)
- [สถานะความพร้อมใช้งาน](/th/gateway/health)
- [Heartbeat](/th/gateway/heartbeat)
- [การวินิจฉัย](/th/gateway/doctor)
- [การบันทึกล็อก](/th/gateway/logging)
- [การแยกสภาพแวดล้อม](/th/gateway/sandboxing)
- [แดชบอร์ด](/th/web/dashboard)
- [ส่วนติดต่อผู้ใช้สำหรับควบคุม](/th/web/control-ui)
- [การเข้าถึงจากระยะไกล](/th/gateway/remote)
- [README สำหรับ Gateway ระยะไกล](/th/gateway/remote-gateway-readme)
- [Tailscale](/th/gateway/tailscale)
- [ความปลอดภัย](/th/gateway/security)
- [การแก้ไขปัญหา](/th/gateway/troubleshooting)

## เครื่องมือและระบบอัตโนมัติ

- [พื้นผิวเครื่องมือ](/th/tools)
- [OpenProse](/th/prose)
- [เอกสารอ้างอิง CLI](/th/cli)
- [เครื่องมือ Exec](/th/tools/exec)
- [เครื่องมือ PDF](/th/tools/pdf)
- [โหมดยกระดับสิทธิ์](/th/tools/elevated)
- [งาน Cron](/th/automation/cron-jobs)
- [ระบบอัตโนมัติ](/th/automation)
- [การคิดและการแสดงรายละเอียด](/th/tools/thinking)
- [โมเดล](/th/concepts/models)
- [เอเจนต์ย่อย](/th/tools/subagents)
- [CLI สำหรับส่งข้อมูลไปยังเอเจนต์](/th/tools/agent-send)
- [ส่วนติดต่อผู้ใช้ในเทอร์มินัล](/th/web/tui)
- [การควบคุมเบราว์เซอร์](/th/tools/browser)
- [เบราว์เซอร์ (การแก้ไขปัญหาบน Linux)](/th/tools/browser-linux-troubleshooting)
- [แบบสำรวจ](/th/cli/message)

## Node สื่อ และเสียง

- [ภาพรวม Node](/th/nodes)
- [กล้อง](/th/nodes/camera)
- [รูปภาพ](/th/nodes/images)
- [เสียง](/th/nodes/audio)
- [คำสั่งตำแหน่งที่ตั้ง](/th/nodes/location-command)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [โหมดสนทนา](/th/nodes/talk)

## แพลตฟอร์ม

- [ภาพรวมแพลตฟอร์ม](/th/platforms)
- [macOS](/th/platforms/macos)
- [iOS](/th/platforms/ios)
- [Android](/th/platforms/android)
- [ศูนย์รวม Windows](/th/platforms/windows)
- [Linux](/th/platforms/linux)
- [พื้นผิวเว็บ](/th/web)

## แอปคู่หูสำหรับ macOS (ขั้นสูง)

- [การตั้งค่าสภาพแวดล้อมพัฒนาสำหรับ macOS](/th/platforms/mac/dev-setup)
- [แถบเมนู macOS](/th/platforms/mac/menu-bar)
- [การปลุกด้วยเสียงบน macOS](/th/platforms/mac/voicewake)
- [โอเวอร์เลย์เสียงบน macOS](/th/platforms/mac/voice-overlay)
- [WebChat บน macOS](/th/platforms/mac/webchat)
- [Canvas บน macOS](/th/platforms/mac/canvas)
- [กระบวนการลูกบน macOS](/th/platforms/mac/child-process)
- [สถานะความพร้อมใช้งานบน macOS](/th/platforms/mac/health)
- [ไอคอน macOS](/th/platforms/mac/icon)
- [การบันทึกล็อกบน macOS](/th/platforms/mac/logging)
- [สิทธิ์บน macOS](/th/platforms/mac/permissions)
- [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)
- [การลงนามบน macOS](/th/platforms/mac/signing)
- [Gateway บน macOS (launchd)](/th/platforms/mac/bundled-gateway)
- [XPC บน macOS](/th/platforms/mac/xpc)
- [Skills บน macOS](/th/platforms/mac/skills)
- [Peekaboo บน macOS](/th/platforms/mac/peekaboo)

## Plugin

- [ภาพรวม Plugin](/th/tools/plugin)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ฮุกของ Plugin](/th/plugins/hooks)
- [ไฟล์กำกับของ Plugin](/th/plugins/manifest)
- [เครื่องมือเอเจนต์](/th/plugins/building-plugins#registering-agent-tools)
- [ชุดรวม Plugin](/th/plugins/bundles)
- [ClawHub](/clawhub)
- [คู่มือสูตรความสามารถ](/th/plugins/adding-capabilities)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
- [Plugin ผู้ใช้ Zalo](/th/plugins/zalouser)

## พื้นที่ทำงานและเทมเพลต

- [Skills](/th/tools/skills)
- [ClawHub](/clawhub)
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

- [ผู้มีส่วนร่วม](/th/reference/credits)

## การทดสอบและการเผยแพร่

- [การทดสอบ](/th/reference/test)
- [นโยบายการเผยแพร่](/th/reference/RELEASING)
- [รุ่นอุปกรณ์](/th/reference/device-models)

## เนื้อหาที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
