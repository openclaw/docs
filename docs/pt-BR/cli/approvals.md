---
read_when:
    - Você quer editar aprovações de execução pela CLI
    - Você precisa gerenciar allowlists em hosts do Gateway ou do Node
summary: Referência da CLI para `openclaw approvals` e `openclaw exec-policy`
title: aprovações
x-i18n:
    generated_at: "2026-04-23T14:00:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gerencie aprovações de execução para o **host local**, **host do Gateway** ou um **host Node**.
Por padrão, os comandos têm como destino o arquivo local de aprovações no disco. Use `--gateway` para direcionar ao Gateway, ou `--node` para direcionar a um Node específico.

Alias: `openclaw exec-approvals`

Relacionado:

- Aprovações de execução: [Exec approvals](/pt-BR/tools/exec-approvals)
- Nodes: [Nodes](/pt-BR/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` é o comando local de conveniência para manter a configuração solicitada
`tools.exec.*` e o arquivo local de aprovações do host alinhados em uma única etapa.

Use-o quando você quiser:

- inspecionar a política local solicitada, o arquivo de aprovações do host e a mesclagem efetiva
- aplicar um preset local como YOLO ou negar tudo
- sincronizar `tools.exec.*` local e `~/.openclaw/exec-approvals.json` local

Exemplos:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Modos de saída:

- sem `--json`: imprime a visualização em tabela legível por humanos
- com `--json`: imprime saída estruturada legível por máquina

Escopo atual:

- `exec-policy` é **somente local**
- ele atualiza juntos o arquivo de configuração local e o arquivo local de aprovações
- ele **não** envia a política para o host do Gateway nem para um host Node
- `--host node` é rejeitado neste comando porque as aprovações de execução do Node são buscadas do Node em runtime e devem ser gerenciadas por comandos de aprovações direcionados ao Node
- `openclaw exec-policy show` marca escopos `host=node` como gerenciados pelo Node em runtime em vez de derivar uma política efetiva do arquivo local de aprovações

Se você precisar editar diretamente aprovações de hosts remotos, continue usando `openclaw approvals set --gateway`
ou `openclaw approvals set --node <id|name|ip>`.

## Comandos comuns

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` agora mostra a política efetiva de execução para destinos local, Gateway e Node:

- política `tools.exec` solicitada
- política do arquivo de aprovações do host
- resultado efetivo depois que as regras de precedência são aplicadas

A precedência é intencional:

- o arquivo de aprovações do host é a fonte da verdade aplicável
- a política `tools.exec` solicitada pode restringir ou ampliar a intenção, mas o resultado efetivo ainda é derivado das regras do host
- `--node` combina o arquivo de aprovações do host Node com a política `tools.exec` do Gateway, porque ambos ainda se aplicam em runtime
- se a configuração do Gateway não estiver disponível, a CLI recorre ao snapshot de aprovações do Node e informa que a política final de runtime não pôde ser calculada

## Substituir aprovações a partir de um arquivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` aceita JSON5, não apenas JSON estrito. Use `--file` ou `--stdin`, não ambos.

## Exemplo de "nunca perguntar" / YOLO

Para um host que nunca deve parar por aprovações de execução, defina os padrões de aprovações do host como `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Variante para Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Isso altera **apenas o arquivo de aprovações do host**. Para manter a política solicitada do OpenClaw alinhada, defina também:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Por que `tools.exec.host=gateway` neste exemplo:

- `host=auto` ainda significa "sandbox quando disponível; caso contrário, Gateway".
- YOLO trata de aprovações, não de roteamento.
- Se você quiser execução no host mesmo quando uma sandbox estiver configurada, torne a escolha do host explícita com `gateway` ou `/exec host=gateway`.

Isso corresponde ao comportamento atual padrão de YOLO para host. Restrinja-o se você quiser aprovações.

Atalho local:

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza juntos a configuração local solicitada `tools.exec.*` e os
padrões locais de aprovações. Ele é equivalente em intenção à configuração manual em duas etapas
acima, mas apenas para a máquina local.

## Auxiliares de allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opções comuns

`get`, `set` e `allowlist add|remove` são todos compatíveis com:

- `--node <id|name|ip>`
- `--gateway`
- opções compartilhadas de RPC de Node: `--url`, `--token`, `--timeout`, `--json`

Observações sobre direcionamento:

- sem flags de destino significa o arquivo local de aprovações no disco
- `--gateway` direciona ao arquivo de aprovações do host do Gateway
- `--node` direciona a um host Node após resolver id, nome, IP ou prefixo de id

`allowlist add|remove` também é compatível com:

- `--agent <id>` (o padrão é `*`)

## Observações

- `--node` usa o mesmo resolvedor que `openclaw nodes` (id, nome, ip ou prefixo de id).
- `--agent` usa `"*"` por padrão, o que se aplica a todos os agentes.
- O host Node deve anunciar `system.execApprovals.get/set` (app macOS ou host Node headless).
- Arquivos de aprovações são armazenados por host em `~/.openclaw/exec-approvals.json`.
