---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma ferramenta é bloqueada: runtime de sandbox, política de permissão/negação de ferramentas e gates de execução elevada'
title: Sandbox vs política de ferramentas vs elevado
x-i18n:
    generated_at: "2026-06-27T17:33:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as ferramentas rodam** (backend de sandbox vs host).
2. **Política de ferramentas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais ferramentas estão disponíveis/permitidas**.
3. **Elevado** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **saída de emergência apenas para exec** para rodar fora da sandbox quando você está em sandbox (`gateway` por padrão, ou `node` quando o destino de exec está configurado como `node`).

## Depuração rápida

Use o inspetor para ver o que o OpenClaw está _realmente_ fazendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ele imprime:

- modo/escopo/acesso ao workspace efetivos da sandbox
- se a sessão está atualmente em sandbox (main vs não main)
- allow/deny efetivo de ferramentas da sandbox (e se veio do agente/global/padrão)
- controles elevados e caminhos de chaves de correção

## Sandbox: onde as ferramentas rodam

Sandboxing é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo roda no host.
- `"non-main"`: apenas sessões não main ficam em sandbox (uma "surpresa" comum para grupos/canais).
- `"all"`: tudo fica em sandbox.

Veja [Sandboxing](/pt-BR/gateway/sandboxing) para a matriz completa (escopo, montagens de workspace, imagens).

### Bind mounts (verificação rápida de segurança)

- `docker.binds` _perfura_ o sistema de arquivos da sandbox: tudo que você montar fica visível dentro do contêiner com o modo definido (`:ro` ou `:rw`).
- O padrão é leitura e escrita se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora binds por agente (apenas binds globais se aplicam).
- O OpenClaw valida fontes de bind duas vezes: primeiro no caminho de origem normalizado, depois novamente após resolver pelo ancestral existente mais profundo. Escapes por pais com symlink não burlam verificações de caminhos bloqueados ou raízes permitidas.
- Caminhos de folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` resolver por meio de um pai com symlink para um caminho bloqueado ou para fora das raízes permitidas configuradas, o bind será rejeitado.
- Vincular `/var/run/docker.sock` efetivamente entrega o controle do host à sandbox; faça isso apenas intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de ferramentas: quais ferramentas existem/podem ser chamadas

Duas camadas importam:

- **Perfil de ferramentas**: `tools.profile` e `agents.list[].tools.profile` (lista base de permissões)
- **Perfil de ferramentas do provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política de ferramentas global/por agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramentas do provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramentas da sandbox** (aplica-se somente quando em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras práticas:

- `deny` sempre vence.
- Se `allow` não estiver vazio, todo o resto será tratado como bloqueado.
- A política de ferramentas é a trava final: `/exec` não pode substituir uma ferramenta `exec` negada.
- A política de ferramentas filtra a disponibilidade de ferramentas por nome; ela não inspeciona efeitos colaterais dentro de `exec`. Se `exec` for permitido, negar `write`, `edit` ou `apply_patch` não torna comandos shell somente leitura.
- `/exec` só altera padrões de sessão para remetentes autorizados; ele não concede acesso a ferramentas.
  Chaves de ferramentas de provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).
- Logs do Gateway incluem entradas de auditoria `agents/tool-policy` quando uma etapa da política de ferramentas remove ferramentas ou uma política de ferramentas da sandbox bloqueia uma chamada. Use `openclaw logs` para ver o rótulo da regra, a chave de configuração e os nomes das ferramentas afetadas.

### Grupos de ferramentas (atalhos)

Políticas de ferramentas (global, agente, sandbox) aceitam entradas `group:*` que se expandem para várias ferramentas:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Grupos disponíveis:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` é aceito como
  um alias para `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Para agentes somente leitura, negue `group:runtime` assim como ferramentas de sistema de arquivos mutáveis, a menos que a política de sistema de arquivos da sandbox ou um limite de host separado aplique a restrição de somente leitura.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: todas as ferramentas integradas do OpenClaw (exclui plugins de provedor)
- `group:plugins`: todas as ferramentas carregadas pertencentes a plugins, incluindo servidores MCP configurados expostos por meio de `bundle-mcp`

Para servidores MCP em sandbox, a política de ferramentas da sandbox é uma segunda barreira de permissão. Se `mcp.servers` estiver configurado, mas turnos em sandbox mostrarem apenas ferramentas integradas, adicione `bundle-mcp`, `group:plugins` ou um nome/glob de ferramenta MCP prefixado pelo servidor, como `outlook__send_mail` ou `outlook__*`, a `tools.sandbox.tools.alsoAllow`; depois reinicie/recarregue o gateway e recapture a lista de ferramentas. Globs de servidor usam o prefixo de servidor MCP seguro para provedor: caracteres que não sejam `[A-Za-z0-9_-]` viram `-`, nomes que não começam com uma letra recebem um prefixo `mcp-`, e prefixos longos ou duplicados podem ser truncados ou receber sufixo.

`openclaw doctor` atualmente verifica esse formato para servidores gerenciados pelo OpenClaw em `mcp.servers`. Servidores MCP carregados de manifestos de plugins empacotados ou de `.mcp.json` do Claude usam a mesma barreira de sandbox, mas este diagnóstico ainda não enumera essas fontes; use as mesmas entradas de lista de permissões se as ferramentas deles desaparecerem em turnos em sandbox.

## Elevado: "rodar no host" apenas para exec

Elevado **não** concede ferramentas extras; ele afeta apenas `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) roda fora da sandbox (aprovações ainda podem se aplicar).
- Use `/elevated full` para pular aprovações de exec na sessão.
- Se você já estiver rodando direto, elevado é efetivamente um no-op (ainda controlado).
- Elevado **não** é limitado a Skills e **não** substitui allow/deny de ferramentas.
- Elevado não concede substituições arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais de destino de exec e só preserva `node` quando o destino configurado/da sessão já é `node`.
- `/exec` é separado de elevado. Ele apenas ajusta padrões de exec por sessão para remetentes autorizados.

Controles:

- Habilitação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Listas de permissões de remetentes: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Veja [Modo elevado](/pt-BR/tools/elevated).

## Correções comuns de "prisão de sandbox"

### "Ferramenta X bloqueada pela política de ferramentas da sandbox"

Chaves de correção (escolha uma):

- Desabilitar sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permitir a ferramenta dentro da sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou à permissão por agente)
- Verifique `openclaw logs` para a entrada `agents/tool-policy`. Ela registra o modo de sandbox e se a regra de allow ou deny bloqueou a ferramenta.

### "Eu achei que isso era main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave da sessão main (mostrada por `sandbox explain`) ou altere o modo para `"off"`.

## Relacionados

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições e precedência por agente
- [Modo elevado](/pt-BR/tools/elevated)
