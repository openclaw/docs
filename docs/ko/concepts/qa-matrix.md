---
read_when:
    - 로컬에서 pnpm openclaw qa matrix 실행하기
    - Matrix QA 시나리오 추가 또는 선택
    - Matrix QA 실패, 시간 초과 또는 중단된 정리 작업 분류하기
summary: 'Docker 기반 Matrix 라이브 QA 레인에 대한 유지관리자 참조: CLI, 프로필, 환경 변수, 시나리오 및 출력 아티팩트.'
title: Matrix QA
x-i18n:
    generated_at: "2026-07-12T15:12:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 레인은 Docker의 일회용 Tuwunel 홈서버를 대상으로 번들 `@openclaw/matrix` Plugin을 실행하며, 임시 드라이버, SUT, 관찰자 계정과 미리 구성된 방을 사용합니다. 이는 Matrix의 실제 전송 계층을 사용하는 라이브 커버리지입니다.

유지관리자 전용 도구입니다. 패키징된 OpenClaw 릴리스에는 `qa-lab`이 포함되지 않으므로 `openclaw qa`는 소스 체크아웃에서만 실행되며, Plugin 설치 단계 없이 번들 러너를 직접 로드합니다.

더 광범위한 QA 프레임워크 맥락은 [QA 개요](/ko/concepts/qa-e2e-automation)를 참조하십시오.

## 빠른 시작

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

일반 `pnpm openclaw qa matrix`는 `--profile all`로 실행되며 첫 번째 실패에서 중단되지 않습니다. `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`를 사용하여 전체 인벤토리를 여러 병렬 작업에 분할하십시오.

## 레인의 작업

1. 제한 범위 내에서 민감 정보를 제거하는 요청/응답 레코더 뒤에 Docker의 일회용 Tuwunel 홈서버(기본 이미지 `ghcr.io/matrix-construct/tuwunel:v1.5.1`, 서버 이름 `matrix-qa.test`, 포트 `28008`)를 프로비저닝합니다.
2. 임시 사용자 3명을 등록합니다. `driver`(인바운드 트래픽 전송), `sut`(테스트 대상 OpenClaw Matrix 계정), `observer`(서드 파티 트래픽 캡처)입니다.
3. 선택한 시나리오에 필요한 방(기본, 스레딩, 미디어, 재시작, 보조, 허용 목록, E2EE, 검증 DM 등)을 미리 구성합니다.
4. 기록된 Tuwunel 경계를 대상으로 기반 계층에 중립적인 `matrix-qa-v1` 프로토콜 프로브를 실행합니다. 단위 테스트는 Matrix 프로토콜 픽스처로 프로브 계약을 검증하며, [#99707](https://github.com/openclaw/openclaw/pull/99707)의 표준 QA 전송 어댑터 호스트가 실제 Crabline 대상 연결을 담당합니다.
5. 실제 Matrix Plugin을 SUT 계정으로 한정하여 하위 OpenClaw Gateway를 시작합니다.
6. 시나리오를 순차적으로 실행하고, 드라이버/관찰자 Matrix 클라이언트를 통해 이벤트를 관찰하며 기록된 트래픽에서 라우트/상태 예상값을 도출합니다.
7. 홈서버를 종료하고 보고서와 증거 아티팩트를 작성한 후 종료합니다.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 공통 플래그

| 플래그                | 기본값                                        | 설명                                                                                                                                               |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 시나리오 프로필입니다. [프로필](#profiles)을 참조하십시오.                                                                                        |
| `--fail-fast`         | 꺼짐                                          | 첫 번째로 실패한 검사 또는 시나리오 이후 중단합니다.                                                                                              |
| `--scenario <id>`     | -                                             | 이 시나리오만 실행합니다. 반복 지정할 수 있습니다. [시나리오](#scenarios)를 참조하십시오.                                                         |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 보고서, 요약, 라우트/상태 인벤토리, 관찰된 이벤트 및 출력 로그가 작성되는 위치입니다. 상대 경로는 `--repo-root`를 기준으로 해석됩니다.             |
| `--repo-root <path>`  | `process.cwd()`                               | 중립적인 작업 디렉터리에서 호출할 때 사용할 저장소 루트입니다.                                                                                    |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 구성 내의 Matrix 계정 ID입니다.                                                                                                        |

### 제공자 플래그

이 레인은 실제 Matrix 전송 계층을 사용하지만 모델 제공자는 구성할 수 있습니다.

| 플래그                   | 기본값             | 설명                                                                                                                                                 |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | 결정론적 모의 디스패치에는 `mock-openai`, 라이브 프런티어 제공자에는 `live-frontier`를 사용합니다. 레거시 별칭 `live-openai`도 계속 작동합니다.       |
| `--model <ref>`          | 제공자 기본값      | 기본 `provider/model` 참조입니다.                                                                                                                    |
| `--alt-model <ref>`      | 제공자 기본값      | 시나리오가 실행 도중 전환할 때 사용할 대체 `provider/model` 참조입니다.                                                                              |
| `--fast`                 | 꺼짐               | 지원되는 경우 제공자의 빠른 모드를 활성화합니다.                                                                                                    |

Matrix QA는 `--credential-source` 또는 `--credential-role`을 허용하지 않습니다. 이 레인은 일회용 사용자를 로컬에서 프로비저닝하며, 임대할 공유 자격 증명 풀이 없습니다.

## 프로필

| 프로필          | 용도                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (기본값) | 전체 카탈로그입니다. 느리지만 포괄적입니다.                                                                                                                                                                           |
| `fast`          | 명령형 라이브 전송 계약을 실행하는 릴리스 게이트 하위 집합입니다. 멘션 게이팅, 허용 목록 차단, 응답 형태, 재시작 후 재개, 반응 관찰, exec 승인 메타데이터 전달 및 E2EE 기본 응답을 검증합니다.                           |
| `transport`     | 전송 계층 수준의 스레딩, DM, 방, 자동 참가, 멘션/허용 목록, 승인 및 반응 시나리오입니다.                                                                                                                              |
| `media`         | 이미지, 오디오, 동영상, PDF, EPUB 첨부 파일 커버리지입니다.                                                                                                                                                          |
| `e2ee-smoke`    | 최소 E2EE 커버리지입니다. 기본 암호화 응답, 스레드 후속 응답, 부트스트랩 성공을 검증합니다.                                                                                                                           |
| `e2ee-deep`     | E2EE 상태 손실, 백업, 키 및 복구 시나리오를 포괄적으로 검증합니다.                                                                                                                                                   |
| `e2ee-cli`      | QA 하네스를 통해 구동되는 `openclaw matrix encryption setup` 및 `verify *` CLI 시나리오입니다.                                                                                                                        |

정확한 매핑은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`에 있습니다.

## 시나리오

공유 Matrix 어댑터는 `openclaw qa suite --channel-driver live --channel matrix`를 통해 다음 표준 YAML 시나리오를 노출합니다.

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn`은 명시적인 `--scenario subagent-thread-spawn`
선택을 통해 계속 사용할 수 있지만, 라이브 하위 에이전트 완료 검증이 안정화될 때까지 기본 공유 Matrix 세트에는 포함되지 않습니다.

나머지 명령형 시나리오 ID 목록은 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`의 `MatrixQaScenarioId` 유니온입니다. 범주는 다음과 같습니다.

- 스레딩: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- 최상위 / DM / 방: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- 스트리밍 및 도구 진행 상황: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- 미디어: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- 라우팅: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- 반응: `matrix-reaction-*`
- 승인: `matrix-approval-*`(exec/Plugin 메타데이터, 청크 분할 폴백, 거부 반응, 스레드 및 `target: "both"` 라우팅)
- 재시작 및 재생: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- 멘션 게이팅, 봇 간 통신 및 허용 목록: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*`(기본 응답, 스레드 후속 응답, 부트스트랩, 복구 키 수명 주기, 상태 손실 변형, 서버 백업 동작, 기기 위생, SAS / QR / DM 검증, 재시작, 아티팩트 민감 정보 제거)
- E2EE CLI: `matrix-e2ee-cli-*`(암호화 설정, 멱등 설정, 부트스트랩 실패, 복구 키 수명 주기, 다중 계정, Gateway 응답 왕복, 자체 검증)

직접 선택한 세트를 실행하려면 `--scenario <id>`를 전달하십시오(반복 지정 가능). 프로필 게이팅을 무시하려면 `--profile all`과 함께 사용하십시오.

## 환경 변수

| 변수                                    | 기본값                                    | 효과                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30분)                          | 전체 실행에 적용되는 엄격한 상한입니다.                                                                                                                                                              |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 초기 카나리아 응답의 제한 시간입니다. 공유 러너에서 첫 Gateway 턴이 느리더라도 시나리오 커버리지가 시작되기 전에 실패하지 않도록 릴리스 CI에서는 이 값을 늘립니다.                                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 부정형 무응답 어설션의 대기 구간입니다. 실행 제한 시간 이하(`<=`)로 제한됩니다.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 종료 작업의 제한 시간입니다. 실패 시 복구용 `docker compose ... down --remove-orphans` 명령이 표시됩니다.                                                                                      |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 다른 Tuwunel 버전을 대상으로 검증할 때 홈서버 이미지를 재정의합니다.                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 켜짐                                      | `0`은 stderr의 `[matrix-qa] ...` 진행률 줄을 표시하지 않습니다. `1`은 강제로 표시합니다.                                                                                                              |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 수정됨                                    | `1`은 `matrix-qa-observed-events.json`에 메시지 본문과 `formatted_body`를 유지합니다. 기본값은 CI 아티팩트를 안전하게 유지하기 위해 내용을 수정합니다.                                                |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 꺼짐                                      | `1`은 아티팩트 기록 후 결정론적 `process.exit`를 건너뜁니다. matrix-js-sdk의 네이티브 암호화 핸들이 아티팩트 완료 후에도 이벤트 루프를 유지할 수 있으므로 기본값은 강제로 종료합니다.                    |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 설정되지 않음                             | 외부 실행기(예: `scripts/run-node.mjs`)에서 설정하면 Matrix QA는 자체 tee를 시작하는 대신 해당 로그 경로를 재사용합니다.                                                                              |

## 출력 아티팩트

`--output-dir`에 기록됩니다(기본값은 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`이며, 연속 실행 시 서로 덮어쓰지 않습니다).

- `matrix-qa-report.md`: Markdown 프로토콜 보고서입니다(통과, 실패, 건너뜀 항목과 그 이유).
- `matrix-qa-summary.json`: CI 구문 분석과 대시보드에 적합한 구조화된 요약입니다.
- `matrix-qa-route-state-manifest.json`: 시나리오 ID를 키로 사용하는 동적 `matrix-qa-v1` 인벤토리입니다. 수정된 경로/본문 형태, 요청 순서, 관찰된 재시도, 오류, 동기화 토큰 연속성, 해당 실행 중 관찰된 기기/키/미디어/백업 상태 계열을 기록합니다. 이는 실행 가능한 증거이며 저장소에 체크인된 기준선이 아닙니다.
- `matrix-qa-observed-events.json`: 드라이버 및 관찰자 클라이언트에서 관찰된 Matrix 이벤트입니다. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`이 아니면 본문은 수정되며, 승인 메타데이터는 선별된 안전한 필드와 잘린 명령 미리보기로 요약됩니다.
- `matrix-qa-output.log`: 실행의 stdout/stderr를 결합한 로그입니다. `OPENCLAW_RUN_NODE_OUTPUT_LOG`가 설정된 경우 외부 실행기의 로그를 대신 재사용합니다.

## 문제 해결 팁

- **실행이 끝날 무렵 멈춤:** `matrix-js-sdk` 네이티브 암호화 핸들이 하네스보다 오래 유지될 수 있습니다. 기본값은 아티팩트 기록 후 깔끔하게 `process.exit`를 강제합니다. `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`을 설정하면 프로세스가 계속 남아 있을 수 있습니다.
- **정리 오류:** 출력된 복구 명령(`docker compose ... down --remove-orphans` 호출)을 찾아 수동으로 실행하여 홈서버 포트를 해제하십시오.
- **CI에서 부정형 어설션 구간이 불안정함:** CI가 빠르면 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`(기본값 8초)를 낮추고, 느린 공유 러너에서는 높이십시오.
- **버그 보고서에 수정된 본문이 필요함:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`로 다시 실행하고 `matrix-qa-observed-events.json`을 첨부하십시오. 생성된 아티팩트는 민감한 정보로 취급하십시오.
- **다른 Tuwunel 버전:** 테스트 중인 버전을 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`에 지정하십시오. 이 레인은 고정된 기본 이미지만 체크인합니다.

## 라이브 전송 계약

Matrix는 [QA 개요: 라이브 전송 커버리지](/ko/concepts/qa-e2e-automation#live-transport-coverage)에 정의된 단일 계약 체크리스트를 공유하는 세 가지 라이브 전송 레인(Matrix, Telegram, Discord) 중 하나입니다. `qa-channel`은 계속해서 광범위한 합성 테스트 모음이며 의도적으로 해당 매트릭스에 포함되지 않습니다.

## 관련 문서

- [QA 개요](/ko/concepts/qa-e2e-automation): 전체 QA 스택 및 라이브 전송 계약
- [QA 채널](/ko/channels/qa-channel): 저장소 기반 시나리오를 위한 합성 채널 어댑터
- [테스트](/ko/help/testing): 테스트 실행 및 QA 커버리지 추가
- [Matrix](/ko/channels/matrix): 테스트 대상 채널 Plugin
