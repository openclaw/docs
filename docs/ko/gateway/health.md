---
read_when:
    - 채널 연결 또는 Gateway 상태 진단하기
    - 상태 확인 CLI 명령 및 옵션 이해하기
summary: 상태 확인 명령어 및 Gateway 상태 모니터링
title: 상태 확인
x-i18n:
    generated_at: "2026-07-12T15:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

추측 없이 채널 연결 상태를 확인하는 간단한 가이드입니다.

## 빠른 확인

- `openclaw status` - 로컬 요약: Gateway 연결 가능 여부/모드, 업데이트 안내, 연결된 채널 인증 경과 시간, 세션 및 최근 활동입니다.
- `openclaw status --all` - 전체 로컬 진단입니다(읽기 전용, 색상 표시, 디버깅을 위해 안전하게 붙여넣을 수 있음).
- `openclaw status --deep` - 실행 중인 Gateway에 실시간 프로브(`probe:true`가 설정된 `health`)를 요청하며, 지원되는 경우 계정별 채널 프로브도 포함합니다.
- `openclaw status --usage` - 모델 제공자 사용량/할당량 스냅샷을 표시합니다.
- `openclaw health` - 실행 중인 Gateway에 상태 스냅샷을 요청합니다(WS 전용이며 CLI에서 채널 소켓에 직접 연결하지 않음).
- `openclaw health --verbose`(별칭 `--debug`) - 실시간 상태 프로브를 강제로 실행하고 Gateway 연결 세부 정보를 출력합니다.
- `openclaw health --json` - 머신에서 읽을 수 있는 상태 스냅샷을 출력합니다.
- 에이전트를 호출하지 않고 상태 응답을 받으려면 어느 채널에서든 `/status`를 독립 실행형 채팅 명령으로 전송합니다.
- 로그: `/tmp/openclaw/openclaw-*.log`를 실시간으로 확인하고 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`로 필터링합니다.

Discord 및 기타 채팅 제공자에서 세션 행은 소켓 활성 상태를 의미하지 않습니다.
`openclaw sessions`, Gateway `sessions.list`, 에이전트 `sessions_list` 도구는
저장된 대화 상태를 읽습니다. 제공자는 다시 연결된 후 새 세션 행이 생성되기
전에도 정상 채널 상태를 표시할 수 있습니다. 실시간 연결 확인에는 위의 채널
상태 및 상태 확인 명령을 사용하십시오.

## 심층 진단

- 디스크의 자격 증명: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`(mtime이 최근이어야 함).
- 세션 저장소: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. 개수와 최근 수신자는 `status`를 통해 표시됩니다.
- 다시 연결 절차: 상태 코드 409-515 또는 `loggedOut`이 로그에 나타나면 `openclaw channels logout && openclaw channels login --verbose`를 실행합니다. QR 로그인 절차는 페어링 후 상태 515가 발생하면 한 번 자동으로 다시 시작됩니다.
- 진단은 기본적으로 활성화됩니다(`diagnostics.enabled: false`로 비활성화할 수 있음). 메모리 이벤트는 RSS/힙 바이트 수와 임계값/증가 압박을 기록합니다. 심각한 메모리 압박은 Gateway 로거를 통해 기록되며, `diagnostics.memoryPressureSnapshot: true`가 설정된 경우 OOM 발생 전 안정성 번들(V8 힙 통계, 사용 가능한 경우 Linux cgroup 카운터, 활성 리소스 수, 마스킹된 상대 경로를 기준으로 가장 큰 세션/트랜스크립트 파일)도 기록합니다. 프로세스가 실행 중이지만 포화 상태일 때 활성 상태 경고는 이벤트 루프 지연/사용률, CPU 코어 비율, 활성/대기/대기열 세션 수를 기록합니다. 과대 페이로드 이벤트는 거부/잘림/청크 분할된 항목과 크기 및 제한을 기록하지만 메시지 텍스트, 첨부 파일 내용, Webhook 본문, 원시 요청/응답 본문, 토큰, 쿠키 또는 비밀 값은 절대 기록하지 않습니다.
- 동일한 Heartbeat가 제한된 안정성 레코더를 구동합니다: `openclaw gateway stability`(또는 `diagnostics.stability` Gateway RPC). 치명적인 Gateway 종료, 종료 시간 초과, 재시작 시 시작 실패, 그리고 `diagnostics.memoryPressureSnapshot: true`인 경우 심각한 메모리 압박이 발생하면 최신 스냅샷이 `~/.openclaw/logs/stability/`에 영구 저장됩니다. `openclaw gateway stability --bundle latest`로 최신 번들을 검사하십시오.
- 버그를 보고하려면 `openclaw gateway diagnostics export`를 실행하고 생성된 zip을 첨부하십시오. zip에는 Markdown 요약, 최신 안정성 번들, 정제된 로그 메타데이터, 정제된 Gateway 상태/상태 확인 스냅샷, 구성 형태가 포함됩니다. 채팅 텍스트, Webhook 본문, 도구 출력, 자격 증명, 쿠키, 계정/메시지 식별자, 비밀 값은 생략되거나 마스킹됩니다. [진단 내보내기](/ko/gateway/diagnostics)를 참조하십시오.

## 상태 모니터 구성

- `gateway.channelHealthCheckMinutes`: Gateway가 채널 상태를 확인하는 빈도입니다. 기본값: `5`. 상태 모니터의 재시작을 전역으로 비활성화하려면 `0`으로 설정합니다.
- `gateway.channelStaleEventThresholdMinutes`: 연결된 채널이 유휴 상태로 유지될 수 있는 시간이며, 이 시간이 지나면 상태 모니터가 오래된 상태로 간주하고 채널을 재시작합니다. 기본값: `30`. 이 값을 `gateway.channelHealthCheckMinutes`보다 크거나 같게 유지하십시오.
- `gateway.channelMaxRestartsPerHour`: 채널/계정별 상태 모니터 재시작의 최근 1시간 상한입니다. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터링을 활성화한 상태에서 특정 채널의 상태 모니터 재시작을 비활성화합니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 채널 수준 설정보다 우선하는 다중 계정 재정의입니다.
- 이러한 채널별 재정의는 현재 이를 제공하는 기본 제공 채널인 Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram, WhatsApp에 적용됩니다.

## 가동 시간 모니터링

외부 가동 시간 모니터링 서비스는 `/v1/chat/completions`가 아니라 전용 `/health` 엔드포인트를 사용해야 합니다.

- **사용해야 함:** `GET /health` - 즉시 응답하고, 세션을 생성하지 않으며, LLM 호출 없이 `{"ok":true,"status":"live"}`를 반환합니다.
- **사용하지 말아야 함:** 상태 확인에 `/v1/chat/completions` 사용 - 각 요청은 스킬 스냅샷, 컨텍스트 구성, LLM 호출이 포함된 전체 에이전트 세션을 생성합니다.

`x-openclaw-session-key` 헤더 또는 `user` 필드를 제공하지 않으면 `/v1/chat/completions`는 요청마다 새로운 무작위 세션을 생성합니다. 15분마다 핑을 보내는 모니터링 서비스는 하루에 약 96개의 세션을 생성하며, 각 세션은 4-22KB를 소비합니다. 시간이 지나면 세션 저장소가 비대해지고 컨텍스트 창 오버플로가 발생할 수 있습니다.

### 모니터링 서비스 설정 예시

- **BetterStack:** 상태 확인 URL을 `https://<your-gateway-host>:<port>/health`로 설정합니다.
- **UptimeRobot:** URL이 `https://<your-gateway-host>:<port>/health`인 새 HTTP 모니터를 추가합니다.
- **일반:** Gateway가 정상일 때 `/health`에 대한 모든 HTTP GET 요청은 `{"ok":true}`와 함께 200을 반환합니다.

## 문제 발생 시

- `logged out` 또는 상태 409-515 -> `openclaw channels logout`을 실행한 다음 `openclaw channels login`을 실행하여 다시 연결합니다.
- Gateway에 연결할 수 없음 -> `openclaw gateway --port 18789`로 시작합니다(포트가 사용 중이면 `--force` 사용).
- 수신 메시지가 없음 -> 연결된 휴대전화가 온라인 상태이고 발신자가 허용되어 있는지 확인합니다(`channels.whatsapp.allowFrom`). 그룹 채팅의 경우 허용 목록 및 멘션 규칙이 일치하는지 확인합니다(`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## 전용 "health" 명령

`openclaw health`는 실행 중인 Gateway에 상태 스냅샷을 요청합니다(CLI에서 채널
소켓에 직접 연결하지 않음). 기본적으로 최신 캐시된 Gateway 스냅샷을 반환하며,
Gateway는 백그라운드에서 해당 캐시를 새로 고칩니다. `--verbose`를 사용하면 대신
실시간 프로브를 강제로 실행합니다. 이 명령은 사용 가능한 경우 연결된 자격 증명/인증
경과 시간, 채널별 프로브 요약, 세션 저장소 요약, 프로브 소요 시간을 보고합니다.
Gateway에 연결할 수 없거나 프로브가 실패하거나 시간 초과되면 0이 아닌 코드로 종료합니다.

옵션:

- `--json`: 머신에서 읽을 수 있는 JSON 출력
- `--timeout <ms>`: 기본 10s 프로브 시간 초과 재정의
- `--verbose`: 실시간 프로브를 강제로 실행하고 Gateway 연결 세부 정보 출력
- `--debug`: `--verbose`의 별칭

상태 스냅샷에는 `ok`(불리언), `ts`(타임스탬프), `durationMs`(프로브 시간), 채널별 상태, 에이전트 가용성, 세션 저장소 요약이 포함됩니다.

## 관련 항목

- [Gateway 운영 가이드](/ko/gateway)
- [진단 내보내기](/ko/gateway/diagnostics)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
