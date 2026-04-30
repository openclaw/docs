---
read_when:
    - 가장 빠른 로컬 개발 루프를 원합니다(bun + watch)
    - Bun 설치/패치/라이프사이클 스크립트 문제가 발생한 경우
summary: 'Bun 워크플로(실험적): pnpm 대비 설치 및 주의 사항'
title: Bun(실험적)
x-i18n:
    generated_at: "2026-04-30T06:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun은 **Gateway 런타임에 권장되지 않습니다**(WhatsApp 및 Telegram의 알려진 문제). 프로덕션에는 Node를 사용하세요.
</Warning>

Bun은 TypeScript를 직접 실행하기 위한 선택적 로컬 런타임입니다(`bun run ...`, `bun --watch ...`). 기본 패키지 관리자는 계속 `pnpm`이며, 문서 도구에서 완전히 지원되고 사용됩니다. Bun은 `pnpm-lock.yaml`을 사용할 수 없으며 이를 무시합니다.

## 설치

<Steps>
  <Step title="의존성 설치">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb`는 gitignore 처리되어 있으므로 저장소 변경이 발생하지 않습니다. lockfile 쓰기를 완전히 건너뛰려면:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="빌드 및 테스트">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 생명주기 스크립트

Bun은 명시적으로 신뢰되지 않은 의존성 생명주기 스크립트를 차단합니다. 이 저장소에서는 일반적으로 차단되는 스크립트가 필요하지 않습니다.

- `@whiskeysockets/baileys` `preinstall` -- Node 주 버전이 20 이상인지 확인합니다(OpenClaw는 기본적으로 Node 24를 사용하며 현재 `22.14+`인 Node 22 LTS도 계속 지원합니다)
- `protobufjs` `postinstall` -- 호환되지 않는 버전 체계에 대한 경고를 출력합니다(빌드 아티팩트 없음)

이러한 스크립트가 필요한 런타임 문제가 발생하면 명시적으로 신뢰하세요.

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 주의 사항

일부 스크립트는 여전히 pnpm을 하드코딩합니다(예: `docs:build`, `ui:*`, `protocol:check`). 지금은 해당 스크립트를 pnpm으로 실행하세요.

## 관련

- [설치 개요](/ko/install)
- [Node.js](/ko/install/node)
- [업데이트](/ko/install/updating)
