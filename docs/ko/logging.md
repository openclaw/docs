---
read_when:
    - OpenClaw 로깅에 대한 초보자 친화적인 개요가 필요합니다
    - 로그 수준, 형식 또는 민감 정보 삭제를 구성하려는 경우
    - 문제를 해결하는 중이며 로그를 빠르게 찾아야 합니다
summary: 파일 로그, 콘솔 출력, CLI 테일링 및 Control UI 로그 탭
title: 로깅
x-i18n:
    generated_at: "2026-07-12T00:55:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw에는 두 가지 주요 로그 표면이 있습니다.

- Gateway가 기록하는 **파일 로그**(JSON 라인).
- Gateway를 실행 중인 터미널의 **콘솔 출력**.

Control UI의 **로그** 탭은 Gateway 파일 로그를 실시간으로 추적합니다. 이 페이지에서는
로그의 위치, 읽는 방법, 로그 수준과 형식을 구성하는 방법을 설명합니다.

## 로그 위치

기본적으로 Gateway는 날짜별 순환 로그 파일을 기록합니다.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 Gateway 호스트의 로컬 시간대를 사용합니다. `/tmp/openclaw`이 안전하지 않거나
사용할 수 없는 경우(Windows에서는 항상 해당) OpenClaw는 대신 OS 임시 디렉터리 아래의
사용자 범위 `openclaw-<uid>` 디렉터리를 사용합니다. 날짜별 로그 파일은
24시간 후 정리됩니다.

다음 기록이 `logging.maxFileBytes`(기본값: 100MB)를 초과하게 되면 각 파일이
순환됩니다. OpenClaw는 활성 파일 옆에 `openclaw-YYYY-MM-DD.1.log`와 같은
번호가 지정된 보관 파일을 최대 5개까지 유지하며, 진단 기록을 중단하지 않고
새 활성 로그에 계속 기록합니다.

`~/.openclaw/openclaw.json`에서 경로를 재정의할 수 있습니다.

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그를 읽는 방법

### CLI: 실시간 추적(권장)

RPC를 통해 Gateway 로그 파일을 추적합니다.

```bash
openclaw logs --follow
```

옵션:

| 플래그              | 기본값   | 동작                                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | 꺼짐     | 계속 추적하며, 연결이 끊기면 백오프를 적용해 다시 연결                                |
| `--limit <n>`       | `200`    | 가져오기당 최대 라인 수                                                               |
| `--max-bytes <n>`   | `250000` | 가져오기당 읽을 최대 바이트 수                                                        |
| `--interval <ms>`   | `1000`   | 추적 중 폴링 간격                                                                     |
| `--json`            | 꺼짐     | 라인 구분 JSON(라인당 이벤트 하나)                                                    |
| `--plain`           | 꺼짐     | TTY 세션에서 일반 텍스트 강제 적용                                                    |
| `--no-color`        | —        | ANSI 색상 비활성화                                                                    |
| `--utc`             | 꺼짐     | 타임스탬프를 UTC로 표시(기본값은 로컬 시간)                                           |
| `--local-time`      | 꺼짐     | 로컬 시간 기본값을 위한 호환 표기이며, 그 외에는 아무 효과가 없음                    |
| `--url` / `--token` | —        | 표준 Gateway RPC 플래그                                                               |
| `--timeout <ms>`    | `30000`  | Gateway RPC 시간 초과                                                                 |
| `--expect-final`    | 꺼짐     | 에이전트 기반 RPC의 최종 응답 대기 플래그(공유 클라이언트 계층을 통해 여기서도 허용) |

출력 모드:

- **TTY 세션**: 보기 좋고 색상이 적용된 구조화 로그 라인.
- **비TTY 세션**: 일반 텍스트.

명시적인 `--url`을 전달하면 CLI는 구성 또는 환경 자격 증명을 자동으로 적용하지
않습니다. 직접 `--token`을 포함해야 하며, 그렇지 않으면 호출이
`gateway url override requires explicit credentials` 오류로 실패합니다.

JSON 모드에서 CLI는 `type` 태그가 지정된 객체를 내보냅니다.

- `meta`: 스트림 메타데이터(파일, 소스, 소스 종류, 서비스, 커서, 크기)
- `log`: 구문 분석된 로그 항목
- `notice`: 잘림/순환 안내
- `raw`: 구문 분석되지 않은 로그 라인
- `error`: Gateway 연결 실패(stderr에 기록)

암시적 local loopback Gateway가 페어링을 요청하거나, 연결 중 종료되거나,
`logs.tail`이 응답하기 전에 시간 초과되면 `openclaw logs`는 구성된 Gateway
파일 로그로 자동 대체합니다. 명시적인 `--url` 대상은 이 대체 동작을 사용하지
않습니다. `openclaw logs --follow`는 더 엄격합니다. Linux에서는 사용 가능한
경우 PID를 기준으로 활성 사용자 systemd Gateway 저널을 사용하며, 그렇지 않으면
오래되었을 수 있는 병렬 파일을 추적하는 대신 백오프를 적용해 실시간 Gateway
연결을 재시도합니다.

Gateway에 연결할 수 없으면 CLI는 다음 명령을 실행하라는 간단한 안내를 출력합니다.

```bash
openclaw doctor
```

### Control UI(웹)

Control UI의 **로그** 탭은 `logs.tail`을 사용하여 같은 파일을 추적합니다.
여는 방법은 [Control UI](/ko/web/control-ui)를 참조하세요.

### 채널 전용 로그

채널 활동(WhatsApp/Telegram 등)을 필터링하려면 다음을 사용합니다.

```bash
openclaw channels logs --channel whatsapp
```

`--channel`의 기본값은 `all`이며, `--lines <n>`(기본값 200)과 `--json`도
사용할 수 있습니다.

## 로그 형식

### 파일 로그(JSONL)

로그 파일의 각 라인은 JSON 객체입니다. CLI와 Control UI는 이러한 항목을
구문 분석하여 구조화된 출력(시간, 수준, 하위 시스템, 메시지)을 표시합니다.

파일 로그 JSONL 레코드에는 사용 가능한 경우 기계적으로 필터링할 수 있는
다음 최상위 필드도 포함됩니다.

- `hostname`: Gateway 호스트 이름.
- `message`: 전체 텍스트 검색을 위해 평탄화된 로그 메시지 텍스트.
- `agent_id`: 로그 호출에 에이전트 컨텍스트가 포함된 경우 활성 에이전트 ID.
- `session_id`: 로그 호출에 세션 컨텍스트가 포함된 경우 활성 세션 ID/키.
- `channel`: 로그 호출에 채널 컨텍스트가 포함된 경우 활성 채널.

OpenClaw는 이러한 필드와 함께 원래의 구조화된 로그 인수를 보존하므로
번호가 지정된 tslog 인수 키를 읽는 기존 파서도 계속 작동합니다.

대화, 실시간 음성 및 관리형 방 활동은 동일한 파일 로그 파이프라인을 통해
크기가 제한된 수명 주기 로그 레코드를 내보냅니다. 이러한 레코드에는 사용 가능한
경우 이벤트 유형, 모드, 전송 방식, 제공자, 크기/시간 측정값이 포함되지만,
대화 내용 텍스트, 오디오 페이로드, 턴 ID, 통화 ID 및 제공자 항목 ID는
제외됩니다.

### 콘솔 출력

콘솔 로그는 **TTY를 인식**하며 가독성을 위해 형식이 지정됩니다.

- 하위 시스템 접두사(예: `gateway/channels/whatsapp`)
- 수준별 색상(info/warn/error)
- 선택적 압축 또는 JSON 모드

콘솔 형식은 `logging.consoleStyle`로 제어합니다.

### Gateway WebSocket 로그

`openclaw gateway`에는 RPC 트래픽용 WebSocket 프로토콜 로깅도 있습니다.

- 일반 모드: 주목할 만한 결과만 표시(오류, 구문 분석 오류, 느린 호출)
- `--verbose`: 모든 요청/응답 트래픽
- `--ws-log auto|compact|full`: 상세 출력 렌더링 형식 선택
- `--compact`: `--ws-log compact`의 별칭

예:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 로깅 구성

모든 로깅 구성은 `~/.openclaw/openclaw.json`의 `logging` 아래에 있습니다.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 로그 수준

수준: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: **파일 로그**(JSONL) 수준(기본값: `info`).
- `logging.consoleLevel`: **콘솔** 상세 수준.

**`OPENCLAW_LOG_LEVEL`** 환경 변수(예: `OPENCLAW_LOG_LEVEL=debug`)를 통해 둘 다 재정의할 수 있습니다. 환경 변수는 구성 파일보다 우선하므로 `openclaw.json`을 편집하지 않고도 단일 실행의 상세 수준을 높일 수 있습니다. 전역 CLI 옵션 **`--log-level <level>`**(예: `openclaw --log-level debug gateway run`)을 전달할 수도 있으며, 이 옵션은 해당 명령에서 환경 변수를 재정의합니다.

`--verbose`는 콘솔 출력과 WS 로그 상세 수준에만 영향을 미치며,
파일 로그 수준은 변경하지 않습니다.

### 대상별 모델 전송 진단

제공자 호출을 디버깅할 때는 모든 로그를 `debug`로 높이는 대신
대상별 환경 플래그를 사용하세요.

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

사용 가능한 플래그:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: 요청 시작, 가져오기 응답, SDK
  헤더, 첫 번째 스트리밍 이벤트, 스트림 완료 및 전송 오류를
  `info` 수준으로 내보냅니다.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: 모델 요청 로그에 크기가 제한된
  요청 페이로드 요약을 포함합니다.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: 페이로드 요약에 모델에 노출되는
  모든 도구 이름을 포함합니다.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: 민감 정보가 제거되고 크기가
  제한된 JSON 페이로드 스냅샷을 포함합니다. 디버깅 중에만 사용하세요.
  비밀은 제거되지만 프롬프트와 메시지 텍스트는 여전히 포함될 수 있습니다.
- `OPENCLAW_DEBUG_SSE=events`: 첫 이벤트 및 스트림 완료 시간을 내보냅니다.
- `OPENCLAW_DEBUG_SSE=peek`: 민감 정보가 제거된 처음 5개의 SSE 이벤트
  페이로드도 내보내며, 이벤트별 크기가 제한됩니다.
- `OPENCLAW_DEBUG_CODE_MODE=1`: 코드 모드가 도구 표면을 소유하여 네이티브
  제공자 도구가 숨겨지는 경우를 포함해 코드 모드 모델 표면 진단을
  내보냅니다.

이러한 플래그는 일반 OpenClaw 로깅을 통해 기록되므로 `openclaw logs --follow`와
Control UI의 로그 탭에 표시됩니다. 플래그를 사용하지 않아도 동일한 진단을
`debug` 수준에서 확인할 수 있습니다.

`[model-fetch]` 시작 및 응답 메타데이터(제공자, API, 모델, 상태,
지연 시간, 그리고 메서드, URL, 시간 초과, 프록시, 정책 등의 요청 필드)는
`OPENCLAW_DEBUG_MODEL_TRANSPORT`와 관계없이 항상 `info` 수준으로
내보내므로 디버그 플래그 없이도 기본적인 모델 전송 상태를 확인할 수 있습니다.

### 추적 상관관계

파일 로그는 JSONL입니다. 로그 호출에 유효한 진단 추적 컨텍스트가 포함되면
OpenClaw는 추적 필드를 최상위 JSON 키(`traceId`, `spanId`,
`parentSpanId`, `traceFlags`)로 기록하므로 외부 로그 처리기가 해당 라인을
OTEL 스팬 및 제공자의 `traceparent` 전파와 연계할 수 있습니다.

Gateway HTTP 요청과 Gateway WebSocket 프레임은 내부 요청 추적 범위를
설정합니다. 해당 비동기 범위 내에서 내보낸 로그와 진단 이벤트는 명시적인
추적 컨텍스트를 전달하지 않는 경우 요청 추적을 상속합니다. 에이전트 실행 및
모델 호출 추적은 활성 요청 추적의 자식이 되므로 원시 요청이나 모델 콘텐츠를
기록하지 않고도 로컬 로그, 진단 스냅샷, OTEL 스팬 및 신뢰할 수 있는 제공자의
`traceparent` 헤더를 `traceId`로 연결할 수 있습니다.

OpenTelemetry 로그 내보내기가 활성화되면 대화 수명 주기 로그 레코드도
파일 로그와 동일하게 크기가 제한된 속성을 사용하여 diagnostics-otel 로그
내보내기로 전달됩니다. `diagnostics.otel.logsExporter`를 구성하여 OTLP,
stdout JSONL 또는 두 출력 대상을 모두 선택하세요.

### 모델 호출 크기 및 시간

모델 호출 진단은 원시 프롬프트 또는 응답 콘텐츠를 캡처하지 않고
크기가 제한된 요청/응답 측정값을 기록합니다.

- `requestPayloadBytes`: 최종 모델 요청 페이로드의 UTF-8 바이트 크기
- `responseStreamBytes`: 스트리밍된 모델 응답 청크 페이로드의 UTF-8 바이트 크기.
  빈도가 높은 텍스트, 사고 과정 및 도구 호출 델타 이벤트에서는 전체 `partial`
  스냅샷 대신 증분 `delta` 바이트만 계산합니다.
- `timeToFirstByteMs`: 첫 번째 스트리밍 응답 이벤트까지 경과한 시간
- `durationMs`: 총 모델 호출 시간

진단 내보내기가 활성화되면 이러한 필드를 진단 스냅샷, 모델 호출 Plugin 훅 및
OTEL 모델 호출 스팬/메트릭에서 사용할 수 있습니다.

### 콘솔 형식

`logging.consoleStyle`:

- `pretty`: 타임스탬프와 색상이 적용된 사용자 친화적 형식.
- `compact`: 더 간결한 출력(긴 세션에 적합).
- `json`: 라인당 JSON 하나(로그 처리기용).

### 민감 정보 제거

OpenClaw는 민감한 토큰이 콘솔 출력, 파일 로그, OTLP 로그 레코드,
영구 저장된 세션 대화 내용 텍스트 또는 Control UI 도구 이벤트
페이로드(도구 시작 인수, 부분/최종 결과 페이로드, 파생된 실행 출력 및
패치 요약)에 기록되기 전에 제거할 수 있습니다.

- `logging.redactSensitive`: `off` | `tools`(기본값: `tools`)
- `logging.redactPatterns`: 로그/대화 내용 출력의 기본 집합을 대체하는 정규식 문자열 목록. Control UI 도구 페이로드에는 사용자 지정 패턴이 기본 제공 패턴에 추가로 적용되므로, 패턴을 추가해도 기본값에서 이미 감지되는 값의 민감 정보 제거가 약화되지 않습니다.

파일 로그와 세션 대화 내용은 JSONL 형식을 유지하지만, 일치하는 비밀 값은
라인이나 메시지가 디스크에 기록되기 전에 마스킹됩니다. 민감 정보 제거는
최선형으로 적용됩니다. 텍스트를 포함한 메시지 콘텐츠와 로그 문자열에는
적용되지만 모든 식별자나 바이너리 페이로드 필드에 적용되는 것은 아닙니다.

기본 제공 설정은 카드 번호, CVC/CVV, 공유 결제 토큰, 결제 자격 증명처럼 자주 사용되는 API 자격 증명 및 결제 자격 증명 필드 이름이 JSON 필드, URL 매개변수, CLI 플래그 또는 할당문으로 나타날 때 이를 처리합니다.

`logging.redactSensitive: "off"`는 이러한 일반 로그/트랜스크립트 정책만 비활성화합니다. OpenClaw는 UI 클라이언트, 지원 번들, 진단 옵저버, 승인 프롬프트 또는 에이전트 도구에 표시될 수 있는 안전 경계 페이로드를 계속 마스킹합니다. 예로는 Control UI 도구 호출 이벤트, `sessions_history` 출력, 진단 지원 내보내기, 제공자 오류 관찰 결과, 실행 승인 명령 표시, Gateway WebSocket 프로토콜 로그가 있습니다. 사용자 지정 `logging.redactPatterns`를 사용하면 이러한 표면에 프로젝트별 패턴을 계속 추가할 수 있습니다.

## 진단 및 OpenTelemetry

진단은 모델 실행과 메시지 흐름 원격 측정(Webhook, 대기열 처리, 세션 상태)을 위한 구조화된 기계 판독 가능 이벤트입니다. 진단은 로그를 대체하지 **않으며**, 메트릭, 추적 및 내보내기에 데이터를 제공합니다. 이벤트는 기본적으로 프로세스 내에서 생성됩니다(비활성화하려면 `diagnostics.enabled: false` 설정). 이벤트 내보내기는 별도로 구성합니다.

서로 인접한 두 가지 표면은 다음과 같습니다.

- **OpenTelemetry 내보내기** — OTLP/HTTP를 통해 메트릭, 추적 및 로그를 OpenTelemetry 호환 수집기나 백엔드(Datadog, Grafana, Honeycomb, New Relic, Tempo 등)로 전송합니다. 전체 구성, 신호 카탈로그, 메트릭/스팬 이름, 환경 변수 및 개인정보 보호 모델은 전용 페이지에서 확인할 수 있습니다.
  [OpenTelemetry 내보내기](/ko/gateway/opentelemetry).
- **진단 플래그** — `logging.level`을 높이지 않고 추가 로그를 `logging.file`로 전달하는 특정 디버그 로그 플래그입니다. 플래그는 대소문자를 구분하지 않으며 와일드카드(`telegram.*`, `*`)를 지원합니다. `diagnostics.flags`에서 구성하거나 `OPENCLAW_DIAGNOSTICS=...` 환경 변수 재정의를 사용하십시오. 전체 가이드:
  [진단 플래그](/ko/diagnostics/flags).

수집기로 OTLP 내보내기를 구성하려면 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하십시오.

## 문제 해결 팁

- **Gateway에 연결할 수 없습니까?** 먼저 `openclaw doctor`를 실행하십시오.
- **로그가 비어 있습니까?** Gateway가 실행 중이며 `logging.file`에 지정된 파일 경로에 기록하고 있는지 확인하십시오.
- **더 자세한 정보가 필요합니까?** `logging.level`을 `debug` 또는 `trace`로 설정한 후 다시 시도하십시오.

## 관련 문서

- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) — OTLP/HTTP 내보내기, 메트릭/스팬 카탈로그, 개인정보 보호 모델
- [진단 플래그](/ko/diagnostics/flags) — 특정 디버그 로그 플래그
- [Gateway 로깅 내부 구조](/ko/gateway/logging) — WS 로그 스타일, 하위 시스템 접두사 및 콘솔 캡처
- [구성 참조](/ko/gateway/configuration-reference#diagnostics) — 전체 `diagnostics.*` 필드 참조
