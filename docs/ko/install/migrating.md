---
read_when:
    - OpenClaw를 새 노트북 또는 서버로 이전하고 있습니다
    - 다른 에이전트 시스템에서 넘어왔고 상태를 유지하려는 경우
    - 현재 위치에서 Plugin을 업그레이드하고 있습니다
summary: '마이그레이션 허브: 시스템 간 가져오기, 머신 간 이전, Plugin 업그레이드'
title: 마이그레이션 가이드
x-i18n:
    generated_at: "2026-05-02T20:56:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw는 세 가지 마이그레이션 경로를 지원합니다. 다른 에이전트 시스템에서 가져오기, 기존 설치를 새 머신으로 이동하기, Plugin을 제자리에서 업그레이드하기입니다.

## 다른 에이전트 시스템에서 가져오기

번들로 제공되는 마이그레이션 제공자를 사용해 지침, MCP 서버, skills, 모델 구성, 그리고 (선택 사항) API 키를 OpenClaw로 가져오세요. 모든 변경 전에 계획을 미리 볼 수 있고, 보고서에서는 비밀 정보가 마스킹되며, 적용 작업은 검증된 백업으로 보호됩니다.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/ko/install/migrating-claude" icon="brain">
    `CLAUDE.md`, MCP 서버, skills, 프로젝트 명령을 포함해 Claude Code와 Claude Desktop 상태를 가져옵니다.
  </Card>
  <Card title="Migrating from Hermes" href="/ko/install/migrating-hermes" icon="feather">
    Hermes 구성, 제공자, MCP 서버, 메모리, skills, 지원되는 `.env` 키를 가져옵니다.
  </Card>
</CardGroup>

CLI 진입점은 [`openclaw migrate`](/ko/cli/migrate)입니다. 온보딩은 알려진 원본을 감지하면 마이그레이션을 제안할 수도 있습니다(`openclaw onboard --flow import`).

## OpenClaw를 새 머신으로 이동하기

다음을 보존하려면 **상태 디렉터리**(기본값은 `~/.openclaw/`)와 **작업공간**을 복사하세요.

- **구성** — `openclaw.json` 및 모든 Gateway 설정.
- **인증** — 에이전트별 `auth-profiles.json`(API 키와 OAuth 포함), 그리고 `credentials/` 아래의 모든 채널 또는 제공자 상태.
- **세션** — 대화 기록 및 에이전트 상태.
- **채널 상태** — WhatsApp 로그인, Telegram 세션 등.
- **작업공간 파일** — `MEMORY.md`, `USER.md`, skills, 프롬프트.

<Tip>
이전 머신에서 `openclaw status`를 실행해 상태 디렉터리 경로를 확인하세요. 사용자 지정 프로필은 `~/.openclaw-<profile>/` 또는 `OPENCLAW_STATE_DIR`로 설정한 경로를 사용합니다.
</Tip>

### 마이그레이션 단계

<Steps>
  <Step title="Stop the gateway and back up">
    **이전** 머신에서 파일이 복사 중에 변경되지 않도록 Gateway를 중지한 다음 아카이브를 만드세요.

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    여러 프로필을 사용하는 경우(예: `~/.openclaw-work`) 각각을 별도로 아카이브하세요.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    새 머신에 CLI(필요한 경우 Node도)를 [설치](/ko/install)하세요. 온보딩이 새 `~/.openclaw/`를 만들어도 괜찮습니다. 다음 단계에서 덮어쓰게 됩니다.
  </Step>

  <Step title="Copy state directory and workspace">
    `scp`, `rsync -a` 또는 외장 드라이브를 통해 아카이브를 전송한 다음 압축을 풉니다.

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    숨김 디렉터리가 포함되었는지, 파일 소유권이 Gateway를 실행할 사용자와 일치하는지 확인하세요.

  </Step>

  <Step title="Run doctor and verify">
    새 머신에서 [진단](/ko/gateway/doctor)을 실행해 구성 마이그레이션을 적용하고 서비스를 복구합니다.

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Telegram 또는 Discord가 기본 env 폴백(`TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`)을 사용하는 경우, 마이그레이션된 상태 디렉터리 `.env`에 해당 키가 있는지 비밀 값을 출력하지 않고 확인합니다.

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor`는 활성화된 기본 Telegram 또는 Discord 계정에 구성된 토큰이 없고 일치하는 env 변수를 doctor 프로세스에서 사용할 수 없을 때도 경고합니다.

### 일반적인 문제

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    이전 Gateway가 `--profile` 또는 `OPENCLAW_STATE_DIR`를 사용했지만 새 Gateway가 그렇지 않다면, 채널이 로그아웃된 것처럼 보이고 세션이 비어 있게 됩니다. 마이그레이션한 **동일한** 프로필 또는 상태 디렉터리로 Gateway를 시작한 다음 `openclaw doctor`를 다시 실행하세요.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    구성 파일만으로는 충분하지 않습니다. 모델 인증 프로필은 `agents/<agentId>/agent/auth-profiles.json` 아래에 있고, 채널 및 공급자 상태는 `credentials/` 아래에 있습니다. 항상 **전체** 상태 디렉터리를 마이그레이션하세요.
  </Accordion>

  <Accordion title="Permissions and ownership">
    root로 복사했거나 사용자를 전환했다면 Gateway가 자격 증명을 읽지 못할 수 있습니다. 상태 디렉터리와 작업 영역을 Gateway를 실행하는 사용자가 소유하도록 하세요.
  </Accordion>

  <Accordion title="Remote mode">
    UI가 **원격** Gateway를 가리키는 경우, 원격 호스트가 세션과 작업 영역을 소유합니다. 로컬 노트북이 아니라 Gateway 호스트 자체를 마이그레이션하세요. [FAQ](/ko/help/faq#where-things-live-on-disk)를 참고하세요.
  </Accordion>

  <Accordion title="Secrets in backups">
    상태 디렉터리에는 인증 프로필, 채널 자격 증명, 기타 공급자 상태가 포함되어 있습니다. 백업은 암호화해서 저장하고, 안전하지 않은 전송 채널을 피하며, 노출이 의심되면 키를 교체하세요.
  </Accordion>
</AccordionGroup>

### 확인 체크리스트

새 머신에서 다음을 확인합니다.

- [ ] `openclaw status`에 Gateway가 실행 중으로 표시됩니다.
- [ ] 채널이 여전히 연결되어 있습니다(다시 페어링할 필요 없음).
- [ ] 대시보드가 열리고 기존 세션이 표시됩니다.
- [ ] 작업 영역 파일(메모리, 구성)이 존재합니다.

## Plugin을 제자리에서 업그레이드

제자리 Plugin 업그레이드는 동일한 Plugin id와 구성 키를 유지하지만, 온디스크 상태를 현재 레이아웃으로 이동할 수 있습니다. Plugin별 업그레이드 가이드는 해당 채널 옆에 있습니다.

- [Matrix 마이그레이션](/ko/channels/matrix-migration): 암호화된 상태 복구 한계, 자동 스냅샷 동작, 수동 복구 명령.

## 관련 항목

- [`openclaw migrate`](/ko/cli/migrate): 교차 시스템 가져오기를 위한 CLI 참조.
- [설치 개요](/ko/install): 모든 설치 방법.
- [진단](/ko/gateway/doctor): 마이그레이션 후 상태 확인.
- [제거](/ko/install/uninstall): OpenClaw를 깔끔하게 제거하기.
