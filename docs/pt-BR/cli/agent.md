---
read_when:
    - Você quer executar um turno de agente a partir de scripts (opcionalmente entregar a resposta)
summary: Referência da CLI para `openclaw agent` (enviar um turno de agente via o Gateway)
title: agente
x-i18n:
    generated_at: "2026-04-23T14:00:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Execute um turno de agente via o Gateway (use `--local` para embutido).
Use `--agent <id>` para direcionar diretamente a um agente configurado.

Passe pelo menos um seletor de sessão:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Ferramenta de envio de agente: [Agent send](/pt-BR/tools/agent-send)

## Opções

- `-m, --message <text>`: corpo da mensagem obrigatório
- `-t, --to <dest>`: destinatário usado para derivar a chave da sessão
- `--session-id <id>`: ID de sessão explícito
- `--agent <id>`: ID do agente; sobrescreve bindings de roteamento
- `--thinking <level>`: nível de raciocínio do agente (`off`, `minimal`, `low`, `medium`, `high`, além de níveis personalizados compatíveis com o provider, como `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>`: persiste o nível verboso para a sessão
- `--channel <channel>`: canal de entrega; omita para usar o canal da sessão principal
- `--reply-to <target>`: sobrescrita do destino de entrega
- `--reply-channel <channel>`: sobrescrita do canal de entrega
- `--reply-account <id>`: sobrescrita da conta de entrega
- `--local`: executa diretamente o agente embutido (após o preload do registro de plugins)
- `--deliver`: envia a resposta de volta ao canal/destino selecionado
- `--timeout <seconds>`: sobrescreve o timeout do agente (padrão 600 ou valor da config)
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

- O modo Gateway usa fallback para o agente embutido quando a solicitação ao Gateway falha. Use `--local` para forçar a execução embutida desde o início.
- `--local` ainda faz preload do registro de plugins primeiro, então providers, ferramentas e canais fornecidos por plugins continuam disponíveis durante execuções embutidas.
- `--channel`, `--reply-channel` e `--reply-account` afetam a entrega da resposta, não o roteamento da sessão.
- Quando este comando aciona a regeneração de `models.json`, credenciais de provider gerenciadas por SecretRef são persistidas como marcadores não secretos (por exemplo nomes de variáveis de ambiente, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), não como texto simples de segredos resolvidos.
- Gravações de marcadores são autoritativas em relação à origem: o OpenClaw persiste marcadores do snapshot ativo da config de origem, não de valores de segredo resolvidos em runtime.
