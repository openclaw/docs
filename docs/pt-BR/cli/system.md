---
read_when:
    - Você quer enfileirar um evento do sistema sem criar uma tarefa Cron
    - Você precisa habilitar ou desabilitar Heartbeats
    - Você quer inspecionar entradas de presença do sistema
summary: Referência da CLI para `openclaw system` (eventos do sistema, Heartbeat, presença)
title: System
x-i18n:
    generated_at: "2026-04-24T05:46:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Helpers de nível de sistema para o Gateway: enfileirar eventos do sistema, controlar Heartbeats
e visualizar presença.

Todos os subcomandos de `system` usam RPC do Gateway e aceitam as flags compartilhadas de cliente:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Comandos comuns

```bash
openclaw system event --text "Verifique acompanhamentos urgentes" --mode now
openclaw system event --text "Verifique acompanhamentos urgentes" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Enfileire um evento do sistema na sessão **main**. O próximo Heartbeat o injetará
como uma linha `System:` no prompt. Use `--mode now` para acionar o Heartbeat
imediatamente; `next-heartbeat` espera pelo próximo tick agendado.

Flags:

- `--text <text>`: texto obrigatório do evento do sistema.
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## `system heartbeat last|enable|disable`

Controles de Heartbeat:

- `last`: mostrar o último evento de Heartbeat.
- `enable`: reativar Heartbeats (use isso se eles tiverem sido desabilitados).
- `disable`: pausar Heartbeats.

Flags:

- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## `system presence`

Liste as entradas atuais de presença do sistema que o Gateway conhece (nodes,
instâncias e linhas de status semelhantes).

Flags:

- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## Observações

- Requer um Gateway em execução acessível pela sua configuração atual (local ou remota).
- Eventos do sistema são efêmeros e não persistem entre reinicializações.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
