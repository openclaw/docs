---
read_when:
    - OpenClaw 릴리스에서 npm shrinkwrap이 무엇을 의미하는지 알고 싶습니다
    - 패키지 잠금 파일, 의존성 변경 사항 또는 공급망 위험을 검토하고 있습니다
    - 게시하기 전에 루트 또는 Plugin npm 패키지를 검증하고 있습니다
summary: OpenClaw 릴리스에서 npm shrinkwrap에 대한 쉬운 영어 및 기술적 설명
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:32:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 소스 체크아웃은 `pnpm-lock.yaml`을 사용합니다. 게시된 OpenClaw npm
패키지는 npm의 게시 가능한 의존성 잠금 파일인 `npm-shrinkwrap.json`을 사용하므로,
패키지 설치는 릴리스 중에 검토된 의존성 그래프를 사용합니다.

## 쉬운 설명

Shrinkwrap은 npm 패키지와 함께 제공되는 의존성 트리의 영수증입니다.
이는 npm에 설치할 정확한 전이적 패키지 버전을 알려 줍니다.

OpenClaw 릴리스에서 이는 다음을 의미합니다.

- 게시된 패키지는 설치 시점에 npm이 새 의존성 그래프를 만들어 내도록 요구하지 않습니다.
- 의존성 변경 사항이 잠금 파일에 나타나므로 검토하기가 더 쉬워집니다.
- 릴리스 검증은 사용자가 설치할 동일한 그래프를 테스트할 수 있습니다.
- 패키지 크기 또는 네이티브 의존성 관련 예상치 못한 문제를 게시 전에 더 쉽게 발견할 수 있습니다.

Shrinkwrap은 샌드박스가 아닙니다. 그 자체로 의존성을 안전하게 만들지 않으며,
호스트 격리, `openclaw security audit`, 패키지 출처, 설치 스모크 테스트를
대체하지 않습니다.

간단한 개념 모델은 다음과 같습니다.

| 파일                  | 중요한 위치         | 의미                     |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 소스 체크아웃 | 메인터이너 의존성 그래프       |
| `npm-shrinkwrap.json` | 게시된 npm 패키지    | 사용자를 위한 npm 설치 그래프       |
| `package-lock.json`   | 로컬 npm 앱           | OpenClaw 게시 계약이 아님 |

## OpenClaw가 이를 사용하는 이유

OpenClaw는 Gateway, Plugin 호스트, 모델 라우터, 에이전트 런타임입니다. 기본
설치는 시작 시간, 디스크 사용량, 네이티브 패키지 다운로드, 공급망 노출에
영향을 줄 수 있습니다.

Shrinkwrap은 릴리스 검토에 안정적인 경계를 제공합니다.

- 검토자는 전이적 의존성 이동을 볼 수 있습니다.
- 패키지 검증기는 예기치 않은 잠금 파일 변동을 거부할 수 있습니다.
- 패키지 승인 과정은 실제로 제공될 그래프로 설치를 테스트할 수 있습니다.
- Plugin 패키지는 Plugin 전용 의존성을 루트 패키지가 소유한다고 가정하지 않고
  자체 잠긴 의존성 그래프를 포함할 수 있습니다.

목표는 "잠금 파일을 더 많이 만드는 것"이 아닙니다. 목표는 명확한 소유권을 갖춘
재현 가능한 릴리스 설치입니다.

## 기술 세부 정보

루트 `openclaw` npm 패키지와 OpenClaw 소유 npm Plugin 패키지는 게시 시
`npm-shrinkwrap.json`을 포함합니다. 적합한 OpenClaw 소유 Plugin 패키지는
명시적 `bundledDependencies`와 함께 게시할 수도 있으므로, 런타임 의존성 파일이
설치 시점 해석에만 의존하지 않고 Plugin tarball에 포함됩니다.

다음과 같이 경계를 유지하세요.

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

생성기는 npm의 게시 가능한 잠금 형식을 해석하지만, `pnpm-lock.yaml`에 이미
존재하지 않는 생성된 패키지 버전은 거부합니다. 이를 통해 pnpm 의존성 연령,
오버라이드, 패치 검토 경계가 유지됩니다.

Plugin 패키지를 건드리지 않고 루트 패키지만 의도적으로 갱신할 때만 루트 전용
명령을 사용하세요.

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

다음 파일은 보안에 민감한 파일로 검토하세요.

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 번들된 Plugin 의존성 페이로드
- 모든 `package-lock.json` diff

OpenClaw 패키지 검증기는 새 루트 패키지 tarball에 shrinkwrap을 요구합니다.
Plugin npm 게시 경로는 Plugin 로컬 shrinkwrap을 확인하고, 패키지 로컬 번들
의존성을 설치한 다음, 패킹하거나 게시합니다. 패키지 검증기는 게시된 OpenClaw
패키지의 `package-lock.json`을 거부합니다.

게시된 루트 패키지를 검사하려면 다음을 사용하세요.

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

OpenClaw 소유 Plugin 패키지를 검사하려면 다음을 사용하세요.

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

배경: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
