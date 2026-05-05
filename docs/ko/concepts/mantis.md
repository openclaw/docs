---
read_when:
    - OpenClaw 버그에 대한 라이브 시각적 품질 보증 빌드 또는 실행
    - 풀 리퀘스트에 대한 사전 및 사후 검증 추가
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 실제 전송 수단에서 OpenClaw 버그를 재현하고, 전후 증거를 캡처하며, PR에 아티팩트를 첨부하기 위한 시각적 엔드 투 엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-05T06:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 전송, 그리고 눈에 보이는 증거가 필요한 버그를 위한 OpenClaw 종단 간 검증 시스템입니다. 알려진 문제가 있는 ref에 대해 시나리오를 실행하고, 증거를 캡처한 다음, 후보 ref에 대해 동일한 시나리오를 실행하고, 메인테이너가 PR이나 로컬 명령에서 검사할 수 있는 아티팩트로 비교 결과를 게시합니다.

Mantis는 Discord에서 시작합니다. Discord는 실제 봇 인증, 실제 길드 채널, 반응, 스레드, 네이티브 명령, 그리고 사람이 전송에 표시된 내용을 시각적으로 확인할 수 있는 브라우저 UI를 제공하는 고가치 첫 번째 레인이기 때문입니다.

## 목표

- GitHub 이슈나 PR의 버그를 사용자가 보는 것과 동일한 전송 형태로 재현합니다.
- 수정 적용 전에 기준 ref에서 **before** 아티팩트를 캡처합니다.
- 수정 적용 후 후보 ref에서 **after** 아티팩트를 캡처합니다.
- 가능하면 Discord REST 반응 읽기나 채널 트랜스크립트 확인 같은 결정적 오라클을 사용합니다.
- 버그에 눈에 보이는 UI 표면이 있을 때 스크린샷을 캡처합니다.
- 에이전트가 제어하는 CLI에서 로컬로 실행하고 GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화, 또는 provider 인증이 막혔을 때 VNC 복구에 충분한 머신 상태를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 운영자 Discord 채널에 간결한 상태를 게시합니다.

## 비목표

- Mantis는 단위 테스트를 대체하지 않습니다. 수정 사항이 이해된 뒤에는 일반적으로 Mantis 실행을 더 작은 회귀 테스트로 만들어야 합니다.
- Mantis는 일반적인 빠른 CI 게이트가 아닙니다. 더 느리고, 라이브 자격 증명을 사용하며, 라이브 환경이 중요한 버그에만 사용됩니다.
- Mantis는 정상 동작에 사람을 요구해서는 안 됩니다. 수동 VNC는 복구 경로이지 정상 경로가 아닙니다.
- Mantis는 원시 시크릿을 아티팩트, 로그, 스크린샷, Markdown 보고서, 또는 PR 댓글에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA 스택에 속합니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 시나리오 런타임, 전송 어댑터, 증거 스키마, 로컬 CLI를 소유합니다.
- QA Lab은 라이브 전송 하네스 조각, 브라우저 캡처 헬퍼, 아티팩트 작성기를 소유합니다.
- Crabbox는 원격 VM이 필요할 때 예열된 Linux 머신을 소유합니다.
- GitHub Actions는 원격 워크플로 진입점과 아티팩트 보존을 소유합니다.
- ClawSweeper는 GitHub 댓글 라우팅을 소유합니다. 메인테이너 명령을 파싱하고, 워크플로를 디스패치하며, 최종 PR 댓글을 게시합니다.
- OpenClaw 에이전트는 시나리오에 에이전트 기반 설정, 디버깅, 또는 막힌 상태 보고가 필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 전송 지식을 OpenClaw에, 머신 스케줄링을 Crabbox에, 메인테이너 워크플로 연결 로직을 ClawSweeper에 유지합니다.

## 명령 형태

첫 번째 로컬 명령은 Discord 봇, 길드, 채널, 메시지 전송, 반응 전송, 아티팩트 경로를 검증합니다.

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

로컬 before 및 after 실행기는 다음 형태를 받습니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

실행기는 출력 디렉터리 아래에 분리된 기준 및 후보 worktree를 만들고, 종속성을 설치하고, 각 ref를 빌드하고, `--allow-failures`로 시나리오를 실행한 다음 `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 작성합니다. 첫 번째 Discord 시나리오에서 검증 성공은 기준 상태가 `fail`이고 후보 상태가 `pass`임을 의미합니다.

첫 번째 VM/브라우저 primitive는 데스크톱 smoke입니다.

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox 데스크톱 머신을 임대하거나 재사용하고, VNC 세션 안에서 보이는 브라우저를 시작하고, 데스크톱을 캡처하고, 아티팩트를 로컬 출력 디렉터리로 가져오며, 보고서에 재연결 명령을 작성합니다. 이 명령은 기본적으로 Hetzner provider를 사용합니다. Hetzner가 Mantis 레인에서 데스크톱/VNC 커버리지가 동작하는 첫 번째 provider이기 때문입니다. 다른 Crabbox 플릿에 대해 실행할 때는 `--provider`, `--crabbox-bin`, 또는 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 재정의합니다.

유용한 데스크톱 smoke 플래그:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 예열된 데스크톱을 재사용합니다.
- `--browser-url <url>`은 보이는 브라우저에서 열 페이지를 변경합니다.
- `--html-file <path>`는 repo 로컬 HTML 아티팩트를 보이는 브라우저에서 렌더링합니다. Mantis는 실제 Crabbox 데스크톱을 통해 생성된 Discord 상태 반응 타임라인을 캡처하는 데 이것을 사용합니다.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 생성되어 통과한 lease를 VNC 검사를 위해 열린 상태로 유지합니다. 실패한 실행은 lease가 생성된 경우 운영자가 재연결할 수 있도록 기본적으로 lease를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 머신 크기와 lease 수명을 조정합니다.

첫 번째 전체 데스크톱 전송 primitive는 Slack 데스크톱 smoke입니다.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱 머신을 임대하거나 재사용하고, 현재 checkout을 VM에 동기화하고, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC 브라우저에서 Slack Web을 열고, 보이는 데스크톱을 캡처하며, Slack QA 아티팩트와 VNC 스크린샷을 모두 로컬 출력 디렉터리로 복사합니다. 이것은 SUT OpenClaw Gateway와 브라우저가 같은 Linux 데스크톱 VM 안에 모두 존재하는 첫 번째 Mantis 형태입니다.

`--gateway-setup`을 사용하면 이 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에 지속적인 폐기 가능 OpenClaw home을 준비하고, 선택한 채널에 대한 Slack Socket Mode 구성을 패치하고, 포트 `38973`에서 `openclaw gateway run`을 시작하며, VNC 세션에서 Chrome을 계속 실행합니다. 이것은 “Slack과 실행 중인 claw가 있는 Linux 데스크톱을 남겨 달라” 모드입니다. `--gateway-setup`이 생략되면 봇-대-봇 Slack QA 레인이 기본값으로 유지됩니다.

`--credential-source env`에 필요한 입력:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 원격 모델 레인의 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에 `OPENAI_API_KEY`만 설정된 경우 Mantis는 Crabbox를 호출하기 전에 이를 `OPENCLAW_LIVE_OPENAI_KEY`에 매핑하여 Crabbox의 `OPENCLAW_*` env 전달이 VM 안으로 이를 전달할 수 있게 합니다.

유용한 Slack 데스크톱 플래그:

- `--lease-id <cbx_...>`는 운영자가 이미 VNC를 통해 Slack Web에 로그인한 머신에 대해 다시 실행합니다.
- `--gateway-setup`은 봇-대-봇 QA 레인만 실행하는 대신 VM에서 지속적인 OpenClaw Slack Gateway를 시작합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 지정하지 않으면 SUT 봇 토큰을 사용할 수 있을 때 Mantis가 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 도출합니다.
- `--slack-channel-id <id>`는 Gateway 설정에서 사용하는 Slack 채널 allowlist를 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`은 VM 안의 지속적인 Chrome 프로필을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로, 같은 lease에서 다시 실행해도 수동 Slack Web 로그인이 유지됩니다.
- `--credential-source convex --credential-role ci`는 직접 Slack env 토큰 대신 공유 자격 증명 풀을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack 라이브 레인으로 전달됩니다.

GitHub smoke 워크플로는 `Mantis Discord Smoke`입니다. 첫 번째 실제 시나리오의 before 및 after GitHub 워크플로는 `Mantis Discord Status Reactions`입니다. 이 워크플로는 다음을 받습니다.

- `baseline_ref`: queued-only 동작을 재현할 것으로 예상되는 ref입니다.
- `candidate_ref`: `queued -> thinking -> done`을 표시할 것으로 예상되는 ref입니다.

이 워크플로는 워크플로 하네스 ref를 checkout하고, 별도의 기준 및 후보 worktree를 빌드하고, 각 worktree에 대해 `discord-status-reactions-tool-only`를 실행하며, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 Actions 아티팩트로 업로드합니다. 또한 Crabbox 데스크톱 브라우저에서 각 레인의 타임라인 HTML을 렌더링하고, 해당 VNC 스크린샷을 결정적 타임라인 PNG와 함께 PR 댓글에 게시합니다. 같은 PR 댓글은 VNC 브라우저 렌더 중 캡처된 데스크톱 MP4 녹화로 연결되며, 스크린샷은 빠른 검토를 위해 인라인으로 유지됩니다. 워크플로는 다음 Crabbox 바이너리 릴리스가 나오기 전에 현재 데스크톱/브라우저 lease 플래그를 사용할 수 있도록 `openclaw/crabbox` main에서 Crabbox CLI를 빌드합니다.

PR 댓글에서 status-reactions 실행을 직접 트리거할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 트리거는 의도적으로 좁습니다. 이 트리거는 write, maintain, 또는 admin 접근 권한이 있는 사용자의 pull request 댓글에서만 실행되며, Discord 상태 반응 요청만 인식합니다. 기본적으로 알려진 문제가 있는 기준 ref와 현재 PR head SHA를 후보로 사용합니다. 메인테이너는 어느 ref든 재정의할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이며 시나리오 중심입니다. 두 번째 명령은 나중에 라벨, 변경된 파일, ClawSweeper 검토 결과를 기반으로 PR이나 이슈를 권장 Mantis 시나리오에 매핑할 수 있습니다.

## 실행 수명 주기

1. 자격 증명을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. 시나리오에 UI 증거가 필요할 때 데스크톱/브라우저 프로필을 준비합니다.
4. 기준 ref에 대한 깨끗한 checkout을 준비합니다.
5. 종속성을 설치하고 시나리오에 필요한 것만 빌드합니다.
6. 격리된 상태 디렉터리로 자식 OpenClaw Gateway를 시작합니다.
7. 라이브 전송, provider, 모델, 브라우저 프로필을 구성합니다.
8. 시나리오를 실행하고 기준 증거를 캡처합니다.
9. Gateway를 중지하고 로그를 보존합니다.
10. 같은 VM에서 후보 ref를 준비합니다.
11. 동일한 시나리오를 실행하고 후보 증거를 캡처합니다.
12. 오라클 결과와 시각적 증거를 비교합니다.
13. Markdown, JSON, 로그, 스크린샷, 선택적 trace 아티팩트를 작성합니다.
14. GitHub Actions 아티팩트를 업로드합니다.
15. 간결한 PR 또는 Discord 상태 메시지를 게시합니다.

시나리오는 서로 다른 두 가지 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: 기준이 예상된 방식으로 실패했습니다.
- **하네스 실패**: 버그 오라클이 의미를 갖기 전에 환경 설정, 자격 증명, Discord API, 브라우저, 또는 provider가 실패했습니다.

최종 보고서는 메인테이너가 불안정한 환경을 제품 동작과 혼동하지 않도록 이 사례들을 분리해야 합니다.

## Discord MVP

첫 번째 시나리오는 소스 답장 전달 모드가 `message_tool_only`인 길드 채널의 Discord 상태 반응을 대상으로 해야 합니다.

이것이 좋은 Mantis 시드인 이유:

- 트리거 메시지의 반응으로 Discord에서 보입니다.
- Discord 메시지 반응 상태를 통한 강력한 REST 오라클이 있습니다.
- 실제 OpenClaw Gateway, Discord 봇 인증, 메시지 디스패치, 소스 답장 전달 모드, 상태 반응 상태, 모델 턴 수명 주기를 실행합니다.
- 첫 구현을 정직하게 유지할 만큼 범위가 좁습니다.

예상 시나리오 형태:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

기준 증거는 tool-only 모드에서 queued 확인 반응은 있지만 수명 주기 전환은 없음을 보여야 합니다. 후보 증거는 `messages.statusReactions.enabled`가 명시적으로 true일 때 수명 주기 상태 반응이 실행됨을 보여야 합니다.

실행 가능한 첫 번째 slice는 opt-in Discord 라이브 QA 시나리오입니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

이 명령은 항상 켜진 길드 처리, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 그리고 명시적 상태 반응으로 SUT를 구성합니다. 오라클은 실제 Discord 트리거 메시지를 폴링하고 관측된 시퀀스 `👀 -> 🤔 -> 👍`를 기대합니다. 아티팩트에는 `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, 그리고 `discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 비공개 QA 스택을 기반으로 구축해야 합니다.

- `pnpm openclaw qa discord`는 이미 드라이버 및 SUT 봇으로 라이브 Discord 레인을 실행합니다.
- 라이브 전송 러너는 이미 `.artifacts/qa-e2e/` 아래에 보고서와 관측 메시지 아티팩트를 씁니다.
- Convex 자격 증명 임대는 이미 공유 라이브 전송 자격 증명에 대한 독점 접근을 제공합니다.
- 브라우저 제어 서비스는 이미 스크린샷, 스냅샷, headless 관리 프로필, 원격 CDP 프로필을 지원합니다.
- QA Lab에는 이미 전송 형태 테스트를 위한 디버거 UI와 버스가 있습니다.

첫 번째 Mantis 구현은 이러한 구성 요소 위에 얇은 전/후 러너와 하나의 시각적 증거 레이어를 더한 형태일 수 있습니다.

## 증거 모델

모든 실행은 안정적인 아티팩트 디렉터리를 씁니다.

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json`은 기계가 읽을 수 있는 단일 진실 공급원이어야 합니다. Markdown 보고서는 PR 댓글과 사람의 검토를 위한 것입니다.

요약에는 다음이 포함되어야 합니다.

- 테스트한 refs와 SHA
- 전송 및 시나리오 ID
- 머신 제공자와 머신 ID 또는 임대 ID
- 비밀 값 없는 자격 증명 출처
- baseline 결과
- candidate 결과
- 버그가 baseline에서 재현되었는지 여부
- candidate가 이를 수정했는지 여부
- 아티팩트 경로
- 정리된 설정 또는 정리 문제

스크린샷은 증거이지 비밀이 아닙니다. 그래도 비공개 채널 이름, 사용자 이름, 메시지 내용이 나타날 수 있으므로 redact 규율이 필요합니다. 공개 PR의 경우 redact 방식이 더 견고해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를 선호하세요.

## 브라우저와 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **Headless 자동화**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며, Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC 구조**: 로그인, MFA, Discord 자동화 방지, 또는 시각적 디버깅에 사람이 필요할 때 동일한 VM에서 활성화됩니다.

Discord 관찰자 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼 지속적이어야 하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은 개발자 노트북이 아니라 Mantis 머신 풀에 속합니다.

Mantis가 멈추면 다음 내용을 포함한 Discord 상태 메시지를 게시합니다.

- 실행 ID
- 시나리오 ID
- 머신 제공자
- 아티팩트 디렉터리
- 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 요인 설명

첫 번째 비공개 배포는 이러한 메시지를 기존 운영자 채널에 게시하고, 나중에 전용 Mantis 채널로 이동할 수 있습니다.

## 머신

Mantis는 첫 번째 원격 구현에서 Crabbox를 통한 AWS를 선호해야 합니다. Crabbox는 예열된 머신, 임대 추적, 하이드레이션, 로그, 결과, 정리를 제공합니다. AWS 용량이 너무 느리거나 사용할 수 없다면 동일한 머신 인터페이스 뒤에 Hetzner 제공자를 추가하세요.

최소 VM 요구사항:

- 데스크톱이 가능한 Chrome 또는 Chromium 설치가 있는 Linux
- 브라우저 자동화를 위한 CDP 접근
- 구조를 위한 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용할 때 Playwright Chromium 브라우저 캐시
- OpenClaw Gateway 하나, 브라우저 하나, 모델 실행 하나를 위한 충분한 CPU와 메모리
- Discord, GitHub, 모델 제공자, 자격 증명 브로커로의 아웃바운드 접근

VM은 예상된 자격 증명 또는 브라우저 프로필 저장소 밖에 수명이 긴 원시 비밀을 보관해서는 안 됩니다.

## 비밀

비밀은 원격 실행의 경우 GitHub 조직 또는 저장소 secrets에, 로컬 실행의 경우 로컬 운영자가 제어하는 비밀 파일에 저장됩니다.

권장 비밀 이름:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- 공개 GitHub 아티팩트 업로드용 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반적인 출처로 남아 있어야 합니다. GitHub secrets는 브로커와 fallback 레인을 부트스트랩합니다. Discord 상태 반응 워크플로는 Mantis Crabbox secrets를 Crabbox CLI가 기대하는 `CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` 환경 변수로 다시 매핑합니다. 일반 `CRABBOX_*` GitHub secret 이름은 호환성 fallback으로 계속 허용됩니다.

Mantis 러너는 절대 다음을 출력해서는 안 됩니다.

- Discord 봇 토큰
- 제공자 API 키
- 브라우저 쿠키
- 인증 프로필 내용
- VNC 비밀번호
- 원시 자격 증명 payload

공개 아티팩트 업로드는 봇, 길드, 채널, 메시지 ID 같은 Discord 대상 메타데이터도 redact해야 합니다. GitHub smoke 워크플로는 이러한 이유로 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅, 로그에 붙여넣어진 경우 새 비밀이 저장된 뒤 해당 토큰을 교체하세요.

## GitHub 아티팩트와 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions 아티팩트로 업로드해야 합니다. 워크플로가 버그 보고서 또는 수정 PR을 위해 실행되는 경우, redact된 PNG 스크린샷도 `qa-artifacts` 브랜치에 게시하고 해당 버그 또는 수정 PR에 인라인 전/후 스크린샷이 포함된 댓글을 upsert해야 합니다. 기본 증거를 일반 QA 자동화 PR에만 게시하지 마세요. 원시 로그, 관측 메시지, 기타 큰 증거는 Actions 아티팩트에 남깁니다.

프로덕션 워크플로는 해당 댓글을 `github-actions[bot]`가 아니라 Mantis GitHub App으로 게시해야 합니다. 앱 ID와 private key를 `MANTIS_GITHUB_APP_ID` 및 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets로 저장하세요. 워크플로는 숨겨진 마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며, 더 오래된 봇 소유 마커를 편집할 수 없으면 Mantis 소유의 새 댓글을 만듭니다.

PR 댓글은 짧고 시각적이어야 합니다.

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

하네스 실패 때문에 실행이 실패한 경우, 댓글은 candidate가 실패했다고 암시하지 말고 그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 올바른 봇 권한이 있고 안전하게 교체할 수 있다면 다른 앱을 만들지 말고 해당 애플리케이션을 재사용하세요.

초기 운영자 알림 채널은 secrets 또는 배포 구성을 통해 설정하세요. 먼저 기존 maintainer 또는 운영 채널을 가리키게 한 뒤, 전용 Mantis 채널이 생기면 그곳으로 이동할 수 있습니다.

이 문서에 길드 ID, 채널 ID, 봇 토큰, 브라우저 쿠키, VNC 비밀번호를 넣지 마세요. GitHub secrets, 자격 증명 브로커, 또는 운영자의 로컬 비밀 저장소에 저장하세요.

## 시나리오 추가하기

Mantis 시나리오는 다음을 선언해야 합니다.

- ID와 제목
- 전송
- 필요한 자격 증명
- baseline ref 정책
- candidate ref 정책
- OpenClaw 구성 패치
- 설정 단계
- 자극
- 예상 baseline 오라클
- 예상 candidate 오라클
- 시각적 캡처 대상
- timeout 예산
- 정리 단계

시나리오는 작고 타입이 지정된 오라클을 선호해야 합니다.

- 반응 버그를 위한 Discord 반응 상태
- 스레딩 버그를 위한 Discord 메시지 참조
- Slack 버그를 위한 Slack 스레드 ts 및 반응 API 상태
- 이메일 버그를 위한 이메일 메시지 ID와 헤더
- UI가 유일하게 신뢰할 수 있는 관측 대상일 때 브라우저 스크린샷

비전 검사는 추가적이어야 합니다. 플랫폼 API가 버그를 증명할 수 있다면 API를 통과/실패 오라클로 사용하고 스크린샷은 사람의 신뢰를 위해 유지하세요.

## 제공자 확장

Discord 이후 동일한 러너는 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용하는 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답장 관계, 재시작 재개.

각 전송에는 저렴한 smoke 시나리오 하나와 하나 이상의 버그 클래스 시나리오가 있어야 합니다. 비용이 큰 시각적 시나리오는 opt-in으로 유지해야 합니다.

## 미해결 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇이 드라이버가 되어야 하고 어떤 봇이 SUT가 되어야 하나요?
- 관찰자 브라우저 로그인은 첫 단계에서 사람 Discord 계정, 테스트 계정, 또는 봇이 읽을 수 있는 REST 증거만 사용해야 하나요?
- GitHub는 PR의 Mantis 아티팩트를 얼마나 오래 보존해야 하나요?
- ClawSweeper는 언제 maintainer 명령을 기다리는 대신 Mantis를 자동으로 추천해야 하나요?
- 공개 PR에 업로드하기 전에 스크린샷을 redact하거나 crop해야 하나요?
