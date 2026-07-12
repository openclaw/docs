---
read_when:
    - 로컬로 패키징한 Plugin을 대상으로 온보딩 또는 설정 흐름 테스트하기
    - Plugin 패키지를 게시하기 전에 검증하기
    - 자동 Plugin 설치를 테스트 아티팩트로 대체하기
sidebarTitle: Install overrides
summary: 설정 시 설치 흐름으로 패키징된 Plugin 재정의 테스트하기
title: Plugin 설치 재정의
x-i18n:
    generated_at: "2026-07-12T00:59:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin 설치 재정의를 사용하면 유지관리자가 설정 시점의 Plugin 설치 대상을 카탈로그, 번들 또는 기본 npm 소스 대신 특정 npm 패키지나 로컬 `npm pack` tarball로 지정할 수 있습니다. 이 기능은 E2E 및 패키지 검증 전용이며, 일반 사용자는 [`openclaw plugins install`](/ko/cli/plugins)을 사용하여 Plugin을 설치합니다.

<Warning>
재정의는 사용자가 제공한 소스의 Plugin 코드를 실행합니다. 격리된 상태 디렉터리 또는 폐기 가능한 테스트 머신에서만 사용하세요.
</Warning>

## 환경

다음 두 변수를 모두 설정하지 않으면 재정의가 비활성화됩니다.

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

재정의 맵은 Plugin ID를 키로 사용하는 JSON입니다. 값은 다음 형식을 지원합니다.

| 접두사                | 소스                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | 레지스트리 패키지, 정확한 버전 또는 태그                                                       |
| `npm-pack:<path.tgz>` | `npm pack`으로 생성한 로컬 tarball. 상대 경로는 현재 작업 디렉터리를 기준으로 해석됨 |

## 동작

설정 시점 흐름에서 설치하는 Plugin의 ID가 맵에 있으면 OpenClaw는 카탈로그, 번들 또는 기본 npm 소스 대신 재정의 소스를 사용합니다. 이는 온보딩 및 공유 설정 시점 Plugin 설치 프로그램을 사용하는 다른 모든 흐름에 적용됩니다.

- 재정의에도 예상 Plugin ID가 계속 적용됩니다. `codex`에 매핑된 tarball은 매니페스트 ID가 `codex`인 Plugin을 설치해야 합니다.
- 재정의는 공식 신뢰 소스 상태를 상속하지 않습니다. 카탈로그 항목이 일반적으로 OpenClaw 소유 패키지를 나타내더라도 재정의는 운영자가 제공한 테스트 입력으로 취급됩니다.
- 작업 공간 `.env` 파일로는 설치 재정의를 활성화할 수 없습니다. 두 환경 변수 모두 차단된 작업 공간 dotenv 목록에 포함됩니다. OpenClaw를 실행하는 신뢰할 수 있는 셸, CI 작업 또는 원격 테스트 명령에서 설정하세요.

## 패키지 E2E

패키지 설치 및 설치 기록이 일반 OpenClaw 상태에 영향을 주지 않도록 격리된 상태 디렉터리를 사용하세요.

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

상태 디렉터리 아래에서 설치된 패키지를 확인하세요.

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

실제 공급자 E2E의 경우 테스트 명령을 실행하기 전에 신뢰할 수 있는 셸 또는 CI 비밀에서 실제 API 키를 가져오세요. 키를 출력하지 말고, 소스와 키의 존재 여부만 보고하세요.
