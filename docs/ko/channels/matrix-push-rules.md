---
read_when:
    - 자체 호스팅 Synapse 또는 Tuwunel을 위한 Matrix 무음 스트리밍 설정하기
    - 사용자는 미리보기의 모든 편집 시점이 아니라 블록이 완료되었을 때만 알림을 받기를 원합니다.
summary: 조용히 완료된 미리보기 편집을 위한 수신자별 Matrix 푸시 규칙
title: 조용한 미리보기를 위한 Matrix 푸시 규칙
x-i18n:
    generated_at: "2026-07-12T14:58:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming`이 `"quiet"`이면 OpenClaw는 단일 미리보기 이벤트를 제자리에서 편집하여 응답을 스트리밍합니다. 미리보기는 알림을 발생시키지 않는 `m.notice` 이벤트로 전송되며, 최종 편집에는 `content["com.openclaw.finalized_preview"] = true`가 표시됩니다. 사용자별 푸시 규칙이 이 마커와 일치하는 경우에만 Matrix 클라이언트가 해당 최종 편집에 대한 알림을 보냅니다. 이 페이지는 Matrix를 자체 호스팅하며 각 수신자 계정에 이 규칙을 설치하려는 운영자를 위한 것입니다.

`streaming: "progress"`도 같은 경로를 통해 초안을 최종 확정하므로, 동일한 규칙이 진행 모드에서 최종 확정된 편집에도 적용됩니다.

Matrix의 기본 알림 동작만 사용하려면 `streaming: "partial"`을 사용하거나 스트리밍을 끄십시오. [Matrix 채널 설정](/ko/channels/matrix#streaming-previews)을 참조하십시오.

## 사전 요구 사항

- 수신자 사용자 = 알림을 받아야 하는 사람
- 봇 사용자 = 응답을 보내는 OpenClaw Matrix 계정
- 아래 API 호출에는 수신자 사용자의 액세스 토큰을 사용하십시오
- 푸시 규칙의 `sender`를 봇 사용자의 전체 MXID와 일치시키십시오
- 수신자 계정에는 이미 정상 작동하는 푸셔가 있어야 합니다. 조용한 미리보기 규칙은 일반 Matrix 푸시 전달이 정상일 때만 작동합니다

## 단계

<Steps>
  <Step title="조용한 미리보기 구성">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="수신자의 액세스 토큰 가져오기">
    가능하면 기존 클라이언트 세션 토큰을 재사용하십시오. 새 토큰을 발급하려면 다음을 실행하십시오.

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="푸셔 존재 여부 확인">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

푸셔가 반환되지 않으면 계속하기 전에 이 계정의 일반 Matrix 푸시 전달을 수정하십시오.

  </Step>

  <Step title="재정의 푸시 규칙 설치">
    최종 확정 미리보기 마커와 발신자인 봇 MXID가 일치하는 규칙을 설치하십시오.

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    실행하기 전에 다음을 바꾸십시오.

    - `https://matrix.example.org`: 홈서버 기본 URL
    - `$USER_ACCESS_TOKEN`: 수신자 사용자의 액세스 토큰
    - `openclaw-finalized-preview-botname`: 수신자별, 봇별로 고유한 규칙 ID(패턴: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: 수신자가 아닌 OpenClaw 봇의 MXID

  </Step>

  <Step title="확인">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

그런 다음 스트리밍 응답을 테스트하십시오. 조용한 모드에서는 방에 조용한 초안 미리보기가 표시되고 블록 또는 턴이 완료되면 알림이 한 번 전송됩니다.

  </Step>
</Steps>

나중에 규칙을 제거하려면 수신자의 토큰을 사용하여 동일한 규칙 URL에 `DELETE` 요청을 보내십시오.

## 다중 봇 참고 사항

푸시 규칙은 `ruleId`를 키로 사용합니다. 동일한 ID에 대해 `PUT`을 다시 실행하면 단일 규칙이 업데이트됩니다. 여러 OpenClaw 봇이 동일한 수신자에게 알림을 보내도록 하려면 봇마다 서로 다른 발신자 일치 조건을 가진 규칙을 하나씩 만드십시오.

사용자가 새로 정의한 `override` 규칙은 서버 기본 억제 규칙보다 앞에 삽입되므로 추가 순서 매개변수는 필요하지 않습니다. 이 규칙은 제자리에서 최종 확정할 수 있는 텍스트 전용 미리보기 편집에만 영향을 줍니다. 미디어 응답, 오래된 미리보기 폴백, Matrix 멘션을 활성화하는 최종 텍스트는 대신 일반적인 알림 메시지로 전달됩니다.

## 홈서버 참고 사항

<AccordionGroup>
  <Accordion title="Synapse">
    특별한 `homeserver.yaml` 변경은 필요하지 않습니다. 일반 Matrix 알림이 이미 이 사용자에게 전달되고 있다면 수신자 토큰과 위의 `pushrules` 호출이 주요 설정 단계입니다.

    리버스 프록시 또는 워커 뒤에서 Synapse를 실행하는 경우 `/_matrix/client/.../pushrules/`가 Synapse에 올바르게 전달되는지 확인하십시오. 푸시 전달은 메인 프로세스 또는 `synapse.app.pusher`/구성된 푸셔 워커가 처리하므로 해당 구성 요소가 정상인지 확인하십시오.

    이 규칙은 2023년에 Synapse에 추가된 `event_property_is` 푸시 규칙 조건(MSC3758, 푸시 규칙 v1.10)을 사용합니다. 이전 Synapse 릴리스는 `PUT pushrules/...` 호출을 수락하지만 조건이 아무런 경고 없이 일치하지 않습니다. 최종 확정된 미리보기 편집에서 알림이 도착하지 않으면 Synapse를 업그레이드하십시오.

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse와 동일한 절차를 사용합니다. 최종 확정 미리보기 마커를 위한 Tuwunel 전용 구성은 필요하지 않습니다.

    사용자가 다른 기기에서 활동하는 동안 알림이 사라진다면 `suppress_push_when_active`가 활성화되어 있는지 확인하십시오. Tuwunel은 1.4.2(2025년 9월)에 이 옵션을 추가했으며, 한 기기가 활성 상태인 동안 다른 기기로의 푸시를 의도적으로 억제할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 관련 문서

- [Matrix 채널 설정](/ko/channels/matrix)
- [스트리밍 개념](/ko/concepts/streaming)
