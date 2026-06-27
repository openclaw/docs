---
read_when:
    - OpenClaw를 QQ에 연결하려고 합니다.
    - QQ Bot 자격 증명 설정이 필요합니다
    - QQ Bot 그룹 또는 개인 채팅 지원을 원하는 경우
summary: QQ Bot 설정, 구성 및 사용법
title: QQ 봇
x-i18n:
    generated_at: "2026-06-27T17:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot은 공식 QQ Bot API(WebSocket gateway)를 통해 OpenClaw에 연결됩니다. 이
Plugin은 C2C 비공개 채팅, 그룹 @메시지, 리치 미디어(이미지, 음성, 비디오, 파일)가 포함된
길드 채널 메시지를 지원합니다.

상태: 다운로드 가능한 Plugin. 다이렉트 메시지, 그룹 채팅, 길드 채널, 미디어가
지원됩니다. 반응과 스레드는 지원되지 않습니다.

## 설치

설정 전에 QQ Bot을 설치하세요.

```bash
openclaw plugins install @openclaw/qqbot
```

## 설정

1. [QQ Open Platform](https://q.qq.com/)으로 이동하고 휴대폰 QQ로 QR 코드를 스캔하여
   등록하거나 로그인합니다.
2. **Create Bot**을 클릭하여 새 QQ 봇을 생성합니다.
3. 봇 설정 페이지에서 **AppID**와 **AppSecret**을 찾아 복사합니다.

> AppSecret은 일반 텍스트로 저장되지 않습니다. 저장하지 않고 페이지를 떠나면
> 새로 다시 생성해야 합니다.

4. 채널을 추가합니다.

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway를 다시 시작합니다.

대화형 설정 경로:

```bash
openclaw channels add
openclaw configure --section channels
```

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

기본 계정 환경 변수:

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

- 환경 변수 폴백은 기본 QQ Bot 계정에만 적용됩니다.
- `openclaw channels add --channel qqbot --token-file ...`은
  AppSecret만 제공합니다. AppID는 구성 또는 `QQBOT_APP_ID`에 이미 설정되어 있어야 합니다.
- `clientSecret`은 일반 텍스트 문자열뿐 아니라 SecretRef 입력도 허용합니다.
- 레거시 `secretref:/...` 마커 문자열은 유효한 `clientSecret` 값이 아닙니다.
  위 예시처럼 구조화된 SecretRef 객체를 사용하세요.

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

각 계정은 자체 WebSocket 연결을 시작하고 독립적인 토큰 캐시를 유지합니다
(`appId`로 격리됨).

CLI로 두 번째 봇 추가:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 그룹 채팅

QQ Bot 그룹 채팅 지원은 표시 이름이 아니라 QQ 그룹 OpenID를 사용합니다. 봇을
그룹에 추가한 다음 멘션하거나, 멘션 없이 실행되도록 그룹을 구성하세요.

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

`groups["*"]`는 모든 그룹의 기본값을 설정하고, 구체적인
`groups.GROUP_OPENID` 항목은 한 그룹에 대해 해당 기본값을 재정의합니다. 그룹
설정에는 다음이 포함됩니다.

- `requireMention`: 봇이 응답하기 전에 @멘션을 요구합니다. 기본값: `true`.
- `commandLevel`: 그룹에서 실행할 수 있는 내장 슬래시 명령을 제어합니다.
  기본값: `all`이며, 설정이 생략되었을 때 기존 QQBot 그룹 동작을 보존합니다.
- `ignoreOtherMentions`: 봇이 아닌 다른 사람을 멘션한 메시지를 버립니다.
- `historyLimit`: 다음 멘션된 턴의 컨텍스트로 최근 비멘션 그룹 메시지를 유지합니다. 비활성화하려면 `0`으로 설정합니다.
- `tools`: 전체 그룹에 대해 도구를 허용하거나 거부합니다.
- `toolsBySender`: 발신자별 그룹 도구 재정의입니다. [그룹](/ko/channels/groups#groupchannel-tool-restrictions-optional)을 참조하세요.
- `name`: 로그와 그룹 컨텍스트에 사용되는 친숙한 레이블입니다.
- `prompt`: 에이전트 컨텍스트에 추가되는 그룹별 동작 프롬프트입니다.

`commandLevel`은 다음을 허용합니다.

- `all`: 인식된 내장 명령을 이전처럼 사용할 수 있게 유지합니다. 일부 명령은
  메뉴에서 계속 숨겨질 수 있지만, 권한이 있는 사용자는 그룹에서 여전히 실행할 수 있습니다.
- `safety`: `/help`, `/btw`, `/stop` 같은 일반 협업 명령을 허용하고,
  `/config`, `/tools`, `/bash` 같은 민감한 명령은 비공개 채팅에서 실행하도록
  사용자에게 안내합니다.
- `strict`: 엄격한 그룹 운영에 필요한 그룹 세션 제어만 허용합니다.
  `/stop`은 권한이 있는 발신자가 활성 실행을 중단할 수 있도록 여전히 긴급 상태로 유지됩니다.

이전 QQBot `toolPolicy` 항목은 폐기되었습니다. `openclaw doctor --fix`를 실행하여 `tools`로 마이그레이션하세요.

활성화 모드는 `mention`과 `always`입니다. `requireMention: true`는
`mention`에 매핑되고, `requireMention: false`는 `always`에 매핑됩니다. 세션 수준 활성화
재정의가 있으면 구성보다 우선합니다.

인바운드 큐는 피어별입니다. 그룹 피어는 더 큰 큐 제한을 받고, 가득 찼을 때 봇이 작성한 잡담보다
사람 메시지를 앞에 유지하며, 일반 그룹 메시지의 버스트를 하나의 속성 지정된 턴으로
병합합니다. 슬래시 명령은 여전히 하나씩 실행됩니다.

### 음성(STT / TTS)

STT와 TTS는 우선순위 폴백이 있는 2단계 구성을 지원합니다.

| 설정 | Plugin별                                                  | 프레임워크 폴백              |
| ---- | --------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`                |

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

둘 중 하나를 비활성화하려면 `enabled: false`를 설정합니다.
계정 수준 TTS 재정의는 `messages.tts`와 같은 형태를 사용하며 채널/전역 TTS 구성 위에
깊게 병합됩니다.

인바운드 QQ 음성 첨부 파일은 원시 음성 파일을 일반 `MediaPaths`에서 제외한 상태로
오디오 미디어 메타데이터로 에이전트에 노출됩니다. `[[audio_as_voice]]` 일반
텍스트 응답은 TTS가 구성되어 있을 때 TTS를 합성하고 네이티브 QQ 음성 메시지를 보냅니다.

아웃바운드 오디오 업로드/트랜스코딩 동작도
`channels.qqbot.audioFormatPolicy`로 조정할 수 있습니다.

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 대상 형식

| 형식                       | 설명             |
| -------------------------- | ---------------- |
| `qqbot:c2c:OPENID`         | 비공개 채팅(C2C) |
| `qqbot:group:GROUP_OPENID` | 그룹 채팅        |
| `qqbot:channel:CHANNEL_ID` | 길드 채널        |

> 각 봇에는 자체 사용자 OpenID 집합이 있습니다. Bot A가 받은 OpenID는 **Bot B를 통해**
> 메시지를 보내는 데 사용할 수 없습니다.

## 슬래시 명령

AI 큐 전에 가로채는 내장 명령:

| 명령           | 설명                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 지연 시간 테스트                                                                                          |
| `/bot-version` | OpenClaw 프레임워크 버전 표시                                                                              |
| `/bot-help`    | 모든 명령 나열                                                                                            |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` 설정을 위한 발신자의 QQ 사용자 ID(openid) 표시                                |
| `/bot-upgrade` | QQBot 업그레이드 가이드 링크 표시                                                                         |
| `/bot-logs`    | 최근 gateway 로그를 파일로 내보내기                                                                       |
| `/bot-approve` | 네이티브 흐름을 통해 보류 중인 QQ Bot 작업 승인(예: C2C 또는 그룹 업로드 확인).                           |

사용 도움말을 보려면 아무 명령에나 `?`를 추가하세요(예: `/bot-upgrade ?`).

관리자 명령(`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`)은 다이렉트 메시지 전용이며, 발신자의 openid가 명시적인 비와일드카드 `allowFrom` 목록에 있어야 합니다. 와일드카드 `allowFrom: ["*"]`는 채팅을 허용하지만 관리자 명령 접근 권한을 부여하지 않습니다. 그룹 메시지는 먼저 `groupAllowFrom`과 대조한 다음 `allowFrom`으로 폴백합니다. 그룹에서 관리자 명령을 실행하면 조용히 버리는 대신 힌트를 반환합니다.

QQ Bot exec 승인이 기본 동일 채팅 폴백을 사용할 때, 네이티브 승인
버튼 클릭은 동일한 명시적 비와일드카드 명령 허용 목록을 따릅니다. 더 넓은 명령 접근 없이
승인 전용 접근 권한을 부여하려면 `channels.qqbot.execApprovals.approvers`를 구성하세요.

## 엔진 아키텍처

QQ Bot은 Plugin 내부에 자체 완결형 엔진으로 제공됩니다.

- 각 계정은 `appId`를 키로 하는 격리된 리소스 스택(WebSocket 연결, API 클라이언트, 토큰 캐시, 미디어 저장소 루트)을 소유합니다. 계정은 인바운드/아웃바운드 상태를 절대 공유하지 않습니다.
- 다중 계정 로거는 소유 계정으로 로그 줄에 태그를 지정하므로, 하나의 Gateway에서 여러 봇을 실행할 때도 진단을 분리할 수 있습니다.
- 인바운드, 아웃바운드, Gateway 브리지 경로는 `~/.openclaw/media` 아래의 단일 미디어 페이로드 루트를 공유하므로, 업로드, 다운로드, 트랜스코딩 캐시는 서브시스템별 트리가 아니라 하나의 보호된 디렉터리 아래에 저장됩니다.
- 리치 미디어 전달은 C2C와 그룹 대상에 대해 하나의 `sendMedia` 경로를 거칩니다. 대용량 파일 임계값을 초과하는 로컬 파일과 버퍼는 QQ의 청크 업로드 엔드포인트를 사용하고, 더 작은 페이로드는 원샷 미디어 API를 사용합니다.
- 자격 증명은 표준 OpenClaw 자격 증명 스냅샷의 일부로 백업 및 복원할 수 있습니다. 엔진은 복원 시 새 QR 코드 페어 없이 각 계정의 리소스 스택을 다시 연결합니다.

## QR 코드 온보딩

`AppID:AppSecret`을 수동으로 붙여 넣는 대신, 엔진은 QQ Bot을 OpenClaw에 연결하기 위한 QR 코드 온보딩 흐름을 지원합니다.

1. QQ Bot 설정 경로(예: `openclaw channels add --channel qqbot`)를 실행하고 프롬프트가 표시되면 QR 코드 흐름을 선택합니다.
2. 대상 QQ Bot에 연결된 휴대폰 앱으로 생성된 QR 코드를 스캔합니다.
3. 휴대폰에서 페어링을 승인합니다. OpenClaw는 반환된 자격 증명을 올바른 계정 범위 아래의 `credentials/`에 유지합니다.

봇 자체가 생성한 승인 프롬프트(예: QQ Bot API가 노출하는 "이 작업을 허용하시겠습니까?" 흐름)는 원시 QQ 클라이언트로 답장하는 대신 `/bot-approve`로 수락할 수 있는 네이티브 OpenClaw 프롬프트로 표시됩니다.

## 문제 해결

- **Bot이 "gone to Mars"라고 응답함:** 자격 증명이 구성되지 않았거나 Gateway가 시작되지 않았습니다.
- **인바운드 메시지 없음:** `appId`와 `clientSecret`이 올바른지, 그리고
  bot이 QQ Open Platform에서 활성화되어 있는지 확인하세요.
- **반복되는 자기 응답:** OpenClaw는 QQ 아웃바운드 참조 인덱스를
  bot이 작성한 것으로 기록하고, 현재 `msgIdx`가 동일한 bot 계정과 일치하는 인바운드 이벤트를 무시합니다.
  이렇게 하면 사용자가 이전 bot 메시지를 인용하거나 답장할 수는 있으면서도 플랫폼 에코 루프를 방지할 수 있습니다.
- **`--token-file`로 설정해도 여전히 미구성으로 표시됨:** `--token-file`은 AppSecret만 설정합니다.
  구성의 `appId` 또는 `QQBOT_APP_ID`도 여전히 필요합니다.
- **사전 메시지가 도착하지 않음:** 사용자가 최근에 상호작용하지 않았다면 QQ가 bot 시작 메시지를 가로챌 수 있습니다.
- **음성이 전사되지 않음:** STT가 구성되어 있고 제공자에 연결할 수 있는지 확인하세요.

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 문제 해결](/ko/channels/troubleshooting)
