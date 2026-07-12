---
read_when:
    - Você quer acionar execuções de agentes por meio de scripts ou da linha de comando
    - Você precisa entregar as respostas do agente a um canal de chat de forma programática
summary: Execute interações do agente pela CLI e, opcionalmente, envie respostas para os canais
title: Envio do agente
x-i18n:
    generated_at: "2026-07-12T00:26:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` executa um único turno do agente pela linha de comando sem uma
mensagem de chat recebida. Use-o para fluxos de trabalho com scripts, testes e
entrega programática. Referência completa de opções e comportamento:
[Referência da CLI do agente](/pt-BR/cli/agent).

## Início rápido

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Envia a mensagem pelo Gateway e exibe a resposta.

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lê um arquivo UTF-8 válido como o corpo da mensagem do agente.

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

## Opções

| Opção                       | Descrição                                                                    |
| --------------------------- | ---------------------------------------------------------------------------- |
| `--message <text>`          | Mensagem em linha a ser enviada                                               |
| `--message-file <path>`     | Lê a mensagem de um arquivo UTF-8 válido                                      |
| `--to <dest>`               | Deriva a chave de sessão de um destino (telefone, ID do chat)                 |
| `--session-key <key>`       | Usa uma chave de sessão explícita                                             |
| `--agent <id>`              | Direciona a um agente configurado (usa sua sessão `main`)                     |
| `--session-id <id>`         | Reutiliza uma sessão existente pelo ID                                        |
| `--model <id>`              | Substitui o modelo nesta execução (`provider/model` ou ID do modelo)          |
| `--local`                   | Força o ambiente de execução incorporado local (ignora o Gateway)             |
| `--deliver`                 | Envia a resposta para um canal de chat                                        |
| `--channel <name>`          | Canal de entrega; com `--agent` + `--to`, também se aplica ao escopo de MD    |
| `--reply-to <target>`       | Substitui o destino da entrega                                                |
| `--reply-channel <name>`    | Substitui o canal de entrega                                                  |
| `--reply-account <id>`      | Substitui o ID da conta de entrega                                            |
| `--thinking <level>`        | Define o nível de raciocínio do perfil de modelo selecionado                  |
| `--verbose <on\|full\|off>` | Persiste o nível de detalhamento da sessão (`full` também registra a saída das ferramentas) |
| `--timeout <seconds>`       | Substitui o tempo limite do agente (padrão: 600 ou o valor da configuração)   |
| `--json`                    | Produz JSON estruturado                                                       |

## Comportamento

- Por padrão, a CLI passa **pelo Gateway**. Adicione `--local` para forçar o
  ambiente de execução incorporado na máquina atual.
- Passe exatamente uma das opções `--message` ou `--message-file`. As mensagens
  de arquivo preservam o conteúdo multilinha após remover um BOM UTF-8 opcional.
- Se a solicitação ao Gateway falhar, a CLI **recorre** à execução incorporada
  local; um tempo limite do Gateway recorre a uma nova sessão, em vez de
  disputar com a transcrição original.
- Seleção de sessão: `--to` deriva a chave de sessão (destinos de grupo/canal
  preservam o isolamento; chats diretos são consolidados em `main`). Quando
  `--agent`, `--channel` e `--to` são usados em conjunto, o roteamento segue o
  destinatário canônico do canal e `session.dmScope`. Identidades estáveis usadas
  apenas para envio utilizam uma sessão pertencente ao provedor, isolada da
  sessão principal do agente.
- `--session-key` seleciona uma chave explícita. Chaves prefixadas por agente
  devem usar `agent:<agent-id>:<session-key>`, e `--agent` deve corresponder ao
  ID desse agente quando ambos forem fornecidos. Chaves simples que não sejam
  sentinelas são associadas ao escopo de `--agent` quando ele é fornecido; por
  exemplo, `--agent ops --session-key incident-42` direciona para
  `agent:ops:incident-42`. Sem `--agent`, chaves simples que não sejam sentinelas
  são associadas ao escopo do agente padrão configurado. Os valores literais
  `global` e `unknown` permanecem sem escopo somente quando nenhum `--agent` é
  fornecido; o caminho de contingência incorporado resolve essas sessões
  sentinelas para o agente padrão configurado.
- `--reply-channel` e `--reply-account` afetam somente a entrega.
- As opções de raciocínio e detalhamento persistem no armazenamento da sessão.
- Saída: texto simples por padrão ou `--json` para carga estruturada + metadados.
- Com `--json --deliver`, o JSON inclui o status de entrega de envios realizados,
  suprimidos, parciais e com falha. Consulte
  [Status de entrega em JSON](/pt-BR/cli/agent#json-delivery-status).

## Exemplos

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

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

## Relacionados

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/pt-BR/cli/agent" icon="terminal">
    Referência completa das opções e argumentos de `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/pt-BR/tools/subagents" icon="users">
    Inicialização de subagentes em segundo plano.
  </Card>
  <Card title="Sessions" href="/pt-BR/concepts/session" icon="comments">
    Como as chaves de sessão funcionam e como `--to`, `--agent` e `--session-id` as resolvem.
  </Card>
  <Card title="Slash commands" href="/pt-BR/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado dentro das sessões do agente.
  </Card>
</CardGroup>
