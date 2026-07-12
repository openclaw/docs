---
read_when:
    - OpenClaw을 LINE에 연결하려고 합니다
    - LINE Webhook 및 자격 증명 설정이 필요합니다
    - LINE 전용 메시지 옵션을 사용하려는 경우
summary: LINE Messaging API Plugin 설정, 구성 및 사용법
title: LINE
x-i18n:
    generated_at: "2026-07-12T00:34:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. Plugin은 Gateway에서 Webhook
수신기로 실행되며, 인증에 채널 액세스 토큰과 채널 시크릿을 사용합니다.

상태: 별도로 설치하는 공식 Plugin입니다. 다이렉트 메시지, 그룹 채팅, 미디어,
위치, Flex 메시지, 템플릿 메시지, 빠른 답장을 지원합니다.
반응과 스레드는 지원하지 않습니다.

## 설치

채널을 구성하기 전에 LINE을 설치합니다.

```bash
openclaw plugins install @openclaw/line
```

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 설정

1. LINE Developers 계정을 만들고 Console을 엽니다.
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택한 후 **Messaging API** 채널을 추가합니다.
3. 채널 설정에서 **Channel access token**과 **Channel secret**을 복사합니다.
4. Messaging API 설정에서 **Use webhook**을 활성화합니다.
5. Webhook URL을 Gateway 엔드포인트로 설정합니다(HTTPS 필수).

```text
https://gateway-host/line/webhook
```

Gateway는 LINE의 Webhook 검증(GET)에 응답하며, 서명과 페이로드를 검증한 직후 서명된
인바운드 이벤트(POST)를 즉시 확인 처리합니다. 에이전트 처리는 비동기적으로 계속됩니다.
사용자 지정 경로가 필요한 경우 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 URL도 그에 맞게 업데이트합니다.

보안 참고 사항:

- LINE 서명 검증은 본문에 의존하므로(원시 본문에 대한 HMAC), OpenClaw는 검증 전에 엄격한 인증 전 본문 제한(64KB)과 읽기 시간 제한을 적용합니다.
- OpenClaw는 검증된 원시 요청 바이트로 Webhook 이벤트를 처리합니다. 서명 무결성을 보호하기 위해 업스트림 미들웨어가 변환한 `req.body` 값은 무시됩니다.

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

공개 DM 구성:

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

환경 변수(기본 계정에만 적용):

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
인라인 구성 값이 파일보다 우선하며, 환경 변수는 기본 계정의 마지막 대체 수단입니다.

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

## 접근 제어

다이렉트 메시지에는 기본적으로 페어링이 적용됩니다. 알 수 없는 발신자는 페어링 코드를 받으며,
승인될 때까지 해당 메시지는 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

허용 목록과 정책:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`(기본값 `pairing`)
- `channels.line.allowFrom`: DM에 허용된 LINE 사용자 ID입니다. `dmPolicy: "open"`에는 `["*"]`가 필요합니다.
- `channels.line.groupPolicy`: `allowlist | open | disabled`(기본값 `allowlist`)
- `channels.line.groupAllowFrom`: 그룹에 허용된 LINE 사용자 ID
- 그룹별 재정의: `channels.line.groups.<groupId>.allowFrom`(`enabled`, `requireMention`, `systemPrompt`, `skills`도 포함)
- 정적 발신자 접근 그룹은 `allowFrom`, `groupAllowFrom`, 그룹별 `allowFrom`에서 `accessGroup:<name>`으로 참조할 수 있습니다. [접근 그룹](/ko/channels/access-groups)을 참조하세요.
- 런타임 참고 사항: `channels.line`이 완전히 누락된 경우, `channels.defaults.groupPolicy`가 설정되어 있어도 런타임은 그룹 검사에 `groupPolicy="allowlist"`를 사용합니다.

LINE ID는 대소문자를 구분합니다. 유효한 ID 형식은 다음과 같습니다.

- 사용자: `U` + 32자의 16진수 문자
- 그룹: `C` + 32자의 16진수 문자
- 방: `R` + 32자의 16진수 문자

## 메시지 동작

- 텍스트는 5,000자 단위로 분할됩니다.
- Markdown 서식은 제거되며, 가능한 경우 코드 블록과 표는 Flex
  카드로 변환됩니다.
- 스트리밍 응답은 버퍼링됩니다. 에이전트가 작업하는 동안 LINE에는 로딩
  애니메이션과 함께 완성된 청크가 전송됩니다.
- 미디어 다운로드는 `channels.line.mediaMaxMb`로 제한됩니다(기본값 10).
- 인바운드 미디어는 에이전트에 전달되기 전에 `~/.openclaw/media/inbound/`에
  저장되며, 다른 채널 Plugin에서 사용하는 공유 미디어 저장소와 동일합니다.

## 채널 데이터(리치 메시지)

빠른 답장, 위치, Flex 카드 또는 템플릿 메시지를 보내려면 `channelData.line`을
사용합니다.

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
        contents: {/* Flex payload */},
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

LINE Plugin은 Flex 메시지 프리셋용 `/card` 명령도 제공합니다.

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP 지원

LINE은 ACP(에이전트 통신 프로토콜) 대화 바인딩을 지원합니다.

- `/acp spawn <agent> --bind here`는 하위 스레드를 만들지 않고 현재 LINE 채팅을 ACP 세션에 바인딩합니다.
- 구성된 ACP 바인딩과 활성 상태인 대화 바인딩 ACP 세션은 다른 대화 채널과 마찬가지로 LINE에서도 작동합니다.

자세한 내용은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 아웃바운드 미디어

LINE Plugin은 에이전트 메시지 도구를 통해 이미지, 동영상, 오디오를 전송합니다.

- **이미지**: LINE 이미지 메시지로 전송됩니다. 미리보기 이미지는 기본적으로 미디어 URL을 사용합니다.
- **동영상**: 미리보기 이미지가 필요합니다. `channelData.line.previewImageUrl`을 이미지 URL로 설정합니다.
- **오디오**: LINE 오디오 메시지로 전송됩니다. `channelData.line.durationMs`를 설정하지 않으면 재생 시간은 기본적으로 60초입니다.

설정된 경우 미디어 종류는 `channelData.line.mediaKind`에서 가져옵니다. 그렇지 않으면
다른 LINE 옵션이나 URL 파일 확장자에서 추론하며, 이미지가 대체값으로 사용됩니다.

아웃바운드 미디어 URL은 최대 2,000자의 공개 HTTPS URL이어야 합니다. OpenClaw는
URL을 LINE에 전달하기 전에 대상 호스트 이름을 검증하고 local loopback,
링크 로컬 및 사설 네트워크 대상을 거부합니다.

LINE 전용 옵션이 없는 일반 미디어 전송은 이미지 경로를 사용합니다.

## 문제 해결

- **Webhook 검증 실패:** Webhook URL이 HTTPS인지, `channelSecret`이 LINE Console과 일치하는지 확인합니다.
- **인바운드 이벤트 없음:** Webhook 경로가 `channels.line.webhookPath`와 일치하고
  LINE에서 Gateway에 접근할 수 있는지 확인합니다.
- **미디어 다운로드 오류:** 미디어가 기본 제한을 초과하는 경우 `channels.line.mediaMaxMb`를 높입니다.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 보안 강화
