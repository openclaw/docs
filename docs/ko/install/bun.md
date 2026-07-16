---
read_when:
    - Bun으로 종속성을 설치하거나 패키지 스크립트를 실행하려고 합니다
    - Bun 설치/패치/수명 주기 스크립트 문제가 발생했습니다
summary: 설치 및 패키지 스크립트에는 Bun 워크플로를 사용하며, 런타임에는 Node가 필요합니다.
title: Bun
x-i18n:
    generated_at: "2026-07-16T12:40:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun은 필수 `node:sqlite` API를 제공하지 않으므로 OpenClaw CLI 또는 Gateway를 실행할 수 없습니다. 모든 OpenClaw 런타임 명령을 실행하려면 지원되는 Node 버전을 설치하십시오.
</Warning>

Bun은 선택적 의존성 설치 프로그램 및 패키지 스크립트 실행기로 계속 사용할 수 있습니다. 기본 패키지 관리자는 완전히 지원되며 문서 도구에서 사용하는 `pnpm`입니다. Bun은 `pnpm-lock.yaml`을 사용할 수 없으며 이를 무시합니다.

## 설치

<Steps>
  <Step title="의존성 설치">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb`은 gitignore에 포함되어 있으므로 저장소에 변경 사항이 발생하지 않습니다. 잠금 파일 쓰기를 완전히 건너뛰려면 다음을 실행하십시오.

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="빌드 및 테스트">
    ```sh
    bun run build
    bun run vitest run
    ```

    OpenClaw 자체를 실행하는 명령은 여전히 Node를 통해 실행해야 합니다.

  </Step>
</Steps>

## 수명 주기 스크립트

Bun은 명시적으로 신뢰하도록 설정하지 않은 의존성 수명 주기 스크립트를 차단합니다. 이 저장소에서 일반적으로 차단되는 다음 스크립트는 필요하지 않습니다.

- `baileys` `preinstall`: Node 주 버전이 20 이상인지 확인합니다(OpenClaw에는 Node 22.22.3+, 24.15+ 또는 25.9+가 필요하며 Node 24를 권장합니다).
- `protobufjs` `postinstall`: 호환되지 않는 버전 체계에 관한 경고를 표시합니다(빌드 산출물 없음).

이러한 스크립트가 필요한 런타임 문제가 발생하면 다음과 같이 명시적으로 신뢰하도록 설정하십시오.

```sh
bun pm trust baileys protobufjs
```

## 주의 사항

일부 패키지 스크립트는 내부적으로 `pnpm`을 하드코딩합니다(예: `check:docs`, `ui:*`, `protocol:check`). `bun run`을 통해 실행해도 여전히 셸에서 `pnpm`을 실행하므로 해당 스크립트는 `pnpm`을 통해 직접 실행하십시오.

## 관련 문서

- [설치 개요](/ko/install)
- [Node.js](/ko/install/node)
- [업데이트](/ko/install/updating)
