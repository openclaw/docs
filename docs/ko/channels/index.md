---
read_when:
    - OpenClaw용 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼을 빠르게 살펴봐야 합니다
summary: OpenClaw이 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-07-16T12:16:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw은 이미 사용 중인 어떤 채팅 앱에서도 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 채널에서 지원되지만 미디어와 반응 기능은 채널마다 다릅니다.

iMessage, Telegram 및 WebChat UI는 코어 설치에 포함되어 제공됩니다. "공식 플러그인"으로 표시된 채널은
명령 하나(`openclaw plugins install @openclaw/<id>`)로 설치하거나
`openclaw onboard` / `openclaw channels add` 중 필요할 때 설치할 수 있으며, 이후 Gateway를
다시 시작해야 합니다. "외부 플러그인" 채널은 OpenClaw 저장소 외부에서 유지 관리됩니다.

## 지원 채널

- [Discord](/ko/channels/discord) - Discord Bot API + Gateway를 사용하며 서버, 채널 및 DM을 지원합니다(공식 플러그인).
- [Feishu](/ko/channels/feishu) - WebSocket을 통한 Feishu/Lark 봇입니다(공식 플러그인).
- [Google Chat](/ko/channels/googlechat) - HTTP Webhook을 통한 Google Chat API 앱입니다(공식 플러그인).
- [iMessage](/ko/channels/imessage) - 코어에 포함됩니다. 로그인된 Mac에서 `imsg` 브리지를 통해 네이티브 macOS 통합을 제공합니다(Gateway가 다른 곳에서 실행되는 경우 SSH 래퍼 사용). 답장, 탭백, 효과, 첨부 파일 및 그룹 관리를 위한 비공개 API 작업도 포함됩니다.
- [IRC](/ko/channels/irc) - 전통적인 IRC 서버를 지원하며 페어링/허용 목록 제어 기능이 있는 채널과 DM을 제공합니다(공식 플러그인).
- [LINE](/ko/channels/line) - LINE Messaging API 봇입니다(공식 플러그인).
- [Matrix](/ko/channels/matrix) - Matrix 프로토콜입니다(공식 플러그인).
- [Mattermost](/ko/channels/mattermost) - Bot API + WebSocket을 사용하며 채널, 그룹 및 DM을 지원합니다(공식 플러그인).
- [Microsoft Teams](/ko/channels/msteams) - Bot Framework이며 엔터프라이즈 환경을 지원합니다(공식 플러그인).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) - Nextcloud Talk을 통한 자체 호스팅 채팅입니다(공식 플러그인).
- [Nostr](/ko/channels/nostr) - NIP-04를 통한 탈중앙화 DM입니다(공식 플러그인).
- [QQ Bot](/ko/channels/qqbot) - QQ Bot API를 사용하며 비공개 채팅, 그룹 채팅 및 리치 미디어를 지원합니다(공식 플러그인).
- [Reef](/channels/reef) - 서로 다른 사람의 OpenClaw 에이전트 간에 보호되는 종단 간 암호화 클로 대 클로 메시징을 제공합니다(번들 플러그인).
- [Raft](/ko/channels/raft) - 사람과 에이전트의 협업을 위한 Raft CLI 깨우기 브리지입니다(공식 플러그인).
- [Signal](/ko/channels/signal) - signal-cli를 사용하며 개인정보 보호에 중점을 둡니다(공식 플러그인).
- [Slack](/ko/channels/slack) - Bolt SDK를 사용하는 워크스페이스 앱입니다(공식 플러그인).
- [SMS](/ko/channels/sms) - Gateway Webhook을 통해 Twilio 기반 SMS를 제공합니다(공식 플러그인).
- [Synology Chat](/ko/channels/synology-chat) - 송신 및 수신 Webhook을 통한 Synology NAS Chat입니다(공식 플러그인).
- [Telegram](/ko/channels/telegram) - 코어에 포함됩니다. grammY를 통한 Bot API이며 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) - Urbit 기반 메신저입니다(공식 플러그인).
- [Twitch](/ko/channels/twitch) - IRC 연결을 통한 Twitch 채팅입니다(공식 플러그인).
- [음성 통화](/ko/plugins/voice-call) - Plivo, Telnyx 또는 Twilio를 통한 전화 통신입니다(공식 플러그인).
- [WebChat](/ko/web/webchat) - 코어에 포함됩니다. WebSocket을 통한 Gateway WebChat UI입니다.
- [WeChat](/ko/channels/wechat) - QR 로그인을 사용하는 Tencent iLink 봇이며 비공개 채팅만 지원합니다(외부 플러그인).
- [WhatsApp](/ko/channels/whatsapp) - 가장 인기가 높으며 Baileys를 사용하고 QR 페어링이 필요합니다(공식 플러그인).
- [Yuanbao](/ko/channels/yuanbao) - Tencent Yuanbao 봇입니다(외부 플러그인).
- [Zalo](/ko/channels/zalo) - Zalo Bot API를 사용하는 베트남의 인기 메신저입니다(공식 플러그인).
- [Zalo ClawBot](/ko/channels/zaloclawbot) - QR 로그인을 통한 개인용 Zalo 어시스턴트이며 소유자에게 귀속됩니다(외부 플러그인).
- [Zalo Personal](/ko/channels/zalouser) - QR 로그인을 통한 Zalo 개인 계정입니다(공식 플러그인).

## 전송 참고 사항

- `![alt](url)`와 같은 마크다운 이미지 구문이 포함된 Telegram 답장은 가능한 경우
  최종 발신 경로에서 미디어 답장으로 변환됩니다.
- Slack의 여러 사람이 참여하는 DM은 그룹 채팅으로 라우팅되므로 그룹 정책, 멘션
  동작 및 그룹 세션 규칙이 MPIM 대화에 적용됩니다.
- WhatsApp 설정은 필요 시 설치 방식입니다. 온보딩에서는
  플러그인 패키지가 설치되기 전에도 설정 흐름을 표시할 수 있으며, Gateway는 채널이 실제로 활성화된
  경우에만 외부 ClawHub/npm 플러그인을 로드합니다.
- 봇이 작성한 수신 메시지를 허용하는 채널에서는 공유
  [봇 루프 방지](/ko/channels/bot-loop-protection)를 사용하여 봇 쌍이 서로에게
  무한히 답장하는 것을 방지할 수 있습니다.
- 지원되는 상시 활성 대화방에서는 [주변 대화방 이벤트](/ko/channels/ambient-room-events)를
  사용할 수 있으므로 에이전트가 `message` 도구로 전송하지 않는 한 멘션되지 않은 대화방의 대화가
  조용한 컨텍스트로 사용됩니다.

## 참고 사항

- 채널을 동시에 실행할 수 있습니다. 여러 채널을 구성하면 OpenClaw이 채팅별로 라우팅합니다.
- 일반적으로 가장 빠르게 설정할 수 있는 채널은 **Telegram**입니다(간단한 봇 토큰만 필요하며 플러그인을 설치하지 않아도 됩니다). WhatsApp은
  QR 페어링이 필요하며 디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [그룹](/ko/channels/groups)을 참조하십시오.
- 안전을 위해 DM 페어링 및 허용 목록이 적용됩니다. [보안](/ko/gateway/security)을 참조하십시오.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [모델 제공자](/ko/providers/models)를 참조하십시오.
