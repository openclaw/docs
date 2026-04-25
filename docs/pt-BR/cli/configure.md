---
read_when:
    - Você quer ajustar credenciais, dispositivos ou padrões do agente de forma interativa
summary: Referência da CLI para `openclaw configure` (prompts de configuração interativos)
title: Configurar
x-i18n:
    generated_at: "2026-04-25T13:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interativo para configurar credenciais, dispositivos e padrões do agente.

Observação: a seção **Model** agora inclui uma seleção múltipla para a allowlist `agents.defaults.models`
(o que aparece em `/model` e no seletor de modelo).
As opções de configuração com escopo de provedor mesclam seus modelos selecionados à allowlist
existente em vez de substituir provedores não relacionados já presentes na configuração.
Executar novamente a autenticação do provedor a partir de configure preserva um
`agents.defaults.model.primary` existente; use `openclaw models auth login --provider <id> --set-default`
ou `openclaw models set <model>` quando você realmente quiser mudar o modelo padrão.

Quando o configure inicia a partir de uma escolha de autenticação de provedor, os seletores de modelo padrão e
de allowlist priorizam esse provedor automaticamente. Para provedores emparelhados, como
Volcengine/BytePlus, a mesma preferência também corresponde às variantes de plano de codificação
(`volcengine-plan/*`, `byteplus-plan/*`). Se o filtro de provedor preferido
produzir uma lista vazia, o configure volta ao catálogo sem filtro em vez de mostrar
um seletor vazio.

Dica: `openclaw config` sem subcomando abre o mesmo assistente. Use
`openclaw config get|set|unset` para edições não interativas.

Para pesquisa na web, `openclaw configure --section web` permite escolher um provedor
e configurar suas credenciais. Alguns provedores também mostram prompts adicionais
específicos do provedor:

- **Grok** pode oferecer configuração opcional de `x_search` com a mesma `XAI_API_KEY` e
  permitir que você escolha um modelo `x_search`.
- **Kimi** pode solicitar a região da API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e o modelo padrão de pesquisa na web do Kimi.

Relacionado:

- Referência de configuração do Gateway: [Configuration](/pt-BR/gateway/configuration)
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

- Escolher onde o Gateway é executado sempre atualiza `gateway.mode`. Você pode selecionar "Continuar" sem outras seções se isso for tudo de que precisa.
- Serviços orientados a canal (Slack/Discord/Matrix/Microsoft Teams) solicitam allowlists de canal/sala durante a configuração. Você pode inserir nomes ou IDs; o assistente resolve nomes para IDs quando possível.
- Se você executar a etapa de instalação do daemon, a autenticação por token exigir um token, e `gateway.auth.token` for gerenciado por SecretRef, o configure valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o configure bloqueia a instalação do daemon com orientações de correção acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o configure bloqueia a instalação do daemon até que o modo seja definido explicitamente.

## Exemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Configuration](/pt-BR/gateway/configuration)
