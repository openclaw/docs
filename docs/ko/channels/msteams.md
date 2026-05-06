---
read_when:
    - Microsoft Teams 채널 기능 작업
summary: Microsoft Teams 봇 지원 상태, 기능 및 구성
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T06:17:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48e6cba4c5204726015758503e596fc02938d9de788c363190c3e6988e75ce8a
    source_path: channels/msteams.md
    workflow: 16
---

상태: 텍스트 + DM 첨부 파일이 지원됩니다. 채널/그룹 파일 전송에는 `sharePointSiteId` + Graph 권한이 필요합니다([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참조). 설문은 Adaptive Cards를 통해 전송됩니다. 메시지 작업은 파일 우선 전송을 위한 명시적 `upload-file`을 제공합니다.

## 번들 Plugin

Microsoft Teams는 현재 OpenClaw 릴리스에 번들 Plugin으로 포함되어 있으므로, 일반 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드이거나 번들 Teams가 제외된 사용자 지정 설치를 사용하는 경우, npm 패키지를 직접 설치하세요.

```bash
openclaw plugins install @openclaw/msteams
```

현재 공식 릴리스 태그를 따라가려면 기본 패키지를 사용하세요. 재현 가능한 설치가 필요할 때만 정확한 버전을 고정하세요.

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli)는 단일 명령으로 봇 등록, 매니페스트 생성, 자격 증명 생성을 처리합니다.

**1. 설치하고 로그인**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI는 현재 프리뷰 상태입니다. 명령과 플래그는 릴리스마다 변경될 수 있습니다.
</Note>

**2. 터널 시작**(Teams는 localhost에 접근할 수 없음)

아직 설치하지 않았다면 devtunnel CLI를 설치하고 인증하세요([시작 가이드](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams는 devtunnels로 인증할 수 없으므로 `--allow-anonymous`가 필요합니다. 각 수신 봇 요청은 여전히 Teams SDK에 의해 자동으로 검증됩니다.
</Note>

대안: `ngrok http 3978` 또는 `tailscale funnel 3978`(단, 세션마다 URL이 바뀔 수 있음).

**3. 앱 생성**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

이 단일 명령은 다음을 수행합니다.

- Entra ID(Azure AD) 애플리케이션 생성
- 클라이언트 암호 생성
- Teams 앱 매니페스트 빌드 및 업로드(아이콘 포함)
- 봇 등록(기본적으로 Teams 관리 - Azure 구독 필요 없음)

출력에는 `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, 그리고 **Teams App ID**가 표시됩니다. 다음 단계에서 사용할 수 있도록 기록해 두세요. Teams에 앱을 직접 설치할 수도 있습니다.

**4. 출력의 자격 증명으로 OpenClaw 구성:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

또는 환경 변수를 직접 사용하세요: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Teams에 앱 설치**

`teams app create`는 앱을 설치할지 묻습니다. "Install in Teams"를 선택하세요. 건너뛰었다면 나중에 링크를 가져올 수 있습니다.

```bash
teams app get <teamsAppId> --install-link
```

**6. 모든 것이 작동하는지 확인**

```bash
teams app doctor <teamsAppId>
```

이 명령은 봇 등록, AAD 앱 구성, 매니페스트 유효성, SSO 설정 전반에 대해 진단을 실행합니다.

프로덕션 배포에서는 클라이언트 암호 대신 [페더레이션 인증](/ko/channels/msteams#federated-authentication-certificate-plus-managed-identity)(인증서 또는 관리 ID)을 사용하는 것을 고려하세요.

<Note>
그룹 채팅은 기본적으로 차단됩니다(`channels.msteams.groupPolicy: "allowlist"`). 그룹 답장을 허용하려면 `channels.msteams.groupAllowFrom`을 설정하거나, 모든 구성원(멘션 게이트 적용)을 허용하려면 `groupPolicy: "open"`을 사용하세요.
</Note>

## 목표

- Teams DM, 그룹 채팅 또는 채널을 통해 OpenClaw와 대화합니다.
- 라우팅을 결정적으로 유지합니다. 답장은 항상 들어온 채널로 돌아갑니다.
- 안전한 채널 동작을 기본값으로 사용합니다(달리 구성하지 않는 한 멘션 필요).

## 구성 쓰기

기본적으로 Microsoft Teams는 `/config set|unset`에 의해 트리거되는 구성 업데이트를 쓸 수 있습니다(`commands.config: true` 필요).

비활성화:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 접근 제어(DM + 그룹)

**DM 접근**

- 기본값: `channels.msteams.dmPolicy = "pairing"`. 알 수 없는 발신자는 승인될 때까지 무시됩니다.
- `channels.msteams.allowFrom`에는 안정적인 AAD 객체 ID를 사용해야 합니다.
- 허용 목록에는 UPN/표시 이름 매칭에 의존하지 마세요. 변경될 수 있습니다. OpenClaw는 기본적으로 직접 이름 매칭을 비활성화합니다. 명시적으로 사용하려면 `channels.msteams.dangerouslyAllowNameMatching: true`를 설정하세요.
- 마법사는 자격 증명이 허용하는 경우 Microsoft Graph를 통해 이름을 ID로 확인할 수 있습니다.

**그룹 접근**

- 기본값: `channels.msteams.groupPolicy = "allowlist"`(`groupAllowFrom`을 추가하지 않으면 차단됨). 설정되지 않았을 때 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- `channels.msteams.groupAllowFrom`은 그룹 채팅/채널에서 어떤 발신자가 트리거할 수 있는지 제어합니다(`channels.msteams.allowFrom`으로 폴백).
- 모든 구성원(기본적으로 여전히 멘션 게이트 적용)을 허용하려면 `groupPolicy: "open"`을 설정하세요.
- **채널을 전혀 허용하지 않으려면** `channels.msteams.groupPolicy: "disabled"`를 설정하세요.

예:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + 채널 허용 목록**

- `channels.msteams.teams` 아래에 팀과 채널을 나열하여 그룹/채널 답장 범위를 지정합니다.
- 키는 변경 가능한 표시 이름이 아니라 Teams 링크의 안정적인 Teams 대화 ID를 사용해야 합니다.
- `groupPolicy="allowlist"`이고 teams 허용 목록이 있으면, 나열된 팀/채널만 허용됩니다(멘션 게이트 적용).
- 구성 마법사는 `Team/Channel` 항목을 받아 저장해 줍니다.
- 시작 시 OpenClaw는 Graph 권한이 허용하는 경우 팀/채널 및 사용자 허용 목록 이름을 ID로 확인하고
  매핑을 로그에 기록합니다. 확인되지 않은 팀/채널 이름은 입력한 그대로 유지되지만, 기본적으로 라우팅에서는 무시됩니다. 단, `channels.msteams.dangerouslyAllowNameMatching: true`가 활성화된 경우는 예외입니다.

예:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>수동 설정(Teams CLI 없이)</strong></summary>

Teams CLI를 사용할 수 없는 경우 Azure Portal을 통해 봇을 수동으로 설정할 수 있습니다.

### 작동 방식

1. Microsoft Teams Plugin이 사용 가능한지 확인합니다(현재 릴리스에 번들 포함).
2. **Azure Bot**을 생성합니다(App ID + 암호 + 테넌트 ID).
3. 봇을 참조하고 아래 RSC 권한을 포함하는 **Teams 앱 패키지**를 빌드합니다.
4. Teams 앱을 팀에 업로드/설치합니다(DM의 경우 개인 범위).
5. `~/.openclaw/openclaw.json`(또는 env vars)에서 `msteams`를 구성하고 Gateway를 시작합니다.
6. Gateway는 기본적으로 `/api/messages`에서 Bot Framework Webhook 트래픽을 수신합니다.

### 1단계: Azure Bot 생성

1. [Azure Bot 만들기](https://portal.azure.com/#create/Microsoft.AzureBot)로 이동합니다.
2. **Basics** 탭을 채웁니다.

   | 필드 | 값 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | 봇 이름, 예: `openclaw-msteams`(고유해야 함) |
   | **Subscription** | Azure 구독 선택 |
   | **Resource group** | 새로 만들거나 기존 항목 사용 |
   | **Pricing tier** | 개발/테스트용 **Free** |
   | **Type of App** | **Single Tenant**(권장 - 아래 참고 참조) |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
새 멀티 테넌트 봇 생성은 2025-07-31 이후 사용 중단되었습니다. 새 봇에는 **Single Tenant**를 사용하세요.
</Warning>

3. **Review + create** → **Create**를 클릭합니다(~1-2분 대기).

### 2단계: 자격 증명 가져오기

1. Azure Bot 리소스 → **Configuration**으로 이동합니다.
2. **Microsoft App ID** 복사 → 이것이 `appId`입니다.
3. **Manage Password** 클릭 → App Registration으로 이동합니다.
4. **Certificates & secrets** → **New client secret** 아래에서 **Value** 복사 → 이것이 `appPassword`입니다.
5. **Overview**로 이동 → **Directory (tenant) ID** 복사 → 이것이 `tenantId`입니다.

### 3단계: Messaging Endpoint 구성

1. Azure Bot → **Configuration**에서
2. **Messaging endpoint**를 Webhook URL로 설정합니다.
   - 프로덕션: `https://your-domain.com/api/messages`
   - 로컬 개발: 터널 사용(아래 [로컬 개발](#local-development-tunneling) 참조)

### 4단계: Teams Channel 활성화

1. Azure Bot → **Channels**에서
2. **Microsoft Teams** → Configure → Save를 클릭합니다.
3. 서비스 약관에 동의합니다.

### 5단계: Teams 앱 매니페스트 빌드

- `botId = <App ID>`인 `bot` 항목을 포함합니다.
- 범위: `personal`, `team`, `groupChat`.
- `supportsFiles: true`(개인 범위 파일 처리에 필요).
- RSC 권한을 추가합니다([RSC 권한](#current-teams-rsc-permissions-manifest) 참조).
- 아이콘 생성: `outline.png`(32x32) 및 `color.png`(192x192).
- 세 파일 `manifest.json`, `outline.png`, `color.png`를 함께 zip으로 압축합니다.

### 6단계: OpenClaw 구성

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

환경 변수: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### 7단계: Gateway 실행

Teams 채널은 Plugin이 사용 가능하고 자격 증명이 포함된 `msteams` 구성이 있으면 자동으로 시작됩니다.

</details>

## 페더레이션 인증(인증서 및 관리 ID)

> 2026.4.11에 추가됨

프로덕션 배포의 경우 OpenClaw는 클라이언트 암호보다 더 안전한 대안으로 **페더레이션 인증**을 지원합니다. 두 가지 방법을 사용할 수 있습니다.

### 옵션 A: 인증서 기반 인증

Entra ID 앱 등록에 등록된 PEM 인증서를 사용합니다.

**설정:**

1. 인증서를 생성하거나 가져옵니다(개인 키가 포함된 PEM 형식).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 공개 인증서를 업로드합니다.

**구성:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 옵션 B: Azure Managed Identity

비밀번호 없는 인증에는 Azure Managed Identity를 사용합니다. 이는 관리 ID를 사용할 수 있는 Azure 인프라(AKS, App Service, Azure VMs)의 배포에 적합합니다.

**작동 방식:**

1. 봇 pod/VM에 관리 ID가 있습니다(시스템 할당 또는 사용자 할당).
2. **페더레이션 ID 자격 증명**이 관리 ID를 Entra ID 앱 등록에 연결합니다.
3. 런타임에 OpenClaw는 `@azure/identity`를 사용하여 Azure IMDS 엔드포인트(`169.254.169.254`)에서 토큰을 획득합니다.
4. 토큰은 봇 인증을 위해 Teams SDK에 전달됩니다.

**필수 조건:**

- 관리 ID가 활성화된 Azure 인프라(AKS workload identity, App Service, VM)
- Entra ID 앱 등록에 생성된 페더레이션 ID 자격 증명
- pod/VM에서 IMDS(`169.254.169.254:80`)로의 네트워크 접근

**구성(시스템 할당 관리 ID):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**구성(사용자 할당 관리 ID):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**환경 변수:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`(사용자 할당에만 해당)

### AKS 워크로드 ID 설정

워크로드 ID를 사용하는 AKS 배포의 경우:

1. AKS 클러스터에서 **워크로드 ID를 활성화**합니다.
2. Entra ID 앱 등록에 **페더레이션 ID 자격 증명**을 만듭니다.

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 앱 클라이언트 ID로 **Kubernetes 서비스 계정에 주석을 추가**합니다.

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 워크로드 ID 주입을 위해 **pod에 레이블을 지정**합니다.

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS(`169.254.169.254`)에 대한 **네트워크 액세스를 보장**합니다. NetworkPolicy를 사용하는 경우 포트 80에서 `169.254.169.254/32`로 향하는 트래픽을 허용하는 이그레스 규칙을 추가합니다.

### 인증 유형 비교

| 방법                  | 구성                                           | 장점                          | 단점                              |
| -------------------- | ---------------------------------------------- | ----------------------------- | --------------------------------- |
| **클라이언트 시크릿** | `appPassword`                                  | 설정이 간단함                 | 시크릿 순환 필요, 보안성이 낮음  |
| **인증서**           | `authType: "federated"` + `certificatePath`    | 네트워크를 통한 공유 시크릿 없음 | 인증서 관리 부담                 |
| **관리 ID**          | `authType: "federated"` + `useManagedIdentity` | 비밀번호 없음, 관리할 시크릿 없음 | Azure 인프라 필요                |

**기본 동작:** `authType`이 설정되지 않으면 OpenClaw는 기본적으로 클라이언트 시크릿 인증을 사용합니다. 기존 구성은 변경 없이 계속 작동합니다.

## 로컬 개발(터널링)

Teams는 `localhost`에 도달할 수 없습니다. 세션 간에도 URL이 동일하게 유지되도록 영구 개발 터널을 사용하세요.

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

대안: `ngrok http 3978` 또는 `tailscale funnel 3978`(URL은 세션마다 바뀔 수 있음).

터널 URL이 변경되면 엔드포인트를 업데이트합니다.

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Bot 테스트

**진단 실행:**

```bash
teams app doctor <teamsAppId>
```

한 번에 bot 등록, AAD 앱, 매니페스트, SSO 구성을 검사합니다.

**테스트 메시지 보내기:**

1. Teams 앱을 설치합니다(`teams app get <id> --install-link`의 설치 링크 사용).
2. Teams에서 bot을 찾아 DM을 보냅니다.
3. 들어오는 활동이 있는지 Gateway 로그를 확인합니다.

## 환경 변수

대신 모든 구성 키를 환경 변수로 설정할 수 있습니다.

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`(선택 사항: `"secret"` 또는 `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`(페더레이션 + 인증서)
- `MSTEAMS_CERTIFICATE_THUMBPRINT`(선택 사항, 인증에는 필요하지 않음)
- `MSTEAMS_USE_MANAGED_IDENTITY`(페더레이션 + 관리 ID)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`(사용자 할당 MI에만 해당)

## 멤버 정보 작업

OpenClaw는 Microsoft Teams용 Graph 기반 `member-info` 작업을 노출하므로 에이전트와 자동화가 Microsoft Graph에서 직접 채널 멤버 세부 정보(표시 이름, 이메일, 역할)를 확인할 수 있습니다.

요구 사항:

- `Member.Read.Group` RSC 권한(권장 매니페스트에 이미 포함됨)
- 팀 간 조회: 관리자 동의가 있는 `User.Read.All` Graph 애플리케이션 권한

이 작업은 `channels.msteams.actions.memberInfo`로 제어됩니다(기본값: Graph 자격 증명을 사용할 수 있을 때 활성화).

## 기록 컨텍스트

- `channels.msteams.historyLimit`는 최근 채널/그룹 메시지 몇 개를 프롬프트에 포함할지 제어합니다.
- `messages.groupChat.historyLimit`로 대체됩니다. 비활성화하려면 `0`으로 설정합니다(기본값 50).
- 가져온 스레드 기록은 발신자 허용 목록(`allowFrom` / `groupAllowFrom`)으로 필터링되므로, 스레드 컨텍스트 시딩에는 허용된 발신자의 메시지만 포함됩니다.
- 인용된 첨부 파일 컨텍스트(Teams 답장 HTML에서 파생된 `ReplyTo*`)는 현재 수신된 그대로 전달됩니다.
- 즉, 허용 목록은 누가 에이전트를 트리거할 수 있는지를 제어하며, 현재는 특정 보조 컨텍스트 경로만 필터링됩니다.
- DM 기록은 `channels.msteams.dmHistoryLimit`(사용자 턴)로 제한할 수 있습니다. 사용자별 재정의: `channels.msteams.dms["<user_id>"].historyLimit`.

## 현재 Teams RSC 권한(매니페스트)

다음은 Teams 앱 매니페스트의 **기존 resourceSpecific 권한**입니다. 앱이 설치된 팀/채팅 내부에만 적용됩니다.

**채널(팀 범위):**

- `ChannelMessage.Read.Group`(애플리케이션) - @멘션 없이 모든 채널 메시지 수신
- `ChannelMessage.Send.Group`(애플리케이션)
- `Member.Read.Group`(애플리케이션)
- `Owner.Read.Group`(애플리케이션)
- `ChannelSettings.Read.Group`(애플리케이션)
- `TeamMember.Read.Group`(애플리케이션)
- `TeamSettings.Read.Group`(애플리케이션)

**그룹 채팅:**

- `ChatMessage.Read.Chat`(애플리케이션) - @멘션 없이 모든 그룹 채팅 메시지 수신

Teams CLI를 통해 RSC 권한을 추가하려면:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 매니페스트 예시(수정됨)

필수 필드가 포함된 최소한의 유효한 예시입니다. ID와 URL을 교체하세요.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### 매니페스트 주의 사항(필수 필드)

- `bots[].botId`는 Azure Bot 앱 ID와 **반드시** 일치해야 합니다.
- `webApplicationInfo.id`는 Azure Bot 앱 ID와 **반드시** 일치해야 합니다.
- `bots[].scopes`에는 사용하려는 표면(`personal`, `team`, `groupChat`)이 포함되어야 합니다.
- 개인 범위에서 파일 처리를 하려면 `bots[].supportsFiles: true`가 필요합니다.
- 채널 트래픽을 원한다면 `authorization.permissions.resourceSpecific`에 채널 읽기/보내기가 포함되어야 합니다.

### 기존 앱 업데이트

이미 설치된 Teams 앱을 업데이트하려면(예: RSC 권한 추가):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

업데이트 후 새 권한이 적용되도록 각 팀에서 앱을 다시 설치하고, 캐시된 앱 메타데이터를 지우기 위해 Teams를 **완전히 종료한 뒤 다시 실행**합니다(창만 닫는 것이 아님).

<details>
<summary>수동 매니페스트 업데이트(CLI 없이)</summary>

1. 새 설정으로 `manifest.json`을 업데이트합니다.
2. **`version` 필드를 증가**시킵니다(예: `1.0.0` → `1.1.0`).
3. 아이콘과 함께 매니페스트를 **다시 zip으로 압축**합니다(`manifest.json`, `outline.png`, `color.png`).
4. 새 zip을 업로드합니다.
   - **Teams Admin Center:** Teams 앱 → 앱 관리 → 앱 찾기 → 새 버전 업로드
   - **사이드로드:** Teams에서 → 앱 → 앱 관리 → 사용자 지정 앱 업로드

</details>

## 기능: RSC만 사용 vs Graph

### **Teams RSC만** 사용하는 경우(앱 설치됨, Graph API 권한 없음)

작동함:

- 채널 메시지 **텍스트** 콘텐츠 읽기.
- 채널 메시지 **텍스트** 콘텐츠 보내기.
- **개인(DM)** 파일 첨부 파일 수신.

작동하지 않음:

- 채널/그룹 **이미지 또는 파일 콘텐츠**(페이로드에는 HTML 스텁만 포함됨).
- SharePoint/OneDrive에 저장된 첨부 파일 다운로드.
- 메시지 기록 읽기(실시간 Webhook 이벤트를 넘어서는 기록).

### **Teams RSC + Microsoft Graph 애플리케이션 권한**을 사용하는 경우

추가됨:

- 호스팅된 콘텐츠 다운로드(메시지에 붙여 넣은 이미지).
- SharePoint/OneDrive에 저장된 파일 첨부 파일 다운로드.
- Graph를 통한 채널/채팅 메시지 기록 읽기.

### RSC vs Graph API

| 기능                    | RSC 권한             | Graph API                         |
| ----------------------- | -------------------- | --------------------------------- |
| **실시간 메시지**       | 예(Webhook을 통해)   | 아니요(폴링만 가능)              |
| **이전 메시지**         | 아니요               | 예(기록 쿼리 가능)               |
| **설정 복잡도**         | 앱 매니페스트만      | 관리자 동의 + 토큰 흐름 필요     |
| **오프라인에서 작동**   | 아니요(실행 중이어야 함) | 예(언제든지 쿼리 가능)       |

**핵심:** RSC는 실시간 수신용이고, Graph API는 기록 액세스용입니다. 오프라인 동안 놓친 메시지를 따라잡으려면 `ChannelMessage.Read.All`이 포함된 Graph API가 필요합니다(관리자 동의 필요).

## Graph 사용 미디어 + 기록(채널에 필요)

**채널**에서 이미지/파일이 필요하거나 **메시지 기록**을 가져오려면 Microsoft Graph 권한을 활성화하고 관리자 동의를 부여해야 합니다.

1. Entra ID(Azure AD) **앱 등록**에서 Microsoft Graph **애플리케이션 권한**을 추가합니다.
   - `ChannelMessage.Read.All`(채널 첨부 파일 + 기록)
   - `Chat.Read.All` 또는 `ChatMessage.Read.All`(그룹 채팅)
2. 테넌트에 대해 **관리자 동의**를 부여합니다.
3. Teams 앱 **매니페스트 버전**을 올리고, 다시 업로드한 뒤, **Teams에서 앱을 다시 설치**합니다.
4. 캐시된 앱 메타데이터를 지우려면 Teams를 **완전히 종료한 뒤 다시 실행**합니다.

**사용자 멘션을 위한 추가 권한:** 대화에 있는 사용자에 대한 사용자 @멘션은 기본적으로 작동합니다. 그러나 **현재 대화에 없는** 사용자를 동적으로 검색하고 멘션하려면 `User.Read.All`(애플리케이션) 권한을 추가하고 관리자 동의를 부여합니다.

## 알려진 제한 사항

### Webhook 시간 초과

Teams는 HTTP Webhook을 통해 메시지를 전달합니다. 처리 시간이 너무 오래 걸리면(예: 느린 LLM 응답) 다음이 발생할 수 있습니다.

- Gateway 시간 초과
- Teams가 메시지를 다시 시도함(중복 발생)
- 답장 누락

OpenClaw는 빠르게 반환하고 능동적으로 답장을 보내 이를 처리하지만, 매우 느린 응답은 여전히 문제를 일으킬 수 있습니다.

### 서식

Teams Markdown은 Slack이나 Discord보다 더 제한적입니다:

- 기본 서식이 작동합니다: **굵게**, _기울임_, `code`, 링크
- 복잡한 Markdown(표, 중첩 목록)은 올바르게 렌더링되지 않을 수 있습니다
- Adaptive Cards는 투표와 의미 기반 프레젠테이션 전송에 지원됩니다(아래 참조)

## 구성

주요 설정(`/gateway/configuration`에서 공유 채널 패턴 참조):

- `channels.msteams.enabled`: 채널을 활성화/비활성화합니다.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: 봇 자격 증명입니다.
- `channels.msteams.webhook.port`(기본값 `3978`)
- `channels.msteams.webhook.path`(기본값 `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing)
- `channels.msteams.allowFrom`: DM 허용 목록(AAD 개체 ID 권장). Graph 액세스가 가능하면 마법사가 설정 중 이름을 ID로 확인합니다.
- `channels.msteams.dangerouslyAllowNameMatching`: 변경 가능한 UPN/표시 이름 매칭 및 직접 팀/채널 이름 라우팅을 다시 활성화하는 비상 토글입니다.
- `channels.msteams.textChunkLimit`: 발신 텍스트 청크 크기입니다.
- `channels.msteams.chunkMode`: 길이 기준 청킹 전에 빈 줄(문단 경계)에서 분할하려면 `length`(기본값) 또는 `newline`입니다.
- `channels.msteams.mediaAllowHosts`: 수신 첨부 파일 호스트 허용 목록(기본값은 Microsoft/Teams 도메인).
- `channels.msteams.mediaAuthAllowHosts`: 미디어 재시도 시 Authorization 헤더를 첨부할 호스트 허용 목록(기본값은 Graph + Bot Framework 호스트).
- `channels.msteams.requireMention`: 채널/그룹에서 @멘션을 요구합니다(기본값 true).
- `channels.msteams.replyStyle`: `thread | top-level`([답장 스타일](#reply-style-threads-vs-posts) 참조).
- `channels.msteams.teams.<teamId>.replyStyle`: 팀별 재정의입니다.
- `channels.msteams.teams.<teamId>.requireMention`: 팀별 재정의입니다.
- `channels.msteams.teams.<teamId>.tools`: 채널 재정의가 없을 때 사용되는 기본 팀별 도구 정책 재정의(`allow`/`deny`/`alsoAllow`)입니다.
- `channels.msteams.teams.<teamId>.toolsBySender`: 기본 팀별 발신자별 도구 정책 재정의(`"*"` 와일드카드 지원)입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: 채널별 재정의입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: 채널별 재정의입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: 채널별 도구 정책 재정의(`allow`/`deny`/`alsoAllow`)입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: 채널별 발신자별 도구 정책 재정의(`"*"` 와일드카드 지원)입니다.
- `toolsBySender` 키는 명시적 접두사를 사용해야 합니다:
  `id:`, `e164:`, `username:`, `name:`(레거시 접두사 없는 키는 여전히 `id:`로만 매핑됨).
- `channels.msteams.actions.memberInfo`: Graph 기반 멤버 정보 액션을 활성화하거나 비활성화합니다(기본값: Graph 자격 증명이 있을 때 활성화).
- `channels.msteams.authType`: 인증 유형 - `"secret"`(기본값) 또는 `"federated"`.
- `channels.msteams.certificatePath`: PEM 인증서 파일 경로(federated + 인증서 인증).
- `channels.msteams.certificateThumbprint`: 인증서 지문(선택 사항, 인증에 필수 아님).
- `channels.msteams.useManagedIdentity`: 관리 ID 인증을 활성화합니다(federated 모드).
- `channels.msteams.managedIdentityClientId`: 사용자 할당 관리 ID의 클라이언트 ID입니다.
- `channels.msteams.sharePointSiteId`: 그룹 채팅/채널에서 파일 업로드에 사용할 SharePoint 사이트 ID([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참조).

## 라우팅 및 세션

- 세션 키는 표준 에이전트 형식을 따릅니다([/concepts/session](/ko/concepts/session) 참조):
  - 직접 메시지는 기본 세션을 공유합니다(`agent:<agentId>:<mainKey>`).
  - 채널/그룹 메시지는 대화 ID를 사용합니다:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 답장 스타일: 스레드와 게시물 비교

Teams는 최근 동일한 기본 데이터 모델 위에 두 가지 채널 UI 스타일을 도입했습니다:

| 스타일                    | 설명                                               | 권장 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **게시물**(클래식)      | 메시지가 아래에 스레드형 답장이 있는 카드로 표시됩니다 | `thread`(기본값)       |
| **스레드**(Slack 유사) | 메시지가 Slack처럼 선형으로 흐릅니다                   | `top-level`              |

**문제:** Teams API는 채널이 어떤 UI 스타일을 사용하는지 노출하지 않습니다. 잘못된 `replyStyle`을 사용하면:

- Threads 스타일 채널에서 `thread` → 답장이 어색하게 중첩되어 표시됩니다
- Posts 스타일 채널에서 `top-level` → 답장이 스레드 내부가 아니라 별도의 최상위 게시물로 표시됩니다

**해결책:** 채널 설정 방식에 따라 채널별로 `replyStyle`을 구성하세요:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## 첨부 파일 및 이미지

**현재 제한 사항:**

- **DM:** 이미지는 Teams 봇 파일 API를 통해 작동합니다.
- **채널/그룹:** 첨부 파일은 M365 저장소(SharePoint/OneDrive)에 있습니다. Webhook 페이로드에는 실제 파일 바이트가 아니라 HTML 스텁만 포함됩니다. 채널 첨부 파일을 다운로드하려면 **Graph API 권한이 필요합니다**.
- 명시적인 파일 우선 전송에는 `media` / `filePath` / `path`와 함께 `action=upload-file`을 사용하세요. 선택 사항인 `message`는 함께 제공되는 텍스트/댓글이 되며, `filename`은 업로드된 이름을 재정의합니다.

Graph 권한이 없으면 이미지가 있는 채널 메시지는 텍스트만으로 수신됩니다(이미지 콘텐츠는 봇이 액세스할 수 없음).
기본적으로 OpenClaw는 Microsoft/Teams 호스트 이름에서만 미디어를 다운로드합니다. `channels.msteams.mediaAllowHosts`로 재정의하세요(모든 호스트를 허용하려면 `["*"]` 사용).
Authorization 헤더는 `channels.msteams.mediaAuthAllowHosts`에 있는 호스트에만 첨부됩니다(기본값은 Graph + Bot Framework 호스트). 이 목록은 엄격하게 유지하세요(멀티 테넌트 접미사 피하기).

## 그룹 채팅에서 파일 보내기

봇은 FileConsentCard 흐름(기본 제공)을 사용하여 DM에서 파일을 보낼 수 있습니다. 그러나 **그룹 채팅/채널에서 파일 보내기**에는 추가 설정이 필요합니다:

| 컨텍스트                  | 파일 전송 방식                           | 필요한 설정                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → 사용자가 수락 → 봇 업로드 | 별도 설정 없이 작동                            |
| **그룹 채팅/채널** | SharePoint에 업로드 → 링크 공유            | `sharePointSiteId` + Graph 권한 필요 |
| **이미지(모든 컨텍스트)** | Base64 인코딩 인라인                        | 별도 설정 없이 작동                            |

### 그룹 채팅에 SharePoint가 필요한 이유

봇에는 개인 OneDrive 드라이브가 없습니다(`/me/drive` Graph API 엔드포인트는 애플리케이션 ID에서 작동하지 않음). 그룹 채팅/채널에서 파일을 보내려면 봇이 **SharePoint 사이트**에 업로드하고 공유 링크를 생성합니다.

### 설정

1. Entra ID(Azure AD) → 앱 등록에서 **Graph API 권한 추가**:
   - `Sites.ReadWrite.All`(Application) - SharePoint에 파일 업로드
   - `Chat.Read.All`(Application) - 선택 사항, 사용자별 공유 링크 활성화

2. 테넌트에 대해 **관리자 동의 부여**.

3. **SharePoint 사이트 ID 가져오기:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw 구성:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 공유 동작

| 권한                              | 공유 동작                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All`만              | 조직 전체 공유 링크(조직 내 누구나 액세스 가능) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 사용자별 공유 링크(채팅 멤버만 액세스 가능)      |

사용자별 공유는 채팅 참여자만 파일에 액세스할 수 있으므로 더 안전합니다. `Chat.Read.All` 권한이 없으면 봇은 조직 전체 공유로 대체합니다.

### 대체 동작

| 시나리오                                          | 결과                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| 그룹 채팅 + 파일 + `sharePointSiteId` 구성됨 | SharePoint에 업로드하고 공유 링크 전송            |
| 그룹 채팅 + 파일 + `sharePointSiteId` 없음         | OneDrive 업로드 시도(실패할 수 있음), 텍스트만 전송 |
| 개인 채팅 + 파일                              | FileConsentCard 흐름(SharePoint 없이 작동)    |
| 모든 컨텍스트 + 이미지                               | Base64 인코딩 인라인(SharePoint 없이 작동)   |

### 파일 저장 위치

업로드된 파일은 구성된 SharePoint 사이트의 기본 문서 라이브러리 안 `/OpenClawShared/` 폴더에 저장됩니다.

## 투표(Adaptive Cards)

OpenClaw는 Teams 투표를 Adaptive Cards로 보냅니다(네이티브 Teams 투표 API는 없음).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 투표는 Gateway가 `~/.openclaw/msteams-polls.json`에 기록합니다.
- 투표를 기록하려면 Gateway가 온라인 상태를 유지해야 합니다.
- 투표는 아직 결과 요약을 자동 게시하지 않습니다(필요하면 저장소 파일을 확인하세요).

## 프레젠테이션 카드

`message` 도구 또는 CLI를 사용하여 의미 기반 프레젠테이션 페이로드를 Teams 사용자 또는 대화로 보내세요. OpenClaw는 일반 프레젠테이션 계약에서 이를 Teams Adaptive Cards로 렌더링합니다.

`presentation` 매개변수는 의미 기반 블록을 받습니다. `presentation`이 제공되면 메시지 텍스트는 선택 사항입니다.

**에이전트 도구:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

대상 형식 세부 정보는 아래 [대상 형식](#target-formats)을 참조하세요.

## 대상 형식

MSTeams 대상은 사용자와 대화를 구분하기 위해 접두사를 사용합니다:

| 대상 유형         | 형식                           | 예시                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 사용자(ID 기준)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 사용자(이름 기준)      | `user:<display-name>`            | `user:John Smith`(Graph API 필요)              |
| 그룹/채널       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 그룹/채널(원시) | `<conversation-id>`              | `19:abc123...@thread.tacv2`(`@thread`를 포함하는 경우) |

**CLI 예시:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**에이전트 도구 예시:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
`user:` 접두사가 없으면 이름은 기본적으로 그룹 또는 팀 해석에 사용됩니다. 표시 이름으로 사람을 대상으로 지정할 때는 항상 `user:`를 사용하세요.
</Note>

## 사전 메시징

- 사전 메시지는 사용자가 상호작용한 **후에만** 가능합니다. 해당 시점에 대화 참조를 저장하기 때문입니다.
- `dmPolicy` 및 허용 목록 게이팅은 `/gateway/configuration`을 참조하세요.

## 팀 및 채널 ID (흔한 함정)

Teams URL의 `groupId` 쿼리 매개변수는 구성에 사용되는 팀 ID가 **아닙니다**. 대신 URL 경로에서 ID를 추출하세요.

**팀 URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**채널 URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**구성의 경우:**

- 팀 키 = `/team/` 뒤의 경로 세그먼트(URL 디코딩됨, 예: `19:Bk4j...@thread.tacv2`; 오래된 테넌트에서는 `@thread.skype`가 표시될 수 있으며 이것도 유효함)
- 채널 키 = `/channel/` 뒤의 경로 세그먼트(URL 디코딩됨)
- OpenClaw 라우팅에서는 `groupId` 쿼리 매개변수를 **무시**하세요. 이는 Microsoft Entra 그룹 ID이며, 수신 Teams 활동에서 사용되는 Bot Framework 대화 ID가 아닙니다.

## 비공개 채널

Bot은 비공개 채널에서 제한적으로 지원됩니다.

| 기능                         | 표준 채널 | 비공개 채널              |
| ---------------------------- | --------- | ------------------------ |
| Bot 설치                     | 예        | 제한적                   |
| 실시간 메시지(Webhook)       | 예        | 작동하지 않을 수 있음    |
| RSC 권한                     | 예        | 다르게 동작할 수 있음    |
| @멘션                        | 예        | Bot에 접근할 수 있는 경우 |
| Graph API 기록              | 예        | 예(권한 필요)            |

**비공개 채널이 작동하지 않을 때의 우회 방법:**

1. Bot 상호작용에는 표준 채널을 사용합니다
2. DM을 사용합니다. 사용자는 언제든지 Bot에 직접 메시지를 보낼 수 있습니다
3. 기록 접근에는 Graph API를 사용합니다(`ChannelMessage.Read.All` 필요)

## 문제 해결

### 일반적인 문제

- **채널에 이미지가 표시되지 않음:** Graph 권한 또는 관리자 동의가 없습니다. Teams 앱을 다시 설치하고 Teams를 완전히 종료한 뒤 다시 여세요.
- **채널에서 응답이 없음:** 기본적으로 멘션이 필요합니다. `channels.msteams.requireMention=false`를 설정하거나 팀/채널별로 구성하세요.
- **버전 불일치(Teams에 여전히 이전 매니페스트가 표시됨):** 앱을 제거한 뒤 다시 추가하고, 새로고침하려면 Teams를 완전히 종료하세요.
- **Webhook에서 401 Unauthorized:** Azure JWT 없이 수동으로 테스트할 때 예상되는 동작입니다. 엔드포인트에 도달할 수 있지만 인증이 실패했다는 의미입니다. 올바르게 테스트하려면 Azure Web Chat을 사용하세요.

### 매니페스트 업로드 오류

- **"Icon file cannot be empty":** 매니페스트가 참조하는 아이콘 파일이 0바이트입니다. 유효한 PNG 아이콘을 만드세요(`outline.png`는 32x32, `color.png`는 192x192).
- **"webApplicationInfo.Id already in use":** 앱이 아직 다른 팀/채팅에 설치되어 있습니다. 먼저 찾아서 제거하거나, 전파될 때까지 5~10분 기다리세요.
- **업로드 시 "Something went wrong":** 대신 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com)을 통해 업로드하고, 브라우저 DevTools(F12) → Network 탭을 열어 실제 오류가 담긴 응답 본문을 확인하세요.
- **사이드로드 실패:** "Upload a custom app" 대신 "Upload an app to your org's app catalog"를 사용해 보세요. 이렇게 하면 사이드로드 제한을 우회하는 경우가 많습니다.

### RSC 권한이 작동하지 않음

1. `webApplicationInfo.id`가 Bot의 App ID와 정확히 일치하는지 확인합니다
2. 앱을 다시 업로드하고 팀/채팅에 다시 설치합니다
3. 조직 관리자가 RSC 권한을 차단했는지 확인합니다
4. 올바른 범위를 사용 중인지 확인합니다. 팀에는 `ChannelMessage.Read.Group`, 그룹 채팅에는 `ChatMessage.Read.Chat`

## 참고 자료

- [Azure Bot 만들기](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 설정 가이드
- [Teams 개발자 포털](https://dev.teams.microsoft.com/apps) - Teams 앱 생성/관리
- [Teams 앱 매니페스트 스키마](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC로 채널 메시지 받기](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 권한 참고 자료](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams Bot 파일 처리](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (채널/그룹에는 Graph 필요)
- [사전 메시징](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Bot 관리를 위한 Teams CLI

## 관련 문서

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) - 메시지에 대한 세션 라우팅
- [보안](/ko/gateway/security) - 접근 모델 및 강화
