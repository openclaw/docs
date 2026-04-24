---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma ferramenta está bloqueada: runtime de sandbox, política allow/deny de ferramentas e controles de exec elevado'
title: Sandbox vs política de ferramenta vs elevado
x-i18n:
    generated_at: "2026-04-24T05:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

O OpenClaw tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as ferramentas são executadas** (backend de sandbox vs host).
2. **Política de ferramenta** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais ferramentas estão disponíveis/permitidas**.
3. **Elevado** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **rota de escape apenas para exec** para executar fora do sandbox quando você está em sandbox (`gateway` por padrão, ou `node` quando o alvo exec está configurado como `node`).

## Depuração rápida

Use o inspetor para ver o que o OpenClaw está _realmente_ fazendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ele imprime:

- modo/escopo/acesso ao workspace efetivos do sandbox
- se a sessão está atualmente em sandbox (main vs não main)
- allow/deny efetivo de ferramentas no sandbox (e se veio de agente/global/padrão)
- controles elevados e caminhos de chave para correção

## Sandbox: onde as ferramentas são executadas

O sandbox é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo é executado no host.
- `"non-main"`: apenas sessões não main ficam em sandbox (a “surpresa” comum para grupos/canais).
- `"all"`: tudo fica em sandbox.

Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para a matriz completa (escopo, mounts de workspace, imagens).

### Bind mounts (verificação rápida de segurança)

- `docker.binds` _perfura_ o sistema de arquivos do sandbox: tudo o que você montar fica visível dentro do contêiner com o modo definido (`:ro` ou `:rw`).
- O padrão é leitura-gravação se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora binds por agente (apenas binds globais se aplicam).
- O OpenClaw valida origens de bind duas vezes: primeiro no caminho de origem normalizado, depois novamente após resolver pelo ancestral existente mais profundo. Escapes por pai em symlink não contornam verificações de caminho bloqueado ou raiz permitida.
- Caminhos folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` for resolvido por um pai com symlink para um caminho bloqueado ou fora das raízes permitidas configuradas, o bind será rejeitado.
- Fazer bind de `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso apenas intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de ferramenta: quais ferramentas existem/podem ser chamadas

Duas camadas importam:

- **Perfil de ferramenta**: `tools.profile` e `agents.list[].tools.profile` (allowlist base)
- **Perfil de ferramenta por provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de ferramenta**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramenta por provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramenta de sandbox** (aplica-se apenas quando em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras práticas:

- `deny` sempre prevalece.
- Se `allow` não estiver vazio, todo o resto será tratado como bloqueado.
- A política de ferramenta é a barreira rígida: `/exec` não pode sobrescrever uma ferramenta `exec` negada.
- `/exec` só altera padrões de sessão para remetentes autorizados; não concede acesso a ferramentas.
  Chaves de ferramenta por provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

### Grupos de ferramentas (atalhos)

Políticas de ferramenta (global, agente, sandbox) oferecem suporte a entradas `group:*` que se expandem para várias ferramentas:

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
  alias de `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: todas as ferramentas internas do OpenClaw (exclui Plugins de provedor)

## Elevado: exec-only "executar no host"

Elevado **não** concede ferramentas extras; ele afeta apenas `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) é executado fora do sandbox (aprovações ainda podem se aplicar).
- Use `/elevated full` para ignorar aprovações de exec na sessão.
- Se você já estiver executando de forma direta, o modo elevado é efetivamente um no-op (ainda controlado).
- O modo elevado **não** tem escopo de Skills e **não** sobrescreve allow/deny de ferramenta.
- O modo elevado não concede sobrescritas arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais de alvo de exec e só preserva `node` quando o alvo configurado/da sessão já é `node`.
- `/exec` é separado de elevado. Ele apenas ajusta padrões de exec por sessão para remetentes autorizados.

Controles:

- Ativação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remetente: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo elevado](/pt-BR/tools/elevated).

## Correções comuns de "prisão do sandbox"

### "Ferramenta X bloqueada pela política de ferramenta do sandbox"

Chaves de correção (escolha uma):

- Desative o sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permita a ferramenta dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou allow por agente)

### "Achei que isso era main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave da sessão main (mostrada por `sandbox explain`) ou mude o modo para `"off"`.

## Relacionado

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente e precedência
- [Modo elevado](/pt-BR/tools/elevated)
