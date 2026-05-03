---
read_when:
    - 현재 세션에 대해 간단한 부가 질문을 하고 싶습니다
    - 클라이언트 전반에서 BTW 동작을 구현하거나 디버깅하고 있습니다
summary: /btw로 묻는 일회성 부가 질문
title: 참고로 부가 질문
x-i18n:
    generated_at: "2026-05-03T21:38:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw`를 사용하면 해당 질문을 일반 대화 기록으로 만들지 않고 **현재 세션**에 대한 빠른 부가 질문을 할 수 있습니다. `/side`는 별칭입니다.

이는 Claude Code의 `/btw` 동작을 모델로 삼았지만, OpenClaw의 Gateway 및 다중 채널 아키텍처에 맞게 조정되었습니다.

## 수행하는 작업

다음을 보내면:

```text
/btw what changed?
```

OpenClaw는:

1. 현재 세션 컨텍스트의 스냅샷을 만들고,
2. 별도의 **도구를 사용하지 않는** 모델 호출을 실행하고,
3. 부가 질문에만 답하고,
4. 메인 실행은 그대로 두고,
5. BTW 질문이나 답변을 세션 기록에 쓰지 않으며,
6. 답변을 일반 assistant 메시지가 아니라 **실시간 부가 결과**로 내보냅니다.

중요한 사고 모델은 다음과 같습니다.

- 같은 세션 컨텍스트
- 별도의 일회성 부가 쿼리
- 도구 호출 없음
- 향후 컨텍스트 오염 없음
- 트랜스크립트 영속성 없음

## 수행하지 않는 작업

`/btw`는 다음을 **수행하지 않습니다**.

- 새 영구 세션 생성,
- 끝나지 않은 메인 작업 계속 진행,
- 도구 또는 agent 도구 루프 실행,
- BTW 질문/답변 데이터를 트랜스크립트 기록에 쓰기,
- `chat.history`에 표시,
- 다시 로드 후 유지.

이는 의도적으로 **일시적**입니다.

## 컨텍스트 작동 방식

BTW는 현재 세션을 **배경 컨텍스트로만** 사용합니다.

메인 실행이 현재 활성 상태이면, OpenClaw는 현재 메시지 상태의 스냅샷을 만들고 진행 중인 메인 프롬프트를 배경 컨텍스트로 포함하면서, 모델에 다음을 명시적으로 지시합니다.

- 부가 질문에만 답할 것,
- 끝나지 않은 메인 작업을 재개하거나 완료하지 말 것,
- 도구 호출이나 유사 도구 호출을 내보내지 말 것.

이를 통해 BTW는 메인 실행에서 격리되면서도 세션이 무엇에 관한 것인지 인지할 수 있습니다.

## 전달 모델

BTW는 일반 assistant 트랜스크립트 메시지로 전달되지 **않습니다**.

Gateway 프로토콜 수준에서는:

- 일반 assistant 채팅은 `chat` 이벤트를 사용합니다
- BTW는 `chat.side_result` 이벤트를 사용합니다

이 분리는 의도적입니다. BTW가 일반 `chat` 이벤트 경로를 재사용하면 클라이언트는 이를 일반 대화 기록처럼 처리할 것입니다.

BTW는 별도의 실시간 이벤트를 사용하고 `chat.history`에서 재생되지 않기 때문에, 다시 로드하면 사라집니다.

## 표면 동작

### TUI

TUI에서 BTW는 현재 세션 보기 안에 인라인으로 렌더링되지만, 일시적인 상태로 유지됩니다.

- 일반 assistant 답변과 시각적으로 구분됨
- `Enter` 또는 `Esc`로 닫을 수 있음
- 다시 로드 시 재생되지 않음

### 외부 채널

Telegram, WhatsApp, Discord 같은 채널에서는 BTW가 명확하게 표시된 일회성 답변으로 전달됩니다. 이러한 표면에는 로컬 일시적 오버레이 개념이 없기 때문입니다.

답변은 여전히 일반 세션 기록이 아니라 부가 결과로 처리됩니다.

### Control UI / 웹

Gateway는 BTW를 `chat.side_result`로 올바르게 내보내며, BTW는 `chat.history`에 포함되지 않으므로 웹에 대한 영속성 계약은 이미 올바릅니다.

현재 Control UI에는 브라우저에서 BTW를 실시간으로 렌더링하기 위한 전용 `chat.side_result` 소비자가 아직 필요합니다. 해당 클라이언트 측 지원이 도입될 때까지 BTW는 완전한 TUI 및 외부 채널 동작을 갖춘 Gateway 수준 기능이지만, 아직 완전한 브라우저 UX는 아닙니다.

## BTW를 사용할 때

다음이 필요할 때 `/btw`를 사용하세요.

- 현재 작업에 대한 빠른 설명,
- 긴 실행이 아직 진행 중일 때 사실 기반의 부가 답변,
- 향후 세션 컨텍스트의 일부가 되어서는 안 되는 임시 답변.

예:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW를 사용하지 말아야 할 때

답변이 세션의 향후 작업 컨텍스트 일부가 되기를 원할 때는 `/btw`를 사용하지 마세요.

그 경우에는 BTW를 사용하는 대신 메인 세션에서 일반적으로 질문하세요.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [사고 수준](/ko/tools/thinking)
- [세션](/ko/concepts/session)
