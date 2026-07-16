---
read_when:
    - Verificando a cobertura de credenciais SecretRef
    - Auditando se uma credencial está qualificada para `secrets configure` ou `secrets apply`
    - Verificando por que uma credencial está fora da superfície compatível
summary: Superfície canônica de credenciais SecretRef com e sem suporte
title: Superfície de credenciais SecretRef
x-i18n:
    generated_at: "2026-07-16T12:54:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Esta página define a superfície canônica de credenciais SecretRef: quais campos de credenciais aceitam uma `SecretRef` (referência baseada em env/arquivo/exec) em vez de um valor de segredo bruto.

Escopo:

- Incluído no escopo: estritamente credenciais fornecidas pelo usuário que o OpenClaw não emite nem rotaciona.
- Fora do escopo: credenciais emitidas ou rotacionadas em tempo de execução, material de atualização OAuth e artefatos semelhantes a sessões.

As listas abaixo são geradas a partir do registro de destinos do código-fonte e verificadas em relação a `docs/reference/secretref-user-supplied-credentials-matrix.json` na CI; não edite as entradas manualmente.

## Credenciais compatíveis

### Destinos `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.clickclack.token`
- `channels.clickclack.accounts.*.token`
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
- `channels.googlechat.serviceAccount` por meio do `serviceAccountRef` irmão (exceção de compatibilidade)
- `channels.googlechat.accounts.*.serviceAccount` por meio do `serviceAccountRef` irmão (exceção de compatibilidade)

### Destinos `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; incompatível quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; incompatível quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Observações:

- Os destinos do plano de perfil de autenticação exigem `agentId`; as entradas do plano têm como destino `profiles.*.key` / `profiles.*.token` e gravam referências irmãs (`keyRef` / `tokenRef`). As referências de perfil de autenticação são incluídas na resolução em tempo de execução e na cobertura de auditoria.
- Em `openclaw.json`, as SecretRefs devem usar objetos estruturados, como `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Strings de marcador `secretref-env:<ENV_VAR>` legadas são rejeitadas nos caminhos de credenciais SecretRef; execute `openclaw doctor --fix` para migrar marcadores válidos.
- Proteção da política OAuth: `auth.profiles.<id>.mode = "oauth"` não pode ser combinado com entradas SecretRef para esse perfil. A inicialização/recarga e a resolução do perfil de autenticação falham imediatamente quando essa política é violada.
- Para provedores de modelos gerenciados por SecretRef, as entradas `agents/*/agent/models.json` geradas mantêm marcadores não secretos (não os valores de segredo resolvidos) para superfícies `apiKey`/de cabeçalho. A persistência dos marcadores tem a fonte como autoridade: o OpenClaw grava marcadores a partir do instantâneo ativo da configuração de origem (antes da resolução), e não a partir dos valores de segredo resolvidos em tempo de execução.
- Para pesquisa na web: no modo de provedor explícito (`tools.web.search.provider` definido), somente a chave do provedor selecionado fica ativa. No modo automático (`tools.web.search.provider` não definido), somente a primeira chave de provedor resolvida por precedência fica ativa, e as referências de provedores não selecionados são tratadas como inativas até serem selecionadas. Os caminhos de provedor `tools.web.search.*` legados ainda são resolvidos durante o período de compatibilidade, mas a superfície SecretRef canônica é `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciais incompatíveis

Estas credenciais pertencem a classes emitidas, rotacionadas, associadas a sessões ou persistentes de OAuth, que não são adequadas à resolução externa somente leitura de SecretRef:

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
