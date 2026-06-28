---
read_when:
    - 파일 액세스, 아카이브 추출, 워크스페이스 저장소 또는 Plugin 파일 시스템 헬퍼 변경
summary: OpenClaw가 로컬 파일 접근을 안전하게 처리하는 방식과 선택 사항인 fs-safe Python 헬퍼가 기본적으로 비활성화되어 있는 이유
title: 안전한 파일 작업
x-i18n:
    generated_at: "2026-05-06T06:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw는 보안에 민감한 로컬 파일 작업에 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe)를 사용합니다. 여기에는 루트 경계 읽기/쓰기, 원자적 교체, 아카이브 추출, 임시 워크스페이스, JSON 상태, 비밀 파일 처리가 포함됩니다.

목표는 신뢰할 수 없는 경로 이름을 받는 신뢰할 수 있는 OpenClaw 코드에 일관된 **라이브러리 가드레일**을 제공하는 것입니다. 샌드박스가 아닙니다. 호스트 파일시스템 권한, OS 사용자, 컨테이너, 에이전트/도구 정책이 여전히 실제 영향 범위를 정의합니다.

## 기본값: Python 헬퍼 없음

OpenClaw는 fs-safe POSIX Python 헬퍼를 기본적으로 **꺼짐**으로 설정합니다.

이유:

- Gateway는 운영자가 명시적으로 선택하지 않은 한 지속 실행되는 Python 사이드카를 생성하지 않아야 합니다.
- 많은 설치 환경에는 추가적인 상위 디렉터리 변경 강화가 필요하지 않습니다.
- Python을 비활성화하면 데스크톱, Docker, CI, 번들 앱 환경 전반에서 패키지/런타임 동작을 더 예측 가능하게 유지할 수 있습니다.

OpenClaw는 기본값만 변경합니다. 모드를 명시적으로 설정하면 fs-safe가 이를 따릅니다.

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

일반 fs-safe 이름도 사용할 수 있습니다: `FS_SAFE_PYTHON_MODE` 및 `FS_SAFE_PYTHON`.

## Python 없이도 보호되는 항목

헬퍼가 꺼져 있어도 OpenClaw는 다음에 fs-safe의 Node 경로를 계속 사용합니다.

- `..`, 절대 경로, 이름만 허용되는 위치의 경로 구분자처럼 상대 경로 이탈을 거부합니다.
- 임시 `path.resolve(...).startsWith(...)` 검사 대신 신뢰할 수 있는 루트 핸들을 통해 작업을 확인합니다.
- 해당 정책이 필요한 API에서 심볼릭 링크와 하드 링크 패턴을 거부합니다.
- API가 파일 내용을 반환하거나 소비하는 경우 ID 검사와 함께 파일을 엽니다.
- 상태/구성 파일에 대해 형제 임시 파일을 사용하는 원자적 쓰기를 수행합니다.
- 읽기와 아카이브 추출에 바이트 제한을 적용합니다.
- API가 요구하는 경우 비밀과 상태 파일에 private 모드를 적용합니다.

이러한 보호는 일반적인 OpenClaw 위협 모델, 즉 단일 신뢰할 수 있는 운영자 경계 안에서 신뢰할 수 있는 Gateway 코드가 신뢰할 수 없는 모델/Plugin/채널 경로 입력을 처리하는 상황을 포괄합니다.

## Python이 추가하는 것

POSIX에서 fs-safe의 선택적 헬퍼는 지속 실행되는 Python 프로세스 하나를 유지하고 rename, remove, mkdir, stat/list, 일부 쓰기 경로 같은 상위 디렉터리 변경에 fd 상대 파일시스템 작업을 사용합니다.

이는 다른 프로세스가 검증과 변경 사이에 상위 디렉터리를 바꿀 수 있는 같은 UID 경합 창을 좁힙니다. 신뢰할 수 없는 로컬 프로세스가 OpenClaw가 작업 중인 동일한 디렉터리를 수정할 수 있는 호스트를 위한 심층 방어입니다.

배포 환경에 그런 위험이 있고 Python이 존재함이 보장된다면 다음을 사용하세요.

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

헬퍼가 보안 태세의 일부라면 `auto` 대신 `require`를 사용하세요. `auto`는 헬퍼를 사용할 수 없는 경우 의도적으로 Node 전용 동작으로 폴백합니다.

## Plugin 및 코어 지침

- Plugin 대상 파일 접근은 경로가 메시지, 모델 출력, 구성, Plugin 입력에서 오는 경우 원시 `fs`가 아니라 `openclaw/plugin-sdk/*` 헬퍼를 통해 이루어져야 합니다.
- 코어 코드는 OpenClaw의 프로세스 정책이 일관되게 적용되도록 `src/infra/*` 아래의 로컬 fs-safe 래퍼를 사용해야 합니다.
- 아카이브 추출은 명시적인 크기, 항목 수, 링크, 대상 제한과 함께 fs-safe 아카이브 헬퍼를 사용해야 합니다.
- 비밀은 OpenClaw 비밀 헬퍼 또는 fs-safe 비밀/private-state 헬퍼를 사용해야 합니다. `fs.writeFile` 주변에 모드 검사를 직접 구현하지 마세요.
- 적대적인 로컬 사용자 격리가 필요하다면 fs-safe만으로는 충분하지 않습니다. 별도의 OS 사용자/호스트에서 별도의 Gateway를 실행하거나 샌드박싱을 사용하세요.

관련 항목: [보안](/ko/gateway/security), [샌드박싱](/ko/gateway/sandboxing), [Exec 승인](/ko/tools/exec-approvals), [비밀](/ko/gateway/secrets).
