---
read_when:
    - Você quer executar um turno do agente a partir de scripts (opcionalmente entregar a resposta)
summary: Referência da CLI para `openclaw agent` (enviar um turno do agente pelo Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-24T05:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Execute um turno de agente pelo Gateway (use `--local` para execução incorporada).
Use `--agent <id>` para direcionar diretamente a um agente configurado.

Passe pelo menos um seletor de sessão:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Ferramenta de envio do agente: [Agent send](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem obrigatório
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-id <id>`: ID de sessão explícito
- `--agent <id>`: ID do agente; substitui os bindings de roteamento
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, além de níveis personalizados compatíveis com o provedor, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persistir o nível verboso para a sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal principal da sessão
- `--reply-to <target>`: substituição do destino de entrega
- `--reply-channel <channel>`: substituição do canal de entrega
- `--reply-account <id>`: substituição da conta de entrega
- `--local`: executa o agente incorporado diretamente (após pré-carregar o registro de Plugin)
- `--deliver`: envia a resposta de volta para o canal/destino selecionado
- `--timeout <seconds>`: substitui o tempo limite do agente (padrão 600 ou valor da configuração)
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
- `--local` ainda pré-carrega primeiro o registro de Plugin, para que provedores, ferramentas e canais fornecidos por Plugin continuem disponíveis durante execuções incorporadas.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento da sessão.
- Quando este comando aciona a regeneração de `models.json`, credenciais de provedor gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo, nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), e não como texto simples de segredos resolvidos.
- As gravações de marcadores são autoritativas da fonte: o OpenClaw persiste marcadores a partir do snapshot ativo da configuração de origem, não a partir dos valores de segredo resolvidos em tempo de execução.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runtime do agente](/pt-BR/concepts/agent)
