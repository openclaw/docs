---
read_when:
    - Nextcloud Talk 채널 기능 작업하기
summary: Nextcloud Talk 지원 상태, 기능 및 구성
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T00:32:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk은 Talk Webhook 봇을 통해 OpenClaw를 자체 호스팅 Nextcloud 인스턴스에 연결하는 다운로드형 채널 Plugin(`@openclaw/nextcloud-talk`)입니다. 다이렉트 메시지, 방, 반응, 마크다운 메시지를 지원하며 미디어는 URL로 전송됩니다.

## 설치

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

현재 공식 릴리스 태그를 따르려면 버전 없는 패키지 사양을 사용하세요. 재현 가능한 설치가 필요한 경우에만 정확한 버전을 고정하세요.

로컬 체크아웃에서 설치하는 경우(개발 워크플로):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

설치 후 Gateway를 다시 시작하세요. 자세한 내용은 [Plugin](/ko/tools/plugin)을 참조하세요.

## 빠른 설정(초보자용)

1. 위의 방법으로 Plugin을 설치합니다.
2. Nextcloud 서버에서 봇을 생성합니다.

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   `--feature response`를 유지하세요. 이 기능이 없으면 발신 답장이 401 오류로 실패합니다. 기존 봇은 `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`로 수정하세요.

3. 대상 방 설정에서 봇을 활성화합니다.
4. OpenClaw를 구성합니다.
   - 구성: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 또는 환경 변수: `NEXTCLOUD_TALK_BOT_SECRET`(기본 계정에만 적용)

   CLI 설정(`--url`/`--token`은 명시적 필드의 별칭이며 `nc-talk`과 `nc`는 채널 별칭으로 사용할 수 있습니다):

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

5. Gateway를 다시 시작하거나 설정을 완료합니다.

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

## 참고 사항

- 봇은 DM을 먼저 시작할 수 없습니다. 사용자가 먼저 봇에 메시지를 보내야 합니다.
- Webhook URL은 Nextcloud 서버에서 접근할 수 있어야 합니다. Gateway가 프록시 뒤에 있으면 `webhookPublicUrl`을 설정하세요. Webhook 요청은 봇 비밀 값으로 HMAC-SHA256 서명되며, 유효하지 않은 서명은 거부되고 요청 속도가 제한됩니다.
- 봇 API는 미디어 업로드를 지원하지 않습니다. 발신 미디어는 `Attachment: <url>` 줄로 추가됩니다.
- Webhook 페이로드는 DM과 방을 구분하지 않습니다. 방 유형 조회를 활성화하려면 `apiUser` + `apiPassword`를 설정하세요. 조회 결과는 약 5분간 캐시됩니다. 이를 설정하지 않으면 모든 대화를 방으로 처리합니다.
- 발신 요청은 SSRF 방어 장치를 통과합니다. 신뢰할 수 있는 사설/내부 네트워크의 Nextcloud 호스트를 사용하려면 `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`로 명시적으로 허용하세요.
- `apiUser`/`apiPassword`와 `webhookPublicUrl`이 설정된 경우 `openclaw channels status`는 봇을 검사하고 `response` 기능이 없으면 경고합니다.

## 접근 제어(DM)

- 기본값: `channels.nextcloud-talk.dmPolicy = "pairing"`. 알 수 없는 발신자에게는 페어링 코드가 제공됩니다.
- 다음 명령으로 승인합니다.
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 공개 DM: `channels.nextcloud-talk.dmPolicy="open"`과 `channels.nextcloud-talk.allowFrom=["*"]`를 함께 설정합니다.
- `allowFrom`은 Nextcloud 사용자 ID만 소문자로 변환하여 대조하며 표시 이름은 무시합니다.

## 방(그룹)

- 기본값: `channels.nextcloud-talk.groupPolicy = "allowlist"`(멘션 필요).
- `channels.nextcloud-talk.rooms`에서 방 토큰을 키로 사용해 방을 허용 목록에 추가합니다. `"*"`는 와일드카드 기본값을 설정합니다.

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

- 방별 키: `requireMention`(기본값 true), `enabled`(false이면 해당 방 비활성화), `allowFrom`(방별 발신자 허용 목록), `tools`(도구 허용/거부 재정의), `skills`(로드할 Skills 제한), `systemPrompt`.
- 어떤 방도 허용하지 않으려면 허용 목록을 비워 두거나 `channels.nextcloud-talk.groupPolicy="disabled"`를 설정하세요.

## 기능

| 기능            | 상태      |
| --------------- | --------- |
| 다이렉트 메시지 | 지원      |
| 방              | 지원      |
| 스레드          | 지원 안 함 |
| 미디어          | URL만 지원 |
| 반응            | 지원      |
| 네이티브 명령   | 지원 안 함 |

## 구성 참조(Nextcloud Talk)

전체 구성: [구성](/ko/gateway/configuration)

제공자 옵션:

- `channels.nextcloud-talk.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.nextcloud-talk.baseUrl`: Nextcloud 인스턴스 URL입니다.
- `channels.nextcloud-talk.botSecret`: 봇 공유 비밀 값입니다(문자열 또는 비밀 참조).
- `channels.nextcloud-talk.botSecretFile`: 일반 파일 형식의 비밀 값 경로입니다. 심볼릭 링크는 거부됩니다.
- `channels.nextcloud-talk.apiUser`: 방 조회(DM 감지) 및 상태 검사에 사용할 API 사용자입니다.
- `channels.nextcloud-talk.apiPassword`: 방 조회에 사용할 API/앱 비밀번호입니다.
- `channels.nextcloud-talk.apiPasswordFile`: API 비밀번호 파일 경로입니다.
- `channels.nextcloud-talk.webhookPort`: Webhook 리스너 포트입니다(기본값: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook 호스트입니다(기본값: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook 경로입니다(기본값: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: 외부에서 접근 가능한 Webhook URL입니다.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing). `open`에는 `allowFrom=["*"]`가 필요합니다.
- `channels.nextcloud-talk.allowFrom`: DM 허용 목록입니다(사용자 ID).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`(기본값: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: 방 발신자 허용 목록입니다(사용자 ID). 설정하지 않으면 `allowFrom`을 사용합니다.
- `channels.nextcloud-talk.rooms`: 방별 설정 및 허용 목록입니다(위 내용 참조).
- 정적 발신자 접근 그룹은 `accessGroup:<name>`을 사용하여 `allowFrom`과 `groupAllowFrom`에서 참조할 수 있습니다.
- `channels.nextcloud-talk.historyLimit`: 그룹 기록 제한입니다(0이면 비활성화).
- `channels.nextcloud-talk.dmHistoryLimit`: DM 기록 제한입니다(0이면 비활성화).
- `channels.nextcloud-talk.dms`: 사용자 ID를 키로 사용하는 DM별 재정의입니다(`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: 발신 텍스트 청크의 문자 수입니다(기본값: 4000).
- `channels.nextcloud-talk.chunkMode`: 길이를 기준으로 청크를 나누기 전에 빈 줄(단락 경계)을 기준으로 분할하려면 `newline`을 사용하고, 그렇지 않으면 `length`(기본값)를 사용합니다.
- `channels.nextcloud-talk.blockStreaming`: 이 채널의 블록 스트리밍을 비활성화합니다.
- `channels.nextcloud-talk.blockStreamingCoalesce`: 블록 스트리밍 병합을 조정합니다.
- `channels.nextcloud-talk.responsePrefix`: 발신 답장 접두사입니다.
- `channels.nextcloud-talk.markdown.tables`: 마크다운 표 렌더링 모드입니다(`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: 수신 미디어 용량 제한입니다(MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: SSRF 방어 장치에서 사설/내부 Nextcloud 호스트를 허용합니다.
- `channels.nextcloud-talk.accounts.<id>`: 계정별 재정의입니다(동일한 키 사용). `defaultAccount`로 기본 계정을 선택합니다. 환경 변수 `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD`는 기본 계정에만 적용됩니다.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 요구
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 보안 강화
