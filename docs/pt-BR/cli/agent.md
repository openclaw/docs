---
read_when:
    - Você quer executar um turno do agente por meio de scripts (e, opcionalmente, entregar a resposta)
summary: Referência da CLI para `openclaw agent` (envie um turno do agente pelo Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-12T14:58:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Execute um turno do agente por meio do Gateway. Se a solicitação ao Gateway falhar, recorre ao agente integrado; passe `--local` para forçar a execução integrada desde o início.

Passe pelo menos um seletor de sessão: `--to`, `--session-key`, `--session-id` ou `--agent`.

Relacionado: [Ferramenta de envio do agente](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem
- `--message-file <path>`: lê o corpo da mensagem de um arquivo UTF-8
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-key <key>`: chave de sessão explícita a ser usada para roteamento
- `--session-id <id>`: id de sessão explícito
- `--agent <id>`: id do agente; substitui as associações de roteamento
- `--model <id>`: substituição do modelo para esta execução (`provider/model` ou id do modelo)
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, além de níveis personalizados aceitos pelo provedor, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persiste o nível de detalhamento para a sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal principal da sessão
- `--reply-to <target>`: substituição do destino de entrega
- `--reply-channel <channel>`: substituição do canal de entrega
- `--reply-account <id>`: substituição da conta de entrega
- `--local`: executa o agente integrado diretamente (após o pré-carregamento do registro de plugins)
- `--deliver`: envia a resposta de volta ao canal/destino selecionado
- `--timeout <seconds>`: substitui o tempo limite do agente (padrão: 600 ou `agents.defaults.timeoutSeconds`); `0` desativa o tempo limite
- `--json`: gera a saída em JSON

## Exemplos

```bash
openclaw agent --to +15555550123 --message "atualização de status" --deliver
openclaw agent --agent ops --message "Resuma os logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Resuma os logs"
openclaw agent --session-key agent:ops:incident-42 --message "Resuma o status"
openclaw agent --agent ops --session-key incident-42 --message "Resuma o status"
openclaw agent --session-id 1234 --message "Resuma a caixa de entrada" --thinking medium
openclaw agent --to +15555550123 --message "Rastreie os logs" --verbose on --json
openclaw agent --agent ops --message "Gere o relatório" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Execute localmente" --local
```

## Observações

- Passe exatamente uma das opções `--message` ou `--message-file`. `--message-file` remove um BOM UTF-8 inicial e preserva conteúdo multilinha; arquivos que não sejam UTF-8 válido são rejeitados.
- Comandos de barra (por exemplo, `/compact`) não podem ser executados por meio de `--message`. A CLI os rejeita e direciona você ao comando de primeira classe correspondente (`openclaw sessions compact <key>` para Compaction).
- As execuções com `--local` e com fallback integrado são de uso único: os recursos de loopback MCP incluídos e as sessões stdio aquecidas do Claude abertas para a execução são encerrados após a resposta, portanto as invocações por script não deixam processos filhos locais em execução. As execuções apoiadas pelo Gateway mantêm os recursos de loopback MCP pertencentes ao Gateway no processo do Gateway em execução.
- Ao usar `--agent`, `--channel` e `--to` juntos, o roteamento da sessão segue o destinatário canônico do canal e `session.dmScope`. Canais com uma identidade de destinatário estável e somente de saída usam uma sessão pertencente ao provedor, isolada da sessão principal do agente. `--reply-channel` e `--reply-account` afetam somente a entrega.
- `--session-key` seleciona uma chave de sessão explícita. Chaves prefixadas pelo agente devem usar `agent:<agent-id>:<session-key>`, e `--agent` deve corresponder ao id do agente da chave quando ambos forem fornecidos. Chaves simples que não sejam sentinelas ficam no escopo de `--agent` quando ele é fornecido ou, caso contrário, no escopo do agente padrão configurado; por exemplo, `--agent ops --session-key incident-42` roteia para `agent:ops:incident-42`. As chaves literais `global` e `unknown` permanecem sem escopo somente quando `--agent` não é fornecido.
- `--json` reserva a saída padrão para a resposta JSON; os diagnósticos do Gateway, do plugin e do fallback integrado são enviados para a saída de erro padrão, permitindo que scripts analisem diretamente a saída padrão.
- O JSON do fallback integrado inclui `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"` para que scripts possam detectar uma execução de fallback.
- Se o Gateway aceitar uma execução, mas a CLI atingir o tempo limite enquanto aguarda a resposta final, o fallback integrado usará um novo id de sessão/execução `gateway-fallback-*` e informará `meta.fallbackReason: "gateway_timeout"`, além dos campos da sessão de fallback, em vez de disputar a transcrição pertencente ao Gateway ou substituir silenciosamente a sessão original.
- `SIGTERM`/`SIGINT` interrompem uma solicitação apoiada pelo Gateway que esteja aguardando; se o Gateway já tiver aceitado a execução, a CLI também enviará `chat.abort` para o id dessa execução antes de sair. As execuções com `--local` e fallback integrado recebem o mesmo sinal, mas não enviam `chat.abort`. Se a chave interna de desduplicação de execução já tiver uma execução ativa para esta sessão, a resposta informará `status: "in_flight"` e a CLI sem JSON imprimirá um diagnóstico na saída de erro padrão em vez de uma resposta vazia. Para wrappers externos de cron/systemd, mantenha um mecanismo de encerramento forçado como `timeout -k 60 600 openclaw agent ...` para que o supervisor possa finalizar o processo caso o desligamento não consiga concluir as operações pendentes.
- Quando este comando aciona a regeneração de `models.json`, as credenciais do provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), nunca como texto simples do segredo resolvido. As gravações de marcadores vêm do instantâneo ativo da configuração de origem, não dos valores secretos resolvidos em tempo de execução.

## Status de entrega do JSON

Com `--json --deliver`, a resposta JSON da CLI inclui `deliveryStatus` no nível superior para que scripts possam distinguir envios entregues, suprimidos, parciais e com falha:

```json
{
  "payloads": [{ "text": "Relatório pronto", "mediaUrl": null }],
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

| Status           | Significado                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Entrega concluída.                                                                                                                                                               |
| `suppressed`     | A entrega não foi enviada intencionalmente (por exemplo, um hook de envio de mensagens a cancelou ou não havia resultado visível). Estado terminal, sem nova tentativa.          |
| `partial_failed` | Pelo menos um payload foi enviado antes de ocorrer uma falha em um payload posterior.                                                                                            |
| `failed`         | Nenhum envio durável foi concluído ou a verificação prévia da entrega falhou.                                                                                                    |

Campos comuns:

- `requested`: sempre `true` quando o objeto está presente.
- `attempted`: `true` depois que o caminho de envio durável é executado; `false` para falhas de verificação prévia ou quando não há payloads visíveis.
- `succeeded`: `true`, `false` ou `"partial"`; `"partial"` corresponde a `status: "partial_failed"`.
- `reason`: motivo em letras minúsculas no formato snake case, proveniente da entrega durável ou da validação prévia. Os valores conhecidos incluem `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` e `no_delivery_target`; envios duráveis com falha também podem informar a etapa que falhou. Trate valores desconhecidos como opacos, pois o conjunto pode ser ampliado.
- `resultCount`: número de resultados de envio do canal, quando disponível.
- `sentBeforeError`: `true` quando uma falha parcial enviou pelo menos um payload antes do erro.
- `error`: `true` para envios com falha ou falha parcial.
- `errorMessage`: presente somente quando uma mensagem de erro de entrega subjacente foi capturada. Falhas de verificação prévia contêm `error`/`reason`, mas não `errorMessage`.
- `payloadOutcomes`: resultados opcionais por payload com `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` ou metadados do hook, quando disponíveis.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runtime do agente](/pt-BR/concepts/agent)
