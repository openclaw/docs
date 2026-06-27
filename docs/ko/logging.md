---
read_when:
    - OpenClaw 로깅에 대한 초보자 친화적인 개요가 필요합니다
    - 로그 수준, 형식 또는 수정 처리를 구성하려는 경우
    - 문제를 해결 중이며 로그를 빠르게 찾아야 합니다
summary: 파일 로그, 콘솔 출력, CLI tailing 및 Control UI 로그 탭
title: 로깅
x-i18n:
    generated_at: "2026-06-27T17:38:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw에는 두 가지 주요 로그 표면이 있습니다.

- Gateway가 작성하는 **파일 로그**(JSON lines).
- 터미널과 Gateway 디버그 UI에 표시되는 **콘솔 출력**.

Control UI의 **로그** 탭은 Gateway 파일 로그를 tail합니다. 이 페이지에서는
로그가 저장되는 위치, 읽는 방법, 로그 수준과 형식을 구성하는 방법을 설명합니다.

## 로그가 저장되는 위치

기본적으로 Gateway는 다음 위치 아래에 롤링 로그 파일을 작성합니다.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 Gateway 호스트의 로컬 시간대를 사용합니다.

각 파일은 `logging.maxFileBytes`(기본값: 100 MB)에 도달하면 순환됩니다.
OpenClaw는 활성 파일 옆에 `openclaw-YYYY-MM-DD.1.log` 같은 번호가 붙은
아카이브를 최대 5개까지 보관하며, 진단 정보를 억제하는 대신 새 활성 로그에
계속 기록합니다.

`~/.openclaw/openclaw.json`에서 이를 재정의할 수 있습니다.

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그를 읽는 방법

### CLI: 실시간 tail(권장)

CLI를 사용해 RPC를 통해 Gateway 로그 파일을 tail합니다.

```bash
openclaw logs --follow
```

유용한 현재 옵션:

- `--local-time`: 타임스탬프를 로컬 시간대로 렌더링
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 표준 Gateway RPC 플래그
- `--expect-final`: 에이전트 기반 RPC 최종 응답 대기 플래그(공유 클라이언트 계층을 통해 여기서 허용됨)

출력 모드:

- **TTY 세션**: 보기 좋고 색상이 적용된 구조화된 로그 줄.
- **비 TTY 세션**: 일반 텍스트.
- `--json`: 줄 단위 JSON(줄마다 로그 이벤트 1개).
- `--plain`: TTY 세션에서 일반 텍스트 강제 적용.
- `--no-color`: ANSI 색상 비활성화.

명시적인 `--url`을 전달하면 CLI는 구성 또는 환경 자격 증명을 자동 적용하지
않습니다. 대상 Gateway에 인증이 필요하면 `--token`을 직접 포함하세요.

JSON 모드에서 CLI는 `type` 태그가 붙은 객체를 내보냅니다.

- `meta`: 스트림 메타데이터(파일, 커서, 크기)
- `log`: 파싱된 로그 항목
- `notice`: 잘림 / 순환 힌트
- `raw`: 파싱되지 않은 로그 줄

암시적 local loopback Gateway가 페어링을 요청하거나, 연결 중 닫히거나,
`logs.tail`이 응답하기 전에 시간이 초과되면 `openclaw logs`는 구성된
Gateway 파일 로그로 자동 폴백합니다. 명시적 `--url` 대상은 이 폴백을
사용하지 않습니다. `openclaw logs --follow`는 더 엄격합니다. Linux에서는
사용 가능한 경우 PID별 활성 사용자 systemd Gateway 저널을 사용하고, 그렇지
않으면 잠재적으로 오래된 나란한 파일을 따라가는 대신 실시간 Gateway를 계속
재시도합니다.

Gateway에 연결할 수 없으면 CLI는 다음을 실행하라는 짧은 힌트를 출력합니다.

```bash
openclaw doctor
```

### Control UI(웹)

Control UI의 **로그** 탭은 `logs.tail`을 사용해 같은 파일을 tail합니다.
여는 방법은 [Control UI](/ko/web/control-ui)를 참조하세요.

### 채널 전용 로그

채널 활동(WhatsApp/Telegram 등)을 필터링하려면 다음을 사용하세요.

```bash
openclaw channels logs --channel whatsapp
```

## 로그 형식

### 파일 로그(JSONL)

로그 파일의 각 줄은 JSON 객체입니다. CLI와 Control UI는 이러한 항목을
파싱해 구조화된 출력(시간, 수준, 하위 시스템, 메시지)을 렌더링합니다.

파일 로그 JSONL 레코드는 사용 가능한 경우 기계적으로 필터링할 수 있는
최상위 필드도 포함합니다.

- `hostname`: Gateway 호스트 이름.
- `message`: 전체 텍스트 검색을 위한 평탄화된 로그 메시지 텍스트.
- `agent_id`: 로그 호출이 에이전트 컨텍스트를 포함할 때 활성 에이전트 ID.
- `session_id`: 로그 호출이 세션 컨텍스트를 포함할 때 활성 세션 ID/키.
- `channel`: 로그 호출이 채널 컨텍스트를 포함할 때 활성 채널.

OpenClaw는 이러한 필드와 함께 원래의 구조화된 로그 인수를 보존하므로
번호가 붙은 tslog 인수 키를 읽는 기존 파서가 계속 작동합니다.

대화, 실시간 음성, 관리형 방 활동은 이 동일한 파일 로그 파이프라인을 통해
범위가 제한된 수명 주기 로그 레코드를 내보냅니다. 이러한 레코드는 사용 가능한
경우 이벤트 유형, 모드, 전송, 제공자, 크기/타이밍 측정값을 포함하지만
트랜스크립트 텍스트, 오디오 페이로드, 턴 ID, 호출 ID, 제공자 항목 ID는
생략합니다.

### 콘솔 출력

콘솔 로그는 **TTY 인식**이며 읽기 쉽게 형식화됩니다.

- 하위 시스템 접두사(예: `gateway/channels/whatsapp`)
- 수준 색상(info/warn/error)
- 선택적 compact 또는 JSON 모드

콘솔 형식은 `logging.consoleStyle`로 제어됩니다.

### Gateway WebSocket 로그

`openclaw gateway`에는 RPC 트래픽을 위한 WebSocket 프로토콜 로깅도 있습니다.

- 일반 모드: 흥미로운 결과만(오류, 파싱 오류, 느린 호출)
- `--verbose`: 모든 요청/응답 트래픽
- `--ws-log auto|compact|full`: verbose 렌더링 스타일 선택
- `--compact`: `--ws-log compact`의 별칭

예시:

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

- `logging.level`: **파일 로그**(JSONL) 수준.
- `logging.consoleLevel`: **콘솔** 상세 수준.

**`OPENCLAW_LOG_LEVEL`** 환경 변수(예: `OPENCLAW_LOG_LEVEL=debug`)로 둘 다 재정의할 수 있습니다. 환경 변수는 구성 파일보다 우선하므로 `openclaw.json`을 편집하지 않고 단일 실행에 대해 상세 수준을 높일 수 있습니다. 전역 CLI 옵션 **`--log-level <level>`**(예: `openclaw --log-level debug gateway run`)도 전달할 수 있으며, 이 옵션은 해당 명령에 대해 환경 변수를 재정의합니다.

`--verbose`는 콘솔 출력과 WS 로그 상세 수준에만 영향을 주며 파일 로그 수준은
변경하지 않습니다.

### 대상 모델 전송 진단

제공자 호출을 디버깅할 때는 모든 로그를 `debug`로 높이는 대신 대상 환경
플래그를 사용하세요.

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

사용 가능한 플래그:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: 요청 시작, fetch 응답, SDK 헤더,
  첫 스트리밍 이벤트, 스트림 완료, 전송 오류를 `info` 수준으로 내보냅니다.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: 모델 요청 로그에 범위가 제한된
  요청 페이로드 요약을 포함합니다.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: 페이로드 요약에 모든 모델 대상
  도구 이름을 포함합니다.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: 수정되고 크기가 제한된 JSON
  페이로드 스냅샷을 포함합니다. 디버깅 중에만 사용하세요. 비밀은 수정되지만
  프롬프트와 메시지 텍스트는 여전히 존재할 수 있습니다.
- `OPENCLAW_DEBUG_SSE=events`: 첫 이벤트와 스트림 완료 타이밍을 내보냅니다.
- `OPENCLAW_DEBUG_SSE=peek`: 이벤트별로 크기가 제한된 처음 5개의 수정된
  SSE 이벤트 페이로드도 내보냅니다.
- `OPENCLAW_DEBUG_CODE_MODE=1`: 코드 모드가 도구 표면을 소유하기 때문에
  네이티브 제공자 도구가 숨겨지는 경우를 포함해 코드 모드 모델 표면 진단을
  내보냅니다.

이러한 플래그는 일반 OpenClaw 로깅을 통해 로그를 기록하므로
`openclaw logs --follow`와 Control UI 로그 탭에서 표시됩니다. 플래그가
없어도 동일한 진단은 `debug` 수준에서 계속 사용할 수 있습니다.

`[model-fetch]` 시작 및 응답 메타데이터(제공자, API, 모델, 상태, 지연 시간,
메서드, URL, 제한 시간, 프록시, 정책 같은 요청 필드)는
`OPENCLAW_DEBUG_MODEL_TRANSPORT`와 관계없이 항상 `info` 수준으로
내보내므로, 기본 모델 전송 위생은 디버그 플래그 없이도 확인할 수 있습니다.

### 추적 상관관계

파일 로그는 JSONL입니다. 로그 호출이 유효한 진단 추적 컨텍스트를 포함하면
OpenClaw는 외부 로그 프로세서가 해당 줄을 OTEL span 및 제공자 `traceparent`
전파와 상관시킬 수 있도록 추적 필드를 최상위 JSON 키(`traceId`, `spanId`,
`parentSpanId`, `traceFlags`)로 작성합니다.

Gateway HTTP 요청과 Gateway WebSocket 프레임은 내부 요청 추적 범위를
설정합니다. 해당 비동기 범위 안에서 내보내는 로그와 진단 이벤트는 명시적 추적
컨텍스트를 전달하지 않는 경우 요청 추적을 상속합니다. 에이전트 실행 및 모델
호출 추적은 활성 요청 추적의 자식이 되므로 원시 요청 또는 모델 콘텐츠를
기록하지 않고도 로컬 로그, 진단 스냅샷, OTEL span, 신뢰할 수 있는 제공자
`traceparent` 헤더를 `traceId`로 결합할 수 있습니다.

OpenTelemetry 로그 내보내기가 활성화된 경우 대화 수명 주기 로그 레코드도
파일 로그와 동일한 범위 제한 속성을 사용해 diagnostics-otel 로그 내보내기로
흐릅니다. `diagnostics.otel.logsExporter`를 구성해 OTLP, stdout JSONL 또는
두 싱크를 모두 선택하세요.

### 모델 호출 크기와 타이밍

모델 호출 진단은 원시 프롬프트 또는 응답 콘텐츠를 캡처하지 않고 범위가
제한된 요청/응답 측정값을 기록합니다.

- `requestPayloadBytes`: 최종 모델 요청 페이로드의 UTF-8 바이트 크기
- `responseStreamBytes`: 스트리밍된 모델 응답 청크 페이로드의 UTF-8 바이트
  크기. 고빈도 텍스트, thinking, 도구 호출 델타 이벤트는 전체 `partial`
  스냅샷 대신 증가분 `delta` 바이트만 계산합니다.
- `timeToFirstByteMs`: 첫 스트리밍 응답 이벤트 전까지 경과한 시간
- `durationMs`: 전체 모델 호출 기간

이러한 필드는 진단 내보내기가 활성화된 경우 진단 스냅샷, 모델 호출 Plugin 훅,
OTEL 모델 호출 span/메트릭에서 사용할 수 있습니다.

### 콘솔 스타일

`logging.consoleStyle`:

- `pretty`: 사람이 읽기 쉽고 색상이 적용되며 타임스탬프가 포함됩니다.
- `compact`: 더 간결한 출력(긴 세션에 가장 적합).
- `json`: 줄마다 JSON(로그 프로세서용).

### 수정

OpenClaw는 민감한 토큰이 콘솔 출력, 파일 로그, OTLP 로그 레코드, 지속 저장된
세션 트랜스크립트 텍스트 또는 Control UI 도구 이벤트 페이로드(도구 시작 인수,
부분/최종 결과 페이로드, 파생된 exec 출력, 패치 요약)에 도달하기 전에 수정할
수 있습니다.

- `logging.redactSensitive`: `off` | `tools`(기본값: `tools`)
- `logging.redactPatterns`: 기본 세트를 재정의할 정규식 문자열 목록. 사용자 지정 패턴은 Control UI 도구 페이로드의 내장 기본값 위에 적용되므로, 패턴을 추가해도 기본값이 이미 잡아내는 값의 수정이 약해지지 않습니다.

파일 로그와 세션 트랜스크립트는 JSONL로 유지되지만, 일치하는 비밀 값은 줄이나
메시지가 디스크에 기록되기 전에 마스킹됩니다. 수정은 최선 노력 방식입니다.
모든 식별자나 바이너리 페이로드 필드가 아니라 텍스트를 포함하는 메시지 콘텐츠와
로그 문자열에 적용됩니다.

내장 기본값은 카드 번호, CVC/CVV, 공유 결제 토큰, 결제 자격 증명 같은 일반적인
API 자격 증명과 결제 자격 증명 필드 이름이 JSON 필드, URL 매개변수, CLI
플래그 또는 할당으로 나타날 때 이를 처리합니다.

`logging.redactSensitive: "off"`는 이 일반 로그/트랜스크립트 정책만
비활성화합니다. OpenClaw는 UI 클라이언트, 지원 번들, 진단 관찰자, 승인
프롬프트 또는 에이전트 도구에 표시될 수 있는 안전 경계 페이로드를 계속
수정합니다. 예로는 Control UI 도구 호출 이벤트, `sessions_history` 출력,
진단 지원 내보내기, 제공자 오류 관찰, exec 승인 명령 표시, Gateway WebSocket
프로토콜 로그가 있습니다. 사용자 지정 `logging.redactPatterns`는 이러한
표면에도 프로젝트별 패턴을 계속 추가할 수 있습니다.

## 진단 및 OpenTelemetry

진단은 모델 실행과 메시지 흐름 원격 측정(Webhook, 큐잉, 세션 상태)을 위한
구조화된 기계 판독 가능 이벤트입니다. 진단은 로그를 대체하지 **않습니다**.
진단은 메트릭, 추적, 내보내기에 공급됩니다. 이벤트는 내보내기 여부와 관계없이
프로세스 내에서 내보내집니다.

인접한 두 표면:

- **OpenTelemetry 내보내기** — 메트릭, 추적, 로그를 OTLP/HTTP를 통해
  OpenTelemetry 호환 수집기 또는 백엔드(Grafana, Datadog, Honeycomb,
  New Relic, Tempo 등)로 보냅니다. 전체 구성, 신호 카탈로그, 메트릭/span
  이름, 환경 변수, 개인정보 모델은 전용 페이지에 있습니다.
  [OpenTelemetry 내보내기](/ko/gateway/opentelemetry).
- **진단 플래그** — `logging.level`을 높이지 않고 추가 로그를
  `logging.file`로 라우팅하는 대상 디버그 로그 플래그입니다. 플래그는
  대소문자를 구분하지 않으며 와일드카드(`telegram.*`, `*`)를 지원합니다.
  `diagnostics.flags` 아래에서 구성하거나 `OPENCLAW_DIAGNOSTICS=...` 환경
  재정의를 통해 구성하세요. 전체 가이드:
  [진단 플래그](/ko/diagnostics/flags).

OTLP 내보내기 없이 Plugin 또는 사용자 지정 싱크에 대한 진단 이벤트를
활성화하려면 다음을 사용하세요.

```json5
{
  diagnostics: { enabled: true },
}
```

OTLP를 컬렉터로 내보내려면 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하세요.

## 문제 해결 팁

- **Gateway에 연결할 수 없나요?** 먼저 `openclaw doctor`를 실행하세요.
- **로그가 비어 있나요?** Gateway가 실행 중이고 `logging.file`의 파일 경로에 쓰고 있는지 확인하세요.
- **더 자세한 정보가 필요한가요?** `logging.level`을 `debug` 또는 `trace`로 설정한 뒤 다시 시도하세요.

## 관련 문서

- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) — OTLP/HTTP 내보내기, 메트릭/스팬 카탈로그, 개인정보 보호 모델
- [진단 플래그](/ko/diagnostics/flags) — 대상별 디버그 로그 플래그
- [Gateway 로깅 내부 구조](/ko/gateway/logging) — WS 로그 스타일, 하위 시스템 접두사, 콘솔 캡처
- [구성 참조](/ko/gateway/configuration-reference#diagnostics) — 전체 `diagnostics.*` 필드 참조
