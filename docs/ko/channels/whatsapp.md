---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은편지함 라우팅 작업하기
summary: WhatsApp 채널 지원, 접근 제어, 전송 동작 및 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T12:20:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

상태: WhatsApp Web(Baileys)를 통해 프로덕션에 사용할 준비가 되었습니다. Gateway가 연결된 세션을 소유하며, 별도의 Twilio WhatsApp 채널은 없습니다.

## 설치

`openclaw onboard` 및 `openclaw channels add --channel whatsapp`에서는 처음 선택할 때 Plugin 설치를 안내하며, Plugin이 없으면 `openclaw channels login --channel whatsapp`에서도 동일한 설치 절차를 제공합니다. 개발 체크아웃은 로컬 Plugin 경로를 사용하며, 안정판/베타 설치는 먼저 ClawHub에서 `@openclaw/whatsapp`을 설치하고, 실패하면 npm을 사용합니다. WhatsApp 런타임은 핵심 OpenClaw npm 패키지 외부에서 제공되므로 런타임 종속성은 외부 Plugin에 유지됩니다. 수동 설치:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

레지스트리 대체 경로에만 기본 npm 패키지(`@openclaw/whatsapp`)를 사용하십시오. 재현 가능한 설치가 필요한 경우에만 정확한 버전을 고정하십시오.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 페어링입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 절차입니다.
  </Card>
  <Card title="Gateway 구성" icon="settings" href="/ko/gateway/configuration">
    전체 채널 구성 패턴과 예시입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Steps>
  <Step title="접근 정책 구성">

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

    로그인은 QR로만 가능합니다. 원격 또는 헤드리스 호스트에서는 로그인을 시작하기 전에 실시간 QR을 휴대전화에 안정적으로 전달할 방법을 마련하십시오. 터미널에 표시된 QR, 스크린샷 또는 채팅 첨부 파일은 전달 중 만료될 수 있습니다.

    특정 계정의 경우:

```bash
openclaw channels login --channel whatsapp --account work
```

    로그인 전에 기존/사용자 지정 인증 디렉터리를 연결하려면:

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

  <Step title="첫 번째 페어링 요청 승인(페어링 모드)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    페어링 요청은 1시간 후 만료되며, 대기 중인 요청은 계정당 최대 3개로 제한됩니다.

  </Step>
</Steps>

<Note>
별도의 WhatsApp 번호를 사용하는 것이 좋지만(설정과 메타데이터가 이에 최적화되어 있음), 개인 번호/자기 자신과의 채팅 구성도 완전히 지원됩니다.
</Note>

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 번호(권장)">
    - OpenClaw용 별도 WhatsApp ID
    - 더 명확한 DM 허용 목록 및 라우팅 경계
    - 자기 자신과의 채팅에서 혼동할 가능성 감소

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
    온보딩은 개인 번호 모드를 지원하며 자기 자신과의 채팅에 적합한 기준 구성을 작성합니다. 즉, `dmPolicy: "allowlist"`, 자신의 번호를 포함하는 `allowFrom`, `selfChatMode: true`입니다. 런타임의 자기 자신과의 채팅 보호 기능은 연결된 자기 번호와 `allowFrom`을 기준으로 작동합니다.
  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 감시 기능은 원시 WhatsApp Web 전송 활동과 애플리케이션 메시지 활동이라는 두 신호를 독립적으로 추적합니다. 조용하지만 연결된 세션은 최근 메시지가 도착하지 않았다는 이유만으로 재시작되지 않습니다. 고정된 내부 시간 범위(사용자 구성 불가) 동안 전송 프레임이 더 이상 도착하지 않거나, 애플리케이션 메시지가 일반 메시지 제한 시간의 4배를 넘도록 수신되지 않을 때만 강제로 재연결합니다. 최근 활성 상태였던 세션을 재연결한 직후에는 첫 번째 시간 범위에 4배 범위 대신 더 짧은 일반 메시지 제한 시간을 사용합니다. OpenClaw는 해당 재연결 초기에 Baileys가 전달하는 오프라인 메시지에 자동으로 응답할 수 있으며, 이는 수신 메시지 ID 중복 제거 수명으로 제한됩니다. 최초 시작 시에는 짧은 이전 기록 차단 규칙이 유지됩니다.
- Baileys 소켓 타이밍은 `web.whatsapp.*` 아래에 명시되어 있습니다. `keepAliveIntervalMs`(애플리케이션 핑 간격), `connectTimeoutMs`(연결 시작 핸드셰이크 제한 시간), `defaultQueryTimeoutMs`(Baileys 쿼리 대기 시간과 OpenClaw의 송신 전송/프레즌스 및 수신 읽음 확인 제한 시간)입니다.
- 송신 전송에는 대상 계정의 활성 WhatsApp 리스너가 필요하며, 그렇지 않으면 전송이 즉시 실패합니다.
- 그룹 전송은 토큰이 LID 기반 그룹을 포함한 현재 참여자 메타데이터와 일치할 때 `@+<digits>` 및 `@<digits>` 토큰(텍스트 및 미디어 캡션)에 네이티브 멘션 메타데이터를 첨부합니다.
- 상태 및 브로드캐스트 채팅(`@status`, `@broadcast`)은 무시됩니다.
- 다이렉트 채팅은 DM 세션 규칙(`session.dmScope`)을 사용하며, 기본값 `main`는 DM을 에이전트 기본 세션으로 통합합니다. 그룹 세션은 JID별로 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp 채널/뉴스레터는 네이티브 `@newsletter` JID를 통해 명시적인 송신 대상이 될 수 있으며, DM 의미 체계 대신 채널 세션 메타데이터(`agent:<agentId>:whatsapp:channel:<jid>`)를 사용합니다.
- WhatsApp Web 전송은 Gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` 및 소문자 변형)를 따릅니다. 채널별 설정보다 호스트 수준 프록시 구성을 권장합니다.
- `messages.removeAckAfterReply`을 활성화하면 표시되는 응답이 전달된 후 OpenClaw가 확인 반응을 제거합니다.

## MeowCaller로 현재 요청자에게 전화 걸기(실험적)

Plugin은 WhatsApp에서 시작된 에이전트 턴에 `whatsapp_call`을 노출할 수 있습니다. [MeowCaller](https://github.com/purpshell/meowcaller)를 사용하여 현재 승인된 요청자에게 WhatsApp 음성 통화를 걸고, 상대방이 응답하면 OpenClaw TTS 메시지를 재생합니다. 이 도구에는 대상 전화번호 매개변수가 없으므로 프롬프트로 통화 대상을 변경할 수 없습니다. 기본적으로 비활성화되어 있습니다.

<Warning>
MeowCaller는 실험적이고 태그가 지정된 릴리스가 없으며, 별도로 페어링된 whatsmeow 연결 기기 세션을 사용하므로 Plugin의 Baileys 자격 증명을 재사용할 수 없습니다. 페어링하면 동일한 WhatsApp 계정에 연결 기기가 하나 더 추가됩니다. OpenClaw에서 사용하는 ID로 스캔하십시오. 개인 번호/자기 자신과의 채팅 모드에서는 자기 자신에게 전화할 수 없습니다. 전용 OpenClaw 번호를 사용하여 개인 번호로 전화하십시오.
</Warning>

<Steps>
  <Step title="실험적 통화 활성화">

    WhatsApp 채널 구성에 `actions.calls: true`을 추가하고 Gateway를 다시 시작하십시오.

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    없거나 `false`인 경우 OpenClaw는 `whatsapp_call` 도구를 노출하지 않습니다.

  </Step>

  <Step title="검토된 MeowCaller CLI 설치">

    어댑터는 Gateway 호스트의 `PATH`에 `meowcaller` 실행 파일이 있어야 합니다. [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7)이 병합될 때까지 검토된 브랜치를 빌드하십시오.

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin`이 Gateway 서비스의 `PATH`에 포함되어 있는지 확인하십시오. 이 리비전에는 명시적인 `pair` 및 송신 전용 `notify` 명령이 있습니다. `notify`은 마이크, 스피커, 비디오 장치 또는 진단 캡처를 열지 않습니다. 업스트림 예제 CLI의 `play` 명령으로 대체하지 마십시오.

  </Step>

  <Step title="MeowCaller 연결 기기 페어링">

    WhatsApp 에이전트에게 통화 설정을 확인하도록 요청하십시오(`whatsapp_call` 상태 작업에서 계정별 상태 디렉터리와 페어링 명령을 보고합니다). 기본 계정의 경우:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    이 명령을 대화형으로 실행하고 **WhatsApp > Linked devices**에서 QR을 스캔한 다음 `MeowCaller linked device ready`을 기다리십시오. `wa-voip.db`은 MeowCaller 세션이므로 비공개로 유지하십시오. 기본 계정이 아닌 계정은 상태 작업에서 제공하는 자체 저장소 경로를 사용합니다. Windows에서는 해당 PowerShell 명령을 실행하십시오.

  </Step>

  <Step title="TTS 구성 및 WhatsApp에서 통화">

    전화 통화가 가능한 [TTS 제공자](/ko/tools/tts)를 구성하고 Gateway를 다시 시작한 다음, `Call me and say the build finished.`과 같은 요청을 보내십시오. 도구는 신뢰할 수 있는 수신 컨텍스트에서 발신자를 확인하고, 임시 비공개 WAV 파일을 합성하고, 제한된 통화 시간 동안 MeowCaller를 실행한 후 오디오 파일을 삭제합니다. OpenClaw는 계정 저장소를 명시적으로 전달하고, 응답/재생/통화 종료 후 종료 상태가 0이 될 때까지 기다리며, 제한 시간 초과 또는 0이 아닌 종료를 도구 호출 실패로 처리합니다.

  </Step>
</Steps>

제한 사항: 일대일 송신 음성 통화만 지원하며, 임의의 대상 번호를 사용할 수 없고, 채팅 연결과 인증을 공유하지 않으며, 개인 번호/자기 자신과의 채팅 모드에서 자기 자신에게 전화할 수 없습니다. 합성 오디오는 최대 60초로 제한되고, MeowCaller의 응답/재생/통화 종료 완료 외에는 휴대전화 측 가청 여부 확인이 없으며, OpenClaw는 제한된 115~175초의 시간 범위(MeowCaller의 연결, 응답, 재생 및 종료 단계 포함) 후 동반 프로세스를 중지합니다.

## 승인 프롬프트

WhatsApp은 최상위 승인 전달 구성에 따라 exec 및 Plugin 승인 프롬프트를 `👍`/`👎` 반응으로 표시할 수 있습니다.

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec`과 `approvals.plugin`은 서로 독립적입니다. WhatsApp을 채널로 활성화하면 전송만 연결되며, 일치하는 승인 계열이 활성화되고 해당 채널로 라우팅되지 않는 한 아무것도 전송하지 않습니다. 세션 모드에서는 WhatsApp에서 시작된 승인에만 네이티브 이모지 승인을 전달합니다. 대상 모드는 명시적 대상에 공유 전달 파이프라인을 사용하며 별도의 승인자 DM 팬아웃을 생성하지 않습니다.

WhatsApp 승인 반응을 사용하려면 `allowFrom`(또는 `"*"`)에 승인자를 명시해야 합니다. `defaultTo`는 승인자 목록이 아니라 일반적인 기본 메시지 대상을 설정합니다. 수동 `/approve` 명령도 승인 처리 전에 일반적인 WhatsApp 발신자 권한 부여 경로를 거칩니다.

## Plugin 훅과 개인정보 보호

수신 WhatsApp 메시지에는 개인 콘텐츠, 전화번호, 그룹 식별자, 발신자 이름 및 세션 상관관계 필드가 포함될 수 있습니다. 명시적으로 동의하지 않는 한 WhatsApp은 수신 `message_received` 훅 페이로드를 Plugin에 브로드캐스트하지 않습니다.

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

`channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 아래에서 동의 범위를 하나의 계정으로 제한하십시오. 수신 WhatsApp 콘텐츠와 식별자를 신뢰할 수 있는 Plugin에만 이 기능을 활성화하십시오.

## 접근 제어 및 활성화

<Tabs>
  <Tab title="DM 정책">
    `channels.whatsapp.dmPolicy`:

    | 값 | 동작 |
    | --- | --- |
    | `pairing` (기본값) | 알 수 없는 발신자가 페어링을 요청하며 소유자가 승인함 |
    | `allowlist` | `allowFrom` 발신자만 허용됨 |
    | `open` | `allowFrom`에 `"*"`이 포함되어야 함 |
    | `disabled` | 모든 DM 차단 |

    `allowFrom`은 E.164 형식의 번호를 허용합니다(내부적으로 정규화됨). 이는 DM 발신자 접근 제어 목록일 뿐이며, 그룹 JID 또는 `@newsletter` 채널 JID로의 명시적인 송신 전송을 제한하지 않습니다.

    다중 계정 재정의: `channels.whatsapp.accounts.<id>.dmPolicy`(및 `.allowFrom`)이 해당 계정의 채널 수준 기본값보다 우선합니다.

    런타임 참고 사항:

    - 페어링은 채널 허용 저장소에 유지되며 구성된 `allowFrom`과 병합됩니다
    - 예약된 자동화 및 Heartbeat 수신자 대체는 명시적 전달 대상 또는 구성된 `allowFrom`을 사용합니다. DM 페어링 승인은 암시적인 Cron/Heartbeat 수신자가 아닙니다
    - 허용 목록이 구성되지 않은 경우 연결된 본인 번호가 기본적으로 허용됩니다
    - OpenClaw는 발신 `fromMe` DM(연결된 기기에서 자신에게 보내는 메시지)을 자동으로 페어링하지 않습니다

  </Tab>

  <Tab title="그룹 정책 및 허용 목록">
    그룹 접근에는 두 계층이 있습니다:

    1. **그룹 멤버십 허용 목록**(`channels.whatsapp.groups`): `groups`을 생략하면 모든 그룹이 대상이 될 수 있습니다. 지정하면 그룹 허용 목록으로 작동합니다(`"*"`은 모두 허용).
    2. **그룹 발신자 정책**(`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open`은 발신자 허용 목록을 우회하고, `allowlist`은 `groupAllowFrom`(또는 `*`)과의 일치를 요구하며, `disabled`은 모든 그룹 수신을 차단합니다.

    `groupAllowFrom`이 설정되지 않은 경우 항목이 있으면 발신자 검사는 `allowFrom`으로 대체됩니다. 발신자 허용 목록은 멘션/답장 활성화 전에 평가됩니다.

    `channels.whatsapp` 블록이 전혀 없으면 `channels.defaults.groupPolicy`이 다른 값으로 설정되어 있더라도 런타임은 `groupPolicy: "allowlist"`으로 대체됩니다(경고 로그가 기록됨).

    <Note>
    그룹 멤버십 확인에는 단일 계정용 안전장치가 있습니다. WhatsApp 계정이 하나만 구성되어 있고 해당 `accounts.<id>.groups`이 명시적인 빈 객체(`{}`)이면, 모든 그룹을 조용히 차단하는 대신 이를 "설정되지 않음"으로 간주하고 루트 `channels.whatsapp.groups` 맵으로 대체합니다. 계정이 2개 이상 구성된 경우 명시적인 빈 계정 맵은 빈 상태로 유지되며 대체되지 않습니다. 따라서 한 계정에서 다른 계정에 영향을 주지 않고 의도적으로 모든 그룹을 비활성화할 수 있습니다.
    </Note>

  </Tab>

  <Tab title="멘션 및 /activation">
    그룹 답장에는 기본적으로 멘션이 필요합니다. 멘션 감지에는 다음이 포함됩니다:

    - 봇 ID에 대한 명시적인 WhatsApp 멘션
    - 구성된 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 승인된 그룹 메시지의 수신 음성 메모 전사문
    - 암시적인 봇 답장 감지(답장 발신자가 봇 ID와 일치)

    보안: 인용/답장은 멘션 게이트만 충족하며 발신자 권한을 **부여하지 않습니다**. `groupPolicy: "allowlist"`을 사용하면 허용 목록에 없는 발신자는 허용 목록에 있는 사용자의 메시지에 답장하더라도 계속 차단됩니다.

    세션 수준 활성화 명령: `/activation mention` 또는 `/activation always`. 이 명령은 전역 구성이 아닌 세션 상태를 업데이트하며 소유자만 사용할 수 있습니다.

  </Tab>
</Tabs>

## 구성된 ACP 바인딩

WhatsApp은 최상위 `bindings[]`을 통한 영구 ACP 바인딩을 지원합니다:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

직접 채팅은 E.164 번호와 일치하고, 그룹은 WhatsApp 그룹 JID와 일치합니다. OpenClaw가 바인딩된 ACP 세션의 존재를 보장하기 전에 그룹 허용 목록, 발신자 정책 및 멘션/활성화 게이트가 실행됩니다. 일치한 바인딩이 경로를 소유하므로 브로드캐스트 그룹은 해당 턴을 일반 WhatsApp 세션으로 분산하지 않습니다.

## 개인 번호 및 자신과의 채팅 동작

연결된 본인 번호가 `allowFrom`에도 있으면 자신과의 채팅 보호 장치가 활성화됩니다. 자신과의 채팅 턴에서는 읽음 확인을 건너뛰고, 자신에게 알림을 보내게 되는 멘션 JID 자동 트리거 동작을 무시하며, `messages.responsePrefix`이 설정되지 않은 경우 답장의 기본 대상을 `[{identity.name}]`(또는 `[openclaw]`)으로 지정합니다.

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="수신 엔벌로프 및 답장 컨텍스트">
    수신 메시지는 공유 수신 엔벌로프로 래핑됩니다. 인용 답장에는 다음 형식으로 컨텍스트가 추가됩니다:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    가능한 경우 답장 메타데이터(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 발신자 JID/E.164)가 채워집니다. 인용된 대상이 다운로드 가능한 미디어이면 OpenClaw는 일반 수신 미디어 저장소를 통해 이를 저장하고 `MediaPath`/`MediaType`을 노출하므로, 에이전트는 `<media:image>`만 보는 대신 미디어를 직접 검사할 수 있습니다.

  </Accordion>

  <Accordion title="미디어 자리표시자 및 위치/연락처 추출">
    미디어만 포함된 메시지는 다음 자리표시자로 정규화됩니다: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    본문이 `<media:audio>`뿐인 경우 승인된 그룹 음성 메모는 멘션 게이트 전에 전사되므로, 음성 메모에서 봇 멘션을 말하면 답장을 트리거할 수 있습니다. 전사문에 여전히 봇 멘션이 없으면 원시 자리표시자 대신 대기 중인 그룹 기록에 유지됩니다.

    위치 본문은 간결한 좌표 텍스트로 렌더링됩니다. 위치 레이블/댓글 및 연락처/vCard 세부 정보는 인라인 프롬프트 텍스트가 아니라 펜스로 구분된 신뢰할 수 없는 메타데이터로 렌더링됩니다.

  </Accordion>

  <Accordion title="대기 중인 그룹 기록 삽입">
    처리되지 않은 그룹 메시지는 버퍼링되었다가 봇이 최종적으로 트리거될 때 컨텍스트로 삽입됩니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`, 대체값 `messages.groupChat.historyLimit`
    - `0`은 비활성화합니다

    삽입 마커: `[Chat messages since your last reply - for context]` 및 `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="읽음 확인">
    허용된 수신 메시지에는 기본적으로 활성화됩니다. 전역적으로 비활성화하려면 다음과 같이 설정합니다:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    계정별 재정의: `channels.whatsapp.accounts.<id>.sendReadReceipts`. 전역적으로 활성화되어 있어도 자신과의 채팅 턴에서는 읽음 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전달, 청킹 및 미디어

<AccordionGroup>
  <Accordion title="텍스트 청킹">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline`은 문단 경계(빈 줄)를 우선하며, 이후 길이 제한을 준수하는 청킹으로 대체됩니다

  </Accordion>

  <Accordion title="발신 미디어 동작">
    - 이미지, 동영상, 오디오(PTT 음성 메모) 및 문서 페이로드를 지원합니다
    - 오디오는 `ptt: true`이 포함된 Baileys `audio` 페이로드로 전송되어 눌러서 말하기 음성 메모로 렌더링됩니다. `audioAsVoice`은 답장 페이로드에 유지되므로 TTS 음성 메모 출력은 제공자의 원본 형식과 관계없이 이 경로를 계속 사용합니다
    - 네이티브 Ogg/Opus 오디오는 `audio/ogg; codecs=opus`로 전송됩니다. 그 밖의 형식(Microsoft Edge TTS MP3/WebM 출력 포함)은 PTT 전달 전에 `ffmpeg`을 사용하여 48 kHz 모노 Ogg/Opus로 트랜스코딩됩니다
    - `/tts latest`은 최신 어시스턴트 답장을 하나의 음성 메모로 전송하고 동일한 답장의 반복 전송을 억제합니다. `/tts chat on|off|default`은 현재 채팅의 자동 TTS를 제어합니다
    - 동영상에서 `gifPlayback: true`을 활성화하면 애니메이션 GIF 재생이 활성화됩니다
    - `forceDocument`/`asDocument`은 WhatsApp의 미디어 압축을 방지하기 위해 발신 이미지, GIF 및 동영상을 Baileys 문서 페이로드를 통해 전송하며, 확인된 파일 이름과 MIME 유형을 보존합니다
    - 여러 미디어가 포함된 답장에서는 첫 번째 미디어 항목에 캡션이 적용됩니다. 단, PTT 음성 메모는 예외로, 오디오가 캡션 없이 먼저 전송된 후 캡션이 별도의 텍스트 메시지로 전송됩니다(WhatsApp 클라이언트가 음성 메모 캡션을 일관되게 렌더링하지 않음)
    - 미디어 소스는 HTTP(S), `file://` 또는 로컬 경로일 수 있습니다

  </Accordion>

  <Accordion title="미디어 크기 제한 및 대체 동작">
    - 수신 저장 한도 및 발신 전송 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 계정별 재정의: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - `forceDocument`/`asDocument`이 문서 전달을 요청하지 않는 한 이미지는 제한에 맞도록 자동 최적화됩니다(크기 조정/품질 탐색)
    - 미디어 전송에 실패하면 첫 번째 항목의 대체 동작으로 응답을 조용히 삭제하는 대신 텍스트 경고를 전송합니다

  </Accordion>
</AccordionGroup>

## 답장 인용

`channels.whatsapp.replyToMode`은 네이티브 답장 인용을 제어합니다(발신 답장에 수신 메시지가 눈에 보이게 인용됨):

| 값                | 동작                                                           |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (기본값) | 인용하지 않고 일반 메시지로 전송합니다                         |
| `"first"`         | 첫 번째 발신 답장 청크만 인용합니다                            |
| `"all"`           | 모든 발신 답장 청크를 인용합니다                               |
| `"batched"`       | 대기열에 있는 일괄 답장을 인용하고 즉시 답장은 인용하지 않습니다 |

계정별 재정의: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 반응 수준

`channels.whatsapp.reactionLevel`은 에이전트가 이모지 반응을 사용하는 범위를 제어합니다:

| 수준                  | 확인 반응 | 에이전트가 시작하는 반응 |
| --------------------- | --------- | ------------------------ |
| `"off"`               | 아니요    | 아니요                   |
| `"ack"`               | 예        | 아니요                   |
| `"minimal"` (기본값) | 예        | 예, 보수적으로 권장      |
| `"extensive"`         | 예        | 예, 적극 권장            |

계정별 재정의: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 확인 반응

`channels.whatsapp.ackReaction`은 수신 시 즉시 반응을 전송하며, `reactionLevel`에 의해 제어됩니다(`"off"`인 경우 억제됨):

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

참고: 수신이 허용된 직후(답장 전)에 전송됩니다. `emoji` 없이 `ackReaction`이 있으면 WhatsApp은 라우팅된 에이전트의 ID 이모지를 사용하고, 없으면 "👀"으로 대체합니다(확인 반응을 사용하지 않으려면 `ackReaction`을 생략하거나 `emoji: ""`으로 설정). 실패는 기록되지만 답장 전달을 차단하지 않습니다. 그룹 모드 `mentions`은 멘션으로 트리거된 턴에만 반응하지만, 그룹 활성화 `always`은 이 검사를 우회합니다. WhatsApp은 `channels.whatsapp.ackReaction`만 사용합니다(레거시 `messages.ackReaction`은 여기에 적용되지 않음).

## 수명 주기 상태 반응

`messages.statusReactions.enabled: true`을 설정하면 WhatsApp이 턴 동안 정적인 수신 확인 이모지를 그대로 두는 대신 확인 반응을 교체하며, 대기 중, 생각 중, 도구 활동, Compaction, 완료, 오류 등의 상태를 순환합니다:

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

참고: `channels.whatsapp.ackReaction`은 직접 메시지와 그룹의 적용 대상 여부를 계속 제어합니다. 대기 중 상태는 일반 확인 반응과 동일한 유효 이모지를 사용합니다. WhatsApp은 메시지마다 봇 반응 슬롯이 하나이므로 수명 주기 업데이트가 현재 반응을 제자리에서 교체합니다. `messages.removeAckAfterReply: true`은 구성된 완료/오류 유지 시간이 지난 후 최종 상태 반응을 제거합니다. 도구 이모지 범주에는 `tool`, `coding`, `web`, `deploy`, `build` 및 `concierge`이 포함됩니다.

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="계정 선택 및 기본값">
    계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다. 기본 계정은 `default`이 있으면 이를 선택하고, 없으면 구성된 계정 ID 중 알파벳순으로 정렬했을 때 첫 번째 항목을 선택합니다. 조회를 위해 계정 ID는 내부적으로 정규화됩니다.
  </Accordion>

  <Accordion title="자격 증명 경로 및 레거시 호환성">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (백업: `creds.json.bak`)
    - `~/.openclaw/credentials/`의 레거시 기본 인증은 기본 계정 흐름에서 계속 인식되고 마이그레이션됩니다.

  </Accordion>

  <Accordion title="로그아웃 동작">
    `openclaw channels logout --channel whatsapp [--account <id>]`은 해당 계정의 WhatsApp 인증 상태를 지웁니다. Gateway에 연결할 수 있으면 로그아웃 시 먼저 해당 계정의 활성 리스너를 중지하므로, 다음 재시작 전에 연결된 세션이 메시지 수신을 중단합니다. `openclaw channels remove --channel whatsapp`도 계정 구성을 비활성화하거나 삭제하기 전에 활성 리스너를 중지합니다.

    레거시 인증 디렉터리에서는 `oauth.json`을 보존하면서 Baileys 인증 파일을 제거합니다.

  </Accordion>
</AccordionGroup>

## 도구, 작업 및 구성 쓰기

- 에이전트 도구는 WhatsApp 반응 작업(`react`)을 지원합니다.
- 작업 게이트: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls`(기존 작업의 기본값은 `true`), `channels.whatsapp.actions.calls`(기본값 `false`, 위의 MeowCaller 참조).
- 채널에서 시작하는 구성 쓰기는 기본적으로 활성화됩니다. `channels.whatsapp.configWrites: false`을 통해 비활성화하십시오.

## 문제 해결

<AccordionGroup>
  <Accordion title="연결되지 않음(QR 필요)">
    증상: 채널 상태가 연결되지 않았다고 보고합니다.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="연결되었지만 접속이 끊김/재연결 반복">
    증상: 연결된 계정에서 접속 끊김 또는 재연결 시도가 반복됩니다.

    활동이 적은 계정은 일반적인 메시지 제한 시간을 지나서도 연결 상태를 유지할 수 있습니다. 감시 장치는 WhatsApp Web 전송 활동이 중단되거나, 소켓이 닫히거나, 애플리케이션 수준의 활동이 더 긴 안전 시간 범위를 넘어 계속 없을 때만 재시작합니다(위의 런타임 모델 참조).

    로그에 `status=408 Request Time-out Connection was lost`이 반복해서 표시되면 `web.whatsapp` 아래에서 Baileys 소켓 시간 설정을 조정하십시오. 먼저 `keepAliveIntervalMs`을 네트워크의 유휴 제한 시간보다 짧게 설정하고, 느리거나 손실이 많은 연결에서는 `connectTimeoutMs`을 늘리십시오.

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

    해결 방법:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    호스트 연결과 시간 설정을 수정한 후에도 반복이 계속되면 계정 인증 디렉터리를 백업하고 다시 연결하십시오.

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log`에 `Gateway inactive`이 표시되지만 `openclaw gateway status`과 `openclaw channels status --probe`가 모두 정상으로 표시되면 `openclaw doctor`을 실행하십시오. Linux에서는 폐기된 `~/.openclaw/bin/ensure-whatsapp.sh` 스크립트를 호출하는 레거시 crontab 항목에 대해 doctor가 경고합니다. `crontab -e`을 사용하여 해당 항목을 제거하십시오. cron에는 systemd 사용자 버스 환경이 없을 수 있으므로 이전 스크립트가 Gateway 상태를 잘못 보고할 수 있습니다.

  </Accordion>

  <Accordion title="프록시 뒤에서 QR 로그인 시간 초과">
    증상: `openclaw channels login --channel whatsapp`이 사용 가능한 QR을 표시하기 전에 `status=408 Request Time-out` 또는 TLS 소켓 연결 끊김과 함께 실패합니다.

    WhatsApp Web 로그인은 Gateway 호스트의 표준 프록시 환경(`HTTPS_PROXY`, `HTTP_PROXY`, 소문자 변형, `NO_PROXY`)을 사용합니다. Gateway 프로세스가 프록시 환경을 상속하는지, 그리고 `NO_PROXY`이 `mmg.whatsapp.net`과 일치하지 않는지 확인하십시오.

  </Accordion>

  <Accordion title="전송 시 활성 리스너 없음">
    대상 계정에 활성 Gateway 리스너가 없으면 발신 전송이 즉시 실패합니다. Gateway가 실행 중이고 계정이 연결되어 있는지 확인하십시오.
  </Accordion>

  <Accordion title="응답이 대화 기록에는 표시되지만 WhatsApp에는 표시되지 않음">
    대화 기록 행에는 에이전트가 생성한 내용이 기록되며, WhatsApp 전달은 별도로 확인됩니다. OpenClaw는 표시되는 텍스트 또는 미디어 전송 중 하나 이상에 대해 Baileys가 발신 메시지 ID를 반환한 후에만 자동 응답을 전송된 것으로 처리합니다.

    확인 반응은 응답 전에 독립적으로 전송되는 수신 확인입니다. 반응에 성공했다고 해서 이후 텍스트/미디어 응답이 수락되었다는 의미는 아닙니다. Gateway 로그에서 `auto-reply delivery failed` 또는 `auto-reply was not accepted by WhatsApp provider`을 확인하십시오.

  </Accordion>

  <Accordion title="그룹 메시지가 예기치 않게 무시됨">
    다음 순서로 확인하십시오. `groupPolicy`, `groupAllowFrom`/`allowFrom`, `groups` 허용 목록 항목, 멘션 게이트(`requireMention` + 멘션 패턴), `openclaw.json`의 중복 키(JSON5에서는 뒤의 항목이 앞의 항목을 재정의하므로 범위마다 `groupPolicy`을 하나만 유지하십시오).

    `channels.whatsapp.groups`이 있으면 WhatsApp은 다른 그룹의 메시지를 계속 관찰할 수 있지만 OpenClaw는 세션 라우팅 전에 해당 메시지를 삭제합니다. 그룹 JID를 `channels.whatsapp.groups`에 추가하거나, `groupPolicy`/`groupAllowFrom`에서 발신자 권한 부여를 유지하면서 모든 그룹을 허용하려면 `groups["*"]`을 추가하십시오.

  </Accordion>

  <Accordion title="Bun 런타임 경고">
    OpenClaw Gateway에는 Node가 필요합니다. Bun은 표준 상태 저장소에서 사용하는 `node:sqlite` API를 제공하지 않으며, doctor는 레거시 Bun 서비스를 Node로 마이그레이션합니다.
  </Accordion>
</AccordionGroup>

## 시스템 프롬프트

WhatsApp은 `groups` 및 `direct` 맵을 통해 그룹과 일대일 채팅에서 Telegram 방식의 시스템 프롬프트를 지원합니다.

그룹 메시지의 해석: 먼저 유효한 `groups` 맵을 결정합니다. 계정이 자체 `groups` 키를 하나라도 정의하면 루트 `groups` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 프롬프트 조회는 이렇게 만들어진 단일 맵에서 실행됩니다.

1. **그룹별 프롬프트**(`groups["<groupId>"].systemPrompt`): 그룹 항목이 존재하고 **동시에** 해당 `systemPrompt` 키가 정의되어 있을 때 사용합니다. 빈 문자열(`""`)은 와일드카드를 억제하며 프롬프트를 적용하지 않습니다.
2. **그룹 와일드카드 프롬프트**(`groups["*"].systemPrompt`): 특정 그룹 항목이 없거나, 항목은 있지만 `systemPrompt` 키가 없을 때 사용합니다.

일대일 메시지의 해석은 `direct` 맵과 `direct["*"]`에 대해 동일한 패턴을 따릅니다.

<Note>
`dms`은 DM별 간단한 기록 재정의 버킷(`dms.<id>.historyLimit`)으로 유지됩니다. 프롬프트 재정의는 `direct` 아래에 있습니다.
</Note>

<Note>
프롬프트 해석에서 계정이 루트를 대체하는 이 동작은 단순한 얕은 재정의입니다. 명시적인 빈 객체를 포함하여 계정의 `groups`/`direct` 키는 루트 맵을 대체합니다. 이는 위에서 설명한 그룹 멤버십 허용 목록 검사와 다릅니다. 해당 검사에는 실수로 비어 있는 `groups: {}`에 대한 단일 계정 안전망이 있습니다.
</Note>

**Telegram과의 차이점:** Telegram은 봇이 속하지 않은 그룹의 그룹 메시지를 수신하지 않도록 다중 계정 설정의 모든 계정에서 루트 `groups`을 억제합니다(자체 `groups`이 없는 계정도 포함). WhatsApp은 이 보호 장치를 적용하지 않습니다. 자체 재정의가 없는 모든 계정은 계정 수와 관계없이 루트 `groups`/`direct`을 상속합니다. 다중 계정 WhatsApp 설정에서 계정별 프롬프트를 사용하려면 각 계정 아래에 전체 맵을 명시적으로 정의하십시오.

중요한 동작:

- `channels.whatsapp.groups`은 그룹별 구성 맵이면서 채팅 수준의 그룹 허용 목록이기도 합니다. 루트 또는 계정 범위에서 `groups["*"]`은 해당 범위에서 "모든 그룹이 허용됨"을 의미합니다.
- 해당 범위에서 이미 모든 그룹을 허용하려는 경우에만 와일드카드 `systemPrompt`을 추가하십시오. 정해진 그룹 ID 집합만 허용하려면 `groups["*"]`을 사용하는 대신 명시적으로 허용 목록에 추가한 각 항목에 프롬프트를 반복해서 지정하십시오.
- 그룹 허용과 발신자 권한 부여는 별개의 검사입니다. `groups["*"]`은 그룹 처리에 도달하는 그룹의 범위를 넓히지만 해당 그룹의 모든 발신자에게 권한을 부여하지는 않습니다. 발신자 권한은 계속 `groupPolicy`/`groupAllowFrom`에서 제어합니다.
- `channels.whatsapp.direct`은 DM에서 이에 상응하는 부수 효과가 없습니다. `direct["*"]`은 DM이 `dmPolicy`과 `allowFrom` 또는 페어링 저장소 규칙에 의해 이미 허용된 후에만 기본 구성을 제공합니다.

예:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 루트 범위에서 모든 그룹을 허용해야 하는 경우에만 사용합니다.
        // 자체 groups 맵을 정의하지 않은 모든 계정에 적용됩니다.
        "*": { systemPrompt: "모든 그룹에 대한 기본 프롬프트입니다." },
      },
      direct: {
        // 자체 direct 맵을 정의하지 않은 모든 계정에 적용됩니다.
        "*": { systemPrompt: "모든 일대일 채팅에 대한 기본 프롬프트입니다." },
      },
      accounts: {
        work: {
          groups: {
            // 이 계정은 자체 groups를 정의하므로 루트 groups가 완전히
            // 대체됩니다. 와일드카드를 유지하려면 여기에도 "*"를 명시적으로 정의하십시오.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "프로젝트 관리에 집중하십시오.",
            },
            // 이 계정에서 모든 그룹을 허용해야 하는 경우에만 사용합니다.
            "*": { systemPrompt: "업무 그룹에 대한 기본 프롬프트입니다." },
          },
          direct: {
            // 이 계정은 자체 direct 맵을 정의하므로 루트 direct 항목이
            // 완전히 대체됩니다. 와일드카드를 유지하려면 여기에도 "*"를 명시적으로 정의하십시오.
            "+15551234567": { systemPrompt: "특정 업무용 일대일 채팅에 대한 프롬프트입니다." },
            "*": { systemPrompt: "업무용 일대일 채팅에 대한 기본 프롬프트입니다." },
          },
        },
      },
    },
  },
}
```

## 구성 참조 안내

주요 참조: [구성 참조 - WhatsApp](/ko/gateway/config-channels#whatsapp)

| 영역             | 필드                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 액세스           | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| 전달             | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| 다중 계정        | `accounts.<id>.enabled`, `accounts.<id>.authDir` 및 기타 계정별 재정의                              |
| 운영             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| 세션 동작        | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| 프롬프트         | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## 관련 문서

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [보안](/ko/gateway/security)
- [채널 라우팅](/ko/channels/channel-routing)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [문제 해결](/ko/channels/troubleshooting)
