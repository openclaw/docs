---
read_when:
    - OpenClaw에서 “컨텍스트”가 무엇을 의미하는지 이해하고 싶습니다
    - 모델이 무언가를 "알고 있는" 이유(또는 잊어버린 이유)를 디버깅하고 있습니다
    - 컨텍스트 오버헤드를 줄이고 싶습니다(/context, /status, /compact)
summary: '컨텍스트: 모델이 보는 내용, 구성 방식, 검사 방법'
title: 컨텍스트
x-i18n:
    generated_at: "2026-06-27T17:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

"컨텍스트"는 **OpenClaw가 실행을 위해 모델에 보내는 모든 것**입니다. 이는 모델의 **컨텍스트 창**(토큰 한도)에 의해 제한됩니다.

초보자를 위한 개념 모델:

- **시스템 프롬프트**(OpenClaw가 구성): 규칙, 도구, Skills 목록, 시간/런타임, 삽입된 작업공간 파일.
- **대화 기록**: 이 세션에서 사용자의 메시지 + 어시스턴트의 메시지.
- **도구 호출/결과 + 첨부 파일**: 명령 출력, 파일 읽기, 이미지/오디오 등.

컨텍스트는 "메모리"와 _같은 것이 아닙니다_: 메모리는 디스크에 저장했다가 나중에 다시 불러올 수 있지만, 컨텍스트는 모델의 현재 창 안에 들어 있는 것입니다.

## 빠른 시작(컨텍스트 검사)

- `/status` → 빠른 "내 창이 얼마나 찼나?" 보기 + 세션 설정.
- `/context list` → 무엇이 삽입되었는지 + 대략적인 크기(파일별 + 합계).
- `/context detail` → 더 자세한 분석: 파일별, 도구 스키마별 크기, Skills 항목별 크기, 시스템 프롬프트 크기, 압축 가능한 transcript 메시지 수.
- `/context map` → 현재 세션에서 추적된 컨텍스트 기여 요소를 보여 주는 WinDirStat 스타일 treemap 이미지.
- `/usage tokens` → 일반 응답에 응답별 사용량 footer를 추가합니다.
- `/compact` → 오래된 기록을 압축 항목으로 요약하여 창 공간을 확보합니다.

참고 항목: [Slash 명령](/ko/tools/slash-commands), [토큰 사용 및 비용](/ko/reference/token-use), [Compaction](/ko/concepts/compaction).

## 예시 출력

값은 모델, provider, 도구 정책, 작업공간의 내용에 따라 달라집니다.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

최신 캐시된 실행 보고서에서 생성한 이미지를 보냅니다. 세션에서 일반 메시지가 아직 실행 보고서를 생성하지 않은 경우, `/context map`은 추정치를 렌더링하는 대신 사용할 수 없다는 메시지를 반환합니다. 사각형 면적은 추적된 프롬프트 문자 수에 비례합니다.

- 삽입된 작업공간 파일
- 기본 시스템 프롬프트 텍스트
- Skills 프롬프트 항목
- 도구 JSON 스키마

실행 보고서가 캐시되어 있지 않아도 `/context list`, `/context detail`, `/context json`은 온디맨드 추정치를 계속 검사할 수 있습니다.

## 컨텍스트 창에 포함되는 것

모델이 받는 모든 것이 포함됩니다. 예:

- 시스템 프롬프트(모든 섹션).
- 대화 기록.
- 도구 호출 + 도구 결과.
- 첨부 파일/transcript(이미지/오디오/파일).
- Compaction 요약 및 pruning 산출물.
- provider "래퍼" 또는 숨겨진 헤더(보이지 않지만 포함됨).

## OpenClaw가 시스템 프롬프트를 구성하는 방식

시스템 프롬프트는 **OpenClaw 소유**이며 실행마다 다시 구성됩니다. 여기에는 다음이 포함됩니다.

- 도구 목록 + 짧은 설명.
- Skills 목록(메타데이터만, 아래 참조).
- 작업공간 위치.
- 시간(UTC + 구성된 경우 변환된 사용자 시간).
- 런타임 메타데이터(호스트/OS/모델/thinking).
- **프로젝트 컨텍스트** 아래에 삽입된 작업공간 bootstrap 파일.

전체 분석: [시스템 프롬프트](/ko/concepts/system-prompt).

## 삽입된 작업공간 파일(프로젝트 컨텍스트)

기본적으로 OpenClaw는 고정된 작업공간 파일 집합을 삽입합니다(있는 경우).

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(첫 실행에만)

큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값 `20000`자)를 사용하여 파일별로 잘립니다. OpenClaw는 또한 `agents.defaults.bootstrapTotalMaxChars`(기본값 `60000`자)로 파일 전체에 대한 총 bootstrap 삽입 한도를 적용합니다. `/context`는 **원본 대비 삽입된** 크기와 잘림 발생 여부를 보여 줍니다.

잘림이 발생하면 런타임은 프로젝트 컨텍스트 아래에 프롬프트 내부 경고 블록을 삽입할 수 있습니다. `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`; 기본값 `always`)으로 이를 구성하세요.

## Skills: 삽입되는 것과 온디맨드로 로드되는 것

시스템 프롬프트에는 간결한 **Skills 목록**(이름 + 설명 + 위치)이 포함됩니다. 이 목록에는 실제 오버헤드가 있습니다.

Skills 지침은 기본적으로 포함되지 _않습니다_. 모델은 **필요할 때만** 해당 Skill의 `SKILL.md`를 `read`해야 합니다.

## 도구: 두 가지 비용이 있습니다

도구는 두 가지 방식으로 컨텍스트에 영향을 줍니다.

1. 시스템 프롬프트의 **도구 목록 텍스트**("도구"로 보이는 것).
2. **도구 스키마**(JSON). 모델이 도구를 호출할 수 있도록 전송됩니다. 일반 텍스트로 보이지 않더라도 컨텍스트에 포함됩니다.

`/context detail`은 가장 큰 도구 스키마를 분석해 무엇이 지배적인지 볼 수 있게 합니다.

## 명령, 지시문, "인라인 바로가기"

Slash 명령은 Gateway가 처리합니다. 몇 가지 서로 다른 동작이 있습니다.

- **독립 실행 명령**: `/...`만 포함된 메시지는 명령으로 실행됩니다.
- **지시문**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue`는 모델이 메시지를 보기 전에 제거됩니다.
  - 지시문만 있는 메시지는 세션 설정을 유지합니다.
  - 일반 메시지 안의 인라인 지시문은 메시지별 힌트로 작동합니다.
- **인라인 바로가기**(허용 목록에 있는 발신자만): 일반 메시지 안의 특정 `/...` 토큰은 즉시 실행될 수 있으며(예: "hey /status"), 모델이 나머지 텍스트를 보기 전에 제거됩니다.

자세한 내용: [Slash 명령](/ko/tools/slash-commands).

## 세션, Compaction, pruning(무엇이 유지되는가)

메시지 간에 무엇이 유지되는지는 메커니즘에 따라 달라집니다.

- **일반 기록**은 정책에 따라 압축/가지치기될 때까지 세션 transcript에 유지됩니다.
- **Compaction**은 요약을 transcript에 유지하고 최근 메시지는 그대로 둡니다.
- **Pruning**은 컨텍스트 창 공간을 확보하기 위해 _메모리 내_ 프롬프트에서 오래된 도구 결과를 제거하지만, 세션 transcript를 다시 쓰지는 않습니다. 전체 기록은 여전히 디스크에서 검사할 수 있습니다.

문서: [세션](/ko/concepts/session), [Compaction](/ko/concepts/compaction), [세션 pruning](/ko/concepts/session-pruning).

기본적으로 OpenClaw는 조립과 Compaction에 내장 `legacy` 컨텍스트 엔진을 사용합니다. `kind: "context-engine"`을 제공하는 Plugin을 설치하고 `plugins.slots.contextEngine`으로 선택하면, OpenClaw는 컨텍스트 조립, `/compact`, 관련 하위 에이전트 컨텍스트 수명 주기 hook을 대신 해당 엔진에 위임합니다. `ownsCompaction: false`는 legacy 엔진으로 자동 fallback하지 않습니다. 활성 엔진은 여전히 `compact()`를 올바르게 구현해야 합니다. 전체 플러그형 인터페이스, 수명 주기 hook, 구성은 [컨텍스트 엔진](/ko/concepts/context-engine)을 참조하세요.

## `/context`가 실제로 보고하는 것

`/context`는 가능한 경우 최신 **실행 시 구성된** 시스템 프롬프트 보고서를 우선합니다.

- `System prompt (run)` = 마지막 내장(도구 사용 가능) 실행에서 캡처되어 세션 저장소에 유지된 값.
- `System prompt (estimate)` = 실행 보고서가 없을 때(또는 보고서를 생성하지 않는 CLI backend를 통해 실행할 때) 즉석에서 계산된 값.

어느 쪽이든 크기와 주요 기여 요소를 보고합니다. 전체 시스템 프롬프트나 도구 스키마를 덤프하지는 **않습니다**. 상세 모드에서는 세션 transcript를 Compaction에서 사용하는 것과 같은 실제 대화 메시지 predicate로 비교하므로, 높은 프롬프트/캐시 사용량을 압축 가능한 대화 기록과 더 쉽게 구분할 수 있습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Context engine" href="/ko/concepts/context-engine" icon="puzzle-piece">
    Plugin을 통한 사용자 지정 컨텍스트 삽입.
  </Card>
  <Card title="Compaction" href="/ko/concepts/compaction" icon="compress">
    긴 대화를 요약해 모델 창 안에 유지합니다.
  </Card>
  <Card title="System prompt" href="/ko/concepts/system-prompt" icon="message-lines">
    시스템 프롬프트가 어떻게 구성되고 각 턴에 무엇을 삽입하는지 설명합니다.
  </Card>
  <Card title="Agent loop" href="/ko/concepts/agent-loop" icon="arrows-rotate">
    수신 메시지부터 최종 응답까지의 전체 에이전트 실행 주기.
  </Card>
</CardGroup>
