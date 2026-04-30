---
read_when:
    - Instalando ou configurando a estrutura acpx para Claude Code / Codex / Gemini CLI
    - Habilitando a ponte MCP plugin-tools ou OpenClaw-tools
    - Configurando os modos de permissão do ACP
summary: 'Configurando agentes ACP: configuração do harness acpx, configuração do Plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-04-30T10:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para a visão geral, o runbook do operador e os conceitos, consulte [agentes ACP](/pt-BR/tools/acp-agents).

As seções abaixo cobrem a configuração do harness acpx, a configuração de plugins para as pontes MCP e a configuração de permissões.

Use esta página somente quando estiver configurando a rota ACP/acpx. Para configuração nativa de runtime do app-server do Codex, use [harness do Codex](/pt-BR/plugins/codex-harness). Para chaves de API da OpenAI ou configuração de provedor de modelos Codex OAuth, use [OpenAI](/pt-BR/providers/openai).

O Codex tem duas rotas do OpenClaw:

| Rota                       | Configuração/comando                                  | Página de configuração                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo do Codex | `/codex ...`, `agentRuntime.id: "codex"`               | [harness do Codex](/pt-BR/plugins/codex-harness) |
| Adaptador Codex ACP explícito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefira a rota nativa, a menos que você precise explicitamente do comportamento ACP/acpx.

## Suporte ao harness acpx (atual)

Aliases atuais de harness integrados do acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI do Cursor: `cursor-agent acp`)
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

Quando o OpenClaw usa o backend acpx, prefira esses valores para `agentId`, a menos que sua configuração do acpx defina aliases de agente personalizados.
Se sua instalação local do Cursor ainda expõe ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode apontar para adaptadores arbitrários via `--agent <command>`, mas essa saída de escape bruta é um recurso da CLI do acpx (não o caminho normal `agentId` do OpenClaw).

O controle de modelo depende da capacidade do adaptador. As refs de modelo Codex ACP são normalizadas pelo OpenClaw antes da inicialização. Outros harnesses precisam de `models` ACP mais suporte a `session/set_model`; se um harness não expõe nem essa capacidade ACP nem sua própria flag de modelo de inicialização, OpenClaw/acpx não consegue forçar uma seleção de modelo.

## Configuração obrigatória

Base principal de ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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

A configuração de vinculação de threads é específica do adaptador de canal. Exemplo para Discord:

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

Se a geração de ACP vinculada a thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vinculações da conversa atual não exigem criação de thread filha. Elas exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração de Plugin para backend acpx

Instalações novas vêm com o Plugin de runtime `acpx` incluído habilitado por padrão, então o ACP geralmente funciona sem uma etapa manual de instalação de Plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, negou-o via `plugins.allow` / `plugins.deny`, ou quer mudar para um checkout de desenvolvimento local, use o caminho explícito de Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação de workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o Plugin `acpx` incluído registra o backend ACP embutido sem gerar um agente ACP durante a inicialização do Gateway. Execute `/acp doctor` para uma sondagem ativa explícita. Defina `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` somente quando precisar que o Gateway sonde o agente configurado na inicialização.

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
- Caminhos `command` personalizados desabilitam a instalação automática local do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente via um hook postinstall. Se a instalação automática falhar, o Gateway ainda inicia normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Ponte MCP de ferramentas de plugins

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code chamem ferramentas de plugins instalados do OpenClaw, como recuperação/armazenamento de memória, habilite a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas de plugins já registradas por plugins do OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desabilitado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP obtêm acesso somente a ferramentas de plugins já ativas no Gateway.
- Trate isso como a mesma fronteira de confiança de permitir que esses plugins sejam executados no próprio OpenClaw.
- Revise os plugins instalados antes de habilitar.

`mcpServers` personalizados continuam funcionando como antes. A ponte integrada de ferramentas de plugins é uma conveniência adicional opcional, não uma substituição para a configuração genérica de servidor MCP.

### Ponte MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por meio de MCP. Habilite a ponte separada de ferramentas principais quando um agente ACP precisar de ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas principais explícita e desabilitada por padrão.

### Configuração de tempo limite de runtime

O Plugin `acpx` incluído usa por padrão um tempo limite de 120 segundos para turnos de runtime embutido. Isso dá a harnesses mais lentos, como a Gemini CLI, tempo suficiente para concluir a inicialização e a preparação do ACP. Substitua-o se o seu host precisar de um limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o Gateway depois de alterar esse valor.

### Configuração do agente de sondagem de integridade

Quando `/acp doctor` ou a sondagem de inicialização opcional verifica o backend, o Plugin `acpx` incluído sonda um agente de harness. Se `acp.allowedAgents` estiver definido, o padrão é o primeiro agente permitido; caso contrário, o padrão é `codex`. Se sua implantação precisar de um agente ACP diferente para verificações de integridade, defina explicitamente o agente de sondagem:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o Gateway depois de alterar esse valor.

## Configuração de permissões

Sessões ACP são executadas de forma não interativa: não há TTY para aprovar ou negar prompts de permissão de gravação de arquivos e execução de shell. O Plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass de fornecedores de backend CLI, como `--permission-mode bypassPermissions` da Claude CLI. ACPX `approve-all` é o interruptor de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente de harness pode executar sem prompt.

| Valor           | Comportamento                                            |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivos e comandos de shell. |
| `approve-reads` | Aprova automaticamente somente leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                      |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido, mas nenhum TTY interativo está disponível (o que é sempre o caso para sessões ACP).

| Valor  | Comportamento                                                     |
| ------ | ----------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**               |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa). |

### Configuração

Defina via configuração do Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o Gateway depois de alterar esses valores.

<Warning>
O padrão do OpenClaw é `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem graciosamente em vez de travar.
</Warning>

## Relacionado

- [agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
