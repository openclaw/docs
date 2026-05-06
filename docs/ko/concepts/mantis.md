---
read_when:
    - OpenClaw 버그에 대한 라이브 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 대한 사전 및 사후 검증 추가
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 라이브 전송 수단에서 OpenClaw 버그를 재현하고, 변경 전후 증거를 캡처하며, 아티팩트를 PR에 첨부하기 위한 시각적 엔드투엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-06T06:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 전송 수단, 눈으로 확인할 수 있는 증거가
필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진 잘못된
ref에 대해 시나리오를 실행하고 증거를 캡처한 뒤, 후보 ref에 대해 같은
시나리오를 실행하고, maintainer가 PR이나 로컬 명령에서 검사할 수 있는
아티팩트로 비교 결과를 게시합니다.

Mantis는 Discord에서 시작합니다. Discord가 가치 높은 첫 번째 lane을
제공하기 때문입니다. 실제 bot auth, 실제 guild channels, reactions,
threads, native commands, 그리고 사람이 전송 수단에 표시된 내용을 시각적으로
확인할 수 있는 브라우저 UI가 있습니다.

## 목표

- 사용자가 보는 것과 같은 전송 형태로 GitHub 이슈나 PR의 버그를 재현합니다.
- 수정 사항을 적용하기 전에 baseline ref에서 **before** 아티팩트를 캡처합니다.
- 수정 사항을 적용한 뒤 candidate ref에서 **after** 아티팩트를 캡처합니다.
- 가능하면 Discord REST reaction 읽기나 channel transcript 검사 같은 결정적
  oracle을 사용합니다.
- 버그에 눈에 보이는 UI 표면이 있으면 스크린샷을 캡처합니다.
- agent가 제어하는 CLI에서 로컬로, GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화, provider auth가 막혔을 때 VNC 구조에 충분한
  머신 상태를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 operator
  Discord channel에 간결한 상태를 게시합니다.

## 비목표

- Mantis는 단위 테스트를 대체하지 않습니다. Mantis 실행은 보통 수정 사항을
  이해한 뒤 더 작은 회귀 테스트가 되어야 합니다.
- Mantis는 일반적인 빠른 CI gate가 아닙니다. 더 느리고, live credentials를
  사용하며, live 환경이 중요한 버그에만 사용됩니다.
- Mantis는 정상 동작에 사람이 필요하지 않아야 합니다. 수동 VNC는 구조
  경로이지 happy path가 아닙니다.
- Mantis는 raw secrets를 아티팩트, 로그, 스크린샷, Markdown 보고서, PR
  comments에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA stack에 속합니다.

- OpenClaw는 scenario runtime, transport adapters, evidence schema, 그리고
  `pnpm openclaw qa mantis` 아래의 local CLI를 소유합니다.
- QA Lab은 live transport harness pieces, browser capture helpers, artifact
  writers를 소유합니다.
- Crabbox는 remote VM이 필요할 때 warmed Linux machines를 소유합니다.
- GitHub Actions는 remote workflow entrypoint와 artifact retention을 소유합니다.
- ClawSweeper는 GitHub comment routing을 소유합니다. maintainer commands를
  parsing하고, workflow를 dispatch하고, 최종 PR comment를 게시합니다.
- OpenClaw agents는 시나리오에 agentic setup, debugging, stuck-state reporting이
  필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 전송 지식을 OpenClaw에, 머신 스케줄링을 Crabbox에, maintainer
workflow glue를 ClawSweeper에 둡니다.

## 명령 형태

첫 번째 local command는 Discord bot, guild, channel, message send, reaction
send, artifact path를 검증합니다.

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

local before 및 after runner는 다음 형태를 받습니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner는 output directory 아래에 detached baseline 및 candidate worktrees를
만들고, dependencies를 설치하고, 각 ref를 빌드하고, `--allow-failures`로
시나리오를 실행한 다음 `baseline/`, `candidate/`, `comparison.json`,
`mantis-report.md`를 씁니다. 첫 번째 Discord 시나리오에서 성공적인 검증은
baseline status가 `fail`이고 candidate status가 `pass`임을 의미합니다.

두 번째 Discord before/after probe는 thread attachments를 대상으로 합니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

이 시나리오는 driver bot으로 parent message를 게시하고, 실제 Discord thread를
만들고, repo-local `filePath`로 OpenClaw의 `message.thread-reply` action을
호출한 다음, thread에서 SUT reply와 attachment filename을 polling합니다.
baseline screenshot은 attachment가 없는 reply를 보여주고, candidate screenshot은
예상한 `mantis-thread-report.md` attachment를 보여줍니다.

첫 번째 VM/browser primitive는 desktop smoke입니다.

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox desktop machine을 lease하거나 재사용하고, VNC session 안에서
visible browser를 시작하고, desktop을 캡처하고, 아티팩트를 local output directory로
가져오며, reconnect command를 report에 씁니다. 이 명령은 Mantis lane에서
작동하는 desktop/VNC coverage가 있는 첫 provider이기 때문에 기본값으로 Hetzner
provider를 사용합니다. 다른 Crabbox fleet에 대해 실행할 때는 `--provider`,
`--crabbox-bin`, 또는 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 override하세요.

유용한 desktop smoke flags:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 warmed desktop을 재사용합니다.
- `--browser-url <url>`은 visible browser에서 열리는 page를 바꿉니다.
- `--html-file <path>`는 repo-local HTML artifact를 visible browser에 렌더링합니다. Mantis는 이를 사용해 생성된 Discord status-reaction timeline을 실제 Crabbox desktop을 통해 캡처합니다.
- `--browser-profile-dir <remote-path>`는 remote Chrome user-data-dir을 재사용하므로 persistent Mantis desktop이 실행 사이에도 로그인 상태를 유지할 수 있습니다. 오래 유지되는 Discord Web viewer profile에 사용하세요.
- `--browser-profile-archive-env <name>`은 브라우저를 시작하기 전에 지정된 environment variable에서 base64 `.tgz` Chrome user-data-dir archive를 복원합니다. Discord Web 같은 로그인된 witness에 사용하세요. 기본 env var는 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`입니다.
- `--video-duration <seconds>`는 MP4 capture length를 제어합니다. 안정화 시간이 필요한 느린 logged-in web apps에는 더 긴 duration을 사용하세요.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 만든 passing lease를 VNC 검사를 위해 열어 둡니다. 실패한 실행은 operator가 다시 연결할 수 있도록, lease를 만들었을 때 기본적으로 lease를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 machine size와 lease lifetime을 조정합니다.

Discord Web 증거에는 Mantis가 bot token 대신 전용 viewer account를
사용합니다. live Discord API scenario는 계속 oracle입니다. 실제 thread를
만들고, SUT `thread-reply`를 보내고, Discord REST를 통해 attachment를 검사합니다.
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`이 설정되면 시나리오가 Discord Web
URL artifact도 씁니다. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`이 설정되면 로그인된
브라우저가 열고 기록할 수 있을 만큼 충분히 오래 해당 thread를 남겨 둡니다.

GitHub workflow는 Discord Web에서 candidate thread URL을 열고, screenshot을
캡처하고, MP4를 기록하며, Crabbox media tooling을 사용할 수 있을 때 trimmed GIF
preview를 생성합니다. full Chrome profile archives는 GitHub의 secret-size limit을
초과할 수 있으므로, `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`을 통해 설정된
persistent viewer profile path를 선호하세요. small/bootstrap profiles의 경우
workflow는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`에서 base64 `.tgz`
archive를 복원할 수도 있습니다. profile source가 둘 다 설정되지 않아도
workflow는 결정적인 baseline/candidate attachment screenshots를 계속 게시하고,
logged-in Discord Web witness를 건너뛰었다는 notice를 기록합니다.

첫 번째 full desktop transport primitive는 Slack desktop smoke입니다.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox desktop machine을 lease하거나 재사용하고, current checkout을
VM에 sync하고, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC browser에서
Slack Web을 열고, visible desktop을 캡처하며, Slack QA artifacts와 VNC screenshot을
모두 local output directory로 복사합니다. 이는 SUT OpenClaw gateway와 browser가
둘 다 같은 Linux desktop VM 안에 있는 첫 번째 Mantis 형태입니다.

`--gateway-setup`을 사용하면 이 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에
persistent disposable OpenClaw home을 준비하고, 선택한 channel에 대한 Slack
Socket Mode configuration을 patch하고, port `38973`에서 `openclaw gateway run`을
시작하고, VNC session에서 Chrome을 계속 실행 상태로 둡니다. 이것은 "Slack과
claw가 실행 중인 Linux desktop을 남겨 달라" 모드입니다. `--gateway-setup`을
생략하면 bot-to-bot Slack QA lane이 기본값으로 유지됩니다.

`--credential-source env`에 필요한 inputs:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- remote model lane을 위한 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에
  `OPENAI_API_KEY`만 설정된 경우, Crabbox를 호출하기 전에 Mantis가 이를
  `OPENCLAW_LIVE_OPENAI_KEY`에 매핑하여 Crabbox의 `OPENCLAW_*` env forwarding이
  VM으로 전달할 수 있게 합니다.

`--gateway-setup --credential-source convex`를 사용하면 Mantis는 VM을 만들기 전에
shared pool에서 Slack SUT credential을 lease하고, leased channel id, Socket Mode
app token, bot token을 desktop 안의 `OPENCLAW_MANTIS_SLACK_*` runtime env로
forward합니다. 이렇게 하면 GitHub workflows가 얇게 유지됩니다. raw Slack bot
또는 app tokens가 아니라 Convex broker secret만 필요합니다.

유용한 Slack desktop flags:

- `--lease-id <cbx_...>`는 operator가 이미 VNC를 통해 Slack Web에 로그인한 machine에 대해 다시 실행합니다.
- `--gateway-setup`은 bot-to-bot QA lane만 실행하는 대신 VM에서 persistent OpenClaw Slack gateway를 시작합니다.
- `--keep-lease`는 성공 후 VNC 검사를 위해 gateway VM을 열어 둡니다. `--no-keep-lease`는 아티팩트를 수집한 뒤 중지합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 없으면, SUT bot token을 사용할 수 있을 때 Mantis가 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 도출합니다.
- `--slack-channel-id <id>`는 gateway setup에서 사용하는 Slack channel allowlist를 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`은 VM 안의 persistent Chrome profile을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로, 같은 lease에서 다시 실행해도 수동 Slack Web login이 유지됩니다.
- `--credential-source convex --credential-role ci`는 direct Slack env tokens 대신 shared credential pool을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack live lane으로 pass through됩니다.

GitHub smoke workflow는 `Mantis Discord Smoke`입니다. 첫 번째 실제 시나리오의
before 및 after GitHub workflow는 `Mantis Discord Status Reactions`입니다. 이는
다음을 받습니다.

- `baseline_ref`: queued-only behavior를 재현할 것으로 예상되는 ref.
- `candidate_ref`: `queued -> thinking -> done`을 보여줄 것으로 예상되는 ref.

이 workflow는 workflow harness ref를 checkout하고, 별도의 baseline 및 candidate
worktrees를 빌드하고, 각 worktree에 대해 `discord-status-reactions-tool-only`를
실행하고, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를
Actions artifacts로 업로드합니다. 또한 각 lane의 timeline HTML을 Crabbox desktop
browser에서 렌더링하고, PR comment에서 deterministic timeline PNGs 옆에 해당 VNC
screenshots를 게시합니다. 같은 PR comment에는 `crabbox media preview`로 생성된
lightweight motion-trimmed GIF previews가 embedded되고, 일치하는 motion-trimmed
MP4 clips로 link되며, deep inspection을 위해 full desktop MP4 files가 유지됩니다.
Screenshots는 빠른 review를 위해 inline 상태로 유지됩니다. workflow는 다음
Crabbox binary release가 만들어지기 전에 현재 desktop/browser lease flags를
사용할 수 있도록 `openclaw/crabbox` main에서 Crabbox CLI를 빌드합니다.

`Mantis Scenario`는 generic manual entrypoint입니다. `scenario_id`,
`candidate_ref`, optional `baseline_ref`, optional `pr_number`를 받은 뒤
scenario-owned workflow를 dispatch합니다. wrapper는 의도적으로 얇습니다.
scenario workflows는 여전히 자체 transport setup, credentials, VM class, expected
oracle, artifact manifest를 소유합니다.

`Mantis Slack Desktop Smoke`는 첫 번째 Slack VM 워크플로입니다. 별도 worktree에서 신뢰된 후보 ref를 체크아웃하고, Crabbox Linux 데스크톱을 임대하며, 해당 후보에 대해 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`을 실행하고, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 녹화하며, `crabbox media preview`로 움직임 기반으로 잘라낸 미리보기를 생성하고, 전체 아티팩트 디렉터리를 업로드한 뒤, 선택적으로 대상 PR에 인라인 증거 댓글을 게시합니다. 데스크톱 임대는 기본적으로 AWS를 사용하며, AWS 용량이 느리거나 사용할 수 없을 때 운영자가 Hetzner로 전환할 수 있도록 수동 provider 입력을 노출합니다. 봇 간 Slack transcript만 필요한 것이 아니라 "Slack과 claw가 실행 중인 Linux 데스크톱"이 필요할 때 이 lane을 사용하세요.

모든 PR 게시 scenario는 해당 보고서 옆에 `mantis-evidence.json`을 작성합니다. 이 스키마는 scenario 코드와 GitHub 댓글 사이의 인계 형식입니다.

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

아티팩트 `path` 값은 manifest 디렉터리를 기준으로 한 상대 경로입니다. `targetPath` 값은 `qa-artifacts` branch 게시 디렉터리 아래의 상대 경로입니다. publisher는 path traversal을 거부하며, 선택적 미리보기나 비디오를 사용할 수 없을 때 `"required": false`로 표시된 항목은 건너뜁니다.

지원되는 아티팩트 종류:

- `timeline`: 보통 전후 비교에 쓰는 deterministic scenario 스크린샷.
- `desktopScreenshot`: VNC/browser 데스크톱 스크린샷.
- `motionPreview`: 데스크톱 녹화에서 생성된 인라인 animated GIF.
- `motionClip`: 정적인 시작 부분과 끝부분을 제거한 motion-trimmed MP4.
- `fullVideo`: 심층 검사용 전체 MP4 녹화.
- `metadata`: JSON/log sidecar.
- `report`: Markdown 보고서.

재사용 가능한 publisher는 `scripts/mantis/publish-pr-evidence.mjs`입니다. 워크플로는 manifest, 대상 PR, `qa-artifacts` 대상 root, comment marker, Actions artifact URL, run URL, request source를 인자로 이를 호출합니다. 선언된 아티팩트를 `qa-artifacts` branch로 복사하고, 인라인 이미지/미리보기와 연결된 비디오가 포함된 summary 우선 PR 댓글을 만든 다음, 기존 marker 댓글을 업데이트하거나 새로 생성합니다.

PR 댓글에서 status-reactions 실행을 직접 트리거할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 트리거는 의도적으로 범위가 좁습니다. write, maintain 또는 admin 권한이 있는 사용자의 pull request 댓글에서만 실행되며, Discord status-reaction 요청만 인식합니다. 기본적으로 알려진 bad baseline ref와 현재 PR head SHA를 후보로 사용합니다. maintainers는 ref 둘 중 하나를 재정의할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이고 scenario 중심입니다. 두 번째 명령은 나중에 label, 변경 파일, ClawSweeper review findings를 기반으로 PR 또는 issue를 권장 Mantis scenario에 매핑할 수 있습니다.

## 실행 수명 주기

1. credential을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. scenario에 UI 증거가 필요하면 desktop/browser profile을 준비합니다.
4. baseline ref용 깨끗한 checkout을 준비합니다.
5. dependency를 설치하고 scenario에 필요한 것만 빌드합니다.
6. 격리된 state 디렉터리로 child OpenClaw Gateway를 시작합니다.
7. live transport, provider, model, browser profile을 구성합니다.
8. scenario를 실행하고 baseline 증거를 캡처합니다.
9. gateway를 중지하고 log를 보존합니다.
10. 같은 VM에서 candidate ref를 준비합니다.
11. 동일한 scenario를 실행하고 candidate 증거를 캡처합니다.
12. oracle 결과와 시각 증거를 비교합니다.
13. Markdown, JSON, log, screenshot, 선택적 trace artifact를 작성합니다.
14. GitHub Actions artifact를 업로드합니다.
15. 간결한 PR 또는 Discord status message를 게시합니다.

scenario는 두 가지 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: baseline이 예상된 방식으로 실패했습니다.
- **Harness 실패**: bug oracle이 의미를 갖기 전에 환경 설정, credential, Discord API, browser 또는 provider가 실패했습니다.

최종 보고서는 maintainer가 불안정한 환경을 제품 동작과 혼동하지 않도록 이 경우들을 분리해야 합니다.

## Discord MVP

첫 번째 scenario는 source reply delivery mode가 `message_tool_only`인 guild channel의 Discord status reaction을 대상으로 해야 합니다.

좋은 Mantis seed인 이유:

- 트리거 메시지의 reaction으로 Discord에 표시됩니다.
- Discord message reaction state를 통한 강력한 REST oracle이 있습니다.
- 실제 OpenClaw Gateway, Discord bot auth, message dispatch, source reply delivery mode, status reaction state, model turn lifecycle을 실행합니다.
- 첫 구현을 정직하게 유지할 만큼 범위가 좁습니다.

예상 scenario 형태:

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

baseline 증거는 queued acknowledgement reaction은 보이지만 tool-only mode에서 lifecycle transition은 없음을 보여야 합니다. candidate 증거는 `messages.statusReactions.enabled`가 명시적으로 true일 때 lifecycle status reaction이 실행됨을 보여야 합니다.

실행 가능한 첫 slice는 opt-in Discord live QA scenario입니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

이는 SUT를 always-on guild handling, `visibleReplies: "message_tool"`, `ackReaction: "👀"`, 명시적 status reaction으로 구성합니다. oracle은 실제 Discord 트리거 메시지를 poll하고 관측된 sequence `👀 -> 🤔 -> 👍`을 기대합니다. 아티팩트에는 `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, `discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 private QA stack 위에 구축되어야 합니다.

- `pnpm openclaw qa discord`는 이미 driver 및 SUT bot을 사용하는 live Discord lane을 실행합니다.
- live transport runner는 이미 `.artifacts/qa-e2e/` 아래에 report와 observed-message artifact를 작성합니다.
- Convex credential lease는 이미 공유 live transport credential에 대한 exclusive access를 제공합니다.
- browser control service는 이미 screenshot, snapshot, headless managed profile, remote CDP profile을 지원합니다.
- QA Lab에는 이미 transport-shaped testing용 debugger UI와 bus가 있습니다.

첫 Mantis 구현은 이러한 구성 요소 위의 얇은 before/after runner와 하나의 시각 증거 layer가 될 수 있습니다.

## 증거 모델

모든 실행은 안정적인 artifact 디렉터리를 작성합니다.

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

`mantis-summary.json`은 machine-readable source of truth여야 합니다. Markdown 보고서는 PR 댓글과 human review용입니다.

summary에는 다음이 포함되어야 합니다.

- 테스트한 ref와 SHA
- transport와 scenario id
- machine provider와 machine id 또는 lease id
- secret 값을 제외한 credential source
- baseline result
- candidate result
- bug가 baseline에서 재현되었는지 여부
- candidate가 이를 수정했는지 여부
- artifact path
- sanitized setup 또는 cleanup issue

스크린샷은 secret이 아니라 증거입니다. 그래도 redaction discipline이 필요합니다. private channel name, user name 또는 message content가 나타날 수 있습니다. public PR의 경우 redaction story가 더 강해질 때까지 inline image보다 GitHub Actions artifact link를 선호하세요.

## Browser와 VNC

browser lane에는 두 가지 mode가 있습니다.

- **Headless automation**: CI 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며, Playwright 또는 OpenClaw browser control이 screenshot을 캡처합니다.
- **VNC rescue**: login, MFA, Discord anti-automation 또는 visual debugging에 사람이 필요할 때 같은 VM에서 활성화됩니다.

Discord observer browser profile은 매 실행마다 로그인하지 않아도 될 만큼 persistent해야 하지만, personal browser state와 격리되어야 합니다. profile은 developer laptop이 아니라 Mantis machine pool에 속합니다.

Mantis가 멈추면 다음을 포함한 Discord status message를 게시합니다.

- run id
- scenario id
- machine provider
- artifact directory
- 사용 가능한 경우 VNC 또는 noVNC connection instruction
- 짧은 blocker text

첫 private deployment는 이러한 message를 기존 operator channel에 게시하고, 나중에 전용 Mantis channel로 이동할 수 있습니다.

## Machine

Mantis는 첫 remote implementation에서 Crabbox를 통한 AWS를 선호해야 합니다. Crabbox는 warmed machine, lease tracking, hydration, log, result, cleanup을 제공합니다. AWS 용량이 너무 느리거나 사용할 수 없으면 같은 machine interface 뒤에 Hetzner provider를 추가하세요.

최소 VM 요구 사항:

- desktop-capable Chrome 또는 Chromium install이 있는 Linux
- browser automation용 CDP access
- rescue용 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw checkout 및 dependency cache
- Playwright를 사용할 때 Playwright Chromium browser cache
- 하나의 OpenClaw Gateway, 하나의 browser, 하나의 model run을 위한 충분한 CPU와 memory
- Discord, GitHub, model provider, credential broker로의 outbound access

VM은 예상되는 credential 또는 browser profile store 외부에 long-lived raw secret을 보관해서는 안 됩니다.

## Secret

secret은 remote run의 경우 GitHub organization 또는 repository secret에, local run의 경우 local operator-controlled secret file에 있습니다.

권장 secret 이름:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` for public GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

장기적으로 Convex credential pool은 live transport credential의 일반적인 source로 남아야 합니다. GitHub secret은 broker와 fallback lane을 bootstrap합니다. Discord status-reactions workflow는 Mantis Crabbox secret을 Crabbox CLI가 기대하는 `CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` environment variable로 다시 매핑합니다. 일반 `CRABBOX_*` GitHub secret 이름은 compatibility fallback으로 계속 허용됩니다.

Mantis runner는 절대 다음을 출력하면 안 됩니다.

- Discord bot token
- provider API key
- browser cookie
- auth profile content
- VNC password
- raw credential payload

public artifact upload는 bot, guild, channel, message id 같은 Discord target metadata도 redact해야 합니다. GitHub smoke workflow는 이 이유로 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

token이 issue, PR, chat 또는 log에 실수로 붙여넣어진 경우 새 secret이 저장된 뒤 이를 rotate하세요.

## GitHub artifact 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions
아티팩트로 업로드해야 합니다. 워크플로가 버그 보고서 또는 수정 PR에 대해 실행될 때는
수정된 PNG 스크린샷도 `qa-artifacts` 브랜치에 게시하고, 해당 버그 또는 수정 PR에
인라인 전/후 스크린샷이 포함된 댓글을 upsert해야 합니다. 기본 증거를 일반 QA 자동화 PR에만
게시하지 마세요. 원시 로그, 관찰된 메시지 및 기타 부피가 큰 증거는 Actions 아티팩트에 유지합니다.

프로덕션 워크플로는 이러한 댓글을 `github-actions[bot]`이 아니라 Mantis GitHub App으로
게시해야 합니다. 앱 ID와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및
`MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 시크릿으로 저장하세요. 워크플로는
숨겨진 마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며,
이전 봇 소유 마커를 편집할 수 없으면 Mantis 소유의 새 댓글을 생성합니다.

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

하네스 실패로 인해 실행이 실패한 경우, 댓글은 후보가 실패했다고 암시하는 대신
그 사실을 명시해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 해당 애플리케이션에
올바른 봇 권한이 있고 안전하게 교체할 수 있다면, 다른 앱을 만들지 말고 그 애플리케이션을 재사용하세요.

초기 운영자 알림 채널은 시크릿 또는 배포 구성으로 설정하세요. 먼저 기존 유지관리자 또는 운영 채널을
가리키도록 한 다음, 전용 Mantis 채널이 생기면 그쪽으로 옮길 수 있습니다.

이 문서에 길드 ID, 채널 ID, 봇 토큰, 브라우저 쿠키 또는 VNC 비밀번호를 넣지 마세요.
GitHub 시크릿, 자격 증명 브로커 또는 운영자의 로컬 시크릿 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- ID 및 제목
- 전송 방식
- 필요한 자격 증명
- 기준 ref 정책
- 후보 ref 정책
- OpenClaw 구성 패치
- 설정 단계
- 자극
- 예상 기준 오라클
- 예상 후보 오라클
- 시각적 캡처 대상
- 시간 초과 예산
- 정리 단계

시나리오는 작고 타입이 지정된 오라클을 선호해야 합니다.

- 반응 버그에 대한 Discord 반응 상태
- 스레딩 버그에 대한 Discord 메시지 참조
- Slack 버그에 대한 Slack 스레드 ts 및 반응 API 상태
- 이메일 버그에 대한 이메일 메시지 ID 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상일 때의 브라우저 스크린샷

비전 검사는 추가적인 방식이어야 합니다. 플랫폼 API가 버그를 증명할 수 있다면,
API를 통과/실패 오라클로 사용하고 스크린샷은 사람이 확인하기 위한 신뢰 자료로 유지하세요.

## 제공자 확장

Discord 이후에는 동일한 러너에 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용한 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 사용 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답장 관계, 재시작 후 재개.

각 전송 방식에는 저렴한 스모크 시나리오 하나와 하나 이상의 버그 클래스 시나리오가 있어야 합니다.
비용이 큰 시각적 시나리오는 opt-in으로 유지해야 합니다.

## 열린 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇이 드라이버가 되어야 하며, 어떤 봇이 SUT가 되어야 합니까?
- 관찰자 브라우저 로그인은 첫 단계에서 인간 Discord 계정, 테스트 계정, 또는 봇이 읽을 수 있는 REST 증거만 사용해야 합니까?
- GitHub는 PR의 Mantis 아티팩트를 얼마나 오래 보존해야 합니까?
- ClawSweeper는 유지관리자 명령을 기다리는 대신 언제 Mantis를 자동으로 추천해야 합니까?
- 공개 PR에 업로드하기 전에 스크린샷을 수정하거나 잘라내야 합니까?
