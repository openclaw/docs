---
read_when:
    - Claude Code 또는 Claude Desktop에서 이전해 왔으며 지침, MCP 서버, Skills를 유지하려는 경우
    - OpenClaw가 자동으로 가져오는 항목과 아카이브 전용으로 유지되는 항목을 이해해야 합니다
summary: 가져오기 미리보기를 통해 Claude Code 및 Claude Desktop 로컬 상태를 OpenClaw로 이동
title: Claude에서 마이그레이션하기
x-i18n:
    generated_at: "2026-04-30T06:37:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw는 번들로 제공되는 Claude 마이그레이션 공급자를 통해 로컬 Claude 상태를 가져옵니다. 공급자는 상태를 변경하기 전에 모든 항목을 미리 보여 주고, 계획과 보고서에서 비밀 값을 마스킹하며, 적용 전에 검증된 백업을 생성합니다.

<Note>
온보딩 가져오기는 새 OpenClaw 설정에서만 사용할 수 있습니다. 이미 로컬 OpenClaw 상태가 있다면 먼저 config, credentials, sessions, workspace를 초기화하거나, 계획을 검토한 뒤 `--overwrite`와 함께 `openclaw migrate`를 직접 사용하세요.
</Note>

## 가져오는 두 가지 방법

<Tabs>
  <Tab title="온보딩 마법사">
    마법사는 로컬 Claude 상태를 감지하면 Claude를 제안합니다.

    ```bash
    openclaw onboard --flow import
    ```

    또는 특정 소스를 지정합니다.

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    스크립트화하거나 반복 가능한 실행에는 `openclaw migrate`를 사용하세요. 전체 참조는 [`openclaw migrate`](/ko/cli/migrate)를 참고하세요.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    특정 Claude Code 홈 또는 프로젝트 루트를 가져오려면 `--from <path>`를 추가하세요.

  </Tab>
</Tabs>

## 가져오는 항목

<AccordionGroup>
  <Accordion title="지침과 메모리">
    - 프로젝트 `CLAUDE.md` 및 `.claude/CLAUDE.md` 콘텐츠가 OpenClaw 에이전트 워크스페이스 `AGENTS.md`로 복사되거나 추가됩니다.
    - 사용자 `~/.claude/CLAUDE.md` 콘텐츠가 워크스페이스 `USER.md`에 추가됩니다.

  </Accordion>
  <Accordion title="MCP 서버">
    MCP 서버 정의는 존재하는 경우 프로젝트 `.mcp.json`, Claude Code `~/.claude.json`, Claude Desktop `claude_desktop_config.json`에서 가져옵니다.
  </Accordion>
  <Accordion title="Skills와 명령">
    - `SKILL.md` 파일이 있는 Claude Skills는 OpenClaw 워크스페이스 Skills 디렉터리로 복사됩니다.
    - `.claude/commands/` 또는 `~/.claude/commands/` 아래의 Claude 명령 Markdown 파일은 `disable-model-invocation: true`가 설정된 OpenClaw Skills로 변환됩니다.

  </Accordion>
</AccordionGroup>

## 아카이브 전용으로 남는 항목

공급자는 수동 검토를 위해 다음 항목을 마이그레이션 보고서에 복사하지만, 실시간 OpenClaw config에는 로드하지 **않습니다**.

- Claude 훅
- Claude 권한과 광범위한 도구 허용 목록
- Claude 환경 기본값
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 또는 `~/.claude/agents/` 아래의 Claude 서브에이전트
- Claude Code 캐시, 계획, 프로젝트 기록 디렉터리
- Claude Desktop 확장과 OS에 저장된 credentials

OpenClaw는 훅 실행, 권한 허용 목록 신뢰, 불투명한 OAuth 및 Desktop credential 상태 디코딩을 자동으로 수행하지 않습니다. 아카이브를 검토한 뒤 필요한 항목을 직접 옮기세요.

## 소스 선택

`--from`이 없으면 OpenClaw는 기본 Claude Code 홈인 `~/.claude`, 샘플링된 Claude Code `~/.claude.json` 상태 파일, macOS의 Claude Desktop MCP config를 검사합니다.

`--from`이 프로젝트 루트를 가리키면 OpenClaw는 `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/`, `.mcp.json` 같은 해당 프로젝트의 Claude 파일만 가져옵니다. 프로젝트 루트 가져오기 중에는 전역 Claude 홈을 읽지 않습니다.

## 권장 흐름

<Steps>
  <Step title="계획 미리 보기">
    ```bash
    openclaw migrate claude --dry-run
    ```

    계획에는 충돌, 건너뛴 항목, 중첩된 MCP `env` 또는 `headers` 필드에서 마스킹된 민감한 값을 포함해 변경될 모든 항목이 나열됩니다.

  </Step>
  <Step title="백업과 함께 적용">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw는 적용 전에 백업을 생성하고 검증합니다.

  </Step>
  <Step title="doctor 실행">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ko/gateway/doctor)는 가져오기 후 config 또는 상태 문제를 확인합니다.

  </Step>
  <Step title="재시작 및 확인">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway가 정상이고 가져온 지침, MCP 서버, Skills가 로드되었는지 확인하세요.

  </Step>
</Steps>

## 충돌 처리

계획에서 충돌(대상에 파일 또는 config 값이 이미 존재함)을 보고하면 적용은 계속 진행하지 않습니다.

<Warning>
기존 대상을 교체하려는 의도가 명확할 때만 `--overwrite`로 다시 실행하세요. 공급자는 덮어쓴 파일에 대해서도 마이그레이션 보고서 디렉터리에 항목 수준 백업을 기록할 수 있습니다.
</Warning>

새 OpenClaw 설치에서는 충돌이 드뭅니다. 일반적으로 이미 사용자 편집이 있는 설정에서 가져오기를 다시 실행할 때 나타납니다.

## 자동화를 위한 JSON 출력

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--json`을 사용하고 `--yes`를 사용하지 않으면 apply는 계획을 출력하고 상태를 변경하지 않습니다. 이는 CI와 공유 스크립트에 가장 안전한 모드입니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="Claude 상태가 ~/.claude 외부에 있음">
    `--from /actual/path`(CLI) 또는 `--import-source /actual/path`(온보딩)를 전달하세요.
  </Accordion>
  <Accordion title="온보딩이 기존 설정에서 가져오기를 거부함">
    온보딩 가져오기는 새 설정이 필요합니다. 상태를 초기화하고 다시 온보딩하거나, `--overwrite`와 명시적 백업 제어를 지원하는 `openclaw migrate apply claude`를 직접 사용하세요.
  </Accordion>
  <Accordion title="Claude Desktop의 MCP 서버를 가져오지 못함">
    Claude Desktop은 플랫폼별 경로에서 `claude_desktop_config.json`을 읽습니다. OpenClaw가 자동으로 감지하지 못했다면 `--from`이 해당 파일의 디렉터리를 가리키도록 하세요.
  </Accordion>
  <Accordion title="Claude 명령이 모델 호출이 비활성화된 Skills가 됨">
    의도된 동작입니다. Claude 명령은 사용자가 트리거하므로 OpenClaw는 이를 `disable-model-invocation: true`가 설정된 Skills로 가져옵니다. 에이전트가 자동으로 호출하게 하려면 각 Skill의 frontmatter를 편집하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [`openclaw migrate`](/ko/cli/migrate): 전체 CLI 참조, Plugin 계약, JSON 형태.
- [마이그레이션 가이드](/ko/install/migrating): 모든 마이그레이션 경로.
- [Hermes에서 마이그레이션](/ko/install/migrating-hermes): 다른 교차 시스템 가져오기 경로.
- [온보딩](/ko/cli/onboard): 마법사 흐름과 비대화형 플래그.
- [Doctor](/ko/gateway/doctor): 마이그레이션 후 상태 확인.
- [에이전트 워크스페이스](/ko/concepts/agent-workspace): `AGENTS.md`, `USER.md`, Skills가 위치하는 곳.
