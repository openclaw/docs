---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw 샌드박싱의 작동 방식: 모드, 범위, 워크스페이스 액세스 및 이미지'
title: 샌드박싱
x-i18n:
    generated_at: "2026-07-12T15:17:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw은 피해 범위를 줄이기 위해 샌드박스 백엔드 내에서 도구를 실행할 수 있습니다. 샌드박싱은 기본적으로 꺼져 있으며 `agents.defaults.sandbox`(전역) 또는 `agents.list[].sandbox`(에이전트별)로 제어합니다. Gateway 프로세스는 항상 호스트에 유지되며, 활성화된 경우 도구 실행만 샌드박스로 이동합니다.

<Note>
이는 완벽한 보안 경계는 아니지만, 모델이 잘못된 동작을 할 때 파일 시스템과 프로세스에 대한 접근을 실질적으로 제한합니다.
</Note>

## 샌드박싱되는 항목

- 도구 실행: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등
- 선택적 샌드박스 브라우저(`agents.defaults.sandbox.browser`)

샌드박싱되지 않는 항목:

- Gateway 프로세스 자체
- `tools.elevated`를 통해 샌드박스 외부에서 실행하도록 명시적으로 허용된 모든 도구. 권한 상승된 exec는 샌드박싱을 우회하고 구성된 탈출 경로(기본값은 `gateway`, exec 대상이 `node`이면 `node`)에서 실행됩니다. 샌드박싱이 꺼져 있으면 exec가 이미 호스트에서 실행되므로 `tools.elevated`는 아무것도 변경하지 않습니다. [권한 상승 모드](/ko/tools/elevated)를 참조하십시오.

## 모드, 범위 및 백엔드

서로 독립적인 세 가지 설정으로 샌드박스 동작을 제어합니다.

| 설정 | 키                                | 값                           | 기본값  |
| ------- | --------------------------------- | ---------------------------- | -------- |
| 모드    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| 범위    | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| 백엔드  | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**모드**는 샌드박싱이 적용되는 시점을 제어합니다.

- `off`: 샌드박싱하지 않습니다.
- `non-main`: 에이전트의 기본 세션을 제외한 모든 세션을 샌드박싱합니다. 기본 세션 키는 항상 `agent:<agentId>:main`(`session.scope`가 `"global"`이면 `global`)이며 구성할 수 없습니다. 그룹/채널 세션은 자체 키를 사용하므로 항상 기본 세션이 아닌 것으로 간주되어 샌드박싱됩니다.
- `all`: 모든 세션이 샌드박스에서 실행됩니다.

**범위**는 생성되는 컨테이너/환경 수를 제어합니다.

- `agent`: 에이전트당 하나의 컨테이너
- `session`: 세션당 하나의 컨테이너
- `shared`: 샌드박싱된 모든 세션이 공유하는 하나의 컨테이너(이 범위에서는 에이전트별 `docker`/`ssh`/`browser` 재정의가 무시됩니다)

**백엔드**는 샌드박싱된 도구를 실행할 런타임을 제어합니다. SSH 전용 구성은 `agents.defaults.sandbox.ssh`에 있으며, OpenShell 전용 구성은 `plugins.entries.openshell.config`에 있습니다.

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **실행 위치**       | 로컬 컨테이너                    | SSH로 접근 가능한 모든 호스트  | OpenShell 관리형 샌드박스                           |
| **설정**            | `scripts/sandbox-setup.sh`       | SSH 키 + 대상 호스트           | OpenShell Plugin 활성화                             |
| **워크스페이스 모델** | 바인드 마운트 또는 복사          | 원격 정본(한 번 시드)          | `mirror` 또는 `remote`                              |
| **네트워크 제어**   | `docker.network`(기본값: 없음)   | 원격 호스트에 따라 다름        | OpenShell에 따라 다름                               |
| **브라우저 샌드박스** | 지원됨                         | 지원되지 않음                  | 아직 지원되지 않음                                 |
| **바인드 마운트**   | `docker.binds`                   | 해당 없음                      | 해당 없음                                           |
| **권장 용도**       | 로컬 개발, 완전한 격리           | 원격 머신으로 작업 오프로딩    | 선택적 양방향 동기화를 제공하는 관리형 원격 샌드박스 |

## Docker 백엔드

샌드박싱을 활성화하면 Docker가 기본 백엔드입니다. Docker 데몬 소켓(`/var/run/docker.sock`)을 통해 도구와 샌드박스 브라우저를 로컬에서 실행하며, Docker 네임스페이스로 격리합니다.

기본값: `network: "none"`(외부 통신 없음), `readOnlyRoot: true`, `capDrop: ["ALL"]`, 이미지 `openclaw-sandbox:bookworm-slim`.

호스트 GPU를 노출하려면 `agents.defaults.sandbox.docker.gpus`(또는 에이전트별 재정의)를 `"all"`이나 `"device=GPU-uuid"` 같은 값으로 설정하십시오. 이 값은 Docker의 `--gpus` 플래그에 전달되며 NVIDIA Container Toolkit 같은 호환 호스트 런타임이 필요합니다.

<Warning>
**Docker-out-of-Docker(DooD) 제약 사항**

OpenClaw Gateway 자체를 Docker 컨테이너로 배포하면 호스트의 Docker 소켓을 사용하여 형제 샌드박스 컨테이너를 오케스트레이션합니다(DooD). 이로 인해 경로 매핑 제약이 발생합니다.

- **구성에는 호스트 경로가 필요합니다**: `openclaw.json`의 `workspace`에는 내부 Gateway 컨테이너 경로가 아니라 **호스트의 절대 경로**(예: `/home/user/.openclaw/workspaces`)가 포함되어야 합니다. Docker 데몬은 Gateway 자체의 네임스페이스가 아니라 호스트 OS 네임스페이스를 기준으로 경로를 평가합니다.
- **일치하는 볼륨 매핑이 필요합니다**: Gateway 프로세스도 해당 `workspace` 경로에 Heartbeat 및 브리지 파일을 씁니다. Gateway 컨테이너 내부에서도 동일한 호스트 경로가 올바르게 해석되도록 동일한 볼륨 매핑(`-v /home/user/.openclaw:/home/user/.openclaw`)을 지정하십시오. 매핑이 일치하지 않으면 Gateway가 Heartbeat를 쓰려고 할 때 `EACCES`가 발생합니다.
- **Codex 코드 모드**: OpenClaw 샌드박스가 활성화되면 OpenClaw은 해당 턴에 대해 Codex app-server 네이티브 Code Mode, 사용자 MCP 서버 및 앱 기반 Plugin 실행을 비활성화합니다. 이러한 기능은 OpenClaw 샌드박스 백엔드가 아닌 Gateway 호스트의 app-server 프로세스에서 실행되기 때문입니다. 단, 샌드박스 도구 정책이 필요한 도구를 노출하고 실험적 샌드박스 exec-server 경로를 사용하도록 명시적으로 설정한 경우는 예외입니다. 그러면 셸 접근은 `sandbox_exec` 및 `sandbox_process`와 같은 OpenClaw 샌드박스 기반 도구를 통해 라우팅됩니다. 호스트 Docker 소켓을 에이전트 샌드박스 컨테이너나 사용자 지정 Codex 샌드박스에 마운트하지 마십시오. 전체 동작은 [Codex Harness](/ko/plugins/codex-harness)를 참조하십시오.

Docker 샌드박스 모드가 활성화된 Ubuntu/AppArmor 호스트에서 Codex app-server의 `workspace-write` 셸 실행에는 샌드박스 컨테이너 내부의 비특권 사용자 네임스페이스가 필요하며, 서비스 사용자가 이를 생성할 수 없으면 셸이 시작되기 전에 실패할 수 있습니다. Docker 샌드박스의 외부 통신이 비활성화된 경우(`network: "none"`, 기본값)에는 비특권 네트워크 네임스페이스도 필요합니다. 일반적인 증상은 `bwrap: setting up uid map: Permission denied`와 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`입니다. `openclaw doctor`를 실행하십시오. Codex bwrap 네임스페이스 프로브 실패가 보고되면 OpenClaw 서비스 프로세스에 필요한 네임스페이스를 허용하는 AppArmor 프로필을 사용하는 것이 좋습니다. `kernel.apparmor_restrict_unprivileged_userns=0`은 보안상 절충이 따르는 호스트 전체 대체 설정이므로 해당 호스트의 보안 태세에서 허용되는 경우에만 사용하십시오.
</Warning>

### 샌드박스 브라우저

- 브라우저 도구에 필요할 때 샌드박스 브라우저가 자동 시작되어 CDP에 접근할 수 있도록 합니다. `agents.defaults.sandbox.browser.autoStart`(기본값 `true`)와 `autoStartTimeoutMs`(기본값 12s)로 구성하십시오.
- 샌드박스 브라우저 컨테이너는 전역 `bridge` 네트워크 대신 전용 Docker 네트워크(`openclaw-sandbox-browser`)를 사용합니다. `agents.defaults.sandbox.browser.network`로 구성하십시오.
- `agents.defaults.sandbox.browser.cdpSourceRange`는 CIDR 허용 목록(예: `172.21.0.1/32`)을 사용하여 컨테이너 경계의 CDP 인바운드 접근을 제한합니다.
- noVNC 관찰자 접근은 기본적으로 비밀번호로 보호됩니다. OpenClaw은 로컬 부트스트랩 페이지를 제공하고 URL 프래그먼트에 비밀번호를 포함하여 noVNC를 여는 단기 토큰 URL을 생성합니다. 비밀번호는 쿼리 문자열이나 헤더 로그에는 포함되지 않습니다.
- `agents.defaults.sandbox.browser.allowHostControl`(기본값 `false`)을 사용하면 샌드박싱된 세션이 호스트 브라우저를 명시적으로 대상으로 지정할 수 있습니다.
- 선택적 허용 목록 `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`는 `target: "custom"` 사용을 제한합니다.

## SSH 백엔드

임의의 SSH 접근 가능 머신에서 `exec`, 파일 도구 및 미디어 읽기를 샌드박싱하려면 `backend: "ssh"`를 사용하십시오.

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
          // 또는 로컬 파일 대신 SecretRefs/인라인 콘텐츠를 사용합니다:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

기본값: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **수명 주기**: OpenClaw은 `sandbox.ssh.workspaceRoot` 아래에 범위별 원격 루트를 생성합니다. 생성 또는 재생성 후 처음 사용할 때 로컬 워크스페이스에서 원격 워크스페이스로 한 번 시드합니다. 이후 `exec`, `read`, `write`, `edit`, `apply_patch`, 프롬프트 미디어 읽기 및 수신 미디어 스테이징은 SSH를 통해 원격 워크스페이스를 직접 대상으로 실행됩니다. OpenClaw은 원격 변경 사항을 로컬 워크스페이스로 자동 동기화하지 않습니다.
- **인증 자료**: `identityFile`/`certificateFile`/`knownHostsFile`은 기존 로컬 파일을 참조합니다. `identityData`/`certificateData`/`knownHostsData`는 인라인 문자열 또는 SecretRefs를 허용하며, 일반 시크릿 런타임 스냅샷을 통해 해석되고 모드 `0600`의 임시 파일에 기록된 후 SSH 세션 종료 시 삭제됩니다. 동일한 항목에 `*File` 및 `*Data` 변형이 모두 설정된 경우 해당 세션에서는 `*Data`가 우선합니다.
- **원격 정본의 결과**: 초기 시드 이후 원격 SSH 워크스페이스가 실제 샌드박스 상태가 됩니다. 시드 단계 후 OpenClaw 외부에서 수행한 호스트 로컬 편집은 샌드박스를 재생성할 때까지 원격에 표시되지 않습니다. `openclaw sandbox recreate`는 범위별 원격 루트를 삭제하며, 다음 사용 시 로컬에서 다시 시드합니다. 이 백엔드는 브라우저 샌드박싱을 지원하지 않으며 `sandbox.docker.*` 설정도 적용되지 않습니다.

## OpenShell 백엔드

OpenShell이 관리하는 원격 환경에서 도구를 샌드박싱하려면 `backend: "openshell"`을 사용하십시오. OpenShell은 일반 SSH 백엔드와 동일한 SSH 전송 및 원격 파일 시스템 브리지를 재사용하며, OpenShell 수명 주기(`sandbox create/get/delete/ssh-config`)와 선택적 `mirror` 워크스페이스 동기화 모드를 추가합니다.

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
        },
      },
    },
  },
}
```

`mode: "mirror"`(기본값)는 로컬 워크스페이스를 정본으로 유지합니다. OpenClaw은 `exec` 실행 전에 로컬을 샌드박스로 동기화하고 실행 후 다시 로컬로 동기화합니다. `mode: "remote"`는 로컬에서 원격 워크스페이스로 한 번 시드한 다음, 다시 동기화하지 않고 원격 워크스페이스를 직접 대상으로 `exec`/`read`/`write`/`edit`/`apply_patch`를 실행합니다. 시드 이후의 로컬 편집은 `openclaw sandbox recreate`를 실행할 때까지 보이지 않습니다. `scope: "agent"` 또는 `scope: "shared"`에서는 해당 원격 워크스페이스가 동일한 범위에서 공유됩니다. 현재 제한 사항: 샌드박스 브라우저는 아직 지원되지 않으며 `sandbox.docker.binds`는 이 백엔드에 적용되지 않습니다.

`openclaw sandbox list`/`recreate`/prune은 모두 OpenShell 런타임을 Docker 런타임과 동일하게 처리하며, prune 로직은 백엔드를 인식합니다.

전체 사전 요구 사항, 구성 참조, 워크스페이스 모드 비교 및 수명 주기 세부 정보는 [OpenShell](/ko/gateway/openshell)을 참조하십시오.

## 워크스페이스 접근

`agents.defaults.sandbox.workspaceAccess`는 샌드박스에서 볼 수 있는 항목을 제어합니다.

| 값               | 동작                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (기본값)  | 도구는 `~/.openclaw/sandboxes` 아래의 격리된 샌드박스 작업 공간을 사용합니다.             |
| `ro`             | 에이전트 작업 공간을 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화). |
| `rw`             | 에이전트 작업 공간을 `/workspace`에 읽기/쓰기 가능으로 마운트합니다.                      |

OpenShell 백엔드에서는 `mirror` 모드가 exec 실행 사이에 계속 로컬 작업 공간을 정식 소스로 사용하고, `remote` 모드는 초기 시드 후 원격 OpenShell 작업 공간을 정식 소스로 사용하며, `workspaceAccess: "ro"`/`"none"`은 여전히 동일한 방식으로 쓰기 동작을 제한합니다.

수신 미디어는 활성 샌드박스 작업 공간(`media/inbound/*`)으로 복사됩니다.

<Note>
**Skills**: `read` 도구의 루트는 샌드박스입니다. `workspaceAccess: "none"`이면 OpenClaw는 읽을 수 있도록 대상 Skills를 샌드박스 작업 공간(`.../skills`)에 미러링합니다. `"rw"`이면 작업 공간 Skills는 `/workspace/skills`에서 읽을 수 있으며, 대상에 해당하는 관리형, 번들 또는 Plugin Skills는 생성된 읽기 전용 경로 `/workspace/.openclaw/sandbox-skills/skills`에 구체화됩니다.
</Note>

## 사용자 지정 바인드 마운트

`agents.defaults.sandbox.docker.binds`는 추가 호스트 디렉터리를 컨테이너에 마운트합니다. 형식: `host:container:mode`(예: `"/home/user/source:/source:rw"`).

전역 바인드와 에이전트별 바인드는 병합됩니다(대체되지 않음). `scope: "shared"`에서는 에이전트별 바인드가 무시됩니다.

`agents.defaults.sandbox.browser.binds`는 추가 호스트 디렉터리를 **샌드박스 브라우저** 컨테이너에만 마운트합니다. 이 항목이 설정되면(`[]` 포함) 브라우저 컨테이너에서 `docker.binds`를 대체하며, 생략하면 브라우저 컨테이너는 `docker.binds`를 대신 사용합니다.

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

- 바인드는 샌드박스 파일 시스템을 우회합니다. 설정한 모드(`:ro` 또는 `:rw`)로 호스트 경로를 노출합니다.
- OpenClaw는 기본적으로 위험한 바인드 소스를 차단합니다. 시스템 경로(`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), Docker 소켓 디렉터리(`/run`, `/var/run` 및 해당 `docker.sock` 변형), 일반적인 홈 디렉터리 자격 증명 루트(`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`)가 해당합니다.
- 검증은 소스 경로를 정규화한 다음, 차단된 경로와 허용된 루트를 다시 확인하기 전에 존재하는 가장 깊은 상위 경로를 통해 다시 해석합니다. 따라서 최종 하위 경로가 아직 존재하지 않더라도 심볼릭 링크 상위 경로를 통한 이탈은 안전하게 차단됩니다(예: `run-link`가 해당 위치를 가리키면 `/workspace/run-link/new-file`은 여전히 `/var/run/...`으로 해석됩니다).
- 예약된 컨테이너 마운트 지점(`/workspace`, `/agent`)을 가리는 바인드 대상도 기본적으로 차단됩니다. 재정의하려면 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`를 사용하십시오.
- 작업 공간/에이전트 작업 공간 허용 목록 루트 외부의 바인드 소스는 기본적으로 차단됩니다. 재정의하려면 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`를 사용하십시오. 허용된 루트도 동일한 방식으로 정규화되므로, 심볼릭 링크 해석 전에는 허용 목록 내부처럼 보이지만 해석 후 허용된 루트 외부에 있는 경로는 여전히 거부됩니다.
- 민감한 마운트(비밀 정보, SSH 키, 서비스 자격 증명)는 반드시 필요한 경우가 아니면 `:ro`여야 합니다.
- 작업 공간에 대한 읽기 액세스만 필요한 경우 `workspaceAccess: "ro"`와 함께 사용하십시오. 바인드 모드는 독립적으로 유지됩니다.
- 바인드가 도구 정책 및 권한 상승 exec와 상호 작용하는 방식은 [샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)를 참조하십시오.

</Warning>

## 이미지 및 설정

기본 Docker 이미지: `openclaw-sandbox:bookworm-slim`

<Note>
**소스 체크아웃과 npm 설치 비교**

`scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh`, `scripts/sandbox-browser-setup.sh` 도우미 스크립트는 [소스 체크아웃](https://github.com/openclaw/openclaw)에서 실행할 때만 사용할 수 있습니다. npm 패키지에는 포함되지 않습니다.

`npm install -g openclaw`을 통해 OpenClaw를 설치한 경우 아래에 표시된 인라인 `docker build` 명령을 대신 사용하십시오.
</Note>

<Steps>
  <Step title="기본 이미지 빌드">
    소스 체크아웃에서:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm 설치에서(소스 체크아웃 불필요):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    기본 이미지에는 Node가 포함되어 있지 **않습니다**. Skills에 Node(또는 다른 런타임)가 필요한 경우 사용자 지정 이미지에 포함하거나 `sandbox.docker.setupCommand`를 통해 설치하십시오(네트워크 송신 액세스 + 쓰기 가능한 루트 + 루트 사용자 필요).

    `openclaw-sandbox:bookworm-slim`이 없을 때 OpenClaw는 일반 `debian:bookworm-slim`으로 자동 대체하지 않습니다. 기본 이미지를 대상으로 하는 샌드박스 실행은 이미지를 빌드할 때까지 빌드 지침과 함께 즉시 실패합니다. 번들 이미지에는 샌드박스 쓰기/편집 도우미에 필요한 `python3`가 포함되어 있기 때문입니다.

  </Step>
  <Step title="선택 사항: 공통 이미지 빌드">
    일반적인 도구(예: `curl`, `jq`, Node 24, pnpm, `python3`, `git`)가 포함된 더 다양한 기능의 샌드박스 이미지를 사용하려면:

    소스 체크아웃에서:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm 설치에서는 먼저 기본 이미지를 빌드하고(위 참조), 저장소의 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common)을 사용하여 그 위에 공통 이미지를 빌드하십시오.

    그런 다음 `agents.defaults.sandbox.docker.image`를 `openclaw-sandbox-common:bookworm-slim`으로 설정합니다.

  </Step>
  <Step title="선택 사항: 샌드박스 브라우저 이미지 빌드">
    소스 체크아웃에서는 다음을 실행합니다.

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm 설치 환경에서는 저장소의 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser)를 사용하여 빌드합니다.

  </Step>
</Steps>

기본적으로 Docker 샌드박스 컨테이너는 **네트워크 없이** 실행됩니다. `agents.defaults.sandbox.docker.network`로 재정의합니다.

<AccordionGroup>
  <Accordion title="샌드박스 브라우저 Chromium 기본값">
    번들 샌드박스 브라우저 이미지는 컨테이너화된 워크로드를 위해 보수적인 Chromium 시작 플래그를 적용합니다.

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `browser.headless`가 활성화된 경우 `--headless=new`.
    - `browser.noSandbox`가 활성화된 경우 `--no-sandbox --disable-setuid-sandbox`.
    - 기본적으로 `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`가 적용됩니다. 이러한 그래픽 강화 플래그는 GPU를 지원하지 않는 컨테이너에 유용합니다. 워크로드에 WebGL 또는 기타 3D 기능이 필요한 경우 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`을 설정합니다.
    - 기본적으로 `--disable-extensions`가 적용됩니다. 확장 프로그램에 의존하는 흐름에서는 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`을 설정합니다.
    - 기본적으로 `--renderer-process-limit=2`가 적용됩니다. `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 제어하며, `0`으로 설정하면 Chromium의 기본값을 유지합니다.

    다른 런타임 프로필이 필요하면 사용자 지정 브라우저 이미지를 사용하고 자체 엔트리포인트를 제공합니다. 로컬(비컨테이너) Chromium 프로필에서는 `browser.extraArgs`를 사용하여 추가 시작 플래그를 덧붙입니다.

  </Accordion>
  <Accordion title="네트워크 보안 기본값">
    - `network: "host"`는 차단됩니다.
    - `network: "container:<id>"`는 기본적으로 차단됩니다(네임스페이스 참여 우회 위험).
    - 비상 재정의: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker 설치 및 컨테이너화된 Gateway에 대한 내용은 여기에서 확인할 수 있습니다: [Docker](/ko/install/docker)

Docker Gateway 배포에서는 `scripts/docker/setup.sh`가 샌드박스 구성을 부트스트랩할 수 있습니다. 해당 경로를 활성화하려면 `OPENCLAW_SANDBOX=1`(또는 `true`/`yes`/`on`)을 설정합니다. `OPENCLAW_DOCKER_SOCKET`으로 소켓 위치를 재정의합니다. 전체 설정 및 환경 변수 참조: [Docker](/ko/install/docker#agent-sandbox).

## setupCommand(일회성 컨테이너 설정)

`setupCommand`는 샌드박스 컨테이너가 생성된 후 **한 번만** 실행됩니다(실행할 때마다 실행되지 않음). 컨테이너 내부에서 `sh -lc`를 통해 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- 에이전트별: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="일반적인 문제">
    - 기본 `docker.network`는 `"none"`(외부 통신 없음)이므로 패키지 설치가 실패합니다.
    - `docker.network: "container:<id>"`에는 `dangerouslyAllowContainerNamespaceJoin: true`가 필요하며 비상시에만 사용해야 합니다.
    - `readOnlyRoot: true`는 쓰기를 방지합니다. `readOnlyRoot: false`로 설정하거나 사용자 지정 이미지를 빌드합니다.
    - 패키지를 설치하려면 `user`가 root여야 합니다(`user`를 생략하거나 `user: "0:0"`으로 설정).
    - 샌드박스 exec는 호스트의 `process.env`를 상속하지 **않습니다**. Skills API 키에는 `agents.defaults.sandbox.docker.env`(또는 사용자 지정 이미지)를 사용합니다.
    - `agents.defaults.sandbox.docker.env`의 값은 명시적인 Docker 컨테이너 환경 변수로 전달됩니다. Docker 데몬에 액세스할 수 있는 사람은 누구나 `docker inspect`와 같은 Docker 메타데이터 명령으로 해당 값을 확인할 수 있습니다. 이러한 메타데이터 노출을 허용할 수 없다면 사용자 지정 이미지, 마운트된 비밀 파일 또는 다른 비밀 전달 경로를 사용합니다.

  </Accordion>
</AccordionGroup>

## 도구 정책 및 탈출구

도구 허용/거부 정책은 샌드박스 규칙보다 먼저 적용됩니다. 도구가 전역 또는 에이전트별로 거부된 경우 샌드박싱으로 다시 활성화할 수 없습니다.

`tools.elevated`는 샌드박스 외부에서 `exec`를 실행하는 명시적인 탈출구입니다(기본값은 `gateway`이며, exec 대상이 `node`인 경우 `node`). `/exec` 지시문은 승인된 발신자에게만 적용되고 세션별로 유지됩니다. `exec`를 완전히 비활성화하려면 도구 정책의 거부 설정을 사용합니다([샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) 참조).

디버깅:

- `openclaw sandbox list`는 샌드박스 컨테이너, 상태, 이미지 일치 여부, 생성 후 경과 시간, 유휴 시간 및 연결된 세션/에이전트를 표시합니다.
- `openclaw sandbox explain [--session <key>] [--agent <id>]`는 유효한 샌드박스 모드, 호스트 작업 공간, 런타임 작업 디렉터리, Docker 마운트, 도구 정책 및 수정 구성 키를 검사합니다. `workspaceRoot` 필드는 구성된 샌드박스 루트를 계속 나타내며, `effectiveHostWorkspaceRoot`는 활성 작업 공간이 실제로 위치한 곳을 보여 줍니다.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]`는 다음 사용 시 현재 구성으로 다시 생성되도록 컨테이너/환경을 제거합니다.
- "왜 이것이 차단되나요?"라는 개념적 모델은 [샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)를 참조하십시오.

## 다중 에이전트 재정의

각 에이전트는 샌드박스와 도구를 재정의할 수 있습니다: `agents.list[].sandbox` 및 `agents.list[].tools`(샌드박스 도구 정책의 경우 `agents.list[].tools.sandbox.tools`도 포함). 우선순위는 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하십시오.

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

- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의 및 우선순위
- [OpenShell](/ko/gateway/openshell) -- 관리형 샌드박스 백엔드 설정, 작업 공간 모드 및 구성 참조
- [샌드박스 구성](/ko/gateway/config-agents#agentsdefaultssandbox)
- [샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) -- "왜 이것이 차단됩니까?" 디버깅
- [보안](/ko/gateway/security)
