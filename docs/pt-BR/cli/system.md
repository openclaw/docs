---
read_when:
    - Você quer enfileirar um evento do sistema sem criar um trabalho Cron
    - Você precisa ativar ou desativar os heartbeats
    - Você quer inspecionar as entradas de presença do sistema
summary: Referência da CLI para `openclaw system` (eventos do sistema, Heartbeat, presença)
title: Sistema
x-i18n:
    generated_at: "2026-07-11T23:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Auxiliares no nível do sistema para o Gateway: enfileirar eventos do sistema, controlar
heartbeats e visualizar a presença.

Todos os subcomandos de `system` usam RPC do Gateway e aceitam as opções compartilhadas do cliente:

| Opção             | Padrão                               | Descrição                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` quando configurado | URL WebSocket do Gateway.                                                                                                                                                                              |
| `--token <token>` | nenhum                               | Token do Gateway (se necessário).                                                                                                                                                                         |
| `--timeout <ms>`  | `30000`                              | Tempo limite da RPC em milissegundos.                                                                                                                                                                     |
| `--expect-final`  | desativado                           | Aguarda a resposta final (agente).                                                                                                                                                                        |
| `--json`          | desativado                           | Gera a saída em JSON. `heartbeat last/enable/disable` e `system presence` sempre imprimem a carga JSON bruta da RPC, independentemente desta opção; `system event` a usa para alternar entre JSON e uma linha simples `ok`. |

## Comandos comuns

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Por padrão, enfileira um evento do sistema na sessão **principal**. O próximo
heartbeat o injeta como uma linha `System:` no prompt. Use `--mode now` para
acionar o heartbeat imediatamente; `next-heartbeat` (padrão) aguarda o
próximo ciclo agendado.

Passe `--session-key` para direcionar a uma sessão específica, por exemplo, para retransmitir a
conclusão de uma tarefa assíncrona ao canal que a iniciou.

<Note>
**Exceção de temporização com `--session-key`:** quando `--session-key` é fornecido,
`--mode next-heartbeat` passa a realizar uma ativação direcionada imediata em vez de
aguardar o próximo ciclo agendado. Ativações direcionadas usam a intenção de heartbeat
`immediate`, portanto ignoram o bloqueio de execução antes do prazo, que, de outra forma,
adiaria (e efetivamente descartaria) uma ativação com intenção `event`. Se quiser uma
entrega posterior, omita `--session-key` para que o evento seja destinado à sessão principal e
seja transportado pelo próximo heartbeat regular.
</Note>

Opções:

- `--text <text>`: texto obrigatório do evento do sistema.
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--session-key <sessionKey>`: opcional; direciona a uma sessão específica do agente
  em vez da sessão principal do agente. Chaves que não pertencem ao
  agente resolvido usam como alternativa a sessão principal do agente.

## `system heartbeat last|enable|disable`

- `last`: mostra o último evento de heartbeat.
- `enable`: reativa os heartbeats (use se eles tiverem sido desativados).
- `disable`: pausa os heartbeats.

## `system presence`

Lista as entradas atuais de presença do sistema conhecidas pelo Gateway (nodes,
instâncias e linhas de status semelhantes).

## Observações

- Requer um Gateway em execução que possa ser acessado pela configuração atual (local ou
  remota).
- Os eventos do sistema são efêmeros e não persistem entre reinicializações.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
