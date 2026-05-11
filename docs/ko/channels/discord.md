---
read_when:
    - Discord 채널 기능 작업하기
summary: Discord 봇 지원 상태, 기능 및 구성
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

공식 Discord gateway를 통해 DM 및 길드 채널에서 사용할 수 있습니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord DM은 기본적으로 페어링 모드를 사용합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작 및 명령 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 흐름입니다.
  </Card>
</CardGroup>

## 빠른 설정

봇이 포함된 새 애플리케이션을 만들고, 봇을 서버에 추가한 다음, OpenClaw와 페어링해야 합니다. 봇은 본인의 비공개 서버에 추가하는 것을 권장합니다. 아직 서버가 없다면 [먼저 서버를 만드세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)(**Create My Own > For me and my friends** 선택).

<Steps>
  <Step title="Discord 애플리케이션 및 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동해 **New Application**을 클릭합니다. 이름은 "OpenClaw"처럼 지정합니다.

    사이드바에서 **Bot**을 클릭합니다. **Username**을 OpenClaw 에이전트에 붙일 이름으로 설정합니다.

  </Step>

  <Step title="권한 있는 인텐트 활성화">
    여전히 **Bot** 페이지에서 아래로 스크롤해 **Privileged Gateway Intents**로 이동한 뒤 다음을 활성화합니다.

    - **Message Content Intent**(필수)
    - **Server Members Intent**(권장, 역할 허용 목록 및 이름-대-ID 매칭에 필요)
    - **Presence Intent**(선택, 상태 업데이트에만 필요)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지 위쪽으로 다시 스크롤해 **Reset Token**을 클릭합니다.

    <Note>
    이름과 달리 이 작업은 첫 번째 토큰을 생성합니다. 아무것도 "재설정"되지 않습니다.
    </Note>

    토큰을 복사해 어딘가에 저장합니다. 이것이 **Bot Token**이며 곧 필요합니다.

  </Step>

  <Step title="초대 URL 생성 및 서버에 봇 추가">
    사이드바에서 **OAuth2**를 클릭합니다. 봇을 서버에 추가하는 데 필요한 올바른 권한이 포함된 초대 URL을 생성합니다.

    아래로 스크롤해 **OAuth2 URL Generator**로 이동한 뒤 다음을 활성화합니다.

    - `bot`
    - `applications.commands`

    아래에 **Bot Permissions** 섹션이 나타납니다. 최소한 다음을 활성화합니다.

    **일반 권한**
      - 채널 보기
    **텍스트 권한**
      - 메시지 보내기
      - 메시지 기록 읽기
      - 링크 임베드
      - 파일 첨부
      - 반응 추가(선택)

    이는 일반 텍스트 채널의 기준 권한 세트입니다. 포럼 또는 미디어 채널 워크플로처럼 스레드를 만들거나 이어 가는 경우를 포함해 Discord 스레드에 게시할 계획이라면 **Send Messages in Threads**도 활성화하세요.
    하단에 생성된 URL을 복사해 브라우저에 붙여넣고, 서버를 선택한 다음 **Continue**를 클릭해 연결합니다. 이제 Discord 서버에서 봇이 보여야 합니다.

  </Step>

  <Step title="Developer Mode 활성화 및 ID 수집">
    Discord 앱으로 돌아가 내부 ID를 복사할 수 있도록 Developer Mode를 활성화해야 합니다.

    1. **User Settings**(아바타 옆 톱니바퀴 아이콘) → **Advanced**를 클릭한 뒤 **Developer Mode**를 켭니다.
    2. 사이드바에서 **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Copy Server ID**
    3. **본인 아바타**를 마우스 오른쪽 버튼으로 클릭 → **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장합니다. 다음 단계에서 세 가지 모두를 OpenClaw에 보냅니다.

  </Step>

  <Step title="서버 멤버의 DM 허용">
    페어링이 작동하려면 Discord에서 봇이 사용자에게 DM을 보낼 수 있어야 합니다. **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Privacy Settings** → **Direct Messages**를 켭니다.

    이렇게 하면 서버 멤버(봇 포함)가 사용자에게 DM을 보낼 수 있습니다. OpenClaw와 함께 Discord DM을 사용하려면 이 설정을 계속 활성화해 두세요. 길드 채널만 사용할 계획이라면 페어링 후 DM을 비활성화해도 됩니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정(채팅으로 보내지 마세요)">
    Discord 봇 토큰은 비밀번호와 같은 비밀 값입니다. 에이전트에 메시지를 보내기 전에 OpenClaw를 실행하는 머신에 설정하세요.

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

    OpenClaw가 이미 백그라운드 서비스로 실행 중이라면 OpenClaw Mac 앱을 통해 재시작하거나 `openclaw gateway run` 프로세스를 중지했다가 다시 시작하세요.
    관리형 서비스 설치의 경우 `DISCORD_BOT_TOKEN`이 있는 셸에서 `openclaw gateway install`을 실행하거나 변수를 `~/.openclaw/.env`에 저장해, 재시작 후 서비스가 env SecretRef를 해석할 수 있도록 하세요.
    호스트가 Discord의 시작 애플리케이션 조회에 의해 차단되거나 속도 제한을 받는 경우, 시작 시 해당 REST 호출을 건너뛸 수 있도록 Developer Portal에서 Discord 애플리케이션/클라이언트 ID를 설정하세요. 기본 계정에는 `channels.discord.applicationId`를 사용하고, 여러 Discord 봇을 실행할 때는 `channels.discord.accounts.<accountId>.applicationId`를 사용하세요.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 채팅하고 알려 주세요. Discord가 첫 번째 채널이라면 대신 CLI / 구성 탭을 사용하세요.

        > "Discord 봇 토큰은 이미 구성에 설정했습니다. User ID `<user_id>` 및 Server ID `<server_id>`로 Discord 설정을 완료해 주세요."
      </Tab>
      <Tab title="CLI / 구성">
        파일 기반 구성을 선호한다면 다음을 설정하세요.

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

        기본 계정의 env 폴백:

```bash
DISCORD_BOT_TOKEN=...
```

        스크립트 또는 원격 설정의 경우 동일한 JSON5 블록을 `openclaw config patch --file ./discord.patch.json5 --dry-run`으로 작성한 다음 `--dry-run` 없이 다시 실행하세요. 일반 텍스트 `token` 값이 지원됩니다. SecretRef 값도 env/file/exec 제공자 전반에서 `channels.discord.token`에 지원됩니다. [Secrets Management](/ko/gateway/secrets)를 참조하세요.

        여러 Discord 봇의 경우 각 봇 토큰과 애플리케이션 ID를 해당 계정 아래에 유지하세요. 최상위 `channels.discord.applicationId`는 계정에 상속되므로, 모든 계정이 같은 애플리케이션 ID를 사용해야 할 때만 거기에 설정하세요.

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

  <Step title="첫 DM 페어링 승인">
    gateway가 실행될 때까지 기다린 다음 Discord에서 봇에게 DM을 보내세요. 봇이 페어링 코드를 응답합니다.

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

    이제 Discord에서 DM으로 에이전트와 채팅할 수 있어야 합니다.

  </Step>
</Steps>

<Note>
토큰 해석은 계정을 인식합니다. 구성의 토큰 값이 env 폴백보다 우선합니다. `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
활성화된 두 Discord 계정이 같은 봇 토큰으로 해석되면 OpenClaw는 해당 토큰에 대해 하나의 gateway 모니터만 시작합니다. 구성에서 가져온 토큰은 기본 env 폴백보다 우선합니다. 그렇지 않으면 첫 번째 활성 계정이 우선하며 중복 계정은 비활성화된 것으로 보고됩니다.
고급 아웃바운드 호출(메시지 도구/채널 작업)의 경우 명시적인 호출별 `token`이 해당 호출에 사용됩니다. 이는 보내기 및 읽기/프로브 스타일 작업(예: 읽기/검색/가져오기/스레드/핀/권한)에 적용됩니다. 계정 정책/재시도 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정에서 가져옵니다.
</Note>

## 권장: 길드 워크스페이스 설정

DM이 작동하면 Discord 서버를 전체 워크스페이스로 설정해 각 채널이 자체 컨텍스트를 가진 별도의 에이전트 세션을 갖도록 할 수 있습니다. 본인과 봇만 있는 비공개 서버에 권장됩니다.

<Steps>
  <Step title="서버를 길드 허용 목록에 추가">
    이렇게 하면 에이전트가 DM뿐 아니라 서버의 모든 채널에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord Server ID `<server_id>`를 길드 허용 목록에 추가해 주세요."
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
    기본적으로 에이전트는 길드 채널에서 @멘션될 때만 응답합니다. 비공개 서버라면 모든 메시지에 응답하도록 설정하고 싶을 가능성이 높습니다.

    길드 채널에서 일반적인 어시스턴트 최종 답변은 기본적으로 비공개로 유지됩니다. 표시되는 Discord 출력은 `message` 도구로 명시적으로 보내야 하므로, 에이전트는 기본적으로 조용히 대기하다가 채널 답장이 유용하다고 판단할 때만 게시할 수 있습니다.

    즉, 선택한 모델이 도구를 안정적으로 호출해야 합니다. Discord에 입력 중 표시가 나타나고 로그에 토큰 사용량이 보이지만 게시된 메시지가 없다면 세션 로그에서 `didSendViaMessagingTool: false`가 있는 어시스턴트 텍스트를 확인하세요. 이는 모델이 `message(action=send)`를 호출하는 대신 비공개 최종 답변을 생성했다는 뜻입니다. 더 강력한 도구 호출 모델로 전환하거나, 아래 구성을 사용해 레거시 자동 최종 답변을 복원하세요.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 에이전트가 이 서버에서 @멘션 없이 응답할 수 있게 해 주세요."
      </Tab>
      <Tab title="구성">
        길드 구성에서 `requireMention: false`를 설정하세요.

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

        그룹/채널 룸에서 레거시 자동 최종 답변을 복원하려면 `messages.groupChat.visibleReplies: "automatic"`을 설정하세요.

      </Tab>
    </Tabs>

  </Step>

  <Step title="길드 채널의 메모리 계획">
    기본적으로 장기 메모리(MEMORY.md)는 DM 세션에서만 로드됩니다. 길드 채널은 MEMORY.md를 자동으로 로드하지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 질문할 때 MEMORY.md의 장기 컨텍스트가 필요하면 memory_search 또는 memory_get을 사용해 주세요."
      </Tab>
      <Tab title="수동">
        모든 채널에서 공유 컨텍스트가 필요하다면 안정적인 지침을 `AGENTS.md` 또는 `USER.md`에 넣으세요(모든 세션에 주입됩니다). 장기 메모는 `MEMORY.md`에 유지하고 필요할 때 메모리 도구로 접근하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord 서버에 채널을 몇 개 만들고 채팅을 시작하세요. 에이전트는 채널 이름을 볼 수 있으며, 각 채널에는 격리된 자체 세션이 제공됩니다. 따라서 `#coding`, `#home`, `#research` 또는 워크플로에 맞는 무엇이든 설정할 수 있습니다.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 응답 라우팅은 결정적입니다. Discord 인바운드 응답은 Discord로 다시 전달됩니다.
- Discord 길드/채널 메타데이터는 사용자에게 보이는 응답 접두사가 아니라 신뢰할 수 없는
  컨텍스트로 모델 프롬프트에 추가됩니다. 모델이 그 봉투를 다시 복사하면
  OpenClaw는 아웃바운드 응답과 향후 재생 컨텍스트에서 복사된 메타데이터를 제거합니다.
- 기본적으로 (`session.dmScope=main`) 직접 채팅은 에이전트 메인 세션(`agent:main:main`)을 공유합니다.
- 길드 채널은 격리된 세션 키입니다(`agent:<agentId>:discord:channel:<channelId>`).
- 그룹 DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 네이티브 슬래시 명령은 격리된 명령 세션에서 실행되며(`agent:<agentId>:discord:slash:<userId>`), 라우팅된 대화 세션으로 `CommandTargetSessionKey`를 계속 전달합니다.
- Discord로 전달되는 텍스트 전용 cron/heartbeat 공지는 최종
  어시스턴트 표시 답변을 한 번 사용합니다. 미디어 및 구조화된 컴포넌트 페이로드는
  에이전트가 전달 가능한 페이로드를 여러 개 내보낼 때 여러 메시지로 유지됩니다.

## 포럼 채널

Discord 포럼 및 미디어 채널은 스레드 게시물만 허용합니다. OpenClaw는 이를 생성하는 두 가지 방법을 지원합니다.

- 포럼 상위 대상(`channel:<forumId>`)으로 메시지를 보내 스레드를 자동 생성합니다. 스레드 제목은 메시지의 첫 번째 비어 있지 않은 줄을 사용합니다.
- `openclaw message thread create`를 사용해 스레드를 직접 생성합니다. 포럼 채널에는 `--message-id`를 전달하지 마세요.

예: 포럼 상위 대상으로 보내 스레드 생성

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

예: 포럼 스레드를 명시적으로 생성

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

포럼 상위 대상은 Discord 컴포넌트를 허용하지 않습니다. 컴포넌트가 필요하면 스레드 자체(`channel:<threadId>`)로 보내세요.

## 인터랙티브 컴포넌트

OpenClaw는 에이전트 메시지에 대해 Discord 컴포넌트 v2 컨테이너를 지원합니다. `components` 페이로드와 함께 메시지 도구를 사용하세요. 인터랙션 결과는 일반 인바운드 메시지로 에이전트에 다시 라우팅되며 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 액션 행은 최대 5개의 버튼 또는 단일 선택 메뉴를 허용합니다.
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 컴포넌트는 한 번만 사용할 수 있습니다. 버튼, 선택 항목, 양식을 만료될 때까지 여러 번 사용할 수 있게 하려면 `components.reusable=true`를 설정하세요.

버튼을 클릭할 수 있는 사람을 제한하려면 해당 버튼에 `allowedUsers`를 설정하세요(Discord 사용자 ID, 태그 또는 `*`). 구성된 경우 일치하지 않는 사용자는 임시 거부 메시지를 받습니다.

`/model` 및 `/models` 슬래시 명령은 provider, model, 호환 런타임 드롭다운과 제출 단계가 포함된 인터랙티브 모델 선택기를 엽니다. `/models add`는 더 이상 사용되지 않으며 이제 채팅에서 모델을 등록하는 대신 지원 중단 메시지를 반환합니다. 선택기 응답은 임시이며 호출한 사용자만 사용할 수 있습니다. Discord 선택 메뉴는 25개 옵션으로 제한되므로 선택기가 `openai-codex` 또는 `vllm` 같은 선택된 provider에 대해서만 동적으로 발견된 모델을 표시하게 하려면 `agents.defaults.models`에 `provider/*` 항목을 추가하세요.

파일 첨부:

- `file` 블록은 첨부 참조(`attachment://<filename>`)를 가리켜야 합니다.
- `media`/`path`/`filePath`(단일 파일)를 통해 첨부 파일을 제공하세요. 여러 파일에는 `media-gallery`를 사용하세요.
- 업로드 이름이 첨부 참조와 일치해야 할 때는 `filename`을 사용해 재정의하세요.

모달 양식:

- 최대 5개 필드와 함께 `components.modal`을 추가하세요.
- 필드 유형: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw가 트리거 버튼을 자동으로 추가합니다.

예:

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy`는 DM 접근을 제어합니다. `channels.discord.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`channels.discord.allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    DM 정책이 open이 아니면 알 수 없는 사용자는 차단됩니다(또는 `pairing` 모드에서 페어링을 요청받습니다).

    다중 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 계정이 하나인 경우 `allowFrom`이 레거시 `dm.allowFrom`보다 우선합니다.
    - 명명된 계정은 자체 `allowFrom`과 레거시 `dm.allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 명명된 계정은 `channels.discord.accounts.default.allowFrom`을 상속하지 않습니다.

    레거시 `channels.discord.dm.policy`와 `channels.discord.dm.allowFrom`은 호환성을 위해 계속 읽힙니다. `openclaw doctor --fix`는 접근 권한을 변경하지 않고 수행할 수 있을 때 이를 `dmPolicy`와 `allowFrom`으로 마이그레이션합니다.

    전달용 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    채널 기본값이 활성화되어 있으면 일반 숫자 ID는 보통 채널 ID로 해석되지만, 계정의 유효 DM `allowFrom`에 나열된 ID는 호환성을 위해 사용자 DM 대상으로 처리됩니다.

  </Tab>

  <Tab title="Access groups">
    Discord DM 및 텍스트 명령 권한 부여는 `channels.discord.allowFrom`의 동적 `accessGroup:<name>` 항목을 사용할 수 있습니다.

    액세스 그룹 이름은 메시지 채널 간에 공유됩니다. 멤버가 각 채널의 일반 `allowFrom` 구문으로 표현되는 정적 그룹에는 `type: "message.senders"`를 사용하고, Discord 채널의 현재 `ViewChannel` 대상자가 멤버십을 동적으로 정의해야 할 때는 `type: "discord.channelAudience"`를 사용하세요. 공유 액세스 그룹 동작은 여기 문서에 설명되어 있습니다. [액세스 그룹](/ko/channels/access-groups)

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

    Discord 텍스트 채널에는 별도의 멤버 목록이 없습니다. `type: "discord.channelAudience"`는 멤버십을 다음과 같이 모델링합니다. DM 발신자가 구성된 길드의 멤버이며, 역할 및 채널 덮어쓰기가 적용된 후 구성된 채널에 대해 현재 유효한 `ViewChannel` 권한을 가지고 있습니다.

    예: 다른 모든 사람에게는 DM을 닫아 두면서 `#maintainers`를 볼 수 있는 사람은 누구나 bot에 DM을 보낼 수 있게 허용합니다.

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

    동적 항목과 정적 항목을 섞어 사용할 수 있습니다.

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

    조회는 실패 시 닫힘으로 처리됩니다. Discord가 `Missing Access`를 반환하거나, 멤버 조회가 실패하거나, 채널이 다른 길드에 속한 경우 DM 발신자는 권한이 없는 것으로 처리됩니다.

    채널 대상자 액세스 그룹을 사용할 때 bot에 대해 Discord Developer Portal **Server Members Intent**를 활성화하세요. DM에는 길드 멤버 상태가 포함되지 않으므로 OpenClaw는 권한 부여 시점에 Discord REST를 통해 멤버를 확인합니다.

  </Tab>

  <Tab title="Guild policy">
    길드 처리는 `channels.discord.groupPolicy`로 제어됩니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 존재할 때의 보안 기준은 `allowlist`입니다.

    `allowlist` 동작:

    - 길드는 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, slug 허용).
    - 선택적 발신자 허용 목록: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만). 둘 중 하나가 구성된 경우 발신자가 `users` 또는 `roles`와 일치하면 허용됩니다.
    - 직접 이름/태그 일치는 기본적으로 비활성화됩니다. 긴급 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하세요.
    - `users`에는 이름/태그가 지원되지만 ID가 더 안전합니다. 이름/태그 항목이 사용되면 `openclaw security audit`가 경고합니다.
    - 길드에 `channels`가 구성되어 있으면 목록에 없는 채널은 거부됩니다.
    - 길드에 `channels` 블록이 없으면 해당 허용 목록 길드의 모든 채널이 허용됩니다.

    예:

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

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 만들지 않으면, `channels.defaults.groupPolicy`가 `open`이더라도 런타임 폴백은 `groupPolicy="allowlist"`입니다(로그에 경고 표시).

  </Tab>

  <Tab title="Mentions and group DMs">
    길드 메시지는 기본적으로 멘션으로 제한됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적 bot 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우 암시적 bot에 대한 답장 동작

    아웃바운드 Discord 메시지를 작성할 때 표준 멘션 구문을 사용하세요. 사용자는 `<@USER_ID>`, 채널은 `<#CHANNEL_ID>`, 역할은 `<@&ROLE_ID>`입니다. 레거시 `<@!USER_ID>` 별명 멘션 형식을 사용하지 마세요.

    `requireMention`은 길드/채널별로 구성됩니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`는 선택적으로 다른 사용자/역할을 멘션하지만 bot은 멘션하지 않는 메시지를 삭제합니다(@everyone/@here 제외).

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - `dm.groupChannels`를 통한 선택적 허용 목록(채널 ID 또는 slug)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

`bindings[].match.roles`를 사용해 Discord 길드 멤버를 역할 ID별로 다른 에이전트에 라우팅합니다. 역할 기반 바인딩은 역할 ID만 허용하며 피어 또는 상위 피어 바인딩 이후, 길드 전용 바인딩 이전에 평가됩니다. 바인딩이 다른 일치 필드도 설정한 경우(예: `peer` + `guildId` + `roles`), 구성된 모든 필드가 일치해야 합니다.

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

## 네이티브 명령 및 명령 인증

- `commands.native`는 기본값이 `"auto"`이며 Discord에서 활성화됩니다.
- 채널별 재정의: `channels.discord.commands.native`.
- `commands.native=false`는 시작 중 Discord 슬래시 명령 등록 및 정리를 건너뜁니다. 이전에 등록된 명령은 Discord 앱에서 제거할 때까지 Discord에 계속 표시될 수 있습니다.
- 네이티브 명령 인증은 일반 메시지 처리와 동일한 Discord 허용 목록/정책을 사용합니다.
- 권한이 없는 사용자에게도 명령이 Discord UI에 계속 표시될 수 있습니다. 실행 시에는 여전히 OpenClaw 인증을 적용하며 "not authorized"를 반환합니다.

명령 카탈로그와 동작은 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

기본 슬래시 명령 설정:

- `ephemeral: true`

## 기능 세부 정보

<AccordionGroup>
  <Accordion title="답장 태그 및 네이티브 답장">
    Discord는 에이전트 출력에서 답장 태그를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode`로 제어됩니다.

    - `off`(기본값)
    - `first`
    - `all`
    - `batched`

    참고: `off`는 암시적 답장 스레딩을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그는 여전히 적용됩니다.
    `first`는 항상 해당 턴의 첫 번째 발신 Discord 메시지에 암시적 네이티브 답장 참조를 연결합니다.
    `batched`는 수신 턴이 여러 메시지의 디바운스된 배치였을 때만 Discord의 암시적 네이티브 답장 참조를 연결합니다. 이는 모든 단일 메시지 턴이 아니라, 주로 모호한 짧은 시간 내 연속 채팅에 네이티브 답장을 사용하려는 경우에 유용합니다.

    에이전트가 특정 메시지를 대상으로 지정할 수 있도록 메시지 ID가 컨텍스트/기록에 노출됩니다.

  </Accordion>

  <Accordion title="라이브 스트림 미리보기">
    OpenClaw는 임시 메시지를 보내고 텍스트가 도착하는 대로 편집하여 초안 답장을 스트리밍할 수 있습니다. `channels.discord.streaming`은 `off` | `partial` | `block` | `progress`(기본값)를 받습니다. `progress`는 편집 가능한 상태 초안 하나를 유지하고 최종 전달 전까지 도구 진행 상황으로 업데이트합니다. 공유 시작 라벨은 롤링 라인이므로 충분한 작업 내용이 나타나면 나머지와 마찬가지로 위로 밀려 사라집니다. `streamMode`는 레거시 런타임 별칭입니다. 저장된 설정을 정식 키로 다시 쓰려면 `openclaw doctor --fix`를 실행하세요.

    Discord 미리보기 편집을 비활성화하려면 `channels.discord.streaming.mode`를 `off`로 설정하세요. Discord 블록 스트리밍이 명시적으로 활성화된 경우, OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial`은 토큰이 도착하는 대로 단일 미리보기 메시지를 편집합니다.
    - `block`은 초안 크기의 청크를 내보냅니다(`draftChunk`를 사용해 크기와 중단점을 조정할 수 있으며, `textChunkLimit`로 제한됨).
    - 미디어, 오류, 명시적 답장 최종 메시지는 대기 중인 미리보기 편집을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 도구/진행 상황 업데이트가 미리보기 메시지를 재사용할지 제어합니다.
    - 도구/진행 상황 행은 사용 가능한 경우 간결한 이모지 + 제목 + 세부 정보 형식으로 렌더링됩니다. 예: `🛠️ Bash: run tests` 또는 `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText`는 간결한 진행 상황 줄에서 명령/실행 세부 정보를 제어합니다. `raw`(기본값) 또는 `status`(도구 라벨만).

    간결한 진행 상황 줄은 유지하면서 원시 명령/실행 텍스트를 숨기려면:

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

    미리보기 스트리밍은 텍스트 전용입니다. 미디어 답장은 일반 전달 방식으로 대체됩니다. `block` 스트리밍이 명시적으로 활성화된 경우, OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

  </Accordion>

  <Accordion title="기록, 컨텍스트 및 스레드 동작">
    길드 기록 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - 대체값: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    DM 기록 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의되지 않는 한 상위 채널 설정을 상속합니다.
    - 스레드 세션은 상위 채널의 세션 수준 `/model` 선택을 모델 전용 대체값으로 상속합니다. 스레드 로컬 `/model` 선택이 여전히 우선하며, transcript 상속이 활성화되지 않는 한 상위 transcript 기록은 복사되지 않습니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)는 새 자동 스레드가 상위 transcript에서 시드되도록 옵트인합니다. 계정별 재정의는 `channels.discord.accounts.<id>.thread.inheritParent` 아래에 있습니다.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 해석할 수 있습니다.
    - `guilds.<guild>.channels.<channel>.requireMention: false`는 답장 단계 활성화 대체 중에 유지됩니다.

    채널 주제는 **신뢰할 수 없는** 컨텍스트로 주입됩니다. 허용 목록은 누가 에이전트를 트리거할 수 있는지를 제한하지만, 전체 보조 컨텍스트 삭제 경계는 아닙니다.

  </Accordion>

  <Accordion title="서브에이전트용 스레드 바인딩 세션">
    Discord는 스레드를 세션 대상에 바인딩하여 해당 스레드의 후속 메시지가 동일한 세션(서브에이전트 세션 포함)으로 계속 라우팅되도록 할 수 있습니다.

    명령:

    - `/focus <target>` 현재/새 스레드를 서브에이전트/세션 대상에 바인딩
    - `/unfocus` 현재 스레드 바인딩 제거
    - `/agents` 활성 실행 및 바인딩 상태 표시
    - `/session idle <duration|off>` 포커스된 바인딩의 비활동 자동 언포커스를 확인/업데이트
    - `/session max-age <duration|off>` 포커스된 바인딩의 엄격한 최대 수명을 확인/업데이트

    설정:

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

    - `session.threadBindings.*`는 전역 기본값을 설정합니다.
    - `channels.discord.threadBindings.*`는 Discord 동작을 재정의합니다.
    - `spawnSessions`는 `sessions_spawn({ thread: true })` 및 ACP 스레드 생성에 대한 스레드 자동 생성/바인딩을 제어합니다. 기본값: `true`.
    - `defaultSpawnContext`는 스레드 바인딩 생성에 대한 네이티브 서브에이전트 컨텍스트를 제어합니다. 기본값: `"fork"`.
    - 더 이상 사용되지 않는 `spawnSubagentSessions`/`spawnAcpSessions` 키는 `openclaw doctor --fix`로 마이그레이션됩니다.
    - 계정에 대해 스레드 바인딩이 비활성화된 경우 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    [서브 에이전트](/ko/tools/subagents), [ACP 에이전트](/ko/tools/acp-agents), [설정 참조](/ko/gateway/configuration-reference)를 참조하세요.

  </Accordion>

  <Accordion title="영구 ACP 채널 바인딩">
    안정적인 "항상 켜진" ACP 작업 영역을 위해 Discord 대화를 대상으로 하는 최상위 typed ACP 바인딩을 설정하세요.

    설정 경로:

    - `type: "acp"` 및 `match.channel: "discord"`가 포함된 `bindings[]`

    예:

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

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 그 자리에서 바인딩하고 향후 메시지를 동일한 ACP 세션에 유지합니다. 스레드 메시지는 상위 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new`와 `/reset`은 동일한 ACP 세션을 그 자리에서 재설정합니다. 임시 스레드 바인딩은 활성 상태일 때 대상 해석을 재정의할 수 있습니다.
    - `spawnSessions`는 `--thread auto|here`를 통한 하위 스레드 생성/바인딩을 제한합니다.

    바인딩 동작 세부 정보는 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

  </Accordion>

  <Accordion title="반응 알림">
    길드별 반응 알림 모드:

    - `off`
    - `own`(기본값)
    - `all`
    - `allowlist`(`guilds.<id>.users` 사용)

    반응 이벤트는 시스템 이벤트로 변환되어 라우팅된 Discord 세션에 첨부됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    해석 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 아이덴티티 이모지 대체값(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Discord는 유니코드 이모지 또는 사용자 지정 이모지 이름을 허용합니다.
    - 채널 또는 계정의 반응을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="설정 쓰기">
    채널에서 시작한 설정 쓰기는 기본적으로 활성화되어 있습니다.

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
    `channels.discord.proxy`를 사용해 Discord Gateway WebSocket 트래픽과 시작 시 REST 조회(애플리케이션 ID + 허용 목록 해석)를 HTTP(S) 프록시를 통해 라우팅합니다.

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
    프록시된 메시지를 시스템 멤버 아이덴티티에 매핑하도록 PluralKit 해석을 활성화합니다.

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    참고:

    - 허용 목록은 `pk:<memberId>`를 사용할 수 있습니다.
    - 멤버 표시 이름은 `channels.discord.dangerouslyAllowNameMatching: true`인 경우에만 이름/슬러그로 매칭됩니다.
    - 조회는 원본 메시지 ID를 사용하며 시간 창으로 제한됩니다.
    - 조회에 실패하면 프록시된 메시지는 봇 메시지로 처리되어 `allowBots=true`가 아닌 한 삭제됩니다.

  </Accordion>

  <Accordion title="발신 멘션 별칭">
    에이전트가 알려진 Discord 사용자에 대해 결정론적인 발신 멘션이 필요할 때 `mentionAliases`를 사용하세요. 키는 앞의 `@`가 없는 핸들이며, 값은 Discord 사용자 ID입니다. 알 수 없는 핸들, `@everyone`, `@here`, Markdown 코드 스팬 안의 멘션은 변경되지 않습니다.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

  <Accordion title="프레즌스 설정">
    상태 또는 활동 필드를 설정하거나 자동 프레즌스를 활성화하면 프레즌스 업데이트가 적용됩니다.

    상태만 사용하는 예:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    활동 예(사용자 지정 상태가 기본 활동 유형):

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

    스트리밍 예:

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

    활동 유형 맵:

    - 0: 플레이 중
    - 1: 스트리밍 중(`activityUrl` 필요)
    - 2: 듣는 중
    - 3: 시청 중
    - 4: 사용자 지정(활동 텍스트를 상태로 사용, 이모지는 선택 사항)
    - 5: 경쟁 중

    자동 프레즌스 예시(런타임 상태 신호):

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

    자동 프레즌스는 런타임 가용성을 Discord 상태에 매핑합니다: 정상 => 온라인, 저하 또는 알 수 없음 => 자리 비움, 소진 또는 사용 불가 => 방해 금지. 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`(`{reason}` 플레이스홀더 지원)

  </Accordion>

  <Accordion title="Discord의 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 원본 채널에 승인 프롬프트를 게시할 수 있습니다.

    구성 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`(선택 사항, 가능한 경우 `commands.ownerAllowFrom`으로 폴백)
    - `channels.discord.execApprovals.target`(`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled`가 설정되지 않았거나 `"auto"`이고, `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 하나 이상의 승인자를 확인할 수 있으면 Discord는 네이티브 exec 승인을 자동으로 활성화합니다. Discord는 채널 `allowFrom`, 레거시 `dm.allowFrom`, 또는 다이렉트 메시지 `defaultTo`에서 exec 승인자를 추론하지 않습니다. Discord를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.

    `/diagnostics` 및 `/export-trajectory` 같은 민감한 소유자 전용 그룹 명령의 경우 OpenClaw는 승인 프롬프트와 최종 결과를 비공개로 보냅니다. 호출한 소유자에게 Discord 소유자 경로가 있으면 먼저 Discord DM을 시도하고, 사용할 수 없으면 Telegram 같은 `commands.ownerAllowFrom`의 첫 번째 사용 가능한 소유자 경로로 폴백합니다.

    `target`이 `channel` 또는 `both`이면 승인 프롬프트가 채널에 표시됩니다. 확인된 승인자만 버튼을 사용할 수 있으며, 다른 사용자는 임시 거부 메시지를 받습니다. 승인 프롬프트에는 명령 텍스트가 포함되므로 신뢰할 수 있는 채널에서만 채널 전달을 활성화하세요. 세션 키에서 채널 ID를 파생할 수 없으면 OpenClaw는 DM 전달로 폴백합니다.

    Discord는 다른 채팅 채널에서 사용하는 공유 승인 버튼도 렌더링합니다. 네이티브 Discord 어댑터는 주로 승인자 DM 라우팅과 채널 팬아웃을 추가합니다.
    해당 버튼이 있으면 기본 승인 UX입니다. OpenClaw는
    도구 결과에서 채팅 승인을 사용할 수 없다고 하거나 수동 승인이 유일한 경로라고 할 때만
    수동 `/approve` 명령을 포함해야 합니다.
    Discord 네이티브 승인 런타임이 활성 상태가 아니면 OpenClaw는
    로컬 결정적 `/approve <id> <decision>` 프롬프트를 계속 표시합니다. 런타임이 활성 상태지만 어떤 대상에도 네이티브 카드를 전달할 수 없으면
    OpenClaw는 보류 중인 승인에서 정확한 `/approve`
    명령이 포함된 같은 채팅 폴백 알림을 보냅니다.

    Gateway 인증 및 승인 확인은 공유 Gateway 클라이언트 계약을 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해 확인되고, 다른 ID는 `exec.approval.resolve`를 통해 확인됨). 승인은 기본적으로 30분 후 만료됩니다.

    [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 도구 및 작업 게이트

Discord 메시지 작업에는 메시징, 채널 관리, 모더레이션, 프레즌스, 메타데이터 작업이 포함됩니다.

핵심 예시:

- 메시징: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- 반응: `react`, `reactions`, `emojiList`
- 모더레이션: `timeout`, `kick`, `ban`
- 프레즌스: `setPresence`

`event-create` 작업은 예약된 이벤트 커버 이미지를 설정하기 위해 선택적 `image` 매개변수(URL 또는 로컬 파일 경로)를 받습니다.

작업 게이트는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| 작업 그룹                                                                                                                                                             | 기본값   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 반응, 메시지, 스레드, 핀, 투표, 검색, memberInfo, roleInfo, channelInfo, 채널, voiceStatus, 이벤트, 스티커, emojiUploads, stickerUploads, 권한 | 활성화  |
| 역할                                                                                                                                                                    | 비활성화 |
| 모더레이션                                                                                                                                                               | 비활성화 |
| 프레즌스                                                                                                                                                                 | 비활성화 |

## Components v2 UI

OpenClaw는 exec 승인 및 교차 컨텍스트 마커에 Discord components v2를 사용합니다. Discord 메시지 작업도 사용자 지정 UI를 위해 `components`를 받을 수 있습니다(고급, discord 도구를 통해 컴포넌트 페이로드를 구성해야 함). 레거시 `embeds`도 계속 사용할 수 있지만 권장하지 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord 컴포넌트 컨테이너에서 사용하는 강조 색상(hex)을 설정합니다.
- 계정별로 `channels.discord.accounts.<id>.ui.components.accentColor`로 설정합니다.
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

Discord에는 두 가지 별도의 음성 표면이 있습니다: 실시간 **음성 채널**(연속 대화)과 **음성 메시지 첨부 파일**(파형 미리보기 형식). Gateway는 둘 다 지원합니다.

### 음성 채널

설정 체크리스트:

1. Discord Developer Portal에서 Message Content Intent를 활성화합니다.
2. 역할/사용자 허용 목록을 사용할 때 Server Members Intent를 활성화합니다.
3. `bot` 및 `applications.commands` 범위로 봇을 초대합니다.
4. 대상 음성 채널에서 Connect, Speak, Send Messages, Read Message History를 부여합니다.
5. 네이티브 명령(`commands.native` 또는 `channels.discord.commands.native`)을 활성화합니다.
6. `channels.discord.voice`를 구성합니다.

세션을 제어하려면 `/vc join|leave|status`를 사용하세요. 이 명령은 계정 기본 에이전트를 사용하며 다른 Discord 명령과 동일한 허용 목록 및 그룹 정책 규칙을 따릅니다.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

참가하기 전에 봇의 유효 권한을 검사하려면 다음을 실행하세요.

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

자동 참가 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

참고:

- `voice.tts`는 `stt-tts` 음성 재생에만 `messages.tts`를 재정의합니다. Realtime 모드는 `voice.realtime.voice`를 사용합니다.
- `voice.mode`는 대화 경로를 제어합니다. 기본값은 `agent-proxy`입니다. Realtime 음성 프런트엔드가 턴 타이밍, 끼어들기, 재생을 처리하고, 실질적인 작업은 `openclaw_agent_consult`를 통해 라우팅된 OpenClaw 에이전트에 위임하며, 그 결과를 해당 화자의 입력된 Discord 프롬프트처럼 취급합니다. `stt-tts`는 기존의 배치 STT와 TTS 흐름을 유지합니다. `bidi`는 Realtime 모델이 직접 대화하도록 하면서 OpenClaw 두뇌를 위해 `openclaw_agent_consult`를 노출합니다.
- `voice.agentSession`은 어떤 OpenClaw 대화가 음성 턴을 받을지 제어합니다. 음성 채널 자체 세션을 사용하려면 설정하지 않은 상태로 두거나, 음성 채널이 `#maintainers` 같은 기존 Discord 텍스트 채널 세션의 마이크/스피커 확장으로 동작하게 하려면 `{ mode: "target", target: "channel:<text-channel-id>" }`로 설정하세요.
- `voice.model`은 Discord 음성 응답과 Realtime 상담에 사용할 OpenClaw 에이전트 두뇌를 재정의합니다. 라우팅된 에이전트 모델을 상속하려면 설정하지 않은 상태로 두세요. 이는 `voice.realtime.model`과 별개입니다.
- `agent-proxy`는 음성을 `discord-voice`를 통해 라우팅합니다. 이 경로는 화자와 대상 세션에 대한 일반적인 소유자/도구 권한을 보존하지만, Discord 음성이 재생을 소유하므로 에이전트 `tts` 도구는 숨깁니다. 기본적으로 `agent-proxy`는 소유자 화자에게 상담에 대한 전체 소유자 동등 도구 접근 권한을 부여하고(`voice.realtime.toolPolicy: "owner"`), 실질적인 답변 전 OpenClaw 에이전트 상담을 강하게 선호합니다(`voice.realtime.consultPolicy: "always"`). 이 기본 `always` 모드에서는 Realtime 계층이 상담 답변 전에 자동으로 자리 채우기 발화를 하지 않습니다. 음성을 캡처하고 전사한 뒤, 라우팅된 OpenClaw 답변을 말합니다. Discord가 첫 답변을 아직 재생 중인 동안 여러 강제 상담 답변이 완료되면, 이후의 정확 발화 답변은 문장 중간에 음성을 교체하지 않고 재생이 유휴 상태가 될 때까지 대기열에 들어갑니다.
- `stt-tts` 모드에서 STT는 `tools.media.audio`를 사용하며, `voice.model`은 전사에 영향을 주지 않습니다.
- Realtime 모드에서는 `voice.realtime.provider`, `voice.realtime.model`, `voice.realtime.voice`가 Realtime 오디오 세션을 구성합니다. OpenAI Realtime 2와 Codex 두뇌를 함께 사용하려면 `voice.realtime.model: "gpt-realtime-2"` 및 `voice.model: "openai-codex/gpt-5.5"`를 사용하세요.
- OpenAI Realtime 제공자는 출력 오디오 및 전사 이벤트에 대해 현재 Realtime 2 이벤트 이름과 레거시 Codex 호환 별칭을 모두 허용하므로, 호환 제공자 스냅샷이 변하더라도 어시스턴트 오디오가 누락되지 않습니다.
- `voice.realtime.bargeIn`은 Discord 화자 시작 이벤트가 활성 Realtime 재생을 중단할지 제어합니다. 설정하지 않으면 Realtime 제공자의 입력 오디오 끼어들기 설정을 따릅니다.
- `voice.realtime.minBargeInAudioEndMs`는 OpenAI Realtime 끼어들기가 오디오를 자르기 전에 필요한 최소 어시스턴트 재생 시간을 제어합니다. 기본값: `250`. 에코가 적은 방에서는 즉시 중단하려면 `0`으로 설정하고, 에코가 많은 스피커 설정에서는 값을 높이세요.
- Discord 재생에 OpenAI 음성을 사용하려면 `voice.tts.provider: "openai"`를 설정하고 `voice.tts.openai.voice` 또는 `voice.tts.providers.openai.voice` 아래에서 Text-to-speech 음성을 선택하세요. `cedar`는 현재 OpenAI TTS 모델에서 남성적인 느낌의 좋은 선택입니다.
- 채널별 Discord `systemPrompt` 재정의는 해당 음성 채널의 음성 전사 턴에 적용됩니다.
- 음성 전사 턴은 Discord `allowFrom`(또는 `dm.allowFrom`)에서 소유자 상태를 도출합니다. 비소유자 화자는 소유자 전용 도구(예: `gateway`, `cron`)에 접근할 수 없습니다.
- Discord 음성은 텍스트 전용 구성에서는 옵트인입니다. `/vc` 명령, 음성 런타임, `GuildVoiceStates` Gateway 인텐트를 활성화하려면 `channels.discord.voice.enabled=true`를 설정하거나 기존 `channels.discord.voice` 블록을 유지하세요.
- `channels.discord.intents.voiceStates`는 음성 상태 인텐트 구독을 명시적으로 재정의할 수 있습니다. 인텐트가 유효한 음성 활성화 상태를 따르게 하려면 설정하지 않은 상태로 두세요.
- `voice.autoJoin`에 같은 길드에 대한 항목이 여러 개 있으면 OpenClaw는 해당 길드에 대해 마지막으로 구성된 채널에 참여합니다.
- `voice.allowedChannels`는 선택적 상주 허용 목록입니다. `/vc join`을 인증된 모든 Discord 음성 채널로 허용하려면 설정하지 않은 상태로 두세요. 설정하면 `/vc join`, 시작 시 자동 참여, 봇 음성 상태 이동이 나열된 `{ guildId, channelId }` 항목으로 제한됩니다. 모든 Discord 음성 참여를 거부하려면 빈 배열로 설정하세요. Discord가 봇을 허용 목록 밖으로 이동시키면 OpenClaw는 해당 채널을 떠나고, 사용할 수 있는 구성된 자동 참여 대상이 있으면 다시 참여합니다.
- `voice.daveEncryption` 및 `voice.decryptionFailureTolerance`는 `@discordjs/voice` 참여 옵션으로 전달됩니다.
- 설정하지 않으면 `@discordjs/voice` 기본값은 `daveEncryption=true` 및 `decryptionFailureTolerance=24`입니다.
- OpenClaw는 Discord 음성 수신에 기본적으로 순수 JS `opusscript` 디코더를 사용합니다. 선택적 네이티브 `@discordjs/opus` 패키지는 저장소 pnpm 설치 정책에서 무시되므로 일반 설치, Docker 레인, 관련 없는 테스트가 네이티브 애드온을 컴파일하지 않습니다. 전용 음성 성능 호스트는 네이티브 애드온을 설치한 뒤 `OPENCLAW_DISCORD_OPUS_DECODER=native`로 옵트인할 수 있습니다.
- `voice.connectTimeoutMs`는 `/vc join` 및 자동 참여 시도에 대한 초기 `@discordjs/voice` Ready 대기 시간을 제어합니다. 기본값: `30000`.
- `voice.reconnectGraceMs`는 연결이 끊긴 음성 세션이 제거되기 전에 다시 연결되기 시작할 때까지 OpenClaw가 기다리는 시간을 제어합니다. 기본값: `15000`.
- `stt-tts` 모드에서는 다른 사용자가 말하기 시작했다는 이유만으로 음성 재생이 멈추지 않습니다. 피드백 루프를 피하기 위해 OpenClaw는 TTS가 재생되는 동안 새 음성 캡처를 무시합니다. 다음 턴은 재생이 끝난 뒤 말하세요. Realtime 모드는 화자 시작을 Realtime 제공자에 끼어들기 신호로 전달합니다.
- Realtime 모드에서 스피커의 에코가 열린 마이크로 들어오면 끼어들기처럼 보이고 재생을 중단할 수 있습니다. 에코가 많은 Discord 방에서는 OpenAI가 입력 오디오에서 자동으로 중단하지 않도록 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`를 설정하세요. 그래도 Discord 화자 시작 이벤트가 활성 재생을 중단하길 원한다면 `voice.realtime.bargeIn: true`를 추가하세요. OpenAI Realtime 브리지는 `voice.realtime.minBargeInAudioEndMs`보다 짧은 재생 잘림을 에코/잡음 가능성이 높은 것으로 보고 무시하며, Discord 재생을 지우는 대신 건너뛴 것으로 로그에 남깁니다.
- `voice.captureSilenceGraceMs`는 Discord가 화자가 멈췄다고 보고한 뒤 OpenClaw가 해당 오디오 세그먼트를 STT용으로 확정하기까지 기다리는 시간을 제어합니다. 기본값: `2500`; Discord가 일반적인 멈춤을 끊긴 부분 전사로 나눈다면 이 값을 높이세요.
- ElevenLabs가 선택된 TTS 제공자인 경우 Discord 음성 재생은 스트리밍 TTS를 사용하며 제공자 응답 스트림에서 시작합니다. 스트리밍을 지원하지 않는 제공자는 합성된 임시 파일 경로로 대체됩니다.
- OpenClaw는 수신 복호화 실패도 감시하며, 짧은 시간 안에 반복 실패가 발생하면 음성 채널을 떠났다가 다시 참여하여 자동으로 복구합니다.
- 업데이트 후 수신 로그에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복해서 표시되면 의존성 보고서와 로그를 수집하세요. 번들된 `@discordjs/voice` 라인에는 discord.js PR #11449의 업스트림 패딩 수정이 포함되어 있으며, 이 수정은 discord.js 이슈 #11419를 닫았습니다.
- `The operation was aborted` 수신 이벤트는 OpenClaw가 캡처된 화자 세그먼트를 확정할 때 예상되는 이벤트입니다. 이는 경고가 아니라 자세한 진단 정보입니다.
- 자세한 Discord 음성 로그에는 허용된 각 화자 세그먼트에 대해 제한된 한 줄 STT 전사 미리보기가 포함되므로, 디버깅 시 무제한 전사 텍스트를 덤프하지 않고도 사용자 측과 에이전트 응답 측을 모두 볼 수 있습니다.
- `agent-proxy` 모드에서 강제 상담 폴백은 `...`로 끝나는 텍스트나 `and` 같은 후행 연결어처럼 불완전할 가능성이 높은 전사 조각, 그리고 “곧 돌아올게요” 또는 “안녕” 같은 명백히 실행 불가능한 종료 발화를 건너뜁니다. 이로 인해 오래된 대기열 답변이 방지되면 로그에 `forced agent consult skipped reason=...`가 표시됩니다.

소스 체크아웃용 네이티브 opus 설정:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

업스트림 macOS arm64 사전 빌드 네이티브 애드온을 원할 때는 Gateway에 Node 22를 사용하세요. 다른 Node 런타임을 사용하면 옵트인 설치 프로그램에 로컬 `node-gyp` 소스 빌드 도구 체인이 필요할 수 있습니다.

네이티브 애드온을 설치한 뒤 다음으로 Gateway를 시작하세요.

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

자세한 음성 로그에는 `discord voice: opus decoder: @discordjs/opus`가 표시되어야 합니다. env 옵트인이 없거나 네이티브 애드온이 없거나 호스트에서 로드할 수 없으면 OpenClaw는 `discord voice: opus decoder: opusscript`를 로그에 남기고 순수 JS 폴백을 통해 음성 수신을 계속합니다.

STT와 TTS 파이프라인:

- Discord PCM 캡처는 WAV 임시 파일로 변환됩니다.
- `tools.media.audio`가 STT를 처리합니다. 예: `openai/gpt-4o-mini-transcribe`.
- 전사는 Discord 인그레스와 라우팅을 통해 전송되며, 응답 LLM은 에이전트 `tts` 도구를 숨기고 반환 텍스트를 요청하는 음성 출력 정책으로 실행됩니다. 최종 TTS 재생은 Discord 음성이 소유하기 때문입니다.
- `voice.model`이 설정된 경우 이 음성 채널 턴의 응답 LLM만 재정의합니다.
- `voice.tts`는 `messages.tts` 위에 병합됩니다. 스트리밍 가능한 제공자는 플레이어에 직접 공급하고, 그렇지 않으면 결과 오디오 파일이 참여한 채널에서 재생됩니다.

기본 agent-proxy 음성 채널 세션 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` 블록이 없으면 각 음성 채널은 자체 라우팅된 OpenClaw 세션을 가집니다. 예를 들어 `/vc join channel:234567890123456789`는 해당 Discord 음성 채널의 세션과 대화합니다. Realtime 모델은 음성 프런트엔드일 뿐이며, 실질적인 요청은 구성된 OpenClaw 에이전트에 전달됩니다. Realtime 모델이 상담 도구를 호출하지 않고 최종 전사를 생성하면, OpenClaw는 기본 동작이 여전히 에이전트와 대화하는 것처럼 유지되도록 폴백으로 상담을 강제합니다.

레거시 STT와 TTS 예시:

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Realtime bidi 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

기존 Discord 채널 세션의 확장으로서의 음성:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` 모드에서 봇은 구성된 음성 채널에 참여하지만, OpenClaw 에이전트 턴은 대상 채널의 일반적인 라우팅 세션과 에이전트를 사용합니다. Realtime 음성 세션은 반환된 결과를 음성 채널에 다시 말합니다. 감독 에이전트는 별도의 Discord 메시지를 보내는 것이 올바른 동작인 경우 이를 포함하여, 도구 정책에 따라 일반 메시지 도구를 계속 사용할 수 있습니다.

유용한 대상 형식:

- `target: "channel:123456789012345678"`는 Discord 텍스트 채널 세션을 통해 라우팅합니다.
- `target: "123456789012345678"`는 채널 대상으로 취급됩니다.
- `target: "dm:123456789012345678"` 또는 `target: "user:123456789012345678"`는 해당 다이렉트 메시지 세션을 통해 라우팅합니다.

에코가 많은 OpenAI Realtime 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

모델이 열린 마이크를 통해 자체 Discord 재생음을 듣지만, 사용자가 말해서 이를 중단할 수는 있어야 할 때 이 설정을 사용하세요. OpenClaw는 원시 입력 오디오에서 OpenAI가 자동으로 중단하지 못하게 하며, `bargeIn: true`는 다음 캡처 턴이 OpenAI에 도달하기 전에 Discord 화자 시작 이벤트와 이미 활성 상태인 화자 오디오가 활성 realtime 응답을 취소할 수 있게 합니다. `audioEndMs`가 `minBargeInAudioEndMs`보다 낮은 매우 이른 끼어들기 신호는 에코/노이즈일 가능성이 높은 것으로 처리되어 무시되므로, 모델이 첫 번째 재생 프레임에서 끊기지 않습니다.

예상 음성 로그:

- 참여 시: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- realtime 시작 시: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 화자 오디오 시: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, 및 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 오래된 음성 건너뜀 시: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 또는 `reason=non-actionable-closing ...`
- realtime 응답 완료 시: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 재생 중지/재설정 시: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- realtime consult 시: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 에이전트 답변 시: `discord voice: agent turn answer ...`
- 정확한 음성 대기열 추가 시: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, 이후 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 끼어들기 감지 시: `discord voice: realtime barge-in detected source=speaker-start ...` 또는 `discord voice: realtime barge-in detected source=active-speaker-audio ...`, 이후 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- realtime 중단 시: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, 이후 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 또는 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 무시된 에코/노이즈 시: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 비활성화된 끼어들기 시: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 유휴 재생 시: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

끊기는 오디오를 디버그하려면 realtime 음성 로그를 타임라인으로 읽으세요.

1. `realtime audio playback started`는 Discord가 어시스턴트 오디오 재생을 시작했다는 뜻입니다. 브리지는 이 지점부터 어시스턴트 출력 청크, Discord PCM 바이트, 제공자 realtime 바이트, 합성된 오디오 길이를 세기 시작합니다.
2. `realtime speaker turn opened`는 Discord 화자가 활성 상태가 되었음을 표시합니다. 재생이 이미 활성 상태이고 `bargeIn`이 활성화되어 있으면, 뒤이어 `barge-in detected source=speaker-start`가 나타날 수 있습니다.
3. `realtime input audio started`는 해당 화자 턴에 대해 실제 첫 오디오 프레임이 수신되었음을 표시합니다. 여기서 `outputActive=true` 또는 0이 아닌 `outputAudioMs`는 어시스턴트 재생이 아직 활성 상태인 동안 마이크가 입력을 보내고 있음을 의미합니다.
4. `barge-in detected source=active-speaker-audio`는 OpenClaw가 어시스턴트 재생이 활성 상태인 동안 라이브 화자 오디오를 확인했다는 뜻입니다. 이는 유용한 오디오가 없는 Discord 화자 시작 이벤트와 실제 중단을 구분하는 데 유용합니다.
5. `barge-in requested reason=...`는 OpenClaw가 realtime 제공자에게 활성 응답을 취소하거나 잘라내도록 요청했다는 뜻입니다. 중단 전에 실제로 재생된 어시스턴트 오디오의 양을 확인할 수 있도록 `outputAudioMs`, `outputActive`, `playbackChunks`를 포함합니다.
6. `realtime audio playback stopped reason=...`는 로컬 Discord 재생 재설정 지점입니다. 이유는 재생을 누가 중지했는지 나타냅니다: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, 또는 `session-close`.
7. `realtime speaker turn closed`는 캡처된 입력 턴을 요약합니다. `chunks=0` 또는 `hasAudio=false`는 화자 턴이 열렸지만 사용 가능한 오디오가 realtime 브리지에 도달하지 않았음을 의미합니다. `interruptedPlayback=true`는 해당 입력 턴이 어시스턴트 출력과 겹쳤고 끼어들기 로직을 트리거했음을 의미합니다.

유용한 필드:

- `outputAudioMs`: 로그 줄 이전에 realtime 제공자가 생성한 어시스턴트 오디오 길이입니다.
- `audioMs`: 재생이 중지되기 전에 OpenClaw가 계산한 어시스턴트 오디오 길이입니다.
- `elapsedMs`: 재생 스트림 또는 화자 턴을 열고 닫는 사이의 실제 경과 시간입니다.
- `discordBytes`: Discord 음성으로 보내거나 Discord 음성에서 받은 48 kHz 스테레오 PCM 바이트입니다.
- `realtimeBytes`: realtime 제공자에게 보내거나 제공자에서 받은 제공자 형식 PCM 바이트입니다.
- `playbackChunks`: 활성 응답에 대해 Discord로 전달된 어시스턴트 오디오 청크입니다.
- `sinceLastAudioMs`: 마지막으로 캡처된 화자 오디오 프레임과 화자 턴 종료 사이의 간격입니다.

일반적인 패턴:

- `source=active-speaker-audio`, 작은 `outputAudioMs`, 같은 사용자가 근처에 있는 즉시 끊김은 보통 스피커 에코가 마이크로 유입됨을 나타냅니다. `voice.realtime.minBargeInAudioEndMs`를 높이거나, 스피커 볼륨을 낮추거나, 헤드폰을 사용하거나, `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`를 설정하세요.
- `source=speaker-start` 뒤에 `speaker turn closed ... hasAudio=false`가 나타나면 Discord가 화자 시작을 보고했지만 오디오가 OpenClaw에 도달하지 않았다는 뜻입니다. 이는 일시적인 Discord 음성 이벤트, 노이즈 게이트 동작, 또는 클라이언트가 잠시 마이크를 켜는 동작일 수 있습니다.
- 근처에 끼어들기 또는 `provider-clear-audio` 없이 `audio playback stopped reason=stream-close`가 나타나면 로컬 Discord 재생 스트림이 예기치 않게 종료되었다는 뜻입니다. 앞선 제공자 및 Discord 플레이어 로그를 확인하세요.
- `capture ignored during playback (barge-in disabled)`는 어시스턴트 오디오가 활성 상태인 동안 OpenClaw가 의도적으로 입력을 버렸다는 뜻입니다. 음성이 재생을 중단하게 하려면 `voice.realtime.bargeIn`을 활성화하세요.
- `barge-in ignored ... outputActive=false`는 Discord 또는 제공자 VAD가 음성을 보고했지만, OpenClaw에 중단할 활성 재생이 없었다는 뜻입니다. 이 경우 오디오가 끊기면 안 됩니다.

자격 증명은 컴포넌트별로 해석됩니다: `voice.model`의 LLM 라우트 인증, `tools.media.audio`의 STT 인증, `messages.tts`/`voice.tts`의 TTS 인증, 그리고 `voice.realtime.providers` 또는 제공자의 일반 인증 구성에 대한 realtime 제공자 인증입니다.

### 음성 메시지

Discord 음성 메시지는 파형 미리보기를 표시하며 OGG/Opus 오디오가 필요합니다. OpenClaw는 파형을 자동으로 생성하지만, 검사와 변환을 위해 Gateway 호스트에 `ffmpeg`와 `ffprobe`가 필요합니다.

- **로컬 파일 경로**를 제공하세요(URL은 거부됩니다).
- 텍스트 콘텐츠를 생략하세요(Discord는 같은 페이로드의 텍스트 + 음성 메시지를 거부합니다).
- 모든 오디오 형식을 사용할 수 있으며, OpenClaw가 필요에 따라 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent를 활성화하세요
    - 사용자/멤버 해석에 의존하는 경우 Server Members Intent를 활성화하세요
    - 인텐트를 변경한 후 Gateway를 재시작하세요

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy`를 확인하세요
    - `channels.discord.guilds` 아래의 길드 허용 목록을 확인하세요
    - 길드 `channels` 맵이 있으면, 나열된 채널만 허용됩니다
    - `requireMention` 동작과 멘션 패턴을 확인하세요

    유용한 확인:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    일반적인 원인:

    - 일치하는 길드/채널 허용 목록 없이 `groupPolicy="allowlist"`를 사용함
    - `requireMention`이 잘못된 위치에 구성됨(`channels.discord.guilds` 또는 채널 항목 아래에 있어야 함)
    - 발신자가 길드/채널 `users` 허용 목록에 의해 차단됨

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    일반적인 로그:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 대기열 조정값:

    - 단일 계정: `channels.discord.eventQueue.listenerTimeout`
    - 다중 계정: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 이는 에이전트 턴 수명이 아니라 Discord Gateway 리스너 작업만 제어합니다

    Discord는 대기 중인 에이전트 턴에 채널 소유 타임아웃을 적용하지 않습니다. 메시지 리스너는 즉시 전달하며, 대기 중인 Discord 실행은 세션/도구/런타임 수명 주기가 완료되거나 작업을 중단할 때까지 세션별 순서를 유지합니다.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw는 연결하기 전에 Discord `/gateway/bot` 메타데이터를 가져옵니다. 일시적 실패는 Discord의 기본 Gateway URL로 폴백되며 로그에서 속도 제한됩니다.

    메타데이터 타임아웃 조정값:

    - 단일 계정: `channels.discord.gatewayInfoTimeoutMs`
    - 다중 계정: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 구성이 설정되지 않았을 때의 env 폴백: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 기본값: `30000`(30초), 최대: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw는 시작 중 및 런타임 재연결 후 Discord Gateway `READY` 이벤트를 기다립니다. 시작 시차를 두는 다중 계정 설정은 기본값보다 더 긴 시작 READY 창이 필요할 수 있습니다.

    READY 타임아웃 조정값:

    - 시작 단일 계정: `channels.discord.gatewayReadyTimeoutMs`
    - 시작 다중 계정: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 구성이 설정되지 않았을 때의 시작 env 폴백: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 시작 기본값: `15000`(15초), 최대: `120000`
    - 런타임 단일 계정: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 런타임 다중 계정: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 구성이 설정되지 않았을 때의 런타임 env 폴백: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 런타임 기본값: `30000`(30초), 최대: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` 권한 확인은 숫자 채널 ID에 대해서만 동작합니다.

    슬러그 키를 사용하면 런타임 매칭은 여전히 동작할 수 있지만, probe가 권한을 완전히 검증할 수는 없습니다.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"`(레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인 대기 중

  </Accordion>

  <Accordion title="Bot to bot loops">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`를 설정하는 경우, 루프 동작을 피하려면 엄격한 멘션 및 허용 목록 규칙을 사용하세요.
    봇을 멘션하는 봇 메시지만 허용하려면 `channels.discord.allowBots="mentions"`를 선호하세요.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="DecryptionFailed(...)로 인한 음성 STT 누락">

    - Discord 음성 수신 복구 로직이 있도록 OpenClaw를 최신 상태로 유지하세요(`openclaw update`)
    - `channels.discord.voice.daveEncryption=true`인지 확인하세요(기본값)
    - `channels.discord.voice.decryptionFailureTolerance=24`(업스트림 기본값)에서 시작하고 필요한 경우에만 조정하세요
    - 로그에서 다음을 확인하세요:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참여 후에도 실패가 계속되면 로그를 수집하고 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 및 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)의 업스트림 DAVE 수신 기록과 비교하세요

  </Accordion>
</AccordionGroup>

## 구성 참고 자료

기본 참고 자료: [구성 참고 자료 - Discord](/ko/gateway/config-channels#discord).

<Accordion title="중요도가 높은 Discord 필드">

- 시작/인증: `enabled`, `token`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 이벤트 큐: `eventQueue.listenerTimeout`(리스너 예산), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 답장/기록: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전송: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 스트리밍: `streaming`(레거시 별칭: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 미디어/재시도: `mediaMaxMb`(발신 Discord 업로드 제한, 기본값 `100MB`), `retry`
- 동작: `actions.*`
- 상태 표시: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]`(`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 안전 및 운영

- 봇 토큰은 비밀로 취급하세요(관리형 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- 최소 권한 Discord 권한을 부여하세요.
- 명령 배포/상태가 오래된 경우 gateway를 다시 시작하고 `openclaw channels status --probe`로 다시 확인하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord 사용자를 gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 채팅 및 허용 목록 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    인바운드 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화입니다.
  </Card>
  <Card title="멀티 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    길드와 채널을 에이전트에 매핑합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작입니다.
  </Card>
</CardGroup>
