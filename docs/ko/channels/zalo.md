---
read_when:
    - Zalo 기능 또는 Webhook 작업하기
summary: Zalo 봇 지원 상태, 기능 및 구성
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

상태: 실험적입니다. DM이 지원됩니다. 아래 [기능](#capabilities) 섹션은 현재 Marketplace 봇 동작을 반영합니다.

## 번들 Plugin

Zalo는 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로, 일반 패키지
빌드에는 별도 설치가 필요하지 않습니다.

이전 빌드를 사용 중이거나 Zalo를 제외한 사용자 지정 설치를 사용하는 경우,
npm 패키지를 직접 설치하세요.

- CLI로 설치: `openclaw plugins install @openclaw/zalo`
- 고정 버전: `openclaw plugins install @openclaw/zalo@2026.5.2`
- 또는 소스 체크아웃에서 설치: `openclaw plugins install ./path/to/local/zalo-plugin`
- 세부 정보: [Plugins](/ko/tools/plugin)

## 빠른 설정(초보자)

1. Zalo Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. 토큰을 설정합니다.
   - Env: `ZALO_BOT_TOKEN=...`
   - 또는 config: `channels.zalo.accounts.default.botToken: "..."`.
3. Gateway를 다시 시작합니다(또는 설정을 완료합니다).
4. DM 액세스는 기본적으로 페어링 방식입니다. 첫 연락 시 페어링 코드를 승인하세요.

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

Zalo는 베트남 중심의 메시징 앱이며, Bot API를 통해 Gateway가 1:1 대화용 봇을 실행할 수 있습니다.
Zalo로 다시 결정적으로 라우팅해야 하는 지원 또는 알림 용도에 적합합니다.

이 페이지는 **Zalo Bot Creator / Marketplace 봇**에 대한 현재 OpenClaw 동작을 반영합니다.
**Zalo Official Account (OA) 봇**은 다른 Zalo 제품 표면이며 다르게 동작할 수 있습니다.

- Gateway가 소유하는 Zalo Bot API 채널입니다.
- 결정적 라우팅: 응답은 Zalo로 다시 전달되며, 모델은 채널을 선택하지 않습니다.
- DM은 에이전트의 기본 세션을 공유합니다.
- 아래 [기능](#capabilities) 섹션은 현재 Marketplace 봇 지원 상태를 보여 줍니다.

## 설정(빠른 경로)

### 1) 봇 토큰 생성(Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com)으로 이동해 로그인합니다.
2. 새 봇을 만들고 설정을 구성합니다.
3. 전체 봇 토큰(일반적으로 `numeric_id:secret`)을 복사합니다. Marketplace 봇의 경우, 생성 후 봇의 환영 메시지에 사용 가능한 런타임 토큰이 표시될 수 있습니다.

### 2) 토큰 구성(env 또는 config)

예:

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

나중에 그룹을 사용할 수 있는 Zalo 봇 표면으로 이동하는 경우, `groupPolicy` 및 `groupAllowFrom` 같은 그룹별 config를 명시적으로 추가할 수 있습니다. 현재 Marketplace 봇 동작은 [기능](#capabilities)을 참조하세요.

Env 옵션: `ZALO_BOT_TOKEN=...`(기본 계정에만 작동).

다중 계정 지원: 계정별 토큰과 선택적 `name`과 함께 `channels.zalo.accounts`를 사용하세요.

3. Gateway를 다시 시작합니다. 토큰이 확인되면(env 또는 config) Zalo가 시작됩니다.
4. DM 액세스는 기본적으로 페어링입니다. 봇이 처음 연락을 받을 때 코드를 승인하세요.

## 작동 방식(동작)

- 인바운드 메시지는 미디어 자리 표시자와 함께 공유 채널 엔벨로프로 정규화됩니다.
- 응답은 항상 동일한 Zalo 채팅으로 다시 라우팅됩니다.
- 기본값은 long-polling이며, Webhook 모드는 `channels.zalo.webhookUrl`로 사용할 수 있습니다.

## 제한

- 아웃바운드 텍스트는 2000자 단위로 분할됩니다(Zalo API 제한).
- 미디어 다운로드/업로드는 `channels.zalo.mediaMaxMb`로 제한됩니다(기본값 5).
- 2000자 제한 때문에 스트리밍의 유용성이 낮아 기본적으로 차단됩니다.

## 액세스 제어(DM)

### DM 액세스

- 기본값: `channels.zalo.dmPolicy = "pairing"`. 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지는 무시됩니다(코드는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 페어링은 기본 토큰 교환 방식입니다. 세부 정보: [Pairing](/ko/channels/pairing)
- `channels.zalo.allowFrom`은 숫자 사용자 ID를 허용합니다(사용자 이름 조회는 사용할 수 없음).

## 액세스 제어(그룹)

**Zalo Bot Creator / Marketplace 봇**의 경우, 봇을 그룹에 전혀 추가할 수 없어서 실제로 그룹 지원을 사용할 수 없었습니다.

즉, 아래 그룹 관련 config 키는 스키마에 존재하지만 Marketplace 봇에서는 사용할 수 없었습니다.

- `channels.zalo.groupPolicy`는 그룹 인바운드 처리를 제어합니다: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom`은 그룹에서 봇을 트리거할 수 있는 발신자 ID를 제한합니다.
- `groupAllowFrom`이 설정되지 않은 경우, Zalo는 발신자 검사에 `allowFrom`을 대체 사용합니다.
- 런타임 참고: `channels.zalo`가 완전히 없으면 런타임은 안전을 위해 여전히 `groupPolicy="allowlist"`로 대체됩니다.

그룹 정책 값(봇 표면에서 그룹 액세스를 사용할 수 있는 경우)은 다음과 같습니다.

- `groupPolicy: "disabled"` — 모든 그룹 메시지를 차단합니다.
- `groupPolicy: "open"` — 모든 그룹 멤버를 허용합니다(멘션 게이트 적용).
- `groupPolicy: "allowlist"` — 실패 시 닫힘 기본값이며, 허용된 발신자만 수락됩니다.

다른 Zalo 봇 제품 표면을 사용 중이고 작동하는 그룹 동작을 검증한 경우, Marketplace 봇 흐름과 일치한다고 가정하지 말고 별도로 문서화하세요.

## Long-polling 대 Webhook

- 기본값: long-polling(공개 URL 필요 없음).
- Webhook 모드: `channels.zalo.webhookUrl` 및 `channels.zalo.webhookSecret`을 설정합니다.
  - Webhook secret은 8~256자여야 합니다.
  - Webhook URL은 HTTPS를 사용해야 합니다.
  - Zalo는 검증을 위해 `X-Bot-Api-Secret-Token` 헤더와 함께 이벤트를 전송합니다.
  - Gateway HTTP는 `channels.zalo.webhookPath`에서 Webhook 요청을 처리합니다(기본값은 Webhook URL 경로).
  - 요청은 `Content-Type: application/json`(또는 `+json` 미디어 유형)을 사용해야 합니다.
  - 중복 이벤트(`event_name + message_id`)는 짧은 재생 방지 기간 동안 무시됩니다.
  - 버스트 트래픽은 경로/소스별로 속도 제한되며 HTTP 429를 반환할 수 있습니다.

**참고:** Zalo API 문서에 따르면 getUpdates(폴링)와 Webhook은 서로 배타적입니다.

## 지원되는 메시지 유형

빠른 지원 현황은 [기능](#capabilities)을 참조하세요. 아래 참고 사항은 동작에 추가 맥락이 필요한 부분을 보충합니다.

- **텍스트 메시지**: 2000자 분할과 함께 완전 지원됩니다.
- **텍스트의 일반 URL**: 일반 텍스트 입력처럼 동작합니다.
- **링크 미리보기 / 리치 링크 카드**: [기능](#capabilities)의 Marketplace 봇 상태를 참조하세요. 안정적으로 응답을 트리거하지 않았습니다.
- **이미지 메시지**: [기능](#capabilities)의 Marketplace 봇 상태를 참조하세요. 인바운드 이미지 처리는 신뢰할 수 없었습니다(최종 응답 없이 입력 표시기만 표시).
- **스티커**: [기능](#capabilities)의 Marketplace 봇 상태를 참조하세요.
- **음성 메모 / 오디오 파일 / 비디오 / 일반 파일 첨부**: [기능](#capabilities)의 Marketplace 봇 상태를 참조하세요.
- **지원되지 않는 유형**: 로그에 기록됩니다(예: 보호된 사용자의 메시지).

## 기능

이 표는 OpenClaw의 현재 **Zalo Bot Creator / Marketplace 봇** 동작을 요약합니다.

| 기능                        | 상태                                    |
| --------------------------- | --------------------------------------- |
| 다이렉트 메시지             | ✅ 지원됨                               |
| 그룹                        | ❌ Marketplace 봇에서 사용할 수 없음    |
| 미디어(인바운드 이미지)     | ⚠️ 제한적 / 사용자 환경에서 검증 필요   |
| 미디어(아웃바운드 이미지)   | ⚠️ Marketplace 봇에서 재테스트되지 않음 |
| 텍스트의 일반 URL           | ✅ 지원됨                               |
| 링크 미리보기               | ⚠️ Marketplace 봇에서 신뢰할 수 없음    |
| 반응                        | ❌ 지원되지 않음                        |
| 스티커                      | ⚠️ Marketplace 봇에서 에이전트 응답 없음 |
| 음성 메모 / 오디오 / 비디오 | ⚠️ Marketplace 봇에서 에이전트 응답 없음 |
| 파일 첨부                   | ⚠️ Marketplace 봇에서 에이전트 응답 없음 |
| 스레드                      | ❌ 지원되지 않음                        |
| 투표                        | ❌ 지원되지 않음                        |
| 네이티브 명령               | ❌ 지원되지 않음                        |
| 스트리밍                    | ⚠️ 차단됨(2000자 제한)                  |

## 전달 대상(CLI/cron)

- 채팅 ID를 대상으로 사용하세요.
- 예: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## 문제 해결

**봇이 응답하지 않음:**

- 토큰이 유효한지 확인: `openclaw channels status --probe`
- 발신자가 승인되었는지 확인(페어링 또는 allowFrom)
- Gateway 로그 확인: `openclaw logs --follow`

**Webhook이 이벤트를 받지 못함:**

- Webhook URL이 HTTPS를 사용하는지 확인
- secret 토큰이 8~256자인지 확인
- Gateway HTTP 엔드포인트가 구성된 경로에서 접근 가능한지 확인
- getUpdates 폴링이 실행 중이 아닌지 확인(둘은 서로 배타적)

## 구성 참조(Zalo)

전체 구성: [Configuration](/ko/gateway/configuration)

평면 최상위 키(`channels.zalo.botToken`, `channels.zalo.dmPolicy` 등)는 레거시 단일 계정 축약형입니다. 새 config에는 `channels.zalo.accounts.<id>.*`를 권장합니다. 두 형식 모두 스키마에 존재하므로 여기에서 계속 문서화합니다.

Provider 옵션:

- `channels.zalo.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.zalo.botToken`: Zalo Bot Platform의 봇 토큰입니다.
- `channels.zalo.tokenFile`: 일반 파일 경로에서 토큰을 읽습니다. 심볼릭 링크는 거부됩니다.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing).
- `channels.zalo.allowFrom`: DM 허용 목록(사용자 ID). `open`에는 `"*"`가 필요합니다. 마법사는 숫자 ID를 요청합니다.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`(기본값: allowlist). config에 존재합니다. 현재 Marketplace 봇 동작은 [기능](#capabilities) 및 [액세스 제어(그룹)](#access-control-groups)를 참조하세요.
- `channels.zalo.groupAllowFrom`: 그룹 발신자 허용 목록(사용자 ID). 설정되지 않은 경우 `allowFrom`으로 대체됩니다.
- `channels.zalo.mediaMaxMb`: 인바운드/아웃바운드 미디어 제한(MB, 기본값 5).
- `channels.zalo.webhookUrl`: Webhook 모드를 활성화합니다(HTTPS 필요).
- `channels.zalo.webhookSecret`: Webhook secret(8~256자).
- `channels.zalo.webhookPath`: Gateway HTTP 서버의 Webhook 경로입니다.
- `channels.zalo.proxy`: API 요청용 프록시 URL입니다.

다중 계정 옵션:

- `channels.zalo.accounts.<id>.botToken`: 계정별 토큰입니다.
- `channels.zalo.accounts.<id>.tokenFile`: 계정별 일반 토큰 파일입니다. 심볼릭 링크는 거부됩니다.
- `channels.zalo.accounts.<id>.name`: 표시 이름입니다.
- `channels.zalo.accounts.<id>.enabled`: 계정을 활성화/비활성화합니다.
- `channels.zalo.accounts.<id>.dmPolicy`: 계정별 DM 정책입니다.
- `channels.zalo.accounts.<id>.allowFrom`: 계정별 허용 목록입니다.
- `channels.zalo.accounts.<id>.groupPolicy`: 계정별 그룹 정책입니다. config에 존재합니다. 현재 Marketplace 봇 동작은 [기능](#capabilities) 및 [액세스 제어(그룹)](#access-control-groups)를 참조하세요.
- `channels.zalo.accounts.<id>.groupAllowFrom`: 계정별 그룹 발신자 허용 목록입니다.
- `channels.zalo.accounts.<id>.webhookUrl`: 계정별 Webhook URL입니다.
- `channels.zalo.accounts.<id>.webhookSecret`: 계정별 Webhook secret입니다.
- `channels.zalo.accounts.<id>.webhookPath`: 계정별 Webhook 경로입니다.
- `channels.zalo.accounts.<id>.proxy`: 계정별 프록시 URL입니다.

## 관련 항목

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [Security](/ko/gateway/security) — 액세스 모델 및 강화
