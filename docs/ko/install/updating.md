---
read_when:
    - OpenClaw 업데이트하기
    - 업데이트 후 문제가 발생했습니다.
summary: OpenClaw를 안전하게 업데이트하기(전역 설치 또는 소스), 그리고 롤백 전략
title: 업데이트
x-i18n:
    generated_at: "2026-04-26T11:33:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

OpenClaw를 최신 상태로 유지하세요.

## 권장: `openclaw update`

가장 빠른 업데이트 방법입니다. 설치 유형(npm 또는 git)을 감지하고, 최신 버전을 가져오고, `openclaw doctor`를 실행한 다음 Gateway를 재시작합니다.

```bash
openclaw update
```

채널을 전환하거나 특정 버전을 대상으로 하려면:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 적용 없이 미리 보기
```

`--channel beta`는 beta를 우선 사용하지만, beta 태그가 없거나 최신 stable 릴리스보다 오래된 경우 런타임은 stable/latest로 fallback합니다. 일회성 패키지 업데이트에 raw npm beta dist-tag를 원한다면 `--tag beta`를 사용하세요.

채널 의미는 [개발 채널](/ko/install/development-channels)을 참조하세요.

## npm 설치와 git 설치 간 전환

설치 유형을 바꾸고 싶다면 채널을 사용하세요. updater는 `~/.openclaw`의
상태, 구성, 자격 증명, 워크스페이스는 유지하고, CLI와 Gateway가 사용하는
OpenClaw 코드 설치만 변경합니다.

```bash
# npm 패키지 설치 -> 편집 가능한 git checkout
openclaw update --channel dev

# git checkout -> npm 패키지 설치
openclaw update --channel stable
```

정확한 설치 모드 전환을 미리 보려면 먼저 `--dry-run`으로 실행하세요:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 채널은 git checkout을 보장하고, 이를 빌드한 뒤, 해당 checkout에서 글로벌 CLI를 설치합니다. `stable`과 `beta` 채널은 패키지 설치를 사용합니다. Gateway가 이미 설치되어 있으면 `openclaw update`는 서비스 메타데이터를 새로 고치고, `--no-restart`를 전달하지 않는 한 이를 재시작합니다.

## 대안: 설치 프로그램 다시 실행

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

온보딩을 건너뛰려면 `--no-onboard`를 추가하세요. 설치 프로그램을 통해 특정 설치 유형을 강제하려면 `--install-method git --no-onboard` 또는 `--install-method npm --no-onboard`를 전달하세요.

## 대안: 수동 npm, pnpm, 또는 bun

```bash
npm i -g openclaw@latest
```

`openclaw update`가 글로벌 npm 설치를 관리할 때는 먼저 일반 글로벌 설치 명령을 실행합니다. 그 명령이 실패하면 OpenClaw는 `--omit=optional`로 한 번 더 재시도합니다. 이 재시도는 네이티브 optional dependency를 컴파일할 수 없는 호스트에서 도움이 되며, fallback도 실패하면 원래 실패 내용도 계속 보이도록 유지합니다.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 글로벌 npm 설치와 런타임 의존성

OpenClaw는 현재 사용자가 글로벌 패키지 디렉터리에 쓸 수 있더라도, 패키지된 글로벌 설치를 런타임에서는 읽기 전용으로 취급합니다. 번들 Plugin 런타임 의존성은 패키지 트리를 변경하는 대신 쓰기 가능한 런타임 디렉터리에 준비됩니다. 이렇게 하면 실행 중인 Gateway 또는 로컬 에이전트가 같은 설치 중에 Plugin 의존성을 복구할 때 `openclaw update`와 충돌하는 것을 막을 수 있습니다.

일부 Linux npm 설정은 `/usr/lib/node_modules/openclaw`처럼 root 소유 디렉터리 아래에 글로벌 패키지를 설치합니다. OpenClaw는 동일한 외부 준비 경로를 통해 이 레이아웃도 지원합니다.

강화된 systemd unit에서는 `ReadWritePaths`에 포함된 쓰기 가능한 준비 디렉터리를 설정하세요:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

`OPENCLAW_PLUGIN_STAGE_DIR`가 설정되지 않으면 OpenClaw는 systemd가 제공하는 경우 `$STATE_DIRECTORY`를 사용하고, 그다음 `~/.openclaw/plugin-runtime-deps`로 fallback합니다.
복구 단계는 이 준비 디렉터리를 OpenClaw 소유의 로컬 패키지 루트로 취급하고
사용자의 npm prefix/global 설정을 무시하므로, 글로벌 설치용 npm 구성이
번들 Plugin 의존성을 `~/node_modules`나 글로벌 패키지 트리로 리디렉션하지 않습니다.

패키지 업데이트와 번들 런타임 의존성 복구 전에, OpenClaw는 대상 볼륨에 대해 최선형 디스크 공간 검사를 시도합니다. 공간이 부족하면 검사한 경로와 함께 경고를 출력하지만, 파일시스템 quota, snapshot, 네트워크 볼륨은 검사 후에도 바뀔 수 있으므로 업데이트를 막지는 않습니다. 실제 npm 설치, 복사, 설치 후 검증이 최종 기준입니다.

### 번들 Plugin 런타임 의존성

패키지된 설치는 번들 Plugin 런타임 의존성을 읽기 전용 패키지 트리 밖에 유지합니다. 시작 시와 `openclaw doctor --fix` 중에, OpenClaw는 구성에서 활성 상태이거나, 레거시 채널 구성을 통해 활성 상태이거나, 번들 manifest 기본값에 의해 활성화된 번들 Plugin에 대해서만 런타임 의존성을 복구합니다. 저장된 채널 인증 상태만으로는 Gateway 시작 시 런타임 의존성 복구를 트리거하지 않습니다.

명시적 비활성화가 우선합니다. 패키지 안에 존재하더라도 비활성화된 Plugin 또는 채널의 런타임 의존성은 복구되지 않습니다. 외부 Plugin 및 사용자 지정 로드 경로는 여전히 `openclaw plugins install` 또는 `openclaw plugins update`를 사용합니다.

## 자동 업데이트

자동 updater는 기본적으로 꺼져 있습니다. `~/.openclaw/openclaw.json`에서 활성화하세요:

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
| `stable` | `stableDelayHours`만큼 대기한 뒤, `stableJitterHours`에 걸쳐 결정적 jitter를 적용해 배포합니다(점진적 롤아웃). |
| `beta`   | `betaCheckIntervalHours`마다 확인하고(기본값: 매시간) 즉시 적용합니다.                                         |
| `dev`    | 자동 적용 없음. `openclaw update`를 수동으로 사용하세요.                                                       |

Gateway는 시작 시 업데이트 힌트도 기록합니다(`update.checkOnStart: false`로 비활성화 가능).

## 업데이트 후

<Steps>

### doctor 실행

```bash
openclaw doctor
```

구성을 마이그레이션하고, DM 정책을 감사하며, Gateway 상태를 검사합니다. 자세한 내용: [Doctor](/ko/gateway/doctor)

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

팁: `npm view openclaw version`은 현재 게시된 버전을 보여줍니다.

### 커밋 고정(소스)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

최신 상태로 돌아가려면: `git checkout main && git pull`

## 막혔을 때

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요.
- 소스 checkout에서 `openclaw update --channel dev`를 사용할 때 updater는 필요 시 `pnpm`을 자동 bootstrap합니다. pnpm/corepack bootstrap 오류가 보이면 `pnpm`을 수동으로 설치하거나 `corepack`을 다시 활성화한 뒤 업데이트를 다시 실행하세요.
- 확인: [문제 해결](/ko/gateway/troubleshooting)
- Discord에서 문의: [https://discord.gg/clawd](https://discord.gg/clawd)

## 관련 항목

- [설치 개요](/ko/install) — 모든 설치 방법
- [Doctor](/ko/gateway/doctor) — 업데이트 후 상태 검사
- [마이그레이션](/ko/install/migrating) — 주요 버전 마이그레이션 가이드
