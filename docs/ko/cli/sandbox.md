---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 샌드박스 런타임을 관리하고 유효한 샌드박스 정책을 검사합니다
title: Sandbox CLI
x-i18n:
    generated_at: "2026-06-27T17:19:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

샌드박스 런타임을 관리하여 격리된 에이전트 실행을 지원합니다.

## 개요

OpenClaw는 보안을 위해 격리된 샌드박스 런타임에서 에이전트를 실행할 수 있습니다. `sandbox` 명령은 업데이트나 구성 변경 후 해당 런타임을 검사하고 다시 생성하는 데 도움이 됩니다.

현재 이는 일반적으로 다음을 의미합니다.

- Docker 샌드박스 컨테이너
- `agents.defaults.sandbox.backend = "ssh"`일 때 SSH 샌드박스 런타임
- `agents.defaults.sandbox.backend = "openshell"`일 때 OpenShell 샌드박스 런타임

`ssh`와 OpenShell `remote`의 경우, Docker보다 다시 생성이 더 중요합니다.

- 원격 작업 영역은 초기 시드 이후 정본입니다.
- `openclaw sandbox recreate`는 선택한 범위의 정본 원격 작업 영역을 삭제합니다.
- 다음 사용 시 현재 로컬 작업 영역에서 다시 시드합니다.

## 명령

### `openclaw sandbox explain`

**유효한** 샌드박스 모드/범위/작업 영역 접근, 샌드박스 도구 정책, 상승 권한 게이트를 검사합니다(수정용 구성 키 경로 포함).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

모든 샌드박스 런타임을 상태 및 구성과 함께 나열합니다.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**출력에 포함되는 항목:**

- 런타임 이름 및 상태
- 백엔드(`docker`, `openshell` 등)
- 구성 레이블 및 현재 구성과 일치하는지 여부
- 나이(생성 이후 경과 시간)
- 유휴 시간(마지막 사용 이후 경과 시간)
- 연결된 세션/에이전트

### `openclaw sandbox recreate`

샌드박스 런타임을 제거하여 업데이트된 구성으로 다시 생성되도록 합니다.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**옵션:**

- `--all`: 모든 샌드박스 컨테이너를 다시 생성합니다.
- `--session <key>`: 특정 세션의 컨테이너를 다시 생성합니다.
- `--agent <id>`: 특정 에이전트의 컨테이너를 다시 생성합니다.
- `--browser`: 브라우저 컨테이너만 다시 생성합니다.
- `--force`: 확인 프롬프트를 건너뜁니다.

<Note>
런타임은 에이전트가 다음에 사용될 때 자동으로 다시 생성됩니다.
</Note>

## 사용 사례

### Docker 이미지를 업데이트한 후

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### 샌드박스 구성을 변경한 후

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### SSH 대상 또는 SSH 인증 자료를 변경한 후

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

코어 `ssh` 백엔드의 경우 다시 생성하면 SSH 대상의 범위별 원격 작업 영역 루트가 삭제됩니다. 다음 실행 시 로컬 작업 영역에서 다시 시드합니다.

### OpenShell 소스, 정책 또는 모드를 변경한 후

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

OpenShell `remote` 모드의 경우 다시 생성하면 해당 범위의 정본 원격 작업 영역이 삭제됩니다. 다음 실행 시 로컬 작업 영역에서 다시 시드합니다.

### setupCommand를 변경한 후

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### 특정 에이전트에만 적용

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## 이것이 필요한 이유

샌드박스 구성을 업데이트하면 다음과 같습니다.

- 기존 런타임은 이전 설정으로 계속 실행됩니다.
- 런타임은 24시간 동안 비활성 상태인 후에만 정리됩니다.
- 정기적으로 사용되는 에이전트는 이전 런타임을 무기한 유지합니다.

`openclaw sandbox recreate`를 사용하여 이전 런타임을 강제로 제거하세요. 다음에 필요할 때 현재 설정으로 자동으로 다시 생성됩니다.

<Tip>
수동 백엔드별 정리보다 `openclaw sandbox recreate`를 선호하세요. 이 명령은 Gateway의 런타임 레지스트리를 사용하며 범위 또는 세션 키가 변경될 때 불일치를 방지합니다.
</Tip>

## 레지스트리 마이그레이션

OpenClaw는 샌드박스 런타임 메타데이터를 공유 SQLite 상태 데이터베이스에 저장합니다. 이전 설치에는 여전히 레거시 샌드박스 레지스트리 파일이 있을 수 있습니다.

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

일부 업그레이드에는 `~/.openclaw/sandbox/containers/` 또는 `~/.openclaw/sandbox/browsers/` 아래에 컨테이너/브라우저별 JSON 샤드가 하나씩 있을 수도 있습니다. 일반적인 샌드박스 런타임 읽기는 이러한 레거시 소스를 다시 쓰지 않습니다. 유효한 레거시 항목을 SQLite로 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요. 유효하지 않은 레거시 파일은 격리되어, 문제가 있는 오래된 레지스트리 하나가 현재 런타임 항목을 숨기지 못하게 합니다.

## 구성

샌드박스 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 아래에 있습니다(에이전트별 재정의는 `agents.list[].sandbox`에 둡니다).

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [샌드박싱](/ko/gateway/sandboxing)
- [에이전트 작업 영역](/ko/concepts/agent-workspace)
- [Doctor](/ko/gateway/doctor): 샌드박스 설정을 확인합니다.
