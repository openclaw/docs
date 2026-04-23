---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은편지함 라우팅 작업 중입니다
summary: WhatsApp 채널 지원, 액세스 제어, 전송 동작 및 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T13:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web 채널)

상태: WhatsApp Web(Baileys)을 통해 프로덕션 준비 완료. Gateway가 연결된 세션을 소유합니다.

## 설치(필요 시)

- 온보딩(`openclaw onboard`)과 `openclaw channels add --channel whatsapp`는
  WhatsApp를 처음 선택할 때 WhatsApp Plugin 설치를 안내합니다.
- `openclaw channels login --channel whatsapp`도
  Plugin이 아직 없는 경우 설치 흐름을 제공합니다.
- 개발 채널 + git 체크아웃: 기본적으로 로컬 Plugin 경로를 사용합니다.
- Stable/Beta: 기본적으로 npm 패키지 `@openclaw/whatsapp`를 사용합니다.

수동 설치도 계속 사용할 수 있습니다:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북입니다.
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

  </Step>

  <Step title="Gateway 시작">

```bash
openclaw gateway
```

  </Step>

  <Step title="첫 번째 페어링 요청 승인(페어링 모드 사용 시)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    페어링 요청은 1시간 후 만료됩니다. 대기 중인 요청은 채널당 최대 3개입니다.

  </Step>
</Steps>

<Note>
OpenClaw는 가능하면 WhatsApp를 별도 번호에서 실행할 것을 권장합니다. (채널 메타데이터와 설정 흐름은 해당 구성을 기준으로 최적화되어 있지만, 개인 번호 구성도 지원합니다.)
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호(권장)">
    가장 깔끔한 운영 방식입니다:

    - OpenClaw용 별도 WhatsApp ID
    - 더 명확한 DM 허용 목록과 라우팅 경계
    - 자기 자신과의 채팅 혼동 가능성 감소

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
    온보딩은 개인 번호 모드를 지원하며 자기 자신과의 채팅에 적합한 기본 구성을 작성합니다:

    - `dmPolicy: "allowlist"`
    - `allowFrom`에 개인 번호 포함
    - `selfChatMode: true`

    런타임에서는 자기 자신과의 채팅 보호가 연결된 자기 번호와 `allowFrom`를 기준으로 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web 전용 채널 범위">
    현재 OpenClaw 채널 아키텍처에서 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    기본 제공 채팅 채널 레지스트리에는 별도의 Twilio WhatsApp 메시징 채널이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 아웃바운드 전송에는 대상 계정에 대해 활성화된 WhatsApp 리스너가 필요합니다.
- 상태 및 브로드캐스트 채팅은 무시됩니다(`@status`, `@broadcast`).
- 다이렉트 채팅은 DM 세션 규칙을 사용합니다(`session.dmScope`; 기본값 `main`은 DM을 에이전트 메인 세션으로 통합).
- 그룹 세션은 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web 전송은 Gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` 및 소문자 변형)를 따릅니다. 채널별 WhatsApp 프록시 설정보다 호스트 수준 프록시 구성을 권장합니다.

## 액세스 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.whatsapp.dmPolicy`는 다이렉트 채팅 액세스를 제어합니다:

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    `allowFrom`는 E.164 형식 번호를 받습니다(내부적으로 정규화됨).

    다중 계정 재정의: 해당 계정에 대해서는 `channels.whatsapp.accounts.<id>.dmPolicy`(및 `allowFrom`)가 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부 사항:

    - 페어링은 채널 허용 저장소에 영속화되며 구성된 `allowFrom`와 병합됩니다
    - 허용 목록이 구성되지 않은 경우 연결된 자기 번호가 기본적으로 허용됩니다
    - 아웃바운드 `fromMe` DM은 자동으로 페어링되지 않습니다

  </Tab>

  <Tab title="그룹 정책 + 허용 목록">
    그룹 액세스에는 두 계층이 있습니다:

    1. **그룹 멤버십 허용 목록** (`channels.whatsapp.groups`)
       - `groups`가 생략되면 모든 그룹이 대상이 됩니다
       - `groups`가 있으면 그룹 허용 목록으로 동작합니다(`"*"` 허용)

    2. **그룹 발신자 정책** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 허용 목록 우회
       - `allowlist`: 발신자가 `groupAllowFrom`(또는 `*`)과 일치해야 함
       - `disabled`: 모든 그룹 인바운드 차단

    발신자 허용 목록 대체 규칙:

    - `groupAllowFrom`가 설정되지 않은 경우, 런타임은 가능하면 `allowFrom`로 대체합니다
    - 발신자 허용 목록은 멘션/답글 활성화보다 먼저 평가됩니다

    참고: `channels.whatsapp` 블록이 전혀 없는 경우, `channels.defaults.groupPolicy`가 설정되어 있어도 런타임 그룹 정책 대체값은 `allowlist`입니다(경고 로그 포함).

  </Tab>

  <Tab title="멘션 + /activation">
    그룹 응답은 기본적으로 멘션이 필요합니다.

    멘션 감지에는 다음이 포함됩니다:

    - 봇 ID에 대한 명시적 WhatsApp 멘션
    - 구성된 멘션 regex 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 봇에 대한 암묵적 답글 감지(답글 발신자가 봇 ID와 일치)

    보안 참고 사항:

    - 인용/답글은 멘션 게이팅만 충족하며, 발신자 권한을 부여하지는 않습니다
    - `groupPolicy: "allowlist"`에서는 허용 목록에 없는 발신자가 허용 목록에 있는 사용자의 메시지에 답글하더라도 여전히 차단됩니다

    세션 수준 활성화 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 전역 구성이 아니라 세션 상태를 업데이트합니다. 소유자 권한으로 제한됩니다.

  </Tab>
</Tabs>

## 개인 번호 및 자기 자신과의 채팅 동작

연결된 자기 번호가 `allowFrom`에도 포함되어 있으면 WhatsApp 자기 자신과의 채팅 보호 장치가 활성화됩니다:

- 자기 자신과의 채팅 턴에서는 읽음 확인 건너뜀
- 그렇지 않으면 자기 자신에게 ping을 보낼 수 있는 mention-JID 자동 트리거 동작 무시
- `messages.responsePrefix`가 설정되지 않은 경우, 자기 자신과의 채팅 응답 접두사는 기본적으로 `[{identity.name}]` 또는 `[openclaw]`를 사용

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="인바운드 엔벨로프 + 답글 컨텍스트">
    수신 WhatsApp 메시지는 공유 인바운드 엔벨로프로 래핑됩니다.

    인용된 답글이 있으면 컨텍스트가 다음 형식으로 추가됩니다:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    사용 가능한 경우 답글 메타데이터 필드도 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 발신자 JID/E.164).

  </Accordion>

  <Accordion title="미디어 플레이스홀더 및 위치/연락처 추출">
    미디어만 포함된 인바운드 메시지는 다음과 같은 플레이스홀더로 정규화됩니다:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    위치 및 연락처 페이로드는 라우팅 전에 텍스트 컨텍스트로 정규화됩니다.

  </Accordion>

  <Accordion title="대기 중인 그룹 기록 주입">
    그룹의 경우, 처리되지 않은 메시지를 버퍼링했다가 봇이 최종적으로 트리거될 때 컨텍스트로 주입할 수 있습니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`
    - 대체값: `messages.groupChat.historyLimit`
    - `0`으로 비활성화

    주입 마커:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="읽음 확인">
    읽음 확인은 허용된 인바운드 WhatsApp 메시지에 대해 기본적으로 활성화됩니다.

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

    자기 자신과의 채팅 턴에서는 전역적으로 활성화되어 있어도 읽음 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전송, 청크 분할 및 미디어

<AccordionGroup>
  <Accordion title="텍스트 청크 분할">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 문단 경계(빈 줄)를 우선하며, 그다음 길이 기준 안전 분할로 대체합니다
  </Accordion>

  <Accordion title="아웃바운드 미디어 동작">
    - 이미지, 비디오, 오디오(PTT 음성 메모), 문서 페이로드 지원
    - 음성 메모 호환성을 위해 `audio/ogg`는 `audio/ogg; codecs=opus`로 다시 작성됩니다
    - 비디오 전송 시 `gifPlayback: true`를 통해 애니메이션 GIF 재생 지원
    - 다중 미디어 답글 페이로드 전송 시 캡션은 첫 번째 미디어 항목에 적용됩니다
    - 미디어 소스는 HTTP(S), `file://`, 또는 로컬 경로를 사용할 수 있습니다
  </Accordion>

  <Accordion title="미디어 크기 제한 및 대체 동작">
    - 인바운드 미디어 저장 상한: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 아웃바운드 미디어 전송 상한: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 계정별 재정의는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb` 사용
    - 이미지는 제한에 맞도록 자동 최적화(크기 조정/품질 스윕)됩니다
    - 미디어 전송 실패 시 첫 번째 항목 대체 동작으로 응답을 조용히 버리지 않고 경고 텍스트를 전송합니다
  </Accordion>
</AccordionGroup>

## 답글 인용

WhatsApp는 아웃바운드 답글이 인바운드 메시지를 눈에 보이게 인용하는 기본 답글 인용을 지원합니다. `channels.whatsapp.replyToMode`로 제어하세요.

| Value    | 동작                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | 제공자가 지원하면 인바운드 메시지를 인용하고, 그렇지 않으면 인용을 건너뜁니다      |
| `"on"`   | 항상 인바운드 메시지를 인용하고, 인용이 거부되면 일반 전송으로 대체합니다          |
| `"off"`  | 절대 인용하지 않고 일반 메시지로 전송합니다                                        |

기본값은 `"auto"`입니다. 계정별 재정의는 `channels.whatsapp.accounts.<id>.replyToMode`를 사용합니다.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## 반응 수준

`channels.whatsapp.reactionLevel`은 에이전트가 WhatsApp에서 이모지 반응을 얼마나 폭넓게 사용하는지 제어합니다:

| Level         | 확인 반응 | 에이전트 시작 반응 | 설명                                             |
| ------------- | --------- | ------------------ | ------------------------------------------------ |
| `"off"`       | 아니요    | 아니요             | 반응을 전혀 사용하지 않음                        |
| `"ack"`       | 예        | 아니요             | 확인 반응만 사용(응답 전 수신 확인)              |
| `"minimal"`   | 예        | 예(보수적)         | 확인 반응 + 보수적 지침의 에이전트 반응          |
| `"extensive"` | 예        | 예(권장)           | 확인 반응 + 권장 지침의 에이전트 반응            |

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

WhatsApp는 `channels.whatsapp.ackReaction`을 통해 인바운드 수신 시 즉시 확인 반응을 지원합니다.
확인 반응은 `reactionLevel`에 의해 게이트되며, `reactionLevel`이 `"off"`이면 표시되지 않습니다.

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

- 인바운드가 수락된 직후(응답 전) 즉시 전송됩니다
- 실패는 로그에 기록되지만 일반적인 응답 전송을 막지는 않습니다
- 그룹 모드 `mentions`는 멘션으로 트리거된 턴에서 반응합니다. 그룹 활성화 `always`는 이 검사에 대한 우회로 동작합니다
- WhatsApp는 `channels.whatsapp.ackReaction`을 사용합니다(여기서는 레거시 `messages.ackReaction`을 사용하지 않음)

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="계정 선택 및 기본값">
    - 계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다
    - 기본 계정 선택: `default`가 있으면 그것을 사용하고, 없으면 구성된 첫 번째 계정 ID(정렬 기준)를 사용합니다
    - 계정 ID는 조회를 위해 내부적으로 정규화됩니다
  </Accordion>

  <Accordion title="자격 증명 경로 및 레거시 호환성">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`의 레거시 기본 인증도 기본 계정 흐름에 대해 계속 인식/마이그레이션됩니다
  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 계정의 WhatsApp 인증 상태를 지웁니다.

    레거시 인증 디렉터리에서는 `oauth.json`은 유지되고 Baileys 인증 파일은 제거됩니다.

  </Accordion>
</AccordionGroup>

## 도구, 작업 및 구성 쓰기

- 에이전트 도구 지원에는 WhatsApp 반응 작업(`react`)이 포함됩니다.
- 작업 게이트:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널 시작 구성 쓰기는 기본적으로 활성화되어 있습니다(`channels.whatsapp.configWrites=false`로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: 채널 상태가 연결되지 않음으로 표시됩니다.

    해결 방법:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결되었지만 연결 끊김 / 재연결 루프">
    증상: 연결된 계정에서 반복적인 연결 끊김 또는 재연결 시도가 발생합니다.

    해결 방법:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    필요한 경우 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="전송 시 활성 리스너 없음">
    대상 계정에 활성 Gateway 리스너가 없으면 아웃바운드 전송은 즉시 실패합니다.

    Gateway가 실행 중이고 계정이 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="그룹 메시지가 예상과 다르게 무시됨">
    다음 순서로 확인하세요:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 허용 목록 항목
    - 멘션 게이팅(`requireMention` + 멘션 패턴)
    - `openclaw.json`의 중복 키(JSON5): 나중 항목이 이전 항목을 덮어쓰므로 범위별로 `groupPolicy`를 하나만 유지하세요

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    WhatsApp Gateway 런타임은 Node를 사용해야 합니다. 안정적인 WhatsApp/Telegram Gateway 동작에는 Bun이 호환되지 않는 것으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## 시스템 프롬프트

WhatsApp는 `groups` 및 `direct` 맵을 통해 그룹 채팅과 다이렉트 채팅에서 Telegram 스타일 시스템 프롬프트를 지원합니다.

그룹 메시지의 확인 계층:

먼저 유효한 `groups` 맵이 결정됩니다. 계정이 자체 `groups`를 정의하면 루트 `groups` 맵을 완전히 대체합니다(깊은 병합 없음). 이후 프롬프트 조회는 결과로 나온 단일 맵에서 실행됩니다:

1. **그룹별 시스템 프롬프트** (`groups["<groupId>"].systemPrompt`): 특정 그룹 항목이 `systemPrompt`를 정의한 경우 사용됩니다.
2. **그룹 와일드카드 시스템 프롬프트** (`groups["*"].systemPrompt`): 특정 그룹 항목이 없거나 `systemPrompt`를 정의하지 않은 경우 사용됩니다.

다이렉트 메시지의 확인 계층:

먼저 유효한 `direct` 맵이 결정됩니다. 계정이 자체 `direct`를 정의하면 루트 `direct` 맵을 완전히 대체합니다(깊은 병합 없음). 이후 프롬프트 조회는 결과로 나온 단일 맵에서 실행됩니다:

1. **다이렉트별 시스템 프롬프트** (`direct["<peerId>"].systemPrompt`): 특정 피어 항목이 `systemPrompt`를 정의한 경우 사용됩니다.
2. **다이렉트 와일드카드 시스템 프롬프트** (`direct["*"].systemPrompt`): 특정 피어 항목이 없거나 `systemPrompt`를 정의하지 않은 경우 사용됩니다.

참고: `dms`는 가벼운 DM별 기록 재정의 버킷(`dms.<id>.historyLimit`)으로 유지됩니다. 프롬프트 재정의는 `direct` 아래에 위치합니다.

**Telegram 다중 계정 동작과의 차이점:** Telegram에서는 봇이 속하지 않은 그룹의 메시지를 받는 것을 방지하기 위해 다중 계정 설정에서 루트 `groups`가 모든 계정에 대해 의도적으로 억제됩니다. 이는 자체 `groups`를 정의하지 않은 계정에도 적용됩니다. WhatsApp는 이 보호 장치를 적용하지 않습니다. 계정 수준 재정의를 정의하지 않은 계정은 구성된 계정 수와 관계없이 항상 루트 `groups`와 루트 `direct`를 상속합니다. 다중 계정 WhatsApp 설정에서 계정별 그룹 또는 다이렉트 프롬프트를 원한다면 루트 수준 기본값에 의존하지 말고 각 계정 아래에 전체 맵을 명시적으로 정의하세요.

중요한 동작:

- `channels.whatsapp.groups`는 그룹별 구성 맵이자 채팅 수준 그룹 허용 목록이기도 합니다. 루트 또는 계정 범위 중 어느 쪽이든 `groups["*"]`는 해당 범위에서 "모든 그룹이 허용됨"을 의미합니다.
- 해당 범위에서 이미 모든 그룹을 허용하려는 경우에만 와일드카드 그룹 `systemPrompt`를 추가하세요. 여전히 고정된 그룹 ID 집합만 허용되게 하려면 프롬프트 기본값에 `groups["*"]`를 사용하지 마세요. 대신 명시적으로 허용 목록에 포함된 각 그룹 항목에 프롬프트를 반복해서 지정하세요.
- 그룹 허용과 발신자 권한 부여는 별도의 검사입니다. `groups["*"]`는 그룹 처리가 가능한 그룹 집합을 넓히지만, 그 자체만으로 해당 그룹의 모든 발신자에게 권한을 부여하지는 않습니다. 발신자 액세스는 여전히 `channels.whatsapp.groupPolicy`와 `channels.whatsapp.groupAllowFrom`로 별도로 제어됩니다.
- `channels.whatsapp.direct`는 DM에 대해 동일한 부작용이 없습니다. `direct["*"]`는 DM이 `dmPolicy`와 `allowFrom` 또는 pairing-store 규칙에 의해 이미 허용된 후에만 기본 다이렉트 채팅 구성을 제공합니다.

예시:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 루트 범위에서 모든 그룹을 허용해야 하는 경우에만 사용하세요.
        // 자체 groups 맵을 정의하지 않은 모든 계정에 적용됩니다.
        "*": { systemPrompt: "모든 그룹에 대한 기본 프롬프트." },
      },
      direct: {
        // 자체 direct 맵을 정의하지 않은 모든 계정에 적용됩니다.
        "*": { systemPrompt: "모든 다이렉트 채팅에 대한 기본 프롬프트." },
      },
      accounts: {
        work: {
          groups: {
            // 이 계정은 자체 groups를 정의하므로 루트 groups는 완전히
            // 대체됩니다. 와일드카드를 유지하려면 여기에도 "*"를 명시적으로 정의하세요.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "프로젝트 관리에 집중합니다.",
            },
            // 이 계정에서 모든 그룹을 허용해야 하는 경우에만 사용하세요.
            "*": { systemPrompt: "업무 그룹에 대한 기본 프롬프트." },
          },
          direct: {
            // 이 계정은 자체 direct 맵을 정의하므로 루트 direct 항목은
            // 완전히 대체됩니다. 와일드카드를 유지하려면 여기에도 "*"를 명시적으로 정의하세요.
            "+15551234567": { systemPrompt: "특정 업무용 다이렉트 채팅에 대한 프롬프트." },
            "*": { systemPrompt: "업무용 다이렉트 채팅에 대한 기본 프롬프트." },
          },
        },
      },
    },
  },
}
```

## 구성 참조 포인터

기본 참조:

- [구성 참조 - WhatsApp](/ko/gateway/configuration-reference#whatsapp)

신호가 높은 WhatsApp 필드:

- 액세스: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 전송: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 다중 계정: `accounts.<id>.enabled`, `accounts.<id>.authDir`, 계정 수준 재정의
- 운영: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- 세션 동작: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- 프롬프트: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 관련 문서

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [보안](/ko/gateway/security)
- [채널 라우팅](/ko/channels/channel-routing)
- [멀티 에이전트 라우팅](/ko/concepts/multi-agent)
- [문제 해결](/ko/channels/troubleshooting)
