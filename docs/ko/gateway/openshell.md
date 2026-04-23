---
read_when:
    - 로컬 Docker 대신 클라우드 관리형 샌드박스를 사용하려고 합니다
    - OpenShell Plugin을 설정하고 있습니다
    - mirror와 remote workspace 모드 중에서 선택해야 합니다
summary: OpenClaw 에이전트용 관리형 샌드박스 백엔드로 OpenShell 사용
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T14:03:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell은 OpenClaw용 관리형 샌드박스 백엔드입니다. Docker 컨테이너를
로컬에서 실행하는 대신, OpenClaw는 샌드박스 수명 주기를 `openshell` CLI에 위임하며,
이 CLI는 SSH 기반 명령 실행이 가능한 원격 환경을 프로비저닝합니다.

OpenShell Plugin은 일반 [SSH backend](/ko/gateway/sandboxing#ssh-backend)와 동일한
core SSH 전송 및 원격 파일시스템 브리지를 재사용합니다. 여기에
OpenShell 전용 수명 주기(`sandbox create/get/delete`, `sandbox ssh-config`)와
선택적 `mirror` 워크스페이스 모드를 추가합니다.

## 사전 요구 사항

- `openshell` CLI가 설치되어 있고 `PATH`에 있어야 합니다(또는
  `plugins.entries.openshell.config.command`를 통해 사용자 지정 경로 설정)
- 샌드박스 액세스 권한이 있는 OpenShell 계정
- 호스트에서 실행 중인 OpenClaw Gateway

## 빠른 시작

1. Plugin을 활성화하고 샌드박스 백엔드를 설정합니다:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Gateway를 재시작합니다. 다음 에이전트 턴에서 OpenClaw가 OpenShell
   샌드박스를 생성하고 도구 실행을 해당 샌드박스를 통해 라우팅합니다.

3. 확인:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 워크스페이스 모드

OpenShell을 사용할 때 가장 중요한 결정입니다.

### `mirror`

**로컬 워크스페이스를 기준본으로 유지**하려면
`plugins.entries.openshell.config.mode: "mirror"`를 사용하세요.

동작:

- `exec` 전에 OpenClaw가 로컬 워크스페이스를 OpenShell 샌드박스로 동기화합니다.
- `exec` 후에 OpenClaw가 원격 워크스페이스를 다시 로컬 워크스페이스로 동기화합니다.
- 파일 도구는 여전히 샌드박스 브리지를 통해 동작하지만, 턴 사이에는 로컬 워크스페이스가
  신뢰할 수 있는 원본으로 유지됩니다.

적합한 경우:

- OpenClaw 외부에서 로컬 파일을 편집하며, 그 변경 사항이
  샌드박스에 자동으로 반영되길 원할 때
- OpenShell 샌드박스가 Docker 백엔드처럼 최대한 비슷하게 동작하길 원할 때
- 각 exec 턴 후 호스트 워크스페이스에 샌드박스 쓰기 결과가 반영되길 원할 때

트레이드오프: 각 exec 전후에 추가 동기화 비용이 발생합니다.

### `remote`

**OpenShell 워크스페이스를 기준본으로 만들고 싶다면**
`plugins.entries.openshell.config.mode: "remote"`를 사용하세요.

동작:

- 샌드박스가 처음 생성될 때 OpenClaw가 로컬 워크스페이스에서
  원격 워크스페이스로 한 번만 시드합니다.
- 그 이후에는 `exec`, `read`, `write`, `edit`, `apply_patch`가
  원격 OpenShell 워크스페이스에 직접 작동합니다.
- OpenClaw는 원격 변경 사항을 로컬 워크스페이스로 다시 동기화하지 않습니다.
- 프롬프트 시점의 미디어 읽기는 파일 및 미디어 도구가 샌드박스 브리지를 통해 읽기 때문에 계속 작동합니다.

적합한 경우:

- 샌드박스가 주로 원격 측에서 유지되어야 할 때
- 턴당 동기화 오버헤드를 낮추고 싶을 때
- 호스트 로컬 편집이 원격 샌드박스 상태를 조용히 덮어쓰는 것을 원하지 않을 때

중요: 초기 시드 이후 OpenClaw 외부에서 호스트 파일을 편집하면,
원격 샌드박스는 그 변경 사항을 보지 못합니다. 다시 시드하려면
`openclaw sandbox recreate`를 사용하세요.

### 모드 선택

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **기준 워크스페이스**    | 로컬 호스트                | 원격 OpenShell            |
| **동기화 방향**          | 양방향(각 exec마다)        | 1회 시드                  |
| **턴당 오버헤드**        | 높음(업로드 + 다운로드)    | 낮음(직접 원격 작업)      |
| **로컬 편집 반영 여부**  | 예, 다음 exec 시           | 아니요, recreate 전까지   |
| **적합한 용도**          | 개발 워크플로              | 장기 실행 에이전트, CI    |

## 구성 참조

모든 OpenShell 구성은 `plugins.entries.openshell.config` 아래에 있습니다:

| Key                       | Type                     | 기본값        | 설명                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | 워크스페이스 동기화 모드                              |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI의 경로 또는 이름                      |
| `from`                    | `string`                 | `"openclaw"`  | 최초 생성 시 샌드박스 소스                            |
| `gateway`                 | `string`                 | —             | OpenShell Gateway 이름(`--gateway`)                   |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway endpoint URL (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | 샌드박스 생성용 OpenShell 정책 ID                     |
| `providers`               | `string[]`               | `[]`          | 샌드박스 생성 시 연결할 provider 이름                 |
| `gpu`                     | `boolean`                | `false`       | GPU 리소스 요청                                       |
| `autoProviders`           | `boolean`                | `true`        | 샌드박스 생성 시 `--auto-providers` 전달              |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 샌드박스 내부의 기본 쓰기 가능 워크스페이스           |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 에이전트 워크스페이스 마운트 경로(읽기 전용 액세스용) |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 작업의 타임아웃                       |

샌드박스 수준 설정(`mode`, `scope`, `workspaceAccess`)은
다른 백엔드와 마찬가지로 `agents.defaults.sandbox` 아래에서 구성합니다.
전체 매트릭스는 [Sandboxing](/ko/gateway/sandboxing)을 참조하세요.

## 예시

### 최소 remote 설정

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### GPU가 포함된 mirror 모드

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### 사용자 지정 Gateway를 사용하는 에이전트별 OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## 수명 주기 관리

OpenShell 샌드박스는 일반 샌드박스 CLI를 통해 관리됩니다:

```bash
# 모든 샌드박스 런타임 나열(Docker + OpenShell)
openclaw sandbox list

# 유효 정책 검사
openclaw sandbox explain

# 재생성(원격 워크스페이스 삭제, 다음 사용 시 다시 시드)
openclaw sandbox recreate --all
```

`remote` 모드에서는 **recreate가 특히 중요합니다**. 이 명령은 해당 범위의
기준 원격 워크스페이스를 삭제합니다. 다음 사용 시 로컬 워크스페이스에서
새 원격 워크스페이스를 다시 시드합니다.

`mirror` 모드에서는 로컬 워크스페이스가 기준본으로 유지되므로,
recreate는 주로 원격 실행 환경을 재설정하는 역할을 합니다.

### recreate가 필요한 경우

다음 항목 중 하나를 변경한 후에는 recreate하세요:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 보안 강화

OpenShell은 워크스페이스 루트 fd를 고정하고 각 읽기 전에 샌드박스 ID를 다시 확인하므로,
심볼릭 링크 교체나 다시 마운트된 워크스페이스가 읽기를
의도한 원격 워크스페이스 밖으로 리디렉션할 수 없습니다.

## 현재 제한 사항

- 샌드박스 브라우저는 OpenShell 백엔드에서 지원되지 않습니다.
- `sandbox.docker.binds`는 OpenShell에 적용되지 않습니다.
- `sandbox.docker.*` 아래의 Docker 전용 런타임 노브는 Docker
  백엔드에만 적용됩니다.

## 동작 방식

1. OpenClaw가 `openshell sandbox create`를 호출합니다(구성에 따라
   `--from`, `--gateway`, `--policy`, `--providers`, `--gpu` 플래그 사용).
2. OpenClaw가 샌드박스의 SSH 연결 정보를 얻기 위해
   `openshell sandbox ssh-config <name>`를 호출합니다.
3. core가 SSH 구성을 임시 파일에 쓰고 일반 SSH 백엔드와 동일한
   원격 파일시스템 브리지를 사용해 SSH 세션을 엽니다.
4. `mirror` 모드에서는 exec 전에 로컬에서 원격으로 동기화하고, 실행 후 다시 동기화합니다.
5. `remote` 모드에서는 생성 시 한 번 시드한 뒤, 원격
   워크스페이스에 직접 작업합니다.

## 함께 보기

- [Sandboxing](/ko/gateway/sandboxing) -- 모드, 범위, 백엔드 비교
- [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) -- 차단된 도구 디버깅
- [Multi-Agent Sandbox and Tools](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의
- [Sandbox CLI](/ko/cli/sandbox) -- `openclaw sandbox` 명령
