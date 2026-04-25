---
read_when:
    - iMessage 지원 설정하기
    - iMessage 송신/수신 디버깅
summary: '`imsg`를 통한 레거시 iMessage 지원(stdio를 통한 JSON-RPC). 새 설정에서는 BlueBubbles를 사용해야 합니다.'
title: iMessage
x-i18n:
    generated_at: "2026-04-25T05:56:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
새 iMessage 배포에는 <a href="/ko/channels/bluebubbles">BlueBubbles</a>를 사용하세요.

`imsg` 통합은 레거시이며 향후 릴리스에서 제거될 수 있습니다.
</Warning>

상태: 레거시 외부 CLI 통합. Gateway가 `imsg rpc`를 시작하고 stdio의 JSON-RPC를 통해 통신합니다(별도의 데몬/포트 없음).

<CardGroup cols={3}>
  <Card title="BlueBubbles (권장)" icon="message-circle" href="/ko/channels/bluebubbles">
    새 설정을 위한 선호되는 iMessage 경로입니다.
  </Card>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    iMessage DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="구성 참조" icon="settings" href="/ko/gateway/config-channels#imessage">
    전체 iMessage 필드 참조입니다.
  </Card>
</CardGroup>

## 빠른 설정

<Tabs>
  <Tab title="로컬 Mac(빠른 경로)">
    <Steps>
      <Step title="imsg 설치 및 확인">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw 구성">

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

      <Step title="Gateway 시작">

```bash
openclaw gateway
```

      </Step>

      <Step title="첫 번째 DM 페어링 승인(기본 dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        페어링 요청은 1시간 후 만료됩니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH를 통한 원격 Mac">
    OpenClaw에는 stdio 호환 `cliPath`만 필요하므로, `cliPath`를 원격 Mac으로 SSH 접속해 `imsg`를 실행하는 래퍼 스크립트로 지정할 수 있습니다.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    첨부 파일이 활성화된 경우 권장되는 구성:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP 첨부 파일 가져오기에 사용됨
      includeAttachments: true,
      // 선택 사항: 허용된 첨부 파일 루트를 재정의합니다.
      // 기본값에는 /Users/*/Library/Messages/Attachments가 포함됩니다.
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`가 설정되지 않으면 OpenClaw는 SSH 래퍼 스크립트를 파싱해 자동 감지를 시도합니다.
    `remoteHost`는 `host` 또는 `user@host`여야 합니다(공백이나 SSH 옵션 없음).
    OpenClaw는 SCP에 엄격한 호스트 키 검사를 사용하므로, 릴레이 호스트 키가 이미 `~/.ssh/known_hosts`에 있어야 합니다.
    첨부 파일 경로는 허용된 루트(`attachmentRoots` / `remoteAttachmentRoots`)에 대해 검증됩니다.

  </Tab>
</Tabs>

## 요구 사항 및 권한(macOS)

- `imsg`를 실행하는 Mac에서 Messages에 로그인되어 있어야 합니다.
- OpenClaw/`imsg`를 실행하는 프로세스 컨텍스트에는 전체 디스크 접근 권한이 필요합니다(Messages DB 접근).
- Messages.app을 통해 메시지를 보내려면 자동화 권한이 필요합니다.

<Tip>
권한은 프로세스 컨텍스트별로 부여됩니다. gateway가 헤드리스(LaunchAgent/SSH)로 실행된다면, 같은 컨텍스트에서 일회성 대화형 명령을 실행해 프롬프트를 띄우세요:

```bash
imsg chats --limit 1
# 또는
imsg send <handle> "test"
```

</Tip>

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.imessage.dmPolicy`는 다이렉트 메시지를 제어합니다:

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    허용 목록 필드: `channels.imessage.allowFrom`.

    허용 목록 항목은 핸들이나 채팅 대상(`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)일 수 있습니다.

  </Tab>

  <Tab title="그룹 정책 + 멘션">
    `channels.imessage.groupPolicy`는 그룹 처리를 제어합니다:

    - `allowlist`(구성된 경우 기본값)
    - `open`
    - `disabled`

    그룹 발신자 허용 목록: `channels.imessage.groupAllowFrom`.

    런타임 대체값: `groupAllowFrom`이 설정되지 않은 경우, iMessage 그룹 발신자 검사는 사용 가능할 때 `allowFrom`으로 대체됩니다.
    런타임 참고: `channels.imessage`가 완전히 없으면, 런타임은 `groupPolicy="allowlist"`로 대체하고 경고를 기록합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 마찬가지).

    그룹의 멘션 게이팅:

    - iMessage에는 네이티브 멘션 메타데이터가 없습니다
    - 멘션 감지는 정규식 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)을 사용합니다
    - 구성된 패턴이 없으면 멘션 게이팅을 강제할 수 없습니다

    권한이 있는 발신자의 제어 명령은 그룹에서 멘션 게이팅을 우회할 수 있습니다.

  </Tab>

  <Tab title="세션 및 결정적 응답">
    - DM은 직접 라우팅을 사용하고, 그룹은 그룹 라우팅을 사용합니다.
    - 기본 `session.dmScope=main`에서는 iMessage DM이 에이전트 메인 세션으로 합쳐집니다.
    - 그룹 세션은 격리됩니다(`agent:<agentId>:imessage:group:<chat_id>`).
    - 응답은 원래 채널/대상 메타데이터를 사용해 iMessage로 다시 라우팅됩니다.

    그룹 유사 스레드 동작:

    일부 다중 참여자 iMessage 스레드는 `is_group=false`로 도착할 수 있습니다.
    해당 `chat_id`가 `channels.imessage.groups` 아래에 명시적으로 구성되어 있으면, OpenClaw는 이를 그룹 트래픽으로 처리합니다(그룹 게이팅 + 그룹 세션 격리).

  </Tab>
</Tabs>

## ACP 대화 바인딩

레거시 iMessage 채팅도 ACP 세션에 바인딩할 수 있습니다.

빠른 운영자 흐름:

- DM 또는 허용된 그룹 채팅 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 같은 iMessage 대화의 이후 메시지는 생성된 ACP 세션으로 라우팅됩니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 제자리에서 재설정합니다.
- `/acp close`는 ACP 세션을 닫고 바인딩을 제거합니다.

구성된 영구 바인딩은 최상위 `bindings[]` 항목에서 `type: "acp"`와 `match.channel: "imessage"`를 통해 지원됩니다.

`match.peer.id`는 다음을 사용할 수 있습니다:

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

공유 ACP 바인딩 동작은 [ACP Agents](/ko/tools/acp-agents)를 참고하세요.

## 배포 패턴

<AccordionGroup>
  <Accordion title="전용 봇 macOS 사용자(분리된 iMessage ID)">
    봇 트래픽을 개인 Messages 프로필과 분리하려면 전용 Apple ID와 macOS 사용자를 사용하세요.

    일반적인 흐름:

    1. 전용 macOS 사용자를 만들고 로그인합니다.
    2. 해당 사용자에서 봇 Apple ID로 Messages에 로그인합니다.
    3. 해당 사용자에 `imsg`를 설치합니다.
    4. OpenClaw가 해당 사용자 컨텍스트에서 `imsg`를 실행할 수 있도록 SSH 래퍼를 만듭니다.
    5. `channels.imessage.accounts.<id>.cliPath`와 `.dbPath`를 해당 사용자 프로필로 지정합니다.

    첫 실행에서는 해당 봇 사용자 세션에서 GUI 승인(자동화 + 전체 디스크 접근)이 필요할 수 있습니다.

  </Accordion>

  <Accordion title="Tailscale을 통한 원격 Mac(예시)">
    일반적인 토폴로지:

    - gateway는 Linux/VM에서 실행
    - iMessage + `imsg`는 tailnet 안의 Mac에서 실행
    - `cliPath` 래퍼는 SSH를 사용해 `imsg`를 실행
    - `remoteHost`는 SCP 첨부 파일 가져오기를 활성화

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

    SSH와 SCP가 모두 비대화형이 되도록 SSH 키를 사용하세요.
    먼저 호스트 키가 신뢰되도록(예: `ssh bot@mac-mini.tailnet-1234.ts.net`) 실행해 `known_hosts`가 채워지도록 하세요.

  </Accordion>

  <Accordion title="멀티 계정 패턴">
    iMessage는 `channels.imessage.accounts` 아래에서 계정별 구성을 지원합니다.

    각 계정은 `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, 기록 설정, 첨부 파일 루트 허용 목록 같은 필드를 재정의할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 미디어, 청크 분할 및 전달 대상

<AccordionGroup>
  <Accordion title="첨부 파일 및 미디어">
    - 인바운드 첨부 파일 수집은 선택 사항입니다: `channels.imessage.includeAttachments`
    - `remoteHost`가 설정된 경우 원격 첨부 파일 경로를 SCP로 가져올 수 있습니다
    - 첨부 파일 경로는 허용된 루트와 일치해야 합니다:
      - `channels.imessage.attachmentRoots`(로컬)
      - `channels.imessage.remoteAttachmentRoots`(원격 SCP 모드)
      - 기본 루트 패턴: `/Users/*/Library/Messages/Attachments`
    - SCP는 엄격한 호스트 키 검사(`StrictHostKeyChecking=yes`)를 사용합니다
    - 아웃바운드 미디어 크기는 `channels.imessage.mediaMaxMb`를 사용합니다(기본값 16 MB)
  </Accordion>

  <Accordion title="아웃바운드 청크 분할">
    - 텍스트 청크 제한: `channels.imessage.textChunkLimit`(기본값 4000)
    - 청크 모드: `channels.imessage.chunkMode`
      - `length`(기본값)
      - `newline`(문단 우선 분할)
  </Accordion>

  <Accordion title="주소 지정 형식">
    선호되는 명시적 대상:

    - `chat_id:123`(안정적인 라우팅에 권장)
    - `chat_guid:...`
    - `chat_identifier:...`

    핸들 대상도 지원됩니다:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## config 쓰기

iMessage는 기본적으로 채널 시작 config 쓰기를 허용합니다(`commands.config: true`일 때 `/config set|unset`용).

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

## 문제 해결

<AccordionGroup>
  <Accordion title="imsg를 찾을 수 없거나 RPC가 지원되지 않음">
    바이너리와 RPC 지원을 확인하세요:

```bash
imsg rpc --help
openclaw channels status --probe
```

    probe에서 RPC 미지원이 보고되면 `imsg`를 업데이트하세요.

  </Accordion>

  <Accordion title="DM이 무시됨">
    다음을 확인하세요:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 페어링 승인(`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="그룹 메시지가 무시됨">
    다음을 확인하세요:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 허용 목록 동작
    - 멘션 패턴 구성(`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="원격 첨부 파일 실패">
    다음을 확인하세요:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway 호스트에서의 SSH/SCP 키 인증
    - gateway 호스트의 `~/.ssh/known_hosts`에 호스트 키가 존재하는지
    - Messages를 실행하는 Mac에서 원격 경로를 읽을 수 있는지

  </Accordion>

  <Accordion title="macOS 권한 프롬프트를 놓침">
    같은 사용자/세션 컨텍스트의 대화형 GUI 터미널에서 다시 실행하고 프롬프트를 승인하세요:

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
- [BlueBubbles](/ko/channels/bluebubbles)

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
