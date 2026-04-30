---
read_when:
    - OpenClaw용 Zalo Personal 설정
    - Zalo Personal 로그인 또는 메시지 흐름 디버깅
summary: 네이티브 zca-js(QR 로그인)를 통한 Zalo 개인 계정 지원, 기능 및 설정
title: Zalo 개인용
x-i18n:
    generated_at: "2026-04-30T06:20:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

상태: 실험적. 이 통합은 OpenClaw 안에서 네이티브 `zca-js`를 통해 **개인 Zalo 계정**을 자동화합니다.

<Warning>
이것은 비공식 통합이며 계정 정지 또는 차단으로 이어질 수 있습니다. 본인 책임하에 사용하세요.
</Warning>

## 번들 Plugin

Zalo Personal은 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로 일반
패키지 빌드에는 별도 설치가 필요하지 않습니다.

이전 빌드나 Zalo Personal을 제외한 사용자 지정 설치를 사용하는 경우,
패키지가 게시되면 최신 npm 패키지를 설치하세요.

- CLI로 설치: `openclaw plugins install @openclaw/zalouser`
- 또는 소스 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 자세한 내용: [Plugins](/ko/tools/plugin)

npm에서 OpenClaw 소유 패키지가 deprecated로 보고되면, 더 최신 npm 패키지가
게시될 때까지 현재 패키지된 OpenClaw 빌드나 로컬 체크아웃 경로를 사용하세요.

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 빠른 설정(초보자용)

1. Zalo Personal Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치는 위 명령으로 수동 추가할 수 있습니다.
2. 로그인(QR, Gateway 머신에서):
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

4. Gateway를 다시 시작하거나 설정을 완료합니다.
5. DM 접근은 기본적으로 페어링을 사용합니다. 첫 연락 시 페어링 코드를 승인하세요.

## 이것은 무엇인가요

- `zca-js`를 통해 완전히 프로세스 내부에서 실행됩니다.
- 네이티브 이벤트 리스너를 사용해 인바운드 메시지를 수신합니다.
- JS API를 통해 직접 답장합니다(텍스트/미디어/링크).
- Zalo Bot API를 사용할 수 없는 “개인 계정” 사용 사례를 위해 설계되었습니다.

## 이름 지정

채널 ID는 `zalouser`입니다. 이는 이 통합이 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위해서입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 예약해 둡니다.

## ID 찾기(디렉터리)

디렉터리 CLI를 사용해 피어/그룹과 해당 ID를 찾으세요.

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한

- 아웃바운드 텍스트는 약 2000자로 분할됩니다(Zalo 클라이언트 제한).
- 스트리밍은 기본적으로 차단됩니다.

## 접근 제어(DM)

`channels.zalouser.dmPolicy`는 `pairing | allowlist | open | disabled`를 지원합니다(기본값: `pairing`).

`channels.zalouser.allowFrom`은 사용자 ID 또는 이름을 허용합니다. 설정 중에는 Plugin의 프로세스 내부 연락처 조회를 사용해 이름이 ID로 확인됩니다.

승인 방법:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 접근(선택 사항)

- 기본값: `channels.zalouser.groupPolicy = "open"`(그룹 허용). 설정되지 않은 경우 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- 허용 목록으로 제한:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`(키는 안정적인 그룹 ID여야 하며, 가능하면 시작 시 이름이 ID로 확인됩니다)
  - `channels.zalouser.groupAllowFrom`(허용된 그룹에서 어떤 발신자가 봇을 트리거할 수 있는지 제어)
- 모든 그룹 차단: `channels.zalouser.groupPolicy = "disabled"`.
- 구성 마법사가 그룹 허용 목록을 입력하도록 요청할 수 있습니다.
- 시작 시 OpenClaw는 허용 목록의 그룹/사용자 이름을 ID로 확인하고 매핑을 로그로 남깁니다.
- 그룹 허용 목록 매칭은 기본적으로 ID 전용입니다. 확인되지 않은 이름은 `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화되지 않는 한 인증에서 무시됩니다.
- `channels.zalouser.dangerouslyAllowNameMatching: true`는 변경 가능한 그룹 이름 매칭을 다시 활성화하는 비상용 호환성 모드입니다.
- `groupAllowFrom`이 설정되지 않은 경우 런타임은 그룹 발신자 확인에 `allowFrom`으로 폴백합니다.
- 발신자 확인은 일반 그룹 메시지와 제어 명령(예: `/new`, `/reset`) 모두에 적용됩니다.

예:

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

- `channels.zalouser.groups.<group>.requireMention`은 그룹 답장에 멘션이 필요한지 제어합니다.
- 확인 순서: 정확한 그룹 id/name -> 정규화된 그룹 슬러그 -> `*` -> 기본값(`true`).
- 이는 허용 목록 그룹과 공개 그룹 모드 모두에 적용됩니다.
- 봇 메시지를 인용하면 그룹 활성화를 위한 암시적 멘션으로 간주됩니다.
- 승인된 제어 명령(예: `/new`)은 멘션 게이팅을 우회할 수 있습니다.
- 멘션이 필요해서 그룹 메시지를 건너뛴 경우 OpenClaw는 이를 대기 중인 그룹 기록으로 저장하고 다음에 처리되는 그룹 메시지에 포함합니다.
- 그룹 기록 제한은 기본적으로 `messages.groupChat.historyLimit`입니다(폴백 `50`). 계정별로 `channels.zalouser.historyLimit`로 재정의할 수 있습니다.

예:

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

계정은 OpenClaw 상태의 `zalouser` 프로필에 매핑됩니다. 예:

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

## 입력 중 표시, 반응, 전송 확인

- OpenClaw는 답장을 보내기 전에 입력 중 이벤트를 전송합니다(최선 노력).
- 메시지 반응 작업 `react`는 채널 작업에서 `zalouser`에 대해 지원됩니다.
  - 메시지에서 특정 반응 이모지를 제거하려면 `remove: true`를 사용하세요.
  - 반응 의미 체계: [반응](/ko/tools/reactions)
- 이벤트 메타데이터가 포함된 인바운드 메시지에 대해 OpenClaw는 전달됨 + 읽음 확인을 전송합니다(최선 노력).

## 문제 해결

**로그인이 유지되지 않는 경우:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**허용 목록/그룹 이름이 확인되지 않은 경우:**

- `allowFrom`/`groupAllowFrom`/`groups`에서 숫자 ID를 사용하거나 정확한 친구/그룹 이름을 사용하세요.

**이전 CLI 기반 설정에서 업그레이드한 경우:**

- 이전 외부 `zca` 프로세스 가정은 모두 제거하세요.
- 이제 이 채널은 외부 CLI 바이너리 없이 OpenClaw 안에서 완전히 실행됩니다.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
