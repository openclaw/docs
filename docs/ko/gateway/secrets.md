---
read_when:
    - 제공자 자격 증명 및 `auth-profiles.json` 참조를 위한 SecretRef 구성하기
    - 프로덕션에서 보안 비밀을 안전하게 다시 로드하고, 감사하고, 구성하고, 적용하기
    - 시작 시 빠른 실패, 비활성 표면 필터링 및 마지막 정상 상태 동작 이해하기
sidebarTitle: Secrets management
summary: '비밀 관리: SecretRef 계약, 런타임 스냅샷 동작 및 안전한 단방향 제거'
title: 비밀 정보 관리
x-i18n:
    generated_at: "2026-07-12T15:18:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw는 지원되는 자격 증명을 구성에 일반 텍스트로 저장하지 않아도 되도록 추가 방식의 SecretRef를 지원합니다.

<Note>
일반 텍스트도 계속 사용할 수 있습니다. SecretRef는 자격 증명별로 선택적으로 사용합니다.
</Note>

<Warning>
일반 텍스트 자격 증명이 `openclaw.json`, `auth-profiles.json`, `.env` 또는 생성된 `agents/*/agent/models.json` 파일 등 에이전트가 검사할 수 있는 파일에 있으면 에이전트가 계속 읽을 수 있습니다. 지원되는 모든 자격 증명을 마이그레이션하고 `openclaw secrets audit --check`에서 일반 텍스트 잔여물이 없다고 보고한 후에야 SecretRef가 이러한 로컬 피해 범위를 줄입니다.
</Warning>

## 런타임 모델

- 비밀은 요청 경로에서 지연 방식으로 확인되지 않고, 활성화 중 즉시 메모리 내 런타임 스냅샷으로 확인됩니다.
- 실질적으로 활성 상태인 SecretRef를 확인할 수 없으면 시작이 즉시 실패합니다.
- 다시 로드는 원자적 교체 방식입니다. 완전히 성공하거나 마지막으로 정상 작동한 스냅샷을 유지합니다.
- 정책 위반(예: OAuth 모드 인증 프로필과 SecretRef 입력의 조합)이 있으면 런타임 교체 전에 활성화가 실패합니다.
- 런타임 요청은 활성화된 메모리 내 스냅샷만 읽습니다. 모델 제공자 SecretRef 자격 증명은 외부로 전송될 때까지 프로세스 로컬 센티널로 인증 저장소와 스트림 옵션을 통과합니다. 발신 전송 경로(Discord 답글/스레드 전송, Telegram 작업 전송)도 이 스냅샷을 읽으며 전송할 때마다 참조를 다시 확인하지 않습니다.

이렇게 하면 비밀 제공자의 장애가 빈번한 요청 경로에 영향을 주지 않습니다.

## 외부 전송 시점 주입(센티널)

SecretRef가 지원하는 모델 제공자 자격 증명의 경우 OpenClaw는 모델 인증 확인 중에 불투명한 프로세스 로컬 센티널을 생성합니다. 따라서 인증 저장소, 스트림 옵션, SDK 구성, 로그, 오류 객체 및 대부분의 런타임 내부 검사에는 제공자 자격 증명 대신 `oc-sent-v1-...` 같은 값이 표시됩니다. 보호된 모델 fetch와 관리형 로컬 제공자 상태 프로브는 각 요청이 프로세스를 벗어나기 직전에 URL 및 헤더 값에서 알려진 센티널을 교체합니다.

알 수 없는 센티널 형태의 값은 네트워크 작업 전에 차단 방식으로 실패합니다. OpenClaw는 확인되지 않은 센티널을 제공자에게 전달하지 않고 요청 전송을 거부합니다. 확인된 비밀 값은 심층 방어 조치로서 정확한 값 기반 로그 가림 처리 대상으로도 등록됩니다.

제공자 어댑터는 SDK가 지원하는 가장 마지막 주입 지점을 사용합니다.

- 사용자 지정 fetch 옵션을 제공하는 SDK에는 OpenClaw의 보호된 fetch가 전달되므로 SDK에는 센티널이 유지됩니다.
- 사용자 지정 fetch 옵션이 없는 SDK는 클라이언트를 생성하기 직전에 센티널을 해제합니다. Plugin 소유 제공자 스트림과 에이전트 하네스는 이러한 전송 계층이 OpenClaw의 보호된 fetch를 공유하지 않으므로 코어가 소유하는 최종 인계 지점에서 센티널을 해제합니다.

센티널은 모델 호출 체인 전반의 일반 텍스트 노출을 줄이지만 프로세스 격리를 제공하지는 않습니다. 실제 값은 동일한 프로세스의 메모리에 계속 존재하며 최종 어댑터 경계에 나타납니다. SecretRef를 통해 구성되지 않은 일반 환경 자격 증명은 일반 텍스트로 유지되며 이 메커니즘의 적용 대상이 아닙니다.

인시던트 대응 또는 호환성 문제 해결 중에 센티널 생성을 비활성화하려면 `OPENCLAW_SECRET_SENTINELS=off`를 설정합니다(`0` 또는 `false`도 대소문자 구분 없이 허용). 이 긴급 중지 스위치는 정확한 값 기반 가림 처리 등록을 비활성화하지 않습니다.

## 에이전트 접근 경계

SecretRef는 자격 증명이 구성과 생성된 모델 파일에 영구 저장되는 것을 방지하지만 프로세스 격리 경계는 아닙니다. 에이전트가 읽을 수 있는 디스크 경로에 남아 있는 일반 텍스트 자격 증명은 API 수준 가림 처리를 우회하여 파일 또는 셸 도구로 계속 읽을 수 있습니다.

에이전트가 접근할 수 있는 파일이 범위에 포함되는 프로덕션 배포에서는 다음 조건을 모두 충족할 때만 마이그레이션이 완료된 것으로 간주하십시오.

- 지원되는 자격 증명에서 일반 텍스트 값 대신 SecretRef를 사용합니다.
- `openclaw.json`, `auth-profiles.json`, `.env` 및 생성된 `models.json` 파일에서 기존 일반 텍스트 잔여물을 제거합니다.
- 마이그레이션 후 `openclaw secrets audit --check` 결과에 문제가 없습니다.
- 지원되지 않거나 순환 교체되는 나머지 자격 증명은 OS 격리, 컨테이너 격리 또는 외부 자격 증명 프록시로 보호합니다.

따라서 감사/구성/적용 워크플로는 단순한 편의 도우미가 아니라 보안 마이그레이션 게이트입니다.

<Warning>
SecretRef가 임의의 읽기 가능한 파일을 안전하게 만들지는 않습니다. 백업, 복사된 구성, 이전에 생성된 모델 카탈로그 및 지원되지 않는 자격 증명 클래스는 삭제하거나 에이전트 신뢰 경계 밖으로 이동하거나 별도로 격리할 때까지 프로덕션 비밀로 유지됩니다.
</Warning>

## 활성 표면 필터링

SecretRef는 실질적으로 활성 상태인 표면에서만 검증됩니다.

- **활성화된 표면**: 확인되지 않은 참조가 있으면 시작/다시 로드가 차단됩니다.
- **비활성 표면**: 확인되지 않은 참조가 있어도 시작/다시 로드가 차단되지 않으며 치명적이지 않은 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 진단을 내보냅니다.

<Accordion title="비활성 표면의 예">
- 비활성화된 채널/계정 항목.
- 활성화된 계정이 상속하지 않는 최상위 채널 자격 증명.
- 비활성화된 도구/기능 표면.
- `tools.web.search.provider`에서 선택하지 않은 웹 검색 제공자별 키. 자동 모드(제공자 미설정)에서는 하나가 확인될 때까지 우선순위에 따라 자동 감지를 위해 키를 조회하며, 선택 후에는 선택되지 않은 제공자의 키가 비활성 상태가 됩니다.
- 샌드박스 SSH 인증 자료(`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` 및 에이전트별 재정의)는 기본 에이전트 또는 활성화된 에이전트에 대해 실질적인 샌드박스 백엔드가 `ssh`이고 샌드박스 모드가 `off`가 아닐 때만 활성 상태입니다.
- `gateway.remote.token` / `gateway.remote.password` SecretRef는 다음 중 하나라도 충족되면 활성 상태입니다.
  - `gateway.mode=remote`
  - `gateway.remote.url`이 구성됨
  - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
  - 이러한 원격 표면이 없는 로컬 모드에서는 토큰 인증이 우선할 수 있고 환경/인증 토큰이 구성되지 않은 경우 `gateway.remote.token`이 활성 상태이며, 비밀번호 인증이 우선할 수 있고 환경/인증 비밀번호가 구성되지 않은 경우에만 `gateway.remote.password`가 활성 상태입니다.
- `OPENCLAW_GATEWAY_TOKEN`이 설정되어 있으면 환경 토큰 입력이 해당 런타임에서 우선하므로 시작 인증 확인 시 `gateway.auth.token` SecretRef는 비활성 상태입니다.

</Accordion>

## Gateway 인증 표면 진단

`gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` 또는 `gateway.remote.password`에 SecretRef가 설정되어 있으면 Gateway 시작/다시 로드 시 `SECRETS_GATEWAY_AUTH_SURFACE` 코드로 표면 상태를 기록합니다.

- `active`: SecretRef가 실질적인 인증 표면의 일부이며 반드시 확인되어야 합니다.
- `inactive`: 다른 인증 표면이 우선하거나 원격 인증이 비활성화되었거나 활성 상태가 아닙니다.

로그 항목에는 활성 표면 정책에서 사용한 이유가 포함됩니다.

## 온보딩 참조 사전 검사

대화형 온보딩에서 SecretRef 저장을 선택하면 저장하기 전에 사전 검증을 실행합니다.

- 환경 참조: 환경 변수 이름을 검증하고 설정 중에 비어 있지 않은 값이 표시되는지 확인합니다.
- 제공자 참조(`file` 또는 `exec`): 제공자 선택을 검증하고 `id`를 확인한 후 확인된 값의 유형을 검사합니다.
- 빠른 시작 흐름: `gateway.auth.token`이 이미 SecretRef인 경우 온보딩은 동일한 즉시 실패 게이트를 사용하여 프로브/대시보드 부트스트랩 전에 이를 확인합니다(`env`, `file`, `exec` 참조 대상).

검증에 실패하면 오류를 표시하고 다시 시도할 수 있습니다.

## SecretRef 계약

모든 위치에서 하나의 객체 형태를 사용합니다.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput 필드에서는 단축 문자열도 허용됩니다.

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
    - `id`는 절대 JSON 포인터(`/...`)이거나 `singleValue` 제공자의 경우 리터럴 `value`여야 합니다.
    - 세그먼트의 RFC 6901 이스케이프: `~`는 `~0`이 되고 `/`는 `~1`이 됩니다.

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    검증:

    - `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
    - `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`와 일치해야 합니다(`secret#json_key` 같은 선택자 지원).
    - `id`에는 슬래시로 구분된 경로 세그먼트로 `.` 또는 `..`가 포함되어서는 안 됩니다(예: `a/../b`는 거부됨).

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

<Accordion title="환경 제공자">
- `allowlist`를 통한 선택적 정확한 이름 허용 목록.
- 환경 값이 없거나 비어 있으면 확인에 실패합니다.

</Accordion>

<Accordion title="파일 제공자">
- `path`의 로컬 파일을 읽습니다.
- `mode: "json"`(기본값)은 JSON 객체 페이로드를 예상하고 `id`를 JSON 포인터로 확인합니다.
- `mode: "singleValue"`는 참조 ID `"value"`를 예상하고 원시 파일 내용(후행 줄 바꿈 제거)을 반환합니다.
- 경로는 소유권/권한 검사를 통과해야 하며 `timeoutMs`(기본값 5000)와 `maxBytes`(기본값 1 MiB)가 읽기 범위를 제한합니다.
- Windows 차단 방식 실패: 경로에 대해 ACL 검증을 사용할 수 없으면 확인에 실패합니다. 신뢰할 수 있는 경로에만 해당 검사를 우회하도록 제공자에서 `allowInsecurePath: true`를 설정하십시오.

</Accordion>

<Accordion title="실행 제공자">
- 구성된 절대 바이너리 경로를 셸 없이 직접 실행합니다.
- 기본적으로 `command`는 심볼릭 링크가 아닌 일반 파일이어야 합니다. 심볼릭 링크 명령 경로(예: Homebrew 심)를 허용하려면 `allowSymlinkCommand: true`를 설정하고, 패키지 관리자 경로만 조건을 충족하도록 `trustedDirs`(예: `["/opt/homebrew"]`)와 함께 사용하십시오.
- `timeoutMs`(기본값 5000), `noOutputTimeoutMs`(기본값은 `timeoutMs`와 같음), `maxOutputBytes`(기본값 1 MiB), `env`/`passEnv` 허용 목록 및 `trustedDirs`를 지원합니다.
- `jsonOnly`의 기본값은 `true`입니다. `jsonOnly: false`이고 요청된 ID가 하나이면 JSON이 아닌 일반 stdout이 해당 ID의 값으로 허용됩니다.
- Windows 차단 방식 실패: 명령 경로에 대해 ACL 검증을 사용할 수 없으면 확인에 실패합니다. 신뢰할 수 있는 경로에만 해당 검사를 우회하도록 제공자에서 `allowInsecurePath: true`를 설정하십시오.
- Plugin 관리형 실행 제공자는 복사된 `command`/`args` 대신 `pluginIntegration`을 사용할 수 있습니다. OpenClaw는 시작/다시 로드 중 설치된 Plugin 매니페스트에서 현재 명령 세부 정보를 확인합니다. Plugin이 비활성화되거나 제거되거나 신뢰할 수 없거나 더 이상 통합을 선언하지 않으면 해당 제공자의 활성 SecretRef가 차단 방식으로 실패합니다.

요청 페이로드(stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

응답 페이로드(stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

선택적인 ID별 오류:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code`는 선택적인 기계 판독 가능 진단입니다. OpenClaw는 인식된
코드 `NOT_FOUND`와 `AMBIGUOUS_DUPLICATE_KEY`를 제공자 및 참조 ID와 함께 표시합니다. 기타
코드 및 `message` 같은 자유 형식 필드는 프로토콜 v1 호환성을 위해 허용되지만
확인자 출력에 자격 증명 자료가 포함될 수 있으므로 표시되지 않습니다.

</Accordion>

## 파일 기반 API 키

구성의 `env` 블록에 `file:...` 문자열을 넣지 마십시오. 해당 블록은 리터럴이며 기존 값을 재정의하지 않으므로, 그곳에서는 `file:...`이 절대로 해석되지 않습니다.

대신 지원되는 자격 증명 필드에서 파일 SecretRef를 사용하십시오.

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

`mode: "singleValue"`의 경우 SecretRef `id`는 `"value"`입니다. `mode: "json"`의 경우 `"/providers/xai/apiKey"`와 같은 절대 JSON 포인터를 사용하십시오.

SecretRef를 허용하는 필드는 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하십시오.

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
            allowSymlinkCommand: true, // Homebrew 심볼릭 링크 바이너리에 필요
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
    SecretRef ID를 Bitwarden Secrets Manager 항목 키에 매핑하려면 리졸버 래퍼를 사용하십시오. 저장소에는 `scripts/secrets/openclaw-bws-resolver.mjs`가 포함되어 있습니다. 이를 Gateway를 실행하는 호스트의 신뢰할 수 있는 절대 경로에 설치하거나 복사하십시오.

    요구 사항:

    - Gateway 호스트에 Bitwarden Secrets Manager CLI(`bws`)가 설치되어 있어야 합니다.
    - Gateway 서비스에서 `BWS_ACCESS_TOKEN`을 사용할 수 있어야 합니다.
    - `PATH`를 리졸버에 전달하거나 `BWS_BIN`을 `bws` 바이너리의 절대 경로로 설정해야 합니다.
    - 자체 호스팅 Bitwarden 인스턴스를 사용할 때는 환경에서 `BWS_SERVER_URL`을 설정해야 합니다.

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

    리졸버는 요청된 ID를 일괄 처리하고 `bws secret list`를 실행한 다음, 일치하는 보안 비밀의 `key` 필드에 대한 값을 반환합니다. `openclaw/providers/openai/apiKey`와 같이 exec SecretRef ID 계약을 충족하는 키를 사용하십시오. 밑줄이 포함된 환경 변수 형식의 키는 리졸버가 실행되기 전에 거부됩니다. 표시 가능한 Bitwarden 보안 비밀 중 둘 이상이 요청된 키를 공유하면, 리졸버는 추측하지 않고 해당 ID를 모호한 것으로 처리하여 실패합니다. 구성을 업데이트한 후 리졸버 경로를 검증하십시오.

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
            allowSymlinkCommand: true, // Homebrew 심볼릭 링크 바이너리에 필요
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
    SecretRef ID를 `pass` 항목에 직접 매핑하려면 작은 리졸버 래퍼를 사용하십시오. 이를 exec 제공자 경로 검사를 통과하는 절대 경로(예: `/usr/local/bin/openclaw-pass-resolver`)에 실행 파일로 저장하십시오. `#!/usr/bin/env node` 셔뱅은 리졸버 프로세스의 `PATH`에서 `node`를 해석하므로 `passEnv`에 `PATH`를 포함하십시오. 해당 `PATH`에 `pass`가 없으면 상위 환경에서 `PASS_BIN`을 설정하고 `passEnv`에도 포함하십시오.

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
        process.stderr.write(`요청을 구문 분석하지 못했습니다: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass가 상태 ${result.status}(으)로 종료되었습니다`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    그런 다음 exec 제공자를 구성하고 `apiKey`가 `pass` 항목 경로를 가리키도록 설정하십시오.

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

    보안 비밀은 `pass` 항목의 첫 번째 줄에 유지하거나, 대신 전체 `pass show` 출력을 반환하도록 래퍼를 사용자 지정하십시오. 구성을 업데이트한 후 정적 감사와 exec 리졸버 경로를 모두 검증하십시오.

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
            allowSymlinkCommand: true, // Homebrew 심볼릭 링크 바이너리에 필요
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

`plugins.entries.acpx.config.mcpServers`를 통해 구성된 MCP 서버 환경 변수는 SecretInput을 허용하므로 API 키와 토큰을 일반 텍스트 구성에 포함하지 않을 수 있습니다.

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

일반 텍스트 문자열 값도 계속 작동합니다. `${MCP_SERVER_API_KEY}`와 같은 환경 템플릿 참조 및 SecretRef 객체는 MCP 서버 프로세스가 생성되기 전 Gateway 활성화 중에 해석됩니다. 다른 SecretRef 표면과 마찬가지로, 해석되지 않은 참조는 `acpx` Plugin이 실질적으로 활성 상태일 때만 활성화를 차단합니다.

## 샌드박스 SSH 인증 자료

핵심 `ssh` 샌드박스 백엔드도 SSH 인증 자료에 SecretRef를 지원합니다.

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

- OpenClaw는 각 SSH 호출에서 지연 방식으로 해석하지 않고 샌드박스 활성화 중에 이러한 참조를 해석합니다.
- 해석된 값은 제한적인 파일 권한(`0o600`)으로 임시 디렉터리에 기록되며 생성된 SSH 구성에서 사용됩니다.
- 실질적인 샌드박스 백엔드가 `ssh`가 아니거나 샌드박스 모드가 `off`이면, 이러한 참조는 비활성 상태로 유지되며 시작을 차단하지 않습니다.

## 지원되는 자격 증명 표면

표준 지원 및 미지원 자격 증명은 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)에 나열되어 있습니다.

<Note>
런타임에서 발급되거나 순환되는 자격 증명 및 OAuth 새로 고침 자료는 읽기 전용 SecretRef 해석에서 의도적으로 제외됩니다.
</Note>

## 필수 동작 및 우선순위

- 참조가 없는 필드: 변경되지 않습니다.
- 참조가 있는 필드: 활성화 중 활성 표면에서 필수입니다.
- 일반 텍스트와 참조가 모두 있으면, 지원되는 우선순위 경로에서는 참조가 우선합니다.
- 삭제 표시 센티널 `__OPENCLAW_REDACTED__`는 내부 구성 삭제 표시/복원용으로 예약되어 있으며, 제출된 리터럴 구성 데이터로 사용하면 거부됩니다.

경고 및 감사 신호:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`(런타임 경고)
- `REF_SHADOWED`(`auth-profiles.json` 자격 증명이 `openclaw.json` 참조보다 우선할 때의 감사 결과)

Google Chat 호환성: `serviceAccountRef`는 일반 텍스트 `serviceAccount`보다 우선합니다. 형제 참조가 설정되면 일반 텍스트 값은 무시됩니다.

## 활성화 트리거

Secret 활성화는 다음 경우에 실행됩니다.

- 시작(사전 검사 및 최종 활성화)
- 구성 다시 불러오기 핫 적용 경로
- 구성 다시 불러오기 재시작 검사 경로
- `secrets.reload`를 통한 수동 다시 불러오기
- Gateway 구성 쓰기 RPC 사전 검사(`config.set` / `config.apply` / `config.patch`): 편집 내용을 유지하기 전에 제출된 구성 페이로드 내 활성 표면의 SecretRef를 해석할 수 있는지 검사합니다.

활성화 계약:

- 성공하면 스냅샷을 원자적으로 교체합니다.
- 시작 실패 시 Gateway 시작을 중단합니다.
- 런타임 다시 불러오기에 실패하면 마지막으로 정상 작동한 스냅샷을 유지합니다.
- 쓰기 RPC 사전 검사에 실패하면 제출된 구성을 거부합니다. 디스크 구성과 활성 런타임 스냅샷은 모두 변경되지 않습니다.
- 아웃바운드 도우미/도구 호출에 명시적인 호출별 채널 토큰을 제공해도 SecretRef 활성화는 트리거되지 않습니다. 활성화 지점은 시작, 다시 불러오기 및 명시적 `secrets.reload`로 유지됩니다.

## 성능 저하 및 복구 신호

정상 상태 이후 다시 불러오기 중 활성화에 실패하면 OpenClaw는 성능이 저하된 보안 비밀 상태로 전환되며, 일회성 시스템 이벤트와 로그 코드를 내보냅니다.

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- 성능 저하: 런타임은 마지막으로 정상 확인된 스냅샷을 유지합니다.
- 복구: 다음 활성화가 성공한 후 한 번만 발생합니다.
- 이미 성능이 저하된 상태에서 장애가 반복되면 경고를 기록하지만 이벤트를 다시 발생시키지는 않습니다.
- 시작 시 빠른 실패가 발생하면 런타임이 활성화되지 않았으므로 성능 저하 이벤트를 발생시키지 않습니다.

## 명령 경로 확인

명령 경로는 Gateway 스냅샷 RPC를 통해 지원되는 SecretRef 확인을 사용하도록 선택할 수 있습니다. 크게 두 가지 동작이 적용됩니다.

<Tabs>
  <Tab title="엄격한 명령 경로">
    예를 들어 원격 메모리용 `openclaw memory` 경로와 원격 공유 비밀 참조가 필요할 때의 `openclaw qr --remote`가 있습니다. 활성 스냅샷에서 읽으며, 필수 SecretRef를 사용할 수 없으면 빠르게 실패합니다.
  </Tab>
  <Tab title="읽기 전용 명령 경로">
    예를 들어 `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, 읽기 전용 doctor/config 복구 흐름이 있습니다. 이 경로도 활성 스냅샷을 우선하지만, 대상 SecretRef를 사용할 수 없을 때 중단하는 대신 성능 저하 상태로 동작합니다.

    읽기 전용 동작:

    - Gateway가 실행 중이면 이러한 명령은 먼저 활성 스냅샷에서 읽습니다.
    - Gateway 확인이 불완전하거나 Gateway를 사용할 수 없으면 해당 명령 표면에 한정된 로컬 대체 경로를 시도합니다.
    - 대상 SecretRef를 여전히 사용할 수 없으면 명령은 성능이 저하된 읽기 전용 출력을 계속 제공하며, 참조가 구성되어 있지만 이 명령 경로에서는 사용할 수 없다는 명시적 진단을 표시합니다.
    - 이 성능 저하 동작은 해당 명령에만 적용되며 런타임 시작, 다시 로드, 전송/인증 경로를 약화하지 않습니다.

  </Tab>
</Tabs>

기타 참고 사항:

- 백엔드 비밀 순환 후 스냅샷 새로 고침은 `openclaw secrets reload`로 처리합니다.
- 이러한 명령 경로에서 사용하는 Gateway RPC 메서드는 `secrets.resolve`입니다.

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
  <Step title="재감사">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

재감사 결과가 깨끗해질 때까지 마이그레이션이 완료된 것으로 간주하지 마십시오. 감사에서 저장된 평문 값을 계속 보고한다면 런타임 API가 수정된 값을 반환하더라도 에이전트 접근 위험은 남아 있습니다.

`configure` 중에 적용하지 않고 계획을 저장했다면 재감사 전에 `openclaw secrets apply --from <plan-path>`를 사용하여 저장된 계획을 적용하십시오.

<AccordionGroup>
  <Accordion title="secrets audit">
    발견 항목에는 다음이 포함됩니다.

    - 저장된 평문 값(`openclaw.json`, `auth-profiles.json`, `.env`, 생성된 `agents/*/agent/models.json`).
    - 생성된 `models.json` 항목에 남은 평문 민감 공급자 헤더.
    - 확인되지 않은 참조.
    - 우선순위 가림(`auth-profiles.json`이 `openclaw.json` 참조보다 우선함).
    - 레거시 잔여물(`auth.json`, OAuth 알림).

    Exec 참고: 기본적으로 감사는 명령의 부작용을 방지하기 위해 exec SecretRef 확인 가능성 검사를 건너뜁니다. 감사 중 exec 공급자를 실행하려면 `openclaw secrets audit --allow-exec`를 사용하십시오.

    헤더 잔여물 참고: 민감한 공급자 헤더 감지는 이름 휴리스틱을 기반으로 합니다(일반적인 인증/자격 증명 헤더 이름과 `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 등의 조각).

  </Accordion>
  <Accordion title="secrets configure">
    다음 작업을 수행하는 대화형 도우미입니다.

    - 먼저 `secrets.providers`를 구성합니다(`env`/`file`/`exec`, 추가/편집/제거).
    - 하나의 에이전트 범위에 대해 `openclaw.json`과 `auth-profiles.json`에서 지원되는 비밀 포함 필드를 선택할 수 있습니다.
    - 대상 선택기에서 새 `auth-profiles.json` 매핑을 직접 생성할 수 있습니다.
    - SecretRef 세부 정보(`source`, `provider`, `id`)를 수집합니다.
    - 사전 검증 확인을 실행하고 즉시 적용할 수 있습니다.

    Exec 참고: `--allow-exec`를 설정하지 않으면 사전 검증에서 exec SecretRef 검사를 건너뜁니다. `configure --apply`에서 직접 적용하고 계획에 exec 참조/공급자가 포함되어 있다면 적용 단계에서도 `--allow-exec` 설정을 유지하십시오.

    유용한 모드:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 적용 기본값:

    - 대상 공급자의 일치하는 정적 자격 증명을 `auth-profiles.json`에서 제거합니다.
    - 레거시 정적 `api_key` 항목을 `auth.json`에서 제거합니다.
    - `<config-dir>/.env`에서 일치하는 알려진 비밀 행을 제거합니다.

  </Accordion>
  <Accordion title="secrets apply">
    저장된 계획을 적용합니다.

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 참고: `--allow-exec`를 설정하지 않으면 시험 실행에서 exec 검사를 건너뛰며, 쓰기 모드에서는 `--allow-exec`가 설정되지 않은 경우 exec SecretRef/공급자를 포함하는 계획을 거부합니다.

    엄격한 대상/경로 계약 세부 정보와 정확한 거부 규칙은 [비밀 적용 계획 계약](/ko/gateway/secrets-plan-contract)을 참조하십시오.

  </Accordion>
</AccordionGroup>

## 단방향 안전 정책

<Warning>
OpenClaw는 과거의 평문 비밀 값을 포함하는 롤백 백업을 의도적으로 작성하지 않습니다.
</Warning>

안전 모델:

- 쓰기 모드 전에 사전 검증을 통과해야 합니다.
- 커밋 전에 런타임 활성화를 검증합니다.
- 적용 시 원자적 파일 교체를 사용하여 파일을 업데이트하고 실패하면 최선의 방식으로 복원을 시도합니다.

## 레거시 인증 호환성 참고 사항

정적 자격 증명의 경우 런타임은 더 이상 평문 레거시 인증 저장소에 의존하지 않습니다.

- 런타임 자격 증명 소스는 확인된 인메모리 스냅샷입니다.
- 레거시 정적 `api_key` 항목은 발견 시 제거됩니다.
- OAuth 관련 호환성 동작은 별도로 유지됩니다.

## 웹 UI 참고

일부 SecretInput 유니온은 양식 모드보다 원시 편집기 모드에서 더 쉽게 구성할 수 있습니다.

## 관련 문서

- [인증](/ko/gateway/authentication) - 인증 설정
- [CLI: 비밀](/ko/cli/secrets) - CLI 명령
- [Vault SecretRef](/ko/plugins/vault) - HashiCorp Vault 공급자 설정
- [환경 변수](/ko/help/environment) - 환경 우선순위
- [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface) - 자격 증명 표면
- [비밀 적용 계획 계약](/ko/gateway/secrets-plan-contract) - 계획 계약 세부 정보
- [보안](/ko/gateway/security) - 보안 태세
