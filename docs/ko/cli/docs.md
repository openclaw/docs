---
read_when:
    - 터미널에서 실시간 OpenClaw 문서를 검색하려고 합니다
    - 문서 CLI가 어떤 호스팅 검색 API를 호출하는지 알아야 합니다
summary: '`openclaw docs`의 CLI 참조(실시간 문서 인덱스 검색)'
title: 문서
x-i18n:
    generated_at: "2026-07-12T15:03:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

터미널에서 라이브 OpenClaw 문서 인덱스를 검색합니다.

## 사용법

```bash
openclaw docs                       # 문서 진입점과 검색 예시 출력
openclaw docs <query...>            # 라이브 문서 인덱스 검색
```

| 인수         | 설명                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `[query...]` | 자유 형식 검색어입니다. 여러 단어로 된 검색어는 공백으로 연결하여 하나로 전송합니다. |

검색어 없이 실행하면 `openclaw docs`는 검색을 실행하는 대신 문서 진입점 URL과 검색 명령 예시를 출력합니다.

## 예시

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## 작동 방식

`openclaw docs`는 `https://docs.openclaw.ai/api/search`를 호출하고 JSON 결과를 렌더링합니다. 검색 요청에는 고정된 30초 제한 시간이 적용됩니다.

## 출력

리치(TTY) 터미널에서는 결과가 제목 다음의 글머리 기호 목록으로 렌더링됩니다. 각 항목에는 페이지 제목, 링크된 문서 URL, 다음 줄의 짧은 발췌문이 표시됩니다. 결과가 없으면 "결과가 없습니다."를 출력합니다.

리치 형식이 아닌 출력(파이프, `--no-color`, 스크립트)에서는 동일한 데이터가 Markdown으로 렌더링됩니다.

```markdown
# 문서 검색: <query>

- [제목](https://docs.openclaw.ai/...) - 발췌문
- [제목](https://docs.openclaw.ai/...) - 발췌문
```

## 종료 코드

| 코드 | 의미                                                                        |
| ---- | --------------------------------------------------------------------------- |
| `0`  | 결과가 0개인 응답을 포함하여 검색에 성공했습니다.                           |
| `1`  | 호스팅된 문서 검색 API 호출에 실패했습니다. stderr에 오류 메시지가 출력됩니다. |

## 관련 항목

- [CLI 참조](/ko/cli)
- [라이브 문서](https://docs.openclaw.ai)
