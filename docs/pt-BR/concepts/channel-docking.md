---
read_when:
    - Você quer que as respostas de uma sessão ativa sejam transferidas do Telegram para o Discord, Slack, Mattermost ou outro canal vinculado
    - Você está configurando `session.identityLinks` para mensagens diretas entre canais
    - Um comando /dock informa que o remetente não está vinculado ou que não existe uma sessão ativa
summary: Mover a rota de resposta de uma sessão do OpenClaw entre canais de chat vinculados
title: Acoplamento de canais
x-i18n:
    generated_at: "2026-07-11T23:53:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

O acoplamento de canais é o encaminhamento de chamadas para uma sessão do OpenClaw. Ele mantém o mesmo
contexto da conversa, mas altera o local para onde as respostas futuras dessa sessão são
entregues. O acoplamento funciona apenas em uma conversa direta; ele não é executado em uma conversa
em grupo.

## Exemplo

Alice pode enviar mensagens ao OpenClaw pelo Telegram e pelo Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Se Alice enviar isto em uma conversa direta no Telegram:

```text
/dock_discord
```

O OpenClaw mantém o contexto da sessão atual e altera a rota de resposta:

| Antes do acoplamento              | Depois de `/dock_discord`       |
| --------------------------------- | ------------------------------- |
| As respostas vão para o Telegram `123` | As respostas vão para o Discord `456` |

A sessão não é recriada. O histórico da transcrição permanece vinculado à
mesma sessão.

## Por que usar

Use o acoplamento quando uma tarefa começar em um aplicativo de conversa, mas as próximas respostas precisarem ser entregues
em outro lugar.

Fluxo comum:

1. Inicie uma tarefa de agente pelo Telegram.
2. Vá para o Discord, onde você está coordenando o trabalho.
3. Envie `/dock_discord` pela conversa direta no Telegram.
4. Mantenha a mesma sessão do OpenClaw, mas receba as respostas futuras no Discord.

## Configuração obrigatória

O acoplamento requer `session.identityLinks`. O remetente de origem e o contato de destino
devem estar no mesmo grupo de identidade:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Os valores são IDs de contatos prefixados pelo canal:

| Valor          | Significado                        |
| -------------- | ---------------------------------- |
| `telegram:123` | ID do remetente no Telegram `123`  |
| `discord:456`  | ID do contato direto no Discord `456` |
| `slack:U123`   | ID do usuário no Slack `U123`      |

A chave canônica (`alice` acima) é apenas o nome compartilhado do grupo de identidade. Os comandos de
acoplamento usam os valores prefixados pelo canal para comprovar que o remetente de origem e o
contato de destino são a mesma pessoa.

## Comandos

O OpenClaw gera um comando `/dock-<channel>` para cada Plugin de canal carregado
que oferece suporte a comandos nativos; portanto, a lista aumenta à medida que Plugins são adicionados. Os Plugins
incluídos que atualmente oferecem esse suporte são:

| Canal de destino | Comando            | Alias              |
| ---------------- | ------------------ | ------------------ |
| Discord          | `/dock-discord`    | `/dock_discord`    |
| Mattermost       | `/dock-mattermost` | `/dock_mattermost` |
| Slack            | `/dock-slack`      | `/dock_slack`      |
| Telegram         | `/dock-telegram`   | `/dock_telegram`   |

A forma com sublinhado também é o nome do comando nativo em interfaces como o Telegram,
que expõem comandos de barra diretamente.

## O que muda

O acoplamento atualiza os campos de entrega da sessão ativa:

| Campo da sessão  | Exemplo depois de `/dock_discord`       |
| ---------------- | ---------------------------------------- |
| `lastChannel`    | `discord`                                |
| `lastTo`         | `456`                                    |
| `lastAccountId`  | a conta do canal de destino ou `default` |

Esses campos são persistidos no armazenamento de sessões e usados na entrega de respostas
posteriores dessa sessão.

## O que não muda

O acoplamento não:

- cria contas de canal
- conecta um novo bot do Discord, Telegram, Slack ou Mattermost
- concede acesso a um usuário
- ignora listas de permissões de canais ou políticas de mensagens diretas
- move o histórico da transcrição para outra sessão
- faz usuários não relacionados compartilharem uma sessão

Ele altera apenas a rota de entrega da sessão atual.

## Solução de problemas

**O comando informa que o remetente não está vinculado.**

Adicione o remetente atual e o contato de destino ao mesmo grupo
`session.identityLinks`. Por exemplo, se o remetente `123` do Telegram precisar acoplar
ao contato `456` do Discord, inclua `telegram:123` e `discord:456`.

**O comando informa que o acoplamento está disponível apenas em conversas diretas.**

Envie o comando de acoplamento em uma conversa direta com o OpenClaw, não em uma conversa em grupo.

**O comando informa que não existe uma sessão ativa.**

Faça o acoplamento a partir de uma sessão existente de conversa direta. O comando precisa de uma entrada de sessão ativa
para poder persistir a nova rota.

**As respostas ainda vão para o canal antigo.**

Verifique se o comando respondeu com uma mensagem de êxito e confirme se o
ID do contato de destino corresponde ao ID usado pelo canal. O acoplamento altera apenas a rota da
sessão ativa; outra sessão ainda pode estar roteada para outro local.

**Preciso voltar ao canal anterior.**

Envie o comando correspondente ao canal original, como `/dock_telegram` ou
`/dock-telegram`, a partir de um remetente vinculado.
