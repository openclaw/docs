---
read_when:
    - 원격 Mac 제어 설정 또는 디버깅
summary: 원격 OpenClaw Gateway를 제어하기 위한 macOS 앱 흐름
title: 원격 제어
x-i18n:
    generated_at: "2026-07-12T00:58:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

이 흐름을 사용하면 macOS 앱이 다른 호스트(데스크톱/서버)에서 실행 중인 OpenClaw Gateway의 완전한 원격 제어 장치로 작동할 수 있습니다. 앱은 신뢰할 수 있는 LAN/Tailnet Gateway URL에 직접 연결하거나, 원격 Gateway가 루프백 전용인 경우 SSH 터널을 관리합니다. 상태 확인, Voice Wake 전달, Web Chat은 모두 _Settings -> General_의 동일한 원격 구성을 재사용합니다.

## 모드

- **로컬(이 Mac)**: 모든 항목이 노트북에서 실행되며 SSH는 사용하지 않습니다.
- **SSH를 통한 원격(기본값)**: OpenClaw 명령이 원격 호스트에서 실행됩니다. 앱은 `-o BatchMode`, 선택한 ID/키, 로컬 포트 전달을 사용하여 SSH 연결을 엽니다.
- **원격 직접 연결(ws/wss)**: SSH 터널을 사용하지 않으며 앱이 Gateway URL에 직접 연결합니다(LAN, Tailscale, Tailscale Serve 또는 공개 HTTPS 역방향 프록시).

## 원격 전송 방식

- **SSH 터널**(기본값): `ssh -N -L ...`을 사용하여 Gateway 포트를 localhost로 전달합니다. 터널이 루프백이므로 Gateway에는 Node의 IP가 `127.0.0.1`로 표시됩니다.
- **직접 연결(ws/wss)**: Gateway URL에 바로 연결합니다. Gateway에는 실제 클라이언트 IP가 표시됩니다.

앱은 선택한 별칭이 `ControlMaster` 또는 `ForkAfterAuthentication`을 활성화하더라도 정확한 프로세스를 모니터링하고 다시 시작할 수 있도록 자체 SSH 프로세스에서 SSH 연결 다중화와 인증 후 백그라운드 실행을 비활성화합니다.

Gateway 자격 증명이 이 터널을 통과하므로 SSH 호스트 키 검증은 기본적으로 엄격합니다. 관리되는 SSH 별칭 자체의 신뢰 동작을 사용하려면 `openclaw-mac configure-remote`를 통해 `--ssh-host-key-policy openssh`를 설정하거나 `gateway.remote.sshHostKeyPolicy`를 직접 `"openssh"`로 설정합니다. 이 설정을 사용하기 전에 별칭과 일치하는 `Host *` 또는 시스템 구성을 검토하세요. SSH 대상(앱 또는 `configure-remote`를 통해)을 변경하면 새 대상에 대해 명시적으로 다시 동의하지 않는 한 정책이 `strict`로 재설정됩니다.

SSH 터널 모드에서는 검색된 LAN/Tailnet 호스트 이름이 `gateway.remote.sshTarget`으로 저장됩니다. 앱은 `gateway.remote.url`을 로컬 터널 엔드포인트(예: `ws://127.0.0.1:18789`)로 유지하므로 CLI, Web Chat, 로컬 Node 호스트 서비스가 모두 동일한 루프백 전송 방식을 사용합니다. 검색 결과에 원시 Tailnet IP와 안정적인 호스트 이름이 모두 포함되면 주소가 변경되어도 연결을 더 안정적으로 유지할 수 있도록 앱은 Tailscale MagicDNS 또는 LAN 이름을 우선합니다. 로컬 터널 포트가 원격 Gateway 포트와 다른 경우 `gateway.remote.remotePort`를 원격 호스트의 포트로 설정합니다.

원격 모드의 브라우저 자동화는 네이티브 macOS 앱 Node가 아니라 CLI Node 호스트에서 담당합니다. 앱은 가능한 경우 설치된 Node 호스트 서비스를 시작합니다. 해당 Mac에서 브라우저 제어를 활성화하려면 `openclaw node install ...` 및 `openclaw node start`를 사용하여 설치하고 시작하거나(`openclaw node run ...`을 포그라운드에서 실행할 수도 있음), 브라우저 기능이 있는 해당 Node를 대상으로 지정하세요.

## 원격 호스트의 사전 요구 사항

1. Node + pnpm을 설치하고 OpenClaw CLI를 빌드/설치합니다(`pnpm install && pnpm build && pnpm link --global`).
2. 비대화형 셸의 PATH에 `openclaw`가 포함되어 있는지 확인합니다(필요한 경우 `/usr/local/bin` 또는 `/opt/homebrew/bin`에 심볼릭 링크 생성).
3. SSH 전송 방식의 경우 키 기반 SSH 인증을 설정합니다. LAN 외부에서도 안정적으로 연결하려면 Tailscale IP를 사용하는 것이 좋습니다.

## macOS 앱 설정

시작 화면 흐름 없이 SSH를 통해 앱을 미리 구성하려면 다음을 실행합니다.

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

또는 신뢰할 수 있는 LAN이나 Tailnet에서 Gateway에 이미 연결할 수 있다면 SSH를 완전히 생략합니다.

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

두 형식 모두 `~/.openclaw/openclaw.json`을 작성하고 온보딩을 완료된 것으로 표시하며, 다음 시작 시 앱이 선택한 전송 방식을 관리하도록 합니다. `--local-port`/`--remote-port`의 기본값은 `18789`입니다. 기타 플래그: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. 전체 참조는 `openclaw-mac configure-remote --help`를 실행하여 확인하세요.

대신 UI에서 구성하려면 다음 단계를 따르세요.

1. _Settings -> General_을 엽니다.
2. **OpenClaw runs**에서 **Remote**를 선택하고 다음을 설정합니다.
   - **Transport**: **SSH tunnel** 또는 **Direct (ws/wss)**.
   - **SSH target**: `user@host`(선택적으로 `:port`). Gateway가 동일한 LAN에 있고 Bonjour를 통해 자신을 알리는 경우 검색된 목록에서 선택하면 이 필드가 자동으로 채워집니다.
   - **Gateway URL**(Direct 전용): `wss://gateway.example.ts.net`(로컬/LAN에서는 `ws://...`).
   - **Identity file**(고급): 키 파일의 경로.
   - **Project root**(고급): 명령에 사용되는 원격 체크아웃 경로.
   - **CLI path**(고급): 실행 가능한 `openclaw` 진입점/바이너리의 선택적 경로(알림 정보에 포함된 경우 자동으로 채워짐).
3. **Test remote**를 누릅니다. 성공은 원격 `openclaw status --json`이 올바르게 실행되었음을 의미합니다. 실패는 일반적으로 PATH/CLI 문제이며, 종료 코드 127은 원격에서 CLI를 찾지 못했음을 의미합니다.
4. 이제 상태 확인과 Web Chat이 선택한 전송 방식을 통해 자동으로 실행됩니다.

## Web Chat

- **SSH 터널**: 전달된 WebSocket 제어 포트(기본값 18789)를 통해 Gateway에 연결합니다.
- **직접 연결(ws/wss)**: 구성된 Gateway URL에 바로 연결합니다.
- 별도의 Web Chat HTTP 서버는 없습니다.

## 권한

- 원격 호스트에는 로컬과 동일한 TCC 승인(자동화, 손쉬운 사용, 화면 기록, 마이크, 음성 인식, 알림)이 필요합니다. 해당 시스템에서 온보딩을 한 번 실행하여 권한을 부여하세요.
- Node는 `node.list` / `node.describe`를 통해 권한 상태를 알리므로 에이전트가 사용 가능한 기능을 파악할 수 있습니다.

## 보안 참고 사항

- 원격 호스트에서는 루프백 바인딩을 우선 사용하고 SSH, Tailscale Serve 또는 신뢰할 수 있는 Tailnet/LAN 직접 URL을 통해 연결하세요.
- SSH 터널링에는 기본적으로 이미 신뢰된 호스트 키가 필요합니다. 먼저 호스트 키를 신뢰하도록 설정하여 구성된 known-hosts 파일에 추가하거나, OpenSSH 신뢰 정책을 수락할 수 있는 관리형 별칭에 대해 `gateway.remote.sshHostKeyPolicy: "openssh"`를 명시적으로 설정하세요.
- Gateway를 비루프백 인터페이스에 바인딩하는 경우 유효한 Gateway 인증을 요구하도록 설정하세요. 토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 설정된 ID 인식 역방향 프록시를 사용할 수 있습니다.
- [보안](/ko/gateway/security) 및 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## WhatsApp 로그인 흐름(원격)

- **원격 호스트에서** `openclaw channels login --channel whatsapp --verbose`를 실행합니다. 휴대전화의 WhatsApp으로 QR 코드를 스캔합니다.
- 인증이 만료되면 해당 호스트에서 로그인을 다시 실행합니다. 상태 확인에 연결 문제가 표시됩니다.

## 문제 해결

| 증상                                             | 원인 / 해결 방법                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / 찾을 수 없음                        | 비로그인 셸의 PATH에 `openclaw`가 없습니다. `/etc/paths`나 셸 rc 파일에 추가하거나 `/usr/local/bin`/`/opt/homebrew/bin`에 심볼릭 링크를 만드세요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 상태 프로브 실패                                 | SSH 연결 가능 여부와 PATH를 확인하고 Baileys(WhatsApp)가 로그인되어 있는지 확인하세요(`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 웹 채팅이 멈춤                                   | 원격 호스트에서 Gateway가 실행 중이고 전달된 포트가 Gateway WS 포트와 일치하는지 확인하세요. UI에는 정상적인 WS 연결이 필요합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Node IP가 `127.0.0.1`로 표시됨                   | SSH 터널을 사용하면 정상적인 동작입니다. Gateway에서 실제 클라이언트 IP를 확인하려면 **전송 방식**을 **직접 연결(ws/wss)**로 전환하세요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 대시보드는 작동하지만 Mac 기능은 오프라인임      | 운영자/제어 연결은 정상이지만 컴패니언 Node 연결이 끊겨 있거나 명령 인터페이스가 없습니다. 메뉴 막대의 기기 섹션을 열어 Mac이 `페어링됨 · 연결 끊김` 상태인지 확인하세요. `wss://*.ts.net` Tailscale Serve 엔드포인트의 경우 인증서 교체 후 앱이 오래된 레거시 TLS 리프 인증서 핀을 감지하면, macOS가 새 인증서를 신뢰하는 즉시 오래된 핀을 제거하고 자동으로 다시 시도합니다. 인증서가 시스템에서 신뢰되지 않거나 호스트가 Tailscale Serve 이름이 아닌 경우 `gateway.remote.tlsFingerprint`를 예상 인증서 지문으로 설정하고 인증서를 검토하거나 **SSH를 통한 원격 연결**로 전환하세요. |
| 음성 호출                                       | 원격 모드에서는 호출 문구가 자동으로 전달되므로 별도의 전달기가 필요하지 않습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## 알림 소리

스크립트에서 `openclaw nodes notify`를 사용하여 알림별 소리를 선택하세요. 예:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

앱에는 전역 기본 소리 전환 옵션이 없습니다. 호출자가 요청별로 소리를 선택하거나 소리를 사용하지 않도록 지정합니다.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [원격 액세스](/ko/gateway/remote)
