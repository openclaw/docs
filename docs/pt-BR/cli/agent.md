---
read_when:
    - Você quer executar um turno do agente a partir de scripts (com entrega opcional da resposta)
summary: Referência da CLI para `openclaw agent` (envie um turno do agente pelo Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-11T23:49:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Execute um turno do agente por meio do Gateway. Se a solicitação ao Gateway falhar, recorre ao agente incorporado; passe `--local` para forçar a execução incorporada desde o início.

Passe pelo menos um seletor de sessão: `--to`, `--session-key`, `--session-id` ou `--agent`.

Relacionado: [Ferramenta de envio do agente](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem
- `--message-file <path>`: lê o corpo da mensagem de um arquivo UTF-8
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-key <key>`: chave de sessão explícita a ser usada no roteamento
- `--session-id <id>`: ID explícito da sessão
- `--agent <id>`: ID do agente; substitui as associações de roteamento
- `--model <id>`: substituição do modelo para esta execução (`provider/model` ou ID do modelo)
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, além de níveis personalizados compatíveis com o provedor, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persiste o nível de detalhamento da sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal principal da sessão
- `--reply-to <target>`: substituição do destino da entrega
- `--reply-channel <channel>`: substituição do canal de entrega
- `--reply-account <id>`: substituição da conta de entrega
- `--local`: executa o agente incorporado diretamente (após o pré-carregamento do registro de plugins)
- `--deliver`: envia a resposta de volta ao canal/destino selecionado
- `--timeout <seconds>`: substitui o tempo limite do agente (padrão: 600 ou `agents.defaults.timeoutSeconds`); `0` desativa o tempo limite
- `--json`: gera a saída em JSON

## Exemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Observações

- Passe exatamente uma das opções `--message` ou `--message-file`. `--message-file` remove um BOM UTF-8 inicial e preserva o conteúdo multilinha; arquivos que não sejam UTF-8 válidos são rejeitados.
- Comandos de barra (por exemplo, `/compact`) não podem ser executados por meio de `--message`. A CLI os rejeita e direciona você ao comando específico correspondente (`openclaw sessions compact <key>` para Compaction).
- As execuções com `--local` e por fallback incorporado são de uso único: os recursos de local loopback MCP incluídos e as sessões stdio do Claude aquecidas abertas para a execução são encerrados após a resposta, para que invocações por script não deixem processos filhos locais em execução. Em vez disso, as execuções apoiadas pelo Gateway mantêm os recursos de local loopback MCP pertencentes ao Gateway no processo do Gateway em execução.
- Com `--agent`, `--channel` e `--to` juntos, o roteamento da sessão segue o destinatário canônico do canal e `session.dmScope`. Canais com uma identidade de destinatário estável e somente de saída usam uma sessão pertencente ao provedor, isolada da sessão principal do agente. `--reply-channel` e `--reply-account` afetam apenas a entrega.
- `--session-key` seleciona uma chave de sessão explícita. Chaves prefixadas pelo agente devem usar `agent:<agent-id>:<session-key>`, e `--agent` deve corresponder ao ID do agente da chave quando ambos forem fornecidos. Chaves simples que não sejam sentinelas ficam no escopo de `--agent` quando ele é fornecido ou, caso contrário, do agente padrão configurado; por exemplo, `--agent ops --session-key incident-42` direciona para `agent:ops:incident-42`. As chaves literais `global` e `unknown` permanecem sem escopo somente quando nenhum `--agent` é fornecido.
- `--json` reserva a saída padrão para a resposta JSON; os diagnósticos do Gateway, do Plugin e do fallback incorporado são enviados à saída de erro padrão, para que scripts possam analisar diretamente a saída padrão.
- O JSON do fallback incorporado inclui `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"`, para que scripts possam detectar uma execução por fallback.
- Se o Gateway aceitar uma execução, mas a CLI atingir o tempo limite enquanto aguarda a resposta final, o fallback incorporado usará um novo ID de sessão/execução `gateway-fallback-*` e informará `meta.fallbackReason: "gateway_timeout"` junto com os campos da sessão de fallback, em vez de disputar a transcrição pertencente ao Gateway ou substituir silenciosamente a sessão original.
- `SIGTERM`/`SIGINT` interrompem uma solicitação apoiada pelo Gateway que esteja aguardando; se o Gateway já tiver aceitado a execução, a CLI também enviará `chat.abort` para o ID dessa execução antes de sair. As execuções com `--local` e por fallback incorporado recebem o mesmo sinal, mas não enviam `chat.abort`. Se a chave interna de desduplicação de execuções já tiver uma execução ativa para esta sessão, a resposta informará `status: "in_flight"` e a CLI sem JSON imprimirá um diagnóstico na saída de erro padrão, em vez de uma resposta vazia. Para wrappers externos de cron/systemd, mantenha uma salvaguarda de encerramento forçado, como `timeout -k 60 600 openclaw agent ...`, para que o supervisor possa recolher o processo caso não seja possível concluir o desligamento.
- Quando este comando aciona a regeneração de `models.json`, as credenciais do provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), nunca como texto simples do segredo resolvido. As gravações dos marcadores vêm do snapshot ativo da configuração de origem, não dos valores de segredo resolvidos em tempo de execução.

## Status de entrega do JSON

Com `--json --deliver`, a resposta JSON da CLI inclui `deliveryStatus` no nível superior, para que scripts possam distinguir envios entregues, suprimidos, parciais e malsucedidos:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

As respostas da CLI apoiadas pelo Gateway também preservam o formato bruto do resultado do Gateway em `result.deliveryStatus`.

`deliveryStatus.status` é um dos seguintes:

| Status           | Significado                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Entrega concluída.                                                                                                                                                  |
| `suppressed`     | A entrega não foi enviada intencionalmente (por exemplo, um hook de envio de mensagens a cancelou ou não houve resultado visível). Estado terminal, sem nova tentativa. |
| `partial_failed` | Pelo menos uma carga útil foi enviada antes que uma carga útil posterior falhasse.                                                                                  |
| `failed`         | Nenhum envio durável foi concluído ou a pré-verificação da entrega falhou.                                                                                          |

Campos comuns:

- `requested`: sempre `true` quando o objeto está presente.
- `attempted`: `true` depois que o caminho de envio durável foi executado; `false` para falhas de pré-verificação ou quando não há cargas úteis visíveis.
- `succeeded`: `true`, `false` ou `"partial"`; `"partial"` é usado junto com `status: "partial_failed"`.
- `reason`: motivo em snake case com letras minúsculas, proveniente da entrega durável ou da validação de pré-verificação. Os valores conhecidos incluem `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` e `no_delivery_target`; envios duráveis malsucedidos também podem informar a etapa que falhou. Trate valores desconhecidos como opacos, pois o conjunto pode ser ampliado.
- `resultCount`: número de resultados de envio do canal, quando disponível.
- `sentBeforeError`: `true` quando uma falha parcial enviou pelo menos uma carga útil antes de ocorrer o erro.
- `error`: `true` para envios malsucedidos ou parcialmente malsucedidos.
- `errorMessage`: presente somente quando uma mensagem de erro subjacente da entrega foi capturada. Falhas de pré-verificação incluem `error`/`reason`, mas não `errorMessage`.
- `payloadOutcomes`: resultados opcionais por carga útil, com `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` ou metadados do hook, quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Ambiente de execução do agente](/pt-BR/concepts/agent)
