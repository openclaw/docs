---
read_when:
    - 컴퓨터에서 OpenClaw를 제거하려고 합니다
    - 제거 후에도 Gateway 서비스가 계속 실행 중입니다
summary: OpenClaw 완전 제거(CLI, 서비스, 상태, 작업 공간)
title: 제거
x-i18n:
    generated_at: "2026-06-27T17:37:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

두 가지 경로가 있습니다.

- `openclaw`가 아직 설치되어 있으면 **쉬운 경로**.
- CLI는 없어졌지만 서비스가 아직 실행 중이면 **수동 서비스 제거**.

## 쉬운 경로(CLI가 아직 설치됨)

권장: 기본 제공 제거 프로그램을 사용하세요.

```bash
openclaw uninstall
```

CLI를 사용할 때 상태 제거는 `--workspace`도 선택하지 않는 한 구성된 워크스페이스 디렉터리를 보존합니다.

제거될 항목 미리 보기(안전):

```bash
openclaw uninstall --dry-run --all
```

비대화형(자동화 / npx). 주의해서 사용하고, 범위를 확인한 뒤에만 사용하세요.

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

수동 단계(동일한 결과):

1. Gateway 서비스를 중지합니다.

```bash
openclaw gateway stop
```

2. Gateway 서비스(launchd/systemd/schtasks)를 제거합니다.

```bash
openclaw gateway uninstall
```

3. 상태 + 구성을 삭제합니다.

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH`를 상태 디렉터리 밖의 사용자 지정 위치로 설정했다면, 해당 파일도 삭제하세요.
`~/.openclaw/workspace`처럼 상태 디렉터리 안의 워크스페이스를 유지하려면, `rm -rf`를 실행하기 전에 다른 곳으로 옮기거나 상태 내용만 선택적으로 삭제하세요.

4. 워크스페이스를 삭제합니다(선택 사항, 에이전트 파일 제거).

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI 설치를 제거합니다(사용한 항목을 선택).

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS 앱을 설치했다면:

```bash
rm -rf /Applications/OpenClaw.app
```

참고:

- 프로필(`--profile` / `OPENCLAW_PROFILE`)을 사용했다면 각 상태 디렉터리에 대해 3단계를 반복하세요(기본값은 `~/.openclaw-<profile>`).
- 원격 모드에서는 상태 디렉터리가 **Gateway 호스트**에 있으므로, 1-4단계도 그곳에서 실행하세요.

## 수동 서비스 제거(CLI가 설치되지 않음)

Gateway 서비스가 계속 실행 중인데 `openclaw`가 없을 때 사용하세요.

### macOS(launchd)

기본 레이블은 `ai.openclaw.gateway`입니다(또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`가 아직 있을 수 있음).

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

프로필을 사용했다면 레이블과 plist 이름을 `ai.openclaw.<profile>`로 바꾸세요. 레거시 `com.openclaw.*` plist가 있으면 제거하세요.

### Linux(systemd 사용자 유닛)

기본 유닛 이름은 `openclaw-gateway.service`입니다(또는 `openclaw-gateway-<profile>.service`).

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows(예약된 작업)

기본 작업 이름은 `OpenClaw Gateway`입니다(또는 `OpenClaw Gateway (<profile>)`).
작업 스크립트는 상태 디렉터리 아래에 `gateway.cmd`로 있으며, 현재 설치는 작업 스케줄러가 `gateway.cmd`를 직접 여는 대신 실행하는 창 없는 `gateway.vbs` 런처도 만들 수 있습니다.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

프로필을 사용했다면 일치하는 작업 이름과 `~\.openclaw-<profile>` 아래의 `gateway.cmd` /
`gateway.vbs` 파일을 삭제하세요.

## 일반 설치와 소스 체크아웃

### 일반 설치(install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` 또는 `install.ps1`을 사용했다면 CLI는 `npm install -g openclaw@latest`로 설치되었습니다.
`npm rm -g openclaw`로 제거하세요(그 방식으로 설치했다면 `pnpm remove -g` / `bun remove -g` 사용).

### 소스 체크아웃(git clone)

리포지터리 체크아웃(`git clone` + `openclaw ...` / `bun run openclaw ...`)에서 실행하는 경우:

1. 리포지터리를 삭제하기 **전에** Gateway 서비스를 제거하세요(위의 쉬운 경로 또는 수동 서비스 제거 사용).
2. 리포지터리 디렉터리를 삭제합니다.
3. 위에 표시된 대로 상태 + 워크스페이스를 제거합니다.

## 관련 항목

- [설치 개요](/ko/install)
- [마이그레이션 가이드](/ko/install/migrating)
