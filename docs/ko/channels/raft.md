---
read_when:
    - OpenClaw를 Raft 워크스페이스에 연결하려는 경우
    - Raft 외부 에이전트를 구성하고 있습니다
    - Raft 깨우기 전달을 디버깅하고 있습니다
sidebarTitle: Raft
summary: Raft CLI 깨우기 브리지를 통한 Raft 외부 에이전트 지원
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:12:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft 지원은 local Raft CLI를 통해 OpenClaw 에이전트를 Raft External Agent에 연결합니다.
Raft는 인증된 wake 힌트를 Gateway로 보냅니다. 그런 다음 에이전트는
Raft CLI를 사용해 메시지를 확인하고 보냅니다.

## 설치

Raft는 공식 외부 Plugin입니다. Gateway 호스트에 설치하세요.

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

세부 정보: [Plugins](/ko/tools/plugin)

## 전제 조건

- External Agent가 있는 Raft 워크스페이스.
- OpenClaw Gateway와 같은 호스트에 설치된 Raft CLI.
- 이미 로그인되어 있고 해당 External Agent와 연결된 Raft CLI 프로필.

Plugin은 Raft 자격 증명을 저장하지 않습니다. Raft CLI는 해당 인증을
자체 프로필에 보관합니다.

## 구성

config에서 프로필을 설정하세요.

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

기본 계정의 경우, 대신 Gateway 환경에서 `RAFT_PROFILE`을 설정할 수 있습니다.

```bash
RAFT_PROFILE=openclaw
```

하나의 Gateway가 둘 이상의 Raft External Agent에 연결될 때는 이름이 있는 계정을 사용하세요.

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

대화형 설정 플로우는 같은 프로필을 기록합니다.

```bash
openclaw channels setup raft
```

## 작동 방식

Gateway가 시작되면 Plugin은 다음을 수행합니다.

1. 임시 포트에서 loopback 전용 HTTP wake 엔드포인트를 엽니다.
2. 해당 엔드포인트와 프로세스별 토큰으로 `raft --profile <profile> agent bridge`를 시작합니다.
3. local 브리지에서 온, 인증되고 콘텐츠가 없는 wake 힌트만 replay identity와 함께 허용합니다.
4. `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id`, `id` 중 하나를 요구합니다.
5. Gateway 재시작 후까지 포함해 브리지 이벤트 id별로 최근 재시도된 wake 전달을 중복 제거합니다.
6. 현재 브리지에 대해 안정적인 런타임 세션과 Raft CLI 프로토콜용 빈 activity-drain 배치를 반환합니다.
7. 허용된 각 wake마다 직렬화된 OpenClaw 에이전트 턴 하나를 시작합니다.

브리지는 Raft 전달 재시도와 재연결을 소유합니다. OpenClaw 턴은
복사된 Raft 메시지 본문이 아니라 wake 알림만 받습니다. pending 메시지를 읽고
응답을 보내려면 CLI를 사용합니다.

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft는 일반적인 push-message 전송 수단이 아닙니다. OpenClaw는 모델의 최종 텍스트를
브리지를 통해 자동으로 다시 보내지 않으므로, 에이전트는 wake를 처리한 뒤
Raft CLI를 사용해야 합니다.
</Note>

## 확인

OpenClaw가 CLI를 찾을 수 있고 프로필이 구성되어 있는지 확인하세요.

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

그런 다음 Raft External Agent에 메시지를 보내세요. Gateway 로그에는
Raft 브리지가 시작된 뒤 인바운드 wake가 표시되어야 합니다. 에이전트는
구성된 Raft 프로필을 사용해 pending 메시지를 확인해야 합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="Raft CLI is missing">
    Gateway 호스트에 Raft CLI를 설치하고 서비스의 `PATH`에서 `raft`를 사용할 수 있게 하세요.
    `raft --help`로 확인한 다음 Gateway를 다시 시작하세요.
  </Accordion>
  <Accordion title="The bridge exits immediately">
    구성된 프로필이 로그인되어 있고 의도한 Raft External Agent에 속하는지 확인하세요.
    CLI 진단을 보려면 `raft --profile <profile> agent bridge`를 직접 실행하세요.
  </Accordion>
  <Accordion title="A wake arrives but no Raft response is sent">
    에이전트가 Raft CLI를 호출하지 않으면 이는 예상된 동작입니다. wake 브리지는
    메시지 본문이나 자동 최종 답장을 전달하지 않습니다. 에이전트의 도구 정책을
    확인하고 `raft --profile <profile> message check`와 `message send`를 실행할 수
    있는지 확인하세요.
  </Accordion>
</AccordionGroup>

## 참고 자료

- [Raft](https://raft.build/)
- [Raft 문서](https://docs.raft.build/welcome/)
- [Hermes Raft 통합](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
