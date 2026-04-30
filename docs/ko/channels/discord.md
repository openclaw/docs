---
read_when:
    - Discord 채널 기능 작업
summary: Discord 봇 지원 상태, 기능 및 설정
title: Discord
x-i18n:
    generated_at: "2026-04-30T06:16:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

공식 Discord Gateway를 통해 DM과 길드 채널을 사용할 준비가 되어 있습니다.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord DM은 기본적으로 페어링 모드로 설정됩니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작과 명령 카탈로그입니다.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/ko/channels/troubleshooting">
    채널 간 진단 및 복구 흐름입니다.
  </Card>
</CardGroup>

## 빠른 설정

봇이 포함된 새 애플리케이션을 만들고, 봇을 서버에 추가한 다음, OpenClaw에 페어링해야 합니다. 봇은 개인 서버에 추가하는 것을 권장합니다. 아직 서버가 없다면 [먼저 생성하세요](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** 선택).

<Steps>
  <Step title="Discord 애플리케이션과 봇 생성">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동하여 **New Application**을 클릭합니다. 이름은 "OpenClaw"처럼 지정합니다.

    사이드바에서 **Bot**을 클릭합니다. **Username**을 OpenClaw 에이전트에 사용할 이름으로 설정합니다.

  </Step>

  <Step title="권한 있는 인텐트 활성화">
    계속 **Bot** 페이지에서 아래로 스크롤하여 **Privileged Gateway Intents**로 이동한 다음 다음을 활성화합니다.

    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장, 역할 허용 목록 및 이름-ID 매칭에 필요)
    - **Presence Intent** (선택 사항, 프레즌스 업데이트에만 필요)

  </Step>

  <Step title="봇 토큰 복사">
    **Bot** 페이지에서 다시 위로 스크롤하고 **Reset Token**을 클릭합니다.

    <Note>
    이름과 달리, 이것은 첫 번째 토큰을 생성합니다. 실제로 "재설정"되는 것은 없습니다.
    </Note>

    토큰을 복사해 어딘가에 저장합니다. 이것이 **Bot Token**이며 곧 필요합니다.

  </Step>

  <Step title="초대 URL 생성 및 서버에 봇 추가">
    사이드바에서 **OAuth2**를 클릭합니다. 봇을 서버에 추가하는 데 필요한 올바른 권한이 포함된 초대 URL을 생성합니다.

    아래로 스크롤하여 **OAuth2 URL Generator**로 이동한 다음 다음을 활성화합니다.

    - `bot`
    - `applications.commands`

    아래에 **Bot Permissions** 섹션이 표시됩니다. 최소한 다음을 활성화합니다.

    **일반 권한**
      - 채널 보기
    **텍스트 권한**
      - 메시지 보내기
      - 메시지 기록 읽기
      - 링크 임베드
      - 파일 첨부
      - 반응 추가 (선택 사항)

    일반 텍스트 채널을 위한 기본 권한 세트입니다. 포럼 또는 미디어 채널 워크플로처럼 스레드를 만들거나 이어 가는 경우를 포함해 Discord 스레드에 게시할 계획이라면 **Send Messages in Threads**도 활성화하세요.
    하단에 생성된 URL을 복사해 브라우저에 붙여넣고, 서버를 선택한 다음 **Continue**를 클릭해 연결합니다. 이제 Discord 서버에서 봇을 볼 수 있어야 합니다.

  </Step>

  <Step title="Developer Mode 활성화 및 ID 수집">
    Discord 앱으로 돌아가 내부 ID를 복사할 수 있도록 Developer Mode를 활성화해야 합니다.

    1. **User Settings**(아바타 옆 톱니바퀴 아이콘) → **Advanced** → **Developer Mode** 토글 켜기
    2. 사이드바에서 **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Copy Server ID**
    3. **자신의 아바타**를 마우스 오른쪽 버튼으로 클릭 → **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장하세요. 다음 단계에서 세 가지 모두를 OpenClaw에 보냅니다.

  </Step>

  <Step title="서버 멤버의 DM 허용">
    페어링이 작동하려면 Discord가 봇이 사용자에게 DM을 보낼 수 있도록 허용해야 합니다. **서버 아이콘**을 마우스 오른쪽 버튼으로 클릭 → **Privacy Settings** → **Direct Messages** 토글 켜기.

    이렇게 하면 서버 멤버(봇 포함)가 사용자에게 DM을 보낼 수 있습니다. OpenClaw와 함께 Discord DM을 사용하려면 이 설정을 켜 둡니다. 길드 채널만 사용할 계획이라면 페어링 후 DM을 비활성화할 수 있습니다.

  </Step>

  <Step title="봇 토큰을 안전하게 설정(채팅으로 보내지 마세요)">
    Discord 봇 토큰은 비밀번호와 같은 비밀입니다. 에이전트에게 메시지를 보내기 전에 OpenClaw를 실행하는 머신에 설정하세요.

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

    OpenClaw가 이미 백그라운드 서비스로 실행 중이라면 OpenClaw Mac 앱을 통해 재시작하거나 `openclaw gateway run` 프로세스를 중지한 뒤 다시 시작하세요.
    관리형 서비스 설치의 경우 `DISCORD_BOT_TOKEN`이 있는 셸에서 `openclaw gateway install`을 실행하거나 변수를 `~/.openclaw/.env`에 저장하여 재시작 후 서비스가 env SecretRef를 확인할 수 있도록 합니다.
    호스트가 Discord의 시작 애플리케이션 조회에 의해 차단되거나 속도 제한을 받는 경우, 시작 시 해당 REST 호출을 건너뛸 수 있도록 Developer Portal의 Discord 애플리케이션/클라이언트 ID를 설정하세요. 기본 계정에는 `channels.discord.applicationId`를 사용하고, 여러 Discord 봇을 실행할 때는 `channels.discord.accounts.<accountId>.applicationId`를 사용합니다.

  </Step>

  <Step title="OpenClaw 구성 및 페어링">

    <Tabs>
      <Tab title="에이전트에게 요청">
        기존 채널(예: Telegram)에서 OpenClaw 에이전트와 채팅하고 요청하세요. Discord가 첫 번째 채널이라면 대신 CLI / 구성 탭을 사용하세요.

        > "이미 구성에 Discord 봇 토큰을 설정했습니다. User ID `<user_id>` 및 Server ID `<server_id>`로 Discord 설정을 완료해 주세요."
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

        기본 계정에 대한 env 폴백:

```bash
DISCORD_BOT_TOKEN=...
```

        스크립트 기반 또는 원격 설정의 경우 동일한 JSON5 블록을 `openclaw config patch --file ./discord.patch.json5 --dry-run`으로 작성한 다음 `--dry-run` 없이 다시 실행합니다. 평문 `token` 값이 지원됩니다. env/file/exec 제공자 전반에서 `channels.discord.token`에 SecretRef 값도 지원됩니다. [비밀 관리](/ko/gateway/secrets)를 참조하세요.

        여러 Discord 봇의 경우 각 봇 토큰과 애플리케이션 ID를 해당 계정 아래에 유지하세요. 최상위 `channels.discord.applicationId`는 계정에 상속되므로 모든 계정이 동일한 애플리케이션 ID를 사용해야 할 때만 거기에 설정하세요.

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
토큰 확인은 계정 인식 방식입니다. 구성 토큰 값이 env 폴백보다 우선합니다. `DISCORD_BOT_TOKEN`은 기본 계정에만 사용됩니다.
활성화된 두 Discord 계정이 동일한 봇 토큰으로 확인되면 OpenClaw는 해당 토큰에 대해 Gateway 모니터를 하나만 시작합니다. 구성에서 제공된 토큰이 기본 env 폴백보다 우선하며, 그렇지 않으면 첫 번째 활성 계정이 우선하고 중복 계정은 비활성화된 것으로 보고됩니다.
고급 아웃바운드 호출(메시지 도구/채널 작업)의 경우 명시적인 호출별 `token`이 해당 호출에 사용됩니다. 이는 보내기 및 읽기/프로브 스타일 작업(예: 읽기/검색/가져오기/스레드/핀/권한)에 적용됩니다. 계정 정책/재시도 설정은 여전히 활성 런타임 스냅샷에서 선택된 계정에서 가져옵니다.
</Note>

## 권장: 길드 워크스페이스 설정

DM이 작동하면 Discord 서버를 전체 워크스페이스로 설정할 수 있으며, 각 채널은 자체 컨텍스트를 가진 고유한 에이전트 세션을 갖게 됩니다. 사용자와 봇만 있는 개인 서버에 권장됩니다.

<Steps>
  <Step title="길드 허용 목록에 서버 추가">
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
    기본적으로 에이전트는 길드 채널에서 @멘션된 경우에만 응답합니다. 개인 서버라면 모든 메시지에 응답하도록 하고 싶을 가능성이 높습니다.

    길드 채널에서는 일반적인 어시스턴트 최종 답변이 기본적으로 비공개로 유지됩니다. 보이는 Discord 출력은 `message` 도구로 명시적으로 보내야 하므로, 에이전트는 기본적으로 지켜보다가 채널 답장이 유용하다고 판단할 때만 게시할 수 있습니다.

    <Tabs>
      <Tab title="에이전트에게 요청">
        > "내 에이전트가 @멘션 없이 이 서버에서 응답할 수 있게 해 주세요"
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

        그룹/채널 방에 대한 레거시 자동 최종 답변을 복원하려면 `messages.groupChat.visibleReplies: "automatic"`을 설정하세요.

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
        모든 채널에서 공유 컨텍스트가 필요하면 안정적인 지침을 `AGENTS.md` 또는 `USER.md`에 넣으세요(모든 세션에 주입됩니다). 장기 노트는 `MEMORY.md`에 보관하고 필요할 때 메모리 도구로 접근하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord 서버에 채널을 몇 개 만들고 채팅을 시작하세요. 에이전트는 채널 이름을 볼 수 있으며, 각 채널은 자체 격리된 세션을 갖습니다. 따라서 워크플로에 맞게 `#coding`, `#home`, `#research` 또는 원하는 채널을 설정할 수 있습니다.

## 런타임 모델

- Gateway가 Discord 연결을 소유합니다.
- 답장 라우팅은 결정적입니다. Discord 인바운드 답장은 Discord로 돌아갑니다.
- Discord 길드/채널 메타데이터는 사용자에게 보이는 답장 접두사가 아니라 신뢰할 수 없는
  컨텍스트로 모델 프롬프트에 추가됩니다. 모델이 해당 봉투를 다시 복사하면
  OpenClaw는 아웃바운드 답장과 향후 재생 컨텍스트에서 복사된 메타데이터를 제거합니다.
- 기본적으로(`session.dmScope=main`) 직접 채팅은 에이전트 기본 세션(`agent:main:main`)을 공유합니다.
- 길드 채널은 격리된 세션 키입니다(`agent:<agentId>:discord:channel:<channelId>`).
- 그룹 DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- 네이티브 슬래시 명령은 격리된 명령 세션(`agent:<agentId>:discord:slash:<userId>`)에서 실행되며, 라우팅된 대화 세션으로 `CommandTargetSessionKey`를 계속 전달합니다.
- Discord로 전달되는 텍스트 전용 cron/heartbeat 알림은 최종
  어시스턴트 표시 답변을 한 번 사용합니다. 미디어 및 구조화된 컴포넌트 페이로드는
  에이전트가 전달 가능한 페이로드를 여러 개 내보낼 때 다중 메시지로 유지됩니다.

## 포럼 채널

Discord 포럼 및 미디어 채널은 스레드 게시물만 허용합니다. OpenClaw는 이를 생성하는 두 가지 방법을 지원합니다.

- 포럼 상위(`channel:<forumId>`)로 메시지를 보내 스레드를 자동 생성합니다. 스레드 제목은 메시지의 첫 번째 비어 있지 않은 줄을 사용합니다.
- `openclaw message thread create`를 사용해 스레드를 직접 생성합니다. 포럼 채널에는 `--message-id`를 전달하지 마세요.

예: 포럼 상위로 보내 스레드 생성

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

예: 포럼 스레드를 명시적으로 생성

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

포럼 상위는 Discord 컴포넌트를 허용하지 않습니다. 컴포넌트가 필요하면 스레드 자체(`channel:<threadId>`)로 보내세요.

## 대화형 컴포넌트

OpenClaw는 에이전트 메시지에 대해 Discord 컴포넌트 v2 컨테이너를 지원합니다. `components` 페이로드와 함께 메시지 도구를 사용하세요. 상호작용 결과는 일반 인바운드 메시지처럼 에이전트로 다시 라우팅되며 기존 Discord `replyToMode` 설정을 따릅니다.

지원되는 블록:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 작업 행은 최대 5개의 버튼 또는 단일 선택 메뉴를 허용합니다
- 선택 유형: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 컴포넌트는 한 번만 사용할 수 있습니다. 버튼, 선택 항목, 양식을 만료될 때까지 여러 번 사용할 수 있게 하려면 `components.reusable=true`를 설정하세요.

버튼을 클릭할 수 있는 사용자를 제한하려면 해당 버튼에 `allowedUsers`를 설정하세요(Discord 사용자 ID, 태그 또는 `*`). 구성되면 일치하지 않는 사용자는 일시적 거부 메시지를 받습니다.

`/model` 및 `/models` 슬래시 명령은 제공자, 모델, 호환되는 런타임 드롭다운과 제출 단계가 있는 대화형 모델 선택기를 엽니다. `/models add`는 더 이상 사용되지 않으며 이제 채팅에서 모델을 등록하는 대신 지원 중단 메시지를 반환합니다. 선택기 답장은 일시적이며 호출한 사용자만 사용할 수 있습니다.

파일 첨부:

- `file` 블록은 첨부 참조(`attachment://<filename>`)를 가리켜야 합니다
- `media`/`path`/`filePath`(단일 파일)를 통해 첨부를 제공하세요. 여러 파일에는 `media-gallery`를 사용하세요
- 업로드 이름이 첨부 참조와 일치해야 할 때는 `filename`을 사용해 재정의하세요

모달 양식:

- 최대 5개 필드가 있는 `components.modal`을 추가하세요
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

## 접근 제어 및 라우팅

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy`는 DM 접근을 제어합니다. `channels.discord.allowFrom`은 정식 DM 허용 목록입니다.

    - `pairing`(기본값)
    - `allowlist`
    - `open`(`channels.discord.allowFrom`에 `"*"`가 포함되어야 함)
    - `disabled`

    DM 정책이 열려 있지 않으면 알 수 없는 사용자는 차단됩니다(또는 `pairing` 모드에서 페어링하라는 안내를 받습니다).

    다중 계정 우선순위:

    - `channels.discord.accounts.default.allowFrom`은 `default` 계정에만 적용됩니다.
    - 계정이 하나인 경우 `allowFrom`이 레거시 `dm.allowFrom`보다 우선합니다.
    - 이름이 지정된 계정은 자체 `allowFrom`과 레거시 `dm.allowFrom`이 설정되지 않은 경우 `channels.discord.allowFrom`을 상속합니다.
    - 이름이 지정된 계정은 `channels.discord.accounts.default.allowFrom`을 상속하지 않습니다.

    레거시 `channels.discord.dm.policy` 및 `channels.discord.dm.allowFrom`은 호환성을 위해 여전히 읽습니다. `openclaw doctor --fix`는 접근을 변경하지 않고 수행할 수 있을 때 이를 `dmPolicy`와 `allowFrom`으로 마이그레이션합니다.

    전달용 DM 대상 형식:

    - `user:<id>`
    - `<@id>` 멘션

    채널 기본값이 활성화되어 있으면 순수 숫자 ID는 일반적으로 채널 ID로 해석되지만, 계정의 유효 DM `allowFrom`에 나열된 ID는 호환성을 위해 사용자 DM 대상으로 처리됩니다.

  </Tab>

  <Tab title="Guild policy">
    길드 처리는 `channels.discord.groupPolicy`로 제어됩니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord`가 있을 때의 보안 기준선은 `allowlist`입니다.

    `allowlist` 동작:

    - 길드는 `channels.discord.guilds`와 일치해야 합니다(`id` 권장, 슬러그 허용)
    - 선택적 발신자 허용 목록: `users`(안정적인 ID 권장) 및 `roles`(역할 ID만). 둘 중 하나가 구성된 경우 발신자가 `users` 또는 `roles`와 일치하면 허용됩니다
    - 직접 이름/태그 매칭은 기본적으로 비활성화되어 있습니다. 긴급 호환 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 활성화하세요
    - `users`에는 이름/태그가 지원되지만 ID가 더 안전합니다. 이름/태그 항목이 사용되면 `openclaw security audit`가 경고합니다
    - 길드에 `channels`가 구성되어 있으면 목록에 없는 채널은 거부됩니다
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

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 블록을 만들지 않으면, `channels.defaults.groupPolicy`가 `open`이더라도 런타임 폴백은 `groupPolicy="allowlist"`입니다(로그에 경고가 표시됨).

  </Tab>

  <Tab title="Mentions and group DMs">
    길드 메시지는 기본적으로 멘션 게이트가 적용됩니다.

    멘션 감지에는 다음이 포함됩니다.

    - 명시적 봇 멘션
    - 구성된 멘션 패턴(`agents.list[].groupChat.mentionPatterns`, 폴백 `messages.groupChat.mentionPatterns`)
    - 지원되는 경우의 암시적 봇 답장 동작

    `requireMention`은 길드/채널별로 구성됩니다(`channels.discord.guilds...`).
    `ignoreOtherMentions`는 선택적으로 다른 사용자/역할을 멘션하지만 봇은 멘션하지 않는 메시지를 삭제합니다(@everyone/@here 제외).

    그룹 DM:

    - 기본값: 무시됨(`dm.groupEnabled=false`)
    - `dm.groupChannels`를 통한 선택적 허용 목록(채널 ID 또는 슬러그)

  </Tab>
</Tabs>

### 역할 기반 에이전트 라우팅

역할 ID별로 Discord 길드 멤버를 다른 에이전트로 라우팅하려면 `bindings[].match.roles`를 사용하세요. 역할 기반 바인딩은 역할 ID만 허용하며 피어 또는 상위 피어 바인딩 이후, 길드 전용 바인딩 이전에 평가됩니다. 바인딩이 다른 매치 필드도 설정하는 경우(예: `peer` + `guildId` + `roles`) 구성된 모든 필드가 일치해야 합니다.

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

- `commands.native`는 기본값이 `"auto"`이며 Discord에 대해 활성화됩니다.
- 채널별 재정의: `channels.discord.commands.native`.
- `commands.native=false`는 이전에 등록된 Discord 네이티브 명령을 명시적으로 지웁니다.
- 네이티브 명령 인증은 일반 메시지 처리와 동일한 Discord 허용 목록/정책을 사용합니다.
- 권한이 없는 사용자에게도 Discord UI에서 명령이 표시될 수 있습니다. 실행 시에는 여전히 OpenClaw 인증이 적용되며 "not authorized"를 반환합니다.

명령 카탈로그와 동작은 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

기본 슬래시 명령 설정:

- `ephemeral: true`

## 기능 세부 정보

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord는 에이전트 출력에서 답장 태그를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode`로 제어됩니다.

    - `off`(기본값)
    - `first`
    - `all`
    - `batched`

    참고: `off`는 암시적 답장 스레딩을 비활성화합니다. 명시적 `[[reply_to_*]]` 태그는 계속 적용됩니다.
    `first`는 턴의 첫 번째 아웃바운드 Discord 메시지에 항상 암시적 네이티브 답장 참조를 첨부합니다.
    `batched`는 인바운드 턴이 여러 메시지의 디바운스된 배치였을 때만
    Discord의 암시적 네이티브 답장 참조를 첨부합니다. 이는 모든
    단일 메시지 턴이 아니라, 주로 모호하고 짧은 시간에 몰리는 채팅에 네이티브 답장을 사용하려는 경우 유용합니다.

    에이전트가 특정 메시지를 대상으로 지정할 수 있도록 메시지 ID가 컨텍스트/기록에 표시됩니다.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw는 임시 메시지를 보내고 텍스트가 도착할 때 이를 편집하여 초안 답장을 스트리밍할 수 있습니다. `channels.discord.streaming`은 `off`(기본값) | `partial` | `block` | `progress`를 받습니다. Discord에서 `progress`는 `partial`로 매핑됩니다. `streamMode`는 레거시 별칭이며 자동 마이그레이션됩니다.

    여러 봇 또는 Gateway가 계정을 공유할 때 Discord 미리보기 편집이 속도 제한에 빠르게 도달하므로 기본값은 `off`로 유지됩니다.

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

    - `partial`은 토큰이 도착할 때 단일 미리보기 메시지를 편집합니다.
    - `block`은 초안 크기의 청크를 내보냅니다(`draftChunk`를 사용해 크기와 중단 지점을 조정하며, `textChunkLimit`로 제한됨).
    - 미디어, 오류, 명시적 답장 최종 메시지는 보류 중인 미리보기 편집을 취소합니다.
    - `streaming.preview.toolProgress`(기본값 `true`)는 도구/진행률 업데이트가 미리보기 메시지를 재사용할지 여부를 제어합니다.

    미리보기 스트리밍은 텍스트 전용입니다. 미디어 답장은 일반 전달로 폴백합니다. `block` 스트리밍이 명시적으로 활성화되면 OpenClaw는 이중 스트리밍을 피하기 위해 미리보기 스트림을 건너뜁니다.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    길드 기록 컨텍스트:

    - `channels.discord.historyLimit` 기본값 `20`
    - 폴백: `messages.groupChat.historyLimit`
    - `0`은 비활성화

    DM 기록 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    스레드 동작:

    - Discord 스레드는 채널 세션으로 라우팅되며, 재정의하지 않는 한 부모 채널 구성을 상속합니다.
    - 스레드 세션은 부모 채널의 세션 수준 `/model` 선택을 모델 전용 대체값으로 상속합니다. 스레드 로컬 `/model` 선택이 여전히 우선하며, 기록 상속이 활성화되지 않는 한 부모 기록 내역은 복사되지 않습니다.
    - `channels.discord.thread.inheritParent`(기본값 `false`)는 새 자동 스레드가 부모 기록에서 시드되도록 선택합니다. 계정별 재정의는 `channels.discord.accounts.<id>.thread.inheritParent` 아래에 있습니다.
    - 메시지 도구 반응은 `user:<id>` DM 대상을 해석할 수 있습니다.
    - `guilds.<guild>.channels.<channel>.requireMention: false`는 응답 단계 활성화 대체 중에도 보존됩니다.

    채널 주제는 **신뢰할 수 없는** 컨텍스트로 주입됩니다. 허용 목록은 누가 에이전트를 트리거할 수 있는지를 제한할 뿐, 전체 보조 컨텍스트 삭제 경계가 아닙니다.

  </Accordion>

  <Accordion title="하위 에이전트를 위한 스레드 바인딩 세션">
    Discord는 스레드를 세션 대상에 바인딩하여 해당 스레드의 후속 메시지가 같은 세션(하위 에이전트 세션 포함)으로 계속 라우팅되도록 할 수 있습니다.

    명령:

    - `/focus <target>` 현재/새 스레드를 하위 에이전트/세션 대상에 바인딩
    - `/unfocus` 현재 스레드 바인딩 제거
    - `/agents` 활성 실행과 바인딩 상태 표시
    - `/session idle <duration|off>` 포커스된 바인딩의 비활성 자동 언포커스 검사/업데이트
    - `/session max-age <duration|off>` 포커스된 바인딩의 엄격한 최대 수명 검사/업데이트

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
    - ACP(`/acp spawn ... --thread ...` 또는 `sessions_spawn({ runtime: "acp", thread: true })`)에 대해 스레드를 자동 생성/바인딩하려면 `spawnAcpSessions`가 true여야 합니다.
    - 계정에서 스레드 바인딩이 비활성화되어 있으면 `/focus` 및 관련 스레드 바인딩 작업을 사용할 수 없습니다.

    [하위 에이전트](/ko/tools/subagents), [ACP 에이전트](/ko/tools/acp-agents), [구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

  </Accordion>

  <Accordion title="영구 ACP 채널 바인딩">
    안정적인 "always-on" ACP 작업 공간의 경우 Discord 대화를 대상으로 하는 최상위 typed ACP 바인딩을 구성하세요.

    구성 경로:

    - `type: "acp"` 및 `match.channel: "discord"`가 있는 `bindings[]`

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

    - `/acp spawn codex --bind here`는 현재 채널 또는 스레드를 그 자리에서 바인딩하고 이후 메시지를 같은 ACP 세션에 유지합니다. 스레드 메시지는 부모 채널 바인딩을 상속합니다.
    - 바인딩된 채널 또는 스레드에서 `/new`와 `/reset`은 같은 ACP 세션을 그 자리에서 재설정합니다. 임시 스레드 바인딩은 활성 상태인 동안 대상 해석을 재정의할 수 있습니다.
    - `spawnAcpSessions`는 OpenClaw가 `--thread auto|here`를 통해 하위 스레드를 생성/바인딩해야 할 때만 필요합니다.

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
    `ackReaction`은 OpenClaw가 인바운드 메시지를 처리하는 동안 확인 이모지를 보냅니다.

    해석 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 에이전트 ID 이모지 대체값(`agents.list[].identity.emoji`, 없으면 "👀")

    참고:

    - Discord는 유니코드 이모지 또는 사용자 지정 이모지 이름을 허용합니다.
    - 채널 또는 계정의 반응을 비활성화하려면 `""`를 사용하세요.

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
    `channels.discord.proxy`를 사용해 Discord gateway WebSocket 트래픽과 시작 REST 조회(애플리케이션 ID + 허용 목록 해석)를 HTTP(S) 프록시를 통해 라우팅합니다.

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
    프록시된 메시지를 시스템 멤버 ID에 매핑하려면 PluralKit 해석을 활성화하세요.

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
    - 조회는 원본 메시지 ID를 사용하며 시간 창의 제약을 받습니다.
    - 조회가 실패하면 프록시된 메시지는 봇 메시지로 처리되어 `allowBots=true`가 아닌 한 삭제됩니다.

  </Accordion>

  <Accordion title="Presence 구성">
    상태 또는 활동 필드를 설정하거나 자동 Presence를 활성화하면 Presence 업데이트가 적용됩니다.

    상태만 설정하는 예:

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
    - 2: 청취 중
    - 3: 시청 중
    - 4: 사용자 지정(활동 텍스트를 상태 state로 사용, 이모지는 선택 사항)
    - 5: 경쟁 중

    자동 Presence 예(런타임 상태 신호):

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

    자동 Presence는 런타임 가용성을 Discord 상태에 매핑합니다. 정상 => 온라인, 저하 또는 알 수 없음 => 자리 비움, 소진 또는 사용할 수 없음 => dnd. 선택적 텍스트 재정의:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`(`{reason}` 플레이스홀더 지원)

  </Accordion>

  <Accordion title="Discord의 승인">
    Discord는 DM에서 버튼 기반 승인 처리를 지원하며, 선택적으로 원래 채널에 승인 프롬프트를 게시할 수 있습니다.

    구성 경로:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`(선택 사항, 가능한 경우 `commands.ownerAllowFrom`으로 대체)
    - `channels.discord.execApprovals.target`(`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled`가 설정되지 않았거나 `"auto"`이고 `execApprovals.approvers` 또는 `commands.ownerAllowFrom`에서 승인자를 하나 이상 해석할 수 있으면 Discord는 네이티브 exec 승인을 자동 활성화합니다. Discord는 채널 `allowFrom`, 레거시 `dm.allowFrom`, 또는 직접 메시지 `defaultTo`에서 exec 승인자를 추론하지 않습니다. Discord를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요.

    `/diagnostics` 및 `/export-trajectory` 같은 민감한 소유자 전용 그룹 명령의 경우 OpenClaw는 승인 프롬프트와 최종 결과를 비공개로 보냅니다. 호출한 소유자에게 Discord 소유자 라우트가 있으면 먼저 Discord DM을 시도하고, 사용할 수 없으면 Telegram 같은 `commands.ownerAllowFrom`의 첫 번째 사용 가능한 소유자 라우트로 대체합니다.

    `target`이 `channel` 또는 `both`이면 승인 프롬프트가 채널에 표시됩니다. 해석된 승인자만 버튼을 사용할 수 있으며, 다른 사용자는 임시 거부 메시지를 받습니다. 승인 프롬프트에는 명령 텍스트가 포함되므로 신뢰할 수 있는 채널에서만 채널 전달을 활성화하세요. 세션 키에서 채널 ID를 파생할 수 없으면 OpenClaw는 DM 전달로 대체합니다.

    Discord는 다른 채팅 채널에서 사용하는 공유 승인 버튼도 렌더링합니다. 네이티브 Discord 어댑터는 주로 승인자 DM 라우팅과 채널 팬아웃을 추가합니다.
    해당 버튼이 있으면 기본 승인 UX입니다. OpenClaw는
    도구 결과가 채팅 승인을 사용할 수 없다고 하거나 수동 승인이 유일한 경로라고 할 때만
    수동 `/approve` 명령을 포함해야 합니다.
    Discord 네이티브 승인 런타임이 활성 상태가 아니면 OpenClaw는
    로컬의 결정적 `/approve <id> <decision>` 프롬프트를 계속 표시합니다.
    런타임은 활성 상태이지만 네이티브 카드를 어떤 대상에도 전달할 수 없으면
    OpenClaw는 대기 중인 승인에서 가져온 정확한 `/approve`
    명령이 포함된 동일 채팅 대체 알림을 보냅니다.

    Gateway 인증 및 승인 해석은 공유 Gateway 클라이언트 계약을 따릅니다(`plugin:` ID는 `plugin.approval.resolve`를 통해, 다른 ID는 `exec.approval.resolve`를 통해 해석). 승인은 기본적으로 30분 후 만료됩니다.

    [Exec 승인](/ko/tools/exec-approvals)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 도구 및 작업 게이트

Discord 메시지 작업에는 메시징, 채널 관리, 모더레이션, Presence, 메타데이터 작업이 포함됩니다.

핵심 예:

- 메시징: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- 반응: `react`, `reactions`, `emojiList`
- 모더레이션: `timeout`, `kick`, `ban`
- Presence: `setPresence`

`event-create` 작업은 예정된 이벤트 커버 이미지를 설정하기 위해 선택적 `image` 매개변수(URL 또는 로컬 파일 경로)를 허용합니다.

작업 게이트는 `channels.discord.actions.*` 아래에 있습니다.

기본 게이트 동작:

| 작업 그룹                                                                                                                                                                | 기본값       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 활성화됨     |
| roles                                                                                                                                                                    | 비활성화됨   |
| moderation                                                                                                                                                               | 비활성화됨   |
| presence                                                                                                                                                                 | 비활성화됨   |

## 구성 요소 v2 UI

OpenClaw는 실행 승인 및 교차 컨텍스트 마커에 Discord 구성 요소 v2를 사용합니다. Discord 메시지 작업은 사용자 지정 UI를 위해 `components`도 받을 수 있습니다(고급 기능이며, discord 도구를 통해 구성 요소 페이로드를 구성해야 함). 기존 `embeds`도 계속 사용할 수 있지만 권장되지는 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord 구성 요소 컨테이너에서 사용하는 강조 색상(hex)을 설정합니다.
- 계정별로 `channels.discord.accounts.<id>.ui.components.accentColor`로 설정합니다.
- 구성 요소 v2가 있으면 `embeds`는 무시됩니다.

예:

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

Discord에는 서로 다른 두 가지 음성 표면이 있습니다. 실시간 **음성 채널**(연속 대화)과 **음성 메시지 첨부 파일**(파형 미리보기 형식)입니다. Gateway는 둘 다 지원합니다.

### 음성 채널

설정 체크리스트:

1. Discord Developer Portal에서 Message Content Intent를 활성화합니다.
2. 역할/사용자 허용 목록을 사용할 때 Server Members Intent를 활성화합니다.
3. `bot` 및 `applications.commands` 범위로 봇을 초대합니다.
4. 대상 음성 채널에서 Connect, Speak, Send Messages, Read Message History 권한을 부여합니다.
5. 네이티브 명령(`commands.native` 또는 `channels.discord.commands.native`)을 활성화합니다.
6. `channels.discord.voice`를 구성합니다.

세션을 제어하려면 `/vc join|leave|status`를 사용합니다. 이 명령은 계정 기본 에이전트를 사용하며 다른 Discord 명령과 동일한 허용 목록 및 그룹 정책 규칙을 따릅니다.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

자동 참여 예:

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

- `voice.tts`는 음성 재생에만 `messages.tts`를 재정의합니다.
- `voice.model`은 Discord 음성 채널 응답에 사용되는 LLM에만 적용됩니다. 라우팅된 에이전트 모델을 상속하려면 설정하지 않은 상태로 둡니다.
- STT는 `tools.media.audio`를 사용합니다. `voice.model`은 전사에 영향을 주지 않습니다.
- 음성 전사 턴은 Discord `allowFrom`(또는 `dm.allowFrom`)에서 소유자 상태를 파생합니다. 소유자가 아닌 발화자는 소유자 전용 도구(예: `gateway`, `cron`)에 접근할 수 없습니다.
- 음성은 기본적으로 활성화됩니다. 음성 런타임과 `GuildVoiceStates` gateway intent를 비활성화하려면 `channels.discord.voice.enabled=false`를 설정합니다.
- `channels.discord.intents.voiceStates`는 음성 상태 intent 구독을 명시적으로 재정의할 수 있습니다. intent가 `voice.enabled`를 따르도록 하려면 설정하지 않은 상태로 둡니다.
- `voice.daveEncryption` 및 `voice.decryptionFailureTolerance`는 `@discordjs/voice` 참여 옵션으로 그대로 전달됩니다.
- 설정하지 않으면 `@discordjs/voice` 기본값은 `daveEncryption=true` 및 `decryptionFailureTolerance=24`입니다.
- OpenClaw는 수신 복호화 실패도 감시하며, 짧은 시간 안에 실패가 반복되면 음성 채널을 나갔다가 다시 참여하여 자동 복구합니다.
- 업데이트 후 수신 로그에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복적으로 표시되면 의존성 보고서와 로그를 수집하세요. 번들된 `@discordjs/voice` 라인에는 discord.js 이슈 #11419를 닫은 discord.js PR #11449의 업스트림 패딩 수정이 포함되어 있습니다.

음성 채널 파이프라인:

- Discord PCM 캡처가 WAV 임시 파일로 변환됩니다.
- `tools.media.audio`가 STT를 처리합니다. 예: `openai/gpt-4o-mini-transcribe`.
- 전사는 일반 Discord 인그레스 및 라우팅을 통해 전송됩니다.
- `voice.model`이 설정된 경우 이 음성 채널 턴의 응답 LLM만 재정의합니다.
- `voice.tts`가 `messages.tts` 위에 병합되며, 결과 오디오는 참여 중인 채널에서 재생됩니다.

자격 증명은 구성 요소별로 해결됩니다. `voice.model`의 LLM 라우트 인증, `tools.media.audio`의 STT 인증, `messages.tts`/`voice.tts`의 TTS 인증입니다.

### 음성 메시지

Discord 음성 메시지는 파형 미리보기를 표시하며 OGG/Opus 오디오가 필요합니다. OpenClaw는 파형을 자동으로 생성하지만, 검사 및 변환을 위해 Gateway 호스트에 `ffmpeg`와 `ffprobe`가 필요합니다.

- **로컬 파일 경로**를 제공합니다(URL은 거부됨).
- 텍스트 콘텐츠는 생략합니다(Discord는 동일한 페이로드의 텍스트 + 음성 메시지를 거부함).
- 모든 오디오 형식을 사용할 수 있으며, OpenClaw가 필요에 따라 OGG/Opus로 변환합니다.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 문제 해결

<AccordionGroup>
  <Accordion title="허용되지 않은 intent를 사용했거나 봇이 길드 메시지를 보지 못함">

    - Message Content Intent를 활성화합니다.
    - 사용자/멤버 확인에 의존하는 경우 Server Members Intent를 활성화합니다.
    - intent를 변경한 후 gateway를 다시 시작합니다.

  </Accordion>

  <Accordion title="길드 메시지가 예기치 않게 차단됨">

    - `groupPolicy`를 확인합니다.
    - `channels.discord.guilds` 아래의 길드 허용 목록을 확인합니다.
    - 길드 `channels` 맵이 있으면 나열된 채널만 허용됩니다.
    - `requireMention` 동작 및 멘션 패턴을 확인합니다.

    유용한 확인:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention이 false인데도 계속 차단됨">
    일반적인 원인:

    - 일치하는 길드/채널 허용 목록 없이 `groupPolicy="allowlist"` 사용
    - `requireMention`이 잘못된 위치에 구성됨(`channels.discord.guilds` 아래 또는 채널 항목 아래에 있어야 함)
    - 발신자가 길드/채널 `users` 허용 목록에 의해 차단됨

  </Accordion>

  <Accordion title="오래 실행되는 Discord 턴 또는 중복 응답">

    일반적인 로그:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 큐 조정값:

    - 단일 계정: `channels.discord.eventQueue.listenerTimeout`
    - 다중 계정: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 이는 에이전트 턴 수명이 아니라 Discord Gateway 리스너 작업만 제어합니다.

    Discord는 대기열에 들어간 에이전트 턴에 채널 소유 타임아웃을 적용하지 않습니다. 메시지 리스너는 즉시 넘겨주며, 대기 중인 Discord 실행은 세션/도구/런타임 수명 주기가 완료되거나 작업을 중단할 때까지 세션별 순서를 보존합니다.

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
    OpenClaw는 연결 전에 Discord `/gateway/bot` 메타데이터를 가져옵니다. 일시적 실패는 Discord의 기본 gateway URL로 폴백되며 로그에서 속도 제한됩니다.

    메타데이터 타임아웃 조정값:

    - 단일 계정: `channels.discord.gatewayInfoTimeoutMs`
    - 다중 계정: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 구성이 설정되지 않은 경우 env 폴백: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 기본값: `30000`(30초), 최대: `120000`

  </Accordion>

  <Accordion title="권한 감사 불일치">
    `channels status --probe` 권한 검사는 숫자 채널 ID에서만 작동합니다.

    slug 키를 사용하는 경우 런타임 매칭은 여전히 작동할 수 있지만, probe는 권한을 완전히 확인할 수 없습니다.

  </Accordion>

  <Accordion title="DM 및 페어링 문제">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM 정책 비활성화: `channels.discord.dmPolicy="disabled"`(레거시: `channels.discord.dm.policy`)
    - `pairing` 모드에서 페어링 승인 대기 중

  </Accordion>

  <Accordion title="봇 간 루프">
    기본적으로 봇이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`를 설정하는 경우 루프 동작을 피하려면 엄격한 멘션 및 허용 목록 규칙을 사용하세요.
    봇을 멘션하는 봇 메시지만 허용하려면 `channels.discord.allowBots="mentions"`를 선호하세요.

  </Accordion>

  <Accordion title="DecryptionFailed(...)로 음성 STT가 누락됨">

    - Discord 음성 수신 복구 로직이 있도록 OpenClaw를 최신 상태로 유지합니다(`openclaw update`).
    - `channels.discord.voice.daveEncryption=true`(기본값)를 확인합니다.
    - `channels.discord.voice.decryptionFailureTolerance=24`(업스트림 기본값)에서 시작하고 필요한 경우에만 조정합니다.
    - 다음 로그를 확인합니다.
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 자동 재참여 후에도 실패가 계속되면 로그를 수집하고 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 및 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)의 업스트림 DAVE 수신 기록과 비교합니다.

  </Accordion>
</AccordionGroup>

## 구성 참조

기본 참조: [구성 참조 - Discord](/ko/gateway/config-channels#discord).

<Accordion title="핵심 Discord 필드">

- 시작/인증: `enabled`, `token`, `accounts.*`, `allowBots`
- 정책: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 명령: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 이벤트 큐: `eventQueue.listenerTimeout`(리스너 예산), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway 메타데이터: `gatewayInfoTimeoutMs`
- 응답/기록: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 전달: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 스트리밍: `streaming`(레거시 별칭: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 미디어/재시도: `mediaMaxMb`(아웃바운드 Discord 업로드 제한, 기본값 `100MB`), `retry`
- 작업: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 기능: `threadBindings`, 최상위 `bindings[]`(`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 안전 및 운영

- 봇 토큰은 비밀로 취급합니다(관리형 환경에서는 `DISCORD_BOT_TOKEN` 권장).
- 최소 권한 Discord 권한을 부여합니다.
- 명령 배포/상태가 오래된 경우 gateway를 다시 시작하고 `openclaw channels status --probe`로 다시 확인합니다.

## 관련

<CardGroup cols={2}>
  <Card title="페어링" icon="link" href="/ko/channels/pairing">
    Discord 사용자를 Gateway에 페어링합니다.
  </Card>
  <Card title="그룹" icon="users" href="/ko/channels/groups">
    그룹 채팅 및 허용 목록 동작.
  </Card>
  <Card title="채널 라우팅" icon="route" href="/ko/channels/channel-routing">
    수신 메시지를 에이전트로 라우팅합니다.
  </Card>
  <Card title="보안" icon="shield" href="/ko/gateway/security">
    위협 모델 및 강화.
  </Card>
  <Card title="멀티 에이전트 라우팅" icon="sitemap" href="/ko/concepts/multi-agent">
    길드와 채널을 에이전트에 매핑합니다.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/ko/tools/slash-commands">
    네이티브 명령 동작.
  </Card>
</CardGroup>
