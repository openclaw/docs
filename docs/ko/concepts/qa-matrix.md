---
read_when:
    - 로컬에서 pnpm openclaw qa matrix 실행하기
    - Matrix QA 시나리오 추가 또는 선택
    - Matrix QA 실패, 시간 초과 또는 정리 중 멈춤 분류
summary: 'Docker 기반 Matrix 라이브 QA 레인을 위한 유지관리자 참조 문서: CLI, 프로필, 환경 변수, 시나리오, 출력 아티팩트.'
title: Matrix 품질 보증
x-i18n:
    generated_at: "2026-07-04T20:29:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 레인은 Docker의 일회용 Tuwunel homeserver에 대해 번들된 `@openclaw/matrix` Plugin을 실행하며, 임시 driver, SUT, observer 계정과 시드된 방을 사용합니다. Matrix를 위한 실제 전송 기반 live 보장 범위입니다.

이는 관리자 전용 도구입니다. 패키징된 OpenClaw 릴리스는 의도적으로 `qa-lab`을 제외하므로, `openclaw qa`는 소스 체크아웃에서만 사용할 수 있습니다. 소스 체크아웃은 번들된 러너를 직접 로드합니다. Plugin 설치 단계는 필요하지 않습니다.

더 넓은 QA 프레임워크 맥락은 [QA 개요](/ko/concepts/qa-e2e-automation)를 참조하세요.

## 빠른 시작

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

일반 `pnpm openclaw qa matrix`는 `--profile all`을 실행하며 첫 실패에서 중지하지 않습니다. 릴리스 게이트에는 `--profile fast --fail-fast`를 사용하세요. 전체 인벤토리를 병렬로 실행할 때는 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`로 카탈로그를 샤딩하세요.

## 레인이 수행하는 작업

1. 제한된 민감정보 삭제 요청/응답 레코더 뒤에서 Docker에 일회용 Tuwunel homeserver를 프로비저닝합니다. 기본 이미지는 `ghcr.io/matrix-construct/tuwunel:v1.5.1`, 서버 이름은 `matrix-qa.test`, 포트는 `28008`입니다.
2. 세 명의 임시 사용자를 등록합니다. `driver`(인바운드 트래픽 전송), `sut`(테스트 대상 OpenClaw Matrix 계정), `observer`(타사 트래픽 캡처)입니다.
3. 선택된 시나리오에 필요한 방을 시드합니다. main, threading, media, restart, secondary, allowlist, E2EE, verification DM 등이 포함됩니다.
4. 기록된 Tuwunel 경계에 대해 기반 중립적인 `matrix-qa-v1` 프로토콜 프로브를 실행합니다. 단위 테스트는 Matrix 프로토콜 픽스처로 프로브 계약을 증명하며, [#99707](https://github.com/openclaw/openclaw/pull/99707)의 표준 QA 전송 어댑터 호스트가 실제 Crabline 대상 배선을 소유합니다.
5. SUT 계정으로 범위가 지정된 실제 Matrix Plugin과 함께 하위 OpenClaw Gateway를 시작합니다. 하위 프로세스에는 `qa-channel`이 로드되지 않습니다.
6. 시나리오를 순서대로 실행하고, driver/observer Matrix 클라이언트를 통해 이벤트를 관찰하며, 기록된 트래픽에서 라우트/상태 기대값을 도출합니다.
7. homeserver를 종료하고, 보고서와 증거 아티팩트를 작성한 뒤 종료합니다.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 일반 플래그

| 플래그                  | 기본값                                       | 설명                                                                                                                                   |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 시나리오 프로필입니다. [프로필](#profiles)을 참조하세요.                                                                                                  |
| `--fail-fast`         | 꺼짐                                           | 첫 번째 실패한 검사 또는 시나리오 후 중지합니다.                                                                                                |
| `--scenario <id>`     | -                                             | 이 시나리오만 실행합니다. 반복 가능합니다. [시나리오](#scenarios)를 참조하세요.                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 보고서, 요약, 라우트/상태 인벤토리, 관찰된 이벤트, 출력 로그가 작성되는 위치입니다. 상대 경로는 `--repo-root` 기준으로 해석됩니다. |
| `--repo-root <path>`  | `process.cwd()`                               | 중립 작업 디렉터리에서 호출할 때의 저장소 루트입니다.                                                                               |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 구성 내부의 Matrix 계정 ID입니다.                                                                                               |

### 제공자 플래그

레인은 실제 Matrix 전송을 사용하지만 모델 제공자는 구성할 수 있습니다.

| 플래그                     | 기본값          | 설명                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 결정적 모의 디스패치에는 `mock-openai`, live 프런티어 제공자에는 `live-frontier`를 사용합니다. 레거시 별칭 `live-openai`도 계속 동작합니다. |
| `--model <ref>`          | 제공자 기본값 | 기본 `provider/model` 참조입니다.                                                                                                             |
| `--alt-model <ref>`      | 제공자 기본값 | 시나리오가 실행 중간에 전환하는 대체 `provider/model` 참조입니다.                                                                            |
| `--fast`                 | 꺼짐              | 지원되는 경우 제공자 fast 모드를 활성화합니다.                                                                                                |

Matrix QA는 `--credential-source` 또는 `--credential-role`을 허용하지 않습니다. 레인은 일회용 사용자를 로컬로 프로비저닝하며, 임대할 공유 자격 증명 풀이 없습니다.

## 프로필

선택된 프로필이 실행할 시나리오를 결정합니다.

| 프로필         | 사용 용도                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (기본값) | 전체 카탈로그입니다. 느리지만 포괄적입니다.                                                                                                                                                                                                   |
| `fast`          | 실제 전송 계약을 실행하는 릴리스 게이트 하위 집합입니다. canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation, exec approval metadata delivery를 포함합니다. |
| `transport`     | 전송 수준 threading, DM, room, autojoin, mention/allowlist, approval, reaction 시나리오입니다.                                                                                                                                  |
| `media`         | 이미지, 오디오, 비디오, PDF, EPUB 첨부 파일 보장 범위입니다.                                                                                                                                                                                  |
| `e2ee-smoke`    | 최소 E2EE 보장 범위입니다. 기본 암호화 답장, 스레드 follow-up, 부트스트랩 성공을 포함합니다.                                                                                                                                                  |
| `e2ee-deep`     | 포괄적인 E2EE 상태 손실, 백업, 키, 복구 시나리오입니다.                                                                                                                                                                     |
| `e2ee-cli`      | QA 하네스를 통해 구동되는 `openclaw matrix encryption setup` 및 `verify *` CLI 시나리오입니다.                                                                                                                                       |

정확한 매핑은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`에 있습니다.

## 시나리오

전체 시나리오 ID 목록은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`의 `MatrixQaScenarioId` 유니언입니다. 범주는 다음을 포함합니다.

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- 최상위 / DM / 방 - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- 스트리밍 및 도구 진행 상황 - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- 미디어 - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- 라우팅 - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- 반응 - `matrix-reaction-*`
- 승인 - `matrix-approval-*`(exec/plugin 메타데이터, 청크된 fallback, 거부 반응, 스레드, `target: "both"` 라우팅)
- 재시작 및 재생 - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- 멘션 게이팅, 봇 간 통신, allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*`(기본 답장, 스레드 follow-up, 부트스트랩, 복구 키 수명 주기, 상태 손실 변형, 서버 백업 동작, 디바이스 위생, SAS / QR / DM 검증, 재시작, 아티팩트 민감정보 삭제)
- E2EE CLI - `matrix-e2ee-cli-*`(암호화 설정, 멱등 설정, 부트스트랩 실패, 복구 키 수명 주기, 다중 계정, Gateway 답장 왕복, 자기 검증)

직접 선택한 집합을 실행하려면 `--scenario <id>`를 전달하세요. 반복 가능합니다. 프로필 게이팅을 무시하려면 `--profile all`과 결합하세요.

## 환경 변수

| 변수                                    | 기본값                                    | 효과                                                                                                                                                                                                |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30분)                          | 전체 실행에 대한 엄격한 상한입니다.                                                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 초기 카나리아 응답에 대한 제한입니다. Release CI는 공유 러너에서 이 값을 높여, 느린 첫 Gateway 턴 때문에 시나리오 커버리지가 시작되기 전에 실패하지 않도록 합니다.                                  |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 부정 no-reply 어설션을 위한 조용한 구간입니다. 실행 제한 시간 이하(`≤`)로 고정됩니다.                                                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 정리에 대한 제한입니다. 실패 표면에는 복구용 `docker compose ... down --remove-orphans` 명령이 포함됩니다.                                                                                   |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 다른 Tuwunel 버전에 대해 검증할 때 homeserver 이미지를 재정의합니다.                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | on                                        | `0`은 stderr의 `[matrix-qa] ...` 진행률 줄을 숨깁니다. `1`은 강제로 표시합니다.                                                                                                                      |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redacted                                  | `1`은 메시지 본문과 `formatted_body`를 `matrix-qa-observed-events.json`에 유지합니다. 기본값은 CI 아티팩트를 안전하게 유지하기 위해 편집 처리합니다.                                                  |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | off                                       | `1`은 아티팩트 작성 후 결정적 `process.exit`를 건너뜁니다. 기본값은 matrix-js-sdk의 네이티브 crypto 핸들이 아티팩트 완료 후에도 이벤트 루프를 계속 살려둘 수 있으므로 강제 종료합니다.              |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 설정되지 않음                             | 외부 런처(예: `scripts/run-node.mjs`)가 설정한 경우, Matrix QA는 자체 tee를 시작하는 대신 해당 로그 경로를 재사용합니다.                                                                            |

## 출력 아티팩트

`--output-dir`에 작성됩니다.

- `matrix-qa-report.md` - Markdown 프로토콜 보고서(통과, 실패, 건너뜀 항목과 그 이유).
- `matrix-qa-summary.json` - CI 파싱 및 대시보드에 적합한 구조화된 요약입니다.
- `matrix-qa-route-state-manifest.json` - 시나리오 id를 키로 하는 동적 `matrix-qa-v1` 인벤토리입니다. 해당 실행 중 관찰된 편집 처리된 route/body 형태, 요청 순서, 관찰된 재시도, 오류, sync-token 연속성, device/key/media/backup 상태 계열을 기록합니다. 이는 체크인된 기준선이 아니라 실행 가능한 증거입니다.
- `matrix-qa-observed-events.json` - 드라이버 및 관찰자 클라이언트에서 관찰된 Matrix 이벤트입니다. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`이 아니면 본문은 편집 처리됩니다. 승인 메타데이터는 선택된 안전한 필드와 잘린 명령 미리보기로 요약됩니다.
- `matrix-qa-output.log` - 실행의 stdout/stderr를 결합한 로그입니다. `OPENCLAW_RUN_NODE_OUTPUT_LOG`가 설정된 경우, 외부 런처의 로그가 대신 재사용됩니다.

기본 출력 디렉터리는 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`이므로 연속 실행이 서로를 덮어쓰지 않습니다.

## 트리아지 팁

- **끝부분에서 실행이 멈춤:** `matrix-js-sdk` 네이티브 crypto 핸들은 하네스보다 오래 유지될 수 있습니다. 기본값은 아티팩트 작성 후 깔끔한 `process.exit`를 강제합니다. `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` 설정을 해제한 경우 프로세스가 남아 있을 수 있습니다.
- **정리 오류:** 출력된 복구 명령(`docker compose ... down --remove-orphans` 호출)을 찾아 homeserver 포트를 해제하도록 수동으로 실행하세요.
- **CI에서 불안정한 부정 어설션 구간:** CI가 빠를 때는 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`(기본값 8초)를 낮추고, 느린 공유 러너에서는 높이세요.
- **버그 보고서에 편집 처리된 본문이 필요함:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`로 다시 실행하고 `matrix-qa-observed-events.json`을 첨부하세요. 생성된 아티팩트는 민감한 것으로 취급하세요.
- **다른 Tuwunel 버전:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`가 테스트 중인 버전을 가리키도록 설정하세요. 이 레인은 고정된 기본 이미지만 체크인합니다.

## 라이브 전송 계약

Matrix는 [QA 개요 → 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 정의된 단일 계약 체크리스트를 공유하는 세 가지 라이브 전송 레인(Matrix, Telegram, Discord) 중 하나입니다. `qa-channel`은 광범위한 합성 제품군으로 유지되며, 의도적으로 해당 매트릭스의 일부가 아닙니다.

## 관련 항목

- [QA 개요](/ko/concepts/qa-e2e-automation) - 전체 QA 스택 및 라이브 전송 계약
- [QA Channel](/ko/channels/qa-channel) - repo 기반 시나리오용 합성 채널 어댑터
- [테스트](/ko/help/testing) - 테스트 실행 및 QA 커버리지 추가
- [Matrix](/ko/channels/matrix) - 테스트 대상 채널 Plugin
