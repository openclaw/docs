---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 샌드박스 런타임 관리 및 유효한 샌드박스 정책 검사
title: 샌드박스 CLI
x-i18n:
    generated_at: "2026-07-12T00:40:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

격리된 에이전트 실행을 위한 샌드박스 런타임(Docker 컨테이너, SSH 대상 또는 OpenShell 백엔드)을 관리합니다.

## 명령어

### `openclaw sandbox list`

샌드박스 런타임의 상태, 백엔드, 구성 일치 여부, 생성 후 경과 시간, 유휴 시간 및 연결된 세션/에이전트를 나열합니다.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 브라우저 컨테이너만
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

현재 구성으로 강제로 다시 생성하도록 샌드박스 런타임을 제거합니다. 다음에 에이전트를 사용할 때 런타임이 자동으로 다시 생성됩니다.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # agent:mybot:* 하위 세션 포함
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # 브라우저 컨테이너만
openclaw sandbox recreate --all --force        # 확인 생략
```

옵션:

- `--all`: 모든 샌드박스 컨테이너를 다시 생성
- `--session <key>`: 이 정확한 범위 키(`sandbox list`에 표시된 값)의 런타임을 다시 생성하며, 짧은 이름은 확장하지 않음
- `--agent <id>`: 한 에이전트의 런타임을 다시 생성(`agent:<id>` 및 `agent:<id>:*`와 일치)
- `--browser`: 브라우저 컨테이너에만 적용
- `--force`: 확인 프롬프트 생략

`--all`, `--session`, `--agent` 중 정확히 하나를 전달하세요.

`ssh` 및 OpenShell `remote`에서 다시 생성은 Docker보다 더 중요합니다. 초기 시드 이후 원격 작업 공간이 기준 작업 공간이 되며, `recreate`는 선택한 범위의 해당 기준 원격 작업 공간을 삭제하고 다음 실행 시 현재 로컬 작업 공간에서 다시 시드합니다.

### `openclaw sandbox explain`

적용되는 샌드박스 모드/범위/작업 공간 접근 권한, 샌드박스 도구 정책 및 권한 상승 도구 게이트를 검사합니다(수정에 필요한 구성 키 경로 포함).

보고서에서는 `workspaceRoot`를 구성된 샌드박스 루트로 유지하면서 적용되는 호스트 작업 공간, 백엔드 런타임 작업 디렉터리 및 Docker 마운트 표를 별도로 표시합니다. `workspaceAccess: "rw"`인 경우 적용되는 호스트 작업 공간은 `workspaceRoot` 아래의 디렉터리가 아니라 에이전트 작업 공간입니다.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

`recreate --session`과 달리 이 명령은 짧은 세션 이름(예: `main`)을 허용하며, 확인된 에이전트를 기준으로 해당 이름을 확장합니다.

## 다시 생성해야 하는 이유

샌드박스 구성을 업데이트해도 실행 중인 컨테이너에는 영향을 주지 않습니다. 기존 런타임은 이전 설정을 유지하며, 유휴 런타임은 `prune.idleHours`(기본값 24시간)가 지난 후에만 정리됩니다. 정기적으로 사용하는 에이전트에서는 오래된 런타임이 무기한 유지될 수 있습니다. `openclaw sandbox recreate`는 이전 런타임을 제거하여 다음 사용 시 현재 구성으로 다시 빌드되도록 합니다.

<Tip>
백엔드별 수동 정리보다 `openclaw sandbox recreate`를 사용하세요. 이 명령은 Gateway의 런타임 레지스트리를 사용하므로 범위 또는 세션 키가 변경될 때 불일치가 발생하지 않습니다.
</Tip>

## 일반적인 실행 계기

| 변경 사항                                                                                                                                                       | 명령어                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docker 이미지 업데이트(`agents.defaults.sandbox.docker.image`)                                                                                                 | `openclaw sandbox recreate --all`                                   |
| 샌드박스 구성(`agents.defaults.sandbox.*`)                                                                                                                     | `openclaw sandbox recreate --all`                                   |
| SSH 대상/인증(`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`)     | `openclaw sandbox recreate --all`                                   |
| OpenShell 소스/정책/모드(`plugins.entries.openshell.config.{from,mode,policy}`)                                                                                 | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all`(또는 한 에이전트에는 `--agent <id>`) |

<Note>
다음에 에이전트를 사용할 때 런타임이 자동으로 다시 생성됩니다.
</Note>

## 레지스트리 마이그레이션

샌드박스 런타임 메타데이터는 공유 SQLite 상태 데이터베이스에 저장됩니다. 이전 설치에는 일반적인 읽기 작업으로 더 이상 다시 기록되지 않는 레거시 레지스트리 파일이 있을 수 있습니다.

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- `~/.openclaw/sandbox/containers/` 또는 `~/.openclaw/sandbox/browsers/` 아래의 컨테이너/브라우저별 JSON 샤드 하나

유효한 레거시 항목을 SQLite로 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요. 손상된 이전 레지스트리가 현재 런타임 항목을 숨길 수 없도록 유효하지 않은 레거시 파일은 격리됩니다.

## 구성

샌드박스 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 아래에 있습니다(에이전트별 재정의는 `agents.list[].sandbox`에 설정).

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (Plugin 제공)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... 추가 Docker 옵션
        },
        "prune": {
          "idleHours": 24, // 24시간 유휴 후 자동 정리
          "maxAgeDays": 7, // 7일 후 자동 정리
        },
      },
    },
  },
}
```

## 관련 문서

- [CLI 참조](/ko/cli)
- [샌드박싱](/ko/gateway/sandboxing)
- [에이전트 작업 공간](/ko/concepts/agent-workspace)
- [Doctor](/ko/gateway/doctor): 샌드박스 설정을 확인합니다.
