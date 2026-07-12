---
summary: 'OpenClaw이 내장 에이전트 런타임을 구성하는 방식: 코드 레이아웃, 경계, 리소스 매니페스트 및 런타임 선택.'
title: 에이전트 런타임 아키텍처
x-i18n:
    generated_at: "2026-07-12T14:56:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw은 내장 에이전트 런타임을 소유합니다. 런타임 코드는 `src/agents/`에, 모델/제공자 전송 코드는 `src/llm/`에 있으며, Plugin 대상 계약은 `openclaw/plugin-sdk/*` 배럴을 통해 노출됩니다.

## 런타임 구성

| 경로                                | 담당 범위                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 내장 시도 루프(`run.ts`, `run/`), 모델 선택 및 제공자 정규화(`model*.ts`), 제공자별 요청 매개변수(`extra-params.*`), Compaction, 트랜스크립트 및 세션 연결을 담당합니다.                            |
| `src/agents/sessions/`              | 세션 영속성(`session-manager.ts`), 리소스 검색(`package-manager.ts`, `resource-loader.ts`), 세션 내 `extensions` 로딩, 프롬프트 템플릿, Skills, 테마 및 TUI 기반 도구 렌더러(`tools/`)를 담당합니다. |
| `packages/agent-core/`              | 재사용 가능한 에이전트 코어(`@openclaw/agent-core`): 에이전트 루프, 하네스 유형, 메시지, Compaction 헬퍼, 프롬프트 템플릿, Skills 및 세션 스토리지 계약을 담당합니다.                                                           |
| `src/agents/runtime/`               | `@openclaw/agent-core`를 Plugin SDK LLM 런타임에 연결하고 로컬 프록시 유틸리티와 함께 다시 내보내는 OpenClaw 퍼사드입니다.                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw 소유 도구 정의, 매개변수 스키마, 도구 정책, 도구 호출 전후 어댑터 및 호스트/샌드박스 편집 도구를 담당합니다.                                                                                            |
| `src/agents/agent-hooks/`           | 내장 런타임 훅: Compaction 보호 장치, Compaction 지침, 컨텍스트 정리를 담당합니다.                                                                                                                                   |
| `src/agents/harness/`               | 내장 및 Plugin 등록 하네스의 레지스트리, 선택 정책 및 수명 주기를 담당합니다.                                                                                                                       |
| `src/llm/`                          | 모델/제공자 레지스트리, 전송 헬퍼 및 제공자별 스트림 구현(`src/llm/providers/`)을 담당합니다.                                                                                                          |

## 경계

코어는 OpenClaw 모듈과 SDK 배럴을 통해 내장 런타임을 호출하며, 외부 에이전트 프레임워크 패키지는 더 이상 남아 있지 않습니다. Plugin은 문서화된 `openclaw/plugin-sdk/*` 진입점을 사용하며 `src/**` 내부 모듈을 가져오지 않습니다.

`@earendil-works/pi-tui`는 계속 서드 파티 종속성으로 유지됩니다. 로컬 TUI와 세션 도구 렌더러에서 사용하는 터미널 컴포넌트 툴킷입니다. 이를 내부화하려면 별도의 벤더링 작업이 필요합니다.

## 매니페스트

리소스 패키지는 `package.json` 메타데이터에서 OpenClaw 리소스를 선언합니다. 항목은 패키지 루트를 기준으로 하는 파일 경로나 글롭입니다.

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

매니페스트에 나열되지 않은 리소스 유형은 관례적인 `extensions/`, `skills/`, `prompts/`, `themes/` 디렉터리 검색으로 대체됩니다.

## 런타임 선택

- 내장 런타임 ID는 `openclaw`입니다. 레거시 별칭 `pi`는 `openclaw`로 정규화되며, `codex-app-server`는 `codex`로 정규화됩니다.
- Plugin 하네스는 추가 런타임 ID(예: `codex`)를 등록합니다.
- 런타임 정책은 모델/제공자 범위의 `agentRuntime.id` 구성입니다(모델 항목이 제공자 항목보다 우선합니다). 설정되지 않았거나 `default`이면 `auto`로 해석됩니다.
- `auto`는 유효한 제공자 경로를 지원하는 등록된 Plugin 하네스를 선택하며, 없으면 내장 OpenClaw 런타임을 선택합니다. 제공자 또는 모델 접두사만으로는 하네스가 선택되지 않습니다.
- OpenAI는 작성된 요청 재정의가 없는 정확한 공식 HTTPS Platform Responses 또는 ChatGPT Responses 경로에 한해서만 암시적으로 `codex`를 선택할 수 있습니다. Completions 어댑터, 사용자 지정 엔드포인트 및 작성된 요청 동작이 있는 경로는 `openclaw`를 계속 사용하며, 평문 공식 HTTP 엔드포인트는 거부됩니다. [OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime)을 참조하십시오.

## 관련 문서

- [OpenClaw 에이전트 런타임 워크플로](/ko/openclaw-agent-runtime)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
