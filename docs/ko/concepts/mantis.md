---
read_when:
    - OpenClaw 버그를 위한 라이브 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 대한 전후 검증 추가
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 실제 전송 채널에서 OpenClaw 버그를 재현하고, 수정 전후 증거를 캡처하며, 아티팩트를 PR에 첨부하기 위한 시각적 엔드 투 엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-04T06:23:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 전송 수단, 그리고 눈에 보이는 증거가 필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진 불량 ref에 대해 시나리오를 실행하고, 증거를 캡처한 다음, 후보 ref에 대해 같은 시나리오를 실행하고, maintainer가 PR 또는 로컬 명령에서 검사할 수 있는 아티팩트로 비교 결과를 게시합니다.

Mantis는 Discord에서 시작합니다. Discord는 실제 봇 인증, 실제 길드 채널, 반응, 스레드, 네이티브 명령, 그리고 사람이 전송 수단에 표시된 내용을 시각적으로 확인할 수 있는 브라우저 UI라는 가치 높은 첫 번째 레인을 제공하기 때문입니다.

## 목표

- 사용자가 보는 것과 같은 전송 형태로 GitHub 이슈 또는 PR의 버그를 재현합니다.
- 수정 적용 전에 baseline ref에서 **before** 아티팩트를 캡처합니다.
- 수정 적용 후 candidate ref에서 **after** 아티팩트를 캡처합니다.
- 가능한 경우 Discord REST 반응 읽기 또는 채널 transcript 확인 같은 결정적 oracle을 사용합니다.
- 버그에 눈에 보이는 UI 표면이 있는 경우 스크린샷을 캡처합니다.
- 에이전트가 제어하는 CLI에서 로컬로, 그리고 GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화, provider 인증이 멈췄을 때 VNC 복구에 충분한 머신 상태를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 operator Discord 채널에 간결한 상태를 게시합니다.

## 비목표

- Mantis는 단위 테스트를 대체하지 않습니다. Mantis 실행은 일반적으로 수정 사항을 이해한 뒤 더 작은 회귀 테스트가 되어야 합니다.
- Mantis는 일반적인 빠른 CI gate가 아닙니다. 더 느리고, live credentials를 사용하며, live 환경이 중요한 버그에만 사용됩니다.
- Mantis는 정상 동작에 사람이 필요해서는 안 됩니다. 수동 VNC는 복구 경로이지 정상 경로가 아닙니다.
- Mantis는 원시 secret을 아티팩트, 로그, 스크린샷, Markdown 보고서 또는 PR 댓글에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA 스택에 속합니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 시나리오 런타임, 전송 adapter, 증거 schema, 로컬 CLI를 소유합니다.
- QA Lab은 live 전송 harness 구성 요소, 브라우저 캡처 helper, 아티팩트 writer를 소유합니다.
- Crabbox는 원격 VM이 필요할 때 예열된 Linux 머신을 소유합니다.
- GitHub Actions는 원격 workflow entrypoint와 아티팩트 보존을 소유합니다.
- ClawSweeper는 GitHub 댓글 routing을 소유합니다. maintainer 명령을 파싱하고, workflow를 dispatch하며, 최종 PR 댓글을 게시합니다.
- OpenClaw agent는 시나리오에 agentic 설정, 디버깅 또는 stuck-state 보고가 필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 전송 지식을 OpenClaw에, 머신 scheduling을 Crabbox에, maintainer workflow glue를 ClawSweeper에 둡니다.

## 명령 형태

첫 번째 로컬 명령은 Discord 봇, 길드, 채널, 메시지 전송, 반응 전송, 아티팩트 경로를 검증합니다.

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

로컬 before 및 after runner는 이 형태를 받습니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner는 output 디렉터리 아래에 분리된 baseline 및 candidate worktree를 만들고, dependencies를 설치하고, 각 ref를 build하고, `--allow-failures`로 시나리오를 실행한 다음 `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 작성합니다. 첫 번째 Discord 시나리오에서 성공적인 검증은 baseline status가 `fail`이고 candidate status가 `pass`임을 의미합니다.

첫 번째 VM/browser primitive는 desktop smoke입니다.

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox desktop 머신을 임대하거나 재사용하고, VNC 세션 안에서 보이는 브라우저를 시작하고, desktop을 캡처하고, 아티팩트를 로컬 output 디렉터리로 가져오며, 보고서에 재연결 명령을 작성합니다. 이 명령은 Mantis 레인에서 desktop/VNC coverage가 동작하는 첫 provider이기 때문에 기본적으로 Hetzner provider를 사용합니다. 다른 Crabbox fleet에 대해 실행할 때는 `--provider`, `--crabbox-bin` 또는 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 override합니다.

유용한 desktop smoke flag:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 예열된 desktop을 재사용합니다.
- `--browser-url <url>`은 보이는 브라우저에서 열 페이지를 변경합니다.
- `--html-file <path>`는 repo-local HTML 아티팩트를 보이는 브라우저에 렌더링합니다. Mantis는 이를 사용해 생성된 Discord status-reaction timeline을 실제 Crabbox desktop을 통해 캡처합니다.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 생성된 passing lease를 VNC 검사용으로 열어 둡니다. 실패한 실행은 operator가 다시 연결할 수 있도록 lease가 생성된 경우 기본적으로 lease를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 머신 크기와 lease 수명을 조정합니다.

첫 번째 전체 desktop 전송 primitive는 Slack desktop smoke입니다.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox desktop 머신을 임대하거나 재사용하고, 현재 checkout을 VM으로 sync하고, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC 브라우저에서 Slack Web을 열고, 보이는 desktop을 캡처하며, Slack QA 아티팩트와 VNC 스크린샷을 모두 로컬 output 디렉터리로 복사합니다. 이는 SUT OpenClaw gateway와 브라우저가 모두 같은 Linux desktop VM 안에 존재하는 첫 번째 Mantis 형태입니다.

`--gateway-setup`을 사용하면 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에 지속성 있는 일회용 OpenClaw home을 준비하고, 선택한 채널에 맞게 Slack Socket Mode 구성을 patch하고, port `38973`에서 `openclaw gateway run`을 시작하며, VNC 세션에서 Chrome이 계속 실행되도록 유지합니다. 이는 "Slack과 실행 중인 claw가 있는 Linux desktop을 남겨 달라" 모드입니다. `--gateway-setup`을 생략하면 bot-to-bot Slack QA 레인이 기본값으로 유지됩니다.

`--credential-source env`에 필요한 입력:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- remote model 레인용 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에 `OPENAI_API_KEY`만 설정된 경우, Mantis는 Crabbox를 호출하기 전에 이를 `OPENCLAW_LIVE_OPENAI_KEY`로 매핑하여 Crabbox의 `OPENCLAW_*` env forwarding이 VM 안으로 전달할 수 있게 합니다.

유용한 Slack desktop flag:

- `--lease-id <cbx_...>`는 operator가 이미 VNC를 통해 Slack Web에 로그인한 머신에 대해 다시 실행합니다.
- `--gateway-setup`은 bot-to-bot QA 레인만 실행하는 대신 VM에서 지속성 있는 OpenClaw Slack gateway를 시작합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 없으면 SUT bot token을 사용할 수 있을 때 Mantis가 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 파생합니다.
- `--slack-channel-id <id>`는 gateway setup에서 사용하는 Slack 채널 allowlist를 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`는 VM 안의 지속성 있는 Chrome profile을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로 같은 lease에서 수동 Slack Web 로그인이 rerun 후에도 유지됩니다.
- `--credential-source convex --credential-role ci`는 직접 Slack env token 대신 공유 credential pool을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack live 레인으로 전달됩니다.

GitHub smoke workflow는 `Mantis Discord Smoke`입니다. 첫 번째 실제 시나리오를 위한 before 및 after GitHub workflow는 `Mantis Discord Status Reactions`입니다. 다음을 받습니다.

- `baseline_ref`: queued-only 동작을 재현할 것으로 예상되는 ref입니다.
- `candidate_ref`: `queued -> thinking -> done`을 표시할 것으로 예상되는 ref입니다.

이 workflow는 workflow harness ref를 checkout하고, 별도의 baseline 및 candidate worktree를 build하고, 각 worktree에 대해 `discord-status-reactions-tool-only`를 실행하며, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 Actions 아티팩트로 업로드합니다. 또한 각 레인의 timeline HTML을 Crabbox desktop 브라우저에서 렌더링하고, 결정적 timeline PNG 옆에 해당 VNC 스크린샷을 PR 댓글에 게시합니다. workflow는 다음 Crabbox binary release가 나오기 전에 현재 desktop/browser lease flag를 사용할 수 있도록 `openclaw/crabbox` main에서 Crabbox CLI를 build합니다.

PR 댓글에서 status-reactions 실행을 직접 trigger할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 trigger는 의도적으로 좁습니다. write, maintain 또는 admin access가 있는 사용자의 pull request 댓글에서만 실행되며, Discord status-reaction 요청만 인식합니다. 기본적으로 알려진 bad baseline ref와 현재 PR head SHA를 candidate로 사용합니다. Maintainer는 어느 ref든 override할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이고 시나리오 중심입니다. 두 번째 명령은 나중에 label, 변경된 file, ClawSweeper review finding을 바탕으로 PR 또는 이슈를 권장 Mantis 시나리오에 매핑할 수 있습니다.

## 실행 생명주기

1. credential을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. 시나리오에 UI 증거가 필요한 경우 desktop/browser profile을 준비합니다.
4. baseline ref를 위한 깨끗한 checkout을 준비합니다.
5. dependencies를 설치하고 시나리오에 필요한 것만 build합니다.
6. 격리된 state 디렉터리로 child OpenClaw Gateway를 시작합니다.
7. live 전송, provider, model, browser profile을 구성합니다.
8. 시나리오를 실행하고 baseline 증거를 캡처합니다.
9. gateway를 중지하고 로그를 보존합니다.
10. 같은 VM에서 candidate ref를 준비합니다.
11. 같은 시나리오를 실행하고 candidate 증거를 캡처합니다.
12. oracle 결과와 시각적 증거를 비교합니다.
13. Markdown, JSON, 로그, 스크린샷, 선택적 trace 아티팩트를 작성합니다.
14. GitHub Actions 아티팩트를 업로드합니다.
15. 간결한 PR 또는 Discord 상태 메시지를 게시합니다.

시나리오는 두 가지 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: baseline이 예상된 방식으로 실패했습니다.
- **Harness 실패**: bug oracle이 의미를 갖기 전에 환경 설정, credential, Discord API, 브라우저 또는 provider가 실패했습니다.

최종 보고서는 maintainer가 불안정한 환경을 product 동작과 혼동하지 않도록 이러한 사례를 분리해야 합니다.

## Discord MVP

첫 번째 시나리오는 source reply delivery mode가 `message_tool_only`인 guild channel의 Discord status reaction을 대상으로 해야 합니다.

좋은 Mantis seed인 이유:

- triggering message의 반응으로 Discord에 표시됩니다.
- Discord message reaction state를 통한 강력한 REST oracle이 있습니다.
- 실제 OpenClaw Gateway, Discord bot auth, message dispatch, source reply delivery mode, status reaction state, model turn lifecycle을 exercise합니다.
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

Baseline 증거는 queued acknowledgement reaction은 보이지만 tool-only mode에서 lifecycle transition은 없음을 보여야 합니다. Candidate 증거는 `messages.statusReactions.enabled`가 명시적으로 `true`일 때 lifecycle status reaction이 실행됨을 보여야 합니다.

실행 가능한 첫 번째 slice는 opt-in Discord live QA 시나리오입니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

항상 켜진 길드 처리, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 명시적 상태 반응으로 SUT를 구성합니다. 오라클은
실제 Discord 트리거 메시지를 폴링하고 관찰된 시퀀스
`👀 -> 🤔 -> 👍`을 기대합니다. 아티팩트에는 `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`,
`discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 비공개 QA 스택을 기반으로 해야 합니다.

- `pnpm openclaw qa discord`는 이미 드라이버 및 SUT 봇으로 라이브 Discord 레인을 실행합니다.
- 라이브 전송 러너는 이미 `.artifacts/qa-e2e/` 아래에 보고서와 관찰된 메시지
  아티팩트를 씁니다.
- Convex 자격 증명 임대는 이미 공유 라이브 전송 자격 증명에 대한 독점 접근을 제공합니다.
- 브라우저 제어 서비스는 이미 스크린샷, 스냅샷,
  헤드리스 관리 프로필, 원격 CDP 프로필을 지원합니다.
- QA Lab에는 이미 전송 형태 테스트를 위한 디버거 UI와 버스가 있습니다.

첫 번째 Mantis 구현은 이러한 구성 요소 위의 얇은 전/후 러너와
하나의 시각적 증거 레이어일 수 있습니다.

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

`mantis-summary.json`은 기계가 읽을 수 있는 단일 진실 공급원이어야 합니다.
Markdown 보고서는 PR 댓글과 사람의 검토를 위한 것입니다.

요약에는 다음이 포함되어야 합니다.

- 테스트한 ref와 SHA
- 전송 및 시나리오 id
- 머신 제공자 및 머신 id 또는 임대 id
- 비밀 값이 없는 자격 증명 출처
- 기준 결과
- 후보 결과
- 버그가 기준에서 재현되었는지 여부
- 후보가 이를 수정했는지 여부
- 아티팩트 경로
- 삭제 처리된 설정 또는 정리 문제

스크린샷은 증거이지 비밀이 아닙니다. 그래도 삭제 규율이 필요합니다.
비공개 채널 이름, 사용자 이름 또는 메시지 내용이 나타날 수 있습니다. 공개 PR의 경우,
삭제 스토리가 더 강해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를
선호하세요.

## 브라우저 및 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **헤드리스 자동화**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며,
  Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC 구조**: 로그인, MFA, Discord 자동화 방지 또는 시각적 디버깅에 사람이
  필요할 때 같은 VM에서 활성화됩니다.

Discord 관찰자 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼
지속적이어야 하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은
개발자 노트북이 아니라 Mantis 머신 풀에 속합니다.

Mantis가 막히면 다음이 포함된 Discord 상태 메시지를 게시합니다.

- 실행 id
- 시나리오 id
- 머신 제공자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 사유 텍스트

첫 번째 비공개 배포는 이러한 메시지를 기존 운영자 채널에 게시하고,
나중에 전용 Mantis 채널로 이동할 수 있습니다.

## 머신

Mantis는 첫 번째 원격 구현에서 Crabbox를 통한 AWS를 선호해야 합니다.
Crabbox는 예열된 머신, 임대 추적, 수화, 로그, 결과, 정리를 제공합니다.
AWS 용량이 너무 느리거나 사용할 수 없는 경우, 같은 머신 인터페이스 뒤에
Hetzner 제공자를 추가하세요.

최소 VM 요구 사항:

- 데스크톱 가능한 Chrome 또는 Chromium 설치가 있는 Linux
- 브라우저 자동화를 위한 CDP 접근
- 구조용 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용할 때 Playwright Chromium 브라우저 캐시
- 하나의 OpenClaw Gateway, 하나의 브라우저, 하나의 모델 실행을 위한 충분한 CPU와 메모리
- Discord, GitHub, 모델 제공자, 자격 증명 브로커로의 아웃바운드 접근

VM은 예상되는 자격 증명 또는 브라우저 프로필 저장소 밖에 장기 원시 비밀을
보관해서는 안 됩니다.

## 비밀

비밀은 원격 실행의 경우 GitHub 조직 또는 저장소 비밀에, 로컬 실행의 경우
로컬 운영자가 제어하는 비밀 파일에 있습니다.

권장 비밀 이름:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- 공개 GitHub 아티팩트 업로드의 경우 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반적인 출처로
남아야 합니다. GitHub 비밀은 브로커와 폴백 레인을 부트스트랩합니다.
Discord 상태 반응 워크플로는 Mantis Crabbox 비밀을 Crabbox CLI가 기대하는
`CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` 환경 변수로 다시 매핑합니다.
일반 `CRABBOX_*` GitHub 비밀 이름은 호환성 폴백으로 계속 허용됩니다.

Mantis 러너는 다음을 절대 출력해서는 안 됩니다.

- Discord 봇 토큰
- 제공자 API 키
- 브라우저 쿠키
- 인증 프로필 내용
- VNC 비밀번호
- 원시 자격 증명 페이로드

공개 아티팩트 업로드는 봇, 길드, 채널, 메시지 id 같은 Discord 대상 메타데이터도
삭제해야 합니다. GitHub 스모크 워크플로는 이러한 이유로
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅 또는 로그에 붙여넣어진 경우, 새 비밀이 저장된 뒤
이를 교체하세요.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions 아티팩트로 업로드해야 합니다.
버그 보고서 또는 수정 PR에 대해 워크플로가 실행될 때는 삭제 처리된 PNG 스크린샷도
`qa-artifacts` 브랜치에 게시하고, 해당 버그 또는 수정 PR에 전/후 스크린샷을
인라인으로 포함한 댓글을 upsert해야 합니다. 일반 QA 자동화 PR에만 주요 증명을
게시하지 마세요. 원시 로그, 관찰된 메시지, 기타 큰 증거는 Actions 아티팩트에
남겨 둡니다.

프로덕션 워크플로는 `github-actions[bot]`가 아니라 Mantis GitHub App으로 해당 댓글을
게시해야 합니다. 앱 id와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및
`MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 비밀로 저장하세요. 워크플로는 숨겨진
마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며,
이전 bot 소유 마커를 편집할 수 없으면 새 Mantis 소유 댓글을 생성합니다.

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

하네스 실패로 실행이 실패한 경우, 댓글은 후보가 실패했다고 암시하는 대신
그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 해당 애플리케이션이
올바른 봇 권한을 가지고 안전하게 교체될 수 있다면, 다른 앱을 만들지 말고 이를 재사용하세요.

초기 운영자 알림 채널은 비밀 또는 배포 구성을 통해 설정하세요. 처음에는 기존
관리자 또는 운영 채널을 가리키고, 전용 Mantis 채널이 생긴 뒤 그곳으로 이동할 수 있습니다.

길드 id, 채널 id, 봇 토큰, 브라우저 쿠키 또는 VNC 비밀번호를 이 문서에 넣지 마세요.
GitHub 비밀, 자격 증명 브로커 또는 운영자의 로컬 비밀 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- id 및 제목
- 전송
- 필요한 자격 증명
- 기준 ref 정책
- 후보 ref 정책
- OpenClaw 구성 패치
- 설정 단계
- 자극
- 예상 기준 오라클
- 예상 후보 오라클
- 시각적 캡처 대상
- 제한 시간 예산
- 정리 단계

시나리오는 작고 타입이 지정된 오라클을 선호해야 합니다.

- 반응 버그의 경우 Discord 반응 상태
- 스레딩 버그의 경우 Discord 메시지 참조
- Slack 버그의 경우 Slack 스레드 ts 및 반응 API 상태
- 이메일 버그의 경우 이메일 메시지 id 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상일 때 브라우저 스크린샷

비전 검사는 추가적이어야 합니다. 플랫폼 API가 버그를 증명할 수 있다면,
API를 통과/실패 오라클로 사용하고 스크린샷은 사람의 확신을 위해 유지하세요.

## 제공자 확장

Discord 이후 같은 러너는 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용하는 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 사용 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답장 관계, 재시작 재개.

각 전송에는 하나의 저렴한 스모크 시나리오와 하나 이상의 버그 클래스 시나리오가
있어야 합니다. 비용이 큰 시각적 시나리오는 옵트인으로 유지해야 합니다.

## 열린 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇이 드라이버이고 어떤 봇이 SUT여야 하나요?
- 관찰자 브라우저 로그인은 첫 단계에서 사람 Discord 계정, 테스트 계정 또는
  bot이 읽을 수 있는 REST 증거만 사용해야 하나요?
- GitHub는 PR용 Mantis 아티팩트를 얼마나 오래 보존해야 하나요?
- ClawSweeper는 언제 관리자 명령을 기다리는 대신 Mantis를 자동으로 권장해야 하나요?
- 공개 PR에 업로드하기 전에 스크린샷을 삭제 처리하거나 잘라내야 하나요?
