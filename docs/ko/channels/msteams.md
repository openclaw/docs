---
read_when:
    - Microsoft Teams 채널 기능 작업 중
summary: Microsoft Teams 봇 지원 상태, 기능 및 구성
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T13:58:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "여기에 들어오는 자, 모든 희망을 버려라."

상태: 텍스트 + DM 첨부파일이 지원됩니다. 채널/그룹 파일 전송에는 `sharePointSiteId` + Graph 권한이 필요합니다([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참고). 투표는 Adaptive Cards를 통해 전송됩니다. 메시지 작업은 파일 우선 전송을 위한 명시적인 `upload-file`을 노출합니다.

## 번들 plugin

Microsoft Teams는 현재 OpenClaw 릴리스에서 번들 plugin으로 제공되므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드 또는 번들 Teams가 제외된 사용자 지정 설치를 사용하는 경우에는 수동으로 설치하세요.

```bash
openclaw plugins install @openclaw/msteams
```

로컬 체크아웃에서 설치(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정(초급)

1. Microsoft Teams plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지형 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. **Azure Bot**(App ID + 클라이언트 시크릿 + tenant ID)을 생성합니다.
3. 해당 자격 증명으로 OpenClaw를 구성합니다.
4. 공개 URL 또는 터널을 통해 `/api/messages`(기본 포트 3978)를 노출합니다.
5. Teams 앱 패키지를 설치하고 Gateway를 시작합니다.

최소 구성(클라이언트 시크릿):

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

프로덕션 배포에서는 클라이언트 시크릿 대신 [페더레이션 인증](#federated-authentication-certificate--managed-identity)(인증서 또는 관리 ID) 사용을 고려하세요.

참고: 그룹 채팅은 기본적으로 차단됩니다(`channels.msteams.groupPolicy: "allowlist"`). 그룹 답장을 허용하려면 `channels.msteams.groupAllowFrom`을 설정하세요(또는 `groupPolicy: "open"`을 사용해 멘션 게이트를 유지한 채 모든 멤버를 허용할 수 있습니다).

## 목표

- Teams DM, 그룹 채팅 또는 채널을 통해 OpenClaw와 대화합니다.
- 라우팅을 결정적으로 유지합니다. 답장은 항상 메시지가 들어온 채널로 다시 돌아갑니다.
- 안전한 채널 동작을 기본값으로 사용합니다(별도 구성하지 않으면 멘션 필요).

## 구성 쓰기

기본적으로 Microsoft Teams는 `/config set|unset`에 의해 트리거된 구성 업데이트 쓰기가 허용됩니다(`commands.config: true` 필요).

다음과 같이 비활성화할 수 있습니다.

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 액세스 제어(DM + 그룹)

**DM 액세스**

- 기본값: `channels.msteams.dmPolicy = "pairing"`입니다. 승인될 때까지 알 수 없는 발신자는 무시됩니다.
- `channels.msteams.allowFrom`에는 안정적인 AAD 객체 ID를 사용해야 합니다.
- UPN/표시 이름은 변경 가능하므로, 직접 일치는 기본적으로 비활성화되어 있으며 `channels.msteams.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.
- 자격 증명에 권한이 있으면 설정 마법사가 Microsoft Graph를 통해 이름을 ID로 확인할 수 있습니다.

**그룹 액세스**

- 기본값: `channels.msteams.groupPolicy = "allowlist"`입니다(`groupAllowFrom`을 추가하지 않으면 차단됨). 설정되지 않았을 때 기본값을 덮어쓰려면 `channels.defaults.groupPolicy`를 사용하세요.
- `channels.msteams.groupAllowFrom`은 그룹 채팅/채널에서 어떤 발신자가 트리거할 수 있는지 제어합니다(`channels.msteams.allowFrom`으로 폴백).
- `groupPolicy: "open"`을 설정하면 모든 멤버를 허용합니다(기본적으로는 여전히 멘션 게이트 적용).
- **어떤 채널도 허용하지 않으려면** `channels.msteams.groupPolicy: "disabled"`로 설정하세요.

예시:

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

**Teams + 채널 allowlist**

- `channels.msteams.teams` 아래에 팀과 채널을 나열해 그룹/채널 답장 범위를 제한합니다.
- 키는 안정적인 팀 ID와 채널 대화 ID를 사용해야 합니다.
- `groupPolicy="allowlist"`이고 teams allowlist가 있으면, 나열된 팀/채널만 허용됩니다(멘션 게이트 적용).
- 구성 마법사는 `Team/Channel` 항목을 받아 이를 대신 저장해 줍니다.
- 시작 시 OpenClaw는 팀/채널과 사용자 allowlist 이름을 ID로 확인하려고 시도하며(Graph 권한이 허용되는 경우) 매핑을 로그로 남깁니다. 확인되지 않은 팀/채널 이름은 입력한 그대로 유지되지만, 기본적으로는 라우팅에서 무시됩니다. 단, `channels.msteams.dangerouslyAllowNameMatching: true`가 활성화된 경우는 예외입니다.

예시:

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

## 동작 방식

1. Microsoft Teams plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지형 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. **Azure Bot**(App ID + secret + tenant ID)을 생성합니다.
3. 봇을 참조하고 아래 RSC 권한을 포함하는 **Teams 앱 패키지**를 빌드합니다.
4. Teams 앱을 팀에 업로드/설치합니다(DM의 경우 개인 범위).
5. `~/.openclaw/openclaw.json`(또는 env vars)에서 `msteams`를 구성하고 Gateway를 시작합니다.
6. Gateway는 기본적으로 `/api/messages`에서 Bot Framework Webhook 트래픽을 수신합니다.

## Azure Bot 설정(사전 요구 사항)

OpenClaw를 구성하기 전에 Azure Bot 리소스를 만들어야 합니다.

### 1단계: Azure Bot 만들기

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)으로 이동합니다.
2. **Basics** 탭에 다음을 입력합니다.

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 봇 이름(예: `openclaw-msteams`)(고유해야 함)             |
   | **Subscription**   | Azure 구독 선택                                          |
   | **Resource group** | 새로 만들거나 기존 것 사용                               |
   | **Pricing tier**   | 개발/테스트용 **Free**                                   |
   | **Type of App**    | **Single Tenant**(권장 - 아래 참고)                      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **지원 중단 안내:** 새 멀티 테넌트 봇 생성은 2025-07-31 이후 지원 중단되었습니다. 새 봇에는 **Single Tenant**를 사용하세요.

3. **Review + create** → **Create**를 클릭합니다(약 1~2분 대기).

### 2단계: 자격 증명 가져오기

1. Azure Bot 리소스로 이동 → **Configuration**
2. **Microsoft App ID**를 복사합니다 → 이것이 `appId`입니다.
3. **Manage Password**를 클릭합니다 → App Registration으로 이동합니다.
4. **Certificates & secrets** → **New client secret**에서 **Value**를 복사합니다 → 이것이 `appPassword`입니다.
5. **Overview**로 이동 → **Directory (tenant) ID**를 복사합니다 → 이것이 `tenantId`입니다.

### 3단계: 메시징 엔드포인트 구성

1. Azure Bot → **Configuration**
2. **Messaging endpoint**를 Webhook URL로 설정합니다.
   - 프로덕션: `https://your-domain.com/api/messages`
   - 로컬 개발: 터널 사용([로컬 개발](#local-development-tunneling) 아래 참고)

### 4단계: Teams 채널 활성화

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save를 클릭합니다.
3. 서비스 약관에 동의합니다.

<a id="federated-authentication-certificate--managed-identity"></a>

## 페더레이션 인증(인증서 + 관리 ID)

> 2026.3.24에 추가됨

프로덕션 배포에서 OpenClaw는 클라이언트 시크릿보다 더 안전한 대안으로 **페더레이션 인증**을 지원합니다. 두 가지 방법을 사용할 수 있습니다.

### 옵션 A: 인증서 기반 인증

Entra ID 앱 등록에 등록된 PEM 인증서를 사용합니다.

**설정:**

1. 인증서를 생성하거나 확보합니다(개인 키를 포함한 PEM 형식).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates**에서 공개 인증서를 업로드합니다.

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

**env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 옵션 B: Azure Managed Identity

암호 없는 인증을 위해 Azure Managed Identity를 사용합니다. 이는 관리 ID를 사용할 수 있는 Azure 인프라(AKS, App Service, Azure VM)에서의 배포에 적합합니다.

**동작 방식:**

1. 봇 pod/VM에 관리 ID(시스템 할당 또는 사용자 할당)가 있습니다.
2. **페더레이션 ID 자격 증명**이 관리 ID를 Entra ID 앱 등록에 연결합니다.
3. 런타임에 OpenClaw는 `@azure/identity`를 사용해 Azure IMDS 엔드포인트(`169.254.169.254`)에서 토큰을 가져옵니다.
4. 해당 토큰을 Teams SDK에 전달해 봇 인증에 사용합니다.

**사전 요구 사항:**

- 관리 ID가 활성화된 Azure 인프라(AKS workload identity, App Service, VM)
- Entra ID 앱 등록에 생성된 페더레이션 ID 자격 증명
- pod/VM에서 IMDS(`169.254.169.254:80`)로의 네트워크 액세스

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

**env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`(사용자 할당인 경우에만)

### AKS Workload Identity 설정

workload identity를 사용하는 AKS 배포의 경우:

1. AKS 클러스터에서 **workload identity**를 활성화합니다.
2. Entra ID 앱 등록에 **페더레이션 ID 자격 증명**을 생성합니다.

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 앱 클라이언트 ID로 **Kubernetes 서비스 계정**에 주석을 추가합니다.

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. workload identity 주입을 위해 **pod에 라벨**을 추가합니다.

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS(`169.254.169.254`)로의 **네트워크 액세스**를 보장합니다. NetworkPolicy를 사용하는 경우 `169.254.169.254/32`의 80번 포트로 트래픽을 허용하는 egress 규칙을 추가하세요.

### 인증 유형 비교

| Method               | Config                                         | Pros                            | Cons                               |
| -------------------- | ---------------------------------------------- | ------------------------------- | ---------------------------------- |
| **Client secret**    | `appPassword`                                  | 설정이 간단함                   | 시크릿 교체 필요, 보안 수준 낮음   |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | 네트워크를 통한 공유 시크릿 없음 | 인증서 관리 오버헤드               |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | 암호 불필요, 관리할 시크릿 없음 | Azure 인프라 필요                  |

**기본 동작:** `authType`이 설정되지 않으면 OpenClaw는 기본적으로 클라이언트 시크릿 인증을 사용합니다. 기존 구성은 변경 없이 계속 동작합니다.

## 로컬 개발(터널링)

Teams는 `localhost`에 접근할 수 없습니다. 로컬 개발에는 터널을 사용하세요.

**옵션 A: ngrok**

```bash
ngrok http 3978
# https URL을 복사합니다. 예: https://abc123.ngrok.io
# 메시징 엔드포인트를 다음으로 설정합니다: https://abc123.ngrok.io/api/messages
```

**옵션 B: Tailscale Funnel**

```bash
tailscale funnel 3978
# 메시징 엔드포인트로 Tailscale funnel URL을 사용하세요
```

## Teams Developer Portal(대안)

manifest ZIP을 수동으로 만드는 대신 [Teams Developer Portal](https://dev.teams.microsoft.com/apps)을 사용할 수 있습니다.

1. **+ New app**을 클릭합니다.
2. 기본 정보(이름, 설명, 개발자 정보)를 입력합니다.
3. **App features** → **Bot**으로 이동합니다.
4. **Enter a bot ID manually**를 선택하고 Azure Bot App ID를 붙여넣습니다.
5. 범위를 체크합니다: **Personal**, **Team**, **Group Chat**
6. **Distribute** → **Download app package**를 클릭합니다.
7. Teams에서 **Apps** → **Manage your apps** → **Upload a custom app** → ZIP 선택

이 방법은 JSON manifest를 직접 수정하는 것보다 더 쉬운 경우가 많습니다.

## 봇 테스트

**옵션 A: Azure Web Chat(먼저 Webhook 검증)**

1. Azure Portal → Azure Bot 리소스 → **Test in Web Chat**
2. 메시지를 보냅니다. 응답이 보여야 합니다.
3. 이렇게 하면 Teams 설정 전에 Webhook 엔드포인트가 정상 동작하는지 확인할 수 있습니다.

**옵션 B: Teams(앱 설치 후)**

1. Teams 앱을 설치합니다(사이드로드 또는 조직 카탈로그).
2. Teams에서 봇을 찾아 DM을 보냅니다.
3. Gateway 로그에서 들어오는 activity를 확인합니다.

## 설정(최소 텍스트 전용)

1. **Microsoft Teams plugin을 사용할 수 있는지 확인**
   - 현재 패키지형 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 수동으로 추가할 수 있습니다.
     - npm에서: `openclaw plugins install @openclaw/msteams`
     - 로컬 체크아웃에서: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **봇 등록**
   - Azure Bot을 생성하고(위 참고) 다음을 기록합니다.
     - App ID
     - Client secret(App password)
     - Tenant ID(single-tenant)

3. **Teams 앱 manifest**
   - `botId = <App ID>`인 `bot` 항목을 포함합니다.
   - 범위: `personal`, `team`, `groupChat`
   - `supportsFiles: true`(개인 범위 파일 처리에 필요)
   - RSC 권한을 추가합니다(아래 참고).
   - 아이콘을 만듭니다: `outline.png`(32x32) 및 `color.png`(192x192).
   - 세 파일을 함께 ZIP으로 묶습니다: `manifest.json`, `outline.png`, `color.png`.

4. **OpenClaw 구성**

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

   구성 키 대신 환경 변수를 사용할 수도 있습니다.
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE`(선택 사항: `"secret"` 또는 `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH`(페더레이션 + 인증서)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT`(선택 사항, 인증에 필수는 아님)
   - `MSTEAMS_USE_MANAGED_IDENTITY`(페더레이션 + 관리 ID)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`(사용자 할당 MI에만 해당)

5. **봇 엔드포인트**
   - Azure Bot Messaging Endpoint를 다음으로 설정합니다.
     - `https://<host>:3978/api/messages`(또는 선택한 경로/포트)

6. **Gateway 실행**
   - 번들 또는 수동 설치된 plugin을 사용할 수 있고 자격 증명이 포함된 `msteams` 구성이 존재하면 Teams 채널이 자동으로 시작됩니다.

## 멤버 정보 작업

OpenClaw는 Microsoft Teams용으로 Graph 기반 `member-info` 작업을 노출하므로, 에이전트와 자동화가 Microsoft Graph에서 직접 채널 멤버 세부 정보(표시 이름, 이메일, 역할)를 확인할 수 있습니다.

요구 사항:

- `Member.Read.Group` RSC 권한(권장 manifest에 이미 포함됨)
- 팀 간 조회의 경우: 관리자 동의가 있는 `User.Read.All` Graph Application 권한

이 작업은 `channels.msteams.actions.memberInfo`로 제어됩니다(기본값: Graph 자격 증명을 사용할 수 있을 때 활성화).

## 히스토리 컨텍스트

- `channels.msteams.historyLimit`는 프롬프트에 포함할 최근 채널/그룹 메시지 수를 제어합니다.
- `messages.groupChat.historyLimit`로 폴백합니다. 비활성화하려면 `0`으로 설정하세요(기본값 50).
- 가져온 스레드 히스토리는 발신자 allowlist(`allowFrom` / `groupAllowFrom`)로 필터링되므로, 스레드 컨텍스트 시드는 허용된 발신자의 메시지만 포함합니다.
- 인용된 첨부파일 컨텍스트(`Teams` 답장 HTML에서 파생된 `ReplyTo*`)는 현재 수신된 그대로 전달됩니다.
- 즉, allowlist는 누가 에이전트를 트리거할 수 있는지를 제어하며, 오늘날에는 특정 보조 컨텍스트 경로만 필터링됩니다.
- DM 히스토리는 `channels.msteams.dmHistoryLimit`(사용자 턴 수)로 제한할 수 있습니다. 사용자별 재정의: `channels.msteams.dms["<user_id>"].historyLimit`

## 현재 Teams RSC 권한(manifest)

다음은 Teams 앱 manifest에 있는 **기존 resourceSpecific 권한**입니다. 이는 앱이 설치된 팀/채팅 내부에서만 적용됩니다.

**채널용(team 범위):**

- `ChannelMessage.Read.Group` (Application) - @mention 없이 모든 채널 메시지 수신
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**그룹 채팅용:**

- `ChatMessage.Read.Chat` (Application) - @mention 없이 모든 그룹 채팅 메시지 수신

## 예시 Teams Manifest(민감 정보 제거)

필수 필드가 포함된 최소 유효 예시입니다. ID와 URL을 바꿔 사용하세요.

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
  description: { short: "Teams의 OpenClaw", full: "Teams의 OpenClaw" },
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

### Manifest 주의 사항(필수 필드)

- `bots[].botId`는 Azure Bot App ID와 **반드시** 일치해야 합니다.
- `webApplicationInfo.id`는 Azure Bot App ID와 **반드시** 일치해야 합니다.
- `bots[].scopes`에는 사용할 표면(`personal`, `team`, `groupChat`)이 포함되어야 합니다.
- `bots[].supportsFiles: true`는 개인 범위의 파일 처리에 필요합니다.
- 채널 트래픽을 원한다면 `authorization.permissions.resourceSpecific`에 채널 읽기/보내기가 포함되어야 합니다.

### 기존 앱 업데이트

이미 설치된 Teams 앱을 업데이트하려면(예: RSC 권한 추가):

1. 새 설정으로 `manifest.json`을 업데이트합니다.
2. **`version` 필드를 증가**시킵니다(예: `1.0.0` → `1.1.0`).
3. 아이콘과 함께 manifest를 다시 ZIP으로 묶습니다(`manifest.json`, `outline.png`, `color.png`).
4. 새 ZIP을 업로드합니다.
   - **옵션 A(Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → 앱 찾기 → Upload new version
   - **옵션 B(사이드로드):** Teams → Apps → Manage your apps → Upload a custom app
5. **팀 채널의 경우:** 새 권한이 적용되도록 각 팀에 앱을 다시 설치합니다.
6. 캐시된 앱 메타데이터를 지우기 위해 Teams를 **완전히 종료 후 다시 실행**합니다(창만 닫지 않음).

## 기능: RSC만 사용 vs Graph

### **Teams RSC만 사용** 시(앱 설치됨, Graph API 권한 없음)

작동함:

- 채널 메시지 **텍스트** 콘텐츠 읽기
- 채널 메시지 **텍스트** 콘텐츠 보내기
- **개인(DM)** 파일 첨부 수신

작동하지 않음:

- 채널/그룹 **이미지 또는 파일 콘텐츠**(payload에는 HTML 스텁만 포함됨)
- SharePoint/OneDrive에 저장된 첨부파일 다운로드
- 메시지 히스토리 읽기(실시간 Webhook 이벤트를 초과하는 범위)

### **Teams RSC + Microsoft Graph Application 권한** 사용 시

추가됨:

- 호스팅된 콘텐츠 다운로드(메시지에 붙여넣은 이미지)
- SharePoint/OneDrive에 저장된 파일 첨부 다운로드
- Graph를 통한 채널/채팅 메시지 히스토리 읽기

### RSC vs Graph API

| Capability              | RSC Permissions   | Graph API                         |
| ----------------------- | ----------------- | --------------------------------- |
| **실시간 메시지**       | 예(Webhook 통해)  | 아니요(폴링만 가능)               |
| **과거 메시지**         | 아니요            | 예(히스토리 조회 가능)            |
| **설정 복잡도**         | 앱 manifest만 필요 | 관리자 동의 + 토큰 흐름 필요      |
| **오프라인 동작**       | 아니요(실행 중이어야 함) | 예(언제든 조회 가능)         |

**핵심:** RSC는 실시간 수신용이고, Graph API는 과거 접근용입니다. 오프라인 동안 놓친 메시지를 따라잡으려면 `ChannelMessage.Read.All`이 있는 Graph API가 필요합니다(관리자 동의 필요).

## Graph 활성화 미디어 + 히스토리(채널에 필요)

**채널**에서 이미지/파일이 필요하거나 **메시지 히스토리**를 가져오려면 Microsoft Graph 권한을 활성화하고 관리자 동의를 부여해야 합니다.

1. Entra ID(Azure AD) **App Registration**에 Microsoft Graph **Application 권한**을 추가합니다.
   - `ChannelMessage.Read.All`(채널 첨부파일 + 히스토리)
   - `Chat.Read.All` 또는 `ChatMessage.Read.All`(그룹 채팅)
2. 테넌트에 대해 **관리자 동의 부여**
3. Teams 앱 **manifest 버전**을 올리고, 다시 업로드한 뒤, Teams에 **앱을 재설치**
4. 캐시된 앱 메타데이터를 지우기 위해 Teams를 **완전히 종료 후 다시 실행**

**사용자 멘션에 필요한 추가 권한:** 사용자 @mention은 대화에 있는 사용자에 대해서는 즉시 동작합니다. 하지만 현재 대화에 **없는 사용자**를 동적으로 검색해 멘션하려면 `User.Read.All` (Application) 권한을 추가하고 관리자 동의를 부여하세요.

## 알려진 제한 사항

### Webhook 타임아웃

Teams는 HTTP Webhook을 통해 메시지를 전달합니다. 처리에 너무 오래 걸리면(예: 느린 LLM 응답) 다음이 발생할 수 있습니다.

- Gateway 타임아웃
- Teams의 메시지 재시도(중복 발생 가능)
- 답장 누락

OpenClaw는 빠르게 응답을 반환하고 이후에 능동적으로 답장을 보내 이 문제를 처리하지만, 매우 느린 응답은 여전히 문제를 일으킬 수 있습니다.

### 서식

Teams markdown은 Slack 또는 Discord보다 제한이 더 많습니다.

- 기본 서식은 동작합니다: **bold**, _italic_, `code`, 링크
- 복잡한 markdown(테이블, 중첩 목록)은 올바르게 렌더링되지 않을 수 있습니다.
- 투표와 의미 기반 프레젠테이션 전송에는 Adaptive Cards가 지원됩니다(아래 참고).

## 구성

주요 설정(공유 채널 패턴은 `/gateway/configuration` 참고):

- `channels.msteams.enabled`: 채널 활성화/비활성화
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: 봇 자격 증명
- `channels.msteams.webhook.port`(기본값 `3978`)
- `channels.msteams.webhook.path`(기본값 `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing)
- `channels.msteams.allowFrom`: DM allowlist(AAD 객체 ID 권장). Graph 액세스를 사용할 수 있으면 설정 중 마법사가 이름을 ID로 확인합니다.
- `channels.msteams.dangerouslyAllowNameMatching`: 변경 가능한 UPN/표시 이름 일치와 직접 팀/채널 이름 라우팅을 다시 활성화하는 비상용 토글
- `channels.msteams.textChunkLimit`: 아웃바운드 텍스트 청크 크기
- `channels.msteams.chunkMode`: 길이 청크 분할 전에 빈 줄(문단 경계)에서 분할하는 `length`(기본값) 또는 `newline`
- `channels.msteams.mediaAllowHosts`: 인바운드 첨부파일 호스트용 allowlist(기본값은 Microsoft/Teams 도메인)
- `channels.msteams.mediaAuthAllowHosts`: 미디어 재시도 시 Authorization 헤더를 붙일 호스트용 allowlist(기본값은 Graph + Bot Framework 호스트)
- `channels.msteams.requireMention`: 채널/그룹에서 @mention 필요(기본값 true)
- `channels.msteams.replyStyle`: `thread | top-level`([답장 스타일](#reply-style-threads-vs-posts) 참고)
- `channels.msteams.teams.<teamId>.replyStyle`: 팀별 재정의
- `channels.msteams.teams.<teamId>.requireMention`: 팀별 재정의
- `channels.msteams.teams.<teamId>.tools`: 채널 재정의가 없을 때 사용하는 팀별 기본 도구 정책 재정의(`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.toolsBySender`: 팀별 기본 발신자별 도구 정책 재정의(`"*"` 와일드카드 지원)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: 채널별 재정의
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: 채널별 재정의
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: 채널별 도구 정책 재정의(`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: 채널별 발신자별 도구 정책 재정의(`"*"` 와일드카드 지원)
- `toolsBySender` 키는 다음과 같은 명시적 접두사를 사용해야 합니다:
  `id:`, `e164:`, `username:`, `name:`(기존의 접두사 없는 키는 여전히 `id:`에만 매핑됨)
- `channels.msteams.actions.memberInfo`: Graph 기반 멤버 정보 작업 활성화 또는 비활성화(기본값: Graph 자격 증명을 사용할 수 있을 때 활성화)
- `channels.msteams.authType`: 인증 유형 — `"secret"`(기본값) 또는 `"federated"`
- `channels.msteams.certificatePath`: PEM 인증서 파일 경로(페더레이션 + 인증서 인증)
- `channels.msteams.certificateThumbprint`: 인증서 thumbprint(선택 사항, 인증에 필수는 아님)
- `channels.msteams.useManagedIdentity`: 관리 ID 인증 활성화(페더레이션 모드)
- `channels.msteams.managedIdentityClientId`: 사용자 할당 관리 ID용 클라이언트 ID
- `channels.msteams.sharePointSiteId`: 그룹 채팅/채널에서 파일 업로드용 SharePoint 사이트 ID([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참고)

## 라우팅 및 세션

- 세션 키는 표준 에이전트 형식을 따릅니다([/concepts/session](/ko/concepts/session) 참고).
  - 다이렉트 메시지는 main 세션을 공유합니다(`agent:<agentId>:<mainKey>`).
  - 채널/그룹 메시지는 대화 ID를 사용합니다.
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 답장 스타일: Threads vs Posts

Teams는 최근 동일한 기본 데이터 모델 위에 두 가지 채널 UI 스타일을 도입했습니다.

| Style                    | Description                                        | 권장 `replyStyle` |
| ------------------------ | -------------------------------------------------- | ----------------- |
| **Posts** (classic)      | 메시지가 카드로 표시되고 그 아래에 스레드 답장이 표시됨 | `thread`(기본값)  |
| **Threads** (Slack-like) | 메시지가 Slack처럼 더 선형적으로 흐름             | `top-level`       |

**문제:** Teams API는 채널이 어떤 UI 스타일을 사용하는지 노출하지 않습니다. 잘못된 `replyStyle`을 사용하면 다음과 같습니다.

- Threads 스타일 채널에서 `thread` → 답장이 어색하게 중첩되어 보임
- Posts 스타일 채널에서 `top-level` → 답장이 스레드 안이 아니라 별도 최상위 게시물로 표시됨

**해결책:** 채널 설정 방식에 따라 채널별로 `replyStyle`을 구성하세요.

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

## 첨부파일 및 이미지

**현재 제한 사항:**

- **DM:** 이미지와 파일 첨부는 Teams 봇 파일 API를 통해 동작합니다.
- **채널/그룹:** 첨부파일은 M365 스토리지(SharePoint/OneDrive)에 저장됩니다. Webhook payload에는 실제 파일 바이트가 아니라 HTML 스텁만 포함됩니다. 채널 첨부파일을 다운로드하려면 **Graph API 권한이 필요합니다**.
- 명시적인 파일 우선 전송에는 `media` / `filePath` / `path`와 함께 `action=upload-file`을 사용하세요. 선택적 `message`는 함께 보내는 텍스트/댓글이 되며, `filename`은 업로드된 이름을 재정의합니다.

Graph 권한이 없으면 이미지가 포함된 채널 메시지는 텍스트 전용으로 수신됩니다(이미지 콘텐츠는 봇이 액세스할 수 없음).
기본적으로 OpenClaw는 Microsoft/Teams 호스트명에서만 미디어를 다운로드합니다. `channels.msteams.mediaAllowHosts`로 재정의하세요(임의 호스트를 허용하려면 `["*"]` 사용).
Authorization 헤더는 `channels.msteams.mediaAuthAllowHosts`에 있는 호스트에만 첨부됩니다(기본값은 Graph + Bot Framework 호스트). 이 목록은 엄격하게 유지하세요(멀티테넌트 suffix는 피하세요).

## 그룹 채팅에서 파일 보내기

봇은 내장된 FileConsentCard 흐름을 사용해 DM에서 파일을 보낼 수 있습니다. 하지만 **그룹 채팅/채널에서 파일 보내기**에는 추가 설정이 필요합니다.

| Context                  | 파일 전송 방식                          | 필요한 설정                                      |
| ------------------------ | --------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → 사용자가 수락 → 봇 업로드 | 별도 설정 없이 동작                           |
| **그룹 채팅/채널**       | SharePoint에 업로드 → 링크 공유         | `sharePointSiteId` + Graph 권한 필요             |
| **이미지(모든 컨텍스트)** | Base64 인코딩 인라인                   | 별도 설정 없이 동작                              |

### 그룹 채팅에 SharePoint가 필요한 이유

봇에는 개인 OneDrive 드라이브가 없습니다(Graph API의 `/me/drive` 엔드포인트는 애플리케이션 ID에서 동작하지 않음). 그룹 채팅/채널에서 파일을 보내려면 봇이 **SharePoint 사이트**에 업로드하고 공유 링크를 생성해야 합니다.

### 설정

1. Entra ID(Azure AD) → App Registration에서 **Graph API 권한**을 추가합니다.
   - `Sites.ReadWrite.All` (Application) - SharePoint에 파일 업로드
   - `Chat.Read.All` (Application) - 선택 사항, 사용자별 공유 링크 활성화

2. 테넌트에 대해 **관리자 동의 부여**

3. **SharePoint 사이트 ID 가져오기:**

   ```bash
   # Graph Explorer 또는 유효한 토큰이 있는 curl 사용:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 예: "contoso.sharepoint.com/sites/BotFiles" 사이트의 경우
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 응답에는 다음이 포함됨: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw 구성:**

   ```json5
   {
     channels: {
       msteams: {
         // ... 기타 구성 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 공유 동작

| Permission                              | 공유 동작                                             |
| --------------------------------------- | ----------------------------------------------------- |
| `Sites.ReadWrite.All`만 있음            | 조직 전체 공유 링크(조직 내 누구나 액세스 가능)       |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 사용자별 공유 링크(채팅 멤버만 액세스 가능)           |

사용자별 공유가 더 안전합니다. 채팅 참여자만 파일에 액세스할 수 있기 때문입니다. `Chat.Read.All` 권한이 없으면 봇은 조직 전체 공유로 폴백합니다.

### 폴백 동작

| Scenario                                          | 결과                                               |
| ------------------------------------------------- | -------------------------------------------------- |
| 그룹 채팅 + 파일 + `sharePointSiteId` 구성됨      | SharePoint에 업로드하고 공유 링크 전송             |
| 그룹 채팅 + 파일 + `sharePointSiteId` 없음        | OneDrive 업로드 시도(실패할 수 있음), 텍스트만 전송 |
| 개인 채팅 + 파일                                  | FileConsentCard 흐름(SharePoint 없이 동작)         |
| 모든 컨텍스트 + 이미지                            | Base64 인코딩 인라인(SharePoint 없이 동작)         |

### 파일 저장 위치

업로드된 파일은 구성된 SharePoint 사이트의 기본 문서 라이브러리에 있는 `/OpenClawShared/` 폴더에 저장됩니다.

## 투표(Adaptive Cards)

OpenClaw는 Teams 투표를 Adaptive Cards로 전송합니다(네이티브 Teams 투표 API는 없음).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 투표는 Gateway가 `~/.openclaw/msteams-polls.json`에 기록합니다.
- 투표를 기록하려면 Gateway가 계속 온라인 상태여야 합니다.
- 투표는 아직 결과 요약을 자동 게시하지 않습니다(필요하면 저장소 파일을 확인하세요).

## 프레젠테이션 카드

`message` 도구 또는 CLI를 사용해 의미 기반 프레젠테이션 payload를 Teams 사용자 또는 대화에 전송합니다. OpenClaw는 일반 프레젠테이션 계약에서 이를 Teams Adaptive Cards로 렌더링합니다.

`presentation` 매개변수는 의미 블록을 받습니다. `presentation`이 제공되면 메시지 텍스트는 선택 사항입니다.

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

대상 형식에 대한 자세한 내용은 아래의 [대상 형식](#target-formats)을 참고하세요.

## 대상 형식

MSTeams 대상은 사용자와 대화를 구분하기 위해 접두사를 사용합니다.

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 사용자(ID 기준)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 사용자(이름 기준)   | `user:<display-name>`            | `user:John Smith`(Graph API 필요)                  |
| 그룹/채널           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 그룹/채널(raw)      | `<conversation-id>`              | `19:abc123...@thread.tacv2`(`@thread` 포함 시)      |

**CLI 예시:**

```bash
# ID로 사용자에게 보내기
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 표시 이름으로 사용자에게 보내기(Graph API 조회 트리거)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 그룹 채팅 또는 채널로 보내기
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 대화에 프레젠테이션 카드 보내기
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

참고: `user:` 접두사가 없으면 이름은 기본적으로 그룹/팀 확인으로 처리됩니다. 표시 이름으로 사람을 지정할 때는 항상 `user:`를 사용하세요.

## 능동 메시지 전송

- 능동 메시지는 사용자가 상호작용한 **이후에만** 가능합니다. 그 시점에 대화 참조를 저장하기 때문입니다.
- `dmPolicy`와 allowlist 게이팅은 `/gateway/configuration`을 참고하세요.

## 팀 및 채널 ID(흔한 함정)

Teams URL의 `groupId` 쿼리 매개변수는 구성에 사용하는 팀 ID가 **아닙니다**. 대신 URL 경로에서 ID를 추출하세요.

**팀 URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    팀 ID(URL 디코딩 필요)
```

**채널 URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      채널 ID(URL 디코딩 필요)
```

**구성 시:**

- 팀 ID = `/team/` 뒤의 경로 세그먼트(URL 디코딩 후, 예: `19:Bk4j...@thread.tacv2`)
- 채널 ID = `/channel/` 뒤의 경로 세그먼트(URL 디코딩 후)
- `groupId` 쿼리 매개변수는 **무시**하세요

## 비공개 채널

봇은 비공개 채널에서 지원이 제한적입니다.

| Feature                      | Standard Channels | Private Channels     |
| ---------------------------- | ----------------- | -------------------- |
| 봇 설치                      | 예                | 제한적               |
| 실시간 메시지(Webhook)       | 예                | 동작하지 않을 수 있음 |
| RSC 권한                     | 예                | 다르게 동작할 수 있음 |
| @mentions                    | 예                | 봇에 액세스 가능 시   |
| Graph API 히스토리           | 예                | 예(권한 필요)        |

**비공개 채널이 동작하지 않을 때의 우회 방법:**

1. 봇 상호작용에는 표준 채널 사용
2. DM 사용 - 사용자는 언제든 봇에 직접 메시지를 보낼 수 있음
3. 과거 접근에는 Graph API 사용(`ChannelMessage.Read.All` 필요)

## 문제 해결

### 일반적인 문제

- **채널에서 이미지가 표시되지 않음:** Graph 권한 또는 관리자 동의가 없습니다. Teams 앱을 재설치하고 Teams를 완전히 종료한 뒤 다시 여세요.
- **채널에서 응답이 없음:** 기본적으로 멘션이 필요합니다. `channels.msteams.requireMention=false`로 설정하거나 팀/채널별로 구성하세요.
- **버전 불일치(Teams가 여전히 이전 manifest를 표시):** 앱을 제거 후 다시 추가하고 Teams를 완전히 종료해 새로고침하세요.
- **Webhook에서 401 Unauthorized:** Azure JWT 없이 수동 테스트할 때는 정상입니다. 엔드포인트에는 도달했지만 인증에 실패했다는 뜻입니다. 올바른 테스트에는 Azure Web Chat을 사용하세요.

### Manifest 업로드 오류

- **"Icon file cannot be empty":** manifest가 0바이트인 아이콘 파일을 참조합니다. 유효한 PNG 아이콘을 만드세요(`outline.png`는 32x32, `color.png`는 192x192).
- **"webApplicationInfo.Id already in use":** 앱이 다른 팀/채팅에 아직 설치되어 있습니다. 먼저 찾아 제거하거나 전파될 때까지 5~10분 기다리세요.
- **업로드 시 "Something went wrong":** 대신 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com)에서 업로드하고, 브라우저 DevTools(F12) → Network 탭을 연 뒤 실제 오류는 응답 본문에서 확인하세요.
- **사이드로드 실패:** "Upload a custom app" 대신 "Upload an app to your org's app catalog"를 시도하세요. 이 방법이 사이드로드 제한을 우회하는 경우가 많습니다.

### RSC 권한이 동작하지 않음

1. `webApplicationInfo.id`가 봇의 App ID와 정확히 일치하는지 확인
2. 앱을 다시 업로드하고 팀/채팅에 재설치
3. 조직 관리자가 RSC 권한을 차단했는지 확인
4. 올바른 범위를 사용하는지 확인: 팀에는 `ChannelMessage.Read.Group`, 그룹 채팅에는 `ChatMessage.Read.Chat`

## 참고 자료

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 설정 가이드
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams 앱 생성/관리
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (채널/그룹에는 Graph 필요)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 관련 문서

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [Security](/ko/gateway/security) — 액세스 모델 및 강화
