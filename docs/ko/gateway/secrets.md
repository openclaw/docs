---
read_when:
    - provider 자격 증명 및 `auth-profiles.json` ref에 대한 SecretRef 구성하기
    - 프로덕션에서 비밀 정보 reload, audit, configure, apply를 안전하게 운영하기
    - 시작 시 fail-fast, 비활성 표면 필터링, last-known-good 동작 이해하기
sidebarTitle: Secrets management
summary: '비밀 정보 관리: SecretRef 계약, 런타임 스냅샷 동작, 안전한 단방향 스크러빙'
title: 비밀 정보 관리
x-i18n:
    generated_at: "2026-04-26T11:30:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw는 지원되는 자격 증명을 일반 텍스트로 config에 저장하지 않아도 되도록 additive SecretRef를 지원합니다.

<Note>
일반 텍스트도 계속 동작합니다. SecretRef는 자격 증명별 옵트인입니다.
</Note>

## 목표 및 런타임 모델

비밀 정보는 메모리 내 런타임 스냅샷으로 해석됩니다.

- 해석은 요청 경로에서 지연되지 않고 활성화 중 eager하게 수행됩니다.
- 실질적으로 활성인 SecretRef를 해석할 수 없으면 시작은 fail-fast로 실패합니다.
- Reload는 atomic swap을 사용합니다. 즉, 전체 성공 또는 last-known-good 스냅샷 유지입니다.
- SecretRef 정책 위반(예: OAuth 모드 auth profile과 SecretRef 입력의 결합)은 런타임 swap 전에 활성화를 실패시킵니다.
- 런타임 요청은 활성 메모리 내 스냅샷에서만 읽습니다.
- 첫 번째 config 활성화/로드가 성공한 뒤에는, 런타임 코드 경로가 성공적인 reload로 swap될 때까지 해당 활성 메모리 내 스냅샷만 계속 읽습니다.
- outbound 전달 경로도 이 활성 스냅샷에서 읽습니다(예: Discord reply/thread 전달 및 Telegram 작업 send). 각 send마다 SecretRef를 다시 해석하지 않습니다.

이렇게 하면 비밀 정보 provider 장애가 hot request path에 영향을 주지 않습니다.

## 활성 표면 필터링

SecretRef는 실질적으로 활성인 표면에서만 검증됩니다.

- 활성 표면: 해석되지 않은 ref가 시작/reload를 차단합니다.
- 비활성 표면: 해석되지 않은 ref가 시작/reload를 차단하지 않습니다.
- 비활성 ref는 코드 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`로 비치명적 진단을 발생시킵니다.

<AccordionGroup>
  <Accordion title="비활성 표면 예시">
    - 비활성화된 channel/account 항목
    - 활성화된 어떤 account도 상속하지 않는 최상위 channel 자격 증명
    - 비활성화된 tool/feature 표면
    - `tools.web.search.provider`로 선택되지 않은 Web search provider 전용 키. auto 모드(provider 미설정)에서는, 하나가 해석될 때까지 provider 자동 감지를 위한 우선순위에 따라 키를 조회합니다. 선택 후에는, 선택되지 않은 provider 키는 선택될 때까지 비활성으로 취급됩니다.
    - Sandbox SSH 인증 자료(`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` 및 에이전트별 재정의)는 기본 에이전트 또는 활성화된 에이전트의 유효 sandbox backend가 `ssh`일 때만 활성입니다.
    - `gateway.remote.token` / `gateway.remote.password` SecretRef는 다음 중 하나가 참이면 활성입니다.
      - `gateway.mode=remote`
      - `gateway.remote.url`이 구성됨
      - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
      - 위 원격 표면이 없는 local 모드에서는:
        - `gateway.remote.token`은 token auth가 우선될 수 있고 env/auth token이 구성되지 않았을 때 활성입니다.
        - `gateway.remote.password`는 password auth가 우선될 수 있고 env/auth password가 구성되지 않았을 때만 활성입니다.
    - `gateway.auth.token` SecretRef는 `OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 시작 auth 해석에서는 비활성입니다. 해당 런타임에서는 env token 입력이 우선하기 때문입니다.
  </Accordion>
</AccordionGroup>

## Gateway auth 표면 진단

`gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, `gateway.remote.password`에 SecretRef가 구성되어 있으면, gateway 시작/reload는 해당 표면 상태를 명시적으로 기록합니다.

- `active`: SecretRef가 유효 auth 표면의 일부이며 반드시 해석되어야 합니다.
- `inactive`: 다른 auth 표면이 우선하거나, 원격 auth가 비활성/비활성 상태이기 때문에 해당 런타임에서는 SecretRef가 무시됩니다.

이 항목들은 `SECRETS_GATEWAY_AUTH_SURFACE`와 함께 기록되며, 활성 표면 정책이 사용한 이유를 포함하므로 왜 자격 증명이 활성 또는 비활성으로 처리되었는지 확인할 수 있습니다.

## 온보딩 참조 사전 검사

온보딩이 대화형 모드로 실행되고 SecretRef 저장소를 선택하면, OpenClaw는 저장 전에 사전 검증을 수행합니다.

- Env ref: env var 이름을 검증하고 설정 중 비어 있지 않은 값이 보이는지 확인합니다.
- Provider ref(`file` 또는 `exec`): provider 선택을 검증하고 `id`를 해석한 뒤, 해석된 값 유형을 확인합니다.
- Quickstart 재사용 경로: `gateway.auth.token`이 이미 SecretRef인 경우, 온보딩은 probe/dashboard bootstrap 전에(`env`, `file`, `exec` ref에 대해) 동일한 fail-fast 게이트를 사용해 이를 해석합니다.

검증에 실패하면 온보딩은 오류를 표시하고 다시 시도할 수 있게 합니다.

## SecretRef 계약

어디에서나 하나의 객체 형태를 사용하세요.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다
    - `id`는 `^[A-Z][A-Z0-9_]{0,127}$`와 일치해야 합니다

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다
    - `id`는 절대 JSON 포인터(`...`)가 아니라 절대 JSON 포인터 형식(`/...`)여야 합니다
    - 세그먼트의 RFC6901 이스케이프: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다
    - `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`와 일치해야 합니다
    - `id`는 슬래시로 구분된 경로 세그먼트로 `.` 또는 `..`를 포함하면 안 됩니다(예: `a/../b`는 거부됨)

  </Tab>
</Tabs>

## Provider config

provider는 `secrets.providers` 아래에 정의합니다.

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 또는 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env provider">
    - `allowlist`를 통한 선택적 허용 목록 지원
    - 누락되었거나 비어 있는 env 값은 해석 실패 처리
  </Accordion>
  <Accordion title="File provider">
    - `path`에서 로컬 파일을 읽습니다
    - `mode: "json"`은 JSON 객체 payload를 기대하며 `id`를 pointer로 해석합니다
    - `mode: "singleValue"`는 ref id `"value"`를 기대하며 파일 내용을 반환합니다
    - 경로는 소유권/권한 검사를 통과해야 합니다
    - Windows fail-closed 참고: 경로의 ACL 검증을 사용할 수 없으면 해석이 실패합니다. 신뢰할 수 있는 경로에 대해서만, 경로 보안 검사를 우회하려면 해당 provider에 `allowInsecurePath: true`를 설정하세요.
  </Accordion>
  <Accordion title="Exec provider">
    - 구성된 절대 binary 경로를 shell 없이 실행합니다
    - 기본적으로 `command`는 일반 파일을 가리켜야 하며 symlink이면 안 됩니다
    - symlink command 경로(예: Homebrew shim)를 허용하려면 `allowSymlinkCommand: true`를 설정하세요. OpenClaw는 해석된 대상 경로를 검증합니다.
    - package-manager 경로(예: `["/opt/homebrew"]`)에는 `allowSymlinkCommand`를 `trustedDirs`와 함께 사용하세요.
    - timeout, no-output timeout, 출력 바이트 제한, env allowlist, trusted dir를 지원합니다.
    - Windows fail-closed 참고: command 경로에 대한 ACL 검증을 사용할 수 없으면 해석이 실패합니다. 신뢰할 수 있는 경로에 대해서만, 경로 보안 검사를 우회하려면 해당 provider에 `allowInsecurePath: true`를 설정하세요.

    요청 payload(stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    응답 payload(stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    선택적 ID별 오류:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Exec 통합 예시

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew symlink binary에 필요
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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // Homebrew symlink binary에 필요
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // Homebrew symlink binary에 필요
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP 서버 환경 변수

`plugins.entries.acpx.config.mcpServers`를 통해 구성된 MCP 서버 env var는 SecretInput을 지원합니다. 이를 통해 API 키와 token을 일반 텍스트 config 밖에 둘 수 있습니다.

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

일반 텍스트 문자열 값도 계속 동작합니다. `${MCP_SERVER_API_KEY}` 같은 env-template ref와 SecretRef 객체는 MCP 서버 프로세스가 시작되기 전에 gateway 활성화 중 해석됩니다. 다른 SecretRef 표면과 마찬가지로, 해석되지 않은 ref는 `acpx` Plugin이 실질적으로 활성일 때만 활성화를 차단합니다.

## Sandbox SSH 인증 자료

코어 `ssh` sandbox backend도 SSH 인증 자료에 대해 SecretRef를 지원합니다.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

런타임 동작:

- OpenClaw는 이러한 ref를 각 SSH 호출 시 지연 해석하지 않고 sandbox 활성화 중에 해석합니다.
- 해석된 값은 제한적인 권한을 가진 임시 파일에 기록되며 생성된 SSH config에서 사용됩니다.
- 유효 sandbox backend가 `ssh`가 아니면 이 ref는 비활성 상태로 유지되며 시작을 차단하지 않습니다.

## 지원되는 자격 증명 표면

정식으로 지원되거나 지원되지 않는 자격 증명 목록은 다음 문서에 있습니다.

- [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)

<Note>
런타임에서 발급되거나 순환하는 자격 증명과 OAuth refresh 자료는 읽기 전용 SecretRef 해석에서 의도적으로 제외됩니다.
</Note>

## 필수 동작 및 우선순위

- ref가 없는 필드: 변경 없음
- ref가 있는 필드: 활성 표면에서는 활성화 중 필수
- 일반 텍스트와 ref가 모두 존재하면, 지원되는 우선순위 경로에서는 ref가 우선합니다
- 마스킹 sentinel `__OPENCLAW_REDACTED__`는 내부 config 마스킹/복원용으로 예약되어 있으며, 사용자가 제출한 리터럴 config 데이터로는 거부됩니다

경고 및 감사 신호:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (런타임 경고)
- `REF_SHADOWED` (`auth-profiles.json` 자격 증명이 `openclaw.json` ref보다 우선할 때의 감사 결과)

Google Chat 호환성 동작:

- `serviceAccountRef`가 일반 텍스트 `serviceAccount`보다 우선합니다
- 형제 ref가 설정되어 있으면 일반 텍스트 값은 무시됩니다

## 활성화 트리거

비밀 정보 활성화는 다음 시점에 실행됩니다.

- 시작(사전 검사 + 최종 활성화)
- Config reload hot-apply 경로
- Config reload restart-check 경로
- `secrets.reload`를 통한 수동 reload
- Gateway config write RPC 사전 검사(`config.set` / `config.apply` / `config.patch`): 편집을 저장하기 전에 제출된 config payload 안에서 활성 표면 SecretRef 해석 가능성을 검사

활성화 계약:

- 성공하면 스냅샷을 atomic하게 swap합니다
- 시작 실패는 gateway 시작을 중단합니다
- 런타임 reload 실패 시 last-known-good 스냅샷을 유지합니다
- Write-RPC 사전 검사 실패 시 제출된 config를 거부하고 디스크 config와 활성 런타임 스냅샷을 모두 변경하지 않습니다
- outbound helper/tool 호출에 대해 호출별 명시적 channel token을 제공하더라도 SecretRef 활성화는 트리거되지 않습니다. 활성화 시점은 시작, reload, 명시적 `secrets.reload`로 유지됩니다

## 성능 저하 및 복구 신호

정상 상태 이후 reload 시점 활성화가 실패하면 OpenClaw는 degraded secrets 상태에 진입합니다.

일회성 시스템 이벤트 및 로그 코드:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- Degraded: 런타임은 last-known-good 스냅샷을 유지합니다
- Recovered: 다음 활성화 성공 후 한 번만 발생합니다
- 이미 degraded 상태에서 반복 실패가 발생하면 경고는 기록되지만 이벤트를 남발하지는 않습니다
- 시작 시 fail-fast는 런타임이 활성 상태가 된 적이 없으므로 degraded 이벤트를 발생시키지 않습니다

## 명령 경로 해석

명령 경로는 gateway snapshot RPC를 통해 지원되는 SecretRef 해석에 옵트인할 수 있습니다.

동작은 크게 두 가지로 나뉩니다.

<Tabs>
  <Tab title="엄격한 명령 경로">
    예: `openclaw memory`의 원격 메모리 경로, 원격 shared-secret ref가 필요한 `openclaw qr --remote`. 이들은 활성 스냅샷에서 읽고, 필요한 SecretRef를 사용할 수 없으면 fail-fast로 실패합니다.
  </Tab>
  <Tab title="읽기 전용 명령 경로">
    예: `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, 읽기 전용 doctor/config 복구 흐름. 이들 역시 활성 스냅샷을 우선 사용하지만, 해당 명령 경로에서 대상 SecretRef를 사용할 수 없을 때 중단 대신 저하된 방식으로 동작합니다.

    읽기 전용 동작:

    - gateway가 실행 중이면, 이 명령들은 먼저 활성 스냅샷에서 읽습니다
    - gateway 해석이 불완전하거나 gateway를 사용할 수 없으면, 해당 명령 표면에 대한 대상 지정 로컬 폴백을 시도합니다
    - 대상 SecretRef를 여전히 사용할 수 없으면, 명령은 "configured but unavailable in this command path" 같은 명시적 진단과 함께 저하된 읽기 전용 출력을 계속 제공합니다
    - 이 저하 동작은 명령 로컬 전용입니다. 런타임 시작, reload, send/auth 경로를 약화시키지 않습니다

  </Tab>
</Tabs>

기타 참고 사항:

- 백엔드 비밀 정보 순환 후 스냅샷 새로 고침은 `openclaw secrets reload`로 처리합니다
- 이러한 명령 경로가 사용하는 Gateway RPC 메서드: `secrets.resolve`

## 감사 및 구성 워크플로

기본 운영자 흐름:

<Steps>
  <Step title="현재 상태 감사">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef 구성">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="다시 감사">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    결과에는 다음이 포함됩니다.

    - 저장 상태의 일반 텍스트 값(`openclaw.json`, `auth-profiles.json`, `.env`, 생성된 `agents/*/agent/models.json`)
    - 생성된 `models.json` 항목의 일반 텍스트 민감 provider header 잔여물
    - 해석되지 않은 ref
    - 우선순위 섀도잉(`auth-profiles.json`이 `openclaw.json` ref보다 우선하는 경우)
    - 레거시 잔여물(`auth.json`, OAuth 리마인더)

    Exec 참고:

    - 기본적으로 audit는 명령 부작용을 피하기 위해 exec SecretRef 해석 가능성 검사를 건너뜁니다
    - audit 중 exec provider를 실행하려면 `openclaw secrets audit --allow-exec`를 사용하세요

    Header residue 참고:

    - 민감 provider header 감지는 이름 휴리스틱 기반입니다(일반적인 auth/자격 증명 헤더 이름 및 `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 조각)

  </Accordion>
  <Accordion title="secrets configure">
    다음을 수행하는 대화형 도우미입니다.

    - 먼저 `secrets.providers`를 구성(`env`/`file`/`exec`, 추가/편집/제거)
    - 하나의 에이전트 범위에 대해 `openclaw.json` 및 `auth-profiles.json`의 지원되는 비밀 정보 포함 필드를 선택할 수 있게 함
    - 대상 선택기에서 새 `auth-profiles.json` 매핑을 직접 생성할 수 있음
    - SecretRef 세부 정보(`source`, `provider`, `id`) 수집
    - 사전 해석 검사 실행
    - 즉시 적용 가능

    Exec 참고:

    - 사전 검사는 `--allow-exec`가 설정되지 않으면 exec SecretRef 검사를 건너뜁니다
    - `configure --apply`에서 직접 적용하고 계획에 exec ref/provider가 포함되어 있으면, 적용 단계에서도 `--allow-exec`를 유지하세요

    유용한 모드:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 적용 기본값:

    - 대상 provider에 대해 `auth-profiles.json`의 일치하는 정적 자격 증명을 스크럽
    - `auth.json`의 레거시 정적 `api_key` 항목 스크럽
    - `<config-dir>/.env`의 일치하는 알려진 비밀 줄 스크럽

  </Accordion>
  <Accordion title="secrets apply">
    저장된 계획을 적용합니다.

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 참고:

    - dry-run은 `--allow-exec`가 설정되지 않으면 exec 검사를 건너뜁니다
    - 쓰기 모드는 `--allow-exec`가 설정되지 않으면 exec SecretRef/provider가 포함된 계획을 거부합니다

    엄격한 대상/경로 계약 세부 정보와 정확한 거부 규칙은 [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 단방향 안전 정책

<Warning>
OpenClaw는 과거 일반 텍스트 비밀 값을 포함한 롤백 백업을 의도적으로 작성하지 않습니다.
</Warning>

안전 모델:

- 쓰기 모드 전에 사전 검사가 성공해야 합니다
- 커밋 전에 런타임 활성화를 검증합니다
- apply는 atomic 파일 교체와 실패 시 best-effort 복원을 사용해 파일을 업데이트합니다

## 레거시 인증 호환성 참고

정적 자격 증명의 경우, 런타임은 더 이상 일반 텍스트 레거시 인증 저장소에 의존하지 않습니다.

- 런타임 자격 증명 소스는 해석된 메모리 내 스냅샷입니다
- 레거시 정적 `api_key` 항목은 발견되면 스크럽됩니다
- OAuth 관련 호환성 동작은 별도로 유지됩니다

## Web UI 참고

일부 SecretInput union은 form 모드보다 raw editor 모드에서 더 쉽게 구성할 수 있습니다.

## 관련 항목

- [Authentication](/ko/gateway/authentication) — 인증 설정
- [CLI: secrets](/ko/cli/secrets) — CLI 명령
- [Environment Variables](/ko/help/environment) — 환경 변수 우선순위
- [SecretRef Credential Surface](/ko/reference/secretref-credential-surface) — 자격 증명 표면
- [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract) — 계획 계약 세부 정보
- [Security](/ko/gateway/security) — 보안 태세
