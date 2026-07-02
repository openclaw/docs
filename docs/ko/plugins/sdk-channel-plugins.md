---
read_when:
    - 새 메시징 채널 Plugin을 빌드하고 있습니다
    - OpenClaw를 메시징 플랫폼에 연결하려고 합니다
    - ChannelPlugin 어댑터 표면을 이해해야 합니다
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 Plugin 빌드 단계별 가이드
title: 채널 Plugin 빌드하기
x-i18n:
    generated_at: "2026-07-02T22:27:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

이 가이드는 OpenClaw를 메시징 플랫폼에 연결하는 채널 Plugin을 빌드하는 과정을 안내합니다. 끝까지 진행하면 DM 보안,
페어링, 답장 스레딩, 아웃바운드 메시징을 갖춘 동작하는 채널을 만들 수 있습니다.

<Info>
  이전에 OpenClaw Plugin을 빌드한 적이 없다면, 기본 패키지
  구조와 매니페스트 설정을 위해 먼저
  [시작하기](/ko/plugins/building-plugins)를 읽어 보세요.
</Info>

## 채널 Plugin 작동 방식

채널 Plugin에는 자체 send/edit/react 도구가 필요하지 않습니다. OpenClaw는 코어에 하나의
공유 `message` 도구를 유지합니다. Plugin이 소유하는 항목은 다음과 같습니다.

- **구성** - 계정 확인 및 설정 마법사
- **보안** - DM 정책 및 허용 목록
- **페어링** - DM 승인 흐름
- **세션 문법** - 제공자별 대화 ID가 기본 채팅, 스레드 ID, 부모 폴백에 매핑되는 방식
- **아웃바운드** - 플랫폼으로 텍스트, 미디어, 설문 보내기
- **스레딩** - 답장을 스레드로 구성하는 방식
- **Heartbeat 입력 표시** - Heartbeat 전달 대상에 대한 선택적 입력 중/바쁨 신호

코어는 공유 메시지 도구, 프롬프트 배선, 외부 세션 키 형태,
일반 `:thread:` 북키핑, 디스패치를 소유합니다.

새 채널 Plugin은 `openclaw/plugin-sdk/channel-outbound`의
`defineChannelMessageAdapter`로 `message` 어댑터도 노출해야 합니다.
어댑터는 네이티브 전송 계층이 실제로 지원하는 지속성 있는 최종 전송 기능을 선언하고,
텍스트/미디어 전송을 기존 `outbound` 어댑터와 같은 전송 함수로 연결합니다.
네이티브 부수 효과와 반환된 수신 확인을 계약 테스트가 증명할 때만 기능을 선언하세요.
전체 API 계약, 예제, 기능 매트릭스, 수신 확인 규칙, 라이브
미리보기 최종화, 수신 ack 정책, 테스트, 마이그레이션 표는
[채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)를 참조하세요.
기존 `outbound` 어댑터에 이미 올바른 전송 메서드와
기능 메타데이터가 있다면, 또 다른 브리지를 직접 작성하는 대신
`createChannelMessageAdapterFromOutbound(...)`를 사용해 `message`
어댑터를 파생하세요.
어댑터 전송은 `MessageReceipt` 값을 반환해야 합니다. 호환성 코드에
여전히 기존 ID가 필요한 경우, 새 수명 주기 코드에 병렬
`messageIds` 필드를 유지하는 대신 `listMessageReceiptPlatformIds(...)`
또는 `resolveMessageReceiptPrimaryId(...)`로 파생하세요.
미리보기 지원 채널은 자신이 소유한 정확한 라이브 수명 주기와 함께
`message.live.capabilities`도 선언해야 합니다. 예를 들어 `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, 또는
`quietFinalization`이 있습니다. 초안 미리보기를 제자리에서 최종화하는 채널은
`finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`,
`retainOnAmbiguousFailure` 같은 `message.live.finalizer.capabilities`도
선언하고, 런타임 로직을 `defineFinalizableLivePreviewAdapter(...)`와
`deliverWithFinalizableLivePreviewAdapter(...)`를 통해 라우팅해야 합니다.
네이티브 미리보기, 진행 상태, 편집, 폴백/보존, 정리, 수신 확인 동작이
조용히 달라지지 않도록, 해당 기능을 `verifyChannelMessageLiveCapabilityAdapterProofs(...)`와
`verifyChannelMessageLiveFinalizerProofs(...)` 테스트로 뒷받침하세요.
플랫폼 응답 확인을 지연하는 인바운드 수신기는 ack 타이밍을 모니터 로컬 상태에
숨기지 말고 `message.receive.defaultAckPolicy`와 `supportedAckPolicies`를
선언해야 합니다. 선언한 모든 정책은
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`로 커버하세요.

`createChannelTurnReplyPipeline`, `dispatchInboundReplyWithBase`,
`recordInboundSessionAndDispatchReply` 같은 기존 답장 헬퍼는 호환성 디스패처용으로
계속 사용할 수 있습니다. 새 채널 코드에는 이 이름들을 사용하지 마세요. 새 Plugin은
`openclaw/plugin-sdk/channel-outbound`의 `message` 어댑터, 수신 확인,
수신/전송 수명 주기 헬퍼로 시작해야 합니다.

인바운드 권한 부여를 마이그레이션하는 채널은 런타임 수신 경로에서 실험적
`openclaw/plugin-sdk/channel-ingress-runtime` 하위 경로를 사용할 수 있습니다.
이 하위 경로는 플랫폼 조회와 부수 효과를 Plugin 안에 유지하면서,
허용 목록 상태 확인, route/sender/command/event/activation 결정,
수정된 진단, 턴 허용 매핑을 공유합니다. Plugin ID 정규화는
resolver에 전달하는 descriptor 안에 유지하세요. 확인된 상태나 결정에서 나온
원시 match 값을 직렬화하지 마세요. API 설계, 소유권 경계, 테스트 기대 사항은
[채널 인그레스 API](/ko/plugins/sdk-channel-ingress)를 참조하세요.

채널이 인바운드 답장 외부에서 입력 표시기를 지원한다면, 채널 Plugin에
`heartbeat.sendTyping(...)`을 노출하세요. 코어는 Heartbeat 모델 실행이 시작되기 전에
확인된 Heartbeat 전달 대상으로 이를 호출하고, 공유 입력 유지/정리 수명 주기를
사용합니다. 플랫폼에 명시적 중지 신호가 필요하다면 `heartbeat.clearTyping(...)`을
추가하세요.

채널이 미디어 소스를 전달하는 메시지 도구 매개변수를 추가한다면, 해당 매개변수 이름을
`describeMessageTool(...).mediaSourceParams`를 통해 노출하세요. 코어는 이 명시적 목록을
샌드박스 경로 정규화와 아웃바운드 미디어 접근 정책에 사용하므로, Plugin에는 제공자별
아바타, 첨부 파일, 커버 이미지 매개변수에 대한 공유 코어 특수 사례가 필요하지 않습니다.
서로 관련 없는 작업이 다른 작업의 미디어 인수를 상속하지 않도록
`{ "set-profile": ["avatarUrl", "avatarPath"] }` 같은 작업 키 기반 맵을 반환하는 것을
선호하세요. 의도적으로 노출된 모든 작업에서 공유되는 매개변수에는 평면 배열도
계속 사용할 수 있습니다.
플랫폼 측 미디어 가져오기를 위해 임시 공개 URL을 노출해야 하는 채널은
Plugin 상태 저장소와 함께 `openclaw/plugin-sdk/outbound-media`의
`createHostedOutboundMediaStore(...)`를 사용할 수 있습니다. 플랫폼 라우트 파싱과
토큰 적용은 채널 Plugin 안에 유지하세요. 공유 헬퍼는 미디어 로딩, 만료 메타데이터,
청크 행, 정리만 소유합니다.

채널에 `message(action="send")`에 대한 제공자별 형태 조정이 필요하다면
`actions.prepareSendPayload(...)`를 선호하세요. 네이티브 카드, 블록, 임베드 또는
기타 지속성 있는 데이터는 `payload.channelData.<channel>` 아래에 두고, 코어가
아웃바운드/메시지 어댑터를 통해 실제 전송을 수행하게 하세요. 직렬화 및 재시도가
불가능한 페이로드에 대한 호환성 폴백으로만 전송에 `actions.handleAction(...)`을
사용하세요.

플랫폼이 대화 ID 안에 추가 범위를 저장한다면, 해당 파싱은
`messaging.resolveSessionConversation(...)`로 Plugin 안에 유지하세요. 이는 `rawId`를
기본 대화 ID, 선택적 스레드 ID, 명시적 `baseConversationId`, 그리고 모든
`parentConversationCandidates`에 매핑하는 표준 훅입니다.
`parentConversationCandidates`를 반환할 때는 가장 좁은 부모부터 가장 넓은/기본
대화까지 순서대로 유지하세요.

Plugin 코드가 라우트 같은 필드를 정규화하거나, 자식 스레드를 부모 라우트와 비교하거나,
`{ channel, to, accountId, threadId }`에서 안정적인 중복 제거 키를 만들어야 할 때는
`openclaw/plugin-sdk/channel-route`를 사용하세요. 이 헬퍼는 코어와 같은 방식으로
숫자 스레드 ID를 정규화하므로, Plugin은 임시 `String(threadId)` 비교보다 이를
선호해야 합니다.
제공자별 대상 문법이 있는 Plugin은 `messaging.resolveOutboundSessionRoute(...)`를
노출하여 코어가 파서 shim 없이 제공자 네이티브 세션 및 스레드 ID를 얻도록 해야 합니다.

채널 레지스트리가 부팅되기 전에 같은 파싱이 필요한 번들 Plugin은 일치하는
`resolveSessionConversation(...)` export가 있는 최상위 `session-key-api.ts` 파일도
노출할 수 있습니다. 코어는 런타임 Plugin 레지스트리를 아직 사용할 수 없을 때만
이 부트스트랩 안전 표면을 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는 Plugin이 일반/원시 ID 위에
부모 폴백만 필요로 할 때 기존 호환성 폴백으로 계속 사용할 수 있습니다.
두 훅이 모두 있으면 코어는 먼저
`resolveSessionConversation(...).parentConversationCandidates`를 사용하고,
표준 훅이 이를 생략한 경우에만 `resolveParentConversationCandidates(...)`로
폴백합니다.

## 승인 및 채널 기능

대부분의 채널 Plugin에는 승인 전용 코드가 필요하지 않습니다.

- 코어는 같은 채팅의 `/approve`, 공유 승인 버튼 페이로드, 일반 폴백 전달을 소유합니다.
- 채널에 승인별 동작이 필요할 때는 채널 Plugin에 하나의 `approvalCapability` 객체를 두는 것을 권장합니다.
- `ChannelPlugin.approvals`는 제거되었습니다. 승인 전달/네이티브/렌더링/인증 관련 사실은 `approvalCapability`에 넣으세요.
- `plugin.auth`는 로그인/로그아웃 전용입니다. 코어는 더 이상 해당 객체에서 승인 인증 훅을 읽지 않습니다.
- `approvalCapability.authorizeActorAction` 및 `approvalCapability.getActionAvailabilityState`는 정식 승인 인증 경계입니다.
- 같은 채팅 승인 인증 가용성에는 `approvalCapability.getActionAvailabilityState`를 사용하세요. 네이티브 전달이 비활성화되어 있어도 `/approve`에 대해 구성된 승인자는 계속 사용 가능하게 두고, 대신 전달/설정 안내에는 네이티브 시작 표면 상태를 사용하세요.
- 채널이 네이티브 exec 승인을 노출하는 경우, 시작 표면/네이티브 클라이언트 상태가 같은 채팅 승인 인증과 다를 때 `approvalCapability.getExecInitiatingSurfaceState`를 사용하세요. 코어는 이 exec 전용 훅을 사용해 `enabled`와 `disabled`를 구분하고, 시작 채널이 네이티브 exec 승인을 지원하는지 판단하며, 네이티브 클라이언트 폴백 안내에 해당 채널을 포함합니다. `createApproverRestrictedNativeApprovalCapability(...)`는 일반적인 경우에 이를 채워 줍니다.
- 중복 로컬 승인 프롬프트 숨김이나 전달 전 입력 표시기 전송처럼 채널별 페이로드 수명 주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- `approvalCapability.delivery`는 네이티브 승인 라우팅 또는 폴백 억제에만 사용하세요.
- 채널이 소유하는 네이티브 승인 사실에는 `approvalCapability.nativeRuntime`을 사용하세요. `createLazyChannelApprovalNativeRuntimeAdapter(...)`로 핫 채널 진입점에서 지연 상태를 유지하면, 코어가 승인 수명 주기를 조립할 수 있게 하면서도 필요할 때 런타임 모듈을 가져올 수 있습니다.
- 채널이 공유 렌더러 대신 진정으로 사용자 지정 승인 페이로드가 필요할 때만 `approvalCapability.render`를 사용하세요.
- 네이티브 exec 승인을 활성화하는 데 필요한 정확한 구성 노브를 비활성화 경로 응답에서 설명하려는 경우 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 훅은 `{ channel, channelLabel, accountId }`를 받습니다. 명명된 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위 경로를 렌더링해야 합니다.
- Plugin 승인 라우트 없음 및 타임아웃 실패에 대해 Plugin 승인 실패 안내를 표시해도 안전할 때는 `approvalCapability.describePluginApprovalSetup`을 사용하세요. `createApproverRestrictedNativeApprovalCapability(...)`는 이를 `describeExecApprovalSetup`에서 추론하지 않습니다. Plugin 승인과 exec 승인이 실제로 같은 네이티브 설정을 사용할 때만 같은 헬퍼를 명시적으로 전달하세요.
- 채널이 기존 구성에서 안정적인 소유자 유사 DM ID를 추론할 수 있다면, 승인 전용 코어 로직을 추가하지 않고 같은 채팅 `/approve`를 제한하기 위해 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용하세요.
- 사용자 지정 승인 인증이 의도적으로 같은 채팅 폴백만 허용하는 경우 `openclaw/plugin-sdk/approval-auth-runtime`에서 `markImplicitSameChatApprovalAuthorization({ authorized: true })`를 반환하세요. 그렇지 않으면 코어는 결과를 명시적 승인자 권한 부여로 취급합니다.
- 채널 소유 네이티브 콜백이 승인을 직접 해결하는 경우, 암시적 폴백이 여전히 채널의 일반 액터 권한 부여를 거치도록 해결 전에 `isImplicitSameChatApprovalAuthorization(...)`를 사용하세요.
- 채널에 네이티브 승인 전달이 필요하다면 채널 코드는 대상 정규화와 전송/프레젠테이션 사실에 집중하게 하세요. `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`를 사용하세요. 채널별 사실은 가능하면 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 통해 `approvalCapability.nativeRuntime` 뒤에 두어, 코어가 핸들러를 조립하고 요청 필터링, 라우팅, 중복 제거, 만료, Gateway 구독, 다른 곳으로 라우팅됨 알림을 소유할 수 있게 하세요. `nativeRuntime`은 몇 개의 더 작은 경계로 나뉩니다.
- 채널이 세션 원점 네이티브 전달과 명시적 승인 전달 대상 둘 다 지원하는 경우 `openclaw/plugin-sdk/approval-native-runtime`의 `createNativeApprovalChannelRouteGates`를 사용하세요. 이 헬퍼는 승인 구성 선택, `mode` 처리, 에이전트/세션 필터, 계정 바인딩, 세션 대상 매칭, 대상 목록 매칭을 중앙화하면서도 호출자가 채널 ID, 기본 전달 모드, 계정 조회, 전송 활성화 확인, 대상 정규화, 턴 소스 대상 해석을 계속 소유하게 합니다. 코어 소유 채널 정책 기본값을 만들기 위해 사용하지 말고, 채널의 문서화된 기본 모드를 명시적으로 전달하세요.
- `createChannelNativeOriginTargetResolver`는 기본적으로 `{ to, accountId, threadId }` 대상에 공유 채널 라우트 매처를 사용합니다. Slack 타임스탬프 접두사 매칭처럼 채널에 제공자별 동등성 규칙이 있을 때만 `targetsMatch`를 전달하세요.
- 기본 라우트 매처나 사용자 지정 `targetsMatch` 콜백이 실행되기 전에 채널이 제공자 ID를 정규화해야 하면서 원래 대상은 전달용으로 보존해야 하는 경우 `createChannelNativeOriginTargetResolver`에 `normalizeTargetForMatch`를 전달하세요. 해석된 전달 대상 자체를 정규화해야 할 때만 `normalizeTarget`을 사용하세요.
- `availability` - 계정이 구성되어 있는지와 요청을 처리해야 하는지 여부
- `presentation` - 공유 승인 뷰 모델을 대기/해결/만료 네이티브 페이로드 또는 최종 작업으로 매핑
- `transport` - 대상을 준비하고 네이티브 승인 메시지를 전송/업데이트/삭제
- `interactions` - 네이티브 버튼 또는 반응을 위한 선택적 바인드/언바인드/작업 지우기 훅과 선택적 `cancelDelivered` 훅. `deliverPending`이 프로세스 내 상태 또는 영속 상태(예: 반응 대상 저장소)를 등록하는 경우 `cancelDelivered`를 구현하여, 핸들러 중지가 `bindPending` 실행 전에 전달을 취소하거나 `bindPending`이 핸들을 반환하지 않을 때 해당 상태를 해제할 수 있게 하세요
- `observe` - 선택적 전달 진단 훅
- 채널에 클라이언트, 토큰, Bolt 앱, Webhook 수신기 같은 런타임 소유 객체가 필요하면 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요. 일반 런타임 컨텍스트 레지스트리는 승인 전용 래퍼 접착 코드를 추가하지 않고도 코어가 채널 시작 상태에서 기능 기반 핸들러를 부트스트랩할 수 있게 합니다.
- 더 낮은 수준의 `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`은 기능 기반 경계가 아직 충분히 표현적이지 않을 때만 사용하세요.
- 네이티브 승인 채널은 해당 헬퍼를 통해 `accountId`와 `approvalKind`를 모두 라우팅해야 합니다. `accountId`는 다중 계정 승인 정책이 올바른 봇 계정에 범위 지정되도록 하고, `approvalKind`는 코어에 하드코딩된 분기 없이 exec와 Plugin 승인 동작을 채널에서 사용할 수 있게 합니다.
- 이제 코어는 승인 재라우팅 알림도 소유합니다. 채널 Plugin은 `createChannelNativeApprovalRuntime`에서 자체적으로 "승인이 DM / 다른 채널로 이동했습니다" 후속 메시지를 보내면 안 됩니다. 대신 공유 승인 기능 헬퍼를 통해 정확한 원점 및 승인자 DM 라우팅을 노출하고, 코어가 실제 전달을 집계한 뒤 시작 채팅에 알림을 게시하게 하세요.
- 전달된 승인 ID 종류를 끝까지 보존하세요. 네이티브 클라이언트는 채널 로컬 상태에서
  exec와 Plugin 승인 라우팅을 추측하거나 다시 작성하면 안 됩니다.
- 서로 다른 승인 종류는 의도적으로 서로 다른 네이티브 표면을 노출할 수 있습니다.
  현재 번들 예시:
  - Slack은 exec와 Plugin ID 둘 다에 대해 네이티브 승인 라우팅을 계속 사용할 수 있게 합니다.
  - Matrix는 exec와 Plugin 승인에 대해 같은 네이티브 DM/채널 라우팅 및 반응 UX를 유지하면서도, 승인 종류별로 인증이 달라질 수 있게 합니다.
- `createApproverRestrictedNativeApprovalAdapter`는 호환성 래퍼로 여전히 존재하지만, 새 코드는 기능 빌더를 선호하고 Plugin에 `approvalCapability`를 노출해야 합니다.

핫 채널 진입점에서는 해당 계열의 한 부분만 필요할 때 더 좁은 런타임 하위 경로를
선호하세요.

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로, 더 넓은 포괄 표면이 필요하지 않을 때는
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, 및
`openclaw/plugin-sdk/reply-chunking`을 선호하세요.

설정에 한해서는 다음과 같습니다.

- `openclaw/plugin-sdk/setup-runtime`은 런타임 안전 설정 헬퍼를 다룹니다.
  `createSetupTranslator`, 가져오기 안전 설정 패치 어댑터(`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), 조회 노트 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 및 위임된
  설정 프록시 빌더
- `openclaw/plugin-sdk/setup-runtime`은
  `createEnvPatchedAccountSetupAdapter`를 위한 환경 인식 어댑터 경계를 포함합니다.
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 설정
  빌더와 몇 가지 설정 안전 프리미티브를 다룹니다.
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 환경 기반 설정 또는 인증을 지원하고 일반 시작/구성 흐름이 런타임 로드 전에
해당 환경 이름을 알아야 한다면, Plugin 매니페스트의 `channelEnvVars`에 선언하세요.
운영자 대상 문구에만 채널 런타임 `envVars` 또는 로컬 상수를 유지하세요.

채널이 Plugin 런타임 시작 전에 `status`, `channels list`, `channels status` 또는
SecretRef 스캔에 나타날 수 있다면, `package.json`에 `openclaw.setupEntry`를 추가하세요.
해당 진입점은 읽기 전용 명령 경로에서 가져와도 안전해야 하며, 해당 요약에 필요한
채널 메타데이터, 설정 안전 구성 어댑터, 상태 어댑터, 채널 비밀 대상 메타데이터를 반환해야 합니다.
설정 진입점에서 클라이언트, 리스너 또는 전송 런타임을 시작하지 마세요.

기본 채널 진입 가져오기 경로도 좁게 유지하세요. 디스커버리는 채널을 활성화하지 않고도
기능을 등록하기 위해 진입점과 채널 Plugin 모듈을 평가할 수 있습니다.
`channel-plugin-api.ts` 같은 파일은 설정 마법사, 전송 클라이언트, 소켓
리스너, 하위 프로세스 실행기 또는 서비스 시작 모듈을 가져오지 않고 채널
Plugin 객체를 내보내야 합니다. 이러한 런타임 조각은 `registerFull(...)`,
런타임 세터 또는 지연 기능 어댑터에서 로드되는 모듈에 넣으세요.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, 및
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` 같은
  더 무거운 공유 설정/구성 헬퍼도 필요할 때만 더 넓은
  `openclaw/plugin-sdk/setup` 경계를 사용하세요.

채널이 설정 표면에서 "먼저 이 Plugin을 설치하세요"만 알리고 싶다면
`createOptionalChannelSetupSurface(...)`를 선호하세요. 생성된
어댑터/마법사는 구성 쓰기와 최종화에서 닫힌 실패로 동작하며, 검증, 최종화, 문서 링크
문구 전반에서 같은 설치 필요 메시지를 재사용합니다.

다른 핫 채널 경로에서는 더 넓은 레거시 표면보다 좁은 헬퍼를 선호하세요.

- 다중 계정 구성 및 기본 계정 폴백을 위한 `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` 및
  `openclaw/plugin-sdk/account-helpers`
- 인바운드 라우트/엔벌로프 및 기록-디스패치 배선을 위한
  `openclaw/plugin-sdk/inbound-envelope` 및
  `openclaw/plugin-sdk/channel-inbound`
- 대상 파싱 헬퍼를 위한 `openclaw/plugin-sdk/channel-targets`
- 미디어 로딩을 위한 `openclaw/plugin-sdk/outbound-media` 및
  아웃바운드 ID/전송 델리게이트와 페이로드 계획을 위한
  `openclaw/plugin-sdk/channel-outbound`
- 아웃바운드 라우트가 명시적 `replyToId`/`threadId`를 보존해야 하거나,
  기본 세션 키가 여전히 일치한 뒤 현재 `:thread:` 세션을 복구해야 할 때
  `openclaw/plugin-sdk/channel-core`의 `buildThreadAwareOutboundSessionRoute(...)`.
  Provider Plugin은 플랫폼에 네이티브 스레드 전달 의미 체계가 있을 때
  우선순위, 접미사 동작, 스레드 ID 정규화를 재정의할 수 있습니다.
- 스레드 바인딩 수명 주기 및 어댑터 등록을 위한
  `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 에이전트/미디어 페이로드 필드 레이아웃이 여전히 필요할 때만
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram 사용자 지정 명령 정규화, 중복/충돌 검증, 폴백에 안정적인 명령
  구성 계약을 위한 `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 보통 기본 경로에서 멈춰도 됩니다. 코어가 승인을 처리하고 Plugin은 아웃바운드/인증 기능만 노출하면 됩니다. Matrix, Slack, Telegram 및 사용자 지정 채팅 전송 계층 같은 네이티브 승인 채널은 자체 승인 수명 주기를 만들지 말고 공유 네이티브 헬퍼를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리는 두 계층으로 나누어 유지하세요.

- Plugin 소유 증거 수집
- 공유 정책 평가

멘션 정책 결정을 위해 `openclaw/plugin-sdk/channel-mention-gating`을 사용하세요.
더 넓은 인바운드 헬퍼 배럴이 필요할 때만
`openclaw/plugin-sdk/channel-inbound`를 사용하세요.

Plugin 로컬 로직에 적합한 항목:

- 봇에 대한 답장 감지
- 인용된 봇 감지
- 스레드 참여 확인
- 서비스/시스템 메시지 제외
- 봇 참여를 증명하는 데 필요한 플랫폼 네이티브 캐시

공유 헬퍼에 적합한 항목:

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

`api.runtime.channel.mentions`는 이미 런타임 주입에 의존하는 번들 채널 Plugin을 위해
동일한 공유 멘션 헬퍼를 노출합니다.

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen`과 `resolveInboundMentionDecision`만 필요하다면
관련 없는 인바운드 런타임 헬퍼를 로드하지 않도록
`openclaw/plugin-sdk/channel-mention-gating`에서 가져오세요.

멘션 게이팅에는 `resolveInboundMentionDecision({ facts, policy })`를 사용하세요.

## 둘러보기

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지 및 매니페스트">
    표준 Plugin 파일을 만듭니다. `package.json`의 `channel` 필드가
    이것을 채널 Plugin으로 만듭니다. 전체 패키지 메타데이터 표면은
    [Plugin 설정 및 구성](/ko/plugins/sdk-setup#openclaw-channel)을 참조하세요.

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
    채널 계정 구성이 아닌 Plugin 소유 설정에 사용하세요. `channelConfigs`는
    `channels.acme-chat`를 검증하며, Plugin 런타임이 로드되기 전에 구성
    스키마, 설정, UI 표면에서 사용하는 콜드 경로 소스입니다.

  </Step>

  <Step title="채널 Plugin 객체 빌드">
    `ChannelPlugin` 인터페이스에는 선택적 어댑터 표면이 많이 있습니다.
    최소 항목인 `id`와 `setup`으로 시작하고, 필요할 때 어댑터를 추가하세요.

    `src/channel.ts`를 만듭니다.

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

    표준 최상위 DM 키와 레거시 중첩 키를 모두 허용하는 채널의 경우 `plugin-sdk/channel-config-helpers`의 헬퍼를 사용하세요. `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, `normalizeChannelDmPolicy`는 계정 로컬 값이 상속된 루트 값보다 앞서도록 유지합니다. 런타임과 마이그레이션이 동일한 계약을 읽도록 `normalizeLegacyDmAliases`를 통한 doctor 복구와 같은 리졸버를 함께 사용하세요.

    <Accordion title="createChatChannelPlugin이 대신 해 주는 일">
      낮은 수준의 어댑터 인터페이스를 직접 구현하는 대신, 선언적 옵션을 전달하면
      빌더가 이를 조합합니다.

      | 옵션 | 연결되는 항목 |
      | --- | --- |
      | `security.dm` | 구성 필드에서 범위가 지정된 DM 보안 리졸버 |
      | `pairing.text` | 코드 교환이 포함된 텍스트 기반 DM 페어링 흐름 |
      | `threading` | 답장 대상 모드 리졸버(고정, 계정 범위 또는 사용자 지정) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 전송 함수 |

      전체 제어가 필요하다면 선언적 옵션 대신 원시 어댑터 객체를 전달할 수도 있습니다.

      원시 아웃바운드 어댑터는 `chunker(text, limit, ctx)` 함수를 정의할 수 있습니다.
      선택적 `ctx.formatting`은 `maxLinesPerMessage` 같은 전달 시점의 형식 지정 결정을
      전달합니다. 전송 전에 이를 적용하여 답장 스레딩과 청크 경계가 공유 아웃바운드
      전달에 의해 한 번만 해석되도록 하세요.
      네이티브 답장 대상이 해석된 경우 전송 컨텍스트에는 `replyToIdSource`(`implicit` 또는 `explicit`)도
      포함되므로, 페이로드 헬퍼가 암시적 일회용 답장 슬롯을 소비하지 않고
      명시적 답장 태그를 보존할 수 있습니다.
    </Accordion>

  </Step>

  <Step title="진입점 연결">
    `index.ts`를 만듭니다.

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

    채널이 소유한 CLI 설명자는 `registerCliMetadata(...)`에 넣어 OpenClaw가
    전체 채널 런타임을 활성화하지 않고도 루트 도움말에 표시할 수 있게 하세요.
    일반적인 전체 로드는 실제 명령 등록을 위해 동일한 설명자를 계속 가져옵니다.
    런타임 전용 작업에는 `registerFull(...)`을 유지하세요.
    `registerFull(...)`이 Gateway RPC 메서드를 등록한다면
    Plugin별 접두사를 사용하세요. 코어 관리자 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약된 상태로 유지되며 항상
    `operator.admin`으로 해석됩니다.
    `defineChannelPluginEntry`는 등록 모드 분리를 자동으로 처리합니다. 모든
    옵션은 [엔트리 포인트](/ko/plugins/sdk-entrypoints#definechannelpluginentry)를 참조하세요.

  </Step>

  <Step title="Add a setup entry">
    온보딩 중 가벼운 로딩을 위해 `setup-entry.ts`를 만드세요.

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    채널이 비활성화되어 있거나 구성되지 않은 경우 OpenClaw는 전체 엔트리 대신
    이것을 로드합니다. 설정 흐름 중 무거운 런타임 코드를 가져오지 않도록 합니다.
    자세한 내용은 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하세요.

    설정에 안전한 내보내기를 사이드카 모듈로 분리하는 번들 워크스페이스 채널은
    명시적인 설정 시점 런타임 세터도 필요할 때
    `openclaw/plugin-sdk/channel-entry-contract`의
    `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.

  </Step>

  <Step title="Handle inbound messages">
    Plugin은 플랫폼에서 메시지를 받아 OpenClaw로 전달해야 합니다.
    일반적인 패턴은 요청을 검증하고 채널의 인바운드 핸들러를 통해
    디스패치하는 Webhook입니다.

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
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
<Step title="Test">
`src/channel.test.ts`에 같은 위치의 테스트를 작성하세요.

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
  <Card title="Threading options" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정, 계정 범위 또는 사용자 지정 답장 모드
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 작업 검색
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ko/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime을 통한 TTS, STT, 미디어, 하위 에이전트
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/ko/plugins/sdk-channel-inbound">
    공유 인바운드 이벤트 수명 주기: 수집, 해석, 기록, 디스패치, 완료
  </Card>
</CardGroup>

<Note>
일부 번들 헬퍼 연결부는 번들 Plugin 유지보수와
호환성을 위해 여전히 존재합니다. 새 채널 Plugin에 권장되는 패턴은 아닙니다.
해당 번들 Plugin 계열을 직접 유지보수하는 경우가 아니라면 공통 SDK
표면의 일반 채널/설정/답장/런타임 하위 경로를 선호하세요.
</Note>

## 다음 단계

- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - Plugin이 모델도 제공하는 경우
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [SDK 테스트](/ko/plugins/sdk-testing) - 테스트 유틸리티 및 계약 테스트
- [Plugin 매니페스트](/ko/plugins/manifest) - 전체 매니페스트 스키마

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
