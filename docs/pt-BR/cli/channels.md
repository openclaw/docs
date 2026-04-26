---
read_when:
    - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Você quer verificar o status do canal ou acompanhar os logs do canal
summary: Referência da CLI para `openclaw channels` (contas, status, login/logout, logs)
title: Canais
x-i18n:
    generated_at: "2026-04-26T12:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gerencie contas de canais de chat e seu status de execução no Gateway.

Documentação relacionada:

- Guias de canais: [Canais](/pt-BR/channels/index)
- Configuração do Gateway: [Configuração](/pt-BR/gateway/configuration)

## Comandos comuns

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capacidades / resolver / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (somente com `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` é o caminho em tempo real: em um gateway acessível, ele executa verificações `probeAccount` e `auditAccount` opcionais por conta, então a saída pode incluir o estado do transporte mais resultados de sondagem como `works`, `probe failed`, `audit ok` ou `audit failed`.
Se o gateway estiver inacessível, `channels status` recorre a resumos somente de configuração em vez de saída de sondagem em tempo real.

## Adicionar / remover contas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Dica: `openclaw channels add --help` mostra flags específicas por canal (token, chave privada, token de aplicativo, caminhos do signal-cli etc.).

Superfícies comuns de adição não interativa incluem:

- canais com bot token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte do Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos do Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos do Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos do Nostr: `--private-key`, `--relay-urls`
- campos do Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticação baseada em variáveis de ambiente da conta padrão, quando compatível

Se um Plugin de canal precisar ser instalado durante um comando de adição orientado por flags, o OpenClaw usa a origem de instalação padrão do canal sem abrir o prompt interativo de instalação de Plugin.

Quando você executa `openclaw channels add` sem flags, o assistente interativo pode solicitar:

- IDs de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Bind configured channel accounts to agents now?`

Se você confirmar o vínculo agora, o assistente pergunta qual agente deve ser o responsável por cada conta de canal configurada e grava vínculos de roteamento no escopo da conta.

Você também pode gerenciar essas mesmas regras de roteamento mais tarde com `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulte [agents](/pt-BR/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda está usando configurações de nível superior de conta única, o OpenClaw promove valores de nível superior no escopo da conta para o mapa de contas do canal antes de gravar a nova conta. A maioria dos canais coloca esses valores em `channels.<channel>.accounts.default`, mas canais incluídos podem preservar uma conta promovida correspondente já existente. Matrix é o exemplo atual: se já existir uma conta nomeada, ou se `defaultAccount` apontar para uma conta nomeada existente, a promoção preserva essa conta em vez de criar uma nova `accounts.default`.

O comportamento de roteamento permanece consistente:

- Vínculos existentes apenas por canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria nem reescreve vínculos automaticamente no modo não interativo.
- A configuração interativa pode adicionar vínculos opcionais no escopo da conta.

Se sua configuração já estava em um estado misto (contas nomeadas presentes e valores de conta única de nível superior ainda definidos), execute `openclaw doctor --fix` para mover valores no escopo da conta para a conta promovida escolhida para esse canal. A maioria dos canais promove para `accounts.default`; o Matrix pode preservar um destino nomeado/padrão existente.

## Login / logout (interativo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Observações:

- `channels login` aceita `--verbose`.
- `channels login` / `logout` podem inferir o canal quando apenas um destino de login compatível estiver configurado.

## Solução de problemas

- Execute `openclaw status --deep` para uma sondagem ampla.
- Use `openclaw doctor` para correções guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → o instantâneo de uso precisa do escopo `user:profile`. Use `--no-usage`, ou forneça uma chave de sessão do claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou reautentique via Claude CLI.
- `openclaw channels status` recorre a resumos somente de configuração quando o gateway está inacessível. Se uma credencial de canal compatível estiver configurada via SecretRef, mas indisponível no caminho de comando atual, ele reportará essa conta como configurada com observações de degradação em vez de mostrá-la como não configurada.

## Sondagem de capacidades

Busque dicas de capacidade do provedor (intents/scopes quando disponíveis) mais suporte estático a recursos:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita-o para listar todos os canais (incluindo extensões).
- `--account` só é válido com `--channel`.
- `--target` aceita `channel:<id>` ou um ID numérico bruto de canal e se aplica apenas ao Discord.
- As sondagens são específicas por provedor: intents do Discord + permissões opcionais de canal; escopos de bot + usuário do Slack; flags de bot + webhook do Telegram; versão do daemon do Signal; token de aplicativo do Microsoft Teams + papéis/escopos do Graph (anotados quando conhecidos). Canais sem sondagens reportam `Probe: unavailable`.

## Resolver nomes para IDs

Resolva nomes de canal/usuário para IDs usando o diretório do provedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Observações:

- Use `--kind user|group|auto` para forçar o tipo de destino.
- A resolução prefere correspondências ativas quando várias entradas compartilham o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada estiver configurada via SecretRef, mas essa credencial estiver indisponível no caminho de comando atual, o comando retornará resultados degradados não resolvidos com observações em vez de abortar toda a execução.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral dos canais](/pt-BR/channels)
