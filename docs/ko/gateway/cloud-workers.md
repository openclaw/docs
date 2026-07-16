---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: '일회용 클라우드 머신으로 세션을 디스패치합니다: 프로비저닝, 워커 런타임, 프록시된 추론 및 스트리밍 결과'
title: 클라우드 워커
x-i18n:
    generated_at: "2026-07-16T12:31:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

클라우드 워커를 사용하면 세션에 관한 모든 항목은 항상 있던 위치에 그대로 유지하면서, 일회용 클라우드 머신에서 세션의 에이전트 루프를 실행할 수 있습니다. 세션은 사이드바에 표시되고 실시간으로 스트리밍되며, 트랜스크립트는 Gateway가 소유합니다. Gateway는 박스를 임대하고, 고정된 버전의 OpenClaw를 설치하고, 세션의 워크스페이스를 동기화한 다음, 제한된 `openclaw worker` 프로세스에 턴 루프를 넘깁니다. 모델 호출은 Gateway를 통해 다시 프록시되므로 제공자 자격 증명이 사용자의 머신을 벗어나지 않으며, 제공자에는 하나의 연속된 스트림이 표시되므로 프롬프트 캐싱도 계속 작동합니다.

작업이 완료되거나 박스가 중단되면 머신은 폐기됩니다. 트랜스크립트, 워크스페이스 커밋, 배치 레코드와 같은 영구 상태는 Gateway에 유지됩니다.

<Note>
클라우드 워커는 선택 사항이며 프로필을 구성하기 전까지 표시되지 않습니다. 구성되지 않은 설치에서는 새로운 RPC, 구성 또는 UI가 표시되지 않습니다.
</Note>

## 실행 위치

| 관심 항목                                                 | 위치                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 에이전트 루프 + 도구(`exec`, `read`, `write`, `edit`, …) | 클라우드 워커 박스                                                                 |
| 모델 추론 및 제공자 자격 증명                | Gateway(`{provider, model}` 참조로 프록시됨)                               |
| 트랜스크립트(영구, 세션 저장소)                     | Gateway                                                                          |
| 사이드바로의 실시간 스트리밍                         | 워커의 재생 가능한 이벤트 스트림을 입력받는 Gateway 팬아웃                      |
| 워크스페이스 git 기록                                   | 자격 증명 없이 박스에서 작성되며, Gateway가 커밋을 인계받고 푸시/PR을 소유함 |

박스에는 `sshd` 이외의 인바운드 포트가 필요하지 않습니다. Gateway가 고정된 SSH를 통해 아웃바운드로 연결하고, 역방향 터널이 워커의 WebSocket을 다시 전달합니다. 번들 Crabbox 제공자는 공용 SSH 경로를 강제하고 관리형 Tailscale 등록을 비활성화합니다. 아웃바운드 인터넷 액세스는 제공자 정책에 따라 결정됩니다. 기본 AWS 프로필은 네트워크나 보안 그룹을 제한하지 않는 한 인터넷에 액세스할 수 있습니다.

## 요구 사항

- 워커 제공자 Plugin입니다. 번들 `crabbox` Plugin은 클라우드 백엔드(AWS, Hetzner 등) 전반의 임대를 중개하는 [Crabbox](https://github.com/openclaw/crabbox) CLI를 구동합니다. `crabbox` 바이너리는 제공자 자격 증명이 이미 구성된 상태로 `PATH`에 있어야 합니다(또는 `settings.binary` 설정). AWS 승인을 위해서는 Crabbox 0.38.1 이상이 필요합니다.
- Crabbox AWS 워커의 경우 유효한 `aws.instanceProfile`은 비어 있어야 합니다. 제공자는 할당 전에 `crabbox config show --json`을 확인한 다음, EC2 `DescribeInstances`에서 `providerMetadata.instanceProfileAttached: false`을 보고하도록 `crabbox inspect --json`에 요구합니다. 인스턴스 역할이 있거나 신뢰할 수 있는 메타데이터가 없는 임대는 중지되고 거부됩니다.
- 임대한 머신의 Node.js입니다. 일반 클라우드 이미지에는 대개 포함되어 있지 않으므로 프로필의 `setup` 명령으로 설치하십시오.
- 세션 소유의 관리형 워크트리가 있는 세션입니다(`worktree: true`으로 생성). 디스패치는 해당 워크트리의 콘텐츠를 이동하며, 일반 디렉터리는 매니페스트 미러로 동기화됩니다.

## 구성

`openclaw.json`의 `cloudWorkers.profiles` 아래에 프로필을 추가하십시오.

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

프로필 필드:

| 키        | 의미                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Plugin이 등록한 워커 제공자 ID(번들 Plugin의 경우 `crabbox`).                                                                                                                                                                  |
| `install`  | `bundle`(기본값)은 실행 중인 Gateway의 빌드를 배포하고, `npm`은 무결성이 고정된 정확한 출시 Gateway 버전을 설치합니다. `npm`을 사용하려면 Gateway가 패키징된 릴리스에서 실행되어야 합니다.                                                      |
| `settings` | 제공자가 소유하는 JSON입니다. crabbox의 경우 `provider`(백엔드), `class`(머신 클래스), `ttl`, `idleTimeout`(Go 기간), 선택적 `setup` 및 절대 `binary` 경로입니다. OpenClaw는 이러한 임대에 공용 SSH를 강제하고 관리형 Tailscale을 비활성화합니다. |
| `lifetime` | 선택적 저장 정책(`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                           |

### 설정 명령

`settings.setup`은 임대된 박스가 SSH 준비 상태가 된 후 OpenClaw가 설치되기 전에 실행됩니다. 중단된 디스패치 후 재실행하는 경우를 포함하여 **모든** 프로비저닝 시도에서 실행되므로 멱등성을 갖춰야 합니다. 예시처럼 `command -v`/`test -x` 검사로 설치를 보호하십시오. 설정이 실패하면 제공자는 임대를 중지하고 디스패치를 실패로 종료합니다. 절반만 구성된 박스가 실행 상태로 남지 않습니다.

### 설치 채널

- **`bundle`**은 실행 중인 Gateway의 `dist`, 정리된 `package.json`, 빌드에서 참조하는 모든 워크스페이스 패키지를 패킹하며, 이 모두에는 콘텐츠 해시가 적용됩니다. 박스는 수정되지 않은 번들을 해당 해시로 검증한 다음 프로덕션 npm 종속성을 설치합니다(스크립트 비활성화). 워커에서 개발 빌드를 실행할 때 이 방식을 사용합니다.
- **`npm`**은 공개 레지스트리에 릴리스가 존재함을 증명하고, SHA-512 무결성을 고정하며, Gateway와 정확히 일치하는 `openclaw@<version>`을 설치합니다.

## 세션 디스패치

Control UI에서 **New Session**을 열고, 구성된 런타임이 OpenClaw인 에이전트를 선택한 다음, **Where** 메뉴에서 구성된 **Cloud · profile** 대상을 선택하고 작업을 시작하십시오. 클라우드를 선택하면 필수 관리형 워크트리가 자동으로 활성화됩니다. Gateway는 세션을 생성하고 디스패치를 완료한 후에만 첫 번째 턴을 전송합니다. 세션 사이드바의 서버 배지는 영구 배치 상태를 표시합니다. 외부 CLI 세션 카탈로그에는 클라우드 대상이 제공되지 않습니다.

동등한 RPC 흐름은 다음과 같습니다.

관리형 워크트리가 있는 세션을 생성한 후 디스패치하십시오(RPC에는 `operator.admin`이 필요하며 프로필이 구성된 경우에만 존재함).

클라우드 워커는 OpenClaw 에이전트 런타임을 실행합니다. 해당 런타임으로 해석되는 `openai/*` 또는 다른 모델을 선택하십시오. `claude-cli`과 같은 외부 CLI 런타임으로 구성된 세션은 디스패치할 수 없습니다.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch`은 로컬 턴 수락을 닫고, 활성 작업을 드레이닝하고, 임대를 프로비저닝하고, 설정을 실행하고, OpenClaw를 부트스트랩하고, 워크스페이스를 동기화하며, 배치가 `active` 워커 소유권에 도달하면 반환됩니다. 첫 디스패치에는 몇 분 정도를 예상하십시오. 제공자가 지원하는 경우 임대와 설치가 캐시됩니다. 이후에는 평소와 같이 세션과 대화하십시오. 턴은 자동으로 워커로 라우팅됩니다.

완료된 워커 턴은 턴 클레임이 해제되기 전에 적격하고 크기 제한을 충족하는 워크스페이스 파일을 세션의 관리형 워크트리로 다시 조정합니다. 터미널 워커 이벤트는 승인되기 전에 영구 보류 결과 펜스를 생성하므로, Gateway가 재시작되면 오래된 턴 정리에서 소유자를 삭제하기 전에 원격 워크스페이스를 다시 가져옵니다. 조정은 워커 매니페스트를 인증하고, 어느 쪽도 덮어쓰지 않고 로컬 분기가 발생하면 중지됩니다. 파일을 변경하기 전에 Gateway는 크기가 제한된 롤백 저널을 SQLite 상태 데이터베이스에 저장합니다. Gateway 프로세스가 중단된 후 재시도하면 해당 저널을 복구합니다. 워크스페이스 결과에는 Git 파일 의미 체계가 적용됩니다. 일반 파일, 실행 가능 비트, 심볼릭 링크, 추가, 변경 및 삭제는 유지되지만 빈 디렉터리와 기타 디렉터리 모드는 유지되지 않습니다. 원격 커밋 객체는 유지되지 않습니다. 결과 파일 변경 사항은 일반적인 검토와 커밋을 위해 관리형 워크트리에 남습니다.

작업이 완료되고 실행 중인 턴이 없으면 세션 메뉴를 열고 **Stop cloud worker…**를 선택하십시오. Gateway는 환경을 삭제하기 전에 마지막으로 워크스페이스 조정을 수행합니다. 이미 `draining` 또는 `reconciling` 상태인 배치는 해제를 마무리하는 중입니다. 세션을 삭제하기 전에 배지가 `reclaimed` 상태가 될 때까지 기다리십시오.

연결된 워커가 손상되었거나 제어 불능 상태인 경우 운영자는 최후의 수단으로 `{ "force": true }`을 사용하여 `environments.destroy`을 호출할 수 있습니다. 강제 해제는 배치를 실패 상태로 영구 표시하고, 조정되지 않은 원격 결과를 포기한 후 환경을 삭제합니다.

동등한 관리 RPC는 다음과 같습니다.

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

배치는 영구 상태 머신(`local → requested → provisioning → syncing → starting → active`)을 통해 이동하므로, 디스패치 도중 Gateway가 재시작되어도 머신을 누수하는 대신 조정합니다. 모델 턴에 실패해도 활성 배치는 재시도할 수 있도록 유지됩니다. 인바운드 워크스페이스 조정에 실패한 경우에도 워커는 활성 상태로 유지되므로, 운영자는 원격 결과를 잃지 않고 로컬 충돌을 해결한 후 재시도할 수 있습니다. 반면 수명 주기 실패가 발생하면 배치가 오류 또는 회수 상태로 이동하고 진단 로그의 마지막 부분이 보존됩니다.

## 보안 모델

- **폐쇄형 워커 인그레스.** 워커는 폐쇄형 메서드 허용 목록이 적용된 터널 소켓에서 전용 프로토콜로 통신합니다. 워커는 운영자 RPC를 호출할 수 없습니다.
- **발급된 자격 증명, 저장 시 해싱.** 각 디스패치는 워커 자격 증명을 발급하며, Gateway는 그 해시만 저장합니다. 자격 증명 순환과 소유자 에포크 펜싱을 통해 세션당 활성 소유자가 최대 하나만 존재하도록 보장합니다. 오래된 워커가 다시 연결되면 병합되지 않고 항상 차단됩니다.
- **호스트 키 고정.** 제공자는 프로비저닝 시 박스의 SSH 호스트 키를 제공해야 합니다. 부트스트랩은 엄격한 고정을 사용하여 연결하며 키가 없으면 안전하게 실패합니다.
- **박스에 상시 유지되는 모델, 포지 또는 클라우드 자격 증명이 없음.** 모델 인증은 Gateway에 유지되고(추론은 `{provider, model}` 참조로 이동), 워크스페이스 git 커밋은 포지 자격 증명 없이 작성되며, Crabbox AWS 임대 메타데이터는 설정 전에 인스턴스 역할이 있는지 신뢰할 수 있는 방식으로 검사됩니다. 설정 명령에도 자격 증명을 포함하지 마십시오.
- **제공자 소유 이그레스.** 역방향 터널 덕분에 OpenClaw는 모델에 직접 액세스할 필요가 없지만, OpenClaw는 제공자의 방화벽을 재작성하지 않습니다. 작업에 필요한 경우 워커 제공자에서 아웃바운드 트래픽을 제한하십시오.
- **영구적이며 정확히 한 번 기록되는 트랜스크립트.** 워커는 세션의 리프에 대해 비교 후 교환 프로토콜을 사용하여 트랜스크립트 배치를 커밋합니다. 오래된 기준이 감지되면 유료 출력을 중복하거나 리베이스하는 대신 실행을 즉시 중단합니다.

## 문제 해결

- **`sessions.dispatch`은(는) 알 수 없는 메서드입니다** — 구성된 `cloudWorkers.profiles`이(가) 없거나 호출자에게 `operator.admin`이(가) 없습니다.
- **"클라우드 워커 턴에는 OpenClaw 런타임이 필요합니다"** — 구성된 런타임이 OpenClaw인 모델을 선택하십시오. `claude-cli` 같은 외부 CLI 런타임은 워커 추론을 지원하지 않습니다.
- **"워커 부트스트랩에는 임대한 호스트에 Node.js가 필요합니다"** — `settings.setup`에 Node 설치를 추가하십시오(위 내용 참조).
- **AWS 인스턴스 역할 증명에 실패합니다** — `aws.instanceProfile`을(를) 지우십시오(`CRABBOX_AWS_INSTANCE_PROFILE`이(가) 설정된 경우 함께 지우십시오). Crabbox 0.38.1 이상을 설치하십시오. 이전 바이너리는 AWS 승인에 필요한 권위 있는 `providerMetadata.instanceProfileAttached` 계약을 노출하지 않습니다.
- **공급자 오류로 디스패치에 실패합니다** — 배치 레코드와 `environments.list`은(는) 설정/부트스트랩 stderr 끝부분을 포함한 마지막 오류를 보관합니다. 실패 시 박스가 폐기되므로 이 끝부분이 주요 포렌식 자료입니다.
- **디스패치 중 클라이언트 시간 초과가 발생합니다** — `openclaw gateway call`의 기본 시간 제한은 10초입니다. `--timeout`을(를) 넉넉하게 전달하십시오(어느 경우든 디스패치는 서버 측에서 계속 실행되며, 프로비저닝 중 재시도는 `session cannot dispatch from placement provisioning`(으)로 거부됩니다).
- **임대 관리** — `crabbox list --provider <backend>`은(는) 활성 임대를 표시하며, `crabbox stop --provider <backend> --id <lease>`은(는) 임대를 하나 수동으로 해제합니다. 유휴 임대는 프로필의 `idleTimeout`에 따라 만료됩니다.

## 관련 항목

- [샌드박싱](/ko/gateway/sandboxing) — 로컬 도구 실행의 피해 범위 축소
- [세션 CLI](/ko/cli/sessions) — 저장된 세션 검사
- [구성 참조](/ko/gateway/configuration-reference)
