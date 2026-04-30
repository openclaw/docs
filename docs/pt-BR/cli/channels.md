---
read_when:
    - Você quer adicionar/remover contas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Você quer verificar o status do canal ou acompanhar os logs do canal
summary: Referência da CLI para `openclaw channels` (contas, status, login/logout, logs)
title: Canais
x-i18n:
    generated_at: "2026-04-30T09:40:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gerencie contas de canais de chat e seus status de execução no Gateway.

Documentos relacionados:

- Guias de canais: [Canais](/pt-BR/channels)
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

`channels status --probe` é o caminho ao vivo: em um gateway acessível, ele executa verificações `probeAccount` por conta e verificações opcionais `auditAccount`, então a saída pode incluir o estado de transporte mais resultados de sondagem, como `works`, `probe failed`, `audit ok` ou `audit failed`.
Se o gateway estiver inacessível, `channels status` volta para resumos somente de configuração em vez da saída de sondagem ao vivo.

## Adicionar / remover contas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra flags por canal (token, chave privada, token de app, caminhos do signal-cli etc.).
</Tip>

Superfícies comuns de adição não interativa incluem:

- canais com bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte do Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos do Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos do Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos do Nostr: `--private-key`, `--relay-urls`
- campos do Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticação baseada em variáveis de ambiente da conta padrão, quando compatível

Se um Plugin de canal precisar ser instalado durante um comando de adição orientado por flags, o OpenClaw usa a origem de instalação padrão do canal sem abrir o prompt interativo de instalação de Plugin.

Quando você executa `openclaw channels add` sem flags, o assistente interativo pode solicitar:

- ids de conta por canal selecionado
- nomes de exibição opcionais para essas contas
- `Bind configured channel accounts to agents now?`

Se você confirmar a vinculação agora, o assistente pergunta qual agente deve ser proprietário de cada conta de canal configurada e grava vinculações de roteamento com escopo de conta.

Você também pode gerenciar as mesmas regras de roteamento depois com `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulte [agentes](/pt-BR/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda está usando configurações de nível superior de conta única, o OpenClaw promove valores de nível superior com escopo de conta para o mapa de contas do canal antes de gravar a nova conta. A maioria dos canais coloca esses valores em `channels.<channel>.accounts.default`, mas canais integrados podem preservar uma conta promovida correspondente existente. O Matrix é o exemplo atual: se uma conta nomeada já existir, ou `defaultAccount` apontar para uma conta nomeada existente, a promoção preserva essa conta em vez de criar uma nova `accounts.default`.

O comportamento de roteamento permanece consistente:

- Vinculações existentes somente de canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria nem reescreve vinculações automaticamente no modo não interativo.
- A configuração interativa pode adicionar vinculações com escopo de conta opcionalmente.

Se sua configuração já estava em um estado misto (contas nomeadas presentes e valores de conta única de nível superior ainda definidos), execute `openclaw doctor --fix` para mover valores com escopo de conta para a conta promovida escolhida para esse canal. A maioria dos canais promove para `accounts.default`; o Matrix pode preservar um destino nomeado/padrão existente.

## Login e logout (interativo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` aceita `--verbose`.
- `channels login` e `logout` podem inferir o canal quando apenas um destino de login compatível está configurado.
- Execute `channels login` em um terminal no host do gateway. `exec` de agente bloqueia esse fluxo de login interativo; ferramentas de login nativas do canal para agentes, como `whatsapp_login`, devem ser usadas pelo chat quando disponíveis.

## Solução de problemas

- Execute `openclaw status --deep` para uma sondagem ampla.
- Use `openclaw doctor` para correções guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → o snapshot de uso precisa do escopo `user:profile`. Use `--no-usage`, ou forneça uma chave de sessão do claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou autentique novamente pela Claude CLI.
- `openclaw channels status` volta para resumos somente de configuração quando o gateway está inacessível. Se uma credencial de canal compatível estiver configurada via SecretRef, mas indisponível no caminho do comando atual, ele relata essa conta como configurada com notas degradadas, em vez de mostrá-la como não configurada.

## Sondagem de capacidades

Busque dicas de capacidades do provedor (intents/escopos quando disponíveis) mais suporte estático a recursos:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita-o para listar todos os canais (incluindo extensions).
- `--account` só é válido com `--channel`.
- `--target` aceita `channel:<id>` ou um id numérico bruto de canal e se aplica apenas ao Discord.
- As sondagens são específicas do provedor: intents do Discord + permissões opcionais de canal; escopos de bot + usuário do Slack; flags de bot + Webhook do Telegram; versão do daemon do Signal; token de app do Microsoft Teams + papéis/escopos do Graph (anotados quando conhecidos). Canais sem sondagens relatam `Probe: unavailable`.

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

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Visão geral dos canais](/pt-BR/channels)
