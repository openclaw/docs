---
read_when:
    - 로컬에서 패키징한 Plugin을 대상으로 온보딩 또는 설정 흐름 테스트하기
    - Plugin 패키지를 게시하기 전에 검증하기
    - 자동 Plugin 설치를 테스트 아티팩트로 대체하기
sidebarTitle: Install overrides
summary: 설정 시 설치 흐름으로 패키징된 Plugin 오버라이드 테스트
title: Plugin 설치 재정의
x-i18n:
    generated_at: "2026-05-10T19:43:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin 설치 오버라이드를 사용하면 유지 관리자가 설정 시점의 Plugin 설치를
특정 npm 패키지 또는 로컬 npm-pack tarball에 대해 테스트할 수 있습니다. 이는 E2E 및 패키지
검증 전용입니다. 일반 사용자는
[`openclaw plugins install`](/ko/cli/plugins)로 Plugin을 설치해야 합니다.

<Warning>
오버라이드는 사용자가 제공한 소스의 Plugin 코드를 실행합니다. 격리된 상태 디렉터리나
폐기 가능한 테스트 머신에서만 사용하세요.
</Warning>

## 환경

두 변수가 모두 설정되어 있지 않으면 오버라이드는 비활성화됩니다.

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

오버라이드 맵은 Plugin id를 키로 하는 JSON입니다. 값은 다음을 지원합니다.

- 레지스트리 패키지와 정확한 버전 또는 태그에는 `npm:<registry-spec>`
- `npm pack`으로 생성된 로컬 tarball에는 `npm-pack:<path.tgz>`

상대 `npm-pack:` 경로는 현재 작업 디렉터리를 기준으로 해석됩니다.

## 동작

설정 시점 플로우가 맵에 id가 있는 Plugin 설치를 요청하면
OpenClaw는 catalog, bundled 또는 기본
npm 소스 대신 오버라이드 소스를 사용합니다. 이는 온보딩과 공유
설정 시점 Plugin 설치 프로그램을 사용하는 다른 플로우에 적용됩니다.

오버라이드는 여전히 예상 Plugin id를 강제합니다. `codex`에 매핑된 tarball은
manifest id가 `codex`인 Plugin을 설치해야 합니다.

오버라이드는 공식 신뢰 소스 상태를 상속하지 않습니다. catalog
항목이 일반적으로 OpenClaw 소유 패키지를 나타내더라도, 오버라이드는
운영자가 제공한 테스트 입력으로 처리됩니다.

워크스페이스 `.env` 파일은 설치 오버라이드를 활성화할 수 없습니다. 이러한 변수는
OpenClaw를 실행하는 신뢰할 수 있는 셸, CI 작업 또는 원격 테스트 명령에서 설정하세요.

## 패키지 E2E

격리된 상태 디렉터리를 사용해 패키지 설치와 설치 기록이 일반
OpenClaw 상태에 영향을 주지 않도록 하세요.

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

상태 디렉터리 아래에서 설치된 패키지를 확인하세요.

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

라이브 provider E2E의 경우 테스트 명령을 실행하기 전에 신뢰할 수 있는 셸 또는 CI secret에서
실제 API 키를 source하세요. 키를 출력하지 말고, 소스와
키가 있었는지만 보고하세요.
