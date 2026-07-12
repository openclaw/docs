---
read_when:
    - GitHub 또는 로컬에서 Mantis Slack 데스크톱 QA 실행하기
    - 느린 Mantis Slack 데스크톱 실행 디버깅
    - 소스, 사전 하이드레이션 또는 웜 리스 모드 선택하기
    - PR에 스크린샷 및 동영상 증거 게시하기
summary: 'Mantis Slack 데스크톱 QA 운영자 런북: GitHub 디스패치, 로컬 CLI, 웜 VNC 임대, 하이드레이션 모드, 타이밍 해석, 아티팩트 및 장애 처리.'
title: Mantis Slack 데스크톱 운영 절차서
x-i18n:
    generated_at: "2026-07-12T00:42:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 데스크톱 QA는 Linux 데스크톱, VNC 복구, Slack Web, 실제 OpenClaw Gateway, 스크린샷, 동영상 및 PR 증거 댓글이 필요한 Slack 계열 버그를 위한 실제 UI 경로입니다. 단위 테스트나 헤드리스 Slack 라이브 경로로 버그를 입증할 수 없을 때 사용하세요.

## 저장소 모델

Mantis는 세 가지 저장소 계층을 사용합니다.

- **제공자 이미지** - Crabbox가 소유하며 클라우드 제공자 계정에 저장됩니다. 머신 기능(Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, 네이티브 빌드 도구)과 비어 있는 캐시 디렉터리를 포함합니다.
- **웜 임대 상태** - 현재 운영자 세션이 소유합니다. 임대가 유지되는 동안 로그인된 브라우저 프로필, `/var/cache/crabbox/pnpm`, 준비된 소스 체크아웃을 보관할 수 있습니다.
- **Mantis 아티팩트** - OpenClaw 실행이 소유합니다. `.artifacts/qa-e2e/mantis/...` 아래에 있으며, GitHub Actions가 이를 업로드하고 Mantis GitHub App이 PR에 인라인 증거를 댓글로 게시합니다.

비밀 정보, 브라우저 쿠키, Slack 로그인 상태, 저장소 체크아웃, `node_modules` 또는 `dist/`를 제공자 이미지에 절대 포함하지 마세요.

## GitHub 디스패치

`main`에서 워크플로를 실행합니다.

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

워크플로가 실제 자격 증명을 사용하므로 `candidate_ref`는 제한됩니다. 현재 `main`의 계보, 릴리스 태그 또는 `openclaw/openclaw`의 열린 PR 헤드로 해석되어야 합니다.

워크플로는 다음을 생성합니다.

- 업로드된 아티팩트 `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- Mantis GitHub App이 작성한 인라인 PR 댓글
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- 원격 로그: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

PR 댓글은 숨겨진 `<!-- mantis-slack-desktop-smoke -->` 마커를 통해 기존 위치에서 갱신됩니다.

## 로컬 CLI

콜드 소스 증명:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

VNC 복구를 위해 VM 유지:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC 열기:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

웜 임대 재사용:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

재사용하는 원격 작업 공간에 이미 `node_modules`와 빌드된 `dist/`가 있는 경우에만 `--hydrate-mode prehydrated`를 사용하세요. 그렇지 않으면 Mantis는 닫힌 상태로 실패합니다.

네이티브 Slack 승인 UI 증명:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints`와 `--gateway-setup`은 함께 사용할 수 없습니다. 명시적인 승인 체크포인트 `--scenario`를 전달하지 않으면 옵트인 방식의 `slack-approval-exec-native` 및 `slack-approval-plugin-native` 시나리오를 실행합니다. 다른 Slack 시나리오는 VM이 시작되기 전에 거부됩니다. Slack QA 실행기는 관찰한 실제 Slack API 메시지에서 각 체크포인트 JSON 파일을 작성하고, 원격 감시자는 해당 메시지를 `approval-checkpoints/<scenario>-pending.png` 및 `approval-checkpoints/<scenario>-resolved.png`로 렌더링합니다. 체크포인트 JSON, 메시지 증거, 확인 응답 JSON 또는 렌더링된 스크린샷 중 하나라도 없거나 비어 있으면 실행이 실패합니다.

콜드 GitHub Actions 임대에는 Slack Web 쿠키가 없으므로 브라우저 캡처가 Slack 로그인 화면에 표시될 수 있습니다. 승인 체크포인트 증명에는 `slack-desktop-smoke.png` 대신 렌더링된 체크포인트 이미지와 Slack QA 아티팩트를 신뢰하세요. 브라우저 스크린샷 자체에 Slack Web을 표시해야 하는 경우에만 수동으로 로그인한 Slack Web 프로필이 있는 유지된 웜 임대를 사용하세요.

## 하이드레이션 모드

| 모드          | 사용 시점                                  | 원격 동작                                                                       | 절충점                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 일반적인 PR 증명, 콜드 머신, CI        | VM 내부에서 `pnpm install --frozen-lockfile --prefer-offline` 및 `pnpm build` 실행 | 가장 느리지만 가장 강력한 소스 체크아웃 증명                 |
| `prehydrated` | 재사용할 임대를 의도적으로 준비한 경우 | 기존 `node_modules` 및 `dist/`가 필요하며 설치/빌드를 건너뜀                     | 빠르지만 운영자가 제어하는 웜 임대에서만 유효 |

GitHub Actions는 VM 실행 전에 항상 후보 체크아웃을 준비합니다. pnpm 저장소는 운영체제, Node 버전 및 잠금 파일을 기준으로 캐시됩니다. VM의 `source` 실행도 `/var/cache/crabbox/pnpm`이 있으면 이를 재사용합니다.

## 시간 해석

`mantis-slack-desktop-smoke-report.md`에는 단계별 소요 시간이 포함됩니다.

- `crabbox.warmup` - 클라우드 제공자 부팅, 데스크톱/브라우저 준비 상태, SSH.
- `crabbox.inspect` - 임대 메타데이터 조회.
- `credentials.prepare` - Convex 자격 증명 임대 획득.
- `crabbox.remote_run` - 동기화, 브라우저 실행, OpenClaw 설치/빌드 또는 하이드레이션 검증, Gateway 시작, 스크린샷 및 동영상 캡처.
- `artifacts.copy` - VM에서 rsync로 다시 복사.

Crabbox가 0이 아닌 원격 상태를 반환했지만 Mantis가 OpenClaw Gateway 설정이 완료되었거나 Slack QA 명령 자체가 성공적으로 종료되었음을 입증하는 메타데이터를 복사한 경우, `crabbox.remote_run`에 `accepted`가 표시될 수 있습니다. `accepted`는 실패한 시나리오가 아니라 설명이 포함된 통과로 취급하세요.

실행이 느린 경우:

- 워밍업이 대부분을 차지함: 더 나은 Crabbox 제공자 이미지를 사전 베이크하거나 승격하세요.
- `source`에서 `remote_run`이 대부분을 차지함: 웜 임대를 사용하거나, pnpm 저장소 재사용을 개선하거나, 머신 필수 구성 요소를 제공자 이미지로 이동하세요.
- `prehydrated`에서 `remote_run`이 대부분을 차지함: 원격 작업 공간이 실제로 준비되지 않았거나 Gateway/브라우저/Slack 설정이 느린 것입니다.
- 아티팩트 복사가 대부분을 차지함: 동영상 크기와 아티팩트 디렉터리 내용을 점검하세요.

## 증거 체크리스트

좋은 PR 댓글에는 다음이 포함됩니다.

- 시나리오 ID 및 후보 SHA
- GitHub Actions 실행 URL 및 아티팩트 URL
- 인라인 승인 체크포인트 스크린샷 또는 로그인된 웜 임대의 Slack Web 스크린샷
- 가능한 경우 인라인 애니메이션 미리보기
- 전체 MP4 및 잘라낸 MP4 링크
- 통과/실패 상태 및 보고서의 소요 시간 요약

스크린샷이나 동영상을 저장소에 커밋하지 마세요. GitHub Actions 아티팩트나 PR 댓글에 보관하세요.

## 실패 처리

VM 실행 전에 워크플로가 실패하면 먼저 Actions 작업을 점검하세요. 일반적인 원인은 신뢰할 수 없는 `candidate_ref`, 누락된 환경 비밀 정보 또는 후보 설치/빌드 실패입니다.

VM 실행은 실패했지만 스크린샷이 다시 복사된 경우 다음을 점검하세요.

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

실행에서 임대를 유지했다면 보고서의 `crabbox vnc ...` 명령으로 VNC를 연 다음, 작업이 끝나면 임대를 중지하세요.

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack 로그인이 만료된 경우 유지된 임대의 VNC에서 복구하고 `--lease-id`를 사용하여 다시 실행하세요. 해당 브라우저 프로필을 제공자 이미지에 포함하지 마세요.

## 관련 문서

- [QA 개요](/ko/concepts/qa-e2e-automation)
- [Slack 채널](/ko/channels/slack)
- [테스트](/ko/help/testing)
