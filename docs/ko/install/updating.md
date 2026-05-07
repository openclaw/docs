---
read_when:
    - OpenClaw 업데이트
    - 업데이트 후 문제가 발생함
summary: OpenClaw를 안전하게 업데이트하기(전역 설치 또는 소스) 및 롤백 전략
title: 업데이트하기
x-i18n:
    generated_at: "2026-05-07T13:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

OpenClaw를 최신 상태로 유지하세요.

## 권장: `openclaw update`

가장 빠른 업데이트 방법입니다. 설치 유형(npm 또는 git)을 감지하고, 최신 버전을 가져오며, `openclaw doctor`를 실행하고, Gateway를 다시 시작합니다.

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

`openclaw update`는 `--verbose`를 허용하지 않습니다. 업데이트 진단에는 계획된 작업을 미리 보려면 `--dry-run`을, 구조화된 결과에는 `--json`을, 채널 및 사용 가능 상태를 검사하려면 `openclaw update status --json`을 사용하세요. 설치 프로그램에는 자체 `--verbose` 플래그가 있지만, 그 플래그는 `openclaw update`의 일부가 아닙니다.

`--channel beta`는 beta를 우선하지만, beta 태그가 없거나 최신 안정 릴리스보다 오래된 경우 런타임은 stable/latest로 대체됩니다. 일회성 패키지 업데이트에 원시 npm beta dist-tag를 원한다면 `--tag beta`를 사용하세요.

채널 의미 체계는 [개발 채널](/ko/install/development-channels)을 참조하세요.

## npm 설치와 git 설치 간 전환

설치 유형을 변경하려면 채널을 사용하세요. 업데이터는 `~/.openclaw`의 상태, 구성, 자격 증명, 작업 영역을 유지합니다. CLI와 Gateway가 사용하는 OpenClaw 코드 설치만 변경합니다.

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

`dev` 채널은 git 체크아웃을 보장하고, 이를 빌드한 다음 해당 체크아웃에서 전역 CLI를 설치합니다. `stable` 및 `beta` 채널은 패키지 설치를 사용합니다. Gateway가 이미 설치되어 있으면 `openclaw update`는 서비스 메타데이터를 새로 고치고, `--no-restart`를 전달하지 않는 한 Gateway를 다시 시작합니다.

## 대안: 설치 프로그램 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`를 추가하세요. 설치 프로그램을 통해 특정 설치 유형을 강제하려면 `--install-method git --no-onboard` 또는 `--install-method npm --no-onboard`를 전달하세요.

npm 패키지 설치 단계 이후 `openclaw update`가 실패하면 설치 프로그램을 다시 실행하세요. 설치 프로그램은 이전 업데이터를 호출하지 않습니다. 전역 패키지 설치를 직접 실행하며, 부분적으로 업데이트된 npm 설치를 복구할 수 있습니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

복구를 특정 버전 또는 dist-tag에 고정하려면 `--version`을 추가하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 대안: 수동 npm, pnpm 또는 bun

```bash
npm i -g openclaw@latest
```

감독되는 설치에는 `openclaw update`를 권장합니다. 실행 중인 Gateway 서비스와 패키지 교체를 조율할 수 있기 때문입니다. 관리형 Gateway가 실행 중일 때 수동으로 업데이트하는 경우, 패키지 관리자가 완료된 직후 Gateway를 다시 시작하여 이전 프로세스가 교체된 패키지 파일에서 계속 제공하지 않도록 하세요.

`openclaw update`가 전역 npm 설치를 관리할 때는 먼저 대상 패키지를 임시 npm prefix에 설치하고, 패키지된 `dist` 인벤토리를 검증한 다음, 깨끗한 패키지 트리를 실제 전역 prefix로 교체합니다. 이렇게 하면 npm이 이전 패키지의 오래된 파일 위에 새 패키지를 덮어쓰는 것을 피할 수 있습니다. 설치 명령이 실패하면 OpenClaw는 `--omit=optional`로 한 번 다시 시도합니다. 이 재시도는 네이티브 선택적 의존성을 컴파일할 수 없는 호스트에 도움이 되며, 대체 시도도 실패하면 원래 실패가 계속 표시됩니다.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 고급 npm 설치 주제

<AccordionGroup>
  <Accordion title="읽기 전용 패키지 트리">
    OpenClaw는 전역 패키지 디렉터리를 현재 사용자가 쓸 수 있더라도, 패키지된 전역 설치를 런타임에서 읽기 전용으로 취급합니다. Plugin 패키지 설치는 사용자 구성 디렉터리 아래 OpenClaw 소유 npm/git 루트에 위치하며, Gateway 시작은 OpenClaw 패키지 트리를 변경하지 않습니다.

    일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw` 같은 root 소유 디렉터리 아래에 전역 패키지를 설치합니다. OpenClaw는 Plugin 설치/업데이트 명령이 해당 전역 패키지 디렉터리 외부에 쓰기 때문에 이 레이아웃을 지원합니다.

  </Accordion>
  <Accordion title="강화된 systemd 유닛">
    명시적 Plugin 설치, Plugin 업데이트, doctor 정리가 변경 사항을 유지할 수 있도록 OpenClaw에 구성/상태 루트에 대한 쓰기 권한을 부여하세요.

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="디스크 공간 사전 점검">
    패키지 업데이트와 명시적 Plugin 설치 전에 OpenClaw는 대상 볼륨에 대해 최선 노력 방식의 디스크 공간 검사를 시도합니다. 공간이 부족하면 검사한 경로와 함께 경고가 생성되지만, 파일 시스템 할당량, 스냅샷, 네트워크 볼륨은 검사 후에도 변경될 수 있으므로 업데이트를 차단하지는 않습니다. 실제 패키지 관리자 설치와 설치 후 검증이 계속 최종 권한을 갖습니다.
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

| 채널     | 동작                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 동안 기다린 다음, `stableJitterHours` 전반에 걸쳐 결정적 지터(분산 롤아웃)로 적용합니다. |
| `beta`   | `betaCheckIntervalHours`마다 확인하고(기본값: 매시간) 즉시 적용합니다.                                |
| `dev`    | 자동 적용이 없습니다. `openclaw update`를 수동으로 사용하세요.                                                           |

Gateway는 시작 시 업데이트 힌트도 기록합니다(`update.checkOnStart: false`로 비활성화).
다운그레이드 또는 사고 복구의 경우, `update.auto.enabled`가 구성되어 있어도 자동 적용을 차단하려면 Gateway 환경에 `OPENCLAW_NO_AUTO_UPDATE=1`을 설정하세요. `update.checkOnStart`도 비활성화하지 않는 한 시작 업데이트 힌트는 계속 실행될 수 있습니다.

실시간 Gateway 제어 플레인 핸들러를 통해 요청된 패키지 관리자 업데이트는 패키지 교체 후 지연 없고 쿨다운 없는 업데이트 재시작을 강제합니다. 이렇게 하면 이미 교체된 패키지 트리에서 청크를 지연 로드할 만큼 오래된 인메모리 프로세스가 남아 있는 일을 피할 수 있습니다. Shell `openclaw update`는 업데이트 전후로 서비스를 중지하고 다시 시작할 수 있으므로 감독되는 설치에 권장되는 경로로 유지됩니다.

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

### 커밋 고정(소스)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

최신으로 돌아가려면: `git checkout main && git pull`.

## 막혔을 때

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요.
- 소스 체크아웃에서 `openclaw update --channel dev`를 실행할 때, 필요한 경우 업데이터가 `pnpm`을 자동으로 부트스트랩합니다. pnpm/corepack 부트스트랩 오류가 보이면 `pnpm`을 수동으로 설치하거나(`corepack`을 다시 활성화) 업데이트를 다시 실행하세요.
- 확인: [문제 해결](/ko/gateway/troubleshooting)
- Discord에서 질문: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [설치 개요](/ko/install): 모든 설치 방법.
- [Doctor](/ko/gateway/doctor): 업데이트 후 상태 확인.
- [마이그레이션](/ko/install/migrating): 주요 버전 마이그레이션 가이드.
