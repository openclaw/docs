---
read_when:
    - OpenClaw 버그를 위한 라이브 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 대한 사전 및 사후 검증 추가
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가하기
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 라이브 전송에서 OpenClaw 버그를 재현하고, 수정 전후 증거를 캡처하며, 아티팩트를 PR에 첨부하기 위한 시각적 엔드투엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-06-27T17:23:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 트랜스포트, 그리고 눈에 보이는 증거가 필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진 나쁜 ref를 대상으로 시나리오를 실행해 증거를 캡처하고, 후보 ref에 같은 시나리오를 실행한 뒤, 메인테이너가 PR 또는 로컬 명령에서 검사할 수 있는 아티팩트로 비교 결과를 게시합니다.

Mantis는 Discord에서 시작합니다. Discord는 실제 봇 인증, 실제 길드 채널, 반응, 스레드, 네이티브 명령, 그리고 사람이 트랜스포트에 표시된 내용을 시각적으로 확인할 수 있는 브라우저 UI라는 가치가 높은 첫 번째 레인을 제공하기 때문입니다.

## 목표

- GitHub 이슈 또는 PR의 버그를 사용자가 보는 것과 같은 트랜스포트 형태로 재현합니다.
- 수정 적용 전 기준 ref에서 **이전** 아티팩트를 캡처합니다.
- 수정 적용 후 후보 ref에서 **이후** 아티팩트를 캡처합니다.
- 가능하면 Discord REST 반응 읽기 또는 채널 트랜스크립트 확인 같은 결정적 오라클을 사용합니다.
- 버그에 보이는 UI 표면이 있을 때 스크린샷을 캡처합니다.
- 에이전트가 제어하는 CLI에서 로컬로, GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화 또는 제공자 인증이 막힐 때 VNC 구조에 충분한 머신 상태를 보존합니다.
- 실행이 차단되었거나, 수동 VNC 도움이 필요하거나, 완료되었을 때 운영자 Discord 채널에 간결한 상태를 게시합니다.

## 비목표

- Mantis는 단위 테스트를 대체하지 않습니다. Mantis 실행은 보통 수정이 이해된 뒤 더 작은 회귀 테스트가 되어야 합니다.
- Mantis는 일반적인 빠른 CI 게이트가 아닙니다. 더 느리고, 라이브 자격 증명을 사용하며, 라이브 환경이 중요한 버그에 한해 사용됩니다.
- Mantis는 정상 동작에 사람을 요구해서는 안 됩니다. 수동 VNC는 구조 경로이지 정상 경로가 아닙니다.
- Mantis는 원시 비밀 값을 아티팩트, 로그, 스크린샷, Markdown 보고서 또는 PR 댓글에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA 스택에 있습니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 시나리오 런타임, 트랜스포트 어댑터, 증거 스키마, 로컬 CLI를 소유합니다.
- QA Lab은 라이브 트랜스포트 하네스 조각, 브라우저 캡처 헬퍼, 아티팩트 작성기를 소유합니다.
- Crabbox는 원격 VM이 필요할 때 예열된 Linux 머신을 소유합니다.
- GitHub Actions는 원격 워크플로 진입점과 아티팩트 보존을 소유합니다.
- ClawSweeper는 GitHub 댓글 라우팅을 소유합니다. 메인테이너 명령 파싱, 워크플로 디스패치, 최종 PR 댓글 게시가 여기에 포함됩니다.
- OpenClaw 에이전트는 시나리오에 에이전트식 설정, 디버깅 또는 막힌 상태 보고가 필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 트랜스포트 지식을 OpenClaw에, 머신 스케줄링을 Crabbox에, 메인테이너 워크플로 연결 코드를 ClawSweeper에 유지합니다.

## 명령 형태

첫 번째 로컬 명령은 Discord 봇, 길드, 채널, 메시지 전송, 반응 전송, 아티팩트 경로를 검증합니다.

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

로컬 이전 및 이후 러너는 다음 형태를 받습니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

러너는 출력 디렉터리 아래에 분리된 기준 및 후보 워크트리를 만들고, 의존성을 설치하며, 각 ref를 빌드하고, `--allow-failures`로 시나리오를 실행한 다음 `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 씁니다. 첫 번째 Discord 시나리오에서 성공적인 검증은 기준 상태가 `fail`이고 후보 상태가 `pass`임을 뜻합니다.

두 번째 Discord 이전/이후 프로브는 스레드 첨부 파일을 대상으로 합니다.

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

이 시나리오는 드라이버 봇으로 부모 메시지를 게시하고, 실제 Discord 스레드를 만들고, repo 로컬 `filePath`로 OpenClaw의 `message.thread-reply` 액션을 호출한 다음, 스레드에서 SUT 응답과 첨부 파일 이름을 폴링합니다. 기준 스크린샷은 첨부 파일이 없는 응답을 보여주고, 후보 스크린샷은 예상되는 `mantis-thread-report.md` 첨부 파일을 보여줍니다.

첫 번째 VM/브라우저 기본 요소는 데스크톱 스모크입니다.

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

이 명령은 Crabbox 데스크톱 머신을 임대하거나 재사용하고, VNC 세션 안에서 보이는 브라우저를 시작하고, 데스크톱을 캡처하고, 아티팩트를 로컬 출력 디렉터리로 가져오며, 보고서에 재연결 명령을 씁니다. 이 명령은 기본적으로 Hetzner 제공자를 사용합니다. Mantis 레인에서 작동하는 데스크톱/VNC 커버리지를 가진 첫 번째 제공자이기 때문입니다. 다른 Crabbox 플릿에서 실행할 때는 `--provider`, `--crabbox-bin` 또는 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`로 재정의하세요.

유용한 데스크톱 스모크 플래그:

- `--lease-id <cbx_...>` 또는 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`는 예열된 데스크톱을 재사용합니다.
- `--browser-url <url>`은 보이는 브라우저에서 열 페이지를 변경합니다.
- `--html-file <path>`는 보이는 브라우저에서 repo 로컬 HTML 아티팩트를 렌더링합니다. Mantis는 이를 사용해 실제 Crabbox 데스크톱을 통해 생성된 Discord 상태-반응 타임라인을 캡처합니다.
- `--browser-profile-dir <remote-path>`는 원격 Chrome user-data-dir을 재사용하여 영구 Mantis 데스크톱이 실행 사이에도 로그인 상태를 유지할 수 있게 합니다. 장기 실행 Discord Web 뷰어 프로필에 사용하세요.
- `--browser-profile-archive-env <name>`은 브라우저를 시작하기 전에 지정된 환경 변수에서 base64 `.tgz` Chrome user-data-dir 아카이브를 복원합니다. Discord Web 같은 로그인된 증인에 사용하세요. 기본 env var는 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`입니다.
- `--video-duration <seconds>`는 MP4 캡처 길이를 제어합니다. 안정화 시간이 필요한 느린 로그인 웹 앱에는 더 긴 시간을 사용하세요.
- `--keep-lease` 또는 `OPENCLAW_MANTIS_KEEP_VM=1`은 새로 생성된 통과 임대를 VNC 검사를 위해 열어 둡니다. 실패한 실행은 임대가 생성된 경우 운영자가 재연결할 수 있도록 기본적으로 임대를 유지합니다.
- `--class`, `--idle-timeout`, `--ttl`은 머신 크기와 임대 수명을 조정합니다.

Discord Web 증거의 경우 Mantis는 봇 토큰 대신 전용 뷰어 계정을 사용합니다. 라이브 Discord API 시나리오는 계속 오라클로 남습니다. 실제 스레드를 만들고, SUT `thread-reply`를 보내며, Discord REST를 통해 첨부 파일을 확인합니다. `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`이 설정되면 시나리오는 Discord Web URL 아티팩트도 씁니다. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`이 설정되면 로그인된 브라우저가 열고 기록할 수 있을 만큼 해당 스레드를 오래 남겨 둡니다.

GitHub 워크플로는 Discord Web에서 후보 스레드 URL을 열고, 스크린샷을 캡처하고, MP4를 녹화하며, Crabbox 미디어 도구를 사용할 수 있을 때 잘라낸 GIF 미리보기를 생성합니다. `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`를 통해 구성된 영구 뷰어 프로필 경로를 권장합니다. 전체 Chrome 프로필 아카이브는 GitHub의 비밀 크기 제한을 초과할 수 있기 때문입니다. 작은/부트스트랩 프로필의 경우 워크플로는 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`에서 base64 `.tgz` 아카이브를 복원할 수도 있습니다. 어느 프로필 소스도 구성되지 않은 경우에도 워크플로는 결정적 기준/후보 첨부 파일 스크린샷을 게시하고, 로그인된 Discord Web 증인을 건너뛰었다는 알림을 기록합니다.

첫 번째 전체 데스크톱 트랜스포트 기본 요소는 Slack 데스크톱 스모크입니다.

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

이 명령은 Crabbox 데스크톱 머신을 임대하거나 재사용하고, 현재 체크아웃을 VM으로 동기화하고, 해당 VM 안에서 `pnpm openclaw qa slack`을 실행하고, VNC 브라우저에서 Slack Web을 열고, 보이는 데스크톱을 캡처하며, Slack QA 아티팩트와 VNC 스크린샷을 모두 로컬 출력 디렉터리로 복사합니다. 이는 SUT OpenClaw Gateway와 브라우저가 둘 다 같은 Linux 데스크톱 VM 안에 있는 첫 번째 Mantis 형태입니다.

`--gateway-setup`을 사용하면 명령은 `$HOME/.openclaw-mantis/slack-openclaw`에 영구적인 폐기 가능 OpenClaw 홈을 준비하고, 선택된 채널의 Slack Socket Mode 구성을 패치하고, 포트 `38973`에서 `openclaw gateway run`을 시작하며, VNC 세션에서 Chrome을 계속 실행합니다. 이는 "Slack과 claw가 실행 중인 Linux 데스크톱을 남겨 달라" 모드입니다. `--gateway-setup`이 생략되면 봇 대 봇 Slack QA 레인이 기본값으로 유지됩니다.

`--credential-source env`에 필요한 입력:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 원격 모델 레인을 위한 `OPENCLAW_LIVE_OPENAI_KEY`. 로컬에 `OPENAI_API_KEY`만 설정된 경우 Mantis는 Crabbox를 호출하기 전에 이를 `OPENCLAW_LIVE_OPENAI_KEY`로 매핑하여 Crabbox의 `OPENCLAW_*` env 전달이 VM 안으로 가져갈 수 있게 합니다.

`--gateway-setup --credential-source convex`를 사용하면 Mantis는 VM을 만들기 전에 공유 풀에서 Slack SUT 자격 증명을 임대하고, 임대된 채널 id, Socket Mode 앱 토큰, 봇 토큰을 데스크톱 내부의 `OPENCLAW_MANTIS_SLACK_*` 런타임 env로 전달합니다. 이렇게 하면 GitHub 워크플로가 얇게 유지됩니다. 원시 Slack 봇 또는 앱 토큰이 아니라 Convex 브로커 비밀만 필요합니다.

유용한 Slack 데스크톱 플래그:

- `--lease-id <cbx_...>`는 운영자가 이미 VNC를 통해 Slack Web에 로그인한 머신을 대상으로 다시 실행합니다.
- `--gateway-setup`은 봇 대 봇 QA 레인만 실행하는 대신 VM 안에서 영구 OpenClaw Slack Gateway를 시작합니다.
- `--keep-lease`는 성공 후 VNC 검사를 위해 Gateway VM을 열어 둡니다. `--no-keep-lease`는 아티팩트 수집 후 이를 중지합니다.
- `--slack-url <url>`은 특정 Slack Web URL을 엽니다. 없으면 SUT 봇 토큰을 사용할 수 있을 때 Mantis가 Slack `auth.test`에서 `https://app.slack.com/client/<team>/<channel>`을 도출합니다.
- `--slack-channel-id <id>`는 Gateway 설정에서 사용하는 Slack 채널 허용 목록을 제어합니다.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`는 VM 내부의 영구 Chrome 프로필을 제어합니다. 기본값은 `$HOME/.config/openclaw-mantis/slack-chrome-profile`이므로 수동 Slack Web 로그인은 같은 임대에서 다시 실행해도 유지됩니다.
- `--credential-source convex --credential-role ci`는 직접 Slack env 토큰 대신 공유 자격 증명 풀을 사용합니다.
- `--provider-mode`, `--model`, `--alt-model`, `--fast`는 Slack 라이브 레인으로 전달됩니다.

승인 체크포인트 실행은 CI에 안전한 시각적 증거를 위해 Slack API 메시지 스냅샷을 체크포인트 PNG로 렌더링합니다. `slack-desktop-smoke.png`는 임대가 이미 로그인된 따뜻한 브라우저 프로필을 사용할 때만 Slack Web의 증거입니다.

GitHub 스모크 워크플로는 `Mantis Discord Smoke`입니다. 첫 번째 실제 시나리오의 이전 및 이후 GitHub 워크플로는 `Mantis Discord Status Reactions`입니다. 이 워크플로는 다음을 받습니다.

- `baseline_ref`: queued-only 동작을 재현할 것으로 예상되는 ref입니다.
- `candidate_ref`: `queued -> thinking -> done`을 보여줄 것으로 예상되는 ref입니다.

이 워크플로는 워크플로 하네스 ref를 체크아웃하고, 별도의 기준 및 후보 워크트리를 빌드하고, 각 워크트리에 대해 `discord-status-reactions-tool-only`를 실행하며, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 Actions 아티팩트로 업로드합니다. 또한 Crabbox 데스크톱 브라우저에서 각 레인의 타임라인 HTML을 렌더링하고, 해당 VNC 스크린샷을 결정적 타임라인 PNG와 함께 PR 댓글에 게시합니다. 같은 PR 댓글은 `crabbox media preview`로 생성된 가벼운 모션 트리밍 GIF 미리보기를 임베드하고, 일치하는 모션 트리밍 MP4 클립으로 연결하며, 심층 검사를 위해 전체 데스크톱 MP4 파일을 유지합니다. 빠른 검토를 위해 스크린샷은 인라인으로 유지됩니다. 이 워크플로는 다음 Crabbox 바이너리 릴리스가 만들어지기 전에 현재 데스크톱/브라우저 임대 플래그를 사용할 수 있도록 `openclaw/crabbox` main에서 Crabbox CLI를 빌드합니다.

`Mantis Scenario`는 범용 수동 진입점입니다. `scenario_id`,
`candidate_ref`, 선택적 `baseline_ref`, 선택적 `pr_number`를 받은 다음
시나리오 소유 워크플로로 디스패치합니다. 래퍼는 의도적으로 얇게 유지됩니다.
시나리오 워크플로는 여전히 자체 전송 설정, 자격 증명, VM 클래스,
예상 오라클, 아티팩트 매니페스트를 소유합니다.

`Mantis Slack Desktop Smoke`는 첫 번째 Slack VM 워크플로입니다. 별도
워크트리에서 신뢰된 후보 ref를 체크아웃하고, Crabbox Linux 데스크톱을
임대하며, 해당 후보에 대해 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`을
실행하고, VNC 브라우저에서 Slack Web을 열고, 데스크톱을 녹화하고,
`crabbox media preview`로 움직임 기준으로 잘린 미리보기를 생성하고, 전체
아티팩트 디렉터리를 업로드하며, 선택적으로 대상 PR에 인라인 증거 댓글을
게시합니다. 데스크톱 임대는 기본적으로 AWS를 사용하며, AWS 용량이 느리거나
사용할 수 없을 때 운영자가 Hetzner로 전환할 수 있도록 수동 공급자 입력을
노출합니다. 봇 간 Slack 대화 기록만이 아니라 "Slack과 실행 중인 claw가
있는 Linux 데스크톱"을 원할 때 이 레인을 사용하세요.

`Mantis Telegram Live`는 기존 Telegram 라이브 QA 레인을 동일한 PR 증거
파이프라인으로 감쌉니다. 별도 워크트리에서 신뢰된 후보 ref를 체크아웃하고,
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`를 실행하며, Telegram QA 요약, `qa-evidence.json`,
보고서 아티팩트에서 `mantis-evidence.json` 매니페스트를 작성하고, Crabbox
데스크톱 브라우저를 통해 수정된 증거 HTML을 렌더링하고, `crabbox media preview`로
움직임 기준으로 잘린 GIF를 생성하며, PR 번호를 사용할 수 있으면 인라인 PR
증거 댓글을 게시합니다. 이 레인은 로그인된 Telegram Web 증명이 아니라
QA 증거 시각화입니다. Telegram Bot API는 안정적인 라이브 메시지 증거를
제공하지만, 일반적인 Mantis 자동화에는 Telegram Web 로그인 상태가 필요하지
않습니다.

`Mantis Telegram Desktop Proof`는 에이전트형 네이티브 Telegram Desktop
전후 래퍼입니다. 유지 관리자는 PR 댓글의 `@openclaw-mantis telegram desktop proof`,
자유 형식 지침을 포함한 Actions UI, 또는 범용 `Mantis Scenario` 디스패처를
통해 이를 트리거할 수 있습니다. 워크플로는 PR, 기준 ref, 후보 ref, 유지
관리자 지침을 Codex에 전달합니다. 에이전트는 PR을 읽고, 변경을 증명하는
Telegram 표시 동작을 결정하고, 기준 및 후보에 대해 실제 사용자 Crabbox
Telegram Desktop 증명 레인을 실행하고, 네이티브 GIF가 유용해질 때까지
반복하며, 쌍을 이룬 `motionPreview` 아티팩트를 `mantis-evidence.json`에
작성하고, 번들을 업로드하며, PR 번호를 사용할 수 있으면 2열 PR 증거 표를
게시합니다.

휴먼 인 더 루프 Telegram 데스크톱 설정에는 시나리오 빌더를 사용하세요.

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

빌더는 Crabbox 데스크톱을 임대하거나 재사용하고, 네이티브 Linux Telegram
Desktop 바이너리를 설치하고, 선택적으로 사용자 세션 아카이브를 복원하고,
임대된 Telegram SUT 봇 토큰으로 OpenClaw를 구성하고, `38974` 포트에서
`openclaw gateway run`을 시작하고, 임대된 비공개 그룹에 드라이버 봇 준비
메시지를 게시한 다음, 표시되는 VNC 데스크톱에서 스크린샷과 MP4를 캡처합니다.
봇 토큰은 Telegram Desktop에 로그인하지 않습니다. OpenClaw만 구성합니다.
데스크톱 뷰어는 `--telegram-profile-archive-env <name>`에서 복원되거나 VNC를
통해 수동으로 생성되고 `--keep-lease`로 유지되는 별도의 Telegram 사용자
세션입니다.

유용한 Telegram 데스크톱 빌더 플래그:

- `--lease-id <cbx_...>`는 운영자가 이미 Telegram Desktop에 로그인한 VM에 대해 다시 실행합니다.
- `--telegram-profile-archive-env <name>`은 해당 환경 변수에서 base64 `.tgz` Telegram Desktop 프로필 아카이브를 읽고 실행 전에 복원합니다.
- `--telegram-profile-dir <remote-path>`는 원격 Telegram Desktop 프로필 디렉터리를 제어합니다. 기본값은 `$HOME/.local/share/TelegramDesktop`입니다.
- `--no-gateway-setup`은 OpenClaw를 구성하지 않고 Telegram Desktop을 설치하고 엽니다.
- `--credential-source convex --credential-role ci`는 직접 Telegram 환경 토큰 대신 공유 자격 증명 브로커를 사용합니다.

모든 PR 게시 시나리오는 보고서 옆에 `mantis-evidence.json`을 작성합니다.
이 스키마는 시나리오 코드와 GitHub 댓글 사이의 인계 형식입니다.

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

아티팩트 `path` 값은 매니페스트 디렉터리를 기준으로 한 상대 경로입니다.
`targetPath` 값은 구성된 Mantis R2/S3 아티팩트 접두사 아래의 상대 경로입니다.
게시자는 경로 순회를 거부하고, 선택적 미리보기나 비디오를 사용할 수 없을 때
`"required": false`로 표시된 항목을 건너뜁니다.

지원되는 아티팩트 종류:

- `timeline`: 일반적으로 전후 비교에 쓰이는 결정적 시나리오 스크린샷.
- `desktopScreenshot`: VNC/브라우저 데스크톱 스크린샷.
- `motionPreview`: 데스크톱 녹화에서 생성된 인라인 애니메이션 GIF.
- `motionClip`: 정적 시작 부분과 끝부분을 제거한 움직임 기준으로 잘린 MP4.
- `fullVideo`: 심층 검사용 전체 MP4 녹화.
- `metadata`: JSON/로그 사이드카.
- `report`: Markdown 보고서.

재사용 가능한 게시자는 `scripts/mantis/publish-pr-evidence.mjs`입니다. 워크플로는
매니페스트, 대상 PR, 아티팩트 대상 루트, 댓글 마커, Actions 아티팩트 URL,
실행 URL, 요청 소스를 사용해 이를 호출합니다. 게시자는 선언된 아티팩트를
구성된 Mantis R2/S3 버킷에 업로드하고, 인라인 이미지/미리보기 및 연결된
비디오가 포함된 요약 우선 PR 댓글을 만든 다음, 기존 마커 댓글을 업데이트하거나
새로 생성합니다. 워크플로는 `https://artifacts.openclaw.ai` 아래의 공개 URL을
사용해 `openclaw-crabbox-artifacts`에 게시합니다. 버킷, 리전, 공개 URL 값을
직접 제공합니다. 재사용 가능한 게시자에는 다음이 필요합니다.

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

PR 댓글에서 상태 반응 실행을 직접 트리거할 수도 있습니다.

```text
@openclaw-mantis discord status reactions
```

댓글 트리거는 의도적으로 범위가 좁습니다. 쓰기, 유지 관리, 관리자 권한이
있는 사용자의 pull request 댓글에서만 실행되며, Discord 상태 반응 요청만
인식합니다. 기본적으로 알려진 불량 기준 ref와 현재 PR 헤드 SHA를 후보로
사용합니다. 유지 관리자는 어느 ref든 재정의할 수 있습니다.

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 라이브 QA도 PR 댓글에서 트리거할 수 있습니다.

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

기본적으로 현재 PR 헤드 SHA를 후보로 사용하고 `telegram-status-command`를
실행합니다. 특정 ref나 미리 준비된 Crabbox 데스크톱이 필요할 때 유지
관리자는 `candidate=...`, `provider=aws|hetzner`, `lease=<cbx_...>`를 재정의할
수 있습니다.

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이며 시나리오 중심입니다. 두 번째 명령은 나중에 PR
또는 이슈를 라벨, 변경 파일, ClawSweeper 리뷰 결과에서 권장 Mantis
시나리오로 매핑할 수 있습니다.

## 실행 수명 주기

1. 자격 증명을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. 시나리오에 UI 증거가 필요하면 데스크톱/브라우저 프로필을 준비합니다.
4. 기준 ref에 대한 깨끗한 체크아웃을 준비합니다.
5. 의존성을 설치하고 시나리오에 필요한 것만 빌드합니다.
6. 격리된 상태 디렉터리로 자식 OpenClaw Gateway를 시작합니다.
7. 라이브 전송, 공급자, 모델, 브라우저 프로필을 구성합니다.
8. 시나리오를 실행하고 기준 증거를 캡처합니다.
9. Gateway를 중지하고 로그를 보존합니다.
10. 동일한 VM에서 후보 ref를 준비합니다.
11. 동일한 시나리오를 실행하고 후보 증거를 캡처합니다.
12. 오라클 결과와 시각적 증거를 비교합니다.
13. Markdown, JSON, 로그, 스크린샷, 선택적 추적 아티팩트를 작성합니다.
14. GitHub Actions 아티팩트를 업로드합니다.
15. 간결한 PR 또는 Discord 상태 메시지를 게시합니다.

시나리오는 두 가지 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: 기준이 예상된 방식으로 실패했습니다.
- **하네스 실패**: 버그 오라클이 의미를 갖기 전에 환경 설정, 자격 증명, Discord API, 브라우저 또는 공급자가 실패했습니다.

최종 보고서는 유지 관리자가 불안정한 환경을 제품 동작과 혼동하지 않도록
이 사례들을 분리해야 합니다.

## Discord MVP

첫 번째 시나리오는 소스 답장 전달 모드가 `message_tool_only`인 길드 채널의
Discord 상태 반응을 대상으로 해야 합니다.

이것이 좋은 Mantis 시드인 이유:

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

기준 증거는 도구 전용 모드에서 대기열 승인 반응은 있지만 수명 주기 전환은
없음을 보여야 합니다. 후보 증거는 `messages.statusReactions.enabled`가
명시적으로 `true`일 때 수명 주기 상태 반응이 실행됨을 보여야 합니다.

실행 가능한 첫 번째 조각은 옵트인 Discord 라이브 QA 시나리오입니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

이 시나리오는 항상 켜진 길드 처리, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 명시적 상태 반응으로 SUT를 구성합니다.
오라클은 실제 Discord 트리거 메시지를 폴링하고 관찰된 시퀀스
`👀 -> 🤔 -> 👍`를 기대합니다. 아티팩트에는 `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`,
`discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 비공개 QA 스택을 기반으로 해야 합니다.

- `pnpm openclaw qa discord`는 이미 드라이버 및 SUT 봇을 사용하는 라이브 Discord 레인을 실행합니다.
- 라이브 전송 러너는 이미 `.artifacts/qa-e2e/` 아래에 보고서, QA 증거, 전송별 아티팩트를 작성합니다.
- Convex 자격 증명 임대는 이미 공유 라이브 전송 자격 증명에 대한 독점 접근을 제공합니다.
- 브라우저 제어 서비스는 이미 스크린샷, 스냅샷, 헤드리스 관리 프로필, 원격 CDP 프로필을 지원합니다.
- QA Lab에는 이미 전송 형태 테스트를 위한 디버거 UI와 버스가 있습니다.

첫 번째 Mantis 구현은 이러한 구성 요소 위에 얇은 전후 러너와 하나의 시각적
증거 레이어를 더한 형태일 수 있습니다.

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

- 테스트한 ref와 SHA
- 전송 방식 및 시나리오 id
- 머신 공급자와 머신 id 또는 lease id
- 비밀 값이 없는 자격 증명 소스
- baseline 결과
- candidate 결과
- baseline에서 버그가 재현되었는지 여부
- candidate가 이를 수정했는지 여부
- 아티팩트 경로
- 삭제 처리된 설정 또는 정리 문제

스크린샷은 증거이지 비밀이 아닙니다. 그래도 삭제 처리 원칙이 필요합니다.
비공개 채널 이름, 사용자 이름, 또는 메시지 내용이 나타날 수 있습니다. 공개 PR의 경우,
삭제 처리 방식이 더 견고해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를
선호하세요.

## 브라우저 및 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **Headless 자동화**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며,
  Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC 구조**: 로그인, MFA, Discord 자동화 방지, 또는 시각적 디버깅에 사람이 필요할 때
  같은 VM에서 활성화됩니다.

Discord 관찰자 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼 지속되어야 하지만,
개인 브라우저 상태와는 격리되어야 합니다. 프로필은 개발자 노트북이 아니라 Mantis 머신 풀에
속합니다.

Mantis가 멈추면 다음을 포함한 Discord 상태 메시지를 게시합니다.

- run id
- scenario id
- 머신 공급자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 사유 텍스트

첫 비공개 배포에서는 이러한 메시지를 기존 운영자 채널에 게시하고, 이후 전용 Mantis 채널로
이동할 수 있습니다.

## 머신

Mantis는 첫 원격 구현에서 Crabbox를 통한 AWS를 선호해야 합니다.
Crabbox는 예열된 머신, lease 추적, 수화, 로그, 결과, 정리를 제공합니다.
AWS 용량이 너무 느리거나 사용할 수 없으면 같은 머신 인터페이스 뒤에 Hetzner 공급자를
추가하세요.

최소 VM 요구 사항:

- 데스크톱 사용이 가능한 Chrome 또는 Chromium 설치가 있는 Linux
- 브라우저 자동화를 위한 CDP 접근
- 구조용 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 의존성 캐시
- Playwright를 사용할 때 Playwright Chromium 브라우저 캐시
- OpenClaw Gateway 하나, 브라우저 하나, 모델 실행 하나에 충분한 CPU와 메모리
- Discord, GitHub, 모델 공급자, 자격 증명 브로커로의 아웃바운드 접근

VM은 예상된 자격 증명 또는 브라우저 프로필 저장소 외부에 장기 raw 비밀을 보관해서는 안 됩니다.

## 비밀

비밀은 원격 실행의 경우 GitHub 조직 또는 저장소 secrets에, 로컬 실행의 경우 로컬 운영자가
제어하는 비밀 파일에 둡니다.

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

장기적으로 Convex 자격 증명 풀은 live 전송 자격 증명의 일반 소스로 남아야 합니다.
GitHub secrets는 브로커와 fallback 레인을 부트스트랩합니다.
Discord 상태 반응 워크플로는 Mantis Crabbox 비밀을 Crabbox CLI가 기대하는
`CRABBOX_COORDINATOR` 및 `CRABBOX_COORDINATOR_TOKEN` 환경 변수로 다시 매핑합니다.
일반 `CRABBOX_*` GitHub secret 이름은 호환성 fallback으로 계속 허용됩니다.

Mantis runner는 절대로 다음을 출력해서는 안 됩니다.

- Discord bot token
- 공급자 API 키
- 브라우저 쿠키
- auth 프로필 내용
- VNC 비밀번호
- raw 자격 증명 payload

공개 아티팩트 업로드는 bot, guild, channel, message id와 같은 Discord 대상 metadata도
삭제 처리해야 합니다. GitHub smoke 워크플로는 이 이유로
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 issue, PR, chat, 또는 log에 붙여 넣어진 경우 새 secret이 저장된 뒤
이를 회전하세요.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions 아티팩트로 업로드해야 합니다.
워크플로가 버그 보고서 또는 수정 PR에 대해 실행되는 경우, 삭제 처리된 인라인 미디어도
구성된 Mantis R2/S3 버킷에 게시하고, 해당 버그 또는 수정 PR에 before/after 스크린샷이
포함된 댓글을 upsert해야 합니다. 기본 증거를 일반 QA 자동화 PR에만 게시하지 마세요.
Raw 로그, 관찰된 메시지, 기타 큰 증거는 Actions 아티팩트에 둡니다.

프로덕션 워크플로는 `github-actions[bot]`이 아니라 Mantis GitHub App으로 해당 댓글을
게시해야 합니다. app id와 private key를 `MANTIS_GITHUB_APP_ID` 및
`MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets로 저장하세요. 워크플로는 숨김
마커를 upsert 키로 사용하고, 토큰이 편집할 수 있으면 해당 댓글을 업데이트하며, 이전
bot 소유 마커를 편집할 수 없으면 새 Mantis 소유 댓글을 만듭니다.

PR 댓글은 짧고 시각적이어야 합니다.

```md
Mantis Discord 상태 반응 QA

요약: Mantis는 보고된 Discord 상태 반응 버그를 알려진
나쁜 baseline과 candidate 수정에 대해 다시 실행했습니다. baseline은 버그를 재현했고,
candidate는 예상된 queued -> thinking -> done 시퀀스를 보였습니다.

- 시나리오: `discord-status-reactions-tool-only`
- 실행: <workflow run link>
- 아티팩트: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

harness 실패 때문에 실행이 실패한 경우, 댓글은 candidate가 실패했음을 암시하지 말고
그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 해당 애플리케이션에
올바른 bot 권한이 있고 안전하게 회전할 수 있다면, 다른 앱을 만들지 말고 이를 재사용하세요.

초기 운영자 알림 채널은 secrets 또는 배포 구성으로 설정하세요. 처음에는 기존 maintainer 또는
operations 채널을 가리킨 뒤, 전용 Mantis 채널이 생기면 그쪽으로 이동할 수 있습니다.

guild id, channel id, bot token, 브라우저 쿠키, 또는 VNC 비밀번호를 이 문서에 넣지 마세요.
GitHub secrets, 자격 증명 브로커, 또는 운영자의 로컬 secret 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- id 및 제목
- 전송 방식
- 필요한 자격 증명
- baseline ref 정책
- candidate ref 정책
- OpenClaw 구성 patch
- 설정 단계
- stimulus
- 예상 baseline oracle
- 예상 candidate oracle
- 시각적 캡처 대상
- timeout budget
- 정리 단계

시나리오는 작고 타입이 지정된 oracle을 선호해야 합니다.

- 반응 버그용 Discord reaction 상태
- threading 버그용 Discord message reference
- Slack 버그용 Slack thread ts 및 reaction API 상태
- email 버그용 email message id 및 header
- UI가 유일하게 신뢰할 수 있는 관찰 대상일 때 브라우저 스크린샷

Vision 검사는 추가적이어야 합니다. 플랫폼 API가 버그를 증명할 수 있다면, API를
pass/fail oracle로 사용하고 스크린샷은 사람이 확신하기 위한 용도로 유지하세요.

## 공급자 확장

Discord 이후 같은 runner는 다음을 추가할 수 있습니다.

- Slack: reactions, threads, app mentions, modals, file uploads.
- Email: connector만으로 충분하지 않은 경우 `gog`를 사용하는 Gmail auth 및 message threading.
- WhatsApp: QR login, re-identification, message delivery, media, reactions.
- Telegram: group mention gating, commands, 사용 가능한 경우 reactions.
- Matrix: encrypted rooms, thread 또는 reply relations, restart resume.

각 전송 방식에는 저렴한 smoke 시나리오 하나와 하나 이상의 bug-class 시나리오가 있어야 합니다.
비싼 시각적 시나리오는 opt-in으로 유지해야 합니다.

## 열린 질문

- 기존 Mantis bot을 재사용할 때 어떤 Discord bot이 driver이고 어떤 bot이 SUT여야 하나요?
- 관찰자 브라우저 로그인은 첫 단계에서 사람 Discord 계정, test 계정, 또는 bot이 읽을 수 있는
  REST 증거만 사용해야 하나요?
- GitHub는 PR용 Mantis 아티팩트를 얼마나 오래 보존해야 하나요?
- ClawSweeper는 maintainer 명령을 기다리지 않고 언제 Mantis를 자동으로 추천해야 하나요?
- 공개 PR에 업로드하기 전에 스크린샷을 삭제 처리하거나 crop해야 하나요?
