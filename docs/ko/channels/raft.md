---
read_when:
    - OpenClaw를 Raft 워크스페이스에 연결하려고 합니다
    - Raft 외부 에이전트를 구성하고 있습니다
    - Raft 깨우기 전달을 디버깅하고 있습니다
sidebarTitle: Raft
summary: Raft CLI 웨이크 브리지를 통한 Raft 외부 에이전트 지원
title: Raft
x-i18n:
    generated_at: "2026-07-12T14:58:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft는 로컬 Raft CLI를 통해 OpenClaw 에이전트를 Raft External Agent에 연결합니다.
Raft는 인증된 깨우기 힌트를 Gateway로 전송하고, 이후 에이전트는
Raft CLI를 사용하여 메시지를 확인하고 전송합니다. 다이렉트 채팅만 지원합니다(그룹은 지원하지 않음).

## 설치

Raft는 공식 외부 Plugin입니다. Gateway 호스트에 설치하십시오.

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

자세한 내용: [Plugin](/ko/tools/plugin)

## 사전 요구 사항

- External Agent가 있는 Raft 워크스페이스
- OpenClaw Gateway와 동일한 호스트에 설치되어 있고 서비스의
  `PATH`에 포함된 Raft CLI
- 이미 로그인되어 있으며 해당 External Agent와 연결된
  Raft CLI 프로필

Plugin은 Raft 자격 증명을 저장하지 않습니다. Raft CLI가 해당 인증 정보를
자체 프로필에 보관합니다.

## 구성

구성에서 프로필을 설정하십시오.

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

기본 계정의 경우 대신 Gateway 환경에서 `RAFT_PROFILE`을 설정할 수 있습니다.

```bash
RAFT_PROFILE=openclaw
```

하나의 Gateway가 둘 이상의 Raft External Agent에 연결되는 경우 명명된 계정을 사용하십시오.

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

대화형 설정에서도 동일한 프로필이 기록됩니다.

```bash
openclaw channels add --channel raft
```

## 작동 방식

Gateway가 시작되면 Plugin은 다음을 수행합니다.

1. 임시 포트에서 루프백 전용 HTTP 깨우기 엔드포인트를 엽니다.
2. 해당 엔드포인트와 프로세스별 토큰을 사용하여 `raft --profile <profile> agent bridge`를 시작합니다.
3. 로컬 브리지에서 전송되며 재생 식별자를 포함하는, 인증되고 콘텐츠가 없는 깨우기 힌트만 수락합니다.
4. 모든 깨우기 페이로드에 `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id`, `id` 중 하나가 있어야 합니다.
5. Gateway 재시작 전후를 포함하여 브리지 이벤트 ID를 기준으로 재시도된 깨우기 전송을 24시간 동안 중복 제거합니다.
6. 현재 브리지에 안정적인 런타임 세션을 반환하고 Raft CLI 프로토콜에 빈 활동 드레인 배치를 반환합니다.
7. 수락된 깨우기마다 직렬화된 OpenClaw 에이전트 턴 하나를 시작합니다.

브리지가 Raft 전송 재시도와 재연결을 담당합니다. OpenClaw 턴은 복사된 Raft 메시지 본문이 아니라
깨우기 알림만 받습니다. CLI를 사용하여 대기 중인 메시지를 읽고 응답을 전송합니다.

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft는 푸시 메시지 전송 수단이 아닙니다. OpenClaw는 모델의 최종 텍스트를 브리지를 통해 자동으로 다시 전송하지 않으므로, 에이전트는 깨우기를 처리한 후 Raft CLI를 사용해야 합니다.
</Note>

## 확인

OpenClaw가 CLI를 찾을 수 있고 프로필이 구성되어 있는지 확인하십시오.

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

그런 다음 Raft External Agent에 메시지를 전송하십시오. Gateway 로그에는
Raft 브리지가 시작된 후 인바운드 깨우기가 표시되어야 합니다. 에이전트는
구성된 Raft 프로필을 사용하여 대기 중인 메시지를 확인해야 합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="Raft CLI가 없습니다">
    Gateway 호스트에 Raft CLI를 설치하고 서비스의 `PATH`에서 `raft`를
    사용할 수 있게 하십시오. `raft --help`로 확인한 다음 Gateway를 다시 시작하십시오.
  </Accordion>
  <Accordion title="브리지가 즉시 종료됩니다">
    구성된 프로필에 로그인되어 있고 의도한 Raft External Agent에 속하는지
    확인하십시오. CLI 진단을 확인하려면 `raft --profile <profile> agent bridge`를
    직접 실행하십시오.
  </Accordion>
  <Accordion title="깨우기가 도착하지만 Raft 응답이 전송되지 않습니다">
    에이전트가 Raft CLI를 호출하지 않으면 이는 예상된 동작입니다. 깨우기
    브리지는 메시지 본문이나 자동 최종 응답을 전달하지 않습니다. 에이전트의
    도구 정책을 확인하고 `raft --profile <profile>
    message check` 및 `message send`를 실행할 수 있는지 확인하십시오.
  </Accordion>
</AccordionGroup>

## 참고 자료

- [Raft](https://raft.build/)
- [Raft 문서](https://docs.raft.build/welcome/)
- [Hermes Raft 통합](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
