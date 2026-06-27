---
read_when:
    - '`.experimental` 구성 키가 안정적인지 확인하고 싶습니다'
    - 일반 기본값과 혼동하지 않고 미리 보기 런타임 기능을 사용해 보고 싶은 경우
    - 현재 문서화된 실험적 플래그를 한곳에서 찾으려는 경우
summary: OpenClaw에서 실험적 플래그가 의미하는 것과 현재 문서화된 플래그
title: 실험적 기능
x-i18n:
    generated_at: "2026-06-27T17:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw의 실험적 기능은 **옵트인 프리뷰 기능 영역**입니다. 안정적인 기본값이나 장기 공개 계약으로 자리 잡기 전에 실제 사용 검증이 더 필요하므로 명시적 플래그 뒤에 있습니다.

일반 구성과는 다르게 다루세요.

- 관련 문서에서 사용해 보라고 안내하지 않는 한 **기본적으로 꺼진 상태**로 두세요.
- 안정적인 구성보다 **형태와 동작이 더 빠르게 바뀔 수 있음**을 예상하세요.
- 이미 안정적인 경로가 있다면 먼저 그 경로를 선호하세요.
- OpenClaw를 광범위하게 배포하는 경우, 실험적 플래그를 공유 기준선에 포함하기 전에 더 작은 환경에서 테스트하세요.

## 현재 문서화된 플래그

| 기능 영역                 | 키                                                                                         | 사용 시점                                                                                                                         | 자세히                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 로컬 모델 런타임          | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 더 작거나 더 엄격한 로컬 백엔드가 OpenClaw의 전체 기본 도구 노출 범위를 처리하지 못할 때                                        | [로컬 모델](/ko/gateway/local-models)                                                            |
| 메모리 검색              | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | `memory_search`가 이전 세션 전사를 인덱싱하고 추가 저장소/인덱싱 비용을 감수하도록 하려는 경우                                  | [메모리 구성 참조](/ko/reference/memory-config#session-memory-search-experimental)               |
| Codex 하네스             | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 네이티브 Codex 앱 서버 0.132.0 이상이 코드 모드를 비활성화하는 대신 OpenClaw 샌드박스 기반 exec-server를 대상으로 하게 하려는 경우 | [Codex 하네스 참조](/ko/plugins/codex-harness-reference#sandboxed-native-execution)              |
| 구조화된 계획 도구       | `tools.experimental.planTool`                                                              | 호환되는 런타임과 UI에서 다단계 작업 추적을 위해 구조화된 `update_plan` 도구를 노출하려는 경우                                  | [Gateway 구성 참조](/ko/gateway/config-tools#toolsexperimental)                                  |

## 로컬 모델 린 모드

`agents.defaults.experimental.localModelLean: true`는 성능이 약한 로컬 모델 설정을 위한 압력 완화 밸브입니다. 이 옵션이 켜져 있으면 OpenClaw는 모든 턴에서 에이전트의 도구 노출 범위에서 기본 도구 세 가지인 `browser`, `cron`, `message`를 제거합니다. 또한 `tools.toolSearch`가 명시적으로 구성되지 않은 경우 해당 실행은 기본적으로 구조화된 도구 검색 제어를 사용하므로, 더 큰 Plugin, MCP 또는 클라이언트 도구 카탈로그가 프롬프트에 그대로 쏟아지는 대신 `tool_search`, `tool_describe`, `tool_call` 뒤에 유지됩니다. 직접 `message` 전달이 필요한 실행은 린 모드의 기본 도구 검색을 활성화하는 대신 해당 도구를 직접 유지합니다. 구성된 에이전트 하나에 대해 같은 동작을 활성화하거나 비활성화하려면 `agents.list[].experimental.localModelLean`을 사용하세요.

### 이 세 도구인 이유

이 세 도구는 기본 OpenClaw 런타임에서 설명이 가장 길고 매개변수 형태가 가장 많습니다. 작은 컨텍스트 또는 더 엄격한 OpenAI 호환 백엔드에서는 이것이 다음 차이를 만듭니다.

- 도구 스키마가 프롬프트에 깔끔하게 들어가는 경우와 대화 기록을 밀어내는 경우.
- 모델이 올바른 도구를 선택하는 경우와 비슷해 보이는 스키마가 너무 많아 잘못된 형식의 도구 호출을 내보내는 경우.
- Chat Completions 어댑터가 서버의 구조화 출력 제한 안에 머무르는 경우와 도구 호출 페이로드 크기 때문에 400 오류가 발생하는 경우.

이들을 제거해도 OpenClaw를 조용히 다른 방식으로 다시 연결하지는 않습니다. 직접 도구 목록을 더 짧게 만들 뿐입니다. 모델은 여전히 `read`, `write`, `edit`, `exec`, `apply_patch`, 웹 검색/가져오기(구성된 경우), 메모리, 세션/에이전트 도구를 사용할 수 있습니다. `tools.toolSearch: false`를 명시적으로 설정하지 않는 한 추가 카탈로그는 도구 검색을 통해 계속 호출할 수 있습니다.

### 켜야 하는 경우

모델이 Gateway와 통신할 수 있음은 이미 증명했지만 전체 에이전트 턴이 오동작할 때 린 모드를 활성화하세요. 일반적인 신호 흐름은 다음과 같습니다.

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"`가 성공합니다.
2. 일반 에이전트 턴이 잘못된 형식의 도구 호출, 과도하게 큰 프롬프트, 또는 모델이 도구를 무시하는 문제로 실패합니다.
3. `localModelLean: true`를 전환하면 실패가 해소됩니다.

### 꺼둬야 하는 경우

백엔드가 전체 기본 런타임을 깔끔하게 처리한다면 이 옵션을 꺼두세요. 린 모드는 기본값이 아니라 우회 방법입니다. 일부 로컬 스택이 제대로 동작하려면 더 작은 도구 노출 범위가 필요하기 때문에 존재합니다. 호스팅 모델과 충분한 리소스를 갖춘 로컬 장비에는 필요하지 않습니다.

린 모드는 `tools.profile`, `tools.allow`/`tools.deny`, 또는 모델 `compat.supportsTools: false` 탈출구를 대체하지도 않습니다. 특정 에이전트에 대해 영구적으로 더 좁은 도구 노출 범위가 필요하다면 실험적 플래그보다 이러한 안정적인 조정 옵션을 선호하세요.

이미 도구 검색을 전역으로 조정하고 있다면 OpenClaw는 해당 운영자 구성을 그대로 둡니다. 린 모드의 기본 도구 검색을 사용하지 않으려면 `tools.toolSearch: false`를 설정하세요.

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

에이전트 하나에만 적용하려면:

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

플래그를 변경한 뒤 Gateway를 다시 시작하고, 다음 명령으로 줄어든 도구 목록을 확인하세요.

```bash
openclaw status --deep
```

심층 상태 출력에는 활성 에이전트 도구가 나열됩니다. 린 모드가 켜져 있으면 현재 전달 모드가 직접 `message` 응답을 강제하지 않는 한 `browser`, `cron`, `message`가 없어야 합니다.

## 실험적이라는 뜻은 숨겨져 있다는 뜻이 아닙니다

기능이 실험적이라면 OpenClaw는 문서와 구성 경로 자체에서 이를 명확히 밝혀야 합니다. 해서는 **안 되는** 일은 프리뷰 동작을 안정적으로 보이는 기본 조정 옵션에 몰래 넣고 그것이 정상인 척하는 것입니다. 그런 방식이 구성 기능 영역을 지저분하게 만듭니다.

## 관련

- [기능](/ko/concepts/features)
- [릴리스 채널](/ko/install/development-channels)
