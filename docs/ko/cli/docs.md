---
read_when:
    - 터미널에서 라이브 OpenClaw 문서를 검색하려는 경우
    - 문서 CLI가 호출하는 호스팅 검색 API를 알아야 합니다
summary: '`openclaw docs`에 대한 CLI 참조(라이브 문서 인덱스 검색)'
title: Docs
x-i18n:
    generated_at: "2026-06-27T17:17:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

터미널에서 실시간 OpenClaw 문서 색인을 검색합니다. 이 명령은 OpenClaw의 Cloudflare 호스팅 문서 검색 API를 호출하고 결과를 터미널에 렌더링합니다.

## 사용법

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

인수:

| 인수         | 설명                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `[query...]` | 자유 형식 검색 쿼리입니다. 여러 단어로 된 쿼리는 공백으로 결합되어 하나로 전송됩니다. |

## 예시

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

쿼리가 없으면 `openclaw docs`는 검색을 실행하는 대신 문서 진입점 URL과 샘플 검색 명령을 출력합니다.

## 작동 방식

`openclaw docs`는 `https://docs.openclaw.ai/api/search`를 호출하고 JSON 결과를 렌더링합니다. 검색 호출은 고정된 30초 제한 시간을 사용합니다.

## 출력

리치(TTY) 터미널에서는 결과가 제목과 그 뒤의 글머리 기호 목록으로 렌더링됩니다. 각 글머리 기호는 페이지 제목, 연결된 문서 URL, 다음 줄의 짧은 스니펫을 표시합니다. 빈 결과는 "결과 없음."을 출력합니다.

리치가 아닌 출력(파이프, `--no-color`, 스크립트)에서는 동일한 데이터가 Markdown으로 렌더링됩니다.

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 종료 코드

| 코드 | 의미                                                                  |
| ---- | --------------------------------------------------------------------- |
| `0`  | 검색에 성공했습니다(결과가 0개인 응답 포함).                          |
| `1`  | 호스팅된 문서 검색 API 호출에 실패했습니다. stderr가 인라인으로 출력됩니다. |

## 관련 항목

- [CLI 참조](/ko/cli)
- [실시간 문서](https://docs.openclaw.ai)
