---
read_when:
    - Google Chat 채널 기능 작업 중
summary: Google Chat 앱 지원 상태, 기능 및 구성
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

상태: Google Chat API Webhook를 통해 DM + 스페이스에서 사용할 수 있는 다운로드 가능 Plugin(HTTP 전용).

## 설치

채널을 구성하기 전에 Google Chat을 설치하세요.

```bash
openclaw plugins install @openclaw/googlechat
```

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 빠른 설정(초보자)

1. Google Cloud 프로젝트를 만들고 **Google Chat API**를 사용 설정합니다.
   - 이동: [Google Chat API 사용자 인증 정보](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API가 아직 사용 설정되어 있지 않으면 사용 설정합니다.
2. **서비스 계정**을 만듭니다.
   - **사용자 인증 정보 만들기** > **서비스 계정**을 누릅니다.
   - 원하는 이름을 지정합니다(예: `openclaw-chat`).
   - 권한은 비워 둡니다(**계속**을 누름).
   - 액세스 권한이 있는 주 구성원도 비워 둡니다(**완료**를 누름).
3. **JSON 키**를 만들고 다운로드합니다.
   - 서비스 계정 목록에서 방금 만든 계정을 클릭합니다.
   - **키** 탭으로 이동합니다.
   - **키 추가** > **새 키 만들기**를 클릭합니다.
   - **JSON**을 선택하고 **만들기**를 누릅니다.
4. 다운로드한 JSON 파일을 Gateway 호스트에 저장합니다(예: `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat 구성](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 Google Chat 앱을 만듭니다.
   - **애플리케이션 정보**를 입력합니다.
     - **앱 이름**: (예: `OpenClaw`)
     - **아바타 URL**: (예: `https://openclaw.ai/logo.png`)
     - **설명**: (예: `Personal AI Assistant`)
   - **대화형 기능**을 사용 설정합니다.
   - **기능**에서 **스페이스 및 그룹 대화 참여**를 선택합니다.
   - **연결 설정**에서 **HTTP 엔드포인트 URL**을 선택합니다.
   - **트리거**에서 **모든 트리거에 공통 HTTP 엔드포인트 URL 사용**을 선택하고, Gateway의 공개 URL 뒤에 `/googlechat`을 붙여 설정합니다.
     - _팁: Gateway의 공개 URL을 찾으려면 `openclaw status`를 실행하세요._
   - **공개 상태**에서 **이 Chat 앱을 `<Your Domain>`의 특정 사용자 및 그룹에게 제공**을 선택합니다.
   - 텍스트 상자에 이메일 주소를 입력합니다(예: `user@example.com`).
   - 아래쪽의 **저장**을 클릭합니다.
6. **앱 상태를 사용 설정**합니다.
   - 저장한 뒤 **페이지를 새로고침**합니다.
   - **앱 상태** 섹션을 찾습니다(저장 후 보통 위쪽이나 아래쪽에 있음).
   - 상태를 **라이브 - 사용자에게 제공됨**으로 변경합니다.
   - **저장**을 다시 클릭합니다.
7. 서비스 계정 경로 + Webhook 대상 값으로 OpenClaw를 구성합니다.
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 또는 config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook 대상 유형 + 값을 설정합니다(Chat 앱 구성과 일치해야 함).
9. Gateway를 시작합니다. Google Chat이 Webhook 경로로 POST합니다.

## Google Chat에 추가

Gateway가 실행 중이고 이메일이 공개 상태 목록에 추가된 뒤:

1. [Google Chat](https://chat.google.com/)으로 이동합니다.
2. **다이렉트 메시지** 옆의 **+**(더하기) 아이콘을 클릭합니다.
3. 검색창(보통 사람을 추가하는 위치)에 Google Cloud Console에서 구성한 **앱 이름**을 입력합니다.
   - **참고**: 비공개 앱이므로 봇은 "Marketplace" 탐색 목록에 _나타나지 않습니다_. 이름으로 검색해야 합니다.
4. 결과에서 봇을 선택합니다.
5. **추가** 또는 **채팅**을 클릭하여 1:1 대화를 시작합니다.
6. 어시스턴트를 트리거하려면 "안녕하세요"를 보냅니다!

## 공개 URL(Webhook 전용)

Google Chat Webhook에는 공개 HTTPS 엔드포인트가 필요합니다. 보안을 위해 인터넷에는 **`/googlechat` 경로만 노출**하세요. OpenClaw 대시보드와 기타 민감한 엔드포인트는 비공개 네트워크에 유지하세요.

### 옵션 A: Tailscale Funnel(권장)

비공개 대시보드에는 Tailscale Serve를 사용하고, 공개 Webhook 경로에는 Funnel을 사용합니다. 이렇게 하면 `/`는 비공개로 유지하면서 `/googlechat`만 노출할 수 있습니다.

1. **Gateway가 바인딩된 주소를 확인합니다.**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP 주소를 확인합니다(예: `127.0.0.1`, `0.0.0.0`, 또는 `100.x.x.x` 같은 Tailscale IP).

2. **대시보드를 tailnet에만 노출합니다(포트 8443).**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhook 경로만 공개적으로 노출합니다.**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel 액세스를 위해 Node를 승인합니다.**
   메시지가 표시되면 출력에 표시된 승인 URL을 방문하여 tailnet 정책에서 이 Node에 Funnel을 사용 설정합니다.

5. **구성을 확인합니다.**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

공개 Webhook URL은 다음과 같습니다.
`https://<node-name>.<tailnet>.ts.net/googlechat`

비공개 대시보드는 tailnet 전용으로 유지됩니다.
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat 앱 구성에서는 공개 URL(`:8443` 제외)을 사용하세요.

> 참고: 이 구성은 재부팅 후에도 유지됩니다. 나중에 제거하려면 `tailscale funnel reset` 및 `tailscale serve reset`을 실행하세요.

### 옵션 B: 리버스 프록시(Caddy)

Caddy 같은 리버스 프록시를 사용하는 경우 특정 경로만 프록시하세요.

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

이 구성을 사용하면 `your-domain.com/`에 대한 모든 요청은 무시되거나 404로 반환되고, `your-domain.com/googlechat`은 OpenClaw로 안전하게 라우팅됩니다.

### 옵션 C: Cloudflare Tunnel

Webhook 경로만 라우팅하도록 터널의 인그레스 규칙을 구성합니다.

- **경로**: `/googlechat` -> `http://localhost:18789/googlechat`
- **기본 규칙**: HTTP 404(찾을 수 없음)

## 작동 방식

1. Google Chat은 Webhook POST를 Gateway로 보냅니다. 각 요청에는 `Authorization: Bearer <token>` 헤더가 포함됩니다.
   - OpenClaw는 헤더가 있을 때 전체 Webhook 본문을 읽거나 파싱하기 전에 bearer auth를 확인합니다.
   - 본문에 `authorizationEventObject.systemIdToken`을 담은 Google Workspace Add-on 요청은 더 엄격한 사전 인증 본문 예산을 통해 지원됩니다.
2. OpenClaw는 구성된 `audienceType` + `audience`를 기준으로 토큰을 확인합니다.
   - `audienceType: "app-url"` → 대상은 HTTPS Webhook URL입니다.
   - `audienceType: "project-number"` → 대상은 Cloud 프로젝트 번호입니다.
3. 메시지는 스페이스별로 라우팅됩니다.
   - DM은 세션 키 `agent:<agentId>:googlechat:direct:<spaceId>`를 사용합니다.
   - 스페이스는 세션 키 `agent:<agentId>:googlechat:group:<spaceId>`를 사용합니다.
4. DM 액세스는 기본적으로 페어링 방식입니다. 알 수 없는 발신자는 페어링 코드를 받으며, 다음으로 승인합니다.
   - `openclaw pairing approve googlechat <code>`
5. 그룹 스페이스는 기본적으로 @멘션이 필요합니다. 멘션 감지에 앱의 사용자 이름이 필요한 경우 `botUser`를 사용하세요.
6. exec 또는 Plugin 승인 요청이 Google Chat에서 시작되고 안정적인 `users/<id>` 승인자가 구성되어 있으면, OpenClaw는 원래 스페이스 또는 스레드에 네이티브 Google Chat 승인 카드를 게시합니다. 카드 버튼은 불투명한 콜백 토큰을 사용하며, 네이티브 승인 전달을 사용할 수 없을 때만 수동 `/approve <id> <decision>` 프롬프트가 표시됩니다.

## 대상

전달 및 허용 목록에는 다음 식별자를 사용하세요.

- 다이렉트 메시지: `users/<userId>`(권장).
- 원시 이메일 `name@example.com`은 변경 가능하며 `channels.googlechat.dangerouslyAllowNameMatching: true`일 때만 직접 허용 목록 매칭에 사용됩니다.
- 지원 중단됨: `users/<email>`은 이메일 허용 목록이 아니라 사용자 ID로 취급됩니다.
- 스페이스: `spaces/<spaceId>`.

## 구성 주요 사항

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

참고:

- 서비스 계정 사용자 인증 정보는 `serviceAccount`(JSON 문자열)로 인라인 전달할 수도 있습니다.
- `serviceAccountRef`도 지원됩니다(env/file SecretRef). 여기에는 `channels.googlechat.accounts.<id>.serviceAccountRef` 아래의 계정별 ref도 포함됩니다.
- `webhookPath`가 설정되지 않은 경우 기본 Webhook 경로는 `/googlechat`입니다.
- `dangerouslyAllowNameMatching`은 허용 목록에 대해 변경 가능한 이메일 주 구성원 매칭을 다시 사용 설정합니다(비상 호환성 모드).
- `actions.reactions`가 사용 설정되어 있으면 `reactions` 도구와 `channels action`을 통해 반응을 사용할 수 있습니다.
- 네이티브 승인 카드는 반응 이벤트가 아니라 Google Chat `cardsV2` 버튼 클릭을 사용합니다. 승인자는 `dm.allowFrom` 또는 `defaultTo`에서 가져오며 안정적인 숫자형 `users/<id>` 값이어야 합니다.
- 메시지 작업은 텍스트용 `send`와 명시적 첨부 전송용 `upload-file`을 노출합니다. `upload-file`은 `media` / `filePath` / `path`와 선택적 `message`, `filename`, 스레드 대상을 허용합니다.
- `typingIndicator`는 `message`(기본값), `none`, `reaction`을 지원합니다(`reaction`에는 사용자 OAuth가 필요).
- 첨부 파일은 Chat API를 통해 다운로드되고 미디어 파이프라인에 저장됩니다(크기는 `mediaMaxMb`로 제한).
- 봇이 작성한 Google Chat 메시지는 기본적으로 무시됩니다. 의도적으로 `allowBots: true`를 설정하면, 허용된 봇 작성 메시지는 공유 [봇 루프 보호](/ko/channels/bot-loop-protection)를 사용합니다. `channels.defaults.botLoopProtection`을 구성한 뒤, 특정 스페이스에 다른 예산이 필요하면 `channels.googlechat.botLoopProtection` 또는 `channels.googlechat.groups.<space>.botLoopProtection`으로 재정의하세요.

비밀 참조 세부 정보: [비밀 관리](/ko/gateway/secrets).

## 문제 해결

### 405 메서드 허용되지 않음

Google Cloud Logs Explorer에 다음과 같은 오류가 표시되는 경우:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

이는 Webhook 핸들러가 등록되지 않았음을 의미합니다. 일반적인 원인은 다음과 같습니다.

1. **채널이 구성되지 않음**: 구성에 `channels.googlechat` 섹션이 없습니다. 다음으로 확인하세요.

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found"가 반환되면 구성을 추가하세요([구성 주요 사항](#config-highlights) 참고).

2. **Plugin이 사용 설정되지 않음**: Plugin 상태를 확인하세요.

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled"가 표시되면 구성에 `plugins.entries.googlechat.enabled: true`를 추가하세요.

3. **Gateway가 재시작되지 않음**: 구성을 추가한 뒤 Gateway를 재시작하세요.

   ```bash
   openclaw gateway restart
   ```

채널이 실행 중인지 확인하세요.

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 기타 문제

- 인증 오류 또는 누락된 대상 구성이 있는지 `openclaw channels status --probe`를 확인하세요.
- 메시지가 도착하지 않으면 Chat 앱의 Webhook URL + 이벤트 구독을 확인하세요.
- 멘션 게이팅이 답장을 차단하면 `botUser`를 앱의 사용자 리소스 이름으로 설정하고 `requireMention`을 확인하세요.
- 테스트 메시지를 보내는 동안 요청이 Gateway에 도달하는지 보려면 `openclaw logs --follow`를 사용하세요.

관련 문서:

- [Gateway 구성](/ko/gateway/configuration)
- [보안](/ko/gateway/security)
- [반응](/ko/tools/reactions)

## 관련

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
