---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 검증 구성
summary: Matrix 지원 상태, 설정 및 구성 예시
title: Matrix
x-i18n:
    generated_at: "2026-05-02T20:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix는 OpenClaw용으로 다운로드할 수 있는 채널 Plugin입니다.
공식 `matrix-js-sdk`를 사용하며 DM, 룸, 스레드, 미디어, 반응, 투표, 위치, E2EE를 지원합니다.

## 설치

채널을 구성하기 전에 Matrix를 설치하세요.

```bash
openclaw plugins install @openclaw/matrix
```

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`은 Plugin을 등록하고 활성화하므로 별도의 `openclaw plugins enable matrix` 단계가 필요하지 않습니다. 하지만 아래에서 채널을 구성하기 전까지는 Plugin이 아무 작업도 하지 않습니다. 일반적인 Plugin 동작 및 설치 규칙은 [Plugin](/ko/tools/plugin)을 참고하세요.

## 설정

1. 홈서버에 Matrix 계정을 만듭니다.
2. `channels.matrix`를 `homeserver` + `accessToken` 또는 `homeserver` + `userId` + `password`로 구성합니다.
3. Gateway를 재시작합니다.
4. 봇과 DM을 시작하거나 룸에 초대합니다([자동 참여](#auto-join) 참고 — 새 초대는 `autoJoin`이 허용할 때만 반영됩니다).

### 대화형 설정

```bash
openclaw channels add
openclaw configure --section channels
```

마법사는 홈서버 URL, 인증 방식(액세스 토큰 또는 비밀번호), 사용자 ID(비밀번호 인증에서만), 선택적 디바이스 이름, E2EE 활성화 여부, 룸 접근 및 자동 참여 구성 여부를 묻습니다.

일치하는 `MATRIX_*` 환경 변수가 이미 있고 선택한 계정에 저장된 인증 정보가 없으면, 마법사는 환경 변수 바로 가기를 제안합니다. 허용 목록을 저장하기 전에 룸 이름을 해석하려면 `openclaw channels resolve --channel matrix "Project Room"`을 실행하세요. E2EE가 활성화되면 마법사는 구성을 작성하고 [`openclaw matrix encryption setup`](#encryption-and-verification)과 동일한 부트스트랩을 실행합니다.

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

### 자동 참여

`channels.matrix.autoJoin`의 기본값은 `off`입니다. 기본값을 사용하면 수동으로 참여하기 전까지 봇은 새 초대로 들어온 새 룸이나 DM에 나타나지 않습니다.

OpenClaw는 초대 시점에 초대된 룸이 DM인지 그룹인지 알 수 없으므로 DM 형태의 초대를 포함한 모든 초대는 먼저 `autoJoin`을 거칩니다. `dm.policy`는 봇이 참여하고 룸이 분류된 뒤에만 적용됩니다.

<Warning>
봇이 수락하는 초대를 제한하려면 `autoJoin: "allowlist"`와 `autoJoinAllowlist`를 설정하고, 모든 초대를 수락하려면 `autoJoin: "always"`를 설정하세요.

`autoJoinAllowlist`는 안정적인 대상만 허용합니다: `!roomId:server`, `#alias:server`, 또는 `*`. 일반 룸 이름은 거부됩니다. 별칭 항목은 초대된 룸이 주장하는 상태가 아니라 홈서버를 기준으로 해석됩니다.
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

DM 및 룸 허용 목록은 안정적인 ID로 채우는 것이 가장 좋습니다.

- DM(`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server`를 사용하세요. 표시 이름은 홈서버 디렉터리가 정확히 하나의 일치 항목을 반환할 때만 해석됩니다.
- 룸(`groups`, `autoJoinAllowlist`): `!room:server` 또는 `#alias:server`를 사용하세요. 이름은 참여한 룸을 기준으로 최선을 다해 해석되며, 해석되지 않은 항목은 런타임에 무시됩니다.

### 계정 ID 정규화

마법사는 친숙한 이름을 정규화된 계정 ID로 변환합니다. 예를 들어 `Ops Bot`은 `ops-bot`이 됩니다. 두 계정이 충돌하지 않도록 범위 지정 환경 변수 이름에서는 문장 부호가 이스케이프됩니다. `-` → `_X2D_`이므로 `ops-prod`는 `MATRIX_OPS_X2D_PROD_*`에 매핑됩니다.

### 캐시된 인증 정보

Matrix는 캐시된 인증 정보를 `~/.openclaw/credentials/matrix/` 아래에 저장합니다.

- 기본 계정: `credentials.json`
- 이름 있는 계정: `credentials-<account>.json`

캐시된 인증 정보가 있으면 OpenClaw는 액세스 토큰이 구성 파일에 없더라도 Matrix가 구성된 것으로 취급합니다. 이는 설정, `openclaw doctor`, 채널 상태 프로브에 적용됩니다.

### 환경 변수

동등한 구성 키가 설정되지 않았을 때 사용됩니다. 기본 계정은 접두사가 없는 이름을 사용하고, 이름 있는 계정은 접미사 앞에 계정 ID를 삽입합니다.

| 기본 계정              | 이름 있는 계정(`<ID>`는 정규화된 계정 ID) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

계정 `ops`의 경우 이름은 `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` 등으로 됩니다. 복구 키 환경 변수는 `--recovery-key-stdin`으로 키를 파이프할 때 복구 인식 CLI 플로(`verify backup restore`, `verify device`, `verify bootstrap`)에서 읽습니다.

`MATRIX_HOMESERVER`는 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참고하세요.

## 구성 예시

DM 페어링, 룸 허용 목록, E2EE를 포함한 실용적인 기준 구성:

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

Matrix 답장 스트리밍은 선택 사항입니다. `streaming`은 OpenClaw가 진행 중인 어시스턴트 답장을 전달하는 방식을 제어하고, `blockStreaming`은 완료된 각 블록을 자체 Matrix 메시지로 보존할지 여부를 제어합니다.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

실시간 답변 미리보기는 유지하되 중간 도구/진행률 줄은 숨기려면 객체
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
| `"off"` (기본값) | 전체 답장을 기다린 뒤 한 번 전송합니다. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | 모델이 현재 블록을 작성하는 동안 일반 텍스트 메시지 하나를 제자리에서 편집합니다. 기본 Matrix 클라이언트는 최종 편집이 아니라 첫 미리보기에서 알림을 보낼 수 있습니다.              |
| `"quiet"`         | `"partial"`과 같지만 메시지는 알림이 없는 공지입니다. 수신자는 사용자별 푸시 규칙이 최종 편집과 일치할 때만 알림을 받습니다(아래 참고). |

`blockStreaming`은 `streaming`과 독립적입니다.

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (기본값)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 현재 블록의 실시간 초안, 완료된 블록은 메시지로 유지 | 현재 블록의 실시간 초안, 제자리에서 최종 확정 |
| `"off"`                 | 완료된 블록마다 알림이 있는 Matrix 메시지 하나                     | 전체 답장에 대해 알림이 있는 Matrix 메시지 하나      |

참고:

- 미리보기가 Matrix의 이벤트당 크기 제한을 초과하면 OpenClaw는 미리보기 스트리밍을 중지하고 최종본만 전달하는 방식으로 대체합니다.
- 미디어 답장은 항상 첨부 파일을 정상적으로 전송합니다. 오래된 미리보기를 더 이상 안전하게 재사용할 수 없으면 OpenClaw는 최종 미디어 답장을 보내기 전에 해당 미리보기를 삭제 처리합니다.
- Matrix 미리보기 스트리밍이 활성화되면 도구 진행률 미리보기 업데이트가 기본적으로 활성화됩니다. 답변 텍스트의 미리보기 편집은 유지하되 도구 진행률은 일반 전달 경로에 남기려면 `streaming.preview.toolProgress: false`를 설정하세요.
- 미리보기 편집은 추가 Matrix API 호출 비용이 듭니다. 가장 보수적인 속도 제한 프로필을 원하면 `streaming: "off"`로 두세요.

## 승인 메타데이터

Matrix 네이티브 승인 프롬프트는 `com.openclaw.approval` 아래에 OpenClaw 전용 사용자 지정 이벤트 콘텐츠가 있는 일반 `m.room.message` 이벤트입니다. Matrix는 사용자 지정 이벤트 콘텐츠 키를 허용하므로, 기본 클라이언트는 여전히 텍스트 본문을 렌더링하고 OpenClaw 인식 클라이언트는 구조화된 승인 ID, 종류, 상태, 사용 가능한 결정, 실행/Plugin 세부 정보를 읽을 수 있습니다.

승인 프롬프트가 Matrix 이벤트 하나에 담기에는 너무 길면 OpenClaw는 표시되는 텍스트를 청크로 나누고 첫 번째 청크에만 `com.openclaw.approval`을 첨부합니다. 허용/거부 결정에 대한 반응은 해당 첫 이벤트에 바인딩되므로 긴 프롬프트도 단일 이벤트 프롬프트와 동일한 승인 대상을 유지합니다.

### 조용한 최종 미리보기를 위한 셀프 호스팅 푸시 규칙

`streaming: "quiet"`는 블록이나 턴이 최종 확정된 뒤에만 수신자에게 알립니다. 사용자별 푸시 규칙이 최종 미리보기 마커와 일치해야 합니다. 전체 절차(수신자 토큰, 푸셔 확인, 규칙 설치, 홈서버별 참고 사항)는 [조용한 미리보기를 위한 Matrix 푸시 규칙](/ko/channels/matrix-push-rules)을 참고하세요.

## 봇 간 룸

기본적으로 구성된 다른 OpenClaw Matrix 계정의 Matrix 메시지는 무시됩니다.

의도적으로 에이전트 간 Matrix 트래픽을 원할 때 `allowBots`를 사용하세요.

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

- `allowBots: true`는 허용된 룸 및 DM에서 구성된 다른 Matrix 봇 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`는 룸에서 이 봇을 눈에 보이게 멘션한 경우에만 해당 메시지를 수락합니다. DM은 계속 허용됩니다.
- `groups.<room>.allowBots`는 한 룸에 대해 계정 수준 설정을 재정의합니다.
- OpenClaw는 자기 답장 루프를 피하기 위해 동일한 Matrix 사용자 ID의 메시지는 계속 무시합니다.
- Matrix는 여기에서 네이티브 봇 플래그를 노출하지 않습니다. OpenClaw는 "봇 작성"을 "이 OpenClaw Gateway에 구성된 다른 Matrix 계정이 보낸 것"으로 취급합니다.

공유 룸에서 봇 간 트래픽을 활성화할 때는 엄격한 룸 허용 목록과 멘션 요구 사항을 사용하세요.

## 암호화 및 검증

암호화된(E2EE) 룸에서 발신 이미지 이벤트는 `thumbnail_file`을 사용하므로 이미지 미리보기가 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 룸은 계속 일반 `thumbnail_url`을 사용합니다. 구성은 필요하지 않습니다. Plugin이 E2EE 상태를 자동으로 감지합니다.

모든 `openclaw matrix` 명령은 `--verbose`(전체 진단), `--json`(기계 판독 가능 출력), `--account <id>`(다중 계정 설정)를 허용합니다. 출력은 기본적으로 간결하며 내부 SDK 로깅은 조용합니다. 아래 예시는 표준 형식을 보여줍니다. 필요에 따라 플래그를 추가하세요.

### 암호화 활성화

```bash
openclaw matrix encryption setup
```

시크릿 저장소와 교차 서명을 부트스트랩하고, 필요하면 룸 키 백업을 만든 다음 상태와 다음 단계를 출력합니다. 유용한 플래그:

- `--recovery-key <key>` 부트스트랩 전에 복구 키를 적용합니다(아래에 문서화된 stdin 형식을 권장).
- `--force-reset-cross-signing` 현재 교차 서명 ID를 버리고 새 ID를 만듭니다(의도한 경우에만 사용).

새 계정의 경우 생성 시점에 E2EE를 활성화합니다.

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`은 `--enable-e2ee`의 별칭입니다.

동등한 수동 설정:

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
- `Cross-signing verified`: SDK가 교차 서명을 통한 확인을 보고함
- `Signed by owner`: 사용자의 자체 서명 키로 서명됨(진단 전용)

`Verified by owner`는 `Cross-signing verified`가 `yes`일 때만 `yes`가 됩니다. 로컬 신뢰나 소유자 서명만으로는 충분하지 않습니다.

`--allow-degraded-local-state`는 Matrix 계정을 먼저 준비하지 않고 최선의 진단 정보를 반환합니다. 오프라인 또는 부분적으로 설정된 점검에 유용합니다.

### 복구 키로 이 기기 확인

복구 키는 민감한 정보입니다. 명령줄에 전달하지 말고 stdin으로 파이프하세요. `MATRIX_RECOVERY_KEY`를 설정합니다(이름이 지정된 계정의 경우 `MATRIX_<ID>_RECOVERY_KEY`).

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

이 명령은 세 가지 상태를 보고합니다.

- `Recovery key accepted`: Matrix가 시크릿 저장소 또는 기기 신뢰에 사용할 키를 수락했습니다.
- `Backup usable`: 신뢰된 복구 자료로 룸 키 백업을 로드할 수 있습니다.
- `Device verified by owner`: 이 기기가 완전한 Matrix 교차 서명 ID 신뢰를 갖습니다.

복구 키가 백업 자료를 잠금 해제했더라도 전체 ID 신뢰가 완료되지 않으면 0이 아닌 코드로 종료됩니다. 이 경우 다른 Matrix 클라이언트에서 자체 확인을 완료하세요.

```bash
openclaw matrix verify self
```

`verify self`는 `Cross-signing verified: yes`가 될 때까지 기다린 뒤 성공적으로 종료됩니다. 대기 시간을 조정하려면 `--timeout-ms <ms>`를 사용하세요.

리터럴 키 형식인 `openclaw matrix verify device "<recovery-key>"`도 허용되지만, 키가 셸 기록에 남습니다.

### 교차 서명 부트스트랩 또는 복구

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap`은 암호화된 계정의 복구 및 설정 명령입니다. 순서대로 다음을 수행합니다.

- 가능한 경우 기존 복구 키를 재사용하여 시크릿 저장소를 부트스트랩합니다.
- 교차 서명을 부트스트랩하고 누락된 공개 키를 업로드합니다.
- 현재 기기를 표시하고 교차 서명합니다.
- 서버 측 룸 키 백업이 아직 없으면 만듭니다.

홈서버가 교차 서명 키 업로드에 UIA를 요구하면 OpenClaw는 먼저 인증 없음, 그다음 `m.login.dummy`, 그다음 `m.login.password`를 시도합니다(`channels.matrix.password` 필요).

유용한 플래그:

- `--recovery-key-stdin`(`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`와 함께 사용) 또는 `--recovery-key <key>`
- 현재 교차 서명 ID를 버리려면 `--force-reset-cross-signing`(의도한 경우에만)

### 룸 키 백업

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`는 서버 측 백업이 있는지와 이 기기가 이를 복호화할 수 있는지 표시합니다. `backup restore`는 백업된 룸 키를 로컬 암호화 저장소로 가져옵니다. 복구 키가 이미 디스크에 있으면 `--recovery-key-stdin`을 생략할 수 있습니다.

손상된 백업을 새 기준선으로 교체하려면 다음을 사용합니다(복구 불가능한 오래된 기록 손실을 감수하며, 현재 백업 시크릿을 로드할 수 없는 경우 시크릿 저장소도 다시 만들 수 있음).

```bash
openclaw matrix verify backup reset --yes
```

이전 복구 키가 새 백업 기준선을 더 이상 잠금 해제하지 못하게 하려는 경우에만 `--rotate-recovery-key`를 추가하세요.

### 확인 목록 조회, 요청, 응답

```bash
openclaw matrix verify list
```

선택한 계정의 보류 중인 확인 요청을 나열합니다.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

이 OpenClaw 계정에서 확인 요청을 보냅니다. `--own-user`는 자체 확인을 요청합니다(같은 사용자의 다른 Matrix 클라이언트에서 프롬프트를 수락). `--user-id`/`--device-id`/`--room-id`는 다른 사람을 대상으로 합니다. `--own-user`는 다른 대상 지정 플래그와 함께 사용할 수 없습니다.

더 낮은 수준의 수명 주기 처리, 일반적으로 다른 클라이언트의 인바운드 요청을 추적하는 동안에는 다음 명령이 특정 요청 `<id>`에 작동합니다(`verify list` 및 `verify request`가 출력).

| 명령                                       | 목적                                                        |
| ------------------------------------------ | ----------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 인바운드 요청 수락                                          |
| `openclaw matrix verify start <id>`        | SAS 흐름 시작                                               |
| `openclaw matrix verify sas <id>`          | SAS 이모지 또는 십진수 출력                                 |
| `openclaw matrix verify confirm-sas <id>`  | SAS가 다른 클라이언트에 표시된 것과 일치함을 확인            |
| `openclaw matrix verify mismatch-sas <id>` | 이모지 또는 십진수가 일치하지 않을 때 SAS 거부               |
| `openclaw matrix verify cancel <id>`       | 취소. 선택적으로 `--reason <text>` 및 `--code <matrix-code>` 사용 |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, `cancel`은 모두 확인이 특정 다이렉트 메시지 룸에 고정되어 있을 때 DM 후속 힌트로 `--user-id`와 `--room-id`를 받습니다.

### 다중 계정 참고 사항

`--account <id>`가 없으면 Matrix CLI 명령은 암시적 기본 계정을 사용합니다. 이름이 지정된 계정이 여러 개이고 `channels.matrix.defaultAccount`를 설정하지 않은 경우, 추측하지 않고 선택을 요청합니다. 이름이 지정된 계정에서 E2EE가 비활성화되었거나 사용할 수 없으면 오류가 해당 계정의 설정 키를 가리킵니다. 예: `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    `encryption: true`인 경우 `startupVerification`은 기본적으로 `"if-unverified"`입니다. 시작 시 확인되지 않은 기기는 다른 Matrix 클라이언트에서 자체 확인을 요청하며, 중복 요청을 건너뛰고 쿨다운을 적용합니다(기본값 24시간). `startupVerificationCooldownHours`로 조정하거나 `startupVerification: "off"`로 비활성화하세요.

    시작 시 현재 시크릿 저장소와 교차 서명 ID를 재사용하는 보수적인 암호화 부트스트랩 단계도 실행됩니다. 부트스트랩 상태가 손상된 경우 OpenClaw는 `channels.matrix.password` 없이도 보호된 복구를 시도합니다. 홈서버가 비밀번호 UIA를 요구하면 시작 로그에 경고를 남기고 치명적 오류로 처리하지 않습니다. 이미 소유자 서명된 기기는 보존됩니다.

    전체 업그레이드 흐름은 [Matrix 마이그레이션](/ko/channels/matrix-migration)을 참조하세요.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix는 엄격한 DM 확인 룸에 확인 수명 주기 알림을 `m.notice` 메시지로 게시합니다. 여기에는 요청, 준비("이모지로 확인" 안내 포함), 시작/완료, 사용 가능한 경우 SAS(이모지/십진수) 세부 정보가 포함됩니다.

    다른 Matrix 클라이언트에서 들어오는 요청은 추적되고 자동 수락됩니다. 자체 확인의 경우 OpenClaw는 SAS 흐름을 자동으로 시작하고 이모지 확인이 가능해지면 자기 쪽을 확인합니다. 그래도 Matrix 클라이언트에서 비교한 뒤 "일치합니다"를 확인해야 합니다.

    확인 시스템 알림은 에이전트 채팅 파이프라인으로 전달되지 않습니다.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    `verify status`가 현재 기기가 더 이상 홈서버에 나열되지 않는다고 표시하면 새 OpenClaw Matrix 기기를 만드세요. 비밀번호 로그인의 경우:

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
    오래된 OpenClaw 관리 기기가 누적될 수 있습니다. 나열하고 정리하세요.

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE는 IndexedDB shim으로 `fake-indexeddb`를 사용하여 공식 `matrix-js-sdk` Rust 암호화 경로를 사용합니다. 암호화 상태는 `crypto-idb-snapshot.json`에 지속됩니다(제한적인 파일 권한).

    암호화된 런타임 상태는 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 아래에 있으며 동기화 저장소, 암호화 저장소, 복구 키, IDB 스냅샷, 스레드 바인딩, 시작 확인 상태를 포함합니다. 토큰이 변경되었지만 계정 ID가 동일하게 유지되면 OpenClaw는 가장 적합한 기존 루트를 재사용하여 이전 상태가 계속 표시되도록 합니다.

  </Accordion>
</AccordionGroup>

## 프로필 관리

선택한 계정의 Matrix 자체 프로필을 업데이트합니다.

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

한 번의 호출에 두 옵션을 모두 전달할 수 있습니다. Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://` 또는 `https://`를 전달하면 OpenClaw가 먼저 파일을 업로드하고 확인된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 계정별 재정의)에 저장합니다.

## 스레드

Matrix는 자동 응답과 메시지 도구 전송 모두에 네이티브 Matrix 스레드를 지원합니다. 두 개의 독립적인 조정 항목이 동작을 제어합니다.

### 세션 라우팅(`sessionScope`)

`dm.sessionScope`는 Matrix DM 룸이 OpenClaw 세션에 매핑되는 방식을 결정합니다.

- `"per-user"`(기본값): 같은 라우팅된 상대가 있는 모든 DM 룸이 하나의 세션을 공유합니다.
- `"per-room"`: 상대가 같더라도 각 Matrix DM 룸은 자체 세션 키를 갖습니다.

명시적 대화 바인딩은 항상 `sessionScope`보다 우선하므로, 바인딩된 룸과 스레드는 선택된 대상 세션을 유지합니다.

### 응답 스레딩(`threadReplies`)

`threadReplies`는 봇이 응답을 게시할 위치를 결정합니다.

- `"off"`: 응답은 최상위 수준입니다. 인바운드 스레드 메시지는 상위 세션에 유지됩니다.
- `"inbound"`: 인바운드 메시지가 이미 해당 스레드에 있었을 때만 스레드 안에서 응답합니다.
- `"always"`: 트리거 메시지를 루트로 하는 스레드 안에서 응답합니다. 해당 대화는 첫 트리거부터 일치하는 스레드 범위 세션을 통해 라우팅됩니다.

`dm.threadReplies`는 DM에 대해서만 이를 재정의합니다. 예를 들어 룸 스레드는 격리된 상태로 유지하면서 DM은 평면으로 유지할 수 있습니다.

### 스레드 상속 및 슬래시 명령

- 인바운드 스레드 메시지는 스레드 루트 메시지를 추가 에이전트 컨텍스트로 포함합니다.
- 메시지 도구 전송은 명시적 `threadId`가 제공되지 않는 한, 같은 룸(또는 같은 DM 사용자 대상)을 대상으로 할 때 현재 Matrix 스레드를 자동으로 상속합니다.
- DM 사용자 대상 재사용은 현재 세션 메타데이터가 같은 Matrix 계정의 같은 DM 피어임을 증명할 때만 적용됩니다. 그렇지 않으면 OpenClaw는 일반 사용자 범위 라우팅으로 폴백합니다.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 스레드 바인딩된 `/acp spawn`은 모두 Matrix 룸과 DM에서 작동합니다.
- 최상위 `/focus`는 `threadBindings.spawnSessions`가 활성화된 경우 새 Matrix 스레드를 만들고 대상 세션에 바인딩합니다.
- 기존 Matrix 스레드 안에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 해당 스레드가 그 자리에서 바인딩됩니다.

OpenClaw가 같은 공유 세션에서 다른 DM 룸과 충돌하는 Matrix DM 룸을 감지하면, 해당 룸에 `/focus` 탈출 경로를 안내하고 `dm.sessionScope` 변경을 제안하는 일회성 `m.notice`를 게시합니다. 이 알림은 스레드 바인딩이 활성화된 경우에만 나타납니다.

## ACP 대화 바인딩

Matrix 룸, DM, 기존 Matrix 스레드는 채팅 표면을 바꾸지 않고도 지속 ACP 워크스페이스로 전환할 수 있습니다.

빠른 운영자 흐름:

- 계속 사용하려는 Matrix DM, 룸 또는 기존 스레드 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 최상위 Matrix DM 또는 룸에서는 현재 DM/룸이 채팅 표면으로 유지되고, 이후 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- 기존 Matrix 스레드 안에서는 `--bind here`가 현재 스레드를 그 자리에서 바인딩합니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 그 자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

참고:

- `--bind here`는 하위 Matrix 스레드를 만들지 않습니다.
- `threadBindings.spawnSessions`는 OpenClaw가 하위 Matrix 스레드를 만들거나 바인딩해야 하는 `/acp spawn --thread auto|here`를 제어합니다.

### 스레드 바인딩 설정

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며, 채널별 재정의도 지원합니다.

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix 스레드 바인딩 세션 생성은 기본적으로 켜져 있습니다.

- 최상위 `/focus`와 `/acp spawn --thread auto|here`가 Matrix 스레드를 생성/바인딩하지 못하게 하려면 `threadBindings.spawnSessions: false`를 설정합니다.
- 네이티브 하위 에이전트 스레드 생성이 부모 트랜스크립트를 포크하지 않아야 한다면 `threadBindings.defaultSpawnContext: "isolated"`를 설정합니다.

## 리액션

Matrix는 아웃바운드 리액션, 인바운드 리액션 알림, 확인 리액션을 지원합니다.

아웃바운드 리액션 도구는 `channels.matrix.actions.reactions`로 제어됩니다.

- `react`는 Matrix 이벤트에 리액션을 추가합니다.
- `reactions`는 Matrix 이벤트의 현재 리액션 요약을 나열합니다.
- `emoji=""`는 해당 이벤트에서 봇 자신의 리액션을 제거합니다.
- `remove: true`는 봇에서 지정된 이모지 리액션만 제거합니다.

**해결 순서**(먼저 정의된 값이 우선):

| 설정                    | 순서                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | 계정별 → 채널 → `messages.ackReaction` → 에이전트 ID 이모지 폴백                 |
| `ackReactionScope`      | 계정별 → 채널 → `messages.ackReactionScope` → 기본값 `"group-mentions"`          |
| `reactionNotifications` | 계정별 → 채널 → 기본값 `"own"`                                                   |

`reactionNotifications: "own"`은 봇이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` 이벤트를 전달합니다. `"off"`는 리액션 시스템 이벤트를 비활성화합니다. Matrix는 리액션 제거를 독립적인 `m.reaction` 제거가 아니라 삭제로 노출하므로, 리액션 제거는 시스템 이벤트로 합성되지 않습니다.

## 기록 컨텍스트

- `channels.matrix.historyLimit`는 Matrix 룸 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함되는 최근 룸 메시지 수를 제어합니다. `messages.groupChat.historyLimit`로 폴백하며, 둘 다 설정되지 않은 경우 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정합니다.
- Matrix 룸 기록은 룸 전용입니다. DM은 일반 세션 기록을 계속 사용합니다.
- Matrix 룸 기록은 대기 중인 메시지만 포함합니다. OpenClaw는 아직 응답을 트리거하지 않은 룸 메시지를 버퍼링한 다음, 멘션이나 다른 트리거가 도착하면 해당 창의 스냅샷을 만듭니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않습니다. 해당 턴의 기본 인바운드 본문에 유지됩니다.
- 같은 Matrix 이벤트를 재시도하면 최신 룸 메시지 쪽으로 밀려나지 않고 원래 기록 스냅샷을 재사용합니다.

## 컨텍스트 가시성

Matrix는 가져온 답글 텍스트, 스레드 루트, 대기 중인 기록 같은 보조 룸 컨텍스트에 대해 공유 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보조 컨텍스트는 수신된 그대로 유지됩니다.
- `contextVisibility: "allowlist"`는 활성 룸/사용자 allowlist 검사에서 허용된 보낸 사람으로 보조 컨텍스트를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 명시적으로 인용된 답글 하나는 계속 유지합니다.

이 설정은 보조 컨텍스트 가시성에 영향을 주며, 인바운드 메시지 자체가 응답을 트리거할 수 있는지에는 영향을 주지 않습니다.
트리거 권한 부여는 여전히 `groupPolicy`, `groups`, `groupAllowFrom`, DM 정책 설정에서 결정됩니다.

## DM 및 룸 정책

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

룸은 계속 작동하게 하면서 DM을 완전히 비활성화하려면 `dm.enabled: false`를 설정합니다.

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

멘션 게이트와 allowlist 동작은 [그룹](/ko/channels/groups)을 참조하세요.

Matrix DM의 페어링 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면, OpenClaw는 같은 대기 중인 페어링 코드를 재사용하며 새 코드를 발급하는 대신 짧은 쿨다운 후 알림 답장을 보낼 수 있습니다.

공유 DM 페어링 흐름과 저장소 레이아웃은 [페어링](/ko/channels/pairing)을 참조하세요.

## 직접 룸 복구

직접 메시지 상태가 동기화되지 않으면 OpenClaw는 실제 DM 대신 오래된 단독 룸을 가리키는 오래된 `m.direct` 매핑을 갖게 될 수 있습니다. 피어의 현재 매핑을 검사하려면:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

복구하려면:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

두 명령 모두 다중 계정 설정을 위해 `--account <id>`를 허용합니다. 복구 흐름은 다음과 같습니다.

- 이미 `m.direct`에 매핑된 엄격한 1:1 DM을 우선합니다.
- 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 폴백합니다.
- 정상 DM이 없으면 새 직접 룸을 만들고 `m.direct`를 다시 작성합니다.

이 흐름은 오래된 룸을 자동으로 삭제하지 않습니다. 정상 DM을 선택하고 매핑을 업데이트하여 이후 Matrix 전송, 확인 알림, 기타 직접 메시지 흐름이 올바른 룸을 대상으로 하게 합니다.

## Exec 승인

Matrix는 네이티브 승인 클라이언트로 동작할 수 있습니다. `channels.matrix.execApprovals` 아래에 설정합니다(계정별 재정의는 `channels.matrix.accounts.<account>.execApprovals`).

- `enabled`: Matrix 네이티브 프롬프트를 통해 승인을 전달합니다. 설정되지 않았거나 `"auto"`인 경우, 하나 이상의 승인자를 해석할 수 있으면 Matrix가 자동으로 활성화됩니다. 명시적으로 비활성화하려면 `false`로 설정합니다.
- `approvers`: exec 요청을 승인할 수 있는 Matrix 사용자 ID(`@owner:example.org`)입니다. 선택 사항이며, `channels.matrix.dm.allowFrom`으로 폴백합니다.
- `target`: 프롬프트가 전달될 위치입니다. `"dm"`(기본값)은 승인자 DM으로 보내고, `"channel"`은 원본 Matrix 룸 또는 DM으로 보내며, `"both"`는 둘 다로 보냅니다.
- `agentFilter` / `sessionFilter`: Matrix 전달을 트리거할 에이전트/세션에 대한 선택적 allowlist입니다.

승인 종류에 따라 권한 부여가 약간 다릅니다.

- **Exec 승인**은 `execApprovals.approvers`를 사용하며, `dm.allowFrom`으로 폴백합니다.
- **Plugin 승인**은 `dm.allowFrom`만 통해 권한을 부여합니다.

두 종류 모두 Matrix 리액션 단축키와 메시지 업데이트를 공유합니다. 승인자는 기본 승인 메시지에서 리액션 단축키를 볼 수 있습니다.

- `✅` 한 번 허용
- `❌` 거부
- `♾️` 항상 허용(유효 exec 정책이 허용하는 경우)

폴백 슬래시 명령: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

해석된 승인자만 승인하거나 거부할 수 있습니다. exec 승인의 채널 전달에는 명령 텍스트가 포함됩니다. 신뢰할 수 있는 룸에서만 `channel` 또는 `both`를 활성화하세요.

관련 항목: [Exec 승인](/ko/tools/exec-approvals).

## 슬래시 명령

슬래시 명령(`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` 등)은 DM에서 직접 작동합니다. 룸에서는 OpenClaw가 봇 자신의 Matrix 멘션으로 접두사가 붙은 명령도 인식하므로, `@bot:server /new`는 사용자 지정 멘션 정규식 없이 명령 경로를 트리거합니다. 이렇게 하면 사용자가 명령을 입력하기 전에 봇을 탭 완성할 때 Element 및 유사 클라이언트가 내보내는 룸 스타일 `@mention /command` 게시물에도 봇이 응답할 수 있습니다.

권한 부여 규칙은 계속 적용됩니다. 명령 보낸 사람은 일반 메시지와 동일한 DM 또는 룸 allowlist/소유자 정책을 충족해야 합니다.

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

- 최상위 `channels.matrix` 값은 계정에서 재정의하지 않는 한 이름이 지정된 계정의 기본값으로 동작합니다.
- `groups.<room>.account`를 사용하여 상속된 룸 항목의 범위를 특정 계정으로 제한합니다. `account`가 없는 항목은 계정 간에 공유됩니다. 기본 계정이 최상위 수준에 설정되어 있으면 `account: "default"`도 계속 작동합니다.

**기본 계정 선택:**

- 암시적 라우팅, 프로빙, CLI 명령이 선호할 이름이 지정된 계정을 선택하려면 `defaultAccount`를 설정합니다.
- 여러 계정이 있고 그중 하나의 이름이 말 그대로 `default`라면, `defaultAccount`가 설정되지 않아도 OpenClaw는 이를 암시적으로 사용합니다.
- 이름이 지정된 계정이 여러 개 있고 기본값이 선택되지 않은 경우, CLI 명령은 추측을 거부합니다. `defaultAccount`를 설정하거나 `--account <id>`를 전달하세요.
- 최상위 `channels.matrix.*` 블록은 인증이 완전한 경우(`homeserver` + `accessToken`, 또는 `homeserver` + `userId` + `password`)에만 암시적 `default` 계정으로 처리됩니다. 캐시된 자격 증명이 인증을 담당하면 이름이 지정된 계정은 `homeserver` + `userId`만으로도 계속 발견할 수 있습니다.

**승격:**

- OpenClaw가 복구 또는 설정 중 단일 계정 설정을 다중 계정으로 승격할 때, 기존 이름이 지정된 계정이 있거나 `defaultAccount`가 이미 해당 계정을 가리키면 이를 보존합니다. Matrix 인증/부트스트랩 키만 승격된 계정으로 이동하며, 공유 전달 정책 키는 최상위 수준에 유지됩니다.

공유 다중 계정 패턴은 [설정 참조](/ko/gateway/config-channels#multi-account-all-channels)를 참조하세요.

## 비공개/LAN 홈서버

기본적으로 OpenClaw는 SSRF 보호를 위해 계정별로 명시적으로 옵트인하지 않는 한 비공개/내부 Matrix 홈서버를 차단합니다.

홈서버가 localhost, LAN/Tailscale IP 또는 내부 호스트 이름에서 실행되는 경우, 해당 Matrix 계정에 대해 `network.dangerouslyAllowPrivateNetwork`를 활성화하세요.

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

이름이 지정된 계정은 `channels.matrix.accounts.<id>.proxy`로 최상위 기본값을 재정의할 수 있습니다. OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브에 동일한 프록시 설정을 사용합니다.

## 대상 해석

OpenClaw가 룸 또는 사용자 대상을 요청하는 모든 위치에서 Matrix는 다음 대상 형식을 허용합니다.

- 사용자: `@user:server`, `user:@user:server`, 또는 `matrix:user:@user:server`
- 룸: `!room:server`, `room:!room:server`, 또는 `matrix:room:!room:server`
- 별칭: `#alias:server`, `channel:#alias:server`, 또는 `matrix:channel:#alias:server`

Matrix 룸 ID는 대소문자를 구분합니다. 명시적 전달 대상, cron 작업, 바인딩 또는 허용 목록을 구성할 때 Matrix의 정확한 룸 ID 대소문자를 사용하세요. OpenClaw는 저장을 위해 내부 세션 키를 정규화하므로, 이러한 소문자 키는 Matrix 전달 ID의 신뢰할 수 있는 원천이 아닙니다.

실시간 디렉터리 조회는 로그인한 Matrix 계정을 사용합니다.

- 사용자 조회는 해당 홈서버의 Matrix 사용자 디렉터리를 쿼리합니다.
- 룸 조회는 명시적 룸 ID와 별칭을 직접 허용한 뒤, 해당 계정이 참여한 룸 이름 검색으로 폴백합니다.
- 참여한 룸 이름 조회는 최선형 방식입니다. 룸 이름을 ID나 별칭으로 해석할 수 없으면 런타임 허용 목록 해석에서 무시됩니다.

## 구성 참조

허용 목록 스타일 필드(`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`)는 전체 Matrix 사용자 ID를 허용합니다(가장 안전함). 정확한 디렉터리 일치는 시작 시와 모니터가 실행 중인 동안 허용 목록이 변경될 때마다 해석됩니다. 해석할 수 없는 항목은 런타임에 무시됩니다. 같은 이유로 룸 허용 목록에는 룸 ID나 별칭을 권장합니다.

### 계정 및 연결

- `enabled`: 채널을 활성화하거나 비활성화합니다.
- `name`: 계정의 선택적 표시 레이블입니다.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호하는 계정 ID입니다.
- `accounts`: 이름이 지정된 계정별 재정의입니다. 최상위 `channels.matrix` 값은 기본값으로 상속됩니다.
- `homeserver`: 홈서버 URL입니다. 예: `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: 이 계정이 `localhost`, LAN/Tailscale IP 또는 내부 호스트 이름에 연결할 수 있도록 허용합니다.
- `proxy`: Matrix 트래픽용 선택적 HTTP(S) 프록시 URL입니다. 계정별 재정의가 지원됩니다.
- `userId`: 전체 Matrix 사용자 ID(`@bot:example.org`)입니다.
- `accessToken`: 토큰 기반 인증용 액세스 토큰입니다. env/file/exec 제공자 전반에서 평문 및 SecretRef 값이 지원됩니다([비밀 관리](/ko/gateway/secrets)).
- `password`: 비밀번호 기반 로그인용 비밀번호입니다. 평문 및 SecretRef 값이 지원됩니다.
- `deviceId`: 명시적 Matrix 장치 ID입니다.
- `deviceName`: 비밀번호 로그인 시 사용되는 장치 표시 이름입니다.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트를 위해 저장된 자기 아바타 URL입니다.
- `initialSyncLimit`: 시작 동기화 중 가져오는 최대 이벤트 수입니다.

### 암호화

- `encryption`: E2EE를 활성화합니다. 기본값: `false`.
- `startupVerification`: `"if-unverified"`(E2EE가 켜져 있을 때 기본값) 또는 `"off"`입니다. 이 장치가 검증되지 않은 경우 시작 시 자체 검증을 자동 요청합니다.
- `startupVerificationCooldownHours`: 다음 자동 시작 요청 전 대기 시간입니다. 기본값: `24`.

### 액세스 및 정책

- `groupPolicy`: `"open"`, `"allowlist"`, 또는 `"disabled"`입니다. 기본값: `"allowlist"`.
- `groupAllowFrom`: 룸 트래픽용 사용자 ID 허용 목록입니다.
- `dm.enabled`: `false`이면 모든 DM을 무시합니다. 기본값: `true`.
- `dm.policy`: `"pairing"`(기본값), `"allowlist"`, `"open"`, 또는 `"disabled"`입니다. 봇이 참여하고 룸을 DM으로 분류한 뒤 적용됩니다. 초대 처리에는 영향을 주지 않습니다.
- `dm.allowFrom`: DM 트래픽용 사용자 ID 허용 목록입니다.
- `dm.sessionScope`: `"per-user"`(기본값) 또는 `"per-room"`입니다.
- `dm.threadReplies`: 답장 스레딩에 대한 DM 전용 재정의(`"off"`, `"inbound"`, `"always"`)입니다.
- `allowBots`: 다른 구성된 Matrix 봇 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `allowlistOnly`: `true`이면 모든 활성 DM 정책(`"disabled"` 제외)과 `"open"` 그룹 정책을 `"allowlist"`로 강제합니다. `"disabled"` 정책은 변경하지 않습니다.
- `autoJoin`: `"always"`, `"allowlist"`, 또는 `"off"`입니다. 기본값: `"off"`. DM 스타일 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `"allowlist"`일 때 허용되는 룸/별칭입니다. 별칭 항목은 초대된 룸이 주장하는 상태가 아니라 홈서버를 기준으로 해석됩니다.
- `contextVisibility`: 보조 컨텍스트 표시 범위(`"all"` 기본값, `"allowlist"`, `"allowlist_quote"`)입니다.

### 답장 동작

- `replyToMode`: `"off"`, `"first"`, `"all"`, 또는 `"batched"`입니다.
- `threadReplies`: `"off"`, `"inbound"`, 또는 `"always"`입니다.
- `threadBindings`: 스레드 바인딩 세션 라우팅 및 수명 주기에 대한 채널별 재정의입니다.
- `streaming`: `"off"`(기본값), `"partial"`, `"quiet"`, 또는 객체 형식 `{ mode, preview: { toolProgress } }`입니다. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: `true`이면 완료된 어시스턴트 블록이 별도의 진행 메시지로 유지됩니다.
- `markdown`: 아웃바운드 텍스트용 선택적 Markdown 렌더링 구성입니다.
- `responsePrefix`: 아웃바운드 답장 앞에 붙는 선택적 문자열입니다.
- `textChunkLimit`: `chunkMode: "length"`일 때 문자 단위 아웃바운드 청크 크기입니다. 기본값: `4000`.
- `chunkMode`: `"length"`(기본값, 문자 수 기준 분할) 또는 `"newline"`(줄 경계에서 분할)입니다.
- `historyLimit`: 룸 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함되는 최근 룸 메시지 수입니다. `messages.groupChat.historyLimit`로 폴백합니다. 유효 기본값은 `0`(비활성화)입니다.
- `mediaMaxMb`: 아웃바운드 전송 및 인바운드 처리에 대한 MB 단위 미디어 크기 상한입니다.

### 반응 설정

- `ackReaction`: 이 채널/계정에 대한 ack 반응 재정의입니다.
- `ackReactionScope`: 범위 재정의(`"group-mentions"` 기본값, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)입니다.
- `reactionNotifications`: 인바운드 반응 알림 모드(`"own"` 기본값, `"off"`)입니다.

### 도구 및 룸별 재정의

- `actions`: 작업별 도구 게이팅(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)입니다.
- `groups`: 룸별 정책 맵입니다. 세션 ID는 해석 후 안정적인 룸 ID를 사용합니다. (`rooms`는 레거시 별칭입니다.)
  - `groups.<room>.account`: 상속된 룸 항목 하나를 특정 계정으로 제한합니다.
  - `groups.<room>.allowBots`: 채널 수준 설정의 룸별 재정의(`true` 또는 `"mentions"`)입니다.
  - `groups.<room>.users`: 룸별 발신자 허용 목록입니다.
  - `groups.<room>.tools`: 룸별 도구 허용/거부 재정의입니다.
  - `groups.<room>.autoReply`: 룸별 멘션 게이팅 재정의입니다. `true`는 해당 룸의 멘션 요구 사항을 비활성화하고, `false`는 다시 강제합니다.
  - `groups.<room>.skills`: 룸별 skill 필터입니다.
  - `groups.<room>.systemPrompt`: 룸별 시스템 프롬프트 스니펫입니다.

### Exec 승인 설정

- `execApprovals.enabled`: Matrix 네이티브 프롬프트를 통해 exec 승인을 전달합니다.
- `execApprovals.approvers`: 승인할 수 있는 Matrix 사용자 ID입니다. `dm.allowFrom`으로 폴백합니다.
- `execApprovals.target`: `"dm"`(기본값), `"channel"`, 또는 `"both"`입니다.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 전달용 선택적 에이전트/세션 허용 목록입니다.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
