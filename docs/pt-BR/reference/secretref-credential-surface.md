---
read_when:
    - Verificando a cobertura de credenciais SecretRef
    - Auditando se uma credencial é elegível para `secrets configure` ou `secrets apply`
    - Verificando por que uma credencial está fora da superfície compatível
summary: Superfície canônica compatível vs incompatível de credenciais SecretRef
title: Superfície de credenciais SecretRef
x-i18n:
    generated_at: "2026-04-25T13:55:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50a4602939970d92831c0de9339e84b0f42b119c2e25ea30375925282f55d237
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Esta página define a superfície canônica de credenciais SecretRef.

Intenção do escopo:

- Dentro do escopo: credenciais estritamente fornecidas pelo usuário que o OpenClaw não emite nem rotaciona.
- Fora do escopo: credenciais emitidas ou rotacionadas em runtime, material de refresh OAuth e artefatos do tipo sessão.

## Credenciais compatíveis

### Alvos de `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` via `serviceAccountRef` irmão (exceção de compatibilidade)
- `channels.googlechat.accounts.*.serviceAccount` via `serviceAccountRef` irmão (exceção de compatibilidade)

### Alvos de `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; não compatível quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; não compatível quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Observações:

- Alvos de plano de perfil de autenticação exigem `agentId`.
- Entradas de plano têm como alvo `profiles.*.key` / `profiles.*.token` e gravam refs irmãs (`keyRef` / `tokenRef`).
- Refs de perfil de autenticação são incluídas na resolução em runtime e na cobertura de auditoria.
- Em `openclaw.json`, SecretRefs devem usar objetos estruturados como `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Strings de marcador legadas `secretref-env:<ENV_VAR>` são rejeitadas em caminhos de credencial SecretRef; execute `openclaw doctor --fix` para migrar marcadores válidos.
- Portão de política OAuth: `auth.profiles.<id>.mode = "oauth"` não pode ser combinado com entradas SecretRef para esse perfil. Inicialização/reload e resolução de perfil de autenticação falham rapidamente quando essa política é violada.
- Para providers de modelo gerenciados por SecretRef, entradas geradas em `agents/*/agent/models.json` persistem marcadores não secretos (não valores secretos resolvidos) para superfícies `apiKey`/header.
- A persistência de marcadores é autoritativa da fonte: o OpenClaw grava marcadores a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores secretos resolvidos em runtime.
- Para pesquisa na web:
  - No modo de provider explícito (`tools.web.search.provider` definido), apenas a chave do provider selecionado fica ativa.
  - No modo automático (`tools.web.search.provider` não definido), apenas a primeira chave de provider que resolver por precedência fica ativa.
  - No modo automático, refs de provider não selecionadas são tratadas como inativas até serem selecionadas.
  - Caminhos legados de provider `tools.web.search.*` ainda são resolvidos durante a janela de compatibilidade, mas a superfície canônica de SecretRef é `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciais não compatíveis

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

- Essas credenciais são classes emitidas, rotacionadas, com portador de sessão ou duráveis de OAuth que não se encaixam na resolução externa de SecretRef somente leitura.

## Relacionado

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [Semântica de credenciais de autenticação](/pt-BR/auth-credential-semantics)
