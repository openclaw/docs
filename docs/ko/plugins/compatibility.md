---
read_when:
    - OpenClaw Plugin을 유지 관리합니다
    - Plugin 호환성 경고가 표시됩니다
    - Plugin SDK 또는 매니페스트 마이그레이션을 계획하고 있습니다
summary: Plugin 호환성 계약, 지원 중단 메타데이터 및 마이그레이션 요구사항
title: Plugin 호환성
x-i18n:
    generated_at: "2026-07-12T01:01:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw은 이전 Plugin 계약을 제거하기 전에 이름이 지정된 호환성
어댑터를 통해 계속 연결합니다. 이를 통해 SDK, 매니페스트, 설정, 구성 및 에이전트 런타임 계약이
발전하는 동안 기존 번들 및 외부 Plugin을 보호합니다.

## 호환성 레지스트리

Plugin 호환성 계약은 `src/plugins/compat/registry.ts`의 코어 레지스트리에서
추적됩니다. 각 레코드에는 다음이 포함됩니다.

- 안정적인 호환성 코드
- 상태: `active`, `deprecated`, `removal-pending` 또는 `removed`
- 소유자: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` 또는 `core`
- 해당하는 경우 도입 및 사용 중단 날짜
- 대체 방법 안내
- 이전 동작과 새 동작을 다루는 문서, 진단 및 테스트

레지스트리는 유지관리자 계획 및 향후 Plugin
검사기 확인의 기준입니다. Plugin 대상 동작이 변경되면 어댑터를 추가하는
동일한 변경 사항에서 호환성 레코드를 추가하거나 업데이트하십시오.

Doctor 복구 및 마이그레이션 호환성은
`src/commands/doctor/shared/deprecation-compat.ts`에서 별도로 추적됩니다. 이러한 레코드는 런타임
호환성 경로가 제거된 후에도 유지해야 할 수 있는 이전 구성 형태, 설치 원장 레이아웃 및 복구
심을 다룹니다.

릴리스 점검에서는 두 레지스트리를 모두 확인해야 합니다. 일치하는 런타임 또는 구성 호환성 레코드가
만료되었다는 이유만으로 Doctor 마이그레이션을 삭제하지 마십시오. 먼저 해당 복구가 여전히 필요한
지원 업그레이드 경로가 없는지 확인하십시오. 공급자와 채널이
코어 외부로 이동함에 따라 Plugin 소유권과 구성 범위가 변경될 수 있으므로 릴리스 계획 중에
각 대체 주석도 다시 검증하십시오.

## 사용 중단 정책

OpenClaw은 문서화된 Plugin 계약의 대체 계약을 도입하는 동일한 릴리스에서
기존 계약을 제거해서는 안 됩니다. 마이그레이션 순서는 다음과 같습니다.

1. 새 계약을 추가합니다.
2. 이름이 지정된 호환성 어댑터를 통해 이전 동작을 계속 연결합니다.
3. Plugin 작성자가 조치할 수 있을 때 진단이나 경고를 표시합니다.
4. 대체 방법과 일정을 문서화합니다.
5. 이전 경로와 새 경로를 모두 테스트합니다.
6. 공지된 마이그레이션 기간이 지날 때까지 기다립니다.
7. 명시적인 호환성 파괴 릴리스 승인이 있는 경우에만 제거합니다.

사용 중단된 레코드에는 경고 시작일, 대체 방법, 문서
링크 및 경고 시작 후 3개월 이내의 최종 제거일이 포함되어야 합니다. 유지관리자가
영구 호환성이라고 명시적으로 결정하고 대신 `active`로 표시하지 않는 한, 종료 시점이
정해지지 않은 제거 기간을 가진 사용 중단 호환성 경로를 추가하지 마십시오.

## 현재 호환성 영역

현재 레지스트리는 다음 영역에서 약 70개의 호환성 코드를 추적합니다.
새 Plugin 코드는 각 영역과 해당 마이그레이션 가이드에 명시된 대체 방법을 사용해야 하며,
기존 Plugin은 문서, 진단 및 릴리스 노트에서 제거 기간을 공지할 때까지 호환성
경로를 계속 사용할 수 있습니다.

- `openclaw/plugin-sdk/compat`와 같은 레거시 광범위 SDK 가져오기
- 레거시 훅 전용 Plugin 형태 및 `before_agent_start`
- Plugin이 `gateway_stop`으로 마이그레이션하는 동안의 레거시 `api.on("deactivate", ...)` 정리 훅 이름
- Plugin이 `register(api)`로 마이그레이션하는 동안의 레거시 `activate(api)` Plugin 진입점
- `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  상태 빌더, `openclaw/plugin-sdk/test-utils`(세분화된
  `openclaw/plugin-sdk/*` 테스트 하위 경로로 대체됨), `ClawdbotConfig` /
  `OpenClawSchemaType` 타입 별칭과 같은 레거시 SDK 별칭
- 번들 Plugin 허용 목록 및 활성화 동작
- 레거시 공급자/채널 환경 변수 매니페스트 메타데이터
- 공급자가 명시적인 카탈로그, 인증, 사고, 재생 및 전송 훅으로 이동하는 동안의
  레거시 공급자 Plugin 훅과 타입 별칭
- `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` 및 사용 중단된
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`와 같은 레거시 런타임 별칭
- WhatsApp `WebInboundMessage` 평면 콜백 필드(아래 참조)
- WhatsApp `WebInboundMessage` 최상위 수락 필드(아래 참조)
- 메모리 Plugin이 `registerMemoryCapability`로 이동하는 동안의 레거시 메모리 Plugin 분할 등록
- 임베딩 공급자가 `api.registerEmbeddingProvider(...)` 및
  `contracts.embeddingProviders`로 이동하는 동안의 레거시 메모리 전용 임베딩 공급자 등록
- 네이티브 메시지 스키마, 멘션 제한, 인바운드 봉투 형식 지정 및 승인 기능 중첩을 위한
  레거시 채널 SDK 도우미
- Plugin이 `openclaw/plugin-sdk/channel-route`로 이동하는 동안의
  레거시 채널 경로 키 및 비교 가능 대상 도우미 별칭
- 매니페스트 기여 소유권으로 대체되는 활성화 힌트
- 설정 설명자가 콜드
  `setup.requiresRuntime: false` 메타데이터로 이동하는 동안의 `setup-api` 런타임 대체 경로
- 공급자 카탈로그 훅이 `catalog.run(...)`으로 이동하는 동안의 공급자 `discovery` 훅
- 채널 패키지가 `openclaw.channel.exposure`로 이동하는 동안의 채널
  `showConfigured` / `showInSetup` 메타데이터
- Doctor가 운영자를 `agentRuntime`으로 마이그레이션하는 동안의 레거시 런타임 정책 구성 키
- 레지스트리 우선 `channelConfigs` 메타데이터가 도입되는 동안의
  생성된 번들 채널 구성 메타데이터 대체 경로
- 복구 흐름이 운영자를 `openclaw plugins registry --refresh`
  및 `openclaw doctor --fix`로 마이그레이션하는 동안의 영속 Plugin 레지스트리 비활성화 및 설치 마이그레이션 환경 플래그
- Doctor가 `plugins.entries.<plugin>.config`로 마이그레이션하는 동안의
  레거시 Plugin 소유 웹 검색, 웹 가져오기 및 x_search 구성 경로
- 설치 메타데이터가 상태 관리 Plugin 원장으로 이동하는 동안의
  레거시 `plugins.installs` 작성 구성 및 번들 Plugin 로드 경로 별칭

### WhatsApp 인바운드 콜백 평면 별칭

WhatsApp 런타임 콜백은 정식 중첩 `event`, `payload`, `quote`, `group`, `platform`
컨텍스트와 출시된 콜백 필드의 사용 중단된 평면 별칭으로 구성된 `WebInboundMessage`를 전달합니다.
새 콜백 코드는 중첩 컨텍스트를 읽어야 합니다. 깔끔하게 중첩된 콜백 메시지를 생성하는 코드는
`WebInboundCallbackMessage`를 사용할 수 있으며, 여전히 이전 평면 테스트 또는 Plugin 메시지를
주입하는 호환성 리스너는 `LegacyFlatWebInboundMessage` 또는 `WebInboundMessageInput`을 사용해야 합니다.

평면 별칭은 **2026-08-30**까지 사용할 수 있습니다. 이 기간은 평면 별칭 접근에만
적용되며, 정식 런타임 계약인 중첩 형태에는 적용되지 않습니다. 각 평면 별칭의 TypeScript
`@deprecated` 주석에는 정확한 중첩 대체 항목이 명시되어 있습니다. 일반적인 예시는 다음과 같습니다.

- `id`, `timestamp`, `isBatched`는 `event` 아래로 이동합니다.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`,
  `untrustedStructuredContext`는 `payload` 아래로 이동합니다.
- `to`, `chatId`, 발신자/본인 필드, `sendComposing`, `reply(...)`,
  `sendMedia(...)`는 `platform` 아래로 이동합니다.
- `replyTo*` 필드는 `quote` 아래로 이동하며, 그룹 제목/참가자/멘션 필드는 `group` 아래로 이동합니다.

`payload.untrustedStructuredContext`는 인바운드 공급자 페이로드에서 추출됩니다.
Plugin은 해당 `payload`를 신뢰할 수 있는 정보로 취급하기 전에 `label`, `source`, `type`을
검사해야 합니다.

### WhatsApp 인바운드 수락 필드

수락된 WhatsApp 콜백 메시지는 메시지를 허용한 접근 제어 결정의 공개에 안전한
봉투인 `admission`을 전달합니다. 새 콜백 코드는 이전 최상위 수락 필드 대신
`msg.admission`에서 수락 정보를 읽어야 합니다.

최상위 필드는 **2026-08-30**까지 사용할 수 있습니다. 각 필드의
TypeScript `@deprecated` 주석에는 대체 항목이 명시되어 있습니다.

- `from`과 `conversationId`는 `admission.conversation.id`로 이동합니다.
- `accountId`는 `admission.accountId`로 이동합니다.
- `accessControlPassed`는
  `admission.ingress.decision === "allow"`의 파생된 호환성 뷰입니다. 이미
  `admission`을 포함한 메시지에서 레거시 불리언을 작성해도 인그레스
  그래프가 다시 작성되지 않습니다.
- `chatType`은 `admission.conversation.kind`로 이동합니다.

## Plugin 검사기 패키지

Plugin 검사기는 버전이 지정된 호환성 및 매니페스트 계약을 기반으로 하는
별도의 패키지/저장소로 코어 OpenClaw 저장소 외부에 있어야 합니다. 최초 CLI는 다음과 같아야 합니다.

```sh
openclaw-plugin-inspector ./my-plugin
```

매니페스트/스키마 검증, 검사 중인 계약 호환성 버전, 설치/소스 메타데이터 검사,
콜드 경로 가져오기 검사 및 사용 중단/호환성 경고를 출력해야 합니다. CI 주석에서 안정적인
기계 판독 가능 출력을 사용하려면 `--json`을 사용하십시오. OpenClaw 코어는 검사기가 사용할 수 있는
계약과 픽스처를 노출해야 하지만, 기본 `openclaw` 패키지에서 검사기 바이너리를
게시해서는 안 됩니다.

### 유지관리자 인수 레인

OpenClaw Plugin 패키지에 대해 외부 검사기를 검증할 때 설치 가능한 패키지 인수
레인에는 Crabbox 기반 Blacksmith Testbox를 사용하십시오. 패키지를 빌드한 후 깨끗한 OpenClaw
체크아웃에서 실행하십시오.

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

이 레인은 외부 npm 패키지를 설치하고 저장소 외부에 복제된 Plugin 패키지를 검사할 수 있으므로
유지관리자에게 선택 사항으로 유지하십시오. 로컬 저장소 가드는 SDK 내보내기 맵, 호환성 레지스트리
메타데이터, 사용 중단된 SDK 가져오기 축소 및 번들 확장 가져오기 경계를 다룹니다.
Testbox 검사기 증명은 외부 Plugin 작성자가 사용하는 방식 그대로 패키지를 검증합니다.

## 릴리스 노트

호환성 경로가 `removal-pending` 또는 `removed`로 이동하기 전에 릴리스 노트에
목표 날짜 및 마이그레이션 문서 링크와 함께 예정된 Plugin 사용 중단 사항을 포함해야 합니다.
