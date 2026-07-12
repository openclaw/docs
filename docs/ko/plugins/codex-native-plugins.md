---
read_when:
    - Codex 모드 OpenClaw 에이전트가 네이티브 Codex 플러그인을 사용하도록 설정하려는 경우
    - 소스에서 설치한 OpenAI 선별 Codex Plugin을 마이그레이션하고 있습니다
    - 기존 작업 공간 디렉터리의 Codex Plugin을 구성하고 있습니다
    - codexPlugins, 앱 인벤토리, 파괴적 작업 또는 Plugin 앱 진단 문제를 해결하고 있습니다
summary: Codex 모드 OpenClaw 에이전트용 네이티브 Codex 플러그인 구성하기
title: 네이티브 Codex 플러그인
x-i18n:
    generated_at: "2026-07-12T01:00:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

네이티브 Codex Plugin 지원을 사용하면 Codex 모드 OpenClaw 에이전트가 OpenClaw 턴을 처리하는 동일한 Codex 스레드 내에서 Codex app-server 자체의 앱 및 Plugin 기능을 사용할 수 있습니다. Plugin 호출은 네이티브 Codex 트랜스크립트에 유지되며, 앱 기반 MCP 실행은 Codex app-server가 담당합니다. OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다.

기본 [Codex 하네스](/ko/plugins/codex-harness)가 작동한 후 이 페이지를 사용하세요.

## 요구 사항

- 에이전트 런타임은 네이티브 Codex 하네스여야 합니다.
- `plugins.entries.codex.enabled`가 `true`여야 합니다.
- `plugins.entries.codex.config.codexPlugins.enabled`가 `true`여야 합니다.
- 대상 Codex app-server에서 필요한 마켓플레이스, Plugin 및 앱 인벤토리를 확인할 수 있어야 합니다.
- 마이그레이션은 소스 Codex 홈에 소스로 설치된 것으로 확인된 `openai-curated` Plugin만 지원합니다.
- 수동으로 구성한 `workspace-directory` Plugin을 사용하려면 `plugin/list`가 `marketplaceKinds`를 허용하고 경로가 없는 워크스페이스 요약에 `remotePluginId`를 포함하는 Codex app-server가 필요합니다. Plugin이 이미 설치 및 활성화되어 있어야 하며, 해당 Plugin이 소유한 앱에 `app/list`에서 접근할 수 있어야 합니다.

`codexPlugins`는 OpenClaw 제공자 실행, ACP 대화 바인딩 또는 다른 하네스에 영향을 주지 않습니다. 해당 경로에서는 네이티브 `apps` 구성으로 Codex app-server 스레드를 생성하지 않기 때문입니다.

OpenAI 측 Codex 계정, 앱 가용성 및 워크스페이스 앱/Plugin 제어는 로그인된 Codex 계정에서 가져옵니다. OpenAI 계정 및 관리자 모델에 대해서는 [ChatGPT 요금제로 Codex 사용하기](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)를 참조하세요.

## 빠른 시작

소스 Codex 홈에서 마이그레이션을 미리 확인합니다.

```bash
openclaw migrate codex --dry-run
```

마이그레이션이 소스 `app/list`를 호출하고 네이티브 활성화를 계획하기 전에 소유한 모든 앱이 존재하고 활성화되어 있으며 접근 가능한지 확인하도록 하려면 `--verify-plugin-apps`를 추가합니다.

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

계획이 적절하면 마이그레이션을 적용합니다.

```bash
openclaw migrate apply codex --yes
```

마이그레이션은 적격 Plugin에 대한 명시적 `codexPlugins` 항목을 작성하고 선택한 Plugin에 대해 Codex app-server의 `plugin/install`을 호출합니다. 마이그레이션된 구성은 다음과 같습니다.

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

마이그레이션은 계속 `openai-curated`로 제한됩니다. 기존 `workspace-directory` Plugin을 사용하려면 `plugin/list`가 반환한 정확한 마켓플레이스 한정 `summary.id`를 사용하여 수동으로 추가하세요. 예를 들어 Codex가 `example-plugin@workspace-directory`를 반환하면 표시 이름 대신 해당 전체 값을 구성합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw는 `workspace-directory` Plugin에 대해 `plugin/install`을 호출하거나 인증을 시작하지 않습니다. OpenClaw 정책을 추가하거나 활성화하기 전에 Codex에서 해당 Plugin을 설치 및 활성화하고 인증하세요. 응답에 정확한 마켓플레이스, Plugin ID, 세부 정보 ID 또는 앱 준비 상태 증거가 누락되면 OpenClaw는 앱을 숨김 상태로 유지합니다. Codex가 명시적 워크스페이스 `plugin/list` 요청을 거부하면 OpenClaw는 활성화된 각 워크스페이스 Plugin에 대해 `marketplace_missing`을 보고하고, 독립적으로 검색된 큐레이션 Plugin은 계속 사용할 수 있도록 유지합니다.

`codexPlugins`를 변경하면 새 Codex 대화에 업데이트된 앱 세트가 자동으로 적용됩니다. 현재 대화를 새로 고치려면 `/new` 또는 `/reset`을 실행하세요. Plugin 활성화/비활성화 변경에는 Gateway를 다시 시작할 필요가 없습니다.

## 채팅에서 Plugin 관리

`/codex plugins`를 사용하면 Codex 하네스를 운영하는 동일한 채팅에서 구성된 네이티브 Codex Plugin을 확인하거나 변경할 수 있습니다.

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins`는 `/codex plugins list`의 별칭입니다. 목록에는 구성된 각 Plugin의 키, 켜짐/꺼짐 상태, Codex Plugin 이름 및 `plugins.entries.codex.config.codexPlugins.plugins`에 지정된 마켓플레이스가 표시됩니다.

`enable`/`disable`은 `~/.openclaw/openclaw.json`에만 기록하며, `~/.codex/config.toml`을 편집하거나 새 Codex Plugin을 설치하지 않습니다. 소유자 또는 `operator.admin` 범위를 가진 Gateway 클라이언트만 이를 실행할 수 있습니다.

구성된 Plugin을 활성화하면 전역 `codexPlugins.enabled` 스위치도 켜집니다. 마이그레이션에서 `auth_required`가 반환되어 큐레이션 Plugin이 비활성화 상태로 기록된 경우 OpenClaw에서 활성화하기 전에 Codex에서 앱을 다시 승인하세요. `workspace-directory` 항목을 여기서 활성화하면 OpenClaw 정책만 변경됩니다. Plugin과 앱은 Codex에서 이미 활성 상태여야 합니다.

## 네이티브 Plugin 설정 작동 방식

통합은 다음 세 가지 상태를 추적합니다.

| 상태      | 의미                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 설치됨  | Codex의 대상 app-server 런타임에 Plugin 번들이 있습니다.                                                                      |
| 활성화됨    | Codex가 Plugin이 활성화되었다고 보고하며, OpenClaw 구성이 Codex 하네스 턴에서 이를 허용합니다.                                           |
| 접근 가능 | Codex app-server가 활성 계정에서 Plugin의 앱 항목을 사용할 수 있으며 구성된 Plugin ID와 매핑됨을 확인합니다. |

`openai-curated` Plugin의 경우 마이그레이션은 지속적인 설치/적격성 단계입니다.

- 계획 단계에서 OpenClaw는 소스 Codex의 `plugin/read` 세부 정보를 읽고 소스 Codex app-server 계정이 ChatGPT 구독 계정인지 확인합니다. ChatGPT 계정이 아니거나 계정 응답이 누락된 경우 앱 기반 Plugin을 `codex_subscription_required`로 건너뜁니다.
- 기본적으로 마이그레이션은 소스 `app/list` 호출을 건너뜁니다. 계정 게이트를 통과한 앱 기반 소스 Plugin은 소스 앱 접근성을 확인하지 않고 계획되며, 계정 조회 전송 실패는 `codex_account_unavailable`로 건너뜁니다.
- `--verify-plugin-apps`를 사용하면 마이그레이션이 새로운 소스 `app/list` 스냅샷을 가져오고 네이티브 활성화를 계획하기 전에 소유한 모든 앱이 존재하고 활성화되어 있으며 접근 가능한지 확인합니다. 이 경우 계정 조회 전송 실패는 즉시 건너뛰는 대신 소스 앱 인벤토리 게이트로 넘어갑니다.

`workspace-directory` Plugin의 설정은 OpenClaw 외부에서 수행됩니다. OpenClaw는 활성화된 워크스페이스 항목이 하나 이상 구성된 경우에만 해당 마켓플레이스를 조회하고, 정확한 `summary.id`로 각 Plugin을 확인하며, 기존 `plugin/read` 소유권 및 `app/list` 준비 상태 검사를 재사용합니다. 설치되지 않았거나 비활성화되었거나 접근할 수 없거나 인증되지 않은 Plugin은 앱을 노출하지 않습니다. OpenClaw는 설치 또는 인증을 시도하지 않습니다.

런타임 앱 인벤토리는 마이그레이션된 큐레이션 Plugin과 수동으로 구성된 워크스페이스 Plugin 모두에 대한 대상 세션 접근성 검사입니다. Codex 하네스 세션 설정은 활성화되고 접근 가능한 Plugin 앱으로 제한적인 스레드 앱 구성을 계산합니다. 이 구성은 매 턴마다 다시 계산되지 않으므로 `/codex plugins enable`/`disable`은 새 Codex 대화에만 영향을 줍니다. 현재 대화에 변경 사항을 적용하려면 `/new` 또는 `/reset`을 사용하세요.

## V1 지원 범위

- 소스 Codex app-server 인벤토리에 이미 설치된 `openai-curated` Plugin만 마이그레이션 대상입니다.
- 런타임은 `plugin/list`가 `marketplaceKinds`를 구현하고 경로가 없는 워크스페이스 요약에 `remotePluginId`를 반환하는 app-server 빌드에서 명시적 `workspace-directory` 항목도 지원합니다. 이러한 항목은 정확한 마켓플레이스 한정 `summary.id`를 사용해야 하며, 이미 설치 및 활성화되어 있고 앱에 접근할 수 있어야 합니다. 워크스페이스 목록 요청이 거부되면 기존 Plugin별 `marketplace_missing` 진단이 생성됩니다. 마켓플레이스, Plugin, 세부 정보 또는 앱 증거가 누락되면 워크스페이스 앱을 노출하지 않습니다. 기본 목록 요청에서 가져온 큐레이션 인벤토리는 계속 사용할 수 있습니다.
- 앱 기반 소스 Plugin은 마이그레이션 시점의 구독 게이트를 통과해야 합니다. `--verify-plugin-apps`는 소스 앱 인벤토리 게이트를 추가합니다. 구독 게이트가 적용되는 계정과, 확인 모드에서 접근할 수 없거나 비활성화되었거나 누락된 소스 앱 또는 앱 인벤토리 새로 고침 실패는 활성화된 구성 항목 대신 건너뛴 수동 항목으로 보고됩니다. 읽을 수 없는 Plugin 세부 정보는 앱 인벤토리 게이트 전에 건너뜁니다.
- 마이그레이션은 명시적 Plugin ID(`marketplaceName` 및 `pluginName`)를 작성하며, 로컬 `marketplacePath` 캐시 경로를 작성하지 않습니다.
- `codexPlugins.enabled`가 유일한 전역 활성화 스위치입니다. 임의 설치 권한을 부여하는 `plugins["*"]` 와일드카드 또는 구성 키는 없습니다.
- 큐레이션되지 않은 마켓플레이스, 캐시된 Plugin 번들, 훅 및 Codex 구성 파일은 자동으로 활성화되지 않고 수동 검토를 위해 마이그레이션 보고서에 보존됩니다. 런타임은 수동으로 구성된 `workspace-directory` 항목을 허용하지만, 다른 마켓플레이스는 계속 지원되지 않습니다.

## 앱 인벤토리 및 소유권

OpenClaw는 app-server `app/list`를 통해 Codex 앱 인벤토리를 읽고 한 시간 동안 메모리에 캐시하며, 오래되거나 누락된 항목을 비동기식으로 새로 고칩니다. 캐시는 프로세스 로컬입니다. CLI 또는 Gateway를 다시 시작하면 캐시가 삭제되며, OpenClaw는 다음 `app/list` 읽기에서 캐시를 다시 구성합니다.

마이그레이션과 런타임은 별도의 캐시 키를 사용합니다.

- 소스 마이그레이션 확인에서는 소스 Codex 홈과 시작 옵션을 사용합니다. `--verify-plugin-apps`를 지정한 경우에만 실행되며 해당 계획 실행에서 새로운 소스 `app/list` 순회를 강제합니다.
- 대상 런타임 설정에서는 스레드 앱 구성을 생성할 때 대상 에이전트의 Codex app-server ID를 사용합니다. 큐레이션 Plugin을 활성화하면 해당 대상 캐시 키를 무효화한 후 `plugin/install` 뒤에 강제로 새로 고칩니다. `workspace-directory` 설정에서는 이 활성화 경로를 실행하지 않습니다.

OpenClaw가 안정적인 소유권을 통해 구성된 Plugin에 앱을 다시 매핑할 수 있는 경우에만 Plugin 앱이 노출됩니다. 안정적인 소유권에는 Plugin 세부 정보의 정확한 앱 ID, 알려진 MCP 서버 이름 또는 고유하고 안정적인 메타데이터가 포함됩니다. 표시 이름만으로 확인되거나 소유권이 모호한 경우 다음 인벤토리 새로 고침에서 소유권이 입증될 때까지 제외됩니다.

## 연결된 계정 앱

소유자가 운영하는 에이전트는 일치하는 Plugin 패키지 없이도 Codex 계정에 이미 연결된 모든 앱을 사용하도록 선택할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true`는 새 네이티브 Codex 스레드가 생성될 때 전체 `app/list` 스냅샷을 가져오고 해당 계정에서 접근 가능한 것으로 표시된 앱만 허용합니다. 앱을 전역적으로 설치, 인증 또는 활성화하지는 않습니다. 기존 스레드는 저장된 앱 세트를 유지합니다. 새로 연결되거나 취소된 앱을 적용하려면 `/new`, `/reset`을 사용하거나 Gateway를 다시 시작하세요.

계정 앱은 전역 `codexPlugins.allow_destructive_actions` 값을 상속하며, 이 값에는 `true`, `false`, `"auto"` 또는 `"ask"`를 사용할 수 있습니다. 명시적인 Plugin별 정책은 중복되는 앱 ID에 대해 전역 정책을 재정의합니다. 인벤토리 실패 시 제한 없는 기본값으로 대체하지 않고 차단됩니다.

## 스레드 앱 구성

OpenClaw은 Codex 스레드에 제한적인 `config.apps` 패치를 주입합니다.
`_default`는 비활성화되며, 활성화되고 구성된 Plugin이 소유한 앱 또는
`allow_all_plugins`에서 허용한 접근 가능한 계정 앱만 활성화됩니다.

각 앱의 `destructive_enabled`는 유효한 전역 또는 Plugin별
`allow_destructive_actions` 정책에서 가져옵니다. `true`, `"auto"`, `"ask"`는
모두 `destructive_enabled: true`로 설정하며, `false`는 이를 `false`로 설정합니다. Codex는 계속해서
네이티브 앱 도구 주석의 파괴적 도구 메타데이터를 적용합니다.
`_default`는 `open_world_enabled: false`로 비활성화되며, 활성화된 Plugin 앱에는
`open_world_enabled: true`가 적용됩니다. OpenClaw은 별도의
Plugin 수준 오픈 월드 정책 설정을 제공하지 않으며, Plugin별
파괴적 도구 이름 거부 목록도 유지하지 않습니다.

허용된 앱의 도구 승인 모드는 기본적으로 자동이므로, 비파괴적
읽기 도구는 동일 스레드의 승인 프롬프트 없이 실행됩니다. 파괴적 도구는
각 앱의 `destructive_enabled` 정책에 따라 계속 제어됩니다.

## 파괴적 작업 정책

구성된 Codex Plugin에서는 파괴적 Plugin 요청이 기본적으로 허용되지만,
안전하지 않은 스키마와 모호한 소유권은 안전을 위해 거부됩니다.

- 전역 `allow_destructive_actions`의 기본값은 `true`입니다.
- Plugin별 `allow_destructive_actions`는 해당 Plugin에 대해
  전역 정책을 재정의합니다.
- `false`: OpenClaw은 결정론적인 거부 응답을 반환합니다.
- `true`: OpenClaw은 불리언 승인 필드처럼 승인 응답에 매핑할 수 있는
  안전한 스키마만 자동으로 수락합니다.
- `"auto"`: OpenClaw은 파괴적 Plugin 작업을 Codex에 노출한 다음,
  소유권이 입증된 MCP 승인 요청을 OpenClaw Plugin
  승인으로 변환한 후 Codex 승인 응답을 반환합니다.
- `"ask"`: OpenClaw은 `"auto"`와 동일한 Codex 쓰기/파괴 작업 제한을
  사용하고, 스레드가 시작되기 전에 해당 앱의 지속성 있는 Codex 도구별
  승인 재정의를 지우며, 일회성 승인 또는 거부만 제공하므로
  지속성 있는 승인이 이후의 쓰기 작업 프롬프트를 억제할 수 없습니다. `"ask"`를
  사용하는 허용된 각 앱에 대해 OpenClaw은 해당 앱의 Codex 사용자 승인
  검토자를 선택하므로 Codex가 승인 요청을
  OpenClaw으로 전송합니다. 다른 앱과 앱 외부의 스레드 승인은 구성된
  검토자와 정책을 그대로 유지합니다.
- Plugin 식별 정보 누락, 모호한 소유권, 누락되거나 일치하지 않는
  턴 ID 또는 안전하지 않은 요청 스키마가 있으면 프롬프트를 표시하지 않고 거부합니다.

## 문제 해결

| 코드                                              | 의미                                                                                                                              | 해결 방법                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 마이그레이션에서 Plugin을 설치했지만, 해당 앱 중 하나에 여전히 인증이 필요합니다. 재승인할 때까지 항목이 비활성화된 상태로 기록됩니다. | Codex에서 앱을 다시 승인한 다음 OpenClaw에서 Plugin을 활성화합니다.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | `--verify-plugin-apps` 사용 시 원본 Codex 앱 인벤토리에서 소유한 모든 앱이 존재하고 활성화되어 있으며 접근 가능한 것으로 표시되지 않았습니다.         | Codex에서 앱을 다시 승인하거나 활성화한 다음 `--verify-plugin-apps`를 사용하여 마이그레이션을 다시 실행합니다.                              |
| `app_inventory_unavailable`                       | 엄격한 원본 앱 검증을 요청했지만 원본 Codex 앱 인벤토리 새로 고침에 실패했습니다.                                      | 원본 Codex 앱 서버 접근 문제를 해결하거나, 더 빠른 계정 제한 계획을 수락하려면 `--verify-plugin-apps` 없이 다시 시도합니다.   |
| `codex_subscription_required`                     | 원본 Codex 앱 서버 계정이 ChatGPT 구독 계정이 아니었습니다.                                                          | 구독 인증으로 Codex 앱에 로그인한 다음 마이그레이션을 다시 실행합니다.                                                  |
| `codex_account_unavailable`                       | 원본 Codex 앱 서버 계정을 읽을 수 없습니다.                                                                               | 원본 Codex 앱 서버 인증 문제를 해결하거나, 원본 앱 인벤토리가 적격성을 판단하도록 `--verify-plugin-apps`를 사용하여 다시 실행합니다. |
| `marketplace_missing`, `plugin_missing`           | 마켓플레이스 또는 정확한 Plugin을 사용할 수 없습니다. 명시적인 워크스페이스 카탈로그 요청이 거부되었을 수 있으며, 워크스페이스 앱은 안전을 위해 거부됩니다.  | 아래에 설명된 호환 앱 서버 계약과 정확한 ID를 확인합니다.                                                |
| `plugin_detail_unavailable`                       | OpenClaw이 Plugin 소유권 세부 정보를 읽을 수 없습니다.                                                                                    | 대상 앱 서버의 `plugin/list` 및 `plugin/read` 응답을 검사합니다.                                             |
| `plugin_disabled`                                 | Codex가 Plugin이 설치되었지만 비활성화된 것으로 보고합니다.                                                                                     | 선별된 활성화 절차에서 이를 복구할 수 있습니다. 다시 시도하기 전에 Codex에서 워크스페이스 Plugin을 활성화합니다.                                  |
| `plugin_activation_failed`                        | Plugin 활성화가 완료되지 않았습니다.                                                                                                  | 첨부된 진단 정보를 사용하여 마켓플레이스, 인증, 새로 고침 또는 워크스페이스 준비 상태 실패를 구분합니다.                |
| `app_inventory_missing`, `app_inventory_stale`    | 비어 있거나 오래된 캐시에서 앱 준비 상태를 가져왔습니다.                                                                                     | OpenClaw이 비동기 새로 고침을 자동으로 예약합니다. 소유권과 준비 상태가 확인될 때까지 Plugin 앱은 제외됩니다.  |
| `app_ownership_ambiguous`                         | 앱 인벤토리가 표시 이름으로만 일치했습니다.                                                                                          | 이후 새로 고침에서 소유권이 입증될 때까지 해당 앱은 Codex 스레드에서 숨겨진 상태로 유지됩니다.                                     |

**워크스페이스 Plugin이 설치되었지만 표시되지 않는 경우:** 워크스페이스
`plugin/list` 결과가 구성된 정확한 ID를 설치 및 활성화된 상태로 보고하는지 확인한 다음,
`app/list`가 동일한 Codex 계정에서 소유한 모든 앱을 접근 가능한 것으로 보고하는지
확인합니다. 계정 인벤토리에서 현재 해당 앱이 비활성화된 것으로 보고하더라도
OpenClaw은 접근 가능한 앱을 스레드에 대해 활성화할 수 있습니다. Gateway가 앱
인벤토리를 캐시한 후 해당 상태를 변경했다면, 1시간 캐시 새로 고침을 기다리거나
Gateway를 다시 시작한 다음 `/new` 또는 `/reset`을 사용합니다. OpenClaw은
워크스페이스 Plugin을 복구하거나 인증하지 않습니다.
명시적인 워크스페이스 목록 요청이 거부되면 활성화된 각 워크스페이스
항목에서 `marketplace_missing`이 보고됩니다. 관련 없는 선별 항목은 기본 목록
응답을 통해 계속 처리됩니다.

`plugin_detail_unavailable`의 경우 경로가 없는 워크스페이스 요약에
`remotePluginId`가 포함되어야 합니다. 해당 선택자 또는 이후의
`plugin/read` 결과를 사용할 수 없으면 OpenClaw은 소유한 앱을 숨긴 상태로 유지합니다.
`plugin_activation_failed`의 경우 선별된 Plugin에서 마켓플레이스, 인증 또는
설치 후 새로 고침 실패가 보고될 수 있습니다. 워크스페이스 Plugin이
아직 활성 상태가 아니면 이 코드를 보고합니다. OpenClaw 외부에서 이를 설치하고,
활성화하고, 인증하십시오.

**구성을 변경했지만 에이전트에서 Plugin을 볼 수 없는 경우:** `/codex plugins
list`를 실행하여 구성된 상태를 확인한 다음 `/new` 또는 `/reset`을 사용합니다. 기존
Codex 스레드 바인딩은 OpenClaw이 새 하네스 세션을 설정하거나
오래된 바인딩을 교체할 때까지 시작 시점의 앱 구성을 유지합니다.

**파괴적 작업이 거부되는 경우:** 전역 및 Plugin별
`allow_destructive_actions` 값을 확인합니다. `true`, `"auto"` 또는 `"ask"`를
사용하더라도 안전하지 않은 요청 스키마와 모호한 Plugin 식별 정보는 여전히
안전을 위해 거부됩니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [구성 참조](/ko/gateway/configuration-reference#codex-harness-plugin-config)
- [마이그레이션 CLI](/ko/cli/migrate)
