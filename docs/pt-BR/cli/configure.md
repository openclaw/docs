---
read_when:
    - Você quer ajustar credenciais, dispositivos ou padrões do agente de forma interativa
summary: Referência da CLI para `openclaw configure` (solicitações de configuração interativas)
title: Configurar
x-i18n:
    generated_at: "2026-07-11T23:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompts interativos para alterações específicas em uma configuração existente: credenciais, dispositivos, padrões de agentes, Gateway, canais, plugins, Skills e verificações de integridade.

Use `openclaw onboard` ou `openclaw setup` para realizar todo o processo guiado da primeira execução, `openclaw setup --baseline` somente para a configuração básica e o espaço de trabalho, e `openclaw channels add` quando você precisar apenas configurar uma conta de canal.

<Tip>
`openclaw config` sem subcomando abre o mesmo assistente. Use `openclaw config get|set|unset` para edições não interativas.
</Tip>

## Opções

`--section <section>`: filtro de seção repetível. Seções disponíveis:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Selecionar `gateway`, `daemon` ou `health` (ou executar o assistente completo sem `--section`) solicita onde o Gateway é executado e atualiza `gateway.mode`. Os filtros de seção que ignoram as três opções seguem diretamente para a configuração solicitada, sem solicitar o modo do Gateway. Escolher o modo de Gateway remoto grava a configuração remota e encerra imediatamente; essa opção não executa etapas exclusivamente locais, como instalações de plugins.

<Note>
`openclaw configure` requer um terminal interativo (tanto stdin quanto stdout devem ser TTYs). Sem um terminal interativo, o comando exibe os comandos não interativos equivalentes `openclaw config get|set|patch|validate` e encerra com um erro, em vez de executar apenas parcialmente.
</Note>

## Seção de modelo

<Note>
**Modelo** inclui uma seleção múltipla para a lista de permissões `agents.defaults.models` (o que aparece em `/model` e no seletor de modelos). As opções de configuração específicas de um provedor incorporam os modelos selecionados à lista de permissões existente, em vez de substituir provedores não relacionados que já estejam na configuração.

Executar novamente a autenticação de um provedor por meio de configure preserva um `agents.defaults.model.primary` existente, mesmo quando a etapa de autenticação do provedor retorna uma atualização de configuração com seu próprio modelo padrão recomendado. Adicionar ou autenticar novamente um provedor disponibiliza os modelos dele sem substituir seu modelo principal atual. Use `openclaw models auth login --provider <id> --set-default` ou `openclaw models set <model>` para alterar intencionalmente o modelo padrão.
</Note>

Quando configure é iniciado a partir de uma opção de autenticação de provedor, os seletores de modelo padrão e da lista de permissões priorizam automaticamente esse provedor. Para provedores pareados, como Volcengine e BytePlus, a mesma preferência também corresponde às variantes de planos de programação (`volcengine-plan/*`, `byteplus-plan/*`). Se o filtro do provedor preferencial produzir uma lista vazia, configure usa o catálogo sem filtro, em vez de exibir um seletor vazio.

## Seção web

`openclaw configure --section web` seleciona um provedor de pesquisa na web e configura suas credenciais. Alguns provedores exibem opções adicionais específicas:

- **Grok** pode oferecer a configuração opcional de `x_search` com o mesmo perfil OAuth da xAI ou chave de API e permitir a escolha de um modelo de `x_search`.
- **Kimi** pode solicitar a região da API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) e o modelo padrão de pesquisa na web do Kimi.

## Outras observações

- Após gravar a configuração local, configure instala os plugins selecionados disponíveis para download quando o caminho de configuração escolhido os exige. A configuração do Gateway remoto não instala pacotes locais de plugins.
- Serviços voltados a canais (Slack/Discord/Matrix/Microsoft Teams) solicitam listas de permissões de canais/salas durante a configuração. Você pode inserir nomes ou IDs; o assistente resolve os nomes em IDs quando possível.
- Se você executar a etapa de instalação do daemon, a autenticação por token exigirá um token. Se `gateway.auth.token` for gerenciado por SecretRef, configure validará o SecretRef, mas não persistirá os valores resolvidos do token em texto simples nos metadados de ambiente do serviço supervisor; se o SecretRef não puder ser resolvido, configure bloqueará a instalação do daemon e fornecerá orientações práticas para a correção.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, configure bloqueará a instalação do daemon até que você defina explicitamente o modo.

## Conteúdo relacionado

- [Referência da CLI](/pt-BR/cli)
- [Configuração](/pt-BR/gateway/configuration)
- CLI de configuração: [Configuração](/pt-BR/cli/config)
