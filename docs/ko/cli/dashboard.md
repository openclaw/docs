---
read_when:
    - 현재 토큰으로 Control UI를 열려고 합니다
    - 브라우저를 실행하지 않고 URL을 출력하려고 합니다
summary: '`openclaw dashboard`의 CLI 참조(Control UI 열기)'
title: 대시보드
x-i18n:
    generated_at: "2026-07-16T12:27:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

현재 인증을 사용하여 Control UI를 여십시오.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: URL을 출력하지만 브라우저를 실행하지 않습니다.
- `--json`: 브라우저 열기, 클립보드 사용, 프롬프트 표시 또는 Gateway 시작 없이 기계 판독 가능한 연결 객체 하나를 출력합니다.
- `--yes`: 필요한 경우 프롬프트 없이 Gateway를 시작하거나 설치합니다.

## 기계 판독 가능 출력

확인된 Control UI URL이 필요한 데스크톱 통합 및 스크립트에는 `--json`을 사용하십시오.

```bash
openclaw dashboard --json
```

응답에는 `url`, `httpUrl`, `wsUrl`, `port`, `tokenIncluded`이 포함됩니다. Gateway가 준비되지 않은 경우 명령은 `{"ok":false,"reason":"..."}`을 반환하고 0이 아닌 코드로 종료됩니다. SecretRef로 관리되는 토큰은 `url`에 절대 포함되지 않습니다.

참고:

- 가능한 경우 구성된 `gateway.auth.token` SecretRef를 확인합니다.
- `gateway.tls.enabled`을 따릅니다. TLS가 활성화된 Gateway는 `https://` Control UI URL을 출력하거나 열고 `wss://`을 통해 연결합니다.
- `lan` 또는 와일드카드 `custom` 바인딩의 경우 와일드카드는 브라우저 대상이 아니므로 동일 호스트에서 실행할 때 항상 루프백을 사용합니다. 평문 `tailnet` 및 `custom` 바인딩도 브라우저가 보안 컨텍스트를 갖도록 `127.0.0.1`을 사용합니다. TLS가 활성화된 특정 호스트는 인증서 이름이 일치하도록 구성된 주소를 유지합니다.
- 특정 인터페이스 바인딩에 대해 인증된 루프백 URL을 전달하기 전에 명령은 구성된 인터페이스를 검사하고 해당 인터페이스와 `127.0.0.1`이 동일한 Gateway 프로세스에 속하는지 확인합니다. 리스너 소유권이 모호하면 상태 안내와 함께 안전하게 실패합니다.
- SecretRef로 관리되는 토큰은 확인 여부와 관계없이 출력, 복사 또는 열린 URL에 절대 포함되지 않으므로 외부 비밀이 터미널 출력, 클립보드 기록 또는 브라우저 실행 인수로 유출되지 않습니다.
- `gateway.auth.token`이 SecretRef로 관리되지만 확인되지 않은 경우 명령은 유효하지 않은 토큰 자리표시자 대신 토큰이 포함되지 않은 URL과 해결 안내를 출력합니다.
- 토큰 인증 URL의 클립보드 또는 브라우저 전달에 실패하면 명령은 토큰 값을 출력하지 않고 `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token`, URL 프래그먼트 키 `token`을 명시하는 안전한 수동 인증 안내를 기록합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [대시보드](/ko/web/dashboard)
