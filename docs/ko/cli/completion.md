---
read_when:
    - zsh/bash/fish/PowerShell용 셸 자동 완성을 원하는 경우
    - OpenClaw 상태 아래에 자동 완성 스크립트를 캐시해야 하는 경우
summary: '`openclaw completion`에 대한 CLI 참조(셸 자동 완성 스크립트 생성/설치)'
title: 자동 완성
x-i18n:
    generated_at: "2026-04-24T06:07:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw completion`

셸 자동 완성 스크립트를 생성하고, 선택적으로 셸 프로필에 설치합니다.

## 사용법

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## 옵션

- `-s, --shell <shell>`: 셸 대상 (`zsh`, `bash`, `powershell`, `fish`; 기본값: `zsh`)
- `-i, --install`: 셸 프로필에 source 줄을 추가해 자동 완성 설치
- `--write-state`: stdout에 출력하지 않고 자동 완성 스크립트를 `$OPENCLAW_STATE_DIR/completions`에 씀
- `-y, --yes`: 설치 확인 프롬프트 건너뛰기

## 참고

- `--install`은 셸 프로필에 작은 "OpenClaw Completion" 블록을 쓰고 이를 캐시된 스크립트에 연결합니다.
- `--install`이나 `--write-state` 없이 실행하면 명령은 스크립트를 stdout에 출력합니다.
- 자동 완성 생성은 중첩된 하위 명령까지 포함되도록 명령 트리를 즉시 로드합니다.

## 관련

- [CLI 참조](/ko/cli)
