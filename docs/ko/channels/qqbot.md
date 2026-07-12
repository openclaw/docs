---
read_when:
    - OpenClaw을 QQ에 연결하려고 합니다
    - QQ Bot 자격 증명 설정이 필요합니다
    - QQ Bot 그룹 또는 비공개 채팅 지원이 필요한 경우
summary: QQ Bot 설정, 구성 및 사용법
title: QQ 봇
x-i18n:
    generated_at: "2026-07-12T00:36:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot은 공식 QQ Bot API(WebSocket Gateway)를 통해 OpenClaw에 연결됩니다.
C2C 비공개 채팅과 그룹 `@` 멘션이 기본 채팅 유형이며 이미지, 음성, 동영상, 파일 등 다양한
미디어를 지원합니다. 길드 채널 메시지는 텍스트와 원격 URL 이미지만 지원하며,
길드 채널에서는 음성, 동영상, 파일 업로드 및 로컬/Base64 이미지를 사용할 수 없습니다.
어디에서도 반응과 스레드는 지원되지 않습니다.

상태: 공식 다운로드 가능 Plugin.

## 설치

```bash
openclaw plugins install @openclaw/qqbot
```

## 설정

1. [QQ Open Platform](https://q.qq.com/)으로 이동한 후 휴대전화의 QQ로 QR 코드를
   스캔하여 등록하거나 로그인합니다.
2. **Create Bot**을 클릭하여 새 QQ 봇을 만듭니다.
3. 봇 설정 페이지에서 **AppID**와 **AppSecret**을 찾아 복사합니다.

<Note>
AppSecret은 일반 텍스트로 저장되지 않습니다. 저장하지 않고 페이지를 벗어나면 새 AppSecret을 다시 생성해야 합니다.
</Note>

4. 채널을 추가합니다.

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway를 다시 시작합니다.

대화형 설정:

```bash
openclaw channels add
```

마법사는 AppID/AppSecret을 직접 입력하는 대신 QR 코드로 바인딩하는 옵션도
제공합니다. 대상 QQ Bot에 연결된 휴대전화 앱으로 코드를 스캔하여 바인딩을
완료합니다. OpenClaw는 반환된 자격 증명을 계정의 구성 범위에 저장합니다.

## 구성

최소 구성:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

기본 계정 환경 변수(최상위 계정만 해당):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

파일 기반 AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

환경 변수 SecretRef AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

참고:

- `openclaw channels add --channel qqbot --token-file ...`은 AppSecret만
  설정합니다. `appId`는 구성이나 `QQBOT_APP_ID`에 이미 설정되어 있어야 합니다.
- `clientSecret`에는 일반 텍스트 문자열, 파일 경로(`clientSecretFile`),
  또는 구조화된 SecretRef 객체를 사용할 수 있습니다.
- 기존 `secretref:...` / `secretref-env:...` 마커 문자열은
  `clientSecret`에서 거부됩니다. 대신 구조화된 SecretRef 객체를 사용하세요.

### 접근 정책

- `allowFrom` / `groupAllowFrom`은 C2C / 그룹 환경에서 봇과 채팅할 수 있는
  사용자를 제한합니다. `dmPolicy` / `groupPolicy`(`open` | `allowlist` | `disabled`)는
  적용 모드를 제어합니다. `allowFrom`에 구체적인(와일드카드가 아닌) 항목이 있으면
  `dmPolicy`의 기본값은 `allowlist`이고, 그렇지 않으면 `open`입니다.
  `groupAllowFrom` 또는 `allowFrom` 중 하나에 구체적인 항목이 있으면
  `groupPolicy`의 기본값은 `allowlist`이고, 그렇지 않으면 `open`입니다.
- "인증: 허용 목록" 슬래시 명령에는 `dmPolicy` / `groupPolicy`와 관계없이
  `allowFrom`(그룹에서 호출하는 경우 `groupAllowFrom`)에 명시적인 비와일드카드
  항목이 필요합니다. [슬래시 명령](#slash-commands)을 참조하세요.

### 다중 계정 설정

단일 OpenClaw 인스턴스에서 여러 QQ 봇을 실행합니다.

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

각 계정은 `appId`를 키로 사용하여 격리된 WebSocket 연결, API 클라이언트 및 토큰
캐시를 소유합니다. 하나의 Gateway에서 여러 봇을 실행할 때 진단 정보를 구분할 수
있도록 로그 줄에는 해당 계정 ID가 표시됩니다.

CLI를 통해 두 번째 봇 추가:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 그룹 채팅

그룹 지원에는 표시 이름이 아닌 QQ 그룹 OpenID를 사용합니다. 봇을 그룹에 추가한 후
봇을 멘션하거나 멘션 없이 실행되도록 그룹을 구성합니다.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]`는 모든 그룹의 기본값을 설정하며, 구체적인 `groups.GROUP_OPENID`
항목은 특정 그룹에 대해 해당 기본값을 재정의합니다. 그룹 설정:

| 필드                  | 기본값           | 설명                                                                                             |
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `requireMention`      | `true`           | 봇이 응답하기 전에 `@` 멘션을 요구합니다.                                                       |
| `commandLevel`        | `all`            | 그룹에서 실행할 수 있는 기본 제공 슬래시 명령을 지정합니다(아래 참조).                           |
| `ignoreOtherMentions` | `false`          | 봇이 아닌 다른 사람만 멘션한 메시지를 삭제합니다.                                                |
| `historyLimit`        | `50`             | 다음 멘션 차례의 컨텍스트로 유지할 최근 비멘션 메시지 수입니다. `0`은 기록을 비활성화합니다.     |
| `tools`               | —                | 전체 그룹에서 도구를 허용하거나 거부합니다.                                                      |
| `toolsBySender`       | —                | 발신자별 도구 재정의입니다. [그룹](/ko/channels/groups#groupchannel-tool-restrictions-optional)을 참조하세요. |
| `name`                | openid 접두사    | 로그와 그룹 컨텍스트에서 사용하는 알아보기 쉬운 레이블입니다.                                   |
| `prompt`              | 기본 제공 기본값 | 에이전트 컨텍스트에 추가되는 그룹별 동작 프롬프트입니다.                                         |

`commandLevel`에 사용할 수 있는 값:

| 수준     | 동작                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 기존 기본 제공 명령을 계속 사용할 수 있습니다. 일부는 메뉴에서 숨겨진 상태로 유지되지만 승인된 사용자는 그룹에서 계속 실행할 수 있습니다.            |
| `safety` | `/help`, `/btw`, `/stop`은 그룹에 계속 표시되며, 민감한 명령(`/config`, `/tools`, `/bash` 등)은 비공개 채팅에서 실행해야 합니다.                      |
| `strict` | 엄격한 운영에 필요한 그룹 세션 제어만 허용됩니다. 승인된 발신자가 진행 중인 실행을 중단할 수 있도록 `/stop`은 계속 작동합니다.                       |

기존 QQBot `toolPolicy` 항목은 폐기되었습니다. `openclaw doctor --fix`를 실행하여 `tools`로 마이그레이션하세요.

활성화 모드는 `mention`과 `always`입니다. `requireMention: true`는
`mention`에, `requireMention: false`는 `always`에 매핑됩니다. 세션 수준의 활성화
재정의가 있으면 구성보다 우선합니다.

수신 큐는 피어별로 구성됩니다. 그룹 피어의 큐 한도는 직접 피어보다 큽니다(50 대 20).
큐가 가득 차면 사람이 작성한 메시지보다 봇이 작성한 메시지를 먼저 제거하며, 연속으로
도착한 일반 그룹 메시지를 발신자가 표시된 하나의 차례로 병합합니다. 슬래시 명령은
병합 배치와 독립적으로 하나씩 실행됩니다.

### 음성(STT / TTS)

STT와 TTS는 우선순위 폴백이 적용되는 2단계 구성을 지원합니다.

| 설정 | Plugin별 구성                                             | 프레임워크 폴백              |
| ---- | --------------------------------------------------------- | ---------------------------- |
| STT  | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`               |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

둘 중 하나에 `enabled: false`를 설정하면 비활성화됩니다. 계정 수준 TTS 재정의는
`messages.tts`와 동일한 형태를 사용하며 채널/전역 TTS 구성 위에 심층 병합됩니다.

STT 요청은 기본적으로 60초 후 시간 초과됩니다. Plugin별 STT는 선택한
`models.providers.<id>.timeoutSeconds` 재정의를 사용합니다. 프레임워크 오디오 STT는
`tools.media.audio.models[0].timeoutSeconds`, `tools.media.audio.timeoutSeconds`,
선택한 제공자 재정의 순서로 사용합니다.

수신 QQ 음성 첨부 파일은 원본 음성 파일을 일반 `MediaPaths`에서 제외한 상태로
에이전트에 오디오 미디어 메타데이터로 제공됩니다. TTS가 구성된 경우 일반 텍스트
응답의 `[[audio_as_voice]]`는 TTS를 합성하여 기본 QQ 음성 메시지로 전송합니다.

발신 오디오 업로드/트랜스코딩 동작은 `channels.qqbot.audioFormatPolicy`로도
조정할 수 있습니다.

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 대상 형식

| 형식                       | 설명              |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | 비공개 채팅(C2C)  |
| `qqbot:group:GROUP_OPENID` | 그룹 채팅         |
| `qqbot:channel:CHANNEL_ID` | 길드 채널         |

<Note>
각 봇에는 고유한 사용자 OpenID 집합이 있습니다. 봇 A가 수신한 OpenID는 봇 B를 통해 메시지를 보내는 데 **사용할 수 없습니다**.
</Note>

## 슬래시 명령

AI 큐에 들어가기 전에 가로채는 기본 제공 명령:

| 명령                 | 인증      | 범위             | 설명                                                                                 |
| -------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | 모두             | 지연 시간 테스트                                                                     |
| `/bot-help`          | —         | 모두             | 모든 명령 나열                                                                       |
| `/bot-me`            | —         | 비공개 전용      | `allowFrom` / `groupAllowFrom` 설정을 위한 발신자의 QQ 사용자 ID(openid) 표시         |
| `/bot-version`       | —         | 비공개 전용      | OpenClaw 프레임워크 버전과 Plugin 버전 표시                                           |
| `/bot-upgrade`       | —         | 비공개 전용      | QQBot 업그레이드 안내서 링크 표시                                                     |
| `/bot-approve`       | 허용 목록 | 비공개 전용      | 명령 실행 승인 구성 관리(켜기 / 끄기 / 항상 / 초기화 / 상태)                         |
| `/bot-logs`          | 허용 목록 | 비공개 전용      | 최근 Gateway 로그를 파일로 내보내기                                                   |
| `/bot-clear-storage` | 허용 목록 | 비공개 전용      | QQBot 미디어 디렉터리에 캐시된 다운로드 삭제                                          |
| `/bot-streaming`     | 허용 목록 | 비공개 전용      | C2C 스트리밍 응답 전환                                                                |
| `/bot-group-allways` | 허용 목록 | 비공개 전용      | 기본 그룹 활성화 모드 전환(멘션 필요 또는 항상 활성화)                                |

사용법 도움말을 보려면 명령 뒤에 `?`를 추가하세요(예: `/bot-upgrade ?`).

"인증: 허용 목록" 명령을 사용하려면 발신자의 openid가 명시적인 비와일드카드
`allowFrom` 목록에 있어야 합니다. 그룹에서 실행된 명령에는 `groupAllowFrom`이
우선 적용되고, 없으면 `allowFrom`으로 폴백합니다. 와일드카드
`allowFrom: ["*"]`는 채팅은 허용하지만 이러한 명령은 허용하지 않습니다.
비공개 채팅 외부에서 명령을 실행하거나 권한 없이 실행하면 메시지를 조용히
삭제하는 대신 안내를 반환합니다.

`/bot-me`, `/bot-version`, `/bot-upgrade`는 비공개 채팅에서만 사용할 수 있지만
허용 목록은 필요하지 않습니다. 모든 C2C 발신자가 실행할 수 있습니다.

QQ Bot 실행 승인이 기본 동일 채팅 폴백을 사용할 때, 네이티브 승인
버튼 클릭에도 명시적인 비와일드카드 명령 허용 목록이 동일하게 적용됩니다. 더 광범위한
명령 접근 권한 없이 승인 전용 접근 권한을 부여하려면
`channels.qqbot.execApprovals.approvers`를 구성하세요. 네이티브 실행 승인은 기본적으로
활성화되어 있습니다.

## 미디어 및 저장소

- 수신, 발신 및 Gateway 브리지 미디어는
  `~/.openclaw/media/qqbot` 아래의 단일 페이로드 루트를 공유하며(`OPENCLAW_HOME`이 설정된 경우 이를 따름), 업로드,
  다운로드 및 트랜스코딩 캐시는 하나의 보호된 디렉터리 아래에 유지됩니다.
- C2C 및 그룹 대상에 대한 리치 미디어 전송은 단일 `sendMedia`
  경로를 거칩니다. 5&nbsp;MiB 이상의 로컬 파일과 메모리 내 버퍼는 QQ의
  청크 업로드 엔드포인트를 사용하며, 더 작은 페이로드와 원격 URL/Base64 소스는
  일회성 업로드 API를 사용합니다.
- 핫 업그레이드로 인해 `openclaw.json` 쓰기가 완료되기 전에 Gateway가
  중단되면 Plugin은 다음 시작 시 내부 스냅샷에서 해당 계정의 마지막으로 알려진
  `appId` / `clientSecret`을 복원합니다(의도적인 구성 변경은 절대
  덮어쓰지 않음). 따라서 QR 코드를 다시 스캔할 필요가 없습니다.

## 문제 해결

- **Gateway가 시작되지 않음 / 수신 메시지가 없음:** `appId`와
  `clientSecret`이 올바르고 QQ Open Platform에서 봇이 활성화되어 있는지 확인하세요.
  자격 증명이 누락되면 "QQBot이 구성되지 않음(appId 또는
  clientSecret 누락)"이 표시됩니다.
- **`--token-file`로 설정해도 구성되지 않은 것으로 표시됨:** `--token-file`은
  AppSecret만 설정합니다. `appId`는 여전히 구성이나 `QQBOT_APP_ID`에 설정해야 합니다.
- **한꺼번에 몰린 그룹 답장이 충돌함:** 피어의 큐가 가득 차면 수신 큐는 사람이 작성한
  메시지보다 봇이 작성한 메시지를 먼저 제거하고, 일반적인(명령이 아닌) 그룹 메시지의
  버스트를 출처가 표시된 하나의 턴으로 병합합니다. 따라서 봇 대화가 폭주하더라도
  사람의 메시지가 처리되지 못해서는 안 됩니다.
- **능동적 메시지가 도착하지 않음:** 사용자가 최근에 상호작용하지 않았다면 QQ가
  봇이 시작한 메시지를 차단할 수 있습니다.
- **음성이 전사되지 않음:** STT가 구성되어 있고 제공자에 연결할 수 있는지 확인하세요.

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 문제 해결](/ko/channels/troubleshooting)
