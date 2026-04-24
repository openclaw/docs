---
read_when:
    - Nextcloud Talk 채널 기능 작업 중
summary: Nextcloud Talk 지원 상태, 기능 및 구성
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

상태: 번들된 Plugin (webhook bot). 다이렉트 메시지, 방, 반응, 마크다운 메시지를 지원합니다.

## 번들된 Plugin

Nextcloud Talk는 현재 OpenClaw 릴리스에 번들된 Plugin으로 포함되어 있으므로,
일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드 또는 Nextcloud Talk가 제외된 사용자 지정 설치를 사용하는 경우,
수동으로 설치하세요:

CLI로 설치(npm 레지스트리):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

로컬 체크아웃에서 설치(git 리포지토리에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정(초보자용)

1. Nextcloud Talk Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. Nextcloud 서버에서 bot을 생성합니다:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 대상 방 설정에서 bot을 활성화합니다.
4. OpenClaw를 구성합니다:
   - 구성: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 또는 env: `NEXTCLOUD_TALK_BOT_SECRET` (기본 계정에만 해당)

   CLI 설정:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   명시적 필드 사용 시 동일한 설정:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   파일 기반 secret:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway를 다시 시작합니다(또는 설정을 완료합니다).

최소 구성:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 참고

- bot은 DM을 시작할 수 없습니다. 사용자가 먼저 bot에 메시지를 보내야 합니다.
- Webhook URL은 Gateway에서 접근 가능해야 합니다. 프록시 뒤에 있는 경우 `webhookPublicUrl`을 설정하세요.
- bot API는 미디어 업로드를 지원하지 않으므로 미디어는 URL로 전송됩니다.
- webhook payload는 DM과 방을 구분하지 않습니다. 방 유형 조회를 활성화하려면 `apiUser` + `apiPassword`를 설정하세요(그렇지 않으면 DM은 방으로 처리됩니다).

## 접근 제어(DM)

- 기본값: `channels.nextcloud-talk.dmPolicy = "pairing"`. 알 수 없는 발신자에게는 페어링 코드가 제공됩니다.
- 다음으로 승인:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 공개 DM: `channels.nextcloud-talk.dmPolicy="open"` 및 `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom`은 Nextcloud 사용자 ID에만 일치하며 표시 이름은 무시됩니다.

## 방(그룹)

- 기본값: `channels.nextcloud-talk.groupPolicy = "allowlist"` (멘션 게이트 적용).
- `channels.nextcloud-talk.rooms`로 방 허용 목록을 설정합니다:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- 어떤 방도 허용하지 않으려면 허용 목록을 비워 두거나 `channels.nextcloud-talk.groupPolicy="disabled"`로 설정하세요.

## 기능

| 기능 | 상태 |
| --------------- | ------------- |
| 다이렉트 메시지 | 지원됨 |
| 방 | 지원됨 |
| 스레드 | 지원되지 않음 |
| 미디어 | URL 전용 |
| 반응 | 지원됨 |
| 네이티브 명령 | 지원되지 않음 |

## 구성 참조(Nextcloud Talk)

전체 구성: [Configuration](/ko/gateway/configuration)

Provider 옵션:

- `channels.nextcloud-talk.enabled`: 채널 시작 시 활성화/비활성화합니다.
- `channels.nextcloud-talk.baseUrl`: Nextcloud 인스턴스 URL.
- `channels.nextcloud-talk.botSecret`: bot 공유 secret.
- `channels.nextcloud-talk.botSecretFile`: 일반 파일 secret 경로. 심볼릭 링크는 거부됩니다.
- `channels.nextcloud-talk.apiUser`: 방 조회(DM 감지)를 위한 API 사용자.
- `channels.nextcloud-talk.apiPassword`: 방 조회를 위한 API/앱 비밀번호.
- `channels.nextcloud-talk.apiPasswordFile`: API 비밀번호 파일 경로.
- `channels.nextcloud-talk.webhookPort`: webhook 리스너 포트(기본값: 8788).
- `channels.nextcloud-talk.webhookHost`: webhook 호스트(기본값: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: webhook 경로(기본값: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: 외부에서 접근 가능한 webhook URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM 허용 목록(사용자 ID). `open`에는 `"*"`가 필요합니다.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: 그룹 허용 목록(사용자 ID).
- `channels.nextcloud-talk.rooms`: 방별 설정 및 허용 목록.
- `channels.nextcloud-talk.historyLimit`: 그룹 기록 제한(0이면 비활성화).
- `channels.nextcloud-talk.dmHistoryLimit`: DM 기록 제한(0이면 비활성화).
- `channels.nextcloud-talk.dms`: DM별 재정의(`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: 아웃바운드 텍스트 청크 크기(문자 수).
- `channels.nextcloud-talk.chunkMode`: 길이 기준 청킹 전에 빈 줄(문단 경계)에서 분할하는 `length`(기본값) 또는 `newline`.
- `channels.nextcloud-talk.blockStreaming`: 이 채널의 블록 스트리밍을 비활성화합니다.
- `channels.nextcloud-talk.blockStreamingCoalesce`: 블록 스트리밍 병합 튜닝.
- `channels.nextcloud-talk.mediaMaxMb`: 인바운드 미디어 한도(MB).

## 관련 문서

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [Channel Routing](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [Security](/ko/gateway/security) — 접근 모델 및 보안 강화
