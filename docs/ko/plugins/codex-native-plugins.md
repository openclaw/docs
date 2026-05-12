---
read_when:
    - Codex 모드 OpenClaw 에이전트가 네이티브 Codex Plugin을 사용하기를 원합니다
    - 소스에서 설치한 OpenAI 선별 Codex Plugin을 마이그레이션하고 있습니다
    - codexPlugins, 앱 인벤토리, 파괴적 작업 또는 Plugin 앱 진단 문제를 해결하고 있습니다
summary: 마이그레이션된 네이티브 Codex Plugin을 Codex 모드 OpenClaw 에이전트용으로 구성
title: 네이티브 Codex Plugin
x-i18n:
    generated_at: "2026-05-12T23:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

기본 Codex Plugin 지원을 사용하면 Codex 모드 OpenClaw 에이전트가 OpenClaw 턴을 처리하는 동일한 Codex 스레드 안에서 Codex 앱 서버 자체의 앱 및 Plugin 기능을 사용할 수 있습니다.

OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다. Plugin 호출은 기본 Codex 트랜스크립트에 남아 있으며, Codex 앱 서버가 앱 기반 MCP 실행을 소유합니다.

기본 [Codex 하네스](/ko/plugins/codex-harness)가 동작한 후 이 페이지를 사용하세요.

## 요구 사항

- 선택한 OpenClaw 에이전트 런타임은 기본 Codex 하네스여야 합니다.
- `plugins.entries.codex.enabled`는 true여야 합니다.
- `plugins.entries.codex.config.codexPlugins.enabled`는 true여야 합니다.
- V1은 마이그레이션이 원본 Codex 홈에 소스 설치된 것으로 관찰한 `openai-curated` Plugin만 지원합니다.
- 대상 Codex 앱 서버는 예상된 마켓플레이스, Plugin, 앱 인벤토리를 볼 수 있어야 합니다.

`codexPlugins`는 PI 실행, 일반 OpenAI 제공자 실행, ACP 대화 바인딩 또는 다른 하네스에는 영향을 주지 않습니다. 해당 경로들은 기본 `apps` 구성이 있는 Codex 앱 서버 스레드를 만들지 않기 때문입니다.

## 빠른 시작

원본 Codex 홈에서 마이그레이션을 미리 확인합니다.

```bash
openclaw migrate codex --dry-run
```

기본 Plugin 활성화를 계획하기 전에 마이그레이션이 원본 앱 접근성을 확인하도록 하려면 엄격한 원본 앱 검증을 사용하세요.

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

계획이 적절해 보이면 마이그레이션을 적용합니다.

```bash
openclaw migrate apply codex --yes
```

마이그레이션은 적격 Plugin에 대한 명시적 `codexPlugins` 항목을 작성하고 선택한 Plugin에 대해 Codex 앱 서버 `plugin/install`을 호출합니다. 일반적인 마이그레이션된 구성은 다음과 같습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

`codexPlugins`를 변경한 후에는 향후 Codex 하네스 세션이 업데이트된 앱 집합으로 시작하도록 `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요.

## 기본 Plugin 설정 작동 방식

통합에는 세 가지 별도 상태가 있습니다.

- 설치됨: Codex가 대상 앱 서버 런타임에 로컬 Plugin 번들을 가지고 있습니다.
- 활성화됨: OpenClaw 구성이 Codex 하네스 턴에서 Plugin을 사용할 수 있도록 허용합니다.
- 접근 가능: Codex 앱 서버가 활성 계정에서 Plugin의 앱 항목을 사용할 수 있고 마이그레이션된 Plugin ID에 매핑할 수 있음을 확인합니다.

마이그레이션은 지속적인 설치/적격성 단계입니다. 계획 중에 OpenClaw는 원본 Codex `plugin/read` 세부 정보를 읽고 원본 Codex 앱 서버 계정 응답이 ChatGPT 구독 계정인지 확인합니다. ChatGPT 계정이 아니거나 계정 응답이 누락되면 앱 기반 Plugin은 `codex_subscription_required`로 건너뜁니다. 기본적으로 마이그레이션은 원본 `app/list`를 호출하지 않습니다. 계정 게이트를 통과한 앱 기반 원본 Plugin은 원본 앱 접근성 검증 없이 계획되며, 계정 조회 전송 실패는 `codex_account_unavailable`로 건너뜁니다. `--verify-plugin-apps`를 사용하면 마이그레이션은 새로운 원본 `app/list` 스냅샷을 가져오고 기본 활성화를 계획하기 전에 소유한 모든 앱이 존재하고, 활성화되어 있으며, 접근 가능해야 합니다. 이 모드에서는 계정 조회 전송 실패가 원본 앱 인벤토리 게이트로 넘어갑니다. 런타임 앱 인벤토리는 마이그레이션 후 대상 세션 접근성 검사입니다. 그런 다음 Codex 하네스 세션 설정은 활성화되고 접근 가능한 Plugin 앱에 대해 제한적인 스레드 앱 구성을 계산합니다.

스레드 앱 구성은 OpenClaw가 Codex 하네스 세션을 설정하거나 오래된 Codex 스레드 바인딩을 교체할 때 계산됩니다. 매 턴마다 다시 계산되지는 않습니다.

## V1 지원 경계

V1은 의도적으로 범위가 좁습니다.

- 원본 Codex 앱 서버 인벤토리에 이미 설치되어 있던 `openai-curated` Plugin만 마이그레이션 대상입니다.
- 앱 기반 원본 Plugin은 마이그레이션 시점 구독 게이트를 통과해야 합니다. `--verify-plugin-apps`는 원본 앱 인벤토리 게이트를 추가합니다. 구독 게이트에 걸린 계정과, 검증 모드에서는 접근할 수 없거나 비활성화되었거나 누락된 원본 앱 또는 원본 앱 인벤토리 새로 고침 실패가 활성화된 구성 항목 대신 건너뛴 수동 항목으로 보고됩니다. 읽을 수 없는 Plugin 세부 정보는 원본 앱 인벤토리 게이트 전에 건너뜁니다.
- 마이그레이션은 `marketplaceName` 및 `pluginName`이 포함된 명시적 Plugin ID를 작성합니다. 로컬 `marketplacePath` 캐시 경로는 작성하지 않습니다.
- `codexPlugins.enabled`는 전역 활성화 스위치입니다.
- `plugins["*"]` 와일드카드도, 임의 설치 권한을 부여하는 구성 키도 없습니다.
- 지원되지 않는 마켓플레이스, 캐시된 Plugin 번들, 훅, Codex 구성 파일은 수동 검토를 위해 마이그레이션 보고서에 보존됩니다.

## 앱 인벤토리 및 소유권

OpenClaw는 앱 서버 `app/list`를 통해 Codex 앱 인벤토리를 읽고, 한 시간 동안 캐시하며, 오래되었거나 누락된 항목을 비동기적으로 새로 고칩니다. 캐시는 메모리에만 있습니다. CLI 또는 Gateway를 다시 시작하면 캐시가 삭제되고, OpenClaw는 다음 `app/list` 읽기에서 이를 다시 빌드합니다.

마이그레이션과 런타임은 별도의 캐시 키를 사용합니다.

- 원본 마이그레이션 검증은 원본 Codex 홈과 원본 앱 서버 시작 옵션을 사용합니다. 이는 `--verify-plugin-apps`가 설정된 경우에만 실행되며, 해당 계획 실행에 대해 새로운 원본 `app/list` 순회를 강제합니다.
- 대상 런타임 설정은 Codex 스레드 앱 구성을 빌드할 때 대상 에이전트의 Codex 앱 서버 ID를 사용합니다. Plugin 활성화는 해당 대상 캐시 키를 무효화한 다음 `plugin/install` 후 강제로 새로 고칩니다.

Plugin 앱은 OpenClaw가 안정적인 소유권을 통해 마이그레이션된 Plugin에 다시 매핑할 수 있을 때만 노출됩니다.

- Plugin 세부 정보의 정확한 앱 ID
- 알려진 MCP 서버 이름
- 고유한 안정 메타데이터

표시 이름만 일치하거나 소유권이 모호한 경우 다음 인벤토리 새로 고침에서 소유권이 증명될 때까지 제외됩니다.

## 스레드 앱 구성

OpenClaw는 Codex 스레드에 제한적인 `config.apps` 패치를 주입합니다. `_default`는 비활성화되고, 활성화된 마이그레이션 Plugin이 소유한 앱만 활성화됩니다.

OpenClaw는 유효한 전역 또는 Plugin별 `allow_destructive_actions` 정책에서 앱 수준 `destructive_enabled`를 설정하고, Codex가 기본 앱 도구 주석에서 파괴적 도구 메타데이터를 적용하도록 합니다. `_default` 앱 구성은 `open_world_enabled: false`로 비활성화됩니다. 활성화된 Plugin 앱은 `open_world_enabled: true`로 내보내집니다. OpenClaw는 별도의 Plugin open-world 정책 노브를 노출하지 않으며 Plugin별 파괴적 도구 이름 거부 목록을 유지하지 않습니다.

도구 승인 모드는 Plugin 앱에 대해 기본적으로 자동이므로, 비파괴 읽기 도구는 동일 스레드 승인 UI 없이 실행될 수 있습니다. 파괴적 도구는 계속 각 앱의 `destructive_enabled` 정책에 의해 제어됩니다.

## 파괴적 작업 정책

마이그레이션된 Codex Plugin에는 파괴적 Plugin 유도 요청이 기본적으로 허용되지만, 안전하지 않은 스키마와 모호한 소유권은 여전히 닫힌 상태로 실패합니다.

- 전역 `allow_destructive_actions` 기본값은 `true`입니다.
- Plugin별 `allow_destructive_actions`는 해당 Plugin에 대해 전역 정책을 재정의합니다.
- 정책이 `false`이면 OpenClaw는 결정론적 거절을 반환합니다.
- 정책이 `true`이면 OpenClaw는 불리언 승인 필드처럼 승인 응답에 매핑할 수 있는 안전한 스키마만 자동 수락합니다.
- Plugin ID 누락, 모호한 소유권, 누락된 턴 ID, 잘못된 턴 ID 또는 안전하지 않은 유도 스키마는 프롬프트를 표시하는 대신 거절됩니다.

## 문제 해결

**`auth_required`:** 마이그레이션이 Plugin을 설치했지만 해당 앱 중 하나에 아직 인증이 필요합니다. 재인증하고 활성화할 때까지 명시적 Plugin 항목은 비활성화된 상태로 작성됩니다.

**`app_inaccessible`, `app_disabled` 또는 `app_missing`:**
`--verify-plugin-apps`가 설정된 동안 원본 Codex 앱 인벤토리가 소유한 모든 앱을 존재하고, 활성화되어 있으며, 접근 가능한 상태로 표시하지 않았기 때문에 마이그레이션이 Plugin을 설치하지 않았습니다. Codex에서 앱을 재인증하거나 활성화한 다음 `--verify-plugin-apps`로 마이그레이션을 다시 실행하세요.

**`app_inventory_unavailable`:** 엄격한 원본 앱 검증이 요청되었고 원본 Codex 앱 인벤토리 새로 고침이 실패했기 때문에 마이그레이션이 Plugin을 설치하지 않았습니다. 더 빠른 계정 게이트 계획을 수락한다면 원본 Codex 앱 서버 접근을 수정하거나 `--verify-plugin-apps` 없이 다시 시도하세요.

**`codex_subscription_required`:** 원본 Codex 앱 서버 계정이 ChatGPT 구독 계정으로 로그인되어 있지 않아 마이그레이션이 앱 기반 Plugin을 설치하지 않았습니다. 구독 인증으로 Codex 앱에 로그인한 다음 마이그레이션을 다시 실행하세요.

**`codex_account_unavailable`:** 원본 Codex 앱 서버 계정을 읽을 수 없어 마이그레이션이 앱 기반 Plugin을 설치하지 않았습니다. 원본 Codex 앱 서버 인증을 수정하거나, 계정 조회 실패 시 원본 앱 인벤토리가 적격성을 결정하도록 하려면 `--verify-plugin-apps`로 다시 실행하세요.

**`marketplace_missing` 또는 `plugin_missing`:** 대상 Codex 앱 서버가 예상된 `openai-curated` 마켓플레이스 또는 Plugin을 볼 수 없습니다. 대상 런타임에 대해 마이그레이션을 다시 실행하거나 Codex 앱 서버 Plugin 상태를 검사하세요.

**`app_inventory_missing` 또는 `app_inventory_stale`:** 앱 준비 상태가 비어 있거나 오래된 캐시에서 왔습니다. OpenClaw는 비동기 새로 고침을 예약하고 소유권과 준비 상태가 알려질 때까지 Plugin 앱을 제외합니다.

**`app_ownership_ambiguous`:** 앱 인벤토리가 표시 이름으로만 일치했기 때문에 앱이 Codex 스레드에 노출되지 않습니다.

**구성이 변경되었지만 에이전트가 Plugin을 볼 수 없음:** `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요. 기존 Codex 스레드 바인딩은 OpenClaw가 새 하네스 세션을 설정하거나 오래된 바인딩을 교체할 때까지 시작 시점의 앱 구성을 유지합니다.

**파괴적 작업이 거절됨:** 전역 및 Plugin별 `allow_destructive_actions` 값을 확인하세요. 정책이 true여도 안전하지 않은 유도 스키마와 모호한 Plugin ID는 여전히 닫힌 상태로 실패합니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [구성 참조](/ko/gateway/configuration-reference#codex-harness-plugin-config)
- [마이그레이션 CLI](/ko/cli/migrate)
