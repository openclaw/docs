---
read_when:
    - 원격 Mac 제어 설정 또는 디버깅
summary: 원격 OpenClaw Gateway를 제어하기 위한 macOS 앱 흐름
title: 원격 제어
x-i18n:
    generated_at: "2026-07-03T23:29:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw Gateway의 완전한 원격 제어 장치로 동작할 수 있습니다. 앱은 신뢰할 수 있는 LAN/Tailnet Gateway URL에 직접 연결하거나, 원격 Gateway가 loopback 전용인 경우 SSH 터널을 관리할 수 있습니다. 상태 확인, Voice Wake 전달, 웹 채팅은 _Settings → General_의 동일한 원격 구성을 재사용합니다.

## 모드

- **로컬(이 Mac)**: 모든 것이 노트북에서 실행됩니다. SSH는 관여하지 않습니다.
- **SSH를 통한 원격(기본값)**: OpenClaw 명령이 원격 호스트에서 실행됩니다. mac 앱은 `-o BatchMode`와 선택한 ID/키, 그리고 로컬 포트 포워딩으로 SSH 연결을 엽니다.
- **원격 직접 연결(ws/wss)**: SSH 터널을 사용하지 않습니다. mac 앱이 Gateway URL에 직접 연결합니다(예: LAN, Tailscale, Tailscale Serve 또는 공개 HTTPS 리버스 프록시를 통해).

## 원격 전송

원격 모드는 두 가지 전송 방식을 지원합니다.

- **SSH 터널**(기본값): `ssh -N -L ...`을 사용해 Gateway 포트를 localhost로 전달합니다. 터널이 loopback이므로 Gateway는 Node의 IP를 `127.0.0.1`로 봅니다.
- **직접 연결(ws/wss)**: Gateway URL에 바로 연결합니다. Gateway는 실제 클라이언트 IP를 봅니다.

앱은 앱이 소유한 SSH 프로세스에 대해 SSH 연결 멀티플렉싱과 인증 후 백그라운드 실행을 비활성화합니다. 따라서 선택한 별칭이 `ControlMaster` 또는 `ForkAfterAuthentication`을 활성화하더라도 정확한 프로세스를 모니터링하고 다시 시작할 수 있습니다.

Gateway 자격 증명이 이 터널을 통과하므로 SSH 호스트 키 검증은 기본적으로 엄격합니다. 신뢰 동작을 명시적으로 사용하려는 관리형 SSH 별칭의 경우 `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh`로 옵트인하거나 `gateway.remote.sshHostKeyPolicy`를 `"openssh"`로 설정하세요. 이 옵트인은 유효한 OpenSSH 호스트 키 정책을 사용합니다. 먼저 별칭과 일치하는 모든 `Host *` 또는 시스템 구성을 검토하세요. 앱에서 또는 `configure-remote`로 SSH 대상을 변경하면 명시적으로 다시 옵트인하지 않는 한 정책이 `strict`로 재설정됩니다.

SSH 터널 모드에서는 검색된 LAN/tailnet 호스트 이름이
`gateway.remote.sshTarget`으로 저장됩니다. 앱은 `gateway.remote.url`을
예를 들어 `ws://127.0.0.1:18789` 같은 로컬 터널 엔드포인트로 유지하므로 CLI, 웹 채팅,
로컬 Node 호스트 서비스가 모두 동일한 안전한 loopback 전송을 사용합니다.
검색이 원시 Tailnet IP와 안정적인 호스트 이름을 모두 반환하는 경우, 앱은
주소 변경에도 원격 연결이 더 잘 유지되도록 Tailscale MagicDNS 또는 LAN 이름을 선호합니다.
로컬 터널 포트가 원격 Gateway 포트와 다르면
`gateway.remote.remotePort`를 원격 호스트의 포트로 설정하세요.

원격 모드의 브라우저 자동화는 네이티브 macOS 앱 Node가 아니라 CLI Node 호스트가 소유합니다.
앱은 가능할 때 설치된 Node 호스트 서비스를 시작합니다. 해당 Mac에서 브라우저 제어가 필요하면
`openclaw node install ...` 및 `openclaw node start`로 설치/시작하거나
`openclaw node run ...`을 포그라운드에서 실행한 다음, 브라우저 기능이 있는
Node를 대상으로 지정하세요.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸에서 `openclaw`가 PATH에 있는지 확인합니다(필요한 경우 `/usr/local/bin` 또는 `/opt/homebrew/bin`에 심볼릭 링크).
3. SSH 전송만 해당: 키 인증으로 SSH를 엽니다. LAN 외부에서 안정적으로 도달할 수 있도록 **Tailscale** IP를 권장합니다.

## macOS 앱 설정

환영 흐름 없이 앱을 미리 구성하려면:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

신뢰할 수 있는 LAN 또는 Tailnet에서 이미 도달 가능한 Gateway의 경우 SSH를 완전히 건너뛰세요.

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

이 작업은 원격 구성을 쓰고, 온보딩을 완료로 표시하며, 앱이 시작될 때
선택된 전송을 앱이 소유하도록 합니다.

1. _Settings → General_을 엽니다.
2. **OpenClaw runs** 아래에서 **Remote**를 선택하고 다음을 설정합니다.
   - **Transport**: **SSH tunnel** 또는 **Direct (ws/wss)**.
   - **SSH target**: `user@host`(선택적 `:port`).
     - Gateway가 동일한 LAN에 있고 Bonjour를 알리는 경우, 검색된 목록에서 선택해 이 필드를 자동으로 채우세요.
   - **Gateway URL**(직접 연결만 해당): `wss://gateway.example.ts.net`(또는 로컬/LAN의 경우 `ws://...`).
   - **Identity file**(고급): 키 경로.
   - **Project root**(고급): 명령에 사용되는 원격 체크아웃 경로.
   - **CLI path**(고급): 실행 가능한 `openclaw` 엔트리포인트/바이너리의 선택적 경로(알려진 경우 자동 입력).
3. **Test remote**를 누릅니다. 성공은 원격 `openclaw status --json`이 올바르게 실행됨을 의미합니다. 실패는 보통 PATH/CLI 문제를 뜻하며, 종료 127은 원격에서 CLI를 찾을 수 없음을 의미합니다.
4. 이제 상태 확인과 웹 채팅이 선택한 전송을 통해 자동으로 실행됩니다.

## 웹 채팅

- **SSH 터널**: 웹 채팅은 전달된 WebSocket 제어 포트(기본값 18789)를 통해 Gateway에 연결합니다.
- **직접 연결(ws/wss)**: 웹 채팅은 구성된 Gateway URL에 바로 연결합니다.
- 더 이상 별도의 WebChat HTTP 서버는 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC 승인(자동화, 손쉬운 사용, 화면 녹화, 마이크, 음성 인식, 알림)이 필요합니다. 해당 머신에서 온보딩을 실행해 한 번 승인하세요.
- Node는 `node.list` / `node.describe`를 통해 권한 상태를 알리므로 에이전트가 사용 가능한 항목을 알 수 있습니다.

## 보안 참고 사항

- 원격 호스트에서는 loopback 바인드를 선호하고 SSH, Tailscale Serve 또는 신뢰할 수 있는 Tailnet/LAN 직접 URL을 통해 연결하세요.
- SSH 터널링은 기본적으로 이미 신뢰된 호스트 키를 요구합니다. 호스트 키가 구성된 known-hosts 파일에 존재하도록 먼저 신뢰하거나, OpenSSH 신뢰 정책을 수락하는 관리형 별칭에 대해 명시적으로 `gateway.remote.sshHostKeyPolicy: "openssh"`를 선택하세요.
- Gateway를 non-loopback 인터페이스에 바인딩하는 경우 유효한 Gateway 인증을 요구하세요: 토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 있는 ID 인식 리버스 프록시.
- [보안](/ko/gateway/security) 및 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## WhatsApp 로그인 흐름(원격)

- 원격 호스트에서 `openclaw channels login --verbose`를 실행하세요. 휴대폰의 WhatsApp으로 QR을 스캔합니다.
- 인증이 만료되면 해당 호스트에서 로그인을 다시 실행하세요. 상태 확인에서 연결 문제가 표시됩니다.

## 문제 해결

- **exit 127 / 찾을 수 없음**: `openclaw`가 비로그인 셸의 PATH에 없습니다. `/etc/paths`나 셸 rc에 추가하거나 `/usr/local/bin`/`/opt/homebrew/bin`에 심볼릭 링크하세요.
- **상태 프로브 실패**: SSH 도달 가능성, PATH, 그리고 Baileys가 로그인되어 있는지 확인하세요(`openclaw status --json`).
- **웹 채팅이 멈춤**: Gateway가 원격 호스트에서 실행 중이고 전달된 포트가 Gateway WS 포트와 일치하는지 확인하세요. UI에는 정상적인 WS 연결이 필요합니다.
- **Node IP가 127.0.0.1로 표시됨**: SSH 터널에서는 예상되는 동작입니다. Gateway가 실제 클라이언트 IP를 보게 하려면 **Transport**를 **Direct (ws/wss)**로 전환하세요.
- **대시보드는 작동하지만 Mac 기능이 오프라인임**: 앱의 운영자/제어 연결은 정상이나, 동반 Node 연결이 연결되지 않았거나 명령 표면이 없다는 뜻입니다. 메뉴 막대의 장치 섹션을 열고 Mac이 `paired · disconnected`인지 확인하세요. `wss://*.ts.net` Tailscale Serve 엔드포인트의 경우, 앱은 인증서 교체 후 오래된 레거시 TLS leaf pin을 감지하고, macOS가 새 인증서를 신뢰하면 오래된 pin을 지운 뒤 자동으로 재시도합니다. 인증서가 시스템에서 신뢰되지 않거나 호스트가 Tailscale Serve 이름이 아닌 경우, `gateway.remote.tlsFingerprint`를 예상 인증서 지문으로 설정하고 인증서를 검토하거나 **Remote over SSH**로 전환하세요.
- **Voice Wake**: 원격 모드에서는 트리거 문구가 자동으로 전달되며 별도의 전달기가 필요하지 않습니다.

## 알림 소리

`openclaw` 및 `node.invoke`가 있는 스크립트에서 알림별로 소리를 선택하세요. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

앱에는 더 이상 전역 "기본 소리" 토글이 없습니다. 호출자는 요청별로 소리(또는 없음)를 선택합니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [원격 액세스](/ko/gateway/remote)
