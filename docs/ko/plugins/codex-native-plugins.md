---
read_when:
    - Codex 모드 OpenClaw 에이전트가 네이티브 Codex Plugin을 사용하도록 하려는 경우
    - 소스에서 설치한 OpenAI 큐레이션 Codex Plugin을 마이그레이션하고 있습니다
    - codexPlugins, 앱 인벤토리, 파괴적 작업 또는 Plugin 앱 진단 문제를 해결하고 있습니다
summary: Codex 모드 OpenClaw 에이전트를 위한 마이그레이션된 네이티브 Codex Plugin 구성
title: 네이티브 Codex Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

네이티브 Codex Plugin 지원을 통해 Codex 모드 OpenClaw 에이전트는 OpenClaw 턴을 처리하는 동일한 Codex 스레드 안에서 Codex app-server 자체의 앱 및 Plugin 기능을 사용할 수 있습니다.

OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다. Plugin 호출은 네이티브 Codex 트랜스크립트에 남으며, Codex app-server가 앱 기반 MCP 실행을 소유합니다.

기본 [Codex 하니스](/ko/plugins/codex-harness)가 작동한 후 이 페이지를 사용하세요.

## 요구 사항

- 선택한 OpenClaw 에이전트 런타임은 네이티브 Codex 하니스여야 합니다.
- `plugins.entries.codex.enabled`는 true여야 합니다.
- `plugins.entries.codex.config.codexPlugins.enabled`는 true여야 합니다.
- V1은 마이그레이션이 소스 Codex 홈에 소스 설치된 것으로 관찰한 `openai-curated` Plugin만 지원합니다.
- 대상 Codex app-server는 예상되는 마켓플레이스, Plugin 및 앱 인벤토리를 볼 수 있어야 합니다.

`codexPlugins`는 PI 실행, 일반 OpenAI 제공자 실행, ACP 대화 바인딩 또는 다른 하니스에는 영향을 주지 않습니다. 이러한 경로는 네이티브 `apps` 구성이 있는 Codex app-server 스레드를 만들지 않기 때문입니다.

## 빠른 시작

소스 Codex 홈에서 마이그레이션을 미리 봅니다.

```bash
openclaw migrate codex --dry-run
```

계획이 적절해 보이면 마이그레이션을 적용합니다.

```bash
openclaw migrate apply codex --yes
```

마이그레이션은 적격 Plugin에 대한 명시적 `codexPlugins` 항목을 작성하고, 선택된 Plugin에 대해 Codex app-server `plugin/install`을 호출합니다. 일반적인 마이그레이션된 구성은 다음과 같습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

`codexPlugins`를 변경한 후에는 향후 Codex 하니스 세션이 업데이트된 앱 집합으로 시작되도록 `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요.

## 네이티브 Plugin 설정 작동 방식

통합에는 세 가지 별도 상태가 있습니다.

- 설치됨: Codex가 대상 app-server 런타임에 로컬 Plugin 번들을 가지고 있습니다.
- 활성화됨: OpenClaw 구성이 Codex 하니스 턴에서 Plugin을 사용할 수 있도록 허용합니다.
- 접근 가능함: Codex app-server가 Plugin의 앱 항목이 활성 계정에서 사용 가능하며 마이그레이션된 Plugin ID에 매핑될 수 있음을 확인합니다.

마이그레이션은 지속적인 설치/적격성 단계입니다. 런타임 앱 인벤토리는 접근성 확인입니다. 그런 다음 Codex 하니스 세션 설정은 활성화되고 접근 가능한 Plugin 앱에 대해 제한적인 스레드 앱 구성을 계산합니다.

스레드 앱 구성은 OpenClaw가 Codex 하니스 세션을 설정하거나 오래된 Codex 스레드 바인딩을 교체할 때 계산됩니다. 매 턴마다 다시 계산되지는 않습니다.

## V1 지원 범위

V1은 의도적으로 좁게 설계되었습니다.

- 소스 Codex app-server 인벤토리에 이미 설치되어 있던 `openai-curated` Plugin만 마이그레이션 대상입니다.
- 마이그레이션은 `marketplaceName` 및 `pluginName`이 있는 명시적 Plugin ID를 작성하며, 로컬 `marketplacePath` 캐시 경로는 작성하지 않습니다.
- `codexPlugins.enabled`는 전역 활성화 스위치입니다.
- `plugins["*"]` 와일드카드는 없으며 임의 설치 권한을 부여하는 구성 키도 없습니다.
- 지원되지 않는 마켓플레이스, 캐시된 Plugin 번들, 훅, Codex 구성 파일은 수동 검토를 위해 마이그레이션 보고서에 보존됩니다.

## 앱 인벤토리 및 소유권

OpenClaw는 app-server `app/list`를 통해 Codex 앱 인벤토리를 읽고, 이를 한 시간 동안 캐시하며, 오래되었거나 누락된 항목을 비동기적으로 새로 고칩니다.

Plugin 앱은 OpenClaw가 안정적인 소유권을 통해 해당 앱을 마이그레이션된 Plugin에 다시 매핑할 수 있을 때만 노출됩니다.

- Plugin 세부 정보의 정확한 앱 ID
- 알려진 MCP 서버 이름
- 고유하고 안정적인 메타데이터

표시 이름만 일치하거나 소유권이 모호한 경우, 다음 인벤토리 새로 고침에서 소유권이 증명될 때까지 제외됩니다.

## 스레드 앱 구성

OpenClaw는 Codex 스레드에 제한적인 `config.apps` 패치를 주입합니다. `_default`는 비활성화되고 활성화된 마이그레이션 Plugin이 소유한 앱만 활성화됩니다.

OpenClaw는 유효한 전역 또는 Plugin별 `allow_destructive_actions` 정책에서 앱 수준 `destructive_enabled`를 설정하고, Codex가 네이티브 앱 도구 주석에서 파괴적 도구 메타데이터를 적용하도록 둡니다. `_default` 앱 구성은 `open_world_enabled: false`로 비활성화됩니다. 활성화된 Plugin 앱은 `open_world_enabled: true`로 출력됩니다. OpenClaw는 별도의 Plugin 오픈 월드 정책 노브를 노출하지 않으며, Plugin별 파괴적 도구 이름 거부 목록을 유지하지 않습니다.

OpenClaw는 이 동일 스레드 경로에 대화형 앱 유도 UI가 없기 때문에 Plugin 앱의 도구 승인 모드는 기본적으로 프롬프트 방식입니다.

## 파괴적 작업 정책

파괴적 Plugin 유도는 기본적으로 닫힌 상태로 실패합니다.

- 전역 `allow_destructive_actions` 기본값은 `false`입니다.
- Plugin별 `allow_destructive_actions`는 해당 Plugin에 대한 전역 정책을 재정의합니다.
- 정책이 `false`이면 OpenClaw는 결정적 거절을 반환합니다.
- 정책이 `true`이면 OpenClaw는 불리언 승인 필드처럼 승인 응답에 매핑할 수 있는 안전한 스키마만 자동으로 수락합니다.
- Plugin ID 누락, 모호한 소유권, 누락된 턴 ID, 잘못된 턴 ID 또는 안전하지 않은 유도 스키마는 프롬프트 대신 거절됩니다.

## 문제 해결

**`auth_required`:** 마이그레이션이 Plugin을 설치했지만, 해당 앱 중 하나에 여전히 인증이 필요합니다. 다시 인증하고 활성화할 때까지 명시적 Plugin 항목은 비활성화된 상태로 작성됩니다.

**`marketplace_missing` 또는 `plugin_missing`:** 대상 Codex app-server가 예상되는 `openai-curated` 마켓플레이스 또는 Plugin을 볼 수 없습니다. 대상 런타임을 대상으로 마이그레이션을 다시 실행하거나 Codex app-server Plugin 상태를 검사하세요.

**`app_inventory_missing` 또는 `app_inventory_stale`:** 앱 준비 상태가 비어 있거나 오래된 캐시에서 왔습니다. OpenClaw는 비동기 새로 고침을 예약하고, 소유권과 준비 상태를 알 때까지 Plugin 앱을 제외합니다.

**`app_ownership_ambiguous`:** 앱 인벤토리가 표시 이름으로만 일치했으므로 앱은 Codex 스레드에 노출되지 않습니다.

**구성이 변경되었지만 에이전트가 Plugin을 볼 수 없음:** `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요. 기존 Codex 스레드 바인딩은 OpenClaw가 새 하니스 세션을 설정하거나 오래된 바인딩을 교체할 때까지 시작 시의 앱 구성을 유지합니다.

**파괴적 작업이 거절됨:** 전역 및 Plugin별 `allow_destructive_actions` 값을 확인하세요. 정책이 true인 경우에도 안전하지 않은 유도 스키마와 모호한 Plugin ID는 여전히 닫힌 상태로 실패합니다.

## 관련 항목

- [Codex 하니스](/ko/plugins/codex-harness)
- [Codex 하니스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하니스 런타임](/ko/plugins/codex-harness-runtime)
- [구성 참조](/ko/gateway/configuration-reference#codex-harness-plugin-config)
- [마이그레이션 CLI](/ko/cli/migrate)
