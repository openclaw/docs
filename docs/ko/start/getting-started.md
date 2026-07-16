---
read_when:
    - 처음부터 진행하는 최초 설정
    - 작동하는 채팅을 가장 빠르게 구축하려고 합니다
summary: OpenClaw을 설치하고 몇 분 안에 첫 채팅을 시작하십시오.
title: 시작하기
x-i18n:
    generated_at: "2026-07-16T13:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw를 설치하고, 온보딩을 실행한 다음, 약 5분 만에 AI 어시스턴트와 채팅하십시오. 완료하면 실행 중인 Gateway, 구성된 인증, 정상적으로 작동하는 채팅 세션을 갖추게 됩니다.

## 필요한 사항

- **Node.js 22.22.3+, 24.15+ 또는 25.9+** (24가 권장 기본 버전입니다)
- 모델 제공업체(Anthropic, OpenAI, Google 등)의 **API 키** — 온보딩 중에 입력하라는 메시지가 표시됩니다

<Tip>
`node --version`을 사용하여 Node 버전을 확인하십시오.
**Windows 사용자:** 네이티브 Windows Hub 앱이 가장 간편한 데스크톱 사용 방법입니다. PowerShell 설치 프로그램과 WSL2 Gateway 방식도 지원됩니다. [Windows](/ko/platforms/windows)를 참조하십시오.
Node를 설치해야 합니까? [Node 설정](/ko/install/node)을 참조하십시오.
</Tip>

## 빠른 설정

<Steps>
  <Step title="OpenClaw 설치">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="설치 스크립트 프로세스"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    기타 설치 방법(Docker, Nix, npm): [설치](/ko/install).
    </Note>

  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사가 모델 제공업체 선택, API 키 설정, Gateway 구성을 안내합니다. QuickStart는 일반적으로 몇 분밖에 걸리지 않지만, 제공업체 로그인, 채널 페어링, 데몬 설치, 네트워크 다운로드, Skills 또는 선택적 Plugin으로 인해 전체 온보딩에 더 오래 걸릴 수 있습니다. 선택적 단계를 건너뛰고 나중에 `openclaw configure`을 사용하여 다시 진행하십시오.

    전체 참조 문서는 [온보딩(CLI)](/ko/start/wizard)을 참조하십시오.

  </Step>
  <Step title="Gateway 실행 여부 확인">
    ```bash
    openclaw gateway status
    ```

    Gateway가 포트 18789에서 수신 대기 중이라고 표시되어야 합니다.

  </Step>
  <Step title="대시보드 열기">
    ```bash
    openclaw dashboard
    ```

    브라우저에서 Control UI가 열립니다. 정상적으로 로드되면 모든 기능이 작동하는 것입니다.

  </Step>
  <Step title="첫 메시지 보내기">
    Control UI 채팅에 메시지를 입력하면 AI의 응답을 받을 수 있습니다.

    휴대폰에서 채팅하고 싶습니까? 가장 빠르게 설정할 수 있는 채널은 [Telegram](/ko/channels/telegram)입니다(봇 토큰만 필요합니다). 모든 옵션은 [채널](/ko/channels)을 참조하십시오.

  </Step>
</Steps>

<Accordion title="고급: 사용자 지정 Control UI 빌드 마운트">
  현지화하거나 사용자 지정한 대시보드 빌드를 유지 관리하는 경우, 빌드된 정적 자산과 `index.html`이 포함된 디렉터리를 `gateway.controlUi.root`으로 지정하십시오.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# 빌드한 정적 파일을 해당 디렉터리에 복사하십시오.
```

그런 다음 다음과 같이 설정하십시오.

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Gateway를 다시 시작하고 대시보드를 다시 여십시오.

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 다음 단계

<Columns>
  <Card title="채널 연결" href="/ko/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo 등을 지원합니다.
  </Card>
  <Card title="페어링 및 안전" href="/ko/channels/pairing" icon="shield">
    에이전트에게 메시지를 보낼 수 있는 사용자를 제어하십시오.
  </Card>
  <Card title="Gateway 구성" href="/ko/gateway/configuration" icon="settings">
    모델, 도구, 샌드박스 및 고급 설정입니다.
  </Card>
  <Card title="도구 살펴보기" href="/ko/tools" icon="wrench">
    브라우저, 실행, 웹 검색, Skills 및 Plugin입니다.
  </Card>
</Columns>

<Accordion title="고급: 환경 변수">
  OpenClaw를 서비스 계정으로 실행하거나 사용자 지정 경로를 사용하려는 경우:

- `OPENCLAW_HOME` — 내부 경로 확인을 위한 홈 디렉터리
- `OPENCLAW_STATE_DIR` — 상태 디렉터리 재정의
- `OPENCLAW_CONFIG_PATH` — 구성 파일 경로 재정의

전체 참조 문서: [환경 변수](/ko/help/environment).
</Accordion>

## 관련 문서

- [설치 개요](/ko/install)
- [채널 개요](/ko/channels)
- [설정](/ko/start/setup)
