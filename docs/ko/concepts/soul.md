---
read_when:
    - 에이전트가 덜 일반적으로 들리게 하고 싶습니다
    - SOUL.md를 편집하고 있습니다
    - 안전성이나 간결성을 해치지 않으면서 더 강한 개성을 원합니다
summary: SOUL.md를 사용해 OpenClaw 에이전트에 일반적인 어시스턴트식 진부한 응답 대신 실제 목소리를 부여하세요
title: SOUL.md 성격 가이드
x-i18n:
    generated_at: "2026-06-27T17:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md`는 에이전트의 목소리가 담기는 곳입니다.

OpenClaw는 일반 세션에서 이것을 주입하므로 실제로 큰 영향을 줍니다. 에이전트가
밋밋하거나, 애매하게 말을 흐리거나, 이상하게 기업식으로 들린다면 보통 이 파일을 고치면 됩니다.

## SOUL.md에 들어가야 할 것

에이전트와 대화할 때의 느낌을 바꾸는 요소를 넣으세요:

- 어조
- 의견
- 간결함
- 유머
- 경계
- 기본적인 직설성 수준

이것을 다음처럼 만들지 **마세요**:

- 인생 이야기
- 변경 로그
- 보안 정책 덤프
- 행동 효과는 없는 거대한 분위기 문구 더미

짧은 것이 긴 것보다 낫습니다. 선명한 것이 모호한 것보다 낫습니다.

## 이것이 작동하는 이유

이는 OpenAI의 프롬프트 지침과 맞닿아 있습니다:

- 프롬프트 엔지니어링 가이드는 고수준 행동, 어조, 목표, 예시는
  사용자 턴에 묻어두는 것이 아니라 우선순위가 높은 지침 레이어에 두어야 한다고 말합니다.
- 같은 가이드는 프롬프트를 한 번 쓰고 잊는 마법 같은 문장이 아니라,
  반복 개선하고, 고정하고, 평가하는 대상으로 다루라고 권장합니다.

OpenClaw에서 `SOUL.md`가 바로 그 레이어입니다.

더 나은 개성을 원한다면 더 강한 지침을 쓰세요. 안정적인 개성을 원한다면
간결하게 유지하고 버전으로 관리하세요.

OpenAI 참고 자료:

- [프롬프트 엔지니어링](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [메시지 역할과 지침 따르기](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 프롬프트

이것을 에이전트에 붙여넣고 `SOUL.md`를 다시 쓰게 하세요.

OpenClaw 워크스페이스의 경로는 고정입니다: `http://SOUL.md`가 아니라 `SOUL.md`를 사용하세요.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## 좋은 예

좋은 `SOUL.md` 규칙은 이렇게 들립니다:

- 입장을 가져라
- 군더더기를 건너뛰어라
- 어울릴 때는 웃겨라
- 나쁜 아이디어는 일찍 짚어라
- 깊이가 실제로 유용할 때를 제외하고는 간결하게 유지하라

나쁜 `SOUL.md` 규칙은 이렇게 들립니다:

- 항상 전문성을 유지한다
- 포괄적이고 사려 깊은 지원을 제공한다
- 긍정적이고 지지적인 경험을 보장한다

두 번째 목록이 바로 흐물흐물한 결과를 만드는 방법입니다.

## 한 가지 경고

개성은 대충 해도 된다는 허가가 아닙니다.

운영 규칙은 `AGENTS.md`에 두세요. 목소리, 관점, 스타일은 `SOUL.md`에 두세요.
에이전트가 공유 채널, 공개 답변, 고객 접점에서 작동한다면
어조가 여전히 그 자리에 맞는지 확인하세요.

날카로운 것은 좋습니다. 짜증나는 것은 아닙니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/ko/concepts/agent-workspace" icon="folder-open">
    OpenClaw가 모델 컨텍스트에 주입하는 워크스페이스 파일입니다.
  </Card>
  <Card title="System prompt" href="/ko/concepts/system-prompt" icon="message-lines">
    `SOUL.md`가 OpenClaw와 Codex 런타임 컨텍스트에 구성되는 방식입니다.
  </Card>
  <Card title="SOUL.md template" href="/ko/reference/templates/SOUL" icon="file-lines">
    개성 파일을 위한 시작 템플릿입니다.
  </Card>
</CardGroup>
