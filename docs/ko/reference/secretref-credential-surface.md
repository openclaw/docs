---
read_when:
    - SecretRef 자격 증명 적용 범위 확인
    - 자격 증명이 `secrets configure` 또는 `secrets apply`에 적합한지 감사하기
    - 자격 증명이 지원 범위를 벗어나는 이유 확인하기
summary: 공식적으로 지원되는 SecretRef 자격 증명 표면과 지원되지 않는 표면
title: SecretRef 자격 증명 표면
x-i18n:
    generated_at: "2026-07-12T01:10:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

이 페이지는 표준 SecretRef 자격 증명 표면을 정의합니다. 즉, 원시 비밀 값 대신 `SecretRef`(env/file/exec 기반 참조)를 허용하는 자격 증명 필드를 설명합니다.

범위:

- 범위 내: OpenClaw가 발급하거나 순환하지 않는, 엄격히 사용자가 제공한 자격 증명.
- 범위 외: 런타임에서 발급되거나 순환되는 자격 증명, OAuth 갱신 자료 및 세션과 유사한 아티팩트.

아래 목록은 소스 대상 레지스트리에서 생성되며 CI에서 `docs/reference/secretref-user-supplied-credentials-matrix.json`과 대조하여 검사됩니다. 항목을 직접 편집하지 마세요.

## 지원되는 자격 증명

### `openclaw.json` 대상(`secrets configure` + `secrets apply` + `secrets audit`)

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
- `talk.realtime.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google-meet.config.realtime.providers.*.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.parallel.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `tools.web.search.*.apiKey`
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
- `channels.slack.relay.authToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.relay.authToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.sms.authToken`
- `channels.sms.accounts.*.authToken`
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
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
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
- 형제 `serviceAccountRef`를 통한 `channels.googlechat.serviceAccount`(호환성 예외)
- 형제 `serviceAccountRef`를 통한 `channels.googlechat.accounts.*.serviceAccount`(호환성 예외)

### `auth-profiles.json` 대상(`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef`(`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"`인 경우 지원되지 않음)
- `profiles.*.tokenRef`(`type: "token"`; `auth.profiles.<id>.mode = "oauth"`인 경우 지원되지 않음)

[//]: # "secretref-supported-list-end"

참고:

- 인증 프로필 계획 대상에는 `agentId`가 필요합니다. 계획 항목은 `profiles.*.key` / `profiles.*.token`을 대상으로 하며 형제 참조(`keyRef` / `tokenRef`)를 기록합니다. 인증 프로필 참조는 런타임 해석 및 감사 범위에 포함됩니다.
- `openclaw.json`에서 SecretRef는 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`과 같은 구조화된 객체를 사용해야 합니다. 레거시 `secretref-env:<ENV_VAR>` 마커 문자열은 SecretRef 자격 증명 경로에서 거부됩니다. 유효한 마커를 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.
- OAuth 정책 보호 장치: `auth.profiles.<id>.mode = "oauth"`는 해당 프로필의 SecretRef 입력과 함께 사용할 수 없습니다. 이 정책을 위반하면 시작/다시 로드 및 인증 프로필 해석이 즉시 실패합니다.
- SecretRef로 관리되는 모델 공급자의 경우 생성된 `agents/*/agent/models.json` 항목은 `apiKey`/헤더 표면에 비밀이 아닌 마커(해석된 비밀 값이 아님)를 유지합니다. 마커 유지는 소스를 기준으로 합니다. OpenClaw는 해석된 런타임 비밀 값이 아니라 활성 소스 구성 스냅샷(해석 전)에서 마커를 기록합니다.
- 웹 검색의 경우: 명시적 공급자 모드(`tools.web.search.provider` 설정)에서는 선택된 공급자의 키만 활성화됩니다. 자동 모드(`tools.web.search.provider` 미설정)에서는 우선순위에 따라 해석되는 첫 번째 공급자 키만 활성화되며, 선택되지 않은 공급자 참조는 선택될 때까지 비활성 상태로 처리됩니다. 레거시 `tools.web.search.*` 공급자 경로는 호환성 기간 동안 계속 해석되지만, 표준 SecretRef 표면은 `plugins.entries.<plugin>.config.webSearch.*`입니다.

## 지원되지 않는 자격 증명

이러한 자격 증명은 발급되거나 순환되거나 세션을 포함하거나 OAuth에서 지속되는 유형이므로 읽기 전용 외부 SecretRef 해석에 적합하지 않습니다.

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

## 관련 문서

- [비밀 관리](/ko/gateway/secrets)
- [인증 자격 증명 의미 체계](/ko/auth-credential-semantics)
