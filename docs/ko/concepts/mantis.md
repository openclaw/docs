---
read_when:
    - OpenClaw 버그에 대한 라이브 시각적 QA 구축 또는 실행
    - 풀 리퀘스트에 전후 검증 추가하기
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 라이브 트랜스포트에서 OpenClaw 버그를 재현하고, 전후 증거를 캡처하며, 아티팩트를 PR에 첨부하기 위한 시각적 엔드투엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-05T08:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 전송 계층, 가시적인 증거가 필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진 불량 ref에 대해 시나리오를 실행하고, 증거를 캡처한 뒤, 후보 ref에 대해 같은 시나리오를 실행하고, 관리자가 PR 또는 로컬 명령에서 검사할 수 있는 아티팩트로 비교 결과를 게시합니다.

Mantis는 Discord부터 시작합니다. Discord는 실제 봇 인증, 실제 길드 채널, 반응, 스레드, 네이티브 명령, 그리고 사람이 전송 계층에 표시된 내용을 시각적으로 확인할 수 있는 브라우저 UI를 제공하므로 가치가 높은 첫 번째 레인을 제공하기 때문입니다.

## 목표

- 사용자가 보는 것과 같은 전송 계층 형태로 GitHub 이슈 또는 PR의 버그를 재현합니다.
- 수정 사항을 적용하기 전에 기준 ref에서 **수정 전** 아티팩트를 캡처합니다.
- 수정 사항을 적용한 후 후보 ref에서 **수정 후** 아티팩트를 캡처합니다.
- 가능하면 Discord REST 반응 읽기나 채널 트랜스크립트 확인 같은 결정적 오라클을 사용합니다.
- 버그에 표시되는 UI 표면이 있으면 스크린샷을 캡처합니다.
- 에이전트가 제어하는 CLI에서 로컬로 실행하고 GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화 또는 제공자 인증이 멈췄을 때 VNC 복구에 충분한 머신 상태를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 운영자 Discord 채널에 간결한 상태를 게시합니다.

## 범위 외

- Mantis는 단위 테스트를 대체하지 않습니다. Mantis 실행은 보통 수정 사항을 이해한 뒤 더 작은 회귀 테스트가 되어야 합니다.
- Mantis는 일반적인 빠른 CI 게이트가 아닙니다. 더 느리고, 라이브 자격 증명을 사용하며, 라이브 환경이 중요한 버그에만 사용됩니다.
- Mantis는 정상 동작에 사람이 필요하지 않아야 합니다. 수동 VNC는 정상 경로가 아니라 복구 경로입니다.
- Mantis는 원시 시크릿을 아티팩트, 로그, 스크린샷, Markdown 보고서 또는 PR 댓글에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA 스택에 있습니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 시나리오 런타임, 전송 계층 어댑터, 증거 스키마, 로컬 CLI를 소유합니다.
- QA Lab은 라이브 전송 계층 하네스 조각, 브라우저 캡처 헬퍼, 아티팩트 작성기를 소유합니다.
- 원격 VM이 필요할 때 Crabbox는 예열된 Linux 머신을 소유합니다.
- GitHub Actions는 원격 워크플로 진입점과 아티팩트 보존을 소유합니다.
- ClawSweeper는 GitHub 댓글 라우팅을 소유합니다. 관리자 명령 파싱, 워크플로 디스패치, 최종 PR 댓글 게시를 담당합니다.
- 시나리오에 에이전트 기반 설정, 디버깅 또는 멈춤 상태 보고가 필요할 때 OpenClaw 에이전트는 Codex를 통해 Mantis를 구동합니다.

이 경계는 전송 계층 지식을 OpenClaw에, 머신 스케줄링을 Crabbox에, 관리자 워크플로 연결 로직을 ClawSweeper에 유지합니다.

## 명령 형태

첫 번째 로컬 명령은 Discord 봇, 길드, 채널, 메시지 전송, 반응 전송, 아티팩트 경로를 검증합니다.

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

로컬 수정 전/수정 후 러너는 다음 형태를 받습니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

러너는 출력 디렉터리 아래에 분리된 기준 및 후보 워크트리를 만들고, 의존성을 설치하고, 각 ref를 빌드하고, `--allow-failures`로 시나리오를 실행한 뒤 `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 작성합니다. 첫 번째 Discord 시나리오에서 성공적인 검증은 기준 상태가 `fail`이고 후보 상태가 `pass`임을 의미합니다.

첫 번째 VM/브라우저 기본 기능은 데스크톱 스모크입니다.

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox 데스크톱 머신을 임대하거나 재사용하고, VNC 세션 안에서 표시되는 브라우저를 시작하고, 데스크톱을 캡처하고, 아티팩트를 로컬 출력 디렉터리로 가져오고, 보고서에 재연결 명령을 작성합니다. 이 명령은 Mantis 레인에서 작동하는 데스크톱/VNC 커버리지를 제공하는 첫 번째 제공자이므로 기본적으로 Hetzner 제공자를 사용합니다. 다른 Crabbox 플릿에 대해 실행할 때는 `--provider`, `--crabbox-bin` 또는 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 재정의하세요.

유용한 데스크톱 스모크 플래그:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 예열된 데스크톱을 재사용합니다.
- `--browser-url <url>`은 표시되는 브라우저에서 열 페이지를 변경합니다.
- `--html-file <path>`는 저장소 로컬 HTML 아티팩트를 표시되는 브라우저에서 렌더링합니다. Mantis는 실제 Crabbox 데스크톱을 통해 생성된 Discord 상태 반응 타임라인을 캡처하는 데 이것을 사용합니다.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 생성되어 통과한 임대를 VNC 검사용으로 열린 상태로 유지합니다. 실패한 실행은 운영자가 다시 연결할 수 있도록 임대가 생성된 경우 기본적으로 임대를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 머신 크기와 임대 수명을 조정합니다.

첫 번째 전체 데스크톱 전송 계층 기본 기능은 Slack 데스크톱 스모크입니다.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱 머신을 임대하거나 재사용하고, 현재 체크아웃을 VM에 동기화하고, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC 브라우저에서 Slack Web을 열고, 표시되는 데스크톱을 캡처하고, Slack QA 아티팩트와 VNC 스크린샷을 모두 로컬 출력 디렉터리로 복사합니다. 이것은 SUT OpenClaw Gateway와 브라우저가 모두 같은 Linux 데스크톱 VM 안에 있는 첫 번째 Mantis 형태입니다.

`--gateway-setup`을 사용하면 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에 지속형 일회용 OpenClaw 홈을 준비하고, 선택한 채널에 대한 Slack Socket Mode 구성을 패치하고, 포트 `38973`에서 `openclaw gateway run`을 시작하고, VNC 세션에서 Chrome을 계속 실행합니다. 이것은 "Slack과 claw가 실행 중인 Linux 데스크톱을 남겨 달라" 모드입니다. `--gateway-setup`을 생략하면 봇 대 봇 Slack QA 레인이 기본값으로 유지됩니다.

`--credential-source env`에 필요한 입력:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 원격 모델 레인용 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에 `OPENAI_API_KEY`만 설정되어 있으면, Mantis는 Crabbox를 호출하기 전에 이를 `OPENCLAW_LIVE_OPENAI_KEY`로 매핑하여 Crabbox의 `OPENCLAW_*` env 전달이 VM 안으로 옮길 수 있게 합니다.

유용한 Slack 데스크톱 플래그:

- `--lease-id <cbx_...>`는 운영자가 이미 VNC를 통해 Slack Web에 로그인한 머신에 대해 다시 실행합니다.
- `--gateway-setup`은 봇 대 봇 QA 레인만 실행하는 대신 VM에서 지속형 OpenClaw Slack Gateway를 시작합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 없으면 SUT 봇 토큰을 사용할 수 있을 때 Mantis가 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 도출합니다.
- `--slack-channel-id <id>`는 Gateway 설정에서 사용하는 Slack 채널 허용 목록을 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`는 VM 안의 지속형 Chrome 프로필을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로 같은 임대에서 다시 실행할 때 수동 Slack Web 로그인이 유지됩니다.
- `--credential-source convex --credential-role ci`는 직접 Slack env 토큰 대신 공유 자격 증명 풀을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack 라이브 레인으로 전달됩니다.

GitHub 스모크 워크플로는 `Mantis Discord Smoke`입니다. 첫 번째 실제 시나리오의 수정 전/수정 후 GitHub 워크플로는 `Mantis Discord Status Reactions`입니다. 다음을 받습니다.

- `baseline_ref`: queued-only 동작을 재현할 것으로 예상되는 ref.
- `candidate_ref`: `queued -> thinking -> done`을 표시할 것으로 예상되는 ref.

워크플로 하네스 ref를 체크아웃하고, 별도의 기준 및 후보 워크트리를 빌드하고, 각 워크트리에 대해 `discord-status-reactions-tool-only`를 실행하고, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 Actions 아티팩트로 업로드합니다. 또한 Crabbox 데스크톱 브라우저에서 각 레인의 타임라인 HTML을 렌더링하고, PR 댓글에서 결정적 타임라인 PNG 옆에 해당 VNC 스크린샷을 게시합니다. 같은 PR 댓글은 `crabbox media preview`로 생성된 가벼운 모션 트리밍 GIF 미리보기를 포함하고, 일치하는 모션 트리밍 MP4 클립으로 연결하며, 심층 검사를 위해 전체 데스크톱 MP4 파일을 유지합니다. 빠른 검토를 위해 스크린샷은 인라인으로 유지됩니다. 워크플로는 다음 Crabbox 바이너리 릴리스가 나오기 전에 현재 데스크톱/브라우저 임대 플래그를 사용할 수 있도록 `openclaw/crabbox` main에서 Crabbox CLI를 빌드합니다.

`Mantis Scenario`는 범용 수동 진입점입니다. `scenario_id`, `candidate_ref`, 선택적 `baseline_ref`, 선택적 `pr_number`를 받은 뒤 시나리오가 소유한 워크플로를 디스패치합니다. 래퍼는 의도적으로 얇습니다. 시나리오 워크플로는 여전히 자체 전송 계층 설정, 자격 증명, VM 클래스, 예상 오라클, 아티팩트 매니페스트를 소유합니다.

`Mantis Slack Desktop Smoke`는 첫 번째 Slack VM 워크플로입니다. 별도 워크트리에서 신뢰할 수 있는 후보 ref를 체크아웃하고, Crabbox Linux 데스크톱을 임대하고, 해당 후보에 대해 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`을 실행하고, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 녹화하고, `crabbox media preview`로 모션 트리밍 미리보기를 생성하고, 전체 아티팩트 디렉터리를 업로드하고, 선택적으로 대상 PR에 인라인 증거 댓글을 게시합니다. 봇 대 봇 Slack 트랜스크립트만 원할 때가 아니라 "Slack과 claw가 실행 중인 Linux 데스크톱"을 원할 때 이 레인을 사용하세요.

모든 PR 게시 시나리오는 보고서 옆에 `mantis-evidence.json`을 작성합니다. 이 스키마는 시나리오 코드와 GitHub 댓글 사이의 인계 지점입니다.

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

아티팩트 `path` 값은 매니페스트 디렉터리를 기준으로 한 상대 경로입니다. `targetPath` 값은 `qa-artifacts` 브랜치 게시 디렉터리 아래의 상대 경로입니다. 게시자는 경로 순회를 거부하고 선택적 미리보기나 동영상을 사용할 수 없을 때 `"required": false`로 표시된 항목을 건너뜁니다.

지원되는 아티팩트 종류:

- `timeline`: 결정적 시나리오 스크린샷으로, 보통 수정 전/수정 후입니다.
- `desktopScreenshot`: VNC/브라우저 데스크톱 스크린샷입니다.
- `motionPreview`: 데스크톱 녹화에서 생성한 인라인 애니메이션 GIF입니다.
- `motionClip`: 정적 앞부분과 뒷부분을 제거한 모션 트리밍 MP4입니다.
- `fullVideo`: 심층 검사용 전체 MP4 녹화입니다.
- `metadata`: JSON/로그 사이드카입니다.
- `report`: Markdown 보고서입니다.

재사용 가능한 게시자는 `scripts/mantis/publish-pr-evidence.mjs`입니다. 워크플로는 매니페스트, 대상 PR, `qa-artifacts` 대상 루트, 댓글 마커, Actions 아티팩트 URL, 실행 URL, 요청 소스를 함께 넘겨 이를 호출합니다. 선언된 아티팩트를 `qa-artifacts` 브랜치로 복사하고, 인라인 이미지/미리보기와 링크된 동영상이 포함된 요약 우선 PR 댓글을 만든 뒤, 기존 마커 댓글을 업데이트하거나 새로 만듭니다.

PR 댓글에서 상태 반응 실행을 직접 트리거할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 트리거는 의도적으로 좁습니다. pull request 댓글에서 write, maintain 또는 admin 액세스 권한이 있는 사용자의 요청에 대해서만 실행되며, Discord 상태 반응 요청만 인식합니다. 기본적으로 알려진 불량 기준 ref와 현재 PR 헤드 SHA를 후보로 사용합니다. 관리자는 어느 ref든 재정의할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이며 시나리오에 초점을 둡니다. 두 번째 명령은 나중에 라벨, 변경된 파일, ClawSweeper 리뷰 결과를 바탕으로 PR이나 이슈를 권장 Mantis 시나리오에 매핑할 수 있습니다.

## 실행 수명 주기

1. 자격 증명을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. 시나리오에 UI 증거가 필요할 때 데스크톱/브라우저 프로필을 준비합니다.
4. 기준 ref용 깨끗한 체크아웃을 준비합니다.
5. 의존성을 설치하고 시나리오에 필요한 것만 빌드합니다.
6. 격리된 상태 디렉터리로 하위 OpenClaw Gateway를 시작합니다.
7. 실제 전송, 제공자, 모델, 브라우저 프로필을 구성합니다.
8. 시나리오를 실행하고 기준 증거를 캡처합니다.
9. Gateway를 중지하고 로그를 보존합니다.
10. 같은 VM에서 후보 ref를 준비합니다.
11. 같은 시나리오를 실행하고 후보 증거를 캡처합니다.
12. 오라클 결과와 시각적 증거를 비교합니다.
13. Markdown, JSON, 로그, 스크린샷, 선택적 추적 아티팩트를 작성합니다.
14. GitHub Actions 아티팩트를 업로드합니다.
15. 간결한 PR 또는 Discord 상태 메시지를 게시합니다.

시나리오는 두 가지 다른 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: 기준이 예상된 방식으로 실패했습니다.
- **하네스 실패**: 버그 오라클이 의미를 갖기 전에 환경 설정, 자격 증명, Discord API, 브라우저 또는 제공자가 실패했습니다.

최종 보고서는 유지관리자가 불안정한 환경을 제품 동작과 혼동하지 않도록 이 경우들을 분리해야 합니다.

## Discord MVP

첫 번째 시나리오는 소스 답장 전달 모드가 `message_tool_only`인 길드 채널의 Discord 상태 반응을 대상으로 해야 합니다.

좋은 Mantis 시드인 이유:

- 트리거 메시지의 반응으로 Discord에 표시됩니다.
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

기준 증거는 대기열에 들어간 확인 반응은 보이지만 도구 전용 모드에서 수명 주기 전환은 없음을 보여야 합니다. 후보 증거는 `messages.statusReactions.enabled`가 명시적으로 true일 때 수명 주기 상태 반응이 실행됨을 보여야 합니다.

실행 가능한 첫 조각은 옵트인 Discord 라이브 QA 시나리오입니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

이는 SUT를 항상 켜진 길드 처리, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 명시적 상태 반응으로 구성합니다. 오라클은 실제 Discord 트리거 메시지를 폴링하고 관찰된 시퀀스 `👀 -> 🤔 -> 👍`를 기대합니다. 아티팩트에는 `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, `discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 비공개 QA 스택을 기반으로 구축해야 합니다.

- `pnpm openclaw qa discord`는 이미 드라이버 및 SUT 봇으로 라이브 Discord 레인을 실행합니다.
- 라이브 전송 러너는 이미 `.artifacts/qa-e2e/` 아래에 보고서와 관찰된 메시지 아티팩트를 작성합니다.
- Convex 자격 증명 임대는 이미 공유 라이브 전송 자격 증명에 대한 독점 접근을 제공합니다.
- 브라우저 제어 서비스는 이미 스크린샷, 스냅샷, 헤드리스 관리 프로필, 원격 CDP 프로필을 지원합니다.
- QA Lab에는 이미 전송 형태 테스트용 디버거 UI와 버스가 있습니다.

첫 Mantis 구현은 이러한 구성 요소 위의 얇은 전/후 러너와 하나의 시각적 증거 레이어가 될 수 있습니다.

## 증거 모델

모든 실행은 안정적인 아티팩트 디렉터리를 작성합니다.

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

`mantis-summary.json`은 기계가 읽을 수 있는 단일 진실 공급원이어야 합니다. Markdown 보고서는 PR 댓글과 사람의 검토용입니다.

요약에는 다음이 포함되어야 합니다.

- 테스트한 refs 및 SHAs
- 전송 및 시나리오 id
- 머신 제공자 및 머신 id 또는 임대 id
- 시크릿 값을 제외한 자격 증명 출처
- 기준 결과
- 후보 결과
- 기준에서 버그가 재현되었는지 여부
- 후보가 이를 수정했는지 여부
- 아티팩트 경로
- 정리된 설정 또는 정리 문제

스크린샷은 증거이지 시크릿이 아닙니다. 그래도 비공개 채널 이름, 사용자 이름 또는 메시지 내용이 나타날 수 있으므로 수정 원칙이 필요합니다. 공개 PR의 경우 수정 방식이 더 강해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를 선호합니다.

## 브라우저 및 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **헤드리스 자동화**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며, Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC 구조**: 로그인, MFA, Discord 자동화 방지 또는 시각적 디버깅에 사람이 필요할 때 같은 VM에서 활성화됩니다.

Discord 관찰자 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼 지속적이어야 하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은 개발자 노트북이 아니라 Mantis 머신 풀에 속합니다.

Mantis가 멈추면 다음이 포함된 Discord 상태 메시지를 게시합니다.

- 실행 id
- 시나리오 id
- 머신 제공자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 사유 텍스트

첫 비공개 배포는 이러한 메시지를 기존 운영자 채널에 게시할 수 있으며, 나중에 전용 Mantis 채널이 생기면 그곳으로 이동할 수 있습니다.

## 머신

Mantis는 첫 원격 구현에서 Crabbox를 통한 AWS를 선호해야 합니다. Crabbox는 예열된 머신, 임대 추적, 하이드레이션, 로그, 결과, 정리를 제공합니다. AWS 용량이 너무 느리거나 사용할 수 없으면 같은 머신 인터페이스 뒤에 Hetzner 제공자를 추가합니다.

최소 VM 요구 사항:

- 데스크톱 사용이 가능한 Chrome 또는 Chromium 설치가 있는 Linux
- 브라우저 자동화를 위한 CDP 접근
- 구조용 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용할 때 Playwright Chromium 브라우저 캐시
- OpenClaw Gateway 하나, 브라우저 하나, 모델 실행 하나에 충분한 CPU 및 메모리
- Discord, GitHub, 모델 제공자, 자격 증명 브로커로의 아웃바운드 접근

VM은 예상된 자격 증명 또는 브라우저 프로필 저장소 외부에 장기 지속 원시 시크릿을 보관해서는 안 됩니다.

## 시크릿

시크릿은 원격 실행의 경우 GitHub 조직 또는 저장소 시크릿에, 로컬 실행의 경우 로컬 운영자가 제어하는 시크릿 파일에 둡니다.

권장 시크릿 이름:

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

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반 출처로 유지되어야 합니다. GitHub 시크릿은 브로커와 대체 레인을 부트스트랩합니다. Discord 상태 반응 워크플로는 Mantis Crabbox 시크릿을 Crabbox CLI가 기대하는 `CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` 환경 변수로 다시 매핑합니다. 일반 `CRABBOX_*` GitHub 시크릿 이름은 호환성 대체 수단으로 계속 허용됩니다.

Mantis 러너는 다음을 절대 출력해서는 안 됩니다.

- Discord 봇 토큰
- 제공자 API 키
- 브라우저 쿠키
- 인증 프로필 내용
- VNC 비밀번호
- 원시 자격 증명 페이로드

공개 아티팩트 업로드는 봇, 길드, 채널, 메시지 id 같은 Discord 대상 메타데이터도 수정해야 합니다. GitHub 스모크 워크플로는 이 이유로 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅 또는 로그에 붙여 넣어지면 새 시크릿이 저장된 후 이를 교체합니다.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 단기 Actions 아티팩트로 업로드해야 합니다. 워크플로가 버그 보고서 또는 수정 PR에 대해 실행될 때는 수정된 PNG 스크린샷도 `qa-artifacts` 브랜치에 게시하고, 해당 버그 또는 수정 PR에 인라인 전/후 스크린샷이 포함된 댓글을 upsert해야 합니다. 기본 증거를 일반 QA 자동화 PR에만 게시하지 마세요. 원시 로그, 관찰된 메시지, 기타 큰 증거는 Actions 아티팩트에 둡니다.

프로덕션 워크플로는 이러한 댓글을 `github-actions[bot]`이 아니라 Mantis GitHub App으로 게시해야 합니다. 앱 id와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 시크릿으로 저장합니다. 워크플로는 숨겨진 마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며, 오래된 봇 소유 마커를 편집할 수 없으면 새 Mantis 소유 댓글을 만듭니다.

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

하네스 실패 때문에 실행이 실패한 경우, 댓글은 후보가 실패했다고 암시하는 대신 그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 해당 애플리케이션에 올바른 봇 권한이 있고 안전하게 교체할 수 있다면 다른 앱을 만들지 말고 재사용하세요.

초기 운영자 알림 채널은 시크릿 또는 배포 구성을 통해 설정합니다. 처음에는 기존 유지관리자 또는 운영 채널을 가리킬 수 있으며, 전용 Mantis 채널이 생기면 그곳으로 이동할 수 있습니다.

이 문서에 길드 id, 채널 id, 봇 토큰, 브라우저 쿠키 또는 VNC 비밀번호를 넣지 마세요. GitHub 시크릿, 자격 증명 브로커 또는 운영자의 로컬 시크릿 저장소에 저장하세요.

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

시나리오는 작고 타입화된 오라클을 선호해야 합니다.

- 반응 버그용 Discord 반응 상태
- 스레딩 버그용 Discord 메시지 참조
- Slack 버그용 Slack 스레드 ts 및 반응 API 상태
- 이메일 버그용 이메일 메시지 id 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상일 때 브라우저 스크린샷

비전 검사는 부가적이어야 합니다. 플랫폼 API로 버그를 증명할 수 있다면 API를 통과/실패 오라클로 사용하고 스크린샷은 사람의 확신을 위해 유지하세요.

## 제공자 확장

Discord 이후 같은 러너는 다음을 추가할 수 있습니다:

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용한 Gmail 인증 및 메시지
  스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 사용 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답글 관계, 재시작 후 재개.

각 전송 방식에는 비용이 낮은 스모크 시나리오 하나와 하나 이상의 버그 유형
시나리오가 있어야 합니다. 비용이 큰 시각적 시나리오는 선택 사항으로 유지해야 합니다.

## 미해결 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇을 드라이버로 사용하고,
  어떤 봇을 SUT로 사용해야 합니까?
- 관찰자 브라우저 로그인은 첫 단계에서 인간 Discord 계정, 테스트 계정,
  또는 봇이 읽을 수 있는 REST 증거만 사용해야 합니까?
- GitHub는 PR의 Mantis 아티팩트를 얼마나 오래 보관해야 합니까?
- ClawSweeper는 언제 유지관리자 명령을 기다리지 않고 Mantis를 자동으로
  권장해야 합니까?
- 공개 PR에 업로드하기 전에 스크린샷을 삭제 처리하거나 잘라내야 합니까?
