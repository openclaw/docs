---
read_when:
    - Instalando ou configurando o harness acpx para Claude Code / Codex / Gemini CLI
    - Habilitando a bridge MCP plugin-tools ou OpenClaw-tools
    - Configurando modos de permissão ACP
summary: 'Configurando agentes ACP: configuração do harness acpx, setup de Plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-04-25T13:56:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Para a visão geral, runbook do operador e conceitos, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

As seções abaixo cobrem configuração do harness acpx, setup de Plugin para as bridges MCP e configuração de permissões.

## Suporte atual ao harness acpx

Aliases integrados atuais do harness acpx:

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
Se a sua instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de mudar o padrão integrado.

O uso direto da CLI acpx também pode direcionar adaptadores arbitrários via `--agent <command>`, mas esse escape hatch bruto é um recurso da CLI acpx (não o caminho normal de `agentId` do OpenClaw).

## Configuração obrigatória

Linha de base central de ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o dispatch ACP mantendo os controles /acp.
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

A configuração de vinculação de thread é específica do adaptador de canal. Exemplo para Discord:

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

Se o spawn ACP vinculado à thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vinculações à conversa atual não exigem criação de thread filha. Elas exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Setup de Plugin para backend acpx

Instalações novas distribuem o Plugin de runtime incluído `acpx` habilitado por padrão, então o ACP
geralmente funciona sem uma etapa manual de instalação do plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, negou-o via `plugins.allow` / `plugins.deny` ou quer
mudar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação em workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o Plugin incluído `acpx` usa seu binário fixado local ao plugin (`node_modules/.bin/acpx` dentro do pacote do plugin). A inicialização registra o backend como não pronto e um job em segundo plano verifica `acpx --version`; se o binário estiver ausente ou incompatível, ele executa `npm install --omit=dev --no-save acpx@<pinned>` e verifica novamente. O gateway continua sem bloqueio durante todo o processo.

Substitua o comando ou a versão na configuração do plugin:

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

- `command` aceita caminho absoluto, caminho relativo (resolvido a partir do workspace do OpenClaw) ou nome de comando.
- `expectedVersion: "any"` desabilita correspondência estrita de versão.
- Caminhos `command` personalizados desabilitam a instalação automática local ao plugin.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependência

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos de plataforma) são instaladas automaticamente
por um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Bridge MCP de ferramentas de Plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP, como Codex ou Claude Code, chamem ferramentas
instaladas de Plugin do OpenClaw, como recuperação/armazenamento de memória, habilite a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas de plugin já registradas por plugins OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso amplia a superfície de ferramentas do harness ACP.
- Agentes ACP obtêm acesso apenas às ferramentas de plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança de permitir que esses plugins sejam executados
  no próprio OpenClaw.
- Revise os plugins instalados antes de habilitar isso.

`mcpServers` personalizados continuam funcionando como antes. A bridge integrada de plugin-tools é uma
conveniência adicional com opt-in, não um substituto da configuração genérica de servidor MCP.

### Bridge MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por
MCP. Habilite a bridge separada de ferramentas centrais quando um agente ACP precisar de
ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas centrais explícita e desativada por padrão.

### Configuração de timeout de runtime

O Plugin incluído `acpx` define por padrão o timeout de turnos de runtime incorporado como 120 segundos.
Isso dá a harnesses mais lentos, como Gemini CLI, tempo suficiente para concluir
a inicialização e o setup do ACP. Substitua se seu host precisar de um limite
de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar esse valor.

### Configuração de agente para sondagem de integridade

O Plugin incluído `acpx` testa um agente harness ao decidir se o backend de runtime
incorporado está pronto. Se `acp.allowedAgents` estiver definido, ele usa por padrão
o primeiro agente permitido; caso contrário, usa `codex`. Se sua implantação
precisar de um agente ACP diferente para verificações de integridade, defina explicitamente o agente de sondagem:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

Sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões do harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass específicas de fornecedor em backends de CLI, como `--permission-mode bypassPermissions` do Claude CLI. `approve-all` do ACPX é a chave break-glass em nível de harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente do harness pode executar sem solicitar confirmação.

| Valor           | Comportamento                                                |
| --------------- | ------------------------------------------------------------ |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                          |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido, mas não há um TTY interativo disponível (o que sempre acontece em sessões ACP).

| Valor  | Comportamento                                                      |
| ------ | ------------------------------------------------------------------ |
| `fail` | Interrompe a sessão com `AcpRuntimeError`. **(padrão)**            |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa). |

### Configuração

Defina via configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** Atualmente, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões se degradem graciosamente em vez de falhar.

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
