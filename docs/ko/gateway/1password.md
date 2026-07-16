---
read_when:
    - openclaw.json에서 API 키를 제거하여 1Password에 보관하려고 합니다
    - Gateway를 헤드리스로 실행하며 op에 대한 서비스 계정 인증이 필요합니다.
    - 에이전트가 op CLI를 사용하여 비밀 정보를 읽거나 주입하도록 하려는 경우
summary: 1Password CLI로 Gateway 시크릿을 확인하고 에이전트가 번들로 제공되는 1password 스킬을 사용하도록 하십시오
title: 1Password
x-i18n:
    generated_at: "2026-07-16T12:31:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw은 서로 독립적인 두 가지 방식으로 **1Password**와 연동합니다.

- **구성 시크릿:** `openclaw.json`의 모든 [SecretRef](/ko/gateway/secrets) 필드는 런타임에 `op` CLI를 통해 값을 확인할 수 있으므로 API 키가 구성 파일에 저장되지 않습니다.
- **에이전트 워크플로:** 번들로 제공되는 `1password` Skills는 에이전트가 자체 작업을 위해 `op`을 사용하여 로그인하고 시크릿을 읽거나 주입하는 방법을 안내합니다.

## 요구 사항

- Gateway 호스트에 [1Password CLI](https://developer.1password.com/docs/cli/get-started/)(`op`)가 설치되어 있어야 합니다(macOS에서는 `brew install 1password-cli`).
- `op`의 인증 모드가 필요합니다.
  - **서비스 계정**(헤드리스 Gateway에 권장): Gateway 서비스 환경에서 `OP_SERVICE_ACCOUNT_TOKEN`을 내보냅니다. 데스크톱 앱이나 대화형 로그인이 필요하지 않습니다.
  - **데스크톱 앱 통합**: CLI 통합을 활성화한 1Password 앱이 동일한 시스템에서 실행됩니다. 처음 호출할 때 Touch ID 또는 시스템 인증이 실행될 수 있습니다.
  - **독립 실행형 로그인**: `op signin`에서 세션마다 입력을 요청합니다. Skills를 통해 에이전트가 사용할 수 있지만, 헤드리스 Gateway에서 구성 시크릿을 확인하는 용도에는 적합하지 않습니다.

## op로 구성 시크릿 확인

`op://vault/item/field` 참조를 사용하여 `op read`을 실행하는 exec 시크릿 공급자를 선언한 다음, SecretRef를 지원하는 필드가 해당 공급자를 가리키도록 설정합니다.

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew의 심볼릭 링크 바이너리에 필요
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

각 요소의 작동 방식은 다음과 같습니다.

- `command`은 절대 경로여야 합니다. `trustedDirs`는 해당 디렉터리를 신뢰할 수 있는 것으로 표시하며, Homebrew가 `op`을 심볼릭 링크로 설치하므로 `allowSymlinkCommand`이 필요합니다.
- `args`는 `op://vault/item/field` 참조를 그대로 전달합니다. OpenClaw 자체는 `op://` 스킴을 파싱하지 않으며, `op` 바이너리가 이를 확인합니다.
- `passEnv`는 나열된 변수를 Gateway 환경에서 전달합니다. 데스크톱 앱 통합에는 `HOME`이 필요합니다. 서비스 계정의 경우 Gateway 서비스 환경에 `OP_SERVICE_ACCOUNT_TOKEN`도 있어야 합니다(`passEnv`에 추가하거나, 토큰을 구성 파일에서 읽을 수 있어도 괜찮은 경우에만 `env`을 통해 설정하십시오).
- 단일 값 출력에는 `id: "value"`을 유지하십시오. `jsonOnly: true`와 JSON 페이로드를 사용하는 경우에는 대신 JSON 포인터 ID로 필드를 지정하십시오.
- 시크릿마다 공급자 항목을 하나씩 두면 참조를 감사하기 쉽습니다. 공급자 이름은 해당 공급자를 사용하는 항목에 따라 지정하십시오(`onepassword_openai`, `onepassword_telegram`).

값 확인 순서, 캐싱 및 실패 의미 체계는 [Gateway 시크릿](/ko/gateway/secrets)을 참조하고, SecretRef를 허용하는 모든 필드는 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하십시오.

## 헤드리스 Gateway용 서비스 계정 설정

1. 1Password 계정에서 서비스 계정을 생성하고 Gateway에 필요한 볼트 항목에만 읽기 액세스 권한을 부여하십시오.
2. `OP_SERVICE_ACCOUNT_TOKEN`을 Gateway 서비스에 제공하십시오(launchd plist, systemd 유닛 또는 컨테이너 환경).
3. `"OP_SERVICE_ACCOUNT_TOKEN"`을 공급자의 `passEnv` 목록에 추가하십시오.
4. Gateway 호스트 환경에서 확인하십시오. `op whoami`은 입력을 요청하지 않고 서비스 계정을 출력해야 합니다.

서비스 계정으로 읽으려면 `op://` 참조에 볼트 이름을 명시해야 합니다. 계정 범위를 엄격하게 제한하십시오. 이는 베어러 자격 증명입니다.

## 에이전트용 1password Skills

OpenClaw에는 에이전트를 능숙한 `op` 운영자로 만들어 주는 `1password` Skills가 번들로 제공됩니다. 이 Skills는 사용 가능한 인증 모드(서비스 계정, 데스크톱 앱 통합 또는 독립 실행형 로그인)를 감지하고, 어떤 항목도 읽기 전에 `op whoami`으로 액세스를 확인하며, 시크릿 값을 디스크에 쓰는 대신 `op run` / `op inject` 사용을 우선합니다. 이 Skills에는 `op` 바이너리가 필요하며, 바이너리가 없으면 Homebrew 설치 옵션을 제공합니다.

에이전트는 작업 도중 배포 토큰을 읽거나 명령에 환경 변수를 주입하는 등 자체 워크플로에 이 Skills를 사용합니다. 이는 구성 시크릿 확인과 독립적입니다. Gateway는 어떤 Skills도 관여하지 않고 SecretRef 값을 확인합니다.

## 보안 참고 사항

- exec 공급자를 통해 확인한 시크릿 값은 Gateway 메모리에 유지됩니다. 구성 스냅샷과 `config.get` 응답에서는 SecretRef 필드가 마스킹됩니다.
- 시크릿 값을 `openclaw.json`, 로그 또는 채팅에 절대로 넣지 마십시오. 구성에는 항목 이름을, 1Password에는 값을 보관하십시오.
- 1Password 감사 추적에는 서비스 계정의 모든 읽기 작업이 표시되므로 키 교체와 사고 검토를 실용적으로 수행할 수 있습니다.

## 문제 해결

- `command not found` 또는 생성 오류: `op`의 절대 경로를 사용하고 해당 디렉터리를 `trustedDirs`에 포함하십시오.
- `op`은 확인되지만 심볼릭 링크 오류로 읽기에 실패하는 경우: Homebrew 설치에서는 `allowSymlinkCommand: true`을 설정하십시오.
- `account is not signed in`: 서비스 계정의 경우 `OP_SERVICE_ACCOUNT_TOKEN`이 Gateway 서비스에 전달되고 `passEnv`에 나열되어 있는지 확인하십시오. 데스크톱 통합의 경우 앱이 실행 중이며 잠금 해제되어 있는지 확인하십시오.
- 첫 읽기 작업이 느린 경우: 공급자의 `timeoutMs`을 늘리십시오. 사용량이 많은 호스트에서는 `op` 콜드 스타트가 엄격한 제한 시간을 초과할 수 있습니다.
