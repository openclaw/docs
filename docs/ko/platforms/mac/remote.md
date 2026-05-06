---
read_when:
    - 원격 Mac 제어 설정 또는 디버깅
summary: SSH를 통해 원격 OpenClaw Gateway를 제어하기 위한 macOS 앱 흐름
title: 원격 제어
x-i18n:
    generated_at: "2026-05-06T06:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw Gateway를 완전한 원격 제어처럼 동작하게 할 수 있습니다. 앱의 **Remote over SSH**(원격 실행) 기능입니다. 기능 상태 검사, Voice Wake 전달, Web Chat은 모두 _Settings → General_의 동일한 원격 SSH 구성을 재사용합니다.

## 모드

- **Local (this Mac)**: 모든 것이 노트북에서 실행됩니다. SSH는 사용하지 않습니다.
- **Remote over SSH (default)**: OpenClaw 명령이 원격 호스트에서 실행됩니다. Mac 앱은 `-o BatchMode`와 선택한 ID/키, 로컬 포트 포워드를 사용해 SSH 연결을 엽니다.
- **Remote direct (ws/wss)**: SSH 터널을 사용하지 않습니다. Mac 앱이 Gateway URL에 직접 연결합니다(예: Tailscale Serve 또는 공개 HTTPS 리버스 프록시를 통해).

## 원격 전송 방식

원격 모드는 두 가지 전송 방식을 지원합니다.

- **SSH tunnel**(기본값): `ssh -N -L ...`을 사용해 Gateway 포트를 localhost로 전달합니다. 터널이 루프백이므로 Gateway는 Node의 IP를 `127.0.0.1`로 봅니다.
- **Direct (ws/wss)**: Gateway URL에 바로 연결합니다. Gateway는 실제 클라이언트 IP를 봅니다.

SSH 터널 모드에서는 발견된 LAN/tailnet 호스트 이름이
`gateway.remote.sshTarget`으로 저장됩니다. 앱은 `gateway.remote.url`을 로컬
터널 엔드포인트(예: `ws://127.0.0.1:18789`)로 유지하므로 CLI, Web Chat,
로컬 Node 호스트 서비스가 모두 동일한 안전한 루프백 전송을 사용합니다.

원격 모드의 브라우저 자동화는 네이티브 macOS 앱 Node가 아니라 CLI Node 호스트가 소유합니다. 앱은 가능하면 설치된 Node 호스트 서비스를 시작합니다. 해당 Mac에서 브라우저 제어가 필요하다면 `openclaw node install ...` 및 `openclaw node start`로 설치/시작하거나, `openclaw node run ...`을 포그라운드에서 실행한 다음 브라우저 기능이 있는 해당 Node를 대상으로 지정하세요.

## 원격 호스트 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸에서도 `openclaw`이 PATH에 있는지 확인합니다(필요하면 `/usr/local/bin` 또는 `/opt/homebrew/bin`으로 심볼릭 링크).
3. 키 인증으로 SSH를 엽니다. LAN 밖에서도 안정적으로 접근하려면 **Tailscale** IP를 권장합니다.

## macOS 앱 설정

1. _Settings → General_을 엽니다.
2. **OpenClaw runs**에서 **Remote over SSH**를 선택하고 다음을 설정합니다.
   - **Transport**: **SSH tunnel** 또는 **Direct (ws/wss)**.
   - **SSH target**: `user@host`(선택 사항 `:port`).
     - Gateway가 동일한 LAN에 있고 Bonjour를 광고하는 경우, 발견된 목록에서 선택하면 이 필드가 자동 입력됩니다.
   - **Gateway URL**(Direct 전용): `wss://gateway.example.ts.net`(또는 로컬/LAN용 `ws://...`).
   - **Identity file**(고급): 키 경로.
   - **Project root**(고급): 명령에 사용할 원격 체크아웃 경로.
   - **CLI path**(고급): 실행 가능한 `openclaw` 엔트리포인트/바이너리의 선택적 경로(광고된 경우 자동 입력).
3. **Test remote**를 누릅니다. 성공은 원격 `openclaw status --json`이 올바르게 실행됨을 의미합니다. 실패는 보통 PATH/CLI 문제입니다. 종료 코드 127은 원격에서 CLI를 찾지 못했다는 뜻입니다.
4. 이제 상태 검사와 Web Chat이 이 SSH 터널을 통해 자동으로 실행됩니다.

## Web Chat

- **SSH tunnel**: Web Chat은 전달된 WebSocket 제어 포트(기본값 18789)를 통해 Gateway에 연결합니다.
- **Direct (ws/wss)**: Web Chat은 구성된 Gateway URL에 바로 연결합니다.
- 별도의 WebChat HTTP 서버는 더 이상 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC 승인(Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications)이 필요합니다. 해당 머신에서 온보딩을 실행해 한 번 승인하세요.
- Node는 `node.list` / `node.describe`를 통해 자신의 권한 상태를 광고하므로 에이전트가 사용할 수 있는 기능을 알 수 있습니다.

## 보안 참고 사항

- 원격 호스트에서는 루프백 바인드를 선호하고 SSH 또는 Tailscale을 통해 연결하세요.
- SSH 터널링은 엄격한 호스트 키 검사를 사용합니다. 먼저 호스트 키를 신뢰하여 `~/.ssh/known_hosts`에 존재하도록 하세요.
- Gateway를 루프백이 아닌 인터페이스에 바인드하는 경우, 토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 있는 ID 인식 리버스 프록시와 같은 유효한 Gateway 인증이 필요합니다.
- [보안](/ko/gateway/security) 및 [Tailscale](/ko/gateway/tailscale)을 참고하세요.

## WhatsApp 로그인 흐름(원격)

- **원격 호스트에서** `openclaw channels login --verbose`를 실행합니다. 휴대폰의 WhatsApp으로 QR을 스캔합니다.
- 인증이 만료되면 해당 호스트에서 로그인을 다시 실행합니다. 상태 검사가 연결 문제를 표시합니다.

## 문제 해결

- **종료 코드 127 / 찾을 수 없음**: `openclaw`이 비로그인 셸의 PATH에 없습니다. `/etc/paths`, 셸 rc에 추가하거나 `/usr/local/bin`/`/opt/homebrew/bin`으로 심볼릭 링크하세요.
- **상태 프로브 실패**: SSH 접근성, PATH, Baileys 로그인 상태를 확인합니다(`openclaw status --json`).
- **Web Chat 멈춤**: Gateway가 원격 호스트에서 실행 중인지, 전달된 포트가 Gateway WS 포트와 일치하는지 확인합니다. UI에는 정상적인 WS 연결이 필요합니다.
- **Node IP가 127.0.0.1로 표시됨**: SSH 터널에서는 예상되는 동작입니다. Gateway가 실제 클라이언트 IP를 보게 하려면 **Transport**를 **Direct (ws/wss)**로 전환하세요.
- **대시보드는 작동하지만 Mac 기능이 오프라인임**: 앱의 운영자/제어 연결은 정상이나, 동반 Node 연결이 연결되어 있지 않거나 명령 표면이 없다는 뜻입니다. 메뉴 막대의 디바이스 섹션을 열고 Mac이 `paired · disconnected`인지 확인하세요. `wss://*.ts.net` Tailscale Serve 엔드포인트의 경우, 앱은 인증서 회전 후 오래된 레거시 TLS 리프 핀을 감지하고, macOS가 새 인증서를 신뢰하면 오래된 핀을 지운 뒤 자동으로 다시 시도합니다. 인증서가 시스템에서 신뢰되지 않거나 호스트가 Tailscale Serve 이름이 아니라면 인증서를 검토하거나 **Remote over SSH**로 전환하세요.
- **Voice Wake**: 원격 모드에서는 트리거 구문이 자동으로 전달됩니다. 별도의 전달자는 필요하지 않습니다.

## 알림 소리

`openclaw` 및 `node.invoke`를 사용하는 스크립트에서 알림별로 소리를 선택하세요. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

앱에는 더 이상 전역 "기본 소리" 토글이 없습니다. 호출자가 요청별로 소리(또는 없음)를 선택합니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [원격 액세스](/ko/gateway/remote)
