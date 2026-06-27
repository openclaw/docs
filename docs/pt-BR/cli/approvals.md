---
read_when:
    - Você quer editar aprovações de exec pela CLI
    - Você precisa gerenciar allowlists em hosts de gateway ou node
summary: Referência da CLI para `openclaw approvals` e `openclaw exec-policy`
title: Aprovações
x-i18n:
    generated_at: "2026-06-27T17:17:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gerencie aprovações de exec para o **host local**, **host do Gateway** ou um **host de nó**.
Por padrão, os comandos têm como destino o arquivo local de aprovações em disco. Use `--gateway` para ter como destino o Gateway, ou `--node` para ter como destino um nó específico.

Alias: `openclaw exec-approvals`

Relacionado:

- Aprovações de exec: [Aprovações de exec](/pt-BR/tools/exec-approvals)
- Nós: [Nós](/pt-BR/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` é o comando local de conveniência para manter a configuração
`tools.exec.*` solicitada e o arquivo de aprovações do host local alinhados em uma única etapa.

Use-o quando quiser:

- inspecionar a política local solicitada, o arquivo de aprovações do host e a mesclagem efetiva
- aplicar uma predefinição local como YOLO ou negar tudo
- sincronizar `tools.exec.*` local e o arquivo de aprovações do host local

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
- `--json`: imprime saída estruturada legível por máquina

Escopo atual:

- `exec-policy` é **somente local**
- ele atualiza o arquivo de configuração local e o arquivo de aprovações local juntos
- ele **não** envia a política para o host do Gateway ou um host de nó
- `--host node` é rejeitado neste comando porque as aprovações de exec de nós são buscadas do nó em tempo de execução e devem ser gerenciadas por comandos de aprovações direcionados a nós
- `openclaw exec-policy show` marca escopos `host=node` como gerenciados pelo nó em tempo de execução, em vez de derivar uma política efetiva do arquivo local de aprovações

Se você precisar editar diretamente aprovações de hosts remotos, continue usando `openclaw approvals set --gateway`
ou `openclaw approvals set --node <id|name|ip>`.

## Comandos comuns

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` agora mostra a política de exec efetiva para destinos locais, de Gateway e de nó:

- política `tools.exec` solicitada
- política do arquivo de aprovações do host
- resultado efetivo depois que as regras de precedência são aplicadas

A precedência é intencional:

- o arquivo de aprovações do host é a fonte da verdade aplicável
- a política `tools.exec` solicitada pode restringir ou ampliar a intenção, mas o resultado efetivo ainda é derivado das regras do host
- `--node` combina o arquivo de aprovações do host de nó com a política `tools.exec` do Gateway, porque ambos ainda se aplicam em tempo de execução
- se a configuração do Gateway estiver indisponível, a CLI recorre ao snapshot de aprovações do nó e observa que a política final de tempo de execução não pôde ser computada

## Substituir aprovações de um arquivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` aceita JSON5, não apenas JSON estrito. Use `--file` ou `--stdin`, não ambos.

## Exemplo de "nunca perguntar" / YOLO

Para um host que nunca deve parar em aprovações de exec, defina os padrões de aprovações do host como `full` + `off`:

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

Variante de nó:

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

Isso altera apenas o **arquivo de aprovações do host**. Para manter a política solicitada do OpenClaw alinhada, defina também:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Por que `tools.exec.host=gateway` neste exemplo:

- `host=auto` ainda significa "sandbox quando disponível, caso contrário Gateway".
- YOLO diz respeito a aprovações, não a roteamento.
- Se você quiser exec no host mesmo quando um sandbox estiver configurado, torne a escolha do host explícita com `gateway` ou `/exec host=gateway`.

`askFallback` omitido tem `deny` como padrão. Defina `askFallback: "full"`
explicitamente ao atualizar um host sem UI que deve manter o comportamento de nunca perguntar.

Atalho local:

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza tanto a configuração local `tools.exec.*` solicitada quanto os
padrões locais de aprovações juntos. Ele é equivalente em intenção à configuração manual em duas etapas
acima, mas apenas para a máquina local.

## Auxiliares de lista de permissões

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opções comuns

`get`, `set` e `allowlist add|remove` todos oferecem suporte a:

- `--node <id|name|ip>`
- `--gateway`
- opções RPC de nó compartilhadas: `--url`, `--token`, `--timeout`, `--json`

Notas de direcionamento:

- nenhuma flag de destino significa o arquivo local de aprovações em disco
- `--gateway` tem como destino o arquivo de aprovações do host do Gateway
- `--node` tem como destino um host de nó depois de resolver id, nome, IP ou prefixo de id

`allowlist add|remove` também oferece suporte a:

- `--agent <id>` (usa `*` como padrão)

## Observações

- `--node` usa o mesmo resolvedor de `openclaw nodes` (id, nome, ip ou prefixo de id).
- `--agent` usa `"*"` como padrão, o que se aplica a todos os agentes.
- O host de nó deve anunciar `system.execApprovals.get/set` (app macOS ou host de nó headless).
- Arquivos de aprovações são armazenados por host no diretório de estado do OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` quando a variável não está definida).

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
