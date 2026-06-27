---
read_when:
    - GitHub 또는 로컬에서 Mantis Slack 데스크톱 QA 실행
    - Mantis Slack 데스크톱 실행 속도 저하 디버깅
    - 소스, 사전 하이드레이션 또는 웜 리스 모드 선택
    - PR에 스크린샷 및 동영상 증거 게시하기
summary: 'Mantis Slack 데스크톱 QA용 운영자 런북: GitHub dispatch, 로컬 CLI, warm VNC leases, hydrate 모드, 타이밍 해석, 아티팩트, 실패 처리.'
title: Mantis Slack 데스크톱 런북
x-i18n:
    generated_at: "2026-06-27T17:22:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 데스크톱 QA는 Linux 데스크톱, VNC 복구, Slack Web, 실제 OpenClaw Gateway, 스크린샷, 동영상, PR 증거 댓글이 필요한 Slack 계열 버그를 위한 실제 UI 경로입니다.

단위 테스트나 헤드리스 Slack 라이브 경로로 버그를 증명할 수 없을 때 사용하세요.

## 스토리지 모델

Mantis는 세 가지 스토리지 계층을 사용합니다.

- 프로바이더 이미지: Crabbox가 소유하고 클라우드 프로바이더 계정에 저장됩니다.
  Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, 네이티브 빌드 도구, 빈 캐시 디렉터리 같은 머신 기능을 포함합니다.
- 웜 리스 상태: 현재 운영자 세션이 소유합니다. 리스가 살아 있는 동안 로그인된 브라우저 프로필, `/var/cache/crabbox/pnpm`, 준비된 소스 체크아웃을 포함할 수 있습니다.
- Mantis 아티팩트: OpenClaw 실행이 소유합니다. `.artifacts/qa-e2e/mantis/...` 아래에 위치하며, 이후 GitHub Actions가 업로드하고 Mantis GitHub App이 PR에 인라인 증거를 댓글로 남깁니다.

시크릿, 브라우저 쿠키, Slack 로그인 상태, 저장소 체크아웃, `node_modules`, `dist/`를 미리 구운 프로바이더 이미지에 절대 넣지 마세요.

## GitHub 디스패치

`main`에서 워크플로를 실행하세요.

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

워크플로가 라이브 자격 증명을 사용하므로 허용되는 `candidate_ref` 값은 의도적으로 좁게 제한됩니다. 현재 `main` 계보, 릴리스 태그, 또는 `openclaw/openclaw`의 열린 PR head만 사용할 수 있습니다.

워크플로는 다음을 작성합니다.

- 업로드된 아티팩트: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- Mantis GitHub App의 인라인 PR 댓글;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log` 같은 원격 로그.

PR 댓글은 숨겨진 `<!-- mantis-slack-desktop-smoke -->` 마커로 제자리에서 업데이트됩니다.

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

웜 리스 재사용:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

재사용되는 원격 워크스페이스에 이미 `node_modules`와 빌드된 `dist/`가 있을 때만 `--hydrate-mode prehydrated`를 사용하세요. 이것들이 없으면 Mantis는 안전하게 실패합니다.

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

승인 체크포인트 모드는 `--gateway-setup`과 함께 사용할 수 없습니다. 명시적인 승인 체크포인트 `--scenario` 플래그를 전달하지 않으면 옵트인 `slack-approval-exec-native` 및 `slack-approval-plugin-native` 시나리오를 실행합니다. 다른 Slack 시나리오는 VM이 시작되기 전에 거부됩니다. Slack QA 러너는 관찰한 실제 Slack API 메시지에서 각 체크포인트 JSON 파일을 작성한 다음, 원격 watcher가 해당 메시지 스냅샷을 `approval-checkpoints/<scenario>-pending.png` 및 `approval-checkpoints/<scenario>-resolved.png`로 렌더링합니다. 체크포인트 JSON, 메시지 증거, ack JSON, 렌더링된 스크린샷 중 하나라도 없거나 비어 있으면 실행은 실패합니다.

콜드 GitHub Actions 리스에는 Slack Web 쿠키가 없으므로 브라우저 캡처가 Slack 로그인 화면에 도달할 수 있습니다. 승인 체크포인트 증명의 경우 `slack-desktop-smoke.png`보다 렌더링된 체크포인트 이미지와 Slack QA 아티팩트를 신뢰하세요. 브라우저 스크린샷 자체가 Slack Web을 보여야 할 때만 수동으로 Slack Web에 로그인된 프로필이 있는 유지된 웜 리스를 사용하세요.

## 하이드레이트 모드

| 모드          | 사용할 때                                  | 원격 동작                                                                       | 트레이드오프                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 일반 PR 증명, 콜드 머신, CI        | VM 안에서 `pnpm install --frozen-lockfile --prefer-offline` 및 `pnpm build` 실행 | 가장 느리지만 가장 강한 소스 체크아웃 증명                 |
| `prehydrated` | 재사용 리스를 의도적으로 준비한 경우 | 기존 `node_modules` 및 `dist/`를 요구하며 install/build를 건너뜀                     | 빠르지만 운영자가 제어하는 웜 리스에 대해서만 유효 |

GitHub Actions는 VM 실행 전에 항상 후보 체크아웃을 준비합니다. pnpm store는 OS, Node 버전, lockfile별로 캐시됩니다. VM 소스 실행도 `/var/cache/crabbox/pnpm`가 있으면 이를 사용합니다.

## 타이밍 해석

`mantis-slack-desktop-smoke-report.md`에는 단계별 타이밍이 포함됩니다.

- `crabbox.warmup`: 클라우드 프로바이더 부팅, 데스크톱/브라우저 준비 상태, SSH.
- `crabbox.inspect`: 리스 메타데이터 조회.
- `credentials.prepare`: Convex 자격 증명 리스 획득.
- `crabbox.remote_run`: 동기화, 브라우저 실행, OpenClaw install/build 또는 하이드레이트 검증, Gateway 시작, 스크린샷, 동영상 캡처.
- `artifacts.copy`: VM에서 rsync로 다시 복사.

Mantis가 OpenClaw Gateway 설정이 완료되었거나 Slack QA 명령 자체가 성공적으로 종료되었음을 증명하는 메타데이터를 복사한 뒤 Crabbox가 0이 아닌 원격 상태를 반환하면 `crabbox.remote_run`이 `accepted`로 표시될 수 있습니다. `accepted`는 실패한 시나리오가 아니라 설명이 포함된 통과로 취급하세요.

실행이 느린 경우:

- warmup이 지배적임: 더 나은 Crabbox 프로바이더 이미지를 미리 굽거나 승격하세요.
- `source`에서 remote_run이 지배적임: 웜 리스를 사용하거나, pnpm store 재사용을 개선하거나, 머신 필수 구성 요소를 프로바이더 이미지로 옮기세요.
- `prehydrated`에서 remote_run이 지배적임: 원격 워크스페이스가 실제로 준비되지 않았거나 Gateway/브라우저/Slack 설정이 느린 것입니다.
- artifact copy가 지배적임: 동영상 크기와 아티팩트 디렉터리 내용을 검사하세요.

## 증거 체크리스트

좋은 PR 댓글은 다음을 보여야 합니다.

- 시나리오 id 및 후보 SHA;
- GitHub Actions 실행 URL;
- 아티팩트 URL;
- 인라인 승인 체크포인트 스크린샷 또는 로그인된 웜 리스의 Slack Web 스크린샷;
- 사용 가능한 경우 인라인 애니메이션 미리보기;
- 전체 MP4 및 잘라낸 MP4 링크;
- 통과/실패 상태;
- 첨부된 보고서의 타이밍 요약.

스크린샷이나 동영상을 저장소에 커밋하지 마세요. GitHub Actions 아티팩트나 PR 댓글에 보관하세요.

## 실패 처리

워크플로가 VM 실행 전에 실패하면 먼저 Actions 작업을 검사하세요. 일반적인 원인은 신뢰할 수 없는 `candidate_ref`, 누락된 환경 시크릿, 후보 install/build 실패입니다.

VM 실행은 실패했지만 스크린샷이 다시 복사된 경우 다음을 검사하세요.

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

실행이 리스를 유지한 경우 보고서의 `crabbox vnc ...` 명령으로 VNC를 여세요. 완료되면 리스를 중지하세요.

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack 로그인이 만료된 경우 유지된 리스에서 VNC로 복구하고 `--lease-id`로 다시 실행하세요. 해당 브라우저 프로필을 프로바이더 이미지에 굽지 마세요.

## 관련 항목

- [QA 개요](/ko/concepts/qa-e2e-automation)
- [Slack 채널](/ko/channels/slack)
- [테스트](/ko/help/testing)
