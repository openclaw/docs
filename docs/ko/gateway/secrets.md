---
read_when:
    - 제공자 자격 증명 및 `auth-profiles.json` 참조를 위한 SecretRefs 구성
    - 프로덕션에서 비밀 정보 다시 로드, 감사, 구성, 적용을 안전하게 운영하기
    - 시작 시 빠른 실패, 비활성 표면 필터링, 마지막 정상 상태 동작 이해하기
sidebarTitle: Secrets management
summary: '시크릿 관리: SecretRef 계약, 런타임 스냅샷 동작, 안전한 단방향 스크러빙'
title: 비밀 정보 관리
x-i18n:
    generated_at: "2026-04-30T06:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw은 지원되는 자격 증명을 구성에 일반 텍스트로 저장하지 않아도 되도록 additive SecretRefs를 지원합니다.

<Note>
일반 텍스트도 계속 작동합니다. SecretRefs는 자격 증명별로 선택적으로 사용합니다.
</Note>

## 목표와 런타임 모델

비밀 값은 메모리 내 런타임 스냅샷으로 해석됩니다.

- 해석은 요청 경로에서 지연 처리되지 않고, 활성화 중에 즉시 수행됩니다.
- 실질적으로 활성 상태인 SecretRef를 해석할 수 없으면 시작이 빠르게 실패합니다.
- 다시 로드는 원자적 교체를 사용합니다. 전체 성공이거나, 마지막으로 정상 확인된 스냅샷을 유지합니다.
- SecretRef 정책 위반(예: OAuth 모드 인증 프로필과 SecretRef 입력 결합)은 런타임 교체 전에 활성화를 실패시킵니다.
- 런타임 요청은 활성 메모리 내 스냅샷에서만 읽습니다.
- 첫 번째 구성 활성화/로드가 성공한 후에는, 성공적인 다시 로드가 스냅샷을 교체할 때까지 런타임 코드 경로가 해당 활성 메모리 내 스냅샷을 계속 읽습니다.
- 발신 전달 경로도 해당 활성 스냅샷에서 읽습니다(예: Discord 응답/스레드 전달 및 Telegram 작업 전송). 전송할 때마다 SecretRefs를 다시 해석하지 않습니다.

이렇게 하면 비밀 값 Provider 장애가 빈번한 요청 경로에 영향을 주지 않습니다.

## 활성 표면 필터링

SecretRefs는 실질적으로 활성 상태인 표면에서만 검증됩니다.

- 활성화된 표면: 해석되지 않은 참조가 시작/다시 로드를 차단합니다.
- 비활성 표면: 해석되지 않은 참조가 시작/다시 로드를 차단하지 않습니다.
- 비활성 참조는 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 코드와 함께 치명적이지 않은 진단을 내보냅니다.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - 비활성화된 채널/계정 항목.
    - 활성화된 계정이 상속하지 않는 최상위 채널 자격 증명.
    - 비활성화된 도구/기능 표면.
    - `tools.web.search.provider`로 선택되지 않은 웹 검색 Provider별 키. 자동 모드(Provider 미설정)에서는 하나가 해석될 때까지 Provider 자동 감지를 위해 우선순위에 따라 키를 참조합니다. 선택 후에는 선택되지 않은 Provider 키가 선택되기 전까지 비활성으로 처리됩니다.
    - Sandbox SSH 인증 자료(`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` 및 에이전트별 재정의)는 기본 에이전트 또는 활성화된 에이전트의 유효 Sandbox 백엔드가 `ssh`일 때만 활성 상태입니다.
    - 다음 중 하나가 참이면 `gateway.remote.token` / `gateway.remote.password` SecretRefs가 활성 상태입니다.
      - `gateway.mode=remote`
      - `gateway.remote.url`이 구성됨
      - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
      - 이러한 원격 표면이 없는 로컬 모드:
        - `gateway.remote.token`은 토큰 인증이 우선될 수 있고 env/auth 토큰이 구성되지 않았을 때 활성 상태입니다.
        - `gateway.remote.password`는 비밀번호 인증이 우선될 수 있고 env/auth 비밀번호가 구성되지 않았을 때만 활성 상태입니다.
    - `OPENCLAW_GATEWAY_TOKEN`이 설정된 경우, 해당 런타임에서는 env 토큰 입력이 우선하므로 `gateway.auth.token` SecretRef는 시작 인증 해석에서 비활성입니다.

  </Accordion>
</AccordionGroup>

## Gateway 인증 표면 진단

SecretRef가 `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` 또는 `gateway.remote.password`에 구성되면 Gateway 시작/다시 로드가 표면 상태를 명시적으로 기록합니다.

- `active`: SecretRef가 유효 인증 표면의 일부이며 해석되어야 합니다.
- `inactive`: 다른 인증 표면이 우선하거나 원격 인증이 비활성화/비활성 상태이므로 이 런타임에서 SecretRef가 무시됩니다.

이 항목은 `SECRETS_GATEWAY_AUTH_SURFACE`와 함께 기록되며 활성 표면 정책에서 사용한 이유를 포함하므로, 자격 증명이 활성 또는 비활성으로 처리된 이유를 확인할 수 있습니다.

## 온보딩 참조 사전 검사

온보딩이 대화형 모드에서 실행되고 SecretRef 저장소를 선택하면, OpenClaw은 저장하기 전에 사전 검증을 실행합니다.

- Env 참조: env var 이름을 검증하고 설정 중 비어 있지 않은 값이 보이는지 확인합니다.
- Provider 참조(`file` 또는 `exec`): Provider 선택을 검증하고, `id`를 해석하며, 해석된 값 유형을 확인합니다.
- Quickstart 재사용 경로: `gateway.auth.token`이 이미 SecretRef인 경우, 온보딩은 동일한 빠른 실패 게이트를 사용하여 probe/dashboard 부트스트랩 전에 이를 해석합니다(`env`, `file`, `exec` 참조).

검증에 실패하면 온보딩이 오류를 표시하고 다시 시도할 수 있게 합니다.

## SecretRef 계약

모든 곳에서 하나의 객체 형태를 사용합니다.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
    - `id`는 `^[A-Z][A-Z0-9_]{0,127}$`와 일치해야 합니다.

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
    - `id`는 절대 JSON 포인터(`/...`)여야 합니다.
    - 세그먼트의 RFC6901 이스케이프: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
    - `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`와 일치해야 합니다.
    - `id`는 슬래시로 구분된 경로 세그먼트로 `.` 또는 `..`를 포함하면 안 됩니다(예: `a/../b`는 거부됨).

  </Tab>
</Tabs>

## Provider 구성

`secrets.providers` 아래에 Provider를 정의합니다.

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
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
    - `allowlist`를 통한 선택적 허용 목록.
    - 누락되었거나 비어 있는 env 값은 해석을 실패시킵니다.

  </Accordion>
  <Accordion title="File provider">
    - `path`에서 로컬 파일을 읽습니다.
    - `mode: "json"`은 JSON 객체 페이로드를 예상하고 `id`를 포인터로 해석합니다.
    - `mode: "singleValue"`는 참조 id `"value"`를 예상하고 파일 내용을 반환합니다.
    - 경로는 소유권/권한 검사를 통과해야 합니다.
    - Windows 실패 폐쇄 참고: 경로에 대해 ACL 검증을 사용할 수 없으면 해석이 실패합니다. 신뢰할 수 있는 경로에 한해서만 해당 Provider에 `allowInsecurePath: true`를 설정하여 경로 보안 검사를 우회하세요.

  </Accordion>
  <Accordion title="Exec provider">
    - 구성된 절대 바이너리 경로를 셸 없이 실행합니다.
    - 기본적으로 `command`는 일반 파일(심볼릭 링크가 아님)을 가리켜야 합니다.
    - 심볼릭 링크 명령 경로(예: Homebrew shim)를 허용하려면 `allowSymlinkCommand: true`를 설정하세요. OpenClaw은 해석된 대상 경로를 검증합니다.
    - 패키지 관리자 경로(예: `["/opt/homebrew"]`)에는 `allowSymlinkCommand`를 `trustedDirs`와 함께 사용하세요.
    - 제한 시간, 출력 없음 제한 시간, 출력 바이트 제한, env 허용 목록, 신뢰할 수 있는 디렉터리를 지원합니다.
    - Windows 실패 폐쇄 참고: 명령 경로에 대해 ACL 검증을 사용할 수 없으면 해석이 실패합니다. 신뢰할 수 있는 경로에 한해서만 해당 Provider에 `allowInsecurePath: true`를 설정하여 경로 보안 검사를 우회하세요.

    요청 페이로드(stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    응답 페이로드(stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    선택적 id별 오류:

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

`plugins.entries.acpx.config.mcpServers`를 통해 구성된 MCP 서버 env vars는 SecretInput을 지원합니다. 이렇게 하면 API 키와 토큰이 일반 텍스트 구성에 들어가지 않습니다.

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

일반 텍스트 문자열 값도 계속 작동합니다. `${MCP_SERVER_API_KEY}` 같은 env-template 참조와 SecretRef 객체는 MCP 서버 프로세스가 생성되기 전에 Gateway 활성화 중 해석됩니다. 다른 SecretRef 표면과 마찬가지로, 해석되지 않은 참조는 `acpx` Plugin이 실질적으로 활성 상태일 때만 활성화를 차단합니다.

## Sandbox SSH 인증 자료

Core `ssh` Sandbox 백엔드도 SSH 인증 자료에 대해 SecretRefs를 지원합니다.

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

- OpenClaw는 각 SSH 호출 중에 지연 처리하지 않고, 샌드박스 활성화 중에 이러한 ref를 해석합니다.
- 해석된 값은 제한적인 권한이 적용된 임시 파일에 기록되며 생성된 SSH config에서 사용됩니다.
- 유효한 샌드박스 백엔드가 `ssh`가 아니면 이러한 ref는 비활성 상태로 유지되며 시작을 차단하지 않습니다.

## 지원되는 자격 증명 표면

정식 지원 및 미지원 자격 증명은 다음에 나열되어 있습니다.

- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)

<Note>
런타임에서 발급되거나 순환되는 자격 증명과 OAuth 새로 고침 자료는 읽기 전용 SecretRef 해석에서 의도적으로 제외됩니다.
</Note>

## 필수 동작 및 우선순위

- ref가 없는 필드: 변경되지 않음.
- ref가 있는 필드: 활성 표면에서는 활성화 중에 필수입니다.
- 평문과 ref가 모두 있으면 지원되는 우선순위 경로에서는 ref가 우선합니다.
- 수정 마스킹 센티널 `__OPENCLAW_REDACTED__`는 내부 config 수정 마스킹/복원용으로 예약되어 있으며, 제출된 config 데이터의 리터럴 값으로는 거부됩니다.

경고 및 감사 신호:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (런타임 경고)
- `REF_SHADOWED` (`auth-profiles.json` 자격 증명이 `openclaw.json` ref보다 우선할 때의 감사 결과)

Google Chat 호환성 동작:

- `serviceAccountRef`가 평문 `serviceAccount`보다 우선합니다.
- 형제 ref가 설정되어 있으면 평문 값은 무시됩니다.

## 활성화 트리거

시크릿 활성화는 다음에서 실행됩니다.

- 시작(사전 검사 및 최종 활성화)
- Config reload hot-apply path
- Config reload restart-check path
- `secrets.reload`를 통한 수동 reload
- 편집을 저장하기 전 제출된 config 페이로드 내 활성 표면 SecretRef 해석 가능성을 확인하는 Gateway config write RPC 사전 검사(`config.set` / `config.apply` / `config.patch`)

활성화 계약:

- 성공하면 스냅샷을 원자적으로 교체합니다.
- 시작 실패는 Gateway 시작을 중단합니다.
- 런타임 reload 실패는 마지막으로 정상 확인된 스냅샷을 유지합니다.
- Write-RPC 사전 검사 실패는 제출된 config를 거부하고 디스크 config와 활성 런타임 스냅샷을 모두 변경하지 않습니다.
- 아웃바운드 helper/tool 호출에 명시적인 호출별 채널 토큰을 제공해도 SecretRef 활성화는 트리거되지 않습니다. 활성화 지점은 시작, reload, 명시적 `secrets.reload`로 유지됩니다.

## 성능 저하 및 복구 신호

정상 상태 이후 reload 시점 활성화가 실패하면 OpenClaw는 시크릿 성능 저하 상태로 들어갑니다.

일회성 시스템 이벤트 및 로그 코드:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- 성능 저하: 런타임은 마지막으로 정상 확인된 스냅샷을 유지합니다.
- 복구됨: 다음 활성화 성공 후 한 번 방출됩니다.
- 이미 성능 저하 상태인 동안 반복되는 실패는 경고를 기록하지만 이벤트를 스팸으로 방출하지 않습니다.
- 시작 fail-fast는 런타임이 활성 상태가 된 적이 없으므로 성능 저하 이벤트를 방출하지 않습니다.

## 명령 경로 해석

명령 경로는 Gateway 스냅샷 RPC를 통해 지원되는 SecretRef 해석을 선택적으로 사용할 수 있습니다.

두 가지 넓은 동작이 있습니다.

<Tabs>
  <Tab title="엄격한 명령 경로">
    예를 들어 원격 공유 시크릿 ref가 필요할 때의 `openclaw memory` remote-memory 경로와 `openclaw qr --remote`입니다. 이들은 활성 스냅샷에서 읽고 필수 SecretRef를 사용할 수 없으면 즉시 실패합니다.
  </Tab>
  <Tab title="읽기 전용 명령 경로">
    예를 들어 `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, 읽기 전용 doctor/config repair 흐름입니다. 이들도 활성 스냅샷을 우선하지만, 해당 명령 경로에서 대상 SecretRef를 사용할 수 없을 때 중단하는 대신 성능 저하 상태로 계속 진행합니다.

    읽기 전용 동작:

    - Gateway가 실행 중이면 이러한 명령은 먼저 활성 스냅샷에서 읽습니다.
    - Gateway 해석이 불완전하거나 Gateway를 사용할 수 없으면 특정 명령 표면에 대해 대상 로컬 fallback을 시도합니다.
    - 대상 SecretRef를 여전히 사용할 수 없으면 명령은 성능 저하된 읽기 전용 출력과 "이 명령 경로에 구성되어 있지만 사용할 수 없음" 같은 명시적 진단으로 계속 진행합니다.
    - 이 성능 저하 동작은 해당 명령에만 국한됩니다. 런타임 시작, reload, send/auth 경로를 약화하지 않습니다.

  </Tab>
</Tabs>

기타 참고 사항:

- 백엔드 시크릿 순환 후 스냅샷 새로 고침은 `openclaw secrets reload`가 처리합니다.
- 이러한 명령 경로에서 사용되는 Gateway RPC 메서드: `secrets.resolve`.

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

    - 저장된 평문 값(`openclaw.json`, `auth-profiles.json`, `.env`, 생성된 `agents/*/agent/models.json`)
    - 생성된 `models.json` 항목의 평문 민감 provider header 잔여물
    - 해석되지 않은 ref
    - 우선순위 shadowing(`auth-profiles.json`이 `openclaw.json` ref보다 우선함)
    - 레거시 잔여물(`auth.json`, OAuth 알림)

    Exec 참고:

    - 기본적으로 audit은 명령 부작용을 피하기 위해 exec SecretRef 해석 가능성 검사를 건너뜁니다.
    - 감사 중 exec provider를 실행하려면 `openclaw secrets audit --allow-exec`를 사용합니다.

    Header 잔여물 참고:

    - 민감 provider header 감지는 이름 휴리스틱 기반입니다(`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 일반적인 auth/credential header 이름 및 조각).

  </Accordion>
  <Accordion title="secrets configure">
    다음을 수행하는 대화형 helper입니다.

    - 먼저 `secrets.providers`를 구성합니다(`env`/`file`/`exec`, 추가/편집/제거).
    - 하나의 agent scope에 대해 `openclaw.json` 및 `auth-profiles.json`의 지원되는 시크릿 포함 필드를 선택할 수 있게 합니다.
    - 대상 선택기에서 새 `auth-profiles.json` mapping을 직접 생성할 수 있습니다.
    - SecretRef 세부 정보(`source`, `provider`, `id`)를 캡처합니다.
    - 사전 검사 해석을 실행합니다.
    - 즉시 적용할 수 있습니다.

    Exec 참고:

    - `--allow-exec`가 설정되지 않은 경우 사전 검사는 exec SecretRef 검사를 건너뜁니다.
    - `configure --apply`에서 직접 적용하고 계획에 exec ref/provider가 포함된 경우 apply 단계에도 `--allow-exec`를 계속 설정합니다.

    유용한 모드:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` apply 기본값:

    - 대상 provider에 대해 `auth-profiles.json`에서 일치하는 static credential 정리
    - `auth.json`에서 레거시 static `api_key` 항목 정리
    - `<config-dir>/.env`에서 일치하는 알려진 시크릿 줄 정리

  </Accordion>
  <Accordion title="secrets apply">
    저장된 계획 적용:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 참고:

    - dry-run은 `--allow-exec`가 설정되지 않은 경우 exec 검사를 건너뜁니다.
    - write mode는 `--allow-exec`가 설정되지 않은 경우 exec SecretRef/provider가 포함된 계획을 거부합니다.

    엄격한 대상/경로 계약 세부 정보와 정확한 거부 규칙은 [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 단방향 안전 정책

<Warning>
OpenClaw는 과거의 평문 시크릿 값이 포함된 롤백 백업을 의도적으로 기록하지 않습니다.
</Warning>

안전 모델:

- write mode 전에 사전 검사가 성공해야 합니다.
- commit 전에 런타임 활성화가 검증됩니다.
- apply는 원자적 파일 교체와 실패 시 best-effort restore를 사용해 파일을 업데이트합니다.

## 레거시 auth 호환성 참고 사항

static credential의 경우 런타임은 더 이상 평문 레거시 auth 저장소에 의존하지 않습니다.

- 런타임 자격 증명 소스는 해석된 인메모리 스냅샷입니다.
- 레거시 static `api_key` 항목은 발견되면 정리됩니다.
- OAuth 관련 호환성 동작은 별도로 유지됩니다.

## Web UI 참고

일부 SecretInput union은 form mode보다 raw editor mode에서 구성하기가 더 쉽습니다.

## 관련 항목

- [인증](/ko/gateway/authentication) — auth 설정
- [CLI: secrets](/ko/cli/secrets) — CLI 명령
- [환경 변수](/ko/help/environment) — 환경 우선순위
- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface) — 자격 증명 표면
- [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract) — 계획 계약 세부 정보
- [보안](/ko/gateway/security) — 보안 태세
