---
read_when:
    - Instalando ou configurando o ambiente de execução acpx para Claude Code / Codex / Gemini CLI
    - Habilitando a ponte MCP plugin-tools ou OpenClaw-tools
    - Configurando os modos de permissão do ACP
summary: 'Configurando agentes ACP: configuração do ambiente de execução acpx, configuração do Plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-05-10T19:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para a visão geral, o runbook do operador e os conceitos, consulte [agentes ACP](/pt-BR/tools/acp-agents).

As seções abaixo abordam a configuração do harness acpx, a configuração de plugin para as pontes MCP e a configuração de permissões.

Use esta página somente ao configurar a rota ACP/acpx. Para a configuração de runtime do app-server nativo do Codex, use [harness Codex](/pt-BR/plugins/codex-harness). Para chaves de API da OpenAI ou configuração de provedor de modelo via OAuth do Codex, use
[OpenAI](/pt-BR/providers/openai).

O Codex tem duas rotas do OpenClaw:

| Rota                       | Configuração/comando                                   | Página de configuração                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo do Codex | `/codex ...`, refs de agente `openai/gpt-*`            | [harness Codex](/pt-BR/plugins/codex-harness) |
| Adaptador ACP explícito do Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefira a rota nativa, a menos que você precise explicitamente do comportamento ACP/acpx.

## Suporte ao harness acpx (atual)

Aliases de harness integrados atuais do acpx:

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
Se sua instalação local do Cursor ainda expõe ACP como `agent acp`, substitua o comando do agente `cursor` na configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode direcionar adaptadores arbitrários via `--agent <command>`, mas essa saída bruta de emergência é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

O controle de modelo depende da capacidade do adaptador. As refs de modelo do Codex ACP são normalizadas pelo OpenClaw antes da inicialização. Outros harnesses precisam de ACP `models` mais suporte a `session/set_model`; se um harness não expuser nem essa capacidade ACP nem seu próprio flag de modelo na inicialização, OpenClaw/acpx não pode forçar uma seleção de modelo.

## Configuração obrigatória

Base ACP principal:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o despacho ACP mantendo os controles /acp.
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
        spawnSessions: true,
      },
    },
  },
}
```

Se o spawn ACP vinculado a thread não funcionar, verifique primeiro o flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Vínculos da conversa atual não exigem criação de thread filha. Eles exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração de plugin para backend acpx

Instalações empacotadas usam o plugin de runtime oficial `@openclaw/acpx` para ACP.
Instale e habilite-o antes de usar sessões de harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts de código-fonte também podem usar o plugin local do workspace após `pnpm install`.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, bloqueou-o via `plugins.allow` / `plugins.deny`, ou deseja voltar para o plugin empacotado, use o caminho explícito do pacote:

```bash
openclaw plugins install @openclaw/acpx
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

Por padrão, o plugin `acpx` sonda o backend ACP incorporado durante a inicialização do Gateway e aguarda essa sondagem antes do sinal `ready` do gateway. Defina `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` para ignorar a sondagem de inicialização e registrar o backend de forma preguiçosa. Execute `/acp doctor` para uma sondagem explícita sob demanda.

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

Substitua o comando de um agente ACP individual com argumentos estruturados quando um caminho ou valor de flag deve permanecer como um único token argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` é o executável ou a string de comando existente para esse agente ACP.
- `agents.<id>.args` é opcional. Cada item do array recebe aspas de shell antes que o OpenClaw o passe pelo registro atual de strings de comando do acpx.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente via hook postinstall. Se a instalação automática falhar, o gateway ainda inicia normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Ponte MCP de ferramentas de plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code chamem ferramentas de plugins instalados do OpenClaw, como recuperação/armazenamento de memória, habilite a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isto faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas de plugin já registradas por plugins do OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desabilitado por padrão.

Notas de segurança e confiança:

- Isto expande a superfície de ferramentas do harness ACP.
- Agentes ACP têm acesso somente a ferramentas de plugin já ativas no gateway.
- Trate isto como o mesmo limite de confiança de permitir que esses plugins executem no próprio OpenClaw.
- Revise os plugins instalados antes de habilitar.

`mcpServers` personalizados continuam funcionando como antes. A ponte integrada de ferramentas de plugin é uma conveniência adicional opcional, não um substituto para a configuração genérica de servidor MCP.

### Ponte MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por meio de MCP. Habilite a ponte separada de ferramentas principais quando um agente ACP precisar de ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isto faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas principais explícita e desabilitada por padrão.

### Configuração de timeout de runtime

O plugin `acpx` define, por padrão, turns do runtime incorporado com timeout de 120 segundos. Isso dá a harnesses mais lentos, como a Gemini CLI, tempo suficiente para concluir a inicialização e a configuração inicial do ACP. Substitua isso se seu host precisar de um limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar este valor.

### Configuração do agente de sondagem de integridade

Quando `/acp doctor` ou a sondagem de inicialização verifica o backend, o plugin `acpx` incluído sonda um agente de harness. Se `acp.allowedAgents` estiver definido, o padrão é o primeiro agente permitido; caso contrário, o padrão é `codex`. Se sua implantação precisar de um agente ACP diferente para verificações de integridade, defina explicitamente o agente de sondagem:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar este valor.

## Configuração de permissões

Sessões ACP rodam de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass de fornecedor de backend de CLI, como `--permission-mode bypassPermissions` da Claude CLI. ACPX `approve-all` é o interruptor de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente de harness pode executar sem prompt.

| Valor           | Comportamento                                            |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivos e comandos de shell. |
| `approve-reads` | Aprova automaticamente somente leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                      |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas nenhum TTY interativo está disponível (o que é sempre o caso para sessões ACP).

| Valor  | Comportamento                                                    |
| ------ | ---------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**              |
| `deny` | Nega silenciosamente a permissão e continua (degradação elegante). |

### Configuração

Defina via configuração de plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar estes valores.

<Warning>
O padrão do OpenClaw é `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem com elegância em vez de travarem.
</Warning>

## Relacionado

- [agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
