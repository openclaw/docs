---
read_when:
    - 일반적인 설정, 설치, 온보딩 또는 런타임 지원 질문에 답변하기
    - 더 깊은 디버깅에 앞서 사용자가 보고한 문제 분류하기
summary: OpenClaw 설정, 구성 및 사용에 관한 자주 묻는 질문
title: 자주 묻는 질문
x-i18n:
    generated_at: "2026-04-21T13:35:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# 자주 묻는 질문

실제 환경 설정(로컬 개발, VPS, 멀티 에이전트, OAuth/API 키, 모델 장애 조치)에 대한 빠른 답변과 더 깊은 문제 해결을 제공합니다. 런타임 진단은 [Troubleshooting](/ko/gateway/troubleshooting)을 참고하세요. 전체 구성 참조는 [Configuration](/ko/gateway/configuration)을 참고하세요.

## 문제가 있을 때 처음 60초 안에 할 일

1. **빠른 상태 확인(첫 번째 점검)**

   ```bash
   openclaw status
   ```

   빠른 로컬 요약: OS + 업데이트, gateway/service 연결 가능 여부, agents/sessions, provider 구성 + 런타임 문제(gateway에 연결 가능한 경우).

2. **공유해도 안전한 붙여넣기용 보고서**

   ```bash
   openclaw status --all
   ```

   로그 tail을 포함한 읽기 전용 진단(토큰은 redacted 처리됨).

3. **데몬 + 포트 상태**

   ```bash
   openclaw gateway status
   ```

   supervisor 런타임과 RPC 연결 가능 여부, probe 대상 URL, 서비스가 사용했을 가능성이 높은 구성을 보여줍니다.

4. **심층 프로브**

   ```bash
   openclaw status --deep
   ```

   실시간 gateway 헬스 프로브를 실행하며, 지원되는 경우 채널 프로브도 포함합니다
   (연결 가능한 gateway 필요). [Health](/ko/gateway/health)를 참고하세요.

5. **최신 로그 tail 보기**

   ```bash
   openclaw logs --follow
   ```

   RPC가 내려가 있으면 다음으로 대체하세요.

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그는 서비스 로그와 별개입니다. [Logging](/ko/logging) 및 [Troubleshooting](/ko/gateway/troubleshooting)을 참고하세요.

6. **doctor 실행(복구)**

   ```bash
   openclaw doctor
   ```

   구성/상태를 복구 또는 마이그레이션하고 헬스 체크를 실행합니다. [Doctor](/ko/gateway/doctor)를 참고하세요.

7. **Gateway 스냅샷**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 오류 시 대상 URL + config path 표시
   ```

   실행 중인 gateway에 전체 스냅샷을 요청합니다(WS 전용). [Health](/ko/gateway/health)를 참고하세요.

## 빠른 시작 및 최초 실행 설정

<AccordionGroup>
  <Accordion title="막혔습니다. 가장 빨리 해결하는 방법은 무엇인가요?">
    **내 컴퓨터를 볼 수 있는** 로컬 AI 에이전트를 사용하세요. 이것이 Discord에서 질문하는 것보다 훨씬 효과적입니다. 대부분의 "막혔어요" 사례는 원격 도우미가 확인할 수 없는 **로컬 구성 또는 환경 문제**이기 때문입니다.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    이런 도구는 repo를 읽고, 명령을 실행하고, 로그를 검사하고, 머신 수준 설정(PATH, 서비스, 권한, auth 파일)을 수정하도록 도와줄 수 있습니다. hackable (git) 설치를 사용해 **전체 소스 체크아웃**을 제공하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 OpenClaw가 **git 체크아웃에서** 설치되므로 에이전트가 코드와 문서를 읽고 현재 실행 중인 정확한 버전을 기준으로 추론할 수 있습니다. 나중에 언제든 `--install-method git` 없이 설치 프로그램을 다시 실행해 stable로 되돌릴 수 있습니다.

    팁: 에이전트에게 수정 작업을 **계획하고 감독**하도록(단계별로) 요청한 다음, 필요한 명령만 실행하게 하세요. 그러면 변경 범위를 작게 유지할 수 있고 감사도 더 쉬워집니다.

    실제 버그나 수정 사항을 발견했다면 GitHub 이슈를 등록하거나 PR을 보내 주세요.
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    도움을 요청할 때는 다음 명령부터 시작하고 출력 결과를 공유하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    각 명령의 역할:

    - `openclaw status`: gateway/agent 상태 + 기본 구성의 빠른 스냅샷
    - `openclaw models status`: provider auth + 모델 사용 가능 여부 확인
    - `openclaw doctor`: 일반적인 구성/상태 문제 검증 및 복구

    그 밖에 유용한 CLI 점검: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    빠른 디버그 루프: [문제가 있을 때 처음 60초 안에 할 일](#문제가-있을-때-처음-60초-안에-할-일).
    설치 문서: [Install](/ko/install), [Installer flags](/ko/install/installer), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="Heartbeat가 계속 건너뛰어집니다. 각 skip 이유는 무엇을 의미하나요?">
    일반적인 Heartbeat skip 이유:

    - `quiet-hours`: 구성된 활성 시간 창 밖임
    - `empty-heartbeat-file`: `HEARTBEAT.md`가 존재하지만 빈 내용/헤더만 있는 스캐폴딩만 포함함
    - `no-tasks-due`: `HEARTBEAT.md` task 모드가 활성화되어 있지만 아직 어떤 작업 간격도 도래하지 않음
    - `alerts-disabled`: 모든 heartbeat 가시성이 비활성화됨(`showOk`, `showAlerts`, `useIndicator`가 모두 꺼짐)

    task 모드에서는 실제 heartbeat 실행이 완료된 뒤에만 due 타임스탬프가 갱신됩니다.
    건너뛴 실행은 작업을 완료된 것으로 표시하지 않습니다.

    문서: [Heartbeat](/ko/gateway/heartbeat), [Automation & Tasks](/ko/automation).

  </Accordion>

  <Accordion title="OpenClaw를 설치하고 설정하는 권장 방법은 무엇인가요?">
    이 repo는 소스에서 실행하고 onboarding을 사용하는 방식을 권장합니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    이 마법사는 UI 자산도 자동으로 빌드할 수 있습니다. onboarding 이후에는 일반적으로 **18789** 포트에서 Gateway를 실행합니다.

    소스에서 실행(기여자/개발자):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    아직 전역 설치가 없다면 `pnpm openclaw onboard`로 실행하세요.

  </Accordion>

  <Accordion title="onboarding 후 대시보드는 어떻게 열 수 있나요?">
    이 마법사는 onboarding 직후 깨끗한(토큰이 포함되지 않은) 대시보드 URL로 브라우저를 열고, 요약에도 해당 링크를 출력합니다. 그 탭을 열어 두세요. 자동으로 열리지 않았다면 같은 머신에서 출력된 URL을 복사해 붙여넣으세요.
  </Accordion>

  <Accordion title="localhost에서와 원격에서 대시보드를 인증하는 방법은 어떻게 다른가요?">
    **Localhost(같은 머신):**

    - `http://127.0.0.1:18789/`를 엽니다.
    - shared-secret auth를 요구하면 구성된 토큰 또는 비밀번호를 Control UI 설정에 붙여넣습니다.
    - 토큰 소스: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)
    - 비밀번호 소스: `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)
    - 아직 shared secret이 구성되지 않았다면 `openclaw doctor --generate-gateway-token`으로 토큰을 생성합니다.

    **Localhost가 아닌 경우:**

    - **Tailscale Serve**(권장): bind를 loopback으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 뒤 `https://<magicdns>/`를 엽니다. `gateway.auth.allowTailscale`이 `true`이면 identity header가 Control UI/WebSocket auth를 충족합니다(shared secret을 붙여넣을 필요 없음, 신뢰된 gateway 호스트를 전제). HTTP API는 private-ingress `none` 또는 trusted-proxy HTTP auth를 의도적으로 사용하지 않는 한 여전히 shared-secret auth가 필요합니다.
      같은 클라이언트에서 동시에 잘못된 Serve auth 시도를 하면 failed-auth limiter가 기록하기 전에 직렬화되므로, 두 번째 잘못된 재시도에서 이미 `retry later`가 표시될 수 있습니다.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"`을 실행하거나(또는 비밀번호 auth를 구성) `http://<tailscale-ip>:18789/`를 연 다음, 대시보드 설정에 일치하는 shared secret을 붙여넣습니다.
    - **Identity-aware reverse proxy**: Gateway를 non-loopback trusted proxy 뒤에 두고 `gateway.auth.mode: "trusted-proxy"`를 구성한 다음 프록시 URL을 엽니다.
    - **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/`를 엽니다. 터널 위에서도 shared-secret auth는 그대로 적용되며, 프롬프트가 표시되면 구성된 토큰 또는 비밀번호를 붙여넣으세요.

    bind 모드와 auth 세부 사항은 [Dashboard](/web/dashboard) 및 [Web surfaces](/web)를 참고하세요.

  </Accordion>

  <Accordion title="채팅 승인을 위한 exec approval 구성이 왜 두 가지인가요?">
    이 둘은 서로 다른 계층을 제어합니다.

    - `approvals.exec`: 승인 프롬프트를 채팅 대상에 전달
    - `channels.<channel>.execApprovals`: 해당 채널이 exec approval용 기본 승인 클라이언트로 동작하도록 함

    호스트 exec 정책이 여전히 실제 승인 게이트입니다. 채팅 구성은 승인 프롬프트가 어디에 나타나는지와 사용자가 어떻게 응답할 수 있는지만 제어합니다.

    대부분의 설정에서는 **둘 다** 필요하지 않습니다.

    - 채팅이 이미 명령과 응답을 지원한다면 동일 채팅의 `/approve`가 공유 경로를 통해 동작합니다.
    - 지원되는 기본 채널이 approver를 안전하게 추론할 수 있으면, `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`일 때 OpenClaw는 이제 DM 우선 기본 승인을 자동으로 활성화합니다.
    - 기본 승인 카드/버튼을 사용할 수 있으면 그 기본 UI가 주 경로입니다. 도구 결과가 채팅 승인을 사용할 수 없다고 하거나 수동 승인이 유일한 경로라고 말하는 경우에만 에이전트가 수동 `/approve` 명령을 포함해야 합니다.
    - 프롬프트를 다른 채팅이나 명시적인 ops room에도 전달해야 하는 경우에만 `approvals.exec`를 사용하세요.
    - 승인 프롬프트를 원래의 room/topic에도 다시 게시하고 싶을 때만 `channels.<channel>.execApprovals.target: "channel"` 또는 `"both"`를 사용하세요.
    - Plugin 승인은 또 별개입니다. 기본적으로는 동일 채팅 `/approve`를 사용하고, 선택적으로 `approvals.plugin` 전달을 사용하며, 일부 기본 채널만 그 위에 plugin-approval-native 처리를 유지합니다.

    짧게 말하면, 전달은 라우팅용이고 기본 클라이언트 구성은 더 풍부한 채널별 UX용입니다.
    [Exec Approvals](/ko/tools/exec-approvals)를 참고하세요.

  </Accordion>

  <Accordion title="어떤 런타임이 필요한가요?">
    Node **>= 22**가 필요합니다. `pnpm` 사용을 권장합니다. Bun은 Gateway에 **권장되지 않습니다**.
  </Accordion>

  <Accordion title="Raspberry Pi에서 실행되나요?">
    예. Gateway는 가볍습니다. 문서에는 개인 사용 기준으로 **512MB-1GB RAM**, **1 코어**, 약 **500MB** 디스크면 충분하다고 되어 있으며, **Raspberry Pi 4에서 실행 가능**하다고 명시되어 있습니다.

    로그, 미디어, 다른 서비스 등을 위한 여유를 원한다면 **2GB를 권장**하지만,
    필수 최소 사양은 아닙니다.

    팁: 작은 Pi/VPS가 Gateway를 호스팅하고, 노트북/휴대폰에서 로컬 화면/카메라/canvas 또는 명령 실행을 위해 **nodes**를 페어링할 수 있습니다. [Nodes](/ko/nodes)를 참고하세요.

  </Accordion>

  <Accordion title="Raspberry Pi 설치 팁이 있나요?">
    짧게 말하면: 동작하지만 거친 부분이 있을 수 있습니다.

    - **64비트** OS를 사용하고 Node >= 22를 유지하세요.
    - 로그를 보고 빠르게 업데이트할 수 있도록 **hackable (git) 설치**를 권장합니다.
    - 채널/Skills 없이 시작한 뒤 하나씩 추가하세요.
    - 이상한 바이너리 문제가 생기면 보통 **ARM 호환성** 문제입니다.

    문서: [Linux](/ko/platforms/linux), [Install](/ko/install).

  </Accordion>

  <Accordion title="wake up my friend에서 멈춰 있습니다 / onboarding이 진행되지 않습니다. 어떻게 해야 하나요?">
    이 화면은 Gateway에 연결 가능하고 인증이 되어 있어야 작동합니다. TUI도 첫 hatch 시 자동으로
    "Wake up, my friend!"를 전송합니다. 이 문구가 보이는데 **응답이 없고**
    토큰이 0으로 유지된다면 에이전트가 전혀 실행되지 않은 것입니다.

    1. Gateway를 재시작합니다.

    ```bash
    openclaw gateway restart
    ```

    2. 상태 + auth를 확인합니다.

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 여전히 멈춰 있다면 다음을 실행합니다.

    ```bash
    openclaw doctor
    ```

    Gateway가 원격에 있다면 터널/Tailscale 연결이 살아 있는지, 그리고 UI가 올바른 Gateway를 가리키고 있는지 확인하세요. [Remote access](/ko/gateway/remote)를 참고하세요.

  </Accordion>

  <Accordion title="onboarding을 다시 하지 않고 새 머신(Mac mini)으로 설정을 옮길 수 있나요?">
    예. **상태 디렉터리**와 **workspace**를 복사한 뒤 Doctor를 한 번 실행하면 됩니다. 이렇게 하면 **두 위치를 모두** 복사하는 한 봇을 "완전히 동일하게"(메모리, 세션 기록, auth, 채널 상태) 유지할 수 있습니다.

    1. 새 머신에 OpenClaw를 설치합니다.
    2. 이전 머신에서 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`)를 복사합니다.
    3. workspace(기본값: `~/.openclaw/workspace`)를 복사합니다.
    4. `openclaw doctor`를 실행하고 Gateway 서비스를 재시작합니다.

    이렇게 하면 config, auth profile, WhatsApp 자격 증명, 세션, 메모리가 보존됩니다. remote mode인 경우 세션 저장소와 workspace는 gateway 호스트가 소유한다는 점을 기억하세요.

    **중요:** workspace만 GitHub에 commit/push하면 **메모리 + bootstrap 파일**은 백업되지만 **세션 기록이나 auth**는 백업되지 않습니다. 그런 항목은 `~/.openclaw/` 아래에 있습니다(예: `~/.openclaw/agents/<agentId>/sessions/`).

    관련 항목: [Migrating](/ko/install/migrating), [디스크에서 파일 위치](#디스크에서-파일-위치),
    [Agent workspace](/ko/concepts/agent-workspace), [Doctor](/ko/gateway/doctor),
    [Remote mode](/ko/gateway/remote).

  </Accordion>

  <Accordion title="최신 버전의 새 기능은 어디서 볼 수 있나요?">
    GitHub changelog를 확인하세요:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    최신 항목은 맨 위에 있습니다. 맨 위 섹션이 **Unreleased**로 표시되어 있으면, 다음 날짜가 있는
    섹션이 가장 최근에 배포된 버전입니다. 항목은 **Highlights**, **Changes**, **Fixes**별로
    그룹화되어 있습니다(필요한 경우 docs/other 섹션도 포함).

  </Accordion>

  <Accordion title="docs.openclaw.ai에 접근할 수 없습니다(SSL 오류)">
    일부 Comcast/Xfinity 연결은 Xfinity
    Advanced Security를 통해 `docs.openclaw.ai`를 잘못 차단합니다. 이를 비활성화하거나 `docs.openclaw.ai`를 허용 목록에 추가한 뒤 다시 시도하세요.
    차단 해제를 위해 여기로 신고해 주세요: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    그래도 사이트에 접속할 수 없다면 문서는 GitHub에도 미러링되어 있습니다:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable과 beta의 차이">
    **Stable**과 **beta**는 별도의 코드 라인이 아니라 **npm dist-tag**입니다.

    - `latest` = stable
    - `beta` = 테스트용 초기 빌드

    일반적으로 stable 릴리스는 먼저 **beta**에 올라간 다음, 명시적인
    승격 단계에서 같은 버전이 `latest`로 이동합니다. 유지 관리자가 필요할 경우
    바로 `latest`로 게시할 수도 있습니다. 그래서 승격 후에는 beta와 stable이
    **같은 버전**을 가리킬 수 있습니다.

    변경 사항 확인:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    설치 원라이너와 beta와 dev의 차이는 아래 아코디언을 참고하세요.

  </Accordion>

  <Accordion title="beta 버전은 어떻게 설치하나요? beta와 dev의 차이는 무엇인가요?">
    **Beta**는 npm dist-tag `beta`입니다(승격 후 `latest`와 같을 수 있음).
    **Dev**는 `main`의 이동하는 최신 헤드(git)이며, 게시될 때는 npm dist-tag `dev`를 사용합니다.

    원라이너(macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 설치 프로그램(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    자세한 내용: [Development channels](/ko/install/development-channels) 및 [Installer flags](/ko/install/installer).

  </Accordion>

  <Accordion title="최신 기능을 사용해 보려면 어떻게 해야 하나요?">
    두 가지 방법이 있습니다.

    1. **Dev 채널(git 체크아웃):**

    ```bash
    openclaw update --channel dev
    ```

    이렇게 하면 `main` 브랜치로 전환하고 소스에서 업데이트합니다.

    2. **Hackable 설치(설치 사이트에서):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 로컬 repo를 받아 직접 수정할 수 있고, 이후 git으로 업데이트할 수 있습니다.

    직접 깔끔하게 clone하고 싶다면 다음을 사용하세요.

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    문서: [Update](/cli/update), [Development channels](/ko/install/development-channels),
    [Install](/ko/install).

  </Accordion>

  <Accordion title="설치와 onboarding은 보통 얼마나 걸리나요?">
    대략적인 기준:

    - **설치:** 2-5분
    - **Onboarding:** 구성하는 채널/모델 수에 따라 5-15분

    멈춘다면 [설치 프로그램이 멈췄나요?](#빠른-시작-및-최초-실행-설정)
    및 [막혔습니다](#빠른-시작-및-최초-실행-설정)의 빠른 디버그 루프를 참고하세요.

  </Accordion>

  <Accordion title="설치 프로그램이 멈췄나요? 더 많은 피드백을 보려면 어떻게 하나요?">
    설치 프로그램을 **verbose 출력**과 함께 다시 실행하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose를 포함한 beta 설치:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    hackable (git) 설치의 경우:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows(PowerShell) 동등 명령:

    ```powershell
    # install.ps1에는 아직 전용 -Verbose 플래그가 없습니다.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    추가 옵션: [Installer flags](/ko/install/installer).

  </Accordion>

  <Accordion title="Windows 설치 시 git not found 또는 openclaw not recognized가 표시됩니다">
    Windows에서 흔한 두 가지 문제:

    **1) npm error spawn git / git not found**

    - **Git for Windows**를 설치하고 `git`이 PATH에 있는지 확인하세요.
    - PowerShell을 닫았다가 다시 열고 설치 프로그램을 다시 실행하세요.

    **2) 설치 후 openclaw is not recognized**

    - npm 전역 bin 폴더가 PATH에 없습니다.
    - 경로를 확인하세요:

      ```powershell
      npm config get prefix
      ```

    - 해당 디렉터리를 사용자 PATH에 추가하세요(Windows에서는 `\bin` 접미사가 필요하지 않으며, 대부분의 시스템에서는 `%AppData%\npm`입니다).
    - PATH를 업데이트한 뒤 PowerShell을 닫았다가 다시 여세요.

    가장 매끄러운 Windows 환경을 원한다면 네이티브 Windows 대신 **WSL2**를 사용하세요.
    문서: [Windows](/ko/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec 출력에서 중국어 텍스트가 깨져 보입니다. 어떻게 해야 하나요?">
    이것은 보통 네이티브 Windows 셸의 콘솔 코드 페이지 불일치 문제입니다.

    증상:

    - `system.run`/`exec` 출력에서 중국어가 mojibake로 표시됨
    - 같은 명령이 다른 터미널 프로필에서는 정상적으로 보임

    PowerShell에서의 빠른 우회 방법:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    그다음 Gateway를 재시작하고 명령을 다시 시도하세요.

    ```powershell
    openclaw gateway restart
    ```

    최신 OpenClaw에서도 계속 재현된다면 다음 이슈에서 추적/신고하세요.

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="문서에서 제 질문에 대한 답을 찾지 못했습니다. 더 나은 답을 얻으려면 어떻게 하나요?">
    **hackable (git) 설치**를 사용해 전체 소스와 문서를 로컬에 둔 다음,
    _그 폴더에서_ 봇(또는 Claude/Codex)에게 질문하세요. 그러면 repo를 읽고 정확하게 답할 수 있습니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    자세한 내용: [Install](/ko/install) 및 [Installer flags](/ko/install/installer).

  </Accordion>

  <Accordion title="Linux에 OpenClaw를 설치하려면 어떻게 하나요?">
    짧은 답: Linux 가이드를 따른 뒤 onboarding을 실행하세요.

    - Linux 빠른 경로 + 서비스 설치: [Linux](/ko/platforms/linux)
    - 전체 안내: [Getting Started](/ko/start/getting-started)
    - 설치 프로그램 + 업데이트: [Install & updates](/ko/install/updating)

  </Accordion>

  <Accordion title="VPS에 OpenClaw를 설치하려면 어떻게 하나요?">
    모든 Linux VPS에서 동작합니다. 서버에 설치한 뒤 SSH/Tailscale로 Gateway에 접속하세요.

    가이드: [exe.dev](/ko/install/exe-dev), [Hetzner](/ko/install/hetzner), [Fly.io](/ko/install/fly).
    원격 액세스: [Gateway remote](/ko/gateway/remote).

  </Accordion>

  <Accordion title="클라우드/VPS 설치 가이드는 어디에 있나요?">
    일반적인 제공업체를 모아 둔 **호스팅 허브**가 있습니다. 하나를 선택해 가이드를 따라가세요.

    - [VPS hosting](/ko/vps) (모든 제공업체를 한곳에 모음)
    - [Fly.io](/ko/install/fly)
    - [Hetzner](/ko/install/hetzner)
    - [exe.dev](/ko/install/exe-dev)

    클라우드에서의 동작 방식: **Gateway는 서버에서 실행**되고, 노트북/휴대폰에서
    Control UI(또는 Tailscale/SSH)를 통해 접근합니다. 상태 + workspace는
    서버에 있으므로 호스트를 기준 원본으로 취급하고 백업하세요.

    클라우드 Gateway에 **nodes**(Mac/iOS/Android/headless)를 페어링해
    로컬 화면/카메라/canvas에 접근하거나 노트북에서 명령을 실행하면서도
    Gateway는 클라우드에 유지할 수 있습니다.

    허브: [Platforms](/ko/platforms). 원격 액세스: [Gateway remote](/ko/gateway/remote).
    Nodes: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw에게 스스로 업데이트하라고 시킬 수 있나요?">
    짧은 답: **가능은 하지만 권장되지는 않습니다**. 업데이트 과정에서
    Gateway가 재시작될 수 있고(활성 세션이 끊김), 깨끗한 git 체크아웃이 필요할 수 있으며,
    확인 프롬프트가 나올 수도 있습니다. 더 안전한 방법은 운영자가 셸에서 업데이트를 실행하는 것입니다.

    CLI 사용:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    에이전트에서 자동화해야 한다면:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    문서: [Update](/cli/update), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="onboarding은 실제로 무엇을 하나요?">
    `openclaw onboard`는 권장 설정 경로입니다. **로컬 모드**에서는 다음 과정을 안내합니다.

    - **모델/auth 설정**(provider OAuth, API 키, Anthropic setup-token, LM Studio 같은 로컬 모델 옵션 포함)
    - **Workspace** 위치 + bootstrap 파일
    - **Gateway 설정**(bind/port/auth/tailscale)
    - **채널**(WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, 그리고 QQ Bot 같은 번들 채널 plugin)
    - **데몬 설치**(macOS의 LaunchAgent, Linux/WSL2의 systemd 사용자 유닛)
    - **헬스 체크** 및 **Skills** 선택

    또한 구성된 모델을 알 수 없거나 auth가 누락된 경우 경고를 표시합니다.

  </Accordion>

  <Accordion title="이걸 실행하려면 Claude나 OpenAI 구독이 필요한가요?">
    아니요. OpenClaw는 **API 키**(Anthropic/OpenAI/기타)로 실행할 수도 있고,
    데이터가 기기에 머물도록 **로컬 전용 모델**로 실행할 수도 있습니다. 구독(Claude
    Pro/Max 또는 OpenAI Codex)은 해당 provider를 인증하는 선택적 방법입니다.

    OpenClaw에서 Anthropic의 실질적인 구분은 다음과 같습니다.

    - **Anthropic API key**: 일반적인 Anthropic API 과금
    - **OpenClaw의 Claude CLI / Claude subscription auth**: Anthropic 직원이
      이 사용 방식이 다시 허용된다고 알려 왔으며, Anthropic이 새로운
      정책을 게시하지 않는 한 OpenClaw는 이 통합에서 `claude -p`
      사용을 허용된 방식으로 취급합니다

    장기간 실행되는 gateway 호스트에서는 Anthropic API 키가 여전히 더
    예측 가능한 설정입니다. OpenAI Codex OAuth는 OpenClaw 같은 외부
    도구에 대해 명시적으로 지원됩니다.

    OpenClaw는 그 외에도 다음과 같은 호스팅형 구독 스타일 옵션을 지원합니다.
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**,
    **Z.AI / GLM Coding Plan**.

    문서: [Anthropic](/ko/providers/anthropic), [OpenAI](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen),
    [MiniMax](/ko/providers/minimax), [GLM Models](/ko/providers/glm),
    [Local models](/ko/gateway/local-models), [Models](/ko/concepts/models).

  </Accordion>

  <Accordion title="API 키 없이 Claude Max 구독을 사용할 수 있나요?">
    예.

    Anthropic 직원이 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려 왔기 때문에, Anthropic이 새로운 정책을 게시하지 않는 한 OpenClaw는 이 통합에서 Claude subscription auth와 `claude -p` 사용을 허용된 방식으로 취급합니다. 가장 예측 가능한 서버 측 구성을 원한다면 대신 Anthropic API 키를 사용하세요.

  </Accordion>

  <Accordion title="Claude subscription auth(Claude Pro 또는 Max)를 지원하나요?">
    예.

    Anthropic 직원이 이 사용 방식이 다시 허용된다고 알려 왔기 때문에, Anthropic이 새로운 정책을 게시하지 않는 한 OpenClaw는 이 통합에서 Claude CLI 재사용과 `claude -p` 사용을 허용된 방식으로 취급합니다.

    Anthropic setup-token도 여전히 OpenClaw에서 지원되는 토큰 경로로 제공되지만, 이제 OpenClaw는 가능할 때 Claude CLI 재사용과 `claude -p`를 더 선호합니다.
    프로덕션 또는 다중 사용자 워크로드에서는 Anthropic API 키 auth가 여전히
    더 안전하고 예측 가능한 선택입니다. OpenClaw의 다른 구독형 호스팅
    옵션을 원한다면 [OpenAI](/ko/providers/openai), [Qwen / Model
    Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [GLM
    Models](/ko/providers/glm)를 참고하세요.

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic에서 HTTP 429 rate_limit_error가 표시되는 이유는 무엇인가요?">
이는 현재 창에서 **Anthropic 할당량/속도 제한**이 소진되었음을 의미합니다. **Claude CLI**를 사용하는 경우 창이 재설정될 때까지 기다리거나 요금제를 업그레이드하세요. **Anthropic API 키**를 사용하는 경우 Anthropic Console에서 사용량/청구를 확인하고 필요에 따라 한도를 올리세요.

    메시지가 구체적으로 다음과 같다면:
    `Extra usage is required for long context requests`, 요청이
    Anthropic의 1M 컨텍스트 베타(`context1m: true`)를 사용하려는 것입니다. 이는
    자격 증명이 장문 컨텍스트 과금 대상일 때만 동작합니다(API 키 과금 또는
    Extra Usage가 활성화된 OpenClaw Claude-login 경로).

    팁: provider가 속도 제한될 때도 OpenClaw가 계속 응답할 수 있도록
    **fallback model**을 설정하세요.
    [Models](/cli/models), [OAuth](/ko/concepts/oauth), 그리고
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)를 참고하세요.

  </Accordion>

  <Accordion title="AWS Bedrock을 지원하나요?">
    예. OpenClaw에는 번들된 **Amazon Bedrock (Converse)** provider가 있습니다. AWS env marker가 있으면 OpenClaw는 스트리밍/텍스트 Bedrock 카탈로그를 자동 검색하고 이를 암시적 `amazon-bedrock` provider로 병합할 수 있습니다. 그렇지 않으면 `plugins.entries.amazon-bedrock.config.discovery.enabled`를 명시적으로 활성화하거나 수동 provider 항목을 추가할 수 있습니다. [Amazon Bedrock](/ko/providers/bedrock) 및 [Model providers](/ko/providers/models)를 참고하세요. 관리형 키 흐름을 선호한다면 Bedrock 앞단에 OpenAI 호환 프록시를 두는 것도 여전히 유효한 선택입니다.
  </Accordion>

  <Accordion title="Codex auth는 어떻게 동작하나요?">
    OpenClaw는 OAuth(ChatGPT 로그인)를 통해 **OpenAI Code (Codex)**를 지원합니다. onboarding은 OAuth 흐름을 실행할 수 있으며 적절한 경우 기본 모델을 `openai-codex/gpt-5.4`로 설정합니다. [Model providers](/ko/concepts/model-providers) 및 [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.
  </Accordion>

  <Accordion title="왜 ChatGPT GPT-5.4로는 OpenClaw에서 openai/gpt-5.4가 활성화되지 않나요?">
    OpenClaw는 두 경로를 별도로 취급합니다.

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = 직접 OpenAI Platform API

    OpenClaw에서 ChatGPT/Codex 로그인은 직접 `openai/*` 경로가 아니라
    `openai-codex/*` 경로에 연결됩니다. OpenClaw에서 직접 API 경로를
    원한다면 `OPENAI_API_KEY`(또는 이에 해당하는 OpenAI provider 구성)를 설정하세요.
    OpenClaw에서 ChatGPT/Codex 로그인을 원한다면 `openai-codex/*`를 사용하세요.

  </Accordion>

  <Accordion title="Codex OAuth 한도가 ChatGPT 웹과 다를 수 있는 이유는 무엇인가요?">
    `openai-codex/*`는 Codex OAuth 경로를 사용하며, 사용 가능한 할당량 창은
    OpenAI가 관리하고 요금제에 따라 달라집니다. 실제로는 같은 계정에
    연결되어 있더라도 이러한 한도가 ChatGPT 웹사이트/앱 경험과 다를 수 있습니다.

    OpenClaw는 현재 보이는 provider 사용량/할당량 창을
    `openclaw models status`에 표시할 수 있지만, ChatGPT 웹의
    권한을 직접 API 액세스로 임의 생성하거나 정규화하지는 않습니다. 직접 OpenAI Platform
    과금/한도 경로를 원한다면 API 키와 함께 `openai/*`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI subscription auth(Codex OAuth)를 지원하나요?">
    예. OpenClaw는 **OpenAI Code (Codex) subscription OAuth**를 완전히 지원합니다.
    OpenAI는 OpenClaw와 같은 외부 도구/워크플로에서 subscription OAuth 사용을
    명시적으로 허용합니다. onboarding이 OAuth 흐름을 대신 실행할 수 있습니다.

    [OAuth](/ko/concepts/oauth), [Model providers](/ko/concepts/model-providers), [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.

  </Accordion>

  <Accordion title="Gemini CLI OAuth는 어떻게 설정하나요?">
    Gemini CLI는 `openclaw.json`의 client id 또는 secret이 아니라
    **plugin auth 흐름**을 사용합니다.

    단계:

    1. `gemini`가 `PATH`에 있도록 Gemini CLI를 로컬에 설치
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. plugin 활성화: `openclaw plugins enable google`
    3. 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. 로그인 후 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
    5. 요청이 실패하면 gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정

    이렇게 하면 OAuth 토큰이 gateway 호스트의 auth profile에 저장됩니다. 자세한 내용: [Model providers](/ko/concepts/model-providers).

  </Accordion>

  <Accordion title="가벼운 대화용으로 로컬 모델을 사용해도 되나요?">
    보통은 안 됩니다. OpenClaw는 큰 컨텍스트와 강한 안전성이 필요합니다. 작은 카드는 잘리고 누수가 생깁니다. 꼭 써야 한다면 로컬에서 가능한 **가장 큰** 모델 빌드(LM Studio)를 실행하고 [/gateway/local-models](/ko/gateway/local-models)를 참고하세요. 더 작거나 양자화된 모델은 프롬프트 인젝션 위험을 높입니다. [Security](/ko/gateway/security)를 참고하세요.
  </Accordion>

  <Accordion title="호스팅 모델 트래픽을 특정 리전에 유지하려면 어떻게 하나요?">
    리전 고정 엔드포인트를 선택하세요. OpenRouter는 MiniMax, Kimi, GLM에 대해 미국 호스팅 옵션을 제공합니다. 데이터를 해당 리전에 유지하려면 미국 호스팅 변형을 선택하세요. `models.mode: "merge"`를 사용하면 선택한 리전 provider를 유지하면서 Anthropic/OpenAI도 함께 나열해 fallback을 계속 사용할 수 있습니다.
  </Accordion>

  <Accordion title="이걸 설치하려면 Mac Mini를 꼭 사야 하나요?">
    아니요. OpenClaw는 macOS 또는 Linux에서 실행됩니다(Windows는 WSL2 경유). Mac mini는 선택 사항입니다. 항상 켜 두는 호스트로 구매하는 사람도 있지만, 작은 VPS, 홈 서버, Raspberry Pi급 장비도 충분히 사용할 수 있습니다.

    **macOS 전용 도구**를 써야 할 때만 Mac이 필요합니다. iMessage는 [BlueBubbles](/ko/channels/bluebubbles)(권장)를 사용하세요. BlueBubbles 서버는 아무 Mac에서나 실행할 수 있고, Gateway는 Linux나 다른 곳에서 실행해도 됩니다. 다른 macOS 전용 도구가 필요하다면 Gateway를 Mac에서 실행하거나 macOS Node를 페어링하세요.

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Nodes](/ko/nodes), [Mac remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage 지원을 위해 Mac mini가 필요한가요?">
    Messages에 로그인된 **어떤 macOS 디바이스**든 필요합니다. 꼭 Mac mini일 필요는 없고,
    어떤 Mac이든 됩니다. iMessage에는 **[BlueBubbles](/ko/channels/bluebubbles)**(권장)를 사용하세요. BlueBubbles 서버는 macOS에서 실행되고, Gateway는 Linux나 다른 곳에서 실행할 수 있습니다.

    일반적인 구성:

    - Linux/VPS에서 Gateway를 실행하고, Messages에 로그인된 아무 Mac에서나 BlueBubbles 서버를 실행
    - 가장 단순한 단일 머신 구성을 원하면 Mac에서 모든 것을 실행

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Nodes](/ko/nodes),
    [Mac remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw 실행용으로 Mac mini를 사면 MacBook Pro와 연결할 수 있나요?">
    예. **Mac mini가 Gateway를 실행**하고, MacBook Pro는
    **Node**(동반 디바이스)로 연결할 수 있습니다. Node는 Gateway를 실행하지 않고,
    해당 디바이스에서 화면/카메라/canvas 및 `system.run` 같은 추가 기능을 제공합니다.

    일반적인 패턴:

    - 항상 켜져 있는 Mac mini에 Gateway 배치
    - MacBook Pro에서 macOS 앱 또는 Node 호스트를 실행하고 Gateway에 페어링
    - `openclaw nodes status` / `openclaw nodes list`로 확인

    문서: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun을 사용할 수 있나요?">
    Bun은 **권장되지 않습니다**. 특히 WhatsApp과 Telegram에서 런타임 버그가 보입니다.
    안정적인 gateway에는 **Node**를 사용하세요.

    그래도 Bun을 실험해 보고 싶다면 WhatsApp/Telegram 없이
    비프로덕션 gateway에서만 시도하세요.

  </Accordion>

  <Accordion title="Telegram: allowFrom에는 무엇을 넣어야 하나요?">
    `channels.telegram.allowFrom`은 **사람 발신자의 Telegram 사용자 ID**(숫자)입니다. 봇 사용자명이 아닙니다.

    설정 시에는 숫자 사용자 ID만 입력하면 됩니다. 이미 레거시 `@username` 항목이 config에 있다면 `openclaw doctor --fix`가 이를 해석하려고 시도할 수 있습니다.

    더 안전한 방법(서드파티 봇 없음):

    - 봇에 DM을 보낸 뒤 `openclaw logs --follow`를 실행하고 `from.id`를 확인하세요.

    공식 Bot API:

    - 봇에 DM을 보낸 뒤 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출하고 `message.from.id`를 확인하세요.

    서드파티(개인정보 측면에서 덜 안전함):

    - `@userinfobot` 또는 `@getidsbot`에 DM을 보내세요.

    [/channels/telegram](/ko/channels/telegram#access-control-and-activation)을 참고하세요.

  </Accordion>

  <Accordion title="여러 사람이 하나의 WhatsApp 번호를 서로 다른 OpenClaw 인스턴스와 함께 사용할 수 있나요?">
    예. **멀티 에이전트 라우팅**으로 가능합니다. 각 발신자의 WhatsApp **DM**(peer `kind: "direct"`, 발신자 E.164 예: `+15551234567`)을 서로 다른 `agentId`에 바인딩하면 각 사람이 자신만의 workspace와 세션 저장소를 갖게 됩니다. 응답은 여전히 **같은 WhatsApp 계정**에서 나오며, DM 접근 제어(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`)는 WhatsApp 계정별 전역 설정입니다. [Multi-Agent Routing](/ko/concepts/multi-agent) 및 [WhatsApp](/ko/channels/whatsapp)를 참고하세요.
  </Accordion>

  <Accordion title='“빠른 채팅” 에이전트와 “코딩용 Opus” 에이전트를 함께 실행할 수 있나요?'>
    예. 멀티 에이전트 라우팅을 사용하세요. 각 에이전트에 자체 기본 모델을 지정한 뒤 수신 경로(provider 계정 또는 특정 peer)를 각 에이전트에 바인딩하면 됩니다. 예시 구성은 [Multi-Agent Routing](/ko/concepts/multi-agent)에 있습니다. [Models](/ko/concepts/models) 및 [Configuration](/ko/gateway/configuration)도 참고하세요.
  </Accordion>

  <Accordion title="Linux에서 Homebrew가 동작하나요?">
    예. Homebrew는 Linux(Linuxbrew)를 지원합니다. 빠른 설정:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd를 통해 OpenClaw를 실행한다면 서비스 PATH에 `/home/linuxbrew/.linuxbrew/bin`(또는 사용 중인 brew prefix)이 포함되어 `brew`로 설치한 도구가 비로그인 셸에서도 해석되도록 하세요.
    최근 빌드는 Linux systemd 서비스에서 일반적인 사용자 bin 디렉터리도 앞에 추가합니다(예: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`). 또한 설정된 경우 `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`도 반영합니다.

  </Accordion>

  <Accordion title="hackable git 설치와 npm install의 차이">
    - **Hackable (git) 설치:** 전체 소스 체크아웃, 수정 가능, 기여자에게 가장 적합
      로컬에서 빌드를 실행하며 코드/문서를 직접 패치할 수 있습니다.
    - **npm install:** 전역 CLI 설치, repo 없음, “그냥 실행”에 가장 적합
      업데이트는 npm dist-tag를 통해 제공됩니다.

    문서: [Getting started](/ko/start/getting-started), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="나중에 npm 설치와 git 설치 사이를 전환할 수 있나요?">
    예. 다른 방식으로 설치한 다음 Doctor를 실행해 gateway 서비스가 새 entrypoint를 가리키도록 하세요.
    이렇게 해도 **데이터는 삭제되지 않습니다**. 변경되는 것은 OpenClaw 코드 설치뿐입니다. 상태
    (`~/.openclaw`)와 workspace(`~/.openclaw/workspace`)는 그대로 유지됩니다.

    npm에서 git으로 전환:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git에서 npm으로 전환:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor는 gateway 서비스 entrypoint 불일치를 감지하고 현재 설치와 일치하도록 서비스 구성을 다시 쓰도록 제안합니다(자동화에서는 `--repair` 사용).

    백업 팁: [백업 전략](#디스크에서-파일-위치)을 참고하세요.

  </Accordion>

  <Accordion title="Gateway는 노트북에서 실행하는 것이 좋나요, 아니면 VPS에서 실행하는 것이 좋나요?">
    짧은 답: **24/7 안정성이 필요하면 VPS를 사용하세요**. 가장 낮은 마찰을 원하고 절전/재시작을 감수할 수 있다면 로컬에서 실행하세요.

    **노트북(로컬 Gateway)**

    - **장점:** 서버 비용 없음, 로컬 파일 직접 접근 가능, 라이브 브라우저 창 사용 가능
    - **단점:** 절전/네트워크 끊김 = 연결 끊김, OS 업데이트/재부팅으로 중단됨, 계속 켜 두어야 함

    **VPS / 클라우드**

    - **장점:** 항상 켜짐, 안정적인 네트워크, 노트북 절전 문제 없음, 계속 실행 상태 유지가 쉬움
    - **단점:** 보통 headless로 실행됨(스크린샷 사용), 원격 파일 접근만 가능, 업데이트하려면 SSH 필요

    **OpenClaw 관련 참고:** WhatsApp/Telegram/Slack/Mattermost/Discord는 모두 VPS에서 잘 동작합니다. 실제 차이는 **headless 브라우저** 대 보이는 브라우저 창 정도입니다. [Browser](/ko/tools/browser)를 참고하세요.

    **권장 기본값:** 이전에 gateway 연결 끊김을 겪었다면 VPS를 사용하세요. Mac을 적극적으로 사용 중이고 로컬 파일 접근이나 보이는 브라우저로 UI 자동화를 원할 때는 로컬도 매우 좋습니다.

  </Accordion>

  <Accordion title="OpenClaw를 전용 머신에서 실행하는 것이 얼마나 중요한가요?">
    필수는 아니지만 **안정성과 격리를 위해 권장**됩니다.

    - **전용 호스트(VPS/Mac mini/Pi):** 항상 켜짐, 절전/재부팅 중단이 적음, 권한 구성이 더 깔끔함, 지속 실행 유지가 쉬움
    - **공용 노트북/데스크톱:** 테스트와 적극적인 사용에는 전혀 문제없지만, 머신이 절전하거나 업데이트할 때 중단이 발생할 수 있음

    두 가지 장점을 모두 원한다면 Gateway는 전용 호스트에 두고 노트북은 로컬 화면/카메라/exec 도구용 **Node**로 페어링하세요. [Nodes](/ko/nodes)를 참고하세요.
    보안 지침은 [Security](/ko/gateway/security)를 읽어 보세요.

  </Accordion>

  <Accordion title="최소 VPS 요구 사항과 권장 OS는 무엇인가요?">
    OpenClaw는 가볍습니다. 기본 Gateway + 하나의 채팅 채널 기준:

    - **절대 최소:** 1 vCPU, 1GB RAM, 약 500MB 디스크
    - **권장:** 여유 공간을 위해 1-2 vCPU, 2GB RAM 이상(로그, 미디어, 여러 채널). Node 도구와 브라우저 자동화는 리소스를 많이 사용할 수 있습니다.

    OS: **Ubuntu LTS**(또는 최신 Debian/Ubuntu)를 사용하세요. Linux 설치 경로는 여기서 가장 잘 테스트되어 있습니다.

    문서: [Linux](/ko/platforms/linux), [VPS hosting](/ko/vps).

  </Accordion>

  <Accordion title="VM에서 OpenClaw를 실행할 수 있나요? 요구 사항은 무엇인가요?">
    예. VM은 VPS와 동일하게 취급하면 됩니다. 항상 켜져 있고, 접근 가능하며, Gateway와 활성화한 채널을 실행하기에 충분한
    RAM이 필요합니다.

    기준 가이드:

    - **절대 최소:** 1 vCPU, 1GB RAM
    - **권장:** 여러 채널, 브라우저 자동화, 미디어 도구를 실행한다면 2GB RAM 이상
    - **OS:** Ubuntu LTS 또는 최신 Debian/Ubuntu

    Windows를 사용 중이라면 **WSL2가 가장 쉬운 VM 스타일 설정**이며 도구 호환성도 가장 좋습니다.
    [Windows](/ko/platforms/windows), [VPS hosting](/ko/vps)를 참고하세요.
    macOS를 VM에서 실행 중이라면 [macOS VM](/ko/install/macos-vm)을 참고하세요.

  </Accordion>
</AccordionGroup>

## OpenClaw란 무엇인가요?

<AccordionGroup>
  <Accordion title="OpenClaw를 한 문단으로 설명하면 무엇인가요?">
    OpenClaw는 사용자의 디바이스에서 직접 실행하는 개인 AI 어시스턴트입니다. 이미 사용 중인 메시징 표면(WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, 그리고 QQ Bot 같은 번들 채널 plugin)에서 응답하며, 지원되는 플랫폼에서는 음성과 라이브 Canvas도 사용할 수 있습니다. **Gateway**는 항상 켜져 있는 제어 평면이며, 어시스턴트가 제품 그 자체입니다.
  </Accordion>

  <Accordion title="가치 제안">
    OpenClaw는 단순한 "Claude 래퍼"가 아닙니다. 사용자가 이미 쓰는 채팅 앱을 통해 접근할 수 있고,
    상태 유지 세션, 메모리, 도구를 갖춘 유능한 어시스턴트를 **자신의 하드웨어에서**
    실행할 수 있게 해 주는 **로컬 우선 제어 평면**입니다. 워크플로 제어를 호스팅된
    SaaS에 넘길 필요가 없습니다.

    주요 특징:

    - **내 디바이스, 내 데이터:** 원하는 곳(Mac, Linux, VPS)에서 Gateway를 실행하고
      workspace + 세션 기록을 로컬에 유지
    - **웹 샌드박스가 아닌 실제 채널:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 등,
      그리고 지원되는 플랫폼에서는 모바일 음성과 Canvas도 제공
    - **모델 비종속적:** Anthropic, OpenAI, MiniMax, OpenRouter 등을 사용하고 에이전트별 라우팅
      및 장애 조치 가능
    - **로컬 전용 옵션:** 원하면 로컬 모델을 실행해 **모든 데이터를 디바이스에만 유지**
    - **멀티 에이전트 라우팅:** 채널, 계정, 작업별로 별도 에이전트를 두고, 각자 고유한
      workspace와 기본값을 가짐
    - **오픈 소스 + 해킹 가능:** 벤더 종속 없이 직접 검사, 확장, 셀프 호스팅 가능

    문서: [Gateway](/ko/gateway), [Channels](/ko/channels), [Multi-agent](/ko/concepts/multi-agent),
    [Memory](/ko/concepts/memory).

  </Accordion>

  <Accordion title="방금 설정했는데, 먼저 무엇을 해보면 좋을까요?">
    처음 해보기 좋은 프로젝트:

    - 웹사이트 만들기(WordPress, Shopify 또는 간단한 정적 사이트)
    - 모바일 앱 프로토타입 만들기(개요, 화면, API 계획)
    - 파일과 폴더 정리(정리, 이름 지정, 태깅)
    - Gmail 연결 후 요약 또는 후속 작업 자동화

    큰 작업도 처리할 수 있지만, 단계를 나누고
    병렬 작업에는 서브 에이전트를 사용할 때 가장 잘 동작합니다.

  </Accordion>

  <Accordion title="OpenClaw의 일상적인 상위 5가지 사용 사례는 무엇인가요?">
    일상적인 효용은 보통 다음과 같습니다.

    - **개인 브리핑:** 받은 편지함, 캘린더, 관심 뉴스 요약
    - **리서치와 초안 작성:** 빠른 조사, 요약, 이메일이나 문서의 초안 작성
    - **리마인더와 후속 작업:** Cron 또는 Heartbeat 기반 알림과 체크리스트
    - **브라우저 자동화:** 양식 작성, 데이터 수집, 반복 웹 작업 수행
    - **기기 간 조정:** 휴대폰에서 작업을 보내고, Gateway가 서버에서 실행한 뒤, 결과를 채팅으로 다시 받기

  </Accordion>

  <Accordion title="OpenClaw로 SaaS의 리드 생성, 아웃리치, 광고, 블로그 작업을 도울 수 있나요?">
    **리서치, 자격 판별, 초안 작성**에는 예입니다. 사이트를 스캔하고, 후보 목록을 만들고,
    잠재 고객을 요약하고, 아웃리치나 광고 카피 초안을 작성할 수 있습니다.

    **아웃리치나 광고 집행**에는 사람이 반드시 개입해야 합니다. 스팸을 피하고, 현지 법률과
    플랫폼 정책을 준수하며, 발송 전에 모든 내용을 검토하세요. 가장 안전한 패턴은
    OpenClaw가 초안을 만들고 사용자가 승인하는 방식입니다.

    문서: [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="웹 개발에서 Claude Code 대비 장점은 무엇인가요?">
    OpenClaw는 **개인 어시스턴트**이자 조정 계층이지 IDE 대체제가 아닙니다. repo 안에서 가장 빠른 직접 코딩 루프에는
    Claude Code나 Codex를 사용하세요. 지속적인 메모리, 기기 간 접근, 도구 오케스트레이션이 필요할 때는 OpenClaw를 사용하세요.

    장점:

    - 세션 전반에 걸친 **지속적인 메모리 + workspace**
    - **멀티플랫폼 접근**(WhatsApp, Telegram, TUI, WebChat)
    - **도구 오케스트레이션**(브라우저, 파일, 스케줄링, hooks)
    - **항상 켜진 Gateway**(VPS에서 실행하고 어디서나 상호작용 가능)
    - 로컬 브라우저/화면/카메라/exec용 **Nodes**

    쇼케이스: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills와 자동화

<AccordionGroup>
  <Accordion title="repo를 더럽히지 않고 Skills를 사용자 지정하려면 어떻게 하나요?">
    repo 사본을 편집하는 대신 관리형 재정의를 사용하세요. 변경 내용은 `~/.openclaw/skills/<name>/SKILL.md`에 두거나(`~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 폴더 추가 가능) 관리하세요. 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs` 순이므로, 관리형 재정의는 git을 건드리지 않고도 번들 Skills보다 우선합니다. Skill을 전역으로 설치하되 일부 에이전트에만 보이게 하려면 공용 사본은 `~/.openclaw/skills`에 두고 `agents.defaults.skills`와 `agents.list[].skills`로 가시성을 제어하세요. 업스트림에 반영할 가치가 있는 수정만 repo에 두고 PR로 보내야 합니다.
  </Accordion>

  <Accordion title="사용자 지정 폴더에서 Skills를 로드할 수 있나요?">
    예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 디렉터리를 넣을 수 있습니다(가장 낮은 우선순위). 기본 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs`입니다. `clawhub`는 기본적으로 `./skills`에 설치하며, OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 취급합니다. Skill이 특정 에이전트에만 보여야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`와 함께 사용하세요.
  </Accordion>

  <Accordion title="작업별로 다른 모델을 사용하려면 어떻게 하나요?">
    현재 지원되는 패턴은 다음과 같습니다.

    - **Cron 작업**: 격리된 작업마다 `model` 재정의를 설정할 수 있음
    - **서브 에이전트**: 기본 모델이 다른 별도 에이전트로 작업 라우팅
    - **온디맨드 전환**: `/model`로 현재 세션 모델을 언제든 전환

    [Cron jobs](/ko/automation/cron-jobs), [Multi-Agent Routing](/ko/concepts/multi-agent), [Slash commands](/ko/tools/slash-commands)를 참고하세요.

  </Accordion>

  <Accordion title="무거운 작업을 하는 동안 봇이 멈춥니다. 어떻게 오프로드하나요?">
    길거나 병렬인 작업에는 **서브 에이전트**를 사용하세요. 서브 에이전트는 자체 세션에서 실행되고,
    요약을 반환하며, 메인 채팅의 응답성을 유지합니다.

    봇에게 "이 작업을 위한 서브 에이전트를 생성해 줘"라고 요청하거나 `/subagents`를 사용하세요.
    채팅에서 `/status`를 사용하면 Gateway가 현재 무엇을 하고 있는지(그리고 바쁜지 여부도) 볼 수 있습니다.

    토큰 팁: 긴 작업과 서브 에이전트는 모두 토큰을 소비합니다. 비용이 걱정된다면
    `agents.defaults.subagents.model`을 통해 서브 에이전트용 더 저렴한 모델을 설정하세요.

    문서: [Sub-agents](/ko/tools/subagents), [Background Tasks](/ko/automation/tasks).

  </Accordion>

  <Accordion title="Discord에서 thread-bound subagent 세션은 어떻게 동작하나요?">
    thread 바인딩을 사용하세요. Discord thread를 서브 에이전트 또는 세션 대상에 바인딩하면 해당 thread의 후속 메시지가 그 바인딩된 세션에 계속 유지됩니다.

    기본 흐름:

    - `sessions_spawn`을 `thread: true`와 함께 사용해 생성(지속적인 후속 동작이 필요하면 선택적으로 `mode: "session"`도 사용)
    - 또는 `/focus <target>`으로 수동 바인딩
    - `/agents`로 바인딩 상태 확인
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`로 자동 unfocus 제어
    - `/unfocus`로 thread 분리

    필요한 구성:

    - 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Discord 재정의: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - 생성 시 자동 바인딩: `channels.discord.threadBindings.spawnSubagentSessions: true` 설정

    문서: [Sub-agents](/ko/tools/subagents), [Discord](/ko/channels/discord), [Configuration Reference](/ko/gateway/configuration-reference), [Slash commands](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="서브 에이전트가 완료되었는데 완료 업데이트가 잘못된 곳으로 갔거나 아예 게시되지 않았습니다. 무엇을 확인해야 하나요?">
    먼저 확인할 것은 해결된 requester route입니다.

    - 완료 모드 서브 에이전트 전달은 바인딩된 thread 또는 대화 route가 있으면 이를 우선 사용합니다.
    - 완료 origin에 채널만 있으면 OpenClaw는 requester 세션에 저장된 route(`lastChannel` / `lastTo` / `lastAccountId`)로 폴백하여 직접 전달이 계속 가능하도록 합니다.
    - 바인딩된 route도 없고 사용 가능한 저장 route도 없으면 직접 전달이 실패할 수 있으며, 결과는 채팅에 즉시 게시되지 않고 대기열 세션 전달로 대신 폴백됩니다.
    - 잘못되었거나 오래된 대상은 여전히 대기열 폴백 또는 최종 전달 실패를 유발할 수 있습니다.
    - 자식의 마지막 가시적 assistant 응답이 정확히 무응답 토큰 `NO_REPLY` / `no_reply`이거나 정확히 `ANNOUNCE_SKIP`이면, OpenClaw는 오래된 이전 진행 상황을 게시하지 않고 알림을 의도적으로 억제합니다.
    - 자식이 도구 호출만 수행한 뒤 시간 초과되었다면, 알림은 원시 도구 출력을 다시 재생하는 대신 이를 짧은 부분 진행 요약으로 축약할 수 있습니다.

    디버그:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Sub-agents](/ko/tools/subagents), [Background Tasks](/ko/automation/tasks), [Session Tools](/ko/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron 또는 리마인더가 실행되지 않습니다. 무엇을 확인해야 하나요?">
    Cron은 Gateway 프로세스 내부에서 실행됩니다. Gateway가 계속 실행 중이 아니면
    예약된 작업은 실행되지 않습니다.

    확인 목록:

    - cron이 활성화되어 있는지(`cron.enabled`)와 `OPENCLAW_SKIP_CRON`이 설정되지 않았는지 확인
    - Gateway가 24/7 실행 중인지 확인(절전/재시작 없음)
    - 작업의 시간대 설정을 확인(`--tz` 대 호스트 시간대)

    디버그:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [Automation & Tasks](/ko/automation).

  </Accordion>

  <Accordion title="Cron이 실행되었는데 채널로 아무것도 전송되지 않았습니다. 왜 그런가요?">
    먼저 전달 모드를 확인하세요.

    - `--no-deliver` / `delivery.mode: "none"`이면 runner 폴백 전송은 기대되지 않습니다.
    - announce 대상(`channel` / `to`)이 누락되었거나 유효하지 않으면 runner가 발신 전달을 건너뜁니다.
    - 채널 auth 실패(`unauthorized`, `Forbidden`)는 runner가 전달을 시도했지만 자격 증명 때문에 차단되었음을 의미합니다.
    - 고립된 Cron 결과가 무응답(`NO_REPLY` / `no_reply`만 있음)이면 의도적으로 전달 불가한 것으로 처리되므로 runner도 대기열 폴백 전달을 억제합니다.

    고립된 Cron 작업의 경우 채팅 route를 사용할 수 있으면 에이전트가 `message`
    도구로 직접 전송할 수도 있습니다. `--announce`는 에이전트가 아직 직접 전송하지 않은
    최종 텍스트에 대한 runner 폴백 경로만 제어합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [Background Tasks](/ko/automation/tasks).

  </Accordion>

  <Accordion title="고립된 Cron 실행이 모델을 바꾸거나 한 번 재시도한 이유는 무엇인가요?">
    보통은 중복 스케줄링이 아니라 라이브 모델 전환 경로 때문입니다.

    고립된 Cron은 활성 실행이 `LiveSessionModelSwitchError`를 던질 때 런타임 모델 핸드오프를 유지하고 재시도할 수 있습니다. 재시도는 전환된 provider/model을 유지하며, 전환에 새 auth profile 재정의가 포함되어 있으면 Cron은 재시도 전에 그것도 유지합니다.

    관련 선택 규칙:

    - 해당되는 경우 Gmail hook 모델 재정의가 먼저 우선합니다.
    - 그다음 작업별 `model`
    - 그다음 저장된 cron-session 모델 재정의
    - 그다음 일반 에이전트/기본 모델 선택

    재시도 루프는 제한되어 있습니다. 초기 시도와 모델 전환 재시도 2회를 넘기면
    Cron은 무한 반복하지 않고 중단합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron jobs](/ko/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux에서 Skills를 설치하려면 어떻게 하나요?">
    기본 `openclaw skills` 명령을 사용하거나 workspace에 Skills를 넣으세요. macOS Skills UI는 Linux에서 사용할 수 없습니다.
    Skills 둘러보기: [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    기본 `openclaw skills install`은 활성 workspace의 `skills/`
    디렉터리에 기록합니다. 별도의 `clawhub` CLI는 직접 Skills를 게시하거나
    동기화하려는 경우에만 설치하세요. 에이전트 간 공유 설치를 원하면 Skill을
    `~/.openclaw/skills` 아래에 두고, 어떤 에이전트가 볼 수 있는지 제한하려면 `agents.defaults.skills` 또는
    `agents.list[].skills`를 사용하세요.

  </Accordion>

  <Accordion title="OpenClaw가 예약에 따라 작업을 실행하거나 백그라운드에서 계속 실행되게 할 수 있나요?">
    예. Gateway 스케줄러를 사용하세요.

    - 예약 또는 반복 작업에는 **Cron 작업**(재시작 후에도 유지)
    - “메인 세션” 주기 점검에는 **Heartbeat**
    - 요약을 게시하거나 채팅으로 전달하는 자율 에이전트에는 **고립된 작업**

    문서: [Cron jobs](/ko/automation/cron-jobs), [Automation & Tasks](/ko/automation),
    [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux에서 Apple macOS 전용 Skills를 실행할 수 있나요?">
    직접적으로는 안 됩니다. macOS Skills는 `metadata.openclaw.os`와 필요한 바이너리로 제한되며, Skills는 **Gateway 호스트**에서 적격일 때만 시스템 프롬프트에 나타납니다. Linux에서는 게이팅을 재정의하지 않는 한 `darwin` 전용 Skills(`apple-notes`, `apple-reminders`, `things-mac` 등)는 로드되지 않습니다.

    지원되는 패턴은 세 가지입니다.

    **옵션 A - Gateway를 Mac에서 실행(가장 단순함).**
    macOS 바이너리가 있는 곳에서 Gateway를 실행한 뒤 [remote mode](#gateway-ports-already-running-and-remote-mode) 또는 Tailscale을 통해 Linux에서 연결하세요. Gateway 호스트가 macOS이므로 Skills가 정상적으로 로드됩니다.

    **옵션 B - macOS Node 사용(SSH 없음).**
    Linux에서 Gateway를 실행하고 macOS Node(메뉴바 앱)를 페어링한 뒤 Mac에서 **Node Run Commands**를 “Always Ask” 또는 “Always Allow”로 설정하세요. 필요한 바이너리가 Node에 있으면 OpenClaw는 macOS 전용 Skills를 적격으로 취급할 수 있습니다. 에이전트는 `nodes` 도구를 통해 해당 Skills를 실행합니다. “Always Ask”를 선택한 경우 프롬프트에서 “Always Allow”를 승인하면 그 명령이 허용 목록에 추가됩니다.

    **옵션 C - SSH를 통해 macOS 바이너리 프록시(고급).**
    Gateway는 Linux에 두되, 필요한 CLI 바이너리가 Mac에서 실행되는 SSH 래퍼로 해석되게 만드세요. 그런 다음 Linux에서도 적격 상태를 유지하도록 Skill을 재정의하세요.

    1. 바이너리에 대한 SSH 래퍼를 만듭니다(예: Apple Notes용 `memo`).

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux 호스트의 `PATH`에 래퍼를 넣습니다(예: `~/bin/memo`).
    3. Linux를 허용하도록 Skill metadata를 재정의합니다(workspace 또는 `~/.openclaw/skills`).

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills 스냅샷이 새로 고쳐지도록 새 세션을 시작합니다.

  </Accordion>

  <Accordion title="Notion 또는 HeyGen 통합이 있나요?">
    현재는 기본 제공되지 않습니다.

    옵션:

    - **사용자 지정 Skill / Plugin:** 안정적인 API 액세스에 가장 적합(Notion/HeyGen 모두 API 제공)
    - **브라우저 자동화:** 코드 없이 동작하지만 더 느리고 더 취약함

    클라이언트별 컨텍스트를 유지하려면(에이전시 워크플로), 간단한 패턴은 다음과 같습니다.

    - 클라이언트별 Notion 페이지 하나(context + 환경설정 + 활성 작업)
    - 세션 시작 시 해당 페이지를 가져오도록 에이전트에 요청

    기본 통합을 원한다면 기능 요청을 열거나
    해당 API를 대상으로 하는 Skill을 직접 만드세요.

    Skills 설치:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    기본 설치는 활성 workspace `skills/` 디렉터리에 들어갑니다. 에이전트 간 공유 Skills의 경우 `~/.openclaw/skills/<name>/SKILL.md`에 두세요. 일부 에이전트만 공유 설치를 볼 수 있어야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`를 구성하세요. 일부 Skills는 Homebrew로 설치된 바이너리를 기대하며, Linux에서는 이는 Linuxbrew를 의미합니다(위의 Homebrew Linux FAQ 항목 참고). [Skills](/ko/tools/skills), [Skills config](/ko/tools/skills-config), [ClawHub](/ko/tools/clawhub)를 참고하세요.

  </Accordion>

  <Accordion title="기존에 로그인된 Chrome을 OpenClaw와 함께 사용하려면 어떻게 하나요?">
    Chrome DevTools MCP를 통해 연결되는 기본 제공 `user` 브라우저 프로필을 사용하세요.

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    사용자 지정 이름을 원한다면 명시적인 MCP 프로필을 만드세요.

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    이 경로는 로컬 호스트 브라우저 또는 연결된 브라우저 Node를 사용할 수 있습니다. Gateway가 다른 곳에서 실행된다면 브라우저 머신에서 Node 호스트를 실행하거나 대신 원격 CDP를 사용하세요.

    `existing-session` / `user`의 현재 제한 사항:

    - 동작은 CSS selector 기반이 아니라 ref 기반
    - 업로드는 `ref` / `inputRef`가 필요하며 현재는 한 번에 파일 하나만 지원
    - `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 동작은 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요

  </Accordion>
</AccordionGroup>

## 샌드박싱과 메모리

<AccordionGroup>
  <Accordion title="전용 샌드박싱 문서가 있나요?">
    예. [Sandboxing](/ko/gateway/sandboxing)을 참고하세요. Docker 전용 설정(전체 gateway를 Docker에서 실행하거나 샌드박스 이미지를 사용하는 경우)은 [Docker](/ko/install/docker)를 참고하세요.
  </Accordion>

  <Accordion title="Docker가 제한적으로 느껴집니다. 전체 기능을 활성화하려면 어떻게 하나요?">
    기본 이미지는 보안 우선이며 `node` 사용자로 실행되므로
    시스템 패키지, Homebrew, 번들 브라우저가 포함되지 않습니다. 더 완전한 설정을 원한다면:

    - 캐시가 유지되도록 `/home/node`를 `OPENCLAW_HOME_VOLUME`으로 유지
    - `OPENCLAW_DOCKER_APT_PACKAGES`로 시스템 종속성을 이미지에 포함
    - 번들 CLI를 통해 Playwright 브라우저 설치:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 해당 경로가 유지되도록 보장

    문서: [Docker](/ko/install/docker), [Browser](/ko/tools/browser).

  </Accordion>

  <Accordion title="하나의 에이전트로 DM은 개인용으로 유지하고 그룹은 공개/샌드박스 처리할 수 있나요?">
    예. 비공개 트래픽이 **DM**이고 공개 트래픽이 **그룹**이라면 가능합니다.

    `agents.defaults.sandbox.mode: "non-main"`을 사용하면 그룹/채널 세션(메인이 아닌 키)은 구성된 샌드박스 백엔드에서 실행되고, 메인 DM 세션은 호스트에서 그대로 실행됩니다. 별도 선택이 없으면 Docker가 기본 백엔드입니다. 그런 다음 `tools.sandbox.tools`를 통해 샌드박스 세션에서 사용할 도구를 제한하세요.

    설정 안내 + 예시 구성: [그룹: 개인 DM + 공개 그룹](/ko/channels/groups#pattern-personal-dms-public-groups-single-agent)

    핵심 구성 참조: [Gateway configuration](/ko/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="호스트 폴더를 샌드박스에 바인딩하려면 어떻게 하나요?">
    `agents.defaults.sandbox.docker.binds`를 `["host:path:mode"]` 형식으로 설정하세요(예: `"/home/user/src:/src:ro"`). 전역 바인딩과 에이전트별 바인딩은 병합되며, `scope: "shared"`일 때는 에이전트별 바인딩이 무시됩니다. 민감한 항목에는 `:ro`를 사용하고, 바인딩은 샌드박스 파일시스템 경계를 우회한다는 점을 기억하세요.

    OpenClaw는 정규화된 경로와 가장 깊은 기존 상위 경로를 통해 해석된 정식 경로 둘 다를 기준으로 bind source를 검증합니다. 즉, 마지막 경로 세그먼트가 아직 존재하지 않더라도 symlink 상위 경로 탈출은 닫힌 상태로 실패하며, symlink 해석 후에도 허용된 루트 검사는 계속 적용됩니다.

    예시와 안전 참고 사항은 [Sandboxing](/ko/gateway/sandboxing#custom-bind-mounts) 및 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)를 참고하세요.

  </Accordion>

  <Accordion title="메모리는 어떻게 동작하나요?">
    OpenClaw 메모리는 에이전트 workspace 안의 Markdown 파일일 뿐입니다.

    - `memory/YYYY-MM-DD.md`의 일일 노트
    - `MEMORY.md`의 선별된 장기 노트(메인/비공개 세션 전용)

    OpenClaw는 자동 Compaction 전에 모델이 지속 가능한 노트를 쓰도록 상기시키기 위해
    **자동 Compaction 전 무응답 메모리 플러시**도 실행합니다. 이는 workspace가
    쓰기 가능할 때만 실행됩니다(읽기 전용 샌드박스에서는 건너뜀). [Memory](/ko/concepts/memory)를 참고하세요.

  </Accordion>

  <Accordion title="메모리가 계속 잊어버립니다. 어떻게 하면 유지되게 할 수 있나요?">
    봇에게 **그 사실을 메모리에 기록하라고** 요청하세요. 장기 노트는 `MEMORY.md`에,
    단기 컨텍스트는 `memory/YYYY-MM-DD.md`에 들어갑니다.

    이 부분은 아직 개선 중입니다. 모델에게 메모리를 저장하라고 상기시키면 도움이 되며,
    모델은 무엇을 해야 하는지 알게 됩니다. 계속 잊는다면 Gateway가 매 실행마다 같은
    workspace를 사용하고 있는지 확인하세요.

    문서: [Memory](/ko/concepts/memory), [Agent workspace](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="메모리는 영구적으로 유지되나요? 한계는 무엇인가요?">
    메모리 파일은 디스크에 저장되며 사용자가 삭제할 때까지 유지됩니다. 한계는 모델이 아니라
    저장소입니다. 다만 **세션 컨텍스트**는 여전히 모델 컨텍스트 창의 제한을 받으므로
    긴 대화는 Compaction되거나 잘릴 수 있습니다. 그래서
    메모리 검색이 존재합니다. 관련 부분만 다시 컨텍스트로 가져옵니다.

    문서: [Memory](/ko/concepts/memory), [Context](/ko/concepts/context).

  </Accordion>

  <Accordion title="시맨틱 메모리 검색에는 OpenAI API 키가 필요한가요?">
    **OpenAI 임베딩**을 사용할 때만 필요합니다. Codex OAuth는 채팅/completions만 다루며
    임베딩 액세스는 제공하지 않으므로, **Codex로 로그인해도(OAuth든
    Codex CLI 로그인든)** 시맨틱 메모리 검색에는 도움이 되지 않습니다. OpenAI 임베딩에는
    여전히 실제 API 키(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

    provider를 명시적으로 설정하지 않으면 OpenClaw는 API 키를 해석할 수 있을 때
    provider를 자동 선택합니다(auth profile, `models.providers.*.apiKey`, 또는 env var).
    OpenAI 키가 해석되면 OpenAI를 우선하고, 그렇지 않으면 Gemini 키,
    그다음 Voyage, 그다음 Mistral 순입니다. 원격 키를 사용할 수 없으면 메모리
    검색은 사용자가 구성할 때까지 비활성 상태로 유지됩니다. 로컬 모델 경로가
    구성되어 있고 실제로 존재하면 OpenClaw는
    `local`을 우선합니다. Ollama는 `memorySearch.provider = "ollama"`를
    명시적으로 설정했을 때 지원됩니다.

    로컬만 사용하고 싶다면 `memorySearch.provider = "local"`로 설정하세요(선택적으로
    `memorySearch.fallback = "none"`도 가능). Gemini 임베딩을 원한다면
    `memorySearch.provider = "gemini"`로 설정하고 `GEMINI_API_KEY`(또는
    `memorySearch.remote.apiKey`)를 제공하세요. **OpenAI, Gemini, Voyage, Mistral, Ollama 또는 local** 임베딩
    모델을 지원합니다. 설정 세부 사항은 [Memory](/ko/concepts/memory)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 디스크에서 파일 위치

<AccordionGroup>
  <Accordion title="OpenClaw와 함께 사용되는 모든 데이터가 로컬에 저장되나요?">
    아니요. **OpenClaw의 상태는 로컬**이지만, **외부 서비스는 여전히 사용자가 보내는 내용을 보게 됩니다**.

    - **기본적으로 로컬:** 세션, 메모리 파일, config, workspace는 Gateway 호스트에 저장됩니다
      (`~/.openclaw` + 사용자의 workspace 디렉터리).
    - **필연적으로 원격:** 모델 provider(Anthropic/OpenAI 등)에 보내는 메시지는
      해당 API로 전송되며, 채팅 플랫폼(WhatsApp/Telegram/Slack 등)은 메시지 데이터를
      서버에 저장합니다.
    - **흔적은 사용자가 제어:** 로컬 모델을 사용하면 프롬프트는 머신에 남지만, 채널
      트래픽은 여전히 해당 채널의 서버를 통과합니다.

    관련 항목: [Agent workspace](/ko/concepts/agent-workspace), [Memory](/ko/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw는 데이터를 어디에 저장하나요?">
    모든 항목은 `$OPENCLAW_STATE_DIR` 아래에 있습니다(기본값: `~/.openclaw`).

    | Path                                                            | 용도                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 메인 config (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 레거시 OAuth 가져오기(첫 사용 시 auth profile로 복사됨)            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profile(OAuth, API 키, 선택적 `keyRef`/`tokenRef`)            |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider용 선택적 파일 기반 secret payload        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 레거시 호환 파일(정적 `api_key` 항목은 scrubbed 처리됨)            |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider 상태(예: `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 에이전트별 상태(agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 대화 기록 및 상태(에이전트별)                                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 세션 메타데이터(에이전트별)                                        |

    레거시 단일 에이전트 경로: `~/.openclaw/agent/*` (`openclaw doctor`로 마이그레이션됨).

    사용자의 **workspace**(`AGENTS.md`, 메모리 파일, Skills 등)는 별도이며 `agents.defaults.workspace`로 구성합니다(기본값: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md는 어디에 두어야 하나요?">
    이 파일들은 `~/.openclaw`가 아니라 **에이전트 workspace**에 있습니다.

    - **Workspace(에이전트별):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`(또는 `MEMORY.md`가 없을 때 레거시 폴백 `memory.md`),
      `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`
    - **상태 디렉터리(`~/.openclaw`)**: config, 채널/provider 상태, auth profile, sessions, logs,
      및 공유 Skills(`~/.openclaw/skills`)

    기본 workspace는 `~/.openclaw/workspace`이며, 다음으로 구성할 수 있습니다.

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    재시작 후 봇이 “잊어버리는” 경우, Gateway가 실행될 때마다 같은
    workspace를 사용하고 있는지 확인하세요(그리고 remote mode는 **gateway 호스트의**
    workspace를 사용하며, 로컬 노트북의 workspace가 아니라는 점을 기억하세요).

    팁: 지속적인 동작이나 선호 사항을 원한다면 채팅 기록에 의존하기보다
    **AGENTS.md 또는 MEMORY.md에 기록하라고** 봇에게 요청하세요.

    [Agent workspace](/ko/concepts/agent-workspace) 및 [Memory](/ko/concepts/memory)를 참고하세요.

  </Accordion>

  <Accordion title="권장 백업 전략">
    **에이전트 workspace**를 **비공개** git repo에 넣고
    비공개 장소(예: GitHub private)에 백업하세요. 이렇게 하면 memory + AGENTS/SOUL/USER
    파일이 보존되며, 나중에 어시스턴트의 “정신”을 복원할 수 있습니다.

    `~/.openclaw` 아래의 어떤 것도 commit하면 안 됩니다(자격 증명, 세션, 토큰, 또는 암호화된 secret payload).
    전체 복원이 필요하다면 workspace와 상태 디렉터리를
    별도로 둘 다 백업하세요(위의 마이그레이션 질문 참고).

    문서: [Agent workspace](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw를 완전히 제거하려면 어떻게 하나요?">
    전용 가이드를 참고하세요: [Uninstall](/ko/install/uninstall).
  </Accordion>

  <Accordion title="에이전트가 workspace 밖에서도 작업할 수 있나요?">
    예. workspace는 **기본 cwd**이자 메모리 앵커이지, 강제 샌드박스가 아닙니다.
    상대 경로는 workspace 내부에서 해석되지만, 절대 경로는 다른
    호스트 위치에도 접근할 수 있습니다. 샌드박싱이 활성화되지 않은 경우에 그렇습니다. 격리가 필요하다면
    [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 또는 에이전트별 샌드박스 설정을 사용하세요. 어떤 repo를
    기본 작업 디렉터리로 삼고 싶다면 해당 에이전트의
    `workspace`를 repo 루트로 지정하세요. OpenClaw repo는 단지 소스 코드일 뿐이므로,
    의도적으로 그 안에서 작업하게 하려는 것이 아니라면 workspace는 별도로 두세요.

    예시(repo를 기본 cwd로 사용):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote mode: 세션 저장소는 어디에 있나요?">
    세션 상태는 **gateway 호스트**가 소유합니다. remote mode라면 중요한 세션 저장소는 로컬 노트북이 아니라 원격 머신에 있습니다. [Session management](/ko/concepts/session)를 참고하세요.
  </Accordion>
</AccordionGroup>

## 기본 config

<AccordionGroup>
  <Accordion title="config 형식은 무엇이며 어디에 있나요?">
    OpenClaw는 `$OPENCLAW_CONFIG_PATH`에서 선택적 **JSON5** config를 읽습니다(기본값: `~/.openclaw/openclaw.json`).

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    파일이 없으면 비교적 안전한 기본값을 사용합니다(기본 workspace `~/.openclaw/workspace` 포함).

  </Accordion>

  <Accordion title='`gateway.bind: "lan"`(또는 `"tailnet"`)을 설정했더니 아무것도 listen하지 않거나 UI에 unauthorized가 표시됩니다'>
    non-loopback bind에는 **유효한 gateway auth 경로가 필요합니다**. 실제로는 다음을 의미합니다.

    - shared-secret auth: 토큰 또는 비밀번호
    - 올바르게 구성된 non-loopback identity-aware reverse proxy 뒤의 `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    참고:

    - `gateway.remote.token` / `.password`만으로는 로컬 gateway auth가 활성화되지 않습니다.
    - 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 폴백으로 사용할 수 있습니다.
    - 비밀번호 auth에는 대신 `gateway.auth.mode: "password"`와 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 설정하세요.
    - `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, 해석은 닫힌 상태로 실패합니다(원격 폴백으로 가려지지 않음).
    - shared-secret Control UI 설정은 `connect.params.auth.token` 또는 `connect.params.auth.password`를 통해 인증합니다(app/UI 설정에 저장됨). Tailscale Serve 또는 `trusted-proxy` 같은 identity 포함 모드는 대신 요청 헤더를 사용합니다. shared secret을 URL에 넣지 마세요.
    - `gateway.auth.mode: "trusted-proxy"`에서는 같은 호스트의 loopback reverse proxy도 여전히 trusted-proxy auth를 충족하지 않습니다. trusted proxy는 구성된 non-loopback source여야 합니다.

  </Accordion>

  <Accordion title="이제 왜 localhost에서도 토큰이 필요한가요?">
    OpenClaw는 loopback을 포함해 기본적으로 gateway auth를 강제합니다. 일반적인 기본 경로에서는 이것이 토큰 auth를 의미합니다. 명시적 auth 경로가 구성되지 않으면 gateway 시작 시 토큰 모드로 해석되고 토큰이 자동 생성되어 `gateway.auth.token`에 저장되므로, **로컬 WS 클라이언트도 인증해야 합니다**. 이는 다른 로컬 프로세스가 Gateway를 호출하는 것을 막습니다.

    다른 auth 경로를 선호한다면 비밀번호 모드(또는 non-loopback identity-aware reverse proxy의 경우 `trusted-proxy`)를 명시적으로 선택할 수 있습니다. **정말로** 열린 loopback을 원한다면 config에서 `gateway.auth.mode: "none"`을 명시적으로 설정하세요. Doctor는 언제든 토큰을 생성해 줄 수 있습니다: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="config를 변경한 후 재시작해야 하나요?">
    Gateway는 config를 감시하며 hot-reload를 지원합니다.

    - `gateway.reload.mode: "hybrid"`(기본값): 안전한 변경은 hot-apply, 중요한 변경은 재시작
    - `hot`, `restart`, `off`도 지원

  </Accordion>

  <Accordion title="재미있는 CLI 태그라인을 끄려면 어떻게 하나요?">
    config에서 `cli.banner.taglineMode`를 설정하세요.

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: 태그라인 텍스트는 숨기지만 배너 제목/버전 줄은 유지합니다.
    - `default`: 항상 `All your chats, one OpenClaw.`를 사용합니다.
    - `random`: 회전하는 재미있는/계절성 태그라인(기본 동작)
    - 배너 자체를 없애고 싶다면 env `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

  </Accordion>

  <Accordion title="웹 검색(및 웹 가져오기)은 어떻게 활성화하나요?">
    `web_fetch`는 API 키 없이 동작합니다. `web_search`는 선택한
    provider에 따라 달라집니다.

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, Tavily 같은 API 기반 provider는 일반적인 API 키 설정이 필요합니다.
    - Ollama Web Search는 키가 필요 없지만, 구성된 Ollama 호스트를 사용하며 `ollama signin`이 필요합니다.
    - DuckDuckGo는 키가 필요 없지만 비공식 HTML 기반 통합입니다.
    - SearXNG는 키 불필요/셀프 호스팅 방식입니다. `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`을 구성하세요.

    **권장:** `openclaw configure --section web`를 실행하고 provider를 선택하세요.
    환경 변수 대안:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, 또는 `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    provider별 웹 검색 config는 이제 `plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다.
    레거시 `tools.web.search.*` provider 경로도 호환성을 위해 일시적으로 계속 로드되지만, 새 config에서는 사용하지 않아야 합니다.
    Firecrawl 웹 가져오기 폴백 config는 `plugins.entries.firecrawl.config.webFetch.*` 아래에 있습니다.

    참고:

    - 허용 목록을 사용한다면 `web_search`/`web_fetch`/`x_search` 또는 `group:web`를 추가하세요.
    - `web_fetch`는 기본적으로 활성화됩니다(명시적으로 비활성화하지 않는 한).
    - `tools.web.fetch.provider`를 생략하면 OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 가져오기 폴백 provider를 자동 감지합니다. 현재 번들 provider는 Firecrawl입니다.
    - 데몬은 `~/.openclaw/.env`(또는 서비스 환경)의 env var를 읽습니다.

    문서: [Web tools](/ko/tools/web).

  </Accordion>

  <Accordion title="config.apply가 내 config를 지워 버렸습니다. 어떻게 복구하고 방지하나요?">
    `config.apply`는 **전체 config**를 교체합니다. 부분 객체를 보내면 나머지는
    모두 제거됩니다.

    현재 OpenClaw는 많은 우발적 덮어쓰기를 방지합니다.

    - OpenClaw 소유 config 쓰기는 쓰기 전에 변경 후 전체 config를 검증합니다.
    - 잘못되었거나 파괴적인 OpenClaw 소유 쓰기는 거부되며 `openclaw.json.rejected.*`로 저장됩니다.
    - 직접 편집으로 시작 또는 hot reload가 깨지면 Gateway는 마지막 정상 config를 복원하고 거부된 파일을 `openclaw.json.clobbered.*`로 저장합니다.
    - 복구 후 메인 에이전트는 부팅 경고를 받아 같은 잘못된 config를 다시 무작정 쓰지 않게 됩니다.

    복구:

    - `openclaw logs --follow`에서 `Config auto-restored from last-known-good`, `Config write rejected:`, 또는 `config reload restored last-known-good config`를 확인하세요.
    - 활성 config 옆의 최신 `openclaw.json.clobbered.*` 또는 `openclaw.json.rejected.*`를 확인하세요.
    - 복원된 활성 config가 잘 동작하면 유지하고, 의도한 키만 `openclaw config set` 또는 `config.patch`로 다시 복사하세요.
    - `openclaw config validate`와 `openclaw doctor`를 실행하세요.
    - 마지막 정상본이나 거부된 payload가 없다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행한 뒤 채널/모델을 재구성하세요.
    - 예상치 못한 일이었다면 버그를 신고하고 마지막으로 알고 있던 config 또는 백업을 포함하세요.
    - 로컬 코딩 에이전트는 로그나 기록에서 동작하는 config를 복원할 수 있는 경우가 많습니다.

    방지:

    - 작은 변경에는 `openclaw config set`을 사용하세요.
    - 대화형 편집에는 `openclaw configure`를 사용하세요.
    - 정확한 경로나 필드 형태가 확실하지 않다면 먼저 `config.schema.lookup`를 사용하세요. 얕은 schema 노드와 즉시 하위 항목 요약을 반환해 더 깊이 탐색할 수 있습니다.
    - 부분 RPC 편집에는 `config.patch`를 사용하고, `config.apply`는 전체 config 교체에만 사용하세요.
    - 에이전트 실행에서 owner 전용 `gateway` 도구를 사용하더라도 `tools.exec.ask` / `tools.exec.security`에 대한 쓰기는 여전히 거부됩니다(같은 보호된 exec 경로로 정규화되는 레거시 `tools.bash.*` 별칭 포함).

    문서: [Config](/cli/config), [Configure](/cli/configure), [Gateway troubleshooting](/ko/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="여러 디바이스에 특화된 워커를 두고 중앙 Gateway를 실행하려면 어떻게 하나요?">
    일반적인 패턴은 **하나의 Gateway**(예: Raspberry Pi) + **Nodes** + **에이전트**입니다.

    - **Gateway(중앙):** 채널(Signal/WhatsApp), 라우팅, 세션을 소유
    - **Nodes(디바이스):** Mac/iOS/Android가 주변 장치처럼 연결되어 로컬 도구(`system.run`, `canvas`, `camera`)를 노출
    - **에이전트(워커):** 특수 역할(예: "Hetzner ops", "Personal data")을 위한 별도 두뇌/workspace
    - **서브 에이전트:** 병렬 처리가 필요할 때 메인 에이전트에서 백그라운드 작업 생성
    - **TUI:** Gateway에 연결하고 에이전트/세션 전환

    문서: [Nodes](/ko/nodes), [Remote access](/ko/gateway/remote), [Multi-Agent Routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw 브라우저를 headless로 실행할 수 있나요?">
    예. config 옵션입니다.

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    기본값은 `false`(headful)입니다. 일부 사이트에서는 headless가 anti-bot 검사를 더 자주 유발할 수 있습니다. [Browser](/ko/tools/browser)를 참고하세요.

    Headless는 **같은 Chromium 엔진**을 사용하며 대부분의 자동화(폼, 클릭, 스크래핑, 로그인)에 동작합니다. 주요 차이점:

    - 보이는 브라우저 창이 없음(시각 자료가 필요하면 스크린샷 사용)
    - 일부 사이트는 headless 모드의 자동화에 더 엄격함(CAPTCHA, anti-bot)
      예를 들어 X/Twitter는 headless 세션을 자주 차단합니다.

  </Accordion>

  <Accordion title="브라우저 제어에 Brave를 사용하려면 어떻게 하나요?">
    `browser.executablePath`를 Brave 바이너리(또는 Chromium 기반 브라우저)로 설정하고 Gateway를 재시작하세요.
    전체 config 예시는 [Browser](/ko/tools/browser#use-brave-or-another-chromium-based-browser)를 참고하세요.
  </Accordion>
</AccordionGroup>

## 원격 gateway와 Node

<AccordionGroup>
  <Accordion title="Telegram, gateway, Node 사이에서 명령은 어떻게 전파되나요?">
    Telegram 메시지는 **gateway**가 처리합니다. gateway가 에이전트를 실행한 뒤,
    Node 도구가 필요할 때만 **Gateway WebSocket**을 통해 Node를 호출합니다.

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node는 수신 provider 트래픽을 보지 못하고, node RPC 호출만 받습니다.

  </Accordion>

  <Accordion title="Gateway가 원격에 호스팅되어 있으면 내 에이전트가 내 컴퓨터에 어떻게 접근하나요?">
    짧은 답: **컴퓨터를 Node로 페어링하세요**. Gateway는 다른 곳에서 실행되지만
    Gateway WebSocket을 통해 로컬 머신의 `node.*` 도구(화면, 카메라, 시스템)를
    호출할 수 있습니다.

    일반적인 설정:

    1. 항상 켜져 있는 호스트(VPS/홈 서버)에서 Gateway 실행
    2. Gateway 호스트와 컴퓨터를 같은 tailnet에 두기
    3. Gateway WS에 접근 가능한지 확인(tailnet bind 또는 SSH 터널)
    4. 로컬에서 macOS 앱을 열고 **Remote over SSH** 모드(또는 직접 tailnet)로 연결해
       Node로 등록되게 하기
    5. Gateway에서 Node 승인:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    별도의 TCP 브리지는 필요하지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다.

    보안 참고: macOS Node를 페어링하면 해당 머신에서 `system.run`이 가능해집니다. 신뢰하는 디바이스만
    페어링하고 [Security](/ko/gateway/security)를 검토하세요.

    문서: [Nodes](/ko/nodes), [Gateway protocol](/ko/gateway/protocol), [macOS remote mode](/ko/platforms/mac/remote), [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="Tailscale은 연결되었지만 응답이 없습니다. 이제 무엇을 해야 하나요?">
    기본 사항을 확인하세요.

    - Gateway 실행 여부: `openclaw gateway status`
    - Gateway 상태: `openclaw status`
    - 채널 상태: `openclaw channels status`

    그런 다음 auth와 라우팅을 확인하세요.

    - Tailscale Serve를 사용한다면 `gateway.auth.allowTailscale`이 올바르게 설정되어 있는지 확인하세요.
    - SSH 터널로 연결한다면 로컬 터널이 살아 있고 올바른 포트를 가리키는지 확인하세요.
    - 허용 목록(DM 또는 그룹)에 본인 계정이 포함되어 있는지 확인하세요.

    문서: [Tailscale](/ko/gateway/tailscale), [Remote access](/ko/gateway/remote), [Channels](/ko/channels).

  </Accordion>

  <Accordion title="두 개의 OpenClaw 인스턴스가 서로 대화할 수 있나요(로컬 + VPS)?">
    예. 기본 제공 "봇 대 봇" 브리지는 없지만, 몇 가지
    신뢰할 수 있는 방식으로 연결할 수 있습니다.

    **가장 단순한 방법:** 두 봇이 모두 접근할 수 있는 일반 채팅 채널(Telegram/Slack/WhatsApp)을 사용하세요.
    Bot A가 Bot B에게 메시지를 보내고, Bot B는 평소처럼 응답하게 하세요.

    **CLI 브리지(범용):** 다른 Gateway를 호출하는 스크립트를 실행해
    `openclaw agent --message ... --deliver`를 사용하고, 다른 봇이 듣고 있는 채팅을
    대상으로 지정하세요. 한 봇이 원격 VPS에 있다면
    SSH/Tailscale을 통해 그 원격 Gateway를 향하도록 CLI를 설정하세요([Remote access](/ko/gateway/remote) 참고).

    예시 패턴(대상 Gateway에 접근할 수 있는 머신에서 실행):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    팁: 두 봇이 끝없이 루프 돌지 않도록 가드레일을 추가하세요(멘션 전용, 채널
    허용 목록, 또는 "봇 메시지에는 응답하지 않기" 규칙).

    문서: [Remote access](/ko/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/ko/tools/agent-send).

  </Accordion>

  <Accordion title="여러 에이전트를 위해 별도의 VPS가 필요한가요?">
    아니요. 하나의 Gateway가 여러 에이전트를 호스팅할 수 있으며, 각 에이전트는 자체 workspace, 모델 기본값,
    라우팅을 가질 수 있습니다. 이것이 일반적인 설정이며, 에이전트마다
    VPS 하나씩 운영하는 것보다 훨씬 저렴하고 단순합니다.

    별도의 VPS는 강한 격리(보안 경계)나
    공유하고 싶지 않은 매우 다른 config가 필요할 때만 사용하세요. 그렇지 않으면 Gateway 하나를 유지하고
    여러 에이전트나 서브 에이전트를 사용하세요.

  </Accordion>

  <Accordion title="VPS에서 SSH를 사용하는 대신 개인 노트북에 Node를 두는 이점이 있나요?">
    예. Node는 원격 Gateway에서 노트북에 접근하는 일급 방식이며,
    단순한 셸 접근 이상을 제공합니다. Gateway는 macOS/Linux(Windows는 WSL2 경유)에서 실행되며
    가볍기 때문에(작은 VPS나 Raspberry Pi급 장비면 충분하고, 4 GB RAM이면 넉넉함),
    항상 켜진 호스트 + 노트북을 Node로 두는 구성이 일반적입니다.

    - **인바운드 SSH가 필요 없습니다.** Node는 Gateway WebSocket으로 아웃바운드 연결하고 디바이스 페어링을 사용합니다.
    - **더 안전한 실행 제어.** `system.run`은 해당 노트북의 Node 허용 목록/승인으로 제어됩니다.
    - **더 많은 디바이스 도구.** Node는 `system.run` 외에도 `canvas`, `camera`, `screen`을 제공합니다.
    - **로컬 브라우저 자동화.** Gateway는 VPS에 두고, 노트북의 Node 호스트를 통해 로컬 Chrome을 실행하거나 Chrome MCP를 통해 호스트의 로컬 Chrome에 연결할 수 있습니다.

    SSH는 임시 셸 접근에는 괜찮지만, 지속적인 에이전트 워크플로와
    디바이스 자동화에는 Node가 더 단순합니다.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes), [Browser](/ko/tools/browser).

  </Accordion>

  <Accordion title="Node가 gateway 서비스를 실행하나요?">
    아니요. 의도적으로 격리된 profile을 여러 개 실행하는 경우가 아니라면(참조: [Multiple gateways](/ko/gateway/multiple-gateways)), 호스트당 **gateway는 하나만** 실행해야 합니다. Node는 gateway에 연결되는 주변 장치입니다
    (iOS/Android Node, 또는 메뉴바 앱의 macOS "node mode"). headless Node
    호스트 및 CLI 제어는 [Node host CLI](/cli/node)를 참고하세요.

    `gateway`, `discovery`, `canvasHost` 변경에는 전체 재시작이 필요합니다.

  </Accordion>

  <Accordion title="config를 적용하는 API / RPC 방식이 있나요?">
    예.

    - `config.schema.lookup`: 쓰기 전에 하나의 config 하위 트리를 얕은 schema 노드, 일치하는 UI 힌트, 즉시 하위 항목 요약과 함께 검사
    - `config.get`: 현재 스냅샷 + 해시 가져오기
    - `config.patch`: 안전한 부분 업데이트(대부분의 RPC 편집에서 권장); 가능하면 hot-reload, 필요하면 재시작
    - `config.apply`: 전체 config를 검증 후 교체; 가능하면 hot-reload, 필요하면 재시작
    - owner 전용 `gateway` 런타임 도구는 여전히 `tools.exec.ask` / `tools.exec.security` 재작성을 거부합니다. 레거시 `tools.bash.*` 별칭은 같은 보호된 exec 경로로 정규화됩니다

  </Accordion>

  <Accordion title="첫 설치를 위한 최소한의 합리적인 config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    이렇게 하면 workspace를 설정하고 누가 봇을 트리거할 수 있는지 제한합니다.

  </Accordion>

  <Accordion title="VPS에 Tailscale을 설정하고 Mac에서 연결하려면 어떻게 하나요?">
    최소 단계:

    1. **VPS에 설치 + 로그인**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac에 설치 + 로그인**
       - Tailscale 앱을 사용해 같은 tailnet에 로그인합니다.
    3. **MagicDNS 활성화(권장)**
       - Tailscale 관리자 콘솔에서 MagicDNS를 활성화해 VPS에 안정적인 이름을 부여합니다.
    4. **tailnet 호스트명 사용**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH 없이 Control UI를 사용하려면 VPS에서 Tailscale Serve를 사용하세요.

    ```bash
    openclaw gateway --tailscale serve
    ```

    이렇게 하면 gateway는 loopback에 바인딩된 상태로 유지되고 HTTPS가 Tailscale을 통해 노출됩니다. [Tailscale](/ko/gateway/tailscale)을 참고하세요.

  </Accordion>

  <Accordion title="Mac Node를 원격 Gateway(Tailscale Serve)에 연결하려면 어떻게 하나요?">
    Serve는 **Gateway Control UI + WS**를 노출합니다. Node는 같은 Gateway WS 엔드포인트를 통해 연결합니다.

    권장 설정:

    1. **VPS와 Mac이 같은 tailnet에 있는지 확인**합니다.
    2. **macOS 앱을 Remote mode로 사용**합니다(SSH 대상은 tailnet 호스트명일 수 있음).
       앱이 Gateway 포트를 터널링하고 Node로 연결합니다.
    3. gateway에서 **Node 승인**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    문서: [Gateway protocol](/ko/gateway/protocol), [Discovery](/ko/gateway/discovery), [macOS remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="두 번째 노트북에 설치해야 하나요, 아니면 Node만 추가하면 되나요?">
    두 번째 노트북에서 **로컬 도구**(screen/camera/exec)만 필요하다면
    **Node**로 추가하세요. 그러면 Gateway를 하나로 유지할 수 있고 중복 config를 피할 수 있습니다. 로컬 Node 도구는
    현재 macOS 전용이지만, 다른 OS로도 확장할 계획입니다.

    **강한 격리** 또는 완전히 분리된 두 개의 봇이 필요한 경우에만 두 번째 Gateway를 설치하세요.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## env var와 .env 로딩

<AccordionGroup>
  <Accordion title="OpenClaw는 환경 변수를 어떻게 로드하나요?">
    OpenClaw는 부모 프로세스(셸, launchd/systemd, CI 등)의 env var를 읽고, 추가로 다음도 로드합니다.

    - 현재 작업 디렉터리의 `.env`
    - `~/.openclaw/.env`(즉 `$OPENCLAW_STATE_DIR/.env`)의 전역 폴백 `.env`

    두 `.env` 파일 모두 기존 env var를 덮어쓰지 않습니다.

    config에 인라인 env var를 정의할 수도 있습니다(프로세스 env에 없을 때만 적용).

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    전체 우선순위와 출처는 [/environment](/ko/help/environment)를 참고하세요.

  </Accordion>

  <Accordion title="서비스를 통해 Gateway를 시작했더니 env var가 사라졌습니다. 어떻게 해야 하나요?">
    일반적인 해결책 두 가지:

    1. 누락된 키를 `~/.openclaw/.env`에 넣어 서비스가 셸 env를 상속하지 않아도 읽히게 합니다.
    2. 셸 가져오기를 활성화합니다(선택적 편의 기능).

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    이렇게 하면 로그인 셸을 실행하고 예상된 누락 키만 가져옵니다(덮어쓰지는 않음). 대응 env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='`COPILOT_GITHUB_TOKEN`을 설정했는데, models status에 "Shell env: off."가 표시됩니다. 왜 그런가요?'>
    `openclaw models status`는 **shell env import**가 활성화되어 있는지를 보고합니다. "Shell env: off"는
    env var가 없다는 뜻이 아니라, OpenClaw가
    로그인 셸을 자동으로 로드하지 않는다는 뜻입니다.

    Gateway가 서비스(launchd/systemd)로 실행 중이면 셸
    환경을 상속하지 않습니다. 다음 중 하나로 해결하세요.

    1. 토큰을 `~/.openclaw/.env`에 넣습니다.

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 또는 셸 가져오기를 활성화합니다(`env.shellEnv.enabled: true`).
    3. 또는 config의 `env` 블록에 추가합니다(없을 때만 적용).

    그런 다음 gateway를 재시작하고 다시 확인하세요.

    ```bash
    openclaw models status
    ```

    Copilot 토큰은 `COPILOT_GITHUB_TOKEN`에서 읽습니다(`GH_TOKEN` / `GITHUB_TOKEN`도 가능).
    [/concepts/model-providers](/ko/concepts/model-providers) 및 [/environment](/ko/help/environment)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 세션과 여러 채팅

<AccordionGroup>
  <Accordion title="새 대화를 시작하려면 어떻게 하나요?">
    `/new` 또는 `/reset`을 독립 메시지로 보내세요. [Session management](/ko/concepts/session)를 참고하세요.
  </Accordion>

  <Accordion title="/new를 전혀 보내지 않으면 세션이 자동으로 초기화되나요?">
    세션은 `session.idleMinutes` 이후 만료될 수 있지만, 이는 **기본적으로 비활성화**되어 있습니다(기본값 **0**).
    유휴 만료를 활성화하려면 양수 값으로 설정하세요. 활성화되면 유휴 기간 이후의 **다음**
    메시지가 해당 채팅 키에 대해 새 세션 id를 시작합니다.
    이것은 트랜스크립트를 삭제하지 않고, 새 세션을 시작할 뿐입니다.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw 인스턴스 팀(CEO 하나와 여러 에이전트)을 구성할 방법이 있나요?">
    예. **멀티 에이전트 라우팅**과 **서브 에이전트**를 통해 가능합니다. 하나의 조정
    에이전트와 자체 workspace 및 모델을 가진 여러 워커 에이전트를 만들 수 있습니다.

    다만 이는 **재미있는 실험**으로 보는 것이 가장 좋습니다. 토큰을 많이 사용하고,
    분리된 세션을 가진 하나의 봇을 사용하는 것보다 비효율적인 경우가 많습니다. 우리가
    일반적으로 상정하는 모델은 사용자가 하나의 봇과 대화하되, 병렬 작업을 위해
    서로 다른 세션을 사용하는 방식입니다. 그 봇은 필요할 때 서브 에이전트를 생성할 수도 있습니다.

    문서: [Multi-agent routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="작업 중간에 컨텍스트가 왜 잘렸나요? 어떻게 방지하나요?">
    세션 컨텍스트는 모델 창 크기에 제한됩니다. 긴 채팅, 큰 도구 출력, 많은
    파일은 Compaction이나 잘림을 유발할 수 있습니다.

    도움이 되는 방법:

    - 봇에게 현재 상태를 요약해 파일에 쓰라고 요청하세요.
    - 긴 작업 전에 `/compact`를 사용하고, 주제를 바꿀 때는 `/new`를 사용하세요.
    - 중요한 컨텍스트는 workspace에 두고 봇에게 다시 읽어 오라고 요청하세요.
    - 긴 작업이나 병렬 작업에는 서브 에이전트를 사용해 메인 채팅을 더 작게 유지하세요.
    - 이런 일이 자주 발생하면 더 큰 컨텍스트 창을 가진 모델을 선택하세요.

  </Accordion>

  <Accordion title="설치는 유지한 채 OpenClaw를 완전히 초기화하려면 어떻게 하나요?">
    reset 명령을 사용하세요.

    ```bash
    openclaw reset
    ```

    비대화형 전체 초기화:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    그런 다음 설정을 다시 실행하세요.

    ```bash
    openclaw onboard --install-daemon
    ```

    참고:

    - Onboarding은 기존 config를 감지하면 **Reset**도 제안합니다. [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.
    - profile(`--profile` / `OPENCLAW_PROFILE`)을 사용했다면 각 상태 디렉터리를 초기화하세요(기본값은 `~/.openclaw-<profile>`).
    - 개발용 reset: `openclaw gateway --dev --reset`(개발 전용; 개발용 config + credentials + sessions + workspace를 지움)

  </Accordion>

  <Accordion title='“context too large” 오류가 발생합니다. 어떻게 reset 또는 compact하나요?'>
    다음 중 하나를 사용하세요.

    - **Compact**(대화는 유지하되 이전 턴을 요약함):

      ```
      /compact
      ```

      또는 요약을 안내하려면 `/compact <instructions>`.

    - **Reset**(같은 채팅 키에 대해 새 세션 ID 생성):

      ```
      /new
      /reset
      ```

    계속 발생한다면:

    - 오래된 도구 출력을 잘라내도록 **세션 pruning**(`agents.defaults.contextPruning`)을 활성화하거나 조정하세요.
    - 더 큰 컨텍스트 창을 가진 모델을 사용하세요.

    문서: [Compaction](/ko/concepts/compaction), [Session pruning](/ko/concepts/session-pruning), [Session management](/ko/concepts/session).

  </Accordion>

  <Accordion title='왜 "LLM request rejected: messages.content.tool_use.input field required"가 표시되나요?'>
    이것은 provider 검증 오류입니다. 모델이 필수 `input` 없이
    `tool_use` 블록을 내보냈다는 뜻입니다. 보통 세션 기록이 오래되었거나 손상되었음을 의미하며(긴 thread
    또는 도구/schema 변경 후에 자주 발생함) 그렇습니다.

    해결 방법: `/new`(독립 메시지)로 새 세션을 시작하세요.

  </Accordion>

  <Accordion title="왜 30분마다 Heartbeat 메시지를 받나요?">
    Heartbeat는 기본적으로 **30분**마다 실행됩니다(OAuth auth 사용 시 **1시간**).
    이를 조정하거나 비활성화하세요.

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 또는 비활성화하려면 "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md`가 존재하지만 사실상 비어 있으면(빈 줄과 `# Heading` 같은 markdown
    헤더만 있는 경우), OpenClaw는 API 호출을 절약하기 위해 heartbeat 실행을 건너뜁니다.
    파일이 없으면 heartbeat는 여전히 실행되며 모델이 무엇을 할지 결정합니다.

    에이전트별 재정의는 `agents.list[].heartbeat`를 사용합니다. 문서: [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp 그룹에 "봇 계정"을 추가해야 하나요?'>
    아니요. OpenClaw는 **사용자 자신의 계정**에서 실행되므로, 사용자가 그룹에 있으면 OpenClaw도 그 그룹을 볼 수 있습니다.
    기본적으로는 발신자를 허용하기 전까지 그룹 응답이 차단됩니다(`groupPolicy: "allowlist"`).

    그룹 응답을 **사용자 자신만** 트리거할 수 있게 하려면:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="WhatsApp 그룹의 JID는 어떻게 얻나요?">
    방법 1(가장 빠름): 로그를 tail로 보면서 그룹에 테스트 메시지를 보내세요.

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us`로 끝나는 `chatId`(또는 `from`)를 찾으세요. 예:
    `1234567890-1234567890@g.us`.

    방법 2(이미 구성/허용 목록 등록이 되어 있다면): config에서 그룹을 나열하세요.

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw가 그룹에서 응답하지 않는 이유는 무엇인가요?">
    흔한 원인 두 가지:

    - 멘션 게이팅이 켜져 있습니다(기본값). 봇을 @멘션해야 하거나 `mentionPatterns`와 일치해야 합니다.
    - `channels.whatsapp.groups`를 `"*"` 없이 구성했고, 해당 그룹이 허용 목록에 없습니다.

    [Groups](/ko/channels/groups) 및 [Group messages](/ko/channels/group-messages)를 참고하세요.

  </Accordion>

  <Accordion title="그룹/thread는 DM과 컨텍스트를 공유하나요?">
    직접 채팅은 기본적으로 메인 세션으로 통합됩니다. 그룹/채널은 자체 세션 키를 가지며, Telegram topic / Discord thread는 별도 세션입니다. [Groups](/ko/channels/groups) 및 [Group messages](/ko/channels/group-messages)를 참고하세요.
  </Accordion>

  <Accordion title="workspace와 에이전트는 몇 개까지 만들 수 있나요?">
    하드 제한은 없습니다. 수십 개(심지어 수백 개)도 괜찮지만, 다음은 주의하세요.

    - **디스크 증가:** sessions + 트랜스크립트는 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.
    - **토큰 비용:** 에이전트가 많을수록 동시 모델 사용도 늘어납니다.
    - **운영 오버헤드:** 에이전트별 auth profile, workspace, 채널 라우팅

    팁:

    - 에이전트당 **활성** workspace를 하나 유지하세요(`agents.defaults.workspace`).
    - 디스크가 커지면 오래된 session(JSONL 또는 store 항목)을 정리하세요.
    - `openclaw doctor`로 떠돌이 workspace와 profile 불일치를 찾아내세요.

  </Accordion>

  <Accordion title="여러 봇이나 채팅을 동시에 실행할 수 있나요(Slack)? 어떻게 설정해야 하나요?">
    예. **멀티 에이전트 라우팅**을 사용해 여러 개의 격리된 에이전트를 실행하고,
    채널/계정/peer별로 수신 메시지를 라우팅하세요. Slack은 채널로 지원되며 특정 에이전트에 바인딩할 수 있습니다.

    브라우저 액세스는 강력하지만 "사람이 할 수 있는 모든 것"을 할 수 있는 것은 아닙니다. anti-bot, CAPTCHA, MFA는
    여전히 자동화를 막을 수 있습니다. 가장 안정적인 브라우저 제어를 원한다면 호스트에서 로컬 Chrome MCP를 사용하거나,
    실제 브라우저가 실행되는 머신에서 CDP를 사용하세요.

    모범 설정:

    - 항상 켜진 Gateway 호스트(VPS/Mac mini)
    - 역할별 에이전트 하나씩(바인딩)
    - 해당 에이전트에 바인딩된 Slack 채널
    - 필요 시 Chrome MCP 또는 Node를 통한 로컬 브라우저

    문서: [Multi-Agent Routing](/ko/concepts/multi-agent), [Slack](/ko/channels/slack),
    [Browser](/ko/tools/browser), [Nodes](/ko/nodes).

  </Accordion>
</AccordionGroup>

## 모델: 기본값, 선택, 별칭, 전환

<AccordionGroup>
  <Accordion title='“기본 모델”이란 무엇인가요?'>
    OpenClaw의 기본 모델은 다음에 설정한 값입니다.

    ```
    agents.defaults.model.primary
    ```

    모델은 `provider/model` 형식으로 참조합니다(예: `openai/gpt-5.4`). provider를 생략하면 OpenClaw는 먼저 별칭을 시도하고, 그다음 정확한 모델 id에 대한 고유하게 구성된 provider 일치를 찾은 뒤, 마지막으로 더 이상 권장되지 않는 호환 경로로 구성된 기본 provider에 폴백합니다. 해당 provider가 더 이상 구성된 기본 모델을 노출하지 않으면, 제거된 provider의 오래된 기본값을 그대로 드러내는 대신 처음 구성된 provider/model로 폴백합니다. 그래도 **명시적으로** `provider/model`을 설정하는 것이 좋습니다.

  </Accordion>

  <Accordion title="어떤 모델을 권장하나요?">
    **권장 기본값:** provider 스택에서 사용 가능한 가장 강력한 최신 세대 모델을 사용하세요.
    **도구 사용 가능 또는 신뢰할 수 없는 입력을 받는 에이전트:** 비용보다 모델 성능을 우선하세요.
    **일상적/낮은 위험도의 채팅:** 더 저렴한 fallback model을 사용하고 에이전트 역할별로 라우팅하세요.

    MiniMax 전용 문서: [MiniMax](/ko/providers/minimax) 및
    [Local models](/ko/gateway/local-models).

    경험칙: 중요한 작업에는 **감당 가능한 한 최고의 모델**을 사용하고, 일상적인 채팅이나 요약에는 더 저렴한
    모델을 사용하세요. 에이전트별로 모델을 라우팅하고 서브 에이전트를 사용해
    긴 작업을 병렬화할 수 있습니다(각 서브 에이전트는 토큰을 소비함). [Models](/ko/concepts/models) 및
    [Sub-agents](/ko/tools/subagents)를 참고하세요.

    강한 경고: 더 약하거나 과도하게 양자화된 모델은 프롬프트
    인젝션과 안전하지 않은 동작에 더 취약합니다. [Security](/ko/gateway/security)를 참고하세요.

    추가 설명: [Models](/ko/concepts/models).

  </Accordion>

  <Accordion title="config를 지우지 않고 모델을 전환하려면 어떻게 하나요?">
    **모델 명령**을 사용하거나 **모델** 필드만 편집하세요. 전체 config 교체는 피하세요.

    안전한 방법:

    - 채팅에서 `/model` 사용(빠름, 세션별)
    - `openclaw models set ...`(모델 config만 업데이트)
    - `openclaw configure --section model`(대화형)
    - `~/.openclaw/openclaw.json`의 `agents.defaults.model` 편집

    전체 config를 교체할 의도가 아니라면 부분 객체로 `config.apply`를 사용하지 마세요.
    RPC 편집의 경우 먼저 `config.schema.lookup`로 검사하고 `config.patch`를 선호하세요. lookup payload는 정규화된 경로, 얕은 schema 문서/제약 조건, 즉시 하위 항목 요약을 제공합니다.
    부분 업데이트에 사용하세요.
    config를 덮어썼다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행해 복구하세요.

    문서: [Models](/ko/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="셀프 호스팅 모델(llama.cpp, vLLM, Ollama)을 사용할 수 있나요?">
    예. 로컬 모델에는 Ollama가 가장 쉬운 경로입니다.

    가장 빠른 설정:

    1. `https://ollama.com/download`에서 Ollama 설치
    2. `ollama pull gemma4` 같은 로컬 모델 가져오기
    3. 클라우드 모델도 원한다면 `ollama signin` 실행
    4. `openclaw onboard`를 실행하고 `Ollama` 선택
    5. `Local` 또는 `Cloud + Local` 선택

    참고:

    - `Cloud + Local`은 클라우드 모델과 로컬 Ollama 모델을 함께 제공합니다
    - `kimi-k2.5:cloud` 같은 클라우드 모델은 로컬에서 pull할 필요가 없습니다
    - 수동 전환에는 `openclaw models list`와 `openclaw models set ollama/<model>` 사용

    보안 참고: 더 작거나 강하게 양자화된 모델은 프롬프트
    인젝션에 더 취약합니다. 도구를 사용할 수 있는 봇에는 **큰 모델**을 강력히 권장합니다.
    그래도 작은 모델을 쓰고 싶다면 샌드박싱과 엄격한 도구 허용 목록을 활성화하세요.

    문서: [Ollama](/ko/providers/ollama), [Local models](/ko/gateway/local-models),
    [Model providers](/ko/concepts/model-providers), [Security](/ko/gateway/security),
    [Sandboxing](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd, Krill은 어떤 모델을 사용하나요?">
    - 이 배포들은 서로 다를 수 있고 시간에 따라 바뀔 수 있으며, 고정된 provider 권장 사항은 없습니다.
    - 각 gateway의 현재 런타임 설정은 `openclaw models status`로 확인하세요.
    - 보안에 민감하거나 도구를 쓰는 에이전트에는 사용 가능한 가장 강력한 최신 세대 모델을 사용하세요.
  </Accordion>

  <Accordion title="재시작 없이 즉시 모델을 전환하려면 어떻게 하나요?">
    독립 메시지로 `/model` 명령을 사용하세요.

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    이것들은 기본 제공 별칭입니다. 사용자 지정 별칭은 `agents.defaults.models`를 통해 추가할 수 있습니다.

    사용 가능한 모델은 `/model`, `/model list`, 또는 `/model status`로 확인할 수 있습니다.

    `/model`(및 `/model list`)은 간결한 번호 선택기를 표시합니다. 번호로 선택하세요.

    ```
    /model 3
    ```

    provider에 대해 특정 auth profile을 강제로 지정할 수도 있습니다(세션별).

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    팁: `/model status`는 어떤 에이전트가 활성인지, 어떤 `auth-profiles.json` 파일이 사용 중인지, 다음에 어떤 auth profile이 시도될지를 보여줍니다.
    또한 가능한 경우 구성된 provider endpoint(`baseUrl`)와 API 모드(`api`)도 보여줍니다.

    **`@profile`로 설정한 profile 고정은 어떻게 해제하나요?**

    `@profile` 접미사 없이 `/model`을 다시 실행하세요.

    ```
    /model anthropic/claude-opus-4-6
    ```

    기본값으로 돌아가고 싶다면 `/model`에서 선택하거나(`/model <default provider/model>` 전송), 
    `/model status`로 어떤 auth profile이 활성인지 확인하세요.

  </Accordion>

  <Accordion title="일상 작업에는 GPT 5.2를, 코딩에는 Codex 5.3을 사용할 수 있나요?">
    예. 하나를 기본값으로 설정하고 필요할 때 전환하세요.

    - **빠른 전환(세션별):** 일상 작업에는 `/model gpt-5.4`, Codex OAuth를 사용하는 코딩에는 `/model openai-codex/gpt-5.4`
    - **기본값 + 전환:** `agents.defaults.model.primary`를 `openai/gpt-5.4`로 설정한 뒤, 코딩할 때 `openai-codex/gpt-5.4`로 전환(또는 반대로)
    - **서브 에이전트:** 코딩 작업을 다른 기본 모델을 가진 서브 에이전트로 라우팅

    [Models](/ko/concepts/models) 및 [Slash commands](/ko/tools/slash-commands)를 참고하세요.

  </Accordion>

  <Accordion title="GPT 5.4에서 fast mode는 어떻게 구성하나요?">
    세션 토글 또는 config 기본값을 사용할 수 있습니다.

    - **세션별:** 세션이 `openai/gpt-5.4` 또는 `openai-codex/gpt-5.4`를 사용할 때 `/fast on` 전송
    - **모델별 기본값:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode`를 `true`로 설정
    - **Codex OAuth도 포함:** `openai-codex/gpt-5.4`도 사용한다면 같은 플래그를 설정

    예시:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI에서 fast mode는 지원되는 기본 Responses 요청에서 `service_tier = "priority"`로 매핑됩니다. 세션의 `/fast` 재정의가 config 기본값보다 우선합니다.

    [Thinking and fast mode](/ko/tools/thinking) 및 [OpenAI fast mode](/ko/providers/openai#openai-fast-mode)를 참고하세요.

  </Accordion>

  <Accordion title='왜 "Model ... is not allowed"가 표시되고 응답이 없나요?'>
    `agents.defaults.models`가 설정되어 있으면 `/model`과 모든
    세션 재정의에 대한 **허용 목록**이 됩니다. 그 목록에 없는 모델을 선택하면 다음이 반환됩니다.

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    이 오류는 일반 응답 **대신** 반환됩니다. 해결 방법: 해당 모델을
    `agents.defaults.models`에 추가하거나, 허용 목록을 제거하거나, `/model list`에서 모델을 선택하세요.

  </Accordion>

  <Accordion title='왜 "Unknown model: minimax/MiniMax-M2.7"가 표시되나요?'>
    이는 **provider가 구성되지 않았기 때문**입니다(MiniMax provider config 또는 auth
    profile을 찾지 못함). 그래서 모델을 해석할 수 없습니다.

    해결 확인 목록:

    1. 현재 OpenClaw 릴리스로 업그레이드하거나 소스 `main`에서 실행한 뒤 gateway를 재시작하세요.
    2. MiniMax가 구성되어 있는지(마법사 또는 JSON), 또는 일치하는 provider가 주입될 수 있도록 env/auth profile에 MiniMax auth가
       존재하는지 확인하세요
       (`minimax`용 `MINIMAX_API_KEY`, `minimax-portal`용 `MINIMAX_OAUTH_TOKEN` 또는 저장된 MiniMax
       OAuth).
    3. auth 경로에 맞는 정확한 모델 id(대소문자 구분)를 사용하세요:
       API 키 설정에는 `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`,
       OAuth 설정에는 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. 다음을 실행하세요:

       ```bash
       openclaw models list
       ```

       그리고 목록에서 선택하세요(또는 채팅에서 `/model list`).

    [MiniMax](/ko/providers/minimax) 및 [Models](/ko/concepts/models)를 참고하세요.

  </Accordion>

  <Accordion title="MiniMax를 기본값으로, OpenAI를 복잡한 작업용으로 사용할 수 있나요?">
    예. **MiniMax를 기본값으로** 사용하고 필요할 때 **세션별로** 모델을 전환하세요.
    fallback은 **오류용**이지 “어려운 작업”용이 아니므로 `/model` 또는 별도 에이전트를 사용하세요.

    **옵션 A: 세션별 전환**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    그런 다음:

    ```
    /model gpt
    ```

    **옵션 B: 별도 에이전트**

    - 에이전트 A 기본값: MiniMax
    - 에이전트 B 기본값: OpenAI
    - 에이전트별로 라우팅하거나 `/agent`로 전환

    문서: [Models](/ko/concepts/models), [Multi-Agent Routing](/ko/concepts/multi-agent), [MiniMax](/ko/providers/minimax), [OpenAI](/ko/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt는 기본 제공 단축키인가요?">
    예. OpenClaw는 몇 가지 기본 약칭을 제공합니다(`agents.defaults.models`에 해당 모델이 있을 때만 적용됨).

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    같은 이름의 별칭을 직접 설정하면 사용자 값이 우선합니다.

  </Accordion>

  <Accordion title="모델 단축키(별칭)는 어떻게 정의/재정의하나요?">
    별칭은 `agents.defaults.models.<modelId>.alias`에서 가져옵니다. 예시:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    그러면 `/model sonnet`(또는 지원되는 경우 `/<alias>`)이 해당 모델 ID로 해석됩니다.

  </Accordion>

  <Accordion title="OpenRouter나 Z.AI 같은 다른 provider의 모델은 어떻게 추가하나요?">
    OpenRouter(토큰당 과금, 다양한 모델):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI(GLM 모델):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    provider/model을 참조했는데 필요한 provider 키가 없으면 런타임 auth 오류가 발생합니다(예: `No API key found for provider "zai"`).

    **새 에이전트를 추가한 뒤 No API key found for provider가 표시됨**

    이는 보통 **새 에이전트**의 auth 저장소가 비어 있다는 뜻입니다. auth는 에이전트별이며
    다음 위치에 저장됩니다:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    해결 방법:

    - `openclaw agents add <id>`를 실행하고 마법사 중 auth를 구성합니다.
    - 또는 메인 에이전트의 `agentDir`에 있는 `auth-profiles.json`을 새 에이전트의 `agentDir`로 복사합니다.

    에이전트 간에 `agentDir`를 재사용하지 마세요. auth/session 충돌이 발생합니다.

  </Accordion>
</AccordionGroup>

## 모델 장애 조치와 "All models failed"

<AccordionGroup>
  <Accordion title="장애 조치는 어떻게 동작하나요?">
    장애 조치는 두 단계로 이루어집니다.

    1. 같은 provider 내 **auth profile 순환**
    2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 fallback**

    실패하는 profile에는 쿨다운(지수 백오프)이 적용되므로, provider가 속도 제한되거나 일시적으로 실패해도 OpenClaw는 계속 응답할 수 있습니다.

    속도 제한 버킷에는 단순한 `429` 응답보다 더 많은 항목이 포함됩니다. OpenClaw는
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, 그리고 주기적
    사용량 창 제한(`weekly/monthly limit reached`) 같은 메시지도 장애 조치할 만한
    속도 제한으로 취급합니다.

    일부 과금처럼 보이는 응답은 `402`가 아니며, 일부 HTTP `402`
    응답도 그 일시적 버킷에 남습니다. provider가
    `401` 또는 `403`에서 명시적인 과금 텍스트를 반환하면 OpenClaw는 여전히 이를
    과금 경로에 둘 수 있지만, provider별 텍스트 매처는 해당
    provider 범위 안에만 유지됩니다(예: OpenRouter `Key limit exceeded`). `402`
    메시지가 대신 재시도 가능한 사용량 창이나
    조직/workspace 지출 한도(`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)처럼 보이면 OpenClaw는 이를
    장기 과금 비활성화가 아니라 `rate_limit`으로 취급합니다.

    컨텍스트 오버플로 오류는 다릅니다. 예를 들어
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, 또는 `ollama error: context length
    exceeded` 같은 시그니처는 모델 fallback을 진행하는 대신
    Compaction/재시도 경로에 머무릅니다.

    일반적인 서버 오류 텍스트는 의도적으로 “unknown/error가 들어간 모든 것”보다 더 좁게 잡습니다.
    OpenClaw는 provider 범위의 일시적 패턴들, 예를 들어 Anthropic의 단순한 `An unknown error occurred`, OpenRouter의 단순한
    `Provider returned error`, `Unhandled stop reason:
    error` 같은 stop-reason 오류, 일시적 서버 텍스트가 있는 JSON `api_error` payload
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), 그리고 `ModelNotReadyException` 같은 provider-busy 오류를
    provider 컨텍스트가 일치할 때 장애 조치할 만한 타임아웃/과부하 신호로 취급합니다.
    `LLM request failed with an unknown
    error.` 같은 일반 내부 fallback 텍스트는 보수적으로 다루며, 그 자체만으로는 모델 fallback을 트리거하지 않습니다.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default”는 무엇을 의미하나요?'>
    시스템이 auth profile ID `anthropic:default`를 사용하려 했지만, 예상된 auth 저장소에서 해당 자격 증명을 찾지 못했다는 의미입니다.

    **해결 확인 목록:**

    - **auth profile 위치 확인**(현재 경로 vs 레거시 경로)
      - 현재: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 레거시: `~/.openclaw/agent/*` (`openclaw doctor`로 마이그레이션됨)
    - **env var가 Gateway에 로드되는지 확인**
      - 셸에 `ANTHROPIC_API_KEY`를 설정했지만 Gateway를 systemd/launchd로 실행하면 상속되지 않을 수 있습니다. `~/.openclaw/.env`에 넣거나 `env.shellEnv`를 활성화하세요.
    - **올바른 에이전트를 편집 중인지 확인**
      - 멀티 에이전트 설정에서는 `auth-profiles.json` 파일이 여러 개일 수 있습니다.
    - **모델/auth 상태 기본 점검**
      - `openclaw models status`를 사용해 구성된 모델과 provider 인증 여부를 확인하세요.

    **"No credentials found for profile anthropic" 해결 확인 목록**

    이는 실행이 Anthropic auth profile에 고정되어 있지만, Gateway가
    auth 저장소에서 이를 찾지 못한다는 뜻입니다.

    - **Claude CLI 사용**
      - gateway 호스트에서 `openclaw models auth login --provider anthropic --method cli --set-default`를 실행하세요.
    - **대신 API 키를 사용하려면**
      - **gateway 호스트**의 `~/.openclaw/.env`에 `ANTHROPIC_API_KEY`를 넣으세요.
      - 없는 profile을 강제하는 고정 순서를 해제하세요:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **명령을 gateway 호스트에서 실행 중인지 확인**
      - remote mode에서는 auth profile이 노트북이 아니라 gateway 머신에 있습니다.

  </Accordion>

  <Accordion title="왜 Google Gemini도 시도했다가 실패했나요?">
    모델 config에 Google Gemini가 fallback으로 포함되어 있거나(또는 Gemini 약칭으로 전환했거나) 하면, OpenClaw는 모델 fallback 중 이를 시도합니다. Google 자격 증명을 구성하지 않았다면 `No API key found for provider "google"`가 표시됩니다.

    해결 방법: Google auth를 제공하거나, fallback이 그쪽으로 가지 않도록 `agents.defaults.model.fallbacks` / 별칭에서 Google 모델을 제거하거나 사용하지 마세요.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    원인: 세션 기록에 **서명이 없는 thinking 블록**이 들어 있습니다(중단되었거나 부분 스트리밍된 결과에서 자주 발생).
    Google Antigravity는 thinking 블록에 서명을 요구합니다.

    해결 방법: 이제 OpenClaw는 Google Antigravity Claude용으로 서명 없는 thinking 블록을 제거합니다. 그래도 계속 표시되면 **새 세션**을 시작하거나 해당 에이전트에서 `/thinking off`를 설정하세요.

  </Accordion>
</AccordionGroup>

## Auth profile: 무엇이며 어떻게 관리하나요

관련: [/concepts/oauth](/ko/concepts/oauth) (OAuth 흐름, 토큰 저장, 다중 계정 패턴)

<AccordionGroup>
  <Accordion title="auth profile이란 무엇인가요?">
    auth profile은 provider에 연결된 이름 있는 자격 증명 레코드(OAuth 또는 API 키)입니다. profile은 다음 위치에 있습니다:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="일반적인 profile ID는 무엇인가요?">
    OpenClaw는 다음과 같은 provider 접두사 ID를 사용합니다.

    - `anthropic:default` (이메일 식별자가 없을 때 흔함)
    - OAuth 식별자용 `anthropic:<email>`
    - 사용자가 선택한 사용자 지정 ID(예: `anthropic:work`)

  </Accordion>

  <Accordion title="어떤 auth profile을 먼저 시도할지 제어할 수 있나요?">
    예. config는 profile 메타데이터와 provider별 순서(`auth.order.<provider>`)를 선택적으로 지원합니다. 이는 secret을 저장하지 않고, ID를 provider/mode에 매핑하고 순환 순서를 설정합니다.

    OpenClaw는 짧은 **쿨다운**(속도 제한/타임아웃/auth 실패) 또는 더 긴 **비활성화** 상태(과금/크레딧 부족)에 있는 profile을 일시적으로 건너뛸 수 있습니다. 이를 확인하려면 `openclaw models status --json`을 실행하고 `auth.unusableProfiles`를 확인하세요. 조정 항목: `auth.cooldowns.billingBackoffHours*`.

    속도 제한 쿨다운은 모델 범위일 수 있습니다. 하나의 모델에 대해
    쿨다운 중인 profile이 같은 provider의 형제 모델에서는 여전히 사용 가능할 수 있지만,
    과금/비활성화 창은 여전히 profile 전체를 차단합니다.

    CLI를 통해 **에이전트별** 순서 재정의(해당 에이전트의 `auth-state.json`에 저장됨)를 설정할 수도 있습니다:

    ```bash
    # 구성된 기본 에이전트를 기본값으로 사용(--agent 생략 가능)
    openclaw models auth order get --provider anthropic

    # 순환을 단일 profile로 고정(이것만 시도)
    openclaw models auth order set --provider anthropic anthropic:default

    # 또는 명시적인 순서 설정(provider 내부 fallback)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 재정의 제거(config auth.order / round-robin으로 복귀)
    openclaw models auth order clear --provider anthropic
    ```

    특정 에이전트를 대상으로 하려면:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    실제로 무엇이 시도될지 확인하려면 다음을 사용하세요.

    ```bash
    openclaw models status --probe
    ```

    저장된 profile이 명시적 순서에서 빠져 있으면 probe는
    그 profile을 조용히 시도하는 대신 `excluded_by_auth_order`로 보고합니다.

  </Accordion>

  <Accordion title="OAuth와 API 키의 차이는 무엇인가요?">
    OpenClaw는 둘 다 지원합니다.

    - **OAuth**는 가능한 경우 구독 액세스를 활용하는 경우가 많습니다.
    - **API 키**는 토큰당 과금을 사용합니다.

    마법사는 Anthropic Claude CLI, OpenAI Codex OAuth, API 키를 명시적으로 지원합니다.

  </Accordion>
</AccordionGroup>

## Gateway: 포트, "already running", remote mode

<AccordionGroup>
  <Accordion title="Gateway는 어떤 포트를 사용하나요?">
    `gateway.port`는 WebSocket + HTTP(Control UI, hooks 등)를 위한 단일 다중화 포트를 제어합니다.

    우선순위:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 기본값 18789
    ```

  </Accordion>

  <Accordion title='왜 openclaw gateway status에는 "Runtime: running"이라고 나오는데 "Connectivity probe: failed"라고 나오나요?'>
    "running"은 **supervisor**의 관점(launchd/systemd/schtasks)이고, connectivity probe는 CLI가 실제로 gateway WebSocket에 연결을 시도한 결과이기 때문입니다.

    `openclaw gateway status`를 사용하고 다음 줄을 신뢰하세요.

    - `Probe target:` (probe가 실제로 사용한 URL)
    - `Listening:` (포트에 실제로 무엇이 바인딩되어 있는지)
    - `Last gateway error:` (프로세스는 살아 있지만 포트가 listen하지 않을 때 흔한 근본 원인)

  </Accordion>

  <Accordion title='왜 openclaw gateway status에는 "Config (cli)"와 "Config (service)"가 다르게 표시되나요?'>
    한 config 파일을 편집하는 동안 서비스는 다른 config 파일을 실행하고 있기 때문입니다(보통 `--profile` / `OPENCLAW_STATE_DIR` 불일치).

    해결:

    ```bash
    openclaw gateway install --force
    ```

    서비스가 사용하길 원하는 동일한 `--profile` / 환경에서 이것을 실행하세요.

  </Accordion>

  <Accordion title='“another gateway instance is already listening”는 무엇을 의미하나요?'>
    OpenClaw는 시작 시 즉시 WebSocket 리스너를 바인딩하여 런타임 잠금을 강제합니다(기본값 `ws://127.0.0.1:18789`). 바인딩이 `EADDRINUSE`로 실패하면 다른 인스턴스가 이미 listen 중이라는 뜻의 `GatewayLockError`를 발생시킵니다.

    해결 방법: 다른 인스턴스를 중지하거나, 포트를 비우거나, `openclaw gateway --port <port>`로 실행하세요.

  </Accordion>

  <Accordion title="OpenClaw를 remote mode로 실행하려면 어떻게 하나요(클라이언트가 다른 곳의 Gateway에 연결)?">
    `gateway.mode: "remote"`를 설정하고 원격 WebSocket URL을 지정하세요. 선택적으로 shared-secret 원격 자격 증명도 함께 설정할 수 있습니다.

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    참고:

    - `openclaw gateway`는 `gateway.mode`가 `local`일 때만 시작됩니다(또는 재정의 플래그를 전달한 경우).
    - macOS 앱은 config 파일을 감시하며 이 값이 바뀌면 실시간으로 모드를 전환합니다.
    - `gateway.remote.token` / `.password`는 클라이언트 측 원격 자격 증명일 뿐이며, 이것만으로 로컬 gateway auth가 활성화되지는 않습니다.

  </Accordion>

  <Accordion title='Control UI에 "unauthorized"가 표시되거나 계속 재연결됩니다. 어떻게 해야 하나요?'>
    gateway auth 경로와 UI의 auth 방식이 일치하지 않습니다.

    사실(코드 기준):

    - Control UI는 현재 브라우저 탭 세션과 선택된 gateway URL에 대한 토큰을 `sessionStorage`에 유지하므로, 긴 수명의 localStorage 토큰 지속성을 복원하지 않아도 같은 탭에서 새로고침이 계속 동작합니다.
    - `AUTH_TOKEN_MISMATCH`가 발생하면, 신뢰된 클라이언트는 gateway가 재시도 힌트(`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)를 반환할 때 캐시된 device token으로 제한된 한 번의 재시도를 시도할 수 있습니다.
    - 그 캐시 토큰 재시도는 이제 device token과 함께 저장된 캐시된 승인 scope도 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 여전히 캐시된 scope를 상속하지 않고 요청한 scope 집합을 유지합니다.
    - 그 재시도 경로 밖에서는 connect auth 우선순위가 명시적 shared token/password 우선, 그다음 명시적 `deviceToken`, 그다음 저장된 device token, 그다음 bootstrap token 순입니다.
    - bootstrap token scope 검사는 역할 접두사 기반입니다. 기본 제공 bootstrap operator 허용 목록은 operator 요청만 충족하며, node나 다른 비-operator 역할은 자체 역할 접두사 아래의 scope가 별도로 필요합니다.

    해결 방법:

    - 가장 빠른 방법: `openclaw dashboard` (대시보드 URL을 출력 + 복사하고, 열기를 시도하며, headless면 SSH 힌트를 보여줌)
    - 아직 토큰이 없다면: `openclaw doctor --generate-gateway-token`
    - remote라면 먼저 터널링: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기
    - shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 설정한 뒤, 일치하는 secret을 Control UI 설정에 붙여넣기
    - Tailscale Serve mode: `gateway.auth.allowTailscale`이 활성화되어 있는지 확인하고, Tailscale identity header를 우회하는 원시 loopback/tailnet URL이 아니라 Serve URL을 열고 있는지 확인
    - trusted-proxy mode: 같은 호스트의 loopback proxy나 원시 gateway URL이 아니라, 구성된 non-loopback identity-aware proxy를 통해 접속 중인지 확인
    - 한 번의 재시도 후에도 불일치가 계속되면 페어링된 device token을 회전/재승인하세요:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 그 rotate 호출이 거부되었다고 하면 두 가지를 확인하세요:
      - 페어링된 device 세션은 `operator.admin`도 없는 한 **자기 자신의** device만 회전할 수 있음
      - 명시적 `--scope` 값은 호출자의 현재 operator scope를 초과할 수 없음
    - 여전히 막혀 있나요? `openclaw status --all`을 실행하고 [Troubleshooting](/ko/gateway/troubleshooting)을 따르세요. auth 세부 사항은 [Dashboard](/web/dashboard)를 참고하세요.

  </Accordion>

  <Accordion title="gateway.bind를 tailnet으로 설정했는데 바인딩할 수 없고 아무것도 listen하지 않습니다">
    `tailnet` bind는 네트워크 인터페이스에서 Tailscale IP(100.64.0.0/10)를 선택합니다. 머신이 Tailscale에 연결되어 있지 않거나(또는 인터페이스가 내려가 있으면), 바인딩할 대상이 없습니다.

    해결 방법:

    - 해당 호스트에서 Tailscale을 시작해 100.x 주소를 갖게 하거나,
    - `gateway.bind: "loopback"` / `"lan"`으로 전환하세요.

    참고: `tailnet`은 명시적입니다. `auto`는 loopback을 선호하므로, tailnet 전용 bind를 원하면 `gateway.bind: "tailnet"`을 사용하세요.

  </Accordion>

  <Accordion title="같은 호스트에서 여러 Gateway를 실행할 수 있나요?">
    보통은 아니며, 하나의 Gateway가 여러 메시징 채널과 에이전트를 실행할 수 있습니다. 여러 Gateway는 중복성(예: 구조용 봇)이나 강한 격리가 필요할 때만 사용하세요.

    그래도 가능은 하지만 다음을 격리해야 합니다.

    - `OPENCLAW_CONFIG_PATH` (인스턴스별 config)
    - `OPENCLAW_STATE_DIR` (인스턴스별 상태)
    - `agents.defaults.workspace` (workspace 격리)
    - `gateway.port` (고유 포트)

    빠른 설정(권장):

    - 인스턴스별로 `openclaw --profile <name> ...` 사용(`~/.openclaw-<name>` 자동 생성)
    - 각 profile config에 고유한 `gateway.port` 설정(또는 수동 실행 시 `--port` 전달)
    - profile별 서비스 설치: `openclaw --profile <name> gateway install`

    profile은 서비스 이름에도 접미사를 붙입니다(`ai.openclaw.<profile>`; 레거시 `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    전체 가이드: [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008은 무엇을 의미하나요?'>
    Gateway는 **WebSocket 서버**이며, 첫 번째 메시지로
    `connect` 프레임이 오기를 기대합니다. 다른 것이 오면 연결을
    **code 1008**(정책 위반)으로 종료합니다.

    흔한 원인:

    - 브라우저에서 **HTTP** URL(`http://...`)을 연 경우(WS 클라이언트가 아님)
    - 잘못된 포트 또는 경로를 사용한 경우
    - 프록시 또는 터널이 auth header를 제거했거나 Gateway가 아닌 요청을 보낸 경우

    빠른 해결:

    1. WS URL 사용: `ws://<host>:18789`(또는 HTTPS인 경우 `wss://...`)
    2. 일반 브라우저 탭에서 WS 포트를 열지 않기
    3. auth가 켜져 있으면 `connect` 프레임에 token/password 포함

    CLI 또는 TUI를 사용 중이라면 URL은 다음과 같아야 합니다.

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    프로토콜 세부 사항: [Gateway protocol](/ko/gateway/protocol).

  </Accordion>
</AccordionGroup>

## 로깅과 디버깅

<AccordionGroup>
  <Accordion title="로그는 어디에 있나요?">
    파일 로그(구조화됨):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file`로 안정적인 경로를 설정할 수 있습니다. 파일 로그 수준은 `logging.level`이 제어합니다. 콘솔 출력 수준은 `--verbose`와 `logging.consoleLevel`이 제어합니다.

    가장 빠른 로그 tail:

    ```bash
    openclaw logs --follow
    ```

    서비스/supervisor 로그(gateway가 launchd/systemd로 실행될 때):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` 및 `gateway.err.log` (기본값: `~/.openclaw/logs/...`; profile은 `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    자세한 내용은 [Troubleshooting](/ko/gateway/troubleshooting)을 참고하세요.

  </Accordion>

  <Accordion title="Gateway 서비스를 시작/중지/재시작하려면 어떻게 하나요?">
    gateway helper를 사용하세요.

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway를 수동으로 실행하는 경우 `openclaw gateway --force`로 포트를 다시 확보할 수 있습니다. [Gateway](/ko/gateway)를 참고하세요.

  </Accordion>

  <Accordion title="Windows에서 터미널을 닫았습니다. OpenClaw를 어떻게 재시작하나요?">
    Windows 설치 모드는 **두 가지**가 있습니다.

    **1) WSL2(권장):** Gateway가 Linux 내부에서 실행됩니다.

    PowerShell을 열고 WSL에 들어간 뒤 재시작하세요.

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    서비스를 설치한 적이 없다면 포그라운드에서 시작하세요.

    ```bash
    openclaw gateway run
    ```

    **2) 네이티브 Windows(권장되지 않음):** Gateway가 Windows에서 직접 실행됩니다.

    PowerShell을 열고 다음을 실행하세요.

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    수동 실행 중이라면(서비스 없음) 다음을 사용하세요.

    ```powershell
    openclaw gateway run
    ```

    문서: [Windows (WSL2)](/ko/platforms/windows), [Gateway service runbook](/ko/gateway).

  </Accordion>

  <Accordion title="Gateway는 떠 있는데 응답이 오지 않습니다. 무엇을 확인해야 하나요?">
    빠른 상태 점검부터 시작하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    흔한 원인:

    - **gateway 호스트**에 모델 auth가 로드되지 않음(`models status` 확인)
    - 채널 페어링/허용 목록이 응답을 차단함(채널 config + 로그 확인)
    - WebChat/Dashboard가 올바른 토큰 없이 열려 있음

    remote라면 터널/Tailscale 연결이 살아 있는지, 그리고
    Gateway WebSocket에 접근 가능한지 확인하세요.

    문서: [Channels](/ko/channels), [Troubleshooting](/ko/gateway/troubleshooting), [Remote access](/ko/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 이제 어떻게 하나요?'>
    이는 보통 UI가 WebSocket 연결을 잃었다는 뜻입니다. 다음을 확인하세요.

    1. Gateway가 실행 중인가요? `openclaw gateway status`
    2. Gateway가 정상인가요? `openclaw status`
    3. UI에 올바른 토큰이 있나요? `openclaw dashboard`
    4. remote라면 터널/Tailscale 링크가 살아 있나요?

    그런 다음 로그를 tail로 보세요.

    ```bash
    openclaw logs --follow
    ```

    문서: [Dashboard](/web/dashboard), [Remote access](/ko/gateway/remote), [Troubleshooting](/ko/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands가 실패합니다. 무엇을 확인해야 하나요?">
    먼저 로그와 채널 상태부터 확인하세요.

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    그런 다음 오류에 맞춰 확인하세요.

    - `BOT_COMMANDS_TOO_MUCH`: Telegram 메뉴에 항목이 너무 많습니다. OpenClaw는 이미 Telegram 제한에 맞게 잘라서 더 적은 명령으로 재시도하지만, 일부 메뉴 항목은 여전히 제거해야 합니다. plugin/Skill/사용자 지정 명령 수를 줄이거나, 메뉴가 필요 없다면 `channels.telegram.commands.native`를 비활성화하세요.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, 또는 유사한 네트워크 오류: VPS에 있거나 프록시 뒤에 있다면 `api.telegram.org`로의 아웃바운드 HTTPS가 허용되고 DNS가 정상 동작하는지 확인하세요.

    Gateway가 원격이라면 Gateway 호스트의 로그를 보고 있는지 확인하세요.

    문서: [Telegram](/ko/channels/telegram), [Channel troubleshooting](/ko/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI에 출력이 보이지 않습니다. 무엇을 확인해야 하나요?">
    먼저 Gateway에 접근 가능한지, 그리고 에이전트가 실행될 수 있는지 확인하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI에서는 `/status`를 사용해 현재 상태를 볼 수 있습니다. 채팅
    채널에서 응답을 기대한다면 전달이 활성화되어 있는지 확인하세요(`/deliver on`).

    문서: [TUI](/web/tui), [Slash commands](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway를 완전히 중지한 뒤 다시 시작하려면 어떻게 하나요?">
    서비스를 설치한 경우:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    이것은 **감독되는 서비스**(macOS의 launchd, Linux의 systemd)를 중지/시작합니다.
    Gateway가 데몬으로 백그라운드에서 실행될 때 이 방법을 사용하세요.

    포그라운드에서 실행 중이라면 Ctrl-C로 중지한 다음:

    ```bash
    openclaw gateway run
    ```

    문서: [Gateway service runbook](/ko/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart와 openclaw gateway의 차이">
    - `openclaw gateway restart`: **백그라운드 서비스**(launchd/systemd)를 재시작합니다.
    - `openclaw gateway`: 이 터미널 세션에서 gateway를 **포그라운드로** 실행합니다.

    서비스를 설치했다면 gateway 명령을 사용하세요. 일회성 포그라운드 실행이
    필요할 때는 `openclaw gateway`를 사용하세요.

  </Accordion>

  <Accordion title="문제가 생겼을 때 가장 빨리 더 자세한 정보를 얻는 방법">
    더 자세한 콘솔 정보를 보려면 Gateway를 `--verbose`로 시작하세요. 그런 다음 로그 파일을 확인해 채널 auth, 모델 라우팅, RPC 오류를 검사하세요.
  </Accordion>
</AccordionGroup>

## 미디어와 첨부파일

<AccordionGroup>
  <Accordion title="내 Skill이 이미지/PDF를 생성했는데 아무것도 전송되지 않았습니다">
    에이전트의 발신 첨부파일에는 반드시 `MEDIA:<path-or-url>` 줄이 포함되어야 합니다(별도 줄로). [OpenClaw assistant setup](/ko/start/openclaw) 및 [Agent send](/ko/tools/agent-send)를 참고하세요.

    CLI로 전송:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    다음도 확인하세요.

    - 대상 채널이 발신 미디어를 지원하며 허용 목록에 의해 차단되지 않았는지
    - 파일이 provider 크기 제한 이내인지(이미지는 최대 2048px로 리사이즈됨)
    - `tools.fs.workspaceOnly=true`이면 로컬 경로 전송이 workspace, temp/media-store, 샌드박스 검증 파일로 제한됨
    - `tools.fs.workspaceOnly=false`이면 에이전트가 이미 읽을 수 있는 호스트 로컬 파일도 `MEDIA:`로 전송할 수 있지만, 미디어와 안전한 문서 유형(이미지, 오디오, 비디오, PDF, Office 문서)에만 허용됨. 일반 텍스트와 secret 유사 파일은 여전히 차단됨

    [Images](/ko/nodes/images)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 보안과 접근 제어

<AccordionGroup>
  <Accordion title="인바운드 DM에 OpenClaw를 노출해도 안전한가요?">
    인바운드 DM은 신뢰할 수 없는 입력으로 취급하세요. 기본값은 위험을 줄이도록 설계되어 있습니다.

    - DM이 가능한 채널의 기본 동작은 **pairing**입니다.
      - 알 수 없는 발신자에게는 pairing 코드가 전송되며, 봇은 해당 메시지를 처리하지 않습니다.
      - 승인 방법: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 대기 중 요청은 **채널당 3개**로 제한됩니다. 코드가 오지 않았다면 `openclaw pairing list --channel <channel> [--account <id>]`를 확인하세요.
    - DM을 공개적으로 여는 것은 명시적인 옵트인(`dmPolicy: "open"` 및 허용 목록 `"*"`)이 필요합니다.

    위험한 DM 정책을 확인하려면 `openclaw doctor`를 실행하세요.

  </Accordion>

  <Accordion title="프롬프트 인젝션은 공개 봇에서만 문제가 되나요?">
    아니요. 프롬프트 인젝션은 누가 DM을 보내는지가 아니라 **신뢰할 수 없는 콘텐츠**에 관한 문제입니다.
    어시스턴트가 외부 콘텐츠(웹 검색/가져오기, 브라우저 페이지, 이메일,
    문서, 첨부파일, 붙여넣은 로그)를 읽는다면, 그 콘텐츠에는 모델을
    탈취하려는 지시가 들어 있을 수 있습니다. 이는 **보내는 사람이 사용자뿐이더라도**
    발생할 수 있습니다.

    가장 큰 위험은 도구가 활성화되어 있을 때입니다. 모델이
    컨텍스트를 유출하거나 사용자를 대신해 도구를 호출하도록 속을 수 있습니다. 영향 범위를 줄이려면:

    - 읽기 전용 또는 도구가 비활성화된 "reader" 에이전트를 사용해 신뢰할 수 없는 콘텐츠를 요약하게 하기
    - 도구 사용 가능 에이전트에서는 `web_search` / `web_fetch` / `browser`를 끄기
    - 디코딩된 파일/문서 텍스트도 신뢰할 수 없는 것으로 취급하기: OpenResponses
      `input_file`과 미디어 첨부파일 추출은 둘 다 원시 파일 텍스트를 그대로 전달하는 대신,
      추출된 텍스트를 명시적인 외부 콘텐츠 경계 마커로 감쌈
    - 샌드박싱과 엄격한 도구 허용 목록 사용

    자세한 내용: [Security](/ko/gateway/security).

  </Accordion>

  <Accordion title="봇에 전용 이메일, GitHub 계정, 또는 전화번호를 주는 것이 좋나요?">
    예. 대부분의 설정에서는 그렇습니다. 별도 계정과 전화번호로 봇을 격리하면
    문제가 발생했을 때 영향 범위를 줄일 수 있습니다. 또한 이렇게 하면
    개인 계정에 영향을 주지 않고 자격 증명을 교체하거나 접근을 철회하기도 쉬워집니다.

    작게 시작하세요. 실제로 필요한 도구와 계정에만 접근 권한을 주고, 필요할 때
    나중에 확장하세요.

    문서: [Security](/ko/gateway/security), [Pairing](/ko/channels/pairing).

  </Accordion>

  <Accordion title="문자 메시지에 대한 자율권을 줘도 되나요? 안전한가요?">
    개인 메시지에 대해 완전한 자율권을 주는 것은 **권장하지 않습니다**. 가장 안전한 패턴은 다음과 같습니다.

    - DM은 **pairing mode** 또는 엄격한 허용 목록으로 유지
    - 사용자를 대신해 메시지를 보내게 하고 싶다면 **별도 번호 또는 계정** 사용
    - 초안을 만들게 한 뒤 **전송 전에 승인**

    실험하고 싶다면 전용 계정에서만 하고, 격리된 상태로 유지하세요. [Security](/ko/gateway/security)를 참고하세요.

  </Accordion>

  <Accordion title="개인 비서 작업에 더 저렴한 모델을 사용할 수 있나요?">
    예. 에이전트가 채팅 전용이고 입력이 신뢰할 수 있다면 가능합니다. 더 작은 등급은
    지시 탈취에 더 취약하므로, 도구 사용 가능 에이전트나
    신뢰할 수 없는 콘텐츠를 읽을 때는 피하세요. 꼭 더 작은 모델을 사용해야 한다면 도구를
    잠그고 샌드박스 안에서 실행하세요. [Security](/ko/gateway/security)를 참고하세요.
  </Accordion>

  <Accordion title="Telegram에서 /start를 실행했는데 pairing 코드가 오지 않았습니다">
    pairing 코드는 알 수 없는 발신자가 봇에 메시지를 보내고
    `dmPolicy: "pairing"`이 활성화되어 있을 때에만 전송됩니다. `/start`만으로는 코드를 생성하지 않습니다.

    대기 중 요청 확인:

    ```bash
    openclaw pairing list telegram
    ```

    즉시 접근을 원한다면 발신자 id를 허용 목록에 추가하거나 해당 계정의 `dmPolicy: "open"`을 설정하세요.

  </Accordion>

  <Accordion title="WhatsApp: 내 연락처에 메시지를 보내나요? pairing은 어떻게 동작하나요?">
    아니요. 기본 WhatsApp DM 정책은 **pairing**입니다. 알 수 없는 발신자는 pairing 코드만 받고, 그 메시지는 **처리되지 않습니다**. OpenClaw는 자신이 받은 채팅이나 사용자가 명시적으로 트리거한 전송에만 응답합니다.

    다음으로 pairing을 승인하세요.

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    대기 중 요청 목록:

    ```bash
    openclaw pairing list whatsapp
    ```

    마법사의 전화번호 프롬프트: 사용자의 **허용 목록/소유자**를 설정해 자신의 DM이 허용되도록 하기 위한 것입니다. 자동 전송에는 사용되지 않습니다. 개인 WhatsApp 번호에서 실행한다면 그 번호를 사용하고 `channels.whatsapp.selfChatMode`를 활성화하세요.

  </Accordion>
</AccordionGroup>

## 채팅 명령, 작업 중단, 그리고 "멈추지 않아요"

<AccordionGroup>
  <Accordion title="내부 시스템 메시지가 채팅에 표시되지 않게 하려면 어떻게 하나요?">
    대부분의 내부 또는 도구 메시지는 해당 세션에서 **verbose**, **trace**, 또는 **reasoning**이 활성화된 경우에만 표시됩니다.

    보이는 채팅에서 다음을 실행하세요.

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    그래도 시끄럽다면 Control UI의 세션 설정을 확인하고 verbose를
    **inherit**로 설정하세요. 또한 config에서 `verboseDefault`가
    `on`으로 설정된 봇 profile을 사용 중이 아닌지도 확인하세요.

    문서: [Thinking and verbose](/ko/tools/thinking), [Security](/ko/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="실행 중인 작업을 중지/취소하려면 어떻게 하나요?">
    다음 중 하나를 **독립 메시지로** 보내세요(슬래시 없음).

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    이것들은 중단 트리거이며(슬래시 명령이 아님) 그렇습니다.

    백그라운드 프로세스(exec 도구에서 시작된 것)의 경우 에이전트에게 다음을 실행하라고 요청할 수 있습니다.

    ```
    process action:kill sessionId:XXX
    ```

    Slash command 개요: [Slash commands](/ko/tools/slash-commands)를 참고하세요.

    대부분의 명령은 `/`로 시작하는 **독립 메시지**로 보내야 하지만, 몇몇 단축키(`/status` 등)는 허용 목록에 있는 발신자에 한해 인라인으로도 동작합니다.

  </Accordion>

  <Accordion title='Telegram에서 Discord 메시지를 보내려면 어떻게 하나요?("Cross-context messaging denied")'>
    OpenClaw는 기본적으로 **교차 provider** 메시징을 차단합니다. 도구 호출이
    Telegram에 바인딩되어 있으면, 명시적으로 허용하지 않는 한 Discord로 보내지 않습니다.

    에이전트에 대해 교차 provider 메시징 활성화:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    config를 편집한 뒤 gateway를 재시작하세요.

  </Accordion>

  <Accordion title='왜 봇이 빠르게 연속된 메시지를 "무시"하는 것처럼 느껴지나요?'>
    queue mode는 새 메시지가 진행 중인 실행과 어떻게 상호작용하는지를 제어합니다. `/queue`로 모드를 바꾸세요.

    - `steer` - 새 메시지가 현재 작업의 방향을 바꿈
    - `followup` - 메시지를 한 번에 하나씩 실행
    - `collect` - 메시지를 모아 한 번만 응답(기본값)
    - `steer-backlog` - 지금 방향을 바꾸고, 그다음 backlog 처리
    - `interrupt` - 현재 실행을 중단하고 새로 시작

    followup 모드에는 `debounce:2s cap:25 drop:summarize` 같은 옵션도 추가할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 기타

<AccordionGroup>
  <Accordion title='Anthropic API 키를 사용할 때의 기본 모델은 무엇인가요?'>
    OpenClaw에서 자격 증명과 모델 선택은 별개입니다. `ANTHROPIC_API_KEY`를 설정하거나(또는 auth profile에 Anthropic API 키를 저장하면) 인증은 활성화되지만, 실제 기본 모델은 `agents.defaults.model.primary`에 구성한 값입니다(예: `anthropic/claude-sonnet-4-6` 또는 `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"`가 보인다면, 실행 중인 에이전트에 대해 Gateway가 예상된 `auth-profiles.json`에서 Anthropic 자격 증명을 찾지 못했다는 뜻입니다.
  </Accordion>
</AccordionGroup>

---

여전히 막혀 있나요? [Discord](https://discord.com/invite/clawd)에서 문의하거나 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)을 열어 주세요.
