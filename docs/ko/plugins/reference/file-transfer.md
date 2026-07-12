---
read_when:
    - 파일 전송 Plugin을 설치, 구성 또는 감사하고 있습니다.
summary: 전용 Node 명령을 통해 페어링된 Node에서 파일을 가져오고, 목록을 조회하고, 씁니다. 최대 16MB의 바이너리에 대해 `node.invoke`에서 base64를 사용하여 bash 표준 출력 잘림을 우회합니다.
title: 파일 전송 Plugin
x-i18n:
    generated_at: "2026-07-12T01:01:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# 파일 전송 Plugin

전용 Node 명령을 통해 페어링된 Node에서 파일을 가져오고, 나열하고, 씁니다. 최대 16MB의 바이너리에 대해 `node.invoke`를 통한 base64를 사용하여 bash 표준 출력 잘림을 우회합니다.

## 배포

- 패키지: `@openclaw/file-transfer`
- 설치 경로: OpenClaw에 포함됨

## 인터페이스

계약: 도구
