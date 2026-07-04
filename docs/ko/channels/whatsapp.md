---
read_when:
    - WhatsApp/웹 채널 동작 또는 받은 편지함 라우팅 작업
summary: WhatsApp 채널 지원, 접근 제어, 전달 동작 및 운영
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

상태: WhatsApp Web(Baileys)을 통해 프로덕션 준비 완료. Gateway가 연결된 세션을 소유합니다.

## 설치(필요 시)

- 온보딩(`openclaw onboard`)과 `openclaw channels add --channel whatsapp`는
  WhatsApp Plugin을 처음 선택할 때 설치하라는 프롬프트를 표시합니다.
- `openclaw channels login --channel whatsapp`도 Plugin이 아직 없으면 설치 흐름을
  제공합니다.
- Dev 채널 + git 체크아웃: 기본값은 로컬 Plugin 경로입니다.
- Stable/Beta: 먼저 ClawHub에서 공식 `@openclaw/whatsapp` Plugin을 설치하고,
  npm을 대체 경로로 사용합니다.
- WhatsApp 런타임은 코어 OpenClaw npm 패키지 외부에서 배포되므로
  WhatsApp 전용 런타임 의존성이 외부 Plugin에 남아 있습니다.

수동 설치도 계속 사용할 수 있습니다.

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

레지스트리 대체 경로가 필요할 때만 순수 npm 패키지(`@openclaw/whatsapp`)를
사용하세요. 재현 가능한 설치가 필요할 때만 정확한 버전을 고정하세요.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ko/channels/pairing">
    알 수 없는 발신자에 대한 기본 DM 정책은 페어링입니다.
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

    현재 로그인은 QR 기반입니다. 원격 또는 헤드리스 환경에서는 로그인을 시작하기 전에
    스캔할 휴대폰으로 실시간 QR 코드를 전달할 신뢰할 수 있는 경로가 있는지
    확인하세요.

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
OpenClaw는 가능하면 별도 번호로 WhatsApp을 실행할 것을 권장합니다. (채널 메타데이터와 설정 흐름은 해당 설정에 최적화되어 있지만, 개인 번호 설정도 지원됩니다.)
</Note>

<Warning>
현재 WhatsApp 설정 흐름은 QR 전용입니다. 터미널에 렌더링된 QR, 스크린샷,
PDF 또는 채팅 첨부 파일은 원격 머신에서 전달되는 동안 만료되거나 읽을 수 없게 될 수 있습니다.
원격/헤드리스 호스트에서는 수동 터미널 캡처보다 직접 QR 이미지 전달 경로를
선호하세요.
</Warning>

## MeowCaller로 현재 요청자에게 전화 걸기(실험적)

WhatsApp Plugin은 WhatsApp에서 시작된 에이전트 턴에서 `whatsapp_call`을 노출할 수 있습니다. 이 도구는
[MeowCaller](https://github.com/purpshell/meowcaller)를 사용해 현재 승인된 요청자에게 WhatsApp 음성 통화를 걸고,
상대가 응답한 뒤 OpenClaw TTS 메시지를 재생합니다. 이 도구는 대상 번호를 받지 않으므로
프롬프트가 통화를 제3자에게 리디렉션할 수 없습니다. 이 실험적 기능은 기본적으로 비활성화되어 있습니다.

<Warning>
MeowCaller는 실험적이며, 태그된 릴리스가 없고, 별도로 페어링된 whatsmeow
연결 기기 세션을 사용합니다. WhatsApp Plugin의 Baileys 자격 증명을 재사용할 수 없습니다. 페어링은
동일한 WhatsApp 계정에 또 다른 연결 기기를 추가합니다. OpenClaw에서 사용하는 WhatsApp ID로
스캔하세요. 개인 번호/셀프 채팅 모드는 자기 자신에게 전화할 수 없습니다. 전용 OpenClaw 번호를 사용해
개인 번호로 전화하세요.
</Warning>

<Steps>
  <Step title="Enable experimental calls">

    `openclaw.json`의 WhatsApp 채널에 `actions.calls: true`를 추가하세요.

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

    이를 기존 WhatsApp 구성에 병합한 다음 Gateway를 다시 시작하세요. 설정이
    없거나 `false`이면 OpenClaw는 에이전트에 `whatsapp_call` 도구를 노출하지 않습니다.

  </Step>

  <Step title="Install the reviewed MeowCaller CLI">

    어댑터는 Gateway 호스트의 `PATH`에 `meowcaller`라는 실행 파일이 있다고 예상합니다.
    [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7)이 병합되기 전까지는
    커밋 `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`의 검토된 브랜치를 빌드하세요.

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin`이 Gateway 서비스의 `PATH`에도 포함되어 있는지 확인하세요. 이 리비전은
    명시적인 `pair`와 송신 전용 `notify` 명령을 제공합니다. `notify`는 마이크, 스피커,
    비디오 장치, 수신 오디오 싱크 또는 진단 캡처를 열지 않습니다. 예시
    CLI의 `play` 명령으로 대체하지 마세요.

  </Step>

  <Step title="Pair the MeowCaller linked device">

    WhatsApp 에이전트에게 통화 설정을 확인하도록 요청하세요. `whatsapp_call` 상태 작업은
    계정별 상태 디렉터리와 페어링 명령을 보고합니다. 기본 계정의 경우:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    명령을 대화형 터미널에서 실행하세요. **WhatsApp > Linked devices**에서 해당 QR을 스캔하고
    `MeowCaller linked device ready`가 표시될 때까지 기다리세요. 그러면 명령이 종료됩니다. `wa-voip.db`는
    MeowCaller 연결 기기 세션이므로 비공개로 유지하세요. 기본 계정이 아닌 계정을 사용하는 경우
    `whatsapp_call` 상태 작업은 계정별 명령과 셸을 반환합니다. Windows에서는 해당 PowerShell 명령을
    실행하세요. MeowCaller가 저장소 디렉터리를 만듭니다.

  </Step>

  <Step title="Configure TTS and call from WhatsApp">

    전화 통화가 가능한 [TTS 제공자](/ko/tools/tts)를 구성하고 Gateway를 다시 시작한 다음,
    `Call me and say the build finished.`와 같은 WhatsApp 요청을 보내세요. 도구는 신뢰된
    인바운드 컨텍스트에서 발신자를 확인하고, 임시 비공개 WAV 파일을 합성하고, 제한된 통화 시간 동안
    MeowCaller를 실행한 뒤 오디오 파일을 삭제합니다. OpenClaw는 계정의 저장소를
    명시적으로 전달하고, 응답, 재생, 종료 후 종료 상태 0을 기다리며, 시간 초과 또는 0이 아닌 종료를
    실패한 도구 호출로 처리합니다.

  </Step>
</Steps>

현재 제한 사항:

- 일대일 발신 오디오 통화만 지원
- 임의의 대상 번호 없음
- 채팅 연결과 인증 공유 없음
- 개인 번호/셀프 채팅 모드에서 자기 자신에게 전화 불가
- 합성 오디오는 60초로 제한
- MeowCaller의 응답/재생/종료 완료 외에 휴대폰 측 청취 가능 여부 수신 확인 없음
- OpenClaw는 MeowCaller의 연결, 응답, 재생, 종료 단계를 포함해 제한된 115~175초 창 이후
  동반 프로세스를 중지합니다

## 배포 패턴

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    가장 깔끔한 운영 모드입니다.

    - OpenClaw용 별도 WhatsApp ID
    - 더 명확한 DM 허용 목록과 라우팅 경계
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

  <Accordion title="Personal-number fallback">
    온보딩은 개인 번호 모드를 지원하며 셀프 채팅에 적합한 기준 구성을 작성합니다.

    - `dmPolicy: "allowlist"`
    - `allowFrom`에 개인 번호 포함
    - `selfChatMode: true`

    런타임에서 셀프 채팅 보호는 연결된 자기 번호와 `allowFrom`을 기준으로 동작합니다.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    현재 OpenClaw 채널 아키텍처에서 메시징 플랫폼 채널은 WhatsApp Web 기반(`Baileys`)입니다.

    내장 채팅 채널 레지스트리에는 별도의 Twilio WhatsApp 메시징 채널이 없습니다.

  </Accordion>
</AccordionGroup>

## 런타임 모델

- Gateway가 WhatsApp 소켓과 재연결 루프를 소유합니다.
- 재연결 워치독은 인바운드 앱 메시지 양만이 아니라 WhatsApp Web 전송 활동을 사용하므로, 조용한 연결 기기 세션은 최근에 아무도 메시지를 보내지 않았다는 이유만으로 다시 시작되지 않습니다. 더 긴 애플리케이션 무응답 상한은 전송 프레임이 계속 도착하지만 워치독 창 동안 애플리케이션 메시지가 처리되지 않으면 여전히 재연결을 강제합니다. 최근 활성 세션에 대한 일시적 재연결 후에는 해당 애플리케이션 무응답 확인이 첫 복구 창에 일반 메시지 시간 제한을 사용합니다.
- Baileys 소켓 타이밍은 `web.whatsapp.*` 아래에 명시됩니다. `keepAliveIntervalMs`는 WhatsApp Web 애플리케이션 ping을 제어하고, `connectTimeoutMs`는 시작 핸드셰이크 시간 제한을 제어하며, `defaultQueryTimeoutMs`는 Baileys 쿼리 대기와 OpenClaw의 로컬 발신 전송/프레즌스 및 인바운드 읽음 확인 작업 한계를 제어합니다.
- 발신 전송에는 대상 계정에 대한 활성 WhatsApp 리스너가 필요합니다.
- 그룹 전송은 텍스트와 미디어 캡션에서 `@+<digits>` 및 `@<digits>` 토큰이 LID 기반 그룹을 포함한 현재 WhatsApp 참여자 메타데이터와 일치할 때 네이티브 멘션 메타데이터를 첨부합니다.
- 상태 및 브로드캐스트 채팅은 무시됩니다(`@status`, `@broadcast`).
- 재연결 워치독은 인바운드 앱 메시지 양만이 아니라 WhatsApp Web 전송 활동을 따릅니다. 조용한 연결 기기 세션은 전송 프레임이 계속되는 동안 유지되지만, 전송 중단은 이후 원격 연결 해제 경로보다 훨씬 먼저 재연결을 강제합니다.
- 직접 채팅은 DM 세션 규칙을 사용합니다(`session.dmScope`; 기본값 `main`은 DM을 에이전트 메인 세션으로 접습니다).
- 그룹 세션은 격리됩니다(`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters는 네이티브 `@newsletter` JID를 사용하는 명시적 발신 대상이 될 수 있습니다. 발신 뉴스레터 전송은 DM 세션 의미론이 아니라 채널 세션 메타데이터(`agent:<agentId>:whatsapp:channel:<jid>`)를 사용합니다.
- WhatsApp Web 전송은 Gateway 호스트의 표준 프록시 환경 변수(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / 소문자 변형)를 존중합니다. 채널별 WhatsApp 프록시 설정보다 호스트 수준 프록시 구성을 선호하세요.
- `messages.removeAckAfterReply`가 활성화되면 OpenClaw는 표시되는 답장이 전달된 후 WhatsApp 확인 반응을 지웁니다.

## 승인 프롬프트

WhatsApp은 `👍` / `👎` 반응으로 exec 및 Plugin 승인 프롬프트를 렌더링할 수 있습니다. 전달은
최상위 승인 전달 구성으로 제어됩니다.

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

`approvals.exec`와 `approvals.plugin`은 독립적입니다. WhatsApp을 채널로 활성화하는 것은
전송만 연결합니다. 일치하는 승인 계열이 활성화되어 있고 WhatsApp으로 라우팅되지 않는 한
승인 프롬프트를 보내지 않습니다. 세션 모드는 WhatsApp에서 시작된 승인에 대해서만
네이티브 이모지 승인을 전달합니다. 대상 모드는 명시적 WhatsApp 대상에 공유 전달 파이프라인을
사용하며 별도의 승인자 DM 팬아웃을 만들지 않습니다.

WhatsApp 승인 반응에는 `allowFrom` 또는 `"*"`의 명시적 WhatsApp 승인자가 필요합니다.
`defaultTo`는 일반 기본 메시지 대상을 제어합니다. 승인 승인자가 아닙니다. 수동
`/approve` 명령도 승인 해석 전에 일반 WhatsApp 발신자 권한 부여 경로를
통과합니다.

## Plugin 훅과 개인정보 보호

WhatsApp 인바운드 메시지에는 개인 메시지 내용, 전화번호,
그룹 식별자, 발신자 이름, 세션 상관관계 필드가 포함될 수 있습니다. 따라서
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

옵트인을 한 계정으로 범위 지정할 수 있습니다.

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

인바운드 WhatsApp 메시지 내용과 식별자를 수신해도 신뢰할 수 있는 Plugin에만
이 설정을 활성화하세요.

## 액세스 제어 및 활성화

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy`는 직접 채팅 액세스를 제어합니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    `allowFrom`은 E.164 형식 번호를 허용합니다(내부적으로 정규화됨).

    `allowFrom`은 DM 발신자 액세스 제어 목록입니다. WhatsApp 그룹 JID 또는 `@newsletter` 채널 JID로 명시적으로 보내는 아웃바운드 전송을 제한하지 않습니다.

    다중 계정 재정의: `channels.whatsapp.accounts.<id>.dmPolicy`(및 `allowFrom`)는 해당 계정의 채널 수준 기본값보다 우선합니다.

    런타임 동작 세부 정보:

    - 페어링은 채널 허용 저장소에 유지되며 구성된 `allowFrom`과 병합됩니다
    - 예약된 자동화와 Heartbeat 수신자 폴백은 명시적 전달 대상 또는 구성된 `allowFrom`을 사용합니다. DM 페어링 승인은 암시적인 Cron 또는 Heartbeat 수신자가 아닙니다
    - 허용 목록이 구성되지 않은 경우, 연결된 자기 번호가 기본적으로 허용됩니다
    - OpenClaw는 아웃바운드 `fromMe` DM(연결된 기기에서 자신에게 보내는 메시지)을 자동 페어링하지 않습니다

  </Tab>

  <Tab title="Group policy + allowlists">
    그룹 액세스에는 두 계층이 있습니다.

    1. **그룹 멤버십 허용 목록**(`channels.whatsapp.groups`)
       - `groups`가 생략되면 모든 그룹이 대상이 될 수 있습니다
       - `groups`가 있으면 그룹 허용 목록으로 동작합니다(`"*"` 허용)

    2. **그룹 발신자 정책**(`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 발신자 허용 목록을 우회합니다
       - `allowlist`: 발신자가 `groupAllowFrom`(또는 `*`)과 일치해야 합니다
       - `disabled`: 모든 그룹 인바운드를 차단합니다

    발신자 허용 목록 폴백:

    - `groupAllowFrom`이 설정되지 않은 경우 런타임은 사용 가능할 때 `allowFrom`으로 폴백합니다
    - 발신자 허용 목록은 멘션/답장 활성화 전에 평가됩니다

    참고: `channels.whatsapp` 블록이 전혀 없으면, `channels.defaults.groupPolicy`가 설정되어 있어도 런타임 그룹 정책 폴백은 `allowlist`입니다(경고 로그 포함).

  </Tab>

  <Tab title="Mentions + /activation">
    그룹 답장은 기본적으로 멘션이 필요합니다.

    멘션 감지는 다음을 포함합니다.

    - 봇 ID에 대한 명시적 WhatsApp 멘션
    - 구성된 멘션 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 승인된 그룹 메시지의 인바운드 음성 메모 전사
    - 암시적 봇 답장 감지(답장 발신자가 봇 ID와 일치)

    보안 참고:

    - 인용/답장은 멘션 게이트만 충족합니다. 발신자 권한을 부여하지는 **않습니다**
    - `groupPolicy: "allowlist"`에서는 허용 목록에 없는 발신자가 허용 목록 사용자의 메시지에 답장해도 여전히 차단됩니다

    세션 수준 활성화 명령:

    - `/activation mention`
    - `/activation always`

    `activation`은 세션 상태를 업데이트합니다(전역 구성 아님). 소유자 게이트가 적용됩니다.

  </Tab>
</Tabs>

## 구성된 ACP 바인딩

WhatsApp은 최상위 `bindings[]` 항목으로 영구 ACP 바인딩을 지원합니다.

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

- 직접 채팅은 `+15555550123` 같은 E.164 번호와 일치합니다.
- 그룹은 `120363424282127706@g.us` 같은 WhatsApp 그룹 JID와 일치합니다.
- 그룹 허용 목록, 발신자 정책, 멘션 또는 활성화 게이트는 OpenClaw가 구성된 ACP 세션이 존재하는지 확인하기 전에 실행됩니다.
- 일치한 구성된 ACP 바인딩이 라우트를 소유합니다. WhatsApp 브로드캐스트 그룹은 해당 턴을 일반 WhatsApp 세션으로 팬아웃하지 않습니다.

## 개인 번호 및 자기 채팅 동작

연결된 자기 번호가 `allowFrom`에도 있으면 WhatsApp 자기 채팅 보호 장치가 활성화됩니다.

- 자기 채팅 턴의 읽음 확인 건너뛰기
- 자신을 핑하게 될 멘션 JID 자동 트리거 동작 무시
- `messages.responsePrefix`가 설정되지 않은 경우 자기 채팅 답장은 기본적으로 `[{identity.name}]` 또는 `[openclaw]`가 됩니다

## 메시지 정규화 및 컨텍스트

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    수신 WhatsApp 메시지는 공유 인바운드 봉투로 래핑됩니다.

    인용된 답장이 있으면 컨텍스트가 다음 형식으로 추가됩니다.

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    사용 가능한 경우 답장 메타데이터 필드도 채워집니다(`ReplyToId`, `ReplyToBody`, `ReplyToSender`, 발신자 JID/E.164).
    인용된 답장 대상이 다운로드 가능한 미디어인 경우, OpenClaw는 이를
    일반 인바운드 미디어 저장소를 통해 저장하고 `MediaPath`/`MediaType`으로 노출하여
    에이전트가 `<media:image>`만 보는 대신 참조된 이미지를 검사할 수 있게 합니다.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    미디어만 포함된 인바운드 메시지는 다음과 같은 플레이스홀더로 정규화됩니다.

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    승인된 그룹 음성 메모는 본문이 `<media:audio>`뿐일 때 멘션 게이트 전에
    전사되므로, 음성 메모에서 봇을 멘션하면 답장을 트리거할 수 있습니다.
    전사 결과에도 봇 멘션이 없으면 원시 플레이스홀더 대신
    전사 내용이 보류 중인 그룹 기록에 보관됩니다.

    위치 본문은 간결한 좌표 텍스트를 사용합니다. 위치 레이블/댓글과 연락처/vCard 세부 정보는 인라인 프롬프트 텍스트가 아니라 펜스 처리된 신뢰할 수 없는 메타데이터로 렌더링됩니다.

  </Accordion>

  <Accordion title="Pending group history injection">
    그룹에서는 처리되지 않은 메시지를 버퍼링했다가 봇이 최종적으로 트리거될 때 컨텍스트로 주입할 수 있습니다.

    - 기본 제한: `50`
    - 구성: `channels.whatsapp.historyLimit`
    - 폴백: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    주입 마커:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    자기 채팅 턴은 전역적으로 활성화되어 있어도 읽음 확인을 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 전달, 청킹 및 미디어

<AccordionGroup>
  <Accordion title="Text chunking">
    - 기본 청크 제한: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 모드는 문단 경계(빈 줄)를 선호하며, 이후 길이 안전 청킹으로 폴백합니다

  </Accordion>

  <Accordion title="Outbound media behavior">
    - 이미지, 비디오, 오디오(PTT 음성 메모), 문서 페이로드를 지원합니다
    - 오디오 미디어는 Baileys `audio` 페이로드를 통해 `ptt: true`와 함께 전송되므로, WhatsApp 클라이언트는 이를 푸시투토크 음성 메모로 렌더링합니다
    - 답장 페이로드는 `audioAsVoice`를 보존합니다. WhatsApp용 TTS 음성 메모 출력은 제공자가 MP3 또는 WebM을 반환해도 이 PTT 경로를 유지합니다
    - 네이티브 Ogg/Opus 오디오는 음성 메모 호환성을 위해 `audio/ogg; codecs=opus`로 전송됩니다
    - Microsoft Edge TTS MP3/WebM 출력을 포함한 비 Ogg 오디오는 PTT 전달 전에 `ffmpeg`로 48 kHz 모노 Ogg/Opus로 트랜스코딩됩니다
    - `/tts latest`는 최신 어시스턴트 답장을 하나의 음성 메모로 보내고 같은 답장에 대한 반복 전송을 억제합니다. `/tts chat on|off|default`는 현재 WhatsApp 채팅의 자동 TTS를 제어합니다
    - 애니메이션 GIF 재생은 비디오 전송의 `gifPlayback: true`를 통해 지원됩니다
    - `forceDocument` / `asDocument`는 확인된 파일 이름과 MIME 유형을 보존하면서 WhatsApp 미디어 압축을 피하기 위해 아웃바운드 이미지, GIF, 비디오를 Baileys 문서 페이로드로 전송합니다
    - 다중 미디어 답장 페이로드를 보낼 때 캡션은 첫 번째 미디어 항목에 적용됩니다. 단, PTT 음성 메모는 WhatsApp 클라이언트가 음성 메모 캡션을 일관되게 렌더링하지 않으므로 오디오를 먼저 보내고 보이는 텍스트를 별도로 보냅니다
    - 미디어 소스는 HTTP(S), `file://`, 또는 로컬 경로일 수 있습니다

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - 인바운드 미디어 저장 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 아웃바운드 미디어 전송 한도: `channels.whatsapp.mediaMaxMb`(기본값 `50`)
    - 계정별 재정의는 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`를 사용합니다
    - `forceDocument` / `asDocument`가 문서 전달을 요청하지 않는 한 이미지는 한도에 맞게 자동 최적화됩니다(크기 조정/품질 스윕)
    - 미디어 전송 실패 시 첫 항목 폴백은 응답을 조용히 버리는 대신 텍스트 경고를 보냅니다

  </Accordion>
</AccordionGroup>

## 답장 인용

WhatsApp은 아웃바운드 답장이 인바운드 메시지를 눈에 보이게 인용하는 네이티브 답장 인용을 지원합니다. `channels.whatsapp.replyToMode`로 제어하세요.

| 값          | 동작                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 인용하지 않고 일반 메시지로 전송                                      |
| `"first"`   | 첫 번째 아웃바운드 답장 청크만 인용                                   |
| `"all"`     | 모든 아웃바운드 답장 청크 인용                                        |
| `"batched"` | 즉시 답장은 인용하지 않고 대기열의 배치 답장을 인용                   |

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
| `"ack"`       | 예        | 아니요             | 확인 반응만(답장 전 수신 확인)            |
| `"minimal"`   | 예        | 예(보수적)         | 확인 + 보수적 지침의 에이전트 반응        |
| `"extensive"` | 예        | 예(권장됨)         | 확인 + 권장 지침의 에이전트 반응          |

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
확인 반응은 `reactionLevel`에 의해 게이트됩니다. `reactionLevel`이 `"off"`이면 억제됩니다.

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

- 인바운드가 수락된 직후(응답 전)에 전송됩니다.
- `ackReaction`이 `emoji` 없이 있으면 WhatsApp은 라우팅된 에이전트의 식별 이모지를 사용하고, 없으면 "👀"로 대체합니다. 확인 반응을 보내지 않으려면 `ackReaction`을 생략하거나 `emoji: ""`로 설정하세요.
- 실패는 기록되지만 일반 응답 전달을 차단하지 않습니다.
- 그룹 모드 `mentions`는 멘션으로 트리거된 턴에 반응합니다. 그룹 활성화 `always`는 이 검사의 우회로 작동합니다.
- WhatsApp은 `channels.whatsapp.ackReaction`을 사용합니다(레거시 `messages.ackReaction`은 여기에서 사용되지 않음).

## 수명 주기 상태 반응

정적인 수신 확인 이모지를 남기는 대신, 턴 중 WhatsApp이 확인 반응을 교체하도록 하려면 `messages.statusReactions.enabled: true`를 설정하세요. 활성화하면 OpenClaw는 대기열 등록, 생각 중, 도구 활동, Compaction, 완료, 오류 같은 수명 주기 상태에 동일한 인바운드 메시지 반응 슬롯을 사용합니다.

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

동작 참고 사항:

- `channels.whatsapp.ackReaction`은 상태 반응이 다이렉트 메시지와 그룹에서 사용 가능한지 여부를 계속 제어합니다.
- 대기열 상태 반응은 일반 확인 반응과 동일한 유효 확인 이모지를 사용합니다.
- WhatsApp은 메시지당 봇 반응 슬롯이 하나이므로, 수명 주기 업데이트는 현재 반응을 제자리에서 교체합니다.
- `messages.removeAckAfterReply: true`는 구성된 완료/오류 유지 시간이 지난 뒤 최종 상태 반응을 지웁니다.
- 도구 이모지 범주에는 `tool`, `coding`, `web`, `deploy`, `build`, `concierge`가 포함됩니다.

## 다중 계정 및 자격 증명

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - 계정 ID는 `channels.whatsapp.accounts`에서 가져옵니다.
    - 기본 계정 선택: `default`가 있으면 그것을 사용하고, 없으면 구성된 첫 번째 계정 ID(정렬 기준)를 사용합니다.
    - 계정 ID는 조회를 위해 내부적으로 정규화됩니다.

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - 현재 인증 경로: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 백업 파일: `creds.json.bak`
    - `~/.openclaw/credentials/`의 레거시 기본 인증은 기본 계정 흐름에서 여전히 인식되고 마이그레이션됩니다.

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]`는 해당 계정의 WhatsApp 인증 상태를 지웁니다.

    Gateway에 연결할 수 있으면, 로그아웃은 먼저 선택한 계정의 실시간 WhatsApp 리스너를 중지하여 연결된 세션이 다음 재시작까지 메시지를 계속 받지 않도록 합니다. `openclaw channels remove --channel whatsapp`도 계정 구성을 비활성화하거나 삭제하기 전에 실시간 리스너를 중지합니다.

    레거시 인증 디렉터리에서는 Baileys 인증 파일이 제거되는 동안 `oauth.json`은 보존됩니다.

  </Accordion>
</AccordionGroup>

## 도구, 작업 및 구성 쓰기

- 에이전트 도구 지원에는 WhatsApp 반응 작업(`react`)이 포함됩니다.
- 작업 게이트:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 채널에서 시작한 구성 쓰기는 기본적으로 활성화됩니다(`channels.whatsapp.configWrites=false`로 비활성화).

## 문제 해결

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    증상: 채널 상태가 연결되지 않음으로 보고됩니다.

    해결 방법:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    증상: 연결된 계정에서 연결 끊김 또는 재연결 시도가 반복됩니다.

    조용한 계정은 일반 메시지 제한 시간을 지나서도 연결 상태를 유지할 수 있습니다. watchdog은 WhatsApp Web 전송 활동이 중지되거나, 소켓이 닫히거나, 애플리케이션 수준 활동이 더 긴 안전 시간 창을 넘어서도 조용할 때 재시작됩니다.

    로그에 `status=408 Request Time-out Connection was lost`가 반복해서 표시되면 `web.whatsapp` 아래의 Baileys 소켓 타이밍을 조정하세요. 먼저 `keepAliveIntervalMs`를 네트워크의 유휴 제한 시간보다 짧게 줄이고, 느리거나 손실이 있는 링크에서는 `connectTimeoutMs`를 늘리세요.

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

    호스트 연결성과 타이밍을 고친 뒤에도 루프가 지속되면 계정 인증 디렉터리를 백업하고 해당 계정을 다시 연결하세요.

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log`에 `Gateway inactive`가 표시되지만 `openclaw gateway status`와 `openclaw channels status --probe`에서 gateway와 WhatsApp이 정상이라고 표시되면 `openclaw doctor`를 실행하세요. Linux에서는 doctor가 여전히 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출하는 레거시 crontab 항목에 대해 경고합니다. cron에는 systemd 사용자 버스 환경이 없을 수 있고 이로 인해 오래된 스크립트가 gateway 상태를 잘못 보고할 수 있으므로, `crontab -e`로 해당 오래된 항목을 제거하세요.

    필요한 경우 `channels login`으로 다시 연결하세요.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    증상: `openclaw channels login --channel whatsapp`가 사용 가능한 QR 코드를 표시하기 전에 `status=408 Request Time-out` 또는 TLS 소켓 연결 끊김으로 실패합니다.

    WhatsApp Web 로그인은 gateway 호스트의 표준 프록시 환경(`HTTPS_PROXY`, `HTTP_PROXY`, 소문자 변형 및 `NO_PROXY`)을 사용합니다. gateway 프로세스가 프록시 환경을 상속하는지, 그리고 `NO_PROXY`가 `mmg.whatsapp.net`과 일치하지 않는지 확인하세요.

  </Accordion>

  <Accordion title="No active listener when sending">
    대상 계정에 활성 gateway 리스너가 없으면 아웃바운드 전송은 빠르게 실패합니다.

    gateway가 실행 중이고 계정이 연결되어 있는지 확인하세요.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    트랜스크립트 행은 에이전트가 생성한 내용을 기록합니다. WhatsApp 전달은 별도로 확인됩니다. OpenClaw는 Baileys가 하나 이상의 표시 가능한 텍스트 또는 미디어 전송에 대해 아웃바운드 메시지 ID를 반환한 뒤에만 자동 응답을 전송된 것으로 간주합니다.

    확인 반응은 독립적인 응답 전 수신 확인입니다. 반응이 성공했다고 해서 이후의 텍스트 또는 미디어 응답이 WhatsApp에 수락되었음을 증명하지는 않습니다.

    gateway 로그에서 `auto-reply delivery failed` 또는 `auto-reply was not accepted by WhatsApp provider`를 확인하세요.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    다음 순서로 확인하세요.

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 허용 목록 항목
    - 멘션 게이트(`requireMention` + 멘션 패턴)
    - `openclaw.json`(JSON5)의 중복 키: 나중 항목이 이전 항목을 덮어쓰므로 범위마다 `groupPolicy`를 하나만 유지하세요.

    `channels.whatsapp.groups`가 있으면 WhatsApp은 다른 그룹의 메시지를 계속 관찰할 수 있지만, OpenClaw는 세션 라우팅 전에 이를 폐기합니다. `channels.whatsapp.groups`에 그룹 JID를 추가하거나, `groupPolicy`와 `groupAllowFrom` 아래에서 발신자 승인을 유지하면서 모든 그룹을 허용하려면 `groups["*"]`를 추가하세요.

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp gateway 런타임은 Node를 사용해야 합니다. Bun은 안정적인 WhatsApp/Telegram gateway 운영과 호환되지 않는 것으로 표시됩니다.
  </Accordion>
</AccordionGroup>

## 시스템 프롬프트

WhatsApp은 `groups`와 `direct` 맵을 통해 그룹 및 다이렉트 채팅에 Telegram 스타일 시스템 프롬프트를 지원합니다.

그룹 메시지의 해석 계층:

유효한 `groups` 맵이 먼저 결정됩니다. 계정이 자체 `groups`를 정의하면 루트 `groups` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 프롬프트 조회가 결과로 나온 단일 맵에서 실행됩니다.

1. **그룹별 시스템 프롬프트**(`groups["<groupId>"].systemPrompt`): 특정 그룹 항목이 맵에 존재하고 **그리고** 해당 `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트가 적용되지 않습니다.
2. **그룹 와일드카드 시스템 프롬프트**(`groups["*"].systemPrompt`): 특정 그룹 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않을 때 사용됩니다.

다이렉트 메시지의 해석 계층:

유효한 `direct` 맵이 먼저 결정됩니다. 계정이 자체 `direct`를 정의하면 루트 `direct` 맵을 완전히 대체합니다(깊은 병합 없음). 그런 다음 프롬프트 조회가 결과로 나온 단일 맵에서 실행됩니다.

1. **다이렉트별 시스템 프롬프트**(`direct["<peerId>"].systemPrompt`): 특정 피어 항목이 맵에 존재하고 **그리고** 해당 `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 시스템 프롬프트가 적용되지 않습니다.
2. **다이렉트 와일드카드 시스템 프롬프트**(`direct["*"].systemPrompt`): 특정 피어 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않을 때 사용됩니다.

<Note>
`dms`는 DM별 경량 기록 재정의 버킷(`dms.<id>.historyLimit`)으로 유지됩니다. 프롬프트 재정의는 `direct` 아래에 있습니다.
</Note>

**Telegram 다중 계정 동작과의 차이:** Telegram에서는 봇이 자신이 속하지 않은 그룹의 그룹 메시지를 받지 않도록 방지하기 위해, 자체 `groups`를 정의하지 않은 계정까지 포함하여 다중 계정 설정의 모든 계정에서 루트 `groups`가 의도적으로 억제됩니다. WhatsApp은 이 보호를 적용하지 않습니다. 루트 `groups`와 루트 `direct`는 구성된 계정 수와 관계없이 계정 수준 재정의를 정의하지 않은 계정에 항상 상속됩니다. 다중 계정 WhatsApp 설정에서 계정별 그룹 또는 다이렉트 프롬프트를 원하면 루트 수준 기본값에 의존하지 말고 각 계정 아래에 전체 맵을 명시적으로 정의하세요.

중요 동작:

- `channels.whatsapp.groups`는 그룹별 구성 맵이면서 채팅 수준 그룹 허용 목록입니다. 루트 또는 계정 범위에서 `groups["*"]`는 해당 범위에 대해 "모든 그룹이 허용됨"을 의미합니다.
- 해당 범위가 이미 모든 그룹을 허용하기를 원할 때만 와일드카드 그룹 `systemPrompt`를 추가하세요. 여전히 고정된 그룹 ID 집합만 사용 가능하게 하려면 프롬프트 기본값에 `groups["*"]`를 사용하지 마세요. 대신 명시적으로 허용 목록에 올린 각 그룹 항목에 프롬프트를 반복해서 지정하세요.
- 그룹 허용과 발신자 승인은 별도 검사입니다. `groups["*"]`는 그룹 처리에 도달할 수 있는 그룹 집합을 넓히지만, 그 자체로 해당 그룹의 모든 발신자를 승인하지는 않습니다. 발신자 접근은 여전히 `channels.whatsapp.groupPolicy`와 `channels.whatsapp.groupAllowFrom`으로 별도로 제어됩니다.
- `channels.whatsapp.direct`는 DM에 동일한 부작용을 갖지 않습니다. `direct["*"]`는 DM이 `dmPolicy`와 `allowFrom` 또는 페어링 저장소 규칙에 의해 이미 허용된 뒤에만 기본 다이렉트 채팅 구성을 제공합니다.

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

주요 WhatsApp 필드:

- 액세스: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- 전달: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- 다중 계정: `accounts.<id>.enabled`, `accounts.<id>.authDir`, 계정 수준 재정의
- 운영: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- 세션 동작: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- 프롬프트: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## 관련

- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [보안](/ko/gateway/security)
- [채널 라우팅](/ko/channels/channel-routing)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [문제 해결](/ko/channels/troubleshooting)
