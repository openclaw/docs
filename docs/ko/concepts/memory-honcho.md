---
read_when:
    - 세션과 채널 전반에서 동작하는 영구 메모리를 원합니다.
    - AI 기반 회상 기능과 사용자 모델링을 원합니다.
summary: Honcho Plugin을 통한 AI 네이티브 교차 세션 메모리
title: Honcho 메모리
x-i18n:
    generated_at: "2026-04-24T06:10:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
    postprocess_version: locale-links-v1
---

[Honcho](https://honcho.dev)는 OpenClaw에 AI 네이티브 메모리를 추가합니다. 대화를 전용 서비스에 영속화하고 시간에 따라 사용자 및 에이전트 모델을 구축하여, 워크스페이스 Markdown 파일을 넘어서는 교차 세션 컨텍스트를 에이전트에 제공합니다.

## 제공 기능

- **교차 세션 메모리** -- 모든 턴 이후 대화가 영속화되므로 세션 재설정, Compaction, 채널 전환 이후에도 컨텍스트가 유지됩니다.
- **사용자 모델링** -- Honcho는 각 사용자(선호도, 사실, 커뮤니케이션 스타일)와 에이전트(성격, 학습된 동작)에 대한 프로필을 유지합니다.
- **의미 기반 검색** -- 현재 세션뿐 아니라 과거 대화의 관찰 결과를 대상으로 검색합니다.
- **멀티 에이전트 인식** -- 부모 에이전트가 생성한 하위 에이전트를 자동으로 추적하며, 부모는 하위 세션의 관찰자로 추가됩니다.

## 사용 가능한 도구

Honcho는 대화 중 에이전트가 사용할 수 있는 도구를 등록합니다.

**데이터 조회(빠름, LLM 호출 없음):**

| Tool                        | 기능                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 세션 전반에 걸친 전체 사용자 표현                      |
| `honcho_search_conclusions` | 저장된 결론에 대한 의미 기반 검색                      |
| `honcho_search_messages`    | 세션 전반의 메시지 찾기(발신자, 날짜로 필터링)         |
| `honcho_session`            | 현재 세션 기록 및 요약                                 |

**Q&A(LLM 기반):**

| Tool         | 기능                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| `honcho_ask` | 사용자에 대해 질문합니다. 사실에는 `depth='quick'`, 종합에는 `'thorough'` 사용 |

## 시작하기

Plugin을 설치하고 설정을 실행하세요.

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

설정 명령은 API 자격 증명을 묻고, config를 작성하며, 기존 워크스페이스 메모리 파일 마이그레이션을 선택적으로 수행합니다.

<Info>
Honcho는 완전히 로컬(자체 호스팅)로 실행하거나 `api.honcho.dev`의 관리형 API를 통해 실행할 수 있습니다. 자체 호스팅 옵션에는 외부 의존성이 필요하지 않습니다.
</Info>

## 구성

설정은 `plugins.entries["openclaw-honcho"].config` 아래에 있습니다.

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // 자체 호스팅이면 생략
          workspaceId: "openclaw", // 메모리 격리
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

자체 호스팅 인스턴스의 경우 `baseUrl`을 로컬 서버(예:
`http://localhost:8000`)로 지정하고 API 키는 생략하세요.

## 기존 메모리 마이그레이션

기존 워크스페이스 메모리 파일(`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`)이 있으면 `openclaw honcho setup`이 이를 감지하고 마이그레이션을 제안합니다.

<Info>
마이그레이션은 비파괴적입니다 -- 파일은 Honcho에 업로드됩니다. 원본은 삭제되거나 이동되지 않습니다.
</Info>

## 동작 방식

각 AI 턴 이후 대화는 Honcho에 영속화됩니다. 사용자와 에이전트 메시지가 모두 관찰되므로, Honcho는 시간이 지남에 따라 모델을 구축하고 정제할 수 있습니다.

대화 중에는 Honcho 도구가 `before_prompt_build` 단계에서 서비스를 쿼리하여, 모델이 프롬프트를 보기 전에 관련 컨텍스트를 주입합니다. 이렇게 하면 정확한 턴 경계와 관련성 높은 회상이 보장됩니다.

## Honcho와 내장 메모리 비교

|                   | 내장 / QMD                    | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **저장소**        | 워크스페이스 Markdown 파일    | 전용 서비스(로컬 또는 호스팅)       |
| **교차 세션**     | 메모리 파일을 통해            | 자동, 기본 내장                     |
| **사용자 모델링** | 수동(`MEMORY.md`에 작성)      | 자동 프로필                         |
| **검색**          | 벡터 + 키워드(하이브리드)     | 관찰 결과에 대한 의미 기반          |
| **멀티 에이전트** | 추적되지 않음                 | 부모/자식 인식                      |
| **의존성**        | 없음(내장) 또는 QMD 바이너리  | Plugin 설치                         |

Honcho와 내장 메모리 시스템은 함께 사용할 수 있습니다. QMD가 구성되어 있으면 Honcho의 교차 세션 메모리와 함께 로컬 Markdown 파일을 검색하기 위한 추가 도구를 사용할 수 있습니다.

## CLI 명령

```bash
openclaw honcho setup                        # API 키 구성 및 파일 마이그레이션
openclaw honcho status                       # 연결 상태 확인
openclaw honcho ask <question>               # 사용자에 대해 Honcho에 질의
openclaw honcho search <query> [-k N] [-d D] # 메모리에 대한 의미 기반 검색
```

## 추가 자료

- [Plugin 소스 코드](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 문서](https://docs.honcho.dev)
- [Honcho OpenClaw 통합 가이드](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/ko/concepts/memory) -- OpenClaw 메모리 개요
- [Context Engines](/ko/concepts/context-engine) -- Plugin 컨텍스트 엔진의 동작 방식

## 관련

- [메모리 개요](/ko/concepts/memory)
- [내장 메모리 엔진](/ko/concepts/memory-builtin)
- [QMD memory engine](/ko/concepts/memory-qmd)
