---
read_when:
    - macOS 온보딩 도우미 설계하기
    - 인증 또는 ID 설정 구현하기
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 최초 실행 설정 절차(macOS 앱)
title: 온보딩(macOS 앱)
x-i18n:
    generated_at: "2026-07-12T01:13:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

macOS 앱의 최초 실행 흐름에서는 Gateway가 실행될 위치를 선택하고, 검증된 AI 백엔드를 연결하고, 권한을 부여한 다음 에이전트 자체의 부트스트랩 절차로 넘깁니다.
CLI 온보딩과 두 경로의 비교는 [온보딩 개요](/ko/start/onboarding-overview)를 참조하세요.

<Steps>
<Step title="macOS 경고 승인">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="로컬 네트워크 검색 승인">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="환영 및 보안 안내">
<Frame caption="표시된 보안 안내를 읽고 그에 따라 결정하세요">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

보안 신뢰 모델:

- 기본적으로 OpenClaw는 신뢰할 수 있는 운영자 한 명을 경계로 하는 개인용 에이전트입니다.
- 공유/다중 사용자 구성은 엄격하게 제한해야 합니다. 신뢰 경계를 분리하고, 도구 접근을 최소화하며, [보안](/ko/gateway/security)을 따르세요.
- 로컬 온보딩에서는 새 구성의 기본값을 `tools.profile: "coding"`으로 설정하므로, 새 환경에서 제한 없는 `full` 프로필을 사용하지 않고도 파일 시스템/런타임 도구를 유지할 수 있습니다.
- 훅/Webhook 또는 신뢰할 수 없는 기타 콘텐츠 피드가 활성화된 경우, 강력한 최신 모델 등급을 사용하고 엄격한 도구 정책과 샌드박싱을 유지하세요.

</Step>
<Step title="로컬과 원격">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway**는 어디에서 실행되나요?

- **이 Mac(로컬 전용):** 온보딩이 인증을 구성하고 자격 증명을 로컬에 기록합니다.
- **원격(SSH/Tailnet 경유):** 온보딩은 로컬 인증을 구성하지 **않습니다**.
  자격 증명이 Gateway 호스트에 이미 존재해야 합니다. 원격 Gateway 토큰
  필드에는 macOS 앱이 해당 Gateway에 연결할 때 사용하는 토큰이 저장됩니다.
  기존 `gateway.remote.token` SecretRef 값은 사용자가 교체할 때까지 유지됩니다.
- **나중에 구성:** 설정을 건너뛰고 앱을 구성되지 않은 상태로 둡니다.

<Tip>
**Gateway 인증 팁:**

- Gateway 인증 모드는 루프백 바인딩에서도 기본값이 `token`이므로, 로컬 WS 클라이언트도 인증해야 합니다.
- `gateway.auth.mode: "none"`을 설정하면 모든 로컬 프로세스가 연결할 수 있으므로, 완전히 신뢰할 수 있는 시스템에서만 사용하세요.
- 여러 시스템에서 접근하거나 비루프백 바인딩을 사용하는 경우 토큰을 사용하세요.

</Tip>
</Step>
<Step title="CLI">
  로컬 설정은 npm, pnpm 또는 bun을 통해 전역 `openclaw` CLI를 설치하며,
  npm을 가장 우선합니다. Gateway 자체에는 여전히 Node가 권장 런타임입니다.
  기존의 호환되는 설치가 있으면 재사용합니다.
</Step>
<Step title="AI 연결">
  이미 에이전트 모델이 구성된 Gateway에 연결된 경우 이 페이지를 완전히
  건너뛰고 일반 에이전트 UI를 엽니다. Crestodian 및 제공자 설정은 신규 또는
  구성이 완료되지 않은 Gateway에서만 실행됩니다.

Gateway가 준비되면 온보딩은 사용자가 이미 보유한 AI 접근 수단을 찾습니다.
Claude Code 또는 Codex 로그인이나 `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`가 대상입니다. 가장 적합한 옵션을 실제 완성 요청으로
테스트하며, 응답한 후에만 저장합니다. 테스트에 실패하면 앱이 자동으로
다음 옵션을 시도하고 이전 옵션이 실패한 이유를 표시합니다. 여러 옵션이
발견되면 계속하기 전에 옵션 간에 전환할 수 있습니다.

Gemini CLI는 설정 후 일반 에이전트에서 계속 사용할 수 있지만,
도구를 사용하지 않는 추론 검사를 강제할 수 없으므로 여기서는 제공되지 않습니다.

제공자 자체의 OAuth 또는 기기 페어링 흐름을 통해 로그인할 수도 있습니다.
기본 제공 선택 항목에는 OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global 및 CN, Chutes가 포함됩니다. 이 목록은 고정된
앱 목록이 아니라 Gateway의 활성 텍스트 추론 제공자 Plugin에서 가져오므로,
다른 제공자도 제공자별 macOS 코드를 추가하지 않고 참여할 수 있습니다.

수동 키/토큰 선택기는 동일한 제공자 레지스트리를 사용합니다. 모든 경로에서
제공자는 초기 모델과 구성을 제공하며, OpenClaw는 인증 프로필을 저장하기 전에
동일한 실시간 테스트로 자격 증명을 검증합니다. 백엔드 하나가 테스트를 통과할
때까지 다음 단계가 잠겨 있으므로, 추론이 작동하지 않으면 첫 에이전트 채팅을
시작할 수 없습니다. 실시간 검사를 통과하면 Crestodian을 사용하여 나머지
작업 공간, Gateway, 채널 및 기타 선택적 기능을 구성할 수 있습니다. 나중에도
Settings → Crestodian에서 사용할 수 있습니다.
</Step>
<Step title="권한">

<Frame caption="OpenClaw에 부여할 권한을 선택하세요">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

온보딩에서는 자동화(AppleScript), 알림, 손쉬운 사용, 화면 기록, 마이크, 음성 인식, 카메라 및 위치에 대한 TCC 권한을 요청합니다.

</Step>
<Step title="완료">
  추론 테스트를 통과하면 Crestodian이 나머지 선택적 설정을 담당하며 일반
  에이전트 채팅으로 전환할 수 있습니다. 권한 안내를 완료해도 동일한 채팅이
  열립니다. 앱은 Crestodian보다 먼저 작업 공간을 만들거나 별도의 에이전트
  설정 대화를 시작하지 않습니다. 에이전트의 첫 실제 턴 중 Gateway 호스트에서
  발생하는 작업은 [부트스트랩](/ko/start/bootstrapping)을 참조하세요.
</Step>
</Steps>

## 관련 문서

- [온보딩 개요](/ko/start/onboarding-overview)
- [시작하기](/ko/start/getting-started)
