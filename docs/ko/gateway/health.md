---
read_when:
    - 채널 연결 상태 또는 Gateway 상태 진단
    - 상태 점검 CLI 명령 및 옵션 이해하기
summary: 상태 확인 명령 및 Gateway 상태 모니터링
title: 상태 확인
x-i18n:
    generated_at: "2026-05-02T20:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

추측 없이 채널 연결성을 확인하는 짧은 가이드입니다.

## 빠른 확인

- `openclaw status` — 로컬 요약: gateway 도달 가능 여부/모드, 업데이트 힌트, 연결된 채널 인증 경과 시간, 세션 + 최근 활동.
- `openclaw status --all` — 전체 로컬 진단(읽기 전용, 컬러, 디버깅용으로 붙여넣어도 안전함).
- `openclaw status --deep` — 실행 중인 gateway에 실시간 상태 프로브(`probe:true`가 포함된 `health`)를 요청하며, 지원되는 경우 계정별 채널 프로브도 포함합니다.
- `openclaw health` — 실행 중인 gateway에 상태 스냅샷을 요청합니다(WS 전용, CLI에서 직접 채널 소켓을 열지 않음).
- `openclaw health --verbose` — 실시간 상태 프로브를 강제하고 gateway 연결 세부 정보를 출력합니다.
- `openclaw health --json` — 기계가 읽을 수 있는 상태 스냅샷 출력입니다.
- 에이전트를 호출하지 않고 상태 응답을 받으려면 WhatsApp/WebChat에서 `/status`를 독립 메시지로 보내세요.
- 로그: `/tmp/openclaw/openclaw-*.log`를 tail하고 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`로 필터링하세요.

Discord 및 기타 채팅 제공자의 경우, 세션 행은 소켓 활성 상태가 아닙니다.
`openclaw sessions`, Gateway `sessions.list`, 에이전트 `sessions_list` 도구는
저장된 대화 상태를 읽습니다. 제공자는 새 세션 행이 생성되기 전에 다시 연결되어
정상 채널 상태를 표시할 수 있습니다. 실시간 연결 확인에는 위의 채널 상태 및
상태 명령을 사용하세요.

## 심층 진단

- 디스크의 인증 정보: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`(mtime은 최근이어야 함).
- 세션 저장소: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`(경로는 설정에서 재정의할 수 있음). 개수와 최근 수신자는 `status`를 통해 표시됩니다.
- 다시 연결 절차: 상태 코드 409–515 또는 로그에 `loggedOut`이 나타나면 `openclaw channels logout && openclaw channels login --verbose`를 실행하세요. (참고: QR 로그인 흐름은 페어링 후 상태 515에 대해 한 번 자동으로 다시 시작됩니다.)
- 진단은 기본적으로 활성화되어 있습니다. `diagnostics.enabled: false`가 설정되지 않는 한 gateway는 운영 사실을 기록합니다. 메모리 이벤트는 RSS/heap 바이트 수, 임계값 압박, 증가 압박을 기록합니다. 활성 상태 경고는 프로세스가 실행 중이지만 포화 상태일 때 이벤트 루프 지연, 이벤트 루프 사용률, CPU 코어 비율, 활성/대기/대기열 세션 수를 기록합니다. 과대 페이로드 이벤트는 가능한 경우 크기와 제한과 함께 무엇이 거부, 잘림 또는 청크 처리되었는지 기록합니다. 메시지 텍스트, 첨부 파일 내용, Webhook 본문, 원시 요청 또는 응답 본문, 토큰, 쿠키, 비밀 값은 기록하지 않습니다. 동일한 Heartbeat가 제한된 안정성 레코더를 시작하며, 이는 `openclaw gateway stability` 또는 `diagnostics.stability` Gateway RPC를 통해 사용할 수 있습니다. 치명적인 Gateway 종료, 종료 시간 초과, 다시 시작 시동 실패는 이벤트가 있을 때 최신 레코더 스냅샷을 `~/.openclaw/logs/stability/` 아래에 보존합니다. 최신 저장 번들은 `openclaw gateway stability --bundle latest`로 검사하세요.
- 버그 보고서의 경우 `openclaw gateway diagnostics export`를 실행하고 생성된 zip을 첨부하세요. 내보내기는 Markdown 요약, 최신 안정성 번들, 정리된 로그 메타데이터, 정리된 Gateway 상태/상태 스냅샷, 설정 형태를 결합합니다. 공유용으로 설계되어 있습니다. 채팅 텍스트, Webhook 본문, 도구 출력, 자격 증명, 쿠키, 계정/메시지 식별자, 비밀 값은 생략되거나 수정됩니다. [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

## 상태 모니터 설정

- `gateway.channelHealthCheckMinutes`: gateway가 채널 상태를 확인하는 빈도입니다. 기본값: `5`. 상태 모니터 재시작을 전역으로 비활성화하려면 `0`으로 설정하세요.
- `gateway.channelStaleEventThresholdMinutes`: 연결된 채널이 유휴 상태로 유지될 수 있는 시간이며, 이 시간을 넘기면 상태 모니터가 오래된 것으로 간주하고 재시작합니다. 기본값: `30`. 이 값은 `gateway.channelHealthCheckMinutes`보다 크거나 같게 유지하세요.
- `gateway.channelMaxRestartsPerHour`: 채널/계정별 상태 모니터 재시작에 대한 이동식 1시간 한도입니다. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터링은 활성화한 채 특정 채널의 상태 모니터 재시작을 비활성화합니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 채널 수준 설정보다 우선하는 다중 계정 재정의입니다.
- 이러한 채널별 재정의는 현재 이를 노출하는 기본 제공 채널 모니터에 적용됩니다: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, WhatsApp.

## 문제가 발생한 경우

- `logged out` 또는 상태 409–515 → `openclaw channels logout` 후 `openclaw channels login`으로 다시 연결하세요.
- Gateway에 도달할 수 없음 → 시작하세요: `openclaw gateway --port 18789`(포트가 사용 중이면 `--force` 사용).
- 인바운드 메시지 없음 → 연결된 휴대폰이 온라인인지, 보낸 사람이 허용되어 있는지(`channels.whatsapp.allowFrom`) 확인하세요. 그룹 채팅의 경우 허용 목록 + 멘션 규칙이 일치하는지 확인하세요(`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## 전용 "상태" 명령

`openclaw health`는 실행 중인 gateway에 상태 스냅샷을 요청합니다(CLI에서 직접 채널
소켓을 열지 않음). 기본적으로 새 캐시된 gateway 스냅샷을 반환할 수 있으며, 이후
gateway는 백그라운드에서 해당 캐시를 새로 고칩니다. `openclaw health --verbose`는
대신 실시간 프로브를 강제합니다. 이 명령은 사용 가능한 경우 연결된 인증 정보/인증
경과 시간, 채널별 프로브 요약, 세션 저장소 요약, 프로브 지속 시간을 보고합니다.
Gateway에 도달할 수 없거나 프로브가 실패/시간 초과되면 0이 아닌 값으로 종료됩니다.

옵션:

- `--json`: 기계가 읽을 수 있는 JSON 출력
- `--timeout <ms>`: 기본 10초 프로브 시간 제한 재정의
- `--verbose`: 실시간 프로브를 강제하고 gateway 연결 세부 정보 출력
- `--debug`: `--verbose`의 별칭

상태 스냅샷에는 `ok`(boolean), `ts`(timestamp), `durationMs`(probe time), 채널별 상태, 에이전트 가용성, 세션 저장소 요약이 포함됩니다.

## 관련 항목

- [Gateway 런북](/ko/gateway)
- [진단 내보내기](/ko/gateway/diagnostics)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
