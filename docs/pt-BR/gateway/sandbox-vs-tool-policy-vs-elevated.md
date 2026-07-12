---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma ferramenta está bloqueada: ambiente de execução sandbox, política de permissão/bloqueio de ferramentas e controles de execução elevada'
title: Sandbox vs. política de ferramentas vs. privilégios elevados
x-i18n:
    generated_at: "2026-07-12T15:17:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

O OpenClaw tem três controles relacionados, porém distintos:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) determina **onde as ferramentas são executadas** (backend do sandbox ou host).
2. **Política de ferramentas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) determina **quais ferramentas estão disponíveis/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **saída de emergência exclusiva para exec** que permite executar fora do sandbox quando você está em um sandbox (`gateway` por padrão ou `node` quando o destino de execução está configurado como `node`).

## Depuração rápida

Use o inspetor para ver o que o OpenClaw está _realmente_ fazendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ele exibe:

- modo, escopo e acesso ao workspace efetivos do sandbox
- se a sessão está atualmente em um sandbox (principal ou não principal)
- permissões e bloqueios efetivos de ferramentas no sandbox (e se vieram do agente, da configuração global ou do padrão)
- condições de acesso elevado e caminhos das chaves para correção

## Sandbox: onde as ferramentas são executadas

O uso de sandbox é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo é executado no host.
- `"non-main"`: somente sessões não principais ficam em um sandbox (uma "surpresa" comum em grupos/canais).
- `"all"`: tudo fica em um sandbox.

`agents.defaults.sandbox.workspaceAccess` controla o que o sandbox pode ver: `"none"`, `"ro"` ou `"rw"`.

Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para ver a matriz completa (escopo, montagens do espaço de trabalho, imagens).

### Montagens bind (verificação rápida de segurança)

- `docker.binds` _atravessa_ o sistema de arquivos do sandbox: tudo o que você montar ficará visível dentro do contêiner com o modo definido (`:ro` ou `:rw`).
- O padrão é leitura e gravação se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora montagens bind por agente (somente as montagens bind globais são aplicadas).
- O OpenClaw valida as origens das montagens bind duas vezes: primeiro no caminho de origem normalizado e, depois, novamente após a resolução pelo ancestral existente mais profundo. Escapes por diretórios-pai que são links simbólicos não contornam as verificações de caminhos bloqueados nem de raízes permitidas.
- Caminhos-folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` for resolvido por meio de um diretório-pai que é um link simbólico para um caminho bloqueado ou para fora das raízes permitidas configuradas, a montagem bind será rejeitada.
- Vincular `/var/run/docker.sock` efetivamente concede ao sandbox o controle do host; faça isso somente de forma intencional.
- O acesso ao espaço de trabalho (`workspaceAccess`) é independente dos modos das montagens bind.

## Política de ferramentas: quais ferramentas existem/podem ser chamadas

Duas camadas são relevantes:

- **Perfil de ferramentas**: `tools.profile` e `agents.list[].tools.profile` (lista de permissões básica)
- **Perfil de ferramentas do provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política de ferramentas global/por agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramentas do provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramentas do sandbox** (aplica-se somente quando executado em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras gerais:

- `deny` sempre prevalece.
- Se `allow` não estiver vazio, todo o restante será tratado como bloqueado.
- A política de ferramentas é a restrição definitiva: `/exec` não pode substituir a negação da ferramenta `exec`.
- A política de ferramentas filtra a disponibilidade das ferramentas por nome; ela não inspeciona os efeitos colaterais dentro de `exec`. Se `exec` for permitido, negar `write`, `edit` ou `apply_patch` não torna os comandos do shell somente leitura.
- `/exec` altera apenas os padrões da sessão para remetentes autorizados; ele não concede acesso a ferramentas.
- As chaves de ferramentas do provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).
- Os logs do Gateway incluem entradas de auditoria `agents/tool-policy` quando uma etapa da política de ferramentas remove ferramentas ou quando uma política de ferramentas do sandbox bloqueia uma chamada. Use `openclaw logs` para ver o rótulo da regra, a chave de configuração e os nomes das ferramentas afetadas.

### Grupos de ferramentas (abreviações)

As políticas de ferramentas (globais, por agente e de sandbox) aceitam entradas `group:*` que se expandem para várias ferramentas:

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

| Grupo              | Ferramentas                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias de `exec`)                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                           |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                          |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                    |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                            |
| `group:ui`         | `browser`, `canvas`                                                                                                                                              |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                           |
| `group:messaging`  | `message`                                                                                                                                                        |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                              |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                         |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                             |
| `group:openclaw`   | a maioria das ferramentas integradas do OpenClaw (exclui as primitivas de sistema de arquivos e runtime `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` e Plugins de provedores) |
| `group:plugins`    | todas as ferramentas carregadas pertencentes a Plugins, incluindo servidores MCP configurados expostos por meio de `bundle-mcp`                                 |

Para agentes somente leitura, negue `group:runtime`, bem como as ferramentas que alteram o sistema de arquivos, a menos que a política do sistema de arquivos do sandbox ou um limite separado do host imponha a restrição de somente leitura.

Para servidores MCP em sandbox, a política de ferramentas do sandbox é uma segunda barreira de permissão. Se `mcp.servers` estiver configurado, mas as interações em sandbox mostrarem apenas ferramentas integradas, adicione `bundle-mcp`, `group:plugins` ou um nome/glob de ferramenta MCP prefixado pelo servidor, como `outlook__send_mail` ou `outlook__*`, a `tools.sandbox.tools.alsoAllow`; em seguida, reinicie/recarregue o Gateway e capture novamente a lista de ferramentas. Os globs de servidor usam o prefixo do servidor MCP seguro para o provedor: caracteres que não sejam `[A-Za-z0-9_-]` tornam-se `-`, nomes que não começam com uma letra recebem o prefixo `mcp-`, e prefixos longos ou duplicados podem ser truncados ou receber um sufixo.

Atualmente, `openclaw doctor` verifica esse formato para servidores gerenciados pelo OpenClaw em `mcp.servers`. Servidores MCP carregados de manifestos de Plugins integrados ou do `.mcp.json` do Claude usam a mesma barreira do sandbox, mas esse diagnóstico ainda não enumera essas fontes; use as mesmas entradas da lista de permissões se as ferramentas deles desaparecerem em interações em sandbox.

## Elevado: somente exec para "executar no host"

O modo elevado **não** concede ferramentas adicionais; ele afeta apenas `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) executará fora do sandbox (as aprovações ainda podem ser aplicáveis).
- Use `/elevated full` para ignorar as aprovações de exec durante a sessão.
- Se você já estiver executando diretamente, o modo elevado será efetivamente inócuo (ainda sujeito às barreiras).
- O modo elevado **não** tem escopo de Skills e **não** substitui permissões ou negações de ferramentas.
- O modo elevado não concede substituições arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais de destino do exec e preserva `node` somente quando o destino configurado/da sessão já é `node`.
- `/exec` é separado do modo elevado. Ele apenas ajusta os padrões de exec por sessão para remetentes autorizados.

Barreiras:

- Ativação: `tools.elevated.enabled` (e, opcionalmente, `agents.list[].tools.elevated.enabled`)
- Listas de remetentes permitidos: `tools.elevated.allowFrom.<provider>` (e, opcionalmente, `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo Elevado](/pt-BR/tools/elevated).

## Correções comuns para "prisão do sandbox"

### "Ferramenta X bloqueada pela política de ferramentas do sandbox"

Chaves de correção (escolha uma):

- Desative o sandbox: `agents.defaults.sandbox.mode=off` (ou, por agente, `agents.list[].sandbox.mode=off`)
- Permita a ferramenta dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou, por agente, `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou à lista de permissões por agente)
- Verifique a entrada `agents/tool-policy` em `openclaw logs`. Ela registra o modo do sandbox e se a regra de permissão ou negação bloqueou a ferramenta.

### "Achei que esta fosse a sessão principal; por que ela está em sandbox?"

No modo `"non-main"`, as chaves de grupo/canal _não_ são a sessão principal. Use a chave da sessão principal (mostrada por `sandbox explain`) ou altere o modo para `"off"`.

## Relacionado

- [Uso de sandbox](/pt-BR/gateway/sandboxing) -- referência completa do sandbox (modos, escopos, backends, imagens)
- [Sandbox e ferramentas para vários agentes](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente e precedência
- [Modo Elevado](/pt-BR/tools/elevated)
