---
read_when:
    - Você quer ajustar credenciais, dispositivos ou padrões do agente de forma interativa
summary: Referência da CLI para `openclaw configure` (prompts de configuração interativa)
title: Configurar
x-i18n:
    generated_at: "2026-06-27T17:18:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interativo para alterações direcionadas em uma configuração existente: credenciais, dispositivos, padrões de agente, Gateway, canais, plugins, Skills e verificações de integridade.

Use `openclaw onboard` para a jornada inicial completa e guiada, `openclaw setup` apenas para a configuração/workspace de base e `openclaw channels add` quando você precisar somente configurar uma conta de canal.

<Note>
A seção **Modelo** inclui uma seleção múltipla para a lista de permissões `agents.defaults.models` (o que aparece em `/model` e no seletor de modelos). As escolhas de configuração com escopo de provedor mesclam os modelos selecionados à lista de permissões existente, em vez de substituir provedores não relacionados que já estejam na configuração.

Executar novamente a autenticação do provedor a partir de configure preserva um `agents.defaults.model.primary` existente, mesmo quando a etapa de autenticação do provedor retorna um patch de configuração com seu próprio modelo padrão recomendado. Isso significa que adicionar ou reautenticar xAI, OpenRouter ou outro provedor deve disponibilizar o novo modelo sem assumir o lugar do seu modelo primário atual. Use `openclaw models auth login --provider <id> --set-default` ou `openclaw models set <model>` quando você quiser alterar intencionalmente o modelo padrão.
</Note>

Quando configure começa a partir de uma escolha de autenticação de provedor, os seletores de modelo padrão e lista de permissões preferem esse provedor automaticamente. Para provedores pareados, como Volcengine e BytePlus, a mesma preferência também corresponde às variantes de plano de codificação deles (`volcengine-plan/*`, `byteplus-plan/*`). Se o filtro de provedor preferido produzir uma lista vazia, configure volta ao catálogo sem filtro em vez de mostrar um seletor em branco.

<Tip>
`openclaw config` sem um subcomando abre o mesmo assistente. Use `openclaw config get|set|unset` para edições não interativas.
</Tip>

Para pesquisa na web, `openclaw configure --section web` permite escolher um provedor
e configurar suas credenciais. Alguns provedores também mostram prompts de acompanhamento
específicos do provedor:

- **Grok** pode oferecer a configuração opcional de `x_search` com o mesmo perfil OAuth da xAI
  ou chave de API, e permitir que você escolha um modelo `x_search`.
- **Kimi** pode solicitar a região da API da Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e o modelo padrão de pesquisa na web do Kimi.

Relacionado:

- Referência de configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)
- CLI de configuração: [Configuração](/pt-BR/cli/config)

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

- O assistente completo e as seções relacionadas ao Gateway perguntam onde o Gateway é executado e atualizam `gateway.mode`. Filtros de seção que não incluem `gateway`, `daemon` ou `health` vão diretamente para a configuração solicitada.
- Após gravações na configuração local, configure instala os plugins baixáveis selecionados quando o caminho de configuração escolhido exige isso. A configuração de Gateway remoto não instala pacotes de plugins locais.
- Serviços orientados a canais (Slack/Discord/Matrix/Microsoft Teams) solicitam listas de permissões de canais/salas durante a configuração. Você pode inserir nomes ou IDs; o assistente resolve nomes para IDs quando possível.
- Se você executar a etapa de instalação do daemon, a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, configure valida a SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e a SecretRef de token configurada não estiver resolvida, configure bloqueia a instalação do daemon com orientação acionável para correção.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, configure bloqueia a instalação do daemon até que o modo seja definido explicitamente.

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
