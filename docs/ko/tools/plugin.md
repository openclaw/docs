---
doc-schema-version: 1
read_when:
    - Plugin 설치 또는 구성하기
    - Plugin 검색 및 로드 규칙 이해하기
    - Codex/Claude 호환 Plugin 번들 사용하기
sidebarTitle: Getting Started
summary: OpenClaw 플러그인 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-07-16T13:09:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Plugins는 채널, 모델 제공자, 에이전트 하네스, 도구,
Skills, 음성, 실시간 전사, 음성 기능, 미디어 이해, 생성,
웹 가져오기, 웹 검색 및 기타 런타임 기능으로 OpenClaw를 확장합니다.

이 페이지를 사용하여 Plugin을 설치하고, Gateway를 다시 시작하고, 런타임이
이를 로드했는지 확인하고, 일반적인 설정 실패를 해결하십시오. 명령 전용 예시는
[Plugin 관리](/ko/plugins/manage-plugins)를 참조하십시오. 번들, 공식 외부 및 소스 전용
Plugin의 생성된 인벤토리는
[Plugin 인벤토리](/ko/plugins/plugin-inventory)를 참조하십시오.

## 요구 사항

- OpenClaw 체크아웃 또는 `openclaw` CLI를 사용할 수 있는 설치 환경
- 선택한 소스(ClawHub, npm 또는 git 호스트)에 대한 네트워크 액세스
- 해당 Plugin의 설정 문서에 명시된 Plugin별 자격 증명, 구성 키 또는 OS 도구
- 채널을 제공하는 Gateway를 다시 로드하거나 다시 시작할 수 있는 권한

## 빠른 시작

<Steps>
  <Step title="Plugin 찾기">
    공개 Plugin 패키지를 [ClawHub](/clawhub)에서 검색하십시오.

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub는 커뮤니티 Plugin을 검색하는 기본 경로입니다. 출시 전환 기간에는
    일반적인 접두사 없는 패키지 사양이 공식 Plugin ID와 일치하지 않는 한
    npm에서 계속 설치됩니다. 번들 Plugin과 일치하는 원시 `@openclaw/*` 사양은
    해당 번들 사본으로 확인됩니다. 특정 소스가 필요한 경우 명시적 소스 접두사를
    사용하십시오.

  </Step>

  <Step title="Plugin 설치">
    ```bash
    # ClawHub에서 설치합니다.
    openclaw plugins install clawhub:<package>

    # npm에서 설치합니다.
    openclaw plugins install npm:<package>

    # git에서 설치합니다.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 로컬 개발 체크아웃에서 설치합니다.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin 설치는 코드를 실행하는 것처럼 취급하십시오. 재현 가능한 프로덕션 설치를
    위해 고정된 버전을 권장합니다. ClawHub 패키지와 OpenClaw의
    번들/공식 카탈로그는 신뢰할 수 있는 소스입니다. 새 임의 npm, git,
    로컬 경로/아카이브, `npm-pack:` 또는 마켓플레이스 소스는
    소스를 검토하고 신뢰한 후 비대화형 설치에서
    `--force`이 필요합니다.

  </Step>

  <Step title="구성 및 활성화">
    `plugins.entries.<id>.config` 아래에서 Plugin별 설정을 구성하십시오.
    아직 활성화되지 않은 경우 Plugin을 활성화하십시오.

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow`이 설정된 경우 Plugin을 로드하려면 설치된 Plugin ID가 해당 목록에
    있어야 합니다. `openclaw plugins install`은 설치된
    ID를 기존 `plugins.allow` 목록에 추가하고 동일한 ID를
    `plugins.deny`에서 제거하므로 명시적으로 설치한 Plugin을 다시 시작한 후 로드할 수 있습니다.

  </Step>

  <Step title="Gateway 다시 로드">
    Plugin 코드를 설치, 업데이트 또는 제거하려면 Gateway를
    다시 시작해야 합니다. 구성 다시 로드가 활성화된 관리형 Gateway는 변경된
    Plugin 설치 레코드를 감지하고 자동으로 다시 시작합니다. 그렇지 않으면 직접
    다시 시작하십시오.

    ```bash
    openclaw gateway restart
    ```

    활성화/비활성화는 구성과 콜드 레지스트리를 업데이트합니다. 라이브 런타임 표면을
    확인하는 가장 명확한 방법은 여전히 런타임 검사입니다.

  </Step>

  <Step title="런타임 등록 확인">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    등록된 도구, 훅, 서비스, Gateway 메서드 또는 Plugin 소유 CLI 명령을
    확인하려면 `--runtime`을 사용하십시오. 일반 `inspect`은 콜드 매니페스트
    및 레지스트리 검사만 수행합니다.

  </Step>
</Steps>

## 구성

### 설치 소스 선택

| 소스        | 사용 시점                                                                      | 예시                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw 네이티브 검색, 검사, 버전 메타데이터 및 설치 힌트가 필요한 경우       | `openclaw plugins install clawhub:<package>`                   |
| npm         | npm 레지스트리 또는 dist-tag 워크플로가 직접 필요한 경우                       | `openclaw plugins install npm:<package>`                       |
| git         | 저장소의 브랜치, 태그 또는 커밋이 필요한 경우                                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 로컬 경로   | 동일한 머신에서 Plugin을 개발하거나 테스트하는 경우                            | `openclaw plugins install --link ./my-plugin`                  |
| 마켓플레이스 | Claude 호환 마켓플레이스 Plugin을 설치하는 경우                                | `openclaw plugins install <plugin> --marketplace <source>`     |

접두사 없는 패키지 사양에는 특별한 호환성 동작이 있습니다. 번들 Plugin ID와
일치하는 접두사 없는 이름은 해당 번들 소스를 사용하고, 공식 외부 Plugin ID와 일치하는
접두사 없는 이름은 공식 패키지 카탈로그를 사용하며, 그 밖의 접두사 없는
사양은 출시 전환 기간에 npm을 통해 설치됩니다. 번들 Plugin과 일치하는 원시 `@openclaw/*`
사양도 npm 대체 처리 전에 번들 사본으로 확인됩니다. 번들 사본 대신
외부 npm 패키지를 의도적으로 설치하려면 `npm:@openclaw/<plugin>@<version>`을 사용하십시오.
결정적인 소스 선택에는 `clawhub:`, `npm:`,
`git:` 또는 `npm-pack:`을 사용하십시오. 전체 명령 계약은
[`openclaw plugins`](/ko/cli/plugins#install)을 참조하십시오.

npm 설치의 경우 고정되지 않은 사양과 `@latest`은 이 OpenClaw 빌드와의
호환성을 명시하는 최신 안정 패키지를 선택합니다. npm의 현재 최신 릴리스가
이 빌드에서 지원하는 것보다 새로운 `openclaw.compat.pluginApi` 또는
`openclaw.install.minHostVersion`을 선언하면 OpenClaw는 이전 안정 버전을
검색하고 호환되는 최신 버전을 설치합니다. 정확한 버전과
`@beta` 같은 명시적 채널 태그는 선택한 패키지에 고정된 상태로 유지되며
호환되지 않으면 실패합니다.

### 운영자 설치 정책

Plugin 설치 또는 업데이트를 진행하기 전에 신뢰할 수 있는 로컬 정책 명령을
실행하도록 `security.installPolicy`을 구성하십시오. 정책은 메타데이터와
스테이징된 소스 경로를 받아 설치를 허용하거나 차단할 수 있습니다. 이는 CLI와
Gateway 기반 설치/업데이트 경로를 모두 포함합니다. Plugin `before_install` 훅은
나중에 실행되며 Plugin 훅이 로드된 OpenClaw 프로세스에서만 실행되므로,
운영자가 소유한 설치 결정에는 대신 `security.installPolicy`을 사용하십시오.
사용 중단된 `--dangerously-force-unsafe-install` 플래그는
호환성을 위해 허용되지만 아무 동작도 하지 않습니다. 즉, 설치 정책이나 OpenClaw의
내장 Plugin 종속성 거부 목록을 우회하지 않습니다.

Skills와 Plugins에서 모두 사용하는 공유 `security.installPolicy` 실행 스키마는
[Skills 구성](/ko/tools/skills-config#operator-install-policy-securityinstallpolicy)을
참조하십시오.

### Plugin 정책 구성

일반적인 Plugin 구성 형태는 다음과 같습니다.

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

- `plugins.enabled: false`은 모든 Plugin을 비활성화하고 검색/로드
  작업을 건너뜁니다. 이 설정이 활성화된 동안 오래된 Plugin 참조는 비활성 상태로 유지됩니다.
  오래된 ID를 제거하려면 doctor 정리를 실행하기 전에 Plugin을 다시 활성화하십시오.
- `plugins.deny`은 허용 목록과 Plugin별 활성화보다 우선합니다.
- `plugins.allow`은 배타적 허용 목록입니다. `tools.allow`에 `"*"`이
  포함되어 있어도 허용 목록에 없는 Plugin 소유 도구는 사용할 수 없습니다.
- `plugins.entries.<id>.enabled: false`은 구성을 유지하면서 하나의 Plugin을 비활성화합니다.
- `plugins.load.paths`은 명시적인 로컬 Plugin 파일 또는 디렉터리를 추가합니다.
  관리형 `plugins install` 로컬 경로는 Plugin 디렉터리 또는
  아카이브여야 합니다. 독립형 Plugin 파일에는 `plugins.load.paths`을 사용하십시오.
- 워크스페이스에서 가져온 Plugin은 기본적으로 비활성화됩니다. 로컬 워크스페이스 코드를
  사용하기 전에 명시적으로 활성화하거나 허용 목록에 추가하십시오.
- 번들 Plugin은 구성에서 명시적으로 재정의하지 않는 한 내장된 기본 활성화/기본 비활성화
  메타데이터를 따릅니다.
- `plugins.slots.<slot>`(`memory` 또는 `contextEngine`)은 배타적 범주에서 하나의 Plugin을
  선택합니다. 슬롯 선택은 명시적 활성화로 간주되며, 달리 선택적 활성화 대상이더라도
  선택된 Plugin을 해당 슬롯에 강제로 활성화합니다. `plugins.deny` 및
  `plugins.entries.<id>.enabled: false`은 여전히 이를 차단합니다.
- 번들 선택적 활성화 Plugin은 제공자/모델 참조, 채널 구성, CLI 백엔드
  또는 에이전트 하네스 런타임 등 자신이 소유한 표면 중 하나가 구성에 지정되면 자동으로
  활성화될 수 있습니다.
- OpenAI 계열 Codex 라우팅은 제공자와 런타임 Plugin 경계를
  분리된 상태로 유지합니다. 레거시 Codex 모델 참조는 doctor가 복구하는 레거시 구성이며,
  번들 `codex` Plugin은 정규 `openai/*` 에이전트 참조, 명시적 `agentRuntime.id: "codex"` 및
  레거시 `codex/*` 참조를 위한 Codex 앱 서버 런타임을 소유합니다.

`plugins.allow`이 설정되지 않고 워크스페이스 또는 전역 Plugin 루트에서
번들되지 않은 Plugin이 자동 검색되면 시작 로그에 검색된 Plugin ID와,
목록이 짧은 경우 최소 `plugins.allow` 스니펫과 함께
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`이 기록됩니다. 신뢰할 수 있는 Plugin을 `openclaw.json`에
복사하기 전에 목록에 있는 Plugin ID에 대해 [`openclaw plugins list --enabled --verbose`](/ko/cli/plugins#list)
또는 [`openclaw plugins inspect <id>`](/ko/cli/plugins#inspect)을 실행하십시오. 진단에서 Plugin이
`without install/load-path provenance`을 로드했다고 표시하는 경우에도 동일한 신뢰 고정이 적용됩니다.
해당 Plugin ID를 검사한 다음 `plugins.allow`에 고정하거나 신뢰할 수 있는 소스에서
다시 설치하여 OpenClaw가 설치 출처를 기록하도록 하십시오.

구성 검증에서 오래된 Plugin ID, 허용 목록/도구 불일치 또는 레거시 번들 Plugin
경로를 보고하면 `openclaw doctor` 또는 `openclaw doctor --fix`을 실행하십시오.

## Plugin 형식 이해

OpenClaw는 두 가지 Plugin 형식을 인식합니다.

| 형식                   | 로드 방식                                                                    | 사용 시점                                                              |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 네이티브 OpenClaw Plugin | `openclaw.plugin.json`과 프로세스 내에 로드되는 런타임 모듈                     | OpenClaw 전용 런타임 기능을 설치하거나 빌드하는 경우                    |
| 호환 번들              | OpenClaw Plugin 인벤토리에 매핑된 Codex, Claude 또는 Cursor Plugin 레이아웃   | 호환되는 Skills, 명령, 훅 또는 번들 메타데이터를 재사용하는 경우        |

두 형식 모두 `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` 및 `openclaw plugins disable`에 표시됩니다. 번들 호환성 경계는
[Plugin 번들](/ko/plugins/bundles)을 참조하고, 네이티브 Plugin 작성 방법은
[Plugin 빌드](/ko/plugins/building-plugins)를 참조하십시오.

## Plugin 훅

Plugins는 두 가지 API를 통해 런타임에 훅을 등록할 수 있습니다.

- `api.on(...)` 런타임 수명 주기 이벤트용 형식화된 훅입니다. 미들웨어,
  정책, 메시지 재작성, 프롬프트 구성 및 도구 제어에 권장되는 표면입니다.
- `api.registerHook(...)`은 [훅](/ko/automation/hooks)에 설명된
  내부 훅 시스템용입니다. 주로 광범위한 명령/수명 주기 부수 효과와 기존
  HOOK 스타일 자동화와의 호환성을 위한 것입니다.

간단한 규칙: 핸들러에 우선순위, 병합 의미 체계 또는
차단/취소 동작이 필요하면 형식화된 훅을 사용하십시오. `command:new`,
`command:reset`, `message:sent` 또는 이와 유사한 광범위한 이벤트에 단순히 반응한다면
`api.registerHook`으로 충분합니다.

Plugin에서 관리하는 내부 훅은 `openclaw hooks list`에
`plugin:<id>`과 함께 표시됩니다. `openclaw hooks`을 통해서는 활성화하거나
비활성화할 수 없습니다. 대신 Plugin을 활성화하거나 비활성화하십시오.

## 활성 Gateway 확인

`openclaw plugins list` 및 일반 `openclaw plugins inspect`은 콜드 구성,
매니페스트 및 레지스트리 상태를 읽습니다. 이미 실행 중인
Gateway가 동일한 Plugin 코드를 가져왔음을 증명하지는 않습니다.

Plugin이 설치된 것으로 표시되지만 실시간 채팅 트래픽에서 사용되지 않는 경우:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

관리형 Gateway는 Plugin 소스를 변경하는 Plugin 설치, 업데이트 및
제거 변경 후 자동으로 다시 시작됩니다. VPS 또는 컨테이너 설치에서는
수동 재시작이 래퍼나 감독자만이 아니라 채널을 제공하는 실제
`openclaw gateway run` 자식 프로세스를 대상으로 하는지 확인하십시오.

## 문제 해결

| 증상                                                        | 확인                                                                                                                                      | 해결 방법                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin이 `plugins list`에 표시되지만 런타임 훅이 실행되지 않음  | `openclaw plugins inspect <id> --runtime --json`을 사용하고 `gateway status --deep --require-rpc`으로 활성 Gateway를 확인하십시오             | 설치, 업데이트, 구성 또는 소스 변경 후 실시간 Gateway를 다시 시작하십시오                               |
| 중복 채널 또는 도구 소유권 진단이 표시됨         | `openclaw plugins list --enabled --verbose`을 실행하고 `--runtime --json`으로 의심되는 각 Plugin을 검사한 후 채널/도구 소유권을 비교하십시오 | 소유자 하나를 비활성화하거나, 오래된 설치를 제거하거나, 의도적인 대체에는 매니페스트 `preferOver`을 사용하십시오      |
| 구성에서 Plugin이 누락되었다고 표시됨                                | [Plugin 인벤토리](/ko/plugins/plugin-inventory)에서 번들형, 공식 외부 또는 소스 전용인지 확인하십시오                           | 외부 패키지를 설치하거나, 번들 Plugin을 활성화하거나, 오래된 구성을 제거하십시오                         |
| 설치 중 구성이 유효하지 않음                               | 검증 메시지를 읽고 오래된 Plugin 상태를 가리키는 경우 `openclaw doctor --fix`을 실행하십시오                                             | Doctor는 항목을 비활성화하고 유효하지 않은 페이로드를 제거하여 유효하지 않은 Plugin 구성을 격리할 수 있습니다     |
| 의심스러운 소유권 또는 권한으로 인해 Plugin 경로가 차단됨 | 구성 오류 앞에 표시된 진단을 검사하십시오                                                                                             | 파일 시스템 소유권/권한을 수정한 후 `openclaw plugins registry --refresh`을 실행하십시오                    |
| `OPENCLAW_NIX_MODE=1`이 수명 주기 명령을 차단함                | 설치가 Nix에서 관리되는지 확인하십시오                                                                                                      | Plugin 변경 명령을 사용하는 대신 Nix 소스에서 Plugin 선택을 변경하십시오                      |
| 런타임에 종속성 가져오기가 실패함                             | Plugin이 npm/git/ClawHub를 통해 설치되었는지 또는 로컬 경로에서 로드되었는지 확인하십시오                                                 | `openclaw plugins update <id>`을 실행하거나, 소스를 다시 설치하거나, 로컬 Plugin 종속성을 직접 설치하십시오 |

오래된 Plugin 구성에 더 이상 검색할 수 없는 채널 Plugin이 여전히 지정되어 있으면
구성 검증은 해당 채널 키를 심각한 오류 대신 경고로 낮추므로
Gateway 시작 시 다른 모든 채널을 계속 제공할 수 있습니다. 오래된
Plugin 및 채널 항목을 제거하려면 `openclaw doctor --fix`을 실행하십시오. 오래된 Plugin이라는
증거가 없는 알 수 없는 채널 키는 오타가 드러나도록 여전히 검증에
실패합니다.

의도적인 채널 대체의 경우 기본 설정 Plugin은 레거시 또는 우선순위가 더 낮은
Plugin ID와 함께 `channelConfigs.<channel-id>.preferOver`을 선언해야 합니다.
두 Plugin이 모두 명시적으로 활성화된 경우 OpenClaw는 해당 요청을 유지하고
소유자 하나를 자동으로 선택하는 대신 중복 채널/도구 진단을 보고합니다.

설치된 패키지가 `requires compiled runtime output for
TypeScript entry ...`이라고 보고하면 해당 패키지는 런타임에
OpenClaw가 필요로 하는 JavaScript 파일 없이 게시된 것입니다. 게시자가 컴파일된
JavaScript를 배포한 후 업데이트하거나 다시 설치하고, 그때까지는 Plugin을
비활성화하거나 제거하십시오.

### 차단된 Plugin 경로 소유권

진단에
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
이라고 표시되고 이어서 검증에 `plugin present but blocked`이 표시되면 OpenClaw가
Plugin 파일을 로드하는 프로세스와 다른 Unix 사용자가 소유한 Plugin 파일을
찾은 것입니다. Plugin 구성은 그대로 유지하고 파일 시스템 소유권을 수정하거나
상태 디렉터리를 소유한 동일한 사용자로 OpenClaw를 실행하십시오.

Docker 설치의 경우 공식 이미지는 `node`(uid `1000`)으로 실행되므로
호스트에 바인드 마운트된 OpenClaw 구성 및 작업 공간 디렉터리는 일반적으로
uid `1000`이 소유해야 합니다.

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw를 의도적으로 root로 실행하는 경우 관리형 Plugin 루트의
소유권을 대신 root로 복구하십시오.

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

소유권을 수정한 후 영구 저장된 Plugin 레지스트리가 복구된 파일과
일치하도록 `openclaw doctor --fix` 또는
`openclaw plugins registry --refresh`을 다시 실행하십시오.

### 느린 Plugin 도구 설정

도구를 준비하는 동안 에이전트 턴이 멈춘 것처럼 보이면 추적 로깅을
활성화하고 Plugin 도구 팩터리 타이밍 줄을 확인하십시오.

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

다음을 찾으십시오.

```text
[trace:plugin-tools] 팩터리 타이밍 ...
```

요약에는 총 팩터리 시간과 가장 느린 Plugin 도구 팩터리가 나열되며,
여기에는 Plugin ID, 선언된 도구 이름, 결과 형태 및 도구가 선택 사항인지 여부가
포함됩니다. 단일 팩터리에 최소 1s가 걸리거나 전체 Plugin 도구 팩터리 준비에
최소 5s가 걸리면 느린 줄이 경고로 승격됩니다.

OpenClaw는 동일한 유효 요청 컨텍스트로 반복적으로 해석할 때 성공한
Plugin 도구 팩터리 결과를 캐시합니다. 캐시 키에는 유효 런타임 구성,
작업 공간 및 에이전트 ID, 샌드박스 정책, 브라우저 설정, 전달 컨텍스트,
요청자 ID 및 소유권 상태가 포함되므로 해당 신뢰할 수 있는 필드에 의존하는
팩터리는 컨텍스트가 변경될 때 다시 실행됩니다. 타이밍이 계속 높게 유지되면
Plugin이 도구 정의를 반환하기 전에 비용이 많이 드는 작업을 수행하고 있을 수 있습니다.

한 Plugin이 타이밍의 대부분을 차지하면 해당 런타임 등록을 검사하십시오.

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

그런 다음 해당 Plugin을 업데이트, 재설치 또는 비활성화하십시오. Plugin 작성자는
비용이 많이 드는 종속성 로드를 도구 팩터리 내부에서 수행하지 말고 도구 실행
경로 뒤로 이동해야 합니다.

종속성 루트, 패키지 메타데이터 검증, 레지스트리 레코드, 시작 시
다시 로드 동작 및 레거시 정리에 대해서는
[Plugin 종속성 해석](/ko/plugins/dependency-resolution)을 참조하십시오.

## 관련 항목

- [Plugin 관리](/ko/plugins/manage-plugins) - 목록 조회, 설치, 업데이트, 제거 및 게시 명령 예시
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [Plugin 인벤토리](/ko/plugins/plugin-inventory) - 생성된 번들 및 외부 Plugin 목록
- [Plugin 참조](/ko/plugins/reference) - 생성된 Plugin별 참조 페이지
- [커뮤니티 Plugin](/ko/plugins/community) - ClawHub 검색 및 문서 PR 정책
- [Plugin 종속성 해석](/ko/plugins/dependency-resolution) - 설치 루트, 레지스트리 레코드 및 런타임 경계
- [Plugin 빌드](/ko/plugins/building-plugins) - 네이티브 Plugin 작성 가이드
- [Plugin SDK 개요](/ko/plugins/sdk-overview) - 런타임 등록, 훅 및 API 필드
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 및 패키지 메타데이터
