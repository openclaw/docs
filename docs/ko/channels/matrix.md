---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 인증 구성하기
summary: Matrix 지원 상태, 설정 및 구성 예시
title: Matrix
x-i18n:
    generated_at: "2026-07-12T14:58:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix는 공식 `matrix-js-sdk`를 기반으로 구축된 다운로드 가능한 채널 Plugin(`@openclaw/matrix`)입니다. DM, 방, 스레드, 미디어, 반응, 설문 조사, 위치 및 E2EE를 지원합니다.

## 설치

```bash
openclaw plugins install @openclaw/matrix
```

출처가 지정되지 않은 Plugin 사양은 먼저 ClawHub를 시도한 후 npm으로 대체합니다. `openclaw plugins install clawhub:@openclaw/matrix` 또는 `npm:@openclaw/matrix`를 사용하여 출처를 강제할 수 있습니다. 로컬 체크아웃에서는 `openclaw plugins install ./path/to/local/matrix-plugin`을 사용합니다.

`plugins install`은 Plugin을 등록하고 활성화하므로 별도의 `enable` 단계가 필요하지 않습니다. 아래와 같이 구성하기 전까지는 채널이 아무 작업도 수행하지 않습니다. 일반적인 설치 규칙은 [Plugin](/ko/tools/plugin)을 참조하십시오.

## 설정

1. 홈서버에서 Matrix 계정을 생성합니다.
2. `channels.matrix`를 `homeserver` + `accessToken` 또는 `homeserver` + `userId` + `password`로 구성합니다.
3. Gateway를 다시 시작합니다.
4. 봇과 DM을 시작하거나 봇을 방에 초대합니다. 새 초대는 [`autoJoin`](#auto-join)이 허용하는 경우에만 수락됩니다.

### 대화형 설정

```bash
openclaw channels add
openclaw configure --section channels
```

마법사는 홈서버 URL, 인증 방식(토큰 또는 비밀번호), 사용자 ID(비밀번호 인증에만 해당), 선택적 기기 이름, E2EE 활성화 여부, 방 액세스/자동 참여를 묻습니다. 일치하는 `MATRIX_*` 환경 변수가 이미 존재하고 계정에 저장된 인증 정보가 없으면 마법사가 환경 변수 바로 가기를 제안합니다. 허용 목록을 저장하기 전에 `openclaw channels resolve --channel matrix "Project Room"`을 사용하여 방 이름을 확인하십시오. 마법사에서 E2EE를 활성화하면 [`openclaw matrix encryption setup`](#encryption-and-verification)과 동일한 부트스트랩이 실행됩니다.

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
      password: "replace-me", // pragma: 허용 목록 보안 비밀
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### 자동 참여

`channels.matrix.autoJoin`의 기본값은 `"off"`입니다. 수동으로 참여하기 전까지 봇은 새 초대로 생성된 새 방이나 DM에 나타나지 않습니다. OpenClaw는 초대 시점에 초대가 DM인지 그룹인지 구분할 수 없으므로 모든 초대는 먼저 `autoJoin`을 거칩니다. `dm.policy`는 봇이 참여하고 방이 분류된 후에만 적용됩니다.

<Warning>
수락할 초대를 제한하려면 `autoJoin: "allowlist"`와 `autoJoinAllowlist`를 설정하고, 모든 초대를 수락하려면 `autoJoin: "always"`를 설정하십시오.

`autoJoinAllowlist`는 `!roomId:server`, `#alias:server` 또는 `*`만 허용합니다. 일반 방 이름은 거부됩니다. 별칭은 초대된 방이 주장하는 상태가 아니라 홈서버를 기준으로 확인됩니다.
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

- DM(`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): `@user:server`를 사용합니다. 표시 이름은 변경될 수 있으므로 기본적으로 무시됩니다. 표시 이름 호환성이 명시적으로 필요한 경우에만 `dangerouslyAllowNameMatching: true`를 설정하십시오.
- 방 허용 목록 키(`groups`, 레거시 별칭 `rooms`): `!room:server` 또는 `#alias:server`를 사용합니다. `dangerouslyAllowNameMatching: true`가 아니면 일반 이름은 무시됩니다.
- 초대 허용 목록(`autoJoinAllowlist`): `!room:server`, `#alias:server` 또는 `*`를 사용합니다. 일반 이름은 항상 거부됩니다.

### 계정 ID 정규화

마법사는 알아보기 쉬운 이름을 정규화된 계정 ID로 변환합니다(`Ops Bot` -> `ops-bot`). 계정 간 충돌을 방지하기 위해 범위가 지정된 환경 변수 이름에서 문장 부호는 16진수로 이스케이프됩니다. `-`(0x2D)는 `_X2D_`가 되므로 `ops-prod`는 환경 변수 접두사 `MATRIX_OPS_X2D_PROD_`에 매핑됩니다.

### 캐시된 자격 증명

Matrix는 `~/.openclaw/credentials/matrix/` 아래에 자격 증명을 캐시합니다. 기본 계정에는 `credentials.json`, 명명된 계정에는 `credentials-<account>.json`을 사용합니다. 캐시된 자격 증명이 있으면 구성 파일에 `accessToken`이 없어도 OpenClaw는 Matrix가 구성된 것으로 간주합니다. 이는 설정, `openclaw doctor` 및 채널 상태 검사에 적용됩니다.

### 환경 변수

동등한 구성 키가 설정되지 않았을 때 사용되는 구성 키 기반 환경 변수입니다. 기본 계정은 접두사가 없는 이름을 사용하고, 명명된 계정은 접미사 앞에 계정 토큰을 삽입합니다([정규화](#account-id-normalization) 참조).

| 기본 계정             | 명명된 계정(`<ID>` = 계정 토큰)      |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

계정 `ops`의 경우 이름은 `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` 등이 됩니다. `MATRIX_HOMESERVER` 및 범위가 지정된 모든 `*_HOMESERVER` 변형은 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참조하십시오.

<Note>
복구 키는 구성 기반 환경 변수가 아닙니다. OpenClaw는 환경 자체에서 복구 키를 읽지 않습니다. CLI 안내문에서는 기본 계정의 경우 `MATRIX_RECOVERY_KEY`, 명명된 계정의 경우 `MATRIX_RECOVERY_KEY_<ID>`라는 셸 변수(16진수 이스케이프 없이 단순히 대문자로 변환한 계정 ID)를 통해 복구 키를 전달하도록 제안합니다. [복구 키로 이 기기 확인](#verify-this-device-with-a-recovery-key)을 참조하십시오.
</Note>

## 구성 예시

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
      streaming: "partial",
    },
  },
}
```

## 스트리밍 미리보기

Matrix 응답 스트리밍은 명시적으로 활성화해야 합니다. `streaming`은 OpenClaw가 생성 중인 어시스턴트 응답을 전달하는 방식을 제어하고, `blockStreaming`은 완료된 각 블록을 별도의 Matrix 메시지로 유지할지를 제어합니다.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

실시간 답변 미리보기는 유지하면서 중간 도구/진행 상황 줄을 숨기려면 객체 형식을 사용하십시오.

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

전체 객체 형식은 `{ mode, preview, progress }`를 허용합니다.

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // 구성된 레이블 또는 기본 제공 레이블에서 선택합니다(숨기려면 false)
          labels: ["Thinking", "Writing", "Searching"], // label: "auto"의 후보
          maxLines: 8, // 순환식 진행 상황 줄의 최대 개수(기본값: 8)
          maxLineChars: 120, // 잘리기 전 각 줄의 최대 문자 수(기본값: 120)
          toolProgress: true, // 도구/진행 상황 활동을 표시합니다(기본값: true)
        },
      },
    },
  },
}
```

- `progress.label`: 사용자 지정 레이블, 구성된 레이블이나 기본 제공 레이블을 선택하려면 `"auto"`/미설정, 숨기려면 `false`를 사용합니다.
- `progress.labels`: `label`이 `"auto"`이거나 설정되지 않은 경우에만 사용되는 후보입니다.
- `progress.maxLines`: 초안에 유지되는 순환식 진행 상황 줄의 최대 개수입니다. 이를 초과하는 이전 줄은 제거됩니다.
- `progress.maxLineChars`: 잘리기 전 간결한 진행 상황 줄 하나의 최대 문자 수입니다.
- `progress.toolProgress`: `true`(기본값)이면 실시간 도구/진행 상황 활동이 초안에 표시됩니다.

| `streaming`       | 동작                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (기본값)  | 전체 응답을 기다린 후 한 번 전송합니다. `true` <-> `"partial"`, `false` <-> `"off"`입니다.                                                                         |
| `"partial"`       | 모델이 현재 블록을 작성하는 동안 일반 텍스트 메시지 하나를 제자리에서 편집합니다. 기본 클라이언트는 최종 편집이 아니라 첫 미리보기에서 알림을 보낼 수 있습니다.          |
| `"quiet"`         | `"partial"`과 같지만 메시지가 알림을 발생시키지 않는 공지입니다. 사용자별 푸시 규칙이 최종 편집과 일치하면 수신자에게 한 번 알림이 전송됩니다(아래 참조).              |
| `"progress"`      | 진행 상황 초안을 사용하여 개별적인 간결한 진행 상황 줄을 전송합니다.                                                                                              |

`blockStreaming`(기본값 `false`)은 `streaming`과 독립적입니다.

| `streaming`             | `blockStreaming: true`                                            | `blockStreaming: false` (기본값)                     |
| ----------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 현재 블록의 실시간 초안, 완료된 블록은 메시지로 유지              | 현재 블록의 실시간 초안, 제자리에서 최종 확정        |
| `"off"`                 | 완료된 블록마다 알림을 발생시키는 Matrix 메시지 하나              | 전체 응답에 대해 알림을 발생시키는 Matrix 메시지 하나 |

참고:

- 미리보기가 Matrix의 이벤트당 크기 제한을 초과하면 OpenClaw는 미리보기 스트리밍을 중지하고 최종 응답만 전달하는 방식으로 대체합니다.
- 미디어 응답은 항상 첨부 파일을 정상적으로 전송합니다. 오래된 미리보기를 안전하게 재사용할 수 없으면 OpenClaw는 최종 미디어 응답을 보내기 전에 해당 미리보기를 삭제 처리합니다.
- 미리보기 스트리밍이 활성화되면 도구 진행 상황 미리보기 업데이트가 기본적으로 켜집니다. 답변 텍스트의 미리보기 편집은 유지하되 도구 진행 상황은 일반 전달 경로로 보내려면 `streaming.preview.toolProgress: false`를 설정하십시오.
- 미리보기 편집에는 추가 Matrix API 호출이 필요합니다. 가장 보수적인 속도 제한 프로필을 사용하려면 `streaming: "off"`를 유지하십시오.

## 음성 메시지

수신된 Matrix 음성 메모는 방의 멘션 게이트보다 먼저 전사됩니다. 따라서 봇 이름을 말하는 음성 메모는 `requireMention: true`인 방에서 에이전트를 트리거할 수 있으며, 에이전트는 오디오 첨부 파일 자리표시자만 받는 대신 전사문을 받습니다.

Matrix는 OpenAI `gpt-4o-mini-transcribe`와 같은 `tools.media.audio` 아래의 공유 오디오 미디어 공급자를 사용합니다. 공급자 설정 및 제한은 [미디어 도구 개요](/ko/tools/media-overview)를 참조하십시오.

- `m.audio` 이벤트와 `audio/*` MIME 유형을 사용하는 `m.file` 이벤트를 처리할 수 있습니다.
- 암호화된 방에서는 OpenClaw가 전사하기 전에 기존 Matrix 미디어 경로를 통해 첨부 파일을 복호화합니다.
- 전사문은 에이전트 프롬프트에서 기계 생성 및 신뢰할 수 없음으로 표시됩니다.
- 첨부 파일은 이미 전사된 것으로 표시되므로 이후 미디어 도구가 다시 전사하지 않습니다.
- 오디오 전사를 전역에서 비활성화하려면 `tools.media.audio.enabled: false`를 설정하십시오.

## 승인 메타데이터

Matrix 네이티브 승인 프롬프트는 `com.openclaw.approval` 키 아래에 OpenClaw 전용 콘텐츠를 포함하는 일반 `m.room.message` 이벤트입니다. 기본 클라이언트에서도 텍스트 본문이 렌더링되며, OpenClaw를 인식하는 클라이언트는 구조화된 승인 ID, 종류, 상태, 결정 및 실행/Plugin 세부 정보를 읽을 수 있습니다.

프롬프트가 Matrix 이벤트 하나에 담기에는 너무 길면 OpenClaw는 표시되는 텍스트를 여러 청크로 나누고 첫 번째 청크에만 `com.openclaw.approval`을 첨부합니다. 허용/거부 반응은 해당 첫 번째 이벤트에 연결되므로 긴 프롬프트도 단일 이벤트 프롬프트와 동일한 승인 대상을 유지합니다.

### 최종 확정된 미리보기를 위한 자체 호스팅 푸시 규칙

`streaming: "quiet"`는 블록이나 턴이 최종 확정된 경우에만 수신자에게 알립니다. 사용자별 푸시 규칙이 최종 확정된 미리보기 마커와 일치해야 합니다. 전체 설정 방법은 [조용한 미리보기를 위한 Matrix 푸시 규칙](/ko/channels/matrix-push-rules)을 참조하십시오.

## 봇 간 대화방

기본적으로 구성된 다른 OpenClaw Matrix 계정에서 보낸 Matrix 메시지는 무시됩니다. 에이전트 간 트래픽을 의도적으로 허용하려면 `allowBots`를 사용하십시오.

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

- `allowBots: true`는 허용된 대화방과 DM에서 구성된 다른 Matrix 봇 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`는 대화방에서 이 봇을 명시적으로 멘션한 경우에만 해당 메시지를 수락합니다. DM은 이 조건과 관계없이 계속 허용됩니다.
- `groups.<room>.allowBots`는 특정 대화방 하나에 대해 계정 수준 설정을 재정의합니다.
- 수락된 구성된 봇 메시지에는 공유 [봇 루프 방지](/ko/channels/bot-loop-protection)가 적용됩니다. `channels.defaults.botLoopProtection`을 구성한 다음, 계정별로 `channels.matrix.botLoopProtection`을 사용하거나 대화방별로 `channels.matrix.groups.<room>.botLoopProtection`을 사용하여 재정의하십시오.
- OpenClaw는 자체 응답 루프를 방지하기 위해 동일한 Matrix 사용자 ID에서 보낸 메시지를 계속 무시합니다.
- Matrix에는 네이티브 봇 플래그가 없습니다. OpenClaw는 "봇이 작성함"을 "이 OpenClaw Gateway에 구성된 다른 Matrix 계정에서 보냄"으로 간주합니다.

공유 대화방에서 봇 간 트래픽을 활성화할 때는 엄격한 대화방 허용 목록과 멘션 요구 사항을 사용하십시오.

## 암호화 및 검증

암호화된(E2EE) 대화방에서 발신 이미지 이벤트는 `thumbnail_file`을 사용하므로 이미지 미리보기도 전체 첨부 파일과 함께 암호화됩니다. 암호화되지 않은 대화방에서는 일반 `thumbnail_url`을 사용합니다. 별도의 구성이 필요하지 않으며 Plugin이 E2EE 상태를 자동으로 감지합니다.

모든 `openclaw matrix` 명령은 `--verbose`(전체 진단), `--json`(머신 리더블 출력), `--account <id>`(다중 계정 설정)를 지원합니다. 기본 출력은 간결합니다.

### 암호화 활성화

```bash
openclaw matrix encryption setup
```

비밀 저장소와 교차 서명을 부트스트랩하고, 필요한 경우 대화방 키 백업을 생성한 다음 상태와 다음 단계를 출력합니다. 유용한 플래그는 다음과 같습니다.

- `--recovery-key <key>` 부트스트랩하기 전에 복구 키를 적용합니다(아래의 stdin 형식을 권장합니다).
- `--force-reset-cross-signing` 현재 교차 서명 ID를 폐기하고 새로 생성합니다(의도한 경우에만 사용).

새 계정의 경우 생성할 때 E2EE를 활성화하십시오.

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

`verify status`는 서로 독립적인 세 가지 신뢰 신호를 보고합니다(`--verbose`를 사용하면 모두 표시됩니다).

- `Locally trusted`: 이 클라이언트에서만 신뢰함
- `Cross-signing verified`: SDK가 교차 서명을 통한 검증을 보고함
- `Signed by owner`: 사용자의 자체 서명 키로 서명됨(진단 전용)

`Verified by owner`는 `Cross-signing verified`가 `yes`인 경우에만 `yes`입니다. 로컬 신뢰 또는 소유자 서명만으로는 충분하지 않습니다.

`--allow-degraded-local-state`는 Matrix 계정을 먼저 준비하지 않고 최선형 진단 결과를 반환합니다. 오프라인 또는 부분적으로 구성된 검사에 유용합니다.

### 복구 키로 이 기기 검증

복구 키를 명령줄에 전달하는 대신 stdin을 통해 파이프로 전달하십시오.

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

이 명령은 세 가지 상태를 보고합니다.

- `Recovery key accepted`: Matrix가 비밀 저장소 또는 기기 신뢰에 사용할 키를 수락했습니다.
- `Backup usable`: 신뢰할 수 있는 복구 자료를 사용하여 대화방 키 백업을 불러올 수 있습니다.
- `Device verified by owner`: 이 기기가 Matrix 교차 서명 ID의 완전한 신뢰를 확보했습니다.

복구 키로 백업 자료의 잠금을 해제했더라도 전체 ID 신뢰가 완성되지 않으면 0이 아닌 코드로 종료됩니다. 이 경우 다른 Matrix 클라이언트에서 자체 검증을 완료하십시오.

```bash
openclaw matrix verify self
```

`verify self`는 `Cross-signing verified: yes`가 될 때까지 기다린 후 성공적으로 종료됩니다. 대기 시간을 조정하려면 `--timeout-ms <ms>`를 사용하십시오.

리터럴 키 형식인 `openclaw matrix verify device "<recovery-key>"`도 작동하지만 키가 셸 기록에 남습니다.

### 교차 서명 부트스트랩 또는 복구

```bash
openclaw matrix verify bootstrap
```

암호화된 계정을 위한 복구/설정 명령입니다. 다음 순서로 작업합니다.

- 가능한 경우 기존 복구 키를 재사용하여 비밀 저장소를 부트스트랩합니다.
- 교차 서명을 부트스트랩하고 누락된 공개 키를 업로드합니다.
- 현재 기기를 표시하고 교차 서명합니다.
- 서버 측 대화방 키 백업이 아직 없으면 생성합니다.

홈서버에서 교차 서명 키를 업로드하기 위해 UIA가 필요한 경우 OpenClaw는 먼저 인증 없이 시도한 다음 `m.login.dummy`, 이어서 `m.login.password`를 시도합니다(`channels.matrix.password` 필요).

유용한 플래그:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`와 함께 사용) 또는 `--recovery-key <key>`
- 현재 교차 서명 ID를 폐기하려면 `--force-reset-cross-signing`을 사용합니다(의도적인 경우에만 사용하며, 활성 복구 키가 저장되어 있거나 `--recovery-key-stdin`으로 제공되어야 함).

### 룸 키 백업

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status`는 서버 측 백업이 있는지와 이 기기에서 해당 백업을 복호화할 수 있는지를 표시합니다. `backup restore`는 백업된 룸 키를 로컬 암호화 저장소로 가져옵니다. 복구 키가 이미 디스크에 있으면 `--recovery-key-stdin`을 생략하십시오.

손상된 백업을 새로운 기준 백업으로 교체하려면 다음 명령을 사용합니다(복구할 수 없는 이전 기록이 손실되는 것을 허용하며, 현재 백업 시크릿을 불러올 수 없는 경우 시크릿 저장소도 다시 생성할 수 있음).

```bash
openclaw matrix verify backup reset --yes
```

이전 복구 키로 새로운 기준 백업의 잠금을 더 이상 해제할 수 없도록 의도적으로 변경하려는 경우에만 `--rotate-recovery-key`를 추가하십시오.

### 검증 목록 조회, 요청 및 응답

```bash
openclaw matrix verify list
```

선택한 계정의 대기 중인 검증 요청을 나열합니다.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

이 계정에서 검증 요청을 보냅니다. `--own-user`는 자체 검증을 요청합니다(같은 사용자의 다른 Matrix 클라이언트에서 프롬프트를 수락하십시오). `--user-id`/`--device-id`/`--room-id`는 다른 사람을 대상으로 지정합니다. `--own-user`는 다른 대상 지정 플래그와 함께 사용할 수 없습니다.

더 낮은 수준의 수명 주기 처리(일반적으로 다른 클라이언트에서 들어오는 요청을 추적할 때)를 위해 다음 명령은 특정 요청 `<id>`(`verify list` 및 `verify request`에서 출력됨)에 작동합니다.

| 명령                                       | 용도                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 수신 요청 수락                                                       |
| `openclaw matrix verify start <id>`        | SAS 흐름 시작                                                        |
| `openclaw matrix verify sas <id>`          | SAS 이모지 또는 십진수 출력                                          |
| `openclaw matrix verify confirm-sas <id>`  | SAS가 다른 클라이언트에 표시된 내용과 일치함을 확인                   |
| `openclaw matrix verify mismatch-sas <id>` | 이모지 또는 십진수가 일치하지 않을 때 SAS 거부                        |
| `openclaw matrix verify cancel <id>`       | 취소. 선택적으로 `--reason <text>` 및 `--code <matrix-code>` 사용 가능 |

검증이 특정 다이렉트 메시지 룸에 연결된 경우 `accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, `cancel`은 모두 DM 후속 처리 힌트로 `--user-id`와 `--room-id`를 허용합니다.

### 다중 계정 참고 사항

`--account <id>`가 없으면 Matrix CLI 명령은 암시적 기본 계정을 사용합니다. 이름이 지정된 계정이 여러 개이고 `channels.matrix.defaultAccount`가 없으면 명령은 임의로 추측하지 않고 계정을 선택하도록 요청합니다. 이름이 지정된 계정에서 E2EE가 비활성화되어 있거나 사용할 수 없으면 오류는 해당 계정의 구성 키를 가리킵니다(예: `channels.matrix.accounts.assistant.encryption`).

<AccordionGroup>
  <Accordion title="시작 동작">
    `encryption: true`이면 `startupVerification`의 기본값은 `"if-unverified"`입니다. 시작 시 검증되지 않은 기기는 다른 Matrix 클라이언트에 자체 검증을 요청하며, 중복 요청을 건너뛰고 대기 시간(기본값 24시간)을 적용합니다. `startupVerificationCooldownHours`로 조정하거나 `startupVerification: "off"`로 비활성화하십시오.

    시작 시 현재 시크릿 저장소와 교차 서명 ID를 재사용하는 보수적인 암호화 부트스트랩 과정도 실행됩니다. 부트스트랩 상태가 손상되면 OpenClaw는 `channels.matrix.password`가 없어도 보호된 복구를 시도합니다. 홈서버에서 비밀번호 UIA가 필요한 경우 시작 로그에 경고를 기록하며 치명적 오류로 처리하지 않습니다. 이미 소유자가 서명한 기기는 보존됩니다.

    전체 업그레이드 흐름은 [Matrix 마이그레이션](/ko/channels/matrix-migration)을 참조하십시오.

  </Accordion>

  <Accordion title="검증 알림">
    Matrix는 엄격한 DM 검증 룸에 검증 수명 주기 알림을 `m.notice` 메시지로 게시합니다. 여기에는 요청, 준비("Verify by emoji" 안내 포함), 시작/완료 및 사용 가능한 경우 SAS(이모지/십진수) 세부 정보가 포함됩니다.

    다른 Matrix 클라이언트에서 수신한 요청은 추적되어 자동으로 수락됩니다. 자체 검증의 경우 OpenClaw는 SAS 흐름을 자동으로 시작하고 이모지 검증을 사용할 수 있게 되면 자체 측 검증을 확인합니다. 그러나 Matrix 클라이언트에서 직접 비교한 후 "They match"를 확인해야 합니다.

    검증 시스템 알림은 에이전트 채팅 파이프라인으로 전달되지 않습니다.

  </Accordion>

  <Accordion title="삭제되었거나 유효하지 않은 Matrix 기기">
    `verify status`에서 현재 기기가 더 이상 홈서버 목록에 없다고 표시되면 새 OpenClaw Matrix 기기를 생성하십시오. 비밀번호 로그인의 경우:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    토큰 인증의 경우 Matrix 클라이언트 또는 관리자 UI에서 새 액세스 토큰을 생성한 다음 OpenClaw를 업데이트하십시오.

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant`를 실패한 명령의 계정 ID로 바꾸거나, 기본 계정에는 `--account`를 생략하십시오.

  </Accordion>

  <Accordion title="기기 정리">
    OpenClaw에서 관리하는 이전 기기가 누적될 수 있습니다. 다음 명령으로 목록을 조회하고 정리하십시오.

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="암호화 저장소">
    Matrix E2EE는 `fake-indexeddb`를 IndexedDB 호환 계층으로 사용하며 공식 `matrix-js-sdk` Rust 암호화 경로를 사용합니다. 암호화 상태는 `crypto-idb-snapshot.json`에 유지됩니다(제한적인 파일 권한 적용).

    암호화된 런타임 상태는 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 아래에 있으며 동기화 저장소, 암호화 저장소, 복구 키, IDB 스냅샷, 스레드 바인딩 및 시작 검증 상태를 포함합니다. 토큰이 변경되어도 계정 ID가 동일하게 유지되면 OpenClaw는 가장 적합한 기존 루트를 재사용하여 이전 상태를 계속 표시합니다.

    이전 토큰 해시 루트가 하나만 있는 것은 정상적인 토큰 순환 연속성 경로일 수 있습니다. OpenClaw가 `matrix: multiple populated token-hash storage roots detected`를 기록하면 계정 디렉터리를 검사하고, 선택된 활성 루트가 정상인지 확인한 후에만 오래된 형제 루트를 보관 처리하십시오. 오래된 루트를 즉시 삭제하기보다 `_archive/` 디렉터리로 이동하는 것이 좋습니다.

  </Accordion>
</AccordionGroup>

## 프로필 관리

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

한 번의 호출에 두 옵션을 모두 전달하십시오. Matrix는 `mxc://` 아바타 URL을 직접 허용합니다. `http://`/`https://`를 전달하면 먼저 파일을 업로드한 후 확인된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 계정별 재정의)에 저장합니다.

## 스레드

Matrix는 자동 응답과 메시지 도구 전송 모두에서 네이티브 스레드를 지원합니다. 서로 독립적인 두 설정이 동작을 제어합니다.

### 세션 라우팅(`sessionScope`)

`dm.sessionScope`는 Matrix DM 방을 OpenClaw 세션에 매핑하는 방식을 결정합니다.

- `"per-user"`(기본값): 라우팅된 상대가 같은 모든 DM 방이 하나의 세션을 공유합니다.
- `"per-room"`: 상대가 같더라도 각 Matrix DM 방에 자체 세션 키가 할당됩니다.

명시적 대화 바인딩은 항상 `sessionScope`보다 우선하며, 바인딩된 방과 스레드는 선택된 대상 세션을 유지합니다.

### 응답 스레딩(`threadReplies`)

`threadReplies`는 봇이 응답을 게시할 위치를 결정합니다.

- `"off"`: 응답이 최상위에 게시됩니다. 수신된 스레드 메시지는 상위 세션에 유지됩니다.
- `"inbound"`: 수신 메시지가 이미 스레드에 속한 경우에만 해당 스레드 안에서 응답합니다.
- `"always"`: 트리거 메시지를 루트로 하는 스레드 안에서 응답하며, 해당 대화는 첫 트리거부터 일치하는 스레드 범위 세션을 통해 라우팅됩니다.

`dm.threadReplies`는 DM에 대해서만 이 설정을 재정의합니다. 예를 들어 방 스레드는 격리하면서 DM은 평면 구조로 유지할 수 있습니다.

### 스레드 상속 및 슬래시 명령

- 수신된 스레드 메시지에는 스레드 루트 메시지가 추가 에이전트 컨텍스트로 포함됩니다.
- 명시적 `threadId`가 제공되지 않으면 메시지 도구 전송은 동일한 방(또는 동일한 DM 사용자 대상)을 대상으로 할 때 현재 Matrix 스레드를 자동으로 상속합니다.
- DM 사용자 대상 재사용은 현재 세션 메타데이터로 동일한 Matrix 계정의 동일한 DM 상대임이 확인되는 경우에만 적용됩니다. 그렇지 않으면 OpenClaw는 일반적인 사용자 범위 라우팅으로 대체합니다.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` 및 스레드에 바인딩된 `/acp spawn`은 모두 Matrix 방과 DM에서 작동합니다.
- `threadBindings.spawnSessions`가 활성화되어 있으면 최상위 `/focus`가 새 Matrix 스레드를 만들고 대상 세션에 바인딩합니다.
- 기존 Matrix 스레드 안에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 해당 스레드를 그 자리에서 바인딩합니다.

OpenClaw가 동일한 공유 세션에서 다른 DM 방과 충돌하는 Matrix DM 방을 감지하면 `/focus` 우회 방법을 안내하고 `dm.sessionScope` 변경을 제안하는 일회성 `m.notice`를 게시합니다. 이 알림은 스레드 바인딩이 활성화된 경우에만 표시됩니다.

## ACP 대화 바인딩

Matrix 방, DM 및 기존 Matrix 스레드는 채팅 표면을 변경하지 않고도 지속적인 ACP 작업 공간이 될 수 있습니다.

빠른 운영자 절차:

- 계속 사용할 Matrix DM, 방 또는 기존 스레드 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 최상위 DM 또는 방에서는 현재 DM/방이 채팅 표면으로 유지되고 이후 메시지가 생성된 ACP 세션으로 라우팅됩니다.
- 기존 스레드 안에서는 `--bind here`가 현재 스레드를 그 자리에서 바인딩합니다.
- `/new`와 `/reset`은 바인딩된 동일 ACP 세션을 그 자리에서 초기화합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

`--bind here`는 하위 Matrix 스레드를 만들지 않습니다. OpenClaw가 하위 스레드를 만들거나 바인딩해야 하는 `/acp spawn --thread auto|here`는 `threadBindings.spawnSessions`의 제어를 받습니다.

### 스레드 바인딩 구성

Matrix는 `session.threadBindings`의 전역 기본값을 상속하며 채널별 재정의를 지원합니다.

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: 하위 에이전트와 ACP 스레드 생성을 모두 제어합니다.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: 하위 에이전트 전용 또는 ACP 전용 생성에 대한 더 세부적인 재정의입니다.
- `threadBindings.defaultSpawnContext`

Matrix의 스레드 바인딩 세션 생성은 기본적으로 활성화됩니다. 최상위 `/focus` 및 `/acp spawn --thread auto|here`가 Matrix 스레드를 생성하거나 바인딩하지 못하게 하려면 `threadBindings.spawnSessions: false`를 설정하십시오. 네이티브 하위 에이전트 스레드 생성 시 상위 대화 기록을 포크하지 않게 하려면 `threadBindings.defaultSpawnContext: "isolated"`를 설정하십시오.

## 반응

Matrix는 발신 반응, 수신 반응 알림 및 확인 반응을 지원합니다.

발신 반응 도구는 `channels.matrix.actions.reactions`의 제어를 받습니다.

- `react`는 Matrix 이벤트에 반응을 추가합니다.
- `reactions`는 Matrix 이벤트의 현재 반응 요약을 나열합니다.
- `emoji=""`는 해당 이벤트에서 봇 자체의 반응을 제거합니다.
- `remove: true`는 봇이 추가한 지정 이모지 반응만 제거합니다.

**확인 순서**(처음 정의된 값이 우선함):

| 설정                    | 순서                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | 계정별 -> 채널 -> `messages.ackReaction` -> 에이전트 ID 이모지 대체                 |
| `ackReactionScope`      | 계정별 -> 채널 -> `messages.ackReactionScope` -> 기본값 `"group-mentions"`          |
| `reactionNotifications` | 계정별 -> 채널 -> 기본값 `"own"`                                                    |

`reactionNotifications: "own"`은 봇이 작성한 Matrix 메시지를 대상으로 추가된 `m.reaction` 이벤트를 전달하며, `"off"`는 반응 시스템 이벤트를 비활성화합니다. 반응 제거는 시스템 이벤트로 합성되지 않습니다. Matrix에서는 이를 독립된 `m.reaction` 제거가 아닌 삭제 처리로 표시합니다.

## 기록 컨텍스트

- `channels.matrix.historyLimit`는 방 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함할 최근 방 메시지 수를 제어합니다. `messages.groupChat.historyLimit`로 대체되며, 둘 다 설정되지 않은 경우 유효 기본값은 `0`(비활성화)입니다.
- Matrix 방 기록은 해당 방에만 적용되며, DM은 계속 일반 세션 기록을 사용합니다.
- 방 기록은 대기 중인 메시지만 포함합니다. OpenClaw는 아직 응답을 트리거하지 않은 방 메시지를 버퍼링한 후 멘션이나 다른 트리거가 도착하면 해당 구간의 스냅샷을 생성합니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않으며, 해당 턴의 기본 수신 본문에 유지됩니다.
- 동일한 Matrix 이벤트를 재시도할 때 더 최근의 방 메시지로 이동하지 않고 원래 기록 스냅샷을 재사용합니다.

## 컨텍스트 표시 범위

Matrix는 가져온 응답 텍스트, 스레드 루트 및 대기 중인 기록과 같은 보충 방 컨텍스트에 공통 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보충 컨텍스트를 수신된 상태 그대로 유지합니다.
- `contextVisibility: "allowlist"`는 활성 방/사용자 허용 목록 검사를 통과한 발신자의 보충 컨텍스트만 남깁니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`와 동일하게 동작하지만 명시적으로 인용된 응답 하나는 계속 유지합니다.

이는 보충 컨텍스트의 표시 범위에만 영향을 주며, 수신 메시지 자체가 응답을 트리거할 수 있는지에는 영향을 주지 않습니다. 트리거 권한 부여는 계속 `groupPolicy`, `groups`, `groupAllowFrom` 및 DM 정책 설정에 따라 결정됩니다.

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

방은 계속 작동하게 두면서 DM을 완전히 비활성화하려면 `dm.enabled: false`를 설정하십시오.

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

멘션 게이트 및 허용 목록 동작은 [그룹](/ko/channels/groups)을 참조하십시오.

Matrix DM의 페어링 예시:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면 OpenClaw는 동일한 대기 중 페어링 코드를 재사용하며, 새 코드를 생성하는 대신 짧은 대기 시간 후 알림 응답을 보낼 수 있습니다.

공통 DM 페어링 절차 및 저장소 구조는 [페어링](/ko/channels/pairing)을 참조하십시오.

## 직접 메시지 방 복구

직접 메시지 상태가 어긋나면 OpenClaw의 오래된 `m.direct` 매핑이 현재 사용 중인 DM 대신 이전의 단독 방을 가리킬 수 있습니다. 상대의 현재 매핑을 검사하려면 다음을 실행하십시오.

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

복구하려면 다음을 실행하십시오.

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

다중 계정 설정에서는 두 명령 모두 `--account <id>`를 허용합니다. 복구 절차는 다음과 같습니다.

- `m.direct`에 이미 매핑된 엄격한 1:1 DM을 우선 사용합니다.
- 해당 사용자와 현재 참여 중인 엄격한 1:1 DM으로 대체합니다.
- 정상적인 DM이 없으면 새 직접 메시지 방을 만들고 `m.direct`를 다시 작성합니다.

이 절차는 오래된 방을 자동으로 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑을 업데이트하여 이후의 Matrix 전송, 확인 알림 및 기타 직접 메시지 절차가 올바른 방을 대상으로 하게 합니다.

## 실행 승인

Matrix는 네이티브 승인 클라이언트로 작동할 수 있습니다. `channels.matrix.execApprovals` 아래에서 구성하십시오(계정별로 재정의하려면 `channels.matrix.accounts.<account>.execApprovals` 사용).

- `enabled`: Matrix 네이티브 프롬프트를 통해 승인을 전달합니다. 설정하지 않거나 `"auto"`로 설정하면 한 명 이상의 승인자를 확인할 수 있는 즉시 자동으로 활성화됩니다. 명시적으로 비활성화하려면 `false`로 설정하십시오.
- `approvers`: 실행 요청을 승인할 수 있는 Matrix 사용자 ID(`@owner:example.org`)입니다. `channels.matrix.dm.allowFrom`으로 대체됩니다.
- `target`: 프롬프트를 보낼 위치입니다. `"dm"`(기본값)은 승인자의 DM으로 보내고, `"channel"`은 요청이 발생한 방 또는 DM으로 보내며, `"both"`는 두 위치 모두로 보냅니다.
- `agentFilter` / `sessionFilter`: 어떤 에이전트/세션이 Matrix 전달을 트리거할지 지정하는 선택적 허용 목록입니다.

권한 부여 방식은 승인 유형에 따라 약간 다릅니다.

- **실행 승인**은 `execApprovals.approvers`를 사용하며, 없으면 `dm.allowFrom`을 사용합니다.
- **Plugin 승인**은 `dm.allowFrom`을 통해서만 권한을 부여합니다.

두 유형 모두 Matrix 반응 바로 가기와 메시지 업데이트를 공유합니다. 승인자는 기본 승인 메시지에서 다음과 같은 반응 바로 가기를 볼 수 있습니다.

- ✅ 한 번 허용
- ❌ 거부
- ♾️ 항상 허용(유효한 실행 정책이 허용하는 경우)

대체 슬래시 명령: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

확인된 승인자만 승인하거나 거부할 수 있습니다. 실행 승인을 채널로 전달하면 명령 텍스트가 포함되므로 신뢰할 수 있는 방에서만 `channel` 또는 `both`를 활성화하십시오.

관련 문서: [실행 승인](/ko/tools/exec-approvals).

## 슬래시 명령

슬래시 명령(`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` 등)은 DM에서 직접 작동합니다. 방에서는 OpenClaw가 봇 자체의 Matrix 멘션이 앞에 붙은 명령도 인식하므로 `@bot:server /new`는 사용자 지정 멘션 정규식 없이 명령 경로를 트리거합니다. 따라서 Element 및 유사한 클라이언트에서 사용자가 명령을 입력하기 전에 탭 완성으로 봇을 선택할 때 생성되는 방 형식의 `@mention /command` 게시물에도 봇이 응답할 수 있습니다.

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

- 최상위 `channels.matrix` 값은 계정에서 재정의하지 않는 한 명명된 계정의 기본값으로 사용됩니다.
- `groups.<room>.account`를 사용하여 상속된 방 항목의 범위를 특정 계정으로 한정합니다. `account`가 없는 항목은 여러 계정에서 공유되며, 기본 계정이 최상위 수준에 구성된 경우에도 `account: "default"`가 계속 작동합니다.

**기본 계정 선택:**

- 암시적 라우팅, 프로빙 및 CLI 명령에서 우선 사용할 명명된 계정을 선택하려면 `defaultAccount`를 설정합니다.
- 계정이 여러 개이고 그중 하나의 이름이 문자 그대로 `default`이면, `defaultAccount`가 설정되지 않아도 OpenClaw는 해당 계정을 암시적으로 사용합니다.
- 명명된 계정이 여러 개이고 기본 계정이 선택되지 않은 경우 CLI 명령은 임의로 추측하지 않습니다. `defaultAccount`를 설정하거나 `--account <id>`를 전달하십시오.
- 최상위 `channels.matrix.*` 블록은 인증이 완료된 경우(`homeserver` + `accessToken` 또는 `homeserver` + `userId` + `password`)에만 암시적 `default` 계정으로 취급됩니다. 캐시된 자격 증명으로 인증이 충족되면 명명된 계정은 `homeserver` + `userId`만으로도 계속 검색할 수 있습니다.

**승격:**

- OpenClaw가 복구 또는 설정 중에 단일 계정 구성을 다중 계정 구성으로 승격할 때, 기존 명명된 계정이 있거나 `defaultAccount`가 이미 특정 계정을 가리키면 해당 계정을 유지합니다. Matrix 인증/부트스트랩 키만 승격된 계정으로 이동하며, 공유 전달 정책 키는 최상위 수준에 유지됩니다.

공유 다중 계정 패턴은 [구성 참조](/ko/gateway/config-channels#multi-account-all-channels)를 확인하십시오.

## 비공개/LAN 홈서버

기본적으로 OpenClaw는 SSRF 방지를 위해 계정별로 명시적으로 허용하지 않는 한 비공개/내부 Matrix 홈서버를 차단합니다.

홈서버가 localhost, LAN/Tailscale IP 또는 내부 호스트 이름에서 실행되는 경우 해당 계정에 `network.dangerouslyAllowPrivateNetwork`를 활성화하십시오.

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

이 명시적 허용은 신뢰할 수 있는 비공개/내부 대상만 허용합니다. `http://matrix.example.org:8008`과 같은 공개 평문 홈서버는 계속 차단됩니다. 가능하면 항상 `https://`를 사용하십시오.

## Matrix 트래픽 프록시

Matrix 배포에 명시적인 아웃바운드 HTTP(S) 프록시가 필요한 경우 `channels.matrix.proxy`를 설정하십시오.

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

명명된 계정은 `channels.matrix.accounts.<id>.proxy`를 사용하여 최상위 기본값을 재정의할 수 있습니다. OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브에 동일한 프록시 설정을 사용합니다.

## 대상 해석

OpenClaw가 방 또는 사용자 대상을 요구하는 모든 위치에서 Matrix는 다음 대상 형식을 허용합니다.

- 사용자: `@user:server`, `user:@user:server` 또는 `matrix:user:@user:server`
- 방: `!room:server`, `room:!room:server` 또는 `matrix:room:!room:server`
- 별칭: `#alias:server`, `channel:#alias:server` 또는 `matrix:channel:#alias:server`

Matrix 방 ID는 대소문자를 구분합니다. 명시적 전달 대상, Cron 작업, 바인딩 또는 허용 목록을 구성할 때 Matrix의 방 ID 대소문자를 정확히 사용하십시오. OpenClaw는 저장을 위해 내부 세션 키를 정규화하므로, 해당 소문자 키를 Matrix 전달 ID의 신뢰할 수 있는 출처로 사용해서는 안 됩니다.

실시간 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다.

- 사용자 조회는 해당 홈서버의 Matrix 사용자 디렉터리를 쿼리합니다.
- 방 조회는 명시적 방 ID와 별칭을 직접 허용합니다. 참여한 방의 이름 조회는 최선형으로 수행되며 `dangerouslyAllowNameMatching: true`가 설정된 경우에만 런타임 방 허용 목록에 적용됩니다.
- 방 이름을 ID나 별칭으로 확인할 수 없으면 런타임 허용 목록 확인에서 무시됩니다.

## 구성 참조

허용 목록 형식의 사용자 필드(`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`)에는 전체 Matrix 사용자 ID를 사용할 수 있으며, 이것이 가장 안전합니다. ID가 아닌 항목은 기본적으로 무시됩니다. `dangerouslyAllowNameMatching: true`가 설정된 경우 정확히 일치하는 Matrix 디렉터리 표시 이름이 시작 시와 모니터 실행 중 허용 목록이 변경될 때마다 확인되며, 확인할 수 없는 항목은 런타임에 무시됩니다.

방 허용 목록 키(`groups`, 레거시 `rooms`)에는 방 ID 또는 별칭을 사용해야 합니다. 일반 방 이름 키는 기본적으로 무시되며, `dangerouslyAllowNameMatching: true`를 설정하면 참여한 방 이름에 대한 최선형 조회가 복원됩니다.

### 계정 및 연결

- `enabled`: 채널을 활성화하거나 비활성화합니다.
- `name`: 계정의 선택적 표시 레이블입니다.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호하는 계정 ID입니다.
- `accounts`: 이름이 지정된 계정별 재정의입니다. 최상위 `channels.matrix` 값은 기본값으로 상속됩니다.
- `homeserver`: 홈서버 URL입니다(예: `https://matrix.example.org`).
- `network.dangerouslyAllowPrivateNetwork`: 이 계정이 `localhost`, LAN/Tailscale IP 또는 내부 호스트 이름에 연결할 수 있도록 허용합니다.
- `proxy`: Matrix 트래픽을 위한 선택적 HTTP(S) 프록시 URL입니다. 계정별 재정의를 지원합니다.
- `userId`: 전체 Matrix 사용자 ID입니다(`@bot:example.org`).
- `accessToken`: 토큰 기반 인증용 액세스 토큰입니다. env/file/exec 제공자에서 일반 텍스트 및 SecretRef 값을 지원합니다([비밀 관리](/ko/gateway/secrets)).
- `password`: 비밀번호 기반 로그인용 비밀번호입니다. 일반 텍스트 및 SecretRef 값을 지원합니다.
- `deviceId`: 명시적 Matrix 기기 ID입니다.
- `deviceName`: 비밀번호 로그인 시 사용되는 기기 표시 이름입니다.
- `avatarUrl`: 프로필 동기화 및 `profile set` 업데이트를 위해 저장되는 자체 아바타 URL입니다.
- `initialSyncLimit`: 시작 동기화 중 가져올 최대 이벤트 수입니다.

### 암호화

- `encryption`: E2EE를 활성화합니다. 기본값: `false`.
- `startupVerification`: `"if-unverified"`(E2EE가 켜진 경우 기본값) 또는 `"off"`입니다. 이 기기가 확인되지 않은 경우 시작 시 자체 확인을 자동으로 요청합니다.
- `startupVerificationCooldownHours`: 다음 자동 시작 요청 전까지의 대기 시간입니다. 기본값: `24`.

### 접근 및 정책

- `groupPolicy`: `"open"`, `"allowlist"` 또는 `"disabled"`입니다. 기본값: `"allowlist"`.
- `groupAllowFrom`: 방 트래픽에 대한 사용자 ID 허용 목록입니다.
- `mentionPatterns`: 방 멘션에 적용되는 범위 지정 정규식 패턴입니다. `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` 형식의 객체입니다. 구성된 `agents.list[].groupChat.mentionPatterns`를 방별로 적용할지 제어합니다.
- `dm.enabled`: `false`이면 모든 DM을 무시합니다. 기본값: `true`.
- `dm.policy`: `"pairing"`(기본값), `"allowlist"`, `"open"` 또는 `"disabled"`입니다. 봇이 방에 참여하고 해당 방을 DM으로 분류한 후 적용되며, 초대 처리에는 영향을 주지 않습니다.
- `dm.allowFrom`: DM 트래픽에 대한 사용자 ID 허용 목록입니다.
- `dm.sessionScope`: `"per-user"`(기본값) 또는 `"per-room"`입니다.
- `dm.threadReplies`: 답글 스레딩에 대한 DM 전용 재정의입니다(`"off"`, `"inbound"`, `"always"`).
- `allowBots`: 구성된 다른 Matrix 봇 계정의 메시지를 허용합니다(`true` 또는 `"mentions"`).
- `allowlistOnly`: `true`이면 `"disabled"`를 제외한 모든 활성 DM 정책과 `"open"` 그룹 정책을 `"allowlist"`로 강제합니다. `"disabled"` 정책은 변경하지 않습니다.
- `dangerouslyAllowNameMatching`: `true`이면 사용자 허용 목록 항목에 대해 Matrix 표시 이름 디렉터리 조회를 허용하고, 방 허용 목록 키에 대해 참여한 방 이름 조회를 허용합니다. 전체 `@user:server` ID와 방 ID 또는 별칭을 사용하는 것이 좋습니다.
- `autoJoin`: `"always"`, `"allowlist"` 또는 `"off"`입니다. 기본값: `"off"`. DM 형식의 초대를 포함한 모든 Matrix 초대에 적용됩니다.
- `autoJoinAllowlist`: `autoJoin`이 `"allowlist"`인 경우 허용되는 방/별칭입니다. 별칭 항목은 초대된 방이 주장하는 상태가 아니라 홈서버를 기준으로 확인됩니다.
- `contextVisibility`: 보조 컨텍스트 표시 범위입니다(`"all"` 기본값, `"allowlist"`, `"allowlist_quote"`).

### 답글 동작

- `replyToMode`: `"off"`(기본값), `"first"`, `"all"` 또는 `"batched"`입니다.
- `threadReplies`: `"off"`(명시적으로 설정하지 않으면 최상위 기본값은 `"inbound"`로 결정됨), `"inbound"` 또는 `"always"`입니다.
- `threadBindings`: 스레드에 바인딩된 세션 라우팅 및 수명 주기에 대한 채널별 재정의입니다.
- `streaming`: `"off"`(기본값), `"partial"`, `"quiet"`, `"progress"` 또는 객체 형식 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`입니다. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: `true`이면 완료된 어시스턴트 블록을 별도의 진행 메시지로 유지합니다. 기본값: `false`.
- `markdown`: 발신 텍스트에 대한 선택적 Markdown 렌더링 구성입니다.
- `responsePrefix`: 발신 답글 앞에 추가되는 선택적 문자열입니다.
- `textChunkLimit`: `chunkMode: "length"`일 때 문자 단위의 발신 청크 크기입니다. 기본값: `4000`.
- `chunkMode`: `"length"`(기본값, 문자 수에 따라 분할) 또는 `"newline"`(줄 경계에서 분할)입니다.
- `historyLimit`: 방 메시지가 에이전트를 트리거할 때 `InboundHistory`로 포함되는 최근 방 메시지 수입니다. `messages.groupChat.historyLimit`로 폴백하며, 실질적인 기본값은 `0`(비활성화)입니다.
- `mediaMaxMb`: 발신 전송 및 수신 처리의 미디어 크기 제한(MB)입니다. 기본값: `20`.

### 반응 설정

- `ackReaction`: 이 채널/계정에 대한 확인 반응 재정의입니다.
- `ackReactionScope`: 범위 재정의입니다(`"group-mentions"` 기본값, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: 수신 반응 알림 모드입니다(`"own"` 기본값, `"off"`).

### 도구 및 방별 재정의

- `actions`: 작업별 도구 게이팅입니다(`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: 방별 정책 맵입니다. 확인 후 세션 ID에는 안정적인 방 ID가 사용됩니다. (`rooms`는 레거시 별칭입니다.)
  - `groups.<room>.account`: 상속된 방 항목 하나를 특정 계정으로 제한합니다.
  - `groups.<room>.enabled`: 방별 토글입니다. `false`이면 해당 방은 맵에 없는 것처럼 무시됩니다.
  - `groups.<room>.requireMention`: 채널 수준 멘션 요구 사항의 방별 재정의입니다.
  - `groups.<room>.allowBots`: 채널 수준 설정의 방별 재정의입니다(`true` 또는 `"mentions"`).
  - `groups.<room>.botLoopProtection`: 봇 간 루프 보호 예산의 방별 재정의입니다.
  - `groups.<room>.users`: 방별 발신자 허용 목록입니다.
  - `groups.<room>.tools`: 방별 도구 허용/거부 재정의입니다.
  - `groups.<room>.autoReply`: 방별 멘션 게이팅 재정의입니다. `true`이면 해당 방의 멘션 요구 사항을 비활성화하고, `false`이면 다시 강제로 활성화합니다.
  - `groups.<room>.skills`: 방별 스킬 필터입니다.
  - `groups.<room>.systemPrompt`: 방별 시스템 프롬프트 조각입니다.

### Exec 승인 설정

- `execApprovals.enabled`: Matrix 네이티브 프롬프트를 통해 Exec 승인을 전달합니다.
- `execApprovals.approvers`: 승인을 허용할 Matrix 사용자 ID입니다. `dm.allowFrom`으로 폴백합니다.
- `execApprovals.target`: `"dm"`(기본값), `"channel"` 또는 `"both"`입니다.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 전달을 위한 선택적 에이전트/세션 허용 목록입니다.

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 접근 모델 및 강화
