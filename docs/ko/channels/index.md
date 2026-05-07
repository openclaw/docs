---
read_when:
    - OpenClaw에 사용할 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼에 대한 간략한 개요가 필요합니다
summary: OpenClaw가 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-05-07T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw은 이미 사용 중인 모든 채팅 앱에서 사용자와 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 곳에서 지원되며, 미디어와 반응은 채널마다 다릅니다.

## 전달 참고 사항

- `![alt](url)` 같은 마크다운 이미지 구문이 포함된 Telegram 답장은 가능한 경우 최종 발신 경로에서 미디어 답장으로 변환됩니다.
- Slack 다중 사용자 DM은 그룹 채팅으로 라우팅되므로 그룹 정책, 멘션 동작, 그룹 세션 규칙이 MPIM 대화에 적용됩니다.
- WhatsApp 설정은 필요 시 설치 방식입니다. 온보딩은 Plugin 패키지가 설치되기 전에 설정 흐름을 표시할 수 있으며, Gateway는 채널이 실제로 활성 상태일 때만 WhatsApp 런타임을 로드합니다.

## 지원되는 채널

- [BlueBubbles](/ko/channels/bluebubbles) - BlueBubbles macOS 서버 REST API를 통한 레거시 iMessage 브리지입니다. 새 OpenClaw 설정에서는 더 이상 권장되지 않지만 기존 구성과 더 풍부한 비공개 API 작업에 대해서는 계속 지원됩니다.
- [Discord](/ko/channels/discord) - Discord Bot API + Gateway입니다. 서버, 채널, DM을 지원합니다.
- [Feishu](/ko/channels/feishu) - WebSocket을 통한 Feishu/Lark 봇입니다(번들 Plugin).
- [Google Chat](/ko/channels/googlechat) - HTTP Webhook을 통한 Google Chat API 앱입니다(다운로드 가능한 Plugin).
- [iMessage](/ko/channels/imessage) - imsg CLI를 통한 네이티브 macOS 통합입니다. 호스트 권한과 메시지 접근 조건이 맞는 새 OpenClaw iMessage 설정에 권장됩니다.
- [IRC](/ko/channels/irc) - 클래식 IRC 서버입니다. 페어링/허용 목록 제어가 있는 채널 + DM입니다.
- [LINE](/ko/channels/line) - LINE Messaging API 봇입니다(다운로드 가능한 Plugin).
- [Matrix](/ko/channels/matrix) - Matrix 프로토콜입니다(다운로드 가능한 Plugin).
- [Mattermost](/ko/channels/mattermost) - Bot API + WebSocket입니다. 채널, 그룹, DM을 지원합니다(다운로드 가능한 Plugin).
- [Microsoft Teams](/ko/channels/msteams) - Bot Framework입니다. 엔터프라이즈 지원을 제공합니다(번들 Plugin).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) - Nextcloud Talk을 통한 자체 호스팅 채팅입니다(번들 Plugin).
- [Nostr](/ko/channels/nostr) - NIP-04를 통한 탈중앙화 DM입니다(번들 Plugin).
- [QQ Bot](/ko/channels/qqbot) - QQ Bot API입니다. 비공개 채팅, 그룹 채팅, 리치 미디어를 지원합니다(번들 Plugin).
- [Signal](/ko/channels/signal) - signal-cli입니다. 개인정보 보호에 중점을 둡니다.
- [Slack](/ko/channels/slack) - Bolt SDK입니다. 워크스페이스 앱을 지원합니다.
- [Synology Chat](/ko/channels/synology-chat) - 송신+수신 Webhook을 통한 Synology NAS Chat입니다(번들 Plugin).
- [Telegram](/ko/channels/telegram) - grammY를 통한 Bot API입니다. 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) - Urbit 기반 메신저입니다(번들 Plugin).
- [Twitch](/ko/channels/twitch) - IRC 연결을 통한 Twitch 채팅입니다(번들 Plugin).
- [음성 통화](/ko/plugins/voice-call) - Plivo 또는 Twilio를 통한 전화 통신입니다(Plugin, 별도 설치).
- [WebChat](/ko/web/webchat) - WebSocket 기반 Gateway WebChat UI입니다.
- [WeChat](/ko/channels/wechat) - QR 로그인을 통한 Tencent iLink Bot Plugin입니다. 비공개 채팅만 지원합니다(외부 Plugin).
- [WhatsApp](/ko/channels/whatsapp) - 가장 인기 있는 채널입니다. Baileys를 사용하며 QR 페어링이 필요합니다.
- [Yuanbao](/ko/channels/yuanbao) - Tencent Yuanbao 봇입니다(외부 Plugin).
- [Zalo](/ko/channels/zalo) - Zalo Bot API입니다. 베트남에서 인기 있는 메신저입니다(번들 Plugin).
- [Zalo Personal](/ko/channels/zalouser) - QR 로그인을 통한 Zalo 개인 계정입니다(번들 Plugin).

## 참고 사항

- 채널은 동시에 실행할 수 있습니다. 여러 개를 구성하면 OpenClaw이 채팅별로 라우팅합니다.
- 가장 빠른 설정은 일반적으로 **Telegram**입니다(간단한 봇 토큰). WhatsApp은 QR 페어링이 필요하며 디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [그룹](/ko/channels/groups)을 참조하세요.
- 안전을 위해 DM 페어링과 허용 목록이 적용됩니다. [보안](/ko/gateway/security)을 참조하세요.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [모델 제공자](/ko/providers/models)를 참조하세요.
