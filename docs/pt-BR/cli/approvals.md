---
read_when:
    - Você quer editar as aprovações de execução pela CLI
    - Você precisa gerenciar listas de permissões nos hosts do Gateway ou do Node
summary: Referência da CLI para `openclaw approvals` e `openclaw exec-policy`
title: Aprovações
x-i18n:
    generated_at: "2026-07-12T14:59:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gerencie as aprovações de execução para o **host local**, o **host do Gateway** ou um **host de Node**. Sem um sinalizador de destino, os comandos leem/gravam o arquivo local de aprovações no disco. Use `--gateway` para direcionar ao Gateway ou `--node <id|name|ip>` para direcionar a um Node específico.

Alias: `openclaw exec-approvals`

Relacionado: [Aprovações de execução](/pt-BR/tools/exec-approvals), [Nodes](/pt-BR/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` é o comando prático **exclusivo do ambiente local** que mantém a configuração solicitada de `tools.exec.*` e o arquivo de aprovações do host local sincronizados em uma única etapa:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

As predefinições (`yolo`, `cautious`, `deny-all`) aplicam `host`, `security`, `ask` e `askFallback` em conjunto. `set` aplica apenas os sinalizadores fornecidos; cada valor aceito é validado (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Escopo:

- Atualiza o arquivo de configuração local e o arquivo local de aprovações em conjunto; não envia a política ao Gateway nem a um host de Node.
- `--host node` é rejeitado: as aprovações de execução do Node são obtidas do Node em tempo de execução, portanto o `exec-policy` local não pode sincronizá-las. Em vez disso, use `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` marca os escopos com `host=node` como gerenciados pelo Node em tempo de execução, em vez de derivar uma política efetiva do arquivo local de aprovações.

Para aprovações de hosts remotos, use diretamente `openclaw approvals set --gateway` ou `openclaw approvals set --node <id|name|ip>`.

## Comandos comuns

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` mostra a política efetiva de execução para o destino: a política solicitada de `tools.exec`, a política do arquivo de aprovações do host e o resultado efetivo combinado. Nodes com uma política nativa do host, como o aplicativo complementar do Windows, mostram essa política diretamente, em vez de aplicar o cálculo da política do arquivo de aprovações do OpenClaw.

Para Nodes baseados em arquivo, a visualização combinada exige um snapshot de política resolvido pelo host. Nodes mais antigos mostram a política efetiva como indisponível, em vez de presumir que a política solicitada pelo Gateway também se aplica ao host.

<Note>
As substituições de `/exec` específicas da sessão não estão incluídas. Execute `/exec` na sessão relevante para inspecionar os padrões atuais.
</Note>

Precedência:

- O arquivo de aprovações do host é a fonte da verdade aplicável.
- A política solicitada de `tools.exec` pode restringir ou ampliar a intenção, mas o resultado efetivo é derivado das regras do host.
- `--node` combina o arquivo de aprovações do host de Node com a política `tools.exec` do Gateway (ambos se aplicam em tempo de execução).
- Se a configuração do Gateway estiver indisponível, a CLI recorre ao snapshot de aprovações do Node e informa que não foi possível calcular a política final de tempo de execução.

## Substituir aprovações usando um arquivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` aceita JSON5, não apenas JSON estrito. Use `--file` ou `--stdin`, mas não ambos.

Nodes Windows nativos do host usam seu próprio formato de política:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

A CLI primeiro lê o hash atual do Node e o envia com a atualização, para que edições locais simultâneas sejam rejeitadas em vez de sobrescritas. `rules` é obrigatório porque essa operação substitui a lista completa de regras do Node; `defaultAction` é opcional. Um Node que informe sua política nativa como desabilitada não pode ser configurado remotamente; primeiro habilite ou configure a política nesse host. Políticas nativas do host não são compatíveis com os auxiliares `allowlist add|remove`.

## Exemplo de "Nunca solicitar" / YOLO

Defina os padrões de aprovação do host como `full` + `off` para um host que nunca deve ser interrompido por aprovações de execução:

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

Para Nodes que expõem um arquivo de aprovações do OpenClaw, use o mesmo corpo com `openclaw approvals set --node <id|name|ip> --stdin`. Nodes nativos do host exigem o formato específico do proprietário mostrado acima.

Isso altera apenas o **arquivo de aprovações do host**. Para manter alinhada a política solicitada do OpenClaw, defina também:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` está explícito aqui porque `host=auto` ainda significa "sandbox quando disponível; caso contrário, Gateway": YOLO diz respeito às aprovações, não ao roteamento. Use `gateway` (ou `/exec host=gateway`) quando quiser executar no host mesmo com um sandbox configurado.

Quando omitido, `askFallback` usa `deny` como padrão. Defina explicitamente `askFallback: "full"` ao atualizar um host sem interface que deva manter o comportamento de nunca solicitar aprovação.

Atalho local para a mesma finalidade, somente na máquina local:

```bash
openclaw exec-policy preset yolo
```

## Auxiliares da lista de permissões

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opções comuns

`get`, `set` e `allowlist add|remove` são todos compatíveis com:

- `--node <id|name|ip>` (resolve ID, nome, IP ou prefixo do ID; usa o mesmo resolvedor que `openclaw nodes`)
- `--gateway`
- opções compartilhadas de RPC do Node: `--url`, `--token`, `--timeout`, `--json`

Sem um sinalizador de destino, é usado o arquivo local de aprovações no disco.

`allowlist add|remove` também aceita `--agent <id>` (o padrão é `"*"`, aplicando-se a todos os agentes).

## Observações

- O host de Node deve anunciar `system.execApprovals.get/set` (aplicativo do macOS, host de Node headless ou aplicativo complementar do Windows).
- Os arquivos de aprovações são armazenados por host no diretório de estado do OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou `~/.openclaw/exec-approvals.json` quando a variável não está definida.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
