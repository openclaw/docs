---
read_when:
    - OpenClaw용 Zalo Personal 설정하기
    - Zalo Personal 로그인 또는 메시지 흐름 디버깅
summary: 네이티브 zca-js(QR 로그인)를 통한 Zalo 개인 계정 지원, 기능 및 구성
title: Zalo 개인용
x-i18n:
    generated_at: "2026-07-12T15:03:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

상태: 실험적. 이 통합은 외부 CLI 바이너리 없이 프로세스 내에서 네이티브 `zca-js`를 통해 **개인 Zalo 계정**을 자동화합니다.

<Warning>
이 통합은 비공식이며 계정이 정지되거나 차단될 수 있습니다. 위험을 감수하고 사용하십시오.
</Warning>

## 설치

Zalo Personal은 코어에 번들로 포함되지 않은 공식 외부 Plugin입니다. 사용하기 전에 설치하십시오.

```bash
openclaw plugins install @openclaw/zalouser
```

- 버전 고정: `openclaw plugins install @openclaw/zalouser@<version>`
- 소스 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 자세한 내용: [Plugin](/ko/tools/plugin)

## 빠른 설정

1. Plugin을 설치합니다(위 참조).
2. 로그인합니다(Gateway 머신에서 QR 사용).
   - `openclaw channels login --channel zalouser`
   - Zalo 모바일 앱으로 QR 코드를 스캔합니다.
3. 채널을 활성화합니다.

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway를 다시 시작합니다(또는 설정을 완료합니다).
5. DM 접근은 기본적으로 페어링을 사용합니다. 처음 연락할 때 페어링 코드를 승인하십시오.

## 개요

- `zca-js` 라이브러리를 통해 완전히 프로세스 내에서 실행됩니다(외부 `zca`/`openzca` 바이너리 없음).
- 네이티브 이벤트 리스너(`message`, `error`)를 사용하여 수신 메시지를 받습니다.
- JS API를 통해 답장(텍스트/미디어/링크)을 직접 보냅니다.
- Zalo Bot API를 사용할 수 없는 "개인 계정" 사용 사례를 위해 설계되었습니다.

## 이름 지정

채널 ID는 비공식 **개인 Zalo 사용자 계정**을 자동화한다는 점을 명확히 하기 위해 `zalouser`입니다. `zalo`는 향후 공식 Zalo API 통합을 위해 예약되어 있습니다.

## ID 찾기(디렉터리)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한 사항

- 발신 텍스트는 2000자 단위로 분할됩니다(Zalo 클라이언트 제한).
- 스트리밍은 지원되지 않습니다.

## 접근 제어(DM)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: `pairing`).

`channels.zalouser.allowFrom`에는 안정적인 Zalo 사용자 ID를 사용해야 합니다. 정적 발신자 접근 그룹(`accessGroup:<name>`)을 참조할 수도 있습니다. 대화형 설정 중에 입력한 이름은 Plugin의 프로세스 내 연락처 조회를 사용하여 ID로 변환할 수 있습니다.

구성에 원시 이름이 남아 있는 경우 `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화되어 있을 때만 시작 시 이름을 변환합니다. 이 옵션을 명시적으로 활성화하지 않으면 런타임 발신자 검사는 ID만 사용하며, 원시 이름은 권한 부여 시 무시됩니다.

다음을 통해 승인합니다.

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 접근(선택 사항)

- 기본값: `channels.zalouser.groupPolicy = "allowlist"`(그룹에는 명시적인 허용 목록 항목이 필요함).
- 모든 그룹 열기: `channels.zalouser.groupPolicy = "open"`.
- 모든 그룹 차단: `channels.zalouser.groupPolicy = "disabled"`.
- `groupPolicy = "allowlist"`인 경우:
  - `channels.zalouser.groups` 키에는 안정적인 그룹 ID를 사용해야 합니다. 이름은 `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화된 경우에만 시작 시 ID로 변환됩니다.
  - `channels.zalouser.groupAllowFrom`은 허용된 그룹에서 어떤 발신자가 봇을 트리거할 수 있는지 제어합니다. 정적 발신자 접근 그룹은 `accessGroup:<name>`으로 참조할 수 있습니다.
- 구성 마법사는 그룹 허용 목록을 입력하라는 메시지를 표시할 수 있습니다.
- 그룹 허용 목록 매칭은 기본적으로 ID만 사용합니다. 변환되지 않은 이름은 `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화되어 있지 않으면 인증 시 무시됩니다.
- `channels.zalouser.dangerouslyAllowNameMatching: true`는 변경 가능한 시작 시 이름 변환과 런타임 그룹 이름 매칭을 다시 활성화하는 비상 호환성 모드입니다.
- 일반 그룹 메시지의 경우 `groupAllowFrom`은 `allowFrom`으로 **대체되지 않습니다**. 허용 목록에 있는 그룹에서 이를 비워 두면 모든 발신자가 해당 그룹을 사용할 수 있습니다. 승인된 제어 명령(예: `/new`)은 예외입니다. `groupAllowFrom`이 비어 있으면 명령 발신자 검사에서 `allowFrom`을 대신 사용합니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow`는 레거시 필드 이름이며, 현재 구성에서는 `enabled`를 사용합니다. `openclaw doctor --fix`는 `allow`를 `enabled`로 자동 마이그레이션합니다.
</Note>

### 그룹 멘션 게이팅

- `channels.zalouser.groups.<group>.requireMention`은 그룹 답장에 멘션이 필요한지 여부를 제어합니다.
- 변환 순서: 그룹 ID -> `group:<id>` 별칭 -> 그룹 이름/슬러그(이름 기반 후보는 `dangerouslyAllowNameMatching: true`인 경우에만 적용) -> `*` -> 기본값(`true`).
- 허용 목록에 있는 그룹과 공개 그룹 모드 모두에 적용됩니다.
- 봇 메시지를 인용하면 그룹 활성화를 위한 암시적 멘션으로 간주됩니다.
- 승인된 제어 명령(예: `/new`)은 멘션 게이팅을 우회할 수 있습니다.
- 멘션이 필요하여 그룹 메시지를 건너뛰면 OpenClaw는 해당 메시지를 보류 중인 그룹 기록으로 저장하고 다음에 처리되는 그룹 메시지에 포함합니다.
- 그룹 기록 제한: `channels.zalouser.historyLimit`, 그다음 `messages.groupChat.historyLimit`, 그다음 대체 값 `50`.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## 다중 계정

계정은 OpenClaw 상태의 `zalouser` 프로필에 매핑됩니다. 예시:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 환경 변수

프로필 선택은 환경 변수에서도 가져올 수 있습니다.

| 변수               | 용도                                                                                |
| ------------------ | ----------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | 채널 또는 계정 구성에 `profile`이 설정되지 않았을 때 사용할 프로필 이름입니다.      |
| `ZCA_PROFILE`      | 레거시 대체 값이며, `ZALOUSER_PROFILE`이 설정되지 않은 경우에만 사용됩니다.         |

프로필 이름은 OpenClaw 상태에 저장된 Zalo 로그인 자격 증명을 선택합니다. 변환 순서는 다음과 같습니다.

1. 구성에 명시된 `profile`.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. 기본 계정이 아닌 경우 계정 ID, 기본 계정의 경우 `default`.

다중 계정 설정에서는 하나의 환경 변수로 인해 여러 계정이 동일한 로그인 세션을 공유하지 않도록 구성에서 각 계정에 `profile`을 설정하는 것이 좋습니다.

## 입력 중 표시, 반응 및 전달 확인

- OpenClaw는 답장을 전송하기 전에 입력 중 이벤트를 보냅니다(최선형 방식).
- 채널 작업에서 `zalouser`는 메시지 반응 작업 `react`를 지원합니다.
  - 메시지에서 특정 반응 이모지를 제거하려면 `remove: true`를 사용합니다.
  - 반응 의미 체계: [반응](/ko/tools/reactions)
- 이벤트 메타데이터가 포함된 수신 메시지의 경우 OpenClaw는 전달됨 및 확인됨 응답을 보냅니다(최선형 방식).

## 문제 해결

**로그인이 유지되지 않는 경우:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**허용 목록/그룹 이름이 변환되지 않은 경우:**

- `allowFrom`/`groupAllowFrom`에는 숫자 ID를 사용하고 `groups`에는 안정적인 그룹 ID를 사용합니다. 정확한 친구/그룹 이름을 의도적으로 사용해야 하는 경우 `channels.zalouser.dangerouslyAllowNameMatching: true`를 활성화하십시오.

**이전의 외부 `zca`/CLI 기반 설정에서 업그레이드한 경우:**

- 외부 `zca` 프로세스에 대한 가정을 모두 제거하십시오. 이제 채널은 외부 CLI 바이너리 없이 `zca-js`를 통해 완전히 프로세스 내에서 실행됩니다.

## 관련 문서

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 접근 모델 및 강화
