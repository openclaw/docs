---
read_when:
    - Verificando a cobertura de credenciais SecretRef
    - Auditando se uma credencial é elegível para `secrets configure` ou `secrets apply`
    - Verificando por que uma credencial está fora da superfície com suporte
summary: Superfície canônica de credenciais SecretRef com suporte e sem suporte
title: Superfície de credenciais SecretRef
x-i18n:
    generated_at: "2026-07-12T00:20:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Esta página define a superfície canônica de credenciais SecretRef: quais campos de credenciais aceitam uma `SecretRef` (referência baseada em env/arquivo/exec) em vez de um valor de segredo bruto.

Escopo:

- Incluído no escopo: estritamente credenciais fornecidas pelo usuário que o OpenClaw não emite nem rotaciona.
- Fora do escopo: credenciais emitidas ou rotacionadas em tempo de execução, material de atualização OAuth e artefatos semelhantes a sessões.

As listas abaixo são geradas a partir do registro de destinos do código-fonte e verificadas em relação a `docs/reference/secretref-user-supplied-credentials-matrix.json` na CI; não edite as entradas manualmente.

## Credenciais compatíveis

### Destinos de `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` por meio do campo irmão `serviceAccountRef` (exceção de compatibilidade)
- `channels.googlechat.accounts.*.serviceAccount` por meio do campo irmão `serviceAccountRef` (exceção de compatibilidade)

### Destinos de `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; incompatível quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; incompatível quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Observações:

- Os destinos do plano de perfis de autenticação exigem `agentId`; as entradas do plano têm como destino `profiles.*.key` / `profiles.*.token` e gravam referências irmãs (`keyRef` / `tokenRef`). As referências de perfis de autenticação estão incluídas na resolução em tempo de execução e na cobertura da auditoria.
- Em `openclaw.json`, as SecretRefs devem usar objetos estruturados, como `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Strings de marcador legadas `secretref-env:<ENV_VAR>` são rejeitadas em caminhos de credenciais SecretRef; execute `openclaw doctor --fix` para migrar marcadores válidos.
- Proteção da política OAuth: `auth.profiles.<id>.mode = "oauth"` não pode ser combinado com entradas SecretRef para esse perfil. A inicialização/recarga e a resolução de perfis de autenticação falham imediatamente quando essa política é violada.
- Para provedores de modelos gerenciados por SecretRef, as entradas geradas em `agents/*/agent/models.json` persistem marcadores não secretos (e não os valores de segredo resolvidos) para as superfícies de `apiKey`/cabeçalhos. A persistência dos marcadores usa a origem como fonte de autoridade: o OpenClaw grava marcadores a partir do instantâneo da configuração de origem ativa (antes da resolução), e não a partir dos valores de segredo resolvidos em tempo de execução.
- Para pesquisa na Web: no modo de provedor explícito (com `tools.web.search.provider` definido), somente a chave do provedor selecionado fica ativa. No modo automático (com `tools.web.search.provider` não definido), somente a primeira chave de provedor resolvida por precedência fica ativa, e as referências de provedores não selecionados são tratadas como inativas até serem selecionadas. Os caminhos legados de provedores `tools.web.search.*` ainda são resolvidos durante o período de compatibilidade, mas a superfície SecretRef canônica é `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciais incompatíveis

Estas credenciais pertencem a classes emitidas, rotacionadas, associadas a sessões ou persistentes de OAuth que não são adequadas à resolução externa somente leitura de SecretRef:

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

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Semântica das credenciais de autenticação](/pt-BR/auth-credential-semantics)
