---
read_when:
    - 채널 전송은 연결됨으로 표시되지만 응답이 실패함
    - 심층 제공자 문서를 보기 전에 채널별 점검이 필요합니다.
summary: 채널별 실패 시그니처 및 해결 방법을 통한 빠른 채널 수준 문제 해결
title: 채널 문제 해결
x-i18n:
    generated_at: "2026-05-10T19:24:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

채널은 연결되지만 동작이 잘못된 경우 이 페이지를 사용하세요.

## 명령 단계

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
- 채널 프로브에서 전송 계층이 연결된 것으로 표시되고, 지원되는 경우 `works` 또는 `audit ok`가 표시됩니다.

## WhatsApp

### WhatsApp 실패 징후

| 증상                                | 가장 빠른 확인 방법                                  | 수정 방법                                                                                                                            |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 연결되었지만 DM 답장이 없음         | `openclaw pairing list whatsapp`                    | 보낸 사람을 승인하거나 DM 정책/허용 목록을 변경하세요.                                                                               |
| 그룹 메시지가 무시됨                | 설정에서 `requireMention`과 멘션 패턴 확인          | 봇을 멘션하거나 해당 그룹의 멘션 정책을 완화하세요.                                                                                  |
| QR 로그인이 408로 시간 초과됨       | Gateway `HTTPS_PROXY` / `HTTP_PROXY` env 확인       | 연결 가능한 프록시를 설정하고, 우회에만 `NO_PROXY`를 사용하세요.                                                                     |
| 무작위 연결 해제/재로그인 반복      | `openclaw channels status --probe` + 로그           | 현재 연결되어 있어도 최근 재연결이 표시됩니다. 로그를 확인하고 Gateway를 다시 시작한 다음, 흔들림이 계속되면 다시 연결하세요.       |
| 답장이 몇 초/몇 분 늦게 도착함      | `openclaw doctor --fix`                             | Doctor는 Gateway 이벤트 루프를 저하시키는 것으로 확인된 오래된 로컬 TUI 클라이언트를 중지합니다.                                     |

전체 문제 해결: [WhatsApp 문제 해결](/ko/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 실패 징후

| 증상                                  | 가장 빠른 확인 방법                              | 수정 방법                                                                                                                        |
| ------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start`는 되지만 사용 가능한 답장 흐름이 없음 | `openclaw pairing list telegram`                 | 페어링을 승인하거나 DM 정책을 변경하세요.                                                                                       |
| 봇이 온라인이지만 그룹이 계속 조용함   | 멘션 요구 사항과 봇 개인정보 보호 모드 확인      | 그룹 표시를 위해 개인정보 보호 모드를 비활성화하거나 봇을 멘션하세요.                                                          |
| 네트워크 오류로 전송 실패             | Telegram API 호출 실패 로그 점검                 | `api.telegram.org`로 향하는 DNS/IPv6/프록시 라우팅을 수정하세요.                                                                |
| 시작 시 `getMe returned 401` 보고     | 구성된 토큰 소스 확인                            | BotFather 토큰을 다시 복사하거나 재생성한 뒤 `botToken`, `tokenFile` 또는 기본 계정 `TELEGRAM_BOT_TOKEN`을 업데이트하세요.       |
| 폴링이 멈추거나 느리게 다시 연결됨    | 폴링 진단을 위해 `openclaw logs --follow` 실행   | 업그레이드하세요. 재시작이 오탐이면 `pollingStallThresholdMs`를 조정하세요. 지속적인 멈춤은 여전히 프록시/DNS/IPv6 문제를 가리킵니다. |
| 시작 시 `setMyCommands`가 거부됨      | 로그에서 `BOT_COMMANDS_TOO_MUCH` 확인            | Plugin/skill/사용자 지정 Telegram 명령을 줄이거나 네이티브 메뉴를 비활성화하세요.                                               |
| 업그레이드 후 허용 목록이 사용자를 차단함 | `openclaw security audit` 및 설정 허용 목록 확인 | `openclaw doctor --fix`를 실행하거나 `@username`을 숫자 보낸 사람 ID로 바꾸세요.                                                 |

전체 문제 해결: [Telegram 문제 해결](/ko/channels/telegram#troubleshooting)

## Discord

### Discord 실패 징후

| 증상                                      | 가장 빠른 확인 방법                                                     | 수정 방법                                                                                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 봇이 온라인이지만 길드 답장이 없음        | `openclaw channels status --probe`                                     | 길드/채널을 허용하고 메시지 콘텐츠 인텐트를 확인하세요.                                                                                                                 |
| 그룹 메시지가 무시됨                      | 멘션 게이팅으로 인한 드롭 로그 확인                                    | 봇을 멘션하거나 길드/채널 `requireMention: false`를 설정하세요.                                                                                                          |
| 입력 중/토큰 사용은 있지만 Discord 메시지가 없음 | 세션 로그에 `didSendViaMessagingTool: false`인 어시스턴트 텍스트 표시 | 모델이 메시지 도구를 호출하지 않고 비공개로 답했습니다. 도구 호출이 안정적인 모델을 사용하거나, 자동 게시를 위해 `messages.groupChat.visibleReplies: "automatic"`을 설정하세요. |
| DM 답장이 없음                            | `openclaw pairing list discord`                                        | DM 페어링을 승인하거나 DM 정책을 조정하세요.                                                                                                                            |

전체 문제 해결: [Discord 문제 해결](/ko/channels/discord#troubleshooting)

## Slack

### Slack 실패 징후

| 증상                                  | 가장 빠른 확인 방법                       | 수정 방법                                                                                                                                              |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 소켓 모드가 연결되었지만 응답이 없음  | `openclaw channels status --probe`        | 앱 토큰 + 봇 토큰과 필요한 범위를 확인하세요. SecretRef 기반 설정에서는 `botTokenStatus` / `appTokenStatus = configured_unavailable`를 주시하세요.     |
| DM이 차단됨                           | `openclaw pairing list slack`             | 페어링을 승인하거나 DM 정책을 완화하세요.                                                                                                              |
| 채널 메시지가 무시됨                  | `groupPolicy`와 채널 허용 목록 확인       | 채널을 허용하거나 정책을 `open`으로 변경하세요.                                                                                                       |

전체 문제 해결: [Slack 문제 해결](/ko/channels/slack#troubleshooting)

## iMessage

### iMessage 실패 징후

| 증상                                  | 가장 빠른 확인 방법                                      | 수정 방법                                                                 |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| macOS가 아닌 환경에서 `imsg`가 없거나 실패함 | `openclaw channels status --probe --channel imessage`   | Messages Mac에서 OpenClaw를 실행하거나 `cliPath`에 SSH 래퍼를 사용하세요. |
| macOS에서 보낼 수 있지만 받을 수 없음 | Messages 자동화를 위한 macOS 개인정보 보호 권한 확인    | TCC 권한을 다시 부여하고 채널 프로세스를 다시 시작하세요.                |
| DM 보낸 사람이 차단됨                 | `openclaw pairing list imessage`                        | 페어링을 승인하거나 허용 목록을 업데이트하세요.                           |

전체 문제 해결:

- [iMessage 문제 해결](/ko/channels/imessage#troubleshooting)

## Signal

### Signal 실패 징후

| 증상                         | 가장 빠른 확인 방법                      | 수정 방법                                                  |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| 데몬에 접근 가능하지만 봇이 조용함 | `openclaw channels status --probe`       | `signal-cli` 데몬 URL/계정과 수신 모드를 확인하세요.       |
| DM이 차단됨                  | `openclaw pairing list signal`           | 보낸 사람을 승인하거나 DM 정책을 조정하세요.               |
| 그룹 답장이 트리거되지 않음  | 그룹 허용 목록과 멘션 패턴 확인          | 보낸 사람/그룹을 추가하거나 게이팅을 완화하세요.           |

전체 문제 해결: [Signal 문제 해결](/ko/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 실패 징후

| 증상                                | 가장 빠른 확인 방법                              | 수정 방법                                                        |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| 봇이 "화성에 갔다"고 답함           | 설정에서 `appId`와 `clientSecret` 확인          | 자격 증명을 설정하거나 Gateway를 다시 시작하세요.                |
| 인바운드 메시지가 없음              | `openclaw channels status --probe`              | QQ Open Platform에서 자격 증명을 확인하세요.                     |
| 음성이 텍스트로 변환되지 않음       | STT 공급자 설정 확인                            | `channels.qqbot.stt` 또는 `tools.media.audio`를 구성하세요.      |
| 선제 메시지가 도착하지 않음         | QQ 플랫폼 상호작용 요구 사항 확인               | 최근 상호작용이 없으면 QQ가 봇이 시작한 메시지를 차단할 수 있습니다. |

전체 문제 해결: [QQ Bot 문제 해결](/ko/channels/qqbot#troubleshooting)

## Matrix

### Matrix 실패 징후

| 증상                                  | 가장 빠른 확인 방법                         | 수정 방법                                                                   |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| 로그인했지만 방 메시지를 무시함       | `openclaw channels status --probe`          | `groupPolicy`, 방 허용 목록, 멘션 게이팅을 확인하세요.                     |
| DM이 처리되지 않음                    | `openclaw pairing list matrix`              | 보낸 사람을 승인하거나 DM 정책을 조정하세요.                                |
| 암호화된 방이 실패함                  | `openclaw matrix verify status`             | 장치를 다시 확인한 다음 `openclaw matrix verify backup status`를 확인하세요. |
| 백업 복원이 대기 중이거나 손상됨      | `openclaw matrix verify backup status`      | `openclaw matrix verify backup restore`를 실행하거나 복구 키로 다시 실행하세요. |
| 교차 서명/부트스트랩이 잘못되어 보임  | `openclaw matrix verify bootstrap`          | 비밀 저장소, 교차 서명, 백업 상태를 한 번에 복구하세요.                     |

전체 설정 및 구성: [Matrix](/ko/channels/matrix)

## 관련 항목

- [페어링](/ko/channels/pairing)
- [채널 라우팅](/ko/channels/channel-routing)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
