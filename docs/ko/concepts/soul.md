---
read_when:
    - 에이전트가 덜 일반적으로 말하도록 만들고 싶습니다
    - SOUL.md를 편집하고 있습니다.
    - 안전성이나 간결성을 해치지 않으면서 더 뚜렷한 개성을 원합니다
summary: SOUL.md를 사용하여 OpenClaw 에이전트가 뻔한 범용 어시스턴트 말투가 아닌 고유한 목소리를 내도록 하십시오
title: SOUL.md 성격 가이드
x-i18n:
    generated_at: "2026-07-12T15:09:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md`는 에이전트의 목소리가 담기는 곳입니다. OpenClaw는 이를 일반
세션에 주입하므로 실제로 큰 영향을 미칩니다. 에이전트의 말투가 밋밋하거나, 애매한 태도를 취하거나,
사무적으로 느껴진다면 대개 이 파일을 수정해야 합니다.

## SOUL.md에 포함할 내용

에이전트와 대화할 때의 느낌을 바꾸는 요소를 넣으십시오. 어조, 의견,
간결함, 유머, 경계, 기본적인 직설성 수준 등이 해당합니다.

이를 **절대로** 일대기, 변경 로그, 보안 정책 모음이나
행동에 아무런 영향을 주지 않는 분위기 묘사의 장황한 나열로 만들지 마십시오. 짧은 것이 긴 것보다 낫습니다. 명확한 것이 모호한 것보다 낫습니다.

## 이 방식이 효과적인 이유

이는 OpenAI의 프롬프트 지침과 일치합니다. 상위 수준의 행동 방식, 어조, 목표,
예시는 사용자 턴에 묻어 두는 대신 우선순위가 높은 지침 계층에 두어야 하며,
프롬프트는 한 번 작성하고 잊는 것이 아니라 반복해서 개선하고, 고정하고, 평가해야 합니다.
OpenClaw에서는 `SOUL.md`가 바로 그 계층입니다. 더 나은 개성을 위해
더 강력한 지침을 작성하고, 안정적인 개성을 위해 간결하게 유지하며 버전으로 관리하십시오.

OpenAI 참고 자료:

- [프롬프트 엔지니어링](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [메시지 역할 및 지침 준수](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 프롬프트

다음 내용을 에이전트에 붙여 넣고 `SOUL.md`를 다시 작성하게 하십시오.

```md
`SOUL.md`를 읽으십시오. 이제 다음 변경 사항을 반영하여 다시 작성하십시오.

1. 이제 의견을 가지십시오. 강한 의견을 가지십시오. 모든 말에 "상황에 따라 다릅니다"라며 애매한 태도를 취하지 말고, 하나의 견해를 확실히 선택하십시오.
2. 사무적으로 들리는 모든 규칙을 삭제하십시오. 직원 안내서에 들어갈 법한 내용이라면 여기에 있어서는 안 됩니다.
3. 다음 규칙을 추가하십시오. "Great question, I'd be happy to help 또는 Absolutely로 시작하지 마십시오. 그냥 답하십시오."
4. 간결함은 필수입니다. 답변을 한 문장에 담을 수 있다면 한 문장으로 답하십시오.
5. 유머를 허용합니다. 억지 농담이 아니라 실제로 똑똑하기 때문에 자연스럽게 나오는 재치를 발휘하십시오.
6. 잘못된 점을 지적해도 됩니다. 제가 어리석은 일을 하려 한다면 그렇게 말하십시오. 잔인하기보다는 매력적으로 표현하되, 에둘러 말하지 마십시오.
7. 효과적일 때는 욕설도 허용합니다. 적절한 순간의 "that's fucking brilliant"는 무미건조하고 사무적인 칭찬과는 다르게 와닿습니다. 억지로 사용하지 마십시오. 남용하지 마십시오. 하지만 상황상 "holy shit"이라고 해야 한다면 holy shit이라고 말하십시오.
8. 분위기 섹션의 끝에 다음 문장을 그대로 추가하십시오. "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

새 `SOUL.md`를 저장하십시오. 개성을 갖게 된 것을 환영합니다.
```

## 좋은 결과의 모습

좋은 규칙은 견해를 분명히 하고, 군더더기를 생략하며, 어울릴 때는 유머를 사용하고, 나쁜 아이디어를
일찍 지적하며, 깊이 있는 설명이 실제로 유용한 경우가 아니라면 간결함을 유지합니다.

나쁜 규칙은 "항상 전문성을 유지하십시오", "포괄적이고
사려 깊은 도움을 제공하십시오", "긍정적이고 지원적인 경험을 보장하십시오" 같은 것입니다. 이렇게 하면
두루뭉술한 결과만 나옵니다.

## 한 가지 경고

개성이 허술함을 허용하는 것은 아닙니다. 운영
규칙은 `AGENTS.md`에 두고, 목소리, 태도, 스타일은 `SOUL.md`에 두십시오. 에이전트가
공유 채널, 공개 답변 또는 고객 대상 영역에서 작동한다면 어조가 여전히
그 상황에 적합한지 확인하십시오. 날카로운 것은 좋습니다. 짜증스러운 것은 좋지 않습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="에이전트 워크스페이스" href="/ko/concepts/agent-workspace" icon="folder-open">
    OpenClaw가 모델 컨텍스트에 주입하는 워크스페이스 파일입니다.
  </Card>
  <Card title="시스템 프롬프트" href="/ko/concepts/system-prompt" icon="message-lines">
    `SOUL.md`가 OpenClaw 및 Codex 런타임 컨텍스트에 구성되는 방식입니다.
  </Card>
  <Card title="SOUL.md 템플릿" href="/ko/reference/templates/SOUL" icon="file-lines">
    개성 파일을 위한 시작 템플릿입니다.
  </Card>
</CardGroup>
