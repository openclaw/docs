---
read_when:
    - 제공자 자격 증명 및 `auth-profiles.json` 참조를 위한 SecretRefs 구성하기
    - 운영 환경에서 비밀을 안전하게 다시 불러오고, 감사하고, 구성하고, 적용하기
    - 시작 시 빠른 실패, 비활성 표면 필터링, 마지막 정상 동작 상태를 이해하기
sidebarTitle: Secrets management
summary: '비밀 관리: SecretRef 계약, 런타임 스냅샷 동작, 안전한 단방향 스크러빙'
title: 비밀 정보 관리
x-i18n:
    generated_at: "2026-06-27T17:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw는 지원되는 자격 증명을 구성에 평문으로 저장하지 않아도 되도록 추가형 SecretRef를 지원합니다.

<Note>
평문도 계속 작동합니다. SecretRef는 자격 증명별로 선택적으로 사용합니다.
</Note>

<Warning>
평문 자격 증명이 에이전트가 검사할 수 있는 파일에 저장되어 있으면
`openclaw.json`, `auth-profiles.json`, `.env` 또는 생성된
`agents/*/agent/models.json` 파일을 포함해 에이전트가 읽을 수 있는 상태로 남습니다.
SecretRef는 지원되는 모든 자격 증명이 마이그레이션되고
`openclaw secrets audit --check`가 평문 시크릿 잔여물이 없다고 보고한 뒤에만
그 로컬 영향 범위를 줄입니다.
</Warning>

## 목표와 런타임 모델

시크릿은 메모리 내 런타임 스냅샷으로 해석됩니다.

- 해석은 요청 경로에서 지연 처리되지 않고 활성화 중에 즉시 수행됩니다.
- 실질적으로 활성 상태인 SecretRef를 해석할 수 없으면 시작이 빠르게 실패합니다.
- 다시 로드는 원자적 교체를 사용합니다. 전체가 성공하거나, 마지막으로 정상임이 확인된 스냅샷을 유지합니다.
- SecretRef 정책 위반(예: SecretRef 입력과 결합된 OAuth 모드 인증 프로필)은 런타임 교체 전에 활성화를 실패시킵니다.
- 런타임 요청은 활성 메모리 내 스냅샷에서만 읽습니다.
- 첫 번째 구성 활성화/로드가 성공한 뒤에는 다시 로드가 성공해 교체할 때까지 런타임 코드 경로가 해당 활성 메모리 내 스냅샷을 계속 읽습니다.
- 외부 전달 경로도 해당 활성 스냅샷에서 읽습니다(예: Discord 답장/스레드 전달 및 Telegram 작업 전송). 각 전송마다 SecretRef를 다시 해석하지 않습니다.

이렇게 하면 시크릿 제공자 장애가 주요 요청 경로에 영향을 주지 않습니다.

## 에이전트 접근 경계

SecretRef는 지원되는 구성 및 생성된 모델 표면에 자격 증명이 지속 저장되지 않도록 보호하지만,
프로세스 격리 경계는 아닙니다. 에이전트가 읽을 수 있는 경로의 디스크에 평문 자격 증명이 남아 있으면,
에이전트는 파일 또는 셸 도구로 해당 파일을 검사해 API 수준의 수정 처리를 우회할 수 있습니다.

에이전트가 접근할 수 있는 파일이 범위에 포함되는 프로덕션 배포에서는
다음이 모두 참일 때에만 SecretRef 마이그레이션이 완료된 것으로 간주하세요.

- 지원되는 자격 증명이 평문 값 대신 SecretRef를 사용합니다.
- 레거시 평문 잔여물이 `openclaw.json`, `auth-profiles.json`, `.env`,
  생성된 `models.json` 파일에서 제거되었습니다.
- 마이그레이션 후 `openclaw secrets audit --check`가 깨끗합니다.
- 남아 있는 지원되지 않는 자격 증명 또는 순환 자격 증명이 운영 체제 격리,
  컨테이너 격리 또는 외부 자격 증명 프록시로 보호됩니다.

이것이 audit/configure/apply 워크플로가 단순한 편의 헬퍼가 아니라
보안 마이그레이션 게이트인 이유입니다.

<Warning>
SecretRef는 임의의 읽을 수 있는 파일을 안전하게 만들지 않습니다. 백업, 복사된 구성,
오래된 생성 모델 카탈로그, 지원되지 않는 자격 증명 클래스는 삭제되거나 에이전트 신뢰
경계 밖으로 이동되거나 별도 격리 계층으로 보호될 때까지 프로덕션 시크릿으로 취급해야 합니다.
</Warning>

## 활성 표면 필터링

SecretRef는 실질적으로 활성 상태인 표면에서만 검증됩니다.

- 활성화된 표면: 해석되지 않은 ref는 시작/다시 로드를 차단합니다.
- 비활성 표면: 해석되지 않은 ref는 시작/다시 로드를 차단하지 않습니다.
- 비활성 ref는 코드 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`와 함께 치명적이지 않은 진단을 내보냅니다.

<AccordionGroup>
  <Accordion title="비활성 표면의 예">
    - 비활성화된 채널/계정 항목.
    - 활성화된 계정이 상속하지 않는 최상위 채널 자격 증명.
    - 비활성화된 도구/기능 표면.
    - `tools.web.search.provider`에서 선택되지 않은 웹 검색 제공자별 키. 자동 모드(제공자 미설정)에서는 하나가 해석될 때까지 제공자 자동 감지를 위해 우선순위에 따라 키를 참조합니다. 선택 후에는 선택되지 않은 제공자 키가 선택될 때까지 비활성으로 취급됩니다.
    - 샌드박스 SSH 인증 자료(`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` 및 에이전트별 재정의)는 기본 에이전트 또는 활성화된 에이전트의 유효 샌드박스 백엔드가 `ssh`일 때만 활성입니다.
    - 다음 중 하나가 참이면 `gateway.remote.token` / `gateway.remote.password` SecretRef가 활성입니다.
      - `gateway.mode=remote`
      - `gateway.remote.url`이 구성됨
      - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
      - 해당 원격 표면이 없는 로컬 모드:
        - 토큰 인증이 우선할 수 있고 env/auth 토큰이 구성되어 있지 않으면 `gateway.remote.token`이 활성입니다.
        - 비밀번호 인증이 우선할 수 있고 env/auth 비밀번호가 구성되어 있지 않을 때만 `gateway.remote.password`가 활성입니다.
    - `OPENCLAW_GATEWAY_TOKEN`이 설정된 경우, env 토큰 입력이 해당 런타임에서 우선하므로 `gateway.auth.token` SecretRef는 시작 인증 해석에서 비활성입니다.

  </Accordion>
</AccordionGroup>

## Gateway 인증 표면 진단

SecretRef가 `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` 또는 `gateway.remote.password`에 구성되면 Gateway 시작/다시 로드가 표면 상태를 명시적으로 기록합니다.

- `active`: SecretRef가 유효 인증 표면의 일부이며 반드시 해석되어야 합니다.
- `inactive`: 다른 인증 표면이 우선하거나 원격 인증이 비활성화/비활성 상태이므로 이 런타임에서 SecretRef가 무시됩니다.

이 항목은 `SECRETS_GATEWAY_AUTH_SURFACE`와 함께 기록되며 활성 표면 정책에서 사용한 이유를 포함하므로, 자격 증명이 왜 활성 또는 비활성으로 처리되었는지 확인할 수 있습니다.

## 온보딩 참조 사전 점검

온보딩이 대화형 모드로 실행되고 SecretRef 저장소를 선택하면 OpenClaw는 저장하기 전에 사전 점검 검증을 실행합니다.

- Env refs: env var 이름을 검증하고 설정 중 비어 있지 않은 값이 보이는지 확인합니다.
- 제공자 refs(`file` 또는 `exec`): 제공자 선택을 검증하고, `id`를 해석하며, 해석된 값 유형을 확인합니다.
- Quickstart 재사용 경로: `gateway.auth.token`이 이미 SecretRef인 경우 온보딩은 probe/dashboard bootstrap 전에 동일한 빠른 실패 게이트를 사용해 이를 해석합니다(`env`, `file`, `exec` refs).

검증이 실패하면 온보딩은 오류를 표시하고 다시 시도할 수 있게 합니다.

## SecretRef 계약

모든 곳에서 하나의 객체 형태를 사용하세요:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    지원되는 SecretInput 필드는 정확한 문자열 축약형도 허용합니다.

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
    - `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`와 일치해야 합니다(`secret#json_key` 같은 선택자 지원).
    - `id`에는 슬래시로 구분된 경로 세그먼트로 `.` 또는 `..`가 포함되면 안 됩니다(예: `a/../b`는 거부됨).

  </Tab>
</Tabs>

## 제공자 구성

`secrets.providers` 아래에 제공자를 정의합니다.

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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
  <Accordion title="Env 제공자">
    - `allowlist`를 통한 선택적 허용 목록.
    - 누락되었거나 비어 있는 env 값은 해석에 실패합니다.

  </Accordion>
  <Accordion title="File 제공자">
    - `path`에서 로컬 파일을 읽습니다.
    - `mode: "json"`은 JSON 객체 페이로드를 예상하며 `id`를 포인터로 해석합니다.
    - `mode: "singleValue"`는 ref id `"value"`를 예상하며 파일 내용을 반환합니다.
    - 경로는 소유권/권한 검사를 통과해야 합니다.
    - Windows 빠른 차단 참고: 경로에 대한 ACL 검증을 사용할 수 없으면 해석이 실패합니다. 신뢰할 수 있는 경로에 한해 해당 제공자에 `allowInsecurePath: true`를 설정해 경로 보안 검사를 우회하세요.

  </Accordion>
  <Accordion title="Exec 제공자">
    - 구성된 절대 바이너리 경로를 실행하며, 셸은 사용하지 않습니다.
    - 기본적으로 `command`는 일반 파일(심볼릭 링크 아님)을 가리켜야 합니다.
    - 심볼릭 링크 명령 경로(예: Homebrew shim)를 허용하려면 `allowSymlinkCommand: true`를 설정하세요. OpenClaw는 해석된 대상 경로를 검증합니다.
    - 패키지 관리자 경로(예: `["/opt/homebrew"]`)에는 `allowSymlinkCommand`를 `trustedDirs`와 함께 사용하세요.
    - timeout, no-output timeout, 출력 바이트 제한, env 허용 목록, 신뢰할 수 있는 디렉터리를 지원합니다.
    - Windows 빠른 차단 참고: 명령 경로에 대한 ACL 검증을 사용할 수 없으면 해석이 실패합니다. 신뢰할 수 있는 경로에 한해 해당 제공자에 `allowInsecurePath: true`를 설정해 경로 보안 검사를 우회하세요.
    - Plugin 관리 exec 제공자는 복사된 `command`/`args` 대신
      `pluginIntegration`을 사용할 수 있습니다. OpenClaw는 시작/다시 로드 중
      설치된 Plugin manifest에서 현재 명령 세부 정보를 해석합니다. Plugin이
      비활성화, 제거, 신뢰할 수 없음 상태이거나 더 이상 해당 통합을 선언하지 않으면
      그 제공자를 사용하는 활성 SecretRef는 닫힌 상태로 실패합니다.

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

## 파일 기반 API 키

구성 `env` 블록에 `file:...` 문자열을 넣지 마세요. `env` 블록은
리터럴이며 재정의하지 않으므로 `file:...`은 해석되지 않습니다.

대신 지원되는 자격 증명 필드에 file SecretRef를 사용하세요.

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

`mode: "singleValue"`의 경우 SecretRef `id`는 `"value"`입니다. 
`mode: "json"`의 경우 `"/providers/xai/apiKey"` 같은 절대 JSON 포인터를 사용하세요.

SecretRef를 허용하는 구성 필드는 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하세요.

## Exec 통합 예제

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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    SecretRef ID를 Bitwarden Secrets Manager 항목 키에 매핑하려면 확인자 래퍼를 사용하세요. 저장소에는
    `scripts/secrets/openclaw-bws-resolver.mjs`가 포함되어 있습니다. Gateway를 실행하는 호스트의 절대
    신뢰 경로에 설치하거나 복사하세요.

    요구 사항:

    - Gateway 호스트에 Bitwarden Secrets Manager CLI(`bws`)가 설치되어 있어야 합니다.
    - Gateway 서비스에서 `BWS_ACCESS_TOKEN`을 사용할 수 있어야 합니다.
    - 확인자에 `PATH`를 전달하거나, `BWS_BIN`을 절대 `bws`
      바이너리 경로로 설정해야 합니다.
    - 자체 호스팅 Bitwarden 인스턴스를 사용할 때는 환경에 `BWS_SERVER_URL`을 설정해야 합니다.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    확인자는 요청된 ID를 일괄 처리하고, `bws secret list`를 실행한 뒤, 일치하는 비밀 `key` 필드의
    값을 반환합니다. `openclaw/providers/openai/apiKey`처럼 exec
    SecretRef ID 계약을 만족하는 키를 사용하세요. 밑줄이 있는 env-var
    스타일 키는 확인자가 실행되기 전에 거부됩니다. 표시 가능한 Bitwarden 비밀이 같은 요청 키를 둘 이상
    가지고 있으면, 확인자는 하나를 선택하지 않고 해당 ID를 모호한 것으로 실패 처리합니다. 구성을 업데이트한
    뒤 확인자 경로를 검증하세요.

    ```bash
    openclaw secrets audit --allow-exec
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
  <Accordion title="password-store (`pass`)">
    SecretRef ID를 `pass` 항목에 직접 매핑하려면 작은 확인자 래퍼를 사용하세요. exec-provider 경로 검사를
    통과하는 절대 경로에 실행 파일로 저장하세요. 예:
    `/usr/local/bin/openclaw-pass-resolver`. `#!/usr/bin/env node` shebang은
    확인자 프로세스 `PATH`에서 `node`를 해석하므로 `passEnv`에 `PATH`를 포함하세요. 해당 `PATH`에
    `pass`가 없으면 부모 환경에서 `PASS_BIN`을 설정하고 이것도 `passEnv`에 포함하세요.

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    그런 다음 exec 제공자를 구성하고 `apiKey`가 `pass` 항목 경로를 가리키도록 설정하세요.

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    비밀은 `pass` 항목의 첫 줄에 유지하거나, 전체 `pass show` 출력을 반환하려면 래퍼를 사용자 지정하세요.
    구성을 업데이트한 뒤 정적 감사와 exec 확인자 경로를 모두 검증하세요.

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

`plugins.entries.acpx.config.mcpServers`를 통해 구성된 MCP 서버 env var는 SecretInput을 지원합니다. 이를 통해 API 키와 토큰을 평문 구성에 넣지 않을 수 있습니다.

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

평문 문자열 값도 계속 작동합니다. `${MCP_SERVER_API_KEY}` 같은 Env 템플릿 참조와 SecretRef 객체는 MCP 서버 프로세스가 생성되기 전 Gateway 활성화 중에 해석됩니다. 다른 SecretRef 표면과 마찬가지로, 해석되지 않은 참조는 `acpx` Plugin이 실질적으로 활성 상태일 때만 활성화를 차단합니다.

## 샌드박스 SSH 인증 자료

코어 `ssh` 샌드박스 백엔드도 SSH 인증 자료에 대해 SecretRef를 지원합니다.

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

- OpenClaw는 각 SSH 호출 중에 지연 처리하지 않고, 샌드박스 활성화 중에 이 참조들을 해석합니다.
- 해석된 값은 제한적인 권한의 임시 파일에 기록되며 생성된 SSH 구성에서 사용됩니다.
- 유효한 샌드박스 백엔드가 `ssh`가 아니면 이 참조들은 비활성 상태로 유지되며 시작을 차단하지 않습니다.

## 지원되는 자격 증명 표면

표준 지원 및 미지원 자격 증명은 다음에 나열되어 있습니다.

- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)

<Note>
런타임에서 발급되거나 순환되는 자격 증명과 OAuth 갱신 자료는 읽기 전용 SecretRef 해석에서 의도적으로 제외됩니다.
</Note>

## 필수 동작 및 우선순위

- 참조가 없는 필드: 변경 없음.
- 참조가 있는 필드: 활성 표면에서 활성화 중 필수.
- 평문과 참조가 모두 있으면 지원되는 우선순위 경로에서는 참조가 우선합니다.
- 삭제 표시 센티널 `__OPENCLAW_REDACTED__`는 내부 구성 삭제 표시/복원용으로 예약되어 있으며 리터럴 제출 구성 데이터로는 거부됩니다.

경고 및 감사 신호:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`(런타임 경고)
- `REF_SHADOWED`(`auth-profiles.json` 자격 증명이 `openclaw.json` 참조보다 우선할 때 감사 결과)

Google Chat 호환성 동작:

- `serviceAccountRef`가 평문 `serviceAccount`보다 우선합니다.
- 형제 참조가 설정되어 있으면 평문 값은 무시됩니다.

## 활성화 트리거

비밀 활성화는 다음에서 실행됩니다.

- 시작(사전 점검 및 최종 활성화)
- 구성 reload hot-apply 경로
- 구성 reload restart-check 경로
- `secrets.reload`를 통한 수동 reload
- 편집을 유지하기 전에 제출된 구성 페이로드 내 활성 표면 SecretRef 해석 가능성을 확인하는 Gateway 구성 쓰기 RPC 사전 점검(`config.set` / `config.apply` / `config.patch`)

활성화 계약:

- 성공 시 스냅샷을 원자적으로 교체합니다.
- 시작 실패는 Gateway 시작을 중단합니다.
- 런타임 reload 실패는 마지막으로 정상 확인된 스냅샷을 유지합니다.
- 쓰기 RPC 사전 점검 실패는 제출된 구성을 거부하고 디스크 구성과 활성 런타임 스냅샷을 모두 변경하지 않습니다.
- 아웃바운드 헬퍼/도구 호출에 명시적인 호출별 채널 토큰을 제공해도 SecretRef 활성화는 트리거되지 않습니다. 활성화 지점은 시작, reload, 명시적 `secrets.reload`로 유지됩니다.

## 성능 저하 및 복구 신호

정상 상태 이후 reload 시점 활성화가 실패하면 OpenClaw는 성능 저하 비밀 상태로 진입합니다.

일회성 시스템 이벤트 및 로그 코드:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- 성능 저하: 런타임은 마지막으로 정상 확인된 스냅샷을 유지합니다.
- 복구됨: 다음 성공적인 활성화 이후 한 번 발생합니다.
- 이미 성능 저하 상태인 동안 반복 실패하면 경고를 기록하지만 이벤트를 과도하게 발생시키지는 않습니다.
- 시작 fail-fast는 런타임이 활성 상태가 된 적이 없으므로 성능 저하 이벤트를 발생시키지 않습니다.

## 명령 경로 해석

명령 경로는 Gateway 스냅샷 RPC를 통해 지원되는 SecretRef 해석을 선택할 수 있습니다.

두 가지 넓은 동작이 있습니다:

<Tabs>
  <Tab title="엄격한 명령 경로">
    예를 들어 원격 공유 비밀 참조가 필요할 때 `openclaw memory` 원격 메모리 경로와 `openclaw qr --remote`가 해당됩니다. 이 경로들은 활성 스냅샷에서 읽고, 필요한 SecretRef를 사용할 수 없으면 빠르게 실패합니다.
  </Tab>
  <Tab title="읽기 전용 명령 경로">
    예를 들어 `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, 그리고 읽기 전용 doctor/config 복구 흐름이 해당됩니다. 이 경로들도 활성 스냅샷을 우선 사용하지만, 해당 명령 경로에서 대상 SecretRef를 사용할 수 없을 때는 중단하지 않고 성능이 저하된 방식으로 동작합니다.

    읽기 전용 동작:

    - Gateway가 실행 중이면, 이 명령들은 먼저 활성 스냅샷에서 읽습니다.
    - Gateway 확인이 불완전하거나 Gateway를 사용할 수 없으면, 특정 명령 표면에 대해 대상 로컬 폴백을 시도합니다.
    - 대상 SecretRef를 여전히 사용할 수 없으면, 명령은 성능이 저하된 읽기 전용 출력과 "이 명령 경로에 구성되어 있지만 사용할 수 없음" 같은 명시적 진단을 포함해 계속 진행합니다.
    - 이 성능 저하 동작은 해당 명령에만 국한됩니다. 런타임 시작, 다시 로드, 전송/auth 경로를 약화하지 않습니다.

  </Tab>
</Tabs>

기타 참고 사항:

- 백엔드 비밀 회전 후 스냅샷 새로 고침은 `openclaw secrets reload`가 처리합니다.
- 이 명령 경로들이 사용하는 Gateway RPC 메서드: `secrets.resolve`.

## 감사 및 구성 워크플로

기본 운영자 흐름:

<Steps>
  <Step title="현재 상태 감사">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef 구성 및 적용">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="다시 감사">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

다시 감사가 깨끗하게 통과하기 전까지 마이그레이션이 완료된 것으로 간주하지 마세요. 감사에서
저장된 평문 값이 여전히 보고되면, 런타임 API가 수정된 값을 반환하더라도
에이전트 접근 위험은 여전히 존재합니다.

`configure` 중 적용하는 대신 계획을 저장했다면, 다시 감사하기 전에
`openclaw secrets apply --from <plan-path>`로 저장된 계획을 적용하세요.

<AccordionGroup>
  <Accordion title="secrets audit">
    발견 항목에는 다음이 포함됩니다.

    - 저장된 평문 값(`openclaw.json`, `auth-profiles.json`, `.env`, 생성된 `agents/*/agent/models.json`)
    - 생성된 `models.json` 항목의 평문 민감한 제공자 헤더 잔여물
    - 해결되지 않은 참조
    - 우선순위 섀도잉(`auth-profiles.json`이 `openclaw.json` 참조보다 우선 적용됨)
    - 레거시 잔여물(`auth.json`, OAuth 알림)

    Exec 참고:

    - 기본적으로 감사는 명령 부작용을 피하기 위해 exec SecretRef 확인 가능성 검사를 건너뜁니다.
    - 감사 중 exec 제공자를 실행하려면 `openclaw secrets audit --allow-exec`를 사용하세요.

    헤더 잔여물 참고:

    - 민감한 제공자 헤더 감지는 이름 휴리스틱 기반입니다(`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 일반적인 auth/자격 증명 헤더 이름 및 조각).

  </Accordion>
  <Accordion title="secrets configure">
    다음을 수행하는 대화형 도우미입니다.

    - 먼저 `secrets.providers`를 구성합니다(`env`/`file`/`exec`, 추가/편집/제거).
    - 하나의 에이전트 범위에 대해 `openclaw.json`과 `auth-profiles.json`의 지원되는 비밀 포함 필드를 선택할 수 있게 합니다.
    - 대상 선택기에서 새 `auth-profiles.json` 매핑을 직접 만들 수 있습니다.
    - SecretRef 세부 정보(`source`, `provider`, `id`)를 캡처합니다.
    - 사전 확인 해결을 실행합니다.
    - 즉시 적용할 수 있습니다.

    Exec 참고:

    - `--allow-exec`가 설정되지 않으면 사전 확인은 exec SecretRef 검사를 건너뜁니다.
    - `configure --apply`에서 직접 적용하고 계획에 exec refs/providers가 포함되어 있으면, 적용 단계에서도 `--allow-exec`를 설정한 상태로 유지하세요.

    유용한 모드:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 적용 기본값:

    - 대상 제공자에 대해 `auth-profiles.json`에서 일치하는 정적 자격 증명을 제거합니다.
    - `auth.json`에서 레거시 정적 `api_key` 항목을 제거합니다.
    - `<config-dir>/.env`에서 일치하는 알려진 비밀 줄을 제거합니다.

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

    - `--allow-exec`가 설정되지 않으면 dry-run은 exec 검사를 건너뜁니다.
    - 쓰기 모드는 `--allow-exec`가 설정되지 않으면 exec SecretRefs/providers가 포함된 계획을 거부합니다.

    엄격한 대상/경로 계약 세부 정보와 정확한 거부 규칙은 [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 단방향 안전 정책

<Warning>
OpenClaw는 과거 평문 비밀 값이 포함된 롤백 백업을 의도적으로 작성하지 않습니다.
</Warning>

안전 모델:

- 쓰기 모드 전에 사전 확인이 성공해야 합니다.
- 커밋 전에 런타임 활성화가 검증됩니다.
- 적용은 원자적 파일 교체와 실패 시 최선 노력 복원을 사용해 파일을 업데이트합니다.

## 레거시 auth 호환성 참고

정적 자격 증명의 경우, 런타임은 더 이상 평문 레거시 auth 저장소에 의존하지 않습니다.

- 런타임 자격 증명 소스는 해결된 인메모리 스냅샷입니다.
- 레거시 정적 `api_key` 항목은 발견되면 제거됩니다.
- OAuth 관련 호환성 동작은 별도로 유지됩니다.

## Web UI 참고

일부 SecretInput 유니언은 폼 모드보다 원시 편집기 모드에서 구성하기가 더 쉽습니다.

## 관련 항목

- [Authentication](/ko/gateway/authentication) — auth 설정
- [CLI: secrets](/ko/cli/secrets) — CLI 명령
- [Environment Variables](/ko/help/environment) — 환경 우선순위
- [SecretRef Credential Surface](/ko/reference/secretref-credential-surface) — 자격 증명 표면
- [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract) — 계획 계약 세부 정보
- [Security](/ko/gateway/security) — 보안 태세
