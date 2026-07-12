---
read_when:
    - Google Chat 채널 기능 작업하기
summary: Google Chat 앱 지원 상태, 기능 및 구성
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T00:31:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat은 공식 `@openclaw/googlechat` Plugin으로 실행됩니다. Google Chat API Webhook을 통해 DM과 스페이스를 지원합니다(HTTP 엔드포인트만 지원하며 Pub/Sub은 지원하지 않음).

## 설치

```bash
openclaw plugins install @openclaw/googlechat
```

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## 빠른 설정(초보자용)

1. Google Cloud 프로젝트를 생성하고 **Google Chat API**를 활성화합니다.
   - 이동: [Google Chat API 사용자 인증 정보](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API가 아직 활성화되지 않았다면 활성화합니다.
2. **Service Account**를 생성합니다.
   - **Create Credentials** > **Service Account**를 누릅니다.
   - 원하는 이름을 지정합니다(예: `openclaw-chat`).
   - 권한과 주 구성원은 비워 둡니다(**Continue**를 누른 다음 **Done**).
3. **JSON 키**를 생성하고 다운로드합니다.
   - 새 서비스 계정 > **Keys** 탭 > **Add Key** > **Create new key** > **JSON** > **Create**를 클릭합니다.
4. 다운로드한 JSON 파일을 Gateway 호스트에 저장합니다(예: `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat 구성](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 Google Chat 앱을 생성합니다.
   - **Application info**(앱 이름, 아바타 URL, 설명)를 입력합니다.
   - **Interactive features**를 활성화합니다.
   - **Functionality**에서 **Join spaces and group conversations**를 선택합니다.
   - **Connection settings**에서 **HTTP endpoint URL**을 선택합니다.
   - **Triggers**에서 **Use a common HTTP endpoint URL for all triggers**를 선택하고 공개 Gateway URL 뒤에 `/googlechat`을 붙인 주소를 설정합니다([공개 URL](#public-url-webhook-only) 참조).
   - **Visibility**에서 **Make this Chat app available to specific people and groups in `<Your Domain>`**을 선택하고 이메일 주소를 입력합니다.
   - **Save**를 클릭합니다.
6. 앱 상태를 활성화합니다. 페이지를 새로고침하고 **App status**를 찾은 다음 **Live - available to users**로 설정하고 다시 **Save**를 클릭합니다.
7. 서비스 계정과 Webhook 대상을 사용하도록 OpenClaw를 구성합니다(Chat 앱 구성과 일치해야 함).
   - 환경 변수: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`(기본 계정에만 적용), 또는
   - 구성: [주요 구성 항목](#config-highlights)을 참조하세요. `openclaw channels add --channel googlechat`은 `--audience-type`, `--audience`, `--webhook-path`, `--webhook-url`도 지원합니다.
8. Gateway를 시작합니다. Google Chat이 Webhook 경로(기본값 `/googlechat`)로 POST 요청을 보냅니다.

## Google Chat에 추가

Gateway가 실행 중이고 이메일이 공개 대상 목록에 포함되어 있으면 다음을 수행합니다.

1. [Google Chat](https://chat.google.com/)으로 이동합니다.
2. **Direct Messages** 옆의 **+**(더하기) 아이콘을 클릭합니다.
3. Google Cloud Console에서 구성한 **App name**을 검색합니다.
   - 비공개 앱이므로 봇은 Marketplace 탐색 목록에 표시되지 않습니다. 이름으로 검색하세요.
4. 봇을 선택하고 **Add** 또는 **Chat**을 클릭한 다음 메시지를 보냅니다.

## 공개 URL(Webhook 전용)

Google Chat Webhook에는 공개 HTTPS 엔드포인트가 필요합니다. 보안을 위해 인터넷에는 **`/googlechat` 경로만** 노출하고 OpenClaw 대시보드와 다른 엔드포인트는 비공개로 유지하세요.

### 옵션 A: Tailscale Funnel(권장)

비공개 대시보드에는 Tailscale Serve를 사용하고 공개 Webhook 경로에는 Funnel을 사용합니다.

1. Gateway가 바인딩된 주소를 확인합니다.

   ```bash
   ss -tlnp | grep 18789
   ```

   IP를 기록합니다(예: `127.0.0.1`, `0.0.0.0` 또는 Tailscale `100.x.x.x` 주소).

2. 대시보드를 tailnet에만 노출합니다(포트 8443).

   ```bash
   # localhost(127.0.0.1 또는 0.0.0.0)에 바인딩된 경우:
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP에만 바인딩된 경우:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Webhook 경로만 공개적으로 노출합니다.

   ```bash
   # localhost(127.0.0.1 또는 0.0.0.0)에 바인딩된 경우:
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP에만 바인딩된 경우:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. 메시지가 표시되면 출력에 나타난 승인 URL을 방문하여 이 Node에 Funnel을 활성화합니다.

5. 확인합니다.

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

공개 Webhook URL은 `https://<node-name>.<tailnet>.ts.net/googlechat`이며, 대시보드는 `https://<node-name>.<tailnet>.ts.net:8443/`에서 tailnet 전용으로 유지됩니다. Google Chat 앱 구성에는 공개 URL(`:8443` 제외)을 사용합니다.

> 참고: 이 구성은 재부팅 후에도 유지됩니다. 나중에 제거하려면 `tailscale funnel reset`과 `tailscale serve reset`을 사용하세요.

### 옵션 B: 리버스 프록시(Caddy)

Webhook 경로만 프록시합니다.

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

`your-domain.com/` 요청은 무시되거나 404를 반환하지만 `your-domain.com/googlechat` 요청은 OpenClaw로 라우팅됩니다.

### 옵션 C: Cloudflare Tunnel

Webhook 경로만 라우팅하도록 터널 수신 규칙을 구성합니다.

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## 작동 방식

1. Google Chat이 Gateway Webhook 경로로 JSON을 POST합니다(POST만 허용, JSON 콘텐츠 유형 필수, IP별 요청 속도 제한 적용).
2. OpenClaw는 디스패치 전에 모든 요청을 인증합니다.
   - Chat 앱 이벤트에는 `Authorization: Bearer <token>`이 포함되며, 전체 본문을 파싱하기 전에 토큰을 검증합니다.
   - Google Workspace 부가기능 이벤트에는 본문(`authorizationEventObject.systemIdToken`)에 토큰이 포함되며, 검증 전에 더 엄격한 사전 인증 한도(16KB, 3초) 내에서 읽습니다.
3. 토큰을 `audienceType` + `audience`와 대조합니다.
   - `audienceType: "app-url"` → 대상은 HTTPS Webhook URL입니다.
   - `audienceType: "project-number"` → 대상은 Cloud 프로젝트 번호입니다.
   - `app-url`을 사용하는 부가기능 토큰에서는 앱의 숫자형 OAuth 2.0 클라이언트 ID(21자리, 이메일 아님)를 `appPrincipal`로 추가 설정해야 합니다. 그렇지 않으면 경고를 기록하고 검증에 실패합니다.
4. 메시지는 스페이스별로 라우팅됩니다.
   - 스페이스에는 스페이스별 세션 `agent:<agentId>:googlechat:group:<spaceId>`이 할당되며, 답장은 메시지 스레드로 전송됩니다.
   - DM은 기본적으로 에이전트의 기본 세션으로 통합됩니다. 상대별 DM 세션을 사용하려면 `session.dmScope`를 설정하세요([세션](/ko/concepts/session) 참조).
5. DM 접근은 기본적으로 페어링 방식입니다. 알 수 없는 발신자는 페어링 코드를 받으며, 다음 명령으로 승인합니다.
   - `openclaw pairing approve googlechat <code>`
6. 그룹 스페이스에서는 기본적으로 @멘션이 필요합니다. 멘션은 앱을 대상으로 하는 Chat `USER_MENTION` 주석에서 감지됩니다. 감지에 앱의 사용자 리소스 이름이 필요한 경우 `botUser`(예: `users/1234567890`)를 설정하세요.
7. Google Chat에서 실행 또는 Plugin 승인이 시작되고 안정적인 `users/<id>` 승인자가 구성되어 있으면 OpenClaw는 시작된 스페이스 또는 스레드에 네이티브 승인 카드(`cardsV2`)를 게시합니다. 카드 버튼에는 불투명 콜백 토큰이 포함됩니다. 네이티브 전송을 사용할 수 없는 경우에만 수동 `/approve <id> <decision>` 프롬프트가 표시됩니다.

## 대상

전송 및 허용 목록에 다음 식별자를 사용합니다.

- 다이렉트 메시지: `users/<userId>`(권장).
- 스페이스: `spaces/<spaceId>`.
- 원시 이메일 `name@example.com`은 변경될 수 있으며 `channels.googlechat.dangerouslyAllowNameMatching: true`인 경우에만 허용 목록 일치에 사용됩니다.
- 더 이상 권장되지 않음: `users/<email>`은 이메일 허용 목록 항목이 아니라 사용자 ID로 처리됩니다.
- `googlechat:`, `google-chat:`, `gchat:` 접두사는 허용되며 제거됩니다.

## 주요 구성 항목

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // 또는 serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // 부가기능 검증 전용; 숫자형 OAuth 클라이언트 ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 선택 사항; 멘션 감지에 도움
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
          systemPrompt: "짧게만 답변하세요.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

참고:

- 서비스 계정 사용자 인증 정보: `serviceAccountFile`(경로), `serviceAccount`(인라인 JSON 문자열 또는 객체), `serviceAccountRef`(환경 변수/파일 SecretRef)를 사용할 수 있습니다. 환경 변수 `GOOGLE_CHAT_SERVICE_ACCOUNT`(인라인 JSON)와 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`(경로)은 기본 계정에만 적용됩니다. 다중 계정 설정에서는 계정별 `serviceAccountRef`를 포함하여 동일한 키로 `channels.googlechat.accounts.<id>`를 사용합니다.
- `webhookPath`가 설정되지 않은 경우 기본 Webhook 경로는 `/googlechat`입니다. 대신 `webhookUrl`로 경로를 제공할 수도 있습니다.
- 그룹 키는 안정적인 스페이스 ID(`spaces/<spaceId>`)여야 합니다. 표시 이름 키는 더 이상 권장되지 않으며 로그에 해당 사실이 기록됩니다.
- `dangerouslyAllowNameMatching`은 허용 목록에서 변경 가능한 이메일 주체 일치를 다시 활성화합니다(비상용 호환성 모드). doctor는 이메일 항목에 대해 경고합니다.
- Google Chat 반응 작업은 노출되지 않습니다. 이 Plugin은 서비스 계정 인증을 사용하지만 Google Chat 반응 엔드포인트에는 사용자 인증이 필요합니다. 기존 `actions.reactions` 구성은 호환성을 위해 허용되지만 아무 효과가 없습니다.
- 네이티브 승인 카드는 반응 이벤트가 아니라 Google Chat `cardsV2` 버튼 클릭을 사용합니다. 승인자는 `dm.allowFrom` 또는 `defaultTo`에서 가져오며 안정적인 숫자형 `users/<id>` 값이어야 합니다.
- 메시지 작업은 텍스트 `send`만 노출합니다. Google Chat 첨부 파일 업로드에는 사용자 인증이 필요하지만 이 Plugin은 서비스 계정 인증을 사용하므로 발신 파일 업로드는 노출되지 않습니다.
- `typingIndicator`: `message`(기본값)는 `_<Bot> is typing..._` 자리표시자를 게시한 뒤 첫 번째 답장으로 수정합니다. `none`은 이를 비활성화합니다. `reaction`에는 사용자 OAuth가 필요하며 현재 서비스 계정 인증에서는 오류를 기록하고 `message`로 대체됩니다.
- 수신 첨부 파일(메시지당 첫 번째 첨부 파일)은 Chat API를 통해 미디어 파이프라인으로 다운로드되며 `mediaMaxMb`(기본값 20)로 제한됩니다.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`를 설정하면 허용된 봇 메시지에 공유 [봇 루프 방지](/ko/channels/bot-loop-protection)를 사용합니다. `channels.defaults.botLoopProtection`을 구성한 다음 `channels.googlechat.botLoopProtection` 또는 `channels.googlechat.groups.<space>.botLoopProtection`으로 재정의하세요.

보안 비밀 참조 세부 정보: [보안 비밀 관리](/ko/gateway/secrets).

## 문제 해결

### 405 허용되지 않는 메서드

Google Cloud Logs Explorer에 다음과 같은 오류가 표시되는 경우:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Webhook 핸들러가 등록되지 않은 것입니다. 일반적인 원인은 다음과 같습니다.

1. **채널이 구성되지 않음**: `channels.googlechat` 섹션이 없습니다. 다음 명령으로 확인합니다.

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found"가 반환되면 구성을 추가하세요([주요 구성 항목](#config-highlights) 참조).

2. **Plugin이 활성화되지 않음**: Plugin 상태를 확인합니다.

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled"가 표시되면 구성에 `plugins.entries.googlechat.enabled: true`를 추가하세요.

3. 구성 변경 후 **Gateway를 다시 시작하지 않음**:

   ```bash
   openclaw gateway restart
   ```

채널이 실행 중인지 확인합니다.

```bash
openclaw channels status
# 다음과 같이 표시되어야 함: Google Chat default: enabled, configured, ...
```

### 기타 문제

- `openclaw channels status --probe`는 인증 오류와 누락된 대상 구성(`audience`와 `audienceType`이 모두 필요함)을 표시합니다.
- 메시지가 도착하지 않으면 Chat 앱의 Webhook URL과 트리거 구성을 확인하세요.
- 멘션 제한 때문에 답장이 차단되면 `botUser`를 앱의 사용자 리소스 이름으로 설정하고 `requireMention`을 확인하세요.
- 테스트 메시지를 보내는 동안 `openclaw logs --follow`를 실행하면 요청이 Gateway에 도달하는지 확인할 수 있습니다.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [Gateway 구성](/ko/gateway/configuration)
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 제한
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 접근 모델 및 보안 강화
