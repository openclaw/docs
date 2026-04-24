---
read_when:
    - Você quer ajustar credenciais, dispositivos ou padrões do agente de forma interativa
summary: Referência da CLI para `openclaw configure` (prompts de configuração interativos)
title: Configurar
x-i18n:
    generated_at: "2026-04-24T05:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interativo para configurar credenciais, dispositivos e padrões do agente.

Observação: a seção **Modelo** agora inclui uma seleção múltipla para a allowlist
`agents.defaults.models` (o que aparece em `/model` e no seletor de modelo).
As escolhas de configuração com escopo de provedor mesclam os modelos selecionados à
allowlist existente em vez de substituir provedores não relacionados que já estão na configuração.

Quando a configuração começa a partir de uma escolha de autenticação de provedor, os seletores de modelo padrão e
de allowlist priorizam esse provedor automaticamente. Para provedores emparelhados, como
Volcengine/BytePlus, a mesma preferência também corresponde às variantes de plano de codificação
(`volcengine-plan/*`, `byteplus-plan/*`). Se o filtro de provedor preferido
produzir uma lista vazia, a configuração volta para o catálogo sem filtro em vez de mostrar um seletor vazio.

Dica: `openclaw config` sem subcomando abre o mesmo assistente. Use
`openclaw config get|set|unset` para edições não interativas.

Para pesquisa na web, `openclaw configure --section web` permite escolher um provedor
e configurar suas credenciais. Alguns provedores também exibem prompts adicionais específicos do provedor:

- **Grok** pode oferecer configuração opcional de `x_search` com a mesma `XAI_API_KEY` e
  permitir que você escolha um modelo `x_search`.
- **Kimi** pode solicitar a região da API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e o modelo padrão do Kimi para pesquisa na web.

Relacionado:

- Referência de configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- CLI de configuração: [Config](/pt-BR/cli/config)

## Opções

- `--section <section>`: filtro de seção repetível

Seções disponíveis:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Observações:

- Escolher onde o Gateway será executado sempre atualiza `gateway.mode`. Você pode selecionar "Continuar" sem outras seções se isso for tudo de que precisa.
- Serviços orientados a canal (Slack/Discord/Matrix/Microsoft Teams) solicitam allowlists de canal/sala durante a configuração. Você pode inserir nomes ou IDs; o assistente resolve nomes para IDs quando possível.
- Se você executar a etapa de instalação do daemon, a autenticação por token exige um token, e `gateway.auth.token` é gerenciado por SecretRef, a configuração valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado não puder ser resolvido, a configuração bloqueia a instalação do daemon com orientações práticas de correção.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a configuração bloqueia a instalação do daemon até que o modo seja definido explicitamente.

## Exemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Configuração](/pt-BR/gateway/configuration)
