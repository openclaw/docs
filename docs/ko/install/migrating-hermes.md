---
read_when:
    - Hermes에서 이전하면서 모델 구성, 프롬프트, 메모리 및 Skills를 그대로 유지하려고 합니다
    - OpenClaw이 자동으로 가져오는 항목과 보관 전용으로 유지되는 항목을 알아봅니다.
    - 깔끔한 스크립트 기반 마이그레이션 경로가 필요합니다(CI, 새 노트북, 자동화)
summary: 미리 보고 되돌릴 수 있는 가져오기를 통해 Hermes에서 OpenClaw로 이전하기
title: Hermes에서 마이그레이션하기
x-i18n:
    generated_at: "2026-07-12T15:22:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

번들로 제공되는 Hermes 마이그레이션 프로바이더는 `~/.hermes`의 상태를 감지하고, 적용 전에 모든 변경 사항을 미리 보여 주며, 계획과 보고서에서 비밀을 마스킹하고, 어떤 항목도 건드리기 전에 검증된 OpenClaw 백업을 생성합니다.

<Note>
가져오려면 새로운 OpenClaw 설정이 필요합니다. 로컬 OpenClaw 상태가 이미 있다면 먼저 구성, 자격 증명, 세션 및 작업 공간을 초기화하거나, 계획을 검토한 후 `--overwrite`와 함께 `openclaw migrate apply hermes`를 직접 사용하십시오.
</Note>

## 가져오는 두 가지 방법

<Tabs>
  <Tab title="온보딩 마법사">
    `~/.hermes`에서 Hermes를 감지하고 적용 전에 미리보기를 표시합니다.

    ```bash
    openclaw onboard --flow import
    ```

    또는 특정 소스를 지정합니다.

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    스크립트로 실행하거나 반복 실행하려면 `openclaw migrate`를 사용하십시오. 전체 레퍼런스는 [`openclaw migrate`](/ko/cli/migrate)를 참조하십시오.

    ```bash
    openclaw migrate hermes --dry-run    # 미리보기만 수행
    openclaw migrate apply hermes --yes  # 확인을 건너뛰고 적용
    ```

    Hermes가 `~/.hermes` 외부에 있으면 `--from <path>`를 추가하십시오.

  </Tab>
</Tabs>

## 가져오는 항목

<AccordionGroup>
  <Accordion title="모델 구성">
    - Hermes `config.yaml`의 기본 모델 선택 항목입니다.
    - `providers` 및 `custom_providers`의 구성된 모델 프로바이더와 사용자 지정 OpenAI 호환 엔드포인트입니다.

  </Accordion>
  <Accordion title="MCP 서버">
    `mcp_servers` 또는 `mcp.servers`의 MCP 서버 정의입니다.
  </Accordion>
  <Accordion title="작업 공간 파일">
    - `SOUL.md` 및 `AGENTS.md`를 OpenClaw 에이전트 작업 공간으로 복사합니다.
    - `memories/MEMORY.md` 및 `memories/USER.md`는 일치하는 OpenClaw 메모리 파일을 덮어쓰지 않고 해당 파일에 **추가**합니다.

  </Accordion>
  <Accordion title="메모리 구성">
    OpenClaw 파일 메모리의 기본 메모리 구성입니다. Honcho와 같은 외부 메모리 프로바이더는 의도적으로 이전할 수 있도록 보관 또는 수동 검토 항목으로 기록됩니다.
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 아래에 `SKILL.md` 파일이 있는 Skills를 `skills.config`의 Skill별 구성 값과 함께 복사합니다.
  </Accordion>
  <Accordion title="인증 자격 증명">
    대화형 `openclaw migrate`는 인증 자격 증명을 가져오기 전에 묻고, 기본적으로 예가 선택되어 있습니다. 동의하면 OpenCode의 `auth.json`에서 OpenCode OpenAI OAuth 및 GitHub Copilot 항목을 가져오고, [지원되는 Hermes `.env` 키](/ko/cli/migrate#supported-env-keys)도 가져옵니다. Hermes 자체 `auth.json`의 OAuth 항목은 레거시 상태이므로 실제 인증으로 가져오지 않고 수동 재인증/Doctor 항목으로 표시됩니다. 비대화형 실행에서 자격 증명을 가져오려면 `--include-secrets`를 사용하고, 자격 증명 가져오기를 완전히 건너뛰려면 `--no-auth-credentials`를 사용하거나, 온보딩 마법사의 `--import-secrets` 플래그를 사용하십시오.
  </Accordion>
</AccordionGroup>

## 보관 전용으로 유지되는 항목

프로바이더는 다음 항목을 수동 검토를 위해 마이그레이션 보고서 디렉터리에 복사하지만, 실제 OpenClaw 구성 또는 자격 증명에는 로드하지 **않습니다**.

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

시스템 간에 형식과 신뢰 전제가 달라질 수 있으므로 OpenClaw는 이 상태를 자동으로 실행하거나 신뢰하지 않습니다. 보관 파일을 검토한 후 필요한 항목을 직접 옮기십시오.

## 권장 흐름

<Steps>
  <Step title="계획 미리보기">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    계획에는 충돌, 건너뛴 항목, 민감한 항목을 포함하여 변경될 모든 항목이 나열됩니다. 중첩된 비밀처럼 보이는 키는 출력에서 마스킹됩니다.

  </Step>
  <Step title="백업과 함께 적용">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw는 적용 전에 백업을 생성하고 검증합니다. 이 비대화형 예시는 비밀이 아닌 상태만 가져옵니다. 자격 증명 프롬프트에 대화형으로 응답하려면 `--yes` 없이 실행하고, 무인 실행에 지원되는 자격 증명을 포함하려면 `--include-secrets`를 추가하십시오.

  </Step>
  <Step title="Doctor 실행">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ko/gateway/doctor)는 보류 중인 구성 마이그레이션을 다시 적용하고 가져오기 중에 발생한 문제를 확인합니다.

  </Step>
  <Step title="재시작 및 확인">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway가 정상 상태이고 가져온 모델, 메모리 및 Skills가 로드되었는지 확인하십시오.

  </Step>
</Steps>

## 충돌 처리

계획에서 충돌을 보고하면 대상에 파일이나 구성 값이 이미 존재하는 것이므로 적용을 계속하지 않습니다.

<Warning>
기존 대상을 의도적으로 교체하려는 경우에만 `--overwrite`를 사용하여 다시 실행하십시오. 프로바이더는 덮어쓴 파일에 대해 마이그레이션 보고서 디렉터리에 항목별 백업을 계속 생성할 수 있습니다.
</Warning>

새로 설치한 환경에서는 충돌이 드뭅니다. 일반적으로 사용자가 이미 편집한 설정을 대상으로 가져오기를 다시 실행할 때 발생합니다.

적용 도중 충돌이 발생하면(예: 구성 파일에서 예기치 않은 경합 발생) Hermes는 종속된 나머지 구성 항목을 부분적으로 작성하지 않고 사유가 `blocked by earlier apply conflict`인 `skipped`로 표시합니다. 마이그레이션 보고서에는 차단된 각 항목이 기록되므로 원래 충돌을 해결한 후 가져오기를 다시 실행할 수 있습니다.

## 비밀

대화형 `openclaw migrate`는 감지된 인증 자격 증명을 가져올지 묻고, 기본적으로 예가 선택되어 있습니다.

- 동의하면 OpenCode의 `auth.json`에서 OpenCode OpenAI OAuth 및 GitHub Copilot 항목을 가져오고, [지원되는 `.env` 키](/ko/cli/migrate#supported-env-keys)도 가져옵니다. 대신 Hermes 자체 `auth.json`의 OAuth 항목은 수동 OpenAI 재인증 또는 Doctor 복구 대상으로 보고됩니다.
- 비밀이 아닌 상태만 가져오려면 `--no-auth-credentials`를 사용하거나 프롬프트에서 아니요로 응답하십시오.
- 무인 `--yes` 실행에서 자격 증명을 가져오려면 `--include-secrets`를 사용하십시오.
- 마법사에서 자격 증명을 가져오려면 온보딩 마법사의 `--import-secrets` 플래그를 사용하십시오.

## 자동화를 위한 JSON 출력

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json`을 사용하고 `--yes`는 사용하지 않으면 적용 명령이 계획을 출력하며 상태를 변경하지 않습니다. 이는 CI 및 공유 스크립트에 가장 안전한 모드입니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="충돌로 인해 적용이 거부됨">
    계획 출력을 살펴보십시오. 각 충돌에는 소스 경로와 기존 대상이 표시됩니다. 항목별로 건너뛸지, 대상을 편집할지, `--overwrite`를 사용하여 다시 실행할지 결정하십시오.
  </Accordion>
  <Accordion title="Hermes가 ~/.hermes 외부에 있음">
    `--from /actual/path`(CLI) 또는 `--import-source /actual/path`(온보딩)를 전달하십시오.
  </Accordion>
  <Accordion title="기존 설정에서 온보딩 가져오기가 거부됨">
    온보딩 가져오기에는 새로운 설정이 필요합니다. 상태를 초기화하고 다시 온보딩하거나, `--overwrite` 및 명시적 백업 제어를 지원하는 `openclaw migrate apply hermes`를 직접 사용하십시오.
  </Accordion>
  <Accordion title="API 키를 가져오지 못함">
    대화형 `openclaw migrate`는 자격 증명 프롬프트에 동의한 경우에만 API 키를 가져옵니다. 비대화형 `--yes` 실행에는 `--include-secrets`가 필요하고, 온보딩 가져오기에는 `--import-secrets`가 필요합니다. [지원되는 `.env` 키](/ko/cli/migrate#supported-env-keys)만 인식되며, 다른 `.env` 변수는 무시됩니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

- [`openclaw migrate`](/ko/cli/migrate): 전체 CLI 레퍼런스, Plugin 계약 및 JSON 구조입니다.
- [온보딩](/ko/cli/onboard): 마법사 흐름 및 비대화형 플래그입니다.
- [마이그레이션](/ko/install/migrating): 시스템 간에 OpenClaw 설치를 옮기는 방법입니다.
- [Doctor](/ko/gateway/doctor): 마이그레이션 후 상태 검사입니다.
- [에이전트 작업 공간](/ko/concepts/agent-workspace): `SOUL.md`, `AGENTS.md` 및 메모리 파일이 위치하는 곳입니다.
