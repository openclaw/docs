---
read_when:
    - 처음부터 시작하는 최초 설정
    - 작동하는 채팅으로 가는 가장 빠른 경로가 필요합니다
summary: OpenClaw를 설치하고 몇 분 안에 첫 채팅을 실행하세요.
title: 시작하기
x-i18n:
    generated_at: "2026-06-27T18:10:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw를 설치하고, 온보딩을 실행한 다음, AI 어시스턴트와 채팅하세요. 모두
약 5분이면 됩니다. 끝나면 실행 중인 Gateway, 구성된 인증,
작동하는 채팅 세션을 갖추게 됩니다.

## 필요한 것

- **Node.js** — Node 24 권장(Node 22.19+도 지원)
- 모델 제공업체(Anthropic, OpenAI, Google 등)의 **API 키** — 온보딩 중에 입력하라는 메시지가 표시됩니다

<Tip>
`node --version`으로 Node 버전을 확인하세요.
**Windows 사용자:** 네이티브 Windows Hub 앱이 가장 쉬운 데스크톱 경로입니다.
PowerShell 설치 프로그램과 WSL2 Gateway 경로도 지원됩니다. [Windows](/ko/platforms/windows)를 참조하세요.
Node를 설치해야 하나요? [Node 설정](/ko/install/node)을 참조하세요.
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
    다른 설치 방법(Docker, Nix, npm): [설치](/ko/install).
    </Note>

  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사가 모델 제공업체 선택, API 키 설정,
    Gateway 구성을 안내합니다. 약 2분이 걸립니다.

    전체 참조는 [온보딩(CLI)](/ko/start/wizard)을 참조하세요.

  </Step>
  <Step title="Gateway가 실행 중인지 확인">
    ```bash
    openclaw gateway status
    ```

    Gateway가 포트 18789에서 수신 대기 중인 것을 볼 수 있어야 합니다.

  </Step>
  <Step title="대시보드 열기">
    ```bash
    openclaw dashboard
    ```

    그러면 브라우저에서 Control UI가 열립니다. 로드되면 모든 것이 작동 중입니다.

  </Step>
  <Step title="첫 메시지 보내기">
    Control UI 채팅에 메시지를 입력하면 AI 응답을 받을 수 있어야 합니다.

    대신 휴대폰에서 채팅하고 싶나요? 가장 빠르게 설정할 수 있는 채널은
    [Telegram](/ko/channels/telegram)입니다(봇 토큰만 있으면 됩니다). 모든 옵션은 [채널](/ko/channels)을
    참조하세요.

  </Step>
</Steps>

<Accordion title="고급: 사용자 지정 Control UI 빌드 마운트">
  로컬라이즈되었거나 사용자 지정된 대시보드 빌드를 유지 관리하는 경우,
  `gateway.controlUi.root`가 빌드된 정적
  애셋과 `index.html`이 들어 있는 디렉터리를 가리키도록 하세요.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# 빌드된 정적 파일을 해당 디렉터리로 복사합니다.
```

그런 다음 다음과 같이 설정합니다.

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

Gateway를 다시 시작하고 대시보드를 다시 여세요.

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 다음에 할 일

<Columns>
  <Card title="채널 연결" href="/ko/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo 등.
  </Card>
  <Card title="페어링 및 안전" href="/ko/channels/pairing" icon="shield">
    에이전트에게 메시지를 보낼 수 있는 사용자를 제어하세요.
  </Card>
  <Card title="Gateway 구성" href="/ko/gateway/configuration" icon="settings">
    모델, 도구, 샌드박스 및 고급 설정.
  </Card>
  <Card title="도구 둘러보기" href="/ko/tools" icon="wrench">
    브라우저, exec, 웹 검색, Skills, Plugin.
  </Card>
</Columns>

<Accordion title="고급: 환경 변수">
  OpenClaw를 서비스 계정으로 실행하거나 사용자 지정 경로를 원하는 경우:

- `OPENCLAW_HOME` — 내부 경로 확인을 위한 홈 디렉터리
- `OPENCLAW_STATE_DIR` — 상태 디렉터리 재정의
- `OPENCLAW_CONFIG_PATH` — 구성 파일 경로 재정의

전체 참조: [환경 변수](/ko/help/environment).
</Accordion>

## 관련 항목

- [설치 개요](/ko/install)
- [채널 개요](/ko/channels)
- [설정](/ko/start/setup)
