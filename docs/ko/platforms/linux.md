---
read_when:
    - Linux 컴패니언 앱 상태를 찾고 있습니다
    - 플랫폼 지원 또는 기여 계획 수립
    - VPS 또는 컨테이너에서 Linux OOM 종료나 종료 코드 137 디버깅하기
summary: Linux 지원 및 컴패니언 앱 상태
title: Linux 앱
x-i18n:
    generated_at: "2026-07-12T15:29:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway는 Linux에서 완전히 지원됩니다. 권장 런타임은 Node이며, Bun은
권장하지 않습니다(WhatsApp/Telegram 관련 알려진 문제).

아직 네이티브 Linux 컴패니언 앱은 없습니다. 기여를 환영합니다.

## 빠른 경로(VPS)

1. Node 24(권장) 또는 Node 22.19+(LTS, 계속 지원됨)를 설치합니다.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 노트북에서 다음을 실행합니다: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/`을 열고 구성된 공유
   비밀 값으로 인증합니다(기본값은 토큰이며, `gateway.auth.mode`가 `"password"`이면 비밀번호).

전체 서버 가이드: [Linux 서버](/ko/vps). 단계별 VPS 예시:
[exe.dev](/ko/install/exe-dev).

## 설치

- [시작하기](/ko/start/getting-started)
- [설치 및 업데이트](/ko/install/updating)
- 선택 사항: [Bun(실험적)](/ko/install/bun), [Nix](/ko/install/nix), [Docker](/ko/install/docker)

## Gateway 서비스(systemd)

다음 중 하나로 설치합니다.

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # 메시지가 표시되면 "Gateway 서비스"를 선택합니다
```

기존 설치를 복구하거나 마이그레이션합니다.

```bash
openclaw doctor
```

`openclaw gateway install`은 기본적으로 systemd **사용자** 유닛을 렌더링합니다. 공유 또는
상시 가동 호스트용 **시스템** 수준 유닛 변형을 포함한 전체
서비스 지침은 [Gateway 운영 가이드](/ko/gateway#supervision-and-service-lifecycle)에 있습니다.

사용자 지정 설정에만 유닛을 직접 작성하십시오. 최소 사용자 유닛 예시
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (프로필: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

활성화합니다.

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 메모리 압박 및 OOM 종료

Linux에서는 호스트, VM 또는 컨테이너 cgroup의 메모리가
부족해지면 커널이 OOM 희생 프로세스를 선택합니다. Gateway는 장기 실행
세션과 채널 연결을 소유하므로 희생 대상으로 적합하지 않습니다. 따라서 OpenClaw는 가능하면
일시적인 자식 프로세스가 먼저 종료되도록 우선순위를 조정합니다.

조건을 충족하는 Linux 자식 프로세스를 생성할 때 OpenClaw는 명령을 짧은
`/bin/sh` shim으로 감싸 자식 자체의 `oom_score_adj`를 `1000`으로 높인 다음
실제 명령을 `exec`합니다. 이 작업에는 권한이 필요하지 않습니다. 프로세스는 언제든지
자체 OOM 점수를 높일 수 있습니다.

적용되는 자식 프로세스 영역:

- Supervisor가 관리하는 명령 자식 프로세스
- PTY 셸 자식 프로세스
- MCP stdio 서버 자식 프로세스
- OpenClaw가 실행한 브라우저/Chrome 프로세스(Plugin SDK 프로세스 런타임을 통해 실행)

래퍼는 Linux에서만 사용되며 `/bin/sh`를 사용할 수 없거나 자식
환경에서 `OPENCLAW_CHILD_OOM_SCORE_ADJ`를 `0`, `false`, `no` 또는
`off`로 설정하면 건너뜁니다.

자식 프로세스를 확인합니다.

```bash
cat /proc/<child-pid>/oom_score_adj
```

적용 대상 자식 프로세스의 예상 값은 `1000`이며, Gateway 프로세스 자체는
일반 점수(보통 `0`)를 유지합니다.

systemd 유닛의 `OOMPolicy=continue`는 OOM 종료 도구가 일시적인 자식 프로세스를 선택했을 때
전체 유닛을 실패로 표시하고 모든 채널을 다시 시작하는 대신 Gateway 서비스를 계속 실행합니다.
실패한 자식 프로세스/세션은 자체 오류를 보고합니다.

이는 일반적인 메모리 튜닝을 대체하지 않습니다. VPS 또는 컨테이너가 반복적으로
자식 프로세스를 종료한다면 메모리 제한을 늘리거나, 동시 실행 수를 줄이거나, 더 강력한
리소스 제어(systemd `MemoryMax=`, 컨테이너 메모리 제한)를 추가하십시오.

## 관련 항목

- [설치 개요](/ko/install)
- [Linux 서버](/ko/vps)
- [Raspberry Pi](/ko/install/raspberry-pi)
- [Gateway 운영 가이드](/ko/gateway)
- [Gateway 구성](/ko/gateway/configuration)
