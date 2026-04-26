---
read_when:
    - 도구 출력으로 인한 컨텍스트 증가를 줄이려고 합니다
    - Anthropic 프롬프트 캐시 최적화를 이해하려고 합니다
summary: 오래된 도구 결과를 잘라내어 컨텍스트를 가볍게 유지하고 캐싱 효율을 높이기
title: 세션 정리
x-i18n:
    generated_at: "2026-04-26T11:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
---

세션 정리는 각 LLM 호출 전에 컨텍스트에서 **오래된 도구 결과**를 잘라냅니다. 일반 대화 텍스트는 다시 쓰지 않고도, 누적된 도구 출력(exec 결과, 파일 읽기, 검색 결과)으로 인한 컨텍스트 비대를 줄입니다.

<Info>
정리는 메모리 내에서만 수행되며, 디스크의 세션 transcript는 수정하지 않습니다.
전체 기록은 항상 보존됩니다.
</Info>

## 중요한 이유

긴 세션에서는 컨텍스트 윈도우를 부풀리는 도구 출력이 쌓입니다. 이로 인해
비용이 증가하고 [Compaction](/ko/concepts/compaction)이 필요 이상으로 빨리
발생할 수 있습니다.

정리는 특히 **Anthropic 프롬프트 캐싱**에서 유용합니다. 캐시 TTL이
만료되면 다음 요청이 전체 프롬프트를 다시 캐시합니다. 정리는
캐시 쓰기 크기를 줄여 비용을 직접 낮춥니다.

## 작동 방식

1. 캐시 TTL이 만료될 때까지 기다립니다(기본값 5분).
2. 일반 정리를 위해 오래된 도구 결과를 찾습니다(대화 텍스트는 그대로 둡니다).
3. 크기가 큰 결과는 **soft-trim**합니다. 앞부분과 뒷부분을 남기고 `...`를 삽입합니다.
4. 나머지는 **hard-clear**합니다. 플레이스홀더로 대체합니다.
5. TTL을 재설정하여 후속 요청이 새 캐시를 재사용하도록 합니다.

## 레거시 이미지 정리

OpenClaw는 또한 기록에 원시 이미지 블록이나 프롬프트 hydration 미디어 마커가
지속 저장된 세션에 대해 별도의 멱등 replay 뷰를 구성합니다.

- **가장 최근의 완료된 3개 턴**은 바이트 단위 그대로 보존하여, 최근 후속 요청에 대한
  프롬프트 캐시 접두사가 안정적으로 유지되도록 합니다.
- replay 뷰에서는 `user` 또는 `toolResult` 기록의 오래된 이미 처리된 이미지 블록을
  `[image data removed - already processed by model]`로 대체할 수 있습니다.
- `[media attached: ...]`,
  `[Image: source: ...]`, `media://inbound/...` 같은 오래된 텍스트 미디어 참조는
  `[media reference removed - already processed by model]`로 대체할 수 있습니다. 현재 턴의
  첨부 파일 마커는 그대로 유지되므로 비전 모델이 새 이미지를 계속 hydration할 수 있습니다.
- 원시 세션 transcript는 다시 쓰지 않으므로 기록 뷰어는 여전히 원래 메시지 항목과
  이미지들을 렌더링할 수 있습니다.
- 이는 일반 캐시 TTL 정리와는 별개입니다. 이후 턴에서 반복되는 이미지 페이로드나
  오래된 미디어 참조가 프롬프트 캐시를 깨뜨리는 일을 막기 위해 존재합니다.

## 스마트 기본값

OpenClaw는 Anthropic 프로필에 대해 자동으로 정리를 활성화합니다.

| 프로필 유형                                            | 정리 활성화 | Heartbeat |
| ------------------------------------------------------ | ----------- | --------- |
| Anthropic OAuth/토큰 인증(Claude CLI 재사용 포함)      | 예          | 1시간     |
| API 키                                                 | 예          | 30분      |

명시적인 값을 설정하면 OpenClaw는 이를 override하지 않습니다.

## 활성화 또는 비활성화

비-Anthropic provider에서는 정리가 기본적으로 꺼져 있습니다. 활성화하려면:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

비활성화하려면 `mode: "off"`로 설정하세요.

## 정리와 Compaction 비교

|            | 정리               | Compaction              |
| ---------- | ------------------ | ----------------------- |
| **무엇을** | 도구 결과를 잘라냄 | 대화를 요약함           |
| **저장됨?**| 아니요(요청별)     | 예(transcript에 저장)   |
| **범위**   | 도구 결과만        | 전체 대화               |

두 기능은 서로 보완적입니다. 정리는 Compaction 사이클 사이에서
도구 출력을 가볍게 유지합니다.

## 추가 읽을거리

- [Compaction](/ko/concepts/compaction) -- 요약 기반 컨텍스트 축소
- [Gateway 구성](/ko/gateway/configuration) -- 모든 정리 config 옵션
  (`contextPruning.*`)

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 도구](/ko/concepts/session-tool)
- [컨텍스트 엔진](/ko/concepts/context-engine)
