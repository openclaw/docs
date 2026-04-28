---
read_when:
    - Linux companion 앱 상태를 찾고 있습니다
    - 플랫폼 지원 범위 또는 기여 계획 세우기
    - VPS 또는 컨테이너에서 Linux OOM kill 또는 exit 137 디버깅하기
summary: Linux 지원 + companion 앱 상태
title: Linux 앱
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:24:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway는 Linux에서 완전히 지원됩니다. **Node가 권장 런타임**입니다.
Bun은 Gateway에 권장되지 않습니다(WhatsApp/Telegram 버그).

네이티브 Linux companion 앱은 계획되어 있습니다. 직접 빌드에 기여하고 싶다면 기여를 환영합니다.

## 초보자용 빠른 경로(VPS)

1. Node 24 설치(권장, 호환성을 위해 Node 22 LTS(현재 `22.14+`)도 계속 작동)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 노트북에서: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/`를 열고 구성된 공유 비밀로 인증(기본값은 토큰, `gateway.auth.mode: "password"`를 설정했다면 비밀번호)

전체 Linux 서버 가이드: [Linux Server](/ko/vps). 단계별 VPS 예시: [exe.dev](/ko/install/exe-dev)

## 설치

- [시작하기](/ko/start/getting-started)
- [설치 및 업데이트](/ko/install/updating)
- 선택적 흐름: [Bun(실험적)](/ko/install/bun), [Nix](/ko/install/nix), [Docker](/ko/install/docker)

## Gateway

- [Gateway runbook](/ko/gateway)
- [Configuration](/ko/gateway/configuration)

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

프롬프트가 나오면 **Gateway service**를 선택하세요.

복구/마이그레이션:

```
openclaw doctor
```

## 시스템 제어(systemd 사용자 unit)

OpenClaw는 기본적으로 systemd **사용자** 서비스를 설치합니다. 공유 또는 상시 실행 서버에는 **시스템**
서비스를 사용하세요. `openclaw gateway install`과
`openclaw onboard --install-daemon`은 이미 현재의 정식 unit을 렌더링해 줍니다. 사용자 지정 시스템/서비스 관리자 설정이 필요한 경우에만 직접 unit을 작성하세요. 전체 서비스 가이드는 [Gateway runbook](/ko/gateway)에 있습니다.

최소 설정:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` 생성:

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
KillMode=control-group

[Install]
WantedBy=default.target
```

활성화:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 메모리 압박 및 OOM kill

Linux에서는 호스트, VM 또는 컨테이너 cgroup의 메모리가 부족해지면 커널이 OOM 희생 프로세스를 선택합니다. Gateway는 장기 실행 세션과 채널 연결을 소유하므로 좋지 않은 희생자가 될 수 있습니다. 따라서 OpenClaw는 가능할 때 일시적인 자식 프로세스가 Gateway보다 먼저 종료되도록 편향을 줍니다.

적격한 Linux 자식 프로세스 실행의 경우 OpenClaw는 짧은
`/bin/sh` wrapper를 통해 자식을 시작하여 자식 자신의 `oom_score_adj`를 `1000`으로 올린 뒤 실제 명령을 `exec`합니다. 이는 자식이 자신의 OOM 종료 가능성만 높이는 것이므로 권한이 필요 없는 작업입니다.

적용되는 자식 프로세스 표면은 다음과 같습니다.

- supervisor가 관리하는 명령 자식,
- PTY 셸 자식,
- MCP stdio 서버 자식,
- OpenClaw가 실행한 브라우저/Chrome 프로세스.

이 wrapper는 Linux 전용이며 `/bin/sh`를 사용할 수 없으면 건너뜁니다. 또한 자식 env에 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`, `no`, 또는 `off`가 설정되어 있으면 건너뜁니다.

자식 프로세스를 확인하려면:

```bash
cat /proc/<child-pid>/oom_score_adj
```

적용 대상 자식의 예상 값은 `1000`입니다. Gateway 프로세스는 보통 `0`인 정상 점수를 유지해야 합니다.

이것이 일반적인 메모리 튜닝을 대체하지는 않습니다. VPS 또는 컨테이너가 반복적으로 자식을 종료한다면 메모리 한도를 늘리거나, 동시성을 줄이거나, systemd `MemoryMax=` 또는 컨테이너 수준 메모리 제한 같은 더 강한 리소스 제어를 추가하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [Linux server](/ko/vps)
- [Raspberry Pi](/ko/install/raspberry-pi)
