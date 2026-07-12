---
read_when:
    - Você quer enfileirar um evento do sistema sem criar um trabalho cron
    - Você precisa ativar ou desativar os heartbeats
    - Você quer inspecionar as entradas de presença do sistema
summary: Referência da CLI para `openclaw system` (eventos do sistema, Heartbeat, presença)
title: Sistema
x-i18n:
    generated_at: "2026-07-12T15:03:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Auxiliares no nível do sistema para o Gateway: enfileire eventos do sistema, controle
heartbeats e visualize a presença.

Todos os subcomandos de `system` usam RPC do Gateway e aceitam as opções compartilhadas do cliente:

| Opção             | Padrão                               | Descrição                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` quando configurado | URL WebSocket do Gateway.                                                                                                                                                                              |
| `--token <token>` | nenhum                               | Token do Gateway (se necessário).                                                                                                                                                                         |
| `--timeout <ms>`  | `30000`                              | Tempo limite da RPC em milissegundos.                                                                                                                                                                     |
| `--expect-final`  | desativado                           | Aguarda a resposta final (agente).                                                                                                                                                                        |
| `--json`          | desativado                           | Gera a saída em JSON. `heartbeat last/enable/disable` e `system presence` sempre exibem o payload JSON bruto da RPC, independentemente desta opção; `system event` a usa para alternar entre JSON e uma linha simples `ok`. |

## Comandos comuns

```bash
openclaw system event --text "Verifique se há acompanhamentos urgentes" --mode now
openclaw system event --text "Verifique se há acompanhamentos urgentes" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
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
conclusão de uma tarefa assíncrona de volta ao canal que a iniciou.

<Note>
**Exceção de temporização com `--session-key`:** quando `--session-key` é fornecido,
`--mode next-heartbeat` se transforma em uma ativação direcionada imediata, em vez de
aguardar o próximo ciclo agendado. As ativações direcionadas usam a intenção de heartbeat
`immediate`, portanto ignoram a restrição de execução antes do prazo do executor, que, caso contrário,
adiaria (e efetivamente descartaria) uma ativação com intenção `event`. Se quiser a entrega
postergada, omita `--session-key` para que o evento seja enviado à sessão principal e
siga com o próximo heartbeat regular.
</Note>

Opções:

- `--text <text>`: texto obrigatório do evento do sistema.
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--session-key <sessionKey>`: opcional; direciona a uma sessão específica do agente
  em vez da sessão principal do agente. Chaves que não pertencem ao
  agente resolvido usam como alternativa a sessão principal do agente.

## `system heartbeat last|enable|disable`

- `last`: mostra o último evento de heartbeat.
- `enable`: reativa os heartbeats (use esta opção se tiverem sido desativados).
- `disable`: pausa os heartbeats.

## `system presence`

Lista as entradas atuais de presença do sistema conhecidas pelo Gateway (nodes,
instâncias e linhas de status semelhantes).

## Observações

- Requer um Gateway em execução e acessível pela configuração atual (local ou
  remota).
- Os eventos do sistema são efêmeros e não persistem após reinicializações.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
