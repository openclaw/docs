---
read_when:
    - 컴퓨터에서 OpenClaw를 제거하려고 합니다
    - 제거 후에도 Gateway 서비스가 계속 실행 중입니다
summary: OpenClaw을 완전히 제거하기(CLI, 서비스, 상태, 작업 공간)
title: 제거
x-i18n:
    generated_at: "2026-07-12T15:27:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

두 가지 방법이 있습니다.

- `openclaw`가 아직 설치되어 있다면 **간편한 방법**을 사용합니다.
- CLI는 없어졌지만 서비스가 여전히 실행 중이라면 **수동 서비스 제거**를 사용합니다.

## 간편한 방법(CLI가 아직 설치된 경우)

권장: 기본 제공 제거 프로그램을 사용하십시오.

```bash
openclaw uninstall
```

상태를 제거해도 `--workspace`를 함께 선택하지 않는 한 구성된 워크스페이스 디렉터리는 유지됩니다.

제거될 항목을 미리 확인합니다(안전함).

```bash
openclaw uninstall --dry-run --all
```

비대화형 실행(자동화 / npx)입니다. 주의해서 사용하고 범위를 확인한 후에만 실행하십시오.

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

플래그: `--service`, `--state`, `--workspace`, `--app`은 개별 범위를 선택하며, `--all`은 네 가지 범위를 모두 선택합니다.

수동 단계(결과는 동일함):

1. Gateway 서비스를 중지합니다.

```bash
openclaw gateway stop
```

2. Gateway 서비스를 제거합니다(launchd/systemd/schtasks).

```bash
openclaw gateway uninstall
```

3. 상태와 구성을 삭제합니다.

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH`를 상태 디렉터리 외부의 사용자 지정 위치로 설정했다면 해당 파일도 삭제하십시오.
`~/.openclaw/workspace`처럼 상태 디렉터리 안에 있는 워크스페이스를 유지하려면 `rm -rf`를 실행하기 전에 다른 곳으로 옮기거나 상태 디렉터리의 내용을 선택적으로 삭제하십시오.

4. 워크스페이스를 삭제합니다(선택 사항, 에이전트 파일 제거).

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI 설치를 제거합니다(사용했던 방법 하나를 선택).

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS 앱을 설치했다면 다음을 실행합니다.

```bash
rm -rf /Applications/OpenClaw.app
```

참고:

- 프로필(`--profile` / `OPENCLAW_PROFILE`)을 사용했다면 각 상태 디렉터리에 대해 3단계를 반복하십시오(기본값은 `~/.openclaw-<profile>`).
- 원격 모드에서는 상태 디렉터리가 **Gateway 호스트**에 있으므로 1~4단계도 해당 호스트에서 실행하십시오.

## 수동 서비스 제거(CLI가 설치되지 않은 경우)

Gateway 서비스가 계속 실행 중이지만 `openclaw`가 없을 때 사용하십시오.

### macOS(launchd)

기본 레이블은 `ai.openclaw.gateway`입니다(프로필을 사용하는 경우 `ai.openclaw.<profile>`).

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

프로필을 사용했다면 레이블과 plist 이름을 `ai.openclaw.<profile>`로 바꾸십시오.

### Linux(systemd 사용자 단위)

기본 단위 이름은 `openclaw-gateway.service`입니다(또는 `openclaw-gateway-<profile>.service`). 이름 변경 전의 `clawdbot-gateway.service` 단위가 매우 오래된 설치에서 업그레이드된 시스템에 여전히 존재할 수 있습니다. `openclaw uninstall` / `openclaw gateway uninstall`은 이를 자동으로 감지하고 제거합니다.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows(예약된 작업)

기본 작업 이름은 `OpenClaw Gateway`입니다(또는 `OpenClaw Gateway (<profile>)`).
이 작업은 상태 디렉터리 아래의 창 없는 `gateway.vbs` 스크립트를 실행하며, 이 스크립트가 다시
`gateway.cmd`를 실행합니다. 두 파일을 모두 제거하십시오.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

프로필을 사용했다면 일치하는 작업 이름과 `~\.openclaw-<profile>` 아래의 `gateway.cmd` /
`gateway.vbs` 파일을 삭제하십시오.

## 일반 설치와 소스 체크아웃 비교

### 일반 설치(install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` 또는 `install.ps1`을 사용했다면 CLI는 `npm install -g openclaw@latest`로 설치되었습니다.
`npm rm -g openclaw`로 제거하십시오(해당 방식으로 설치했다면 `pnpm remove -g` / `bun remove -g` 사용).

### 소스 체크아웃(git clone)

저장소 체크아웃에서 실행하는 경우(`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. 저장소를 삭제하기 **전에** Gateway 서비스를 제거하십시오(위의 간편한 방법 또는 수동 서비스 제거 사용).
2. 저장소 디렉터리를 삭제합니다.
3. 위에 표시된 대로 상태와 워크스페이스를 제거합니다.

## 관련 문서

- [설치 개요](/ko/install)
- [마이그레이션 가이드](/ko/install/migrating)
