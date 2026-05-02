---
read_when:
    - 그룹 채팅을 전용 에이전트로 라우팅합니다
    - 긴 작업 하나가 모든 채팅을 막지 않도록 병렬 작업을 원할 때
    - 다중 에이전트 운영 구성을 설계하고 있습니다
sidebarTitle: Specialist lanes
status: active
summary: 공유 모델 및 도구 처리 용량을 막지 않고 병렬 전문 에이전트 실행
title: 병렬 전문가 레인
x-i18n:
    generated_at: "2026-05-02T20:48:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

병렬 전문 레인을 사용하면 하나의 Gateway가 여러 채팅이나 방을 서로 다른 에이전트로 라우팅하면서도 사용자 경험을 빠르게 유지할 수 있습니다. 핵심은 병렬성을 단순히 "더 많은 에이전트"가 아니라 희소 리소스 설계 문제로 다루는 것입니다.

## 기본 원칙

전문 레인은 실제 병목에 대한 경합을 줄일 때만 처리량을 개선합니다.

- **세션 잠금**: 지정된 세션을 변경하는 실행은 한 번에 하나여야 합니다.
- **전역 모델 용량**: 표시되는 모든 채팅 실행은 여전히 제공자 한도를 공유합니다.
- **도구 용량**: 셸, 브라우저, 네트워크, 저장소 작업은 모델 턴 자체보다 느릴 수 있습니다.
- **컨텍스트 예산**: 긴 대화 기록은 이후 모든 턴을 더 느리고 덜 집중되게 만듭니다.
- **소유권 모호성**: 같은 작업을 수행하는 중복 에이전트는 용량을 낭비합니다.

OpenClaw는 이미 세션별로 실행을 직렬화하고 [명령 큐](/ko/concepts/queue)를 통해 전역 병렬성을 제한합니다. 전문 레인은 그 위에 정책을 추가합니다. 어떤 에이전트가 어떤 작업을 소유하는지, 무엇이 채팅에 남는지, 무엇이 백그라운드 작업이 되는지를 정합니다.

## 권장 출시 방식

### 1단계: 레인 계약 + 무거운 백그라운드 작업

각 레인에 작업 공간과 시스템 프롬프트의 서면 계약을 제공하세요.

- **목적**: 이 레인이 소유하는 작업입니다.
- **비목표**: 직접 시도하지 않고 넘겨야 하는 작업입니다.
- **채팅 예산**: 빠른 답변은 채팅에 남기고, 긴 작업은 짧게 확인한 다음 백그라운드 하위 에이전트나 작업으로 실행해야 합니다.
- **인계 규칙**: 다른 레인이 작업을 소유하는 경우 어디로 보내야 하는지 말하고 간결한 인계 요약을 제공합니다.
- **도구 위험 규칙**: 작업을 수행할 수 있는 가장 작은 도구 표면을 선호합니다.

이 단계는 비용이 가장 낮고 대부분의 병목을 해결합니다. 하나의 코딩 작업이 더 이상 연구 레인을 매우 느리게 만들지 않으며, 각 채팅은 자체 컨텍스트를 깔끔하게 유지합니다.

### 2단계: 우선순위 및 동시성 제어

각 레인의 비즈니스 가치에 맞춰 큐와 모델 용량을 조정하세요.

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

우선순위가 높은 작업에는 직접/개인 채팅과 프로덕션 운영 에이전트를 사용하세요. 시스템이 바쁠 때는 연구, 초안 작성, 배치 코딩을 백그라운드 작업으로 이동하게 하세요.

### 3단계: 조정자 / 트래픽 컨트롤러

여러 레인이 활성화되면 작은 조정자 패턴을 추가하세요.

- 활성 레인 작업과 소유자를 추적합니다.
- 그룹 간 중복 요청을 감지합니다.
- 레인 사이에 인계 요약을 라우팅합니다.
- 차단 요소, 완료된 결과, 사람이 내려야 하는 결정만 표시합니다.

여기서 시작하지 마세요. 레인 계약이 없는 조정자는 혼란만 조정할 뿐입니다.

## 최소 레인 계약 템플릿

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## 관련 항목

- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [명령 큐](/ko/concepts/queue)
- [하위 에이전트](/ko/tools/subagents)
