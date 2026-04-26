---
read_when:
    - Instalando ou configurando o harness do acpx para Claude Code / Codex / Gemini CLI
    - Habilitando a ponte MCP do plugin-tools ou OpenClaw-tools
    - Configurando modos de permissão do ACP
summary: 'Configurando agentes ACP: configuração do harness do acpx, configuração do Plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-04-26T11:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Para a visão geral, o runbook do operador e os conceitos, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

As seções abaixo cobrem a configuração do harness do acpx, a configuração do Plugin para as pontes MCP e a configuração de permissões.

Use esta página apenas quando você estiver configurando a rota ACP/acpx. Para a configuração nativa de runtime do app-server do Codex, use [Harness do Codex](/pt-BR/plugins/codex-harness). Para chaves de API da OpenAI ou configuração do provedor de modelo via OAuth do Codex, use [OpenAI](/pt-BR/providers/openai).

O Codex tem duas rotas no OpenClaw:

| Rota                      | Configuração/comando                                    | Página de configuração                  |
| ------------------------- | ------------------------------------------------------- | --------------------------------------- |
| App-server nativo do Codex | `/codex ...`, `agentRuntime.id: "codex"`                | [Harness do Codex](/pt-BR/plugins/codex-harness) |
| Adaptador ACP explícito do Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                              |

Prefira a rota nativa, a menos que você precise explicitamente do comportamento ACP/acpx.

## Suporte do harness do acpx (atual)

Aliases atuais de harness integrados do acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando o OpenClaw usa o backend acpx, prefira esses valores para `agentId`, a menos que sua configuração do acpx defina aliases personalizados de agente.
Se a sua instalação local do Cursor ainda expõe ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode segmentar adaptadores arbitrários via `--agent <command>`, mas essa rota de escape bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

O controle de modelo depende dos recursos do adaptador. As referências de modelo ACP do Codex são normalizadas pelo OpenClaw antes da inicialização. Outros harnesses precisam de ACP `models` mais suporte a `session/set_model`; se um harness não expõe nem esse recurso ACP nem seu próprio sinalizador de modelo na inicialização, o OpenClaw/acpx não consegue forçar uma seleção de modelo.

## Configuração obrigatória

Base principal do ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o despacho de ACP enquanto mantém os controles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

A configuração de vínculo de thread é específica do adaptador de canal. Exemplo para o Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se a criação de ACP vinculada à thread não funcionar, primeiro verifique o sinalizador de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vínculos da conversa atual não exigem criação de thread filha. Eles exigem um contexto de conversa ativo e um adaptador de canal que exponha vínculos de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do Plugin para backend acpx

Instalações novas enviam o Plugin de runtime `acpx` incluído habilitado por padrão, então o ACP normalmente funciona sem uma etapa manual de instalação do Plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, o negou via `plugins.allow` / `plugins.deny`, ou quer alternar para um checkout local de desenvolvimento, use o caminho explícito do Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação local do workspace durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o Plugin `acpx` incluído registra o backend ACP incorporado sem iniciar um agente ACP durante a inicialização do Gateway. Execute `/acp doctor` para uma sondagem ativa explícita. Defina `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` apenas quando precisar que o Gateway teste o agente configurado na inicialização.

Substitua o comando ou a versão na configuração do Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` aceita um caminho absoluto, caminho relativo (resolvido a partir do workspace do OpenClaw) ou nome de comando.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Caminhos personalizados em `command` desabilitam a instalação automática local do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente por meio de um hook de pós-instalação. Se a instalação automática falhar, o gateway ainda será iniciado normalmente e reportará a dependência ausente por meio de `openclaw acp doctor`.

### Ponte MCP de ferramentas do Plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por Plugins do OpenClaw ao harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code possam chamar ferramentas de Plugin instaladas do OpenClaw, como recuperação/armazenamento de memória, habilite a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` na inicialização da sessão ACPX.
- Expõe ferramentas de Plugin já registradas por Plugins OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desabilitado por padrão.

Notas de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP recebem acesso apenas às ferramentas de Plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança que permitir que esses Plugins sejam executados no próprio OpenClaw.
- Revise os Plugins instalados antes de habilitar isso.

`mcpServers` personalizados continuam funcionando como antes. A ponte integrada de plugin-tools é uma conveniência adicional com ativação explícita, não uma substituição para a configuração genérica de servidor MCP.

### Ponte MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por MCP. Habilite a ponte separada de ferramentas principais quando um agente ACP precisar de ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` na inicialização da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas principais explícita e desabilitada por padrão.

### Configuração de tempo limite do runtime

O Plugin `acpx` incluído define por padrão um tempo limite de 120 segundos para turnos de runtime incorporado. Isso dá tempo suficiente para harnesses mais lentos, como Gemini CLI, concluírem a inicialização e a configuração do ACP. Substitua esse valor se o seu host precisar de um limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar esse valor.

### Configuração do agente de sondagem de integridade

Quando `/acp doctor` ou a sondagem de inicialização opcional verifica o backend, o Plugin `acpx` incluído testa um agente de harness. Se `acp.allowedAgents` estiver definido, ele usa por padrão o primeiro agente permitido; caso contrário, usa `codex` por padrão. Se sua implantação precisar de um agente ACP diferente para verificações de integridade, defina explicitamente o agente de sondagem:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

Sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivos e execução de shell. O Plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões do harness ACPX são separadas das aprovações de execução do OpenClaw e separadas dos sinalizadores de bypass do fornecedor do backend de CLI, como o Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` é o interruptor de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente do harness pode executar sem solicitar confirmação.

| Valor           | Comportamento                                             |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivos e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e execuções exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                       |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido, mas nenhum TTY interativo está disponível (o que sempre é o caso em sessões ACP).

| Valor  | Comportamento                                                        |
| ------ | -------------------------------------------------------------------- |
| `fail` | Interrompe a sessão com `AcpRuntimeError`. **(padrão)**              |
| `deny` | Nega silenciosamente a permissão e continua (degradação gradual).    |

### Configuração

Defina por meio da configuração do Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** Atualmente, o padrão do OpenClaw é `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou execução que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões tenham degradação gradual em vez de falharem.

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
