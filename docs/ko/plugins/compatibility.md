---
read_when:
    - OpenClaw Plugin을 유지 관리합니다
    - Plugin 호환성 경고가 표시됩니다
    - Plugin SDK 또는 매니페스트 마이그레이션을 계획 중입니다
summary: Plugin 호환성 계약, 지원 중단 메타데이터 및 마이그레이션 기대 사항
title: Plugin 호환성
x-i18n:
    generated_at: "2026-05-11T20:33:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw은 SDK, 매니페스트, 설정, 구성, 에이전트 런타임 계약이 발전하는 동안 기존 번들 및 외부 plugins를 보호하기 위해 오래된 Plugin 계약을 제거하기 전에 명명된 호환성 어댑터를 통해 계속 연결합니다.

## 호환성 레지스트리

Plugin 호환성 계약은 `src/plugins/compat/registry.ts`의 코어 레지스트리에서 추적됩니다.

각 레코드에는 다음이 있습니다.

- 안정적인 호환성 코드
- 상태: `active`, `deprecated`, `removal-pending` 또는 `removed`
- 소유자: SDK, 구성, 설정, 채널, 제공자, Plugin 실행, 에이전트 런타임 또는 코어
- 해당하는 경우 도입 및 사용 중단 날짜
- 대체 지침
- 이전 동작과 새 동작을 다루는 문서, 진단, 테스트

레지스트리는 메인테이너 계획 및 향후 Plugin 검사기 확인의 소스입니다. Plugin 대상 동작이 변경되면 어댑터를 추가하는 동일한 변경에서 호환성 레코드를 추가하거나 업데이트하세요.

Doctor 복구 및 마이그레이션 호환성은 `src/commands/doctor/shared/deprecation-compat.ts`에서 별도로 추적됩니다. 해당 레코드는 런타임 호환성 경로가 제거된 후에도 계속 사용 가능해야 할 수 있는 오래된 구성 형태, 설치 원장 레이아웃, 복구 심을 다룹니다.

릴리스 스윕은 두 레지스트리를 모두 확인해야 합니다. 일치하는 런타임 또는 구성 호환성 레코드가 만료되었다는 이유만으로 doctor 마이그레이션을 삭제하지 마세요. 먼저 해당 복구가 여전히 필요한 지원되는 업그레이드 경로가 없는지 확인하세요. 또한 제공자와 채널이 코어 밖으로 이동하면서 Plugin 소유권과 구성 사용 범위가 변경될 수 있으므로, 릴리스 계획 중에 각 대체 주석을 다시 검증하세요.

## Plugin 검사기 패키지

Plugin 검사기는 버전 관리되는 호환성 및 매니페스트 계약을 기반으로 하는 별도 패키지/저장소로, 코어 OpenClaw 저장소 밖에 있어야 합니다.

첫날 CLI는 다음과 같아야 합니다.

```sh
openclaw-plugin-inspector ./my-plugin
```

다음을 출력해야 합니다.

- 매니페스트/스키마 검증
- 확인 중인 계약 호환성 버전
- 설치/소스 메타데이터 확인
- 콜드 경로 import 확인
- 사용 중단 및 호환성 경고

CI 주석에서 안정적인 기계 판독 가능 출력을 위해 `--json`을 사용하세요. OpenClaw 코어는 검사기가 소비할 수 있는 계약과 fixture를 노출해야 하지만, 기본 `openclaw` 패키지에서 검사기 바이너리를 게시해서는 안 됩니다.

### 메인테이너 승인 레인

OpenClaw Plugin 패키지에 대해 외부 검사기를 검증할 때 설치 가능한 패키지 승인 레인에는 Crabbox 기반 Blacksmith Testbox를 사용하세요. 패키지가 빌드된 후 깨끗한 OpenClaw 체크아웃에서 실행하세요.

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

이 레인은 외부 npm 패키지를 설치하고 저장소 밖에서 클론된 Plugin 패키지를 검사할 수 있으므로 메인테이너의 선택 사항으로 유지하세요. 로컬 저장소 가드는 SDK export map, 호환성 레지스트리 메타데이터, 사용 중단된 SDK import 정리, 번들 extensions import 경계를 다룹니다. Testbox 검사기 증명은 외부 Plugin 작성자가 소비하는 방식의 패키지를 다룹니다.

## 사용 중단 정책

OpenClaw은 대체 항목을 도입하는 동일한 릴리스에서 문서화된 Plugin 계약을 제거해서는 안 됩니다.

마이그레이션 순서는 다음과 같습니다.

1. 새 계약을 추가합니다.
2. 명명된 호환성 어댑터를 통해 이전 동작을 계속 연결합니다.
3. Plugin 작성자가 조치할 수 있을 때 진단 또는 경고를 출력합니다.
4. 대체 항목과 일정을 문서화합니다.
5. 이전 경로와 새 경로를 모두 테스트합니다.
6. 공지된 마이그레이션 기간이 지날 때까지 기다립니다.
7. 명시적인 breaking-release 승인으로만 제거합니다.

사용 중단된 레코드에는 경고 시작일, 대체 항목, 문서 링크, 그리고 경고 시작 후 3개월을 넘지 않는 최종 제거일이 포함되어야 합니다. 메인테이너가 이를 영구 호환성으로 명시적으로 결정하고 대신 `active`로 표시하지 않는 한, 기한이 열린 제거 기간을 가진 사용 중단 호환성 경로를 추가하지 마세요.

## 현재 호환성 영역

현재 호환성 레코드에는 다음이 포함됩니다.

- `openclaw/plugin-sdk/compat` 같은 레거시 광범위 SDK imports
- 레거시 hook 전용 Plugin 형태 및 `before_agent_start`
- plugins가 `register(api)`로 마이그레이션하는 동안의 레거시 `activate(api)` Plugin 진입점
- `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth` 상태 빌더, `openclaw/plugin-sdk/test-utils`(집중된 `openclaw/plugin-sdk/*` 테스트 하위 경로로 대체됨), 그리고 `ClawdbotConfig` / `OpenClawSchemaType` 타입 별칭 같은 레거시 SDK 별칭
- 번들 Plugin 허용 목록 및 활성화 동작
- 레거시 제공자/채널 env-var 매니페스트 메타데이터
- 제공자가 명시적 catalog, auth, thinking, replay, transport hooks로 이동하는 동안의 레거시 제공자 Plugin hooks 및 타입 별칭
- `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt`, 그리고 사용 중단된 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` 같은 레거시 런타임 별칭
- 메모리 plugins가 `registerMemoryCapability`로 이동하는 동안의 레거시 memory-plugin 분할 등록
- 네이티브 메시지 스키마, 멘션 게이팅, 인바운드 envelope 형식 지정, 승인 capability 중첩을 위한 레거시 채널 SDK 헬퍼
- plugins가 `openclaw/plugin-sdk/channel-route`로 이동하는 동안의 레거시 채널 route key 및 comparable-target 헬퍼 별칭
- 매니페스트 contribution 소유권으로 대체되고 있는 활성화 힌트
- 설정 descriptor가 콜드 `setup.requiresRuntime: false` 메타데이터로 이동하는 동안의 `setup-api` 런타임 fallback
- 제공자 catalog hooks가 `catalog.run(...)`으로 이동하는 동안의 제공자 `discovery` hooks
- 채널 패키지가 `openclaw.channel.exposure`로 이동하는 동안의 채널 `showConfigured` / `showInSetup` 메타데이터
- doctor가 운영자를 `agentRuntime`으로 마이그레이션하는 동안의 레거시 runtime-policy 구성 키
- 레지스트리 우선 `channelConfigs` 메타데이터가 도입되는 동안의 생성된 번들 채널 구성 메타데이터 fallback
- 복구 흐름이 운영자를 `openclaw plugins registry --refresh` 및 `openclaw doctor --fix`로 마이그레이션하는 동안의 지속된 Plugin 레지스트리 비활성화 및 install-migration env 플래그
- doctor가 이를 `plugins.entries.<plugin>.config`로 마이그레이션하는 동안의 레거시 Plugin 소유 web search, web fetch, x_search 구성 경로
- 설치 메타데이터가 상태 관리 Plugin 원장으로 이동하는 동안의 레거시 `plugins.installs` 작성 구성 및 번들 Plugin load-path 별칭

새 Plugin 코드는 레지스트리와 특정 마이그레이션 가이드에 나열된 대체 항목을 선호해야 합니다. 기존 plugins는 문서, 진단, 릴리스 노트에서 제거 기간을 공지할 때까지 호환성 경로를 계속 사용할 수 있습니다.

## 릴리스 노트

릴리스 노트에는 대상 날짜와 마이그레이션 문서 링크가 포함된 예정된 Plugin 사용 중단 항목이 포함되어야 합니다. 해당 경고는 호환성 경로가 `removal-pending` 또는 `removed`로 이동하기 전에 이루어져야 합니다.
