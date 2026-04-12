---
x-i18n:
    generated_at: "2026-04-12T23:27:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# 문서 가이드

이 디렉터리는 문서 작성, Mintlify 링크 규칙, 그리고 문서 i18n 정책을 담당합니다.

## Mintlify 규칙

- 문서는 Mintlify(`https://docs.openclaw.ai`)에 호스팅됩니다.
- `docs/**/*.md`의 내부 문서 링크는 `.md` 또는 `.mdx` 접미사 없이 루트 상대 경로를 유지해야 합니다(예: `[Config](/configuration)`).
- 섹션 교차 참조는 루트 상대 경로의 앵커를 사용해야 합니다(예: `[Hooks](/configuration#hooks)`).
- 문서 제목에는 em dash와 아포스트로피를 피해야 합니다. Mintlify의 앵커 생성이 이 경우 불안정하기 때문입니다.
- README 및 기타 GitHub 렌더링 문서는 GitHub 외부에서도 링크가 작동하도록 절대 문서 URL을 유지해야 합니다.
- 문서 내용은 일반적으로 유지해야 합니다. 개인 디바이스 이름, 호스트명, 로컬 경로는 사용하지 말고 `user@gateway-host`와 같은 플레이스홀더를 사용하세요.

## 문서 콘텐츠 규칙

- 문서, UI 문구, 선택기 목록에서는 해당 섹션이 런타임 순서 또는 자동 감지 순서를 명시적으로 설명하는 경우가 아니라면 서비스/프로바이더를 알파벳순으로 정렬하세요.
- 번들된 Plugin 명명은 루트 `AGENTS.md`의 저장소 전반 Plugin 용어 규칙과 일관되게 유지하세요.

## 문서 i18n

- 외국어 문서는 이 저장소에서 유지 관리하지 않습니다. 생성된 게시 출력은 별도의 `openclaw/docs` 저장소에 있으며(로컬에서는 흔히 `../openclaw-docs`로 클론됨), 그곳에 존재합니다.
- 여기의 `docs/<locale>/**` 아래에 현지화된 문서를 추가하거나 수정하지 마세요.
- 이 저장소의 영어 문서와 용어집 파일을 기준 원본으로 취급하세요.
- 파이프라인: 여기에서 영어 문서를 업데이트하고, 필요에 따라 `docs/.i18n/glossary.<locale>.json`을 업데이트한 다음, 게시 저장소 동기화와 `openclaw/docs`에서의 `scripts/docs-i18n` 실행에 맡기세요.
- `scripts/docs-i18n`를 다시 실행하기 전에, 영어로 유지되어야 하거나 고정 번역을 사용해야 하는 새로운 기술 용어, 페이지 제목, 짧은 탐색 레이블에 대한 용어집 항목을 추가하세요.
- `pnpm docs:check-i18n-glossary`는 변경된 영어 문서 제목과 짧은 내부 문서 레이블을 점검하는 가드입니다.
- 번역 메모리는 게시 저장소의 생성된 `docs/.i18n/*.tm.jsonl` 파일에 저장됩니다.
- `docs/.i18n/README.md`를 참고하세요.
