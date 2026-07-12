---
read_when:
    - zsh/bash/fish/PowerShell용 셸 자동 완성을 사용하려고 합니다
    - OpenClaw 상태 아래에 완성 스크립트를 캐시해야 합니다.
summary: '`openclaw completion`에 대한 CLI 참조(셸 자동 완성 스크립트 생성/설치)'
title: 완료
x-i18n:
    generated_at: "2026-07-12T15:04:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

셸 자동 완성 스크립트를 생성하고 OpenClaw 상태 디렉터리에 캐시하며, 선택적으로 셸 프로필에 설치합니다.

## 사용법

```bash
openclaw completion                          # zsh 스크립트를 stdout에 출력
openclaw completion --shell fish             # fish 스크립트 출력
openclaw completion --write-state            # 모든 셸의 스크립트 캐시
openclaw completion --write-state --install  # 캐시한 다음 한 단계로 설치
openclaw completion --shell bash --write-state
```

## 옵션

- `-s, --shell <shell>`: 대상 셸(`zsh`, `bash`, `powershell`, `fish`; 기본값: `zsh`)
- `-i, --install`: 캐시된 스크립트의 source 줄을 셸 프로필에 추가하여 자동 완성을 설치합니다
- `--write-state`: stdout에 출력하지 않고 자동 완성 스크립트를 `$OPENCLAW_STATE_DIR/completions`(기본값 `~/.openclaw/completions`)에 작성합니다. `--shell`을 지정하면 해당 셸만 작성하고, 지정하지 않으면 네 셸 모두 작성합니다
- `-y, --yes`: 설치 확인 프롬프트를 건너뜁니다(비대화형)

## 설치 흐름

`--install`은 프로필이 캐시된 스크립트를 가리키도록 하므로 캐시가 먼저 존재해야 합니다. 캐시가 없으면 명령이 실패하고 `openclaw completion --write-state`를 실행하라는 안내를 표시합니다. `--write-state --install`을 함께 사용하면 두 작업을 한 단계로 수행할 수 있습니다. `--shell`을 지정하지 않으면 `--install`은 `$SHELL`에서 셸을 감지하며, 감지하지 못하면 zsh를 사용합니다.

설치 시 셸 프로필에 작은 `# OpenClaw Completion` 블록을 작성하고, 기존의 느린 `source <(openclaw completion ...)` 줄을 캐시된 스크립트의 source 줄로 교체합니다.

| 셸         | 프로필                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bash       | `~/.bashrc`(`~/.bashrc`가 없으면 `~/.bash_profile` 사용)                                                                                                                                |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                             |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`(Windows에서는 `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, Windows PowerShell에서는 `Documents/WindowsPowerShell/...`) |
| zsh        | `~/.zshrc`                                                                                                                                                                               |

## 참고

- `--install` 또는 `--write-state`를 지정하지 않으면 명령이 스크립트를 stdout에 출력합니다.
- 자동 완성을 생성할 때 Plugin CLI 명령을 포함한 전체 명령 트리를 즉시 로드하므로 중첩된 하위 명령도 포함됩니다.
- `openclaw update`는 업데이트에 성공한 후 자동 완성 캐시를 자동으로 새로 고칩니다. `openclaw doctor`는 누락되었거나 오래된 자동 완성 설정을 복구할 수 있습니다.

## 관련 항목

- [CLI 참조](/ko/cli)
