---
read_when:
    - 개발 Gateway 템플릿 사용하기
    - 기본 개발 에이전트 ID 업데이트하기
summary: 개발 에이전트 도구 참고 사항(C-3PO)
title: TOOLS.dev 템플릿
x-i18n:
    generated_at: "2026-07-12T15:44:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3259107a9252ff3d01b98608e6005387cb54a75da5db64f833c945056abd4173
    source_path: reference/templates/TOOLS.dev.md
    workflow: 16
---

# TOOLS.md - 사용자 도구 참고 사항(편집 가능)

이 파일은 외부 도구와 규칙에 관한 _사용자 본인_의 참고 사항을 위한 것입니다. 어떤 도구가 존재하는지는 이 파일에서 정의하지 않습니다. OpenClaw는 내부적으로 기본 제공 도구를 제공하며, 나머지는 Skills를 통해 추가됩니다.

## 예시

### imsg

- iMessage/SMS 보내기: 누구에게 무엇을 보낼지 설명하고, 보내기 전에 확인하십시오.
- 짧은 메시지를 권장하며, 비밀 정보는 보내지 마십시오.

### sag

- 텍스트 음성 변환: 음성, 대상 스피커/방, 스트리밍 여부를 지정하십시오.

어시스턴트가 로컬 도구 체인에 관해 알아야 할 다른 내용을 자유롭게 추가하십시오.

## 관련 항목

- [TOOLS.md 템플릿](/ko/reference/templates/TOOLS)
