---
read_when:
    - Você quer ajustar credenciais, dispositivos ou padrões de agente de forma interativa
summary: Referência da CLI para `openclaw configure` (prompts de configuração interativos)
title: configurar
x-i18n:
    generated_at: "2026-04-23T14:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interativo para configurar credenciais, dispositivos e padrões de agente.

Observação: a seção **Model** agora inclui uma seleção múltipla para a allowlist
`agents.defaults.models` (o que aparece em `/model` e no seletor de modelo).
As opções de configuração com escopo de provider mesclam seus modelos selecionados à
allowlist existente em vez de substituir providers não relacionados já presentes na configuração.

Quando o configure é iniciado a partir de uma escolha de autenticação de provider, os seletores de
modelo padrão e allowlist passam a priorizar esse provider automaticamente. Para providers pareados, como
Volcengine/BytePlus, essa mesma preferência também corresponde às variantes de
plano de programação (`volcengine-plan/*`, `byteplus-plan/*`). Se o filtro de
provider preferido resultar em uma lista vazia, o configure recorre ao catálogo
sem filtro em vez de mostrar um seletor vazio.

Dica: `openclaw config` sem um subcomando abre o mesmo assistente. Use
`openclaw config get|set|unset` para edições não interativas.

Para pesquisa na web, `openclaw configure --section web` permite escolher um provider
e configurar suas credenciais. Alguns providers também mostram prompts
de acompanhamento específicos do provider:

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
- Se você executar a etapa de instalação do daemon, a autenticação por token exigirá um token e, como `gateway.auth.token` é gerenciado por SecretRef, o configure valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o SecretRef do token configurado não estiver resolvido, o configure bloqueia a instalação do daemon com orientações de correção acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o configure bloqueia a instalação do daemon até que o modo seja definido explicitamente.

## Exemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
