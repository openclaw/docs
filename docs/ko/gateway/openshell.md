---
read_when:
    - 로컬 Docker 대신 클라우드 관리형 샌드박스를 사용하려는 경우
    - OpenShell Plugin을 설정하고 있습니다
    - 미러 모드와 원격 작업 공간 모드 중에서 선택해야 합니다.
summary: OpenClaw 에이전트용 관리형 샌드박스 백엔드로 OpenShell 사용하기
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T00:49:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell은 관리형 샌드박스 백엔드입니다. Docker 컨테이너를 로컬에서 실행하는 대신 OpenClaw가 샌드박스 수명 주기를 `openshell` CLI에 위임하며, 이 CLI는 원격 환경을 프로비저닝하고 SSH를 통해 명령을 실행합니다.

이 Plugin은 범용 [SSH 백엔드](/ko/gateway/sandboxing#ssh-backend)와 동일한 SSH 전송 및 원격 파일 시스템 브리지를 재사용하고, OpenShell 수명 주기(`sandbox create/get/delete/ssh-config`)와 선택적 `mirror` 작업 공간 동기화 모드를 추가합니다.

## 사전 요구 사항

- OpenShell Plugin 설치(`openclaw plugins install @openclaw/openshell-sandbox`)
- `PATH`에 `openshell` CLI 등록(또는 `plugins.entries.openshell.config.command`를 통해 사용자 지정 경로 설정)
- 샌드박스 접근 권한이 있는 OpenShell 계정
- 호스트에서 실행 중인 OpenClaw Gateway

## 빠른 시작

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

Gateway를 다시 시작합니다. 다음 에이전트 턴에서 OpenClaw가 OpenShell 샌드박스를 생성하고 도구 실행을 해당 샌드박스를 통해 라우팅합니다. 다음 명령으로 확인합니다.

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 작업 공간 모드

이는 OpenShell에서 가장 중요한 선택 사항입니다.

### mirror(기본값)

`plugins.entries.openshell.config.mode: "mirror"`는 **로컬 작업 공간을 정본으로** 유지합니다.

- `exec` 전에 OpenClaw가 로컬 작업 공간을 샌드박스로 동기화합니다.
- `exec` 후에 OpenClaw가 원격 작업 공간을 다시 로컬로 동기화합니다.
- 파일 도구는 샌드박스 브리지를 통하지만, 턴 사이에는 로컬이 원본 데이터로 유지됩니다.

개발 워크플로에 가장 적합합니다. OpenClaw 외부에서 수행한 로컬 편집 내용이 다음 실행에 반영되며, 샌드박스는 Docker 백엔드와 유사하게 동작합니다.

절충점: 각 실행 턴마다 업로드 및 다운로드 비용이 발생합니다.

### remote

`mode: "remote"`는 **OpenShell 작업 공간을 정본으로** 사용합니다.

- 샌드박스를 처음 생성할 때 OpenClaw가 로컬 작업 공간의 내용을 원격 작업 공간에 한 번 초기화합니다.
- 이후 `exec`, `read`, `write`, `edit`, `apply_patch`는 원격 작업 공간에서 직접 작동합니다. OpenClaw는 원격 변경 사항을 로컬에 다시 동기화하지 **않습니다**.
- 프롬프트 처리 시 미디어 읽기는 계속 작동합니다. 파일/미디어 도구가 샌드박스 브리지를 통해 읽습니다.

장기 실행 에이전트와 CI에 가장 적합합니다. 턴별 오버헤드가 더 낮고, 호스트의 로컬 편집이 원격 상태를 모르게 덮어쓸 수 없습니다.

<Warning>
최초 초기화 이후 OpenClaw 외부에서 호스트의 파일을 편집해도 원격 샌드박스에는 표시되지 않습니다. 다시 초기화하려면 `openclaw sandbox recreate`를 실행하세요.
</Warning>

### 모드 선택

|                          | `mirror`                     | `remote`                  |
| ------------------------ | ---------------------------- | ------------------------- |
| **정본 작업 공간**       | 로컬 호스트                  | 원격 OpenShell            |
| **동기화 방향**          | 양방향(매 실행 시)           | 일회성 초기화             |
| **턴별 오버헤드**        | 높음(업로드 + 다운로드)      | 낮음(직접 원격 작업)      |
| **로컬 편집 표시 여부**  | 예, 다음 실행 시             | 아니요, 재생성 전까지     |
| **가장 적합한 용도**     | 개발 워크플로                | 장기 실행 에이전트, CI    |

## 구성 참조

모든 OpenShell 구성은 `plugins.entries.openshell.config` 아래에 있습니다.

| 키                        | 유형                     | 기본값        | 설명                                                                                 |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------------------------------------ |
| `mode`                    | `"mirror"` 또는 `"remote"` | `"mirror"`    | 작업 공간 동기화 모드                                                               |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI의 경로 또는 이름                                                     |
| `from`                    | `string`                 | `"openclaw"`  | 최초 생성에 사용할 샌드박스 소스                                                    |
| `gateway`                 | `string`                 | 설정되지 않음 | OpenShell 게이트웨이 이름(최상위 `--gateway`)                                        |
| `gatewayEndpoint`         | `string`                 | 설정되지 않음 | OpenShell 게이트웨이 엔드포인트(최상위 `--gateway-endpoint`)                         |
| `policy`                  | `string`                 | 설정되지 않음 | 샌드박스 생성용 OpenShell 정책 ID                                                    |
| `providers`               | `string[]`               | `[]`          | 샌드박스 생성 시 연결할 제공자 이름(중복 제거, 항목당 `--provider` 플래그 하나)      |
| `gpu`                     | `boolean`                | `false`       | GPU 리소스 요청(`--gpu`)                                                             |
| `autoProviders`           | `boolean`                | `true`        | 생성 중 `--auto-providers` 전달(`false`인 경우 `--no-auto-providers`)                |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 샌드박스 내부의 기본 쓰기 가능 작업 공간                                             |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 에이전트 작업 공간 마운트 경로(작업 공간 접근 권한이 `rw`가 아니면 읽기 전용)        |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 작업의 제한 시간                                                     |

`remoteWorkspaceDir`과 `remoteAgentWorkspaceDir`은 절대 경로여야 하며 관리되는 루트 `/sandbox` 또는 `/agent` 아래에 있어야 합니다. 그 밖의 절대 경로는 거부됩니다.

샌드박스 수준 설정(`mode`, `scope`, `workspaceAccess`)은 다른 백엔드와 마찬가지로 `agents.defaults.sandbox` 아래에 있습니다. 전체 조합은 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

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

### GPU를 사용하는 mirror 모드

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

### 사용자 지정 게이트웨이를 사용하는 에이전트별 OpenShell

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

```bash
# 모든 샌드박스 런타임 나열(Docker + OpenShell)
openclaw sandbox list

# 적용되는 정책 검사
openclaw sandbox explain

# 재생성(원격 작업 공간을 삭제하고 다음 사용 시 다시 초기화)
openclaw sandbox recreate --all
```

`remote` 모드에서는 재생성이 특히 중요합니다. 해당 범위의 정본 원격 작업 공간을 삭제하며, 다음 사용 시 로컬에서 새로운 작업 공간을 초기화합니다. `mirror` 모드에서는 로컬이 정본으로 유지되므로 재생성은 주로 원격 실행 환경을 초기화합니다.

다음 중 하나를 변경한 후에는 재생성하세요.

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## 보안 강화

mirror 모드 파일 시스템 브리지는 로컬 작업 공간 루트를 고정하고, 모든 읽기, 쓰기, 디렉터리 생성, 삭제 및 이름 변경 전에 실제 경로를 통해 정규 경로를 다시 확인하며 경로 중간의 심볼릭 링크를 거부합니다. 심볼릭 링크 교체 또는 작업 공간 재마운트로 파일 접근을 미러링된 트리 외부로 리디렉션할 수 없습니다.

## 현재 제한 사항

- OpenShell 백엔드에서는 샌드박스 브라우저를 지원하지 않습니다.
- `sandbox.docker.binds`는 OpenShell에 적용되지 않으며, 바인드가 구성되어 있으면 샌드박스 생성에 실패합니다.
- `sandbox.docker.*` 아래의 Docker 전용 런타임 설정(`env` 제외)은 Docker 백엔드에만 적용됩니다.

## 작동 방식

1. OpenClaw는 샌드박스 이름에 대해 `sandbox get`을 실행하며 구성된 `--gateway`/`--gateway-endpoint`가 있으면 함께 전달합니다. 실패하면 `sandbox create`로 샌드박스를 생성하면서 `--name`, `--from`, 설정된 경우 `--policy`, 활성화된 경우 `--gpu`, `--auto-providers`/`--no-auto-providers`, 구성된 제공자마다 하나의 `--provider` 플래그를 전달합니다.
2. OpenClaw는 샌드박스 이름에 대해 `sandbox ssh-config`를 실행하여 SSH 연결 세부 정보를 가져옵니다.
3. 코어는 SSH 구성을 임시 파일에 쓰고 범용 SSH 백엔드와 동일한 원격 파일 시스템 브리지를 통해 SSH 세션을 엽니다.
4. `mirror` 모드에서는 실행 전에 로컬을 원격에 동기화하고, 실행한 후 다시 동기화합니다.
5. `remote` 모드에서는 생성 시 한 번 초기화한 다음 원격 작업 공간에서 직접 작업합니다.

## 관련 문서

- [샌드박싱](/ko/gateway/sandboxing) - 모드, 범위 및 백엔드 비교
- [샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) - 차단된 도구 디버깅
- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) - 에이전트별 재정의
- [샌드박스 CLI](/ko/cli/sandbox) - `openclaw sandbox` 명령
