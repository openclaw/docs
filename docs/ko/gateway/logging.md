---
read_when:
    - 로깅 출력 또는 형식 변경
    - CLI 또는 Gateway 출력 디버깅
summary: 로깅 화면, 파일 로그, WS 로그 스타일 및 콘솔 서식
title: Gateway 로깅
x-i18n:
    generated_at: "2026-07-12T00:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# 로깅

사용자 대상 개요(CLI + Control UI + 구성)는 [/logging](/ko/logging)을 참조하세요.

OpenClaw에는 두 가지 로그 표면이 있습니다.

- **콘솔 출력** - 터미널/디버그 UI에 표시되는 내용입니다.
- **파일 로그** - Gateway 로거가 기록하는 JSON 라인입니다.

시작 시 Gateway는 확인된 기본 에이전트 모델과 새 세션에 영향을 주는 모드 기본값을 기록합니다.

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking`은 기본 에이전트, 모델 매개변수 또는 전역 에이전트 기본값에서 가져오며, 설정되지 않은 경우 `medium`으로 표시됩니다. `fast`는 기본 에이전트 또는 모델의 `fastMode` 매개변수에서 가져옵니다.

## 파일 기반 로거

- 기본 롤링 로그 파일은 `/tmp/openclaw/` 아래에 있으며(하루에 파일 하나), 파일명은 `openclaw-YYYY-MM-DD.log`이고 Gateway 호스트의 현지 시간대를 기준으로 날짜가 지정됩니다. 해당 디렉터리가 안전하지 않거나 쓸 수 없는 경우(소유자가 잘못되었거나, 누구나 쓸 수 있거나, 심볼릭 링크인 경우) OpenClaw는 사용자 범위의 `os.tmpdir()/openclaw-<uid>` 경로를 대신 사용합니다. Windows에서는 항상 이 OS 임시 디렉터리 대체 경로를 사용합니다.
- 활성 로그 파일은 `logging.maxFileBytes`(기본값: 100MB)에 도달하면 순환되며, 번호가 지정된 보관 파일을 최대 5개(`.1`부터 `.5`까지) 유지하고 새로운 활성 파일에 계속 기록합니다.
- `~/.openclaw/openclaw.json`에서 `logging.file`, `logging.level`을 사용해 로그 파일 경로와 수준을 구성합니다.
- 파일 형식은 한 줄당 하나의 JSON 객체입니다.

대화, 실시간 음성 및 관리형 룸 코드 경로는 운영 디버깅과 OTLP 로그 내보내기를 위한 제한된 수명 주기 레코드에 공유 파일 로거를 사용합니다. 대화 기록 텍스트, 오디오 페이로드, 턴 ID, 호출 ID 및 제공자 항목 ID는 로그 레코드에 절대 복사되지 않습니다.

Control UI의 로그 탭은 Gateway(`logs.tail`)를 통해 이 파일의 후속 내용을 실시간으로 표시합니다. CLI도 동일하게 작동합니다.

```bash
openclaw logs --follow
```

### 상세 출력과 로그 수준

- **파일 로그**는 `logging.level`로만 제어됩니다.
- `--verbose`는 **콘솔 상세도**(및 WS 로그 형식)에만 영향을 주며, 파일 로그 수준을 높이지 **않습니다**.
- 상세 출력 전용 세부 정보를 파일 로그에 기록하려면 `logging.level`을 `debug` 또는 `trace`로 설정하세요.
- 추적 로깅에는 Plugin 도구 팩터리 준비와 같이 선택된 핫 패스의 진단 타이밍 요약도 포함됩니다. [/tools/plugin#slow-plugin-tool-setup](/ko/tools/plugin#slow-plugin-tool-setup)을 참조하세요.

## 콘솔 캡처

CLI는 `console.log/info/warn/error/debug/trace`를 캡처해 파일 로그에 기록하면서 stdout/stderr에도 계속 출력합니다.

콘솔 상세도는 독립적으로 조정할 수 있습니다.

- `logging.consoleLevel`(기본값: `info`)
- `logging.consoleStyle`(`pretty` | `compact` | `json`; TTY에서는 기본값이 `pretty`이고, 그 외에는 `compact`)

## 민감 정보 가림

OpenClaw는 로그 또는 대화 기록 출력이 프로세스를 벗어나기 전에 민감한 토큰을 가립니다. 이 민감 정보 가림 정책은 콘솔, 파일 로그, OTLP 로그 레코드 및 세션 대화 기록 텍스트 출력 대상에 적용되므로, 일치하는 비밀 값은 JSONL 라인이나 메시지가 디스크에 기록되기 전에 가려집니다.

- `logging.redactSensitive`: `off` | `tools`(기본값: `tools`)
- `logging.redactPatterns`: 정규식 문자열 배열(기본값 재정의)
  - 원시 정규식 문자열(자동 `gi`)을 사용하거나 사용자 지정 플래그를 지정하려면 `/pattern/flags`를 사용합니다.
  - 일치 항목은 처음 6자와 마지막 4자를 유지한 채 가려집니다(18자 이상인 값). 더 짧은 값은 `***`가 됩니다.
  - 기본 패턴은 일반적인 키 할당, CLI 플래그, JSON 필드, 베어러 헤더, PEM 블록, 널리 사용되는 공급업체 토큰 접두사 및 결제 자격 증명 필드 이름(카드 번호, CVC/CVV, 공유 결제 토큰, 결제 자격 증명)을 포함합니다.

일부 안전 경계에서는 `logging.redactSensitive` 설정과 관계없이 항상 민감 정보를 가립니다. 여기에는 Control UI 도구 호출 이벤트, `sessions_history` 도구 출력, 진단 지원 내보내기, 제공자 오류 관찰, 실행 승인 명령 표시 및 Gateway WebSocket 프로토콜 로그가 포함됩니다. 이러한 표면에서도 추가 패턴으로 `logging.redactPatterns`가 적용되지만, `redactSensitive: "off"`로 설정해도 원시 비밀 정보가 출력되지는 않습니다.

## Gateway WebSocket 로그

Gateway는 WebSocket 프로토콜 로그를 두 가지 모드로 출력합니다.

- **일반 모드(`--verbose` 없음)**: 오류(`ok=false`), 느린 호출(기본 임계값: `>= 50ms`) 및 구문 분석 오류와 같은 "주목할 만한" RPC 결과만 출력합니다.
- **상세 모드(`--verbose`)**: 모든 WS 요청/응답 트래픽을 출력합니다.

### WS 로그 형식

`openclaw gateway`는 Gateway별 형식 전환 옵션을 지원합니다.

- `--ws-log auto`(기본값): 일반 모드는 최적화된 형식을 사용하고, 상세 모드는 간결한 출력을 사용합니다.
- `--ws-log compact`: 상세 모드에서 간결한 출력(요청/응답 쌍)을 사용합니다.
- `--ws-log full`: 상세 모드에서 프레임별 전체 출력을 사용합니다.
- `--compact`: `--ws-log compact`의 별칭입니다.

```bash
# 최적화됨(오류/느린 호출만)
openclaw gateway

# 모든 WS 트래픽 표시(요청/응답 쌍)
openclaw gateway --verbose --ws-log compact

# 모든 WS 트래픽 표시(전체 메타데이터)
openclaw gateway --verbose --ws-log full
```

## 콘솔 서식 지정(하위 시스템 로깅)

콘솔 포매터는 **TTY를 인식**하며 일관된 접두사가 있는 라인을 출력합니다. 하위 시스템 로거는 출력을 그룹화해 쉽게 훑어볼 수 있도록 유지합니다.

- 모든 라인에 **하위 시스템 접두사**를 표시합니다(예: `[gateway]`, `[canvas]`, `[tailscale]`).
- **하위 시스템 색상**(이름을 해시해 하위 시스템별로 고정)과 로그 수준 색상을 사용합니다.
- 출력이 TTY이거나 환경이 리치 터미널처럼 보이는 경우(`TERM`/`COLORTERM`/`TERM_PROGRAM`) **색상을 사용**하며, `NO_COLOR`와 `FORCE_COLOR`를 따릅니다.
- **축약된 하위 시스템 접두사**: 선행 `gateway/`, `channels/` 또는 `providers/` 세그먼트를 제거한 다음, 나머지 세그먼트 중 마지막 2개까지만 유지합니다(예: `channels/turn/kernel`은 `turn/kernel`로 표시). 알려진 채널 하위 시스템(`telegram`, `whatsapp`, `slack` 등)은 항상 채널 이름만 남도록 축약됩니다.
- **하위 시스템별 하위 로거**(자동 접두사 + 구조화된 필드 `{ subsystem }`)를 사용합니다.
- QR/UX 출력에는 **`logRaw()`**를 사용합니다(접두사 및 서식 없음).
- **콘솔 형식**: `pretty` | `compact` | `json`.
- **콘솔 로그 수준**은 파일 로그 수준과 별개입니다(`logging.level`이 `debug`/`trace`인 경우 파일에는 전체 세부 정보가 유지됨).
- **WhatsApp 메시지 본문**은 `debug` 수준으로 기록됩니다(표시하려면 `--verbose` 사용).

이를 통해 파일 로그를 안정적으로 유지하면서 대화형 출력을 쉽게 훑어볼 수 있습니다.

## 관련 문서

- [로깅](/ko/logging)
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)
- [진단 내보내기](/ko/gateway/diagnostics)
