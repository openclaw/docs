---
read_when:
    - OpenClaw가 지원하는 항목의 전체 목록이 필요한 경우
summary: 채널, 라우팅, 미디어, UX 전반의 OpenClaw 기능.
title: 기능
x-i18n:
    generated_at: "2026-06-27T17:22:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## 주요 내용

<Columns>
  <Card title="Channels" icon="message-square" href="/ko/channels">
    하나의 Gateway로 Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat 등을 사용할 수 있습니다.
  </Card>
  <Card title="Plugins" icon="plug" href="/ko/tools/plugin">
    일반적인 최신 릴리스에서는 번들 Plugin이 별도 설치 없이 Matrix, Nextcloud Talk, Nostr, Twitch, Zalo 등을 추가합니다.
  </Card>
  <Card title="Routing" icon="route" href="/ko/concepts/multi-agent">
    격리된 세션을 사용하는 멀티 에이전트 라우팅입니다.
  </Card>
  <Card title="Media" icon="image" href="/ko/nodes/images">
    이미지, 오디오, 비디오, 문서, 이미지/비디오 생성입니다.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/ko/platforms">
    Windows Hub, 웹 Control UI, macOS 앱, 모바일 노드입니다.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/ko/nodes">
    페어링, 음성/채팅, 풍부한 기기 명령을 갖춘 iOS 및 Android 노드입니다.
  </Card>
</Columns>

## 전체 목록

**채널:**

- 기본 제공 채널에는 Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, WhatsApp이 포함됩니다.
- 번들 Plugin 채널에는 Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal이 포함됩니다.
- 선택적으로 별도 설치되는 채널 Plugin에는 Voice Call 및 WeChat 같은 서드파티 패키지가 포함됩니다.
- 서드파티 채널 Plugin은 WeChat처럼 Gateway를 더 확장할 수 있습니다.
- 멘션 기반 활성화를 사용하는 그룹 채팅 지원
- 허용 목록 및 페어링을 통한 DM 안전성

**에이전트:**

- 도구 스트리밍을 지원하는 내장 에이전트 런타임
- 워크스페이스 또는 발신자별 격리 세션을 사용하는 멀티 에이전트 라우팅
- 세션: 직접 채팅은 공유 `main`으로 합쳐지고, 그룹은 격리됩니다.
- 긴 응답을 위한 스트리밍 및 청킹

**인증 및 제공자:**

- 35개 이상의 모델 제공자(Anthropic, OpenAI, Google 등)
- OAuth를 통한 구독 인증(예: OpenAI Codex)
- 사용자 지정 및 자체 호스팅 제공자 지원(vLLM, SGLang, Ollama, 그리고 모든 OpenAI 호환 또는 Anthropic 호환 엔드포인트)

**미디어:**

- 이미지, 오디오, 비디오, 문서 입력 및 출력
- 공유 이미지 생성 및 비디오 생성 기능 표면
- 음성 메모 전사
- 여러 제공자를 지원하는 텍스트 음성 변환

**앱 및 인터페이스:**

- WebChat 및 브라우저 Control UI
- macOS 메뉴 막대 동반 앱
- 페어링, Canvas, 카메라, 화면 녹화, 위치, 음성을 갖춘 iOS 노드
- 페어링, 채팅, 음성, Canvas, 카메라, 기기 명령을 갖춘 Android 노드

**도구 및 자동화:**

- 브라우저 자동화, exec, 샌드박싱
- 웹 검색(Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron 작업 및 Heartbeat 스케줄링
- Skills, Plugin, 워크플로 파이프라인(Lobster)

## 관련 항목

<CardGroup cols={2}>
  <Card title="Experimental features" href="/ko/concepts/experimental-features" icon="flask">
    기본 표면에 아직 출시되지 않은 옵트인 기능입니다.
  </Card>
  <Card title="Agent runtime" href="/ko/concepts/agent" icon="robot">
    에이전트 런타임 모델과 실행이 디스패치되는 방식입니다.
  </Card>
  <Card title="Channels" href="/ko/channels" icon="message-square">
    하나의 Gateway에서 Telegram, WhatsApp, Discord, Slack 등을 연결합니다.
  </Card>
  <Card title="Plugins" href="/ko/tools/plugin" icon="plug">
    OpenClaw를 확장하는 번들 및 서드파티 Plugin입니다.
  </Card>
</CardGroup>
