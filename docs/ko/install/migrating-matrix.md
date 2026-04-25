---
read_when:
    - 기존 Matrix 설치 업그레이드
    - 암호화된 Matrix 기록 및 디바이스 상태 마이그레이션
summary: OpenClaw가 이전 Matrix Plugin을 제자리에서 업그레이드하는 방식, 여기에는 암호화된 상태 복구 한계와 수동 복구 단계가 포함됩니다.
title: Matrix 마이그레이션
x-i18n:
    generated_at: "2026-04-25T06:03:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

이 페이지는 이전 공개 `matrix` Plugin에서 현재 구현으로 업그레이드하는 과정을 다룹니다.

대부분의 사용자에게 업그레이드는 제자리에서 수행됩니다:

- Plugin은 계속 `@openclaw/matrix`
- 채널은 계속 `matrix`
- config는 계속 `channels.matrix` 아래에 유지
- 캐시된 credential은 계속 `~/.openclaw/credentials/matrix/` 아래에 유지
- 런타임 state는 계속 `~/.openclaw/matrix/` 아래에 유지

config 키 이름을 바꾸거나 새 이름으로 Plugin을 다시 설치할 필요는 없습니다.

## 마이그레이션이 자동으로 수행하는 작업

gateway가 시작될 때와 [`openclaw doctor --fix`](/ko/gateway/doctor)를 실행할 때, OpenClaw는 오래된 Matrix state를 자동으로 복구하려고 시도합니다.
실행 가능한 Matrix 마이그레이션 단계가 디스크상의 state를 변경하기 전에, OpenClaw는 집중된 복구 스냅샷을 생성하거나 재사용합니다.

`openclaw update`를 사용할 때 정확한 트리거는 OpenClaw 설치 방식에 따라 달라집니다:

- 소스 설치는 update 흐름 중 `openclaw doctor --fix`를 실행한 다음 기본적으로 gateway를 재시작합니다
- 패키지 관리자 설치는 패키지를 업데이트하고, 비대화형 doctor 패스를 실행한 다음, 시작 시 Matrix 마이그레이션을 마무리할 수 있도록 기본 gateway 재시작에 의존합니다
- `openclaw update --no-restart`를 사용하면, 시작 시 수행되는 Matrix 마이그레이션은 나중에 `openclaw doctor --fix`를 실행하고 gateway를 재시작할 때까지 연기됩니다

자동 마이그레이션이 다루는 항목:

- `~/Backups/openclaw-migrations/` 아래에 마이그레이션 전 스냅샷을 생성하거나 재사용
- 캐시된 Matrix credential 재사용
- 동일한 계정 선택 및 `channels.matrix` config 유지
- 가장 오래된 평면 Matrix sync 저장소를 현재 계정 범위 위치로 이동
- 대상 계정을 안전하게 해석할 수 있을 때 가장 오래된 평면 Matrix crypto 저장소를 현재 계정 범위 위치로 이동
- 해당 키가 로컬에 존재하는 경우, 오래된 rust crypto 저장소에서 이전에 저장된 Matrix room-key backup 복호화 키 추출
- 나중에 액세스 토큰이 바뀌더라도 동일한 Matrix 계정, homeserver, 사용자에 대해 가장 완전한 기존 token-hash 저장소 루트를 재사용
- Matrix 액세스 토큰이 바뀌었지만 계정/디바이스 identity는 동일한 경우, 보류 중인 암호화 state 복원 메타데이터를 위해 sibling token-hash 저장소 루트를 스캔
- 다음 Matrix 시작 시 백업된 room key를 새 crypto 저장소로 복원

스냅샷 세부 정보:

- OpenClaw는 스냅샷이 성공적으로 생성된 후 `~/.openclaw/matrix/migration-snapshot.json`에 마커 파일을 기록하므로, 이후 시작 및 복구 패스가 동일한 아카이브를 재사용할 수 있습니다.
- 이러한 자동 Matrix 마이그레이션 스냅샷은 config + state만 백업합니다(`includeWorkspace: false`).
- Matrix에 warning-only 마이그레이션 state만 있는 경우, 예를 들어 `userId` 또는 `accessToken`이 아직 누락된 경우에는 실행 가능한 Matrix 변경이 없으므로 OpenClaw는 아직 스냅샷을 생성하지 않습니다.
- 스냅샷 단계가 실패하면, OpenClaw는 복구 지점 없이 state를 변경하는 대신 해당 실행에서는 Matrix 마이그레이션을 건너뜁니다.

멀티 계정 업그레이드에 대해:

- 가장 오래된 평면 Matrix 저장소(`~/.openclaw/matrix/bot-storage.json` 및 `~/.openclaw/matrix/crypto/`)는 단일 저장소 레이아웃에서 왔으므로, OpenClaw는 이를 해석된 하나의 Matrix 계정 대상으로만 마이그레이션할 수 있습니다
- 이미 계정 범위가 적용된 레거시 Matrix 저장소는 구성된 각 Matrix 계정별로 감지되고 준비됩니다

## 마이그레이션이 자동으로 수행할 수 없는 작업

이전 공개 Matrix Plugin은 Matrix room-key backup을 자동으로 생성하지 **않았습니다**. 로컬 crypto state를 유지하고 디바이스 verification을 요청했지만, room key가 homeserver에 백업되었다는 보장은 하지 않았습니다.

즉, 일부 암호화된 설치는 부분적으로만 마이그레이션될 수 있습니다.

OpenClaw는 다음을 자동으로 복구할 수 없습니다:

- 한 번도 백업되지 않은 로컬 전용 room key
- `homeserver`, `userId`, `accessToken`을 아직 사용할 수 없어 대상 Matrix 계정을 아직 해석할 수 없는 경우의 암호화 state
- 여러 Matrix 계정이 구성되어 있지만 `channels.matrix.defaultAccount`가 설정되지 않은 경우, 하나의 공유 평면 Matrix 저장소 자동 마이그레이션
- 표준 Matrix 패키지 대신 repo 경로에 고정된 커스텀 Plugin 경로 설치
- 오래된 저장소에 백업된 키는 있었지만 복호화 키를 로컬에 유지하지 않았던 경우의 누락된 recovery key

현재 경고 범위:

- 커스텀 Matrix Plugin 경로 설치는 gateway 시작과 `openclaw doctor` 양쪽에서 모두 표시됩니다

오래된 설치에 한 번도 백업되지 않은 로컬 전용 암호화 기록이 있었다면, 업그레이드 후 일부 오래된 암호화 메시지는 여전히 읽을 수 없을 수 있습니다.

## 권장 업그레이드 흐름

1. OpenClaw와 Matrix Plugin을 일반적인 방식으로 업데이트합니다.
   시작 시 Matrix 마이그레이션을 즉시 마칠 수 있도록 `--no-restart` 없이 일반 `openclaw update`를 사용하는 것이 좋습니다.
2. 다음을 실행합니다:

   ```bash
   openclaw doctor --fix
   ```

   Matrix에 실행 가능한 마이그레이션 작업이 있으면 doctor가 먼저 마이그레이션 전 스냅샷을 생성하거나 재사용하고 아카이브 경로를 출력합니다.

3. gateway를 시작하거나 재시작합니다.
4. 현재 verification 및 backup 상태를 확인합니다:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClaw가 recovery key가 필요하다고 알려주면 다음을 실행합니다:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. 이 디바이스가 아직 검증되지 않았다면 다음을 실행합니다:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   recovery key가 수락되고 backup을 사용할 수 있는데도 `Cross-signing verified`
   가 여전히 `no`이면, 다른 Matrix 클라이언트에서 self-verification을 완료하세요:

   ```bash
   openclaw matrix verify self
   ```

   다른 Matrix 클라이언트에서 요청을 수락하고, 이모지 또는 십진수를 비교한 뒤 일치할 때만 `yes`를 입력하세요. 이 명령은
   `Cross-signing verified`가 `yes`가 된 후에만 성공적으로 종료됩니다.

7. 복구할 수 없는 오래된 기록을 의도적으로 포기하고 향후 메시지를 위한 새 backup 기준선을 원한다면 다음을 실행합니다:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. 서버 측 key backup이 아직 없다면, 향후 복구를 위해 하나를 생성합니다:

   ```bash
   openclaw matrix verify bootstrap
   ```

## 암호화된 마이그레이션 동작 방식

암호화된 마이그레이션은 2단계 과정입니다:

1. 시작 시 또는 `openclaw doctor --fix`가 암호화된 마이그레이션이 실행 가능할 경우 마이그레이션 전 스냅샷을 생성하거나 재사용합니다.
2. 시작 시 또는 `openclaw doctor --fix`가 활성 Matrix Plugin 설치를 통해 오래된 Matrix crypto 저장소를 검사합니다.
3. backup 복호화 키가 발견되면, OpenClaw는 이를 새 recovery-key 흐름에 기록하고 room-key 복원을 보류 상태로 표시합니다.
4. 다음 Matrix 시작 시, OpenClaw는 백업된 room key를 새 crypto 저장소로 자동 복원합니다.

오래된 저장소가 한 번도 백업되지 않은 room key를 보고하면, OpenClaw는 복구가 성공했다고 가장하는 대신 경고를 표시합니다.

## 일반적인 메시지와 그 의미

### 업그레이드 및 감지 메시지

`Matrix plugin upgraded in place.`

- 의미: 오래된 디스크상의 Matrix state가 감지되어 현재 레이아웃으로 마이그레이션되었습니다.
- 수행할 작업: 같은 출력에 경고가 함께 포함되지 않는 한 아무것도 하지 않아도 됩니다.

`Matrix migration snapshot created before applying Matrix upgrades.`

- 의미: OpenClaw가 Matrix state를 변경하기 전에 복구 아카이브를 생성했습니다.
- 수행할 작업: 마이그레이션이 성공했음을 확인할 때까지 출력된 아카이브 경로를 보관하세요.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 의미: OpenClaw가 기존 Matrix 마이그레이션 스냅샷 마커를 발견하고 중복 백업을 만드는 대신 해당 아카이브를 재사용했습니다.
- 수행할 작업: 마이그레이션이 성공했음을 확인할 때까지 출력된 아카이브 경로를 보관하세요.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 의미: 오래된 Matrix state가 존재하지만 Matrix가 구성되지 않아 OpenClaw가 이를 현재 Matrix 계정에 매핑할 수 없습니다.
- 수행할 작업: `channels.matrix`를 구성한 다음 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 의미: OpenClaw가 오래된 state를 발견했지만, 여전히 정확한 현재 계정/디바이스 루트를 결정할 수 없습니다.
- 수행할 작업: 정상적으로 Matrix 로그인이 된 상태로 gateway를 한 번 시작하거나, 캐시된 credential이 생긴 후 `openclaw doctor --fix`를 다시 실행하세요.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 의미: OpenClaw가 하나의 공유 평면 Matrix 저장소를 발견했지만, 이름 있는 Matrix 계정 중 어느 곳으로 보내야 할지 추측하지 않습니다.
- 수행할 작업: 의도한 계정으로 `channels.matrix.defaultAccount`를 설정한 다음 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Matrix legacy sync store not migrated because the target already exists (...)`

- 의미: 새 계정 범위 위치에 이미 sync 또는 crypto 저장소가 있으므로 OpenClaw가 이를 자동으로 덮어쓰지 않았습니다.
- 수행할 작업: 충돌하는 대상을 수동으로 제거하거나 이동하기 전에 현재 계정이 올바른 계정인지 확인하세요.

`Failed migrating Matrix legacy sync store (...)` 또는 `Failed migrating Matrix legacy crypto store (...)`

- 의미: OpenClaw가 오래된 Matrix state를 이동하려 했지만 파일 시스템 작업이 실패했습니다.
- 수행할 작업: 파일 시스템 권한과 디스크 상태를 점검한 뒤 `openclaw doctor --fix`를 다시 실행하세요.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 의미: OpenClaw가 오래된 암호화된 Matrix 저장소를 발견했지만 연결할 현재 Matrix config가 없습니다.
- 수행할 작업: `channels.matrix`를 구성한 다음 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 의미: 암호화 저장소는 존재하지만 OpenClaw가 이것이 어떤 현재 계정/디바이스에 속하는지 안전하게 결정할 수 없습니다.
- 수행할 작업: 정상적으로 Matrix 로그인이 된 상태로 gateway를 한 번 시작하거나, 캐시된 credential을 사용할 수 있게 된 후 `openclaw doctor --fix`를 다시 실행하세요.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 의미: OpenClaw가 하나의 공유 평면 레거시 crypto 저장소를 발견했지만, 이름 있는 Matrix 계정 중 어느 곳으로 보내야 할지 추측하지 않습니다.
- 수행할 작업: 의도한 계정으로 `channels.matrix.defaultAccount`를 설정한 다음 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 의미: OpenClaw가 오래된 Matrix state를 감지했지만, 마이그레이션이 여전히 누락된 identity 또는 credential 데이터 때문에 막혀 있습니다.
- 수행할 작업: Matrix 로그인 또는 config 설정을 완료한 다음 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 의미: OpenClaw가 오래된 암호화된 Matrix state를 발견했지만, 해당 저장소를 검사하는 Matrix Plugin의 helper 엔트리포인트를 로드할 수 없었습니다.
- 수행할 작업: Matrix Plugin을 다시 설치하거나 복구한 뒤(`openclaw plugins install @openclaw/matrix`, 또는 repo checkout의 경우 `openclaw plugins install ./path/to/local/matrix-plugin`), `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 의미: OpenClaw가 Plugin 루트를 벗어나거나 Plugin 경계 검사를 통과하지 못하는 helper 파일 경로를 발견하여 가져오기를 거부했습니다.
- 수행할 작업: 신뢰할 수 있는 경로에서 Matrix Plugin을 다시 설치한 뒤 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 의미: OpenClaw가 먼저 복구 스냅샷을 만들 수 없었기 때문에 Matrix state 변경을 거부했습니다.
- 수행할 작업: 백업 오류를 해결한 다음 `openclaw doctor --fix`를 다시 실행하거나 gateway를 재시작하세요.

`Failed migrating legacy Matrix client storage: ...`

- 의미: Matrix 클라이언트 측 fallback이 오래된 평면 저장소를 찾았지만 이동에 실패했습니다. 이제 OpenClaw는 새 저장소로 조용히 시작하는 대신 해당 fallback을 중단합니다.
- 수행할 작업: 파일 시스템 권한이나 충돌을 점검하고, 오래된 state는 그대로 유지한 채 오류를 수정한 후 다시 시도하세요.

`Matrix is installed from a custom path: ...`

- 의미: Matrix가 경로 설치에 고정되어 있으므로, 메인라인 업데이트가 이를 repo의 표준 Matrix 패키지로 자동 교체하지 않습니다.
- 수행할 작업: 기본 Matrix Plugin으로 돌아가고 싶다면 `openclaw plugins install @openclaw/matrix`로 다시 설치하세요.

### 암호화된 state 복구 메시지

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 의미: 백업된 room key가 새 crypto 저장소로 성공적으로 복원되었습니다.
- 수행할 작업: 보통 아무것도 하지 않아도 됩니다.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 의미: 일부 오래된 room key는 오래된 로컬 저장소에만 존재했고 Matrix backup으로 업로드된 적이 없습니다.
- 수행할 작업: 다른 검증된 클라이언트에서 해당 키를 수동으로 복구할 수 없는 한, 일부 오래된 암호화 기록은 계속 사용할 수 없을 것으로 예상하세요.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 의미: backup은 존재하지만, OpenClaw가 recovery key를 자동으로 복구할 수 없었습니다.
- 수행할 작업: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`를 실행하세요.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 의미: OpenClaw가 오래된 암호화 저장소를 발견했지만, 복구 준비를 위해 이를 충분히 안전하게 검사할 수 없었습니다.
- 수행할 작업: `openclaw doctor --fix`를 다시 실행하세요. 반복되면 오래된 state 디렉터리는 그대로 유지하고, 다른 검증된 Matrix 클라이언트와 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`를 사용해 복구하세요.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 의미: OpenClaw가 backup key 충돌을 감지했고 현재 recovery-key 파일을 자동으로 덮어쓰지 않았습니다.
- 수행할 작업: 복구 명령을 다시 시도하기 전에 어떤 recovery key가 올바른지 확인하세요.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 의미: 이것이 오래된 저장소 형식의 하드 한계입니다.
- 수행할 작업: 백업된 키는 여전히 복원할 수 있지만, 로컬 전용 암호화 기록은 계속 사용할 수 없을 수 있습니다.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 의미: 새 Plugin이 복원을 시도했지만 Matrix가 오류를 반환했습니다.
- 수행할 작업: `openclaw matrix verify backup status`를 실행한 다음, 필요하면 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`로 다시 시도하세요.

### 수동 복구 메시지

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 의미: OpenClaw는 backup key가 있어야 한다는 것을 알고 있지만, 이 디바이스에서 활성화되어 있지 않습니다.
- 수행할 작업: `openclaw matrix verify backup restore`를 실행하거나, 필요하면 `--recovery-key`를 전달하세요.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 의미: 이 디바이스에는 현재 recovery key가 저장되어 있지 않습니다.
- 수행할 작업: 먼저 recovery key로 디바이스를 검증한 다음 backup을 복원하세요.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 의미: 저장된 키가 활성 Matrix backup과 일치하지 않습니다.
- 수행할 작업: 올바른 키로 `openclaw matrix verify device "<your-recovery-key>"`를 다시 실행하세요.

복구할 수 없는 오래된 암호화 기록의 손실을 받아들일 수 있다면, 대신
`openclaw matrix verify backup reset --yes`로 현재 backup 기준선을 재설정할 수 있습니다. 저장된
backup secret이 손상된 경우, 이 재설정은 재시작 후 새 backup key가 올바르게 로드되도록
secret storage를 다시 생성할 수도 있습니다.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 의미: backup은 존재하지만, 이 디바이스는 아직 cross-signing 체인을 충분히 강하게 신뢰하지 않습니다.
- 수행할 작업: `openclaw matrix verify device "<your-recovery-key>"`를 다시 실행하세요.

`Matrix recovery key is required`

- 의미: recovery key가 필요한 복구 단계를 시도했지만 키를 제공하지 않았습니다.
- 수행할 작업: recovery key와 함께 명령을 다시 실행하세요.

`Invalid Matrix recovery key: ...`

- 의미: 제공된 키를 파싱할 수 없었거나 예상 형식과 일치하지 않았습니다.
- 수행할 작업: Matrix 클라이언트 또는 recovery-key 파일의 정확한 recovery key로 다시 시도하세요.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 의미: OpenClaw가 recovery key를 적용할 수는 있었지만, Matrix가 여전히 이 디바이스에 대해
  완전한 cross-signing identity 신뢰를 확립하지 못했습니다. 명령 출력에서
  `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, `Device verified by owner`를 확인하세요.
- 수행할 작업: `openclaw matrix verify self`를 실행하고, 다른
  Matrix 클라이언트에서 요청을 수락한 뒤 SAS를 비교하고, 일치할 때만 `yes`를 입력하세요. 이
  명령은 완전한 Matrix identity 신뢰가 성립될 때까지 기다린 후 성공을 보고합니다.
  현재 cross-signing identity를 의도적으로 교체하려는 경우에만
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  을 사용하세요.

`Matrix key backup is not active on this device after loading from secret storage.`

- 의미: secret storage가 이 디바이스에서 활성 backup 세션을 만들지 못했습니다.
- 수행할 작업: 먼저 디바이스를 검증한 다음 `openclaw matrix verify backup status`로 다시 확인하세요.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 의미: 이 디바이스는 디바이스 검증이 완료될 때까지 secret storage에서 복원할 수 없습니다.
- 수행할 작업: 먼저 `openclaw matrix verify device "<your-recovery-key>"`를 실행하세요.

### 커스텀 Plugin 설치 메시지

`Matrix is installed from a custom path that no longer exists: ...`

- 의미: Plugin 설치 기록이 더 이상 존재하지 않는 로컬 경로를 가리키고 있습니다.
- 수행할 작업: `openclaw plugins install @openclaw/matrix`로 다시 설치하거나, repo checkout에서 실행 중이라면 `openclaw plugins install ./path/to/local/matrix-plugin`를 실행하세요.

## 암호화된 기록이 여전히 돌아오지 않는 경우

다음 검사를 순서대로 실행하세요:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

backup 복원이 성공했는데도 일부 오래된 room의 기록이 여전히 없다면, 누락된 키는 이전 Plugin에서 아마 백업된 적이 없을 가능성이 큽니다.

## 앞으로의 메시지에 대해 새로 시작하고 싶은 경우

복구할 수 없는 오래된 암호화 기록의 손실을 받아들이고 앞으로 깨끗한 backup 기준선만 원한다면, 다음 명령을 순서대로 실행하세요:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

그 후에도 디바이스가 여전히 검증되지 않았다면, Matrix 클라이언트에서 SAS 이모지 또는 십진수 코드를 비교하고 일치함을 확인하여 검증을 완료하세요.

## 관련 페이지

- [Matrix](/ko/channels/matrix)
- [Doctor](/ko/gateway/doctor)
- [Migrating](/ko/install/migrating)
- [Plugins](/ko/tools/plugin)
