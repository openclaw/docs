---
read_when:
    - Microsoft Teams 채널 기능 작업하기
summary: Microsoft Teams 봇 지원 상태, 기능 및 구성
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T12:18:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

상태: 텍스트 + DM 첨부 파일이 지원됩니다. 채널/그룹 파일 전송에는 `sharePointSiteId` + Graph 권한이 필요합니다([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참조). 투표는 Adaptive Cards를 통해 전송됩니다. 메시지 작업은 파일 우선 전송을 위한 명시적 `upload-file`을 제공합니다.

## 번들 Plugin

Microsoft Teams는 현재 OpenClaw 릴리스에 번들 Plugin으로 포함되므로, 일반 패키지 빌드에서는 별도로 설치할 필요가 없습니다.

이전 빌드 또는 번들 Teams를 제외한 사용자 지정 설치에서는 npm 패키지를 직접 설치하십시오.

```bash
openclaw plugins install @openclaw/msteams
```

현재 공식 릴리스 태그를 따르려면 버전을 지정하지 않은 패키지를 사용하십시오. 재현 가능한 설치가 필요한 경우에만 정확한 버전을 고정하십시오.

로컬 체크아웃(git 저장소에서 실행):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

자세한 내용: [Plugin](/ko/tools/plugin)

## 빠른 설정

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli)는 하나의 명령으로 봇 등록, 매니페스트 생성 및 자격 증명 생성을 처리합니다.

**1. 설치 및 로그인**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 로그인 상태인지 확인하고 테넌트 정보 확인
```

<Note>
Teams CLI는 현재 프리뷰 상태입니다. 명령과 플래그는 릴리스마다 변경될 수 있습니다.
</Note>

**2. 터널 시작** (Teams는 localhost에 연결할 수 없음)

필요한 경우 devtunnel CLI를 설치하고 인증하십시오([시작 가이드](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# 일회성 설정(세션 간 영구 URL):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 각 개발 세션:
devtunnel host my-openclaw-bot
# 엔드포인트: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams는 devtunnels로 인증할 수 없으므로 `--allow-anonymous`이 필요합니다. 수신되는 각 봇 요청은 계속해서 Teams SDK에서 검증됩니다.
</Note>

대안: `ngrok http 3978` 또는 `tailscale funnel 3978`(URL은 세션마다 변경될 수 있음).

**3. 앱 생성**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

이 명령은 Entra ID(Azure AD) 애플리케이션을 생성하고, 클라이언트 비밀을 생성하며, 아이콘이 포함된 Teams 앱 매니페스트를 빌드 및 업로드하고, Teams 관리형 봇을 등록합니다(Azure 구독 불필요). 출력에는 `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` 및 **Teams 앱 ID**가 포함되며, Teams에 앱을 직접 설치하는 옵션도 제공됩니다.

**4. OpenClaw 구성** 출력의 자격 증명을 사용하십시오.

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

또는 환경 변수를 직접 사용하십시오: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Teams에 앱 설치**

`teams app create`에서 앱 설치 여부를 묻는 메시지가 표시되면 "Install in Teams"를 선택하십시오. 나중에 설치 링크를 받으려면 다음을 실행하십시오.

```bash
teams app get <teamsAppId> --install-link
```

**6. 모든 기능이 작동하는지 확인**

```bash
teams app doctor <teamsAppId>
```

봇 등록, AAD 앱 구성, 매니페스트 유효성 및 SSO 설정 전반에 걸쳐 진단을 실행합니다.

프로덕션에서는 클라이언트 비밀 대신 [페더레이션 인증](#federated-authentication-certificate-plus-managed-identity)(인증서 또는 관리 ID)을 고려하십시오.

<Note>
그룹 채팅은 기본적으로 차단됩니다(`channels.msteams.groupPolicy: "allowlist"`). 그룹 응답을 허용하려면 `channels.msteams.groupAllowFrom`를 설정하거나, `groupPolicy: "open"`을 사용하여 모든 구성원에게 허용하십시오(멘션 필요).
</Note>

## 목표

- Teams DM, 그룹 채팅 또는 채널을 통해 OpenClaw와 대화합니다.
- 라우팅을 결정론적으로 유지합니다. 응답은 항상 수신된 채널로 돌아갑니다.
- 안전한 채널 동작을 기본값으로 사용합니다(달리 구성하지 않는 한 멘션 필요).

## 구성 쓰기

기본적으로 Microsoft Teams는 `/config set|unset`에 의해 트리거된 구성 업데이트를 쓸 수 있습니다(`commands.config: true` 필요).

비활성화하려면 다음을 사용하십시오.

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 액세스 제어(DM + 그룹)

**DM 액세스**

- 기본값: `channels.msteams.dmPolicy = "pairing"`. 알 수 없는 발신자는 승인될 때까지 무시됩니다.
- `channels.msteams.allowFrom`에는 안정적인 AAD 개체 ID 또는 `accessGroup:core-team`와 같은 정적 발신자 액세스 그룹을 사용해야 합니다.
- 허용 목록에 UPN/표시 이름 일치를 사용하지 마십시오. 이는 변경될 수 있습니다. OpenClaw는 기본적으로 직접 이름 일치를 비활성화하며, `channels.msteams.dangerouslyAllowNameMatching: true`을 사용하여 명시적으로 활성화할 수 있습니다.
- 자격 증명이 허용하는 경우 마법사는 Microsoft Graph를 통해 이름을 ID로 확인할 수 있습니다.

**그룹 액세스**

- 기본값: `channels.msteams.groupPolicy = "allowlist"`(`groupAllowFrom`을 추가하지 않으면 차단됨). `channels.msteams.groupPolicy`이 설정되지 않은 경우 `channels.defaults.groupPolicy`가 공유 기본값을 재정의할 수 있습니다.
- `channels.msteams.groupAllowFrom`는 그룹 채팅/채널에서 트리거할 수 있는 발신자 또는 정적 발신자 액세스 그룹을 제어합니다(`channels.msteams.allowFrom`로 대체됨).
- 모든 구성원에게 허용하려면 `groupPolicy: "open"`을 설정하십시오(기본적으로 여전히 멘션 필요).
- **모든** 채널을 차단하려면 `channels.msteams.groupPolicy: "disabled"`를 설정하십시오.

예:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**팀 + 채널 허용 목록**

- `channels.msteams.teams` 아래에 팀과 채널을 나열하여 그룹/채널 응답 범위를 지정합니다.
- 변경 가능한 표시 이름 대신 Teams 링크의 안정적인 Teams 대화 ID를 키로 사용하십시오([팀 및 채널 ID](#team-and-channel-ids-common-gotcha) 참조).
- `groupPolicy="allowlist"`이고 팀 허용 목록이 있는 경우 나열된 팀/채널만 허용됩니다(멘션 필요).
- 구성 마법사는 `Team/Channel` 항목을 받아 대신 저장합니다.
- 시작 시 OpenClaw는 Graph 권한이 허용하는 경우 팀/채널 및 사용자 허용 목록 이름을 ID로 확인하고 매핑을 기록합니다. 확인되지 않은 이름은 입력된 그대로 유지되지만 `channels.msteams.dangerouslyAllowNameMatching: true`이 설정되지 않으면 라우팅에서 무시됩니다.

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
<summary><strong>수동 설정(Teams CLI 미사용)</strong></summary>

### 작동 방식

1. Microsoft Teams Plugin을 사용할 수 있는지 확인합니다(현재 릴리스에 번들로 포함).
2. **Azure Bot**(앱 ID + 비밀 + 테넌트 ID)을 생성합니다.
3. 아래 RSC 권한을 포함하여 봇을 참조하는 **Teams 앱 패키지**를 빌드합니다.
4. Teams 앱을 팀에 업로드/설치합니다(DM의 경우 개인 범위).
5. `~/.openclaw/openclaw.json`에서 `msteams`를 구성하거나 환경 변수를 사용하고 Gateway를 시작합니다.
6. Gateway는 기본적으로 `/api/messages`에서 Bot Framework Webhook 트래픽을 수신합니다.

### 1단계: Azure Bot 생성

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)으로 이동합니다.
2. **Basics** 탭을 작성합니다.

   | 필드               | 값                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 봇 이름(예: `openclaw-msteams`, 고유해야 함)             |
   | **Subscription**   | Azure 구독 선택                                          |
   | **Resource group** | 새로 생성하거나 기존 그룹 사용                          |
   | **Pricing tier**   | 개발/테스트에는 **Free**                                 |
   | **Type of App**    | **Single Tenant**(권장, 아래 참고 사항 참조)             |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
새 멀티테넌트 봇 생성은 2025-07-31 이후 사용 중단되었습니다. 새 봇에는 **Single Tenant**를 사용하십시오.
</Warning>

3. **Review + create**를 클릭한 다음 **Create**를 클릭하십시오(약 1-2분).

### 2단계: 자격 증명 가져오기

1. Azure Bot 리소스 → **Configuration** → **Microsoft App ID**를 복사합니다(`appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → **Value**를 복사합니다(`appPassword`).
3. **Overview** → **Directory (tenant) ID**를 복사합니다(`tenantId`).

### 3단계: 메시징 엔드포인트 구성

1. Azure Bot → **Configuration**.
2. **Messaging endpoint**를 설정합니다.
   - 프로덕션: `https://your-domain.com/api/messages`
   - 로컬 개발: 터널을 사용합니다([로컬 개발](#local-development-tunneling) 참조).

### 4단계: Teams 채널 활성화

1. Azure Bot → **Channels**.
2. **Microsoft Teams** → Configure → Save를 클릭합니다.
3. 서비스 약관에 동의합니다.

### 5단계: Teams 앱 매니페스트 빌드

- `botId = <App ID>`이 있는 `bot` 항목을 포함합니다.
- 범위: `personal`, `team`, `groupChat`.
- `supportsFiles: true`(개인 범위 파일 처리에 필요).
- RSC 권한을 추가합니다([RSC 권한](#current-teams-rsc-permissions-manifest) 참조).
- 아이콘을 생성합니다: `outline.png`(32x32) 및 `color.png`(192x192).
- `manifest.json`, `outline.png`, `color.png`을 함께 압축합니다.

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

Plugin을 사용할 수 있고 `msteams` 구성에 자격 증명이 있으면 Teams 채널이 자동으로 시작됩니다.

</details>

## 페더레이션 인증(인증서 및 관리 ID)

프로덕션에서 OpenClaw는 `channels.msteams.authType: "federated"`을 통해 클라이언트 비밀의 대안으로 **페더레이션 인증**을 지원합니다. 다음 두 가지 방법이 있습니다.

### 옵션 A: 인증서 기반 인증

Entra ID 앱 등록에 등록된 PEM 인증서를 사용하십시오.

**설정:**

1. 인증서를 생성하거나 준비합니다(개인 키가 포함된 PEM 형식).
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

**환경 변수:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 옵션 B: Azure 관리 ID

Azure 인프라(AKS, App Service, Azure VM)에서 암호 없는 인증을 위해 Azure 관리 ID를 사용하십시오.

**작동 방식:**

1. 봇 Pod/VM에 관리 ID가 있습니다(시스템 할당 또는 사용자 할당).
2. 페더레이션 ID 자격 증명이 관리 ID를 Entra ID 앱 등록에 연결합니다.
3. 런타임에 OpenClaw는 `@azure/identity`을 사용하여 Azure IMDS 엔드포인트에서 토큰을 획득합니다.
4. 토큰은 봇 인증을 위해 Teams SDK에 전달됩니다.

**사전 요구 사항:**

- 관리 ID가 활성화된 Azure 인프라(AKS 워크로드 ID, App Service, VM).
- Entra ID 앱 등록에 생성된 페더레이션 ID 자격 증명.
- Pod/VM에서 IMDS(`169.254.169.254:80`)로의 네트워크 액세스.

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

**구성(사용자 할당 관리 ID):** 위 블록에 `managedIdentityClientId: "<MI_CLIENT_ID>"`을 추가하십시오.

**환경 변수:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`(사용자 할당 전용)

### AKS 워크로드 ID 설정

워크로드 ID를 사용하는 AKS 배포의 경우:

1. AKS 클러스터에서 **워크로드 ID를 활성화**하십시오.
2. Entra ID 앱 등록에 **페더레이션 ID 자격 증명을 생성**하십시오.

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 앱 클라이언트 ID로 **Kubernetes 서비스 계정에 주석을 추가**하십시오.

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 워크로드 ID 삽입을 위해 **Pod에 레이블을 지정**하십시오.

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS(`169.254.169.254`)에 대한 **네트워크 액세스를 허용**하십시오. NetworkPolicy를 사용하는 경우 포트 80에서 `169.254.169.254/32`에 대한 송신 규칙을 추가하십시오.

### 인증 유형 비교

| 방식                  | 구성                                           | 장점                                | 단점                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| **클라이언트 비밀**    | `appPassword`                                  | 설정이 간단함                       | 비밀 순환이 필요하며 보안성이 낮음           |
| **인증서**             | `authType: "federated"` + `certificatePath`    | 네트워크를 통해 공유 비밀을 전송하지 않음 | 인증서 관리 오버헤드                         |
| **관리 ID**            | `authType: "federated"` + `useManagedIdentity` | 암호가 없으며 관리할 비밀이 없음       | Azure 인프라가 필요함                        |

`certificateThumbprint`은 `certificatePath`과 함께 설정할 수 있지만 현재 인증 경로에서는 읽지 않으며, 향후 호환성을 위해서만 허용됩니다.

**기본값:** `authType`이 설정되지 않은 경우 OpenClaw는 클라이언트 비밀 인증(`appPassword`)을 사용합니다. 기존 구성은 변경 없이 계속 작동합니다.

## 로컬 개발(터널링)

Teams에서는 `localhost`에 접근할 수 없습니다. 세션 간에 URL이 안정적으로 유지되도록 영구 개발 터널을 사용하십시오.

```bash
# 최초 한 번 설정:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 각 개발 세션:
devtunnel host my-openclaw-bot
```

대안: `ngrok http 3978` 또는 `tailscale funnel 3978`(URL은 세션마다 변경될 수 있음).

터널 URL이 변경되면 엔드포인트를 업데이트하십시오.

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 봇 테스트

**진단 실행:**

```bash
teams app doctor <teamsAppId>
```

봇 등록, AAD 앱, 매니페스트 및 SSO 구성을 한 번에 검사합니다.

**테스트 메시지 전송:**

1. Teams 앱을 설치하십시오(`teams app get <id> --install-link`의 설치 링크).
2. Teams에서 봇을 찾아 DM을 보내십시오.
3. 수신 활동이 있는지 Gateway 로그를 확인하십시오.

## 환경 변수

이러한 인증 관련 구성 키는 `openclaw.json` 대신 환경 변수를 통해 설정할 수 있습니다(`groupPolicy` 또는 `historyLimit`과 같은 다른 구성 키는 구성에서만 설정할 수 있음).

| 환경 변수                              | 구성 키                    | 참고                                |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` 또는 `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | 페더레이션 + 인증서                  |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 허용되지만 인증에는 필요하지 않음       |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | 페더레이션 + 관리 ID                  |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | 사용자 할당 관리 ID 전용               |

## 구성원 정보 액션

OpenClaw는 에이전트와 자동화가 구성된 대화의 검증된 명단 세부 정보를 확인할 수 있도록 Microsoft Teams용 Graph 기반 `member-info` 액션을 제공합니다.

요구 사항:

- `ChannelSettings.Read.Group` 및 `TeamMember.Read.Group` RSC 권한(권장 매니페스트에 이미 포함됨).

Graph 자격 증명이 구성되어 있으면 이 액션을 사용할 수 있으며, 별도의 `channels.msteams.actions.memberInfo` 토글은 없습니다.
표준 채널 조회는 일치하는 팀 명단 ID, 표시 이름, 이메일 및 역할을 반환합니다.
현재 DM 또는 그룹 채팅에서는 신뢰할 수 있는 발신자의 안정적인 사용자 ID를 반환할 수 있습니다.
비공개/공유 채널 및 현재 채팅이 아닌 채팅의 구성원 조회에는 추가 명단 권한이 필요하며
기본 권한 기준에서는 거부됩니다.

## 기록 컨텍스트

- `channels.msteams.historyLimit`은 최근 채널/그룹 메시지 중 몇 개를 프롬프트에 포함할지 제어합니다. `messages.groupChat.historyLimit`로 대체되며, 그마저 없으면 기본값은 50입니다. 비활성화하려면 `0`으로 설정하십시오.
- 가져온 스레드 기록은 발신자 허용 목록(`allowFrom` / `groupAllowFrom`)으로 필터링되므로, 스레드 컨텍스트 초기화에는 허용된 발신자의 메시지만 포함됩니다.
- 인용된 첨부 파일 컨텍스트(답글 자체의 첨부 파일에 있는 Skype Reply 스키마 HTML에서 구문 분석됨)는 필터링 없이 전달됩니다. 현재 발신자 허용 목록 필터는 스레드 기록 초기화에만 적용됩니다.
- DM 기록은 `channels.msteams.dmHistoryLimit`(사용자 턴)으로 제한할 수 있습니다. 사용자별 재정의: `channels.msteams.dms["<user_id>"].historyLimit`.

## 현재 Teams RSC 권한(매니페스트)

다음은 Teams 앱 매니페스트의 **기존 resourceSpecific 권한**입니다. 앱이 설치된 팀/채팅 내에서만 적용됩니다.

**채널용(팀 범위):**

- `ChannelMessage.Read.Group`(Application) - @멘션 없이 모든 채널 메시지 수신
- `ChannelMessage.Send.Group`(Application)
- `Member.Read.Group`(Application)
- `Owner.Read.Group`(Application)
- `ChannelSettings.Read.Group`(Application)
- `TeamMember.Read.Group`(Application)
- `TeamSettings.Read.Group`(Application)

**그룹 채팅용:**

- `ChatMessage.Read.Chat`(Application) - @멘션 없이 모든 그룹 채팅 메시지 수신

Teams CLI를 통해 RSC 권한을 추가하십시오.

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 매니페스트 예시(민감 정보 삭제됨)

필수 필드를 포함한 유효한 최소 예시입니다. ID와 URL을 교체하십시오.

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

- `bots[].botId`은 Azure Bot App ID와 **반드시** 일치해야 합니다.
- `webApplicationInfo.id`은 Azure Bot App ID와 **반드시** 일치해야 합니다.
- `bots[].scopes`에는 사용하려는 화면(`personal`, `team`, `groupChat`)이 포함되어야 합니다.
- 개인 범위에서 파일을 처리하려면 `bots[].supportsFiles: true`이 필요합니다.
- `authorization.permissions.resourceSpecific`에는 채널 트래픽을 위한 채널 읽기/보내기가 포함되어야 합니다.

### 기존 앱 업데이트

```bash
# 매니페스트를 다운로드하고 편집한 후 다시 업로드
teams app manifest download <teamsAppId> manifest.json
# 로컬에서 manifest.json 편집...
teams app manifest upload manifest.json <teamsAppId>
# 콘텐츠가 변경되면 버전이 자동으로 증가함
```

업데이트한 후 각 팀에 앱을 다시 설치하고 캐시된 앱 메타데이터를 지우려면 **Teams를 완전히 종료한 후 다시 실행**하십시오(창만 닫으면 안 됨).

<details>
<summary>수동 매니페스트 업데이트(CLI 미사용)</summary>

1. 새 설정으로 `manifest.json`을 업데이트하십시오.
2. **`version` 필드의 값을 증가**시키십시오(예: `1.0.0` → `1.1.0`).
3. 아이콘(`manifest.json`, `outline.png`, `color.png`)과 함께 매니페스트를 **다시 압축**하십시오.
4. 새 zip을 업로드하십시오.
   - **Teams Admin Center:** Teams apps → Manage apps → 앱 찾기 → Upload new version.
   - **사이드로드:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## 기능: RSC만 사용하는 경우와 Graph를 사용하는 경우

### **Teams RSC만** 사용하는 경우(앱 설치됨, Graph API 권한 없음)

작동하는 기능:

- 채널 메시지 **텍스트** 콘텐츠 읽기.
- 채널 메시지 **텍스트** 콘텐츠 보내기.
- **개인(DM)** 파일 첨부 수신.

작동하지 않는 기능:

- 채널/그룹 **이미지 또는 파일 콘텐츠**(페이로드에는 HTML 스텁만 포함됨).
- SharePoint/OneDrive에 저장된 첨부 파일 다운로드.
- 실시간 Webhook 이벤트 이전의 메시지 기록 읽기.

### **Teams RSC + Microsoft Graph 애플리케이션 권한**을 사용하는 경우

추가되는 기능:

- 호스팅된 콘텐츠(메시지에 붙여 넣은 이미지) 다운로드.
- SharePoint/OneDrive에 저장된 파일 첨부 다운로드.
- Graph를 통해 채널/채팅 메시지 기록 읽기.

### RSC와 Graph API 비교

| 기능                    | RSC 권한                 | Graph API                                 |
| ----------------------- | ------------------------ | ----------------------------------------- |
| **실시간 메시지**       | 예(Webhook 사용)         | 아니요(폴링만 가능)                       |
| **과거 메시지**         | 아니요                   | 예(기록 조회 가능)                        |
| **설정 복잡성**         | 앱 매니페스트만 필요     | 관리자 동의 + 토큰 흐름 필요              |
| **오프라인 작동**       | 아니요(실행 중이어야 함) | 예(언제든지 조회 가능)                    |

**요점:** RSC는 실시간 수신용이고, Graph API는 과거 기록 액세스용입니다. 오프라인 상태에서 놓친 메시지를 확인하려면 `ChannelMessage.Read.All`이 포함된 Graph API가 필요합니다(관리자 동의 필요).

## Graph를 사용한 미디어 + 기록

사용하는 Teams 범위와 데이터에 필요한 Microsoft Graph 애플리케이션 권한만 활성화하십시오.

1. Entra ID (Azure AD) **App Registration** → Graph **Application permissions** 추가:
   - 채널 첨부 파일 및 채널 기록을 위한 `ChannelMessage.Read.All`.
   - 그룹 채팅 첨부 파일 및 그룹 채팅 기록을 위한 `Chat.Read.All`.
   - SharePoint/OneDrive 저장소에서 첨부 파일 바이트를 다운로드해야 할 때는 `Files.Read.All`이 필요하며, 기록만 사용하는 설정에는 필요하지 않습니다.
2. 테넌트에 대해 **Grant admin consent**를 수행하십시오.
3. Teams 앱 **매니페스트 버전**을 올리고 다시 업로드한 후 **Teams에서 앱을 다시 설치하십시오**.
4. 캐시된 앱 메타데이터를 지우려면 **Teams를 완전히 종료한 후 다시 실행하십시오**.

### 채널/그룹 파일 복구(`graphMediaFallback`)

Teams는 봇으로 전송되는 HTML 활동에서 파일 표시자를 제거할 수 있습니다. 이 경우 Bot Framework 활동은 일반 HTML 메시지와 구별할 수 없으며, 완전한 첨부 파일 참조는 메시지의 Graph 사본에만 존재합니다.

위 권한을 부여한 후 폴백을 활성화하십시오.

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

이는 채널과 그룹 채팅에만 적용됩니다. 일반 메시지 또는 멘션만 포함된 메시지를 비롯해 HTML 활동에서 직접 다운로드 가능한 미디어가 생성되지 않을 때마다 Graph 메시지 조회가 한 번 추가됩니다. 기존 설치에 추가 Graph 트래픽이나 권한 오류가 자동으로 발생하지 않도록 기본값은 `false`입니다.

**사용자 멘션:** 대화에 이미 참여 중인 사용자는 별도 설정 없이 @멘션할 수 있습니다. **현재 대화에 참여하지 않은** 사용자를 동적으로 검색하고 멘션하려면 `User.Read.All`(애플리케이션) 권한을 추가하고 관리자 동의를 부여하십시오.

## 알려진 제한 사항

### Webhook 시간 초과

Teams는 HTTP Webhook을 통해 메시지를 전달합니다. OpenClaw는 해당 Webhook 리스너에 고정 HTTP 서버 시간 초과를 적용합니다. 비활성 시간은 30초, 전체 요청 시간은 30초, 헤더 수신 시간은 15초입니다. 선택적 인바운드 미디어 및 컨텍스트 보강에는 공유 10초 예산이 있지만, Teams SDK는 Webhook 응답을 반환하기 전에 에이전트 턴이 완료될 때까지 기다립니다. 전체 턴이 Teams의 재시도 시간 범위를 초과하면 다음 현상이 나타날 수 있습니다.

- Teams가 메시지를 재시도함(중복 발생).
- 응답이 누락됨.

에이전트가 응답하면 사전 대응 방식으로 응답을 전송하지만, 에이전트 실행이 느리면 여전히 Teams 측에서 재시도나 중복이 발생할 수 있습니다.

### Teams 클라우드 및 서비스 URL 지원

이 SDK 기반 Teams 경로는 Microsoft Teams 퍼블릭 클라우드에서 실시간 검증되었습니다.

인바운드 응답은 수신된 Teams SDK 턴 컨텍스트를 사용합니다. 컨텍스트 외부의 사전 대응 작업(전송, 편집, 삭제, 카드, 설문 조사, 파일 동의 메시지 및 대기열에 추가된 장기 실행 응답)은 저장된 대화 참조 `serviceUrl`을 사용합니다. 퍼블릭 클라우드는 기본적으로 Teams SDK 퍼블릭 클라우드 환경을 사용하며 퍼블릭 Teams Connector 호스트에서 저장된 참조를 허용합니다: `https://smba.trafficmanager.net/`.

퍼블릭 클라우드가 기본값입니다. 일반적인 퍼블릭 클라우드 봇에서는 `channels.msteams.cloud` 또는 `channels.msteams.serviceUrl`을 설정할 필요가 없습니다.

퍼블릭이 아닌 Teams 클라우드의 경우 `cloud`과 Microsoft가 게시한 경우 이에 맞는 사전 대응 경계를 설정하십시오.

- `channels.msteams.cloud`은 인증, JWT 검증, 토큰 서비스 및 Graph 범위에 사용할 Teams SDK 클라우드 프리셋을 선택합니다.
- `channels.msteams.serviceUrl`은 사전 대응 전송, 편집, 삭제, 카드, 설문 조사, 파일 동의 메시지 및 대기열에 추가된 장기 실행 응답 전에 저장된 대화 참조를 검증하는 데 사용할 Bot Connector 엔드포인트 경계를 선택합니다. USGov 및 DoD SDK 클라우드에서는 필수입니다. China/21Vianet의 경우 OpenClaw는 SDK `China` 프리셋을 사용하며 Azure China Bot Framework 채널 호스트에 있는 저장되었거나 구성된 서비스 URL만 허용합니다.

Microsoft는 Teams 사전 대응 메시징 문서의 [대화 만들기](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) 섹션에 글로벌 사전 대응 Bot Connector 엔드포인트를 게시합니다. 수신 활동의 `serviceUrl`을 사용할 수 있으면 이를 사용하고, 그렇지 않으면 아래 Microsoft 표를 사용하십시오.

| Teams 환경       | OpenClaw 구성                                                | 사전 대응 `serviceUrl`                             |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| 퍼블릭           | 클라우드/serviceUrl 구성 불필요                              | `https://smba.trafficmanager.net/teams`                                       |
| GCC              | `serviceUrl` 설정; 별도의 Teams SDK 클라우드 프리셋 없음 | `https://smba.infra.gcc.teams.microsoft.com/teams`                                       |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                     | `https://smba.infra.gov.teams.microsoft.us/teams`                                       |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                     | `https://smba.infra.dod.teams.microsoft.us/teams`                                       |
| China/21Vianet   | `cloud: "China"`                                           | 수신 활동의 `serviceUrl` 사용                      |

Microsoft가 별도의 사전 대응 서비스 URL을 문서화했지만 Teams SDK에서 별도의 GCC 클라우드 프리셋을 제공하지 않는 GCC의 예는 다음과 같습니다.

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High의 예는 다음과 같습니다.

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl`은 지원되는 Microsoft Teams Bot Connector 호스트로 제한됩니다. 서비스 URL이 구성된 경우 OpenClaw는 사전 대응 전송, 편집, 삭제, 카드, 설문 조사 또는 대기열에 추가된 장기 실행 응답을 실행하기 전에 저장된 대화 `serviceUrl`이 동일한 호스트를 사용하는지 확인합니다. 기본 퍼블릭 클라우드 구성에서는 저장된 대화가 퍼블릭 Teams Connector 호스트 외부를 가리키면 OpenClaw가 안전하게 실패합니다. 클라우드/서비스 URL 설정을 변경한 후 대화에서 새 메시지를 수신하여 저장된 대화 참조를 최신 상태로 만드십시오.

Microsoft의 Teams 사전 대응 엔드포인트 표에는 China/21Vianet용 별도 글로벌 사전 대응 `smba` URL이 없습니다. Teams SDK가 Azure China 인증, 토큰 및 JWT 엔드포인트를 사용하도록 `cloud: "China"`을 구성하십시오. 그러면 사전 대응 전송에는 Azure China Bot Framework 채널 경계(`*.botframework.azure.cn`)에서 수신된 China Teams 활동의 저장된 대화 참조 또는 명시적으로 구성된 서비스 URL이 필요합니다. OpenClaw가 Azure China Graph 엔드포인트를 통해 Graph 요청을 라우팅할 때까지 `cloud: "China"`에서는 Graph 기반 Teams 도우미가 비활성화됩니다.

### 서식

Teams 마크다운은 Slack이나 Discord보다 제한적입니다.

- 기본 서식은 작동합니다: **굵게**, _기울임꼴_, `code`, 링크.
- 복잡한 마크다운(표, 중첩 목록)은 올바르게 렌더링되지 않을 수 있습니다.
- 설문 조사 및 의미론적 프레젠테이션 전송에는 Adaptive Cards가 지원됩니다(아래 참조).

## 구성

주요 설정(공유 채널 패턴은 [/gateway/configuration](/ko/gateway/configuration) 참조):

- `channels.msteams.enabled`: 채널을 활성화/비활성화합니다.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: 봇 자격 증명입니다.
- `channels.msteams.cloud`: Teams SDK 클라우드 환경입니다(`Public`, `USGov`, `USGovDoD` 또는 `China`; 기본값 `Public`). USGov/DoD SDK 클라우드의 경우 `serviceUrl`으로 설정하십시오. 중국에서는 SDK 프리셋과 저장된 Azure China Bot Framework 대화 참조를 사용하며, Azure China Graph 라우팅이 출시될 때까지 Graph 기반 도우미는 비활성화됩니다.
- `channels.msteams.serviceUrl`: SDK 사전 작업을 위한 Bot Connector 서비스 URL 경계입니다. 퍼블릭 클라우드는 SDK 기본값을 사용합니다. GCC(`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High 또는 DoD의 경우 설정하십시오. 저장된 대화 참조가 21Vianet에서 운영하는 Teams에서 생성된 경우 중국에서는 Azure China Bot Framework 채널 호스트를 허용합니다.
- `channels.msteams.webhook.port`(기본값 `3978`).
- `channels.msteams.webhook.path`(기본값 `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`(기본값 `pairing`).
- `channels.msteams.allowFrom`: DM 허용 목록입니다(AAD 개체 ID 권장). Graph 액세스를 사용할 수 있는 경우 마법사가 설정 중에 이름을 ID로 변환합니다.
- `channels.msteams.dangerouslyAllowNameMatching`: 변경 가능한 UPN/표시 이름 일치 및 팀/채널 이름 직접 라우팅을 다시 활성화하는 비상용 토글입니다.
- `channels.msteams.textChunkLimit`: 발신 텍스트 청크 크기(문자 수)입니다(기본값 `4000`, 더 높은 값을 구성해도 최대 `4000`으로 엄격히 제한됨).
- `channels.msteams.streaming.chunkMode`: 길이 기준으로 청크를 나누기 전에 빈 줄(문단 경계)을 기준으로 분할하려면 `length`(기본값) 또는 `newline`을 사용합니다.
- `channels.msteams.mediaAllowHosts`: 수신 첨부 파일 호스트의 허용 목록입니다(기본값은 Microsoft/Teams 도메인: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: 미디어 재시도 시 Authorization 헤더를 첨부할 호스트의 허용 목록입니다(기본값은 Graph + Bot Framework 호스트).
- `channels.msteams.graphMediaFallback`: 채널/그룹 HTML에서 파일 마커가 누락된 경우 Graph 메시지 조회를 사용하도록 설정합니다(기본값 `false`; [채널/그룹 파일 복구](#channelgroup-file-recovery-graphmediafallback) 참조).
- `channels.msteams.mediaMaxMb`: 채널별 미디어 크기 제한 재정의 값(MB)입니다. 설정하지 않으면 `agents.defaults.mediaMaxMb`으로 대체됩니다.
- `channels.msteams.requireMention`: 채널/그룹에서 @멘션을 요구합니다(기본값 `true`).
- `channels.msteams.replyStyle`: `thread | top-level`([답장 스타일](#reply-style-threads-vs-posts) 참조).
- `channels.msteams.teams.<teamId>.replyStyle`: 팀별 재정의입니다.
- `channels.msteams.teams.<teamId>.requireMention`: 팀별 재정의입니다.
- `channels.msteams.teams.<teamId>.tools`: 채널 재정의가 없을 때 사용하는 기본 팀별 도구 정책 재정의(`allow`/`deny`/`alsoAllow`)입니다.
- `channels.msteams.teams.<teamId>.toolsBySender`: 기본 팀별·발신자별 도구 정책 재정의입니다(`"*"` 와일드카드 지원).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: 채널별 재정의입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: 채널별 재정의입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: 채널별 도구 정책 재정의(`allow`/`deny`/`alsoAllow`)입니다.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: 채널별·발신자별 도구 정책 재정의입니다(`"*"` 와일드카드 지원).
- `toolsBySender` 키에는 명시적 접두사인 `channel:`, `id:`, `e164:`, `username:`, `name:`을 사용해야 합니다(접두사가 없는 레거시 키는 여전히 `id:`에만 매핑됨).
- `channels.msteams.authType`: 인증 유형입니다. `"secret"`(기본값) 또는 `"federated"`입니다.
- `channels.msteams.certificatePath`: PEM 인증서 파일 경로입니다(페더레이션 + 인증서 인증).
- `channels.msteams.certificateThumbprint`: 인증서 지문입니다. 허용되지만 인증에 필수는 아닙니다.
- `channels.msteams.useManagedIdentity`: 관리 ID 인증을 활성화합니다(페더레이션 모드).
- `channels.msteams.managedIdentityClientId`: 사용자 할당 관리 ID의 클라이언트 ID입니다.
- `channels.msteams.sharePointSiteId`: 그룹 채팅/채널에서 파일을 업로드하기 위한 SharePoint 사이트 ID입니다([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참조).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: 첫 DM/그룹 연락 시 표시되는 환영 Adaptive Card와 추천 프롬프트 버튼입니다.
- `channels.msteams.responsePrefix`: 발신 답장 앞에 추가되는 텍스트입니다.
- `channels.msteams.feedbackEnabled`(기본값 `true`), `channels.msteams.feedbackReflection`(기본값 `true`), `channels.msteams.feedbackReflectionCooldownMs`: 답장에 대한 좋아요/싫어요 피드백과 부정적 피드백에 대한 성찰 후속 처리입니다.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: SSO 기반 흐름을 위한 Bot Framework OAuth 연결 및 위임된 Graph 범위입니다. `sso.enabled: true`에는 `sso.connectionName`이 필요합니다.

## 라우팅 및 세션

- 세션 키는 표준 에이전트 형식을 따릅니다([/concepts/session](/ko/concepts/session) 참조).
  - 다이렉트 메시지는 기본 세션을 공유합니다(`agent:<agentId>:<mainKey>`).
  - 채널/그룹 메시지는 대화 ID를 사용합니다.
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 답장 스타일: 스레드와 게시물

Teams에는 동일한 기본 데이터 모델을 사용하는 두 가지 채널 UI 스타일이 있습니다.

| 스타일                   | 설명                                                      | 권장 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **게시물**(클래식)       | 메시지가 카드로 표시되고 그 아래에 스레드형 답장이 나타납니다 | `thread`(기본값) |
| **스레드**(Slack 유사)   | 메시지가 Slack처럼 선형으로 이어집니다                    | `top-level`       |

**문제:** Teams API는 채널이 어떤 UI 스타일을 사용하는지 노출하지 않습니다. 잘못된 `replyStyle`을 사용하면 다음과 같은 문제가 발생합니다.

- 스레드 스타일 채널에서 `thread` → 답장이 어색하게 중첩되어 표시됩니다.
- 게시물 스타일 채널에서 `top-level` → 답장이 스레드 내부가 아닌 별도의 최상위 게시물로 표시됩니다.

**해결 방법:** 채널 설정 방식에 따라 채널별로 `replyStyle`을 구성하십시오.

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

### 해석 우선순위

봇이 채널에 답장을 보낼 때 `replyStyle`은 가장 구체적인 재정의부터 기본값까지 순서대로 해석됩니다. 처음 발견된 `undefined`이 아닌 값이 적용됩니다.

1. **채널별** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **팀별** - `channels.msteams.teams.<teamId>.replyStyle`
3. **전역** - `channels.msteams.replyStyle`
4. **암시적 기본값** - `requireMention`에서 파생됩니다.
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

명시적인 `replyStyle` 없이 `requireMention: false`을 전역으로 설정하면, 게시물 스타일 채널에서 수신 메시지가 스레드 답장이었더라도 멘션이 최상위 게시물로 표시됩니다. 예기치 않은 동작을 방지하려면 전역, 팀 또는 채널 수준에서 `replyStyle: "thread"`을 고정하십시오.

저장된 채널 대화로 사전 전송하는 경우(대기열에 추가된 도구 호출 답장, 장시간 실행 에이전트)에도 동일한 팀/채널 해석이 적용됩니다. 그룹 채팅과 개인(DM) 대화에서는 `replyStyle`과 관계없이 사전 전송 시 항상 `top-level`로 해석됩니다.

### 스레드 컨텍스트 보존

`replyStyle: "thread"`이 적용되고 채널 스레드 내부에서 봇이 @멘션된 경우, OpenClaw는 원래 스레드 루트를 발신 대화 참조(`19:...@thread.tacv2;messageid=<root>`)에 다시 연결하여 답장이 같은 스레드에 표시되도록 합니다. 이는 실시간(턴 내) 전송과 Bot Framework 턴 컨텍스트가 만료된 후의 사전 전송(예: 장시간 실행 에이전트, `mcp__openclaw__message`을 통한 대기열의 도구 호출 답장)에 모두 적용됩니다.

스레드 루트는 대화 참조에 저장된 `threadId`에서 가져옵니다. `threadId` 이전에 저장된 오래된 참조는 `activityId`(마지막으로 대화를 시드한 수신 활동)으로 대체되므로 기존 배포는 다시 시드하지 않아도 계속 작동합니다.

`replyStyle: "top-level"`이 적용되면 채널 스레드의 수신 메시지에 의도적으로 새 최상위 게시물로 답장하며, 스레드 접미사를 첨부하지 않습니다. 이는 스레드 스타일 채널에 올바른 동작입니다. 스레드형 답장을 예상했는데 최상위 게시물이 표시된다면 해당 채널에 `replyStyle`이 잘못 설정된 것입니다.

## 첨부 파일 및 이미지

**현재 제한 사항:**

- **DM:** 이미지와 파일 첨부는 Teams 봇 파일 API를 통해 작동합니다.
- **채널/그룹:** 첨부 파일은 M365 저장소(SharePoint/OneDrive)에 있습니다. Webhook 페이로드에는 실제 파일 바이트가 아닌 HTML 스텁만 포함됩니다. 채널 첨부 파일을 다운로드하려면 **Graph API 권한이 필요합니다**.
- 파일을 먼저 명시적으로 보내려면 `action=upload-file`을 `media` / `filePath` / `path`과 함께 사용하십시오. 선택 사항인 `message`은 함께 보내는 텍스트/댓글이 되며, `filename`(또는 `title`)은 업로드되는 이름을 재정의합니다.

Graph 권한이 없으면 이미지가 포함된 채널 메시지는 텍스트로만 수신됩니다(봇이 이미지 콘텐츠에 액세스할 수 없음).
기본적으로 OpenClaw는 Microsoft/Teams 호스트 이름에서만 미디어를 다운로드합니다. `channels.msteams.mediaAllowHosts`로 재정의하십시오(모든 호스트를 허용하려면 `["*"]` 사용).
Authorization 헤더는 `channels.msteams.mediaAuthAllowHosts`에 포함된 호스트에만 첨부됩니다(기본값은 Graph + Bot Framework 호스트). 이 목록은 엄격하게 유지하십시오(다중 테넌트 접미사는 피하십시오).

## 그룹 채팅에서 파일 보내기

봇은 기본 제공 FileConsentCard 흐름을 사용하여 DM에서 파일을 보낼 수 있습니다. **그룹 채팅/채널에서 파일을 보내려면** 추가 설정이 필요합니다.

| 컨텍스트                 | 파일 전송 방법                                | 필요한 설정                                     |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → 사용자 수락 → 봇 업로드    | 별도 설정 없이 작동합니다                       |
| **그룹 채팅/채널**       | SharePoint에 업로드 → 네이티브 파일 카드     | `sharePointSiteId` + Graph 권한 필요             |
| **이미지(모든 컨텍스트)** | Base64 인코딩 인라인                         | 별도 설정 없이 작동합니다                       |

### 그룹 채팅에 SharePoint가 필요한 이유

봇은 애플리케이션 ID를 사용하지만 Microsoft Graph의 `/me` 리소스에는 [로그인한 사용자가 필요합니다](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). 그룹 채팅/채널에서 파일을 보내기 위해 봇은 파일을 **SharePoint 사이트**에 업로드하고 공유 링크를 생성합니다.

### 설정

1. Entra ID (Azure AD) → App Registration에서 **Graph API 권한을 추가하십시오**.
   - `Sites.ReadWrite.All`(Application) - SharePoint에 파일을 업로드합니다.
   - `ChatMember.Read.All`(Application) - 그룹 채팅 파일 전송을 위한 최소 권한의 테넌트 전체 권한입니다. `Chat.Read.All`도 사용할 수 있으며, 그룹 채팅 기록이 활성화된 경우 이미 이 기능을 포함합니다. 채팅별 대안으로 `ChatMember.Read.Chat` [리소스별 동의 권한](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)을 사용하십시오.
2. 테넌트에 대해 **관리자 동의를 부여하십시오**.
3. **SharePoint 사이트 ID를 가져오십시오:**

   ```bash
   # Graph Explorer 또는 유효한 토큰을 사용하는 curl을 통해:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 예: "contoso.sharepoint.com/sites/BotFiles"에 있는 사이트의 경우
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 응답에 포함되는 항목: "id": "contoso.sharepoint.com,guid1,guid2"
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

| 컨텍스트 및 권한                                                        | 공유 동작                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| 채널 + `Sites.ReadWrite.All`                                              | 조직 전체 공유 링크(조직 내 누구나 액세스 가능)            |
| 그룹 채팅 + `Sites.ReadWrite.All` + 지원되는 채팅 구성원 읽기 권한 부여 | 사용자별 공유 링크(채팅 구성원만 액세스 가능)               |
| 지원되는 채팅 구성원 읽기 권한 부여가 없는 그룹 채팅                    | 안전하게 차단되어 전송 실패                                 |

사용자별 공유는 채팅 참가자만 파일에 액세스할 수 있으므로 더 안전합니다. OpenClaw는 그룹 채팅에서 구성원 조회가 성공해야 합니다. 시간 초과, 전송 실패, 빈 결과 및 Graph API 거부가 발생하면 액세스 범위를 조직 전체로 확대하는 대신 전송이 실패합니다.

### 대체 동작

| 시나리오                                                         | 결과                                              |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| 그룹 채팅 + 파일 + SharePoint 및 구성원 권한 구성됨              | SharePoint에 업로드하고 기본 파일 카드 전송       |
| 그룹 채팅 + 파일 + SharePoint 또는 구성원 권한 누락              | 조치 가능한 구성 오류와 함께 실패                 |
| 채널 + 파일 + `sharePointSiteId` 구성됨                          | SharePoint에 업로드하고 기본 파일 카드 전송       |
| 개인 채팅 + 파일                                                 | FileConsentCard 흐름(SharePoint 없이 작동)         |
| 모든 컨텍스트 + 이미지                                           | Base64로 인코딩하여 인라인 처리(SharePoint 없이 작동) |

### 파일 저장 위치

업로드된 파일은 구성된 SharePoint 사이트의 기본 문서 라이브러리에 있는 `/OpenClawShared/` 폴더에 저장됩니다.

## 설문 조사(Adaptive Cards)

OpenClaw는 Teams 설문 조사를 Adaptive Cards로 전송합니다(Teams에는 기본 설문 조사 API가 없습니다).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- 투표는 Gateway가 `state/openclaw.sqlite` 아래의 OpenClaw Plugin 상태 SQLite에 기록합니다.
- 기존 `msteams-polls.json` 파일은 실행 중인 Plugin이 아니라 `openclaw doctor --fix`에서 가져옵니다.
- 투표를 기록하려면 Gateway가 계속 온라인 상태여야 합니다.
- 설문 조사 결과 요약은 자동으로 게시되지 않으며, 아직 설문 조사 결과용 CLI도 없습니다.

## 프레젠테이션 카드

`message` 도구, CLI 또는 일반 응답 전달을 사용하여 의미론적 프레젠테이션 페이로드를 Teams 사용자나 대화에 전송합니다. OpenClaw는 일반 프레젠테이션 계약에 따라 이를 Teams Adaptive Cards로 렌더링합니다.

`presentation` 매개변수는 의미론적 블록을 허용합니다. `presentation`이 제공되면 메시지 텍스트는 선택 사항입니다. 버튼은 Adaptive Card 제출 또는 URL 작업으로 렌더링됩니다. 선택 메뉴는 Teams 렌더러에서 기본 지원되지 않으므로 OpenClaw는 전달 전에 읽을 수 있는 텍스트로 변환합니다.

**에이전트 도구:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "안녕하세요",
    blocks: [{ type: "text", text: "안녕하세요!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"안녕하세요","blocks":[{"type":"text","text":"안녕하세요!"}]}'
```

대상 형식에 관한 자세한 내용은 아래의 [대상 형식](#target-formats)을 참조하십시오.

## 대상 형식

MSTeams 대상은 접두사를 사용하여 사용자와 대화를 구분합니다.

| 대상 유형           | 형식                             | 예                                                                                                     |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 사용자(ID 기준)     | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                     |
| 사용자(이름 기준)   | `user:<display-name>`               | `user:John Smith` (Graph API 필요)                                                                    |
| 그룹/채널           | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                     |
| 그룹/채널(원시 값)  | `<conversation-id>`               | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` 또는 접두사가 없는 `a:`/`8:orgid:`/`29:` Bot Framework ID |

**CLI 예시:**

```bash
# ID로 사용자에게 전송
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "안녕하세요"

# 표시 이름으로 사용자에게 전송(Graph API 조회 실행)
openclaw message send --channel msteams --target "user:John Smith" --message "안녕하세요"

# 그룹 채팅 또는 채널에 전송
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "안녕하세요"

# 대화에 프레젠테이션 카드 전송
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"안녕하세요","blocks":[{"type":"text","text":"안녕하세요"}]}'
```

**에이전트 도구 예시:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "안녕하세요!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "안녕하세요",
    blocks: [{ type: "text", text: "안녕하세요" }],
  },
}
```

<Note>
`user:` 접두사가 없으면 이름은 기본적으로 그룹 또는 팀으로 확인됩니다. 표시 이름으로 사람을 대상으로 지정할 때는 항상 `user:`을 사용하십시오.
</Note>

## 선제적 메시징

- OpenClaw는 사용자가 상호작용한 시점에 대화 참조를 저장하므로 선제적 메시지는 사용자가 상호작용한 **후에만** 전송할 수 있습니다.
- `dmPolicy` 및 허용 목록 제한에 관한 내용은 [/gateway/configuration](/ko/gateway/configuration)을 참조하십시오.

## 팀 및 채널 ID(흔한 주의 사항)

Teams URL의 `groupId` 쿼리 매개변수는 구성에 사용하는 팀 ID가 **아닙니다**. 대신 URL 경로에서 ID를 추출하십시오.

**팀 URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    팀 대화 ID(이 값을 URL 디코딩하십시오)
```

**채널 URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      채널 ID(이 값을 URL 디코딩하십시오)
```

**구성 시:**

- 팀 키 = `/team/` 뒤의 경로 세그먼트(URL 디코딩됨, 예: `19:Bk4j...@thread.tacv2`; 이전 테넌트에서는 `@thread.skype`이 표시될 수 있으며 이 값도 유효함).
- 채널 키 = `/channel/` 뒤의 경로 세그먼트(URL 디코딩됨).
- OpenClaw 라우팅에서는 `groupId` 쿼리 매개변수를 **무시하십시오**. 이 값은 수신 Teams 활동에서 사용하는 Bot Framework 대화 ID가 아니라 Microsoft Entra 그룹 ID입니다.

## 비공개 채널

Bot은 비공개 채널을 제한적으로 지원합니다.

| 기능                         | 표준 채널 | 비공개 채널              |
| ---------------------------- | --------- | ------------------------ |
| Bot 설치                     | 예        | 제한적                   |
| 실시간 메시지(Webhook)       | 예        | 작동하지 않을 수 있음    |
| RSC 권한                     | 예        | 다르게 동작할 수 있음    |
| @멘션                        | 예        | Bot에 액세스할 수 있는 경우 |
| Graph API 기록               | 예        | 예(권한 필요)            |

**비공개 채널이 작동하지 않을 때의 해결 방법:**

1. Bot 상호작용에는 표준 채널을 사용하십시오.
2. DM을 사용하십시오. 사용자는 언제든지 Bot에 직접 메시지를 보낼 수 있습니다.
3. 이전 기록에 액세스하려면 Graph API를 사용하십시오(`ChannelMessage.Read.All` 필요).

## 문제 해결

### 일반적인 문제

- **채널에 이미지가 표시되지 않음:** Graph 권한 또는 관리자 동의가 누락되었습니다. Teams 앱을 다시 설치하고 Teams를 완전히 종료한 후 다시 여십시오.
- **채널에서 응답이 없음:** 기본적으로 멘션이 필요합니다. `channels.msteams.requireMention=false`을 설정하거나 팀/채널별로 구성하십시오.
- **버전 불일치(Teams에 여전히 이전 매니페스트가 표시됨):** 앱을 제거한 후 다시 추가하고 Teams를 완전히 종료하여 새로 고치십시오.
- **Webhook에서 401 Unauthorized 발생:** Azure JWT 없이 수동으로 테스트할 때 예상되는 동작입니다. 엔드포인트에 연결할 수 있지만 인증에 실패했음을 의미합니다. 올바르게 테스트하려면 Azure Web Chat을 사용하십시오.

### 매니페스트 업로드 오류

- **"Icon file cannot be empty":** 매니페스트가 0바이트인 아이콘 파일을 참조합니다. 유효한 PNG 아이콘을 생성하십시오(`outline.png`은 32x32, `color.png`은 192x192).
- **"webApplicationInfo.Id already in use":** 앱이 여전히 다른 팀/채팅에 설치되어 있습니다. 먼저 해당 앱을 찾아 제거하거나 전파될 때까지 5-10분 기다리십시오.
- **업로드 시 "Something went wrong":** 대신 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com)을 통해 업로드하고, 브라우저 DevTools(F12) → Network 탭을 연 다음 응답 본문에서 실제 오류를 확인하십시오.
- **사이드로드 실패:** "Upload a custom app" 대신 "Upload an app to your org's app catalog"을 사용해 보십시오. 이렇게 하면 사이드로드 제한을 우회할 수 있는 경우가 많습니다.

### RSC 권한이 작동하지 않음

1. `webApplicationInfo.id`이 Bot의 App ID와 정확히 일치하는지 확인하십시오.
2. 앱을 다시 업로드하고 팀/채팅에 다시 설치하십시오.
3. 조직 관리자가 RSC 권한을 차단했는지 확인하십시오.
4. 올바른 범위를 사용하는지 확인하십시오. 팀에는 `ChannelMessage.Read.Group`, 그룹 채팅에는 `ChatMessage.Read.Chat`을 사용합니다.

## 참고 자료

- [Azure Bot 만들기](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 설정 가이드
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams 앱 생성/관리
- [Teams 앱 매니페스트 스키마](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC를 사용하여 채널 메시지 수신](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 권한 참고 자료](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams Bot 파일 처리](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (채널/그룹에는 Graph 필요)
- [선제적 메시징](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Bot 관리용 Teams CLI

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) - 메시지 세션 라우팅
- [보안](/ko/gateway/security) - 액세스 모델 및 보안 강화
