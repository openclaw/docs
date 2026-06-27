---
read_when:
    - 원격 Mac 제어 설정 또는 디버깅
summary: 원격 OpenClaw gateway를 제어하기 위한 macOS 앱 흐름
title: 원격 제어
x-i18n:
    generated_at: "2026-06-27T17:40:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw gateway의 완전한 원격 제어 장치처럼 동작할 수 있습니다. 앱은 신뢰할 수 있는 LAN/Tailnet gateway URL에 직접 연결하거나, 원격 gateway가 loopback 전용일 때 SSH 터널을 관리할 수 있습니다. 상태 확인, 음성 깨우기 전달, 웹 채팅은 _설정 → 일반_의 동일한 원격 구성을 재사용합니다.

## 모드

- **로컬(이 Mac)**: 모든 것이 노트북에서 실행됩니다. SSH는 사용하지 않습니다.
- **SSH를 통한 원격(기본값)**: OpenClaw 명령이 원격 호스트에서 실행됩니다. Mac 앱은 `-o BatchMode`와 선택한 ID/키, 로컬 포트 전달을 사용해 SSH 연결을 엽니다.
- **원격 직접 연결(ws/wss)**: SSH 터널을 사용하지 않습니다. Mac 앱이 gateway URL에 직접 연결합니다(예: LAN, Tailscale, Tailscale Serve 또는 공개 HTTPS 역방향 프록시를 통해).

## 원격 전송 방식

원격 모드는 두 가지 전송 방식을 지원합니다.

- **SSH 터널**(기본값): `ssh -N -L ...`을 사용해 gateway 포트를 localhost로 전달합니다. 터널이 loopback이므로 gateway에는 Node의 IP가 `127.0.0.1`로 표시됩니다.
- **직접 연결(ws/wss)**: gateway URL에 바로 연결합니다. gateway에는 실제 클라이언트 IP가 표시됩니다.

SSH 터널 모드에서는 발견된 LAN/tailnet 호스트 이름이
`gateway.remote.sshTarget`으로 저장됩니다. 앱은 `gateway.remote.url`을 로컬
터널 엔드포인트(예: `ws://127.0.0.1:18789`)로 유지하므로 CLI, 웹 채팅,
로컬 Node 호스트 서비스가 모두 동일한 안전한 loopback 전송을 사용합니다.
로컬 터널 포트가 원격 gateway 포트와 다르면
`gateway.remote.remotePort`를 원격 호스트의 포트로 설정하세요.

원격 모드의 브라우저 자동화는 네이티브 macOS 앱 Node가 아니라 CLI Node 호스트가 소유합니다. 앱은 가능한 경우 설치된 Node 호스트 서비스를 시작합니다. 해당 Mac에서 브라우저 제어가 필요하면 `openclaw node install ...` 및 `openclaw node start`로 설치/시작하거나(`openclaw node run ...`을 포그라운드에서 실행), 그런 다음 브라우저 기능이 있는 Node를 대상으로 지정하세요.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸에서 `openclaw`가 PATH에 있도록 합니다(필요한 경우 `/usr/local/bin` 또는 `/opt/homebrew/bin`으로 symlink).
3. SSH 전송에만 해당: 키 인증으로 SSH를 엽니다. LAN 외부에서도 안정적으로 도달할 수 있도록 **Tailscale** IP를 권장합니다.

## macOS 앱 설정

환영 흐름 없이 앱을 미리 구성하려면:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

신뢰할 수 있는 LAN 또는 Tailnet에서 이미 도달 가능한 gateway의 경우 SSH를 완전히 건너뜁니다.

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

이렇게 하면 원격 구성이 기록되고, 온보딩이 완료된 것으로 표시되며, 앱이 시작될 때 선택한 전송 방식을 소유할 수 있습니다.

1. _설정 → 일반_을 엽니다.
2. **OpenClaw 실행 위치**에서 **원격**을 선택하고 다음을 설정합니다.
   - **전송 방식**: **SSH 터널** 또는 **직접 연결(ws/wss)**.
   - **SSH 대상**: `user@host`(선택적 `:port`).
     - gateway가 동일한 LAN에 있고 Bonjour를 광고하는 경우, 발견된 목록에서 선택하면 이 필드가 자동으로 채워집니다.
   - **Gateway URL**(직접 연결만): `wss://gateway.example.ts.net`(또는 로컬/LAN의 경우 `ws://...`).
   - **ID 파일**(고급): 키 경로.
   - **프로젝트 루트**(고급): 명령에 사용할 원격 체크아웃 경로.
   - **CLI 경로**(고급): 실행 가능한 `openclaw` 진입점/바이너리의 선택적 경로(광고된 경우 자동 입력).
3. **원격 테스트**를 누릅니다. 성공은 원격 `openclaw status --json`이 올바르게 실행된다는 의미입니다. 실패는 보통 PATH/CLI 문제를 의미하며, 종료 코드 127은 원격에서 CLI를 찾을 수 없다는 뜻입니다.
4. 이제 상태 확인과 웹 채팅이 선택한 전송 방식을 통해 자동으로 실행됩니다.

## 웹 채팅

- **SSH 터널**: 웹 채팅은 전달된 WebSocket 제어 포트(기본값 18789)를 통해 gateway에 연결합니다.
- **직접 연결(ws/wss)**: 웹 채팅은 구성된 gateway URL에 바로 연결합니다.
- 더 이상 별도의 WebChat HTTP 서버는 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC 승인(자동화, 손쉬운 사용, 화면 기록, 마이크, 음성 인식, 알림)이 필요합니다. 해당 머신에서 온보딩을 실행하여 한 번만 권한을 부여하세요.
- Node는 `node.list` / `node.describe`를 통해 권한 상태를 광고하므로 에이전트가 사용 가능한 항목을 알 수 있습니다.

## 보안 참고 사항

- 원격 호스트에서는 loopback 바인딩을 선호하고 SSH, Tailscale Serve 또는 신뢰할 수 있는 Tailnet/LAN 직접 URL을 통해 연결하세요.
- SSH 터널링은 엄격한 호스트 키 검사를 사용합니다. 호스트 키가 `~/.ssh/known_hosts`에 존재하도록 먼저 신뢰하세요.
- Gateway를 loopback이 아닌 인터페이스에 바인딩하는 경우 유효한 Gateway 인증(토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 역방향 프록시)을 요구하세요.
- [보안](/ko/gateway/security) 및 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## WhatsApp 로그인 흐름(원격)

- 원격 호스트에서 `openclaw channels login --verbose`를 실행합니다. 휴대폰의 WhatsApp으로 QR을 스캔하세요.
- 인증이 만료되면 해당 호스트에서 로그인을 다시 실행합니다. 상태 확인에서 연결 문제가 표시됩니다.

## 문제 해결

- **종료 코드 127 / 찾을 수 없음**: 비로그인 셸의 PATH에 `openclaw`가 없습니다. `/etc/paths`, 셸 rc에 추가하거나 `/usr/local/bin`/`/opt/homebrew/bin`으로 symlink하세요.
- **상태 프로브 실패**: SSH 도달 가능성, PATH, Baileys 로그인 상태(`openclaw status --json`)를 확인하세요.
- **웹 채팅이 멈춤**: 원격 호스트에서 gateway가 실행 중인지, 전달된 포트가 gateway WS 포트와 일치하는지 확인하세요. UI에는 정상적인 WS 연결이 필요합니다.
- **Node IP가 127.0.0.1로 표시됨**: SSH 터널에서는 예상된 동작입니다. gateway에 실제 클라이언트 IP가 표시되길 원하면 **전송 방식**을 **직접 연결(ws/wss)**로 전환하세요.
- **대시보드는 작동하지만 Mac 기능이 오프라인임**: 앱의 운영자/제어 연결은 정상이나, companion Node 연결이 연결되어 있지 않거나 명령 표면이 없다는 의미입니다. 메뉴 막대 장치 섹션을 열고 Mac이 `paired · disconnected`인지 확인하세요. `wss://*.ts.net` Tailscale Serve 엔드포인트의 경우, 앱은 인증서 교체 후 오래된 레거시 TLS leaf pin을 감지하고, macOS가 새 인증서를 신뢰하면 오래된 pin을 지운 뒤 자동으로 다시 시도합니다. 인증서가 시스템에서 신뢰되지 않거나 호스트가 Tailscale Serve 이름이 아닌 경우 `gateway.remote.tlsFingerprint`를 예상 인증서 지문으로 설정하거나, 인증서를 검토하거나, **SSH를 통한 원격**으로 전환하세요.
- **음성 깨우기**: 원격 모드에서는 트리거 문구가 자동으로 전달됩니다. 별도의 전달기가 필요하지 않습니다.

## 알림 소리

스크립트에서 `openclaw` 및 `node.invoke`를 사용해 알림별로 소리를 선택합니다. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

앱에는 더 이상 전역 "기본 소리" 토글이 없습니다. 호출자가 요청별로 소리(또는 없음)를 선택합니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [원격 액세스](/ko/gateway/remote)
