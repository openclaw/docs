---
read_when:
    - 문서의 전체 구조를 완전히 파악하고 싶습니다
summary: 모든 OpenClaw 문서로 연결되는 허브
title: 문서 허브
x-i18n:
    generated_at: "2026-05-12T00:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4675773105bbff55e1f38c8449d688dcefc6ad70d9f5e572193f1e0c638e243
    source_path: start/hubs.md
    workflow: 16
---

<Note>
OpenClaw를 처음 사용하는 경우 [시작하기](/ko/start/getting-started)부터 시작하세요.
</Note>

왼쪽 탐색 메뉴에 표시되지 않는 심층 설명과 참조 문서를 포함해 모든 페이지를 찾으려면 이 허브들을 사용하세요.

## 여기서 시작

- [색인](/ko)
- [시작하기](/ko/start/getting-started)
- [온보딩](/ko/start/onboarding)
- [온보딩 (CLI)](/ko/start/wizard)
- [설정](/ko/start/setup)
- [대시보드 (로컬 Gateway)](http://127.0.0.1:18789/)
- [도움말](/ko/help)
- [문서 디렉터리](/ko/start/docs-directory)
- [구성](/ko/gateway/configuration)
- [구성 예시](/ko/gateway/configuration-examples)
- [OpenClaw 어시스턴트](/ko/start/openclaw)
- [쇼케이스](/ko/start/showcase)
- [Lore](/ko/start/lore)

## 설치 + 업데이트

- [Docker](/ko/install/docker)
- [Nix](/ko/install/nix)
- [업데이트 / 롤백](/ko/install/updating)
- [Bun 워크플로(실험적)](/ko/install/bun)

## 핵심 개념

- [아키텍처](/ko/concepts/architecture)
- [기능](/ko/concepts/features)
- [네트워크 허브](/ko/network)
- [에이전트 런타임](/ko/concepts/agent)
- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [메모리](/ko/concepts/memory)
- [에이전트 루프](/ko/concepts/agent-loop)
- [스트리밍 + 청킹](/ko/concepts/streaming)
- [멀티 에이전트 라우팅](/ko/concepts/multi-agent)
- [Compaction](/ko/concepts/compaction)
- [세션](/ko/concepts/session)
- [세션 정리](/ko/concepts/session-pruning)
- [세션 도구](/ko/concepts/session-tool)
- [큐](/ko/concepts/queue)
- [슬래시 명령](/ko/tools/slash-commands)
- [RPC 어댑터](/ko/reference/rpc)
- [TypeBox 스키마](/ko/concepts/typebox)
- [시간대 처리](/ko/concepts/timezone)
- [프레즌스](/ko/concepts/presence)
- [탐색 + 전송](/ko/gateway/discovery)
- [Bonjour](/ko/gateway/bonjour)
- [채널 라우팅](/ko/channels/channel-routing)
- [그룹](/ko/channels/groups)
- [그룹 메시지](/ko/channels/group-messages)
- [모델 장애 조치](/ko/concepts/model-failover)
- [OAuth](/ko/concepts/oauth)

## 제공자 + 인그레스

- [채팅 채널 허브](/ko/channels)
- [모델 제공자 허브](/ko/providers/models)
- [WhatsApp](/ko/channels/whatsapp)
- [Telegram](/ko/channels/telegram)
- [Slack](/ko/channels/slack)
- [Discord](/ko/channels/discord)
- [Mattermost](/ko/channels/mattermost)
- [Signal](/ko/channels/signal)
- [QQ Bot](/ko/channels/qqbot)
- [iMessage](/ko/channels/imessage)
- [위치 파싱](/ko/channels/location)
- [WebChat](/ko/web/webchat)
- [Webhooks](/ko/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/ko/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + 운영

- [Gateway 런북](/ko/gateway)
- [네트워크 모델](/ko/network#core-model)
- [Gateway 페어링](/ko/gateway/pairing)
- [Gateway 잠금](/ko/gateway/gateway-lock)
- [백그라운드 프로세스](/ko/gateway/background-process)
- [상태](/ko/gateway/health)
- [Heartbeat](/ko/gateway/heartbeat)
- [Doctor](/ko/gateway/doctor)
- [로깅](/ko/gateway/logging)
- [샌드박싱](/ko/gateway/sandboxing)
- [대시보드](/ko/web/dashboard)
- [제어 UI](/ko/web/control-ui)
- [원격 액세스](/ko/gateway/remote)
- [원격 Gateway README](/ko/gateway/remote-gateway-readme)
- [Tailscale](/ko/gateway/tailscale)
- [보안](/ko/gateway/security)
- [문제 해결](/ko/gateway/troubleshooting)

## 도구 + 자동화

- [도구 표면](/ko/tools)
- [OpenProse](/ko/prose)
- [CLI 참조](/ko/cli)
- [Exec 도구](/ko/tools/exec)
- [PDF 도구](/ko/tools/pdf)
- [권한 상승 모드](/ko/tools/elevated)
- [Cron 작업](/ko/automation/cron-jobs)
- [자동화](/ko/automation)
- [사고 + 상세 출력](/ko/tools/thinking)
- [모델](/ko/concepts/models)
- [하위 에이전트](/ko/tools/subagents)
- [에이전트 전송 CLI](/ko/tools/agent-send)
- [터미널 UI](/ko/web/tui)
- [브라우저 제어](/ko/tools/browser)
- [브라우저 (Linux 문제 해결)](/ko/tools/browser-linux-troubleshooting)
- [투표](/ko/cli/message)

## Node, 미디어, 음성

- [Node 개요](/ko/nodes)
- [카메라](/ko/nodes/camera)
- [이미지](/ko/nodes/images)
- [오디오](/ko/nodes/audio)
- [위치 명령](/ko/nodes/location-command)
- [음성 깨우기](/ko/nodes/voicewake)
- [대화 모드](/ko/nodes/talk)

## 플랫폼

- [플랫폼 개요](/ko/platforms)
- [macOS](/ko/platforms/macos)
- [iOS](/ko/platforms/ios)
- [Android](/ko/platforms/android)
- [Windows (WSL2)](/ko/platforms/windows)
- [Linux](/ko/platforms/linux)
- [웹 표면](/ko/web)

## macOS 컴패니언 앱 (고급)

- [macOS 개발 설정](/ko/platforms/mac/dev-setup)
- [macOS 메뉴 막대](/ko/platforms/mac/menu-bar)
- [macOS 음성 깨우기](/ko/platforms/mac/voicewake)
- [macOS 음성 오버레이](/ko/platforms/mac/voice-overlay)
- [macOS WebChat](/ko/platforms/mac/webchat)
- [macOS Canvas](/ko/platforms/mac/canvas)
- [macOS 자식 프로세스](/ko/platforms/mac/child-process)
- [macOS 상태](/ko/platforms/mac/health)
- [macOS 아이콘](/ko/platforms/mac/icon)
- [macOS 로깅](/ko/platforms/mac/logging)
- [macOS 권한](/ko/platforms/mac/permissions)
- [macOS 원격](/ko/platforms/mac/remote)
- [macOS 서명](/ko/platforms/mac/signing)
- [macOS Gateway (launchd)](/ko/platforms/mac/bundled-gateway)
- [macOS XPC](/ko/platforms/mac/xpc)
- [macOS Skills](/ko/platforms/mac/skills)
- [macOS Peekaboo](/ko/platforms/mac/peekaboo)

## Plugin

- [Plugin 개요](/ko/tools/plugin)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin 훅](/ko/plugins/hooks)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [에이전트 도구](/ko/plugins/building-plugins#registering-agent-tools)
- [Plugin 번들](/ko/plugins/bundles)
- [ClawHub](/ko/clawhub)
- [기능 쿡북](/ko/plugins/adding-capabilities)
- [음성 통화 Plugin](/ko/plugins/voice-call)
- [Zalo 사용자 Plugin](/ko/plugins/zalouser)

## 워크스페이스 + 템플릿

- [Skills](/ko/tools/skills)
- [ClawHub](/ko/clawhub)
- [Skills 구성](/ko/tools/skills-config)
- [기본 AGENTS](/ko/reference/AGENTS.default)
- [템플릿: AGENTS](/ko/reference/templates/AGENTS)
- [템플릿: BOOTSTRAP](/ko/reference/templates/BOOTSTRAP)
- [템플릿: HEARTBEAT](/ko/reference/templates/HEARTBEAT)
- [템플릿: IDENTITY](/ko/reference/templates/IDENTITY)
- [템플릿: SOUL](/ko/reference/templates/SOUL)
- [템플릿: TOOLS](/ko/reference/templates/TOOLS)
- [템플릿: USER](/ko/reference/templates/USER)

## 프로젝트

- [크레딧](/ko/reference/credits)

## 테스트 + 릴리스

- [테스트](/ko/reference/test)
- [릴리스 정책](/ko/reference/RELEASING)
- [기기 모델](/ko/reference/device-models)

## 관련 항목

- [시작하기](/ko/start/getting-started)
