---
read_when:
    - 원격 Mac 제어 설정 또는 디버깅
summary: SSH를 통해 원격 OpenClaw Gateway를 제어하기 위한 macOS 앱 흐름
title: 원격 제어
x-i18n:
    generated_at: "2026-04-30T16:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# 원격 OpenClaw (macOS ⇄ 원격 호스트)

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw Gateway를 완전한 원격 제어처럼 사용할 수 있습니다. 앱의 **SSH를 통한 원격**(원격 실행) 기능입니다. 모든 기능(상태 확인, 음성 깨우기 전달, 웹 채팅)은 _설정 → 일반_의 동일한 원격 SSH 구성을 재사용합니다.

## 모드

- **로컬(이 Mac)**: 모든 것이 노트북에서 실행됩니다. SSH는 사용하지 않습니다.
- **SSH를 통한 원격(기본값)**: OpenClaw 명령이 원격 호스트에서 실행됩니다. Mac 앱은 선택한 ID/키와 local loopback 포트 전달을 사용해 `-o BatchMode`로 SSH 연결을 엽니다.
- **원격 직접 연결(ws/wss)**: SSH 터널을 사용하지 않습니다. Mac 앱이 Gateway URL에 직접 연결합니다(예: Tailscale Serve 또는 공개 HTTPS 리버스 프록시를 통해).

## 원격 전송

원격 모드는 두 가지 전송 방식을 지원합니다.

- **SSH 터널**(기본값): `ssh -N -L ...`을 사용해 Gateway 포트를 localhost로 전달합니다. 터널이 loopback이므로 Gateway는 노드의 IP를 `127.0.0.1`로 봅니다.
- **직접 연결(ws/wss)**: Gateway URL에 바로 연결합니다. Gateway는 실제 클라이언트 IP를 봅니다.

SSH 터널 모드에서는 발견된 LAN/tailnet 호스트 이름이
`gateway.remote.sshTarget`으로 저장됩니다. 앱은 `gateway.remote.url`을
로컬 터널 엔드포인트(예: `ws://127.0.0.1:18789`)로 유지하므로 CLI, 웹 채팅,
로컬 노드 호스트 서비스가 모두 동일한 안전한 loopback 전송을 사용합니다.

원격 모드의 브라우저 자동화는 네이티브 macOS 앱 노드가 아니라 CLI 노드 호스트가 담당합니다. 앱은 가능한 경우 설치된 노드 호스트 서비스를 시작합니다. 해당 Mac에서 브라우저 제어가 필요하면 `openclaw node install ...` 및 `openclaw node start`로 설치/시작하거나(`openclaw node run ...`을 포그라운드에서 실행), 브라우저 기능을 갖춘 해당 노드를 대상으로 지정하세요.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸에서 `openclaw`가 PATH에 있는지 확인합니다(필요한 경우 `/usr/local/bin` 또는 `/opt/homebrew/bin`에 심볼릭 링크).
3. 키 인증으로 SSH를 엽니다. LAN 외부에서도 안정적으로 연결할 수 있도록 **Tailscale** IP를 권장합니다.

## macOS 앱 설정

1. _설정 → 일반_을 엽니다.
2. **OpenClaw 실행 위치**에서 **SSH를 통한 원격**을 선택하고 다음을 설정합니다.
   - **전송**: **SSH 터널** 또는 **직접 연결(ws/wss)**.
   - **SSH 대상**: `user@host`(선택적으로 `:port`).
     - Gateway가 동일한 LAN에 있고 Bonjour를 광고하면, 발견된 목록에서 선택해 이 필드를 자동으로 채웁니다.
   - **Gateway URL**(직접 연결 전용): `wss://gateway.example.ts.net`(또는 로컬/LAN의 경우 `ws://...`).
   - **ID 파일**(고급): 키 경로.
   - **프로젝트 루트**(고급): 명령에 사용할 원격 체크아웃 경로.
   - **CLI 경로**(고급): 실행 가능한 `openclaw` 엔트리포인트/바이너리의 선택적 경로(광고되는 경우 자동 입력).
3. **원격 테스트**를 누릅니다. 성공은 원격 `openclaw status --json`이 올바르게 실행된다는 뜻입니다. 실패는 대개 PATH/CLI 문제를 의미하며, 종료 코드 127은 원격에서 CLI를 찾을 수 없다는 뜻입니다.
4. 이제 상태 확인과 웹 채팅이 이 SSH 터널을 통해 자동으로 실행됩니다.

## 웹 채팅

- **SSH 터널**: 웹 채팅은 전달된 WebSocket 제어 포트(기본값 18789)를 통해 Gateway에 연결합니다.
- **직접 연결(ws/wss)**: 웹 채팅은 구성된 Gateway URL에 바로 연결합니다.
- 별도의 WebChat HTTP 서버는 더 이상 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC 승인(자동화, 손쉬운 사용, 화면 기록, 마이크, 음성 인식, 알림)이 필요합니다. 해당 머신에서 온보딩을 실행해 한 번만 권한을 부여하세요.
- 에이전트가 사용 가능한 항목을 알 수 있도록 노드는 `node.list` / `node.describe`를 통해 권한 상태를 광고합니다.

## 보안 참고 사항

- 원격 호스트에서는 loopback 바인딩을 선호하고 SSH 또는 Tailscale을 통해 연결하세요.
- SSH 터널링은 엄격한 호스트 키 확인을 사용합니다. 먼저 호스트 키를 신뢰해 `~/.ssh/known_hosts`에 존재하도록 하세요.
- Gateway를 loopback이 아닌 인터페이스에 바인딩하는 경우 유효한 Gateway 인증(토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 리버스 프록시)이 필요합니다.
- [보안](/ko/gateway/security) 및 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## WhatsApp 로그인 흐름(원격)

- **원격 호스트에서** `openclaw channels login --verbose`를 실행합니다. 휴대폰의 WhatsApp으로 QR을 스캔합니다.
- 인증이 만료되면 해당 호스트에서 로그인을 다시 실행합니다. 상태 확인에서 연결 문제가 표시됩니다.

## 문제 해결

- **종료 코드 127 / 찾을 수 없음**: `openclaw`가 비로그인 셸의 PATH에 없습니다. `/etc/paths`나 셸 rc에 추가하거나 `/usr/local/bin`/`/opt/homebrew/bin`에 심볼릭 링크하세요.
- **상태 프로브 실패**: SSH 연결 가능 여부, PATH, Baileys 로그인 상태(`openclaw status --json`)를 확인하세요.
- **웹 채팅 멈춤**: 원격 호스트에서 Gateway가 실행 중인지, 전달된 포트가 Gateway WS 포트와 일치하는지 확인하세요. UI에는 정상적인 WS 연결이 필요합니다.
- **노드 IP가 127.0.0.1로 표시됨**: SSH 터널에서는 예상되는 동작입니다. Gateway가 실제 클라이언트 IP를 보게 하려면 **전송**을 **직접 연결(ws/wss)**로 전환하세요.
- **대시보드는 작동하지만 Mac 기능이 오프라인임**: 앱의 운영자/제어 연결은 정상이나 동반 노드 연결이 연결되지 않았거나 명령 표면이 누락되었다는 뜻입니다. 메뉴 막대의 기기 섹션을 열고 Mac이 `paired · disconnected` 상태인지 확인하세요. `wss://*.ts.net` Tailscale Serve 엔드포인트의 경우 앱은 인증서 교체 후 오래된 레거시 TLS 리프 핀을 감지하고, macOS가 새 인증서를 신뢰하면 오래된 핀을 지운 뒤 자동으로 다시 시도합니다. 인증서가 시스템에서 신뢰되지 않거나 호스트가 Tailscale Serve 이름이 아닌 경우 인증서를 검토하거나 **SSH를 통한 원격**으로 전환하세요.
- **음성 깨우기**: 원격 모드에서는 트리거 문구가 자동으로 전달되며, 별도의 전달자가 필요하지 않습니다.

## 알림 소리

`openclaw` 및 `node.invoke`를 사용하는 스크립트에서 알림별로 소리를 선택하세요. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

앱에는 더 이상 전역 “기본 소리” 토글이 없습니다. 호출자는 요청별로 소리를 선택하거나 선택하지 않습니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [원격 액세스](/ko/gateway/remote)
