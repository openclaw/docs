---
read_when:
    - Discord 채널 기능 작업
summary: Discord 봇 지원 상태, 기능 및 구성
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

Discord의 공식 Gateway를 통해 DM 및 길드 채널에서 사용할 수 있습니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord DM은 기본적으로 페어링 모드로 시작합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작과 명령 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 흐름입니다.
  </Card>
</CardGroup>

## 빠른 설정

봇이 포함된 새 애플리케이션을 만들고, 봇을 서버에 추가한 다음, OpenClaw에 페어링해야 합니다. 봇은 본인의 비공개 서버에 추가하는 것을 권장합니다. 아직 서버가 없다면 [먼저 서버를 만드세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** 선택).

<Steps>
  <Step title="Discord 애플리케이션 및 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동하여 **New Application**을 클릭합니다. 이름은 "OpenClaw"처럼 지정합니다.

    사이드바에서 **Bot**을 클릭합니다. **Username**을 OpenClaw 에이전트를 부르는 이름으로 설정합니다.

  </Step>

  <Step title="권한 있는 인텐트 활성화">
    계속 **Bot** 페이지에서 아래로 스크롤하여 **Privileged Gateway Intents**로 이동한 다음 다음을 활성화합니다.

    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장, 역할 허용 목록 및 이름-ID 매칭에 필요)
    - **Presence Intent** (선택 사항, 현재 상태 업데이트에만 필요)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지에서 다시 위로 스크롤한 뒤 **Reset Token**을 클릭합니다.

    <Note>
    이름과 달리, 이 작업은 첫 토큰을 생성합니다. 아무것도 "재설정"되지 않습니다.
    </Note>

    토큰을 복사하여 어딘가에 저장합니다. 이것이 **봇 토큰**이며 곧 필요합니다.

  </Step>

  <Step title="초대 URL 생성 및 봇을 서버에 추가">
    사이드바에서 **OAuth2**를 클릭합니다. 봇을 서버에 추가할 수 있는 적절한 권한이 포함된 초대 URL을 생성합니다.

    **OAuth2 URL Generator**까지 아래로 스크롤하고 다음을 활성화합니다.

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
      - 반응 추가 (선택 사항)

    이는 일반 텍스트 채널을 위한 기본 권한 세트입니다. 스레드를 만들거나 이어가는 포럼 또는 미디어 채널 워크플로를 포함하여 Discord 스레드에 게시할 계획이라면 **스레드에서 메시지 보내기**도 활성화합니다.
    하단에 생성된 URL을 복사하여 브라우저에 붙여넣고, 서버를 선택한 다음 **Continue**를 클릭하여 연결합니다. 이제 Discord 서버에서 봇이 보일 것입니다.

  </Step>

  <Step title="개발자 모드 활성화 및 ID 수집">
    Discord 앱으로 돌아가 내부 ID를 복사할 수 있도록 개발자 모드를 활성화해야 합니다.

    1. **User Settings**(아바타 옆 톱니바퀴 아이콘) → **Advanced**를 클릭하고 **Developer Mode**를 켭니다.
    2. 사이드바의 **서버 아이콘**을 오른쪽 클릭 → **Copy Server ID**
    3. **본인 아바타**를 오른쪽 클릭 → **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장합니다. 다음 단계에서 세 가지를 모두 OpenClaw에 보냅니다.

  </Step>

  <Step title="서버 멤버의 DM 허용">
    페어링이 작동하려면 Discord가 봇이 사용자에게 DM을 보낼 수 있도록 허용해야 합니다. **서버 아이콘**을 오른쪽 클릭 → **Privacy Settings** → **Direct Messages**를 켭니다.

    이렇게 하면 봇을 포함한 서버 멤버가 사용자에게 DM을 보낼 수 있습니다. OpenClaw와 함께 Discord DM을 사용하려면 이 설정을 켜 둡니다. 길드 채널만 사용할 계획이라면 페어링 후 DM을 비활성화할 수 있습니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정하기(채팅으로 보내지 마세요)">
    Discord 봇 토큰은 비밀번호와 같은 비밀 정보입니다. 에이전트에게 메시지를 보내기 전에 OpenClaw를 실행하는 머신에 설정합니다.

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

    OpenClaw가 이미 백그라운드 서비스로 실행 중이라면 OpenClaw Mac 앱을 통해 다시 시작하거나 `openclaw gateway run` 프로세스를 중지한 뒤 다시 시작합니다.
    관리형 서비스 설치의 경우 `DISCORD_BOT_TOKEN`이 있는 셸에서 `openclaw gateway install`을 실행하거나 변수를 `~/.openclaw/.env`에 저장하여, 다시 시작한 뒤 서비스가 env SecretRef를 확인할 수 있게 합니다.
    호스트가 Discord의 시작 애플리케이션 조회에서 차단되었거나 속도 제한을 받는 경우, 시작 시 해당 REST 호출을 건너뛸 수 있도록 Developer Portal의 Discord 애플리케이션/클라이언트 ID를 설정합니다. 기본 계정에는 `channels.discord.applicationId`를 사용하고, 여러 Discord 봇을 실행할 때는 `channels.discord.accounts.<accountId>.applicationId`를 사용합니다.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 채팅하고 알려줍니다. Discord가 첫 채널이라면 대신 CLI / 구성 탭을 사용합니다.

        > "이미 구성에 Discord 봇 토큰을 설정했습니다. User ID `<user_id>`와 Server ID `<server_id>`로 Discord 설정을 완료해 주세요."
      </Tab>
      <Tab title="CLI / 구성">
        파일 기반 구성을 선호한다면 다음을 설정합니다.

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

        기본 계정의 env 대체값:

```bash
DISCORD_BOT_TOKEN=...
```

        스크립트 기반 또는 원격 설정의 경우 같은 JSON5 블록을 `openclaw config patch --file ./discord.patch.json5 --dry-run`으로 작성한 다음 `--dry-run` 없이 다시 실행합니다. 일반 텍스트 `token` 값이 지원됩니다. SecretRef 값도 env/file/exec 공급자 전반에서 `channels.discord.token`에 지원됩니다. [비밀 관리](/ko/gateway/secrets)를 참조하세요.

        여러 Discord 봇의 경우 각 봇 토큰과 애플리케이션 ID를 해당 계정 아래에 유지합니다. 최상위 `channels.discord.applicationId`는 계정에 상속되므로 모든 계정이 같은 애플리케이션 ID를 사용해야 할 때만 그곳에 설정합니다.

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
    Gateway가 실행될 때까지 기다린 다음 Discord에서 봇에게 DM을 보냅니다. 봇이 페어링 코드를 응답합니다.

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

    페어링 코드는 1시간 후 만료됩니다.

    이제 Discord에서 DM을 통해 에이전트와 채팅할 수 있어야 합니다.

  </Step>
</Steps>

<Note>
토큰 확인은 계정을 인식합니다. 구성 토큰 값이 env 대체값보다 우선합니다. `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
활성화된 두 Discord 계정이 같은 봇 토큰으로 확인되면 OpenClaw는 해당 토큰에 대해 Gateway 모니터를 하나만 시작합니다. 구성에서 제공된 토큰은 기본 env 대체값보다 우선합니다. 그렇지 않으면 첫 번째 활성화된 계정이 우선하며 중복 계정은 비활성화된 것으로 보고됩니다.
고급 아웃바운드 호출(메시지 도구/채널 작업)의 경우 명시적인 호출별 `token`이 해당 호출에 사용됩니다. 이는 전송 및 읽기/프로브 스타일 작업(예: 읽기/검색/가져오기/스레드/핀/권한)에 적용됩니다. 계정 정책/재시도 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정에서 가져옵니다.
</Note>

## 권장: 길드 작업 공간 설정

DM이 작동하면 Discord 서버를 전체 작업 공간으로 설정할 수 있으며, 각 채널은 고유한 컨텍스트를 가진 자체 에이전트 세션을 갖습니다. 사용자와 봇만 있는 비공개 서버에 권장됩니다.

<Steps>
  <Step title="서버를 길드 허용 목록에 추가">
    이렇게 하면 에이전트가 DM뿐 아니라 서버의 모든 채널에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord Server ID `<server_id>`를 길드 허용 목록에 추가해 주세요"
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
    기본적으로 에이전트는 길드 채널에서 @멘션되었을 때만 응답합니다. 비공개 서버라면 아마 모든 메시지에 응답하도록 하고 싶을 것입니다.

    길드 채널에서 일반 어시스턴트 최종 응답은 기본적으로 비공개로 유지됩니다. 표시되는 Discord 출력은 `message` 도구로 명시적으로 보내야 하므로, 에이전트는 기본적으로 대기하다가 채널 응답이 유용하다고 판단할 때만 게시할 수 있습니다.

    즉, 선택한 모델이 도구를 안정적으로 호출해야 합니다. Discord에 입력 중 표시가 나타나고 로그에 토큰 사용량이 보이지만 게시된 메시지가 없다면 세션 로그에서 `didSendViaMessagingTool: false`가 포함된 어시스턴트 텍스트를 확인하세요. 이는 모델이 `message(action=send)`를 호출하는 대신 비공개 최종 답변을 생성했다는 의미입니다. 더 강력한 도구 호출 모델로 전환하거나 아래 구성을 사용하여 레거시 자동 최종 응답을 복원하세요.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 에이전트가 이 서버에서 @멘션되지 않아도 응답할 수 있게 해 주세요"
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

        그룹/채널 방에 대해 레거시 자동 최종 응답을 복원하려면 `messages.groupChat.visibleReplies: "automatic"`을 설정합니다.

      </Tab>
    </Tabs>

  </Step>

  <Step title="길드 채널의 메모리 계획">
    기본적으로 장기 메모리(MEMORY.md)는 DM 세션에서만 로드됩니다. 길드 채널은 MEMORY.md를 자동으로 로드하지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 내가 질문할 때 MEMORY.md의 장기 컨텍스트가 필요하면 memory_search 또는 memory_get을 사용해 주세요."
      </Tab>
      <Tab title="수동">
        모든 채널에 공유 컨텍스트가 필요하다면 안정적인 지침을 `AGENTS.md` 또는 `USER.md`에 넣으세요(모든 세션에 주입됩니다). 장기 메모는 `MEMORY.md`에 유지하고 필요할 때 메모리 도구로 접근합니다.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord 서버에 채널을 몇 개 만들고 채팅을 시작하세요. 에이전트는 채널 이름을 볼 수 있으며, 각 채널은 고유한 격리 세션을 갖습니다. 따라서 워크플로에 맞게 `#coding`, `#home`, `#research` 또는 원하는 채널을 설정할 수 있습니다.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 답장 라우팅은 결정적입니다. Discord 인바운드 답장은 Discord로 돌아갑니다.
- Discord 길드/채널 메타데이터는 사용자에게 표시되는 답장 접두사가 아니라 신뢰할 수 없는
  컨텍스트로 모델 프롬프트에 추가됩니다. 모델이 해당 봉투를 다시 복사하면
  OpenClaw는 아웃바운드 답장과 이후 리플레이 컨텍스트에서 복사된 메타데이터를 제거합니다.
- 기본적으로 (`session.dmScope=main`) 직접 채팅은 에이전트 메인 세션(`agent:main:main`)을 공유합니다.
- 길드 채널은 격리된 세션 키입니다(`agent:<agentId>:discord:channel:<channelId>`).
- 그룹 DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 네이티브 슬래시 명령은 격리된 명령 세션(`agent:<agentId>:discord:slash:<userId>`)에서 실행되며, 라우팅된 대화 세션으로 `CommandTargetSessionKey`를 계속 전달합니다.
- Discord로 전달되는 텍스트 전용 Cron/Heartbeat 알림은 최종
  어시스턴트 표시 답변을 한 번 사용합니다. 미디어 및 구조화된 컴포넌트 페이로드는
  에이전트가 여러 전달 가능 페이로드를 내보낼 때 다중 메시지로 유지됩니다.

## 포럼 채널

Discord 포럼 및 미디어 채널은 스레드 게시물만 허용합니다. OpenClaw는 이를 생성하는 두 가지 방법을 지원합니다.

- 포럼 상위 항목(`channel:<forumId>`)으로 메시지를 보내 스레드를 자동 생성합니다. 스레드 제목은 메시지의 첫 번째 비어 있지 않은 줄을 사용합니다.
- `openclaw message thread create`를 사용해 스레드를 직접 생성합니다. 포럼 채널에는 `--message-id`를 전달하지 마세요.

예: 포럼 상위 항목으로 보내 스레드 생성

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

예: 포럼 스레드를 명시적으로 생성

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

포럼 상위 항목은 Discord 컴포넌트를 허용하지 않습니다. 컴포넌트가 필요하면 스레드 자체(`channel:<threadId>`)로 보내세요.

## 대화형 컴포넌트

OpenClaw는 에이전트 메시지용 Discord 컴포넌트 v2 컨테이너를 지원합니다. `components` 페이로드와 함께 메시지 도구를 사용하세요. 상호작용 결과는 일반 인바운드 메시지처럼 에이전트로 다시 라우팅되며 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 작업 행은 최대 5개의 버튼 또는 단일 선택 메뉴를 허용합니다
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 컴포넌트는 일회용입니다. 버튼, 선택 항목, 양식을 만료될 때까지 여러 번 사용할 수 있게 하려면 `components.reusable=true`를 설정하세요.

버튼을 클릭할 수 있는 사용자를 제한하려면 해당 버튼에 `allowedUsers`를 설정하세요(Discord 사용자 ID, 태그 또는 `*`). 구성된 경우 일치하지 않는 사용자는 임시 거부 메시지를 받습니다.

`/model` 및 `/models` 슬래시 명령은 제공자, 모델, 호환 런타임 드롭다운과 제출 단계가 있는 대화형 모델 선택기를 엽니다. `/models add`는 더 이상 사용되지 않으며 이제 채팅에서 모델을 등록하는 대신 지원 중단 메시지를 반환합니다. 선택기 답장은 임시 메시지이며 호출한 사용자만 사용할 수 있습니다.

파일 첨부:

- `file` 블록은 첨부 참조(`attachment://<filename>`)를 가리켜야 합니다
- `media`/`path`/`filePath`(단일 파일)를 통해 첨부를 제공하세요. 여러 파일에는 `media-gallery`를 사용하세요
- 업로드 이름이 첨부 참조와 일치해야 하는 경우 `filename`을 사용해 재정의하세요

모달 양식:

- 최대 5개 필드와 함께 `components.modal`을 추가하세요
- 필드 유형: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw는 트리거 버튼을 자동으로 추가합니다

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

## 액세스 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.discord.dmPolicy`는 DM 액세스를 제어합니다. `channels.discord.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`channels.discord.allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    DM 정책이 열림이 아닌 경우, 알 수 없는 사용자는 차단됩니다(또는 `pairing` 모드에서는 페어링하라는 메시지가 표시됩니다).

    다중 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 하나의 계정에서는 `allowFrom`이 레거시 `dm.allowFrom`보다 우선합니다.
    - 이름이 지정된 계정은 자체 `allowFrom` 및 레거시 `dm.allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 이름이 지정된 계정은 `channels.discord.accounts.default.allowFrom`을 상속하지 않습니다.

    레거시 `channels.discord.dm.policy` 및 `channels.discord.dm.allowFrom`은 호환성을 위해 계속 읽습니다. `openclaw doctor --fix`는 액세스를 변경하지 않고 가능할 때 이를 `dmPolicy` 및 `allowFrom`으로 마이그레이션합니다.

    전달용 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    단순 숫자 ID는 일반적으로 채널 기본값이 활성 상태일 때 채널 ID로 해석되지만, 계정의 유효 DM `allowFrom`에 나열된 ID는 호환성을 위해 사용자 DM 대상으로 취급됩니다.

  </Tab>

  <Tab title="DM 액세스 그룹">
    Discord DM은 `channels.discord.allowFrom`에서 동적 `accessGroup:<name>` 항목을 사용할 수 있습니다.

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

    Discord 텍스트 채널에는 별도의 멤버 목록이 없습니다. `type: "discord.channelAudience"`는 멤버십을 다음과 같이 모델링합니다. DM 발신자는 구성된 길드의 멤버이고, 역할 및 채널 덮어쓰기가 적용된 후 구성된 채널에 대해 현재 유효한 `ViewChannel` 권한을 가지고 있습니다.

    예: 다른 모든 사용자에게는 DM을 닫아 두면서, `#maintainers`를 볼 수 있는 모든 사람이 봇에 DM을 보낼 수 있도록 허용합니다.

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

    조회는 실패 시 닫힘으로 처리됩니다. Discord가 `Missing Access`를 반환하거나, 멤버 조회가 실패하거나, 채널이 다른 길드에 속한 경우 DM 발신자는 권한이 없는 것으로 처리됩니다.

    채널 대상자 액세스 그룹을 사용할 때 봇에 대해 Discord Developer Portal **Server Members Intent**를 활성화하세요. DM에는 길드 멤버 상태가 포함되지 않으므로, OpenClaw는 권한 부여 시점에 Discord REST를 통해 멤버를 확인합니다.

  </Tab>

  <Tab title="길드 정책">
    길드 처리는 `channels.discord.groupPolicy`로 제어됩니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 있을 때 보안 기준선은 `allowlist`입니다.

    `allowlist` 동작:

    - 길드는 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, 슬러그 허용)
    - 선택적 발신자 허용 목록: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만). 둘 중 하나가 구성된 경우 발신자는 `users` 또는 `roles`와 일치할 때 허용됩니다
    - 직접 이름/태그 매칭은 기본적으로 비활성화되어 있습니다. 비상 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하세요
    - `users`에는 이름/태그가 지원되지만 ID가 더 안전합니다. 이름/태그 항목이 사용되면 `openclaw security audit`가 경고합니다
    - 길드에 `channels`가 구성된 경우 목록에 없는 채널은 거부됩니다
    - 길드에 `channels` 블록이 없으면 해당 허용 목록 길드의 모든 채널이 허용됩니다

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

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 생성하지 않으면, 런타임 대체값은 `channels.defaults.groupPolicy`가 `open`이더라도 `groupPolicy="allowlist"`입니다(로그에 경고가 표시됨).

  </Tab>

  <Tab title="멘션 및 그룹 DM">
    길드 메시지는 기본적으로 멘션으로 제한됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적 봇 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우의 암시적 봇 답장 동작

    아웃바운드 Discord 메시지를 작성할 때 표준 멘션 구문을 사용하세요. 사용자는 `<@USER_ID>`, 채널은 `<#CHANNEL_ID>`, 역할은 `<@&ROLE_ID>`입니다. 레거시 `<@!USER_ID>` 닉네임 멘션 형식을 사용하지 마세요.

    `requireMention`은 길드/채널별로 구성됩니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`는 봇이 아닌 다른 사용자/역할을 멘션하는 메시지를 선택적으로 삭제합니다(@everyone/@here 제외).

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - `dm.groupChannels`를 통한 선택적 허용 목록(채널 ID 또는 슬러그)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

`bindings[].match.roles`를 사용해 Discord 길드 멤버를 역할 ID별로 다른 에이전트에 라우팅하세요. 역할 기반 바인딩은 역할 ID만 허용하며 피어 또는 부모 피어 바인딩 이후, 길드 전용 바인딩 이전에 평가됩니다. 바인딩이 다른 매치 필드도 설정한 경우(예: `peer` + `guildId` + `roles`), 구성된 모든 필드가 일치해야 합니다.

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
- 권한이 없는 사용자에게도 Discord UI에서 명령이 계속 표시될 수 있습니다. 실행 시에는 여전히 OpenClaw 인증을 적용하며 "not authorized"를 반환합니다.

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

    - `off` (기본값)
    - `first`
    - `all`
    - `batched`

    참고: `off`는 암시적 답장 스레딩을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그는 계속 적용됩니다.
    `first`는 항상 해당 턴의 첫 번째 발신 Discord 메시지에 암시적 네이티브 답장 참조를 첨부합니다.
    `batched`는 수신 턴이 여러 메시지의 디바운스된 배치였을 때만 Discord의 암시적 네이티브 답장 참조를 첨부합니다. 이는 모든 단일 메시지 턴이 아니라, 주로 모호하고 짧은 시간에 몰리는 채팅에 네이티브 답장을 사용하려는 경우 유용합니다.

    메시지 ID는 컨텍스트/기록에 노출되어 에이전트가 특정 메시지를 대상으로 지정할 수 있습니다.

  </Accordion>

  <Accordion title="라이브 스트림 미리보기">
    OpenClaw는 임시 메시지를 보내고 텍스트가 도착하는 동안 이를 편집하여 초안 답장을 스트리밍할 수 있습니다. `channels.discord.streaming`은 `off` (기본값) | `partial` | `block` | `progress`를 받습니다. `progress`는 편집 가능한 상태 초안 하나를 유지하고 최종 전달 전까지 도구 진행 상황으로 업데이트합니다. `streamMode`는 기존 별칭이며 자동 마이그레이션됩니다.

    여러 봇이나 gateways가 계정을 공유할 때 Discord 미리보기 편집이 빠르게 속도 제한에 걸리므로 기본값은 `off`로 유지됩니다.

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

    - `partial`은 토큰이 도착하는 동안 단일 미리보기 메시지를 편집합니다.
    - `block`은 초안 크기의 청크를 내보냅니다(`draftChunk`를 사용해 크기와 중단 지점을 조정하며, `textChunkLimit`로 제한됨).
    - 미디어, 오류, 명시적 답장 최종 메시지는 대기 중인 미리보기 편집을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 도구/진행 상황 업데이트가 미리보기 메시지를 재사용할지 제어합니다.
    - `streaming.preview.commandText` / `streaming.progress.commandText`는 압축된 진행 상황 줄의 명령/실행 세부 정보를 제어합니다: `raw`(기본값) 또는 `status`(도구 레이블만).

    압축된 진행 상황 줄은 유지하면서 원시 명령/실행 텍스트를 숨깁니다.

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

    미리보기 스트리밍은 텍스트 전용입니다. 미디어 답장은 일반 전달로 폴백됩니다. `block` 스트리밍이 명시적으로 활성화된 경우 OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

  </Accordion>

  <Accordion title="기록, 컨텍스트 및 스레드 동작">
    길드 기록 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - 폴백: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    DM 기록 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의하지 않는 한 부모 채널 구성을 상속합니다.
    - 스레드 세션은 모델 전용 폴백으로 부모 채널의 세션 수준 `/model` 선택을 상속합니다. 스레드 로컬 `/model` 선택이 여전히 우선하며, 대화 기록 상속이 활성화되지 않는 한 부모 transcript 기록은 복사되지 않습니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)는 새 자동 스레드가 부모 transcript에서 시드를 받도록 선택합니다. 계정별 재정의는 `channels.discord.accounts.<id>.thread.inheritParent` 아래에 있습니다.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 확인할 수 있습니다.
    - `guilds.<guild>.channels.<channel>.requireMention: false`는 답장 단계 활성화 폴백 중에도 유지됩니다.

    채널 주제는 **신뢰할 수 없는** 컨텍스트로 주입됩니다. 허용 목록은 누가 에이전트를 트리거할 수 있는지를 제한하며, 완전한 보조 컨텍스트 비식별화 경계가 아닙니다.

  </Accordion>

  <Accordion title="하위 에이전트용 스레드 바인딩 세션">
    Discord는 스레드를 세션 대상에 바인딩하여 해당 스레드의 후속 메시지가 동일한 세션(하위 에이전트 세션 포함)으로 계속 라우팅되도록 할 수 있습니다.

    명령:

    - `/focus <target>` 현재/새 스레드를 하위 에이전트/세션 대상에 바인딩
    - `/unfocus` 현재 스레드 바인딩 제거
    - `/agents` 활성 실행 및 바인딩 상태 표시
    - `/session idle <duration|off>` 포커스된 바인딩의 비활성 자동 포커스 해제를 조회/업데이트
    - `/session max-age <duration|off>` 포커스된 바인딩의 강제 최대 수명을 조회/업데이트

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

    - `session.threadBindings.*`는 전역 기본값을 설정합니다.
    - `channels.discord.threadBindings.*`는 Discord 동작을 재정의합니다.
    - `spawnSessions`는 `sessions_spawn({ thread: true })` 및 ACP 스레드 생성에 대한 자동 생성/바인딩 스레드를 제어합니다. 기본값: `true`.
    - `defaultSpawnContext`는 스레드 바인딩 생성의 네이티브 하위 에이전트 컨텍스트를 제어합니다. 기본값: `"fork"`.
    - 더 이상 사용되지 않는 `spawnSubagentSessions`/`spawnAcpSessions` 키는 `openclaw doctor --fix`로 마이그레이션됩니다.
    - 계정에 대해 스레드 바인딩이 비활성화된 경우 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    [하위 에이전트](/ko/tools/subagents), [ACP 에이전트](/ko/tools/acp-agents), [구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

  </Accordion>

  <Accordion title="영구 ACP 채널 바인딩">
    안정적인 "상시 실행" ACP 작업 공간의 경우 Discord 대화를 대상으로 하는 최상위 typed ACP 바인딩을 구성하세요.

    구성 경로:

    - `type: "acp"` 및 `match.channel: "discord"`가 있는 `bindings[]`

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

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 제자리에서 바인딩하고 이후 메시지를 동일한 ACP 세션에 유지합니다. 스레드 메시지는 부모 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new` 및 `/reset`은 동일한 ACP 세션을 제자리에서 재설정합니다. 임시 스레드 바인딩은 활성 상태인 동안 대상 확인을 재정의할 수 있습니다.
    - `spawnSessions`는 `--thread auto|here`를 통한 자식 스레드 생성/바인딩을 제한합니다.

    바인딩 동작 세부 정보는 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

  </Accordion>

  <Accordion title="반응 알림">
    길드별 반응 알림 모드:

    - `off`
    - `own` (기본값)
    - `all`
    - `allowlist`(`guilds.<id>.users` 사용)

    반응 이벤트는 시스템 이벤트로 변환되어 라우팅된 Discord 세션에 첨부됩니다.

  </Accordion>

  <Accordion title="Ack 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    확인 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 폴백(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Discord는 유니코드 이모지 또는 사용자 지정 이모지 이름을 허용합니다.
    - 채널 또는 계정의 반응을 비활성화하려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="구성 쓰기">
    채널에서 시작되는 구성 쓰기는 기본적으로 활성화됩니다.

    이는 `/config set|unset` 흐름(명령 기능이 활성화된 경우)에 영향을 줍니다.

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
    `channels.discord.proxy`를 사용해 Discord gateway WebSocket 트래픽과 시작 시 REST 조회(애플리케이션 ID + 허용 목록 확인)를 HTTP(S) 프록시를 통해 라우팅합니다.

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
    프록시된 메시지를 시스템 멤버 ID에 매핑하려면 PluralKit 확인을 활성화하세요.

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
    - 멤버 표시 이름은 `channels.discord.dangerouslyAllowNameMatching: true`일 때만 이름/슬러그로 일치됩니다.
    - 조회는 원본 메시지 ID를 사용하며 시간 창으로 제한됩니다.
    - 조회가 실패하면 프록시된 메시지는 봇 메시지로 처리되어 `allowBots=true`가 아닌 한 삭제됩니다.

  </Accordion>

  <Accordion title="발신 멘션 별칭">
    에이전트가 알려진 Discord 사용자에 대해 결정적인 발신 멘션이 필요할 때 `mentionAliases`를 사용하세요. 키는 앞의 `@`가 없는 핸들이며, 값은 Discord 사용자 ID입니다. 알 수 없는 핸들, `@everyone`, `@here`, Markdown 코드 스팬 안의 멘션은 변경되지 않습니다.

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

  <Accordion title="Presence 구성">
    상태 또는 활동 필드를 설정하거나 자동 presence를 활성화하면 presence 업데이트가 적용됩니다.

    상태만 사용하는 예시:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    활동 예시(사용자 지정 상태가 기본 활동 유형):

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

    활동 유형 맵:

    - 0: 플레이 중
    - 1: 스트리밍 중(`activityUrl` 필요)
    - 2: 듣는 중
    - 3: 시청 중
    - 4: 사용자 지정(활동 텍스트를 상태 값으로 사용, 이모지는 선택 사항)
    - 5: 경쟁 중

    자동 presence 예시(런타임 상태 신호):

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

    자동 presence는 런타임 가용성을 Discord 상태에 매핑합니다. healthy => online, degraded 또는 unknown => idle, exhausted 또는 unavailable => dnd. 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` placeholder 지원)

  </Accordion>

  <Accordion title="Discord의 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 원래 채널에 승인 프롬프트를 게시할 수 있습니다.

    Config 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (선택 사항; 가능한 경우 `commands.ownerAllowFrom`으로 fallback)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord는 `enabled`가 설정되지 않았거나 `"auto"`이고 `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 하나 이상의 승인자를 확인할 수 있으면 native exec approvals를 자동으로 활성화합니다. Discord는 channel `allowFrom`, legacy `dm.allowFrom` 또는 direct-message `defaultTo`에서 exec 승인자를 추론하지 않습니다. Discord를 native approval 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.

    `/diagnostics` 및 `/export-trajectory` 같은 민감한 owner-only group 명령의 경우 OpenClaw는 승인 프롬프트와 최종 결과를 비공개로 보냅니다. 호출한 owner에게 Discord owner route가 있으면 먼저 Discord DM을 시도합니다. 사용할 수 없으면 Telegram 같은 `commands.ownerAllowFrom`의 첫 번째 사용 가능한 owner route로 fallback합니다.

    `target`이 `channel` 또는 `both`이면 승인 프롬프트가 채널에 표시됩니다. 확인된 승인자만 버튼을 사용할 수 있으며, 다른 사용자는 ephemeral 거부를 받습니다. 승인 프롬프트에는 명령 텍스트가 포함되므로 신뢰할 수 있는 채널에서만 채널 전달을 활성화하세요. 세션 키에서 채널 ID를 파생할 수 없으면 OpenClaw는 DM 전달로 fallback합니다.

    Discord는 다른 chat channel에서 사용하는 공유 승인 버튼도 렌더링합니다. native Discord adapter는 주로 승인자 DM routing과 channel fanout을 추가합니다.
    이러한 버튼이 있으면 기본 승인 UX가 됩니다. OpenClaw는
    tool 결과에서 chat approvals를 사용할 수 없거나 수동 승인이 유일한 경로라고 할 때만 수동 `/approve` 명령을 포함해야 합니다.
    Discord native approval runtime이 활성 상태가 아니면 OpenClaw는
    local deterministic `/approve <id> <decision>` 프롬프트를 계속 표시합니다. runtime은 활성 상태지만 native card를 어떤 target에도 전달할 수 없으면
    OpenClaw는 pending approval의 정확한 `/approve`
    명령이 포함된 same-chat fallback notice를 보냅니다.

    Gateway auth와 승인 확인은 공유 Gateway client contract를 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해 확인되고, 다른 ID는 `exec.approval.resolve`를 통해 확인됨). 승인은 기본적으로 30분 후 만료됩니다.

    [Exec approvals](/ko/tools/exec-approvals)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 도구 및 작업 게이트

Discord 메시지 작업에는 messaging, channel admin, moderation, presence, metadata 작업이 포함됩니다.

핵심 예시:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` 작업은 scheduled event cover image를 설정하기 위해 선택적 `image` 매개변수(URL 또는 local file path)를 허용합니다.

Action gates는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| 작업 그룹                                                                                                                                                             | 기본값  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 활성화됨  |
| roles                                                                                                                                                                    | 비활성화됨 |
| moderation                                                                                                                                                               | 비활성화됨 |
| presence                                                                                                                                                                 | 비활성화됨 |

## Components v2 UI

OpenClaw는 exec approvals와 cross-context markers에 Discord components v2를 사용합니다. Discord 메시지 작업은 custom UI를 위해 `components`도 허용할 수 있습니다(고급; discord tool을 통해 component payload를 구성해야 함). legacy `embeds`는 계속 사용할 수 있지만 권장되지 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord component container에서 사용하는 accent color를 설정합니다(hex).
- `channels.discord.accounts.<id>.ui.components.accentColor`로 account별로 설정합니다.
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

Discord에는 두 가지 별도의 음성 표면이 있습니다. realtime **voice channels**(연속 대화)와 **voice message attachments**(waveform preview 형식)입니다. Gateway는 둘 다 지원합니다.

### 음성 채널

설정 체크리스트:

1. Discord Developer Portal에서 Message Content Intent를 활성화합니다.
2. role/user allowlists를 사용할 때 Server Members Intent를 활성화합니다.
3. `bot` 및 `applications.commands` scope로 bot을 초대합니다.
4. 대상 voice channel에서 Connect, Speak, Send Messages, Read Message History를 부여합니다.
5. native commands(`commands.native` 또는 `channels.discord.commands.native`)를 활성화합니다.
6. `channels.discord.voice`를 구성합니다.

세션을 제어하려면 `/vc join|leave|status`를 사용하세요. 이 명령은 account default agent를 사용하며 다른 Discord 명령과 동일한 allowlist 및 group policy 규칙을 따릅니다.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Auto-join 예시:

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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- `voice.model`은 Discord voice channel 응답에 사용되는 LLM만 재정의합니다. routed agent model을 상속하려면 설정하지 않은 상태로 두세요.
- STT는 `tools.media.audio`를 사용합니다. `voice.model`은 transcription에 영향을 주지 않습니다.
- channel별 Discord `systemPrompt` 재정의는 해당 voice channel의 voice transcript turns에 적용됩니다.
- Voice transcript turns는 Discord `allowFrom`(또는 `dm.allowFrom`)에서 owner status를 파생합니다. non-owner speaker는 owner-only tools(예: `gateway` 및 `cron`)에 접근할 수 없습니다.
- Discord voice는 text-only config에서는 opt-in입니다. `/vc` 명령, voice runtime 및 `GuildVoiceStates` gateway intent를 활성화하려면 `channels.discord.voice.enabled=true`를 설정하세요(또는 기존 `channels.discord.voice` block을 유지하세요).
- `channels.discord.intents.voiceStates`는 voice-state intent subscription을 명시적으로 재정의할 수 있습니다. effective voice enablement를 따르게 하려면 설정하지 않은 상태로 두세요.
- `voice.daveEncryption` 및 `voice.decryptionFailureTolerance`는 `@discordjs/voice` join options로 전달됩니다.
- `@discordjs/voice` 기본값은 설정하지 않은 경우 `daveEncryption=true` 및 `decryptionFailureTolerance=24`입니다.
- `voice.connectTimeoutMs`는 `/vc join` 및 auto-join 시도의 초기 `@discordjs/voice` Ready 대기를 제어합니다. 기본값: `30000`.
- `voice.reconnectGraceMs`는 연결이 끊긴 voice session이 재연결을 시작하기 전까지 OpenClaw가 기다리는 시간을 제어하며, 이 시간이 지나면 세션을 종료합니다. 기본값: `15000`.
- OpenClaw는 receive decrypt failures도 감시하며, 짧은 시간 내 반복 실패가 발생하면 voice channel을 나갔다가 다시 참여하여 자동 복구합니다.
- 업데이트 후 receive logs에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복적으로 표시되면 dependency report와 logs를 수집하세요. 번들된 `@discordjs/voice` line에는 discord.js issue #11419를 닫은 discord.js PR #11449의 upstream padding fix가 포함되어 있습니다.

Voice channel pipeline:

- Discord PCM capture가 WAV temp file로 변환됩니다.
- `tools.media.audio`가 STT를 처리합니다. 예: `openai/gpt-4o-mini-transcribe`.
- transcript는 Discord ingress 및 routing을 통해 전송되고, 응답 LLM은 agent `tts` tool을 숨기고 반환 텍스트를 요청하는 voice-output policy로 실행됩니다. 최종 TTS playback은 Discord voice가 소유하기 때문입니다.
- `voice.model`이 설정되면 이 voice-channel turn의 response LLM만 재정의합니다.
- `voice.tts`는 `messages.tts` 위에 병합되며, 결과 audio가 joined channel에서 재생됩니다.

Credentials는 component별로 확인됩니다. `voice.model`의 LLM route auth, `tools.media.audio`의 STT auth, `messages.tts`/`voice.tts`의 TTS auth입니다.

### 음성 메시지

Discord voice messages는 waveform preview를 표시하며 OGG/Opus audio가 필요합니다. OpenClaw는 waveform을 자동으로 생성하지만, inspect 및 convert를 위해 gateway host에 `ffmpeg`와 `ffprobe`가 필요합니다.

- **local file path**를 제공하세요(URL은 거부됨).
- text content를 생략하세요(Discord는 같은 payload에서 text + voice message를 거부함).
- 모든 audio format이 허용됩니다. OpenClaw는 필요에 따라 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="허용되지 않은 intents를 사용했거나 bot이 guild messages를 보지 못함">

    - Message Content Intent를 활성화합니다
    - user/member resolution에 의존하는 경우 Server Members Intent를 활성화합니다
    - intents를 변경한 후 gateway를 재시작합니다

  </Accordion>

  <Accordion title="Guild messages가 예기치 않게 차단됨">

    - `groupPolicy`를 확인합니다
    - `channels.discord.guilds` 아래의 guild allowlist를 확인합니다
    - guild `channels` map이 있으면 나열된 channels만 허용됩니다
    - `requireMention` 동작과 mention patterns를 확인합니다

    유용한 확인:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention이 false지만 여전히 차단됨">
    일반적인 원인:

    - 일치하는 guild/channel allowlist 없이 `groupPolicy="allowlist"`가 설정됨
    - `requireMention`이 잘못된 위치에 구성됨(`channels.discord.guilds` 또는 channel entry 아래에 있어야 함)
    - sender가 guild/channel `users` allowlist에 의해 차단됨

  </Accordion>

  <Accordion title="장시간 실행되는 Discord turns 또는 중복 replies">

    일반적인 logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway queue knobs:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 이는 Discord gateway listener work만 제어하며 agent turn lifetime은 제어하지 않습니다

    Discord는 queued agent turns에 channel-owned timeout을 적용하지 않습니다. Message listeners는 즉시 hand off하며, queued Discord runs는 session/tool/runtime lifecycle이 완료되거나 작업을 abort할 때까지 per-session ordering을 보존합니다.

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

  <Accordion title="Gateway 메타데이터 조회 시간 초과 경고">
    OpenClaw는 연결하기 전에 Discord `/gateway/bot` 메타데이터를 가져옵니다. 일시적인 실패는 Discord의 기본 Gateway URL로 대체되며 로그에서 속도 제한됩니다.

    메타데이터 시간 초과 조정값:

    - 단일 계정: `channels.discord.gatewayInfoTimeoutMs`
    - 다중 계정: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 설정이 지정되지 않은 경우 env 대체값: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 기본값: `30000`(30초), 최대: `120000`

  </Accordion>

  <Accordion title="Gateway READY 시간 초과 재시작">
    OpenClaw는 시작 중과 런타임 재연결 후 Discord의 Gateway `READY` 이벤트를 기다립니다. 시작 시차가 있는 다중 계정 설정은 기본값보다 더 긴 시작 READY 창이 필요할 수 있습니다.

    READY 시간 초과 조정값:

    - 시작 단일 계정: `channels.discord.gatewayReadyTimeoutMs`
    - 시작 다중 계정: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 설정이 지정되지 않은 경우 시작 env 대체값: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 시작 기본값: `15000`(15초), 최대: `120000`
    - 런타임 단일 계정: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 런타임 다중 계정: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 설정이 지정되지 않은 경우 런타임 env 대체값: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 런타임 기본값: `30000`(30초), 최대: `120000`

  </Accordion>

  <Accordion title="권한 감사 불일치">
    `channels status --probe` 권한 검사는 숫자 채널 ID에 대해서만 작동합니다.

    슬러그 키를 사용하는 경우에도 런타임 매칭은 계속 작동할 수 있지만, 프로브가 권한을 완전히 검증할 수는 없습니다.

  </Accordion>

  <Accordion title="DM 및 페어링 문제">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"`(레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인 대기 중

  </Accordion>

  <Accordion title="봇 간 루프">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`를 설정한 경우 루프 동작을 피하려면 엄격한 멘션 및 허용 목록 규칙을 사용하세요.
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

    - Discord 음성 수신 복구 로직이 포함되도록 OpenClaw를 최신 상태로 유지하세요(`openclaw update`)
    - `channels.discord.voice.daveEncryption=true`(기본값)인지 확인하세요
    - `channels.discord.voice.decryptionFailureTolerance=24`(업스트림 기본값)에서 시작하고 필요한 경우에만 조정하세요
    - 다음 로그를 확인하세요:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참여 후에도 실패가 계속되면 로그를 수집하고 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 및 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)의 업스트림 DAVE 수신 이력과 비교하세요

  </Accordion>
</AccordionGroup>

## 설정 참조

기본 참조: [설정 참조 - Discord](/ko/gateway/config-channels#discord).

<Accordion title="신호가 높은 Discord 필드">

- 시작/인증: `enabled`, `token`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 이벤트 큐: `eventQueue.listenerTimeout`(리스너 예산), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 응답/기록: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전달: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 스트리밍: `streaming`(레거시 별칭: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 미디어/재시도: `mediaMaxMb`(발신 Discord 업로드 제한, 기본값 `100MB`), `retry`
- 작업: `actions.*`
- 프레즌스: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]`(`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 안전 및 운영

- 봇 토큰은 비밀로 취급하세요(감독 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- 최소 권한 Discord 권한을 부여하세요.
- 명령 배포/상태가 오래된 경우 Gateway를 재시작하고 `openclaw channels status --probe`로 다시 확인하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord 사용자를 Gateway에 페어링합니다.
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
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    길드와 채널을 에이전트에 매핑합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작입니다.
  </Card>
</CardGroup>
