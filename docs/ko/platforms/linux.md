---
read_when:
    - Linux 컴패니언 앱 상태 확인 중
    - 플랫폼 지원 범위 또는 기여 계획
    - VPS 또는 컨테이너에서 Linux OOM 종료 또는 종료 코드 137 디버깅
summary: Linux 지원 + 컴패니언 앱 상태
title: Linux 앱
x-i18n:
    generated_at: "2026-05-07T13:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway는 Linux에서 완전히 지원됩니다. **Node가 권장 런타임입니다**.
Gateway에는 Bun을 권장하지 않습니다(WhatsApp/Telegram 버그).

네이티브 Linux 컴패니언 앱은 계획되어 있습니다. 구축을 돕고 싶다면 기여를 환영합니다.

## 초보자 빠른 경로(VPS)

1. Node 24를 설치합니다(권장; Node 22 LTS, 현재 `22.16+`, 호환성을 위해 여전히 작동)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 노트북에서 실행: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/`를 열고 구성된 공유 비밀로 인증합니다(기본값은 토큰, `gateway.auth.mode: "password"`를 설정한 경우 비밀번호)

전체 Linux 서버 가이드: [Linux 서버](/ko/vps). 단계별 VPS 예시: [exe.dev](/ko/install/exe-dev)

## 설치

- [시작하기](/ko/start/getting-started)
- [설치 및 업데이트](/ko/install/updating)
- 선택적 흐름: [Bun(실험적)](/ko/install/bun), [Nix](/ko/install/nix), [Docker](/ko/install/docker)

## Gateway

- [Gateway 운영 지침서](/ko/gateway)
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

메시지가 표시되면 **Gateway 서비스**를 선택합니다.

복구/마이그레이션:

```
openclaw doctor
```

## 시스템 제어(systemd 사용자 유닛)

OpenClaw는 기본적으로 systemd **사용자** 서비스를 설치합니다. 공유 서버 또는 항상 켜져 있는 서버에는 **시스템**
서비스를 사용하세요. `openclaw gateway install` 및
`openclaw onboard --install-daemon`은 이미 현재 정식 유닛을
렌더링해 줍니다. 사용자 지정 시스템/서비스 관리자
설정이 필요할 때만 직접 작성하세요. 전체 서비스 지침은 [Gateway 운영 지침서](/ko/gateway)에 있습니다.

최소 설정:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service`를 생성합니다.

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

활성화합니다.

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 메모리 압박 및 OOM 종료

Linux에서는 호스트, VM 또는 컨테이너 cgroup의 메모리가 부족해지면 커널이 OOM 희생 프로세스를 선택합니다. Gateway는 장기 실행
세션과 채널 연결을 소유하므로 좋지 않은 희생 대상이 될 수 있습니다. 따라서 OpenClaw는 가능한 경우 일시적인 자식
프로세스가 Gateway보다 먼저 종료되도록 우선순위를 조정합니다.

대상 Linux 자식 스폰의 경우 OpenClaw는 짧은
`/bin/sh` 래퍼를 통해 자식을 시작합니다. 이 래퍼는 자식 자체의 `oom_score_adj`를 `1000`으로 올린 다음
실제 명령을 `exec`합니다. 자식은 자체 OOM 종료 가능성만 높이므로 이는 권한이 필요 없는 작업입니다.

포함되는 자식 프로세스 표면은 다음과 같습니다.

- supervisor가 관리하는 명령 자식,
- PTY 셸 자식,
- MCP stdio 서버 자식,
- OpenClaw가 실행한 브라우저/Chrome 프로세스.

이 래퍼는 Linux 전용이며 `/bin/sh`를 사용할 수 없으면 건너뜁니다. 또한 자식 env가 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` 또는 `off`로 설정되어 있으면 건너뜁니다.

자식 프로세스를 확인하려면:

```bash
cat /proc/<child-pid>/oom_score_adj
```

포함되는 자식의 예상 값은 `1000`입니다. Gateway 프로세스는 일반 점수, 보통 `0`을 유지해야 합니다.

이는 일반적인 메모리 튜닝을 대체하지 않습니다. VPS 또는 컨테이너가 자식을 반복적으로
종료한다면 메모리 제한을 늘리거나, 동시 실행 수를 줄이거나, systemd `MemoryMax=` 또는 컨테이너 수준 메모리 제한과 같은 더 강력한
리소스 제어를 추가하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [Linux 서버](/ko/vps)
- [Raspberry Pi](/ko/install/raspberry-pi)
