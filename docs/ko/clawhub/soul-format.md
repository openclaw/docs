---
read_when:
    - 영혼 게시하기
    - soul 게시 실패 디버깅
summary: Soul 번들 형식, 필수 파일, 제한 사항.
x-i18n:
    generated_at: "2026-05-12T04:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# 소울 형식

## 디스크에서

소울은 단일 파일입니다:

- `SOUL.md`(또는 `soul.md`)

현재 onlycrabs.ai는 추가 파일을 거부합니다.

## `SOUL.md`

- 선택적 YAML 프런트매터가 있는 Markdown입니다.
- 서버는 게시 중 프런트매터에서 메타데이터를 추출합니다.
- `description`은 UI/검색에서 소울 요약으로 사용됩니다.

## 제한

- 총 번들 크기: 50MB.
- 임베딩 텍스트에는 `SOUL.md`만 포함됩니다.

## 슬러그

- 기본적으로 폴더 이름에서 파생됩니다.
- 소문자여야 하며 URL에 안전해야 합니다: `^[a-z0-9][a-z0-9-]*$`.

## 버전 관리 + 태그

- 각 게시마다 새 버전(semver)이 생성됩니다.
- 태그는 버전을 가리키는 문자열 포인터이며, `latest`가 일반적으로 사용됩니다.
