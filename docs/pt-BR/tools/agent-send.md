---
read_when:
    - Você quer acionar execuções de agentes a partir de scripts ou da linha de comando
    - Você precisa enviar respostas do agente para um canal de chat programaticamente
summary: Execute turnos de agente pela CLI e, opcionalmente, envie respostas para canais
title: Envio do agente
x-i18n:
    generated_at: "2026-05-10T19:51:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` executa um único turno de agente pela linha de comando sem precisar
de uma mensagem de chat recebida. Use-o para fluxos de trabalho com scripts, testes e
entrega programática.

## Início rápido

<Steps>
  <Step title="Executar um turno de agente simples">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Isso envia a mensagem pelo Gateway e imprime a resposta.

  </Step>

  <Step title="Direcionar para um agente ou sessão específica">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Entregar a resposta a um canal">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Opções

| Opção                         | Descrição                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Mensagem a enviar (obrigatório)                             |
| `--to \<dest\>`               | Deriva a chave de sessão de um destino (telefone, id do chat) |
| `--agent \<id\>`              | Direciona para um agente configurado (usa sua sessão `main`) |
| `--session-id \<id\>`         | Reutiliza uma sessão existente pelo id                      |
| `--local`                     | Força o runtime incorporado local (ignora o Gateway)        |
| `--deliver`                   | Envia a resposta para um canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack etc.)  |
| `--reply-to \<target\>`       | Sobrescrita do destino de entrega                           |
| `--reply-channel \<name\>`    | Sobrescrita do canal de entrega                             |
| `--reply-account \<id\>`      | Sobrescrita do id da conta de entrega                       |
| `--thinking \<level\>`        | Define o nível de raciocínio para o perfil de modelo selecionado |
| `--verbose \<on\|full\|off\>` | Define o nível de verbosidade                               |
| `--timeout \<seconds\>`       | Sobrescreve o tempo limite do agente                        |
| `--json`                      | Gera JSON estruturado                                       |

## Comportamento

- Por padrão, a CLI passa **pelo Gateway**. Adicione `--local` para forçar o
  runtime incorporado na máquina atual.
- Se o Gateway estiver inacessível, a CLI **recorre** à execução incorporada local.
- Seleção de sessão: `--to` deriva a chave de sessão (destinos de grupo/canal
  preservam o isolamento; chats diretos se reduzem a `main`).
- As opções de raciocínio e verbosidade persistem no armazenamento da sessão.
- Saída: texto simples por padrão, ou `--json` para payload estruturado + metadados.
- Com `--json --deliver`, o JSON inclui o status de entrega para envios
  enviados, suprimidos, parciais e com falha. Consulte
  [status de entrega JSON](/pt-BR/cli/agent#json-delivery-status).

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
  <Card title="Referência da CLI de agente" href="/pt-BR/cli/agent" icon="terminal">
    Referência completa de opções e flags de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/pt-BR/tools/subagents" icon="users">
    Geração de subagentes em segundo plano.
  </Card>
  <Card title="Sessões" href="/pt-BR/concepts/session" icon="comments">
    Como as chaves de sessão funcionam e como `--to`, `--agent` e `--session-id` as resolvem.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro de sessões de agente.
  </Card>
</CardGroup>
