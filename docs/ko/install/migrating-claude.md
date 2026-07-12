---
read_when:
    - Claude Code 또는 Claude Desktop에서 전환하면서 지침, MCP 서버 및 Skills를 그대로 유지하려고 합니다.
    - OpenClaw가 자동으로 가져오는 항목과 아카이브에만 유지되는 항목을 이해해야 합니다
summary: 미리보기 가능한 가져오기를 사용하여 Claude Code 및 Claude Desktop의 로컬 상태를 OpenClaw로 이전합니다
title: Claude에서 마이그레이션하기
x-i18n:
    generated_at: "2026-07-12T15:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw은 번들로 제공되는 Claude 마이그레이션 제공자를 통해 로컬 Claude 상태를 가져옵니다. 제공자는 상태를 변경하기 전에 모든 항목을 미리 보여 주고, 계획과 보고서에서 비밀을 가리며, 적용 전에 검증된 백업을 생성합니다.

<Note>
온보딩 가져오기는 새로운 OpenClaw 설정에서만 가능합니다. 이미 로컬 OpenClaw 상태가 있다면 먼저 구성, 자격 증명, 세션, 워크스페이스를 초기화하거나, 계획을 검토한 후 `--overwrite`와 함께 `openclaw migrate`를 직접 사용하십시오.
</Note>

## 두 가지 가져오기 방법

<Tabs>
  <Tab title="온보딩 마법사">
    마법사는 로컬 Claude 상태를 감지하면 Claude 옵션을 제공합니다.

    ```bash
    openclaw onboard --flow import
    ```

    또는 특정 소스를 지정하십시오.

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    스크립트 실행이나 반복 가능한 실행에는 `openclaw migrate`를 사용하십시오. 전체 참고 자료는 [`openclaw migrate`](/ko/cli/migrate)를 참조하십시오.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    특정 Claude Code 홈 또는 프로젝트 루트를 가져오려면 `--from <path>`를 추가하십시오.

  </Tab>
</Tabs>

## 가져오는 항목

<AccordionGroup>
  <Accordion title="지침 및 메모리">
    - 프로젝트 `CLAUDE.md` 및 `.claude/CLAUDE.md` 콘텐츠는 OpenClaw 에이전트 워크스페이스의 `AGENTS.md`에 복사되거나 추가됩니다.
    - 사용자 `~/.claude/CLAUDE.md` 콘텐츠는 워크스페이스의 `USER.md`에 추가됩니다.

  </Accordion>
  <Accordion title="MCP 서버">
    MCP 서버 정의가 있는 경우 프로젝트 `.mcp.json`, Claude Code `~/.claude.json`, Claude Desktop `claude_desktop_config.json`에서 가져옵니다.
  </Accordion>
  <Accordion title="Skills 및 명령">
    - `SKILL.md` 파일이 있는 Claude Skills는 OpenClaw 워크스페이스 Skills 디렉터리로 복사됩니다.
    - `.claude/commands/` 또는 `~/.claude/commands/` 아래의 Claude 명령 Markdown 파일은 `disable-model-invocation: true`가 설정된 OpenClaw Skills로 변환됩니다.

  </Accordion>
</AccordionGroup>

## 아카이브에만 보관되는 항목

제공자는 수동 검토를 위해 다음 항목을 마이그레이션 보고서에 복사하지만, 라이브 OpenClaw 구성에는 로드하지 **않습니다**.

- Claude 훅
- Claude 권한 및 광범위한 도구 허용 목록
- Claude 환경 기본값
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 또는 `~/.claude/agents/` 아래의 Claude 하위 에이전트
- Claude Code 캐시, 계획, 프로젝트 기록 디렉터리
- Claude Desktop 확장 프로그램 및 OS에 저장된 자격 증명

OpenClaw은 훅을 실행하거나, 권한 허용 목록을 신뢰하거나, 불투명한 OAuth 및 Desktop 자격 증명 상태를 자동으로 디코딩하지 않습니다. 아카이브를 검토한 후 필요한 항목을 수동으로 옮기십시오.

## 소스 선택

`--from`을 사용하지 않으면 OpenClaw은 `~/.claude`의 기본 Claude Code 홈, 샘플링된 Claude Code `~/.claude.json` 상태 파일, macOS의 Claude Desktop MCP 구성을 검사합니다.

`--from`이 프로젝트 루트를 가리키면 OpenClaw은 `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/`, `.mcp.json` 등 해당 프로젝트의 Claude 파일만 가져옵니다. 프로젝트 루트를 가져올 때는 전역 Claude 홈을 읽지 않습니다.

## 권장 절차

<Steps>
  <Step title="계획 미리 보기">
    ```bash
    openclaw migrate claude --dry-run
    ```

    계획에는 충돌, 건너뛴 항목, 중첩된 MCP `env` 또는 `headers` 필드에서 가려진 민감한 값을 포함하여 변경될 모든 항목이 나열됩니다.

  </Step>
  <Step title="백업과 함께 적용">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw은 적용 전에 백업을 생성하고 검증합니다.

  </Step>
  <Step title="Doctor 실행">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ko/gateway/doctor)는 가져오기 후 구성 또는 상태 문제를 확인합니다.

  </Step>
  <Step title="재시작 및 확인">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway가 정상 상태이고 가져온 지침, MCP 서버, Skills가 로드되었는지 확인하십시오.

  </Step>
</Steps>

## 충돌 처리

계획에서 충돌(대상에 파일 또는 구성 값이 이미 존재함)이 보고되면 적용을 계속하지 않습니다.

<Warning>
기존 대상을 의도적으로 교체하려는 경우에만 `--overwrite`로 다시 실행하십시오. 제공자는 덮어쓴 파일에 대해 마이그레이션 보고서 디렉터리에 항목별 백업을 계속 기록할 수 있습니다.
</Warning>

새 OpenClaw 설치에서는 충돌이 드뭅니다. 일반적으로 사용자 편집 내용이 이미 있는 설정에서 가져오기를 다시 실행할 때 발생합니다.

## 자동화를 위한 JSON 출력

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

대화형 터미널 외부에서 `migrate apply`를 실행하려면 `--yes`가 필요합니다. 이 옵션이 없으면 OpenClaw은 적용하지 않고 오류를 반환하므로 스크립트와 CI에서는 `--yes`를 명시적으로 전달해야 합니다. 먼저 `--dry-run --json`으로 미리 보고, 계획이 올바르면 `--json --yes`로 적용하십시오.

## 문제 해결

<AccordionGroup>
  <Accordion title="Claude 상태가 ~/.claude 외부에 있음">
    `--from /actual/path`(CLI) 또는 `--import-source /actual/path`(온보딩)를 전달하십시오.
  </Accordion>
  <Accordion title="기존 설정에서 온보딩이 가져오기를 거부함">
    온보딩 가져오기는 새로운 설정에서만 가능합니다. 상태를 초기화하고 온보딩을 다시 진행하거나, `--overwrite`와 명시적 백업 제어를 지원하는 `openclaw migrate apply claude`를 직접 사용하십시오.
  </Accordion>
  <Accordion title="Claude Desktop의 MCP 서버를 가져오지 못함">
    Claude Desktop은 플랫폼별 경로에서 `claude_desktop_config.json`을 읽습니다. OpenClaw이 자동으로 감지하지 못했다면 `--from`이 해당 파일의 디렉터리를 가리키도록 하십시오.
  </Accordion>
  <Accordion title="Claude 명령이 모델 호출이 비활성화된 Skills로 변환됨">
    의도된 동작입니다. Claude 명령은 사용자가 직접 실행하므로 OpenClaw은 이를 `disable-model-invocation: true`가 설정된 Skills로 가져옵니다. 에이전트가 자동으로 호출하게 하려면 각 Skill의 frontmatter를 편집하십시오.
  </Accordion>
</AccordionGroup>

## 관련 문서

- [`openclaw migrate`](/ko/cli/migrate): 전체 CLI 참고 자료, Plugin 계약, JSON 형식.
- [마이그레이션 가이드](/ko/install/migrating): 모든 마이그레이션 경로.
- [Hermes에서 마이그레이션하기](/ko/install/migrating-hermes): 다른 시스템 간 가져오기 경로.
- [온보딩](/ko/cli/onboard): 마법사 절차 및 비대화형 플래그.
- [Doctor](/ko/gateway/doctor): 마이그레이션 후 상태 검사.
- [에이전트 워크스페이스](/ko/concepts/agent-workspace): `AGENTS.md`, `USER.md`, Skills가 위치하는 곳.
