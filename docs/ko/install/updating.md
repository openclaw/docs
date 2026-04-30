---
read_when:
    - OpenClaw 업데이트
    - 업데이트 후 문제가 발생하는 경우
summary: OpenClaw를 안전하게 업데이트하기(전역 설치 또는 소스) 및 롤백 전략
title: 업데이트
x-i18n:
    generated_at: "2026-04-30T06:38:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

OpenClaw를 최신 상태로 유지하세요.

## 권장: `openclaw update`

가장 빠른 업데이트 방법입니다. 설치 유형(npm 또는 git)을 감지하고, 최신 버전을 가져오고, `openclaw doctor`를 실행한 뒤 Gateway를 다시 시작합니다.

```bash
openclaw update
```

채널을 전환하거나 특정 버전을 대상으로 지정하려면:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta`는 beta를 우선하지만, beta 태그가 없거나 최신 안정 릴리스보다 오래된 경우 런타임은 stable/latest로 대체합니다. 일회성 패키지 업데이트에 원시 npm beta dist-tag를 원하면 `--tag beta`를 사용하세요.

채널 의미 체계는 [개발 채널](/ko/install/development-channels)을 참고하세요.

## npm 설치와 git 설치 간 전환

설치 유형을 변경하려면 채널을 사용하세요. 업데이터는 `~/.openclaw`의 상태, 구성, 자격 증명, 작업 공간을 유지합니다. CLI와 Gateway가 사용하는 OpenClaw 코드 설치만 변경합니다.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

정확한 설치 모드 전환을 미리 보려면 먼저 `--dry-run`으로 실행하세요.

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 채널은 git 체크아웃을 보장하고, 빌드한 뒤 해당 체크아웃에서 전역 CLI를 설치합니다. `stable` 및 `beta` 채널은 패키지 설치를 사용합니다. Gateway가 이미 설치되어 있으면 `openclaw update`는 서비스 메타데이터를 새로 고치고, `--no-restart`를 전달하지 않는 한 다시 시작합니다.

## 대안: 설치 프로그램 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`를 추가하세요. 설치 프로그램을 통해 특정 설치 유형을 강제하려면 `--install-method git --no-onboard` 또는 `--install-method npm --no-onboard`를 전달하세요.

npm 패키지 설치 단계 이후 `openclaw update`가 실패하면 설치 프로그램을 다시 실행하세요. 설치 프로그램은 이전 업데이터를 호출하지 않습니다. 전역 패키지 설치를 직접 실행하며, 부분적으로 업데이트된 npm 설치를 복구할 수 있습니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

복구를 특정 버전 또는 dist-tag로 고정하려면 `--version`을 추가하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 대안: 수동 npm, pnpm 또는 bun

```bash
npm i -g openclaw@latest
```

`openclaw update`가 전역 npm 설치를 관리할 때는 먼저 대상 버전을 임시 npm prefix에 설치하고, 패키징된 `dist` 인벤토리를 확인한 다음, 깨끗한 패키지 트리를 실제 전역 prefix로 교체합니다. 이렇게 하면 npm이 이전 패키지의 오래된 파일 위에 새 패키지를 덮어쓰는 일을 방지합니다. 설치 명령이 실패하면 OpenClaw는 `--omit=optional`을 사용해 한 번 다시 시도합니다. 이 재시도는 네이티브 선택적 종속성을 컴파일할 수 없는 호스트에 도움이 되며, 대체 시도도 실패할 경우 원래 실패를 계속 확인할 수 있게 합니다.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 고급 npm 설치 항목

<AccordionGroup>
  <Accordion title="읽기 전용 패키지 트리">
    OpenClaw는 현재 사용자가 전역 패키지 디렉터리에 쓸 수 있는 경우에도, 런타임에서 패키징된 전역 설치를 읽기 전용으로 취급합니다. 번들 Plugin 런타임 종속성은 패키지 트리를 변경하는 대신 쓰기 가능한 런타임 디렉터리에 스테이징됩니다. 이렇게 하면 동일한 설치 중에 Plugin 종속성을 복구 중인 실행 중 Gateway 또는 로컬 에이전트와 `openclaw update`가 충돌하지 않습니다.

    일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw` 같은 root 소유 디렉터리 아래에 전역 패키지를 설치합니다. OpenClaw는 동일한 외부 스테이징 경로를 통해 해당 레이아웃을 지원합니다.

  </Accordion>
  <Accordion title="강화된 systemd 유닛">
    `ReadWritePaths`에 포함되는 쓰기 가능한 스테이지 디렉터리를 설정하세요.

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR`는 경로 목록도 허용합니다. OpenClaw는 나열된 루트 전체에서 번들 Plugin 런타임 종속성을 왼쪽에서 오른쪽으로 해석하고, 앞쪽 루트를 읽기 전용 사전 설치 레이어로 취급하며, 마지막 쓰기 가능한 루트에만 설치하거나 복구합니다.

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR`가 설정되지 않은 경우, OpenClaw는 systemd가 제공하면 `$STATE_DIRECTORY`를 사용하고, 그런 다음 `~/.openclaw/plugin-runtime-deps`로 대체합니다. 복구 단계는 해당 스테이지를 OpenClaw 소유의 로컬 패키지 루트로 취급하고 사용자 npm prefix 및 전역 설정을 무시하므로, 전역 설치 npm 구성이 번들 Plugin 종속성을 `~/node_modules` 또는 전역 패키지 트리로 리디렉션하지 않습니다.

  </Accordion>
  <Accordion title="디스크 공간 사전 점검">
    패키지 업데이트와 번들 런타임 종속성 복구 전에, OpenClaw는 대상 볼륨에 대해 최선 노력 방식의 디스크 공간 점검을 시도합니다. 공간이 부족하면 점검한 경로와 함께 경고가 표시되지만, 파일 시스템 할당량, 스냅샷, 네트워크 볼륨은 점검 후에도 변경될 수 있으므로 업데이트를 차단하지 않습니다. 실제 npm 설치, 복사, 설치 후 검증이 최종 기준입니다.
  </Accordion>
  <Accordion title="번들 Plugin 런타임 종속성">
    패키징된 설치는 번들 Plugin 런타임 종속성을 읽기 전용 패키지 트리 밖에 유지합니다. 시작 시 및 `openclaw doctor --fix` 실행 중에 OpenClaw는 구성에서 활성화된 번들 Plugin, 레거시 채널 구성을 통해 활성화된 번들 Plugin, 또는 번들 매니페스트 기본값으로 활성화된 번들 Plugin에 대해서만 런타임 종속성을 복구합니다. 저장된 채널 인증 상태만으로는 Gateway 시작 런타임 종속성 복구가 트리거되지 않습니다.

    명시적 비활성화가 우선합니다. 비활성화된 Plugin 또는 채널은 패키지에 존재한다는 이유만으로 런타임 종속성이 복구되지 않습니다. 외부 Plugin 및 사용자 지정 로드 경로는 계속 `openclaw plugins install` 또는 `openclaw plugins update`를 사용합니다.

  </Accordion>
</AccordionGroup>

## 자동 업데이터

자동 업데이터는 기본적으로 꺼져 있습니다. `~/.openclaw/openclaw.json`에서 활성화하세요.

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

| 채널     | 동작                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 동안 기다린 뒤 `stableJitterHours` 전체에 걸쳐 결정적 지터로 적용합니다(분산 롤아웃).              |
| `beta`   | `betaCheckIntervalHours`마다 확인하고(기본값: 매시간) 즉시 적용합니다.                                                 |
| `dev`    | 자동 적용이 없습니다. `openclaw update`를 수동으로 사용하세요.                                                        |

Gateway는 시작 시 업데이트 힌트도 기록합니다(`update.checkOnStart: false`로 비활성화).
다운그레이드 또는 사고 복구의 경우, Gateway 환경에서 `OPENCLAW_NO_AUTO_UPDATE=1`을 설정해 `update.auto.enabled`가 구성되어 있어도 자동 적용을 차단하세요. `update.checkOnStart`도 비활성화하지 않는 한 시작 업데이트 힌트는 계속 실행될 수 있습니다.

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

### 버전 고정(npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version`은 현재 게시된 버전을 표시합니다.
</Tip>

### 커밋 고정(source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

최신 버전으로 돌아가려면: `git checkout main && git pull`.

## 막혔을 때

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요.
- 소스 체크아웃에서 `openclaw update --channel dev`를 실행할 때, 필요한 경우 업데이터가 `pnpm`을 자동으로 부트스트랩합니다. pnpm/corepack 부트스트랩 오류가 표시되면 `pnpm`을 수동으로 설치하거나 `corepack`을 다시 활성화한 뒤 업데이트를 다시 실행하세요.
- 확인: [문제 해결](/ko/gateway/troubleshooting)
- Discord에서 질문: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [설치 개요](/ko/install): 모든 설치 방법.
- [Doctor](/ko/gateway/doctor): 업데이트 후 상태 점검.
- [마이그레이션](/ko/install/migrating): 주요 버전 마이그레이션 가이드.
