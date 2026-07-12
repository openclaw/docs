---
read_when:
    - OpenClaw용 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼을 빠르게 개괄해야 합니다
summary: OpenClaw이 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-07-12T14:57:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw은 이미 사용 중인 어떤 채팅 앱에서든 사용자와 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 채널에서 지원되며, 미디어와 반응 지원 여부는 채널마다 다릅니다.

iMessage, Telegram 및 WebChat UI는 핵심 설치에 포함되어 제공됩니다. "공식 Plugin"으로 표시된 채널은
명령 하나(`openclaw plugins install @openclaw/<id>`)로 설치하거나
`openclaw onboard` / `openclaw channels add` 실행 중 필요할 때 설치할 수 있으며, 이후 Gateway를
재시작해야 합니다. "외부 Plugin" 채널은 OpenClaw 저장소 외부에서 유지 관리됩니다.

## 지원되는 채널

- [Discord](/ko/channels/discord) - Discord Bot API + Gateway를 사용하며, 서버, 채널 및 DM을 지원합니다(공식 Plugin).
- [Feishu](/ko/channels/feishu) - WebSocket을 통한 Feishu/Lark 봇입니다(공식 Plugin).
- [Google Chat](/ko/channels/googlechat) - HTTP Webhook을 통한 Google Chat API 앱입니다(공식 Plugin).
- [iMessage](/ko/channels/imessage) - 핵심에 포함됩니다. 로그인된 Mac에서 `imsg` 브리지를 통해 기본 macOS 통합을 제공하며(Gateway가 다른 곳에서 실행되는 경우 SSH 래퍼 사용), 답장, 탭백, 효과, 첨부 파일 및 그룹 관리를 위한 비공개 API 작업도 포함합니다.
- [IRC](/ko/channels/irc) - 기존 IRC 서버를 지원하며, 페어링/허용 목록 제어 기능이 있는 채널 및 DM을 제공합니다(공식 Plugin).
- [LINE](/ko/channels/line) - LINE Messaging API 봇입니다(공식 Plugin).
- [Matrix](/ko/channels/matrix) - Matrix 프로토콜입니다(공식 Plugin).
- [Mattermost](/ko/channels/mattermost) - Bot API + WebSocket을 사용하며, 채널, 그룹 및 DM을 지원합니다(공식 Plugin).
- [Microsoft Teams](/ko/channels/msteams) - Bot Framework를 사용하며, 엔터프라이즈를 지원합니다(공식 Plugin).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) - Nextcloud Talk을 통한 자체 호스팅 채팅입니다(공식 Plugin).
- [Nostr](/ko/channels/nostr) - NIP-04를 통한 탈중앙화 DM입니다(공식 Plugin).
- [QQ Bot](/ko/channels/qqbot) - QQ Bot API를 사용하며, 비공개 채팅, 그룹 채팅 및 리치 미디어를 지원합니다(공식 Plugin).
- [Raft](/ko/channels/raft) - 사람과 에이전트의 협업을 위한 Raft CLI 깨우기 브리지입니다(공식 Plugin).
- [Signal](/ko/channels/signal) - signal-cli를 사용하며, 개인정보 보호에 중점을 둡니다(공식 Plugin).
- [Slack](/ko/channels/slack) - Bolt SDK를 사용하며, 워크스페이스 앱을 지원합니다(공식 Plugin).
- [SMS](/ko/channels/sms) - Gateway Webhook을 통해 Twilio 기반 SMS를 제공합니다(공식 Plugin).
- [Synology Chat](/ko/channels/synology-chat) - 송신+수신 Webhook을 통한 Synology NAS Chat입니다(공식 Plugin).
- [Telegram](/ko/channels/telegram) - 핵심에 포함됩니다. grammY를 통한 Bot API를 사용하며, 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) - Urbit 기반 메신저입니다(공식 Plugin).
- [Twitch](/ko/channels/twitch) - IRC 연결을 통한 Twitch 채팅입니다(공식 Plugin).
- [음성 통화](/ko/plugins/voice-call) - Plivo, Telnyx 또는 Twilio를 통한 전화 통신입니다(공식 Plugin).
- [WebChat](/ko/web/webchat) - 핵심에 포함됩니다. WebSocket을 통한 Gateway WebChat UI입니다.
- [WeChat](/ko/channels/wechat) - QR 로그인을 통한 Tencent iLink 봇이며, 비공개 채팅만 지원합니다(외부 Plugin).
- [WhatsApp](/ko/channels/whatsapp) - 가장 널리 사용되며, Baileys를 사용하고 QR 페어링이 필요합니다(공식 Plugin).
- [Yuanbao](/ko/channels/yuanbao) - Tencent Yuanbao 봇입니다(외부 Plugin).
- [Zalo](/ko/channels/zalo) - Zalo Bot API를 사용하며, 베트남에서 널리 사용되는 메신저입니다(공식 Plugin).
- [Zalo ClawBot](/ko/channels/zaloclawbot) - QR 로그인을 통한 개인용 Zalo 어시스턴트이며, 소유자에게 귀속됩니다(외부 Plugin).
- [Zalo Personal](/ko/channels/zalouser) - QR 로그인을 통한 Zalo 개인 계정입니다(공식 Plugin).

## 전달 참고 사항

- `![alt](url)`과 같은 Markdown 이미지 구문을 포함한 Telegram 답장은
  가능한 경우 최종 발신 경로에서 미디어 답장으로 변환됩니다.
- Slack 다자간 DM은 그룹 채팅으로 라우팅되므로 MPIM 대화에는 그룹 정책, 멘션
  동작 및 그룹 세션 규칙이 적용됩니다.
- WhatsApp 설정은 필요할 때 설치하는 방식입니다. 온보딩은
  Plugin 패키지가 설치되기 전에 설정 흐름을 표시할 수 있으며, Gateway는 채널이 실제로 활성화된
  경우에만 외부 ClawHub/npm Plugin을 로드합니다.
- 봇이 작성한 수신 메시지를 허용하는 채널에서는 공유
  [봇 루프 방지](/ko/channels/bot-loop-protection)를 사용하여 봇 쌍이
  서로에게 무한히 답장하지 않도록 할 수 있습니다.
- 지원되는 상시 활성 방에서는 [주변 방 이벤트](/ko/channels/ambient-room-events)를
  사용하여 에이전트가 `message` 도구로 전송하지 않는 한, 멘션되지 않은 방의 대화를 조용한 컨텍스트로 활용할 수 있습니다.

## 참고 사항

- 채널은 동시에 실행할 수 있습니다. 여러 채널을 구성하면 OpenClaw이 채팅별로 라우팅합니다.
- 일반적으로 가장 빠르게 설정할 수 있는 채널은 **Telegram**입니다(간단한 봇 토큰, Plugin 설치 불필요). WhatsApp은
  QR 페어링이 필요하며 디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [그룹](/ko/channels/groups)을 참조하십시오.
- 안전을 위해 DM 페어링과 허용 목록이 적용됩니다. [보안](/ko/gateway/security)을 참조하십시오.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [모델 제공자](/ko/providers/models)를 참조하십시오.
