---
read_when:
    - Discord 채널 기능 작업 중
summary: Discord 봇 지원 상태, 기능, 구성
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

공식 Discord Gateway를 통해 DM과 guild 채널을 사용할 준비가 되었습니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord DM은 기본적으로 페어링 모드로 설정됩니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    기본 명령 동작 및 명령 카탈로그.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반 진단 및 복구 흐름.
  </Card>
</CardGroup>

## 빠른 설정

새 애플리케이션과 봇을 만들고, 봇을 서버에 추가한 뒤, OpenClaw와 페어링해야 합니다. 봇은 본인만 사용하는 비공개 서버에 추가하는 것을 권장합니다. 아직 없다면 먼저 [서버를 만드세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** 선택).

<Steps>
  <Step title="Discord 애플리케이션과 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동해 **New Application**을 클릭하세요. 이름은 "OpenClaw"처럼 지정하면 됩니다.

    왼쪽 사이드바에서 **Bot**을 클릭하세요. **Username**은 OpenClaw 에이전트를 부르는 이름으로 설정하세요.

  </Step>

  <Step title="권한이 필요한 인텐트 활성화">
    계속해서 **Bot** 페이지에서 아래로 스크롤해 **Privileged Gateway Intents**로 이동한 다음, 다음을 활성화하세요.

    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장, 역할 허용 목록 및 이름→ID 매칭에 필요)
    - **Presence Intent** (선택 사항, 상태 업데이트가 필요할 때만 필요)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지 상단으로 다시 올라가 **Reset Token**을 클릭하세요.

    <Note>
    이름과 달리, 이것은 첫 토큰을 생성하는 동작이며 “재설정”되는 것은 없습니다.
    </Note>

    토큰을 복사해 안전한 곳에 저장하세요. 이것이 **Bot Token**이며, 곧 필요합니다.

  </Step>

  <Step title="초대 URL 생성 및 서버에 봇 추가">
    사이드바에서 **OAuth2**를 클릭하세요. 서버에 봇을 추가할 수 있도록 올바른 권한이 포함된 초대 URL을 생성하게 됩니다.

    아래로 스크롤해 **OAuth2 URL Generator**에서 다음을 활성화하세요.

    - `bot`
    - `applications.commands`

    아래에 **Bot Permissions** 섹션이 나타납니다. 최소한 다음 권한을 활성화하세요.

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (선택 사항)

    이것은 일반 텍스트 채널용 기본 권한 집합입니다. Discord 스레드에 게시할 계획이 있고, 포럼 또는 미디어 채널 워크플로에서 스레드를 만들거나 이어가는 경우도 포함된다면 **Send Messages in Threads**도 활성화하세요.
    아래에 생성된 URL을 복사해 브라우저에 붙여넣고, 서버를 선택한 뒤 **Continue**를 클릭해 연결하세요. 이제 Discord 서버에서 봇이 보여야 합니다.

  </Step>

  <Step title="Developer Mode 활성화 및 ID 수집">
    Discord 앱으로 돌아가 내부 ID를 복사할 수 있도록 Developer Mode를 활성화해야 합니다.

    1. **User Settings** (아바타 옆 톱니바퀴 아이콘) → **Advanced** → **Developer Mode** 켜기
    2. 사이드바에서 **서버 아이콘** 우클릭 → **Copy Server ID**
    3. **내 아바타** 우클릭 → **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장해 두세요. 다음 단계에서 이 세 가지를 모두 OpenClaw에 전달하게 됩니다.

  </Step>

  <Step title="서버 멤버의 DM 허용">
    페어링이 작동하려면 Discord에서 봇이 사용자에게 DM을 보낼 수 있어야 합니다. **서버 아이콘**을 우클릭 → **Privacy Settings** → **Direct Messages** 켜기.

    이렇게 하면 서버 멤버(봇 포함)가 사용자에게 DM을 보낼 수 있습니다. OpenClaw와 Discord DM을 사용하려면 이 설정을 켜둔 상태로 유지하세요. guild 채널만 사용할 계획이라면 페어링 후 DM을 비활성화해도 됩니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정하기(채팅으로 보내지 마세요)">
    Discord 봇 토큰은 비밀 정보입니다(비밀번호와 유사). 에이전트에게 메시지를 보내기 전에 OpenClaw가 실행 중인 머신에 설정하세요.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw가 이미 백그라운드 서비스로 실행 중이라면 OpenClaw Mac 앱에서 재시작하거나 `openclaw gateway run` 프로세스를 중지 후 다시 시작하세요.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 대화하며 요청하세요. Discord가 첫 번째 채널이라면 CLI / config 탭을 사용하세요.

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

        기본 계정용 env 폴백:

```bash
DISCORD_BOT_TOKEN=...
```

        일반 텍스트 `token` 값도 지원됩니다. `channels.discord.token`에는 env/file/exec provider 전반에서 SecretRef 값도 지원됩니다. 자세한 내용은 [Secrets Management](/ko/gateway/secrets)를 참고하세요.

      </Tab>
    </Tabs>

  </Step>

  <Step title="첫 DM 페어링 승인">
    Gateway가 실행될 때까지 기다린 다음, Discord에서 봇에게 DM을 보내세요. 봇이 페어링 코드를 응답합니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널에서 페어링 코드를 에이전트에게 보내세요.

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

    이제 Discord에서 DM으로 에이전트와 대화할 수 있어야 합니다.

  </Step>
</Steps>

<Note>
토큰 확인은 계정 인식 방식으로 동작합니다. config의 토큰 값이 env 폴백보다 우선합니다. `DISCORD_BOT_TOKEN`은 기본 계정에서만 사용됩니다.
고급 outbound 호출(메시지 도구/채널 작업)의 경우, 호출별로 명시적인 `token`이 해당 호출에 사용됩니다. 이는 send와 read/probe 계열 작업(예: read/search/fetch/thread/pins/permissions)에 적용됩니다. 계정 정책/retry 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정으로부터 가져옵니다.
</Note>

## 권장: guild 워크스페이스 설정

DM이 동작하기 시작하면 Discord 서버를 전체 워크스페이스로 설정할 수 있습니다. 이 경우 각 채널은 자체 컨텍스트를 가진 별도의 에이전트 세션을 갖습니다. 본인과 봇만 있는 비공개 서버라면 이 방식을 권장합니다.

<Steps>
  <Step title="서버를 guild 허용 목록에 추가">
    이렇게 하면 에이전트가 DM뿐 아니라 서버의 모든 채널에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord Server ID `<server_id>`를 guild 허용 목록에 추가해 주세요"
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
    기본적으로 에이전트는 guild 채널에서 @mention될 때만 응답합니다. 비공개 서버라면 모든 메시지에 응답하도록 설정하는 것이 더 적합할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "이 서버에서 내 에이전트가 @mention 없이도 응답하도록 허용해 주세요"
      </Tab>
      <Tab title="Config">
        guild config에서 `requireMention: false`로 설정하세요.

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

  <Step title="guild 채널의 메모리 계획">
    기본적으로 장기 메모리(`MEMORY.md`)는 DM 세션에서만 로드됩니다. guild 채널에서는 `MEMORY.md`가 자동으로 로드되지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 질문할 때 `MEMORY.md`의 장기 컨텍스트가 필요하면 memory_search 또는 memory_get을 사용해 주세요."
      </Tab>
      <Tab title="수동">
        모든 채널에서 공통 컨텍스트가 필요하다면 안정적인 지침은 `AGENTS.md` 또는 `USER.md`에 두세요(모든 세션에 주입됩니다). 장기 메모는 `MEMORY.md`에 보관하고, 필요할 때 메모리 도구로 접근하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord 서버에 몇 개의 채널을 만들고 대화를 시작하세요. 에이전트는 채널 이름을 볼 수 있으며, 각 채널은 자체적으로 격리된 세션을 갖습니다. 따라서 워크플로에 맞게 `#coding`, `#home`, `#research` 같은 채널을 구성할 수 있습니다.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 응답 라우팅은 결정적입니다. Discord에서 들어온 메시지에 대한 응답은 다시 Discord로 돌아갑니다.
- Discord guild/channel 메타데이터는 사용자에게 보이는 응답 접두사가 아니라, 신뢰되지 않는 컨텍스트로 모델 프롬프트에 추가됩니다. 모델이 이 엔벌로프를 그대로 되돌려 보내면 OpenClaw는 outbound 응답과 이후 재생 컨텍스트에서 복사된 메타데이터를 제거합니다.
- 기본값(`session.dmScope=main`)에서는 direct chat이 에이전트의 메인 세션(`agent:main:main`)을 공유합니다.
- Guild 채널은 격리된 세션 키(`agent:<agentId>:discord:channel:<channelId>`)를 사용합니다.
- Group DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 기본 슬래시 명령어는 격리된 명령 세션(`agent:<agentId>:discord:slash:<userId>`)에서 실행되며, 동시에 라우팅된 대화 세션으로 `CommandTargetSessionKey`를 전달합니다.
- Discord로의 텍스트 전용 Cron/Heartbeat 공지 전달은 assistant에 최종적으로 보이는 답변을 한 번만 사용합니다. 에이전트가 여러 개의 전달 가능한 payload를 내보내는 경우, 미디어 및 구조화된 컴포넌트 payload는 여전히 여러 메시지로 유지됩니다.

## 포럼 채널

Discord 포럼 및 미디어 채널은 스레드 게시물만 허용합니다. OpenClaw는 이를 만드는 두 가지 방법을 지원합니다.

- 포럼 부모 채널(`channel:<forumId>`)에 메시지를 보내 스레드를 자동 생성합니다. 스레드 제목은 메시지의 첫 번째 비어 있지 않은 줄을 사용합니다.
- `openclaw message thread create`를 사용해 직접 스레드를 생성합니다. 포럼 채널에서는 `--message-id`를 전달하지 마세요.

예시: 포럼 부모에 보내 스레드 생성

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

예시: 포럼 스레드를 명시적으로 생성

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

포럼 부모 채널은 Discord 컴포넌트를 허용하지 않습니다. 컴포넌트가 필요하다면 스레드 자체(`channel:<threadId>`)로 보내세요.

## 인터랙티브 컴포넌트

OpenClaw는 에이전트 메시지용 Discord components v2 컨테이너를 지원합니다. `components` payload와 함께 메시지 도구를 사용하세요. 상호작용 결과는 일반적인 inbound 메시지로 다시 에이전트에 라우팅되며, 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 액션 행은 최대 5개의 버튼 또는 단일 선택 메뉴를 허용합니다
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 컴포넌트는 한 번만 사용할 수 있습니다. 버튼, 선택 메뉴, 폼을 만료될 때까지 여러 번 사용할 수 있게 하려면 `components.reusable=true`를 설정하세요.

버튼을 클릭할 수 있는 사용자를 제한하려면 해당 버튼에 `allowedUsers`를 설정하세요(Discord 사용자 ID, 태그 또는 `*`). 구성된 경우, 일치하지 않는 사용자는 ephemeral 거부 응답을 받습니다.

`/model` 및 `/models` 슬래시 명령어는 provider, model, 호환 runtime 드롭다운과 Submit 단계가 포함된 대화형 모델 선택기를 엽니다. `/models add`는 더 이상 사용되지 않으며, 이제 채팅에서 모델을 등록하는 대신 사용 중단 메시지를 반환합니다. 선택기 응답은 ephemeral이며, 이를 호출한 사용자만 사용할 수 있습니다.

파일 첨부:

- `file` 블록은 첨부 참조(`attachment://<filename>`)를 가리켜야 합니다
- 첨부는 `media`/`path`/`filePath`(단일 파일)를 통해 제공하세요. 여러 파일은 `media-gallery`를 사용하세요
- 첨부 참조와 업로드 이름이 일치해야 할 때는 `filename`으로 업로드 이름을 재정의하세요

모달 폼:

- 최대 5개 필드까지 `components.modal`을 추가하세요
- 필드 유형: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw가 트리거 버튼을 자동으로 추가합니다

예시:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "선택 사항인 폴백 텍스트",
  components: {
    reusable: true,
    text: "경로를 선택하세요",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "승인",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "거절", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "옵션을 선택하세요",
          options: [
            { label: "옵션 A", value: "a" },
            { label: "옵션 B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "세부 정보",
      triggerLabel: "폼 열기",
      fields: [
        { type: "text", label: "요청자" },
        {
          type: "select",
          label: "우선순위",
          options: [
            { label: "낮음", value: "low" },
            { label: "높음", value: "high" },
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
    `channels.discord.dmPolicy`가 DM 액세스를 제어합니다(레거시: `channels.discord.dm.policy`).

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`channels.discord.allowFrom`에 `"*"`가 포함되어야 함, 레거시: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM 정책이 open이 아니면 알 수 없는 사용자는 차단됩니다(`pairing` 모드에서는 페어링 안내가 표시될 수 있음).

    멀티 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 이름 있는 계정은 자체 `allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 이름 있는 계정은 `channels.discord.accounts.default.allowFrom`을 상속하지 않습니다.

    전달용 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    숫자 ID만 단독으로 쓰는 형식은 모호하므로, 명시적인 user/channel 대상 종류가 제공되지 않으면 거부됩니다.

  </Tab>

  <Tab title="Guild 정책">
    Guild 처리 방식은 `channels.discord.groupPolicy`로 제어됩니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 존재할 때의 안전한 기본값은 `allowlist`입니다.

    `allowlist` 동작:

    - guild는 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, slug 허용)
    - 선택적 발신자 허용 목록: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만). 둘 중 하나라도 구성되어 있으면 발신자는 `users` 또는 `roles` 중 하나와 일치할 때 허용됩니다
    - 직접적인 이름/태그 매칭은 기본적으로 비활성화되어 있습니다. 비상 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하세요
    - `users`에는 이름/태그도 지원되지만 ID가 더 안전합니다. 이름/태그 항목을 사용하면 `openclaw security audit`가 경고를 표시합니다
    - guild에 `channels`가 구성되어 있으면 목록에 없는 채널은 거부됩니다
    - guild에 `channels` 블록이 없으면 허용 목록에 있는 해당 guild의 모든 채널이 허용됩니다

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

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 만들지 않으면, 런타임 폴백은 `groupPolicy="allowlist"`가 됩니다(로그에 경고 표시). 이는 `channels.defaults.groupPolicy`가 `open`이어도 동일합니다.

  </Tab>

  <Tab title="멘션 및 그룹 DM">
    Guild 메시지는 기본적으로 멘션이 있어야 처리됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적인 봇 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우 암묵적인 reply-to-bot 동작

    `requireMention`은 guild/channel별로 구성됩니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`를 설정하면 다른 사용자/역할을 멘션했지만 봇은 멘션하지 않은 메시지(@everyone/@here 제외)를 선택적으로 버릴 수 있습니다.

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - 선택적 허용 목록: `dm.groupChannels`(채널 ID 또는 slug)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

`bindings[].match.roles`를 사용해 Discord guild 멤버를 역할 ID 기준으로 서로 다른 에이전트에 라우팅하세요. 역할 기반 바인딩은 역할 ID만 허용하며, peer 또는 parent-peer 바인딩 다음, guild-only 바인딩 전에 평가됩니다. 바인딩이 다른 match 필드도 함께 설정하는 경우(예: `peer` + `guildId` + `roles`), 구성된 모든 필드가 일치해야 합니다.

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

## 기본 명령어 및 명령 인증

- `commands.native`의 기본값은 `"auto"`이며 Discord에서 활성화됩니다.
- 채널별 재정의: `channels.discord.commands.native`.
- `commands.native=false`는 이전에 등록된 Discord 기본 명령어를 명시적으로 제거합니다.
- 기본 명령어 인증은 일반 메시지 처리와 동일한 Discord 허용 목록/정책을 사용합니다.
- Discord UI에서는 권한이 없는 사용자에게도 명령어가 보일 수 있지만, 실행 시에는 여전히 OpenClaw 인증이 적용되며 "권한 없음"을 반환합니다.

명령어 카탈로그와 동작은 [슬래시 명령어](/ko/tools/slash-commands)를 참고하세요.

기본 슬래시 명령어 설정:

- `ephemeral: true`

## 기능 세부 정보

<AccordionGroup>
  <Accordion title="답글 태그 및 기본 답글">
    Discord는 에이전트 출력에서 reply 태그를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode`로 제어됩니다.

    - `off` (기본값)
    - `first`
    - `all`
    - `batched`

    참고: `off`는 암묵적인 답글 스레딩을 비활성화합니다. 명시적인 `[[reply_to_*]]` 태그는 여전히 적용됩니다.
    `first`는 항상 해당 턴의 첫 번째 outbound Discord 메시지에 암묵적인 기본 reply 참조를 첨부합니다.
    `batched`는 inbound 턴이 여러 메시지의 디바운스된 배치였을 때만 Discord의 암묵적인 기본 reply 참조를 첨부합니다. 이는 모든 단일 메시지 턴이 아니라, 주로 문맥이 모호한 연속 메시지 대화에서만 기본 reply를 사용하고 싶을 때 유용합니다.

    메시지 ID는 컨텍스트/히스토리에 노출되므로 에이전트가 특정 메시지를 대상으로 지정할 수 있습니다.

  </Accordion>

  <Accordion title="라이브 스트림 미리보기">
    OpenClaw는 임시 메시지를 보내고 텍스트가 도착할 때마다 수정하는 방식으로 초안 답변을 스트리밍할 수 있습니다. `channels.discord.streaming`은 `off` (기본값) | `partial` | `block` | `progress` 값을 받습니다. `progress`는 Discord에서 `partial`에 매핑되며, `streamMode`는 레거시 별칭으로 자동 마이그레이션됩니다.

    여러 봇 또는 Gateway가 하나의 계정을 공유할 때 Discord 미리보기 수정이 rate limit에 빠르게 도달하기 때문에 기본값은 `off`로 유지됩니다.

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

    - `partial`은 토큰이 도착할 때마다 하나의 미리보기 메시지를 수정합니다.
    - `block`은 초안 크기의 청크를 출력합니다(크기와 분할 지점은 `draftChunk`로 조정하며, `textChunkLimit`에 맞게 제한됨).
    - 미디어, 오류, 명시적 reply 최종본은 대기 중인 미리보기 수정을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 tool/progress 업데이트가 미리보기 메시지를 재사용할지 제어합니다.

    미리보기 스트리밍은 텍스트 전용이며, 미디어 답변은 일반 전달 방식으로 폴백됩니다. `block` 스트리밍이 명시적으로 활성화된 경우 OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

  </Accordion>

  <Accordion title="히스토리, 컨텍스트 및 스레드 동작">
    Guild 히스토리 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - 폴백: `messages.groupChat.historyLimit`
    - `0`이면 비활성화

    DM 히스토리 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의되지 않는 한 부모 채널 구성을 상속합니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)는 새 자동 스레드가 부모 transcript를 기반으로 초기화되도록 설정합니다. 계정별 재정의는 `channels.discord.accounts.<id>.thread.inheritParent` 아래에 있습니다.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 해석할 수 있습니다.
    - `guilds.<guild>.channels.<channel>.requireMention: false`는 reply 단계 활성화 폴백 중에도 유지됩니다.

    채널 토픽은 **신뢰되지 않는** 컨텍스트로 주입됩니다. 허용 목록은 누가 에이전트를 트리거할 수 있는지를 제어할 뿐, 완전한 보조 컨텍스트 차단 경계는 아닙니다.

  </Accordion>

  <Accordion title="서브에이전트용 스레드 바인딩 세션">
    Discord는 스레드를 세션 대상에 바인딩할 수 있으므로, 해당 스레드의 후속 메시지가 계속 같은 세션(서브에이전트 세션 포함)으로 라우팅됩니다.

    명령어:

    - `/focus <target>` 현재/새 스레드를 서브에이전트/세션 대상에 바인딩
    - `/unfocus` 현재 스레드 바인딩 제거
    - `/agents` 활성 실행 및 바인딩 상태 표시
    - `/session idle <duration|off>` 포커스된 바인딩의 비활성 자동 unfocus 검사/업데이트
    - `/session max-age <duration|off>` 포커스된 바인딩의 하드 최대 수명 검사/업데이트

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
        spawnSubagentSessions: false, // 옵트인
      },
    },
  },
}
```

    참고:

    - `session.threadBindings.*`는 전역 기본값을 설정합니다.
    - `channels.discord.threadBindings.*`는 Discord 동작을 재정의합니다.
    - `sessions_spawn({ thread: true })`에 대해 스레드를 자동 생성/바인딩하려면 `spawnSubagentSessions`가 true여야 합니다.
    - ACP에 대해(`/acp spawn ... --thread ...` 또는 `sessions_spawn({ runtime: "acp", thread: true })`) 스레드를 자동 생성/바인딩하려면 `spawnAcpSessions`가 true여야 합니다.
    - 계정에서 스레드 바인딩이 비활성화되어 있으면 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    자세한 내용은 [Sub-agents](/ko/tools/subagents), [ACP Agents](/ko/tools/acp-agents), [Configuration Reference](/ko/gateway/configuration-reference)를 참고하세요.

  </Accordion>

  <Accordion title="지속적인 ACP 채널 바인딩">
    안정적인 "always-on" ACP 워크스페이스를 위해 Discord 대화를 대상으로 하는 최상위 typed ACP 바인딩을 구성하세요.

    구성 경로:

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

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 그 자리에서 바인딩하고, 이후 메시지도 동일한 ACP 세션에 유지합니다. 스레드 메시지는 부모 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new`와 `/reset`은 동일한 ACP 세션을 그 자리에서 재설정합니다. 임시 스레드 바인딩은 활성 상태인 동안 대상 해석을 재정의할 수 있습니다.
    - `spawnAcpSessions`는 OpenClaw가 `--thread auto|here`를 통해 하위 스레드를 생성/바인딩해야 할 때만 필요합니다.

    바인딩 동작에 대한 자세한 내용은 [ACP Agents](/ko/tools/acp-agents)를 참고하세요.

  </Accordion>

  <Accordion title="반응 알림">
    guild별 반응 알림 모드:

    - `off`
    - `own` (기본값)
    - `all`
    - `allowlist` (`guilds.<id>.users` 사용)

    반응 이벤트는 시스템 이벤트로 변환되어 라우팅된 Discord 세션에 첨부됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 inbound 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    확인 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 identity 이모지 폴백(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Discord는 유니코드 이모지 또는 커스텀 이모지 이름을 허용합니다.
    - 채널 또는 계정에서 반응을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="구성 쓰기">
    채널에서 시작된 구성 쓰기는 기본적으로 활성화되어 있습니다.

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

  <Accordion title="Gateway 프록시">
    `channels.discord.proxy`를 사용해 Discord Gateway WebSocket 트래픽과 시작 시 REST 조회(application ID + allowlist 해석)를 HTTP(S) 프록시를 통해 라우팅합니다.

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
    프록시된 메시지를 시스템 멤버 identity에 매핑할 수 있도록 PluralKit 해석을 활성화합니다.

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
    - 멤버 표시 이름은 `channels.discord.dangerouslyAllowNameMatching: true`일 때만 이름/slug로 매칭됩니다
    - 조회는 원본 메시지 ID를 사용하며 시간 창 제약을 받습니다
    - 조회에 실패하면 프록시된 메시지는 봇 메시지로 처리되어 `allowBots=true`가 아닌 한 버려집니다

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
      activity: "집중 시간",
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
      activity: "라이브 코딩",
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
        exhaustedText: "토큰 소진",
      },
    },
  },
}
```

    자동 상태는 런타임 가용성을 Discord 상태에 매핑합니다: healthy => online, degraded 또는 unknown => idle, exhausted 또는 unavailable => dnd. 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` 플레이스홀더 지원)

  </Accordion>

  <Accordion title="Discord에서 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 원래 채널에 승인 프롬프트를 게시할 수도 있습니다.

    구성 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (선택 사항, 가능하면 `commands.ownerAllowFrom`으로 폴백)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord는 `enabled`가 설정되지 않았거나 `"auto"`이고, `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 최소 한 명의 approver를 해석할 수 있을 때 기본 exec 승인을 자동 활성화합니다. Discord는 채널 `allowFrom`, 레거시 `dm.allowFrom`, 또는 direct-message `defaultTo`에서 exec approver를 추론하지 않습니다. Discord를 기본 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.

    `target`이 `channel` 또는 `both`이면 승인 프롬프트는 채널에 표시됩니다. 해석된 approver만 버튼을 사용할 수 있으며, 다른 사용자는 ephemeral 거부 응답을 받습니다. 승인 프롬프트에는 명령 텍스트가 포함되므로, 신뢰할 수 있는 채널에서만 채널 전달을 활성화하세요. 세션 키에서 채널 ID를 도출할 수 없으면 OpenClaw는 DM 전달로 폴백됩니다.

    Discord는 다른 채팅 채널에서 사용하는 공용 승인 버튼도 렌더링합니다. 기본 Discord 어댑터는 주로 approver DM 라우팅과 채널 팬아웃을 추가합니다.
    이러한 버튼이 존재할 때는 그것이 기본 승인 UX이며, OpenClaw는 tool 결과에서 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 표시되는 경우에만 수동 `/approve` 명령을 포함해야 합니다.

    Gateway 인증과 승인 해석은 공용 Gateway 클라이언트 계약을 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해 해석되고, 그 외 ID는 `exec.approval.resolve`를 통해 해석됨). 승인의 기본 만료 시간은 30분입니다.

    자세한 내용은 [Exec approvals](/ko/tools/exec-approvals)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 도구 및 작업 게이트

Discord 메시지 작업에는 메시징, 채널 관리, moderation, 상태, 메타데이터 작업이 포함됩니다.

핵심 예시:

- 메시징: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- 반응: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- 상태: `setPresence`

`event-create` 작업은 예약된 이벤트 커버 이미지를 설정하기 위한 선택적 `image` 매개변수(URL 또는 로컬 파일 경로)를 허용합니다.

작업 게이트는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| 작업 그룹                                                                                                                                                             | 기본값   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 활성화됨 |
| roles                                                                                                                                                                    | 비활성화 |
| moderation                                                                                                                                                               | 비활성화 |
| presence                                                                                                                                                                 | 비활성화 |

## Components v2 UI

OpenClaw는 exec 승인 및 교차 컨텍스트 마커에 Discord components v2를 사용합니다. Discord 메시지 작업은 커스텀 UI용 `components`도 받을 수 있습니다(고급 기능, discord tool을 통해 컴포넌트 payload를 구성해야 함). 기존 `embeds`도 계속 사용할 수 있지만 권장되지는 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord 컴포넌트 컨테이너에 사용되는 강조 색상(hex)을 설정합니다.
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

Discord에는 두 가지 음성 표면이 있습니다: 실시간 **voice channels**(연속 대화)와 **voice message attachments**(파형 미리보기 형식)입니다. Gateway는 둘 다 지원합니다.

### Voice channels

설정 체크리스트:

1. Discord Developer Portal에서 Message Content Intent를 활성화합니다.
2. 역할/사용자 allowlist를 사용할 경우 Server Members Intent를 활성화합니다.
3. `bot` 및 `applications.commands` 스코프로 봇을 초대합니다.
4. 대상 음성 채널에서 Connect, Speak, Send Messages, Read Message History 권한을 부여합니다.
5. 기본 명령어를 활성화합니다(`commands.native` 또는 `channels.discord.commands.native`).
6. `channels.discord.voice`를 구성합니다.

세션 제어에는 `/vc join|leave|status`를 사용하세요. 이 명령은 계정 기본 에이전트를 사용하며, 다른 Discord 명령과 동일한 allowlist 및 그룹 정책 규칙을 따릅니다.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

자동 참가 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

참고:

- `voice.tts`는 음성 재생에 대해서만 `messages.tts`를 재정의합니다.
- `voice.model`은 Discord 음성 채널 응답에 사용되는 LLM만 재정의합니다. 비워 두면 라우팅된 에이전트 모델을 상속합니다.
- STT는 `tools.media.audio`를 사용하며, `voice.model`은 전사에 영향을 주지 않습니다.
- 음성 transcript 턴은 Discord `allowFrom`(또는 `dm.allowFrom`)에서 owner 상태를 파생합니다. owner가 아닌 발화자는 owner 전용 도구(예: `gateway`, `cron`)에 접근할 수 없습니다.
- 음성은 기본적으로 활성화되어 있습니다. 비활성화하려면 `channels.discord.voice.enabled=false`를 설정하세요.
- `voice.daveEncryption`과 `voice.decryptionFailureTolerance`는 `@discordjs/voice` 참가 옵션으로 그대로 전달됩니다.
- 설정되지 않은 경우 `@discordjs/voice`의 기본값은 `daveEncryption=true`, `decryptionFailureTolerance=24`입니다.
- OpenClaw는 수신 복호화 실패도 감시하며, 짧은 시간 내에 반복 실패가 발생하면 음성 채널에서 나갔다가 다시 참가해 자동 복구합니다.
- 업데이트 후 수신 로그에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복해서 나타나면 dependency 보고서와 로그를 수집하세요. 번들된 `@discordjs/voice` 라인에는 discord.js PR #11449의 업스트림 패딩 수정이 포함되어 있으며, 이 수정은 discord.js 이슈 #11419를 해결했습니다.

음성 채널 파이프라인:

- Discord PCM 캡처는 WAV 임시 파일로 변환됩니다.
- `tools.media.audio`가 STT를 처리합니다. 예: `openai/gpt-4o-mini-transcribe`
- transcript는 일반적인 Discord ingress 및 라우팅을 통해 전송됩니다.
- `voice.model`이 설정된 경우, 이 음성 채널 턴의 응답 LLM에만 적용됩니다.
- `voice.tts`는 `messages.tts` 위에 병합되며, 결과 오디오는 참가한 채널에서 재생됩니다.

자격 증명은 구성 요소별로 해석됩니다: `voice.model`용 LLM 라우트 인증, `tools.media.audio`용 STT 인증, `messages.tts`/`voice.tts`용 TTS 인증.

### 음성 메시지

Discord 음성 메시지는 파형 미리보기를 표시하며 OGG/Opus 오디오가 필요합니다. OpenClaw는 파형을 자동으로 생성하지만, 검사 및 변환을 위해 Gateway 호스트에 `ffmpeg`와 `ffprobe`가 필요합니다.

- **로컬 파일 경로**를 제공하세요(URL은 거부됨).
- 텍스트 콘텐츠는 생략하세요(Discord는 같은 payload에서 텍스트 + 음성 메시지를 거부함).
- 어떤 오디오 형식이든 허용되며, 필요하면 OpenClaw가 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="허용되지 않은 intents를 사용했거나 봇이 guild 메시지를 보지 못함">

    - Message Content Intent를 활성화하세요
    - 사용자/멤버 해석에 의존하는 경우 Server Members Intent를 활성화하세요
    - intents를 변경한 후 Gateway를 재시작하세요

  </Accordion>

  <Accordion title="Guild 메시지가 예상치 못하게 차단됨">

    - `groupPolicy`를 확인하세요
    - `channels.discord.guilds` 아래의 guild allowlist를 확인하세요
    - guild의 `channels` 맵이 존재하면, 목록에 있는 채널만 허용됩니다
    - `requireMention` 동작과 mention 패턴을 확인하세요

    유용한 확인 명령:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention이 false인데도 여전히 차단됨">
    일반적인 원인:

    - 일치하는 guild/channel allowlist 없이 `groupPolicy="allowlist"`를 사용함
    - `requireMention`이 잘못된 위치에 구성됨(`channels.discord.guilds` 또는 채널 항목 아래여야 함)
    - 발신자가 guild/channel `users` allowlist에 의해 차단됨

  </Accordion>

  <Accordion title="오래 실행되는 핸들러가 시간 초과되거나 응답이 중복됨">

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
    - 기본값: `1800000` (30분), 비활성화하려면 `0`으로 설정

    권장 기준값:

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

    느린 리스너 설정에는 `eventQueue.listenerTimeout`을 사용하고, 큐에 들어간 에이전트 턴에 대해 별도의 안전 장치가 필요할 때만 `inboundWorker.runTimeoutMs`를 사용하세요.

  </Accordion>

  <Accordion title="권한 감사 불일치">
    `channels status --probe` 권한 검사는 숫자 채널 ID에서만 동작합니다.

    slug 키를 사용하면 런타임 매칭은 여전히 동작할 수 있지만, probe는 권한을 완전히 검증할 수 없습니다.

  </Accordion>

  <Accordion title="DM 및 페어링 문제">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"` (레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인 대기 중

  </Accordion>

  <Accordion title="봇 간 루프">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`를 설정한 경우, 루프 동작을 피하려면 엄격한 mention 및 allowlist 규칙을 사용하세요.
    봇을 mention하는 봇 메시지만 허용하려면 `channels.discord.allowBots="mentions"`를 권장합니다.

  </Accordion>

  <Accordion title="DecryptionFailed(...)와 함께 음성 STT가 누락됨">

    - Discord 음성 수신 복구 로직이 포함되도록 OpenClaw를 최신 상태로 유지하세요(`openclaw update`)
    - `channels.discord.voice.daveEncryption=true`인지 확인하세요(기본값)
    - `channels.discord.voice.decryptionFailureTolerance=24`(업스트림 기본값)부터 시작하고 필요한 경우에만 조정하세요
    - 다음 로그를 확인하세요:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참가 후에도 실패가 계속되면 로그를 수집하고 업스트림 DAVE 수신 이력인 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 및 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)와 비교하세요

  </Accordion>
</AccordionGroup>

## 구성 참조

기본 참조: [Configuration reference - Discord](/ko/gateway/config-channels#discord).

<Accordion title="신호가 높은 Discord 필드">

- 시작/인증: `enabled`, `token`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령어: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 이벤트 큐: `eventQueue.listenerTimeout` (리스너 예산), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound 워커: `inboundWorker.runTimeoutMs`
- 답글/히스토리: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전달: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 스트리밍: `streaming` (레거시 별칭: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 미디어/재시도: `mediaMaxMb` (outbound Discord 업로드 상한, 기본값 `100MB`), `retry`
- 작업: `actions.*`
- 상태: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 안전 및 운영

- 봇 토큰은 비밀 정보로 취급하세요(관리형 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- 최소 권한 Discord 권한만 부여하세요.
- 명령어 배포/상태가 오래된 경우 Gateway를 재시작하고 `openclaw channels status --probe`로 다시 확인하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord 사용자를 Gateway와 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 채팅 및 allowlist 동작.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    inbound 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화.
  </Card>
  <Card title="멀티 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    guild와 채널을 에이전트에 매핑합니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    기본 명령 동작.
  </Card>
</CardGroup>
