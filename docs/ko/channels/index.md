---
read_when:
    - OpenClaw에 사용할 채팅 채널을 선택하려고 합니다
    - 지원되는 메시징 플랫폼에 대한 간단한 개요가 필요합니다
summary: OpenClaw가 연결할 수 있는 메시징 플랫폼
title: 채팅 채널
x-i18n:
    generated_at: "2026-06-27T17:10:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw는 이미 사용 중인 어떤 채팅 앱에서도 사용자와 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 곳에서 지원되며, 미디어와 반응은 채널마다 다릅니다.

## 전달 참고 사항

- `![alt](url)` 같은 마크다운 이미지 구문이 포함된 Telegram 답장은
  가능한 경우 최종 발신 경로에서 미디어 답장으로 변환됩니다.
- Slack 다중 사용자 DM은 그룹 채팅으로 라우팅되므로 그룹 정책, 멘션
  동작, 그룹 세션 규칙이 MPIM 대화에 적용됩니다.
- WhatsApp 설정은 필요 시 설치 방식입니다. 온보딩은
  Plugin 패키지가 설치되기 전에 설정 흐름을 표시할 수 있으며,
  Gateway는 채널이 실제로 활성 상태일 때만 외부
  ClawHub/npm Plugin을 로드합니다.
- 봇이 작성한 인바운드 메시지를 허용하는 채널은 공유
  [봇 루프 보호](/ko/channels/bot-loop-protection)를 사용하여 봇 쌍이
  서로에게 무기한 답장하는 것을 방지할 수 있습니다.
- 지원되는 상시 활성 방은 [주변 방 이벤트](/ko/channels/ambient-room-events)를 사용할 수 있어,
  에이전트가 `message` 도구로 보내지 않는 한 멘션되지 않은 방 대화가 조용한 컨텍스트가 됩니다.

## 지원되는 채널

- [Discord](/ko/channels/discord) - Discord Bot API + Gateway. 서버, 채널, DM을 지원합니다.
- [Feishu](/ko/channels/feishu) - WebSocket을 통한 Feishu/Lark 봇(번들 Plugin).
- [Google Chat](/ko/channels/googlechat) - HTTP webhook을 통한 Google Chat API 앱(다운로드 가능한 Plugin).
- [iMessage](/ko/channels/imessage) - 로그인된 Mac의 `imsg` 브리지를 통한 네이티브 macOS 통합(또는 Gateway가 다른 곳에서 실행될 때 SSH 래퍼). 답장, 탭백, 효과, 첨부 파일, 그룹 관리를 위한 비공개 API 작업을 포함합니다. 호스트 권한과 메시지 접근이 적합한 새 OpenClaw iMessage 설정에 권장됩니다.
- [IRC](/ko/channels/irc) - 클래식 IRC 서버. 페어링/허용 목록 제어가 있는 채널 + DM.
- [LINE](/ko/channels/line) - LINE Messaging API 봇(다운로드 가능한 Plugin).
- [Matrix](/ko/channels/matrix) - Matrix 프로토콜(다운로드 가능한 Plugin).
- [Mattermost](/ko/channels/mattermost) - Bot API + WebSocket. 채널, 그룹, DM(다운로드 가능한 Plugin).
- [Microsoft Teams](/ko/channels/msteams) - Bot Framework. 엔터프라이즈 지원(번들 Plugin).
- [Nextcloud Talk](/ko/channels/nextcloud-talk) - Nextcloud Talk을 통한 자체 호스팅 채팅(번들 Plugin).
- [Nostr](/ko/channels/nostr) - NIP-04를 통한 탈중앙화 DM(번들 Plugin).
- [QQ Bot](/ko/channels/qqbot) - QQ Bot API. 비공개 채팅, 그룹 채팅, 리치 미디어(번들 Plugin).
- [Raft](/ko/channels/raft) - 사람과 에이전트 협업을 위한 Raft CLI 깨우기 브리지(외부 Plugin).
- [Signal](/ko/channels/signal) - signal-cli. 개인정보 보호 중심.
- [Slack](/ko/channels/slack) - Bolt SDK. 워크스페이스 앱.
- [SMS](/ko/channels/sms) - Gateway webhook을 통한 Twilio 기반 SMS(공식 Plugin).
- [Synology Chat](/ko/channels/synology-chat) - 발신+수신 webhook을 통한 Synology NAS Chat(번들 Plugin).
- [Telegram](/ko/channels/telegram) - grammY를 통한 Bot API. 그룹을 지원합니다.
- [Tlon](/ko/channels/tlon) - Urbit 기반 메신저(번들 Plugin).
- [Twitch](/ko/channels/twitch) - IRC 연결을 통한 Twitch 채팅(번들 Plugin).
- [Voice Call](/ko/plugins/voice-call) - Plivo 또는 Twilio를 통한 전화 통신(Plugin, 별도 설치).
- [WebChat](/ko/web/webchat) - WebSocket 기반 Gateway WebChat UI.
- [WeChat](/ko/channels/wechat) - QR 로그인을 통한 Tencent iLink Bot Plugin. 비공개 채팅만 지원(외부 Plugin).
- [WhatsApp](/ko/channels/whatsapp) - 가장 널리 사용됨. Baileys를 사용하며 QR 페어링이 필요합니다.
- [Yuanbao](/ko/channels/yuanbao) - Tencent Yuanbao 봇(외부 Plugin).
- [Zalo](/ko/channels/zalo) - Zalo Bot API. 베트남의 인기 메신저(번들 Plugin).
- [Zalo ClawBot](/ko/channels/zaloclawbot) - QR 로그인을 통한 개인용 Zalo 어시스턴트. 소유자에 귀속됨(외부 Plugin).
- [Zalo Personal](/ko/channels/zalouser) - QR 로그인을 통한 Zalo 개인 계정(번들 Plugin).

## 참고 사항

- 채널은 동시에 실행될 수 있습니다. 여러 개를 구성하면 OpenClaw가 채팅별로 라우팅합니다.
- 가장 빠른 설정은 보통 **Telegram**입니다(간단한 봇 토큰). WhatsApp은 QR 페어링이 필요하며
  디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [그룹](/ko/channels/groups)을 참조하세요.
- 안전을 위해 DM 페어링과 허용 목록이 강제됩니다. [보안](/ko/gateway/security)을 참조하세요.
- 문제 해결: [채널 문제 해결](/ko/channels/troubleshooting).
- 모델 제공자는 별도로 문서화되어 있습니다. [모델 제공자](/ko/providers/models)를 참조하세요.
