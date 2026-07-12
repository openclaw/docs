---
read_when:
    - 적절한 `openclaw` 하위 명령 찾기
    - 전역 플래그 또는 출력 스타일 지정 규칙 조회하기
summary: 'OpenClaw CLI 색인: 명령 목록, 전역 플래그 및 명령별 페이지 링크'
title: CLI 참고 자료
x-i18n:
    generated_at: "2026-07-12T00:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw`은 기본 CLI 진입점입니다. 각 핵심 명령에는 전용
참조 페이지가 있거나 별칭 대상 명령과 함께 문서화되어 있습니다. 이 색인에는
CLI 전반에 적용되는 명령, 전역 플래그 및 출력 스타일 규칙이 나열되어 있습니다.

목적별 설정 명령:

- `openclaw setup`과 `openclaw onboard`는 먼저 추론을 확인한 다음 Gateway, 작업 공간, 채널, Skills 및 상태 설정을 위해 Crestodian을 시작합니다.
- `openclaw setup --baseline`은 안내형 온보딩 흐름을 거치지 않고 기준 구성과 작업 공간을 생성합니다.
- `openclaw configure`는 기존 설정의 특정 부분인 모델 인증, Gateway, 채널, Plugin 또는 Skills를 변경합니다.
- `openclaw channels add`는 기준 구성이 존재한 후 채널 계정을 구성합니다. 안내형 설정에는 플래그 없이 실행하고, 스크립트에서는 채널별 플래그와 함께 실행합니다.

## 명령 페이지

| 영역                         | 명령                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 설정 및 온보딩         | [`crestodian`](/ko/cli/crestodian) · [`setup`](/ko/cli/setup) · [`onboard`](/ko/cli/onboard) · [`configure`](/ko/cli/configure) · [`config`](/ko/cli/config) · [`completion`](/ko/cli/completion) · [`doctor`](/ko/cli/doctor) · [`dashboard`](/ko/cli/dashboard) |
| 초기화, 백업 및 마이그레이션 | [`backup`](/ko/cli/backup) · [`migrate`](/ko/cli/migrate) · [`reset`](/ko/cli/reset) · [`uninstall`](/ko/cli/uninstall) · [`update`](/ko/cli/update)                                                                                                     |
| 메시징 및 에이전트         | [`message`](/ko/cli/message) · [`agent`](/ko/cli/agent) · [`agents`](/ko/cli/agents) · [`attach`](/ko/cli/attach) · [`acp`](/ko/cli/acp) · [`mcp`](/ko/cli/mcp)                                                                                             |
| 상태 및 세션          | [`status`](/ko/cli/status) · [`health`](/ko/cli/health) · [`sessions`](/ko/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway 및 로그             | [`gateway`](/ko/cli/gateway) · [`logs`](/ko/cli/logs) · [`system`](/ko/cli/system)                                                                                                                                                                 |
| 모델 및 추론         | [`models`](/ko/cli/models) · [`promos`](/ko/cli/promos) · [`infer`](/ko/cli/infer) · `capability` ([`infer`](/ko/cli/infer)의 별칭) · [`memory`](/ko/cli/memory) · [`commitments`](/ko/cli/commitments) · [`wiki`](/ko/cli/wiki)                            |
| 네트워크 및 Node            | [`directory`](/ko/cli/directory) · [`nodes`](/ko/cli/nodes) · [`devices`](/ko/cli/devices) · [`node`](/ko/cli/node)                                                                                                                                   |
| 런타임 및 샌드박스          | [`approvals`](/ko/cli/approvals) · `exec-policy` ([`approvals`](/ko/cli/approvals) 참조) · [`sandbox`](/ko/cli/sandbox) · [`tui`](/ko/cli/tui) · `chat`/`terminal` ([`tui --local`](/ko/cli/tui)의 별칭) · [`browser`](/ko/cli/browser)                 |
| 자동화                   | [`cron`](/ko/cli/cron) · [`tasks`](/ko/cli/tasks) · [`hooks`](/ko/cli/hooks) · [`webhooks`](/ko/cli/webhooks) · [`transcripts`](/ko/cli/transcripts)                                                                                                     |
| 검색 및 문서           | [`dns`](/ko/cli/dns) · [`docs`](/ko/cli/docs)                                                                                                                                                                                                   |
| 페어링 및 채널         | [`pairing`](/ko/cli/pairing) · [`qr`](/ko/cli/qr) · [`channels`](/ko/cli/channels)                                                                                                                                                                 |
| 보안 및 Plugin         | [`security`](/ko/cli/security) · [`secrets`](/ko/cli/secrets) · [`skills`](/ko/cli/skills) · [`plugins`](/ko/cli/plugins) · [`proxy`](/ko/cli/proxy)                                                                                                     |
| 레거시 별칭               | [`daemon`](/ko/cli/daemon) (Gateway 서비스) · [`clawbot`](/ko/cli/clawbot) (네임스페이스)                                                                                                                                                         |
| Plugin(선택 사항)           | [`path`](/ko/cli/path) · [`policy`](/ko/cli/policy) · [`voicecall`](/ko/cli/voicecall) · [`workboard`](/ko/cli/workboard) (설치된 경우)                                                                                                              |

## 전역 플래그

| 플래그                    | 목적                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | 상태를 `~/.openclaw-dev` 아래에 격리하고, 기본 Gateway 포트를 19001로 설정하며 파생 포트를 이동              |
| `--profile <name>`      | 상태를 `~/.openclaw-<name>` 아래에 격리 (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | `<name>`이라는 실행 중인 Podman/Docker 컨테이너 내부에서 CLI 실행(기본값: 환경 변수 `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | 파일 및 콘솔 출력의 전역 로그 수준 재정의                                                 |
| `--no-color`            | ANSI 색상 비활성화(`NO_COLOR=1`도 적용됨)                                                    |
| `--update`              | [`openclaw update`](/ko/cli/update)의 축약형. 소스 체크아웃과 패키지 설치 모두에서 작동    |
| `-V`, `--version`, `-v` | 버전을 출력하고 종료                                                                                  |

## 출력 모드

- ANSI 색상과 진행률 표시기는 TTY 세션에서만 렌더링됩니다.
- OSC-8 하이퍼링크는 지원되는 환경에서 클릭 가능한 링크로 렌더링되며, 그렇지 않으면
  CLI가 일반 URL로 대체합니다.
- `--json`(지원되는 경우 `--plain`도 포함)은 깔끔한 출력을 위해 스타일을 비활성화합니다.
- 장시간 실행되는 명령은 진행률 표시기를 표시합니다(지원되는 경우 OSC 9;4).

## 색상 팔레트

OpenClaw은 CLI 출력에 바닷가재 색상 팔레트를 사용합니다.

| 토큰          | 16진수       | 용도                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | 제목, 레이블, 기본 강조 |
| `accentBright` | `#FF7A3D` | 명령 이름, 강조              |
| `accentDim`    | `#D14A22` | 보조 강조 텍스트             |
| `info`         | `#FF8A5B` | 정보 값                 |
| `success`      | `#2FBF71` | 성공 상태                       |
| `warn`         | `#FFB020` | 경고, 옵션 플래그, 대체 동작    |
| `error`        | `#E23D2D` | 오류, 실패                     |
| `muted`        | `#8B7F77` | 약한 강조, 메타데이터                |

팔레트의 기준 소스: `packages/terminal-core/src/palette.ts`.

## 명령 트리

<Accordion title="전체 명령 트리">

이 맵은 핵심 명령과 주요 하위 명령을 다룹니다. Plugin이 추가한
하위 명령(예: `skills`, `plugins`, `wiki` 아래의 명령)은
독립적으로 변경됩니다. 신뢰할 수 있는 최신 목록은 `<command> --help`를 실행하여 확인하세요.

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  migrate
    list
    plan <provider>
    apply <provider>
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
    repair
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    verify
    workshop list|inspect|propose-create|propose-update|revise|apply|reject|quarantine
    list
    info
    check
  plugins
    list
    search
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    build
    validate
    init
    registry
    marketplace list|entries|refresh
  workboard
    list
    create
    show
    dispatch
  memory
    status
    index
    search
  transcripts
    list
    show
    path
  path
    resolve
    find
    set
    validate
    emit
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    compile
    lint
    ingest
    okf import
    search
    get
    apply synthesis|metadata
    bridge import
    unsafe-local import
    chatgpt import|rollback
    obsidian status|search|open|command|daily
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  attach
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  audit
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    stability
    diagnostics export
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth list|add|login|setup-token|paste-token|paste-api-key|login-github-copilot
    auth order get|set|clear
  promos
    list
    claim <slug>
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|personas|providers|status|enable|disable|set-provider|set-persona
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    get
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  exec-policy
    show
    preset
    set
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

Plugin은 [`openclaw workboard`](/ko/cli/workboard) 또는 `openclaw voicecall`과 같은 추가 최상위 명령을 추가할 수 있습니다.

</Accordion>

## 채팅 슬래시 명령

채팅 메시지는 `/...` 명령을 지원합니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

주요 명령:

- `/status` - 빠른 진단.
- `/trace` - 세션 범위의 Plugin 추적/디버그 줄.
- `/config` - 영구 저장되는 구성 변경.
- `/debug` - 런타임에만 적용되는 구성 재정의(메모리에만 저장되고 디스크에는 저장되지 않음, `commands.debug: true` 필요).

## 사용량 추적

OAuth/API 자격 증명을 사용할 수 있는 경우 `openclaw status --usage`와 제어 UI에 제공자 사용량/할당량이 표시됩니다. 데이터는 제공자의 사용량 엔드포인트에서 직접 가져오며 `X% left` 형식으로 정규화됩니다. 현재 사용량 기간을 지원하는 제공자는 Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex, Xiaomi 및 z.ai입니다.

자세한 내용은 [사용량 추적](/ko/concepts/usage-tracking)을 참조하세요.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [구성](/ko/gateway/configuration)
- [환경](/ko/help/environment)
