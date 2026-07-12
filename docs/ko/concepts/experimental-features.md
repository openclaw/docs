---
read_when:
    - '`.experimental` 구성 키가 안정적인지 확인하려고 합니다.'
    - 일반 기본값과 혼동하지 않고 미리보기 런타임 기능을 사용해 보고 싶은 경우
    - 현재 문서화된 실험적 플래그를 한곳에서 확인하려고 합니다.
summary: OpenClaw의 실험적 플래그가 의미하는 바와 현재 문서화된 플래그 목록
title: 실험적 기능
x-i18n:
    generated_at: "2026-07-12T15:09:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

실험적 기능은 명시적 플래그로 활성화해야 하는 옵트인 미리보기 기능입니다. 안정적인 기본값이나 장기적으로 유지되는 계약을 갖추려면 실제 환경에서 더 충분히 검증되어야 합니다.

- 문서에서 활성화하도록 안내하지 않는 한 기본적으로 꺼져 있습니다.
- 형태와 동작은 안정적인 설정보다 더 빠르게 변경될 수 있습니다.
- 이미 안정적인 경로가 있다면 해당 경로를 우선 사용하십시오.
- 먼저 소규모 환경에서 테스트한 후에만 광범위하게 배포하십시오.

## 현재 문서화된 플래그

| 기능 영역                | 키                                                                                         | 사용 시점                                                                                                                         | 자세히                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 로컬 모델 런타임         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 더 작거나 엄격한 로컬 백엔드가 OpenClaw의 전체 기본 도구 기능 영역을 처리하지 못할 때                                             | [로컬 모델](/ko/gateway/local-models)                                                            |
| 메모리 검색              | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search`가 이전 세션 기록을 인덱싱하도록 하고 추가 스토리지 및 인덱싱 비용을 감수하려는 경우                                | [메모리 설정 참조](/ko/reference/memory-config#session-memory-search-experimental)               |
| Codex 하네스              | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Code Mode를 비활성화하는 대신 네이티브 Codex app-server 0.132.0 이상이 OpenClaw 샌드박스 기반 exec-server를 대상으로 하게 하려는 경우 | [Codex 하네스 참조](/ko/plugins/codex-harness-reference#sandboxed-native-execution)              |
| 구조화된 계획 도구       | `tools.experimental.planTool`                                                              | 호환되는 런타임과 UI에서 여러 단계의 작업을 추적하도록 구조화된 `update_plan` 도구를 노출하려는 경우                               | [Gateway 설정 참조](/ko/gateway/config-tools#toolsexperimental)                                  |

## 로컬 모델 경량 모드

`agents.defaults.experimental.localModelLean: true`는 매 턴마다 에이전트의 직접 기능 영역에서 무거운 선택적 도구인 `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, `pdf`를 제외합니다. 명시적으로 허용되거나 전송에 필요한 도구는 계속 사용할 수 있지만, Tool Search가 이를 직접 노출하는 대신 카탈로그에 등록할 수 있습니다. 또한 경량 모드는 `tools.toolSearch`가 아직 설정되지 않은 경우 Plugin/MCP/클라이언트 카탈로그에 구조화된 Tool Search(`tool_search`, `tool_describe`, `tool_call`)를 기본으로 사용합니다. 이를 하나의 에이전트에만 적용하려면 `agents.list[].experimental.localModelLean`을 사용하십시오.

이미 Tool Search를 전역으로 조정한 경우 OpenClaw는 해당 설정을 변경하지 않습니다. 경량 모드의 Tool Search 기본값을 사용하지 않으려면 `tools.toolSearch: false`를 설정하십시오.

구조화된 `tools` 모드에서 경량 실행은 Tool Search 제어 항목 옆에 `exec`를 직접 표시하므로, 코딩에 맞게 조정된 로컬 모델이 익숙한 셸 경로를 계속 선택할 수 있습니다. 이는 스키마 표시 여부만 변경합니다. 일반적인 도구 정책, 샌드박싱 및 exec 승인은 계속 적용됩니다. 명시적인 `code` 및 `directory` 모드는 일반적인 Compaction 동작을 유지합니다.

### 이러한 도구를 선택한 이유

이러한 도구는 설명이 가장 길거나, 매개변수 형태가 가장 광범위하거나, 소규모 모델이 일반적인 코딩 및 대화 경로에 집중하지 못하게 할 가능성이 가장 큽니다. 컨텍스트가 작거나 더 엄격한 OpenAI 호환 백엔드에서는 이로 인해 다음과 같은 차이가 발생합니다.

- 도구 스키마가 프롬프트에 들어가는 경우와 대화 기록을 밀어내는 경우.
- 모델이 올바른 도구를 선택하는 경우와 유사한 스키마가 너무 많아 잘못된 도구 호출을 생성하는 경우.
- Chat Completions 어댑터가 구조화된 출력 제한 내에서 작동하는 경우와 도구 호출 페이로드 크기로 인해 400 오류가 발생하는 경우.

이러한 도구를 제거해도 직접 도구 목록만 짧아집니다. 모델은 여전히 `read`, `write`, `edit`, `exec`, `apply_patch`, 이미지 이해, 웹 검색/가져오기(설정된 경우), 메모리, 세션/에이전트 도구를 사용할 수 있습니다. `tools.toolSearch: false`를 설정하지 않는 한 추가 카탈로그는 Tool Search를 통해 계속 접근할 수 있으며, 명시적인 도구 허용 설정을 사용하면 경량 에이전트가 축소된 워크플로에서 해당 도구를 다시 사용할 수 있습니다.

### 활성화해야 하는 경우

모델이 Gateway와 통신할 수 있지만 전체 에이전트 턴이 오작동한다는 사실을 확인한 후 경량 모드를 활성화하십시오.

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"`가 성공합니다.
2. 일반적인 에이전트 턴이 잘못된 도구 호출이나 지나치게 큰 프롬프트로 인해 실패하거나, 모델이 도구를 무시합니다.
3. `localModelLean: true`로 전환하면 오류가 해결됩니다.

### 비활성화 상태로 두어야 하는 경우

백엔드가 전체 기본 런타임을 문제없이 처리한다면 이 기능을 비활성화 상태로 두십시오. 이 기능은 더 작은 도구 기능 영역이 필요한 로컬 스택을 위한 우회책이며, 호스팅 모델이나 리소스가 충분한 로컬 장비를 위한 기본값이 아닙니다.

경량 모드는 `tools.profile`, `tools.allow`/`tools.deny` 또는 모델의 `compat.supportsTools: false` 비상 수단을 대체하지 않습니다. 특정 에이전트에 영구적으로 더 좁은 도구 기능 영역을 적용하려면 이러한 안정적인 설정을 우선 사용하십시오.

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

하나의 에이전트에만 적용하려면 다음과 같이 설정하십시오.

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

플래그를 변경한 후 Gateway를 다시 시작하십시오. `tools.allow` 또는 `tools.alsoAllow`를 사용하여 명시적으로 유지하지 않는 한 경량 필터링은 `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, `pdf`를 제거합니다. Tool Search는 유지된 도구를 직접 노출하는 대신 계속 카탈로그에 등록할 수 있습니다.

## 실험적이라는 것이 숨겨져 있다는 의미는 아닙니다

실험적 기능은 안정적인 기능처럼 보이는 기본 설정 뒤에 숨기지 말고, 문서와 설정 경로 자체에서 실험적 기능임을 명확하게 밝혀야 합니다.

## 관련 항목

- [기능](/ko/concepts/features)
- [릴리스 채널](/ko/install/development-channels)
