---
read_when:
    - 현재 세션에 대해 간단한 부가 질문을 하고 싶습니다
    - 클라이언트 전반에서 BTW 동작을 구현하거나 디버깅하는 경우
summary: /btw로 일시적인 부가 질문하기
title: 그런데 부가 질문
x-i18n:
    generated_at: "2026-05-11T20:37:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw`를 사용하면 해당 질문을 일반 대화 기록으로 만들지 않고 **현재 세션**에 대해 빠른 사이드 질문을 할 수 있습니다. `/side`는 별칭입니다.

Claude Code의 `/btw` 동작을 모델로 삼았지만, OpenClaw의 Gateway 및 멀티 채널 아키텍처에 맞게 조정되었습니다.

## 수행하는 작업

다음을 보내면:

```text
/btw what changed?
```

OpenClaw는:

1. 현재 세션 컨텍스트의 스냅샷을 만들고,
2. 별도의 임시 사이드 쿼리를 실행하며,
3. 사이드 질문에만 답하고,
4. 메인 실행은 그대로 두고,
5. BTW 질문이나 답변을 세션 기록에 기록하지 않으며,
6. 답변을 일반 어시스턴트 메시지가 아니라 **라이브 사이드 결과**로 내보냅니다.

중요한 사고 모델은 다음과 같습니다.

- 동일한 세션 컨텍스트
- 별도의 일회성 사이드 쿼리
- 세션이 네이티브 하네스를 사용할 때 동일한 네이티브 하네스 전송
- 향후 컨텍스트 오염 없음
- 트랜스크립트 지속 없음

Codex 하네스 세션의 경우 BTW는 활성 앱 서버 스레드를 임시 사이드 스레드로 포크하여 Codex 내부에 유지됩니다. 이를 통해 Codex OAuth와 네이티브 스레드 동작은 그대로 유지하면서도 사이드 답변은 부모 트랜스크립트에서 격리됩니다. Codex `/side`와 마찬가지로, 사이드 스레드는 현재 Codex 권한과 네이티브 도구 표면을 유지하며, 상속된 부모 스레드 작업을 활성 지시로 취급하지 말라고 모델에 알려 주는 가드레일을 갖습니다. Codex가 아닌 런타임은 기존의 직접 일회성 경로를 유지합니다.

## 수행하지 않는 작업

`/btw`는 다음을 **하지 않습니다**.

- 새 영구 세션 생성,
- 완료되지 않은 메인 작업 계속 진행,
- BTW 질문/답변 데이터를 트랜스크립트 기록에 기록,
- `chat.history`에 표시,
- 다시 로드 후 유지.

의도적으로 **임시적**입니다.

## 컨텍스트 작동 방식

BTW는 현재 세션을 **배경 컨텍스트로만** 사용합니다.

메인 실행이 현재 활성 상태라면 OpenClaw는 현재 메시지 상태의 스냅샷을 만들고 진행 중인 메인 프롬프트를 배경 컨텍스트로 포함하면서, 모델에 다음을 명시적으로 지시합니다.

- 사이드 질문에만 답할 것,
- 완료되지 않은 메인 작업을 재개하거나 완료하지 말 것,
- 부모 대화를 조종하지 말 것.

이렇게 하면 BTW가 메인 실행에서 격리되면서도 세션이 무엇에 관한 것인지 인식할 수 있습니다.

## 전달 모델

BTW는 일반 어시스턴트 트랜스크립트 메시지로 전달되지 **않습니다**.

Gateway 프로토콜 수준에서:

- 일반 어시스턴트 채팅은 `chat` 이벤트를 사용합니다.
- BTW는 `chat.side_result` 이벤트를 사용합니다.

이 분리는 의도적인 것입니다. BTW가 일반 `chat` 이벤트 경로를 재사용하면 클라이언트가 이를 일반 대화 기록처럼 취급하게 됩니다.

BTW는 별도의 라이브 이벤트를 사용하고 `chat.history`에서 재생되지 않기 때문에, 다시 로드하면 사라집니다.

## 표면 동작

### TUI

TUI에서 BTW는 현재 세션 보기 안에 인라인으로 렌더링되지만, 임시 상태로 유지됩니다.

- 일반 어시스턴트 답변과 시각적으로 구분됨
- `Enter` 또는 `Esc`로 닫을 수 있음
- 다시 로드할 때 재생되지 않음

### 외부 채널

Telegram, WhatsApp, Discord 같은 채널에서는 해당 표면에 로컬 임시 오버레이 개념이 없기 때문에 BTW가 명확하게 레이블이 붙은 일회성 답변으로 전달됩니다.

답변은 여전히 일반 세션 기록이 아니라 사이드 결과로 취급됩니다.

### Control UI / 웹

Gateway는 BTW를 `chat.side_result`로 올바르게 내보내며, BTW는 `chat.history`에 포함되지 않으므로 웹에 대한 지속성 계약은 이미 올바릅니다.

현재 Control UI에는 브라우저에서 BTW를 라이브로 렌더링하기 위한 전용 `chat.side_result` 소비자가 아직 필요합니다. 해당 클라이언트 측 지원이 적용되기 전까지 BTW는 전체 TUI 및 외부 채널 동작을 갖춘 Gateway 수준 기능이지만, 아직 완전한 브라우저 UX는 아닙니다.

## BTW를 사용할 때

다음을 원할 때 `/btw`를 사용하세요.

- 현재 작업에 대한 빠른 설명,
- 긴 실행이 아직 진행 중일 때 사실 기반의 사이드 답변,
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

답변이 세션의 향후 작업 컨텍스트 일부가 되기를 원한다면 `/btw`를 사용하지 마세요.

그 경우에는 BTW를 사용하는 대신 메인 세션에서 일반적으로 질문하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="슬래시 명령" href="/ko/tools/slash-commands" icon="terminal">
    네이티브 명령 카탈로그 및 채팅 지시문입니다.
  </Card>
  <Card title="사고 수준" href="/ko/tools/thinking" icon="brain">
    사이드 질문 모델 호출을 위한 추론 노력 수준입니다.
  </Card>
  <Card title="세션" href="/ko/concepts/session" icon="comments">
    세션 키, 기록, 지속성 의미론입니다.
  </Card>
  <Card title="조종 명령" href="/ko/tools/steer" icon="arrow-right">
    활성 실행을 종료하지 않고 조종 메시지를 주입합니다.
  </Card>
</CardGroup>
