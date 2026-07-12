---
read_when:
    - 도구 출력으로 인한 컨텍스트 증가를 줄이려고 합니다
    - Anthropic 프롬프트 캐시 최적화를 이해하려고 합니다
summary: 컨텍스트를 간결하게 유지하고 캐싱 효율을 높이기 위해 오래된 도구 결과 정리하기
title: 세션 정리
x-i18n:
    generated_at: "2026-07-12T15:12:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

세션 프루닝은 각 LLM 호출 전에 컨텍스트에서 **오래된 도구 결과**를 제거합니다. 일반 대화 텍스트를 다시 작성하지 않으면서 누적된 도구 출력(exec 결과, 파일 읽기, 검색 결과)으로 인한 컨텍스트 비대화를 줄입니다.

<Info>
프루닝은 메모리 내에서만 수행되며, 디스크의 세션 트랜스크립트를 수정하지 않습니다. 전체 기록은 항상 보존됩니다.
</Info>

## 중요한 이유

긴 세션에는 도구 출력이 누적되어 컨텍스트 창이 비대해집니다. 이로 인해 비용이 증가하고 필요 이상으로 일찍 [Compaction](/ko/concepts/compaction)이 수행될 수 있습니다.

프루닝은 특히 **Anthropic 프롬프트 캐싱**에 유용합니다. 캐시 TTL이 만료되면 다음 요청에서 전체 프롬프트를 다시 캐싱합니다. 프루닝은 캐시 쓰기 크기를 줄여 비용을 직접 절감합니다.

## 작동 방식

프루닝은 `cache-ttl` 모드에서 실행되며, 시간 확인과 컨텍스트 크기 확인을 모두 통과해야 합니다:

1. 캐시 TTL이 만료될 때까지 기다립니다(수동으로 설정한 경우 기본값은 5분이며, Anthropic 자동 기본값은 [스마트 기본값](#smart-defaults)을 참조하십시오). TTL이 경과하기 전에는 인접한 턴에서 프롬프트 캐시를 재사용할 수 있도록 가지치기를 전혀 수행하지 않습니다.
2. TTL이 경과하면 모델의 컨텍스트 창을 기준으로 전체 컨텍스트 크기를 추정합니다. 비율이 `softTrimRatio`(기본값 0.3)보다 낮으면 가지치기를 건너뛰고 TTL 시계를 계속 실행합니다.
3. 비율을 초과하는 과도하게 큰 도구 결과를 **소프트 트리밍**합니다. 앞부분과 뒷부분을 유지하고(기본값은 각각 1500자이며, 합계는 최대 4000자로 제한), 그 사이에 `...`을 삽입합니다.
4. 비율이 여전히 `hardClearRatio`(기본값 0.5) 이상이고 가지치기할 수 있는 도구 콘텐츠가 `minPrunableToolChars`(기본값 50,000) 이상 남아 있으면 해당 결과를 **완전히 지웁니다**. 즉, 콘텐츠를 자리표시자(기본값 `[Old tool result content cleared]`)로 교체합니다.
5. 가지치기가 실제로 컨텍스트를 변경한 경우에만 TTL 시계를 재설정하여 후속 요청이 새 캐시를 재사용하도록 합니다.

임계값과 관계없이 두 가지 안전 규칙이 적용됩니다. 가장 최근의 `keepLastAssistants`개 어시스턴트 턴(기본값 3)은 절대 정리되지 않으며, 세션의 첫 번째 사용자 메시지 이전 내용도 절대 정리되지 않습니다(`SOUL.md`/`USER.md` 같은 부트스트랩 읽기를 보호합니다).

`toolResult` 메시지만 대상이 되며, 일반 대화 텍스트는 그대로 유지됩니다. 정리할 수 있는 도구 이름의 범위를 지정하려면 `agents.defaults.contextPruning.tools.{allow,deny}`를 사용하십시오.

## 레거시 이미지 정리

OpenClaw는 원시 이미지 블록이나 프롬프트 하이드레이션 미디어 마커를 기록에 유지하는 세션을 위해 별도의 멱등적 재생 뷰도 생성합니다.

- 최근 후속 요청에 대한 프롬프트 캐시 접두사가 안정적으로 유지되도록 **가장 최근에 완료된 턴 3개**를 바이트 단위까지 그대로 보존합니다. 이 개수에는 이미지가 포함된 턴뿐만 아니라 완료된 모든 턴이 포함되므로, 텍스트 전용 턴도 이 범위에 포함됩니다.
- 재생 뷰에서는 `user` 또는 `toolResult` 기록에 있는 오래되고 이미 처리된 이미지 블록을 `[image data removed - already processed by model]`로 대체합니다.
- `[media attached: ...]`, `[Image: source: ...]`, `media://inbound/...`와 같은 오래된 텍스트 미디어 참조는 `[media reference removed - already processed by model]`로 대체합니다. 현재 턴의 첨부 파일 마커는 그대로 유지되므로 비전 모델이 새 이미지를 계속 하이드레이션할 수 있습니다.
- 원시 세션 트랜스크립트는 다시 작성하지 않으므로 기록 뷰어에서 원본 메시지 항목과 해당 이미지를 계속 렌더링할 수 있습니다.
- 이는 위의 일반적인 캐시 TTL 정리와 별개입니다. 이후 턴에서 반복되는 이미지 페이로드나 오래된 미디어 참조로 인해 프롬프트 캐시가 무효화되는 것을 방지하기 위한 기능입니다.

## 스마트 기본값

번들 Anthropic Plugin은 Anthropic(또는 Claude CLI) 인증 프로필을 처음 확인할 때 프루닝 및 Heartbeat 주기를 자동으로 구성하지만, 아직 명시적으로 설정하지 않은 필드에만 적용합니다.

| 인증 모드                                | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/토큰(Claude CLI 재사용 포함)       | `cache-ttl`           | `1h`                 | `1h`              |
| API 키                                   | `cache-ttl`           | `1h`                 | `30m`             |

`agents.defaults.contextPruning.mode` 또는 `agents.defaults.heartbeat.every`를 직접 설정하면 OpenClaw는 해당 설정을 재정의하지 않습니다. 이 자동 기본값은 Anthropic 계열 인증에만 적용되며, 다른 제공자는 별도로 구성하지 않으면 프루닝이 `off`로 설정됩니다.

## 활성화 또는 비활성화

Anthropic 이외의 제공자에서는 프루닝이 기본적으로 꺼져 있습니다. 활성화하려면 다음과 같이 설정하십시오.

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

비활성화하려면 `mode: "off"`로 설정하십시오.

## 프루닝과 Compaction 비교

|            | 프루닝              | Compaction          |
| ---------- | ------------------- | ------------------- |
| **기능**   | 도구 결과를 줄입니다 | 대화를 요약합니다   |
| **저장 여부** | 아니요(요청별)    | 예(트랜스크립트에 저장) |
| **범위**   | 도구 결과만         | 전체 대화           |

두 기능은 서로 보완합니다. 프루닝은 Compaction 주기 사이에 도구 출력을 간결하게 유지합니다.

## 추가 자료

- [Compaction](/ko/concepts/compaction): 요약 기반 컨텍스트 축소
- [Gateway 구성](/ko/gateway/configuration): 모든 프루닝 구성 옵션(`contextPruning.*`)

## 관련 문서

- [세션 관리](/ko/concepts/session)
- [세션 도구](/ko/concepts/session-tool)
- [컨텍스트 엔진](/ko/concepts/context-engine)
