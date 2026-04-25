---
read_when:
    - OpenClaw OAuth를 엔드투엔드로 이해하려는 경우
    - 토큰 무효화 / 로그아웃 문제를 겪고 있는 경우
    - Claude CLI 또는 OAuth 인증 흐름이 필요한 경우
    - 여러 계정 또는 프로필 라우팅이 필요한 경우
summary: 'OpenClaw의 OAuth: 토큰 교환, 저장소 및 멀티 계정 패턴'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T05:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw는 이를 제공하는 provider에 대해 OAuth를 통한 “subscription auth”를 지원합니다
(특히 **OpenAI Codex (ChatGPT OAuth)**). Anthropic의 경우 현재 실질적인 구분은 다음과 같습니다:

- **Anthropic API key**: 일반 Anthropic API 과금
- **OpenClaw 내부의 Anthropic Claude CLI / subscription auth**: Anthropic 직원이
  이 사용 방식이 다시 허용된다고 알려주었습니다

OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서 사용하도록 명시적으로 지원됩니다. 이 페이지에서는 다음을 설명합니다:

프로덕션에서 Anthropic은 API key 인증이 더 안전한 권장 경로입니다.

- OAuth **토큰 교환**이 어떻게 작동하는지(PKCE)
- 토큰이 어디에 **저장**되는지(그리고 그 이유)
- **여러 계정**을 어떻게 처리하는지(프로필 + 세션별 재정의)

OpenClaw는 자체 OAuth 또는 API‑key
흐름을 포함하는 **provider Plugin**도 지원합니다. 다음으로 실행하세요:

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(존재 이유)

OAuth provider는 로그인/리프레시 흐름 중에 종종 **새 refresh token**을 발급합니다. 일부 provider(또는 OAuth 클라이언트)는 같은 사용자/앱에 대해 새 refresh token이 발급되면 이전 refresh token을 무효화할 수 있습니다.

실제 증상:

- OpenClaw로 로그인하고 _동시에_ Claude Code / Codex CLI로도 로그인함 → 나중에 둘 중 하나가 무작위로 “로그아웃됨”

이 문제를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **토큰 싱크**로 취급합니다:

- 런타임은 **한 곳**에서 credential을 읽습니다
- 여러 프로필을 유지하고 이를 결정적으로 라우팅할 수 있습니다
- 외부 CLI 재사용은 provider별로 다릅니다: Codex CLI는 비어 있는
  `openai-codex:default` 프로필을 부트스트랩할 수 있지만, 일단 OpenClaw에 로컬 OAuth 프로필이 생기면
  로컬 refresh token이 표준이 됩니다. 다른 통합은 외부에서 계속 관리되고
  해당 CLI auth 저장소를 다시 읽을 수 있습니다

## 저장소(토큰이 저장되는 위치)

비밀 정보는 **에이전트별**로 저장됩니다:

- 인증 프로필(OAuth + API keys + 선택적 값 수준 ref): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (발견된 정적 `api_key` 항목은 제거됨)

레거시 가져오기 전용 파일(여전히 지원되지만 주 저장소는 아님):

- `~/.openclaw/credentials/oauth.json` (처음 사용할 때 `auth-profiles.json`으로 가져옴)

위 모든 항목은 `$OPENCLAW_STATE_DIR`(state dir 재정의)도 따릅니다. 전체 참조: [/gateway/configuration](/ko/gateway/configuration-reference#auth-storage)

정적 secret ref 및 런타임 스냅샷 활성화 동작은 [Secrets Management](/ko/gateway/secrets)를 참조하세요.

## Anthropic 레거시 토큰 호환성

<Warning>
Anthropic의 공개 Claude Code 문서에서는 직접 Claude Code를 사용하는 경우
Claude subscription 한도 내에 머문다고 설명하며, Anthropic 직원은 OpenClaw 스타일의 Claude
CLI 사용이 다시 허용된다고 알려주었습니다. 따라서 OpenClaw는 Anthropic이
새 정책을 게시하지 않는 한 이 통합에 대해 Claude CLI 재사용과
`claude -p` 사용을 허용된 것으로 취급합니다.

Anthropic의 현재 직접 Claude Code 요금제 문서는 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
및 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)을
참조하세요.

OpenClaw에서 다른 subscription 스타일 옵션을 원한다면 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding
Plan](/ko/providers/qwen), [MiniMax Coding Plan](/ko/providers/minimax),
및 [Z.AI / GLM Coding Plan](/ko/providers/glm)을 참조하세요.
</Warning>

OpenClaw는 Anthropic setup-token도 지원되는 token-auth 경로로 제공하지만, 현재는 가능할 때 Claude CLI 재사용과 `claude -p`를 우선합니다.

## Anthropic Claude CLI 마이그레이션

OpenClaw는 Anthropic Claude CLI 재사용을 다시 지원합니다. 호스트에 이미 로컬
Claude 로그인이 있다면 onboarding/configure가 이를 직접 재사용할 수 있습니다.

## OAuth 교환(로그인 동작 방식)

OpenClaw의 대화형 로그인 흐름은 `@mariozechner/pi-ai`에 구현되어 있으며 wizard/명령어에 연결되어 있습니다.

### Anthropic setup-token

흐름 형태:

1. OpenClaw에서 Anthropic setup-token 또는 paste-token 시작
2. OpenClaw가 결과 Anthropic credential을 auth profile에 저장
3. 모델 선택은 `anthropic/...`에 유지
4. 기존 Anthropic auth profile은 롤백/순서 제어용으로 계속 사용 가능

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth는 Codex CLI 외부에서의 사용을 명시적으로 지원하며, OpenClaw 워크플로도 여기에 포함됩니다.

흐름 형태(PKCE):

1. PKCE verifier/challenge + 무작위 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 callback 캡처 시도
4. callback을 바인딩할 수 없거나 원격/헤드리스 환경이면 redirect URL/code를 붙여 넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. access token에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }` 저장

wizard 경로는 `openclaw onboard` → auth choice `openai-codex`입니다.

## 리프레시 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임에서는:

- `expires`가 미래 시점이면 → 저장된 access token 사용
- 만료되었으면 → 새로고침(file lock 하에서)하고 저장된 credential 덮어쓰기
- 예외: 일부 외부 CLI credential은 계속 외부에서 관리됩니다. OpenClaw는
  복사된 refresh token을 사용하는 대신 해당 CLI auth 저장소를 다시 읽습니다.
  Codex CLI 부트스트랩은 의도적으로 더 제한적입니다: 비어 있는
  `openai-codex:default` 프로필을 시드한 뒤, OpenClaw가 소유한 리프레시가 로컬
  프로필을 표준으로 유지합니다.

리프레시 흐름은 자동이므로 일반적으로 토큰을 수동으로 관리할 필요가 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴이 있습니다:

### 1) 권장: 별도 에이전트

“personal”과 “work”가 절대 상호작용하지 않게 하려면 격리된 에이전트(별도 세션 + credential + workspace)를 사용하세요:

```bash
openclaw agents add work
openclaw agents add personal
```

그다음 에이전트별로 auth를 구성하고(wizard), 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 하나의 에이전트에서 여러 프로필

`auth-profiles.json`은 같은 provider에 대해 여러 profile ID를 지원합니다.

어떤 프로필을 사용할지는 다음으로 선택합니다:

- config 순서를 통한 전역 설정(`auth.order`)
- `/model ...@<profileId>`를 통한 세션별 설정

예시(세션 재정의):

- `/model Opus@anthropic:work`

어떤 profile ID가 있는지 확인하는 방법:

- `openclaw channels list --json` (`auth[]` 표시)

관련 문서:

- [모델 failover](/ko/concepts/model-failover) (rotation + cooldown 규칙)
- [슬래시 명령어](/ko/tools/slash-commands) (명령 인터페이스)

## 관련 항목

- [Authentication](/ko/gateway/authentication) — 모델 provider 인증 개요
- [Secrets](/ko/gateway/secrets) — credential 저장소 및 SecretRef
- [Configuration Reference](/ko/gateway/configuration-reference#auth-storage) — auth config 키
