---
read_when:
    - Channel 전송은 연결됨이라고 표시되지만 응답이 실패함
    - 심층 provider 문서로 들어가기 전에 채널별 확인이 필요합니다
summary: 빠른 채널 수준 문제 해결과 채널별 실패 시그니처 및 해결 방법
title: 채널 문제 해결
x-i18n:
    generated_at: "2026-06-27T17:13:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

채널이 연결되었지만 동작이 잘못되었을 때 이 페이지를 사용하세요.

## 명령 사다리

먼저 다음을 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 기준:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` 또는 `admin-capable`
- 채널 프로브가 전송이 연결되었음을 표시하고, 지원되는 경우 `works` 또는 `audit ok`를 표시함

## 업데이트 후

Telegram, iMessage, BlueBubbles 시대의 구성 또는 다른 Plugin 채널이
업데이트 후 사라질 때 사용하세요.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all`에서 `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix`를 찾으세요. 이는 채널이 구성되어 있지만, 채널을 등록하는 대신
Plugin 설정/로드 경로가 손상된 의존성 트리에 도달했다는 뜻입니다.
`openclaw doctor --fix`는 오래된 Plugin 의존성 스테이징 디렉터리와
오래된 인증 섀도를 제거하고, 그런 다음 `openclaw gateway restart`가
깨끗한 상태를 다시 로드합니다.

## WhatsApp

### WhatsApp 실패 특징

| 증상                                | 가장 빠른 확인                                      | 수정                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 연결되었지만 DM 응답 없음           | `openclaw pairing list whatsapp`                    | 발신자를 승인하거나 DM 정책/허용 목록을 전환하세요.                                                                               |
| 그룹 메시지가 무시됨                | 구성에서 `requireMention` + 멘션 패턴 확인          | 봇을 멘션하거나 해당 그룹의 멘션 정책을 완화하세요.                                                                                |
| QR 로그인 시간이 408로 초과됨       | Gateway `HTTPS_PROXY` / `HTTP_PROXY` env 확인       | 연결 가능한 프록시를 설정하세요. 우회에만 `NO_PROXY`를 사용하세요.                                                                 |
| 무작위 연결 해제/재로그인 루프      | `openclaw channels status --probe` + 로그           | 현재 연결되어 있어도 최근 재연결이 표시됩니다. 로그를 지켜보고 Gateway를 재시작한 다음, 계속 불안정하면 다시 연결하세요.        |
| `status=408 Request Time-out` 루프  | 프로브, 로그, doctor, 그다음 Gateway 상태           | 먼저 호스트 연결성/타이밍을 수정하세요. 루프가 지속되면 인증을 백업하고 계정을 다시 연결하세요.                                  |
| 응답이 몇 초/몇 분 늦게 도착함      | `openclaw doctor --fix`                             | Doctor는 Gateway 이벤트 루프를 저하시키는 것으로 확인된 오래된 로컬 TUI 클라이언트를 중지합니다.                                  |

전체 문제 해결: [WhatsApp 문제 해결](/ko/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 실패 특징

| 증상                                      | 가장 빠른 확인                                   | 수정                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start`는 되지만 사용 가능한 응답 흐름 없음 | `openclaw pairing list telegram`                 | 페어링을 승인하거나 DM 정책을 변경하세요.                                                                                   |
| 봇이 온라인이지만 그룹이 계속 조용함       | 멘션 요구 사항과 봇 개인정보 보호 모드 확인      | 그룹 가시성을 위해 개인정보 보호 모드를 비활성화하거나 봇을 멘션하세요.                                                     |
| 네트워크 오류로 전송 실패                 | Telegram API 호출 실패를 로그에서 검사           | `api.telegram.org`로 가는 DNS/IPv6/프록시 라우팅을 수정하세요.                                                              |
| 시작 시 `getMe returned 401` 보고         | 구성된 토큰 소스 확인                            | BotFather 토큰을 다시 복사하거나 재생성하고 `botToken`, `tokenFile` 또는 기본 계정 `TELEGRAM_BOT_TOKEN`을 업데이트하세요. |
| 폴링이 멈추거나 느리게 재연결됨            | 폴링 진단을 위해 `openclaw logs --follow` 사용   | 업그레이드하세요. 재시작이 오탐이면 `pollingStallThresholdMs`를 조정하세요. 지속적인 멈춤은 여전히 프록시/DNS/IPv6를 가리킵니다. |
| 시작 시 `setMyCommands` 거부됨            | `BOT_COMMANDS_TOO_MUCH` 로그 검사                 | Plugin/skill/사용자 지정 Telegram 명령을 줄이거나 네이티브 메뉴를 비활성화하세요.                                           |
| 업그레이드 후 허용 목록이 사용자를 차단함 | `openclaw security audit` 및 구성 허용 목록       | `openclaw doctor --fix`를 실행하거나 `@username`을 숫자 발신자 ID로 교체하세요.                                             |

전체 문제 해결: [Telegram 문제 해결](/ko/channels/telegram#troubleshooting)

## Discord

### Discord 실패 특징

| 증상                                      | 가장 빠른 확인                                                                                                               | 수정                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 봇이 온라인이지만 길드 응답 없음          | `openclaw channels status --probe`                                                                                           | 길드/채널을 허용하고 메시지 콘텐츠 인텐트를 확인하세요.                                                                                                                                                                                                                    |
| 그룹 메시지가 무시됨                      | 멘션 게이팅 드롭 로그 확인                                                                                                   | 봇을 멘션하거나 길드/채널 `requireMention: false`를 설정하세요.                                                                                                                                                                                                            |
| 타이핑/토큰 사용은 있지만 Discord 메시지 없음 | 이것이 주변 방 이벤트인지, 또는 모델이 `message(action=send)`를 놓친 옵트인 `message_tool` 방인지 확인                       | 억제된 최종 페이로드 메타데이터를 Gateway 상세 로그에서 검사하고, `messages.groupChat.unmentionedInbound`를 확인하고, [주변 방 이벤트](/ko/channels/ambient-room-events)를 읽거나, 일반 그룹 요청에는 `messages.groupChat.visibleReplies: "automatic"`을 유지하세요. |
| DM 응답 누락                              | `openclaw pairing list discord`                                                                                              | DM 페어링을 승인하거나 DM 정책을 조정하세요.                                                                                                                                                                                                                                |

전체 문제 해결: [Discord 문제 해결](/ko/channels/discord#troubleshooting)

## Slack

### Slack 실패 특징

| 증상                                  | 가장 빠른 확인                              | 수정                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 소켓 모드가 연결되었지만 응답 없음    | `openclaw channels status --probe`          | 앱 토큰 + 봇 토큰과 필수 범위를 확인하세요. SecretRef 기반 설정에서는 `botTokenStatus` / `appTokenStatus = configured_unavailable`를 주시하세요. |
| DM 차단됨                             | `openclaw pairing list slack`               | 페어링을 승인하거나 DM 정책을 완화하세요.                                                                                                             |
| 채널 메시지가 무시됨                  | `groupPolicy` 및 채널 허용 목록 확인        | 채널을 허용하거나 정책을 `open`으로 전환하세요.                                                                                                      |

전체 문제 해결: [Slack 문제 해결](/ko/channels/slack#troubleshooting)

## iMessage

### iMessage 실패 특징

| 증상                                      | 가장 빠른 확인                                           | 수정                                                                       |
| ----------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| macOS가 아닌 환경에서 `imsg`가 없거나 실패 | `openclaw channels status --probe --channel imessage`    | Messages Mac에서 OpenClaw를 실행하거나 `cliPath`에 SSH 래퍼를 사용하세요. |
| macOS에서 보낼 수는 있지만 받을 수 없음   | Messages 자동화에 대한 macOS 개인정보 보호 권한 확인     | TCC 권한을 다시 부여하고 채널 프로세스를 재시작하세요.                    |
| DM 발신자 차단됨                          | `openclaw pairing list imessage`                         | 페어링을 승인하거나 허용 목록을 업데이트하세요.                            |

전체 문제 해결:

- [iMessage 문제 해결](/ko/channels/imessage#troubleshooting)

## Signal

### Signal 실패 특징

| 증상                              | 가장 빠른 확인                              | 수정                                                      |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| 데몬에 접근 가능하지만 봇이 조용함 | `openclaw channels status --probe`          | `signal-cli` 데몬 URL/계정 및 수신 모드를 확인하세요.     |
| DM 차단됨                         | `openclaw pairing list signal`              | 발신자를 승인하거나 DM 정책을 조정하세요.                 |
| 그룹 응답이 트리거되지 않음       | 그룹 허용 목록 및 멘션 패턴 확인            | 발신자/그룹을 추가하거나 게이팅을 완화하세요.             |

전체 문제 해결: [Signal 문제 해결](/ko/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 실패 특징

| 증상                                  | 가장 빠른 확인                               | 수정                                                             |
| ------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| 봇이 "gone to Mars"라고 응답함         | 구성에서 `appId` 및 `clientSecret` 확인      | 자격 증명을 설정하거나 Gateway를 재시작하세요.                   |
| 인바운드 메시지 없음                  | `openclaw channels status --probe`           | QQ Open Platform에서 자격 증명을 확인하세요.                     |
| 음성이 텍스트로 변환되지 않음         | STT 공급자 구성 확인                         | `channels.qqbot.stt` 또는 `tools.media.audio`를 구성하세요.      |
| 사전 메시지가 도착하지 않음           | QQ 플랫폼 상호작용 요구 사항 확인            | 최근 상호작용이 없으면 QQ가 봇 시작 메시지를 차단할 수 있습니다. |

전체 문제 해결: [QQ Bot 문제 해결](/ko/channels/qqbot#troubleshooting)

## Matrix

### Matrix 실패 징후

| 증상                                | 가장 빠른 확인                         | 수정 방법                                                                 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 로그인했지만 룸 메시지를 무시함     | `openclaw channels status --probe`     | `groupPolicy`, 룸 허용 목록, 멘션 게이팅을 확인합니다.                   |
| DM이 처리되지 않음                  | `openclaw pairing list matrix`         | 발신자를 승인하거나 DM 정책을 조정합니다.                                |
| 암호화된 룸이 실패함                | `openclaw matrix verify status`        | 디바이스를 다시 확인한 다음 `openclaw matrix verify backup status`를 확인합니다. |
| 백업 복원이 대기 중이거나 손상됨    | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore`를 실행하거나 복구 키로 다시 실행합니다. |
| 교차 서명/부트스트랩이 잘못되어 보임 | `openclaw matrix verify bootstrap`     | 비밀 저장소, 교차 서명, 백업 상태를 한 번에 복구합니다.                  |

전체 설정 및 구성: [Matrix](/ko/channels/matrix)

## 관련 항목

- [페어링](/ko/channels/pairing)
- [채널 라우팅](/ko/channels/channel-routing)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
