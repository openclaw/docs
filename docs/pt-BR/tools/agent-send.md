---
read_when:
    - Você quer acionar execuções de agente a partir de scripts ou da linha de comando
    - Você precisa entregar respostas do agente a um canal de chat programaticamente
summary: Executar turnos de agente pela CLI e opcionalmente entregar respostas a canais
title: Envio de agente
x-i18n:
    generated_at: "2026-04-24T06:14:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` executa um único turno de agente pela linha de comando sem precisar
de uma mensagem de chat de entrada. Use-o para fluxos com script, testes e
entrega programática.

## Início rápido

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Isso envia a mensagem pelo Gateway e imprime a resposta.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Descrição                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensagem a enviar (obrigatório)                             |
| `--to \<dest\>`               | Deriva a chave de sessão a partir de um destino (telefone, ID de chat) |
| `--agent \<id\>`              | Direciona para um agente configurado (usa sua sessão `main`) |
| `--session-id \<id\>`         | Reutiliza uma sessão existente por ID                       |
| `--local`                     | Força o runtime embutido local (ignora o Gateway)           |
| `--deliver`                   | Envia a resposta para um canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack etc.)  |
| `--reply-to \<target\>`       | Substituição do destino de entrega                          |
| `--reply-channel \<name\>`    | Substituição do canal de entrega                            |
| `--reply-account \<id\>`      | Substituição do ID da conta de entrega                      |
| `--thinking \<level\>`        | Define o nível de thinking para o perfil de modelo selecionado |
| `--verbose \<on\|full\|off\>` | Define o nível detalhado                                    |
| `--timeout \<seconds\>`       | Substitui o timeout do agente                               |
| `--json`                      | Gera saída JSON estruturada                                 |

## Comportamento

- Por padrão, a CLI passa **pelo Gateway**. Adicione `--local` para forçar o
  runtime embutido na máquina atual.
- Se o Gateway estiver inacessível, a CLI usa **fallback** para a execução embutida local.
- Seleção de sessão: `--to` deriva a chave de sessão (destinos de grupo/canal
  preservam isolamento; chats diretos colapsam para `main`).
- Flags de thinking e verbose persistem no armazenamento da sessão.
- Saída: texto simples por padrão, ou `--json` para payload estruturado + metadados.

## Exemplos

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionado

- [Referência da CLI do agente](/pt-BR/cli/agent)
- [Subagentes](/pt-BR/tools/subagents) — inicialização de subagente em segundo plano
- [Sessões](/pt-BR/concepts/session) — como funcionam as chaves de sessão
