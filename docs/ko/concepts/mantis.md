---
read_when:
    - OpenClaw 버그에 대한 실시간 시각적 QA 빌드 또는 실행
    - 풀 리퀘스트에 전후 검증 추가
    - Discord, Slack, WhatsApp 또는 기타 실시간 전송 시나리오 추가
    - 스크린샷, 브라우저 자동화 또는 VNC 액세스가 필요한 QA 실행 디버깅
summary: Mantis는 라이브 트랜스포트에서 OpenClaw 버그를 재현하고, 전후 증거를 캡처하며, PR에 아티팩트를 첨부하기 위한 시각적 엔드투엔드 검증 시스템입니다.
title: 사마귀
x-i18n:
    generated_at: "2026-05-03T21:30:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis는 실제 런타임, 실제 전송 계층, 눈으로 확인할 수 있는 증거가 필요한 버그를 위한 OpenClaw 엔드투엔드 검증 시스템입니다. 알려진 불량 ref에 대해 시나리오를 실행하고, 증거를 캡처한 다음, 후보 ref에 대해 같은 시나리오를 실행하고, 관리자가 PR 또는 로컬 명령에서 검사할 수 있는 아티팩트로 비교 결과를 게시합니다.

Mantis는 Discord에서 시작합니다. Discord는 실제 봇 인증, 실제 길드 채널, 반응, 스레드, 네이티브 명령, 그리고 사람이 전송 계층에 표시된 내용을 시각적으로 확인할 수 있는 브라우저 UI라는 가치 높은 첫 번째 레인을 제공하기 때문입니다.

## 목표

- GitHub 이슈 또는 PR의 버그를 사용자가 보는 것과 같은 전송 계층 형태로 재현합니다.
- 수정 사항을 적용하기 전에 기준 ref에서 **이전** 아티팩트를 캡처합니다.
- 수정 사항을 적용한 후 후보 ref에서 **이후** 아티팩트를 캡처합니다.
- 가능할 때마다 Discord REST 반응 조회 또는 채널 트랜스크립트 검사 같은 결정적 오라클을 사용합니다.
- 버그에 표시되는 UI 표면이 있으면 스크린샷을 캡처합니다.
- 에이전트가 제어하는 CLI에서 로컬로 실행하고 GitHub에서 원격으로 실행합니다.
- 로그인, 브라우저 자동화 또는 공급자 인증이 막혔을 때 VNC 복구를 위해 충분한 머신 상태를 보존합니다.
- 실행이 차단되거나, 수동 VNC 도움이 필요하거나, 완료되면 운영자 Discord 채널에 간결한 상태를 게시합니다.

## 비목표

- Mantis는 단위 테스트를 대체하지 않습니다. Mantis 실행은 보통 수정 사항을 이해한 뒤 더 작은 회귀 테스트가 되어야 합니다.
- Mantis는 일반적인 빠른 CI 게이트가 아닙니다. 더 느리고, 라이브 자격 증명을 사용하며, 라이브 환경이 중요한 버그에 한정됩니다.
- Mantis는 정상 동작에서 사람을 필요로 해서는 안 됩니다. 수동 VNC는 복구 경로이지 정상 경로가 아닙니다.
- Mantis는 원시 시크릿을 아티팩트, 로그, 스크린샷, Markdown 보고서 또는 PR 댓글에 저장하지 않습니다.

## 소유권

Mantis는 OpenClaw QA 스택에 속합니다.

- OpenClaw는 `pnpm openclaw qa mantis` 아래의 시나리오 런타임, 전송 계층 어댑터, 증거 스키마, 로컬 CLI를 소유합니다.
- QA Lab은 라이브 전송 계층 하네스 구성 요소, 브라우저 캡처 헬퍼, 아티팩트 작성기를 소유합니다.
- Crabbox는 원격 VM이 필요할 때 예열된 Linux 머신을 소유합니다.
- GitHub Actions는 원격 워크플로 진입점과 아티팩트 보존을 소유합니다.
- ClawSweeper는 관리자 명령 파싱, 워크플로 디스패치, 최종 PR 댓글 게시 같은 GitHub 댓글 라우팅을 소유합니다.
- OpenClaw 에이전트는 시나리오에 에이전트식 설정, 디버깅 또는 정지 상태 보고가 필요할 때 Codex를 통해 Mantis를 구동합니다.

이 경계는 전송 계층 지식은 OpenClaw에, 머신 스케줄링은 Crabbox에, 관리자 워크플로 연결 코드는 ClawSweeper에 유지합니다.

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

러너는 출력 디렉터리 아래에 분리된 기준 및 후보 워크트리를 만들고, 종속성을 설치하고, 각 ref를 빌드하고, `--allow-failures`로 시나리오를 실행한 다음, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 작성합니다. 첫 Discord 시나리오에서 성공적인 검증은 기준 상태가 `fail`이고 후보 상태가 `pass`임을 의미합니다.

GitHub 스모크 워크플로는 `Mantis Discord Smoke`입니다. 첫 번째 실제 시나리오의 이전 및 이후 GitHub 워크플로는 `Mantis Discord Status Reactions`입니다. 다음을 받습니다.

- `baseline_ref`: queued-only 동작을 재현할 것으로 예상되는 ref입니다.
- `candidate_ref`: `queued -> thinking -> done`을 보여줄 것으로 예상되는 ref입니다.

워크플로 하네스 ref를 체크아웃하고, 별도의 기준 및 후보 워크트리를 빌드하고, 각 워크트리에 대해 `discord-status-reactions-tool-only`를 실행하며, `baseline/`, `candidate/`, `comparison.json`, `mantis-report.md`를 Actions 아티팩트로 업로드합니다.

PR 댓글에서 status-reactions 실행을 직접 트리거할 수도 있습니다.

```text
@Mantis discord status reactions
```

댓글 트리거는 의도적으로 좁습니다. 쓰기, 유지 관리 또는 관리자 접근 권한이 있는 사용자의 pull request 댓글에서만 실행되며, Discord status-reaction 요청만 인식합니다. 기본적으로 알려진 불량 기준 ref와 현재 PR head SHA를 후보로 사용합니다. 관리자는 어느 ref든 재정의할 수 있습니다.

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 명령 예시:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

첫 번째 명령은 명시적이며 시나리오에 초점을 둡니다. 두 번째 명령은 나중에 라벨, 변경된 파일, ClawSweeper 리뷰 결과를 바탕으로 PR 또는 이슈를 권장 Mantis 시나리오에 매핑할 수 있습니다.

## 실행 수명 주기

1. 자격 증명을 획득합니다.
2. VM을 할당하거나 재사용합니다.
3. 기준 ref를 위한 깨끗한 체크아웃을 준비합니다.
4. 종속성을 설치하고 시나리오에 필요한 것만 빌드합니다.
5. 격리된 상태 디렉터리로 하위 OpenClaw Gateway를 시작합니다.
6. 라이브 전송 계층, 공급자, 모델, 브라우저 프로필을 구성합니다.
7. 시나리오를 실행하고 기준 증거를 캡처합니다.
8. Gateway를 중지하고 로그를 보존합니다.
9. 같은 VM에서 후보 ref를 준비합니다.
10. 같은 시나리오를 실행하고 후보 증거를 캡처합니다.
11. 오라클 결과와 시각적 증거를 비교합니다.
12. Markdown, JSON, 로그, 스크린샷, 선택적 추적 아티팩트를 작성합니다.
13. GitHub Actions 아티팩트를 업로드합니다.
14. 간결한 PR 또는 Discord 상태 메시지를 게시합니다.

시나리오는 두 가지 방식으로 실패할 수 있어야 합니다.

- **버그 재현됨**: 기준이 예상한 방식으로 실패했습니다.
- **하네스 실패**: 버그 오라클이 의미를 갖기 전에 환경 설정, 자격 증명, Discord API, 브라우저 또는 공급자가 실패했습니다.

최종 보고서는 관리자가 불안정한 환경을 제품 동작과 혼동하지 않도록 이러한 경우를 분리해야 합니다.

## Discord MVP

첫 번째 시나리오는 소스 답장 전달 모드가 `message_tool_only`인 길드 채널의 Discord 상태 반응을 대상으로 해야 합니다.

Mantis 시드로 적합한 이유:

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

기준 증거는 queued 승인 반응은 표시하지만 tool-only 모드에서 수명 주기 전환은 없어야 합니다. 후보 증거는 `messages.statusReactions.enabled`가 명시적으로 true일 때 수명 주기 상태 반응이 실행되는 것을 보여야 합니다.

실행 가능한 첫 번째 단위는 옵트인 Discord 라이브 QA 시나리오입니다.

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

이 시나리오는 SUT를 항상 켜진 길드 처리, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, 명시적 상태 반응으로 구성합니다. 오라클은 실제 Discord 트리거 메시지를 폴링하고 관찰된 순서 `👀 -> 🤔 -> 👍`를 기대합니다. 아티팩트에는 `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, `discord-status-reactions-tool-only-timeline.png`가 포함됩니다.

## 기존 QA 구성 요소

Mantis는 처음부터 시작하는 대신 기존 비공개 QA 스택을 기반으로 해야 합니다.

- `pnpm openclaw qa discord`는 이미 드라이버 및 SUT 봇이 있는 라이브 Discord 레인을 실행합니다.
- 라이브 전송 계층 러너는 이미 `.artifacts/qa-e2e/` 아래에 보고서와 관찰된 메시지 아티팩트를 작성합니다.
- Convex 자격 증명 임대는 이미 공유 라이브 전송 계층 자격 증명에 대한 독점 접근을 제공합니다.
- 브라우저 제어 서비스는 이미 스크린샷, 스냅샷, 헤드리스 관리 프로필, 원격 CDP 프로필을 지원합니다.
- QA Lab에는 이미 전송 계층 형태의 테스트를 위한 디버거 UI와 버스가 있습니다.

첫 Mantis 구현은 이러한 구성 요소 위의 얇은 이전/이후 러너와 하나의 시각적 증거 계층으로 만들 수 있습니다.

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

`mantis-summary.json`은 기계가 읽을 수 있는 단일 진실 공급원이어야 합니다. Markdown 보고서는 PR 댓글과 사람의 검토를 위한 것입니다.

요약에는 다음이 포함되어야 합니다.

- 테스트한 ref 및 SHA
- 전송 계층 및 시나리오 id
- 머신 공급자와 머신 id 또는 임대 id
- 시크릿 값 없는 자격 증명 출처
- 기준 결과
- 후보 결과
- 기준에서 버그가 재현되었는지 여부
- 후보가 이를 수정했는지 여부
- 아티팩트 경로
- 정제된 설정 또는 정리 문제

스크린샷은 증거이지 시크릿이 아닙니다. 그래도 비공개 채널 이름, 사용자 이름 또는 메시지 내용이 나타날 수 있으므로 정제 규율이 필요합니다. 공개 PR에서는 정제 방식이 더 강해질 때까지 인라인 이미지보다 GitHub Actions 아티팩트 링크를 선호합니다.

## 브라우저와 VNC

브라우저 레인에는 두 가지 모드가 있습니다.

- **헤드리스 자동화**: CI의 기본값입니다. Chrome은 CDP가 활성화된 상태로 실행되며, Playwright 또는 OpenClaw 브라우저 제어가 스크린샷을 캡처합니다.
- **VNC 복구**: 로그인, MFA, Discord 자동화 방지 또는 시각적 디버깅에 사람이 필요할 때 같은 VM에서 활성화됩니다.

Discord 관찰자 브라우저 프로필은 매 실행마다 로그인하지 않아도 될 만큼 지속적이어야 하지만, 개인 브라우저 상태와는 격리되어야 합니다. 프로필은 개발자 노트북이 아니라 Mantis 머신 풀에 속합니다.

Mantis가 막히면 다음을 포함하는 Discord 상태 메시지를 게시합니다.

- 실행 id
- 시나리오 id
- 머신 공급자
- 아티팩트 디렉터리
- 사용 가능한 경우 VNC 또는 noVNC 연결 지침
- 짧은 차단 사유 텍스트

첫 비공개 배포에서는 이러한 메시지를 기존 운영자 채널에 게시하고, 나중에 전용 Mantis 채널로 이동할 수 있습니다.

## 머신

Mantis는 첫 원격 구현에서 Crabbox를 통한 AWS를 선호해야 합니다. Crabbox는 예열된 머신, 임대 추적, 하이드레이션, 로그, 결과, 정리를 제공합니다. AWS 용량이 너무 느리거나 사용할 수 없으면 같은 머신 인터페이스 뒤에 Hetzner 공급자를 추가합니다.

최소 VM 요구 사항:

- 데스크톱 가능 Chrome 또는 Chromium 설치가 있는 Linux
- 브라우저 자동화를 위한 CDP 접근
- 복구를 위한 VNC 또는 noVNC
- Node 22 및 pnpm
- OpenClaw 체크아웃 및 종속성 캐시
- Playwright를 사용할 때 Playwright Chromium 브라우저 캐시
- OpenClaw Gateway 하나, 브라우저 하나, 모델 실행 하나에 충분한 CPU와 메모리
- Discord, GitHub, 모델 공급자, 자격 증명 브로커에 대한 아웃바운드 접근

VM은 예상되는 자격 증명 또는 브라우저 프로필 저장소 외부에 장기 원시 시크릿을 보관해서는 안 됩니다.

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

장기적으로 Convex 자격 증명 풀은 라이브 전송 자격 증명의 일반적인 소스로 남아 있어야 합니다. GitHub secrets는 브로커와 폴백 레인을 부트스트랩합니다.

Mantis 러너는 절대 다음을 출력해서는 안 됩니다.

- Discord 봇 토큰
- 공급자 API 키
- 브라우저 쿠키
- 인증 프로필 내용
- VNC 비밀번호
- 원시 자격 증명 페이로드

공개 아티팩트 업로드는 봇, 길드, 채널, 메시지 ID 같은 Discord 대상 메타데이터도 삭제해야 합니다. 이러한 이유로 GitHub 스모크 워크플로는 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`을 활성화합니다.

토큰이 실수로 이슈, PR, 채팅 또는 로그에 붙여넣어진 경우, 새 시크릿이 저장된 뒤 해당 토큰을 교체하세요.

## GitHub 아티팩트 및 PR 댓글

Mantis 워크플로는 전체 증거 번들을 수명이 짧은 Actions 아티팩트로 업로드해야 합니다. 버그 보고서 또는 수정 PR에 대해 워크플로를 실행하는 경우, 삭제 처리된 PNG 스크린샷도 `qa-artifacts` 브랜치에 게시하고 해당 버그 또는 수정 PR에 전후 스크린샷이 인라인으로 포함된 댓글을 업서트해야 합니다. 기본 증거를 일반 QA 자동화 PR에만 게시하지 마세요. 원시 로그, 관찰된 메시지 및 기타 큰 증거는 Actions 아티팩트에 보관합니다.

프로덕션 워크플로는 `github-actions[bot]`이 아니라 Mantis GitHub App으로 이러한 댓글을 게시해야 합니다. 앱 ID와 비공개 키를 `MANTIS_GITHUB_APP_ID` 및 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets로 저장하세요. 워크플로는 숨겨진 마커를 업서트 키로 사용하고, 토큰이 수정할 수 있으면 해당 댓글을 업데이트하며, 이전 봇 소유 마커를 수정할 수 없으면 새로운 Mantis 소유 댓글을 생성합니다.

PR 댓글은 짧고 시각적이어야 합니다.

```md
Mantis Discord 상태 반응 QA

요약: Mantis는 알려진 불량 기준선과 후보 수정본에 대해 보고된 Discord 상태 반응 버그를 다시 실행했습니다. 기준선은 버그를 재현했고, 후보는 예상된 queued -> thinking -> done 순서를 보여주었습니다.

- 시나리오: `discord-status-reactions-tool-only`
- 실행: <workflow run link>
- 아티팩트: <artifact link>
- 기준선: `<status>` at `<sha>`
- 후보: `<status>` at `<sha>`

| 기준선              | 후보                |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

하니스 실패로 인해 실행이 실패한 경우, 댓글은 후보가 실패했다고 암시하는 대신 그 사실을 말해야 합니다.

## 비공개 배포 참고 사항

비공개 배포에는 이미 Mantis Discord 애플리케이션이 있을 수 있습니다. 올바른 봇 권한이 있고 안전하게 교체할 수 있다면 다른 앱을 만들지 말고 해당 애플리케이션을 재사용하세요.

초기 운영자 알림 채널은 secrets 또는 배포 구성을 통해 설정하세요. 먼저 기존 유지관리자 또는 운영 채널을 가리키게 한 다음, 전용 Mantis 채널이 생기면 그곳으로 이동할 수 있습니다.

길드 ID, 채널 ID, 봇 토큰, 브라우저 쿠키 또는 VNC 비밀번호를 이 문서에 넣지 마세요. GitHub secrets, 자격 증명 브로커 또는 운영자의 로컬 시크릿 저장소에 저장하세요.

## 시나리오 추가

Mantis 시나리오는 다음을 선언해야 합니다.

- ID 및 제목
- 전송
- 필요한 자격 증명
- 기준선 ref 정책
- 후보 ref 정책
- OpenClaw 구성 패치
- 설정 단계
- 자극
- 예상 기준선 오라클
- 예상 후보 오라클
- 시각적 캡처 대상
- 시간 제한 예산
- 정리 단계

시나리오는 작고 형식이 지정된 오라클을 선호해야 합니다.

- 반응 버그의 경우 Discord 반응 상태
- 스레딩 버그의 경우 Discord 메시지 참조
- Slack 버그의 경우 Slack 스레드 ts 및 반응 API 상태
- 이메일 버그의 경우 이메일 메시지 ID 및 헤더
- UI가 유일하게 신뢰할 수 있는 관찰 대상인 경우 브라우저 스크린샷

비전 검사는 추가적이어야 합니다. 플랫폼 API가 버그를 증명할 수 있다면 API를 통과/실패 오라클로 사용하고, 스크린샷은 사람이 확인하는 데 참고하도록 유지하세요.

## 공급자 확장

Discord 이후 동일한 러너는 다음을 추가할 수 있습니다.

- Slack: 반응, 스레드, 앱 멘션, 모달, 파일 업로드.
- 이메일: 커넥터만으로 충분하지 않은 경우 `gog`를 사용한 Gmail 인증 및 메시지 스레딩.
- WhatsApp: QR 로그인, 재식별, 메시지 전달, 미디어, 반응.
- Telegram: 그룹 멘션 게이팅, 명령, 가능한 경우 반응.
- Matrix: 암호화된 방, 스레드 또는 답장 관계, 재시작 재개.

각 전송에는 저렴한 스모크 시나리오 하나와 하나 이상의 버그 클래스 시나리오가 있어야 합니다. 비용이 큰 시각적 시나리오는 옵트인으로 유지해야 합니다.

## 열린 질문

- 기존 Mantis 봇을 재사용할 때 어떤 Discord 봇을 드라이버로, 어떤 봇을 SUT로 사용해야 하나요?
- 관찰자 브라우저 로그인은 첫 단계에서 사람 Discord 계정, 테스트 계정 또는 봇이 읽을 수 있는 REST 증거만 사용해야 하나요?
- GitHub는 PR에 대한 Mantis 아티팩트를 얼마나 오래 보존해야 하나요?
- ClawSweeper는 유지관리자 명령을 기다리는 대신 언제 Mantis를 자동으로 권장해야 하나요?
- 공개 PR의 경우 업로드 전에 스크린샷을 삭제 처리하거나 잘라내야 하나요?
