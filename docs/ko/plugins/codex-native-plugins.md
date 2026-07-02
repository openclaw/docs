---
read_when:
    - Codex 모드 OpenClaw 에이전트가 네이티브 Codex Plugin을 사용하도록 설정하려는 경우
    - 소스에서 설치한 OpenAI 큐레이션 Codex Plugin을 마이그레이션하는 중입니다
    - codexPlugins, 앱 인벤토리, 파괴적 작업 또는 Plugin 앱 진단 문제를 해결하는 중입니다
summary: Codex 모드 OpenClaw 에이전트용으로 마이그레이션된 네이티브 Codex plugins 구성
title: 네이티브 Codex Plugin
x-i18n:
    generated_at: "2026-07-02T00:48:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

네이티브 Codex Plugin 지원을 사용하면 Codex 모드의 OpenClaw 에이전트가 OpenClaw 턴을 처리하는 동일한 Codex 스레드 안에서 Codex 앱 서버 자체의 앱 및 Plugin 기능을 사용할 수 있습니다.

OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다. Plugin 호출은 네이티브 Codex transcript에 남아 있으며, Codex 앱 서버가 앱 기반 MCP 실행을 소유합니다.

기본 [Codex 하네스](/ko/plugins/codex-harness)가 작동한 뒤 이 페이지를 사용하세요.

## 요구 사항

- 선택한 OpenClaw 에이전트 런타임은 네이티브 Codex 하네스여야 합니다.
- `plugins.entries.codex.enabled`는 true여야 합니다.
- `plugins.entries.codex.config.codexPlugins.enabled`는 true여야 합니다.
- V1은 마이그레이션에서 원본 Codex 홈에 소스 설치된 것으로 관찰된 `openai-curated` Plugin만 지원합니다.
- 대상 Codex 앱 서버는 예상 marketplace, Plugin, 앱 인벤토리를 볼 수 있어야 합니다.

`codexPlugins`는 OpenClaw 실행, 일반 OpenAI 제공자 실행, ACP 대화 바인딩 또는 다른 하네스에는 영향을 주지 않습니다. 해당 경로들은 네이티브 `apps` config가 있는 Codex 앱 서버 스레드를 생성하지 않기 때문입니다.

OpenAI 측 Codex 접근 권한, 앱 가용성, 워크스페이스 앱/Plugin 제어는 로그인된 Codex 계정에서 제공됩니다. OpenAI 계정 및 관리자 모델은 [ChatGPT 플랜으로 Codex 사용하기](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)를 참조하세요.

## 빠른 시작

원본 Codex 홈에서 마이그레이션을 미리 봅니다.

```bash
openclaw migrate codex --dry-run
```

네이티브 Plugin 활성화를 계획하기 전에 마이그레이션이 원본 앱 접근성을 확인하도록 하려면 엄격한 원본 앱 검증을 사용합니다.

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

계획이 올바르게 보이면 마이그레이션을 적용합니다.

```bash
openclaw migrate apply codex --yes
```

마이그레이션은 대상 Plugin에 대해 명시적인 `codexPlugins` 항목을 작성하고 선택한 Plugin에 대해 Codex 앱 서버 `plugin/install`을 호출합니다. 일반적인 마이그레이션된 config는 다음과 같습니다.

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

`codexPlugins`를 변경하면 새 Codex 대화는 업데이트된 앱 세트를 자동으로 가져옵니다. 현재 대화를 새로 고치려면 `/new` 또는 `/reset`을 사용하세요. Plugin 활성화 또는 비활성화 변경에는 Gateway 재시작이 필요하지 않습니다.

## 채팅에서 Plugin 관리

Codex 하네스를 운영하는 동일한 채팅에서 구성된 네이티브 Codex Plugin을 확인하거나 변경하려면 `/codex plugins`를 사용하세요.

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins`는 `/codex plugins list`의 별칭입니다. 목록 출력에는 구성된 Plugin 키, 켜짐/꺼짐 상태, Codex Plugin 이름, `plugins.entries.codex.config.codexPlugins.plugins`의 marketplace가 표시됩니다.

`enable` 및 `disable`은 `~/.openclaw/openclaw.json`의 OpenClaw config에만 씁니다. `~/.codex/config.toml`을 편집하거나 새 Codex Plugin을 설치하지 않습니다. 소유자 또는 `operator.admin` scope가 있는 Gateway 클라이언트만 Plugin 상태를 변경할 수 있습니다.

구성된 Plugin을 활성화하면 전역 `codexPlugins.enabled` 스위치도 켜집니다. 마이그레이션이 `auth_required`를 반환하여 Plugin이 비활성화 상태로 작성된 경우, OpenClaw에서 활성화하기 전에 Codex에서 앱을 다시 승인하세요.

## 네이티브 Plugin 설정 작동 방식

이 통합에는 세 가지 별도 상태가 있습니다.

- 설치됨: Codex가 대상 앱 서버 런타임에 로컬 Plugin 번들을 가지고 있습니다.
- 활성화됨: OpenClaw config가 해당 Plugin을 Codex 하네스 턴에 사용할 수 있도록 허용합니다.
- 접근 가능: Codex 앱 서버가 해당 Plugin의 앱 항목이 활성 계정에서 사용 가능하며 마이그레이션된 Plugin ID에 매핑될 수 있음을 확인합니다.

마이그레이션은 지속적인 설치/적격성 단계입니다. 계획 중 OpenClaw는 원본 Codex `plugin/read` 세부 정보를 읽고 원본 Codex 앱 서버 계정 응답이 ChatGPT 구독 계정인지 확인합니다. ChatGPT가 아니거나 계정 응답이 없으면 앱 기반 Plugin은 `codex_subscription_required`로 건너뜁니다. 기본적으로 마이그레이션은 원본 `app/list`를 호출하지 않습니다. 계정 게이트를 통과한 앱 기반 원본 Plugin은 원본 앱 접근성 검증 없이 계획되며, 계정 조회 전송 실패는 `codex_account_unavailable`로 건너뜁니다. `--verify-plugin-apps`를 사용하면 마이그레이션은 새 원본 `app/list` 스냅샷을 가져오고, 네이티브 활성화를 계획하기 전에 모든 소유 앱이 존재하고 활성화되어 있으며 접근 가능한지 요구합니다. 이 모드에서는 계정 조회 전송 실패가 원본 앱 인벤토리 게이트로 넘어갑니다. 런타임 앱 인벤토리는 마이그레이션 후 대상 세션 접근성 확인입니다. 그런 다음 Codex 하네스 세션 설정은 활성화되고 접근 가능한 Plugin 앱에 대해 제한적인 스레드 앱 config를 계산합니다.

스레드 앱 config는 OpenClaw가 Codex 하네스 세션을 설정하거나 오래된 Codex 스레드 바인딩을 교체할 때 계산됩니다. 매 턴마다 다시 계산되지 않으므로 `/codex plugins enable` 및 `/codex plugins disable`은 새 Codex 대화에 영향을 줍니다. 현재 대화가 업데이트된 앱 세트를 가져와야 한다면 `/new` 또는 `/reset`을 사용하세요.

## V1 지원 경계

V1은 의도적으로 범위가 좁습니다.

- 원본 Codex 앱 서버 인벤토리에 이미 설치되어 있던 `openai-curated` Plugin만 마이그레이션 대상입니다.
- 앱 기반 원본 Plugin은 마이그레이션 시점의 구독 게이트를 통과해야 합니다. `--verify-plugin-apps`는 원본 앱 인벤토리 게이트를 추가합니다. 구독 게이트에 걸린 계정, 그리고 검증 모드에서 접근 불가, 비활성화, 누락된 원본 앱 또는 원본 앱 인벤토리 새로 고침 실패는 활성화된 config 항목 대신 건너뛴 수동 항목으로 보고됩니다. 읽을 수 없는 Plugin 세부 정보는 원본 앱 인벤토리 게이트 전에 건너뜁니다.
- 마이그레이션은 `marketplaceName` 및 `pluginName`으로 명시적인 Plugin ID를 작성합니다. 로컬 `marketplacePath` 캐시 경로는 작성하지 않습니다.
- `codexPlugins.enabled`는 전역 활성화 스위치입니다.
- `plugins["*"]` 와일드카드는 없으며 임의 설치 권한을 부여하는 config 키도 없습니다.
- 지원되지 않는 marketplace, 캐시된 Plugin 번들, hook, Codex config 파일은 수동 검토를 위해 마이그레이션 보고서에 보존됩니다.

## 앱 인벤토리 및 소유권

OpenClaw는 앱 서버 `app/list`를 통해 Codex 앱 인벤토리를 읽고, 이를 1시간 동안 캐시하며, 오래되었거나 누락된 항목을 비동기적으로 새로 고칩니다. 캐시는 메모리에만 있습니다. CLI 또는 Gateway를 재시작하면 캐시가 삭제되며, OpenClaw는 다음 `app/list` 읽기에서 이를 다시 빌드합니다.

마이그레이션과 런타임은 별도의 캐시 키를 사용합니다.

- 원본 마이그레이션 검증은 원본 Codex 홈과 원본 앱 서버 시작 옵션을 사용합니다. 이는 `--verify-plugin-apps`가 설정된 경우에만 실행되며, 해당 계획 실행에 대해 새 원본 `app/list` 순회를 강제합니다.
- 대상 런타임 설정은 Codex 스레드 앱 config를 빌드할 때 대상 에이전트의 Codex 앱 서버 ID를 사용합니다. Plugin 활성화는 해당 대상 캐시 키를 무효화한 다음 `plugin/install` 후 강제로 새로 고칩니다.

Plugin 앱은 OpenClaw가 안정적인 소유권을 통해 마이그레이션된 Plugin으로 다시 매핑할 수 있을 때만 노출됩니다.

- Plugin 세부 정보의 정확한 앱 id
- 알려진 MCP 서버 이름
- 고유한 안정 메타데이터

표시 이름만 일치하거나 소유권이 모호한 경우, 다음 인벤토리 새로 고침에서 소유권이 증명될 때까지 제외됩니다.

## 스레드 앱 config

OpenClaw는 Codex 스레드에 제한적인 `config.apps` 패치를 주입합니다. `_default`는 비활성화되고 활성화된 마이그레이션 Plugin이 소유한 앱만 활성화됩니다.

OpenClaw는 유효한 전역 또는 Plugin별 `allow_destructive_actions` 정책에서 앱 수준 `destructive_enabled`를 설정하고, Codex가 네이티브 앱 도구 주석에서 파괴적 도구 메타데이터를 강제하도록 합니다. `true`, `"auto"`, `"ask"`는 `destructive_enabled: true`를 설정하고, `false`는 false로 설정합니다. `_default` 앱 config는 `open_world_enabled: false`로 비활성화됩니다. 활성화된 Plugin 앱은 `open_world_enabled: true`로 출력됩니다. OpenClaw는 별도의 Plugin open-world 정책 knob를 노출하지 않으며 Plugin별 파괴적 도구 이름 거부 목록을 유지하지 않습니다.

도구 승인 모드는 Plugin 앱에 대해 기본적으로 자동이므로 비파괴적 읽기 도구는 동일 스레드 승인 UI 없이 실행될 수 있습니다. 파괴적 도구는 각 앱의 `destructive_enabled` 정책에 의해 계속 제어됩니다.

## 파괴적 작업 정책

마이그레이션된 Codex Plugin에 대해서는 파괴적 Plugin elicitation이 기본적으로 허용되지만, 안전하지 않은 schema와 모호한 소유권은 여전히 실패 폐쇄됩니다.

- 전역 `allow_destructive_actions`의 기본값은 `true`입니다.
- Plugin별 `allow_destructive_actions`는 해당 Plugin에 대해 전역 정책을 재정의합니다.
- 정책이 `false`이면 OpenClaw는 결정적인 거절을 반환합니다.
- 정책이 `true`이면 OpenClaw는 boolean approve 필드처럼 승인 응답에 매핑할 수 있는 안전한 schema만 자동 수락합니다.
- 정책이 `"auto"`이면 OpenClaw는 파괴적 Plugin 작업을 Codex에 노출하지만, 소유권이 증명된 MCP 승인 elicitation을 Codex 승인 응답을 반환하기 전에 OpenClaw Plugin 승인으로 변환합니다.
- 정책이 `"ask"`이면 OpenClaw는 `"auto"`와 동일한 Codex 쓰기/파괴적 게이팅을 사용하고, 스레드가 시작되기 전에 해당 앱의 지속적인 Codex 도구별 승인 override를 지우며, 일회성 승인 또는 거부만 제공하여 지속적인 승인이 이후 쓰기 작업 프롬프트를 억제하지 못하도록 합니다.
- `"ask"`를 사용하는 각 허용 앱에 대해 OpenClaw는 해당 앱의 Codex human approvals reviewer를 선택하여 Codex가 승인 elicitation을 OpenClaw로 보내도록 합니다. 다른 앱과 앱이 아닌 스레드 승인은 구성된 reviewer와 정책을 유지합니다.
- Plugin ID 누락, 모호한 소유권, 누락된 턴 id, 잘못된 턴 id 또는 안전하지 않은 elicitation schema는 프롬프트를 표시하지 않고 거절됩니다.

## 문제 해결

**`auth_required`:** 마이그레이션이 Plugin을 설치했지만 해당 앱 중 하나에 아직 인증이 필요합니다. 다시 승인하고 활성화할 때까지 명시적인 Plugin 항목은 비활성화 상태로 작성됩니다.

**`app_inaccessible`, `app_disabled` 또는 `app_missing`:**
`--verify-plugin-apps`가 설정된 동안 원본 Codex 앱 인벤토리에서 모든 소유 앱이 존재하고 활성화되어 있으며 접근 가능한 것으로 표시되지 않았기 때문에 마이그레이션이 Plugin을 설치하지 않았습니다. Codex에서 앱을 다시 승인하거나 활성화한 다음 `--verify-plugin-apps`로 마이그레이션을 다시 실행하세요.

**`app_inventory_unavailable`:** 엄격한 원본 앱 검증이 요청되었고 원본 Codex 앱 인벤토리 새로 고침이 실패했기 때문에 마이그레이션이 Plugin을 설치하지 않았습니다. 원본 Codex 앱 서버 접근을 수정하거나 더 빠른 계정 게이트 계획을 수락한다면 `--verify-plugin-apps` 없이 다시 시도하세요.

**`codex_subscription_required`:** 원본 Codex 앱 서버 계정이 ChatGPT 구독 계정으로 로그인되어 있지 않았기 때문에 마이그레이션이 앱 기반 Plugin을 설치하지 않았습니다. 구독 인증으로 Codex 앱에 로그인한 다음 마이그레이션을 다시 실행하세요.

**`codex_account_unavailable`:** 원본 Codex 앱 서버 계정을 읽을 수 없었기 때문에 마이그레이션이 앱 기반 Plugin을 설치하지 않았습니다. 원본 Codex 앱 서버 인증을 수정하거나 계정 조회가 실패할 때 원본 앱 인벤토리로 적격성을 결정하려면 `--verify-plugin-apps`로 다시 실행하세요.

**`marketplace_missing` 또는 `plugin_missing`:** 대상 Codex 앱 서버가 예상 `openai-curated` marketplace 또는 Plugin을 볼 수 없습니다. 대상 런타임에 대해 마이그레이션을 다시 실행하거나 Codex 앱 서버 Plugin 상태를 확인하세요.

**`app_inventory_missing` 또는 `app_inventory_stale`:** 앱 준비 상태가 비어 있거나 오래된 캐시에서 왔습니다. OpenClaw는 비동기 새로 고침을 예약하고 소유권과 준비 상태가 알려질 때까지 Plugin 앱을 제외합니다.

**`app_ownership_ambiguous`:** 앱 인벤토리가 표시 이름으로만 일치했으므로 해당 앱은 Codex 스레드에 노출되지 않습니다.

**구성이 변경되었지만 에이전트가 Plugin을 볼 수 없음:** 구성된 상태를 확인하려면 `/codex plugins
list`를 사용한 다음 `/new` 또는 `/reset`을 사용하세요. 기존
Codex 스레드 바인딩은 OpenClaw가 새 하네스 세션을 설정하거나 오래된 바인딩을 교체할 때까지
시작 당시의 앱 구성을 유지합니다.

**파괴적 작업이 거부됨:** 전역 및 Plugin별
`allow_destructive_actions` 값을 확인하세요. 정책이 true, `"auto"` 또는
`"ask"`인 경우에도 안전하지 않은 유도 스키마와 모호한 Plugin 식별은 여전히
안전하게 실패합니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [구성 참조](/ko/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI 마이그레이션](/ko/cli/migrate)
