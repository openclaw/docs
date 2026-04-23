---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 확인 구성하기
summary: Matrix 지원 상태, 설정, 그리고 구성 예시
title: Matrix
x-i18n:
    generated_at: "2026-04-23T13:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix는 OpenClaw용 번들 채널 Plugin입니다.
공식 `matrix-js-sdk`를 사용하며 DM, room, thread, media, reaction, poll, location, E2EE를 지원합니다.

## 번들 Plugin

Matrix는 현재 OpenClaw 릴리스에 번들 Plugin으로 포함되어 있으므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

오래된 빌드이거나 Matrix가 제외된 사용자 지정 설치를 사용하는 경우 수동으로 설치하세요:

npm에서 설치:

```bash
openclaw plugins install @openclaw/matrix
```

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin 동작 및 설치 규칙은 [Plugins](/ko/tools/plugin)를 참조하세요.

## 설정

1. Matrix Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 오래된/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. 홈서버에서 Matrix 계정을 생성합니다.
3. `channels.matrix`를 다음 중 하나로 구성합니다:
   - `homeserver` + `accessToken`, 또는
   - `homeserver` + `userId` + `password`.
4. Gateway를 다시 시작합니다.
5. 봇과 DM을 시작하거나 room에 초대합니다.
   - 새 Matrix 초대는 `channels.matrix.autoJoin`이 허용할 때만 작동합니다.

대화형 설정 경로:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 마법사는 다음을 묻습니다:

- homeserver URL
- 인증 방법: 액세스 토큰 또는 비밀번호
- 사용자 ID(비밀번호 인증 전용)
- 선택적 장치 이름
- E2EE 활성화 여부
- room 접근 및 초대 자동 참여 구성 여부

마법사의 주요 동작:

- Matrix 인증 env var가 이미 존재하고 해당 계정에 아직 config에 저장된 인증 정보가 없다면, 마법사는 인증 정보를 env var에 유지하는 env 바로가기를 제안합니다.
- 계정 이름은 계정 ID로 정규화됩니다. 예를 들어 `Ops Bot`은 `ops-bot`이 됩니다.
- DM allowlist 항목은 `@user:server`를 직접 받을 수 있습니다. 표시 이름은 라이브 디렉터리 조회에서 정확히 하나의 일치 항목을 찾았을 때만 작동합니다.
- Room allowlist 항목은 room ID와 alias를 직접 받을 수 있습니다. `!room:server` 또는 `#alias:server`를 권장합니다. 확인되지 않은 이름은 allowlist 해석 시 런타임에 무시됩니다.
- 초대 자동 참여 allowlist 모드에서는 안정적인 초대 대상만 사용하세요: `!roomId:server`, `#alias:server`, 또는 `*`. 일반 room 이름은 거부됩니다.
- 저장 전에 room 이름을 해석하려면 `openclaw channels resolve --channel matrix "Project Room"`을 사용하세요.

<Warning>
`channels.matrix.autoJoin`의 기본값은 `off`입니다.

설정하지 않은 상태로 두면 봇은 초대된 room이나 새로운 DM 스타일 초대에 참여하지 않으므로, 먼저 수동으로 참여하지 않는 한 새 그룹이나 초대된 DM에 나타나지 않습니다.

수락할 초대를 제한하려면 `autoJoin: "allowlist"`와 함께 `autoJoinAllowlist`를 설정하고, 모든 초대에 참여하게 하려면 `autoJoin: "always"`를 설정하세요.

`allowlist` 모드에서 `autoJoinAllowlist`는 `!roomId:server`, `#alias:server`, 또는 `*`만 허용합니다.
</Warning>

Allowlist 예시:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

모든 초대에 참여:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

최소 토큰 기반 설정:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

비밀번호 기반 설정(로그인 후 토큰이 캐시됨):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix는 캐시된 자격 증명을 `~/.openclaw/credentials/matrix/`에 저장합니다.
기본 계정은 `credentials.json`을 사용하고, 이름이 있는 계정은 `credentials-<account>.json`을 사용합니다.
해당 위치에 캐시된 자격 증명이 있으면 현재 인증이 config에 직접 설정되어 있지 않더라도 OpenClaw는 설정, doctor, 채널 상태 탐지에서 Matrix가 구성된 것으로 간주합니다.

환경 변수 대응 항목(config 키가 설정되지 않은 경우 사용됨):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

기본값이 아닌 계정의 경우 계정 범위 env var를 사용하세요:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

계정 `ops`의 예:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

정규화된 계정 ID `ops-bot`의 경우 다음을 사용합니다:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix는 계정 ID의 문장 부호를 이스케이프하여 계정 범위 env var 간 충돌이 없도록 합니다.
예를 들어 `-`는 `_X2D_`가 되므로 `ops-prod`는 `MATRIX_OPS_X2D_PROD_*`에 매핑됩니다.

대화형 마법사는 해당 인증 env var가 이미 존재하고 선택한 계정에 config에 저장된 Matrix 인증 정보가 아직 없는 경우에만 env-var 바로가기를 제공합니다.

`MATRIX_HOMESERVER`는 workspace `.env`에서 설정할 수 없습니다. [Workspace `.env` files](/ko/gateway/security)를 참조하세요.

## 구성 예시

다음은 DM pairing, room allowlist, E2EE 활성화를 포함한 실용적인 기준 config입니다:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin`은 DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다. OpenClaw는 초대 시점에 초대된 room을 DM인지 그룹인지 안정적으로 분류할 수 없으므로, 모든 초대는 먼저 `autoJoin`을 거칩니다. `dm.policy`는 봇이 참여한 후 room이 DM으로 분류되면 적용됩니다.

## 스트리밍 미리보기

Matrix 응답 스트리밍은 opt-in입니다.

OpenClaw가 단일 라이브 미리보기 응답을 보내고, 모델이 텍스트를 생성하는 동안 해당 미리보기를 제자리에서 수정한 다음, 응답이 완료되면 마무리하도록 하려면 `channels.matrix.streaming`을 `"partial"`로 설정하세요:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`가 기본값입니다. OpenClaw는 최종 응답을 기다렸다가 한 번만 전송합니다.
- `streaming: "partial"`은 현재 assistant block에 대해 일반 Matrix 텍스트 메시지를 사용하는 편집 가능한 미리보기 메시지 하나를 생성합니다. 이는 Matrix의 기존 미리보기 우선 알림 동작을 유지하므로, 기본 클라이언트는 완료된 block 대신 첫 번째 스트리밍 미리보기 텍스트에 대해 알림을 보낼 수 있습니다.
- `streaming: "quiet"`은 현재 assistant block에 대해 편집 가능한 조용한 미리보기 알림 하나를 생성합니다. 완료된 미리보기 수정에 대한 수신자 push rule도 함께 구성할 때만 이 설정을 사용하세요.
- `blockStreaming: true`는 별도의 Matrix 진행 상태 메시지를 활성화합니다. 미리보기 스트리밍이 활성화된 경우 Matrix는 현재 block의 라이브 초안을 유지하고 완료된 block은 별도 메시지로 보존합니다.
- 미리보기 스트리밍이 켜져 있고 `blockStreaming`이 꺼져 있으면 Matrix는 라이브 초안을 제자리에서 수정하고 block 또는 turn이 끝나면 동일한 event를 마무리합니다.
- 미리보기가 더 이상 하나의 Matrix event에 들어가지 않으면 OpenClaw는 미리보기 스트리밍을 중단하고 일반 최종 전송으로 대체합니다.
- 미디어 응답은 여전히 첨부 파일을 정상적으로 전송합니다. 오래된 미리보기를 더 이상 안전하게 재사용할 수 없으면 OpenClaw는 최종 미디어 응답을 보내기 전에 이를 redact합니다.
- 미리보기 수정은 추가 Matrix API 호출 비용이 듭니다. 가장 보수적인 rate-limit 동작을 원하면 스트리밍을 끄세요.

`blockStreaming`만으로는 초안 미리보기가 활성화되지 않습니다.
미리보기 수정을 위해 `streaming: "partial"` 또는 `streaming: "quiet"`을 사용하고, 완료된 assistant block도 별도의 진행 메시지로 계속 보이게 하려는 경우에만 `blockStreaming: true`를 추가하세요.

사용자 지정 push rule 없이 기본 Matrix 알림이 필요하다면 미리보기 우선 동작을 위해 `streaming: "partial"`을 사용하거나, 최종 전용 전송을 위해 `streaming`을 끄세요. `streaming: "off"`일 때:

- `blockStreaming: true`는 완료된 각 block을 일반 알림 Matrix 메시지로 전송합니다.
- `blockStreaming: false`는 최종 완료된 응답만 일반 알림 Matrix 메시지로 전송합니다.

### 조용한 완료 미리보기를 위한 자체 호스팅 push rule

자체 Matrix 인프라를 운영하고, 조용한 미리보기가 block 또는 최종 응답이 완료될 때만 알림을 보내도록 하려면 `streaming: "quiet"`을 설정하고 완료된 미리보기 수정에 대한 사용자별 push rule을 추가하세요.

이 설정은 보통 홈서버 전체 config 변경이 아니라 수신 사용자 설정입니다:

시작 전 빠른 개요:

- recipient user = 알림을 받아야 하는 사람
- bot user = 응답을 보내는 OpenClaw Matrix 계정
- 아래 API 호출에는 recipient user의 액세스 토큰을 사용
- push rule의 `sender`는 bot user의 전체 MXID와 일치시킴

1. OpenClaw가 조용한 미리보기를 사용하도록 구성합니다:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. recipient 계정이 이미 일반 Matrix push 알림을 받고 있는지 확인합니다. 조용한 미리보기 rule은 해당 사용자에게 이미 동작하는 pusher/device가 있을 때만 작동합니다.

3. recipient user의 액세스 토큰을 가져옵니다.
   - bot의 토큰이 아니라 수신 사용자의 토큰을 사용하세요.
   - 기존 클라이언트 세션 토큰을 재사용하는 것이 보통 가장 쉽습니다.
   - 새 토큰을 발급해야 한다면 표준 Matrix Client-Server API를 통해 로그인할 수 있습니다:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. recipient 계정에 이미 pusher가 있는지 확인합니다:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

여기서 활성 pusher/device가 반환되지 않으면, 아래 OpenClaw rule을 추가하기 전에 먼저 일반 Matrix 알림을 수정하세요.

OpenClaw는 완료된 텍스트 전용 미리보기 수정을 다음과 같이 표시합니다:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 이러한 알림을 받아야 하는 각 recipient 계정에 대해 override push rule을 생성합니다:

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

명령을 실행하기 전에 다음 값을 바꾸세요:

- `https://matrix.example.org`: 홈서버 기본 URL
- `$USER_ACCESS_TOKEN`: 수신 사용자의 액세스 토큰
- `openclaw-finalized-preview-botname`: 이 수신 사용자에 대한 이 bot 전용 고유 rule ID
- `@bot:example.org`: 수신 사용자의 MXID가 아닌 OpenClaw Matrix bot MXID

멀티 bot 설정에서 중요:

- Push rule은 `ruleId`를 기준으로 식별됩니다. 같은 rule ID에 대해 `PUT`을 다시 실행하면 해당 rule 하나가 업데이트됩니다.
- 한 수신 사용자가 여러 OpenClaw Matrix bot 계정에 대해 알림을 받아야 한다면, 각 `sender` 일치 항목마다 고유한 rule ID를 사용해 bot별로 rule 하나씩 생성하세요.
- 간단한 패턴은 `openclaw-finalized-preview-<botname>`이며, 예를 들어 `openclaw-finalized-preview-ops` 또는 `openclaw-finalized-preview-support`처럼 사용할 수 있습니다.

이 rule은 event 발신자를 기준으로 평가됩니다:

- 수신 사용자의 토큰으로 인증
- `sender`를 OpenClaw bot MXID와 일치시킴

6. rule이 존재하는지 확인합니다:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 스트리밍 응답을 테스트합니다. quiet 모드에서는 room에 조용한 초안 미리보기가 표시되고, 최종 제자리 수정은 block 또는 turn이 끝날 때 한 번 알림을 보내야 합니다.

나중에 rule을 제거해야 한다면, 수신 사용자의 토큰으로 동일한 rule ID를 삭제하세요:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

참고:

- rule은 bot의 토큰이 아니라 수신 사용자의 액세스 토큰으로 생성하세요.
- 새 사용자 정의 `override` rule은 기본 suppress rule보다 앞에 삽입되므로, 추가 정렬 매개변수는 필요하지 않습니다.
- 이는 OpenClaw가 제자리에서 안전하게 완료 처리할 수 있는 텍스트 전용 미리보기 수정에만 적용됩니다. 미디어 fallback 및 오래된 미리보기 fallback은 여전히 일반 Matrix 전송을 사용합니다.
- `GET /_matrix/client/v3/pushers`에 pusher가 표시되지 않으면, 해당 사용자는 이 계정/장치에 대해 아직 동작하는 Matrix push 전송이 없는 것입니다.

#### Synapse

Synapse에서는 일반적으로 위 설정만으로 충분합니다:

- 완료된 OpenClaw 미리보기 알림을 위해 특별한 `homeserver.yaml` 변경은 필요하지 않습니다.
- Synapse 배포에서 이미 일반 Matrix push 알림이 전송되고 있다면, 위의 사용자 토큰 + `pushrules` 호출이 주요 설정 단계입니다.
- Synapse를 reverse proxy 또는 worker 뒤에서 실행 중이라면 `/_matrix/client/.../pushrules/`가 Synapse에 올바르게 전달되는지 확인하세요.
- Synapse worker를 사용 중이라면 pusher 상태가 정상인지 확인하세요. Push 전송은 메인 프로세스 또는 `synapse.app.pusher` / 구성된 pusher worker에서 처리됩니다.

#### Tuwunel

Tuwunel에서는 위에 표시된 것과 동일한 설정 흐름과 push-rule API 호출을 사용하세요:

- 완료된 미리보기 마커 자체를 위해 Tuwunel 전용 config는 필요하지 않습니다.
- 해당 사용자에 대해 일반 Matrix 알림이 이미 동작한다면, 위의 사용자 토큰 + `pushrules` 호출이 주요 설정 단계입니다.
- 사용자가 다른 장치에서 활성 상태일 때 알림이 사라지는 것처럼 보인다면 `suppress_push_when_active`가 활성화되어 있는지 확인하세요. Tuwunel은 2025년 9월 12일 Tuwunel 1.4.2에서 이 옵션을 추가했으며, 한 장치가 활성 상태일 때 다른 장치에 대한 push를 의도적으로 억제할 수 있습니다.

## Bot-to-bot room

기본적으로 다른 구성된 OpenClaw Matrix 계정에서 온 Matrix 메시지는 무시됩니다.

의도적으로 agent 간 Matrix 트래픽을 허용하려면 `allowBots`를 사용하세요:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true`는 허용된 room 및 DM에서 다른 구성된 Matrix bot 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`는 room에서 이 bot이 명시적으로 멘션된 경우에만 해당 메시지를 수락합니다. DM은 여전히 허용됩니다.
- `groups.<room>.allowBots`는 한 room에 대해 계정 수준 설정을 재정의합니다.
- OpenClaw는 self-reply loop를 피하기 위해 동일한 Matrix 사용자 ID에서 온 메시지는 계속 무시합니다.
- Matrix는 여기서 기본 bot 플래그를 제공하지 않으므로, OpenClaw는 "bot 작성"을 "이 OpenClaw Gateway에서 다른 구성된 Matrix 계정이 보낸 것"으로 간주합니다.

공유 room에서 bot-to-bot 트래픽을 활성화할 때는 엄격한 room allowlist와 멘션 요구 사항을 사용하세요.

## 암호화 및 확인

암호화된(E2EE) room에서는 outbound image event가 `thumbnail_file`을 사용하므로 이미지 미리보기가 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 room은 계속 일반 `thumbnail_url`을 사용합니다. 별도 설정은 필요하지 않습니다. Plugin이 E2EE 상태를 자동으로 감지합니다.

암호화 활성화:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

확인 상태 확인:

```bash
openclaw matrix verify status
```

상세 상태(전체 진단):

```bash
openclaw matrix verify status --verbose
```

저장된 복구 키를 기계 판독 가능 출력에 포함:

```bash
openclaw matrix verify status --include-recovery-key --json
```

교차 서명 및 확인 상태 부트스트랩:

```bash
openclaw matrix verify bootstrap
```

상세 부트스트랩 진단:

```bash
openclaw matrix verify bootstrap --verbose
```

부트스트랩 전에 새 교차 서명 ID 재설정을 강제:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

복구 키로 이 장치 확인:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

상세 장치 확인 정보:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

room-key 백업 상태 확인:

```bash
openclaw matrix verify backup status
```

상세 백업 상태 진단:

```bash
openclaw matrix verify backup status --verbose
```

서버 백업에서 room key 복원:

```bash
openclaw matrix verify backup restore
```

상세 복원 진단:

```bash
openclaw matrix verify backup restore --verbose
```

현재 서버 백업을 삭제하고 새 백업 기준선을 생성합니다. 저장된
백업 키를 정상적으로 로드할 수 없다면, 이 재설정은 secret storage도 다시 생성하여
향후 콜드 스타트에서 새 백업 키를 로드할 수 있게 할 수 있습니다:

```bash
openclaw matrix verify backup reset --yes
```

모든 `verify` 명령은 기본적으로 간결하게 동작하며(내부 SDK의 조용한 로깅 포함), 자세한 진단은 `--verbose`를 사용할 때만 표시됩니다.
스크립트에서 사용할 때는 전체 기계 판독 가능 출력을 위해 `--json`을 사용하세요.

다중 계정 설정에서 Matrix CLI 명령은 `--account <id>`를 전달하지 않으면 암시적 Matrix 기본 계정을 사용합니다.
이름이 지정된 여러 계정을 구성했다면 먼저 `channels.matrix.defaultAccount`를 설정하세요. 그렇지 않으면 해당 암시적 CLI 작업은 중단되고 계정을 명시적으로 선택하라고 요청합니다.
확인 또는 장치 작업이 특정 이름 있는 계정을 명시적으로 대상으로 하게 하려면 언제든 `--account`를 사용하세요:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

암호화가 비활성화되어 있거나 이름 있는 계정에서 사용할 수 없는 경우, Matrix 경고와 확인 오류는 해당 계정의 config 키를 가리킵니다. 예: `channels.matrix.accounts.assistant.encryption`.

### "verified"의 의미

OpenClaw는 이 Matrix 장치가 사용자의 교차 서명 ID에 의해 확인된 경우에만 verified로 취급합니다.
실제로 `openclaw matrix verify status --verbose`는 세 가지 신뢰 신호를 노출합니다:

- `Locally trusted`: 현재 클라이언트에서만 이 장치를 신뢰함
- `Cross-signing verified`: SDK가 이 장치가 교차 서명을 통해 확인되었다고 보고함
- `Signed by owner`: 이 장치가 사용자의 self-signing 키로 서명됨

`Verified by owner`는 교차 서명 확인 또는 소유자 서명이 있을 때만 `yes`가 됩니다.
로컬 신뢰만으로는 OpenClaw가 이 장치를 완전히 verified로 취급하기에 충분하지 않습니다.

### bootstrap이 하는 일

`openclaw matrix verify bootstrap`은 암호화된 Matrix 계정의 복구 및 설정 명령입니다.
다음 작업을 순서대로 모두 수행합니다:

- 가능하면 기존 복구 키를 재사용하여 secret storage 부트스트랩
- 교차 서명 부트스트랩 및 누락된 공개 교차 서명 키 업로드
- 현재 장치를 표시하고 교차 서명 시도
- 아직 없으면 새 서버 측 room-key 백업 생성

홈서버가 교차 서명 키 업로드에 대화형 인증을 요구하면, OpenClaw는 먼저 인증 없이 업로드를 시도한 다음 `m.login.dummy`로, 그리고 `channels.matrix.password`가 구성된 경우 `m.login.password`로 시도합니다.

현재 교차 서명 ID를 폐기하고 새로 만들려는 의도가 있을 때만 `--force-reset-cross-signing`을 사용하세요.

현재 room-key 백업을 의도적으로 폐기하고 향후 메시지를 위한 새
백업 기준선을 시작하려면 `openclaw matrix verify backup reset --yes`를 사용하세요.
복구할 수 없는 이전 암호화 기록이 계속
사용 불가능한 상태로 남고, 현재 백업 secret을 안전하게 로드할 수 없는 경우 OpenClaw가 secret storage를 재생성할 수 있음을
수용할 때만 이 작업을 수행하세요.

### 새 백업 기준선

향후 암호화된 메시지는 계속 작동하게 유지하고 복구할 수 없는 이전 기록 손실을 감수할 수 있다면, 다음 명령을 순서대로 실행하세요:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

이름 있는 Matrix 계정을 명시적으로 대상으로 지정하려면 각 명령에 `--account <id>`를 추가하세요.

### 시작 동작

`encryption: true`일 때 Matrix는 `startupVerification`의 기본값을 `"if-unverified"`로 설정합니다.
시작 시 이 장치가 아직 확인되지 않았다면 Matrix는 다른 Matrix 클라이언트에서 self-verification을 요청하고,
이미 하나가 보류 중이면 중복 요청을 건너뛰며, 재시작 후 재시도 전에 로컬 cooldown을 적용합니다.
실패한 요청 시도는 기본적으로 성공적으로 요청을 생성한 경우보다 더 빨리 재시도됩니다.
자동 시작 요청을 비활성화하려면 `startupVerification: "off"`를 설정하거나, 더 짧거나 긴 재시도 기간을 원하면 `startupVerificationCooldownHours`
를 조정하세요.

시작 시에는 보수적인 crypto bootstrap 단계도 자동으로 수행됩니다.
이 단계는 먼저 현재 secret storage와 교차 서명 ID를 재사용하려고 시도하며, 명시적인 bootstrap 복구 흐름을 실행하지 않는 한 교차 서명을 재설정하지 않습니다.

시작 과정에서 여전히 깨진 bootstrap 상태가 발견되면, `channels.matrix.password`가 구성되지 않았더라도 OpenClaw는 보호된 복구 경로를 시도할 수 있습니다.
해당 복구에 홈서버가 비밀번호 기반 UIA를 요구하면, OpenClaw는 경고를 기록하고 bot을 중단하는 대신 시작을 비치명적으로 유지합니다.
현재 장치가 이미 owner-signed 상태라면 OpenClaw는 이를 자동으로 재설정하지 않고 해당 ID를 보존합니다.

전체 업그레이드 흐름, 제한 사항, 복구 명령, 일반적인 마이그레이션 메시지는 [Matrix migration](/ko/install/migrating-matrix)을 참조하세요.

### 확인 알림

Matrix는 확인 수명 주기 알림을 strict DM verification room에 `m.notice` 메시지로 직접 게시합니다.
여기에는 다음이 포함됩니다:

- 확인 요청 알림
- 확인 준비 완료 알림(명시적인 "Verify by emoji" 안내 포함)
- 확인 시작 및 완료 알림
- 가능한 경우 SAS 세부 정보(emoji 및 decimal)

다른 Matrix 클라이언트에서 들어오는 확인 요청은 OpenClaw가 추적하고 자동 수락합니다.
self-verification 흐름의 경우 OpenClaw는 emoji verification이 가능해지면 SAS 흐름도 자동으로 시작하고 자체 측을 확인합니다.
다른 Matrix 사용자/장치의 확인 요청에 대해서는 OpenClaw가 요청을 자동 수락한 뒤 SAS 흐름이 정상적으로 진행되기를 기다립니다.
확인을 완료하려면 여전히 Matrix 클라이언트에서 emoji 또는 decimal SAS를 비교하고 그곳에서 "They match"를 확인해야 합니다.

OpenClaw는 self-initiated duplicate flow를 무분별하게 자동 수락하지 않습니다. self-verification 요청이 이미 보류 중이면 시작 시 새 요청 생성을 건너뜁니다.

확인 프로토콜/시스템 알림은 agent 채팅 파이프라인으로 전달되지 않으므로 `NO_REPLY`를 생성하지 않습니다.

### 장치 위생

오래된 OpenClaw 관리 Matrix 장치가 계정에 누적되면 암호화된 room의 신뢰 상태를 파악하기 어려워질 수 있습니다.
다음 명령으로 목록을 확인하세요:

```bash
openclaw matrix devices list
```

오래된 OpenClaw 관리 장치를 제거하려면 다음을 사용하세요:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EE는 Node에서 공식 `matrix-js-sdk` Rust crypto 경로를 사용하며, IndexedDB shim으로 `fake-indexeddb`를 사용합니다. Crypto 상태는 스냅샷 파일(`crypto-idb-snapshot.json`)에 영구 저장되고 시작 시 복원됩니다. 스냅샷 파일은 제한적인 파일 권한으로 저장되는 민감한 런타임 상태입니다.

암호화된 런타임 상태는 계정별, 사용자별 token-hash 루트 아래
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`에 저장됩니다.
이 디렉터리에는 sync 저장소(`bot-storage.json`), crypto 저장소(`crypto/`),
복구 키 파일(`recovery-key.json`), IndexedDB 스냅샷(`crypto-idb-snapshot.json`),
thread binding(`thread-bindings.json`), 시작 확인 상태(`startup-verification.json`)가 포함됩니다.
토큰이 변경되더라도 계정 ID가 동일하면 OpenClaw는 해당 account/homeserver/user 튜플에 대해 가장 적합한 기존
루트를 재사용하므로, 이전 sync 상태, crypto 상태, thread binding,
시작 확인 상태가 계속 보입니다.

## 프로필 관리

선택한 계정의 Matrix self-profile을 업데이트하려면 다음을 사용하세요:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

특정 이름 있는 Matrix 계정을 명시적으로 대상으로 지정하려면 `--account <id>`를 추가하세요.

Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://` 또는 `https://` 아바타 URL을 전달하면 OpenClaw는 먼저 이를 Matrix에 업로드하고, 해석된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 선택한 계정 재정의)에 다시 저장합니다.

## Thread

Matrix는 자동 응답과 message-tool 전송 모두에 대해 기본 Matrix thread를 지원합니다.

- `dm.sessionScope: "per-user"`(기본값)는 Matrix DM 라우팅을 발신자 범위로 유지하므로, 여러 DM room이 동일한 peer로 해석되면 하나의 session을 공유할 수 있습니다.
- `dm.sessionScope: "per-room"`은 각 Matrix DM room을 자체 session 키로 분리하면서도 일반 DM 인증 및 allowlist 검사는 계속 사용합니다.
- 명시적인 Matrix 대화 binding은 여전히 `dm.sessionScope`보다 우선하므로, binding된 room과 thread는 선택한 대상 session을 유지합니다.
- `threadReplies: "off"`는 응답을 최상위 수준으로 유지하고, 들어오는 thread 메시지는 상위 session에 유지합니다.
- `threadReplies: "inbound"`는 들어오는 메시지가 이미 해당 thread 안에 있었던 경우에만 thread 내부에서 응답합니다.
- `threadReplies: "always"`는 room 응답을 트리거 메시지를 루트로 하는 thread에 유지하고, 첫 번째 트리거 메시지부터 해당 대화를 일치하는 thread 범위 session으로 라우팅합니다.
- `dm.threadReplies`는 DM에 대해서만 최상위 설정을 재정의합니다. 예를 들어 room thread는 분리된 상태로 유지하면서 DM은 평면 구조로 유지할 수 있습니다.
- 들어오는 thread 메시지에는 추가 agent 컨텍스트로 thread 루트 메시지가 포함됩니다.
- 대상이 동일한 room 또는 동일한 DM 사용자 대상일 때 message-tool 전송은 명시적인 `threadId`가 제공되지 않으면 현재 Matrix thread를 자동 상속합니다.
- 동일 session DM 사용자 대상 재사용은 현재 session 메타데이터가 동일한 Matrix 계정의 동일한 DM peer를 증명할 때만 작동합니다. 그렇지 않으면 OpenClaw는 일반 사용자 범위 라우팅으로 대체합니다.
- OpenClaw가 동일한 공유 Matrix DM session에서 한 Matrix DM room이 다른 DM room과 충돌하는 것을 감지하면, thread binding이 활성화되어 있고 `dm.sessionScope` 힌트가 있는 경우 해당 room에 `/focus` 탈출구를 포함한 일회성 `m.notice`를 게시합니다.
- 런타임 thread binding은 Matrix에서 지원됩니다. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 그리고 thread-bound `/acp spawn`은 Matrix room과 DM에서 작동합니다.
- 최상위 Matrix room/DM의 `/focus`는 `threadBindings.spawnSubagentSessions=true`일 때 새 Matrix thread를 만들고 이를 대상 session에 바인딩합니다.
- 기존 Matrix thread 내부에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 현재 thread가 대신 바인딩됩니다.

## ACP 대화 binding

Matrix room, DM, 기존 Matrix thread는 채팅 표면을 변경하지 않고도 지속적인 ACP 작업공간으로 전환할 수 있습니다.

빠른 운영자 흐름:

- 계속 사용할 Matrix DM, room, 또는 기존 thread 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 최상위 Matrix DM 또는 room에서는 현재 DM/room이 채팅 표면으로 유지되고, 이후 메시지는 생성된 ACP session으로 라우팅됩니다.
- 기존 Matrix thread 안에서는 `--bind here`가 현재 thread를 제자리에서 바인딩합니다.
- `/new`와 `/reset`은 동일하게 바인딩된 ACP session을 제자리에서 재설정합니다.
- `/acp close`는 ACP session을 닫고 binding을 제거합니다.

참고:

- `--bind here`는 자식 Matrix thread를 생성하지 않습니다.
- `threadBindings.spawnAcpSessions`는 OpenClaw가 자식 Matrix thread를 생성하거나 바인딩해야 하는 `/acp spawn --thread auto|here`에만 필요합니다.

### Thread binding config

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며, 채널별 재정의도 지원합니다:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix thread-bound spawn 플래그는 opt-in입니다:

- 최상위 `/focus`가 새 Matrix thread를 생성하고 바인딩하도록 허용하려면 `threadBindings.spawnSubagentSessions: true`를 설정하세요.
- `/acp spawn --thread auto|here`가 ACP session을 Matrix thread에 바인딩하도록 허용하려면 `threadBindings.spawnAcpSessions: true`를 설정하세요.

## 반응

Matrix는 outbound 반응 액션, inbound 반응 알림, inbound ack 반응을 지원합니다.

- Outbound 반응 도구는 `channels["matrix"].actions.reactions`에 의해 제어됩니다.
- `react`는 특정 Matrix event에 반응을 추가합니다.
- `reactions`는 특정 Matrix event에 대한 현재 반응 요약을 나열합니다.
- `emoji=""`는 해당 event에서 bot 계정 자신의 반응을 제거합니다.
- `remove: true`는 bot 계정의 지정된 emoji 반응만 제거합니다.

Ack 반응은 표준 OpenClaw 해석 순서를 사용합니다:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent identity emoji fallback

Ack 반응 범위는 다음 순서로 해석됩니다:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

반응 알림 모드는 다음 순서로 해석됩니다:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 기본값: `own`

동작:

- `reactionNotifications: "own"`은 bot이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` event를 전달합니다.
- `reactionNotifications: "off"`는 반응 시스템 event를 비활성화합니다.
- 반응 제거는 Matrix가 이를 독립적인 `m.reaction` 제거가 아니라 redact로 표시하므로 시스템 event로 합성되지 않습니다.

## 기록 컨텍스트

- `channels.matrix.historyLimit`는 Matrix room 메시지가 agent를 트리거할 때 `InboundHistory`로 포함할 최근 room 메시지 수를 제어합니다. `messages.groupChat.historyLimit`로 fallback되며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정하세요.
- Matrix room 기록은 room 전용입니다. DM은 일반 session 기록을 계속 사용합니다.
- Matrix room 기록은 pending-only입니다. OpenClaw는 아직 응답을 트리거하지 않은 room 메시지를 버퍼링한 다음, 멘션 또는 다른 트리거가 도착하면 해당 창을 스냅샷합니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않습니다. 해당 turn의 기본 inbound 본문에 그대로 유지됩니다.
- 동일한 Matrix event를 재시도할 때는 더 새로운 room 메시지로 앞으로 이동하지 않고 원래 기록 스냅샷을 재사용합니다.

## 컨텍스트 가시성

Matrix는 가져온 응답 텍스트, thread 루트, pending history 같은 보조 room 컨텍스트에 대해 공유 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보조 컨텍스트는 수신된 그대로 유지됩니다.
- `contextVisibility: "allowlist"`는 활성 room/user allowlist 검사에서 허용된 발신자로 보조 컨텍스트를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 하나의 명시적 인용 응답은 계속 유지합니다.

이 설정은 보조 컨텍스트 가시성에 영향을 주며, inbound 메시지 자체가 응답을 트리거할 수 있는지 여부에는 영향을 주지 않습니다.
트리거 권한은 계속 `groupPolicy`, `groups`, `groupAllowFrom`, DM 정책 설정에서 결정됩니다.

## DM 및 room 정책

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

멘션 게이팅과 allowlist 동작은 [Groups](/ko/channels/groups)를 참조하세요.

Matrix DM에 대한 pairing 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면, OpenClaw는 새 코드를 발급하는 대신 동일한 pending pairing 코드를 재사용하고 짧은 cooldown 후에 다시 알림 응답을 보낼 수 있습니다.

공유 DM pairing 흐름과 저장소 레이아웃은 [Pairing](/ko/channels/pairing)을 참조하세요.

## direct room 복구

direct-message 상태가 동기화되지 않으면 OpenClaw가 실시간 DM 대신 오래된 단독 room을 가리키는 오래된 `m.direct` 매핑을 가지게 될 수 있습니다. peer에 대한 현재 매핑을 확인하려면 다음을 사용하세요:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

다음으로 복구합니다:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

복구 흐름:

- 이미 `m.direct`에 매핑된 엄격한 1:1 DM을 우선 사용
- 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 fallback
- 정상적인 DM이 없으면 새 direct room을 만들고 `m.direct`를 다시 씀

복구 흐름은 오래된 room을 자동 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑만 업데이트하여 새 Matrix 전송, 확인 알림, 기타 direct-message 흐름이 다시 올바른 room을 대상으로 하도록 합니다.

## exec 승인

Matrix는 Matrix 계정의 기본 승인 클라이언트로 동작할 수 있습니다. 기본
DM/channel 라우팅 제어는 계속 exec 승인 config 아래에 있습니다:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`(선택 사항, `channels.matrix.dm.allowFrom`으로 fallback)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

승인자는 `@owner:example.org` 같은 Matrix 사용자 ID여야 합니다. `enabled`가 설정되지 않았거나 `"auto"`이고 하나 이상의 승인자를 해석할 수 있으면 Matrix는 기본 승인을 자동 활성화합니다. Exec 승인은 먼저 `execApprovals.approvers`를 사용하고 `channels.matrix.dm.allowFrom`으로 fallback할 수 있습니다. Plugin 승인은 `channels.matrix.dm.allowFrom`을 통해 승인됩니다. Matrix를 기본 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. 그렇지 않으면 승인 요청은 다른 구성된 승인 경로 또는 승인 fallback 정책으로 fallback됩니다.

Matrix 기본 라우팅은 두 승인 종류를 모두 지원합니다:

- `channels.matrix.execApprovals.*`는 Matrix 승인 프롬프트의 기본 DM/channel fanout 모드를 제어합니다.
- Exec 승인은 `execApprovals.approvers` 또는 `channels.matrix.dm.allowFrom`의 exec 승인자 집합을 사용합니다.
- Plugin 승인은 `channels.matrix.dm.allowFrom`의 Matrix DM allowlist를 사용합니다.
- Matrix 반응 단축키와 메시지 업데이트는 exec 승인과 Plugin 승인 모두에 적용됩니다.

전송 규칙:

- `target: "dm"`은 승인 프롬프트를 승인자 DM으로 보냅니다
- `target: "channel"`은 프롬프트를 원래 Matrix room 또는 DM으로 다시 보냅니다
- `target: "both"`는 승인자 DM과 원래 Matrix room 또는 DM 모두로 보냅니다

Matrix 승인 프롬프트는 기본 승인 메시지에 반응 단축키를 시드합니다:

- `✅` = 한 번 허용
- `❌` = 거부
- `♾️` = 유효 exec 정책에서 해당 결정이 허용될 때 항상 허용

승인자는 해당 메시지에 반응하거나 fallback 슬래시 명령 `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`를 사용할 수 있습니다.

해석된 승인자만 승인 또는 거부할 수 있습니다. Exec 승인의 경우 channel 전송에는 명령 텍스트가 포함되므로, 신뢰할 수 있는 room에서만 `channel` 또는 `both`를 활성화하세요.

계정별 재정의:

- `channels.matrix.accounts.<account>.execApprovals`

관련 문서: [Exec approvals](/ko/tools/exec-approvals)

## 슬래시 명령

Matrix 슬래시 명령(예: `/new`, `/reset`, `/model`)은 DM에서 직접 작동합니다. Room에서는 OpenClaw가 bot 자신의 Matrix 멘션이 앞에 붙은 슬래시 명령도 인식하므로, `@bot:server /new`는 사용자 지정 멘션 regex 없이도 명령 경로를 트리거합니다. 이렇게 하면 사용자가 명령을 입력하기 전에 bot을 탭 완성했을 때 Element 및 유사한 클라이언트가 생성하는 room 스타일 `@mention /command` 게시물에도 bot이 응답할 수 있습니다.

권한 부여 규칙은 계속 적용됩니다. 명령 발신자는 일반 메시지와 마찬가지로 DM 또는 room allowlist/owner 정책을 충족해야 합니다.

## 다중 계정

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

최상위 `channels.matrix` 값은 계정이 이를 재정의하지 않는 한 이름 있는 계정의 기본값으로 동작합니다.
상속된 room 항목은 `groups.<room>.account`로 하나의 Matrix 계정에 범위를 지정할 수 있습니다.
`account`가 없는 항목은 모든 Matrix 계정에서 공유되며, `account: "default"`가 있는 항목도 기본 계정이 최상위 `channels.matrix.*`에 직접 구성된 경우 계속 작동합니다.
부분 공유 인증 기본값만으로는 별도의 암시적 기본 계정이 생성되지 않습니다. OpenClaw는 해당 기본값에 새 인증 정보(`homeserver` + `accessToken`, 또는 `homeserver` + `userId` + `password`)가 있을 때만 최상위 `default` 계정을 합성합니다. 이름 있는 계정은 나중에 캐시된 자격 증명이 인증 요구를 충족하면 `homeserver` + `userId`만으로도 계속 검색 가능할 수 있습니다.
Matrix에 이미 이름 있는 계정이 정확히 하나 있거나 `defaultAccount`가 기존 이름 있는 계정 키를 가리키는 경우, 단일 계정에서 다중 계정으로의 복구/설정 승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 보존합니다. Matrix 인증/부트스트랩 키만 이 승격된 계정으로 이동하며, 공유 전송 정책 키는 최상위에 유지됩니다.
OpenClaw가 암시적 라우팅, 프로빙, CLI 작업에 대해 특정 이름 있는 Matrix 계정을 우선 사용하게 하려면 `defaultAccount`를 설정하세요.
여러 Matrix 계정이 구성되어 있고 계정 ID 중 하나가 `default`라면, `defaultAccount`가 설정되지 않았더라도 OpenClaw는 해당 계정을 암시적으로 사용합니다.
여러 이름 있는 계정을 구성한 경우 `defaultAccount`를 설정하거나 암시적 계정 선택에 의존하는 CLI 명령에 `--account <id>`를 전달하세요.
한 명령에 대해 그 암시적 선택을 재정의하려면 `openclaw matrix verify ...` 및 `openclaw matrix devices ...`에 `--account <id>`를 전달하세요.

공유 다중 계정 패턴은 [Configuration reference](/ko/gateway/configuration-reference#multi-account-all-channels)를 참조하세요.

## 비공개/LAN 홈서버

기본적으로 OpenClaw는 SSRF 보호를 위해 비공개/내부 Matrix 홈서버를 차단하며,
계정별로 명시적으로 opt-in한 경우에만 허용합니다.

홈서버가 localhost, LAN/Tailscale IP, 또는 내부 호스트 이름에서 실행 중이라면,
해당 Matrix 계정에 대해 `network.dangerouslyAllowPrivateNetwork`를 활성화하세요:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI 설정 예시:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

이 opt-in은 신뢰할 수 있는 비공개/내부 대상만 허용합니다. `http://matrix.example.org:8008` 같은
공개 평문 홈서버는 계속 차단됩니다. 가능하면 `https://`를 사용하세요.

## Matrix 트래픽 프록시

Matrix 배포에 명시적 outbound HTTP(S) 프록시가 필요하다면 `channels.matrix.proxy`를 설정하세요:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

이름 있는 계정은 `channels.matrix.accounts.<id>.proxy`로 최상위 기본값을 재정의할 수 있습니다.
OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브에 동일한 프록시 설정을 사용합니다.

## 대상 해석

Matrix는 OpenClaw가 room 또는 사용자 대상을 요청하는 모든 곳에서 다음 대상 형식을 허용합니다:

- 사용자: `@user:server`, `user:@user:server`, 또는 `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, 또는 `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, 또는 `matrix:channel:#alias:server`

라이브 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다:

- 사용자 조회는 해당 홈서버의 Matrix 사용자 디렉터리를 조회합니다.
- Room 조회는 명시적인 room ID와 alias를 직접 허용한 다음, 해당 계정의 참여 중인 room 이름 검색으로 fallback합니다.
- 참여 중인 room 이름 조회는 best-effort입니다. room 이름을 ID 또는 alias로 해석할 수 없으면 런타임 allowlist 해석에서 무시됩니다.

## 구성 참조

- `enabled`: 채널을 활성화하거나 비활성화합니다.
- `name`: 계정의 선택적 레이블입니다.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호되는 계정 ID입니다.
- `homeserver`: 홈서버 URL입니다. 예: `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: 이 Matrix 계정이 비공개/내부 홈서버에 연결할 수 있도록 허용합니다. 홈서버가 `localhost`, LAN/Tailscale IP, 또는 `matrix-synapse` 같은 내부 호스트로 해석될 때 활성화하세요.
- `proxy`: Matrix 트래픽용 선택적 HTTP(S) 프록시 URL입니다. 이름 있는 계정은 자체 `proxy`로 최상위 기본값을 재정의할 수 있습니다.
- `userId`: 전체 Matrix 사용자 ID입니다. 예: `@bot:example.org`.
- `accessToken`: 토큰 기반 인증용 액세스 토큰입니다. `channels.matrix.accessToken` 및 `channels.matrix.accounts.<id>.accessToken`에 대해 env/file/exec provider 전반에서 일반 텍스트 값과 SecretRef 값이 지원됩니다. [Secrets Management](/ko/gateway/secrets)를 참조하세요.
- `password`: 비밀번호 기반 로그인용 비밀번호입니다. 일반 텍스트 값과 SecretRef 값이 지원됩니다.
- `deviceId`: 명시적인 Matrix 장치 ID입니다.
- `deviceName`: 비밀번호 로그인용 장치 표시 이름입니다.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트를 위해 저장된 self-avatar URL입니다.
- `initialSyncLimit`: 시작 sync 중 가져오는 최대 event 수입니다.
- `encryption`: E2EE를 활성화합니다.
- `allowlistOnly`: `true`일 때 `open` room 정책을 `allowlist`로 업그레이드하고, `disabled`를 제외한 모든 활성 DM 정책(`pairing`과 `open` 포함)을 `allowlist`로 강제합니다. `disabled` 정책에는 영향을 주지 않습니다.
- `allowBots`: 다른 구성된 OpenClaw Matrix 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, 또는 `disabled`.
- `contextVisibility`: 보조 room 컨텍스트 가시성 모드(`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: room 트래픽용 사용자 ID allowlist입니다. 전체 Matrix 사용자 ID가 가장 안전합니다. 정확한 디렉터리 일치는 시작 시와 모니터 실행 중 allowlist가 변경될 때 해석됩니다. 해석되지 않은 이름은 무시됩니다.
- `historyLimit`: 그룹 기록 컨텍스트로 포함할 최대 room 메시지 수입니다. `messages.groupChat.historyLimit`로 fallback되며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`을 설정하세요.
- `replyToMode`: `off`, `first`, `all`, 또는 `batched`.
- `markdown`: outbound Matrix 텍스트용 선택적 Markdown 렌더링 구성입니다.
- `streaming`: `off`(기본값), `"partial"`, `"quiet"`, `true`, 또는 `false`. `"partial"` 및 `true`는 일반 Matrix 텍스트 메시지로 미리보기 우선 초안 업데이트를 활성화합니다. `"quiet"`는 자체 호스팅 push-rule 설정을 위한 비알림 미리보기 notice를 사용합니다. `false`는 `"off"`와 동일합니다.
- `blockStreaming`: `true`는 초안 미리보기 스트리밍이 활성화된 동안 완료된 assistant block에 대해 별도의 진행 메시지를 활성화합니다.
- `threadReplies`: `off`, `inbound`, 또는 `always`.
- `threadBindings`: thread-bound session 라우팅 및 수명 주기에 대한 채널별 재정의입니다.
- `startupVerification`: 시작 시 자동 self-verification 요청 모드(`if-unverified`, `off`).
- `startupVerificationCooldownHours`: 자동 시작 확인 요청을 재시도하기 전 cooldown 시간입니다.
- `textChunkLimit`: 문자 단위 outbound 메시지 청크 크기입니다(`chunkMode`가 `length`일 때 적용).
- `chunkMode`: `length`는 문자 수로 메시지를 분할하고, `newline`은 줄 경계에서 분할합니다.
- `responsePrefix`: 이 채널의 모든 outbound 응답 앞에 붙는 선택적 문자열입니다.
- `ackReaction`: 이 채널/계정용 선택적 ack 반응 재정의입니다.
- `ackReactionScope`: 선택적 ack 반응 범위 재정의입니다(`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: inbound 반응 알림 모드입니다(`own`, `off`).
- `mediaMaxMb`: outbound 전송 및 inbound 미디어 처리용 미디어 크기 제한(MB)입니다.
- `autoJoin`: 초대 자동 참여 정책입니다(`always`, `allowlist`, `off`). 기본값: `off`. DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `allowlist`일 때 허용되는 room/alias입니다. alias 항목은 초대 처리 중 room ID로 해석되며, OpenClaw는 초대된 room이 주장하는 alias 상태를 신뢰하지 않습니다.
- `dm`: DM 정책 블록입니다(`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw가 room에 참여하고 이를 DM으로 분류한 뒤의 DM 접근을 제어합니다. 초대 자동 참여 여부는 바꾸지 않습니다.
- `dm.allowFrom`: DM 트래픽용 사용자 ID allowlist입니다. 전체 Matrix 사용자 ID가 가장 안전합니다. 정확한 디렉터리 일치는 시작 시와 모니터 실행 중 allowlist가 변경될 때 해석됩니다. 해석되지 않은 이름은 무시됩니다.
- `dm.sessionScope`: `per-user`(기본값) 또는 `per-room`. peer가 같더라도 각 Matrix DM room이 별도의 컨텍스트를 유지하게 하려면 `per-room`을 사용하세요.
- `dm.threadReplies`: DM 전용 thread 정책 재정의입니다(`off`, `inbound`, `always`). DM에서 응답 배치와 session 분리 모두에 대해 최상위 `threadReplies` 설정을 재정의합니다.
- `execApprovals`: Matrix 기본 exec 승인 전송입니다(`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID입니다. `dm.allowFrom`이 이미 승인자를 식별하는 경우 선택 사항입니다.
- `execApprovals.target`: `dm | channel | both`(기본값: `dm`).
- `accounts`: 이름 있는 계정별 재정의입니다. 최상위 `channels.matrix` 값은 이 항목들의 기본값으로 동작합니다.
- `groups`: room별 정책 맵입니다. room ID 또는 alias를 권장합니다. 해석되지 않은 room 이름은 런타임에 무시됩니다. session/group ID는 해석 후 안정적인 room ID를 사용합니다.
- `groups.<room>.account`: 다중 계정 설정에서 상속된 하나의 room 항목을 특정 Matrix 계정으로 제한합니다.
- `groups.<room>.allowBots`: 구성된 bot 발신자에 대한 room 수준 재정의입니다(`true` 또는 `"mentions"`).
- `groups.<room>.users`: room별 발신자 allowlist입니다.
- `groups.<room>.tools`: room별 tool 허용/거부 재정의입니다.
- `groups.<room>.autoReply`: room 수준 멘션 게이팅 재정의입니다. `true`는 해당 room의 멘션 요구를 비활성화하고, `false`는 다시 강제 적용합니다.
- `groups.<room>.skills`: 선택적 room 수준 Skills 필터입니다.
- `groups.<room>.systemPrompt`: 선택적 room 수준 system prompt 스니펫입니다.
- `rooms`: `groups`의 레거시 alias입니다.
- `actions`: 액션별 tool 게이팅입니다(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## 관련

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 pairing 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 session 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
