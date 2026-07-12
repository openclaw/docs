---
read_when:
    - Tlon/Urbit 채널 기능 작업 중
summary: Tlon/Urbit 지원 상태, 기능 및 구성
title: Tlon
x-i18n:
    generated_at: "2026-07-12T14:59:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon은 Urbit 기반의 탈중앙화 메신저입니다. OpenClaw는 사용자의 Urbit 함선에 연결하여
DM 및 그룹 채팅 메시지에 응답합니다. 그룹 답장에는 기본적으로 @ 멘션이 필요하며, 그 위에
권한 부여 규칙과 소유자 승인 흐름이 적용됩니다.

상태: 번들 Plugin. DM, 그룹 멘션, 스레드, 리치 텍스트, 이미지 업로드/다운로드 및
소유자 승인 시스템을 지원합니다. 반응과 투표는 지원하지 않습니다.

## 번들 Plugin

Tlon은 현재 OpenClaw 릴리스에 번들로 포함되어 제공되므로, 패키징된 빌드에서는 별도로 설치할 필요가 없습니다.

이를 제외한 이전 빌드나 사용자 지정 설치에서는 npm에서 설치하십시오.

```bash
openclaw plugins install @openclaw/tlon
```

현재 릴리스 태그를 추적하려면 버전이 없는 패키지 이름을 사용하십시오. 재현 가능한 설치가 필요한 경우에만
버전(`@openclaw/tlon@x.y.z`)을 고정하십시오.

로컬 체크아웃에서 설치하려면 다음을 실행하십시오.

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

자세한 내용: [Plugin](/ko/tools/plugin)

## 설정

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

또는 구성을 직접 편집하십시오.

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always authorized
    },
  },
}
```

구성을 직접 편집한 후 Gateway를 다시 시작하십시오. 그런 다음 봇에 DM을 보내거나 그룹
채널에서 @ 멘션하십시오.

## 비공개/LAN 함선

OpenClaw는 기본적으로 SSRF 방지를 위해 비공개/내부 호스트 이름과 IP 범위를 차단합니다.
함선이 비공개 네트워크(localhost, LAN IP, 내부 호스트 이름)에서 실행되는 경우 명시적으로 허용하십시오.

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

`http://localhost:8080`, `http://192.168.x.x:8080`,
`http://my-ship.local:8080` 같은 대상에 적용됩니다. 신뢰할 수 있는 함선 URL에만 활성화하십시오.
이 설정은 해당 계정의 HTTP 요청에 대한 SSRF 방지를 비활성화합니다.

<Note>
`channels.tlon.allowPrivateNetwork`(평면 키)는 폐기되었습니다. `openclaw doctor --fix`는 이를
`channels.tlon.network.dangerouslyAllowPrivateNetwork`로 자동 이동합니다.
</Note>

## 그룹 채널

채널을 수동으로 고정하거나 자동 검색을 활성화하십시오.

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

구성에 `autoDiscoverChannels`가 설정되지 않은 경우 기본값은 `false`입니다. 설정 마법사는
프롬프트의 기본값을 예로 설정하고 `true`를 명시적으로 기록합니다. 활성화하면 OpenClaw는 시작 시
참여한 그룹을 스크라이하고, 그룹 초대가 수락되면 새 채널을 감시하며, 2분마다 다시 확인합니다.

## 액세스 제어

DM 허용 목록(비어 있으면 발신자가 `ownerShip`인 경우를 제외하고 DM을 허용하지 않음):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

그룹 권한 부여는 채널별로 기본값이 `restricted`입니다. 기준선을 설정하려면
`defaultAuthorizedShips`를 지정하고, 채널 네스트별로 재정의하십시오.

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

봇이 스레드 내에서 한 번 답장하면 이후 해당 스레드의 메시지에는 추가 멘션 없이
계속 응답합니다.

## 소유자 및 승인 시스템

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

소유자 함선은 모든 곳에서 권한이 부여됩니다. DM 초대와 그룹 초대는 항상 자동 수락되며,
채널 메시지는 항상 권한 검사를 통과합니다. 소유자는 `dmAllowlist`,
`defaultAuthorizedShips` 또는 `groupInviteAllowlist`에 포함될 필요가 없습니다.

`ownerShip`이 설정된 경우 권한이 없는 요청을 단순히 삭제하지 않습니다. 대기 중인
승인으로 등록하고 소유자에게 DM을 보냅니다.

- `dmAllowlist`에 없는 함선의 DM 요청
- 발신자가 권한 검사를 통과하지 못하는 채널의 멘션
- `groupInviteAllowlist`에 없는 함선의 그룹 초대(자동 수락이 꺼져 있거나, 켜져 있지만
  초대한 함선이 허용 목록에 없는 경우)

소유자는 DM으로 답장하여 요청을 처리합니다.

| 소유자 답장                  | 효과                                               |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | 가장 최근의 대기 중인 승인을 처리합니다             |
| `approve <id>` / `deny <id>` | ID로 특정 승인을 처리합니다                    |
| `block`                      | 함선이 다시 연결할 수 없도록 네이티브 차단도 수행합니다 |
| `unblock ~ship`              | 네이티브 차단을 해제합니다                              |
| `blocked`                    | 현재 차단된 함선을 나열합니다                        |
| `pending`                    | 대기 중인 승인 요청을 나열합니다                      |

`ownerShip`이 구성되지 않은 경우 권한이 없는 DM과 채널 멘션은 단순히 삭제되고 기록되며,
승인 프롬프트는 표시되지 않습니다.

## 자동 수락 설정

이미 `dmAllowlist`에 있는 함선의 DM 초대를 자동 수락합니다(이 플래그와 관계없이 소유자는
항상 자동 수락됨).

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

허용 목록에 있는 함선의 그룹 초대를 자동 수락합니다(안전하게 거부: `autoAcceptGroupInvites: true`이고
`groupInviteAllowlist`가 비어 있으면 소유자가 아닌 함선의 초대는 수락되지 않음).

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Urbit 설정 저장소를 통한 핫 리로드

위 설정 대부분(`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`)은 최초 실행 시 함선의
`%settings` 에이전트(데스크 `moltbot`, 버킷 `tlon`)에 미러링된 후 그곳에서 실시간으로 읽힙니다.
따라서 Landscape 클라이언트나 번들 Skills의 설정 명령으로 변경한 내용은 Gateway를
다시 시작하지 않아도 적용됩니다. `channelRules`와 대기 중인 승인도 그곳에 JSON으로 유지됩니다.
설정 저장소에 기록된 적이 없는 값은 파일 구성이 계속 신뢰할 수 있는 원본입니다.

## 전달 대상(CLI/Cron)

`openclaw message send` 또는 Cron 전달과 함께 사용하십시오.

- DM: `~sampel-palnet` 또는 `dm/~sampel-palnet`
- 그룹: `chat/~host-ship/channel` 또는 `group:~host-ship/channel`

## 번들 Skills

Plugin에는 Urbit 작업을 직접 수행하기 위한 CLI인
[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)이 번들로 포함되어 있으며,
Plugin을 설치하면 자동으로 사용할 수 있습니다.

- **활동**: 멘션, 답장, 읽지 않은 항목
- **채널**: 목록 조회, 생성, 이름 변경
- **연락처**: 프로필 목록 조회/가져오기/업데이트
- **그룹**: 생성, 참여, 초대/요청 흐름, 역할
- **훅**: 채널 훅 관리
- **메시지**: 기록, 검색
- **DM**: 전송, 반응, 수락/거절
- **게시물**: 반응, 삭제
- **노트북**: 일기 채널에 게시
- **설정**: 위 설정 저장소를 통해 Plugin 구성을 핫 리로드

## 기능

| 기능         | 상태                                        |
| --------------- | --------------------------------------------- |
| 다이렉트 메시지 | 지원                                     |
| 그룹/채널 | 지원(기본적으로 멘션 필요)          |
| 스레드         | 지원(한 번 참여하면 계속 답장함) |
| 리치 텍스트       | Markdown을 Tlon의 네이티브 형식으로 변환    |
| 이미지          | 수신 이미지는 다운로드하고 발신 이미지는 업로드         |
| 반응       | [번들 Skills](#bundled-skill)을 통해서만 지원  |
| 투표           | 지원하지 않음                                 |
| 네이티브 명령 | 기본적으로 소유자만 사용 가능                         |

## 문제 해결

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

일반적인 오류:

- **DM이 무시됨**: 발신자가 `dmAllowlist`에 없고 승인 흐름을 위한 `ownerShip`도 구성되지 않았습니다.
- **그룹 메시지가 무시됨**: 채널이 검색되거나 고정되지 않았거나, 발신자가 권한 검사를 통과하지 못했으며
  승인을 대기열에 추가할 `ownerShip`도 없습니다.
- **연결 오류**: 함선 URL에 접근할 수 있는지 확인하십시오. 로컬 함선에는
  `network.dangerouslyAllowPrivateNetwork`를 설정하십시오.
- **인증 오류**: 로그인 코드는 순환되므로 함선에서 현재 코드를 복사하십시오.

## 구성 참조

전체 구성: [구성](/ko/gateway/configuration)

| 키                                                    | 의미                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | 채널 시작을 활성화/비활성화합니다.                                |
| `channels.tlon.ship`                                   | 봇의 Urbit 함선 이름(예: `~sampel-palnet`).                 |
| `channels.tlon.url`                                    | 함선 URL(예: `https://sampel-palnet.tlon.network`).          |
| `channels.tlon.code`                                   | 함선 로그인 코드.                                               |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | localhost/LAN 함선 URL을 허용합니다(SSRF 명시적 허용).                   |
| `channels.tlon.ownerShip`                              | 소유자 함선: 항상 권한이 부여되며 승인 요청을 받습니다.     |
| `channels.tlon.dmAllowlist`                            | DM이 허용된 함선(비어 있으면 소유자 외에는 없음).              |
| `channels.tlon.autoAcceptDmInvites`                    | `dmAllowlist`에 있는 함선의 DM을 자동 수락합니다.                   |
| `channels.tlon.autoAcceptGroupInvites`                 | `groupInviteAllowlist`에 있는 함선의 그룹 초대를 자동 수락합니다.         |
| `channels.tlon.groupInviteAllowlist`                   | 그룹 초대가 자동 수락되는 함선입니다.                   |
| `channels.tlon.autoDiscoverChannels`                   | 참여한 그룹 채널을 자동 검색합니다(기본값: `false`).        |
| `channels.tlon.groupChannels`                          | 수동으로 고정된 채널 네스트입니다.                                 |
| `channels.tlon.defaultAuthorizedShips`                 | 모든 채널에 권한이 부여된 함선입니다(일치하는 규칙이 없을 때 사용). |
| `channels.tlon.authorization.channelRules`             | 채널 네스트별 인증 모드 및 허용 목록입니다.                        |
| `channels.tlon.showModelSignature`                     | 답장에 `_[Generated by <model>]_`을 추가합니다.                  |
| `channels.tlon.responsePrefix`                         | 발신 답장 앞에 추가되는 정적 접두사입니다.                   |
| `channels.tlon.accounts.<id>`                          | 추가로 이름이 지정된 계정입니다(다중 함선 설정).                 |

## 참고 사항

- 봇이 이미 해당 스레드에 참여한 경우를 제외하면 그룹 답장에는 @ 멘션(예: `~your-bot-ship`)이 필요합니다.
- 스레드 답장은 스레드 내에 게시됩니다. 또한 에이전트가 사용할 수 있도록 스레드 컨텍스트의 최근 메시지 10개가
  앞에 추가됩니다.
- 리치 텍스트(굵게, 기울임꼴, 코드, 제목, 목록)는 Tlon의 네이티브 형식으로 변환됩니다.
- 채널 요약을 요청하는 수신 메시지(예: "이 채널을 요약해 주세요")를 보내면
  일반 답장 흐름 대신 내장된 기록 요약이 실행됩니다.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
