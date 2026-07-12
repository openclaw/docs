---
read_when:
    - 세션과 채널 전반에서 작동하는 영구 메모리가 필요한 경우
    - AI 기반 기억 회상과 사용자 모델링을 원하는 경우
summary: Honcho Plugin을 통한 AI 네이티브 세션 간 메모리
title: Honcho 메모리
x-i18n:
    generated_at: "2026-07-12T00:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev)는 외부 Plugin을 통해 OpenClaw에 AI 네이티브 메모리를 추가합니다. 대화를 전용 서비스에 영구 저장하고 시간에 따라 사용자 및 에이전트 모델을 구축하여, 작업 공간의 Markdown 파일을 넘어서는 세션 간 컨텍스트를 에이전트에 제공합니다.

## 제공 기능

- **세션 간 메모리** - 매 턴이 끝난 후에도 대화가 유지되므로 세션 초기화, Compaction, 채널 전환 후에도 컨텍스트가 이어집니다.
- **사용자 모델링** - Honcho는 각 사용자의 프로필(선호도, 사실, 의사소통 방식)과 에이전트의 프로필(성격, 학습된 행동)을 유지합니다.
- **시맨틱 검색** - 현재 세션뿐 아니라 과거 대화에서 얻은 관찰 내용을 검색합니다.
- **다중 에이전트 인식** - 상위 에이전트가 생성된 하위 에이전트를 자동으로 추적하며, 하위 세션에는 상위 에이전트가 관찰자로 추가됩니다.

## 사용 가능한 도구

Honcho는 에이전트가 대화 중 사용할 수 있는 도구를 등록합니다.

**데이터 검색(빠르며 LLM 호출 없음):**

| 도구                        | 기능                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 여러 세션에 걸친 전체 사용자 표현                     |
| `honcho_search_conclusions` | 저장된 결론에 대한 시맨틱 검색                        |
| `honcho_search_messages`    | 여러 세션에서 메시지 검색(발신자, 날짜로 필터링)      |
| `honcho_session`            | 현재 세션 기록 및 요약                                |

**질의응답(LLM 기반):**

| 도구         | 기능                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `honcho_ask` | 사용자에 관해 질문합니다. 사실에는 `depth='quick'`, 종합 분석에는 `'thorough'`를 사용합니다. |

## 시작하기

Plugin을 설치하고 설정을 실행합니다.

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

설정 명령은 API 자격 증명을 입력받고 구성을 작성하며, 선택적으로 기존 작업 공간 메모리 파일을 마이그레이션합니다.

<Info>
Honcho는 완전히 로컬에서(자체 호스팅) 실행하거나 `api.honcho.dev`의 관리형 API를 통해 사용할 수 있습니다. 자체 호스팅 옵션에는 외부 종속성이 필요하지 않습니다.
</Info>

## 구성

설정은 `plugins.entries["openclaw-honcho"].config` 아래에 있습니다.

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // 자체 호스팅에서는 생략
          workspaceId: "openclaw", // 메모리 격리
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

자체 호스팅 인스턴스의 경우 `baseUrl`이 로컬 서버(예: `http://localhost:8000`)를 가리키도록 설정하고 API 키를 생략합니다.

## 기존 메모리 마이그레이션

기존 작업 공간 메모리 파일(`USER.md`, `MEMORY.md`, `IDENTITY.md`, `memory/`, `canvas/`)이 있는 경우 `openclaw honcho setup`이 이를 감지하고 마이그레이션을 제안합니다.

<Info>
마이그레이션은 비파괴 방식으로 진행됩니다. 파일은 Honcho에 업로드되며 원본은 절대 삭제되거나 이동되지 않습니다.
</Info>

## 작동 방식

AI의 매 턴이 끝날 때마다 대화가 Honcho에 영구 저장됩니다. 사용자와 에이전트의 메시지가 모두 관찰되므로 Honcho는 시간에 따라 모델을 구축하고 개선할 수 있습니다.

대화 중 Honcho 도구는 OpenClaw의 `before_prompt_build` Plugin 훅에서 서비스를 조회하여 모델이 프롬프트를 보기 전에 관련 컨텍스트를 주입합니다.

## Honcho와 기본 제공 메모리 비교

|                   | 기본 제공 / QMD                       | Honcho                              |
| ----------------- | ------------------------------------- | ----------------------------------- |
| **저장소**        | 작업 공간 Markdown 파일               | 전용 서비스(로컬 또는 호스팅)       |
| **세션 간 연동**  | 메모리 파일을 통해                    | 자동, 기본 내장                     |
| **사용자 모델링** | 수동(`MEMORY.md`에 작성)              | 자동 프로필                         |
| **검색**          | 벡터 + 키워드(하이브리드)             | 관찰 내용에 대한 시맨틱 검색        |
| **다중 에이전트** | 추적하지 않음                         | 상위/하위 에이전트 인식             |
| **종속성**        | 없음(기본 제공) 또는 QMD 바이너리     | Plugin 설치                         |

Honcho와 기본 제공 메모리 시스템은 함께 사용할 수 있습니다. QMD를 구성하면 Honcho의 세션 간 메모리와 함께 로컬 Markdown 파일을 검색할 수 있는 추가 도구가 제공됩니다.

## CLI 명령

```bash
openclaw honcho setup                        # API 키 구성 및 파일 마이그레이션
openclaw honcho status                       # 연결 상태 확인
openclaw honcho ask <question>               # 사용자에 관해 Honcho에 질의
openclaw honcho search <query> [-k N] [-d D] # 메모리에 대한 시맨틱 검색
```

## 추가 자료

- [Plugin 소스 코드](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 문서](https://docs.honcho.dev)
- [Honcho OpenClaw 통합 가이드](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## 관련 문서

- [메모리 개요](/ko/concepts/memory)
- [기본 제공 메모리 엔진](/ko/concepts/memory-builtin)
- [QMD 메모리 엔진](/ko/concepts/memory-qmd)
- [컨텍스트 엔진](/ko/concepts/context-engine)
