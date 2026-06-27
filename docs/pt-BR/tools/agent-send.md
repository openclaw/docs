---
read_when:
    - Você quer acionar execuções de agente a partir de scripts ou da linha de comando
    - Você precisa entregar respostas do agente a um canal de chat de forma programática
summary: Execute turnos de agente pela CLI e, opcionalmente, envie respostas para canais
title: Envio do agente
x-i18n:
    generated_at: "2026-06-27T18:13:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` executa um único turno de agente pela linha de comando sem precisar
de uma mensagem de chat de entrada. Use-o para fluxos de trabalho com scripts, testes e
entrega programática.

## Início rápido

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Isso envia a mensagem pelo Gateway e imprime a resposta.

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Isso lê um arquivo UTF-8 válido como o corpo da mensagem do agente.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
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
| `--message \<text\>`          | Mensagem inline a enviar                                    |
| `--message-file \<path\>`     | Lê a mensagem de um arquivo UTF-8 válido                    |
| `--to \<dest\>`               | Deriva a chave de sessão de um destino (telefone, id de chat) |
| `--session-key \<key\>`       | Usa uma chave de sessão explícita                           |
| `--agent \<id\>`              | Direciona para um agente configurado (usa sua sessão `main`) |
| `--session-id \<id\>`         | Reutiliza uma sessão existente por id                       |
| `--local`                     | Força o runtime local embutido (ignora o Gateway)           |
| `--deliver`                   | Envia a resposta para um canal de chat                      |
| `--channel \<name\>`          | Canal de entrega (whatsapp, telegram, discord, slack etc.)  |
| `--reply-to \<target\>`       | Substituição do destino de entrega                          |
| `--reply-channel \<name\>`    | Substituição do canal de entrega                            |
| `--reply-account \<id\>`      | Substituição do id da conta de entrega                      |
| `--thinking \<level\>`        | Define o nível de raciocínio para o perfil de modelo selecionado |
| `--verbose \<on\|full\|off\>` | Define o nível verboso                                      |
| `--timeout \<seconds\>`       | Substitui o timeout do agente                               |
| `--json`                      | Gera JSON estruturado                                       |

## Comportamento

- Por padrão, a CLI passa **pelo Gateway**. Adicione `--local` para forçar o
  runtime embutido na máquina atual.
- Passe exatamente um de `--message` ou `--message-file`. Mensagens de arquivo preservam
  conteúdo de várias linhas após remover um BOM UTF-8 opcional.
- Se o Gateway estiver inacessível, a CLI **recorre** à execução local embutida.
- Seleção de sessão: `--to` deriva a chave de sessão (destinos de grupo/canal
  preservam o isolamento; chats diretos convergem para `main`).
- `--session-key` seleciona uma chave explícita. Chaves com prefixo de agente devem usar
  `agent:<agent-id>:<session-key>`, e `--agent` deve corresponder a esse id de agente quando
  ambos forem fornecidos. Chaves sem sentinela explícita recebem escopo de `--agent` quando
  fornecido; por exemplo, `--agent ops --session-key incident-42` roteia para
  `agent:ops:incident-42`. Sem `--agent`, chaves sem sentinela explícita recebem escopo
  do agente padrão configurado. Literais `global` e `unknown` permanecem
  sem escopo apenas quando nenhum `--agent` é fornecido; nesse caso, o fallback embutido
  e a propriedade do armazenamento usam o agente padrão configurado.
- Flags de raciocínio e verbosidade persistem no armazenamento da sessão.
- Saída: texto simples por padrão, ou `--json` para payload estruturado + metadados.
- Com `--json --deliver`, o JSON inclui o status de entrega para envios
  enviados, suprimidos, parciais e com falha. Veja
  [status de entrega JSON](/pt-BR/cli/agent#json-delivery-status).

## Exemplos

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

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
    Catálogo de comandos nativos usado dentro de sessões de agente.
  </Card>
</CardGroup>
