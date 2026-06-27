---
read_when:
    - policy Plugin을 설치, 구성 또는 감사하고 있습니다
summary: 작업 공간 준수 여부에 대한 정책 기반 doctor 검사를 추가합니다.
title: 정책 Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# 정책 Plugin

작업 영역 준수를 위한 정책 기반 doctor 검사를 추가합니다.

## 배포

- 패키지: `@openclaw/policy`
- 설치 경로: OpenClaw에 포함됨

## 표면

plugin

<!-- openclaw-plugin-reference:manual-start -->

## 동작

Policy Plugin은 정책으로 관리되는 OpenClaw 설정과 관리 대상 작업 영역 선언에 대한 doctor 상태 검사를 제공합니다. 현재 정책은 채널 준수, 관리 대상 도구 메타데이터, MCP 서버 태세, 모델 제공자 태세, 프라이빗 네트워크 접근 태세, Gateway 노출 태세, 에이전트 작업 영역/도구 태세, 구성된 전역/에이전트별 도구 태세, 구성된 샌드박스 런타임 태세, 인그레스/채널 접근 태세, 데이터 처리 태세, OpenClaw 설정 비밀 제공자/인증 프로필 태세를 포함합니다.

정책은 작성된 요구 사항을 `policy.jsonc`에 저장하고, 기존 OpenClaw 설정과 작업 영역 선언을 증거로 관찰하며, `openclaw policy check` 및 `openclaw doctor --lint`를 통해 드리프트를 보고합니다. 깨끗한 정책 검사는 운영자가 감사용으로 기록할 수 있는 정책, 증거, 발견 사항, 증명 해시를 출력합니다.

`openclaw policy compare --baseline <file>`은 한 정책 파일을 다른 정책 파일과 비교합니다. 이는 설정 수준 준수만 확인합니다. 정책 규칙 메타데이터를 사용해 검사 대상 정책이 작성된 기준선보다 누락되거나 약하지 않은지 확인하며, 런타임 상태, 자격 증명, 비밀 값은 검사하지 않습니다.

도구 태세 규칙은 승인된 프로필, 작업 영역 전용 파일시스템 도구, 제한된 exec 보안/질문/호스트 설정, 비활성화된 상승 모드, 정확한 `alsoAllow` 항목, 필수 도구 거부 항목을 요구할 수 있습니다. 증거 기록은 유효한 도구 태세를 넓힐 수 있으므로 추가 `alsoAllow` 항목을 기록합니다. 이러한 검사는 설정 준수만 관찰하며, 런타임 승인 상태를 읽거나 런타임 강제를 추가하지 않습니다.

샌드박스 태세 규칙은 승인된 샌드박스 모드/백엔드, 호스트 컨테이너 네트워킹 거부, 컨테이너 네임스페이스 조인 거부, 읽기 전용 컨테이너 마운트 요구, 컨테이너 런타임 소켓 마운트와 비제한 컨테이너 프로필 거부, 샌드박스 브라우저 CDP 소스 범위 요구를 지정할 수 있습니다.
이러한 검사는 설정 준수만 관찰하며, 런타임 승인 상태를 읽거나, 실행 중인 컨테이너를 검사하거나, 런타임 강제를 추가하지 않습니다.

데이터 처리 규칙은 민감한 로깅 수정, 텔레메트리 콘텐츠 캡처 거부, 세션 보존 유지 관리 요구, 세션 트랜스크립트 메모리 인덱싱 거부를 요구할 수 있습니다. 이러한 검사는 설정 준수만 관찰하며, 원시 로그, 텔레메트리 내보내기, 트랜스크립트, 메모리 파일, 비밀 또는 개인 데이터를 검사하지 않습니다.

`scopes.<scopeName>` 아래의 명명된 정책 범위는 나열한 선택자에 대해 더 엄격한 일반 정책 섹션을 추가할 수 있습니다. `agentIds`는 `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`를 지원하고, `channelIds`는 `ingress.channels`를 지원합니다.
`agents.list[]`에 명시적으로 나열되지 않은 런타임 에이전트 ID는 증거 없이 조용히 통과하는 대신 상속된 전역/기본 태세에 대해 검사됩니다. `policy.jsonc`에 있는 모든 범위는 해당 선택자에 대해 유효하고 강제 가능해야 합니다. 오버레이 규칙은 추가 주장에 해당하므로 최상위 정책을 약화하지 않으며, 동일하게 관찰된 설정이 두 범위를 모두 위반할 때 자체 발견 사항을 생성할 수 있습니다.

<!-- openclaw-plugin-reference:manual-end -->

## 관련 문서

- [정책](/ko/cli/policy)
