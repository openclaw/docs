---
read_when:
    - Docker로 OpenClaw를 자주 실행하며 일상적으로 사용하는 명령어를 더 짧게 만들고 싶은 경우
    - 대시보드, 로그, 토큰 설정 및 페어링 흐름을 위한 헬퍼 계층이 필요합니다
summary: Docker 기반 OpenClaw 설치를 위한 ClawDock 셸 도우미
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T00:50:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock은 Docker 기반 OpenClaw 설치를 위한 소규모 셸 도우미 계층입니다.

긴 `docker compose ...` 호출 대신 `clawdock-start`, `clawdock-dashboard`, `clawdock-fix-token` 같은 짧은 명령을 사용할 수 있습니다.

아직 Docker를 설정하지 않았다면 [Docker](/ko/install/docker)부터 시작하세요.

## 설치

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전에 `scripts/shell-helpers/clawdock-helpers.sh`에서 ClawDock을 설치했다면 현재 경로인 `scripts/clawdock/clawdock-helpers.sh`에서 다시 설치하세요. 이전 GitHub 원시 파일 경로는 삭제되었습니다.

도우미는 처음 사용할 때 OpenClaw 체크아웃을 자동으로 감지하고(`~/openclaw`, `~/projects/openclaw` 같은 일반적인 경로 확인) 결과를 `~/.clawdock/config`에 캐시합니다. 체크아웃이 다른 위치에 있다면 `CLAWDOCK_DIR`을 직접 설정하세요.

## 제공 기능

### 기본 작업

| 명령               | 설명                    |
| ------------------ | ----------------------- |
| `clawdock-start`   | Gateway 시작            |
| `clawdock-stop`    | Gateway 중지            |
| `clawdock-restart` | Gateway 다시 시작       |
| `clawdock-status`  | 컨테이너 상태 확인      |
| `clawdock-logs`    | Gateway 로그 실시간 확인 |

### 컨테이너 접근

| 명령                      | 설명                                  |
| ------------------------- | ------------------------------------- |
| `clawdock-shell`          | Gateway 컨테이너 내부에서 셸 열기     |
| `clawdock-cli <command>`  | Docker에서 OpenClaw CLI 명령 실행     |
| `clawdock-exec <command>` | 컨테이너에서 임의의 명령 실행         |

### 웹 UI 및 페어링

| 명령                    | 설명                          |
| ----------------------- | ----------------------------- |
| `clawdock-dashboard`    | 제어 UI URL 열기              |
| `clawdock-devices`      | 대기 중인 기기 페어링 목록 표시 |
| `clawdock-approve <id>` | 페어링 요청 승인              |

### 설정 및 유지보수

| 명령                 | 설명                                          |
| -------------------- | --------------------------------------------- |
| `clawdock-fix-token` | 컨테이너 구성에 Gateway 토큰 쓰기             |
| `clawdock-update`    | 가져오기, 다시 빌드 및 다시 시작              |
| `clawdock-rebuild`   | Docker 이미지만 다시 빌드                     |
| `clawdock-clean`     | 컨테이너 및 볼륨 제거                          |

### 유틸리티

| 명령                   | 설명                                      |
| ---------------------- | ----------------------------------------- |
| `clawdock-health`      | Gateway 상태 검사 실행                    |
| `clawdock-token`       | Gateway 토큰 출력                         |
| `clawdock-cd`          | OpenClaw 프로젝트 디렉터리로 이동         |
| `clawdock-config`      | `~/.openclaw` 열기                        |
| `clawdock-show-config` | 민감한 값을 가린 구성 파일 출력           |
| `clawdock-workspace`   | 작업 공간 디렉터리 열기                   |
| `clawdock-help`        | 모든 ClawDock 명령 목록 표시              |

## 최초 실행 절차

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

브라우저에 페어링이 필요하다고 표시되면 다음을 실행하세요.

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 구성 및 비밀 정보

ClawDock은 [Docker](/ko/install/docker)에 설명된 분리 방식에 따라 두 개의 별도 `.env` 파일을 읽습니다.

- `docker-compose.yml` 옆에 있는 프로젝트 `.env`: 이미지 이름, 포트, `OPENCLAW_GATEWAY_TOKEN` 같은 Docker 전용 값입니다. `clawdock-token`은 여기에서 토큰을 읽습니다.
- `~/.openclaw/.env`(컨테이너에 마운트됨): `openclaw.json` 및 `agents/<agentId>/agent/auth-profiles.json`과 함께 OpenClaw 자체에서 관리하는 환경 변수 기반 비밀 정보입니다.

`clawdock-fix-token`은 프로젝트 `.env`의 토큰을 컨테이너의 `gateway.remote.token` 및 `gateway.auth.token` 구성 값에 복사하고 Gateway를 다시 시작합니다.

`clawdock-show-config`를 사용하면 `openclaw.json`과 두 `.env` 파일을 빠르게 확인할 수 있습니다. 출력할 때 `.env` 값은 가려집니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Docker" href="/ko/install/docker" icon="docker">
    OpenClaw의 표준 Docker 설치 방법입니다.
  </Card>
  <Card title="Docker VM 런타임" href="/ko/install/docker-vm-runtime" icon="cube">
    강화된 격리를 위한 Docker 관리형 VM 런타임입니다.
  </Card>
  <Card title="업데이트" href="/ko/install/updating" icon="arrow-up-right-from-square">
    OpenClaw 패키지 및 관리형 서비스를 업데이트합니다.
  </Card>
</CardGroup>
