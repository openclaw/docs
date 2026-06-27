---
read_when:
    - macOS 온보딩 어시스턴트 설계하기
    - 인증 또는 ID 설정 구현
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw 최초 실행 설정 흐름(macOS 앱)
title: 온보딩(macOS 앱)
x-i18n:
    generated_at: "2026-06-27T18:10:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

이 문서는 **현재** 최초 실행 설정 흐름을 설명합니다. 목표는
매끄러운 "0일 차" 경험입니다. Gateway가 실행될 위치를 선택하고, 인증을 연결하고, 마법사를 실행한 뒤,
에이전트가 스스로 부트스트랩하도록 합니다.
온보딩 경로의 일반적인 개요는 [온보딩 개요](/ko/start/onboarding-overview)를 참조하세요.

<Steps>
<Step title="macOS 경고 승인">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="로컬 네트워크 찾기 승인">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="환영 및 보안 안내">
<Frame caption="표시된 보안 안내를 읽고 그에 따라 결정하세요">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

보안 신뢰 모델:

- 기본적으로 OpenClaw는 개인 에이전트입니다. 하나의 신뢰할 수 있는 운영자 경계입니다.
- 공유/다중 사용자 설정에는 잠금 조치가 필요합니다. 신뢰 경계를 분리하고, 도구 접근을 최소로 유지하며, [보안](/ko/gateway/security)을 따르세요.
- 이제 로컬 온보딩은 새 구성을 기본적으로 `tools.profile: "coding"`으로 설정하므로, 새 로컬 설정은 제한 없는 `full` 프로필을 강제하지 않고도 파일 시스템/런타임 도구를 유지합니다.
- hooks/webhooks 또는 기타 신뢰할 수 없는 콘텐츠 피드가 활성화된 경우, 강력한 최신 모델 티어를 사용하고 엄격한 도구 정책/샌드박싱을 유지하세요.

</Step>
<Step title="로컬 vs 원격">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway**는 어디에서 실행되나요?

- **이 Mac(로컬 전용):** 온보딩이 인증을 구성하고 자격 증명을
  로컬에 쓸 수 있습니다.
- **원격(SSH/Tailnet 경유):** 온보딩은 로컬 인증을 구성하지 **않습니다**.
  자격 증명은 게이트웨이 호스트에 있어야 합니다. 원격 게이트웨이 토큰 필드는
  macOS 앱이 해당 Gateway에 연결하는 데 사용하는 토큰을 저장합니다. 기존
  비평문 `gateway.remote.token` 값은 사용자가 교체할 때까지 보존됩니다.
- **나중에 구성:** 설정을 건너뛰고 앱을 구성되지 않은 상태로 둡니다.

<Tip>
**Gateway 인증 팁:**

- 이제 마법사는 loopback에도 **토큰**을 생성하므로, 로컬 WS 클라이언트는 인증해야 합니다.
- 인증을 비활성화하면 모든 로컬 프로세스가 연결할 수 있습니다. 완전히 신뢰할 수 있는 머신에서만 사용하세요.
- 다중 머신 접근 또는 non-loopback 바인드에는 **토큰**을 사용하세요.

</Tip>
</Step>
<Step title="권한">
<Frame caption="OpenClaw에 부여할 권한을 선택하세요">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

온보딩은 다음에 필요한 TCC 권한을 요청합니다.

- 자동화(AppleScript)
- 알림
- 손쉬운 사용
- 화면 기록
- 마이크
- 음성 인식
- 카메라
- 위치

</Step>
<Step title="CLI">
  <Info>이 단계는 선택 사항입니다</Info>
  앱은 npm, pnpm 또는 bun을 통해 전역 `openclaw` CLI를 설치할 수 있습니다.
  npm을 먼저 선호하고, 그다음 pnpm, 그리고 감지된
  패키지 관리자가 bun뿐인 경우 bun을 사용합니다. Gateway 런타임에는 Node가 계속 권장 경로입니다.
</Step>
<Step title="온보딩 채팅(전용 세션)">
  설정 후 앱은 전용 온보딩 채팅 세션을 열어 에이전트가
  자신을 소개하고 다음 단계를 안내할 수 있도록 합니다. 이렇게 하면 최초 실행 안내가
  일반 대화와 분리됩니다. 첫 에이전트 실행 중
  게이트웨이 호스트에서 어떤 일이 일어나는지는 [부트스트래핑](/ko/start/bootstrapping)을 참조하세요.
</Step>
</Steps>

## 관련 문서

- [온보딩 개요](/ko/start/onboarding-overview)
- [시작하기](/ko/start/getting-started)
