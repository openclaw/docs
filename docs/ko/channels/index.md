---
read_when:
    - OpenClaw에 사용할 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼을 빠르게 개요로 파악해야 합니다
summary: OpenClaw가 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-04-25T05:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw는 이미 사용 중인 어떤 채팅 앱에서든 사용자와 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 곳에서 지원되며, 미디어와 반응 지원은 채널마다 다릅니다.

## 전송 참고 사항

- `![alt](url)` 같은 마크다운 이미지 구문이 포함된 Telegram 답장은 가능할 경우 최종 아웃바운드 경로에서 미디어 답장으로 변환됩니다.
- Slack의 다중 사용자 DM은 그룹 채팅으로 라우팅되므로, MPIM 대화에는 그룹 정책, 멘션 동작, 그룹 세션 규칙이 적용됩니다.
- WhatsApp 설정은 필요 시 설치 방식입니다. 온보딩은 Baileys 런타임 의존성이 준비되기 전에도 설정 흐름을 표시할 수 있으며, Gateway는 채널이 실제로 활성화될 때만 WhatsApp 런타임을 로드합니다.

## 지원 채널

- [BlueBubbles](/ko/channels/bluebubbles) — **iMessage에 권장**; BlueBubbles macOS 서버 REST API를 사용하며 전체 기능을 지원합니다(번들 Plugin, 수정, 전송 취소, 효과, 반응, 그룹 관리 — 수정 기능은 현재 macOS 26 Tahoe에서 작동하지 않음).
- [Discord](/ko/channels/discord) — Discord Bot API + Gateway; 서버, 채널, DM을 지원합니다.
- [Feishu](/ko/channels/feishu) — WebSocket을 통한 Feishu/Lark 봇(번들 Plugin).
- [Google Chat](/ko/channels/googlechat) — HTTP Webhook을 통한 Google Chat API 앱.
- [iMessage (legacy)](/ko/channels/imessage) — imsg CLI를 통한 레거시 macOS 통합(사용 중단 예정, 새 설정에는 BlueBubbles 사용 권장).
- [IRC](/ko/channels/irc) — 전통적인 IRC 서버; 페어링/허용 목록 제어를 갖춘 채널 + DM.
- [LINE](/ko/channels/line) — LINE Messaging API 봇(번들 Plugin).
- [Matrix](/ko/channels/matrix) — Matrix 프로토콜(번들 Plugin).
- [Mattermost](/ko/channels/mattermost) — Bot API + WebSocket; 채널, 그룹, DM(번들 Plugin).
- [Microsoft Teams](/ko/channels/msteams) — Bot Framework; 엔터프라이즈 지원(번들 Plugin).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) — Nextcloud Talk를 통한 셀프 호스팅 채팅(번들 Plugin).
- [Nostr](/ko/channels/nostr) — NIP-04를 통한 분산형 DM(번들 Plugin).
- [QQ Bot](/ko/channels/qqbot) — QQ Bot API; 개인 채팅, 그룹 채팅, 리치 미디어(번들 Plugin).
- [Signal](/ko/channels/signal) — `signal-cli`; 개인정보 보호 중심.
- [Slack](/ko/channels/slack) — Bolt SDK; 워크스페이스 앱.
- [Synology Chat](/ko/channels/synology-chat) — 아웃고잉+인커밍 Webhook을 통한 Synology NAS Chat(번들 Plugin).
- [Telegram](/ko/channels/telegram) — grammY를 통한 Bot API; 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) — Urbit 기반 메신저(번들 Plugin).
- [Twitch](/ko/channels/twitch) — IRC 연결을 통한 Twitch 채팅(번들 Plugin).
- [Voice Call](/ko/plugins/voice-call) — Plivo 또는 Twilio를 통한 전화 통신(Plugin, 별도 설치).
- [WebChat](/ko/web/webchat) — WebSocket을 통한 Gateway WebChat UI.
- [WeChat](/ko/channels/wechat) — QR 로그인 방식의 Tencent iLink Bot Plugin; 개인 채팅만 지원(외부 Plugin).
- [WhatsApp](/ko/channels/whatsapp) — 가장 널리 사용됨; Baileys를 사용하며 QR 페어링이 필요합니다.
- [Zalo](/ko/channels/zalo) — Zalo Bot API; 베트남에서 인기 있는 메신저(번들 Plugin).
- [Zalo Personal](/ko/channels/zalouser) — QR 로그인 방식의 Zalo 개인 계정(번들 Plugin).

## 참고

- 채널은 동시에 실행할 수 있습니다. 여러 개를 구성하면 OpenClaw가 채팅별로 라우팅합니다.
- 가장 빠른 설정은 일반적으로 **Telegram**입니다(간단한 봇 토큰). WhatsApp은 QR 페어링이 필요하며 디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [Groups](/ko/channels/groups)를 참조하세요.
- DM 페어링과 허용 목록은 안전을 위해 적용됩니다. [Security](/ko/gateway/security)를 참조하세요.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [Model Providers](/ko/providers/models)를 참조하세요.
