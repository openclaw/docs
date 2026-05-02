---
read_when:
    - OpenClaw용 Zalo Personal 설정하기
    - Zalo Personal 로그인 또는 메시지 흐름 디버깅
summary: 네이티브 zca-js(QR 로그인)를 통한 Zalo 개인 계정 지원, 기능 및 구성
title: Zalo 개인용
x-i18n:
    generated_at: "2026-05-02T22:17:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

상태: 실험적. 이 통합은 OpenClaw 안에서 네이티브 `zca-js`를 통해 **개인 Zalo 계정**을 자동화합니다.

<Warning>
이는 비공식 통합이며 계정 정지 또는 차단으로 이어질 수 있습니다. 본인 책임하에 사용하세요.
</Warning>

## 번들된 Plugin

Zalo Personal은 현재 OpenClaw 릴리스에서 번들된 Plugin으로 제공되므로, 일반
패키지 빌드에는 별도 설치가 필요하지 않습니다.

이전 빌드를 사용 중이거나 Zalo Personal을 제외한 사용자 지정 설치를 사용하는 경우,
npm 패키지를 직접 설치하세요.

- CLI로 설치: `openclaw plugins install @openclaw/zalouser`
- 고정 버전: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- 또는 소스 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 자세한 내용: [Plugins](/ko/tools/plugin)

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 빠른 설정(초보자)

1. Zalo Personal Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. 로그인합니다(QR, Gateway 머신에서):
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
5. DM 접근은 기본적으로 페어링을 사용합니다. 처음 연락할 때 페어링 코드를 승인하세요.

## 정의

- 전적으로 `zca-js`를 통해 프로세스 내부에서 실행됩니다.
- 네이티브 이벤트 리스너를 사용해 수신 메시지를 받습니다.
- JS API를 통해 직접 답장합니다(텍스트/미디어/링크).
- Zalo Bot API를 사용할 수 없는 “개인 계정” 사용 사례를 위해 설계되었습니다.

## 이름 지정

채널 ID는 `zalouser`이며, 이것이 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위한 것입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 예약해 둡니다.

## ID 찾기(디렉터리)

디렉터리 CLI를 사용해 피어/그룹과 해당 ID를 찾습니다.

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한

- 발신 텍스트는 약 2000자 단위로 나뉩니다(Zalo 클라이언트 제한).
- 스트리밍은 기본적으로 차단됩니다.

## 접근 제어(DM)

`channels.zalouser.dmPolicy`는 `pairing | allowlist | open | disabled`를 지원합니다(기본값: `pairing`).

`channels.zalouser.allowFrom`은 사용자 ID 또는 이름을 허용합니다. 설정 중에는 Plugin의 프로세스 내부 연락처 조회를 사용해 이름을 ID로 해석합니다.

승인 방법:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 접근(선택 사항)

- 기본값: `channels.zalouser.groupPolicy = "open"`(그룹 허용). 설정되지 않았을 때 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- 허용 목록으로 제한:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`(키는 안정적인 그룹 ID여야 하며, 가능하면 시작 시 이름을 ID로 해석합니다)
  - `channels.zalouser.groupAllowFrom`(허용된 그룹에서 어떤 발신자가 봇을 트리거할 수 있는지 제어)
- 모든 그룹 차단: `channels.zalouser.groupPolicy = "disabled"`.
- 구성 마법사는 그룹 허용 목록 입력을 요청할 수 있습니다.
- 시작 시 OpenClaw는 허용 목록의 그룹/사용자 이름을 ID로 해석하고 매핑을 로그에 남깁니다.
- 그룹 허용 목록 매칭은 기본적으로 ID 전용입니다. 해석되지 않은 이름은 `channels.zalouser.dangerouslyAllowNameMatching: true`가 활성화되지 않은 한 인증에서 무시됩니다.
- `channels.zalouser.dangerouslyAllowNameMatching: true`는 변경 가능한 그룹 이름 매칭을 다시 활성화하는 긴급 호환성 모드입니다.
- `groupAllowFrom`이 설정되지 않은 경우, 런타임은 그룹 발신자 확인에 `allowFrom`을 대체값으로 사용합니다.
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
- 해석 순서: 정확한 그룹 ID/이름 -> 정규화된 그룹 슬러그 -> `*` -> 기본값(`true`).
- 이는 허용 목록 그룹과 열린 그룹 모드 모두에 적용됩니다.
- 봇 메시지를 인용하면 그룹 활성화를 위한 암시적 멘션으로 간주됩니다.
- 승인된 제어 명령(예: `/new`)은 멘션 게이팅을 우회할 수 있습니다.
- 멘션이 필요해 그룹 메시지를 건너뛰면 OpenClaw는 이를 대기 중인 그룹 기록으로 저장하고 다음에 처리되는 그룹 메시지에 포함합니다.
- 그룹 기록 제한은 기본적으로 `messages.groupChat.historyLimit`입니다(대체값 `50`). 계정별로 `channels.zalouser.historyLimit`로 재정의할 수 있습니다.

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

## 입력 중 표시, 반응, 전달 확인

- OpenClaw는 답장을 디스패치하기 전에 입력 중 이벤트를 전송합니다(최선 노력).
- 메시지 반응 작업 `react`는 채널 작업에서 `zalouser`에 대해 지원됩니다.
  - 메시지에서 특정 반응 이모지를 제거하려면 `remove: true`를 사용하세요.
  - 반응 의미 체계: [반응](/ko/tools/reactions)
- 이벤트 메타데이터가 포함된 수신 메시지의 경우, OpenClaw는 전달됨 + 확인됨 승인을 전송합니다(최선 노력).

## 문제 해결

**로그인이 유지되지 않음:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**허용 목록/그룹 이름이 해석되지 않음:**

- `allowFrom`/`groupAllowFrom`/`groups`에 숫자 ID를 사용하거나 정확한 친구/그룹 이름을 사용하세요.

**이전 CLI 기반 설정에서 업그레이드한 경우:**

- 이전 외부 `zca` 프로세스 가정을 모두 제거하세요.
- 이제 채널은 외부 CLI 바이너리 없이 OpenClaw 안에서 완전히 실행됩니다.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
