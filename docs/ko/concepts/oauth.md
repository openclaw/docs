---
read_when:
    - OpenClaw OAuth의 전체 흐름을 이해하려고 합니다
    - 토큰 무효화/로그아웃 문제가 발생합니다
    - Claude CLI 또는 OAuth 인증 흐름을 사용하려는 경우
    - 여러 계정 또는 프로필 라우팅이 필요합니다
summary: 'OpenClaw의 OAuth: 토큰 교환, 저장 및 다중 계정 패턴'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T15:11:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw은 이를 제공하는 공급자에 대해 OAuth("구독 인증")를 지원하며,
대표적으로 **OpenAI Codex(ChatGPT OAuth)** 및 **Anthropic Claude CLI 재사용**이 있습니다.
Anthropic의 경우 실질적으로 다음과 같이 구분됩니다.

- **Anthropic API 키**: 일반적인 Anthropic API 요금이 청구됩니다.
- **OpenClaw 내부의 Anthropic Claude CLI / 구독 인증**: Anthropic 직원이
  이러한 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새로운 정책을
  게시하지 않는 한 OpenClaw은 이 통합에서 Claude CLI 재사용 및
  `claude -p` 사용을 승인된 방식으로 취급합니다. 프로덕션 환경의 Anthropic에는
  여전히 API 키 인증이 더 안전한 권장 경로입니다.

OpenClaw은 OpenAI API 키 인증과 ChatGPT/Codex OAuth를 모두
정식 공급자 ID `openai` 아래에 저장합니다. 이전 `openai-codex:*` 프로필 ID와
`auth.order.openai-codex` 항목은 `openclaw doctor --fix`로 복구되는
레거시 상태입니다. 새 구성에는 `openai:*` 프로필 ID와 `auth.order.openai`를
사용하십시오.

이 페이지에서는 다음 내용을 다룹니다.

- OAuth **토큰 교환** 작동 방식(PKCE)
- 토큰이 **저장되는** 위치와 그 이유
- **여러 계정** 처리 방법(프로필 + 세션별 재정의)

자체 OAuth 또는 API 키 흐름을 제공하는 공급자 Plugin도 동일한
진입점을 통해 실행됩니다.

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(존재 이유)

OAuth 공급자는 로그인하거나 갱신할 때마다 새 갱신 토큰을 발급하는 경우가 많습니다.
일부 공급자는 같은 사용자/앱에 대해 새 갱신 토큰이 발급되면
이전 갱신 토큰을 무효화합니다. 실제로 나타나는 증상은 다음과 같습니다. OpenClaw을
통해서도 로그인하고 Claude Code / Codex CLI를 통해서도 로그인하면, 나중에
그중 하나에서 무작위로 로그아웃됩니다.

이를 줄이기 위해 OpenClaw은 인증 프로필 저장소를 **토큰 싱크**로 취급합니다.

- 런타임은 에이전트별로 한 곳에서 자격 증명을 읽습니다.
- 여러 프로필이 공존할 수 있으며 결정론적으로 라우팅됩니다.
- 외부 CLI 재사용은 공급자별로 다릅니다. OpenClaw이 공급자의 로컬 OAuth
  프로필을 소유하게 되면 로컬 갱신 토큰이 정식 토큰입니다. 해당 로컬
  갱신 토큰이 거부되면 OpenClaw은 외부 CLI 토큰 자료로 대체하지 않고
  재인증할 프로필을 보고합니다.
  Codex CLI 부트스트랩의 범위는 더 좁습니다. OpenClaw이 해당 공급자의
  OAuth를 소유하기 전에 비어 있는 `openai:default` 형식의 프로필만
  초기화할 수 있습니다. 그 이후에는 OpenClaw이 소유한 갱신이 계속
  정식 상태로 유지됩니다.
- 상태/시작 경로는 외부 CLI 검색 범위를 이미 구성된 공급자 집합으로
  제한하므로, 단일 공급자 설정에서는 관련 없는 CLI 로그인 저장소를
  탐색하지 않습니다.

## 저장소(토큰이 저장되는 위치)

비밀 정보는 논리적 이름 `auth-profiles.json`을 키로 사용하여 에이전트별로
저장됩니다. 기본 저장소는 에이전트의 SQLite 데이터베이스이며, JSON 이름은
호환성과 도구 표시를 위해 유지됩니다.

- 인증 프로필(OAuth + API 키 + 선택적 값 수준 참조):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환성 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (정적 `api_key` 항목은 발견 시 제거됩니다.)

레거시 가져오기 전용 파일(계속 지원되지만 기본 저장소는 아님):

- `~/.openclaw/credentials/oauth.json` (처음 사용할 때 인증 프로필 저장소로 가져옵니다.)

위 항목은 모두 `$OPENCLAW_STATE_DIR`(상태 디렉터리 재정의)도 따릅니다. 전체 참조: [/gateway/configuration-reference#auth-storage](/ko/gateway/configuration-reference#auth-storage)

정적 비밀 정보 참조 및 런타임 스냅샷 활성화 동작은 [비밀 정보 관리](/ko/gateway/secrets)를 참조하십시오.

보조 에이전트에 로컬 인증 프로필이 없으면 OpenClaw은 기본/메인 에이전트
저장소에서 읽기 연계 상속을 사용하며, 읽을 때 메인 에이전트의 저장소를
복제하지 않습니다. OAuth 갱신 토큰은 특히 민감합니다. 일부 공급자는 사용 후
갱신 토큰을 교체하거나 무효화하므로 일반 복사 흐름에서는 기본적으로 이를
건너뜁니다. 에이전트에 독립적인 계정이 필요한 경우 해당 에이전트에 별도의
OAuth 로그인을 구성하십시오.

## Anthropic Claude CLI 재사용

OpenClaw은 Anthropic Claude CLI 재사용과 `claude -p`를 승인된 인증 경로로
지원합니다. 호스트에 로컬 Claude 로그인이 이미 있으면 온보딩/구성에서 이를
직접 재사용할 수 있습니다. Anthropic 설정 토큰도 지원되는 토큰 인증 경로로
계속 사용할 수 있지만, OpenClaw은 Claude CLI 재사용이 가능할 때 이를
우선합니다.

<Warning>
Anthropic의 공개 Claude Code 문서에 따르면 Claude Code를 직접 사용하는 경우
Claude 구독 한도 내에서 작동하며, Anthropic 직원은 OpenClaw 방식의 Claude
CLI 사용이 다시 허용된다고 알려왔습니다. 따라서 Anthropic이 새로운 정책을
게시하지 않는 한 OpenClaw은 이 통합에서 Claude CLI 재사용과
`claude -p` 사용을 승인된 방식으로 취급합니다.

Anthropic의 현재 Claude Code 직접 사용 플랜 문서는 [Pro 또는 Max
플랜에서 Claude Code
사용하기](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
및 [Team 또는 Enterprise
플랜에서 Claude Code
사용하기](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)를 참조하십시오.

OpenClaw에서 다른 구독 방식 옵션을 사용하려면 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding
플랜](/ko/providers/qwen), [MiniMax Coding 플랜](/ko/providers/minimax),
및 [Z.AI / GLM Coding 플랜](/ko/providers/zai)을 참조하십시오.
</Warning>

## OAuth 교환(로그인 작동 방식)

OpenClaw의 대화형 로그인 흐름은 `openclaw/plugin-sdk/llm.ts`에 구현되어 있으며 마법사/명령에 연결됩니다.

### Anthropic 설정 토큰

흐름 형태:

1. OpenClaw에서 Anthropic 설정 토큰 또는 토큰 붙여넣기를 시작합니다.
2. OpenClaw이 결과 Anthropic 자격 증명을 인증 프로필에 저장합니다.
3. 모델 선택은 `anthropic/...`으로 유지됩니다.
4. 기존 Anthropic 인증 프로필은 롤백/순서 제어에 계속 사용할 수 있습니다.

### OpenAI Codex(ChatGPT OAuth)

OpenAI Codex OAuth는 OpenClaw 워크플로를 포함하여 Codex CLI 외부에서 사용하는 것이 명시적으로 지원됩니다.

로그인 명령은 정식 OpenAI 공급자 ID를 사용합니다.

```bash
openclaw models auth login --provider openai
```

하나의 에이전트에서 여러 ChatGPT/Codex OAuth 계정을 사용하려면
`--profile-id openai:<name>`을 사용하십시오. 새 프로필에
`openai-codex:<name>`을 사용하지 마십시오. Doctor는 해당 이전 접두사를
충돌이 없는 `openai:*` 프로필 ID로 마이그레이션합니다. 프로필 ID를
`auth.order` 또는 `/model ...@<profileId>`에 복사하기 전에 복구 후
`openclaw models auth list --provider openai`를 실행하십시오.

흐름 형태(PKCE):

1. PKCE 검증자/챌린지와 무작위 `state`를 생성합니다.
2. `https://auth.openai.com/oauth/authorize?...`를 엽니다(범위:
   `openid profile email offline_access`).
3. `http://localhost:1455/auth/callback`에서 콜백 캡처를 시도합니다(콜백
   호스트의 기본값은 `localhost`이며 루프백 호스트만 허용합니다.
   `OPENCLAW_OAUTH_CALLBACK_HOST`로 재정의할 수 있습니다).
4. 콜백이 도착하기 전에 코드를 붙여넣을 수 있거나 원격/헤드리스 환경이라
   콜백을 바인딩할 수 없는 경우, 대신 리디렉션 URL/코드를 붙여넣습니다.
   수동 붙여넣기는 브라우저 콜백과 경쟁하며 먼저 완료되는 쪽이 적용됩니다.
5. `https://auth.openai.com/oauth/token`에서 코드를 교환합니다.
6. 액세스 토큰에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }`를 저장합니다.

마법사 경로는 `openclaw onboard` → 인증 선택 `openai`입니다.

## 갱신 + 만료

프로필은 `expires` 타임스탬프를 저장합니다. 런타임에서는 다음과 같이 처리합니다.

- `expires`가 미래이면 저장된 액세스 토큰을 사용합니다.
- 만료되었으면 파일 잠금 상태에서 갱신하고 저장된 자격 증명을 덮어씁니다.
- 보조 에이전트가 상속된 메인 에이전트 OAuth 프로필을 읽는 경우,
  갱신 토큰을 보조 에이전트 저장소에 복사하는 대신 메인 에이전트
  저장소에 갱신 내용을 다시 기록합니다.
- 외부에서 관리되는 CLI 자격 증명(Claude CLI, 제한적인 Codex CLI 부트스트랩.
  [토큰 싱크](#the-token-sink-why-it-exists) 참조)은 복사된 갱신 토큰을
  사용하는 대신 다시 읽습니다. 관리되는 갱신이 실패하면 OpenClaw은
  외부 CLI 토큰 자료를 반환하는 대신 영향을 받은 프로필을 재인증 대상으로
  보고합니다.

갱신 흐름은 자동으로 수행되므로 일반적으로 토큰을 수동으로 관리할 필요가 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴이 있습니다.

### 1) 권장: 별도의 에이전트

"개인"과 "업무"가 절대 상호작용하지 않도록 하려면 격리된 에이전트(별도의 세션 + 자격 증명 + 작업 공간)를 사용하십시오.

```bash
openclaw agents add work
openclaw agents add personal
```

그런 다음 에이전트별로 인증을 구성하고(마법사) 채팅을 적절한 에이전트로 라우팅하십시오.

### 2) 고급: 하나의 에이전트에서 여러 프로필 사용

인증 프로필 저장소는 동일한 공급자에 대해 여러 프로필 ID를 지원합니다.
사용할 프로필을 다음과 같이 선택할 수 있습니다.

- 구성을 통한 전역 순서 지정(`auth.order`)
- `/model ...@<profileId>`를 통한 세션별 지정

예시(세션 재정의):

- `/model Opus@anthropic:work`

기존 프로필 ID는 다음 명령으로 나열합니다.

```bash
openclaw models auth list --provider <id>
```

관련 문서:

- [모델 장애 조치](/ko/concepts/model-failover) (순환 + 대기 시간 규칙)
- [슬래시 명령](/ko/tools/slash-commands) (명령 인터페이스)

## 관련 항목

- [인증](/ko/gateway/authentication) - 모델 공급자 인증 개요
- [비밀 정보](/ko/gateway/secrets) - 자격 증명 저장소 및 SecretRef
- [구성 참조](/ko/gateway/configuration-reference#auth-storage) - 인증 구성 키
