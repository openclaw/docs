---
read_when:
    - Verificando a cobertura de credenciais SecretRef
    - Auditando se uma credencial é qualificada para `secrets configure` ou `secrets apply`
    - Verificando por que uma credencial está fora da superfície compatível
summary: Superfície canônica de credenciais SecretRef com suporte e sem suporte
title: Superfície de credenciais SecretRef
x-i18n:
    generated_at: "2026-06-27T18:09:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Esta página define a superfície canônica de credenciais SecretRef.

Intenção do escopo:

- Dentro do escopo: credenciais estritamente fornecidas pelo usuário que o OpenClaw não emite nem rotaciona.
- Fora do escopo: credenciais emitidas ou rotacionadas em tempo de execução, material de atualização OAuth e artefatos semelhantes a sessões.

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
- `channels.googlechat.serviceAccount` via irmão `serviceAccountRef` (exceção de compatibilidade)
- `channels.googlechat.accounts.*.serviceAccount` via irmão `serviceAccountRef` (exceção de compatibilidade)

### Destinos de `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; sem suporte quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; sem suporte quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Observações:

- Destinos de plano de perfil de autenticação exigem `agentId`.
- Entradas de plano destinam-se a `profiles.*.key` / `profiles.*.token` e gravam refs irmãs (`keyRef` / `tokenRef`).
- Refs de perfil de autenticação estão incluídas na resolução em tempo de execução e na cobertura de auditoria.
- Em `openclaw.json`, SecretRefs devem usar objetos estruturados como `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Strings marcadoras legadas `secretref-env:<ENV_VAR>` são rejeitadas em caminhos de credenciais SecretRef; execute `openclaw doctor --fix` para migrar marcadores válidos.
- Proteção de política OAuth: `auth.profiles.<id>.mode = "oauth"` não pode ser combinado com entradas SecretRef para esse perfil. A inicialização/recarregamento e a resolução de perfil de autenticação falham rapidamente quando essa política é violada.
- Para provedores de modelos gerenciados por SecretRef, entradas geradas em `agents/*/agent/models.json` persistem marcadores não secretos (não valores secretos resolvidos) para superfícies de `apiKey`/cabeçalhos.
- A persistência de marcadores é autoritativa pela fonte: o OpenClaw grava marcadores do snapshot de configuração de origem ativo (pré-resolução), não de valores secretos resolvidos em tempo de execução.
- Para pesquisa na Web:
  - No modo de provedor explícito (`tools.web.search.provider` definido), somente a chave do provedor selecionado está ativa.
  - No modo automático (`tools.web.search.provider` não definido), somente a primeira chave de provedor resolvida por precedência está ativa.
  - No modo automático, refs de provedores não selecionados são tratadas como inativas até serem selecionadas.
  - Caminhos legados de provedor `tools.web.search.*` ainda são resolvidos durante a janela de compatibilidade, mas a superfície SecretRef canônica é `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciais sem suporte

Credenciais fora do escopo incluem:

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

Justificativa:

- Essas credenciais são classes emitidas, rotacionadas, portadoras de sessão ou duráveis de OAuth que não se encaixam na resolução SecretRef externa somente leitura.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Semântica de credenciais de autenticação](/pt-BR/auth-credential-semantics)
