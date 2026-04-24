---
read_when:
    - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Você quer verificar o status do canal ou acompanhar logs do canal
summary: Referência da CLI para `openclaw channels` (contas, status, login/logout, logs)
title: Canais
x-i18n:
    generated_at: "2026-04-24T05:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gerencie contas de canais de chat e seu status de runtime no Gateway.

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

## Status / capacidades / resolução / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (somente com `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` é o caminho em tempo real: em um gateway acessível, ele executa verificações
`probeAccount` por conta e `auditAccount` opcionais, então a saída pode incluir estado
de transporte mais resultados da probe, como `works`, `probe failed`, `audit ok` ou `audit failed`.
Se o gateway estiver inacessível, `channels status` recorre a resumos somente de configuração
em vez da saída de probe em tempo real.

## Adicionar / remover contas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Dica: `openclaw channels add --help` mostra flags por canal (token, chave privada, app token, caminhos do signal-cli etc.).

Superfícies comuns de adição não interativa incluem:

- canais com bot token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos do Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos do Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos do Nostr: `--private-key`, `--relay-urls`
- campos do Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticação da conta padrão sustentada por ambiente, quando compatível

Quando você executa `openclaw channels add` sem flags, o assistente interativo pode solicitar:

- IDs de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Bind configured channel accounts to agents now?`

Se você confirmar o vínculo agora, o assistente perguntará qual agente deve ser o proprietário de cada conta de canal configurada e gravará vínculos de roteamento no escopo da conta.

Você também pode gerenciar essas mesmas regras de roteamento mais tarde com `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulte [agents](/pt-BR/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda usa configurações de nível superior de conta única, o OpenClaw promove valores de nível superior com escopo de conta para o mapa de contas do canal antes de gravar a nova conta. A maioria dos canais coloca esses valores em `channels.<channel>.accounts.default`, mas canais incluídos podem preservar uma conta promovida correspondente já existente. Matrix é o exemplo atual: se já existir uma conta nomeada, ou se `defaultAccount` apontar para uma conta nomeada existente, a promoção preserva essa conta em vez de criar uma nova `accounts.default`.

O comportamento de roteamento permanece consistente:

- Vínculos existentes apenas por canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria nem regrava vínculos automaticamente no modo não interativo.
- A configuração interativa pode opcionalmente adicionar vínculos com escopo de conta.

Se sua configuração já estava em um estado misto (contas nomeadas presentes e valores de conta única de nível superior ainda definidos), execute `openclaw doctor --fix` para mover valores com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais promove para `accounts.default`; Matrix pode preservar um destino nomeado/padrão existente.

## Login / logout (interativo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Observações:

- `channels login` é compatível com `--verbose`.
- `channels login` / `logout` podem inferir o canal quando apenas um destino de login compatível está configurado.

## Solução de problemas

- Execute `openclaw status --deep` para uma probe ampla.
- Use `openclaw doctor` para correções guiadas.
- `openclaw channels list` mostra `Claude: HTTP 403 ... user:profile` → o snapshot de uso precisa do escopo `user:profile`. Use `--no-usage`, ou forneça uma chave de sessão do claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou reautentique via Claude CLI.
- `openclaw channels status` recorre a resumos somente de configuração quando o gateway está inacessível. Se uma credencial de canal compatível estiver configurada via SecretRef, mas indisponível no caminho de comando atual, ele relata essa conta como configurada com observações degradadas em vez de mostrá-la como não configurada.

## Probe de capacidades

Busque dicas de capacidades do provider (intents/escopos quando disponíveis) mais o suporte estático a recursos:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita-o para listar todos os canais (incluindo extensões).
- `--account` só é válido com `--channel`.
- `--target` aceita `channel:<id>` ou um ID numérico bruto de canal e se aplica somente ao Discord.
- As probes são específicas de cada provider: intents do Discord + permissões opcionais de canal; escopos de bot + usuário do Slack; flags do bot do Telegram + Webhook; versão do daemon do Signal; app token + papéis/escopos do Graph do Microsoft Teams (anotados quando conhecidos). Canais sem probes informam `Probe: unavailable`.

## Resolver nomes para IDs

Resolva nomes de canal/usuário para IDs usando o diretório do provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Observações:

- Use `--kind user|group|auto` para forçar o tipo de destino.
- A resolução prefere correspondências ativas quando várias entradas compartilham o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada estiver configurada via SecretRef, mas essa credencial estiver indisponível no caminho de comando atual, o comando retorna resultados degradados não resolvidos com observações em vez de abortar toda a execução.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral dos canais](/pt-BR/channels)
