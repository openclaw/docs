---
doc-schema-version: 1
read_when:
    - Plugin 설치 또는 구성
    - Plugin 검색 및 로드 규칙 이해하기
    - Codex/Claude 호환 Plugin 번들 사용하기
sidebarTitle: Getting Started
summary: OpenClaw Plugin 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-07-12T01:16:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugin은 채널, 모델 제공자, 에이전트 하네스, 도구, Skills, 음성, 실시간 전사, 음성 기능, 미디어 이해, 생성, 웹 가져오기, 웹 검색 및 기타 런타임 기능으로 OpenClaw를 확장합니다.

이 페이지를 사용하여 Plugin을 설치하고, Gateway를 재시작하고, 런타임이 Plugin을 로드했는지 확인하고, 일반적인 설정 실패를 해결하세요. 명령어 예시만 보려면 [Plugin 관리](/ko/plugins/manage-plugins)를 참조하세요. 번들, 공식 외부 및 소스 전용 Plugin의 생성된 목록은 [Plugin 목록](/ko/plugins/plugin-inventory)을 참조하세요.

## 요구 사항

- `openclaw` CLI를 사용할 수 있는 OpenClaw 체크아웃 또는 설치
- 선택한 소스(ClawHub, npm 또는 git 호스트)에 대한 네트워크 접근
- 해당 Plugin의 설정 문서에 명시된 Plugin별 자격 증명, 구성 키 또는 OS 도구
- 채널을 제공하는 Gateway를 다시 로드하거나 재시작할 권한

## 빠른 시작

<Steps>
  <Step title="Plugin 찾기">
    공개 Plugin 패키지를 [ClawHub](/clawhub)에서 검색하세요.

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub는 커뮤니티 Plugin을 찾기 위한 기본 경로입니다. 출시 전환 기간에는 일반적인 접두사 없는 패키지 사양이 공식 Plugin ID와 일치하지 않는 한 계속 npm에서 설치됩니다. 번들 Plugin과 일치하는 원시 `@openclaw/*` 사양은 해당 번들 사본으로 해석됩니다. 특정 소스만 사용해야 할 때는 명시적인 소스 접두사를 사용하세요.

  </Step>

  <Step title="Plugin 설치">
    ```bash
    # ClawHub에서 설치.
    openclaw plugins install clawhub:<package>

    # npm에서 설치.
    openclaw plugins install npm:<package>

    # git에서 설치.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 로컬 개발 체크아웃에서 설치.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin 설치는 코드를 실행하는 것과 동일하게 취급하세요. 재현 가능한 프로덕션 설치를 위해 고정된 버전을 사용하는 것이 좋습니다.

  </Step>

  <Step title="구성하고 활성화하기">
    `plugins.entries.<id>.config` 아래에서 Plugin별 설정을 구성하세요. Plugin이 아직 활성화되지 않았다면 활성화하세요.

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow`가 설정되어 있으면 Plugin을 로드하기 전에 설치된 Plugin ID가 해당 목록에 포함되어 있어야 합니다. `openclaw plugins install`은 설치된 ID를 기존 `plugins.allow` 목록에 추가하고 동일한 ID를 `plugins.deny`에서 제거하므로, 명시적으로 설치한 Plugin을 재시작 후 로드할 수 있습니다.

  </Step>

  <Step title="Gateway 다시 로드하기">
    Plugin 코드를 설치, 업데이트 또는 제거하려면 Gateway를 재시작해야 합니다. 구성 다시 로드가 활성화된 관리형 Gateway는 변경된 Plugin 설치 레코드를 감지하여 자동으로 재시작합니다. 그렇지 않으면 직접 재시작하세요.

    ```bash
    openclaw gateway restart
    ```

    활성화/비활성화는 구성과 콜드 레지스트리를 업데이트합니다. 실제 런타임 표면을 입증하는 가장 명확한 방법은 여전히 런타임 검사입니다.

  </Step>

  <Step title="런타임 등록 확인">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    등록된 도구, 훅, 서비스, Gateway 메서드 또는 Plugin 소유 CLI 명령을 확인하려면 `--runtime`을 사용하세요. 일반 `inspect`는 콜드 매니페스트와 레지스트리만 확인합니다.

  </Step>
</Steps>

## 구성

### 설치 소스 선택

| 소스        | 사용 시점                                                                      | 예시                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw 네이티브 검색, 검사, 버전 메타데이터 및 설치 안내가 필요한 경우       | `openclaw plugins install clawhub:<package>`                   |
| npm         | npm 레지스트리 또는 dist-tag 워크플로를 직접 사용해야 하는 경우                 | `openclaw plugins install npm:<package>`                       |
| git         | 저장소의 브랜치, 태그 또는 커밋이 필요한 경우                                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 로컬 경로   | 동일한 컴퓨터에서 Plugin을 개발하거나 테스트하는 경우                           | `openclaw plugins install --link ./my-plugin`                  |
| 마켓플레이스 | Claude 호환 마켓플레이스 Plugin을 설치하는 경우                                 | `openclaw plugins install <plugin> --marketplace <source>`     |

접두사 없는 패키지 사양에는 특별한 호환성 동작이 적용됩니다. 번들 Plugin ID와 일치하는 접두사 없는 이름은 해당 번들 소스를 사용하고, 공식 외부 Plugin ID와 일치하는 이름은 공식 패키지 카탈로그를 사용하며, 그 외의 접두사 없는 사양은 출시 전환 기간에 npm을 통해 설치됩니다. 번들 Plugin과 일치하는 원시 `@openclaw/*` 사양도 npm 대체 경로보다 먼저 번들 사본으로 해석됩니다. 번들 사본 대신 외부 npm 패키지를 의도적으로 설치하려면 `npm:@openclaw/<plugin>@<version>`을 사용하세요. 소스를 결정적으로 선택하려면 `clawhub:`, `npm:`, `git:` 또는 `npm-pack:`을 사용하세요. 전체 명령 계약은 [`openclaw plugins`](/ko/cli/plugins#install)를 참조하세요.

npm 설치에서 버전이 고정되지 않은 사양과 `@latest`는 이 OpenClaw 빌드와의 호환성을 명시한 최신 안정 패키지를 선택합니다. npm의 현재 최신 릴리스가 이 빌드에서 지원하는 것보다 새로운 `openclaw.compat.pluginApi` 또는 `openclaw.install.minHostVersion`을 선언하면 OpenClaw는 이전 안정 버전을 검색하여 호환되는 최신 버전을 설치합니다. 정확한 버전과 `@beta` 같은 명시적인 채널 태그는 선택한 패키지에 고정되며, 호환되지 않으면 실패합니다.

### 운영자 설치 정책

Plugin 설치 또는 업데이트를 진행하기 전에 신뢰할 수 있는 로컬 정책 명령을 실행하도록 `security.installPolicy`를 구성하세요. 정책은 메타데이터와 스테이징된 소스 경로를 받아 설치를 허용하거나 차단할 수 있습니다. 이 정책은 CLI와 Gateway 기반 설치/업데이트 경로 모두에 적용됩니다. Plugin `before_install` 훅은 이후에 실행되며 Plugin 훅이 로드된 OpenClaw 프로세스에서만 실행되므로, 운영자 소유의 설치 결정에는 대신 `security.installPolicy`를 사용하세요. 사용 중단된 `--dangerously-force-unsafe-install` 플래그는 호환성을 위해 허용되지만 아무 작업도 수행하지 않습니다. 즉, 설치 정책이나 OpenClaw에 내장된 Plugin 의존성 거부 목록을 우회하지 않습니다.

Skills와 Plugin이 함께 사용하는 공통 `security.installPolicy` 실행 스키마는 [Skills 구성](/ko/tools/skills-config#operator-install-policy-securityinstallpolicy)을 참조하세요.

### Plugin 정책 구성

공통 Plugin 구성 형식은 다음과 같습니다.

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

- `plugins.enabled: false`는 모든 Plugin을 비활성화하고 검색/로드 작업을 건너뜁니다. 이 설정이 활성화된 동안 오래된 Plugin 참조는 비활성 상태로 유지됩니다. 오래된 ID를 제거하려고 doctor 정리를 실행하기 전에 Plugin을 다시 활성화하세요.
- `plugins.deny`는 허용 목록과 Plugin별 활성화 설정보다 우선합니다.
- `plugins.allow`는 배타적 허용 목록입니다. `tools.allow`에 `"*"`가 포함되어 있어도 허용 목록에 없는 Plugin 소유 도구는 사용할 수 없습니다.
- `plugins.entries.<id>.enabled: false`는 구성을 유지하면서 하나의 Plugin을 비활성화합니다.
- `plugins.load.paths`는 명시적인 로컬 Plugin 파일 또는 디렉터리를 추가합니다. 관리형 `plugins install`의 로컬 경로는 Plugin 디렉터리 또는 아카이브여야 합니다. 독립 실행형 Plugin 파일에는 `plugins.load.paths`를 사용하세요.
- 워크스페이스에서 유래한 Plugin은 기본적으로 비활성화됩니다. 로컬 워크스페이스 코드를 사용하기 전에 명시적으로 활성화하거나 허용 목록에 추가하세요.
- 번들 Plugin은 구성에서 명시적으로 재정의하지 않는 한 내장된 기본 활성화/비활성화 메타데이터를 따릅니다.
- `plugins.slots.<slot>`(`memory` 또는 `contextEngine`)은 배타적 범주에 사용할 하나의 Plugin을 선택합니다. 슬롯 선택은 명시적인 활성화로 간주되며, 원래 선택적 활성화 대상이더라도 해당 슬롯에 선택된 Plugin을 강제로 활성화합니다. `plugins.deny`와 `plugins.entries.<id>.enabled: false`는 여전히 해당 Plugin을 차단합니다.
- 번들 선택적 Plugin은 제공자/모델 참조, 채널 구성, CLI 백엔드 또는 에이전트 하네스 런타임처럼 해당 Plugin이 소유한 표면 중 하나가 구성에 지정되면 자동으로 활성화될 수 있습니다.
- OpenAI 계열 Codex 라우팅은 제공자와 런타임 Plugin 경계를 분리하여 유지합니다. 레거시 Codex 모델 참조는 doctor가 수정하는 레거시 구성이며, 번들 `codex` Plugin은 표준 `openai/*` 에이전트 참조, 명시적인 `agentRuntime.id: "codex"` 및 레거시 `codex/*` 참조를 위한 Codex 앱 서버 런타임을 소유합니다.

`plugins.allow`가 설정되지 않은 상태에서 워크스페이스 또는 전역 Plugin 루트에서 번들되지 않은 Plugin이 자동으로 검색되면, 시작 로그에 검색된 Plugin ID와 함께 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`가 기록되며, 목록이 짧으면 최소한의 `plugins.allow` 스니펫도 표시됩니다. 신뢰할 수 있는 Plugin을 `openclaw.json`에 복사하기 전에, 나열된 Plugin ID에 대해 [`openclaw plugins list --enabled --verbose`](/ko/cli/plugins#list) 또는 [`openclaw plugins inspect <id>`](/ko/cli/plugins#inspect)를 실행하세요. 진단에서 Plugin이 `without install/load-path provenance` 상태로 로드되었다고 표시될 때도 동일한 신뢰 고정 방식이 적용됩니다. 해당 Plugin ID를 검사한 다음 `plugins.allow`에 고정하거나 신뢰할 수 있는 소스에서 다시 설치하여 OpenClaw가 설치 출처를 기록하도록 하세요.

구성 검증에서 오래된 Plugin ID, 허용 목록/도구 불일치 또는 레거시 번들 Plugin 경로를 보고하면 `openclaw doctor` 또는 `openclaw doctor --fix`를 실행하세요.

## Plugin 형식 이해

OpenClaw는 두 가지 Plugin 형식을 인식합니다.

| 형식                   | 로드 방식                                                                    | 사용 시점                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 네이티브 OpenClaw Plugin | `openclaw.plugin.json`과 프로세스 내에서 로드되는 런타임 모듈                 | OpenClaw 전용 런타임 기능을 설치하거나 구축하는 경우                    |
| 호환 번들              | OpenClaw Plugin 목록에 매핑되는 Codex, Claude 또는 Cursor Plugin 레이아웃     | 호환되는 Skills, 명령, 훅 또는 번들 메타데이터를 재사용하는 경우        |

두 형식 모두 `openclaw plugins list`, `openclaw plugins inspect`, `openclaw plugins enable` 및 `openclaw plugins disable`에 표시됩니다. 번들 호환성 경계는 [Plugin 번들](/ko/plugins/bundles)을, 네이티브 Plugin 작성 방법은 [Plugin 구축](/ko/plugins/building-plugins)을 참조하세요.

## Plugin 훅

Plugin은 서로 다른 두 API를 통해 런타임에 훅을 등록할 수 있습니다.

- 런타임 수명 주기 이벤트를 위한 `api.on(...)` 형식화 훅. 미들웨어, 정책, 메시지 재작성, 프롬프트 구성 및 도구 제어에 권장되는 표면입니다.
- [훅](/ko/automation/hooks)에 설명된 내부 훅 시스템을 위한 `api.registerHook(...)`. 주로 거친 명령/수명 주기 부수 효과와 기존 HOOK 방식 자동화의 호환성을 위해 사용됩니다.

간단한 기준은 다음과 같습니다. 핸들러에 우선순위, 병합 의미 체계 또는 차단/취소 동작이 필요하면 형식화 훅을 사용하세요. `command:new`, `command:reset`, `message:sent` 또는 이와 유사한 거친 이벤트에 단순히 반응하기만 한다면 `api.registerHook`을 사용해도 됩니다.

Plugin이 관리하는 내부 훅은 `openclaw hooks list`에 `plugin:<id>`로 표시됩니다. `openclaw hooks`를 통해 활성화하거나 비활성화할 수 없으며, 대신 Plugin을 활성화하거나 비활성화해야 합니다.

## 활성 Gateway 확인

`openclaw plugins list`와 일반 `openclaw plugins inspect`는 콜드 구성, 매니페스트 및 레지스트리 상태를 읽습니다. 이미 실행 중인 Gateway가 동일한 Plugin 코드를 가져왔다는 사실은 입증하지 않습니다.

Plugin이 설치된 것으로 표시되지만 실제 채팅 트래픽에서 사용되지 않는 경우 다음을 실행하세요.

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

관리형 Gateway는 Plugin 소스를 변경하는 Plugin 설치, 업데이트 및 제거 후 자동으로 다시 시작됩니다. VPS 또는 컨테이너 설치에서는 수동으로 다시 시작할 때 래퍼나 감독자만이 아니라 채널을 제공하는 실제 `openclaw gateway run` 자식 프로세스를 대상으로 해야 합니다.

## 문제 해결

| 증상 | 확인 사항 | 해결 방법 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin이 `plugins list`에 표시되지만 런타임 훅이 실행되지 않음 | `openclaw plugins inspect <id> --runtime --json`을 사용하고 `gateway status --deep --require-rpc`로 활성 Gateway를 확인합니다 | 설치, 업데이트, 구성 또는 소스 변경 후 실제 운영 중인 Gateway를 다시 시작합니다 |
| 채널 또는 도구 소유권 중복 진단이 표시됨 | `openclaw plugins list --enabled --verbose`를 실행하고 의심되는 각 Plugin을 `--runtime --json`으로 검사한 다음 채널/도구 소유권을 비교합니다 | 소유자 하나를 비활성화하거나, 오래된 설치를 제거하거나, 의도적으로 대체하려면 매니페스트의 `preferOver`를 사용합니다 |
| 구성에서 Plugin이 누락되었다고 표시됨 | [Plugin 인벤토리](/ko/plugins/plugin-inventory)에서 해당 Plugin이 번들형인지, 공식 외부형인지, 소스 전용인지 확인합니다 | 외부 패키지를 설치하거나, 번들 Plugin을 활성화하거나, 오래된 구성을 제거합니다 |
| 설치 중 구성이 유효하지 않음 | 검증 메시지를 읽고 오래된 Plugin 상태를 가리키는 경우 `openclaw doctor --fix`를 실행합니다 | Doctor는 항목을 비활성화하고 유효하지 않은 페이로드를 제거하여 유효하지 않은 Plugin 구성을 격리할 수 있습니다 |
| 의심스러운 소유권 또는 권한으로 인해 Plugin 경로가 차단됨 | 구성 오류보다 앞에 표시된 진단을 확인합니다 | 파일 시스템 소유권/권한을 수정한 다음 `openclaw plugins registry --refresh`를 실행합니다 |
| `OPENCLAW_NIX_MODE=1`이 수명 주기 명령을 차단함 | 설치가 Nix에서 관리되는지 확인합니다 | Plugin 변경 명령을 사용하는 대신 Nix 소스에서 Plugin 선택을 변경합니다 |
| 런타임에서 의존성 가져오기에 실패함 | Plugin이 npm/git/ClawHub를 통해 설치되었는지 또는 로컬 경로에서 로드되었는지 확인합니다 | `openclaw plugins update <id>`를 실행하거나, 소스를 다시 설치하거나, 로컬 Plugin 의존성을 직접 설치합니다 |

오래된 Plugin 구성에 더 이상 검색할 수 없는 채널 Plugin이 여전히 지정되어 있으면, 구성 검증은 해당 채널 키를 심각한 실패가 아닌 경고로 낮춰 Gateway 시작 시 다른 모든 채널을 계속 제공할 수 있게 합니다. `openclaw doctor --fix`를 실행하여 오래된 Plugin 및 채널 항목을 제거합니다. 오래된 Plugin이라는 근거가 없는 알 수 없는 채널 키는 계속 검증에 실패하므로 오타가 드러납니다.

의도적으로 채널을 대체하려면 우선 적용할 Plugin이 레거시 또는 우선순위가 더 낮은 Plugin ID를 지정한 `channelConfigs.<channel-id>.preferOver`를 선언해야 합니다. 두 Plugin이 모두 명시적으로 활성화된 경우 OpenClaw는 해당 요청을 유지하고 소유자 하나를 암묵적으로 선택하는 대신 채널/도구 중복 진단을 보고합니다.

설치된 패키지에서 `requires compiled runtime output for TypeScript entry ...`가 보고되면 OpenClaw가 런타임에 필요로 하는 JavaScript 파일 없이 패키지가 게시된 것입니다. 게시자가 컴파일된 JavaScript를 제공한 후 업데이트하거나 다시 설치하고, 그때까지는 Plugin을 비활성화하거나 제거합니다.

### 차단된 Plugin 경로 소유권

진단에
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
가 표시되고 이어지는 검증에서 `plugin present but blocked`가 표시되면, OpenClaw는 Plugin 파일의 소유 Unix 사용자가 해당 파일을 로드하는 프로세스의 사용자와 다르다는 것을 감지한 것입니다. Plugin 구성은 그대로 유지하고 파일 시스템 소유권을 수정하거나 상태 디렉터리를 소유한 동일한 사용자로 OpenClaw를 실행합니다.

Docker 설치에서는 공식 이미지가 `node`(uid `1000`)로 실행되므로 호스트에서 바인드 마운트한 OpenClaw 구성 및 작업 공간 디렉터리는 일반적으로 uid `1000`의 소유여야 합니다.

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

의도적으로 OpenClaw를 root로 실행하는 경우에는 관리형 Plugin 루트의 소유권을 대신 root로 복구합니다.

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

소유권을 수정한 후 `openclaw doctor --fix` 또는 `openclaw plugins registry --refresh`를 다시 실행하여 영구 저장된 Plugin 레지스트리가 복구된 파일과 일치하도록 합니다.

### 느린 Plugin 도구 설정

도구를 준비하는 동안 에이전트 턴이 멈춘 것처럼 보이면 추적 로깅을 활성화하고 Plugin 도구 팩터리 타이밍 줄을 확인합니다.

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

다음을 찾습니다.

```text
[trace:plugin-tools] factory timings ...
```

요약에는 전체 팩터리 시간과 가장 느린 Plugin 도구 팩터리가 표시되며, 여기에는 Plugin ID, 선언된 도구 이름, 결과 형태 및 도구의 선택 사항 여부가 포함됩니다. 단일 팩터리가 1초 이상 걸리거나 전체 Plugin 도구 팩터리 준비가 5초 이상 걸리면 느린 항목이 경고로 승격됩니다.

OpenClaw는 동일한 유효 요청 컨텍스트에서 반복적으로 해석할 때 성공한 Plugin 도구 팩터리 결과를 캐시합니다. 캐시 키에는 유효 런타임 구성, 작업 공간 및 에이전트 ID, 샌드박스 정책, 브라우저 설정, 전달 컨텍스트, 요청자 ID 및 소유권 상태가 포함되므로, 신뢰할 수 있는 이러한 필드에 의존하는 팩터리는 컨텍스트가 변경될 때 다시 실행됩니다. 타이밍이 계속 높게 유지된다면 Plugin이 도구 정의를 반환하기 전에 비용이 많이 드는 작업을 수행하고 있을 수 있습니다.

한 Plugin이 타이밍의 대부분을 차지한다면 해당 런타임 등록을 검사합니다.

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

그런 다음 해당 Plugin을 업데이트하거나, 다시 설치하거나, 비활성화합니다. Plugin 작성자는 비용이 많이 드는 의존성 로딩을 도구 팩터리 내부에서 수행하지 말고 도구 실행 경로 뒤로 옮겨야 합니다.

의존성 루트, 패키지 메타데이터 검증, 레지스트리 레코드, 시작 시 다시 로드하는 동작 및 레거시 정리에 대해서는 [Plugin 의존성 해석](/ko/plugins/dependency-resolution)을 참조하세요.

## 관련 문서

- [Plugin 관리](/ko/plugins/manage-plugins) - 목록 조회, 설치, 업데이트, 제거 및 게시 명령 예시
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [Plugin 인벤토리](/ko/plugins/plugin-inventory) - 생성된 번들 및 외부 Plugin 목록
- [Plugin 참조](/ko/plugins/reference) - 생성된 Plugin별 참조 페이지
- [커뮤니티 Plugin](/ko/plugins/community) - ClawHub 검색 및 문서 PR 정책
- [Plugin 의존성 해석](/ko/plugins/dependency-resolution) - 설치 루트, 레지스트리 레코드 및 런타임 경계
- [Plugin 빌드](/ko/plugins/building-plugins) - 네이티브 Plugin 작성 가이드
- [Plugin SDK 개요](/ko/plugins/sdk-overview) - 런타임 등록, 훅 및 API 필드
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 및 패키지 메타데이터
