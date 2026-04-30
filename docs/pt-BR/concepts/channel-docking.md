---
read_when:
    - Você quer que as respostas de uma sessão ativa passem do Telegram para Discord, Slack, Mattermost ou outro canal vinculado
    - Você está configurando session.identityLinks para mensagens diretas entre canais
    - Um comando /dock informa que o remetente não está vinculado ou que não existe nenhuma sessão ativa
summary: Mover a rota de resposta de uma sessão do OpenClaw entre canais de bate-papo vinculados
title: Acoplamento de canais
x-i18n:
    generated_at: "2026-04-30T09:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

O acoplamento de canal é o encaminhamento de chamadas para uma sessão do OpenClaw.

Ele mantém o mesmo contexto de conversa, mas altera onde as respostas futuras dessa sessão serão entregues.

## Exemplo

Alice pode enviar mensagens para o OpenClaw pelo Telegram e Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Se Alice enviar isto pelo Telegram:

```text
/dock_discord
```

O OpenClaw mantém o contexto da sessão atual e altera a rota de resposta:

| Antes do acoplamento              | Depois de `/dock_discord`      |
| --------------------------------- | ------------------------------ |
| As respostas vão para Telegram `123` | As respostas vão para Discord `456` |

A sessão não é recriada. O histórico da transcrição permanece anexado à mesma sessão.

## Por que usar

Use o acoplamento quando uma tarefa começa em um app de chat, mas as próximas respostas devem chegar em outro lugar.

Fluxo comum:

1. Inicie uma tarefa de agente pelo Telegram.
2. Vá para o Discord, onde você está coordenando o trabalho.
3. Envie `/dock_discord` a partir da sessão do Telegram.
4. Mantenha a mesma sessão do OpenClaw, mas receba respostas futuras no Discord.

## Configuração obrigatória

O acoplamento exige `session.identityLinks`. O remetente de origem e o par de destino devem estar no mesmo grupo de identidade:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Os valores são IDs de pares prefixados pelo canal:

| Valor          | Significado                         |
| -------------- | ----------------------------------- |
| `telegram:123` | ID de remetente do Telegram `123`   |
| `discord:456`  | ID de par direto do Discord `456`   |
| `slack:U123`   | ID de usuário do Slack `U123`       |

A chave canônica (`alice` acima) é apenas o nome do grupo de identidade compartilhado. Os comandos de acoplamento usam os valores prefixados pelo canal para provar que o remetente de origem e o par de destino são a mesma pessoa.

## Comandos

Os comandos de acoplamento são gerados a partir de plugins de canal carregados que oferecem suporte a comandos nativos. Comandos empacotados atuais:

| Canal de destino | Comando            | Alias              |
| ---------------- | ------------------ | ------------------ |
| Discord          | `/dock-discord`    | `/dock_discord`    |
| Mattermost       | `/dock-mattermost` | `/dock_mattermost` |
| Slack            | `/dock-slack`      | `/dock_slack`      |
| Telegram         | `/dock-telegram`   | `/dock_telegram`   |

Os aliases com sublinhado são úteis em superfícies de comando nativas, como o Telegram.

## O que muda

O acoplamento atualiza os campos de entrega da sessão ativa:

| Campo da sessão | Exemplo após `/dock_discord`              |
| --------------- | ----------------------------------------- |
| `lastChannel`   | `discord`                                 |
| `lastTo`        | `456`                                     |
| `lastAccountId` | a conta do canal de destino, ou `default` |

Esses campos são persistidos no armazenamento de sessões e usados pela entrega de respostas posterior dessa sessão.

## O que não muda

O acoplamento não:

- cria contas de canal
- conecta um novo bot do Discord, Telegram, Slack ou Mattermost
- concede acesso a um usuário
- ignora listas de permissão de canais ou políticas de DM
- move o histórico da transcrição para outra sessão
- faz usuários não relacionados compartilharem uma sessão

Ele apenas altera a rota de entrega da sessão atual.

## Solução de problemas

**O comando diz que o remetente não está vinculado.**

Adicione o remetente atual e o par de destino ao mesmo grupo `session.identityLinks`. Por exemplo, se o remetente do Telegram `123` deve ser acoplado ao par do Discord `456`, inclua `telegram:123` e `discord:456`.

**O comando diz que não existe uma sessão ativa.**

Faça o acoplamento a partir de uma sessão de chat direto existente. O comando precisa de uma entrada de sessão ativa para poder persistir a nova rota.

**As respostas ainda vão para o canal antigo.**

Verifique se o comando respondeu com uma mensagem de sucesso e confirme se o ID do par de destino corresponde ao ID usado por esse canal. O acoplamento altera apenas a rota da sessão ativa; outra sessão ainda pode rotear para outro lugar.

**Preciso voltar.**

Envie o comando correspondente ao canal original, como `/dock_telegram` ou `/dock-telegram`, a partir de um remetente vinculado.
