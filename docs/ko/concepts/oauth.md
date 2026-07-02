---
read_when:
    - OpenClaw OAuth를 처음부터 끝까지 이해하고 싶습니다
    - 토큰 무효화 / 로그아웃 문제가 발생했습니다
    - Claude CLI 또는 OAuth 인증 흐름이 필요합니다
    - 여러 계정 또는 프로필 라우팅을 원합니다
summary: 'OpenClaw의 OAuth: 토큰 교환, 저장 및 다중 계정 패턴'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:26:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw는 이를 제공하는 제공자에서 OAuth를 통한 "구독 인증"을 지원합니다
(특히 **OpenAI Codex (ChatGPT OAuth)**). Anthropic의 경우 실질적인 구분은
현재 다음과 같습니다.

- **Anthropic API 키**: 일반 Anthropic API 청구
- **OpenClaw 내부의 Anthropic Claude CLI / 구독 인증**: Anthropic 직원이
  이 사용이 다시 허용된다고 알려 주었습니다

OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서의 사용이 명시적으로 지원됩니다.

OpenClaw는 OpenAI API 키 인증과 ChatGPT/Codex OAuth를 모두 정식 제공자 id
`openai` 아래에 저장합니다. 이전 `openai-codex:*` 프로필 id와
`auth.order.openai-codex` 항목은 `openclaw doctor --fix`로 복구되는 레거시 상태입니다.
새 구성에는 `openai:*` 프로필 id와 `auth.order.openai`를 사용하세요.

프로덕션의 Anthropic에서는 API 키 인증이 더 안전한 권장 경로입니다.

이 페이지에서는 다음을 설명합니다.

- OAuth **토큰 교환**이 작동하는 방식(PKCE)
- 토큰이 **저장되는** 위치와 그 이유
- **여러 계정**을 처리하는 방법(프로필 + 세션별 재정의)

OpenClaw는 자체 OAuth 또는 API 키 흐름을 제공하는 **제공자 Plugin**도 지원합니다.
다음으로 실행하세요.

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(존재 이유)

OAuth 제공자는 로그인/새로 고침 흐름 중에 **새 refresh token**을 발급하는 경우가 많습니다. 일부 제공자(또는 OAuth 클라이언트)는 같은 사용자/앱에 대해 새 토큰이 발급되면 이전 refresh token을 무효화할 수 있습니다.

실제 증상:

- OpenClaw _및_ Claude Code / Codex CLI로 로그인하면 → 나중에 둘 중 하나가 무작위로 "로그아웃"됩니다

이를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **토큰 싱크**로 취급합니다.

- 런타임은 **한 곳**에서 자격 증명을 읽습니다
- 여러 프로필을 유지하고 결정적으로 라우팅할 수 있습니다
- 외부 CLI 재사용은 제공자별로 다릅니다. Codex CLI는 비어 있는
  `openai:default` 프로필을 부트스트랩할 수 있지만, OpenClaw에 로컬 OAuth 프로필이 생기면
  로컬 refresh token이 정식입니다. 해당 로컬 refresh token이 거부되면
  OpenClaw는 Codex CLI 토큰 자료를 형제 런타임 폴백으로 사용하는 대신
  재인증이 필요한 관리 프로필을 보고합니다. 다른 통합은 외부에서 관리되는 상태로 남아
  해당 CLI 인증 저장소를 다시 읽을 수 있습니다
- 구성된 제공자 집합을 이미 알고 있는 상태 및 시작 경로는 외부 CLI 검색 범위를
  해당 집합으로 제한하므로, 단일 제공자 설정에서 관련 없는 CLI 로그인 저장소를
  조사하지 않습니다

## 저장소(토큰 위치)

비밀은 에이전트 인증 저장소에 저장됩니다.

- 인증 프로필(OAuth + API 키 + 선택적 값 수준 참조): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환성 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (정적 `api_key` 항목은 발견되면 제거됩니다)

레거시 가져오기 전용 파일(아직 지원되지만 기본 저장소는 아님):

- `~/.openclaw/credentials/oauth.json` (처음 사용할 때 `auth-profiles.json`으로 가져옴)

위 항목은 모두 `$OPENCLAW_STATE_DIR`(상태 디렉터리 재정의)도 준수합니다. 전체 참조: [/gateway/configuration](/ko/gateway/configuration-reference#auth-storage)

정적 비밀 참조와 런타임 스냅샷 활성화 동작은 [비밀 관리](/ko/gateway/secrets)를 참조하세요.

보조 에이전트에 로컬 인증 프로필이 없으면 OpenClaw는 기본/메인 에이전트 저장소에서
읽기 통과 상속을 사용합니다. 읽을 때 메인 에이전트의 `auth-profiles.json`을 복제하지
않습니다. OAuth refresh token은 특히 민감합니다. 일부 제공자가 사용 후 refresh token을
순환하거나 무효화하기 때문에 일반 복사 흐름은 기본적으로 이를 건너뜁니다. 에이전트에
독립 계정이 필요하면 별도의 OAuth 로그인을 구성하세요.

## Anthropic 레거시 토큰 호환성

<Warning>
Anthropic의 공개 Claude Code 문서에는 Claude Code 직접 사용이 Claude 구독 한도 내에
유지된다고 되어 있으며, Anthropic 직원은 OpenClaw 스타일 Claude CLI 사용이 다시
허용된다고 알려 주었습니다. 따라서 OpenClaw는 Anthropic이 새 정책을 게시하지 않는 한
이 통합에서 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로 취급합니다.

Anthropic의 현재 직접 Claude Code 플랜 문서는 [Pro 또는 Max 플랜으로 Claude Code
사용하기](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
및 [Team 또는 Enterprise 플랜으로 Claude Code
사용하기](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)를 참조하세요.

OpenClaw에서 다른 구독 스타일 옵션을 원하면 [OpenAI
Codex](/ko/providers/openai), [Qwen Cloud Coding
Plan](/ko/providers/qwen), [MiniMax Coding Plan](/ko/providers/minimax),
[Z.AI / GLM Coding Plan](/ko/providers/zai)을 참조하세요.
</Warning>

OpenClaw는 Anthropic setup-token도 지원되는 토큰 인증 경로로 노출하지만, 이제 사용 가능한 경우 Claude CLI 재사용과 `claude -p`를 선호합니다.

## Anthropic Claude CLI 마이그레이션

OpenClaw는 Anthropic Claude CLI 재사용을 다시 지원합니다. 호스트에 이미 로컬
Claude 로그인이 있으면 온보딩/구성에서 이를 직접 재사용할 수 있습니다.

## OAuth 교환(로그인 작동 방식)

OpenClaw의 대화형 로그인 흐름은 `openclaw/plugin-sdk/llm`에 구현되어 있으며 마법사/명령에 연결되어 있습니다.

### Anthropic setup-token

흐름 형태:

1. OpenClaw에서 Anthropic setup-token을 시작하거나 paste-token을 붙여넣습니다
2. OpenClaw가 결과 Anthropic 자격 증명을 인증 프로필에 저장합니다
3. 모델 선택은 `anthropic/...`에 유지됩니다
4. 기존 Anthropic 인증 프로필은 롤백/순서 제어에 계속 사용할 수 있습니다

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth는 OpenClaw 워크플로를 포함하여 Codex CLI 외부에서의 사용이 명시적으로 지원됩니다.

로그인 명령은 여전히 정식 OpenAI 제공자 id를 사용합니다.

```bash
openclaw models auth login --provider openai
```

한 에이전트에서 여러 ChatGPT/Codex OAuth 계정을 사용하려면 `--profile-id openai:<name>`을
사용하세요. 새 프로필에는 `openai-codex:<name>`을 사용하지 마세요. Doctor는
이전 접두사를 충돌 없는 `openai:*` 프로필 id로 마이그레이션합니다. 프로필 id를
`auth.order` 또는 `/model ...@<profileId>`에 복사하기 전에 복구 후
`openclaw models auth list --provider openai`를 실행하세요.

흐름 형태(PKCE):

1. PKCE verifier/challenge + 무작위 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 콜백 캡처 시도
4. 콜백을 바인드할 수 없거나 원격/헤드리스 환경이면 리디렉션 URL/코드 붙여넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. 액세스 토큰에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }` 저장

마법사 경로는 `openclaw onboard` → 인증 선택 `openai`입니다.

## 새로 고침 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임에서:

- `expires`가 미래이면 → 저장된 액세스 토큰을 사용합니다
- 만료되었으면 → (파일 잠금 아래에서) 새로 고침하고 저장된 자격 증명을 덮어씁니다
- 보조 에이전트가 상속된 메인 에이전트 OAuth 프로필을 읽으면, 새로 고침은 refresh token을
  보조 에이전트 저장소로 복사하는 대신 메인 에이전트 저장소에 다시 씁니다
- 예외: 일부 외부 CLI 자격 증명은 외부에서 관리되는 상태로 유지됩니다. OpenClaw는
  복사된 refresh token을 소비하는 대신 해당 CLI 인증 저장소를 다시 읽습니다.
  Codex CLI 부트스트랩은 의도적으로 더 좁습니다. OpenClaw가 해당 제공자의 OAuth를
  소유하기 전에는 비어 있는 `openai:default` 또는 명시적으로 요청된 OpenAI 프로필만
  시드할 수 있습니다. 그 이후에는 OpenClaw가 소유한 새로 고침이 로컬 프로필을
  정식으로 유지하며, 검색은 Codex CLI 인증을 어떤 형제 슬롯에도 추가하지 않습니다.
  관리되는 새로 고침이 실패하면 OpenClaw는 외부 CLI 토큰 자료를 반환하는 대신
  재인증이 필요한 영향을 받은 프로필을 보고합니다.

새로 고침 흐름은 자동입니다. 일반적으로 토큰을 수동으로 관리할 필요가 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴:

### 1) 권장: 별도 에이전트

"개인"과 "업무"가 절대 상호 작용하지 않게 하려면 격리된 에이전트(별도 세션 + 자격 증명 + 작업 공간)를 사용하세요.

```bash
openclaw agents add work
openclaw agents add personal
```

그런 다음 에이전트별로 인증을 구성하고(마법사) 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 한 에이전트의 여러 프로필

`auth-profiles.json`은 같은 제공자에 대해 여러 프로필 ID를 지원합니다.

사용할 프로필을 선택하는 방법:

- 구성 순서(`auth.order`)를 통해 전역으로
- `/model ...@<profileId>`를 통해 세션별로

예(세션 재정의):

- `/model Opus@anthropic:work`

존재하는 프로필 ID를 확인하는 방법:

- `openclaw channels list --json` (`auth[]` 표시)

관련 문서:

- [모델 장애 조치](/ko/concepts/model-failover) (순환 + 쿨다운 규칙)
- [슬래시 명령](/ko/tools/slash-commands) (명령 표면)

## 관련

- [인증](/ko/gateway/authentication) - 모델 제공자 인증 개요
- [비밀](/ko/gateway/secrets) - 자격 증명 저장소 및 SecretRef
- [구성 참조](/ko/gateway/configuration-reference#auth-storage) - 인증 구성 키
