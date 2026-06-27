---
summary: OpenClaw가 내장 에이전트 런타임, 제공자, 세션, 도구 및 확장을 실행하는 방식.
title: 에이전트 런타임 아키텍처
x-i18n:
    generated_at: "2026-06-27T17:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw는 내장 agent runtime을 직접 소유합니다. runtime 코드는 `src/agents/` 아래에 있고, model/provider helper는 `src/llm/` 아래에 있으며, Plugin 대상 contract는 `openclaw/plugin-sdk/*` barrel을 통해 노출됩니다.

## Runtime 레이아웃

- `src/agents/embedded-agent-runner/`: 내장 agent attempt loop, provider stream adapter, compaction, model selection, session wiring.
- `src/agents/sessions/`: session persistence, extension loading, resource discovery, skills, prompts, themes, TUI 기반 tool renderer.
- `packages/agent-core/`: 재사용 가능한 agent core, 더 낮은 수준의 harness type, message, compaction helper, prompt template, tool/session contract.
- `src/agents/runtime/`: `@openclaw/agent-core`용 OpenClaw facade와 local proxy utility.
- `src/agents/agent-tools*.ts`: OpenClaw가 소유하는 tool definition, schema, policy, before/after hook adapter, host edit support.
- `src/agents/agent-hooks/`: compaction safeguard와 context pruning 같은 내장 runtime hook.
- `src/llm/`: model/provider registry, transport helper, provider별 stream implementation.

## 경계

Core 코드는 오래된 external agent package가 아니라 OpenClaw module과 SDK barrel을 통해 내장 runtime을 호출합니다. Plugin은 문서화된 `openclaw/plugin-sdk/*` entrypoint를 사용하며 `src/**` 내부 구현을 import하지 않습니다.

`@earendil-works/pi-tui`는 계속 third-party TUI dependency입니다. local TUI와 session renderer에서 terminal component toolkit으로 사용되며, 이를 internalize하는 것은 별도의 vendoring 작업입니다.

## Manifest

Resource package는 package metadata에 OpenClaw resource를 선언합니다.

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

package manager는 관례적인 `extensions/`, `skills/`, `prompts/`, `themes/` directory도 발견합니다.

## Runtime 선택

기본 내장 runtime id는 `openclaw`입니다. Plugin harness는 추가 runtime id를 등록할 수 있습니다. `auto`는 지원하는 Plugin harness가 있으면 이를 선택하고, 그렇지 않으면 내장 OpenClaw runtime을 사용합니다.

## 관련 항목

- [OpenClaw agent runtime workflow](/ko/openclaw-agent-runtime)
- [Agent runtime](/ko/concepts/agent-runtimes)
