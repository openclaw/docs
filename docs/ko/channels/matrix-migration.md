---
read_when:
    - 기존 Matrix 설치 업그레이드
    - 암호화된 Matrix 기록 및 기기 상태 마이그레이션
summary: 암호화 상태 복구의 제한 사항과 수동 복구 단계를 포함하여 OpenClaw가 기존 Matrix Plugin을 현재 위치에서 업그레이드하는 방법입니다.
title: Matrix 마이그레이션
x-i18n:
    generated_at: "2026-07-12T14:58:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

이전 공개 `matrix` Plugin에서 현재 구현으로 업그레이드합니다.

대부분의 사용자는 기존 설정을 그대로 유지하며 업그레이드할 수 있습니다.

- Plugin은 계속 `@openclaw/matrix`입니다.
- 채널은 계속 `matrix`입니다.
- 구성은 계속 `channels.matrix` 아래에 있습니다.
- 캐시된 자격 증명은 계속 `~/.openclaw/credentials/matrix/` 아래에 있습니다.
- 런타임 상태는 계속 `~/.openclaw/matrix/` 아래에 있습니다.

구성 키의 이름을 변경하거나 새 이름으로 Plugin을 다시 설치할 필요가 없습니다.
루트 `openclaw` 패키지는 더 이상 Matrix 런타임 코드나 Matrix SDK
종속성을 번들로 제공하지 않습니다. `openclaw channels status`에서 Matrix가 구성되어 있지만
Plugin이 설치되지 않은 것으로 표시되면 `openclaw doctor --fix` 또는
`openclaw plugins install @openclaw/matrix`를 실행하십시오. Matrix SDK 패키지를
루트 OpenClaw 패키지에 설치하지 마십시오.

## 마이그레이션에서 자동으로 수행하는 작업

Matrix 마이그레이션은 [`openclaw doctor --fix`](/ko/gateway/doctor)를 실행할 때 수행되며, Matrix 클라이언트가 시작될 때 SQLite 저장소 옆에서 파일 기반 사이드카 상태를 여전히 발견하는 경우 대체 경로로도 수행됩니다.

자동 마이그레이션 범위는 다음과 같습니다.

- 캐시된 Matrix 자격 증명 재사용
- 동일한 계정 선택 및 `channels.matrix` 구성 유지
- 파일 기반 사이드카 상태(`bot-storage.json` 동기화 캐시, `recovery-key.json`, `legacy-crypto-migration.json`, IndexedDB 스냅샷)를 Matrix SQLite 상태로 가져오기. 마이그레이션된 파일은 `.migrated` 접미사를 붙여 보관됩니다.
- 나중에 액세스 토큰이 변경되는 경우 동일한 Matrix 계정, 홈서버, 사용자 및 기기에 대해 기존 토큰 해시 저장소 루트 중 가장 완전한 항목 재사용

## 2026.4 이전 OpenClaw 릴리스에서 업그레이드

2026.6 계열까지의 릴리스에서는 원래의 단일 평면 저장소
Matrix 레이아웃(`~/.openclaw/matrix/bot-storage.json` 및
`~/.openclaw/matrix/crypto/`)도 마이그레이션했으며, 이전 Rust 암호화 저장소에서
암호화 상태를 복구할 수 있도록 준비했습니다. 현재 릴리스에는 이 마이그레이션이 더 이상 포함되지 않습니다.

아직 평면 레이아웃을 사용하는 설치를 업그레이드하는 경우 먼저
2026.6 릴리스로 업그레이드하고 `openclaw doctor --fix`를 실행한 다음, 평면 저장소와
복구 가능한 모든 방 키가 마이그레이션되도록 Gateway를 한 번 시작하십시오. 그런 다음
최신 릴리스로 업데이트하십시오.

이전 공개 Matrix Plugin은 Matrix 방 키 백업을 자동으로 생성하지 **않았습니다**. 이전 설치에 백업된 적이 없는 로컬 전용 암호화 기록이 있었다면 마이그레이션 경로와 관계없이 업그레이드 후 일부 오래된 암호화 메시지를 읽지 못할 수 있습니다.

## 권장 업그레이드 절차

1. OpenClaw와 Matrix Plugin을 일반적인 방법으로 업데이트합니다.
2. 다음을 실행합니다.

   ```bash
   openclaw doctor --fix
   ```

3. Gateway를 시작하거나 다시 시작합니다.
4. 현재 검증 및 백업 상태를 확인합니다.

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 복구하려는 Matrix 계정의 복구 키를 계정별 환경 변수에 넣습니다. 기본 계정이 하나뿐인 경우 `MATRIX_RECOVERY_KEY`를 사용하면 됩니다. 계정이 여러 개인 경우 계정마다 변수를 하나씩 사용하십시오. 예를 들어 `MATRIX_RECOVERY_KEY_ASSISTANT`를 사용하고 명령에 `--account assistant`를 추가합니다.

6. OpenClaw에서 복구 키가 필요하다고 알리면 일치하는 계정에 대해 다음 명령을 실행합니다.

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 이 기기가 아직 검증되지 않았다면 일치하는 계정에 대해 다음 명령을 실행합니다.

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   복구 키가 승인되고 백업을 사용할 수 있지만 `Cross-signing verified`가
   여전히 `no`이면 다른 Matrix 클라이언트에서 자체 검증을 완료합니다.

   ```bash
   openclaw matrix verify self
   ```

   다른 Matrix 클라이언트에서 요청을 수락하고 이모지 또는 십진수를 비교한 다음,
   일치하는 경우에만 `yes`를 입력합니다. 이 명령은 성공을 보고하기 전에 완전한 Matrix
   ID 신뢰가 설정될 때까지 기다립니다.

8. 복구할 수 없는 이전 기록을 의도적으로 포기하고 향후 메시지를 위한 새로운 백업 기준선을 만들려면 다음을 실행합니다.

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   이전 복구 키로 새로운 백업의 잠금을 더 이상 해제할 수 없도록 하려는 경우에만 `--rotate-recovery-key`를 추가합니다.

9. 아직 서버 측 키 백업이 없다면 향후 복구를 위해 백업을 생성합니다.

   ```bash
   openclaw matrix verify bootstrap
   ```

## 일반적인 메시지와 의미

`Failed migrating legacy Matrix client storage: ...`

- 의미: Matrix 클라이언트 측 대체 경로에서 파일 기반 사이드카 상태를 발견했지만 SQLite로 가져오지 못했습니다. OpenClaw는 새 저장소로 조용히 시작하는 대신 완료된 이동을 롤백하고 해당 대체 경로를 중단합니다.
- 조치: 파일 시스템 권한이나 충돌을 확인하고 이전 상태를 그대로 유지한 다음 오류를 수정한 후 다시 시도하십시오.

`Matrix is installed from a custom path: ...`

- 의미: Matrix가 경로 설치에 고정되어 있으므로 메인라인 업데이트에서 기본 Matrix 패키지로 자동 교체되지 않습니다.
- 조치: 기본 Matrix Plugin으로 돌아가려면 `openclaw plugins install @openclaw/matrix`로 다시 설치하십시오.

`Matrix is installed from a custom path that no longer exists: ...`

- 의미: Plugin 설치 레코드가 더 이상 존재하지 않는 로컬 경로를 가리킵니다.
- 조치: `openclaw plugins install @openclaw/matrix`로 다시 설치하거나, 저장소 체크아웃에서 실행 중이라면 `openclaw plugins install ./path/to/local/matrix-plugin`을 실행하십시오. `openclaw doctor --fix`를 사용하여 오래된 Matrix Plugin 참조를 제거할 수도 있습니다.

### 수동 복구 메시지

이 기기에서 방 키 백업이 정상적이지 않은 경우 `openclaw matrix verify status`와 `openclaw matrix verify backup status`는 `Backup issue:` 줄과 `Next steps:` 안내를 출력합니다.

| 백업 문제                                                             | 의미                                               | 해결 방법                                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | 복원할 대상이 없음                                 | `openclaw matrix verify bootstrap`으로 방 키 백업 생성                                                                                     |
| `backup decryption key is not loaded on this device`                  | 키가 존재하지만 이 기기에서 활성화되지 않음        | `openclaw matrix verify backup restore`; 그래도 키를 불러올 수 없으면 `--recovery-key-stdin`을 통해 복구 키 전달                           |
| `backup decryption key could not be loaded from secret storage (...)` | 비밀 저장소 로드가 실패했거나 지원되지 않음        | 복구 키 전달: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                         |
| `backup key mismatch (...)`                                           | 저장된 키가 활성 서버 백업과 일치하지 않음         | 활성 서버 백업 키로 `verify backup restore --recovery-key-stdin`을 다시 실행하거나 새로운 기준선을 위해 `verify backup reset --yes` 실행 |
| `backup signature chain is not trusted by this device`                | 기기가 아직 교차 서명 체인을 신뢰하지 않음         | `verify device --recovery-key-stdin`을 실행한 다음, 신뢰가 아직 불완전하면 검증된 다른 클라이언트에서 `verify self` 실행                   |
| `backup exists but is not active on this device`                      | 서버 백업은 있지만 로컬 세션이 비활성 상태임       | 먼저 기기를 검증한 다음 `openclaw matrix verify backup status`로 다시 확인                                                               |
| `backup trust state could not be fully determined`                    | 진단 결과가 확정적이지 않음                        | `openclaw matrix verify status --verbose`                                                                                                 |

기타 복구 오류:

`Matrix recovery key is required`

- 의미: 복구 키가 필요한 복구 단계를 복구 키 없이 시도했습니다.
- 조치: `--recovery-key-stdin`을 사용하여 명령을 다시 실행하십시오. 예: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- 의미: 제공된 키를 파싱할 수 없거나 예상 형식과 일치하지 않습니다.
- 조치: Matrix 클라이언트 또는 복구 키 내보내기에서 가져온 정확한 복구 키로 다시 시도하십시오.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 의미: 복구 키로 사용 가능한 백업 자료의 잠금을 해제했지만 Matrix에서 이 기기에 대한 완전한 교차 서명 ID 신뢰를 설정하지 못했습니다. 명령 출력에서 `Recovery key accepted`, `Backup usable`, `Cross-signing verified`, `Device verified by owner`를 확인하십시오.
- 조치: `openclaw matrix verify self`를 실행하고 다른 Matrix 클라이언트에서 요청을 수락한 다음 SAS를 비교하여 일치하는 경우에만 `yes`를 입력하십시오. 현재 교차 서명 ID를 의도적으로 교체하려는 경우에만 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`을 사용하십시오.

복구할 수 없는 오래된 암호화 기록을 잃어도 괜찮다면 대신
`openclaw matrix verify backup reset --yes`를 사용하여 현재 백업 기준선을 재설정할 수 있습니다. 저장된
백업 비밀이 손상된 경우 이 재설정은 비밀 저장소도 복구하므로 다시 시작한 후
새 백업 키를 올바르게 불러올 수 있습니다.

## 암호화 기록이 여전히 복원되지 않는 경우

다음 검사를 순서대로 실행합니다.

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

백업이 성공적으로 복원되었지만 일부 오래된 방의 기록이 여전히 없다면 해당 키는 이전 Plugin에서 백업된 적이 없을 가능성이 큽니다.

## 향후 메시지를 위해 새로 시작하려는 경우

복구할 수 없는 오래된 암호화 기록을 잃어도 괜찮고 앞으로 사용할 깨끗한 백업 기준선만 필요하다면 다음 명령을 순서대로 실행합니다.

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

그 후에도 기기가 검증되지 않았다면 Matrix 클라이언트에서 SAS 이모지 또는 십진수 코드를 비교하고 일치함을 확인하여 검증을 완료하십시오.

## 관련 문서

- [Matrix](/ko/channels/matrix): 채널 설정 및 구성.
- [Matrix 푸시 규칙](/ko/channels/matrix-push-rules): 알림 라우팅.
- [Doctor](/ko/gateway/doctor): 상태 검사 및 자동 마이그레이션 트리거.
- [마이그레이션 가이드](/ko/install/migrating): 모든 마이그레이션 경로(시스템 이동, 시스템 간 가져오기).
- [Plugin](/ko/tools/plugin): Plugin 설치 및 등록.
