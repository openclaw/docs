---
read_when:
    - OpenClaw을 새 노트북이나 서버로 이전합니다
    - 다른 에이전트 시스템에서 이전해 오면서 상태를 유지하려는 경우
    - 기존 위치의 Plugin을 업그레이드하고 있습니다
summary: '마이그레이션 허브: 시스템 간 가져오기, 머신 간 이동 및 Plugin 업그레이드'
title: 마이그레이션 가이드
x-i18n:
    generated_at: "2026-07-12T15:27:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw은 다른 에이전트 시스템에서 가져오기, 기존 설치를 새 머신으로 이동하기, Plugin을 현재 위치에서 업그레이드하기라는 세 가지 마이그레이션 경로를 지원합니다.

## 다른 에이전트 시스템에서 가져오기

번들 마이그레이션 공급자는 지침, MCP 서버, Skills, 모델 구성 및 (선택적으로) API 키를 OpenClaw으로 가져옵니다. 변경 전에 계획을 미리 보여 주고, 보고서에서는 비밀 정보를 가리며, 적용 작업은 검증된 백업으로 보호됩니다.

<CardGroup cols={2}>
  <Card title="Claude에서 마이그레이션" href="/ko/install/migrating-claude" icon="brain">
    `CLAUDE.md`, MCP 서버, Skills 및 프로젝트 명령을 포함한 Claude Code와 Claude Desktop 상태를 가져옵니다.
  </Card>
  <Card title="Hermes에서 마이그레이션" href="/ko/install/migrating-hermes" icon="feather">
    Hermes 구성, 공급자, MCP 서버, 메모리, Skills 및 지원되는 `.env` 키를 가져옵니다.
  </Card>
</CardGroup>

CLI 진입점은 [`openclaw migrate`](/ko/cli/migrate)입니다. 알려진 소스를 감지하면 온보딩에서도 마이그레이션을 제안할 수 있습니다(`openclaw onboard --flow import`).

## OpenClaw을 새 머신으로 이동하기

다음을 보존하려면 **상태 디렉터리**(기본값은 `~/.openclaw/`)와 **워크스페이스**를 복사하십시오.

- **구성** — `openclaw.json` 및 모든 Gateway 설정.
- **인증** — 에이전트별 `auth-profiles.json`(API 키와 OAuth), 그리고 `credentials/` 아래의 모든 채널 또는 공급자 상태.
- **세션** — 대화 기록 및 에이전트 상태.
- **채널 상태** — WhatsApp 로그인, Telegram 세션 등.
- **워크스페이스 파일** — `MEMORY.md`, `USER.md`, Skills 및 프롬프트.

<Tip>
이전 머신에서 `openclaw status`를 실행하여 상태 디렉터리 경로를 확인하십시오. 사용자 지정 프로필은 `~/.openclaw-<profile>/` 또는 `OPENCLAW_STATE_DIR`로 설정한 경로를 사용합니다.
</Tip>

### 마이그레이션 단계

<Steps>
  <Step title="Gateway 중지 및 백업">
    **이전** 머신에서 복사 도중 파일이 변경되지 않도록 Gateway를 중지한 후 압축하십시오.

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    여러 프로필(예: `~/.openclaw-work`)을 사용하는 경우 각각 별도로 압축하십시오.

  </Step>

  <Step title="새 머신에 OpenClaw 설치">
    새 머신에 CLI(필요한 경우 Node도)를 [설치](/ko/install)하십시오. 온보딩에서 새로운 `~/.openclaw/`을 생성해도 괜찮습니다. 다음 단계에서 덮어씁니다.
  </Step>

  <Step title="상태 디렉터리 및 워크스페이스 복사">
    `scp`, `rsync -a` 또는 외장 드라이브를 통해 압축 파일을 전송한 후 압축을 해제하십시오.

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    숨김 디렉터리가 포함되었는지, 파일 소유권이 Gateway를 실행할 사용자와 일치하는지 확인하십시오.

  </Step>

  <Step title="Doctor 실행 및 확인">
    새 머신에서 [Doctor](/ko/gateway/doctor)를 실행하여 구성 마이그레이션을 적용하고 서비스를 복구하십시오.

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Telegram 또는 Discord에서 기본 환경 변수 대체 경로(`TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`)를 사용하는 경우, 비밀 값을 출력하지 않고 마이그레이션된 상태 디렉터리의 `.env`에 해당 키가 포함되어 있는지 확인하십시오.

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

활성화된 기본 Telegram 또는 Discord 계정에 구성된 토큰이 없고 Doctor 프로세스에서 일치하는 환경 변수를 사용할 수 없는 경우에도 `openclaw doctor`가 경고합니다.

### 일반적인 문제

<AccordionGroup>
  <Accordion title="프로필 또는 상태 디렉터리 불일치">
    이전 Gateway에서는 `--profile` 또는 `OPENCLAW_STATE_DIR`을 사용했지만 새 Gateway에서는 사용하지 않으면 채널이 로그아웃된 것으로 표시되고 세션이 비어 있게 됩니다. 마이그레이션한 것과 **동일한** 프로필 또는 상태 디렉터리로 Gateway를 시작한 후 `openclaw doctor`를 다시 실행하십시오.
  </Accordion>

  <Accordion title="openclaw.json만 복사">
    구성 파일만으로는 충분하지 않습니다. 모델 인증 프로필은 `agents/<agentId>/agent/auth-profiles.json` 아래에 있고, 채널 및 공급자 상태는 `credentials/` 아래에 있습니다. 항상 **전체** 상태 디렉터리를 마이그레이션하십시오.
  </Accordion>

  <Accordion title="권한 및 소유권">
    루트 사용자로 복사했거나 사용자를 전환한 경우 Gateway에서 자격 증명을 읽지 못할 수 있습니다. 상태 디렉터리와 워크스페이스의 소유자가 Gateway를 실행하는 사용자인지 확인하십시오.
  </Accordion>

  <Accordion title="원격 모드">
    UI가 **원격** Gateway를 가리키는 경우 세션과 워크스페이스는 원격 호스트에 있습니다. 로컬 노트북이 아니라 Gateway 호스트 자체를 마이그레이션하십시오. [FAQ](/ko/help/faq#where-things-live-on-disk)를 참조하십시오.
  </Accordion>

  <Accordion title="백업의 비밀 정보">
    상태 디렉터리에는 인증 프로필, 채널 자격 증명 및 기타 공급자 상태가 포함됩니다. 백업을 암호화하여 보관하고, 안전하지 않은 전송 채널을 피하며, 노출이 의심되면 키를 교체하십시오.
  </Accordion>
</AccordionGroup>

### 확인 체크리스트

새 머신에서 다음을 확인하십시오.

- [ ] `openclaw status`에 Gateway가 실행 중인 것으로 표시됩니다.
- [ ] 채널이 계속 연결되어 있습니다(다시 페어링할 필요가 없음).
- [ ] 대시보드가 열리고 기존 세션이 표시됩니다.
- [ ] 워크스페이스 파일(메모리, 구성)이 존재합니다.

## 현재 위치에서 Plugin 업그레이드하기

현재 위치에서 Plugin을 업그레이드하면 동일한 Plugin ID와 구성 키가 유지되지만 디스크의 상태가 현재 레이아웃으로 이동할 수 있습니다. Plugin별 업그레이드 가이드는 해당 채널 문서와 함께 제공됩니다.

- [Matrix 마이그레이션](/ko/channels/matrix-migration): 암호화된 상태의 복구 제한, 자동 스냅샷 동작 및 수동 복구 명령.

## 관련 문서

- [`openclaw migrate`](/ko/cli/migrate): 시스템 간 가져오기에 대한 CLI 참조.
- [설치 개요](/ko/install): 모든 설치 방법.
- [Doctor](/ko/gateway/doctor): 마이그레이션 후 상태 점검.
- [제거](/ko/install/uninstall): OpenClaw을 깔끔하게 제거하는 방법.
