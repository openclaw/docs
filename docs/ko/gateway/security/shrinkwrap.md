---
read_when:
    - OpenClaw 릴리스에서 npm shrinkwrap이 무엇을 의미하는지 알고 싶습니다
    - 패키지 잠금 파일, 의존성 변경 사항 또는 공급망 위험을 검토하고 있습니다
    - 게시하기 전에 루트 또는 Plugin npm 패키지를 검증하고 있습니다.
summary: OpenClaw 릴리스의 npm shrinkwrap에 대한 쉬운 영어 및 기술적 설명
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-12T15:22:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 소스 체크아웃은 `pnpm-lock.yaml`을 사용합니다. 게시된 OpenClaw npm 패키지는 npm의 게시 가능한 의존성 잠금 파일인 `npm-shrinkwrap.json`을 사용하므로, 패키지를 설치할 때 릴리스 과정에서 검토된 의존성 그래프가 사용됩니다.

## 중요한 이유

Shrinkwrap은 npm 패키지와 함께 제공되는 의존성 트리의 명세서입니다. npm에 설치할 정확한 전이 의존성 버전을 알려 줍니다.

| 파일                  | 적용되는 위치              | 의미                              |
| --------------------- | -------------------------- | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 소스 체크아웃     | 유지관리자 의존성 그래프          |
| `npm-shrinkwrap.json` | 게시된 npm 패키지          | 사용자를 위한 npm 설치 그래프     |
| `package-lock.json`   | 로컬 npm 앱                | OpenClaw 게시 계약이 아님          |

OpenClaw 릴리스에서는 다음을 의미합니다.

- 게시된 패키지는 설치 시 npm에 새로운 의존성 그래프를 임의로 생성하도록 요청하지 않습니다.
- 의존성 변경 사항은 잠금 파일의 diff에 포함되므로 검토할 수 있습니다.
- 릴리스 검증에서는 사용자가 설치할 그래프와 동일한 그래프를 테스트합니다.
- 패키지 크기 또는 네이티브 의존성과 관련된 예상치 못한 문제를 게시 전에 발견할 수 있습니다.

Shrinkwrap은 샌드박스가 아닙니다. Shrinkwrap 자체만으로 의존성을 안전하게 만들지는 않으며, 호스트 격리, `openclaw security audit`, 패키지 출처 또는 설치 스모크 테스트를 대체하지도 않습니다.

OpenClaw는 Gateway이자 Plugin 호스트, 모델 라우터 및 에이전트 런타임이므로 기본 설치는 시작 시간, 디스크 사용량, 네이티브 패키지 다운로드 및 공급망 노출에 영향을 줍니다. Shrinkwrap은 릴리스 검토에 안정적인 경계를 제공합니다. 검토자는 전이 의존성의 변경을 확인하고, 검증 도구는 예기치 않은 잠금 파일 변동을 거부하며, Plugin 패키지는 루트 패키지에 의존하지 않고 자체적으로 잠근 의존성 그래프를 포함합니다.

## 생성 및 확인

루트 `openclaw` npm 패키지, OpenClaw가 소유한 npm Plugin 패키지(예: `@openclaw/discord`) 및 [`@openclaw/ai`](/ko/reference/openclaw-ai) 같은 게시 가능한 워크스페이스 패키지는 게시할 때 `npm-shrinkwrap.json`을 포함합니다. 워크스페이스 의존성은 루트 패키지와 함께 게시되므로 루트 shrinkwrap에서 생략하며, 대신 게시 가능한 각 워크스페이스 패키지가 자체 전이 의존성 트리를 고정합니다. 적합한 Plugin 패키지는 명시적인 `bundledDependencies`와 함께 게시할 수도 있으며, 이 경우 설치 시점의 의존성 해석에만 의존하지 않고 런타임 의존성 파일을 Plugin tarball에 포함합니다.

```bash
# shrinkwrap으로 관리되는 모든 패키지(루트 + 게시 가능한 Plugin)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# 루트 패키지만
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# 현재 변경 세트의 영향을 받는 패키지만
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

생성기는 npm의 게시 가능한 잠금 형식을 해석하지만, 생성된 패키지 버전이 `pnpm-lock.yaml`에 이미 존재하지 않으면 거부합니다. 이를 통해 pnpm 의존성의 버전 경과 기간, 재정의 및 패치 검토 경계가 그대로 유지됩니다.

다음 항목은 보안에 민감한 요소로 검토하십시오.

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 번들된 Plugin 의존성 페이로드
- 모든 `package-lock.json` diff

OpenClaw 패키지 검증 도구는 새 루트 패키지 tarball에 shrinkwrap이 포함되어야 한다고 요구하며, 게시된 패키지의 `package-lock.json`을 거부합니다. Plugin npm 게시 경로는 Plugin 로컬 shrinkwrap을 확인하고 패키지 로컬 번들 의존성을 설치한 다음 패키징하거나 게시합니다.

## 게시된 패키지 검사

루트 패키지:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Plugin 패키지:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

배경 정보: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
