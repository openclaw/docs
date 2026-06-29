---
read_when:
    - OpenClaw를 LINE에 연결하려고 합니다
    - LINE Webhook 및 자격 증명을 설정해야 합니다
    - LINE에 특화된 메시지 매개변수가 필요합니다
summary: LINE Messaging API Plugin 설정, 구성 및 사용
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. Plugin은 Gateway의 Webhook 수신기로
동작하며, 인증에 채널 액세스 토큰과 채널 시크릿을 사용합니다.

상태: 로드 가능한 Plugin. 개인 메시지, 그룹 채팅, 미디어, 위치, Flex
messages, 템플릿 메시지, 빠른 답장을 지원합니다. 반응과 스레드는
지원되지 않습니다.

## 설치

채널을 설정하기 전에 LINE을 설치하세요.

```bash
openclaw plugins install @openclaw/line
```

로컬 작업 복사본(git 리포지토리에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 설정

1. LINE Developers 계정을 만들고 Console을 여세요.
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택한 뒤 **Messaging API** 채널을 추가하세요.
3. 채널 설정에서 **Channel access token**과 **Channel secret**을 복사하세요.
4. Messaging API 설정에서 **Use webhook**을 켜세요.
5. Gateway 엔드포인트의 Webhook URL을 설정하세요(HTTPS 필요).

```
https://gateway-host/line/webhook
```

Gateway는 LINE의 Webhook 확인(GET)에 응답하고, 서명된
수신 이벤트(POST)는 서명과 페이로드를 확인한 직후 승인합니다. 에이전트
처리는 비동기적으로 계속됩니다.
사용자 지정 경로가 필요하면 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 URL도 그에 맞게 업데이트하세요.

보안 참고 사항:

- LINE 서명 확인은 요청 본문에 의존하므로(원시 본문에 대한 HMAC) OpenClaw는 확인 전에 엄격한 본문 크기 제한과 인증 전 제한 시간을 적용합니다.
- OpenClaw는 검증된 요청의 원시 바이트에서 Webhook 이벤트를 처리합니다. 상위 미들웨어에서 변환된 `req.body` 값은 서명 무결성을 유지하기 위해 무시됩니다.

## 구성

최소 구성:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

열린 개인 메시지 구성:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

환경 변수(기본 계정만 해당):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

토큰/시크릿 파일:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile`과 `secretFile`은 일반 파일을 가리켜야 합니다. 심볼릭 링크는 거부됩니다.

여러 계정:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 액세스 제어

개인 메시지는 기본적으로 페어링이 필요합니다. 알 수 없는 발신자는 페어링 코드를 받으며,
승인 전까지 메시지는 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

허용 목록과 정책:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: 개인 메시지에 허용된 LINE 사용자 ID입니다. `dmPolicy: "open"`에는 `["*"]`가 필요합니다.
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 그룹에 허용된 LINE 사용자 ID
- 개별 그룹 재정의: `channels.line.groups.<groupId>.allowFrom`
- 정적 발신자 액세스 그룹은 `allowFrom`, `groupAllowFrom`, 그룹 `allowFrom`에서 `accessGroup:<name>`으로 참조할 수 있습니다.
- 런타임 참고: `channels.line`이 완전히 없으면 런타임은 그룹 확인에 대해 `groupPolicy="allowlist"`로 되돌아갑니다(`channels.defaults.groupPolicy`가 설정되어 있어도 동일).

LINE ID는 대소문자를 구분합니다. 유효한 ID 형식은 다음과 같습니다.

- 사용자: `U` + 32개의 16진수 문자
- 그룹: `C` + 32개의 16진수 문자
- 방: `R` + 32개의 16진수 문자

## 메시지 동작

- 텍스트는 5000자 단위로 분할됩니다.
- Markdown 서식은 제거됩니다. 코드 블록과 표는 가능한 경우 Flex
  cards로 변환됩니다.
- 스트리밍 응답은 버퍼링됩니다. 에이전트가 작업하는 동안 LINE은 로딩 애니메이션과 함께
  완성된 조각을 받습니다.
- 미디어 다운로드는 `channels.line.mediaMaxMb`로 제한됩니다(기본값 10).
- 수신 미디어는 에이전트에 전달되기 전에 `~/.openclaw/media/inbound/`에
  저장됩니다. 이는 다른 기본 제공 채널 Plugin에서 사용하는 공통 미디어 저장소와
  일치합니다.

## 채널 데이터(확장 메시지)

빠른 답장, 위치, Flex cards 또는 템플릿 메시지를 보내려면 `channelData.line`을 사용하세요.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin에는 Flex messages 프리셋용 `/card` 명령도 함께 제공됩니다.

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 지원

LINE은 ACP(Agent Communication Protocol) 대화 바인딩을 지원합니다.

- `/acp spawn <agent> --bind here`는 하위 스레드를 만들지 않고 현재 LINE 채팅을 ACP 세션에 바인딩합니다.
- 구성된 ACP 바인딩과 대화에 바인딩된 활성 ACP 세션은 다른 대화 채널에서와 동일하게 LINE에서 작동합니다.

자세한 내용은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 발신 미디어

LINE Plugin은 에이전트 메시지 도구를 통한 이미지, 동영상, 오디오 파일 전송을 지원합니다. 미디어는 적절한 미리보기 처리와 추적을 포함하는 LINE 전용 전달 경로를 통해 전송됩니다.

- **이미지**: 자동 미리보기 생성을 포함한 LINE 이미지 메시지로 전송됩니다.
- **동영상**: 명시적인 미리보기와 콘텐츠 유형 처리를 포함해 전송됩니다.
- **오디오**: LINE 오디오 메시지로 전송됩니다.

발신 미디어 URL은 공개 HTTPS URL이어야 합니다. OpenClaw는 URL을 LINE에 전달하기 전에 대상 호스트 이름을 확인하고 local loopback, link-local, 사설 네트워크 대상을 거부합니다.

일반 미디어 전송은 LINE 전용 경로를 사용할 수 없을 때 기존 이미지 전용 경로로 돌아갑니다.

## 문제 해결

- **Webhook 확인 실패:** Webhook URL이 HTTPS를 사용하고
  `channelSecret`이 LINE Console과 일치하는지 확인하세요.
- **수신 이벤트 없음:** Webhook 경로가 `channels.line.webhookPath`와 일치하고
  LINE에서 Gateway에 접근할 수 있는지 확인하세요.
- **미디어 다운로드 오류:** 미디어가 기본 제한을 초과하는 경우
  `channels.line.mediaMaxMb`를 늘리세요.

## 참고 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — 개인 메시지 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) — 메시지 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 보안 강화
