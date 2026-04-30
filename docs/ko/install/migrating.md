---
read_when:
    - OpenClaw를 새 노트북 또는 서버로 이전하고 있습니다
    - 다른 에이전트 시스템에서 전환하여 상태를 유지하려는 경우
    - 기존 Plugin을 제자리에서 업그레이드하고 있습니다
summary: '마이그레이션 허브: 시스템 간 가져오기, 머신 간 이전, Plugin 업그레이드'
title: 마이그레이션 가이드
x-i18n:
    generated_at: "2026-04-30T06:38:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw는 세 가지 마이그레이션 경로를 지원합니다: 다른 에이전트 시스템에서 가져오기, 기존 설치를 새 머신으로 이동하기, Plugin을 제자리에서 업그레이드하기.

## 다른 에이전트 시스템에서 가져오기

번들로 제공되는 마이그레이션 공급자를 사용해 지침, MCP 서버, Skills, 모델 구성, 그리고 (선택 사항) API 키를 OpenClaw로 가져오세요. 변경 전에 계획이 미리 표시되고, 보고서에서는 비밀 값이 마스킹되며, 적용 작업은 검증된 백업으로 보호됩니다.

<CardGroup cols={2}>
  <Card title="Claude에서 마이그레이션" href="/ko/install/migrating-claude" icon="brain">
    `CLAUDE.md`, MCP 서버, Skills, 프로젝트 명령을 포함한 Claude Code 및 Claude Desktop 상태를 가져옵니다.
  </Card>
  <Card title="Hermes에서 마이그레이션" href="/ko/install/migrating-hermes" icon="feather">
    Hermes 구성, 공급자, MCP 서버, 메모리, Skills, 지원되는 `.env` 키를 가져옵니다.
  </Card>
</CardGroup>

CLI 진입점은 [`openclaw migrate`](/ko/cli/migrate)입니다. 온보딩은 알려진 원본을 감지하면 마이그레이션도 제안할 수 있습니다(`openclaw onboard --flow import`).

## OpenClaw를 새 머신으로 이동하기

**상태 디렉터리**(기본값: `~/.openclaw/`)와 **워크스페이스**를 복사하여 다음을 보존하세요.

- **구성** — `openclaw.json` 및 모든 Gateway 설정.
- **인증** — 에이전트별 `auth-profiles.json`(API 키와 OAuth), 그리고 `credentials/` 아래의 모든 채널 또는 공급자 상태.
- **세션** — 대화 기록 및 에이전트 상태.
- **채널 상태** — WhatsApp 로그인, Telegram 세션 등.
- **워크스페이스 파일** — `MEMORY.md`, `USER.md`, Skills, 프롬프트.

<Tip>
이전 머신에서 `openclaw status`를 실행해 상태 디렉터리 경로를 확인하세요. 사용자 지정 프로필은 `~/.openclaw-<profile>/` 또는 `OPENCLAW_STATE_DIR`로 설정한 경로를 사용합니다.
</Tip>

### 마이그레이션 단계

<Steps>
  <Step title="Gateway 중지 및 백업">
    **이전** 머신에서 복사 중 파일이 변경되지 않도록 Gateway를 중지한 다음, 아카이브를 만드세요.

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    여러 프로필(예: `~/.openclaw-work`)을 사용하는 경우 각각 따로 아카이브하세요.

  </Step>

  <Step title="새 머신에 OpenClaw 설치">
    새 머신에 CLI(필요한 경우 Node도)를 [설치](/ko/install)하세요. 온보딩이 새 `~/.openclaw/`를 만들어도 괜찮습니다. 다음 단계에서 덮어쓰게 됩니다.
  </Step>

  <Step title="상태 디렉터리 및 워크스페이스 복사">
    `scp`, `rsync -a` 또는 외장 드라이브로 아카이브를 전송한 다음 압축을 푸세요.

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    숨김 디렉터리가 포함되었는지, 파일 소유권이 Gateway를 실행할 사용자와 일치하는지 확인하세요.

  </Step>

  <Step title="Doctor 실행 및 검증">
    새 머신에서 [Doctor](/ko/gateway/doctor)를 실행해 구성 마이그레이션을 적용하고 서비스를 복구하세요.

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### 일반적인 문제

<AccordionGroup>
  <Accordion title="프로필 또는 상태 디렉터리 불일치">
    이전 Gateway가 `--profile` 또는 `OPENCLAW_STATE_DIR`를 사용했는데 새 Gateway가 사용하지 않으면, 채널은 로그아웃된 것처럼 보이고 세션은 비어 있게 됩니다. 마이그레이션한 **동일한** 프로필 또는 상태 디렉터리로 Gateway를 시작한 다음 `openclaw doctor`를 다시 실행하세요.
  </Accordion>

  <Accordion title="openclaw.json만 복사">
    구성 파일만으로는 충분하지 않습니다. 모델 인증 프로필은 `agents/<agentId>/agent/auth-profiles.json` 아래에 있고, 채널 및 공급자 상태는 `credentials/` 아래에 있습니다. 항상 **전체** 상태 디렉터리를 마이그레이션하세요.
  </Accordion>

  <Accordion title="권한 및 소유권">
    root로 복사했거나 사용자를 변경했다면 Gateway가 자격 증명을 읽지 못할 수 있습니다. 상태 디렉터리와 워크스페이스가 Gateway를 실행하는 사용자의 소유인지 확인하세요.
  </Accordion>

  <Accordion title="원격 모드">
    UI가 **원격** Gateway를 가리키는 경우 세션과 워크스페이스는 원격 호스트가 소유합니다. 로컬 노트북이 아니라 Gateway 호스트 자체를 마이그레이션하세요. [FAQ](/ko/help/faq#where-things-live-on-disk)를 참조하세요.
  </Accordion>

  <Accordion title="백업의 비밀 값">
    상태 디렉터리에는 인증 프로필, 채널 자격 증명, 기타 공급자 상태가 포함됩니다. 백업은 암호화하여 보관하고, 안전하지 않은 전송 채널은 피하며, 노출이 의심되면 키를 교체하세요.
  </Accordion>
</AccordionGroup>

### 검증 체크리스트

새 머신에서 다음을 확인하세요.

- [ ] `openclaw status`에 Gateway가 실행 중으로 표시됩니다.
- [ ] 채널이 계속 연결되어 있습니다(다시 페어링할 필요 없음).
- [ ] 대시보드가 열리고 기존 세션이 표시됩니다.
- [ ] 워크스페이스 파일(메모리, 구성)이 존재합니다.

## Plugin을 제자리에서 업그레이드하기

제자리 Plugin 업그레이드는 동일한 Plugin ID와 구성 키를 보존하지만, 디스크상의 상태를 현재 레이아웃으로 이동할 수 있습니다. Plugin별 업그레이드 가이드는 해당 채널과 함께 제공됩니다.

- [Matrix 마이그레이션](/ko/channels/matrix-migration): 암호화된 상태 복구 제한, 자동 스냅샷 동작, 수동 복구 명령.

## 관련 항목

- [`openclaw migrate`](/ko/cli/migrate): 시스템 간 가져오기를 위한 CLI 참조.
- [설치 개요](/ko/install): 모든 설치 방법.
- [Doctor](/ko/gateway/doctor): 마이그레이션 후 상태 점검.
- [제거](/ko/install/uninstall): OpenClaw를 깔끔하게 제거하기.
