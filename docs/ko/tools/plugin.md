---
doc-schema-version: 1
read_when:
    - Plugin 설치 또는 구성
    - Plugin 검색 및 로드 규칙 이해하기
    - Codex/Claude 호환 Plugin 번들 작업
sidebarTitle: Getting Started
summary: OpenClaw Plugin 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-06-27T18:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugin은 채널, 모델 제공자, 에이전트 하네스, 도구,
Skills, 음성, 실시간 전사, 보이스, 미디어 이해, 생성,
웹 가져오기, 웹 검색 및 기타 런타임 기능으로 OpenClaw를 확장합니다.

Plugin을 설치하고, Gateway를 다시 시작하고, 런타임이 이를 로드했는지 확인하고,
일반적인 설정 실패를 처리하려면 이 페이지를 사용하세요. 명령 전용
예제는 [Plugin 관리](/ko/plugins/manage-plugins)를 참조하세요. 번들, 공식 외부,
소스 전용 Plugin의 전체 생성 인벤토리는
[Plugin 인벤토리](/ko/plugins/plugin-inventory)를 참조하세요.

## 요구 사항

Plugin을 설치하기 전에 다음을 확인하세요.

- `openclaw` CLI를 사용할 수 있는 OpenClaw 체크아웃 또는 설치
- ClawHub, npm 또는 git 호스트 같은 선택한 소스에 대한 네트워크 액세스
- 해당 Plugin의 설정 문서에서 지정한 Plugin별 자격 증명, config 키 또는 운영 체제 도구
- 채널을 제공하는 Gateway를 다시 로드하거나 다시 시작할 수 있는 권한

## 빠른 시작

<Steps>
  <Step title="Plugin 찾기">
    공개 Plugin 패키지는 [ClawHub](/ko/clawhub)에서 검색하세요.

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub는 커뮤니티 Plugin의 기본 탐색 표면입니다. 출시 전환 기간에는
    일반 bare 패키지 명세가 공식 Plugin id와 일치하지 않는 한 여전히 npm에서
    설치됩니다. 번들 Plugin과 일치하는 원시 `@openclaw/*` 패키지 명세는
    현재 OpenClaw 빌드의 번들 사본을 사용합니다. 특정 소스가 필요할 때는
    명시적 접두사를 사용하세요.

  </Step>

  <Step title="Plugin 설치">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin 설치는 코드를 실행하는 것처럼 취급하세요. 재현 가능한 프로덕션
    설치가 필요할 때는 고정된 버전을 선호하세요.

  </Step>

  <Step title="구성하고 활성화하기">
    Plugin별 설정은 `plugins.entries.<id>.config` 아래에 구성하세요.
    Plugin이 아직 활성화되어 있지 않으면 활성화하세요.

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    config가 제한적인 `plugins.allow` 목록을 사용하는 경우, 설치된 Plugin
    id가 그 목록에 있어야 Plugin을 로드할 수 있습니다.
    `openclaw plugins install`은 설치된 id를 기존 `plugins.allow` 목록에
    추가하고, 같은 id를 `plugins.deny`에서 제거하여 명시적 설치가 다시 시작
    후 로드될 수 있게 합니다.

  </Step>

  <Step title="Gateway 다시 로드 허용">
    Plugin 코드를 설치, 업데이트 또는 제거하려면 Gateway를 다시 시작해야
    합니다. 관리형 Gateway가 config 다시 로드를 활성화한 상태로 이미 실행
    중이면 OpenClaw는 변경된 Plugin 설치 기록을 감지하고 Gateway를 자동으로
    다시 시작합니다. Gateway가 관리형이 아니거나 다시 로드가 비활성화되어
    있으면 직접 다시 시작하세요.

    ```bash
    openclaw gateway restart
    ```

    활성화 및 비활성화 작업은 config를 업데이트하고 콜드 레지스트리를
    새로 고칩니다. 라이브 런타임 표면에 대한 가장 명확한 확인 경로는 여전히
    런타임 inspect입니다.

  </Step>

  <Step title="런타임 등록 확인">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    등록된 도구, hooks, 서비스, Gateway 메서드 또는 Plugin 소유 CLI 명령을
    증명해야 할 때는 `--runtime`을 사용하세요. 일반 `inspect`는 콜드 manifest
    및 레지스트리 검사입니다.

  </Step>
</Steps>

## 구성

### 설치 소스 선택

| 소스        | 사용 시점                                                                       | 예제                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw 네이티브 탐색, 스캔, 버전 메타데이터, 설치 힌트가 필요할 때           | `openclaw plugins install clawhub:<package>`                   |
| npm         | 직접 npm 레지스트리 또는 dist-tag 워크플로가 필요할 때                         | `openclaw plugins install npm:<package>`                       |
| git         | 저장소의 브랜치, 태그 또는 커밋이 필요할 때                                    | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| local path  | 같은 머신에서 Plugin을 개발하거나 테스트할 때                                  | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Claude 호환 marketplace Plugin을 설치할 때                                     | `openclaw plugins install <plugin> --marketplace <source>`     |

Bare 패키지 명세에는 특수한 호환성 동작이 있습니다. bare 이름이 번들 Plugin
id와 일치하면 OpenClaw는 해당 번들 소스를 사용합니다. 공식 외부 Plugin id와
일치하면 OpenClaw는 공식 패키지 카탈로그를 사용합니다. 그 밖의 일반 bare
패키지 명세는 출시 전환 기간 동안 npm을 통해 설치됩니다. 번들 Plugin과
일치하는 원시 `@openclaw/*` 패키지 명세도 npm fallback 전에 번들 사본으로
해석됩니다. 이미지 소유 번들 사본 대신 외부 npm 패키지를 의도적으로
원할 때는 `npm:@openclaw/<plugin>@<version>`을 사용하세요. 결정적 소스 선택이
필요할 때는 `clawhub:`, `npm:`, `git:` 또는 `npm-pack:`을 사용하세요. 전체 명령
계약은 [`openclaw plugins`](/ko/cli/plugins#install)를 참조하세요.

npm 설치의 경우, 고정되지 않은 패키지 명세와 `@latest`는 이 OpenClaw 빌드와
호환성을 광고하는 최신 안정 패키지를 선택합니다. npm의 현재 latest 릴리스가
더 새로운 `openclaw.compat.pluginApi` 또는 `openclaw.install.minHostVersion`을
선언하면 OpenClaw는 이전 안정 패키지 버전을 스캔하고 맞는 최신 버전을
설치합니다. 정확한 버전과 `@beta` 같은 명시적 채널 태그는 선택한 패키지에
고정되며, 호환되지 않으면 실패합니다.

### 운영자 설치 정책

Plugin 설치 또는 업데이트가 진행되기 전에 신뢰할 수 있는 로컬 정책 명령을
실행하도록 `security.installPolicy`를 구성하세요. 정책은 메타데이터와 staged
소스 경로를 받아 설치를 허용하거나 차단할 수 있습니다. 이는 CLI 및
Gateway 기반 Plugin 설치/업데이트 경로에 적용됩니다. Plugin `before_install`
hooks는 Plugin hooks가 로드된 OpenClaw 프로세스에서만 나중에 실행되므로,
운영자 소유 설치 결정에는 `security.installPolicy`를 사용하세요. 더 이상 권장되지
않는 `--dangerously-force-unsafe-install` 플래그는 호환성을 위해 허용되지만 설치
정책이나 OpenClaw의 기본 Plugin 의존성 거부 목록을 우회하지 않습니다.

Skills와 Plugin 모두에서 사용하는 공유 `security.installPolicy` exec 스키마는
[Skills config](/ko/tools/skills-config#operator-install-policy-securityinstallpolicy)를
참조하세요.

### Plugin 정책 구성

일반적인 Plugin config 형태는 다음과 같습니다.

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

주요 정책 규칙:

- `plugins.enabled: false`는 모든 Plugin을 비활성화하고 Plugin 탐색/로드
  작업을 건너뜁니다. 이 설정이 활성화된 동안 오래된 Plugin 참조는 비활성
  상태입니다. 오래된 id를 제거하려면 doctor 정리를 실행하기 전에 Plugin을
  다시 활성화하세요.
- `plugins.deny`는 allow 및 Plugin별 활성화보다 우선합니다.
- `plugins.allow`는 배타적 allowlist입니다. allowlist 밖의 Plugin 소유 도구는
  `tools.allow`에 `"*"`가 포함되어 있어도 사용할 수 없습니다.
- `plugins.entries.<id>.enabled: false`는 config를 보존하면서 하나의 Plugin을
  비활성화합니다.
- `plugins.load.paths`는 명시적 로컬 Plugin 파일 또는 디렉터리를 추가합니다.
  관리형 `plugins install` 로컬 경로는 Plugin 디렉터리 또는 아카이브여야 합니다.
  독립 실행형 Plugin 파일에는 `plugins.load.paths`를 사용하세요.
- 워크스페이스 출처 Plugin은 기본적으로 비활성화됩니다. 로컬 워크스페이스
  코드를 사용하기 전에 명시적으로 활성화하거나 allowlist에 추가하세요.
- 번들 Plugin은 config가 명시적으로 재정의하지 않는 한 내장 default-on/default-off
  메타데이터를 따릅니다.
- `plugins.slots.<slot>`은 memory 및 context 엔진 같은 독점 범주에 대해 하나의
  Plugin을 선택합니다. 슬롯 선택은 명시적 활성화로 계산되어 해당 슬롯의 선택된
  Plugin을 강제로 활성화합니다. 따라서 원래 opt-in이어야 하더라도 로드될 수
  있습니다. 그래도 `plugins.deny`와 `plugins.entries.<id>.enabled: false`는 이를
  차단합니다.
- 번들 opt-in Plugin은 provider/model ref, 채널 config, CLI backend 또는 에이전트
  하네스 런타임 같은 소유 표면 중 하나가 config에 지정되면 자동 활성화될 수
  있습니다.
- OpenAI 계열 Codex 라우팅은 제공자와 런타임 Plugin 경계를 분리해 유지합니다.
  레거시 Codex 모델 ref는 doctor가 복구하는 레거시 config이며, 번들 `codex`
  Plugin은 canonical `openai/*` 에이전트 ref, 명시적 `agentRuntime.id: "codex"`,
  그리고 레거시 `codex/*` ref에 대한 Codex app-server 런타임을 소유합니다.

`plugins.allow`가 설정되지 않았고 번들되지 않은 Plugin이 워크스페이스 또는
전역 Plugin 루트에서 자동 탐색되면, 시작 로그에
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`가 표시됩니다.
경고에는 탐색된 Plugin id가 포함되며, 짧은 목록의 경우 최소
`plugins.allow` 스니펫도 포함됩니다. 신뢰하는 Plugin을 `openclaw.json`에
복사하기 전에 나열된 Plugin id로
[`openclaw plugins list --enabled --verbose`](/ko/cli/plugins#list) 또는
[`openclaw plugins inspect <id>`](/ko/cli/plugins#inspect)를 실행하세요. 진단에서 Plugin이
`without install/load-path provenance` 상태로 로드되었다고 말할 때도 같은 신뢰 고정
지침이 적용됩니다. 해당 Plugin id를 inspect한 다음, 신뢰하는 id를 `plugins.allow`에
고정하거나 신뢰할 수 있는 소스에서 다시 설치하여 OpenClaw가 설치 출처를
기록하도록 하세요.

config 검증에서 오래된 Plugin id, allowlist/도구 불일치 또는 레거시 번들 Plugin
경로를 보고하면 `openclaw doctor` 또는 `openclaw doctor --fix`를 실행하세요.

## Plugin 형식 이해

OpenClaw는 두 가지 Plugin 형식을 인식합니다.

| 형식                   | 로드 방식                                                                    | 사용 시점                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 네이티브 OpenClaw Plugin | `openclaw.plugin.json` 및 프로세스 내에서 로드되는 런타임 모듈              | OpenClaw 전용 런타임 기능을 설치하거나 빌드할 때                       |
| 호환 번들              | OpenClaw Plugin 인벤토리로 매핑되는 Codex, Claude 또는 Cursor Plugin 레이아웃 | 호환 Skills, 명령, hooks 또는 번들 메타데이터를 재사용할 때            |

두 형식 모두 `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable`, `openclaw plugins disable`에 표시됩니다. 번들 호환성 경계는
[Plugin 번들](/ko/plugins/bundles)을, 네이티브 Plugin 작성은
[Plugin 빌드](/ko/plugins/building-plugins)를 참조하세요.

## Plugin hooks

Plugin은 런타임에서 hooks를 등록할 수 있지만, 역할이 서로 다른 두 API가
있습니다.

- 런타임 lifecycle hooks에는 `api.on(...)`을 통한 typed hooks를 사용하세요.
  이는 middleware, 정책, 메시지 재작성, prompt shaping 및 도구 제어에 선호되는
  표면입니다.
- [Hooks](/ko/automation/hooks)에 설명된 내부 hook 시스템에 참여하려는 경우에만
  `api.registerHook(...)`을 사용하세요. 이는 주로 거친 명령/lifecycle 부작용 및
  기존 HOOK 스타일 자동화와의 호환성을 위한 것입니다.

간단한 규칙:

- handler에 priority, merge semantics 또는 block/cancel 동작이 필요하면 typed
  Plugin hooks를 사용하세요.
- handler가 `command:new`, `command:reset`, `message:sent` 또는 유사한 거친 이벤트에
  반응하기만 하면 `api.registerHook(...)`으로 충분합니다.

Plugin이 관리하는 내부 hooks는 `openclaw hooks list`에 `plugin:<id>`로 표시됩니다.
`openclaw hooks`를 통해 활성화하거나 비활성화할 수는 없습니다. 대신 Plugin을
활성화하거나 비활성화하세요.

## 활성 Gateway 확인

`openclaw plugins list`와 일반 `openclaw plugins inspect`는 콜드 구성,
매니페스트, registry 상태를 읽습니다. 이미 실행 중인 Gateway가 동일한 Plugin 코드를
가져왔다는 것을 증명하지는 않습니다.

Plugin이 설치된 것으로 보이지만 실시간 채팅 트래픽에서 사용되지 않는 경우:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

관리형 Gateway는 Plugin 설치, 업데이트, 제거 변경으로 Plugin 소스가 바뀌면 자동으로
다시 시작됩니다. VPS 또는 컨테이너 설치에서는 수동 재시작 대상이 wrapper나 supervisor만이
아니라 채널을 제공하는 실제 `openclaw gateway run` 하위 프로세스인지 확인하세요.

## 문제 해결

| 증상                                                        | 확인                                                                                                                                      | 수정                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin이 `plugins list`에 표시되지만 런타임 hook이 실행되지 않음  | `openclaw plugins inspect <id> --runtime --json`를 사용하고 `gateway status --deep --require-rpc`로 활성 Gateway를 확인하세요             | 설치, 업데이트, 구성 또는 소스 변경 후 실시간 Gateway를 다시 시작하세요                               |
| 중복 채널 또는 도구 소유권 진단이 표시됨         | `openclaw plugins list --enabled --verbose`를 실행하고, 의심되는 각 Plugin을 `--runtime --json`으로 검사한 뒤 채널/도구 소유권을 비교하세요 | 한 소유자를 비활성화하거나, 오래된 설치를 제거하거나, 의도적인 교체에는 매니페스트 `preferOver`를 사용하세요      |
| 구성에서 Plugin이 없다고 표시됨                                | [Plugin 인벤토리](/ko/plugins/plugin-inventory)에서 bundled, 공식 외부, source-only 중 무엇인지 확인하세요                           | 외부 패키지를 설치하거나, bundled Plugin을 활성화하거나, 오래된 구성을 제거하세요                         |
| 설치 중 구성이 유효하지 않음                               | 검증 메시지를 읽고 오래된 Plugin 상태를 가리키는 경우 `openclaw doctor --fix`를 실행하세요                                           | Doctor는 항목을 비활성화하고 유효하지 않은 payload를 제거하여 유효하지 않은 Plugin 구성을 격리할 수 있습니다     |
| 의심스러운 소유권 또는 권한으로 Plugin 경로가 차단됨 | 구성 오류 앞의 진단을 확인하세요                                                                                             | 파일 시스템 소유권/권한을 수정한 다음 `openclaw plugins registry --refresh`를 실행하세요                    |
| `OPENCLAW_NIX_MODE=1`이 수명 주기 명령을 차단함                | 설치가 Nix로 관리되는지 확인하세요                                                                                                      | Plugin 변경 명령을 사용하는 대신 Nix 소스에서 Plugin 선택을 변경하세요                      |
| 런타임에서 dependency import가 실패함                             | Plugin이 npm/git/ClawHub를 통해 설치되었는지 또는 로컬 경로에서 로드되었는지 확인하세요                                                 | `openclaw plugins update <id>`를 실행하거나, 소스를 다시 설치하거나, 로컬 Plugin dependency를 직접 설치하세요 |

오래된 Plugin 구성에 더 이상 발견할 수 없는 채널 Plugin이 여전히 지정되어 있으면,
Gateway 시작은 모든 다른 채널을 차단하는 대신 해당 Plugin 기반 채널을 건너뜁니다.
`openclaw doctor --fix`를 실행하여 오래된 Plugin 및 채널 항목을 제거하세요. 오래된
Plugin 증거가 없는 알 수 없는 채널 키는 여전히 검증에 실패하므로 오타가 드러납니다.

의도적인 채널 교체의 경우, 선호되는 Plugin은 legacy 또는 낮은 우선순위의 Plugin id로
`channelConfigs.<channel-id>.preferOver`를 선언해야 합니다. 두 Plugin이 모두 명시적으로
활성화되어 있으면 OpenClaw는 해당 요청을 유지하고, 한 소유자를 조용히 선택하는 대신
중복 채널 또는 도구 진단을 보고합니다.

설치된 패키지가 `requires compiled runtime output for
TypeScript entry ...`를 보고하면, 해당 패키지는 런타임에서 OpenClaw에 필요한 JavaScript 파일 없이
게시된 것입니다. 게시자가 컴파일된 JavaScript를 제공한 후 업데이트하거나 다시 설치하거나,
그때까지 Plugin을 비활성화/제거하세요.

### 차단된 Plugin 경로 소유권

Plugin 진단에
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`가 표시되고
구성 검증이 `plugin present but blocked`로 이어지면, OpenClaw가 Plugin 파일이 이를 로드하는
프로세스와 다른 Unix 사용자 소유임을 발견한 것입니다. Plugin 구성은 그대로 두고, 파일 시스템
소유권을 수정하거나 상태 디렉터리의 소유자와 같은 사용자로 OpenClaw를 실행하세요.

Docker 설치의 경우 공식 이미지는 `node`(uid `1000`)로 실행되므로, 호스트에서 bind-mounted된
OpenClaw 구성 및 workspace 디렉터리는 일반적으로 uid `1000` 소유여야 합니다.

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

의도적으로 OpenClaw를 root로 실행하는 경우, 관리형 Plugin root를 대신 root 소유권으로 복구하세요.

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

소유권을 수정한 후 `openclaw doctor --fix` 또는
`openclaw plugins registry --refresh`를 다시 실행하여 persisted Plugin registry가 복구된 파일과
일치하도록 하세요.

### 느린 Plugin 도구 설정

도구를 준비하는 동안 agent turn이 멈춘 것처럼 보이면 trace logging을 활성화하고
Plugin 도구 factory timing line을 확인하세요.

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

다음을 찾으세요.

```text
[trace:plugin-tools] factory timings ...
```

요약에는 총 factory 시간과 가장 느린 Plugin 도구 factory가 나열되며,
Plugin id, 선언된 도구 이름, 결과 형태, 도구가 optional인지 여부가 포함됩니다.
단일 factory가 최소 1초가 걸리거나 총 Plugin 도구 factory 준비가 최소 5초가 걸리면
느린 line이 경고로 승격됩니다.

OpenClaw는 동일한 유효 요청 context로 반복 resolution할 때 성공한 Plugin 도구 factory 결과를
캐시합니다. cache key에는 유효 런타임 구성, workspace, agent/session id, sandbox policy,
브라우저 설정, delivery context, requester identity, ownership state가 포함되므로, 해당 trusted
field에 의존하는 factory는 context가 변경될 때 다시 실행됩니다. timing이 계속 높게 유지되면
Plugin이 도구 정의를 반환하기 전에 비용이 큰 작업을 수행하고 있을 수 있습니다.

한 Plugin이 timing을 지배한다면 런타임 등록을 검사하세요.

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

그런 다음 해당 Plugin을 업데이트, 재설치 또는 비활성화하세요. Plugin 작성자는 비용이 큰
dependency loading을 도구 factory 내부에서 수행하지 말고 도구 실행 경로 뒤로 이동해야 합니다.

dependency root, package metadata 검증, registry record, startup reload 동작, legacy cleanup은
[Plugin dependency resolution](/ko/plugins/dependency-resolution)을 참조하세요.

## 관련

- [Plugin 관리](/ko/plugins/manage-plugins) - list, install, update, uninstall, publish 명령 예시
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [Plugin 인벤토리](/ko/plugins/plugin-inventory) - 생성된 bundled 및 외부 Plugin 목록
- [Plugin 참조](/ko/plugins/reference) - 생성된 Plugin별 참조 페이지
- [커뮤니티 Plugin](/ko/plugins/community) - ClawHub discovery 및 docs PR 정책
- [Plugin dependency resolution](/ko/plugins/dependency-resolution) - install root, registry record, runtime boundary
- [Plugin 빌드](/ko/plugins/building-plugins) - native Plugin authoring guide
- [Plugin SDK 개요](/ko/plugins/sdk-overview) - runtime registration, hook, API field
- [Plugin 매니페스트](/ko/plugins/manifest) - manifest 및 package metadata
