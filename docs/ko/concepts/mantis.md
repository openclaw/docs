---
read_when:
    - OpenClaw 버그에 대한 라이브 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 전후 검증 추가
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 접근이 필요한 QA 실행 디버깅
summary: Mantis는 라이브 전송 환경에서 OpenClaw 버그를 재현하고, 전후 증거를 캡처하며, 아티팩트를 PR에 첨부하기 위한 시각적 엔드투엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-10T19:31:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 runtime, 실제 transport, 그리고 눈에 보이는 증거가 필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진
나쁜 ref에 대해 시나리오를 실행해 증거를 캡처하고, candidate ref에 대해 같은 시나리오를 실행한 뒤,
maintainer가 PR이나 로컬 명령에서 검사할 수 있는 artifacts로 비교 결과를 게시합니다.

Mantis는 Discord부터 시작합니다. Discord가 가치 높은 첫 lane을 제공하기 때문입니다:
실제 bot auth, 실제 guild channels, reactions, threads, native commands, 그리고 사람이 transport가 보여 준 내용을
시각적으로 확인할 수 있는 browser UI가 있습니다.

## 목표

- 사용자가 보는 것과 같은 transport shape로 GitHub issue나 PR의 버그를 재현합니다.
- fix를 적용하기 전 baseline ref에서 **수정 전** artifact를 캡처합니다.
- fix를 적용한 뒤 candidate ref에서 **수정 후** artifact를 캡처합니다.
- 가능할 때마다 Discord REST reaction 읽기나 channel transcript 확인 같은 결정론적 oracle을 사용합니다.
- 버그에 보이는 UI surface가 있으면 screenshots를 캡처합니다.
- agent-controlled CLI에서 로컬로, GitHub에서 원격으로 실행합니다.
- login, browser automation, provider auth가 막힐 때 VNC rescue를 할 수 있도록 충분한 machine state를 보존합니다.
- 실행이 blocked되거나, 수동 VNC 도움이 필요하거나, 완료될 때 operator Discord channel에 간결한 status를 게시합니다.

## 비목표

- Mantis는 unit tests를 대체하지 않습니다. Mantis run은 보통 fix를 이해한 뒤 더 작은 regression test가 되어야 합니다.
- Mantis는 일반적인 빠른 CI gate가 아닙니다. 더 느리고, live credentials를 사용하며, live environment가 중요한 버그에만 사용됩니다.
- Mantis는 정상 동작에 사람이 필요해서는 안 됩니다. Manual VNC는 rescue path이지 happy path가 아닙니다.
- Mantis는 artifacts, logs, screenshots, Markdown reports, PR comments에 raw secrets를 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA stack에 속합니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 scenario runtime, transport adapters, evidence schema, local CLI를 소유합니다.
- QA Lab은 live transport harness pieces, browser capture helpers, artifact writers를 소유합니다.
- Crabbox는 remote VM이 필요할 때 warmed Linux machines를 소유합니다.
- GitHub Actions는 remote workflow entrypoint와 artifact retention을 소유합니다.
- ClawSweeper는 maintainer commands 파싱, workflow dispatch, final PR comment 게시 등 GitHub comment routing을 소유합니다.
- 시나리오에 agentic setup, debugging, stuck-state reporting이 필요할 때 OpenClaw agents는 Codex를 통해 Mantis를 구동합니다.

이 경계는 transport knowledge를 OpenClaw에, machine scheduling을
Crabbox에, maintainer workflow glue를 ClawSweeper에 둡니다.

## 명령 형태

첫 번째 local command는 Discord bot, guild, channel, message send,
reaction send, artifact path를 검증합니다:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

local before and after runner는 이 형태를 받습니다:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner는 output directory 아래에 detached baseline 및 candidate worktrees를 만들고,
dependencies를 설치하며, 각 ref를 build하고, `--allow-failures`로 scenario를 실행한 다음
`baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 작성합니다. 첫 Discord scenario에서 성공적인 verification은
baseline status가 `fail`이고 candidate status가 `pass`임을 의미합니다.

두 번째 Discord before/after probe는 thread attachments를 대상으로 합니다:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

이 scenario는 driver bot으로 parent message를 게시하고, 실제 Discord
thread를 만들고, repo-local `filePath`로 OpenClaw의 `message.thread-reply` action을 호출한 다음,
SUT reply와 attachment filename을 thread에서 polling합니다. baseline screenshot은 attachment가 없는 reply를 보여 주고, candidate screenshot은 예상된 `mantis-thread-report.md` attachment를 보여 줍니다.

첫 번째 VM/browser primitive는 desktop smoke입니다:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox desktop machine을 lease하거나 재사용하고, VNC session 안에서 보이는 browser를 시작하며,
desktop을 캡처하고, artifacts를 local output directory로 다시 가져오고, report에 reconnect command를 작성합니다. 이 명령은 기본적으로 Hetzner provider를 사용합니다. Mantis lane에서 desktop/VNC coverage가 동작하는 첫 provider이기 때문입니다. 다른 Crabbox fleet에 대해 실행할 때는 `--provider`, `--crabbox-bin`, 또는
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 override하십시오.

유용한 desktop smoke flags:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 warmed desktop을 재사용합니다.
- `--browser-url <url>`은 visible browser에서 여는 page를 변경합니다.
- `--html-file <path>`는 visible browser에서 repo-local HTML artifact를 render합니다. Mantis는 이를 사용해 실제 Crabbox desktop을 통해 생성된 Discord status-reaction timeline을 캡처합니다.
- `--browser-profile-dir <remote-path>`는 remote Chrome user-data-dir을 재사용하므로 persistent Mantis desktop이 run 사이에도 logged in 상태를 유지할 수 있습니다. long-lived Discord Web viewer profile에 사용하십시오.
- `--browser-profile-archive-env <name>`은 browser를 시작하기 전에 지정된 environment variable에서 base64 `.tgz` Chrome user-data-dir archive를 복원합니다. Discord Web 같은 logged-in witnesses에 사용하십시오. 기본 env var는 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`입니다.
- `--video-duration <seconds>`는 MP4 capture length를 제어합니다. 안정화 시간이 필요한 느린 logged-in web apps에는 더 긴 duration을 사용하십시오.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 생성된 passing lease를 VNC inspection을 위해 열어 둡니다. Failed runs는 operator가 reconnect할 수 있도록 lease가 생성된 경우 기본적으로 lease를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 machine size와 lease lifetime을 조정합니다.

Discord Web evidence를 위해 Mantis는 bot token 대신 dedicated viewer account를 사용합니다.
live Discord API scenario는 oracle로 남습니다. 이 scenario는 실제
thread를 만들고, SUT `thread-reply`를 보내며, Discord REST를 통해 attachment를 확인합니다.
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`이 설정되면 scenario는 Discord Web URL artifact도 작성합니다. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`이
설정되면 logged-in browser가 열고 기록할 수 있을 만큼 해당 thread를 유지합니다.

GitHub workflow는 Discord Web에서 candidate thread URL을 열고, screenshot을 캡처하며,
MP4를 녹화하고, Crabbox media tooling을 사용할 수 있으면 trimmed GIF preview를 생성합니다.
full Chrome profile archives는 GitHub의 secret-size limit를 초과할 수 있으므로
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`을 통해 구성된 persistent viewer profile path를 선호하십시오. 작은/bootstrap profiles의 경우,
workflow는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`에서 base64 `.tgz` archive도 복원할 수 있습니다. 어떤 profile source도
구성되지 않은 경우에도 workflow는 결정론적인 baseline/candidate
attachment screenshots를 게시하고, logged-in Discord Web witness를 건너뛰었다는 notice를 기록합니다.

첫 번째 full desktop transport primitive는 Slack desktop smoke입니다:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox desktop machine을 lease하거나 재사용하고, current checkout을
VM에 sync하며, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC
browser에서 Slack Web을 열고, visible desktop을 캡처하며, Slack QA artifacts와
VNC screenshot을 모두 local output directory로 복사합니다. 이는 SUT OpenClaw gateway와 browser가 모두 같은 Linux desktop VM 안에 있는 첫 번째 Mantis shape입니다.

`--gateway-setup`을 사용하면 이 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에 persistent disposable OpenClaw home을 준비하고,
선택된 channel에 맞게 Slack Socket Mode configuration을 patch하며, port
`38973`에서 `openclaw gateway run`을 시작하고, Chrome을 VNC session에서 계속 실행합니다. 이것은 “Slack과 실행 중인 claw가 있는 Linux desktop을 남겨 달라” 모드입니다. `--gateway-setup`을 생략하면 bot-to-bot Slack QA lane이 기본값으로 남습니다.

`--credential-source env`에 필요한 inputs:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- remote model lane을 위한 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에
  `OPENAI_API_KEY`만 설정된 경우, Crabbox를 호출하기 전에 Mantis가 이를 `OPENCLAW_LIVE_OPENAI_KEY`로 map하여 Crabbox의 `OPENCLAW_*` env forwarding이 VM으로 전달할 수 있게 합니다.

`--gateway-setup --credential-source convex`를 사용하면 Mantis는 VM을 만들기 전에 shared pool에서 Slack SUT
credential을 lease하고, leased channel id, Socket Mode app token, bot token을 desktop 안의 `OPENCLAW_MANTIS_SLACK_*`
runtime env로 forward합니다. 이렇게 하면 GitHub workflows가 얇게 유지됩니다. raw Slack bot 또는 app tokens가 아니라 Convex broker secret만 필요합니다.

유용한 Slack desktop flags:

- `--lease-id <cbx_...>`는 operator가 이미 VNC를 통해 Slack Web에 logged in한 machine에 대해 다시 실행합니다.
- `--gateway-setup`은 bot-to-bot QA lane만 실행하는 대신 VM에서 persistent OpenClaw Slack gateway를 시작합니다.
- `--keep-lease`는 성공 후 VNC inspection을 위해 gateway VM을 열어 둡니다. `--no-keep-lease`는 artifacts를 수집한 뒤 중지합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 없으면 SUT bot token을 사용할 수 있을 때 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 도출합니다.
- `--slack-channel-id <id>`는 gateway setup에서 사용하는 Slack channel allowlist를 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`은 VM 안의 persistent Chrome profile을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로, 수동 Slack Web login이 같은 lease의 reruns에서도 유지됩니다.
- `--credential-source convex --credential-role ci`는 direct Slack env tokens 대신 shared credential pool을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack live lane으로 전달됩니다.

GitHub smoke workflow는 `Mantis Discord Smoke`입니다. 첫 실제 scenario의 before and after GitHub
workflow는 `Mantis Discord Status Reactions`입니다.
다음을 받습니다:

- `baseline_ref`: queued-only behavior를 재현할 것으로 예상되는 ref입니다.
- `candidate_ref`: `queued -> thinking -> done`을 보여 줄 것으로 예상되는 ref입니다.

이 workflow는 workflow harness ref를 checkout하고, 별도의 baseline 및 candidate
worktrees를 build하며, 각 worktree에 대해 `discord-status-reactions-tool-only`를 실행하고,
`baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를
Actions artifacts로 upload합니다. 또한 각 lane의 timeline HTML을 Crabbox
desktop browser에서 render하고, 해당 VNC screenshots를 PR comment의 결정론적
timeline PNGs 옆에 게시합니다. 같은 PR comment는 `crabbox media preview`로 생성된 가벼운
motion-trimmed GIF previews를 embed하고, 대응되는 motion-trimmed MP4 clips로 link하며,
deep inspection을 위해 full desktop MP4 files를 유지합니다. 빠른 review를 위해 screenshots는 inline으로 유지됩니다. 이 workflow는 다음 Crabbox binary release가 나오기 전에 현재 desktop/browser lease flags를 사용할 수 있도록
`openclaw/crabbox` main에서 Crabbox CLI를 build합니다.

`Mantis Scenario`는 generic manual entrypoint입니다. `scenario_id`,
`candidate_ref`, optional `baseline_ref`, optional `pr_number`를 받아
scenario-owned workflow를 dispatch합니다. wrapper는 의도적으로 얇습니다:
scenario workflows는 여전히 자체 transport setup, credentials, VM class,
expected oracle, artifact manifest를 소유합니다.

`Mantis Slack Desktop Smoke`는 첫 번째 Slack VM 워크플로입니다. 별도 worktree에서
신뢰할 수 있는 후보 ref를 체크아웃하고, Crabbox Linux 데스크톱을 임대한 뒤, 해당
후보에 대해 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`을 실행하고,
VNC 브라우저에서 Slack Web을 열고, 데스크톱을 녹화하고, `crabbox media preview`로
동작이 있는 구간만 남긴 미리보기를 생성하고, 전체 아티팩트 디렉터리를 업로드하며,
선택적으로 대상 PR에 인라인 증거 댓글을 게시합니다. 데스크톱 임대는 기본적으로 AWS를
사용하며, AWS 용량이 느리거나 사용할 수 없을 때 운영자가 Hetzner로 전환할 수 있도록
수동 공급자 입력을 제공합니다. 봇 간 Slack transcript만 필요한 것이 아니라
"Slack과 claw가 실행 중인 Linux 데스크톱"이 필요할 때 이 레인을 사용하세요.

`Mantis Telegram Live`는 기존 Telegram 라이브 QA 레인을 동일한 PR 증거 파이프라인으로
감쌉니다. 별도 worktree에서 신뢰할 수 있는 후보 ref를 체크아웃하고,
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`를 실행하고, Telegram QA 요약과 observed-message 아티팩트에서
`mantis-evidence.json` 매니페스트를 작성하고, Crabbox 데스크톱 브라우저를 통해 삭제 처리된
transcript HTML을 렌더링하고, `crabbox media preview`로 동작이 있는 구간만 남긴 GIF를
생성하며, PR 번호를 사용할 수 있을 때 인라인 PR 증거 댓글을 게시합니다. 이 레인은
로그인된 Telegram Web 증거가 아니라 transcript 시각 증거입니다. Telegram Bot API는
안정적인 라이브 메시지 증거를 제공하지만, 일반 Mantis 자동화에는 Telegram Web 로그인
상태가 필요하지 않습니다.

사람이 개입하는 Telegram 데스크톱 설정에는 시나리오 빌더를 사용하세요.

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

빌더는 Crabbox 데스크톱을 임대하거나 재사용하고, 기본 Linux Telegram Desktop 바이너리를
설치하고, 선택적으로 사용자 세션 아카이브를 복원하고, 임대한 Telegram SUT 봇 토큰으로
OpenClaw를 구성하고, 포트 `38974`에서 `openclaw gateway run`을 시작하고, 임대한 비공개
그룹에 driver-bot 준비 메시지를 게시한 다음, 보이는 VNC 데스크톱에서 스크린샷과 MP4를
캡처합니다. 봇 토큰은 Telegram Desktop에 로그인하지 않습니다. OpenClaw를 구성하는 데만
사용됩니다. 데스크톱 뷰어는 `--telegram-profile-archive-env <name>`에서 복원되거나 VNC를
통해 수동으로 생성되고 `--keep-lease`로 계속 유지되는 별도의 Telegram 사용자 세션입니다.

유용한 Telegram 데스크톱 빌더 플래그:

- `--lease-id <cbx_...>`는 운영자가 이미 Telegram Desktop에 로그인한 VM에 대해 다시 실행합니다.
- `--telegram-profile-archive-env <name>`은 해당 env var에서 base64 `.tgz` Telegram Desktop 프로필 아카이브를 읽고 실행 전에 복원합니다.
- `--telegram-profile-dir <remote-path>`는 원격 Telegram Desktop 프로필 디렉터리를 제어합니다. 기본값은 `$HOME/.local/share/TelegramDesktop`입니다.
- `--no-gateway-setup`은 OpenClaw를 구성하지 않고 Telegram Desktop을 설치하고 엽니다.
- `--credential-source convex --credential-role ci`는 직접 Telegram env 토큰 대신 공유 credential broker를 사용합니다.

PR에 게시하는 모든 시나리오는 보고서 옆에 `mantis-evidence.json`을 작성합니다.
이 스키마는 시나리오 코드와 GitHub 댓글 사이의 인계 지점입니다.

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

아티팩트 `path` 값은 매니페스트 디렉터리를 기준으로 한 상대 경로입니다. `targetPath`
값은 `qa-artifacts` 브랜치 게시 디렉터리 아래의 상대 경로입니다. 게시자는 경로 순회를
거부하고, 선택적 미리보기나 동영상을 사용할 수 없을 때 `"required": false`로 표시된
항목을 건너뜁니다.

지원되는 아티팩트 종류:

- `timeline`: 보통 전/후를 나타내는 결정적 시나리오 스크린샷입니다.
- `desktopScreenshot`: VNC/브라우저 데스크톱 스크린샷입니다.
- `motionPreview`: 데스크톱 녹화에서 생성한 인라인 애니메이션 GIF입니다.
- `motionClip`: 정적인 시작부와 끝부분을 제거한 동작 구간 MP4입니다.
- `fullVideo`: 심층 검사용 전체 MP4 녹화입니다.
- `metadata`: JSON/로그 사이드카입니다.
- `report`: Markdown 보고서입니다.

재사용 가능한 게시자는 `scripts/mantis/publish-pr-evidence.mjs`입니다. 워크플로는
매니페스트, 대상 PR, `qa-artifacts` 대상 루트, 댓글 마커, Actions 아티팩트 URL, 실행
URL, 요청 소스를 전달해 이를 호출합니다. 게시자는 선언된 아티팩트를 `qa-artifacts`
브랜치에 복사하고, 인라인 이미지/미리보기와 링크된 동영상이 포함된 요약 우선 PR 댓글을
만든 다음, 기존 마커 댓글을 업데이트하거나 새 댓글을 만듭니다.

PR 댓글에서 status-reactions 실행을 직접 트리거할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 트리거는 의도적으로 좁게 설계되었습니다. 쓰기, 유지 관리, 또는 관리자 권한이 있는
사용자의 pull request 댓글에서만 실행되며, Discord status-reaction 요청만 인식합니다.
기본적으로 알려진 나쁜 baseline ref와 현재 PR head SHA를 후보로 사용합니다. 관리자는
어느 ref든 재정의할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 라이브 QA도 PR 댓글에서 트리거할 수 있습니다.

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

기본적으로 현재 PR head SHA를 후보로 사용하고 `telegram-status-command`를 실행합니다.
특정 ref 또는 미리 준비된 Crabbox 데스크톱이 필요할 때 관리자는 `candidate=...`,
`provider=aws|hetzner`, `lease=<cbx_...>`를 재정의할 수 있습니다.

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이며 시나리오 중심입니다. 두 번째 명령은 나중에 PR 또는 이슈를
레이블, 변경된 파일, ClawSweeper 검토 결과를 기반으로 권장 Mantis 시나리오에 매핑할 수
있습니다.

## 실행 수명 주기

1. credentials를 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. 시나리오에 UI 증거가 필요하면 데스크톱/브라우저 프로필을 준비합니다.
4. baseline ref용 깨끗한 체크아웃을 준비합니다.
5. 의존성을 설치하고 시나리오에 필요한 것만 빌드합니다.
6. 격리된 상태 디렉터리로 하위 OpenClaw Gateway를 시작합니다.
7. 라이브 transport, provider, model, 브라우저 프로필을 구성합니다.
8. 시나리오를 실행하고 baseline 증거를 캡처합니다.
9. Gateway를 중지하고 로그를 보존합니다.
10. 동일한 VM에서 candidate ref를 준비합니다.
11. 같은 시나리오를 실행하고 candidate 증거를 캡처합니다.
12. oracle 결과와 시각 증거를 비교합니다.
13. Markdown, JSON, 로그, 스크린샷, 선택적 trace 아티팩트를 작성합니다.
14. GitHub Actions 아티팩트를 업로드합니다.
15. 간결한 PR 또는 Discord 상태 메시지를 게시합니다.

시나리오는 두 가지 다른 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: baseline이 예상한 방식으로 실패했습니다.
- **Harness 실패**: 버그 oracle이 의미를 갖기 전에 환경 설정, credentials, Discord API, 브라우저 또는 provider가 실패했습니다.

최종 보고서는 관리자가 불안정한 환경과 제품 동작을 혼동하지 않도록 이 경우들을 분리해야
합니다.

## Discord MVP

첫 번째 시나리오는 소스 reply delivery mode가 `message_tool_only`인 guild 채널의 Discord
status reaction을 대상으로 해야 합니다.

이것이 좋은 Mantis seed인 이유:

- 트리거 메시지의 reaction으로 Discord에 표시됩니다.
- Discord 메시지 reaction 상태를 통한 강력한 REST oracle이 있습니다.
- 실제 OpenClaw Gateway, Discord 봇 인증, 메시지 dispatch, 소스 reply delivery mode, status reaction 상태, model turn lifecycle을 실행합니다.
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

Baseline 증거는 queued acknowledgement reaction은 보이지만 tool-only 모드에서 lifecycle
전환은 없음을 보여야 합니다. Candidate 증거는 `messages.statusReactions.enabled`가
명시적으로 true일 때 lifecycle status reaction이 실행되는 것을 보여야 합니다.

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

이 시나리오는 SUT를 always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 명시적 status reaction으로 구성합니다. oracle은 실제
Discord 트리거 메시지를 poll하고 관찰된 sequence `👀 -> 🤔 -> 👍`를 기대합니다.
아티팩트에는 `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`,
`discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 새로 시작하는 대신 기존 비공개 QA 스택 위에 구축해야 합니다.

- `pnpm openclaw qa discord`는 이미 driver와 SUT 봇이 있는 라이브 Discord 레인을 실행합니다.
- 라이브 transport runner는 이미 `.artifacts/qa-e2e/` 아래에 보고서와 observed-message 아티팩트를 작성합니다.
- Convex credential lease는 이미 공유 라이브 transport credentials에 대한 독점 접근을 제공합니다.
- 브라우저 제어 서비스는 이미 스크린샷, snapshot, headless managed profile, 원격 CDP profile을 지원합니다.
- QA Lab에는 이미 transport 형태 테스트를 위한 debugger UI와 bus가 있습니다.

첫 번째 Mantis 구현은 이러한 구성 요소 위에 얇은 before/after runner와 하나의 시각 증거
계층을 더한 형태일 수 있습니다.

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

`mantis-summary.json`은 기계가 읽을 수 있는 단일 진실 공급원이어야 합니다.
Markdown 보고서는 PR 댓글과 사람이 검토하기 위한 것입니다.

요약에는 다음이 포함되어야 합니다.

- 테스트한 refs와 SHAs
- transport와 scenario id
- machine provider와 machine id 또는 lease id
- secret 값이 없는 credential source
- baseline 결과
- candidate 결과
- baseline에서 버그가 재현되었는지 여부
- candidate가 이를 수정했는지 여부
- artifact path
- 삭제 처리된 setup 또는 cleanup 문제

스크린샷은 secret이 아니라 증거입니다. 그래도 삭제 처리 규율이 필요합니다. 비공개 채널
이름, 사용자 이름 또는 메시지 내용이 나타날 수 있습니다. 공개 PR에서는 삭제 처리 방식이
더 강력해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를 선호하세요.

## 브라우저와 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **Headless automation**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며, Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC rescue**: 로그인, MFA, Discord anti-automation 또는 시각적 debugging에 사람이 필요할 때 같은 VM에서 활성화됩니다.

Discord observer 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼 지속적이어야
하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은 개발자 노트북이 아니라
Mantis machine pool에 속합니다.

Mantis가 막히면 다음을 포함한 Discord 상태 메시지를 게시합니다:

- 실행 ID
- 시나리오 ID
- 머신 공급자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 사유 텍스트

첫 비공개 배포는 이러한 메시지를 기존 운영자 채널에 게시하고 나중에 전용 Mantis 채널로 이동할 수 있습니다.

## 머신

Mantis는 첫 원격 구현에서 Crabbox를 통한 AWS를 우선해야 합니다. Crabbox는 예열된 머신, 임대 추적, 하이드레이션, 로그, 결과, 정리를 제공합니다. AWS 용량이 너무 느리거나 사용할 수 없다면 동일한 머신 인터페이스 뒤에 Hetzner 공급자를 추가하세요.

최소 VM 요구 사항:

- 데스크톱 사용이 가능한 Chrome 또는 Chromium이 설치된 Linux
- 브라우저 자동화를 위한 CDP 접근
- 복구용 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용할 때 Playwright Chromium 브라우저 캐시
- OpenClaw Gateway 1개, 브라우저 1개, 모델 실행 1개에 충분한 CPU 및 메모리
- Discord, GitHub, 모델 공급자, 자격 증명 브로커에 대한 아웃바운드 접근

VM은 예상되는 자격 증명 또는 브라우저 프로필 저장소 외부에 장기 원시 비밀을 보관해서는 안 됩니다.

## 비밀

비밀은 원격 실행의 경우 GitHub 조직 또는 저장소 비밀에, 로컬 실행의 경우 로컬 운영자 제어 비밀 파일에 둡니다.

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

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반적인 소스로 유지되어야 합니다. GitHub 비밀은 브로커와 대체 경로를 부트스트랩합니다. Discord 상태 반응 워크플로는 Mantis Crabbox 비밀을 Crabbox CLI가 기대하는 `CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` 환경 변수로 다시 매핑합니다. 일반 `CRABBOX_*` GitHub 비밀 이름은 호환성 대체 수단으로 계속 허용됩니다.

Mantis 실행기는 절대 다음을 출력하면 안 됩니다.

- Discord 봇 토큰
- 공급자 API 키
- 브라우저 쿠키
- 인증 프로필 내용
- VNC 비밀번호
- 원시 자격 증명 페이로드

공개 아티팩트 업로드는 봇, 길드, 채널, 메시지 ID 같은 Discord 대상 메타데이터도 삭제해야 합니다. 이러한 이유로 GitHub 스모크 워크플로는 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅 또는 로그에 붙여넣어졌다면 새 비밀을 저장한 뒤 이를 교체하세요.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions 아티팩트로 업로드해야 합니다. 버그 보고서 또는 수정 PR에 대해 워크플로가 실행되면, 삭제 처리된 PNG 스크린샷도 `qa-artifacts` 브랜치에 게시하고 해당 버그 또는 수정 PR에 전후 스크린샷을 인라인으로 포함한 댓글을 upsert해야 합니다. 주요 증거를 일반 QA 자동화 PR에만 게시하지 마세요. 원시 로그, 관찰된 메시지, 기타 큰 증거는 Actions 아티팩트에 둡니다.

프로덕션 워크플로는 `github-actions[bot]`이 아니라 Mantis GitHub App으로 해당 댓글을 게시해야 합니다. 앱 ID와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 비밀로 저장하세요. 워크플로는 숨겨진 마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며, 이전 봇 소유 마커를 편집할 수 없으면 Mantis 소유의 새 댓글을 만듭니다.

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

하네스가 실패해 실행이 실패한 경우, 댓글은 후보가 실패했다고 암시하는 대신 그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 올바른 봇 권한이 있고 안전하게 교체할 수 있다면 다른 앱을 만들지 말고 해당 애플리케이션을 재사용하세요.

초기 운영자 알림 채널은 비밀 또는 배포 구성을 통해 설정하세요. 먼저 기존 유지 관리자 또는 운영 채널을 가리키게 한 다음, 전용 Mantis 채널이 생기면 그곳으로 이동할 수 있습니다.

길드 ID, 채널 ID, 봇 토큰, 브라우저 쿠키 또는 VNC 비밀번호를 이 문서에 넣지 마세요. GitHub 비밀, 자격 증명 브로커 또는 운영자의 로컬 비밀 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- ID 및 제목
- 전송
- 필요한 자격 증명
- 기준 참조 정책
- 후보 참조 정책
- OpenClaw 구성 패치
- 설정 단계
- 자극
- 예상 기준 오라클
- 예상 후보 오라클
- 시각적 캡처 대상
- 시간 초과 예산
- 정리 단계

시나리오는 작고 타입이 지정된 오라클을 우선해야 합니다.

- 반응 버그의 경우 Discord 반응 상태
- 스레딩 버그의 경우 Discord 메시지 참조
- Slack 버그의 경우 Slack 스레드 ts 및 반응 API 상태
- 이메일 버그의 경우 이메일 메시지 ID 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상인 경우 브라우저 스크린샷

비전 검사는 추가적이어야 합니다. 플랫폼 API로 버그를 증명할 수 있다면 API를 통과/실패 오라클로 사용하고 스크린샷은 사람이 확인하기 위한 신뢰 자료로 유지하세요.

## 공급자 확장

Discord 이후 동일한 실행기는 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용한 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 사용 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답장 관계, 재시작 후 재개.

각 전송에는 저렴한 스모크 시나리오 하나와 하나 이상의 버그 클래스 시나리오가 있어야 합니다. 비용이 큰 시각적 시나리오는 선택 사항으로 유지해야 합니다.

## 미해결 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇이 드라이버가 되고 어떤 봇이 SUT가 되어야 하나요?
- 관찰자 브라우저 로그인은 첫 단계에서 사람 Discord 계정, 테스트 계정 또는 봇이 읽을 수 있는 REST 증거만 사용해야 하나요?
- GitHub는 PR용 Mantis 아티팩트를 얼마나 오래 보존해야 하나요?
- ClawSweeper는 언제 유지 관리자 명령을 기다리지 않고 Mantis를 자동으로 권장해야 하나요?
- 공개 PR에 업로드하기 전에 스크린샷을 삭제 처리하거나 잘라내야 하나요?
