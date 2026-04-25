---
read_when:
    - 새 설치, 멈춘 온보딩, 또는 첫 실행 오류
    - 인증 및 provider 구독 선택하기
    - '`docs.openclaw.ai`에 접근할 수 없음, 대시보드를 열 수 없음, 설치가 멈춤'
sidebarTitle: First-run FAQ
summary: 'FAQ: 빠른 시작 및 첫 실행 설정 — 설치, 온보딩, 인증, 구독, 초기 실패'
title: 'FAQ: 첫 실행 설정'
x-i18n:
    generated_at: "2026-04-25T18:19:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  빠른 시작 및 첫 실행 Q&A입니다. 일상적인 작업, 모델, 인증, 세션,
  문제 해결은 메인 [FAQ](/ko/help/faq)를 참고하세요.

  ## 빠른 시작 및 첫 실행 설정

  <AccordionGroup>
  <Accordion title="막혔습니다. 가장 빨리 해결하는 방법은 무엇인가요?">
    **내 컴퓨터를 볼 수 있는** 로컬 AI 에이전트를 사용하세요. 이는 Discord에서 묻는 것보다
    훨씬 더 효과적입니다. 대부분의 "막혔어요" 사례는 원격 도우미가 확인할 수 없는
    **로컬 구성 또는 환경 문제**이기 때문입니다.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    이런 도구는 리포지토리를 읽고, 명령을 실행하고, 로그를 검사하고, 컴퓨터 수준의
    설정(PATH, 서비스, 권한, 인증 파일) 문제를 해결하는 데 도움을 줄 수 있습니다. 해킹 가능한
    (git) 설치를 통해 **전체 소스 체크아웃**을 제공하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    이렇게 하면 OpenClaw가 **git 체크아웃에서** 설치되므로 에이전트가 코드와 문서를 읽고
    현재 실행 중인 정확한 버전에 대해 추론할 수 있습니다. 나중에 언제든
    `--install-method git` 없이 설치 프로그램을 다시 실행해 stable로 되돌릴 수 있습니다.

    팁: 에이전트에게 수정 작업을 **계획하고 감독**하게 하세요(단계별). 그런 다음 필요한
    명령만 실행하세요. 그러면 변경 사항이 작고 감사하기 쉬워집니다.

    실제 버그나 수정 사항을 발견했다면 GitHub 이슈를 등록하거나 PR을 보내주세요.
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    다음 명령으로 시작하세요(도움을 요청할 때 출력도 함께 공유하세요).

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    각 명령의 역할:

    - `openclaw status`: gateway/agent 상태와 기본 구성의 빠른 스냅샷
    - `openclaw models status`: provider 인증과 모델 사용 가능 여부 확인
    - `openclaw doctor`: 일반적인 구성/상태 문제를 검증하고 복구

    그 외 유용한 CLI 점검: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    빠른 디버그 루프: [문제가 생겼을 때 처음 60초](#first-60-seconds-if-something-is-broken).
    설치 문서: [설치](/ko/install), [설치 프로그램 플래그](/ko/install/installer), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="Heartbeat가 계속 건너뜁니다. 건너뜀 사유는 무엇을 의미하나요?">
    일반적인 Heartbeat 건너뜀 사유:

    - `quiet-hours`: 구성된 active-hours 시간대 밖
    - `empty-heartbeat-file`: `HEARTBEAT.md`가 존재하지만 빈 내용 또는 헤더만 있는 스캐폴딩만 포함
    - `no-tasks-due`: `HEARTBEAT.md` 작업 모드가 활성화되어 있지만 아직 도래한 작업 간격이 없음
    - `alerts-disabled`: 모든 heartbeat 가시성이 비활성화됨(`showOk`, `showAlerts`, `useIndicator`가 모두 꺼짐)

    작업 모드에서는 실제 heartbeat 실행이 완료된 후에만
    예정 시각이 앞으로 갱신됩니다. 건너뛴 실행은 작업을 완료된 것으로 표시하지 않습니다.

    문서: [Heartbeat](/ko/gateway/heartbeat), [자동화 및 작업](/ko/automation).

  </Accordion>

  <Accordion title="OpenClaw를 설치하고 설정하는 권장 방법은 무엇인가요?">
    이 리포지토리는 소스에서 실행하고 온보딩을 사용하는 방식을 권장합니다.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    마법사는 UI 자산도 자동으로 빌드할 수 있습니다. 온보딩 후에는 일반적으로 **18789** 포트에서 Gateway를 실행합니다.

    소스에서 실행하기(기여자/개발자):

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
    마법사는 온보딩 직후 정리 화면에 깨끗한(토큰 없는) 대시보드 URL을 출력하고 브라우저도 엽니다. 그 탭을 계속 열어두세요. 자동으로 실행되지 않았다면 같은 컴퓨터에서 출력된 URL을 복사해 붙여 넣으세요.
  </Accordion>

  <Accordion title="localhost와 원격에서는 대시보드를 어떻게 인증하나요?">
    **Localhost(같은 컴퓨터):**

    - `http://127.0.0.1:18789/`를 엽니다.
    - 공유 비밀 인증을 요구하면 구성된 토큰 또는 비밀번호를 Control UI 설정에 붙여 넣으세요.
    - 토큰 출처: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)
    - 비밀번호 출처: `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)
    - 아직 공유 비밀이 구성되지 않았다면 `openclaw doctor --generate-gateway-token`으로 토큰을 생성하세요.

    **localhost가 아닌 경우:**

    - **Tailscale Serve**(권장): 루프백 바인드를 유지하고 `openclaw gateway --tailscale serve`를 실행한 뒤 `https://<magicdns>/`를 엽니다. `gateway.auth.allowTailscale`이 `true`이면 ID 헤더가 Control UI/WebSocket 인증을 충족합니다(공유 비밀을 붙여 넣을 필요 없음, 신뢰된 gateway 호스트를 가정). HTTP API는 private-ingress `none` 또는 trusted-proxy HTTP auth를 의도적으로 사용하지 않는 한 여전히 공유 비밀 인증이 필요합니다.
      같은 클라이언트에서 동시에 발생한 잘못된 Serve 인증 시도는 실패 인증 제한기가 기록하기 전에 직렬화되므로, 두 번째 잘못된 재시도에서는 이미 `retry later`가 표시될 수 있습니다.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"`을 실행하거나(또는 비밀번호 인증을 구성) `http://<tailscale-ip>:18789/`를 연 뒤, 일치하는 공유 비밀을 대시보드 설정에 붙여 넣으세요.
    - **ID 인지 역방향 프록시**: Gateway를 비루프백 trusted proxy 뒤에 두고 `gateway.auth.mode: "trusted-proxy"`를 구성한 뒤 프록시 URL을 엽니다.
    - **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@host`를 실행한 뒤 `http://127.0.0.1:18789/`를 엽니다. 터널을 통해서도 공유 비밀 인증은 계속 적용되므로, 메시지가 뜨면 구성된 토큰 또는 비밀번호를 붙여 넣으세요.

    바인드 모드와 인증 세부 사항은 [대시보드](/ko/web/dashboard) 및 [웹 surface](/ko/web)를 참고하세요.

  </Accordion>

  <Accordion title="채팅 승인에는 왜 exec approval 구성이 두 개 있나요?">
    서로 다른 계층을 제어합니다.

    - `approvals.exec`: 승인 프롬프트를 채팅 대상에 전달
    - `channels.<channel>.execApprovals`: 해당 채널이 exec approval용 기본 승인 클라이언트처럼 동작하도록 함

    호스트 exec 정책은 여전히 실제 승인 게이트입니다. 채팅 구성은 승인
    프롬프트가 어디에 표시되는지와 사용자가 어떻게 응답할 수 있는지만 제어합니다.

    대부분의 설정에서는 둘 다 **필요하지 않습니다**.

    - 채팅이 이미 명령과 답글을 지원한다면 동일 채팅의 `/approve`가 공용 경로를 통해 작동합니다.
    - 지원되는 기본 채널이 승인자를 안전하게 추론할 수 있다면, OpenClaw는 이제 `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`일 때 DM 우선 기본 승인을 자동으로 활성화합니다.
    - 기본 승인 카드/버튼을 사용할 수 있을 때는 그 기본 UI가 기본 경로입니다. 도구 결과에서 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 표시되지 않는 한, 에이전트는 수동 `/approve` 명령을 포함하지 않아야 합니다.
    - 프롬프트를 다른 채팅이나 명시적인 운영자 방에도 전달해야 할 때만 `approvals.exec`를 사용하세요.
    - 승인 프롬프트를 원래 방/토픽에도 다시 게시하려는 경우에만 `channels.<channel>.execApprovals.target: "channel"` 또는 `"both"`를 사용하세요.
    - Plugin 승인은 또 별개입니다. 기본적으로 동일 채팅 `/approve`를 사용하고, 선택적으로 `approvals.plugin` 전달을 사용하며, 일부 기본 채널만 추가로 plugin-approval-native 처리를 유지합니다.

    짧게 말해, 전달은 라우팅용이고 기본 클라이언트 구성은 더 풍부한 채널별 UX용입니다.
    [Exec Approvals](/ko/tools/exec-approvals)를 참고하세요.

  </Accordion>

  <Accordion title="어떤 런타임이 필요한가요?">
    Node **>= 22**가 필요합니다. `pnpm`을 권장합니다. Gateway에는 Bun을 **권장하지 않습니다**.
  </Accordion>

  <Accordion title="Raspberry Pi에서 실행되나요?">
    예. Gateway는 가볍습니다. 문서에는 개인 사용 기준으로 **512MB-1GB RAM**, **1 코어**, 약 **500MB**
    디스크면 충분하다고 되어 있으며, **Raspberry Pi 4에서 실행 가능**하다고 명시되어 있습니다.

    여유 공간(로그, 미디어, 기타 서비스)을 더 원한다면 **2GB를 권장**하지만,
    필수 최소값은 아닙니다.

    팁: 작은 Pi/VPS가 Gateway를 호스팅하고, 노트북/휴대폰에서 **Node**를 페어링해
    로컬 화면/카메라/캔버스 또는 명령 실행에 사용할 수 있습니다. [Node](/ko/nodes)를 참고하세요.

  </Accordion>

  <Accordion title="Raspberry Pi 설치 팁이 있나요?">
    짧게 말하면, 작동은 하지만 거친 부분이 있을 수 있습니다.

    - **64비트** OS를 사용하고 Node >= 22를 유지하세요.
    - 로그를 보고 빠르게 업데이트할 수 있도록 **해킹 가능한(git) 설치**를 권장합니다.
    - 채널/Skills 없이 시작한 다음 하나씩 추가하세요.
    - 이상한 바이너리 문제가 생기면 보통 **ARM 호환성** 문제입니다.

    문서: [Linux](/ko/platforms/linux), [설치](/ko/install).

  </Accordion>

  <Accordion title="wake up my friend에서 멈췄습니다 / 온보딩이 hatch되지 않습니다. 어떻게 해야 하나요?">
    그 화면은 Gateway에 도달 가능하고 인증이 되는지에 의존합니다. TUI도 첫 hatch 때
    자동으로 "Wake up, my friend!"를 보냅니다. 그 줄이 보이는데도 **답변이 없고**
    토큰이 0에 머무르면, 에이전트가 실행되지 않은 것입니다.

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

    3. 여전히 멈춘다면 다음을 실행하세요.

    ```bash
    openclaw doctor
    ```

    Gateway가 원격에 있다면 터널/Tailscale 연결이 살아 있는지, 그리고 UI가
    올바른 Gateway를 가리키는지 확인하세요. [원격 액세스](/ko/gateway/remote)를 참고하세요.

  </Accordion>

  <Accordion title="설정을 새 컴퓨터(Mac mini)로 옮길 때 온보딩을 다시 하지 않고 마이그레이션할 수 있나요?">
    예. **상태 디렉터리**와 **워크스페이스**를 복사한 뒤 Doctor를 한 번 실행하세요. 이렇게 하면
    **두 위치를 모두** 복사하는 한 봇을 "정확히 동일하게"(메모리, 세션 기록, 인증, 채널
    상태 포함) 유지할 수 있습니다.

    1. 새 컴퓨터에 OpenClaw를 설치합니다.
    2. 이전 컴퓨터에서 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`)를 복사합니다.
    3. 워크스페이스(기본값: `~/.openclaw/workspace`)를 복사합니다.
    4. `openclaw doctor`를 실행하고 Gateway 서비스를 재시작합니다.

    이렇게 하면 구성, 인증 프로필, WhatsApp 자격 증명, 세션, 메모리가 유지됩니다. 원격
    모드인 경우 세션 저장소와 워크스페이스는 gateway 호스트가 소유한다는 점을 기억하세요.

    **중요:** 워크스페이스만 GitHub에 커밋/푸시하면 **메모리 + 부트스트랩 파일**은 백업되지만
    **세션 기록이나 인증**은 백업되지 않습니다. 이들은 `~/.openclaw/` 아래에 있습니다
    (예: `~/.openclaw/agents/<agentId>/sessions/`).

    관련 문서: [마이그레이션](/ko/install/migrating), [디스크에서 파일이 위치하는 곳](#where-things-live-on-disk),
    [에이전트 워크스페이스](/ko/concepts/agent-workspace), [Doctor](/ko/gateway/doctor),
    [원격 모드](/ko/gateway/remote).

  </Accordion>

  <Accordion title="최신 버전의 새 기능은 어디에서 볼 수 있나요?">
    GitHub changelog를 확인하세요.
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    최신 항목이 맨 위에 있습니다. 맨 위 섹션에 **Unreleased**라고 표시되어 있으면 그 다음 날짜가 있는
    섹션이 최신 출시 버전입니다. 항목은 **Highlights**, **Changes**, **Fixes**로
    그룹화되어 있으며(필요한 경우 docs/기타 섹션도 포함), 있습니다.

  </Accordion>

  <Accordion title="`docs.openclaw.ai`에 접근할 수 없습니다(SSL 오류)">
    일부 Comcast/Xfinity 연결은 Xfinity
    Advanced Security를 통해 `docs.openclaw.ai`를 잘못 차단합니다. 이를 비활성화하거나
    `docs.openclaw.ai`를 허용 목록에 추가한 뒤 다시 시도하세요.
    차단 해제에 도움이 되도록 여기에서 신고해 주세요: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    그래도 사이트에 접근할 수 없다면 문서는 GitHub에도 미러링되어 있습니다.
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable과 beta의 차이">
    **stable**과 **beta**는 별도의 코드 라인이 아니라 **npm dist-tag**입니다.

    - `latest` = stable
    - `beta` = 테스트용 초기 빌드

    일반적으로 stable 릴리스는 먼저 **beta**에 올라간 뒤, 명시적인
    승격 단계에서 동일한 버전이 `latest`로 이동합니다. 유지관리자가 필요에 따라
    바로 `latest`로 게시할 수도 있습니다. 그래서 승격 후에는 beta와 stable이
    **같은 버전**을 가리킬 수 있습니다.

    변경 사항 확인:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    설치 원라이너와 beta와 dev의 차이는 아래 아코디언을 참고하세요.

  </Accordion>

  <Accordion title="beta 버전은 어떻게 설치하나요? 그리고 beta와 dev의 차이는 무엇인가요?">
    **Beta**는 npm dist-tag `beta`입니다(승격 후 `latest`와 같을 수 있음).
    **Dev**는 `main`의 이동하는 헤드(git)이며, 게시될 때는 npm dist-tag `dev`를 사용합니다.

    원라이너(macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 설치 프로그램(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    자세한 내용: [개발 채널](/ko/install/development-channels) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="최신 기능은 어떻게 써볼 수 있나요?">
    두 가지 방법이 있습니다.

    1. **Dev 채널(git 체크아웃):**

    ```bash
    openclaw update --channel dev
    ```

    이렇게 하면 `main` 브랜치로 전환되고 소스에서 업데이트됩니다.

    2. **해킹 가능한 설치(설치 사이트에서):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    그러면 로컬 리포지토리를 얻게 되고, 이를 편집한 뒤 git으로 업데이트할 수 있습니다.

    직접 깔끔하게 클론하고 싶다면 다음을 사용하세요.

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

    멈춘 경우 [설치 프로그램 멈춤](#quick-start-and-first-run-setup)과
    [막혔습니다](#quick-start-and-first-run-setup)의 빠른 디버그 루프를 사용하세요.

  </Accordion>

  <Accordion title="설치 프로그램이 멈췄나요? 더 많은 피드백을 보려면 어떻게 하나요?">
    설치 프로그램을 **자세한 출력**으로 다시 실행하세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    verbose를 사용한 beta 설치:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    해킹 가능한(git) 설치의 경우:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows(PowerShell) 대응:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    더 많은 옵션: [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Windows 설치에서 git not found 또는 openclaw not recognized가 표시됩니다">
    Windows에서 흔한 문제 두 가지:

    **1) npm error spawn git / git not found**

    - **Git for Windows**를 설치하고 `git`이 PATH에 있는지 확인하세요.
    - PowerShell을 닫았다가 다시 열고 설치 프로그램을 다시 실행하세요.

    **2) 설치 후 openclaw is not recognized**

    - npm 전역 bin 폴더가 PATH에 없습니다.
    - 경로를 확인하세요.

      ```powershell
      npm config get prefix
      ```

    - 해당 디렉터리를 사용자 PATH에 추가하세요(Windows에서는 `\bin` 접미사가 필요 없으며, 대부분의 시스템에서는 `%AppData%\npm`입니다).
    - PATH를 업데이트한 뒤 PowerShell을 닫았다가 다시 여세요.

    가장 매끄러운 Windows 설정을 원한다면 네이티브 Windows 대신 **WSL2**를 사용하세요.
    문서: [Windows](/ko/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec 출력에 깨진 중국어 텍스트가 보입니다. 어떻게 해야 하나요?">
    보통 네이티브 Windows 셸의 콘솔 코드 페이지 불일치 문제입니다.

    증상:

    - `system.run`/`exec` 출력에서 중국어가 깨져 보임
    - 같은 명령이 다른 터미널 프로필에서는 정상적으로 보임

    PowerShell에서의 빠른 해결 방법:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    그런 다음 Gateway를 재시작하고 명령을 다시 시도하세요.

    ```powershell
    openclaw gateway restart
    ```

    최신 OpenClaw에서도 이 문제가 계속 재현된다면 다음에서 추적/제보하세요.

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="문서가 제 질문에 답하지 못했습니다. 더 나은 답을 얻으려면 어떻게 하나요?">
    전체 소스와 문서를 로컬에서 사용할 수 있도록 **해킹 가능한(git) 설치**를 한 다음,
    리포지토리를 읽고 정확하게 답할 수 있도록 _그 폴더에서_
    봇(또는 Claude/Codex)에게 물어보세요.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    자세한 내용: [설치](/ko/install) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Linux에 OpenClaw는 어떻게 설치하나요?">
    짧은 답: Linux 가이드를 따른 뒤 온보딩을 실행하세요.

    - Linux 빠른 경로 + 서비스 설치: [Linux](/ko/platforms/linux)
    - 전체 안내: [시작하기](/ko/start/getting-started)
    - 설치 프로그램 + 업데이트: [설치 및 업데이트](/ko/install/updating)

  </Accordion>

  <Accordion title="VPS에 OpenClaw는 어떻게 설치하나요?">
    모든 Linux VPS에서 작동합니다. 서버에 설치한 뒤 SSH/Tailscale로 Gateway에 접속하세요.

    가이드: [exe.dev](/ko/install/exe-dev), [Hetzner](/ko/install/hetzner), [Fly.io](/ko/install/fly).
    원격 액세스: [Gateway 원격](/ko/gateway/remote).

  </Accordion>

  <Accordion title="클라우드/VPS 설치 가이드는 어디에 있나요?">
    일반적인 provider를 모아둔 **호스팅 허브**가 있습니다. 하나를 선택해 가이드를 따르세요.

    - [VPS 호스팅](/ko/vps) (모든 provider를 한곳에)
    - [Fly.io](/ko/install/fly)
    - [Hetzner](/ko/install/hetzner)
    - [exe.dev](/ko/install/exe-dev)

    클라우드에서의 동작 방식: **Gateway는 서버에서 실행**되고, 노트북/휴대폰에서
    Control UI(또는 Tailscale/SSH)를 통해 접속합니다. 상태와 워크스페이스는
    서버에 있으므로, 호스트를 기준 정보로 취급하고 백업하세요.

    **Node**(Mac/iOS/Android/headless)를 해당 클라우드 Gateway에 페어링해서
    Gateway는 클라우드에 유지하면서도 로컬 화면/카메라/캔버스에 접근하거나
    노트북에서 명령을 실행할 수 있습니다.

    허브: [플랫폼](/ko/platforms). 원격 액세스: [Gateway 원격](/ko/gateway/remote).
    Node: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw에게 스스로 업데이트하라고 시킬 수 있나요?">
    짧은 답: **가능하지만 권장하지는 않습니다**. 업데이트 과정에서
    Gateway가 재시작될 수 있고(활성 세션이 끊김), 깨끗한 git 체크아웃이 필요할 수 있으며,
    확인 프롬프트가 표시될 수도 있습니다. 더 안전한 방법은 운영자가 셸에서 업데이트를 실행하는 것입니다.

    CLI 사용:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    에이전트에서 반드시 자동화해야 한다면:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    문서: [업데이트](/ko/cli/update), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="온보딩은 실제로 무엇을 하나요?">
    `openclaw onboard`는 권장 설정 경로입니다. **로컬 모드**에서는 다음을 안내합니다.

    - **모델/인증 설정**(provider OAuth, API 키, Anthropic setup-token, LM Studio 같은 로컬 모델 옵션 포함)
    - **워크스페이스** 위치 + 부트스트랩 파일
    - **Gateway 설정**(bind/port/auth/tailscale)
    - **채널**(WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, QQ Bot 같은 번들 채널 Plugin 포함)
    - **데몬 설치**(macOS의 LaunchAgent, Linux/WSL2의 systemd user unit)
    - **상태 점검** 및 **Skills** 선택

    또한 구성된 모델을 알 수 없거나 인증이 없으면 경고합니다.

  </Accordion>

  <Accordion title="이걸 실행하려면 Claude 또는 OpenAI 구독이 필요한가요?">
    아닙니다. OpenClaw는 **API 키**(Anthropic/OpenAI/기타)로 실행할 수도 있고,
    데이터가 기기에 남도록 **로컬 전용 모델**로도 실행할 수 있습니다. 구독(Claude
    Pro/Max 또는 OpenAI Codex)은 해당 provider에 인증하는 선택적 방법입니다.

    OpenClaw에서 Anthropic은 실질적으로 다음과 같이 나뉩니다.

    - **Anthropic API 키**: 일반 Anthropic API 과금
    - **OpenClaw의 Claude CLI / Claude 구독 인증**: Anthropic 직원이
      이 사용 방식이 다시 허용된다고 알려왔고, Anthropic이 새로운
      정책을 게시하지 않는 한 OpenClaw는 이 통합에서 `claude -p`
      사용을 허용된 것으로 취급합니다

    오래 실행되는 gateway 호스트의 경우에는 Anthropic API 키가 여전히 더
    예측 가능한 설정입니다. OpenAI Codex OAuth는 OpenClaw 같은 외부
    도구에 대해 명시적으로 지원됩니다.

    OpenClaw는 그 외에도 다음을 포함한 다른 호스팅형 구독 스타일 옵션을 지원합니다.
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**,
    **Z.AI / GLM Coding Plan**.

    문서: [Anthropic](/ko/providers/anthropic), [OpenAI](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen),
    [MiniMax](/ko/providers/minimax), [GLM Models](/ko/providers/glm),
    [로컬 모델](/ko/gateway/local-models), [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="API 키 없이 Claude Max 구독을 사용할 수 있나요?">
    예.

    Anthropic 직원이 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려왔으므로,
    Anthropic이 새로운 정책을 게시하지 않는 한 OpenClaw는 Claude 구독 인증과
    `claude -p` 사용을 이 통합에 대해 허용된 것으로 취급합니다. 가장 예측 가능한
    서버 측 설정을 원한다면 대신 Anthropic API 키를 사용하세요.

  </Accordion>

  <Accordion title="Claude 구독 인증(Claude Pro 또는 Max)을 지원하나요?">
    예.

    Anthropic 직원이 이 사용 방식이 다시 허용된다고 알려왔으므로, OpenClaw는
    Anthropic이 새로운 정책을 게시하지 않는 한 Claude CLI 재사용과
    `claude -p` 사용을 이 통합에 대해 허용된 것으로 취급합니다.

    Anthropic setup-token도 여전히 OpenClaw에서 지원되는 토큰 경로로 제공되지만, OpenClaw는 이제 가능할 때 Claude CLI 재사용과 `claude -p`를 우선합니다.
    프로덕션 또는 다중 사용자 워크로드의 경우에는 Anthropic API 키 인증이 여전히 더
    안전하고 예측 가능한 선택입니다. OpenClaw에서 다른 구독 스타일의 호스팅 옵션을 원한다면
    [OpenAI](/ko/providers/openai), [Qwen / Model
    Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [GLM
    Models](/ko/providers/glm)를 참고하세요.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic에서 HTTP 429 rate_limit_error가 표시되는 이유는 무엇인가요?">
    이는 현재 윈도우에서 **Anthropic 할당량/속도 제한**이 소진되었음을 의미합니다. **Claude CLI**를
    사용 중이라면 윈도우가 재설정될 때까지 기다리거나 요금제를 업그레이드하세요. **Anthropic API 키**를
    사용 중이라면 Anthropic Console에서
    사용량/과금을 확인하고 필요하면 제한을 올리세요.

    메시지가 구체적으로 다음과 같다면:
    `Extra usage is required for long context requests`, 이는 요청이
    Anthropic의 1M 컨텍스트 베타(`context1m: true`)를 사용하려는 것입니다. 이는
    자격 증명이 장문 컨텍스트 과금 대상일 때만 작동합니다(API 키 과금 또는
    Extra Usage가 활성화된 OpenClaw Claude 로그인 경로).

    팁: **대체 모델**을 설정해 두면 provider가 속도 제한에 걸려도 OpenClaw가 계속 답변할 수 있습니다.
    [모델](/ko/cli/models), [OAuth](/ko/concepts/oauth), 그리고
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)를 참고하세요.

  </Accordion>

  <Accordion title="AWS Bedrock을 지원하나요?">
    예. OpenClaw에는 번들된 **Amazon Bedrock (Converse)** provider가 있습니다. AWS env 마커가 있으면 OpenClaw가 스트리밍/텍스트 Bedrock 카탈로그를 자동으로 검색해 암시적 `amazon-bedrock` provider로 병합할 수 있습니다. 그렇지 않으면 `plugins.entries.amazon-bedrock.config.discovery.enabled`를 명시적으로 활성화하거나 수동 provider 항목을 추가할 수 있습니다. [Amazon Bedrock](/ko/providers/bedrock) 및 [모델 provider](/ko/providers/models)를 참고하세요. 관리형 키 흐름을 선호한다면 Bedrock 앞단에 OpenAI 호환 프록시를 두는 것도 여전히 유효한 선택지입니다.
  </Accordion>

  <Accordion title="Codex 인증은 어떻게 동작하나요?">
    OpenClaw는 OAuth(ChatGPT 로그인)를 통해 **OpenAI Code (Codex)**를 지원합니다. 기본 PI runner를 통한
    Codex OAuth에는 `openai-codex/gpt-5.5`를 사용하세요.
    직접 OpenAI API 키에 접근하려면 `openai/gpt-5.5`를 사용하세요. GPT-5.5는
    `openai-codex/gpt-5.5`를 통한 구독/OAuth도 사용할 수 있고, 또는
    `openai/gpt-5.5`와 `embeddedHarness.runtime: "codex"`를 사용하는 기본 Codex app-server
    실행도 사용할 수 있습니다.
    [모델 provider](/ko/concepts/model-providers) 및 [온보딩(CLI)](/ko/start/wizard)를 참고하세요.
  </Accordion>

  <Accordion title="왜 OpenClaw는 아직도 openai-codex를 언급하나요?">
    `openai-codex`는 ChatGPT/Codex OAuth용 provider 및 auth-profile ID입니다.
    또한 Codex OAuth용 명시적 PI 모델 접두사이기도 합니다.

    - `openai/gpt-5.5` = PI에서 현재 직접 OpenAI API 키 경로
    - `openai-codex/gpt-5.5` = PI에서 Codex OAuth 경로
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = 기본 Codex app-server 경로
    - `openai-codex:...` = 모델 참조가 아니라 auth profile ID

    직접 OpenAI Platform 과금/제한 경로를 원한다면
    `OPENAI_API_KEY`를 설정하세요. ChatGPT/Codex 구독 인증을 원한다면
    `openclaw models auth login --provider openai-codex`로 로그인하고
    PI 실행에는 `openai-codex/*` 모델 참조를 사용하세요.

  </Accordion>

  <Accordion title="Codex OAuth 제한이 ChatGPT 웹과 다른 이유는 무엇인가요?">
    Codex OAuth는 OpenAI가 관리하는, 요금제에 따라 달라지는 할당량 윈도우를 사용합니다. 실제로는
    둘 다 같은 계정에 연결되어 있더라도 해당 제한은 ChatGPT 웹사이트/앱 경험과
    다를 수 있습니다.

    OpenClaw는 현재 보이는 provider 사용량/할당량 윈도우를
    `openclaw models status`에 표시할 수 있지만, ChatGPT 웹
    권한을 직접 API 액세스로 임의 생성하거나 정규화하지는 않습니다. 직접 OpenAI Platform
    과금/제한 경로를 원한다면 API 키와 함께 `openai/*`를 사용하세요.

  </Accordion>

  <Accordion title="OpenAI 구독 인증(Codex OAuth)을 지원하나요?">
    예. OpenClaw는 **OpenAI Code (Codex) 구독 OAuth**를 완전히 지원합니다.
    OpenAI는 OpenClaw 같은 외부 도구/워크플로에서의 구독 OAuth 사용을
    명시적으로 허용합니다. 온보딩이 OAuth 흐름을 대신 실행해 줄 수 있습니다.

    [OAuth](/ko/concepts/oauth), [모델 provider](/ko/concepts/model-providers), [온보딩(CLI)](/ko/start/wizard)를 참고하세요.

  </Accordion>

  <Accordion title="Gemini CLI OAuth는 어떻게 설정하나요?">
    Gemini CLI는 `openclaw.json`의 client id나 secret이 아니라 **Plugin 인증 흐름**을 사용합니다.

    단계:

    1. `gemini`가 `PATH`에 있도록 Gemini CLI를 로컬에 설치합니다
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin을 활성화합니다: `openclaw plugins enable google`
    3. 로그인합니다: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. 로그인 후 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
    5. 요청이 실패하면 gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정합니다

    이렇게 하면 OAuth 토큰이 gateway 호스트의 auth profile에 저장됩니다. 자세한 내용은 [모델 provider](/ko/concepts/model-providers)를 참고하세요.

  </Accordion>

  <Accordion title="가벼운 채팅에는 로컬 모델도 괜찮나요?">
    보통은 아닙니다. OpenClaw에는 큰 컨텍스트와 강한 안전성이 필요합니다. 작은 카드에서는 잘림이 발생하고 누수가 생깁니다. 꼭 써야 한다면 로컬에서 가능한 **가장 큰** 모델 빌드(LM Studio)를 실행하고 [/gateway/local-models](/ko/gateway/local-models)를 참고하세요. 더 작은/양자화된 모델은 프롬프트 인젝션 위험을 높입니다. [보안](/ko/gateway/security)을 참고하세요.
  </Accordion>

  <Accordion title="호스팅된 모델 트래픽을 특정 지역에 유지하려면 어떻게 하나요?">
    지역 고정 엔드포인트를 선택하세요. OpenRouter는 MiniMax, Kimi, GLM에 대해 미국 호스팅 옵션을 제공하므로, 데이터를 해당 지역에 유지하려면 미국 호스팅 변형을 선택하세요. 선택한 지역 provider를 유지하면서도 대체 모델을 사용할 수 있도록 `models.mode: "merge"`를 사용해 Anthropic/OpenAI를 함께 나열할 수 있습니다.
  </Accordion>

  <Accordion title="이걸 설치하려면 Mac Mini를 사야 하나요?">
    아니요. OpenClaw는 macOS 또는 Linux에서 실행되며(Windows는 WSL2를 통해 지원), Mac mini는 선택 사항입니다. 일부 사용자는 항상 켜져 있는 호스트로 사용하려고 구매하지만, 작은 VPS, 홈 서버, 또는 Raspberry Pi급 장비도 충분히 가능합니다.

    **macOS 전용 도구**에만 Mac이 필요합니다. iMessage에는 [BlueBubbles](/ko/channels/bluebubbles)를 사용하세요(권장). BlueBubbles 서버는 어떤 Mac에서도 실행되고, Gateway는 Linux나 다른 곳에서 실행될 수 있습니다. 다른 macOS 전용 도구가 필요하다면 Gateway를 Mac에서 실행하거나 macOS Node를 페어링하세요.

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Node](/ko/nodes), [Mac 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage를 지원하려면 Mac mini가 필요한가요?">
    Messages에 로그인된 **어떤 macOS 디바이스**는 필요합니다. **Mac mini일 필요는 없고**
    어떤 Mac이든 가능합니다. iMessage에는 **[BlueBubbles](/ko/channels/bluebubbles)**를 사용하세요(권장). BlueBubbles 서버는 macOS에서 실행되고, Gateway는 Linux나 다른 곳에서 실행될 수 있습니다.

    일반적인 구성:

    - Gateway는 Linux/VPS에서 실행하고, BlueBubbles 서버는 Messages에 로그인된 아무 Mac에서나 실행
    - 가장 단순한 단일 장비 구성을 원한다면 Mac에서 모든 것을 실행

    문서: [BlueBubbles](/ko/channels/bluebubbles), [Node](/ko/nodes),
    [Mac 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw 실행용으로 Mac mini를 사면 MacBook Pro에 연결할 수 있나요?">
    예. **Mac mini는 Gateway를 실행**할 수 있고, MacBook Pro는
    **Node**(보조 디바이스)로 연결할 수 있습니다. Node는 Gateway를 실행하지 않고,
    해당 디바이스에서 화면/카메라/캔버스와 `system.run` 같은 추가 기능을 제공합니다.

    일반적인 패턴:

    - Gateway는 Mac mini에서 실행(항상 켜짐)
    - MacBook Pro는 macOS 앱 또는 node host를 실행하고 Gateway와 페어링
    - 확인에는 `openclaw nodes status` / `openclaw nodes list` 사용

    문서: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="Bun을 사용할 수 있나요?">
    Bun은 **권장하지 않습니다**. 특히 WhatsApp과 Telegram에서 런타임 버그가 관찰됩니다.
    안정적인 Gateway에는 **Node**를 사용하세요.

    그래도 Bun을 실험해 보고 싶다면 WhatsApp/Telegram 없이
    비프로덕션 gateway에서만 사용하세요.

  </Accordion>

  <Accordion title="Telegram: allowFrom에는 무엇이 들어가나요?">
    `channels.telegram.allowFrom`은 **사람 발신자의 Telegram 사용자 ID**(숫자)입니다. 봇 사용자 이름이 아닙니다.

    설정에서는 숫자 사용자 ID만 요청합니다. 구성에 이미 레거시 `@username` 항목이 있다면 `openclaw doctor --fix`가 이를 해석해 보도록 시도할 수 있습니다.

    더 안전한 방법(서드파티 봇 없음):

    - 봇에 DM을 보낸 뒤 `openclaw logs --follow`를 실행하고 `from.id`를 읽으세요.

    공식 Bot API:

    - 봇에 DM을 보낸 뒤 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출하고 `message.from.id`를 읽으세요.

    서드파티(프라이버시는 더 낮음):

    - `@userinfobot` 또는 `@getidsbot`에 DM을 보내세요.

    [/channels/telegram](/ko/channels/telegram#access-control-and-activation)을 참고하세요.

  </Accordion>

  <Accordion title="여러 사람이 하나의 WhatsApp 번호를 서로 다른 OpenClaw 인스턴스로 사용할 수 있나요?">
    예, **다중 에이전트 라우팅**을 통해 가능합니다. 각 발신자의 WhatsApp **DM**(peer `kind: "direct"`, 발신자 E.164 예: `+15551234567`)을 서로 다른 `agentId`에 바인딩하면 각 사용자에게 별도의 워크스페이스와 세션 저장소를 제공할 수 있습니다. 답장은 여전히 **같은 WhatsApp 계정**에서 오며, DM 액세스 제어(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`)는 WhatsApp 계정별로 전역 적용됩니다. [다중 에이전트 라우팅](/ko/concepts/multi-agent) 및 [WhatsApp](/ko/channels/whatsapp)을 참고하세요.
  </Accordion>

  <Accordion title='“빠른 채팅” 에이전트와 “코딩용 Opus” 에이전트를 함께 실행할 수 있나요?'>
    예. 다중 에이전트 라우팅을 사용하세요. 각 에이전트에 자체 기본 모델을 부여한 다음, 수신 라우트(provider 계정 또는 특정 peer)를 각 에이전트에 바인딩하면 됩니다. 예시 구성은 [다중 에이전트 라우팅](/ko/concepts/multi-agent)에 있습니다. [모델](/ko/concepts/models) 및 [구성](/ko/gateway/configuration)도 참고하세요.
  </Accordion>

  <Accordion title="Linux에서 Homebrew가 동작하나요?">
    예. Homebrew는 Linux(Linuxbrew)를 지원합니다. 빠른 설정:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw를 systemd로 실행한다면 서비스 PATH에 `/home/linuxbrew/.linuxbrew/bin`(또는 사용 중인 brew prefix)이 포함되어 있어야 비로그인 셸에서 `brew`로 설치한 도구를 찾을 수 있습니다.
    최근 빌드는 Linux systemd 서비스에서 일반적인 사용자 bin 디렉터리(예: `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`)도 앞에 추가하며, 설정된 경우 `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`도 존중합니다.

  </Accordion>

  <Accordion title="해킹 가능한 git 설치와 npm install의 차이">
    - **해킹 가능한(git) 설치:** 전체 소스 체크아웃, 수정 가능, 기여자에게 가장 적합.
      로컬에서 빌드를 실행하고 코드/문서를 수정할 수 있습니다.
    - **npm install:** 전역 CLI 설치, 리포지토리 없음, “그냥 실행”에 가장 적합.
      업데이트는 npm dist-tag에서 옵니다.

    문서: [시작하기](/ko/start/getting-started), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="나중에 npm 설치와 git 설치를 전환할 수 있나요?">
    예. 다른 형태를 설치한 뒤 Doctor를 실행하면 gateway 서비스가 새 엔트리포인트를 가리키도록 바뀝니다.
    이 과정에서 **데이터는 삭제되지 않습니다**. 바뀌는 것은 OpenClaw 코드 설치뿐입니다. 상태
    (`~/.openclaw`)와 워크스페이스(`~/.openclaw/workspace`)는 그대로 유지됩니다.

    npm에서 git으로:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git에서 npm으로:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor는 gateway 서비스 엔트리포인트 불일치를 감지하고 현재 설치와 일치하도록 서비스 구성을 다시 쓰도록 제안합니다(자동화에서는 `--repair` 사용).

    백업 팁: [백업 전략](#where-things-live-on-disk)을 참고하세요.

  </Accordion>

  <Accordion title="Gateway는 노트북에서 실행해야 하나요, 아니면 VPS에서 실행해야 하나요?">
    짧은 답: **24/7 신뢰성이 필요하다면 VPS를 사용하세요**. 가장
    마찰이 적은 구성이 필요하고 절전/재시작을 감수할 수 있다면 로컬에서 실행하세요.

    **노트북(로컬 Gateway)**

    - **장점:** 서버 비용 없음, 로컬 파일에 직접 접근 가능, 실시간 브라우저 창 사용 가능
    - **단점:** 절전/네트워크 끊김 = 연결 끊김, OS 업데이트/재부팅으로 중단, 항상 깨어 있어야 함

    **VPS / 클라우드**

    - **장점:** 항상 켜짐, 안정적인 네트워크, 노트북 절전 문제 없음, 계속 실행하기 쉬움
    - **단점:** 보통 헤드리스로 실행(스크린샷 사용), 원격 파일 액세스만 가능, 업데이트 시 SSH 필요

    **OpenClaw 관련 참고:** WhatsApp/Telegram/Slack/Mattermost/Discord는 모두 VPS에서도 잘 동작합니다. 실제 차이는 **헤드리스 브라우저**와 보이는 창 사이뿐입니다. [브라우저](/ko/tools/browser)를 참고하세요.

    **권장 기본값:** 이전에 gateway 연결 끊김이 있었다면 VPS를 사용하세요. 로컬은 Mac을 적극적으로 사용 중이고 로컬 파일 액세스나 보이는 브라우저를 이용한 UI 자동화를 원할 때 매우 좋습니다.

  </Accordion>

  <Accordion title="전용 장비에서 OpenClaw를 실행하는 것이 얼마나 중요한가요?">
    필수는 아니지만, **신뢰성과 격리를 위해 권장됩니다**.

    - **전용 호스트(VPS/Mac mini/Pi):** 항상 켜짐, 절전/재부팅으로 인한 중단이 적음, 더 깔끔한 권한 관리, 계속 실행 상태를 유지하기 쉬움
    - **공용 노트북/데스크톱:** 테스트와 적극적인 사용에는 전혀 괜찮지만, 장비가 절전되거나 업데이트되면 일시 중지를 예상해야 함

    두 세계의 장점을 모두 원한다면 Gateway는 전용 호스트에 두고, 노트북은 로컬 화면/카메라/exec 도구용 **Node**로 페어링하세요. [Node](/ko/nodes)를 참고하세요.
    보안 지침은 [보안](/ko/gateway/security)을 읽어보세요.

  </Accordion>

  <Accordion title="최소 VPS 요구 사항과 권장 OS는 무엇인가요?">
    OpenClaw는 가볍습니다. 기본 Gateway + 채팅 채널 하나 기준:

    - **절대 최소:** 1 vCPU, 1GB RAM, 약 500MB 디스크
    - **권장:** 여유 공간(로그, 미디어, 여러 채널)을 위해 1-2 vCPU, 2GB RAM 이상. Node 도구와 브라우저 자동화는 리소스를 많이 사용할 수 있습니다.

    OS는 **Ubuntu LTS**(또는 최신 Debian/Ubuntu)를 사용하세요. Linux 설치 경로는 그 환경에서 가장 잘 검증되어 있습니다.

    문서: [Linux](/ko/platforms/linux), [VPS 호스팅](/ko/vps).

  </Accordion>

  <Accordion title="VM에서 OpenClaw를 실행할 수 있나요? 요구 사항은 무엇인가요?">
    예. VM은 VPS와 동일하게 취급하세요. 항상 켜져 있어야 하고, 접근 가능해야 하며,
    Gateway와 활성화한 채널을 실행할 충분한 RAM이 필요합니다.

    기본 지침:

    - **절대 최소:** 1 vCPU, 1GB RAM
    - **권장:** 여러 채널, 브라우저 자동화, 미디어 도구를 실행한다면 2GB RAM 이상
    - **OS:** Ubuntu LTS 또는 다른 최신 Debian/Ubuntu

    Windows를 사용 중이라면 **WSL2가 가장 쉬운 VM 스타일 설정**이며 도구 호환성도 가장 좋습니다.
    [Windows](/ko/platforms/windows), [VPS 호스팅](/ko/vps)을 참고하세요.
    VM에서 macOS를 실행 중이라면 [macOS VM](/ko/install/macos-vm)을 참고하세요.

  </Accordion>
</AccordionGroup>

## 관련

- [FAQ](/ko/help/faq) — 메인 FAQ(모델, 세션, gateway, 보안 등)
- [설치 개요](/ko/install)
- [시작하기](/ko/start/getting-started)
- [문제 해결](/ko/help/troubleshooting)
