---
read_when:
    - Zalo 기능 또는 Webhook 작업하기
summary: Zalo 봇 지원 상태, 기능 및 구성
title: Zalo
x-i18n:
    generated_at: "2026-04-25T05:57:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

상태: 실험적. DM이 지원됩니다. 아래 [기능](#capabilities) 섹션은 현재 Marketplace 봇 동작을 반영합니다.

## 번들된 Plugin

Zalo는 현재 OpenClaw 릴리스에 번들된 Plugin으로 제공되므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드나 Zalo가 제외된 사용자 지정 설치를 사용하는 경우에는 수동으로 설치하세요:

- CLI로 설치: `openclaw plugins install @openclaw/zalo`
- 또는 소스 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalo-plugin`
- 자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정(초보자용)

1. Zalo Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. 토큰을 설정합니다:
   - 환경 변수: `ZALO_BOT_TOKEN=...`
   - 또는 config: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway를 다시 시작합니다(또는 설정을 완료합니다).
4. DM 액세스는 기본적으로 페어링이며, 첫 연락 시 페어링 코드를 승인합니다.

최소 config:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## 개요

Zalo는 베트남 중심의 메시징 앱이며, 해당 Bot API를 통해 Gateway가 1:1 대화를 위한 봇을 실행할 수 있습니다.
Zalo로의 결정적 라우팅이 필요한 지원 또는 알림 시나리오에 적합합니다.

이 페이지는 **Zalo Bot Creator / Marketplace 봇**에 대한 현재 OpenClaw 동작을 반영합니다.
**Zalo Official Account (OA) 봇**은 다른 Zalo 제품 표면이며 다르게 동작할 수 있습니다.

- Gateway가 소유하는 Zalo Bot API 채널입니다.
- 결정적 라우팅: 응답은 다시 Zalo로 돌아가며, 모델이 채널을 선택하지 않습니다.
- DM은 에이전트의 메인 세션을 공유합니다.
- 아래 [기능](#capabilities) 섹션은 현재 Marketplace 봇 지원 상태를 보여줍니다.

## 설정(빠른 경로)

### 1) 봇 토큰 생성(Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)으로 이동해 로그인합니다.
2. 새 봇을 만들고 설정을 구성합니다.
3. 전체 봇 토큰(일반적으로 `numeric_id:secret`)을 복사합니다. Marketplace 봇의 경우, 생성 후 봇의 환영 메시지에 실제 런타임에서 사용할 토큰이 표시될 수 있습니다.

### 2) 토큰 구성(환경 변수 또는 config)

예시:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

나중에 그룹을 사용할 수 있는 Zalo 봇 표면으로 이동하면, `groupPolicy`, `groupAllowFrom` 같은 그룹 전용 config를 명시적으로 추가할 수 있습니다. 현재 Marketplace 봇 동작은 [기능](#capabilities)을 참고하세요.

환경 변수 옵션: `ZALO_BOT_TOKEN=...`(기본 계정에서만 동작).

멀티 계정 지원: 계정별 토큰과 선택적 `name`을 사용하려면 `channels.zalo.accounts`를 사용하세요.

3. Gateway를 다시 시작합니다. 토큰이 확인되면(env 또는 config) Zalo가 시작됩니다.
4. DM 액세스의 기본값은 페어링입니다. 봇에 처음 연락할 때 코드를 승인하세요.

## 동작 방식(behavior)

- 인바운드 메시지는 미디어 플레이스홀더와 함께 공유 채널 envelope로 정규화됩니다.
- 응답은 항상 동일한 Zalo 채팅으로 다시 라우팅됩니다.
- 기본값은 롱 폴링이며, `channels.zalo.webhookUrl`로 Webhook 모드를 사용할 수 있습니다.

## 제한 사항

- 아웃바운드 텍스트는 2000자 단위로 청크 분할됩니다(Zalo API 제한).
- 미디어 다운로드/업로드는 `channels.zalo.mediaMaxMb`(기본값 5)로 제한됩니다.
- 2000자 제한으로 인해 스트리밍의 실효성이 낮아서, 스트리밍은 기본적으로 차단됩니다.

## 액세스 제어(DM)

### DM 액세스

- 기본값: `channels.zalo.dmPolicy = "pairing"`. 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지는 무시됩니다(코드는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 페어링이 기본 토큰 교환 방식입니다. 자세한 내용: [페어링](/ko/channels/pairing)
- `channels.zalo.allowFrom`은 숫자 사용자 ID를 받습니다(사용자 이름 조회는 지원되지 않음).

## 액세스 제어(그룹)

**Zalo Bot Creator / Marketplace 봇**의 경우, 실제로는 봇을 그룹에 추가할 수 없어서 그룹 지원을 사용할 수 없었습니다.

즉, 아래 그룹 관련 config 키는 스키마에는 존재하지만 Marketplace 봇에서는 사용할 수 없었습니다:

- `channels.zalo.groupPolicy`는 그룹 인바운드 처리를 제어합니다: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom`은 그룹에서 어떤 발신자 ID가 봇을 트리거할 수 있는지 제한합니다.
- `groupAllowFrom`이 설정되지 않으면, Zalo는 발신자 검사 시 `allowFrom`으로 대체합니다.
- 런타임 참고: `channels.zalo`가 완전히 없더라도, 안전을 위해 런타임은 여전히 `groupPolicy="allowlist"`로 대체합니다.

그룹 정책 값(봇 표면에서 그룹 액세스를 사용할 수 있는 경우)은 다음과 같습니다:

- `groupPolicy: "disabled"` — 모든 그룹 메시지를 차단합니다.
- `groupPolicy: "open"` — 모든 그룹 구성원을 허용합니다(멘션 게이팅 적용).
- `groupPolicy: "allowlist"` — 기본 실패-폐쇄값이며, 허용된 발신자만 수락합니다.

다른 Zalo 봇 제품 표면을 사용 중이고 그룹 동작이 실제로 되는 것을 확인했다면, Marketplace 봇 흐름과 같다고 가정하지 말고 별도로 문서화하세요.

## 롱 폴링 vs Webhook

- 기본값: 롱 폴링(공개 URL 불필요).
- Webhook 모드: `channels.zalo.webhookUrl`과 `channels.zalo.webhookSecret`를 설정합니다.
  - Webhook secret은 8~256자여야 합니다.
  - Webhook URL은 HTTPS를 사용해야 합니다.
  - Zalo는 검증을 위해 `X-Bot-Api-Secret-Token` 헤더와 함께 이벤트를 보냅니다.
  - Gateway HTTP는 `channels.zalo.webhookPath`에서 Webhook 요청을 처리합니다(기본값: Webhook URL 경로).
  - 요청은 `Content-Type: application/json`(`+json` 미디어 타입도 허용)을 사용해야 합니다.
  - 중복 이벤트(`event_name + message_id`)는 짧은 재생 방지 창 동안 무시됩니다.
  - 순간적인 트래픽 급증은 경로/소스별로 rate limit이 적용되며 HTTP 429를 반환할 수 있습니다.

**참고:** Zalo API 문서에 따라 getUpdates(폴링)와 Webhook은 상호 배타적입니다.

## 지원되는 메시지 유형

빠른 지원 현황은 [기능](#capabilities)을 참고하세요. 아래 참고 사항은 추가 설명이 필요한 동작을 보완합니다.

- **텍스트 메시지**: 2000자 청크 분할과 함께 완전 지원.
- **텍스트 안의 일반 URL**: 일반 텍스트 입력처럼 동작합니다.
- **링크 미리보기 / 리치 링크 카드**: [기능](#capabilities)의 Marketplace 봇 상태를 참고하세요. 안정적으로 응답을 트리거하지 못했습니다.
- **이미지 메시지**: [기능](#capabilities)의 Marketplace 봇 상태를 참고하세요. 인바운드 이미지 처리는 신뢰성이 낮았습니다(입력 중 표시만 있고 최종 응답 없음).
- **스티커**: [기능](#capabilities)의 Marketplace 봇 상태를 참고하세요.
- **음성 메모 / 오디오 파일 / 비디오 / 일반 파일 첨부**: [기능](#capabilities)의 Marketplace 봇 상태를 참고하세요.
- **미지원 유형**: 기록됩니다(예: 보호된 사용자로부터 온 메시지).

## 기능

이 표는 OpenClaw에서의 현재 **Zalo Bot Creator / Marketplace 봇** 동작을 요약합니다.

| 기능                        | 상태                                    |
| --------------------------- | --------------------------------------- |
| 다이렉트 메시지             | ✅ 지원됨                               |
| 그룹                        | ❌ Marketplace 봇에서는 사용할 수 없음  |
| 미디어(인바운드 이미지)     | ⚠️ 제한적 / 환경에서 확인 필요          |
| 미디어(아웃바운드 이미지)   | ⚠️ Marketplace 봇 기준 재테스트 안 됨   |
| 텍스트 안의 일반 URL        | ✅ 지원됨                               |
| 링크 미리보기               | ⚠️ Marketplace 봇에서는 신뢰성 낮음     |
| 반응                        | ❌ 지원되지 않음                        |
| 스티커                      | ⚠️ Marketplace 봇에서는 에이전트 응답 없음 |
| 음성 메모 / 오디오 / 비디오 | ⚠️ Marketplace 봇에서는 에이전트 응답 없음 |
| 파일 첨부                   | ⚠️ Marketplace 봇에서는 에이전트 응답 없음 |
| 스레드                      | ❌ 지원되지 않음                        |
| 투표                        | ❌ 지원되지 않음                        |
| 네이티브 명령어             | ❌ 지원되지 않음                        |
| 스트리밍                    | ⚠️ 차단됨(2000자 제한)                  |

## 전달 대상(CLI/Cron)

- 대상에는 chat id를 사용합니다.
- 예시: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## 문제 해결

**봇이 응답하지 않음:**

- 토큰이 유효한지 확인: `openclaw channels status --probe`
- 발신자가 승인되었는지 확인(페어링 또는 allowFrom)
- Gateway 로그 확인: `openclaw logs --follow`

**Webhook이 이벤트를 받지 못함:**

- Webhook URL이 HTTPS를 사용하는지 확인
- secret token이 8~256자인지 확인
- 구성된 경로에서 Gateway HTTP 엔드포인트에 접근 가능한지 확인
- getUpdates 폴링이 실행 중이 아닌지 확인(서로 상호 배타적임)

## 구성 참조(Zalo)

전체 구성: [구성](/ko/gateway/configuration)

평면 최상위 키(`channels.zalo.botToken`, `channels.zalo.dmPolicy` 등)는 레거시 단일 계정 축약형입니다. 새 config에는 `channels.zalo.accounts.<id>.*`를 사용하는 것을 권장합니다. 두 형식 모두 스키마에 존재하므로 여기서 계속 문서화합니다.

프로바이더 옵션:

- `channels.zalo.enabled`: 채널 시작 활성화/비활성화.
- `channels.zalo.botToken`: Zalo Bot Platform의 봇 토큰.
- `channels.zalo.tokenFile`: 일반 파일 경로에서 토큰을 읽습니다. 심볼릭 링크는 거부됩니다.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing).
- `channels.zalo.allowFrom`: DM 허용 목록(사용자 ID). `open`에는 `"*"`가 필요합니다. 마법사는 숫자 ID를 요청합니다.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`(기본값: allowlist). config에는 존재합니다. 현재 Marketplace 봇 동작은 [기능](#capabilities) 및 [액세스 제어(그룹)](#access-control-groups)을 참고하세요.
- `channels.zalo.groupAllowFrom`: 그룹 발신자 허용 목록(사용자 ID). 설정되지 않으면 `allowFrom`으로 대체됩니다.
- `channels.zalo.mediaMaxMb`: 인바운드/아웃바운드 미디어 제한(MB, 기본값 5).
- `channels.zalo.webhookUrl`: Webhook 모드 활성화(HTTPS 필요).
- `channels.zalo.webhookSecret`: Webhook secret(8~256자).
- `channels.zalo.webhookPath`: Gateway HTTP 서버의 Webhook 경로.
- `channels.zalo.proxy`: API 요청용 프록시 URL.

멀티 계정 옵션:

- `channels.zalo.accounts.<id>.botToken`: 계정별 토큰.
- `channels.zalo.accounts.<id>.tokenFile`: 계정별 일반 토큰 파일. 심볼릭 링크는 거부됩니다.
- `channels.zalo.accounts.<id>.name`: 표시 이름.
- `channels.zalo.accounts.<id>.enabled`: 계정 활성화/비활성화.
- `channels.zalo.accounts.<id>.dmPolicy`: 계정별 DM 정책.
- `channels.zalo.accounts.<id>.allowFrom`: 계정별 허용 목록.
- `channels.zalo.accounts.<id>.groupPolicy`: 계정별 그룹 정책. config에는 존재합니다. 현재 Marketplace 봇 동작은 [기능](#capabilities) 및 [액세스 제어(그룹)](#access-control-groups)을 참고하세요.
- `channels.zalo.accounts.<id>.groupAllowFrom`: 계정별 그룹 발신자 허용 목록.
- `channels.zalo.accounts.<id>.webhookUrl`: 계정별 Webhook URL.
- `channels.zalo.accounts.<id>.webhookSecret`: 계정별 Webhook secret.
- `channels.zalo.accounts.<id>.webhookPath`: 계정별 Webhook 경로.
- `channels.zalo.accounts.<id>.proxy`: 계정별 프록시 URL.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
