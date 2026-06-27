---
read_when:
    - Linux 컴패니언 앱 상태 확인 중
    - |-
      OpenClaw 문서 i18n 입력>
      플랫폼 지원 범위 또는 기여 계획
    - VPS 또는 컨테이너에서 Linux OOM 종료 또는 종료 코드 137 디버깅
summary: Linux 지원 + 컴패니언 앱 상태
title: Linux 앱
x-i18n:
    generated_at: "2026-06-27T17:40:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway는 Linux에서 완전히 지원됩니다. **Node가 권장 런타임입니다**.
Bun은 Gateway에 권장되지 않습니다(WhatsApp/Telegram 버그).

네이티브 Linux 보조 앱은 계획되어 있습니다. 빌드를 돕고 싶다면 기여를 환영합니다.

## 초보자 빠른 경로(VPS)

1. Node 24를 설치합니다(권장; Node 22 LTS, 현재 `22.19+`, 호환성을 위해 계속 작동)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 노트북에서 실행: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/`를 열고 구성된 공유 비밀로 인증합니다(기본값은 토큰; `gateway.auth.mode: "password"`를 설정한 경우 비밀번호)

전체 Linux 서버 가이드: [Linux 서버](/ko/vps). 단계별 VPS 예시: [exe.dev](/ko/install/exe-dev)

## 설치

- [시작하기](/ko/start/getting-started)
- [설치 및 업데이트](/ko/install/updating)
- 선택적 흐름: [Bun(실험적)](/ko/install/bun), [Nix](/ko/install/nix), [Docker](/ko/install/docker)

## Gateway

- [Gateway 런북](/ko/gateway)
- [구성](/ko/gateway/configuration)

## Gateway 서비스 설치(CLI)

다음 중 하나를 사용하세요.

```
openclaw onboard --install-daemon
```

또는:

```
openclaw gateway install
```

또는:

```
openclaw configure
```

프롬프트가 표시되면 **Gateway 서비스**를 선택합니다.

복구/마이그레이션:

```
openclaw doctor
```

## 시스템 제어(systemd 사용자 유닛)

OpenClaw는 기본적으로 systemd **사용자** 서비스를 설치합니다. 공유 서버나 상시 실행 서버에는 **시스템**
서비스를 사용하세요. `openclaw gateway install` 및
`openclaw onboard --install-daemon`은 이미 현재 표준 유닛을
렌더링합니다. 사용자 지정 시스템/서비스 관리자
설정이 필요할 때만 직접 작성하세요. 전체 서비스 가이드는 [Gateway 런북](/ko/gateway)에 있습니다.

최소 설정:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service`를 만듭니다.

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

활성화합니다.

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 메모리 압박 및 OOM 종료

Linux에서는 호스트, VM 또는 컨테이너 cgroup의 메모리가 부족해지면 커널이 OOM 희생 프로세스를 선택합니다. Gateway는 장기 실행
세션과 채널 연결을 소유하므로 희생 대상으로 적합하지 않을 수 있습니다. 따라서 OpenClaw는 가능한 경우 일시적인 자식
프로세스가 Gateway보다 먼저 종료되도록 가중치를 둡니다.

해당 Linux 자식 프로세스 실행의 경우, OpenClaw는 짧은
`/bin/sh` 래퍼를 통해 자식을 시작합니다. 이 래퍼는 자식 자체의 `oom_score_adj`를 `1000`으로 올린 다음
실제 명령을 `exec`합니다. 자식이 자신의 OOM 종료 가능성만 높이는 것이므로 권한이 필요 없는 작업입니다.

포함되는 자식 프로세스 범위는 다음과 같습니다.

- supervisor가 관리하는 명령 자식,
- PTY 셸 자식,
- MCP stdio 서버 자식,
- OpenClaw가 실행한 브라우저/Chrome 프로세스.

래퍼는 Linux 전용이며 `/bin/sh`를 사용할 수 없으면 건너뜁니다. 또한 자식 env가 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` 또는 `off`로 설정된 경우에도 건너뜁니다.

자식 프로세스를 확인하려면:

```bash
cat /proc/<child-pid>/oom_score_adj
```

포함되는 자식의 예상 값은 `1000`입니다. Gateway 프로세스는 일반 점수, 보통 `0`을 유지해야 합니다.

권장 systemd 유닛은 `OOMPolicy=continue`도 설정합니다. 이렇게 하면 일시적인 자식 프로세스가 OOM killer에 의해 선택되어도
Gateway 유닛이 계속 살아 있습니다. 자식 명령/세션은 실패하고 오류를 보고할 수 있지만, systemd가 전체 Gateway 서비스를 실패로 표시하고 모든 채널을 재시작하지 않습니다.

이것이 일반적인 메모리 튜닝을 대체하지는 않습니다. VPS나 컨테이너가 자식을 반복적으로 종료한다면 메모리 제한을 늘리거나, 동시성을 줄이거나, systemd `MemoryMax=` 또는 컨테이너 수준 메모리 제한과 같은 더 강한
리소스 제어를 추가하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [Linux 서버](/ko/vps)
- [Raspberry Pi](/ko/install/raspberry-pi)
