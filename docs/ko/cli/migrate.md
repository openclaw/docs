---
read_when:
    - Hermes 또는 다른 에이전트 시스템에서 OpenClaw로 마이그레이션하려는 경우
    - Plugin 소유 마이그레이션 제공자를 추가하고 있습니다
summary: '`openclaw migrate`용 CLI 참조(다른 에이전트 시스템에서 상태 가져오기)'
title: 마이그레이션
x-i18n:
    generated_at: "2026-05-12T23:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin 소유 마이그레이션 제공자를 통해 다른 에이전트 시스템의 상태를 가져옵니다. 번들 제공자는 Codex CLI 상태, [Claude](/ko/install/migrating-claude), [Hermes](/ko/install/migrating-hermes)를 지원하며, 타사 Plugin은 추가 제공자를 등록할 수 있습니다.

<Tip>
사용자 대상 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude) 및 [Hermes에서 마이그레이션](/ko/install/migrating-hermes)을 참고하세요. [마이그레이션 허브](/ko/install/migrating)에는 모든 경로가 나열되어 있습니다.
</Tip>

## 명령

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

<ParamField path="<provider>" type="string">
  등록된 마이그레이션 제공자의 이름입니다. 예: `hermes`. 설치된 제공자를 보려면 `openclaw migrate list`를 실행하세요.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  계획을 빌드하고 상태를 변경하지 않은 채 종료합니다.
</ParamField>
<ParamField path="--from <path>" type="string">
  소스 상태 디렉터리를 재정의합니다. Hermes의 기본값은 `~/.hermes`입니다.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  지원되는 자격 증명을 가져옵니다. 기본값은 꺼짐입니다.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  계획에서 충돌을 보고할 때 적용 작업이 기존 대상을 교체하도록 허용합니다.
</ParamField>
<ParamField path="--yes" type="boolean">
  확인 프롬프트를 건너뜁니다. 비대화형 모드에서 필요합니다.
</ParamField>
<ParamField path="--skill <name>" type="string">
  스킬 이름 또는 항목 ID로 하나의 skill 복사 항목을 선택합니다. 여러 skills를 마이그레이션하려면 플래그를 반복하세요. 생략하면 대화형 Codex 마이그레이션은 체크박스 선택기를 표시하고, 비대화형 마이그레이션은 계획된 모든 skills를 유지합니다.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 이름 또는 항목 ID로 하나의 Codex Plugin 설치 항목을 선택합니다. 여러 Codex plugins를 마이그레이션하려면 플래그를 반복하세요. 생략하면 대화형 Codex 마이그레이션은 네이티브 Codex Plugin 체크박스 선택기를 표시하고, 비대화형 마이그레이션은 계획된 모든 plugins를 유지합니다. 이는 Codex app-server 인벤터리가 발견한 소스 설치 `openai-curated` Codex plugins에만 적용됩니다.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex 전용입니다. 네이티브 Plugin 활성화를 계획하기 전에 새 소스 Codex app-server `app/list` 순회를 강제합니다. 마이그레이션 계획을 빠르게 유지하기 위해 기본값은 꺼짐입니다.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  적용 전 백업을 건너뜁니다. 로컬 OpenClaw 상태가 있으면 `--force`가 필요합니다.
</ParamField>
<ParamField path="--force" type="boolean">
  적용 작업이 백업 건너뛰기를 거부할 상황에서 `--no-backup`과 함께 필요합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  계획 또는 적용 결과를 JSON으로 출력합니다. `--json`이 있고 `--yes`가 없으면 적용 작업은 계획을 출력하고 상태를 변경하지 않습니다.
</ParamField>

## 안전 모델

`openclaw migrate`는 미리 보기 우선입니다.

<AccordionGroup>
  <Accordion title="적용 전 미리 보기">
    제공자는 변경이 발생하기 전에 충돌, 건너뛴 항목, 민감한 항목을 포함한 항목별 계획을 반환합니다. JSON 계획, 적용 출력, 마이그레이션 보고서는 API 키, 토큰, 인증 헤더, 쿠키, 비밀번호처럼 비밀로 보이는 중첩 키를 마스킹합니다.

    `openclaw migrate apply <provider>`는 `--yes`가 설정되지 않은 한 상태를 변경하기 전에 계획을 미리 보고 프롬프트를 표시합니다. 비대화형 모드에서는 적용 작업에 `--yes`가 필요합니다.

  </Accordion>
  <Accordion title="백업">
    적용 작업은 마이그레이션을 적용하기 전에 OpenClaw 백업을 만들고 검증합니다. 아직 로컬 OpenClaw 상태가 없으면 백업 단계는 건너뛰고 마이그레이션을 계속할 수 있습니다. 상태가 있을 때 백업을 건너뛰려면 `--no-backup`과 `--force`를 모두 전달하세요.
  </Accordion>
  <Accordion title="충돌">
    계획에 충돌이 있으면 적용 작업은 계속 진행을 거부합니다. 계획을 검토한 다음 기존 대상을 교체하려는 것이 의도라면 `--overwrite`로 다시 실행하세요. 제공자는 덮어쓴 파일에 대해 마이그레이션 보고서 디렉터리에 항목 수준 백업을 계속 작성할 수 있습니다.
  </Accordion>
  <Accordion title="비밀">
    비밀은 기본적으로 가져오지 않습니다. 지원되는 자격 증명을 가져오려면 `--include-secrets`를 사용하세요.
  </Accordion>
</AccordionGroup>

## Claude 제공자

번들 Claude 제공자는 기본적으로 `~/.claude`에서 Claude Code 상태를 감지합니다. 특정 Claude Code 홈 또는 프로젝트 루트를 가져오려면 `--from <path>`를 사용하세요.

<Tip>
사용자 대상 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude)을 참고하세요.
</Tip>

### Claude가 가져오는 항목

- 프로젝트 `CLAUDE.md` 및 `.claude/CLAUDE.md`를 OpenClaw 에이전트 워크스페이스로 가져옵니다.
- 사용자 `~/.claude/CLAUDE.md`를 워크스페이스 `USER.md`에 추가합니다.
- 프로젝트 `.mcp.json`, Claude Code `~/.claude.json`, Claude Desktop `claude_desktop_config.json`의 MCP 서버 정의입니다.
- `SKILL.md`를 포함하는 Claude skill 디렉터리입니다.
- Claude 명령 Markdown 파일을 수동 호출 전용 OpenClaw skills로 변환합니다.

### 아카이브 및 수동 검토 상태

Claude hooks, permissions, environment defaults, local memory, path-scoped rules, subagents, caches, plans, project history는 마이그레이션 보고서에 보존되거나 수동 검토 항목으로 보고됩니다. OpenClaw는 hooks를 실행하거나, 광범위한 허용 목록을 복사하거나, OAuth/Desktop 자격 증명 상태를 자동으로 가져오지 않습니다.

## Codex 제공자

번들 Codex 제공자는 기본적으로 `~/.codex`에서 Codex CLI 상태를 감지하거나,
해당 환경 변수가 설정된 경우 `CODEX_HOME`에서 감지합니다. 특정 Codex 홈을
인벤터리하려면 `--from <path>`를 사용하세요.

OpenClaw Codex harness로 이동하면서 유용한 개인 Codex CLI 자산을
의도적으로 승격하려는 경우 이 제공자를 사용하세요. 로컬 Codex app-server
실행은 에이전트별 `CODEX_HOME` 및 `HOME` 디렉터리를 사용하므로 기본적으로
개인 Codex CLI 상태를 읽지 않습니다.

대화형 터미널에서 `openclaw migrate codex`를 실행하면 전체 계획을 미리 본 뒤
최종 적용 확인 전에 체크박스 선택기를 엽니다. Skill 복사 항목이 먼저 프롬프트됩니다.
대량 선택에는 `Toggle all on` 또는 `Toggle all off`를 사용하세요.
행을 전환하려면 Space를 누르거나, 강조 표시된 행을 활성화하고 계속하려면 Enter를
누르세요. 계획된 skills는 체크된 상태로 시작하고, 충돌 skills는 체크 해제된 상태로 시작하며,
`Skip for now`는 이 실행에서 skill 복사를 건너뛰면서도 Plugin 선택을 계속합니다.
소스 설치 curated Codex plugins가 마이그레이션 가능하고 `--plugin`이 제공되지 않은 경우,
마이그레이션은 Plugin 이름으로 네이티브 Codex Plugin 활성화를 묻습니다. Plugin 항목은
대상 OpenClaw Codex Plugin 구성에 이미 해당 Plugin이 있는 경우를 제외하고 체크된 상태로
시작합니다. 기존 대상 plugins는 체크 해제된 상태로 시작하고 `conflict: plugin exists` 같은
충돌 힌트를 표시합니다. 해당 실행에서 네이티브 Codex plugins를 마이그레이션하지 않으려면
`Toggle all off`를 선택하거나, 적용 전에 중지하려면 `Skip for now`를 선택하세요. 스크립트 기반
또는 정확한 실행의 경우 skill마다 `--skill <name>`을 한 번씩 전달하세요. 예:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

네이티브 Codex Plugin 마이그레이션을 하나 이상의 소스 설치 curated plugins로
비대화형 제한하려면 `--plugin <name>`을 사용하세요.

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex가 가져오는 항목

- Codex의 `.system` 캐시를 제외한 `$CODEX_HOME/skills` 아래의 Codex CLI skill 디렉터리입니다.
- 에이전트별 소유권을 원할 때 현재 OpenClaw 에이전트 워크스페이스로 복사되는 `$HOME/.agents/skills` 아래의 개인 AgentSkills입니다.
- Codex app-server `plugin/list`를 통해 발견된 소스 설치 `openai-curated` Codex plugins입니다. 계획은 활성화된 각 설치 Plugin에 대해 `plugin/read`를 읽습니다. 앱 기반 plugins는 소스 Codex app-server 계정 응답이 ChatGPT 구독 계정이어야 합니다. ChatGPT가 아니거나 계정 응답이 없으면 `codex_subscription_required`로 건너뜁니다. 기본적으로 마이그레이션은 소스 `app/list`를 호출하지 않으므로, 계정 게이트를 통과한 앱 기반 plugins는 소스 앱 접근성 검증 없이 계획되며, 계정 조회 전송 실패는 `codex_account_unavailable`로 건너뜁니다. 마이그레이션이 새 소스 `app/list` 스냅샷을 강제하고 네이티브 활성화를 계획하기 전에 소유한 모든 앱이 존재하고, 활성화되어 있으며, 접근 가능해야 하도록 하려면 `--verify-plugin-apps`를 전달하세요. 이 모드에서는 계정 조회 전송 실패가 소스 앱 인벤터리 검증으로 넘어갑니다. 소스 앱 인벤터리 스냅샷은 현재 프로세스의 메모리에 유지되며, 마이그레이션 출력 또는 대상 구성에 작성되지 않습니다. 비활성화된 plugins, 읽을 수 없는 Plugin 세부 정보, 구독으로 제한된 소스 계정, 그리고 검증이 요청된 경우 누락된 앱, 비활성화된 앱, 접근 불가능한 앱 또는 소스 앱 인벤터리 실패는 대상 구성 항목 대신 유형이 지정된 이유가 있는 수동 건너뛴 항목이 됩니다.
  적용 작업은 대상 app-server가 해당 Plugin을 설치 및 활성화된 것으로 이미 보고하더라도 선택된 각 적격 Plugin에 대해 app-server `plugin/install`을 호출합니다. 마이그레이션된 Codex plugins는 네이티브 Codex harness를 선택하는 세션에서만 사용할 수 있습니다. Pi, 일반 OpenAI 제공자 실행, ACP 대화 바인딩 또는 다른 harness에는 노출되지 않습니다.

### 수동 검토 Codex 상태

Codex `config.toml`, 네이티브 `hooks/hooks.json`, curated가 아닌 마켓플레이스, 소스 설치 curated plugins가 아닌 캐시된
Plugin 번들, 소스 구독 게이트에 실패한 소스 설치 plugins는 자동으로 활성화되지 않습니다.
`--verify-plugin-apps`가 설정되면 소스 앱 인벤터리 게이트에 실패한 plugins도 건너뜁니다.
이들은 수동 검토를 위해 마이그레이션 보고서에 복사되거나 보고됩니다.

마이그레이션된 소스 설치 curated plugins의 경우 적용 작업은 다음을 작성합니다.

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 선택한 각 Plugin에 대해 `marketplaceName: "openai-curated"` 및 `pluginName`이 있는 명시적 Plugin 항목 하나

마이그레이션은 `plugins["*"]`를 절대 작성하지 않으며 로컬 마켓플레이스 캐시 경로를 절대 저장하지 않습니다. 소스 측 구독 실패는 `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` 또는 `plugin_read_unavailable` 같은 유형이 지정된 이유와 함께 수동 항목에 보고됩니다. `--verify-plugin-apps`를 사용하면 소스 앱 인벤터리 실패도 `app_inaccessible`, `app_disabled`, `app_missing` 또는 `app_inventory_unavailable`로 나타날 수 있습니다. 건너뛴 plugins는 대상 구성에 작성되지 않습니다.
대상 측 인증 필요 설치는 영향을 받는 Plugin 항목에 `status: "skipped"`, `reason: "auth_required"`, 정리된 앱 식별자와 함께 보고됩니다.
해당 명시적 구성 항목은 재인증하고 활성화할 때까지 비활성화된 상태로 작성됩니다. 그 외 설치 실패는 항목 범위 `error` 결과입니다.

계획 중 Codex app-server Plugin 인벤터리를 사용할 수 없으면 마이그레이션은 전체
마이그레이션에 실패하는 대신 캐시된 번들 권고 항목으로 대체합니다.

## Hermes 제공자

번들 Hermes 제공자는 기본적으로 `~/.hermes`에서 상태를 감지합니다. Hermes가 다른 곳에 있으면 `--from <path>`를 사용하세요.

### Hermes가 가져오는 항목

- `config.yaml`의 기본 모델 구성.
- `providers` 및 `custom_providers`의 구성된 모델 제공업체와 사용자 지정 OpenAI 호환 엔드포인트.
- `mcp_servers` 또는 `mcp.servers`의 MCP 서버 정의.
- `SOUL.md` 및 `AGENTS.md`를 OpenClaw 에이전트 워크스페이스로 가져옵니다.
- `memories/MEMORY.md` 및 `memories/USER.md`를 워크스페이스 메모리 파일에 추가합니다.
- OpenClaw 파일 메모리의 메모리 구성 기본값, 그리고 Honcho 같은 외부 메모리 제공업체의 아카이브 또는 수동 검토 항목.
- `skills/<name>/` 아래에 `SKILL.md` 파일이 포함된 Skills.
- `skills.config`의 Skills별 구성 값.
- `.env`의 지원되는 API 키. 단, `--include-secrets`를 사용하는 경우에만 포함됩니다.

### 지원되는 `.env` 키

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 아카이브 전용 상태

OpenClaw가 안전하게 해석할 수 없는 Hermes 상태는 수동 검토를 위해 마이그레이션 보고서로 복사되지만, 라이브 OpenClaw 구성이나 자격 증명에는 로드되지 않습니다. 이는 OpenClaw가 이를 자동으로 실행하거나 신뢰할 수 있다고 가장하지 않으면서 불투명하거나 안전하지 않은 상태를 보존합니다.

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 적용 후

```bash
openclaw doctor
```

## Plugin 계약

마이그레이션 소스는 Plugin입니다. Plugin은 `openclaw.plugin.json`에서 제공업체 ID를 선언합니다.

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

런타임에서 Plugin은 `api.registerMigrationProvider(...)`를 호출합니다. 제공업체는 `detect`, `plan`, `apply`를 구현합니다. Core는 CLI 오케스트레이션, 백업 정책, 프롬프트, JSON 출력, 충돌 사전 검사를 담당합니다. Core는 검토된 계획을 `apply(ctx, plan)`에 전달하며, 호환성을 위해 해당 인수가 없는 경우에만 제공업체가 계획을 다시 만들 수 있습니다.

제공업체 Plugin은 항목 생성 및 요약 개수에 `openclaw/plugin-sdk/migration`을 사용할 수 있으며, 충돌 인식 파일 복사, 아카이브 전용 보고서 복사, 캐시된 구성 런타임 래퍼, 마이그레이션 보고서에는 `openclaw/plugin-sdk/migration-runtime`을 사용할 수 있습니다.

## 온보딩 통합

제공업체가 알려진 소스를 감지하면 온보딩에서 마이그레이션을 제안할 수 있습니다. `openclaw onboard --flow import`와 `openclaw setup --wizard --import-from hermes`는 모두 동일한 Plugin 마이그레이션 제공업체를 사용하며, 적용 전에도 미리 보기를 표시합니다.

<Note>
온보딩 가져오기는 새 OpenClaw 설정이 필요합니다. 로컬 상태가 이미 있는 경우 먼저 구성, 자격 증명, 세션, 워크스페이스를 재설정하세요. 백업 후 덮어쓰기 또는 병합 가져오기는 기존 설정에 대해 기능 게이트가 적용됩니다.
</Note>

## 관련 항목

- [Hermes에서 마이그레이션](/ko/install/migrating-hermes): 사용자용 안내.
- [Claude에서 마이그레이션](/ko/install/migrating-claude): 사용자용 안내.
- [마이그레이션](/ko/install/migrating): OpenClaw를 새 머신으로 이동합니다.
- [Doctor](/ko/gateway/doctor): 마이그레이션 적용 후 상태 검사.
- [Plugins](/ko/tools/plugin): Plugin 설치 및 등록.
