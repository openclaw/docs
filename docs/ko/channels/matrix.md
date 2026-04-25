---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 검증 구성하기
summary: Matrix 지원 상태, 설정, 및 구성 예제
title: Matrix
x-i18n:
    generated_at: "2026-04-25T05:56:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix는 OpenClaw용 번들 채널 plugin입니다.
공식 `matrix-js-sdk`를 사용하며 DM, room, thread, 미디어, 반응, 투표, 위치, E2EE를 지원합니다.

## 번들 plugin

Matrix는 현재 OpenClaw 릴리스에 번들 plugin으로 포함되어 있으므로, 일반 패키지형 빌드에서는 별도 설치가 필요하지 않습니다.

오래된 빌드 또는 Matrix가 제외된 사용자 지정 설치를 사용하는 경우에는 수동으로 설치하세요.

npm에서 설치:

```bash
openclaw plugins install @openclaw/matrix
```

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

plugin 동작 및 설치 규칙은 [Plugins](/ko/tools/plugin)를 참고하세요.

## 설정

1. Matrix plugin을 사용할 수 있는지 확인하세요.
   - 현재 패키지형 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 오래된/사용자 지정 설치는 위 명령으로 수동 추가할 수 있습니다.
2. homeserver에서 Matrix 계정을 만드세요.
3. `channels.matrix`를 다음 중 하나로 구성하세요.
   - `homeserver` + `accessToken`, 또는
   - `homeserver` + `userId` + `password`.
4. gateway를 재시작하세요.
5. 봇과 DM을 시작하거나 room에 초대하세요.
   - 새 Matrix 초대는 `channels.matrix.autoJoin`이 허용할 때만 동작합니다.

대화형 설정 경로:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 마법사는 다음을 묻습니다.

- homeserver URL
- 인증 방식: access token 또는 password
- 사용자 ID(password 인증만)
- 선택적 device 이름
- E2EE 활성화 여부
- room 접근 및 초대 자동 참여 구성 여부

마법사의 주요 동작:

- Matrix 인증 env var가 이미 존재하고 해당 계정에 config에 저장된 인증 정보가 아직 없다면, 마법사는 인증 정보를 env var에 유지하는 env 단축 경로를 제공합니다.
- 계정 이름은 계정 ID로 정규화됩니다. 예를 들어 `Ops Bot`은 `ops-bot`이 됩니다.
- DM allowlist 항목은 `@user:server`를 직접 받을 수 있습니다. 표시 이름은 실시간 디렉터리 조회에서 정확히 하나의 일치 항목을 찾는 경우에만 동작합니다.
- Room allowlist 항목은 room ID와 alias를 직접 받을 수 있습니다. `!room:server` 또는 `#alias:server`를 권장합니다. 확인되지 않은 이름은 allowlist 확인 시 런타임에서 무시됩니다.
- 초대 자동 참여 allowlist 모드에서는 안정적인 초대 대상만 사용하세요: `!roomId:server`, `#alias:server`, 또는 `*`. 일반 room 이름은 거부됩니다.
- 저장 전에 room 이름을 확인하려면 `openclaw channels resolve --channel matrix "Project Room"`을 사용하세요.

<Warning>
`channels.matrix.autoJoin`의 기본값은 `off`입니다.

이 값을 설정하지 않으면 봇은 초대된 room이나 새 DM 스타일 초대에 참여하지 않으므로, 먼저 수동으로 참여하지 않는 한 새 그룹이나 초대된 DM에 나타나지 않습니다.

수락할 초대를 제한하려면 `autoJoin: "allowlist"`를 `autoJoinAllowlist`와 함께 설정하거나, 모든 초대에 참여하게 하려면 `autoJoin: "always"`를 설정하세요.

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
현재 인증 정보가 config에 직접 설정되어 있지 않더라도, 여기에 캐시된 자격 증명이 있으면 OpenClaw는 setup, doctor, channel-status 검색에서 Matrix를 구성된 것으로 간주합니다.

환경 변수 대응 항목(config 키가 설정되지 않았을 때 사용):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

기본이 아닌 계정의 경우 계정 범위 env var를 사용하세요.

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

계정 `ops`의 예시:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

정규화된 계정 ID `ops-bot`의 경우 다음을 사용하세요.

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix는 계정 ID의 구두점을 이스케이프하여 계정 범위 env var의 충돌을 방지합니다.
예를 들어 `-`는 `_X2D_`가 되므로 `ops-prod`는 `MATRIX_OPS_X2D_PROD_*`에 매핑됩니다.

대화형 마법사는 해당 인증 env var가 이미 존재하고 선택한 계정에 Matrix 인증이 config에 아직 저장되어 있지 않을 때만 env-var 단축 경로를 제공합니다.

`MATRIX_HOMESERVER`는 워크스페이스 `.env`에서 설정할 수 없습니다. [Workspace `.env` files](/ko/gateway/security)를 참고하세요.

## 구성 예제

다음은 DM 페어링, room allowlist, E2EE 활성화를 포함한 실용적인 기본 구성입니다.

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

`autoJoin`은 DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다. OpenClaw는 초대 시점에 초대된 room이 DM인지 그룹인지 신뢰성 있게 분류할 수 없으므로, 모든 초대는 먼저 `autoJoin`을 거칩니다. `dm.policy`는 봇이 참여한 뒤 room이 DM으로 분류된 후에 적용됩니다.

## 스트리밍 미리보기

Matrix 응답 스트리밍은 opt-in입니다.

OpenClaw가 하나의 실시간 미리보기 응답을 보내고, 모델이 텍스트를 생성하는 동안 해당 미리보기를 제자리에서 편집하고, 응답이 완료되면 마무리하도록 하려면 `channels.matrix.streaming`을 `"partial"`로 설정하세요.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`가 기본값입니다. OpenClaw는 최종 응답을 기다렸다가 한 번만 보냅니다.
- `streaming: "partial"`은 현재 assistant 블록에 대해 일반 Matrix 텍스트 메시지를 사용해 편집 가능한 미리보기 메시지 하나를 생성합니다. 이는 Matrix의 기존 미리보기 우선 알림 동작을 유지하므로, 기본 클라이언트는 완료된 블록이 아니라 첫 번째 스트리밍 미리보기 텍스트에 대해 알림을 보낼 수 있습니다.
- `streaming: "quiet"`은 현재 assistant 블록에 대해 편집 가능한 조용한 미리보기 notice 하나를 생성합니다. 최종 확정된 미리보기 편집에 대해 수신자 push rule도 구성한 경우에만 이를 사용하세요.
- `blockStreaming: true`는 별도의 Matrix 진행 상황 메시지를 활성화합니다. 미리보기 스트리밍이 활성화된 경우, Matrix는 현재 블록의 실시간 초안을 유지하고 완료된 블록은 별도의 메시지로 보존합니다.
- 미리보기 스트리밍이 켜져 있고 `blockStreaming`이 꺼져 있으면, Matrix는 실시간 초안을 제자리에서 편집하고 블록 또는 턴이 끝날 때 동일한 event를 확정합니다.
- 미리보기가 더 이상 하나의 Matrix event에 맞지 않으면, OpenClaw는 미리보기 스트리밍을 중단하고 일반 최종 전달로 대체합니다.
- 미디어 응답은 여전히 첨부 파일을 정상적으로 보냅니다. 오래된 미리보기를 더 이상 안전하게 재사용할 수 없으면, OpenClaw는 최종 미디어 응답을 보내기 전에 이를 redaction합니다.
- 미리보기 편집에는 추가 Matrix API 호출 비용이 듭니다. 가장 보수적인 rate-limit 동작을 원하면 스트리밍을 끄세요.

`blockStreaming`만으로는 초안 미리보기가 활성화되지 않습니다.
미리보기 편집에는 `streaming: "partial"` 또는 `streaming: "quiet"`을 사용하고, 완료된 assistant 블록도 별도 진행 상황 메시지로 남기고 싶을 때만 `blockStreaming: true`를 추가하세요.

사용자 지정 push rule 없이 기본 Matrix 알림이 필요하다면, 미리보기 우선 동작에는 `streaming: "partial"`을 사용하거나 최종본만 전달하려면 `streaming`을 끄세요. `streaming: "off"`일 때:

- `blockStreaming: true`는 완료된 각 블록을 일반 알림 Matrix 메시지로 보냅니다.
- `blockStreaming: false`는 최종 완료 응답만 일반 알림 Matrix 메시지로 보냅니다.

### 조용한 최종 확정 미리보기를 위한 자체 호스팅 push rule

조용한 스트리밍(`streaming: "quiet"`)은 블록 또는 턴이 최종 확정되었을 때만 수신자에게 알립니다. 사용자별 push rule이 최종 확정된 미리보기 마커와 일치해야 합니다. 전체 설정(수신자 토큰, pusher 확인, rule 설치, homeserver별 참고사항)은 [Matrix push rules for quiet previews](/ko/channels/matrix-push-rules)를 참고하세요.

## 봇 대 봇 room

기본적으로 다른 구성된 OpenClaw Matrix 계정에서 온 Matrix 메시지는 무시됩니다.

의도적으로 에이전트 간 Matrix 트래픽을 허용하려면 `allowBots`를 사용하세요.

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

- `allowBots: true`는 허용된 room 및 DM에서 다른 구성된 Matrix 봇 계정의 메시지를 허용합니다.
- `allowBots: "mentions"`는 room에서 해당 봇이 명시적으로 멘션된 경우에만 그 메시지를 허용합니다. DM은 여전히 허용됩니다.
- `groups.<room>.allowBots`는 하나의 room에 대해 계정 수준 설정을 재정의합니다.
- OpenClaw는 자기 응답 루프를 방지하기 위해 동일한 Matrix 사용자 ID의 메시지는 계속 무시합니다.
- Matrix는 여기서 네이티브 봇 플래그를 노출하지 않습니다. OpenClaw는 "봇이 작성한" 것을 "이 OpenClaw gateway에서 구성된 다른 Matrix 계정이 보낸 것"으로 간주합니다.

공유 room에서 봇 간 트래픽을 활성화할 때는 엄격한 room allowlist와 멘션 요구 사항을 사용하세요.

## 암호화 및 검증

암호화된(E2EE) room에서는 아웃바운드 이미지 event가 `thumbnail_file`을 사용하므로 이미지 미리보기도 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 room은 계속 일반 `thumbnail_url`을 사용합니다. 별도 구성은 필요하지 않습니다. plugin이 E2EE 상태를 자동으로 감지합니다.

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

검증 명령(모두 진단용 `--verbose`와 기계 판독 가능한 출력용 `--json` 지원):

```bash
openclaw matrix verify status
```

상세 상태(전체 진단):

```bash
openclaw matrix verify status --verbose
```

저장된 복구 키를 기계 판독 가능한 출력에 포함:

```bash
openclaw matrix verify status --include-recovery-key --json
```

교차 서명 및 검증 상태 부트스트랩:

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

복구 키로 이 device 검증:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

이 명령은 세 가지 별도 상태를 보고합니다.

- `Recovery key accepted`: Matrix가 비밀 저장소 또는 device 신뢰를 위해 복구 키를 수락했습니다.
- `Backup usable`: 신뢰할 수 있는 복구 자료로 room-key 백업을 로드할 수 있습니다.
- `Device verified by owner`: 현재 OpenClaw device가 완전한 Matrix 교차 서명 ID 신뢰를 가집니다.

상세 출력 또는 JSON 출력의 `Signed by owner`는 진단용일 뿐입니다. OpenClaw는 `Cross-signing verified`도 `yes`가 아닌 한 이를 충분한 것으로 간주하지 않습니다.

복구 키가 백업 자료를 잠금 해제할 수 있더라도, 완전한 Matrix ID 신뢰가 완료되지 않았으면 이 명령은 여전히 0이 아닌 종료 코드를 반환합니다. 이 경우 다른 Matrix 클라이언트에서 자기 검증을 완료하세요:

```bash
openclaw matrix verify self
```

다른 Matrix 클라이언트에서 요청을 수락하고, SAS 이모지 또는 숫자를 비교한 다음, 일치할 때만 `yes`를 입력하세요. 이 명령은 Matrix가 `Cross-signing verified: yes`를 보고할 때까지 대기한 후 성공적으로 종료됩니다.

현재 교차 서명 ID를 의도적으로 교체하려는 경우에만 `verify bootstrap --force-reset-cross-signing`을 사용하세요.

상세 device 검증 정보:

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

대화형 자기 검증 흐름:

```bash
openclaw matrix verify self
```

더 낮은 수준의 검증 요청 또는 인바운드 검증 요청에는 다음을 사용하세요.

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

요청을 취소하려면 `openclaw matrix verify cancel <id>`를 사용하세요.

상세 복원 진단:

```bash
openclaw matrix verify backup restore --verbose
```

현재 서버 백업을 삭제하고 새로운 백업 기준 상태를 만드세요. 저장된 백업 키를 정상적으로 로드할 수 없는 경우, 이 재설정은 secret storage도 다시 생성하여 이후 콜드 스타트에서 새 백업 키를 로드할 수 있게 할 수 있습니다.

```bash
openclaw matrix verify backup reset --yes
```

모든 `verify` 명령은 기본적으로 간결한 출력만 표시하며(내부 SDK의 조용한 로깅 포함), 자세한 진단은 `--verbose`일 때만 표시합니다.
스크립트에서 사용할 때는 전체 기계 판독 가능 출력을 위해 `--json`을 사용하세요.

다중 계정 설정에서 Matrix CLI 명령은 `--account <id>`를 전달하지 않으면 암묵적인 Matrix 기본 계정을 사용합니다.
이름이 지정된 계정을 여러 개 구성한 경우에는 먼저 `channels.matrix.defaultAccount`를 설정하세요. 그렇지 않으면 이러한 암묵적 CLI 작업은 중단되고 계정을 명시적으로 선택하라고 요청합니다.
검증 또는 device 작업이 특정 이름의 계정을 명시적으로 대상으로 하도록 하려면 언제나 `--account`를 사용하세요.

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

암호화가 비활성화되어 있거나 특정 이름의 계정에서 사용할 수 없는 경우, Matrix 경고와 검증 오류는 해당 계정의 config 키를 가리킵니다. 예: `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="검증됨의 의미">
    OpenClaw는 사용자의 교차 서명 ID가 직접 서명한 경우에만 device를 검증된 것으로 간주합니다. `verify status --verbose`는 세 가지 신뢰 신호를 표시합니다.

    - `Locally trusted`: 이 클라이언트에서만 신뢰됨
    - `Cross-signing verified`: SDK가 교차 서명을 통한 검증을 보고함
    - `Signed by owner`: 사용자의 self-signing 키로 서명됨

    `Verified by owner`는 교차 서명 검증이 있을 때만 `yes`가 됩니다.
    로컬 신뢰 또는 소유자 서명만으로는 OpenClaw가 해당 device를 완전히 검증된 것으로 간주하기에 충분하지 않습니다.

  </Accordion>

  <Accordion title="bootstrap이 수행하는 작업">
    `verify bootstrap`은 암호화된 계정의 복구 및 설정 명령입니다. 순서대로 다음을 수행합니다.

    - 가능하면 기존 복구 키를 재사용하여 secret storage를 부트스트랩
    - 교차 서명을 부트스트랩하고 누락된 공개 교차 서명 키를 업로드
    - 현재 device를 표시하고 교차 서명
    - 서버 측 room-key 백업이 아직 없으면 생성

    homeserver가 교차 서명 키 업로드에 UIA를 요구하는 경우, OpenClaw는 먼저 인증 없음, 다음 `m.login.dummy`, 다음 `m.login.password`(`channels.matrix.password` 필요)를 시도합니다. 현재 ID를 의도적으로 폐기하는 경우에만 `--force-reset-cross-signing`을 사용하세요.

  </Accordion>

  <Accordion title="새 백업 기준 상태">
    향후 암호화된 메시지가 계속 동작하게 유지하면서 복구할 수 없는 오래된 기록 손실을 감수하려면:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    특정 이름의 계정을 대상으로 하려면 `--account <id>`를 추가하세요. 현재 백업 비밀을 안전하게 로드할 수 없는 경우 secret storage도 다시 생성할 수 있습니다.

  </Accordion>

  <Accordion title="시작 동작">
    `encryption: true`일 때 `startupVerification`의 기본값은 `"if-unverified"`입니다. 시작 시 검증되지 않은 device는 다른 Matrix 클라이언트에서 자기 검증을 요청하며, 중복을 건너뛰고 쿨다운을 적용합니다. `startupVerificationCooldownHours`로 조정하거나 `startupVerification: "off"`로 비활성화하세요.

    시작 시 현재 secret storage와 교차 서명 ID를 재사용하는 보수적인 crypto bootstrap 단계도 실행됩니다. bootstrap 상태가 손상된 경우, OpenClaw는 `channels.matrix.password`가 없어도 보호된 복구를 시도합니다. homeserver가 password UIA를 요구하면 시작 시 경고를 기록하고 치명적 오류로 처리하지 않습니다. 이미 owner가 서명한 device는 보존됩니다.

    전체 업그레이드 흐름은 [Matrix migration](/ko/install/migrating-matrix)을 참고하세요.

  </Accordion>

  <Accordion title="검증 알림">
    Matrix는 엄격한 DM 검증 room에 검증 수명 주기 알림을 `m.notice` 메시지로 게시합니다: 요청, 준비("이모지로 검증" 안내 포함), 시작/완료, 그리고 가능한 경우 SAS(이모지/숫자) 세부 정보.

    다른 Matrix 클라이언트에서 들어오는 요청은 추적되며 자동 수락됩니다. 자기 검증의 경우, OpenClaw는 SAS 흐름을 자동으로 시작하고 이모지 검증이 가능해지면 자체 측을 확인합니다. 그래도 사용자는 Matrix 클라이언트에서 비교하고 "일치함"을 확인해야 합니다.

    검증 시스템 notice는 에이전트 채팅 파이프라인으로 전달되지 않습니다.

  </Accordion>

  <Accordion title="device 정리">
    OpenClaw가 관리하는 오래된 device가 누적될 수 있습니다. 목록을 보고 정리하세요.

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto 저장소">
    Matrix E2EE는 공식 `matrix-js-sdk` Rust crypto 경로와 IndexedDB shim으로 `fake-indexeddb`를 사용합니다. crypto 상태는 `crypto-idb-snapshot.json`에 유지됩니다(제한적인 파일 권한).

    암호화된 런타임 상태는 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 아래에 저장되며 sync 저장소, crypto 저장소, 복구 키, IDB 스냅샷, thread 바인딩, 시작 검증 상태를 포함합니다. 토큰이 바뀌더라도 계정 ID가 동일하면 OpenClaw는 가장 적절한 기존 루트를 재사용하여 이전 상태가 계속 보이도록 합니다.

  </Accordion>
</AccordionGroup>

## 프로필 관리

선택한 계정의 Matrix 자기 프로필을 업데이트하려면 다음을 사용하세요.

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

특정 이름의 Matrix 계정을 명시적으로 대상으로 하려면 `--account <id>`를 추가하세요.

Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://` 또는 `https://` 아바타 URL을 전달하면 OpenClaw는 먼저 이를 Matrix에 업로드한 다음, 확인된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 선택한 계정 재정의 값)에 다시 저장합니다.

## Thread

Matrix는 자동 응답과 message-tool 전송 모두에 대해 네이티브 Matrix thread를 지원합니다.

- `dm.sessionScope: "per-user"`(기본값)는 Matrix DM 라우팅을 발신자 범위로 유지하므로, 여러 DM room이 동일한 peer로 확인되면 하나의 세션을 공유할 수 있습니다.
- `dm.sessionScope: "per-room"`은 일반 DM 인증 및 allowlist 확인을 계속 사용하면서 각 Matrix DM room을 자체 세션 키로 격리합니다.
- 명시적인 Matrix 대화 바인딩은 여전히 `dm.sessionScope`보다 우선하므로, 바인딩된 room과 thread는 선택된 대상 세션을 유지합니다.
- `threadReplies: "off"`는 응답을 최상위 수준으로 유지하고 인바운드 thread 메시지를 부모 세션에 유지합니다.
- `threadReplies: "inbound"`는 인바운드 메시지가 이미 해당 thread에 있을 때만 thread 내부에서 응답합니다.
- `threadReplies: "always"`는 room 응답을 트리거 메시지를 루트로 하는 thread에 유지하고, 해당 대화를 첫 번째 트리거 메시지와 일치하는 thread 범위 세션으로 라우팅합니다.
- `dm.threadReplies`는 DM에 대해서만 최상위 설정을 재정의합니다. 예를 들어 room thread는 격리된 상태로 유지하면서 DM은 평면적으로 유지할 수 있습니다.
- 인바운드 thread 메시지에는 thread 루트 메시지가 추가 에이전트 컨텍스트로 포함됩니다.
- message-tool 전송은 대상이 같은 room이거나 같은 DM 사용자 대상이면, 명시적인 `threadId`가 제공되지 않는 한 현재 Matrix thread를 자동 상속합니다.
- 동일 세션 DM 사용자 대상 재사용은 현재 세션 메타데이터가 동일한 Matrix 계정의 동일한 DM peer를 증명할 때만 적용됩니다. 그렇지 않으면 OpenClaw는 일반 사용자 범위 라우팅으로 되돌아갑니다.
- OpenClaw가 같은 공유 Matrix DM 세션에서 Matrix DM room이 다른 DM room과 충돌하는 것을 감지하면, thread 바인딩이 활성화되어 있고 `dm.sessionScope` 힌트가 있을 때 해당 room에 `/focus` 탈출 수단과 함께 1회성 `m.notice`를 게시합니다.
- Matrix는 런타임 thread 바인딩을 지원합니다. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 그리고 thread 바인딩된 `/acp spawn`은 Matrix room과 DM에서 동작합니다.
- 최상위 Matrix room/DM의 `/focus`는 `threadBindings.spawnSubagentSessions=true`일 때 새 Matrix thread를 만들고 이를 대상 세션에 바인딩합니다.
- 기존 Matrix thread 내부에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 대신 현재 thread를 바인딩합니다.

## ACP 대화 바인딩

Matrix room, DM, 기존 Matrix thread를 채팅 표면을 바꾸지 않고 내구성 있는 ACP 작업 공간으로 전환할 수 있습니다.

빠른 운영자 흐름:

- 계속 사용할 Matrix DM, room, 기존 thread 안에서 `/acp spawn codex --bind here`를 실행하세요.
- 최상위 Matrix DM 또는 room에서는 현재 DM/room이 채팅 표면으로 유지되고 이후 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- 기존 Matrix thread 내부에서는 `--bind here`가 현재 thread를 제자리에서 바인딩합니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

참고:

- `--bind here`는 하위 Matrix thread를 만들지 않습니다.
- `threadBindings.spawnAcpSessions`는 `/acp spawn --thread auto|here`에서만 필요하며, 이 경우 OpenClaw가 하위 Matrix thread를 만들거나 바인딩해야 합니다.

### Thread 바인딩 구성

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며, 채널별 재정의도 지원합니다.

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix thread 바인딩된 spawn 플래그는 opt-in입니다.

- 최상위 `/focus`가 새 Matrix thread를 만들고 바인딩하도록 허용하려면 `threadBindings.spawnSubagentSessions: true`를 설정하세요.
- `/acp spawn --thread auto|here`가 ACP 세션을 Matrix thread에 바인딩하도록 허용하려면 `threadBindings.spawnAcpSessions: true`를 설정하세요.

## 반응

Matrix는 아웃바운드 반응 작업, 인바운드 반응 알림, 인바운드 ack 반응을 지원합니다.

- 아웃바운드 반응 도구는 `channels["matrix"].actions.reactions`로 제어됩니다.
- `react`는 특정 Matrix event에 반응을 추가합니다.
- `reactions`는 특정 Matrix event의 현재 반응 요약을 나열합니다.
- `emoji=""`는 해당 event에서 봇 계정 자신의 반응을 제거합니다.
- `remove: true`는 봇 계정의 지정된 이모지 반응만 제거합니다.

ack 반응은 표준 OpenClaw 확인 순서를 사용합니다.

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- 에이전트 ID 이모지 대체값

ack 반응 범위는 다음 순서로 확인됩니다.

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

반응 알림 모드는 다음 순서로 확인됩니다.

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 기본값: `own`

동작:

- `reactionNotifications: "own"`은 봇이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` event를 전달합니다.
- `reactionNotifications: "off"`는 반응 시스템 event를 비활성화합니다.
- 반응 제거는 별도의 `m.reaction` 제거가 아니라 redaction으로 표시되므로 시스템 event로 합성되지 않습니다.

## 히스토리 컨텍스트

- `channels.matrix.historyLimit`는 Matrix room 메시지가 에이전트를 트리거할 때 `InboundHistory`에 포함할 최근 room 메시지 수를 제어합니다. `messages.groupChat.historyLimit`로 대체되며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정하세요.
- Matrix room 히스토리는 room 전용입니다. DM은 계속 일반 세션 히스토리를 사용합니다.
- Matrix room 히스토리는 pending 전용입니다. OpenClaw는 아직 응답을 트리거하지 않은 room 메시지를 버퍼링한 뒤, 멘션 또는 다른 트리거가 도착하면 그 구간을 스냅샷으로 저장합니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않습니다. 해당 턴의 기본 인바운드 본문에 그대로 유지됩니다.
- 동일한 Matrix event의 재시도는 더 새로운 room 메시지로 앞으로 이동하지 않고 원래 히스토리 스냅샷을 재사용합니다.

## 컨텍스트 가시성

Matrix는 가져온 응답 텍스트, thread 루트, pending 히스토리 같은 보조 room 컨텍스트에 대해 공통 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보조 컨텍스트는 수신된 그대로 유지됩니다.
- `contextVisibility: "allowlist"`는 활성 room/사용자 allowlist 검사에서 허용된 발신자로 보조 컨텍스트를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 명시적으로 인용된 응답 하나는 계속 유지합니다.

이 설정은 보조 컨텍스트의 가시성에 영향을 주며, 인바운드 메시지 자체가 응답을 트리거할 수 있는지에는 영향을 주지 않습니다.
트리거 권한은 여전히 `groupPolicy`, `groups`, `groupAllowFrom`, DM 정책 설정에서 결정됩니다.

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

멘션 게이팅 및 allowlist 동작은 [Groups](/ko/channels/groups)를 참고하세요.

Matrix DM용 페어링 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면, OpenClaw는 같은 대기 중 페어링 코드를 재사용하며 새 코드를 발급하는 대신 짧은 쿨다운 후 리마인더 응답을 다시 보낼 수 있습니다.

공통 DM 페어링 흐름 및 저장소 레이아웃은 [Pairing](/ko/channels/pairing)을 참고하세요.

## 직접 room 복구

직접 메시지 상태가 동기화되지 않으면, OpenClaw는 실제 DM 대신 오래된 단독 room을 가리키는 오래된 `m.direct` 매핑을 갖게 될 수 있습니다. 다음으로 peer의 현재 매핑을 검사하세요.

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

다음으로 복구하세요.

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

복구 흐름:

- 이미 `m.direct`에 매핑된 엄격한 1:1 DM을 우선 사용
- 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 대체
- 정상적인 DM이 없으면 새 direct room을 만들고 `m.direct`를 다시 작성

복구 흐름은 오래된 room을 자동으로 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑만 업데이트하여 새 Matrix 전송, 검증 알림, 기타 직접 메시지 흐름이 다시 올바른 room을 대상으로 하도록 합니다.

## Exec 승인

Matrix는 Matrix 계정의 네이티브 승인 클라이언트로 동작할 수 있습니다. 네이티브
DM/채널 라우팅 설정은 여전히 exec 승인 config 아래에 있습니다.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`(선택 사항, `channels.matrix.dm.allowFrom`으로 대체 가능)
- `channels.matrix.execApprovals.target`(`dm` | `channel` | `both`, 기본값: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

승인자는 `@owner:example.org` 같은 Matrix 사용자 ID여야 합니다. `enabled`가 설정되지 않았거나 `"auto"`이고 하나 이상의 승인자를 확인할 수 있으면 Matrix는 네이티브 승인을 자동 활성화합니다. Exec 승인은 먼저 `execApprovals.approvers`를 사용하고 `channels.matrix.dm.allowFrom`으로 대체될 수 있습니다. Plugin 승인은 `channels.matrix.dm.allowFrom`을 통해 승인됩니다. Matrix를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. 그렇지 않으면 승인 요청은 다른 구성된 승인 경로 또는 승인 대체 정책으로 넘어갑니다.

Matrix 네이티브 라우팅은 두 가지 승인 유형을 모두 지원합니다.

- `channels.matrix.execApprovals.*`는 Matrix 승인 프롬프트의 네이티브 DM/채널 팬아웃 모드를 제어합니다.
- Exec 승인은 `execApprovals.approvers` 또는 `channels.matrix.dm.allowFrom`의 exec 승인자 집합을 사용합니다.
- Plugin 승인은 `channels.matrix.dm.allowFrom`의 Matrix DM allowlist를 사용합니다.
- Matrix 반응 단축키와 메시지 업데이트는 exec 승인과 plugin 승인 모두에 적용됩니다.

전달 규칙:

- `target: "dm"`은 승인 프롬프트를 승인자 DM으로 보냅니다.
- `target: "channel"`은 프롬프트를 원래 Matrix room 또는 DM으로 다시 보냅니다.
- `target: "both"`는 승인자 DM과 원래 Matrix room 또는 DM 모두로 보냅니다.

Matrix 승인 프롬프트는 기본 승인 메시지에 반응 단축키를 설정합니다.

- `✅` = 한 번 허용
- `❌` = 거부
- `♾️` = 유효 exec 정책이 해당 결정을 허용할 때 항상 허용

승인자는 해당 메시지에 반응하거나 대체 슬래시 명령 `/approve <id> allow-once`, `/approve <id> allow-always`, 또는 `/approve <id> deny`를 사용할 수 있습니다.

확인된 승인자만 승인 또는 거부할 수 있습니다. exec 승인의 경우 채널 전달에는 명령 텍스트가 포함되므로, `channel` 또는 `both`는 신뢰할 수 있는 room에서만 활성화하세요.

계정별 재정의:

- `channels.matrix.accounts.<account>.execApprovals`

관련 문서: [Exec approvals](/ko/tools/exec-approvals)

## 슬래시 명령

Matrix 슬래시 명령(예: `/new`, `/reset`, `/model`)은 DM에서 직접 동작합니다. Room에서는 OpenClaw가 봇 자신의 Matrix 멘션이 접두된 슬래시 명령도 인식하므로, `@bot:server /new`는 사용자 지정 멘션 정규식 없이도 명령 경로를 트리거합니다. 이렇게 하면 사용자가 명령을 입력하기 전에 탭 자동 완성으로 봇을 먼저 입력할 때 Element 및 유사 클라이언트가 생성하는 room 스타일의 `@mention /command` 게시물에도 봇이 응답성을 유지합니다.

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

최상위 `channels.matrix` 값은 계정에서 재정의하지 않는 한 이름이 지정된 계정의 기본값으로 동작합니다.
상속된 room 항목은 `groups.<room>.account`로 하나의 Matrix 계정에 범위를 지정할 수 있습니다.
`account`가 없는 항목은 모든 Matrix 계정에서 공유되며, `account: "default"`가 있는 항목은 기본 계정이 최상위 `channels.matrix.*`에 직접 구성된 경우에도 계속 동작합니다.
부분적인 공유 인증 기본값만으로는 별도의 암묵적 기본 계정이 생성되지 않습니다. OpenClaw는 해당 기본 계정에 새로운 인증 정보(`homeserver` + `accessToken`, 또는 `homeserver` + `userId` + `password`)가 있을 때만 최상위 `default` 계정을 합성합니다. 이름이 지정된 계정은 이후 캐시된 자격 증명이 인증을 충족할 때 `homeserver` + `userId`만으로도 계속 검색 가능할 수 있습니다.
Matrix에 이미 정확히 하나의 이름 지정 계정이 있거나 `defaultAccount`가 기존 이름 지정 계정 키를 가리키는 경우, 단일 계정에서 다중 계정으로의 복구/설정 승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 보존합니다. Matrix 인증/bootstrap 키만 승격된 계정으로 이동하며, 공유 전달 정책 키는 최상위에 유지됩니다.
암묵적 라우팅, 프로빙, CLI 작업에서 OpenClaw가 하나의 이름 지정 Matrix 계정을 우선 사용하게 하려면 `defaultAccount`를 설정하세요.
여러 Matrix 계정이 구성되어 있고 계정 id 중 하나가 `default`이면, `defaultAccount`가 설정되지 않아도 OpenClaw는 해당 계정을 암묵적으로 사용합니다.
이름이 지정된 계정을 여러 개 구성한 경우, `defaultAccount`를 설정하거나 암묵적 계정 선택에 의존하는 CLI 명령에 `--account <id>`를 전달하세요.
한 명령에 대해 이 암묵적 선택을 재정의하려면 `openclaw matrix verify ...` 및 `openclaw matrix devices ...`에 `--account <id>`를 전달하세요.

공통 다중 계정 패턴은 [Configuration reference](/ko/gateway/config-channels#multi-account-all-channels)를 참고하세요.

## 비공개/LAN homeserver

기본적으로 OpenClaw는 SSRF 보호를 위해 계정별로 명시적 opt-in을 하지 않으면 비공개/내부 Matrix homeserver를 차단합니다.

homeserver가 localhost, LAN/Tailscale IP 또는 내부 호스트명에서 실행되는 경우, 해당 Matrix 계정에 대해
`network.dangerouslyAllowPrivateNetwork`를 활성화하세요.

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

이 opt-in은 신뢰할 수 있는 비공개/내부 대상만 허용합니다. `http://matrix.example.org:8008` 같은 공용 평문 homeserver는 계속 차단됩니다. 가능하면 `https://`를 사용하세요.

## Matrix 트래픽 프록시

Matrix 배포에 명시적인 아웃바운드 HTTP(S) 프록시가 필요하면 `channels.matrix.proxy`를 설정하세요.

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

이름이 지정된 계정은 `channels.matrix.accounts.<id>.proxy`로 최상위 기본값을 재정의할 수 있습니다.
OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브에 동일한 프록시 설정을 사용합니다.

## 대상 확인

OpenClaw가 room 또는 사용자 대상을 요청하는 모든 곳에서 Matrix는 다음 대상 형식을 허용합니다.

- 사용자: `@user:server`, `user:@user:server`, 또는 `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, 또는 `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, 또는 `matrix:channel:#alias:server`

실시간 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다.

- 사용자 조회는 해당 homeserver의 Matrix 사용자 디렉터리를 조회합니다.
- Room 조회는 명시적인 room ID와 alias를 직접 허용한 다음, 해당 계정의 참여 중인 room 이름 검색으로 대체됩니다.
- 참여 중인 room 이름 조회는 최선형입니다. room 이름을 ID 또는 alias로 확인할 수 없으면 런타임 allowlist 확인에서 무시됩니다.

## 구성 참조

- `enabled`: 채널 활성화 또는 비활성화.
- `name`: 계정의 선택적 레이블.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호되는 계정 ID.
- `homeserver`: homeserver URL, 예: `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: 이 Matrix 계정이 비공개/내부 homeserver에 연결되도록 허용합니다. homeserver가 `localhost`, LAN/Tailscale IP 또는 `matrix-synapse` 같은 내부 호스트로 확인될 때 이를 활성화하세요.
- `proxy`: Matrix 트래픽용 선택적 HTTP(S) 프록시 URL. 이름이 지정된 계정은 자체 `proxy`로 최상위 기본값을 재정의할 수 있습니다.
- `userId`: 전체 Matrix 사용자 ID, 예: `@bot:example.org`.
- `accessToken`: 토큰 기반 인증용 access token. 일반 텍스트 값과 SecretRef 값은 env/file/exec provider 전반에서 `channels.matrix.accessToken` 및 `channels.matrix.accounts.<id>.accessToken`에 지원됩니다. [Secrets Management](/ko/gateway/secrets)를 참고하세요.
- `password`: 비밀번호 기반 로그인용 비밀번호. 일반 텍스트 값과 SecretRef 값이 지원됩니다.
- `deviceId`: 명시적인 Matrix device ID.
- `deviceName`: 비밀번호 로그인용 device 표시 이름.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트용으로 저장된 자기 아바타 URL.
- `initialSyncLimit`: 시작 시 sync 중 가져오는 최대 event 수.
- `encryption`: E2EE 활성화.
- `allowlistOnly`: `true`이면 `open` room 정책을 `allowlist`로 승격하고, 활성화된 모든 DM 정책 중 `disabled`를 제외한 정책(`pairing` 및 `open` 포함)을 `allowlist`로 강제합니다. `disabled` 정책에는 영향을 주지 않습니다.
- `allowBots`: 다른 구성된 OpenClaw Matrix 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, 또는 `disabled`.
- `contextVisibility`: 보조 room 컨텍스트 가시성 모드(`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: room 트래픽용 사용자 ID allowlist. 전체 Matrix 사용자 ID가 가장 안전하며, 정확한 디렉터리 일치는 시작 시 및 모니터 실행 중 allowlist가 변경될 때 확인됩니다. 확인되지 않은 이름은 무시됩니다.
- `historyLimit`: 그룹 히스토리 컨텍스트로 포함할 최대 room 메시지 수. `messages.groupChat.historyLimit`로 대체되며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정하세요.
- `replyToMode`: `off`, `first`, `all`, 또는 `batched`.
- `markdown`: 아웃바운드 Matrix 텍스트용 선택적 Markdown 렌더링 구성.
- `streaming`: `off`(기본값), `"partial"`, `"quiet"`, `true`, 또는 `false`. `"partial"`과 `true`는 일반 Matrix 텍스트 메시지로 미리보기 우선 초안 업데이트를 활성화합니다. `"quiet"`은 자체 호스팅 push-rule 설정용 비알림 미리보기 notice를 사용합니다. `false`는 `"off"`와 동일합니다.
- `blockStreaming`: `true`이면 초안 미리보기 스트리밍이 활성화된 동안 완료된 assistant 블록에 대해 별도의 진행 상황 메시지를 활성화합니다.
- `threadReplies`: `off`, `inbound`, 또는 `always`.
- `threadBindings`: thread 바인딩 세션 라우팅 및 수명 주기에 대한 채널별 재정의.
- `startupVerification`: 시작 시 자동 자기 검증 요청 모드(`if-unverified`, `off`).
- `startupVerificationCooldownHours`: 자동 시작 검증 요청을 다시 시도하기 전의 쿨다운.
- `textChunkLimit`: 문자 기준 아웃바운드 메시지 청크 크기(`chunkMode`가 `length`일 때 적용).
- `chunkMode`: `length`는 문자 수 기준으로 메시지를 분할하고, `newline`은 줄 경계에서 분할합니다.
- `responsePrefix`: 이 채널의 모든 아웃바운드 응답 앞에 추가되는 선택적 문자열.
- `ackReaction`: 이 채널/계정용 선택적 ack 반응 재정의.
- `ackReactionScope`: 선택적 ack 반응 범위 재정의(`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: 인바운드 반응 알림 모드(`own`, `off`).
- `mediaMaxMb`: 아웃바운드 전송 및 인바운드 미디어 처리용 미디어 크기 제한(MB).
- `autoJoin`: 초대 자동 참여 정책(`always`, `allowlist`, `off`). 기본값: `off`. DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `allowlist`일 때 허용되는 room/alias. alias 항목은 초대 처리 중 room ID로 확인됩니다. OpenClaw는 초대된 room이 주장하는 alias 상태를 신뢰하지 않습니다.
- `dm`: DM 정책 블록(`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw가 room에 참여하고 이를 DM으로 분류한 후 DM 접근을 제어합니다. 초대를 자동 참여할지 여부는 변경하지 않습니다.
- `dm.allowFrom`: DM 트래픽용 사용자 ID allowlist. 전체 Matrix 사용자 ID가 가장 안전하며, 정확한 디렉터리 일치는 시작 시 및 모니터 실행 중 allowlist가 변경될 때 확인됩니다. 확인되지 않은 이름은 무시됩니다.
- `dm.sessionScope`: `per-user`(기본값) 또는 `per-room`. peer가 같더라도 각 Matrix DM room이 별도 컨텍스트를 유지하게 하려면 `per-room`을 사용하세요.
- `dm.threadReplies`: DM 전용 thread 정책 재정의(`off`, `inbound`, `always`). DM에서 응답 배치와 세션 격리를 위해 최상위 `threadReplies` 설정을 재정의합니다.
- `execApprovals`: Matrix 네이티브 exec 승인 전달(`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID. `dm.allowFrom`이 이미 승인자를 식별하는 경우 선택 사항입니다.
- `execApprovals.target`: `dm | channel | both`(기본값: `dm`).
- `accounts`: 이름이 지정된 계정별 재정의. 최상위 `channels.matrix` 값은 이 항목들의 기본값으로 동작합니다.
- `groups`: room별 정책 맵. room ID 또는 alias를 권장하며, 확인되지 않은 room 이름은 런타임에서 무시됩니다. 세션/그룹 ID는 확인 후 안정적인 room ID를 사용합니다.
- `groups.<room>.account`: 다중 계정 설정에서 상속된 room 항목 하나를 특정 Matrix 계정으로 제한합니다.
- `groups.<room>.allowBots`: 구성된 봇 발신자에 대한 room 수준 재정의(`true` 또는 `"mentions"`).
- `groups.<room>.users`: room별 발신자 allowlist.
- `groups.<room>.tools`: room별 도구 허용/거부 재정의.
- `groups.<room>.autoReply`: room 수준 멘션 게이팅 재정의. `true`는 해당 room의 멘션 요구를 비활성화하고, `false`는 다시 강제 활성화합니다.
- `groups.<room>.skills`: 선택적 room 수준 skill 필터.
- `groups.<room>.systemPrompt`: 선택적 room 수준 system prompt 스니펫.
- `rooms`: `groups`의 레거시 alias.
- `actions`: 작업별 도구 게이팅(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## 관련

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [Security](/ko/gateway/security) — 접근 모델 및 보안 강화
