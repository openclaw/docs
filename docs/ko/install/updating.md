---
read_when:
    - OpenClaw 업데이트
    - 업데이트 후 문제가 발생합니다
summary: OpenClaw을 안전하게 업데이트하기(전역 설치 또는 소스) 및 롤백 전략
title: 업데이트 중
x-i18n:
    generated_at: "2026-07-16T12:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

OpenClaw를 최신 상태로 유지하십시오.

Docker, Podman 및 Kubernetes 이미지 교체에 대해서는
[컨테이너 이미지 업그레이드](/ko/install/docker#upgrading-container-images)를 참조하십시오. Gateway는
준비 상태가 되기 전에 시작에 안전한 업그레이드 작업을 실행하며, 마운트된
상태를 수동으로 복구해야 하는 경우 종료됩니다.

## 권장: `openclaw update`

설치 유형(npm, pnpm, Bun 또는 git)을 감지하고 최신 버전을 가져온 다음, `openclaw doctor`을 실행하고 Gateway를 다시 시작합니다.

```bash
openclaw update
```

채널을 전환하거나 특정 버전을 대상으로 지정합니다.

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 적용하지 않고 미리 보기
```

`openclaw update`에는 `--verbose` 플래그가 없습니다(설치 프로그램에는 있습니다). 진단하려면
`--dry-run`로 예정된 작업을 미리 보고, `--json`으로 구조화된 결과를 확인하거나,
`openclaw update status --json`으로 채널 및 가용성 상태를 검사하십시오.

`--channel beta`은 beta npm dist-tag를 우선 사용하지만, beta 태그가 없거나 해당 버전이 최신 stable
릴리스보다 오래된 경우 stable/latest로 대체합니다. 대신 원시 npm
beta dist-tag에 고정된 일회성 패키지 업데이트에는 `--tag beta`을 사용하십시오.

`--channel extended-stable`은 패키지 전용이며, 설치는 계속
포그라운드에서만 수행됩니다. OpenClaw는 공개 npm `extended-stable` 선택기를 읽고,
선택된 정확한 패키지를 검증한 후 해당 버전을 정확히 설치합니다. 레지스트리 데이터가 없거나
일관되지 않으면 안전하게 실패하며, `latest`으로 대체하지 않습니다.
선택한 버전이 설치된 버전보다 오래된 경우 일반적인
다운그레이드 확인이 계속 적용됩니다. CLI는 코어 업데이트가
성공하면 채널을 저장하지만, 직접 실행한 `npm install -g openclaw@extended-stable`은
`update.channel`을 업데이트하지 않습니다.
코어 교체 후 bare/default 또는
`latest` 의도를 가진 해당 공식 npm Plugin은 정확히 해당 코어 버전으로 수렴합니다. 정확한 버전 고정과 명시적인
비-`latest` 태그, 서드 파티 Plugin 및 npm 이외의 소스는 변경되지 않습니다.
현재 OpenClaw 버전에서 생성된 카탈로그 설치는 해당 기본
의도를 유지합니다. 정확한 버전만 포함하는 이전 레코드는
OpenClaw가 과거의 자동 고정과 사용자 고정을 안전하게 구분할 수 없으므로 계속 고정됩니다. 해당 Plugin을 정확한 코어 버전 추적으로
다시 전환하려면 extended-stable 채널에서
`openclaw plugins update @openclaw/name`을 한 번 실행하십시오.

`--channel dev`은 지속적으로 이동하는 GitHub `main` 체크아웃을 제공합니다. 일회성
패키지 업데이트의 경우 `--tag main`은 `github:openclaw/openclaw#main` 패키지
사양에 매핑되며 대상 패키지 관리자(npm/pnpm/bun)를 통해 직접 설치합니다.

관리되는 Plugin의 경우 beta 릴리스가 없으면 실패가 아니라 경고로 처리됩니다.
Plugin이 기록된 default/latest 릴리스로 대체되는 동안에도 코어 업데이트는
성공할 수 있습니다.

채널 의미 체계는 [릴리스 채널](/ko/install/development-channels)을 참조하십시오.

## npm 설치와 git 설치 간 전환

채널을 사용하여 설치 유형을 변경하십시오. 업데이터는 `~/.openclaw`에 있는 상태, 구성,
자격 증명 및 작업 공간을 유지하며, CLI와 Gateway가 사용하는 OpenClaw
코드 설치만 변경합니다.

```bash
# npm 패키지 설치 -> 편집 가능한 git 체크아웃
openclaw update --channel dev

# git 체크아웃 -> npm 패키지 설치
openclaw update --channel stable
```

먼저 설치 모드 전환을 미리 확인하십시오.

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev`은 git 체크아웃을 보장하고 이를 빌드한 후, 해당
체크아웃에서 전역 CLI를 설치합니다. `stable`, `extended-stable` 및 `beta` 채널은 패키지
설치를 사용합니다. git 체크아웃에서는 변경하거나
변환하지 않고 extended-stable이 거부됩니다. Gateway가 이미 설치되어 있으면 `--no-restart`을 전달하지 않는 한 `openclaw update`이
서비스 메타데이터를 새로 고치고 다시 시작합니다.

관리되는 Gateway 서비스가 있는 패키지 설치의 경우 `openclaw update`은
해당 서비스가 사용하는 패키지 루트를 대상으로 합니다. 셸의 `openclaw` 명령이
다른 설치에서 제공된 경우 업데이터는 두 루트와 관리되는
서비스의 Node 경로를 출력하고, 패키지를 교체하기 전에 해당 Node 버전이 대상 릴리스의
`engines.node` 요구 사항을 충족하는지 확인합니다.

## 대안: 설치 프로그램 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`을 추가하십시오. 특정 설치 유형을 강제하려면
`--install-method git --no-onboard` 또는 `--install-method npm --no-onboard`을 전달하십시오.

npm 패키지 설치 단계 후 `openclaw update`이 실패하면
대신 설치 프로그램을 다시 실행하십시오. 설치 프로그램은 업데이터를 호출하지 않고 전역 패키지
설치를 직접 실행하므로 부분적으로 업데이트된 npm 설치를 복구할 수 있습니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

`--version`을 사용하여 복구를 특정 버전이나 dist-tag에 고정하십시오.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 대안: npm, pnpm 또는 bun 수동 사용

```bash
npm i -g openclaw@latest
```

관리되는 설치에는 `openclaw update`을 권장합니다. 실행 중인 Gateway 서비스와
패키지 교체를 조율할 수 있습니다. 관리되는 설치에서 수동으로
업데이트하는 경우 먼저 관리되는 Gateway를 중지하십시오. 패키지 관리자는 파일을
제자리에서 교체하므로, 그렇지 않으면 실행 중인 Gateway가 교체 도중
코어 또는 Plugin 파일을 로드하려 할 수 있습니다. 새 설치를 인식하도록
패키지 관리자가 완료된 후 Gateway를 다시 시작하십시오.

루트 소유의 Linux 시스템 전역 설치에서 `openclaw update`이
`EACCES`과 함께 실패하면, 수동 교체 중 Gateway를 중지한 상태로 유지하면서 시스템 npm으로
복구하십시오. 해당 Gateway에 평소 사용하는 것과 동일한 프로필 플래그/환경을 사용하십시오.
`/usr/bin/npm`을 호스트의 루트 소유 전역 접두사를 관리하는
시스템 npm으로 바꾸십시오.

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

그런 다음 확인하십시오.

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update`이 전역 npm 설치를 관리할 때는 먼저 대상을
임시 npm 접두사에 설치합니다. 후보 패키지는 `preinstall` 중에 호스트
Node 버전을 검증합니다. 검증 후에만 OpenClaw가 패키징된
`dist` 인벤토리를 확인하고 깨끗한 패키지 트리를 실제 전역 접두사로 교체합니다.
패키징된 완료 가드는 예상 인벤토리에서 제외되며 `preinstall`이 성공한 후에만
제거되므로, 수명 주기 스크립트가 건너뛰어진 경우에도 교체 전에 실패합니다. npm 12 이상에서 업데이터는 후보 OpenClaw
수명 주기만 승인하며, 전이 종속성 스크립트는 계속 차단됩니다. 이렇게 하면 npm이
이전 패키지의 오래된 파일 위에 새 패키지를 덮어쓰는 일을 방지합니다. 설치
명령이 실패하면 OpenClaw는 `--omit=optional`을 사용하여 한 번 다시 시도합니다. 이는
네이티브 선택적 종속성을 컴파일할 수 없는 호스트에서 도움이 됩니다.

OpenClaw가 관리하는 npm 업데이트 및 Plugin 업데이트 명령은 하위 npm 프로세스에서 npm의
`min-release-age` 공급망 격리(또는 이전 `before` 구성 키)도 해제합니다.
이 정책은 일반적인 보호를 위해 존재하지만, 명시적인 OpenClaw 업데이트는
"선택한 릴리스를 지금 설치"한다는 의미입니다.

```bash
pnpm add -g openclaw@latest
```

pnpm 11에서 OpenClaw 2026.7.1을 설치했다면 해당 수동 명령을 한 번 실행하십시오. 이
릴리스는 pnpm 11의 격리된 전역 패키지 레이아웃보다 이전 버전이므로 업데이터가
다른 npm 설치를 실행 중인 CLI로 잘못 인식할 수 있습니다. 이후 릴리스는
pnpm 소유권을 유지하고 업데이트 중 교체 패키지 루트를 따릅니다. 또한
소유 관리자가 보고한 전역 bin 디렉터리를 사용하며, 사용 가능한 pnpm 명령이 다른 전역 루트나 메이저 버전을 보고하거나
호출 패키지가 분리되었거나 해당 위치에서 유일하게 활성화된 OpenClaw
설치가 아닌 경우 변경 전에 중지됩니다.

OpenClaw가 다른 패키지와 pnpm 11 전역 설치 그룹을 공유하는 경우,
자동 업데이터는 그룹을 변경하기 전에 중지됩니다. 형제 패키지와 빌드 정책이
그대로 유지되도록 원래의 쉼표로 구분된 그룹을 수동으로 업데이트하십시오.

```bash
bun add -g openclaw@latest
```

### 고급 npm 설치 주제

<AccordionGroup>
  <Accordion title="읽기 전용 패키지 트리">
    OpenClaw는 현재 사용자가 전역 패키지 디렉터리에 쓸 수 있더라도 패키징된 전역 설치를 런타임에서 읽기 전용으로 취급합니다. Plugin 패키지 설치는 사용자 구성 디렉터리 아래 OpenClaw 소유의 npm/git 루트에 위치하며, Gateway 시작 시 OpenClaw 패키지 트리를 변경하지 않습니다.

    일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw`과 같은 루트 소유 디렉터리 아래에 전역 패키지를 설치합니다. Plugin 설치/업데이트 명령은 해당 전역 패키지 디렉터리 외부에 쓰므로 OpenClaw는 이 레이아웃을 지원합니다.

  </Accordion>
  <Accordion title="강화된 systemd 유닛">
    명시적인 Plugin 설치, Plugin 업데이트 및 doctor 정리가 변경 사항을 유지할 수 있도록 OpenClaw에 구성/상태 루트에 대한 쓰기 권한을 부여하십시오.

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="디스크 공간 사전 확인">
    패키지 업데이트 및 명시적인 Plugin 설치 전에 OpenClaw는 대상 볼륨의 디스크 공간을 가능한 범위에서 확인합니다. 공간이 부족하면 확인한 경로와 함께 경고가 표시되지만, 파일 시스템 할당량, 스냅샷 및 네트워크 볼륨은 확인 후 변경될 수 있으므로 업데이트를 차단하지는 않습니다. 실제 패키지 관리자 설치와 설치 후 검증이 최종 기준으로 유지됩니다.
  </Accordion>
</AccordionGroup>

## 자동 업데이터

기본적으로 비활성화되어 있습니다. `~/.openclaw/openclaw.json`에서 활성화하십시오.

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 채널              | 동작                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours` 동안 대기한 후(기본값: 6), 분산 롤아웃을 위해 `stableJitterHours`에 걸쳐 결정론적 지터(기본값: 12)를 적용합니다. |
| `extended-stable` | 시작 시 및 `checkOnStart`이 활성화된 경우 24시간마다 읽기 전용 업데이트 힌트를 확인합니다. 자동으로 적용하지 않습니다.                 |
| `beta`            | `betaCheckIntervalHours`마다 확인하고(기본값: 1) 즉시 적용합니다.                                                                          |
| `dev`             | 자동으로 적용하지 않습니다. `openclaw update`을 수동으로 사용하십시오.                                                               |

Gateway는 시작 시 업데이트 힌트도 기록합니다(
`update.checkOnStart: false`으로 비활성화). 저장된 extended-stable 선택 항목은 이
읽기 전용 힌트 경로와 기존의 24시간 힌트 간격을 사용하지만,
자동 설치, 핸드오프, 다시 시작, stable 지연/지터 또는 beta 폴링은 절대로 실행하지 않습니다.
다운그레이드 또는 인시던트 복구의 경우, `update.auto.enabled`이 구성되어 있더라도 자동 적용을 차단하려면 Gateway 환경에서 `OPENCLAW_NO_AUTO_UPDATE=1`을 설정하십시오. `update.checkOnStart`도 비활성화하지 않는 한 시작 시 업데이트 힌트는 계속 실행될 수 있습니다.

실행 중인 Gateway 제어 플레인
(`update.run`)을 통해 요청된 패키지 관리자 업데이트는 실행 중인 Gateway
프로세스 내부의 패키지 트리를 교체하지 않습니다. 관리되는 서비스 설치에서는 Gateway가 분리된 핸드오프를 시작하고
종료한 다음, 일반적인 `openclaw update --yes --json` CLI 경로가
서비스를 중지하고, 패키지를 교체하고, 서비스 메타데이터를 새로 고치고, 다시 시작하고,
Gateway 버전과 연결 가능성을 검증하며, 가능한 경우 설치되었지만 로드되지 않은 macOS
LaunchAgent를 복구하도록 합니다. Gateway가 해당 핸드오프를 안전하게 수행할 수 없으면
`update.run`은 프로세스 내에서 패키지 관리자를 실행하는 대신 안전한 셸 명령을 보고합니다.

Control UI 사이드바 업데이트 카드에는 이 `update.run` 흐름을 직접 시작하는 경우 **Gateway 업데이트**가 표시됩니다. 이는 브라우저에서 호스팅되는 Control UI, 원격 Gateway, 수동으로 관리되는 로컬 Gateway에 적용됩니다.

서명된 macOS 앱에서 앱이 소유하는 로컬 Gateway를 사용하는 경우 해당 카드는 **Mac 앱 + Gateway 업데이트**로 변경됩니다. Sparkle이 먼저 앱을 업데이트하며, 재실행 후 앱이 `openclaw update --tag <app-version> --json`을 실행하고 Gateway를 다시 시작한 다음 설정 방식의 진행률 창에서 상태를 확인합니다. 이 창은 관리되는 Gateway에 업데이트, 복구 또는 설치가 필요한 경우에만 표시되며, 앱만 업데이트하는 경우에는 앱으로 바로 재실행됩니다. 실패 세부 정보는 Retry, [업데이트 가이드](/ko/install/updating), [Discord](https://discord.gg/clawd) 작업과 함께 계속 표시됩니다. 앱은 원격 또는 외부에서 관리되는 Gateway에 이 조정된 경로를 사용하지 않으며, 더 새로운 Gateway를 다운그레이드하지 않고, `extended-stable` 채널 고정을 재정의하지도 않습니다.

업데이트가 성공하면 앱은 실제 사용자/채널 상호작용이 있는 가장 최근의 최상위 직접 세션에 일회성 환영 이벤트를 대기열에 추가합니다. Cron 실행, Heartbeat, 백그라운드 전용 세션 업데이트는 해당 선택을 변경하지 않습니다. 원격 모드에서는 앱이 로컬 Mac Node 런타임만 업데이트하며, 연결된 원격 Gateway가 앱 버전 이상인 경우에만 이벤트를 전송합니다.

## 업데이트 후

<Steps>

### doctor 실행

```bash
openclaw doctor
```

구성을 마이그레이션하고, DM 정책을 감사하며, Gateway 상태를 확인합니다. 자세한 내용: [Doctor](/ko/gateway/doctor)

### Gateway 다시 시작

```bash
openclaw gateway restart
```

### 확인

```bash
openclaw health
```

</Steps>

## 롤백

롤백은 두 계층으로 구성됩니다.

1. 현재 상태를 유지하면서 이전 OpenClaw 코드를 다시 설치합니다.
2. 이전 코드가 마이그레이션된 구성이나 데이터베이스를 사용할 수 없는 경우에만 업데이트 전 상태를 복원합니다.

코드만 롤백하는 것부터 시작하십시오. 상태를 복원하면 백업 이후에 이루어진 변경 사항이 삭제됩니다.

### 업데이트 전: 검증된 백업 생성

`openclaw update`은 업데이트 전 구성 사본을 자동으로 보존하지만 전체 상태 복구 지점을 생성하지는 않습니다. 중요한 업데이트 전에 다음과 같이 명시적으로 생성하십시오.

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

아카이브 매니페스트에는 OpenClaw 버전과 백업에 포함된 소스 경로가 기록됩니다. 아카이브에는 자격 증명, 인증 프로필, 채널 상태가 포함될 수 있으므로 소유자 전용 권한을 설정하고 실제 상태 디렉터리와 동일한 수준으로 보호하여 보관하십시오. 포함되는 파일과 의도적으로 제외되는 파일은 [백업](/ko/cli/backup)을 참조하십시오.

이식 가능한 아카이브에서 제외되는 휘발성 아티팩트까지 포함하는 바이트 단위 복구 지점이 필요한 경우 Gateway를 중지하고 플랫폼에서 제공하는 파일 시스템, 볼륨 또는 VM 스냅샷을 사용하십시오.

### 패키지 설치 롤백

게시된 버전을 나열한 다음, 정상 작동이 확인된 버전을 미리 보고 설치하십시오.

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

직접 패키지 관리자로 설치하는 것보다 `openclaw update --tag`을 사용하는 것이 좋습니다. 이 명령은 다운그레이드를 감지하고 확인을 요청하며, 설치 대상에 대해 관리형 Plugin 수렴 및 호환성 검사를 실행하고, 서비스 메타데이터를 새로 고치며, Gateway를 다시 시작하고, 실행 중인 버전을 확인합니다. 저장된 채널이 `extended-stable`인 경우 정확한 일회성 태그는 `extended-stable` 선택기와 함께 사용할 수 없으므로 `--channel stable --tag <known-good-version>`을 사용하십시오.

패키지 업데이트는 활성화 전에 후보를 준비하고 검증합니다. 파일 시스템 교체 또는 명령 심 링크 교체에 실패하면 OpenClaw가 이전 패키지를 자동으로 복원합니다. 교체에 성공한 후 나중에 Gateway 상태 확인에 실패하면 패키지를 다시 자동 교체하는 대신 이전 버전과 수동 롤백 지침을 보고합니다.

CLI 업데이트 경로를 사용할 수 없는 경우 현재 Gateway를 소유하는 것과 동일한 패키지 관리자 및 설치 범위를 사용하십시오.

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

해당 관리자가 설치를 소유하는 경우 `npm`을 `pnpm` 또는 `bun`로 바꾸십시오. 장애 복구 중에는 Gateway 환경에서 `OPENCLAW_NO_AUTO_UPDATE=1`을 설정하여 활성화된 자동 업데이트 도구가 더 새로운 릴리스를 즉시 적용하지 못하도록 하십시오.

### 소스 체크아웃 롤백

깨끗한 체크아웃을 사용하여 정상 작동이 확인된 태그나 커밋을 선택하십시오.

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

최신 버전으로 돌아가려면 `git checkout main && git pull`을 사용하십시오.

git 업데이트가 시작된 후 종속성 설치, 빌드, UI 빌드 또는 doctor가 실패하면 업데이터가 git 체크아웃을 이전 브랜치와 SHA로 자동으로 되돌립니다. 의도적으로 이전 커밋을 선택하는 경우에는 여전히 수동 체크아웃이 필요합니다.

### 세션 SQLite 마이그레이션 이전 버전으로 다운그레이드

이전 파일 기반 OpenClaw 릴리스를 시작하기 전에 현재 CLI를 사용하여 보관된 레거시 트랜스크립트 아티팩트를 복원하십시오.

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

이 작업은 SQLite 데이터를 삭제하지 않습니다. SQLite 마이그레이션 후에 생성된 세션은 SQLite에만 존재하므로 이전 런타임에는 표시되지 않습니다. [세션 SQLite 마이그레이션 후 다운그레이드](/ko/cli/doctor#downgrading-after-session-sqlite-migration)를 참조하십시오.

### 필요한 경우에만 상태 복원

이전 코드가 새로운 구성이나 데이터베이스 스키마를 읽을 수 없는 경우 Gateway를 중지하고 검증된 업데이트 전 파일 시스템, 볼륨 또는 VM 스냅샷을 복원하십시오. 이렇게 하면 스냅샷 이후에 이루어진 변경 사항이 삭제되므로 복원 전에 현재 상태를 별도로 보존하십시오.

광범위한 `openclaw backup create` 아카이브는 생성 및 검증을 지원하지만 전체 아카이브의 제자리 활성화는 지원하지 않습니다. 광범위한 아카이브를 스테이징 디렉터리에 추출하고 해당 `manifest.json` 소스-아카이브 매핑을 사용하여 오프라인으로 복원하십시오. 마찬가지로 `openclaw backup sqlite restore`은 검증된 데이터베이스를 새로운 대상에 기록하며, 해당 대상의 활성화는 운영자가 명시적으로 수행해야 하는 오프라인 단계로 남습니다.

### 롤백 확인

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## 문제가 해결되지 않는 경우

- `openclaw doctor`을 다시 실행하고 출력을 주의 깊게 읽으십시오.
- 소스 체크아웃에서 `openclaw update --channel dev`을 사용하는 경우 필요하면 업데이터가 `pnpm`을 자동으로 부트스트랩합니다. pnpm/corepack 부트스트랩 오류가 표시되면 `pnpm`을 수동으로 설치하거나 `corepack`을 다시 활성화한 다음 업데이트를 다시 실행하십시오.
- 확인: [문제 해결](/ko/gateway/troubleshooting)
- Discord에서 질문하기: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [설치 개요](/ko/install): 모든 설치 방법입니다.
- [Doctor](/ko/gateway/doctor): 업데이트 후 상태 확인입니다.
- [마이그레이션](/ko/install/migrating): 주요 버전 마이그레이션 가이드입니다.
