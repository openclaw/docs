---
read_when:
    - OpenClaw 버그에 대한 실시간 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 변경 전후 검증 추가하기
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 후보 ref에 대해 범위를 좁힌 Control UI 브라우저 검증 실행하기
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 실시간 전송 방식 비교를 위한 시각적 엔드투엔드 증거와 후보만을 대상으로 한 집중적인 브라우저 증명을 캡처한 다음, 해당 아티팩트를 PR에 첨부합니다.
title: Mantis
x-i18n:
    generated_at: "2026-07-12T15:07:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 OpenClaw 동작에 대한 시각적 CI 증거와 PR 댓글을 게시합니다.
라이브 전송 시나리오는 알려진 문제 기준선과 후보 ref를 비교하며,
집중형 브라우저 레인은 대신 결정론적으로 모킹된 전송을 기준으로 하나의 후보를
검증할 수 있습니다. Discord는 실제 봇 인증, 길드 채널, 반응, 스레드 및 브라우저
증인을 지원하는 형태로 가장 먼저 출시되었습니다. Slack, Telegram 및 집중형 Control
UI 채팅 레인도 있으며, WhatsApp과 Matrix는 구현되지 않았습니다.

## 소유권

- OpenClaw (`extensions/qa-lab/src/mantis/*`): 시나리오 런타임, `pnpm openclaw qa mantis <command>` CLI, 증거 스키마.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): 라이브 전송 하네스, 드라이버/SUT 봇, 보고서/증거 작성기.
- Crabbox (`openclaw/crabbox`): 준비된 Linux 머신, 임대, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): 원격 진입점, 아티팩트 보존.
- ClawSweeper: 유지관리자 PR 명령을 파싱하고, 워크플로를 디스패치하며, 최종 PR 댓글을 게시합니다.

## CLI 명령

모든 명령은 `extensions/qa-lab/src/mantis/cli.ts`에 정의된
`pnpm openclaw qa mantis <command>` 형식입니다. 빌드/실행 시
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`이 필요합니다(번들 워크플로는 빌드 전에
`OPENCLAW_BUILD_PRIVATE_QA=1`과 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`을 설정합니다).

| 명령                            | 용도                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord 봇이 길드/채널을 확인하고, 게시하고, 반응을 추가할 수 있는지 검증합니다.                                                                    |
| `run`                           | 기준선 및 후보 ref를 대상으로 전/후 시나리오를 실행합니다(Discord만 해당).                                                                                |
| `desktop-browser-smoke`         | Crabbox 데스크톱을 임대/재사용하고, 표시되는 브라우저를 열어 스크린샷과 동영상을 캡처합니다.                                                               |
| `slack-desktop-smoke`           | Crabbox 데스크톱을 임대/재사용하고, 그 안에서 Slack QA를 실행하고, Slack Web을 열어 증거를 캡처합니다.                                                     |
| `telegram-desktop-builder`      | Crabbox 데스크톱을 임대/재사용하고, Telegram Desktop을 설치하며, 선택적으로 OpenClaw Gateway를 구성합니다.                                                 |
| `visual-task` / `visual-driver` | 선택적인 이미지 이해 어설션을 포함하는 범용 Crabbox 데스크톱 캡처입니다. `visual-driver`는 `crabbox record --while` 아래에서 실행되는 드라이버 측 절반입니다. |

모든 명령은 `--repo-root <path>`와 `--output-dir <path>`를 허용합니다. Crabbox
명령은 `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl`, `--keep-lease`도 허용합니다. 별도 설명이
없으면 로컬 CLI의 제공자/클래스 기본값은 `hetzner`/`beast`이며, CI 워크플로는
일반적으로 둘 다 재정의합니다.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Discord REST API(`https://discord.com/api/v10`)를 호출하여 봇 사용자, 길드,
길드의 채널 및 대상 채널을 가져오고, 채널이 해당 길드에 속하는지 확인한 다음,
`--skip-post`가 지정되지 않으면 메시지를 게시하고 `👀` 반응을 추가합니다.
`mantis-discord-smoke-summary.json`과 `mantis-discord-smoke-report.md`를 작성합니다.

토큰 확인 순서는 `--token-file` 값, `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(`--token-env`로 재정의), `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`이 지정한
파일(`--token-file-env`로 재정의) 순입니다. 길드/채널 ID는
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`에서 가져오며
(`--guild-id` / `--channel-id`로 재정의), 17-20자리 Discord 스노우플레이크여야
합니다. 게시된 요약과 보고서에서 봇/길드/채널/메시지 ID 및 이름을
`<redacted>`로 대체하려면 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 설정합니다.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

현재 `--transport`는 `discord`만 허용합니다. `--scenario`는 두 가지 내장 ID 중
하나이며, 각각 고유한 기본 기준선 ref와 예상 전/후 레이블이 있습니다
(`extensions/qa-lab/src/mantis/run.runtime.ts`).

| 시나리오                                   | 기본 기준선                                 | 기준선 예상 결과                          | 후보 예상 결과                |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 스레드 답글에서 `filePath` 첨부 파일 누락 | 스레드 답글에 첨부 파일 포함 |

`--candidate`의 기본값은 `HEAD`입니다. 기타 플래그: `--credential-source`
(기본값 `convex`), `--credential-role`(기본값 `ci`), `--provider-mode`
(기본값 `live-frontier`), `--fast`(기본적으로 활성화), `--skip-install`, `--skip-build`.

러너는 `<output-dir>/worktrees/` 아래에 기준선 및 후보용 분리된 `git worktree`
체크아웃을 생성하고, 각각에서 `pnpm install`/`pnpm build`를 실행한 다음
(건너뛰도록 지정하지 않은 경우), 각 worktree를 대상으로
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
를 실행합니다. 각 레인은 `discord-qa-reaction-timelines.json`과
`<scenario-id>-timeline.html`/`.png` 쌍을 작성합니다. 러너는 이 증거를
`baseline/`/`candidate/` 아래로 다시 복사하고, 출력 디렉터리에
`comparison.json`, `mantis-report.md`, `mantis-evidence.json`을 작성하며,
비교가 통과하지 않은 경우(기준선 `fail`, 후보 `pass`가 아닌 경우) 0이 아닌
종료 코드로 종료합니다.

두 번째 Discord 시나리오(`discord-thread-reply-filepath-attachment`)는 드라이버
봇으로 상위 메시지를 게시하고, 실제 스레드를 생성하고, 저장소 로컬 `filePath`를
사용하여 SUT의 `message.thread-reply` 작업을 호출한 다음, 답글과 첨부 파일 이름을
확인할 때까지 스레드를 폴링합니다. `mantis-thread-report.md`라는 첨부 파일을
예상합니다.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Crabbox 데스크톱을 임대하거나 재사용하고, VNC 세션 안에서 `--browser-url`
(기본값 `https://openclaw.ai`) 또는 렌더링된 `--html-file`을 가리키는
브라우저를 실행하고, 대기한 후 `scrot`으로 스크린샷을 촬영하며, 선택적으로
`ffmpeg`로 MP4를 녹화하고, `desktop-browser-smoke.png` / `.mp4` /
`remote-metadata.json`을 `--output-dir`로 다시 rsync합니다.

플래그:

- `--lease-id <cbx_...>`는 새 데스크톱을 생성하는 대신 준비된 데스크톱을 재사용합니다.
- `--browser-profile-dir <remote-path>`는 원격 Chrome user-data-dir을 재사용하여 영구 데스크톱이 실행 사이에도 로그인 상태를 유지하도록 합니다(장기 실행 Discord Web 뷰어 프로필에 사용).
- `--browser-profile-archive-env <name>`은 실행 전에 해당 환경 변수에서 base64 `.tgz` Chrome 프로필 아카이브를 복원합니다(기본값 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`). Discord Web 같은 로그인된 증인에 사용합니다.
- `--video-duration <seconds>`는 MP4 캡처 길이를 제어합니다(기본값 10초).
- `--keep-lease`(또는 `OPENCLAW_MANTIS_KEEP_VM=1`)는 이번 실행에서 생성한 임대를 VNC 검사에 사용할 수 있도록 열린 상태로 유지합니다. 임대를 생성한 실행이 실패한 경우에도 기본적으로 해당 임대를 유지합니다.

Discord Web 증거의 경우 Mantis는 봇 토큰이 아닌 전용 뷰어 계정을 사용합니다.
Discord REST 오라클(`qa discord`를 통해)은 계속 권위 있는 기준으로 유지됩니다.
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`이 설정되면 시나리오는 Discord Web
URL 아티팩트도 작성하고, `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`은 브라우저가
스레드를 열 수 있을 만큼 충분히 오래 스레드를 열린 상태로 둡니다.

GitHub 워크플로는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`을 통한 영구 뷰어
프로필을 선호합니다(전체 프로필 아카이브는 GitHub의 시크릿 크기 제한을 초과할
수 있음). 소형/부트스트랩 프로필의 경우 대신
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`에서 base64 `.tgz`를 복원할 수
있습니다. 어느 소스도 구성하지 않은 경우에도 워크플로는 결정론적인 기준선/후보
스크린샷을 게시하고, 로그인된 증인을 건너뛰었다고 기록합니다.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Crabbox 데스크톱을 임대하거나 재사용하고, 체크아웃을 VM으로 동기화하고, 그 안에서
`pnpm openclaw qa slack`을 실행하고, VNC 브라우저에서 Slack Web을 열고,
데스크톱을 캡처한 다음 Slack QA 아티팩트(`slack-qa/`)와 VNC 스크린샷/동영상을
모두 로컬로 복사합니다. 이는 SUT Gateway와 브라우저가 모두 같은 VM 안에서
실행되는 유일한 Mantis 형태입니다.

`--gateway-setup`을 사용하면 이 명령은 VM의
`$HOME/.openclaw-mantis/slack-openclaw`에 영구적인 일회용 OpenClaw 홈을
생성하고, 대상 채널용 Slack Socket Mode 구성을 패치하고,
`openclaw gateway run --dev --allow-unconfigured --port 38973`을 시작하며,
VNC 세션에서 Chrome을 실행 상태로 둡니다. `--gateway-setup`을 생략하면 일반적인
봇 간 Slack QA 레인을 대신 실행합니다.

`--credential-source env`에 필요한 환경 변수입니다(로컬 기본값은 `env`, 역할
기본값은 `maintainer`).

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 원격 모델 레인용 `OPENCLAW_LIVE_OPENAI_KEY`(로컬에 `OPENAI_API_KEY`만
  설정된 경우 Mantis는 Crabbox를 호출하기 전에 이를
  `OPENCLAW_LIVE_OPENAI_KEY`로 복사합니다)

`--credential-source convex`를 사용하면 Mantis는 VM을 생성하기 전에 공유
풀에서 Slack SUT 자격 증명을 임대하고, 채널 ID, 앱 토큰 및 봇 토큰을
`OPENCLAW_MANTIS_SLACK_*` 환경 변수로 VM에 전달합니다. 따라서 GitHub
워크플로에는 원시 Slack 토큰이 아닌 Convex 브로커 시크릿만 필요합니다.

기타 플래그: `--slack-url <url>`은 특정 URL을 엽니다(그렇지 않으면 Mantis가
`auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 파생함).
`--slack-channel-id <id>`는 Gateway 허용 목록 채널을 설정합니다.
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`은 VM 내부의 영구 Chrome 프로필을
제어합니다(기본값 `$HOME/.config/openclaw-mantis/slack-chrome-profile`).
`--approval-checkpoints`는 네이티브 Slack 승인 시나리오
(`slack-approval-exec-native`, `slack-approval-plugin-native`)를 실행하고
Gateway 설정 대신 대기 중/해결됨 체크포인트 스크린샷을 렌더링합니다
(`--gateway-setup`과 함께 사용할 수 없음). `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack 라이브 레인으로
그대로 전달됩니다.

승인 체크포인트 스크린샷은 라이브 Slack UI가 아니라 시나리오에서 관찰한 Slack
API 메시지로부터 렌더링됩니다. `slack-desktop-smoke.png`는 임대의 브라우저
프로필이 이미 로그인된 경우에만 Slack Web 자체에 대한 증거입니다.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Crabbox 데스크톱을 임대하거나 재사용하고, 네이티브 Linux Telegram Desktop을 설치하며,
선택적으로 사용자 세션 아카이브를 복원하고, 임대한 Telegram SUT 봇 토큰으로
OpenClaw을 구성한 다음
`openclaw gateway run --dev --allow-unconfigured --port 38974`를 시작하고, 임대한 비공개
그룹에 드라이버 봇 준비 완료 메시지를 게시한 후 스크린샷과 MP4를 캡처합니다. 봇 토큰은
OpenClaw만 구성하며, Telegram Desktop에는 절대 로그인하지 않습니다. 데스크톱 뷰어는
`--telegram-profile-archive-env <name>`에서 복원하거나 VNC를 통해 수동으로 로그인하고
`--keep-lease`로 활성 상태를 유지하는 별도의 Telegram 사용자 세션입니다.

플래그: `--lease-id <cbx_...>`는 Telegram Desktop에 이미 로그인된 VM에서 다시 실행합니다.
`--telegram-profile-archive-env <name>`은 실행 전에 base64 `.tgz` 프로필 아카이브를
복원합니다. `--telegram-profile-dir <remote-path>`은 원격 프로필 디렉터리를 설정합니다
(기본값 `$HOME/.local/share/TelegramDesktop`). `--no-gateway-setup`은 Telegram Desktop만
설치하고 엽니다. `--credential-source`/`--credential-role`의 기본값은
`convex`/`maintainer`입니다.

## 증거 매니페스트

PR에 게시하는 모든 시나리오는 보고서 옆에 `mantis-evidence.json`을 작성합니다.

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord 상태 반응 QA",
  "summary": "PR 댓글을 위한 사람이 읽을 수 있는 최상위 요약.",
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
      "label": "기준선 queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "기준선 Discord 타임라인",
      "width": 420
    }
  ]
}
```

아티팩트 `path`는 매니페스트 디렉터리를 기준으로 하며, `targetPath`는 구성된 R2/S3
아티팩트 접두사를 기준으로 합니다. `scripts/mantis/publish-pr-evidence.mjs`는 경로 순회를
거부하고 파일이 없을 때 `"required": false`인 항목을 건너뜁니다.

아티팩트 종류: `timeline`(결정론적 전후 스크린샷),
`desktopScreenshot`(VNC/브라우저 스크린샷), `motionPreview`(녹화에서 생성한 인라인 애니메이션
GIF), `motionClip`(동작 구간만 남긴 MP4), `fullVideo`(전체 녹화),
`metadata`(JSON/로그 사이드카), `report`(Markdown 보고서).

실행의 디스크 내 아티팩트 레이아웃:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

스크린샷은 비밀이 아니라 증거이지만, 여전히 철저한 정보 가림이 필요합니다.
비공개 채널 이름, 사용자 이름 또는 메시지 내용이 나타날 수 있습니다. 공개 아티팩트
업로드에는 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 설정하십시오. Discord/Slack/Telegram
GitHub 워크플로에서는 기본적으로 활성화되어 있습니다.

## GitHub 자동화

`scripts/mantis/publish-pr-evidence.mjs`는 재사용 가능한 게시 도구입니다. 워크플로는
매니페스트, 대상 PR, 아티팩트 대상 루트, 댓글 마커, 아티팩트 URL, 실행 URL 및 요청
소스를 지정하여 이를 호출합니다. 선언된 아티팩트를 Mantis R2 버킷에 업로드하고,
인라인 이미지/미리보기 및 링크된 동영상이 포함된 요약 우선 PR 댓글을 작성한 다음,
기존 마커 댓글을 업데이트하거나 새 댓글을 생성합니다. 필수 환경 변수:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`(워크플로에서 `openclaw-crabbox-artifacts`로 설정)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`(워크플로에서 `auto`로 설정)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`(워크플로에서 `https://artifacts.openclaw.ai`로 설정)

댓글은 `github-actions[bot]`이 아니라 Mantis GitHub App
(`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`)을 통해 게시되며, 숨겨진
마커 댓글을 업서트 키로 사용합니다.

| 워크플로                          | 트리거                                                                                    | 수행 작업                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 수동 디스패치                                                                            | 선택한 ref를 대상으로 `discord-smoke`를 실행합니다.                                                                                                                                                                                                                                                            |
| `Mantis Discord Status Reactions` | PR 댓글 또는 수동 디스패치                                                              | 기준선/후보 작업 트리를 별도로 빌드하고 각각에서 `discord-status-reactions-tool-only`를 실행하며, Crabbox 데스크톱 브라우저에서 각 레인의 타임라인을 렌더링하고, `crabbox media preview`로 동작 구간만 남긴 GIF/MP4 미리보기를 생성하며, 아티팩트를 업로드하고, 인라인 PR 증거를 게시합니다.                                 |
| `Mantis Scenario`                 | 수동 디스패치                                                                            | 범용 디스패처: `scenario_id`(`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number`를 받아 일치하는 시나리오 워크플로로 전달합니다. |
| `Mantis Slack Desktop Smoke`      | 수동 디스패치                                                                            | Crabbox Linux 데스크톱을 임대하고(기본값 `aws`, `hetzner` 선택 가능), 후보를 대상으로 `slack-desktop-smoke --gateway-setup`을 실행하고, 데스크톱을 녹화하고, 동작 미리보기를 생성하고, 아티팩트를 업로드하며, PR 번호가 지정된 경우 PR 증거를 게시합니다.                                                      |
| `Mantis Telegram Live`            | PR 댓글 또는 수동 디스패치                                                              | 봇 API Telegram 라이브 QA 레인(`openclaw qa telegram`)을 실행하고, QA 요약에서 `mantis-evidence.json`을 작성하고, Crabbox 데스크톱 브라우저를 통해 정보가 가려진 증거 HTML을 렌더링하고, 동작 GIF를 생성하고, PR 증거를 게시합니다. 이 레인에는 Telegram Web 로그인이 필요하지 않습니다.                               |
| `Mantis Telegram Desktop Proof`   | 관리자 PR 레이블(`mantis: telegram-visible-proof`)과 PR 댓글 또는 수동 디스패치 | 에이전트 기반 네이티브 Telegram Desktop 전후 증거입니다. PR, 기준선/후보 ref 및 관리자 지침을 Codex에 전달하면 Codex가 두 ref 모두에 대해 실제 사용자 Crabbox Telegram Desktop 증거 레인을 실행하고 2열 PR 증거 표를 게시합니다.                                                              |
| `Mantis Web UI Chat Proof`        | PR 댓글 또는 수동 디스패치                                                              | 후보를 대상으로 집중된 OpenClaw Control UI 채팅 Playwright 증거를 실행하고, 브라우저가 모의 Gateway를 통해 전송하는지 확인하고, 스크린샷/동영상 아티팩트를 캡처하고, PR 증거를 게시합니다. 이 레인은 웹 채팅 전용 증거이며 WinUI/네이티브 앱 또는 임의의 시각적 증거가 아닙니다.                           |

`Mantis Discord Status Reactions`와 `Mantis Telegram Live`는 모두
`baseline_ref`/`candidate_ref`(또는 PR 댓글의 `baseline=`/`candidate=`)를 허용하며,
비밀이 포함된 자격 증명으로 실행하기 전에 확인된 SHA가 `origin/main`의 조상이거나,
릴리스 태그(`v*`)이거나, 열려 있는 PR의 head인지 검증합니다.

쓰기/유지 관리/관리자 액세스 권한이 있는 PR의 댓글 트리거:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 댓글 트리거는 기본적으로 PR head SHA를 후보로,
`telegram-status-command`를 시나리오로 사용합니다. 특정 Crabbox 공급자 또는 미리
워밍업된 데스크톱을 대상으로 지정하기 위해 `provider=aws|hetzner`와
`lease=<cbx_...>`를 허용합니다. `Mantis Telegram Desktop Proof`는 PR에 이미
`mantis: telegram-visible-proof` 레이블이 있는 경우에만 PR 댓글에 응답합니다.

Web UI 채팅 댓글 트리거는 기본적으로 PR head SHA를 후보로 사용합니다. Control UI
모의 Gateway 채팅 증거를 실행하고 브라우저 아티팩트를 게시합니다. 다른 웹 페이지와
네이티브 앱 화면에는 일반 Playwright/브라우저 증거, 관리자 스크린샷, Crabbox 또는
로컬 아티팩트를 사용하십시오.

ClawSweeper도 시나리오를 직접 디스패치할 수 있습니다.

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 머신과 비밀

로컬 CLI Crabbox 기본값은 `--provider hetzner --class beast`입니다.
`--provider`, `--class`/`--machine-class` 또는
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`로
재정의할 수 있습니다. GitHub 워크플로는 흔히 둘 다 재정의합니다(예:
`--class standard`, Slack 워크플로의 `aws`/`hetzner` 공급자 선택 입력).
공급자가 너무 느리거나 사용할 수 없는 경우 폴백을 하드코딩하지 말고 동일한 Crabbox
인터페이스 뒤에 추가하십시오.

VM 기준 환경: 데스크톱을 지원하는 Chrome/Chromium, CDP 액세스, VNC/
noVNC, Node 22+ 및 pnpm, OpenClaw 체크아웃, 그리고 대상 전송 수단, GitHub, 모델
공급자 및 자격 증명 브로커에 대한 아웃바운드 액세스를 갖춘 Linux입니다.

Mantis 워크플로 전반에서 사용하는 비밀 이름:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 공개 아티팩트 업로드용 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`(워크플로는
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN`도 폴백으로 허용하며,
  Crabbox를 호출하기 전에 일반 이름으로 매핑합니다)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 실행기는 Discord/Slack/Telegram 봇 토큰, 공급자 API 키, 브라우저 쿠키,
인증 프로필 내용, VNC 비밀번호 또는 원시 자격 증명 페이로드를 절대 출력해서는 안 됩니다.
토큰이 이슈, PR, 채팅 또는 로그에 유출되면 대체 비밀을 저장한 후 토큰을 교체하십시오.

## 실행 결과

전후 전송 시나리오는 불안정한 환경이 제품 회귀로 해석되지 않도록 다음 결과를
구분합니다.

- **버그 재현됨**: 기준선이 시나리오에서 예상한 방식으로 실패했습니다.
- **하네스 실패**: 오라클이 의미를 갖기 전에 환경 설정, 자격 증명, 전송 API, 브라우저
  또는 공급자가 실패했습니다.

후보 전용 브라우저 증거는 후보가 모의 Gateway 및 표시되는 UI 어설션을 통과했는지
보고하며, 기준선 재현을 주장하지 않습니다.

## 시나리오 추가

라이브 전송 시나리오는 독립 실행형 선언 파일 형식이 아니라 전송 수단별로
TypeScript에서 정의됩니다(Discord 전후 구조는
`extensions/qa-lab/src/mantis/run.runtime.ts`의 `MANTIS_SCENARIO_CONFIGS` 참조).
각 시나리오에는 ID와 제목, 전송 수단, 필수 자격 증명, 기준선 ref 정책, 후보 ref 정책,
OpenClaw 구성 패치, 설정/자극 단계, 예상 기준선 및 후보 오라클, 시각적 캡처 대상,
시간 초과 예산 및 정리 단계가 필요합니다.

전용의 결정론적 E2E 테스트와 워크플로를 사용하여 후보만을 대상으로 하는 집중적인 브라우저 검증을 수행할 수 있습니다.
범위를 명시적으로 유지하고, 실행 전에 후보 ref를 검증하며, 보안 비밀 정보가 필요한 게시 작업을 격리하고, 동일한 증거 매니페스트 계약을 출력하십시오.

비전 검사보다 작고 타입이 지정된 오라클을 선호하십시오. 예를 들면 Discord 반응 상태 또는
메시지 참조, Slack 스레드 `ts`/반응 API 상태, 이메일 메시지 ID와
헤더가 있습니다. UI가 유일하게 신뢰할 수 있는 관찰 대상일 때는 브라우저 스크린샷을 사용하고,
플랫폼 API 오라클이 있는 경우 비전 검사는 이를 보완하는 방식으로 유지하십시오.

Discord, Slack, Telegram 이후에는 동일한 실행기 형태를 WhatsApp
(QR 로그인, 재식별, 전달, 미디어, 반응)과 Matrix
(암호화된 방, 스레드/답글 관계, 재시작 후 재개)로 확장할 수 있지만, 둘 다
아직 구현되지 않았습니다.

## 미해결 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇을 드라이버로 사용하고 어떤 봇을 SUT로 사용해야 합니까?
- GitHub는 PR의 Mantis 아티팩트를 얼마나 오래 보관해야 합니까?
- ClawSweeper는 언제 유지관리자 명령을 기다리지 않고 Mantis 시나리오를 자동으로 권장해야 합니까?
- 공개 PR에 업로드하기 전에 스크린샷을 수정하거나 잘라내야 합니까?
