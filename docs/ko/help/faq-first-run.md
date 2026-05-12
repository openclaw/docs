---
read_when:
    - 새 설치, 온보딩 중단 또는 첫 실행 오류
    - 인증 및 공급자 구독 선택하기
    - docs.openclaw.ai에 액세스할 수 없음, 대시보드를 열 수 없음, 설치가 멈춤
sidebarTitle: First-run FAQ
summary: '자주 묻는 질문: 빠른 시작 및 최초 실행 설정 — 설치, 온보딩, 인증, 구독, 초기 실패'
title: 'FAQ: 최초 실행 설정'
x-i18n:
    generated_at: "2026-05-12T00:58:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  빠른 시작 및 첫 실행 Q&A입니다. 일상적인 운영, 모델, 인증, 세션,
  문제 해결은 기본 [FAQ](/ko/help/faq)를 참조하세요.

  ## 빠른 시작 및 첫 실행 설정

  <AccordionGroup>
  <Accordion title="막혔을 때 가장 빠르게 해결하는 방법">
    **내 머신을 볼 수 있는** 로컬 AI 에이전트를 사용하세요. 대부분의 "막혔어요" 사례는 원격 지원자가
    확인할 수 없는 **로컬 설정 또는 환경 문제**이기 때문에 Discord에서 묻는 것보다 훨씬 효과적입니다.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    이러한 도구는 저장소를 읽고, 명령을 실행하고, 로그를 검사하고, 머신 수준
    설정(PATH, 서비스, 권한, 인증 파일)을 고치는 데 도움을 줄 수 있습니다. 해킹 가능한 (git) 설치를 통해
    **전체 소스 체크아웃**을 제공하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 OpenClaw가 **git 체크아웃에서** 설치되므로 에이전트가 코드와 문서를 읽고
    실행 중인 정확한 버전에 대해 추론할 수 있습니다. 나중에 `--install-method git` 없이 설치 프로그램을
    다시 실행하면 언제든지 안정 버전으로 되돌릴 수 있습니다.

    팁: 에이전트에게 수정 작업을 **계획하고 감독**(단계별)하게 한 다음 필요한 명령만 실행하게 하세요.
    이렇게 하면 변경 사항이 작고 감사하기 쉬워집니다.

    실제 버그나 수정 사항을 발견하면 GitHub 이슈를 작성하거나 PR을 보내 주세요.
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    다음 명령으로 시작하세요(도움을 요청할 때 출력 공유).

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    각 명령의 역할:

    - `openclaw status`: gateway/agent 상태와 기본 설정의 빠른 스냅샷.
    - `openclaw models status`: provider 인증과 모델 가용성을 확인합니다.
    - `openclaw doctor`: 일반적인 설정/상태 문제를 검증하고 복구합니다.

    기타 유용한 CLI 확인: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    빠른 디버그 루프: [문제가 있을 때 처음 60초](/ko/help/faq#first-60-seconds-if-something-is-broken).
    설치 문서: [설치](/ko/install), [설치 프로그램 플래그](/ko/install/installer), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="Heartbeat가 계속 건너뜁니다. 건너뛰기 이유는 무엇을 의미하나요?">
    일반적인 heartbeat 건너뛰기 이유:

    - `quiet-hours`: 설정된 활성 시간 창 밖입니다.
    - `empty-heartbeat-file`: `HEARTBEAT.md`가 존재하지만 빈 내용/헤더만 있는 스캐폴딩만 포함합니다.
    - `no-tasks-due`: `HEARTBEAT.md` 작업 모드가 활성화되어 있지만 아직 도래한 작업 간격이 없습니다.
    - `alerts-disabled`: 모든 heartbeat 표시가 비활성화되어 있습니다(`showOk`, `showAlerts`, `useIndicator`가 모두 꺼져 있음).

    작업 모드에서는 실제 heartbeat 실행이 완료된 뒤에만 도래 타임스탬프가
    갱신됩니다. 건너뛴 실행은 작업을 완료된 것으로 표시하지 않습니다.

    문서: [Heartbeat](/ko/gateway/heartbeat), [자동화](/ko/automation).

  </Accordion>

  <Accordion title="OpenClaw 설치 및 설정 권장 방법">
    저장소는 소스에서 실행하고 온보딩을 사용하는 것을 권장합니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    마법사는 UI 자산도 자동으로 빌드할 수 있습니다. 온보딩 후에는 일반적으로 **18789** 포트에서 Gateway를 실행합니다.

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

  <Accordion title="온보딩 후 대시보드는 어떻게 열 수 있나요?">
    마법사는 온보딩 직후 깔끔한(토큰이 포함되지 않은) 대시보드 URL로 브라우저를 열고 요약에도 링크를 출력합니다. 해당 탭을 열어 두세요. 실행되지 않았다면 같은 머신에서 출력된 URL을 복사/붙여넣기하세요.
  </Accordion>

  <Accordion title="localhost와 원격에서 대시보드를 어떻게 인증하나요?">
    **Localhost(같은 머신):**

    - `http://127.0.0.1:18789/`를 여세요.
    - 공유 비밀 인증을 요청하면 설정된 토큰 또는 비밀번호를 Control UI 설정에 붙여넣으세요.
    - 토큰 출처: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`).
    - 비밀번호 출처: `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`).
    - 아직 공유 비밀이 설정되지 않았다면 `openclaw doctor --generate-gateway-token`으로 토큰을 생성하세요.

    **localhost가 아닌 경우:**

    - **Tailscale Serve**(권장): 바인드는 loopback으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 뒤 `https://<magicdns>/`를 여세요. `gateway.auth.allowTailscale`이 `true`이면 ID 헤더가 Control UI/WebSocket 인증을 충족합니다(붙여넣은 공유 비밀 없음, 신뢰할 수 있는 gateway 호스트라고 가정). HTTP API는 private-ingress `none` 또는 trusted-proxy HTTP 인증을 의도적으로 사용하지 않는 한 여전히 공유 비밀 인증이 필요합니다.
      같은 클라이언트의 잘못된 동시 Serve 인증 시도는 실패 인증 제한기가 이를 기록하기 전에 직렬화되므로, 두 번째 잘못된 재시도에서 이미 `retry later`가 표시될 수 있습니다.
    - **Tailnet 바인드**: `openclaw gateway --bind tailnet --token "<token>"`를 실행하거나 비밀번호 인증을 구성하고, `http://<tailscale-ip>:18789/`를 연 다음 대시보드 설정에 일치하는 공유 비밀을 붙여넣으세요.
    - **ID 인식 reverse proxy**: Gateway를 신뢰할 수 있는 프록시 뒤에 두고 `gateway.auth.mode: "trusted-proxy"`를 구성한 다음 프록시 URL을 여세요. 같은 호스트의 loopback 프록시는 명시적으로 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
    - **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@host`를 실행한 다음 `http://127.0.0.1:18789/`를 여세요. 터널을 통해서도 공유 비밀 인증이 적용됩니다. 메시지가 표시되면 설정된 토큰 또는 비밀번호를 붙여넣으세요.

    바인드 모드와 인증 세부 정보는 [대시보드](/ko/web/dashboard) 및 [웹 표면](/ko/web)을 참조하세요.

  </Accordion>

  <Accordion title="채팅 승인에 exec 승인 설정이 두 개인 이유는 무엇인가요?">
    서로 다른 계층을 제어합니다.

    - `approvals.exec`: 승인 프롬프트를 채팅 대상으로 전달합니다.
    - `channels.<channel>.execApprovals`: 해당 채널이 exec 승인을 위한 네이티브 승인 클라이언트로 동작하게 합니다.

    호스트 exec 정책이 여전히 실제 승인 게이트입니다. 채팅 설정은 승인
    프롬프트가 표시되는 위치와 사람들이 응답하는 방식만 제어합니다.

    대부분의 설정에서는 **둘 다** 필요하지 않습니다.

    - 채팅이 이미 명령과 답장을 지원하면 동일 채팅 `/approve`가 공유 경로를 통해 동작합니다.
    - 지원되는 네이티브 채널이 승인자를 안전하게 추론할 수 있으면, 이제 OpenClaw는 `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`일 때 DM 우선 네이티브 승인을 자동으로 활성화합니다.
    - 네이티브 승인 카드/버튼을 사용할 수 있으면 해당 네이티브 UI가 기본 경로입니다. 에이전트는 도구 결과가 채팅 승인을 사용할 수 없다고 하거나 수동 승인이 유일한 경로라고 할 때만 수동 `/approve` 명령을 포함해야 합니다.
    - 프롬프트를 다른 채팅 또는 명시적 운영 방에도 전달해야 할 때만 `approvals.exec`를 사용하세요.
    - 승인 프롬프트를 원래 방/주제로 다시 게시하기를 명시적으로 원하는 경우에만 `channels.<channel>.execApprovals.target: "channel"` 또는 `"both"`를 사용하세요.
    - Plugin 승인은 다시 별개입니다. 기본적으로 동일 채팅 `/approve`, 선택적 `approvals.plugin` 전달을 사용하며, 일부 네이티브 채널만 그 위에 Plugin 승인 네이티브 처리를 유지합니다.

    짧게 말하면: 전달은 라우팅용이고, 네이티브 클라이언트 설정은 더 풍부한 채널별 UX용입니다.
    [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>

  <Accordion title="어떤 런타임이 필요한가요?">
    Node **>= 22**가 필요합니다. `pnpm`을 권장합니다. Bun은 Gateway에 **권장되지 않습니다**.
  </Accordion>

  <Accordion title="Raspberry Pi에서 실행되나요?">
    예. Gateway는 가볍습니다. 문서에는 개인용으로 **512MB-1GB RAM**, **1코어**, 약 **500MB**
    디스크면 충분하며, **Raspberry Pi 4에서 실행할 수 있다**고 나와 있습니다.

    추가 여유 공간(로그, 미디어, 기타 서비스)을 원한다면 **2GB를 권장**하지만,
    엄격한 최소 요구 사항은 아닙니다.

    팁: 작은 Pi/VPS가 Gateway를 호스팅할 수 있고, 노트북/휴대폰의 **노드**를 페어링하여
    로컬 화면/카메라/캔버스 또는 명령 실행에 사용할 수 있습니다. [노드](/ko/nodes)를 참조하세요.

  </Accordion>

  <Accordion title="Raspberry Pi 설치 팁이 있나요?">
    짧게 말하면: 작동하지만 거친 부분이 있을 수 있습니다.

    - **64비트** OS를 사용하고 Node >= 22를 유지하세요.
    - 로그를 보고 빠르게 업데이트할 수 있도록 **해킹 가능한 (git) 설치**를 선호하세요.
    - 채널/Skills 없이 시작한 다음 하나씩 추가하세요.
    - 이상한 바이너리 문제를 만나면 대개 **ARM 호환성** 문제입니다.

    문서: [Linux](/ko/platforms/linux), [설치](/ko/install).

  </Accordion>

  <Accordion title="wake up my friend에서 멈췄거나 온보딩이 부화하지 않습니다. 이제 어떻게 하나요?">
    해당 화면은 Gateway에 연결 가능하고 인증되어 있어야 합니다. TUI도 첫 부화 시
    "Wake up, my friend!"를 자동으로 보냅니다. 그 줄이 보이는데 **응답이 없고**
    토큰이 0에 머문다면 에이전트가 실행되지 않은 것입니다.

    1. Gateway를 재시작하세요.

    ```bash
    openclaw gateway restart
    ```

    2. 상태와 인증을 확인하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 여전히 멈춰 있으면 다음을 실행하세요.

    ```bash
    openclaw doctor
    ```

    Gateway가 원격에 있다면 터널/Tailscale 연결이 올라와 있고 UI가 올바른 Gateway를
    가리키는지 확인하세요. [원격 액세스](/ko/gateway/remote)를 참조하세요.

  </Accordion>

  <Accordion title="온보딩을 다시 하지 않고 설정을 새 머신(Mac mini)으로 마이그레이션할 수 있나요?">
    예. **상태 디렉터리**와 **워크스페이스**를 복사한 다음 Doctor를 한 번 실행하세요. 이렇게 하면
    **두** 위치를 모두 복사하는 한 봇이 "정확히 동일하게"(메모리, 세션 기록, 인증, 채널
    상태) 유지됩니다.

    1. 새 머신에 OpenClaw를 설치합니다.
    2. 이전 머신에서 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`)을 복사합니다.
    3. 워크스페이스(기본값: `~/.openclaw/workspace`)를 복사합니다.
    4. `openclaw doctor`를 실행하고 Gateway 서비스를 재시작합니다.

    이렇게 하면 설정, 인증 프로필, WhatsApp 자격 증명, 세션, 메모리가 보존됩니다. 원격 모드라면
    gateway 호스트가 세션 저장소와 워크스페이스를 소유한다는 점을 기억하세요.

    **중요:** 워크스페이스만 GitHub에 커밋/푸시하면 **메모리 + 부트스트랩 파일**은
    백업되지만, 세션 기록이나 인증은 백업되지 않습니다. 이들은
    `~/.openclaw/` 아래에 있습니다(예: `~/.openclaw/agents/<agentId>/sessions/`).

    관련: [마이그레이션](/ko/install/migrating), [디스크에서 항목이 위치하는 곳](/ko/help/faq#where-things-live-on-disk),
    [에이전트 워크스페이스](/ko/concepts/agent-workspace), [Doctor](/ko/gateway/doctor),
    [원격 모드](/ko/gateway/remote).

  </Accordion>

  <Accordion title="최신 버전의 새로운 내용은 어디에서 볼 수 있나요?">
    GitHub changelog를 확인하세요.
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    가장 최신 항목이 맨 위에 있습니다. 맨 위 섹션이 **Unreleased**로 표시되어 있다면, 그다음 날짜가 있는
    섹션이 최신 릴리스 버전입니다. 항목은 **Highlights**, **Changes**, **Fixes**별로 묶이며
    필요할 경우 문서/기타 섹션도 포함됩니다.

  </Accordion>

  <Accordion title="docs.openclaw.ai에 접근할 수 없습니다(SSL 오류)">
    일부 Comcast/Xfinity 연결은 Xfinity Advanced Security를 통해 `docs.openclaw.ai`를
    잘못 차단합니다. 이를 비활성화하거나 `docs.openclaw.ai`를 허용 목록에 추가한 다음 다시 시도하세요.
    차단 해제를 돕기 위해 여기에 신고해 주세요: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    그래도 사이트에 접속할 수 없다면 문서가 GitHub에 미러링되어 있습니다.
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable과 beta의 차이">
    **Stable**과 **beta**는 별도의 코드 라인이 아니라 **npm dist-tag**입니다.

    - `latest` = stable
    - `beta` = 테스트용 초기 빌드

    일반적으로 stable 릴리스는 먼저 **beta**에 올라가고, 이후 명시적인
    승격 단계에서 같은 버전이 `latest`로 이동합니다. Maintainer가 필요할 때
    바로 `latest`에 게시할 수도 있습니다. 그래서 승격 후에는 beta와 stable이
    **같은 버전**을 가리킬 수 있습니다.

    변경 사항 보기:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    설치용 한 줄 명령과 beta와 dev의 차이는 아래 아코디언을 참조하세요.

  </Accordion>

  <Accordion title="beta 버전은 어떻게 설치하고 beta와 dev는 무엇이 다른가요?">
    **Beta**는 npm dist-tag `beta`입니다(승격 후에는 `latest`와 같을 수 있음).
    **Dev**는 `main`의 이동하는 최신 지점(git)입니다. 게시될 때는 npm dist-tag `dev`를 사용합니다.

    한 줄 명령(macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 설치 프로그램(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    자세한 내용은 [개발 채널](/ko/install/development-channels) 및 [설치 프로그램 플래그](/ko/install/installer)를 참조하세요.

  </Accordion>

  <Accordion title="최신 빌드는 어떻게 사용해 볼 수 있나요?">
    두 가지 옵션이 있습니다.

    1. **Dev 채널(git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    이 명령은 `main` 브랜치로 전환하고 소스에서 업데이트합니다.

    2. **수정 가능한 설치(설치 프로그램 사이트에서):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 편집할 수 있는 로컬 저장소가 생기며, 이후 git으로 업데이트할 수 있습니다.

    직접 깔끔하게 클론하려면 다음을 사용하세요.

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    문서: [업데이트](/ko/cli/update), [개발 채널](/ko/install/development-channels),
    [설치](/ko/install).

  </Accordion>

  <Accordion title="설치와 온보딩은 보통 얼마나 걸리나요?">
    대략적인 기준:

    - **설치:** 2-5분
    - **온보딩:** 구성하는 채널/모델 수에 따라 5-15분

    멈춘 것처럼 보이면 [설치 프로그램 멈춤](#quick-start-and-first-run-setup)과
    [막혔습니다](#quick-start-and-first-run-setup)의 빠른 디버그 루프를 사용하세요.

  </Accordion>

  <Accordion title="설치 프로그램이 멈췄나요? 더 많은 피드백을 받으려면 어떻게 하나요?">
    **자세한 출력**으로 설치 프로그램을 다시 실행하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    자세한 출력이 포함된 beta 설치:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    수정 가능한(git) 설치의 경우:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows(PowerShell) 동등 명령:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    추가 옵션: [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Windows 설치에서 git을 찾을 수 없거나 openclaw를 인식할 수 없다고 표시됩니다">
    Windows에서 흔히 발생하는 두 가지 문제:

    **1) npm error spawn git / git not found**

    - **Git for Windows**를 설치하고 `git`이 PATH에 있는지 확인하세요.
    - PowerShell을 닫았다가 다시 열고 설치 프로그램을 다시 실행하세요.

    **2) 설치 후 openclaw가 인식되지 않음**

    - npm 전역 bin 폴더가 PATH에 없습니다.
    - 경로를 확인하세요.

      ```powershell
      npm config get prefix
      ```

    - 해당 디렉터리를 사용자 PATH에 추가하세요(Windows에서는 `\bin` 접미사가 필요하지 않으며, 대부분의 시스템에서는 `%AppData%\npm`입니다).
    - PATH를 업데이트한 후 PowerShell을 닫았다가 다시 여세요.

    가장 매끄러운 Windows 설정을 원한다면 네이티브 Windows 대신 **WSL2**를 사용하세요.
    문서: [Windows](/ko/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec 출력에 깨진 중국어 텍스트가 표시됩니다. 어떻게 해야 하나요?">
    이는 보통 네이티브 Windows 셸의 콘솔 코드 페이지 불일치입니다.

    증상:

    - `system.run`/`exec` 출력에서 중국어가 깨진 문자로 렌더링됨
    - 같은 명령이 다른 터미널 프로필에서는 정상적으로 보임

    PowerShell에서의 빠른 우회 방법:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    그런 다음 Gateway를 다시 시작하고 명령을 다시 시도하세요.

    ```powershell
    openclaw gateway restart
    ```

    최신 OpenClaw에서도 여전히 재현된다면 다음에서 추적/보고하세요.

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="문서가 제 질문에 답하지 못했습니다. 더 나은 답변을 얻으려면 어떻게 하나요?">
    전체 소스와 문서를 로컬에 둘 수 있도록 **수정 가능한(git) 설치**를 사용한 다음,
    봇(또는 Claude/Codex)에게 _해당 폴더에서_ 질문하여 저장소를 읽고 정확히 답할 수 있게 하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    자세한 내용: [설치](/ko/install) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Linux에 OpenClaw를 어떻게 설치하나요?">
    짧은 답: Linux 가이드를 따른 다음 온보딩을 실행하세요.

    - Linux 빠른 경로 + 서비스 설치: [Linux](/ko/platforms/linux).
    - 전체 안내: [시작하기](/ko/start/getting-started).
    - 설치 프로그램 + 업데이트: [설치 및 업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="VPS에 OpenClaw를 어떻게 설치하나요?">
    어떤 Linux VPS든 사용할 수 있습니다. 서버에 설치한 다음 SSH/Tailscale을 사용해 Gateway에 접속하세요.

    가이드: [exe.dev](/ko/install/exe-dev), [Hetzner](/ko/install/hetzner), [Fly.io](/ko/install/fly).
    원격 액세스: [Gateway 원격](/ko/gateway/remote).

  </Accordion>

  <Accordion title="클라우드/VPS 설치 가이드는 어디에 있나요?">
    일반적인 제공업체를 모아 둔 **호스팅 허브**를 제공합니다. 하나를 선택하고 가이드를 따르세요.

    - [VPS 호스팅](/ko/vps) (모든 제공업체를 한곳에)
    - [Fly.io](/ko/install/fly)
    - [Hetzner](/ko/install/hetzner)
    - [exe.dev](/ko/install/exe-dev)

    클라우드에서의 작동 방식: **Gateway가 서버에서 실행**되고, 노트북/휴대폰에서
    Control UI(또는 Tailscale/SSH)를 통해 접근합니다. 상태 + 워크스페이스는
    서버에 있으므로, 호스트를 신뢰할 수 있는 원본으로 취급하고 백업하세요.

    **Node**(Mac/iOS/Android/headless)를 해당 클라우드 Gateway에 페어링하여
    Gateway는 클라우드에 유지하면서 로컬 화면/카메라/캔버스에 접근하거나
    노트북에서 명령을 실행할 수 있습니다.

    허브: [플랫폼](/ko/platforms). 원격 액세스: [Gateway 원격](/ko/gateway/remote).
    Node: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw에 스스로 업데이트하라고 요청할 수 있나요?">
    짧은 답: **가능하지만 권장하지 않습니다**. 업데이트 흐름은 Gateway를
    다시 시작할 수 있고(활성 세션이 끊어짐), 깨끗한 git checkout이 필요할 수 있으며,
    확인을 요청할 수 있습니다. 더 안전한 방법은 운영자가 셸에서 업데이트를 실행하는 것입니다.

    CLI를 사용하세요.

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

    문서: [업데이트](/ko/cli/update), [업데이트하기](/ko/install/updating).

  </Accordion>

  <Accordion title="온보딩은 실제로 무엇을 하나요?">
    `openclaw onboard`는 권장 설정 경로입니다. **로컬 모드**에서는 다음을 안내합니다.

    - **모델/인증 설정**(제공업체 OAuth, API 키, Anthropic setup-token, 그리고 LM Studio 같은 로컬 모델 옵션)
    - **워크스페이스** 위치 + 부트스트랩 파일
    - **Gateway 설정**(bind/port/auth/tailscale)
    - **채널**(WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, 그리고 QQ Bot 같은 번들 채널 Plugin)
    - **데몬 설치**(macOS의 LaunchAgent, Linux/WSL2의 systemd 사용자 유닛)
    - **상태 확인** 및 **Skills** 선택

    구성된 모델이 알 수 없거나 인증이 누락된 경우에도 경고합니다.

  </Accordion>

  <Accordion title="실행하려면 Claude 또는 OpenAI 구독이 필요한가요?">
    아니요. **API 키**(Anthropic/OpenAI/기타) 또는 **로컬 전용 모델**로
    OpenClaw를 실행하여 데이터를 기기에 유지할 수 있습니다. 구독(Claude
    Pro/Max 또는 OpenAI Codex)은 해당 제공업체에 인증하기 위한 선택적 방법입니다.

    OpenClaw에서 Anthropic의 실질적인 구분은 다음과 같습니다.

    - **Anthropic API 키**: 일반 Anthropic API 과금
    - **OpenClaw의 Claude CLI / Claude 구독 인증**: Anthropic 직원이
      이 사용이 다시 허용된다고 알려 왔으며, OpenClaw는 Anthropic이 새
      정책을 게시하지 않는 한 이 통합에서 `claude -p` 사용을 승인된 것으로
      취급합니다

    장기 실행 Gateway 호스트에는 Anthropic API 키가 여전히 더
    예측 가능한 설정입니다. OpenAI Codex OAuth는 OpenClaw 같은 외부
    도구에 대해 명시적으로 지원됩니다.

    OpenClaw는 **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**,
    **Z.AI / GLM Coding Plan**을 포함한 다른 호스팅 구독형 옵션도 지원합니다.

    문서: [Anthropic](/ko/providers/anthropic), [OpenAI](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen),
    [MiniMax](/ko/providers/minimax), [GLM Models](/ko/providers/glm),
    [로컬 모델](/ko/gateway/local-models), [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="API 키 없이 Claude Max 구독을 사용할 수 있나요?">
    예.

    Anthropic 직원이 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려 왔으므로,
    OpenClaw는 Anthropic이 새 정책을 게시하지 않는 한 이 통합에서
    Claude 구독 인증과 `claude -p` 사용을 승인된 것으로 취급합니다. 가장
    예측 가능한 서버 측 설정을 원한다면 대신 Anthropic API 키를 사용하세요.

  </Accordion>

  <Accordion title="Claude 구독 인증(Claude Pro 또는 Max)을 지원하나요?">
    예.

    Anthropic 직원이 이 사용이 다시 허용된다고 알려 왔으므로, OpenClaw는
    Anthropic이 새 정책을 게시하지 않는 한 이 통합에서 Claude CLI 재사용과
    `claude -p` 사용을 승인된 것으로 취급합니다.

    Anthropic setup-token은 지원되는 OpenClaw 토큰 경로로 계속 사용할 수 있지만, OpenClaw는 이제 사용 가능한 경우 Claude CLI 재사용과 `claude -p`를 선호합니다.
    프로덕션 또는 다중 사용자 워크로드의 경우 Anthropic API 키 인증이 여전히
    더 안전하고 예측 가능한 선택입니다. OpenClaw의 다른 구독형 호스팅
    옵션을 원한다면 [OpenAI](/ko/providers/openai), [Qwen / Model
    Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [GLM
    Models](/ko/providers/glm)을 참조하세요.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic에서 HTTP 429 rate_limit_error가 표시되는 이유는 무엇인가요?">
    이는 현재 창에서 **Anthropic 할당량/속도 제한**이 소진되었다는 뜻입니다. **Claude CLI**를
    사용하는 경우 창이 재설정될 때까지 기다리거나 플랜을 업그레이드하세요. **Anthropic API 키**를
    사용하는 경우 Anthropic Console에서
    사용량/청구를 확인하고 필요에 따라 제한을 올리세요.

    메시지가 구체적으로 다음과 같다면:
    `Extra usage is required for long context requests`, 요청이
    Anthropic의 1M 컨텍스트 beta(`context1m: true`)를 사용하려고 하는 것입니다. 이는
    자격 증명이 긴 컨텍스트 과금(API 키 과금 또는 Extra Usage가 활성화된
    OpenClaw Claude 로그인 경로)에 적격한 경우에만 작동합니다.

    팁: 공급자가 속도 제한에 걸린 동안에도 OpenClaw가 계속 응답할 수 있도록 **fallback model**을 설정하세요.
    [Models](/ko/cli/models), [OAuth](/ko/concepts/oauth) 및
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)를 참조하세요.

  </Accordion>

  <Accordion title="AWS Bedrock이 지원되나요?">
    예. OpenClaw에는 번들된 **Amazon Bedrock (Converse)** 공급자가 있습니다. AWS env 마커가 있으면 OpenClaw가 스트리밍/텍스트 Bedrock 카탈로그를 자동으로 발견하고 이를 암시적 `amazon-bedrock` 공급자로 병합할 수 있습니다. 그렇지 않으면 `plugins.entries.amazon-bedrock.config.discovery.enabled`를 명시적으로 활성화하거나 수동 공급자 항목을 추가할 수 있습니다. [Amazon Bedrock](/ko/providers/bedrock) 및 [Model providers](/ko/providers/models)를 참조하세요. 관리형 키 흐름을 선호한다면 Bedrock 앞에 OpenAI 호환 프록시를 두는 것도 여전히 유효한 옵션입니다.
  </Accordion>

  <Accordion title="Codex 인증은 어떻게 작동하나요?">
    OpenClaw는 OAuth(ChatGPT 로그인)를 통해 **OpenAI Code (Codex)**를 지원합니다. 일반적인 설정에는
    `openai/gpt-5.5`를 사용하세요. ChatGPT/Codex 구독 인증과
    네이티브 Codex 앱 서버 실행을 함께 사용합니다. `openai-codex/gpt-*` 모델 참조는
    `openclaw doctor --fix`로 복구되는 레거시 구성입니다. 직접 OpenAI API 키
    액세스는 비에이전트 OpenAI API 표면과, 정렬된 `openai-codex` API 키 프로필을 통한 에이전트
    모델에서 계속 사용할 수 있습니다.
    [Model providers](/ko/concepts/model-providers) 및 [Onboarding (CLI)](/ko/start/wizard)를 참조하세요.
  </Accordion>

  <Accordion title="OpenClaw가 여전히 openai-codex를 언급하는 이유는 무엇인가요?">
    `openai-codex`는 ChatGPT/Codex OAuth의 공급자 및 인증 프로필 ID입니다.
    이전 구성에서는 이를 모델 접두사로도 사용했습니다.

    - `openai/gpt-5.5` = 에이전트 턴에 네이티브 Codex 런타임을 사용하는 ChatGPT/Codex 구독 인증
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix`로 복구되는 레거시 모델 경로
    - `openai/gpt-5.5`와 정렬된 `openai-codex` API 키 프로필 = OpenAI 에이전트 모델용 API 키 인증
    - `openai-codex:...` = 인증 프로필 ID이며, 모델 참조가 아님

    직접 OpenAI Platform 과금/제한 경로를 원하면
    `OPENAI_API_KEY`를 설정하세요. ChatGPT/Codex 구독 인증을 원하면
    `openclaw models auth login --provider openai-codex`로 로그인하세요. 모델 참조는
    `openai/gpt-5.5`로 유지하세요. `openai-codex/*` 모델 참조는
    `openclaw doctor --fix`가 다시 작성하는 레거시 구성입니다.

  </Accordion>

  <Accordion title="Codex OAuth 제한이 ChatGPT 웹과 다를 수 있는 이유는 무엇인가요?">
    Codex OAuth는 OpenAI가 관리하는, 플랜에 따라 달라지는 할당량 기간을 사용합니다. 실제로는
    동일한 계정에 연결되어 있더라도 이러한 제한이 ChatGPT 웹사이트/앱 경험과
    다를 수 있습니다.

    OpenClaw는 현재 표시되는 공급자 사용량/할당량 기간을
    `openclaw models status`에 표시할 수 있지만, ChatGPT 웹
    권한을 직접 API 액세스로 만들어내거나 정규화하지는 않습니다. 직접 OpenAI Platform
    과금/제한 경로를 원하면 API 키와 함께 `openai/*`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI 구독 인증(Codex OAuth)을 지원하나요?">
    예. OpenClaw는 **OpenAI Code (Codex) 구독 OAuth**를 완전히 지원합니다.
    OpenAI는 OpenClaw 같은 외부 도구/워크플로에서 구독 OAuth 사용을 명시적으로 허용합니다.
    Onboarding에서 OAuth 흐름을 대신 실행할 수 있습니다.

    [OAuth](/ko/concepts/oauth), [Model providers](/ko/concepts/model-providers), [Onboarding (CLI)](/ko/start/wizard)를 참조하세요.

  </Accordion>

  <Accordion title="Gemini CLI OAuth는 어떻게 설정하나요?">
    Gemini CLI는 `openclaw.json`의 클라이언트 ID나 시크릿이 아니라 **Plugin 인증 흐름**을 사용합니다.

    단계:

    1. `gemini`가 `PATH`에 있도록 Gemini CLI를 로컬에 설치합니다.
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin 활성화: `openclaw plugins enable google`
    3. 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. 로그인 후 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
    5. 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정합니다.

    이렇게 하면 Gateway 호스트의 인증 프로필에 OAuth 토큰이 저장됩니다. 자세한 내용: [Model providers](/ko/concepts/model-providers).

  </Accordion>

  <Accordion title="가벼운 채팅에 로컬 모델을 사용해도 괜찮나요?">
    보통은 아닙니다. OpenClaw에는 큰 컨텍스트와 강력한 안전성이 필요합니다. 작은 카드는 잘리고 누출됩니다. 꼭 사용해야 한다면 로컬에서 실행할 수 있는 **가장 큰** 모델 빌드(LM Studio)를 실행하고 [/gateway/local-models](/ko/gateway/local-models)를 참조하세요. 더 작거나 양자화된 모델은 프롬프트 인젝션 위험을 높입니다. [Security](/ko/gateway/security)를 참조하세요.
  </Accordion>

  <Accordion title="호스팅 모델 트래픽을 특정 리전에 유지하려면 어떻게 하나요?">
    리전 고정 엔드포인트를 선택하세요. OpenRouter는 MiniMax, Kimi, GLM에 대해 미국 호스팅 옵션을 제공합니다. 데이터를 리전 내에 유지하려면 미국 호스팅 변형을 선택하세요. `models.mode: "merge"`를 사용하면 선택한 리전 공급자를 존중하면서도 fallback을 계속 사용할 수 있도록 Anthropic/OpenAI도 함께 나열할 수 있습니다.
  </Accordion>

  <Accordion title="설치하려면 Mac Mini를 사야 하나요?">
    아니요. OpenClaw는 macOS 또는 Linux(Windows는 WSL2를 통해)에서 실행됩니다. Mac mini는 선택 사항입니다. 항상 켜져 있는 호스트로 사용하려고 구매하는 사람도 있지만, 작은 VPS, 홈 서버, Raspberry Pi급 장비도 사용할 수 있습니다.

    Mac은 **macOS 전용 도구**에만 필요합니다. iMessage의 경우 Messages에 로그인된 아무 Mac에서나 `imsg`와 함께 [iMessage](/ko/channels/imessage)를 사용하세요. Gateway가 Linux나 다른 곳에서 실행되는 경우, 해당 Mac에서 `imsg`를 실행하는 SSH 래퍼로 `channels.imessage.cliPath`를 설정하세요. 다른 macOS 전용 도구를 원하면 Gateway를 Mac에서 실행하거나 macOS 노드를 페어링하세요.

    문서: [iMessage](/ko/channels/imessage), [Nodes](/ko/nodes), [Mac remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage 지원에 Mac mini가 필요한가요?">
    Messages에 로그인된 **어떤 macOS 기기**가 필요합니다. Mac mini일 필요는 **없습니다**.
    어떤 Mac이든 작동합니다. `imsg`와 함께 **[iMessage](/ko/channels/imessage)를 사용하세요**. Gateway는 그 Mac에서 실행할 수도 있고, SSH 래퍼 `cliPath`를 사용해 다른 곳에서 실행할 수도 있습니다.

    일반적인 설정:

    - Gateway를 Linux/VPS에서 실행하고, Messages에 로그인된 Mac에서 `imsg`를 실행하는 SSH 래퍼로 `channels.imessage.cliPath`를 설정합니다.
    - 가장 단순한 단일 머신 설정을 원하면 모든 것을 Mac에서 실행합니다.

    문서: [iMessage](/ko/channels/imessage), [Nodes](/ko/nodes),
    [Mac remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw를 실행하려고 Mac mini를 사면 MacBook Pro에 연결할 수 있나요?">
    예. **Mac mini가 Gateway를 실행**할 수 있고, MacBook Pro는
    **노드**(컴패니언 기기)로 연결할 수 있습니다. 노드는 Gateway를 실행하지 않습니다. 대신 해당 기기에서 화면/카메라/캔버스 및 `system.run` 같은 추가
    기능을 제공합니다.

    일반적인 패턴:

    - Mac mini에서 Gateway 실행(항상 켜짐).
    - MacBook Pro가 macOS 앱 또는 노드 호스트를 실행하고 Gateway에 페어링.
    - `openclaw nodes status` / `openclaw nodes list`로 확인.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="Bun을 사용할 수 있나요?">
    Bun은 **권장하지 않습니다**. 특히 WhatsApp 및 Telegram에서 런타임 버그가 발생하는 것을 확인했습니다.
    안정적인 Gateway에는 **Node**를 사용하세요.

    그래도 Bun을 실험하고 싶다면 WhatsApp/Telegram이 없는 비프로덕션 Gateway에서 수행하세요.

  </Accordion>

  <Accordion title="Telegram: allowFrom에는 무엇을 넣나요?">
    `channels.telegram.allowFrom`은 **사람 발신자의 Telegram 사용자 ID**(숫자)입니다. 봇 사용자 이름이 아닙니다.

    설정은 숫자 사용자 ID만 요청합니다. 구성에 이미 레거시 `@username` 항목이 있다면 `openclaw doctor --fix`가 이를 해석하려고 시도할 수 있습니다.

    더 안전한 방법(타사 봇 없음):

    - 봇에게 DM을 보낸 다음 `openclaw logs --follow`를 실행하고 `from.id`를 읽습니다.

    공식 Bot API:

    - 봇에게 DM을 보낸 다음 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출하고 `message.from.id`를 읽습니다.

    타사(개인정보 보호가 덜함):

    - `@userinfobot` 또는 `@getidsbot`에게 DM을 보냅니다.

    [/channels/telegram](/ko/channels/telegram#access-control-and-activation)를 참조하세요.

  </Accordion>

  <Accordion title="여러 사람이 서로 다른 OpenClaw 인스턴스에서 하나의 WhatsApp 번호를 사용할 수 있나요?">
    예, **멀티 에이전트 라우팅**을 통해 가능합니다. 각 발신자의 WhatsApp **DM**(피어 `kind: "direct"`, 발신자 E.164 예: `+15551234567`)을 서로 다른 `agentId`에 바인딩하면 각 사람이 자신의 워크스페이스와 세션 저장소를 갖게 됩니다. 답장은 여전히 **동일한 WhatsApp 계정**에서 전송되며, DM 액세스 제어(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`)는 WhatsApp 계정별로 전역입니다. [Multi-Agent Routing](/ko/concepts/multi-agent) 및 [WhatsApp](/ko/channels/whatsapp)을 참조하세요.
  </Accordion>

  <Accordion title='“빠른 채팅” 에이전트와 “코딩용 Opus” 에이전트를 실행할 수 있나요?'>
    예. 멀티 에이전트 라우팅을 사용하세요. 각 에이전트에 고유한 기본 모델을 지정한 다음 인바운드 경로(공급자 계정 또는 특정 피어)를 각 에이전트에 바인딩합니다. 예시 구성은 [Multi-Agent Routing](/ko/concepts/multi-agent)에 있습니다. [Models](/ko/concepts/models) 및 [Configuration](/ko/gateway/configuration)도 참조하세요.
  </Accordion>

  <Accordion title="Homebrew는 Linux에서 작동하나요?">
    예. Homebrew는 Linux(Linuxbrew)를 지원합니다. 빠른 설정:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd를 통해 OpenClaw를 실행하는 경우, 로그인하지 않은 셸에서도 `brew`로 설치한 도구가 해석되도록 서비스 PATH에 `/home/linuxbrew/.linuxbrew/bin`(또는 사용 중인 brew 접두사)이 포함되어 있는지 확인하세요.
    최근 빌드는 Linux systemd 서비스에서 일반적인 사용자 bin 디렉터리(예: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`)도 앞에 추가하며, 설정된 경우 `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`를 따릅니다.

  </Accordion>

  <Accordion title="해킹 가능한 git 설치와 npm 설치의 차이">
    - **해킹 가능한(git) 설치:** 전체 소스 체크아웃, 편집 가능, 기여자에게 가장 적합.
      로컬에서 빌드를 실행하고 코드/문서를 패치할 수 있습니다.
    - **npm 설치:** 전역 CLI 설치, 저장소 없음, “그냥 실행”에 가장 적합.
      업데이트는 npm dist-tag에서 제공됩니다.

    문서: [Getting started](/ko/start/getting-started), [Updating](/ko/install/updating).

  </Accordion>

  <Accordion title="나중에 npm 설치와 git 설치 사이를 전환할 수 있나요?">
    예. OpenClaw가 이미 설치되어 있다면 `openclaw update --channel ...`을 사용하세요.
    이는 **데이터를 삭제하지 않습니다**. OpenClaw 코드 설치만 변경합니다.
    상태(`~/.openclaw`)와 워크스페이스(`~/.openclaw/workspace`)는 그대로 유지됩니다.

    npm에서 git으로:

    ```bash
    openclaw update --channel dev
    ```

    git에서 npm으로:

    ```bash
    openclaw update --channel stable
    ```

    먼저 계획된 모드 전환을 미리 보려면 `--dry-run`을 추가하세요. 업데이터는
    Doctor 후속 작업을 실행하고, 대상 채널의 Plugin 소스를 새로 고치며,
    `--no-restart`를 전달하지 않는 한 Gateway를 다시 시작합니다.

    설치 프로그램에서도 어느 모드든 강제할 수 있습니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    백업 팁: [Backup strategy](/ko/help/faq#where-things-live-on-disk)를 참조하세요.

  </Accordion>

  <Accordion title="Gateway를 노트북에서 실행해야 하나요, 아니면 VPS에서 실행해야 하나요?">
    짧은 답: **24/7 안정성이 필요하다면 VPS를 사용하세요**. 마찰을 최소화하고 절전/재시작을 감수할 수 있다면 로컬에서 실행하세요.

    **노트북(로컬 Gateway)**

    - **장점:** 서버 비용 없음, 로컬 파일에 직접 접근, 라이브 브라우저 창.
    - **단점:** 절전/네트워크 끊김 = 연결 해제, OS 업데이트/재부팅으로 중단, 계속 깨어 있어야 함.

    **VPS / 클라우드**

    - **장점:** 항상 켜져 있고, 네트워크가 안정적이며, 노트북 절전 문제 없이 계속 실행하기 쉽습니다.
    - **단점:** 보통 헤드리스로 실행되며(스크린샷 사용), 원격 파일 접근만 가능하고, 업데이트하려면 SSH를 사용해야 합니다.

    **OpenClaw 전용 참고:** WhatsApp/Telegram/Slack/Mattermost/Discord는 모두 VPS에서 잘 작동합니다. 실제 절충점은 **헤드리스 브라우저**와 보이는 창 중 무엇을 선택하느냐입니다. [브라우저](/ko/tools/browser)를 참고하세요.

    **권장 기본값:** 이전에 Gateway 연결 끊김이 있었다면 VPS를 사용하세요. Mac을 적극적으로 사용 중이고 로컬 파일 접근 또는 보이는 브라우저를 통한 UI 자동화가 필요하다면 로컬도 좋습니다.

  </Accordion>

  <Accordion title="전용 머신에서 OpenClaw를 실행하는 것이 얼마나 중요한가요?">
    필수는 아니지만 **안정성과 격리를 위해 권장됩니다**.

    - **전용 호스트(VPS/Mac mini/Pi):** 항상 켜져 있고, 절전/재부팅으로 인한 중단이 적으며, 권한이 더 깔끔하고, 계속 실행하기 쉽습니다.
    - **공유 노트북/데스크톱:** 테스트와 적극적인 사용에는 전혀 문제없지만, 머신이 절전 모드로 들어가거나 업데이트될 때 일시 중지를 예상해야 합니다.

    두 방식의 장점을 모두 원한다면 Gateway는 전용 호스트에 두고, 로컬 화면/카메라/exec 도구용 **Node**로 노트북을 페어링하세요. [Nodes](/ko/nodes)를 참고하세요.
    보안 지침은 [보안](/ko/gateway/security)을 읽어보세요.

  </Accordion>

  <Accordion title="최소 VPS 요구 사항과 권장 OS는 무엇인가요?">
    OpenClaw는 가볍습니다. 기본 Gateway + 채팅 채널 하나의 경우:

    - **절대 최소:** 1 vCPU, 1GB RAM, 약 500MB 디스크.
    - **권장:** 로그, 미디어, 여러 채널을 위한 여유 공간을 고려해 1-2 vCPU, 2GB RAM 이상. Node 도구와 브라우저 자동화는 리소스를 많이 사용할 수 있습니다.

    OS: **Ubuntu LTS**(또는 최신 Debian/Ubuntu)를 사용하세요. Linux 설치 경로는 여기에서 가장 잘 테스트되었습니다.

    문서: [Linux](/ko/platforms/linux), [VPS 호스팅](/ko/vps).

  </Accordion>

  <Accordion title="VM에서 OpenClaw를 실행할 수 있으며 요구 사항은 무엇인가요?">
    예. VM을 VPS와 동일하게 취급하세요. 항상 켜져 있고, 접근 가능해야 하며,
    Gateway와 활성화한 채널에 충분한 RAM이 있어야 합니다.

    기본 지침:

    - **절대 최소:** 1 vCPU, 1GB RAM.
    - **권장:** 여러 채널, 브라우저 자동화 또는 미디어 도구를 실행한다면 2GB RAM 이상.
    - **OS:** Ubuntu LTS 또는 다른 최신 Debian/Ubuntu.

    Windows를 사용 중이라면 **WSL2가 가장 쉬운 VM 스타일 설정**이며 도구
    호환성이 가장 좋습니다. [Windows](/ko/platforms/windows), [VPS 호스팅](/ko/vps)를 참고하세요.
    VM에서 macOS를 실행 중이라면 [macOS VM](/ko/install/macos-vm)을 참고하세요.

  </Accordion>
</AccordionGroup>

## 관련

- [FAQ](/ko/help/faq) — 기본 FAQ(모델, 세션, Gateway, 보안 등)
- [설치 개요](/ko/install)
- [시작하기](/ko/start/getting-started)
- [문제 해결](/ko/help/troubleshooting)
