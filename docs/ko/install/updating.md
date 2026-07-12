---
read_when:
    - OpenClaw 업데이트하기
    - 업데이트 후 문제가 발생함
summary: OpenClaw 안전 업데이트(전역 설치 또는 소스) 및 롤백 전략
title: 업데이트 중
x-i18n:
    generated_at: "2026-07-12T00:55:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

OpenClaw을 최신 상태로 유지하세요.

Docker, Podman 및 Kubernetes 이미지 교체에 대해서는
[컨테이너 이미지 업그레이드](/ko/install/docker#upgrading-container-images)를 참조하세요. Gateway는 준비 상태로 전환하기 전에 시작에 안전한 업그레이드 작업을 실행하며, 마운트된 상태에 수동 복구가 필요하면 종료됩니다.

## 권장: `openclaw update`

설치 유형(npm 또는 git)을 감지하고, 최신 버전을 가져와 `openclaw doctor`를 실행한 후 Gateway를 재시작합니다.

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

`openclaw update`에는 `--verbose` 플래그가 없습니다(설치 프로그램에는 있음). 진단하려면
`--dry-run`으로 예정된 작업을 미리 보고, `--json`으로 구조화된 결과를 확인하거나,
`openclaw update status --json`으로 채널 및 사용 가능 상태를 점검하세요.

`--channel beta`는 beta npm dist-tag를 우선하지만, beta 태그가 없거나 해당 버전이 최신 안정 릴리스보다 오래된 경우 stable/latest로 대체합니다. 원시 npm beta dist-tag에 고정된 일회성 패키지 업데이트에는 대신 `--tag beta`를 사용하세요.

`--channel extended-stable`은 패키지 전용이며, 설치는 계속 포그라운드에서만 수행됩니다. OpenClaw은 공개 npm `extended-stable` 선택자를 읽고, 선택된 정확한 패키지를 검증한 후 해당 버전을 정확히 설치합니다. 레지스트리 데이터가 없거나 일관되지 않으면 안전하게 실패하며, 절대 `latest`로 대체하지 않습니다.
선택된 버전이 설치된 버전보다 오래된 경우 일반적인 다운그레이드 확인 절차가 그대로 적용됩니다. CLI는 코어 업데이트가 성공한 후 채널을 저장하지만, `npm install -g openclaw@extended-stable`을 직접 실행하면 `update.channel`이 업데이트되지 않습니다.
코어 교체 후, 기본값/지정 없음 또는 `latest` 의도를 가진 대상 공식 npm Plugin은 해당 코어 버전과 정확히 일치하도록 수렴합니다. 정확한 버전 고정 및 명시적인 비-`latest` 태그, 서드파티 Plugin, npm이 아닌 소스는 변경되지 않습니다.
현재 OpenClaw 버전에서 생성한 카탈로그 설치는 해당 기본 의도를 유지합니다. 정확한 버전만 포함하는 이전 레코드는 OpenClaw이 과거의 자동 고정과 사용자 고정을 안전하게 구분할 수 없으므로 계속 고정된 상태로 유지됩니다. extended-stable 채널에서 `openclaw plugins update @openclaw/name`을 한 번 실행하여 해당 Plugin이 정확한 코어 버전을 다시 추적하도록 설정하세요.

`--channel dev`는 지속적으로 이동하는 GitHub `main` 체크아웃을 제공합니다. 일회성 패키지 업데이트에서 `--tag main`은 `github:openclaw/openclaw#main` 패키지 사양에 매핑되며, 대상 패키지 관리자(npm/pnpm/bun)를 통해 직접 설치합니다.

관리되는 Plugin에서 beta 릴리스가 없는 것은 실패가 아니라 경고입니다. Plugin이 기록된 기본/latest 릴리스로 대체되는 동안에도 코어 업데이트는 성공할 수 있습니다.

채널 의미에 대해서는 [릴리스 채널](/ko/install/development-channels)을 참조하세요.

## npm 설치와 git 설치 간 전환

채널을 사용하여 설치 유형을 변경하세요. 업데이터는 `~/.openclaw`의 상태, 구성, 자격 증명 및 작업 공간을 유지하며, CLI와 Gateway가 사용하는 OpenClaw 코드 설치만 변경합니다.

```bash
# npm 패키지 설치 -> 편집 가능한 git 체크아웃
openclaw update --channel dev

# git 체크아웃 -> npm 패키지 설치
openclaw update --channel stable
```

먼저 설치 모드 전환을 미리 확인하세요.

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev`는 git 체크아웃을 보장하고 빌드한 후 해당 체크아웃에서 전역 CLI를 설치합니다. `stable`, `extended-stable`, `beta` 채널은 패키지 설치를 사용합니다. git 체크아웃에서 extended-stable을 사용하면 변경이나 변환 없이 거부됩니다. Gateway가 이미 설치되어 있으면 `--no-restart`를 전달하지 않는 한 `openclaw update`가 서비스 메타데이터를 새로 고치고 재시작합니다.

관리되는 Gateway 서비스가 있는 패키지 설치에서는 `openclaw update`가 해당 서비스에서 사용하는 패키지 루트를 대상으로 합니다. 셸의 `openclaw` 명령이 다른 설치에서 제공되는 경우, 업데이터는 두 루트와 관리되는 서비스의 Node 경로를 모두 출력하고 패키지를 교체하기 전에 해당 Node 버전이 대상 릴리스의 `engines.node` 요구 사항을 충족하는지 확인합니다.

## 대안: 설치 프로그램 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`를 추가하세요. 특정 설치 유형을 강제하려면 `--install-method git --no-onboard` 또는 `--install-method npm --no-onboard`를 전달하세요.

npm 패키지 설치 단계 후 `openclaw update`가 실패하면 대신 설치 프로그램을 다시 실행하세요. 설치 프로그램은 업데이터를 호출하지 않고 전역 패키지 설치를 직접 실행하므로 부분적으로 업데이트된 npm 설치를 복구할 수 있습니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

`--version`을 사용하여 복구를 특정 버전 또는 dist-tag에 고정하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 대안: npm, pnpm 또는 bun 수동 사용

```bash
npm i -g openclaw@latest
```

감독되는 설치에서는 `openclaw update` 사용을 권장합니다. 실행 중인 Gateway 서비스와 패키지 교체를 조율할 수 있습니다. 감독되는 설치에서 수동으로 업데이트하려면 먼저 관리되는 Gateway를 중지하세요. 패키지 관리자는 파일을 제자리에서 교체하므로, 실행 중인 Gateway가 교체 도중 코어 또는 Plugin 파일을 로드하려고 시도할 수 있습니다. 패키지 관리자가 완료된 후 새 설치를 적용하도록 Gateway를 재시작하세요.

루트가 소유하는 Linux 시스템 전역 설치에서 `openclaw update`가 `EACCES`로 실패하면, 수동 교체 중 Gateway를 중지한 상태로 유지하면서 시스템 npm으로 복구하세요. 해당 Gateway에 평소 사용하는 것과 동일한 프로필 플래그/환경을 사용하세요. `/usr/bin/npm`을 호스트에서 루트 소유 전역 접두사를 소유하는 시스템 npm으로 바꾸세요.

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

그런 다음 확인하세요.

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update`가 전역 npm 설치를 관리할 때는 먼저 대상을 임시 npm 접두사에 설치하고 패키징된 `dist` 인벤토리를 검증한 다음, 깨끗한 패키지 트리를 실제 전역 접두사에 교체합니다. 이렇게 하면 npm이 이전 패키지의 오래된 파일 위에 새 패키지를 덮어쓰는 일을 방지할 수 있습니다. 설치 명령이 실패하면 OpenClaw은 `--omit=optional`을 사용하여 한 번 재시도합니다. 이는 네이티브 선택적 종속성을 컴파일할 수 없는 호스트에서 도움이 됩니다.

OpenClaw이 관리하는 npm 업데이트 및 Plugin 업데이트 명령은 하위 npm 프로세스에 대해 npm의 `min-release-age` 공급망 격리 정책(또는 이전 `before` 구성 키)도 해제합니다. 이 정책은 일반적인 보호를 위해 존재하지만, 명시적인 OpenClaw 업데이트는 "선택한 릴리스를 지금 설치"한다는 의미입니다.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 고급 npm 설치 항목

<AccordionGroup>
  <Accordion title="읽기 전용 패키지 트리">
    OpenClaw은 현재 사용자가 전역 패키지 디렉터리에 쓸 수 있는 경우에도 패키징된 전역 설치를 런타임에서 읽기 전용으로 취급합니다. Plugin 패키지 설치는 사용자 구성 디렉터리 아래 OpenClaw 소유의 npm/git 루트에 저장되며, Gateway 시작 과정에서는 OpenClaw 패키지 트리를 변경하지 않습니다.

    일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw` 같은 루트 소유 디렉터리 아래에 전역 패키지를 설치합니다. Plugin 설치/업데이트 명령은 해당 전역 패키지 디렉터리 외부에 쓰므로 OpenClaw은 이 레이아웃을 지원합니다.

  </Accordion>
  <Accordion title="강화된 systemd 유닛">
    명시적 Plugin 설치, Plugin 업데이트 및 doctor 정리가 변경 사항을 유지할 수 있도록 OpenClaw에 구성/상태 루트에 대한 쓰기 권한을 부여하세요.

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="디스크 공간 사전 점검">
    패키지 업데이트 및 명시적 Plugin 설치 전에 OpenClaw은 대상 볼륨의 디스크 공간을 최선의 노력으로 확인합니다. 공간이 부족하면 확인한 경로와 함께 경고가 표시되지만, 파일 시스템 할당량, 스냅샷 및 네트워크 볼륨은 확인 후 변경될 수 있으므로 업데이트를 차단하지는 않습니다. 실제 패키지 관리자 설치 및 설치 후 검증이 최종 판단 기준입니다.
  </Accordion>
</AccordionGroup>

## 자동 업데이터

기본적으로 꺼져 있습니다. `~/.openclaw/openclaw.json`에서 활성화하세요.

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

| 채널              | 동작                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | `stableDelayHours`(기본값: 6) 동안 기다린 후, 분산 배포를 위해 `stableJitterHours`(기본값: 12) 범위에 결정적 지터를 적용하여 업데이트합니다.             |
| `extended-stable` | `checkOnStart`가 활성화된 경우 시작 시 및 24시간마다 읽기 전용 업데이트 알림을 확인합니다. 자동으로 적용하지 않습니다.                                  |
| `beta`            | `betaCheckIntervalHours`(기본값: 1)마다 확인하고 즉시 적용합니다.                                                                                       |
| `dev`             | 자동 적용하지 않습니다. `openclaw update`를 수동으로 사용하세요.                                                                                       |

Gateway는 시작 시 업데이트 알림도 기록합니다(`update.checkOnStart: false`로 비활성화). 저장된 extended-stable 선택은 이 읽기 전용 알림 경로와 기존 24시간 알림 간격을 사용하지만, 자동 설치, 핸드오프, 재시작, stable 지연/지터 또는 beta 폴링은 절대 호출하지 않습니다.
다운그레이드 또는 장애 복구 시에는 Gateway 환경에 `OPENCLAW_NO_AUTO_UPDATE=1`을 설정하여 `update.auto.enabled`가 구성된 경우에도 자동 적용을 차단하세요. `update.checkOnStart`도 비활성화하지 않는 한 시작 업데이트 알림은 계속 실행될 수 있습니다.

실행 중인 Gateway 제어 영역(`update.run`)을 통해 요청된 패키지 관리자 업데이트는 실행 중인 Gateway 프로세스 내부에서 패키지 트리를 교체하지 않습니다. 관리되는 서비스 설치에서 Gateway는 분리된 핸드오프를 시작하고 종료한 후, 일반적인 `openclaw update --yes --json` CLI 경로가 서비스를 중지하고, 패키지를 교체하고, 서비스 메타데이터를 새로 고치고, 재시작하고, Gateway 버전과 연결 가능성을 검증하며, 가능한 경우 설치되었지만 로드되지 않은 macOS LaunchAgent를 복구하도록 합니다. Gateway가 해당 핸드오프를 안전하게 수행할 수 없으면 `update.run`은 패키지 관리자를 프로세스 내에서 실행하는 대신 안전한 셸 명령을 보고합니다.

Control UI 사이드바 업데이트 카드는 동일한 `update.run` 흐름을 시작합니다. 서명된 macOS 앱에서는 카드가 먼저 Sparkle을 통해 앱을 업데이트합니다. 앱을 다시 실행하면 관리되는 로컬 Gateway가 일치하는 버전으로 업데이트됩니다.

## 업데이트 후

<Steps>

### doctor 실행

```bash
openclaw doctor
```

구성을 마이그레이션하고, DM 정책을 감사하며, Gateway 상태를 확인합니다. 자세한 내용: [Doctor](/ko/gateway/doctor)

### Gateway 재시작

```bash
openclaw gateway restart
```

### 확인

```bash
openclaw health
```

</Steps>

## 롤백

### 버전 고정(npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version`은 현재 게시된 버전을 표시합니다.
</Tip>

### 커밋 고정(소스)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

최신 버전으로 돌아가려면 `git checkout main && git pull`을 실행하세요.

## 문제가 해결되지 않는 경우

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요.
- 소스 체크아웃에서 `openclaw update --channel dev`를 실행하면 필요할 때 업데이터가 `pnpm`을 자동으로 부트스트랩합니다. pnpm/corepack 부트스트랩 오류가 표시되면 `pnpm`을 수동으로 설치하거나 `corepack`을 다시 활성화한 후 업데이트를 다시 실행하세요.
- 확인: [문제 해결](/ko/gateway/troubleshooting)
- Discord에서 문의: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [설치 개요](/ko/install): 모든 설치 방법.
- [Doctor](/ko/gateway/doctor): 업데이트 후 상태 점검.
- [마이그레이션](/ko/install/migrating): 메이저 버전 마이그레이션 가이드.
