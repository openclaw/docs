---
read_when:
    - voice-call Plugin을 사용하며 CLI 진입점을 찾고 있습니다
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose`에 대한 빠른 예시가 필요합니다'
summary: '`openclaw voicecall`용 CLI 참조 (voice-call Plugin 명령 인터페이스)'
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T05:59:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall`은 Plugin이 제공하는 명령어입니다. voice-call Plugin이 설치되고 활성화된 경우에만 표시됩니다.

기본 문서:

- voice-call Plugin: [Voice Call](/ko/plugins/voice-call)

## 일반 명령어

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup`은 기본적으로 사람이 읽기 쉬운 준비 상태 점검 결과를 출력합니다. 스크립트용으로는 `--json`을 사용하세요:

```bash
openclaw voicecall setup --json
```

외부 provider(`twilio`, `telnyx`, `plivo`)의 경우, setup은 `publicUrl`, 터널 또는 Tailscale 노출에서 공개
Webhook URL을 해석할 수 있어야 합니다. 캐리어가 도달할 수 없기 때문에 loopback/private
serve fallback은 거부됩니다.

`smoke`는 동일한 준비 상태 점검을 실행합니다. `--to`와 `--yes`가 모두 있을 때만
실제 전화 통화를 수행합니다:

```bash
openclaw voicecall smoke --to "+15555550123"        # 드라이 런
openclaw voicecall smoke --to "+15555550123" --yes  # 실제 notify 통화
```

## Webhook 노출(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

보안 참고: Webhook 엔드포인트는 신뢰할 수 있는 네트워크에만 노출하세요. 가능하면 Funnel보다 Tailscale Serve를 우선 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [voice-call Plugin](/ko/plugins/voice-call)
