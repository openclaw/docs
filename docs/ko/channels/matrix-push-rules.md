---
read_when:
    - 자체 호스팅 Synapse 또는 Tuwunel을 위한 Matrix 조용한 스트리밍 설정
    - 사용자는 모든 미리보기 편집마다가 아니라 완료된 블록에 대해서만 알림을 원합니다
summary: 조용히 확정된 미리보기 편집을 위한 수신자별 Matrix 푸시 규칙
title: 조용한 미리보기를 위한 Matrix 푸시 규칙
x-i18n:
    generated_at: "2026-04-30T06:18:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming`이 `"quiet"`인 경우 OpenClaw는 단일 미리 보기 이벤트를 제자리에서 편집하고, 최종 편집에 사용자 지정 콘텐츠 플래그를 표시합니다. Matrix 클라이언트는 사용자별 푸시 규칙이 해당 플래그와 일치할 때만 최종 편집에 대해 알림을 보냅니다. 이 페이지는 Matrix를 자체 호스팅하며 각 수신자 계정에 해당 규칙을 설치하려는 운영자를 위한 것입니다.

기본 Matrix 알림 동작만 원한다면 `streaming: "partial"`을 사용하거나 스트리밍을 끄세요. [Matrix 채널 설정](/ko/channels/matrix#streaming-previews)을 참고하세요.

## 필수 조건

- 수신자 사용자 = 알림을 받아야 하는 사람
- 봇 사용자 = 답장을 보내는 OpenClaw Matrix 계정
- 아래 API 호출에는 수신자 사용자의 액세스 토큰 사용
- 푸시 규칙의 `sender`는 봇 사용자의 전체 MXID와 일치시킴
- 수신자 계정에는 이미 작동하는 푸셔가 있어야 함 — 조용한 미리 보기 규칙은 일반 Matrix 푸시 전달이 정상일 때만 작동함

## 단계

<Steps>
  <Step title="조용한 미리 보기 구성">

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
    가능하면 기존 클라이언트 세션 토큰을 재사용하세요. 새 토큰을 발급하려면:

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

  <Step title="푸셔가 있는지 확인">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

푸셔가 반환되지 않으면 계속하기 전에 이 계정의 일반 Matrix 푸시 전달을 수정하세요.

  </Step>

  <Step title="override 푸시 규칙 설치">
    OpenClaw는 최종화된 텍스트 전용 미리 보기 편집에 `content["com.openclaw.finalized_preview"] = true`를 표시합니다. 해당 마커와 봇 MXID를 발신자로 함께 일치시키는 규칙을 설치하세요:

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

    실행하기 전에 바꾸세요:

    - `https://matrix.example.org`: 홈서버 기본 URL
    - `$USER_ACCESS_TOKEN`: 수신자 사용자의 액세스 토큰
    - `openclaw-finalized-preview-botname`: 봇과 수신자 조합마다 고유한 규칙 ID(패턴: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: 수신자의 MXID가 아니라 OpenClaw 봇 MXID

  </Step>

  <Step title="확인">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

그런 다음 스트리밍 답장을 테스트하세요. quiet 모드에서는 방에 조용한 초안 미리 보기가 표시되고, 블록 또는 턴이 끝나면 한 번 알림을 보냅니다.

  </Step>
</Steps>

나중에 규칙을 제거하려면 수신자의 토큰으로 동일한 규칙 URL에 `DELETE`를 호출하세요.

## 다중 봇 참고 사항

푸시 규칙은 `ruleId`를 키로 사용합니다. 동일한 ID에 `PUT`을 다시 실행하면 단일 규칙이 업데이트됩니다. 여러 OpenClaw 봇이 동일한 수신자에게 알림을 보내는 경우, 각 봇마다 서로 다른 발신자 일치 조건을 가진 규칙을 하나씩 만드세요.

새 사용자 정의 `override` 규칙은 기본 억제 규칙보다 앞에 삽입되므로 추가 정렬 매개변수는 필요하지 않습니다. 이 규칙은 제자리에서 최종화할 수 있는 텍스트 전용 미리 보기 편집에만 영향을 줍니다. 미디어 대체 동작과 오래된 미리 보기 대체 동작은 일반 Matrix 전달을 사용합니다.

## 홈서버 참고 사항

<AccordionGroup>
  <Accordion title="Synapse">
    특별한 `homeserver.yaml` 변경은 필요하지 않습니다. 일반 Matrix 알림이 이미 이 사용자에게 도달한다면 위의 수신자 토큰 + `pushrules` 호출이 주요 설정 단계입니다.

    리버스 프록시 또는 워커 뒤에서 Synapse를 실행하는 경우 `/_matrix/client/.../pushrules/`가 Synapse에 올바르게 도달하는지 확인하세요. 푸시 전달은 메인 프로세스 또는 `synapse.app.pusher` / 구성된 푸셔 워커가 처리합니다 — 해당 구성 요소가 정상인지 확인하세요.

    이 규칙은 `event_property_is` 푸시 규칙 조건(MSC3758, 푸시 규칙 v1.10)을 사용하며, 이 조건은 2023년에 Synapse에 추가되었습니다. 이전 Synapse 릴리스는 `PUT pushrules/...` 호출을 허용하지만 조건과 조용히 일치하지 않습니다 — 최종화된 미리 보기 편집에서 알림이 도착하지 않으면 Synapse를 업그레이드하세요.

  </Accordion>

  <Accordion title="Tuwunel">
    흐름은 Synapse와 동일합니다. 최종화된 미리 보기 마커를 위해 Tuwunel 전용 구성이 필요하지 않습니다.

    사용자가 다른 기기에서 활성 상태일 때 알림이 사라진다면 `suppress_push_when_active`가 활성화되어 있는지 확인하세요. Tuwunel은 1.4.2(2025년 9월)에 이 옵션을 추가했으며, 한 기기가 활성 상태일 때 다른 기기로의 푸시를 의도적으로 억제할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 관련 문서

- [Matrix 채널 설정](/ko/channels/matrix)
- [스트리밍 개념](/ko/concepts/streaming)
