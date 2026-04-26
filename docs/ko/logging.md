---
read_when:
    - OpenClaw 로깅에 대한 초보자 친화적 개요가 필요한 경우
    - 로그 수준, 형식 또는 마스킹을 구성하려는 경우
    - 문제 해결 중이며 로그를 빠르게 찾아야 하는 경우
summary: 파일 로그, 콘솔 출력, CLI tailing, 그리고 Control UI의 Logs 탭
title: 로깅
x-i18n:
    generated_at: "2026-04-26T11:33:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw에는 두 가지 주요 로그 표면이 있습니다.

- Gateway가 기록하는 **파일 로그**(JSON lines)
- 터미널과 Gateway Debug UI에 표시되는 **콘솔 출력**

Control UI의 **Logs** 탭은 gateway 파일 로그를 tail합니다. 이 페이지에서는
로그가 어디에 있는지, 어떻게 읽는지, 로그 수준과 형식을 어떻게 구성하는지 설명합니다.

## 로그 위치

기본적으로 Gateway는 다음 위치 아래에 롤링 로그 파일을 기록합니다.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 gateway 호스트의 로컬 시간대를 사용합니다.

각 파일은 `logging.maxFileBytes`(기본값: 100 MB)에 도달하면 회전합니다.
OpenClaw는 활성 파일 옆에 `openclaw-YYYY-MM-DD.1.log` 같은 번호가 붙은
아카이브를 최대 5개까지 유지하며, 진단 출력을 억제하지 않고 새 활성 로그에 계속 기록합니다.

이는 `~/.openclaw/openclaw.json`에서 재정의할 수 있습니다.

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그 읽는 방법

### CLI: 라이브 tail(권장)

CLI를 사용해 RPC를 통해 gateway 로그 파일을 tail하세요.

```bash
openclaw logs --follow
```

유용한 현재 옵션:

- `--local-time`: 타임스탬프를 로컬 시간대로 표시
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 표준 Gateway RPC 플래그
- `--expect-final`: 에이전트 기반 RPC 최종 응답 대기 플래그(공용 클라이언트 레이어를 통해 여기서도 허용됨)

출력 모드:

- **TTY 세션**: 보기 좋고 색상이 있는 구조화된 로그 라인
- **비-TTY 세션**: 일반 텍스트
- `--json`: 줄 구분 JSON(로그 이벤트당 한 줄)
- `--plain`: TTY 세션에서도 일반 텍스트 강제
- `--no-color`: ANSI 색상 비활성화

명시적으로 `--url`을 전달하면 CLI는 config 또는 환경 자격 증명을 자동 적용하지 않습니다. 대상 Gateway가 인증을 요구하면 `--token`을 직접 포함하세요.

JSON 모드에서 CLI는 `type` 태그가 붙은 객체를 출력합니다.

- `meta`: 스트림 메타데이터(파일, cursor, 크기)
- `log`: 파싱된 로그 항목
- `notice`: 잘림 / 회전 힌트
- `raw`: 파싱되지 않은 로그 라인

local loopback Gateway가 페어링을 요구하면 `openclaw logs`는 자동으로 구성된 로컬 로그 파일로 폴백합니다. 명시적 `--url` 대상에는 이 폴백이 적용되지 않습니다.

Gateway에 도달할 수 없으면 CLI는 다음을 실행하라는 짧은 힌트를 출력합니다.

```bash
openclaw doctor
```

### Control UI (웹)

Control UI의 **Logs** 탭은 `logs.tail`을 사용해 같은 파일을 tail합니다.
열는 방법은 [/web/control-ui](/ko/web/control-ui)를 참고하세요.

### 채널 전용 로그

채널 활동(WhatsApp/Telegram 등)만 필터링하려면 다음을 사용하세요.

```bash
openclaw channels logs --channel whatsapp
```

## 로그 형식

### 파일 로그 (JSONL)

로그 파일의 각 줄은 JSON 객체입니다. CLI와 Control UI는 이 항목들을 파싱해
구조화된 출력(시간, 수준, 서브시스템, 메시지)을 렌더링합니다.

### 콘솔 출력

콘솔 로그는 **TTY 인식형**이며 가독성을 위해 포맷됩니다.

- 서브시스템 접두사(예: `gateway/channels/whatsapp`)
- 수준별 색상(info/warn/error)
- 선택적 compact 또는 JSON 모드

콘솔 형식은 `logging.consoleStyle`로 제어됩니다.

### Gateway WebSocket 로그

`openclaw gateway`는 RPC 트래픽용 WebSocket 프로토콜 로깅도 제공합니다.

- 일반 모드: 중요한 결과만 표시(오류, 파싱 오류, 느린 호출)
- `--verbose`: 모든 요청/응답 트래픽 표시
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

- `logging.level`: **파일 로그**(JSONL) 수준
- `logging.consoleLevel`: **콘솔** 출력 수준

둘 다 **`OPENCLAW_LOG_LEVEL`** 환경 변수로 재정의할 수 있습니다(예: `OPENCLAW_LOG_LEVEL=debug`). 이 env var는 config 파일보다 우선하므로 `openclaw.json`을 편집하지 않고 단일 실행에 대해서만 verbosity를 높일 수 있습니다. 전역 CLI 옵션 **`--log-level <level>`**(예: `openclaw --log-level debug gateway run`)도 사용할 수 있으며, 이 경우 해당 명령에 대해 환경 변수보다 우선합니다.

`--verbose`는 콘솔 출력과 WS 로그 verbosity에만 영향을 주며, 파일 로그 수준은 변경하지 않습니다.

### 콘솔 스타일

`logging.consoleStyle`:

- `pretty`: 사람이 읽기 쉽고, 색상이 있으며, 타임스탬프 포함
- `compact`: 더 간결한 출력(긴 세션에 적합)
- `json`: 줄마다 JSON(로그 처리기에 적합)

### 마스킹

도구 요약은 콘솔에 기록되기 전에 민감한 토큰을 마스킹할 수 있습니다.

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`)
- `logging.redactPatterns`: 기본 집합을 재정의하는 정규식 문자열 목록

마스킹은 **콘솔 출력**, **stderr로 라우팅된 콘솔 진단**, **파일 로그**에 대한 로깅 sink에서 적용됩니다. 파일 로그는 JSONL 형식을 유지하지만, 일치하는 비밀 값은 줄이 디스크에 기록되기 전에 마스킹됩니다.

## Diagnostics 및 OpenTelemetry

Diagnostics는 모델 실행과 메시지 흐름 텔레메트리(Webhook, 큐잉, 세션 상태)를 위한 구조화된 기계 판독 가능 이벤트입니다. 이는 로그를 대체하지 않고 메트릭, 트레이스, exporter에 데이터를 공급합니다. 이벤트는 export 여부와 상관없이 프로세스 내부에서 발생합니다.

인접한 두 가지 표면:

- **OpenTelemetry export** — 메트릭, 트레이스, 로그를 OTLP/HTTP를 통해
  OpenTelemetry 호환 collector 또는 백엔드(Grafana, Datadog,
  Honeycomb, New Relic, Tempo 등)로 전송합니다. 전체 구성, 신호 카탈로그,
  메트릭/span 이름, env var, 개인정보 보호 모델은 별도 페이지에 있습니다:
  [OpenTelemetry export](/ko/gateway/opentelemetry)
- **Diagnostics 플래그** — `logging.level`을 높이지 않고 추가 로그를
  `logging.file`로 라우팅하는 대상 지정 디버그 로그 플래그입니다. 플래그는
  대소문자를 구분하지 않으며 와일드카드(`telegram.*`, `*`)를 지원합니다.
  `diagnostics.flags` 아래 또는 `OPENCLAW_DIAGNOSTICS=...` env 재정의로
  구성합니다. 전체 가이드는 [Diagnostics flags](/ko/diagnostics/flags)를 참고하세요.

OTLP export 없이 Plugin 또는 사용자 정의 sink를 위해 diagnostics 이벤트를 활성화하려면:

```json5
{
  diagnostics: { enabled: true },
}
```

collector로 OTLP export를 보내려면 [OpenTelemetry export](/ko/gateway/opentelemetry)를 참고하세요.

## 문제 해결 팁

- **Gateway에 연결할 수 없나요?** 먼저 `openclaw doctor`를 실행하세요.
- **로그가 비어 있나요?** Gateway가 실행 중인지, 그리고 `logging.file`의 경로에
  기록 중인지 확인하세요.
- **더 자세한 정보가 필요한가요?** `logging.level`을 `debug` 또는 `trace`로 설정하고 다시 시도하세요.

## 관련 항목

- [OpenTelemetry export](/ko/gateway/opentelemetry) — OTLP/HTTP export, 메트릭/span 카탈로그, 개인정보 보호 모델
- [Diagnostics flags](/ko/diagnostics/flags) — 대상 지정 디버그 로그 플래그
- [Gateway logging internals](/ko/gateway/logging) — WS 로그 스타일, 서브시스템 접두사, 콘솔 캡처
- [Configuration reference](/ko/gateway/configuration-reference#diagnostics) — 전체 `diagnostics.*` 필드 참조
