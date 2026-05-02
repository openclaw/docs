---
read_when:
    - 전역 로깅 수준을 높이지 않고도 대상 지정 디버그 로그가 필요합니다
    - 지원을 위해 하위 시스템별 로그를 캡처해야 합니다
summary: 대상 지정 디버그 로그를 위한 진단 플래그
title: 진단 플래그
x-i18n:
    generated_at: "2026-05-02T20:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

진단 플래그를 사용하면 모든 곳에서 자세한 로깅을 켜지 않고도 대상 디버그 로그를 활성화할 수 있습니다. 플래그는 옵트인이며 서브시스템이 해당 플래그를 확인하지 않는 한 아무 효과가 없습니다.

## 작동 방식

- 플래그는 문자열입니다(대/소문자 구분 없음).
- 구성에서 또는 env 재정의로 플래그를 활성화할 수 있습니다.
- 와일드카드가 지원됩니다.
  - `telegram.*`는 `telegram.http`와 일치합니다.
  - `*`는 모든 플래그를 활성화합니다.

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

플래그를 변경한 후 Gateway를 재시작하세요.

## Env 재정의(일회성)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

모든 플래그 비활성화:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 타임라인 아티팩트

`timeline` 플래그는 외부 QA 하네스를 위해 구조화된 시작 및 런타임 타이밍 이벤트를 기록합니다.

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

구성에서도 활성화할 수 있습니다.

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

타임라인 파일 경로는 여전히 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`에서 가져옵니다. `timeline`이 구성에서만 활성화된 경우, OpenClaw가 아직 구성을 읽지 않았기 때문에 가장 이른 구성 로딩 span은 내보내지 않습니다. 이후의 시작 span은 구성 플래그를 사용합니다.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, `OPENCLAW_DIAGNOSTICS=*`도 모든 진단 플래그를 활성화하므로 타임라인을 활성화합니다. JSONL 타이밍 아티팩트만 원할 때는 `timeline`을 선호하세요.

타임라인 레코드는 `openclaw.diagnostics.v1` envelope를 사용합니다. 이벤트에는 프로세스 ID, 단계 이름, span 이름, 기간, plugin ID, dependency 수, event-loop delay 샘플, provider 작업 이름, child-process exit 상태, 시작 오류 이름/메시지가 포함될 수 있습니다. 타임라인 파일은 로컬 진단 아티팩트로 취급하고, 내 컴퓨터 밖으로 공유하기 전에 검토하세요.

## 로그 위치

플래그는 표준 진단 로그 파일에 로그를 출력합니다. 기본값:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file`을 설정했다면 대신 해당 경로를 사용합니다. 로그는 JSONL입니다(한 줄에 JSON 객체 하나). `logging.redactSensitive`에 따라 여전히 수정 처리가 적용됩니다.

## 로그 추출

최신 로그 파일 선택:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 진단 필터링:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP 진단 필터링:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

또는 재현하는 동안 tail 실행:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

원격 Gateway의 경우 `openclaw logs --follow`도 사용할 수 있습니다([/cli/logs](/ko/cli/logs) 참조).

## 참고

- `logging.level`이 `warn`보다 높게 설정되어 있으면 이러한 로그가 억제될 수 있습니다. 기본값 `info`는 괜찮습니다.
- `brave.http`는 Brave Search 요청 URL/쿼리 매개변수, 응답 상태/타이밍, 캐시 hit/miss/write 이벤트를 기록합니다. API 키나 응답 본문은 기록하지 않지만 검색 쿼리는 민감할 수 있습니다.
- 플래그를 활성화한 상태로 두어도 안전합니다. 특정 서브시스템의 로그 양에만 영향을 줍니다.
- 로그 대상, 수준, 수정 처리를 변경하려면 [/logging](/ko/logging)을 사용하세요.

## 관련 항목

- [Gateway 진단](/ko/gateway/diagnostics)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
