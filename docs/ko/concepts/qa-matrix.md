---
read_when:
    - 로컬에서 pnpm openclaw qa matrix 실행하기
    - Matrix QA 시나리오 추가 또는 선택
    - Matrix QA 실패, 시간 초과 또는 멈춘 정리 작업 분류하기
summary: 'Docker 기반 Matrix 라이브 QA 레인에 대한 메인터이너 참조: CLI, 프로필, 환경 변수, 시나리오, 출력 아티팩트.'
title: 매트릭스 QA
x-i18n:
    generated_at: "2026-04-30T06:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 레인은 임시 Tuwunel 홈서버를 Docker에서 실행해 번들된 `@openclaw/matrix` Plugin을 검사합니다. 임시 driver, SUT, observer 계정과 시드된 룸을 함께 사용합니다. Matrix의 실제 전송 경로를 다루는 라이브 커버리지입니다.

이는 메인테이너 전용 도구입니다. 패키지된 OpenClaw 릴리스에는 의도적으로 `qa-lab`이 포함되지 않으므로 `openclaw qa`는 소스 체크아웃에서만 사용할 수 있습니다. 소스 체크아웃은 번들된 러너를 직접 로드합니다. Plugin 설치 단계는 필요하지 않습니다.

더 넓은 QA 프레임워크 맥락은 [QA 개요](/ko/concepts/qa-e2e-automation)를 참고하세요.

## 빠른 시작

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

일반 `pnpm openclaw qa matrix`는 `--profile all`로 실행되며 첫 실패 시 중단하지 않습니다. 릴리스 게이트에는 `--profile fast --fail-fast`를 사용하세요. 전체 인벤토리를 병렬로 실행할 때는 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`로 카탈로그를 샤딩하세요.

## 레인이 수행하는 작업

1. 임시 Tuwunel 홈서버를 Docker에서 프로비저닝합니다(기본 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`, 서버 이름 `matrix-qa.test`, 포트 `28008`).
2. 세 임시 사용자 `driver`(인바운드 트래픽 전송), `sut`(테스트 대상 OpenClaw Matrix 계정), `observer`(서드파티 트래픽 캡처)를 등록합니다.
3. 선택한 시나리오에 필요한 룸을 시드합니다(main, threading, media, restart, secondary, allowlist, E2EE, verification DM 등).
4. 실제 Matrix Plugin을 SUT 계정으로 범위 지정한 자식 OpenClaw Gateway를 시작합니다. `qa-channel`은 자식에 로드되지 않습니다.
5. 시나리오를 순서대로 실행하며 driver/observer Matrix 클라이언트를 통해 이벤트를 관찰합니다.
6. 홈서버를 정리하고 리포트와 요약 아티팩트를 작성한 다음 종료합니다.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 공통 플래그

| 플래그                | 기본값                                        | 설명                                                                                                               |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | 시나리오 프로필입니다. [프로필](#profiles)을 참고하세요.                                                           |
| `--fail-fast`         | 꺼짐                                          | 첫 번째 실패한 검사 또는 시나리오 이후 중단합니다.                                                                 |
| `--scenario <id>`     | —                                             | 이 시나리오만 실행합니다. 반복할 수 있습니다. [시나리오](#scenarios)를 참고하세요.                                 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 리포트, 요약, 관찰된 이벤트, 출력 로그가 기록되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다.     |
| `--repo-root <path>`  | `process.cwd()`                               | 중립 작업 디렉터리에서 호출할 때의 리포지터리 루트입니다.                                                         |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 구성 내부의 Matrix 계정 ID입니다.                                                                       |

### 제공자 플래그

레인은 실제 Matrix 전송을 사용하지만 모델 제공자는 구성할 수 있습니다.

| 플래그                   | 기본값           | 설명                                                                                                                                         |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 결정적 목 디스패치에는 `mock-openai`, 라이브 프런티어 제공자에는 `live-frontier`를 사용합니다. 레거시 별칭 `live-openai`도 계속 작동합니다. |
| `--model <ref>`          | 제공자 기본값    | 기본 `provider/model` 참조입니다.                                                                                                            |
| `--alt-model <ref>`      | 제공자 기본값    | 시나리오가 실행 중간에 전환되는 대체 `provider/model` 참조입니다.                                                                            |
| `--fast`                 | 꺼짐             | 지원되는 경우 제공자 빠른 모드를 활성화합니다.                                                                                               |

Matrix QA는 `--credential-source` 또는 `--credential-role`을 허용하지 않습니다. 이 레인은 로컬에서 임시 사용자를 프로비저닝합니다. 임대할 공유 자격 증명 풀은 없습니다.

## 프로필

선택한 프로필은 실행할 시나리오를 결정합니다.

| 프로필          | 사용 목적                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (기본값)  | 전체 카탈로그입니다. 느리지만 포괄적입니다.                                                                                                                                                                                        |
| `fast`          | 라이브 전송 계약을 실행하는 릴리스 게이트 하위 집합입니다. canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation, exec approval metadata delivery를 검사합니다. |
| `transport`     | 전송 수준 threading, DM, room, autojoin, mention/allowlist, approval, reaction 시나리오입니다.                                                                                                                                      |
| `media`         | 이미지, 오디오, 비디오, PDF, EPUB 첨부 커버리지입니다.                                                                                                                                                                             |
| `e2ee-smoke`    | 최소 E2EE 커버리지입니다. 기본 암호화 응답, 스레드 후속 응답, bootstrap 성공을 다룹니다.                                                                                                                                           |
| `e2ee-deep`     | 포괄적인 E2EE 상태 손실, 백업, 키, 복구 시나리오입니다.                                                                                                                                                                            |
| `e2ee-cli`      | QA 하네스를 통해 구동되는 `openclaw matrix encryption setup` 및 `verify *` CLI 시나리오입니다.                                                                                                                                      |

정확한 매핑은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`에 있습니다.

## 시나리오

전체 시나리오 ID 목록은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`의 `MatrixQaScenarioId` 유니언입니다. 범주는 다음과 같습니다.

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- 최상위 / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming 및 도구 진행률 — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*`(exec/plugin metadata, chunked fallback, deny reactions, threads, `target: "both"` routing)
- restart 및 replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot, allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*`(기본 응답, 스레드 후속 응답, bootstrap, 복구 키 생명주기, 상태 손실 변형, 서버 백업 동작, 디바이스 위생, SAS / QR / DM verification, restart, 아티팩트 비식별화)
- E2EE CLI — `matrix-e2ee-cli-*`(암호화 설정, 멱등 설정, bootstrap 실패, recovery-key lifecycle, multi-account, gateway-reply round-trip, self-verification)

직접 고른 집합을 실행하려면 `--scenario <id>`를 전달하세요(반복 가능). 프로필 게이팅을 무시하려면 `--profile all`과 함께 사용하세요.

## 환경 변수

| 변수                                | 기본값                                   | 효과                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30분)                        | 전체 실행의 엄격한 상한입니다.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 초기 카나리 응답의 제한입니다. Release CI는 공유 러너에서 이를 높여, 느린 첫 Gateway 턴 때문에 시나리오 커버리지가 시작되기 전에 실패하지 않도록 합니다.                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 부정 no-reply 어설션을 위한 조용한 창입니다. 실행 제한 시간 `≤`로 클램프됩니다.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 종료 처리의 제한입니다. 실패 표면에는 복구용 `docker compose ... down --remove-orphans` 명령이 포함됩니다.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 다른 Tuwunel 버전으로 검증할 때 homeserver 이미지를 재정의합니다.                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 켜짐                                        | `0`은 stderr의 `[matrix-qa] ...` 진행률 줄을 숨깁니다. `1`은 강제로 표시합니다.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 수정됨                                  | `1`은 메시지 본문과 `formatted_body`를 `matrix-qa-observed-events.json`에 유지합니다. 기본값은 CI 아티팩트를 안전하게 유지하도록 수정 처리합니다.                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 꺼짐                                       | `1`은 아티팩트 작성 후 결정론적 `process.exit`를 건너뜁니다. 기본값은 matrix-js-sdk의 네이티브 crypto 핸들이 아티팩트 완료 후에도 이벤트 루프를 계속 살려 둘 수 있기 때문에 강제 종료합니다. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 설정 안 됨                                     | 외부 런처(예: `scripts/run-node.mjs`)가 설정한 경우, Matrix QA는 자체 tee를 시작하는 대신 해당 로그 경로를 재사용합니다.                                                                   |

## 출력 아티팩트

`--output-dir`에 작성됩니다.

- `matrix-qa-report.md` — Markdown 프로토콜 보고서(통과, 실패, 건너뜀 항목과 그 이유).
- `matrix-qa-summary.json` — CI 파싱과 대시보드에 적합한 구조화된 요약.
- `matrix-qa-observed-events.json` — 드라이버 및 옵저버 클라이언트에서 관찰한 Matrix 이벤트. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`이 아니면 본문은 수정 처리됩니다. 승인 메타데이터는 선택된 안전한 필드와 잘린 명령 미리보기로 요약됩니다.
- `matrix-qa-output.log` — 실행의 stdout/stderr 결합 출력입니다. `OPENCLAW_RUN_NODE_OUTPUT_LOG`가 설정된 경우, 외부 런처의 로그가 대신 재사용됩니다.

기본 출력 디렉터리는 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`이므로 연속 실행이 서로를 덮어쓰지 않습니다.

## 트리아지 팁

- **실행이 끝부분에서 멈춤:** `matrix-js-sdk` 네이티브 crypto 핸들은 하네스보다 오래 살아남을 수 있습니다. 기본값은 아티팩트 작성 후 깔끔한 `process.exit`를 강제합니다. `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` 설정을 해제했다면 프로세스가 계속 남아 있을 수 있습니다.
- **정리 오류:** 출력된 복구 명령(`docker compose ... down --remove-orphans` 호출)을 찾아 수동으로 실행해 homeserver 포트를 해제하세요.
- **CI에서 불안정한 부정 어설션 창:** CI가 빠를 때는 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`(기본값 8초)를 낮추고, 느린 공유 러너에서는 높이세요.
- **버그 보고서에 수정 처리된 본문이 필요함:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`로 다시 실행하고 `matrix-qa-observed-events.json`을 첨부하세요. 생성된 아티팩트는 민감한 것으로 취급하세요.
- **다른 Tuwunel 버전:** 테스트 중인 버전을 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`에 지정하세요. 이 레인은 고정된 기본 이미지만 체크인합니다.

## 라이브 전송 계약

Matrix는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 정의된 단일 계약 체크리스트를 공유하는 세 가지 라이브 전송 레인(Matrix, Telegram, Discord) 중 하나입니다. `qa-channel`은 계속 광범위한 합성 제품군이며 의도적으로 해당 매트릭스의 일부가 아닙니다.

## 관련 항목

- [QA 개요](/ko/concepts/qa-e2e-automation) — 전체 QA 스택 및 라이브 전송 계약
- [QA Channel](/ko/channels/qa-channel) — 저장소 기반 시나리오를 위한 합성 채널 어댑터
- [테스트](/ko/help/testing) — 테스트 실행 및 QA 커버리지 추가
- [Matrix](/ko/channels/matrix) — 테스트 대상 채널 Plugin
