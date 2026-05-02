---
read_when:
    - Google Chat 채널 기능 작업하기
summary: Google Chat 앱 지원 상태, 기능 및 구성
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T20:41:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Google Chat API Webhook를 통해 DM 및 스페이스에서 사용할 수 있는 다운로드 가능한 Plugin(HTTP 전용).

## 설치

채널을 구성하기 전에 Google Chat을 설치합니다.

```bash
openclaw plugins install @openclaw/googlechat
```

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 빠른 설정(초보자용)

1. Google Cloud 프로젝트를 만들고 **Google Chat API**를 활성화합니다.
   - 이동: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API가 아직 활성화되어 있지 않다면 활성화합니다.
2. **Service Account**를 만듭니다.
   - **Create Credentials** > **Service Account**를 누릅니다.
   - 원하는 이름을 지정합니다(예: `openclaw-chat`).
   - 권한은 비워 둡니다(**Continue**를 누름).
   - 액세스 권한이 있는 주체도 비워 둡니다(**Done**을 누름).
3. **JSON Key**를 만들고 다운로드합니다.
   - 서비스 계정 목록에서 방금 만든 계정을 클릭합니다.
   - **Keys** 탭으로 이동합니다.
   - **Add Key** > **Create new key**를 클릭합니다.
   - **JSON**을 선택하고 **Create**를 누릅니다.
4. 다운로드한 JSON 파일을 Gateway 호스트에 저장합니다(예: `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 Google Chat 앱을 만듭니다.
   - **Application info**를 입력합니다.
     - **App name**: (예: `OpenClaw`)
     - **Avatar URL**: (예: `https://openclaw.ai/logo.png`)
     - **Description**: (예: `Personal AI Assistant`)
   - **Interactive features**를 활성화합니다.
   - **Functionality**에서 **Join spaces and group conversations**를 선택합니다.
   - **Connection settings**에서 **HTTP endpoint URL**을 선택합니다.
   - **Triggers**에서 **Use a common HTTP endpoint URL for all triggers**를 선택하고 Gateway의 공개 URL 뒤에 `/googlechat`을 붙인 값으로 설정합니다.
     - _팁: Gateway의 공개 URL을 찾으려면 `openclaw status`를 실행하세요._
   - **Visibility**에서 **Make this Chat app available to specific people and groups in `<Your Domain>`**을 선택합니다.
   - 텍스트 상자에 이메일 주소(예: `user@example.com`)를 입력합니다.
   - 아래쪽의 **Save**를 클릭합니다.
6. **앱 상태를 활성화합니다**.
   - 저장한 뒤 **페이지를 새로고침**합니다.
   - **App status** 섹션을 찾습니다(보통 저장 후 위쪽이나 아래쪽에 표시됨).
   - 상태를 **Live - available to users**로 변경합니다.
   - 다시 **Save**를 클릭합니다.
7. 서비스 계정 경로와 Webhook 대상 값으로 OpenClaw를 구성합니다.
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 또는 config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Webhook 대상 유형과 값을 설정합니다(Chat 앱 구성과 일치해야 함).
9. Gateway를 시작합니다. Google Chat이 Webhook 경로로 POST 요청을 보냅니다.

## Google Chat에 추가

Gateway가 실행 중이고 이메일이 공개 대상 목록에 추가되었으면 다음을 수행합니다.

1. [Google Chat](https://chat.google.com/)으로 이동합니다.
2. **Direct Messages** 옆의 **+**(더하기) 아이콘을 클릭합니다.
3. 검색창(보통 사람을 추가하는 곳)에 Google Cloud Console에서 구성한 **App name**을 입력합니다.
   - **참고**: 비공개 앱이므로 봇은 "Marketplace" 찾아보기 목록에 _표시되지 않습니다_. 이름으로 검색해야 합니다.
4. 결과에서 봇을 선택합니다.
5. 1:1 대화를 시작하려면 **Add** 또는 **Chat**을 클릭합니다.
6. 어시스턴트를 트리거하려면 "Hello"를 보냅니다!

## 공개 URL(Webhook 전용)

Google Chat Webhook에는 공개 HTTPS 엔드포인트가 필요합니다. 보안을 위해 인터넷에는 **`/googlechat` 경로만 노출**하세요. OpenClaw 대시보드와 기타 민감한 엔드포인트는 비공개 네트워크에 유지하세요.

### 옵션 A: Tailscale Funnel(권장)

비공개 대시보드에는 Tailscale Serve를, 공개 Webhook 경로에는 Funnel을 사용합니다. 이렇게 하면 `/`는 비공개로 유지하면서 `/googlechat`만 노출할 수 있습니다.

1. **Gateway가 바인딩된 주소를 확인합니다.**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP 주소를 확인합니다(예: `127.0.0.1`, `0.0.0.0` 또는 `100.x.x.x` 같은 Tailscale IP).

2. **대시보드를 tailnet에만 노출합니다(포트 8443).**

   ```bash
   # localhost(127.0.0.1 또는 0.0.0.0)에 바인딩된 경우:
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP에만 바인딩된 경우(예: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhook 경로만 공개적으로 노출합니다.**

   ```bash
   # localhost(127.0.0.1 또는 0.0.0.0)에 바인딩된 경우:
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP에만 바인딩된 경우(예: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel 액세스용으로 Node를 승인합니다.**
   메시지가 표시되면 출력에 표시된 승인 URL을 방문하여 tailnet 정책에서 이 Node에 대해 Funnel을 활성화합니다.

5. **구성을 확인합니다.**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

공개 Webhook URL은 다음과 같습니다.
`https://<node-name>.<tailnet>.ts.net/googlechat`

비공개 대시보드는 tailnet 전용으로 유지됩니다.
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat 앱 구성에는 공개 URL(`:8443` 제외)을 사용합니다.

> 참고: 이 구성은 재부팅 후에도 유지됩니다. 나중에 제거하려면 `tailscale funnel reset`과 `tailscale serve reset`을 실행하세요.

### 옵션 B: 리버스 프록시(Caddy)

Caddy 같은 리버스 프록시를 사용하는 경우 특정 경로만 프록시합니다.

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

이 구성에서는 `your-domain.com/`에 대한 모든 요청이 무시되거나 404로 반환되고, `your-domain.com/googlechat`은 안전하게 OpenClaw로 라우팅됩니다.

### 옵션 C: Cloudflare Tunnel

Webhook 경로만 라우팅하도록 터널의 수신 규칙을 구성합니다.

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## 작동 방식

1. Google Chat은 Gateway로 Webhook POST를 보냅니다. 각 요청에는 `Authorization: Bearer <token>` 헤더가 포함됩니다.
   - 헤더가 있는 경우 OpenClaw는 전체 Webhook 본문을 읽거나 파싱하기 전에 Bearer 인증을 확인합니다.
   - 본문에 `authorizationEventObject.systemIdToken`을 포함하는 Google Workspace Add-on 요청은 더 엄격한 사전 인증 본문 예산을 통해 지원됩니다.
2. OpenClaw는 구성된 `audienceType` + `audience`를 기준으로 토큰을 확인합니다.
   - `audienceType: "app-url"` → audience는 HTTPS Webhook URL입니다.
   - `audienceType: "project-number"` → audience는 Cloud 프로젝트 번호입니다.
3. 메시지는 스페이스별로 라우팅됩니다.
   - DM은 세션 키 `agent:<agentId>:googlechat:direct:<spaceId>`를 사용합니다.
   - 스페이스는 세션 키 `agent:<agentId>:googlechat:group:<spaceId>`를 사용합니다.
4. DM 액세스는 기본적으로 페어링 방식입니다. 알 수 없는 발신자는 페어링 코드를 받으며, 다음 명령으로 승인합니다.
   - `openclaw pairing approve googlechat <code>`
5. 그룹 스페이스는 기본적으로 @멘션이 필요합니다. 멘션 감지에 앱의 사용자 이름이 필요하면 `botUser`를 사용합니다.

## 대상

전송 및 허용 목록에는 다음 식별자를 사용합니다.

- 다이렉트 메시지: `users/<userId>`(권장).
- 원시 이메일 `name@example.com`은 변경 가능하며 `channels.googlechat.dangerouslyAllowNameMatching: true`일 때만 다이렉트 허용 목록 매칭에 사용됩니다.
- 사용 중단됨: `users/<email>`은 이메일 허용 목록이 아니라 사용자 ID로 처리됩니다.
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
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
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

- 서비스 계정 자격 증명은 `serviceAccount`(JSON 문자열)로 인라인 전달할 수도 있습니다.
- `serviceAccountRef`도 지원됩니다(env/file SecretRef). `channels.googlechat.accounts.<id>.serviceAccountRef` 아래의 계정별 ref도 포함됩니다.
- `webhookPath`가 설정되지 않은 경우 기본 Webhook 경로는 `/googlechat`입니다.
- `dangerouslyAllowNameMatching`은 허용 목록에 대해 변경 가능한 이메일 주체 매칭을 다시 활성화합니다(비상 호환성 모드).
- `actions.reactions`가 활성화되면 `reactions` 도구와 `channels action`을 통해 반응을 사용할 수 있습니다.
- 메시지 액션은 텍스트용 `send`와 명시적 첨부 파일 전송용 `upload-file`을 노출합니다. `upload-file`은 `media` / `filePath` / `path`와 선택적 `message`, `filename`, 스레드 대상을 받습니다.
- `typingIndicator`는 `none`, `message`(기본값), `reaction`을 지원합니다(`reaction`에는 사용자 OAuth가 필요함).
- 첨부 파일은 Chat API를 통해 다운로드되어 미디어 파이프라인에 저장됩니다(크기는 `mediaMaxMb`로 제한됨).

시크릿 참조 세부 정보: [시크릿 관리](/ko/gateway/secrets).

## 문제 해결

### 405 Method Not Allowed

Google Cloud Logs Explorer에 다음과 같은 오류가 표시되는 경우:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

이는 Webhook 핸들러가 등록되지 않았다는 뜻입니다. 일반적인 원인은 다음과 같습니다.

1. **채널이 구성되지 않음**: 구성에 `channels.googlechat` 섹션이 없습니다. 다음으로 확인합니다.

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found"가 반환되면 구성을 추가합니다([구성 주요 사항](#config-highlights) 참고).

2. **Plugin이 활성화되지 않음**: Plugin 상태를 확인합니다.

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled"가 표시되면 구성에 `plugins.entries.googlechat.enabled: true`를 추가합니다.

3. **Gateway가 재시작되지 않음**: 구성을 추가한 후 Gateway를 재시작합니다.

   ```bash
   openclaw gateway restart
   ```

채널이 실행 중인지 확인합니다.

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### 기타 문제

- 인증 오류나 누락된 audience 구성을 확인하려면 `openclaw channels status --probe`를 확인합니다.
- 메시지가 도착하지 않으면 Chat 앱의 Webhook URL과 이벤트 구독을 확인합니다.
- 멘션 게이트가 응답을 차단하면 `botUser`를 앱의 사용자 리소스 이름으로 설정하고 `requireMention`을 확인합니다.
- 테스트 메시지를 보내는 동안 요청이 Gateway에 도달하는지 확인하려면 `openclaw logs --follow`를 사용합니다.

관련 문서:

- [Gateway 구성](/ko/gateway/configuration)
- [보안](/ko/gateway/security)
- [반응](/ko/tools/reactions)

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
