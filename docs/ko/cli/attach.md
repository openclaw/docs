---
read_when:
    - Claude Code가 OpenClaw Gateway MCP 도구를 사용하도록 하려는 경우
    - 외부 하네스를 위한 임시 세션 바인딩 MCP 권한 부여가 필요합니다
summary: '`openclaw attach`에 대한 CLI 참조(범위가 지정된 Gateway MCP 권한으로 Claude Code 실행)'
title: CLI 연결
x-i18n:
    generated_at: "2026-07-02T00:48:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach`는 하나의 Gateway 세션에 바인딩된 엄격한 임시 MCP 구성으로 Claude Code를 실행합니다.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

옵션:

- `--session <key>`는 권한 부여를 Gateway 세션에 바인딩합니다. 기본값은 메인 세션입니다.
- `--ttl <ms>`는 밀리초 단위의 양수 권한 부여 TTL을 요청합니다. Gateway는 자체 상한을 적용합니다.
- `--bin <path>`는 Claude Code 바이너리를 선택합니다. 기본값은 `claude`입니다.
- `--print-config`는 임시 `.mcp.json`을 쓰고, 실행 명령과 env를 출력하며, TTL이 만료될 때까지 권한 부여를 활성 상태로 둡니다.

전달자 토큰은 argv가 아니라 환경 변수를 통해 전달됩니다. OpenClaw는 주변
Claude MCP 서버가 연결된 세션에 참여하지 않도록 `--strict-mcp-config --mcp-config <path>`로
Claude Code를 실행합니다. 일반 실행은 Claude Code 프로세스가 종료될 때
권한 부여를 취소합니다.

참고 항목: [Gateway CLI](/ko/cli/gateway), [MCP CLI](/ko/cli/mcp), [ACP CLI](/ko/cli/acp).
