---
read_when:
    - 로컬 Docker 대신 클라우드 관리형 샌드박스를 사용하려는 경우
    - OpenShell Plugin을 설정하고 있습니다
    - 미러 모드와 원격 작업공간 모드 중 하나를 선택해야 합니다
summary: OpenClaw 에이전트의 관리형 샌드박스 백엔드로 OpenShell 사용
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T06:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell은 OpenClaw를 위한 관리형 샌드박스 백엔드입니다. Docker
컨테이너를 로컬에서 실행하는 대신, OpenClaw는 샌드박스 수명 주기를 `openshell` CLI에 위임하며,
이 CLI는 SSH 기반 명령 실행을 사용하는 원격 환경을 프로비저닝합니다.

OpenShell Plugin은 일반 [SSH 백엔드](/ko/gateway/sandboxing#ssh-backend)와 동일한 핵심 SSH 전송 및 원격 파일 시스템
브리지를 재사용합니다. 여기에 OpenShell 전용 수명 주기(`sandbox create/get/delete`, `sandbox ssh-config`)와
선택적 `mirror` 워크스페이스 모드를 추가합니다.

## 사전 요구 사항

- `openshell` CLI가 설치되어 있고 `PATH`에 있음(또는
  `plugins.entries.openshell.config.command`를 통해 사용자 지정 경로 설정)
- 샌드박스 접근 권한이 있는 OpenShell 계정
- 호스트에서 실행 중인 OpenClaw Gateway

## 빠른 시작

1. Plugin을 활성화하고 샌드박스 백엔드를 설정합니다.

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

2. Gateway를 다시 시작합니다. 다음 에이전트 턴에서 OpenClaw가 OpenShell
   샌드박스를 만들고 도구 실행을 이를 통해 라우팅합니다.

3. 확인합니다.

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 워크스페이스 모드

OpenShell을 사용할 때 가장 중요한 결정입니다.

### `mirror`

**로컬 워크스페이스를 기준 상태로 유지**하려면 `plugins.entries.openshell.config.mode: "mirror"`를 사용합니다.

동작:

- `exec` 전에 OpenClaw가 로컬 워크스페이스를 OpenShell 샌드박스로 동기화합니다.
- `exec` 후에 OpenClaw가 원격 워크스페이스를 로컬 워크스페이스로 다시 동기화합니다.
- 파일 도구는 여전히 샌드박스 브리지를 통해 작동하지만, 턴 사이에는 로컬 워크스페이스가
  사실 공급원으로 유지됩니다.

적합한 경우:

- OpenClaw 외부에서 로컬로 파일을 편집하고, 해당 변경 사항이 샌드박스에
  자동으로 표시되기를 원하는 경우.
- OpenShell 샌드박스가 가능한 한 Docker 백엔드처럼 동작하기를 원하는 경우.
- 각 exec 턴 이후 호스트 워크스페이스가 샌드박스 쓰기 결과를 반영하기를 원하는 경우.

트레이드오프: 각 exec 전후에 추가 동기화 비용이 발생합니다.

### `remote`

**OpenShell 워크스페이스가 기준 상태가 되도록** 하려면
`plugins.entries.openshell.config.mode: "remote"`를 사용합니다.

동작:

- 샌드박스를 처음 만들 때 OpenClaw가 로컬 워크스페이스를 원격 워크스페이스에
  한 번 시드합니다.
- 그 이후에는 `exec`, `read`, `write`, `edit`, `apply_patch`가
  원격 OpenShell 워크스페이스를 직접 대상으로 작동합니다.
- OpenClaw는 원격 변경 사항을 로컬 워크스페이스로 다시 동기화하지 **않습니다**.
- 파일 및 미디어 도구가 샌드박스 브리지를 통해 읽기 때문에 프롬프트 시점의 미디어 읽기는 계속 작동합니다.

적합한 경우:

- 샌드박스가 주로 원격 측에 있어야 하는 경우.
- 턴당 동기화 오버헤드를 낮추고 싶은 경우.
- 호스트 로컬 편집이 원격 샌드박스 상태를 조용히 덮어쓰지 않기를 원하는 경우.

<Warning>
초기 시드 이후 OpenClaw 외부에서 호스트의 파일을 편집하면 원격 샌드박스는 해당 변경 사항을 **보지 못합니다**. 다시 시드하려면 `openclaw sandbox recreate`를 사용하세요.
</Warning>

### 모드 선택

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **기준 워크스페이스**    | 로컬 호스트                | 원격 OpenShell            |
| **동기화 방향**          | 양방향(각 exec)            | 1회 시드                  |
| **턴당 오버헤드**        | 더 높음(업로드 + 다운로드) | 더 낮음(직접 원격 작업)   |
| **로컬 편집 표시 여부**  | 예, 다음 exec에서          | 아니요, recreate 전까지   |
| **가장 적합한 용도**     | 개발 워크플로              | 장시간 실행 에이전트, CI  |

## 구성 참조

모든 OpenShell 구성은 `plugins.entries.openshell.config` 아래에 있습니다.

| 키                        | 유형                     | 기본값        | 설명                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` 또는 `"remote"` | `"mirror"`  | 워크스페이스 동기화 모드                             |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI의 경로 또는 이름                      |
| `from`                    | `string`                 | `"openclaw"`  | 최초 생성에 사용할 샌드박스 소스                     |
| `gateway`                 | `string`                 | —             | OpenShell Gateway 이름(`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway 엔드포인트 URL(`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | 샌드박스 생성을 위한 OpenShell 정책 ID               |
| `providers`               | `string[]`               | `[]`          | 샌드박스가 생성될 때 연결할 제공자 이름              |
| `gpu`                     | `boolean`                | `false`       | GPU 리소스 요청                                      |
| `autoProviders`           | `boolean`                | `true`        | 샌드박스 생성 중 `--auto-providers` 전달             |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 샌드박스 내부의 기본 쓰기 가능 워크스페이스          |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 에이전트 워크스페이스 마운트 경로(읽기 전용 접근용) |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 작업의 타임아웃                      |

샌드박스 수준 설정(`mode`, `scope`, `workspaceAccess`)은 다른 백엔드와 마찬가지로
`agents.defaults.sandbox` 아래에서 구성합니다. 전체 매트릭스는
[샌드박싱](/ko/gateway/sandboxing)을 참고하세요.

## 예시

### 최소 원격 설정

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

### GPU를 사용하는 미러 모드

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

OpenShell 샌드박스는 일반 샌드박스 CLI를 통해 관리됩니다.

```bash
# 모든 샌드박스 런타임 나열(Docker + OpenShell)
openclaw sandbox list

# 유효 정책 검사
openclaw sandbox explain

# 다시 생성(원격 워크스페이스를 삭제하고 다음 사용 시 다시 시드)
openclaw sandbox recreate --all
```

`remote` 모드에서는 **recreate가 특히 중요합니다**. 해당 범위의 기준
원격 워크스페이스를 삭제하기 때문입니다. 다음 사용 시 로컬 워크스페이스에서
새 원격 워크스페이스를 시드합니다.

`mirror` 모드에서는 로컬 워크스페이스가 기준 상태로 유지되므로, recreate는 주로 원격 실행 환경을 재설정합니다.

### 다시 생성해야 하는 경우

다음 중 하나를 변경한 후에는 다시 생성하세요.

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 보안 강화

OpenShell은 워크스페이스 루트 fd를 고정하고 각 읽기 전에 샌드박스 ID를 다시 확인하므로,
심볼릭 링크 교체나 다시 마운트된 워크스페이스가 읽기를 의도한 원격 워크스페이스 밖으로
리디렉션할 수 없습니다.

## 현재 제한 사항

- OpenShell 백엔드에서는 샌드박스 브라우저가 지원되지 않습니다.
- `sandbox.docker.binds`는 OpenShell에 적용되지 않습니다.
- `sandbox.docker.*` 아래의 Docker 전용 런타임 노브는 Docker
  백엔드에만 적용됩니다.

## 작동 방식

1. OpenClaw가 `openshell sandbox create`를 호출합니다(구성된 대로 `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` 플래그 포함).
2. OpenClaw가 샌드박스의 SSH 연결 세부 정보를 가져오기 위해 `openshell sandbox ssh-config <name>`을 호출합니다.
3. 코어가 SSH 구성을 임시 파일에 쓰고, 일반 SSH 백엔드와 동일한
   원격 파일 시스템 브리지를 사용해 SSH 세션을 엽니다.
4. `mirror` 모드: exec 전에 로컬을 원격으로 동기화하고, 실행한 뒤 exec 후 다시 동기화합니다.
5. `remote` 모드: 생성 시 한 번 시드한 다음, 원격
   워크스페이스에서 직접 작동합니다.

## 관련 항목

- [샌드박싱](/ko/gateway/sandboxing) -- 모드, 범위, 백엔드 비교
- [샌드박스 vs 도구 정책 vs 승격됨](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) -- 차단된 도구 디버깅
- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의
- [샌드박스 CLI](/ko/cli/sandbox) -- `openclaw sandbox` 명령
