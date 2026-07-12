---
read_when:
    - 토큰, API 키 또는 자격 증명 스니펫이 포함된 문서 작성하기
    - 비밀 탐지 도구로 검사될 수 있는 예제 업데이트
summary: 문서 및 예시를 위한 비밀 스캐너 안전 플레이스홀더 규칙
title: 비밀 정보 플레이스홀더 규칙
x-i18n:
    generated_at: "2026-07-12T01:15:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# 보안 비밀정보 자리표시자 규칙

사람이 읽을 수 있으면서도 실제 보안 비밀정보와 유사하지 않은 자리표시자를 사용하세요.

## 권장 스타일

- `example-openai-key-not-real` 또는 `example-discord-bot-token`과 같이 용도를 설명하는 값을 사용하세요.
- 셸 스니펫에서는 토큰처럼 보이는 인라인 문자열보다 `${OPENAI_API_KEY}`를 사용하세요.
- 예시가 명백히 가짜임을 알 수 있도록 하고 용도(제공자, 채널, 인증 유형)에 맞게 범위를 한정하세요.

## 문서에서 피해야 할 패턴

- PEM 개인 키의 헤더 또는 푸터 리터럴 텍스트.
- `sk-...`, `xoxb-...`, `AKIA...`처럼 실제 자격 증명과 유사한 접두사.
- 런타임 로그에서 복사한 실제처럼 보이는 베어러 토큰.

## 예시

```bash
# 좋음
export OPENAI_API_KEY="example-openai-key-not-real"

# 더 좋음(문서가 환경 변수 연결을 설명하는 경우)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
