---
read_when:
    - Docker로 OpenClaw를 자주 실행하며 일상적으로 사용하는 명령을 더 짧게 쓰고 싶은 경우
    - 대시보드, 로그, 토큰 설정 및 페어링 흐름을 위한 헬퍼 계층이 필요합니다
summary: Docker 기반 OpenClaw 설치를 위한 ClawDock 셸 헬퍼
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T06:29:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock은 Docker 기반 OpenClaw 설치를 위한 작은 셸 헬퍼 계층입니다.

긴 `docker compose ...` 호출 대신 `clawdock-start`, `clawdock-dashboard`, `clawdock-fix-token` 같은 짧은 명령을 제공합니다.

아직 Docker를 설정하지 않았다면 [Docker](/ko/install/docker)부터 시작하세요.

## 설치

표준 헬퍼 경로를 사용하세요.

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

이전에 `scripts/shell-helpers/clawdock-helpers.sh`에서 ClawDock을 설치했다면, 새 `scripts/clawdock/clawdock-helpers.sh` 경로에서 다시 설치하세요. 기존 원시 GitHub 경로는 제거되었습니다.

## 제공되는 기능

### 기본 작업

| 명령               | 설명                  |
| ------------------ | --------------------- |
| `clawdock-start`   | Gateway 시작          |
| `clawdock-stop`    | Gateway 중지          |
| `clawdock-restart` | Gateway 다시 시작     |
| `clawdock-status`  | 컨테이너 상태 확인    |
| `clawdock-logs`    | Gateway 로그 따라가기 |

### 컨테이너 접근

| 명령                      | 설명                                      |
| ------------------------- | ----------------------------------------- |
| `clawdock-shell`          | Gateway 컨테이너 안에서 셸 열기          |
| `clawdock-cli <command>`  | Docker에서 OpenClaw CLI 명령 실행         |
| `clawdock-exec <command>` | 컨테이너에서 임의의 명령 실행             |

### 웹 UI 및 페어링

| 명령                    | 설명                         |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | 제어 UI URL 열기             |
| `clawdock-devices`      | 대기 중인 기기 페어링 나열   |
| `clawdock-approve <id>` | 페어링 요청 승인             |

### 설정 및 유지 관리

| 명령                 | 설명                                      |
| -------------------- | ----------------------------------------- |
| `clawdock-fix-token` | 컨테이너 안에서 Gateway 토큰 구성         |
| `clawdock-update`    | 가져오기, 다시 빌드, 다시 시작           |
| `clawdock-rebuild`   | Docker 이미지만 다시 빌드                 |
| `clawdock-clean`     | 컨테이너와 볼륨 제거                      |

### 유틸리티

| 명령                   | 설명                                 |
| ---------------------- | ------------------------------------ |
| `clawdock-health`      | Gateway 상태 확인 실행               |
| `clawdock-token`       | Gateway 토큰 출력                    |
| `clawdock-cd`          | OpenClaw 프로젝트 디렉터리로 이동    |
| `clawdock-config`      | `~/.openclaw` 열기                   |
| `clawdock-show-config` | 값이 마스킹된 구성 파일 출력         |
| `clawdock-workspace`   | 작업 공간 디렉터리 열기              |

## 첫 실행 흐름

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

브라우저에서 페어링이 필요하다고 표시되면:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 구성 및 비밀

ClawDock은 [Docker](/ko/install/docker)에 설명된 것과 동일한 Docker 구성 분리를 사용합니다.

- 이미지 이름, 포트, Gateway 토큰 같은 Docker 전용 값은 `<project>/.env`
- 환경 변수 기반 제공자 키와 봇 토큰은 `~/.openclaw/.env`
- 저장된 제공자 OAuth/API 키 인증은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 동작 구성은 `~/.openclaw/openclaw.json`

`.env` 파일과 `openclaw.json`을 빠르게 검사하고 싶을 때 `clawdock-show-config`를 사용하세요. 출력된 결과에서 `.env` 값은 마스킹됩니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Docker" href="/ko/install/docker" icon="docker">
    OpenClaw의 표준 Docker 설치입니다.
  </Card>
  <Card title="Docker VM 런타임" href="/ko/install/docker-vm-runtime" icon="cube">
    강화된 격리를 위한 Docker 관리형 VM 런타임입니다.
  </Card>
  <Card title="업데이트" href="/ko/install/updating" icon="arrow-up-right-from-square">
    OpenClaw 패키지와 관리형 서비스를 업데이트합니다.
  </Card>
</CardGroup>
