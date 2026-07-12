---
read_when:
    - OpenClaw에서 "컨텍스트"가 무엇을 의미하는지 이해하고 싶습니다.
    - 모델이 무언가를 "알고" 있는(또는 잊어버린) 이유를 디버깅하고 있습니다.
    - 컨텍스트 오버헤드를 줄이려는 경우 (/context, /status, /compact)
summary: '컨텍스트: 모델이 보는 내용, 구성 방식, 검사 방법'
title: 컨텍스트
x-i18n:
    generated_at: "2026-07-12T00:42:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"컨텍스트"는 **OpenClaw가 한 번의 실행을 위해 모델에 보내는 모든 것**입니다. 이는 모델의 **컨텍스트 윈도우**(토큰 한도)에 의해 제한됩니다.

초보자를 위한 개념 모델:

- **시스템 프롬프트**(OpenClaw가 구성): 규칙, 도구, Skills 목록, 시간/런타임 및 삽입된 작업 공간 파일.
- **대화 기록**: 이 세션의 사용자 메시지 + 어시스턴트 메시지.
- **도구 호출/결과 + 첨부 파일**: 명령 출력, 파일 읽기, 이미지/오디오 등.

컨텍스트는 "메모리"와 _같은 것이 아닙니다_. 메모리는 디스크에 저장했다가 나중에 다시 불러올 수 있지만, 컨텍스트는 모델의 현재 윈도우 안에 있는 내용입니다.

## 빠른 시작(컨텍스트 검사)

- `/status` → "내 윈도우가 얼마나 찼는가?"를 빠르게 확인하는 보기 + 세션 설정.
- `/context list` → 삽입된 항목 + 대략적인 크기(파일별 + 합계).
- `/context detail` → 더 자세한 분석: 파일별 크기, 도구별 스키마 크기, Skills 항목별 크기, 시스템 프롬프트 크기 및 압축 가능한 대화 기록 메시지 수.
- `/context map` → 현재 세션에서 추적된 컨텍스트 기여 요소를 보여 주는 WinDirStat 스타일 트리맵 이미지.
- `/usage tokens` → 일반 응답마다 사용량 바닥글 추가.
- `/compact` → 이전 기록을 간결한 항목으로 요약하여 윈도우 공간 확보.

함께 보기: [슬래시 명령어](/ko/tools/slash-commands), [토큰 사용량 및 비용](/ko/reference/token-use), [Compaction](/ko/concepts/compaction).

## 출력 예시

값은 모델, 제공자, 도구 정책 및 작업 공간의 내용에 따라 달라집니다.

### `/context list`

```text
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

```text
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

최근 캐시된 실행 보고서와 세션 대화 기록을 바탕으로 생성한 이미지를 전송합니다. 세션에서 일반 메시지가 실행 보고서를 생성하기 전에는 `/context map`이 추정치를 렌더링하는 대신 사용할 수 없다는 메시지를 반환합니다. 사각형의 면적은 추적된 프롬프트 문자 수에 비례합니다.

- 대화 기록(사용자 메시지, 어시스턴트 응답, 도구 결과, Compaction 요약)과 모델에만 전달되는 턴별 런타임 컨텍스트 및 훅 프롬프트 추가 내용
- 삽입된 작업 공간 파일
- 기본 시스템 프롬프트 텍스트
- Skills 프롬프트 항목
- 도구 JSON 스키마

세션이 진행됨에 따라 대화 그룹이 커지므로 맵은 턴마다 달라집니다. Compaction 이후에는 요약 타일 하나로 축소됩니다.

캐시된 실행 보고서가 없어도 `/context list`, `/context detail`, `/context json`으로 요청 시점의 추정치를 계속 검사할 수 있습니다.

## 컨텍스트 윈도우에 포함되는 항목

모델이 받는 모든 것이 포함됩니다.

- 시스템 프롬프트(모든 섹션).
- 대화 기록.
- 도구 호출 + 도구 결과.
- 첨부 파일/대화 기록(이미지/오디오/파일).
- Compaction 요약 및 가지치기 산출물.
- 제공자의 "래퍼" 또는 숨겨진 헤더(표시되지는 않지만 포함됨).

## OpenClaw가 시스템 프롬프트를 구성하는 방법

시스템 프롬프트는 **OpenClaw가 소유**하며 실행할 때마다 다시 구성됩니다. 다음 항목이 포함됩니다.

- 도구 목록 + 짧은 설명.
- Skills 목록(메타데이터만 포함, 아래 참조).
- 작업 공간 위치.
- 시간(UTC + 설정된 경우 변환된 사용자 시간).
- 런타임 메타데이터(호스트/OS/모델/사고 방식).
- **프로젝트 컨텍스트** 아래에 삽입된 작업 공간 부트스트랩 파일.

전체 분석: [시스템 프롬프트](/ko/concepts/system-prompt).

## 삽입된 작업 공간 파일(프로젝트 컨텍스트)

기본적으로 OpenClaw는 다음과 같은 고정된 작업 공간 파일이 존재하면 삽입합니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`(첫 실행에만 해당)

큰 파일은 `agents.defaults.bootstrapMaxChars`(기본값 `20000`자)를 기준으로 파일별로 잘립니다. OpenClaw는 `agents.defaults.bootstrapTotalMaxChars`(기본값 `60000`자)를 사용하여 전체 파일의 부트스트랩 삽입에도 총 한도를 적용합니다. `/context`는 **원본 크기와 삽입된 크기** 및 잘림 여부를 표시합니다.

잘림이 발생하면 런타임이 프로젝트 컨텍스트 아래의 프롬프트에 경고 블록을 삽입할 수 있습니다. `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`, 기본값 `always`)으로 설정합니다.

## Skills: 삽입과 요청 시 로드

시스템 프롬프트에는 간결한 **Skills 목록**(이름 + 설명 + 위치)이 포함됩니다. 이 목록은 실제로 오버헤드를 발생시킵니다.

Skills 지침은 기본적으로 포함되지 않습니다. 모델은 **필요할 때만** 해당 Skills의 `SKILL.md`를 `read`해야 합니다.

## 도구: 두 가지 비용

도구는 두 가지 방식으로 컨텍스트에 영향을 줍니다.

1. 시스템 프롬프트의 **도구 목록 텍스트**("도구 구성"으로 표시되는 내용).
2. **도구 스키마**(JSON). 모델이 도구를 호출할 수 있도록 전송됩니다. 일반 텍스트로 표시되지는 않지만 컨텍스트에 포함됩니다.

`/context detail`은 어떤 항목이 가장 큰 비중을 차지하는지 확인할 수 있도록 가장 큰 도구 스키마를 분석합니다.

## 명령어, 지시문 및 "인라인 단축 명령"

슬래시 명령어는 Gateway에서 처리합니다. 동작 방식은 몇 가지로 나뉩니다.

- **독립 실행형 명령어**: `/...`만 포함된 메시지는 명령어로 실행됩니다.
- **지시문**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`는 모델이 메시지를 보기 전에 제거됩니다.
  - 지시문만 포함된 메시지는 세션 설정을 유지합니다.
  - 일반 메시지의 인라인 지시문은 메시지별 힌트로 작동합니다.
- **인라인 단축 명령**(허용 목록에 포함된 발신자만 해당): 일반 메시지 안의 특정 `/...` 토큰은 즉시 실행될 수 있으며(예: "안녕하세요 /status"), 모델이 나머지 텍스트를 보기 전에 제거됩니다.

자세한 내용: [슬래시 명령어](/ko/tools/slash-commands).

## 세션, Compaction 및 가지치기(유지되는 항목)

메시지 간에 유지되는 항목은 메커니즘에 따라 달라집니다.

- **일반 기록**은 정책에 따라 Compaction 또는 가지치기될 때까지 세션 대화 기록에 유지됩니다.
- **Compaction**은 요약을 대화 기록에 유지하고 최근 메시지는 그대로 보존합니다.
- **가지치기**는 컨텍스트 윈도우 공간을 확보하기 위해 _메모리 내_ 프롬프트에서 이전 도구 결과를 삭제하지만, 세션 대화 기록을 다시 작성하지는 않습니다. 전체 기록은 디스크에서 계속 검사할 수 있습니다.

문서: [세션](/ko/concepts/session), [Compaction](/ko/concepts/compaction), [세션 가지치기](/ko/concepts/session-pruning).

기본적으로 OpenClaw는 조립과 Compaction에 내장 `legacy` 컨텍스트 엔진을 사용합니다.
`kind: "context-engine"`을 제공하는 Plugin을 설치하고
`plugins.slots.contextEngine`으로 선택하면 OpenClaw는 컨텍스트
조립, `/compact` 및 관련 하위 에이전트 컨텍스트 수명 주기 훅을 해당
엔진에 대신 위임합니다. `ownsCompaction: false`는 레거시
엔진으로 자동 대체되지 않습니다. 활성 엔진이 여전히 `compact()`를 올바르게 구현해야 합니다. 전체
플러그인형 인터페이스, 수명 주기 훅 및 설정은
[컨텍스트 엔진](/ko/concepts/context-engine)을 참조하세요.

## `/context`가 실제로 보고하는 내용

`/context`는 사용 가능한 경우 최근의 **실행에서 구성된** 시스템 프롬프트 보고서를 우선 사용합니다.

- `System prompt (run)` = 마지막 내장형(도구 사용 가능) 실행에서 캡처되어 세션 저장소에 유지된 값.
- `System prompt (estimate)` = 실행 보고서가 없을 때(또는 보고서를 생성하지 않는 CLI 백엔드를 통해 실행할 때) 즉석에서 계산된 값.

두 경우 모두 크기와 주요 기여 요소를 보고하지만 전체 시스템 프롬프트 또는 도구 스키마를 덤프하지는 **않습니다**. 상세 모드에서는 세션 대화 기록을 Compaction에서 사용하는 것과 동일한 실제 대화 메시지 판별 조건과 비교하므로, 높은 프롬프트/캐시 사용량과 압축 가능한 대화 기록을 더 쉽게 구분할 수 있습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Context engine" href="/ko/concepts/context-engine" icon="puzzle-piece">
    Plugin을 통한 사용자 지정 컨텍스트 삽입.
  </Card>
  <Card title="Compaction" href="/ko/concepts/compaction" icon="compress">
    긴 대화를 요약하여 모델 윈도우 안에 유지합니다.
  </Card>
  <Card title="System prompt" href="/ko/concepts/system-prompt" icon="message-lines">
    시스템 프롬프트가 구성되는 방법과 각 턴에 삽입되는 내용입니다.
  </Card>
  <Card title="Agent loop" href="/ko/concepts/agent-loop" icon="arrows-rotate">
    수신 메시지부터 최종 응답까지의 전체 에이전트 실행 주기입니다.
  </Card>
</CardGroup>
