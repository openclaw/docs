---
read_when:
    - OpenClaw를 QQ에 연결하려고 합니다
    - QQ Bot 자격 증명 설정이 필요합니다
    - QQ Bot의 그룹 또는 개인 채팅 지원이 필요합니다
summary: QQ 봇 설정, 구성 및 사용법
title: QQ 봇
x-i18n:
    generated_at: "2026-04-30T06:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot은 공식 QQ Bot API(웹소켓 Gateway)를 통해 OpenClaw에 연결됩니다. 이
Plugin은 C2C 비공개 채팅, 그룹 @메시지, 길드 채널 메시지를 리치 미디어(이미지, 음성, 동영상, 파일)와 함께 지원합니다.

상태: 번들 Plugin. 다이렉트 메시지, 그룹 채팅, 길드 채널, 미디어가
지원됩니다. 반응과 스레드는 지원되지 않습니다.

## 번들 Plugin

현재 OpenClaw 릴리스에는 QQ Bot이 번들로 포함되어 있으므로, 일반 패키지 빌드에서는
별도의 `openclaw plugins install` 단계가 필요하지 않습니다.

## 설정

1. [QQ Open Platform](https://q.qq.com/)으로 이동하여 휴대폰 QQ로 QR 코드를 스캔해
   등록하거나 로그인합니다.
2. **Create Bot**을 클릭하여 새 QQ bot을 만듭니다.
3. bot 설정 페이지에서 **AppID**와 **AppSecret**을 찾아 복사합니다.

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

참고:

- 환경 변수 폴백은 기본 QQ Bot 계정에만 적용됩니다.
- `openclaw channels add --channel qqbot --token-file ...`은
  AppSecret만 제공합니다. AppID는 구성 또는 `QQBOT_APP_ID`에 이미 설정되어 있어야 합니다.
- `clientSecret`은 일반 텍스트 문자열뿐 아니라 SecretRef 입력도 허용합니다.

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

각 계정은 자체 웹소켓 연결을 시작하고 독립적인 토큰 캐시를 유지합니다
(`appId`로 격리됨).

CLI로 두 번째 bot을 추가합니다.

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 그룹 채팅

QQ Bot 그룹 채팅 지원은 표시 이름이 아니라 QQ 그룹 OpenID를 사용합니다. bot을
그룹에 추가한 다음, bot을 멘션하거나 멘션 없이 실행되도록 그룹을 구성합니다.

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

- `requireMention`: bot이 응답하기 전에 @멘션을 요구합니다. 기본값: `true`.
- `ignoreOtherMentions`: bot이 아닌 다른 사람을 멘션한 메시지를 삭제합니다.
- `historyLimit`: 다음 멘션된 턴의 컨텍스트로 최근 비멘션 그룹 메시지를 유지합니다. 비활성화하려면 `0`으로 설정합니다.
- `toolPolicy`: 그룹 범위 도구에 대한 `full`, `restricted` 또는 `none`.
- `name`: 로그와 그룹 컨텍스트에서 사용하는 친숙한 레이블.
- `prompt`: 에이전트 컨텍스트에 추가되는 그룹별 동작 프롬프트.

활성화 모드는 `mention`과 `always`입니다. `requireMention: true`는
`mention`에 매핑되고, `requireMention: false`는 `always`에 매핑됩니다. 세션 수준 활성화
재정의가 있으면 구성을 우선합니다.

인바운드 큐는 피어별로 나뉩니다. 그룹 피어는 더 큰 큐 한도를 가지며, 큐가 가득 찼을 때
bot이 작성한 잡담보다 사람 메시지를 앞에 유지하고, 일반 그룹 메시지의 버스트를
하나의 귀속된 턴으로 병합합니다. 슬래시 명령은 계속 하나씩 실행됩니다.

### 음성(STT / TTS)

STT 및 TTS는 우선순위 폴백이 있는 2단계 구성을 지원합니다.

| 설정 | Plugin별                                                  | 프레임워크 폴백                |
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

둘 중 하나를 비활성화하려면 `enabled: false`를 설정합니다.
계정 수준 TTS 재정의는 `messages.tts`와 동일한 형태를 사용하며 채널/전역 TTS 구성 위에
딥 머지됩니다.

인바운드 QQ 음성 첨부 파일은 원시 음성 파일을 일반 `MediaPaths` 밖에 유지하면서
에이전트에 오디오 미디어 메타데이터로 노출됩니다. `[[audio_as_voice]]` 일반
텍스트 응답은 TTS를 합성하고 TTS가 구성되어 있으면 네이티브 QQ 음성 메시지를
전송합니다.

아웃바운드 오디오 업로드/트랜스코드 동작도
`channels.qqbot.audioFormatPolicy`로 조정할 수 있습니다.

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 대상 형식

| 형식                       | 설명               |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 비공개 채팅(C2C)   |
| `qqbot:group:GROUP_OPENID` | 그룹 채팅          |
| `qqbot:channel:CHANNEL_ID` | 길드 채널          |

> 각 bot에는 자체 사용자 OpenID 집합이 있습니다. Bot A가 받은 OpenID는 **Bot B를 통해**
> 메시지를 보내는 데 사용할 수 없습니다.

## 슬래시 명령

AI 큐 전에 가로채는 기본 제공 명령:

| 명령           | 설명                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 지연 시간 테스트                                                                                         |
| `/bot-version` | OpenClaw 프레임워크 버전 표시                                                                            |
| `/bot-help`    | 모든 명령 나열                                                                                           |
| `/bot-upgrade` | QQBot 업그레이드 가이드 링크 표시                                                                        |
| `/bot-logs`    | 최근 Gateway 로그를 파일로 내보내기                                                                      |
| `/bot-approve` | 네이티브 흐름을 통해 보류 중인 QQ Bot 작업 승인(예: C2C 또는 그룹 업로드 확인).                         |

사용법 도움말을 보려면 아무 명령에나 `?`를 추가합니다(예: `/bot-upgrade ?`).

## 엔진 아키텍처

QQ Bot은 Plugin 내부의 독립형 엔진으로 제공됩니다.

- 각 계정은 `appId`를 키로 하는 격리된 리소스 스택(웹소켓 연결, API 클라이언트, 토큰 캐시, 미디어 저장소 루트)을 소유합니다. 계정은 인바운드/아웃바운드 상태를 절대 공유하지 않습니다.
- 다중 계정 로거는 소유 계정으로 로그 줄에 태그를 지정하므로, 하나의 Gateway 아래에서 여러 bot을 실행할 때도 진단을 분리된 상태로 유지할 수 있습니다.
- 인바운드, 아웃바운드, Gateway 브리지 경로는 `~/.openclaw/media` 아래의 단일 미디어 페이로드 루트를 공유하므로, 업로드, 다운로드, 트랜스코드 캐시가 서브시스템별 트리가 아니라 하나의 보호된 디렉터리 아래에 저장됩니다.
- 리치 미디어 전달은 C2C 및 그룹 대상에 대해 하나의 `sendMedia` 경로를 거칩니다. 대용량 파일 임계값을 넘는 로컬 파일과 버퍼는 QQ의 청크 업로드 엔드포인트를 사용하고, 더 작은 페이로드는 원샷 미디어 API를 사용합니다.
- 자격 증명은 표준 OpenClaw 자격 증명 스냅샷의 일부로 백업 및 복원할 수 있습니다. 엔진은 새 QR 코드 페어링 없이 복원 시 각 계정의 리소스 스택을 다시 연결합니다.

## QR 코드 온보딩

`AppID:AppSecret`을 수동으로 붙여넣는 대신, 엔진은 QQ Bot을 OpenClaw에 연결하기 위한 QR 코드 온보딩 흐름을 지원합니다.

1. QQ Bot 설정 경로(예: `openclaw channels add --channel qqbot`)를 실행하고 프롬프트가 표시되면 QR 코드 흐름을 선택합니다.
2. 대상 QQ Bot에 연결된 휴대폰 앱으로 생성된 QR 코드를 스캔합니다.
3. 휴대폰에서 페어링을 승인합니다. OpenClaw는 반환된 자격 증명을 올바른 계정 범위 아래의 `credentials/`에 저장합니다.

bot 자체에서 생성한 승인 프롬프트(예: QQ Bot API가 노출하는 "allow this action?" 흐름)는 원시 QQ 클라이언트로 답장하는 대신 `/bot-approve`로 수락할 수 있는 네이티브 OpenClaw 프롬프트로 표시됩니다.

## 문제 해결

- **Bot이 "gone to Mars"라고 응답함:** 자격 증명이 구성되지 않았거나 Gateway가 시작되지 않았습니다.
- **인바운드 메시지가 없음:** `appId`와 `clientSecret`이 올바른지, 그리고
  QQ Open Platform에서 bot이 활성화되어 있는지 확인합니다.
- **반복되는 자체 응답:** OpenClaw는 QQ 아웃바운드 ref 인덱스를
  bot이 작성한 것으로 기록하고, 현재 `msgIdx`가 동일한 bot 계정과 일치하는 인바운드 이벤트를 무시합니다. 이렇게 하면 사용자가 이전 bot 메시지를 인용하거나 답장할 수 있게 유지하면서도 플랫폼 에코 루프를 방지합니다.
- **`--token-file`로 설정했는데도 여전히 구성되지 않음으로 표시됨:** `--token-file`은
  AppSecret만 설정합니다. 구성 또는 `QQBOT_APP_ID`에 `appId`가 여전히 필요합니다.
- **사전 메시지가 도착하지 않음:** 사용자가 최근 상호작용하지 않은 경우 QQ가 bot이 시작한 메시지를 가로챌 수 있습니다.
- **음성이 전사되지 않음:** STT가 구성되어 있고 공급자에 연결할 수 있는지 확인합니다.

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 문제 해결](/ko/channels/troubleshooting)
