---
read_when:
    - Você quer acionar execuções do agente a partir de scripts ou da linha de comando
    - Você precisa enviar respostas do agente a um canal de chat de forma programática
summary: Execute turnos do agente pela CLI e, opcionalmente, envie respostas aos canais
title: Envio do agente
x-i18n:
    generated_at: "2026-07-12T15:47:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` executa um único turno do agente pela linha de comando sem uma
mensagem de chat recebida. Use-o em fluxos de trabalho com scripts, testes e
entrega programática. Referência completa de opções e comportamento:
[Referência da CLI do agente](/pt-BR/cli/agent).

## Início rápido

<Steps>
  <Step title="Executar um turno simples do agente">
    ```bash
    openclaw agent --agent main --message "Como está o tempo hoje?"
    ```

    Envia a mensagem pelo Gateway e exibe a resposta.

  </Step>

  <Step title="Enviar um prompt multilinha de um arquivo">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lê um arquivo UTF-8 válido como o corpo da mensagem do agente.

  </Step>

  <Step title="Direcionar a um agente ou uma sessão específica">
    ```bash
    # Direcionar a um agente específico
    openclaw agent --agent ops --message "Resuma os logs"

    # Direcionar a um número de telefone (deriva a chave da sessão)
    openclaw agent --to +15555550123 --message "Atualização de status"

    # Reutilizar uma sessão existente
    openclaw agent --session-id abc123 --message "Continue a tarefa"

    # Direcionar a uma chave de sessão exata
    openclaw agent --session-key agent:ops:incident-42 --message "Resuma o status"
    ```

  </Step>

  <Step title="Entregar a resposta a um canal">
    ```bash
    # Entregar ao WhatsApp (canal padrão)
    openclaw agent --to +15555550123 --message "Relatório pronto" --deliver

    # Entregar ao Slack
    openclaw agent --agent ops --message "Gere o relatório" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Opções

| Opção                       | Descrição                                                                    |
| --------------------------- | ---------------------------------------------------------------------------- |
| `--message <text>`          | Mensagem embutida a ser enviada                                               |
| `--message-file <path>`     | Lê a mensagem de um arquivo UTF-8 válido                                      |
| `--to <dest>`               | Deriva a chave da sessão de um destino (telefone, ID do chat)                 |
| `--session-key <key>`       | Usa uma chave de sessão explícita                                             |
| `--agent <id>`              | Direciona a um agente configurado (usa sua sessão `main`)                     |
| `--session-id <id>`         | Reutiliza uma sessão existente pelo ID                                        |
| `--model <id>`              | Substituição de modelo para esta execução (`provider/model` ou ID do modelo)  |
| `--local`                   | Força o runtime incorporado local (ignora o Gateway)                          |
| `--deliver`                 | Envia a resposta a um canal de chat                                           |
| `--channel <name>`          | Canal de entrega; com `--agent` + `--to`, também aplica o escopo de DM        |
| `--reply-to <target>`       | Substituição do destino de entrega                                            |
| `--reply-channel <name>`    | Substituição do canal de entrega                                              |
| `--reply-account <id>`      | Substituição do ID da conta de entrega                                        |
| `--thinking <level>`        | Define o nível de raciocínio do perfil de modelo selecionado                  |
| `--verbose <on\|full\|off>` | Persiste o nível de detalhes da sessão (`full` também registra a saída das ferramentas) |
| `--timeout <seconds>`       | Substitui o tempo limite do agente (padrão: 600 ou o valor da configuração)   |
| `--json`                    | Gera uma saída JSON estruturada                                               |

## Comportamento

- Por padrão, a CLI opera **por meio do Gateway**. Adicione `--local` para forçar o
  runtime incorporado na máquina atual.
- Passe exatamente uma das opções `--message` ou `--message-file`. Mensagens de
  arquivo preservam o conteúdo multilinha após remover um BOM UTF-8 opcional.
- Se a solicitação ao Gateway falhar, a CLI **recorre** à execução incorporada
  local; um tempo limite do Gateway recorre a uma nova sessão, em vez de disputar
  com a transcrição original.
- Seleção da sessão: `--to` deriva a chave da sessão (destinos de grupo/canal
  preservam o isolamento; chats diretos são consolidados em `main`). Quando
  `--agent`, `--channel` e `--to` são usados em conjunto, o roteamento segue o
  destinatário canônico do canal e `session.dmScope`. Identidades estáveis
  exclusivamente de saída usam uma sessão pertencente ao provedor, isolada da
  sessão principal do agente.
- `--session-key` seleciona uma chave explícita. Chaves prefixadas por agente devem
  usar `agent:<agent-id>:<session-key>`, e `--agent` deve corresponder ao ID desse
  agente quando ambos forem fornecidos. Chaves simples que não sejam sentinelas
  recebem o escopo de `--agent` quando ele é fornecido; por exemplo,
  `--agent ops --session-key incident-42` direciona para
  `agent:ops:incident-42`. Sem `--agent`, chaves simples que não sejam sentinelas
  recebem o escopo do agente padrão configurado. Os literais `global` e `unknown`
  permanecem sem escopo somente quando `--agent` não é fornecido; o caminho de
  contingência incorporado resolve essas sessões sentinelas para o agente padrão
  configurado.
- `--reply-channel` e `--reply-account` afetam apenas a entrega.
- As opções de raciocínio e nível de detalhes persistem no armazenamento da sessão.
- Saída: texto simples por padrão ou `--json` para conteúdo estruturado + metadados.
- Com `--json --deliver`, o JSON inclui o status de entrega para envios realizados,
  suprimidos, parciais e com falha. Consulte
  [Status de entrega JSON](/pt-BR/cli/agent#json-delivery-status).

## Exemplos

```bash
# Turno simples com saída JSON
openclaw agent --to +15555550123 --message "Rastreie os logs" --verbose on --json

# Turno com substituição de modelo
openclaw agent --agent ops --model openai/gpt-5.4 --message "Resuma os logs"

# Turno com nível de raciocínio
openclaw agent --session-id 1234 --message "Resuma a caixa de entrada" --thinking medium

# Prompt multilinha de um arquivo
openclaw agent --agent ops --message-file ./task.md

# Chave de sessão exata
openclaw agent --session-key agent:ops:incident-42 --message "Resuma o status"

# Chave legada com escopo de um agente
openclaw agent --agent ops --session-key incident-42 --message "Resuma o status"

# Entregar a um canal diferente do canal da sessão
openclaw agent --agent ops --message "Alerta" --deliver --reply-channel telegram --reply-to "@admin"
```

## Relacionados

<CardGroup cols={2}>
  <Card title="Referência da CLI do agente" href="/pt-BR/cli/agent" icon="terminal">
    Referência completa das opções e sinalizadores de `openclaw agent`.
  </Card>
  <Card title="Subagentes" href="/pt-BR/tools/subagents" icon="users">
    Inicialização de subagentes em segundo plano.
  </Card>
  <Card title="Sessões" href="/pt-BR/concepts/session" icon="comments">
    Como as chaves de sessão funcionam e como `--to`, `--agent` e `--session-id` as resolvem.
  </Card>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="slash">
    Catálogo de comandos nativos usado nas sessões do agente.
  </Card>
</CardGroup>
