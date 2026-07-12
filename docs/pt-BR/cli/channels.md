---
read_when:
    - Você quer adicionar ou remover contas de canais (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp e outros)
    - Você quer verificar o status do canal ou acompanhar os logs do canal em tempo real
summary: Referência da CLI para `openclaw channels` (contas, status, recursos, resolução, logs, login/logout)
title: Canais
x-i18n:
    generated_at: "2026-07-11T23:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gerencie contas de canais de chat e o status de execução delas no Gateway.

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
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` mostra somente canais de chat: por padrão, as contas configuradas, com indicadores de status `installed`, `configured` e `enabled` por conta (`--json` para saída processável por máquina). Passe `--all` para também exibir canais incluídos que ainda não tenham uma conta configurada e canais instaláveis do catálogo que ainda não estejam no disco. A autenticação de provedores e o uso de modelos ficam em outros comandos: `openclaw models auth list` para perfis de autenticação de provedores e `openclaw status` ou `openclaw models list` para uso/cota.

## Status / recursos / resolução / logs

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (padrão: `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (requer `--channel`), `--target <dest>` (requer `--channel`), `--timeout <ms>` (padrão: `10000`, limitado a `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (padrão: `auto`), `--json`
- `channels logs`: `--channel <name|all>` (padrão: `all`), `--lines <n>` (padrão: `200`), `--json`

`channels status --probe` é o caminho de verificação em tempo real: em um Gateway acessível, ele executa as verificações `probeAccount` e, opcionalmente, `auditAccount` para cada conta; portanto, a saída pode incluir o estado do transporte e resultados de verificação como `works`, `probe failed`, `audit ok` ou `audit failed`. Se o Gateway estiver inacessível, `channels status` recorre a resumos baseados somente na configuração, em vez da saída da verificação em tempo real.

Não use `openclaw sessions`, `sessions.list` do Gateway nem a ferramenta `sessions_list` do agente como indicador da integridade do socket do canal. Essas interfaces informam linhas de conversas armazenadas, não o estado de execução do provedor. Após a reinicialização de um provedor do Discord, uma conta conectada, mas sem atividade, pode estar íntegra mesmo que nenhuma linha de sessão do Discord apareça até o próximo evento de conversa recebido ou enviado.

## Adicionar / remover contas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra as opções de cada canal (token, chave privada, token do aplicativo, caminhos do signal-cli etc.).
</Tip>

`channels remove` opera somente em plugins de canal instalados/configurados. Para canais instaláveis do catálogo, use primeiro `channels add`. Sem `--delete`, ele solicita a desativação da conta e mantém sua configuração; `--delete` remove as entradas de configuração sem solicitar confirmação.
Para plugins de canal com suporte em tempo de execução, `channels remove` também solicita que o Gateway em execução interrompa a conta selecionada antes de atualizar a configuração. Assim, desativar ou excluir uma conta não mantém o listener antigo ativo até a reinicialização.

Opções de adição não interativa compartilhadas entre canais: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` e `--use-env` (autenticação baseada em variáveis de ambiente, somente para a conta padrão, quando houver suporte). As opções específicas de cada canal incluem:

| Canal       | Opções                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Se for necessário instalar um plugin de canal durante um comando de adição orientado por opções, o OpenClaw usará a fonte de instalação padrão do canal sem abrir a solicitação interativa de instalação do plugin.

Ao executar `openclaw channels add` sem opções, o assistente interativo pode solicitar:

- IDs das contas de cada canal selecionado
- nomes de exibição opcionais para essas contas
- `Route these channel accounts to agents now?`

Se você confirmar a vinculação imediata, o assistente perguntará qual agente deve ser responsável por cada conta de canal configurada e gravará vínculos de roteamento específicos por conta.

Você também pode gerenciar posteriormente as mesmas regras de roteamento com `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulte [agentes](/pt-BR/cli/agents)).

Quando você adiciona uma conta não padrão a um canal que ainda usa configurações de nível superior para uma única conta, o OpenClaw promove esses valores de nível superior para o mapa de contas do canal antes de gravar a nova conta. A promoção reutiliza uma conta nomeada existente quando o canal tem exatamente uma ou quando `defaultAccount` aponta para uma; caso contrário, os valores são armazenados em `channels.<channel>.accounts.default`.

O comportamento de roteamento permanece consistente:

- Vínculos existentes somente com o canal (sem `accountId`) continuam correspondendo à conta padrão.
- `channels add` não cria nem regrava vínculos automaticamente no modo não interativo.
- A configuração interativa pode adicionar opcionalmente vínculos específicos por conta.

Se sua configuração já estiver em um estado misto (com contas nomeadas presentes e valores de nível superior para uma única conta ainda definidos), execute `openclaw doctor --fix` para mover os valores específicos da conta para a conta promovida escolhida para esse canal.

## Login e logout (interativos)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` aceita `--account <id>` e `--verbose`; `channels logout` aceita `--account <id>`.
- `channels login` e `logout` podem inferir o canal quando somente um canal configurado aceita essa ação; quando houver vários, passe `--channel`.
- `channels logout` dá preferência ao caminho pelo Gateway ativo quando ele está acessível, para que o logout interrompa qualquer listener ativo antes de limpar o estado de autenticação do canal. Se um Gateway local não estiver acessível, ele recorre à limpeza da autenticação local; com `gateway.mode: "remote"`, o erro do Gateway faz o comando falhar.
- Após um login bem-sucedido, a CLI solicita que um Gateway local acessível inicie a conta; no modo remoto, ela salva a autenticação localmente e informa que o ambiente de execução remoto não foi reiniciado.
- Execute `channels login` em um terminal no host do Gateway. O `exec` do agente bloqueia esse fluxo de login interativo; ferramentas de login de agentes nativas do canal, como `whatsapp_login`, devem ser usadas pelo chat quando disponíveis.

## Solução de problemas

- Execute `openclaw status --deep` para uma verificação ampla.
- Use `openclaw doctor` para correções orientadas.
- `openclaw channels status` recorre a resumos baseados somente na configuração quando o Gateway está inacessível. Se a credencial de um canal compatível estiver configurada por meio de `SecretRef`, mas indisponível no caminho do comando atual, ele informará que a conta está configurada, com observações sobre a funcionalidade reduzida, em vez de mostrá-la como não configurada.

## Verificação de recursos

Obtenha indicações de recursos do provedor (intenções/escopos, quando disponíveis), além do suporte estático a funcionalidades:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Observações:

- `--channel` é opcional; omita-o para listar todos os canais (inclusive os fornecidos por plugins).
- `--account` só é válido com `--channel`.
- `--target` aceita `channel:<id>` ou um ID numérico bruto de canal e se aplica somente ao Discord. Para canais de voz do Discord, a verificação de permissões sinaliza a ausência de `ViewChannel`, `Connect`, `Speak`, `SendMessages` e `ReadMessageHistory`.
- As verificações são específicas de cada provedor: identidade do bot do Discord + intenções e permissões opcionais do canal; bot do Slack + escopos de usuário; opções do bot do Telegram + Webhook; versão do daemon do Signal; token do aplicativo do Microsoft Teams + funções/escopos do Graph (anotados quando conhecidos). Canais sem verificações informam `Probe: unavailable`.

## Resolver nomes em IDs

Resolva nomes de canais/usuários em IDs usando o diretório do provedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Observações:

- Use `--kind user|group|auto` para forçar o tipo de destino.
- A resolução dá preferência a correspondências ativas quando várias entradas têm o mesmo nome.
- `channels resolve` é somente leitura. Se uma conta selecionada estiver configurada por meio de `SecretRef`, mas essa credencial estiver indisponível no caminho do comando atual, o comando retornará resultados não resolvidos com funcionalidade reduzida e observações, em vez de interromper toda a execução.
- `channels resolve` não instala plugins de canal. Use `channels add --channel <name>` antes de resolver nomes para um canal instalável do catálogo.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Visão geral dos canais](/pt-BR/channels)
