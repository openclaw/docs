---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은편지함 라우팅 작업하기
summary: WhatsApp 채널 지원, 접근 제어, 전달 동작, 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T05:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9510b013f19c0ff4cd8376b7a3d0eca7466cf6ef17255349ccc729fe919911a0
    source_path: channels/whatsapp.md
    workflow: 15
---

상태: WhatsApp Web (Baileys)를 통해 프로덕션 준비 완료. Gateway가 연결된 세션을 소유합니다.

## 설치(필요 시)

- 온보딩(`openclaw onboard`)과 `openclaw channels add --channel whatsapp`는
  처음 선택할 때 WhatsApp Plugin 설치를 안내합니다.
- `openclaw channels login --channel whatsapp`도
  Plugin이 아직 없으면 설치 흐름을 제공합니다.
- 개발 채널 + git 체크아웃: 기본값은 로컬 Plugin 경로입니다.
- Stable/Beta: 기본값은 npm 패키지 `@openclaw/whatsapp`입니다.

수동 설치도 계속 사용할 수 있습니다:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 pairing입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반 진단 및 복구 플레이북입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예제입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="WhatsApp 접근 정책 구성">

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

  <Step title="첫 번째 페어링 요청 승인(pairing 모드를 사용하는 경우)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    페어링 요청은 1시간 후 만료됩니다. 대기 중 요청은 채널당 3개로 제한됩니다.

  </Step>
</Steps>

<Note>
가능하면 OpenClaw는 WhatsApp를 별도 번호로 운영할 것을 권장합니다. (채널 메타데이터와 설정 흐름은 그 구성을 기준으로 최적화되어 있지만, 개인 번호 구성도 지원됩니다.)
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호(권장)">
    가장 깔끔한 운영 모드입니다:

    - OpenClaw용 별도 WhatsApp ID
    - 더 명확한 DM 허용 목록 및 라우팅 경계
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

    런타임에서는 자기 자신과의 채팅 보호가 연결된 자기 번호와 `allowFrom`을 기준으로 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web 전용 채널 범위">
    현재 OpenClaw 채널 아키텍처에서 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    내장 채팅 채널 레지스트리에는 별도의 Twilio WhatsApp 메시징 채널이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 아웃바운드 전송에는 대상 계정에 대한 활성 WhatsApp 리스너가 필요합니다.
- 상태 및 브로드캐스트 채팅은 무시됩니다(`@status`, `@broadcast`).
- 다이렉트 채팅은 DM 세션 규칙을 사용합니다(`session.dmScope`; 기본값 `main`은 DM을 에이전트 메인 세션으로 합칩니다).
- 그룹 세션은 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web 전송은 Gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 소문자 변형)를 따릅니다. 채널별 WhatsApp 프록시 설정보다 호스트 수준 프록시 구성을 우선하세요.

## Plugin 훅과 개인정보 보호

WhatsApp 인바운드 메시지에는 개인 메시지 내용, 전화번호,
그룹 식별자, 발신자 이름, 세션 상관 필드가 포함될 수 있습니다. 따라서
명시적으로 opt-in하지 않으면 WhatsApp는 인바운드 `message_received` 훅 페이로드를
Plugin에 브로드캐스트하지 않습니다:

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

이 opt-in은 한 계정으로 범위를 제한할 수 있습니다:

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

이는 인바운드 WhatsApp 메시지 내용과 식별자를 받도록 신뢰하는 Plugin에 대해서만 활성화하세요.

## 접근 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.whatsapp.dmPolicy`는 다이렉트 채팅 접근을 제어합니다:

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    `allowFrom`은 E.164 형식 번호를 허용합니다(내부적으로 정규화됨).

    다중 계정 재정의: 해당 계정에서는 `channels.whatsapp.accounts.<id>.dmPolicy`(및 `allowFrom`)가 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부 사항:

    - 페어링은 채널 허용 저장소에 유지되며 구성된 `allowFrom`과 병합됩니다
    - 허용 목록이 구성되지 않으면 연결된 자기 번호가 기본적으로 허용됩니다
    - OpenClaw는 아웃바운드 `fromMe` DM(연결된 장치에서 자신에게 보내는 메시지)을 자동 페어링하지 않습니다

  </Tab>

  <Tab title="그룹 정책 + 허용 목록">
    그룹 접근은 두 계층으로 구성됩니다:

    1. **그룹 멤버십 허용 목록** (`channels.whatsapp.groups`)
       - `groups`가 생략되면 모든 그룹이 대상이 됩니다
       - `groups`가 있으면 그룹 허용 목록으로 동작합니다(`"*"` 허용 가능)

    2. **그룹 발신자 정책** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 허용 목록 우회
       - `allowlist`: 발신자가 `groupAllowFrom`(또는 `*`)과 일치해야 함
       - `disabled`: 모든 그룹 인바운드 차단

    발신자 허용 목록 대체 동작:

    - `groupAllowFrom`이 설정되지 않으면 런타임은 가능할 때 `allowFrom`으로 대체합니다
    - 발신자 허용 목록은 멘션/답글 활성화보다 먼저 평가됩니다

    참고: `channels.whatsapp` 블록 자체가 전혀 없으면, `channels.defaults.groupPolicy`가 설정되어 있어도 런타임 그룹 정책 대체값은 `allowlist`입니다(경고 로그 포함).

  </Tab>

  <Tab title="멘션 + /activation">
    그룹 응답은 기본적으로 멘션이 필요합니다.

    멘션 감지에는 다음이 포함됩니다:

    - 봇 ID에 대한 명시적 WhatsApp 멘션
    - 구성된 멘션 regex 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 암시적 봇 답글 감지(답글 대상 발신자가 봇 ID와 일치)

    보안 참고:

    - 인용/답글은 멘션 게이트만 충족합니다. 발신자 권한을 부여하지는 않습니다
    - `groupPolicy: "allowlist"`에서는 허용 목록에 없는 발신자가 허용 목록 사용자의 메시지에 답글을 달아도 여전히 차단됩니다

    세션 수준 활성화 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 전역 구성이 아니라 세션 상태를 업데이트합니다. 소유자 게이트가 적용됩니다.

  </Tab>
</Tabs>

## 개인 번호 및 자기 자신과의 채팅 동작

연결된 자기 번호가 `allowFrom`에도 있으면, WhatsApp 자기 자신과의 채팅 보호 장치가 활성화됩니다:

- 자기 자신과의 채팅 턴에 대해서는 읽음 확인을 건너뜀
- 그렇지 않으면 자기 자신을 핑할 수 있는 mention-JID 자동 트리거 동작 무시
- `messages.responsePrefix`가 설정되지 않은 경우, 자기 자신과의 채팅 응답은 기본적으로 `[{identity.name}]` 또는 `[openclaw]`

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="인바운드 엔벌로프 + 답글 컨텍스트">
    들어오는 WhatsApp 메시지는 공유 인바운드 엔벌로프로 래핑됩니다.

    인용된 답글이 있으면, 컨텍스트가 다음 형식으로 추가됩니다:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    답글 메타데이터 필드도 가능할 때 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="미디어 플레이스홀더 및 위치/연락처 추출">
    미디어만 있는 인바운드 메시지는 다음과 같은 플레이스홀더로 정규화됩니다:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    위치 본문은 간결한 좌표 텍스트를 사용합니다. 위치 레이블/설명과 연락처/vCard 세부 사항은 인라인 프롬프트 텍스트가 아니라 fence 처리된 신뢰되지 않은 메타데이터로 렌더링됩니다.

  </Accordion>

  <Accordion title="대기 중 그룹 히스토리 주입">
    그룹의 경우, 처리되지 않은 메시지를 버퍼링했다가 봇이 실제로 트리거될 때 컨텍스트로 주입할 수 있습니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`
    - 대체값: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    주입 마커:

    - `[마지막 응답 이후의 채팅 메시지 - 컨텍스트용]`
    - `[현재 메시지 - 이에 응답하세요]`

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

    자기 자신과의 채팅 턴은 전역적으로 활성화되어 있어도 읽음 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전달, 청크 분할, 미디어

<AccordionGroup>
  <Accordion title="텍스트 청크 분할">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 문단 경계(빈 줄)를 우선 사용하고, 이후 길이 안전 청크 분할로 대체합니다
  </Accordion>

  <Accordion title="아웃바운드 미디어 동작">
    - 이미지, 비디오, 오디오(PTT 보이스 노트), 문서 페이로드 지원
    - 답글 페이로드는 `audioAsVoice`를 유지하며, WhatsApp는 오디오 미디어를 Baileys PTT 보이스 노트로 전송합니다
    - `audio/ogg`는 보이스 노트 호환성을 위해 `audio/ogg; codecs=opus`로 다시 작성됩니다
    - 애니메이션 GIF 재생은 비디오 전송 시 `gifPlayback: true`를 통해 지원됩니다
    - 여러 미디어 답글 페이로드 전송 시 캡션은 첫 번째 미디어 항목에 적용됩니다
    - 미디어 소스는 HTTP(S), `file://`, 또는 로컬 경로일 수 있습니다
  </Accordion>

  <Accordion title="미디어 크기 제한 및 대체 동작">
    - 인바운드 미디어 저장 한도: `channels.whatsapp.mediaMaxMb` (기본값 `50`)
    - 아웃바운드 미디어 전송 한도: `channels.whatsapp.mediaMaxMb` (기본값 `50`)
    - 계정별 재정의는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb` 사용
    - 이미지는 제한에 맞도록 자동 최적화됩니다(크기 조정/품질 스윕)
    - 미디어 전송 실패 시 첫 번째 항목 대체 동작으로, 응답을 조용히 누락하는 대신 텍스트 경고를 전송합니다
  </Accordion>
</AccordionGroup>

## 답글 인용

WhatsApp는 아웃바운드 답글이 인바운드 메시지를 시각적으로 인용하는 네이티브 답글 인용을 지원합니다. `channels.whatsapp.replyToMode`로 이를 제어합니다.

| 값 | 동작 |
| ----------- | --------------------------------------------------------------------- |
| `"off"` | 인용하지 않음; 일반 메시지로 전송 |
| `"first"` | 첫 번째 아웃바운드 답글 청크만 인용 |
| `"all"` | 모든 아웃바운드 답글 청크 인용 |
| `"batched"` | 대기열에 있는 일괄 답글은 인용하고 즉시 답글은 인용하지 않음 |

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

`channels.whatsapp.reactionLevel`은 에이전트가 WhatsApp에서 이모지 반응을 얼마나 폭넓게 사용하는지 제어합니다:

| 수준 | 확인 반응 | 에이전트 시작 반응 | 설명 |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"` | 아니요 | 아니요 | 반응을 전혀 사용하지 않음 |
| `"ack"` | 예 | 아니요 | 확인 반응만 사용(응답 전 수신 확인) |
| `"minimal"` | 예 | 예(보수적) | 확인 + 보수적 지침의 에이전트 반응 |
| `"extensive"` | 예 | 예(권장) | 확인 + 권장 지침의 에이전트 반응 |

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
확인 반응은 `reactionLevel`의 적용을 받으며, `reactionLevel`이 `"off"`이면 억제됩니다.

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

동작 참고:

- 인바운드가 수락된 직후 즉시 전송됨(응답 전)
- 실패는 로그에 기록되지만 정상 응답 전달을 막지는 않음
- 그룹 모드 `mentions`는 멘션으로 트리거된 턴에 반응하며, 그룹 활성화 `always`는 이 검사에 대한 우회로 동작함
- WhatsApp는 `channels.whatsapp.ackReaction`을 사용합니다(기존 `messages.ackReaction`은 여기서 사용되지 않음)

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="계정 선택 및 기본값">
    - 계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다
    - 기본 계정 선택: `default`가 있으면 그것을 사용하고, 없으면 첫 번째로 구성된 계정 ID(정렬 기준)를 사용
    - 계정 ID는 조회를 위해 내부적으로 정규화됩니다
  </Accordion>

  <Accordion title="자격 증명 경로 및 레거시 호환성">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`의 레거시 기본 인증도 기본 계정 흐름에서 여전히 인식/마이그레이션됩니다
  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 계정의 WhatsApp 인증 상태를 지웁니다.

    레거시 인증 디렉터리에서는 `oauth.json`은 유지되고 Baileys 인증 파일은 제거됩니다.

  </Accordion>
</AccordionGroup>

## 도구, 작업, 구성 쓰기

- 에이전트 도구 지원에는 WhatsApp 반응 작업(`react`)이 포함됩니다.
- 작업 게이트:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널 시작 구성 쓰기는 기본적으로 활성화되어 있습니다(`channels.whatsapp.configWrites=false`로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: 채널 상태에 연결되지 않은 것으로 표시됨.

    해결:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="연결되었지만 연결 끊김 / 재연결 루프">
    증상: 연결된 계정에서 반복적인 연결 끊김 또는 재연결 시도 발생.

    해결:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    필요하면 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="전송 시 활성 리스너 없음">
    대상 계정에 대한 활성 Gateway 리스너가 없으면 아웃바운드 전송은 즉시 실패합니다.

    Gateway가 실행 중이고 계정이 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="그룹 메시지가 예상과 다르게 무시됨">
    다음 순서로 확인하세요:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 허용 목록 항목
    - 멘션 게이트(`requireMention` + 멘션 패턴)
    - `openclaw.json`의 중복 키(JSON5): 나중 항목이 이전 항목을 덮어쓰므로 범위마다 하나의 `groupPolicy`만 유지하세요

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    WhatsApp Gateway 런타임은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram Gateway 운영과 호환되지 않는 것으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## 시스템 프롬프트

WhatsApp는 `groups` 및 `direct` 맵을 통해 그룹과 다이렉트 채팅에 대해 Telegram 스타일 시스템 프롬프트를 지원합니다.

그룹 메시지의 해결 계층 구조:

유효한 `groups` 맵이 먼저 결정됩니다. 계정이 자체 `groups`를 정의하면 루트 `groups` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 결과 단일 맵에서 프롬프트 조회가 실행됩니다:

1. **그룹별 시스템 프롬프트** (`groups["<groupId>"].systemPrompt`): 맵에 특정 그룹 항목이 존재하고 해당 `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트는 적용되지 않습니다.
2. **그룹 와일드카드 시스템 프롬프트** (`groups["*"].systemPrompt`): 특정 그룹 항목이 맵에 전혀 없거나, 항목은 있지만 `systemPrompt` 키를 정의하지 않은 경우 사용됩니다.

다이렉트 메시지의 해결 계층 구조:

유효한 `direct` 맵이 먼저 결정됩니다. 계정이 자체 `direct`를 정의하면 루트 `direct` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 결과 단일 맵에서 프롬프트 조회가 실행됩니다:

1. **다이렉트별 시스템 프롬프트** (`direct["<peerId>"].systemPrompt`): 맵에 특정 피어 항목이 존재하고 해당 `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트는 적용되지 않습니다.
2. **다이렉트 와일드카드 시스템 프롬프트** (`direct["*"].systemPrompt`): 특정 피어 항목이 맵에 전혀 없거나, 항목은 있지만 `systemPrompt` 키를 정의하지 않은 경우 사용됩니다.

참고: `dms`는 경량 DM별 히스토리 재정의 버킷(`dms.<id>.historyLimit`)으로 유지됩니다. 프롬프트 재정의는 `direct` 아래에 있습니다.

**Telegram 다중 계정 동작과의 차이점:** Telegram에서는 봇이 속하지 않은 그룹의 메시지를 받지 않도록 하기 위해, 다중 계정 설정에서 모든 계정에 대해 루트 `groups`가 의도적으로 억제됩니다. 자체 `groups`를 정의하지 않은 계정도 예외가 아닙니다. WhatsApp는 이 보호 장치를 적용하지 않습니다. 루트 `groups`와 루트 `direct`는 구성된 계정 수와 관계없이 계정 수준 재정의를 정의하지 않은 계정에 항상 상속됩니다. 다중 계정 WhatsApp 설정에서 계정별 그룹 또는 다이렉트 프롬프트를 원하면, 루트 수준 기본값에 의존하지 말고 각 계정 아래에 전체 맵을 명시적으로 정의하세요.

중요한 동작:

- `channels.whatsapp.groups`는 그룹별 구성 맵이자 채팅 수준 그룹 허용 목록이기도 합니다. 루트 또는 계정 범위 어디에서든 `groups["*"]`는 해당 범위에서 "모든 그룹 허용"을 의미합니다.
- 해당 범위에서 실제로 모든 그룹을 허용하려는 경우에만 와일드카드 그룹 `systemPrompt`를 추가하세요. 여전히 고정된 그룹 ID 집합만 허용하려면 프롬프트 기본값에 `groups["*"]`를 사용하지 마세요. 대신 명시적으로 허용 목록에 넣은 각 그룹 항목에 프롬프트를 반복해서 지정하세요.
- 그룹 허용과 발신자 권한 부여는 별개의 검사입니다. `groups["*"]`는 그룹 처리에 도달할 수 있는 그룹 집합을 넓히지만, 그것만으로 해당 그룹의 모든 발신자를 승인하지는 않습니다. 발신자 접근은 여전히 `channels.whatsapp.groupPolicy`와 `channels.whatsapp.groupAllowFrom`에 의해 별도로 제어됩니다.
- `channels.whatsapp.direct`는 DM에 대해 같은 부작용이 없습니다. `direct["*"]`는 DM이 `dmPolicy`와 `allowFrom` 또는 pairing 저장소 규칙에 의해 이미 허용된 후에만 기본 다이렉트 채팅 구성을 제공합니다.

예시:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 루트 범위에서 모든 그룹을 허용해야 하는 경우에만 사용합니다.
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
              systemPrompt: "프로젝트 관리에 집중하세요.",
            },
            // 이 계정에서 모든 그룹을 허용해야 하는 경우에만 사용합니다.
            "*": { systemPrompt: "업무 그룹에 대한 기본 프롬프트." },
          },
          direct: {
            // 이 계정은 자체 direct 맵을 정의하므로 루트 direct 항목은
            // 완전히 대체됩니다. 와일드카드를 유지하려면 여기에도 "*"를 명시적으로 정의하세요.
            "+15551234567": { systemPrompt: "특정 업무 다이렉트 채팅용 프롬프트." },
            "*": { systemPrompt: "업무 다이렉트 채팅에 대한 기본 프롬프트." },
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

신호가 강한 WhatsApp 필드:

- 접근: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 다중 계정: `accounts.<id>.enabled`, `accounts.<id>.authDir`, 계정 수준 재정의
- 운영: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- 세션 동작: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- 프롬프트: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 관련 항목

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [Security](/ko/gateway/security)
- [채널 라우팅](/ko/channels/channel-routing)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [문제 해결](/ko/channels/troubleshooting)
