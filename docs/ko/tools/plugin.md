---
read_when:
    - Plugin 설치 또는 구성
    - Plugin 검색 및 로드 규칙 이해
    - Codex/Claude 호환 Plugin 번들 작업하기
sidebarTitle: Install and Configure
summary: OpenClaw Plugin 설치, 구성 및 관리
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugin은 OpenClaw에 새 기능을 확장합니다. 채널, 모델 제공자,
에이전트 하네스, 도구, Skills, 음성, 실시간 전사, 실시간
음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹
검색 등이 포함됩니다. 일부 Plugin은 **core**(OpenClaw와 함께 제공됨)이고, 다른 Plugin은
**external**입니다. 대부분의 외부 Plugin은
[ClawHub](/ko/tools/clawhub)를 통해 게시되고 검색됩니다. Npm은 직접 설치와
마이그레이션이 완료되는 동안 임시 OpenClaw 소유 Plugin 패키지 집합에 대해 계속 지원됩니다.

## 빠른 시작

복사해 붙여넣을 수 있는 설치, 목록 보기, 제거, 업데이트, 게시 예시는
[Plugin 관리](/ko/plugins/manage-plugins)를 참조하세요.

<Steps>
  <Step title="로드된 항목 보기">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin 설치">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    그런 다음 구성 파일의 `plugins.entries.\<id\>.config` 아래에서 설정하세요.

  </Step>

  <Step title="채팅 네이티브 관리">
    실행 중인 Gateway에서 소유자 전용 `/plugins enable` 및 `/plugins disable`은
    Gateway 구성 리로더를 트리거합니다. Gateway는 프로세스 안에서 Plugin 런타임
    표면을 다시 로드하며, 새 에이전트 턴은 새로 고친 레지스트리에서
    도구 목록을 다시 빌드합니다. `/plugins install`은 Plugin 소스 코드를 변경하므로
    Gateway는 현재 프로세스가 이미 가져온 모듈을 안전하게
    다시 로드할 수 있는 척하는 대신 재시작을 요청합니다.

  </Step>

  <Step title="Plugin 확인">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    등록된 도구, 서비스, gateway 메서드, 훅 또는 Plugin 소유 CLI 명령을 증명해야 할 때는
    `--runtime`을 사용하세요. 일반 `inspect`는 콜드
    매니페스트/레지스트리 검사이며, 의도적으로 Plugin 런타임 가져오기를 피합니다.

  </Step>
</Steps>

채팅 네이티브 제어를 선호한다면 `commands.plugins: true`를 활성화하고 다음을 사용하세요.

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

설치 경로는 CLI와 같은 리졸버를 사용합니다. 로컬 경로/아카이브, 명시적
`clawhub:<pkg>`, 명시적 `npm:<pkg>`, 명시적 `npm-pack:<path.tgz>`,
명시적 `git:<repo>`, 또는 npm을 통한 베어 패키지 사양입니다.

구성이 유효하지 않으면 설치는 일반적으로 닫힌 상태로 실패하고
`openclaw doctor --fix`를 안내합니다. 유일한 복구 예외는
`openclaw.install.allowInvalidConfigRecovery`를 옵트인한 Plugin을 위한
좁은 번들 Plugin 재설치 경로입니다.
Gateway 시작 중에는 유효하지 않은 Plugin 구성이 다른 유효하지 않은 구성처럼 닫힌 상태로 실패합니다.
`openclaw doctor --fix`를 실행해 해당 Plugin 항목을 비활성화하고
유효하지 않은 구성 페이로드를 제거하여 잘못된 Plugin 구성을 격리하세요. 일반
구성 백업은 이전 값을 보존합니다.
채널 구성이 더 이상 검색할 수 없는 Plugin을 참조하지만 같은
오래된 Plugin id가 Plugin 구성이나 설치 기록에 남아 있으면, Gateway 시작은
모든 다른 채널을 차단하는 대신 경고를 기록하고 해당 채널을 건너뜁니다.
`openclaw doctor --fix`를 실행해 오래된 채널/Plugin 항목을 제거하세요. 오래된 Plugin 증거가 없는 알 수 없는
채널 키는 여전히 검증에 실패하므로 오타가 계속 보입니다.
`plugins.enabled: false`가 설정되어 있으면 오래된 Plugin 참조는 비활성으로 처리됩니다.
Gateway 시작은 Plugin 검색/로드 작업을 건너뛰고 `openclaw doctor`는
비활성화된 Plugin 구성을 자동 제거하는 대신 보존합니다. 오래된 Plugin id를 제거하려면
doctor 정리를 실행하기 전에 Plugin을 다시 활성화하세요.

Plugin 의존성 설치는 명시적 설치/업데이트 또는
doctor 복구 흐름 중에만 발생합니다. Gateway 시작, 구성 다시 로드, 런타임 검사는
패키지 관리자를 실행하거나 의존성 트리를 복구하지 않습니다. 로컬 Plugin은 이미
의존성이 설치되어 있어야 하며, npm, git, ClawHub Plugin은
OpenClaw의 관리형 Plugin 루트 아래에 설치됩니다. npm 의존성은 OpenClaw의 관리형 npm 루트 안에서
호이스팅될 수 있습니다. 설치/업데이트는 신뢰 전에 해당 관리형 루트를 스캔하고,
제거는 npm을 통해 npm 관리 패키지를 제거합니다. 외부 Plugin과 사용자 지정 로드 경로도
`openclaw plugins install`을 통해 설치해야 합니다.
런타임 코드를 가져오거나 의존성을 복구하지 않고 각
표시 Plugin의 정적 `dependencyStatus`를 보려면 `openclaw plugins list --json`을 사용하세요.
설치 시점 수명 주기는 [Plugin 의존성 해석](/ko/plugins/dependency-resolution)을 참조하세요.

### 차단된 Plugin 경로 소유권

Plugin 진단에
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
가 표시되고 구성 검증에서 이어서 `plugin present but blocked`가 표시되면, OpenClaw가
이를 로드하는 프로세스와 다른 Unix 사용자가 소유한
Plugin 파일을 발견한 것입니다. Plugin 구성을 그대로 두고, 파일 시스템 소유권을 수정하거나
상태 디렉터리를 소유한 동일한 사용자로 OpenClaw를 실행하세요.

Docker 설치의 경우 공식 이미지는 `node`(uid `1000`)로 실행되므로,
호스트에 바인드 마운트된 OpenClaw 구성 및 작업공간 디렉터리는 일반적으로
uid `1000`이 소유해야 합니다.

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

의도적으로 OpenClaw를 root로 실행하는 경우, 관리형 Plugin 루트를
대신 root 소유권으로 복구하세요.

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

소유권을 수정한 뒤 `openclaw doctor --fix` 또는
`openclaw plugins registry --refresh`를 다시 실행하여 영구 저장된 Plugin 레지스트리가
복구된 파일과 일치하게 하세요.

npm 설치의 경우 `latest`나 dist-tag 같은 변경 가능한 선택자는
설치 전에 해석되고, 이후 OpenClaw의 관리형 npm 루트에서 정확히 검증된 버전으로
고정됩니다. npm이 완료된 뒤 OpenClaw는 설치된
`package-lock.json` 항목이 해석된 버전 및 무결성과 여전히 일치하는지 확인합니다. npm이
다른 패키지 메타데이터를 쓰면 설치는 실패하고, 다른 Plugin 아티팩트를
받아들이는 대신 관리형 패키지가 롤백됩니다.

소스 체크아웃은 pnpm 작업공간입니다. 번들 Plugin을 수정하기 위해 OpenClaw를 클론한 경우
`pnpm install`을 실행하세요. 그러면 OpenClaw는
`extensions/<id>`에서 번들 Plugin을 로드하므로 수정 사항과 패키지 로컬 의존성이 직접 사용됩니다.
일반 npm 루트 설치는 패키징된 OpenClaw용이며, 소스 체크아웃
개발용이 아닙니다.

## Plugin 유형

OpenClaw는 두 가지 Plugin 형식을 인식합니다.

| 형식       | 작동 방식                                                          | 예시                                                   |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 런타임 모듈. 프로세스 안에서 실행됨        | 공식 Plugin, 커뮤니티 npm 패키지                       |
| **Bundle** | Codex/Claude/Cursor 호환 레이아웃. OpenClaw 기능으로 매핑됨        | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

둘 다 `openclaw plugins list` 아래에 표시됩니다. 번들 세부 정보는 [Plugin Bundles](/ko/plugins/bundles)를 참조하세요.

네이티브 Plugin을 작성하는 경우 [Plugin 빌드](/ko/plugins/building-plugins)와
[Plugin SDK 개요](/ko/plugins/sdk-overview)부터 시작하세요.

## 패키지 진입점

네이티브 Plugin npm 패키지는 `package.json`에 `openclaw.extensions`를 선언해야 합니다.
각 항목은 패키지 디렉터리 안에 있어야 하며 읽을 수 있는
런타임 파일로 해석되거나, `src/index.ts`에서 `dist/index.js`처럼 추론된 빌드된 JavaScript
피어가 있는 TypeScript 소스 파일로 해석되어야 합니다.
패키징된 설치는 해당 JavaScript 런타임 출력을 포함해야 합니다. TypeScript
소스 폴백은 소스 체크아웃과 로컬 개발 경로용이며,
OpenClaw의 관리형 Plugin 루트에 설치된 npm 패키지용이 아닙니다.

관리형 패키지 경고가 `requires compiled runtime output for
TypeScript entry ...`라고 표시되면, 해당 패키지는 OpenClaw가 런타임에 필요한
JavaScript 파일 없이 게시된 것입니다. 이는 Plugin 패키징 문제이지 로컬 구성
문제가 아닙니다. 게시자가 컴파일된 JavaScript를 다시 게시한 뒤 Plugin을 업데이트하거나
재설치하세요. 또는 수정된 패키지를 사용할 수 있을 때까지 해당 Plugin을 비활성화/제거하세요.

게시된 런타임 파일이 소스 항목과 같은 경로에 있지 않을 때는 `openclaw.runtimeExtensions`를 사용하세요.
존재하는 경우 `runtimeExtensions`에는 모든 `extensions` 항목마다
정확히 하나의 항목이 있어야 합니다. 목록이 일치하지 않으면 소스 경로로 조용히
폴백하는 대신 설치와 Plugin 검색이 실패합니다. `openclaw.setupEntry`도
게시하는 경우 빌드된 JavaScript 피어에는 `openclaw.runtimeSetupEntry`를 사용하세요.
선언된 경우 해당 파일은 필수입니다.

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

### 마이그레이션 중 OpenClaw 소유 npm 패키지

ClawHub는 대부분 Plugin의 기본 배포 경로입니다. 현재 패키징된
OpenClaw 릴리스는 이미 많은 공식 Plugin을 번들로 제공하므로, 일반 설정에서는
별도의 npm 설치가 필요하지 않습니다. 모든 OpenClaw 소유 Plugin이
ClawHub로 마이그레이션될 때까지 OpenClaw는 이전/사용자 지정 설치와 직접 npm 워크플로를 위해
일부 `@openclaw/*` Plugin 패키지를 npm에 계속 제공합니다.

npm이 `@openclaw/*` Plugin 패키지를 deprecated로 보고하면, 해당 패키지
버전은 더 오래된 외부 패키지 라인의 것입니다. 더 최신 npm 패키지가 게시될 때까지
현재 OpenClaw의 번들 Plugin 또는 로컬 체크아웃을 사용하세요.

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

### Core(OpenClaw와 함께 제공됨)

<AccordionGroup>
  <Accordion title="모델 제공자(기본적으로 활성화됨)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="메모리 Plugin">
    - `memory-core` - 번들 메모리 검색(`plugins.slots.memory`를 통해 기본값)
    - `memory-lancedb` - 자동 회상/캡처 기능이 있는 LanceDB 기반 장기 메모리(`plugins.slots.memory = "memory-lancedb"` 설정)

    [Memory LanceDB](/ko/plugins/memory-lancedb)에서 OpenAI 호환 임베딩 설정,
    Ollama 예시, 회수 제한, 문제 해결을 참조하세요.

  </Accordion>

  <Accordion title="음성 제공자(기본적으로 활성화됨)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="기타">
    - `browser` - 브라우저 도구, `openclaw browser` CLI, `browser.request` gateway 메서드, 브라우저 런타임, 기본 브라우저 제어 서비스용 번들 브라우저 Plugin(기본적으로 활성화됨, 교체하기 전에 비활성화)
    - `copilot-proxy` - VS Code Copilot Proxy 브리지(기본적으로 비활성화됨)

  </Accordion>
</AccordionGroup>

타사 Plugin을 찾고 있나요? [커뮤니티 Plugin](/ko/plugins/community)을 참조하세요.

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

| 필드               | 설명                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | 마스터 토글(기본값: `true`)                               |
| `allow`            | Plugin 허용 목록(선택 사항)                               |
| `bundledDiscovery` | 번들 Plugin 검색 모드(기본값은 `allowlist`)               |
| `deny`             | Plugin 거부 목록(선택 사항, 거부가 우선함)                |
| `load.paths`       | 추가 Plugin 파일/디렉터리                                 |
| `slots`            | 독점 슬롯 선택기(예: `memory`, `contextEngine`)           |
| `entries.\<id\>`   | Plugin별 토글 + 구성                                      |

`plugins.allow`는 배타적입니다. 비어 있지 않으면 `tools.allow`에 `"*"` 또는 특정 Plugin 소유 도구 이름이 포함되어 있더라도, 나열된 Plugin만 로드되거나 도구를 노출할 수 있습니다. 도구 허용 목록이 Plugin 도구를 참조하는 경우 소유 Plugin id를 `plugins.allow`에 추가하거나 `plugins.allow`를 제거하세요. `openclaw doctor`는 이 형태에 대해 경고합니다.

새 구성에서 `plugins.bundledDiscovery`의 기본값은 `"allowlist"`이므로, 제한적인 `plugins.allow` 인벤터리는 런타임 웹 검색 제공자 검색을 포함해 누락된 번들 제공자 Plugin도 차단합니다. Doctor는 이전의 제한적인 허용 목록 구성을 마이그레이션 중 `"compat"`로 표시하여, 운영자가 더 엄격한 모드를 선택하기 전까지 업그레이드가 레거시 번들 제공자 동작을 유지하도록 합니다. 빈 `plugins.allow`는 여전히 설정되지 않은/열린 상태로 처리됩니다.

`/plugins enable` 또는 `/plugins disable`을 통해 변경한 구성은 프로세스 내 Gateway Plugin 재로드를 트리거합니다. 새 에이전트 턴은 새로 고친 Plugin 레지스트리에서 도구 목록을 다시 빌드합니다. 설치, 업데이트, 제거처럼 소스를 변경하는 작업은 이미 가져온 Plugin 모듈을 제자리에서 안전하게 교체할 수 없으므로 여전히 Gateway 프로세스를 다시 시작합니다.

`openclaw plugins list`는 로컬 Plugin 레지스트리/구성 스냅샷입니다. 여기서 `enabled`인 Plugin은 저장된 레지스트리와 현재 구성이 해당 Plugin의 참여를 허용한다는 뜻입니다. 이미 실행 중인 원격 Gateway가 동일한 Plugin 코드로 재로드되거나 다시 시작되었음을 증명하지는 않습니다. 래퍼 프로세스가 있는 VPS/컨테이너 설정에서는 실제 `openclaw gateway run` 프로세스로 재시작 또는 재로드 트리거 쓰기를 보내거나, 재로드가 실패를 보고할 때 실행 중인 Gateway에 대해 `openclaw gateway restart`를 사용하세요.

<Accordion title="Plugin 상태: 비활성화됨 vs 누락됨 vs 유효하지 않음">
  - **비활성화됨**: Plugin은 존재하지만 활성화 규칙이 꺼 두었습니다. 구성은 보존됩니다.
  - **누락됨**: 구성이 검색에서 찾지 못한 Plugin id를 참조합니다.
  - **유효하지 않음**: Plugin은 존재하지만 구성이 선언된 스키마와 일치하지 않습니다. Gateway 시작은 해당 Plugin만 건너뜁니다. `openclaw doctor --fix`는 유효하지 않은 항목을 비활성화하고 구성 페이로드를 제거하여 격리할 수 있습니다.

</Accordion>

## 검색 및 우선순위

OpenClaw는 다음 순서로 Plugin을 스캔합니다(첫 번째 일치가 우선):

<Steps>
  <Step title="구성 경로">
    `plugins.load.paths` - 명시적 파일 또는 디렉터리 경로입니다. OpenClaw 자체 패키지 번들 Plugin 디렉터리를 다시 가리키는 경로는 무시됩니다.
    오래된 별칭을 제거하려면 `openclaw doctor --fix`를 실행하세요.
  </Step>

  <Step title="워크스페이스 Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 및 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="전역 Plugin">
    `~/.openclaw/<plugin-root>/*.ts` 및 `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="번들 Plugin">
    OpenClaw와 함께 제공됩니다. 다수는 기본적으로 활성화됩니다(모델 제공자, 음성).
    그 외에는 명시적인 활성화가 필요합니다.
  </Step>
</Steps>

패키지 설치와 Docker 이미지는 일반적으로 컴파일된 `dist/extensions` 트리에서 번들 Plugin을 확인합니다. 번들 Plugin 소스 디렉터리가 일치하는 패키지 소스 경로 위에 bind-mounted된 경우, 예를 들어 `/app/extensions/synology-chat`, OpenClaw는 해당 마운트된 소스 디렉터리를 번들 소스 오버레이로 취급하고 패키지된 `/app/dist/extensions/synology-chat` 번들보다 먼저 검색합니다. 이렇게 하면 모든 번들 Plugin을 TypeScript 소스로 다시 전환하지 않고도 메인테이너 컨테이너 루프가 계속 작동합니다. 소스 오버레이 마운트가 있어도 패키지된 dist 번들을 강제로 사용하려면 `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`을 설정하세요.

### 활성화 규칙

- `plugins.enabled: false`는 모든 Plugin을 비활성화하고 Plugin 검색/로드 작업을 건너뜁니다.
- `plugins.deny`는 항상 allow보다 우선합니다.
- `plugins.entries.\<id\>.enabled: false`는 해당 Plugin을 비활성화합니다.
- 워크스페이스 출처 Plugin은 **기본적으로 비활성화**됩니다(명시적으로 활성화해야 함).
- 번들 Plugin은 재정의되지 않는 한 내장된 기본 활성화 집합을 따릅니다.
- 독점 슬롯은 해당 슬롯에 대해 선택된 Plugin을 강제로 활성화할 수 있습니다.
- 일부 번들 opt-in Plugin은 제공자 모델 참조, 채널 구성 또는 하네스 런타임처럼 구성이 Plugin 소유 표면을 명명할 때 자동으로 활성화됩니다.
- 오래된 Plugin 구성은 `plugins.enabled: false`가 활성 상태인 동안 보존됩니다. 오래된 id를 제거하려면 doctor 정리를 실행하기 전에 Plugin을 다시 활성화하세요.
- OpenAI 계열 Codex 라우트는 별도의 Plugin 경계를 유지합니다.
  `openai-codex/*`는 OpenAI Plugin에 속하고, 번들 Codex 앱 서버 Plugin은 `agentRuntime.id: "codex"` 또는 레거시 `codex/*` 모델 참조로 선택됩니다.

## 런타임 훅 문제 해결

Plugin이 `plugins list`에 나타나지만 `register(api)` 부수 효과 또는 훅이 실시간 채팅 트래픽에서 실행되지 않으면 먼저 다음을 확인하세요.

- `openclaw gateway status --deep --require-rpc`를 실행하고 활성 Gateway URL, 프로필, 구성 경로, 프로세스가 편집 중인 것과 일치하는지 확인하세요.
- Plugin 설치/구성/코드 변경 후 실시간 Gateway를 다시 시작하세요. 래퍼 컨테이너에서는 PID 1이 감독자일 뿐일 수 있으므로, 자식 `openclaw gateway run` 프로세스를 다시 시작하거나 시그널을 보내세요.
- 훅 등록과 진단을 확인하려면 `openclaw plugins inspect <id> --runtime --json`을 사용하세요. `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` 같은 비번들 대화 훅에는 `plugins.entries.<id>.hooks.allowConversationAccess=true`가 필요합니다.
- 모델 전환에는 `before_model_resolve`를 선호하세요. 에이전트 턴의 모델 해석 전에 실행됩니다. `llm_output`은 모델 시도가 어시스턴트 출력을 생성한 후에만 실행됩니다.
- 유효한 세션 모델을 증명하려면 `openclaw sessions` 또는 Gateway 세션/상태 표면을 사용하고, 제공자 페이로드를 디버깅할 때는 `--raw-stream --raw-stream-path <path>`로 Gateway를 시작하세요.

### 느린 Plugin 도구 설정

에이전트 턴이 도구를 준비하는 동안 멈춘 것처럼 보이면 trace 로깅을 활성화하고 Plugin 도구 팩터리 타이밍 줄을 확인하세요.

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

다음을 찾으세요.

```text
[trace:plugin-tools] factory timings ...
```

요약에는 총 팩터리 시간과 가장 느린 Plugin 도구 팩터리가 나열되며, Plugin id, 선언된 도구 이름, 결과 형태, 도구가 선택 사항인지 여부가 포함됩니다. 단일 팩터리가 최소 1초가 걸리거나 총 Plugin 도구 팩터리 준비가 최소 5초가 걸리면 느린 줄은 경고로 승격됩니다.

OpenClaw는 동일한 유효 요청 컨텍스트로 반복 해석할 때 성공한 Plugin 도구 팩터리 결과를 캐시합니다. 캐시 키에는 유효 런타임 구성, 워크스페이스, 에이전트/세션 id, 샌드박스 정책, 브라우저 설정, 전달 컨텍스트, 요청자 ID, 소유권 상태가 포함되므로, 이러한 신뢰 필드에 의존하는 팩터리는 컨텍스트가 변경되면 다시 실행됩니다.

한 Plugin이 타이밍을 지배한다면 런타임 등록을 검사하세요.

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

그런 다음 해당 Plugin을 업데이트, 재설치 또는 비활성화하세요. Plugin 작성자는 값비싼 종속성 로딩을 도구 팩터리 내부에서 수행하는 대신 도구 실행 경로 뒤로 이동해야 합니다.

### 중복 채널 또는 도구 소유권

증상:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

이는 활성화된 Plugin이 둘 이상 같은 채널, 설정 흐름 또는 도구 이름을 소유하려 한다는 뜻입니다. 가장 흔한 원인은 이제 동일한 채널 id를 제공하는 번들 Plugin 옆에 외부 채널 Plugin이 설치된 경우입니다.

디버그 단계:

- 활성화된 모든 Plugin과 출처를 보려면 `openclaw plugins list --enabled --verbose`를 실행하세요.
- 의심되는 각 Plugin에 대해 `openclaw plugins inspect <id> --runtime --json`을 실행하고 `channels`, `channelConfigs`, `tools`, 진단을 비교하세요.
- Plugin 패키지를 설치하거나 제거한 후에는 저장된 메타데이터가 현재 설치를 반영하도록 `openclaw plugins registry --refresh`를 실행하세요.
- 설치, 레지스트리 또는 구성 변경 후 Gateway를 다시 시작하세요.

수정 옵션:

- 한 Plugin이 동일한 채널 id에 대해 다른 Plugin을 의도적으로 대체한다면, 선호되는 Plugin은 낮은 우선순위의 Plugin id로 `channelConfigs.<channel-id>.preferOver`를 선언해야 합니다. [/plugins/manifest#replacing-another-channel-plugin](/ko/plugins/manifest#replacing-another-channel-plugin)을 참조하세요.
- 중복이 우발적이라면 `plugins.entries.<plugin-id>.enabled: false`로 한쪽을 비활성화하거나 오래된 Plugin 설치를 제거하세요.
- 두 Plugin을 모두 명시적으로 활성화한 경우 OpenClaw는 해당 요청을 유지하고 충돌을 보고합니다. 채널 소유자를 하나 선택하거나 Plugin 소유 도구의 이름을 바꿔 런타임 표면이 모호하지 않도록 하세요.

## Plugin 슬롯(독점 카테고리)

일부 카테고리는 독점적입니다(한 번에 하나만 활성화됨).

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

| 슬롯            | 제어 대상             | 기본값              |
| --------------- | --------------------- | ------------------- |
| `memory`        | 활성 메모리 Plugin    | `memory-core`       |
| `contextEngine` | 활성 컨텍스트 엔진    | `legacy` (내장)     |

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

번들 Plugin은 OpenClaw와 함께 제공됩니다. 다수는 기본적으로 활성화되어 있습니다(예:
번들 모델 제공자, 번들 음성 제공자, 번들 브라우저
Plugin). 다른 번들 Plugin은 여전히 `openclaw plugins enable <id>`가 필요합니다.

`--force`는 기존에 설치된 Plugin 또는 훅 팩을 제자리에서 덮어씁니다. 추적되는 npm
Plugin의 일반적인 업그레이드에는 `openclaw plugins update <id-or-npm-spec>`를 사용하세요.
관리되는 설치 대상에 복사하지 않고 소스 경로를 재사용하는 `--link`와 함께 사용하는 것은
지원되지 않습니다.

`plugins.allow`가 이미 설정되어 있으면, `openclaw plugins install`은 설치된
Plugin ID를 해당 허용 목록에 추가한 뒤 활성화합니다. 같은 Plugin ID가
`plugins.deny`에 있으면, 명시적 설치가 재시작 후 즉시 로드될 수 있도록 설치 과정에서 해당
오래된 거부 항목을 제거합니다.

OpenClaw는 Plugin 인벤토리, 기여 소유권, 시작 계획을 위한 콜드 읽기 모델로 지속되는 로컬
Plugin 레지스트리를 유지합니다. 설치, 업데이트, 제거, 활성화, 비활성화 흐름은 Plugin
상태를 변경한 뒤 해당 레지스트리를 새로 고칩니다. 동일한 `plugins/installs.json` 파일은
최상위 `installRecords`에 영구 설치 메타데이터를, `plugins`에 재구축 가능한 매니페스트
메타데이터를 보관합니다. 레지스트리가 없거나, 오래되었거나, 유효하지 않으면
`openclaw plugins registry --refresh`가 Plugin 런타임 모듈을 로드하지 않고 설치 기록,
구성 정책, 매니페스트/패키지 메타데이터에서 매니페스트 뷰를 다시 구축합니다.
`openclaw plugins update <id-or-npm-spec>`는 추적되는 설치에 적용됩니다. dist-tag 또는
정확한 버전이 포함된 npm 패키지 spec을 전달하면 패키지 이름을 추적되는 Plugin 기록으로 다시
해석하고 향후 업데이트를 위해 새 spec을 기록합니다. 버전 없이 패키지 이름을 전달하면 정확히
고정된 설치를 레지스트리의 기본 릴리스 라인으로 되돌립니다. 설치된 npm Plugin이 이미 해석된
버전 및 기록된 아티팩트 식별자와 일치하면 OpenClaw는 다운로드, 재설치, 구성 재작성 없이
업데이트를 건너뜁니다.
`openclaw update`가 베타 채널에서 실행될 때 기본 라인 npm 및 ClawHub
Plugin 기록은 먼저 `@beta`를 시도하고, Plugin 베타 릴리스가 없으면 기본/latest로
폴백합니다. 정확한 버전과 명시적 태그는 고정된 상태로 유지됩니다.

`--pin`은 npm 전용입니다. 마켓플레이스 설치는 npm spec 대신 마켓플레이스 소스 메타데이터를
유지하므로 `--marketplace`와 함께 사용할 수 없습니다.

`--dangerously-force-unsafe-install`은 내장 위험 코드 스캐너의 오탐에 대비한 비상
우회 옵션입니다. Plugin 설치 및 Plugin 업데이트가 내장 `critical` 발견 항목을 지나
계속되도록 허용하지만, Plugin `before_install` 정책 차단이나 스캔 실패 차단은 여전히
우회하지 않습니다. 설치 스캔은 패키지된 테스트 목이 차단되지 않도록 `tests/`,
`__tests__/`, `*.test.*`, `*.spec.*` 같은 일반적인 테스트 파일과 디렉터리를 무시합니다.
선언된 Plugin 런타임 진입점은 이러한 이름 중 하나를 사용하더라도 여전히 스캔됩니다.

이 CLI 플래그는 Plugin 설치/업데이트 흐름에만 적용됩니다. Gateway 기반 Skills
의존성 설치는 대신 일치하는 `dangerouslyForceUnsafeInstall` 요청 재정의를 사용하며,
`openclaw skills install`은 별도의 ClawHub Skills 다운로드/설치 흐름으로 유지됩니다.

ClawHub에 게시한 Plugin이 스캔으로 인해 숨겨지거나 차단된 경우, ClawHub 대시보드를 열거나
`clawhub package rescan <name>`을 실행해 ClawHub가 다시 확인하도록 요청하세요.
`--dangerously-force-unsafe-install`은 자신의 머신에서 이루어지는 설치에만 영향을 줍니다.
ClawHub에 Plugin 재스캔을 요청하거나 차단된 릴리스를 공개 상태로 만들지는 않습니다.

호환 번들은 동일한 Plugin 목록/검사/활성화/비활성화 흐름에 참여합니다. 현재 런타임 지원에는
번들 Skills, Claude 명령 Skills, Claude `settings.json` 기본값, Claude `.lsp.json`
및 매니페스트에서 선언한 `lspServers` 기본값, Cursor 명령 Skills, 호환되는 Codex 훅
디렉터리가 포함됩니다.

`openclaw plugins inspect <id>`는 번들 기반 Plugin에 대해 감지된 번들 기능과 지원되거나
지원되지 않는 MCP 및 LSP 서버 항목도 보고합니다.

마켓플레이스 소스는 `~/.claude/plugins/known_marketplaces.json`의 Claude 알려진
마켓플레이스 이름, 로컬 마켓플레이스 루트 또는 `marketplace.json` 경로, `owner/repo` 같은
GitHub 축약형, GitHub 저장소 URL, 또는 git URL일 수 있습니다. 원격 마켓플레이스의 경우
Plugin 항목은 복제된 마켓플레이스 저장소 안에 머물러야 하며 상대 경로 소스만 사용해야 합니다.

전체 세부 정보는 [`openclaw plugins` CLI 참조](/ko/cli/plugins)를 참고하세요.

## Plugin API 개요

네이티브 Plugin은 `register(api)`를 노출하는 진입 객체를 내보냅니다. 오래된
Plugin은 레거시 별칭으로 여전히 `activate(api)`를 사용할 수 있지만, 새 Plugin은
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

OpenClaw는 Plugin 활성화 중 진입 객체를 로드하고 `register(api)`를 호출합니다.
로더는 오래된 Plugin을 위해 여전히 `activate(api)`로 폴백하지만, 번들 Plugin과 새 외부
Plugin은 `register`를 공개 계약으로 간주해야 합니다.

`api.registrationMode`는 Plugin에 진입점이 로드되는 이유를 알려줍니다.

| 모드            | 의미                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | 런타임 활성화입니다. 도구, 훅, 서비스, 명령, 라우트 및 기타 라이브 부수 효과를 등록합니다.                              |
| `discovery`     | 읽기 전용 기능 탐색입니다. 제공자와 메타데이터를 등록합니다. 신뢰된 Plugin 진입 코드가 로드될 수 있지만 라이브 부수 효과는 건너뜁니다. |
| `setup-only`    | 경량 설정 진입점을 통한 채널 설정 메타데이터 로드입니다.                                                                |
| `setup-runtime` | 런타임 진입점도 필요한 채널 설정 로드입니다.                                                                         |
| `cli-metadata`  | CLI 명령 메타데이터 수집 전용입니다.                                                                                            |

소켓, 데이터베이스, 백그라운드 워커 또는 장기 실행 클라이언트를 여는 Plugin 진입점은 이러한
부수 효과를 `api.registrationMode === "full"`로 보호해야 합니다. 탐색 로드는 활성화 로드와
별도로 캐시되며 실행 중인 Gateway 레지스트리를 대체하지 않습니다. 탐색은 비활성화 방식이지만,
가져오기 없는 방식은 아닙니다. OpenClaw는 스냅샷을 만들기 위해 신뢰된 Plugin 진입점 또는
채널 Plugin 모듈을 평가할 수 있습니다. 모듈 최상위 수준은 가볍고 부수 효과가 없게 유지하고,
네트워크 클라이언트, 서브프로세스, 리스너, 자격 증명 읽기, 서비스 시작은 전체 런타임 경로 뒤로
이동하세요.

일반적인 등록 메서드:

| 메서드                                  | 등록하는 항목           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 모델 제공자(LLM)        |
| `registerChannel`                       | 채팅 채널                |
| `registerTool`                          | 에이전트 도구                  |
| `registerHook` / `on(...)`              | 수명 주기 훅             |
| `registerSpeechProvider`                | 텍스트 음성 변환 / STT        |
| `registerRealtimeTranscriptionProvider` | 스트리밍 STT               |
| `registerRealtimeVoiceProvider`         | 양방향 실시간 음성       |
| `registerMediaUnderstandingProvider`    | 이미지/오디오 분석        |
| `registerImageGenerationProvider`       | 이미지 생성            |
| `registerMusicGenerationProvider`       | 음악 생성            |
| `registerVideoGenerationProvider`       | 비디오 생성            |
| `registerWebFetchProvider`              | 웹 가져오기 / 스크레이프 제공자 |
| `registerWebSearchProvider`             | 웹 검색                  |
| `registerHttpRoute`                     | HTTP 엔드포인트               |
| `registerCommand` / `registerCli`       | CLI 명령                |
| `registerContextEngine`                 | 컨텍스트 엔진              |
| `registerService`                       | 백그라운드 서비스          |

타입 지정 수명 주기 훅의 훅 가드 동작:

- `before_tool_call`: `{ block: true }`는 종결 조건입니다. 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`는 아무 작업도 하지 않으며 이전 차단을 해제하지 않습니다.
- `before_install`: `{ block: true }`는 종결 조건입니다. 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`는 아무 작업도 하지 않으며 이전 차단을 해제하지 않습니다.
- `message_sending`: `{ cancel: true }`는 종결 조건입니다. 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`는 아무 작업도 하지 않으며 이전 취소를 해제하지 않습니다.

네이티브 Codex 앱 서버는 Codex 네이티브 도구 이벤트를 이 훅 표면으로 다시 브리지합니다.
Plugin은 `before_tool_call`을 통해 네이티브 Codex 도구를 차단하고, `after_tool_call`을
통해 결과를 관찰하며, Codex `PermissionRequest` 승인에 참여할 수 있습니다. 브리지는 아직
Codex 네이티브 도구 인수를 재작성하지 않습니다. 정확한 Codex 런타임 지원 경계는
[Codex 하네스 v1 지원 계약](/ko/plugins/codex-harness#v1-support-contract)에 있습니다.

전체 타입 지정 훅 동작은 [SDK 개요](/ko/plugins/sdk-overview#hook-decision-semantics)를 참고하세요.

## 관련

- [Plugin 빌드하기](/ko/plugins/building-plugins) - 나만의 Plugin 만들기
- [Plugin 번들](/ko/plugins/bundles) - Codex/Claude/Cursor 번들 호환성
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 스키마
- [도구 등록하기](/ko/plugins/building-plugins#registering-agent-tools) - Plugin에 에이전트 도구 추가하기
- [Plugin 내부 구조](/ko/plugins/architecture) - 기능 모델 및 로드 파이프라인
- [커뮤니티 Plugin](/ko/plugins/community) - 타사 목록
