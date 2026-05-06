---
read_when:
    - Você quer acionar execuções de agentes a partir de scripts ou da linha de comando
    - Você precisa enviar respostas do agente para um canal de chat de forma programática
summary: Execute turnos de agente pela CLI e, opcionalmente, entregue respostas aos canais
title: Envio do agente
x-i18n:
    generated_at: "2026-05-06T09:14:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` executa um único turno de agente pela linha de comando sem precisar de uma mensagem de chat de entrada. Use-o para workflows com scripts, testes e entrega programática.

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
| `--to \<dest\>`               | Deriva a chave de sessão de um destino (telefone, id do chat) |
| `--agent \<id\>`              | Direciona para um agente configurado (usa a sessão `main` dele) |
| `--session-id \<id\>`         | Reutiliza uma sessão existente por id                       |
| `--local`                     | Força o runtime incorporado local (ignora o Gateway)        |
| `--deliver`                   | Envia a resposta para um canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack etc.)  |
| `--reply-to \<target\>`       | Substituição do destino de entrega                          |
| `--reply-channel \<name\>`    | Substituição do canal de entrega                            |
| `--reply-account \<id\>`      | Substituição do id da conta de entrega                      |
| `--thinking \<level\>`        | Define o nível de raciocínio para o perfil de modelo selecionado |
| `--verbose \<on\|full\|off\>` | Define o nível de detalhamento                              |
| `--timeout \<seconds\>`       | Substitui o timeout do agente                               |
| `--json`                      | Gera JSON estruturado                                       |

## Comportamento

- Por padrão, a CLI passa **pelo Gateway**. Adicione `--local` para forçar o runtime incorporado na máquina atual.
- Se o Gateway estiver inacessível, a CLI **recorre** à execução incorporada local.
- Seleção de sessão: `--to` deriva a chave de sessão (destinos de grupo/canal preservam o isolamento; chats diretos convergem para `main`).
- As flags de raciocínio e detalhamento persistem no armazenamento da sessão.
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

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/pt-BR/cli/agent" icon="terminal">
    Referência completa de flags e opções de `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/pt-BR/tools/subagents" icon="users">
    Geração de subagentes em segundo plano.
  </Card>
  <Card title="Sessions" href="/pt-BR/concepts/session" icon="comments">
    Como as chaves de sessão funcionam e como `--to`, `--agent` e `--session-id` as resolvem.
  </Card>
  <Card title="Slash commands" href="/pt-BR/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro das sessões de agente.
  </Card>
</CardGroup>
