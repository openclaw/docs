---
read_when:
    - BOOT.md 체크리스트 추가하기
summary: BOOT.md용 워크스페이스 템플릿
title: BOOT.md 템플릿
x-i18n:
    generated_at: "2026-07-12T15:44:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

여기에 짧고 명확한 시작 지침을 추가하십시오. 번들로 제공되는 `boot-md` 훅은 파일이 존재하고 공백이 아닌 내용이 있으면 Gateway가 시작될 때마다 에이전트 워크스페이스별로 이 파일을 한 번 실행합니다. 여러 에이전트가 하나의 워크스페이스를 공유하는 경우에도 한 번만 실행됩니다.

이 훅은 비활성화된 상태로 제공됩니다. 먼저 활성화하십시오.

```bash
openclaw hooks enable boot-md
```

체크리스트 항목에서 메시지를 보내는 경우 메시지 도구를 사용한 다음, 정확한 무응답 토큰 `NO_REPLY`로 응답하십시오(대소문자 구분 없음).

## 관련 문서

- [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- [훅](/ko/automation/hooks#boot-md)
