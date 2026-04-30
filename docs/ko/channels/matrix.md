---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 검증 구성
summary: Matrix 지원 상태, 설정 및 구성 예시
title: Matrix
x-i18n:
    generated_at: "2026-04-30T06:18:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix는 OpenClaw용 번들 채널 Plugin입니다.
공식 `matrix-js-sdk`를 사용하며 DM, 방, 스레드, 미디어, 반응, 투표, 위치, E2EE를 지원합니다.

## 번들 Plugin

현재 패키징된 OpenClaw 릴리스에는 Matrix Plugin이 기본 포함되어 있습니다. 별도로 설치할 필요가 없으며, `channels.matrix.*`를 구성하면([설정](#setup) 참조) 활성화됩니다.

Matrix를 제외한 이전 빌드나 사용자 지정 설치의 경우, 게시된 현재 npm
패키지를 설치하세요.

```bash
openclaw plugins install @openclaw/matrix
```

npm이 OpenClaw 소유 패키지를 deprecated로 보고하면, 더 최신 npm 패키지가 게시될 때까지 현재 패키징된
OpenClaw 빌드나 로컬 체크아웃을 사용하세요.

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`은 Plugin을 등록하고 활성화하므로 별도의 `openclaw plugins enable matrix` 단계가 필요하지 않습니다. 아래 채널을 구성하기 전까지 Plugin은 아무 작업도 하지 않습니다. 일반적인 Plugin 동작과 설치 규칙은 [Plugin](/ko/tools/plugin)을 참조하세요.

## 설정

1. 홈서버에 Matrix 계정을 만듭니다.
2. `homeserver` + `accessToken` 또는 `homeserver` + `userId` + `password`로 `channels.matrix`를 구성합니다.
3. Gateway를 다시 시작합니다.
4. 봇과 DM을 시작하거나 방에 초대합니다([자동 참가](#auto-join) 참조 — 새 초대는 `autoJoin`이 허용할 때만 처리됩니다).

### 대화형 설정

```bash
openclaw channels add
openclaw configure --section channels
```

마법사는 홈서버 URL, 인증 방식(액세스 토큰 또는 비밀번호), 사용자 ID(비밀번호 인증에서만), 선택적 기기 이름, E2EE 활성화 여부, 방 접근 및 자동 참가 구성 여부를 묻습니다.

일치하는 `MATRIX_*` 환경 변수가 이미 있고 선택한 계정에 저장된 인증 정보가 없으면, 마법사가 환경 변수 바로 가기를 제공합니다. 허용 목록을 저장하기 전에 방 이름을 확인하려면 `openclaw channels resolve --channel matrix "Project Room"`을 실행하세요. E2EE가 활성화되어 있으면, 마법사는 구성을 작성하고 [`openclaw matrix encryption setup`](#encryption-and-verification)과 동일한 부트스트랩을 실행합니다.

### 최소 구성

토큰 기반:

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

비밀번호 기반(첫 로그인 후 토큰이 캐시됨):

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

### 자동 참가

`channels.matrix.autoJoin`의 기본값은 `off`입니다. 기본값에서는 수동으로 참가하기 전까지 새 초대에서 온 새 방이나 DM에 봇이 나타나지 않습니다.

OpenClaw는 초대 시점에 초대된 방이 DM인지 그룹인지 알 수 없으므로, DM 형태의 초대를 포함한 모든 초대는 먼저 `autoJoin`을 거칩니다. `dm.policy`는 나중에 봇이 참가하고 방이 분류된 뒤에만 적용됩니다.

<Warning>
봇이 수락할 초대를 제한하려면 `autoJoin: "allowlist"`와 `autoJoinAllowlist`를 설정하고, 모든 초대를 수락하려면 `autoJoin: "always"`를 설정하세요.

`autoJoinAllowlist`는 안정적인 대상만 허용합니다: `!roomId:server`, `#alias:server`, 또는 `*`. 일반 방 이름은 거부됩니다. 별칭 항목은 초대된 방이 주장하는 상태가 아니라 홈서버를 기준으로 확인됩니다.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

모든 초대를 수락하려면 `autoJoin: "always"`를 사용하세요.

### 허용 목록 대상 형식

DM 및 방 허용 목록은 안정적인 ID로 채우는 것이 가장 좋습니다.

- DM(`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server`를 사용합니다. 표시 이름은 홈서버 디렉터리가 정확히 하나의 일치 항목을 반환할 때만 확인됩니다.
- 방(`groups`, `autoJoinAllowlist`): `!room:server` 또는 `#alias:server`를 사용합니다. 이름은 참가한 방을 기준으로 최선 노력 방식으로 확인되며, 확인되지 않은 항목은 런타임에 무시됩니다.

### 계정 ID 정규화

마법사는 친숙한 이름을 정규화된 계정 ID로 변환합니다. 예를 들어 `Ops Bot`은 `ops-bot`이 됩니다. 두 계정이 충돌하지 않도록 범위가 지정된 환경 변수 이름에서는 문장 부호가 이스케이프됩니다. `-` → `_X2D_`이므로 `ops-prod`는 `MATRIX_OPS_X2D_PROD_*`에 매핑됩니다.

### 캐시된 인증 정보

Matrix는 캐시된 인증 정보를 `~/.openclaw/credentials/matrix/` 아래에 저장합니다.

- 기본 계정: `credentials.json`
- 명명된 계정: `credentials-<account>.json`

캐시된 인증 정보가 그곳에 있으면, 액세스 토큰이 구성 파일에 없더라도 OpenClaw는 Matrix가 구성된 것으로 간주합니다. 이는 설정, `openclaw doctor`, 채널 상태 프로브에 적용됩니다.

### 환경 변수

동등한 구성 키가 설정되지 않은 경우 사용됩니다. 기본 계정은 접두사가 없는 이름을 사용하고, 명명된 계정은 접미사 앞에 계정 ID를 삽입합니다.

| 기본 계정              | 명명된 계정(`<ID>`는 정규화된 계정 ID) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

계정 `ops`의 경우 이름은 `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` 등으로 바뀝니다. 복구 키 환경 변수는 `--recovery-key-stdin`으로 키를 파이프할 때 복구 인식 CLI 흐름(`verify backup restore`, `verify device`, `verify bootstrap`)에서 읽습니다.

`MATRIX_HOMESERVER`는 작업 영역 `.env`에서 설정할 수 없습니다. [작업 영역 `.env` 파일](/ko/gateway/security)을 참조하세요.

## 구성 예시

DM 페어링, 방 허용 목록, E2EE를 포함한 실용적인 기준 구성:

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
        "!roomid:example.org": { requireMention: true },
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

## 스트리밍 미리보기

Matrix 응답 스트리밍은 명시적으로 켜야 합니다. `streaming`은 OpenClaw가 진행 중인 어시스턴트 응답을 전달하는 방식을 제어하고, `blockStreaming`은 완료된 각 블록을 고유한 Matrix 메시지로 보존할지 제어합니다.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

실시간 답변 미리보기는 유지하되 중간 도구/진행률 줄을 숨기려면 객체
형식을 사용하세요.

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | 동작                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`(기본값) | 전체 응답을 기다린 뒤 한 번 전송합니다. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | 모델이 현재 블록을 작성하는 동안 일반 텍스트 메시지 하나를 제자리에서 수정합니다. 기본 Matrix 클라이언트는 최종 수정이 아니라 첫 미리보기에서 알림을 보낼 수 있습니다.              |
| `"quiet"`         | `"partial"`와 같지만 메시지가 알림 없는 공지입니다. 수신자는 사용자별 푸시 규칙이 확정된 수정과 일치할 때만 알림을 받습니다(아래 참조). |

`blockStreaming`은 `streaming`과 독립적입니다.

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`(기본값)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 현재 블록의 실시간 초안, 완료된 블록은 메시지로 유지 | 현재 블록의 실시간 초안, 제자리에서 확정 |
| `"off"`                 | 완료된 블록마다 알림이 있는 Matrix 메시지 하나                     | 전체 응답에 대한 알림이 있는 Matrix 메시지 하나      |

참고:

- 미리보기가 Matrix의 이벤트당 크기 제한을 초과하면, OpenClaw는 미리보기 스트리밍을 중단하고 최종본만 전달하는 방식으로 대체합니다.
- 미디어 응답은 항상 첨부 파일을 정상적으로 보냅니다. 오래된 미리보기를 더 이상 안전하게 재사용할 수 없으면, OpenClaw는 최종 미디어 응답을 보내기 전에 이를 삭제 처리합니다.
- Matrix 미리보기 스트리밍이 활성화되면 도구 진행률 미리보기 업데이트가 기본적으로 활성화됩니다. 답변 텍스트에 대한 미리보기 수정은 유지하되 도구 진행률은 일반 전달 경로에 남기려면 `streaming.preview.toolProgress: false`를 설정하세요.
- 미리보기 수정은 추가 Matrix API 호출 비용이 듭니다. 가장 보수적인 속도 제한 프로필을 원하면 `streaming: "off"`를 유지하세요.

## 승인 메타데이터

Matrix 네이티브 승인 프롬프트는 `com.openclaw.approval` 아래에 OpenClaw 전용 사용자 지정 이벤트 콘텐츠가 있는 일반 `m.room.message` 이벤트입니다. Matrix는 사용자 지정 이벤트 콘텐츠 키를 허용하므로, 기본 클라이언트는 여전히 텍스트 본문을 렌더링하고 OpenClaw 인식 클라이언트는 구조화된 승인 ID, 종류, 상태, 사용 가능한 결정, 실행/Plugin 세부 정보를 읽을 수 있습니다.

승인 프롬프트가 하나의 Matrix 이벤트에 담기에는 너무 길면, OpenClaw는 표시되는 텍스트를 청크로 나누고 첫 번째 청크에만 `com.openclaw.approval`을 첨부합니다. 허용/거부 결정에 대한 반응은 해당 첫 이벤트에 바인딩되므로 긴 프롬프트도 단일 이벤트 프롬프트와 동일한 승인 대상을 유지합니다.

### 조용한 확정 미리보기를 위한 자체 호스팅 푸시 규칙

`streaming: "quiet"`는 블록 또는 턴이 확정된 뒤에만 수신자에게 알립니다. 사용자별 푸시 규칙이 확정된 미리보기 마커와 일치해야 합니다. 전체 절차(수신자 토큰, 푸셔 확인, 규칙 설치, 홈서버별 참고 사항)는 [조용한 미리보기를 위한 Matrix 푸시 규칙](/ko/channels/matrix-push-rules)을 참조하세요.

## 봇 간 방

기본적으로 구성된 다른 OpenClaw Matrix 계정에서 온 Matrix 메시지는 무시됩니다.

의도적으로 에이전트 간 Matrix 트래픽을 허용하려는 경우 `allowBots`를 사용하세요.

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

- `allowBots: true`는 허용된 방과 DM에서 구성된 다른 Matrix 봇 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`는 방에서 이 봇을 눈에 보이게 멘션할 때만 해당 메시지를 수락합니다. DM은 계속 허용됩니다.
- `groups.<room>.allowBots`는 방 하나에 대해 계정 수준 설정을 재정의합니다.
- OpenClaw는 자체 응답 루프를 피하기 위해 동일한 Matrix 사용자 ID에서 온 메시지는 계속 무시합니다.
- Matrix는 여기서 네이티브 봇 플래그를 노출하지 않습니다. OpenClaw는 "봇 작성"을 "이 OpenClaw Gateway에 구성된 다른 Matrix 계정이 보낸 것"으로 취급합니다.

공유 방에서 봇 간 트래픽을 활성화할 때는 엄격한 방 허용 목록과 멘션 요구 사항을 사용하세요.

## 암호화 및 확인

암호화된(E2EE) 방에서 아웃바운드 이미지 이벤트는 `thumbnail_file`을 사용하므로 이미지 미리보기가 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 방은 여전히 일반 `thumbnail_url`을 사용합니다. 구성이 필요 없습니다. Plugin이 E2EE 상태를 자동으로 감지합니다.

모든 `openclaw matrix` 명령은 `--verbose`(전체 진단), `--json`(기계가 읽을 수 있는 출력), `--account <id>`(다중 계정 설정)를 허용합니다. 출력은 기본적으로 간결하며 내부 SDK 로깅은 조용합니다. 아래 예시는 표준 형식을 보여 줍니다. 필요에 따라 플래그를 추가하세요.

### 암호화 활성화

```bash
openclaw matrix encryption setup
```

비밀 저장소와 교차 서명을 부트스트랩하고, 필요한 경우 방 키 백업을 만든 다음 상태와 다음 단계를 출력합니다. 유용한 플래그:

- `--recovery-key <key>` 부트스트랩하기 전에 복구 키를 적용합니다(아래에 문서화된 stdin 형식 권장)
- `--force-reset-cross-signing` 현재 교차 서명 ID를 폐기하고 새 ID를 만듭니다(의도한 경우에만 사용)

새 계정의 경우 생성 시 E2EE를 활성화하세요.

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`은 `--enable-e2ee`의 별칭입니다.

수동 구성에 해당하는 예:

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

### 상태 및 신뢰 신호

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status`는 세 가지 독립적인 신뢰 신호를 보고합니다(`--verbose`는 모두 표시).

- `Locally trusted`: 이 클라이언트에서만 신뢰됨
- `Cross-signing verified`: SDK가 교차 서명을 통한 검증을 보고함
- `Signed by owner`: 자체 self-signing 키로 서명됨(진단 전용)

`Verified by owner`는 `Cross-signing verified`가 `yes`일 때만 `yes`가 됩니다. 로컬 신뢰 또는 소유자 서명만으로는 충분하지 않습니다.

`--allow-degraded-local-state`는 먼저 Matrix 계정을 준비하지 않고 최선형 진단을 반환합니다. 오프라인 또는 부분적으로 구성된 프로브에 유용합니다.

### 복구 키로 이 기기 검증

복구 키는 민감합니다. 명령줄에 전달하는 대신 stdin으로 파이프하세요. `MATRIX_RECOVERY_KEY`(또는 이름이 지정된 계정의 경우 `MATRIX_<ID>_RECOVERY_KEY`)를 설정합니다.

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

명령은 세 가지 상태를 보고합니다.

- `Recovery key accepted`: Matrix가 비밀 저장소 또는 기기 신뢰에 키를 허용했습니다.
- `Backup usable`: 신뢰할 수 있는 복구 자료로 방 키 백업을 로드할 수 있습니다.
- `Device verified by owner`: 이 기기는 완전한 Matrix 교차 서명 ID 신뢰를 갖습니다.

복구 키가 백업 자료를 잠금 해제했더라도 전체 ID 신뢰가 완료되지 않으면 0이 아닌 코드로 종료됩니다. 이 경우 다른 Matrix 클라이언트에서 자체 검증을 완료하세요.

```bash
openclaw matrix verify self
```

`verify self`는 성공적으로 종료하기 전에 `Cross-signing verified: yes`를 기다립니다. 대기 시간을 조정하려면 `--timeout-ms <ms>`를 사용하세요.

리터럴 키 형식인 `openclaw matrix verify device "<recovery-key>"`도 허용되지만, 키가 셸 기록에 남습니다.

### 교차 서명 부트스트랩 또는 복구

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`은 암호화된 계정의 복구 및 설정 명령입니다. 순서대로 다음을 수행합니다.

- 가능한 경우 기존 복구 키를 재사용하여 비밀 저장소를 부트스트랩합니다.
- 교차 서명을 부트스트랩하고 누락된 공개 키를 업로드합니다.
- 현재 기기를 표시하고 교차 서명합니다.
- 아직 없는 경우 서버 측 방 키 백업을 만듭니다.

homeserver가 교차 서명 키 업로드에 UIA를 요구하면 OpenClaw는 먼저 무인증을 시도한 다음 `m.login.dummy`, 그다음 `m.login.password`를 시도합니다(`channels.matrix.password` 필요).

유용한 플래그:

- `--recovery-key-stdin`(`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`와 함께 사용) 또는 `--recovery-key <key>`
- 현재 교차 서명 ID를 폐기하는 `--force-reset-cross-signing`(의도한 경우에만 사용)

### 방 키 백업

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`는 서버 측 백업이 있는지와 이 기기가 이를 복호화할 수 있는지를 표시합니다. `backup restore`는 백업된 방 키를 로컬 암호화 저장소로 가져옵니다. 복구 키가 이미 디스크에 있으면 `--recovery-key-stdin`을 생략할 수 있습니다.

손상된 백업을 새로운 기준선으로 교체하려면(복구할 수 없는 이전 기록 손실을 허용하며, 현재 백업 비밀을 로드할 수 없는 경우 비밀 저장소도 다시 만들 수 있음):

```bash
openclaw matrix verify backup reset --yes
```

이전 복구 키가 새 백업 기준선을 더 이상 잠금 해제하지 못하게 하려는 의도가 있을 때만 `--rotate-recovery-key`를 추가하세요.

### 검증 나열, 요청 및 응답

```bash
openclaw matrix verify list
```

선택한 계정의 대기 중인 검증 요청을 나열합니다.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

이 OpenClaw 계정에서 검증 요청을 보냅니다. `--own-user`는 자체 검증을 요청합니다(같은 사용자의 다른 Matrix 클라이언트에서 프롬프트를 수락). `--user-id`/`--device-id`/`--room-id`는 다른 사용자를 대상으로 합니다. `--own-user`는 다른 대상 지정 플래그와 함께 사용할 수 없습니다.

더 낮은 수준의 수명 주기 처리에서는, 일반적으로 다른 클라이언트에서 들어오는 요청을 따라가는 동안, 이러한 명령이 특정 요청 `<id>`(`verify list` 및 `verify request`가 출력)에 작동합니다.

| 명령                                       | 목적                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 들어오는 요청 수락                                                   |
| `openclaw matrix verify start <id>`        | SAS 흐름 시작                                                        |
| `openclaw matrix verify sas <id>`          | SAS 이모지 또는 십진수 출력                                          |
| `openclaw matrix verify confirm-sas <id>`  | SAS가 다른 클라이언트가 표시하는 내용과 일치함을 확인                |
| `openclaw matrix verify mismatch-sas <id>` | 이모지 또는 십진수가 일치하지 않을 때 SAS 거부                       |
| `openclaw matrix verify cancel <id>`       | 취소합니다. 선택적 `--reason <text>` 및 `--code <matrix-code>` 사용 가능 |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, `cancel`은 모두 검증이 특정 direct-message 방에 고정된 경우 DM 후속 힌트로 `--user-id`와 `--room-id`를 허용합니다.

### 다중 계정 참고

`--account <id>`가 없으면 Matrix CLI 명령은 암시적 기본 계정을 사용합니다. 이름이 지정된 계정이 여러 개 있고 `channels.matrix.defaultAccount`를 설정하지 않은 경우, 추측하지 않고 선택을 요청합니다. 이름이 지정된 계정에서 E2EE가 비활성화되어 있거나 사용할 수 없는 경우 오류는 해당 계정의 구성 키를 가리킵니다. 예: `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true`인 경우 `startupVerification`의 기본값은 `"if-unverified"`입니다. 시작 시 검증되지 않은 기기는 다른 Matrix 클라이언트에서 자체 검증을 요청하며, 중복을 건너뛰고 쿨다운(기본 24시간)을 적용합니다. `startupVerificationCooldownHours`로 조정하거나 `startupVerification: "off"`로 비활성화하세요.

    시작 시 현재 비밀 저장소와 교차 서명 ID를 재사용하는 보수적인 암호화 부트스트랩 패스도 실행됩니다. 부트스트랩 상태가 손상된 경우 OpenClaw는 `channels.matrix.password` 없이도 보호된 복구를 시도합니다. homeserver가 비밀번호 UIA를 요구하면 시작 로그에 경고를 남기고 치명적 오류로 처리하지 않습니다. 이미 소유자 서명된 기기는 보존됩니다.

    전체 업그레이드 흐름은 [Matrix 마이그레이션](/ko/channels/matrix-migration)을 참조하세요.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix는 엄격한 DM 검증 방에 검증 수명 주기 알림을 `m.notice` 메시지로 게시합니다. 요청, 준비("Verify by emoji" 안내 포함), 시작/완료, 사용 가능한 경우 SAS(이모지/십진수) 세부 정보가 포함됩니다.

    다른 Matrix 클라이언트에서 들어오는 요청은 추적되고 자동 수락됩니다. 자체 검증의 경우 OpenClaw는 SAS 흐름을 자동으로 시작하고 이모지 검증을 사용할 수 있게 되면 자체 측을 확인합니다. 그래도 Matrix 클라이언트에서 비교하고 "They match"를 확인해야 합니다.

    검증 시스템 알림은 에이전트 채팅 파이프라인으로 전달되지 않습니다.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status`가 현재 기기가 homeserver에 더 이상 나열되지 않는다고 표시하면 새 OpenClaw Matrix 기기를 만드세요. 비밀번호 로그인의 경우:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    토큰 인증의 경우 Matrix 클라이언트 또는 관리자 UI에서 새 액세스 토큰을 만든 다음 OpenClaw를 업데이트하세요.

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    실패한 명령의 계정 ID로 `assistant`를 바꾸거나, 기본 계정의 경우 `--account`를 생략하세요.

  </Accordion>

  <Accordion title="Device hygiene">
    OpenClaw가 관리하는 오래된 기기가 누적될 수 있습니다. 나열하고 정리하세요.

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE는 IndexedDB shim으로 `fake-indexeddb`를 사용하는 공식 `matrix-js-sdk` Rust 암호화 경로를 사용합니다. 암호화 상태는 `crypto-idb-snapshot.json`에 유지됩니다(제한적인 파일 권한).

    암호화된 런타임 상태는 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 아래에 있으며 sync store, crypto store, 복구 키, IDB 스냅샷, 스레드 바인딩, 시작 검증 상태를 포함합니다. 토큰이 변경되어도 계정 ID가 동일하게 유지되면 OpenClaw는 가장 적합한 기존 루트를 재사용하여 이전 상태가 계속 표시되도록 합니다.

  </Accordion>
</AccordionGroup>

## 프로필 관리

선택한 계정의 Matrix 자체 프로필을 업데이트합니다.

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

두 옵션을 한 번의 호출에 모두 전달할 수 있습니다. Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://` 또는 `https://`를 전달하면 OpenClaw가 먼저 파일을 업로드하고 확인된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 계정별 override)에 저장합니다.

## 스레드

Matrix는 자동 응답과 메시지 도구 전송 모두에 대해 네이티브 Matrix 스레드를 지원합니다. 두 개의 독립적인 노브가 동작을 제어합니다.

### 세션 라우팅(`sessionScope`)

`dm.sessionScope`는 Matrix DM 방이 OpenClaw 세션에 매핑되는 방식을 결정합니다.

- `"per-user"`(기본값): 라우팅된 피어가 같은 모든 DM 방은 하나의 세션을 공유합니다.
- `"per-room"`: 피어가 같더라도 각 Matrix DM 방이 고유한 세션 키를 가집니다.

명시적 대화 바인딩은 항상 `sessionScope`보다 우선하므로, 바인딩된 방과 스레드는 선택된 대상 세션을 유지합니다.

### 응답 스레딩(`threadReplies`)

`threadReplies`는 bot이 응답을 게시할 위치를 결정합니다.

- `"off"`: 응답은 최상위 수준입니다. 들어오는 스레드 메시지는 부모 세션에 유지됩니다.
- `"inbound"`: 들어오는 메시지가 이미 해당 스레드에 있었을 때만 스레드 안에서 응답합니다.
- `"always"`: 트리거 메시지를 루트로 하는 스레드 안에서 응답합니다. 해당 대화는 첫 트리거부터 일치하는 스레드 범위 세션을 통해 라우팅됩니다.

`dm.threadReplies`는 DM에 대해서만 이를 override합니다. 예를 들어, 방 스레드는 격리된 상태로 유지하면서 DM은 평면으로 유지할 수 있습니다.

### 스레드 상속 및 슬래시 명령

- 인바운드 스레드 메시지는 스레드 루트 메시지를 추가 에이전트 컨텍스트로 포함합니다.
- 메시지 도구 전송은 명시적인 `threadId`가 제공되지 않는 한, 같은 방(또는 같은 DM 사용자 대상)을 대상으로 할 때 현재 Matrix 스레드를 자동으로 상속합니다.
- DM 사용자 대상 재사용은 현재 세션 메타데이터가 같은 Matrix 계정의 같은 DM 상대임을 증명할 때만 적용됩니다. 그렇지 않으면 OpenClaw는 일반 사용자 범위 라우팅으로 폴백합니다.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 스레드 바인딩 `/acp spawn`은 모두 Matrix 방과 DM에서 작동합니다.
- 최상위 `/focus`는 `threadBindings.spawnSubagentSessions: true`일 때 새 Matrix 스레드를 만들고 대상 세션에 바인딩합니다.
- 기존 Matrix 스레드 안에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 해당 스레드를 제자리에서 바인딩합니다.

OpenClaw가 같은 공유 세션에서 다른 DM 방과 충돌하는 Matrix DM 방을 감지하면, 해당 방에 일회성 `m.notice`를 게시하여 `/focus` 탈출 경로를 안내하고 `dm.sessionScope` 변경을 제안합니다. 이 알림은 스레드 바인딩이 활성화된 경우에만 표시됩니다.

## ACP 대화 바인딩

Matrix 방, DM, 기존 Matrix 스레드는 채팅 표면을 바꾸지 않고도 지속되는 ACP 작업 공간으로 전환할 수 있습니다.

빠른 운영자 흐름:

- 계속 사용하려는 Matrix DM, 방 또는 기존 스레드 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 최상위 Matrix DM 또는 방에서는 현재 DM/방이 채팅 표면으로 유지되고 이후 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- 기존 Matrix 스레드 안에서는 `--bind here`가 현재 스레드를 제자리에서 바인딩합니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

참고:

- `--bind here`는 하위 Matrix 스레드를 만들지 않습니다.
- `threadBindings.spawnAcpSessions`는 `/acp spawn --thread auto|here`에만 필요합니다. 이 경우 OpenClaw가 하위 Matrix 스레드를 만들거나 바인딩해야 합니다.

### 스레드 바인딩 설정

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며, 채널별 재정의도 지원합니다.

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix 스레드 바인딩 생성 플래그는 옵트인입니다.

- 최상위 `/focus`가 새 Matrix 스레드를 만들고 바인딩할 수 있게 하려면 `threadBindings.spawnSubagentSessions: true`를 설정합니다.
- `/acp spawn --thread auto|here`가 ACP 세션을 Matrix 스레드에 바인딩할 수 있게 하려면 `threadBindings.spawnAcpSessions: true`를 설정합니다.

## 반응

Matrix는 아웃바운드 반응, 인바운드 반응 알림, ack 반응을 지원합니다.

아웃바운드 반응 도구는 `channels.matrix.actions.reactions`로 제어됩니다.

- `react`는 Matrix 이벤트에 반응을 추가합니다.
- `reactions`는 Matrix 이벤트의 현재 반응 요약을 나열합니다.
- `emoji=""`는 해당 이벤트에서 봇 자신의 반응을 제거합니다.
- `remove: true`는 봇에서 지정된 이모지 반응만 제거합니다.

**해결 순서**(처음 정의된 값이 적용됨):

| 설정                    | 순서                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 계정별 → 채널 → `messages.ackReaction` → 에이전트 정체성 이모지 폴백             |
| `ackReactionScope`      | 계정별 → 채널 → `messages.ackReactionScope` → 기본값 `"group-mentions"`          |
| `reactionNotifications` | 계정별 → 채널 → 기본값 `"own"`                                                   |

`reactionNotifications: "own"`은 봇이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` 이벤트를 전달합니다. `"off"`는 반응 시스템 이벤트를 비활성화합니다. 반응 제거는 독립적인 `m.reaction` 제거가 아니라 삭제 이벤트로 Matrix에 표시되므로 시스템 이벤트로 합성되지 않습니다.

## 기록 컨텍스트

- `channels.matrix.historyLimit`는 Matrix 방 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함되는 최근 방 메시지 수를 제어합니다. `messages.groupChat.historyLimit`로 폴백합니다. 둘 다 설정되지 않은 경우 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정합니다.
- Matrix 방 기록은 방에만 적용됩니다. DM은 일반 세션 기록을 계속 사용합니다.
- Matrix 방 기록은 대기 중 메시지만 대상으로 합니다. OpenClaw는 아직 응답을 트리거하지 않은 방 메시지를 버퍼링한 다음, 멘션이나 다른 트리거가 도착하면 해당 창을 스냅샷합니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않습니다. 해당 턴의 기본 인바운드 본문에 유지됩니다.
- 같은 Matrix 이벤트의 재시도는 더 최신 방 메시지로 밀려나지 않고 원래 기록 스냅샷을 재사용합니다.

## 컨텍스트 가시성

Matrix는 가져온 답글 텍스트, 스레드 루트, 대기 중 기록 같은 보조 방 컨텍스트에 대해 공유 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보조 컨텍스트는 수신된 그대로 유지됩니다.
- `contextVisibility: "allowlist"`는 활성 방/사용자 allowlist 검사에서 허용된 발신자만 보내도록 보조 컨텍스트를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 명시적으로 인용된 답글 하나는 계속 유지합니다.

이 설정은 보조 컨텍스트 가시성에 영향을 주며, 인바운드 메시지 자체가 응답을 트리거할 수 있는지 여부에는 영향을 주지 않습니다.
트리거 권한 부여는 여전히 `groupPolicy`, `groups`, `groupAllowFrom`, DM 정책 설정에서 결정됩니다.

## DM 및 방 정책

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

방은 계속 작동하게 두면서 DM을 완전히 조용히 하려면 `dm.enabled: false`를 설정합니다.

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

멘션 게이팅 및 allowlist 동작은 [그룹](/ko/channels/groups)을 참조하세요.

Matrix DM 페어링 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면, OpenClaw는 새 코드를 만들지 않고 같은 대기 중 페어링 코드를 재사용하며 짧은 쿨다운 후 알림 답장을 보낼 수 있습니다.

공유 DM 페어링 흐름과 저장소 레이아웃은 [페어링](/ko/channels/pairing)을 참조하세요.

## 직접 방 복구

직접 메시지 상태가 동기화에서 벗어나면, OpenClaw에 라이브 DM이 아니라 오래된 단독 방을 가리키는 낡은 `m.direct` 매핑이 남을 수 있습니다. 상대에 대한 현재 매핑을 검사합니다.

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

복구합니다.

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

두 명령 모두 다중 계정 설정에서 `--account <id>`를 받습니다. 복구 흐름은 다음과 같습니다.

- 이미 `m.direct`에 매핑된 엄격한 1:1 DM을 우선 사용합니다.
- 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 폴백합니다.
- 정상적인 DM이 없으면 새 직접 방을 만들고 `m.direct`를 다시 씁니다.

이 작업은 오래된 방을 자동으로 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑을 업데이트하여 이후 Matrix 전송, 확인 알림 및 기타 직접 메시지 흐름이 올바른 방을 대상으로 하게 합니다.

## Exec 승인

Matrix는 네이티브 승인 클라이언트로 동작할 수 있습니다. `channels.matrix.execApprovals` 아래에서 설정합니다(계정별 재정의는 `channels.matrix.accounts.<account>.execApprovals`).

- `enabled`: Matrix 네이티브 프롬프트를 통해 승인을 전달합니다. 설정되지 않았거나 `"auto"`이면, 하나 이상의 승인자를 확인할 수 있을 때 Matrix가 자동으로 활성화됩니다. 명시적으로 비활성화하려면 `false`로 설정합니다.
- `approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID(`@owner:example.org`)입니다. 선택 사항이며 `channels.matrix.dm.allowFrom`으로 폴백합니다.
- `target`: 프롬프트가 전송될 위치입니다. `"dm"`(기본값)은 승인자 DM으로 보내고, `"channel"`은 원래 Matrix 방 또는 DM으로 보내며, `"both"`는 둘 다로 보냅니다.
- `agentFilter` / `sessionFilter`: Matrix 전달을 트리거할 에이전트/세션에 대한 선택적 allowlist입니다.

권한 부여는 승인 종류에 따라 약간 다릅니다.

- **Exec 승인**은 `execApprovals.approvers`를 사용하며, `dm.allowFrom`으로 폴백합니다.
- **Plugin 승인**은 `dm.allowFrom`을 통해서만 권한을 부여합니다.

두 종류 모두 Matrix 반응 바로가기와 메시지 업데이트를 공유합니다. 승인자는 기본 승인 메시지에서 반응 바로가기를 볼 수 있습니다.

- `✅` 한 번 허용
- `❌` 거부
- `♾️` 항상 허용(유효 exec 정책이 허용하는 경우)

폴백 슬래시 명령: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

확인된 승인자만 승인하거나 거부할 수 있습니다. exec 승인의 채널 전달에는 명령 텍스트가 포함됩니다. 신뢰할 수 있는 방에서만 `channel` 또는 `both`를 활성화하세요.

관련 항목: [Exec 승인](/ko/tools/exec-approvals).

## 슬래시 명령

슬래시 명령(`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` 등)은 DM에서 직접 작동합니다. 방에서는 OpenClaw가 봇 자신의 Matrix 멘션이 앞에 붙은 명령도 인식하므로, `@bot:server /new`는 사용자 지정 멘션 정규식 없이 명령 경로를 트리거합니다. 이를 통해 사용자가 명령을 입력하기 전에 봇을 탭 완성할 때 Element 및 유사 클라이언트가 내보내는 방 스타일 `@mention /command` 게시물에 봇이 반응할 수 있습니다.

권한 부여 규칙은 계속 적용됩니다. 명령 발신자는 일반 메시지와 같은 DM 또는 방 allowlist/소유자 정책을 충족해야 합니다.

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

**상속:**

- 최상위 `channels.matrix` 값은 계정이 이를 재정의하지 않는 한 이름 있는 계정의 기본값으로 동작합니다.
- `groups.<room>.account`를 사용해 상속된 방 항목의 범위를 특정 계정으로 제한합니다. `account`가 없는 항목은 계정 간에 공유됩니다. 기본 계정이 최상위 수준에 설정된 경우에도 `account: "default"`는 계속 작동합니다.

**기본 계정 선택:**

- 암시적 라우팅, 프로빙, CLI 명령이 선호할 이름 있는 계정을 선택하려면 `defaultAccount`를 설정합니다.
- 계정이 여러 개이고 그중 하나의 이름이 문자 그대로 `default`이면, `defaultAccount`가 설정되지 않아도 OpenClaw가 이를 암시적으로 사용합니다.
- 이름 있는 계정이 여러 개이고 기본값이 선택되지 않은 경우 CLI 명령은 추측을 거부합니다. `defaultAccount`를 설정하거나 `--account <id>`를 전달하세요.
- 최상위 `channels.matrix.*` 블록은 인증이 완료된 경우(`homeserver` + `accessToken`, 또는 `homeserver` + `userId` + `password`)에만 암시적 `default` 계정으로 취급됩니다. 이름 있는 계정은 캐시된 자격 증명이 인증을 보완하면 `homeserver` + `userId`만으로도 계속 발견될 수 있습니다.

**승격:**

- OpenClaw가 복구 또는 설정 중 단일 계정 설정을 다중 계정으로 승격할 때, 기존 이름 있는 계정이 있거나 `defaultAccount`가 이미 계정을 가리키는 경우 이를 보존합니다. Matrix 인증/부트스트랩 키만 승격된 계정으로 이동하며, 공유 전달 정책 키는 최상위 수준에 남습니다.

공유 다중 계정 패턴은 [설정 참조](/ko/gateway/config-channels#multi-account-all-channels)를 참조하세요.

## 비공개/LAN 홈서버

기본적으로 OpenClaw는 SSRF 보호를 위해 계정별로 명시적으로 옵트인하지 않는 한 비공개/내부 Matrix 홈서버를 차단합니다.

홈서버가 localhost, LAN/Tailscale IP 또는 내부 호스트 이름에서 실행되는 경우 해당 Matrix 계정에 대해 `network.dangerouslyAllowPrivateNetwork`를 활성화하세요.

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

이 명시적 허용은 신뢰할 수 있는 비공개/내부 대상만 허용합니다. `http://matrix.example.org:8008` 같은 공개 평문 홈서버는 계속 차단됩니다. 가능하면 항상 `https://`를 선호하세요.

## Matrix 트래픽 프록시 처리

Matrix 배포에 명시적 아웃바운드 HTTP(S) 프록시가 필요하면 `channels.matrix.proxy`를 설정하세요.

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

명명된 계정은 `channels.matrix.accounts.<id>.proxy`로 최상위 기본값을 재정의할 수 있습니다.
OpenClaw는 런타임 Matrix 트래픽과 계정 상태 확인에 동일한 프록시 설정을 사용합니다.

## 대상 해석

Matrix는 OpenClaw가 방 또는 사용자 대상을 요청하는 모든 위치에서 다음 대상 형식을 허용합니다.

- 사용자: `@user:server`, `user:@user:server` 또는 `matrix:user:@user:server`
- 방: `!room:server`, `room:!room:server` 또는 `matrix:room:!room:server`
- 별칭: `#alias:server`, `channel:#alias:server` 또는 `matrix:channel:#alias:server`

Matrix 방 ID는 대소문자를 구분합니다. 명시적 전달 대상, Cron 작업, 바인딩 또는 허용 목록을 구성할 때 Matrix의 정확한 방 ID 대소문자를 사용하세요. OpenClaw는 저장을 위해 내부 세션 키를 정규화하므로, 해당 소문자 키는 Matrix 전달 ID의 신뢰할 수 있는 출처가 아닙니다.

실시간 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다.

- 사용자 조회는 해당 홈서버의 Matrix 사용자 디렉터리를 쿼리합니다.
- 방 조회는 명시적 방 ID와 별칭을 직접 허용한 다음, 해당 계정이 참여한 방 이름 검색으로 폴백합니다.
- 참여한 방 이름 조회는 최선형입니다. 방 이름을 ID 또는 별칭으로 해석할 수 없으면 런타임 허용 목록 해석에서 무시됩니다.

## 구성 참조

허용 목록 방식 필드(`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`)는 전체 Matrix 사용자 ID를 허용합니다(가장 안전함). 정확한 디렉터리 일치는 시작 시와 모니터가 실행 중일 때 허용 목록이 변경될 때마다 해석되며, 해석할 수 없는 항목은 런타임에 무시됩니다. 방 허용 목록도 같은 이유로 방 ID 또는 별칭을 선호합니다.

### 계정 및 연결

- `enabled`: 채널을 활성화하거나 비활성화합니다.
- `name`: 계정의 선택적 표시 레이블입니다.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호하는 계정 ID입니다.
- `accounts`: 명명된 계정별 재정의입니다. 최상위 `channels.matrix` 값은 기본값으로 상속됩니다.
- `homeserver`: 홈서버 URL입니다. 예: `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: 이 계정이 `localhost`, LAN/Tailscale IP 또는 내부 호스트 이름에 연결하도록 허용합니다.
- `proxy`: Matrix 트래픽용 선택적 HTTP(S) 프록시 URL입니다. 계정별 재정의를 지원합니다.
- `userId`: 전체 Matrix 사용자 ID입니다(`@bot:example.org`).
- `accessToken`: 토큰 기반 인증용 액세스 토큰입니다. 평문 및 SecretRef 값은 env/file/exec 제공자 전반에서 지원됩니다([비밀 관리](/ko/gateway/secrets)).
- `password`: 비밀번호 기반 로그인용 비밀번호입니다. 평문 및 SecretRef 값이 지원됩니다.
- `deviceId`: 명시적 Matrix 장치 ID입니다.
- `deviceName`: 비밀번호 로그인 시 사용되는 장치 표시 이름입니다.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트에 사용되는 저장된 자기 아바타 URL입니다.
- `initialSyncLimit`: 시작 동기화 중 가져오는 최대 이벤트 수입니다.

### 암호화

- `encryption`: E2EE를 활성화합니다. 기본값: `false`.
- `startupVerification`: `"if-unverified"`(E2EE가 켜져 있을 때 기본값) 또는 `"off"`입니다. 이 장치가 확인되지 않은 경우 시작 시 자기 확인을 자동 요청합니다.
- `startupVerificationCooldownHours`: 다음 자동 시작 요청 전 대기 시간입니다. 기본값: `24`.

### 접근 및 정책

- `groupPolicy`: `"open"`, `"allowlist"` 또는 `"disabled"`입니다. 기본값: `"allowlist"`.
- `groupAllowFrom`: 방 트래픽에 대한 사용자 ID 허용 목록입니다.
- `dm.enabled`: `false`이면 모든 DM을 무시합니다. 기본값: `true`.
- `dm.policy`: `"pairing"`(기본값), `"allowlist"`, `"open"` 또는 `"disabled"`입니다. 봇이 방에 참여하고 방을 DM으로 분류한 후 적용됩니다. 초대 처리에는 영향을 주지 않습니다.
- `dm.allowFrom`: DM 트래픽에 대한 사용자 ID 허용 목록입니다.
- `dm.sessionScope`: `"per-user"`(기본값) 또는 `"per-room"`입니다.
- `dm.threadReplies`: 답장 스레딩에 대한 DM 전용 재정의입니다(`"off"`, `"inbound"`, `"always"`).
- `allowBots`: 구성된 다른 Matrix 봇 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `allowlistOnly`: `true`이면 모든 활성 DM 정책(`"disabled"` 제외)과 `"open"` 그룹 정책을 `"allowlist"`로 강제합니다. `"disabled"` 정책은 변경하지 않습니다.
- `autoJoin`: `"always"`, `"allowlist"` 또는 `"off"`입니다. 기본값: `"off"`. DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `"allowlist"`일 때 허용되는 방/별칭입니다. 별칭 항목은 초대된 방이 주장하는 상태가 아니라 홈서버를 기준으로 해석됩니다.
- `contextVisibility`: 보조 컨텍스트 표시 여부입니다(`"all"` 기본값, `"allowlist"`, `"allowlist_quote"`).

### 답장 동작

- `replyToMode`: `"off"`, `"first"`, `"all"` 또는 `"batched"`입니다.
- `threadReplies`: `"off"`, `"inbound"` 또는 `"always"`입니다.
- `threadBindings`: 스레드에 바인딩된 세션 라우팅 및 수명 주기에 대한 채널별 재정의입니다.
- `streaming`: `"off"`(기본값), `"partial"`, `"quiet"` 또는 객체 형식 `{ mode, preview: { toolProgress } }`입니다. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true`이면 완료된 어시스턴트 블록을 별도의 진행 메시지로 유지합니다.
- `markdown`: 아웃바운드 텍스트용 선택적 Markdown 렌더링 구성입니다.
- `responsePrefix`: 아웃바운드 답장 앞에 붙일 선택적 문자열입니다.
- `textChunkLimit`: `chunkMode: "length"`일 때 문자 단위 아웃바운드 청크 크기입니다. 기본값: `4000`.
- `chunkMode`: `"length"`(기본값, 문자 수 기준 분할) 또는 `"newline"`(줄 경계에서 분할)입니다.
- `historyLimit`: 방 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함되는 최근 방 메시지 수입니다. `messages.groupChat.historyLimit`로 폴백하며, 유효 기본값은 `0`(비활성화)입니다.
- `mediaMaxMb`: 아웃바운드 전송 및 인바운드 처리에 대한 MB 단위 미디어 크기 상한입니다.

### 반응 설정

- `ackReaction`: 이 채널/계정에 대한 확인 반응 재정의입니다.
- `ackReactionScope`: 범위 재정의입니다(`"group-mentions"` 기본값, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: 인바운드 반응 알림 모드입니다(`"own"` 기본값, `"off"`).

### 도구 및 방별 재정의

- `actions`: 작업별 도구 게이팅입니다(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: 방별 정책 맵입니다. 세션 ID는 해석 후 안정적인 방 ID를 사용합니다. (`rooms`는 레거시 별칭입니다.)
  - `groups.<room>.account`: 상속된 방 항목 하나를 특정 계정으로 제한합니다.
  - `groups.<room>.allowBots`: 채널 수준 설정의 방별 재정의입니다(`true` 또는 `"mentions"`).
  - `groups.<room>.users`: 방별 발신자 허용 목록입니다.
  - `groups.<room>.tools`: 방별 도구 허용/거부 재정의입니다.
  - `groups.<room>.autoReply`: 방별 멘션 게이팅 재정의입니다. `true`는 해당 방의 멘션 요구 사항을 비활성화하고, `false`는 다시 강제합니다.
  - `groups.<room>.skills`: 방별 Skills 필터입니다.
  - `groups.<room>.systemPrompt`: 방별 시스템 프롬프트 조각입니다.

### Exec 승인 설정

- `execApprovals.enabled`: Matrix 네이티브 프롬프트를 통해 exec 승인을 전달합니다.
- `execApprovals.approvers`: 승인할 수 있는 Matrix 사용자 ID입니다. `dm.allowFrom`으로 폴백합니다.
- `execApprovals.target`: `"dm"`(기본값), `"channel"` 또는 `"both"`입니다.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 전달을 위한 선택적 에이전트/세션 허용 목록입니다.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
