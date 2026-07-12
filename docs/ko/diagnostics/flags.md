---
read_when:
    - 전역 로깅 수준을 높이지 않고도 대상이 지정된 디버그 로그가 필요합니다
    - 지원을 위해 하위 시스템별 로그를 수집해야 합니다.
summary: 대상별 디버그 로그를 위한 진단 플래그
title: 진단 플래그
x-i18n:
    generated_at: "2026-07-12T00:44:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

진단 플래그는 전역 `logging.level`을 높이지 않고 특정 하위 시스템 하나에 대한 추가 로깅을 활성화합니다. 하위 시스템에서 플래그를 확인하지 않으면 아무 효과가 없습니다.

## 작동 방식

- 플래그는 대소문자를 구분하지 않는 문자열이며, 구성의 `diagnostics.flags`와 `OPENCLAW_DIAGNOSTICS` 환경 변수 재정의 값에서 가져온 후 중복을 제거하고 소문자로 변환합니다.
- `name.*`는 `name` 자체와 `name.` 아래의 모든 항목과 일치합니다(예: `telegram.*`는 `telegram.http`와 일치).
- `*` 또는 `all`은 모든 플래그를 활성화합니다.
- 구성에서 `diagnostics.flags`를 변경한 후 Gateway를 다시 시작하세요. 핫 리로드되지 않습니다.

## 알려진 플래그

| 플래그           | 활성화 항목                                              |
| ---------------- | -------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP 오류 로깅                          |
| `brave.http`     | Brave Search 요청/응답/캐시 로깅                         |
| `profiler`       | 응답 단계 프로파일러와 Codex 앱 서버 프로파일러(둘 다)  |
| `reply.profiler` | 응답 단계 프로파일러만                                   |
| `codex.profiler` | Codex 앱 서버 프로파일러만                               |
| `timeline`       | 구조화된 JSONL 타임라인 아티팩트(아래 참조)              |

## 구성으로 활성화

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

여러 플래그:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## 환경 변수 재정의(일회성)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

값은 쉼표 또는 공백을 기준으로 분리됩니다. 특수 값:

| 값                          | 효과                                      |
| --------------------------- | ----------------------------------------- |
| `0`, `false`, `off`, `none` | 구성의 설정도 재정의하여 모든 플래그 비활성화 |
| `1`, `true`, `all`, `*`     | 모든 플래그 활성화                        |

`OPENCLAW_DIAGNOSTICS=0`은 해당 프로세스의 환경 변수와 구성에 있는 플래그를 모두 비활성화합니다. 파일을 편집하지 않고 구성에 활성화된 채로 남아 있는 프로파일러 플래그를 일시적으로 끌 때 유용합니다.

## 프로파일러 플래그

프로파일러 플래그는 경량 타이밍 구간을 제어하며, 비활성화된 경우 오버헤드를 추가하지 않습니다.

한 번의 Gateway 실행에서 프로파일러로 제어되는 모든 구간을 활성화하려면 다음을 실행합니다.

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

응답 디스패치 프로파일러 구간만 활성화하려면 다음을 실행합니다.

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Codex 앱 서버 시작/도구/스레드 프로파일러 구간만 활성화하려면 다음을 실행합니다.

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler`는 응답 프로파일러와 Codex 프로파일러를 모두 활성화합니다. 하나만 활성화하려면 범위가 지정된 플래그 이름을 사용하세요.

또는 구성에서 설정합니다.

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

구성 플래그를 변경한 후 Gateway를 다시 시작하세요. 프로파일러 플래그를 비활성화하려면 `diagnostics.flags`에서 제거하고 다시 시작하거나, `OPENCLAW_DIAGNOSTICS=0`으로 프로세스를 시작하여 해당 실행의 모든 진단 플래그를 재정의하세요.

## 타임라인 아티팩트

`timeline` 플래그(별칭: `diagnostics.timeline`)는 외부 QA 하네스에서 사용할 수 있도록 구조화된 시작 및 런타임 타이밍 이벤트를 JSONL로 기록합니다.

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

또는 구성에서 활성화합니다.

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

플래그 자체를 구성에서 설정하더라도 출력 경로는 항상 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`에서 가져옵니다. 경로에 해당하는 구성 키는 없습니다. `timeline`을 구성에서만 활성화하면 OpenClaw가 아직 구성을 읽지 않은 상태이므로 가장 초기의 구성 로딩 구간은 누락되지만, 이후의 시작 구간은 정상적으로 캡처됩니다.

`OPENCLAW_DIAGNOSTICS=1`, `=all`, `=*`도 모든 플래그를 활성화하므로 타임라인을 활성화합니다. 다른 모든 진단 플래그는 제외하고 JSONL 아티팩트만 필요하다면 범위가 지정된 `timeline` 플래그를 사용하는 것이 좋습니다.

타임라인의 이벤트 루프 지연 샘플에는 `timeline` 외에 추가 동의가 하나 더 필요합니다. 타임라인을 활성화한 상태에서 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`(또는 `on`/`true`/`yes`)을 설정하세요.

타임라인 레코드는 `openclaw.diagnostics.v1` 봉투 형식을 사용하며 프로세스 ID, 단계 이름, 구간 이름, 지속 시간, Plugin ID, 종속성 개수, 이벤트 루프 지연 샘플, 공급자 작업 이름, 자식 프로세스 종료 상태, 시작 오류 이름/메시지를 포함할 수 있습니다. 타임라인 파일을 로컬 진단 아티팩트로 취급하고, 컴퓨터 외부로 공유하기 전에 검토하세요.

## 로그 저장 위치

플래그는 표준 진단 로그 파일에 로그를 기록합니다. 기본 경로는 다음과 같습니다.

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file`을 설정한 경우에는 해당 경로를 대신 사용합니다. 로그는 JSONL 형식입니다(한 줄에 JSON 객체 하나). `logging.redactSensitive`에 따른 민감 정보 삭제는 계속 적용됩니다. 전체 로그 경로 결정, 순환, 민감 정보 삭제 모델은 [로깅](/ko/logging)을 참조하세요.

## 로그 추출

최신 로그 파일을 선택합니다.

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 진단을 필터링합니다.

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP 진단을 필터링합니다.

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

또는 문제를 재현하면서 실시간으로 확인합니다.

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

원격 Gateway의 경우에는 대신 `openclaw logs --follow`를 사용하세요([/cli/logs](/ko/cli/logs) 참조).

## 참고 사항

- `logging.level`이 `warn`보다 높은 수준으로 설정되어 있으면 플래그로 제어되는 로그가 표시되지 않을 수 있습니다. 기본값인 `info`는 문제없습니다.
- `brave.http`는 Brave Search 요청 URL/쿼리 매개변수, 응답 상태/타이밍, 캐시 적중/미적중/쓰기 이벤트를 기록합니다. API 키(요청 헤더로 전송됨)나 응답 본문은 기록하지 않지만, 검색 쿼리에는 민감한 정보가 포함될 수 있습니다.
- 플래그를 활성화한 상태로 두어도 안전합니다. 특정 하위 시스템의 로그 양에만 영향을 줍니다.
- 로그 대상, 수준, 민감 정보 삭제를 변경하려면 [/logging](/ko/logging)을 사용하세요.

## 관련 문서

- [Gateway 진단](/ko/gateway/diagnostics)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
