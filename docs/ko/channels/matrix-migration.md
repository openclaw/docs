---
read_when:
    - 기존 Matrix 설치 업그레이드하기
    - 암호화된 Matrix 기록 및 기기 상태 마이그레이션
summary: OpenClaw가 이전 Matrix Plugin을 제자리에서 업그레이드하는 방식, 암호화된 상태 복구 제한 및 수동 복구 단계 포함.
title: Matrix 마이그레이션
x-i18n:
    generated_at: "2026-04-30T06:18:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

이전 공개 `matrix` Plugin에서 현재 구현으로 업그레이드합니다.

대부분의 사용자는 기존 위치에서 그대로 업그레이드됩니다.

- Plugin은 `@openclaw/matrix`로 유지됩니다
- 채널은 `matrix`로 유지됩니다
- 구성은 `channels.matrix` 아래에 유지됩니다
- 캐시된 자격 증명은 `~/.openclaw/credentials/matrix/` 아래에 유지됩니다
- 런타임 상태는 `~/.openclaw/matrix/` 아래에 유지됩니다

구성 키 이름을 바꾸거나 새 이름으로 Plugin을 다시 설치할 필요가 없습니다.

## 마이그레이션이 자동으로 수행하는 작업

Gateway가 시작될 때와 [`openclaw doctor --fix`](/ko/gateway/doctor)를 실행할 때 OpenClaw는 이전 Matrix 상태를 자동으로 복구하려고 시도합니다.
실행 가능한 Matrix 마이그레이션 단계가 디스크의 상태를 변경하기 전에 OpenClaw는 집중 복구 스냅샷을 만들거나 재사용합니다.

`openclaw update`를 사용할 때 정확한 트리거는 OpenClaw 설치 방식에 따라 달라집니다.

- 소스 설치는 업데이트 흐름 중 `openclaw doctor --fix`를 실행한 다음 기본적으로 Gateway를 다시 시작합니다
- 패키지 관리자 설치는 패키지를 업데이트하고 비대화형 doctor 실행을 수행한 다음, 시작 시 Matrix 마이그레이션을 완료할 수 있도록 기본 Gateway 재시작에 의존합니다
- `openclaw update --no-restart`를 사용하면, 시작 기반 Matrix 마이그레이션은 나중에 `openclaw doctor --fix`를 실행하고 Gateway를 다시 시작할 때까지 지연됩니다

자동 마이그레이션에는 다음이 포함됩니다.

- `~/Backups/openclaw-migrations/` 아래에 마이그레이션 전 스냅샷을 만들거나 재사용
- 캐시된 Matrix 자격 증명 재사용
- 동일한 계정 선택 및 `channels.matrix` 구성 유지
- 가장 오래된 플랫 Matrix 동기화 저장소를 현재 계정 범위 위치로 이동
- 대상 계정을 안전하게 확인할 수 있을 때 가장 오래된 플랫 Matrix 암호화 저장소를 현재 계정 범위 위치로 이동
- 해당 키가 로컬에 있는 경우, 이전 rust 암호화 저장소에서 이전에 저장된 Matrix 룸 키 백업 복호화 키 추출
- 나중에 액세스 토큰이 변경될 때 동일한 Matrix 계정, 홈서버, 사용자에 대해 가장 완전한 기존 토큰 해시 저장소 루트 재사용
- Matrix 액세스 토큰은 변경되었지만 계정/디바이스 ID는 동일하게 유지된 경우, 보류 중인 암호화 상태 복원 메타데이터를 찾기 위해 형제 토큰 해시 저장소 루트 스캔
- 다음 Matrix 시작 시 백업된 룸 키를 새 암호화 저장소로 복원

스냅샷 세부 정보:

- OpenClaw는 성공적인 스냅샷 후 `~/.openclaw/matrix/migration-snapshot.json`에 마커 파일을 작성하여 이후 시작 및 복구 실행에서 같은 아카이브를 재사용할 수 있도록 합니다.
- 이러한 자동 Matrix 마이그레이션 스냅샷은 구성과 상태만 백업합니다(`includeWorkspace: false`).
- 예를 들어 `userId` 또는 `accessToken`이 아직 없어서 Matrix에 경고 전용 마이그레이션 상태만 있는 경우, 실행 가능한 Matrix 변경이 없으므로 OpenClaw는 아직 스냅샷을 만들지 않습니다.
- 스냅샷 단계가 실패하면 OpenClaw는 복구 지점 없이 상태를 변경하는 대신 해당 실행의 Matrix 마이그레이션을 건너뜁니다.

다중 계정 업그레이드 정보:

- 가장 오래된 플랫 Matrix 저장소(`~/.openclaw/matrix/bot-storage.json` 및 `~/.openclaw/matrix/crypto/`)는 단일 저장소 레이아웃에서 왔으므로 OpenClaw는 이를 하나의 확인된 Matrix 계정 대상으로만 마이그레이션할 수 있습니다
- 이미 계정 범위로 구성된 레거시 Matrix 저장소는 구성된 Matrix 계정별로 감지되고 준비됩니다

## 마이그레이션이 자동으로 수행할 수 없는 작업

이전 공개 Matrix Plugin은 Matrix 룸 키 백업을 자동으로 만들지 **않았습니다**. 로컬 암호화 상태를 저장하고 디바이스 인증을 요청했지만, 룸 키가 홈서버에 백업되었음을 보장하지 않았습니다.

따라서 일부 암호화된 설치는 부분적으로만 마이그레이션할 수 있습니다.

OpenClaw는 다음을 자동으로 복구할 수 없습니다.

- 백업된 적이 없는 로컬 전용 룸 키
- `homeserver`, `userId` 또는 `accessToken`을 아직 사용할 수 없어 대상 Matrix 계정을 확인할 수 없는 경우의 암호화 상태
- 여러 Matrix 계정이 구성되어 있지만 `channels.matrix.defaultAccount`가 설정되지 않은 경우 하나의 공유 플랫 Matrix 저장소 자동 마이그레이션
- 표준 Matrix 패키지 대신 저장소 경로에 고정된 사용자 지정 Plugin 경로 설치
- 이전 저장소에 백업된 키는 있었지만 복호화 키를 로컬에 보관하지 않은 경우의 누락된 복구 키

현재 경고 범위:

- 사용자 지정 Matrix Plugin 경로 설치는 Gateway 시작과 `openclaw doctor` 모두에서 표시됩니다

이전 설치에 백업된 적 없는 로컬 전용 암호화 기록이 있었다면, 업그레이드 후 일부 오래된 암호화 메시지는 계속 읽을 수 없을 수 있습니다.

## 권장 업그레이드 흐름

1. OpenClaw와 Matrix Plugin을 일반적인 방식으로 업데이트합니다.
   시작 시 Matrix 마이그레이션을 즉시 완료할 수 있도록 `--no-restart` 없이 일반 `openclaw update`를 사용하는 것을 권장합니다.
2. 다음을 실행합니다.

   ```bash
   openclaw doctor --fix
   ```

   Matrix에 실행 가능한 마이그레이션 작업이 있으면 doctor는 먼저 마이그레이션 전 스냅샷을 만들거나 재사용하고 아카이브 경로를 출력합니다.

3. Gateway를 시작하거나 다시 시작합니다.
4. 현재 인증 및 백업 상태를 확인합니다.

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 복구 중인 Matrix 계정의 복구 키를 계정별 환경 변수에 넣습니다. 단일 기본 계정의 경우 `MATRIX_RECOVERY_KEY`로 충분합니다. 여러 계정의 경우 예를 들어 `MATRIX_RECOVERY_KEY_ASSISTANT`처럼 계정별로 변수를 하나씩 사용하고 명령에 `--account assistant`를 추가합니다.

6. OpenClaw가 복구 키가 필요하다고 알려주면, 일치하는 계정에 대해 명령을 실행합니다.

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 이 디바이스가 아직 인증되지 않았다면, 일치하는 계정에 대해 명령을 실행합니다.

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   복구 키가 승인되고 백업을 사용할 수 있지만 `Cross-signing verified`가
   여전히 `no`이면, 다른 Matrix 클라이언트에서 자체 인증을 완료합니다.

   ```bash
   openclaw matrix verify self
   ```

   다른 Matrix 클라이언트에서 요청을 수락하고 이모지 또는 숫자를 비교한 뒤,
   일치할 때만 `yes`를 입력합니다. 명령은 `Cross-signing verified`가 `yes`가 된
   후에만 성공적으로 종료됩니다.

8. 복구할 수 없는 이전 기록을 의도적으로 포기하고 향후 메시지를 위한 새로운 백업 기준선을 원한다면 다음을 실행합니다.

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. 서버 측 키 백업이 아직 없다면, 향후 복구를 위해 하나를 만듭니다.

   ```bash
   openclaw matrix verify bootstrap
   ```

## 암호화된 마이그레이션 작동 방식

암호화된 마이그레이션은 2단계 프로세스입니다.

1. 암호화된 마이그레이션을 실행할 수 있는 경우, 시작 또는 `openclaw doctor --fix`가 마이그레이션 전 스냅샷을 만들거나 재사용합니다.
2. 시작 또는 `openclaw doctor --fix`가 활성 Matrix Plugin 설치를 통해 이전 Matrix 암호화 저장소를 검사합니다.
3. 백업 복호화 키가 발견되면 OpenClaw는 이를 새 복구 키 흐름에 기록하고 룸 키 복원을 보류 중으로 표시합니다.
4. 다음 Matrix 시작 시 OpenClaw는 백업된 룸 키를 새 암호화 저장소로 자동 복원합니다.

이전 저장소가 백업된 적 없는 룸 키를 보고하면, OpenClaw는 복구가 성공한 것처럼 처리하지 않고 경고합니다.

## 일반 메시지와 의미

### 업그레이드 및 감지 메시지

`Matrix plugin upgraded in place.`

- 의미: 디스크의 이전 Matrix 상태가 감지되어 현재 레이아웃으로 마이그레이션되었습니다.
- 수행할 작업: 같은 출력에 경고도 포함되어 있지 않다면 아무것도 하지 않아도 됩니다.

`Matrix migration snapshot created before applying Matrix upgrades.`

- 의미: OpenClaw가 Matrix 상태를 변경하기 전에 복구 아카이브를 만들었습니다.
- 수행할 작업: 마이그레이션이 성공했음을 확인할 때까지 출력된 아카이브 경로를 보관합니다.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 의미: OpenClaw가 기존 Matrix 마이그레이션 스냅샷 마커를 찾아 중복 백업을 만들지 않고 해당 아카이브를 재사용했습니다.
- 수행할 작업: 마이그레이션이 성공했음을 확인할 때까지 출력된 아카이브 경로를 보관합니다.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 의미: 이전 Matrix 상태가 있지만, Matrix가 구성되어 있지 않아 OpenClaw가 이를 현재 Matrix 계정에 매핑할 수 없습니다.
- 수행할 작업: `channels.matrix`를 구성한 다음 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 다시 시작합니다.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 의미: OpenClaw가 이전 상태를 찾았지만, 정확한 현재 계정/디바이스 루트를 아직 확인할 수 없습니다.
- 수행할 작업: 작동하는 Matrix 로그인으로 Gateway를 한 번 시작하거나, 캐시된 자격 증명이 생긴 후 `openclaw doctor --fix`를 다시 실행합니다.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 의미: OpenClaw가 하나의 공유 플랫 Matrix 저장소를 찾았지만, 어떤 이름 있는 Matrix 계정이 이를 받아야 하는지 추측하지 않습니다.
- 수행할 작업: `channels.matrix.defaultAccount`를 의도한 계정으로 설정한 다음 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 다시 시작합니다.

`Matrix legacy sync store not migrated because the target already exists (...)`

- 의미: 새 계정 범위 위치에 이미 동기화 또는 암호화 저장소가 있으므로 OpenClaw가 이를 자동으로 덮어쓰지 않았습니다.
- 수행할 작업: 충돌하는 대상을 수동으로 제거하거나 이동하기 전에 현재 계정이 올바른 계정인지 확인합니다.

`Failed migrating Matrix legacy sync store (...)` 또는 `Failed migrating Matrix legacy crypto store (...)`

- 의미: OpenClaw가 이전 Matrix 상태를 이동하려고 했지만 파일 시스템 작업이 실패했습니다.
- 수행할 작업: 파일 시스템 권한과 디스크 상태를 확인한 다음 `openclaw doctor --fix`를 다시 실행합니다.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 의미: OpenClaw가 이전 암호화된 Matrix 저장소를 찾았지만, 이를 연결할 현재 Matrix 구성이 없습니다.
- 수행할 작업: `channels.matrix`를 구성한 다음 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 다시 시작합니다.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 의미: 암호화 저장소가 있지만 OpenClaw가 이것이 어떤 현재 계정/디바이스에 속하는지 안전하게 판단할 수 없습니다.
- 수행할 작업: 작동하는 Matrix 로그인으로 Gateway를 한 번 시작하거나, 캐시된 자격 증명을 사용할 수 있게 된 후 `openclaw doctor --fix`를 다시 실행합니다.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 의미: OpenClaw가 하나의 공유 플랫 레거시 암호화 저장소를 찾았지만, 어떤 이름 있는 Matrix 계정이 이를 받아야 하는지 추측하지 않습니다.
- 수행할 작업: `channels.matrix.defaultAccount`를 의도한 계정으로 설정한 다음 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 다시 시작합니다.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 의미: OpenClaw가 이전 Matrix 상태를 감지했지만, 마이그레이션은 아직 누락된 ID 또는 자격 증명 데이터 때문에 차단되어 있습니다.
- 수행할 작업: Matrix 로그인 또는 구성 설정을 완료한 다음 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 다시 시작합니다.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 의미: OpenClaw가 오래된 암호화된 Matrix 상태를 찾았지만, 일반적으로 해당 저장소를 검사하는 Matrix Plugin의 헬퍼 진입점을 로드할 수 없었습니다.
- 조치: Matrix Plugin을 다시 설치하거나 복구한 뒤(`openclaw plugins install @openclaw/matrix`, 또는 repo 체크아웃의 경우 `openclaw plugins install ./path/to/local/matrix-plugin`) `openclaw doctor --fix`를 다시 실행하거나 Gateway를 재시작하세요.
- npm이 OpenClaw 소유 Matrix 패키지를 deprecated로 보고하면, 더 새로운 npm 패키지가 게시될 때까지 현재 패키징된 OpenClaw 빌드에 번들로 포함된
  Plugin 또는 로컬 체크아웃 경로를 사용하세요.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 의미: OpenClaw가 Plugin 루트를 벗어나거나 Plugin 경계 검사를 통과하지 못하는 헬퍼 파일 경로를 발견했으므로 가져오기를 거부했습니다.
- 조치: 신뢰할 수 있는 경로에서 Matrix Plugin을 다시 설치한 뒤 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 재시작하세요.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 의미: OpenClaw가 먼저 복구 스냅샷을 만들 수 없었기 때문에 Matrix 상태 변경을 거부했습니다.
- 조치: 백업 오류를 해결한 뒤 `openclaw doctor --fix`를 다시 실행하거나 Gateway를 재시작하세요.

`Failed migrating legacy Matrix client storage: ...`

- 의미: Matrix 클라이언트 측 fallback이 오래된 플랫 저장소를 찾았지만 이동에 실패했습니다. 이제 OpenClaw는 새 저장소로 조용히 시작하는 대신 해당 fallback을 중단합니다.
- 조치: 파일 시스템 권한이나 충돌을 검사하고, 기존 상태를 그대로 유지한 뒤 오류를 수정하고 다시 시도하세요.

`Matrix is installed from a custom path: ...`

- 의미: Matrix가 경로 설치로 고정되어 있으므로 mainline 업데이트가 repo의 표준 Matrix 패키지로 자동 교체하지 않습니다.
- 조치: 기본 Matrix Plugin으로 돌아가려면 `openclaw plugins install @openclaw/matrix`로 다시 설치하세요.
- npm이 OpenClaw 소유 Matrix 패키지를 deprecated로 보고하면, 더 새로운 npm 패키지가
  게시될 때까지 현재 패키징된 OpenClaw 빌드에 번들로 포함된
  Plugin을 사용하세요.

### 암호화된 상태 복구 메시지

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 의미: 백업된 방 키가 새 crypto 저장소로 성공적으로 복원되었습니다.
- 조치: 일반적으로 아무것도 하지 않아도 됩니다.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 의미: 일부 오래된 방 키가 기존 로컬 저장소에만 있었고 Matrix 백업에 업로드된 적이 없었습니다.
- 조치: 다른 검증된 클라이언트에서 해당 키를 수동으로 복구할 수 없는 한, 일부 오래된 암호화 기록은 계속 사용할 수 없을 것으로 예상하세요.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 의미: 백업은 존재하지만 OpenClaw가 복구 키를 자동으로 복구할 수 없었습니다.
- 조치: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`를 실행하세요.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 의미: OpenClaw가 오래된 암호화 저장소를 찾았지만, 복구 준비를 할 만큼 안전하게 검사할 수 없었습니다.
- 조치: `openclaw doctor --fix`를 다시 실행하세요. 반복되면 기존 상태 디렉터리를 그대로 유지하고 다른 검증된 Matrix 클라이언트와 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`를 사용해 복구하세요.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 의미: OpenClaw가 백업 키 충돌을 감지했으며 현재 recovery-key 파일을 자동으로 덮어쓰지 않았습니다.
- 조치: 복원 명령을 다시 시도하기 전에 어떤 복구 키가 올바른지 확인하세요.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 의미: 이는 기존 저장소 형식의 엄격한 한계입니다.
- 조치: 백업된 키는 여전히 복원할 수 있지만, 로컬 전용 암호화 기록은 계속 사용할 수 없을 수 있습니다.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 의미: 새 Plugin이 복원을 시도했지만 Matrix가 오류를 반환했습니다.
- 조치: `openclaw matrix verify backup status`를 실행한 뒤, 필요하면 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`로 다시 시도하세요.

### 수동 복구 메시지

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 의미: OpenClaw는 백업 키가 있어야 한다는 것을 알고 있지만, 이 기기에서 활성화되어 있지 않습니다.
- 조치: `openclaw matrix verify backup restore`를 실행하거나, 필요하면 `MATRIX_RECOVERY_KEY`를 설정하고 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`를 실행하세요.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 의미: 이 기기에는 현재 복구 키가 저장되어 있지 않습니다.
- 조치: `MATRIX_RECOVERY_KEY`를 설정하고 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`를 실행한 뒤 백업을 복원하세요.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 의미: 저장된 키가 활성 Matrix 백업과 일치하지 않습니다.
- 조치: `MATRIX_RECOVERY_KEY`를 올바른 키로 설정하고 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`를 실행하세요.

복구할 수 없는 오래된 암호화 기록을 잃는 것을 감수한다면, 대신
현재 백업 기준선을 `openclaw matrix verify backup reset --yes`로 재설정할 수 있습니다. 저장된
백업 secret이 손상된 경우, 이 재설정은 secret storage도 다시 생성하여
재시작 후 새 백업 키가 올바르게 로드되도록 할 수 있습니다.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 의미: 백업은 존재하지만, 이 기기가 아직 cross-signing 체인을 충분히 강하게 신뢰하지 않습니다.
- 조치: `MATRIX_RECOVERY_KEY`를 설정하고 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`를 실행하세요.

`Matrix recovery key is required`

- 의미: 복구 키가 필요한 단계에서 복구 키를 제공하지 않고 복구 단계를 시도했습니다.
- 조치: 예를 들어 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`처럼 `--recovery-key-stdin`을 사용하여 명령을 다시 실행하세요.

`Invalid Matrix recovery key: ...`

- 의미: 제공된 키를 파싱할 수 없거나 예상 형식과 일치하지 않았습니다.
- 조치: Matrix 클라이언트 또는 recovery-key 파일의 정확한 복구 키로 다시 시도하세요.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 의미: OpenClaw가 복구 키를 적용할 수는 있었지만, Matrix가 아직 이 기기에 대한
  완전한 cross-signing identity trust를 확립하지 않았습니다. 명령 출력에서
  `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, `Device verified by owner`를 확인하세요.
- 조치: `openclaw matrix verify self`를 실행하고, 다른
  Matrix 클라이언트에서 요청을 수락한 뒤 SAS를 비교하고 일치할 때만 `yes`를 입력하세요. 이
  명령은 성공을 보고하기 전에 완전한 Matrix identity trust를 기다립니다.
  현재 cross-signing identity를 의도적으로 교체하려는 경우에만
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  을 사용하세요.

`Matrix key backup is not active on this device after loading from secret storage.`

- 의미: secret storage가 이 기기에서 활성 백업 세션을 만들지 못했습니다.
- 조치: 먼저 기기를 검증한 뒤 `openclaw matrix verify backup status`로 다시 확인하세요.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 의미: 기기 검증이 완료될 때까지 이 기기는 secret storage에서 복원할 수 없습니다.
- 조치: 먼저 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`를 실행하세요.

### 사용자 지정 Plugin 설치 메시지

`Matrix is installed from a custom path that no longer exists: ...`

- 의미: Plugin 설치 기록이 더 이상 존재하지 않는 로컬 경로를 가리킵니다.
- 조치: `openclaw plugins install @openclaw/matrix`로 다시 설치하거나, repo 체크아웃에서 실행 중이라면 `openclaw plugins install ./path/to/local/matrix-plugin`를 실행하세요.
- npm이 OpenClaw 소유 Matrix 패키지를 deprecated로 보고하면, 더 새로운 npm 패키지가 게시될 때까지 현재 패키징된 OpenClaw 빌드에 번들로 포함된
  Plugin 또는 로컬 체크아웃 경로를 사용하세요.

## 암호화된 기록이 여전히 돌아오지 않는 경우

다음 검사를 순서대로 실행하세요.

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

백업이 성공적으로 복원되었지만 일부 오래된 방의 기록이 여전히 누락되어 있다면, 누락된 키는 이전 Plugin에서 백업한 적이 없었을 가능성이 높습니다.

## 향후 메시지를 위해 새로 시작하려는 경우

복구할 수 없는 오래된 암호화 기록을 잃는 것을 감수하고 앞으로 사용할 깨끗한 백업 기준선만 원한다면, 다음 명령을 순서대로 실행하세요.

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

그 후에도 기기가 여전히 검증되지 않은 상태라면, Matrix 클라이언트에서 SAS 이모지 또는 십진수 코드를 비교하고 일치함을 확인하여 검증을 완료하세요.

## 관련 항목

- [Matrix](/ko/channels/matrix): 채널 설정 및 구성.
- [Matrix push rules](/ko/channels/matrix-push-rules): 알림 라우팅.
- [Doctor](/ko/gateway/doctor): 상태 점검 및 자동 마이그레이션 트리거.
- [마이그레이션 가이드](/ko/install/migrating): 모든 마이그레이션 경로(머신 이동, 시스템 간 가져오기).
- [Plugins](/ko/tools/plugin): Plugin 설치 및 등록.
