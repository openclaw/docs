---
read_when:
    - 음성 통화 Plugin을 사용하고 CLI 진입점이 필요한 경우
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose`에 대한 간단한 예시가 필요합니다'
summary: '`openclaw voicecall`용 CLI 참조(음성 통화 Plugin 명령 인터페이스)'
title: 음성 통화
x-i18n:
    generated_at: "2026-05-01T06:23:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall`은 Plugin이 제공하는 명령입니다. 음성 통화 Plugin이 설치되고 활성화된 경우에만 표시됩니다.

Gateway가 실행 중이면 운영 명령(`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`)이 해당 Gateway의
음성 통화 런타임으로 전송됩니다. 연결 가능한 Gateway가 없으면 독립 실행형
CLI 런타임으로 대체됩니다.

기본 문서:

- 음성 통화 Plugin: [음성 통화](/ko/plugins/voice-call)

## 일반 명령

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup`은 기본적으로 사람이 읽기 쉬운 준비 상태 확인을 출력합니다. 스크립트에는
`--json`을 사용하세요.

```bash
openclaw voicecall setup --json
```

`status`는 기본적으로 활성 통화를 JSON으로 출력합니다. 한 통화를 검사하려면
`--call-id <id>`를 전달하세요.

외부 공급자(`twilio`, `telnyx`, `plivo`)의 경우 설정은 `publicUrl`, 터널 또는
Tailscale 노출에서 공개 Webhook URL을 확인해야 합니다. 이동통신사가 접근할 수 없기 때문에
loopback/private serve 대체 경로는 거부됩니다.

`smoke`는 동일한 준비 상태 확인을 실행합니다. `--to`와 `--yes`가 모두 있는 경우가 아니면
실제 전화 통화를 걸지 않습니다.

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Webhook 노출(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

보안 참고: 신뢰하는 네트워크에만 Webhook 엔드포인트를 노출하세요. 가능하면 Funnel보다 Tailscale Serve를 선호하세요.

## 관련

- [CLI 참조](/ko/cli)
- [음성 통화 Plugin](/ko/plugins/voice-call)
