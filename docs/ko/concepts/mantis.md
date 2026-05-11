---
read_when:
    - OpenClaw 버그에 대한 라이브 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 전후 검증 추가하기
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 실시간 전송 수단에서 OpenClaw 버그를 재현하고, 전후 증거를 캡처하며, 아티팩트를 PR에 첨부하기 위한 시각적 종단 간 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-11T20:27:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 전송 계층, 그리고 눈으로 확인 가능한 증거가 필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진 불량 ref에 대해 시나리오를 실행하고 증거를 캡처한 뒤, 동일한 시나리오를 후보 ref에 대해 실행하고, maintainer가 PR이나 로컬 명령에서 검사할 수 있는 artifact로 비교 결과를 게시합니다.

Mantis는 Discord에서 시작합니다. Discord는 실제 bot 인증, 실제 guild channel, reaction, thread, 네이티브 명령, 그리고 사람이 전송 계층에 표시된 내용을 시각적으로 확인할 수 있는 브라우저 UI를 제공하므로 가치가 높은 첫 번째 lane을 제공합니다.

## 목표

- 사용자가 보는 것과 같은 전송 계층 형태로 GitHub issue 또는 PR의 버그를 재현합니다.
- 수정 사항을 적용하기 전에 baseline ref에서 **before** artifact를 캡처합니다.
- 수정 사항을 적용한 후 candidate ref에서 **after** artifact를 캡처합니다.
- 가능한 경우 Discord REST reaction 읽기 또는 channel transcript 검사처럼 결정적인 oracle을 사용합니다.
- 버그에 눈에 보이는 UI 표면이 있는 경우 screenshot을 캡처합니다.
- agent가 제어하는 CLI에서 로컬로, GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화, 또는 provider 인증이 막힐 때 VNC 복구에 충분한 machine state를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 operator Discord channel에 간결한 상태를 게시합니다.

## 비목표

- Mantis는 unit test를 대체하지 않습니다. Mantis 실행은 보통 수정 사항이 이해된 뒤 더 작은 regression test가 되어야 합니다.
- Mantis는 일반적인 빠른 CI gate가 아닙니다. 더 느리고, live credential을 사용하며, live 환경이 중요한 버그에만 사용됩니다.
- Mantis는 일반 동작에 사람을 요구해서는 안 됩니다. 수동 VNC는 복구 경로이지 정상 경로가 아닙니다.
- Mantis는 artifact, log, screenshot, Markdown report, PR comment에 raw secret을 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA stack에 속합니다.

- OpenClaw는 scenario runtime, transport adapter, evidence schema, 그리고 `pnpm openclaw qa mantis` 아래의 local CLI를 소유합니다.
- QA Lab은 live transport harness 구성 요소, browser capture helper, artifact writer를 소유합니다.
- Crabbox는 원격 VM이 필요할 때 예열된 Linux machine을 소유합니다.
- GitHub Actions는 remote workflow entrypoint와 artifact retention을 소유합니다.
- ClawSweeper는 maintainer command 파싱, workflow dispatch, 최종 PR comment 게시 등 GitHub comment routing을 소유합니다.
- OpenClaw agent는 scenario에 agentic setup, debugging, stuck-state reporting이 필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 transport 지식을 OpenClaw에, machine scheduling을 Crabbox에, maintainer workflow glue를 ClawSweeper에 둡니다.

## 명령 형태

첫 번째 local command는 Discord bot, guild, channel, message send, reaction send, artifact path를 검증합니다.

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

runner는 output directory 아래에 분리된 baseline 및 candidate worktree를 만들고, dependency를 설치하고, 각 ref를 build하고, `--allow-failures`로 scenario를 실행한 뒤 `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 작성합니다. 첫 번째 Discord scenario에서 성공적인 검증은 baseline status가 `fail`이고 candidate status가 `pass`임을 의미합니다.

두 번째 Discord before/after probe는 thread attachment를 대상으로 합니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

이 scenario는 driver bot으로 parent message를 게시하고, 실제 Discord thread를 만들고, repo-local `filePath`로 OpenClaw의 `message.thread-reply` action을 호출한 다음, SUT reply와 attachment filename이 있는지 thread를 polling합니다. baseline screenshot은 attachment가 없는 reply를 보여주고, candidate screenshot은 예상된 `mantis-thread-report.md` attachment를 보여줍니다.

첫 번째 VM/browser primitive는 desktop smoke입니다.

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Crabbox desktop machine을 임대하거나 재사용하고, VNC session 안에서 보이는 browser를 시작하고, desktop을 캡처하고, artifact를 local output directory로 가져오고, report에 reconnect command를 작성합니다. 이 명령은 Mantis lane에서 작동하는 desktop/VNC coverage가 있는 첫 provider이기 때문에 기본값으로 Hetzner provider를 사용합니다. 다른 Crabbox fleet에 대해 실행할 때는 `--provider`, `--crabbox-bin`, 또는 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 재정의합니다.

유용한 desktop smoke flag:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 예열된 desktop을 재사용합니다.
- `--browser-url <url>`은 보이는 browser에서 열 page를 변경합니다.
- `--html-file <path>`는 repo-local HTML artifact를 보이는 browser에서 렌더링합니다. Mantis는 이를 사용해 실제 Crabbox desktop을 통해 생성된 Discord status-reaction timeline을 캡처합니다.
- `--browser-profile-dir <remote-path>`는 remote Chrome user-data-dir을 재사용하여 persistent Mantis desktop이 실행 사이에 로그인 상태를 유지할 수 있게 합니다. long-lived Discord Web viewer profile에 사용합니다.
- `--browser-profile-archive-env <name>`은 browser를 실행하기 전에 이름이 지정된 environment variable에서 base64 `.tgz` Chrome user-data-dir archive를 복원합니다. Discord Web 같은 로그인된 witness에 사용합니다. 기본 env var는 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`입니다.
- `--video-duration <seconds>`는 MP4 capture length를 제어합니다. 안정화 시간이 필요한 느린 로그인된 web app에는 더 긴 duration을 사용합니다.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 생성된 passing lease를 VNC inspection을 위해 열어 둡니다. Failed run은 operator가 다시 연결할 수 있도록, lease가 생성된 경우 기본적으로 lease를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 machine size와 lease lifetime을 조정합니다.

Discord Web evidence의 경우 Mantis는 bot token 대신 전용 viewer account를 사용합니다. live Discord API scenario가 계속 oracle입니다. 실제 thread를 만들고, SUT `thread-reply`를 보내고, Discord REST를 통해 attachment를 확인합니다. `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`이 설정되면 scenario는 Discord Web URL artifact도 작성합니다. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`이 설정되면 로그인된 browser가 열고 기록할 수 있을 만큼 해당 thread를 남겨 둡니다.

GitHub workflow는 Discord Web에서 candidate thread URL을 열고, screenshot을 캡처하고, MP4를 기록하며, Crabbox media tooling을 사용할 수 있을 때 잘라낸 GIF preview를 생성합니다. `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`을 통해 설정된 persistent viewer profile path를 선호합니다. 전체 Chrome profile archive는 GitHub의 secret-size limit을 초과할 수 있기 때문입니다. 작은/bootstrap profile의 경우 workflow는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`에서 base64 `.tgz` archive도 복원할 수 있습니다. 두 profile source가 모두 설정되지 않은 경우에도 workflow는 결정적인 baseline/candidate attachment screenshot을 게시하고, 로그인된 Discord Web witness를 건너뛰었다는 notice를 log에 남깁니다.

첫 번째 full desktop transport primitive는 Slack desktop smoke입니다.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Crabbox desktop machine을 임대하거나 재사용하고, 현재 checkout을 VM으로 sync하고, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC browser에서 Slack Web을 열고, 보이는 desktop을 캡처하고, Slack QA artifact와 VNC screenshot을 모두 local output directory로 복사합니다. 이는 SUT OpenClaw gateway와 browser가 같은 Linux desktop VM 안에 함께 존재하는 첫 번째 Mantis 형태입니다.

`--gateway-setup`을 사용하면 이 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에 persistent disposable OpenClaw home을 준비하고, 선택된 channel에 대해 Slack Socket Mode configuration을 patch하고, port `38973`에서 `openclaw gateway run`을 시작하며, VNC session에서 Chrome을 계속 실행합니다. 이것은 "Slack과 claw가 실행 중인 Linux desktop을 남겨 달라"는 mode입니다. `--gateway-setup`이 생략되면 bot-to-bot Slack QA lane이 기본값으로 유지됩니다.

`--credential-source env`에 필요한 input:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- remote model lane을 위한 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에 `OPENAI_API_KEY`만 설정된 경우 Mantis는 Crabbox를 호출하기 전에 이를 `OPENCLAW_LIVE_OPENAI_KEY`로 매핑하여 Crabbox의 `OPENCLAW_*` env forwarding이 VM 안으로 전달할 수 있게 합니다.

`--gateway-setup --credential-source convex`를 사용하면 Mantis는 VM을 만들기 전에 shared pool에서 Slack SUT credential을 lease하고, lease된 channel id, Socket Mode app token, bot token을 desktop 내부의 `OPENCLAW_MANTIS_SLACK_*` runtime env로 전달합니다. 이렇게 하면 GitHub workflow가 얇게 유지됩니다. raw Slack bot token이나 app token이 아니라 Convex broker secret만 필요합니다.

유용한 Slack desktop flag:

- `--lease-id <cbx_...>`는 operator가 이미 VNC를 통해 Slack Web에 로그인한 machine에 대해 다시 실행합니다.
- `--gateway-setup`은 bot-to-bot QA lane만 실행하는 대신 VM에서 persistent OpenClaw Slack gateway를 시작합니다.
- `--keep-lease`는 성공 후 VNC inspection을 위해 gateway VM을 열어 둡니다. `--no-keep-lease`는 artifact 수집 후 이를 중지합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 이것이 없으면 SUT bot token을 사용할 수 있을 때 Mantis가 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 파생합니다.
- `--slack-channel-id <id>`는 gateway setup에서 사용하는 Slack channel allowlist를 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`은 VM 내부의 persistent Chrome profile을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로, 수동 Slack Web login은 같은 lease에서 재실행해도 유지됩니다.
- `--credential-source convex --credential-role ci`는 직접 Slack env token 대신 shared credential pool을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack live lane으로 전달됩니다.

GitHub smoke workflow는 `Mantis Discord Smoke`입니다. 첫 번째 실제 scenario의 before 및 after GitHub workflow는 `Mantis Discord Status Reactions`입니다. 다음을 받습니다.

- `baseline_ref`: queued-only behavior를 재현할 것으로 예상되는 ref입니다.
- `candidate_ref`: `queued -> thinking -> done`을 표시할 것으로 예상되는 ref입니다.

workflow harness ref를 checkout하고, 별도의 baseline 및 candidate worktree를 build하고, 각 worktree에 대해 `discord-status-reactions-tool-only`를 실행하고, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 Actions artifact로 upload합니다. 또한 각 lane의 timeline HTML을 Crabbox desktop browser에서 렌더링하고, 해당 VNC screenshot을 결정적인 timeline PNG 옆에 PR comment로 게시합니다. 같은 PR comment는 `crabbox media preview`가 생성한 가벼운 motion-trimmed GIF preview를 embed하고, 대응하는 motion-trimmed MP4 clip에 link하며, 심층 inspection을 위해 full desktop MP4 file을 유지합니다. Screenshot은 빠른 review를 위해 inline으로 유지됩니다. workflow는 다음 Crabbox binary release가 나오기 전에 현재 desktop/browser lease flag를 사용할 수 있도록 `openclaw/crabbox` main에서 Crabbox CLI를 build합니다.

`Mantis Scenario`는 generic manual entrypoint입니다. `scenario_id`, `candidate_ref`, 선택적 `baseline_ref`, 선택적 `pr_number`를 받은 뒤, scenario-owned workflow를 dispatch합니다. wrapper는 의도적으로 얇습니다. scenario workflow가 여전히 자신의 transport setup, credential, VM class, expected oracle, artifact manifest를 소유합니다.

`Mantis Slack Desktop Smoke`는 첫 번째 Slack VM workflow입니다. 별도의 작업 트리에서
신뢰된 후보 ref를 체크아웃하고, Crabbox Linux desktop을 임대하며,
해당 후보에 대해 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`을
실행하고, VNC 브라우저에서 Slack Web을 열고, desktop을 녹화하고,
`crabbox media preview`로 움직임 기준 트리밍 preview를 생성하고, 전체 artifact
디렉터리를 업로드하며, 선택적으로 대상 PR에 인라인 증거 댓글을 게시합니다.
desktop 임대에는 기본적으로 AWS를 사용하며, 운영자가 AWS capacity가 느리거나
사용할 수 없을 때 Hetzner로 전환할 수 있도록 수동 provider 입력을 제공합니다. bot 간
Slack transcript만 필요한 것이 아니라 "Slack과 실행 중인 claw가 있는 Linux desktop"을
원할 때 이 lane을 사용하세요.

`Mantis Telegram Live`는 기존 Telegram live QA lane을 동일한 PR 증거 pipeline으로
감쌉니다. 별도의 작업 트리에서 신뢰된 후보 ref를 체크아웃하고,
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`를 실행하며, Telegram QA summary와 observed-message artifact로부터
`mantis-evidence.json` manifest를 작성하고, Crabbox desktop browser를 통해 redacted
transcript HTML을 렌더링하고, `crabbox media preview`로 움직임 기준 트리밍 GIF를
생성하며, PR 번호가 있을 때 인라인 PR 증거 댓글을 게시합니다. 이 lane은 로그인된
Telegram Web proof가 아니라 transcript-visual입니다. Telegram Bot API는 안정적인 live
message 증거를 제공하지만, 일반적인 Mantis 자동화에는 Telegram Web 로그인 상태가 필요하지
않습니다.

`Mantis Telegram Desktop Proof`는 agentic native Telegram Desktop before/after
wrapper입니다. maintainer는 PR 댓글의 `@Mantis telegram desktop proof`, 자유 형식
지침이 있는 Actions UI, 또는 generic `Mantis Scenario` dispatcher를 통해 이를 트리거할
수 있습니다. workflow는 PR, baseline ref, candidate ref, maintainer 지침을 Codex에
전달합니다. agent는 PR을 읽고, 변경을 증명하는 Telegram-visible 동작을 결정하고, baseline과
candidate에 대해 real-user Crabbox Telegram Desktop proof lane을 실행하며, native GIF가
유용해질 때까지 반복하고, 쌍으로 된 `motionPreview` artifact를 `mantis-evidence.json`에
작성하고, bundle을 업로드하며, PR 번호가 있을 때 2열 PR 증거 table을 게시합니다.

human-in-the-loop Telegram desktop 설정에는 scenario builder를 사용하세요.

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder는 Crabbox desktop을 임대하거나 재사용하고, native Linux Telegram Desktop binary를
설치하며, 선택적으로 user-session archive를 복원하고, 임대된 Telegram SUT bot token으로
OpenClaw를 구성하고, 포트 `38974`에서 `openclaw gateway run`을 시작하고, 임대된 private
group에 driver-bot 준비 메시지를 게시한 다음, 보이는 VNC desktop에서 screenshot과 MP4를
캡처합니다. bot token은 Telegram Desktop에 로그인하지 않습니다. 이는 OpenClaw만
구성합니다. desktop viewer는 `--telegram-profile-archive-env <name>`에서 복원되거나
VNC를 통해 수동으로 생성되고 `--keep-lease`로 유지되는 별도의 Telegram user session입니다.

유용한 Telegram desktop builder flag:

- `--lease-id <cbx_...>`는 운영자가 이미 Telegram Desktop에 로그인한 VM에 대해 다시 실행합니다.
- `--telegram-profile-archive-env <name>`는 해당 env var에서 base64 `.tgz` Telegram Desktop profile archive를 읽고 실행 전에 복원합니다.
- `--telegram-profile-dir <remote-path>`는 remote Telegram Desktop profile directory를 제어합니다. 기본값은 `$HOME/.local/share/TelegramDesktop`입니다.
- `--no-gateway-setup`은 OpenClaw를 구성하지 않고 Telegram Desktop을 설치하고 엽니다.
- `--credential-source convex --credential-role ci`는 직접 Telegram env token 대신 shared credential broker를 사용합니다.

모든 PR-publishing scenario는 report 옆에 `mantis-evidence.json`을 작성합니다.
이 schema는 scenario code와 GitHub 댓글 간 handoff입니다.

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

Artifact `path` 값은 manifest directory를 기준으로 한 상대 경로입니다. `targetPath`
값은 `qa-artifacts` branch publish directory 아래의 상대 경로입니다.
publisher는 path traversal을 거부하며, optional preview 또는 video를 사용할 수 없을 때
`"required": false`로 표시된 entry를 건너뜁니다.

지원되는 artifact kind:

- `timeline`: 보통 before/after인 deterministic scenario screenshot.
- `desktopScreenshot`: VNC/browser desktop screenshot.
- `motionPreview`: desktop recording에서 생성된 inline animated GIF.
- `motionClip`: static lead-in과 tail을 제거한 움직임 기준 트리밍 MP4.
- `fullVideo`: 깊이 있는 검사용 full MP4 recording.
- `metadata`: JSON/log sidecar.
- `report`: Markdown report.

재사용 가능한 publisher는 `scripts/mantis/publish-pr-evidence.mjs`입니다. workflow는
manifest, 대상 PR, `qa-artifacts` 대상 root, comment marker, Actions artifact URL, run
URL, request source와 함께 이를 호출합니다. 선언된 artifact를 `qa-artifacts` branch로
복사하고, inline image/preview와 linked video가 포함된 summary-first PR comment를 만든
다음, 기존 marker comment를 업데이트하거나 새로 만듭니다.

PR 댓글에서 status-reactions run을 직접 트리거할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 trigger는 의도적으로 좁게 제한되어 있습니다. pull request 댓글 중 write, maintain 또는
admin access가 있는 사용자의 댓글에서만 실행되며, Discord status-reaction 요청만 인식합니다.
기본적으로 알려진 bad baseline ref와 현재 PR head SHA를 candidate로 사용합니다. maintainer는
둘 중 하나의 ref를 override할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA도 PR 댓글에서 트리거할 수 있습니다.

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

기본적으로 현재 PR head SHA를 candidate로 사용하고 `telegram-status-command`를 실행합니다.
maintainer는 특정 ref 또는 미리 준비된 Crabbox desktop이 필요할 때 `candidate=...`,
`provider=aws|hetzner`, `lease=<cbx_...>`를 override할 수 있습니다.

ClawSweeper command 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 command는 명시적이며 scenario 중심입니다. 두 번째 command는 나중에 label, 변경된
file, ClawSweeper review finding을 바탕으로 PR 또는 issue를 권장 Mantis scenario에 매핑할
수 있습니다.

## 실행 lifecycle

1. credential을 확보합니다.
2. VM을 할당하거나 재사용합니다.
3. scenario에 UI 증거가 필요할 때 desktop/browser profile을 준비합니다.
4. baseline ref를 위한 clean checkout을 준비합니다.
5. dependency를 설치하고 scenario에 필요한 것만 build합니다.
6. isolated state directory로 child OpenClaw Gateway를 시작합니다.
7. live transport, provider, model, browser profile을 구성합니다.
8. scenario를 실행하고 baseline 증거를 캡처합니다.
9. Gateway를 중지하고 log를 보존합니다.
10. 같은 VM에서 candidate ref를 준비합니다.
11. 같은 scenario를 실행하고 candidate 증거를 캡처합니다.
12. oracle result와 visual evidence를 비교합니다.
13. Markdown, JSON, log, screenshot, optional trace artifact를 작성합니다.
14. GitHub Actions artifact를 업로드합니다.
15. 간결한 PR 또는 Discord status message를 게시합니다.

scenario는 두 가지 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: baseline이 예상한 방식으로 실패했습니다.
- **Harness 실패**: bug oracle이 의미를 갖기 전에 environment setup, credential, Discord API, browser 또는 provider가 실패했습니다.

최종 report는 maintainer가 불안정한 environment를 product behavior와 혼동하지 않도록 이 경우들을
분리해야 합니다.

## Discord MVP

첫 번째 scenario는 source reply delivery mode가 `message_tool_only`인 guild channel의
Discord status reaction을 대상으로 해야 합니다.

좋은 Mantis seed인 이유:

- triggering message의 reaction으로 Discord에서 보입니다.
- Discord message reaction state를 통해 강력한 REST oracle을 제공합니다.
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

Baseline 증거는 tool-only mode에서 queued acknowledgement reaction은 있지만 lifecycle
transition은 없는 상태를 보여야 합니다. Candidate 증거는 `messages.statusReactions.enabled`가
명시적으로 true일 때 lifecycle status reaction이 실행되는 것을 보여야 합니다.

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

이는 always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 명시적 status reaction으로 SUT를 구성합니다. oracle은
실제 Discord triggering message를 poll하고 관찰된 sequence `👀 -> 🤔 -> 👍`를 기대합니다.
artifact에는 `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`,
`discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 private QA stack 위에 구축해야 합니다.

- `pnpm openclaw qa discord`는 이미 driver와 SUT bot을 사용하는 live Discord lane을 실행합니다.
- live transport runner는 이미 `.artifacts/qa-e2e/` 아래에 report와 observed-message artifact를 작성합니다.
- Convex credential lease는 이미 shared live transport credential에 대한 exclusive access를 제공합니다.
- browser control service는 이미 screenshot, snapshot, headless managed profile, remote CDP profile을 지원합니다.
- QA Lab에는 이미 transport-shaped testing을 위한 debugger UI와 bus가 있습니다.

첫 Mantis 구현은 이러한 구성 요소 위의 얇은 before/after runner와 하나의 visual evidence layer가 될 수
있습니다.

## 증거 model

모든 run은 안정적인 artifact directory를 작성합니다.

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

`mantis-summary.json`은 machine-readable source of truth여야 합니다. Markdown report는 PR
댓글과 human review용입니다.

summary에는 다음이 포함되어야 합니다.

- 테스트한 ref와 SHA
- transport 및 scenario id
- machine provider와 machine id 또는 lease id
- secret value를 제외한 credential source
- baseline result
- candidate result
- baseline에서 버그가 재현되었는지 여부
- candidate가 이를 수정했는지 여부
- artifact path
- sanitized setup 또는 cleanup issue

스크린샷은 증거이지 비밀이 아닙니다. 그래도 여전히 수정 원칙이 필요합니다.
비공개 채널 이름, 사용자 이름, 메시지 내용이 나타날 수 있습니다. 공개 PR의 경우,
수정 방식이 더 견고해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를
선호하세요.

## 브라우저 및 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **헤드리스 자동화**: CI의 기본값입니다. Chrome은 CDP를 활성화한 상태로 실행되며,
  Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC 구조**: 로그인, MFA, Discord 자동화 방지,
  또는 시각적 디버깅에 사람이 필요할 때 같은 VM에서 활성화됩니다.

Discord 관찰자 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼
영속적이어야 하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은
개발자 노트북이 아니라 Mantis 머신 풀에 속합니다.

Mantis가 멈추면 다음을 포함한 Discord 상태 메시지를 게시합니다.

- 실행 ID
- 시나리오 ID
- 머신 제공자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 사유 텍스트

첫 번째 비공개 배포에서는 이러한 메시지를 기존 운영자 채널에 게시하고,
나중에 전용 Mantis 채널로 이동할 수 있습니다.

## 머신

Mantis는 첫 번째 원격 구현에서 Crabbox를 통한 AWS를 우선해야 합니다.
Crabbox는 예열된 머신, 임대 추적, 하이드레이션, 로그, 결과, 정리를 제공합니다.
AWS 용량이 너무 느리거나 사용할 수 없으면 같은 머신 인터페이스 뒤에 Hetzner 제공자를
추가하세요.

최소 VM 요구 사항:

- 데스크톱 사용이 가능한 Chrome 또는 Chromium이 설치된 Linux
- 브라우저 자동화를 위한 CDP 접근
- 구조를 위한 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용하는 경우 Playwright Chromium 브라우저 캐시
- 하나의 OpenClaw Gateway, 하나의 브라우저, 하나의 모델 실행에 충분한 CPU와 메모리
- Discord, GitHub, 모델 제공자, 자격 증명 브로커에 대한 아웃바운드 접근

VM은 예상되는 자격 증명 또는 브라우저 프로필 저장소 밖에 장기 원시 비밀을
보관해서는 안 됩니다.

## 비밀

비밀은 원격 실행의 경우 GitHub 조직 또는 리포지터리 비밀에, 로컬 실행의 경우
로컬 운영자가 제어하는 비밀 파일에 보관됩니다.

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

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반적인 소스로 유지되어야
합니다. GitHub 비밀은 브로커와 폴백 레인을 부트스트랩합니다.
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

공개 아티팩트 업로드도 봇, 길드, 채널, 메시지 ID 같은 Discord 대상 메타데이터를
수정해야 합니다. GitHub 스모크 워크플로는 이 이유로
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅, 로그에 붙여넣어지면 새 비밀이 저장된 후
해당 토큰을 교체하세요.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 단기 Actions 아티팩트로 업로드해야 합니다.
워크플로가 버그 보고서 또는 수정 PR을 위해 실행되는 경우, 수정된 PNG 스크린샷도
`qa-artifacts` 브랜치에 게시하고 해당 버그 또는 수정 PR에 전후 인라인 스크린샷이
포함된 댓글을 업서트해야 합니다. 주요 증거를 일반 QA 자동화 PR에만 게시하지 마세요.
원시 로그, 관찰된 메시지, 기타 큰 증거는 Actions 아티팩트에 남깁니다.

프로덕션 워크플로는 `github-actions[bot]`이 아니라 Mantis GitHub App으로 해당 댓글을
게시해야 합니다. 앱 ID와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및
`MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 비밀로 저장하세요. 워크플로는 숨겨진
마커를 업서트 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며,
이전 봇 소유 마커를 편집할 수 없으면 새 Mantis 소유 댓글을 생성합니다.

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

하네스가 실패해서 실행이 실패한 경우 댓글은 후보가 실패했다고 암시하는 대신
그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 해당 애플리케이션에
올바른 봇 권한이 있고 안전하게 교체할 수 있다면 다른 앱을 만들지 말고 재사용하세요.

초기 운영자 알림 채널은 비밀 또는 배포 구성을 통해 설정하세요. 처음에는 기존
메인테이너 또는 운영 채널을 가리키고, 전용 Mantis 채널이 생기면 그쪽으로 이동할 수
있습니다.

길드 ID, 채널 ID, 봇 토큰, 브라우저 쿠키, VNC 비밀번호를 이 문서에 넣지 마세요.
GitHub 비밀, 자격 증명 브로커, 또는 운영자의 로컬 비밀 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- ID 및 제목
- 전송
- 필요한 자격 증명
- 베이스라인 참조 정책
- 후보 참조 정책
- OpenClaw 구성 패치
- 설정 단계
- 자극
- 예상 베이스라인 오라클
- 예상 후보 오라클
- 시각적 캡처 대상
- 타임아웃 예산
- 정리 단계

시나리오는 작고 타입이 지정된 오라클을 선호해야 합니다.

- 반응 버그의 경우 Discord 반응 상태
- 스레딩 버그의 경우 Discord 메시지 참조
- Slack 버그의 경우 Slack 스레드 타임스탬프 및 반응 API 상태
- 이메일 버그의 경우 이메일 메시지 ID 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상일 때 브라우저 스크린샷

비전 검사는 추가적인 방식이어야 합니다. 플랫폼 API로 버그를 증명할 수 있다면,
API를 통과/실패 오라클로 사용하고 스크린샷은 사람이 확신할 수 있도록 유지하세요.

## 제공자 확장

Discord 이후 같은 러너는 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용한 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 사용 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답장 관계, 재시작 재개.

각 전송에는 저렴한 스모크 시나리오 하나와 하나 이상의 버그 클래스 시나리오가 있어야
합니다. 비용이 큰 시각적 시나리오는 옵트인으로 유지해야 합니다.

## 미해결 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇을 드라이버로, 어떤 봇을 SUT로 사용해야 하나요?
- 관찰자 브라우저 로그인은 첫 단계에서 사람 Discord 계정, 테스트 계정, 또는 봇이 읽을 수 있는 REST 증거만 사용해야 하나요?
- GitHub는 PR용 Mantis 아티팩트를 얼마나 오래 보존해야 하나요?
- ClawSweeper는 언제 메인테이너 명령을 기다리는 대신 Mantis를 자동으로 권장해야 하나요?
- 공개 PR의 경우 업로드 전에 스크린샷을 수정하거나 잘라내야 하나요?
