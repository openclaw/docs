---
doc-schema-version: 1
read_when:
    - 여러 사용자 또는 조직을 위해 OpenClaw를 호스팅하고 있습니다
    - 테넌트 워크로드의 격리 경계를 선택해야 합니다
summary: 여러 테넌트 신뢰 도메인을 테넌트별로 격리된 하나의 OpenClaw Gateway 셀로 호스팅합니다
title: 멀티테넌트 호스팅
x-i18n:
    generated_at: "2026-07-16T12:40:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# 멀티테넌트 호스팅

OpenClaw의 기본 보안 모델은 하나의 공유 Gateway 내부에서 적대적인 멀티테넌트 격리를 제공하는 것이 아니라, Gateway마다 하나의 신뢰할 수 있는 운영자 경계를 두는 것입니다. 따라서 신뢰 경계를 공유하지 않는 사용자나 조직을 호스팅하려면 테넌트마다 완전히 분리된 OpenClaw 인스턴스를 실행해야 합니다.

`openclaw fleet`에서는 격리된 각 인스턴스를 **셀**이라고 부릅니다. 셀은 강화된 컨테이너에서 실행되는 완전한 Gateway이며, 자체 상태, 자격 증명, 워크스페이스, 채널 계정, 토큰 및 루프백 전용 호스트 포트를 갖습니다.

Fleet은 **실험적 기능**입니다. 해당 명령, 플래그 및 컨테이너 프로필은 지원 중단 유예 기간 없이 릴리스 간에 변경될 수 있습니다.

Fleet은 Linux 및 macOS 호스트에서 테스트되었습니다. Windows 호스트는 현재 테스트되지 않았습니다.

## 각 테넌트에 셀이 필요한 이유

하나의 Gateway 내부에서 인증된 운영자는 신뢰할 수 있는 제어 영역 역할을 갖습니다. 세션 ID는 라우팅을 선택할 뿐이며, 한 테넌트가 다른 테넌트에 접근하도록 권한을 부여하지는 않습니다. 에이전트 샌드박싱은 신뢰할 수 없는 콘텐츠와 도구 실행의 영향을 줄일 수 있지만, 하나의 공유 Gateway를 테넌트 권한 부여 경계로 바꾸지는 않습니다.

각 신뢰 도메인이 별도의 Gateway 프로세스, 컨테이너, 영구 상태 트리 및 Gateway 자격 증명을 갖도록 테넌트마다 하나의 셀을 사용하십시오. 이는 [Gateway 보안 모델](/ko/gateway/security)을 따릅니다. 상호 신뢰하지 않는 사용자를 하나의 OpenClaw 프로세스나 하나의 OS 사용자에 함께 배치하지 마십시오.

## 아키텍처

Fleet CLI는 호스트 측 수명 주기 감독자입니다. OpenClaw 상태 데이터베이스에 셀을 기록하고, 로컬 Docker 또는 Podman 런타임에 컨테이너 생성, 검사, 시작, 중지, 교체 및 제거를 요청합니다. Fleet의 바인드 경로와 루프백 URL은 로컬 호스트에 속하므로 원격 런타임 엔드포인트는 지원되지 않습니다. Fleet은 테넌트 메시지를 프록시하지 않으며 셀 간에 공유되는 애플리케이션 수준 데이터 경로를 추가하지 않습니다.

각 셀은 자체 사용자 정의 브리지 네트워크에서 공식 `ghcr.io/openclaw/openclaw` 이미지를 실행합니다. 별도의 브리지는 제공자와 채널을 위한 아웃바운드 NAT 접근은 유지하면서 셀 간의 직접적인 컨테이너 IP 트래픽을 차단합니다. 아웃바운드 송신은 기본적으로 제한되지 않습니다. Podman 셀은 `--network internal`을 사용하여 게시된 루프백 Gateway 포트를 유지하면서 송신을 차단할 수 있습니다. Docker 내부 네트워크에서는 해당 게시 포트가 작동하지 않으므로 Fleet은 이 조합을 거부합니다. 대신 `DOCKER-USER` 체인과 같은 호스트 방화벽 규칙으로 Docker 송신 정책을 적용하십시오. 셀 Gateway는 컨테이너 내부의 포트 `18789`에서 수신 대기하며, 런타임은 호스트의 `127.0.0.1:<allocated-port>`에만 이를 게시합니다. 원격 접근이 필요할 때 운영자는 승인된 역방향 프록시, SSH 터널 또는 tailnet을 해당 루프백 엔드포인트 앞에 배치할 수 있습니다.

영구 Gateway 상태는 `<state-dir>/fleet/cells/<tenant>/`에서 가져와 `/home/node/.openclaw`에 마운트됩니다. 인증 프로필 암호화 키는 별도의 `<state-dir>/fleet/auth-profile-secrets/<tenant>/` 호스트 경로에서 가져와 `/home/node/.config/openclaw`에 마운트되며, 공식 [Docker 영속성 레이아웃](/ko/install/docker#storage-and-persistence)과 일치합니다. 키는 일반 상태 마운트 아래에 중첩되지 않습니다. 테넌트별 채널 계정은 이를 소유한 셀 내부에서 종단됩니다. Fleet은 공유 채널 계정이나 인바운드 메시지 라우터를 제공하지 않습니다.

공식 이미지는 기본적으로 UID 1000인 루트가 아닌 `node` 사용자를 사용합니다. Fleet은 비공개 바인드 마운트를 쓰기 가능한 상태로 유지하기 위해 호스트와 호환되는 사용자 매핑을 사용합니다. Podman은 `keep-id`을 사용하고, 루트 권한 Docker는 호출한 비루트 ID를 사용하며, 루트리스 Docker는 컨테이너 루트를 권한이 없는 데몬 사용자에게 매핑합니다. 호스트 SELinux가 활성화되어 있으면 Docker와 Podman은 비공개 `:Z` 재레이블을 적용합니다. 컨테이너 프로필은 권한이 있는 호스트 기능을 피하고 루트리스 환경에 적합하지만, 루트리스 작동은 호스트 런타임의 선택 사항이자 전제 조건이며 Fleet이 자동으로 활성화하는 기능은 아닙니다.

## 신뢰 경계

멀티테넌시는 테넌트를 서로로부터 보호합니다. Fleet 운영자와 호스트는 모든 테넌트가 신뢰합니다. 침해된 호스트에 대한 방어는 목표가 아닙니다.

즉, 호스트 관리자는 컨테이너 구성과 환경을 검사하고, 마운트된 셀 데이터를 읽고, 이미지를 교체하거나 컨테이너에 진입할 수 있습니다. Gateway 토큰과 `--env`으로 전달된 값은 Docker 또는 Podman 검사를 통해 관리자에게 노출됩니다. 이에 맞게 호스트 제어, 관리 접근 정책, 모니터링, 백업 및 승인된 비밀 관리자를 사용하십시오.

기본 구성은 의도하지 않은 와일드카드 네트워크 노출을 방지하고 일반적인 컨테이너 권한 상승 수단을 제거하지만, 신뢰할 수 없는 호스트를 안전하게 만들지는 않습니다.

## 격리 단계

호스팅하는 테넌트에 적합한 경계를 선택하십시오.

1. **강화된 컨테이너 기본 구성.** Fleet은 모든 Linux 기능을 제거하고, `no-new-privileges`을 활성화하며, PID, 메모리, CPU 및 선택적인 쓰기 가능 계층 디스크 제한을 적용하고, 별도의 영구 마운트와 셀별 네트워크를 사용하며, 호스트 루프백에만 게시합니다. 브리지 네트워킹에서는 송신이 제한되지 않습니다. 셀이 아웃바운드 연결을 시작하지 못하게 해야 하는 경우 Podman `--network internal` 또는 Docker 호스트 방화벽 정책을 사용하십시오. 이는 운영자와 호스트를 신뢰하는 테넌트를 위한 기본 프로필입니다.
2. **더 강력한 컨테이너 또는 VM 격리.** 위험도가 높은 워크로드의 경우 gVisor 또는 Kata Containers와 같은 더 강력한 OCI 격리 런타임을 사용하도록 Docker나 Podman을 구성하거나, 셀을 microVM에 배치하십시오. 이는 런타임 또는 인프라 구성입니다. Fleet의 `--runtime docker|podman` 옵션은 OCI 격리 백엔드가 아니라 컨테이너 CLI를 선택합니다. Docker의 [대체 컨테이너 런타임](https://docs.docker.com/engine/daemon/alternative-runtimes/) 및 [Docker VM 런타임 가이드](/ko/install/docker-vm-runtime)를 참조하십시오.
3. **적대적인 테넌트를 위한 별도 머신.** 적대적인 테넌트를 하나의 OpenClaw 프로세스나 OS 사용자에 함께 배치하지 마십시오. 테넌트가 동일한 호스트 운영자를 신뢰하지 않거나 더 강력한 관리 경계가 필요한 경우, 런타임 관리가 분리된 별도의 VM 또는 물리적 호스트를 사용하십시오.

이 단계 중 어느 것도 OpenClaw 애플리케이션 신뢰 모델을 변경하지 않습니다. 하나의 Gateway는 여전히 하나의 신뢰할 수 있는 운영자 도메인입니다.

## 빠른 시작

셀을 생성하십시오. 이 명령은 생성된 Gateway 토큰을 한 번만 출력하므로 즉시 저장하십시오.

```bash
openclaw fleet create acme
```

Fleet 호스트에서 보고된 `http://127.0.0.1:<port>` URL을 열고 해당 테넌트의 토큰으로 인증한 다음, 셀 내부에서 제공자 자격 증명과 채널 계정을 구성하십시오.

컨테이너 상태와 Gateway 활성 상태를 확인하십시오.

```bash
openclaw fleet status acme
```

호스트 포트, 마운트된 데이터, 리소스 프로필, 사용자 제공 환경 및 Gateway 토큰을 유지하면서 업그레이드하십시오.

```bash
openclaw fleet upgrade acme
```

테넌트 데이터는 유지하면서 컨테이너와 레지스트리 행을 제거하십시오.

```bash
openclaw fleet rm acme --force
```

영구 테넌트 데이터도 삭제하려면 `--purge-data`을 추가하십시오. 완전 삭제에는 `--force`가 필요하며, 되돌릴 수 없고, 무엇이든 삭제하기 전에 확인된 경로에 대한 포함 관계 검사를 수행합니다.

```bash
openclaw fleet rm acme --purge-data --force
```

모든 명령과 옵션은 [`openclaw fleet` CLI 참조](/ko/cli/fleet)를 확인하십시오.

## 현재 범위

Fleet은 다음 기능을 제공하지 않습니다.

- 공유 채널 계정 또는 공유 인그레스 라우터
- 완전한 OpenClaw 인스턴스 대신 축소된 테넌트별 호스트 프로세스
- 하나의 감독자가 관리하는 원격 셀 호스트
- 테넌트 셀프서비스 포털, 청구 영역 또는 위임 관리 UI

이러한 기능에는 명시적인 ID, 라우팅, 권한 부여 및 장애 도메인 계약이 필요합니다. 하나의 Gateway 또는 해당 자격 증명을 테넌트 간에 공유하여 이를 모방하지 마십시오. Fleet은 단일 호스트 수명 주기 감독자입니다. 여러 머신에 걸치고 ID로 통제되는 Fleet에는 별도의 제어 영역 계층이 필요합니다.

## 관련 문서

- [`openclaw fleet`](/ko/cli/fleet)
- [Gateway 보안](/ko/gateway/security)
- [여러 Gateway](/ko/gateway/multiple-gateways)
- [Docker](/ko/install/docker)
- [Podman](/ko/install/podman)
