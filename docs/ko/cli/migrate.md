---
read_when:
    - Hermes 또는 다른 에이전트 시스템에서 OpenClaw로 마이그레이션하려고 합니다.
    - Plugin이 소유하는 마이그레이션 제공자를 추가하고 있습니다
summary: '`openclaw migrate`의 CLI 참조(다른 에이전트 시스템에서 상태 가져오기)'
title: 마이그레이션
x-i18n:
    generated_at: "2026-07-12T15:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin이 소유하는 마이그레이션 공급자를 통해 다른 에이전트 시스템의 상태를 가져옵니다. 번들 공급자는 Claude, Codex CLI 및 [Hermes](/ko/install/migrating-hermes)를 지원하며, Plugin은 추가 공급자를 등록할 수 있습니다.

<Tip>
사용자용 단계별 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude) 및 [Hermes에서 마이그레이션](/ko/install/migrating-hermes)를 참조하십시오. [마이그레이션 허브](/ko/install/migrating)에는 모든 경로가 나열되어 있습니다.
</Tip>

## 명령어

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

다른 플래그 없이 `openclaw migrate <provider>`를 실행하면 계획을 수립하고 미리 보기를 표시한 다음, 적용 전에 TTY에서 확인을 요청합니다. `openclaw migrate plan <provider>`과 `openclaw migrate apply <provider>`은 동일한 플래그를 사용하여 미리 보기와 적용을 별도의 하위 명령으로 분리합니다.

<ParamField path="<provider>" type="string">
  등록된 마이그레이션 공급자의 이름입니다(예: `hermes`). 설치된 공급자를 확인하려면 `openclaw migrate list`를 실행하십시오.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  계획을 작성하고 상태를 변경하지 않은 채 종료합니다.
</ParamField>
<ParamField path="--from <path>" type="string">
  소스 상태 디렉터리를 재정의합니다. Hermes의 기본값은 `~/.hermes`, Codex의 기본값은 `~/.codex`(또는 `$CODEX_HOME`), Claude의 기본값은 `~/.claude`입니다.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  확인을 요청하지 않고 지원되는 자격 증명을 가져옵니다. 대화형 적용은 감지된 인증 자격 증명을 가져오기 전에 기본적으로 예가 선택된 상태로 묻습니다. 비대화형 `--yes`에서 이를 가져오려면 `--include-secrets`가 필요합니다.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  대화형 확인을 포함하여 인증 자격 증명 가져오기를 건너뜁니다.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  계획에서 충돌이 보고된 경우 적용 과정에서 기존 대상을 교체하도록 허용합니다.
</ParamField>
<ParamField path="--yes" type="boolean">
  확인 프롬프트를 건너뜁니다. 비대화형 모드에서는 필수입니다.
</ParamField>
<ParamField path="--skill <name>" type="string">
  스킬 이름이나 항목 ID로 복사할 스킬 항목 하나를 선택합니다. 여러 스킬을 마이그레이션하려면 플래그를 반복해서 지정하십시오. 생략하면 대화형 Codex 마이그레이션에서는 체크박스 선택기가 표시되고, 비대화형 마이그레이션에서는 계획된 모든 스킬이 유지됩니다.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 이름이나 항목 ID로 설치할 Codex Plugin 항목 하나를 선택합니다. 여러 Codex Plugin을 마이그레이션하려면 플래그를 반복해서 지정하십시오. 생략하면 대화형 Codex 마이그레이션에서는 네이티브 Codex Plugin 체크박스 선택기가 표시되고, 비대화형 마이그레이션에서는 계획된 모든 Plugin이 유지됩니다. Codex 앱 서버 인벤토리에서 검색된, 소스에 설치된 `openai-curated` Codex Plugin에만 적용됩니다.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex 전용입니다. 네이티브 Plugin 활성화를 계획하기 전에 소스 Codex 앱 서버에서 새로운 `app/list` 순회를 강제합니다. 마이그레이션 계획을 빠르게 유지하기 위해 기본적으로 꺼져 있습니다.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  마이그레이션 전 백업 아카이브 경로 또는 디렉터리입니다. `openclaw backup create`에 그대로 전달됩니다.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  적용 전 백업을 건너뜁니다. 로컬 OpenClaw 상태가 있으면 `--force`가 필요합니다.
</ParamField>
<ParamField path="--force" type="boolean">
  적용 과정에서 백업 건너뛰기를 거부하게 되는 경우 `--no-backup`과 함께 지정해야 합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  계획 또는 적용 결과를 JSON으로 출력합니다. `--json`을 사용하고 `--yes`를 사용하지 않으면 적용 과정에서 계획만 출력하고 상태를 변경하지 않습니다.
</ParamField>

## 안전 모델

`openclaw migrate`는 미리 보기를 우선합니다.

<AccordionGroup>
  <Accordion title="적용 전 미리 보기">
    공급자는 변경이 이루어지기 전에 충돌, 건너뛴 항목 및 민감한 항목을 포함한 항목별 계획을 반환합니다. JSON 계획, 적용 출력 및 마이그레이션 보고서에서는 API 키, 토큰, 권한 부여 헤더, 쿠키 및 비밀번호처럼 비밀로 보이는 중첩 키를 마스킹합니다.

    `openclaw migrate apply <provider>`은 `--yes`가 설정되지 않은 경우 상태를 변경하기 전에 계획을 미리 보여 주고 확인을 요청합니다. 비대화형 모드에서는 적용 시 `--yes`가 필요합니다.

  </Accordion>
  <Accordion title="백업">
    적용 과정에서는 마이그레이션을 적용하기 전에 OpenClaw 백업을 생성하고 검증합니다. 로컬 OpenClaw 상태가 아직 없으면 백업 단계를 건너뛰고 마이그레이션을 계속합니다. 상태가 있을 때 백업을 건너뛰려면 `--no-backup`과 `--force`를 모두 전달하십시오.
  </Accordion>
  <Accordion title="충돌">
    계획에 충돌이 있으면 적용 과정에서 계속 진행하지 않습니다. 계획을 검토한 다음 기존 대상을 의도적으로 교체하려는 경우 `--overwrite`를 사용하여 다시 실행하십시오. 공급자는 덮어쓴 파일에 대해 항목별 백업을 마이그레이션 보고서 디렉터리에 기록할 수 있습니다.
  </Accordion>
  <Accordion title="비밀">
    대화형 적용은 감지된 인증 자격 증명을 가져올지 기본적으로 예가 선택된 상태로 묻습니다. 이를 건너뛰려면 `--no-auth-credentials`를 사용하고, `--yes`를 사용한 무인 자격 증명 가져오기에는 `--include-secrets`를 사용하십시오.
  </Accordion>
</AccordionGroup>

## Claude 공급자

번들 Claude 공급자는 기본적으로 `~/.claude`에서 Claude Code 상태를 감지합니다. 특정 Claude Code 홈 또는 프로젝트 루트에서 가져오려면 `--from <path>`를 사용하십시오.

<Tip>
사용자용 단계별 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude)을 참조하십시오.
</Tip>

### Claude에서 가져오는 항목

- 프로젝트 `CLAUDE.md`와 `.claude/CLAUDE.md`를 OpenClaw 에이전트 작업 공간(`AGENTS.md`)으로 가져옵니다.
- 사용자 `~/.claude/CLAUDE.md`를 작업 공간 `USER.md`에 추가합니다.
- 프로젝트 `.mcp.json`, Claude Code `~/.claude.json`(프로젝트별 항목 포함) 및 Claude Desktop `claude_desktop_config.json`에서 MCP 서버 정의를 가져옵니다.
- `SKILL.md`가 포함된 Claude 스킬 디렉터리(사용자 `~/.claude/skills` 및 프로젝트 `.claude/skills`)를 가져옵니다.
- Claude 명령 Markdown 파일(사용자 `~/.claude/commands` 및 프로젝트 `.claude/commands`)을 수동 호출 전용 OpenClaw 스킬로 변환합니다.

### 아카이브 및 수동 검토 상태

Claude 훅, 권한, 환경 기본값, 프로젝트 `CLAUDE.local.md`, `.claude/rules`, 사용자 및 프로젝트 `agents/` 디렉터리와 프로젝트 기록(`~/.claude` 아래의 `projects`, `cache`, `plans`)은 마이그레이션 보고서에 보존되거나 수동 검토 항목으로 보고됩니다. OpenClaw는 훅을 실행하거나, 광범위한 허용 목록을 복사하거나, OAuth/Desktop 자격 증명 상태를 자동으로 가져오지 않습니다.

## Codex 공급자

번들 Codex 공급자는 기본적으로 `~/.codex`에서 Codex CLI 상태를 감지하며, `CODEX_HOME` 환경 변수가 설정되어 있으면 해당 위치에서 감지합니다. 특정 Codex 홈의 인벤토리를 작성하려면 `--from <path>`를 사용하십시오.

OpenClaw Codex 하네스로 이전하면서 유용한 개인 Codex CLI 자산을 의도적으로 승격하려는 경우 이 공급자를 사용하십시오. 로컬 Codex 앱 서버는 에이전트별 `CODEX_HOME`을 사용하여 실행되므로 기본적으로 개인 `~/.codex`를 읽지 않습니다. 일반 프로세스의 `HOME`은 계속 상속되므로 Codex는 공유 `$HOME/.agents/*` 스킬/Plugin 마켓플레이스 항목을 볼 수 있고, 하위 프로세스는 사용자 홈의 구성과 토큰을 찾을 수 있습니다.

대화형 터미널에서 `openclaw migrate codex`를 실행하면 전체 계획을 미리 보여 준 다음 최종 적용 확인 전에 체크박스 선택기를 엽니다. 스킬 복사 항목을 먼저 묻습니다. 일괄 선택에는 `Toggle all on` 또는 `Toggle all off`를 사용하십시오. Space를 눌러 행의 선택 상태를 전환하거나, Enter를 눌러 강조 표시된 행을 활성화하고 계속하십시오. 계획된 스킬은 선택된 상태로, 충돌하는 스킬은 선택되지 않은 상태로 시작하며, `Skip for now`는 이번 실행에서 스킬 복사를 건너뛰되 Plugin 선택은 계속 진행합니다. 소스에 설치된 선별 Codex Plugin을 마이그레이션할 수 있고 `--plugin`이 제공되지 않은 경우, 마이그레이션은 이어서 Plugin 이름별 네이티브 Codex Plugin 활성화 여부를 묻습니다. 대상 OpenClaw Codex Plugin 구성에 해당 Plugin이 이미 있지 않은 한 Plugin 항목은 선택된 상태로 시작합니다. 기존 대상 Plugin은 선택되지 않은 상태로 시작하며 `conflict: plugin exists`와 같은 충돌 힌트를 표시합니다. 해당 실행에서 네이티브 Codex Plugin을 마이그레이션하지 않으려면 `Toggle all off`를 선택하고, 적용 전에 중단하려면 `Skip for now`를 선택하십시오.

스크립트 실행이나 정확한 실행을 위해 하나 이상의 스킬 또는 Plugin을 명시적으로 선택하십시오.

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex에서 가져오는 항목

- Codex의 `.system` 캐시를 제외한 `$CODEX_HOME/skills` 아래의 Codex CLI 스킬 디렉터리입니다.
- `$HOME/.agents/skills` 아래의 개인 AgentSkills이며, 에이전트별 소유권을 위해 현재 OpenClaw 에이전트 작업 공간으로 복사됩니다.
- Codex 앱 서버 `plugin/list`를 통해 검색된, 소스에 설치된 `openai-curated` Codex Plugin입니다. 계획 수립 시 활성화되어 설치된 각 Plugin에 대해 `plugin/read`를 읽습니다.

앱 기반 Plugin 마이그레이션에는 추가 조건이 있습니다.

- 앱 기반 Plugin을 사용하려면 소스 Codex 앱 서버 계정이 ChatGPT 구독 계정이어야 합니다. ChatGPT 계정이 아니거나 계정 응답이 누락된 경우 `codex_subscription_required`와 함께 건너뜁니다.
- 기본적으로 마이그레이션은 소스 `app/list`를 호출하지 않으므로, 계정 조건을 통과한 앱 기반 Plugin은 소스 앱 접근성 검증 없이 계획되며, 계정 조회 전송 실패는 `codex_account_unavailable`과 함께 건너뜁니다.
- 새로운 소스 `app/list` 스냅샷을 강제하고 네이티브 활성화를 계획하기 전에 소유한 모든 앱이 존재하고 활성화되어 있으며 접근 가능하도록 요구하려면 `--verify-plugin-apps`를 전달하십시오. 이 모드에서는 계정 조회 전송 실패 시 소스 앱 인벤토리 검증으로 넘어갑니다. 스냅샷은 현재 프로세스의 메모리에만 유지되며, 마이그레이션 출력이나 대상 구성에는 절대 기록되지 않습니다.

비활성화된 Plugin, 읽을 수 없는 Plugin 세부 정보, 구독 조건을 충족하지 못한 소스 계정 및 `--verify-plugin-apps`가 설정된 경우 누락되거나 비활성화되었거나 접근할 수 없는 앱은 대상 구성 항목 대신 유형이 지정된 사유가 포함된 수동 건너뛰기 항목이 됩니다. 적용 과정에서는 대상 앱 서버에서 해당 Plugin이 이미 설치되고 활성화된 것으로 보고하더라도 선택된 적격 Plugin마다 앱 서버 `plugin/install`을 호출합니다. 마이그레이션된 Codex Plugin은 네이티브 Codex 하네스를 선택한 세션에서만 사용할 수 있으며 OpenClaw 공급자 실행, ACP 대화 바인딩 또는 기타 하네스에는 노출되지 않습니다.

### 수동 검토가 필요한 Codex 상태

Codex `config.toml`, 네이티브 `hooks/hooks.json`, 선별되지 않은 마켓플레이스, 소스에 설치된 선별 Plugin이 아닌 캐시된 Plugin 번들 및 소스 구독 조건을 통과하지 못한 소스 설치 Plugin은 자동으로 활성화되지 않습니다. `--verify-plugin-apps`가 설정되면 소스 앱 인벤토리 조건을 통과하지 못한 Plugin도 건너뜁니다. 이러한 모든 항목은 수동 검토를 위해 마이그레이션 보고서에 복사되거나 보고됩니다.

마이그레이션된 소스 설치 선별 Plugin의 경우 적용 과정에서 다음을 기록합니다.

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 선택된 각 Plugin에 대해 `marketplaceName: "openai-curated"` 및 `pluginName`이 포함된 명시적 Plugin 항목 하나

마이그레이션은 `plugins["*"]`를 절대 기록하지 않으며 로컬 마켓플레이스 캐시 경로도 절대 저장하지 않습니다.

건너뛴 Plugin은 대상 구성에 기록되지 않습니다. 소스 측 구독 실패는 수동 항목에 형식화된 사유인 `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` 또는 `plugin_read_unavailable`과 함께 보고됩니다. `--verify-plugin-apps`를 사용하면 소스 앱 인벤토리 실패도 `app_inaccessible`, `app_disabled`, `app_missing` 또는 `app_inventory_unavailable`로 표시될 수 있습니다. 대상 측에서 인증이 필요한 설치는 영향을 받는 Plugin 항목에 `status: "skipped"`, `reason: "auth_required"` 및 정제된 앱 식별자와 함께 보고됩니다. 해당 Plugin의 명시적 구성 항목은 재인증하고 활성화할 때까지 비활성화된 상태로 기록됩니다. 그 밖의 설치 실패는 항목 범위의 `error` 결과로 보고됩니다.

계획 중에 Codex app-server Plugin 인벤토리를 사용할 수 없으면 전체 마이그레이션을 실패시키는 대신 캐시된 번들 권고 항목으로 대체합니다.

## Hermes 제공자

번들로 제공되는 Hermes 제공자는 기본적으로 `~/.hermes`에서 상태를 감지합니다. Hermes가 다른 위치에 있으면 `--from <path>`를 사용하십시오.

### Hermes에서 가져오는 항목

- `config.yaml`의 기본 모델 구성.
- `providers` 및 `custom_providers`의 구성된 모델 제공자와 사용자 지정 OpenAI 호환 엔드포인트.
- `mcp_servers` 또는 `mcp.servers`의 MCP 서버 정의.
- `SOUL.md` 및 `AGENTS.md`를 OpenClaw 에이전트 작업 공간으로 가져옵니다.
- `memories/MEMORY.md` 및 `memories/USER.md`를 작업 공간 메모리 파일에 추가합니다.
- OpenClaw 파일 메모리의 기본 메모리 구성과 Honcho 같은 외부 메모리 제공자에 대한 보관 또는 수동 검토 항목.
- `skills/<name>/` 아래에 `SKILL.md` 파일이 포함된 Skills.
- `skills.config`의 Skills별 구성 값.
- 대화형 자격 증명 마이그레이션을 수락했거나 `--include-secrets`를 설정한 경우 OpenCode `auth.json`의 OpenCode OpenAI OAuth 자격 증명. Hermes `auth.json`의 OAuth 항목은 수동 OpenAI 재인증 또는 doctor 수리를 위해 보고되는 레거시 상태입니다.
- 대화형 자격 증명 마이그레이션을 수락했거나 `--include-secrets`를 설정한 경우 Hermes `.env` 및 OpenCode `auth.json`의 지원되는 API 키와 토큰.

### 지원되는 `.env` 키

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### 보관 전용 상태

OpenClaw가 안전하게 해석할 수 없는 Hermes 상태는 수동 검토를 위해 마이그레이션 보고서에 복사되지만, 실제 OpenClaw 구성이나 자격 증명에는 로드되지 않습니다. 이렇게 하면 OpenClaw가 자동으로 실행하거나 신뢰할 수 있는 것처럼 가장하지 않으면서 불투명하거나 안전하지 않은 상태를 보존할 수 있습니다: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### 적용 후

```bash
openclaw doctor
```

## Plugin 계약

마이그레이션 소스는 Plugin입니다. Plugin은 `openclaw.plugin.json`에 제공자 ID를 선언합니다.

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

런타임에서 Plugin은 `api.registerMigrationProvider(...)`를 호출합니다. 제공자는 `detect`, `plan`, `apply`를 구현합니다. Core는 CLI 오케스트레이션, 백업 정책, 프롬프트, JSON 출력 및 충돌 사전 점검을 담당합니다. Core는 검토된 계획을 `apply(ctx, plan)`에 전달하며, 호환성을 위해 해당 인수가 없는 경우에만 제공자가 계획을 다시 구성할 수 있습니다.

제공자 Plugin은 항목 생성 및 요약 개수 계산에 `openclaw/plugin-sdk/migration`을 사용할 수 있으며, 충돌을 인식하는 파일 복사, 보관 전용 보고서 복사, 캐시된 구성 런타임 래퍼 및 마이그레이션 보고서에는 `openclaw/plugin-sdk/migration-runtime`을 사용할 수 있습니다.

## 온보딩 통합

제공자가 알려진 소스를 감지하면 온보딩에서 마이그레이션을 제안할 수 있습니다. `openclaw onboard --flow import`와 `openclaw setup --wizard --import-from hermes`는 모두 동일한 Plugin 마이그레이션 제공자를 사용하며 적용 전에 미리 보기를 계속 표시합니다.

<Note>
온보딩 가져오기를 사용하려면 새로운 OpenClaw 설정이 필요합니다. 로컬 상태가 이미 있다면 먼저 구성, 자격 증명, 세션 및 작업 공간을 재설정하십시오. 백업 후 덮어쓰기 또는 병합 가져오기는 기존 설정에서 기능 게이트로 제한됩니다.
</Note>

## 관련 문서

- [Hermes에서 마이그레이션](/ko/install/migrating-hermes): 사용자용 단계별 안내서.
- [Claude에서 마이그레이션](/ko/install/migrating-claude): 사용자용 단계별 안내서.
- [마이그레이션](/ko/install/migrating): OpenClaw를 새 컴퓨터로 이동합니다.
- [Doctor](/ko/gateway/doctor): 마이그레이션 적용 후 상태 검사.
- [Plugin](/ko/tools/plugin): Plugin 설치 및 등록.
