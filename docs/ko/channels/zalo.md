---
read_when:
    - Zalo 기능 또는 Webhook 작업하기
summary: Zalo 봇 지원 상태, 기능 및 구성
title: Zalo
x-i18n:
    generated_at: "2026-07-12T00:36:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

상태: 실험적. 다이렉트 메시지와 그룹 채팅이 모두 구현되어 있으며, 아래 [기능](#capabilities) 표는 Zalo Bot Creator / Marketplace 봇에서 검증된 동작을 반영합니다.

## 번들 Plugin

현재 OpenClaw 릴리스에는 Zalo가 번들 Plugin으로 포함되므로, 패키징된 빌드에서는 별도로 설치할 필요가 없습니다.

이전 빌드나 Zalo를 제외한 사용자 지정 설치에서는 npm 패키지를 직접 설치하세요.

- 설치: `openclaw plugins install @openclaw/zalo`
- 버전 고정: `openclaw plugins install @openclaw/zalo@2026.6.11`
- 로컬 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalo-plugin`
- 자세한 내용: [Plugin](/ko/tools/plugin)

## 빠른 설정

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)에서 봇 토큰을 생성합니다(로그인하고 봇을 만든 다음 설정을 구성합니다). 토큰 형식은 `numeric_id:secret`이며, Marketplace 봇의 경우 사용 가능한 런타임 토큰이 봇의 환영 메시지에 표시될 수 있습니다.
2. 환경 변수 `ZALO_BOT_TOKEN=...`(기본 계정에만 적용) 또는 구성에서 토큰을 설정합니다.
3. Gateway를 다시 시작합니다.
4. 첫 번째 DM 연락 시 페어링 코드를 승인합니다(기본 DM 정책은 페어링입니다).

최소 구성:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

다중 계정: `channels.zalo.accounts.<id>` 아래에 항목을 더 추가하고 각각 자체 `botToken`/`name`을 지정합니다. `channels.zalo.botToken`(`accounts`가 없는 평면 형태)은 레거시 단일 계정 축약형입니다. 새 구성에는 `accounts.<id>.*`를 사용하는 것이 좋습니다.

## 개요

Zalo는 베트남에 중점을 둔 메시징 앱입니다. Bot API를 사용하면 Gateway가 1:1 대화와 그룹 채팅 모두에서 봇을 실행할 수 있으며, 응답은 결정론적으로 Zalo로 다시 라우팅됩니다(모델이 채널을 선택하는 일은 없습니다).

이 페이지에서는 **Zalo Bot Creator / Marketplace 봇**을 다룹니다. **Zalo Official Account (OA) 봇**은 다른 제품 영역이며 동작도 다를 수 있습니다. 이 페이지에서는 이를 다루지 않습니다.

## 작동 방식

- 수신 메시지는 미디어 자리표시자와 함께 공유 채널 엔벌로프로 정규화됩니다.
- 응답은 항상 동일한 Zalo 채팅으로 다시 라우팅되며, 인용 답장은 사용되지 않습니다(`replyToMode`는 항상 꺼져 있습니다).
- 기본적으로 롱 폴링(`getUpdates`)을 사용하며, `channels.zalo.webhookUrl`을 통해 Webhook 모드를 사용할 수 있습니다.
- 그룹에서는 봇을 작동시키려면 @멘션이 필요하며, 채널별로 구성할 수 없습니다.

## 제한

| 제한                           | 값                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------- |
| 발신 텍스트 청크 크기          | 2000자(Zalo API 제한)                                                         |
| 미디어 크기(수신/발신)         | `channels.zalo.mediaMaxMb`, 기본값 `5`MB                                      |
| Webhook 요청 본문              | 1MB, 읽기 제한 시간 30초                                                      |
| Webhook 요청 속도 제한         | 경로+클라이언트 IP당 60초 동안 요청 120개, 이후 HTTP 429                      |
| Webhook 중복 이벤트 감지 기간  | 5분(경로 + 계정 + 이벤트 이름 + 채팅 + 발신자 + 메시지 ID를 키로 사용)       |

## 접근 제어

### 다이렉트 메시지

- `channels.zalo.dmPolicy`: `pairing`(기본값) | `allowlist` | `open` | `disabled`.
- 페어링: 알 수 없는 발신자에게 페어링 코드가 제공되며, 승인될 때까지 메시지가 무시됩니다. 코드는 1시간 후 만료됩니다.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 자세한 내용: [페어링](/ko/channels/pairing)
- `channels.zalo.allowFrom`에는 숫자로 된 Zalo 사용자 ID를 사용할 수 있습니다(사용자 이름 조회는 지원하지 않음). `open`에는 `"*"`가 필요합니다.

### 그룹

그룹 채팅은 Plugin에서 지원되며(`chatTypes: ["direct", "group"]`), 멘션 및 그룹 정책으로 제한됩니다.

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom`은 그룹에서 봇을 작동시킬 수 있는 발신자 ID를 제한하며, 설정하지 않으면 `allowFrom`으로 대체됩니다.
- 기본 해석: `channels.zalo`가 구성되어 있고 `groupPolicy`가 설정되지 않은 경우 `open`으로 해석됩니다. `channels.zalo`가 완전히 누락된 경우 런타임은 안전을 위해 `allowlist`로 제한됩니다.
- 실제 환경에서 보고된 주의 사항: 일부 Marketplace 봇 설정에서는 봇을 그룹에 전혀 추가할 수 없었습니다. 이 문제가 발생하면 봇의 Zalo Bot Platform 설정을 확인하세요. 이는 OpenClaw 정책이 아니라 플랫폼 측 제약입니다.

## 롱 폴링과 Webhook 비교

- 기본값: 롱 폴링(공개 URL 불필요).
- Webhook 모드: `channels.zalo.webhookUrl` 및 `channels.zalo.webhookSecret`을 설정합니다.
  - Webhook URL은 HTTPS를 사용해야 합니다.
  - Webhook 시크릿은 8~256자여야 합니다.
  - Zalo는 `X-Bot-Api-Secret-Token` 헤더와 함께 이벤트를 전송하며, 이 헤더는 상수 시간 비교를 통해 확인됩니다.
  - Gateway HTTP는 `channels.zalo.webhookPath`에서 Webhook 요청을 처리합니다(기본값은 Webhook URL의 경로).
  - 요청은 `Content-Type: application/json` 또는 `+json` 미디어 유형을 사용해야 합니다.
  - Zalo API 문서에 따르면 getUpdates 폴링과 Webhook은 함께 사용할 수 없습니다.

## 지원되는 메시지 유형

- 텍스트: 완전히 지원되며 2000자 단위로 분할됩니다.
- 미디어: 수신/발신을 지원하며 `mediaMaxMb`로 제한됩니다.
- 반응, 스레드, 설문 조사, 네이티브 명령: Plugin에서 지원되지 않습니다.
- 스트리밍: Plugin은 블록 스트리밍 기능을 선언하지만, Zalo에는 일부 다른 지역 채널과 달리 전용 발신 대기열/텍스트 병합 조정 옵션이 없습니다. 이 기능이 사용 사례에 중요하다면 현재 환경에서 동작을 확인하세요.

## 기능

| 기능                     | 상태                                  |
| ------------------------ | ------------------------------------- |
| 다이렉트 메시지          | 지원                                  |
| 그룹                     | 지원(멘션 필요)                       |
| 미디어(수신/발신)        | 지원, `mediaMaxMb`로 제한             |
| 반응                     | 지원되지 않음                         |
| 스레드                   | 지원되지 않음                         |
| 설문 조사                | 지원되지 않음                         |
| 네이티브 명령            | 지원되지 않음                         |
| 특정 메시지에 답장/인용  | 사용하지 않음(항상 꺼짐)              |

## 전송 대상(CLI/Cron)

채팅 ID를 대상으로 사용합니다.

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## 문제 해결

**봇이 응답하지 않는 경우:**

- 토큰을 확인합니다: `openclaw channels status --probe`
- 발신자가 승인되었는지 확인합니다(페어링 또는 `allowFrom`)
- Gateway 로그를 확인합니다: `openclaw logs --follow`

**Webhook에서 이벤트를 수신하지 못하는 경우:**

- Webhook URL이 HTTPS를 사용하는지 확인합니다
- 시크릿이 8~256자인지 확인합니다
- 구성된 경로에서 Gateway HTTP 엔드포인트에 접근할 수 있는지 확인합니다
- getUpdates 폴링이 함께 실행되고 있지 않은지 확인합니다(둘은 함께 사용할 수 없음)
- 요청이 급증하면 HTTP 429가 반환될 수 있습니다(경로+IP당 60초 동안 요청 120개). 잠시 기다린 후 다시 시도하세요

## 구성 참조

전체 구성: [구성](/ko/gateway/configuration)

| 설정                                         | 설명                                              | 기본값                |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | 채널 시작 활성화/비활성화                         | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Zalo Bot Platform의 봇 토큰                       | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | 파일에서 토큰 읽기(심볼릭 링크 거부)              | -                     |
| `channels.zalo.accounts.<id>.name`           | 표시 이름                                         | -                     |
| `channels.zalo.accounts.<id>.enabled`        | 이 계정 활성화/비활성화                           | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | 계정별 DM 정책                                    | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | DM 허용 목록(사용자 ID)                           | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | 계정별 그룹 정책                                  | [그룹](#groups) 참조  |
| `channels.zalo.accounts.<id>.groupAllowFrom` | 그룹 발신자 허용 목록, `allowFrom`으로 대체 가능  | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 수신/발신 미디어 제한(MB)                         | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Webhook 모드 활성화(HTTPS 필수)                   | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook 시크릿(8~256자)                           | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Gateway HTTP 서버의 Webhook 경로                  | Webhook URL 경로      |
| `channels.zalo.accounts.<id>.proxy`          | API 요청용 프록시 URL                             | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 발신 응답 접두사 재정의                           | -                     |
| `channels.zalo.defaultAccount`               | 여러 계정이 구성된 경우 사용할 기본 계정         | `default`             |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` 및 기타 평면 최상위 키는 위 필드의 레거시 단일 계정 축약형이며, 두 형식 모두 지원됩니다.

환경 변수 옵션: `ZALO_BOT_TOKEN=...`은 기본 계정의 토큰에만 적용됩니다.

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 접근 모델 및 보안 강화
