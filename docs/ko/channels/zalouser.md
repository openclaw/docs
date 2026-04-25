---
read_when:
    - OpenClaw용 Zalo 개인 계정 설정하기
    - Zalo 개인 계정 로그인 또는 메시지 흐름 디버깅
summary: '`zca-js` 네이티브(QR 로그인)를 통한 Zalo 개인 계정 지원, 기능 및 구성'
title: Zalo 개인 계정
x-i18n:
    generated_at: "2026-04-25T05:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

상태: 실험적. 이 통합은 OpenClaw 내부에서 네이티브 `zca-js`를 통해 **개인 Zalo 계정**을 자동화합니다.

> **경고:** 이 통합은 비공식이며 계정 정지/차단으로 이어질 수 있습니다. 위험을 감수하고 사용하세요.

## 번들된 Plugin

Zalo Personal은 현재 OpenClaw 릴리스에 번들된 Plugin으로 제공되므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

구형 빌드 또는 Zalo Personal이 제외된 커스텀 설치를 사용하는 경우 수동으로 설치하세요.

- CLI로 설치: `openclaw plugins install @openclaw/zalouser`
- 또는 소스 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 자세한 내용: [Plugins](/ko/tools/plugin)

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 빠른 설정(초보자용)

1. Zalo Personal Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 구형/커스텀 설치는 위 명령으로 수동 추가할 수 있습니다.
2. 로그인합니다(QR, Gateway 머신에서 수행).
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

4. Gateway를 재시작합니다(또는 설정을 완료합니다).
5. DM 접근은 기본적으로 페어링을 사용하며, 첫 접촉 시 페어링 코드를 승인해야 합니다.

## 개요

- 전적으로 `zca-js`를 통해 인프로세스로 실행됩니다.
- 네이티브 이벤트 리스너를 사용해 인바운드 메시지를 수신합니다.
- JS API를 통해 직접 응답을 전송합니다(텍스트/미디어/링크).
- Zalo Bot API를 사용할 수 없는 “개인 계정” 사용 사례를 위해 설계되었습니다.

## 이름 지정

채널 ID는 `zalouser`입니다. 이는 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위함입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 예약되어 있습니다.

## ID 찾기(디렉터리)

디렉터리 CLI를 사용해 상대/그룹과 해당 ID를 찾습니다.

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한 사항

- 아웃바운드 텍스트는 ~2000자로 분할됩니다(Zalo 클라이언트 제한).
- 스트리밍은 기본적으로 차단됩니다.

## 접근 제어(DM)

`channels.zalouser.dmPolicy`는 다음을 지원합니다: `pairing | allowlist | open | disabled`(기본값: `pairing`).

`channels.zalouser.allowFrom`은 사용자 ID 또는 이름을 허용합니다. 설정 중에는 이름이 Plugin의 인프로세스 연락처 조회를 통해 ID로 해석됩니다.

다음으로 승인합니다.

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 접근(선택 사항)

- 기본값: `channels.zalouser.groupPolicy = "open"`(그룹 허용). 설정되지 않은 경우 기본값을 바꾸려면 `channels.defaults.groupPolicy`를 사용하세요.
- 허용 목록으로 제한하려면:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`(키는 안정적인 그룹 ID여야 하며, 가능할 경우 시작 시 이름이 ID로 해석됨)
  - `channels.zalouser.groupAllowFrom`(허용된 그룹에서 어떤 발신자가 봇을 트리거할 수 있는지 제어)
- 모든 그룹 차단: `channels.zalouser.groupPolicy = "disabled"`.
- 구성 마법사는 그룹 허용 목록을 물어볼 수 있습니다.
- 시작 시 OpenClaw는 허용 목록의 그룹/사용자 이름을 ID로 해석하고 매핑을 로그에 기록합니다.
- 그룹 허용 목록 매칭은 기본적으로 ID 전용입니다. 해석되지 않은 이름은 `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화되지 않으면 인증에 사용되지 않습니다.
- `channels.zalouser.dangerouslyAllowNameMatching: true`는 변경 가능한 그룹 이름 매칭을 다시 활성화하는 비상 호환성 모드입니다.
- `groupAllowFrom`이 설정되지 않으면 런타임은 그룹 발신자 검사에 `allowFrom`으로 대체합니다.
- 발신자 검사는 일반 그룹 메시지와 제어 명령(예: `/new`, `/reset`) 모두에 적용됩니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### 그룹 멘션 게이팅

- `channels.zalouser.groups.<group>.requireMention`은 그룹 응답에 멘션이 필요한지 제어합니다.
- 해석 순서: 정확한 그룹 id/이름 -> 정규화된 그룹 slug -> `*` -> 기본값(`true`).
- 이는 허용 목록 그룹과 open 그룹 모드 모두에 적용됩니다.
- 봇 메시지를 인용하면 그룹 활성화를 위한 암시적 멘션으로 간주됩니다.
- 권한이 있는 제어 명령(예: `/new`)은 멘션 게이팅을 우회할 수 있습니다.
- 멘션이 필요해서 그룹 메시지가 건너뛰어지면 OpenClaw는 이를 대기 중인 그룹 기록으로 저장하고 다음에 처리되는 그룹 메시지에 포함합니다.
- 그룹 기록 제한은 기본적으로 `messages.groupChat.historyLimit`을 사용합니다(대체값 `50`). 계정별 override는 `channels.zalouser.historyLimit`으로 설정할 수 있습니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
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

## 입력 중, 반응 및 전달 확인

- OpenClaw는 응답을 전송하기 전에 입력 중 이벤트를 보냅니다(best-effort).
- 메시지 반응 액션 `react`는 채널 액션에서 `zalouser`를 지원합니다.
  - 메시지에서 특정 반응 이모지를 제거하려면 `remove: true`를 사용하세요.
  - 반응 의미론: [Reactions](/ko/tools/reactions)
- 이벤트 메타데이터를 포함하는 인바운드 메시지에 대해 OpenClaw는 전달됨 + 읽음 확인을 보냅니다(best-effort).

## 문제 해결

**로그인이 유지되지 않음:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**허용 목록/그룹 이름이 해석되지 않음:**

- `allowFrom`/`groupAllowFrom`/`groups`에 숫자 ID 또는 정확한 친구/그룹 이름을 사용하세요.

**이전 CLI 기반 설정에서 업그레이드함:**

- 이전 외부 `zca` 프로세스 가정을 제거하세요.
- 이제 채널은 외부 CLI 바이너리 없이 OpenClaw 내부에서 완전히 실행됩니다.

## 관련 항목

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [Security](/ko/gateway/security) — 접근 모델 및 보안 강화
