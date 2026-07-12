---
read_when:
    - 신규 사용자에게 OpenClaw 소개하기
summary: OpenClaw은 모든 OS에서 실행되는 AI 에이전트용 다중 채널 Gateway입니다.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T00:53:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"탈피하라! 탈피하라!"_ — 아마도 우주 바닷가재

<p align="center">
  <strong>Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo 등을 아우르는 AI 에이전트용 모든 OS Gateway.</strong><br />
  메시지를 보내면 주머니 속에서 에이전트의 응답을 받을 수 있습니다. 채널 플러그인, WebChat, 모바일 노드 전반에 하나의 Gateway를 실행하세요.
</p>

<Columns>
  <Card title="시작하기" href="/ko/start/getting-started" icon="rocket">
    OpenClaw를 설치하고 몇 분 만에 Gateway를 실행하세요.
  </Card>
  <Card title="온보딩 실행" href="/ko/start/wizard" icon="list-checks">
    `openclaw onboard`와 페어링 흐름을 이용한 안내식 설정입니다.
  </Card>
  <Card title="채널 연결" href="/ko/channels" icon="message-circle">
    Discord, Signal, Telegram, WhatsApp 등을 연결하여 어디서든 채팅하세요.
  </Card>
  <Card title="제어 UI 열기" href="/ko/web/control-ui" icon="layout-dashboard">
    채팅, 구성, 세션을 위한 브라우저 대시보드를 실행하세요.
  </Card>
</Columns>

## 문서 둘러보기

모바일 브라우저에서는 전체 데스크톱 탭 표시줄 없이 섹션 메뉴만 표시될 수 있습니다. 페이지 본문에서 동일한 최상위 문서 영역으로 이동하려면
다음 허브 링크를 사용하세요.

<Columns>
  <Card title="시작하기" href="/ko" icon="rocket">
    개요, 쇼케이스, 첫 단계, 설정 가이드입니다.
  </Card>
  <Card title="설치" href="/ko/install" icon="download">
    설치 경로, 업데이트, 컨테이너, 호스팅, 고급 설정입니다.
  </Card>
  <Card title="채널" href="/ko/channels" icon="messages-square">
    메시징 채널, 페어링, 라우팅, 접근 그룹, 채널 품질 보증입니다.
  </Card>
  <Card title="에이전트" href="/ko/concepts/architecture" icon="bot">
    아키텍처, 세션, 컨텍스트, 메모리, 다중 에이전트 라우팅입니다.
  </Card>
  <Card title="기능" href="/ko/tools" icon="wand-sparkles">
    도구, Skills, Cron, Webhook, 자동화 기능입니다.
  </Card>
  <Card title="ClawHub" href="/ko/clawhub" icon="store">
    Plugin 마켓플레이스, 게시, 큐레이션, 신뢰 지침입니다.
  </Card>
  <Card title="모델" href="/ko/providers" icon="brain">
    제공자, 모델 구성, 장애 조치, 로컬 모델 서비스입니다.
  </Card>
  <Card title="플랫폼" href="/ko/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, 노드, 웹 인터페이스입니다.
  </Card>
  <Card title="Gateway 및 운영" href="/ko/gateway" icon="server">
    Gateway 구성, 보안, 진단, 운영입니다.
  </Card>
  <Card title="참조" href="/ko/cli" icon="terminal">
    CLI 참조, 스키마, RPC, 릴리스 노트, 템플릿입니다.
  </Card>
  <Card title="도움말" href="/ko/help" icon="life-buoy">
    문제 해결, 자주 묻는 질문, 테스트, 진단, 환경 점검입니다.
  </Card>
</Columns>

## OpenClaw란 무엇인가요?

OpenClaw는 채널 플러그인을 통해 즐겨 사용하는 채팅 앱인 Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo 등을 AI 코딩 에이전트에 연결하는 **자체 호스팅 Gateway**입니다. 자체 컴퓨터나 서버에서 단일 Gateway 프로세스를 실행하면 메시징 앱과 언제든 이용할 수 있는 AI 어시스턴트를 연결하는 다리가 됩니다.

**누구를 위한 것인가요?** 데이터에 대한 제어권을 포기하거나 호스팅 서비스에 의존하지 않으면서 어디서든 메시지를 보낼 수 있는 개인용 AI 어시스턴트를 원하는 개발자와 고급 사용자에게 적합합니다.

**무엇이 다른가요?**

- **자체 호스팅**: 사용자의 하드웨어에서 사용자의 규칙에 따라 실행됩니다
- **다중 채널**: 하나의 Gateway가 구성된 모든 채널 플러그인을 동시에 지원합니다
- **에이전트 중심**: 도구 사용, 세션, 메모리, 다중 에이전트 라우팅을 사용하는 코딩 에이전트를 위해 설계되었습니다
- **오픈 소스**: MIT 라이선스로 제공되며 커뮤니티가 주도합니다

**무엇이 필요한가요?** Node 24(권장) 또는 호환성을 위한 Node 22 LTS(`22.19+`), 선택한 제공자의 API 키, 그리고 5분이면 됩니다. 최상의 품질과 보안을 위해 사용 가능한 최신 세대 모델 중 가장 강력한 모델을 사용하세요.

## 작동 방식

```mermaid
flowchart LR
  A["채팅 앱 + 플러그인"] --> B["Gateway"]
  B --> C["OpenClaw 에이전트"]
  B --> D["CLI"]
  B --> E["웹 제어 UI"]
  B --> F["macOS 앱"]
  B --> G["iOS 및 Android 노드"]
```

Gateway는 세션, 라우팅, 채널 연결에 대한 단일 진실 공급원입니다.

## 주요 기능

<Columns>
  <Card title="다중 채널 Gateway" icon="network" href="/ko/channels">
    하나의 Gateway 프로세스로 Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat 등을 지원합니다.
  </Card>
  <Card title="Plugin 채널" icon="plug" href="/ko/tools/plugin">
    채널 플러그인으로 Matrix, Nostr, Twitch, Zalo 등을 추가할 수 있으며 공식 플러그인은 필요할 때 설치됩니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="route" href="/ko/concepts/multi-agent">
    에이전트, 작업 공간 또는 발신자별로 격리된 세션을 제공합니다.
  </Card>
  <Card title="미디어 지원" icon="image" href="/ko/nodes/images">
    이미지, 오디오, 문서를 주고받을 수 있습니다.
  </Card>
  <Card title="웹 제어 UI" icon="monitor" href="/ko/web/control-ui">
    채팅, 구성, 세션, 노드를 위한 브라우저 대시보드입니다.
  </Card>
  <Card title="모바일 노드" icon="smartphone" href="/ko/nodes">
    Canvas, 카메라, 음성 지원 워크플로를 위해 iOS 및 Android 노드를 페어링하세요.
  </Card>
</Columns>

## 빠른 시작

<Steps>
  <Step title="OpenClaw 설치">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="온보딩 및 서비스 설치">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="채팅">
    브라우저에서 제어 UI를 열고 메시지를 보내세요.

    ```bash
    openclaw dashboard
    ```

    또는 채널([Telegram](/ko/channels/telegram)이 가장 빠릅니다)을 연결하고 휴대전화에서 채팅하세요.

  </Step>
</Steps>

전체 설치 및 개발 환경 설정이 필요한가요? [시작하기](/ko/start/getting-started)를 참조하세요.

## 대시보드

Gateway가 시작된 후 브라우저 제어 UI를 여세요.

- 로컬 기본값: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- 원격 접근: [웹 인터페이스](/ko/web) 및 [Tailscale](/ko/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 구성(선택 사항)

구성은 `~/.openclaw/openclaw.json`에 저장됩니다.

- **아무것도 하지 않으면** OpenClaw는 번들로 제공되는 OpenClaw 에이전트 런타임을 사용합니다. 다이렉트 메시지는 에이전트의 기본 세션을 공유하며 각 그룹 채팅에는 자체 세션이 할당됩니다.
- 접근을 제한하려면 `channels.whatsapp.allowFrom`과 그룹의 경우 멘션 규칙부터 설정하세요.

예시:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## 여기서 시작하기

<Columns>
  <Card title="문서 허브" href="/ko/start/hubs" icon="book-open">
    사용 사례별로 구성된 모든 문서와 가이드입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="settings">
    핵심 Gateway 설정, 토큰, 제공자 구성입니다.
  </Card>
  <Card title="원격 접근" href="/ko/gateway/remote" icon="globe">
    SSH 및 테일넷 접근 패턴입니다.
  </Card>
  <Card title="채널" href="/ko/channels/telegram" icon="message-square">
    Discord, Feishu, Microsoft Teams, Telegram, WhatsApp 등을 위한 채널별 설정입니다.
  </Card>
  <Card title="노드" href="/ko/nodes" icon="smartphone">
    페어링, Canvas, 카메라, 기기 동작을 지원하는 iOS 및 Android 노드입니다.
  </Card>
  <Card title="도움말" href="/ko/help" icon="life-buoy">
    일반적인 해결 방법과 문제 해결의 시작점입니다.
  </Card>
</Columns>

## 더 알아보기

<Columns>
  <Card title="전체 기능 목록" href="/ko/concepts/features" icon="list">
    전체 채널, 라우팅, 미디어 기능입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" href="/ko/concepts/multi-agent" icon="route">
    작업 공간 격리와 에이전트별 세션입니다.
  </Card>
  <Card title="보안" href="/ko/gateway/security" icon="shield">
    토큰, 허용 목록, 안전 제어 기능입니다.
  </Card>
  <Card title="문제 해결" href="/ko/gateway/troubleshooting" icon="wrench">
    Gateway 진단과 일반적인 오류입니다.
  </Card>
  <Card title="소개 및 감사의 말" href="/ko/reference/credits" icon="info">
    프로젝트의 기원, 기여자, 라이선스입니다.
  </Card>
</Columns>
