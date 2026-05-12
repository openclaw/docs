---
read_when:
    - Hermes 또는 다른 에이전트 시스템에서 OpenClaw로 마이그레이션하려는 경우
    - Plugin 소유 마이그레이션 제공자를 추가하고 있습니다
summary: 'CLI 참조: `openclaw migrate`(다른 에이전트 시스템에서 상태 가져오기)'
title: 마이그레이션
x-i18n:
    generated_at: "2026-05-12T00:58:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin이 소유한 마이그레이션 제공자를 통해 다른 에이전트 시스템의 상태를 가져옵니다. 번들 제공자는 Codex CLI 상태, [Claude](/ko/install/migrating-claude), [Hermes](/ko/install/migrating-hermes)를 포함하며, 서드파티 plugins는 추가 제공자를 등록할 수 있습니다.

<Tip>
사용자 대상 단계별 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude) 및 [Hermes에서 마이그레이션](/ko/install/migrating-hermes)를 참조하세요. [마이그레이션 허브](/ko/install/migrating)에는 모든 경로가 나열되어 있습니다.
</Tip>

## 명령

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
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
  계획을 만들고 상태를 변경하지 않은 채 종료합니다.
</ParamField>
<ParamField path="--from <path>" type="string">
  원본 상태 디렉터리를 재정의합니다. Hermes의 기본값은 `~/.hermes`입니다.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  지원되는 자격 증명을 가져옵니다. 기본적으로 꺼져 있습니다.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  계획에서 충돌이 보고될 때 적용이 기존 대상을 대체하도록 허용합니다.
</ParamField>
<ParamField path="--yes" type="boolean">
  확인 프롬프트를 건너뜁니다. 비대화형 모드에서 필요합니다.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skills 이름 또는 항목 ID로 Skills 복사 항목 하나를 선택합니다. 여러 Skills를 마이그레이션하려면 이 플래그를 반복하세요. 생략하면 대화형 Codex 마이그레이션은 체크박스 선택기를 표시하고, 비대화형 마이그레이션은 계획된 모든 Skills를 유지합니다.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 이름 또는 항목 ID로 Codex Plugin 설치 항목 하나를 선택합니다. 여러 Codex plugins를 마이그레이션하려면 이 플래그를 반복하세요. 생략하면 대화형 Codex 마이그레이션은 네이티브 Codex Plugin 체크박스 선택기를 표시하고, 비대화형 마이그레이션은 계획된 모든 plugins를 유지합니다. 이는 Codex 앱 서버 인벤터리에서 발견한 소스 설치 `openai-curated` Codex plugins에만 적용됩니다.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  적용 전 백업을 건너뜁니다. 로컬 OpenClaw 상태가 있는 경우 `--force`가 필요합니다.
</ParamField>
<ParamField path="--force" type="boolean">
  적용이 백업 건너뛰기를 거부할 상황에서 `--no-backup`과 함께 필요합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  계획 또는 적용 결과를 JSON으로 출력합니다. `--json`이 있고 `--yes`가 없으면 적용은 계획을 출력하고 상태를 변경하지 않습니다.
</ParamField>

## 안전 모델

`openclaw migrate`는 미리 보기 우선입니다.

<AccordionGroup>
  <Accordion title="적용 전 미리 보기">
    제공자는 어떤 것도 변경되기 전에 충돌, 건너뛴 항목, 민감한 항목을 포함한 항목별 계획을 반환합니다. JSON 계획, 적용 출력, 마이그레이션 보고서는 API 키, 토큰, 인증 헤더, 쿠키, 비밀번호처럼 비밀로 보이는 중첩 키를 수정 처리합니다.

    `openclaw migrate apply <provider>`는 `--yes`가 설정되지 않은 한 상태를 변경하기 전에 계획을 미리 보여 주고 확인을 요청합니다. 비대화형 모드에서는 적용에 `--yes`가 필요합니다.

  </Accordion>
  <Accordion title="백업">
    적용은 마이그레이션을 적용하기 전에 OpenClaw 백업을 만들고 검증합니다. 로컬 OpenClaw 상태가 아직 없으면 백업 단계는 건너뛰고 마이그레이션은 계속될 수 있습니다. 상태가 있을 때 백업을 건너뛰려면 `--no-backup`과 `--force`를 모두 전달하세요.
  </Accordion>
  <Accordion title="충돌">
    계획에 충돌이 있으면 적용은 계속 진행하지 않습니다. 계획을 검토한 다음, 기존 대상을 대체하려는 의도가 맞다면 `--overwrite`로 다시 실행하세요. 제공자는 여전히 마이그레이션 보고서 디렉터리에 덮어쓴 파일에 대한 항목 수준 백업을 쓸 수 있습니다.
  </Accordion>
  <Accordion title="비밀">
    비밀은 기본적으로 절대 가져오지 않습니다. 지원되는 자격 증명을 가져오려면 `--include-secrets`를 사용하세요.
  </Accordion>
</AccordionGroup>

## Claude 제공자

번들 Claude 제공자는 기본적으로 `~/.claude`에서 Claude Code 상태를 감지합니다. 특정 Claude Code 홈 또는 프로젝트 루트를 가져오려면 `--from <path>`를 사용하세요.

<Tip>
사용자 대상 단계별 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude)을 참조하세요.
</Tip>

### Claude가 가져오는 항목

- 프로젝트 `CLAUDE.md` 및 `.claude/CLAUDE.md`를 OpenClaw 에이전트 작업공간으로 가져옵니다.
- 사용자 `~/.claude/CLAUDE.md`를 작업공간 `USER.md`에 추가합니다.
- 프로젝트 `.mcp.json`, Claude Code `~/.claude.json`, Claude Desktop `claude_desktop_config.json`의 MCP 서버 정의.
- `SKILL.md`를 포함하는 Claude Skills 디렉터리.
- 수동 호출만 가능한 OpenClaw Skills로 변환된 Claude 명령 Markdown 파일.

### 아카이브 및 수동 검토 상태

Claude hooks, 권한, 환경 기본값, 로컬 메모리, 경로 범위 규칙, 하위 에이전트, 캐시, 계획, 프로젝트 기록은 마이그레이션 보고서에 보존되거나 수동 검토 항목으로 보고됩니다. OpenClaw는 hooks를 실행하거나, 광범위한 allowlist를 복사하거나, OAuth/Desktop 자격 증명 상태를 자동으로 가져오지 않습니다.

## Codex 제공자

번들 Codex 제공자는 기본적으로 `~/.codex`에서 Codex CLI 상태를 감지하거나,
해당 환경 변수가 설정되어 있으면 `CODEX_HOME`에서 감지합니다. 특정 Codex 홈의
인벤터리를 만들려면 `--from <path>`를 사용하세요.

OpenClaw Codex 하니스로 이동하면서 유용한 개인 Codex CLI 자산을
의도적으로 승격하려는 경우 이 제공자를 사용하세요. 로컬 Codex 앱 서버
실행은 에이전트별 `CODEX_HOME` 및 `HOME` 디렉터리를 사용하므로 기본적으로
개인 Codex CLI 상태를 읽지 않습니다.

대화형 터미널에서 `openclaw migrate codex`를 실행하면 전체 계획을 미리 보여 준
다음, 최종 적용 확인 전에 체크박스 선택기를 엽니다. Skills 복사 항목이 먼저
프롬프트됩니다. 대량 선택에는 `Toggle all on` 또는 `Toggle all off`를 사용하세요.
계획된 Skills는 체크된 상태로 시작하고, 충돌하는 Skills는 체크 해제된 상태로 시작하며,
`Skip for now`는 Plugin 선택으로 계속 진행하면서도 이 실행의 Skills 복사를 건너뜁니다.
소스 설치 curated Codex plugins가 마이그레이션 가능하고 `--plugin`이 제공되지 않았다면,
마이그레이션은 그다음 Plugin 이름으로 네이티브 Codex Plugin 활성화를 프롬프트합니다.
Plugin 항목은 대상 OpenClaw Codex Plugin 구성에 해당 Plugin이 이미 있지 않은 한
체크된 상태로 시작합니다. 기존 대상 plugins는 체크 해제된 상태로 시작하고
`conflict: plugin exists`와 같은 충돌 힌트를 표시합니다. 해당 실행에서 네이티브 Codex
plugins를 마이그레이션하지 않으려면 `Toggle all off`를 선택하고, 적용 전에 중지하려면
`Skip for now`를 선택하세요. 스크립트 또는 정확한 실행의 경우 Skills마다
`--skill <name>`을 한 번씩 전달하세요. 예:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

네이티브 Codex Plugin 마이그레이션을 비대화형으로 하나 이상의 소스 설치 curated plugins로
제한하려면 `--plugin <name>`을 사용하세요.

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex가 가져오는 항목

- `$CODEX_HOME/skills` 아래의 Codex CLI Skills 디렉터리. Codex의
  `.system` 캐시는 제외합니다.
- 현재 OpenClaw 에이전트 작업공간으로 복사되는 `$HOME/.agents/skills` 아래의
  개인 AgentSkills. 에이전트별 소유권을 원할 때 사용합니다.
- Codex 앱 서버 `plugin/list`를 통해 발견된 소스 설치 `openai-curated` Codex plugins.
  적용은 선택된 각 Plugin에 대해 앱 서버 `plugin/install`을 호출합니다. 대상 앱 서버가
  해당 Plugin을 이미 설치 및 활성화된 것으로 보고하더라도 호출합니다. 마이그레이션된
  Codex plugins는 네이티브 Codex 하니스를 선택한 세션에서만 사용할 수 있습니다.
  Pi, 일반 OpenAI 제공자 실행, ACP 대화 바인딩 또는 다른 하니스에는 노출되지 않습니다.

### 수동 검토 Codex 상태

Codex `config.toml`, 네이티브 `hooks/hooks.json`, curated가 아닌 마켓플레이스,
소스 설치 curated plugins가 아닌 캐시된 Plugin 번들은 자동으로 활성화되지 않습니다.
이들은 수동 검토를 위해 마이그레이션 보고서에 복사되거나 보고됩니다.

마이그레이션된 소스 설치 curated plugins의 경우 적용은 다음을 씁니다.

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 선택된 각 Plugin에 대해 `marketplaceName: "openai-curated"` 및
  `pluginName`이 있는 명시적 Plugin 항목 하나

마이그레이션은 절대 `plugins["*"]`를 쓰지 않으며 로컬 마켓플레이스 캐시 경로를 저장하지 않습니다.
인증이 필요한 설치는 영향을 받는 Plugin 항목에 `status: "skipped"`,
`reason: "auth_required"`, 정리된 앱 식별자와 함께 보고됩니다.
해당 명시적 구성 항목은 다시 인증하고 활성화할 때까지 비활성화된 상태로 기록됩니다.
다른 설치 실패는 항목 범위 `error` 결과입니다.

계획 중 Codex 앱 서버 Plugin 인벤터리를 사용할 수 없으면, 마이그레이션은 전체
마이그레이션을 실패시키는 대신 캐시된 번들 안내 항목으로 대체합니다.

## Hermes 제공자

번들 Hermes 제공자는 기본적으로 `~/.hermes`에서 상태를 감지합니다. Hermes가 다른 위치에 있으면 `--from <path>`를 사용하세요.

### Hermes가 가져오는 항목

- `config.yaml`의 기본 모델 구성.
- `providers` 및 `custom_providers`의 구성된 모델 제공자 및 사용자 지정 OpenAI 호환 엔드포인트.
- `mcp_servers` 또는 `mcp.servers`의 MCP 서버 정의.
- `SOUL.md` 및 `AGENTS.md`를 OpenClaw 에이전트 작업공간으로 가져옵니다.
- `memories/MEMORY.md` 및 `memories/USER.md`를 작업공간 메모리 파일에 추가합니다.
- OpenClaw 파일 메모리의 메모리 구성 기본값, 그리고 Honcho 같은 외부 메모리 제공자의 아카이브 또는 수동 검토 항목.
- `skills/<name>/` 아래에 `SKILL.md` 파일을 포함하는 Skills.
- `skills.config`의 Skills별 구성 값.
- `.env`의 지원되는 API 키. `--include-secrets`가 있을 때만 해당합니다.

### 지원되는 `.env` 키

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 아카이브 전용 상태

OpenClaw가 안전하게 해석할 수 없는 Hermes 상태는 수동 검토를 위해 마이그레이션 보고서에 복사되지만, 실시간 OpenClaw 구성이나 자격 증명으로 로드되지는 않습니다. 이는 OpenClaw가 이를 자동으로 실행하거나 신뢰할 수 있는 것처럼 꾸미지 않고 불투명하거나 안전하지 않은 상태를 보존합니다.

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

마이그레이션 소스는 plugins입니다. Plugin은 `openclaw.plugin.json`에서 제공자 ID를 선언합니다.

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

런타임에 Plugin은 `api.registerMigrationProvider(...)`를 호출합니다. 제공자는 `detect`, `plan`, `apply`를 구현합니다. Core는 CLI 오케스트레이션, 백업 정책, 프롬프트, JSON 출력, 충돌 사전 점검을 소유합니다. Core는 검토된 계획을 `apply(ctx, plan)`으로 전달하며, 제공자는 호환성을 위해 해당 인수가 없을 때만 계획을 다시 만들 수 있습니다.

제공자 plugins는 항목 생성 및 요약 개수에 `openclaw/plugin-sdk/migration`을 사용할 수 있으며, 충돌 인식 파일 복사, 아카이브 전용 보고서 복사, 캐시된 구성 런타임 래퍼, 마이그레이션 보고서에는 `openclaw/plugin-sdk/migration-runtime`을 사용할 수 있습니다.

## 온보딩 통합

온보딩은 제공자가 알려진 소스를 감지할 때 마이그레이션을 제안할 수 있습니다. `openclaw onboard --flow import`와 `openclaw setup --wizard --import-from hermes`는 모두 동일한 Plugin 마이그레이션 제공자를 사용하며, 적용 전에 여전히 미리 보기를 표시합니다.

<Note>
온보딩 가져오기는 새로운 OpenClaw 설정이 필요합니다. 이미 로컬 상태가 있다면 먼저 구성, 자격 증명, 세션, 작업 공간을 재설정하세요. 백업 후 덮어쓰기 또는 병합 가져오기는 기존 설정에 대해 기능 게이트가 적용되어 있습니다.
</Note>

## 관련 항목

- [Hermes에서 마이그레이션](/ko/install/migrating-hermes): 사용자용 안내.
- [Claude에서 마이그레이션](/ko/install/migrating-claude): 사용자용 안내.
- [마이그레이션](/ko/install/migrating): OpenClaw를 새 머신으로 이동합니다.
- [진단](/ko/gateway/doctor): 마이그레이션 적용 후 상태 확인.
- [Plugins](/ko/tools/plugin): Plugin 설치 및 등록.
