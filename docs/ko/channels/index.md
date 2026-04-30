---
read_when:
    - OpenClaw에 사용할 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼에 대한 간단한 개요가 필요합니다
summary: OpenClaw가 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-04-30T06:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw는 이미 사용하는 어떤 채팅 앱에서도 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 곳에서 지원되며, 미디어와 반응은 채널마다 다릅니다.

## 전달 참고 사항

- `![alt](url)`과 같은 마크다운 이미지 구문이 포함된 Telegram 답장은 가능한 경우 최종 아웃바운드 경로에서 미디어 답장으로 변환됩니다.
- Slack 다중 사용자 DM은 그룹 채팅으로 라우팅되므로 그룹 정책, 멘션 동작, 그룹 세션 규칙이 MPIM 대화에 적용됩니다.
- WhatsApp 설정은 필요할 때 설치하는 방식입니다. 온보딩은 Baileys 런타임 종속성이 준비되기 전에 설정 흐름을 표시할 수 있으며, Gateway는 채널이 실제로 활성화된 경우에만 WhatsApp 런타임을 로드합니다.

## 지원되는 채널

- [BlueBubbles](/ko/channels/bluebubbles) — **iMessage에 권장**; 전체 기능 지원이 포함된 BlueBubbles macOS 서버 REST API를 사용합니다(번들 Plugin; 편집, 전송 취소, 효과, 반응, 그룹 관리 — 편집은 현재 macOS 26 Tahoe에서 작동하지 않음).
- [Discord](/ko/channels/discord) — Discord Bot API + Gateway; 서버, 채널, DM을 지원합니다.
- [Feishu](/ko/channels/feishu) — WebSocket을 통한 Feishu/Lark 봇(번들 Plugin).
- [Google Chat](/ko/channels/googlechat) — HTTP Webhook을 통한 Google Chat API 앱.
- [iMessage (레거시)](/ko/channels/imessage) — imsg CLI를 통한 레거시 macOS 통합(사용 중단됨, 새 설정에는 BlueBubbles 사용).
- [IRC](/ko/channels/irc) — 클래식 IRC 서버; 페어링/허용 목록 제어가 포함된 채널 + DM.
- [LINE](/ko/channels/line) — LINE Messaging API 봇(번들 Plugin).
- [Matrix](/ko/channels/matrix) — Matrix 프로토콜(번들 Plugin).
- [Mattermost](/ko/channels/mattermost) — Bot API + WebSocket; 채널, 그룹, DM(번들 Plugin).
- [Microsoft Teams](/ko/channels/msteams) — Bot Framework; 엔터프라이즈 지원(번들 Plugin).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) — Nextcloud Talk을 통한 자체 호스팅 채팅(번들 Plugin).
- [Nostr](/ko/channels/nostr) — NIP-04를 통한 탈중앙화 DM(번들 Plugin).
- [QQ Bot](/ko/channels/qqbot) — QQ Bot API; 비공개 채팅, 그룹 채팅, 리치 미디어(번들 Plugin).
- [Signal](/ko/channels/signal) — signal-cli; 개인정보 보호 중심.
- [Slack](/ko/channels/slack) — Bolt SDK; 워크스페이스 앱.
- [Synology Chat](/ko/channels/synology-chat) — 발신+수신 Webhook을 통한 Synology NAS Chat(번들 Plugin).
- [Telegram](/ko/channels/telegram) — grammY를 통한 Bot API; 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) — Urbit 기반 메신저(번들 Plugin).
- [Twitch](/ko/channels/twitch) — IRC 연결을 통한 Twitch 채팅(번들 Plugin).
- [Voice Call](/ko/plugins/voice-call) — Plivo 또는 Twilio를 통한 전화 통신(Plugin, 별도 설치).
- [WebChat](/ko/web/webchat) — WebSocket을 통한 Gateway WebChat UI.
- [WeChat](/ko/channels/wechat) — QR 로그인을 통한 Tencent iLink Bot Plugin; 비공개 채팅만 지원(외부 Plugin).
- [WhatsApp](/ko/channels/whatsapp) — 가장 인기 있음; Baileys를 사용하며 QR 페어링이 필요합니다.
- [Yuanbao](/ko/channels/yuanbao) — Tencent Yuanbao 봇(외부 Plugin).
- [Zalo](/ko/channels/zalo) — Zalo Bot API; 베트남의 인기 메신저(번들 Plugin).
- [Zalo Personal](/ko/channels/zalouser) — QR 로그인을 통한 Zalo 개인 계정(번들 Plugin).

## 참고 사항

- 채널은 동시에 실행할 수 있습니다. 여러 개를 구성하면 OpenClaw가 채팅별로 라우팅합니다.
- 가장 빠른 설정은 일반적으로 **Telegram**입니다(간단한 봇 토큰). WhatsApp은 QR 페어링이 필요하며 디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [그룹](/ko/channels/groups)을 참조하세요.
- 안전을 위해 DM 페어링과 허용 목록이 적용됩니다. [보안](/ko/gateway/security)을 참조하세요.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [모델 제공자](/ko/providers/models)를 참조하세요.
