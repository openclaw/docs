---
read_when:
    - Twilio를 통해 OpenClaw를 SMS에 연결하려고 합니다
    - SMS Webhook 또는 허용 목록 설정이 필요합니다
summary: Twilio SMS 채널 설정, 액세스 제어 및 Webhook 구성
title: SMS
x-i18n:
    generated_at: "2026-07-16T12:24:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw는 Twilio 전화번호 또는 Messaging Service를 통해 SMS를 수신하고 전송합니다. Gateway는 인바운드 Webhook 경로(기본값 `/webhooks/sms`)를 등록하고, 기본적으로 Twilio 요청 서명을 검증하며, Twilio의 Messages API를 통해 응답을 다시 전송합니다.

상태: 별도로 설치되는 공식 Plugin입니다. 텍스트 전용이며 MMS/미디어는 지원하지 않고 다이렉트 메시지만 지원합니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    SMS의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="Gateway 보안" icon="shield" href="/ko/gateway/security">
    Webhook 노출 및 발신자 액세스 제어를 검토합니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북입니다.
  </Card>
</CardGroup>

## 시작하기 전에

다음이 필요합니다.

- `openclaw plugins install @openclaw/sms`로 설치한 공식 SMS Plugin.
- SMS를 지원하는 전화번호 또는 Twilio Messaging Service가 있는 Twilio 계정.
- Twilio Account SID 및 Auth Token.
- OpenClaw Gateway로 연결되는 공개 HTTPS URL.
- 발신자 정책 선택: 비공개 사용에는 `pairing`(기본값), 사전 승인된 전화번호에는 `allowlist`, 의도적으로 공개된 SMS 액세스에만 `open`.

하나의 Twilio 번호에 두 기능이 모두 있으면 SMS와 [음성 통화](/ko/plugins/voice-call)에 모두 사용할 수 있습니다. SMS Webhook과 음성 Webhook은 Twilio에서 별도로 구성되며 서로 다른 Gateway 경로를 사용합니다. 이 페이지에서는 SMS Webhook만 다룹니다.

## 빠른 설정

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Twilio 발신자 생성 또는 선택">
    Twilio에서 **Phone Numbers > Manage > Active numbers**를 열고 SMS를 지원하는 번호를 선택합니다. 다음을 저장합니다.

    - Account SID(예: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
    - Auth Token
    - 발신자 전화번호(예: `+15551234567`)

    고정 발신자 번호 대신 Messaging Service를 사용하는 경우 Messaging Service SID(예: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)를 저장합니다.

  </Step>

  <Step title="SMS 채널 구성">

다음을 `sms.patch.json5`로 저장하고 자리표시자를 변경합니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

적용합니다.

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Twilio를 Gateway Webhook으로 연결">
    Twilio 전화번호 설정에서 **Messaging**을 열고 **A message comes in**을 다음으로 설정합니다.

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST`을 사용합니다. 기본 로컬 경로는 `/webhooks/sms`입니다. 다른 경로가 필요하면 `channels.sms.webhookPath`을 변경합니다.

  </Step>

  <Step title="정확한 SMS Webhook 경로 노출">
    공개 URL은 SMS 경로를 Gateway 프로세스(기본 포트 `18789`)로 라우팅해야 합니다. 로컬 테스트에 Tailscale Funnel을 사용하는 경우 `/webhooks/sms`을 명시적으로 노출합니다.

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    음성 통화와 SMS는 별도의 Webhook 경로를 사용합니다. 동일한 Twilio 번호가 두 기능을 모두 처리하는 경우 Twilio와 터널 모두에 두 경로를 구성된 상태로 유지합니다.

  </Step>

  <Step title="Gateway 시작 및 첫 번째 발신자 승인">

```bash
openclaw gateway
```

Twilio 번호로 문자 메시지를 보냅니다. 첫 번째 메시지는 페어링 요청을 생성합니다. 다음과 같이 승인합니다.

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    페어링 코드는 1시간 후 만료됩니다.

  </Step>
</Steps>

## 구성 예시

모든 키는 `channels.sms` 아래에 있으며, 계정별 키는 `channels.sms.accounts.<id>` 아래에 있습니다.

| 키                                      | 기본값          | 용도                                                                |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | 채널/계정을 활성화하거나 비활성화합니다.                            |
| `accountSid`                            | —               | Twilio Account SID(`AC...`).                                       |
| `authToken`                             | —               | Twilio Auth Token. 일반 텍스트 문자열 또는 SecretRef입니다.        |
| `fromNumber`                            | —               | E.164 발신자 번호입니다.                                            |
| `messagingServiceSid`                   | —               | `fromNumber`가 확인되지 않을 때 사용하는 Messaging Service SID(`MG...`)입니다. |
| `defaultTo`                             | —               | 전송 흐름에서 명시적 대상을 생략한 경우의 기본 목적지입니다.       |
| `webhookPath`                           | `/webhooks/sms` | 인바운드 Twilio Webhook의 Gateway HTTP 경로입니다.                  |
| `publicWebhookUrl`                      | —               | Twilio에 구성된 공개 URL이며 서명 검증에 필요합니다.                |
| `dangerouslyDisableSignatureValidation` | `false`         | `X-Twilio-Signature` 검사를 건너뜁니다. 로컬 터널 테스트에만 사용합니다.        |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` 또는 `disabled`.                      |
| `allowFrom`                             | `[]`            | E.164 형식으로 허용된 발신자 번호 또는 `dmPolicy: "open"`과 함께 사용하는 `"*"`.  |
| `textChunkLimit`                        | `1500`          | 아웃바운드 SMS 청크당 최대 문자 수입니다.                           |
| `accounts`, `defaultAccount`            | —               | 다중 계정 맵 및 기본 계정 ID입니다.                                |

### 구성 파일

채널 정의를 Gateway 구성과 함께 유지하려면 구성 파일 설정을 사용합니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### 환경 변수

환경 변수는 기본 계정에만 적용되며, 구성 값이 환경 변수 값보다 우선합니다.

| 변수                                            | 매핑 대상                                          |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (별칭 `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`(쉼표로 구분)                           |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation`(`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

그런 다음 구성에서 채널을 활성화합니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### SecretRef 인증 토큰

`authToken`은 SecretRef(`source: "env" | "file" | "exec"`)일 수 있습니다. Gateway가 일반 텍스트 구성에 저장하는 대신 OpenClaw 비밀 런타임에서 Twilio Auth Token을 확인하도록 하려면 이를 사용합니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

참조된 환경 변수 또는 비밀 공급자는 Gateway 런타임에서 접근할 수 있어야 합니다. 호스트 환경 변수를 변경한 후에는 관리형 Gateway 프로세스를 다시 시작합니다.

### Messaging Service 발신자

Twilio가 Messaging Service를 통해 발신자를 선택하도록 하려면 `fromNumber` 대신 `messagingServiceSid`을 사용합니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

구성 및 환경 변수 확인 후 `fromNumber`와 `messagingServiceSid`이 모두 있으면 `fromNumber`이 사용됩니다.

### 기본 아웃바운드 대상

전송 흐름에서 명시적 대상을 생략했을 때 자동화 또는 에이전트가 시작한 전송에 기본 목적지가 필요하면 `defaultTo`을 설정합니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## 액세스 제어

`channels.sms.dmPolicy`은 다이렉트 SMS 액세스를 제어합니다.

- `pairing`(기본값): 알 수 없는 발신자에게 페어링 코드가 제공됩니다. `openclaw pairing approve sms <CODE>`로 승인합니다.
- `allowlist`: `allowFrom`에 있는 발신자만 처리됩니다. `allowFrom`이 비어 있으면 모든 발신자가 거부됩니다(Gateway가 시작 경고를 기록합니다).
- `open`: 구성 검증 시 `allowFrom`에 `"*"`이 포함되어야 합니다. 와일드카드가 없으면 나열된 번호만 채팅할 수 있습니다.
- `disabled`: 모든 인바운드 DM이 삭제됩니다.

`allowFrom` 항목은 `+15551234567`과 같은 E.164 전화번호여야 합니다. `sms:` 및 `twilio-sms:` 접두사가 허용되며 정규화됩니다. 비공개 어시스턴트에는 명시적인 전화번호와 함께 `dmPolicy: "allowlist"`을 사용하는 것이 좋습니다.

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## SMS 전송

SMS 채널을 선택하면 대상에 일반 E.164 번호 또는 `sms:` 접두사를 사용할 수 있습니다.

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

채널 선택이 암시적인 경우 `twilio-sms:` 접두사는 이 채널을 선택하되, iMessage가 자체 대상에 대해 이동통신사 SMS 전송을 선택하는 데 사용하는 `sms:` 서비스 접두사를 대신 사용하지 않습니다.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI에는 명시적인 `--target`이 필요합니다. `defaultTo`은 채널 구성에서 대상을 확인할 수 있는 자동화 및 에이전트가 시작한 전송 경로에 사용됩니다.

수신 SMS 대화에 대한 에이전트 응답은 구성된 Twilio 발신자를 통해 자동으로 발신자에게 다시 전송됩니다.

SMS 출력은 일반 텍스트입니다. OpenClaw는 마크다운을 제거하고, 펜스 코드 블록을 평탄화하며, 링크를 `label (url)`(으)로 다시 작성하고, 긴 응답을 Twilio를 통해 전송하기 전에 최대 `textChunkLimit`자(기본값 1500)의 청크로 분할합니다.

## 설정 확인

Gateway가 시작된 후:

1. Gateway 로그에 SMS Webhook 경로가 표시되는지 확인하십시오.
2. Twilio 측 프로브를 실행하십시오(구성된 Twilio Webhook URL/메서드와 최근 수신 오류를 확인합니다).

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 휴대전화에서 Twilio 번호로 SMS를 보내십시오.
4. `openclaw pairing list sms`을(를) 실행하십시오.
5. `openclaw pairing approve sms <CODE>`을(를) 사용하여 페어링 코드를 승인하십시오.
6. SMS를 하나 더 보내고 에이전트가 응답하는지 확인하십시오.

발신 전용 테스트에는 다음을 사용하십시오.

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS 테스트"
```

### macOS iMessage/SMS에서 엔드투엔드 테스트

Messages를 통해 이동통신사 SMS를 보낼 수 있는 Mac에서는 휴대전화를 직접 조작하지 않고 `imsg`을(를) 사용하여 발신 측을 구동할 수 있습니다.

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "SMS pong이라고 정확히 응답하십시오" --json
```

첫 번째 메시지는 페어링 요청을 생성해야 합니다. 두 번째 메시지는 Twilio를 통해 에이전트 응답을 수신해야 합니다.

## Webhook 보안

기본적으로 OpenClaw는 `publicWebhookUrl` 및 `authToken`을(를) 사용하여 `X-Twilio-Signature`을(를) 검증합니다. `publicWebhookUrl`의 엔드포인트 부분을 스킴, 호스트, 경로 및 쿼리 문자열을 포함하여 Twilio에 구성된 URL과 바이트 단위로 정확히 일치시키십시오. Twilio의 요구 사항에 따라 OpenClaw는 서명 계산에서 Twilio [연결 재정의](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) 프래그먼트(`#...`)를 제외합니다.

Webhook 경로는 서명 검증과 별개로 다음 사항도 적용합니다.

- `POST`만 허용합니다.
- SMS 계정, Webhook 경로 및 확인된 클라이언트 주소별로 분당 300개 요청의 실패 요청 예산을 적용합니다. 모든 요청이 이 예산에 포함되지만, HTTP 429는 요청의 본문 구문 분석, Twilio 검증 또는 AccountSid 일치 확인이 실패한 후에만 적용됩니다.
- 해당 검사를 통과한 후 SMS 계정, Webhook 경로 및 확인된 클라이언트 주소별로 분당 30개의 승인된 콜백이라는 디스패치 가능 콜백 속도 제한을 적용합니다(초과 시 HTTP 429). 서명 검증이 비활성화된 경우 이 분당 30개 제한이 인증되지 않은 디스패치 상한입니다.
- 클라이언트 주소는 공유 Gateway의 신뢰할 수 있는 프록시 규칙을 통해 확인됩니다. `gateway.trustedProxies`에 Twilio 콜백을 전달하는 리버스 프록시가 포함된 경우 OpenClaw는 전달된 클라이언트 주소를 기준으로 이러한 제한을 적용하며, 그렇지 않으면 직접 소켓 주소를 사용합니다.
- 페이로드의 `AccountSid`은(는) 구성된 `accountSid`과(와) 일치해야 합니다(그렇지 않으면 HTTP 403).
- 재사용된 `MessageSid` 값은 10분 동안 중복 제거됩니다.
- 각 SMS 계정의 재전송 캐시는 최대 10,000개의 활성 메시지 SID를 보관합니다. 모든 슬롯이 활성 상태이면 해당 계정의 새 Webhook은 가장 오래된 슬롯이 만료될 때까지 HTTP 429와 `Retry-After` 헤더를 반환하며 안전하게 거부됩니다.
- 32 KB를 초과하는 요청 본문은 거부됩니다.

Twilio는 기본적으로 HTTP 429를 재시도하지 않으며 `Retry-After` 지원을 문서화하지도 않습니다. `#rp=4xx` 및 `#rp=all` 연결 재정의는 4xx 재시도를 사용하도록 설정하지만, Twilio는 전체 재시도 트랜잭션을 15초로 제한하므로 재전송 캐시 슬롯이 만료되기 전에 재시도가 종료될 수 있습니다. 다른 핸들러가 실패한 전송을 수신해야 하는 경우 대체 URL을 구성하십시오. 429는 신뢰할 수 있는 역압력이 아니라 안전 우선 거부로 취급하십시오.

로컬 터널 테스트에만 다음을 설정할 수 있습니다.

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

공개 Gateway에서는 서명 검증을 비활성화하지 마십시오.

## 다중 계정 구성

둘 이상의 Twilio 번호를 운영하는 경우 `accounts`을(를) 사용하십시오.

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

각 계정은 고유한 `webhookPath`을(를) 사용해야 합니다. Gateway는 경로가 이미 다른 계정에 속한 Webhook 경로의 등록을 거부합니다. `TWILIO_*`/`SMS_*` 환경 대체 값은 기본 계정에만 적용됩니다. 기본 계정을 변경하려면 `defaultAccount`을(를) 설정하십시오.

## 문제 해결

### Twilio가 403을 반환하거나 OpenClaw가 Webhook을 거부하는 경우

`publicWebhookUrl`이(가) 스킴, 호스트, 경로 및 쿼리 문자열을 포함하여 Twilio에 구성된 URL과 정확히 일치하는지 확인하십시오. Twilio는 공개 URL 문자열에 서명하므로 프록시 재작성과 대체 호스트 이름으로 인해 서명 검증이 실패할 수 있습니다.

`Invalid account`이(가) 포함된 403은 수신 페이로드의 `AccountSid`이(가) 구성된 `accountSid`과(와) 일치하지 않음을 의미합니다. Webhook이 해당 번호를 소유한 계정을 가리키는지 확인하십시오.

### 페어링 요청이 표시되지 않는 경우

Twilio 번호의 **Messaging** Webhook URL과 메서드를 확인하십시오. SMS Webhook URL을 가리키고 `POST`을(를) 사용해야 합니다. 또한 공개 인터넷 또는 터널을 통해 Gateway에 접근할 수 있는지 확인하십시오.

Twilio 메시지 로그에 오류 `11200`이(가) 표시되면 Twilio가 수신 SMS를 승인했지만 Webhook에 연결하지 못한 것입니다. 다음을 확인하십시오.

- Twilio의 **Messaging > A message comes in**이(가) `publicWebhookUrl`을(를) 가리킵니다.
- 메서드는 `POST`입니다.
- 터널 또는 리버스 프록시가 정확한 `webhookPath`을(를) 노출합니다. Tailscale Funnel의 경우 `tailscale funnel status`을(를) 실행하고 `/webhooks/sms`이(가) 나열되는지 확인하십시오.
- `publicWebhookUrl`은(는) Twilio가 전송하는 것과 동일한 스킴, 호스트, 경로 및 쿼리 문자열을 사용하므로 서명 검증에서 서명된 URL을 재현할 수 있습니다.

`openclaw channels status --channel sms --probe`은(는) 일치하지 않는 Twilio Webhook 설정과 최근 `11200` 오류를 모두 표시합니다.

### 발신 전송이 실패하는 경우

`accountSid`, `authToken` 및 `fromNumber` 또는 `messagingServiceSid` 중 하나가 확인되는지 점검하십시오. 평가판 Twilio 계정을 사용하는 경우 SMS를 발신하려면 먼저 Twilio에서 대상 번호를 인증해야 할 수 있습니다.

### 메시지가 도착하지만 에이전트가 응답하지 않는 경우

`dmPolicy` 및 `allowFrom`을(를) 확인하십시오. 기본 `pairing` 정책에서는 일반 에이전트 턴을 처리하기 전에 발신자가 승인되어야 합니다.
