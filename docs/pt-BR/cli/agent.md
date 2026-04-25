---
read_when:
    - Você quer executar um turno de agente a partir de scripts (opcionalmente entregar a resposta)
summary: Referência de CLI para `openclaw agent` (envia um turno de agente via o Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-25T13:42:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Execute um turno de agente via o Gateway (use `--local` para incorporado).
Use `--agent <id>` para direcionar diretamente a um agente configurado.

Passe pelo menos um seletor de sessão:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Ferramenta Agent send: [Agent send](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem obrigatório
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-id <id>`: id de sessão explícito
- `--agent <id>`: id do agente; substitui vinculações de roteamento
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, além de níveis personalizados compatíveis com o provedor, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persiste o nível verboso para a sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal principal da sessão
- `--reply-to <target>`: substituição do destino de entrega
- `--reply-channel <channel>`: substituição do canal de entrega
- `--reply-account <id>`: substituição da conta de entrega
- `--local`: executa o agente incorporado diretamente (após o pré-carregamento do registro de plugins)
- `--deliver`: envia a resposta de volta ao canal/destino selecionado
- `--timeout <seconds>`: substitui o timeout do agente (padrão 600 ou valor da configuração)
- `--json`: gera saída em JSON

## Exemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Observações

- O modo Gateway recorre ao agente incorporado quando a solicitação ao Gateway falha. Use `--local` para forçar a execução incorporada desde o início.
- `--local` ainda pré-carrega primeiro o registro de plugins, então provedores, ferramentas e canais fornecidos por plugins continuam disponíveis durante execuções incorporadas.
- Cada invocação de `openclaw agent` é tratada como uma execução única. Servidores MCP incluídos ou configurados pelo usuário abertos para essa execução são desativados após a resposta, mesmo quando o comando usa o caminho do Gateway, para que processos filhos MCP stdio não permaneçam ativos entre invocações em scripts.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento da sessão.
- `--json` mantém stdout reservado para a resposta JSON. Diagnósticos do Gateway, de plugins e de fallback incorporado são roteados para stderr, para que scripts possam analisar stdout diretamente.
- Quando este comando aciona a regeneração de `models.json`, credenciais de provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), não como texto simples de segredos resolvidos.
- Escritas de marcadores são autoritativas da fonte: o OpenClaw persiste marcadores do snapshot de configuração da fonte ativa, não de valores secretos resolvidos em runtime.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runtime do agente](/pt-BR/concepts/agent)
