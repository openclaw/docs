---
read_when:
    - transcript 형태와 관련된 provider 요청 거부를 디버깅하는 중입니다
    - transcript 정리 또는 도구 호출 복구 로직을 변경하는 중입니다
    - provider 간 도구 호출 ID 불일치를 조사하는 중입니다
summary: '참조: provider별 transcript 정리 및 복구 규칙'
title: Transcript Hygiene
x-i18n:
    generated_at: "2026-04-23T14:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript Hygiene (Provider Fixups)

이 문서는 실행 전(model context 빌드 시) transcript에 적용되는 **provider별 수정**을 설명합니다. 이는 엄격한
provider 요구 사항을 충족하기 위한 **메모리 내** 조정입니다. 이러한 hygiene 단계는 디스크에 저장된 JSONL transcript를
다시 쓰지 않습니다. 그러나 별도의 세션 파일 복구 단계에서 세션을 로드하기 전에
잘못된 줄을 삭제하여 손상된 JSONL 파일을 다시 쓸 수 있습니다. 복구가 발생하면 원본
파일은 세션 파일 옆에 백업됩니다.

범위는 다음을 포함합니다:

- 도구 호출 ID 정리
- 도구 호출 입력 검증
- 도구 결과 페어링 복구
- 턴 검증 / 순서 정렬
- 생각 서명 정리
- 이미지 payload 정리
- 사용자 입력 provenance 태깅(세션 간 라우팅된 프롬프트용)

transcript 저장 세부 사항이 필요하면 다음을 참조하세요:

- [/reference/session-management-compaction](/ko/reference/session-management-compaction)

---

## 실행 위치

모든 transcript hygiene는 임베디드 러너에 중앙화되어 있습니다:

- 정책 선택: `src/agents/transcript-policy.ts`
- 정리/복구 적용: `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용해 적용할 항목을 결정합니다.

transcript hygiene와 별도로, 세션 파일은 로드 전에(필요한 경우) 복구됩니다:

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts` 및 `compact.ts`(임베디드 러너)에서 호출됨

---

## 전역 규칙: 이미지 정리

이미지 payload는 크기 제한으로 인한 provider 측 거부를 방지하기 위해 항상 정리됩니다
(과도한 크기의 base64 이미지를 축소/재압축).

이것은 비전 지원 모델의 이미지 기반 토큰 압력 제어에도 도움이 됩니다.
최대 이미지 크기를 낮추면 일반적으로 토큰 사용량이 줄고, 크기를 높이면 세부 묘사가 더 잘 보존됩니다.

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`
- 최대 이미지 변 길이는 `agents.defaults.imageMaxDimensionPx`(기본값: `1200`)로 구성할 수 있습니다.

---

## 전역 규칙: 잘못된 도구 호출

`input`과 `arguments`가 모두 없는 assistant 도구 호출 블록은
model context가 빌드되기 전에 삭제됩니다. 이렇게 하면 부분적으로
지속된 도구 호출(예: rate limit 실패 이후)로 인한 provider 거부를 방지할 수 있습니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts`의 `sanitizeSessionHistory`에서 적용

---

## 전역 규칙: 세션 간 입력 provenance

에이전트가 `sessions_send`를 통해 다른 세션으로 프롬프트를 보낼 때(에이전트 간 reply/announce 단계 포함),
OpenClaw는 생성된 사용자 턴을 다음과 함께 저장합니다:

- `message.provenance.kind = "inter_session"`

이 메타데이터는 transcript append 시점에 기록되며 역할은 변경하지 않습니다
(provider 호환성을 위해 `role: "user"`는 유지됨). transcript 리더는
이를 사용해 라우팅된 내부 프롬프트를 최종 사용자가 작성한 지시로 취급하지 않도록 할 수 있습니다.

context 재구성 중에 OpenClaw는 모델이 이를
외부 최종 사용자 지시와 구분할 수 있도록 메모리 내에서 해당 사용자 턴 앞에 짧은 `[Inter-session message]`
마커도 추가합니다.

---

## Provider 매트릭스(현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정리만 적용.
- OpenAI Responses/Codex transcript에 대해 뒤따르는 content block이 없는 고아 reasoning signature(독립된 reasoning 항목)를 삭제.
- 도구 호출 ID 정리 없음.
- 도구 결과 페어링 복구 없음.
- 턴 검증 또는 재정렬 없음.
- 합성 도구 결과 없음.
- 생각 서명 제거 없음.

**Google (Generative AI / Gemini CLI / Antigravity)**

- 도구 호출 ID 정리: 엄격한 영숫자.
- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(Gemini 스타일 턴 교대).
- Google 턴 순서 수정(history가 assistant로 시작하면 작은 사용자 bootstrap을 앞에 추가).
- Antigravity Claude: thinking signature 정규화, 서명되지 않은 thinking block 삭제.

**Anthropic / Minimax (Anthropic 호환)**

- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(엄격한 교대를 만족하도록 연속된 사용자 턴 병합).

**Mistral(model-id 기반 감지 포함)**

- 도구 호출 ID 정리: strict9(길이 9의 영숫자).

**OpenRouter Gemini**

- thought signature 정리: base64가 아닌 `thought_signature` 값 제거(base64는 유지).

**그 외 모든 경우**

- 이미지 정리만 적용.

---

## 과거 동작(pre-2026.1.22)

2026.1.22 릴리스 이전에는 OpenClaw가 여러 계층의 transcript hygiene를 적용했습니다:

- 모든 context 빌드에서 실행되는 **transcript-sanitize extension**이 있었으며, 다음을 수행할 수 있었습니다:
  - 도구 사용/결과 페어링 복구
  - 도구 호출 ID 정리(`_`/`-`를 유지하는 비엄격 모드 포함)
- 러너도 provider별 정리를 수행했으며, 이로 인해 작업이 중복되었습니다.
- 또한 provider 정책 외부에서 다음과 같은 추가 변경이 발생했습니다:
  - assistant 텍스트를 저장하기 전에 `<final>` 태그 제거
  - 비어 있는 assistant 오류 턴 삭제
  - 도구 호출 이후 assistant content 잘라내기

이 복잡성은 provider 간 회귀를 야기했습니다(특히 `openai-responses`
`call_id|fc_id` 페어링). 2026.1.22 정리에서 extension이 제거되고, 로직이 러너에 중앙화되었으며,
OpenAI는 이미지 정리를 제외하면 **손대지 않음** 정책이 되었습니다.
