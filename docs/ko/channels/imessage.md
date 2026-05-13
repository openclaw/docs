---
read_when:
    - iMessage 지원 설정하기
    - iMessage 송수신 디버깅
summary: imsg(stdio를 통한 JSON-RPC)를 통한 네이티브 iMessage 지원으로, 답장, 탭백, 효과, 첨부 파일, 그룹 관리를 위한 비공개 API 작업을 제공합니다. 호스트 요구 사항을 충족하는 경우 새 OpenClaw iMessage 설정에 권장됩니다.
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage 배포의 경우 로그인된 macOS Messages 호스트에서 `imsg`를 사용하세요. Gateway가 Linux 또는 Windows에서 실행되는 경우, Mac에서 `imsg`를 실행하는 SSH 래퍼를 `channels.imessage.cliPath`로 지정하세요.

**Gateway 다운타임 따라잡기는 옵트인입니다.** 활성화하면(`channels.imessage.catchup.enabled: true`), gateway는 오프라인 상태(충돌, 재시작, Mac 잠자기) 동안 `chat.db`에 도착한 인바운드 메시지를 다음 시작 시 재생합니다. 기본적으로 비활성화되어 있습니다 — [gateway 다운타임 후 따라잡기](#catching-up-after-gateway-downtime)를 참조하세요. [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)를 닫습니다.
</Note>

<Warning>
BlueBubbles 지원은 제거되었습니다. `channels.bluebubbles` 설정을 `channels.imessage`로 마이그레이션하세요. OpenClaw는 `imsg`를 통해서만 iMessage를 지원합니다. 간단한 공지는 [BlueBubbles 제거와 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage)에서, 전체 마이그레이션 표는 [BlueBubbles에서 전환하기](/ko/channels/imessage-from-bluebubbles)에서 시작하세요.
</Warning>

상태: 네이티브 외부 CLI 통합입니다. Gateway는 `imsg rpc`를 생성하고 stdio에서 JSON-RPC로 통신합니다(별도 daemon/port 없음). 고급 작업에는 `imsg launch`와 성공적인 private API 프로브가 필요합니다.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    답장, tapback, 효과, 첨부 파일, 그룹 관리입니다.
  </Card>
  <Card title="Pairing" icon="link" href="/ko/channels/pairing">
    iMessage DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway가 Messages Mac에서 실행되지 않을 때 SSH 래퍼를 사용하세요.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/ko/gateway/config-channels#imessage">
    전체 iMessage 필드 참조입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        페어링 요청은 1시간 후 만료됩니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw에는 stdio 호환 `cliPath`만 필요하므로, 원격 Mac에 SSH로 접속해 `imsg`를 실행하는 래퍼 스크립트를 `cliPath`로 지정할 수 있습니다.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    첨부 파일이 활성화된 경우 권장 설정:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`가 설정되지 않은 경우 OpenClaw는 SSH 래퍼 스크립트를 파싱하여 자동 감지를 시도합니다.
    `remoteHost`는 `host` 또는 `user@host`여야 합니다(공백 또는 SSH 옵션 없음).
    OpenClaw는 SCP에 엄격한 호스트 키 검사를 사용하므로, 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
    첨부 파일 경로는 허용된 루트(`attachmentRoots` / `remoteAttachmentRoots`)를 기준으로 검증됩니다.

  </Tab>
</Tabs>

## 요구 사항 및 권한(macOS)

- `imsg`를 실행하는 Mac에서 Messages에 로그인되어 있어야 합니다.
- OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에는 전체 디스크 접근 권한이 필요합니다(Messages DB 접근).
- Messages.app을 통해 메시지를 보내려면 자동화 권한이 필요합니다.
- 고급 작업(react / edit / unsend / threaded reply / effects / group ops)의 경우 System Integrity Protection을 비활성화해야 합니다 — 아래 [imsg private API 활성화](#enabling-the-imsg-private-api)를 참조하세요. 기본 텍스트 및 미디어 송수신은 이 설정 없이도 작동합니다.

<Tip>
권한은 프로세스 컨텍스트별로 부여됩니다. gateway가 headless(LaunchAgent/SSH)로 실행되는 경우, 프롬프트를 트리거하려면 동일한 컨텍스트에서 일회성 대화형 명령을 실행하세요.

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg private API 활성화

`imsg`는 두 가지 운영 모드로 제공됩니다.

- **기본 모드**(기본값, SIP 변경 필요 없음): `send`를 통한 아웃바운드 텍스트 및 미디어, 인바운드 감시/히스토리, 채팅 목록. 새 `brew install steipete/tap/imsg`와 위의 표준 macOS 권한만으로 바로 사용할 수 있는 모드입니다.
- **Private API 모드**: `imsg`가 helper dylib를 `Messages.app`에 주입하여 내부 `IMCore` 함수를 호출합니다. 이 모드에서 `react`, `edit`, `unsend`, `reply`(threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`과 입력 표시 및 읽음 확인이 활성화됩니다.

이 채널 페이지에서 문서화하는 고급 작업 표면에 도달하려면 Private API 모드가 필요합니다. `imsg` README는 요구 사항을 명확히 설명합니다.

> `read`, `typing`, `launch`, 브리지 기반 리치 전송, 메시지 변경, 채팅 관리와 같은 고급 기능은 옵트인입니다. SIP를 비활성화하고 helper dylib를 `Messages.app`에 주입해야 합니다. SIP가 활성화되어 있으면 `imsg launch`는 주입을 거부합니다.

helper 주입 기법은 `imsg` 자체 dylib를 사용해 Messages private API에 접근합니다. OpenClaw iMessage 경로에는 타사 서버나 BlueBubbles runtime이 없습니다.

<Warning>
**SIP 비활성화는 실제 보안상의 절충입니다.** SIP는 수정된 시스템 코드 실행을 방지하는 macOS의 핵심 보호 기능 중 하나입니다. 시스템 전체에서 이를 끄면 추가 공격 표면과 부작용이 생깁니다. 특히 **Apple Silicon Mac에서 SIP를 비활성화하면 Mac에 iOS 앱을 설치하고 실행하는 기능도 비활성화됩니다**.

이를 기본값이 아니라 의도적인 운영 선택으로 다루세요. 위협 모델이 SIP 비활성화를 허용할 수 없다면 번들 iMessage는 기본 모드로 제한됩니다 — 텍스트 및 미디어 송수신만 가능하며, reactions / edit / unsend / effects / group ops는 사용할 수 없습니다.
</Warning>

### 설정

1. Messages.app을 실행하는 Mac에 **`imsg`를 설치(또는 업그레이드)**합니다.

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 출력은 `bridge_version`, `rpc_methods`, 메서드별 `selectors`를 보고하므로, 시작하기 전에 현재 빌드가 무엇을 지원하는지 확인할 수 있습니다.

2. **System Integrity Protection을 비활성화합니다.** 이는 기본 Apple 요구 사항이 OS와 하드웨어에 따라 달라지므로 macOS 버전별로 다릅니다.
   - **macOS 10.13–10.15(Sierra–Catalina):** Terminal을 통해 Library Validation을 비활성화하고, Recovery Mode로 재부팅한 다음 `csrutil disable`을 실행하고 다시 시작합니다.
   - **macOS 11+(Big Sur 이상), Intel:** Recovery Mode(또는 Internet Recovery), `csrutil disable`, 다시 시작.
   - **macOS 11+, Apple Silicon:** 전원 버튼 시작 절차로 Recovery에 진입합니다. 최신 macOS 버전에서는 Continue를 클릭할 때 **Left Shift** 키를 누른 다음 `csrutil disable`을 실행합니다. 가상 머신 설정은 별도 흐름을 따릅니다 — 먼저 VM 스냅샷을 찍으세요.
   - **macOS 26 / Tahoe:** library-validation 정책과 `imagent` private-entitlement 검사가 더 강화되었습니다. `imsg`가 이를 따라가려면 업데이트된 빌드가 필요할 수 있습니다. macOS 메이저 업그레이드 후 `imsg launch` 주입 또는 특정 `selectors`가 false를 반환하기 시작하면, SIP 단계가 성공했다고 가정하기 전에 `imsg`의 릴리스 노트를 확인하세요.

   `imsg launch`를 실행하기 전에 Mac에서 SIP를 비활성화하려면 Apple의 Recovery-mode 흐름을 따르세요.

3. **helper를 주입합니다.** SIP가 비활성화되고 Messages.app에 로그인된 상태에서:

   ```bash
   imsg launch
   ```

   SIP가 아직 활성화되어 있으면 `imsg launch`는 주입을 거부하므로, 이는 2단계가 적용되었는지 확인하는 역할도 합니다.

4. **OpenClaw에서 브리지를 검증합니다.**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 항목은 `works`를 보고해야 하며, `imsg status --json | jq '.selectors'`는 `retractMessagePart: true`와 macOS 빌드가 노출하는 edit / typing / read selector를 표시해야 합니다. `actions.ts`의 OpenClaw Plugin 메서드별 게이팅은 기본 selector가 `true`인 작업만 광고하므로, 에이전트의 도구 목록에서 보이는 작업 표면은 이 호스트에서 브리지가 실제로 수행할 수 있는 것을 반영합니다.

`openclaw channels status --probe`가 채널을 `works`로 보고하지만 특정 작업이 디스패치 시 "iMessage `<action>` requires the imsg private API bridge"를 발생시키면 `imsg launch`를 다시 실행하세요 — helper가 빠질 수 있으며(Messages.app 재시작, OS 업데이트 등), 캐시된 `available: true` 상태는 다음 프로브가 새로 고쳐질 때까지 계속 작업을 광고합니다.

### SIP를 비활성화할 수 없는 경우

위협 모델상 SIP 비활성화가 허용되지 않는 경우:

- `imsg`는 기본 모드로 대체됩니다 — 텍스트 + 미디어 + 수신만 가능합니다.
- OpenClaw Plugin은 여전히 텍스트/미디어 전송 및 인바운드 모니터링을 광고합니다. 다만 메서드별 capability 게이트에 따라 `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, group ops를 작업 표면에서 숨깁니다.
- 기본 기기에서는 SIP를 활성화한 상태로 유지하면서, iMessage 워크로드를 위해 별도의 non-Apple-Silicon Mac(또는 전용 bot Mac)을 SIP 비활성화 상태로 실행할 수 있습니다. 아래 [전용 bot macOS 사용자(별도 iMessage identity)](#deployment-patterns)를 참조하세요.

## 접근 제어 및 라우팅

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy`는 직접 메시지를 제어합니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"` 포함 필요)
    - `disabled`

    허용 목록 필드: `channels.imessage.allowFrom`.

    허용 목록 항목은 발신자를 식별해야 합니다. handle 또는 정적 sender access group(`accessGroup:<name>`)입니다. `chat_id:*`, `chat_guid:*`, `chat_identifier:*` 같은 채팅 대상에는 `channels.imessage.groupAllowFrom`을 사용하고, 숫자 `chat_id` registry 키에는 `channels.imessage.groups`를 사용하세요.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy`는 그룹 처리를 제어합니다.

    - `allowlist`(설정된 경우 기본값)
    - `open`
    - `disabled`

    그룹 발신자 허용 목록: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` 항목은 정적 sender access group(`accessGroup:<name>`)도 참조할 수 있습니다.

    Runtime fallback: `groupAllowFrom`이 설정되지 않은 경우 iMessage 그룹 발신자 검사는 `allowFrom`을 사용합니다. DM과 그룹 허용 기준이 달라야 하면 `groupAllowFrom`을 설정하세요.
    Runtime 참고: `channels.imessage`가 완전히 없으면 runtime은 `groupPolicy="allowlist"`로 대체하고 경고를 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있더라도).

    <Warning>
    그룹 라우팅에는 연속으로 실행되는 **두 개의** 허용 목록 게이트가 있으며, 둘 다 통과해야 합니다.

    1. **발신자 / 채팅 대상 허용 목록**(`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, 또는 `chat_id`.
    2. **그룹 registry**(`channels.imessage.groups`) — `groupPolicy: "allowlist"`인 경우 이 게이트에는 `groups: { "*": { ... } }` 와일드카드 항목(`allowAll = true` 설정) 또는 `groups` 아래의 명시적인 `chat_id`별 항목이 필요합니다.

    게이트 2에 아무것도 없으면 모든 그룹 메시지가 드롭됩니다. Plugin은 기본 로그 레벨에서 두 가지 `warn` 레벨 신호를 내보냅니다.

    - 시작 시 계정별로 한 번: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - runtime에서 `chat_id`별로 한 번: `imessage: dropping group message from chat_id=<id> ...`

    DM은 다른 코드 경로를 사용하므로 계속 작동합니다.

    `groupPolicy: "allowlist"`에서 그룹 흐름을 유지하기 위한 최소 설정:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    해당 `warn` 줄이 Gateway 로그에 나타나면 게이트 2에서 드롭되고 있는 것입니다 — `groups` 블록을 추가하세요.
    </Warning>

    그룹의 멘션 게이팅:

    - iMessage에는 네이티브 멘션 메타데이터가 없습니다
    - 멘션 감지는 정규식 패턴을 사용합니다(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 구성된 패턴이 없으면 멘션 게이팅을 적용할 수 없습니다

    권한이 있는 발신자의 제어 명령은 그룹에서 멘션 게이팅을 우회할 수 있습니다.

    그룹별 `systemPrompt`:

    `channels.imessage.groups.*` 아래의 각 항목은 선택적 `systemPrompt` 문자열을 허용합니다. 값은 해당 그룹의 메시지를 처리하는 모든 턴에서 에이전트의 시스템 프롬프트에 주입됩니다. 해석 방식은 `channels.whatsapp.groups`에서 사용하는 그룹별 프롬프트 해석과 동일합니다.

    1. **그룹별 시스템 프롬프트**(`groups["<chat_id>"].systemPrompt`): 특정 그룹 항목이 맵에 존재하고 **그** `systemPrompt` 키가 정의되어 있을 때 사용됩니다. `systemPrompt`가 빈 문자열(`""`)이면 와일드카드가 억제되고 해당 그룹에는 시스템 프롬프트가 적용되지 않습니다.
    2. **그룹 와일드카드 시스템 프롬프트**(`groups["*"].systemPrompt`): 특정 그룹 항목이 맵에 전혀 없거나, 존재하지만 `systemPrompt` 키를 정의하지 않은 경우 사용됩니다.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    그룹별 프롬프트는 그룹 메시지에만 적용됩니다 — 이 채널의 다이렉트 메시지에는 영향을 주지 않습니다.

  </Tab>

  <Tab title="세션 및 결정적 답장">
    - DM은 다이렉트 라우팅을 사용하고, 그룹은 그룹 라우팅을 사용합니다.
    - 기본 `session.dmScope=main`에서는 iMessage DM이 에이전트 메인 세션으로 합쳐집니다.
    - 그룹 세션은 격리됩니다(`agent:<agentId>:imessage:group:<chat_id>`).
    - 답장은 원래 채널/대상 메타데이터를 사용해 iMessage로 다시 라우팅됩니다.

    그룹과 유사한 스레드 동작:

    일부 다중 참가자 iMessage 스레드는 `is_group=false`로 도착할 수 있습니다.
    해당 `chat_id`가 `channels.imessage.groups` 아래에 명시적으로 구성되어 있으면 OpenClaw는 이를 그룹 트래픽으로 처리합니다(그룹 게이팅 + 그룹 세션 격리).

  </Tab>
</Tabs>

## ACP 대화 바인딩

레거시 iMessage 채팅도 ACP 세션에 바인딩할 수 있습니다.

빠른 운영자 흐름:

- DM 또는 허용된 그룹 채팅 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 이후 같은 iMessage 대화의 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new` 및 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

구성된 영구 바인딩은 `type: "acp"` 및 `match.channel: "imessage"`가 포함된 최상위 `bindings[]` 항목을 통해 지원됩니다.

`match.peer.id`에는 다음을 사용할 수 있습니다.

- `+15555550123` 또는 `user@example.com` 같은 정규화된 DM 핸들
- `chat_id:<id>`(안정적인 그룹 바인딩에 권장)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

예시:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

공유 ACP 바인딩 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 봇 macOS 사용자(별도 iMessage ID)">
    봇 트래픽이 개인 Messages 프로필과 분리되도록 전용 Apple ID와 macOS 사용자를 사용하세요.

    일반적인 흐름:

    1. 전용 macOS 사용자를 만들고 로그인합니다.
    2. 해당 사용자에서 봇 Apple ID로 Messages에 로그인합니다.
    3. 해당 사용자에 `imsg`를 설치합니다.
    4. OpenClaw가 해당 사용자 컨텍스트에서 `imsg`를 실행할 수 있도록 SSH 래퍼를 만듭니다.
    5. `channels.imessage.accounts.<id>.cliPath` 및 `.dbPath`가 해당 사용자 프로필을 가리키도록 설정합니다.

    첫 실행 시 해당 봇 사용자 세션에서 GUI 승인(자동화 + 전체 디스크 접근)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac(예시)">
    일반적인 토폴로지:

    - Gateway는 Linux/VM에서 실행됩니다
    - iMessage + `imsg`는 tailnet의 Mac에서 실행됩니다
    - `cliPath` 래퍼는 SSH를 사용해 `imsg`를 실행합니다
    - `remoteHost`는 SCP 첨부 파일 가져오기를 활성화합니다

    예시:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    SSH와 SCP가 모두 비대화식으로 동작하도록 SSH 키를 사용하세요.
    먼저 호스트 키를 신뢰하도록 설정해(예: `ssh bot@mac-mini.tailnet-1234.ts.net`) `known_hosts`가 채워지게 하세요.

  </Accordion>

  <Accordion title="다중 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래의 계정별 구성을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, 기록 설정, 첨부 파일 루트 허용 목록 같은 필드를 재정의할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 미디어, 청킹 및 전달 대상

<AccordionGroup>
  <Accordion title="첨부 파일 및 미디어">
    - 인바운드 첨부 파일 수집은 **기본적으로 꺼져 있습니다** — 사진, 음성 메모, 동영상 및 기타 첨부 파일을 에이전트로 전달하려면 `channels.imessage.includeAttachments: true`를 설정하세요. 비활성화된 경우 첨부 파일만 있는 iMessage는 에이전트에 도달하기 전에 드롭되며 `Inbound message` 로그 줄이 전혀 생성되지 않을 수도 있습니다.
    - `remoteHost`가 설정되어 있으면 원격 첨부 파일 경로를 SCP로 가져올 수 있습니다
    - 첨부 파일 경로는 허용된 루트와 일치해야 합니다.
      - `channels.imessage.attachmentRoots`(로컬)
      - `channels.imessage.remoteAttachmentRoots`(원격 SCP 모드)
      - 기본 루트 패턴: `/Users/*/Library/Messages/Attachments`
    - SCP는 엄격한 호스트 키 검사를 사용합니다(`StrictHostKeyChecking=yes`)
    - 아웃바운드 미디어 크기는 `channels.imessage.mediaMaxMb`를 사용합니다(기본값 16 MB)

  </Accordion>

  <Accordion title="아웃바운드 청킹">
    - 텍스트 청크 제한: `channels.imessage.textChunkLimit`(기본값 4000)
    - 청크 모드: `channels.imessage.chunkMode`
      - `length`(기본값)
      - `newline`(문단 우선 분할)

  </Accordion>

  <Accordion title="주소 지정 형식">
    권장되는 명시적 대상:

    - `chat_id:123`(안정적인 라우팅에 권장)
    - `chat_guid:...`
    - `chat_identifier:...`

    핸들 대상도 지원됩니다.

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 비공개 API 작업

`imsg launch`가 실행 중이고 `openclaw channels status --probe`가 `privateApi.available: true`를 보고하면 메시지 도구는 일반 텍스트 전송에 더해 iMessage 네이티브 작업을 사용할 수 있습니다.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="사용 가능한 작업">
    - **react**: iMessage tapback을 추가/제거합니다(`messageId`, `emoji`, `remove`). 지원되는 tapback은 사랑, 좋아요, 싫어요, 웃음, 강조, 질문에 매핑됩니다.
    - **reply**: 기존 메시지에 스레드 답장을 보냅니다(`messageId`, `text` 또는 `message`, 그리고 `chatGuid`, `chatId`, `chatIdentifier` 또는 `to`).
    - **sendWithEffect**: iMessage 효과와 함께 텍스트를 보냅니다(`text` 또는 `message`, `effect` 또는 `effectId`).
    - **edit**: 지원되는 macOS/비공개 API 버전에서 보낸 메시지를 편집합니다(`messageId`, `text` 또는 `newText`).
    - **unsend**: 지원되는 macOS/비공개 API 버전에서 보낸 메시지를 철회합니다(`messageId`).
    - **upload-file**: 미디어/파일을 보냅니다(base64 형식의 `buffer` 또는 하이드레이션된 `media`/`path`/`filePath`, `filename`, 선택적 `asVoice`). 레거시 별칭: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: 현재 대상이 그룹 대화일 때 그룹 채팅을 관리합니다.

  </Accordion>

  <Accordion title="메시지 ID">
    인바운드 iMessage 컨텍스트에는 사용 가능한 경우 짧은 `MessageSid` 값과 전체 메시지 GUID가 모두 포함됩니다. 짧은 ID는 최근 인메모리 답장 캐시 범위에 한정되며 사용 전에 현재 채팅과 대조됩니다. 짧은 ID가 만료되었거나 다른 채팅에 속한 경우 전체 `MessageSidFull`로 다시 시도하세요.

  </Accordion>

  <Accordion title="기능 감지">
    OpenClaw는 캐시된 프로브 상태가 브리지를 사용할 수 없다고 표시할 때만 비공개 API 작업을 숨깁니다. 상태를 알 수 없으면 작업은 계속 표시되며 디스패치 시 지연 프로브를 수행하므로, 별도의 수동 상태 새로고침 없이도 `imsg launch` 후 첫 작업이 성공할 수 있습니다.

  </Accordion>

  <Accordion title="읽음 확인 및 입력 중 표시">
    비공개 API 브리지가 올라와 있으면 허용된 인바운드 채팅은 디스패치 전에 읽음으로 표시되고, 에이전트가 생성하는 동안 발신자에게 입력 중 말풍선이 표시됩니다. 읽음 표시를 비활성화하려면 다음을 사용하세요.

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    메서드별 기능 목록보다 오래된 `imsg` 빌드는 입력 중 표시/읽음을 조용히 차단합니다. OpenClaw는 누락된 확인의 원인을 파악할 수 있도록 재시작마다 한 번 경고를 로그에 남깁니다.

  </Accordion>

  <Accordion title="인바운드 tapback">
    OpenClaw는 iMessage tapback을 구독하고 허용된 반응을 일반 메시지 텍스트 대신 시스템 이벤트로 라우팅하므로, 사용자 tapback이 일반 답장 루프를 트리거하지 않습니다.

    알림 모드는 `channels.imessage.reactionNotifications`로 제어됩니다.

    - `"own"`(기본값): 사용자가 봇이 작성한 메시지에 반응할 때만 알립니다.
    - `"all"`: 권한이 있는 발신자의 모든 인바운드 tapback에 대해 알립니다.
    - `"off"`: 인바운드 tapback을 무시합니다.

    계정별 재정의는 `channels.imessage.accounts.<id>.reactionNotifications`를 사용합니다.

  </Accordion>
</AccordionGroup>

## 구성 쓰기

iMessage는 기본적으로 채널에서 시작한 구성 쓰기를 허용합니다(`commands.config: true`일 때 `/config set|unset`용).

비활성화:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 분할 전송 DM 병합(하나의 작성에 명령 + URL)

사용자가 명령과 URL을 함께 입력하면(예: `Dump https://example.com/article`) Apple의 Messages 앱은 전송을 **두 개의 별도 `chat.db` 행**으로 분할합니다.

1. 텍스트 메시지(`"Dump"`).
2. OG 미리보기 이미지가 첨부 파일로 포함된 URL 미리보기 말풍선(`"https://..."`).

대부분의 설정에서 두 행은 약 0.8~2.0초 간격으로 OpenClaw에 도착합니다. 병합하지 않으면 에이전트는 1번째 턴에서 명령만 받고, 응답한 뒤(대개 "URL을 보내 주세요"), 2번째 턴에서야 URL을 보게 됩니다. 그 시점에는 명령 컨텍스트가 이미 사라진 상태입니다. 이는 Apple의 전송 파이프라인 때문이며, OpenClaw나 `imsg`가 도입한 동작이 아닙니다.

`channels.imessage.coalesceSameSenderDms`는 DM에서 같은 발신자의 연속 행을 하나의 에이전트 턴으로 병합하도록 선택합니다. 그룹 채팅은 다중 사용자 턴 구조가 보존되도록 메시지별로 계속 디스패치됩니다.

<Tabs>
  <Tab title="활성화 시점">
    다음 경우 활성화하세요.

    - 한 메시지 안에 `command + payload`를 기대하는 Skills를 제공하는 경우(dump, paste, save, queue 등).
    - 사용자가 명령과 함께 URL, 이미지 또는 긴 콘텐츠를 붙여 넣는 경우.
    - 추가되는 DM 턴 지연 시간을 허용할 수 있는 경우(아래 참조).

    다음 경우 비활성화해 두세요.

    - 단일 단어 DM 트리거에 대해 최소 명령 지연 시간이 필요한 경우.
    - 모든 흐름이 페이로드 후속 입력이 없는 일회성 명령인 경우.

  </Tab>
  <Tab title="활성화">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    플래그가 켜져 있고 명시적인 `messages.inbound.byChannel.imessage`가 없으면 디바운스 기간이 **2500 ms**로 넓어집니다(레거시 기본값은 0 ms, 즉 디바운스 없음). Apple의 분할 전송 간격 0.8~2.0초는 더 짧은 기본값에 맞지 않으므로 더 넓은 기간이 필요합니다.

    기간을 직접 조정하려면 다음을 사용하세요.

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="트레이드오프">
    - **DM 메시지에 추가 지연 시간이 발생합니다.** 플래그가 켜져 있으면 모든 DM(독립 실행형 제어 명령과 단일 텍스트 후속 입력 포함)은 페이로드 행이 도착할 수 있으므로 디스패치 전에 최대 디바운스 기간만큼 대기합니다. 그룹 채팅 메시지는 즉시 디스패치됩니다.
    - **병합된 출력에는 제한이 있습니다.** 병합된 텍스트는 명시적인 `…[truncated]` 마커와 함께 4000자로 제한됩니다. 첨부 파일은 20개, 소스 항목은 10개로 제한됩니다(그 이후에는 첫 항목과 최신 항목이 유지됨). 모든 소스 GUID는 다운스트림 텔레메트리를 위해 `coalescedMessageGuids`에 추적됩니다.
    - **DM 전용입니다.** 그룹 채팅은 메시지별 디스패치로 처리되어 여러 사람이 입력 중일 때도 봇이 계속 반응할 수 있습니다.
    - **채널별 옵트인입니다.** 다른 채널(Telegram, WhatsApp, Slack, …)에는 영향이 없습니다. `channels.bluebubbles.coalesceSameSenderDms`를 설정한 레거시 BlueBubbles 구성은 해당 값을 `channels.imessage.coalesceSameSenderDms`로 이전해야 합니다.

  </Tab>
</Tabs>

### 시나리오와 에이전트가 보는 내용

| 사용자가 작성하는 내용                                             | `chat.db`가 생성하는 내용 | 플래그 꺼짐(기본값)                    | 플래그 켜짐 + 2500 ms 기간                                             |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`(한 번 전송)                              | 약 1초 간격의 2개 행     | 두 에이전트 턴: "Dump"만, 그다음 URL | 한 턴: 병합된 텍스트 `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`(첨부 파일 + 텍스트)                | 2개 행                | 두 턴(병합 시 첨부 파일 누락) | 한 턴: 텍스트 + 이미지 보존                                        |
| `/status`(독립 실행형 명령)                                     | 1개 행                 | 즉시 디스패치                        | **최대 기간까지 대기한 뒤 디스패치**                                    |
| URL만 붙여 넣음                                                   | 1개 행                 | 즉시 디스패치                        | 즉시 디스패치(버킷에 항목이 하나뿐임)                             |
| 텍스트 + URL을 몇 분 간격의 의도적인 별도 메시지 두 개로 전송 | 기간 밖의 2개 행 | 두 턴                               | 두 턴(그 사이 기간 만료)                                 |
| 빠른 폭주(기간 안에 작은 DM 10개 초과)                          | N개 행                | N개 턴                                 | 한 턴, 제한된 출력(첫 항목 + 최신 항목, 텍스트/첨부 파일 제한 적용) |
| 그룹 채팅에서 두 사람이 입력 중                                  | M명 발신자의 N개 행 | M+개 턴(발신자 버킷당 하나)        | M+개 턴 - 그룹 채팅은 병합되지 않음                                |

## Gateway 다운타임 이후 따라잡기

Gateway가 오프라인 상태일 때(충돌, 재시작, Mac 잠자기, 머신 꺼짐) `imsg watch`는 Gateway가 다시 올라오면 현재 `chat.db` 상태에서 재개합니다. 기본적으로 그 공백 동안 도착한 것은 절대 보이지 않습니다. 따라잡기는 다음 시작 시 해당 메시지를 재생하여 에이전트가 인바운드 트래픽을 조용히 놓치지 않도록 합니다.

따라잡기는 **기본적으로 비활성화**되어 있습니다. 채널별로 활성화하세요.

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### 실행 방식

`monitorIMessageProvider` 시작마다 한 번 실행되며, 순서는 `imsg launch` 준비 완료 → `watch.subscribe` → `performIMessageCatchup` → 라이브 디스패치 루프입니다. 따라잡기 자체는 `imsg watch`와 동일한 JSON-RPC 클라이언트를 사용해 `chats.list` + 채팅별 `messages.history`를 호출합니다. 따라잡기 패스 중 도착하는 모든 것은 평소처럼 라이브 디스패치를 통해 흐르며, 기존 인바운드 중복 제거 캐시가 재생된 행과의 중복을 흡수합니다.

재생된 각 행은 라이브 디스패치 경로(`evaluateIMessageInbound` + `dispatchInboundMessage`)를 통해 공급되므로 허용 목록, 그룹 정책, 디바운서, 에코 캐시, 읽음 확인은 재생 메시지와 라이브 메시지에서 동일하게 동작합니다.

### 커서 및 재시도 의미 체계

따라잡기는 계정별 커서를 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json`에 유지합니다(OpenClaw 상태 디렉터리 기본값은 `~/.openclaw`이며 `OPENCLAW_STATE_DIR`로 재정의 가능).

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 커서는 각 성공적인 디스패치마다 전진하며, 행의 디스패치가 예외를 던지면 유지됩니다. 다음 시작 시 유지된 커서에서 같은 행을 다시 시도합니다.
- 같은 `guid`에 대해 `maxFailureRetries`회 연속 예외가 발생하면 따라잡기는 `warn`을 기록하고 커서를 해당 막힌 메시지 뒤로 강제로 전진시켜 이후 시작에서 진행할 수 있게 합니다.
- 이미 포기한 guid는 이후 실행에서 보이는 즉시 건너뜁니다(디스패치 시도 없음). 실행 요약의 `skippedGivenUp`에 집계됩니다.

### 운영자에게 보이는 신호

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 줄은 단일 시작에서 전체 백로그를 비우지 못했다는 뜻입니다. 공백이 기본 50개 행 패스를 정기적으로 초과한다면 `perRunLimit`를 올리세요(최대 500).

### 비활성화해 둘 때

- Gateway가 감시자 자동 재시작과 함께 계속 실행되고 공백이 항상 몇 초 미만인 경우, 기본값인 꺼짐으로 충분합니다.
- DM 볼륨이 낮고 놓친 메시지가 에이전트 동작을 바꾸지 않는 경우, `firstRunLookbackMinutes` 초기 기간은 처음 활성화할 때 예상 밖의 오래된 컨텍스트를 디스패치할 수 있습니다.

따라잡기를 켜면 커서가 없는 첫 시작은 전체 `maxAgeMinutes` 기간이 아니라 `firstRunLookbackMinutes`(기본값 30분)만 되돌아봅니다. 이는 활성화 이전 메시지의 긴 기록을 재생하지 않기 위한 것입니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="imsg를 찾을 수 없거나 RPC가 지원되지 않음">
    바이너리와 RPC 지원을 검증하세요.

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    프로브가 RPC 미지원을 보고하면 `imsg`를 업데이트하세요. 비공개 API 동작을 사용할 수 없다면 로그인된 macOS 사용자 세션에서 `imsg launch`를 실행하고 다시 프로브하세요. Gateway가 macOS에서 실행 중이 아니라면 기본 local `imsg` 경로 대신 위의 SSH를 통한 원격 Mac 설정을 사용하세요.

  </Accordion>

  <Accordion title="Gateway가 macOS에서 실행 중이 아님">
    기본 `cliPath: "imsg"`는 Messages에 로그인된 Mac에서 실행되어야 합니다. Linux 또는 Windows에서는 `channels.imessage.cliPath`를 해당 Mac에 SSH로 접속해 `imsg "$@"`를 실행하는 래퍼 스크립트로 설정하세요.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    그런 다음 다음을 실행하세요.

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM이 무시됨">
    다음을 확인하세요.

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 페어링 승인(`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="그룹 메시지가 무시됨">
    다음을 확인하세요.

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 허용 목록 동작
    - 멘션 패턴 구성(`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="원격 첨부 파일 실패">
    다음을 확인하세요.

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway 호스트에서의 SSH/SCP 키 인증
    - Gateway 호스트의 `~/.ssh/known_hosts`에 호스트 키가 존재함
    - Messages를 실행하는 Mac에서 원격 경로를 읽을 수 있음

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    같은 사용자/세션 컨텍스트의 대화형 GUI 터미널에서 다시 실행하고 프롬프트를 승인하세요.

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에 전체 디스크 접근 + 자동화 권한이 부여되었는지 확인하세요.

  </Accordion>
</AccordionGroup>

## 구성 참조 포인터

- [구성 참조 - iMessage](/ko/gateway/config-channels#imessage)
- [Gateway 구성](/ko/gateway/configuration)
- [페어링](/ko/channels/pairing)

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [BlueBubbles 제거와 imsg iMessage 경로](/ko/announcements/bluebubbles-imessage) — 공지 및 마이그레이션 요약
- [BlueBubbles에서 이전하기](/ko/channels/imessage-from-bluebubbles) — 구성 변환 표와 단계별 전환
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델과 강화
