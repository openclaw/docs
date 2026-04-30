---
read_when:
    - OpenClaw를 LINE에 연결하려고 합니다
    - LINE Webhook + 자격 증명 설정이 필요합니다
    - LINE 전용 메시지 옵션이 필요한 경우
summary: LINE Messaging API Plugin 설정, 구성 및 사용법
title: LINE
x-i18n:
    generated_at: "2026-04-30T06:18:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. Plugin은 Gateway에서 Webhook
수신기로 실행되며 인증에 채널 액세스 토큰 + 채널 시크릿을 사용합니다.

상태: 번들 Plugin. 다이렉트 메시지, 그룹 채팅, 미디어, 위치, Flex
메시지, 템플릿 메시지, 빠른 답장을 지원합니다. 반응과 스레드는
지원하지 않습니다.

## 번들 Plugin

LINE은 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로 일반적인
패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드나 LINE을 제외한 사용자 지정 설치를 사용 중이라면, 게시된 경우
최신 npm 패키지를 설치하세요.

```bash
openclaw plugins install @openclaw/line
```

npm이 OpenClaw 소유 패키지를 더 이상 사용되지 않음 또는 누락으로 보고하면,
npm 패키지 배포 흐름이 따라잡을 때까지 최신 패키지 OpenClaw 빌드나 로컬 체크아웃을 사용하세요.

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 설정

1. LINE Developers 계정을 만들고 Console을 엽니다:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택하고 **Messaging API** 채널을 추가합니다.
3. 채널 설정에서 **Channel access token**과 **Channel secret**을 복사합니다.
4. Messaging API 설정에서 **Use webhook**을 활성화합니다.
5. Webhook URL을 Gateway 엔드포인트로 설정합니다(HTTPS 필요):

```
https://gateway-host/line/webhook
```

Gateway는 LINE의 Webhook 검증(GET)과 수신 이벤트(POST)에 응답합니다.
사용자 지정 경로가 필요하면 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 그에 맞게 URL을 업데이트하세요.

보안 참고:

- LINE 서명 검증은 본문에 의존하므로(원시 본문에 대한 HMAC), OpenClaw는 검증 전에 엄격한 사전 인증 본문 제한과 타임아웃을 적용합니다.
- OpenClaw는 검증된 원시 요청 바이트에서 Webhook 이벤트를 처리합니다. 업스트림 미들웨어가 변환한 `req.body` 값은 서명 무결성 안전을 위해 무시됩니다.

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

환경 변수(기본 계정만):

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

다이렉트 메시지는 기본적으로 페어링을 사용합니다. 알 수 없는 발신자는 페어링 코드를 받고,
승인될 때까지 해당 메시지는 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

허용 목록과 정책:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM에 허용된 LINE 사용자 ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 그룹에 허용된 LINE 사용자 ID
- 그룹별 재정의: `channels.line.groups.<groupId>.allowFrom`
- 런타임 참고: `channels.line`이 완전히 없으면, 런타임은 그룹 검사에 대해 `groupPolicy="allowlist"`로 대체됩니다(`channels.defaults.groupPolicy`가 설정되어 있더라도).

LINE ID는 대소문자를 구분합니다. 유효한 ID는 다음과 같습니다.

- 사용자: `U` + 32개의 16진수 문자
- 그룹: `C` + 32개의 16진수 문자
- 룸: `R` + 32개의 16진수 문자

## 메시지 동작

- 텍스트는 5000자 단위로 분할됩니다.
- Markdown 서식은 제거되며, 가능하면 코드 블록과 표는 Flex
  카드로 변환됩니다.
- 스트리밍 응답은 버퍼링됩니다. 에이전트가 작업하는 동안 LINE은 로딩
  애니메이션과 함께 전체 청크를 받습니다.
- 미디어 다운로드는 `channels.line.mediaMaxMb`로 제한됩니다(기본값 10).
- 수신 미디어는 에이전트에 전달되기 전에 `~/.openclaw/media/inbound/` 아래에 저장되며,
  다른 번들 채널 Plugin이 사용하는 공유 미디어 저장소와 일치합니다.

## 채널 데이터(리치 메시지)

`channelData.line`을 사용해 빠른 답장, 위치, Flex 카드 또는 템플릿
메시지를 보냅니다.

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

LINE Plugin은 Flex 메시지 프리셋용 `/card` 명령도 함께 제공합니다.

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 지원

LINE은 ACP(Agent Communication Protocol) 대화 바인딩을 지원합니다.

- `/acp spawn <agent> --bind here`는 하위 스레드를 만들지 않고 현재 LINE 채팅을 ACP 세션에 바인딩합니다.
- 구성된 ACP 바인딩과 활성 대화 바인딩 ACP 세션은 다른 대화 채널처럼 LINE에서 작동합니다.

자세한 내용은 [ACP 에이전트](/ko/tools/acp-agents)를 참고하세요.

## 발신 미디어

LINE Plugin은 에이전트 메시지 도구를 통해 이미지, 비디오, 오디오 파일 전송을 지원합니다. 미디어는 적절한 미리보기와 추적 처리를 포함한 LINE 전용 전달 경로를 통해 전송됩니다.

- **이미지**: 자동 미리보기 생성과 함께 LINE 이미지 메시지로 전송됩니다.
- **비디오**: 명시적인 미리보기와 콘텐츠 유형 처리와 함께 전송됩니다.
- **오디오**: LINE 오디오 메시지로 전송됩니다.

발신 미디어 URL은 공개 HTTPS URL이어야 합니다. OpenClaw는 URL을 LINE에 넘기기 전에 대상 호스트 이름을 검증하며 loopback, link-local, 사설 네트워크 대상을 거부합니다.

일반 미디어 전송은 LINE 전용 경로를 사용할 수 없을 때 기존 이미지 전용 라우트로 대체됩니다.

## 문제 해결

- **Webhook 검증 실패:** Webhook URL이 HTTPS이고
  `channelSecret`이 LINE Console과 일치하는지 확인하세요.
- **수신 이벤트 없음:** Webhook 경로가 `channels.line.webhookPath`와 일치하고
  Gateway가 LINE에서 도달 가능한지 확인하세요.
- **미디어 다운로드 오류:** 미디어가 기본 제한을 초과하면
  `channels.line.mediaMaxMb`를 높이세요.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증과 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작과 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델과 강화
