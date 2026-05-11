---
read_when:
    - Você quer enfileirar um evento do sistema sem criar um trabalho Cron
    - Você precisa habilitar ou desabilitar Heartbeats
    - Você quer inspecionar entradas de presença do sistema
summary: Referência da CLI para `openclaw system` (eventos do sistema, Heartbeat, presença)
title: Sistema
x-i18n:
    generated_at: "2026-05-11T20:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Auxiliares em nível de sistema para o Gateway: enfileire eventos do sistema, controle Heartbeats
e veja a presença.

Todos os subcomandos `system` usam RPC do Gateway e aceitam as flags compartilhadas do cliente:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Comandos comuns

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Enfileira um evento do sistema na sessão **principal** por padrão. O próximo Heartbeat
o injetará como uma linha `System:` no prompt. Use `--mode now` para acionar
o Heartbeat imediatamente; `next-heartbeat` aguarda o próximo tick agendado.

Passe `--session-key` para direcionar uma sessão específica (por exemplo, para retransmitir a
conclusão de uma tarefa assíncrona de volta ao canal que a iniciou).

> **Exceção de temporização com `--session-key`:** quando `--session-key` é fornecido,
> `--mode next-heartbeat` se reduz a um despertar direcionado imediato em vez de
> aguardar o próximo tick agendado. Despertares direcionados usam a intenção de Heartbeat
> `immediate`, portanto ignoram a barreira de não vencido do executor que, de outra forma,
> adiaria (e efetivamente descartaria) um despertar com intenção `event`. Se você quiser entrega
> atrasada, omita `--session-key` para que o evento caia na sessão principal e
> acompanhe o próximo Heartbeat regular.

Flags:

- `--text <text>`: texto obrigatório do evento do sistema.
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--session-key <sessionKey>`: opcional; direciona uma sessão específica do agente
  em vez da sessão principal do agente. Chaves que não pertencem ao
  agente resolvido fazem fallback para a sessão principal do agente.
- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## `system heartbeat last|enable|disable`

Controles de Heartbeat:

- `last`: mostra o último evento de Heartbeat.
- `enable`: reativa os Heartbeats (use isto se eles tiverem sido desativados).
- `disable`: pausa os Heartbeats.

Flags:

- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## `system presence`

Lista as entradas atuais de presença do sistema que o Gateway conhece (nós,
instâncias e linhas de status semelhantes).

Flags:

- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## Observações

- Requer um Gateway em execução acessível pela sua configuração atual (local ou remota).
- Eventos do sistema são efêmeros e não são persistidos entre reinicializações.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
