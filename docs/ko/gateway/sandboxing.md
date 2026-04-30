---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw 샌드박싱 작동 방식: 모드, 범위, 작업공간 접근 및 이미지'
title: 샌드박싱
x-i18n:
    generated_at: "2026-04-30T06:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw는 폭발 반경을 줄이기 위해 **샌드박스 백엔드 안에서 도구를 실행**할 수 있습니다. 이는 **선택 사항**이며 구성(`agents.defaults.sandbox` 또는 `agents.list[].sandbox`)으로 제어됩니다. 샌드박싱이 꺼져 있으면 도구는 호스트에서 실행됩니다. Gateway는 호스트에 남아 있으며, 활성화된 경우 도구 실행은 격리된 샌드박스에서 실행됩니다.

<Note>
이는 완벽한 보안 경계는 아니지만, 모델이 잘못된 동작을 할 때 파일 시스템 및 프로세스 접근을 실질적으로 제한합니다.
</Note>

## 샌드박싱되는 항목

- 도구 실행(`exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등).
- 선택적 샌드박스 브라우저(`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="샌드박스 브라우저 세부 정보">
    - 기본적으로 샌드박스 브라우저는 브라우저 도구가 필요로 할 때 자동으로 시작됩니다(CDP에 도달할 수 있도록 보장). `agents.defaults.sandbox.browser.autoStart` 및 `agents.defaults.sandbox.browser.autoStartTimeoutMs`로 구성합니다.
    - 기본적으로 샌드박스 브라우저 컨테이너는 전역 `bridge` 네트워크 대신 전용 Docker 네트워크(`openclaw-sandbox-browser`)를 사용합니다. `agents.defaults.sandbox.browser.network`로 구성합니다.
    - 선택적 `agents.defaults.sandbox.browser.cdpSourceRange`는 CIDR 허용 목록(예: `172.21.0.1/32`)으로 컨테이너 경계 CDP 인그레스를 제한합니다.
    - noVNC 관찰자 접근은 기본적으로 암호로 보호됩니다. OpenClaw는 로컬 부트스트랩 페이지를 제공하고 URL 프래그먼트(쿼리/헤더 로그가 아님)에 암호를 넣어 noVNC를 여는 수명이 짧은 토큰 URL을 내보냅니다.
    - `agents.defaults.sandbox.browser.allowHostControl`은 샌드박스 세션이 호스트 브라우저를 명시적으로 대상으로 삼을 수 있게 합니다.
    - 선택적 허용 목록은 `target: "custom"`을 게이트합니다: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

샌드박싱되지 않는 항목:

- Gateway 프로세스 자체.
- 샌드박스 밖에서 실행하도록 명시적으로 허용된 모든 도구(예: `tools.elevated`).
  - **상승된 exec는 샌드박싱을 우회하고 구성된 이스케이프 경로를 사용합니다(기본값은 `gateway`, 또는 exec 대상이 `node`이면 `node`).**
  - 샌드박싱이 꺼져 있으면 `tools.elevated`는 실행을 변경하지 않습니다(이미 호스트에서 실행 중). [상승 모드](/ko/tools/elevated)를 참조하세요.

## 모드

`agents.defaults.sandbox.mode`는 샌드박싱이 **언제** 사용되는지 제어합니다:

<Tabs>
  <Tab title="off">
    샌드박싱 없음.
  </Tab>
  <Tab title="non-main">
    **non-main** 세션만 샌드박싱합니다(일반 채팅은 호스트에서 실행하려는 경우의 기본값).

    `"non-main"`은 에이전트 ID가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다. 그룹/채널 세션은 자체 키를 사용하므로 non-main으로 간주되어 샌드박싱됩니다.

  </Tab>
  <Tab title="all">
    모든 세션이 샌드박스에서 실행됩니다.
  </Tab>
</Tabs>

## 범위

`agents.defaults.sandbox.scope`는 **생성되는 컨테이너 수**를 제어합니다:

- `"agent"`(기본값): 에이전트당 컨테이너 하나.
- `"session"`: 세션당 컨테이너 하나.
- `"shared"`: 모든 샌드박스 세션이 공유하는 컨테이너 하나.

## 백엔드

`agents.defaults.sandbox.backend`는 **어떤 런타임**이 샌드박스를 제공하는지 제어합니다:

- `"docker"`(샌드박싱이 활성화된 경우 기본값): 로컬 Docker 기반 샌드박스 런타임.
- `"ssh"`: 일반 SSH 기반 원격 샌드박스 런타임.
- `"openshell"`: OpenShell 기반 샌드박스 런타임.

SSH 전용 구성은 `agents.defaults.sandbox.ssh` 아래에 있습니다. OpenShell 전용 구성은 `plugins.entries.openshell.config` 아래에 있습니다.

### 백엔드 선택

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **실행 위치**       | 로컬 컨테이너                    | SSH 접근 가능한 모든 호스트    | OpenShell 관리 샌드박스                             |
| **설정**            | `scripts/sandbox-setup.sh`       | SSH 키 + 대상 호스트           | OpenShell Plugin 활성화                             |
| **작업 공간 모델**  | 바인드 마운트 또는 복사          | 원격 기준(한 번 시드)          | `mirror` 또는 `remote`                              |
| **네트워크 제어**   | `docker.network`(기본값: 없음)   | 원격 호스트에 따라 다름        | OpenShell에 따라 다름                               |
| **브라우저 샌드박스** | 지원됨                         | 지원되지 않음                  | 아직 지원되지 않음                                  |
| **바인드 마운트**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **최적 용도**       | 로컬 개발, 완전한 격리           | 원격 머신으로 오프로딩         | 선택적 양방향 동기화가 있는 관리형 원격 샌드박스   |

### Docker 백엔드

샌드박싱은 기본적으로 꺼져 있습니다. 샌드박싱을 활성화하고 백엔드를 선택하지 않으면 OpenClaw는 Docker 백엔드를 사용합니다. Docker 데몬 소켓(`/var/run/docker.sock`)을 통해 도구와 샌드박스 브라우저를 로컬에서 실행합니다. 샌드박스 컨테이너 격리는 Docker 네임스페이스에 의해 결정됩니다.

호스트 GPU를 Docker 샌드박스에 노출하려면 `agents.defaults.sandbox.docker.gpus` 또는 에이전트별 `agents.list[].sandbox.docker.gpus` 재정의를 설정하세요. 값은 Docker의 `--gpus` 플래그에 별도 인수로 전달됩니다. 예를 들어 `"all"` 또는 `"device=GPU-uuid"`이며, NVIDIA Container Toolkit 같은 호환 호스트 런타임이 필요합니다.

<Warning>
**Docker-out-of-Docker(DooD) 제약 사항**

OpenClaw Gateway 자체를 Docker 컨테이너로 배포하면, 호스트의 Docker 소켓(DooD)을 사용하여 형제 샌드박스 컨테이너를 오케스트레이션합니다. 이로 인해 특정 경로 매핑 제약이 생깁니다:

- **구성에는 호스트 경로가 필요합니다**: `openclaw.json` `workspace` 구성은 내부 Gateway 컨테이너 경로가 아니라 **호스트의 절대 경로**(예: `/home/user/.openclaw/workspaces`)를 포함해야 합니다. OpenClaw가 Docker 데몬에 샌드박스 생성을 요청하면, 데몬은 Gateway 네임스페이스가 아니라 호스트 OS 네임스페이스를 기준으로 경로를 평가합니다.
- **FS 브리지 패리티(동일한 볼륨 맵)**: OpenClaw Gateway 네이티브 프로세스도 `workspace` 디렉터리에 Heartbeat 및 브리지 파일을 씁니다. Gateway는 자체 컨테이너화된 환경 안에서 정확히 같은 문자열(호스트 경로)을 평가하므로, Gateway 배포에는 호스트 네임스페이스를 네이티브로 연결하는 동일한 볼륨 맵(`-v /home/user/.openclaw:/home/user/.openclaw`)이 포함되어야 합니다.

절대 호스트 패리티 없이 경로를 내부적으로 매핑하면, 완전한 경로 문자열이 네이티브로 존재하지 않기 때문에 OpenClaw가 컨테이너 환경 내부에 Heartbeat를 쓰려고 할 때 네이티브하게 `EACCES` 권한 오류를 던집니다.
</Warning>

### SSH 백엔드

임의의 SSH 접근 가능 머신에서 OpenClaw가 `exec`, 파일 도구, 미디어 읽기를 샌드박싱하게 하려면 `backend: "ssh"`를 사용하세요.

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
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="작동 방식">
    - OpenClaw는 `sandbox.ssh.workspaceRoot` 아래에 범위별 원격 루트를 생성합니다.
    - 생성 또는 재생성 후 처음 사용할 때, OpenClaw는 로컬 작업 공간에서 원격 작업 공간으로 한 번 시드합니다.
    - 그 이후 `exec`, `read`, `write`, `edit`, `apply_patch`, 프롬프트 미디어 읽기, 인바운드 미디어 스테이징은 SSH를 통해 원격 작업 공간에 직접 실행됩니다.
    - OpenClaw는 원격 변경 사항을 로컬 작업 공간으로 자동 동기화하지 않습니다.

  </Accordion>
  <Accordion title="인증 자료">
    - `identityFile`, `certificateFile`, `knownHostsFile`: 기존 로컬 파일을 사용하고 OpenSSH 구성으로 전달합니다.
    - `identityData`, `certificateData`, `knownHostsData`: 인라인 문자열 또는 SecretRefs를 사용합니다. OpenClaw는 일반 secrets 런타임 스냅샷을 통해 이를 해석하고, `0600` 권한으로 임시 파일에 쓴 뒤 SSH 세션이 끝나면 삭제합니다.
    - 동일한 항목에 `*File`과 `*Data`가 모두 설정되어 있으면 해당 SSH 세션에서는 `*Data`가 우선합니다.

  </Accordion>
  <Accordion title="원격 기준의 결과">
    이는 **원격 기준** 모델입니다. 초기 시드 후 원격 SSH 작업 공간이 실제 샌드박스 상태가 됩니다.

    - 시드 단계 이후 OpenClaw 밖에서 수행된 호스트 로컬 편집은 샌드박스를 재생성하기 전까지 원격에 보이지 않습니다.
    - `openclaw sandbox recreate`는 범위별 원격 루트를 삭제하고 다음 사용 시 로컬에서 다시 시드합니다.
    - SSH 백엔드에서는 브라우저 샌드박싱이 지원되지 않습니다.
    - `sandbox.docker.*` 설정은 SSH 백엔드에 적용되지 않습니다.

  </Accordion>
</AccordionGroup>

### OpenShell 백엔드

OpenClaw가 OpenShell 관리 원격 환경에서 도구를 샌드박싱하게 하려면 `backend: "openshell"`을 사용하세요. 전체 설정 가이드, 구성 참조, 작업 공간 모드 비교는 전용 [OpenShell 페이지](/ko/gateway/openshell)를 참조하세요.

OpenShell은 일반 SSH 백엔드와 동일한 핵심 SSH 전송 및 원격 파일 시스템 브리지를 재사용하며, OpenShell 전용 수명 주기(`sandbox create/get/delete`, `sandbox ssh-config`)와 선택적 `mirror` 작업 공간 모드를 추가합니다.

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

- `mirror`(기본값): 로컬 작업 공간이 기준으로 유지됩니다. OpenClaw는 exec 전에 로컬 파일을 OpenShell로 동기화하고 exec 후 원격 작업 공간을 다시 동기화합니다.
- `remote`: 샌드박스가 생성된 후 OpenShell 작업 공간이 기준입니다. OpenClaw는 로컬 작업 공간에서 원격 작업 공간으로 한 번 시드한 다음, 파일 도구와 exec가 변경 사항을 다시 동기화하지 않고 원격 샌드박스에 직접 실행됩니다.

<AccordionGroup>
  <Accordion title="원격 전송 세부 정보">
    - OpenClaw는 `openshell sandbox ssh-config <name>`을 통해 OpenShell에 샌드박스별 SSH 구성을 요청합니다.
    - Core는 해당 SSH 구성을 임시 파일에 쓰고, SSH 세션을 열며, `backend: "ssh"`에서 사용하는 동일한 원격 파일 시스템 브리지를 재사용합니다.
    - `mirror` 모드에서는 수명 주기만 다릅니다. exec 전에 로컬에서 원격으로 동기화한 다음 exec 후 다시 동기화합니다.

  </Accordion>
  <Accordion title="현재 OpenShell 제한 사항">
    - 샌드박스 브라우저는 아직 지원되지 않음
    - `sandbox.docker.binds`는 OpenShell 백엔드에서 지원되지 않음
    - `sandbox.docker.*` 아래의 Docker 전용 런타임 노브는 여전히 Docker 백엔드에만 적용됨

  </Accordion>
</AccordionGroup>

#### 작업 공간 모드

OpenShell에는 두 가지 작업 공간 모델이 있습니다. 실제로 가장 중요한 부분입니다.

<Tabs>
  <Tab title="mirror(로컬 기준)">
    **로컬 작업 공간을 기준으로 유지**하려면 `plugins.entries.openshell.config.mode: "mirror"`를 사용하세요.

    동작:

    - `exec` 전에 OpenClaw는 로컬 작업 공간을 OpenShell 샌드박스로 동기화합니다.
    - `exec` 후 OpenClaw는 원격 작업 공간을 로컬 작업 공간으로 다시 동기화합니다.
    - 파일 도구는 여전히 샌드박스 브리지를 통해 작동하지만, 턴 사이에는 로컬 작업 공간이 진실의 원천으로 남습니다.

    다음과 같은 경우 사용하세요:

    - OpenClaw 밖에서 로컬로 파일을 편집하고 해당 변경 사항이 샌드박스에 자동으로 표시되기를 원할 때
    - OpenShell 샌드박스가 가능한 한 Docker 백엔드처럼 동작하기를 원할 때
    - 각 exec 턴 이후 호스트 작업 영역에 샌드박스 쓰기 결과가 반영되기를 원할 때

    트레이드오프: exec 전후에 추가 동기화 비용이 듭니다.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell 작업 영역이 정본이 되도록** 하려면 `plugins.entries.openshell.config.mode: "remote"`를 사용하세요.

    동작:

    - 샌드박스가 처음 생성될 때 OpenClaw는 로컬 작업 영역에서 원격 작업 영역으로 한 번 시드합니다.
    - 그 이후에는 `exec`, `read`, `write`, `edit`, `apply_patch`가 원격 OpenShell 작업 영역에 직접 작동합니다.
    - OpenClaw는 exec 이후 원격 변경 사항을 로컬 작업 영역으로 다시 동기화하지 **않습니다**.
    - 프롬프트 시점의 미디어 읽기는 여전히 작동합니다. 파일 및 미디어 도구가 로컬 호스트 경로를 가정하는 대신 샌드박스 브리지를 통해 읽기 때문입니다.
    - 전송 방식은 `openshell sandbox ssh-config`가 반환한 OpenShell 샌드박스로 SSH 접속하는 것입니다.

    중요한 결과:

    - 시드 단계 이후 OpenClaw 밖에서 호스트의 파일을 편집하면 원격 샌드박스는 해당 변경 사항을 자동으로 보지 **못합니다**.
    - 샌드박스가 다시 생성되면 원격 작업 영역은 로컬 작업 영역에서 다시 시드됩니다.
    - `scope: "agent"` 또는 `scope: "shared"`를 사용하면 해당 원격 작업 영역은 같은 범위에서 공유됩니다.

    다음 경우에 사용하세요:

    - 샌드박스가 주로 원격 OpenShell 쪽에 있어야 할 때
    - 턴당 동기화 오버헤드를 줄이고 싶을 때
    - 호스트 로컬 편집이 원격 샌드박스 상태를 조용히 덮어쓰지 않게 하고 싶을 때

  </Tab>
</Tabs>

샌드박스를 임시 실행 환경으로 생각한다면 `mirror`를 선택하세요. 샌드박스를 실제 작업 영역으로 생각한다면 `remote`를 선택하세요.

#### OpenShell 수명 주기

OpenShell 샌드박스는 여전히 일반 샌드박스 수명 주기를 통해 관리됩니다.

- `openclaw sandbox list`는 Docker 런타임뿐 아니라 OpenShell 런타임도 표시합니다
- `openclaw sandbox recreate`는 현재 런타임을 삭제하고 다음 사용 시 OpenClaw가 다시 생성하게 합니다
- 정리 로직도 백엔드를 인식합니다

`remote` 모드에서는 재생성이 특히 중요합니다.

- 재생성은 해당 범위의 정본 원격 작업 영역을 삭제합니다
- 다음 사용 시 로컬 작업 영역에서 새 원격 작업 영역을 시드합니다

`mirror` 모드에서는 어차피 로컬 작업 영역이 정본으로 유지되므로 재생성은 주로 원격 실행 환경을 초기화합니다.

## 작업 영역 접근

`agents.defaults.sandbox.workspaceAccess`는 **샌드박스가 볼 수 있는 대상**을 제어합니다.

<Tabs>
  <Tab title="none (default)">
    도구는 `~/.openclaw/sandboxes` 아래의 샌드박스 작업 영역을 봅니다.
  </Tab>
  <Tab title="ro">
    에이전트 작업 영역을 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화).
  </Tab>
  <Tab title="rw">
    에이전트 작업 영역을 `/workspace`에 읽기/쓰기 권한으로 마운트합니다.
  </Tab>
</Tabs>

OpenShell 백엔드에서는 다음과 같습니다.

- `mirror` 모드는 exec 턴 사이에 여전히 로컬 작업 영역을 정본 소스로 사용합니다
- `remote` 모드는 초기 시드 이후 원격 OpenShell 작업 영역을 정본 소스로 사용합니다
- `workspaceAccess: "ro"`와 `"none"`은 쓰기 동작을 같은 방식으로 계속 제한합니다

인바운드 미디어는 활성 샌드박스 작업 영역(`media/inbound/*`)으로 복사됩니다.

<Note>
**Skills 참고:** `read` 도구는 샌드박스 루트를 기준으로 합니다. `workspaceAccess: "none"`에서는 OpenClaw가 읽을 수 있도록 대상 Skills를 샌드박스 작업 영역(`.../skills`)으로 미러링합니다. `"rw"`에서는 작업 영역 Skills를 `/workspace/skills`에서 읽을 수 있습니다.
</Note>

## 사용자 지정 바인드 마운트

`agents.defaults.sandbox.docker.binds`는 추가 호스트 디렉터리를 컨테이너에 마운트합니다. 형식: `host:container:mode`(예: `"/home/user/source:/source:rw"`).

전역 및 에이전트별 바인드는 **병합**됩니다(대체되지 않음). `scope: "shared"`에서는 에이전트별 바인드가 무시됩니다.

`agents.defaults.sandbox.browser.binds`는 추가 호스트 디렉터리를 **샌드박스 브라우저** 컨테이너에만 마운트합니다.

- 설정되면(`[]` 포함) 브라우저 컨테이너에 대해 `agents.defaults.sandbox.docker.binds`를 대체합니다.
- 생략되면 브라우저 컨테이너는 `agents.defaults.sandbox.docker.binds`로 폴백합니다(하위 호환).

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

<Warning>
**바인드 보안**

- 바인드는 샌드박스 파일 시스템을 우회합니다. 설정한 모드(`:ro` 또는 `:rw`) 그대로 호스트 경로를 노출합니다.
- OpenClaw는 위험한 바인드 소스를 차단합니다(예: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` 및 이를 노출할 수 있는 상위 마운트).
- OpenClaw는 `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh` 같은 일반적인 홈 디렉터리 자격 증명 루트도 차단합니다.
- 바인드 검증은 단순 문자열 매칭이 아닙니다. OpenClaw는 소스 경로를 정규화한 다음, 가장 깊이 존재하는 상위 경로를 통해 다시 해석한 뒤 차단된 경로와 허용된 루트를 다시 검사합니다.
- 즉, 최종 리프가 아직 존재하지 않더라도 심볼릭 링크 상위 경로를 통한 이탈은 안전하게 실패합니다. 예: `run-link`가 그곳을 가리키면 `/workspace/run-link/new-file`은 여전히 `/var/run/...`으로 해석됩니다.
- 허용된 소스 루트도 같은 방식으로 정규화되므로, 심볼릭 링크 해석 전에는 허용 목록 안처럼 보이는 경로도 `outside allowed roots`로 거부됩니다.
- 민감한 마운트(비밀, SSH 키, 서비스 자격 증명)는 반드시 필요한 경우가 아니라면 `:ro`여야 합니다.
- 작업 영역에 읽기 접근만 필요하다면 `workspaceAccess: "ro"`와 함께 사용하세요. 바인드 모드는 독립적으로 유지됩니다.
- 바인드가 도구 정책 및 승격된 exec와 어떻게 상호작용하는지는 [샌드박스와 도구 정책과 승격](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)을 참조하세요.

</Warning>

## 이미지 및 설정

기본 Docker 이미지: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    기본 이미지는 Node를 포함하지 **않습니다**. Skills에 Node(또는 다른 런타임)가 필요하다면 사용자 지정 이미지를 빌드하거나 `sandbox.docker.setupCommand`를 통해 설치하세요(네트워크 이그레스 + 쓰기 가능한 루트 + 루트 사용자 필요).

    `openclaw-sandbox:bookworm-slim`이 없을 때 OpenClaw는 일반 `debian:bookworm-slim`으로 조용히 대체하지 않습니다. 기본 이미지를 대상으로 하는 샌드박스 실행은 `scripts/sandbox-setup.sh`를 실행할 때까지 빌드 지침과 함께 빠르게 실패합니다. 번들 이미지에는 샌드박스 쓰기/편집 헬퍼용 `python3`가 포함되어 있기 때문입니다.

  </Step>
  <Step title="Optional: build the common image">
    일반적인 도구(예: `curl`, `jq`, `nodejs`, `python3`, `git`)가 포함된 더 기능적인 샌드박스 이미지를 원한다면:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    그런 다음 `agents.defaults.sandbox.docker.image`를 `openclaw-sandbox-common:bookworm-slim`으로 설정하세요.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

기본적으로 Docker 샌드박스 컨테이너는 **네트워크 없이** 실행됩니다. `agents.defaults.sandbox.docker.network`로 재정의하세요.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    번들 샌드박스 브라우저 이미지는 컨테이너화된 워크로드를 위한 보수적인 Chromium 시작 기본값도 적용합니다. 현재 컨테이너 기본값은 다음을 포함합니다.

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
    - `noSandbox`가 활성화된 경우 `--no-sandbox`.
    - 세 가지 그래픽 강화 플래그(`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`)는 선택 사항이며 컨테이너에 GPU 지원이 없을 때 유용합니다. 워크로드에 WebGL 또는 다른 3D/브라우저 기능이 필요하면 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`을 설정하세요.
    - `--disable-extensions`는 기본적으로 활성화되며, 확장 프로그램에 의존하는 흐름에서는 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 비활성화할 수 있습니다.
    - `--renderer-process-limit=2`는 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`로 제어되며, `0`은 Chromium의 기본값을 유지합니다.

    다른 런타임 프로필이 필요하면 사용자 지정 브라우저 이미지를 사용하고 자체 엔트리포인트를 제공하세요. 로컬(비컨테이너) Chromium 프로필의 경우 `browser.extraArgs`를 사용해 추가 시작 플래그를 덧붙이세요.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"`는 차단됩니다.
    - `network: "container:<id>"`는 기본적으로 차단됩니다(네임스페이스 조인 우회 위험).
    - 비상 재정의: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker 설치와 컨테이너화된 Gateway는 여기에 있습니다: [Docker](/ko/install/docker)

Docker Gateway 배포의 경우 `scripts/docker/setup.sh`가 샌드박스 구성을 부트스트랩할 수 있습니다. 해당 경로를 활성화하려면 `OPENCLAW_SANDBOX=1`(또는 `true`/`yes`/`on`)을 설정하세요. `OPENCLAW_DOCKER_SOCKET`으로 소켓 위치를 재정의할 수 있습니다. 전체 설정 및 환경 변수 참조: [Docker](/ko/install/docker#agent-sandbox).

## setupCommand(일회성 컨테이너 설정)

`setupCommand`는 샌드박스 컨테이너가 생성된 후 **한 번** 실행됩니다(매 실행마다가 아님). 컨테이너 내부에서 `sh -lc`를 통해 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- 에이전트별: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - 기본 `docker.network`는 `"none"`(이그레스 없음)이므로 패키지 설치가 실패합니다.
    - `docker.network: "container:<id>"`에는 `dangerouslyAllowContainerNamespaceJoin: true`가 필요하며 비상용으로만 사용해야 합니다.
    - `readOnlyRoot: true`는 쓰기를 막습니다. `readOnlyRoot: false`를 설정하거나 사용자 지정 이미지를 빌드하세요.
    - 패키지 설치를 위해서는 `user`가 루트여야 합니다(`user`를 생략하거나 `user: "0:0"` 설정).
    - 샌드박스 exec는 호스트 `process.env`를 상속하지 **않습니다**. Skills API 키에는 `agents.defaults.sandbox.docker.env`(또는 사용자 지정 이미지)를 사용하세요.

  </Accordion>
</AccordionGroup>

## 도구 정책 및 탈출구

도구 허용/거부 정책은 샌드박스 규칙보다 먼저 적용됩니다. 도구가 전역 또는 에이전트별로 거부된 경우 샌드박스가 이를 되살리지 않습니다.

`tools.elevated`는 명시적인 탈출구로, 샌드박스 밖에서 `exec`를 실행합니다(기본값은 `gateway`, exec 대상이 `node`인 경우 `node`). `/exec` 지시문은 권한 있는 발신자에게만 적용되며 세션별로 유지됩니다. `exec`를 강제로 비활성화하려면 도구 정책 거부를 사용하세요([샌드박스와 도구 정책과 승격](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) 참조).

디버깅:

- 유효한 샌드박스 모드, 도구 정책, 수정용 구성 키를 검사하려면 `openclaw sandbox explain`을 사용하세요.
- “왜 이것이 차단되나요?”라는 사고 모델은 [샌드박스와 도구 정책과 승격](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)을 참조하세요.

잠금 상태를 유지하세요.

## 다중 에이전트 재정의

각 에이전트는 샌드박스 + 도구를 재정의할 수 있습니다: `agents.list[].sandbox` 및 `agents.list[].tools`(그리고 샌드박스 도구 정책용 `agents.list[].tools.sandbox.tools`). 우선순위는 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

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

## 관련

- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) — 에이전트별 재정의 및 우선순위
- [OpenShell](/ko/gateway/openshell) — 관리형 샌드박스 백엔드 설정, 작업 영역 모드 및 구성 참조
- [샌드박스 구성](/ko/gateway/config-agents#agentsdefaultssandbox)
- [샌드박스 vs 도구 정책 vs 권한 상승](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) — "왜 이것이 차단되나요?" 디버깅
- [보안](/ko/gateway/security)
