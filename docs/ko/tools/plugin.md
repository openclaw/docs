---
read_when:
    - Plugin 설치 또는 구성
    - Plugin 발견 및 로드 규칙 이해
    - Codex/Claude 호환 Plugin 번들로 작업하기
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugin은 OpenClaw에 새로운 기능을 추가합니다: 채널, 모델 제공자,
에이전트 하네스, 도구, Skills, 음성, 실시간 전사, 실시간
음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹
검색 등입니다. 일부 Plugin은 **코어**(OpenClaw와 함께 제공됨)이고,
그 외는 **외부** Plugin입니다. 대부분의 외부 Plugin은
[ClawHub](/ko/tools/clawhub)를 통해 게시되고 검색됩니다. npm은 직접 설치와,
해당 마이그레이션이 완료되는 동안 OpenClaw가 소유한 임시 Plugin 패키지
집합을 위해 계속 지원됩니다.

## 빠른 시작

복사-붙여넣기 설치, 목록 보기, 제거, 업데이트, 게시 예시는
[Plugin 관리](/ko/plugins/manage-plugins)를 참고하세요.

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 구성 파일의 `plugins.entries.\<id\>.config` 아래에서 구성하세요.

  </Step>

  <Step title="Chat-native management">
    실행 중인 Gateway에서 소유자 전용 `/plugins enable` 및 `/plugins disable`은
    Gateway 구성 리로더를 트리거합니다. Gateway는 Plugin 런타임
    표면을 프로세스 내에서 다시 로드하고, 새 에이전트 턴은 새로 고친
    레지스트리에서 도구 목록을 다시 구성합니다. `/plugins install`은
    Plugin 소스 코드를 변경하므로, Gateway는 현재 프로세스가 이미
    가져온 모듈을 안전하게 다시 로드할 수 있는 것처럼 처리하지 않고
    재시작을 요청합니다.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    등록된 도구, 서비스, Gateway 메서드, 훅 또는 Plugin 소유 CLI 명령을
    증명해야 할 때는 `--runtime`을 사용하세요. 일반 `inspect`는 콜드
    manifest/레지스트리 검사이며, 의도적으로 Plugin 런타임 가져오기를
    피합니다.

  </Step>
</Steps>

채팅 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요.

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

설치 경로는 CLI와 동일한 리졸버를 사용합니다: 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 명시적 `npm:<pkg>`, 명시적 `git:<repo>`, 또는 npm을
통한 베어 패키지 명세입니다.

구성이 유효하지 않으면 설치는 일반적으로 실패로 닫히며
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`를 옵트인한 Plugin을 위한
좁은 범위의 번들 Plugin 재설치 경로입니다.
Gateway 시작 중에는 유효하지 않은 Plugin 구성이 다른 유효하지 않은
구성과 마찬가지로 실패로 닫힙니다. 잘못된 Plugin 구성을 격리하려면
`openclaw doctor --fix`를 실행하세요. 그러면 해당 Plugin 항목을
비활성화하고 유효하지 않은 구성 페이로드를 제거합니다. 일반 구성 백업은
이전 값을 보존합니다.
채널 구성이 더 이상 검색할 수 없는 Plugin을 참조하지만 동일한 오래된
Plugin id가 Plugin 구성 또는 설치 기록에 남아 있으면, Gateway 시작은
경고를 로그에 남기고 다른 모든 채널을 차단하지 않고 해당 채널을
건너뜁니다.
오래된 채널/Plugin 항목을 제거하려면 `openclaw doctor --fix`를
실행하세요. 오래된 Plugin 증거가 없는 알 수 없는 채널 키는 오타가 계속
보이도록 여전히 검증에 실패합니다.
`plugins.enabled: false`가 설정되어 있으면 오래된 Plugin 참조는 비활성
상태로 취급됩니다. Gateway 시작은 Plugin 검색/로드 작업을 건너뛰고
`openclaw doctor`는 비활성화된 Plugin 구성을 자동 제거하지 않고
보존합니다. 오래된 Plugin id를 제거하려면 doctor 정리를 실행하기 전에
Plugin을 다시 활성화하세요.

Plugin 의존성 설치는 명시적 설치/업데이트 또는 doctor 복구 흐름 중에만
발생합니다. Gateway 시작, 구성 다시 로드, 런타임 검사는 패키지 관리자를
실행하거나 의존성 트리를 복구하지 않습니다. 로컬 Plugin은 이미 의존성이
설치되어 있어야 하며, npm, git, ClawHub Plugin은 OpenClaw의 관리형
Plugin 루트 아래에 설치됩니다. npm 의존성은 OpenClaw의 관리형 npm 루트
내에서 호이스팅될 수 있습니다. 설치/업데이트는 신뢰 전에 해당 관리형
루트를 스캔하고, 제거는 npm을 통해 npm 관리 패키지를 제거합니다. 외부
Plugin과 사용자 지정 로드 경로도 여전히 `openclaw plugins install`을
통해 설치해야 합니다.
런타임 코드를 가져오거나 의존성을 복구하지 않고 표시되는 각 Plugin의 정적
`dependencyStatus`를 보려면 `openclaw plugins list --json`을 사용하세요.
설치 시점 생명주기는 [Plugin 의존성 해결](/ko/plugins/dependency-resolution)을
참고하세요.

npm 설치의 경우 `latest` 또는 dist-tag 같은 가변 선택자는 설치 전에
해결된 다음 OpenClaw의 관리형 npm 루트에서 정확히 검증된 버전으로
고정됩니다. npm이 완료된 후 OpenClaw는 설치된 `package-lock.json` 항목이
여전히 해결된 버전 및 무결성과 일치하는지 검증합니다. npm이 다른 패키지
메타데이터를 쓰면, 설치는 다른 Plugin 아티팩트를 받아들이는 대신 실패하고
관리형 패키지는 롤백됩니다.

소스 체크아웃은 pnpm 워크스페이스입니다. 번들 Plugin을 수정하기 위해
OpenClaw를 클론했다면 `pnpm install`을 실행하세요. 그러면 OpenClaw는
`extensions/<id>`에서 번들 Plugin을 로드하므로 편집 내용과 패키지 로컬
의존성이 직접 사용됩니다.
일반 npm 루트 설치는 패키지된 OpenClaw용이며, 소스 체크아웃 개발용이
아닙니다.

## Plugin 유형

OpenClaw는 두 가지 Plugin 형식을 인식합니다:

| 형식       | 작동 방식                                                          | 예시                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **네이티브** | `openclaw.plugin.json` + 런타임 모듈; 프로세스 내에서 실행          | 공식 Plugin, 커뮤니티 npm 패키지                       |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃; OpenClaw 기능에 매핑됨          | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list` 아래에 표시됩니다. Bundle 세부 정보는 [Plugin Bundles](/ko/plugins/bundles)를 참고하세요.

네이티브 Plugin을 작성 중이라면 [Plugin 빌드](/ko/plugins/building-plugins)와
[Plugin SDK 개요](/ko/plugins/sdk-overview)부터 시작하세요.

## 패키지 엔트리포인트

네이티브 Plugin npm 패키지는 `package.json`에 `openclaw.extensions`를
선언해야 합니다.
각 항목은 패키지 디렉터리 안에 머물러야 하며, 읽을 수 있는 런타임 파일로
해결되거나 `src/index.ts`에서 `dist/index.js`처럼 빌드된 JavaScript 피어가
추론되는 TypeScript 소스 파일로 해결되어야 합니다.
패키지 설치는 해당 JavaScript 런타임 출력을 함께 제공해야 합니다.
TypeScript 소스 폴백은 소스 체크아웃과 로컬 개발 경로용이며, OpenClaw의
관리형 Plugin 루트에 설치된 npm 패키지용이 아닙니다.

게시된 런타임 파일이 소스 항목과 같은 경로에 있지 않으면
`openclaw.runtimeExtensions`를 사용하세요. 존재하는 경우 `runtimeExtensions`는
모든 `extensions` 항목마다 정확히 하나의 항목을 포함해야 합니다. 목록이
일치하지 않으면 소스 경로로 조용히 폴백하는 대신 설치와 Plugin 검색이
실패합니다. `openclaw.setupEntry`도 게시한다면 빌드된 JavaScript 피어에
`openclaw.runtimeSetupEntry`를 사용하세요. 선언된 경우 해당 파일은
필수입니다.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 공식 Plugin

### 마이그레이션 중인 OpenClaw 소유 npm 패키지

ClawHub는 대부분의 Plugin을 위한 기본 배포 경로입니다. 현재 패키지된
OpenClaw 릴리스는 이미 많은 공식 Plugin을 번들로 포함하므로, 일반 설정에서는
해당 Plugin을 별도로 npm 설치할 필요가 없습니다. 모든 OpenClaw 소유
Plugin이 ClawHub로 마이그레이션될 때까지 OpenClaw는 이전/사용자 지정 설치와
직접 npm 워크플로를 위해 일부 `@openclaw/*` Plugin 패키지를 npm에 계속
제공합니다.

npm이 `@openclaw/*` Plugin 패키지를 deprecated로 보고한다면, 해당 패키지
버전은 이전 외부 패키지 트레인에서 온 것입니다. 더 최신 npm 패키지가
게시될 때까지 현재 OpenClaw의 번들 Plugin 또는 로컬 체크아웃을 사용하세요.

| Plugin          | 패키지                     | 문서                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/ko/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/ko/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/ko/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/ko/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/ko/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/ko/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/ko/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/ko/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/ko/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/ko/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/ko/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/ko/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/ko/plugins/zalouser)         |

### 코어(OpenClaw와 함께 제공됨)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — 번들 메모리 검색(`plugins.slots.memory`를 통해 기본값)
    - `memory-lancedb` — 자동 리콜/캡처가 포함된 LanceDB 기반 장기 메모리(`plugins.slots.memory = "memory-lancedb"` 설정)

    OpenAI 호환 임베딩 설정, Ollama 예시, 리콜 제한, 문제 해결은
    [Memory LanceDB](/ko/plugins/memory-lancedb)를 참고하세요.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — 브라우저 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, 브라우저 런타임, 기본 브라우저 제어 서비스를 위한 번들 브라우저 Plugin(기본적으로 활성화됨; 대체하기 전에 비활성화)
    - `copilot-proxy` — VS Code Copilot Proxy 브리지(기본적으로 비활성화됨)

  </Accordion>
</AccordionGroup>

서드파티 Plugin을 찾고 있나요? [커뮤니티 Plugin](/ko/plugins/community)을 참고하세요.

## 구성

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 필드            | 설명                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 마스터 토글(기본값: `true`)                           |
| `allow`          | Plugin 허용 목록(선택 사항)                               |
| `deny`           | Plugin 거부 목록(선택 사항, 거부가 우선)                     |
| `load.paths`     | 추가 Plugin 파일/디렉터리                            |
| `slots`          | 배타적 슬롯 선택자(예: `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin별 토글 + 구성                               |

`plugins.allow`는 배타적입니다. 비어 있지 않으면 `tools.allow`에 `"*"` 또는 특정 Plugin 소유 도구 이름이 포함되어 있더라도, 나열된 Plugin만 로드하거나 도구를 노출할 수 있습니다. 도구 허용 목록이 Plugin 도구를 참조하는 경우 소유 Plugin ID를 `plugins.allow`에 추가하거나 `plugins.allow`를 제거하세요. `openclaw doctor`는 이 형태에 대해 경고합니다.

`/plugins enable` 또는 `/plugins disable`로 이루어진 구성 변경은 프로세스 내 Gateway Plugin 재로드를 트리거합니다. 새 에이전트 턴은 새로 고친 Plugin 레지스트리에서 도구 목록을 다시 빌드합니다. 설치, 업데이트, 제거와 같은 소스 변경 작업은 이미 가져온 Plugin 모듈을 제자리에서 안전하게 교체할 수 없기 때문에 여전히 Gateway 프로세스를 다시 시작합니다.

`openclaw plugins list`는 로컬 Plugin 레지스트리/구성 스냅샷입니다. 여기에서 `enabled` 상태인 Plugin은 저장된 레지스트리와 현재 구성이 해당 Plugin의 참여를 허용한다는 뜻입니다. 이미 실행 중인 원격 Gateway가 동일한 Plugin 코드로 재로드되었거나 다시 시작되었음을 증명하지는 않습니다. 래퍼 프로세스가 있는 VPS/컨테이너 설정에서는 실제 `openclaw gateway run` 프로세스에 재시작 또는 재로드 트리거 쓰기를 보내거나, 재로드가 실패를 보고할 때 실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **비활성화됨**: Plugin은 존재하지만 활성화 규칙이 꺼두었습니다. 구성은 보존됩니다.
  - **누락됨**: 구성이 탐색에서 찾지 못한 Plugin ID를 참조합니다.
  - **유효하지 않음**: Plugin은 존재하지만 구성이 선언된 스키마와 일치하지 않습니다. Gateway 시작은 해당 Plugin만 건너뜁니다. `openclaw doctor --fix`는 유효하지 않은 항목을 비활성화하고 구성 페이로드를 제거하여 격리할 수 있습니다.

</Accordion>

## 탐색 및 우선순위

OpenClaw는 다음 순서로 Plugin을 스캔합니다(첫 번째 일치 항목이 우선):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — 명시적 파일 또는 디렉터리 경로입니다. OpenClaw 자체 패키지 번들 Plugin 디렉터리를 다시 가리키는 경로는 무시됩니다. 이러한 오래된 별칭을 제거하려면 `openclaw doctor --fix`를 실행하세요.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    OpenClaw와 함께 제공됩니다. 많은 항목은 기본적으로 활성화됩니다(모델 공급자, 음성). 다른 항목은 명시적 활성화가 필요합니다.
  </Step>
</Steps>

패키지 설치와 Docker 이미지는 일반적으로 컴파일된 `dist/extensions` 트리에서 번들 Plugin을 해석합니다. 번들 Plugin 소스 디렉터리가 일치하는 패키지 소스 경로 위에 바인드 마운트된 경우, 예를 들어 `/app/extensions/synology-chat`처럼, OpenClaw는 해당 마운트된 소스 디렉터리를 번들 소스 오버레이로 취급하고 패키지된 `/app/dist/extensions/synology-chat` 번들보다 먼저 탐색합니다. 이렇게 하면 모든 번들 Plugin을 TypeScript 소스로 다시 전환하지 않고도 관리자 컨테이너 루프가 계속 작동합니다. 소스 오버레이 마운트가 있더라도 패키지된 dist 번들을 강제로 사용하려면 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`을 설정하세요.

### 활성화 규칙

- `plugins.enabled: false`는 모든 Plugin을 비활성화하고 Plugin 탐색/로드 작업을 건너뜁니다
- `plugins.deny`는 항상 허용보다 우선합니다
- `plugins.entries.\<id\>.enabled: false`는 해당 Plugin을 비활성화합니다
- 워크스페이스 출처 Plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함)
- 번들 Plugin은 재정의되지 않는 한 내장 기본 활성화 집합을 따릅니다
- 배타적 슬롯은 해당 슬롯에 선택된 Plugin을 강제로 활성화할 수 있습니다
- 일부 번들 옵트인 Plugin은 구성이 공급자 모델 참조, 채널 구성 또는 하네스 런타임과 같은 Plugin 소유 표면을 지정할 때 자동으로 활성화됩니다
- `plugins.enabled: false`가 활성 상태인 동안 오래된 Plugin 구성은 보존됩니다. 오래된 ID를 제거하려면 doctor 정리를 실행하기 전에 Plugin을 다시 활성화하세요
- OpenAI 계열 Codex 경로는 별도 Plugin 경계를 유지합니다. `openai-codex/*`는 OpenAI Plugin에 속하고, 번들 Codex 앱 서버 Plugin은 `agentRuntime.id: "codex"` 또는 레거시 `codex/*` 모델 참조로 선택됩니다

## 런타임 훅 문제 해결

Plugin이 `plugins list`에 표시되지만 라이브 채팅 트래픽에서 `register(api)` 부수 효과 또는 훅이 실행되지 않는 경우 먼저 다음을 확인하세요.

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성 Gateway URL, 프로필, 구성 경로, 프로세스가 편집 중인 대상과 일치하는지 확인하세요.
- Plugin 설치/구성/코드 변경 후 라이브 Gateway를 다시 시작하세요. 래퍼 컨테이너에서는 PID 1이 감독자일 뿐일 수 있으므로 자식 `openclaw gateway run` 프로세스를 다시 시작하거나 신호를 보내세요.
- 훅 등록과 진단을 확인하려면 `openclaw plugins inspect <id> --runtime --json`을 사용하세요. `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` 같은 비번들 대화 훅에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 선호하세요. 에이전트 턴의 모델 해석 전에 실행됩니다. `llm_output`은 모델 시도가 어시스턴트 출력을 생성한 뒤에만 실행됩니다.
- 유효한 세션 모델의 증거가 필요하면 `openclaw sessions` 또는 Gateway 세션/상태 표면을 사용하고, 공급자 페이로드를 디버깅할 때는 `--raw-stream --raw-stream-path <path>`로 Gateway를 시작하세요.

### 느린 Plugin 도구 설정

에이전트 턴이 도구를 준비하는 동안 멈춘 것처럼 보이면 추적 로깅을 활성화하고 Plugin 도구 팩터리 타이밍 줄을 확인하세요.

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

다음을 찾으세요.

```text
[trace:plugin-tools] factory timings ...
```

요약에는 총 팩터리 시간과 가장 느린 Plugin 도구 팩터리가 나열되며, Plugin ID, 선언된 도구 이름, 결과 형태, 도구가 선택 사항인지 여부가 포함됩니다. 단일 팩터리가 최소 1초 걸리거나 전체 Plugin 도구 팩터리 준비가 최소 5초 걸리면 느린 줄이 경고로 승격됩니다.

OpenClaw는 동일한 유효 요청 컨텍스트에서 반복 해석을 위해 성공한 Plugin 도구 팩터리 결과를 캐시합니다. 캐시 키에는 유효 런타임 구성, 워크스페이스, 에이전트/세션 ID, 샌드박스 정책, 브라우저 설정, 전달 컨텍스트, 요청자 신원, 소유권 상태가 포함되므로, 이러한 신뢰된 필드에 의존하는 팩터리는 컨텍스트가 변경될 때 다시 실행됩니다.

한 Plugin이 타이밍을 지배하는 경우 런타임 등록을 검사하세요.

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

그런 다음 해당 Plugin을 업데이트, 재설치 또는 비활성화하세요. Plugin 작성자는 비싼 의존성 로딩을 도구 팩터리 내부에서 수행하는 대신 도구 실행 경로 뒤로 옮겨야 합니다.

### 중복 채널 또는 도구 소유권

증상:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

이는 활성화된 둘 이상의 Plugin이 동일한 채널, 설정 흐름 또는 도구 이름을 소유하려 한다는 뜻입니다. 가장 흔한 원인은 이제 동일한 채널 ID를 제공하는 번들 Plugin 옆에 외부 채널 Plugin이 설치된 경우입니다.

디버그 단계:

- 활성화된 모든 Plugin과 출처를 보려면 `openclaw plugins list --enabled --verbose`를 실행하세요.
- 의심되는 각 Plugin에 대해 `openclaw plugins inspect <id> --runtime --json`을 실행하고 `channels`, `channelConfigs`, `tools`, 진단을 비교하세요.
- Plugin 패키지를 설치하거나 제거한 뒤에는 저장된 메타데이터가 현재 설치를 반영하도록 `openclaw plugins registry --refresh`를 실행하세요.
- 설치, 레지스트리 또는 구성 변경 후 Gateway를 다시 시작하세요.

수정 옵션:

- 한 Plugin이 동일한 채널 ID에 대해 다른 Plugin을 의도적으로 대체하는 경우, 선호되는 Plugin은 더 낮은 우선순위의 Plugin ID와 함께 `channelConfigs.<channel-id>.preferOver`를 선언해야 합니다. [/plugins/manifest#replacing-another-channel-plugin](/ko/plugins/manifest#replacing-another-channel-plugin)을 참조하세요.
- 중복이 실수라면 `plugins.entries.<plugin-id>.enabled: false`로 한쪽을 비활성화하거나 오래된 Plugin 설치를 제거하세요.
- 두 Plugin을 명시적으로 모두 활성화한 경우 OpenClaw는 해당 요청을 유지하고 충돌을 보고합니다. 채널의 소유자를 하나 선택하거나 Plugin 소유 도구의 이름을 변경하여 런타임 표면을 모호하지 않게 만드세요.

## Plugin 슬롯(배타적 범주)

일부 범주는 배타적입니다(한 번에 하나만 활성화).

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 슬롯            | 제어 대상      | 기본값             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory Plugin  | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진 | `legacy`(내장) |

## CLI 참조

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

번들 Plugin은 OpenClaw과 함께 제공됩니다. 다수는 기본적으로 활성화되어 있습니다(예:
번들 모델 제공자, 번들 음성 제공자, 번들 브라우저
Plugin). 다른 번들 Plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 Plugin 또는 훅 팩을 그 자리에서 덮어씁니다. 추적되는 npm
Plugin의 일반 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요.
관리되는 설치 대상 위에 복사하는 대신 원본 경로를 재사용하는 `--link`와는 함께 지원되지 않습니다.

`plugins.allow`가 이미 설정되어 있으면, `openclaw plugins install`은
설치된 Plugin id를 활성화하기 전에 해당 허용 목록에 추가합니다. 같은 Plugin id가
`plugins.deny`에 있으면, 설치는 해당 오래된 deny 항목을 제거하여
명시적으로 설치한 Plugin이 재시작 후 즉시 로드될 수 있게 합니다.

OpenClaw은 Plugin 인벤토리, 기여 소유권, 시작 계획을 위한 콜드 읽기 모델로
영속적인 로컬 Plugin 레지스트리를 유지합니다. 설치, 업데이트,
제거, 활성화, 비활성화 흐름은 Plugin 상태를 변경한 뒤 해당 레지스트리를 새로 고칩니다.
같은 `plugins/installs.json` 파일은 최상위 `installRecords`에 내구성 있는 설치 메타데이터를,
`plugins`에 재구성 가능한 매니페스트 메타데이터를 보관합니다. 레지스트리가
없거나, 오래되었거나, 유효하지 않으면 `openclaw plugins registry
--refresh`는 Plugin 런타임 모듈을 로드하지 않고 설치 기록, 구성 정책,
매니페스트/패키지 메타데이터에서 매니페스트 뷰를 다시 빌드합니다.
`openclaw plugins update <id-or-npm-spec>`는 추적되는 설치에 적용됩니다. dist-tag나 정확한 버전이 있는
npm 패키지 spec을 전달하면 패키지 이름을 추적되는 Plugin 레코드로 다시 해석하고
향후 업데이트를 위해 새 spec을 기록합니다. 버전 없이 패키지 이름을 전달하면
정확히 고정된 설치가 레지스트리의 기본 릴리스 라인으로 다시 이동합니다. 설치된 npm Plugin이 이미
해석된 버전 및 기록된 아티팩트 ID와 일치하면, OpenClaw은 다운로드, 재설치, 구성 다시 쓰기 없이
업데이트를 건너뜁니다.
`openclaw update`가 beta 채널에서 실행되면, 기본 라인 npm 및 ClawHub
Plugin 레코드는 먼저 `@beta`를 시도하고 Plugin beta 릴리스가 없을 때 default/latest로
대체합니다. 정확한 버전과 명시적 태그는 고정된 상태로 유지됩니다.

`--pin`은 npm 전용입니다. marketplace 설치는 npm spec 대신 marketplace 원본 메타데이터를 유지하므로
`--marketplace`와 함께 지원되지 않습니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐을 위한
비상용 override입니다. Plugin 설치 및 Plugin 업데이트가 내장 `critical` 결과를 지나 계속될 수 있게 하지만,
Plugin `before_install` 정책 차단이나 스캔 실패 차단은 여전히 우회하지 않습니다.
설치 스캔은 패키징된 테스트 mock이 차단되지 않도록 `tests/`,
`__tests__/`, `*.test.*`, `*.spec.*` 같은 일반적인 테스트 파일과 디렉터리를 무시합니다.
선언된 Plugin 런타임 진입점은 이러한 이름 중 하나를 사용하더라도 여전히 스캔됩니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 Skills
의존성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청
override를 사용하며, `openclaw skills install`은 별도의 ClawHub
Skills 다운로드/설치 흐름으로 유지됩니다.

ClawHub에 게시한 Plugin이 스캔으로 인해 숨겨지거나 차단된 경우,
ClawHub 대시보드를 열거나 `clawhub package rescan <name>`을 실행하여 ClawHub에
다시 확인해 달라고 요청하세요. `--dangerously-force-unsafe-install`은 사용자의
컴퓨터에서 수행되는 설치에만 영향을 줍니다. ClawHub에 Plugin을 다시 스캔하도록 요청하거나
차단된 릴리스를 공개하지 않습니다.

호환 번들은 동일한 Plugin 목록/검사/활성화/비활성화 흐름에 참여합니다.
현재 런타임 지원에는 번들 Skills, Claude command-skills,
Claude `settings.json` 기본값, Claude `.lsp.json` 및 매니페스트에서 선언한
`lspServers` 기본값, Cursor command-skills, 호환 Codex 훅
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 Plugin에 대해 감지된 번들 기능과
지원되거나 지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

Marketplace 원본은 `~/.claude/plugins/known_marketplaces.json`의 Claude 알려진 marketplace 이름,
로컬 marketplace 루트 또는 `marketplace.json` 경로, `owner/repo` 같은 GitHub 축약형,
GitHub repo URL 또는 git URL일 수 있습니다. 원격 marketplace의 경우 Plugin 항목은
복제된 marketplace repo 안에 있어야 하며 상대 경로 원본만 사용해야 합니다.

전체 세부 정보는 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 확인하세요.

## Plugin API 개요

네이티브 Plugin은 `register(api)`를 노출하는 엔트리 객체를 export합니다. 오래된
Plugin은 여전히 레거시 alias로 `activate(api)`를 사용할 수 있지만, 새 Plugin은
`register`를 사용해야 합니다.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw은 Plugin 활성화 중 엔트리 객체를 로드하고 `register(api)`를 호출합니다.
로더는 오래된 Plugin을 위해 여전히 `activate(api)`로 fallback하지만,
번들 Plugin과 새 외부 Plugin은 `register`를 공개 계약으로 취급해야 합니다.

`api.registrationMode`는 엔트리가 왜 로드되는지 Plugin에 알려줍니다.

| 모드            | 의미                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 런타임 활성화. 도구, 훅, 서비스, 명령, 라우트 및 기타 라이브 부수 효과를 등록합니다.                              |
| `discovery`     | 읽기 전용 기능 탐색. 제공자와 메타데이터를 등록합니다. 신뢰할 수 있는 Plugin 엔트리 코드는 로드될 수 있지만 라이브 부수 효과는 건너뜁니다. |
| `setup-only`    | 경량 설정 엔트리를 통한 채널 설정 메타데이터 로딩입니다.                                                                |
| `setup-runtime` | 런타임 엔트리도 필요한 채널 설정 로딩입니다.                                                                         |
| `cli-metadata`  | CLI 명령 메타데이터 수집 전용입니다.                                                                                            |

소켓, 데이터베이스, 백그라운드 워커 또는 장기 실행 클라이언트를 여는 Plugin 엔트리는
이러한 부수 효과를 `api.registrationMode === "full"`로 보호해야 합니다.
Discovery 로드는 활성화 로드와 별도로 캐시되며 실행 중인 Gateway 레지스트리를 대체하지 않습니다.
Discovery는 비활성화 방식이지만 import-free는 아닙니다.
OpenClaw은 snapshot을 빌드하기 위해 신뢰할 수 있는 Plugin 엔트리 또는 채널 Plugin 모듈을 평가할 수 있습니다.
모듈 최상위는 가볍고 부수 효과가 없게 유지하고, 네트워크 클라이언트, 하위 프로세스, 리스너,
자격 증명 읽기, 서비스 시작은 전체 런타임 경로 뒤로 이동하세요.

일반적인 등록 메서드:

| 메서드                                  | 등록 대상           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 제공자(LLM)        |
| `registerChannel`                       | 채팅 채널                |
| `registerTool`                          | 에이전트 도구                  |
| `registerHook` / `on(...)`              | 수명 주기 훅             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT               |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성       |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석        |
| `registerImageGenerationProvider`       | 이미지 생성            |
| `registerMusicGenerationProvider`       | 음악 생성            |
| `registerVideoGenerationProvider`       | 비디오 생성            |
| `registerWebFetchProvider`              | 웹 fetch / scrape 제공자 |
| `registerWebSearchProvider`             | 웹 검색                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | CLI 명령                |
| `registerContextEngine`                 | 컨텍스트 엔진              |
| `registerService`                       | 백그라운드 서비스          |

typed 수명 주기 훅의 훅 guard 동작:

- `before_tool_call`: `{ block: true }`는 최종 처리입니다. 더 낮은 우선순위의 handler는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 no-op이며 이전 block을 지우지 않습니다.
- `before_install`: `{ block: true }`는 최종 처리입니다. 더 낮은 우선순위의 handler는 건너뜁니다.
- `before_install`: `{ block: false }`는 no-op이며 이전 block을 지우지 않습니다.
- `message_sending`: `{ cancel: true }`는 최종 처리입니다. 더 낮은 우선순위의 handler는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 no-op이며 이전 cancel을 지우지 않습니다.

네이티브 Codex app-server는 Codex-native 도구 이벤트를 이 훅 surface로 다시 bridge합니다.
Plugin은 `before_tool_call`을 통해 네이티브 Codex 도구를 차단하고,
`after_tool_call`을 통해 결과를 관찰하며, Codex
`PermissionRequest` 승인에 참여할 수 있습니다. bridge는 아직 Codex-native 도구
인수를 다시 쓰지 않습니다. 정확한 Codex 런타임 지원 경계는
[Codex harness v1 지원 계약](/ko/plugins/codex-harness#v1-support-contract)에 있습니다.

전체 typed 훅 동작은 [SDK 개요](/ko/plugins/sdk-overview#hook-decision-semantics)를 확인하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins) — 자체 Plugin 생성
- [Plugin 번들](/ko/plugins/bundles) — Codex/Claude/Cursor 번들 호환성
- [Plugin 매니페스트](/ko/plugins/manifest) — 매니페스트 스키마
- [도구 등록](/ko/plugins/building-plugins#registering-agent-tools) — Plugin에 에이전트 도구 추가
- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델 및 로드 파이프라인
- [커뮤니티 Plugin](/ko/plugins/community) — 서드파티 목록
