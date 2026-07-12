---
read_when:
    - 파일 접근, 아카이브 추출, 작업 공간 저장소 또는 Plugin 파일 시스템 도우미 변경하기
summary: OpenClaw이 로컬 파일 접근을 안전하게 처리하는 방식과 선택 사항인 fs-safe Python 헬퍼가 기본적으로 비활성화된 이유
title: 안전한 파일 작업
x-i18n:
    generated_at: "2026-07-12T00:48:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw은 보안에 민감한 로컬 파일 작업에 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe)를 사용합니다. 여기에는 루트 범위로 제한된 읽기/쓰기, 원자적 교체, 아카이브 추출, 임시 작업 공간, JSON 상태 및 비밀 파일 처리가 포함됩니다.

이는 신뢰할 수 없는 경로 이름을 받는 신뢰할 수 있는 OpenClaw 코드를 위한 **라이브러리 안전장치**이지 샌드박스가 아닙니다. 실제 영향 범위는 여전히 호스트 파일 시스템 권한, OS 사용자, 컨테이너 및 에이전트/도구 정책에 의해 결정됩니다.

## 기본값: Python 도우미 사용 안 함

OpenClaw은 fs-safe POSIX Python 도우미를 기본적으로 **사용 안 함**으로 설정합니다.

- 운영자가 명시적으로 사용 설정하지 않는 한 Gateway는 영구 Python 사이드카를 생성하지 않아야 합니다.
- 대부분의 설치에는 추가적인 상위 디렉터리 변경 강화 기능이 필요하지 않습니다.
- Python을 비활성화하면 데스크톱, Docker, CI 및 번들 앱 환경 전반에서 런타임 동작을 예측 가능하게 유지할 수 있습니다.

OpenClaw은 _기본값_만 변경합니다. 명시적 설정은 항상 우선합니다.

```bash
# OpenClaw 기본 동작: Node 전용 fs-safe 폴백.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# 사용 가능한 경우 도우미를 사용하고, 사용할 수 없으면 폴백합니다.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# 도우미를 시작할 수 없으면 안전하게 실패합니다.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# 선택적인 명시적 인터프리터 경로.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

일반 fs-safe 환경 변수 이름인 `FS_SAFE_PYTHON_MODE`과 `FS_SAFE_PYTHON`도 사용할 수 있습니다.

도우미가 보안 체계의 일부라면 `auto`가 아닌 `require`를 사용하세요. 도우미를 시작할 수 없는 경우 `auto`는 경고 없이 Node 전용 동작으로 폴백합니다.

## Python 없이도 유지되는 보호 기능

도우미를 사용하지 않아도 OpenClaw은 다음과 같은 fs-safe의 Node 전용 안전장치를 계속 적용합니다.

- 상대 경로 이탈(`..`), 절대 경로 및 단순 이름만 허용되는 위치의 경로 구분자를 거부합니다.
- 임시방편인 `path.resolve(...).startsWith(...)` 검사 대신 신뢰할 수 있는 루트 핸들을 통해 작업을 해석합니다.
- 해당 정책이 필요한 API에서 심볼릭 링크 및 하드 링크 패턴을 거부합니다.
- API가 파일 내용을 반환하거나 사용하는 경우 식별 정보 검사를 수행하며 파일을 엽니다.
- 형제 임시 파일과 이름 변경을 통해 상태/구성 파일을 원자적으로 씁니다.
- 읽기 및 아카이브 추출에 바이트 제한을 적용합니다.
- API에서 요구하는 경우 비밀 및 상태 파일에 비공개 파일 모드를 적용합니다.

이는 단일 신뢰 운영자 경계 안에서 신뢰할 수 있는 Gateway 코드가 신뢰할 수 없는 모델/Plugin/채널 경로 입력을 처리하는 OpenClaw의 일반적인 위협 모델을 포괄합니다.

## Python이 추가하는 기능

POSIX에서 선택적 도우미는 하나의 영구 Python 프로세스를 유지하고 상위 디렉터리 변경 작업에 파일 설명자 기준 파일 시스템 작업을 사용합니다. 여기에는 이름 변경, 제거, 디렉터리 생성, 상태 조회/목록 조회 및 일부 쓰기 경로가 포함됩니다.

이를 통해 다른 프로세스가 검증과 변경 사이에 상위 디렉터리를 바꾸는 동일 UID 경쟁 조건의 가능성을 줄입니다. 즉, 신뢰할 수 없는 로컬 프로세스가 OpenClaw이 작업하는 동일한 디렉터리를 변경할 수 있는 호스트에서 심층 방어를 제공합니다.

배포 환경에 이러한 위험이 있고 Python이 반드시 존재한다면 다음을 설정하세요.

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Plugin 및 코어 지침

- 메시지, 모델 출력, 구성 또는 Plugin 입력에서 경로를 가져오는 경우 Plugin용 파일 접근은 원시 `fs`가 아닌 `openclaw/plugin-sdk/*` 도우미를 거쳐야 합니다.
- 코어 코드는 OpenClaw의 프로세스 정책이 일관되게 적용되도록 `src/infra/*` 아래의 fs-safe 래퍼를 사용해야 합니다.
- 아카이브 추출에는 크기, 항목 수, 링크 및 대상 제한을 명시한 fs-safe 아카이브 도우미를 사용해야 합니다.
- 비밀에는 OpenClaw 비밀 도우미 또는 fs-safe 비밀/비공개 상태 도우미를 사용해야 합니다. `fs.writeFile` 주변에 모드 검사를 직접 구현하지 마세요.
- 적대적인 로컬 사용자로부터 격리할 때는 fs-safe에만 의존하지 마세요. 별도의 OS 사용자/호스트로 각각의 Gateway를 실행하거나 샌드박스를 사용하세요.

관련 문서: [보안](/ko/gateway/security), [샌드박스](/ko/gateway/sandboxing), [실행 승인](/ko/tools/exec-approvals), [비밀](/ko/gateway/secrets).
