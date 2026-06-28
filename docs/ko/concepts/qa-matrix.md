---
read_when:
    - 로컬에서 pnpm openclaw qa matrix 실행하기
    - Matrix QA 시나리오 추가 또는 선택
    - Matrix QA 실패, 시간 초과 또는 중단된 정리 작업 트리아지
summary: 'Docker 기반 Matrix 라이브 QA 레인을 위한 유지관리자 참조: CLI, 프로필, 환경 변수, 시나리오 및 출력 아티팩트.'
title: 매트릭스 품질 보증
x-i18n:
    generated_at: "2026-05-06T06:23:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Matrix QA lane은 Docker의 일회용 Tuwunel homeserver에서 번들된 `@openclaw/matrix` Plugin을 임시 driver, SUT, observer 계정 및 시드된 room과 함께 실행합니다. Matrix에 대한 실제 transport 기반 live coverage입니다.

이는 maintainer 전용 도구입니다. 패키징된 OpenClaw 릴리스는 의도적으로 `qa-lab`을 포함하지 않으므로, `openclaw qa`는 source checkout에서만 사용할 수 있습니다. Source checkout은 번들된 runner를 직접 로드합니다 - Plugin install 단계는 필요하지 않습니다.

더 넓은 QA framework 맥락은 [QA 개요](/ko/concepts/qa-e2e-automation)를 참조하세요.

## 빠른 시작

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

일반 `pnpm openclaw qa matrix`는 `--profile all`로 실행되며 첫 실패에서 중단하지 않습니다. 릴리스 gate에는 `--profile fast --fail-fast`를 사용하세요. 전체 inventory를 병렬로 실행할 때는 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`로 catalog를 shard하세요.

## lane이 수행하는 작업

1. Docker에서 일회용 Tuwunel homeserver를 provision합니다(기본 image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, server name `matrix-qa.test`, port `28008`).
2. 임시 사용자 세 명을 등록합니다 - `driver`(inbound traffic 전송), `sut`(테스트 대상 OpenClaw Matrix 계정), `observer`(third-party traffic capture).
3. 선택된 scenario에 필요한 room을 seed합니다(main, threading, media, restart, secondary, allowlist, E2EE, verification DM 등).
4. SUT 계정으로 scope된 실제 Matrix Plugin을 사용하여 child OpenClaw gateway를 시작합니다. child에는 `qa-channel`이 로드되지 않습니다.
5. scenario를 순서대로 실행하고 driver/observer Matrix client를 통해 event를 관찰합니다.
6. homeserver를 종료하고 report 및 summary artifact를 작성한 다음 종료합니다.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 공통 flag

| Flag                  | 기본값                                        | 설명                                                                                                                   |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Scenario profile. [Profiles](#profiles)를 참조하세요.                                                                  |
| `--fail-fast`         | off                                           | 첫 번째 check 또는 scenario 실패 후 중단합니다.                                                                        |
| `--scenario <id>`     | -                                             | 이 scenario만 실행합니다. 반복 가능. [Scenarios](#scenarios)를 참조하세요.                                             |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | report, summary, observed event, output log가 작성되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다.    |
| `--repo-root <path>`  | `process.cwd()`                               | 중립 working directory에서 호출할 때의 repository root입니다.                                                          |
| `--sut-account <id>`  | `sut`                                         | QA gateway config 내부의 Matrix account id입니다.                                                                      |

### Provider flag

lane은 실제 Matrix transport를 사용하지만 model provider는 구성할 수 있습니다.

| Flag                     | 기본값           | 설명                                                                                                                                    |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 결정적 mock dispatch에는 `mock-openai`, live frontier provider에는 `live-frontier`를 사용합니다. legacy alias `live-openai`도 작동합니다. |
| `--model <ref>`          | provider default | 기본 `provider/model` ref입니다.                                                                                                        |
| `--alt-model <ref>`      | provider default | scenario가 실행 중간에 전환할 때 사용하는 대체 `provider/model` ref입니다.                                                              |
| `--fast`                 | off              | 지원되는 경우 provider fast mode를 활성화합니다.                                                                                        |

Matrix QA는 `--credential-source` 또는 `--credential-role`을 받지 않습니다. lane은 일회용 사용자를 로컬에서 provision합니다. lease할 공유 credential pool은 없습니다.

## Profile

선택한 profile은 어떤 scenario가 실행될지 결정합니다.

| Profile         | 사용 목적                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | 전체 catalog입니다. 느리지만 exhaustive합니다.                                                                                                                                                                                       |
| `fast`          | live transport contract를 exercise하는 release-gate subset입니다: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation, exec approval metadata delivery. |
| `transport`     | Transport 수준 threading, DM, room, autojoin, mention/allowlist, approval, reaction scenario입니다.                                                                                                                                   |
| `media`         | image, audio, video, PDF, EPUB attachment coverage입니다.                                                                                                                                                                            |
| `e2ee-smoke`    | 최소 E2EE coverage입니다 - 기본 encrypted reply, thread follow-up, bootstrap success.                                                                                                                                                |
| `e2ee-deep`     | exhaustive E2EE state-loss, backup, key, recovery scenario입니다.                                                                                                                                                                    |
| `e2ee-cli`      | QA harness를 통해 구동되는 `openclaw matrix encryption setup` 및 `verify *` CLI scenario입니다.                                                                                                                                       |

정확한 mapping은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`에 있습니다.

## Scenario

전체 scenario id 목록은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`의 `MatrixQaScenarioId` union입니다. category는 다음을 포함합니다.

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming 및 tool progress - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (exec/plugin metadata, chunked fallback, deny reactions, threads, `target: "both"` routing)
- restart 및 replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot, allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (basic reply, thread follow-up, bootstrap, recovery key lifecycle, state-loss variants, server backup behavior, device hygiene, SAS / QR / DM verification, restart, artifact redaction)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, idempotent setup, bootstrap failure, recovery-key lifecycle, multi-account, gateway-reply round-trip, self-verification)

직접 선택한 set을 실행하려면 `--scenario <id>`(반복 가능)를 전달하세요. profile gating을 무시하려면 `--profile all`과 함께 사용하세요.

## 환경 변수

| 변수                                    | 기본값                                    | 효과                                                                                                                                                                                               |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30분)                          | 전체 실행에 대한 엄격한 상한입니다.                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 초기 카나리아 응답의 제한 시간입니다. 릴리스 CI는 공유 러너에서 이 값을 높여, 느린 첫 Gateway 턴 때문에 시나리오 커버리지가 시작되기 전에 실패하지 않도록 합니다.                                  |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 부정 no-reply 어설션을 위한 조용한 구간입니다. 실행 제한 시간 이하(`≤`)로 제한됩니다.                                                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 정리의 제한 시간입니다. 실패 표면에는 복구용 `docker compose ... down --remove-orphans` 명령이 포함됩니다.                                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 다른 Tuwunel 버전에 대해 검증할 때 homeserver 이미지를 재정의합니다.                                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 켜짐                                      | `0`은 stderr의 `[matrix-qa] ...` 진행 줄을 숨깁니다. `1`은 이를 강제로 표시합니다.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 마스킹됨                                  | `1`은 메시지 본문과 `formatted_body`를 `matrix-qa-observed-events.json`에 보존합니다. 기본값은 CI 아티팩트를 안전하게 유지하기 위해 마스킹합니다.                                                   |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 꺼짐                                      | `1`은 아티팩트 작성 후 결정적 `process.exit`를 건너뜁니다. 기본값은 matrix-js-sdk의 네이티브 암호화 핸들이 아티팩트 완료 후에도 이벤트 루프를 계속 살려둘 수 있기 때문에 강제로 종료합니다.        |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 설정 안 됨                                | 외부 실행기(예: `scripts/run-node.mjs`)가 설정하면, Matrix QA는 자체 tee를 시작하지 않고 해당 로그 경로를 재사용합니다.                                                                            |

## 출력 아티팩트

`--output-dir`에 기록됩니다.

- `matrix-qa-report.md` - Markdown 프로토콜 보고서(통과, 실패, 건너뜀, 그리고 그 이유).
- `matrix-qa-summary.json` - CI 파싱과 대시보드에 적합한 구조화된 요약.
- `matrix-qa-observed-events.json` - 드라이버 및 관찰자 클라이언트에서 관찰된 Matrix 이벤트. 본문은 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`이 아닌 한 마스킹됩니다. 승인 메타데이터는 선택된 안전한 필드와 잘린 명령 미리보기로 요약됩니다.
- `matrix-qa-output.log` - 실행의 결합된 stdout/stderr. `OPENCLAW_RUN_NODE_OUTPUT_LOG`가 설정된 경우 외부 실행기의 로그가 대신 재사용됩니다.

기본 출력 디렉터리는 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`이므로 연속 실행이 서로 덮어쓰지 않습니다.

## 트리아지 팁

- **실행이 끝부분 근처에서 멈춤:** `matrix-js-sdk` 네이티브 암호화 핸들은 하네스보다 오래 살아남을 수 있습니다. 기본값은 아티팩트 작성 후 깨끗한 `process.exit`를 강제합니다. `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` 설정을 해제했다면 프로세스가 남아 있을 수 있습니다.
- **정리 오류:** 출력된 복구 명령(`docker compose ... down --remove-orphans` 호출)을 찾아 직접 실행하여 homeserver 포트를 해제하세요.
- **CI에서 불안정한 부정 어설션 구간:** CI가 빠를 때는 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`(기본값 8초)를 낮추고, 느린 공유 러너에서는 높이세요.
- **버그 보고서에 마스킹되지 않은 본문이 필요함:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`로 다시 실행하고 `matrix-qa-observed-events.json`을 첨부하세요. 생성된 아티팩트는 민감한 것으로 취급하세요.
- **다른 Tuwunel 버전:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`가 테스트 중인 버전을 가리키도록 하세요. 이 lane은 고정된 기본 이미지만 검사합니다.

## 라이브 전송 계약

Matrix는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 정의된 단일 계약 체크리스트를 공유하는 세 가지 라이브 전송 lane(Matrix, Telegram, Discord) 중 하나입니다. `qa-channel`은 여전히 광범위한 합성 제품군이며 의도적으로 해당 matrix의 일부가 아닙니다.

## 관련 항목

- [QA 개요](/ko/concepts/qa-e2e-automation) - 전체 QA 스택과 라이브 전송 계약
- [QA Channel](/ko/channels/qa-channel) - repo 기반 시나리오용 합성 채널 어댑터
- [테스트](/ko/help/testing) - 테스트 실행 및 QA 커버리지 추가
- [Matrix](/ko/channels/matrix) - 테스트 대상 채널 Plugin
