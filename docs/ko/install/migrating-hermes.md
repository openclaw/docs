---
read_when:
    - Hermes에서 이전하면서 모델 구성, 프롬프트, 메모리, Skills를 유지하려는 경우
    - OpenClaw가 자동으로 가져오는 항목과 아카이브 전용으로 유지되는 항목을 알고 싶습니다
    - 깔끔하고 스크립트화된 마이그레이션 경로가 필요합니다(CI, 새 노트북, 자동화)
summary: 미리보기 및 되돌리기가 가능한 가져오기로 Hermes에서 OpenClaw로 이전하기
title: Hermes에서 마이그레이션하기
x-i18n:
    generated_at: "2026-04-30T06:38:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw는 번들된 마이그레이션 제공자를 통해 Hermes 상태를 가져옵니다. 제공자는 상태를 변경하기 전에 모든 내용을 미리 보여주고, 계획과 보고서에서 비밀 정보를 마스킹하며, 적용 전에 검증된 백업을 생성합니다.

<Note>
가져오기는 새 OpenClaw 설정이 필요합니다. 이미 로컬 OpenClaw 상태가 있다면 먼저 구성, 자격 증명, 세션, 워크스페이스를 초기화하거나, 계획을 검토한 뒤 `--overwrite`와 함께 `openclaw migrate`를 직접 사용하세요.
</Note>

## 가져오는 두 가지 방법

<Tabs>
  <Tab title="온보딩 마법사">
    가장 빠른 경로입니다. 마법사는 `~/.hermes`에서 Hermes를 감지하고 적용 전에 미리 보기를 표시합니다.

    ```bash
    openclaw onboard --flow import
    ```

    또는 특정 소스를 지정하세요.

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    스크립트 기반 실행이나 반복 가능한 실행에는 `openclaw migrate`를 사용하세요. 전체 참조는 [`openclaw migrate`](/ko/cli/migrate)를 참고하세요.

    ```bash
    openclaw migrate hermes --dry-run    # 미리 보기만 수행
    openclaw migrate apply hermes --yes  # 확인을 건너뛰고 적용
    ```

    Hermes가 `~/.hermes` 외부에 있는 경우 `--from <path>`를 추가하세요.

  </Tab>
</Tabs>

## 가져오는 항목

<AccordionGroup>
  <Accordion title="모델 구성">
    - Hermes `config.yaml`의 기본 모델 선택.
    - `providers` 및 `custom_providers`의 구성된 모델 제공자와 사용자 지정 OpenAI 호환 엔드포인트.

  </Accordion>
  <Accordion title="MCP 서버">
    `mcp_servers` 또는 `mcp.servers`의 MCP 서버 정의.
  </Accordion>
  <Accordion title="워크스페이스 파일">
    - `SOUL.md`와 `AGENTS.md`는 OpenClaw 에이전트 워크스페이스로 복사됩니다.
    - `memories/MEMORY.md`와 `memories/USER.md`는 덮어쓰는 대신 일치하는 OpenClaw 메모리 파일에 **추가**됩니다.

  </Accordion>
  <Accordion title="메모리 구성">
    OpenClaw 파일 메모리의 메모리 구성 기본값입니다. Honcho 같은 외부 메모리 제공자는 신중하게 옮길 수 있도록 아카이브 또는 수동 검토 항목으로 기록됩니다.
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 아래에 `SKILL.md` 파일이 있는 Skills가 `skills.config`의 스킬별 구성 값과 함께 복사됩니다.
  </Accordion>
  <Accordion title="API 키(선택 사항)">
    지원되는 `.env` 키를 가져오려면 `--include-secrets`를 설정하세요: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. 이 플래그가 없으면 비밀 정보는 절대 복사되지 않습니다.
  </Accordion>
</AccordionGroup>

## 아카이브 전용으로 유지되는 항목

제공자는 수동 검토를 위해 다음 항목을 마이그레이션 보고서 디렉터리로 복사하지만, 실시간 OpenClaw 구성이나 자격 증명으로 로드하지는 **않습니다**.

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

형식과 신뢰 가정이 시스템 간에 달라질 수 있으므로 OpenClaw는 이 상태를 자동으로 실행하거나 신뢰하지 않습니다. 아카이브를 검토한 후 필요한 항목을 직접 옮기세요.

## 권장 흐름

<Steps>
  <Step title="계획 미리 보기">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    계획에는 충돌, 건너뛴 항목, 민감한 항목을 포함해 변경될 모든 내용이 나열됩니다. 계획 출력은 중첩된 비밀 정보처럼 보이는 키를 마스킹합니다.

  </Step>
  <Step title="백업과 함께 적용">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw는 적용 전에 백업을 생성하고 검증합니다. API 키를 가져와야 한다면 `--include-secrets`를 추가하세요.

  </Step>
  <Step title="doctor 실행">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ko/gateway/doctor)는 대기 중인 구성 마이그레이션을 다시 적용하고 가져오기 중에 발생한 문제를 확인합니다.

  </Step>
  <Step title="다시 시작하고 확인">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway가 정상이고 가져온 모델, 메모리, Skills가 로드되었는지 확인하세요.

  </Step>
</Steps>

## 충돌 처리

계획에서 충돌(대상에 파일 또는 구성 값이 이미 있음)이 보고되면 적용은 계속 진행하지 않습니다.

<Warning>
기존 대상을 교체하려는 의도가 명확할 때만 `--overwrite`로 다시 실행하세요. 제공자는 덮어쓴 파일에 대해 마이그레이션 보고서 디렉터리에 항목 수준 백업을 여전히 기록할 수 있습니다.
</Warning>

새 OpenClaw 설치에서는 충돌이 흔하지 않습니다. 일반적으로 이미 사용자 편집이 있는 설정에서 가져오기를 다시 실행할 때 나타납니다.

적용 중간에 충돌이 발생하면(예: 구성 파일에서 예상치 못한 경합) Hermes는 나머지 종속 구성 항목을 부분적으로 쓰는 대신 이유를 `blocked by earlier apply conflict`로 표시해 `skipped`로 표시합니다. 마이그레이션 보고서는 각 차단된 항목을 기록하므로 원래 충돌을 해결하고 가져오기를 다시 실행할 수 있습니다.

## 비밀 정보

비밀 정보는 기본적으로 절대 가져오지 않습니다.

- 먼저 `openclaw migrate apply hermes --yes`를 실행해 비밀 정보가 아닌 상태를 가져오세요.
- 지원되는 `.env` 키도 복사하려면 `--include-secrets`로 다시 실행하세요.
- SecretRef로 관리되는 자격 증명의 경우 가져오기가 완료된 뒤 SecretRef 소스를 구성하세요.

## 자동화를 위한 JSON 출력

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json`을 사용하고 `--yes`를 사용하지 않으면 적용은 계획을 출력하고 상태를 변경하지 않습니다. 이는 CI와 공유 스크립트에 가장 안전한 모드입니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="충돌로 인해 적용이 거부됨">
    계획 출력을 확인하세요. 각 충돌은 소스 경로와 기존 대상을 식별합니다. 항목별로 건너뛸지, 대상을 편집할지, `--overwrite`로 다시 실행할지 결정하세요.
  </Accordion>
  <Accordion title="Hermes가 ~/.hermes 외부에 있음">
    `--from /actual/path`(CLI) 또는 `--import-source /actual/path`(온보딩)를 전달하세요.
  </Accordion>
  <Accordion title="기존 설정에서 온보딩이 가져오기를 거부함">
    온보딩 가져오기는 새 설정이 필요합니다. 상태를 초기화하고 다시 온보딩하거나, `--overwrite`와 명시적 백업 제어를 지원하는 `openclaw migrate apply hermes`를 직접 사용하세요.
  </Accordion>
  <Accordion title="API 키를 가져오지 못함">
    `--include-secrets`가 필요하며, 위에 나열된 키만 인식됩니다. `.env`의 다른 변수는 무시됩니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [`openclaw migrate`](/ko/cli/migrate): 전체 CLI 참조, Plugin 계약, JSON 형태.
- [온보딩](/ko/cli/onboard): 마법사 흐름과 비대화형 플래그.
- [마이그레이션](/ko/install/migrating): OpenClaw 설치를 머신 간에 이동합니다.
- [Doctor](/ko/gateway/doctor): 마이그레이션 후 상태 점검.
- [에이전트 워크스페이스](/ko/concepts/agent-workspace): `SOUL.md`, `AGENTS.md`, 메모리 파일이 있는 위치.
