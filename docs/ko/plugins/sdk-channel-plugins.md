---
read_when:
    - 새 메시징 채널 plugin을 빌드하고 있습니다
    - OpenClaw를 메시징 플랫폼에 연결하려고 합니다
    - ChannelPlugin 어댑터 표면을 이해해야 합니다
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 plugin을 빌드하는 단계별 가이드
title: 채널 plugin 빌드하기
x-i18n:
    generated_at: "2026-04-11T02:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 채널 plugin 빌드하기

이 가이드는 OpenClaw를 메시징 플랫폼에 연결하는 채널 plugin을 빌드하는 과정을 안내합니다. 이 가이드를 마치면 DM 보안, 페어링, 답장 스레딩, 아웃바운드 메시징을 갖춘 작동하는 채널을 만들 수 있습니다.

<Info>
  아직 OpenClaw plugin을 한 번도 빌드해본 적이 없다면, 먼저 기본 패키지 구조와 manifest 설정을 위해
  [시작하기](/ko/plugins/building-plugins)를 읽어보세요.
</Info>

## 채널 plugin의 동작 방식

채널 plugin은 자체 send/edit/react tool이 필요하지 않습니다. OpenClaw는 core에 하나의 공유 `message` tool을 유지합니다. plugin이 담당하는 것은 다음과 같습니다:

- **설정** — 계정 해석과 설정 wizard
- **보안** — DM 정책과 허용 목록
- **페어링** — DM 승인 흐름
- **세션 문법** — provider별 대화 ID가 기본 채팅, 스레드 ID, 부모 폴백으로 매핑되는 방식
- **아웃바운드** — 플랫폼으로 텍스트, 미디어, 투표 보내기
- **스레딩** — 답장이 스레드화되는 방식

core는 공유 message tool, 프롬프트 연결, 바깥쪽 세션 키 형태, 일반적인 `:thread:` 기록 관리, 그리고 디스패치를 담당합니다.

플랫폼이 대화 ID 안에 추가 범위 정보를 저장한다면, 그 파싱은 plugin 안에 `messaging.resolveSessionConversation(...)`로 유지하세요. 이것이 `rawId`를 기본 대화 ID, 선택적 스레드 ID, 명시적 `baseConversationId`, 그리고 모든 `parentConversationCandidates`로 매핑하는 정식 훅입니다. `parentConversationCandidates`를 반환할 때는 가장 좁은 부모에서 가장 넓은/기본 대화 순으로 정렬된 상태를 유지하세요.

채널 레지스트리가 부팅되기 전에 동일한 파싱이 필요한 번들 plugin은 일치하는 `resolveSessionConversation(...)` export가 있는 최상위 `session-key-api.ts` 파일도 노출할 수 있습니다. core는 런타임 plugin 레지스트리를 아직 사용할 수 없을 때만 그 부트스트랩 안전 표면을 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는 plugin이 일반/raw ID 위에 부모 폴백만 필요로 할 때의 레거시 호환성 폴백으로 계속 사용할 수 있습니다. 두 훅이 모두 존재하면 core는 먼저 `resolveSessionConversation(...).parentConversationCandidates`를 사용하고, 정식 훅이 이를 생략한 경우에만 `resolveParentConversationCandidates(...)`로 폴백합니다.

## 승인과 채널 기능

대부분의 채널 plugin은 승인 전용 코드가 필요하지 않습니다.

- core는 동일 채팅 `/approve`, 공유 승인 버튼 페이로드, 일반적인 폴백 전달을 담당합니다.
- 채널에 승인 전용 동작이 필요할 때는 채널 plugin에 하나의 `approvalCapability` 객체를 두는 방식을 우선하세요.
- `ChannelPlugin.approvals`는 제거되었습니다. 승인 전달/native/render/auth 관련 정보는 `approvalCapability`에 넣으세요.
- `plugin.auth`는 login/logout 전용입니다. core는 더 이상 그 객체에서 승인 인증 훅을 읽지 않습니다.
- `approvalCapability.authorizeActorAction`과 `approvalCapability.getActionAvailabilityState`가 정식 승인 인증 경계면입니다.
- 동일 채팅 승인 인증 가용성에는 `approvalCapability.getActionAvailabilityState`를 사용하세요.
- 채널이 native exec 승인을 노출한다면, 동일 채팅 승인 인증과 시작 표면/native 클라이언트 상태가 다를 때 `approvalCapability.getExecInitiatingSurfaceState`를 사용하세요. core는 이 exec 전용 훅을 사용해 `enabled`와 `disabled`를 구분하고, 시작 채널이 native exec 승인을 지원하는지 판단하며, native 클라이언트 폴백 안내에 그 채널을 포함합니다. `createApproverRestrictedNativeApprovalCapability(...)`는 일반적인 경우에 이를 채워줍니다.
- 중복된 로컬 승인 프롬프트 숨김이나 전달 전 타이핑 표시 전송 같은 채널별 페이로드 수명 주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- `approvalCapability.delivery`는 native 승인 라우팅 또는 폴백 억제에만 사용하세요.
- `approvalCapability.nativeRuntime`는 채널 소유 native 승인 정보를 위해 사용하세요. hot 채널 엔트리포인트에서는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`로 이를 지연 로드 상태로 유지하세요. 이 방식은 core가 승인 수명 주기를 조합할 수 있게 하면서도 필요 시 런타임 모듈을 동적으로 import할 수 있습니다.
- 채널이 공유 렌더러 대신 정말로 사용자 정의 승인 페이로드가 필요할 때만 `approvalCapability.render`를 사용하세요.
- 채널이 비활성 경로 응답에서 native exec 승인을 활성화하는 데 필요한 정확한 설정 항목을 설명하고 싶다면 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 훅은 `{ channel, channelLabel, accountId }`를 받습니다. 이름 있는 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위 경로를 렌더링해야 합니다.
- 채널이 기존 설정에서 안정적인 소유자 유사 DM 정체성을 추론할 수 있다면, 승인 전용 core 로직을 추가하지 않고 동일 채팅 `/approve`를 제한하기 위해 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용하세요.
- 채널에 native 승인 전달이 필요하다면, 채널 코드는 대상 정규화와 전송/표현 정보에 집중하도록 유지하세요. `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`를 사용하세요. 채널별 정보는 `approvalCapability.nativeRuntime` 뒤에 두고, 가능하면 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 통해 노출하세요. 그러면 core가 핸들러를 조합하고 요청 필터링, 라우팅, 중복 제거, 만료, gateway 구독, 다른 경로로 라우팅됨 알림을 담당할 수 있습니다. `nativeRuntime`은 몇 개의 더 작은 경계면으로 나뉩니다:
- `availability` — 계정이 설정되어 있는지와 요청을 처리해야 하는지 여부
- `presentation` — 공유 승인 뷰 모델을 대기 중/해결됨/만료됨 native 페이로드나 최종 액션으로 매핑
- `transport` — 대상 준비와 native 승인 메시지 전송/업데이트/삭제
- `interactions` — native 버튼이나 리액션을 위한 선택적 bind/unbind/clear-action 훅
- `observe` — 선택적 전달 진단 훅
- 채널에 client, token, Bolt 앱, webhook receiver 같은 런타임 소유 객체가 필요하다면 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요. 일반적인 runtime-context 레지스트리는 core가 승인 전용 래퍼 glue를 추가하지 않고도 채널 시작 상태에서 기능 중심 핸들러를 부트스트랩할 수 있게 해줍니다.
- 기능 중심 경계면이 아직 충분히 표현력이 없을 때만 하위 수준의 `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`을 사용하세요.
- native 승인 채널은 `accountId`와 `approvalKind`를 모두 해당 헬퍼들을 통해 라우팅해야 합니다. `accountId`는 다중 계정 승인 정책이 올바른 봇 계정 범위에 머물도록 하고, `approvalKind`는 core에 하드코딩된 분기 없이도 채널에서 exec와 plugin 승인 동작을 구분 가능하게 합니다.
- 이제 승인 재라우팅 알림도 core가 담당합니다. 채널 plugin은 `createChannelNativeApprovalRuntime`에서 자체적으로 "승인이 DM 또는 다른 채널로 갔다"는 후속 메시지를 보내지 말고, 대신 공유 승인 기능 헬퍼를 통해 정확한 origin + approver-DM 라우팅을 노출하고, 시작 채팅에 알림을 게시하기 전에 core가 실제 전달 결과를 집계하도록 하세요.
- 전달된 승인 ID 종류를 처음부터 끝까지 보존하세요. native 클라이언트는 채널 로컬 상태에서 exec와 plugin 승인 라우팅을 추측하거나 다시 써서는 안 됩니다.
- 서로 다른 승인 종류는 의도적으로 서로 다른 native 표면을 노출할 수 있습니다.
  현재 번들 예시:
  - Slack은 exec 및 plugin ID 모두에 대해 native 승인 라우팅을 계속 제공합니다.
  - Matrix는 exec와 plugin 승인 모두에서 동일한 native DM/채널 라우팅과 리액션 UX를 유지하면서도, 승인 종류별로 인증은 다르게 둘 수 있습니다.
- `createApproverRestrictedNativeApprovalAdapter`는 여전히 호환성 래퍼로 존재하지만, 새 코드에서는 기능 빌더를 우선 사용하고 plugin에 `approvalCapability`를 노출해야 합니다.

hot 채널 엔트리포인트에서는 이 계열 전체가 아니라 일부만 필요할 경우 더 좁은 런타임 하위 경로를 우선 사용하세요:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로, 더 넓은 umbrella 표면이 필요하지 않다면 `openclaw/plugin-sdk/setup-runtime`, `openclaw/plugin-sdk/setup-adapter-runtime`, `openclaw/plugin-sdk/reply-runtime`, `openclaw/plugin-sdk/reply-dispatch-runtime`, `openclaw/plugin-sdk/reply-reference`, `openclaw/plugin-sdk/reply-chunking`을 우선 사용하세요.

설정과 관련해서는 특히 다음과 같습니다:

- `openclaw/plugin-sdk/setup-runtime`은 런타임 안전 설정 헬퍼를 포함합니다:
  import-safe setup patch adapter(`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`), lookup-note 출력, `promptResolvedAllowFrom`, `splitSetupEntries`, 그리고 위임 setup-proxy 빌더
- `openclaw/plugin-sdk/setup-adapter-runtime`은 `createEnvPatchedAccountSetupAdapter`를 위한 더 좁은 env 인식 adapter 경계면입니다.
- `openclaw/plugin-sdk/channel-setup`은 선택 설치 설정 빌더와 몇 가지 setup-safe 기본 요소를 포함합니다:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 env 기반 설정 또는 인증을 지원하고, 일반적인 시작/설정 흐름이 런타임 로드 전에 해당 env 이름을 알아야 한다면, plugin manifest에 `channelEnvVars`로 선언하세요. 채널 런타임 `envVars` 또는 로컬 상수는 운영자 대상 문구에만 유지하세요.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, 그리고 `splitSetupEntries`

- 더 무거운 공유 설정/구성 헬퍼(예: `moveSingleAccountChannelSectionToDefaultAccount(...)`)도 필요한 경우에만 더 넓은 `openclaw/plugin-sdk/setup` 경계면을 사용하세요.

채널이 설정 표면에서 "먼저 이 plugin을 설치하세요"만 알리고 싶다면, `createOptionalChannelSetupSurface(...)`를 우선 사용하세요. 생성된 adapter/wizard는 설정 쓰기와 최종화에서 fail closed로 동작하며, 검증, 최종화, 문서 링크 문구 전반에서 동일한 설치 필요 메시지를 재사용합니다.

다른 hot 채널 경로에서도, 더 넓은 레거시 표면보다 더 좁은 헬퍼를 우선 사용하세요:

- 다중 계정 설정과 기본 계정 폴백에는 `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`, `openclaw/plugin-sdk/account-resolution`, `openclaw/plugin-sdk/account-helpers`
- 인바운드 경로/envelope와 기록 후 디스패치 연결에는 `openclaw/plugin-sdk/inbound-envelope`와 `openclaw/plugin-sdk/inbound-reply-dispatch`
- 대상 파싱/매칭에는 `openclaw/plugin-sdk/messaging-targets`
- 미디어 로딩과 아웃바운드 정체성/전송 delegate에는 `openclaw/plugin-sdk/outbound-media`와 `openclaw/plugin-sdk/outbound-runtime`
- 스레드 바인딩 수명 주기와 adapter 등록에는 `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 agent/media 페이로드 필드 레이아웃이 여전히 필요한 경우에만 `openclaw/plugin-sdk/agent-media-payload`
- Telegram 사용자 정의 명령 정규화, 중복/충돌 검증, 폴백 안정 명령 설정 계약에는 `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 보통 기본 경로로 충분합니다. core가 승인을 처리하고 plugin은 아웃바운드/인증 기능만 노출하면 됩니다. Matrix, Slack, Telegram, 그리고 사용자 정의 채팅 전송 계층 같은 native 승인 채널은 자체 승인 수명 주기를 구현하는 대신 공유 native 헬퍼를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리는 다음 두 계층으로 분리해 유지하세요:

- plugin 소유의 증거 수집
- 공유 정책 평가

공유 계층에는 `openclaw/plugin-sdk/channel-inbound`를 사용하세요.

plugin 로컬 로직에 적합한 예:

- 봇에게 답장했는지 감지
- 봇 인용 감지
- 스레드 참여 여부 확인
- 서비스/시스템 메시지 제외
- 봇 참여를 입증하는 데 필요한 플랫폼 native 캐시

공유 헬퍼에 적합한 예:

- `requireMention`
- 명시적 멘션 결과
- 암묵적 멘션 허용 목록
- 명령 우회
- 최종 건너뛰기 결정

권장 흐름:

1. 로컬 멘션 정보를 계산합니다.
2. 그 정보를 `resolveInboundMentionDecision({ facts, policy })`에 전달합니다.
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

`api.runtime.channel.mentions`는 이미 런타임 주입에 의존하는 번들 채널 plugin을 위해 동일한 공유 멘션 헬퍼를 노출합니다:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

이전의 `resolveMentionGating*` 헬퍼는 `openclaw/plugin-sdk/channel-inbound`에 호환성 export로만 남아 있습니다. 새 코드에서는 `resolveInboundMentionDecision({ facts, policy })`를 사용해야 합니다.

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지와 manifest">
    표준 plugin 파일을 생성하세요. `package.json`의 `channel` 필드는 이것이 채널 plugin임을 나타냅니다. 전체 패키지 메타데이터 표면은
    [Plugin 설정 및 구성](/ko/plugins/sdk-setup#openclaw-channel)을 참조하세요:

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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="채널 plugin 객체 빌드하기">
    `ChannelPlugin` 인터페이스에는 많은 선택적 adapter 표면이 있습니다. 최소 구성인 `id`와 `setup`부터 시작하고, 필요에 따라 adapter를 추가하세요.

    `src/channel.ts`를 만드세요:

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

    <Accordion title="createChatChannelPlugin이 제공하는 것">
      하위 수준 adapter 인터페이스를 직접 구현하는 대신 선언적 옵션을 전달하면, 빌더가 이를 조합해 구성해 줍니다:

      | 옵션 | 연결되는 항목 |
      | --- | --- |
      | `security.dm` | 설정 필드에서 범위가 지정된 DM 보안 resolver |
      | `pairing.text` | 코드 교환을 사용하는 텍스트 기반 DM 페어링 흐름 |
      | `threading` | 답장 모드 resolver(고정, 계정 범위, 또는 사용자 정의) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 전송 함수 |

      완전한 제어가 필요하다면 선언적 옵션 대신 원시 adapter 객체를 전달할 수도 있습니다.
    </Accordion>

  </Step>

  <Step title="엔트리포인트 연결하기">
    `index.ts`를 생성하세요:

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

    채널 소유 CLI descriptor는 `registerCliMetadata(...)`에 두어 OpenClaw가 전체 채널 런타임을 활성화하지 않고도 루트 도움말에 이를 표시할 수 있게 하세요. 그러면서 일반 전체 로드 시에는 실제 명령 등록을 위해 같은 descriptor를 그대로 가져오게 됩니다. 런타임 전용 작업은 `registerFull(...)`에 유지하세요.
    `registerFull(...)`가 Gateway RPC 메서드를 등록한다면, plugin 전용 접두사를 사용하세요. 핵심 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 항상 `operator.admin`으로 해석됩니다.
    `defineChannelPluginEntry`는 등록 모드 분리를 자동으로 처리합니다. 모든 옵션은
    [엔트리포인트](/ko/plugins/sdk-entrypoints#definechannelpluginentry)를 참조하세요.

  </Step>

  <Step title="setup 엔트리 추가하기">
    온보딩 중 경량 로드를 위해 `setup-entry.ts`를 생성하세요:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw는 채널이 비활성화되었거나 설정되지 않았을 때 전체 엔트리 대신 이것을 로드합니다.
    이를 통해 설정 흐름 중에 무거운 런타임 코드를 끌어오지 않게 됩니다.
    자세한 내용은 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하세요.

  </Step>

  <Step title="인바운드 메시지 처리하기">
    plugin은 플랫폼에서 메시지를 수신하고 이를 OpenClaw로 전달해야 합니다. 일반적인 패턴은 요청을 검증하고 채널의 인바운드 핸들러를 통해 이를 디스패치하는 webhook입니다:

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
      인바운드 메시지 처리는 채널별로 다릅니다. 각 채널 plugin은 자체 인바운드 파이프라인을 소유합니다. 실제 패턴은 번들 채널 plugin
      (예: Microsoft Teams 또는 Google Chat plugin 패키지)을 살펴보세요.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
같은 위치의 `src/channel.test.ts`에 테스트를 작성하세요:

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

    공유 테스트 헬퍼는 [테스팅](/ko/plugins/sdk-testing)을 참조하세요.

  </Step>
</Steps>

## 파일 구조

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 메타데이터
├── openclaw.plugin.json      # 설정 스키마가 포함된 manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 공개 export (선택 사항)
├── runtime-api.ts            # 내부 런타임 export (선택 사항)
└── src/
    ├── channel.ts            # createChatChannelPlugin을 통한 ChannelPlugin
    ├── channel.test.ts       # 테스트
    ├── client.ts             # 플랫폼 API 클라이언트
    └── runtime.ts            # 런타임 저장소(필요한 경우)
```

## 고급 주제

<CardGroup cols={2}>
  <Card title="스레딩 옵션" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정, 계정 범위, 또는 사용자 정의 답장 모드
  </Card>
  <Card title="메시지 tool 통합" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 액션 디스커버리
  </Card>
  <Card title="대상 해석" icon="crosshair" href="/ko/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime를 통한 TTS, STT, 미디어, 서브에이전트
  </Card>
</CardGroup>

<Note>
일부 번들 헬퍼 경계면은 번들 plugin 유지 관리와 호환성을 위해 여전히 존재합니다. 하지만 이것이 새 채널 plugin에 권장되는 패턴은 아닙니다. 해당 번들 plugin 계열을 직접 유지 관리하는 경우가 아니라면, 공통 SDK 표면의 일반적인 channel/setup/reply/runtime 하위 경로를 우선 사용하세요.
</Note>

## 다음 단계

- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — plugin이 모델도 제공하는 경우
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [SDK 테스팅](/ko/plugins/sdk-testing) — 테스트 유틸리티와 계약 테스트
- [Plugin Manifest](/ko/plugins/manifest) — 전체 manifest 스키마
