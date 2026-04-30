---
read_when:
    - OpenClaw OAuth를 처음부터 끝까지 이해하려는 경우
    - 토큰 무효화 / 로그아웃 문제가 발생하는 경우
    - Claude CLI 또는 OAuth 인증 흐름을 원하는 경우
    - 여러 계정 또는 프로필 라우팅이 필요한 경우
summary: 'OpenClaw의 OAuth: 토큰 교환, 저장 및 다중 계정 패턴'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T06:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw은 OAuth를 제공하는 제공자에 대해 OAuth를 통한 “구독 인증”을 지원합니다
(특히 **OpenAI Codex (ChatGPT OAuth)**). Anthropic의 실제 구분은
이제 다음과 같습니다.

- **Anthropic API 키**: 일반 Anthropic API 과금
- **OpenClaw 내부의 Anthropic Claude CLI / 구독 인증**: Anthropic 직원이
  이 사용이 다시 허용된다고 알려주었습니다

OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서의 사용이 명시적으로 지원됩니다. 이 페이지에서는 다음을 설명합니다.

프로덕션에서 Anthropic을 사용할 때는 API 키 인증이 더 안전한 권장 경로입니다.

- OAuth **토큰 교환**이 작동하는 방식(PKCE)
- 토큰이 **저장되는** 위치와 그 이유
- **여러 계정** 처리 방법(프로필 + 세션별 재정의)

OpenClaw은 자체 OAuth 또는 API 키 흐름을 제공하는 **제공자 Plugin**도 지원합니다.
다음으로 실행하세요.

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(존재하는 이유)

OAuth 제공자는 로그인/갱신 흐름 중 **새 refresh token**을 발급하는 경우가 많습니다. 일부 제공자(또는 OAuth 클라이언트)는 같은 사용자/앱에 대해 새 refresh token이 발급되면 이전 refresh token을 무효화할 수 있습니다.

실제 증상:

- OpenClaw _및_ Claude Code / Codex CLI로 로그인하면 → 나중에 그중 하나가 무작위로 “로그아웃”됩니다

이를 줄이기 위해 OpenClaw은 `auth-profiles.json`을 **토큰 싱크**로 취급합니다.

- 런타임은 **한 곳**에서 자격 증명을 읽습니다
- 여러 프로필을 유지하고 결정론적으로 라우팅할 수 있습니다
- 외부 CLI 재사용은 제공자별로 다릅니다. Codex CLI는 빈
  `openai-codex:default` 프로필을 부트스트랩할 수 있지만, OpenClaw에 로컬 OAuth 프로필이 생기면
  로컬 refresh token이 표준이 됩니다. 다른 통합은 계속
  외부에서 관리되며 자체 CLI 인증 저장소를 다시 읽을 수 있습니다
- 구성된 제공자 집합을 이미 아는 상태 및 시작 경로는
  외부 CLI 탐색 범위를 해당 집합으로 제한하므로, 단일 제공자 설정에서 관련 없는 CLI 로그인 저장소를
  탐색하지 않습니다

## 저장소(토큰이 있는 위치)

비밀 값은 에이전트 인증 저장소에 저장됩니다.

- 인증 프로필(OAuth + API 키 + 선택적 값 수준 참조): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환성 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (정적 `api_key` 항목은 발견되면 제거됩니다)

레거시 가져오기 전용 파일(여전히 지원되지만 주 저장소는 아님):

- `~/.openclaw/credentials/oauth.json`(처음 사용할 때 `auth-profiles.json`으로 가져옴)

위 항목은 모두 `$OPENCLAW_STATE_DIR`(상태 디렉터리 재정의)도 따릅니다. 전체 참조: [/gateway/configuration](/ko/gateway/configuration-reference#auth-storage)

정적 비밀 값 참조와 런타임 스냅샷 활성화 동작은 [비밀 값 관리](/ko/gateway/secrets)를 참고하세요.

보조 에이전트에 로컬 인증 프로필이 없으면 OpenClaw은 기본/메인 에이전트 저장소에서
read-through 상속을 사용합니다. 읽을 때 메인
에이전트의 `auth-profiles.json`을 복제하지 않습니다. OAuth refresh token은 특히
민감합니다. 일부 제공자는 사용 후 refresh token을 회전하거나
무효화하므로 일반 복사 흐름에서는 기본적으로 이를 건너뜁니다. 에이전트에
독립 계정이 필요하면 별도의 OAuth 로그인을 구성하세요.

## Anthropic 레거시 토큰 호환성

<Warning>
Anthropic의 공개 Claude Code 문서에는 직접 Claude Code 사용이
Claude 구독 한도 내에 유지된다고 되어 있으며, Anthropic 직원은 OpenClaw 스타일 Claude
CLI 사용이 다시 허용된다고 알려주었습니다. 따라서 OpenClaw은 Anthropic이
새 정책을 게시하지 않는 한 이 통합에서 Claude CLI 재사용 및
`claude -p` 사용을 승인된 것으로 취급합니다.

Anthropic의 현재 직접 Claude Code 플랜 문서는 [Pro 또는 Max
플랜으로 Claude Code 사용](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
및 [Team 또는 Enterprise
플랜으로 Claude Code 사용](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)을 참고하세요.

OpenClaw에서 다른 구독형 옵션을 원한다면 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding
Plan](/ko/providers/qwen), [MiniMax Coding Plan](/ko/providers/minimax),
및 [Z.AI / GLM Coding Plan](/ko/providers/glm)을 참고하세요.
</Warning>

OpenClaw은 Anthropic setup-token도 지원되는 토큰 인증 경로로 노출하지만, 이제 사용 가능할 때는 Claude CLI 재사용과 `claude -p`를 선호합니다.

## Anthropic Claude CLI 마이그레이션

OpenClaw은 Anthropic Claude CLI 재사용을 다시 지원합니다. 호스트에 이미 로컬
Claude 로그인이 있으면 온보딩/구성이 이를 직접 재사용할 수 있습니다.

## OAuth 교환(로그인 작동 방식)

OpenClaw의 대화형 로그인 흐름은 `@mariozechner/pi-ai`에 구현되어 있으며 마법사/명령에 연결되어 있습니다.

### Anthropic setup-token

흐름 형태:

1. OpenClaw에서 Anthropic setup-token을 시작하거나 paste-token을 붙여넣습니다
2. OpenClaw은 결과 Anthropic 자격 증명을 인증 프로필에 저장합니다
3. 모델 선택은 `anthropic/...`에 유지됩니다
4. 기존 Anthropic 인증 프로필은 롤백/순서 제어를 위해 계속 사용할 수 있습니다

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth는 OpenClaw 워크플로를 포함해 Codex CLI 외부에서의 사용이 명시적으로 지원됩니다.

흐름 형태(PKCE):

1. PKCE verifier/challenge + 무작위 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 콜백 캡처 시도
4. 콜백을 바인딩할 수 없거나 원격/헤드리스 환경이면 리디렉션 URL/코드를 붙여넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. access token에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }` 저장

마법사 경로는 `openclaw onboard` → 인증 선택 `openai-codex`입니다.

## 갱신 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임에서는 다음과 같습니다.

- `expires`가 미래이면 → 저장된 access token 사용
- 만료되었으면 → 갱신(파일 잠금 아래에서)하고 저장된 자격 증명 덮어쓰기
- 보조 에이전트가 상속된 메인 에이전트 OAuth 프로필을 읽으면, 갱신은
  refresh token을 보조 에이전트 저장소로 복사하는 대신 메인 에이전트 저장소에
  다시 씁니다
- 예외: 일부 외부 CLI 자격 증명은 계속 외부에서 관리됩니다. OpenClaw은
  복사된 refresh token을 소비하는 대신 해당 CLI 인증 저장소를 다시 읽습니다.
  Codex CLI 부트스트랩은 의도적으로 더 좁습니다. 빈
  `openai-codex:default` 프로필을 시드한 다음, OpenClaw이 소유한 갱신이 로컬
  프로필을 표준으로 유지합니다.

갱신 흐름은 자동입니다. 일반적으로 토큰을 수동으로 관리할 필요가 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴:

### 1) 권장: 별도 에이전트

“개인”과 “업무”가 절대 상호작용하지 않게 하려면 격리된 에이전트(별도 세션 + 자격 증명 + 워크스페이스)를 사용하세요.

```bash
openclaw agents add work
openclaw agents add personal
```

그런 다음 에이전트별로 인증을 구성하고(마법사) 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 한 에이전트의 여러 프로필

`auth-profiles.json`은 같은 제공자에 대해 여러 프로필 ID를 지원합니다.

사용할 프로필 선택:

- 구성 순서(`auth.order`)를 통해 전역으로
- `/model ...@<profileId>`를 통해 세션별로

예시(세션 재정의):

- `/model Opus@anthropic:work`

존재하는 프로필 ID를 확인하는 방법:

- `openclaw channels list --json`(`auth[]` 표시)

관련 문서:

- [모델 장애 조치](/ko/concepts/model-failover)(순환 + 쿨다운 규칙)
- [슬래시 명령](/ko/tools/slash-commands)(명령 표면)

## 관련

- [인증](/ko/gateway/authentication) — 모델 제공자 인증 개요
- [비밀 값](/ko/gateway/secrets) — 자격 증명 저장소 및 SecretRef
- [구성 참조](/ko/gateway/configuration-reference#auth-storage) — 인증 구성 키
