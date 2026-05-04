---
read_when:
    - OpenClaw 버그에 대한 실시간 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 대한 전후 검증 추가하기
    - Discord, Slack, WhatsApp 또는 기타 라이브 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 실시간 전송 수단에서 OpenClaw 버그를 재현하고, 전후 증거를 캡처하며, 아티팩트를 풀 리퀘스트에 첨부하기 위한 시각적 엔드투엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-04T02:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 runtime, 실제 transport, 그리고 눈에 보이는 증거가 필요한 버그를 위한 OpenClaw 종단 간 검증 시스템입니다. 알려진
나쁜 ref에 대해 시나리오를 실행하고, 증거를 캡처한 뒤, candidate ref에 대해
같은 시나리오를 실행하고, maintainer가 PR 또는 로컬 명령에서 검사할 수 있는
artifact로 비교 결과를 게시합니다.

Mantis는 Discord부터 시작합니다. Discord는 가치가 높은 첫 lane을 제공하기 때문입니다:
실제 bot auth, 실제 guild channel, reaction, thread, native command, 그리고
사람이 transport가 보여 준 내용을 시각적으로 확인할 수 있는 browser UI입니다.

## 목표

- GitHub issue 또는 PR의 버그를 사용자가 보는 것과 같은 transport 형태로 재현합니다.
- fix를 적용하기 전에 baseline ref에서 **before** artifact를 캡처합니다.
- fix를 적용한 뒤 candidate ref에서 **after** artifact를 캡처합니다.
- 가능하면 Discord REST reaction 읽기 또는 channel transcript 확인 같은 결정적 oracle을 사용합니다.
- 버그에 보이는 UI 표면이 있을 때 screenshot을 캡처합니다.
- agent가 제어하는 CLI에서 로컬로, 그리고 GitHub에서 원격으로 실행합니다.
- login, browser automation, provider auth가 막혔을 때 VNC rescue에 필요한 충분한 machine state를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 operator Discord channel에 간결한 status를 게시합니다.

## 비목표

- Mantis는 unit test를 대체하지 않습니다. Mantis 실행은 보통 fix가 이해된 뒤 더 작은 regression test가 되어야 합니다.
- Mantis는 일반적인 빠른 CI gate가 아닙니다. 더 느리고, live credential을 사용하며,
  live environment가 중요한 버그를 위해 예약됩니다.
- Mantis는 정상 동작에 사람을 요구해서는 안 됩니다. 수동 VNC는 rescue path이지 happy path가 아닙니다.
- Mantis는 raw secret을 artifact, log, screenshot, Markdown report, PR comment에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA stack에 속합니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 scenario runtime, transport adapter, evidence schema, local CLI를 소유합니다.
- QA Lab은 live transport harness 구성 요소, browser capture helper, artifact writer를 소유합니다.
- Crabbox는 remote VM이 필요할 때 warmed Linux machine을 소유합니다.
- GitHub Actions는 remote workflow entrypoint와 artifact retention을 소유합니다.
- ClawSweeper는 maintainer command parsing, workflow dispatch, 최종 PR comment 게시 같은 GitHub comment routing을 소유합니다.
- OpenClaw agent는 시나리오에 agentic setup, debugging, stuck-state reporting이 필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 transport knowledge를 OpenClaw에, machine scheduling을
Crabbox에, maintainer workflow glue를 ClawSweeper에 유지합니다.

## 명령 형식

첫 로컬 명령은 Discord bot, guild, channel, message send,
reaction send, artifact path를 검증합니다:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

로컬 before/after runner는 이 형식을 받습니다:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner는 output directory 아래에 detached baseline 및 candidate worktree를 만들고,
dependency를 설치하고, 각 ref를 build하고, `--allow-failures`로 시나리오를 실행한 뒤
`baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 씁니다. 첫 Discord 시나리오에서 성공적인 검증은
baseline status가 `fail`이고 candidate status가 `pass`임을 의미합니다.

첫 VM/browser primitive는 desktop smoke입니다:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox desktop machine을 lease하거나 재사용하고, VNC session 안에서 보이는 browser를 시작하고,
desktop을 캡처하고, artifact를 local output directory로 다시 가져오며,
reconnect command를 report에 씁니다. 이 명령은 Hetzner provider를 기본값으로 사용합니다.
Mantis lane에서 작동하는 desktop/VNC coverage를 가진 첫 provider이기 때문입니다.
다른 Crabbox fleet에 대해 실행할 때는 `--provider`, `--crabbox-bin`, 또는
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 재정의하세요.

유용한 desktop smoke flag:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 warmed desktop을 재사용합니다.
- `--browser-url <url>`은 보이는 browser에서 여는 page를 변경합니다.
- `--html-file <path>`는 repo-local HTML artifact를 보이는 browser에서 렌더링합니다. Mantis는 실제 Crabbox desktop을 통해 생성된 Discord status-reaction timeline을 캡처하는 데 이것을 사용합니다.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 만든 passing lease를 VNC inspection을 위해 열린 상태로 유지합니다. 실패한 실행은 lease가 생성된 경우 operator가 reconnect할 수 있도록 기본적으로 lease를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 machine size와 lease lifetime을 조정합니다.

GitHub smoke workflow는 `Mantis Discord Smoke`입니다. 첫 실제 시나리오의 before/after GitHub
workflow는 `Mantis Discord Status Reactions`입니다. 이 workflow는 다음을 받습니다:

- `baseline_ref`: queued-only behavior를 재현할 것으로 예상되는 ref.
- `candidate_ref`: `queued -> thinking -> done`을 보여 줄 것으로 예상되는 ref.

이 workflow는 workflow harness ref를 checkout하고, 별도의 baseline 및 candidate
worktree를 build하고, 각 worktree에 대해 `discord-status-reactions-tool-only`를 실행한 뒤,
`baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를
Actions artifact로 업로드합니다. 또한 각 lane의 timeline HTML을 Crabbox
desktop browser에서 렌더링하고, PR comment의 결정적
timeline PNG 옆에 해당 VNC screenshot을 게시합니다. 이 workflow는
다음 Crabbox binary release가 만들어지기 전에 현재 desktop/browser lease flag를 사용할 수 있도록
`openclaw/crabbox` main에서 Crabbox CLI를 build합니다.

PR comment에서 status-reactions 실행을 직접 trigger할 수도 있습니다:

```text
@Mantis discord status reactions
```

comment trigger는 의도적으로 좁습니다. write, maintain, admin access가 있는 사용자의 pull request
comment에서만 실행되며, Discord status-reaction request만 인식합니다. 기본적으로 알려진 나쁜 baseline ref와
현재 PR head SHA를 candidate로 사용합니다. Maintainer는 어느 ref든 재정의할 수 있습니다:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper command example:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 명령은 명시적이며 scenario-focused입니다. 두 번째 명령은 나중에 label, changed file,
ClawSweeper review finding을 바탕으로 PR 또는 issue를 추천 Mantis scenario에 매핑할 수 있습니다.

## 실행 수명 주기

1. credential을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. scenario에 UI evidence가 필요할 때 desktop/browser profile을 준비합니다.
4. baseline ref의 clean checkout을 준비합니다.
5. dependency를 설치하고 scenario에 필요한 것만 build합니다.
6. isolated state directory로 child OpenClaw Gateway를 시작합니다.
7. live transport, provider, model, browser profile을 구성합니다.
8. scenario를 실행하고 baseline evidence를 캡처합니다.
9. gateway를 중지하고 log를 보존합니다.
10. 같은 VM에서 candidate ref를 준비합니다.
11. 같은 scenario를 실행하고 candidate evidence를 캡처합니다.
12. oracle result와 visual evidence를 비교합니다.
13. Markdown, JSON, log, screenshot, optional trace artifact를 씁니다.
14. GitHub Actions artifact를 업로드합니다.
15. 간결한 PR 또는 Discord status message를 게시합니다.

scenario는 서로 다른 두 방식으로 실패할 수 있어야 합니다:

- **버그 재현됨**: baseline이 예상한 방식으로 실패했습니다.
- **Harness failure**: bug oracle이 의미 있기 전에 environment setup, credential, Discord API, browser, 또는
  provider가 실패했습니다.

최종 report는 maintainer가 flaky environment와 product behavior를 혼동하지 않도록
이 case들을 분리해야 합니다.

## Discord MVP

첫 scenario는 source reply delivery mode가 `message_tool_only`인 guild channel의 Discord status reaction을 대상으로 해야 합니다.

좋은 Mantis seed인 이유:

- triggering message의 reaction으로 Discord에 보입니다.
- Discord message reaction state를 통한 강력한 REST oracle이 있습니다.
- 실제 OpenClaw Gateway, Discord bot auth, message dispatch,
  source reply delivery mode, status reaction state, model turn lifecycle을 실행합니다.
- 첫 구현이 명확하게 유지될 만큼 범위가 좁습니다.

예상 scenario 형식:

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

Baseline evidence는 queued acknowledgement reaction은 보이지만 tool-only mode에서 lifecycle transition은 없음을 보여야 합니다.
Candidate evidence는 `messages.statusReactions.enabled`가 명시적으로 true일 때 lifecycle
status reaction이 실행됨을 보여야 합니다.

실행 가능한 첫 slice는 opt-in Discord live QA scenario입니다:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

이 명령은 SUT를 always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, explicit status reaction으로 구성합니다. oracle은
실제 Discord triggering message를 poll하고 관찰된 sequence
`👀 -> 🤔 -> 👍`를 기대합니다. Artifact에는 `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, 그리고
`discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 private QA stack을 기반으로 해야 합니다:

- `pnpm openclaw qa discord`는 이미 driver 및 SUT bot으로 live Discord lane을 실행합니다.
- live transport runner는 이미 `.artifacts/qa-e2e/` 아래에 report와 observed-message artifact를 씁니다.
- Convex credential lease는 이미 shared live transport credential에 대한 exclusive access를 제공합니다.
- browser control service는 이미 screenshot, snapshot,
  headless managed profile, remote CDP profile을 지원합니다.
- QA Lab은 이미 transport-shaped testing을 위한 debugger UI와 bus를 갖고 있습니다.

첫 Mantis 구현은 이러한 구성 요소 위에 얇은 before/after runner와
하나의 visual evidence layer를 더한 형태일 수 있습니다.

## Evidence Model

모든 실행은 stable artifact directory를 씁니다:

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

`mantis-summary.json`은 machine-readable source of truth여야 합니다.
Markdown report는 PR comment와 human review를 위한 것입니다.

summary에는 다음이 포함되어야 합니다:

- 테스트한 ref와 SHA
- transport와 scenario id
- machine provider와 machine id 또는 lease id
- secret value 없는 credential source
- baseline result
- candidate result
- baseline에서 버그가 재현되었는지 여부
- candidate가 이를 수정했는지 여부
- artifact path
- sanitized setup 또는 cleanup issue

Screenshot은 evidence이지 secret이 아닙니다. 그래도 redaction discipline이 필요합니다:
private channel name, user name, message content가 나타날 수 있습니다. public PR에서는
redaction story가 더 강해질 때까지 inline image보다 GitHub Actions artifact link를 선호하세요.

## Browser 및 VNC

browser lane에는 두 가지 mode가 있습니다:

- **Headless automation**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되고,
  Playwright 또는 OpenClaw browser control이 screenshot을 캡처합니다.
- **VNC rescue**: login, MFA, Discord anti-automation,
  또는 visual debugging에 사람이 필요할 때 같은 VM에서 활성화됩니다.

Discord 옵저버 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼 지속되어야 하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은 개발자 노트북이 아니라 Mantis 머신 풀에 속합니다.

Mantis가 멈추면 다음 내용을 포함한 Discord 상태 메시지를 게시합니다.

- 실행 ID
- 시나리오 ID
- 머신 제공자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 원인 텍스트

첫 번째 비공개 배포는 이러한 메시지를 기존 운영자 채널에 게시하고, 나중에 전용 Mantis 채널로 이동할 수 있습니다.

## 머신

Mantis는 첫 번째 원격 구현에서 Crabbox를 통한 AWS를 우선 사용해야 합니다. Crabbox는 준비된 머신, 임대 추적, 하이드레이션, 로그, 결과, 정리를 제공합니다. AWS 용량이 너무 느리거나 사용할 수 없으면 동일한 머신 인터페이스 뒤에 Hetzner 제공자를 추가하세요.

최소 VM 요구 사항:

- 데스크톱 사용이 가능한 Chrome 또는 Chromium 설치가 있는 Linux
- 브라우저 자동화를 위한 CDP 액세스
- 복구를 위한 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용하는 경우 Playwright Chromium 브라우저 캐시
- OpenClaw Gateway 하나, 브라우저 하나, 모델 실행 하나를 감당할 충분한 CPU 및 메모리
- Discord, GitHub, 모델 제공자, 자격 증명 브로커에 대한 아웃바운드 액세스

VM은 예상된 자격 증명 또는 브라우저 프로필 저장소 밖에 장기 보관되는 원시 비밀을 유지해서는 안 됩니다.

## 비밀

비밀은 원격 실행의 경우 GitHub 조직 또는 저장소 비밀에, 로컬 실행의 경우 로컬 운영자가 제어하는 비밀 파일에 둡니다.

권장 비밀 이름:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- 공개 GitHub 아티팩트 업로드를 위한 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반 소스로 유지되어야 합니다. GitHub 비밀은 브로커와 폴백 레인을 부트스트랩합니다. Discord 상태 반응 워크플로는 Mantis Crabbox 비밀을 Crabbox CLI가 기대하는 `CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` 환경 변수로 다시 매핑합니다. 일반 `CRABBOX_*` GitHub 비밀 이름은 호환성 폴백으로 계속 허용됩니다.

Mantis 러너는 절대로 다음을 출력해서는 안 됩니다.

- Discord 봇 토큰
- 제공자 API 키
- 브라우저 쿠키
- 인증 프로필 내용
- VNC 비밀번호
- 원시 자격 증명 페이로드

공개 아티팩트 업로드는 봇, 길드, 채널, 메시지 ID 같은 Discord 대상 메타데이터도 삭제해야 합니다. GitHub 스모크 워크플로는 이러한 이유로 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅, 로그에 붙여넣어진 경우 새 비밀을 저장한 뒤 해당 토큰을 교체하세요.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions 아티팩트로 업로드해야 합니다. 워크플로가 버그 보고서 또는 수정 PR에 대해 실행될 때는 삭제 처리된 PNG 스크린샷도 `qa-artifacts` 브랜치에 게시하고, 해당 버그 또는 수정 PR에 전후 스크린샷을 인라인으로 포함한 댓글을 upsert해야 합니다. 기본 증거를 일반 QA 자동화 PR에만 게시하지 마세요. 원시 로그, 관찰된 메시지, 기타 큰 증거는 Actions 아티팩트에 남겨 둡니다.

프로덕션 워크플로는 `github-actions[bot]`이 아니라 Mantis GitHub App으로 해당 댓글을 게시해야 합니다. 앱 ID와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 비밀로 저장하세요. 워크플로는 숨김 마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며, 이전 봇 소유 마커를 편집할 수 없으면 Mantis 소유 댓글을 새로 만듭니다.

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

하네스 실패로 실행이 실패한 경우, 댓글은 후보가 실패했다는 뜻을 암시하지 말고 그 사실을 명시해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 올바른 봇 권한이 있고 안전하게 교체할 수 있다면 다른 앱을 만들지 말고 해당 애플리케이션을 재사용하세요.

초기 운영자 알림 채널은 비밀 또는 배포 구성으로 설정하세요. 처음에는 기존 유지관리자 또는 운영 채널을 가리키고, 전용 Mantis 채널이 생기면 그쪽으로 이동할 수 있습니다.

이 문서에 길드 ID, 채널 ID, 봇 토큰, 브라우저 쿠키, VNC 비밀번호를 넣지 마세요. GitHub 비밀, 자격 증명 브로커 또는 운영자의 로컬 비밀 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- ID 및 제목
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
- 이메일 버그의 경우 이메일 메시지 ID 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상인 경우 브라우저 스크린샷

비전 검사는 추가적인 성격이어야 합니다. 플랫폼 API가 버그를 증명할 수 있다면 API를 통과/실패 오라클로 사용하고, 스크린샷은 사람이 확인할 신뢰도를 위해 유지하세요.

## 제공자 확장

Discord 이후 동일한 러너는 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용한 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 사용 가능한 경우 그룹 멘션 게이팅, 명령, 반응.
- Matrix: 암호화된 룸, 스레드 또는 답장 관계, 재시작 재개.

각 전송에는 저렴한 스모크 시나리오 하나와 하나 이상의 버그 클래스 시나리오가 있어야 합니다. 비용이 큰 시각적 시나리오는 옵트인으로 유지해야 합니다.

## 열린 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇을 드라이버로, 어떤 봇을 SUT로 사용해야 합니까?
- 옵저버 브라우저 로그인은 첫 단계에서 사람 Discord 계정, 테스트 계정 또는 봇이 읽을 수 있는 REST 증거만 사용해야 합니까?
- GitHub는 PR용 Mantis 아티팩트를 얼마나 오래 보관해야 합니까?
- ClawSweeper는 유지관리자 명령을 기다리는 대신 언제 Mantis를 자동으로 권장해야 합니까?
- 공개 PR에 업로드하기 전에 스크린샷을 삭제 처리하거나 자르기 해야 합니까?
