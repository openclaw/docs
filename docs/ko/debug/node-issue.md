---
read_when:
    - 누락된 __name 헬퍼가 언급되는 tsx/esbuild 로더 충돌 조사하기
summary: 과거 Node + tsx의 "__name is not a function" 충돌과 그 원인
title: Node + tsx 충돌
x-i18n:
    generated_at: "2026-07-12T15:13:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx "\_\_name is not a function" 충돌

## 상태

해결되었습니다. 이 충돌은 현재 `package.json`에 고정된 `tsx` 버전
(`4.22.3`)이나 최신 Node 릴리스에서 재현되지 않습니다. 향후
`tsx`/esbuild 업그레이드로 문제가 다시 발생할 경우에 대비해 이 문서를 유지합니다.

## 원래 증상

`tsx`를 통해 OpenClaw 개발 스크립트를 실행하면 시작 시 다음 오류가 발생했습니다.

```text
[openclaw] CLI 시작 실패: TypeError: __name은 함수가 아닙니다
    위치: createSubsystemLogger (src/logging/subsystem.ts)
    위치: <caller> (src/agents/auth-profiles/constants.ts)
```

원래 충돌 이후 두 파일이 모두 변경되어 특정 줄이 더 이상 일치하지 않으므로
줄 번호는 생략했습니다.

이 문제는 Bun을 선택 사항으로 만들기 위해 개발 스크립트를 Bun에서 `tsx`로
전환한 후(`2871657e`, 2026-01-06) 나타났습니다. 이에 해당하는 Bun 기반
경로에서는 충돌이 발생하지 않았습니다. 원래 macOS의 Node v25.3.0에서
관찰되었으며, Node 25를 실행하는 다른 플랫폼도 영향을 받을 가능성이 높은 것으로
간주되었습니다.

## 원인

`tsx`는 변환 옵션에 `keepNames: true`를 하드코딩하여 esbuild를 통해
TS/ESM을 변환합니다. 이 설정을 사용하면 축소 및 번들링 후에도 `fn.name`이
유지되도록 esbuild가 명명된 함수/클래스 선언을 `__name` 헬퍼 호출로
래핑합니다. 이 충돌은 영향을 받은 `tsx`/Node 조합에서 해당 모듈의 호출 지점에
헬퍼가 없거나 다른 항목에 의해 가려져, `__name(...)`이 래핑된 값을 반환하는
대신 예외를 발생시켰음을 의미합니다.

## 현재 재현 확인

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

최소 격리 재현(원래 스택 추적에 있던 모듈만 로드):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

현재 두 명령 모두 오류 없이 종료됩니다. 둘 중 하나에서 다시 `__name is not a
function` 예외가 발생하면 업스트림에 문제를 제출하기 전에 정확한 Node 버전,
`tsx` 버전(`node_modules/tsx/package.json`), 전체 스택 추적을 기록하십시오.

## 해결 방법(충돌이 다시 발생하는 경우)

- `node --import tsx` 대신 Bun으로 개발 스크립트를 실행하십시오.
- 유형 검사를 위해 `pnpm tsgo`를 실행한 다음, `tsx`를 통해 소스를 실행하는 대신
  빌드된 출력을 실행하십시오.

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 다른 `tsx` 버전을 사용해 보면서(`pnpm add -D tsx@<version>`은 종속성
  변경이며 저장소 정책에 따른 승인이 필요합니다) 번들에 포함된 esbuild 버전이
  버그를 다시 발생시켰는지 이분 탐색하십시오.
- 다른 Node 메이저/마이너 버전에서 테스트하여 오류가 특정 버전에만 발생하는지
  확인하십시오.

## 참고 자료

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 관련 문서

- [Node.js 설치](/ko/install/node)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
