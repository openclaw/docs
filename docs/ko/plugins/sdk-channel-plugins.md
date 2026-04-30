---
read_when:
    - 새 메시징 채널 Plugin을 빌드하고 있습니다
    - OpenClaw를 메시징 플랫폼에 연결하려고 합니다.
    - ChannelPlugin 어댑터 인터페이스를 이해해야 합니다
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 Plugin을 구축하는 단계별 가이드
title: 채널 Plugin 만들기
x-i18n:
    generated_at: "2026-04-30T06:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

이 가이드는 OpenClaw를 메시징 플랫폼에 연결하는 channel Plugin을 만드는 과정을 안내합니다. 끝까지 진행하면 DM 보안, 페어링, 답장 스레딩, 아웃바운드 메시징을 갖춘 작동하는 채널을 만들 수 있습니다.

<Info>
  이전에 OpenClaw Plugin을 만든 적이 없다면, 기본 패키지 구조와 매니페스트 설정을 위해 먼저
  [시작하기](/ko/plugins/building-plugins)를 읽으세요.
</Info>

## channel Plugin의 작동 방식

channel Plugin에는 자체 send/edit/react 도구가 필요하지 않습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지합니다. Plugin은 다음을 담당합니다.

- **Config** — 계정 확인과 설정 마법사
- **Security** — DM 정책과 허용 목록
- **Pairing** — DM 승인 흐름
- **Session grammar** — 공급자별 대화 id가 기본 채팅, thread id, 상위 fallback에 매핑되는 방식
- **Outbound** — 플랫폼으로 텍스트, 미디어, poll 보내기
- **Threading** — 답장이 스레드로 처리되는 방식
- **Heartbeat typing** — Heartbeat 전달 대상에 대한 선택적 입력 중/바쁨 신호

코어는 공유 message 도구, prompt wiring, 외부 session-key 형태, 일반 `:thread:` bookkeeping, dispatch를 담당합니다.

채널이 inbound 답장 외부에서 입력 표시기를 지원한다면 channel Plugin에서
`heartbeat.sendTyping(...)`을 노출하세요. 코어는 Heartbeat model run이 시작되기 전에 확인된 Heartbeat 전달 대상으로 이를 호출하고, 공유 typing keepalive/cleanup lifecycle을 사용합니다. 플랫폼에 명시적 중지 신호가 필요하면 `heartbeat.clearTyping(...)`을 추가하세요.

채널이 미디어 소스를 전달하는 message-tool params를 추가한다면, 해당 param 이름을
`describeMessageTool(...).mediaSourceParams`를 통해 노출하세요. 코어는 sandbox path normalization과 outbound media-access policy에 이 명시적 목록을 사용하므로, Plugin은 공급자별 avatar, attachment, cover-image params에 대해 shared-core special case가 필요하지 않습니다.
관련 없는 action이 다른 action의 media args를 상속하지 않도록
`{ "set-profile": ["avatarUrl", "avatarPath"] }` 같은 action-keyed map을 반환하는 것을 권장합니다. 모든 노출 action에서 의도적으로 공유되는 params에는 flat array도 계속 동작합니다.

플랫폼이 conversation ids 안에 추가 scope를 저장한다면, 해당 parsing을 Plugin의
`messaging.resolveSessionConversation(...)` 안에 두세요. 이는 `rawId`를 base conversation id, 선택적 thread id, 명시적 `baseConversationId`, 그리고 모든 `parentConversationCandidates`에 매핑하는 표준 hook입니다.
`parentConversationCandidates`를 반환할 때는 가장 좁은 parent부터 가장 넓은/base conversation 순서로 유지하세요.

Plugin code가 route-like fields를 normalize하거나, child thread를 parent route와 비교하거나, `{ channel, to, accountId, threadId }`에서 안정적인 dedupe key를 만들어야 할 때는 `openclaw/plugin-sdk/channel-route`를 사용하세요. 이 helper는 코어와 같은 방식으로 numeric thread ids를 normalize하므로, Plugin은 ad hoc `String(threadId)` 비교보다 이를 선호해야 합니다.
공급자별 target grammar가 있는 Plugin은 parser를
`resolveChannelRouteTargetWithParser(...)`에 주입하면서도, 코어가 사용하는 것과 같은 route target 형태와 thread fallback semantics를 얻을 수 있습니다.

channel registry가 부팅되기 전에 같은 parsing이 필요한 bundled Plugin은 일치하는
`resolveSessionConversation(...)` export가 있는 top-level `session-key-api.ts` 파일도 노출할 수 있습니다. 코어는 runtime Plugin registry를 아직 사용할 수 없을 때만 이 bootstrap-safe surface를 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는 Plugin이 generic/raw id 위에 parent fallback만 필요로 할 때 legacy compatibility fallback으로 계속 사용할 수 있습니다. 두 hook이 모두 있으면 코어는 먼저
`resolveSessionConversation(...).parentConversationCandidates`를 사용하고, canonical hook이 이를 생략한 경우에만
`resolveParentConversationCandidates(...)`로 fallback합니다.

## 승인과 채널 capabilities

대부분의 channel Plugin에는 approval-specific code가 필요하지 않습니다.

- 코어는 same-chat `/approve`, shared approval button payloads, generic fallback delivery를 담당합니다.
- 채널에 approval-specific behavior가 필요하면 channel Plugin에 하나의 `approvalCapability` object를 사용하는 것을 권장합니다.
- `ChannelPlugin.approvals`는 제거되었습니다. approval delivery/native/render/auth facts는 `approvalCapability`에 넣으세요.
- `plugin.auth`는 login/logout 전용입니다. 코어는 더 이상 그 object에서 approval auth hooks를 읽지 않습니다.
- `approvalCapability.authorizeActorAction`과 `approvalCapability.getActionAvailabilityState`가 canonical approval-auth seam입니다.
- same-chat approval auth availability에는 `approvalCapability.getActionAvailabilityState`를 사용하세요.
- 채널이 native exec approvals를 노출한다면, initiating-surface/native-client state가 same-chat approval auth와 다를 때 `approvalCapability.getExecInitiatingSurfaceState`를 사용하세요. 코어는 이 exec-specific hook을 사용해 `enabled`와 `disabled`를 구분하고, initiating channel이 native exec approvals를 지원하는지 판단하며, native-client fallback guidance에 해당 채널을 포함합니다. 일반적인 경우에는 `createApproverRestrictedNativeApprovalCapability(...)`가 이를 채웁니다.
- duplicate local approval prompts를 숨기거나 delivery 전 typing indicators를 보내는 등 channel-specific payload lifecycle behavior에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- `approvalCapability.delivery`는 native approval routing 또는 fallback suppression에만 사용하세요.
- channel-owned native approval facts에는 `approvalCapability.nativeRuntime`을 사용하세요. hot channel entrypoints에서는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`로 lazy하게 유지하세요. 이 adapter는 필요할 때 runtime module을 import하면서도 코어가 approval lifecycle을 조립할 수 있게 합니다.
- 공유 renderer 대신 채널에 정말 custom approval payloads가 필요할 때만 `approvalCapability.render`를 사용하세요.
- 채널이 disabled-path reply에서 native exec approvals를 활성화하는 데 필요한 정확한 config knobs를 설명하길 원하면 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 hook은 `{ channel, channelLabel, accountId }`를 받습니다. named-account channels는 top-level defaults 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 account-scoped paths를 렌더링해야 합니다.
- 채널이 기존 config에서 안정적인 owner-like DM identities를 추론할 수 있다면, approval-specific core logic을 추가하지 않고 same-chat `/approve`를 제한하기 위해 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용하세요.
- 채널에 native approval delivery가 필요하면 channel code는 target normalization과 transport/presentation facts에 집중하세요. `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`를 사용하세요. channel-specific facts는 `approvalCapability.nativeRuntime` 뒤에 두는 것이 좋으며, 가능하면 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 사용하세요. 그러면 코어가 handler를 조립하고 request filtering, routing, dedupe, expiry, gateway subscription, routed-elsewhere notices를 담당할 수 있습니다. `nativeRuntime`은 몇 가지 더 작은 seam으로 나뉩니다.
- `createChannelNativeOriginTargetResolver`는 기본적으로 `{ to, accountId, threadId }` targets에 대해 shared channel-route matcher를 사용합니다. Slack timestamp prefix matching처럼 채널에 provider-specific equivalence rules가 있을 때만 `targetsMatch`를 전달하세요.
- 기본 route matcher 또는 custom `targetsMatch` callback이 실행되기 전에 채널이 provider ids를 canonicalize해야 하면서도 delivery용 원래 target은 보존해야 할 때는 `createChannelNativeOriginTargetResolver`에 `normalizeTargetForMatch`를 전달하세요. resolved delivery target 자체를 canonicalize해야 할 때만 `normalizeTarget`을 사용하세요.
- `availability` — 계정이 구성되었는지와 request를 처리해야 하는지 여부
- `presentation` — shared approval view model을 pending/resolved/expired native payloads 또는 final actions로 매핑
- `transport` — targets를 준비하고 native approval messages를 send/update/delete
- `interactions` — native buttons 또는 reactions를 위한 선택적 bind/unbind/clear-action hooks
- `observe` — 선택적 delivery diagnostics hooks
- 채널에 client, token, Bolt app, webhook receiver 같은 runtime-owned objects가 필요하면 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요. generic runtime-context registry를 사용하면 코어가 approval-specific wrapper glue를 추가하지 않고도 channel startup state에서 capability-driven handlers를 bootstrap할 수 있습니다.
- capability-driven seam이 아직 충분히 표현력이 없을 때만 lower-level `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`을 사용하세요.
- native approval channels는 해당 helper를 통해 `accountId`와 `approvalKind`를 모두 route해야 합니다. `accountId`는 multi-account approval policy를 올바른 bot account 범위로 유지하고, `approvalKind`는 코어에 hardcoded branches 없이 exec와 Plugin approval behavior를 채널에서 사용할 수 있게 합니다.
- 이제 코어는 approval reroute notices도 담당합니다. channel Plugin은 `createChannelNativeApprovalRuntime`에서 자체 "approval went to DMs / another channel" follow-up messages를 보내면 안 됩니다. 대신 shared approval capability helpers를 통해 정확한 origin + approver-DM routing을 노출하고, 코어가 실제 deliveries를 aggregate한 뒤 initiating chat에 notice를 다시 게시하도록 하세요.
- 전달된 approval id kind를 end-to-end로 보존하세요. native clients는 channel-local state에서 exec와 Plugin approval routing을 추측하거나 다시 작성하면 안 됩니다.
- 서로 다른 approval kinds는 의도적으로 서로 다른 native surfaces를 노출할 수 있습니다.
  현재 bundled examples:
  - Slack은 exec와 Plugin ids 모두에 native approval routing을 계속 사용할 수 있게 합니다.
  - Matrix는 exec와 Plugin approvals에 대해 동일한 native DM/channel routing과 reaction UX를 유지하면서도, approval kind별로 auth가 달라질 수 있게 합니다.
- `createApproverRestrictedNativeApprovalAdapter`는 compatibility wrapper로 계속 존재하지만, 새 code에서는 capability builder를 선호하고 Plugin에 `approvalCapability`를 노출해야 합니다.

hot channel entrypoints에서는 해당 family 중 한 부분만 필요할 때 더 좁은 runtime subpaths를 선호하세요.

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로, broader umbrella surface가 필요하지 않을 때는
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, 그리고
`openclaw/plugin-sdk/reply-chunking`을 선호하세요.

setup에 한정하면 다음과 같습니다.

- `openclaw/plugin-sdk/setup-runtime`은 runtime-safe setup helpers를 다룹니다:
  import-safe setup patch adapters(`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 그리고 delegated
  setup-proxy builders
- `openclaw/plugin-sdk/setup-adapter-runtime`은 `createEnvPatchedAccountSetupAdapter`를 위한 narrow env-aware adapter seam입니다.
- `openclaw/plugin-sdk/channel-setup`은 optional-install setup
  builders와 몇 가지 setup-safe primitives를 다룹니다:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 env-driven setup 또는 auth를 지원하고 generic startup/config flows가 runtime load 전에 해당 env names를 알아야 한다면, Plugin manifest에 `channelEnvVars`로 선언하세요. channel runtime `envVars` 또는 local constants는 operator-facing copy에만 유지하세요.

채널이 Plugin 런타임 시작 전에 `status`, `channels list`, `channels status` 또는
SecretRef 스캔에 나타날 수 있다면 `package.json`에 `openclaw.setupEntry`를 추가하세요. 이 엔트리포인트는 읽기 전용 명령 경로에서 안전하게 가져올 수 있어야 하며, 해당 요약에 필요한 채널 메타데이터, 설정에 안전한 구성 어댑터, 상태 어댑터, 채널 시크릿 대상 메타데이터를 반환해야 합니다. 설정 엔트리에서 클라이언트, 리스너 또는 전송 런타임을 시작하지 마세요.

기본 채널 엔트리 가져오기 경로도 좁게 유지하세요. 디스커버리는 채널을 활성화하지 않고도 엔트리와 채널 Plugin 모듈을 평가하여 기능을 등록할 수 있습니다. `channel-plugin-api.ts` 같은 파일은 설정 마법사, 전송 클라이언트, 소켓 리스너, 하위 프로세스 런처 또는 서비스 시작 모듈을 가져오지 않고 채널 Plugin 객체를 내보내야 합니다. 이러한 런타임 요소는 `registerFull(...)`, 런타임 setter 또는 지연 기능 어댑터에서 로드되는 모듈에 두세요.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` 같은 더 무거운 공유 설정/구성 헬퍼도 필요한 경우에만 더 넓은 `openclaw/plugin-sdk/setup` 이음새를 사용하세요.

채널이 설정 표면에서 "먼저 이 Plugin을 설치하세요"만 표시하려는 경우 `createOptionalChannelSetupSurface(...)`를 선호하세요. 생성된 어댑터/마법사는 구성 쓰기와 마무리에서 닫힌 상태로 실패하며, 유효성 검사, 마무리, 문서 링크 문구 전반에서 동일한 설치 필요 메시지를 재사용합니다.

다른 핫 채널 경로에는 더 넓은 레거시 표면보다 좁은 헬퍼를 선호하세요.

- 다중 계정 구성 및 기본 계정 폴백에는 `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, `openclaw/plugin-sdk/account-helpers`
- 인바운드 라우트/엔벌로프와 기록 후 디스패치 배선에는 `openclaw/plugin-sdk/inbound-envelope` 및
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- 대상 파싱/매칭에는 `openclaw/plugin-sdk/messaging-targets`
- 미디어 로딩과 아웃바운드 ID/전송 delegate 및 페이로드 계획에는 `openclaw/plugin-sdk/outbound-media` 및
  `openclaw/plugin-sdk/outbound-runtime`
- 아웃바운드 라우트가 명시적 `replyToId`/`threadId`를 보존하거나, 기본 세션 키가 여전히 일치한 뒤 현재 `:thread:` 세션을 복구해야 할 때는 `openclaw/plugin-sdk/channel-core`의 `buildThreadAwareOutboundSessionRoute(...)`를 사용하세요. 제공자 Plugin은 플랫폼에 네이티브 스레드 전달 의미 체계가 있을 때 우선순위, 접미사 동작, 스레드 ID 정규화를 재정의할 수 있습니다.
- 스레드 바인딩 수명 주기와 어댑터 등록에는 `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 에이전트/미디어 페이로드 필드 레이아웃이 여전히 필요한 경우에만 `openclaw/plugin-sdk/agent-media-payload`
- Telegram 사용자 지정 명령 정규화, 중복/충돌 유효성 검사, 폴백 안정 명령 구성 계약에는 `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 보통 기본 경로에서 멈출 수 있습니다. 코어가 승인을 처리하고 Plugin은 아웃바운드/인증 기능만 노출하면 됩니다. Matrix, Slack, Telegram, 사용자 지정 채팅 전송 같은 네이티브 승인 채널은 자체 승인 수명 주기를 만드는 대신 공유 네이티브 헬퍼를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리는 두 계층으로 분리해 유지하세요.

- Plugin 소유 증거 수집
- 공유 정책 평가

멘션 정책 결정에는 `openclaw/plugin-sdk/channel-mention-gating`을 사용하세요.
더 넓은 인바운드 헬퍼 배럴이 필요할 때만 `openclaw/plugin-sdk/channel-inbound`를 사용하세요.

Plugin 로컬 로직에 적합한 것:

- 봇에 대한 답장 감지
- 인용된 봇 감지
- 스레드 참여 검사
- 서비스/시스템 메시지 제외
- 봇 참여를 증명하는 데 필요한 플랫폼 네이티브 캐시

공유 헬퍼에 적합한 것:

- `requireMention`
- 명시적 멘션 결과
- 암시적 멘션 허용 목록
- 명령 우회
- 최종 건너뛰기 결정

권장 흐름:

1. 로컬 멘션 사실을 계산합니다.
2. 해당 사실을 `resolveInboundMentionDecision({ facts, policy })`에 전달합니다.
3. 인바운드 게이트에서 `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, `decision.shouldSkip`을 사용합니다.

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

`api.runtime.channel.mentions`는 이미 런타임 주입에 의존하는 번들 채널 Plugin을 위해 동일한 공유 멘션 헬퍼를 노출합니다.

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen`과 `resolveInboundMentionDecision`만 필요하다면 관련 없는 인바운드 런타임 헬퍼를 로드하지 않도록 `openclaw/plugin-sdk/channel-mention-gating`에서 가져오세요.

이전 `resolveMentionGating*` 헬퍼는 호환성 내보내기로만 `openclaw/plugin-sdk/channel-inbound`에 남아 있습니다. 새 코드는 `resolveInboundMentionDecision({ facts, policy })`를 사용해야 합니다.

## 연습

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    표준 Plugin 파일을 만드세요. `package.json`의 `channel` 필드가 이것을 채널 Plugin으로 만듭니다. 전체 패키지 메타데이터 표면은 [Plugin 설정 및 구성](/ko/plugins/sdk-setup#openclaw-channel)을 참조하세요.

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

    `configSchema`는 `plugins.entries.acme-chat.config`를 검증합니다. 채널 계정 구성이 아닌 Plugin 소유 설정에 사용하세요. `channelConfigs`는 `channels.acme-chat`를 검증하며, Plugin 런타임이 로드되기 전에 구성 스키마, 설정, UI 표면에서 사용하는 콜드 경로 소스입니다.

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` 인터페이스에는 선택적 어댑터 표면이 많습니다. 최소 항목인 `id`와 `setup`으로 시작하고, 필요할 때 어댑터를 추가하세요.

    `src/channel.ts`를 만드세요.

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
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

    표준 최상위 DM 키와 레거시 중첩 키를 모두 허용하는 채널에는 `plugin-sdk/channel-config-helpers`의 헬퍼를 사용하세요. `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, `normalizeChannelDmPolicy`는 계정 로컬 값을 상속된 루트 값보다 우선 유지합니다. 런타임과 마이그레이션이 동일한 계약을 읽도록 `normalizeLegacyDmAliases`를 통해 doctor 복구에 같은 resolver를 연결하세요.

    <Accordion title="What createChatChannelPlugin does for you">
      저수준 어댑터 인터페이스를 수동으로 구현하는 대신 선언적 옵션을 전달하면 빌더가 이를 조합합니다.

      | 옵션 | 연결하는 내용 |
      | --- | --- |
      | `security.dm` | 구성 필드에서 가져온 범위 지정 DM 보안 resolver |
      | `pairing.text` | 코드 교환이 있는 텍스트 기반 DM 페어링 흐름 |
      | `threading` | 답장 대상 모드 resolver(고정, 계정 범위 또는 사용자 지정) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 전송 함수 |

      완전한 제어가 필요하다면 선언적 옵션 대신 원시 어댑터 객체를 전달할 수도 있습니다.

      원시 아웃바운드 어댑터는 `chunker(text, limit, ctx)` 함수를 정의할 수 있습니다.
      선택적 `ctx.formatting`은 `maxLinesPerMessage` 같은 전달 시점의 포매팅 결정을 담습니다.
      응답 스레딩과 청크 경계가 공유 아웃바운드 전달에서 한 번만 해석되도록, 전송 전에 이를 적용하세요.
      전송 컨텍스트에는 네이티브 응답 대상이 해석된 경우 `replyToIdSource`(`implicit` 또는 `explicit`)도 포함되므로, 페이로드 헬퍼가 암시적 일회용 응답 슬롯을 소비하지 않고 명시적 응답 태그를 보존할 수 있습니다.
    </Accordion>

  </Step>

  <Step title="진입점 연결">
    `index.ts`를 생성합니다.

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

    채널 소유 CLI 디스크립터는 `registerCliMetadata(...)`에 넣어 OpenClaw가
    전체 채널 런타임을 활성화하지 않고도 루트 도움말에 표시할 수 있게 하세요.
    일반 전체 로드는 실제 명령 등록을 위해 동일한 디스크립터를 계속 가져옵니다.
    런타임 전용 작업에는 `registerFull(...)`을 유지하세요.
    `registerFull(...)`이 Gateway RPC 메서드를 등록한다면
    Plugin별 접두사를 사용하세요. 코어 관리 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약된 상태로 유지되며 항상
    `operator.admin`으로 해석됩니다.
    `defineChannelPluginEntry`는 등록 모드 분리를 자동으로 처리합니다. 모든
    옵션은 [진입점](/ko/plugins/sdk-entrypoints#definechannelpluginentry)을 참조하세요.

  </Step>

  <Step title="설정 진입점 추가">
    온보딩 중 가벼운 로드를 위해 `setup-entry.ts`를 생성합니다.

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    채널이 비활성화되었거나 구성되지 않은 경우 OpenClaw는 전체 진입점 대신 이를 로드합니다.
    설정 흐름 중 무거운 런타임 코드를 가져오지 않도록 합니다.
    자세한 내용은 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하세요.

    설정 안전 내보내기를 사이드카 모듈로 분리하는 번들 워크스페이스 채널은
    명시적인 설정 시점 런타임 세터도 필요할 때
    `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.

  </Step>

  <Step title="인바운드 메시지 처리">
    Plugin은 플랫폼에서 메시지를 받아 OpenClaw로 전달해야 합니다.
    일반적인 패턴은 요청을 검증하고 채널의 인바운드 핸들러를 통해 디스패치하는 Webhook입니다.

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      인바운드 메시지 처리는 채널별로 다릅니다. 각 채널 Plugin은
      자체 인바운드 파이프라인을 소유합니다. 실제 패턴은 번들 채널 Plugin
      (예: Microsoft Teams 또는 Google Chat Plugin 패키지)을 살펴보세요.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
`src/channel.test.ts`에 함께 배치되는 테스트를 작성합니다.

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

    공유 테스트 헬퍼는 [테스트](/ko/plugins/sdk-testing)를 참조하세요.

</Step>
</Steps>

## 파일 구조

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## 고급 주제

<CardGroup cols={2}>
  <Card title="스레딩 옵션" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정, 계정 범위 또는 사용자 지정 응답 모드
  </Card>
  <Card title="메시지 도구 통합" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 작업 검색
  </Card>
  <Card title="대상 해석" icon="crosshair" href="/ko/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    TTS, STT, 미디어, api.runtime을 통한 하위 에이전트
  </Card>
  <Card title="채널 턴 커널" icon="bolt" href="/ko/plugins/sdk-channel-turn">
    공유 인바운드 턴 수명 주기: 수집, 해석, 기록, 디스패치, 완료
  </Card>
</CardGroup>

<Note>
일부 번들 헬퍼 이음부는 번들 Plugin 유지관리와 호환성을 위해 여전히 존재합니다.
새 채널 Plugin에 권장되는 패턴은 아닙니다.
해당 번들 Plugin 계열을 직접 유지관리하는 경우가 아니라면 공통 SDK
표면의 일반 채널/설정/응답/런타임 하위 경로를 선호하세요.
</Note>

## 다음 단계

- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — Plugin이 모델도 제공하는 경우
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 하위 경로 가져오기 참조
- [SDK 테스트](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 계약 테스트
- [Plugin 매니페스트](/ko/plugins/manifest) — 전체 매니페스트 스키마

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
