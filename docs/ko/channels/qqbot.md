---
read_when:
    - OpenClaw를 QQ에 연결하려고 합니다
    - QQ Bot 자격 증명을 설정해야 합니다
    - QQ Bot 그룹 또는 비공개 채팅 지원을 원합니다
summary: QQ Bot 설정, 구성 및 사용법
title: QQ 봇
x-i18n:
    generated_at: "2026-07-16T12:18:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot은 공식 QQ Bot API(WebSocket Gateway)를 통해 OpenClaw에 연결됩니다.
C2C 비공개 채팅과 그룹 `@`-멘션이 주요 채팅 유형이며, 리치
미디어(이미지, 음성, 동영상, 파일)를 지원합니다. 길드 채널 메시지는
텍스트와 원격 URL 이미지만 지원하며, 길드 채널에서는 음성, 동영상, 파일 업로드 및 로컬/Base64
이미지를 사용할 수 없습니다. 반응과 스레드는 어디에서도
지원되지 않습니다.

상태: 공식 다운로드 가능 Plugin.

## 설치

```bash
openclaw plugins install @openclaw/qqbot
```

## 설정

1. [QQ Open Platform](https://q.qq.com/)으로 이동한 후 휴대전화의 QQ로 QR 코드를 스캔하여
   등록하거나 로그인하십시오.
2. 새 QQ 봇을 만들려면 **Create Bot**을 클릭하십시오.
3. 봇의 설정 페이지에서 **AppID**와 **AppSecret**을 찾아 복사하십시오.

<Note>
AppSecret은 평문으로 저장되지 않습니다. 저장하지 않고 페이지를 나가면 새 AppSecret을 다시 생성해야 합니다.
</Note>

4. 채널을 추가하십시오.

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway를 다시 시작하십시오.

대화형 설정:

```bash
openclaw channels add
```

마법사는 AppID/AppSecret을 수동으로 입력하는 대신 QR 코드로 바인딩하는 방법도 제공합니다.
대상 QQ Bot에 연결된 휴대전화 앱으로 코드를 스캔하여
바인딩을 완료하십시오. OpenClaw는 반환된 자격 증명을 계정의 구성
범위에 영구 저장합니다.

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

- `openclaw channels add --channel qqbot --token-file ...`은 AppSecret만 설정합니다.
  `appId`는 구성 또는 `QQBOT_APP_ID`에 이미 설정되어 있어야 합니다.
- `clientSecret`은 평문 문자열, 파일 경로(`clientSecretFile`) 또는
  구조화된 SecretRef 객체를 허용합니다.
- 레거시 `secretref:...` / `secretref-env:...` 마커 문자열은
  `clientSecret`에서 거부됩니다. 대신 구조화된 SecretRef 객체를 사용하십시오.

### 스트리밍

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // 블록 스트리밍: "partial"(기본값) 또는 "off"
        nativeTransport: true, // DM에 QQ의 공식 C2C stream_messages API 사용
      },
    },
  },
}
```

- `streaming.mode: "off"`은 계정의 블록 스트리밍을 비활성화합니다.
- `streaming.nativeTransport: true`은 QQ의 공식
  `stream_messages` API를 통해 C2C(DM) 응답을 스트리밍합니다. 그룹/채널 대상에는 영향을 주지 않습니다.
- 레거시 `streaming: true|false` 스칼라와 `streaming.c2cStreamApi` 키는
  `openclaw doctor --fix`을 통해 이 형태로 마이그레이션됩니다.
- `/bot-streaming on|off`은 DM에서 동일한 구성을 전환합니다.

### 접근 정책

- `allowFrom` / `groupAllowFrom`은 C2C /
  그룹 컨텍스트에서 봇과 채팅할 수 있는 사용자를 제한합니다. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)은
  적용 모드를 제어합니다. `dmPolicy`는
  `allowFrom`에 구체적인(와일드카드가 아닌) 항목이 있으면 `allowlist`이 기본값이고, 그렇지 않으면 `open`이 기본값입니다.
  `groupPolicy`는 `groupAllowFrom` 또는
  `allowFrom` 중 하나에 구체적인 항목이 있으면 `allowlist`이 기본값이고, 그렇지 않으면 `open`이 기본값입니다.
- "인증: 허용 목록" 슬래시 명령은 `dmPolicy` /
  `groupPolicy`과 관계없이 `allowFrom`(또는 그룹에서 호출할 경우 `groupAllowFrom`)에 명시적인 비와일드카드 항목이 있어야 합니다. [슬래시 명령](#slash-commands)을 참조하십시오.

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

각 계정은 `appId`을 키로 사용하여 격리된 WebSocket 연결, API 클라이언트 및 토큰
캐시를 소유합니다. 하나의 Gateway에서 여러 봇을 실행할 때도 진단을 구분할 수 있도록
로그 줄에 소유 계정 ID가 태그됩니다.

CLI를 통해 두 번째 봇을 추가합니다.

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 그룹 채팅

그룹 지원에는 표시 이름이 아닌 QQ 그룹 OpenID를 사용합니다. 봇을
그룹에 추가한 후 멘션하거나, 멘션 없이 실행하도록 그룹을 구성하십시오.

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

`groups["*"]`은 모든 그룹의 기본값을 설정하며, 구체적인 `groups.GROUP_OPENID`
항목은 한 그룹에 대해 해당 기본값을 재정의합니다. 그룹 설정:

| 필드                 | 기본값          | 설명                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | 봇이 응답하기 전에 `@`-멘션을 요구합니다.                                                     |
| `commandLevel`        | `all`            | 그룹에서 실행할 수 있는 내장 슬래시 명령을 지정합니다(아래 참조).                                    |
| `ignoreOtherMentions` | `false`          | 봇이 아닌 다른 사람만 멘션한 메시지를 삭제합니다.                                           |
| `historyLimit`        | `50`             | 다음 멘션 턴의 컨텍스트로 유지할 최근 비멘션 메시지 수입니다. `0`은 기록을 비활성화합니다.     |
| `tools`               | —                | 전체 그룹에 대해 도구를 허용하거나 거부합니다.                                                              |
| `toolsBySender`       | —                | 발신자별 도구 재정의입니다. [그룹](/ko/channels/groups#groupchannel-tool-restrictions-optional)을 참조하십시오. |
| `name`                | openid 접두사    | 로그와 그룹 컨텍스트에 사용하는 읽기 쉬운 레이블입니다.                                                     |
| `prompt`              | 내장 기본값 | 에이전트 컨텍스트에 추가되는 그룹별 동작 프롬프트입니다.                                           |

`commandLevel`에서 허용되는 값:

| 수준    | 동작                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 기존 내장 명령을 계속 사용할 수 있습니다. 일부는 메뉴에서 숨겨진 상태로 유지되지만, 승인된 사용자는 그룹에서 계속 실행할 수 있습니다.                  |
| `safety` | `/help`, `/btw`, `/stop`은 그룹에 계속 표시되며, 민감한 명령(`/config`, `/tools`, `/bash` 등)은 비공개 채팅에서 실행해야 합니다.      |
| `strict` | 엄격한 운영에 필요한 그룹 세션 제어만 허용됩니다. 승인된 발신자가 활성 실행을 중단할 수 있도록 `/stop`은 계속 작동합니다. |

이전 QQBot `toolPolicy` 항목은 폐기되었습니다. `openclaw doctor --fix`을 실행하여 `tools`로 마이그레이션하십시오.

활성화 모드는 `mention` 및 `always`입니다. `requireMention: true`은
`mention`에 매핑되고, `requireMention: false`은 `always`에 매핑됩니다. 세션 수준 활성화
재정의가 있으면 구성을 우선합니다.

인바운드 대기열은 피어별로 구분됩니다. 그룹 피어는 직접 피어보다 대기열 한도가 더 크며(50 대 20),
가득 차면 사람이 작성한 메시지보다 봇이 작성한 메시지를 먼저 제거하고,
일반 그룹 메시지의 버스트를 출처가 표시된 하나의 턴으로 병합합니다. 슬래시
명령은 병합 배치와 독립적으로 하나씩 실행됩니다.

### 음성(STT / TTS)

STT와 TTS는 우선순위 폴백이 적용되는 2단계 구성을 지원합니다.

| 설정 | Plugin별                                          | 프레임워크 폴백            |
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

비활성화하려면 둘 중 하나에 `enabled: false`을 설정하십시오. 계정 수준 TTS 재정의는
`messages.tts`과 동일한 형태를 사용하며 채널/전역 TTS 구성 위에 심층 병합됩니다.

STT 요청은 기본적으로 60초 후 시간 초과됩니다. Plugin별 STT는
선택된 `models.providers.<id>.timeoutSeconds` 재정의를 사용합니다. 프레임워크 오디오 STT는
`tools.media.audio.models[0].timeoutSeconds`, 그다음
`tools.media.audio.timeoutSeconds`, 그다음 선택된 제공자 재정의를 사용합니다.

인바운드 QQ 음성 첨부 파일은 원시 음성 파일을 일반 `MediaPaths`에 포함하지 않으면서
에이전트에 오디오 미디어 메타데이터로 노출됩니다. 일반 텍스트 응답의 `[[audio_as_voice]]`은
TTS가 구성된 경우 TTS를 합성하여 네이티브 QQ 음성 메시지를 전송합니다.

아웃바운드 오디오 업로드/트랜스코딩 동작은
`channels.qqbot.audioFormatPolicy`로 조정할 수도 있습니다.

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 대상 형식

| 형식                     | 설명        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 비공개 채팅(C2C) |
| `qqbot:group:GROUP_OPENID` | 그룹 채팅         |
| `qqbot:channel:CHANNEL_ID` | 길드 채널      |

<Note>
각 봇에는 고유한 사용자 OpenID 집합이 있습니다. Bot A가 받은 OpenID는 Bot B를 통해 메시지를 보내는 데 **사용할 수 없습니다**.
</Note>

## 슬래시 명령

AI 대기열 전에 가로채는 내장 명령:

| 명령어              | 인증      | 범위        | 설명                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | 모두          | 지연 시간 테스트                                                                   |
| `/bot-help`          | —         | 모두          | 모든 명령어 나열                                                              |
| `/bot-me`            | —         | 비공개 채팅만 | `allowFrom` / `groupAllowFrom` 설정을 위한 발신자의 QQ 사용자 ID(openid) 표시 |
| `/bot-version`       | —         | 비공개 채팅만 | OpenClaw 프레임워크 버전 및 Plugin 버전 표시                         |
| `/bot-upgrade`       | —         | 비공개 채팅만 | QQBot 업그레이드 가이드 링크 표시                                              |
| `/bot-approve`       | 허용 목록 | 비공개 채팅만 | 명령 실행 승인 구성 관리(켜기 / 끄기 / 항상 / 재설정 / 상태)  |
| `/bot-logs`          | 허용 목록 | 비공개 채팅만 | 최근 Gateway 로그를 파일로 내보내기                                           |
| `/bot-clear-storage` | 허용 목록 | 비공개 채팅만 | QQBot 미디어 디렉터리 아래의 캐시된 다운로드 삭제                        |
| `/bot-streaming`     | 허용 목록 | 비공개 채팅만 | C2C 스트리밍 응답 전환                                                   |
| `/bot-group-allways` | 허용 목록 | 비공개 채팅만 | 기본 그룹 활성화 모드 전환(멘션 필수 또는 항상 활성화)      |

사용법 도움말을 보려면 명령어에 `?`을 추가하십시오(예: `/bot-upgrade ?`).

"인증: 허용 목록" 명령어는 추가로 발신자의 openid가 명시적인 비와일드카드
`allowFrom` 목록에 있어야 합니다(그룹에서 실행된 명령어에는 `groupAllowFrom`이 우선하며,
없으면 `allowFrom`으로 대체됩니다). 와일드카드
`allowFrom: ["*"]`은 채팅을 허용하지만 이러한 명령어는 허용하지 않습니다. 이러한 명령어 중 하나를
비공개 채팅 외부에서 실행하거나 권한 없이 실행하면 메시지를
조용히 삭제하는 대신 안내를 반환합니다.

`/bot-me`, `/bot-version`, `/bot-upgrade`은 비공개 채팅에서만 사용할 수 있지만
허용 목록은 필요하지 않습니다. 모든 C2C 발신자가 실행할 수 있습니다.

QQ Bot 실행 승인이 기본 동일 채팅 대체 방식을 사용하는 경우 기본 승인
버튼 클릭에는 동일한 명시적 비와일드카드 명령어 허용 목록이 적용됩니다.
더 광범위한 명령어 접근 권한 없이 승인 전용 접근 권한을 부여하려면
`channels.qqbot.execApprovals.approvers`을 구성하십시오. 기본 실행 승인은
기본적으로 활성화되어 있습니다.

## 미디어 및 저장소

- 인바운드, 아웃바운드 및 Gateway 브리지 미디어는
  `~/.openclaw/media/qqbot` 아래의 단일 페이로드 루트를 공유하므로(`OPENCLAW_HOME`이 설정된 경우 이를 따름), 업로드,
  다운로드 및 트랜스코딩 캐시가 하나의 보호된 디렉터리 아래에 유지됩니다.
- C2C 및 그룹 대상에 대한 리치 미디어 전송은 단일 `sendMedia`
  경로를 거칩니다. 5&nbsp;MiB 이상의 로컬 파일과 메모리 내 버퍼는 QQ의
  청크 업로드 엔드포인트를 사용하며, 더 작은 페이로드와 원격 URL/Base64 소스는
  일회성 업로드 API를 사용합니다.
- Gateway가 `openclaw.json` 쓰기를 완료하기 전에 핫 업그레이드로 중단된 경우,
  Plugin은 다음 시작 시 내부 스냅샷에서 해당 계정의 마지막으로 확인된 `appId` / `clientSecret`을
  복원하므로(의도적인 구성 변경은 절대 덮어쓰지 않음) QR 코드를
  다시 스캔할 필요가 없습니다.

## 문제 해결

- **Gateway가 시작되지 않음 / 인바운드 메시지가 없음:** `appId` 및
  `clientSecret`이 올바른지, QQ Open Platform에서 봇이 활성화되어 있는지 확인하십시오.
  자격 증명이 없으면 "QQBot not configured (missing appId or
  clientSecret)"이 표시됩니다.
- **`--token-file`을 사용해 설정해도 구성되지 않은 것으로 표시됨:** `--token-file`은
  AppSecret만 설정합니다. `appId`은 여전히 구성 또는 `QQBOT_APP_ID`에 설정해야 합니다.
- **집중적으로 발생하는 그룹 응답이 충돌함:** 피어의 큐가 가득 차면 인바운드 큐가
  사람이 작성한 메시지보다 봇이 작성한 메시지를 먼저 제거하며,
  일반(비명령어) 그룹 메시지의 집중 발생을 출처가 표시된 하나의 턴으로 병합하므로,
  봇 대화가 쇄도해도 사람의 메시지가 처리되지 못해서는 안 됩니다.
- **능동적 메시지가 도착하지 않음:** 사용자가 최근에 상호작용하지 않은 경우
  QQ가 봇이 시작한 메시지를 차단할 수 있습니다.
- **음성이 전사되지 않음:** STT가 구성되어 있고 제공업체에
  연결할 수 있는지 확인하십시오.

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 문제 해결](/ko/channels/troubleshooting)
