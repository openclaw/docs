---
read_when:
    - 가장 빠른 로컬 개발 루프를 원합니다(bun + watch)
    - Bun 설치/패치/수명 주기 스크립트 문제가 발생합니다
summary: 'Bun 워크플로(실험적): 설치 및 pnpm과 비교할 때의 주의 사항'
title: Bun(실험적)
x-i18n:
    generated_at: "2026-07-12T15:23:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Gateway 런타임에는 Bun을 권장하지 않습니다(WhatsApp 및 Telegram에서 알려진 문제가 있습니다). 프로덕션에서는 Node를 사용하십시오.
</Warning>

Bun은 TypeScript를 직접 실행하기 위한 선택적 로컬 런타임입니다(`bun run ...`, `bun --watch ...`). 기본 패키지 관리자는 계속 `pnpm`이며, 완전히 지원되고 문서 도구에서 사용됩니다. Bun은 `pnpm-lock.yaml`을 사용할 수 없으며 이를 무시합니다.

## 설치

<Steps>
  <Step title="종속성 설치">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb`은 gitignore 처리되므로 저장소에 변경 사항이 생기지 않습니다. 잠금 파일 쓰기를 완전히 건너뛰려면 다음을 실행하십시오.

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

## 수명 주기 스크립트

Bun은 명시적으로 신뢰하도록 설정하지 않은 종속성 수명 주기 스크립트를 차단합니다. 이 저장소에서 일반적으로 차단되는 다음 스크립트는 필요하지 않습니다.

- `baileys` `preinstall`: Node 주 버전이 20 이상인지 확인합니다(OpenClaw에는 Node 22.19+ 또는 23.11+가 필요하며, Node 24를 권장합니다).
- `protobufjs` `postinstall`: 호환되지 않는 버전 체계에 관한 경고를 출력합니다(빌드 아티팩트 없음).

이러한 스크립트가 필요한 런타임 문제가 발생하면 명시적으로 신뢰하도록 설정하십시오.

```sh
bun pm trust baileys protobufjs
```

## 주의 사항

일부 패키지 스크립트(예: `check:docs`, `ui:*`, `protocol:check`)는 내부적으로 `pnpm`을 하드코딩합니다. `bun run`으로 실행해도 `pnpm`을 셸에서 호출하므로, 이러한 스크립트는 `pnpm`으로 직접 실행하십시오.

## 관련 문서

- [설치 개요](/ko/install)
- [Node.js](/ko/install/node)
- [업데이트](/ko/install/updating)
