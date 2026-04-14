---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw 샌드박싱 작동 방식: 모드, 범위, 워크스페이스 접근, 그리고 이미지'
title: 샌드박싱
x-i18n:
    generated_at: "2026-04-14T02:08:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2573d0d7462f63a68eb1750e5432211522ff5b42989a17379d3e188468bbce52
    source_path: gateway/sandboxing.md
    workflow: 15
---

# 샌드박싱

OpenClaw는 영향 범위를 줄이기 위해 **샌드박스 백엔드 내부에서 도구를 실행**할 수 있습니다.
이 기능은 **선택 사항**이며 설정(`agents.defaults.sandbox` 또는
`agents.list[].sandbox`)으로 제어됩니다. 샌드박싱이 꺼져 있으면 도구는 호스트에서 실행됩니다.
Gateway는 호스트에 그대로 유지되며, 활성화된 경우 도구 실행은 격리된 샌드박스에서
이루어집니다.

이것은 완벽한 보안 경계는 아니지만, 모델이 잘못된 동작을 했을 때 파일 시스템과
프로세스 접근을 실질적으로 제한합니다.

## 무엇이 샌드박스 처리되는가

- 도구 실행 (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등)
- 선택적 샌드박스 브라우저 (`agents.defaults.sandbox.browser`)
  - 기본적으로 브라우저 도구가 필요할 때 샌드박스 브라우저가 자동 시작되어(CDP 연결 가능 상태 보장) 실행됩니다.
    `agents.defaults.sandbox.browser.autoStart` 및 `agents.defaults.sandbox.browser.autoStartTimeoutMs`로
    설정할 수 있습니다.
  - 기본적으로 샌드박스 브라우저 컨테이너는 전역 `bridge` 네트워크 대신 전용 Docker 네트워크(`openclaw-sandbox-browser`)를 사용합니다.
    `agents.defaults.sandbox.browser.network`로 설정할 수 있습니다.
  - 선택적인 `agents.defaults.sandbox.browser.cdpSourceRange`는 CIDR 허용 목록(예: `172.21.0.1/32`)으로 컨테이너 가장자리 CDP 인바운드를 제한합니다.
  - noVNC 관찰자 접근은 기본적으로 비밀번호로 보호됩니다. OpenClaw는 로컬 부트스트랩 페이지를 제공하고 URL 프래그먼트(쿼리/헤더 로그가 아님)에 비밀번호를 포함해 noVNC를 여는 단기 토큰 URL을 출력합니다.
  - `agents.defaults.sandbox.browser.allowHostControl`은 샌드박스 세션이 호스트 브라우저를 명시적으로 대상으로 지정할 수 있게 합니다.
  - 선택적 허용 목록은 `target: "custom"`을 제한합니다: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`

샌드박스 처리되지 않는 항목:

- Gateway 프로세스 자체
- 샌드박스 외부에서 실행하도록 명시적으로 허용된 모든 도구(예: `tools.elevated`)
  - **Elevated exec는 샌드박싱을 우회하며 구성된 이스케이프 경로(기본값 `gateway`, 또는 exec 대상이 `node`인 경우 `node`)를 사용합니다.**
  - 샌드박싱이 꺼져 있으면 `tools.elevated`는 실행 방식을 바꾸지 않습니다(이미 호스트에서 실행 중). [Elevated Mode](/ko/tools/elevated)를 참조하세요.

## 모드

`agents.defaults.sandbox.mode`는 샌드박싱을 **언제** 사용할지 제어합니다:

- `"off"`: 샌드박싱 없음
- `"non-main"`: **non-main** 세션만 샌드박스 처리(일반 채팅은 호스트에서 실행되길 원할 때의 기본값)
- `"all"`: 모든 세션을 샌드박스에서 실행
  참고: `"non-main"`은 agent id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다.
  그룹/채널 세션은 자체 키를 사용하므로 non-main으로 간주되어 샌드박스 처리됩니다.

## 범위

`agents.defaults.sandbox.scope`는 컨테이너를 **몇 개** 생성할지 제어합니다:

- `"agent"`(기본값): agent당 하나의 컨테이너
- `"session"`: 세션당 하나의 컨테이너
- `"shared"`: 모든 샌드박스 세션이 공유하는 하나의 컨테이너

## 백엔드

`agents.defaults.sandbox.backend`는 어떤 런타임이 샌드박스를 제공할지 제어합니다:

- `"docker"`(기본값): 로컬 Docker 기반 샌드박스 런타임
- `"ssh"`: 범용 SSH 기반 원격 샌드박스 런타임
- `"openshell"`: OpenShell 기반 샌드박스 런타임

SSH 전용 설정은 `agents.defaults.sandbox.ssh` 아래에 있습니다.
OpenShell 전용 설정은 `plugins.entries.openshell.config` 아래에 있습니다.

### 백엔드 선택하기

|                     | Docker                           | SSH                          | OpenShell                                       |
| ------------------- | -------------------------------- | ---------------------------- | ----------------------------------------------- |
| **실행 위치**       | 로컬 컨테이너                    | SSH로 접근 가능한 모든 호스트 | OpenShell이 관리하는 샌드박스                   |
| **설정**            | `scripts/sandbox-setup.sh`       | SSH 키 + 대상 호스트         | OpenShell Plugin 활성화                         |
| **워크스페이스 모델** | 바인드 마운트 또는 복사          | 원격 기준(remote-canonical, 한 번만 시드) | `mirror` 또는 `remote`                    |
| **네트워크 제어**   | `docker.network` (기본값: 없음)  | 원격 호스트에 따라 다름      | OpenShell에 따라 다름                           |
| **브라우저 샌드박스** | 지원됨                         | 지원되지 않음                | 아직 지원되지 않음                              |
| **바인드 마운트**   | `docker.binds`                   | 해당 없음                    | 해당 없음                                       |
| **적합한 용도**     | 로컬 개발, 완전한 격리           | 원격 머신으로 오프로딩       | 선택적 양방향 동기화가 있는 관리형 원격 샌드박스 |

### Docker 백엔드

Docker 백엔드는 기본 런타임으로, Docker 데몬 소켓(`/var/run/docker.sock`)을 통해 도구와 샌드박스 브라우저를 로컬에서 실행합니다. 샌드박스 컨테이너 격리는 Docker 네임스페이스에 의해 결정됩니다.

**Docker-out-of-Docker (DooD) 제약 사항**:
OpenClaw Gateway 자체를 Docker 컨테이너로 배포하면, 호스트의 Docker 소켓(DooD)을 사용해 형제 샌드박스 컨테이너를 오케스트레이션합니다. 이 경우 특정 경로 매핑 제약이 생깁니다:

- **설정에는 호스트 경로가 필요함**: `openclaw.json`의 `workspace` 설정은 내부 Gateway 컨테이너 경로가 아니라 **호스트의 절대 경로**(예: `/home/user/.openclaw/workspaces`)를 반드시 포함해야 합니다. OpenClaw가 Docker 데몬에 샌드박스를 생성하도록 요청할 때, 데몬은 경로를 Gateway 네임스페이스가 아니라 호스트 OS 네임스페이스를 기준으로 평가합니다.
- **FS 브리지 동일성(동일한 볼륨 매핑)**: OpenClaw Gateway 네이티브 프로세스도 `workspace` 디렉터리에 Heartbeat 및 브리지 파일을 씁니다. Gateway는 자체 컨테이너 환경 내부에서 동일한 문자열(호스트 경로)을 그대로 평가하므로, Gateway 배포에는 호스트 네임스페이스를 네이티브하게 연결하는 동일한 볼륨 매핑이 반드시 포함되어야 합니다(`-v /home/user/.openclaw:/home/user/.openclaw`).

내부 경로를 절대 호스트 경로와 동일하게 맞추지 않으면, 완전한 경로 문자열이 컨테이너 환경에 네이티브하게 존재하지 않기 때문에 OpenClaw가 컨테이너 내부에서 Heartbeat를 쓰려고 할 때 `EACCES` 권한 오류를 발생시킵니다.

### SSH 백엔드

임의의 SSH 접근 가능 머신에서 OpenClaw가 `exec`, 파일 도구, 미디어 읽기를 샌드박스 처리하도록 하려면
`backend: "ssh"`를 사용하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 또는 로컬 파일 대신 SecretRefs / 인라인 내용을 사용할 수 있습니다:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

작동 방식:

- OpenClaw는 `sandbox.ssh.workspaceRoot` 아래에 범위별 원격 루트를 생성합니다.
- 생성 또는 재생성 후 처음 사용할 때, OpenClaw는 로컬 워크스페이스에서 해당 원격 워크스페이스로 한 번 시드합니다.
- 그 이후에는 `exec`, `read`, `write`, `edit`, `apply_patch`, 프롬프트 미디어 읽기, 인바운드 미디어 스테이징이 모두 SSH를 통해 원격 워크스페이스에 직접 수행됩니다.
- OpenClaw는 원격 변경 사항을 로컬 워크스페이스로 자동 동기화하지 않습니다.

인증 자료:

- `identityFile`, `certificateFile`, `knownHostsFile`: 기존 로컬 파일을 사용하고 OpenSSH 설정을 통해 전달합니다.
- `identityData`, `certificateData`, `knownHostsData`: 인라인 문자열 또는 SecretRefs를 사용합니다. OpenClaw는 일반적인 secrets 런타임 스냅샷을 통해 이를 해석하고, `0600` 권한으로 임시 파일에 기록한 뒤 SSH 세션이 끝나면 삭제합니다.
- 동일 항목에 대해 `*File`과 `*Data`가 모두 설정되면, 해당 SSH 세션에서는 `*Data`가 우선합니다.

이것은 **원격 기준(remote-canonical)** 모델입니다. 초기 시드 이후에는 원격 SSH 워크스페이스가 실제 샌드박스 상태가 됩니다.

중요한 결과:

- 시드 단계 이후 OpenClaw 외부에서 호스트 로컬로 수행한 편집은 샌드박스를 재생성하기 전까지 원격에 반영되지 않습니다.
- `openclaw sandbox recreate`는 범위별 원격 루트를 삭제하며, 다음 사용 시 다시 로컬에서 시드합니다.
- SSH 백엔드에서는 브라우저 샌드박싱이 지원되지 않습니다.
- `sandbox.docker.*` 설정은 SSH 백엔드에 적용되지 않습니다.

### OpenShell 백엔드

OpenShell이 관리하는 원격 환경에서 OpenClaw가 도구를 샌드박스 처리하도록 하려면
`backend: "openshell"`을 사용하세요. 전체 설정 가이드, 구성
레퍼런스, 워크스페이스 모드 비교는 전용
[OpenShell 페이지](/ko/gateway/openshell)를 참조하세요.

OpenShell은 범용 SSH 백엔드와 동일한 핵심 SSH 전송과 원격 파일 시스템 브리지를 재사용하며,
여기에 OpenShell 전용 라이프사이클
(`sandbox create/get/delete`, `sandbox ssh-config`)과 선택적 `mirror`
워크스페이스 모드를 추가합니다.

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell 모드:

- `mirror`(기본값): 로컬 워크스페이스가 기준 상태로 유지됩니다. OpenClaw는 exec 전에 로컬 파일을 OpenShell로 동기화하고 exec 후 원격 워크스페이스를 다시 동기화합니다.
- `remote`: 샌드박스가 생성된 이후에는 OpenShell 워크스페이스가 기준 상태가 됩니다. OpenClaw는 로컬 워크스페이스에서 원격 워크스페이스로 한 번만 시드한 뒤, 변경 사항을 다시 동기화하지 않고 파일 도구와 exec를 원격 샌드박스에서 직접 실행합니다.

원격 전송 세부 사항:

- OpenClaw는 `openshell sandbox ssh-config <name>`를 통해 OpenShell에 샌드박스별 SSH 설정을 요청합니다.
- 코어는 해당 SSH 설정을 임시 파일에 기록하고 SSH 세션을 열며, `backend: "ssh"`에서 사용하는 동일한 원격 파일 시스템 브리지를 재사용합니다.
- `mirror` 모드에서는 라이프사이클만 다릅니다. exec 전에는 로컬에서 원격으로 동기화하고, exec 후에는 다시 되돌려 동기화합니다.

현재 OpenShell의 제한 사항:

- 샌드박스 브라우저는 아직 지원되지 않음
- `sandbox.docker.binds`는 OpenShell 백엔드에서 지원되지 않음
- `sandbox.docker.*` 아래의 Docker 전용 런타임 설정은 여전히 Docker 백엔드에만 적용됨

#### 워크스페이스 모드

OpenShell에는 두 가지 워크스페이스 모델이 있습니다. 실제 사용에서는 이 부분이 가장 중요합니다.

##### `mirror`

**로컬 워크스페이스를 계속 기준 상태로 유지**하려면 `plugins.entries.openshell.config.mode: "mirror"`를 사용하세요.

동작:

- `exec` 전에 OpenClaw는 로컬 워크스페이스를 OpenShell 샌드박스로 동기화합니다.
- `exec` 후 OpenClaw는 원격 워크스페이스를 다시 로컬 워크스페이스로 동기화합니다.
- 파일 도구는 여전히 샌드박스 브리지를 통해 동작하지만, 턴 사이의 기준 상태는 로컬 워크스페이스로 유지됩니다.

다음과 같은 경우에 사용하세요:

- OpenClaw 외부에서 로컬 파일을 편집하며, 그 변경 사항이 자동으로 샌드박스에 반영되길 원할 때
- OpenShell 샌드박스가 가능한 한 Docker 백엔드처럼 동작하길 원할 때
- 각 exec 턴 이후 호스트 워크스페이스에 샌드박스 쓰기 결과가 반영되길 원할 때

절충점:

- exec 전후에 추가 동기화 비용이 발생함

##### `remote`

**OpenShell 워크스페이스를 기준 상태로 전환**하려면 `plugins.entries.openshell.config.mode: "remote"`를 사용하세요.

동작:

- 샌드박스가 처음 생성될 때 OpenClaw는 로컬 워크스페이스에서 원격 워크스페이스로 한 번 시드합니다.
- 그 이후에는 `exec`, `read`, `write`, `edit`, `apply_patch`가 원격 OpenShell 워크스페이스에 직접 수행됩니다.
- OpenClaw는 exec 후 원격 변경 사항을 다시 로컬 워크스페이스에 동기화하지 않습니다.
- 프롬프트 시점의 미디어 읽기는 여전히 동작합니다. 파일 및 미디어 도구가 로컬 호스트 경로를 가정하지 않고 샌드박스 브리지를 통해 읽기 때문입니다.
- 전송은 `openshell sandbox ssh-config`가 반환한 OpenShell 샌드박스로의 SSH를 사용합니다.

중요한 결과:

- 시드 단계 이후 OpenClaw 외부에서 호스트의 파일을 편집하면, 원격 샌드박스는 그 변경 사항을 자동으로 **볼 수 없습니다**.
- 샌드박스를 재생성하면, 원격 워크스페이스는 다시 로컬 워크스페이스에서 시드됩니다.
- `scope: "agent"` 또는 `scope: "shared"`를 사용하면, 해당 원격 워크스페이스도 동일한 범위에서 공유됩니다.

다음과 같은 경우에 사용하세요:

- 샌드박스가 주로 원격 OpenShell 측에서 유지되어야 할 때
- 턴마다 발생하는 동기화 오버헤드를 더 낮추고 싶을 때
- 호스트 로컬 편집이 원격 샌드박스 상태를 조용히 덮어쓰지 않게 하려 할 때

샌드박스를 임시 실행 환경으로 생각한다면 `mirror`를 선택하세요.
샌드박스를 실제 워크스페이스로 생각한다면 `remote`를 선택하세요.

#### OpenShell 라이프사이클

OpenShell 샌드박스도 일반적인 샌드박스 라이프사이클을 통해 관리됩니다:

- `openclaw sandbox list`는 Docker 런타임뿐 아니라 OpenShell 런타임도 표시합니다
- `openclaw sandbox recreate`는 현재 런타임을 삭제하고, 다음 사용 시 OpenClaw가 다시 생성하도록 합니다
- prune 로직도 백엔드를 인식하여 동작합니다

특히 `remote` 모드에서는 recreate가 중요합니다:

- recreate는 해당 범위의 기준 원격 워크스페이스를 삭제합니다
- 다음 사용 시 로컬 워크스페이스에서 새로운 원격 워크스페이스를 시드합니다

`mirror` 모드에서 recreate는 주로 원격 실행 환경을 초기화하는 역할을 합니다.
로컬 워크스페이스가 어차피 기준 상태로 유지되기 때문입니다.

## 워크스페이스 접근

`agents.defaults.sandbox.workspaceAccess`는 샌드박스가 **무엇을 볼 수 있는지** 제어합니다:

- `"none"`(기본값): 도구는 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스를 봅니다.
- `"ro"`: agent 워크스페이스를 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화).
- `"rw"`: agent 워크스페이스를 `/workspace`에 읽기/쓰기 가능으로 마운트합니다.

OpenShell 백엔드에서는:

- `mirror` 모드는 exec 턴 사이에 여전히 로컬 워크스페이스를 기준 소스로 사용합니다
- `remote` 모드는 초기 시드 이후 원격 OpenShell 워크스페이스를 기준 소스로 사용합니다
- `workspaceAccess: "ro"`와 `"none"`도 동일한 방식으로 쓰기 동작을 제한합니다

인바운드 미디어는 활성 샌드박스 워크스페이스(`media/inbound/*`)로 복사됩니다.
Skills 참고: `read` 도구는 샌드박스 루트를 기준으로 동작합니다. `workspaceAccess: "none"`에서는
OpenClaw가 읽을 수 있도록 해당 Skills를 샌드박스 워크스페이스(`.../skills`)로 미러링합니다.
`"rw"`에서는 워크스페이스 Skills를
`/workspace/skills`에서 읽을 수 있습니다.

## 사용자 지정 바인드 마운트

`agents.defaults.sandbox.docker.binds`는 추가 호스트 디렉터리를 컨테이너에 마운트합니다.
형식: `host:container:mode`(예: `"/home/user/source:/source:rw"`)

전역 바인드와 agent별 바인드는 **병합**되며(대체되지 않음), `scope: "shared"`에서는 agent별 바인드가 무시됩니다.

`agents.defaults.sandbox.browser.binds`는 추가 호스트 디렉터리를 **샌드박스 브라우저** 컨테이너에만 마운트합니다.

- 설정되면(`[]` 포함) 브라우저 컨테이너에서는 `agents.defaults.sandbox.docker.binds`를 대체합니다.
- 생략되면 브라우저 컨테이너는 `agents.defaults.sandbox.docker.binds`를 대체 경로 없이 그대로 사용합니다(하위 호환).

예시(읽기 전용 소스 + 추가 데이터 디렉터리):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

보안 참고 사항:

- 바인드는 샌드박스 파일 시스템을 우회합니다. 설정한 모드(`:ro` 또는 `:rw`) 그대로 호스트 경로를 노출합니다.
- OpenClaw는 위험한 바인드 소스(예: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, 그리고 이들을 노출할 수 있는 상위 마운트)를 차단합니다.
- OpenClaw는 또한 `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh` 같은 일반적인 홈 디렉터리 자격 증명 루트도 차단합니다.
- 바인드 검증은 단순한 문자열 매칭이 아닙니다. OpenClaw는 소스 경로를 정규화한 다음, 가장 깊게 존재하는 상위 경로를 통해 다시 해석한 뒤 차단된 경로와 허용된 루트를 다시 검사합니다.
- 즉, 최종 리프가 아직 존재하지 않더라도 심볼릭 링크 상위 경로를 이용한 탈출은 여전히 닫힌 상태로 실패합니다. 예: `run-link`가 해당 위치를 가리키면 `/workspace/run-link/new-file`은 여전히 `/var/run/...`로 해석됩니다.
- 허용된 소스 루트도 같은 방식으로 정규화되므로, 심볼릭 링크 해석 전에는 허용 목록 내부처럼 보여도 실제로는 `outside allowed roots`로 거부됩니다.
- 민감한 마운트(비밀, SSH 키, 서비스 자격 증명)는 절대적으로 필요하지 않은 한 `:ro`여야 합니다.
- 워크스페이스에 읽기 접근만 필요하다면 `workspaceAccess: "ro"`와 함께 사용하세요. 바인드 모드는 여전히 독립적으로 적용됩니다.
- 바인드가 도구 정책 및 elevated exec와 어떻게 상호작용하는지는 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)를 참조하세요.

## 이미지 + 설정

기본 Docker 이미지: `openclaw-sandbox:bookworm-slim`

한 번 빌드하세요:

```bash
scripts/sandbox-setup.sh
```

참고: 기본 이미지에는 Node가 포함되어 있지 않습니다. 어떤 skill에 Node(또는
다른 런타임)가 필요하다면, 사용자 지정 이미지를 만들거나
`sandbox.docker.setupCommand`를 통해 설치해야 합니다(네트워크 이그레스 + 쓰기 가능한 루트 +
루트 사용자 필요).

`curl`, `jq`, `nodejs`, `python3`, `git` 같은 일반적인 도구가 포함된
좀 더 실용적인 샌드박스 이미지를 원한다면 다음을 빌드하세요:

```bash
scripts/sandbox-common-setup.sh
```

그런 다음 `agents.defaults.sandbox.docker.image`를
`openclaw-sandbox-common:bookworm-slim`으로 설정하세요.

샌드박스 브라우저 이미지:

```bash
scripts/sandbox-browser-setup.sh
```

기본적으로 Docker 샌드박스 컨테이너는 **네트워크 없이** 실행됩니다.
`agents.defaults.sandbox.docker.network`로 재정의할 수 있습니다.

번들된 샌드박스 브라우저 이미지는 컨테이너화된 워크로드를 위해
보수적인 Chromium 시작 기본값도 적용합니다. 현재 컨테이너 기본값은 다음과 같습니다:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox`가 활성화된 경우 `--no-sandbox` 및 `--disable-setuid-sandbox`
- 세 가지 그래픽 강화 플래그(`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`)는 선택 사항이며,
  컨테이너에 GPU 지원이 없을 때 유용합니다. 워크로드에 WebGL 또는 기타 3D/브라우저 기능이 필요하다면
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 설정하세요.
- `--disable-extensions`는 기본적으로 활성화되어 있으며,
  확장 기능 의존 흐름에는 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 비활성화할 수 있습니다.
- `--renderer-process-limit=2`는
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 제어되며, `0`은 Chromium 기본값을 유지합니다.

다른 런타임 프로필이 필요하다면, 사용자 지정 브라우저 이미지를 사용하고
자체 entrypoint를 제공하세요. 로컬(비컨테이너) Chromium 프로필의 경우
추가 시작 플래그를 붙이려면 `browser.extraArgs`를 사용하세요.

보안 기본값:

- `network: "host"`는 차단됩니다.
- `network: "container:<id>"`는 기본적으로 차단됩니다(네임스페이스 조인 우회 위험).
- 긴급 예외용 재정의: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

Docker 설치 및 컨테이너형 Gateway 관련 내용은 여기에서 확인할 수 있습니다:
[Docker](/ko/install/docker)

Docker Gateway 배포의 경우 `scripts/docker/setup.sh`로 샌드박스 구성을 부트스트랩할 수 있습니다.
이 경로를 활성화하려면 `OPENCLAW_SANDBOX=1`(또는 `true`/`yes`/`on`)을 설정하세요.
소켓 위치는 `OPENCLAW_DOCKER_SOCKET`으로 재정의할 수 있습니다. 전체 설정 및 환경 변수
레퍼런스: [Docker](/ko/install/docker#agent-sandbox)

## setupCommand(일회성 컨테이너 설정)

`setupCommand`는 샌드박스 컨테이너가 생성된 후 **한 번만** 실행됩니다(매 실행마다 아님).
컨테이너 내부에서 `sh -lc`를 통해 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- agent별: `agents.list[].sandbox.docker.setupCommand`

흔한 주의사항:

- 기본 `docker.network`는 `"none"`(이그레스 없음)이므로 패키지 설치가 실패합니다.
- `docker.network: "container:<id>"`는 `dangerouslyAllowContainerNamespaceJoin: true`가 필요하며 긴급 예외용으로만 사용해야 합니다.
- `readOnlyRoot: true`는 쓰기를 막습니다. `readOnlyRoot: false`로 설정하거나 사용자 지정 이미지를 만드세요.
- 패키지 설치를 하려면 `user`가 root여야 합니다(`user`를 생략하거나 `user: "0:0"`으로 설정).
- 샌드박스 exec는 호스트 `process.env`를 상속하지 않습니다. skill API 키에는
  `agents.defaults.sandbox.docker.env`(또는 사용자 지정 이미지)를 사용하세요.

## 도구 정책 + 이스케이프 해치

도구 허용/거부 정책은 여전히 샌드박스 규칙보다 먼저 적용됩니다. 도구가 전역 또는 agent별로
거부되어 있으면, 샌드박싱이 그것을 다시 활성화하지는 않습니다.

`tools.elevated`는 샌드박스 외부에서 `exec`를 실행하는 명시적 이스케이프 해치입니다(기본값 `gateway`, exec 대상이 `node`인 경우 `node`).
`/exec` 지시어는 권한이 있는 발신자에게만 적용되며 세션별로 유지됩니다. `exec`를 완전히 비활성화하려면
도구 정책 deny를 사용하세요([Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) 참조).

디버깅:

- 유효한 샌드박스 모드, 도구 정책, 수정용 설정 키를 확인하려면 `openclaw sandbox explain`을 사용하세요.
- “왜 이게 차단되나요?”에 대한 사고 모델은 [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)를 참조하세요.
  잠금 상태를 유지하세요.

## 멀티 agent 재정의

각 agent는 샌드박스와 도구를 재정의할 수 있습니다:
`agents.list[].sandbox` 및 `agents.list[].tools`(샌드박스 도구 정책용 `agents.list[].tools.sandbox.tools` 포함).
우선순위는 [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

## 최소 활성화 예시

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 관련 문서

- [OpenShell](/ko/gateway/openshell) -- 관리형 샌드박스 백엔드 설정, 워크스페이스 모드, 구성 레퍼런스
- [Sandbox Configuration](/ko/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) -- “왜 이게 차단되나요?” 디버깅
- [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools) -- agent별 재정의 및 우선순위
- [Security](/ko/gateway/security)
