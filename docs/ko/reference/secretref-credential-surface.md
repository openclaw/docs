---
read_when:
    - SecretRef 자격 증명 적용 범위 확인 중입니다
    - 자격 증명이 `secrets configure` 또는 `secrets apply` 대상인지 감사 중입니다
    - 자격 증명이 지원되는 표면 밖에 있는 이유를 확인 중입니다
summary: 지원되는 SecretRef 자격 증명 표면과 지원되지 않는 표준 표면
title: SecretRef 자격 증명 표면
x-i18n:
    generated_at: "2026-04-26T11:38:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

이 페이지는 표준 SecretRef 자격 증명 표면을 정의합니다.

범위 의도:

- 범위 포함: OpenClaw가 발급하거나 교체하지 않는 엄격한 사용자 제공 자격 증명
- 범위 제외: 런타임이 발급하거나 교체하는 자격 증명, OAuth 갱신 자료, 세션 유사 아티팩트

## 지원되는 자격 증명

### `openclaw.json` 대상 (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` via sibling `serviceAccountRef` (호환성 예외)
- `channels.googlechat.accounts.*.serviceAccount` via sibling `serviceAccountRef` (호환성 예외)

### `auth-profiles.json` 대상 (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"`일 때는 지원되지 않음)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"`일 때는 지원되지 않음)

[//]: # "secretref-supported-list-end"

참고:

- 인증 프로필 계획 대상에는 `agentId`가 필요합니다.
- 계획 항목은 `profiles.*.key` / `profiles.*.token`을 대상으로 하며 형제 ref(`keyRef` / `tokenRef`)를 기록합니다.
- 인증 프로필 ref는 런타임 확인 및 감사 범위에 포함됩니다.
- `openclaw.json`에서 SecretRef는 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` 같은 구조화된 객체를 사용해야 합니다. 레거시 `secretref-env:<ENV_VAR>` 마커 문자열은 SecretRef 자격 증명 경로에서 거부됩니다. 유효한 마커를 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.
- OAuth 정책 가드: `auth.profiles.<id>.mode = "oauth"`는 해당 프로필의 SecretRef 입력과 함께 사용할 수 없습니다. 이 정책이 위반되면 시작/재로드 및 인증 프로필 확인이 즉시 실패합니다.
- SecretRef로 관리되는 모델 공급자의 경우, 생성된 `agents/*/agent/models.json` 항목은 `apiKey`/헤더 표면에 대해 확인된 비밀 값이 아니라 비밀이 아닌 마커를 유지합니다.
- 마커 지속성은 소스를 기준으로 권위를 가집니다. OpenClaw는 확인된 런타임 비밀 값이 아니라 활성 소스 config 스냅샷(확인 전)에서 마커를 기록합니다.
- Web 검색의 경우:
  - 명시적 공급자 모드(`tools.web.search.provider` 설정)에서는 선택한 공급자 키만 활성화됩니다.
  - 자동 모드(`tools.web.search.provider` 미설정)에서는 우선순위에 따라 확인되는 첫 번째 공급자 키만 활성화됩니다.
  - 자동 모드에서는 선택되지 않은 공급자 ref는 선택될 때까지 비활성으로 처리됩니다.
  - 레거시 `tools.web.search.*` 공급자 경로는 호환성 기간 동안 계속 확인되지만, 표준 SecretRef 표면은 `plugins.entries.<plugin>.config.webSearch.*`입니다.

## 지원되지 않는 자격 증명

범위 밖 자격 증명에는 다음이 포함됩니다.

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

근거:

- 이러한 자격 증명은 발급됨, 교체됨, 세션을 보유함, 또는 읽기 전용 외부 SecretRef 확인에 맞지 않는 OAuth 영속 클래스에 속합니다.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [인증 자격 증명 의미론](/ko/auth-credential-semantics)
