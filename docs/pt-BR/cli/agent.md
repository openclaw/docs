---
read_when:
    - Você quer executar uma rodada do agente a partir de scripts (opcionalmente entregar a resposta)
summary: Referência da CLI para `openclaw agent` (envie um turno de agente pelo Gateway)
title: Agente
x-i18n:
    generated_at: "2026-06-27T17:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Execute uma rodada de agente via Gateway (use `--local` para incorporado).
Use `--agent <id>` para direcionar diretamente a um agente configurado.

Passe pelo menos um seletor de sessão:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Ferramenta de envio do agente: [Envio do agente](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem
- `--message-file <path>`: lê o corpo da mensagem de um arquivo UTF-8
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-key <key>`: chave de sessão explícita a ser usada para roteamento
- `--session-id <id>`: id de sessão explícito
- `--agent <id>`: id do agente; substitui as vinculações de roteamento
- `--model <id>`: substituição de modelo para esta execução (`provider/model` ou id do modelo)
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, além de níveis personalizados compatíveis com o provedor, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persiste o nível detalhado da sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal principal da sessão
- `--reply-to <target>`: substituição do destino de entrega
- `--reply-channel <channel>`: substituição do canal de entrega
- `--reply-account <id>`: substituição da conta de entrega
- `--local`: executa o agente incorporado diretamente (após o pré-carregamento do registro de plugins)
- `--deliver`: envia a resposta de volta ao canal/destino selecionado
- `--timeout <seconds>`: substitui o tempo limite do agente (padrão 600 ou valor de configuração)
- `--json`: gera JSON

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

- Passe exatamente um de `--message` ou `--message-file`. `--message-file` preserva o conteúdo multilinha do arquivo após remover um BOM UTF-8 opcional e rejeita arquivos que não sejam UTF-8 válido.
- O modo Gateway recorre ao agente incorporado quando a solicitação ao Gateway falha. Use `--local` para forçar a execução incorporada desde o início.
- `--local` ainda pré-carrega primeiro o registro de plugins, portanto provedores, ferramentas e canais fornecidos por plugins permanecem disponíveis durante execuções incorporadas.
- `--local` e execuções de fallback incorporado são tratadas como execuções avulsas. Recursos MCP loopback agrupados e sessões Claude stdio aquecidas abertas para esse processo local são encerrados após a resposta, para que invocações por script não mantenham processos filhos locais ativos.
- Execuções com suporte do Gateway deixam recursos MCP loopback pertencentes ao Gateway sob o processo Gateway em execução; clientes mais antigos ainda podem enviar a flag histórica de limpeza, mas o Gateway a aceita como uma operação sem efeito por compatibilidade.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento da sessão.
- `--session-key` seleciona uma chave de sessão explícita. Chaves com prefixo de agente devem usar `agent:<agent-id>:<session-key>`, e `--agent` deve corresponder ao id do agente da chave quando ambos forem fornecidos. Chaves nuas que não sejam sentinelas ficam no escopo de `--agent` quando fornecido, ou do agente padrão configurado caso contrário; por exemplo, `--agent ops --session-key incident-42` roteia para `agent:ops:incident-42`. Literais `global` e `unknown` permanecem sem escopo somente quando nenhum `--agent` é fornecido; nesse caso, o fallback incorporado e a propriedade do armazenamento usam o agente padrão configurado.
- `--json` mantém stdout reservado para a resposta JSON. Diagnósticos de Gateway, plugins e fallback incorporado são roteados para stderr para que scripts possam analisar stdout diretamente.
- O JSON do fallback incorporado inclui `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"` para que scripts possam distinguir execuções de fallback de execuções Gateway.
- Se o Gateway aceitar uma execução de agente, mas a CLI atingir o tempo limite aguardando a resposta final, o fallback incorporado usa um novo id explícito de sessão/execução `gateway-fallback-*` e relata `meta.fallbackReason: "gateway_timeout"` mais os campos de sessão do fallback. Isso evita disputar o bloqueio da transcrição pertencente ao Gateway ou substituir silenciosamente a sessão original da conversa roteada.
- Para execuções com suporte do Gateway, `SIGTERM` e `SIGINT` interrompem a solicitação da CLI em espera. Se o Gateway já tiver aceitado a execução, a CLI também envia `chat.abort` para esse id de execução aceito antes de sair. Execuções locais com `--local` e execuções de fallback incorporado recebem o mesmo sinal de aborto, mas não enviam `chat.abort`. Se um `--run-id` duplicado chegar ao Gateway enquanto a execução original do agente ainda estiver ativa, a resposta duplicada relata `status: "in_flight"` e a CLI não JSON imprime um diagnóstico em stderr em vez de uma resposta vazia. Para wrappers externos cron/systemd, mantenha um limite externo de encerramento forçado, como `timeout -k 60 600 openclaw agent ...`, para que o supervisor ainda possa recolher o processo se o desligamento não puder ser esvaziado.
- Quando este comando aciona a regeneração de `models.json`, credenciais de provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), não como texto simples de segredo resolvido.
- Escritas de marcadores têm a fonte como autoridade: o OpenClaw persiste marcadores do snapshot de configuração da fonte ativa, não dos valores secretos resolvidos em tempo de execução.

## Status de entrega JSON

Quando `--json --deliver` é usado, a resposta JSON da CLI pode incluir `deliveryStatus` no nível superior para que scripts possam distinguir envios entregues, suprimidos, parciais e com falha:

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

`deliveryStatus.status` é um de `sent`, `suppressed`, `partial_failed` ou `failed`. `suppressed` significa que a entrega intencionalmente não foi enviada, por exemplo, um hook de envio de mensagem a cancelou ou não havia resultado visível; ainda assim, é um resultado terminal sem nova tentativa. `partial_failed` significa que pelo menos um payload foi enviado antes que um payload posterior falhasse. `failed` significa que nenhum envio durável foi concluído ou que a pré-validação da entrega falhou.

Respostas da CLI com suporte do Gateway também preservam o formato bruto do resultado do Gateway, no qual o mesmo objeto está disponível em `result.deliveryStatus`.

Campos comuns:

- `requested`: sempre `true` quando o objeto está presente.
- `attempted`: `true` depois que o caminho de envio durável foi executado; `false` para falhas de pré-validação ou ausência de payloads visíveis.
- `succeeded`: `true`, `false` ou `"partial"`; `"partial"` acompanha `status: "partial_failed"`.
- `reason`: um motivo em snake-case minúsculo da entrega durável ou da validação de pré-execução. Motivos conhecidos incluem `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` e `no_delivery_target`; envios duráveis com falha também podem relatar a etapa que falhou. Trate valores desconhecidos como opacos porque o conjunto pode se expandir.
- `resultCount`: número de resultados de envio do canal quando disponível.
- `sentBeforeError`: `true` quando uma falha parcial enviou pelo menos um payload antes do erro.
- `error`: booleano `true` para envios com falha ou parcialmente com falha.
- `errorMessage`: incluído somente quando uma mensagem de erro de entrega subjacente é capturada. Falhas de pré-validação carregam `error` e `reason`, mas nenhum `errorMessage`.
- `payloadOutcomes`: resultados opcionais por payload com `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` ou metadados de hook quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runtime do agente](/pt-BR/concepts/agent)
