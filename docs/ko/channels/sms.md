---
read_when:
    - Twilio를 통해 OpenClaw를 SMS에 연결하려고 합니다
    - SMS Webhook 또는 허용 목록 설정이 필요합니다
summary: Twilio SMS 채널 설정, 접근 제어 및 Webhook 구성
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:12:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw은 Twilio 전화번호 또는 Messaging Service를 통해 SMS를 받고 보낼 수 있습니다. Gateway는 인바운드 Webhook 경로를 등록하고, 기본적으로 Twilio 요청 서명을 검증하며, Twilio의 Messages API를 통해 응답을 다시 보냅니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    SMS의 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="Gateway 보안" icon="shield" href="/ko/gateway/security">
    Webhook 노출과 발신자 접근 제어를 검토하세요.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
</CardGroup>

## 시작하기 전에

필요한 항목:

- `openclaw plugins install @openclaw/sms`로 설치한 공식 SMS Plugin.
- SMS를 사용할 수 있는 전화번호가 있는 Twilio 계정 또는 Twilio Messaging Service.
- Twilio Account SID 및 Auth Token.
- OpenClaw Gateway에 도달하는 공개 HTTPS URL.
- 발신자 정책 선택: 개인 사용에는 `pairing`, 사전 승인된 전화번호에는 `allowlist`, 의도적으로 공개 SMS 접근을 제공할 때만 `open`.

번호가 두 기능을 모두 지원한다면 SMS와 음성 통화에 하나의 Twilio 번호를 사용하세요. Twilio에서 SMS Webhook과 음성 Webhook을 별도로 구성하세요. 이 페이지에서는 SMS Webhook만 다룹니다.

## 빠른 설정

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Twilio 발신자 생성 또는 선택">
    Twilio에서 **Phone Numbers > Manage > Active numbers**를 열고 SMS를 사용할 수 있는 번호를 선택합니다. 다음을 저장하세요.

    - Account SID, 예: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 발신자 전화번호, 예: `+15551234567`

    고정 발신자 번호 대신 Messaging Service를 사용한다면 Messaging Service SID를 저장하세요. 예: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="SMS 채널 구성">

다음을 `sms.patch.json5`로 저장하고 플레이스홀더를 변경하세요.

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

  <Step title="Twilio가 Gateway Webhook을 가리키도록 설정">
    Twilio 전화번호 설정에서 **Messaging**을 열고 **A message comes in**을 다음으로 설정합니다.

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST`를 사용하세요. 기본 로컬 경로는 `/webhooks/sms`입니다. 다른 경로가 필요하면 `channels.sms.webhookPath`를 변경하세요.

  </Step>

  <Step title="정확한 SMS Webhook 경로 노출">
    공개 URL은 SMS 경로를 Gateway 프로세스로 라우팅해야 합니다. 로컬 테스트에 Tailscale Funnel을 사용한다면 `/webhooks/sms`를 명시적으로 노출하세요.

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    음성 통화와 SMS는 별도의 Webhook 경로를 사용합니다. 같은 Twilio 번호가 둘 다 처리한다면 Twilio와 터널에 두 경로를 모두 구성해 두세요.

  </Step>

  <Step title="Gateway 시작 및 첫 발신자 승인">

```bash
openclaw gateway
```

Twilio 번호로 문자 메시지를 보냅니다. 첫 메시지는 페어링 요청을 생성합니다. 승인하세요.

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    페어링 코드는 1시간 후 만료됩니다.

  </Step>
</Steps>

## 구성 예시

### 구성 파일

채널 정의가 Gateway 구성과 함께 이동해야 할 때 구성 파일 설정을 사용하세요.

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

시크릿을 호스트 환경에서 가져오는 단일 계정 배포에는 env 설정을 사용하세요.

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

`TWILIO_SMS_FROM`은 `TWILIO_PHONE_NUMBER`의 별칭으로 허용됩니다. Twilio가 Messaging Service에서 발신자를 선택해야 할 때는 전화번호 발신자 대신 `TWILIO_MESSAGING_SERVICE_SID`를 사용하세요.

### SecretRef 인증 토큰

`authToken`은 SecretRef일 수 있습니다. 평문 구성을 저장하는 대신 Gateway가 OpenClaw 시크릿 런타임에서 Twilio Auth Token을 해석해야 할 때 사용하세요.

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

참조된 환경 변수 또는 시크릿 공급자는 Gateway 런타임에서 볼 수 있어야 합니다. 호스트 환경 변수를 변경한 후에는 관리형 Gateway 프로세스를 다시 시작하세요.

### 허용 목록 전용 개인 번호

알려진 전화번호만 에이전트와 대화할 수 있어야 할 때 `allowlist`를 사용하세요.

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

### Messaging Service 발신자

Twilio가 Messaging Service를 통해 발신자를 선택해야 할 때 `fromNumber` 대신 `messagingServiceSid`를 사용하세요.

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

구성과 env 해석 후 `fromNumber`와 `messagingServiceSid`가 모두 있으면 `fromNumber`가 사용됩니다.

### 기본 아웃바운드 대상

전송 흐름이 명시적 대상을 생략하는 경우 자동화 또는 에이전트가 시작한 전달에 기본 목적지가 있어야 한다면 `defaultTo`를 설정하세요.

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

## 접근 제어

`channels.sms.dmPolicy`는 직접 SMS 접근을 제어합니다.

- `pairing`(기본값)
- `allowlist`(`allowFrom`에 발신자가 하나 이상 필요)
- `open`(`allowFrom`에 `"*"` 포함 필요)
- `disabled`

`allowFrom` 항목은 `+15551234567` 같은 E.164 전화번호여야 합니다. `sms:` 접두사는 허용되며 정규화됩니다. 개인 비서에는 명시적 전화번호와 함께 `dmPolicy: "allowlist"`를 선호하세요.

## SMS 보내기

아웃바운드 SMS 대상은 SMS 채널을 선택한 상태에서 `sms:` 서비스 접두사를 사용합니다.

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

채널 선택이 암시적일 때는 `twilio-sms:+15551234567`이 iMessage에서 사용하는 기존 채널 소유 `sms:` 서비스 접두사를 넘겨받지 않고 이 채널을 선택합니다.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI에는 명시적 `--target`이 필요합니다. `defaultTo`는 채널 구성에서 대상을 해석할 수 있는 자동화 및 에이전트 시작 전달 경로용입니다.

인바운드 SMS 대화의 에이전트 응답은 구성된 Twilio 발신자를 통해 자동으로 발신자에게 돌아갑니다.

SMS 출력은 일반 텍스트입니다. OpenClaw은 마크다운을 제거하고, 펜스 코드 블록을 평탄화하며, 읽기 쉬운 링크를 보존하고, 긴 응답을 Twilio를 통해 보내기 전에 청크로 나눕니다.

## 설정 확인

Gateway가 시작된 후:

1. Gateway 로그에 SMS Webhook 경로가 표시되는지 확인합니다.
2. Twilio 측 프로브를 실행합니다.

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 휴대폰에서 Twilio 번호로 SMS를 보냅니다.
4. `openclaw pairing list sms`를 실행합니다.
5. `openclaw pairing approve sms <CODE>`로 페어링 코드를 승인합니다.
6. SMS를 하나 더 보내고 에이전트가 응답하는지 확인합니다.

아웃바운드 전용 테스트에는 다음을 사용하세요.

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS iMessage/SMS에서 엔드투엔드 테스트

Messages를 통해 통신사 SMS를 보낼 수 있는 Mac에서는 휴대폰을 만지지 않고 `imsg`로 발신자 측을 구동할 수 있습니다.

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

첫 메시지는 페어링 요청을 생성해야 합니다. 두 번째 메시지는 Twilio를 통해 에이전트 응답을 받아야 합니다.

## Webhook 보안

기본적으로 OpenClaw은 `publicWebhookUrl`과 `authToken`을 사용해 `X-Twilio-Signature`를 검증합니다. `publicWebhookUrl`은 스킴, 호스트, 경로, 쿼리 문자열을 포함해 Twilio에 구성된 URL과 바이트 단위로 일치하도록 유지하세요.

로컬 터널 테스트에서만 다음을 설정할 수 있습니다.

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

공개 Gateway에서는 비활성화된 서명 검증을 사용하지 마세요.

## 다중 계정 구성

두 개 이상의 Twilio 번호를 운영할 때 `accounts`를 사용하세요.

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

각 계정은 고유한 `webhookPath`를 사용해야 합니다.

## 문제 해결

### Twilio가 403을 반환하거나 OpenClaw이 Webhook을 거부함

`publicWebhookUrl`이 스킴, 호스트, 경로, 쿼리 문자열을 포함해 Twilio에 구성된 URL과 정확히 일치하는지 확인하세요. Twilio는 공개 URL 문자열에 서명하므로 프록시 재작성과 대체 호스트 이름은 서명 검증을 깨뜨릴 수 있습니다.

### 페어링 요청이 나타나지 않음

Twilio 번호의 **Messaging** Webhook URL과 메서드를 확인하세요. SMS Webhook URL을 가리키고 `POST`를 사용해야 합니다. 또한 Gateway가 공개 인터넷이나 터널을 통해 접근 가능한지 확인하세요.

Twilio 메시지 로그에 오류 `11200`이 표시되면 Twilio가 인바운드 SMS를 수락했지만 Webhook에 도달할 수 없었다는 뜻입니다. 다음을 확인하세요.

- Twilio **Messaging > A message comes in**이 `publicWebhookUrl`을 가리킵니다.
- 메서드는 `POST`입니다.
- 터널 또는 리버스 프록시가 정확한 `webhookPath`를 노출합니다. Tailscale Funnel의 경우 `tailscale funnel status`를 실행하고 `/webhooks/sms`가 목록에 있는지 확인하세요.
- 서명 검증이 서명된 URL을 재현할 수 있도록 `publicWebhookUrl`은 Twilio가 보내는 것과 동일한 스킴, 호스트, 경로, 쿼리 문자열을 사용합니다.

### 아웃바운드 전송 실패

`accountSid`, `authToken`, 그리고 `fromNumber` 또는 `messagingServiceSid` 중 하나가 해석되는지 확인하세요. Twilio 평가판 계정을 사용하는 경우 아웃바운드 SMS를 보내기 전에 Twilio에서 목적지 번호를 확인해야 할 수 있습니다.

### 메시지는 도착하지만 에이전트가 응답하지 않음

`dmPolicy`와 `allowFrom`을 확인하세요. 기본 `pairing` 정책에서는 일반 에이전트 턴이 처리되기 전에 발신자가 승인되어야 합니다.
