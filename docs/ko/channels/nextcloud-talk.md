---
read_when:
    - Nextcloud Talk 채널 기능 작업하기
summary: Nextcloud Talk 지원 상태, 기능 및 구성
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

상태: 번들 Plugin(Webhook 봇). 다이렉트 메시지, 룸, 반응, Markdown 메시지가 지원됩니다.

## 번들 Plugin

Nextcloud Talk은 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로
일반 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

Nextcloud Talk을 제외한 이전 빌드나 사용자 지정 설치를 사용하는 경우,
npm 패키지를 직접 설치하세요.

CLI로 설치(npm 레지스트리):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

현재 공식 릴리스 태그를 따르려면 기본 패키지를 사용하세요. 재현 가능한
설치가 필요한 경우에만 정확한 버전을 고정하세요.

로컬 체크아웃(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정(초보자)

1. Nextcloud Talk Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치는 위 명령으로 수동 추가할 수 있습니다.
2. Nextcloud 서버에서 봇을 생성합니다.

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. 대상 룸 설정에서 봇을 활성화합니다.
4. OpenClaw를 구성합니다.
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 또는 env: `NEXTCLOUD_TALK_BOT_SECRET`(기본 계정만)

   CLI 설정:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   동일한 명시적 필드:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   파일 기반 비밀 값:

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

- 봇은 DM을 시작할 수 없습니다. 사용자가 먼저 봇에게 메시지를 보내야 합니다.
- Webhook URL은 Gateway에서 접근 가능해야 합니다. 프록시 뒤에 있는 경우 `webhookPublicUrl`을 설정하세요.
- 봇 API는 미디어 업로드를 지원하지 않습니다. 미디어는 URL로 전송됩니다.
- Webhook 페이로드는 DM과 룸을 구분하지 않습니다. 룸 유형 조회를 활성화하려면 `apiUser` + `apiPassword`를 설정하세요. 그렇지 않으면 DM이 룸으로 처리됩니다.

## 접근 제어(DM)

- 기본값: `channels.nextcloud-talk.dmPolicy = "pairing"`. 알 수 없는 발신자는 페어링 코드를 받습니다.
- 승인 방법:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 공개 DM: `channels.nextcloud-talk.dmPolicy="open"` 및 `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom`은 Nextcloud 사용자 ID만 매칭합니다. 표시 이름은 무시됩니다.

## 룸(그룹)

- 기본값: `channels.nextcloud-talk.groupPolicy = "allowlist"`(멘션 게이트 적용).
- `channels.nextcloud-talk.rooms`로 룸을 허용 목록에 추가합니다.

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

- 룸을 허용하지 않으려면 허용 목록을 비워 두거나 `channels.nextcloud-talk.groupPolicy="disabled"`를 설정하세요.

## 기능

| 기능            | 상태          |
| --------------- | ------------- |
| 다이렉트 메시지 | 지원됨        |
| 룸              | 지원됨        |
| 스레드          | 지원되지 않음 |
| 미디어          | URL 전용      |
| 반응            | 지원됨        |
| 네이티브 명령   | 지원되지 않음 |

## 구성 참조(Nextcloud Talk)

전체 구성: [Configuration](/ko/gateway/configuration)

Provider 옵션:

- `channels.nextcloud-talk.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.nextcloud-talk.baseUrl`: Nextcloud 인스턴스 URL입니다.
- `channels.nextcloud-talk.botSecret`: 봇 공유 비밀 값입니다.
- `channels.nextcloud-talk.botSecretFile`: 일반 파일 비밀 값 경로입니다. 심볼릭 링크는 거부됩니다.
- `channels.nextcloud-talk.apiUser`: 룸 조회(DM 감지)에 사용할 API 사용자입니다.
- `channels.nextcloud-talk.apiPassword`: 룸 조회에 사용할 API/앱 비밀번호입니다.
- `channels.nextcloud-talk.apiPasswordFile`: API 비밀번호 파일 경로입니다.
- `channels.nextcloud-talk.webhookPort`: Webhook 리스너 포트(기본값: 8788)입니다.
- `channels.nextcloud-talk.webhookHost`: Webhook 호스트(기본값: 0.0.0.0)입니다.
- `channels.nextcloud-talk.webhookPath`: Webhook 경로(기본값: /nextcloud-talk-webhook)입니다.
- `channels.nextcloud-talk.webhookPublicUrl`: 외부에서 접근 가능한 Webhook URL입니다.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM 허용 목록(사용자 ID)입니다. `open`에는 `"*"`가 필요합니다.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: 그룹 허용 목록(사용자 ID)입니다.
- `channels.nextcloud-talk.rooms`: 룸별 설정 및 허용 목록입니다.
- 정적 발신자 접근 그룹은 `allowFrom` 및 `groupAllowFrom`에서 `accessGroup:<name>`으로 참조할 수 있습니다.
- `channels.nextcloud-talk.historyLimit`: 그룹 기록 제한(0은 비활성화)입니다.
- `channels.nextcloud-talk.dmHistoryLimit`: DM 기록 제한(0은 비활성화)입니다.
- `channels.nextcloud-talk.dms`: DM별 재정의(historyLimit)입니다.
- `channels.nextcloud-talk.textChunkLimit`: 아웃바운드 텍스트 청크 크기(문자)입니다.
- `channels.nextcloud-talk.chunkMode`: 길이 청킹 전에 빈 줄(문단 경계)에서 분할하려면 `length`(기본값) 또는 `newline`을 사용합니다.
- `channels.nextcloud-talk.blockStreaming`: 이 채널의 블록 스트리밍을 비활성화합니다.
- `channels.nextcloud-talk.blockStreamingCoalesce`: 블록 스트리밍 병합 조정입니다.
- `channels.nextcloud-talk.mediaMaxMb`: 인바운드 미디어 한도(MB)입니다.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
