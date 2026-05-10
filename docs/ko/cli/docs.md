---
read_when:
    - 터미널에서 라이브 OpenClaw 문서를 검색하려는 경우
    - 문서 CLI가 셸을 통해 호출하는 헬퍼 바이너리를 알아야 합니다
summary: '`openclaw docs`용 CLI 참조(실시간 문서 색인 검색)'
title: 문서
x-i18n:
    generated_at: "2026-05-10T19:28:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

터미널에서 라이브 OpenClaw 문서 인덱스를 검색합니다. 이 명령은 공개 Mintlify 호스팅 문서 MCP 검색 엔드포인트인 `https://docs.openclaw.ai/mcp.SearchOpenClaw`를 셸로 호출하고 결과를 터미널에 렌더링합니다.

## 사용법

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

인수:

| 인수         | 설명                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | 자유 형식 검색 쿼리입니다. 여러 단어로 된 쿼리는 공백으로 결합되어 하나로 전송됩니다. |

## 예시

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

쿼리가 없으면 `openclaw docs`는 검색을 실행하는 대신 문서 진입점 URL과 예시 검색 명령을 출력합니다.

## 작동 방식

`openclaw docs`는 `mcporter` CLI를 호출해 문서 검색 MCP 도구를 실행한 다음, 도구 출력의 `Title: / Link: / Content:` 블록을 결과 목록으로 파싱합니다.

`mcporter`를 확인하기 위해 OpenClaw는 다음 순서로 검사합니다.

1. `PATH`의 `mcporter`(있으면 직접 사용).
2. `pnpm`이 설치되어 있으면 `pnpm dlx mcporter ...`.
3. `npx`가 설치되어 있으면 `npx -y mcporter ...`.

사용 가능한 항목이 없으면 이 명령은 `pnpm` 설치(`npm install -g pnpm`)를 안내하는 힌트와 함께 실패합니다.

검색 호출은 고정된 30초 제한 시간을 사용합니다. 결과 스니펫은 항목당 약 220자로 잘립니다.

## 출력

서식 있는(TTY) 터미널에서는 결과가 제목 다음에 글머리 기호 목록으로 렌더링됩니다. 각 글머리 기호는 페이지 제목, 링크된 문서 URL, 그리고 다음 줄의 짧은 스니펫을 표시합니다. 빈 결과는 "결과가 없습니다."를 출력합니다.

서식 없는 출력(파이프, `--no-color`, 스크립트)에서는 동일한 데이터가 Markdown으로 렌더링됩니다.

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 종료 코드

| 코드 | 의미                                                |
| ---- | --------------------------------------------------- |
| `0`  | 검색에 성공했습니다(결과가 0개인 응답 포함).        |
| `1`  | MCP 도구 호출이 실패했습니다. stderr가 인라인으로 출력됩니다. |

## 관련 항목

- [CLI 참조](/ko/cli)
- [라이브 문서](https://docs.openclaw.ai)
