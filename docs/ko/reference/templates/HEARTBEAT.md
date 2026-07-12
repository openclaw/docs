---
read_when:
    - 워크스페이스 수동 부트스트랩하기
summary: HEARTBEAT.md용 작업 공간 템플릿
title: HEARTBEAT.md 템플릿
x-i18n:
    generated_at: "2026-07-12T01:12:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 템플릿

`HEARTBEAT.md`는 에이전트 작업 공간에 있으며 주기적인 Heartbeat 체크리스트를 담습니다. OpenClaw가 Heartbeat 모델 호출을 완전히 건너뛰게 하려면 파일을 비워 두거나 공백, Markdown 주석, ATX 제목, 빈 목록 항목 (`- `, `* [ ]`), 또는 펜스 표시만 포함하세요 (`reason=empty-heartbeat-file`).

배포되는 기본 콘텐츠:

```markdown
<!-- Heartbeat 템플릿. 주석만 있는 콘텐츠는 예약된 Heartbeat API 호출을 방지합니다. -->

# Heartbeat API 호출을 건너뛰려면 이 파일을 비워 두거나 주석만 포함하세요.

# 에이전트가 무언가를 주기적으로 확인하도록 하려면 아래에 작업을 추가하세요.
```

주기적인 확인이 필요한 경우에만 주석 줄 아래에 짧은 작업을 추가하세요. 내용을 간결하게 유지하세요. Heartbeat는 실행될 때마다 이 파일을 읽으므로(기본적으로 30분마다), 지시 사항이 지나치게 길면 깨어날 때마다 토큰이 소모됩니다.

일반 체크리스트 대신 실행 시점이 된 항목만 확인하려면 작업별 `interval` 및 `prompt` 필드가 있는 구조화된 `tasks:` 블록을 사용하세요. 형식과 동작은 [HEARTBEAT.md](/ko/gateway/heartbeat#heartbeatmd-optional)를 참조하세요.

## 관련 문서

- [Heartbeat](/ko/gateway/heartbeat)
- [Heartbeat 구성](/ko/gateway/config-agents)
