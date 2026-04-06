---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma tool está bloqueada: runtime de sandbox, política de allow/deny de tools e gates de exec elevado'
title: Sandbox vs Política de Tools vs Elevated
x-i18n:
    generated_at: "2026-04-06T03:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331f5b2f0d5effa1320125d9f29948e16d0deaffa59eb1e4f25a63481cbe22d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Política de Tools vs Elevated

O OpenClaw tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as tools são executadas** (Docker vs host).
2. **Política de tools** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais tools estão disponíveis/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **válvula de escape somente para exec** para executar fora do sandbox quando você está em sandbox (`gateway` por padrão, ou `node` quando o alvo de exec está configurado como `node`).

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
- se a sessão está atualmente em sandbox (main vs non-main)
- allow/deny efetivo de tools no sandbox (e se veio de agent/global/default)
- gates de elevated e caminhos de chaves para correção

## Sandbox: onde as tools são executadas

O sandbox é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo é executado no host.
- `"non-main"`: somente sessões non-main ficam em sandbox (a “surpresa” comum para grupos/canais).
- `"all"`: tudo fica em sandbox.

Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para a matriz completa (escopo, mounts de workspace, imagens).

### Bind mounts (verificação rápida de segurança)

- `docker.binds` _atravessa_ o sistema de arquivos do sandbox: tudo o que você montar ficará visível dentro do contêiner com o modo definido (`:ro` ou `:rw`).
- O padrão é leitura e escrita se você omitir o modo; prefira `:ro` para código-fonte/secrets.
- `scope: "shared"` ignora binds por agente (somente binds globais se aplicam).
- O OpenClaw valida as origens de bind duas vezes: primeiro no caminho de origem normalizado e depois novamente após resolver pelo ancestral existente mais profundo. Escapes por pai symlink não contornam verificações de caminho bloqueado ou raiz permitida.
- Caminhos folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` resolver por um pai com symlink para um caminho bloqueado ou para fora das raízes permitidas configuradas, o bind será rejeitado.
- Montar `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso somente intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de tools: quais tools existem/podem ser chamadas

Duas camadas importam:

- **Perfil de tools**: `tools.profile` e `agents.list[].tools.profile` (allowlist base)
- **Perfil de tools do provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de tools**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de tools do provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de tools do sandbox** (só se aplica quando está em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras práticas:

- `deny` sempre vence.
- Se `allow` não estiver vazio, tudo o mais é tratado como bloqueado.
- A política de tools é a barreira rígida: `/exec` não pode sobrescrever uma tool `exec` negada.
- `/exec` só altera padrões de sessão para remetentes autorizados; não concede acesso a tools.
  Chaves de tools do provedor aceitam tanto `provider` (por exemplo, `google-antigravity`) quanto `provider/model` (por exemplo, `openai/gpt-5.4`).

### Grupos de tools (atalhos)

As políticas de tools (global, agent, sandbox) aceitam entradas `group:*` que se expandem em várias tools:

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
- `group:openclaw`: todas as tools integradas do OpenClaw (exclui plugins de provedor)

## Elevated: "executar no host" somente para exec

Elevated **não** concede tools extras; ele afeta somente `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) executa fora do sandbox (aprovações ainda podem se aplicar).
- Use `/elevated full` para pular aprovações de exec na sessão.
- Se você já estiver executando diretamente, elevated é efetivamente um no-op (ainda com gate).
- Elevated **não** é restrito por skill e **não** sobrescreve allow/deny de tools.
- Elevated não concede sobrescritas arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais do alvo de exec e só preserva `node` quando o alvo configurado/da sessão já é `node`.
- `/exec` é separado de elevated. Ele apenas ajusta padrões de exec por sessão para remetentes autorizados.

Gates:

- Habilitação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remetente: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Elevated Mode](/pt-BR/tools/elevated).

## Correções comuns para "prisão do sandbox"

### "Tool X blocked by sandbox tool policy"

Chaves de correção (escolha uma):

- Desative o sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permita a tool dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou ao allow por agente)

### "Eu achei que isso era main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave da sessão main (mostrada por `sandbox explain`) ou mude o modo para `"off"`.

## Veja também

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox & Tools de Multi-Agent](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente e precedência
- [Elevated Mode](/pt-BR/tools/elevated)
