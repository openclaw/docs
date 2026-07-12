---
x-i18n:
    generated_at: "2026-07-12T00:32:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# 문서 가이드

이 디렉터리는 문서 작성, Mintlify 링크 규칙 및 문서 국제화 정책을 담당합니다.

## Mintlify 규칙

- 문서는 Mintlify(`https://docs.openclaw.ai`)에서 호스팅됩니다.
- `docs/**/*.md`의 내부 문서 링크는 `.md` 또는 `.mdx` 접미사 없이 루트 상대 경로를 유지해야 합니다(예: `[구성](/gateway/configuration)`).
- 섹션 간 참조에는 루트 상대 경로의 앵커를 사용해야 합니다(예: `[훅](/gateway/configuration-reference#hooks)`).
- Mintlify의 앵커 생성은 전각 대시와 아포스트로피를 안정적으로 처리하지 못하므로 문서 제목에서 이를 피해야 합니다.
- README 및 GitHub에서 렌더링되는 기타 문서는 Mintlify 외부에서도 링크가 작동하도록 문서의 절대 URL을 유지해야 합니다.
- 문서 콘텐츠는 일반적인 형태를 유지해야 합니다. 개인 기기 이름, 호스트 이름 또는 로컬 경로를 포함하지 말고 `user@gateway-host`와 같은 자리표시자를 사용하세요.

## 문서 콘텐츠 규칙

- 문서, UI 문구 및 선택 목록에서는 해당 섹션이 런타임 순서나 자동 감지 순서를 명시적으로 설명하는 경우가 아니면 서비스와 제공자를 알파벳순으로 정렬하세요.
- 번들 Plugin의 명명은 루트 `AGENTS.md`에 있는 저장소 전체의 Plugin 용어 규칙과 일관되게 유지하세요.
- 생성된 문서는 절대 직접 편집하지 마세요. `docs/plugins/reference/**`, `docs/plugins/reference.md` 및 `docs/plugins/plugin-inventory.md`는 `pnpm plugins:inventory:gen`에서 생성되고, `docs/docs_map.md`는 `pnpm docs:map:gen`에서 생성되며, `docs/maturity/**`는 `pnpm maturity:render`에서 생성됩니다.

## 내부 문서

- 장기간 유지되는 비공개 운영자 문서는 `~/Projects/manager/docs/`에 두어야 합니다.
- 저장소 로컬의 내부 임시 또는 미러 문서는 무시되는 `docs/internal/` 아래에 둘 수 있습니다.
- `docs/internal/**` 페이지를 `docs/docs.json` 탐색 메뉴에 추가하거나 공개 문서에서 링크하지 마세요.
- 나중에 페이지가 강제로 추가되더라도 `scripts/docs-sync-publish.mjs`는 공개 `openclaw/docs` 게시 저장소에서 `docs/internal/**`를 제외하고 제거합니다.
- 내부 문서에는 저장소 경로, 비공개 앱 이름, 1Password 항목 이름 및 런북을 언급할 수 있지만 비밀 값은 절대 포함하지 마세요.

## 성숙도 스코어카드 편집

`taxonomy.yaml`과 `qa/maturity-scores.yaml`은 원본 입력입니다. `docs/maturity/` 아래에 생성된 성숙도 문서는 투영본이므로 점수, LTS, 분류 체계, QA 프로필 또는 증거 표를 직접 편집해서는 안 됩니다.
`scripts/qa/render-maturity-docs.ts`가 생성을 담당합니다. 커밋된 문서를 갱신하려면 `pnpm maturity:render`를 사용하고 검증하려면 `pnpm maturity:check`를 사용하세요.
`.github/workflows/maturity-scorecard.yml`은 아티팩트 미리보기를 렌더링하고 생성된 문서의 PR을 열 수 있습니다. `.github/workflows/openclaw-release-checks.yml`은 릴리스 QA를 위해 이를 디스패치합니다.
유지관리자가 정제된 커밋 투영본을 명시적으로 요청하지 않는 한, 결정론적 `qa-evidence.json.scorecard` 데이터는 GitHub Actions 아티팩트에 유지하세요.
사람이 재정의하려면 PR에서 원본 상태를 변경하고 그 이유와 공개 또는 편집된 증거를 설명해야 합니다.

## 문서 국제화

- 외국어 문서는 이 저장소에서 유지관리하지 않습니다. 생성된 게시 출력은 별도의 `openclaw/docs` 저장소에 있습니다(로컬에서는 흔히 `../openclaw-docs`로 복제됨).
- 여기의 `docs/<locale>/**` 아래에 현지화된 문서를 추가하거나 편집하지 마세요.
- 이 저장소의 영어 문서와 용어집 파일을 기준 정보로 취급하세요.
- 파이프라인: 여기서 영어 문서를 업데이트하고 필요에 따라 `docs/.i18n/glossary.<locale>.json`을 업데이트한 다음, 게시 저장소 동기화와 `openclaw/docs`의 `scripts/docs-i18n` 실행에 맡기세요.
- `scripts/docs-i18n`을 다시 실행하기 전에 영어로 유지하거나 고정 번역을 사용해야 하는 새로운 기술 용어, 페이지 제목 또는 짧은 탐색 레이블을 용어집에 추가하세요.
- `pnpm docs:check-i18n-glossary`는 변경된 영어 문서 제목과 짧은 내부 문서 레이블을 검사하는 보호 장치입니다.
- 번역 메모리는 게시 저장소에서 생성된 `docs/.i18n/*.tm.jsonl` 파일에 저장됩니다.
- `docs/.i18n/README.md`를 참조하세요.
