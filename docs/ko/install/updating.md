---
read_when:
    - OpenClaw 업데이트하기
    - 업데이트 후 문제가 발생했습니다
summary: 전역 설치 또는 소스 기준으로 OpenClaw를 안전하게 업데이트하는 방법과 롤백 전략
title: 업데이트하기
x-i18n:
    generated_at: "2026-04-25T06:03:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

OpenClaw를 최신 상태로 유지하세요.

## 권장: `openclaw update`

가장 빠른 업데이트 방법입니다. 설치 유형(npm 또는 git)을 감지하고, 최신 버전을 가져오고, `openclaw doctor`를 실행한 뒤 gateway를 재시작합니다.

```bash
openclaw update
```

채널을 전환하거나 특정 버전을 대상으로 하려면:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 적용 없이 미리보기
```

`--channel beta`는 beta를 우선하지만, beta 태그가 없거나 최신 stable 릴리스보다 오래된 경우 런타임은 stable/latest로 폴백합니다. 일회성 패키지 업데이트에 원시 npm beta dist-tag를 원한다면 `--tag beta`를 사용하세요.

채널 의미는 [Development channels](/ko/install/development-channels)를 참고하세요.

## 대안: 설치 스크립트 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`를 추가하세요. 소스 설치의 경우 `--install-method git --no-onboard`를 전달하세요.

## 대안: 수동 npm, pnpm, 또는 bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 전역 npm 설치와 런타임 의존성

OpenClaw는 패키지된 전역 설치를, 전역 패키지 디렉터리가 현재 사용자에게 쓰기 가능하더라도 런타임에서는 읽기 전용으로 취급합니다. 번들 Plugin 런타임 의존성은 패키지 트리를 수정하는 대신 쓰기 가능한 런타임 디렉터리에 준비됩니다. 이렇게 하면 실행 중인 gateway나 로컬 에이전트가 같은 설치 중에 Plugin 의존성을 복구하는 상황에서 `openclaw update`와 충돌하지 않습니다.

일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw` 같은 root 소유 디렉터리 아래에 전역 패키지를 설치합니다. OpenClaw는 같은 외부 준비 경로를 통해 이 레이아웃도 지원합니다.

강화된 systemd 유닛에서는 `ReadWritePaths`에 포함된 쓰기 가능한 준비 디렉터리를 설정하세요:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR`가 설정되지 않으면, OpenClaw는 systemd가 제공하는 `$STATE_DIRECTORY`를 사용하고, 그다음 `~/.openclaw/plugin-runtime-deps`로 폴백합니다.

### 번들 Plugin 런타임 의존성

패키지된 설치는 번들 Plugin 런타임 의존성을 읽기 전용 패키지 트리 밖에 유지합니다. 시작 시와 `openclaw doctor --fix` 중에 OpenClaw는 config에서 활성화되었거나, 레거시 채널 config를 통해 활성화되었거나, 번들 매니페스트 기본값으로 활성화된 번들 Plugin에 대해서만 런타임 의존성을 복구합니다.

명시적 비활성화가 우선합니다. 비활성화된 Plugin 또는 채널은 패키지에 존재한다는 이유만으로 런타임 의존성이 복구되지 않습니다. 외부 Plugin과 사용자 지정 load 경로는 여전히 `openclaw plugins install` 또는 `openclaw plugins update`를 사용합니다.

## 자동 업데이터

자동 업데이터는 기본적으로 꺼져 있습니다. `~/.openclaw/openclaw.json`에서 활성화하세요:

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

| 채널     | 동작                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours`만큼 기다린 뒤 `stableJitterHours`에 걸쳐 결정적 지터를 적용하여 배포합니다(분산 롤아웃). |
| `beta`   | `betaCheckIntervalHours`마다(기본값: 매시간) 확인하고 즉시 적용합니다.                                        |
| `dev`    | 자동 적용 없음. `openclaw update`를 수동으로 사용하세요.                                                       |

gateway는 시작 시 업데이트 힌트도 기록합니다(`update.checkOnStart: false`로 비활성화).

## 업데이트 후

<Steps>

### doctor 실행

```bash
openclaw doctor
```

config를 마이그레이션하고, DM 정책을 감사하고, gateway 상태를 점검합니다. 자세한 내용: [Doctor](/ko/gateway/doctor)

### gateway 재시작

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

팁: `npm view openclaw version`은 현재 게시된 버전을 보여줍니다.

### 커밋 고정(소스)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

최신 상태로 돌아가려면: `git checkout main && git pull`.

## 막혔을 때

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요.
- 소스 체크아웃에서 `openclaw update --channel dev`를 사용할 때, 업데이터는 필요 시 `pnpm`을 자동 bootstrap합니다. pnpm/corepack bootstrap 오류가 보이면 `pnpm`을 수동으로 설치하거나(`corepack`을 다시 활성화한 뒤) 업데이트를 다시 실행하세요.
- 확인: [Troubleshooting](/ko/gateway/troubleshooting)
- Discord에서 문의: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [Install Overview](/ko/install) — 모든 설치 방법
- [Doctor](/ko/gateway/doctor) — 업데이트 후 상태 점검
- [Migrating](/ko/install/migrating) — 주요 버전 마이그레이션 가이드
