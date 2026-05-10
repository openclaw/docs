---
read_when:
    - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Você quer verificar o status do canal ou acompanhar os logs do canal em tempo real
summary: Referência da CLI para `openclaw channels` (accounts, status, login/logout, logs)
title: Canais
x-i18n:
    generated_at: "2026-05-10T19:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gerencie contas de canais de chat e seu status em tempo de execução no Gateway.

Documentação relacionada:

- Guias de canais: [Canais](/pt-BR/channels)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)

## Comandos comuns

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` mostra apenas canais de chat: contas configuradas por padrão, com tags de status `installed`, `configured` e `enabled` por conta. Passe `--all` para também exibir canais incluídos que ainda não têm uma conta configurada e canais do catálogo instaláveis que ainda não estão no disco. Provedores de autenticação (OAuth + chaves de API) e instantâneos de uso/cota de provedores de modelo não são mais impressos aqui; use `openclaw models auth list` para perfis de autenticação de provedores e `openclaw status` ou `openclaw models list` para uso.

## Status / capacidades / resolução / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (somente com `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` é o caminho ao vivo: em um gateway acessível, ele executa verificações
`probeAccount` por conta e verificações opcionais `auditAccount`, então a saída pode incluir o estado
de transporte mais resultados de sondagem como `works`, `probe failed`, `audit ok` ou `audit failed`.
Se o gateway estiver inacessível, `channels status` volta a resumos apenas de configuração
em vez da saída de sondagem ao vivo.

Não use `openclaw sessions`, `sessions.list` do Gateway ou a ferramenta
`sessions_list` do agente como sinal de integridade do soquete do canal. Essas superfícies relatam
linhas de conversas armazenadas, não o estado de runtime do provedor. Após a reinicialização de um provedor Discord,
uma conta conectada, porém silenciosa, pode estar íntegra enquanto nenhuma linha de sessão do Discord
aparece até o próximo evento de conversa de entrada ou saída.

## Adicionar / remover contas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra flags por canal (token, chave privada, token de aplicativo, caminhos signal-cli etc.).
</Tip>

`channels remove` opera apenas em Plugins de canal instalados/configurados. Use `channels add` primeiro para canais instaláveis do catálogo.
Para Plugins de canal com suporte de runtime, `channels remove` também pede ao Gateway em execução que pare a conta selecionada antes de atualizar a configuração, então desabilitar ou excluir uma conta não deixa o listener antigo ativo até a reinicialização.

Superfícies comuns de adição não interativa incluem:

- canais com bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte do Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos do Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos do Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos do Nostr: `--private-key`, `--relay-urls`
- campos do Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticação baseada em env da conta padrão onde houver suporte

Se um Plugin de canal precisar ser instalado durante um comando de adição orientado por flags, o OpenClaw usa a fonte de instalação padrão do canal sem abrir o prompt interativo de instalação de Plugin.

Quando você executa `openclaw channels add` sem flags, o assistente interativo pode solicitar:

- IDs de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Route these channel accounts to agents now?`

Se você confirmar a vinculação agora, o assistente pergunta qual agente deve ser dono de cada conta de canal configurada e grava vinculações de roteamento com escopo de conta.

Você também pode gerenciar as mesmas regras de roteamento depois com `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulte [agentes](/pt-BR/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda usa configurações de nível superior de conta única, o OpenClaw promove valores de nível superior com escopo de conta para o mapa de contas do canal antes de gravar a nova conta. A maioria dos canais coloca esses valores em `channels.<channel>.accounts.default`, mas canais incluídos podem preservar uma conta promovida correspondente existente. Matrix é o exemplo atual: se uma conta nomeada já existir, ou `defaultAccount` apontar para uma conta nomeada existente, a promoção preserva essa conta em vez de criar uma nova `accounts.default`.

O comportamento de roteamento permanece consistente:

- Vinculações existentes apenas de canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria automaticamente nem reescreve vinculações no modo não interativo.
- A configuração interativa pode opcionalmente adicionar vinculações com escopo de conta.

Se sua configuração já estava em um estado misto (contas nomeadas presentes e valores de nível superior de conta única ainda definidos), execute `openclaw doctor --fix` para mover valores com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais promove para `accounts.default`; Matrix pode preservar um destino nomeado/padrão existente.

## Login e logout (interativo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` aceita `--verbose`.
- `channels login` e `logout` podem inferir o canal quando apenas um destino de login compatível está configurado.
- `channels logout` prefere o caminho ao vivo do Gateway quando acessível, então o logout para qualquer listener ativo antes de limpar o estado de autenticação do canal. Se um Gateway local não estiver acessível, ele volta para a limpeza local de autenticação.
- Execute `channels login` em um terminal no host do gateway. `exec` de agente bloqueia esse fluxo de login interativo; ferramentas de login nativas do canal para agentes, como `whatsapp_login`, devem ser usadas pelo chat quando disponíveis.

## Solução de problemas

- Execute `openclaw status --deep` para uma sondagem ampla.
- Use `openclaw doctor` para correções guiadas.
- `openclaw channels list` não imprime mais instantâneos de uso/cota de provedores de modelo. Para esses dados, use `openclaw status` (visão geral) ou `openclaw models list` (por provedor).
- `openclaw channels status` volta para resumos apenas de configuração quando o gateway está inacessível. Se uma credencial de canal compatível estiver configurada via SecretRef, mas indisponível no caminho do comando atual, ela relata essa conta como configurada com notas degradadas em vez de mostrá-la como não configurada.

## Sondagem de capacidades

Busque dicas de capacidades do provedor (intents/escopos quando disponíveis), além de suporte estático a recursos:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita-o para listar todos os canais (incluindo extensões).
- `--account` só é válido com `--channel`.
- `--target` aceita `channel:<id>` ou um ID numérico bruto de canal e se aplica apenas ao Discord. Para canais de voz do Discord, a verificação de permissões sinaliza a ausência de `ViewChannel`, `Connect`, `Speak`, `SendMessages` e `ReadMessageHistory`.
- As sondagens são específicas do provedor: intents do Discord + permissões opcionais de canal; escopos de bot + usuário do Slack; flags de bot do Telegram + Webhook; versão do daemon do Signal; token de aplicativo do Microsoft Teams + funções/escopos do Graph (anotados quando conhecidos). Canais sem sondagens relatam `Probe: unavailable`.

## Resolver nomes para IDs

Resolva nomes de canais/usuários para IDs usando o diretório do provedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Observações:

- Use `--kind user|group|auto` para forçar o tipo de destino.
- A resolução prefere correspondências ativas quando várias entradas compartilham o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada estiver configurada via SecretRef, mas essa credencial estiver indisponível no caminho do comando atual, o comando retorna resultados degradados não resolvidos com notas em vez de abortar toda a execução.
- `channels resolve` não instala Plugins de canal. Use `channels add --channel <name>` antes de resolver nomes para um canal instalável do catálogo.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral dos canais](/pt-BR/channels)
