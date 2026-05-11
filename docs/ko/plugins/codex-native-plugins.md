---
read_when:
    - Codex 모드 OpenClaw 에이전트가 네이티브 Codex Plugin을 사용하도록 하려고 합니다
    - 소스에서 설치한 openai-curated Codex Plugin을 마이그레이션하는 중입니다
    - codexPlugins, 앱 인벤토리, 파괴적 작업 또는 Plugin 앱 진단 문제를 해결하는 중입니다
summary: Codex 모드 OpenClaw 에이전트용 마이그레이션된 네이티브 Codex Plugin 구성
title: 네이티브 Codex Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

네이티브 Codex Plugin 지원을 통해 Codex 모드 OpenClaw 에이전트는 OpenClaw 턴을 처리하는 동일한 Codex 스레드 안에서 Codex app-server 자체의 앱 및 Plugin 기능을 사용할 수 있습니다.

OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다. Plugin 호출은 네이티브 Codex transcript 안에 유지되며, Codex app-server가 앱 기반 MCP 실행을 소유합니다.

기본 [Codex harness](/ko/plugins/codex-harness)가 작동한 뒤 이 페이지를 사용하세요.

## 요구 사항

- 선택한 OpenClaw 에이전트 런타임은 네이티브 Codex harness여야 합니다.
- `plugins.entries.codex.enabled`는 true여야 합니다.
- `plugins.entries.codex.config.codexPlugins.enabled`는 true여야 합니다.
- V1은 migration이 원본 Codex home에 source-installed 상태로 관찰한 `openai-curated` Plugin만 지원합니다.
- 대상 Codex app-server는 예상 marketplace, Plugin, 앱 인벤토리를 볼 수 있어야 합니다.

`codexPlugins`는 PI 실행, 일반 OpenAI provider 실행, ACP 대화 바인딩 또는 다른 harness에는 영향을 주지 않습니다. 해당 경로들은 네이티브 `apps` config가 있는 Codex app-server 스레드를 만들지 않기 때문입니다.

## 빠른 시작

원본 Codex home에서 migration을 미리 확인합니다.

```bash
openclaw migrate codex --dry-run
```

계획이 적절해 보이면 migration을 적용합니다.

```bash
openclaw migrate apply codex --yes
```

Migration은 적격 Plugin에 대한 명시적 `codexPlugins` 항목을 쓰고 선택한 Plugin에 대해 Codex app-server `plugin/install`을 호출합니다. 일반적인 migration된 config는 다음과 같습니다.

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

`codexPlugins`를 변경한 뒤에는 향후 Codex harness 세션이 업데이트된 앱 집합으로 시작하도록 `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요.

## 네이티브 Plugin 설정 작동 방식

이 통합에는 세 가지 별도 상태가 있습니다.

- 설치됨: Codex가 대상 app-server 런타임에 로컬 Plugin 번들을 가지고 있습니다.
- 활성화됨: OpenClaw config가 Codex harness 턴에서 Plugin을 사용할 수 있도록 허용합니다.
- 접근 가능: Codex app-server가 Plugin의 앱 항목을 활성 계정에서 사용할 수 있으며 migration된 Plugin identity에 매핑할 수 있음을 확인합니다.

Migration은 지속되는 설치/적격성 단계입니다. 런타임 앱 인벤토리는 접근 가능성 확인입니다. 그런 다음 Codex harness 세션 설정은 활성화되고 접근 가능한 Plugin 앱에 대해 제한적인 스레드 앱 config를 계산합니다.

스레드 앱 config는 OpenClaw가 Codex harness 세션을 설정하거나 오래된 Codex 스레드 바인딩을 교체할 때 계산됩니다. 모든 턴마다 다시 계산되지는 않습니다.

## V1 지원 범위

V1은 의도적으로 좁습니다.

- 원본 Codex app-server 인벤토리에 이미 설치되어 있던 `openai-curated` Plugin만 migration 대상입니다.
- Migration은 `marketplaceName` 및 `pluginName`이 포함된 명시적 Plugin identity를 씁니다. 로컬 `marketplacePath` 캐시 경로는 쓰지 않습니다.
- `codexPlugins.enabled`는 전역 활성화 스위치입니다.
- `plugins["*"]` 와일드카드는 없으며 임의 설치 권한을 부여하는 config 키도 없습니다.
- 지원되지 않는 marketplace, 캐시된 Plugin 번들, hook, Codex config 파일은 수동 검토를 위해 migration 보고서에 보존됩니다.

## 앱 인벤토리 및 소유권

OpenClaw는 app-server `app/list`를 통해 Codex 앱 인벤토리를 읽고, 한 시간 동안 캐시하며, 오래되었거나 누락된 항목을 비동기적으로 새로 고칩니다.

Plugin 앱은 OpenClaw가 안정적인 소유권을 통해 migration된 Plugin에 다시 매핑할 수 있을 때만 노출됩니다.

- Plugin detail의 정확한 앱 id
- 알려진 MCP 서버 이름
- 고유하고 안정적인 metadata

표시 이름만 일치하거나 소유권이 모호한 경우, 다음 인벤토리 새로 고침에서 소유권이 증명될 때까지 제외됩니다.

## 스레드 앱 config

OpenClaw는 Codex 스레드에 제한적인 `config.apps` 패치를 주입합니다. `_default`는 비활성화되고, 활성화된 migration Plugin이 소유한 앱만 활성화됩니다.

OpenClaw는 effective 전역 또는 Plugin별 `allow_destructive_actions` 정책에서 앱 수준 `destructive_enabled`를 설정하고, Codex가 네이티브 앱 도구 annotation에서 파괴적 도구 metadata를 적용하도록 둡니다. `_default` 앱 config는 `open_world_enabled: false`로 비활성화됩니다. 활성화된 Plugin 앱은 `open_world_enabled: true`로 출력됩니다. OpenClaw는 별도의 Plugin open-world 정책 knob을 노출하지 않으며 Plugin별 파괴적 도구 이름 deny list를 유지하지 않습니다.

도구 승인 모드는 Plugin 앱에 대해 기본적으로 자동이므로 비파괴적 읽기 도구는 동일 스레드 승인 UI 없이 실행될 수 있습니다. 파괴적 도구는 계속 각 앱의 `destructive_enabled` 정책에 의해 제어됩니다.

## 파괴적 작업 정책

파괴적 Plugin elicitation은 기본적으로 안전하게 거부됩니다.

- 전역 `allow_destructive_actions`의 기본값은 `false`입니다.
- Plugin별 `allow_destructive_actions`는 해당 Plugin에 대해 전역 정책을 재정의합니다.
- 정책이 `false`이면 OpenClaw는 결정적 거부를 반환합니다.
- 정책이 `true`이면 OpenClaw는 boolean approve 필드처럼 승인 응답에 매핑할 수 있는 안전한 schema만 자동 수락합니다.
- Plugin identity 누락, 모호한 소유권, 누락된 turn id, 잘못된 turn id 또는 안전하지 않은 elicitation schema는 prompt를 표시하는 대신 거부됩니다.

## 문제 해결

**`auth_required`:** migration이 Plugin을 설치했지만 그 앱 중 하나가 아직 인증을 필요로 합니다. 명시적 Plugin 항목은 재인증하고 활성화할 때까지 disabled로 작성됩니다.

**`marketplace_missing` 또는 `plugin_missing`:** 대상 Codex app-server가 예상 `openai-curated` marketplace 또는 Plugin을 볼 수 없습니다. 대상 런타임에 대해 migration을 다시 실행하거나 Codex app-server Plugin 상태를 검사하세요.

**`app_inventory_missing` 또는 `app_inventory_stale`:** 앱 준비 상태가 비어 있거나 오래된 캐시에서 왔습니다. OpenClaw는 async refresh를 예약하고 소유권과 준비 상태가 알려질 때까지 Plugin 앱을 제외합니다.

**`app_ownership_ambiguous`:** 앱 인벤토리가 표시 이름으로만 일치했으므로 해당 앱은 Codex 스레드에 노출되지 않습니다.

**Config가 변경되었지만 에이전트가 Plugin을 볼 수 없음:** `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요. 기존 Codex 스레드 바인딩은 OpenClaw가 새 harness 세션을 설정하거나 오래된 바인딩을 교체할 때까지 시작 당시의 앱 config를 유지합니다.

**파괴적 작업이 거부됨:** 전역 및 Plugin별 `allow_destructive_actions` 값을 확인하세요. 정책이 true여도 안전하지 않은 elicitation schema와 모호한 Plugin identity는 여전히 안전하게 거부됩니다.

## 관련 항목

- [Codex harness](/ko/plugins/codex-harness)
- [Codex harness reference](/ko/plugins/codex-harness-reference)
- [Codex harness runtime](/ko/plugins/codex-harness-runtime)
- [Configuration reference](/ko/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/ko/cli/migrate)
