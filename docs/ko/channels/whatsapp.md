---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은 편지함 라우팅 작업
summary: WhatsApp 채널 지원, 접근 제어, 전달 동작 및 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:43:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

상태: WhatsApp Web(Baileys)을 통해 프로덕션 준비 완료. Gateway가 연결된 세션을 소유합니다.

## 설치(필요 시)

- 온보딩(`openclaw onboard`) 및 `openclaw channels add --channel whatsapp`는
  처음 선택할 때 WhatsApp Plugin 설치를 안내합니다.
- `openclaw channels login --channel whatsapp`도 Plugin이 아직 없으면
  설치 흐름을 제공합니다.
- Dev 채널 + git checkout: 로컬 Plugin 경로가 기본값입니다.
- Stable/Beta: 현재 패키지가 게시되어 있으면 npm 패키지 `@openclaw/whatsapp`를
  사용합니다.

수동 설치도 계속 사용할 수 있습니다.

```bash
openclaw plugins install @openclaw/whatsapp
```

npm이 OpenClaw 소유 패키지가 사용 중단되었거나 누락되었다고 보고하면,
npm 패키지 릴리스 흐름이 따라잡을 때까지 현재 패키징된 OpenClaw 빌드 또는 로컬 checkout을
사용하세요.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    기본 DM 정책은 알 수 없는 발신자에 대해 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    크로스 채널 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="WhatsApp 액세스 정책 구성">

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

  <Step title="WhatsApp 연결(QR)">

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

  <Step title="Gateway 시작">

```bash
openclaw gateway
```

  </Step>

  <Step title="첫 페어링 요청 승인(페어링 모드 사용 시)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    페어링 요청은 1시간 후 만료됩니다. 대기 중인 요청은 채널당 3개로 제한됩니다.

  </Step>
</Steps>

<Note>
가능하면 OpenClaw는 WhatsApp을 별도 번호에서 실행할 것을 권장합니다. (채널 메타데이터와 설정 흐름은 해당 설정에 최적화되어 있지만, 개인 번호 설정도 지원됩니다.)
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호(권장)">
    가장 깔끔한 운영 모드입니다.

    - OpenClaw용 별도 WhatsApp ID
    - 더 명확한 DM 허용 목록 및 라우팅 경계
    - 셀프 채팅 혼동 가능성 감소

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

  <Accordion title="개인 번호 대체 구성">
    온보딩은 개인 번호 모드를 지원하며 셀프 채팅에 적합한 기준 구성을 작성합니다.

    - `dmPolicy: "allowlist"`
    - `allowFrom`은 개인 번호를 포함
    - `selfChatMode: true`

    런타임에서는 셀프 채팅 보호가 연결된 자기 번호와 `allowFrom`을 기준으로 작동합니다.

  </Accordion>

  <Accordion title="WhatsApp Web 전용 채널 범위">
    현재 OpenClaw 채널 아키텍처에서 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    기본 제공 채팅 채널 레지스트리에는 별도의 Twilio WhatsApp 메시징 채널이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 재연결 감시자는 인바운드 앱 메시지 양만이 아니라 WhatsApp Web 전송 활동을 사용하므로, 최근 아무도 메시지를 보내지 않았다는 이유만으로 조용한 연결된 기기 세션을 재시작하지 않습니다. 더 긴 애플리케이션 무응답 상한은 전송 프레임은 계속 도착하지만 감시자 기간 동안 처리된 애플리케이션 메시지가 없으면 여전히 재연결을 강제합니다. 최근 활성 상태였던 세션의 일시적 재연결 후에는 첫 복구 기간 동안 해당 애플리케이션 무응답 검사가 일반 메시지 제한 시간을 사용합니다.
- Baileys 소켓 타이밍은 `web.whatsapp.*` 아래에서 명시적으로 설정됩니다. `keepAliveIntervalMs`는 WhatsApp Web 애플리케이션 ping을 제어하고, `connectTimeoutMs`는 시작 핸드셰이크 제한 시간을 제어하며, `defaultQueryTimeoutMs`는 Baileys 쿼리 제한 시간을 제어합니다.
- 아웃바운드 전송에는 대상 계정의 활성 WhatsApp 리스너가 필요합니다.
- 상태 및 브로드캐스트 채팅은 무시됩니다(`@status`, `@broadcast`).
- 재연결 감시자는 인바운드 앱 메시지 양만이 아니라 WhatsApp Web 전송 활동을 따릅니다. 조용한 연결된 기기 세션은 전송 프레임이 계속되는 동안 유지되지만, 전송이 멈추면 나중의 원격 연결 해제 경로보다 훨씬 전에 재연결을 강제합니다.
- 직접 채팅은 DM 세션 규칙을 사용합니다(`session.dmScope`; 기본값 `main`은 DM을 에이전트 기본 세션으로 통합합니다).
- 그룹 세션은 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp 채널/뉴스레터는 기본 `@newsletter` JID를 사용하는 명시적 아웃바운드 대상이 될 수 있습니다. 아웃바운드 뉴스레터 전송은 DM 세션 의미론이 아니라 채널 세션 메타데이터(`agent:<agentId>:whatsapp:channel:<jid>`)를 사용합니다.
- WhatsApp Web 전송은 Gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 소문자 변형)를 준수합니다. 채널별 WhatsApp 프록시 설정보다는 호스트 수준 프록시 구성을 권장합니다.
- `messages.removeAckAfterReply`가 활성화되면, OpenClaw는 표시되는 답장이 전달된 뒤 WhatsApp ack 반응을 지웁니다.

## Plugin 훅 및 개인정보 보호

WhatsApp 인바운드 메시지에는 개인 메시지 콘텐츠, 전화번호,
그룹 식별자, 발신자 이름, 세션 상관관계 필드가 포함될 수 있습니다. 이러한 이유로,
명시적으로 옵트인하지 않는 한 WhatsApp은 인바운드 `message_received` 훅 페이로드를 Plugin에
브로드캐스트하지 않습니다.

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

옵트인을 하나의 계정으로 범위 지정할 수 있습니다.

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

인바운드 WhatsApp 메시지 콘텐츠와 식별자를 받아도 신뢰할 수 있는 Plugin에 대해서만
이를 활성화하세요.

## 액세스 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.whatsapp.dmPolicy`는 직접 채팅 액세스를 제어합니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    `allowFrom`은 E.164 형식 번호를 허용합니다(내부적으로 정규화됨).

    `allowFrom`은 DM 발신자 액세스 제어 목록입니다. WhatsApp 그룹 JID 또는 `@newsletter` 채널 JID로의 명시적 아웃바운드 전송을 제한하지 않습니다.

    다중 계정 재정의: `channels.whatsapp.accounts.<id>.dmPolicy`(및 `allowFrom`)는 해당 계정에 대해 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부 정보:

    - 페어링은 채널 허용 저장소에 유지되며 구성된 `allowFrom`과 병합됩니다
    - 예약 자동화 및 Heartbeat 수신자 대체 동작은 명시적 전달 대상 또는 구성된 `allowFrom`을 사용합니다. DM 페어링 승인은 암묵적인 Cron 또는 Heartbeat 수신자가 아닙니다
    - 허용 목록이 구성되지 않은 경우 연결된 자기 번호가 기본적으로 허용됩니다
    - OpenClaw는 아웃바운드 `fromMe` DM(연결된 기기에서 자신에게 보내는 메시지)을 자동 페어링하지 않습니다

  </Tab>

  <Tab title="그룹 정책 + 허용 목록">
    그룹 액세스에는 두 계층이 있습니다.

    1. **그룹 멤버십 허용 목록**(`channels.whatsapp.groups`)
       - `groups`가 생략되면 모든 그룹이 대상이 될 수 있습니다
       - `groups`가 있으면 그룹 허용 목록으로 작동합니다(`"*"` 허용)

    2. **그룹 발신자 정책**(`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 허용 목록 우회
       - `allowlist`: 발신자가 `groupAllowFrom`(또는 `*`)과 일치해야 함
       - `disabled`: 모든 그룹 인바운드 차단

    발신자 허용 목록 대체 동작:

    - `groupAllowFrom`이 설정되지 않은 경우 런타임은 가능한 경우 `allowFrom`으로 대체합니다
    - 발신자 허용 목록은 멘션/답장 활성화 전에 평가됩니다

    참고: `channels.whatsapp` 블록이 전혀 없으면, `channels.defaults.groupPolicy`가 설정되어 있더라도 런타임 그룹 정책 대체값은 `allowlist`입니다(경고 로그와 함께).

  </Tab>

  <Tab title="멘션 + /activation">
    그룹 답장은 기본적으로 멘션이 필요합니다.

    멘션 감지에는 다음이 포함됩니다.

    - 봇 ID에 대한 명시적 WhatsApp 멘션
    - 구성된 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 승인된 그룹 메시지에 포함된 인바운드 음성 메모 전사본
    - 암시적 봇 답장 감지(답장 발신자가 봇 ID와 일치)

    보안 참고:

    - 인용/답장은 멘션 게이트만 충족하며, 발신자 권한을 부여하지는 **않습니다**
    - `groupPolicy: "allowlist"`에서는 허용 목록에 없는 발신자가 허용 목록 사용자 메시지에 답장하더라도 여전히 차단됩니다

    세션 수준 활성화 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 세션 상태를 업데이트합니다(전역 구성 아님). 소유자 게이트가 적용됩니다.

  </Tab>
</Tabs>

## 개인 번호 및 셀프 채팅 동작

연결된 자기 번호가 `allowFrom`에도 있으면 WhatsApp 셀프 채팅 보호가 활성화됩니다.

- 셀프 채팅 턴에 대한 읽음 확인 건너뛰기
- 그렇지 않으면 자신에게 알림을 보낼 멘션 JID 자동 트리거 동작 무시
- `messages.responsePrefix`가 설정되지 않았으면 셀프 채팅 답장은 기본적으로 `[{identity.name}]` 또는 `[openclaw]`를 사용합니다

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="인바운드 엔벨로프 + 답장 컨텍스트">
    수신 WhatsApp 메시지는 공유 인바운드 엔벨로프로 래핑됩니다.

    인용된 답장이 있으면 컨텍스트가 다음 형식으로 추가됩니다.

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    사용 가능한 경우 답장 메타데이터 필드도 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 발신자 JID/E.164).
    인용된 답장 대상이 다운로드 가능한 미디어이면, OpenClaw는 이를
    일반 인바운드 미디어 저장소를 통해 저장하고 `MediaPath`/`MediaType`으로 노출하므로
    에이전트가 `<media:image>`만 보는 대신 참조된 이미지를
    검사할 수 있습니다.

  </Accordion>

  <Accordion title="미디어 자리표시자 및 위치/연락처 추출">
    미디어만 포함된 인바운드 메시지는 다음과 같은 자리표시자로 정규화됩니다.

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    승인된 그룹 음성 메모는 본문이 `<media:audio>`뿐일 때
    멘션 게이트 전에 전사되므로, 음성 메모에서 봇 멘션을 말하면
    답장을 트리거할 수 있습니다. 전사본에도 여전히 봇 멘션이 없으면,
    원시 자리표시자 대신 전사본이 대기 중인 그룹 기록에 유지됩니다.

    위치 본문은 간결한 좌표 텍스트를 사용합니다. 위치 레이블/댓글 및 연락처/vCard 세부 정보는 인라인 프롬프트 텍스트가 아니라 펜스 처리된 신뢰할 수 없는 메타데이터로 렌더링됩니다.

  </Accordion>

  <Accordion title="대기 중인 그룹 기록 주입">
    그룹에서는 처리되지 않은 메시지를 버퍼링했다가 봇이 마침내 트리거될 때 컨텍스트로 주입할 수 있습니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`
    - 대체값: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    주입 마커:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="읽음 확인">
    허용된 인바운드 WhatsApp 메시지에는 읽음 확인이 기본적으로 활성화됩니다.

    전역에서 비활성화:

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

## 전송, 청크 처리, 미디어

<AccordionGroup>
  <Accordion title="텍스트 청크 처리">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 단락 경계(빈 줄)를 우선 사용한 다음, 길이에 안전한 청크 처리로 대체합니다

  </Accordion>

  <Accordion title="아웃바운드 미디어 동작">
    - 이미지, 비디오, 오디오(PTT 음성 메모), 문서 페이로드를 지원합니다
    - 오디오 미디어는 Baileys `audio` 페이로드를 통해 `ptt: true`로 전송되므로, WhatsApp 클라이언트는 이를 푸시 투 토크 음성 메모로 렌더링합니다
    - 응답 페이로드는 `audioAsVoice`를 보존합니다. WhatsApp용 TTS 음성 메모 출력은 제공자가 MP3 또는 WebM을 반환하더라도 이 PTT 경로를 유지합니다
    - 네이티브 Ogg/Opus 오디오는 음성 메모 호환성을 위해 `audio/ogg; codecs=opus`로 전송됩니다
    - Microsoft Edge TTS MP3/WebM 출력을 포함한 비 Ogg 오디오는 PTT 전송 전에 `ffmpeg`로 48 kHz 모노 Ogg/Opus로 트랜스코딩됩니다
    - `/tts latest`는 최신 어시스턴트 응답을 하나의 음성 메모로 보내고 같은 응답의 반복 전송을 억제합니다. `/tts chat on|off|default`는 현재 WhatsApp 채팅의 자동 TTS를 제어합니다
    - 애니메이션 GIF 재생은 비디오 전송의 `gifPlayback: true`를 통해 지원됩니다
    - 다중 미디어 응답 페이로드를 보낼 때 캡션은 첫 번째 미디어 항목에 적용됩니다. 단, WhatsApp 클라이언트가 음성 메모 캡션을 일관되게 렌더링하지 않으므로 PTT 음성 메모는 오디오를 먼저 보내고 표시 텍스트는 별도로 보냅니다
    - 미디어 소스는 HTTP(S), `file://` 또는 로컬 경로일 수 있습니다

  </Accordion>

  <Accordion title="미디어 크기 제한 및 대체 동작">
    - 인바운드 미디어 저장 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 아웃바운드 미디어 전송 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 계정별 재정의는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`를 사용합니다
    - 이미지는 제한에 맞게 자동 최적화됩니다(크기 조정/품질 스윕)
    - 미디어 전송 실패 시, 첫 번째 항목 대체 동작은 응답을 조용히 버리는 대신 텍스트 경고를 보냅니다

  </Accordion>
</AccordionGroup>

## 응답 인용

WhatsApp은 아웃바운드 응답이 인바운드 메시지를 눈에 보이게 인용하는 네이티브 응답 인용을 지원합니다. `channels.whatsapp.replyToMode`로 제어합니다.

| 값          | 동작                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 절대 인용하지 않으며 일반 메시지로 보냅니다                           |
| `"first"`   | 첫 번째 아웃바운드 응답 청크만 인용합니다                              |
| `"all"`     | 모든 아웃바운드 응답 청크를 인용합니다                                 |
| `"batched"` | 즉시 응답은 인용하지 않고 대기열에 있는 배치 응답을 인용합니다         |

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

`channels.whatsapp.reactionLevel`은 에이전트가 WhatsApp에서 이모지 반응을 얼마나 폭넓게 사용하는지 제어합니다.

| 수준          | 확인 반응 | 에이전트 시작 반응 | 설명                                      |
| ------------- | --------- | ------------------ | ----------------------------------------- |
| `"off"`       | 아니요    | 아니요             | 반응 없음                                 |
| `"ack"`       | 예        | 아니요             | 확인 반응만(응답 전 수신 확인)            |
| `"minimal"`   | 예        | 예(보수적)         | 확인 + 보수적 지침을 따르는 에이전트 반응 |
| `"extensive"` | 예        | 예(권장됨)         | 확인 + 권장 지침을 따르는 에이전트 반응   |

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

- 인바운드가 수락된 직후 전송됩니다(응답 전)
- 실패는 로그에 기록되지만 정상 응답 전송을 차단하지 않습니다
- 그룹 모드 `mentions`는 멘션으로 트리거된 턴에 반응합니다. 그룹 활성화 `always`는 이 검사의 우회로 동작합니다
- WhatsApp은 `channels.whatsapp.ackReaction`을 사용합니다(레거시 `messages.ackReaction`은 여기에서 사용되지 않음)

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="계정 선택 및 기본값">
    - 계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다
    - 기본 계정 선택: `default`가 있으면 이를 사용하고, 없으면 구성된 첫 번째 계정 ID(정렬됨)를 사용합니다
    - 계정 ID는 조회를 위해 내부적으로 정규화됩니다

  </Accordion>

  <Accordion title="자격 증명 경로 및 레거시 호환성">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`의 레거시 기본 인증은 기본 계정 흐름에서 여전히 인식/마이그레이션됩니다

  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 계정의 WhatsApp 인증 상태를 지웁니다.

    Gateway에 연결할 수 있으면, 로그아웃은 먼저 선택한 계정의 라이브 WhatsApp 리스너를 중지하여 연결된 세션이 다음 재시작까지 메시지를 계속 수신하지 않도록 합니다. `openclaw channels remove --channel whatsapp`도 계정 구성을 비활성화하거나 삭제하기 전에 라이브 리스너를 중지합니다.

    레거시 인증 디렉터리에서는 Baileys 인증 파일이 제거되는 동안 `oauth.json`은 보존됩니다.

  </Accordion>
</AccordionGroup>

## 도구, 작업 및 구성 쓰기

- 에이전트 도구 지원에는 WhatsApp 반응 작업(`react`)이 포함됩니다.
- 작업 게이트:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널에서 시작하는 구성 쓰기는 기본적으로 활성화되어 있습니다(`channels.whatsapp.configWrites=false`로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: 채널 상태가 연결되지 않았다고 보고합니다.

    해결:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결되었지만 연결이 끊김 / 재연결 루프">
    증상: 연결된 계정에서 연결 끊김 또는 재연결 시도가 반복됩니다.

    조용한 계정은 일반 메시지 타임아웃을 지나서도 연결 상태를 유지할 수 있습니다. Watchdog은 WhatsApp Web 전송 활동이 중지되거나, 소켓이 닫히거나, 애플리케이션 수준 활동이 더 긴 안전 기간을 넘어 조용히 유지될 때 다시 시작합니다.

    로그에 `status=408 Request Time-out Connection was lost`가 반복해서 표시되면 `web.whatsapp` 아래의 Baileys 소켓 타이밍을 조정하세요. 먼저 `keepAliveIntervalMs`를 네트워크의 유휴 타임아웃보다 짧게 줄이고, 느리거나 손실이 많은 링크에서는 `connectTimeoutMs`를 늘리세요.

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

    해결:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    `~/.openclaw/logs/whatsapp-health.log`에 `Gateway inactive`라고 표시되지만 `openclaw gateway status`와 `openclaw channels status --probe`에서 Gateway와 WhatsApp이 정상으로 표시되면 `openclaw doctor`를 실행하세요. Linux에서 doctor는 여전히 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출하는 레거시 crontab 항목에 대해 경고합니다. cron에는 systemd 사용자 버스 환경이 없을 수 있고 해당 오래된 스크립트가 Gateway 상태를 잘못 보고하게 만들 수 있으므로, `crontab -e`로 이러한 오래된 항목을 제거하세요.

    필요한 경우 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="프록시 뒤에서 QR 로그인이 시간 초과됨">
    증상: `openclaw channels login --channel whatsapp`가 사용 가능한 QR 코드를 표시하기 전에 `status=408 Request Time-out` 또는 TLS 소켓 연결 끊김으로 실패합니다.

    WhatsApp Web 로그인은 Gateway 호스트의 표준 프록시 환경(`HTTPS_PROXY`, `HTTP_PROXY`, 소문자 변형 및 `NO_PROXY`)을 사용합니다. Gateway 프로세스가 프록시 환경을 상속하는지, 그리고 `NO_PROXY`가 `mmg.whatsapp.net`과 일치하지 않는지 확인하세요.

  </Accordion>

  <Accordion title="전송 시 활성 리스너 없음">
    대상 계정에 활성 Gateway 리스너가 없으면 아웃바운드 전송은 빠르게 실패합니다.

    Gateway가 실행 중이고 계정이 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="응답이 transcript에는 표시되지만 WhatsApp에는 표시되지 않음">
    transcript 행은 에이전트가 생성한 내용을 기록합니다. WhatsApp 전송은 별도로 확인됩니다. OpenClaw는 Baileys가 적어도 하나의 표시 가능한 텍스트 또는 미디어 전송에 대해 아웃바운드 메시지 ID를 반환한 뒤에만 자동 응답을 전송된 것으로 간주합니다.

    확인 반응은 독립적인 응답 전 수신 확인입니다. 반응이 성공했다고 해서 이후 텍스트 또는 미디어 응답이 WhatsApp에 수락되었다는 증거는 아닙니다.

    Gateway 로그에서 `auto-reply delivery failed` 또는 `auto-reply was not accepted by WhatsApp provider`를 확인하세요.

  </Accordion>

  <Accordion title="그룹 메시지가 예기치 않게 무시됨">
    다음 순서로 확인하세요.

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 허용 목록 항목
    - 멘션 게이트(`requireMention` + 멘션 패턴)
    - `openclaw.json`(JSON5)의 중복 키: 뒤의 항목이 앞의 항목을 재정의하므로 범위당 하나의 `groupPolicy`만 유지하세요

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    WhatsApp Gateway 런타임은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram Gateway 작업에 호환되지 않는 것으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## 시스템 프롬프트

WhatsApp은 `groups` 및 `direct` 맵을 통해 그룹과 직접 채팅에 대해 Telegram 스타일 시스템 프롬프트를 지원합니다.

그룹 메시지의 해결 계층:

유효한 `groups` 맵이 먼저 결정됩니다. 계정이 자체 `groups`를 정의하면 루트 `groups` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 프롬프트 조회가 결과로 나온 단일 맵에서 실행됩니다.

1. **그룹별 시스템 프롬프트**(`groups["<groupId>"].systemPrompt`): 특정 그룹 항목이 맵에 존재하고 **또한** 그 `systemPrompt` 키가 정의된 경우 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트가 적용되지 않습니다.
2. **그룹 와일드카드 시스템 프롬프트**(`groups["*"].systemPrompt`): 특정 그룹 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않은 경우 사용됩니다.

직접 메시지의 해결 계층:

유효한 `direct` 맵이 먼저 결정됩니다. 계정이 자체 `direct`를 정의하면 루트 `direct` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 프롬프트 조회가 결과로 나온 단일 맵에서 실행됩니다.

1. **직접 대상별 시스템 프롬프트**(`direct["<peerId>"].systemPrompt`): 특정 피어 항목이 맵에 존재하고 **또한** 그 `systemPrompt` 키가 정의된 경우 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트가 적용되지 않습니다.
2. **직접 와일드카드 시스템 프롬프트**(`direct["*"].systemPrompt`): 특정 피어 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않은 경우 사용됩니다.

<Note>
`dms`는 가벼운 DM별 기록 재정의 버킷(`dms.<id>.historyLimit`)으로 남아 있습니다. 프롬프트 재정의는 `direct` 아래에 있습니다.
</Note>

**Telegram 다중 계정 동작과의 차이:** Telegram에서는 다중 계정 설정에서 모든 계정에 대해 루트 `groups`가 의도적으로 억제됩니다. 자체 `groups`를 정의하지 않은 계정도 포함됩니다. 이는 봇이 자신이 속하지 않은 그룹의 그룹 메시지를 받지 않도록 하기 위한 것입니다. WhatsApp에는 이 보호 장치가 적용되지 않습니다. 구성된 계정 수와 관계없이, 계정 수준 재정의를 정의하지 않은 계정은 항상 루트 `groups`와 루트 `direct`를 상속합니다. 다중 계정 WhatsApp 설정에서 계정별 그룹 또는 다이렉트 프롬프트를 원한다면 루트 수준 기본값에 의존하지 말고 각 계정 아래에 전체 맵을 명시적으로 정의하세요.

중요한 동작:

- `channels.whatsapp.groups`는 그룹별 구성 맵이자 채팅 수준 그룹 허용 목록입니다. 루트 또는 계정 범위에서 `groups["*"]`는 해당 범위에 대해 "모든 그룹이 허용됨"을 의미합니다.
- 해당 범위에서 모든 그룹을 이미 허용하려는 경우에만 와일드카드 그룹 `systemPrompt`를 추가하세요. 여전히 고정된 그룹 ID 집합만 대상이 되도록 하려면 프롬프트 기본값에 `groups["*"]`를 사용하지 마세요. 대신 명시적으로 허용 목록에 추가한 각 그룹 항목에 프롬프트를 반복해서 지정하세요.
- 그룹 허용과 발신자 승인은 별도의 검사입니다. `groups["*"]`는 그룹 처리가 도달할 수 있는 그룹 집합을 넓히지만, 그 자체만으로 해당 그룹의 모든 발신자를 승인하지는 않습니다. 발신자 접근은 여전히 `channels.whatsapp.groupPolicy`와 `channels.whatsapp.groupAllowFrom`에 의해 별도로 제어됩니다.
- `channels.whatsapp.direct`에는 다이렉트 메시지에 대해 같은 부작용이 없습니다. `direct["*"]`는 다이렉트 메시지가 `dmPolicy`와 `allowFrom` 또는 페어링 저장소 규칙에 의해 이미 허용된 후에만 기본 다이렉트 채팅 구성을 제공합니다.

예시:

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

핵심 WhatsApp 필드:

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
