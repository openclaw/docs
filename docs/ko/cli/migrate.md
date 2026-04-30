---
read_when:
    - Hermes 또는 다른 에이전트 시스템에서 OpenClaw로 마이그레이션하려는 경우
    - Plugin 소유 마이그레이션 제공자를 추가하고 있습니다
summary: '`openclaw migrate`의 CLI 참조(다른 에이전트 시스템에서 상태 가져오기)'
title: 마이그레이션
x-i18n:
    generated_at: "2026-04-30T06:23:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin 소유 마이그레이션 제공자를 통해 다른 에이전트 시스템의 상태를 가져옵니다. 번들 제공자는 [Claude](/ko/install/migrating-claude)와 [Hermes](/ko/install/migrating-hermes)를 지원하며, 서드파티 Plugin은 추가 제공자를 등록할 수 있습니다.

<Tip>
사용자 대상 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude) 및 [Hermes에서 마이그레이션](/ko/install/migrating-hermes)을 참조하세요. [마이그레이션 허브](/ko/install/migrating)는 모든 경로를 나열합니다.
</Tip>

## 명령

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  계획에서 충돌을 보고할 때 적용 작업이 기존 대상을 대체하도록 허용합니다.
</ParamField>
<ParamField path="--yes" type="boolean">
  확인 프롬프트를 건너뜁니다. 비대화형 모드에서 필요합니다.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  적용 전 백업을 건너뜁니다. 로컬 OpenClaw 상태가 있을 때는 `--force`가 필요합니다.
</ParamField>
<ParamField path="--force" type="boolean">
  적용 작업이 백업 건너뛰기를 거부할 상황에서 `--no-backup`과 함께 필요합니다.
</ParamField>
<ParamField path="--json" type="boolean">
  계획 또는 적용 결과를 JSON으로 출력합니다. `--json`이 있고 `--yes`가 없으면 적용 작업은 계획을 출력하고 상태를 변경하지 않습니다.
</ParamField>

## 안전 모델

`openclaw migrate`는 미리보기 우선 방식입니다.

<AccordionGroup>
  <Accordion title="적용 전 미리보기">
    제공자는 변경 전에 충돌, 건너뛴 항목, 민감한 항목을 포함한 항목별 계획을 반환합니다. JSON 계획, 적용 출력, 마이그레이션 보고서는 API 키, 토큰, 권한 부여 헤더, 쿠키, 비밀번호처럼 secret처럼 보이는 중첩 키를 마스킹합니다.

    `openclaw migrate apply <provider>`는 `--yes`가 설정되지 않은 한 계획을 미리 보여 주고 상태 변경 전에 확인을 요청합니다. 비대화형 모드에서는 적용 작업에 `--yes`가 필요합니다.

  </Accordion>
  <Accordion title="백업">
    적용 작업은 마이그레이션을 적용하기 전에 OpenClaw 백업을 만들고 확인합니다. 아직 로컬 OpenClaw 상태가 없으면 백업 단계는 건너뛰고 마이그레이션을 계속할 수 있습니다. 상태가 있을 때 백업을 건너뛰려면 `--no-backup`과 `--force`를 모두 전달하세요.
  </Accordion>
  <Accordion title="충돌">
    계획에 충돌이 있으면 적용 작업은 계속 진행을 거부합니다. 계획을 검토한 다음 기존 대상을 대체하려는 의도가 맞다면 `--overwrite`로 다시 실행하세요. 제공자는 여전히 마이그레이션 보고서 디렉터리에 덮어쓴 파일의 항목 수준 백업을 쓸 수 있습니다.
  </Accordion>
  <Accordion title="Secrets">
    Secrets는 기본적으로 절대 가져오지 않습니다. 지원되는 자격 증명을 가져오려면 `--include-secrets`를 사용하세요.
  </Accordion>
</AccordionGroup>

## Claude 제공자

번들 Claude 제공자는 기본적으로 `~/.claude`에서 Claude Code 상태를 감지합니다. 특정 Claude Code 홈 또는 프로젝트 루트를 가져오려면 `--from <path>`를 사용하세요.

<Tip>
사용자 대상 안내는 [Claude에서 마이그레이션](/ko/install/migrating-claude)을 참조하세요.
</Tip>

### Claude가 가져오는 항목

- 프로젝트 `CLAUDE.md` 및 `.claude/CLAUDE.md`를 OpenClaw 에이전트 작업 영역으로 가져옵니다.
- 사용자 `~/.claude/CLAUDE.md`를 작업 영역 `USER.md`에 추가합니다.
- 프로젝트 `.mcp.json`, Claude Code `~/.claude.json`, Claude Desktop `claude_desktop_config.json`의 MCP 서버 정의.
- `SKILL.md`를 포함하는 Claude skill 디렉터리.
- Claude 명령 Markdown 파일을 수동 호출 전용 OpenClaw skills로 변환합니다.

### 아카이브 및 수동 검토 상태

Claude hooks, permissions, environment defaults, local memory, path-scoped rules, subagents, caches, plans, project history는 마이그레이션 보고서에 보존되거나 수동 검토 항목으로 보고됩니다. OpenClaw는 hooks를 실행하거나, 광범위한 allowlist를 복사하거나, OAuth/Desktop 자격 증명 상태를 자동으로 가져오지 않습니다.

## Hermes 제공자

번들 Hermes 제공자는 기본적으로 `~/.hermes`에서 상태를 감지합니다. Hermes가 다른 위치에 있으면 `--from <path>`를 사용하세요.

### Hermes가 가져오는 항목

- `config.yaml`의 기본 모델 구성.
- `providers` 및 `custom_providers`의 구성된 모델 제공자와 사용자 지정 OpenAI 호환 엔드포인트.
- `mcp_servers` 또는 `mcp.servers`의 MCP 서버 정의.
- `SOUL.md` 및 `AGENTS.md`를 OpenClaw 에이전트 작업 영역으로 가져옵니다.
- `memories/MEMORY.md` 및 `memories/USER.md`를 작업 영역 메모리 파일에 추가합니다.
- OpenClaw 파일 메모리용 메모리 구성 기본값과 Honcho 같은 외부 메모리 제공자를 위한 아카이브 또는 수동 검토 항목.
- `skills/<name>/` 아래에 `SKILL.md` 파일을 포함하는 Skills.
- `skills.config`의 Skills별 구성 값.
- `.env`의 지원되는 API 키. 단, `--include-secrets`가 있을 때만 해당합니다.

### 지원되는 `.env` 키

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 아카이브 전용 상태

OpenClaw가 안전하게 해석할 수 없는 Hermes 상태는 수동 검토를 위해 마이그레이션 보고서로 복사되지만, 실시간 OpenClaw 구성 또는 자격 증명으로 로드되지는 않습니다. 이렇게 하면 불투명하거나 안전하지 않은 상태를 OpenClaw가 자동으로 실행하거나 신뢰할 수 있는 것처럼 가장하지 않고도 보존할 수 있습니다.

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

마이그레이션 원본은 Plugin입니다. Plugin은 `openclaw.plugin.json`에서 제공자 ID를 선언합니다.

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

런타임에 Plugin은 `api.registerMigrationProvider(...)`를 호출합니다. 제공자는 `detect`, `plan`, `apply`를 구현합니다. 코어는 CLI 오케스트레이션, 백업 정책, 프롬프트, JSON 출력, 충돌 사전 점검을 담당합니다. 코어는 검토된 계획을 `apply(ctx, plan)`에 전달하며, 제공자는 호환성을 위해 해당 인수가 없을 때만 계획을 다시 만들 수 있습니다.

제공자 Plugin은 항목 생성 및 요약 개수에 `openclaw/plugin-sdk/migration`을 사용할 수 있으며, 충돌 인식 파일 복사, 아카이브 전용 보고서 복사, 캐시된 config-runtime 래퍼, 마이그레이션 보고서에는 `openclaw/plugin-sdk/migration-runtime`을 사용할 수 있습니다.

## 온보딩 통합

제공자가 알려진 원본을 감지하면 온보딩에서 마이그레이션을 제공할 수 있습니다. `openclaw onboard --flow import`와 `openclaw setup --wizard --import-from hermes`는 모두 동일한 Plugin 마이그레이션 제공자를 사용하며, 적용 전에 여전히 미리보기를 표시합니다.

<Note>
온보딩 가져오기는 새 OpenClaw 설정이 필요합니다. 이미 로컬 상태가 있다면 먼저 구성, 자격 증명, 세션, 작업 영역을 재설정하세요. 기존 설정에 대한 백업 후 덮어쓰기 또는 병합 가져오기는 기능 게이트로 제한됩니다.
</Note>

## 관련 항목

- [Hermes에서 마이그레이션](/ko/install/migrating-hermes): 사용자 대상 안내.
- [Claude에서 마이그레이션](/ko/install/migrating-claude): 사용자 대상 안내.
- [마이그레이션](/ko/install/migrating): OpenClaw를 새 머신으로 이동합니다.
- [Doctor](/ko/gateway/doctor): 마이그레이션 적용 후 상태 점검.
- [Plugins](/ko/tools/plugin): Plugin 설치 및 등록.
