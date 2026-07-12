---
read_when:
    - 새로 설치한 후 온보딩이 멈추거나 처음 실행할 때 오류가 발생함
    - 인증 및 제공업체 구독 선택하기
    - docs.openclaw.ai에 액세스할 수 없고, 대시보드를 열 수 없으며, 설치가 멈춥니다
sidebarTitle: First-run FAQ
summary: 'FAQ: 빠른 시작 및 최초 실행 설정 — 설치, 온보딩, 인증, 구독, 초기 오류'
title: 'FAQ: 최초 실행 설정'
x-i18n:
    generated_at: "2026-07-12T15:19:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8f5234a5ae52fd57a89b3140473049c37f8495875e4a5d9a89d87e55d8fb2f7e
    source_path: help/faq-first-run.md
    workflow: 16
---

  빠른 시작과 최초 실행에 관한 Q&A입니다. 일상적인 운영, 모델, 인증, 세션 및 문제 해결은 기본 [FAQ](/ko/help/faq)를 참조하십시오.

  ## 빠른 시작 및 최초 실행 설정

  <AccordionGroup>
  <Accordion title="막혔을 때 가장 빠르게 해결하는 방법">
    **사용자의 컴퓨터를 볼 수 있는** 로컬 AI 에이전트를 사용하십시오. 대부분의 "막혔습니다" 사례는
    원격 도우미가 검사할 수 없는 **로컬 구성 또는 환경 문제**이므로 Discord에
    질문하는 것보다 이 방법이 낫습니다.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    에이전트가 코드와 문서를 읽고 사용 중인 정확한 버전을 바탕으로 판단할 수 있도록,
    수정 가능한(git) 설치를 통해 전체 소스 체크아웃을 제공하십시오.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    에이전트에게 수정 작업을 단계별로 계획하고 감독하도록 요청한 다음, 필요한
    명령만 실행하십시오. 변경 사항이 작을수록 감사하기 쉽습니다.

    도움을 요청할 때(Discord 또는 GitHub 이슈에서) 다음 출력을 공유하십시오.

    | 명령 | 표시 내용 |
    | --- | --- |
    | `openclaw status` | Gateway/에이전트 상태 + 기본 구성 스냅샷 |
    | `openclaw status --all` | 붙여 넣을 수 있는 전체 읽기 전용 진단 |
    | `openclaw models status` | 제공자 인증 + 모델 가용성 |
    | `openclaw doctor` | 일반적인 구성/상태 문제를 검증하고 복구 |
    | `openclaw logs --follow` | 실시간 로그 출력 추적 |
    | `openclaw gateway status --deep` | 심층 Gateway/구성/Plugin 상태 검사 |
    | `openclaw health --verbose` | 상세 상태 보고서 |

    실제 버그나 수정 방법을 찾았습니까? 이슈를 등록하거나 PR을 보내십시오.
    [이슈](https://github.com/openclaw/openclaw/issues) /
    [Pull request](https://github.com/openclaw/openclaw/pulls).

    빠른 디버그 절차: [문제가 발생했을 때 첫 60초](/ko/help/faq#first-60-seconds-if-something-is-broken).
    설치 문서: [설치](/ko/install), [설치 프로그램 플래그](/ko/install/installer), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="Heartbeat가 계속 건너뜁니다. 건너뛰기 사유는 무엇을 의미합니까?">
    | 건너뛰기 사유 | 의미 |
    | --- | --- |
    | `quiet-hours` | 구성된 활성 시간 범위 밖임 |
    | `empty-heartbeat-file` | `HEARTBEAT.md`가 존재하지만 공백, 주석, 헤더, 펜스 또는 빈 체크리스트 틀만 포함함 |
    | `no-tasks-due` | 작업 모드가 활성화되어 있지만 아직 실행할 작업 주기가 도래하지 않음 |
    | `alerts-disabled` | 모든 Heartbeat 표시 기능이 꺼져 있음(`showOk`, `showAlerts`, `useIndicator`가 모두 비활성화됨) |

    작업 모드에서 예정 타임스탬프는 실제 Heartbeat 실행이 완료된 후에만 갱신됩니다.
    건너뛴 실행은 작업을 완료된 것으로 표시하지 않습니다.

    문서: [Heartbeat](/ko/gateway/heartbeat), [자동화](/ko/automation).

  </Accordion>

  <Accordion title="OpenClaw의 권장 설치 및 설정 방법">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    소스에서 설치(기여자/개발자):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    아직 전역 설치하지 않았습니까? 대신 `pnpm openclaw onboard`를 실행하십시오. Control UI 자산이
    없으면 온보딩 과정에서 직접 빌드를 시도하고, 실패하면 `pnpm ui:build`로 대체합니다.

  </Accordion>

  <Accordion title="온보딩 후 대시보드를 열려면 어떻게 해야 합니까?">
    온보딩은 설정 직후 브라우저에서 깔끔한(토큰이 포함되지 않은) 대시보드 URL을 열고
    요약에 링크를 출력합니다. 해당 탭을 열어 두십시오. 브라우저가 실행되지 않았다면
    같은 컴퓨터에서 출력된 URL을 복사하여 붙여 넣으십시오.
  </Accordion>

  <Accordion title="localhost와 원격 환경에서 대시보드를 인증하려면 어떻게 해야 합니까?">
    **Localhost(동일한 컴퓨터):**

    - `http://127.0.0.1:18789/`를 여십시오.
    - 공유 비밀 인증을 요청하면 구성된 토큰 또는 비밀번호를 Control UI 설정에 붙여 넣으십시오.
    - 토큰 출처: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`).
    - 비밀번호 출처: `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`).
    - 아직 공유 비밀을 구성하지 않았습니까? `openclaw doctor --generate-gateway-token`(또는 `openclaw doctor --fix --generate-gateway-token`)을 실행하십시오.

    **Localhost가 아닌 경우:**

    - **Tailscale Serve**(권장): 바인딩을 루프백으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 후 `https://<magicdns>/`를 여십시오. `gateway.auth.allowTailscale: true`이면 ID 헤더가 Control UI/WebSocket 인증을 충족합니다(공유 비밀을 붙여 넣을 필요가 없으며 신뢰할 수 있는 Gateway 호스트를 전제로 함). HTTP API에는 의도적으로 비공개 인그레스 `none` 또는 신뢰할 수 있는 프록시 HTTP 인증을 사용하지 않는 한 여전히 공유 비밀 인증이 필요합니다.
      동일한 클라이언트에서 동시에 발생한 잘못된 인증 Serve 시도는 인증 실패 제한기가 이를 기록하기 전에 직렬화되므로, 두 번째 잘못된 재시도에서 이미 `retry later`가 표시될 수 있습니다.
    - **Tailnet 바인딩**: `openclaw gateway --bind tailnet --token "<token>"`을 실행하고(또는 비밀번호 인증을 구성하고) `http://<tailscale-ip>:18789/`를 연 다음, 일치하는 공유 비밀을 대시보드 설정에 붙여 넣으십시오.
    - **ID 인식 역방향 프록시**: Gateway를 신뢰할 수 있는 프록시 뒤에 유지하고 `gateway.auth.mode: "trusted-proxy"`를 설정한 다음 프록시 URL을 여십시오. 동일 호스트의 루프백 프록시는 `gateway.auth.trustedProxy.allowLoopback: true`를 명시적으로 설정해야 합니다.
    - **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`를 실행한 다음 `http://127.0.0.1:18789/`를 여십시오. 터널을 사용해도 공유 비밀 인증은 적용됩니다. 메시지가 표시되면 구성된 토큰 또는 비밀번호를 붙여 넣으십시오.

    바인딩 모드와 인증에 대한 자세한 내용은 [대시보드](/ko/web/dashboard) 및 [웹 인터페이스](/ko/web)를 참조하십시오.

  </Accordion>

  <Accordion title="채팅 승인을 위한 exec 승인 구성이 두 개인 이유는 무엇입니까?">
    서로 다른 계층을 제어합니다.

    - `approvals.exec` - 승인 프롬프트를 채팅 대상으로 전달합니다.
    - `channels.<channel>.execApprovals` - 해당 채널을 exec 승인을 위한 네이티브 승인 클라이언트로 만듭니다.

    호스트 exec 정책이 여전히 실제 승인 게이트이며, 채팅 구성은 프롬프트가 표시되는 위치와
    사용자가 응답하는 방식만 제어합니다.

    둘 다 필요한 경우는 드뭅니다.

    - 채팅에서 이미 명령과 답장을 지원하는 경우, 같은 채팅의 `/approve`는 공유 경로를 통해 작동합니다.
    - 지원되는 네이티브 채널이 승인자를 안전하게 추론할 수 있는 경우, `channels.<channel>.execApprovals.enabled`가 설정되지 않았거나 `"auto"`이면 OpenClaw가 DM 우선 네이티브 승인을 자동으로 활성화합니다.
    - 네이티브 승인 카드/버튼을 사용할 수 있는 경우 해당 UI가 기본입니다. 도구 결과에서 채팅 승인을 사용할 수 없다고 표시할 때만 수동 `/approve` 명령을 언급하십시오.
    - 프롬프트를 다른 채팅이나 명시적인 운영 채널에도 전달해야 하는 경우에만 `approvals.exec`를 사용하십시오.
    - 승인 프롬프트를 원래 대화방/토픽에도 다시 게시하려는 경우에만 `channels.<channel>.execApprovals.target: "channel"` 또는 `"both"`를 사용하십시오.
    - Plugin 승인은 별개입니다. 기본적으로 같은 채팅의 `/approve`를 사용하고, 선택적으로 `approvals.plugin` 전달을 사용할 수 있으며, 일부 네이티브 채널만 이에 대해서도 네이티브 처리를 유지합니다.

    요약: 전달은 라우팅을 위한 것이며, 네이티브 클라이언트 구성은 채널별로 더 풍부한 UX를 제공하기 위한 것입니다.
    [실행 승인](/ko/tools/exec-approvals)을 참조하십시오.

  </Accordion>

  <Accordion title="어떤 런타임이 필요한가요?">
    Node **22.19+**가 필요합니다(Node 24 권장). `pnpm`은 저장소 패키지 관리자입니다.
    Gateway에는 Bun을 **권장하지 않습니다**.
  </Accordion>

  <Accordion title="Raspberry Pi에서 실행되나요?">
    예. 하지만 먼저 RAM을 확인하십시오. Pi 5와 Pi 4(2 GB+)가 가장 적합하며, Pi 3B+(1 GB)는 작동하지만 느리고, Pi Zero 2 W(512 MB)는 권장하지 않습니다.

    | 모델 | RAM | 적합성 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 최적 |
    | Pi 4 | 4 GB | 좋음 |
    | Pi 4 | 2 GB | 사용 가능, 스왑 추가 |
    | Pi 4 | 1 GB | 빠듯함 |
    | Pi 3B+ | 1 GB | 느림 |
    | Pi Zero 2 W | 512 MB | 권장하지 않음 |

    절대 최소 사양은 RAM 1 GB, 코어 1개, 디스크 여유 공간 500 MB, 64비트 OS입니다. Pi에서는
    Gateway만 실행되고 모델은 클라우드 API를 호출하므로, 보급형 Pi로도 부하를 처리할 수 있습니다.

    소형 Pi/VPS에는 Gateway만 호스팅하고 노트북/휴대전화의 **Node**를 페어링하여
    로컬 화면/카메라/캔버스를 사용하거나 명령을 실행할 수도 있습니다. [Node](/ko/nodes)를 참조하십시오.

    전체 설정 안내: [Raspberry Pi](/ko/install/raspberry-pi).

  </Accordion>

  <Accordion title="Raspberry Pi 설치에 유용한 팁이 있나요?">
    - **64비트** OS를 사용하십시오. 32비트 Raspberry Pi OS는 사용하지 마십시오.
    - 2 GB 이하 보드에는 스왑을 추가하십시오.
    - 성능과 수명을 고려하여 SD 카드보다 **USB SSD**를 사용하십시오.
    - 로그를 확인하고 빠르게 업데이트할 수 있도록 수정 가능한(git) 설치 방식을 사용하십시오.
    - 채널/스킬 없이 시작한 후 하나씩 추가하십시오.
    - 비정상적인 바이너리 오류("exec format error")는 일반적으로 선택적 스킬 도구에 ARM64 빌드가 없어서 발생합니다.

    전체 가이드: [Raspberry Pi](/ko/install/raspberry-pi). [Linux](/ko/platforms/linux)도 참조하십시오.

  </Accordion>

  <Accordion title="‘Wake up my friend’에서 멈췄거나 온보딩이 시작되지 않습니다. 어떻게 해야 하나요?">
    이 화면이 작동하려면 Gateway에 연결할 수 있고 인증이 완료되어 있어야 합니다. 또한 모델 제공자가 구성된 경우 TUI는 처음 시작할 때
    "친구여, 일어나세요!"를 자동으로 전송합니다. 모델/인증 설정을 건너뛴 경우 온보딩에는 "모델 인증 누락" 안내가 표시되고
    아무것도 전송하지 않은 채 TUI가 열립니다. `openclaw configure --section model`을 사용하여 제공자를 추가하십시오.
    **응답 없이** 시작 문구만 표시되고 토큰 수가 계속 0이면 에이전트가 실행되지 않은 것입니다.

    1. Gateway를 다시 시작하십시오.

    ```bash
    openclaw gateway restart
    ```

    2. 상태 + 인증 확인:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 여전히 멈춰 있습니까? 다음을 실행하십시오.

    ```bash
    openclaw doctor
    ```

    Gateway가 원격에 있다면 터널/Tailscale 연결이 활성화되어 있고 UI가
    올바른 Gateway를 가리키는지 확인하십시오. [원격 액세스](/ko/gateway/remote)를 참조하십시오.

  </Accordion>

  <Accordion title="온보딩을 다시 하지 않고 설정을 새 머신으로 마이그레이션할 수 있습니까?">
    예. **상태 디렉터리**와 **워크스페이스**를 복사한 다음 Doctor를 한 번 실행하십시오.

    1. 새 머신에 OpenClaw를 설치합니다.
    2. 이전 머신에서 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`)을 복사합니다.
    3. 워크스페이스(기본값: `~/.openclaw/workspace`)를 복사합니다.
    4. `openclaw doctor`를 실행하고 Gateway 서비스를 다시 시작합니다.

    **두** 위치를 모두 복사하면 설정, 인증 프로필, WhatsApp 자격 증명, 세션 및 메모리가 보존되어
    봇이 정확히 동일하게 유지됩니다. 원격 모드에서는 Gateway 호스트가 세션 저장소와
    워크스페이스를 소유합니다.

    **중요:** 워크스페이스만 GitHub에 커밋/푸시하면
    **메모리 + 부트스트랩 파일**은 백업되지만 세션 기록이나 인증은 백업되지 않습니다. 이러한 항목은
    `~/.openclaw/` 아래에 있습니다(예: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    관련 항목: [마이그레이션](/ko/install/migrating), [디스크에서 항목이 저장되는 위치](/ko/help/faq#where-things-live-on-disk),
    [에이전트 워크스페이스](/ko/concepts/agent-workspace), [Doctor](/ko/gateway/doctor),
    [원격 모드](/ko/gateway/remote).

  </Accordion>

  <Accordion title="최신 버전의 새로운 기능은 어디에서 확인할 수 있습니까?">
    GitHub 변경 로그를 확인하십시오.
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    최신 항목은 맨 위에 있습니다. 최상단 섹션이 **미출시**라면 그다음 날짜가 표시된
    섹션이 최근에 출시된 버전입니다. 항목은 **주요 내용**, **변경 사항**,
    **수정 사항** 아래에 분류됩니다(필요한 경우 문서/기타 섹션도 포함).

  </Accordion>

  <Accordion title="docs.openclaw.ai에 액세스할 수 없음(SSL 오류)">
    일부 Comcast/Xfinity 연결에서는 Xfinity Advanced Security를 통해 `docs.openclaw.ai`를
    잘못 차단합니다. 해당 기능을 비활성화하거나 `docs.openclaw.ai`를 허용 목록에 추가한 다음 다시 시도하십시오.
    차단 해제를 요청하는 데 도움을 주십시오: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    아직도 막혀 있나요? 문서는 GitHub에도 미러링되어 있습니다:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="안정 버전과 베타 버전의 차이">
    **안정 버전**과 **베타 버전**은 별도의 코드 라인이 아니라 **npm dist-tag**입니다:

    - `latest` = 안정 버전
    - `beta` = 테스트용 초기 빌드(베타가 없거나 현재 안정 릴리스보다 오래된 경우 `latest`로 대체됨)

    안정 릴리스는 일반적으로 먼저 **베타 버전**으로 출시된 다음, 명시적인 승격 단계를 통해
    버전 번호를 변경하지 않고 동일한 버전을 `latest`로 이동합니다. 유지관리자가
    바로 `latest`로 게시할 수도 있습니다. 따라서 승격 후 베타 버전과 안정 버전이
    **동일한 버전**을 가리킬 수 있습니다.

    변경 사항 보기: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    한 줄 설치 명령과 베타 버전 및 개발 버전의 차이는 다음 아코디언을 참조하십시오.

  </Accordion>

  <Accordion title="베타 버전은 어떻게 설치하며 베타와 개발 버전의 차이는 무엇인가요?">
    **베타 버전**은 npm dist-tag `beta`입니다(승격 후 `latest`와 일치할 수 있음).
    **개발 버전**은 `main`(git)의 계속 변경되는 최신 HEAD이며, npm에 게시할 때는 dist-tag `dev`를 사용합니다.

    한 줄 명령(macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 설치 프로그램(PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    자세한 내용: [개발 채널](/ko/install/development-channels) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="최신 코드를 사용해 보려면 어떻게 하나요?">
    두 가지 방법이 있습니다:

    1. **개발 채널(기존 설치):**

    ```bash
    openclaw update --channel dev
    ```

    이 명령은 `main`의 git 체크아웃으로 전환하고, 업스트림을 기준으로 리베이스하고, 빌드한 다음
    해당 체크아웃에서 CLI를 설치합니다.

    2. **수정 가능한(git) 설치(새 머신):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    수동 복제를 권장합니다:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    문서: [업데이트](/ko/cli/update), [개발 채널](/ko/install/development-channels), [설치](/ko/install).

  </Accordion>

  <Accordion title="설치와 온보딩에는 일반적으로 얼마나 걸리나요?">
    대략적인 기준은 다음과 같습니다:

    - **설치:** 2-5분.
    - **QuickStart 온보딩:** 몇 분(루프백 Gateway, 자동 토큰, 기본 워크스페이스).
    - **고급/전체 온보딩:** 제공자 로그인, 채널 페어링, 데몬 설치, 네트워크 다운로드 또는 Skills에 추가 설정이 필요한 경우 더 오래 걸립니다.

    마법사는 이 예상 소요 시간을 시작할 때 표시합니다. 선택 사항인 단계를 건너뛰고 나중에
    `openclaw configure`로 돌아올 수 있습니다.

    멈췄나요? 위의 [진행할 수 없습니다](#quick-start-and-first-run-setup)를 참조하십시오.

  </Accordion>

  <Accordion title="설치 프로그램이 멈췄나요? 더 자세한 정보를 확인하려면 어떻게 하나요?">
    `--verbose`를 사용하여 다시 실행하십시오:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1`에는 전용 상세 출력 스위치가 없습니다. 대신 `Set-PSDebug -Trace 1` /
    `-Trace 0`으로 감싸십시오. 전체 플래그 참조: [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Windows 설치 시 git을 찾을 수 없거나 openclaw를 인식할 수 없다고 표시됩니다">
    Windows에서 흔히 발생하는 두 가지 문제입니다:

    **1) npm 오류 spawn git / git을 찾을 수 없음**

    - **Git for Windows**를 설치하고 `git`이 PATH에 있는지 확인하십시오.
    - PowerShell을 닫았다가 다시 열고 설치 프로그램을 다시 실행하십시오.

    **2) 설치 후 openclaw를 인식할 수 없음**

    - npm 전역 바이너리 폴더가 PATH에 없습니다.
    - 다음 명령으로 확인하십시오: `npm config get prefix`.
    - 해당 디렉터리를 사용자 PATH에 추가하십시오(`\bin` 접미사는 필요하지 않으며, 대부분의 시스템에서는 `%AppData%\npm`입니다).
    - PowerShell을 닫았다가 다시 여십시오.

    데스크톱 앱을 선호하나요? **Windows Hub**를 사용하십시오. 터미널 전용 설정의 경우 PowerShell
    설치 프로그램과 WSL2 Gateway 경로를 모두 지원합니다. 문서: [Windows](/ko/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec 출력에 중국어가 깨져 표시됩니다. 어떻게 해야 하나요?">
    일반적으로 네이티브 Windows 셸의 콘솔 코드 페이지 불일치가 원인입니다.

    증상: `system.run`/`exec` 출력의 중국어가 깨진 문자로 표시되지만, 동일한 명령이
    다른 터미널 프로필에서는 정상적으로 표시됩니다.

    PowerShell에서의 해결 방법:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    그런 다음 Gateway를 다시 시작하고 재시도하십시오:

    ```powershell
    openclaw gateway restart
    ```

    최신 OpenClaw에서도 계속 재현되나요? 다음에서 추적하거나 보고하십시오: [이슈 #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="문서에서 제 질문에 대한 답을 찾지 못했습니다. 더 나은 답변을 받으려면 어떻게 하나요?">
    수정 가능한(git) 설치를 사용하여 전체 소스와 문서를 로컬에 확보한 다음, 봇(또는 Claude/Codex)이
    저장소를 읽고 정확하게 답변할 수 있도록 **해당 폴더에서** 질문하십시오.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    자세한 내용: [설치](/ko/install) 및 [설치 프로그램 플래그](/ko/install/installer).

  </Accordion>

  <Accordion title="Linux에 OpenClaw를 어떻게 설치하나요?">
    - Linux 빠른 설치 경로 및 서비스 설치: [Linux](/ko/platforms/linux).
    - 전체 단계별 안내: [시작하기](/ko/start/getting-started).
    - 설치 프로그램 및 업데이트: [설치 및 업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="VPS에 OpenClaw를 어떻게 설치하나요?">
    모든 Linux VPS에서 사용할 수 있습니다. 서버에 설치한 다음 SSH/Tailscale을 통해 Gateway에 접속하십시오.

    가이드: [exe.dev](/ko/install/exe-dev), [Hetzner](/ko/install/hetzner), [Fly.io](/ko/install/fly).
    원격 액세스: [Gateway 원격 액세스](/ko/gateway/remote).

  </Accordion>

  <Accordion title="클라우드/VPS 설치 가이드는 어디에 있나요?">
    일반적인 제공자를 다루는 호스팅 허브:

    - [VPS 호스팅](/ko/vps) (모든 제공자를 한곳에서 확인)
    - [Fly.io](/ko/install/fly)
    - [Hetzner](/ko/install/hetzner)
    - [exe.dev](/ko/install/exe-dev)

    클라우드에서는 **Gateway가 서버에서 실행**되며 노트북/휴대전화에서
    Control UI(또는 Tailscale/SSH)를 통해 접속합니다. 상태와 워크스페이스는 서버에 있으므로
    호스트를 신뢰할 수 있는 원본으로 취급하고 백업하십시오.

    **노드**(Mac/iOS/Android/헤드리스)를 해당 클라우드 Gateway와 페어링하면 Gateway는
    클라우드에 유지하면서 노트북에서 로컬 화면/카메라/캔버스를 사용하거나 명령을 실행할 수 있습니다.

    허브: [플랫폼](/ko/platforms). 원격 액세스: [Gateway 원격 액세스](/ko/gateway/remote).
    노드: [노드](/ko/nodes), [노드 CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw에 자체 업데이트를 요청할 수 있나요?">
    가능하지만 권장하지 않습니다. 업데이트 과정에서 Gateway가 다시 시작되어
    활성 세션이 끊길 수 있고, 깨끗한 git 체크아웃이 필요할 수 있으며, 확인 메시지가 표시될 수 있습니다.
    운영자가 셸에서 업데이트를 실행하는 편이 더 안전합니다.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    에이전트에서 자동화하는 경우:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    문서: [업데이트](/ko/cli/update), [업데이트하기](/ko/install/updating).

  </Accordion>

  <Accordion title="온보딩은 실제로 무엇을 하나요?">
    `openclaw onboard`는 권장 설정 경로입니다. **로컬 모드**에서는 다음 단계를 안내합니다:

    1. **모델/인증** - 제공자 OAuth, API 키 또는 수동 인증(LM Studio 같은 로컬 옵션 포함)을 설정하고 기본 모델을 선택합니다.
    2. **워크스페이스** - 위치와 부트스트랩 파일을 설정합니다.
    3. **Gateway** - 포트, 바인드 주소, 인증 모드, Tailscale 노출을 설정합니다.
    4. **채널** - 내장 및 공식 Plugin 채팅 채널을 설정합니다: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp 등.
    5. **데몬** - LaunchAgent(macOS), systemd 사용자 유닛(Linux/WSL2) 또는 네이티브 Windows Scheduled Task를 설정합니다.
    6. **상태 확인** - Gateway를 시작하고 실행 중인지 확인합니다.
    7. **Skills** - 권장 스킬과 선택적 종속성을 설치합니다.

    시작할 때 예상 소요 시간을 표시하며, 구성된 모델을 알 수 없거나
    인증이 누락된 경우 경고합니다. 전체 설명: [온보딩(CLI)](/ko/start/wizard).

  </Accordion>

  <Accordion title="실행하려면 Claude 또는 OpenAI 구독이 필요한가요?">
    아닙니다. **API 키**(Anthropic/OpenAI/기타) 또는 **로컬 전용 모델**로 OpenClaw를 실행하여
    데이터를 기기에 유지할 수 있습니다. 구독(Claude Pro/Max, ChatGPT/Codex)은
    해당 제공자를 인증하는 선택적 방법입니다.

    Anthropic의 경우 **API 키**는 표준 종량제 요금이 적용되며, **Claude CLI**는
    동일한 호스트의 기존 Claude Code 로그인을 재사용합니다. 현재 Anthropic은
    Claude CLI의 비대화형 `claude -p` 경로를 구독 플랜 한도를 계속 사용하는
    Agent SDK/프로그래밍 방식 사용으로 취급합니다. 구독 동작에 의존하기 전에 현재 Anthropic 청구
    문서를 확인하십시오. 장기간 실행되는 Gateway 호스트와 공유 자동화에는
    Anthropic API 키가 더 예측 가능한 선택입니다.

    OpenAI Codex OAuth(ChatGPT/Codex 구독)는 에이전트 모델에 완전히 지원됩니다.
    OpenClaw는 **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**,
    **Z.AI / GLM Coding Plan**을 포함한 호스팅 구독 방식 옵션도 지원합니다.

    문서: [Anthropic](/ko/providers/anthropic), [OpenAI](/ko/providers/openai),
    [Qwen Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [Z.AI(GLM)](/ko/providers/zai),
    [로컬 모델](/ko/gateway/local-models), [모델](/ko/concepts/models).

  </Accordion>

  <Accordion title="API 키 없이 Claude Max 구독을 사용할 수 있나요?">
    예. OpenClaw는 Pro/Max/Team/Enterprise 플랜에 대해 Claude CLI 재사용을 지원합니다. 현재 Anthropic은
    OpenClaw가 사용하는 `claude -p` 경로를 별도의 무료 허용량이 아니라 플랜 한도가 적용되는
    구독 플랜 사용으로 취급합니다. 현재 청구 세부 정보와 Anthropic 자체 지원 문서 링크는
    [Anthropic](/ko/providers/anthropic)을 참조하십시오. 가장 예측 가능한 서버 측 설정을 위해서는
    대신 Anthropic API 키를 사용하십시오.
  </Accordion>

  <Accordion title="Claude 구독 인증(Claude Pro 또는 Max)을 지원하나요?">
    예. Claude CLI 재사용을 통해 지원합니다. `claude -p`/Agent SDK 사용에 대한 Anthropic의 청구 방식은
    시간이 지나면서 변경되었습니다. 특정 청구 동작에 의존하기 전에 현재 상태와
    Anthropic 지원 문서의 날짜별 링크를 [Anthropic](/ko/providers/anthropic)에서
    확인하십시오.

    Anthropic 설정 토큰 인증도 여전히 지원되는 토큰 경로이지만, OpenClaw는 가능할 경우
    Claude CLI 재사용과 `claude -p`를 선호합니다. 프로덕션 또는 다중 사용자
    워크로드에는 Anthropic API 키가 여전히 더 안전하고 예측 가능한 선택입니다. 기타
    구독 방식 호스팅 옵션: [OpenAI](/ko/providers/openai), [Qwen Cloud](/ko/providers/qwen),
    [MiniMax](/ko/providers/minimax), [Z.AI(GLM)](/ko/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Anthropic에서 HTTP 429 rate_limit_error가 표시되는 이유는 무엇인가요?">
    현재 기간의 **Anthropic 할당량/속도 제한**이 소진되었습니다. **Claude
    CLI**에서는 기간이 재설정될 때까지 기다리거나 요금제를 업그레이드하십시오. **Anthropic API 키**를 사용하는 경우
    Anthropic Console에서 사용량/청구를 확인하고 필요에 따라 한도를 상향하십시오.

    메시지가 구체적으로 `Extra usage is required for long context requests`인 경우,
    요청에서 Anthropic의 1M 컨텍스트 창(GA를 지원하는 1M Claude 4.x
    모델 또는 레거시 `params.context1m: true` 구성)을 사용하려고 하지만 현재 자격 증명으로는
    긴 컨텍스트 청구를 이용할 수 없는 것입니다.

    제공자의 속도가 제한되는 동안에도 OpenClaw가 계속 응답하도록 **대체 모델**을 설정하십시오.
    [모델](/ko/cli/models), [OAuth](/ko/concepts/oauth), 
    [긴 컨텍스트에 추가 사용량이 필요하다는 Anthropic 429 오류](/ko/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)를 참조하십시오.

  </Accordion>

  <Accordion title="AWS Bedrock을 지원하나요?">
    예. OpenClaw에는 **Amazon Bedrock (Converse)** 제공자가 번들로 포함되어 있습니다. AWS 환경
    표시자(`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`)가 있으면
    OpenClaw가 모델 검색을 위해 암시적 Bedrock 제공자를 자동으로 활성화합니다. 그렇지 않으면
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true`를 설정하거나 수동
    제공자 항목을 추가하십시오. [Amazon Bedrock](/ko/providers/bedrock) 및 [모델 제공자](/ko/providers/models)를 참조하십시오.
    관리형 키 흐름을 선호한다면 Bedrock 앞에 OpenAI 호환 프록시를 두는 방법도 여전히 유효합니다.
  </Accordion>

  <Accordion title="Codex 인증은 어떻게 작동하나요?">
    OpenClaw는 OAuth(ChatGPT 로그인)를 통해 **OpenAI Codex**를 지원합니다. 기본
    모델이 없는 새 설정에서는 ChatGPT/Codex 구독 인증과 네이티브 Codex 앱 서버 실행을 위해 정확히
    `openai/gpt-5.6-sol`을 사용합니다.
    재인증 시 `openai/gpt-5.5`를 포함하여 명시적으로 설정된 기존 모델을 유지합니다.
    Codex 워크스페이스에서 GPT-5.6을 제공하지 않으면
    `openai/gpt-5.5`를 명시적으로 선택하십시오. OpenClaw는 자동으로 하위 모델로 전환하지 않습니다. 레거시
    Codex 접두사가 붙은 모델 참조는 `openclaw doctor
    --fix`로 복구되는 레거시 구성입니다. 에이전트가 아닌 OpenAI
    API 표면에서는 OpenAI API 키를 통한 직접 액세스를 계속 사용할 수 있으며, 순서가 지정된 `openai` API 키 프로필을 통해 에이전트
    모델에도 사용할 수 있습니다. [모델 제공자](/ko/concepts/model-providers) 및
    [온보딩(CLI)](/ko/start/wizard)을 참조하십시오.
  </Accordion>

  <Accordion title="OpenClaw에서 레거시 OpenAI Codex 접두사를 계속 언급하는 이유는 무엇인가요?">
    `openai`는 OpenAI API 키와 ChatGPT/Codex OAuth 모두에 사용하는 현재 제공자 및 인증 프로필 ID이며,
    OpenAI Codex는 여기에 통합되었습니다. 이전 구성과 마이그레이션 경고에는 레거시
    `openai-codex` 접두사가 계속 표시될 수 있습니다.

    - `openai/gpt-5.6-sol` = 에이전트 실행에 네이티브 Codex 런타임을 사용하는 새로운 ChatGPT/Codex 구독 설정입니다.
    - `openai/gpt-5.5` = GPT-5.6 액세스 권한이 없는 기존 구성 또는 계정에서 명시적으로 선택할 수 있는 지원 모델입니다.
    - 레거시 `openai-codex/*` 모델 참조 = `openclaw doctor --fix`로 복구되는 레거시 경로입니다.
    - `openai/gpt-5.5`와 순서가 지정된 `openai` API 키 프로필 = OpenAI 에이전트 모델의 API 키 인증입니다.
    - 레거시 `openai-codex` 인증 프로필 ID = `openclaw doctor --fix`로 마이그레이션되는 레거시 ID입니다.

    OpenAI Platform에서 직접 청구되도록 하려면 `OPENAI_API_KEY`를 설정하십시오. ChatGPT/Codex
    구독 인증을 사용하려면 `openclaw models auth login --provider openai`를 실행하십시오.
    모델 참조는 정식 `openai/*` 제공자 아래에 유지하십시오. 새로운 구독
    설정에서는 정확히 `openai/gpt-5.6-sol`을 사용하며, doctor는 명시적인 `openai/gpt-5.5`
    선택을 업그레이드하지 않고 레거시 Codex 접두사가 붙은 참조를 복구합니다.

  </Accordion>

  <Accordion title="Codex OAuth 한도가 ChatGPT 웹과 다를 수 있는 이유는 무엇인가요?">
    Codex OAuth는 OpenAI가 관리하는 요금제별 할당량 기간을 사용하며, 동일한 계정에서도
    ChatGPT 웹사이트/앱의 사용 환경과 다를 수 있습니다.

    `openclaw models status`는 현재 확인할 수 있는 제공자 사용량/할당량 기간을 표시하지만,
    ChatGPT 웹의 사용 권한을 직접 API 액세스로 만들어 내거나 정규화하지는 않습니다. OpenAI
    Platform의 직접 청구/한도 경로를 사용하려면 API 키와 함께 `openai/*`를 사용하십시오.

  </Accordion>

  <Accordion title="OpenAI 구독 인증(Codex OAuth)을 지원하나요?">
    예, 완전히 지원합니다. OpenAI는 OpenClaw와 같은 외부
    도구/워크플로에서 구독 OAuth를 사용하는 것을 명시적으로 허용합니다. 온보딩에서 OAuth 흐름을 실행할 수 있습니다.

    [OAuth](/ko/concepts/oauth), [모델 제공자](/ko/concepts/model-providers), [온보딩(CLI)](/ko/start/wizard)을 참조하십시오.

  </Accordion>

  <Accordion title="Gemini CLI OAuth는 어떻게 설정하나요?">
    Gemini CLI는 `openclaw.json`의 클라이언트 ID나 비밀 값이 아닌 **Plugin 인증 흐름**을 사용합니다.

    1. `gemini`가 `PATH`에 포함되도록 Gemini CLI를 로컬에 설치하십시오.
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin을 활성화하십시오: `openclaw plugins enable google`
    3. 로그인하십시오: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. 로그인 후 기본 모델: `google/gemini-3.1-pro-preview`(런타임 `google-gemini-cli`)
    5. 로그인 후 요청이 실패하나요? Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하고 다시 시도하십시오.

    OAuth 토큰은 Gateway 호스트의 인증 프로필에 저장됩니다. 자세한 내용은 [Google](/ko/providers/google), [모델 제공자](/ko/concepts/model-providers)를 참조하십시오.

  </Accordion>

  <Accordion title="일상적인 대화에 로컬 모델을 사용해도 괜찮나요?">
    일반적으로 권장하지 않습니다. OpenClaw에는 큰 컨텍스트와 강력한 안전성이 필요합니다. 소형 카드는 컨텍스트를
    잘라내고 제공자 측 안전 필터를 건너뜁니다. 꼭 사용해야 한다면 로컬에서 실행할 수 있는 **가장 큰** 모델 빌드
    (LM Studio)를 사용하십시오. [로컬 모델](/ko/gateway/local-models)을 참조하십시오. 소형/양자화
    모델은 프롬프트 인젝션 위험을 높입니다. [보안](/ko/gateway/security)을 참조하십시오.
  </Accordion>

  <Accordion title="호스팅 모델 트래픽을 특정 리전에 유지하려면 어떻게 해야 하나요?">
    리전에 고정된 엔드포인트를 선택하십시오. OpenRouter는 MiniMax, Kimi,
    GLM에 대해 미국 호스팅 옵션을 제공합니다. 데이터를 리전 내에 유지하려면 미국 호스팅 변형을 선택하십시오. `models.mode: "merge"`를 사용하면
    이러한 제공자와 함께 Anthropic/OpenAI도 계속 나열할 수 있으므로, 선택한 리전 제공자를 준수하면서도
    대체 모델을 계속 사용할 수 있습니다.
  </Accordion>

  <Accordion title="설치하려면 Mac Mini를 구매해야 하나요?">
    아니요. OpenClaw는 macOS 또는 Linux(Windows에서는 WSL2를 통해)에서 실행됩니다. Mac mini는 널리 사용되는
    상시 가동 호스트이지만 소형 VPS, 홈 서버 또는 Raspberry Pi급 장치에서도 작동합니다.

    Mac은 **macOS 전용 도구에만** 필요합니다. iMessage의 경우 Messages에 로그인된 아무 Mac에서나
    `imsg`와 함께 [iMessage](/ko/channels/imessage)를 사용하십시오. Gateway가 Linux 또는 다른 곳에서 실행되는 경우,
    해당 Mac에서 `imsg`를 실행하는 SSH 래퍼로 `channels.imessage.cliPath`를 설정하십시오. 기타
    macOS 전용 도구의 경우 Mac에서 Gateway를 실행하거나 macOS Node를 페어링하십시오.

    문서: [iMessage](/ko/channels/imessage), [Node](/ko/nodes), [Mac 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage 지원에 Mac mini가 필요한가요?">
    Messages에 로그인된 **macOS 기기**가 필요하지만 반드시 Mac mini일 필요는 없으며 어떤
    Mac이든 사용할 수 있습니다. `imsg`와 함께 [iMessage](/ko/channels/imessage)를 사용하십시오. Gateway는 해당
    Mac에서 실행하거나 SSH 래퍼 `cliPath`를 사용하여 다른 곳에서 실행할 수 있습니다.

    일반적인 설정:

    - Gateway는 Linux/VPS에서 실행하고, `channels.imessage.cliPath`는 Messages에 로그인된 Mac에서 `imsg`를 실행하는 SSH 래퍼로 설정합니다.
    - 가장 간단한 단일 머신 설정을 위해 모든 항목을 한 Mac에서 실행합니다.

    문서: [iMessage](/ko/channels/imessage), [Node](/ko/nodes), [Mac 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw 실행용 Mac mini를 구매하면 MacBook Pro에 연결할 수 있나요?">
    예. **Mac mini에서 Gateway를 실행**하고 MacBook Pro를 **Node**
    (컴패니언 기기)로 연결할 수 있습니다. Node는 Gateway를 실행하지 않으며 해당 기기의
    화면/카메라/캔버스 및 `system.run`과 같은 기능을 추가합니다.

    일반적인 패턴은 상시 가동되는 Mac mini에서 Gateway를 실행하고, MacBook Pro에서 macOS 앱 또는
    Node 호스트를 실행하여 Gateway와 페어링하는 것입니다. `openclaw nodes status` / `openclaw nodes list`로 확인하십시오.

    문서: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes).

  </Accordion>

  <Accordion title="Bun을 사용할 수 있나요?">
    권장하지 않습니다. Bun에는 런타임 버그가 있으며 특히 WhatsApp과 Telegram에서 문제가 발생합니다.
    안정적인 Gateway에는 **Node**를 사용하십시오. 그래도 실험하려면
    WhatsApp/Telegram을 사용하지 않는 비프로덕션 Gateway에서 진행하십시오.
  </Accordion>

  <Accordion title="Telegram: allowFrom에는 무엇을 입력해야 하나요?">
    `channels.telegram.allowFrom`에는 봇 사용자 이름이 아니라 **사람 발신자의 Telegram 사용자 ID**(숫자)를 입력합니다.
    설정에서는 숫자 사용자 ID만 요청하며, `openclaw doctor --fix`는 레거시
    `@username` 항목의 확인을 시도할 수 있습니다.

    더 안전한 방법(서드 파티 봇 없음): 봇에 DM을 보내고 `openclaw logs --follow`를 실행한 다음 `from.id`를 확인하십시오.

    공식 Bot API: 봇에 DM을 보내고 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출한 다음 `message.from.id`를 확인하십시오.

    서드 파티(개인 정보 보호 수준이 낮음): `@userinfobot` 또는 `@getidsbot`에 DM을 보내십시오.

    [Telegram 액세스 제어](/ko/channels/telegram#access-control-and-activation)를 참조하십시오.

  </Accordion>

  <Accordion title="여러 사람이 서로 다른 OpenClaw 인스턴스에서 하나의 WhatsApp 번호를 사용할 수 있나요?">
    예, **다중 에이전트 라우팅**을 사용하면 됩니다. 각 발신자의 WhatsApp DM(`peer: { kind: "direct", id: "+15551234567" }`)을 서로 다른 `agentId`에 바인딩하여 각 사용자에게 자체 워크스페이스와 세션 저장소를 제공하십시오. 답장은 여전히 **동일한 WhatsApp 계정**에서 전송됩니다. DM 액세스 제어(`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`)는 계정별로 전역 적용됩니다. [다중 에이전트 라우팅](/ko/concepts/multi-agent) 및 [WhatsApp](/ko/channels/whatsapp)을 참조하십시오.
  </Accordion>

  <Accordion title='"빠른 채팅" 에이전트와 "코딩용 Opus" 에이전트를 실행할 수 있나요?'>
    예. 다중 에이전트 라우팅을 사용하십시오. 각 에이전트에 자체 기본 모델을 지정한 다음 수신
    경로(제공자 계정 또는 특정 피어)를 각 에이전트에 바인딩하십시오. 구성 예시는
    [다중 에이전트 라우팅](/ko/concepts/multi-agent)을 참조하십시오. [모델](/ko/concepts/models) 및
    [구성](/ko/gateway/configuration)도 참조하십시오.
  </Accordion>

  <Accordion title="Homebrew는 Linux에서 작동하나요?">
    예, Linuxbrew를 통해 작동합니다.

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd를 통해 OpenClaw를 실행하는 경우 서비스 PATH에
    `/home/linuxbrew/.linuxbrew/bin`(또는 사용 중인 brew 접두사)을 포함하여 로그인 셸이 아닌 환경에서도 `brew`로 설치한 도구를
    찾을 수 있도록 하십시오. 최신 빌드는 Linux
    systemd 서비스에서 일반적인 사용자 바이너리 디렉터리(예: `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`)도 앞에 추가하며, 설정된 경우 `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`을 적용합니다.

  </Accordion>

  <Accordion title="수정 가능한 git 설치와 npm 설치의 차이점">
    - **수정 가능한(git) 설치:** 전체 소스 체크아웃으로 편집할 수 있으며 기여자에게 가장 적합합니다. 로컬에서 빌드하고 코드/문서를 패치할 수 있습니다.
    - **npm 설치:** 저장소 없이 전역 CLI로 설치하며 "그냥 실행"하려는 경우에 가장 적합합니다. 업데이트는 npm dist-tag를 통해 제공됩니다.

    문서: [시작하기](/ko/start/getting-started), [업데이트](/ko/install/updating).

  </Accordion>

  <Accordion title="나중에 npm 설치와 git 설치 간에 전환할 수 있나요?">
    예, 기존 설치에서 `openclaw update --channel ...`을 사용하면 됩니다. 이 작업은 **데이터를
    삭제하지 않으며** OpenClaw 코드 설치만 변경합니다. 상태(`~/.openclaw`)와
    워크스페이스(`~/.openclaw/workspace`)는 그대로 유지됩니다.

    npm에서 git으로:

    ```bash
    openclaw update --channel dev
    ```

    git에서 npm으로:

    ```bash
    openclaw update --channel stable
    ```

    먼저 계획된 모드 전환을 미리 보려면 `--dry-run`을 추가하십시오. 업데이터는 Doctor
    후속 작업을 실행하고, 대상 채널의 Plugin 소스를 새로 고친 다음, `--no-restart`를
    전달하지 않는 한 Gateway를 다시 시작합니다.

    설치 프로그램에서도 어느 모드든 강제로 지정할 수 있습니다.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    백업 팁: [디스크에서 항목이 저장되는 위치](/ko/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway를 노트북에서 실행해야 하나요, 아니면 VPS에서 실행해야 하나요?">
    연중무휴 안정성을 원한다면 **VPS**를 사용하십시오. 설정이 가장 간편하기를 원하고
    절전이나 재시작을 감수할 수 있다면 로컬에서 실행하십시오.

    **노트북(로컬 Gateway)**

    - **장점:** 서버 비용이 없고, 로컬 파일에 직접 접근할 수 있으며, 브라우저 창을 실시간으로 볼 수 있습니다.
    - **단점:** 절전이나 네트워크 끊김으로 연결이 해제되고, OS 업데이트나 재부팅으로 중단되며, 계속 깨어 있어야 합니다.

    **VPS / 클라우드**

    - **장점:** 항상 실행되고, 네트워크가 안정적이며, 노트북 절전 문제가 없고, 지속적으로 실행하기가 더 쉽습니다.
    - **단점:** 대개 헤드리스 환경이고(스크린샷 사용), 파일에 원격으로만 접근할 수 있으며, 업데이트에 SSH가 필요합니다.

    WhatsApp/Telegram/Slack/Mattermost/Discord는 모두 VPS에서 문제없이 작동합니다. 실제
    절충점은 헤드리스 브라우저와 표시되는 창 중 무엇을 사용할지입니다. [브라우저](/ko/tools/browser)를 참조하십시오.

    기본 권장 사항: 이전에 Gateway 연결 끊김을 겪었다면 VPS를 사용하십시오. Mac을
    적극적으로 사용하면서 로컬 파일 접근이나 표시되는 브라우저 UI 자동화가 필요하다면
    로컬 실행이 적합합니다.

  </Accordion>

  <Accordion title="OpenClaw를 전용 머신에서 실행하는 것이 얼마나 중요한가요?">
    필수는 아니지만 안정성과 격리를 위해 권장합니다.

    - **전용 호스트(VPS/Mac mini/Raspberry Pi):** 항상 실행되고, 절전이나 재부팅으로 인한 중단이 적으며, 권한을 더 깔끔하게 관리할 수 있고, 지속적으로 실행하기가 더 쉽습니다.
    - **공용 노트북/데스크톱:** 테스트와 사용 중인 상황에는 적합하지만, 머신이 절전되거나 업데이트될 때 일시 중지를 예상해야 합니다.

    두 방식의 장점을 모두 활용하려면 Gateway를 전용 호스트에 유지하고, 로컬
    화면/카메라/실행 도구를 사용할 수 있도록 노트북을 **Node**로 페어링하십시오. [Node](/ko/nodes) 및 [보안](/ko/gateway/security)을 참조하십시오.

  </Accordion>

  <Accordion title="최소 VPS 요구 사항과 권장 OS는 무엇인가요?">
    - **절대 최소 사양:** 1 vCPU, 1 GB RAM, 약 500 MB 디스크.
    - **권장 사양:** 여유 용량(로그, 미디어, 여러 채널)을 위해 1-2 vCPU, 2 GB+ RAM. Node 도구와 브라우저 자동화는 많은 리소스를 사용할 수 있습니다.

    OS: **Ubuntu LTS**(또는 최신 Debian/Ubuntu) - 가장 충분히 테스트된 Linux 설치 경로입니다.

    문서: [Linux](/ko/platforms/linux), [VPS 호스팅](/ko/vps).

  </Accordion>

  <Accordion title="OpenClaw를 VM에서 실행할 수 있으며 요구 사항은 무엇인가요?">
    가능합니다. VM을 VPS처럼 취급하십시오. 항상 켜져 있고 접근 가능해야 하며,
    Gateway와 활성화하는 모든 채널을 실행하기에 충분한 RAM이 필요합니다.

    - **절대 최소 사양:** 1 vCPU, 1 GB RAM.
    - **권장 사양:** 여러 채널, 브라우저 자동화 또는 미디어 도구를 사용하려면 2 GB+ RAM.
    - **OS:** Ubuntu LTS 또는 다른 최신 Debian/Ubuntu.

    Windows에서는 데스크톱 설정에 **Windows Hub**를 사용하거나, 폭넓은 도구 호환성을
    갖춘 Linux 방식의 Gateway VM을 위해 WSL2를 사용하십시오. [Windows](/ko/platforms/windows), [VPS 호스팅](/ko/vps)을 참조하십시오.
    VM에서 macOS 실행: [macOS VM](/ko/install/macos-vm)을 참조하십시오.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [FAQ](/ko/help/faq) - 주요 FAQ(모델, 세션, Gateway, 보안 등)
- [설치 개요](/ko/install)
- [시작하기](/ko/start/getting-started)
- [문제 해결](/ko/help/troubleshooting)
