---
read_when:
    - Docker로 OpenClaw을 자주 실행하며 일상적으로 사용하는 명령을 더 짧게 만들고 싶습니다
    - 대시보드, 로그, 토큰 설정 및 페어링 흐름을 위한 도우미 계층이 필요합니다
summary: Docker 기반 OpenClaw 설치용 ClawDock 셸 도우미
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T15:20:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock은 Docker 기반 OpenClaw 설치를 위한 작은 셸 도우미 계층입니다.

긴 `docker compose ...` 호출 대신 `clawdock-start`, `clawdock-dashboard`, `clawdock-fix-token`과 같은 짧은 명령을 사용할 수 있습니다.

아직 Docker를 설정하지 않았다면 [Docker](/ko/install/docker)부터 시작하십시오.

## 설치

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전에 `scripts/shell-helpers/clawdock-helpers.sh`에서 ClawDock을 설치했다면 현재 경로인 `scripts/clawdock/clawdock-helpers.sh`에서 다시 설치하십시오. 이전 GitHub 원시 콘텐츠 경로는 제거되었습니다.

도우미는 처음 사용할 때 OpenClaw 체크아웃을 자동으로 감지하며(`~/openclaw`, `~/projects/openclaw` 같은 일반적인 경로 확인), 결과를 `~/.clawdock/config`에 캐시합니다. 체크아웃이 다른 위치에 있다면 `CLAWDOCK_DIR`을 직접 설정하십시오.

## 제공 기능

### 기본 작업

| 명령               | 설명                  |
| ------------------ | --------------------- |
| `clawdock-start`   | Gateway를 시작합니다  |
| `clawdock-stop`    | Gateway를 중지합니다  |
| `clawdock-restart` | Gateway를 재시작합니다 |
| `clawdock-status`  | 컨테이너 상태를 확인합니다 |
| `clawdock-logs`    | Gateway 로그를 실시간으로 확인합니다 |

### 컨테이너 접근

| 명령                      | 설명                                      |
| ------------------------- | ----------------------------------------- |
| `clawdock-shell`          | Gateway 컨테이너 내부에서 셸을 엽니다     |
| `clawdock-cli <command>`  | Docker에서 OpenClaw CLI 명령을 실행합니다 |
| `clawdock-exec <command>` | 컨테이너에서 임의의 명령을 실행합니다     |

### 웹 UI 및 페어링

| 명령                    | 설명                              |
| ----------------------- | --------------------------------- |
| `clawdock-dashboard`    | Control UI URL을 엽니다            |
| `clawdock-devices`      | 대기 중인 기기 페어링을 나열합니다 |
| `clawdock-approve <id>` | 페어링 요청을 승인합니다           |

### 설정 및 유지 관리

| 명령                 | 설명                                           |
| -------------------- | ---------------------------------------------- |
| `clawdock-fix-token` | 컨테이너 구성에 Gateway 토큰을 기록합니다      |
| `clawdock-update`    | 가져오기, 재빌드 및 재시작을 수행합니다        |
| `clawdock-rebuild`   | Docker 이미지만 재빌드합니다                   |
| `clawdock-clean`     | 컨테이너와 볼륨을 제거합니다                   |

### 유틸리티

| 명령                   | 설명                                         |
| ---------------------- | -------------------------------------------- |
| `clawdock-health`      | Gateway 상태 검사를 실행합니다               |
| `clawdock-token`       | Gateway 토큰을 출력합니다                    |
| `clawdock-cd`          | OpenClaw 프로젝트 디렉터리로 이동합니다      |
| `clawdock-config`      | `~/.openclaw`을 엽니다                       |
| `clawdock-show-config` | 민감한 값을 가린 구성 파일을 출력합니다      |
| `clawdock-workspace`   | 워크스페이스 디렉터리를 엽니다               |
| `clawdock-help`        | 모든 ClawDock 명령을 나열합니다              |

## 최초 실행 절차

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

브라우저에 페어링이 필요하다고 표시되면 다음을 실행하십시오.

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 구성 및 비밀 정보

ClawDock은 [Docker](/ko/install/docker)에 설명된 분리 방식에 따라 두 개의 별도 `.env` 파일을 읽습니다.

- `docker-compose.yml` 옆에 있는 프로젝트 `.env`: 이미지 이름, 포트, `OPENCLAW_GATEWAY_TOKEN` 같은 Docker 전용 값입니다. `clawdock-token`은 여기에서 토큰을 읽습니다.
- `~/.openclaw/.env`(컨테이너에 마운트됨): OpenClaw 자체에서 관리하는 환경 변수 기반 비밀 정보이며, `openclaw.json` 및 `agents/<agentId>/agent/auth-profiles.json`과 함께 사용됩니다.

`clawdock-fix-token`은 프로젝트 `.env`의 토큰을 컨테이너의 `gateway.remote.token` 및 `gateway.auth.token` 구성 값에 복사하고 Gateway를 재시작합니다.

`clawdock-show-config`를 사용하면 `openclaw.json`과 두 `.env` 파일을 빠르게 검사할 수 있습니다. 출력할 때 `.env` 값은 가려집니다.

## 관련 문서

<CardGroup cols={2}>
  <Card title="Docker" href="/ko/install/docker" icon="docker">
    OpenClaw의 표준 Docker 설치 방법입니다.
  </Card>
  <Card title="Docker VM 런타임" href="/ko/install/docker-vm-runtime" icon="cube">
    강화된 격리를 위한 Docker 관리형 VM 런타임입니다.
  </Card>
  <Card title="업데이트" href="/ko/install/updating" icon="arrow-up-right-from-square">
    OpenClaw 패키지와 관리형 서비스를 업데이트합니다.
  </Card>
</CardGroup>
