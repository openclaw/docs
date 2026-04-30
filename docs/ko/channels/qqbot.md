---
read_when:
    - OpenClaw를 QQ에 연결하려고 합니다
    - QQ Bot 자격 증명 설정이 필요합니다
    - QQ Bot 그룹 또는 개인 채팅 지원이 필요한 경우
summary: QQ 봇 설정, 구성 및 사용법
title: QQ 봇
x-i18n:
    generated_at: "2026-04-30T09:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot은 공식 QQ Bot API(WebSocket gateway)를 통해 OpenClaw에 연결됩니다. 이
plugin은 리치 미디어(이미지, 음성, 동영상, 파일)를 포함한 C2C 비공개 채팅, 그룹 @messages,
guild 채널 메시지를 지원합니다.

상태: 번들 Plugin. 다이렉트 메시지, 그룹 채팅, guild 채널, 미디어가
지원됩니다. 반응과 스레드는 지원되지 않습니다.

## 번들 Plugin

현재 OpenClaw 릴리스에는 QQ Bot이 번들로 포함되어 있으므로, 일반 패키지 빌드는
별도의 `openclaw plugins install` 단계가 필요하지 않습니다.

## 설정

1. [QQ Open Platform](https://q.qq.com/)으로 이동하고 휴대폰 QQ로 QR 코드를
   스캔하여 등록하거나 로그인합니다.
2. **Create Bot**을 클릭하여 새 QQ bot을 만듭니다.
3. bot 설정 페이지에서 **AppID**와 **AppSecret**을 찾아 복사합니다.

> AppSecret은 평문으로 저장되지 않습니다. 저장하지 않고 페이지를 나가면
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

참고:

- 환경 변수 대체는 기본 QQ Bot 계정에만 적용됩니다.
- `openclaw channels add --channel qqbot --token-file ...`은
  AppSecret만 제공합니다. AppID는 config 또는 `QQBOT_APP_ID`에 이미 설정되어 있어야 합니다.
- `clientSecret`은 평문 문자열뿐 아니라 SecretRef 입력도 허용합니다.

### 다중 계정 설정

단일 OpenClaw 인스턴스에서 여러 QQ bot을 실행합니다.

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

각 계정은 자체 WebSocket 연결을 시작하고 독립적인 토큰 캐시를
유지합니다(`appId`로 격리됨).

CLI로 두 번째 bot 추가:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 그룹 채팅

QQ Bot 그룹 채팅 지원은 표시 이름이 아니라 QQ 그룹 OpenID를 사용합니다. bot을
그룹에 추가한 다음 멘션하거나, 멘션 없이 실행되도록 그룹을 구성합니다.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
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

- `requireMention`: bot이 답장하기 전에 @mention을 요구합니다. 기본값: `true`.
- `ignoreOtherMentions`: bot이 아닌 다른 사람을 멘션한 메시지는 버립니다.
- `historyLimit`: 다음 멘션된 턴의 컨텍스트로 최근 비멘션 그룹 메시지를 유지합니다. 비활성화하려면 `0`으로 설정합니다.
- `toolPolicy`: 그룹 범위 도구에 대해 `full`, `restricted`, 또는 `none`.
- `name`: 로그와 그룹 컨텍스트에서 사용되는 친숙한 레이블입니다.
- `prompt`: 에이전트 컨텍스트에 추가되는 그룹별 동작 프롬프트입니다.

활성화 모드는 `mention`과 `always`입니다. `requireMention: true`는
`mention`에 매핑되고, `requireMention: false`는 `always`에 매핑됩니다. 세션 수준 활성화
재정의가 있으면 config보다 우선합니다.

인바운드 큐는 피어별입니다. 그룹 피어는 더 큰 큐 한도를 가지며, 가득 찼을 때
bot이 작성한 잡담보다 사람 메시지를 우선 유지하고, 일반
그룹 메시지의 버스트를 하나의 귀속된 턴으로 병합합니다. 슬래시 명령은 여전히 하나씩 실행됩니다.

### 음성(STT / TTS)

STT와 TTS는 우선순위 대체가 있는 2단계 구성을 지원합니다.

| 설정 | Plugin별                                                | 프레임워크 대체               |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
        qq-main: {
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

둘 중 하나에 `enabled: false`를 설정하면 비활성화됩니다.
계정 수준 TTS 재정의는 `messages.tts`와 동일한 형태를 사용하며 채널/전역 TTS config 위에
깊은 병합됩니다.

인바운드 QQ 음성 첨부 파일은 원시 음성 파일을 일반 `MediaPaths` 밖에 유지하면서
에이전트에 오디오 미디어 메타데이터로 노출됩니다. TTS가
구성된 경우 `[[audio_as_voice]]` 평문 답장은 TTS를 합성하고 네이티브 QQ 음성 메시지를 보냅니다.

아웃바운드 오디오 업로드/트랜스코드 동작은
`channels.qqbot.audioFormatPolicy`로도 조정할 수 있습니다.

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 대상 형식

| 형식                       | 설명               |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 비공개 채팅(C2C)  |
| `qqbot:group:GROUP_OPENID` | 그룹 채팅          |
| `qqbot:channel:CHANNEL_ID` | Guild 채널         |

> 각 bot에는 자체 사용자 OpenID 집합이 있습니다. Bot A가 받은 OpenID는 **Bot B를 통해**
> 메시지를 보내는 데 사용할 수 없습니다.

## 슬래시 명령

AI 큐 전에 가로채는 내장 명령:

| 명령           | 설명                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 지연 시간 테스트                                                                                         |
| `/bot-version` | OpenClaw 프레임워크 버전 표시                                                                            |
| `/bot-help`    | 모든 명령 나열                                                                                           |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` 설정을 위한 발신자의 QQ 사용자 ID(openid) 표시                              |
| `/bot-upgrade` | QQBot 업그레이드 가이드 링크 표시                                                                        |
| `/bot-logs`    | 최근 gateway 로그를 파일로 내보내기                                                                      |
| `/bot-approve` | 네이티브 흐름을 통해 대기 중인 QQ Bot 작업 승인(예: C2C 또는 그룹 업로드 확인).                         |

사용 도움말을 보려면 명령 뒤에 `?`를 붙입니다(예: `/bot-upgrade ?`).

관리자 명령(`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`)은 다이렉트 메시지에서만 사용할 수 있으며, 발신자의 openid가 명시적인 비와일드카드 `allowFrom` 목록에 있어야 합니다. 와일드카드 `allowFrom: ["*"]`는 채팅을 허용하지만 관리자 명령 접근 권한은 부여하지 않습니다. 그룹 메시지는 먼저 `groupAllowFrom`과 대조되고, 이후 `allowFrom`으로 대체됩니다. 그룹에서 관리자 명령을 실행하면 조용히 버리는 대신 힌트를 반환합니다.

## 엔진 아키텍처

QQ Bot은 Plugin 내부에 자체 완결형 엔진으로 제공됩니다.

- 각 계정은 `appId`로 키가 지정된 격리된 리소스 스택(WebSocket 연결, API 클라이언트, 토큰 캐시, 미디어 저장소 루트)을 소유합니다. 계정은 인바운드/아웃바운드 상태를 절대 공유하지 않습니다.
- 다중 계정 로거는 소유 계정으로 로그 라인에 태그를 지정하므로 하나의 gateway에서 여러 bot을 실행할 때 진단을 분리된 상태로 유지할 수 있습니다.
- 인바운드, 아웃바운드, gateway 브리지 경로는 `~/.openclaw/media` 아래의 단일 미디어 페이로드 루트를 공유하므로 업로드, 다운로드, 트랜스코드 캐시가 하위 시스템별 트리 대신 하나의 보호된 디렉터리 아래에 저장됩니다.
- 리치 미디어 전송은 C2C 및 그룹 대상에 대해 하나의 `sendMedia` 경로를 거칩니다. 대용량 파일 임계값을 초과하는 로컬 파일과 버퍼는 QQ의 청크 업로드 엔드포인트를 사용하고, 더 작은 페이로드는 단일 요청 미디어 API를 사용합니다.
- 자격 증명은 표준 OpenClaw 자격 증명 스냅샷의 일부로 백업 및 복원할 수 있습니다. 엔진은 새 QR 코드 페어 없이도 복원 시 각 계정의 리소스 스택을 다시 연결합니다.

## QR 코드 온보딩

`AppID:AppSecret`을 수동으로 붙여넣는 대신, 엔진은 QQ Bot을 OpenClaw에 연결하기 위한 QR 코드 온보딩 흐름을 지원합니다.

1. QQ Bot 설정 경로(예: `openclaw channels add --channel qqbot`)를 실행하고 프롬프트가 표시되면 QR 코드 흐름을 선택합니다.
2. 대상 QQ Bot에 연결된 휴대폰 앱으로 생성된 QR 코드를 스캔합니다.
3. 휴대폰에서 페어링을 승인합니다. OpenClaw는 반환된 자격 증명을 올바른 계정 범위 아래의 `credentials/`에 저장합니다.

bot 자체가 생성한 승인 프롬프트(예: QQ Bot API가 노출하는 "이 작업을 허용하시겠습니까?" 흐름)는 원시 QQ 클라이언트를 통해 답장하는 대신 `/bot-approve`로 수락할 수 있는 네이티브 OpenClaw 프롬프트로 표시됩니다.

## 문제 해결

- **Bot이 "gone to Mars"라고 답장함:** 자격 증명이 구성되지 않았거나 Gateway가 시작되지 않았습니다.
- **인바운드 메시지 없음:** `appId`와 `clientSecret`이 올바른지, 그리고
  bot이 QQ Open Platform에서 활성화되어 있는지 확인합니다.
- **반복되는 자기 답장:** OpenClaw는 QQ 아웃바운드 ref 인덱스를
  bot 작성 메시지로 기록하고, 현재 `msgIdx`가 동일한
  bot 계정과 일치하는 인바운드 이벤트를 무시합니다. 이렇게 하면 플랫폼 에코 루프를 방지하면서도 사용자가
  이전 bot 메시지를 인용하거나 답장할 수 있습니다.
- **`--token-file`로 설정했는데도 미구성으로 표시됨:** `--token-file`은
  AppSecret만 설정합니다. 여전히 config 또는 `QQBOT_APP_ID`에 `appId`가 필요합니다.
- **사전 메시지가 도착하지 않음:** 사용자가 최근 상호작용하지 않았다면 QQ가 bot이 시작한 메시지를 가로챌 수 있습니다.
- **음성이 전사되지 않음:** STT가 구성되어 있고 provider에 연결할 수 있는지 확인합니다.

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 문제 해결](/ko/channels/troubleshooting)
