---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은편지함 라우팅 작업
summary: WhatsApp 채널 지원, 접근 제어, 전송 동작 및 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T06:20:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

상태: WhatsApp Web(Baileys)을 통해 프로덕션 준비 완료. Gateway가 연결된 세션을 소유합니다.

## 설치(온디맨드)

- 온보딩(`openclaw onboard`)과 `openclaw channels add --channel whatsapp`는
  처음 선택할 때 WhatsApp Plugin 설치를 안내합니다.
- `openclaw channels login --channel whatsapp`도 Plugin이 아직 없으면
  설치 흐름을 제공합니다.
- 개발 채널 + git 체크아웃: 기본값은 로컬 Plugin 경로입니다.
- Stable/Beta: 현재 패키지가 게시되어 있으면 npm 패키지 `@openclaw/whatsapp`를 사용합니다.

수동 설치도 계속 사용할 수 있습니다.

```bash
openclaw plugins install @openclaw/whatsapp
```

npm이 OpenClaw 소유 패키지를 deprecated 또는 누락으로 보고하면, npm 패키지 트레인이
따라잡을 때까지 현재 패키징된 OpenClaw 빌드나 로컬 체크아웃을 사용하세요.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ko/channels/pairing">
    기본 DM 정책은 알 수 없는 발신자에 대해 페어링입니다.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    특정 계정의 경우:

```bash
openclaw channels login --channel whatsapp --account work
```

    로그인 전에 기존/사용자 지정 WhatsApp Web 인증 디렉터리를 연결하려면:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    페어링 요청은 1시간 후 만료됩니다. 대기 중인 요청은 채널당 3개로 제한됩니다.

  </Step>
</Steps>

<Note>
OpenClaw는 가능하면 WhatsApp을 별도 번호에서 실행하는 것을 권장합니다. (채널 메타데이터와 설정 흐름은 해당 설정에 최적화되어 있지만, 개인 번호 설정도 지원됩니다.)
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    가장 깔끔한 운영 모드입니다.

    - OpenClaw용 별도 WhatsApp ID
    - 더 명확한 DM allowlist와 라우팅 경계
    - 자기 채팅 혼동 가능성 감소

    최소 정책 패턴:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    온보딩은 개인 번호 모드를 지원하며 자기 채팅 친화적인 기준 구성을 작성합니다.

    - `dmPolicy: "allowlist"`
    - `allowFrom`에 개인 번호 포함
    - `selfChatMode: true`

    런타임에서 자기 채팅 보호는 연결된 자기 번호와 `allowFrom`을 기준으로 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    현재 OpenClaw 채널 아키텍처에서 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    내장 채팅 채널 레지스트리에는 별도의 Twilio WhatsApp 메시징 채널이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 재연결 워치독은 인바운드 앱 메시지 양만이 아니라 WhatsApp Web 전송 활동을 사용하므로, 조용한 연결된 기기 세션은 최근에 아무도 메시지를 보내지 않았다는 이유만으로 재시작되지 않습니다. 더 긴 애플리케이션 무음 상한은 전송 프레임은 계속 도착하지만 워치독 창 동안 애플리케이션 메시지가 처리되지 않으면 여전히 재연결을 강제합니다. 최근 활성화된 세션의 일시적 재연결 후에는 해당 애플리케이션 무음 검사가 첫 복구 창에서 일반 메시지 타임아웃을 사용합니다.
- Baileys 소켓 타이밍은 `web.whatsapp.*` 아래에 명시됩니다. `keepAliveIntervalMs`는 WhatsApp Web 애플리케이션 핑을 제어하고, `connectTimeoutMs`는 오프닝 핸드셰이크 타임아웃을 제어하며, `defaultQueryTimeoutMs`는 Baileys 쿼리 타임아웃을 제어합니다.
- 아웃바운드 전송에는 대상 계정에 활성 WhatsApp 리스너가 필요합니다.
- 상태 및 브로드캐스트 채팅은 무시됩니다(`@status`, `@broadcast`).
- 재연결 워치독은 인바운드 앱 메시지 양만이 아니라 WhatsApp Web 전송 활동을 따릅니다. 전송 프레임이 계속되는 동안 조용한 연결된 기기 세션은 유지되지만, 전송 정지는 이후 원격 연결 해제 경로보다 훨씬 전에 재연결을 강제합니다.
- 직접 채팅은 DM 세션 규칙을 사용합니다(`session.dmScope`; 기본값 `main`은 DM을 에이전트 메인 세션으로 접습니다).
- 그룹 세션은 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web 전송은 Gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 소문자 변형)를 준수합니다. 채널별 WhatsApp 프록시 설정보다 호스트 수준 프록시 구성을 선호하세요.
- `messages.removeAckAfterReply`가 활성화되면 OpenClaw는 표시되는 답장이 전달된 후 WhatsApp ack 반응을 지웁니다.

## Plugin 훅과 개인정보 보호

WhatsApp 인바운드 메시지에는 개인 메시지 내용, 전화번호,
그룹 식별자, 발신자 이름, 세션 상관 필드가 포함될 수 있습니다. 이러한 이유로
WhatsApp은 명시적으로 옵트인하지 않는 한 인바운드 `message_received` 훅 페이로드를 Plugin에 브로드캐스트하지 않습니다.

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

옵트인은 한 계정으로 범위를 제한할 수 있습니다.

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

인바운드 WhatsApp 메시지 내용과 식별자를 수신하도록 신뢰하는 Plugin에 대해서만
이를 활성화하세요.

## 접근 제어 및 활성화

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy`는 직접 채팅 접근을 제어합니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `allowFrom`은 E.164 스타일 번호를 받습니다(내부적으로 정규화됨).

    다중 계정 재정의: `channels.whatsapp.accounts.<id>.dmPolicy`(및 `allowFrom`)는 해당 계정의 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부 정보:

    - 페어링은 채널 allow-store에 영구 저장되고 구성된 `allowFrom`과 병합됩니다
    - allowlist가 구성되지 않았으면 연결된 자기 번호가 기본적으로 허용됩니다
    - OpenClaw는 아웃바운드 `fromMe` DM(연결된 기기에서 자신에게 보내는 메시지)을 자동 페어링하지 않습니다

  </Tab>

  <Tab title="Group policy + allowlists">
    그룹 접근에는 두 계층이 있습니다.

    1. **그룹 멤버십 allowlist**(`channels.whatsapp.groups`)
       - `groups`가 생략되면 모든 그룹이 대상이 될 수 있습니다
       - `groups`가 있으면 그룹 allowlist로 작동합니다(`"*"` 허용)

    2. **그룹 발신자 정책**(`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 allowlist 우회
       - `allowlist`: 발신자가 `groupAllowFrom`(또는 `*`)과 일치해야 함
       - `disabled`: 모든 그룹 인바운드 차단

    발신자 allowlist 폴백:

    - `groupAllowFrom`이 설정되지 않았으면 런타임은 사용 가능한 경우 `allowFrom`으로 폴백합니다
    - 발신자 allowlist는 멘션/답장 활성화 전에 평가됩니다

    참고: `channels.whatsapp` 블록이 전혀 없으면 `channels.defaults.groupPolicy`가 설정되어 있더라도 런타임 그룹 정책 폴백은 `allowlist`입니다(경고 로그 포함).

  </Tab>

  <Tab title="Mentions + /activation">
    그룹 답장은 기본적으로 멘션이 필요합니다.

    멘션 감지는 다음을 포함합니다.

    - 봇 ID에 대한 명시적 WhatsApp 멘션
    - 구성된 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 승인된 그룹 메시지의 인바운드 음성 메모 전사
    - 암시적 봇 답장 감지(답장 발신자가 봇 ID와 일치)

    보안 참고:

    - 인용/답장은 멘션 게이팅만 충족합니다. 발신자 권한 부여를 부여하지는 **않습니다**
    - `groupPolicy: "allowlist"`에서는 allowlist에 없는 발신자가 allowlist에 있는 사용자의 메시지에 답장하더라도 여전히 차단됩니다

    세션 수준 활성화 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 세션 상태를 업데이트합니다(전역 구성 아님). 소유자 게이트가 적용됩니다.

  </Tab>
</Tabs>

## 개인 번호 및 자기 채팅 동작

연결된 자기 번호가 `allowFrom`에도 있으면 WhatsApp 자기 채팅 보호가 활성화됩니다.

- 자기 채팅 턴에 대해 읽음 확인 건너뛰기
- 그렇지 않으면 자신에게 핑을 보낼 mention-JID 자동 트리거 동작 무시
- `messages.responsePrefix`가 설정되지 않았으면 자기 채팅 답장은 기본적으로 `[{identity.name}]` 또는 `[openclaw]`를 사용합니다

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    수신 WhatsApp 메시지는 공유 인바운드 envelope로 래핑됩니다.

    인용 답장이 있으면 컨텍스트가 다음 형식으로 추가됩니다.

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    답장 메타데이터 필드도 사용 가능한 경우 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 발신자 JID/E.164).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    미디어 전용 인바운드 메시지는 다음과 같은 플레이스홀더로 정규화됩니다.

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    승인된 그룹 음성 메모는 본문이 `<media:audio>`뿐인 경우 멘션 게이팅 전에 전사되므로,
    음성 메모에서 봇 멘션을 말하면 답장을 트리거할 수 있습니다. 전사문에도 여전히 봇 멘션이 없으면,
    원시 플레이스홀더 대신 전사문이 대기 중인 그룹 기록에 유지됩니다.

    위치 본문은 간결한 좌표 텍스트를 사용합니다. 위치 레이블/댓글 및 연락처/vCard 세부 정보는 인라인 프롬프트 텍스트가 아니라 펜스 처리된 신뢰할 수 없는 메타데이터로 렌더링됩니다.

  </Accordion>

  <Accordion title="Pending group history injection">
    그룹에서는 처리되지 않은 메시지를 버퍼링했다가 봇이 마침내 트리거될 때 컨텍스트로 주입할 수 있습니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`
    - 폴백: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    주입 마커:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    읽음 확인은 수락된 인바운드 WhatsApp 메시지에 대해 기본적으로 활성화됩니다.

    전역 비활성화:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    계정별 재정의:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    자기 채팅 턴은 전역적으로 활성화되어 있어도 읽음 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전달, 청킹 및 미디어

<AccordionGroup>
  <Accordion title="Text chunking">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 단락 경계(빈 줄)를 선호한 다음, 길이 안전 청킹으로 폴백합니다

  </Accordion>

  <Accordion title="아웃바운드 미디어 동작">
    - 이미지, 동영상, 오디오(PTT 음성 메모), 문서 페이로드를 지원합니다
    - 오디오 미디어는 `ptt: true`와 함께 Baileys `audio` 페이로드를 통해 전송되므로 WhatsApp 클라이언트가 이를 푸시투토크 음성 메모로 렌더링합니다
    - 응답 페이로드는 `audioAsVoice`를 보존합니다. WhatsApp용 TTS 음성 메모 출력은 제공자가 MP3 또는 WebM을 반환하더라도 이 PTT 경로를 유지합니다
    - 네이티브 Ogg/Opus 오디오는 음성 메모 호환성을 위해 `audio/ogg; codecs=opus`로 전송됩니다
    - Microsoft Edge TTS MP3/WebM 출력을 포함한 비 Ogg 오디오는 PTT 전달 전에 `ffmpeg`로 48 kHz 모노 Ogg/Opus로 트랜스코딩됩니다
    - `/tts latest`는 최신 assistant 응답을 하나의 음성 메모로 보내고 같은 응답에 대한 반복 전송을 억제합니다. `/tts chat on|off|default`는 현재 WhatsApp 채팅의 자동 TTS를 제어합니다
    - 동영상 전송 시 `gifPlayback: true`를 통해 애니메이션 GIF 재생이 지원됩니다
    - 여러 미디어 응답 페이로드를 보낼 때 캡션은 첫 번째 미디어 항목에 적용됩니다. 단, PTT 음성 메모는 WhatsApp 클라이언트가 음성 메모 캡션을 일관되게 렌더링하지 않으므로 오디오를 먼저 보내고 보이는 텍스트를 별도로 보냅니다
    - 미디어 소스는 HTTP(S), `file://`, 또는 로컬 경로일 수 있습니다

  </Accordion>

  <Accordion title="미디어 크기 제한 및 폴백 동작">
    - 인바운드 미디어 저장 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 아웃바운드 미디어 전송 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 계정별 재정의는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`를 사용합니다
    - 이미지는 제한에 맞도록 자동 최적화됩니다(크기 조정/품질 스윕)
    - 미디어 전송 실패 시 첫 번째 항목 폴백은 응답을 조용히 누락하는 대신 텍스트 경고를 보냅니다

  </Accordion>
</AccordionGroup>

## 응답 인용

WhatsApp은 아웃바운드 응답이 인바운드 메시지를 눈에 보이게 인용하는 네이티브 응답 인용을 지원합니다. `channels.whatsapp.replyToMode`로 제어합니다.

| 값          | 동작                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 인용하지 않고 일반 메시지로 보냅니다                                  |
| `"first"`   | 첫 번째 아웃바운드 응답 청크만 인용합니다                             |
| `"all"`     | 모든 아웃바운드 응답 청크를 인용합니다                                |
| `"batched"` | 즉시 응답은 인용하지 않고, 대기열에 있는 배치 응답을 인용합니다       |

기본값은 `"off"`입니다. 계정별 재정의는 `channels.whatsapp.accounts.<id>.replyToMode`를 사용합니다.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## 반응 수준

`channels.whatsapp.reactionLevel`은 agent가 WhatsApp에서 이모지 반응을 얼마나 넓게 사용할지 제어합니다.

| 수준          | 확인 반응 | agent 시작 반응       | 설명                                      |
| ------------- | --------- | --------------------- | ----------------------------------------- |
| `"off"`       | 아니요    | 아니요                | 반응 없음                                 |
| `"ack"`       | 예        | 아니요                | 확인 반응만 사용(응답 전 수신 확인)       |
| `"minimal"`   | 예        | 예(보수적)            | 확인 + 보수적 지침의 agent 반응           |
| `"extensive"` | 예        | 예(권장)              | 확인 + 권장 지침의 agent 반응             |

기본값: `"minimal"`.

계정별 재정의는 `channels.whatsapp.accounts.<id>.reactionLevel`을 사용합니다.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 확인 반응

WhatsApp은 `channels.whatsapp.ackReaction`을 통해 인바운드 수신 시 즉시 확인 반응을 지원합니다.
확인 반응은 `reactionLevel`에 의해 제한됩니다. `reactionLevel`이 `"off"`이면 억제됩니다.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

동작 참고 사항:

- 인바운드가 수락된 직후(응답 전) 전송됩니다
- 실패는 로그에 기록되지만 일반 응답 전달을 차단하지 않습니다
- 그룹 모드 `mentions`는 멘션으로 트리거된 턴에 반응합니다. 그룹 활성화 `always`는 이 검사에 대한 우회로 동작합니다
- WhatsApp은 `channels.whatsapp.ackReaction`을 사용합니다(레거시 `messages.ackReaction`은 여기에서 사용되지 않습니다)

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="계정 선택 및 기본값">
    - 계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다
    - 기본 계정 선택: `default`가 있으면 사용하고, 없으면 구성된 첫 번째 계정 ID(정렬됨)를 사용합니다
    - 계정 ID는 조회를 위해 내부적으로 정규화됩니다

  </Accordion>

  <Accordion title="자격 증명 경로 및 레거시 호환성">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`의 레거시 기본 인증은 기본 계정 흐름에서 여전히 인식/마이그레이션됩니다

  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 계정의 WhatsApp 인증 상태를 지웁니다.

    레거시 인증 디렉터리에서는 `oauth.json`이 보존되고 Baileys 인증 파일은 제거됩니다.

  </Accordion>
</AccordionGroup>

## 도구, 작업, 구성 쓰기

- Agent 도구 지원에는 WhatsApp 반응 작업(`react`)이 포함됩니다.
- 작업 게이트:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널 시작 구성 쓰기는 기본적으로 활성화됩니다(`channels.whatsapp.configWrites=false`로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: 채널 상태가 연결되지 않음으로 보고됩니다.

    수정:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결되었지만 끊김 / 재연결 루프">
    증상: 연결된 계정에서 연결 끊김 또는 재연결 시도가 반복됩니다.

    조용한 계정은 일반 메시지 타임아웃을 넘어 연결을 유지할 수 있습니다. watchdog은
    WhatsApp Web 전송 활동이 멈추거나, 소켓이 닫히거나,
    애플리케이션 수준 활동이 더 긴 안전 창을 넘어 조용할 때 다시 시작합니다.

    로그에 `status=408 Request Time-out Connection was lost`가 반복해서 표시되면
    `web.whatsapp` 아래의 Baileys 소켓 타이밍을 조정하세요. 먼저
    `keepAliveIntervalMs`를 네트워크의 유휴 타임아웃보다 짧게 설정하고, 느리거나 손실이 있는 링크에서는
    `connectTimeoutMs`를 늘리세요.

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    수정:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    필요한 경우 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="프록시 뒤에서 QR 로그인이 시간 초과됨">
    증상: `openclaw channels login --channel whatsapp`가 `status=408 Request Time-out` 또는 TLS 소켓 연결 끊김과 함께 사용 가능한 QR 코드를 표시하기 전에 실패합니다.

    WhatsApp Web 로그인은 Gateway 호스트의 표준 프록시 환경(`HTTPS_PROXY`, `HTTP_PROXY`, 소문자 변형, `NO_PROXY`)을 사용합니다. Gateway 프로세스가 프록시 env를 상속하는지, 그리고 `NO_PROXY`가 `mmg.whatsapp.net`와 일치하지 않는지 확인하세요.

  </Accordion>

  <Accordion title="전송 시 활성 리스너 없음">
    대상 계정에 활성 Gateway 리스너가 없으면 아웃바운드 전송이 빠르게 실패합니다.

    Gateway가 실행 중이고 계정이 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="응답이 대화 기록에는 표시되지만 WhatsApp에는 표시되지 않음">
    대화 기록 행은 agent가 생성한 내용을 기록합니다. WhatsApp 전달은 별도로 확인됩니다. OpenClaw는 Baileys가 보이는 텍스트 또는 미디어 전송 중 하나 이상에 대해 아웃바운드 메시지 ID를 반환한 뒤에만 자동 응답이 전송된 것으로 처리합니다.

    확인 반응은 독립적인 응답 전 수신 확인입니다. 반응이 성공했다고 해서 이후 텍스트 또는 미디어 응답이 WhatsApp에 수락되었음을 증명하지는 않습니다.

    Gateway 로그에서 `auto-reply delivery failed` 또는 `auto-reply was not accepted by WhatsApp provider`를 확인하세요.

  </Accordion>

  <Accordion title="그룹 메시지가 예기치 않게 무시됨">
    다음 순서로 확인하세요.

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 허용 목록 항목
    - 멘션 게이팅(`requireMention` + 멘션 패턴)
    - `openclaw.json`(JSON5)의 중복 키: 나중 항목이 이전 항목을 재정의하므로 범위당 하나의 `groupPolicy`만 유지하세요

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    WhatsApp Gateway 런타임은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram Gateway 동작과 호환되지 않는 것으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## 시스템 프롬프트

WhatsApp은 `groups` 및 `direct` 맵을 통해 그룹과 직접 채팅에 대해 Telegram 스타일 시스템 프롬프트를 지원합니다.

그룹 메시지의 해석 계층:

유효한 `groups` 맵이 먼저 결정됩니다. 계정이 자체 `groups`를 정의하면 루트 `groups` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 결과로 나온 단일 맵에서 프롬프트 조회가 실행됩니다.

1. **그룹별 시스템 프롬프트**(`groups["<groupId>"].systemPrompt`): 특정 그룹 항목이 맵에 존재하고 **그** `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트가 적용되지 않습니다.
2. **그룹 와일드카드 시스템 프롬프트**(`groups["*"].systemPrompt`): 특정 그룹 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않을 때 사용됩니다.

직접 메시지의 해석 계층:

유효한 `direct` 맵이 먼저 결정됩니다. 계정이 자체 `direct`를 정의하면 루트 `direct` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 결과로 나온 단일 맵에서 프롬프트 조회가 실행됩니다.

1. **직접 채팅별 시스템 프롬프트**(`direct["<peerId>"].systemPrompt`): 특정 피어 항목이 맵에 존재하고 **그** `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트가 적용되지 않습니다.
2. **직접 채팅 와일드카드 시스템 프롬프트**(`direct["*"].systemPrompt`): 특정 피어 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않을 때 사용됩니다.

<Note>
`dms`는 가벼운 DM별 기록 재정의 버킷(`dms.<id>.historyLimit`)으로 유지됩니다. 프롬프트 재정의는 `direct` 아래에 있습니다.
</Note>

**Telegram 다중 계정 동작과의 차이:** Telegram에서는 봇이 자신이 속하지 않은 그룹의 그룹 메시지를 받는 것을 방지하기 위해 다중 계정 설정의 모든 계정에서 루트 `groups`가 의도적으로 억제됩니다. 이는 자체 `groups`를 정의하지 않은 계정에도 적용됩니다. WhatsApp은 이 가드를 적용하지 않습니다. 루트 `groups`와 루트 `direct`는 구성된 계정 수와 관계없이 계정 수준 재정의를 정의하지 않은 계정에 항상 상속됩니다. 다중 계정 WhatsApp 설정에서 계정별 그룹 또는 직접 채팅 프롬프트를 원하면 루트 수준 기본값에 의존하지 말고 각 계정 아래에 전체 맵을 명시적으로 정의하세요.

중요 동작:

- `channels.whatsapp.groups`는 그룹별 구성 맵이자 채팅 수준의 그룹 허용 목록입니다. 루트 또는 계정 범위에서 `groups["*"]`는 해당 범위에 대해 "모든 그룹이 허용됨"을 의미합니다.
- 해당 범위에서 이미 모든 그룹을 허용하려는 경우에만 와일드카드 그룹 `systemPrompt`를 추가하세요. 여전히 고정된 그룹 ID 집합만 대상이 되도록 하려면 프롬프트 기본값에 `groups["*"]`를 사용하지 마세요. 대신 명시적으로 허용 목록에 추가한 각 그룹 항목에 프롬프트를 반복해서 지정하세요.
- 그룹 허용과 발신자 승인은 별도의 검사입니다. `groups["*"]`는 그룹 처리가 가능한 그룹 집합을 넓히지만, 그 자체만으로 해당 그룹의 모든 발신자를 승인하지는 않습니다. 발신자 접근은 여전히 `channels.whatsapp.groupPolicy`와 `channels.whatsapp.groupAllowFrom`으로 별도로 제어됩니다.
- `channels.whatsapp.direct`는 DM에 대해 같은 부작용을 갖지 않습니다. `direct["*"]`는 DM이 `dmPolicy`와 `allowFrom` 또는 페어링 저장소 규칙에 의해 이미 허용된 뒤에 기본 다이렉트 채팅 구성만 제공합니다.

예:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 구성 참조 포인터

기본 참조:

- [구성 참조 - WhatsApp](/ko/gateway/config-channels#whatsapp)

중요도가 높은 WhatsApp 필드:

- 접근: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 다중 계정: `accounts.<id>.enabled`, `accounts.<id>.authDir`, 계정 수준 재정의
- 운영: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- 세션 동작: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- 프롬프트: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [보안](/ko/gateway/security)
- [채널 라우팅](/ko/channels/channel-routing)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [문제 해결](/ko/channels/troubleshooting)
