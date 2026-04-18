---
read_when:
    - 새 메시징 채널 Plugin을 빌드하고 있습니다.
    - OpenClaw를 메시징 플랫폼에 연결하려고 합니다.
    - ChannelPlugin 어댑터 표면을 이해해야 합니다.
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 Plugin을 빌드하는 단계별 가이드
title: 채널 Plugin 빌드하기
x-i18n:
    generated_at: "2026-04-18T05:52:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 채널 Plugin 빌드하기

이 가이드는 OpenClaw를 메시징 플랫폼에 연결하는 채널 Plugin을 빌드하는 과정을 안내합니다. 이 가이드를 끝까지 따라가면 DM 보안, 페어링, 답글 스레딩, 아웃바운드 메시징을 갖춘 동작하는 채널을 만들 수 있습니다.

<Info>
  아직 OpenClaw Plugin을 한 번도 만들어본 적이 없다면, 기본 패키지 구조와 매니페스트 설정을 먼저 이해하기 위해
  [Getting Started](/ko/plugins/building-plugins)를 먼저 읽어보세요.
</Info>

## 채널 Plugin이 동작하는 방식

채널 Plugin에는 자체 send/edit/react 도구가 필요하지 않습니다. OpenClaw는 코어에 하나의 공용 `message` 도구를 유지합니다. 여러분의 Plugin이 담당하는 영역은 다음과 같습니다:

- **설정** — 계정 확인 및 설정 마법사
- **보안** — DM 정책 및 허용 목록
- **페어링** — DM 승인 흐름
- **세션 문법** — 프로바이더별 대화 ID를 기본 채팅, 스레드 ID, 부모 대체값에 매핑하는 방식
- **아웃바운드** — 플랫폼으로 텍스트, 미디어, 투표 보내기
- **스레딩** — 답글을 스레드로 묶는 방식

코어는 공용 메시지 도구, 프롬프트 연결, 바깥쪽 세션 키 형태, 일반적인 `:thread:` 관리, 디스패치를 담당합니다.

채널에서 미디어 소스를 전달하는 message-tool 파라미터를 추가한다면, 해당 파라미터 이름을 `describeMessageTool(...).mediaSourceParams`를 통해 노출하세요. 코어는 이 명시적 목록을 샌드박스 경로 정규화와 아웃바운드 미디어 접근 정책에 사용하므로, Plugin은 프로바이더별 아바타, 첨부 파일, 커버 이미지 파라미터를 위해 공용 코어에 특수 처리를 추가할 필요가 없습니다.
가능하면 `{ "set-profile": ["avatarUrl", "avatarPath"] }`처럼 액션 키 기반 맵을 반환해, 서로 무관한 액션이 다른 액션의 미디어 인자를 상속하지 않도록 하세요. 의도적으로 모든 노출 액션에서 공유되는 파라미터라면 평면 배열도 여전히 사용할 수 있습니다.

플랫폼이 대화 ID 내부에 추가 스코프를 저장한다면, 그 파싱은 Plugin 내부의 `messaging.resolveSessionConversation(...)`에 두세요. 이것이 `rawId`를 기본 대화 ID, 선택적 스레드 ID, 명시적 `baseConversationId`, 그리고 `parentConversationCandidates`에 매핑하는 정식 훅입니다.
`parentConversationCandidates`를 반환할 때는 가장 좁은 부모에서 가장 넓은/기본 대화 순으로 정렬하세요.

채널 레지스트리가 부팅되기 전에 동일한 파싱이 필요한 번들 Plugin은, 같은 `resolveSessionConversation(...)` export를 가진 최상위 `session-key-api.ts` 파일도 노출할 수 있습니다. 코어는 런타임 Plugin 레지스트리를 아직 사용할 수 없을 때만 이 부트스트랩 안전 표면을 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는 Plugin이 일반/raw ID 위에 부모 대체값만 추가로 필요할 때 사용할 수 있는 레거시 호환성 대체 수단으로 계속 제공됩니다. 두 훅이 모두 존재하면, 코어는 먼저 `resolveSessionConversation(...).parentConversationCandidates`를 사용하고, 정식 훅이 이를 생략한 경우에만 `resolveParentConversationCandidates(...)`로 대체합니다.

## 승인과 채널 기능

대부분의 채널 Plugin은 승인 전용 코드가 필요하지 않습니다.

- 코어는 같은 채팅에서의 `/approve`, 공용 승인 버튼 payload, 일반적인 대체 전달을 담당합니다.
- 채널에 승인 전용 동작이 필요하면 채널 Plugin에 하나의 `approvalCapability` 객체를 두는 방식을 우선하세요.
- `ChannelPlugin.approvals`는 제거되었습니다. 승인 전달/네이티브/렌더/인증 관련 사실은 `approvalCapability`에 두세요.
- `plugin.auth`는 login/logout 전용입니다. 코어는 더 이상 해당 객체에서 승인 인증 훅을 읽지 않습니다.
- `approvalCapability.authorizeActorAction` 및 `approvalCapability.getActionAvailabilityState`가 정식 승인 인증 표면입니다.
- 같은 채팅 승인 인증 가용성에는 `approvalCapability.getActionAvailabilityState`를 사용하세요.
- 채널이 네이티브 exec 승인을 노출한다면, 시작 표면/네이티브 클라이언트 상태가 같은 채팅 승인 인증과 다를 경우 `approvalCapability.getExecInitiatingSurfaceState`를 사용하세요. 코어는 이 exec 전용 훅을 사용해 시작 채널이 네이티브 exec 승인을 지원하는지 구분하고, `enabled`와 `disabled`를 판별하며, 네이티브 클라이언트 대체 안내에 해당 채널을 포함할지 결정합니다. `createApproverRestrictedNativeApprovalCapability(...)`는 일반적인 경우 이를 채워줍니다.
- 로컬 중복 승인 프롬프트 숨김이나 전달 전 typing indicator 전송 같은 채널별 payload 수명주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- `approvalCapability.delivery`는 네이티브 승인 라우팅 또는 대체 전달 억제에만 사용하세요.
- 채널 소유 네이티브 승인 사실에는 `approvalCapability.nativeRuntime`을 사용하세요. 핫 채널 진입점에서는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 통해 이를 지연 로드 상태로 유지하세요. 그러면 필요 시 런타임 모듈을 import하면서도 코어가 승인 수명주기를 구성할 수 있습니다.
- 채널이 공용 렌더러 대신 맞춤 승인 payload를 정말로 필요로 하는 경우에만 `approvalCapability.render`를 사용하세요.
- 비활성화 경로 답글에서 네이티브 exec 승인을 활성화하는 데 필요한 정확한 설정 항목을 설명하고 싶다면 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 훅은 `{ channel, channelLabel, accountId }`를 받습니다. 이름 있는 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위 경로를 렌더링해야 합니다.
- 채널이 기존 설정에서 안정적인 소유자 유사 DM ID를 추론할 수 있다면, 승인 전용 코어 로직을 추가하지 않고 같은 채팅 `/approve`를 제한하기 위해 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용하세요.
- 채널에 네이티브 승인 전달이 필요하다면, 채널 코드는 대상 정규화와 전송/표현 관련 사실에 집중시키세요. `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`를 사용하세요. 채널별 사실은 `approvalCapability.nativeRuntime` 뒤에 두고, 가능하면 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 통해 노출하세요. 그러면 코어가 핸들러를 구성하고 요청 필터링, 라우팅, 중복 제거, 만료, Gateway 구독, 다른 경로로 전달됨 안내를 담당할 수 있습니다. `nativeRuntime`은 몇 가지 더 작은 표면으로 나뉩니다:
- `availability` — 계정 설정 여부와 요청 처리 여부
- `presentation` — 공용 승인 뷰 모델을 대기 중/해결됨/만료됨 네이티브 payload 또는 최종 액션으로 매핑
- `transport` — 대상 준비 및 네이티브 승인 메시지 전송/업데이트/삭제
- `interactions` — 네이티브 버튼 또는 반응에 대한 선택적 bind/unbind/clear-action 훅
- `observe` — 선택적 전달 진단 훅
- 채널에 클라이언트, 토큰, Bolt 앱, Webhook 수신기 같은 런타임 소유 객체가 필요하다면 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요. 일반적인 runtime-context 레지스트리는 코어가 승인 전용 래퍼 glue를 추가하지 않고도 채널 시작 상태에서 capability 기반 핸들러를 부트스트랩할 수 있게 해줍니다.
- capability 기반 표면만으로 표현이 충분하지 않을 때에만 더 저수준의 `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`을 사용하세요.
- 네이티브 승인 채널은 반드시 `accountId`와 `approvalKind` 둘 다를 해당 헬퍼를 통해 라우팅해야 합니다. `accountId`는 다중 계정 승인 정책을 올바른 봇 계정 범위로 유지하고, `approvalKind`는 코어에 하드코딩된 분기 없이도 exec와 Plugin 승인 동작을 채널에서 사용할 수 있게 합니다.
- 이제 승인 재라우팅 안내도 코어가 담당합니다. 채널 Plugin은 `createChannelNativeApprovalRuntime`에서 자체적으로 "승인이 DM/다른 채널로 갔다"는 후속 메시지를 보내지 않아야 합니다. 대신 공용 승인 capability 헬퍼를 통해 정확한 origin 및 approver-DM 라우팅을 노출하고, 코어가 실제 전달 결과를 집계한 뒤 시작 채팅에 안내를 게시하도록 하세요.
- 전달된 승인 ID 종류를 처음부터 끝까지 보존하세요. 네이티브 클라이언트는 채널 로컬 상태를 바탕으로 exec와 Plugin 승인 라우팅을 추측하거나 다시 써서는 안 됩니다.
- 서로 다른 승인 종류는 의도적으로 서로 다른 네이티브 표면을 노출할 수 있습니다.
  현재 번들 예시는 다음과 같습니다:
  - Slack은 exec 및 Plugin ID 모두에 대해 네이티브 승인 라우팅을 계속 제공합니다.
  - Matrix는 exec와 Plugin 승인 모두에서 동일한 네이티브 DM/채널 라우팅과 reaction UX를 유지하면서도, 승인 종류에 따라 인증은 다르게 둘 수 있습니다.
- `createApproverRestrictedNativeApprovalAdapter`는 호환성 래퍼로 여전히 존재하지만, 새 코드는 capability builder를 우선 사용하고 Plugin에 `approvalCapability`를 노출해야 합니다.

핫 채널 진입점에서는 이 계열 전체가 아니라 일부만 필요하다면 더 좁은 런타임 하위 경로를 우선 사용하세요:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로, 더 넓은 umbrella 표면이 필요하지 않다면 `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, 그리고
`openclaw/plugin-sdk/reply-chunking`을 우선 사용하세요.

설정과 관련해서는 특히 다음과 같습니다:

- `openclaw/plugin-sdk/setup-runtime`은 런타임 안전 설정 헬퍼를 포함합니다:
  import-safe setup patch adapter(`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime`은 `createEnvPatchedAccountSetupAdapter`를 위한 좁은 범위의 env 인식 adapter 표면입니다
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 setup builder와 몇 가지 setup-safe 기본 요소를 포함합니다:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 env 기반 setup 또는 auth를 지원하고, 일반적인 시작/설정 흐름이 런타임 로드 전에 해당 env 이름을 알아야 한다면, Plugin 매니페스트의 `channelEnvVars`에 이를 선언하세요. 채널 런타임의 `envVars`나 로컬 상수는 운영자 대상 복사용으로만 유지하세요.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, 그리고
`splitSetupEntries`

- 더 무거운 공용 setup/config 헬퍼인
  `moveSingleAccountChannelSectionToDefaultAccount(...)`도 필요한 경우에만
  더 넓은 `openclaw/plugin-sdk/setup` 표면을 사용하세요

채널이 설정 표면에 "먼저 이 Plugin을 설치하세요"만 알리고 싶다면, `createOptionalChannelSetupSurface(...)`를 우선 사용하세요. 생성된 adapter/wizard는 설정 쓰기와 최종화에서 fail closed 방식으로 동작하며, 검증, finalize, 문서 링크 복사 전반에 걸쳐 동일한 설치 필요 메시지를 재사용합니다.

다른 핫 채널 경로에서도 더 넓은 레거시 표면보다 좁은 헬퍼를 우선 사용하세요:

- 다중 계정 설정과 기본 계정 대체에는
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, 그리고
  `openclaw/plugin-sdk/account-helpers`
- 인바운드 라우트/envelope와
  record-and-dispatch 연결에는
  `openclaw/plugin-sdk/inbound-envelope` 및
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- 대상 파싱/매칭에는 `openclaw/plugin-sdk/messaging-targets`
- 미디어 로딩과 아웃바운드
  ID/send delegate에는 `openclaw/plugin-sdk/outbound-media` 및
  `openclaw/plugin-sdk/outbound-runtime`
- 스레드 바인딩 수명주기와 adapter 등록에는
  `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 agent/media
  payload 필드 레이아웃이 여전히 필요한 경우에만
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram 커스텀 명령 정규화,
  중복/충돌 검증, fallback 안정 명령 설정 계약에는
  `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 보통 기본 경로에서 멈춰도 됩니다. 코어가 승인을 처리하고 Plugin은 아웃바운드/인증 capability만 노출하면 됩니다. Matrix, Slack, Telegram, 커스텀 채팅 전송 계층 같은 네이티브 승인 채널은 자체 승인 수명주기를 구현하는 대신 공용 네이티브 헬퍼를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리는 두 계층으로 나누어 유지하세요:

- Plugin 소유의 증거 수집
- 공용 정책 평가

멘션 정책 결정에는 `openclaw/plugin-sdk/channel-mention-gating`을 사용하세요.
더 넓은 인바운드 헬퍼 배럴이 필요한 경우에만 `openclaw/plugin-sdk/channel-inbound`를 사용하세요.

Plugin 로컬 로직에 잘 맞는 항목:

- 봇에 대한 답글 감지
- 봇 인용 감지
- 스레드 참여 여부 확인
- 서비스/시스템 메시지 제외
- 봇 참여를 증명하는 데 필요한 플랫폼 네이티브 캐시

공용 헬퍼에 잘 맞는 항목:

- `requireMention`
- 명시적 멘션 결과
- 암시적 멘션 허용 목록
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

`api.runtime.channel.mentions`는 이미 런타임 주입에 의존하는 번들 채널 Plugin을 위해 동일한 공용 멘션 헬퍼를 노출합니다:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen`과 `resolveInboundMentionDecision`만 필요하다면, 관련 없는 인바운드 런타임 헬퍼를 로드하지 않도록 `openclaw/plugin-sdk/channel-mention-gating`에서 import하세요.

기존 `resolveMentionGating*` 헬퍼는 호환성 export로만 `openclaw/plugin-sdk/channel-inbound`에 남아 있습니다. 새 코드는 `resolveInboundMentionDecision({ facts, policy })`를 사용해야 합니다.

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지와 매니페스트">
    표준 Plugin 파일을 만드세요. `package.json`의 `channel` 필드가 이것을 채널 Plugin으로 만듭니다. 전체 패키지 메타데이터 표면은 [Plugin Setup and Config](/ko/plugins/sdk-setup#openclaw-channel)를 참고하세요:

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

  <Step title="채널 Plugin 객체 빌드">
    `ChannelPlugin` 인터페이스에는 선택적인 어댑터 표면이 많이 있습니다. 최소 구성인 `id`와 `setup`부터 시작하고, 필요에 따라 어댑터를 추가하세요.

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

    <Accordion title="createChatChannelPlugin이 대신 처리해주는 일">
      저수준 어댑터 인터페이스를 직접 구현하는 대신 선언적 옵션을 전달하면, 빌더가 이를 조합해줍니다:

      | 옵션 | 연결되는 항목 |
      | --- | --- |
      | `security.dm` | 설정 필드에서 범위가 지정된 DM 보안 resolver |
      | `pairing.text` | 코드 교환을 사용하는 텍스트 기반 DM 페어링 흐름 |
      | `threading` | reply-to 모드 resolver(고정, 계정 범위, 또는 커스텀) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 send 함수 |

      완전한 제어가 필요하다면 선언적 옵션 대신 원시 어댑터 객체를 직접 전달할 수도 있습니다.
    </Accordion>

  </Step>

  <Step title="엔트리 포인트 연결">
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

    채널 소유 CLI descriptor는 `registerCliMetadata(...)`에 두어, OpenClaw가 전체 채널 런타임을 활성화하지 않고도 루트 도움말에 이를 표시할 수 있게 하세요. 그러면서 일반적인 전체 로드에서도 실제 명령 등록을 위해 같은 descriptor를 사용할 수 있습니다.
    `registerFull(...)`은 런타임 전용 작업용으로 유지하세요.
    `registerFull(...)`이 Gateway RPC 메서드를 등록한다면, Plugin 전용 접두사를 사용하세요. 코어 관리자 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 항상 `operator.admin`으로 해석됩니다.
    `defineChannelPluginEntry`는 등록 모드 분리를 자동으로 처리합니다. 모든 옵션은 [Entry Points](/ko/plugins/sdk-entrypoints#definechannelpluginentry)를 참고하세요.

  </Step>

  <Step title="setup 엔트리 추가">
    온보딩 중 경량 로딩을 위해 `setup-entry.ts`를 만드세요:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw는 채널이 비활성화되었거나 설정되지 않은 경우 전체 엔트리 대신 이것을 로드합니다.
    이렇게 하면 설정 흐름 중 무거운 런타임 코드를 끌어오지 않아도 됩니다.
    자세한 내용은 [Setup and Config](/ko/plugins/sdk-setup#setup-entry)를 참고하세요.

    setup-safe export를 사이드카 모듈로 분리하는 번들 작업 공간 채널은 setup 시점 런타임 setter가 명시적으로도 필요할 경우 `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.

  </Step>

  <Step title="인바운드 메시지 처리">
    Plugin은 플랫폼에서 메시지를 수신하여 OpenClaw로 전달해야 합니다. 일반적인 패턴은 요청을 검증하고 해당 채널의 인바운드 핸들러를 통해 디스패치하는 Webhook입니다:

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
      인바운드 메시지 처리는 채널별로 다릅니다. 각 채널 Plugin은 자체 인바운드 파이프라인을 소유합니다. 실제 패턴은 번들 채널 Plugin(예: Microsoft Teams 또는 Google Chat Plugin 패키지)을 참고하세요.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
`src/channel.test.ts`에 소스와 함께 위치한 테스트를 작성하세요:

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

    공용 테스트 헬퍼는 [Testing](/ko/plugins/sdk-testing)을 참고하세요.

  </Step>
</Steps>

## 파일 구조

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 메타데이터
├── openclaw.plugin.json      # 설정 스키마가 포함된 매니페스트
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
    고정, 계정 범위, 또는 커스텀 reply 모드
  </Card>
  <Card title="메시지 도구 통합" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 액션 검색
  </Card>
  <Card title="대상 확인" icon="crosshair" href="/ko/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime를 통한 TTS, STT, 미디어, 하위 에이전트
  </Card>
</CardGroup>

<Note>
일부 번들 헬퍼 표면은 번들 Plugin 유지보수와 호환성을 위해 여전히 존재합니다.
새 채널 Plugin에는 권장되는 패턴이 아닙니다. 해당 번들 Plugin 계열을 직접 유지보수하는 경우가 아니라면 공용 SDK 표면의 일반적인 channel/setup/reply/runtime 하위 경로를 우선 사용하세요.
</Note>

## 다음 단계

- [프로바이더 Plugins](/ko/plugins/sdk-provider-plugins) — Plugin이 모델도 제공하는 경우
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [SDK Testing](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 계약 테스트
- [Plugin 매니페스트](/ko/plugins/manifest) — 전체 매니페스트 스키마
