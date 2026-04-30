---
read_when:
    - 채널 전송 계층은 연결됨으로 표시되지만 답장이 실패함
    - 자세한 제공자 문서를 보기 전에 채널별 확인이 필요합니다
summary: 채널별 실패 시그니처와 해결 방법을 포함한 빠른 채널 수준 문제 해결
title: 채널 문제 해결
x-i18n:
    generated_at: "2026-04-30T06:20:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

동작은 잘못되지만 채널은 연결되는 경우 이 페이지를 사용하세요.

## 명령 사다리

먼저 다음을 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 기준선:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` 또는 `admin-capable`
- 채널 프로브에 전송 계층이 연결된 것으로 표시되고, 지원되는 경우 `works` 또는 `audit ok`가 표시됨

## WhatsApp

### WhatsApp 실패 징후

| 증상                         | 가장 빠른 확인 방법                                       | 수정                                                                                                                              |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 연결되었지만 DM 응답 없음     | `openclaw pairing list whatsapp`                    | 발신자를 승인하거나 DM 정책/허용 목록을 변경하세요.                                                                                    |
| 그룹 메시지가 무시됨          | 구성에서 `requireMention` 및 멘션 패턴 확인 | 봇을 멘션하거나 해당 그룹의 멘션 정책을 완화하세요.                                                                          |
| QR 로그인 시간이 408로 초과됨 | Gateway `HTTPS_PROXY` / `HTTP_PROXY` 환경 변수 확인      | 연결 가능한 프록시를 설정하고, `NO_PROXY`는 우회에만 사용하세요.                                                                         |
| 무작위 연결 해제/재로그인 반복 | `openclaw channels status --probe` + 로그           | 현재 연결되어 있어도 최근 재연결은 플래그로 표시됩니다. 로그를 확인하고 Gateway를 재시작한 다음, 플래핑이 계속되면 다시 연결하세요. |

전체 문제 해결: [WhatsApp 문제 해결](/ko/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 실패 징후

| 증상                              | 가장 빠른 확인 방법                                    | 수정                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`했지만 사용할 수 있는 응답 흐름 없음    | `openclaw pairing list telegram`                 | 페어링을 승인하거나 DM 정책을 변경하세요.                                                                                       |
| 봇은 온라인이지만 그룹이 계속 조용함    | 멘션 요구 사항과 봇 개인정보 보호 모드 확인  | 그룹 가시성을 위해 개인정보 보호 모드를 비활성화하거나 봇을 멘션하세요.                                                                  |
| 네트워크 오류로 전송 실패    | Telegram API 호출 실패에 대한 로그 검사      | `api.telegram.org`로 가는 DNS/IPv6/프록시 라우팅을 수정하세요.                                                                          |
| 시작 시 `getMe returned 401` 보고 | 구성된 토큰 소스 확인                    | BotFather 토큰을 다시 복사하거나 재생성하고 `botToken`, `tokenFile` 또는 기본 계정 `TELEGRAM_BOT_TOKEN`을 업데이트하세요.     |
| 폴링이 멈추거나 느리게 재연결됨  | 폴링 진단을 위해 `openclaw logs --follow` 실행 | 업그레이드하세요. 재시작이 오탐이면 `pollingStallThresholdMs`를 조정하세요. 지속적인 중단은 여전히 프록시/DNS/IPv6 문제를 가리킵니다. |
| 시작 시 `setMyCommands` 거부됨  | `BOT_COMMANDS_TOO_MUCH`에 대한 로그 검사         | Plugin/skill/사용자 지정 Telegram 명령을 줄이거나 네이티브 메뉴를 비활성화하세요.                                                      |
| 업그레이드 후 허용 목록이 사용자를 차단함    | `openclaw security audit` 및 구성 허용 목록  | `openclaw doctor --fix`를 실행하거나 `@username`을 숫자 발신자 ID로 바꾸세요.                                                |

전체 문제 해결: [Telegram 문제 해결](/ko/channels/telegram#troubleshooting)

## Discord

### Discord 실패 징후

| 증상                         | 가장 빠른 확인 방법                       | 수정                                                       |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 봇은 온라인이지만 길드 응답 없음 | `openclaw channels status --probe`  | 길드/채널을 허용하고 메시지 콘텐츠 인텐트를 확인하세요.    |
| 그룹 메시지가 무시됨          | 멘션 게이팅 드롭에 대한 로그 확인 | 봇을 멘션하거나 길드/채널 `requireMention: false`를 설정하세요. |
| DM 응답 누락              | `openclaw pairing list discord`     | DM 페어링을 승인하거나 DM 정책을 조정하세요.                   |

전체 문제 해결: [Discord 문제 해결](/ko/channels/discord#troubleshooting)

## Slack

### Slack 실패 징후

| 증상                                | 가장 빠른 확인 방법                             | 수정                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 소켓 모드는 연결되었지만 응답 없음 | `openclaw channels status --probe`        | 앱 토큰 + 봇 토큰과 필요한 범위를 확인하세요. SecretRef 기반 설정에서는 `botTokenStatus` / `appTokenStatus = configured_unavailable`을 주시하세요. |
| DM 차단됨                            | `openclaw pairing list slack`             | 페어링을 승인하거나 DM 정책을 완화하세요.                                                                                                                  |
| 채널 메시지가 무시됨                | `groupPolicy` 및 채널 허용 목록 확인 | 채널을 허용하거나 정책을 `open`으로 변경하세요.                                                                                                        |

전체 문제 해결: [Slack 문제 해결](/ko/channels/slack#troubleshooting)

## iMessage 및 BlueBubbles

### iMessage 및 BlueBubbles 실패 징후

| 증상                          | 가장 빠른 확인 방법                                                           | 수정                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 인바운드 이벤트 없음                | Webhook/서버 접근성과 앱 권한 확인                  | Webhook URL 또는 BlueBubbles 서버 상태를 수정하세요.          |
| macOS에서 전송은 되지만 수신 없음 | Messages 자동화에 대한 macOS 개인정보 보호 권한 확인                 | TCC 권한을 다시 부여하고 채널 프로세스를 재시작하세요. |
| DM 발신자 차단됨                | `openclaw pairing list imessage` 또는 `openclaw pairing list bluebubbles` | 페어링을 승인하거나 허용 목록을 업데이트하세요.                  |

전체 문제 해결:

- [iMessage 문제 해결](/ko/channels/imessage#troubleshooting)
- [BlueBubbles 문제 해결](/ko/channels/bluebubbles#troubleshooting)

## Signal

### Signal 실패 징후

| 증상                         | 가장 빠른 확인 방법                              | 수정                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 데몬에 접근 가능하지만 봇이 조용함 | `openclaw channels status --probe`         | `signal-cli` 데몬 URL/계정 및 수신 모드를 확인하세요. |
| DM 차단됨                      | `openclaw pairing list signal`             | 발신자를 승인하거나 DM 정책을 조정하세요.                      |
| 그룹 응답이 트리거되지 않음    | 그룹 허용 목록과 멘션 패턴 확인 | 발신자/그룹을 추가하거나 게이팅을 완화하세요.                       |

전체 문제 해결: [Signal 문제 해결](/ko/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 실패 징후

| 증상                         | 가장 빠른 확인 방법                               | 수정                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 봇이 "gone to Mars"라고 응답함      | 구성에서 `appId` 및 `clientSecret` 확인 | 자격 증명을 설정하거나 Gateway를 재시작하세요.                         |
| 인바운드 메시지 없음             | `openclaw channels status --probe`          | QQ Open Platform에서 자격 증명을 확인하세요.                     |
| 음성이 전사되지 않음           | STT 제공자 구성 확인                   | `channels.qqbot.stt` 또는 `tools.media.audio`를 구성하세요.          |
| 사전 메시지가 도착하지 않음 | QQ 플랫폼 상호작용 요구 사항 확인  | 최근 상호작용이 없으면 QQ가 봇 시작 메시지를 차단할 수 있습니다. |

전체 문제 해결: [QQ Bot 문제 해결](/ko/channels/qqbot#troubleshooting)

## Matrix

### Matrix 실패 징후

| 증상                             | 가장 빠른 확인 방법                          | 수정                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 로그인되었지만 룸 메시지를 무시함 | `openclaw channels status --probe`     | `groupPolicy`, 룸 허용 목록 및 멘션 게이팅을 확인하세요.                  |
| DM이 처리되지 않음                  | `openclaw pairing list matrix`         | 발신자를 승인하거나 DM 정책을 조정하세요.                                       |
| 암호화된 룸 실패                | `openclaw matrix verify status`        | 디바이스를 다시 확인한 다음 `openclaw matrix verify backup status`를 확인하세요.  |
| 백업 복원이 보류 중이거나 손상됨    | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore`를 실행하거나 복구 키로 다시 실행하세요. |
| 교차 서명/부트스트랩이 잘못된 것으로 보임 | `openclaw matrix verify bootstrap`     | 비밀 저장소, 교차 서명 및 백업 상태를 한 번에 복구하세요.       |

전체 설정 및 구성: [Matrix](/ko/channels/matrix)

## 관련 항목

- [페어링](/ko/channels/pairing)
- [채널 라우팅](/ko/channels/channel-routing)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
