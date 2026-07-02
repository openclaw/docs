---
read_when:
    - 올바른 `openclaw` 하위 명령 찾기
    - 전역 플래그 또는 출력 스타일링 규칙 조회
summary: 'OpenClaw CLI 색인: 명령 목록, 전역 플래그, 명령별 페이지 링크'
title: CLI 참조
x-i18n:
    generated_at: "2026-07-02T00:48:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627ccd257834e9bc8cacf2f2ac4600530ff4aa1132d2c34fcb0922b29a1facce
    source_path: cli/index.md
    workflow: 16
---

`openclaw`는 기본 CLI 진입점입니다. 각 핵심 명령에는 전용 참조 페이지가 있거나 별칭으로 연결되는 명령과 함께 문서화되어 있습니다. 이 색인은 CLI 전반에 적용되는 명령, 전역 플래그, 출력 스타일 규칙을 나열합니다.

의도에 맞게 설정 명령을 사용하세요.

- `openclaw setup` 및 `openclaw onboard`는 Gateway, 모델 인증, 작업 영역, 채널, Skills, 상태 점검을 위한 전체 안내식 최초 실행 경로를 실행합니다.
- `openclaw setup --baseline`은 안내식 온보딩 흐름을 거치지 않고 기준 구성과 작업 영역을 생성합니다.
- `openclaw configure`는 모델 인증, Gateway, 채널, Plugin 또는 Skills 같은 기존 설정의 특정 부분을 변경합니다.
- 기준 구성이 존재한 뒤 `openclaw channels add`로 채널 계정을 구성합니다. 안내식 채널 설정에는 플래그 없이 실행하고, 스크립트에는 채널별 플래그를 함께 사용하세요.

## 명령 페이지

| 영역                 | 명령                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 설정 및 온보딩 | [`crestodian`](/ko/cli/crestodian) · [`setup`](/ko/cli/setup) · [`onboard`](/ko/cli/onboard) · [`configure`](/ko/cli/configure) · [`config`](/ko/cli/config) · [`completion`](/ko/cli/completion) · [`doctor`](/ko/cli/doctor) · [`dashboard`](/ko/cli/dashboard) |
| 재설정 및 제거  | [`backup`](/ko/cli/backup) · [`reset`](/ko/cli/reset) · [`uninstall`](/ko/cli/uninstall) · [`update`](/ko/cli/update)                                                                                                                                 |
| 메시징 및 에이전트 | [`message`](/ko/cli/message) · [`agent`](/ko/cli/agent) · [`agents`](/ko/cli/agents) · [`attach`](/cli/attach) · [`acp`](/ko/cli/acp) · [`mcp`](/ko/cli/mcp)                                                                                             |
| 상태 및 세션  | [`status`](/ko/cli/status) · [`health`](/ko/cli/health) · [`sessions`](/ko/cli/sessions)                                                                                                                                                           |
| Gateway 및 로그     | [`gateway`](/ko/cli/gateway) · [`logs`](/ko/cli/logs) · [`system`](/ko/cli/system)                                                                                                                                                                 |
| 모델 및 추론 | [`models`](/ko/cli/models) · [`infer`](/ko/cli/infer) · `capability` ([`infer`](/ko/cli/infer)의 별칭) · [`memory`](/ko/cli/memory) · [`commitments`](/ko/cli/commitments) · [`wiki`](/ko/cli/wiki)                                                      |
| 네트워크 및 노드    | [`directory`](/ko/cli/directory) · [`nodes`](/ko/cli/nodes) · [`devices`](/ko/cli/devices) · [`node`](/ko/cli/node)                                                                                                                                   |
| 런타임 및 샌드박스  | [`approvals`](/ko/cli/approvals) · `exec-policy` ([`approvals`](/ko/cli/approvals) 참조) · [`sandbox`](/ko/cli/sandbox) · [`tui`](/ko/cli/tui) · `chat`/`terminal` ([`tui --local`](/ko/cli/tui)의 별칭) · [`browser`](/ko/cli/browser)                 |
| 자동화           | [`cron`](/ko/cli/cron) · [`tasks`](/ko/cli/tasks) · [`hooks`](/ko/cli/hooks) · [`webhooks`](/ko/cli/webhooks) · [`transcripts`](/ko/cli/transcripts)                                                                                                     |
| 검색 및 문서   | [`dns`](/ko/cli/dns) · [`docs`](/ko/cli/docs)                                                                                                                                                                                                   |
| 페어링 및 채널 | [`pairing`](/ko/cli/pairing) · [`qr`](/ko/cli/qr) · [`channels`](/ko/cli/channels)                                                                                                                                                                 |
| 보안 및 Plugin | [`security`](/ko/cli/security) · [`secrets`](/ko/cli/secrets) · [`skills`](/ko/cli/skills) · [`plugins`](/ko/cli/plugins) · [`proxy`](/ko/cli/proxy)                                                                                                     |
| 레거시 별칭       | [`daemon`](/ko/cli/daemon) (Gateway 서비스) · [`clawbot`](/ko/cli/clawbot) (네임스페이스)                                                                                                                                                         |
| Plugin(선택 사항)   | [`path`](/ko/cli/path) · [`policy`](/ko/cli/policy) · [`voicecall`](/ko/cli/voicecall) · [`workboard`](/ko/cli/workboard) (설치된 경우)                                                                                                              |

## 전역 플래그

| 플래그                    | 목적                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | 상태를 `~/.openclaw-dev` 아래로 격리하고 기본 포트를 이동합니다         |
| `--profile <name>`      | 상태를 `~/.openclaw-<name>` 아래로 격리합니다                              |
| `--container <name>`    | 실행 대상이 될 이름 있는 컨테이너를 지정합니다                                |
| `--no-color`            | ANSI 색상을 비활성화합니다(`NO_COLOR=1`도 적용됨)                  |
| `--update`              | [`openclaw update`](/ko/cli/update)의 단축형입니다(소스 설치에만 해당) |
| `-V`, `--version`, `-v` | 버전을 출력하고 종료합니다                                                |

## 출력 모드

- ANSI 색상과 진행 표시기는 TTY 세션에서만 렌더링됩니다.
- OSC-8 하이퍼링크는 지원되는 곳에서 클릭 가능한 링크로 렌더링됩니다. 그렇지 않으면 CLI는 일반 URL로 대체합니다.
- `--json`(및 지원되는 경우 `--plain`)은 깔끔한 출력을 위해 스타일링을 비활성화합니다.
- 오래 실행되는 명령은 진행 표시기를 표시합니다(지원되는 경우 OSC 9;4).

팔레트의 기준 소스: `src/terminal/palette.ts`.

## 명령 트리

<Accordion title="전체 명령 트리">

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
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
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
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
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
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
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

Plugin은 [`openclaw workboard`](/ko/cli/workboard) 또는 `openclaw voicecall` 같은 추가 최상위 명령을 더할 수 있습니다.

</Accordion>

## 채팅 슬래시 명령

채팅 메시지는 `/...` 명령을 지원합니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

주요 항목:

- `/status` — 빠른 진단.
- `/trace` — 세션 범위 Plugin 추적/디버그 라인.
- `/config` — 영구 구성 변경.
- `/debug` — 런타임 전용 구성 재정의(메모리, 디스크 아님, `commands.debug: true` 필요).

## 사용량 추적

OAuth/API 자격 증명을 사용할 수 있으면 `openclaw status --usage`와 Control UI가 제공자 사용량/할당량을 표시합니다. 데이터는 제공자 사용량 엔드포인트에서 직접 가져오며 `X% left`로 정규화됩니다. 현재 사용량 창이 있는 제공자: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi, z.ai.

자세한 내용은 [사용량 추적](/ko/concepts/usage-tracking)을 참조하세요.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [구성](/ko/gateway/configuration)
- [환경](/ko/help/environment)
