---
read_when:
    - Discord 채널 기능 작업하기
summary: Discord 봇 설정, 구성 키, 구성 요소, 음성 및 문제 해결
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령어 동작과 명령어 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 전반의 진단 및 복구 절차입니다.
  </Card>
</CardGroup>

## 빠른 설정

봇이 포함된 Discord 애플리케이션을 만들고, 봇을 서버에 추가한 다음 OpenClaw과 페어링합니다. 가능하면 비공개 서버를 사용하십시오. 필요한 경우 먼저 [서버를 만드십시오](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)(**Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord 애플리케이션과 봇 만들기">
    [Discord Developer Portal](https://discord.com/developers/applications)에서 **New Application**을 클릭하고 이름을 지정합니다(예: "OpenClaw").

    사이드바에서 **Bot**을 열고 **Username**을 에이전트 이름으로 설정합니다.

  </Step>

  <Step title="권한 있는 인텐트 활성화">
    계속해서 **Bot** 페이지의 **Privileged Gateway Intents**에서 다음을 활성화합니다.

    - **Message Content Intent**(필수)
    - **Server Members Intent**(권장, 역할 허용 목록, 이름과 ID 간 매칭 및 채널 대상 접근 그룹에 필요)
    - **Presence Intent**(선택 사항, 프레즌스 업데이트에만 사용)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지에서 **Reset Token**을 클릭하고 토큰을 복사합니다.

    <Note>
    이름과 달리 첫 번째 토큰을 생성하는 것이며, 실제로 "재설정"되는 것은 없습니다.
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
      - Add Reactions (optional)

    이는 일반 텍스트 채널에 필요한 기본 권한입니다. 포럼 또는 미디어 채널에서 스레드를 만들거나 이어 가는 워크플로를 포함하여 봇이 스레드에 게시한다면 **Send Messages in Threads**도 활성화합니다.

    생성된 URL을 복사하여 브라우저에서 열고 서버를 선택한 다음 **Continue**를 클릭합니다. 이제 봇이 서버에 표시됩니다.

  </Step>

  <Step title="Developer Mode를 활성화하고 ID 수집">
    ID를 복사할 수 있도록 Discord 앱에서 Developer Mode를 활성화합니다.

    1. **User Settings**(톱니바퀴 아이콘) → **Developer** → **Developer Mode** 활성화
       *(모바일: **App Settings** → **Advanced**)*
    2. **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Copy Server ID**
    3. **본인 아바타**를 마우스 오른쪽 버튼으로 클릭 → **Copy User ID**

    봇 토큰과 함께 Server ID 및 User ID를 보관하십시오. 다음 단계에서 세 가지가 모두 필요합니다.

  </Step>

  <Step title="서버 구성원의 DM 허용">
    페어링이 작동하려면 Discord에서 봇이 사용자에게 DM을 보낼 수 있어야 합니다. **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Privacy Settings** → **Direct Messages**를 활성화합니다.

    OpenClaw과 함께 Discord DM을 사용한다면 계속 활성화해 두십시오. 길드 채널만 사용한다면 페어링 후 비활성화할 수 있습니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정(채팅으로 보내지 마십시오)">
    봇 토큰은 비밀 정보입니다. 에이전트에게 메시지를 보내기 전에 OpenClaw을 실행하는 머신에서 토큰을 설정합니다.

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

    OpenClaw이 이미 백그라운드 서비스로 실행 중이라면 OpenClaw Mac 앱을 통해 다시 시작하거나 `openclaw gateway run` 프로세스를 중지한 후 다시 시작합니다.
    관리형 서비스 설치의 경우 `DISCORD_BOT_TOKEN`이 설정된 셸에서 `openclaw gateway install`을 실행하거나, 재시작 후 서비스가 환경 변수 SecretRef를 확인할 수 있도록 변수를 `~/.openclaw/.env`에 저장합니다.
    호스트가 Discord의 시작 시 애플리케이션 조회에 의해 차단되거나 요청 속도가 제한되는 경우, 시작 시 해당 REST 호출을 건너뛸 수 있도록 Developer Portal의 애플리케이션/클라이언트 ID를 설정합니다. 기본 계정에는 `channels.discord.applicationId`를 사용하고, 봇별로는 `channels.discord.accounts.<accountId>.applicationId`를 사용합니다.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 채팅하며 다음과 같이 요청합니다. Discord가 첫 번째 채널이라면 대신 CLI / 구성 탭을 사용하십시오.

        > "Discord 봇 토큰은 이미 구성에 설정했습니다. User ID `<user_id>`와 Server ID `<server_id>`를 사용해 Discord 설정을 완료해 주세요."
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

        기본 계정의 환경 변수 대체 경로:

```bash
DISCORD_BOT_TOKEN=...
```

        스크립트 방식 또는 원격 설정의 경우 동일한 JSON5 블록을 작성하고 `openclaw config patch --file ./discord.patch.json5 --dry-run`을 실행한 다음, `--dry-run` 없이 다시 실행합니다. 일반 텍스트 `token` 문자열도 사용할 수 있으며, env/file/exec 제공자 전반에서 `channels.discord.token`에 SecretRef 값을 사용할 수 있습니다. [비밀 관리](/ko/gateway/secrets)를 참조하십시오.

        여러 Discord 봇을 사용하는 경우 각 봇 토큰과 애플리케이션 ID를 해당 계정 아래에 유지하십시오. 최상위 `channels.discord.applicationId`는 계정에 상속되므로 모든 계정이 동일한 애플리케이션 ID를 사용할 때만 그 위치에 설정하십시오.

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
    Gateway가 실행되면 Discord에서 봇에 DM을 보내십시오. 봇이 페어링 코드로 응답합니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널에서 에이전트에게 페어링 코드를 보내십시오.

        > "이 Discord 페어링 코드를 승인해 줘: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    페어링 코드는 1시간 후 만료됩니다. 승인한 후 Discord DM에서 에이전트와 대화하십시오.

  </Step>
</Steps>

<Note>
토큰 확인은 계정을 인식합니다. 구성의 토큰 값이 환경 변수 폴백보다 우선하며, `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
활성화된 두 Discord 계정이 동일한 봇 토큰으로 확인되면 OpenClaw는 해당 토큰에 대해 하나의 Gateway 모니터만 시작합니다. 구성에서 가져온 토큰이 환경 변수 폴백보다 우선합니다. 그 외에는 먼저 활성화된 계정이 우선하며, 중복 계정은 `duplicate bot token` 사유와 함께 비활성화된 것으로 보고됩니다.
고급 아웃바운드 호출(메시지 도구/채널 작업)의 경우 호출별로 명시된 `token`이 해당 호출에 사용됩니다. 이는 전송 및 읽기/프로브 방식 작업(read/search/fetch/thread/pins/permissions)에 적용됩니다. 계정 정책/재시도 설정은 활성 런타임 스냅샷에서 선택된 계정으로부터 계속 가져옵니다.
</Note>

## 권장: 길드 작업 공간 설정

DM이 작동하면 서버를 각 채널이 자체 컨텍스트를 가진 별도의 에이전트 세션을 사용하는 완전한 작업 공간으로 전환할 수 있습니다. 본인과 봇만 있는 비공개 서버에 권장합니다.

<Steps>
  <Step title="서버를 길드 허용 목록에 추가">
    이렇게 하면 에이전트가 DM뿐만 아니라 서버의 모든 채널에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 Discord 서버 ID `<server_id>`를 길드 허용 목록에 추가해 줘"
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
    기본적으로 에이전트는 길드 채널에서 @멘션된 경우에만 응답합니다. 비공개 서버에서는 모든 메시지에 응답하도록 설정하는 것이 일반적으로 적합합니다.

    길드 채널에서는 기본적으로 일반 응답이 자동 게시됩니다. 항상 활성화된 공유 공간에서는 `messages.groupChat.visibleReplies: "message_tool"`을 선택적으로 설정하여 에이전트가 조용히 관찰하다가 채널 응답이 유용하다고 판단할 때만 게시하도록 할 수 있습니다. 이 기능은 GPT-5.6 Sol과 같은 최신 세대의 도구 신뢰성이 높은 모델에서 가장 잘 작동합니다. 도구가 전송하지 않는 한 주변 공간 이벤트는 조용히 유지됩니다. 전체 관찰 모드 구성은 [주변 공간 이벤트](/ko/channels/ambient-room-events)를 참조하십시오.

    Discord에 입력 중 표시가 나타나고 로그에는 토큰 사용량이 표시되지만 메시지가 게시되지 않는 경우, 해당 턴이 주변 공간 이벤트로 구성되었거나 메시지 도구 기반의 표시 응답을 사용하도록 설정되었는지 확인하십시오.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 에이전트가 이 서버에서 @멘션되지 않아도 응답하도록 허용해 줘"
      </Tab>
      <Tab title="구성">
        길드 구성에서 `requireMention: false`를 설정하십시오.

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

        표시되는 그룹/채널 응답에 메시지 도구를 통한 전송을 요구하려면 `messages.groupChat.visibleReplies: "message_tool"`을 설정하십시오.

      </Tab>
    </Tabs>

  </Step>

  <Step title="길드 채널의 메모리 사용 계획">
    장기 메모리(MEMORY.md)는 DM 세션에서만 자동으로 로드되며, 길드 채널에서는 로드되지 않습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "Discord 채널에서 내가 질문할 때 MEMORY.md의 장기 컨텍스트가 필요하면 memory_search 또는 memory_get을 사용해 줘."
      </Tab>
      <Tab title="수동">
        모든 채널에서 공유할 컨텍스트는 `AGENTS.md` 또는 `USER.md`에 안정적인 지침으로 작성하십시오(모든 세션에 삽입됨). 장기 메모는 `MEMORY.md`에 유지하고 필요할 때 메모리 도구로 접근하십시오.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 채널을 만들고 대화를 시작하십시오. 에이전트는 채널 이름을 확인할 수 있으며 각 채널은 격리된 세션입니다. 워크플로에 맞게 `#coding`, `#home`, `#research` 등의 채널을 설정하십시오.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 응답 라우팅은 결정적입니다. Discord에서 수신된 메시지에 대한 응답은 Discord로 돌아갑니다.
- Discord 길드/채널 메타데이터는 사용자에게 표시되는 응답 접두사가 아니라 신뢰할 수 없는 컨텍스트로 모델 프롬프트에 추가됩니다. 모델이 해당 엔벌로프를 응답에 다시 복사하면 OpenClaw는 아웃바운드 응답과 향후 재생 컨텍스트에서 복사된 메타데이터를 제거합니다.
- 기본적으로(`session.dmScope=main`) 직접 채팅은 에이전트의 기본 세션(`agent:main:main`)을 공유합니다.
- 길드 채널은 격리된 세션 키(`agent:<agentId>:discord:channel:<channelId>`)를 사용합니다.
- 그룹 DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 네이티브 슬래시 명령은 격리된 명령 세션(`agent:<agentId>:discord:slash:<userId>`)에서 실행되지만, 라우팅된 대화 세션으로 연결되는 `CommandTargetSessionKey`도 계속 전달합니다.
- Discord로 전달되는 텍스트 전용 Cron/Heartbeat 알림은 어시스턴트에게 표시되는 최종 답변으로 축약되어 한 번만 전송됩니다. 에이전트가 전달 가능한 페이로드를 여러 개 생성하면 미디어 및 구조화된 컴포넌트 페이로드는 여러 메시지로 유지됩니다.

## 포럼 채널

Discord 포럼 및 미디어 채널은 스레드 게시물만 허용합니다. OpenClaw는 이를 생성하는 두 가지 방법을 지원합니다.

- 포럼 상위 채널(`channel:<forumId>`)에 메시지를 보내 스레드를 자동으로 생성합니다. 스레드 제목은 메시지의 첫 번째 비어 있지 않은 줄입니다(Discord의 스레드 이름 제한인 100자로 잘림).
- `openclaw message thread create`를 사용하여 스레드를 직접 생성합니다. 포럼 채널에는 `--message-id`를 전달하지 마십시오.

스레드를 생성하려면 포럼 상위 채널로 전송하십시오.

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "주제 제목\n게시물 본문"
```

포럼 스레드를 명시적으로 생성합니다.

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "주제 제목" --message "게시물 본문"
```

포럼 상위 채널은 Discord 컴포넌트를 허용하지 않습니다. 컴포넌트가 필요하면 스레드 자체(`channel:<threadId>`)로 보내십시오.

## 대화형 컴포넌트

OpenClaw는 에이전트 메시지에 Discord 컴포넌트 v2 컨테이너를 지원합니다. `components` 페이로드와 함께 메시지 도구를 사용하십시오. 상호작용 결과는 일반 수신 메시지로 에이전트에 다시 라우팅되며 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 작업 행에는 버튼을 최대 5개 또는 선택 메뉴 하나를 배치할 수 있습니다.
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 컴포넌트는 한 번만 사용할 수 있습니다. 버튼, 선택 메뉴, 양식을 만료될 때까지 여러 번 사용할 수 있게 하려면 `components.reusable=true`로 설정하십시오.

버튼을 클릭할 수 있는 사용자를 제한하려면 해당 버튼에 `allowedUsers`를 설정하십시오(Discord 사용자 ID, 태그 또는 `*`). 일치하지 않는 사용자에게는 본인에게만 표시되는 거부 메시지가 전송됩니다.

컴포넌트 콜백은 기본적으로 30분 후 만료됩니다. 기본 계정의 콜백 레지스트리 수명을 변경하려면 `channels.discord.agentComponents.ttlMs`를 설정하고, 계정별로 변경하려면 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`를 설정하십시오. 값은 밀리초 단위의 양의 정수여야 하며 `86400000`(24시간)으로 제한됩니다. 더 긴 TTL은 버튼을 계속 사용할 수 있어야 하는 검토/승인 워크플로에 적합하지만, 오래된 Discord 메시지가 여전히 작업을 트리거할 수 있는 기간도 늘어납니다. 요구 사항을 충족하는 가장 짧은 TTL을 사용하고, 오래된 콜백이 예기치 않은 동작을 일으킬 수 있다면 기본값을 유지하십시오.

`/model` 및 `/models` 슬래시 명령은 제공자, 모델, 호환 런타임 드롭다운과 Submit 단계가 있는 대화형 모델 선택기를 엽니다. `/models add`는 더 이상 권장되지 않으며 채팅에서 모델을 등록하는 대신 지원 중단 메시지를 반환합니다. 선택기 응답은 호출한 사용자에게만 표시되며 해당 사용자만 사용할 수 있습니다. Discord 선택 메뉴는 옵션이 25개로 제한되므로, 선택기에서 `openai` 또는 `vllm` 같은 선택된 제공자에 대해서만 동적으로 검색된 모델을 표시하려면 `agents.defaults.models`에 `provider/*` 항목을 추가하십시오.

파일 첨부:

- `file` 블록은 첨부 파일 참조(`attachment://<filename>`)를 가리켜야 합니다.
- `media`/`path`/`filePath`를 통해 첨부 파일을 제공하십시오(단일 파일). 여러 파일에는 `media-gallery`를 사용하십시오.
- 업로드 이름이 첨부 파일 참조와 일치해야 하는 경우 `filename`을 사용하여 재정의하십시오.

모달 양식:

- 최대 5개의 필드가 있는 `components.modal`을 추가하십시오.
- 필드 유형: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw는 트리거 버튼을 자동으로 추가합니다.

예시:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "선택적 대체 텍스트",
  components: {
    reusable: true,
    text: "경로를 선택하십시오",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "승인",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "거부", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "옵션을 선택하십시오",
          options: [
            { label: "옵션 A", value: "a" },
            { label: "옵션 B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "세부 정보",
      triggerLabel: "양식 열기",
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

## 접근 제어 및 라우팅

<Tabs>
  <Tab title="DM 정책">
    `channels.discord.dmPolicy`는 DM 접근을 제어합니다. `channels.discord.allowFrom`은 표준 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`(`allowFrom` 발신자가 하나 이상 필요)
    - `open`(`channels.discord.allowFrom`에 `"*"`를 포함해야 함)
    - `disabled`

    DM 정책이 공개 상태가 아니면 알 수 없는 사용자는 차단됩니다(`pairing` 모드에서는 페어링 안내가 표시됨).

    다중 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 단일 계정에서는 `allowFrom`이 레거시 `dm.allowFrom`보다 우선합니다.
    - 이름이 지정된 계정은 자체 `allowFrom`과 레거시 `dm.allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 이름이 지정된 계정은 `channels.discord.accounts.default.allowFrom`을 상속하지 않습니다.

    호환성을 위해 레거시 `channels.discord.dm.policy` 및 `channels.discord.dm.allowFrom`도 계속 읽습니다. 접근 권한을 변경하지 않고 마이그레이션할 수 있으면 `openclaw doctor --fix`가 이를 `dmPolicy` 및 `allowFrom`으로 마이그레이션합니다.

    전송을 위한 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    채널 기본값이 활성화된 경우 숫자로만 된 ID는 일반적으로 채널 ID로 해석되지만, 계정의 유효 DM `allowFrom`에 나열된 ID는 호환성을 위해 사용자 DM 대상으로 처리됩니다.

  </Tab>

  <Tab title="접근 그룹">
    Discord DM과 텍스트 명령 권한 부여에서는 `channels.discord.allowFrom`의 동적 `accessGroup:<name>` 항목을 사용할 수 있습니다.

    접근 그룹 이름은 메시지 채널 전체에서 공유됩니다. 구성원이 각 채널의 일반 `allowFrom` 구문으로 표현되는 정적 그룹에는 `type: "message.senders"`를 사용하고, Discord 채널의 현재 `ViewChannel` 대상 사용자가 동적으로 구성원을 정의해야 할 때는 `type: "discord.channelAudience"`를 사용하십시오. 공유 접근 그룹 동작: [접근 그룹](/ko/channels/access-groups).

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

    Discord 텍스트 채널에는 별도의 구성원 목록이 없습니다. `type: "discord.channelAudience"`는 다음과 같이 구성원 자격을 모델링합니다. DM 발신자가 구성된 길드의 구성원이며, 역할 및 채널 덮어쓰기가 적용된 후 현재 구성된 채널에 대한 유효 `ViewChannel` 권한을 보유해야 합니다.

    예시: `#maintainers`를 볼 수 있는 모든 사용자가 봇에 DM을 보낼 수 있게 하되, 그 외 모든 사용자에게는 DM을 닫아 둡니다.

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

    조회가 실패하면 접근을 거부합니다. Discord가 `Missing Access`를 반환하거나, 구성원 조회가 실패하거나, 채널이 다른 길드에 속한 경우 DM 발신자는 권한이 없는 것으로 처리됩니다.

    채널 대상 접근 그룹을 사용할 때 Discord Developer Portal의 **Server Members Intent**를 활성화하십시오. DM에는 길드 구성원 상태가 포함되지 않으므로 OpenClaw는 권한 부여 시 Discord REST를 통해 구성원을 확인합니다.

  </Tab>

  <Tab title="길드 정책">
    길드 처리는 `channels.discord.groupPolicy`로 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 존재할 때 안전한 기준값은 `allowlist`입니다.

    `allowlist` 동작:

    - 길드가 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, 슬러그도 허용).
    - 선택적 발신자 허용 목록: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만 허용). 둘 중 하나라도 구성되어 있으면 발신자가 `users` 또는 `roles`와 일치할 때 허용됩니다.
    - 직접적인 이름/태그 일치는 기본적으로 비활성화되어 있습니다. 비상 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하십시오.
    - `users`에는 이름/태그가 지원되지만 ID가 더 안전합니다. 이름/태그 항목을 사용하면 `openclaw security audit`가 경고합니다.
    - 길드에 `channels`가 구성되어 있으면 목록에 없는 채널은 거부됩니다.
    - 길드에 `channels` 블록이 없으면 허용 목록에 있는 해당 길드의 모든 채널이 허용됩니다.

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

    레거시 채널별 `allow` 키는 `openclaw doctor --fix`에 의해 `enabled`로 마이그레이션됩니다.

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 생성하지 않으면 `channels.defaults.groupPolicy`가 `open`이더라도 런타임 대체값은 `groupPolicy="allowlist"`입니다(로그에 경고가 표시됨).

  </Tab>

  <Tab title="멘션 및 그룹 DM">
    길드 메시지는 기본적으로 멘션이 있어야 처리됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적인 봇 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 대체값 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우 암시적인 봇 답장 동작

    Discord 발신 메시지를 작성할 때 표준 멘션 구문을 사용하십시오. 사용자는 `<@USER_ID>`, 채널은 `<#CHANNEL_ID>`, 역할은 `<@&ROLE_ID>`입니다. 레거시 `<@!USER_ID>` 닉네임 멘션 형식을 사용하지 마십시오.

    `requireMention`은 길드/채널별로 구성합니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`는 선택적으로 다른 사용자/역할을 멘션하지만 봇은 멘션하지 않은 메시지를 삭제합니다(@everyone/@here 제외).

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - `dm.groupChannels`를 통한 선택적 허용 목록(채널 ID 또는 슬러그)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

`bindings[].match.roles`를 사용하여 Discord 길드 구성원을 역할 ID에 따라 서로 다른 에이전트로 라우팅하십시오. 역할 기반 바인딩은 역할 ID만 허용하며 피어 또는 상위 피어 바인딩 이후, 길드 전용 바인딩 이전에 평가됩니다. 바인딩에서 다른 일치 필드도 설정한 경우(예: `peer` + `guildId` + `roles`) 구성된 모든 필드가 일치해야 합니다.

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
  - 네이티브 명령 인증에는 일반 메시지 처리와 동일한 Discord 허용 목록/정책이 사용됩니다.
  - 권한이 없는 사용자에게도 Discord UI에 명령이 표시될 수 있지만, 실행 시 OpenClaw 인증이 적용되며 "권한이 없습니다"라고 응답합니다.
  - 기본 슬래시 명령 설정: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

  명령 카탈로그와 동작은 [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

  ## 기능 세부 정보

  <AccordionGroup>
  <Accordion title="응답 태그 및 네이티브 응답">
    Discord는 에이전트 출력에서 응답 태그를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode`로 제어합니다.

    - `off` (기본값): 암시적 응답 스레딩을 사용하지 않으며, 명시적 `[[reply_to_*]]` 태그는 계속 적용됩니다.
    - `first`: 해당 턴에서 처음 발신하는 Discord 메시지에 암시적 네이티브 응답 참조를 연결합니다.
    - `all`: 모든 발신 메시지에 연결합니다.
    - `batched`: 수신 이벤트가 여러 메시지의 디바운스된 배치인 경우에만 연결합니다. 모든 단일 메시지 턴이 아니라 주로 모호한 연속 채팅에 네이티브 응답을 사용하려는 경우 유용합니다.

    에이전트가 특정 메시지를 대상으로 지정할 수 있도록 메시지 ID가 컨텍스트/기록에 제공됩니다.

  </Accordion>

  <Accordion title="링크 미리보기">
    Discord는 기본적으로 URL에 풍부한 링크 임베드를 생성합니다. OpenClaw는 발신 Discord 메시지에서 생성된 임베드를 기본적으로 억제하므로, 사용자가 명시적으로 활성화하지 않는 한 에이전트가 전송한 URL은 일반 링크로 유지됩니다.

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    한 계정에 대해 재정의하려면 `channels.discord.accounts.<id>.suppressEmbeds`를 설정하십시오. 에이전트 메시지 도구 전송에서도 단일 메시지에 `suppressEmbeds: false`를 전달할 수 있습니다. 명시적인 Discord `embeds` 페이로드는 기본 링크 미리보기 설정에 의해 억제되지 않습니다.

  </Accordion>

  <Accordion title="실시간 스트림 미리보기">
    OpenClaw는 임시 메시지를 전송한 후 텍스트가 도착할 때마다 편집하여 답변 초안을 스트리밍할 수 있습니다. `channels.discord.streaming.mode`에는 `off` | `partial` | `block` | `progress`를 사용할 수 있습니다(`streaming`/레거시 `streamMode` 키가 설정되지 않은 경우 기본값). `streamMode`는 레거시 별칭입니다. 유지된 구성을 표준 중첩 `streaming` 형태로 다시 작성하려면 `openclaw doctor --fix`를 실행하십시오.

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

    - `off`는 Discord 미리보기 편집을 비활성화합니다.
    - `partial`은 토큰이 도착할 때마다 하나의 미리보기 메시지를 편집합니다.
    - `block`은 초안 크기의 청크를 내보냅니다. `textChunkLimit` 범위로 제한되는 `streaming.preview.chunk`(`minChars`, `maxChars`, `breakPreference`)로 크기와 분할 지점을 조정하십시오. 블록 스트리밍을 명시적으로 활성화하면 OpenClaw는 이중 스트리밍을 방지하기 위해 미리보기 스트림을 건너뜁니다.
    - `progress`는 편집 가능한 상태 초안 하나를 유지하고 최종 전달 전까지 도구 진행 상황으로 업데이트합니다. 공유 시작 레이블은 계속 추가되는 한 줄이므로, 작업 내용이 충분히 쌓이면 나머지 내용처럼 스크롤되어 사라집니다.
    - 미디어, 오류 및 명시적 답장 최종본은 대기 중인 미리보기 편집을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 도구/진행 상황 업데이트에서 미리보기 메시지를 재사용할지 제어합니다.
    - 도구/진행 상황 행은 가능한 경우 간결한 이모지 + 제목 + 세부 정보 형식으로 렌더링됩니다. 예: `🛠️ Bash: run tests` 또는 `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary`(기본값 `false`)는 임시 진행 상황 초안에 어시스턴트의 해설/서문 텍스트를 포함하도록 설정합니다. 해설은 표시 전에 정리되고 일시적으로만 유지되며 최종 답변 전달 방식은 변경하지 않습니다.
    - `streaming.progress.maxLineChars`는 줄별 진행 상황 미리보기 한도를 제어합니다. 일반 문장은 단어 경계에서 축약되며, 명령과 경로 세부 정보는 유용한 접미사를 유지합니다.
    - `streaming.preview.commandText` / `streaming.progress.commandText`는 간결한 진행 상황 줄에서 명령/실행 세부 정보를 제어합니다. `raw`(기본값) 또는 `status`(도구 레이블만)를 사용할 수 있습니다.

    간결한 진행 상황 줄은 유지하면서 원시 명령/실행 텍스트를 숨깁니다.

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

    미리 보기 스트리밍은 텍스트만 지원하며, 미디어 응답은 일반 전송 방식으로 대체됩니다.

  </Accordion>

  <Accordion title="기록, 컨텍스트 및 스레드 동작">
    길드 기록 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - 대체 설정: `messages.groupChat.historyLimit`
    - `0`으로 비활성화

    DM 기록 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의하지 않는 한 상위 채널 설정을 상속합니다.
    - 스레드 세션은 상위 채널의 세션 수준 `/model` 선택을 모델 전용 대체 설정으로 상속합니다. 스레드 로컬 `/model` 선택이 우선하며, 대화 기록 상속을 활성화하지 않는 한 상위 대화 기록은 복사되지 않습니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)를 설정하면 새 자동 스레드가 상위 대화 기록을 기반으로 초기화됩니다. 계정별 재정의: `channels.discord.accounts.<id>.thread.inheritParent`.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 확인할 수 있습니다.
    - `guilds.<guild>.channels.<channel>.requireMention: false`는 응답 단계 활성화 대체 처리 중에도 유지됩니다.

    채널 주제는 **신뢰할 수 없는** 컨텍스트로 삽입됩니다. 허용 목록은 에이전트를 트리거할 수 있는 사용자를 제한하지만, 보조 컨텍스트 전체를 삭제하는 경계는 아닙니다.

  </Accordion>

  <Accordion title="하위 에이전트용 스레드 바인딩 세션">
    Discord는 스레드를 세션 대상에 바인딩하여 해당 스레드의 후속 메시지가 동일한 세션(하위 에이전트 세션 포함)으로 계속 라우팅되도록 할 수 있습니다.

    명령:

    - `/focus <target>` 현재/새 스레드를 하위 에이전트/세션 대상에 바인딩합니다.
    - `/unfocus` 현재 스레드 바인딩을 제거합니다.
    - `/agents` 활성 실행 및 바인딩 상태를 표시합니다.
    - `/session idle <duration|off>` 포커스된 바인딩의 비활성 자동 포커스 해제 설정을 확인/업데이트합니다.
    - `/session max-age <duration|off>` 포커스된 바인딩의 최대 수명 제한을 확인/업데이트합니다.

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

    - `session.threadBindings.*`는 전역 기본값을 설정하며, `channels.discord.threadBindings.*`는 Discord 동작을 재정의합니다.
    - `spawnSessions`는 `sessions_spawn({ thread: true })` 및 ACP 스레드 생성 시 스레드를 자동으로 생성하고 바인딩할지 제어합니다. 기본값: `true`.
    - `defaultSpawnContext`는 스레드에 바인딩된 생성 작업의 네이티브 하위 에이전트 컨텍스트를 제어합니다. 기본값: `"fork"`.
    - 사용 중단된 `spawnSubagentSessions`/`spawnAcpSessions` 키는 `openclaw doctor --fix`를 통해 마이그레이션됩니다.
    - 계정에서 스레드 바인딩이 비활성화되어 있으면 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    [하위 에이전트](/ko/tools/subagents), [ACP 에이전트](/ko/tools/acp-agents), [구성 참조](/ko/gateway/configuration-reference)를 참조하십시오.

  </Accordion>

  <Accordion title="영구 ACP 채널 바인딩">
    안정적인 "상시 가동" ACP 작업 공간을 사용하려면 Discord 대화를 대상으로 하는 최상위 수준의 타입 지정 ACP 바인딩을 구성하십시오.

    구성 경로: `type: "acp"` 및 `match.channel: "discord"`가 포함된 `bindings[]`.

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

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 그 자리에서 바인딩하고 이후 메시지가 동일한 ACP 세션에서 계속 처리되도록 합니다. 스레드 메시지는 상위 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new`와 `/reset`은 동일한 ACP 세션을 그 자리에서 재설정합니다. 임시 스레드 바인딩은 활성화된 동안 대상 확인을 재정의할 수 있습니다.
    - `spawnSessions`는 `--thread auto|here`를 통한 하위 스레드 생성 및 바인딩을 제어합니다.

    바인딩 동작에 관한 자세한 내용은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하십시오.

  </Accordion>

  <Accordion title="반응 알림">
    길드별 반응 알림 모드(`guilds.<id>.reactionNotifications`):

    - `off`
    - `own`(기본값)
    - `all`
    - `allowlist`(`guilds.<id>.users` 사용)

    반응 이벤트는 시스템 이벤트로 변환되어 라우팅된 Discord 세션에 첨부됩니다.

  </Accordion>

  <Accordion title="확인 반응">
    `ackReaction`은 OpenClaw가 수신 메시지를 처리하는 동안 확인 이모지를 전송합니다.

    확인 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 대체 값(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Discord는 유니코드 이모지 또는 사용자 지정 이모지 이름을 허용합니다.
    - 채널 또는 계정의 반응을 비활성화하려면 `""`를 사용하십시오.

    **범위(`messages.ackReactionScope`):**

    값: `"all"`(DM + 그룹, 주변 방 이벤트 포함), `"direct"`(DM만), `"group-all"`(주변 방 이벤트를 제외한 모든 그룹 메시지, DM 제외), `"group-mentions"`(봇이 멘션된 그룹, **DM 제외**, 기본값), `"off"` / `"none"`(비활성화).

    <Note>
    기본 범위인 `"group-mentions"`에서는 다이렉트 메시지나 주변 방 이벤트에 확인 반응을 표시하지 않습니다. 수신된 Discord DM 및 조용한 방 이벤트에 확인 반응을 표시하려면 `messages.ackReactionScope`를 `"all"`로 설정하십시오.
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
    `channels.discord.proxy`를 사용하여 Discord Gateway WebSocket 트래픽과 시작 시 REST 조회(애플리케이션 ID + 허용 목록 확인)를 HTTP(S) 프록시를 통해 라우팅합니다.
    Discord Gateway WebSocket 프록시는 명시적으로 구성해야 하며, WebSocket 연결은 Gateway 프로세스의 환경 프록시 변수를 상속하지 않습니다. `channels.discord.proxy`가 구성된 경우 시작 시 REST 조회에 이 프록시가 사용됩니다.

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
    프록시된 메시지를 시스템 구성원 ID에 매핑하도록 PluralKit 확인을 활성화합니다:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 선택 사항; 비공개 시스템에 필요합니다
      },
    },
  },
}
```

    참고:

    - 허용 목록에는 `pk:<memberId>`를 사용할 수 있습니다
    - 멤버 표시 이름은 `channels.discord.dangerouslyAllowNameMatching: true`인 경우에만 이름/슬러그로 일치시킵니다
    - 조회 시 원본 메시지 ID로 PluralKit API를 쿼리합니다
    - 조회에 실패하면 프록시된 메시지를 봇 메시지로 취급하며, `allowBots`에서 허용하지 않는 한 삭제합니다

  </Accordion>

  <Accordion title="발신 멘션 별칭">
    에이전트가 알려진 Discord 사용자를 결정적으로 발신 멘션해야 할 때 `mentionAliases`를 사용합니다. 키는 선행 `@`가 없는 핸들이고, 값은 Discord 사용자 ID입니다. 알 수 없는 핸들, `@everyone`, `@here`, Markdown 코드 스팬 내부의 멘션은 변경하지 않습니다.

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

  <Accordion title="프레즌스 구성">
    상태 또는 활동 필드를 설정하거나 자동 프레즌스를 활성화하면 프레즌스 업데이트가 적용됩니다.

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

    활동(`activity`가 설정된 경우 사용자 지정 상태가 기본 활동 유형입니다):

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
      activity: "라이브 코딩",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    활동 유형 매핑:

    - 0: 플레이 중
    - 1: 스트리밍 중(`activityUrl`이 필요하며, `activityUrl`에는 다시 `activityType: 1`이 필요합니다)
    - 2: 듣는 중
    - 3: 시청 중
    - 4: 사용자 지정(활동 텍스트를 상태 내용으로 사용하며, 이모지는 선택 사항입니다)
    - 5: 경쟁 중

    자동 프레즌스(런타임 상태 신호):

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

    자동 프레즌스는 런타임 가용성을 Discord 상태에 매핑합니다. 정상 => 온라인, 성능 저하 또는 알 수 없음 => 자리 비움, 소진 또는 사용 불가 => 방해 금지입니다. 기본값: `intervalMs` 30000, `minUpdateIntervalMs` 15000(`intervalMs` 이하여야 합니다). 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` 자리 표시자를 지원합니다)

  </Accordion>

  <Accordion title="Discord에서의 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 원래 채널에 승인 프롬프트를 게시할 수 있습니다.

    구성 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`(선택 사항이며, 가능한 경우 `commands.ownerAllowFrom`으로 대체합니다)
    - `channels.discord.execApprovals.target`(`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled`가 설정되지 않았거나 `"auto"`이고 `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 하나 이상의 승인자를 확인할 수 있으면 Discord는 네이티브 실행 승인을 자동으로 활성화합니다. Discord는 채널 `allowFrom`, 레거시 `dm.allowFrom` 또는 다이렉트 메시지 `defaultTo`에서 실행 승인자를 추론하지 않습니다. Discord를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정합니다.

    `/diagnostics` 및 `/export-trajectory`와 같이 민감한 소유자 전용 그룹 명령의 경우 OpenClaw는 승인 프롬프트와 최종 결과를 비공개로 전송합니다. 명령을 호출한 소유자에게 Discord 소유자 경로가 있으면 먼저 Discord DM을 시도하고, 그렇지 않으면 Telegram 등 `commands.ownerAllowFrom`에서 사용 가능한 첫 번째 소유자 경로로 대체합니다.

    `target`이 `channel` 또는 `both`이면 승인 프롬프트가 채널에 표시됩니다. 확인된 승인자만 버튼을 사용할 수 있으며, 다른 사용자에게는 임시 거부 메시지가 표시됩니다. 승인 프롬프트에는 명령 텍스트가 포함되므로 신뢰할 수 있는 채널에서만 채널 전달을 활성화하십시오. 세션 키에서 채널 ID를 가져올 수 없으면 OpenClaw는 DM 전달로 대체합니다.

    Discord는 다른 채팅 채널에서 사용하는 공유 승인 버튼을 렌더링하며, 네이티브 Discord 어댑터는 주로 승인자 DM 라우팅과 채널 팬아웃을 추가합니다. 이러한 버튼이 있으면 기본 승인 UX로 사용됩니다. 도구 결과에서 채팅 승인을 사용할 수 없다고 표시하거나 수동 승인이 유일한 경로인 경우에만 OpenClaw가 수동 `/approve` 명령을 포함해야 합니다. Discord 네이티브 승인 런타임이 활성화되지 않은 경우 OpenClaw는 로컬의 결정적 `/approve <id> <decision>` 프롬프트를 계속 표시합니다. 런타임이 활성화되었지만 어떤 대상에도 네이티브 카드를 전달할 수 없는 경우 OpenClaw는 대기 중인 승인에 있는 정확한 `/approve` 명령을 포함한 동일 채팅 대체 알림을 전송합니다.

    Gateway 인증 및 승인 확인은 공유 Gateway 클라이언트 계약을 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해 확인하고, 그 밖의 ID는 `exec.approval.resolve`를 통해 확인합니다). 승인은 기본적으로 30분 후 만료됩니다.

    [실행 승인](/ko/tools/exec-approvals)을 참조하십시오.

  </Accordion>
</AccordionGroup>

## 도구 및 작업 게이트

Discord 메시지 작업은 메시징, 채널 관리, 중재, 프레즌스 및 메타데이터를 다룹니다.

핵심 예시:

- 메시징: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- 반응: `react`, `reactions`, `emojiList`
- 중재: `timeout`, `kick`, `ban`
- 프레즌스: `setPresence`

`event-create` 작업은 선택적 `image` 매개변수(URL 또는 로컬 파일 경로)를 받아 예약된 이벤트의 표지 이미지를 설정합니다.

작업 게이트는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| 작업 그룹                                                                                                                                                             | 기본값    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 활성화됨  |
| roles                                                                                                                                                                    | 비활성화됨 |
| moderation                                                                                                                                                               | 비활성화됨 |
| presence                                                                                                                                                                 | 비활성화됨 |

## 컴포넌트 v2 UI

OpenClaw는 실행 승인 및 교차 컨텍스트 마커에 Discord 컴포넌트 v2를 사용합니다. Discord 메시지 작업은 사용자 지정 UI를 위한 `components`도 받을 수 있지만(고급 기능이며, discord 도구로 컴포넌트 페이로드를 구성해야 합니다), 레거시 `embeds`도 계속 사용할 수 있으나 권장하지 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord 컴포넌트 컨테이너에서 사용하는 강조 색상(16진수)을 설정합니다. 계정별 설정: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs`는 전송된 Discord 컴포넌트 콜백이 등록된 상태로 유지되는 시간을 제어합니다(기본값 `1800000`, 최댓값 `86400000`). 계정별 설정: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- 컴포넌트 v2가 있으면 `embeds`는 무시됩니다.
- 일반 URL 미리보기는 기본적으로 억제됩니다. 단일 발신 링크를 확장하려면 메시지 작업에 `suppressEmbeds: false`를 설정합니다.

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

Discord에는 서로 다른 두 가지 음성 표면이 있습니다. 실시간 **음성 채널**(연속 대화)과 **음성 메시지 첨부 파일**(파형 미리보기 형식)입니다. Gateway는 두 가지 모두 지원합니다.

### 음성 채널

설정 체크리스트:

1. Discord Developer Portal에서 Message Content Intent를 활성화합니다.
2. 역할/사용자 허용 목록을 사용할 때 Server Members Intent를 활성화합니다.
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

참여하기 전에 봇의 유효 권한을 검사하려면 다음을 실행합니다.

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

- Discord 음성 기능은 텍스트 전용 구성에서 명시적으로 활성화해야 합니다. `/vc` 명령, 음성 런타임 및 `GuildVoiceStates` Gateway 인텐트를 활성화하려면 `channels.discord.voice.enabled=true`로 설정하거나 기존 `channels.discord.voice` 블록을 유지하십시오. `channels.discord.intents.voiceStates`로 인텐트 구독을 명시적으로 재정의할 수 있습니다. 설정하지 않으면 실질적인 음성 활성화 상태를 따릅니다.
- `voice.mode`는 대화 경로를 제어합니다. 기본값은 `agent-proxy`입니다. 실시간 음성 프런트엔드가 발화 타이밍, 끼어들기 및 재생을 처리하고, `openclaw_agent_consult`를 통해 라우팅된 OpenClaw 에이전트에 실질적인 작업을 위임하며, 결과를 해당 화자가 입력한 Discord 프롬프트처럼 처리합니다. `stt-tts`는 기존의 일괄 STT 및 TTS 흐름을 유지합니다. `bidi`에서는 실시간 모델이 직접 대화하면서 OpenClaw 두뇌를 위한 `openclaw_agent_consult`를 노출합니다.
- `voice.agentSession`은 음성 발화를 수신할 OpenClaw 대화를 제어합니다. 음성 채널 자체 세션을 사용하려면 설정하지 마십시오. 음성 채널이 `#maintainers`와 같은 기존 Discord 텍스트 채널 세션의 마이크/스피커 확장 역할을 하게 하려면 `{ mode: "target", target: "channel:<text-channel-id>" }`로 설정하십시오.
- `voice.model`은 Discord 음성 응답 및 실시간 상담에 사용할 OpenClaw 에이전트 두뇌를 재정의합니다. 라우팅된 에이전트 모델을 상속하려면 설정하지 마십시오. 이는 `voice.realtime.model`과 별개입니다.
- `voice.followUsers`를 사용하면 봇이 선택한 사용자를 따라 Discord 음성 채널에 참가하고, 이동하고, 나갈 수 있습니다. [음성에서 사용자 따라가기](#follow-users-in-voice)를 참조하십시오.
- `agent-proxy`는 음성을 `discord-voice`를 통해 라우팅합니다. 이 경로는 화자 및 대상 세션의 일반적인 소유자/도구 권한 부여를 유지하지만, Discord 음성이 재생을 담당하므로 에이전트 `tts` 도구를 숨깁니다. 기본적으로 `agent-proxy`는 소유자 화자의 상담에 소유자와 동등한 전체 도구 접근 권한을 부여하고(`voice.realtime.toolPolicy: "owner"`), 실질적인 답변 전에 OpenClaw 에이전트와 상담하는 것을 강하게 우선합니다(`voice.realtime.consultPolicy: "always"`). 기본 `always` 모드에서는 실시간 계층이 상담 답변 전에 의미 없는 말을 자동으로 재생하지 않습니다. 음성을 캡처하고 전사한 다음 라우팅된 OpenClaw 답변을 재생합니다. Discord가 첫 번째 답변을 재생하는 동안 여러 강제 상담 답변이 완료되면, 이후의 정확한 발화 답변은 문장 중간에 음성을 교체하지 않고 재생이 유휴 상태가 될 때까지 대기열에 추가됩니다.
- `stt-tts` 모드에서 STT는 `tools.media.audio`를 사용하며, `voice.model`은 전사에 영향을 주지 않습니다.
- 실시간 모드에서는 `voice.realtime.provider`, `voice.realtime.model`, `voice.realtime.speakerVoice`가 실시간 오디오 세션을 구성합니다. OpenAI Realtime 2.1과 Codex 두뇌를 함께 사용하려면 `voice.realtime.model: "gpt-realtime-2.1"` 및 `voice.model: "openai/gpt-5.6-sol"`을 사용하십시오.
- 실시간 음성 모드는 빠른 직접 발화에서도 라우팅된 OpenClaw 에이전트와 동일한 정체성, 사용자 기반 정보 및 페르소나를 유지하도록 기본적으로 작은 `IDENTITY.md`, `USER.md`, `SOUL.md` 프로필 파일을 실시간 제공자 지침에 포함합니다. 이를 사용자 지정하려면 `voice.realtime.bootstrapContextFiles`를 일부 파일로 설정하고, 비활성화하려면 `[]`로 설정하십시오. 해당 프로필 파일만 지원되며, `AGENTS.md`는 일반 에이전트 컨텍스트에 그대로 유지됩니다. 주입된 프로필 컨텍스트는 작업 공간 작업, 최신 사실, 메모리 조회 또는 도구 기반 작업을 위한 `openclaw_agent_consult`를 대체하지 않습니다.
- OpenAI `agent-proxy` 실시간 모드에서 전사가 호출 이름으로 시작하거나 끝날 때까지 Discord 실시간 음성을 조용히 유지하려면 `voice.realtime.requireWakeName: true`로 설정하십시오. 구성된 호출 이름은 한 단어나 두 단어여야 합니다. `voice.realtime.wakeNames`를 설정하지 않으면 OpenClaw는 라우팅된 에이전트의 `name`과 `OpenClaw`를 사용하며, 없으면 에이전트 ID와 `OpenClaw`를 사용합니다. 호출 이름 게이팅은 실시간 제공자의 자동 응답을 비활성화하고, 허용된 발화를 OpenClaw 에이전트 상담 경로로 라우팅하며, 최종 전사가 도착하기 전에 부분 전사에서 선행 호출 이름이 인식되면 짧은 음성 확인 응답을 제공합니다.
- OpenAI 실시간 제공자는 출력 오디오 및 전사 이벤트에 대해 현재 Realtime 2 이벤트 이름과 기존 Codex 호환 별칭을 허용하므로, 호환되는 제공자 스냅샷이 변경되어도 어시스턴트 오디오가 누락되지 않습니다.
- `voice.realtime.bargeIn`은 Discord 화자 시작 이벤트가 활성 실시간 재생을 중단할지 여부를 제어합니다. 설정하지 않으면 실시간 제공자의 입력 오디오 중단 설정을 따릅니다.
- `voice.realtime.minBargeInAudioEndMs`는 OpenAI 실시간 끼어들기가 오디오를 자르기 전에 필요한 최소 어시스턴트 재생 시간을 제어합니다. 기본값: `250`. 에코가 적은 공간에서 즉시 중단하려면 `0`으로 설정하고, 에코가 많은 스피커 환경에서는 값을 높이십시오.
- `voice.tts`는 `stt-tts` 음성 재생에 한해서만 `messages.tts`를 재정의합니다. 실시간 모드는 대신 `voice.realtime.speakerVoice`를 사용합니다. Discord 재생에 OpenAI 음성을 사용하려면 `voice.tts.provider: "openai"`로 설정하고 `voice.tts.providers.openai.speakerVoice`에서 텍스트 음성 변환 음성을 선택하십시오. 현재 OpenAI TTS 모델에서는 `cedar`가 남성적으로 들리는 좋은 선택입니다.
- 채널별 Discord `systemPrompt` 재정의는 해당 음성 채널의 음성 전사 발화에 적용됩니다.
- 음성 전사 발화는 소유자 제한 명령 및 채널 작업을 위해 Discord `allowFrom` 또는 `dm.allowFrom`에서 소유자 상태를 파생합니다. 에이전트 도구의 표시 여부는 라우팅된 세션에 구성된 도구 정책을 따릅니다.
- `voice.autoJoin`에 동일한 길드의 항목이 여러 개 있으면 OpenClaw는 해당 길드에 마지막으로 구성된 채널에 참가합니다.
- `voice.allowedChannels`는 선택적인 상주 허용 목록입니다. 권한이 부여된 모든 Discord 음성 채널에 `/vc join`으로 참가하도록 허용하려면 설정하지 마십시오. 설정하면 `/vc join`, 시작 시 자동 참가 및 봇 음성 상태 이동이 나열된 `{ guildId, channelId }` 항목으로 제한됩니다. 모든 Discord 음성 참가를 거부하려면 빈 배열로 설정하십시오. Discord가 봇을 허용 목록 외부로 이동시키면 OpenClaw는 해당 채널에서 나가고, 구성된 자동 참가 대상이 있으면 다시 참가합니다.
- `voice.daveEncryption` 및 `voice.decryptionFailureTolerance`는 `@discordjs/voice` 참가 옵션으로 그대로 전달됩니다. 업스트림 기본값은 `daveEncryption=true` 및 `decryptionFailureTolerance=24`입니다.
- OpenClaw는 Discord 음성 수신 및 실시간 원시 PCM 재생에 번들로 제공되는 `libopus-wasm` 코덱을 사용합니다. 고정된 libopus WebAssembly 빌드를 포함하며 네이티브 opus 애드온이 필요하지 않습니다.
- `voice.connectTimeoutMs`는 `/vc join` 및 자동 참가 시도에서 초기 `@discordjs/voice` Ready 대기 시간을 제어합니다. 기본값: `30000`.
- `voice.reconnectGraceMs`는 연결이 끊긴 음성 세션이 다시 연결되기 시작할 때까지 OpenClaw가 세션을 제거하지 않고 기다리는 시간을 제어합니다. 기본값: `15000`.
- `stt-tts` 모드에서는 다른 사용자가 말하기 시작했다는 이유만으로 음성 재생이 중지되지 않습니다. 피드백 루프를 방지하기 위해 OpenClaw는 TTS 재생 중에 새 음성 캡처를 무시합니다. 다음 발화를 위해서는 재생이 끝난 후 말하십시오. 실시간 모드는 화자 시작을 끼어들기 신호로 실시간 제공자에 전달합니다.
- 실시간 모드에서는 스피커의 에코가 열린 마이크로 유입되면 끼어들기로 인식되어 재생을 중단할 수 있습니다. 에코가 많은 Discord 공간에서는 입력 오디오로 인해 OpenAI가 자동으로 중단하지 않도록 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`로 설정하십시오. Discord 화자 시작 이벤트가 활성 재생을 계속 중단하도록 하려면 `voice.realtime.bargeIn: true`를 추가하십시오. OpenAI 실시간 브리지는 `voice.realtime.minBargeInAudioEndMs`보다 짧은 재생 잘림을 에코/잡음일 가능성이 높은 것으로 간주해 무시하며, Discord 재생을 지우는 대신 건너뛴 것으로 기록합니다.
- `voice.captureSilenceGraceMs`는 Discord가 화자의 발화 중지를 보고한 후 해당 오디오 세그먼트를 STT용으로 확정하기까지 OpenClaw가 기다리는 시간을 제어합니다. 기본값: `2000`. Discord가 일반적인 일시 중지를 끊긴 부분 전사로 분할하는 경우 값을 높이십시오.
- ElevenLabs가 선택된 TTS 제공자인 경우 Discord 음성 재생은 스트리밍 TTS를 사용하며 제공자 응답 스트림에서 재생을 시작합니다. 스트리밍을 지원하지 않는 제공자는 합성된 임시 파일 경로로 대체됩니다.
- OpenClaw는 수신 복호화 실패를 감시하며, 짧은 시간 내에 실패가 반복되면 음성 채널에서 나갔다가 다시 참가하여 자동 복구합니다.
- 업데이트 후 수신 로그에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복적으로 표시되면 종속성 보고서와 로그를 수집하십시오. 번들로 제공되는 `@discordjs/voice` 버전에는 discord.js PR #11449의 업스트림 패딩 수정 사항이 포함되어 있으며, 이 수정으로 discord.js 이슈 #11419가 종결되었습니다.
- OpenClaw가 캡처한 화자 세그먼트를 확정할 때 발생하는 `The operation was aborted` 수신 이벤트는 예상된 동작입니다. 이는 상세 진단 정보이며 경고가 아닙니다.
- 상세 Discord 음성 로그에는 허용된 각 화자 세그먼트에 대해 길이가 제한된 한 줄짜리 STT 전사 미리보기가 포함됩니다. 따라서 디버깅 시 전사 텍스트를 무제한으로 출력하지 않고도 사용자 측과 에이전트 응답 측을 모두 확인할 수 있습니다.
- `agent-proxy` 모드에서 강제 상담 대체 동작은 `...`로 끝나는 텍스트, "and"와 같은 후행 연결어 또는 "be right back", "bye"와 같이 명백히 실행할 수 없는 마무리 표현처럼 불완전할 가능성이 높은 전사 조각을 건너뜁니다. 이 동작이 오래된 대기 답변을 방지하면 로그에 `forced agent consult skipped reason=...`가 표시됩니다.

### 음성에서 사용자 따라가기

시작 시 고정 채널에 참가하거나 `/vc join`을 기다리는 대신 Discord 음성 봇이 알려진 Discord 사용자 한 명 이상과 함께 있도록 하려면 `voice.followUsers`를 사용하십시오.

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

- `followUsers`는 원시 Discord 사용자 ID와 `discord:<id>` 값을 허용합니다. OpenClaw는 음성 상태 이벤트를 일치시키기 전에 두 형식을 모두 정규화합니다.
- `followUsers`가 구성되면 `followUsersEnabled`의 기본값은 `true`입니다. 저장된 목록은 유지하되 자동 음성 따라가기를 중지하려면 `false`로 설정하십시오.
- 따라가는 사용자가 허용된 음성 채널에 참가하면 OpenClaw가 해당 채널에 참가합니다. 사용자가 이동하면 OpenClaw도 함께 이동합니다. 현재 따라가는 사용자의 연결이 끊기면 OpenClaw가 나갑니다.
- 같은 길드에 따라가는 사용자가 여러 명 있고 현재 따라가는 사용자가 나가면, OpenClaw는 길드에서 나가기 전에 추적 중인 다른 사용자의 채널로 이동합니다. 여러 사용자가 동시에 이동하면 가장 최근에 관찰된 음성 상태 이벤트가 우선합니다.
- `allowedChannels`는 계속 적용됩니다. 허용되지 않은 채널에 있는 따라가기 대상 사용자는 무시되며, 따라가기로 소유된 세션은 다른 따라가기 대상 사용자에게 이동하거나 나갑니다.
- OpenClaw는 시작 시와 제한된 간격으로 누락된 음성 상태 이벤트를 조정합니다. 조정은 구성된 길드를 샘플링하고 실행당 REST 조회 수를 제한하므로, 매우 큰 `followUsers` 목록은 수렴하는 데 두 번 이상의 간격이 필요할 수 있습니다.
- 사용자를 따라가는 동안 Discord 또는 관리자가 봇을 이동시키면, 목적지가 허용된 경우 OpenClaw는 음성 세션을 다시 구성하고 따라가기 소유권을 유지합니다. 봇이 `allowedChannels` 외부로 이동하면 OpenClaw는 나갔다가 구성된 대상이 있으면 다시 참가합니다.
- DAVE 수신 복구는 복호화 실패가 반복된 후 같은 채널에서 나갔다가 다시 참가할 수 있습니다. 따라가기로 소유된 세션은 해당 복구 경로에서도 따라가기 소유권을 유지하므로, 이후 따라가기 대상 사용자의 연결이 끊기면 채널에서 나갑니다.

참가 모드를 선택하십시오.

- 사용자가 음성 채널에 있을 때 봇도 자동으로 음성 채널에 있어야 하는 개인 또는 운영자 설정에는 `followUsers`를 사용하십시오.
- 추적 중인 사용자가 음성 채널에 없더라도 항상 있어야 하는 고정 공간 봇에는 `autoJoin`을 사용하십시오.
- 일회성 참가 또는 자동 음성 접속이 예상 밖일 수 있는 공간에는 `/vc join`을 사용하십시오.

Discord 음성 코덱:

- 음성 수신 로그에는 `discord voice: opus decoder: libopus-wasm`이 표시됩니다.
- 실시간 재생은 패킷을 `@discordjs/voice`에 전달하기 전에 동일한 번들 `libopus-wasm` 패키지를 사용하여 원시 48 kHz 스테레오 PCM을 Opus로 인코딩합니다.
- 파일 및 제공자 스트림 재생은 ffmpeg를 사용하여 원시 48 kHz 스테레오 PCM으로 트랜스코딩한 다음, Discord로 전송되는 Opus 패킷 스트림에 `libopus-wasm`을 사용합니다.

STT 및 TTS 파이프라인:

- Discord PCM 캡처는 임시 WAV 파일로 변환됩니다.
- `tools.media.audio`는 STT를 처리합니다(예: `openai/gpt-4o-mini-transcribe`).
- 트랜스크립트는 Discord 인그레스와 라우팅을 통해 전달되며, 응답 LLM은 에이전트의 `tts` 도구를 숨기고 텍스트를 반환하도록 요청하는 음성 출력 정책으로 실행됩니다. 최종 TTS 재생은 Discord 음성이 담당하기 때문입니다.
- `voice.model`을 설정하면 이 음성 채널 턴의 응답 LLM만 재정의합니다.
- `voice.tts`는 `messages.tts` 위에 병합됩니다. 스트리밍을 지원하는 제공자는 플레이어에 직접 공급하며, 그렇지 않으면 생성된 오디오 파일을 참여 중인 채널에서 재생합니다.

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

`voice.agentSession` 블록이 없으면 각 음성 채널에 자체적으로 라우팅된 OpenClaw 세션이 할당됩니다. 예를 들어 `/vc join channel:234567890123456789`는 해당 Discord 음성 채널의 세션과 대화합니다. 실시간 모델은 음성 프런트엔드일 뿐이며, 실질적인 요청은 구성된 OpenClaw 에이전트에 전달됩니다. 실시간 모델이 참조 도구를 호출하지 않고 최종 트랜스크립트를 생성하면 OpenClaw가 대체 동작으로 참조를 강제하여 기본 동작이 계속 에이전트와 대화하는 것처럼 유지되게 합니다.

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

`agent-proxy` 모드에서 봇은 구성된 음성 채널에 참여하지만, OpenClaw 에이전트 턴은 대상 채널의 일반 라우팅 세션과 에이전트를 사용합니다. 실시간 음성 세션은 반환된 결과를 음성 채널에서 다시 말합니다. 감독 에이전트는 도구 정책에 따라 계속 일반 메시지 도구를 사용할 수 있으며, 별도의 Discord 메시지를 보내는 것이 적절한 작업이라면 그렇게 할 수 있습니다.

위임된 OpenClaw 실행이 활성 상태인 동안 새 Discord 음성 트랜스크립트는 다른 에이전트 턴을 시작하기 전에 실시간 실행 제어로 처리됩니다. "상태", "그 작업 취소해", "더 작은 수정안을 사용해", "완료되면 테스트도 확인해"와 같은 문구는 활성 세션의 상태, 취소, 방향 조정 또는 후속 입력으로 분류됩니다. 상태, 취소, 수락된 방향 조정 및 후속 결과는 호출자가 OpenClaw의 요청 처리 여부를 알 수 있도록 음성 채널에서 음성으로 다시 전달됩니다.

유용한 대상 형식:

- `target: "channel:123456789012345678"`은 Discord 텍스트 채널 세션을 통해 라우팅합니다.
- `target: "123456789012345678"`은 채널 대상으로 처리됩니다.
- `target: "dm:123456789012345678"` 또는 `target: "user:123456789012345678"`은 해당 다이렉트 메시지 세션을 통해 라우팅합니다.

에코가 많은 OpenAI Realtime 환경의 예시:

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

모델이 열린 마이크를 통해 자체 Discord 재생음을 듣지만 말로 끼어들어 중단할 수 있어야 할 때 사용하십시오. OpenClaw는 원시 입력 오디오로 인해 OpenAI가 자동으로 중단하지 않도록 하며, `bargeIn: true`를 사용하면 다음 캡처 턴이 OpenAI에 도달하기 전에 Discord 화자 시작 이벤트와 이미 활성화된 화자 오디오가 활성 실시간 응답을 취소할 수 있습니다. `audioEndMs`가 `minBargeInAudioEndMs`보다 작은 매우 이른 끼어들기 신호는 에코 또는 노이즈일 가능성이 큰 것으로 처리되어 무시되므로, 모델이 첫 재생 프레임에서 중단되지 않습니다.

예상되는 음성 로그:

- 참여 시: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 실시간 시작 시: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 화자 오디오 시: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 오래되어 건너뛴 음성 시: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 또는 `reason=non-actionable-closing ...`
- 실시간 응답 완료 시: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 재생 중지/초기화 시: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 실시간 참조 시: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 에이전트 답변 시: `discord voice: agent turn answer ...`
- 정확한 음성이 대기열에 추가될 때: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, 이후 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 끼어들기 감지 시: `discord voice: realtime barge-in detected source=speaker-start ...` 또는 `discord voice: realtime barge-in detected source=active-speaker-audio ...`, 이후 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 실시간 중단 시: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, 이후 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 또는 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 무시된 에코/노이즈 시: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 끼어들기 비활성화 시: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 유휴 재생 시: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

오디오 중단을 디버깅하려면 실시간 음성 로그를 타임라인으로 읽으십시오.

1. `realtime audio playback started`는 Discord가 어시스턴트 오디오 재생을 시작했음을 의미합니다. 브리지는 이 시점부터 어시스턴트 출력 청크, Discord PCM 바이트, 제공자 실시간 바이트 및 합성 오디오 지속 시간을 계산하기 시작합니다.
2. `realtime speaker turn opened`는 Discord 화자가 활성 상태가 되었음을 나타냅니다. 재생이 이미 활성 상태이고 `bargeIn`이 활성화되어 있으면 이후 `barge-in detected source=speaker-start`가 나타날 수 있습니다.
3. `realtime input audio started`는 해당 화자 턴에서 수신된 첫 실제 오디오 프레임을 나타냅니다. 여기서 `outputActive=true`이거나 `outputAudioMs`가 0이 아니면 어시스턴트 재생이 계속 활성 상태인 동안 마이크가 입력을 전송하고 있음을 의미합니다.
4. `barge-in detected source=active-speaker-audio`는 어시스턴트 재생이 활성 상태인 동안 OpenClaw가 실시간 화자 오디오를 감지했음을 의미합니다. 실제 중단과 유효한 오디오가 없는 Discord 화자 시작 이벤트를 구분할 때 유용합니다.
5. `barge-in requested reason=...`는 OpenClaw가 실시간 제공자에 활성 응답의 취소 또는 잘라내기를 요청했음을 의미합니다. `outputAudioMs`, `outputActive`, `playbackChunks`가 포함되므로 중단되기 전에 어시스턴트 오디오가 실제로 얼마나 재생되었는지 확인할 수 있습니다.
6. `realtime audio playback stopped reason=...`는 로컬 Discord 재생 초기화 지점입니다. 이유는 재생을 중지한 주체를 나타냅니다. 가능한 값은 `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, `session-close`입니다.
7. `realtime speaker turn closed`는 캡처된 입력 턴을 요약합니다. `chunks=0` 또는 `hasAudio=false`는 화자 턴은 열렸지만 사용 가능한 오디오가 실시간 브리지에 도달하지 않았음을 의미합니다. `interruptedPlayback=true`는 해당 입력 턴이 어시스턴트 출력과 겹쳐 끼어들기 로직을 트리거했음을 의미합니다.

유용한 필드:

- `outputAudioMs`: 로그 줄 이전에 실시간 제공자가 생성한 어시스턴트 오디오 지속 시간입니다.
- `audioMs`: 재생이 중지되기 전에 OpenClaw가 계산한 어시스턴트 오디오 지속 시간입니다.
- `elapsedMs`: 재생 스트림 또는 화자 턴을 열고 닫는 사이의 실제 경과 시간입니다.
- `discordBytes`: Discord 음성으로 전송되거나 수신된 48 kHz 스테레오 PCM 바이트입니다.
- `realtimeBytes`: 실시간 제공자로 전송되거나 수신된 제공자 형식의 PCM 바이트입니다.
- `playbackChunks`: 활성 응답을 위해 Discord에 전달된 어시스턴트 오디오 청크입니다.
- `sinceLastAudioMs`: 마지막으로 캡처된 화자 오디오 프레임과 화자 턴 종료 사이의 간격입니다.

일반적인 패턴:

- `source=active-speaker-audio`와 작은 `outputAudioMs`가 함께 나타나며 동일한 사용자가 근처에 있을 때 즉시 중단된다면, 일반적으로 스피커 에코가 마이크에 유입되는 것입니다. `voice.realtime.minBargeInAudioEndMs`를 높이거나, 스피커 볼륨을 낮추거나, 헤드폰을 사용하거나, `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`를 설정하십시오.
- `source=speaker-start` 이후 `speaker turn closed ... hasAudio=false`가 나타나면 Discord가 화자 시작을 보고했지만 오디오가 OpenClaw에 도달하지 않았음을 의미합니다. 일시적인 Discord 음성 이벤트, 노이즈 게이트 동작 또는 클라이언트가 잠시 마이크를 켠 경우일 수 있습니다.
- 근처에 끼어들기 또는 `provider-clear-audio`가 없는데 `audio playback stopped reason=stream-close`가 나타나면 로컬 Discord 재생 스트림이 예기치 않게 종료된 것입니다. 앞선 제공자 및 Discord 플레이어 로그를 확인하십시오.
- `capture ignored during playback (barge-in disabled)`는 어시스턴트 오디오가 활성 상태인 동안 OpenClaw가 의도적으로 입력을 삭제했음을 의미합니다. 음성으로 재생을 중단하려면 `voice.realtime.bargeIn`을 활성화하십시오.
- `barge-in ignored ... outputActive=false`는 Discord 또는 제공자 VAD가 음성을 보고했지만 OpenClaw에 중단할 활성 재생이 없었음을 의미합니다. 이 경우 오디오가 중단되어서는 안 됩니다.

자격 증명은 구성 요소별로 확인됩니다. `voice.model`에는 LLM 경로 인증, `tools.media.audio`에는 STT 인증, `messages.tts`/`voice.tts`에는 TTS 인증, `voice.realtime.providers` 또는 제공자의 일반 인증 구성에는 실시간 제공자 인증이 사용됩니다.

### 음성 메시지

Discord 음성 메시지는 파형 미리보기를 표시하며 OGG/Opus 오디오가 필요합니다. OpenClaw는 파형을 자동으로 생성하지만, 검사 및 변환을 위해 Gateway 호스트에 `ffmpeg`와 `ffprobe`가 필요합니다.

- **로컬 파일 경로**를 제공하십시오(URL은 거부됩니다).
- 텍스트 콘텐츠를 생략하십시오(Discord는 동일한 페이로드에서 텍스트와 음성 메시지를 함께 사용하는 것을 거부합니다).
- 모든 오디오 형식이 허용되며, OpenClaw가 필요에 따라 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="허용되지 않는 인텐트를 사용했거나 봇에 길드 메시지가 표시되지 않음">

    - Message Content Intent를 활성화합니다.
    - 사용자/멤버 확인 기능을 사용하는 경우 Server Members Intent를 활성화합니다.
    - 인텐트를 변경한 후 Gateway를 다시 시작합니다.

  </Accordion>

  <Accordion title="길드 메시지가 예기치 않게 차단됨">

    - `groupPolicy`를 확인합니다.
    - `channels.discord.guilds` 아래의 길드 허용 목록을 확인합니다.
    - 길드에 `channels` 맵이 있으면 나열된 채널만 허용됩니다.
    - `requireMention` 동작과 멘션 패턴을 확인합니다.

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
    - 길드/채널 `users` 허용 목록에 의해 발신자가 차단됨

  </Accordion>

  <Accordion title="장시간 실행되는 Discord 턴 또는 중복 응답">

    일반적인 로그:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 큐 설정:

    - 단일 계정: `channels.discord.eventQueue.listenerTimeout`
    - 다중 계정: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 이 설정은 에이전트 턴 수명이 아니라 Discord Gateway 리스너 작업만 제어합니다.

    Discord는 큐에 대기 중인 에이전트 턴에 채널 자체 타임아웃을 적용하지 않습니다. 메시지 리스너는 즉시 작업을 넘기며, 큐에 대기 중인 Discord 실행은 세션/도구/런타임 수명 주기가 완료되거나 작업을 중단할 때까지 세션별 순서를 유지합니다.

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
    OpenClaw는 연결하기 전에 Discord `/gateway/bot` 메타데이터를 가져옵니다. 일시적인 실패가 발생하면 Discord의 기본 Gateway URL을 사용하며, 로그 출력은 속도 제한됩니다.

    메타데이터 타임아웃 설정:

    - 단일 계정: `channels.discord.gatewayInfoTimeoutMs`
    - 다중 계정: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 구성이 설정되지 않은 경우 환경 변수 대체값: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 기본값: `30000`(30초), 최댓값: `120000`

  </Accordion>

  <Accordion title="Gateway READY 타임아웃으로 인한 재시작">
    OpenClaw는 시작 중과 런타임 재연결 후에 Discord Gateway의 `READY` 이벤트를 기다립니다. 시작 시차가 있는 다중 계정 설정에서는 기본값보다 긴 시작 READY 대기 시간이 필요할 수 있습니다.

    READY 타임아웃 설정:

    - 시작 시 단일 계정: `channels.discord.gatewayReadyTimeoutMs`
    - 시작 시 다중 계정: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 시작 구성이 설정되지 않은 경우 환경 변수 대체값: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 시작 기본값: `15000`(15초), 최댓값: `120000`
    - 런타임 단일 계정: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 런타임 다중 계정: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 런타임 구성이 설정되지 않은 경우 환경 변수 대체값: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 런타임 기본값: `30000`(30초), 최댓값: `120000`

  </Accordion>

  <Accordion title="권한 감사 불일치">
    `channels status --probe` 권한 확인은 숫자 채널 ID에서만 작동합니다.

    슬러그 키를 사용해도 런타임 일치는 작동할 수 있지만, 프로브는 권한을 완전히 검증할 수 없습니다.

  </Accordion>

  <Accordion title="DM 및 페어링 문제">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"`(레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인을 기다리는 중

  </Accordion>

  <Accordion title="봇 간 루프">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`로 설정하는 경우 루프 동작을 방지하려면 엄격한 멘션 및 허용 목록 규칙을 사용하십시오.
    봇을 멘션하는 봇 메시지만 허용하려면 `channels.discord.allowBots="mentions"`를 사용하는 것이 좋습니다.

    OpenClaw에는 공유 [봇 루프 방지 기능](/ko/channels/bot-loop-protection)도 포함되어 있습니다. `allowBots`가 봇 작성 메시지를 디스패치에 전달하도록 허용할 때마다 Discord는 수신 이벤트를 `(account, channel, bot pair)` 정보로 매핑하며, 구성된 이벤트 예산을 초과하면 일반 페어 가드가 해당 페어를 억제합니다. 이 가드는 이전에는 Discord 속도 제한으로 중단해야 했던 통제 불능의 두 봇 간 루프를 방지합니다. 단일 봇 배포나 예산 이내의 일회성 봇 응답에는 영향을 주지 않습니다.

    기본 설정(`allowBots`가 설정된 경우 활성화됨):

    - `maxEventsPerWindow: 20` -- 봇 페어는 슬라이딩 윈도 내에서 20개의 메시지를 교환할 수 있습니다.
    - `windowSeconds: 60` -- 슬라이딩 윈도 길이
    - `cooldownSeconds: 60` -- 예산을 초과하면 어느 방향이든 이후의 모든 봇 간 메시지가 1분 동안 삭제됩니다.

    공유 기본값은 `channels.defaults.botLoopProtection` 아래에서 한 번 구성한 다음, 정상적인 워크플로에 더 많은 여유가 필요한 경우 Discord 설정으로 재정의하십시오. 우선순위는 다음과 같습니다.

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
      // 선택적인 Discord 전체 재정의입니다. 계정 블록은 개별 필드를 재정의하고
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
            // 페어를 억제하기 전에 분당 최대 5개의 메시지를 허용합니다.
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

  <Accordion title="DecryptionFailed(...)와 함께 음성 STT가 중단됨">

    - Discord 음성 수신 복구 로직이 포함되도록 OpenClaw를 최신 상태로 유지합니다(`openclaw update`).
    - `channels.discord.voice.daveEncryption=true`(기본값)인지 확인합니다.
    - `channels.discord.voice.decryptionFailureTolerance=24`(업스트림 기본값)에서 시작하고 필요한 경우에만 조정합니다.
    - 다음 로그를 확인합니다.
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참여 후에도 실패가 계속되면 로그를 수집하고 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 및 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)의 업스트림 DAVE 수신 이력과 비교합니다.

  </Accordion>
</AccordionGroup>

## 구성 참조

기본 참조: [구성 참조 - Discord](/ko/gateway/config-channels#discord).

<Accordion title="주요 Discord 필드">

- 시작/인증: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령: `commands.native`, `commands.useAccessGroups`(전역), `configWrites`, `slashCommand.ephemeral`
- 이벤트 큐: `eventQueue.listenerTimeout`(리스너 예산, 기본값 `120000`), `eventQueue.maxQueueSize`(기본값 `10000`), `eventQueue.maxConcurrency`(기본값 `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 응답/기록: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전송: `textChunkLimit`(기본값 `2000`), `maxLinesPerMessage`(기본값 `17`)
- 스트리밍: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*`(레거시 최상위 `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` 키는 `openclaw doctor --fix`에 의해 `streaming.*`으로 마이그레이션됨)
- 미디어/재시도: `mediaMaxMb`(발신 Discord 업로드 제한, 기본값 `100`), `retry`
- 작업: `actions.*`
- 현재 상태: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]`(`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## 안전 및 운영

- 봇 토큰을 비밀 정보로 취급하십시오(관리형 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- Discord에 최소 권한만 부여하십시오.
- 명령 배포/상태가 오래된 경우 Gateway를 다시 시작하고 `openclaw channels status --probe`로 다시 확인하십시오.

## 관련 항목

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord 사용자를 Gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 채팅 및 허용 목록 동작입니다.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    수신 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화 방법입니다.
  </Card>
  <Card title="다중 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    길드와 채널을 에이전트에 매핑합니다.
  </Card>
  <Card title="슬래시 명령" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작입니다.
  </Card>
</CardGroup>
