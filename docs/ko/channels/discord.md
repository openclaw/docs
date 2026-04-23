---
read_when:
    - Discord 채널 기능 작업 중
summary: Discord 봇 지원 상태, 기능 및 구성
title: Discord
x-i18n:
    generated_at: "2026-04-23T13:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

상태: 공식 Discord gateway를 통해 DM 및 길드 채널에서 사용할 준비가 되었습니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord DM은 기본적으로 페어링 모드로 시작됩니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작 및 명령 카탈로그.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반 진단 및 복구 흐름.
  </Card>
</CardGroup>

## 빠른 설정

새 애플리케이션과 봇을 만들고, 봇을 서버에 추가한 다음, 이를 OpenClaw와 페어링해야 합니다. 봇은 본인만 사용하는 비공개 서버에 추가하는 것을 권장합니다. 아직 서버가 없다면, 먼저 [서버를 만드세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** 선택).

<Steps>
  <Step title="Discord 애플리케이션과 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동한 뒤 **New Application**을 클릭하세요. 이름은 "OpenClaw"처럼 지정하면 됩니다.

    사이드바에서 **Bot**을 클릭하세요. **Username**은 OpenClaw 에이전트를 부르는 이름으로 설정하세요.

  </Step>

  <Step title="권한 있는 인텐트 활성화">
    계속해서 **Bot** 페이지에서 아래로 스크롤해 **Privileged Gateway Intents**로 이동한 뒤 다음을 활성화하세요.

    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장, 역할 allowlist 및 이름-대-ID 매칭에 필요)
    - **Presence Intent** (선택 사항, 상태 업데이트가 필요한 경우에만 필요)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지 위쪽으로 다시 스크롤한 뒤 **Reset Token**을 클릭하세요.

    <Note>
    이름과 달리, 이것은 첫 번째 토큰을 생성하는 동작이며 아무것도 "재설정"되는 것은 아닙니다.
    </Note>

    토큰을 복사해 안전한 곳에 저장하세요. 이것이 **Bot Token**이며, 곧 필요합니다.

  </Step>

  <Step title="초대 URL을 생성하고 서버에 봇 추가">
    사이드바에서 **OAuth2**를 클릭하세요. 봇을 서버에 추가할 수 있도록 적절한 권한이 포함된 초대 URL을 생성합니다.

    아래로 스크롤하여 **OAuth2 URL Generator**에서 다음을 활성화하세요.

    - `bot`
    - `applications.commands`

    아래에 **Bot Permissions** 섹션이 나타납니다. 최소한 다음 권한은 활성화하세요.

    **일반 권한**
      - View Channels
    **텍스트 권한**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (선택 사항)

    이는 일반 텍스트 채널을 위한 기본 권한 세트입니다. 포럼 또는 미디어 채널 워크플로우처럼 스레드를 만들거나 이어가는 Discord 스레드에 게시할 계획이라면 **Send Messages in Threads**도 활성화하세요.
    하단에서 생성된 URL을 복사해 브라우저에 붙여 넣고, 서버를 선택한 뒤 **Continue**를 클릭하여 연결하세요. 이제 Discord 서버에서 봇이 보여야 합니다.

  </Step>

  <Step title="Developer Mode를 활성화하고 ID 수집">
    Discord 앱으로 돌아가서 내부 ID를 복사할 수 있도록 Developer Mode를 활성화해야 합니다.

    1. **User Settings**(아바타 옆 톱니바퀴 아이콘) → **Advanced** → **Developer Mode** 활성화
    2. 사이드바에서 **서버 아이콘**을 우클릭 → **Copy Server ID**
    3. **내 아바타**를 우클릭 → **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장하세요. 다음 단계에서 이 세 가지를 모두 OpenClaw에 전달하게 됩니다.

  </Step>

  <Step title="서버 구성원으로부터 DM 허용">
    페어링이 작동하려면 Discord에서 봇이 사용자에게 DM을 보낼 수 있어야 합니다. **서버 아이콘**을 우클릭 → **Privacy Settings** → **Direct Messages**를 활성화하세요.

    이렇게 하면 서버 구성원(봇 포함)이 사용자에게 DM을 보낼 수 있습니다. OpenClaw와 Discord DM을 사용하려면 이 설정을 유지하세요. 길드 채널만 사용할 계획이라면 페어링 후 DM을 비활성화해도 됩니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정(채팅으로 보내지 마세요)">
    Discord 봇 토큰은 비밀 정보입니다(비밀번호와 유사). 에이전트에 메시지를 보내기 전에 OpenClaw를 실행하는 머신에 설정하세요.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw가 이미 백그라운드 서비스로 실행 중이라면, OpenClaw Mac 앱에서 재시작하거나 `openclaw gateway run` 프로세스를 중지 후 다시 시작하세요.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 대화하며 요청하세요. Discord가 첫 번째 채널이라면 CLI / config 탭을 대신 사용하세요.

        > "Discord 봇 토큰은 이미 config에 설정했습니다. User ID `<user_id>`와 Server ID `<server_id>`로 Discord 설정을 마무리해 주세요."
      </Tab>
      <Tab title="CLI / config">
        파일 기반 구성을 선호한다면 다음과 같이 설정하세요.

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        기본 계정용 env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        평문 `token` 값도 지원됩니다. `channels.discord.token`에는 env/file/exec provider 전반에서 SecretRef 값도 지원됩니다. 자세한 내용은 [Secrets Management](/ko/gateway/secrets)를 참조하세요.

      </Tab>
    </Tabs>

  </Step>

  <Step title="첫 DM 페어링 승인">
    gateway가 실행 중일 때까지 기다린 다음, Discord에서 봇에게 DM을 보내세요. 봇이 페어링 코드로 응답합니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널에서 에이전트에게 페어링 코드를 보내세요.

        > "이 Discord 페어링 코드를 승인해 주세요: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    페어링 코드는 1시간 후 만료됩니다.

    이제 Discord에서 DM을 통해 에이전트와 대화할 수 있어야 합니다.

  </Step>
</Steps>

<Note>
토큰 확인은 계정을 인식하여 처리됩니다. config의 토큰 값이 env fallback보다 우선합니다. `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
고급 outbound 호출(메시지 도구/채널 액션)의 경우, 명시적인 호출별 `token`이 해당 호출에 사용됩니다. 이는 send와 read/probe 계열 액션(예: read/search/fetch/thread/pins/permissions)에 적용됩니다. 계정 정책/재시도 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정 기준으로 적용됩니다.
</Note>

## 권장: 길드 워크스페이스 설정

DM이 작동하면 Discord 서버를 전체 워크스페이스로 설정할 수 있습니다. 이 경우 각 채널은 자체 컨텍스트를 가진 독립적인 에이전트 세션을 갖게 됩니다. 이는 사용자와 봇만 있는 비공개 서버에 권장됩니다.

<Steps>
  <Step title="서버를 길드 allowlist에 추가">
    이렇게 하면 에이전트가 DM뿐 아니라 서버 내 모든 채널에서 응답할 수 있게 됩니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord Server ID `<server_id>`를 길드 allowlist에 추가해 주세요"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@mention 없이 응답 허용">
    기본적으로 에이전트는 길드 채널에서 @mention될 때만 응답합니다. 비공개 서버라면 모든 메시지에 응답하도록 설정하는 편이 보통 더 편리합니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 서버에서는 @mentioned되지 않아도 에이전트가 응답하도록 해 주세요"
      </Tab>
      <Tab title="Config">
        길드 구성에서 `requireMention: false`로 설정하세요.

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="길드 채널에서 메모리 사용 계획">
    기본적으로 장기 메모리(`MEMORY.md`)는 DM 세션에서만 로드됩니다. 길드 채널에서는 `MEMORY.md`가 자동으로 로드되지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 질문할 때 `MEMORY.md`의 장기 컨텍스트가 필요하면 memory_search 또는 memory_get을 사용해 주세요."
      </Tab>
      <Tab title="수동">
        모든 채널에서 공유 컨텍스트가 필요하다면 안정적인 지침은 `AGENTS.md` 또는 `USER.md`에 넣으세요(이들은 모든 세션에 주입됩니다). 장기 메모는 `MEMORY.md`에 보관하고, 필요할 때 메모리 도구로 접근하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord 서버에 몇 개의 채널을 만들고 대화를 시작하세요. 에이전트는 채널 이름을 볼 수 있으며, 각 채널은 서로 격리된 자체 세션을 갖습니다. 따라서 워크플로우에 맞게 `#coding`, `#home`, `#research` 등을 설정할 수 있습니다.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 응답 라우팅은 결정적입니다. Discord로 들어온 메시지에 대한 응답은 다시 Discord로 돌아갑니다.
- 기본값(`session.dmScope=main`)에서는 직접 채팅이 에이전트 메인 세션(`agent:main:main`)을 공유합니다.
- 길드 채널은 격리된 세션 키를 사용합니다(`agent:<agentId>:discord:channel:<channelId>`).
- 그룹 DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 네이티브 슬래시 명령은 격리된 명령 세션(`agent:<agentId>:discord:slash:<userId>`)에서 실행되지만, 라우팅된 대화 세션으로 `CommandTargetSessionKey`를 계속 전달합니다.

## 포럼 채널

Discord 포럼 및 미디어 채널은 스레드 게시물만 허용합니다. OpenClaw는 이를 만드는 두 가지 방법을 지원합니다.

- 포럼 부모(`channel:<forumId>`)에 메시지를 보내 스레드를 자동 생성합니다. 스레드 제목은 메시지의 첫 번째 비어 있지 않은 줄을 사용합니다.
- `openclaw message thread create`를 사용해 스레드를 직접 생성합니다. 포럼 채널에는 `--message-id`를 전달하지 마세요.

예시: 포럼 부모로 보내 스레드 생성

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

예시: 포럼 스레드를 명시적으로 생성

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

포럼 부모는 Discord components를 받지 않습니다. components가 필요하다면 스레드 자체(`channel:<threadId>`)로 보내세요.

## 인터랙티브 components

OpenClaw는 에이전트 메시지에 대해 Discord components v2 컨테이너를 지원합니다. `components` payload와 함께 메시지 도구를 사용하세요. 상호작용 결과는 일반적인 inbound 메시지처럼 에이전트로 다시 라우팅되며, 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 액션 행에는 최대 5개의 버튼 또는 단일 선택 메뉴를 둘 수 있습니다
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 components는 1회용입니다. 버튼, 선택 메뉴, 폼을 만료될 때까지 여러 번 사용할 수 있게 하려면 `components.reusable=true`를 설정하세요.

버튼을 누를 수 있는 사용자를 제한하려면 해당 버튼에 `allowedUsers`를 설정하세요(Discord 사용자 ID, 태그 또는 `*`). 설정된 경우 일치하지 않는 사용자는 ephemeral 거부 메시지를 받습니다.

`/model` 및 `/models` 슬래시 명령은 provider 및 모델 드롭다운과 Submit 단계가 포함된 인터랙티브 모델 선택기를 엽니다. `commands.modelsWrite=false`가 아닌 한, `/models add`는 채팅에서 새 provider/model 항목 추가도 지원하며, 새로 추가된 모델은 gateway 재시작 없이 표시됩니다. 선택기 응답은 ephemeral이며 호출한 사용자만 사용할 수 있습니다.

파일 첨부:

- `file` 블록은 첨부 참조(`attachment://<filename>`)를 가리켜야 합니다
- 첨부는 `media`/`path`/`filePath`(단일 파일)를 통해 제공하세요. 여러 파일에는 `media-gallery`를 사용하세요
- 첨부 참조와 업로드 이름이 일치해야 할 경우 `filename`으로 업로드 이름을 재정의하세요

모달 폼:

- 최대 5개 필드를 포함하는 `components.modal` 추가
- 필드 유형: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw가 트리거 버튼을 자동으로 추가합니다

예시:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.discord.dmPolicy`는 DM 접근을 제어합니다(레거시: `channels.discord.dm.policy`).

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`channels.discord.allowFrom`에 `"*"`가 포함되어야 함, 레거시: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM 정책이 open이 아니면 알 수 없는 사용자는 차단됩니다(`pairing` 모드에서는 페어링 안내가 표시될 수 있음).

    멀티 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 이름이 지정된 계정은 자체 `allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 이름이 지정된 계정은 `channels.discord.accounts.default.allowFrom`은 상속하지 않습니다.

    전송용 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    대상 종류가 명시적으로 제공되지 않으면 숫자만 있는 ID는 모호하므로 거부됩니다.

  </Tab>

  <Tab title="길드 정책">
    길드 처리는 `channels.discord.groupPolicy`로 제어됩니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 존재할 때의 안전한 기본값은 `allowlist`입니다.

    `allowlist` 동작:

    - 길드는 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, slug 허용)
    - 선택적 발신자 allowlist: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만 허용). 둘 중 하나라도 구성되면 발신자는 `users` 또는 `roles` 중 하나와 일치할 때 허용됩니다
    - 직접 이름/태그 매칭은 기본적으로 비활성화됩니다. 비상 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하세요
    - `users`에는 이름/태그도 지원되지만 ID가 더 안전합니다. 이름/태그 항목이 사용되면 `openclaw security audit`가 경고를 표시합니다
    - 길드에 `channels`가 구성되어 있으면 목록에 없는 채널은 거부됩니다
    - 길드에 `channels` 블록이 없으면 allowlist에 포함된 해당 길드의 모든 채널이 허용됩니다

    예시:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 만들지 않으면, `channels.defaults.groupPolicy`가 `open`이어도 런타임 fallback은 `groupPolicy="allowlist"`가 됩니다(로그에 경고 표시).

  </Tab>

  <Tab title="멘션 및 그룹 DM">
    길드 메시지는 기본적으로 멘션 게이트가 적용됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적인 봇 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, fallback은 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우의 암시적 봇 답글 동작

    `requireMention`은 길드/채널별로 구성합니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`는 봇이 아닌 다른 사용자/역할이 멘션된 메시지를 선택적으로 무시합니다(@everyone/@here 제외).

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - 선택적 allowlist: `dm.groupChannels`(채널 ID 또는 slug)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

`bindings[].match.roles`를 사용해 Discord 길드 구성원을 역할 ID 기준으로 서로 다른 에이전트에 라우팅하세요. 역할 기반 바인딩은 역할 ID만 허용하며, peer 또는 parent-peer 바인딩 이후이면서 길드 전용 바인딩 이전에 평가됩니다. 바인딩이 다른 match 필드도 함께 설정하는 경우(예: `peer` + `guildId` + `roles`), 구성된 모든 필드가 일치해야 합니다.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Developer Portal 설정

<AccordionGroup>
  <Accordion title="앱과 봇 만들기">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. 봇 토큰 복사

  </Accordion>

  <Accordion title="권한 있는 인텐트">
    **Bot -> Privileged Gateway Intents**에서 다음을 활성화하세요.

    - Message Content Intent
    - Server Members Intent (권장)

    Presence intent는 선택 사항이며 상태 업데이트를 받고 싶을 때만 필요합니다. 봇 상태 설정(`setPresence`)은 구성원의 상태 업데이트 활성화를 요구하지 않습니다.

  </Accordion>

  <Accordion title="OAuth scope 및 기본 권한">
    OAuth URL 생성기:

    - scopes: `bot`, `applications.commands`

    일반적인 기본 권한:

    **일반 권한**
      - View Channels
    **텍스트 권한**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (선택 사항)

    이는 일반 텍스트 채널을 위한 기본 권한 세트입니다. 포럼 또는 미디어 채널 워크플로우처럼 스레드를 만들거나 이어가는 Discord 스레드에 게시할 계획이라면 **Send Messages in Threads**도 활성화하세요.
    명시적으로 필요한 경우가 아니라면 `Administrator`는 피하세요.

  </Accordion>

  <Accordion title="ID 복사">
    Discord Developer Mode를 활성화한 다음 다음을 복사하세요.

    - server ID
    - channel ID
    - user ID

    신뢰할 수 있는 감사 및 프로브를 위해 OpenClaw config에서는 숫자 ID 사용을 권장합니다.

  </Accordion>
</AccordionGroup>

## 네이티브 명령 및 명령 인증

- `commands.native`의 기본값은 `"auto"`이며 Discord에서 활성화됩니다.
- 채널별 재정의: `channels.discord.commands.native`.
- `commands.native=false`는 이전에 등록된 Discord 네이티브 명령을 명시적으로 제거합니다.
- 네이티브 명령 인증은 일반 메시지 처리와 동일한 Discord allowlist/정책을 사용합니다.
- 권한이 없는 사용자에게도 명령이 Discord UI에 표시될 수 있지만, 실행 시에는 여전히 OpenClaw 인증이 적용되며 "not authorized"가 반환됩니다.

명령 카탈로그와 동작은 [Slash commands](/ko/tools/slash-commands)를 참조하세요.

기본 슬래시 명령 설정:

- `ephemeral: true`

## 기능 세부 정보

<AccordionGroup>
  <Accordion title="답글 태그 및 네이티브 답글">
    Discord는 에이전트 출력에서 답글 태그를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    이는 `channels.discord.replyToMode`로 제어됩니다.

    - `off` (기본값)
    - `first`
    - `all`
    - `batched`

    참고: `off`는 암시적 답글 스레딩을 비활성화합니다. 명시적인 `[[reply_to_*]]` 태그는 여전히 적용됩니다.
    `first`는 해당 턴의 첫 번째 outbound Discord 메시지에 항상 암시적 네이티브 답글 참조를 연결합니다.
    `batched`는 inbound 턴이 여러 메시지의 디바운스된 배치였을 때만 Discord의 암시적 네이티브 답글 참조를 연결합니다. 이는 모든 단일 메시지 턴이 아니라, 주로 빠르게 연속되는 모호한 채팅에만 네이티브 답글을 사용하고 싶을 때 유용합니다.

    메시지 ID는 컨텍스트/히스토리에 노출되므로 에이전트가 특정 메시지를 대상으로 지정할 수 있습니다.

  </Accordion>

  <Accordion title="실시간 스트림 미리보기">
    OpenClaw는 임시 메시지를 보내고 텍스트가 도착할 때마다 이를 수정하는 방식으로 초안 답글을 스트리밍할 수 있습니다. `channels.discord.streaming`은 `off`(기본값) | `partial` | `block` | `progress`를 받습니다. `progress`는 Discord에서 `partial`로 매핑되며, `streamMode`는 레거시 별칭으로 자동 마이그레이션됩니다.

    여러 봇 또는 gateway가 계정을 공유할 때 Discord 미리보기 수정이 빠르게 속도 제한에 걸리므로 기본값은 계속 `off`입니다.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial`는 토큰이 도착할 때 하나의 미리보기 메시지를 수정합니다.
    - `block`은 초안 크기의 청크를 출력합니다(크기와 분할 지점은 `draftChunk`로 조정하며, `textChunkLimit` 범위로 제한됨).
    - 미디어, 오류, 명시적 답글 최종본은 대기 중인 미리보기 수정을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 도구/진행 상황 업데이트에 미리보기 메시지를 재사용할지 제어합니다.

    미리보기 스트리밍은 텍스트 전용입니다. 미디어 답글은 일반 전송 방식으로 fallback됩니다. `block` 스트리밍이 명시적으로 활성화되면 OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

  </Accordion>

  <Accordion title="히스토리, 컨텍스트 및 스레드 동작">
    길드 히스토리 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    DM 히스토리 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의되지 않는 한 부모 채널 구성을 상속합니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)는 새 자동 스레드가 부모 transcript에서 시드되도록 설정합니다. 계정별 재정의는 `channels.discord.accounts.<id>.thread.inheritParent` 아래에 있습니다.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 확인할 수 있습니다.
    - `guilds.<guild>.channels.<channel>.requireMention: false`는 답글 단계 활성화 fallback 동안 유지됩니다.

    채널 주제는 **신뢰되지 않는** 컨텍스트로 주입됩니다. allowlist는 누가 에이전트를 트리거할 수 있는지를 제어할 뿐이며, 전체 보조 컨텍스트 가림 경계는 아닙니다.

  </Accordion>

  <Accordion title="subagent용 스레드 바운드 세션">
    Discord는 스레드를 세션 대상에 바인딩할 수 있으므로, 해당 스레드의 후속 메시지가 계속 같은 세션(하위 에이전트 세션 포함)으로 라우팅됩니다.

    명령:

    - `/focus <target>` 현재/새 스레드를 하위 에이전트/세션 대상에 바인딩
    - `/unfocus` 현재 스레드 바인딩 제거
    - `/agents` 활성 실행 및 바인딩 상태 표시
    - `/session idle <duration|off>` 포커스된 바인딩의 비활성 자동 unfocus 확인/업데이트
    - `/session max-age <duration|off>` 포커스된 바인딩의 하드 최대 수명 확인/업데이트

    구성:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    참고:

    - `session.threadBindings.*`는 전역 기본값을 설정합니다.
    - `channels.discord.threadBindings.*`는 Discord 동작을 재정의합니다.
    - `sessions_spawn({ thread: true })`에 대해 스레드를 자동 생성/바인딩하려면 `spawnSubagentSessions`가 true여야 합니다.
    - ACP에 대해 스레드를 자동 생성/바인딩하려면 `spawnAcpSessions`가 true여야 합니다(`/acp spawn ... --thread ...` 또는 `sessions_spawn({ runtime: "acp", thread: true })`).
    - 계정에 대해 스레드 바인딩이 비활성화되어 있으면 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    [Sub-agents](/ko/tools/subagents), [ACP Agents](/ko/tools/acp-agents), [Configuration Reference](/ko/gateway/configuration-reference)를 참조하세요.

  </Accordion>

  <Accordion title="영구 ACP 채널 바인딩">
    안정적인 "항상 켜짐" ACP 워크스페이스의 경우, Discord 대화를 대상으로 하는 최상위 typed ACP 바인딩을 구성하세요.

    Config 경로:

    - `bindings[]`에서 `type: "acp"` 및 `match.channel: "discord"` 사용

    예시:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    참고:

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 그 자리에서 바인딩하고, 이후 메시지를 같은 ACP 세션에 계속 유지합니다. 스레드 메시지는 부모 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new`와 `/reset`은 같은 ACP 세션을 그 자리에서 재설정합니다. 임시 스레드 바인딩은 활성 상태일 때 대상 확인을 재정의할 수 있습니다.
    - `spawnAcpSessions`는 OpenClaw가 `--thread auto|here`를 통해 자식 스레드를 생성/바인딩해야 할 때만 필요합니다.

    바인딩 동작에 대한 자세한 내용은 [ACP Agents](/ko/tools/acp-agents)를 참조하세요.

  </Accordion>

  <Accordion title="리액션 알림">
    길드별 리액션 알림 모드:

    - `off`
    - `own` (기본값)
    - `all`
    - `allowlist` (`guilds.<id>.users` 사용)

    리액션 이벤트는 시스템 이벤트로 변환되어 라우팅된 Discord 세션에 첨부됩니다.

  </Accordion>

  <Accordion title="Ack 리액션">
    `ackReaction`은 OpenClaw가 inbound 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    확인 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 identity 이모지 fallback (`agents.list[].identity.emoji`, 없으면 `"👀"`)

    참고:

    - Discord는 유니코드 이모지 또는 커스텀 이모지 이름을 허용합니다.
    - 채널 또는 계정에서 리액션을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="Config 쓰기">
    채널에서 시작한 config 쓰기는 기본적으로 활성화되어 있습니다.

    이는 `/config set|unset` 흐름에 영향을 줍니다(명령 기능이 활성화된 경우).

    비활성화:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    `channels.discord.proxy`를 사용하여 Discord gateway WebSocket 트래픽 및 시작 REST 조회(애플리케이션 ID + allowlist 확인)를 HTTP(S) proxy를 통해 라우팅하세요.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    계정별 재정의:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit 지원">
    프록시된 메시지를 시스템 구성원 identity에 매핑하기 위해 PluralKit 확인을 활성화하세요.

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 선택 사항, 비공개 시스템에 필요
      },
    },
  },
}
```

    참고:

    - allowlist는 `pk:<memberId>`를 사용할 수 있습니다
    - 구성원 표시 이름은 `channels.discord.dangerouslyAllowNameMatching: true`일 때만 이름/slug 기준으로 매칭됩니다
    - 조회는 원본 메시지 ID를 사용하며 시간 창 제약을 받습니다
    - 조회에 실패하면 프록시된 메시지는 봇 메시지로 처리되어 `allowBots=true`가 아닌 한 폐기됩니다

  </Accordion>

  <Accordion title="상태 구성">
    상태 또는 활동 필드를 설정하거나 자동 상태를 활성화하면 상태 업데이트가 적용됩니다.

    상태만 설정하는 예시:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    활동 예시(커스텀 상태가 기본 활동 유형):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    스트리밍 예시:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    활동 유형 매핑:

    - 0: Playing
    - 1: Streaming (`activityUrl` 필요)
    - 2: Listening
    - 3: Watching
    - 4: Custom (활동 텍스트를 상태 값으로 사용, 이모지는 선택 사항)
    - 5: Competing

    자동 상태 예시(런타임 상태 신호):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    자동 상태는 런타임 가용성을 Discord 상태에 매핑합니다. healthy => online, degraded 또는 unknown => idle, exhausted 또는 unavailable => dnd. 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` placeholder 지원)

  </Accordion>

  <Accordion title="Discord의 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 원래 채널에 승인 프롬프트를 게시할 수 있습니다.

    Config 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (선택 사항, 가능하면 `commands.ownerAllowFrom`으로 fallback)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled`가 설정되지 않았거나 `"auto"`이고 `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 최소 한 명의 approver를 확인할 수 있으면 Discord는 네이티브 exec 승인을 자동으로 활성화합니다. Discord는 채널 `allowFrom`, 레거시 `dm.allowFrom`, 또는 direct-message `defaultTo`에서 exec approver를 추론하지 않습니다. Discord를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.

    `target`이 `channel` 또는 `both`이면 승인 프롬프트가 채널에 표시됩니다. 확인된 approver만 버튼을 사용할 수 있으며, 다른 사용자는 ephemeral 거부 메시지를 받습니다. 승인 프롬프트에는 명령 텍스트가 포함되므로 신뢰할 수 있는 채널에서만 채널 전달을 활성화하세요. 세션 키에서 채널 ID를 확인할 수 없으면 OpenClaw는 DM 전달로 fallback됩니다.

    Discord는 다른 채팅 채널에서 사용하는 공유 승인 버튼도 렌더링합니다. 네이티브 Discord 어댑터는 주로 approver DM 라우팅과 채널 fanout을 추가합니다.
    이러한 버튼이 있으면 그것이 기본 승인 UX이며, OpenClaw는 도구 결과에서 채팅 승인을 사용할 수 없다고 표시하거나 수동 승인이 유일한 경로일 때만 수동 `/approve` 명령을 포함해야 합니다.

    Gateway 인증 및 승인 확인은 공유 Gateway 클라이언트 계약을 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해, 그 외 ID는 `exec.approval.resolve`를 통해 확인). 승인은 기본적으로 30분 후 만료됩니다.

    자세한 내용은 [Exec approvals](/ko/tools/exec-approvals)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 도구 및 액션 게이트

Discord 메시지 액션에는 메시징, 채널 관리, moderation, 상태, 메타데이터 액션이 포함됩니다.

핵심 예시:

- 메시징: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- 리액션: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- 상태: `setPresence`

`event-create` 액션은 예약 이벤트 커버 이미지를 설정하기 위한 선택적 `image` 매개변수(URL 또는 로컬 파일 경로)를 받습니다.

액션 게이트는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| Action group                                                                                                                                                             | 기본값 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 활성화됨 |
| roles                                                                                                                                                                    | 비활성화됨 |
| moderation                                                                                                                                                               | 비활성화됨 |
| presence                                                                                                                                                                 | 비활성화됨 |

## Components v2 UI

OpenClaw는 exec 승인 및 교차 컨텍스트 마커에 Discord components v2를 사용합니다. Discord 메시지 액션도 커스텀 UI용 `components`를 받을 수 있습니다(고급 기능, discord 도구를 통해 component payload를 구성해야 함). 반면 레거시 `embeds`도 계속 사용할 수 있지만 권장되지는 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord component 컨테이너에 사용되는 강조 색상(hex)을 설정합니다.
- 계정별 설정은 `channels.discord.accounts.<id>.ui.components.accentColor`를 사용하세요.
- components v2가 있으면 `embeds`는 무시됩니다.

예시:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 음성

Discord에는 두 가지 서로 다른 음성 표면이 있습니다. 실시간 **voice channels**(연속 대화)와 **voice message attachments**(파형 미리보기 형식)입니다. gateway는 둘 다 지원합니다.

### Voice channels

요구 사항:

- 네이티브 명령을 활성화하세요(`commands.native` 또는 `channels.discord.commands.native`).
- `channels.discord.voice`를 구성하세요.
- 봇은 대상 voice 채널에서 Connect + Speak 권한이 있어야 합니다.

세션 제어에는 `/vc join|leave|status`를 사용하세요. 이 명령은 계정 기본 에이전트를 사용하며, 다른 Discord 명령과 동일한 allowlist 및 그룹 정책 규칙을 따릅니다.

자동 참여 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

참고:

- `voice.tts`는 음성 재생에 대해서만 `messages.tts`를 재정의합니다.
- 음성 transcript 턴은 Discord `allowFrom`(또는 `dm.allowFrom`)에서 소유자 상태를 도출합니다. 소유자가 아닌 화자는 소유자 전용 도구(예: `gateway`, `cron`)에 접근할 수 없습니다.
- 음성은 기본적으로 활성화되어 있습니다. 비활성화하려면 `channels.discord.voice.enabled=false`를 설정하세요.
- `voice.daveEncryption` 및 `voice.decryptionFailureTolerance`는 `@discordjs/voice` join 옵션으로 그대로 전달됩니다.
- 설정되지 않으면 `@discordjs/voice` 기본값은 `daveEncryption=true` 및 `decryptionFailureTolerance=24`입니다.
- OpenClaw는 수신 복호화 실패도 감시하며, 짧은 시간 창에서 반복 실패가 발생하면 voice 채널에서 나갔다가 다시 참여해 자동 복구합니다.
- 수신 로그에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복적으로 표시되면, 이는 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)에서 추적 중인 상위 `@discordjs/voice` 수신 버그일 수 있습니다.

### 음성 메시지

Discord 음성 메시지는 파형 미리보기를 표시하며 OGG/Opus 오디오가 필요합니다. OpenClaw는 파형을 자동으로 생성하지만, 검사 및 변환을 위해 gateway 호스트에 `ffmpeg`와 `ffprobe`가 있어야 합니다.

- **로컬 파일 경로**를 제공하세요(URL은 거부됨).
- 텍스트 콘텐츠는 생략하세요(Discord는 동일한 payload에서 텍스트 + 음성 메시지를 거부함).
- 모든 오디오 형식이 허용되며, 필요하면 OpenClaw가 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="허용되지 않은 intents를 사용했거나 봇이 길드 메시지를 보지 못함">

    - Message Content Intent 활성화
    - 사용자/구성원 확인에 의존하는 경우 Server Members Intent 활성화
    - intents 변경 후 gateway 재시작

  </Accordion>

  <Accordion title="길드 메시지가 예상치 못하게 차단됨">

    - `groupPolicy` 확인
    - `channels.discord.guilds` 아래의 길드 allowlist 확인
    - 길드에 `channels` 맵이 있으면 목록에 있는 채널만 허용됨
    - `requireMention` 동작 및 멘션 패턴 확인

    유용한 확인 명령:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention이 false인데도 여전히 차단됨">
    일반적인 원인:

    - 일치하는 길드/채널 allowlist 없이 `groupPolicy="allowlist"` 사용
    - `requireMention`이 잘못된 위치에 구성됨(`channels.discord.guilds` 또는 채널 항목 아래에 있어야 함)
    - 길드/채널 `users` allowlist에 의해 발신자가 차단됨

  </Accordion>

  <Accordion title="오래 실행되는 핸들러가 시간 초과되거나 중복 답글이 발생함">

    일반적인 로그:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    리스너 예산 설정:

    - 단일 계정: `channels.discord.eventQueue.listenerTimeout`
    - 멀티 계정: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    워커 실행 시간 초과 설정:

    - 단일 계정: `channels.discord.inboundWorker.runTimeoutMs`
    - 멀티 계정: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 기본값: `1800000` (30분), 비활성화하려면 `0` 설정

    권장 기본값:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    느린 리스너 설정에는 `eventQueue.listenerTimeout`을 사용하고, 대기 중인 에이전트 턴에 대해 별도의 안전장치가 필요할 때만 `inboundWorker.runTimeoutMs`를 사용하세요.

  </Accordion>

  <Accordion title="권한 감사 불일치">
    `channels status --probe` 권한 확인은 숫자 채널 ID에 대해서만 작동합니다.

    slug 키를 사용해도 런타임 매칭은 계속 작동할 수 있지만, probe는 권한을 완전히 검증할 수 없습니다.

  </Accordion>

  <Accordion title="DM 및 페어링 문제">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"` (레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인 대기 중

  </Accordion>

  <Accordion title="봇 간 루프">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`로 설정한 경우, 루프 동작을 피하려면 엄격한 멘션 및 allowlist 규칙을 사용하세요.
    봇을 멘션한 봇 메시지만 받도록 하려면 `channels.discord.allowBots="mentions"`를 권장합니다.

  </Accordion>

  <Accordion title="DecryptionFailed(...)로 인한 음성 STT 누락">

    - Discord 음성 수신 복구 로직이 포함되도록 OpenClaw를 최신 상태로 유지하세요(`openclaw update`)
    - `channels.discord.voice.daveEncryption=true`인지 확인하세요(기본값)
    - `channels.discord.voice.decryptionFailureTolerance=24`(상위 기본값)부터 시작하고 필요할 때만 조정하세요
    - 다음 로그를 확인하세요:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참여 후에도 실패가 계속되면 로그를 수집하고 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)와 비교하세요

  </Accordion>
</AccordionGroup>

## Configuration reference 포인터

기본 참조:

- [Configuration reference - Discord](/ko/gateway/configuration-reference#discord)

신호가 강한 Discord 필드:

- 시작/인증: `enabled`, `token`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 이벤트 큐: `eventQueue.listenerTimeout` (리스너 예산), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound 워커: `inboundWorker.runTimeoutMs`
- 답글/히스토리: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전송: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 스트리밍: `streaming` (레거시 별칭: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 미디어/재시도: `mediaMaxMb`, `retry`
  - `mediaMaxMb`는 outbound Discord 업로드 한도를 설정합니다(기본값: `100MB`)
- 액션: `actions.*`
- 상태: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## 보안 및 운영

- 봇 토큰은 비밀 정보로 취급하세요(감독되는 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- 최소 권한의 Discord 권한만 부여하세요.
- 명령 배포/상태가 오래된 경우 gateway를 재시작하고 `openclaw channels status --probe`로 다시 확인하세요.

## 관련 항목

- [Pairing](/ko/channels/pairing)
- [Groups](/ko/channels/groups)
- [Channel routing](/ko/channels/channel-routing)
- [Security](/ko/gateway/security)
- [Multi-agent routing](/ko/concepts/multi-agent)
- [Troubleshooting](/ko/channels/troubleshooting)
- [Slash commands](/ko/tools/slash-commands)
