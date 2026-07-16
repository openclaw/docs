---
read_when:
    - 새 메시징 채널 Plugin을 구축하고 있습니다
    - OpenClaw을 메시징 플랫폼에 연결하려고 합니다
    - ChannelPlugin 어댑터 인터페이스를 이해해야 합니다
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 Plugin 구축 단계별 가이드
title: 채널 Plugin 구축하기
x-i18n:
    generated_at: "2026-07-16T12:57:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

이 가이드에서는 OpenClaw를 메시징 플랫폼에 연결하는 채널 Plugin을 구축합니다.
DM 보안, 페어링, 답글 스레딩, 발신 메시징을 다룹니다.

<Info>
  OpenClaw Plugin을 처음 사용하십니까? 먼저 패키지 구조와 매니페스트 설정에 관한
  [시작하기](/ko/plugins/building-plugins)를 읽으십시오.
</Info>

## Plugin이 담당하는 항목

채널 Plugin은 전송/편집/반응 도구를 구현하지 않습니다. 코어가 하나의
공유 `message` 도구를 제공합니다. Plugin은 다음 항목을 담당합니다.

- **구성** - 계정 확인 및 설정 마법사
- **보안** - DM 정책 및 허용 목록
- **페어링** - DM 승인 흐름
- **세션 문법** - 제공자별 대화 ID를 기본 채팅, 스레드 ID,
  상위 폴백에 매핑하는 방식
- **발신** - 플랫폼으로 텍스트, 미디어, 투표 전송
- **스레딩** - 답글을 스레드로 구성하는 방식
- **Heartbeat 입력 상태** - Heartbeat 전달 대상을 위한 선택적 입력 중/사용 중 신호

코어는 공유 메시지 도구, 프롬프트 연결, 외부 세션 키 형태,
일반 `:thread:` 기록 관리 및 디스패치를 담당합니다.

## 메시지 어댑터

`openclaw/plugin-sdk/channel-outbound`의 `defineChannelMessageAdapter`을 사용하여
`message` 어댑터를 노출하십시오. 네이티브 전송이 실제로 지원하는
지속 가능한 최종 전송 기능만 선언하고, 네이티브 부작용과 반환된 수신 확인을
입증하는 계약 테스트로 뒷받침하십시오. 텍스트/미디어 전송은 기존
`outbound` 어댑터가 사용하는 것과 동일한 전송 함수로 연결하십시오.
전체 API 계약, 기능 매트릭스, 수신 확인 규칙, 실시간 미리 보기 완료 처리,
수신 확인 정책, 테스트 및 마이그레이션 표는
[채널 발신 API](/ko/plugins/sdk-channel-outbound)를 참조하십시오.

기존 `outbound` 어댑터에 이미 적절한 전송 메서드와 기능 메타데이터가
있다면 별도의 브리지를 직접 작성하지 말고 `createChannelMessageAdapterFromOutbound(...)`을 사용하여
`message` 어댑터를 파생하십시오. 어댑터 전송은
`MessageReceipt` 값을 반환합니다. 레거시 ID의 경우 병렬
`messageIds` 필드를 유지하지 말고 `listMessageReceiptPlatformIds(...)` 또는
`resolveMessageReceiptPrimaryId(...)`을 사용하여 파생하십시오.

실시간 및 완료 처리기 기능을 정확히 선언하십시오. 코어는 이를 사용하여
채널이 수행할 수 있는 작업을 결정하며, 선언된 동작과 실제 동작의 불일치는
계약 테스트 실패로 간주됩니다.

| 표면                                  | 값                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`                    | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities`                    | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

초안 미리 보기를 제자리에서 완료 처리하는 채널은 런타임 로직을
`defineFinalizableLivePreviewAdapter(...)` 및 `deliverWithFinalizableLivePreviewAdapter(...)`을 통해 라우팅하고, 선언된 기능을
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` 및 `verifyChannelMessageLiveFinalizerProofs(...)` 테스트로 뒷받침해야 합니다.
그러면 네이티브 미리 보기, 진행 상황, 편집, 폴백/보존, 정리 및 수신 확인
동작이 조용히 달라지는 것을 방지할 수 있습니다.

플랫폼 확인 응답을 지연하는 인바운드 수신기는 확인 응답 시점을 모니터 로컬
상태에 숨기지 말고 `message.receive.defaultAckPolicy` 및 `supportedAckPolicies`을 선언해야
합니다. 선언된 모든 정책을 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`로 검증하십시오.

`dispatchInboundReplyWithBase` 및 `recordInboundSessionAndDispatchReply` 같은 레거시 답글 헬퍼는 호환성
디스패처를 위해 계속 제공됩니다. 새 채널 코드에서는 사용하지 마십시오.
대신 `message` 어댑터, 수신 확인, `openclaw/plugin-sdk/channel-outbound`의
수신/전송 수명 주기 헬퍼로 시작하십시오.

### 인바운드 진입(실험적)

인바운드 권한 부여를 마이그레이션하는 채널은 런타임 수신 경로에서 실험적인
`openclaw/plugin-sdk/channel-ingress-runtime` 하위 경로를 사용할 수 있습니다. 이 경로는 플랫폼 정보,
원시 허용 목록, 라우트 설명자, 명령 정보 및 액세스 그룹 구성을 받은 다음
발신자/라우트/명령/활성화 프로젝션과 순서가 지정된 진입 그래프를 반환합니다.
플랫폼 조회와 부작용은 Plugin에 유지됩니다. Plugin ID 정규화는 확인자에
전달하는 설명자에 유지하십시오. 확인된 상태나 결정의 원시 일치 값을
직렬화하지 마십시오. API 설계, 소유권 경계 및 테스트 기대 사항은
[채널 진입 API](/ko/plugins/sdk-channel-ingress)를 참조하십시오.

### 입력 상태 표시기

채널이 인바운드 답글 외부에서도 입력 상태 표시기를 지원한다면 채널 Plugin에
`heartbeat.sendTyping(...)`을 노출하십시오. 코어는 Heartbeat 모델 실행이 시작되기
전에 확인된 Heartbeat 전달 대상으로 이를 호출하고, 공유 입력 상태
유지/정리 수명 주기를 사용합니다. 플랫폼에 명시적인 중지 신호가 필요한 경우
`heartbeat.clearTyping(...)`을 추가하십시오.

### 미디어 소스 매개변수

채널이 미디어 소스를 전달하는 메시지 도구 매개변수를 추가하는 경우 해당
매개변수 이름을 `plugin.actions.describeMessageTool(...).mediaSourceParams`을 통해 노출하십시오. 코어는 이 명시적
목록을 샌드박스 경로 정규화 및 발신 미디어 액세스 정책에 사용하므로,
Plugin에는 제공자별 아바타, 첨부 파일 또는 표지 이미지 매개변수에 대한
공유 코어 특수 사례가 필요하지 않습니다.

관련 없는 작업이 다른 작업의 미디어 인수를 상속하지 않도록
`{ "set-profile": ["avatarUrl", "avatarPath"] }` 같은 작업 키 기반 맵을 사용하는 것이 좋습니다. 모든
노출된 작업에서 의도적으로 공유하는 매개변수에는 평면 배열도 계속 사용할
수 있습니다.

플랫폼 측 미디어 가져오기를 위해 임시 공개 URL을 노출해야 하는 채널은
Plugin 상태 저장소와 함께 `openclaw/plugin-sdk/outbound-media`의 `createHostedOutboundMediaStore(...)`을
사용할 수 있습니다. 플랫폼 라우트 구문 분석 및 토큰 적용은 채널 Plugin에
유지하십시오. 공유 헬퍼는 미디어 로드, 만료 메타데이터, 청크 행 및 정리만
담당합니다.

### 네이티브 페이로드 구성

채널에 `message(action="send")`을 위한 제공자별 구성이 필요하면
`actions.prepareSendPayload(...)`을 사용하는 것이 좋습니다. 네이티브 카드, 블록, 임베드
또는 기타 지속 가능한 데이터는 `payload.channelData.<channel>` 아래에 배치하고, 코어가
발신/메시지 어댑터를 통해 전송하도록 하십시오. 직렬화 및 재시도가 불가능한
페이로드에 대해서만 호환성 폴백으로 `actions.handleAction(...)`을 사용하십시오.

### 세션 대화 문법

플랫폼이 대화 ID 안에 추가 범위를 저장한다면 해당 구문 분석은
`messaging.resolveSessionConversation(...)`을 사용하여 Plugin에 유지하십시오. 이는
`rawId`을 기본 대화 ID, 선택적 스레드 ID, 명시적
`baseConversationId` 및 모든 `parentConversationCandidates`에 매핑하는 표준
훅입니다. `parentConversationCandidates`을 반환할 때는 가장 좁은 상위 대화부터 가장
넓은/기본 대화 순으로 정렬하십시오.

`messaging.resolveParentConversationCandidates(...)`은 일반/원시 ID에 상위 폴백만 추가하면 되는 Plugin을 위한
더 이상 권장되지 않는 호환성 폴백입니다. 두 훅이 모두 존재하면 코어는
`resolveSessionConversation(...).parentConversationCandidates`을 먼저 사용하며, 표준 훅에서 해당 값이 생략된 경우에만
`resolveParentConversationCandidates(...)`로 폴백합니다.

채널 레지스트리가 시작되기 전에 동일한 구문 분석이 필요한 번들 Plugin은
일치하는 `resolveSessionConversation(...)` 내보내기가 포함된 최상위
`session-key-api.ts` 파일을 노출할 수 있습니다(Feishu 및 Telegram Plugin
참조). 코어는 런타임 Plugin 레지스트리를 아직 사용할 수 없을 때만 이
부트스트랩 안전 표면을 사용합니다.

Plugin 코드에서 라우트형 필드를 정규화하거나, 하위 스레드를 상위 라우트와
비교하거나, `{ channel, to, accountId, threadId }`에서 안정적인 중복 제거 키를 생성해야 할 때
`openclaw/plugin-sdk/channel-route`을 사용하십시오. 이 헬퍼는 숫자형 스레드 ID를 코어와
같은 방식으로 정규화하므로 임시 `String(threadId)` 비교보다 우선하여
사용하십시오. 제공자별 대상 문법을 사용하는 Plugin은 코어가 파서 심 없이
제공자 네이티브 세션 및 스레드 ID를 얻도록 `messaging.resolveOutboundSessionRoute(...)`을
노출해야 합니다.

### 계정 범위 대화 바인딩 지원

채널이 일반 현재 대화 바인딩을 지원하면 `conversationBindings.supportsCurrentConversationBinding`을 설정하십시오.
`createChatChannelPlugin(...)`은 기본적으로 이 정적 기능을 `true`로
설정합니다.

구성된 계정마다 지원 여부가 다르다면 `conversationBindings.isCurrentConversationBindingSupported({ accountId })`도 구현하십시오.
코어는 정적 기능이 활성화된 후에만 이 동기식 훅을 평가합니다.
`false`을 반환하면 해당 계정에서 일반 현재 대화 기능, 바인딩,
조회, 목록 표시, 갱신 및 바인딩 해제 작업을 사용할 수 없습니다. 훅을
생략하면 모든 계정에 정적 기능이 적용됩니다.

이미 로드된 계정 구성 또는 런타임 상태에서 답을 확인하십시오. 이 훅은 일반
현재 대화 바인딩만 제어하며 구성된 바인딩 규칙이나 Plugin 소유 세션
라우팅을 대체하지 않습니다. 계약 테스트에서는 `openclaw/plugin-sdk/channel-core`에서
내보낸 `ChannelPlugin["conversationBindings"]` 계약을 통해 지원되는 계정과 지원되지 않는
계정을 각각 하나 이상 검증해야 합니다.

## 승인 및 채널 기능

대부분의 채널 Plugin에는 승인 전용 코드가 필요하지 않습니다. 코어는 동일
채팅 `/approve`, 공유 승인 버튼 페이로드 및 일반 폴백 전달을
담당합니다. `ChannelPlugin.approvals`은 제거되었습니다. 대신 승인
전달/네이티브/렌더링/인증 정보를 하나의 `approvalCapability` 객체에
배치하십시오. `plugin.auth`은 로그인/로그아웃 전용입니다. 코어는 더
이상 해당 객체에서 승인 인증 훅을 읽지 않습니다.

네이티브 승인 라우팅 또는 폴백 억제에만 `approvalCapability.delivery`을 사용하고,
채널에 공유 렌더러 대신 사용자 지정 승인 페이로드가 실제로 필요한 경우에만
`approvalCapability.render`을 사용하십시오.

### 승인 인증

- `approvalCapability.authorizeActorAction` 및
  `approvalCapability.getActionAvailabilityState`은 표준 승인 인증 경계입니다.
- 동일 채팅 승인 인증 가용성에는 `getActionAvailabilityState`을 사용하십시오.
  네이티브 전달이 비활성화된 경우에도 구성된 승인자를 `/approve`에
  사용할 수 있도록 유지하십시오. 전달/설정 안내에는 네이티브 시작 표면 상태를
  대신 사용하십시오.
- 채널이 네이티브 실행 승인을 노출하는 경우 시작 표면/네이티브
  클라이언트 상태가 동일 채팅 승인 인증과 다를 때 `approvalCapability.getExecInitiatingSurfaceState`을
  사용하십시오. 코어는 이 실행 전용 훅을 사용하여 `enabled`과
  `disabled`을 구분하고, 시작 채널이 네이티브 실행 승인을 지원하는지
  결정하며, 네이티브 클라이언트 폴백 안내에 해당 채널을 포함합니다.
  `createApproverRestrictedNativeApprovalCapability(...)`은 일반적인 경우에 이 값을 채웁니다.
- 채널이 기존 구성에서 안정적인 소유자형 DM ID를 추론할 수 있다면
  `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`을 사용하여 승인 전용 코어 로직을
  추가하지 않고 동일 채팅 `/approve`을 제한하십시오.
- 사용자 지정 승인 인증에서 의도적으로 동일 채팅 폴백만 허용하는
  경우 `openclaw/plugin-sdk/approval-auth-runtime`에서 `markImplicitSameChatApprovalAuthorization({ authorized: true })`을 반환하십시오. 그렇지
  않으면 코어는 결과를 명시적 승인자 권한 부여로 처리합니다.
- 채널 소유 네이티브 콜백이 승인을 직접 확인하는 경우, 암시적
  폴백이 계속 채널의 일반 행위자 권한 부여를 통과하도록 확인 전에
  `isImplicitSameChatApprovalAuthorization(...)`을 사용하십시오.

### 페이로드 수명 주기 및 설정 안내

- 중복 로컬 승인 프롬프트 숨기기 또는 전달 전 입력 상태 표시기
  전송 같은 채널별 페이로드 수명 주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는
  `outbound.beforeDeliverPayload`을 사용하십시오.
- 채널에서 비활성화 경로의 답글을 통해 네이티브 실행 승인을
  활성화하는 데 필요한 정확한 구성 항목을 설명하려는 경우
  `approvalCapability.describeExecApprovalSetup`을 사용하십시오. 훅은 `{ channel, channelLabel, accountId }`을 받습니다.
  명명된 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위
  경로를 렌더링해야 합니다.
- Plugin 승인 경로 없음 및 시간 초과 실패에 대해 Plugin 승인
  실패 안내를 안전하게 표시할 수 있는 경우 `approvalCapability.describePluginApprovalSetup`을
  사용하십시오. `createApproverRestrictedNativeApprovalCapability(...)`은 `describeExecApprovalSetup`에서 이를 추론하지
  않습니다. Plugin 승인과 실행 승인이 실제로 동일한 네이티브 설정을 사용할
  때만 같은 헬퍼를 명시적으로 전달하십시오.

### 네이티브 승인 전달

채널에 네이티브 승인 전달이 필요한 경우 채널 코드는 대상 정규화와
전송/표현 정보에 집중해야 합니다. `openclaw/plugin-sdk/approval-runtime`의
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` 및
`createApproverRestrictedNativeApprovalCapability`을 사용하십시오. 채널별 정보는 `approvalCapability.nativeRuntime` 뒤에
배치하며, 가급적 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`을
사용하십시오. 그러면 코어가 핸들러를 조립하고 요청 필터링, 라우팅, 중복
제거, 만료, Gateway 구독 및 다른 위치로 라우팅되었다는 알림을 담당할 수
있습니다.

`nativeRuntime`은 몇 가지 더 작은 경계로 분리되었습니다.

- `availability` - 계정이 구성되어 있는지와 요청을
  처리해야 하는지 여부
- `presentation` - 공유 승인 뷰 모델을
  대기 중/해결됨/만료됨 네이티브 페이로드 또는 최종 작업으로 매핑
- `transport` - 대상 준비와 네이티브 승인 메시지
  전송/업데이트/삭제
- `interactions` - 네이티브 버튼 또는 반응을 위한 선택적
  바인딩/바인딩 해제/작업 지우기 훅과 선택적 `cancelDelivered` 훅. `deliverPending`에서
  프로세스 내 또는 영구 상태(예: 반응 대상 저장소)를 등록하는 경우
  `cancelDelivered`을 구현하여, `bindPending`이 실행되기 전에 핸들러 중지로 전송이
  취소되거나 `bindPending`이 핸들을 반환하지 않을 때 해당 상태를 해제할 수
  있도록 하십시오.
- `observe` - 선택적 전송 진단 훅

기타 승인 헬퍼:

- 채널이 세션 원본 네이티브 전송과 명시적 승인 전달 대상을 모두
  지원하는 경우 `openclaw/plugin-sdk/approval-native-runtime`의 `createNativeApprovalChannelRouteGates`을 사용하십시오. 이 헬퍼는
  승인 구성 선택, `mode` 처리, 에이전트/세션 필터, 계정 바인딩,
  세션 대상 일치 및 대상 목록 일치를 중앙화하지만, 호출자는 계속해서 채널 ID,
  기본 전달 모드, 계정 조회, 전송 활성화 확인, 대상 정규화 및 턴 소스 대상
  확인을 담당합니다. 코어 소유의 채널 정책 기본값을 만드는 데 사용하지 말고,
  채널에 문서화된 기본 모드를 명시적으로 전달하십시오.
- `createChannelNativeOriginTargetResolver`은 기본적으로 `{ to, accountId, threadId }` 대상에
  공유 채널 경로 매처를 사용합니다. Slack 타임스탬프 접두사 일치와 같이 채널에
  공급자별 동등성 규칙이 있는 경우에만 `targetsMatch`을 전달하십시오.
  원래 전송 대상을 보존하면서 기본 경로 매처 또는 사용자 지정
  `targetsMatch` 콜백이 실행되기 전에 채널에서 공급자 ID를 정규화해야 하는 경우
  `normalizeTargetForMatch`을 전달하십시오. 확인된 전송 대상 자체를 정규화해야 하는
  경우에만 `normalizeTarget`을 사용하십시오.
- 채널에 클라이언트, 토큰, Bolt 앱 또는 Webhook 수신기와 같은
  런타임 소유 객체가 필요한 경우 `openclaw/plugin-sdk/channel-runtime-context`을 통해 등록하십시오.
  일반 런타임 컨텍스트 레지스트리를 사용하면 승인 전용 래퍼 연결 코드를
  추가하지 않고도 코어가 채널 시작 상태에서 기능 기반 핸들러를 부트스트랩할
  수 있습니다.
- 기능 기반 연결 지점의 표현력이 아직 충분하지 않은 경우에만
  하위 수준의 `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`을 사용하십시오.
- 네이티브 승인 채널은 `accountId`과 `approvalKind`을 모두
  해당 헬퍼를 통해 라우팅해야 합니다. `accountId`은 다중 계정 승인 정책의
  범위를 올바른 봇 계정으로 한정하며, `approvalKind`은 코어에 하드코딩된 분기를
  두지 않고도 실행 승인과 Plugin 승인 동작을 채널에서 사용할 수 있게 합니다.
- 코어는 승인 재라우팅 알림도 소유합니다. 채널 Plugin은
  `createChannelNativeApprovalRuntime`에서 자체적으로 "승인이 DM/다른 채널로 전송됨" 후속 메시지를
  보내서는 안 됩니다. 대신 공유 승인 기능 헬퍼를 통해 정확한 원본 +
  승인자 DM 라우팅을 노출하고, 시작 채팅에 알림을 게시하기 전에 코어가 실제
  전송을 집계하도록 하십시오.
- 전송된 승인 ID 종류를 엔드투엔드로 보존하십시오. 네이티브
  클라이언트는 채널 로컬 상태를 기반으로 실행 승인과 Plugin 승인 라우팅을
  추측하거나 다시 작성해서는 안 됩니다.
- 해당 명시적 `approvalKind`을 `resolveApprovalOverGateway`에 전달하십시오.
  이는 정식 `approval.resolve` 서비스를 사용하며 다른 화면에서 먼저 응답한 경우
  기록된 응답자를 반환합니다. 이전의 명시적 `resolveMethod` 입력은 명령 기반
  컨트롤을 위해 유지되지만, 새로운 네이티브 작업에서는 이를 사용하거나 ID에서
  종류를 추론해서는 안 됩니다.
- 서로 다른 승인 종류는 의도적으로 서로 다른 네이티브 화면을
  노출할 수 있습니다. 현재 번들 예시에서 Matrix는 실행 승인과 Plugin 승인에
  동일한 네이티브 DM/채널 라우팅 및 반응 UX를 유지하면서도 승인 종류별로 인증이
  달라질 수 있게 하며, Slack은 실행 및 Plugin ID 모두에 네이티브 승인 라우팅을
  제공합니다.
- `createApproverRestrictedNativeApprovalAdapter`은 호환성 래퍼로 여전히 존재하지만,
  새 코드는 기능 빌더를 우선 사용하고 Plugin에 `approvalCapability`을 노출해야
  합니다.

### 더 세분화된 승인 런타임 하위 경로

사용 빈도가 높은 채널 진입점에서는 해당 계열 중 한 부분만 필요한 경우 더 광범위한
`approval-runtime` 배럴보다 다음과 같이 더 세분화된 하위 경로를 우선 사용하십시오.

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로 모두 필요하지 않은 경우 더 광범위한 포괄 표면보다
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` 및
`openclaw/plugin-sdk/reply-chunking`을 우선 사용하십시오.

### 설정 하위 경로

- `openclaw/plugin-sdk/setup-runtime`은 런타임에 안전한 설정 헬퍼인
  `createSetupTranslator`, 가져오기에 안전한 설정 패치 어댑터
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), 조회 참고 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries` 및 위임된
  설정 프록시 빌더를 포함합니다.
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 설정
  빌더와 몇 가지 설정 안전 프리미티브인 `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` 및 `splitSetupEntries`을 포함합니다.
- `moveSingleAccountChannelSectionToDefaultAccount(...)`과 같이 더 무거운 공유 설정/구성
  헬퍼도 필요한 경우에만 더 광범위한 `openclaw/plugin-sdk/setup` 연결 지점을 사용하십시오.

채널이 설정 화면에서 "먼저 이 Plugin을 설치하십시오"라고 안내하기만 하려는 경우
`createOptionalChannelSetupSurface(...)`을 우선 사용하십시오. 생성된 어댑터/마법사는 구성 쓰기와
완료 처리 시 실패 시 차단하며, 검증, 완료 및 문서 링크 문구에서 동일한
설치 필요 메시지를 재사용합니다.

채널이 환경 변수 기반 설정 또는 인증을 지원하고 일반 시작/구성 흐름에서 런타임이
로드되기 전에 해당 환경 변수 이름을 알아야 하는 경우 Plugin 매니페스트에서
`channelEnvVars`을 사용하여 선언하십시오. 운영자용 문구에만 채널 런타임
`envVars` 또는 로컬 상수를 사용하십시오.

Plugin 런타임이 시작되기 전에 채널이 `status`, `channels list`,
`channels status` 또는 SecretRef 스캔에 표시될 수 있는 경우
`package.json`에 `openclaw.setupEntry`을 추가하십시오. 해당 진입점은 읽기 전용
명령 경로에서 안전하게 가져올 수 있어야 하며, 해당 요약에 필요한 채널 메타데이터,
설정 안전 구성 어댑터, 상태 어댑터 및 채널 시크릿 대상 메타데이터를 반환해야
합니다. 설정 진입점에서 클라이언트, 리스너 또는 전송 런타임을 시작하지 마십시오.

기본 채널 진입점의 가져오기 경로도 좁게 유지하십시오. 검색 과정에서는 채널을
활성화하지 않고도 진입점과 채널 Plugin 모듈을 평가하여 기능을 등록할 수 있습니다.
`channel-plugin-api.ts`과 같은 파일은 설정 마법사, 전송 클라이언트, 소켓 리스너,
하위 프로세스 실행기 또는 서비스 시작 모듈을 가져오지 않고 채널 Plugin 객체를
내보내야 합니다. 이러한 런타임 구성 요소는 `registerFull(...)`, 런타임 세터 또는
지연 기능 어댑터에서 로드되는 모듈에 배치하십시오.

### 기타 세분화된 채널 하위 경로

사용 빈도가 높은 기타 채널 경로에서는 더 광범위한 레거시 표면보다 세분화된
헬퍼를 우선 사용하십시오.

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` 및
  `openclaw/plugin-sdk/account-helpers`: 다중 계정 구성 및 기본 계정 폴백용
- `openclaw/plugin-sdk/inbound-envelope` 및
  `openclaw/plugin-sdk/channel-inbound`: 인바운드 경로/봉투와 기록 및 디스패치 연결용
- `openclaw/plugin-sdk/channel-targets`: 대상 파싱 헬퍼용
- `openclaw/plugin-sdk/outbound-media`: 미디어 로딩용,
  `openclaw/plugin-sdk/channel-outbound`: 아웃바운드 ID/전송 위임 및
  페이로드 계획용
- 아웃바운드 경로에서 명시적
  `replyToId`/`threadId`을 보존하거나 기본 세션 키가 여전히 일치한
  후 현재 `:thread:` 세션을 복구해야 하는 경우 `openclaw/plugin-sdk/channel-core`의
  `buildThreadAwareOutboundSessionRoute(...)`을 사용하십시오. 플랫폼에 네이티브 스레드 전송 의미 체계가
  있는 경우 공급자 Plugin은 우선순위, 접미사 동작 및 스레드 ID 정규화를
  재정의할 수 있습니다.
- `openclaw/plugin-sdk/thread-bindings-runtime`: 스레드 바인딩 수명 주기 및
  어댑터 등록용
- `openclaw/plugin-sdk/agent-media-payload`: 레거시 에이전트/미디어
  페이로드 필드 레이아웃이 여전히 필요한 경우에만 사용
- `openclaw/plugin-sdk/telegram-command-config`(사용 중단됨: 번들
  Plugin은 프로덕션에서 사용하지 않음): Telegram 사용자 지정 명령 정규화,
  중복/충돌 검증 및 폴백에 안정적인 명령 구성 계약용. 새 Plugin 코드에서는
  Plugin 로컬 명령 구성 처리를 우선 사용하십시오.

인증 전용 채널은 일반적으로 기본 경로만으로 충분합니다. 코어가 승인을 처리하고
Plugin은 아웃바운드/인증 기능만 노출합니다. Matrix, Slack, Telegram 및 사용자
지정 채팅 전송과 같은 네이티브 승인 채널은 자체 승인 수명 주기를 구현하는 대신
공유 네이티브 헬퍼를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리를 다음 두 계층으로 분리하여 유지하십시오.

- Plugin 소유 증거 수집
- 공유 정책 평가

멘션 정책 결정에는 `openclaw/plugin-sdk/channel-mention-gating`을 사용하십시오.
더 광범위한 인바운드 헬퍼 배럴이 필요한 경우에만 `openclaw/plugin-sdk/channel-inbound`을
사용하십시오.

Plugin 로컬 로직에 적합한 항목:

- 봇에 대한 답장 감지
- 인용된 봇 감지
- 스레드 참여 확인
- 서비스/시스템 메시지 제외
- 봇 참여를 입증하는 데 필요한 플랫폼 네이티브 캐시

공유 헬퍼에 적합한 항목:

- `requireMention`
- 명시적 멘션 결과
- 암시적 멘션 허용 목록
- 명령 우회
- 최종 건너뛰기 결정

권장 흐름:

1. 로컬 멘션 사실을 계산하십시오.
2. 해당 사실을 `resolveInboundMentionDecision({ facts, policy })`에 전달하십시오.
3. 인바운드 게이트에서 `decision.effectiveWasMentioned`, `decision.shouldBypassMention` 및
   `decision.shouldSkip`을 사용하십시오.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
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

`matchesMentionWithExplicit(...)`은 불리언 값을 반환합니다. `hasAnyMention`,
`isExplicitlyMentioned` 및 `canResolveExplicit`은 채널 자체의 네이티브 멘션
메타데이터(메시지 엔터티, 봇에 대한 답장 플래그 등)에서 가져옵니다. 플랫폼에서
이를 감지할 수 없는 경우 `false`/`undefined` 값을 제공하십시오.

`api.runtime.channel.mentions`은 이미 런타임 주입에 의존하는 번들 채널 Plugin을 위해 동일한
공유 멘션 헬퍼인 `buildMentionRegexes`, `matchesMentionPatterns`,
`matchesMentionWithExplicit`, `implicitMentionKindWhen`, `resolveInboundMentionDecision`을 노출합니다.

`implicitMentionKindWhen`과 `resolveInboundMentionDecision`만 필요한 경우 관련 없는 인바운드 런타임
헬퍼가 로드되지 않도록 `openclaw/plugin-sdk/channel-mention-gating`에서 가져오십시오.

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지 및 매니페스트">
    표준 Plugin 파일을 생성하십시오. `openclaw.plugin.json`의
    `channels` 필드(`kind` 필드가 아님)는 매니페스트가
    채널을 소유함을 나타냅니다. 전체 패키지 메타데이터 표면은
    [Plugin 설정 및 구성](/ko/plugins/sdk-setup#openclaw-channel)을 참조하십시오.

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
          "blurb": "OpenClaw를 Acme Chat에 연결합니다."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat 채널 Plugin",
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
              "label": "봇 토큰",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema`는 `plugins.entries.acme-chat.config`의 유효성을 검사합니다. 채널 계정 구성이 아닌
    Plugin 소유 설정에 사용하십시오.
    `channelConfigs.acme-chat.schema`는 `channels.acme-chat`의 유효성을 검사하며,
    Plugin 런타임이 로드되기 전에 구성 스키마, 설정 및 UI 표면에서 사용하는
    콜드 패스 소스입니다. 최상위 필드의 전체 참조는
    [Plugin 매니페스트](/ko/plugins/manifest)를 참조하십시오.

  </Step>

  <Step title="채널 Plugin 객체 빌드">
    `ChannelPlugin` 인터페이스에는 선택적 어댑터 표면이 많습니다. 먼저
    최소 구성인 `id`, `config`, `setup`으로 시작하고 필요에 따라
    어댑터를 추가하십시오.

    `src/channel.ts`을 생성하십시오.

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // 플랫폼 API 클라이언트

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
      if (!token) throw new Error("acme-chat: 토큰이 필요합니다");
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
        // 계정 확인/검사는 `setup`이 아니라 `config`에 속합니다.
        // `setup`은 온보딩 쓰기 작업(applyAccountConfig, validateInput)을 다룹니다.
        config: {
          listAccountIds: () => ["default"],
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
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // DM 보안: 봇에게 메시지를 보낼 수 있는 사용자
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // 페어링: 새로운 DM 연락처의 승인 흐름
      pairing: {
        text: {
          idLabel: "Acme Chat 사용자 이름",
          message: "신원을 확인하려면 이 코드를 보내십시오.",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `페어링 코드: ${code}`);
          },
        },
      },

      // 스레딩: 답장이 전달되는 방식
      threading: { topLevelReplyToMode: "reply" },

      // 아웃바운드: 플랫폼에 메시지 전송
      outbound: {
        attachedResults: {
          channel: "acme-chat",
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

    정규 최상위 DM 키와 레거시 중첩 키를 모두 허용하는 채널에서는 `plugin-sdk/channel-config-helpers`의 헬퍼를 사용하십시오. `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, `normalizeChannelDmPolicy`은 상속된 루트 값보다 계정 로컬 값에 우선순위를 둡니다. 런타임과 마이그레이션이 동일한 계약을 읽도록 `normalizeLegacyDmAliases`을 통해 동일한 리졸버를 doctor 복구와 연결하십시오.

    <Accordion title="createChatChannelPlugin이 제공하는 기능">
      저수준 어댑터 인터페이스를 직접 구현하는 대신 선언적 옵션을 전달하면
      빌더가 이를 조합합니다.

      | 옵션 | 연결되는 기능 |
      | --- | --- |
      | `security.dm` | 구성 필드에서 범위가 지정된 DM 보안 리졸버 |
      | `pairing.text` | 코드 교환을 사용하는 텍스트 기반 DM 페어링 흐름 |
      | `threading` | 답장 대상 모드 리졸버(고정, 계정 범위 또는 사용자 지정) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 전송 함수. 코어가 반환된 전달 결과에 값을 기록할 수 있도록 형제 `channel` ID가 필요합니다. |

      완전한 제어가 필요한 경우 선언적 옵션 대신 원시 어댑터 객체를
      전달할 수도 있습니다.

      원시 아웃바운드 어댑터는 `chunker(text, limit, ctx)` 함수를 정의할 수 있습니다.
      선택적 `ctx.formatting`에는 `maxLinesPerMessage`과 같은 전달 시점의 서식 결정이
      포함됩니다. 전송 전에 이를 적용하여 공유 아웃바운드 전달에서
      답장 스레딩과 청크 경계를 한 번만 결정하도록 하십시오.
      네이티브 답장 대상이 확인된 경우 전송 컨텍스트에는
      `replyToIdSource`(`implicit` 또는 `explicit`)도 포함되므로,
      페이로드 헬퍼가 암시적인 일회용 답장 슬롯을 소비하지 않고
      명시적인 답장 태그를 보존할 수 있습니다.
    </Accordion>

  </Step>

  <Step title="진입점 연결">
    `index.ts`을 생성하십시오.

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat 채널 Plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat 관리");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat 관리",
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

    채널 소유 CLI 설명자를 `registerCliMetadata(...)`에 배치하여 OpenClaw가
    전체 채널 런타임을 활성화하지 않고도 루트 도움말에 표시할 수 있도록 하십시오.
    일반적인 전체 로드에서도 실제 명령 등록을 위해 동일한 설명자를 계속 가져옵니다.
    런타임 전용 작업에는 `registerFull(...)`을 유지하십시오.
    `defineChannelPluginEntry`은 등록 모드 분리를 자동으로 처리합니다.
    `registerFull(...)`이 Gateway RPC 메서드를 등록하는 경우
    Plugin별 접두사를 사용하십시오. 코어 관리 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약된 상태로 유지되며 항상
    `operator.admin`으로 확인됩니다. 모든 옵션은
    [진입점](/ko/plugins/sdk-entrypoints#definechannelpluginentry)을 참조하십시오.

  </Step>

  <Step title="설정 진입점 추가">
    온보딩 중 가벼운 로드를 위해 `setup-entry.ts`을 생성하십시오.

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    채널이 비활성화되어 있거나 구성되지 않은 경우 OpenClaw는 전체 진입점 대신
    이것을 로드합니다. 설정 흐름 중에 무거운 런타임 코드를 가져오지 않도록 합니다.
    자세한 내용은 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하십시오.

    설정에 안전한 내보내기를 사이드카 모듈로 분리하는 번들 워크스페이스 채널은
    명시적인 설정 시점 런타임 설정자도 필요한 경우
    `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`을 사용할 수 있습니다.

  </Step>

  <Step title="인바운드 메시지 처리">
    Plugin은 플랫폼에서 메시지를 수신하여 OpenClaw로 전달해야 합니다.
    일반적인 패턴은 요청을 검증하고 채널의 인바운드 핸들러를 통해
    디스패치하는 Webhook입니다.

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin이 관리하는 인증(직접 서명을 검증하십시오)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 인바운드 핸들러가 메시지를 OpenClaw로 디스패치합니다.
          // 정확한 연결 방식은 플랫폼 SDK에 따라 다릅니다.
          // 번들 Microsoft Teams 또는 Google Chat Plugin 패키지의 실제 예를 참조하십시오.
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
      (예: Microsoft Teams 또는 Google Chat Plugin 패키지)을 참조하십시오.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
`src/channel.test.ts`에 같은 위치의 테스트를 작성하십시오.

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
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    공유 테스트 헬퍼는 [테스트](/ko/plugins/sdk-testing)를 참조하십시오.

</Step>
</Steps>

## 파일 구조

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 메타데이터
├── openclaw.plugin.json      # 구성 스키마가 포함된 매니페스트
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 공개 내보내기(선택 사항)
├── runtime-api.ts            # 내부 런타임 내보내기(선택 사항)
└── src/
    ├── channel.ts            # createChatChannelPlugin을 통한 ChannelPlugin
    ├── channel.test.ts       # 테스트
    ├── client.ts             # 플랫폼 API 클라이언트
    └── runtime.ts            # 런타임 저장소(필요한 경우)
```

## 고급 주제

<CardGroup cols={2}>
  <Card title="스레딩 옵션" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정, 계정 범위 또는 사용자 지정 응답 모드
  </Card>
  <Card title="메시지 도구 통합" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 작업 검색
  </Card>
  <Card title="대상 확인" icon="crosshair" href="/ko/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="런타임 헬퍼" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime를 통한 TTS, STT, 미디어, 하위 에이전트
  </Card>
  <Card title="채널 인바운드 API" icon="bolt" href="/ko/plugins/sdk-channel-inbound">
    공유 인바운드 이벤트 수명 주기: 수집, 확인, 기록, 디스패치, 완료
  </Card>
</CardGroup>

<Note>
번들 Plugin 유지 관리 및 호환성을 위한 일부 번들 헬퍼 연결부가 여전히
존재합니다. 새 채널 Plugin에는 권장되는 패턴이 아닙니다. 해당 번들
Plugin 제품군을 직접 유지 관리하는 경우가 아니라면 공통 SDK 표면의
일반 채널/설정/응답/런타임 하위 경로를 사용하십시오.
</Note>

## 다음 단계

- [제공자 Plugin](/ko/plugins/sdk-provider-plugins) - Plugin에서 모델도 제공하는 경우
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [SDK 테스트](/ko/plugins/sdk-testing) - 테스트 유틸리티 및 계약 테스트
- [Plugin 매니페스트](/ko/plugins/manifest) - 전체 매니페스트 스키마

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
