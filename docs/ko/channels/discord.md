---
read_when:
    - Discord 채널 기능 작업하기
summary: Discord 봇 설정, 구성 키, 구성 요소, 음성 및 문제 해결
title: Discord
x-i18n:
    generated_at: "2026-07-12T00:33:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw은 공식 Discord Gateway를 통해 봇으로 Discord에 연결됩니다. DM과 길드 채널을 지원합니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작과 명령 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 절차입니다.
  </Card>
</CardGroup>

## 빠른 설정

봇이 포함된 Discord 애플리케이션을 만들고, 봇을 서버에 추가한 다음 OpenClaw과 페어링하세요. 가능하면 비공개 서버를 사용하세요. 필요한 경우 먼저 [서버를 만드세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)(**Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord 애플리케이션과 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)에서 **New Application**을 클릭하고 이름을 지정합니다(예: "OpenClaw").

    사이드바에서 **Bot**을 열고 **Username**을 에이전트 이름으로 설정합니다.

  </Step>

  <Step title="권한이 필요한 인텐트 활성화">
    **Bot** 페이지의 **Privileged Gateway Intents**에서 다음을 활성화합니다.

    - **Message Content Intent**(필수)
    - **Server Members Intent**(권장, 역할 허용 목록, 이름과 ID 간 일치 확인, 채널 대상 접근 그룹에 필요)
    - **Presence Intent**(선택 사항, 프레즌스 업데이트에만 사용)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지에서 **Reset Token**을 클릭하고 토큰을 복사합니다.

    <Note>
    이름과 달리 첫 번째 토큰을 생성하는 것이며, 아무것도 "재설정"되지 않습니다.
    </Note>

  </Step>

  <Step title="초대 URL을 생성하고 서버에 봇 추가">
    사이드바에서 **OAuth2**를 엽니다. **OAuth2 URL Generator**에서 다음 범위를 활성화합니다.

    - `bot`
    - `applications.commands`

    표시되는 **Bot Permissions** 섹션에서 최소한 다음을 활성화합니다.

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions(선택 사항)

    이는 일반 텍스트 채널에 필요한 기본 권한입니다. 포럼 또는 미디어 채널에서 스레드를 만들거나 이어가는 워크플로를 포함하여 봇이 스레드에 게시할 경우 **Send Messages in Threads**도 활성화합니다.

    생성된 URL을 복사하여 브라우저에서 열고 서버를 선택한 다음 **Continue**를 클릭합니다. 이제 서버에 봇이 표시됩니다.

  </Step>

  <Step title="Developer Mode를 활성화하고 ID 수집">
    ID를 복사할 수 있도록 Discord 앱에서 Developer Mode를 활성화합니다.

    1. **User Settings**(톱니바퀴 아이콘) → **Developer** → **Developer Mode** 활성화
       *(모바일: **App Settings** → **Advanced**)*
    2. **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Copy Server ID**
    3. **자신의 아바타**를 마우스 오른쪽 버튼으로 클릭 → **Copy User ID**

    서버 ID와 사용자 ID를 봇 토큰과 함께 보관하세요. 다음 단계에서 세 가지가 모두 필요합니다.

  </Step>

  <Step title="서버 멤버의 DM 허용">
    페어링이 작동하려면 Discord에서 봇이 사용자에게 DM을 보낼 수 있어야 합니다. **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Privacy Settings** → **Direct Messages**를 활성화합니다.

    OpenClaw과 함께 Discord DM을 사용한다면 이 설정을 계속 활성화하세요. 길드 채널만 사용한다면 페어링 후 비활성화해도 됩니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정하기(채팅으로 보내지 마세요)">
    봇 토큰은 비밀 정보입니다. 에이전트에게 메시지를 보내기 전에 OpenClaw을 실행하는 컴퓨터에서 토큰을 설정합니다.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    OpenClaw이 이미 백그라운드 서비스로 실행 중이라면 OpenClaw Mac 앱을 사용하거나 `openclaw gateway run` 프로세스를 중지한 후 다시 시작하여 재시작합니다.
    관리형 서비스로 설치한 경우 `DISCORD_BOT_TOKEN`이 설정된 셸에서 `openclaw gateway install`을 실행하거나, 재시작 후 서비스가 환경 변수 SecretRef를 확인할 수 있도록 변수를 `~/.openclaw/.env`에 저장합니다.
    호스트가 Discord의 시작 시 애플리케이션 조회에 의해 차단되거나 속도 제한을 받는 경우, 시작 과정에서 해당 REST 호출을 건너뛸 수 있도록 Developer Portal의 애플리케이션/클라이언트 ID를 설정하세요. 기본 계정에는 `channels.discord.applicationId`를, 봇별로는 `channels.discord.accounts.<accountId>.applicationId`를 사용합니다.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 채팅하며 다음과 같이 요청합니다. Discord가 첫 번째 채널이라면 대신 CLI/구성 탭을 사용하세요.

        > "구성에 Discord 봇 토큰을 이미 설정했습니다. 사용자 ID `<user_id>`와 서버 ID `<server_id>`를 사용하여 Discord 설정을 완료해 주세요."
      </Tab>
      <Tab title="CLI / 구성">
        파일 기반 구성:

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

        기본 계정의 환경 변수 대체 값:

```bash
DISCORD_BOT_TOKEN=...
```

        스크립트 또는 원격 설정에서는 동일한 JSON5 블록을 작성하고 `openclaw config patch --file ./discord.patch.json5 --dry-run`을 실행한 다음, `--dry-run` 없이 다시 실행합니다. 일반 텍스트 `token` 문자열도 사용할 수 있으며, env/file/exec 공급자의 SecretRef 값을 `channels.discord.token`에 사용할 수 있습니다. [비밀 정보 관리](/ko/gateway/secrets)를 참조하세요.

        Discord 봇을 여러 개 사용하는 경우 각 봇 토큰과 애플리케이션 ID를 해당 계정 아래에 보관합니다. 최상위 `channels.discord.applicationId`는 계정에 상속되므로 모든 계정이 동일한 애플리케이션 ID를 사용할 때만 해당 위치에 설정하세요.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="첫 번째 DM 페어링 승인">
    Gateway가 실행되면 Discord에서 봇에게 DM을 보내세요. 봇이 페어링 코드로 응답합니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널에서 에이전트에게 페어링 코드를 보냅니다.

        > "이 Discord 페어링 코드를 승인해 주세요: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    페어링 코드는 1시간 후 만료됩니다. 승인 후 Discord DM에서 에이전트와 채팅하세요.

  </Step>
</Steps>

<Note>
토큰 확인은 계정을 인식하여 처리됩니다. 구성의 토큰 값이 환경 변수 대체 값보다 우선하며, `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
활성화된 두 Discord 계정이 동일한 봇 토큰으로 확인되면 OpenClaw은 해당 토큰에 대해 하나의 Gateway 모니터만 시작합니다. 구성에서 가져온 토큰이 환경 변수 대체 값보다 우선합니다. 그 외에는 활성화된 첫 번째 계정이 우선하며 중복 계정은 `duplicate bot token` 사유와 함께 비활성화된 것으로 보고됩니다.
고급 아웃바운드 호출(메시지 도구/채널 작업)에서는 호출별로 명시한 `token`이 해당 호출에 사용됩니다. 이는 전송 및 읽기/조사 유형 작업(읽기/검색/가져오기/스레드/고정 메시지/권한)에 적용됩니다. 계정 정책과 재시도 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정의 설정을 사용합니다.
</Note>

## 권장: 길드 작업 공간 설정

DM이 작동하면 각 채널이 자체 컨텍스트를 가진 별도의 에이전트 세션을 갖는 완전한 작업 공간으로 서버를 전환할 수 있습니다. 사용자와 봇만 있는 비공개 서버에 권장합니다.

<Steps>
  <Step title="길드 허용 목록에 서버 추가">
    이렇게 하면 에이전트가 DM뿐 아니라 서버의 모든 채널에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord 서버 ID `<server_id>`를 길드 허용 목록에 추가해 주세요."
      </Tab>
      <Tab title="구성">

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

  <Step title="@멘션 없이 응답 허용">
    기본적으로 에이전트는 길드 채널에서 @멘션된 경우에만 응답합니다. 비공개 서버에서는 모든 메시지에 응답하도록 설정하는 것이 일반적입니다.

    길드 채널에서는 기본적으로 일반 응답이 자동 게시됩니다. 항상 활성화된 공유 대화방에서는 `messages.groupChat.visibleReplies: "message_tool"`을 사용하도록 선택하여 에이전트가 조용히 지켜보다가 채널 응답이 유용하다고 판단할 때만 게시하게 할 수 있습니다. 이는 GPT-5.6 Sol처럼 최신 세대이며 도구 사용 신뢰성이 높은 모델에서 가장 잘 작동합니다. 도구가 전송하지 않는 한 주변 대화방 이벤트는 조용히 유지됩니다. 전체 관찰 모드 구성은 [주변 대화방 이벤트](/ko/channels/ambient-room-events)를 참조하세요.

    Discord에 입력 중 표시가 나타나고 로그에 토큰 사용량이 표시되지만 메시지가 게시되지 않는다면 해당 턴이 주변 대화방 이벤트로 구성되었거나 메시지 도구를 통한 표시 응답을 사용하도록 설정되었는지 확인하세요.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "이 서버에서 @멘션하지 않아도 내 에이전트가 응답하도록 허용해 주세요."
      </Tab>
      <Tab title="구성">
        길드 구성에서 `requireMention: false`를 설정합니다.

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

        표시되는 그룹/채널 응답을 메시지 도구로 전송하도록 요구하려면 `messages.groupChat.visibleReplies: "message_tool"`을 설정합니다.

      </Tab>
    </Tabs>

  </Step>

  <Step title="길드 채널의 메모리 사용 계획">
    장기 메모리(MEMORY.md)는 DM 세션에서만 자동으로 로드되며, 길드 채널에서는 로드되지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 내가 질문할 때 MEMORY.md의 장기 컨텍스트가 필요하면 memory_search 또는 memory_get을 사용하세요."
      </Tab>
      <Tab title="수동">
        모든 채널에서 공유할 컨텍스트는 `AGENTS.md` 또는 `USER.md`에 안정적인 지침으로 작성하세요. 이 파일들은 모든 세션에 주입됩니다. 장기 메모는 `MEMORY.md`에 보관하고 필요할 때 메모리 도구로 접근하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 채널을 만들고 채팅을 시작하세요. 에이전트는 채널 이름을 볼 수 있으며 각 채널은 격리된 세션입니다. 워크플로에 맞게 `#coding`, `#home`, `#research` 등의 채널을 설정하세요.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 응답 라우팅은 결정적입니다. Discord에서 수신한 메시지에 대한 응답은 Discord로 돌아갑니다.
- Discord 길드/채널 메타데이터는 사용자에게 표시되는 응답 접두사가 아니라 신뢰할 수 없는 컨텍스트로 모델 프롬프트에 추가됩니다. 모델이 해당 봉투를 다시 복사하면 OpenClaw은 아웃바운드 응답과 이후 재생 컨텍스트에서 복사된 메타데이터를 제거합니다.
- 기본적으로(`session.dmScope=main`) 직접 채팅은 에이전트의 기본 세션(`agent:main:main`)을 공유합니다.
- 길드 채널은 격리된 세션 키(`agent:<agentId>:discord:channel:<channelId>`)를 사용합니다.
- 그룹 DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 네이티브 슬래시 명령은 격리된 명령 세션(`agent:<agentId>:discord:slash:<userId>`)에서 실행되지만, 라우팅된 대화 세션으로 연결되는 `CommandTargetSessionKey`도 함께 전달합니다.
- Discord로 전달되는 텍스트 전용 Cron/Heartbeat 알림은 어시스턴트에게 최종적으로 표시되는 응답 하나로 축약되어 한 번만 전송됩니다. 에이전트가 전달 가능한 페이로드를 여러 개 생성하면 미디어 및 구조화된 구성 요소 페이로드는 여러 메시지로 유지됩니다.

## 포럼 채널

Discord 포럼 및 미디어 채널에서는 스레드 게시물만 허용됩니다. OpenClaw은 이를 생성하는 두 가지 방법을 지원합니다.

- 포럼 상위 채널(`channel:<forumId>`)에 메시지를 보내 스레드를 자동으로 생성합니다. 스레드 제목은 메시지에서 비어 있지 않은 첫 번째 줄이며, Discord의 스레드 이름 제한인 100자로 잘립니다.
- 스레드를 직접 생성하려면 `openclaw message thread create`를 사용합니다. 포럼 채널에는 `--message-id`를 전달하지 마세요.

스레드를 생성하려면 포럼 상위 채널로 전송합니다.

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

포럼 스레드를 명시적으로 생성합니다.

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

포럼 상위 채널은 Discord 컴포넌트를 허용하지 않습니다. 컴포넌트가 필요하면 스레드 자체(`channel:<threadId>`)로 전송하세요.

## 대화형 컴포넌트

OpenClaw는 에이전트 메시지에 Discord 컴포넌트 v2 컨테이너를 지원합니다. `components` 페이로드와 함께 메시지 도구를 사용하세요. 상호작용 결과는 일반 수신 메시지로 에이전트에 다시 라우팅되며 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 작업 행에는 최대 5개의 버튼 또는 단일 선택 메뉴를 넣을 수 있습니다
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 컴포넌트는 한 번만 사용할 수 있습니다. 버튼, 선택 메뉴 및 양식을 만료될 때까지 여러 번 사용할 수 있도록 하려면 `components.reusable=true`를 설정하세요.

버튼을 클릭할 수 있는 사용자를 제한하려면 해당 버튼에 `allowedUsers`를 설정하세요(Discord 사용자 ID, 태그 또는 `*`). 일치하지 않는 사용자에게는 임시 거부 메시지가 표시됩니다.

컴포넌트 콜백은 기본적으로 30분 후 만료됩니다. 기본 계정의 콜백 레지스트리 수명을 변경하려면 `channels.discord.agentComponents.ttlMs`를 설정하고, 계정별로 변경하려면 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`를 설정하세요. 값은 밀리초 단위의 양의 정수여야 하며 최대 `86400000`(24시간)으로 제한됩니다. 더 긴 TTL은 버튼을 계속 사용할 수 있어야 하는 검토/승인 워크플로에 적합하지만, 오래된 Discord 메시지가 여전히 작업을 실행할 수 있는 기간도 늘어납니다. 요구 사항을 충족하는 가장 짧은 TTL을 사용하고, 오래된 콜백이 예기치 않은 결과를 초래할 수 있다면 기본값을 유지하세요.

`/model` 및 `/models` 슬래시 명령은 제공자, 모델, 호환 런타임 드롭다운과 제출 단계가 포함된 대화형 모델 선택기를 엽니다. `/models add`는 더 이상 사용되지 않으며 채팅에서 모델을 등록하는 대신 사용 중단 메시지를 반환합니다. 선택기 응답은 임시로 표시되며 호출한 사용자만 사용할 수 있습니다. Discord 선택 메뉴는 25개 옵션으로 제한되므로, 선택기에서 `openai` 또는 `vllm` 같은 특정 제공자에 대해 동적으로 검색된 모델만 표시하려면 `agents.defaults.models`에 `provider/*` 항목을 추가하세요.

파일 첨부:

- `file` 블록은 첨부 파일 참조(`attachment://<filename>`)를 가리켜야 합니다
- `media`/`path`/`filePath`를 통해 첨부 파일을 제공하세요(단일 파일). 여러 파일에는 `media-gallery`를 사용하세요
- 업로드 이름이 첨부 파일 참조와 일치해야 하는 경우 `filename`을 사용하여 이름을 재정의하세요

모달 양식:

- 최대 5개 필드가 포함된 `components.modal`을 추가하세요
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

## 접근 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.discord.dmPolicy`는 DM 접근을 제어합니다. `channels.discord.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`(`allowFrom` 발신자가 하나 이상 필요)
    - `open`(`channels.discord.allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    DM 정책이 공개 상태가 아니면 알 수 없는 사용자는 차단됩니다(`pairing` 모드에서는 페어링 안내가 표시됨).

    다중 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 한 계정에서는 `allowFrom`이 기존 `dm.allowFrom`보다 우선합니다.
    - 명명된 계정은 자체 `allowFrom`과 기존 `dm.allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 명명된 계정은 `channels.discord.accounts.default.allowFrom`을 상속하지 않습니다.

    호환성을 위해 기존 `channels.discord.dm.policy` 및 `channels.discord.dm.allowFrom`도 계속 읽습니다. 접근 권한을 변경하지 않고 마이그레이션할 수 있는 경우 `openclaw doctor --fix`가 이를 `dmPolicy` 및 `allowFrom`으로 마이그레이션합니다.

    전달을 위한 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    채널 기본값이 활성화된 경우 숫자로만 구성된 ID는 일반적으로 채널 ID로 해석되지만, 계정의 유효 DM `allowFrom`에 나열된 ID는 호환성을 위해 사용자 DM 대상으로 처리됩니다.

  </Tab>

  <Tab title="접근 그룹">
    Discord DM 및 텍스트 명령 권한 부여에는 `channels.discord.allowFrom`의 동적 `accessGroup:<name>` 항목을 사용할 수 있습니다.

    접근 그룹 이름은 메시지 채널 간에 공유됩니다. 구성원이 각 채널의 일반적인 `allowFrom` 구문으로 표현되는 정적 그룹에는 `type: "message.senders"`를 사용하고, Discord 채널의 현재 `ViewChannel` 대상이 구성원을 동적으로 정의해야 하는 경우에는 `type: "discord.channelAudience"`를 사용하세요. 공유 접근 그룹 동작: [접근 그룹](/ko/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord 텍스트 채널에는 별도의 구성원 목록이 없습니다. `type: "discord.channelAudience"`는 구성원 자격을 다음과 같이 모델링합니다. DM 발신자가 구성된 길드의 구성원이며 역할 및 채널 덮어쓰기가 적용된 후 현재 구성된 채널에 대한 유효한 `ViewChannel` 권한을 보유합니다.

    예시: `#maintainers`를 볼 수 있는 모든 사용자가 봇에 DM을 보낼 수 있도록 허용하면서 그 외 모든 사용자에게는 DM을 닫아 둡니다.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    동적 항목과 정적 항목을 함께 사용할 수 있습니다.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    조회 실패 시 접근이 차단됩니다. Discord가 `Missing Access`를 반환하거나, 구성원 조회에 실패하거나, 채널이 다른 길드에 속하면 DM 발신자는 권한이 없는 것으로 처리됩니다.

    채널 대상 접근 그룹을 사용할 때는 Discord Developer Portal에서 **Server Members Intent**를 활성화하세요. DM에는 길드 구성원 상태가 포함되지 않으므로 OpenClaw는 권한 부여 시점에 Discord REST를 통해 구성원을 확인합니다.

  </Tab>

  <Tab title="길드 정책">
    길드 처리는 `channels.discord.groupPolicy`로 제어됩니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 존재할 때의 안전한 기준값은 `allowlist`입니다.

    `allowlist` 동작:

    - 길드는 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, 슬러그도 허용)
    - 선택적 발신자 허용 목록: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만 허용). 둘 중 하나라도 구성된 경우 발신자가 `users` 또는 `roles`와 일치하면 허용됩니다
    - 직접 이름/태그 일치는 기본적으로 비활성화됩니다. 긴급 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하세요
    - `users`에서는 이름/태그가 지원되지만 ID가 더 안전합니다. 이름/태그 항목이 사용되면 `openclaw security audit`가 경고합니다
    - 길드에 `channels`가 구성되어 있으면 목록에 없는 채널은 거부됩니다
    - 길드에 `channels` 블록이 없으면 허용 목록에 포함된 해당 길드의 모든 채널이 허용됩니다

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    기존 채널별 `allow` 키는 `openclaw doctor --fix`에 의해 `enabled`로 마이그레이션됩니다.

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 생성하지 않으면, `channels.defaults.groupPolicy`가 `open`이더라도 런타임 대체값은 `groupPolicy="allowlist"`입니다(로그에 경고 표시).

  </Tab>

  <Tab title="멘션 및 그룹 DM">
    길드 메시지는 기본적으로 멘션이 있어야 처리됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적인 봇 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우 봇에 대한 암시적 답장 동작

    Discord 발신 메시지를 작성할 때는 표준 멘션 구문을 사용하세요. 사용자에는 `<@USER_ID>`, 채널에는 `<#CHANNEL_ID>`, 역할에는 `<@&ROLE_ID>`를 사용합니다. 기존 `<@!USER_ID>` 닉네임 멘션 형식은 사용하지 마세요.

    `requireMention`은 길드/채널별로 구성됩니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`는 선택적으로 다른 사용자/역할은 멘션하지만 봇은 멘션하지 않은 메시지를 제외합니다(@everyone/@here 제외).

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - `dm.groupChannels`를 통한 선택적 허용 목록(채널 ID 또는 슬러그)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

역할 ID에 따라 Discord 길드 구성원을 서로 다른 에이전트로 라우팅하려면 `bindings[].match.roles`를 사용하세요. 역할 기반 바인딩에는 역할 ID만 사용할 수 있으며, 피어 또는 상위 피어 바인딩 다음이자 길드 전용 바인딩 전에 평가됩니다. 바인딩에 다른 일치 필드(예: `peer` + `guildId` + `roles`)도 설정된 경우 구성된 모든 필드가 일치해야 합니다.

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

## 네이티브 명령 및 명령 권한 부여

- `commands.native`의 기본값은 `"auto"`이며 Discord에서 활성화됩니다.
- 채널별 재정의: `channels.discord.commands.native`.
- `commands.native=false`로 설정하면 시작 중 Discord 슬래시 명령 등록 및 정리를 건너뜁니다. 이전에 등록된 명령은 Discord 앱에서 제거할 때까지 Discord에 계속 표시될 수 있습니다.
- 네이티브 명령 인증은 일반 메시지 처리와 동일한 Discord 허용 목록/정책을 사용합니다.
- 권한이 없는 사용자에게도 Discord UI에 명령이 표시될 수 있지만, 실행 시 OpenClaw 인증이 적용되며 "권한이 없습니다"라고 응답합니다.
- 기본 슬래시 명령 설정: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

명령 카탈로그와 동작은 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

## 기능 세부 정보

<AccordionGroup>
  <Accordion title="답장 태그 및 네이티브 답장">
    Discord는 에이전트 출력의 답장 태그를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode`로 제어합니다.

    - `off`(기본값): 암시적 답장 스레딩 없음. 명시적인 `[[reply_to_*]]` 태그은 계속 적용됨
    - `first`: 해당 턴의 첫 번째 발신 Discord 메시지에 암시적 네이티브 답장 참조를 연결
    - `all`: 모든 발신 메시지에 연결
    - `batched`: 수신 이벤트가 디바운스된 여러 메시지의 배치일 때만 연결. 모든 단일 메시지 턴이 아니라 주로 모호하게 연속해서 발생하는 채팅에 네이티브 답장을 사용하려는 경우 유용함

    에이전트가 특정 메시지를 대상으로 지정할 수 있도록 메시지 ID가 컨텍스트/기록에 제공됩니다.

  </Accordion>

  <Accordion title="링크 미리 보기">
    Discord는 기본적으로 URL에 대한 리치 링크 임베드를 생성합니다. OpenClaw는 기본적으로 발신 Discord 메시지에서 이러한 생성된 임베드를 숨기므로, 명시적으로 활성화하지 않는 한 에이전트가 보낸 URL은 일반 링크로 유지됩니다.

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    단일 계정에서 재정의하려면 `channels.discord.accounts.<id>.suppressEmbeds`를 설정하세요. 에이전트 메시지 도구 전송에서도 단일 메시지에 `suppressEmbeds: false`를 전달할 수 있습니다. 명시적인 Discord `embeds` 페이로드는 기본 링크 미리 보기 설정에 의해 숨겨지지 않습니다.

  </Accordion>

  <Accordion title="실시간 스트림 미리 보기">
    OpenClaw는 임시 메시지를 전송한 다음 텍스트가 도착할 때마다 이를 편집하여 초안 답변을 스트리밍할 수 있습니다. `channels.discord.streaming.mode`는 `off` | `partial` | `block` | `progress` 값을 사용합니다(`streaming`/레거시 `streamMode` 키가 설정되지 않은 경우 기본값은 `progress`). `streamMode`는 레거시 별칭입니다. `openclaw doctor --fix`를 실행하여 저장된 구성을 표준 중첩 `streaming` 형태로 다시 작성하세요.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off`는 Discord 미리 보기 편집을 비활성화합니다.
    - `partial`은 토큰이 도착할 때마다 단일 미리 보기 메시지를 편집합니다.
    - `block`은 초안 크기의 청크를 내보냅니다. `streaming.preview.chunk`의 `minChars`, `maxChars`, `breakPreference`로 크기와 분할 지점을 조정할 수 있으며, 값은 `textChunkLimit`로 제한됩니다. 블록 스트리밍을 명시적으로 활성화하면 OpenClaw는 이중 스트리밍을 방지하기 위해 미리 보기 스트림을 건너뜁니다.
    - `progress`는 편집 가능한 상태 초안 하나를 유지하고 최종 전달 전까지 도구 진행 상황으로 업데이트합니다. 공유 시작 레이블은 계속 갱신되는 한 줄이므로, 작업 내용이 충분히 쌓이면 나머지 내용처럼 위로 스크롤되어 사라집니다.
    - 미디어, 오류 및 명시적 답장 최종 메시지는 대기 중인 미리 보기 편집을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 도구/진행 상황 업데이트가 미리 보기 메시지를 재사용할지 제어합니다.
    - 도구/진행 상황 행은 가능한 경우 간결한 이모지 + 제목 + 세부 정보 형태로 렌더링됩니다. 예: `🛠️ Bash: 테스트 실행` 또는 `🔎 Web Search: "query" 검색`.
    - `streaming.progress.commentary`(기본값 `false`)를 활성화하면 임시 진행 상황 초안에 어시스턴트 해설/도입 텍스트를 포함합니다. 해설은 표시 전에 정리되고 일시적으로만 유지되며 최종 답변 전달에는 영향을 주지 않습니다.
    - `streaming.progress.maxLineChars`는 줄별 진행 상황 미리 보기 길이 한도를 제어합니다. 일반 문장은 단어 경계에서 줄이며, 명령과 경로 세부 정보는 유용한 접미 부분을 유지합니다.
    - `streaming.preview.commandText` / `streaming.progress.commandText`는 간결한 진행 상황 줄의 명령/실행 세부 정보를 제어합니다. `raw`(기본값) 또는 `status`(도구 레이블만)입니다.

    간결한 진행 상황 줄은 유지하면서 원시 명령/실행 텍스트를 숨기려면 다음과 같이 설정하세요.

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    미리 보기 스트리밍은 텍스트만 지원하며, 미디어 답장은 일반 전달 방식으로 대체됩니다.

  </Accordion>

  <Accordion title="기록, 컨텍스트 및 스레드 동작">
    길드 기록 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - 대체값: `messages.groupChat.historyLimit`
    - `0`이면 비활성화

    DM 기록 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의하지 않는 한 상위 채널 구성을 상속합니다.
    - 스레드 세션은 상위 채널의 세션 수준 `/model` 선택을 모델 전용 대체값으로 상속합니다. 스레드 로컬 `/model` 선택이 우선하며, 대화 기록 상속을 활성화하지 않는 한 상위 대화 기록은 복사되지 않습니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)를 사용하면 새 자동 스레드가 상위 대화 기록을 기반으로 초기화됩니다. 계정별 재정의: `channels.discord.accounts.<id>.thread.inheritParent`.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 해석할 수 있습니다.
    - 답장 단계 활성화 대체 동작 중에도 `guilds.<guild>.channels.<channel>.requireMention: false`가 유지됩니다.

    채널 주제는 **신뢰할 수 없는** 컨텍스트로 주입됩니다. 허용 목록은 에이전트를 트리거할 수 있는 사용자를 제한하지만, 보충 컨텍스트 전체를 가리는 경계는 아닙니다.

  </Accordion>

  <Accordion title="하위 에이전트용 스레드 바인딩 세션">
    Discord는 스레드를 세션 대상에 바인딩하여 해당 스레드의 후속 메시지가 동일한 세션(하위 에이전트 세션 포함)으로 계속 라우팅되도록 할 수 있습니다.

    명령:

    - `/focus <target>` 현재/새 스레드를 하위 에이전트/세션 대상에 바인딩
    - `/unfocus` 현재 스레드 바인딩 제거
    - `/agents` 활성 실행 및 바인딩 상태 표시
    - `/session idle <duration|off>` 포커스된 바인딩의 비활성 자동 포커스 해제를 조회/업데이트
    - `/session max-age <duration|off>` 포커스된 바인딩의 최대 사용 기간을 조회/업데이트

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    참고:

    - `session.threadBindings.*`는 전역 기본값을 설정하고, `channels.discord.threadBindings.*`는 Discord 동작을 재정의합니다.
    - `spawnSessions`는 `sessions_spawn({ thread: true })` 및 ACP 스레드 생성 시 스레드 자동 생성/바인딩을 제어합니다. 기본값: `true`.
    - `defaultSpawnContext`는 스레드 바인딩 생성의 네이티브 하위 에이전트 컨텍스트를 제어합니다. 기본값: `"fork"`.
    - 더 이상 사용되지 않는 `spawnSubagentSessions`/`spawnAcpSessions` 키는 `openclaw doctor --fix`로 마이그레이션됩니다.
    - 계정에서 스레드 바인딩이 비활성화된 경우 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    [하위 에이전트](/ko/tools/subagents), [ACP 에이전트](/ko/tools/acp-agents), [구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

  </Accordion>

  <Accordion title="영구 ACP 채널 바인딩">
    안정적인 "상시 가동" ACP 작업 공간을 위해 Discord 대화를 대상으로 하는 최상위 수준의 형식화된 ACP 바인딩을 구성하세요.

    구성 경로: `type: "acp"` 및 `match.channel: "discord"`가 지정된 `bindings[]`.

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

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 그 위치에서 바인딩하고 이후 메시지를 동일한 ACP 세션에서 유지합니다. 스레드 메시지는 상위 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new`와 `/reset`은 동일한 ACP 세션을 그 위치에서 재설정합니다. 임시 스레드 바인딩이 활성 상태인 동안 대상 해석을 재정의할 수 있습니다.
    - `spawnSessions`는 `--thread auto|here`를 통한 하위 스레드 생성/바인딩을 제어합니다.

    바인딩 동작에 관한 자세한 내용은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

  </Accordion>

  <Accordion title="반응 알림">
    길드별 반응 알림 모드(`guilds.<id>.reactionNotifications`):

    - `off`
    - `own`(기본값)
    - `all`
    - `allowlist`(`guilds.<id>.users` 사용)

    반응 이벤트는 시스템 이벤트로 변환되어 라우팅된 Discord 세션에 연결됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 전송합니다.

    해석 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 대체값(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Discord는 유니코드 이모지 또는 사용자 지정 이모지 이름을 허용합니다.
    - 채널 또는 계정에서 반응을 비활성화하려면 `""`를 사용하세요.

    **범위(`messages.ackReactionScope`):**

    값: `"all"`(DM + 그룹, 주변 방 이벤트 포함), `"direct"`(DM만), `"group-all"`(주변 방 이벤트를 제외한 모든 그룹 메시지, DM 제외), `"group-mentions"`(봇이 멘션된 그룹, **DM 제외**, 기본값), `"off"` / `"none"`(비활성화).

    <Note>
    기본 범위인 `"group-mentions"`는 다이렉트 메시지 또는 주변 방 이벤트에서 확인 반응을 실행하지 않습니다. 수신 Discord DM 및 조용한 방 이벤트에서 확인 반응을 받으려면 `messages.ackReactionScope`를 `"all"`로 설정하세요.
    </Note>

  </Accordion>

  <Accordion title="구성 쓰기">
    채널에서 시작된 구성 쓰기는 기본적으로 활성화됩니다. 이는 명령 기능이 활성화된 경우 `/config set|unset` 흐름에 영향을 줍니다.

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
    `channels.discord.proxy`를 사용하여 Discord Gateway WebSocket 트래픽과 시작 시 REST 조회(애플리케이션 ID + 허용 목록 해석)를 HTTP(S) 프록시를 통해 라우팅합니다.
    Discord Gateway WebSocket 프록시는 명시적으로 설정해야 합니다. WebSocket 연결은 Gateway 프로세스의 주변 프록시 환경 변수를 상속하지 않습니다. `channels.discord.proxy`가 구성된 경우 시작 시 REST 조회에서 이 프록시를 사용합니다.

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
    프록시된 메시지를 시스템 구성원 ID에 매핑하도록 PluralKit 해석을 활성화합니다.

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 선택 사항; 비공개 시스템에 필요
      },
    },
  },
}
```

    참고:

    - 허용 목록에서 `pk:<memberId>`를 사용할 수 있습니다.
    - `channels.discord.dangerouslyAllowNameMatching: true`인 경우에만 멤버 표시 이름을 이름/슬러그로 일치시킵니다.
    - 조회 시 원본 메시지 ID로 PluralKit API를 쿼리합니다.
    - 조회에 실패하면 프록시된 메시지는 봇 메시지로 처리되어 삭제됩니다. 단, `allowBots`에서 허용하는 경우는 예외입니다.

  </Accordion>

  <Accordion title="발신 멘션 별칭">
    에이전트가 알려진 Discord 사용자를 발신 메시지에서 확정적으로 멘션해야 할 때 `mentionAliases`를 사용합니다. 키는 앞의 `@`를 제외한 핸들이고, 값은 Discord 사용자 ID입니다. 알 수 없는 핸들, `@everyone`, `@here`, Markdown 코드 범위 안의 멘션은 변경되지 않습니다.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="상태 표시 구성">
    상태 또는 활동 필드를 설정하거나 자동 상태 표시를 활성화하면 상태 표시 업데이트가 적용됩니다.

    상태만 설정:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    활동(`activity`를 설정하면 사용자 지정 상태가 기본 활동 유형입니다):

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

    스트리밍:

```json5
{
  channels: {
    discord: {
      activity: "실시간 코딩",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    활동 유형 매핑:

    - 0: 플레이 중
    - 1: 스트리밍 중(`activityUrl` 필요, `activityUrl`을 사용하려면 `activityType: 1`도 필요)
    - 2: 듣는 중
    - 3: 시청 중
    - 4: 사용자 지정(활동 텍스트를 상태 값으로 사용하며 이모지는 선택 사항)
    - 5: 경쟁 중

    자동 상태 표시(런타임 상태 신호):

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

    자동 상태 표시는 런타임 가용성을 Discord 상태에 매핑합니다. 정상 => 온라인, 성능 저하 또는 알 수 없음 => 자리 비움, 소진 또는 사용 불가 => 방해 금지입니다. 기본값은 `intervalMs` 30000, `minUpdateIntervalMs` 15000이며, `minUpdateIntervalMs`는 `intervalMs`보다 작거나 같아야 합니다. 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` 자리표시자 지원)

  </Accordion>

  <Accordion title="Discord에서의 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 승인을 요청한 원래 채널에 승인 요청을 게시할 수 있습니다.

    구성 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (선택 사항, 가능한 경우 `commands.ownerAllowFrom`으로 대체)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled`가 설정되지 않았거나 `"auto"`이고 `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 승인자 한 명 이상을 확인할 수 있으면 Discord가 네이티브 실행 승인을 자동으로 활성화합니다. Discord는 채널의 `allowFrom`, 레거시 `dm.allowFrom`, 직접 메시지의 `defaultTo`에서 실행 승인자를 추론하지 않습니다. Discord를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정합니다.

    `/diagnostics` 및 `/export-trajectory`처럼 민감한 소유자 전용 그룹 명령의 경우 OpenClaw는 승인 요청과 최종 결과를 비공개로 전송합니다. 명령을 실행한 소유자에게 Discord 소유자 경로가 있으면 먼저 Discord DM을 시도하고, 그렇지 않으면 Telegram 등 `commands.ownerAllowFrom`에서 처음으로 사용 가능한 소유자 경로를 사용합니다.

    `target`이 `channel` 또는 `both`이면 승인 요청이 채널에 표시됩니다. 확인된 승인자만 버튼을 사용할 수 있으며, 다른 사용자는 본인에게만 보이는 거부 메시지를 받습니다. 승인 요청에는 명령 텍스트가 포함되므로 신뢰할 수 있는 채널에서만 채널 전송을 활성화하십시오. 세션 키에서 채널 ID를 도출할 수 없으면 OpenClaw는 DM 전송으로 대체합니다.

    Discord는 다른 채팅 채널에서 사용하는 공통 승인 버튼을 렌더링합니다. 네이티브 Discord 어댑터는 주로 승인자의 DM 라우팅과 채널 팬아웃을 추가합니다. 이러한 버튼이 있으면 기본 승인 사용자 경험으로 사용됩니다. OpenClaw는 도구 결과가 채팅 승인을 사용할 수 없다고 나타내거나 수동 승인이 유일한 경로인 경우에만 수동 `/approve` 명령을 포함해야 합니다. Discord 네이티브 승인 런타임이 활성화되지 않은 경우 OpenClaw는 로컬의 확정적 `/approve <id> <decision>` 요청을 계속 표시합니다. 런타임은 활성화되어 있지만 어떤 대상에도 네이티브 카드를 전달할 수 없는 경우 OpenClaw는 대기 중인 승인에 포함된 정확한 `/approve` 명령과 함께 동일 채팅에 대체 안내를 전송합니다.

    Gateway 인증과 승인 처리는 공통 Gateway 클라이언트 계약을 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해 처리되고, 다른 ID는 `exec.approval.resolve`를 통해 처리됨). 승인은 기본적으로 30분 후 만료됩니다.

    [실행 승인](/ko/tools/exec-approvals)을 참조하십시오.

  </Accordion>
</AccordionGroup>

## 도구 및 작업 게이트

Discord 메시지 작업에는 메시징, 채널 관리, 조정, 상태 표시 및 메타데이터가 포함됩니다.

주요 예시:

- 메시징: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- 반응: `react`, `reactions`, `emojiList`
- 조정: `timeout`, `kick`, `ban`
- 상태 표시: `setPresence`

`event-create` 작업은 예약된 이벤트의 표지 이미지를 설정하기 위한 선택적 `image` 매개변수(URL 또는 로컬 파일 경로)를 허용합니다.

작업 게이트는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| 작업 그룹                                                                                                                                                             | 기본값  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 활성화  |
| roles                                                                                                                                                                    | 비활성화 |
| moderation                                                                                                                                                               | 비활성화 |
| presence                                                                                                                                                                 | 비활성화 |

## 컴포넌트 v2 UI

OpenClaw는 실행 승인 및 교차 컨텍스트 표시에 Discord 컴포넌트 v2를 사용합니다. Discord 메시지 작업은 사용자 지정 UI를 위한 `components`도 허용할 수 있으며(고급 기능, Discord 도구를 통해 컴포넌트 페이로드를 구성해야 함), 레거시 `embeds`도 계속 사용할 수 있지만 권장하지 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord 컴포넌트 컨테이너에 사용되는 강조 색상(16진수)을 설정합니다. 계정별 설정: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs`는 전송된 Discord 컴포넌트 콜백이 등록 상태로 유지되는 시간을 제어합니다(기본값 `1800000`, 최댓값 `86400000`). 계정별 설정: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- 컴포넌트 v2가 있으면 `embeds`는 무시됩니다.
- 일반 URL 미리 보기는 기본적으로 억제됩니다. 하나의 발신 링크를 펼쳐서 표시해야 하는 경우 메시지 작업에 `suppressEmbeds: false`를 설정합니다.

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

Discord에는 서로 다른 두 가지 음성 인터페이스가 있습니다. 실시간 **음성 채널**(연속 대화)과 **음성 메시지 첨부 파일**(파형 미리 보기 형식)입니다. Gateway는 두 가지 모두 지원합니다.

### 음성 채널

설정 점검 목록:

1. Discord Developer Portal에서 Message Content Intent를 활성화합니다.
2. 역할/사용자 허용 목록을 사용하는 경우 Server Members Intent를 활성화합니다.
3. `bot` 및 `applications.commands` 범위로 봇을 초대합니다.
4. 대상 음성 채널에서 Connect, Speak, Send Messages 및 Read Message History 권한을 부여합니다.
5. 네이티브 명령(`commands.native` 또는 `channels.discord.commands.native`)을 활성화합니다.
6. `channels.discord.voice`를 구성합니다.

세션을 제어하려면 `/vc join|leave|status`를 사용합니다. 이 명령은 계정의 기본 에이전트를 사용하며 다른 Discord 명령과 동일한 허용 목록 및 그룹 정책 규칙을 따릅니다.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

참여하기 전에 봇의 유효 권한을 확인하려면 다음을 실행합니다.

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

자동 참여 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

참고:

- Discord 음성은 텍스트 전용 구성에서 선택적으로 사용합니다. `/vc` 명령, 음성 런타임 및 `GuildVoiceStates` Gateway 인텐트를 활성화하려면 `channels.discord.voice.enabled=true`로 설정하거나 기존 `channels.discord.voice` 블록을 유지하세요. `channels.discord.intents.voiceStates`로 인텐트 구독을 명시적으로 재정의할 수 있습니다. 설정하지 않으면 실질적인 음성 활성화 상태를 따릅니다.
- `voice.mode`는 대화 경로를 제어합니다. 기본값은 `agent-proxy`입니다. 실시간 음성 프런트엔드가 발화 타이밍, 끼어들기 및 재생을 처리하고, `openclaw_agent_consult`를 통해 라우팅된 OpenClaw 에이전트에 실질적인 작업을 위임한 다음, 결과를 해당 화자가 입력한 Discord 프롬프트처럼 취급합니다. `stt-tts`는 기존의 일괄 STT 및 TTS 흐름을 유지합니다. `bidi`에서는 실시간 모델이 직접 대화하면서 OpenClaw 두뇌를 위한 `openclaw_agent_consult`를 노출합니다.
- `voice.agentSession`은 음성 발화를 수신할 OpenClaw 대화를 제어합니다. 음성 채널 자체 세션을 사용하려면 설정하지 마세요. `{ mode: "target", target: "channel:<text-channel-id>" }`로 설정하면 음성 채널이 `#maintainers` 같은 기존 Discord 텍스트 채널 세션의 마이크/스피커 확장 기능으로 동작합니다.
- `voice.model`은 Discord 음성 응답 및 실시간 자문에 사용할 OpenClaw 에이전트 두뇌를 재정의합니다. 라우팅된 에이전트 모델을 상속하려면 설정하지 마세요. 이 설정은 `voice.realtime.model`과 별개입니다.
- `voice.followUsers`를 사용하면 봇이 선택한 사용자를 따라 Discord 음성 채널에 입장하고, 이동하고, 퇴장할 수 있습니다. [음성에서 사용자 따라가기](#follow-users-in-voice)를 참조하세요.
- `agent-proxy`는 음성을 `discord-voice`를 통해 라우팅합니다. 이 방식은 화자 및 대상 세션에 대한 일반적인 소유자/도구 권한 부여를 유지하지만, Discord 음성이 재생을 담당하므로 에이전트의 `tts` 도구를 숨깁니다. 기본적으로 `agent-proxy`는 소유자인 화자의 자문에 소유자와 동등한 전체 도구 접근 권한을 부여하고(`voice.realtime.toolPolicy: "owner"`), 실질적인 답변을 하기 전에 OpenClaw 에이전트와 자문하는 것을 강하게 우선합니다(`voice.realtime.consultPolicy: "always"`). 이 기본 `always` 모드에서는 실시간 계층이 자문 답변 전에 군더더기 말을 자동으로 발화하지 않습니다. 음성을 캡처하고 전사한 다음 라우팅된 OpenClaw 답변을 발화합니다. Discord가 첫 번째 답변을 재생하는 동안 여러 강제 자문 답변이 완료되면, 이후의 정확 발화 답변은 문장 중간에 음성을 교체하지 않고 재생이 유휴 상태가 될 때까지 대기열에 추가됩니다.
- `stt-tts` 모드에서 STT는 `tools.media.audio`를 사용하며, `voice.model`은 전사에 영향을 주지 않습니다.
- 실시간 모드에서는 `voice.realtime.provider`, `voice.realtime.model`, `voice.realtime.speakerVoice`로 실시간 오디오 세션을 구성합니다. OpenAI Realtime 2.1과 Codex 두뇌를 함께 사용하려면 `voice.realtime.model: "gpt-realtime-2.1"` 및 `voice.model: "openai/gpt-5.6-sol"`을 사용하세요.
- 실시간 음성 모드는 빠른 직접 발화에서도 라우팅된 OpenClaw 에이전트와 동일한 정체성, 사용자 기반 정보 및 페르소나를 유지하도록 기본적으로 작은 `IDENTITY.md`, `USER.md`, `SOUL.md` 프로필 파일을 실시간 제공자 지침에 포함합니다. 이를 사용자 지정하려면 `voice.realtime.bootstrapContextFiles`를 일부 파일로 설정하고, 비활성화하려면 `[]`로 설정하세요. 해당 프로필 파일만 지원되며, `AGENTS.md`는 일반 에이전트 컨텍스트에 유지됩니다. 삽입된 프로필 컨텍스트는 작업 공간 작업, 최신 사실, 메모리 조회 또는 도구 기반 작업을 위한 `openclaw_agent_consult`를 대체하지 않습니다.
- OpenAI `agent-proxy` 실시간 모드에서는 전사가 호출 이름으로 시작하거나 끝날 때까지 Discord 실시간 음성을 무음으로 유지하려면 `voice.realtime.requireWakeName: true`를 설정하세요. 구성된 호출 이름은 한두 단어여야 합니다. `voice.realtime.wakeNames`를 설정하지 않으면 OpenClaw는 라우팅된 에이전트의 `name`과 `OpenClaw`를 사용하며, 없으면 에이전트 ID와 `OpenClaw`를 사용합니다. 호출 이름 게이팅은 실시간 제공자의 자동 응답을 비활성화하고, 허용된 발화를 OpenClaw 에이전트 자문 경로로 라우팅하며, 최종 전사가 도착하기 전에 부분 전사에서 선행 호출 이름이 인식되면 짧은 음성 확인 응답을 제공합니다.
- OpenAI 실시간 제공자는 출력 오디오 및 전사 이벤트에 대해 현재 Realtime 2 이벤트 이름과 기존 Codex 호환 별칭을 허용하므로, 호환 제공자 스냅샷이 달라져도 어시스턴트 오디오가 누락되지 않습니다.
- `voice.realtime.bargeIn`은 Discord 화자 시작 이벤트가 활성 실시간 재생을 중단할지 제어합니다. 설정하지 않으면 실시간 제공자의 입력 오디오 중단 설정을 따릅니다.
- `voice.realtime.minBargeInAudioEndMs`는 OpenAI 실시간 끼어들기가 오디오를 잘라내기 전까지 필요한 최소 어시스턴트 재생 시간을 제어합니다. 기본값: `250`. 에코가 적은 공간에서 즉시 중단하려면 `0`으로 설정하고, 스피커 에코가 심한 환경에서는 값을 높이세요.
- `voice.tts`는 `stt-tts` 음성 재생에 한해서만 `messages.tts`를 재정의합니다. 실시간 모드는 대신 `voice.realtime.speakerVoice`를 사용합니다. Discord 재생에서 OpenAI 음성을 사용하려면 `voice.tts.provider: "openai"`로 설정하고 `voice.tts.providers.openai.speakerVoice`에서 텍스트 음성 변환 음성을 선택하세요. 현재 OpenAI TTS 모델에서는 `cedar`가 남성적으로 들리는 좋은 선택입니다.
- 채널별 Discord `systemPrompt` 재정의는 해당 음성 채널의 음성 전사 발화에 적용됩니다.
- 음성 전사 발화는 소유자 제한 명령 및 채널 작업을 위해 Discord `allowFrom` 또는 `dm.allowFrom`에서 소유자 상태를 파생합니다. 에이전트 도구 표시 여부는 라우팅된 세션에 구성된 도구 정책을 따릅니다.
- 동일한 길드에 대한 항목이 `voice.autoJoin`에 여러 개 있으면 OpenClaw는 해당 길드에 마지막으로 구성된 채널에 입장합니다.
- `voice.allowedChannels`는 선택적 상주 허용 목록입니다. 권한이 있는 모든 Discord 음성 채널에 `/vc join`으로 입장하도록 허용하려면 설정하지 마세요. 설정하면 `/vc join`, 시작 시 자동 입장 및 봇 음성 상태 이동이 나열된 `{ guildId, channelId }` 항목으로 제한됩니다. 모든 Discord 음성 채널 입장을 거부하려면 빈 배열로 설정하세요. Discord가 봇을 허용 목록 외부로 이동시키면 OpenClaw는 해당 채널에서 퇴장하고, 구성된 자동 입장 대상이 있으면 그곳으로 다시 입장합니다.
- `voice.daveEncryption` 및 `voice.decryptionFailureTolerance`는 `@discordjs/voice` 입장 옵션으로 그대로 전달됩니다. 업스트림 기본값은 `daveEncryption=true` 및 `decryptionFailureTolerance=24`입니다.
- OpenClaw는 Discord 음성 수신 및 실시간 원시 PCM 재생에 번들로 제공되는 `libopus-wasm` 코덱을 사용합니다. 고정 버전의 libopus WebAssembly 빌드를 제공하며 네이티브 opus 애드온이 필요하지 않습니다.
- `voice.connectTimeoutMs`는 `/vc join` 및 자동 입장 시도에서 최초 `@discordjs/voice` Ready 대기 시간을 제어합니다. 기본값: `30000`.
- `voice.reconnectGraceMs`는 연결이 끊긴 음성 세션이 재연결을 시작할 때까지 OpenClaw가 세션을 제거하지 않고 기다리는 시간을 제어합니다. 기본값: `15000`.
- `stt-tts` 모드에서는 다른 사용자가 말하기 시작했다는 이유만으로 음성 재생이 중지되지 않습니다. 피드백 루프를 방지하기 위해 OpenClaw는 TTS 재생 중에 새 음성 캡처를 무시합니다. 다음 발화를 하려면 재생이 끝난 후 말하세요. 실시간 모드는 화자 시작을 끼어들기 신호로 실시간 제공자에 전달합니다.
- 실시간 모드에서는 스피커 소리가 열린 마이크로 유입되는 에코가 끼어들기로 인식되어 재생을 중단할 수 있습니다. 에코가 심한 Discord 공간에서는 입력 오디오에 따라 OpenAI가 자동으로 중단하지 않도록 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`를 설정하세요. Discord 화자 시작 이벤트로 활성 재생을 계속 중단하려면 `voice.realtime.bargeIn: true`를 추가하세요. OpenAI 실시간 브리지는 `voice.realtime.minBargeInAudioEndMs`보다 짧은 재생 잘라내기를 에코/소음일 가능성이 높은 것으로 보고 무시하며, Discord 재생을 지우는 대신 건너뛴 것으로 기록합니다.
- `voice.captureSilenceGraceMs`는 Discord가 화자의 발화 중지를 보고한 후 OpenClaw가 해당 오디오 세그먼트를 STT용으로 확정하기까지 기다리는 시간을 제어합니다. 기본값: `2000`. Discord가 일반적인 말 사이의 쉼을 끊어진 부분 전사로 분리한다면 값을 높이세요.
- ElevenLabs가 선택된 TTS 제공자인 경우 Discord 음성 재생은 스트리밍 TTS를 사용하며 제공자 응답 스트림에서 재생을 시작합니다. 스트리밍을 지원하지 않는 제공자는 합성된 임시 파일 경로로 대체됩니다.
- OpenClaw는 수신 복호화 실패를 감시하며, 짧은 시간 내에 실패가 반복되면 음성 채널에서 퇴장한 후 다시 입장하여 자동으로 복구합니다.
- 업데이트 후 수신 로그에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복해서 표시되면 종속성 보고서와 로그를 수집하세요. 번들로 제공되는 `@discordjs/voice` 계열에는 discord.js PR #11449의 업스트림 패딩 수정이 포함되어 있으며, 이 수정으로 discord.js 이슈 #11419가 종결되었습니다.
- OpenClaw가 캡처한 화자 세그먼트를 확정할 때 발생하는 `The operation was aborted` 수신 이벤트는 정상입니다. 이는 상세 진단 정보이지 경고가 아닙니다.
- 상세 Discord 음성 로그에는 허용된 각 화자 세그먼트에 대해 길이가 제한된 한 줄짜리 STT 전사 미리 보기가 포함됩니다. 따라서 무제한 전사 텍스트를 출력하지 않고도 디버깅 시 사용자 측과 에이전트 응답 측을 모두 확인할 수 있습니다.
- `agent-proxy` 모드에서 강제 자문 대체 경로는 `...`로 끝나는 텍스트나 "and" 같은 연결어로 끝나는 텍스트처럼 불완전할 가능성이 높은 전사 조각과 "be right back" 또는 "bye"처럼 명백히 조치할 수 없는 마무리 말을 건너뜁니다. 이 기능이 오래된 대기 답변을 방지하면 로그에 `forced agent consult skipped reason=...`이 표시됩니다.

### 음성에서 사용자 따라가기

시작 시 고정 채널에 입장하거나 `/vc join`을 기다리는 대신 Discord 음성 봇이 알려진 Discord 사용자 한 명 이상을 따라다니게 하려면 `voice.followUsers`를 사용하세요.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

동작:

- `followUsers`는 원시 Discord 사용자 ID와 `discord:<id>` 값을 허용합니다. OpenClaw는 음성 상태 이벤트와 일치시키기 전에 두 형식을 정규화합니다.
- `followUsers`가 구성된 경우 `followUsersEnabled`의 기본값은 `true`입니다. 저장된 목록은 유지하되 자동 음성 따라가기를 중지하려면 `false`로 설정하세요.
- 따라가는 사용자가 허용된 음성 채널에 입장하면 OpenClaw도 해당 채널에 입장합니다. 사용자가 이동하면 OpenClaw도 함께 이동합니다. 현재 따라가는 사용자의 연결이 끊기면 OpenClaw는 퇴장합니다.
- 동일한 길드에 따라가는 사용자가 여러 명 있고 현재 따라가는 사용자가 퇴장하면, OpenClaw는 길드에서 퇴장하기 전에 추적 중인 다른 사용자의 채널로 이동합니다. 따라가는 사용자 여러 명이 동시에 이동하면 가장 최근에 관찰된 음성 상태 이벤트가 우선합니다.
- `allowedChannels`는 계속 적용됩니다. 허용되지 않은 채널에 있는 따라가기 대상 사용자는 무시되며, 따라가기 소유 세션은 다른 따라가기 대상 사용자에게 이동하거나 퇴장합니다.
- OpenClaw는 시작 시와 제한된 주기마다 누락된 음성 상태 이벤트를 조정합니다. 조정은 구성된 길드를 표본 추출하고 실행당 REST 조회 횟수를 제한하므로, 매우 큰 `followUsers` 목록은 수렴하는 데 한 주기 이상 걸릴 수 있습니다.
- 사용자를 따라가는 동안 Discord 또는 관리자가 봇을 이동하면 OpenClaw는 음성 세션을 다시 구축하고, 목적지가 허용된 경우 따라가기 소유권을 유지합니다. 봇이 `allowedChannels` 외부로 이동되면 OpenClaw는 퇴장하고, 구성된 대상이 있으면 그곳으로 다시 입장합니다.
- DAVE 수신 복구는 복호화 실패가 반복된 후 동일한 채널에서 퇴장했다가 다시 입장할 수 있습니다. 따라가기 소유 세션은 이 복구 경로에서도 따라가기 소유권을 유지하므로, 이후 따라가는 사용자의 연결이 끊어지면 채널에서 계속 퇴장합니다.

입장 모드 선택:

- 사용자가 음성 채널에 있을 때 봇도 자동으로 음성 채널에 있어야 하는 개인 또는 운영자 설정에는 `followUsers`를 사용하세요.
- 추적 중인 사용자가 음성 채널에 없어도 항상 상주해야 하는 고정 공간 봇에는 `autoJoin`을 사용하세요.
- 일회성 입장이나 자동 음성 상주가 예상 밖일 수 있는 공간에는 `/vc join`을 사용하세요.

Discord 음성 코덱:

- 음성 수신 로그에는 `discord voice: opus decoder: libopus-wasm`가 표시됩니다.
- 실시간 재생은 패킷을 `@discordjs/voice`에 전달하기 전에 동일한 번들 `libopus-wasm` 패키지로 원시 48kHz 스테레오 PCM을 Opus로 인코딩합니다.
- 파일 및 제공자 스트림 재생은 ffmpeg를 사용하여 원시 48kHz 스테레오 PCM으로 트랜스코딩한 다음, Discord로 전송하는 Opus 패킷 스트림에 `libopus-wasm`을 사용합니다.

STT 및 TTS 파이프라인:

- Discord PCM 캡처는 임시 WAV 파일로 변환됩니다.
- `tools.media.audio`가 STT를 처리합니다(예: `openai/gpt-4o-mini-transcribe`).
- 트랜스크립트는 Discord 수신 및 라우팅을 통해 전송되며, 응답 LLM은 에이전트의 `tts` 도구를 숨기고 텍스트 반환을 요청하는 음성 출력 정책으로 실행됩니다. 최종 TTS 재생은 Discord 음성이 담당하기 때문입니다.
- `voice.model`을 설정하면 이 음성 채널 턴의 응답 LLM만 재정의합니다.
- `voice.tts`는 `messages.tts` 위에 병합됩니다. 스트리밍을 지원하는 제공자는 플레이어에 직접 공급하고, 그렇지 않으면 생성된 오디오 파일을 참여 중인 채널에서 재생합니다.

기본 에이전트 프록시 음성 채널 세션 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` 블록이 없으면 각 음성 채널에 자체적으로 라우팅된 OpenClaw 세션이 할당됩니다. 예를 들어 `/vc join channel:234567890123456789`는 해당 Discord 음성 채널의 세션과 대화합니다. 실시간 모델은 음성 프런트엔드일 뿐이며, 실질적인 요청은 구성된 OpenClaw 에이전트로 전달됩니다. 실시간 모델이 상담 도구를 호출하지 않고 최종 트랜스크립트를 생성하면 OpenClaw는 폴백으로 상담을 강제하므로, 기본 동작은 여전히 에이전트와 대화하는 것처럼 작동합니다.

레거시 STT 및 TTS 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

실시간 양방향 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

기존 Discord 채널 세션의 확장으로 사용하는 음성:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` 모드에서 봇은 구성된 음성 채널에 참여하지만, OpenClaw 에이전트 턴은 대상 채널의 일반적인 라우팅 세션과 에이전트를 사용합니다. 실시간 음성 세션은 반환된 결과를 음성 채널에서 다시 말합니다. 감독 에이전트는 도구 정책에 따라 일반 메시지 도구를 계속 사용할 수 있으며, 적절한 조치라면 별도의 Discord 메시지를 보내는 것도 포함됩니다.

위임된 OpenClaw 실행이 활성 상태인 동안 새 Discord 음성 트랜스크립트는 다른 에이전트 턴을 시작하기 전에 실시간 실행 제어로 처리됩니다. "상태", "그거 취소해", "더 작은 수정안을 사용해", "완료되면 테스트도 확인해" 같은 문구는 활성 세션에 대한 상태 확인, 취소, 방향 조정 또는 후속 입력으로 분류됩니다. 상태, 취소, 수락된 방향 조정 및 후속 결과는 음성 채널에서 음성으로 다시 전달되므로 호출자는 OpenClaw가 요청을 처리했는지 알 수 있습니다.

유용한 대상 형식:

- `target: "channel:123456789012345678"`은 Discord 텍스트 채널 세션을 통해 라우팅합니다.
- `target: "123456789012345678"`은 채널 대상으로 처리됩니다.
- `target: "dm:123456789012345678"` 또는 `target: "user:123456789012345678"`은 해당 다이렉트 메시지 세션을 통해 라우팅합니다.

에코가 심한 OpenAI Realtime 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

열린 마이크를 통해 모델이 자체 Discord 재생음을 듣지만 말로 끼어들어 중단할 수 있게 하려면 이 설정을 사용하세요. OpenClaw는 원시 입력 오디오로 인해 OpenAI가 자동으로 중단하지 않도록 하며, `bargeIn: true`를 설정하면 다음 캡처 턴이 OpenAI에 도달하기 전에 Discord 화자 시작 이벤트와 이미 활성화된 화자 오디오가 활성 실시간 응답을 취소할 수 있습니다. `audioEndMs`가 `minBargeInAudioEndMs`보다 작은 매우 이른 끼어들기 신호는 에코나 노이즈일 가능성이 높은 것으로 처리되어 무시되므로 모델이 첫 번째 재생 프레임에서 중단되지 않습니다.

예상 음성 로그:

- 참여 시: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 실시간 시작 시: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 화자 오디오 시: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, 그리고 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 오래되어 건너뛴 발화 시: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 또는 `reason=non-actionable-closing ...`
- 실시간 응답 완료 시: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 재생 중지/초기화 시: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 실시간 상담 시: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 에이전트 응답 시: `discord voice: agent turn answer ...`
- 정확한 발화가 대기열에 추가될 때: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, 이어서 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 끼어들기 감지 시: `discord voice: realtime barge-in detected source=speaker-start ...` 또는 `discord voice: realtime barge-in detected source=active-speaker-audio ...`, 이어서 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 실시간 중단 시: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, 이어서 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 또는 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 무시된 에코/노이즈 시: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 끼어들기가 비활성화된 경우: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 유휴 재생 시: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

오디오가 잘리는 문제를 디버깅하려면 실시간 음성 로그를 타임라인으로 읽으세요.

1. `realtime audio playback started`는 Discord가 어시스턴트 오디오 재생을 시작했음을 의미합니다. 이 시점부터 브리지는 어시스턴트 출력 청크, Discord PCM 바이트, 제공자 실시간 바이트 및 합성 오디오 길이를 계산하기 시작합니다.
2. `realtime speaker turn opened`는 Discord 화자가 활성화되었음을 나타냅니다. 재생이 이미 활성화되어 있고 `bargeIn`이 활성화된 경우 뒤이어 `barge-in detected source=speaker-start`가 나타날 수 있습니다.
3. `realtime input audio started`는 해당 화자 턴에서 수신된 첫 번째 실제 오디오 프레임을 나타냅니다. 여기서 `outputActive=true`이거나 `outputAudioMs`가 0이 아니면 어시스턴트 재생이 아직 활성화된 동안 마이크가 입력을 전송하고 있다는 의미입니다.
4. `barge-in detected source=active-speaker-audio`는 어시스턴트 재생이 활성화된 동안 OpenClaw가 실시간 화자 오디오를 감지했음을 의미합니다. 이는 실제 중단과 유효한 오디오가 없는 Discord 화자 시작 이벤트를 구분하는 데 유용합니다.
5. `barge-in requested reason=...`는 OpenClaw가 실시간 제공자에게 활성 응답의 취소 또는 잘라내기를 요청했음을 의미합니다. `outputAudioMs`, `outputActive`, `playbackChunks`가 포함되므로 중단 전에 실제로 재생된 어시스턴트 오디오의 양을 확인할 수 있습니다.
6. `realtime audio playback stopped reason=...`는 로컬 Discord 재생 초기화 지점입니다. 이유는 재생을 중지한 주체를 나타냅니다: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` 또는 `session-close`.
7. `realtime speaker turn closed`는 캡처된 입력 턴을 요약합니다. `chunks=0` 또는 `hasAudio=false`는 화자 턴이 열렸지만 사용 가능한 오디오가 실시간 브리지에 도달하지 않았음을 의미합니다. `interruptedPlayback=true`는 해당 입력 턴이 어시스턴트 출력과 겹쳐 끼어들기 로직을 트리거했음을 의미합니다.

유용한 필드:

- `outputAudioMs`: 해당 로그 줄 이전에 실시간 제공자가 생성한 어시스턴트 오디오 길이.
- `audioMs`: 재생이 중지되기 전에 OpenClaw가 계산한 어시스턴트 오디오 길이.
- `elapsedMs`: 재생 스트림 또는 화자 턴을 열고 닫는 사이의 실제 경과 시간.
- `discordBytes`: Discord 음성으로 전송되거나 수신된 48kHz 스테레오 PCM 바이트.
- `realtimeBytes`: 실시간 제공자에게 전송되거나 수신된 제공자 형식의 PCM 바이트.
- `playbackChunks`: 활성 응답을 위해 Discord로 전달된 어시스턴트 오디오 청크.
- `sinceLastAudioMs`: 마지막으로 캡처된 화자 오디오 프레임과 화자 턴 종료 사이의 간격.

일반적인 패턴:

- `source=active-speaker-audio`, 작은 `outputAudioMs`, 가까이에 동일 사용자가 있는 상태에서 즉시 잘리는 경우는 일반적으로 스피커 에코가 마이크로 들어간 상황을 나타냅니다. `voice.realtime.minBargeInAudioEndMs`를 높이거나, 스피커 볼륨을 낮추거나, 헤드폰을 사용하거나, `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`를 설정하세요.
- `source=speaker-start` 뒤에 `speaker turn closed ... hasAudio=false`가 나타나면 Discord가 화자 시작을 보고했지만 오디오가 OpenClaw에 도달하지 않았음을 의미합니다. 일시적인 Discord 음성 이벤트, 노이즈 게이트 동작 또는 클라이언트가 잠깐 마이크를 활성화한 상황일 수 있습니다.
- 근처에 끼어들기나 `provider-clear-audio` 없이 `audio playback stopped reason=stream-close`가 나타나면 로컬 Discord 재생 스트림이 예기치 않게 종료된 것입니다. 앞선 제공자 및 Discord 플레이어 로그를 확인하세요.
- `capture ignored during playback (barge-in disabled)`는 어시스턴트 오디오가 활성화된 동안 OpenClaw가 의도적으로 입력을 버렸음을 의미합니다. 발화로 재생을 중단하려면 `voice.realtime.bargeIn`을 활성화하세요.
- `barge-in ignored ... outputActive=false`는 Discord 또는 제공자 VAD가 발화를 보고했지만 OpenClaw에는 중단할 활성 재생이 없었음을 의미합니다. 이 경우 오디오가 잘려서는 안 됩니다.

자격 증명은 구성 요소별로 해석됩니다. `voice.model`에는 LLM 경로 인증, `tools.media.audio`에는 STT 인증, `messages.tts`/`voice.tts`에는 TTS 인증, `voice.realtime.providers` 또는 제공자의 일반 인증 구성에는 실시간 제공자 인증이 사용됩니다.

### 음성 메시지

Discord 음성 메시지는 파형 미리보기를 표시하며 OGG/Opus 오디오가 필요합니다. OpenClaw는 파형을 자동으로 생성하지만, 검사 및 변환을 위해 Gateway 호스트에 `ffmpeg`와 `ffprobe`가 필요합니다.

- **로컬 파일 경로**를 제공하세요(URL은 거부됩니다).
- 텍스트 콘텐츠를 생략하세요(Discord는 동일한 페이로드의 텍스트와 음성 메시지 조합을 거부합니다).
- 모든 오디오 형식이 허용됩니다. OpenClaw는 필요에 따라 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="허용되지 않는 인텐트를 사용했거나 봇에 길드 메시지가 표시되지 않음">

    - Message Content Intent를 활성화합니다
    - 사용자/멤버 확인에 의존하는 경우 Server Members Intent를 활성화합니다
    - 인텐트를 변경한 후 Gateway를 다시 시작합니다

  </Accordion>

  <Accordion title="길드 메시지가 예기치 않게 차단됨">

    - `groupPolicy`를 확인합니다
    - `channels.discord.guilds` 아래의 길드 허용 목록을 확인합니다
    - 길드에 `channels` 맵이 있으면 나열된 채널만 허용됩니다
    - `requireMention` 동작과 멘션 패턴을 확인합니다

    유용한 확인 명령:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="멘션 요구가 false인데도 차단됨">
    일반적인 원인:

    - 일치하는 길드/채널 허용 목록 없이 `groupPolicy="allowlist"`가 설정됨
    - `requireMention`이 잘못된 위치에 구성됨(`channels.discord.guilds` 또는 채널 항목 아래에 있어야 함)
    - 발신자가 길드/채널 `users` 허용 목록에 의해 차단됨

  </Accordion>

  <Accordion title="오래 실행되는 Discord 턴 또는 중복 응답">

    일반적인 로그:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 큐 조정 항목:

    - 단일 계정: `channels.discord.eventQueue.listenerTimeout`
    - 다중 계정: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 이 설정은 에이전트 턴의 수명이 아니라 Discord Gateway 리스너 작업만 제어합니다

    Discord는 큐에 대기 중인 에이전트 턴에 채널 소유의 타임아웃을 적용하지 않습니다. 메시지 리스너는 즉시 작업을 넘기며, 큐에 대기 중인 Discord 실행은 세션/도구/런타임 수명 주기가 완료되거나 작업을 중단할 때까지 세션별 순서를 유지합니다.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway 메타데이터 조회 타임아웃 경고">
    OpenClaw는 연결하기 전에 Discord `/gateway/bot` 메타데이터를 가져옵니다. 일시적인 실패가 발생하면 Discord의 기본 Gateway URL로 대체되며 로그 출력에는 속도 제한이 적용됩니다.

    메타데이터 타임아웃 조정 항목:

    - 단일 계정: `channels.discord.gatewayInfoTimeoutMs`
    - 다중 계정: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 구성이 설정되지 않았을 때의 환경 변수 대체값: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 기본값: `30000`(30초), 최댓값: `120000`

  </Accordion>

  <Accordion title="Gateway READY 타임아웃으로 인한 재시작">
    OpenClaw는 시작 중과 런타임 재연결 후에 Discord Gateway의 `READY` 이벤트를 기다립니다. 시작 시차를 적용하는 다중 계정 설정에는 기본값보다 긴 시작 `READY` 대기 시간이 필요할 수 있습니다.

    `READY` 타임아웃 조정 항목:

    - 시작 시 단일 계정: `channels.discord.gatewayReadyTimeoutMs`
    - 시작 시 다중 계정: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 시작 구성이 설정되지 않았을 때의 환경 변수 대체값: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 시작 기본값: `15000`(15초), 최댓값: `120000`
    - 런타임 단일 계정: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 런타임 다중 계정: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 런타임 구성이 설정되지 않았을 때의 환경 변수 대체값: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 런타임 기본값: `30000`(30초), 최댓값: `120000`

  </Accordion>

  <Accordion title="권한 감사 불일치">
    `channels status --probe` 권한 검사는 숫자 채널 ID에만 작동합니다.

    슬러그 키를 사용해도 런타임 일치는 작동할 수 있지만, 프로브가 권한을 완전히 검증할 수는 없습니다.

  </Accordion>

  <Accordion title="DM 및 페어링 문제">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"`(레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인을 기다리는 중

  </Accordion>

  <Accordion title="봇 간 루프">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`를 설정하는 경우 루프 동작을 방지하려면 엄격한 멘션 및 허용 목록 규칙을 사용하세요.
    봇을 멘션하는 봇 메시지만 수락하려면 `channels.discord.allowBots="mentions"`를 사용하는 것이 좋습니다.

    OpenClaw는 공유 [봇 루프 보호](/ko/channels/bot-loop-protection) 기능도 제공합니다. `allowBots`가 봇이 작성한 메시지를 디스패치에 도달하도록 허용할 때마다 Discord는 수신 이벤트를 `(계정, 채널, 봇 쌍)` 정보에 매핑하고, 일반 쌍 보호 기능은 해당 쌍이 구성된 이벤트 허용량을 초과하면 억제합니다. 이 보호 기능은 이전에는 Discord 속도 제한으로 중단해야 했던 제어 불능의 두 봇 간 루프를 방지합니다. 단일 봇 배포나 허용량 이내의 일회성 봇 응답에는 영향을 주지 않습니다.

    기본 설정(`allowBots`가 설정된 경우 활성화):

    - `maxEventsPerWindow: 20` -- 봇 쌍이 슬라이딩 윈도 내에서 메시지 20개를 교환할 수 있습니다
    - `windowSeconds: 60` -- 슬라이딩 윈도 길이
    - `cooldownSeconds: 60` -- 허용량이 초과되면 어느 방향이든 이후의 모든 봇 간 메시지가 1분 동안 삭제됩니다

    공유 기본값은 `channels.defaults.botLoopProtection` 아래에서 한 번 구성한 다음, 정상적인 워크플로에 더 큰 여유가 필요할 때 Discord 설정으로 재정의하세요. 우선순위는 다음과 같습니다.

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 내장 기본값

    Discord는 일반 `maxEventsPerWindow`, `windowSeconds`, `cooldownSeconds` 키를 사용합니다.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // 선택적 Discord 전체 재정의입니다. 계정 블록은 개별 필드를 재정의하고
      // 생략된 필드는 여기에서 상속합니다.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha는 다른 봇이 자신을 멘션할 때만 해당 봇의 메시지를 수신합니다.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo는 봇이 작성한 모든 Discord 메시지를 수신합니다.
          allowBots: true,
          mentionAliases: {
            // 구성된 사용자 ID를 사용하여 Bravo가 Alpha의 Discord 멘션을 작성할 수 있게 합니다.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // 해당 쌍을 억제하기 전에 분당 최대 5개의 메시지를 허용합니다.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="DecryptionFailed(...)와 함께 음성 STT가 누락됨">

    - Discord 음성 수신 복구 로직을 사용할 수 있도록 OpenClaw를 최신 상태로 유지합니다(`openclaw update`)
    - `channels.discord.voice.daveEncryption=true`(기본값)인지 확인합니다
    - `channels.discord.voice.decryptionFailureTolerance=24`(업스트림 기본값)에서 시작하고 필요한 경우에만 조정합니다
    - 로그에서 다음 항목을 확인합니다:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참여 후에도 실패가 계속되면 로그를 수집하고 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 및 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)의 업스트림 DAVE 수신 기록과 비교합니다

  </Accordion>
</AccordionGroup>

## 구성 참조

주요 참조: [구성 참조 - Discord](/ko/gateway/config-channels#discord).

<Accordion title="중요도가 높은 Discord 필드">

- 시작/인증: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령: `commands.native`, `commands.useAccessGroups`(전역), `configWrites`, `slashCommand.ephemeral`
- 이벤트 큐: `eventQueue.listenerTimeout`(리스너 허용 시간, 기본값 `120000`), `eventQueue.maxQueueSize`(기본값 `10000`), `eventQueue.maxConcurrency`(기본값 `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 응답/기록: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전송: `textChunkLimit`(기본값 `2000`), `maxLinesPerMessage`(기본값 `17`)
- 스트리밍: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*`(레거시 최상위 `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` 키는 `openclaw doctor --fix`에 의해 `streaming.*`으로 마이그레이션됨)
- 미디어/재시도: `mediaMaxMb`(Discord로 보내는 업로드 크기 제한, 기본값 `100`), `retry`
- 작업: `actions.*`
- 상태: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]`(`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## 안전 및 운영

- 봇 토큰을 비밀 정보로 취급합니다(관리형 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- Discord 권한은 최소 권한 원칙에 따라 부여합니다.
- 명령 배포/상태가 오래된 경우 Gateway를 다시 시작하고 `openclaw channels status --probe`로 다시 확인합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord 사용자를 Gateway와 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 채팅 및 허용 목록 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    수신 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 보안 강화입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    길드와 채널을 에이전트에 매핑합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작입니다.
  </Card>
</CardGroup>
