---
read_when:
    - OpenClaw에서 "컨텍스트"가 무엇을 의미하는지 이해하고 싶습니다
    - 모델이 무언가를 "알고 있는" (또는 잊어버린) 이유를 디버깅하고 있습니다.
    - 컨텍스트 오버헤드를 줄이려는 경우(/context, /status, /compact)
summary: '컨텍스트: 모델이 보는 내용, 구성 방식 및 검사 방법'
title: 컨텍스트
x-i18n:
    generated_at: "2026-07-12T15:09:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"컨텍스트"는 **OpenClaw가 실행을 위해 모델에 보내는 모든 것**입니다. 이는 모델의 **컨텍스트 창**(토큰 한도)에 의해 제한됩니다.

초보자를 위한 개념 모델:

- **시스템 프롬프트**(OpenClaw에서 구성): 규칙, 도구, Skills 목록, 시간/런타임, 삽입된 워크스페이스 파일.
- **대화 기록**: 이 세션의 사용자 메시지 + 어시스턴트 메시지.
- **도구 호출/결과 + 첨부 파일**: 명령 출력, 파일 읽기, 이미지/오디오 등.

컨텍스트는 "메모리"와 _같은 개념이 아닙니다_. 메모리는 디스크에 저장했다가 나중에 다시 불러올 수 있지만, 컨텍스트는 모델의 현재 창 안에 있는 내용입니다.

## 빠른 시작(컨텍스트 검사)

- `/status` → "내 창이 얼마나 찼는가?"를 빠르게 확인하고 세션 설정을 표시합니다.
- `/context list` → 삽입된 항목과 대략적인 크기(파일별 + 합계)를 표시합니다.
- `/context detail` → 파일별 크기, 도구별 스키마 크기, Skills 항목별 크기, 시스템 프롬프트 크기, 압축 가능한 대화 기록 메시지 수를 더 상세하게 분석합니다.
- `/context map` → 현재 세션에서 추적 중인 컨텍스트 구성 요소를 WinDirStat 스타일의 트리맵 이미지로 표시합니다.
- `/usage tokens` → 일반 응답에 응답별 사용량 바닥글을 추가합니다.
- `/compact` → 창 공간을 확보하도록 이전 기록을 요약하여 압축된 항목으로 만듭니다.

참고 항목: [슬래시 명령](/ko/tools/slash-commands), [토큰 사용량 및 비용](/ko/reference/token-use), [Compaction](/ko/concepts/compaction).

## 출력 예시

값은 모델, 제공자, 도구 정책 및 워크스페이스 내용에 따라 달라집니다.

### `/context list`

```text
🧠 컨텍스트 분석
워크스페이스: <workspaceDir>
부트스트랩 최대값/파일: 12,000자
샌드박스: mode=non-main sandboxed=false
시스템 프롬프트(실행): 38,412자(~9,603토큰) (프로젝트 컨텍스트 23,901자(~5,976토큰))

삽입된 워크스페이스 파일:
- AGENTS.md: 정상 | 원본 1,742자(~436토큰) | 삽입 1,742자(~436토큰)
- SOUL.md: 정상 | 원본 912자(~228토큰) | 삽입 912자(~228토큰)
- TOOLS.md: 잘림 | 원본 54,210자(~13,553토큰) | 삽입 20,962자(~5,241토큰)
- IDENTITY.md: 정상 | 원본 211자(~53토큰) | 삽입 211자(~53토큰)
- USER.md: 정상 | 원본 388자(~97토큰) | 삽입 388자(~97토큰)
- HEARTBEAT.md: 누락 | 원본 0 | 삽입 0
- BOOTSTRAP.md: 정상 | 원본 0자(~0토큰) | 삽입 0자(~0토큰)

Skills 목록(시스템 프롬프트 텍스트): 2,184자(~546토큰) (Skills 12개)
도구: read, edit, write, exec, process, browser, message, sessions_send, …
도구 목록(시스템 프롬프트 텍스트): 1,032자(~258토큰)
도구 스키마(JSON): 31,988자(~7,997토큰) (컨텍스트에 포함되지만 텍스트로 표시되지 않음)
도구: (위와 동일)

세션 토큰(캐시됨): 총 14,250 / ctx=32,000
```

### `/context detail`

```text
🧠 컨텍스트 분석(상세)
…
상위 Skills(프롬프트 항목 크기):
- frontend-design: 412자(~103토큰)
- oracle: 401자(~101토큰)
… (Skills 10개 더 있음)

상위 도구(스키마 크기):
- browser: 9,812자(~2,453토큰)
- exec: 6,240자(~1,560토큰)
… (도구 N개 더 있음)
```

### `/context map`

최근 캐시된 실행 보고서와 세션 대화 기록에서 생성된 이미지를 전송합니다. 세션에서 일반 메시지가 실행 보고서를 생성하기 전에 `/context map`을 사용하면 추정치를 렌더링하는 대신 사용할 수 없다는 메시지를 반환합니다. 사각형의 면적은 추적된 프롬프트 문자 수에 비례합니다.

- 대화 기록(사용자 메시지, 어시스턴트 응답, 도구 결과, Compaction 요약)과 모델에만 전달되는 턴별 런타임 컨텍스트 및 훅 프롬프트 추가 내용
- 삽입된 워크스페이스 파일
- 기본 시스템 프롬프트 텍스트
- Skills 프롬프트 항목
- 도구 JSON 스키마

세션이 진행될수록 대화 그룹이 커지므로 맵은 턴마다 변경되며, Compaction 후에는 요약 타일 하나로 축소됩니다.

실행 보고서가 캐시되지 않은 경우에도 `/context list`, `/context detail`, `/context json`을 사용하여 필요에 따라 생성된 추정치를 검사할 수 있습니다.

## 컨텍스트 창에 포함되는 항목

모델이 수신하는 모든 것이 포함됩니다.

- 시스템 프롬프트(모든 섹션).
- 대화 기록.
- 도구 호출 + 도구 결과.
- 첨부 파일/대화 기록(이미지/오디오/파일).
- Compaction 요약 및 정리 산출물.
- 제공자 "래퍼" 또는 숨겨진 헤더(표시되지는 않지만 포함됨).

## OpenClaw가 시스템 프롬프트를 구성하는 방식

시스템 프롬프트는 **OpenClaw에서 관리**하며 실행할 때마다 다시 구성됩니다. 포함되는 항목은 다음과 같습니다.

- 도구 목록 + 간단한 설명.
- Skills 목록(메타데이터만 해당, 아래 참조).
- 워크스페이스 위치.
- 시간(UTC + 구성된 경우 변환된 사용자 시간).
- 런타임 메타데이터(호스트/OS/모델/사고).
- **프로젝트 컨텍스트** 아래에 삽입된 워크스페이스 부트스트랩 파일.

전체 분석: [시스템 프롬프트](/ko/concepts/system-prompt).

## 삽입된 워크스페이스 파일(프로젝트 컨텍스트)

기본적으로 OpenClaw는 다음과 같은 고정된 작업 공간 파일 세트가 존재하는 경우 이를 주입합니다.

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (최초 실행 시에만)

큰 파일은 파일별로 `agents.defaults.bootstrapMaxChars`(기본값 `20000`자)를 사용하여 잘립니다. 또한 OpenClaw는 `agents.defaults.bootstrapTotalMaxChars`(기본값 `60000`자)를 통해 여러 파일에 걸친 전체 부트스트랩 주입 상한을 적용합니다. `/context`는 **원본과 주입된** 크기 및 잘림 발생 여부를 표시합니다.

잘림이 발생하면 런타임은 Project Context 아래에 프롬프트 내 경고 블록을 주입할 수 있습니다. `agents.defaults.bootstrapPromptTruncationWarning`(`off`, `once`, `always`, 기본값 `always`)으로 이를 구성합니다.

## Skills: 주입과 온디맨드 로드

시스템 프롬프트에는 간결한 **Skills 목록**(이름 + 설명 + 위치)이 포함됩니다. 이 목록에는 실제 오버헤드가 발생합니다.

Skills 지침은 기본적으로 포함되지 않습니다. 모델은 **필요한 경우에만** 해당 Skills의 `SKILL.md`를 `read`해야 합니다.

## 도구: 두 가지 비용

도구는 다음 두 가지 방식으로 컨텍스트에 영향을 줍니다.

1. 시스템 프롬프트의 **도구 목록 텍스트**("Tooling"으로 표시되는 항목).
2. **도구 스키마**(JSON). 모델이 도구를 호출할 수 있도록 전송됩니다. 일반 텍스트로 표시되지는 않지만 컨텍스트에 포함됩니다.

`/context detail`은 가장 큰 도구 스키마를 세분화하여 무엇이 가장 큰 비중을 차지하는지 확인할 수 있게 합니다.

## 명령, 지시문 및 "인라인 단축키"

슬래시 명령은 Gateway에서 처리합니다. 다음과 같이 몇 가지 서로 다른 동작이 있습니다.

- **독립 실행 명령**: `/...`만 포함된 메시지는 명령으로 실행됩니다.
- **지시어**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`는 모델이 메시지를 보기 전에 제거됩니다.
  - 지시어만 포함된 메시지는 세션 설정을 유지합니다.
  - 일반 메시지의 인라인 지시어는 메시지별 힌트로 작동합니다.
- **인라인 단축 명령**(허용 목록에 있는 발신자만 해당): 일반 메시지 안의 특정 `/...` 토큰은 즉시 실행될 수 있으며(예: "안녕하세요 /status"), 모델이 나머지 텍스트를 보기 전에 제거됩니다.

자세한 내용: [슬래시 명령](/ko/tools/slash-commands).

## 세션, Compaction 및 가지치기(유지되는 항목)

메시지 간에 유지되는 항목은 메커니즘에 따라 다릅니다.

- **일반 기록**은 정책에 따라 Compaction되거나 가지치기될 때까지 세션 트랜스크립트에 유지됩니다.
- **Compaction**은 요약을 트랜스크립트에 유지하고 최근 메시지는 그대로 보존합니다.
- **가지치기**는 컨텍스트 창 공간을 확보하기 위해 _메모리 내_ 프롬프트에서 이전 도구 결과를 제거하지만 세션 트랜스크립트를 다시 작성하지는 않습니다. 전체 기록은 여전히 디스크에서 확인할 수 있습니다.

문서: [세션](/ko/concepts/session), [Compaction](/ko/concepts/compaction), [세션 가지치기](/ko/concepts/session-pruning).

기본적으로 OpenClaw는 조합 및 Compaction에 내장 `legacy` 컨텍스트 엔진을
사용합니다. `kind: "context-engine"`을 제공하는 Plugin을 설치하고
`plugins.slots.contextEngine`으로 선택하면 OpenClaw는 컨텍스트
조합, `/compact` 및 관련 하위 에이전트 컨텍스트 수명 주기 훅을 해당
엔진에 위임합니다. `ownsCompaction: false`는 레거시
엔진으로 자동 대체되지 않습니다. 활성 엔진은 여전히 `compact()`를 올바르게 구현해야 합니다. 전체
플러그형 인터페이스, 수명 주기 훅 및 구성은
[컨텍스트 엔진](/ko/concepts/context-engine)을 참조하십시오.

## `/context`가 실제로 보고하는 내용

`/context`는 사용할 수 있는 경우 최신 **실행에서 생성된** 시스템 프롬프트 보고서를 우선 사용합니다.

- `System prompt (run)` = 마지막 임베디드(도구 사용 가능) 실행에서 캡처되어 세션 저장소에 유지된 값입니다.
- `System prompt (estimate)` = 실행 보고서가 없을 때(또는 보고서를 생성하지 않는 CLI 백엔드를 통해 실행할 때) 즉석에서 계산된 값입니다.

어느 경우든 크기와 주요 기여 항목을 보고하며, 전체 시스템 프롬프트나 도구 스키마를 출력하지는 **않습니다**. 상세 모드에서는 세션 트랜스크립트를 Compaction에서 사용하는 것과 동일한 실제 대화 메시지 판정 조건과도 비교하므로, 높은 프롬프트/캐시 사용량과 Compaction 가능한 대화 기록을 더 쉽게 구분할 수 있습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="컨텍스트 엔진" href="/ko/concepts/context-engine" icon="puzzle-piece">
    Plugin을 통한 사용자 지정 컨텍스트 삽입입니다.
  </Card>
  <Card title="Compaction" href="/ko/concepts/compaction" icon="compress">
    긴 대화를 요약하여 모델 창 안에 유지합니다.
  </Card>
  <Card title="시스템 프롬프트" href="/ko/concepts/system-prompt" icon="message-lines">
    시스템 프롬프트가 구성되는 방식과 각 턴에 삽입하는 내용입니다.
  </Card>
  <Card title="에이전트 루프" href="/ko/concepts/agent-loop" icon="arrows-rotate">
    수신 메시지부터 최종 응답까지의 전체 에이전트 실행 주기입니다.
  </Card>
</CardGroup>
