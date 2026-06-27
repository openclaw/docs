---
read_when:
    - 작업 공간 수동 부트스트랩하기
summary: HEARTBEAT.md용 워크스페이스 템플릿
title: HEARTBEAT.md 템플릿
x-i18n:
    generated_at: "2026-06-27T18:09:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 템플릿

`HEARTBEAT.md`는 에이전트 작업 영역에 있습니다. OpenClaw가 Heartbeat 모델 호출을 건너뛰게 하려면 이 파일을 비워 두거나 Markdown 주석과 제목만 포함하세요.

기본 런타임 템플릿은 다음과 같습니다.

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

에이전트가 주기적으로 무언가를 확인하게 하려는 경우에만 주석 아래에 짧은 작업을 추가하세요. Heartbeat 지침은 반복적인 깨우기 중에 읽히므로 짧게 유지하세요.

## 관련

- [Heartbeat 설정](/ko/gateway/config-agents)
