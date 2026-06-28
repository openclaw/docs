---
read_when:
    - Node 전용 개발 스크립트 또는 감시 모드 실패 디버깅
    - OpenClaw에서 tsx/esbuild 로더 충돌 조사
summary: Node + tsx "__name is not a function" 크래시 참고 사항 및 우회 방법
title: Node + tsx 충돌
x-i18n:
    generated_at: "2026-05-06T17:54:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx "\_\_name is not a function" 크래시

## 요약

`tsx`와 함께 Node를 통해 OpenClaw를 실행하면 시작 시 다음 오류로 실패합니다.

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

이 문제는 개발 스크립트를 Bun에서 `tsx`로 전환한 뒤 시작되었습니다(커밋 `2871657e`, 2026-01-06). 동일한 런타임 경로는 Bun에서는 작동했습니다.

## 환경

- Node: v25.x(v25.3.0에서 관찰됨)
- tsx: 4.21.0
- OS: macOS(Node 25를 실행하는 다른 플랫폼에서도 재현될 가능성이 있음)

## 재현 방법(Node 전용)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 저장소의 최소 재현

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 버전 확인

- Node 25.3.0: 실패
- Node 22.22.0(Homebrew `node@22`): 실패
- Node 24: 아직 여기에 설치되어 있지 않음; 확인 필요

## 참고 / 가설

- `tsx`는 esbuild를 사용해 TS/ESM을 변환합니다. esbuild의 `keepNames`는 `__name` 헬퍼를 내보내고 함수 정의를 `__name(...)`로 감쌉니다.
- 이 크래시는 런타임에 `__name`이 존재하지만 함수가 아님을 나타내며, 이는 Node 25 로더 경로에서 이 모듈의 헬퍼가 누락되었거나 덮어써졌음을 의미합니다.
- 유사한 `__name` 헬퍼 문제는 헬퍼가 누락되거나 다시 작성될 때 다른 esbuild 소비자에서도 보고된 바 있습니다.

## 회귀 이력

- `2871657e`(2026-01-06): Bun을 선택 사항으로 만들기 위해 스크립트가 Bun에서 tsx로 변경되었습니다.
- 그 전에는(Bun 경로) `openclaw status`와 `gateway:watch`가 작동했습니다.

## 우회 방법

- 개발 스크립트에 Bun을 사용합니다(현재 임시 되돌림).
- 저장소 타입 검사는 `tsgo`를 사용한 다음 빌드된 출력을 실행합니다.

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 과거 참고: 이 Node/tsx 문제를 디버깅하는 동안 여기서 `tsc`가 사용되었지만, 저장소 타입 검사 레인은 이제 `tsgo`를 사용합니다.
- 가능하다면 TS 로더에서 esbuild keepNames를 비활성화합니다(`__name` 헬퍼 삽입 방지). tsx는 현재 이를 노출하지 않습니다.
- Node LTS(22/24)를 `tsx`와 함께 테스트해 이 문제가 Node 25에만 해당하는지 확인합니다.

## 참고 자료

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 다음 단계

- Node 22/24에서 재현해 Node 25 회귀인지 확인합니다.
- 알려진 회귀가 있는 경우 `tsx` nightly를 테스트하거나 이전 버전으로 고정합니다.
- Node LTS에서 재현되면 `__name` 스택 추적과 함께 최소 재현을 upstream에 제출합니다.

## 관련 문서

- [Node.js 설치](/ko/install/node)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
