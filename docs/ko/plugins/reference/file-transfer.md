---
read_when:
    - 파일 전송 Plugin을 설치, 구성 또는 감사하고 있습니다
summary: 전용 Node 명령을 통해 페어링된 Node에서 파일을 가져오고, 나열하고, 씁니다. 최대 16MB의 바이너리에 대해 node.invoke를 통한 base64를 사용하여 bash 표준 출력 잘림을 우회합니다.
title: 파일 전송 Plugin
x-i18n:
    generated_at: "2026-07-16T12:54:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# 파일 전송 Plugin

전용 Node 명령을 통해 페어링된 Node에서 파일을 가져오고, 나열하고, 씁니다. 최대 16 MB의 바이너리에 대해 node.invoke를 통한 base64를 사용하여 bash 표준 출력 잘림을 우회합니다.

## 배포

- 패키지: `@openclaw/file-transfer`
- 설치 경로: OpenClaw에 포함됨

## 표면

계약: `tools`
