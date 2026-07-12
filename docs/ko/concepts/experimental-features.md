---
read_when:
    - '`.experimental` 구성 키를 보고 이 키가 안정적인지 알고 싶습니다'
    - 일반 기본값과 혼동하지 않고 미리 보기 런타임 기능을 사용해 보고 싶은 경우
    - 현재 문서화된 실험적 플래그를 한곳에서 확인하려는 경우
summary: OpenClaw의 실험적 플래그가 의미하는 것과 현재 문서화된 플래그 목록
title: 실험적 기능
x-i18n:
    generated_at: "2026-07-12T00:42:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

실험적 기능은 명시적 플래그 뒤에 있는 선택형 미리보기 기능입니다. 안정적인 기본값이나 장기적으로 유지되는 계약을 갖추기 전에 실제 환경에서 더 많은 검증이 필요합니다.

- 문서에서 활성화하라고 안내하지 않는 한 기본적으로 꺼져 있습니다.
- 구조와 동작은 안정적인 구성보다 더 빠르게 변경될 수 있습니다.
- 이미 안정적인 경로가 있다면 해당 경로를 우선 사용하세요.
- 먼저 소규모 환경에서 테스트한 후에만 광범위하게 배포하세요.

## 현재 문서화된 플래그

| 기능 영역 | 키 | 사용 시점 | 자세히 |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 로컬 모델 런타임 | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 더 작거나 엄격한 로컬 백엔드가 OpenClaw의 전체 기본 도구 구성에서 제대로 작동하지 않을 때 | [로컬 모델](/ko/gateway/local-models) |
| 메모리 검색 | `agents.defaults.memorySearch.experimental.sessionMemory` | `memory_search`가 이전 세션 기록을 인덱싱하도록 하고 추가 저장 공간 및 인덱싱 비용을 감수하려는 경우 | [메모리 구성 참조](/ko/reference/memory-config#session-memory-search-experimental) |
| Codex 하네스 | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer` | Code Mode를 비활성화하는 대신 네이티브 Codex app-server 0.132.0 이상이 OpenClaw 샌드박스 기반 exec-server를 대상으로 실행되게 하려는 경우 | [Codex 하네스 참조](/ko/plugins/codex-harness-reference#sandboxed-native-execution) |
| 구조화된 계획 도구 | `tools.experimental.planTool` | 호환되는 런타임과 UI에서 여러 단계의 작업 추적을 위한 구조화된 `update_plan` 도구를 노출하려는 경우 | [Gateway 구성 참조](/ko/gateway/config-tools#toolsexperimental) |

## 로컬 모델 린 모드

`agents.defaults.experimental.localModelLean: true`는 매 턴 에이전트의 직접 도구 구성에서 용량이 큰 선택적 도구인 `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, `pdf`를 제외합니다. 명시적으로 허용되었거나 전달에 필요한 도구는 계속 사용할 수 있지만, Tool Search가 이를 직접 노출하는 대신 카탈로그에 등록할 수 있습니다. 또한 `tools.toolSearch`가 아직 설정되지 않은 경우 린 모드는 Plugin/MCP/클라이언트 카탈로그의 기본값을 구조화된 Tool Search(`tool_search`, `tool_describe`, `tool_call`)로 설정합니다. 이를 하나의 에이전트에만 적용하려면 `agents.list[].experimental.localModelLean`을 사용하세요.

이미 Tool Search를 전역으로 조정하고 있다면 OpenClaw는 해당 구성을 변경하지 않습니다. 린 모드의 Tool Search 기본값을 사용하지 않으려면 `tools.toolSearch: false`를 설정하세요.

구조화된 `tools` 모드에서 린 실행은 Tool Search 제어 기능 옆에 `exec`를 직접 표시하므로, 코딩에 맞춰 조정된 로컬 모델이 익숙한 셸 경로를 계속 선택할 수 있습니다. 이는 스키마의 표시 여부만 변경합니다. 일반적인 도구 정책, 샌드박싱, exec 승인은 계속 적용됩니다. 명시적인 `code` 및 `directory` 모드는 일반적인 Compaction 동작을 유지합니다.

### 이러한 도구를 선택한 이유

이러한 도구는 설명이 가장 길거나, 매개변수 구조가 가장 광범위하거나, 작은 모델이 일반적인 코딩 및 대화 경로에서 벗어나게 할 가능성이 가장 높습니다. 컨텍스트가 작거나 더 엄격한 OpenAI 호환 백엔드에서는 다음과 같은 차이를 만듭니다.

- 도구 스키마가 프롬프트에 맞게 들어가는 경우와 대화 기록을 밀어내는 경우.
- 모델이 올바른 도구를 선택하는 경우와 유사한 스키마가 너무 많아 잘못된 도구 호출을 생성하는 경우.
- Chat Completions 어댑터가 구조화된 출력 제한 내에서 작동하는 경우와 도구 호출 페이로드 크기로 인해 400 오류가 발생하는 경우.

이러한 도구를 제거해도 직접 도구 목록만 짧아집니다. 모델은 계속 `read`, `write`, `edit`, `exec`, `apply_patch`, 이미지 이해, 웹 검색/가져오기(구성된 경우), 메모리, 세션/에이전트 도구를 사용할 수 있습니다. `tools.toolSearch: false`를 설정하지 않는 한 추가 카탈로그에는 Tool Search를 통해 계속 접근할 수 있으며, 명시적인 도구 허용을 사용하면 린 에이전트에 간소화된 워크플로를 다시 추가할 수 있습니다.

### 활성화해야 하는 경우

모델이 Gateway와 통신할 수 있지만 전체 에이전트 턴이 제대로 작동하지 않는다는 사실을 확인한 후 린 모드를 활성화하세요.

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"`가 성공합니다.
2. 일반적인 에이전트 턴이 잘못된 도구 호출, 지나치게 큰 프롬프트 또는 모델의 도구 무시로 인해 실패합니다.
3. `localModelLean: true`로 전환하면 실패가 해결됩니다.

### 비활성화 상태를 유지해야 하는 경우

백엔드가 전체 기본 런타임을 문제없이 처리한다면 이 기능을 비활성화 상태로 유지하세요. 이는 더 작은 도구 구성이 필요한 로컬 스택을 위한 우회 방법이지, 호스팅 모델이나 리소스가 충분한 로컬 시스템을 위한 기본값이 아닙니다.

린 모드는 `tools.profile`, `tools.allow`/`tools.deny` 또는 모델의 `compat.supportsTools: false` 우회 옵션을 대체하지 않습니다. 특정 에이전트의 도구 구성을 영구적으로 축소하려면 이러한 안정적인 설정을 우선 사용하세요.

### 활성화

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

하나의 에이전트에만 적용하려면 다음과 같이 설정합니다.

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

플래그를 변경한 후 Gateway를 다시 시작하세요. `tools.allow` 또는 `tools.alsoAllow`를 사용하여 명시적으로 유지하지 않는 한 린 필터링은 `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, `pdf`를 제거합니다. Tool Search는 유지된 도구를 직접 노출하는 대신 계속 카탈로그에 등록할 수 있습니다.

## 실험적이라는 말이 숨겨져 있다는 뜻은 아닙니다

실험적 기능은 안정적인 기능처럼 보이는 기본 설정 뒤에 숨기지 말고, 문서와 구성 경로 자체에서 실험적임을 명확히 밝혀야 합니다.

## 관련 문서

- [기능](/ko/concepts/features)
- [릴리스 채널](/ko/install/development-channels)
