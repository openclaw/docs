---
read_when:
    - 새 메시징 채널 plugin을 빌드하고 있습니다.
    - OpenClaw를 메시징 플랫폼에 연결하려고 합니다.
    - ChannelPlugin adapter 표면을 이해해야 합니다.
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 plugin을 빌드하는 단계별 가이드
title: 채널 plugin 빌드하기
x-i18n:
    generated_at: "2026-04-25T06:06:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

이 가이드는 OpenClaw를 메시징 플랫폼에 연결하는 채널 plugin을 빌드하는 과정을 단계별로 설명합니다. 끝까지 따라가면 DM 보안,
pairing, 응답 thread 처리, 아웃바운드 메시징이 동작하는 채널을 갖게 됩니다.

<Info>
  아직 OpenClaw plugin을 한 번도 빌드해 본 적이 없다면 먼저
  [Getting Started](/ko/plugins/building-plugins)를 읽고 기본 패키지
  구조와 manifest 설정을 확인하세요.
</Info>

## 채널 plugin의 동작 방식

채널 plugin은 자체 send/edit/react 도구가 필요하지 않습니다. OpenClaw는 core에
하나의 공용 `message` 도구를 유지합니다. plugin이 소유하는 것은 다음과 같습니다.

- **Config** — 계정 확인 및 설정 마법사
- **보안** — DM 정책 및 allowlist
- **Pairing** — DM 승인 흐름
- **세션 문법** — provider별 대화 id가 기본 채팅, thread id, 부모 fallback에 어떻게 매핑되는지
- **아웃바운드** — 플랫폼으로 텍스트, 미디어, poll 전송
- **Thread 처리** — 응답이 어떻게 thread로 연결되는지
- **Heartbeat typing** — Heartbeat 전달 대상에 대한 선택적 typing/busy 신호

Core는 공용 message 도구, prompt 연결, 외부 세션 키 형상,
일반적인 `:thread:` bookkeeping, dispatch를 소유합니다.

채널이 인바운드 응답 외부에서 typing indicator를 지원한다면,
채널 plugin에 `heartbeat.sendTyping(...)`을 노출하세요. Core는 Heartbeat 모델 실행이 시작되기 전에
확인된 Heartbeat 전달 대상을 사용해 이를 호출하고,
공용 typing keepalive/cleanup 수명 주기를 사용합니다. 플랫폼에 명시적인 중지 신호가 필요하면
`heartbeat.clearTyping(...)`도 추가하세요.

채널이 미디어 소스를 전달하는 message-tool 파라미터를 추가한다면,
그 파라미터 이름을 `describeMessageTool(...).mediaSourceParams`를 통해 노출하세요. Core는
sandbox 경로 정규화와 아웃바운드 미디어 접근
정책에 이 명시적 목록을 사용하므로, plugin은 provider별
avatar, attachment, 또는 cover-image 파라미터를 위해 공용 core 특별 처리를 둘 필요가 없습니다.
`{ "set-profile": ["avatarUrl", "avatarPath"] }`처럼 작업 키 기반 맵을 반환하는 방식을 우선하세요. 그래야 관련 없는 작업이
다른 작업의 미디어 인자를 상속하지 않습니다. 모든 노출 작업에서 의도적으로 공유되는 파라미터라면
평면 배열도 여전히 사용할 수 있습니다.

플랫폼이 대화 id 안에 추가 범위를 저장한다면,
그 파싱은 plugin의 `messaging.resolveSessionConversation(...)` 안에 유지하세요. 이것이
`rawId`를 기본 대화 id, 선택적 thread
id, 명시적인 `baseConversationId`, 그리고 `parentConversationCandidates`로
매핑하는 표준 hook입니다.
`parentConversationCandidates`를 반환할 때는 가장 좁은 부모에서
가장 넓은/기본 대화 순으로 정렬하세요.

채널 레지스트리가 부팅되기 전에 같은 파싱이 필요한 번들 plugin은
일치하는
`resolveSessionConversation(...)` export를 갖는 최상위 `session-key-api.ts` 파일도 노출할 수 있습니다.
Core는 런타임 plugin 레지스트리를 아직 사용할 수 없을 때만
이 bootstrap-safe 표면을 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는 plugin이
일반/raw id 위에 부모 fallback만 필요할 때를 위한
레거시 호환 fallback으로 여전히 제공됩니다. 두 hook이 모두 존재하면 core는 먼저
`resolveSessionConversation(...).parentConversationCandidates`를 사용하고, 표준 hook이
이를 생략한 경우에만 `resolveParentConversationCandidates(...)`로 fallback합니다.

## 승인과 채널 capability

대부분의 채널 plugin은 승인 전용 코드가 필요하지 않습니다.

- Core는 같은 채팅의 `/approve`, 공용 승인 버튼 payload, 일반 fallback 전달을 소유합니다.
- 채널에 승인 전용 동작이 필요할 때는 채널 plugin에 하나의 `approvalCapability` 객체를 두는 방식을 우선하세요.
- `ChannelPlugin.approvals`는 제거되었습니다. 승인 전달/네이티브/렌더링/인증 관련 정보는 `approvalCapability`에 두세요.
- `plugin.auth`는 login/logout 전용이며, core는 더 이상 그 객체에서 승인 인증 hook을 읽지 않습니다.
- `approvalCapability.authorizeActorAction`과 `approvalCapability.getActionAvailabilityState`가 표준 승인 인증 경계입니다.
- 같은 채팅의 승인 인증 사용 가능 상태에는 `approvalCapability.getActionAvailabilityState`를 사용하세요.
- 채널이 네이티브 exec 승인을 노출한다면, 시작 표면/네이티브 클라이언트 상태가 같은 채팅 승인 인증과 다를 때는 `approvalCapability.getExecInitiatingSurfaceState`를 사용하세요. Core는 이 exec 전용 hook을 사용해 `enabled`와 `disabled`를 구분하고, 시작 채널이 네이티브 exec 승인을 지원하는지 판단하며, 네이티브 클라이언트 fallback 가이드에 해당 채널을 포함합니다. 일반적인 경우에는 `createApproverRestrictedNativeApprovalCapability(...)`가 이를 채워줍니다.
- 중복 로컬 승인 프롬프트 숨김 또는 전달 전 typing indicator 전송 같은 채널별 payload 수명 주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- `approvalCapability.delivery`는 네이티브 승인 라우팅 또는 fallback 억제에만 사용하세요.
- 채널 소유 네이티브 승인 정보를 위해 `approvalCapability.nativeRuntime`을 사용하세요. hot 채널 진입점에서는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 사용해 이를 지연 로드 상태로 유지하세요. 이를 통해 core가 승인 수명 주기를 구성하는 동안에도 필요할 때 런타임 모듈을 import할 수 있습니다.
- 채널에 공용 renderer 대신 진정으로 사용자 지정 승인 payload가 필요할 때만 `approvalCapability.render`를 사용하세요.
- 채널이 비활성 경로 응답에 네이티브 exec 승인을 활성화하기 위해 필요한 정확한 config 설정값을 설명하고 싶다면 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 hook은 `{ channel, channelLabel, accountId }`를 받으며, 이름 있는 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위 경로를 렌더링해야 합니다.
- 채널이 기존 config에서 안정적인 owner 유사 DM ID를 추론할 수 있다면, 승인 전용 core 로직을 추가하지 않고도 같은 채팅의 `/approve`를 제한하기 위해 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용하세요.
- 채널에 네이티브 승인 전달이 필요하다면, 채널 코드는 대상 정규화와 전송/표현 정보에 집중되도록 유지하세요. `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`를 사용하세요. 채널별 정보는 `approvalCapability.nativeRuntime` 뒤에 두고, 가능하면 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 통해 두세요. 그러면 core가 handler를 조합하고 요청 필터링, 라우팅, dedupe, 만료, gateway 구독, 다른 곳으로 라우팅되었을 때의 알림을 소유할 수 있습니다. `nativeRuntime`은 몇 개의 더 작은 경계로 나뉩니다.
- `availability` — 계정이 구성되었는지와 요청을 처리해야 하는지 여부
- `presentation` — 공용 승인 view model을 pending/resolved/expired 네이티브 payload 또는 최종 작업으로 매핑
- `transport` — 대상을 준비하고 네이티브 승인 메시지를 전송/업데이트/삭제
- `interactions` — 네이티브 버튼 또는 반응에 대한 선택적 bind/unbind/clear-action hook
- `observe` — 선택적 전달 진단 hook
- 채널에 client, token, Bolt 앱, Webhook receiver 같은 런타임 소유 객체가 필요하면 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요. 일반 runtime-context 레지스트리는 core가 승인 전용 wrapper glue를 추가하지 않고도 채널 시작 상태에서 capability 기반 handler를 bootstrap할 수 있게 해줍니다.
- capability 기반 경계가 아직 충분히 표현력이 없을 때만 더 낮은 수준의 `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`을 사용하세요.
- 네이티브 승인 채널은 `accountId`와 `approvalKind`를 모두 해당 helper를 통해 라우팅해야 합니다. `accountId`는 다중 계정 승인 정책의 범위를 올바른 봇 계정으로 제한하고, `approvalKind`는 core에 하드코딩된 분기 없이도 채널에서 exec와 plugin 승인 동작을 사용할 수 있게 합니다.
- 이제 Core가 승인 재라우팅 알림도 소유합니다. 채널 plugin은 `createChannelNativeApprovalRuntime`에서 자체적으로 "승인이 DM / 다른 채널로 갔다"는 후속 메시지를 보내지 말고, 대신 공용 승인 capability helper를 통해 정확한 origin + 승인자 DM 라우팅을 노출하고, 시작 채팅으로 알림을 게시하기 전에 core가 실제 전달 결과를 집계하도록 하세요.
- 전달된 승인 id 종류는 처음부터 끝까지 유지하세요. 네이티브 클라이언트는
  채널 로컬 상태에서 exec와 plugin 승인 라우팅을 추측하거나 다시 작성해서는 안 됩니다.
- 서로 다른 승인 종류가 의도적으로 서로 다른 네이티브 표면을 노출할 수 있습니다.
  현재 번들 예시:
  - Slack은 exec와 plugin id 모두에 대해 네이티브 승인 라우팅을 계속 제공합니다.
  - Matrix는 exec와 plugin 승인에 대해 같은 네이티브 DM/채널 라우팅과 반응 UX를 유지하면서도, 승인 종류별로 인증을 다르게 할 수 있습니다.
- `createApproverRestrictedNativeApprovalAdapter`는 여전히 호환성 wrapper로 존재하지만, 새 코드에서는 capability builder를 우선 사용하고 plugin에 `approvalCapability`를 노출해야 합니다.

hot 채널 진입점에서는 이 계열 전체가 아니라 한 부분만 필요할 때
더 좁은 런타임 하위 경로를 우선 사용하세요.

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로 더 넓은 umbrella
표면이 필요하지 않다면 `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, 그리고
`openclaw/plugin-sdk/reply-chunking`을 우선 사용하세요.

특히 setup의 경우:

- `openclaw/plugin-sdk/setup-runtime`은 런타임 안전 setup helper를 포함합니다:
  import-safe setup patch adapter(`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 그리고 위임형
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime`은 `createEnvPatchedAccountSetupAdapter`를 위한
  좁은 env 인식 adapter 경계입니다
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 setup
  builder와 몇 가지 setup-safe 기본 요소를 포함합니다:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 env 기반 setup 또는 auth를 지원하고 일반적인 시작/config
흐름이 런타임 로드 전에 해당 env 이름을 알아야 한다면,
plugin manifest에 `channelEnvVars`로 선언하세요. 채널 런타임 `envVars` 또는 로컬 상수는
운영자 대상 안내 문구에만 사용하세요.

채널이 plugin 런타임 시작 전에 `status`, `channels list`, `channels status`, 또는
SecretRef 스캔에 나타날 수 있다면 `package.json`에 `openclaw.setupEntry`를 추가하세요.
그 entrypoint는 읽기 전용 명령 경로에서 import해도 안전해야 하며,
해당 요약에 필요한 채널 메타데이터, setup-safe config adapter, 상태 adapter,
채널 secret target 메타데이터를 반환해야 합니다. setup entry에서
client, listener, transport 런타임을 시작하지 마세요.

메인 채널 entry import 경로도 좁게 유지하세요. 검색은
채널을 활성화하지 않고도 capability를 등록하기 위해 entry와 채널 plugin 모듈을 평가할 수 있습니다.
`channel-plugin-api.ts` 같은 파일은 setup 마법사, transport client, socket
listener, 하위 프로세스 실행기, 서비스 시작 모듈을 import하지 않고 채널
plugin 객체를 export해야 합니다. 이러한 런타임 요소는 `registerFull(...)`, 런타임 setter, 또는 지연 capability adapter에서 로드되는 모듈에 두세요.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, 그리고
`splitSetupEntries`

- 더 무거운 공용 setup/config helper도 함께 필요할 때만 더 넓은
  `openclaw/plugin-sdk/setup` 경계를 사용하세요. 예:
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

채널이 setup 표면에서 단순히 "먼저 이 plugin을 설치하세요"만 안내하려는 경우에는
`createOptionalChannelSetupSurface(...)`를 우선 사용하세요. 생성된
adapter/wizard는 config 쓰기와 최종 단계에서 fail closed하며,
검증, finalize, 문서 링크 안내 문구 전반에서 동일한 설치 필요 메시지를 재사용합니다.

다른 hot 채널 경로에서도 더 넓은 레거시 표면보다 더 좁은 helper를 우선하세요.

- 다중 계정 config 및
  기본 계정 fallback에는 `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, 그리고
  `openclaw/plugin-sdk/account-helpers`
- 인바운드 route/envelope 및
  record-and-dispatch 연결에는 `openclaw/plugin-sdk/inbound-envelope`와
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- 대상 파싱/일치에는 `openclaw/plugin-sdk/messaging-targets`
- 미디어 로딩과 아웃바운드
  ID/send delegate 및 payload 계획에는 `openclaw/plugin-sdk/outbound-media`와
  `openclaw/plugin-sdk/outbound-runtime`
- 아웃바운드 route가 명시적 `replyToId`/`threadId`를 유지하거나,
  기본 세션 키가 여전히 일치한 후 현재 `:thread:` 세션을 복구해야 할 때는
  `openclaw/plugin-sdk/channel-core`의 `buildThreadAwareOutboundSessionRoute(...)`
  사용. provider plugin은 플랫폼에 네이티브 thread 전달 의미 체계가 있을 경우
  우선순위, suffix 동작, thread id 정규화를 재정의할 수 있습니다.
- thread-binding 수명 주기 및 adapter 등록에는 `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 agent/media
  payload 필드 레이아웃이 여전히 필요할 때만 `openclaw/plugin-sdk/agent-media-payload`
- Telegram 사용자 지정 명령
  정규화, 중복/충돌 검증, fallback 안정적인 명령
  config 계약에는 `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 일반적으로 기본 경로에서 멈춰도 됩니다. core가 승인을 처리하고 plugin은 아웃바운드/인증 capability만 노출하면 됩니다. Matrix, Slack, Telegram, 사용자 지정 채팅 전송 같은 네이티브 승인 채널은 자체 승인 수명 주기를 구현하는 대신 공용 네이티브 helper를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리는 두 계층으로 나누어 유지하세요.

- plugin 소유 증거 수집
- 공용 정책 평가

멘션 정책 결정에는 `openclaw/plugin-sdk/channel-mention-gating`을 사용하세요.
더 넓은 인바운드
helper barrel이 필요할 때만 `openclaw/plugin-sdk/channel-inbound`를 사용하세요.

plugin 로컬 로직에 적합한 항목:

- 봇에 대한 응답 감지
- 봇 인용 감지
- thread 참여 여부 검사
- 서비스/시스템 메시지 제외
- 봇 참여를 입증하는 데 필요한 플랫폼 네이티브 캐시

공용 helper에 적합한 항목:

- `requireMention`
- 명시적 멘션 결과
- 암시적 멘션 allowlist
- 명령 우회
- 최종 건너뛰기 결정

권장 흐름:

1. 로컬 멘션 사실을 계산합니다.
2. 그 사실을 `resolveInboundMentionDecision({ facts, policy })`에 전달합니다.
3. 인바운드 게이트에서 `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, `decision.shouldSkip`를 사용합니다.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions`는 이미 런타임 주입에 의존하는
번들 채널 plugin을 위해 동일한 공용 멘션 helper를 노출합니다.

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen`과
`resolveInboundMentionDecision`만 필요하다면,
관련 없는 인바운드
런타임 helper를 로드하지 않기 위해 `openclaw/plugin-sdk/channel-mention-gating`에서 import하세요.

기존 `resolveMentionGating*` helper는
`openclaw/plugin-sdk/channel-inbound`에 호환성 export로만 남아 있습니다. 새 코드는
`resolveInboundMentionDecision({ facts, policy })`를 사용해야 합니다.

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지와 manifest">
    표준 plugin 파일을 만드세요. `package.json`의 `channel` 필드가
    이것을 채널 plugin으로 만듭니다. 전체 패키지 메타데이터 표면은
    [Plugin Setup and Config](/ko/plugins/sdk-setup#openclaw-channel)를 참고하세요.

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema`는 `plugins.entries.acme-chat.config`를 검증합니다.
    채널 계정 config가 아닌 plugin 소유 설정에는 이것을 사용하세요. `channelConfigs`는
    `channels.acme-chat`을 검증하며, plugin 런타임이 로드되기 전
    config schema, setup, UI 표면에서 사용되는 콜드 패스 소스입니다.

  </Step>

  <Step title="채널 plugin 객체 빌드">
    `ChannelPlugin` 인터페이스에는 선택적 adapter 표면이 많이 있습니다.
    최소 구성인 `id`와 `setup`부터 시작하고 필요에 따라 adapter를 추가하세요.

    `src/channel.ts`를 만드세요:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // 플랫폼 API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM 보안: 누가 봇에 메시지를 보낼 수 있는지
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: 새 DM 연락처를 위한 승인 흐름
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Thread 처리: 응답이 어떻게 전달되는지
      threading: { topLevelReplyToMode: "reply" },

      // 아웃바운드: 플랫폼으로 메시지 전송
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="createChatChannelPlugin이 대신 해주는 일">
      저수준 adapter 인터페이스를 직접 구현하는 대신,
      선언적 옵션을 전달하면 builder가 이를 조합합니다.

      | 옵션 | 연결되는 기능 |
      | --- | --- |
      | `security.dm` | config 필드에서 범위가 지정된 DM 보안 확인자 |
      | `pairing.text` | 코드 교환이 있는 텍스트 기반 DM pairing 흐름 |
      | `threading` | reply-to 모드 확인자(고정, 계정 범위, 또는 사용자 지정) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 send 함수 |

      완전한 제어가 필요하면 선언적 옵션 대신 원시 adapter 객체를
      전달할 수도 있습니다.

      원시 아웃바운드 adapter는 `chunker(text, limit, ctx)` 함수를 정의할 수 있습니다.
      선택적인 `ctx.formatting`은 `maxLinesPerMessage` 같은
      전달 시점 형식 결정을 포함합니다. 이를 전송 전에 적용하면 응답 thread 처리와
      chunk 경계가 공용 아웃바운드 전달에 의해 한 번만 확인됩니다.
      send 컨텍스트에는 네이티브 응답 대상이 확인되었을 때의 `replyToIdSource`(`implicit` 또는 `explicit`)도 포함되므로,
      payload helper는 암시적 일회성 응답 슬롯을 소비하지 않고도 명시적 reply 태그를 유지할 수 있습니다.
    </Accordion>

  </Step>

  <Step title="entry point 연결">
    `index.ts`를 만드세요:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    채널 소유 CLI descriptor는 `registerCliMetadata(...)`에 두세요. 그러면 OpenClaw가
    전체 채널 런타임을 활성화하지 않고도 루트 help에 이를 표시할 수 있고,
    일반적인 전체 로드에서도 실제 명령
    등록을 위해 동일한 descriptor를 그대로 가져갑니다. 런타임 전용 작업은
    `registerFull(...)`에 두세요.
    `registerFull(...)`이 gateway RPC 메서드를 등록한다면,
    plugin 전용 접두사를 사용하세요. Core 관리 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 항상
    `operator.admin`으로 확인됩니다.
    `defineChannelPluginEntry`는 등록 모드 분기를 자동으로 처리합니다. 모든
    옵션은 [Entry Points](/ko/plugins/sdk-entrypoints#definechannelpluginentry)를 참고하세요.

  </Step>

  <Step title="setup entry 추가">
    온보딩 중 경량 로드를 위해 `setup-entry.ts`를 만드세요:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw는 채널이 비활성화되어 있거나
    미구성 상태일 때 전체 entry 대신 이것을 로드합니다. setup 흐름 중 무거운 런타임 코드를 불러오지 않게 해줍니다.
    자세한 내용은 [Setup and Config](/ko/plugins/sdk-setup#setup-entry)를 참고하세요.

    setup-safe export를 sidecar
    모듈로 분리한 번들 workspace 채널은,
    명시적인 setup 시점 runtime setter도 필요할 경우
    `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.

  </Step>

  <Step title="인바운드 메시지 처리">
    plugin은 플랫폼에서 메시지를 받아 OpenClaw로 전달해야 합니다.
    일반적인 패턴은 요청을 검증하고 이를
    채널의 인바운드 handler를 통해 dispatch하는 Webhook입니다.

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin이 관리하는 auth(서명 검증은 직접 수행)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 인바운드 handler가 메시지를 OpenClaw로 dispatch합니다.
          // 정확한 연결 방식은 플랫폼 SDK에 따라 다릅니다 —
          // 실제 예시는 번들 Microsoft Teams 또는 Google Chat plugin 패키지를 참고하세요.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      인바운드 메시지 처리는 채널별로 다릅니다. 각 채널 plugin은
      자체 인바운드 파이프라인을 소유합니다. 실제 패턴은 번들 채널 plugin
      (예: Microsoft Teams 또는 Google Chat plugin 패키지)을 참고하세요.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
`src/channel.test.ts`에 colocated 테스트를 작성하세요:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    공용 테스트 helper는 [Testing](/ko/plugins/sdk-testing)을 참고하세요.

</Step>
</Steps>

## 파일 구조

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 메타데이터
├── openclaw.plugin.json      # config schema가 포함된 Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 공개 export(선택 사항)
├── runtime-api.ts            # 내부 런타임 export(선택 사항)
└── src/
    ├── channel.ts            # createChatChannelPlugin을 통한 ChannelPlugin
    ├── channel.test.ts       # 테스트
    ├── client.ts             # 플랫폼 API client
    └── runtime.ts            # 런타임 저장소(필요한 경우)
```

## 고급 주제

<CardGroup cols={2}>
  <Card title="Thread 처리 옵션" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정형, 계정 범위, 또는 사용자 지정 응답 모드
  </Card>
  <Card title="Message 도구 통합" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 action 검색
  </Card>
  <Card title="대상 확인" icon="crosshair" href="/ko/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="런타임 helper" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime를 통한 TTS, STT, 미디어, subagent
  </Card>
</CardGroup>

<Note>
일부 번들 helper 경계는 번들 plugin 유지보수와
호환성을 위해 여전히 존재합니다. 이는 새 채널 plugin에 권장되는 패턴이 아니며,
해당 번들 plugin 계열을 직접 유지보수하는 경우가 아니라면
공용 SDK 표면의 일반적인 channel/setup/reply/runtime 하위 경로를 우선 사용하세요.
</Note>

## 다음 단계

- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — plugin이 모델도 제공하는 경우
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [SDK Testing](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 계약 테스트
- [Plugin Manifest](/ko/plugins/manifest) — 전체 manifest schema

## 관련

- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Building plugins](/ko/plugins/building-plugins)
- [Agent harness plugins](/ko/plugins/sdk-agent-harness)
