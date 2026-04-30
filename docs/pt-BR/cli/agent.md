---
read_when:
    - Você quer executar uma rodada de agente a partir de scripts (opcionalmente enviar a resposta)
summary: Referência da CLI para `openclaw agent` (envia um turno de agente via Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-30T09:39:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Execute um turno de agente via Gateway (use `--local` para incorporado).
Use `--agent <id>` para direcionar diretamente a um agente configurado.

Passe pelo menos um seletor de sessão:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Ferramenta de envio de agente: [Envio de agente](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem obrigatório
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-id <id>`: id de sessão explícito
- `--agent <id>`: id do agente; substitui os vínculos de roteamento
- `--model <id>`: substituição de modelo para esta execução (`provider/model` ou id do modelo)
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, mais níveis personalizados compatíveis com o provedor, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persiste o nível detalhado para a sessão
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
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Observações

- O modo Gateway recorre ao agente incorporado quando a solicitação do Gateway falha. Use `--local` para forçar a execução incorporada desde o início.
- `--local` ainda pré-carrega primeiro o registro de plugins, portanto provedores, ferramentas e canais fornecidos por plugins permanecem disponíveis durante execuções incorporadas.
- `--local` e execuções de fallback incorporado são tratadas como execuções únicas. Recursos de loopback MCP empacotados e sessões Claude stdio aquecidas abertas para esse processo local são encerrados após a resposta, para que invocações por script não mantenham processos filhos locais ativos.
- Execuções com suporte do Gateway deixam recursos de loopback MCP pertencentes ao Gateway sob o processo Gateway em execução; clientes mais antigos ainda podem enviar a flag histórica de limpeza, mas o Gateway a aceita como uma operação sem efeito por compatibilidade.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento da sessão.
- `--json` mantém stdout reservado para a resposta JSON. Diagnósticos do Gateway, de plugins e de fallback incorporado são roteados para stderr para que scripts possam analisar stdout diretamente.
- O JSON de fallback incorporado inclui `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"` para que scripts possam distinguir execuções de fallback de execuções do Gateway.
- Se o Gateway aceitar uma execução de agente, mas a CLI atingir o tempo limite aguardando a resposta final, o fallback incorporado usa um novo id explícito de sessão/execução `gateway-fallback-*` e relata `meta.fallbackReason: "gateway_timeout"` mais os campos de sessão de fallback. Isso evita disputar o bloqueio de transcrição pertencente ao Gateway ou substituir silenciosamente a sessão de conversa roteada original.
- Quando este comando aciona a regeneração de `models.json`, credenciais de provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), não como texto simples de segredo resolvido.
- Gravações de marcadores são autoritativas da origem: o OpenClaw persiste marcadores do snapshot de configuração de origem ativo, não de valores secretos resolvidos em tempo de execução.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runtime do agente](/pt-BR/concepts/agent)
