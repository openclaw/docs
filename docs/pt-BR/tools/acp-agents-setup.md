---
read_when:
    - Instalando ou configurando o ambiente acpx para Claude Code / Codex / Gemini CLI
    - Habilitando a ponte MCP plugin-tools ou OpenClaw-tools
    - Configurando modos de permissão do ACP
summary: 'Configurando agentes ACP: configuração do ambiente de teste acpx, configuração do Plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-05-02T21:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para a visão geral, o runbook do operador e os conceitos, consulte [agentes ACP](/pt-BR/tools/acp-agents).

As seções abaixo abordam a configuração do harness acpx, a configuração de plugin para as pontes MCP e a configuração de permissões.

Use esta página somente quando estiver configurando a rota ACP/acpx. Para a configuração de runtime do app-server nativo do Codex, use [harness do Codex](/pt-BR/plugins/codex-harness). Para chaves de API da OpenAI ou configuração do provedor de modelo OAuth do Codex, use [OpenAI](/pt-BR/providers/openai).

O Codex tem duas rotas do OpenClaw:

| Rota                       | Configuração/comando                                  | Página de configuração                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo do Codex | `/codex ...`, `agentRuntime.id: "codex"`               | [harness do Codex](/pt-BR/plugins/codex-harness) |
| Adaptador ACP explícito do Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefira a rota nativa, a menos que você precise explicitamente do comportamento ACP/acpx.

## Suporte ao harness acpx (atual)

Aliases atuais do harness integrado do acpx:

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

Quando o OpenClaw usa o backend acpx, prefira estes valores para `agentId`, a menos que sua configuração do acpx defina aliases de agente personalizados.
Se a instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode direcionar adaptadores arbitrários via `--agent <command>`, mas essa saída bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

O controle de modelo depende da capacidade do adaptador. As refs de modelo ACP do Codex são normalizadas pelo OpenClaw antes da inicialização. Outros harnesses precisam de `models` do ACP mais suporte a `session/set_model`; se um harness não expuser nem essa capacidade ACP nem sua própria flag de modelo de inicialização, o OpenClaw/acpx não poderá forçar uma seleção de modelo.

## Configuração obrigatória

Linha de base principal do ACP:

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
        spawnSessions: true,
      },
    },
  },
}
```

Se o spawn ACP vinculado à thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Vinculações da conversa atual não exigem criação de thread filha. Elas exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração de plugin para backend acpx

Instalações empacotadas usam o plugin de runtime oficial `@openclaw/acpx` para ACP.
Instale e habilite-o antes de usar sessões de harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts de código-fonte também podem usar o plugin do workspace local após `pnpm install`.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, bloqueou-o via `plugins.allow` / `plugins.deny`, ou quer voltar para o plugin empacotado, use o caminho explícito do pacote:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação do workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a saúde do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin `acpx` registra o backend ACP incorporado sem iniciar um agente ACP durante a inicialização do Gateway. Execute `/acp doctor` para uma sondagem ativa explícita. Defina `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` somente quando você precisar que o Gateway sonde o agente configurado na inicialização.

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

- `command` aceita um caminho absoluto, caminho relativo (resolvido a partir do workspace do OpenClaw) ou nome de comando.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Caminhos personalizados de `command` desabilitam a instalação automática local do plugin.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente via um hook postinstall. Se a instalação automática falhar, o gateway ainda inicia normalmente e relata a dependência ausente por meio de `openclaw acp doctor`.

### Ponte MCP de ferramentas de plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao harness ACP.

Se você quiser que agentes ACP, como Codex ou Claude Code, chamem ferramentas de plugins instalados do OpenClaw, como recuperação/armazenamento de memória, habilite a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas de plugin já registradas por plugins do OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desativado por padrão.

Notas de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP obtêm acesso somente a ferramentas de plugin já ativas no gateway.
- Trate isto como o mesmo limite de confiança de permitir que esses plugins sejam executados no próprio OpenClaw.
- Revise os plugins instalados antes de habilitar.

`mcpServers` personalizados continuam funcionando como antes. A ponte integrada de ferramentas de plugin é uma conveniência adicional opcional, não uma substituição da configuração genérica de servidor MCP.

### Ponte MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por meio de MCP. Habilite a ponte separada de ferramentas principais quando um agente ACP precisar de ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas principais explícita e desativada por padrão.

### Configuração de timeout de runtime

O plugin `acpx` define por padrão um timeout de 120 segundos para turnos do runtime incorporado. Isso dá a harnesses mais lentos, como a CLI do Gemini, tempo suficiente para concluir a inicialização e preparação do ACP. Substitua isso se seu host precisar de um limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar este valor.

### Configuração do agente de sondagem de saúde

Quando `/acp doctor` ou a sondagem de inicialização opcional verifica o backend, o plugin `acpx` incluído sonda um agente de harness. Se `acp.allowedAgents` estiver definido, o padrão é o primeiro agente permitido; caso contrário, o padrão é `codex`. Se sua implantação precisar de um agente ACP diferente para verificações de saúde, defina o agente de sondagem explicitamente:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar este valor.

## Configuração de permissões

Sessões ACP são executadas de modo não interativo — não há TTY para aprovar ou negar prompts de permissão de escrita de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões do harness ACPX são separadas das aprovações de exec do OpenClaw e separadas das flags de bypass de fornecedores de backend de CLI, como `--permission-mode bypassPermissions` da CLI do Claude. ACPX `approve-all` é o interruptor de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente do harness pode realizar sem prompts.

| Valor           | Comportamento                                            |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as escritas de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; escritas e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                      |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas nenhum TTY interativo está disponível (o que é sempre o caso para sessões ACP).

| Valor  | Comportamento                                                    |
| ------ | --------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**             |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa). |

### Configuração

Defina via configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar estes valores.

<Warning>
O OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer escrita ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões se degradem graciosamente em vez de travar.
</Warning>

## Relacionados

- [agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
