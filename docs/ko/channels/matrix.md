---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 인증 구성하기
summary: Matrix 지원 상태, 설정 및 구성 예시
title: Matrix
x-i18n:
    generated_at: "2026-07-16T12:17:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix는 공식 `matrix-js-sdk`을 기반으로 구축된 다운로드 가능한 채널 Plugin(`@openclaw/matrix`)입니다. DM, 방, 스레드, 미디어, 반응, 투표, 위치 및 E2EE를 지원합니다.

## 설치

```bash
openclaw plugins install @openclaw/matrix
```

한정되지 않은 Plugin 사양은 먼저 ClawHub를 시도한 다음 npm으로 대체합니다. `openclaw plugins install clawhub:@openclaw/matrix` 또는 `npm:@openclaw/matrix`로 소스를 강제 지정합니다. 로컬 체크아웃에서는 `openclaw plugins install ./path/to/local/matrix-plugin`을 사용합니다.

`plugins install`은 Plugin을 등록하고 활성화하므로 별도의 `enable` 단계가 필요하지 않습니다. 아래와 같이 구성하기 전까지 채널은 아무 작업도 수행하지 않습니다. 일반 설치 규칙은 [Plugin](/ko/tools/plugin)을 참조하십시오.

## 설정

1. 홈 서버에서 Matrix 계정을 생성하십시오.
2. `homeserver` + `accessToken` 또는 `homeserver` + `userId` + `password`를 사용하여 `channels.matrix`을 구성하십시오.
3. Gateway를 다시 시작하십시오.
4. 봇과 DM을 시작하거나 봇을 방에 초대하십시오. 새 초대는 [`autoJoin`](#auto-join)에서 허용하는 경우에만 수락됩니다.

### 대화형 설정

```bash
openclaw channels add
openclaw configure --section channels
```

마법사는 홈 서버 URL, 인증 방법(토큰 또는 비밀번호), 사용자 ID(비밀번호 인증에만 해당), 선택적 기기 이름, E2EE 활성화 여부 및 방 액세스/자동 참가를 묻습니다. 일치하는 `MATRIX_*` 환경 변수가 이미 존재하고 계정에 저장된 인증 정보가 없으면 마법사에서 환경 변수 바로 가기를 제공합니다. `openclaw channels resolve --channel matrix "Project Room"`을 사용해 허용 목록을 저장하기 전에 방 이름을 확인하십시오. 마법사에서 E2EE를 활성화하면 [`openclaw matrix encryption setup`](#encryption-and-verification)과 동일한 부트스트랩을 실행합니다.

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

`channels.matrix.autoJoin`의 기본값은 `"off"`입니다. 수동으로 참가하기 전까지 봇은 새 초대로 생성된 새 방이나 DM에 나타나지 않습니다. OpenClaw는 초대 시점에 해당 초대가 DM인지 그룹인지 알 수 없으므로 모든 초대가 먼저 `autoJoin`을 거칩니다. `dm.policy`은 봇이 참가하고 방이 분류된 이후에만 적용됩니다.

<Warning>
허용할 초대를 제한하려면 `autoJoin: "allowlist"`과 `autoJoinAllowlist`를 설정하고, 모든 초대를 수락하려면 `autoJoin: "always"`를 설정하십시오.

`autoJoinAllowlist`은 `!roomId:server`, `#alias:server` 또는 `*`만 허용합니다. 일반 방 이름은 거부됩니다. 별칭은 초대된 방이 주장하는 상태가 아니라 홈 서버를 기준으로 확인됩니다.
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

### 허용 목록 대상 형식

- DM(`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server`을 사용하십시오. 표시 이름은 변경 가능하므로 기본적으로 무시됩니다. 표시 이름 호환성이 명시적으로 필요한 경우에만 `dangerouslyAllowNameMatching: true`을 설정하십시오.
- 방 허용 목록 키(`groups`, 레거시 별칭 `rooms`): `!room:server` 또는 `#alias:server`을 사용하십시오. `dangerouslyAllowNameMatching: true`이 아니면 일반 이름은 무시됩니다.
- 초대 허용 목록(`autoJoinAllowlist`): `!room:server`, `#alias:server` 또는 `*`을 사용하십시오. 일반 이름은 항상 거부됩니다.

### 계정 ID 정규화

마법사는 알아보기 쉬운 이름을 정규화된 계정 ID로 변환합니다(`Ops Bot` -> `ops-bot`). 범위가 지정된 환경 변수 이름에서는 계정 간 충돌을 방지하기 위해 문장 부호가 16진수로 이스케이프됩니다. `-`(0x2D)은 `_X2D_`이 되므로 `ops-prod`은 환경 변수 접두사 `MATRIX_OPS_X2D_PROD_`에 매핑됩니다.

### 캐시된 인증 정보

Matrix는 인증 정보를 `~/.openclaw/credentials/matrix/` 아래에 캐시합니다. 기본 계정에는 `credentials.json`, 명명된 계정에는 `credentials-<account>.json`을 사용합니다. 캐시된 인증 정보가 있으면 OpenClaw는 구성 파일에 `accessToken`이 없어도 Matrix가 구성된 것으로 간주합니다. 이는 설정, `openclaw doctor` 및 채널 상태 프로브에 적용됩니다.

### 환경 변수

동등한 구성 키가 설정되지 않은 경우 구성 키에 연결된 환경 변수를 사용합니다. 기본 계정은 접두사가 없는 이름을 사용하고, 명명된 계정은 접미사 앞에 계정 토큰을 삽입합니다([정규화](#account-id-normalization) 참조).

| 기본 계정       | 명명된 계정(`<ID>` = 계정 토큰) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

계정 `ops`의 경우 이름은 `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` 등의 형태가 됩니다. `MATRIX_HOMESERVER`(및 범위가 지정된 모든 `*_HOMESERVER` 변형)은 작업 공간 `.env`에서 설정할 수 없습니다. [작업 공간 `.env` 파일](/ko/gateway/security)을 참조하십시오.

<Note>
복구 키는 구성에 연결된 환경 변수가 아닙니다. OpenClaw는 환경 자체에서 복구 키를 읽지 않습니다. CLI 안내 문구에서는 기본 계정의 경우 `MATRIX_RECOVERY_KEY`, 명명된 계정의 경우 `MATRIX_RECOVERY_KEY_<ID>`(16진수 이스케이프 없이 계정 ID를 그대로 대문자로 변환)을 셸 변수 이름으로 사용해 복구 키를 파이프로 전달하도록 제안합니다. [복구 키로 이 기기 확인](#verify-this-device-with-a-recovery-key)을 참조하십시오.
</Note>

## 구성 예제

DM 페어링, 방 허용 목록 및 E2EE를 포함한 실용적인 기본 구성입니다.

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
      streaming: { mode: "partial" },
    },
  },
}
```

## 스트리밍 미리 보기

Matrix 응답 스트리밍은 선택적으로 활성화합니다. `streaming.mode`은 OpenClaw가 생성 중인 어시스턴트 응답을 전달하는 방법을 제어하고, `streaming.block.enabled`은 완료된 각 블록을 별도의 Matrix 메시지로 유지할지 여부를 제어합니다.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

실시간 답변 미리 보기는 유지하되 중간 도구/진행률 줄을 숨기려면 다음과 같이 설정합니다.

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

전체 구성에서는 `{ mode, chunkMode, block, preview, progress }`을 사용할 수 있습니다.

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // 구성된 레이블 또는 기본 제공 레이블에서 선택(숨기려면 false)
          labels: ["Thinking", "Writing", "Searching"], // label: "auto"의 후보
          maxLines: 8, // 순환 진행률 줄의 최대 개수(기본값: 8)
          maxLineChars: 120, // 잘리기 전 줄당 최대 문자 수(기본값: 120)
          toolProgress: true, // 도구/진행 활동 표시(기본값: true)
        },
      },
    },
  },
}
```

- `progress.label`: 사용자 지정 레이블, 구성되었거나 기본 제공되는 레이블을 선택하려면 `"auto"`/설정 해제, 숨기려면 `false`입니다.
- `progress.labels`: `label`이 `"auto"`이거나 설정되지 않은 경우에만 사용되는 후보입니다.
- `progress.maxLines`: 초안에 유지할 순환 진행률 줄의 최대 개수입니다. 이를 초과하는 오래된 줄은 제거됩니다.
- `progress.maxLineChars`: 잘리기 전 간결한 진행률 줄당 최대 문자 수입니다.
- `progress.toolProgress`: `true`(기본값)이면 실시간 도구/진행 활동이 초안에 표시됩니다.

| `streaming.mode`  | 동작                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (기본값) | 전체 응답을 기다렸다가 한 번 전송합니다.                                                                                                                      |
| `"partial"`       | 모델이 현재 블록을 작성하는 동안 일반 텍스트 메시지 하나를 그 자리에서 편집합니다. 기본 클라이언트는 최종 편집이 아니라 첫 번째 미리 보기에서 알림을 표시할 수 있습니다.          |
| `"quiet"`         | `"partial"`과 동일하지만 메시지는 알림을 생성하지 않는 공지입니다. 사용자별 푸시 규칙이 최종 편집과 일치하면 수신자에게 한 번 알림이 전송됩니다(아래 참조). |
| `"progress"`      | 진행률 초안을 사용해 개별적인 간결한 진행률 줄을 전송합니다.                                                                                          |

`streaming.block.enabled`(기본값 `false`)은 `streaming.mode`과 독립적입니다.

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (기본값)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 현재 블록의 실시간 초안을 표시하고 완료된 블록을 메시지로 유지합니다. | 현재 블록의 실시간 초안을 표시하고 그 자리에서 최종 확정합니다. |
| `"off"`                 | 완료된 블록마다 알림을 생성하는 Matrix 메시지 하나를 전송합니다.                     | 전체 응답에 대해 알림을 생성하는 Matrix 메시지 하나를 전송합니다.      |

참고:

- 미리 보기가 Matrix의 이벤트당 크기 제한을 초과하면 OpenClaw는 미리 보기 스트리밍을 중단하고 최종 응답만 전달하는 방식으로 대체합니다.
- 미디어 응답은 항상 첨부 파일을 일반 방식으로 전송합니다. 오래된 미리 보기를 안전하게 재사용할 수 없으면 OpenClaw는 최종 미디어 응답을 보내기 전에 이를 삭제 처리합니다.
- 미리 보기 스트리밍이 활성화된 경우 도구 진행률 미리 보기 업데이트는 기본적으로 켜져 있습니다. 답변 텍스트의 미리 보기 편집은 유지하되 도구 진행률은 일반 전달 경로로 보내려면 `streaming.preview.toolProgress: false`를 설정하십시오.
- 미리 보기 편집에는 추가 Matrix API 호출이 필요합니다. 가장 보수적인 속도 제한 프로필에는 `streaming.mode: "off"`을 유지하십시오.
- 레거시 스칼라/불리언 `streaming` 값과 평면 `blockStreaming` / `chunkMode` 키는 `openclaw doctor --fix`에 의해 이 중첩 구조로 다시 작성됩니다.

## 음성 메시지

수신되는 Matrix 음성 메모는 방 멘션 게이트보다 먼저 전사되므로, `requireMention: true` 방에서 봇 이름을 말하는 음성 메모가 에이전트를 트리거할 수 있으며 에이전트는 오디오 첨부 파일 자리표시자만 받는 대신 전사문을 받습니다.

Matrix는 OpenAI `gpt-4o-mini-transcribe` 같은 `tools.media.audio` 아래의 공유 오디오 미디어 제공자를 사용합니다. 제공자 설정 및 제한은 [미디어 도구 개요](/ko/tools/media-overview)를 참조하십시오.

- `m.audio` 이벤트와 `audio/*` MIME 유형의 `m.file` 이벤트가 대상입니다.
- 암호화된 방에서 OpenClaw는 텍스트 변환 전에 기존 Matrix 미디어 경로를 통해 첨부 파일을 복호화합니다.
- 변환된 텍스트는 에이전트 프롬프트에서 기계가 생성한 신뢰할 수 없는 콘텐츠로 표시됩니다.
- 다운스트림 미디어 도구가 첨부 파일을 다시 텍스트로 변환하지 않도록 이미 변환된 것으로 표시합니다.
- 오디오 텍스트 변환을 전역으로 비활성화하려면 `tools.media.audio.enabled: false`을 설정하십시오.

## 승인 메타데이터

Matrix 네이티브 승인 프롬프트는 `com.openclaw.approval` 키 아래에 OpenClaw 전용 콘텐츠가 포함된 일반 `m.room.message` 이벤트입니다. 기본 클라이언트에서도 텍스트 본문을 렌더링하며, OpenClaw를 인식하는 클라이언트는 구조화된 승인 ID, 종류, 상태, 결정 및 실행/Plugin 세부 정보를 읽을 수 있습니다.

프롬프트가 Matrix 이벤트 하나에 담기에는 너무 길면 OpenClaw는 표시되는 텍스트를 여러 청크로 나누고 첫 번째 청크에만 `com.openclaw.approval`을 첨부합니다. 허용/거부 반응은 해당 첫 번째 이벤트에 연결되므로 긴 프롬프트도 단일 이벤트 프롬프트와 동일한 승인 대상을 유지합니다.

### 조용한 최종 미리보기를 위한 자체 호스팅 푸시 규칙

`streaming.mode: "quiet"`은 블록 또는 턴이 최종 확정된 후에만 수신자에게 알립니다. 사용자별 푸시 규칙이 최종 확정된 미리보기 마커와 일치해야 합니다. 전체 설정 방법은 [조용한 미리보기를 위한 Matrix 푸시 규칙](/ko/channels/matrix-push-rules)을 참조하십시오.

## 봇 간 통신 방

기본적으로 구성된 다른 OpenClaw Matrix 계정에서 보낸 Matrix 메시지는 무시됩니다. 에이전트 간 트래픽을 의도적으로 허용하려면 `allowBots`을 사용하십시오.

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

- `allowBots: true`은 허용된 방과 DM에서 구성된 다른 Matrix 봇 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`은 방에서 해당 메시지가 이 봇을 명시적으로 멘션할 때만 수락하며, DM은 이에 관계없이 계속 허용됩니다.
- `groups.<room>.allowBots`은 특정 방 하나에 대해 계정 수준 설정을 재정의합니다.
- 수락된 구성 봇 메시지는 공유 [봇 루프 방지](/ko/channels/bot-loop-protection)를 사용합니다. `channels.defaults.botLoopProtection`을 구성한 다음, 계정별로 `channels.matrix.botLoopProtection`을 사용하거나 방별로 `channels.matrix.groups.<room>.botLoopProtection`을 사용하여 재정의하십시오.
- OpenClaw는 자기 응답 루프를 방지하기 위해 동일한 Matrix 사용자 ID에서 온 메시지를 계속 무시합니다.
- Matrix에는 네이티브 봇 플래그가 없습니다. OpenClaw는 "봇이 작성함"을 "이 OpenClaw Gateway에 구성된 다른 Matrix 계정이 전송함"으로 간주합니다.

공유 방에서 봇 간 트래픽을 활성화할 때는 엄격한 방 허용 목록과 멘션 요구 사항을 사용하십시오.

## 암호화 및 검증

암호화된(E2EE) 방에서 발신 이미지 이벤트는 `thumbnail_file`을 사용하므로 이미지 미리보기도 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 방에서는 일반 `thumbnail_url`을 사용합니다. 별도의 구성은 필요하지 않으며 Plugin이 E2EE 상태를 자동으로 감지합니다.

모든 `openclaw matrix` 명령은 `--verbose`(전체 진단), `--json`(기계 판독 가능 출력), `--account <id>`(다중 계정 설정)를 지원합니다. 출력은 기본적으로 간결합니다.

### 암호화 활성화

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

비밀 저장소와 교차 서명을 부트스트랩하고, 필요한 경우 방 키 백업을 생성한 다음 상태와 다음 단계를 출력합니다. 유용한 플래그는 다음과 같습니다.

- `--recovery-key-stdin`은 프로세스 인수에 노출하지 않고 stdin에서 복구 키를 읽습니다. 호환성을 위해 `--recovery-key <key>`도 계속 사용할 수 있습니다.
- `--force-reset-cross-signing`은 현재 교차 서명 ID를 폐기하고 새 ID를 생성합니다(의도적인 경우에만 사용).

새 계정의 경우 생성 시 E2EE를 활성화하십시오.

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption`은 `--enable-e2ee`의 별칭입니다. 이에 해당하는 수동 구성은 다음과 같습니다.

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

`verify status`은 세 가지 독립적인 신뢰 신호를 보고합니다(`--verbose`은 이 신호를 모두 표시합니다).

- `Locally trusted`: 이 클라이언트에서만 신뢰함
- `Cross-signing verified`: SDK가 교차 서명을 통한 검증을 보고함
- `Signed by owner`: 자신의 자체 서명 키로 서명됨(진단 전용)

`Cross-signing verified`이 `yes`인 경우에만 `Verified by owner`이 `yes`입니다. 로컬 신뢰 또는 소유자 서명만으로는 충분하지 않습니다.

`--allow-degraded-local-state`은 먼저 Matrix 계정을 준비하지 않고도 최선형 진단 결과를 반환합니다. 오프라인 또는 부분적으로 구성된 상태를 점검할 때 유용합니다.

### 복구 키로 이 기기 검증

복구 키를 명령줄 인수로 전달하지 말고 stdin으로 파이프하십시오.

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

이 명령은 세 가지 상태를 보고합니다.

- `Recovery key accepted`: Matrix가 비밀 저장소 또는 기기 신뢰에 사용할 키를 수락했습니다.
- `Backup usable`: 신뢰할 수 있는 복구 자료를 사용하여 방 키 백업을 불러올 수 있습니다.
- `Device verified by owner`: 이 기기가 Matrix 교차 서명 ID를 완전히 신뢰합니다.

복구 키로 백업 자료의 잠금을 해제했더라도 전체 ID 신뢰가 완료되지 않으면 0이 아닌 코드로 종료됩니다. 이 경우 다른 Matrix 클라이언트에서 자체 검증을 완료하십시오.

```bash
openclaw matrix verify self
```

`verify self`은 성공적으로 종료하기 전에 `Cross-signing verified: yes`을 기다립니다. 대기 시간을 조정하려면 `--timeout-ms <ms>`을 사용하십시오.

리터럴 키 형식인 `openclaw matrix verify device "<recovery-key>"`도 작동하지만 키가 셸 기록에 남습니다.

### 교차 서명 부트스트랩 또는 복구

```bash
openclaw matrix verify bootstrap
```

암호화된 계정을 위한 복구/설정 명령입니다. 다음 순서로 실행됩니다.

- 가능하면 기존 복구 키를 재사용하여 비밀 저장소를 부트스트랩합니다.
- 교차 서명을 부트스트랩하고 누락된 공개 키를 업로드합니다.
- 현재 기기를 표시하고 교차 서명합니다.
- 서버 측 방 키 백업이 아직 없으면 생성합니다.

홈서버에서 교차 서명 키를 업로드할 때 UIA를 요구하면 OpenClaw는 먼저 인증 없이 시도하고, 그다음 `m.login.dummy`, 이어서 `m.login.password`을 시도합니다(`channels.matrix.password` 필요).

유용한 플래그는 다음과 같습니다.

- `--recovery-key-stdin`(`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`과 함께 사용) 또는 `--recovery-key <key>`
- `--force-reset-cross-signing`은 현재 교차 서명 ID를 폐기합니다(의도적인 경우에만 사용하며, 활성 복구 키가 저장되어 있거나 `--recovery-key-stdin`을 통해 제공되어야 함).

### 방 키 백업

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`은 서버 측 백업의 존재 여부와 이 기기에서 해당 백업을 복호화할 수 있는지를 표시합니다. `backup restore`은 백업된 방 키를 로컬 암호화 저장소로 가져옵니다. 복구 키가 이미 디스크에 있으면 `--recovery-key-stdin`을 생략하십시오.

손상된 백업을 새로운 기준 상태로 교체하려면 다음 명령을 사용하십시오. 복구할 수 없는 이전 기록이 손실될 수 있음을 수락하며, 현재 백업 비밀을 불러올 수 없는 경우 비밀 저장소도 다시 생성할 수 있습니다.

```bash
openclaw matrix verify backup reset --yes
```

이전 복구 키로 새 백업 기준 상태의 잠금을 의도적으로 해제할 수 없게 하려는 경우에만 `--rotate-recovery-key`을 추가하십시오.

### 검증 목록 조회, 요청 및 응답

```bash
openclaw matrix verify list
```

선택한 계정의 대기 중인 검증 요청을 나열합니다.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

이 계정에서 검증 요청을 보냅니다. `--own-user`은 자체 검증을 요청합니다(동일한 사용자의 다른 Matrix 클라이언트에서 프롬프트를 수락). `--user-id`/`--device-id`/`--room-id`은 다른 사람을 대상으로 합니다. `--own-user`은 다른 대상 지정 플래그와 함께 사용할 수 없습니다.

하위 수준의 수명 주기 처리(일반적으로 다른 클라이언트에서 들어오는 요청을 추적하는 동안)를 위해 다음 명령은 특정 요청 `<id>`에 대해 작동합니다(`verify list` 및 `verify request`에서 출력).

| 명령                                       | 용도                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 수신 요청 수락                                                      |
| `openclaw matrix verify start <id>`        | SAS 흐름 시작                                                       |
| `openclaw matrix verify sas <id>`          | SAS 이모지 또는 숫자 출력                                           |
| `openclaw matrix verify confirm-sas <id>`  | SAS가 다른 클라이언트에 표시된 내용과 일치함을 확인                 |
| `openclaw matrix verify mismatch-sas <id>` | 이모지 또는 숫자가 일치하지 않으면 SAS 거부                         |
| `openclaw matrix verify cancel <id>`       | 취소. 선택적 `--reason <text>` 및 `--code <matrix-code>`을 받음       |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, `cancel`은 검증이 특정 다이렉트 메시지 방에 연결된 경우 모두 `--user-id` 및 `--room-id`을 DM 후속 처리 힌트로 받습니다.

### 다중 계정 참고 사항

`--account <id>`이 없으면 Matrix CLI 명령은 암시적 기본 계정을 사용합니다. 이름이 지정된 계정이 여러 개이고 `channels.matrix.defaultAccount`이 없으면 명령은 임의로 추측하지 않고 계정을 선택하도록 요청합니다. 이름이 지정된 계정에서 E2EE가 비활성화되어 있거나 사용할 수 없으면 오류가 해당 계정의 구성 키를 가리킵니다(예: `channels.matrix.accounts.assistant.encryption`).

<AccordionGroup>
  <Accordion title="시작 동작">
    `encryption: true`을 사용하면 `startupVerification`의 기본값은 `"if-unverified"`입니다. 시작 시 검증되지 않은 기기는 다른 Matrix 클라이언트에 자체 검증을 요청하며, 중복 요청은 건너뛰고 대기 시간을 적용합니다(기본값 24시간). `startupVerificationCooldownHours`으로 조정하거나 `startupVerification: "off"`으로 비활성화하십시오.

    시작 시 현재 비밀 저장소와 교차 서명 ID를 재사용하는 보수적인 암호화 부트스트랩 절차도 실행됩니다. 부트스트랩 상태가 손상된 경우 OpenClaw는 `channels.matrix.password`이 없어도 보호된 복구를 시도합니다. 홈서버에서 비밀번호 UIA를 요구하면 시작 과정에서 경고를 기록하지만 치명적 오류로 처리하지 않습니다. 이미 소유자가 서명한 기기는 보존됩니다.

    전체 업그레이드 흐름은 [Matrix 마이그레이션](/ko/channels/matrix-migration)을 참조하십시오.

  </Accordion>

  <Accordion title="검증 알림">
    Matrix는 검증 수명 주기 알림을 엄격한 DM 검증 방에 `m.notice` 메시지로 게시합니다. 여기에는 요청, 준비("이모지로 검증" 안내 포함), 시작/완료 및 사용 가능한 경우 SAS(이모지/숫자) 세부 정보가 포함됩니다.

    다른 Matrix 클라이언트에서 들어오는 요청은 추적되고 자동으로 수락됩니다. 자체 검증의 경우 OpenClaw는 SAS 흐름을 자동으로 시작하고 이모지 검증을 사용할 수 있게 되면 자체 측을 확인합니다. 그래도 Matrix 클라이언트에서 이모지를 비교하고 "They match"를 확인해야 합니다.

    검증 시스템 알림은 에이전트 채팅 파이프라인으로 전달되지 않습니다.

  </Accordion>

  <Accordion title="삭제되었거나 유효하지 않은 Matrix 기기">
    `verify status`에서 현재 기기가 더 이상 홈서버 목록에 없다고 표시하면 새 OpenClaw Matrix 기기를 생성하십시오. 비밀번호 로그인의 경우:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    토큰 인증의 경우 Matrix 클라이언트 또는 관리 UI에서 새 액세스 토큰을 생성한 다음 OpenClaw를 업데이트하십시오.

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    실패한 명령의 계정 ID로 `assistant`을(를) 바꾸거나, 기본 계정을 사용하려면 `--account`을(를) 생략하십시오.

  </Accordion>

  <Accordion title="기기 정리">
    OpenClaw에서 관리하는 오래된 기기가 누적될 수 있습니다. 목록을 확인하고 정리하십시오.

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="암호화 저장소">
    Matrix E2EE는 `fake-indexeddb`을(를) IndexedDB shim으로 사용하여 공식 `matrix-js-sdk` Rust 암호화 경로를 사용합니다. 암호화 상태는 `crypto-idb-snapshot.json`에 유지됩니다(제한적인 파일 권한).

    암호화된 런타임 상태는 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 아래에 있으며 동기화 저장소, 암호화 저장소, 복구 키, IDB 스냅샷, 스레드 바인딩 및 시작 검증 상태를 포함합니다. 토큰이 변경되어도 계정 ID가 동일하면 OpenClaw는 이전 상태가 계속 표시되도록 기존 루트 중 가장 적합한 루트를 재사용합니다.

    하나의 이전 토큰 해시 루트는 정상적인 토큰 교체 연속성 경로일 수 있습니다. OpenClaw가 `matrix: multiple populated token-hash storage roots detected`을(를) 기록하면 계정 디렉터리를 검사하고, 선택된 활성 루트가 정상임을 확인한 후에만 오래된 형제 루트를 보관 처리하십시오. 오래된 루트를 즉시 삭제하기보다 `_archive/` 디렉터리로 이동하는 방식을 권장합니다.

  </Accordion>
</AccordionGroup>

## 프로필 관리

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

한 번의 호출에 두 옵션을 모두 전달하십시오. Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://`/`https://`을(를) 전달하면 먼저 파일을 업로드한 다음 확인된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 계정별 재정의)에 저장합니다.

## 스레드

Matrix는 자동 응답과 메시지 도구 전송 모두에 네이티브 스레드를 지원합니다. 서로 독립적인 두 설정으로 동작을 제어합니다.

### 세션 라우팅(`sessionScope`)

`dm.sessionScope`은(는) Matrix DM 방을 OpenClaw 세션에 매핑하는 방식을 결정합니다.

- `"per-user"`(기본값): 라우팅된 상대가 같은 모든 DM 방이 하나의 세션을 공유합니다.
- `"per-room"`: 상대가 같더라도 각 Matrix DM 방에 고유한 세션 키가 부여됩니다.

명시적 대화 바인딩은 항상 `sessionScope`보다 우선합니다. 바인딩된 방과 스레드는 선택한 대상 세션을 유지합니다.

### 응답 스레딩(`threadReplies`)

`threadReplies`은(는) 봇이 응답을 게시할 위치를 결정합니다.

- `"off"`: 응답은 최상위에 게시됩니다. 수신된 스레드 메시지는 상위 세션에 유지됩니다.
- `"inbound"`: 수신 메시지가 이미 해당 스레드에 있는 경우에만 스레드 안에서 응답합니다.
- `"always"`: 트리거 메시지를 루트로 하는 스레드 안에서 응답합니다. 해당 대화는 첫 번째 트리거부터 일치하는 스레드 범위 세션을 통해 라우팅됩니다.

`dm.threadReplies`은(는) DM에만 이 동작을 재정의합니다. 예를 들어 방 스레드는 격리된 상태로 유지하면서 DM은 평면적으로 유지할 수 있습니다.

### 스레드 상속 및 슬래시 명령

- 수신된 스레드 메시지는 스레드 루트 메시지를 추가 에이전트 컨텍스트로 포함합니다.
- 메시지 도구 전송은 명시적 `threadId`이(가) 제공되지 않는 한 같은 방(또는 같은 DM 사용자 대상)을 대상으로 할 때 현재 Matrix 스레드를 자동으로 상속합니다.
- DM 사용자 대상 재사용은 현재 세션 메타데이터에서 동일한 Matrix 계정의 동일한 DM 상대임이 확인되는 경우에만 적용됩니다. 그렇지 않으면 OpenClaw는 일반적인 사용자 범위 라우팅으로 대체합니다.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` 및 스레드에 바인딩된 `/acp spawn`은(는) 모두 Matrix 방과 DM에서 작동합니다.
- 최상위 `/focus`은(는) `threadBindings.spawnSessions`이(가) 활성화된 경우 새 Matrix 스레드를 만들고 대상 세션에 바인딩합니다.
- 기존 Matrix 스레드 안에서 `/focus` 또는 `/acp spawn --thread here`을(를) 실행하면 해당 스레드를 그 자리에서 바인딩합니다.

OpenClaw가 동일한 공유 세션에서 다른 DM 방과 충돌하는 Matrix DM 방을 감지하면 `/focus` 탈출구를 안내하고 `dm.sessionScope` 변경을 제안하는 일회성 `m.notice`을(를) 게시합니다. 이 알림은 스레드 바인딩이 활성화된 경우에만 표시됩니다.

## ACP 대화 바인딩

Matrix 방, DM 및 기존 Matrix 스레드는 채팅 화면을 변경하지 않고도 지속성 있는 ACP 작업 공간이 될 수 있습니다.

빠른 운영자 흐름:

- Matrix DM, 방 또는 기존 스레드 안에서 `/acp spawn codex --bind here`을(를) 실행하여 계속 사용하십시오.
- 최상위 DM 또는 방에서는 현재 DM/방이 채팅 화면으로 유지되며 이후 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- 기존 스레드 안에서 `--bind here`은(는) 현재 스레드를 그 자리에서 바인딩합니다.
- `/new` 및 `/reset`은(는) 바인딩된 동일한 ACP 세션을 그 자리에서 재설정합니다.
- `/acp close`은(는) ACP 세션을 닫고 바인딩을 제거합니다.

`--bind here`은(는) 하위 Matrix 스레드를 만들지 않습니다. OpenClaw가 하위 스레드를 만들거나 바인딩해야 하는 경우 `threadBindings.spawnSessions`이(가) `/acp spawn --thread auto|here`을(를) 제어합니다.

### 스레드 바인딩 구성

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며 채널별 재정의를 지원합니다.

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: 하위 에이전트 및 ACP 스레드 생성 모두를 제어합니다.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: 하위 에이전트 전용 또는 ACP 전용 생성에 대한 더 좁은 범위의 재정의입니다.
- `threadBindings.defaultSpawnContext`

Matrix 스레드 바인딩 세션 생성은 기본적으로 활성화되어 있습니다. 최상위 `/focus` 및 `/acp spawn --thread auto|here`이(가) Matrix 스레드를 생성하거나 바인딩하지 못하도록 하려면 `threadBindings.spawnSessions: false`을(를) 설정하십시오. 네이티브 하위 에이전트 스레드 생성 시 상위 트랜스크립트를 포크하지 않아야 하면 `threadBindings.defaultSpawnContext: "isolated"`을(를) 설정하십시오.

## 반응

Matrix는 발신 반응, 수신 반응 알림 및 확인 반응을 지원합니다.

발신 반응 도구는 `channels.matrix.actions.reactions`에 의해 제어됩니다.

- `react`은(는) Matrix 이벤트에 반응을 추가합니다.
- `reactions`은(는) Matrix 이벤트의 현재 반응 요약을 나열합니다.
- `emoji=""`은(는) 해당 이벤트에서 봇 자체의 반응을 제거합니다.
- `remove: true`은(는) 봇에서 지정된 이모지 반응만 제거합니다.

**확인 순서**(처음 정의된 값이 우선함):

| 설정                 | 순서                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | 계정별 -> 채널 -> `messages.ackReaction` -> 에이전트 ID 이모지 대체값   |
| `ackReactionScope`      | 계정별 -> 채널 -> `messages.ackReactionScope` -> 기본값 `"group-mentions"` |
| `reactionNotifications` | 계정별 -> 채널 -> 기본값 `"own"`                                           |

`reactionNotifications: "own"`은(는) 봇이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` 이벤트를 전달합니다. `"off"`은(는) 반응 시스템 이벤트를 비활성화합니다. 반응 제거는 시스템 이벤트로 합성되지 않습니다. Matrix에서는 이를 독립적인 `m.reaction` 제거가 아닌 편집 삭제로 표시합니다.

## 기록 컨텍스트

- `channels.matrix.historyLimit`은(는) 방 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함할 최근 방 메시지 수를 제어합니다. `messages.groupChat.historyLimit`으로 대체되며, 둘 다 설정되지 않은 경우 유효 기본값은 `0`입니다(비활성화됨).
- Matrix 방 기록은 해당 방에만 적용됩니다. DM에서는 일반 세션 기록을 계속 사용합니다.
- 방 기록은 대기 중인 메시지만 포함합니다. OpenClaw는 아직 응답을 트리거하지 않은 방 메시지를 버퍼링한 다음 멘션이나 다른 트리거가 도착하면 해당 범위의 스냅샷을 만듭니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않으며, 해당 턴의 기본 수신 본문에 유지됩니다.
- 동일한 Matrix 이벤트의 재시도는 더 새로운 방 메시지로 이동하지 않고 원래 기록 스냅샷을 재사용합니다.

## 컨텍스트 표시 범위

Matrix는 가져온 응답 텍스트, 스레드 루트 및 대기 중인 기록과 같은 보조 방 컨텍스트에 공유 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이(가) 기본값입니다. 보조 컨텍스트는 수신된 상태로 유지됩니다.
- `contextVisibility: "allowlist"`은(는) 활성 방/사용자 허용 목록 검사를 통과한 발신자의 보조 컨텍스트만 전송하도록 필터링합니다.
- `contextVisibility: "allowlist_quote"`은(는) `allowlist`처럼 동작하지만, 명시적으로 인용된 응답 하나는 계속 유지합니다.

이는 보조 컨텍스트의 표시 범위에만 영향을 주며 수신 메시지 자체가 응답을 트리거할 수 있는지에는 영향을 주지 않습니다. 트리거 권한 부여에는 계속해서 `groupPolicy`, `groups`, `groupAllowFrom` 및 DM 정책 설정이 사용됩니다.

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

방은 계속 작동하도록 유지하면서 DM을 완전히 차단하려면 `dm.enabled: false`을(를) 설정하십시오.

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

멘션 제어 및 허용 목록 동작은 [그룹](/ko/channels/groups)을 참조하십시오.

Matrix DM의 페어링 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면 OpenClaw는 동일한 대기 중 페어링 코드를 재사용하며, 새 코드를 생성하는 대신 짧은 대기 시간 후 알림 응답을 보낼 수 있습니다.

공유 DM 페어링 흐름 및 저장소 구조는 [페어링](/ko/channels/pairing)을 참조하십시오.

## 직접 방 복구

다이렉트 메시지 상태가 어긋나면 OpenClaw의 오래된 `m.direct` 매핑이 현재 DM이 아닌 이전의 단독 방을 가리킬 수 있습니다. 상대의 현재 매핑을 검사하십시오.

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

복구하십시오.

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

두 명령 모두 다중 계정 설정에 `--account <id>`을(를) 허용합니다. 복구 흐름은 다음과 같습니다.

- `m.direct`에 이미 매핑된 엄격한 1:1 DM을 우선합니다.
- 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 대체합니다.
- 정상적인 DM이 없으면 새로운 직접 방을 만들고 `m.direct`을(를) 다시 작성합니다.

이 작업은 이전 방을 자동으로 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑을 업데이트하여 이후 Matrix 전송, 검증 알림 및 기타 다이렉트 메시지 흐름이 올바른 방을 대상으로 하도록 합니다.

## 실행 승인

Matrix는 네이티브 승인 클라이언트 역할을 할 수 있습니다. `channels.matrix.execApprovals`(또는 계정별 재정의인 `channels.matrix.accounts.<account>.execApprovals`)에서 구성하십시오.

- `enabled`: Matrix 네이티브 프롬프트를 통해 승인을 전달합니다. 설정되지 않았거나 `"auto"`이면 승인자 한 명 이상을 확인할 수 있게 되는 즉시 자동으로 활성화됩니다. 명시적으로 비활성화하려면 `false`을(를) 설정하십시오.
- `approvers`: 실행 요청을 승인할 수 있는 Matrix 사용자 ID(`@owner:example.org`)입니다. `channels.matrix.dm.allowFrom`으로 대체됩니다.
- `target`: 프롬프트가 전달되는 위치입니다. `"dm"`(기본값)는 승인자의 DM으로 보내고, `"channel"`은(는) 요청이 시작된 방 또는 DM으로 보내며, `"both"`은(는) 양쪽 모두로 보냅니다.
- `agentFilter` / `sessionFilter`: Matrix 전달을 트리거할 에이전트/세션을 지정하는 선택적 허용 목록입니다.

승인 유형에 따라 권한 부여 방식이 약간 다릅니다.

- **실행 승인**은(는) `execApprovals.approvers`을(를) 사용하며, 없으면 `dm.allowFrom`을(를) 사용합니다.
- **Plugin 승인**은(는) `dm.allowFrom`만을 통해 권한을 부여합니다.

두 유형 모두 Matrix 반응 단축키와 메시지 업데이트를 공유합니다. 승인자는 기본 승인 메시지에서 반응 단축키를 볼 수 있습니다.

- ✅ 한 번만 허용
- ❌ 거부
- ♾️ 항상 허용(유효한 exec 정책에서 허용하는 경우)

대체 슬래시 명령: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

확인된 승인자만 승인하거나 거부할 수 있습니다. exec 승인을 채널로 전달할 때 명령 텍스트가 포함되므로 신뢰할 수 있는 방에서만 `channel` 또는 `both`을 활성화하십시오.

관련 항목: [Exec 승인](/ko/tools/exec-approvals).

## 슬래시 명령

슬래시 명령(`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` 등)은 DM에서 직접 작동합니다. 방에서는 OpenClaw가 봇 자체의 Matrix 멘션이 앞에 붙은 명령도 인식하므로 `@bot:server /new`은 사용자 지정 멘션 정규식 없이 명령 경로를 트리거합니다. 따라서 사용자가 명령을 입력하기 전에 봇 이름을 탭 완성할 때 Element 및 유사한 클라이언트가 생성하는 방 형식의 `@mention /command` 게시물에도 봇이 응답할 수 있습니다.

권한 부여 규칙은 그대로 적용됩니다. 명령 발신자는 일반 메시지와 동일한 DM 또는 방 허용 목록/소유자 정책을 충족해야 합니다.

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

- 계정에서 재정의하지 않는 한 최상위 `channels.matrix` 값이 명명된 계정의 기본값으로 사용됩니다.
- `groups.<room>.account`을 사용하여 상속된 방 항목의 범위를 특정 계정으로 한정하십시오. `account`이 없는 항목은 계정 간에 공유되며, 기본 계정이 최상위 수준에 구성된 경우에도 `account: "default"`은 계속 작동합니다.

**기본 계정 선택:**

- 암시적 라우팅, 프로브 및 CLI 명령에서 우선 사용할 명명된 계정을 선택하려면 `defaultAccount`을 설정하십시오.
- 계정이 여러 개이고 그중 하나의 이름이 문자 그대로 `default`인 경우, `defaultAccount`이 설정되지 않아도 OpenClaw가 해당 계정을 암시적으로 사용합니다.
- 명명된 계정이 여러 개이고 기본 계정이 선택되지 않은 경우 CLI 명령은 계정을 추측하지 않습니다. `defaultAccount`을 설정하거나 `--account <id>`을 전달하십시오.
- 최상위 `channels.matrix.*` 블록은 인증이 완료된 경우(`homeserver` + `accessToken` 또는 `homeserver` + `userId` + `password`)에만 암시적 `default` 계정으로 처리됩니다. 캐시된 자격 증명이 인증에 충분하면 명명된 계정은 `homeserver` + `userId`에서 계속 검색할 수 있습니다.

**승격:**

- OpenClaw가 복구 또는 설정 중 단일 계정 구성을 다중 계정으로 승격할 때, 기존의 명명된 계정이 있거나 `defaultAccount`이 이미 해당 계정을 가리키고 있으면 이를 유지합니다. Matrix 인증/부트스트랩 키만 승격된 계정으로 이동하며, 공유 전달 정책 키는 최상위 수준에 유지됩니다.

공유 다중 계정 패턴은 [구성 참조](/ko/gateway/config-channels#multi-account-all-channels)를 참조하십시오.

## 비공개/LAN 홈서버

기본적으로 OpenClaw는 SSRF 보호를 위해 계정별로 명시적으로 허용하지 않는 한 비공개/내부 Matrix 홈서버를 차단합니다.

홈서버가 localhost, LAN/Tailscale IP 또는 내부 호스트 이름에서 실행되는 경우 해당 계정에 대해 `network.dangerouslyAllowPrivateNetwork`을 활성화하십시오.

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

이 명시적 허용은 신뢰할 수 있는 비공개/내부 대상에만 적용됩니다. `http://matrix.example.org:8008`과 같은 공개 평문 홈서버는 계속 차단됩니다. 가능하면 항상 `https://`을 사용하십시오.

## Matrix 트래픽 프록시

Matrix 배포에 명시적인 아웃바운드 HTTP(S) 프록시가 필요한 경우 `channels.matrix.proxy`을 설정하십시오.

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

명명된 계정은 `channels.matrix.accounts.<id>.proxy`을 사용하여 최상위 기본값을 재정의할 수 있습니다. OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브에 동일한 프록시 설정을 사용합니다.

## 대상 확인

OpenClaw가 방 또는 사용자 대상을 요청하는 모든 위치에서 Matrix는 다음 대상 형식을 허용합니다.

- 사용자: `@user:server`, `user:@user:server` 또는 `matrix:user:@user:server`
- 방: `!room:server`, `room:!room:server` 또는 `matrix:room:!room:server`
- 별칭: `#alias:server`, `channel:#alias:server` 또는 `matrix:channel:#alias:server`

Matrix 방 ID는 대소문자를 구분합니다. 명시적 전달 대상, cron 작업, 바인딩 또는 허용 목록을 구성할 때 Matrix의 정확한 방 ID 대소문자를 사용하십시오. OpenClaw는 저장을 위해 내부 세션 키를 정규 형식으로 유지하므로 이러한 소문자 키는 Matrix 전달 ID의 신뢰할 수 있는 출처가 아닙니다.

실시간 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다.

- 사용자 조회는 해당 홈서버의 Matrix 사용자 디렉터리를 쿼리합니다.
- 방 조회는 명시적 방 ID와 별칭을 직접 허용합니다. 참여한 방의 이름 조회는 최선형 방식이며 `dangerouslyAllowNameMatching: true`이 설정된 경우 런타임 방 허용 목록에만 적용됩니다.
- 방 이름을 ID 또는 별칭으로 확인할 수 없으면 런타임 허용 목록 확인에서 무시됩니다.

## 구성 참조

허용 목록 형식의 사용자 필드(`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`)에는 전체 Matrix 사용자 ID를 사용할 수 있으며, 이것이 가장 안전합니다. ID가 아닌 항목은 기본적으로 무시됩니다. `dangerouslyAllowNameMatching: true`이 설정되면 정확히 일치하는 Matrix 디렉터리 표시 이름이 시작 시 그리고 모니터 실행 중 허용 목록이 변경될 때마다 확인되며, 확인할 수 없는 항목은 런타임에 무시됩니다.

방 허용 목록 키(`groups`, 레거시 `rooms`)는 방 ID 또는 별칭이어야 합니다. 일반 방 이름 키는 기본적으로 무시되며, `dangerouslyAllowNameMatching: true`을 사용하면 참여한 방 이름을 대상으로 한 최선형 조회가 복원됩니다.

### 계정 및 연결

- `enabled`: 채널을 활성화하거나 비활성화합니다.
- `name`: 계정의 선택적 표시 레이블입니다.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 우선 사용할 계정 ID입니다.
- `accounts`: 명명된 계정별 재정의입니다. 최상위 `channels.matrix` 값은 기본값으로 상속됩니다.
- `homeserver`: 홈서버 URL입니다(예: `https://matrix.example.org`).
- `network.dangerouslyAllowPrivateNetwork`: 이 계정이 `localhost`, LAN/Tailscale IP 또는 내부 호스트 이름에 연결하도록 허용합니다.
- `proxy`: Matrix 트래픽을 위한 선택적 HTTP(S) 프록시 URL입니다. 계정별 재정의를 지원합니다.
- `userId`: 전체 Matrix 사용자 ID(`@bot:example.org`)입니다.
- `accessToken`: 토큰 기반 인증용 액세스 토큰입니다. env/file/exec 제공자에서 평문 및 SecretRef 값을 지원합니다([비밀 관리](/ko/gateway/secrets)).
- `password`: 비밀번호 기반 로그인용 비밀번호입니다. 평문 및 SecretRef 값을 지원합니다.
- `deviceId`: 명시적 Matrix 기기 ID입니다.
- `deviceName`: 비밀번호 로그인 시 사용하는 기기 표시 이름입니다.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트를 위해 저장되는 자체 아바타 URL입니다.
- `initialSyncLimit`: 시작 동기화 중 가져올 최대 이벤트 수입니다.

### 암호화

- `encryption`: E2EE를 활성화합니다. 기본값: `false`.
- `startupVerification`: `"if-unverified"`(E2EE가 켜져 있을 때의 기본값) 또는 `"off"`입니다. 이 기기가 확인되지 않은 경우 시작 시 자체 확인을 자동 요청합니다.
- `startupVerificationCooldownHours`: 다음 자동 시작 요청 전의 대기 시간입니다. 기본값: `24`.

### 접근 및 정책

- `groupPolicy`: `"open"`, `"allowlist"` 또는 `"disabled"`입니다. 기본값: `"allowlist"`.
- `groupAllowFrom`: 방 트래픽에 허용되는 사용자 ID 목록입니다.
- `mentionPatterns`: 방 멘션에 적용되는 범위 지정 정규식 패턴입니다. `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`이 포함된 객체입니다. 구성된 `agents.list[].groupChat.mentionPatterns`이 방별로 적용되는지를 제어합니다.
- `dm.enabled`: `false`인 경우 모든 DM을 무시합니다. 기본값: `true`.
- `dm.policy`: `"pairing"`(기본값), `"allowlist"`, `"open"` 또는 `"disabled"`입니다. 봇이 참여한 후 방을 DM으로 분류하면 적용되며, 초대 처리에는 영향을 주지 않습니다.
- `dm.allowFrom`: DM 트래픽에 허용되는 사용자 ID 목록입니다.
- `dm.sessionScope`: `"per-user"`(기본값) 또는 `"per-room"`입니다.
- `dm.threadReplies`: 답글 스레딩에 대한 DM 전용 재정의입니다(`"off"`, `"inbound"`, `"always"`).
- `allowBots`: 구성된 다른 Matrix 봇 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `allowlistOnly`: `true`인 경우 모든 활성 DM 정책(`"disabled"` 제외)과 `"open"` 그룹 정책을 `"allowlist"`로 강제합니다. `"disabled"` 정책은 변경하지 않습니다.
- `dangerouslyAllowNameMatching`: `true`인 경우 사용자 허용 목록 항목에 대해 Matrix 표시 이름 디렉터리 조회를 허용하고 방 허용 목록 키에 대해 참여한 방 이름 조회를 허용합니다. 전체 `@user:server` ID와 방 ID 또는 별칭을 사용하는 것이 좋습니다.
- `autoJoin`: `"always"`, `"allowlist"` 또는 `"off"`입니다. 기본값: `"off"`. DM 형식 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `"allowlist"`일 때 허용되는 방/별칭입니다. 별칭 항목은 초대된 방이 주장하는 상태가 아니라 홈서버를 기준으로 확인됩니다.
- `contextVisibility`: 보조 컨텍스트 가시성입니다(`"all"` 기본값, `"allowlist"`, `"allowlist_quote"`).

### 답글 동작

- `replyToMode`: `"off"`(기본값), `"first"`, `"all"` 또는 `"batched"`.
- `threadReplies`: `"off"`(명시적으로 설정하지 않으면 최상위 기본값은 `"inbound"`로 해석됨), `"inbound"` 또는 `"always"`.
- `threadBindings`: 스레드에 바인딩된 세션 라우팅 및 수명 주기에 대한 채널별 재정의입니다.
- `streaming`: 중첩 객체 `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode`은 `"off"`(기본값), `"partial"`, `"quiet"` 또는 `"progress"`입니다. 레거시 스칼라/불리언 표기는 `openclaw doctor --fix`을 통해 마이그레이션됩니다.
- `streaming.block.enabled`: `true`일 때 완료된 어시스턴트 블록을 별도의 진행 상황 메시지로 유지합니다. 기본값: `false`.
- `markdown`: 발신 텍스트에 대한 선택적 Markdown 렌더링 구성입니다.
- `responsePrefix`: 발신 답변 앞에 추가되는 선택적 문자열입니다.
- `textChunkLimit`: `streaming.chunkMode: "length"`일 때 발신 청크 크기(문자 수)입니다. 기본값: `4000`.
- `streaming.chunkMode`: `"length"`(기본값, 문자 수를 기준으로 분할) 또는 `"newline"`(줄 경계에서 분할).
- `historyLimit`: 대화방 메시지가 에이전트를 트리거할 때 `InboundHistory`으로 포함할 최근 대화방 메시지 수입니다. `messages.groupChat.historyLimit`로 폴백하며, 실질적 기본값은 `0`(비활성화)입니다.
- `mediaMaxMb`: 발신 전송 및 수신 처리의 미디어 크기 상한(MB)입니다. 기본값: `20`.

### 반응 설정

- `ackReaction`: 이 채널/계정의 확인 반응 재정의입니다.
- `ackReactionScope`: 범위 재정의(`"group-mentions"` 기본값, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: 수신 반응 알림 모드(`"own"` 기본값, `"off"`).

### 도구 및 대화방별 재정의

- `actions`: 작업별 도구 게이팅(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: 대화방별 정책 맵입니다. 세션 ID는 해석 후 안정적인 대화방 ID를 사용합니다. (`rooms`은 레거시 별칭입니다.)
  - `groups.<room>.account`: 상속된 대화방 항목 하나를 특정 계정으로 제한합니다.
  - `groups.<room>.enabled`: 대화방별 토글입니다. `false`일 때 해당 대화방은 맵에 없는 것처럼 무시됩니다.
  - `groups.<room>.requireMention`: 채널 수준 멘션 요구 사항의 대화방별 재정의입니다.
  - `groups.<room>.allowBots`: 채널 수준 설정의 대화방별 재정의(`true` 또는 `"mentions"`)입니다.
  - `groups.<room>.botLoopProtection`: 봇 간 루프 보호 예산의 대화방별 재정의입니다.
  - `groups.<room>.users`: 대화방별 발신자 허용 목록입니다.
  - `groups.<room>.tools`: 대화방별 도구 허용/거부 재정의입니다.
  - `groups.<room>.autoReply`: 대화방별 멘션 게이팅 재정의입니다. `true`은 해당 대화방의 멘션 요구 사항을 비활성화하며, `false`는 다시 강제로 활성화합니다.
  - `groups.<room>.skills`: 대화방별 스킬 필터입니다.
  - `groups.<room>.systemPrompt`: 대화방별 시스템 프롬프트 조각입니다.

### 실행 승인 설정

- `execApprovals.enabled`: Matrix 네이티브 프롬프트를 통해 실행 승인을 전달합니다.
- `execApprovals.approvers`: 승인할 수 있는 Matrix 사용자 ID입니다. `dm.allowFrom`로 폴백합니다.
- `execApprovals.target`: `"dm"`(기본값), `"channel"` 또는 `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 전달을 위한 선택적 에이전트/세션 허용 목록입니다.

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 액세스 모델 및 보안 강화
