---
read_when:
    - Mattermost 설정하기
    - Mattermost 라우팅 디버깅
sidebarTitle: Mattermost
summary: Mattermost 봇 설정 및 OpenClaw 구성
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T00:35:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

상태: 다운로드 가능한 Plugin(봇 토큰 + WebSocket 이벤트). 채널, 비공개 채널, 그룹 DM, DM을 지원합니다. Mattermost는 자체 호스팅할 수 있는 팀 메시징 플랫폼입니다([mattermost.com](https://mattermost.com)).

## 설치

<Tabs>
  <Tab title="npm 레지스트리">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="로컬 체크아웃">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

자세한 내용: [Plugin](/ko/tools/plugin)

## 빠른 설정

<Steps>
  <Step title="Plugin 사용 가능 여부 확인">
    위 명령으로 `@openclaw/mattermost`를 설치한 다음, Gateway가 이미 실행 중이면 다시 시작합니다.
  </Step>
  <Step title="Mattermost 봇 만들기">
    Mattermost 봇 계정을 만들고 **봇 토큰**을 복사한 후, 봇이 읽어야 하는 팀과 채널에 봇을 추가합니다.
  </Step>
  <Step title="기본 URL 복사">
    Mattermost **기본 URL**(예: `https://chat.example.com`)을 복사합니다. 끝에 붙은 `/api/v4`는 자동으로 제거됩니다.
  </Step>
  <Step title="OpenClaw 구성 및 Gateway 시작">
    최소 구성:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    비대화형 방식:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
비공개/LAN/테일넷 주소에서 자체 호스팅되는 Mattermost: 외부로 나가는 Mattermost API 요청은 기본적으로 비공개 및 내부 IP를 차단하는 SSRF 보호 장치를 통과합니다. `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true`를 설정하여 명시적으로 허용하세요(계정별 설정: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## 네이티브 슬래시 명령

네이티브 슬래시 명령은 명시적으로 활성화해야 합니다. 활성화하면 OpenClaw는 봇이 소속된 모든 팀에 `oc_*` 슬래시 명령을 등록하고 Gateway HTTP 서버에서 콜백 POST 요청을 수신합니다.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost가 Gateway에 직접 연결할 수 없을 때 사용합니다(리버스 프록시/공개 URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

등록되는 명령: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. `nativeSkills: true`를 설정하면 Skills 명령도 `/oc_<skill>` 형식으로 등록됩니다.

<AccordionGroup>
  <Accordion title="동작 참고 사항">
    - `native`와 `nativeSkills`의 기본값은 `"auto"`이며, Mattermost에서는 비활성화로 결정됩니다. 명시적으로 `true`로 설정하세요.
    - `callbackPath`의 기본값은 `/api/channels/mattermost/command`입니다.
    - `callbackUrl`을 생략하면 OpenClaw는 `http://<gateway.customBindHost 또는 localhost>:<gateway.port, 기본값 18789><callbackPath>`를 생성합니다. 와일드카드 바인드 호스트(`0.0.0.0`, `::`)는 `localhost`로 대체됩니다.
    - 다중 계정 설정에서는 `commands`를 최상위 수준이나 `channels.mattermost.accounts.<id>.commands` 아래에 설정할 수 있습니다(계정 값이 최상위 필드를 재정의함).
    - 다른 통합에서 동일한 트리거로 만든 기존 슬래시 명령은 변경하지 않습니다(등록 시 건너뜀). 봇이 만든 명령은 콜백 URL이 달라지면 업데이트하거나 다시 생성합니다.
    - 명령 콜백은 OpenClaw가 `oc_*` 명령을 등록할 때 Mattermost가 반환한 명령별 토큰으로 검증됩니다.
    - OpenClaw는 각 콜백을 수락하기 전에 현재 Mattermost 명령 등록 정보를 새로 고치므로, 삭제되거나 다시 생성된 슬래시 명령의 오래된 토큰은 Gateway를 다시 시작하지 않아도 더 이상 수락되지 않습니다.
    - Mattermost API에서 명령이 여전히 유효한지 확인할 수 없으면 콜백 검증은 닫힌 상태로 실패합니다. 실패한 검증은 잠시 캐시되고, 동시 조회는 하나로 병합되며, 재전송 압력을 제한하기 위해 명령별 새 조회 시작 횟수가 제한됩니다.
    - 등록에 실패했거나 시작이 부분적으로 완료되었거나 콜백 토큰이 확인된 명령의 등록 토큰과 일치하지 않으면 슬래시 콜백은 닫힌 상태로 실패합니다(한 명령에 유효한 토큰으로는 다른 명령의 상위 검증 단계에 도달할 수 없음).
    - 수락된 콜백에는 임시 "처리 중..." 응답으로 확인을 반환하며, 실제 답변은 일반 메시지로 전달됩니다.

  </Accordion>
  <Accordion title="접근 가능성 요구 사항">
    Mattermost 서버에서 콜백 엔드포인트에 접근할 수 있어야 합니다.

    - Mattermost가 OpenClaw와 동일한 호스트/네트워크 네임스페이스에서 실행되지 않는 한 `callbackUrl`을 `localhost`로 설정하지 마세요.
    - 해당 URL이 `/api/channels/mattermost/command`를 OpenClaw로 리버스 프록시하지 않는 한 `callbackUrl`을 Mattermost 기본 URL로 설정하지 마세요.
    - `curl https://<gateway-host>/api/channels/mattermost/command`로 빠르게 확인할 수 있습니다. GET 요청은 `404`가 아니라 OpenClaw의 `405 Method Not Allowed`를 반환해야 합니다.

  </Accordion>
  <Accordion title="Mattermost 외부 연결 허용 목록">
    콜백 대상이 비공개/테일넷/내부 주소인 경우 콜백 호스트/도메인을 포함하도록 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`를 설정합니다.

    전체 URL이 아닌 호스트/도메인 항목을 사용하세요.

    - 올바름: `gateway.tailnet-name.ts.net`
    - 잘못됨: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 환경 변수(기본 계정)

환경 변수를 선호한다면 Gateway 호스트에 다음을 설정하세요.

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
환경 변수는 **기본** 계정(`default`)에만 적용됩니다. 다른 계정은 구성 값을 사용해야 합니다.

`MATTERMOST_URL`은 작업 공간 `.env`에서 설정할 수 없습니다. [작업 공간 .env 파일](/ko/gateway/security)을 참조하세요.
</Note>

## 채팅 모드

Mattermost는 DM에 자동으로 응답합니다. 채널 동작은 `chatmode`로 제어합니다.

<Tabs>
  <Tab title="oncall(기본값)">
    채널에서 @멘션된 경우에만 응답합니다.
  </Tab>
  <Tab title="onmessage">
    모든 채널 메시지에 응답합니다.
  </Tab>
  <Tab title="onchar">
    메시지가 트리거 접두사로 시작할 때 응답합니다.
  </Tab>
</Tabs>

구성 예시:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // 기본값
    },
  },
}
```

참고:

- `onchar`에서도 명시적인 @멘션에 응답합니다.
- `channels.mattermost.requireMention`도 계속 적용되지만 `chatmode` 사용을 권장합니다. 채널별 `groups.<channelId>.requireMention` 설정은 두 설정보다 우선합니다.
- 봇이 채널 스레드에 표시되는 응답을 보낸 후에는 동일한 스레드의 후속 메시지에 새로운 @멘션이나 `onchar` 접두사가 없어도 응답하므로, 다중 대화 스레드가 계속 이어집니다. 참여 상태는 해당 스레드에서 봇이 마지막으로 응답한 후 7일 동안 기억되며 Gateway를 다시 시작해도 유지됩니다. 봇이 관찰만 한 스레드는 영향을 받지 않습니다. 다시 명시적인 멘션을 요구하려면 새로운 최상위 메시지를 시작하세요.

## 스레드 및 세션

`channels.mattermost.replyToMode`를 사용하여 채널 및 그룹 응답을 기본 채널에 유지할지, 트리거가 된 게시물 아래에 스레드를 시작할지 제어합니다.

- `off`(기본값): 수신 게시물이 이미 스레드에 있는 경우에만 스레드에서 응답합니다.
- `first`: 최상위 채널/그룹 게시물의 경우 해당 게시물 아래에 스레드를 시작하고 대화를 스레드 범위 세션으로 전달합니다.
- `all` 및 `batched`: 현재 Mattermost에서는 `first`와 동일하게 동작합니다. Mattermost에 스레드 루트가 생성되면 후속 청크와 미디어가 동일한 스레드에서 계속되기 때문입니다.
- `replyToMode`를 설정해도 다이렉트 메시지의 기본값은 `off`입니다.

`channels.mattermost.replyToModeByChatType`을 사용하여 `direct`, `group` 또는 `channel` 채팅의 모드를 재정의합니다. 다이렉트 메시지에서 스레드를 사용하려면 `direct`를 설정하세요.

- `off`(기본값): 다이렉트 메시지는 하나의 연속 세션에서 스레드 없이 유지됩니다.
- `first`, `all` 또는 `batched`: 각 최상위 다이렉트 메시지가 새로운 독립 세션을 사용하는 Mattermost 스레드를 시작합니다.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

참고:

- 스레드 범위 세션은 트리거가 된 게시물 ID를 스레드 루트로 사용합니다.
- 현재 `first`와 `all`은 동일하게 동작합니다. Mattermost에 스레드 루트가 생성되면 후속 청크와 미디어가 동일한 스레드에서 계속되기 때문입니다.
- 채팅 유형별 재정의는 `replyToMode`보다 우선합니다. `direct` 재정의가 없으면 기존 배포 환경의 DM은 스레드 없는 평면 구조를 유지합니다.

## 접근 제어(DM)

- 기본값: `channels.mattermost.dmPolicy = "pairing"`(알 수 없는 발신자에게 페어링 코드 제공). 다른 값: `allowlist`, `open`, `disabled`.
- 다음 명령으로 승인합니다.
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 공개 DM: `channels.mattermost.dmPolicy="open"` 및 `channels.mattermost.allowFrom=["*"]`(구성 스키마에서 와일드카드를 강제함).
- `channels.mattermost.allowFrom`은 사용자 ID(권장)와 `accessGroup:<name>` 항목을 허용합니다. [접근 그룹](/ko/channels/access-groups)을 참조하세요.

## 채널(그룹)

- 기본값: `channels.mattermost.groupPolicy = "allowlist"`(멘션 필요).
- `channels.mattermost.groupAllowFrom`을 사용하여 발신자를 허용 목록에 추가합니다(사용자 ID 권장).
- `channels.mattermost.groupAllowFrom`은 `accessGroup:<name>` 항목을 허용합니다. [접근 그룹](/ko/channels/access-groups)을 참조하세요.
- 채널별 멘션 재정의는 `channels.mattermost.groups.<channelId>.requireMention` 아래에 설정하며, 기본값은 `channels.mattermost.groups["*"].requireMention`에 설정합니다.
- `@username` 일치는 변경될 수 있으며 `channels.mattermost.dangerouslyAllowNameMatching: true`인 경우에만 활성화됩니다.
- 공개 채널: `channels.mattermost.groupPolicy="open"`(멘션 필요).
- 결정 순서: `channels.mattermost.groupPolicy`, `channels.defaults.groupPolicy`, `"allowlist"` 순입니다.
- 런타임 참고 사항: `channels.mattermost` 섹션이 완전히 없으면 그룹 검사 시 런타임은 닫힌 상태로 실패하여 `groupPolicy="allowlist"`를 적용하고(`channels.defaults.groupPolicy`가 설정되어 있어도 적용됨), 일회성 경고를 기록합니다.

예시:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 외부 전달 대상

`openclaw message send` 또는 Cron/Webhook에서 다음 대상 형식을 사용하세요.

| 대상                                | 전달 위치                                                     |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | ID로 지정한 채널                                              |
| `channel:<name>` 또는 `#channel-name` | 봇이 속한 팀 전체에서 이름으로 검색한 채널                    |
| `user:<id>` 또는 `mattermost:<id>`    | 해당 사용자와의 DM                                            |
| `@username`                         | DM(Mattermost API를 통해 사용자 이름 확인)                    |

외부 전송은 메시지당 최대 하나의 첨부 파일을 지원합니다. 여러 파일은 별도의 전송으로 나누세요.

<Warning>
접두사가 없는 불투명 ID(예: `64ifufp...`)는 Mattermost에서 **모호**합니다(사용자 ID인지 채널 ID인지 구분할 수 없음).

OpenClaw는 **사용자를 우선**하여 확인합니다.

- ID가 사용자로 존재하면(`GET /api/v4/users/<id>` 성공) OpenClaw는 `/api/v4/channels/direct`를 통해 다이렉트 채널을 확인하여 **DM**을 전송합니다.
- 그렇지 않으면 ID를 **채널 ID**로 처리합니다.

결정적인 동작이 필요하면 항상 명시적인 접두사(`user:<id>` / `channel:<id>`)를 사용하세요.
</Warning>

## DM 채널 재시도

OpenClaw가 Mattermost DM 대상으로 전송하면서 먼저 다이렉트 채널을 확인해야 하는 경우, 기본적으로 일시적인 다이렉트 채널 생성 실패를 재시도합니다.

Mattermost Plugin 전체에서 이 동작을 조정하려면 `channels.mattermost.dmChannelRetry`를 사용하고, 단일 계정에서 조정하려면 `channels.mattermost.accounts.<id>.dmChannelRetry`를 사용하세요. 기본값:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

참고:

- 이 설정은 모든 Mattermost API 호출이 아니라 DM 채널 생성(`/api/v4/channels/direct`)에만 적용됩니다.
- 재시도는 지터가 포함된 지수 백오프를 사용하며, 속도 제한, 5xx 응답, 네트워크 또는 시간 초과 오류와 같은 일시적 실패에 적용됩니다.
- `429` 이외의 4xx 클라이언트 오류는 영구적 오류로 처리되며 재시도하지 않습니다.

## 미리보기 스트리밍

Mattermost는 사고 과정, 도구 활동 및 부분 응답 텍스트를 **초안 미리보기 게시물**로 스트리밍하며, 최종 답변을 안전하게 보낼 수 있게 되면 해당 게시물을 그 자리에서 최종 확정합니다. `partial` 모드에서는 청크마다 메시지를 보내 채널을 도배하는 대신 동일한 게시물 ID의 미리보기를 업데이트합니다. `block` 모드에서는 미리보기가 완료된 텍스트 블록과 도구 활동 블록 사이를 전환하므로, 이전 블록이 다음 블록으로 덮어써지지 않고 각각 별도의 게시물로 계속 표시됩니다. 미디어/오류 최종 응답은 대기 중인 미리보기 편집을 취소하고, 폐기될 미리보기 게시물을 최종 반영하는 대신 일반 전송을 사용합니다.

미리보기 스트리밍은 기본적으로 `partial` 모드로 **활성화**됩니다. `channels.mattermost.streaming`을 통해 설정합니다(모드 문자열, 불리언 또는 `{ mode: "progress" }`와 같은 객체):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="스트리밍 모드">
    - `partial`(기본값): 응답이 생성됨에 따라 편집되는 하나의 미리보기 게시물이며, 이후 완전한 답변으로 최종 확정됩니다.
    - `block`은 미리보기를 완료된 텍스트 블록과 도구 활동 블록 사이에서 전환하므로, 각 블록이 그 자리에서 덮어써지지 않고 별도의 게시물로 계속 표시됩니다. 병렬 및 연속 도구 업데이트는 현재 도구 활동 게시물을 공유합니다.
    - `progress`는 생성 중에 상태 미리보기를 표시하고 완료 시에만 최종 답변을 게시합니다.
    - `off`는 미리보기 스트리밍을 비활성화합니다. `blockStreaming: true`인 경우 완료된 어시스턴트 블록은 하나로 합쳐진 최종 게시물 대신 일반 블록 응답(별도 게시물)으로 계속 전송됩니다.

  </Accordion>
  <Accordion title="스트리밍 동작 참고 사항">
    - 스트림을 그 자리에서 최종 확정할 수 없는 경우(예: 스트리밍 도중 게시물이 삭제됨), OpenClaw는 응답이 유실되지 않도록 새로운 최종 게시물을 전송하는 방식으로 대체합니다.
    - 사고 과정만 포함된 페이로드는 `> Thinking` 인용 블록으로 도착하는 텍스트를 포함하여 채널 게시물에서 제외됩니다. 다른 화면에서 사고 과정을 보려면 `/reasoning on`을 설정하세요. Mattermost 최종 게시물에는 답변만 유지됩니다.
    - 채널 매핑 행렬은 [스트리밍](/ko/concepts/streaming#preview-streaming-modes)을 참조하세요.

  </Accordion>
</AccordionGroup>

## 반응(메시지 도구)

- `channel=mattermost`와 함께 `message action=react`를 사용합니다.
- `messageId`는 Mattermost 게시물 ID입니다.
- `emoji`에는 `thumbsup` 또는 `:+1:`과 같은 이름을 사용할 수 있습니다(콜론은 선택 사항).
- 반응을 제거하려면 `remove=true`(불리언)를 설정합니다.
- 반응 추가/제거 이벤트는 메시지와 동일한 DM/그룹 정책 검사를 거쳐 라우팅된 에이전트 세션에 시스템 이벤트로 전달됩니다.

예시:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

설정:

- `channels.mattermost.actions.reactions`: 반응 작업을 활성화/비활성화합니다(기본값: true).
- 계정별 재정의: `channels.mattermost.accounts.<id>.actions.reactions`.

## 대화형 버튼(메시지 도구)

클릭 가능한 버튼이 포함된 메시지를 전송합니다. 사용자가 버튼을 클릭하면 에이전트가 선택 항목을 수신하고 응답할 수 있습니다.

버튼은 의미론적 `presentation` 페이로드에서 가져옵니다(일반 에이전트 응답 및 `message action=send`에서 사용). OpenClaw는 값 버튼을 Mattermost 대화형 버튼으로 렌더링하고, URL 버튼은 메시지 텍스트에 표시된 상태로 유지하며, 선택 메뉴는 읽을 수 있는 텍스트로 대체합니다.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

프레젠테이션 버튼 필드:

<ParamField path="label" type="string" required>
  표시 레이블(별칭: `text`).
</ParamField>
<ParamField path="value" type="string">
  클릭 시 반환되며 작업 ID로 사용되는 값(별칭: `callback_data`, `callbackData`). `url`이 설정되지 않은 경우 클릭 가능한 버튼에 필수입니다.
</ParamField>
<ParamField path="url" type="string">
  링크 버튼입니다. 대화형 버튼 대신 메시지 본문에 `label: url` 텍스트로 렌더링됩니다.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  버튼 스타일입니다. Mattermost는 지원하지 않는 값에 기본 스타일을 적용합니다.
</ParamField>

에이전트 시스템 프롬프트에 버튼 지원을 알리려면 채널 기능에 `inlineButtons`를 추가합니다.

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

사용자가 버튼을 클릭하면:

<Steps>
  <Step title="접근 검사">
    클릭한 사용자는 메시지 발신자와 동일한 DM/그룹 정책 검사를 통과해야 합니다. 권한이 없는 클릭에는 임시 알림이 표시되며 무시됩니다.
  </Step>
  <Step title="버튼을 확인 문구로 교체">
    모든 버튼은 확인 문구(예: "✓ **Yes** selected by @user")로 교체됩니다.
  </Step>
  <Step title="에이전트가 선택 항목 수신">
    에이전트는 선택 항목을 인바운드 메시지 및 시스템 이벤트로 수신하고 응답합니다.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="구현 참고 사항">
    - 버튼 콜백은 HMAC-SHA256 검증을 사용합니다(자동으로 처리되며 설정은 필요하지 않음).
    - 클릭 시 첨부 파일 블록 전체가 교체되므로 모든 버튼이 함께 제거되며, 일부만 제거할 수 없습니다.
    - 하이픈이나 밑줄이 포함된 작업 ID는 자동으로 정리됩니다(Mattermost 라우팅 제한).
    - `action_id`가 원본 게시물의 작업과 일치하지 않는 클릭은 `403`(`"Unknown action"`)으로 거부됩니다.

  </Accordion>
  <Accordion title="설정 및 도달 가능성">
    - `channels.mattermost.capabilities`: 기능 문자열 배열입니다. 에이전트 시스템 프롬프트에서 버튼 도구 설명을 활성화하려면 `"inlineButtons"`를 추가합니다.
    - `channels.mattermost.interactions.callbackBaseUrl`: 버튼 콜백에 사용할 선택적 외부 기본 URL입니다(예: `https://gateway.example.com`). Mattermost가 Gateway의 바인드 호스트에 직접 접근할 수 없을 때 사용합니다.
    - 다중 계정 설정에서는 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 아래에 동일한 필드를 설정할 수도 있습니다.
    - `interactions.callbackBaseUrl`을 생략하면 OpenClaw는 `gateway.customBindHost` + `gateway.port`(기본값 18789)에서 콜백 URL을 파생한 다음 `http://localhost:<port>`를 대체 경로로 사용합니다. 콜백 경로는 `/mattermost/interactions/<accountId>`입니다.
    - 도달 가능성 규칙: 버튼 콜백 URL은 Mattermost 서버에서 접근할 수 있어야 합니다. `localhost`는 Mattermost와 OpenClaw가 동일한 호스트/네트워크 네임스페이스에서 실행될 때만 작동합니다.
    - `channels.mattermost.interactions.allowedSourceIps`: 버튼 콜백의 소스 IP 허용 목록입니다. 이 설정이 없으면 loopback 소스(`127.0.0.1`, `::1`)만 허용되므로, 원격 Mattermost 서버를 여기에 허용 목록으로 추가해야 하며 그렇지 않으면 클릭이 `403`으로 거부됩니다. 리버스 프록시 뒤에서는 전달된 헤더에서 실제 클라이언트 IP를 파생할 수 있도록 `gateway.trustedProxies`도 설정하세요.
    - 콜백 대상이 비공개/tailnet/내부 대상이면 해당 호스트/도메인을 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`에 추가합니다.

  </Accordion>
</AccordionGroup>

### 직접 API 통합(외부 스크립트)

외부 스크립트와 Webhook은 에이전트의 `message` 도구를 거치지 않고 Mattermost REST API를 통해 버튼을 직접 게시할 수 있습니다. 가능하면 Plugin의 `buildButtonAttachments()`를 사용하세요. 원시 JSON을 게시하는 경우 다음 규칙을 따르세요.

**페이로드 구조:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**중요 규칙**

1. 첨부 파일은 최상위 `attachments`가 아닌 `props.attachments`에 넣어야 합니다(그렇지 않으면 아무 알림 없이 무시됨).
2. 모든 작업에는 `type: "button"`이 필요합니다. 이 값이 없으면 클릭이 아무 알림 없이 무시됩니다.
3. 모든 작업에는 `id` 필드가 필요합니다. Mattermost는 ID가 없는 작업을 무시합니다.
4. 작업 `id`에는 **영숫자만** 사용할 수 있습니다(`[a-zA-Z0-9]`). 하이픈과 밑줄은 Mattermost의 서버 측 작업 라우팅을 중단시킵니다(404 반환). 사용하기 전에 제거하세요.
5. `context.action_id`는 버튼의 `id`와 일치해야 합니다. Gateway는 게시물에 존재하지 않는 `action_id`의 클릭을 거부합니다.
6. `context.action_id`는 필수입니다. 이 값이 없으면 상호작용 핸들러가 400을 반환합니다.
7. 콜백 소스 IP가 허용되어야 합니다(위의 `interactions.allowedSourceIps` 참조).

</Warning>

**HMAC 토큰 생성**

Gateway는 HMAC-SHA256으로 버튼 클릭을 검증합니다. 외부 스크립트는 Gateway의 검증 로직과 일치하는 토큰을 생성해야 합니다.

<Steps>
  <Step title="봇 토큰에서 비밀 값 파생">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, 16진수로 인코딩합니다.
  </Step>
  <Step title="컨텍스트 객체 생성">
    `_token`을 **제외한** 모든 필드로 컨텍스트 객체를 생성합니다.
  </Step>
  <Step title="정렬된 키로 직렬화">
    **재귀적으로 정렬된 키**와 **공백 없는** 형식으로 직렬화합니다(Gateway는 중첩 객체도 정규화하며 간결한 JSON을 생성함).
  </Step>
  <Step title="페이로드 서명">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="토큰 추가">
    결과로 생성된 16진수 다이제스트를 컨텍스트의 `_token`으로 추가합니다.
  </Step>
</Steps>

Python 예시:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="일반적인 HMAC 주의 사항">
    - Python의 `json.dumps`는 기본적으로 공백을 추가합니다(`{"key": "val"}`). JavaScript의 간결한 출력(`{"key":"val"}`)과 일치시키려면 `separators=(",", ":")`를 사용하세요.
    - 항상 `_token`을 제외한 컨텍스트 필드 **전체**에 서명하세요. Gateway는 `_token`을 제거한 다음 남은 모든 필드에 서명합니다. 일부 필드에만 서명하면 검증이 아무 알림 없이 실패합니다.
    - `sort_keys=True`를 사용하세요. Gateway는 서명 전에 키를 정렬하며, Mattermost는 페이로드를 저장할 때 컨텍스트 필드의 순서를 변경할 수 있습니다.
    - 무작위 바이트가 아니라 봇 토큰에서 비밀 값을 파생하세요(결정론적 방식). 버튼을 생성하는 프로세스와 검증하는 Gateway에서 비밀 값이 동일해야 합니다.

  </Accordion>
</AccordionGroup>

## 디렉터리 어댑터

Mattermost Plugin에는 Mattermost API를 통해 채널 및 사용자 이름을 해석하는 디렉터리 어댑터가 포함되어 있습니다. 이를 통해 `openclaw message send` 및 Cron/Webhook 전송에서 `#channel-name`과 `@username` 대상을 사용할 수 있습니다.

설정은 필요하지 않습니다. 어댑터는 계정 설정의 봇 토큰을 사용합니다.

## 다중 계정

Mattermost는 `channels.mattermost.accounts` 아래에서 여러 계정을 지원합니다.

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "기본", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "알림", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

계정 값은 최상위 필드를 재정의하며, 계정이 지정되지 않은 경우 `channels.mattermost.defaultAccount`가 사용할 계정을 선택합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="채널에서 응답이 없음">
    봇이 채널에 있는지 확인하고 봇을 멘션하거나(oncall), 트리거 접두사를 사용하거나(onchar), `chatmode: "onmessage"`를 설정하세요.
  </Accordion>
  <Accordion title="인증 또는 다중 계정 오류">
    - 봇 토큰, 기본 URL, 계정 활성화 여부를 확인하세요.
    - 다중 계정 문제: 환경 변수는 `default` 계정에만 적용됩니다.
    - 비공개/LAN Mattermost 호스트에는 `network.dangerouslyAllowPrivateNetwork: true`가 필요합니다(SSRF 방어 기능은 기본적으로 비공개 IP를 차단합니다).

  </Accordion>
  <Accordion title="네이티브 슬래시 명령 실패">
    - `Unauthorized: invalid command token.`: OpenClaw가 콜백 토큰을 수락하지 않았습니다. 일반적인 원인은 다음과 같습니다.
      - 시작 시 슬래시 명령 등록이 실패했거나 일부만 완료됨
      - 콜백이 잘못된 Gateway/계정으로 전송됨
      - Mattermost에 이전 콜백 대상을 가리키는 오래된 명령이 여전히 남아 있음
      - 슬래시 명령을 다시 활성화하지 않고 Gateway가 재시작됨
    - 네이티브 슬래시 명령이 작동을 멈추면 로그에서 `mattermost: failed to register slash commands` 또는 `mattermost: native slash commands enabled but no commands could be registered`를 확인하세요.
    - `callbackUrl`을 생략했고 콜백이 `http://localhost:18789/...` 같은 local loopback URL로 확인되었다는 경고가 로그에 표시된다면, Mattermost가 OpenClaw와 동일한 호스트/네트워크 네임스페이스에서 실행될 때만 해당 URL에 접근할 수 있을 가능성이 높습니다. 대신 외부에서 접근할 수 있는 명시적인 `commands.callbackUrl`을 설정하세요.

  </Accordion>
  <Accordion title="버튼 문제">
    - 버튼이 흰색 상자로 표시되거나 전혀 표시되지 않음: 버튼 데이터 형식이 잘못되었습니다. 각 프레젠테이션 버튼에는 `label`과 `value`가 필요합니다(둘 중 하나라도 없는 버튼은 삭제됩니다).
    - 버튼은 렌더링되지만 클릭해도 아무 동작이 없음: Mattermost 서버에서 Gateway에 접근할 수 있는지, Mattermost 서버 IP가 `channels.mattermost.interactions.allowedSourceIps`에 포함되어 있는지(이를 설정하지 않으면 local loopback만 허용됨), 비공개 대상의 경우 `ServiceSettings.AllowedUntrustedInternalConnections`에 콜백 호스트가 포함되어 있는지 확인하세요.
    - 버튼을 클릭하면 404가 반환됨: 버튼 `id`에 하이픈이나 밑줄이 포함되어 있을 가능성이 높습니다. Mattermost의 작업 라우터는 영숫자가 아닌 ID를 처리하지 못합니다. `[a-zA-Z0-9]`만 사용하세요.
    - Gateway 로그에 `rejected callback source`가 표시됨: `interactions.allowedSourceIps`에 포함되지 않은 IP에서 클릭이 발생했습니다. Mattermost 서버 또는 인그레스를 허용 목록에 추가하고, 리버스 프록시 뒤에서는 `gateway.trustedProxies`를 설정하세요.
    - Gateway 로그에 `invalid _token`이 표시됨: HMAC이 일치하지 않습니다. 모든 컨텍스트 필드의 서명을 생성하고 있는지(일부만 서명하면 안 됨), 정렬된 키를 사용하는지, 공백 없는 압축 JSON을 사용하는지 확인하세요. 위의 HMAC 섹션을 참조하세요.
    - Gateway 로그에 `missing _token in context`가 표시됨: 버튼의 컨텍스트에 `_token` 필드가 없습니다. 통합 페이로드를 구성할 때 해당 필드가 포함되었는지 확인하세요.
    - Gateway가 `Unknown action` 오류와 함께 클릭을 거부함: `context.action_id`가 게시물의 작업 `id` 중 어느 것과도 일치하지 않습니다. 둘 다 동일하게 정리된 값으로 설정하세요.
    - 에이전트가 버튼을 제공하지 않음: Mattermost 채널 구성에 `capabilities: ["inlineButtons"]`를 추가하세요.

  </Accordion>
</AccordionGroup>

## 관련 문서

- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 제한
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) - 접근 모델 및 보안 강화
