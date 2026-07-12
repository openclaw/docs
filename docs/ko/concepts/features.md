---
read_when:
    - OpenClaw이 지원하는 전체 목록을 확인하려고 합니다
summary: 채널, 라우팅, 미디어 및 UX 전반의 OpenClaw 기능.
title: 기능
x-i18n:
    generated_at: "2026-07-12T15:07:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## 주요 기능

<Columns>
  <Card title="채널" icon="message-square" href="/ko/channels">
    단일 Gateway로 Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat 등을 사용할 수 있습니다.
  </Card>
  <Card title="Plugin" icon="plug" href="/ko/tools/plugin">
    공식 Plugin은 하나의 설치 명령으로 Matrix, Nextcloud Talk, Nostr, Twitch, Zalo 등 수십 가지를 추가합니다.
  </Card>
  <Card title="라우팅" icon="route" href="/ko/concepts/multi-agent">
    격리된 세션을 사용하는 멀티 에이전트 라우팅입니다.
  </Card>
  <Card title="미디어" icon="image" href="/ko/nodes/images">
    이미지, 오디오, 동영상, 문서 및 이미지/동영상 생성 기능을 제공합니다.
  </Card>
  <Card title="앱 및 UI" icon="monitor" href="/ko/platforms">
    Windows Hub, 브라우저 Control UI, macOS 메뉴 막대 앱 및 모바일 노드를 제공합니다.
  </Card>
  <Card title="모바일 노드" icon="smartphone" href="/ko/nodes">
    페어링, 음성/채팅 및 다양한 기기 명령을 지원하는 iOS 및 Android 노드를 제공합니다.
  </Card>
</Columns>

## 전체 목록

**채널:**

- iMessage, Telegram 및 WebChat은 핵심 설치에 포함되며, 그 밖의 모든 채널은
  `openclaw plugins install @openclaw/<id>`로 설치하는 공식 Plugin입니다(`openclaw onboard` /
  `openclaw channels add` 실행 중 필요할 때 설치할 수도 있습니다).
- 공식 Plugin 채널: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo 및 Zalo Personal
- OpenClaw 저장소 외부에서 유지 관리되는 외부 Plugin 채널: WeChat, Yuanbao 및 Zalo ClawBot
- 멘션 기반 활성화를 사용하는 그룹 채팅 지원
- 허용 목록과 페어링을 통한 DM 안전성

**에이전트:**

- 도구 스트리밍을 지원하는 내장형 에이전트 런타임
- 워크스페이스 또는 발신자별로 격리된 세션을 사용하는 멀티 에이전트 라우팅
- 세션: 직접 채팅은 공유 `main`으로 통합되고 그룹은 격리됨
- 긴 응답을 위한 스트리밍 및 청크 분할

**인증 및 제공자:**

- 35개 이상의 모델 제공자(Anthropic, OpenAI, Google 등)
- OAuth를 통한 구독 인증(예: OpenAI Codex)
- 사용자 지정 및 자체 호스팅 제공자 지원(vLLM, SGLang, Ollama, llama.cpp, LM Studio 및
  OpenAI 호환 또는 Anthropic 호환 엔드포인트)

**미디어:**

- 이미지, 오디오, 동영상 및 문서 송수신
- 공유 이미지 생성 및 동영상 생성 기능 표면
- 음성 메모 전사
- 여러 제공자를 통한 텍스트 음성 변환

**앱 및 인터페이스:**

- WebChat 및 브라우저 Control UI
- macOS 메뉴 막대 컴패니언 앱
- 페어링, Canvas, 카메라, 화면 녹화, 위치 및 음성을 지원하는 iOS 노드
- 페어링, 채팅, 음성, Canvas, 카메라 및 기기 명령을 지원하는 Android 노드

**도구 및 자동화:**

- 브라우저 자동화, 명령 실행, 샌드박싱
- 웹 검색(Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron 작업 및 Heartbeat 예약
- Skills, Plugin 및 워크플로 파이프라인(Lobster)

## 관련 항목

<CardGroup cols={2}>
  <Card title="실험적 기능" href="/ko/concepts/experimental-features" icon="flask">
    아직 기본 기능 표면에 출시되지 않은 선택형 기능입니다.
  </Card>
  <Card title="에이전트 런타임" href="/ko/concepts/agent" icon="robot">
    에이전트 런타임 모델과 실행이 디스패치되는 방식을 설명합니다.
  </Card>
  <Card title="채널" href="/ko/channels" icon="message-square">
    하나의 Gateway에서 Telegram, WhatsApp, Discord, Slack 등을 연결합니다.
  </Card>
  <Card title="Plugin" href="/ko/tools/plugin" icon="plug">
    OpenClaw를 확장하는 공식 및 외부 Plugin입니다.
  </Card>
</CardGroup>
