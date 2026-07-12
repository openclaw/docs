---
read_when:
    - 채널 전송 계층은 연결되었다고 표시되지만 응답에 실패함
    - 심층 제공자 문서보다 먼저 채널별 검사가 필요합니다.
summary: 채널별 장애 징후와 해결 방법을 활용한 빠른 채널 수준 문제 해결
title: 채널 문제 해결
x-i18n:
    generated_at: "2026-07-12T00:34:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

채널은 연결되지만 동작이 올바르지 않을 때 이 페이지를 사용하세요.

## 명령 실행 순서

먼저 다음 명령을 순서대로 실행하세요.

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
- 채널 프로브에 전송 계층이 연결된 것으로 표시되며, 지원되는 경우 `works` 또는 `audit ok`가 표시됨

## 업데이트 후

업데이트 후 Telegram, iMessage, BlueBubbles 시절의 구성 또는 다른 Plugin 채널이 사라지는 경우 다음 명령을 사용하세요.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

`openclaw status --all`에서 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`를 찾으세요. 이는 채널이 구성되어 있지만 Plugin 설정 또는 로드 과정에서 채널을 등록하는 대신 손상된 종속성 트리가 감지되었다는 의미입니다. `openclaw doctor --fix`는 오래된 Plugin 런타임 종속성 심볼릭 링크와 오래된 인증 섀도를 제거하고, 이후 `openclaw gateway restart`가 깨끗한 상태를 다시 로드합니다.

## WhatsApp

### WhatsApp 장애 징후

| 증상                                | 가장 빠른 확인 방법                                   | 해결 방법                                                                                                                           |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 연결되었지만 DM 답장이 없음         | `openclaw pairing list whatsapp`                    | 발신자를 승인하거나 DM 정책/허용 목록을 변경하세요.                                                                                  |
| 그룹 메시지가 무시됨                | 구성에서 `requireMention`과 멘션 패턴 확인           | 봇을 멘션하거나 해당 그룹의 멘션 정책을 완화하세요.                                                                                   |
| QR 로그인 시간이 초과되며 408 발생  | Gateway의 `HTTPS_PROXY` / `HTTP_PROXY` 환경 변수 확인 | 연결 가능한 프록시를 설정하세요. 우회할 때만 `NO_PROXY`를 사용하세요.                                                                |
| 무작위 연결 끊김/재로그인 반복      | `openclaw channels status --probe`와 로그            | 현재 연결된 상태여도 최근 재연결은 표시됩니다. 로그를 확인하고 Gateway를 재시작한 후, 불안정한 상태가 계속되면 다시 연결하세요.       |
| `status=408 Request Time-out` 반복  | 프로브, 로그, doctor, Gateway 상태 순으로 확인       | 먼저 호스트 연결과 타이밍 문제를 해결하세요. 반복이 지속되면 인증을 백업하고 계정을 다시 연결하세요.                                 |
| 답장이 수초/수분 늦게 도착          | `openclaw doctor --fix`                              | doctor는 Gateway 이벤트 루프의 성능을 저하시키는 것으로 확인된 오래된 로컬 TUI 클라이언트를 중지합니다.                              |

전체 문제 해결: [WhatsApp 문제 해결](/ko/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 장애 징후

| 증상                                 | 가장 빠른 확인 방법                                  | 해결 방법                                                                                                                     |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` 후 사용 가능한 답장 흐름이 없음 | `openclaw pairing list telegram`                 | 페어링을 승인하거나 DM 정책을 변경하세요.                                                                                     |
| 봇이 온라인이지만 그룹에서는 응답이 없음 | 멘션 요구 사항과 봇 프라이버시 모드 확인          | 그룹에서 메시지를 볼 수 있도록 프라이버시 모드를 비활성화하거나 봇을 멘션하세요.                                              |
| 네트워크 오류로 전송 실패             | 로그에서 Telegram API 호출 실패 확인              | `api.telegram.org`로 향하는 DNS/IPv6/프록시 라우팅을 수정하세요.                                                              |
| 시작 시 `getMe returned 401` 보고     | 구성된 토큰 소스 확인                              | BotFather 토큰을 다시 복사하거나 재생성하고 `botToken`, `tokenFile` 또는 기본 계정의 `TELEGRAM_BOT_TOKEN`을 업데이트하세요. |
| 폴링이 멈추거나 재연결이 느림          | `openclaw logs --follow`에서 폴링 진단 확인       | 업그레이드하세요. 재시작이 오탐이면 `pollingStallThresholdMs`를 조정하세요. 문제가 지속되면 여전히 프록시/DNS/IPv6가 원인입니다. |
| 시작 시 `setMyCommands`가 거부됨       | 로그에서 `BOT_COMMANDS_TOO_MUCH` 확인             | Plugin/Skills/사용자 지정 Telegram 명령 수를 줄이거나 네이티브 메뉴를 비활성화하세요.                                         |
| 업그레이드 후 허용 목록에 의해 차단됨  | `openclaw security audit`와 구성 허용 목록 확인   | `openclaw doctor --fix`를 실행하거나 `@username`을 숫자형 발신자 ID로 바꾸세요.                                               |

전체 문제 해결: [Telegram 문제 해결](/ko/channels/telegram#troubleshooting)

## Discord

### Discord 장애 징후

| 증상                                      | 가장 빠른 확인 방법                                                                                                          | 해결 방법                                                                                                                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 봇이 온라인이지만 길드에서 답장이 없음    | `openclaw channels status --probe`                                                                                           | 길드/채널을 허용하고 메시지 콘텐츠 인텐트를 확인하세요.                                                                                                                                                                                                                |
| 그룹 메시지가 무시됨                      | 로그에서 멘션 게이팅으로 인한 삭제 확인                                                                                     | 봇을 멘션하거나 길드/채널의 `requireMention: false`를 설정하세요.                                                                                                                                                                                                     |
| 입력/토큰 사용량은 있지만 Discord 메시지가 없음 | 주변 룸 이벤트인지, 아니면 모델이 `message(action=send)`를 누락한 옵트인 `message_tool` 룸인지 확인                         | Gateway 상세 로그에서 억제된 최종 페이로드 메타데이터를 검사하고 `messages.groupChat.unmentionedInbound`를 확인하며 [주변 룸 이벤트](/ko/channels/ambient-room-events)를 읽거나, 일반 그룹 요청에서는 `messages.groupChat.visibleReplies: "automatic"`을 유지하세요. |
| DM 답장이 없음                            | `openclaw pairing list discord`                                                                                              | DM 페어링을 승인하거나 DM 정책을 조정하세요.                                                                                                                                                                                                                           |

전체 문제 해결: [Discord 문제 해결](/ko/channels/discord#troubleshooting)

## Slack

### Slack 장애 징후

| 증상                                    | 가장 빠른 확인 방법                         | 해결 방법                                                                                                                                               |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 소켓 모드는 연결되었지만 응답이 없음    | `openclaw channels status --probe`        | 앱 토큰, 봇 토큰 및 필수 범위를 확인하세요. SecretRef 기반 설정에서는 `botTokenStatus` / `appTokenStatus = configured_unavailable`이 표시되는지 확인하세요. |
| DM이 차단됨                             | `openclaw pairing list slack`             | 페어링을 승인하거나 DM 정책을 완화하세요.                                                                                                               |
| 채널 메시지가 무시됨                    | `groupPolicy`와 채널 허용 목록 확인       | 채널을 허용하거나 정책을 `open`으로 변경하세요.                                                                                                         |

전체 문제 해결: [Slack 문제 해결](/ko/channels/slack#troubleshooting)

## iMessage

### iMessage 장애 징후

| 증상                                  | 가장 빠른 확인 방법                                       | 해결 방법                                                                 |
| ------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| macOS가 아닌 환경에서 `imsg`가 없거나 실패함 | `openclaw channels status --probe --channel imessage` | 메시지용 Mac에서 OpenClaw를 실행하거나 `cliPath`에 SSH 래퍼를 사용하세요. |
| macOS에서 전송은 가능하지만 수신은 불가능함 | 메시지 자동화를 위한 macOS 개인정보 보호 권한 확인      | TCC 권한을 다시 부여하고 채널 프로세스를 재시작하세요.                     |
| DM 발신자가 차단됨                    | `openclaw pairing list imessage`                        | 페어링을 승인하거나 허용 목록을 업데이트하세요.                            |

전체 문제 해결: [iMessage 문제 해결](/ko/channels/imessage#troubleshooting)

## Signal

### Signal 장애 징후

| 증상                           | 가장 빠른 확인 방법                          | 해결 방법                                                     |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------- |
| 데몬에 연결할 수 있지만 봇이 응답하지 않음 | `openclaw channels status --probe`         | `signal-cli` 데몬 URL/계정 및 수신 모드를 확인하세요.          |
| DM이 차단됨                    | `openclaw pairing list signal`             | 발신자를 승인하거나 DM 정책을 조정하세요.                       |
| 그룹 답장이 트리거되지 않음    | 그룹 허용 목록과 멘션 패턴 확인            | 발신자/그룹을 추가하거나 게이팅을 완화하세요.                    |

전체 문제 해결: [Signal 문제 해결](/ko/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 장애 징후

| 증상                              | 가장 빠른 확인 방법                            | 해결 방법                                                          |
| --------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| 봇이 "gone to Mars"라고 응답함    | 구성에서 `appId`와 `clientSecret` 확인       | 자격 증명을 설정하거나 Gateway를 재시작하세요.                       |
| 수신 메시지가 없음                | `openclaw channels status --probe`           | QQ Open Platform에서 자격 증명을 확인하세요.                         |
| 음성이 텍스트로 변환되지 않음     | STT 제공자 구성 확인                         | `channels.qqbot.stt` 또는 `tools.media.audio`를 구성하세요.         |
| 선제 메시지가 도착하지 않음        | QQ 플랫폼 상호작용 요구 사항 확인            | 최근 상호작용이 없으면 QQ가 봇이 먼저 보낸 메시지를 차단할 수 있습니다. |

전체 문제 해결: [QQ Bot 문제 해결](/ko/channels/qqbot#troubleshooting)

## Matrix

### Matrix 실패 징후

| 증상                                  | 가장 빠른 확인 방법                    | 해결 방법                                                                            |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| 로그인했지만 룸 메시지를 무시함       | `openclaw channels status --probe`     | `groupPolicy`, 룸 허용 목록, 멘션 게이팅을 확인합니다.                                |
| DM이 처리되지 않음                    | `openclaw pairing list matrix`         | 발신자를 승인하거나 DM 정책을 조정합니다.                                             |
| 암호화된 룸에서 실패함                | `openclaw matrix verify status`        | 기기를 다시 인증한 다음 `openclaw matrix verify backup status`를 확인합니다.          |
| 백업 복원이 보류 중이거나 실패함      | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore`를 실행하거나 복구 키를 사용하여 다시 실행합니다. |
| 교차 서명/부트스트랩 상태가 잘못됨    | `openclaw matrix verify bootstrap`     | 비밀 저장소, 교차 서명, 백업 상태를 한 번에 복구합니다.                               |

전체 설정 및 구성: [Matrix](/ko/channels/matrix)

## 관련 항목

- [페어링](/ko/channels/pairing)
- [채널 라우팅](/ko/channels/channel-routing)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
