---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma ferramenta é bloqueada: runtime de sandbox, política de permissão/negação de ferramentas e barreiras de execução elevada'
title: Ambiente isolado vs. política de ferramentas vs. privilégios elevados
x-i18n:
    generated_at: "2026-05-06T05:56:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as ferramentas são executadas** (backend de sandbox vs host).
2. **Política de ferramentas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais ferramentas estão disponíveis/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **rota de escape exclusiva para exec** para executar fora do sandbox quando você está em sandbox (`gateway` por padrão, ou `node` quando o destino de exec está configurado como `node`).

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
- allow/deny efetivo de ferramentas do sandbox (e se veio do agente/global/padrão)
- gates de elevated e caminhos de chave de correção

## Sandbox: onde as ferramentas são executadas

O sandbox é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo é executado no host.
- `"non-main"`: apenas sessões não main ficam em sandbox (uma "surpresa" comum para grupos/canais).
- `"all"`: tudo fica em sandbox.

Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para a matriz completa (escopo, montagens de workspace, imagens).

### Montagens bind (verificação rápida de segurança)

- `docker.binds` _perfura_ o sistema de arquivos do sandbox: tudo que você monta fica visível dentro do contêiner com o modo que você definir (`:ro` ou `:rw`).
- O padrão é leitura e escrita se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora binds por agente (somente binds globais se aplicam).
- O OpenClaw valida fontes de bind duas vezes: primeiro no caminho de origem normalizado, depois novamente após resolver pelo ancestral existente mais profundo. Escapes por pai symlink não contornam verificações de caminho bloqueado ou raiz permitida.
- Caminhos de folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` for resolvido por meio de um pai symlink para um caminho bloqueado ou fora das raízes permitidas configuradas, o bind será rejeitado.
- Vincular `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso apenas intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de ferramentas: quais ferramentas existem/podem ser chamadas

Duas camadas importam:

- **Perfil de ferramentas**: `tools.profile` e `agents.list[].tools.profile` (allowlist base)
- **Perfil de ferramentas do provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política de ferramentas global/por agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramentas do provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramentas do sandbox** (aplica-se apenas quando em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras práticas:

- `deny` sempre vence.
- Se `allow` não estiver vazio, todo o resto é tratado como bloqueado.
- A política de ferramentas é a barreira final: `/exec` não pode substituir uma ferramenta `exec` negada.
- `/exec` só altera os padrões da sessão para remetentes autorizados; ele não concede acesso a ferramentas.
  Chaves de ferramentas do provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

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

## Elevated: "executar no host" exclusivo para exec

Elevated **não** concede ferramentas extras; ele afeta apenas `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) executa fora do sandbox (aprovações ainda podem se aplicar).
- Use `/elevated full` para ignorar aprovações de exec para a sessão.
- Se você já estiver executando direto, elevated é efetivamente um no-op (ainda sujeito a gate).
- Elevated **não** é escopado por Skills e **não** substitui allow/deny de ferramentas.
- Elevated não concede substituições arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais de destino de exec e só preserva `node` quando o destino configurado/da sessão já é `node`.
- `/exec` é separado de elevated. Ele só ajusta os padrões de exec por sessão para remetentes autorizados.

Gates:

- Habilitação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remetentes: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo Elevated](/pt-BR/tools/elevated).

## Correções comuns de "prisão do sandbox"

### "Ferramenta X bloqueada pela política de ferramentas do sandbox"

Chaves de correção (escolha uma):

- Desabilitar sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permitir a ferramenta dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou allow por agente)

### "Eu achei que isto era main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave de sessão main (mostrada por `sandbox explain`) ou altere o modo para `"off"`.

## Relacionado

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox e Ferramentas Multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente e precedência
- [Modo Elevated](/pt-BR/tools/elevated)
