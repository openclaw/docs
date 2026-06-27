---
read_when:
    - OpenClaw Plugin을 유지 관리합니다
    - Plugin 호환성 경고가 표시됩니다
    - Plugin SDK 또는 매니페스트 마이그레이션을 계획하고 있습니다
summary: Plugin 호환성 계약, 지원 중단 메타데이터 및 마이그레이션 기대 사항
title: Plugin 호환성
x-i18n:
    generated_at: "2026-06-27T17:45:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw는 기존 번들 및 외부 Plugin을 보호하기 위해 오래된 Plugin 계약을
제거하기 전에 이름이 지정된 호환성 어댑터를 통해 계속 연결해 둡니다. 이는
SDK, 매니페스트, 설정, 구성, agent runtime 계약이 발전하는 동안 기존 번들 및
외부 Plugin을 보호합니다.

## 호환성 레지스트리

Plugin 호환성 계약은 `src/plugins/compat/registry.ts`의 core 레지스트리에서
추적됩니다.

각 레코드에는 다음이 포함됩니다.

- 안정적인 호환성 코드
- 상태: `active`, `deprecated`, `removal-pending` 또는 `removed`
- 소유자: SDK, 구성, 설정, 채널, 제공자, Plugin 실행, agent runtime 또는 core
- 해당하는 경우 도입일 및 폐기일
- 대체 지침
- 기존 동작과 새 동작을 다루는 문서, 진단, 테스트

레지스트리는 유지관리자 계획과 향후 Plugin 검사기 검사의 기준입니다. Plugin
대상 동작이 변경되면 어댑터를 추가하는 동일한 변경에서 호환성 레코드를 추가
또는 업데이트하세요.

Doctor 복구 및 마이그레이션 호환성은
`src/commands/doctor/shared/deprecation-compat.ts`에서 별도로 추적됩니다. 이러한
레코드는 runtime 호환성 경로가 제거된 뒤에도 계속 사용 가능해야 할 수 있는
오래된 구성 형태, 설치 원장 레이아웃, 복구 shim을 다룹니다.

릴리스 점검은 두 레지스트리를 모두 확인해야 합니다. 일치하는 runtime 또는 구성
호환성 레코드가 만료되었다는 이유만으로 doctor 마이그레이션을 삭제하지 마세요.
먼저 해당 복구가 아직 필요한 지원되는 업그레이드 경로가 없는지 확인하세요.
또한 제공자와 채널이 core 밖으로 이동하면서 Plugin 소유권과 구성 범위가 바뀔 수
있으므로, 릴리스 계획 중 각 대체 주석을 다시 검증하세요.

## Plugin 검사기 패키지

Plugin 검사기는 core OpenClaw 저장소 외부에, 버전이 지정된 호환성 및
매니페스트 계약을 기반으로 하는 별도 패키지/저장소로 있어야 합니다.

첫날의 CLI는 다음과 같아야 합니다.

```sh
openclaw-plugin-inspector ./my-plugin
```

다음을 출력해야 합니다.

- 매니페스트/스키마 검증
- 검사 중인 계약 호환성 버전
- 설치/소스 메타데이터 검사
- 콜드 경로 import 검사
- 폐기 및 호환성 경고

CI 주석에서 안정적인 기계 판독 가능 출력을 위해 `--json`을 사용하세요. OpenClaw
core는 검사기가 사용할 수 있는 계약과 fixture를 노출해야 하지만, 기본 `openclaw`
패키지에서 검사기 바이너리를 게시해서는 안 됩니다.

### 유지관리자 승인 레인

OpenClaw Plugin 패키지를 대상으로 외부 검사기를 검증할 때 설치 가능한 패키지
승인 레인에는 Crabbox 기반 Blacksmith Testbox를 사용하세요. 패키지가 빌드된 뒤
깨끗한 OpenClaw 체크아웃에서 실행하세요.

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

이 레인은 외부 npm 패키지를 설치하고 저장소 외부에 복제된 Plugin 패키지를 검사할
수 있으므로 유지관리자 옵트인으로 유지하세요. 로컬 저장소 가드는 SDK export map,
호환성 레지스트리 메타데이터, 폐기된 SDK import 소진, 번들 extension import
경계를 다룹니다. Testbox 검사기 증명은 외부 Plugin 작성자가 소비하는 형태의
패키지를 다룹니다.

## 폐기 정책

OpenClaw는 대체 항목을 도입하는 동일한 릴리스에서 문서화된 Plugin 계약을 제거해서는
안 됩니다.

마이그레이션 순서는 다음과 같습니다.

1. 새 계약을 추가합니다.
2. 이름이 지정된 호환성 어댑터를 통해 이전 동작을 유지합니다.
3. Plugin 작성자가 조치할 수 있을 때 진단 또는 경고를 출력합니다.
4. 대체 항목과 일정을 문서화합니다.
5. 기존 경로와 새 경로를 모두 테스트합니다.
6. 공지된 마이그레이션 기간이 지날 때까지 기다립니다.
7. 명시적인 호환성 중단 릴리스 승인으로만 제거합니다.

폐기된 레코드에는 경고 시작일, 대체 항목, 문서 링크, 그리고 경고 시작 후
3개월 이내의 최종 제거일이 포함되어야 합니다. 유지관리자가 이를 영구 호환성으로
명시적으로 결정하고 대신 `active`로 표시하지 않는 한, 종료일이 열린 폐기된
호환성 경로를 추가하지 마세요.

## 현재 호환성 영역

현재 호환성 레코드는 다음을 포함합니다.

- `openclaw/plugin-sdk/compat` 같은 레거시 광범위 SDK import
- 레거시 hook 전용 Plugin 형태 및 `before_agent_start`
- Plugin이 `gateway_stop`으로 마이그레이션하는 동안의 레거시 `api.on("deactivate", ...)` 정리 hook 이름
- Plugin이 `register(api)`로 마이그레이션하는 동안의 레거시 `activate(api)` Plugin 진입점
- `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`,
  `openclaw/plugin-sdk/command-auth` 상태 빌더, `openclaw/plugin-sdk/test-utils`
  (초점이 맞춰진 `openclaw/plugin-sdk/*` 테스트 하위 경로로 대체됨), 그리고
  `ClawdbotConfig` / `OpenClawSchemaType` 타입 별칭 같은 레거시 SDK 별칭
- 번들 Plugin 허용 목록 및 활성화 동작
- 레거시 제공자/채널 env-var 매니페스트 메타데이터
- 제공자가 명시적 카탈로그, 인증, thinking, replay, transport hook으로 이동하는
  동안의 레거시 제공자 Plugin hook 및 타입 별칭
- `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt`,
  그리고 폐기된 `api.runtime.config.loadConfig()` /
  `api.runtime.config.writeConfigFile(...)` 같은 레거시 runtime 별칭
- 콜백 소비자가 중첩된 `WebInboundCallbackMessage` `event`, `payload`, `quote`,
  `group`, `platform` 컨텍스트로 마이그레이션하는 동안의 WhatsApp
  `WebInboundMessage` 평면 콜백 필드인 `body`, `chatId`, `reply(...)`, `mediaPath`
- 콜백 소비자가 `admission` envelope로 마이그레이션하는 동안의 WhatsApp
  `WebInboundMessage` 최상위 admission 필드인 `from`, `conversationId`,
  `accountId`, `accessControlPassed`, `chatType`
- memory Plugin이 `registerMemoryCapability`로 이동하는 동안의 레거시 memory-plugin
  분할 등록
- embedding 제공자가 `api.registerEmbeddingProvider(...)` 및
  `contracts.embeddingProviders`로 이동하는 동안의 레거시 memory 전용 embedding
  제공자 등록
- 네이티브 메시지 스키마, mention gating, inbound envelope 형식화, approval
  capability 중첩을 위한 레거시 채널 SDK helper
- Plugin이 `openclaw/plugin-sdk/channel-route`로 이동하는 동안의 레거시 채널 route
  key 및 comparable-target helper 별칭
- 매니페스트 contribution 소유권으로 대체되는 활성화 힌트
- 설정 descriptor가 콜드 `setup.requiresRuntime: false` 메타데이터로 이동하는 동안의
  `setup-api` runtime fallback
- 제공자 카탈로그 hook이 `catalog.run(...)`으로 이동하는 동안의 제공자 `discovery` hook
- 채널 패키지가 `openclaw.channel.exposure`로 이동하는 동안의 채널 `showConfigured` /
  `showInSetup` 메타데이터
- doctor가 운영자를 `agentRuntime`으로 마이그레이션하는 동안의 레거시 runtime-policy
  구성 키
- 레지스트리 우선 `channelConfigs` 메타데이터가 적용되는 동안의 생성된 번들 채널
  구성 메타데이터 fallback
- 복구 흐름이 운영자를 `openclaw plugins registry --refresh` 및
  `openclaw doctor --fix`로 마이그레이션하는 동안의 유지된 Plugin 레지스트리 비활성화
  및 설치 마이그레이션 env 플래그
- doctor가 `plugins.entries.<plugin>.config`로 마이그레이션하는 동안의 레거시
  Plugin 소유 web search, web fetch, x_search 구성 경로
- 설치 메타데이터가 상태 관리 Plugin 원장으로 이동하는 동안의 레거시 `plugins.installs`
  작성 구성 및 번들 Plugin load-path 별칭

새 Plugin 코드는 레지스트리와 특정 마이그레이션 가이드에 나열된 대체 항목을
우선 사용해야 합니다. 기존 Plugin은 문서, 진단, 릴리스 노트가 제거 기간을
공지할 때까지 호환성 경로를 계속 사용할 수 있습니다.

### WhatsApp inbound 콜백 평면 별칭

WhatsApp runtime 콜백은 `WebInboundMessage`를 전달합니다. 이는 정식 중첩
`event`, `payload`, `quote`, `group`, `platform` 컨텍스트와, 출시된 콜백
필드에 대한 폐기된 평면 별칭으로 구성됩니다. 새 콜백 코드는 중첩 컨텍스트를
읽어야 합니다. 깨끗한 중첩 콜백 메시지를 구성하는 코드는
`WebInboundCallbackMessage`를 사용할 수 있습니다. 아직 오래된 평면 테스트 또는
Plugin 메시지를 주입하는 호환성 listener는 `LegacyFlatWebInboundMessage` 또는
`WebInboundMessageInput`을 사용해야 합니다.

평면 별칭은 **2026-08-30**까지 사용할 수 있습니다. 이 제거 기간은 평면 별칭
접근에만 적용됩니다. 중첩 콜백 형태가 정식 runtime 계약입니다. 각 평면 별칭의
TypeScript `@deprecated` 주석은 정확한 중첩 대체 항목을 명시합니다. 일반적인
예시는 다음과 같습니다.

- `id`, `timestamp`, `isBatched`는 `event` 아래로 이동합니다.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`,
  `untrustedStructuredContext`는 `payload` 아래로 이동합니다.
- `to`, `chatId`, sender/self 필드, `sendComposing`, `reply(...)`,
  `sendMedia(...)`는 `platform` 아래로 이동합니다.
- `replyTo*` 필드는 `quote` 아래로 이동하고, group subject/participant/mention
  필드는 `group` 아래로 이동합니다.

`payload.untrustedStructuredContext`는 inbound 제공자 payload에서 추출됩니다.
Plugin은 그 `payload`를 신뢰할 수 있는 것으로 취급하기 전에 `label`, `source`,
`type`을 검사해야 합니다.

### WhatsApp inbound admission 필드

허용된 WhatsApp 콜백 메시지는 이제 메시지를 허용한 access-control 결정에 대한
공개 안전 envelope인 `admission`을 포함합니다. 새 콜백 코드는 이전 최상위
admission 필드 대신 `msg.admission`에서 admission 사실을 읽어야 합니다.

최상위 필드는 **2026-08-30**까지 사용할 수 있습니다. TypeScript `@deprecated`
주석은 각 대체 항목을 명시합니다.

- `from` 및 `conversationId`는 `admission.conversation.id`로 이동합니다.
- `accountId`는 `admission.accountId`로 이동합니다.
- `accessControlPassed`는 `admission.ingress.decision === "allow"`의 파생
  호환성 view입니다. 이미 `admission`을 포함하는 메시지에서 레거시 boolean을
  작성해도 ingress graph를 다시 작성하지 않습니다.
- `chatType`은 `admission.conversation.kind`로 이동합니다.

## 릴리스 노트

릴리스 노트에는 대상 날짜와 마이그레이션 문서 링크가 포함된 예정된 Plugin 폐기
항목을 포함해야 합니다. 이러한 경고는 호환성 경로가 `removal-pending` 또는
`removed`로 이동하기 전에 이루어져야 합니다.
