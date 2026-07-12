---
read_when:
    - Instalação ou configuração do harness acpx para Claude Code / Codex / Gemini CLI
    - Ativando a ponte MCP de ferramentas de Plugin ou ferramentas do OpenClaw
    - Configurando os modos de permissão do ACP
summary: 'Configuração de agentes ACP: configuração do harness acpx, configuração do plugin e permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-07-12T15:42:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para uma visão geral, o runbook do operador e os conceitos, consulte [agentes ACP](/pt-BR/tools/acp-agents).

Esta página aborda a configuração do harness acpx, a configuração do plugin para as pontes MCP e a configuração de permissões.

Use esta página somente ao configurar a rota ACP/acpx. Para configurar o runtime app-server nativo do Codex, use [harness do Codex](/pt-BR/plugins/codex-harness). Para chaves da API da OpenAI ou configuração do provedor de modelos com OAuth do Codex, use [OpenAI](/pt-BR/providers/openai).

O Codex tem duas rotas no OpenClaw:

| Rota                       | Configuração/comando                                   | Página de configuração                 |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo do Codex | `/codex ...`, referências de agente `openai/gpt-*`     | [Harness do Codex](/pt-BR/plugins/codex-harness) |
| Adaptador ACP explícito do Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                        |

Prefira a rota nativa, a menos que você precise explicitamente do comportamento do ACP/acpx.

## Suporte do harness acpx (atual)

Aliases integrados do harness acpx (provenientes da dependência `acpx` fixada):

| Alias        | Encapsula                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Ponte ACP do OpenClaw (`openclaw acp` nativo)                                                                   |
| `pi`         | [Agente de programação Pi](https://github.com/mariozechner/pi)                                                  |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` e `factorydroid` também são resolvidos para o adaptador integrado `droid`.

Quando o OpenClaw usa o backend acpx, prefira esses valores para `agentId`, a menos que sua configuração do acpx defina aliases de agente personalizados.
Se sua instalação local do Cursor ainda expuser o ACP como `agent acp`, substitua o comando do agente `cursor` na configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode direcionar adaptadores arbitrários por meio de `--agent <command>`, mas essa saída de emergência sem abstração é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

O controle de modelos depende dos recursos do adaptador. As referências de modelo do ACP do Codex são normalizadas pelo OpenClaw antes da inicialização. Outros harnesses precisam do recurso ACP `models` e de suporte a `session/set_model`; se um harness não expuser esse recurso ACP nem um sinalizador próprio de modelo na inicialização, o OpenClaw/acpx não poderá impor a seleção de um modelo.

## Configuração obrigatória

Configuração básica do ACP no núcleo:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina como false para pausar o despacho do ACP mantendo os controles de /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Os padrões são coalesceIdleMs: 350, maxChunkChars: 1800; mostrados explicitamente aqui.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

A configuração da vinculação a threads é específica do adaptador de canal. Exemplo para o Discord:

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
        // O padrão já é true; mostrado explicitamente aqui.
        spawnSessions: true,
      },
    },
  },
}
```

Se a criação de uma sessão ACP vinculada a uma thread não funcionar, verifique primeiro o sinalizador de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

As vinculações à conversa atual não exigem a criação de uma thread filha. Elas exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa ACP.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do plugin para o backend acpx

As instalações empacotadas usam o plugin oficial de runtime `@openclaw/acpx` para ACP.
Instale-o e ative-o antes de usar sessões do harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts do código-fonte também podem usar o plugin do workspace local após `pnpm install`.

Comece com:

```text
/acp doctor
```

Se você desativou o `acpx`, negou seu uso por meio de `plugins.allow` / `plugins.deny` ou deseja voltar ao plugin empacotado, use o caminho explícito do pacote:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação do workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Em seguida, verifique a integridade do backend:

```text
/acp doctor
```

### Sondagem de inicialização do runtime acpx

O plugin `acpx` incorpora diretamente o runtime ACP (não há binário ou versão separada do `acpx` para configurar). Por padrão, ele registra o backend incorporado durante a inicialização do Gateway e aguarda uma sondagem de inicialização antes do sinal `ready` do gateway. Defina `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` ou `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` somente para scripts ou ambientes que mantenham intencionalmente a sondagem de inicialização desativada. Execute `/acp doctor` para realizar uma sondagem explícita sob demanda.

Substitua o comando de um agente ACP individual por argumentos estruturados quando um caminho ou valor de sinalizador precisar permanecer como um único token de argv:

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
- `agents.<id>.args` é opcional. Cada item da matriz recebe escape de shell antes de o OpenClaw repassá-lo pelo registro atual de strings de comando do acpx.

Consulte [Plugins](/pt-BR/tools/plugin).

### Download automático de adaptadores

O `acpx` baixa automaticamente adaptadores ACP (por exemplo, as pontes ACP do Claude e do Codex) por meio do `npx` no primeiro uso. Não é necessário instalar pacotes de adaptadores manualmente, e não há uma etapa separada de pós-instalação para o próprio OpenClaw. Se o download ou a inicialização de um adaptador falhar, `/acp doctor` informará a falha.

### Ponte MCP para ferramentas de plugins

Por padrão, as sessões ACPX **não** expõem ao harness ACP as ferramentas registradas por plugins do OpenClaw.

Se você quiser que agentes ACP, como Codex ou Claude Code, chamem ferramentas de plugins instalados do OpenClaw, como recuperação/armazenamento de memória, ative a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` na inicialização da sessão ACPX.
- Expõe ferramentas de plugins já registradas por plugins do OpenClaw instalados e ativados.
- Mantém o recurso explícito e desativado por padrão.

Observações sobre segurança e confiança:

- Isso amplia a superfície de ferramentas do harness ACP.
- Os agentes ACP obtêm acesso somente às ferramentas de plugins que já estão ativas no gateway.
- Trate isso como o mesmo limite de confiança de permitir que esses plugins sejam executados no próprio OpenClaw.
- Revise os plugins instalados antes de ativá-lo.

Os `mcpServers` personalizados continuam funcionando como antes. A ponte integrada de ferramentas de plugins é uma conveniência adicional de ativação explícita, não uma substituição para a configuração genérica de servidores MCP.

### Ponte MCP para ferramentas do OpenClaw

Por padrão, as sessões ACPX também **não** expõem as ferramentas integradas do OpenClaw por meio do MCP. Ative a ponte separada para ferramentas do núcleo quando um agente ACP precisar de ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` na inicialização da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas do núcleo explícita e desativada por padrão.

### Configuração do tempo limite das operações do runtime

Por padrão, o plugin `acpx` concede 120 segundos às operações de inicialização e controle do runtime incorporado. Isso dá a harnesses mais lentos, como a Gemini CLI, tempo suficiente para concluir a inicialização e a preparação do ACP. Substitua esse valor se o host precisar de um limite de operação diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Os turnos do runtime usam os tempos limite de agente/execução do OpenClaw, incluindo `/acp timeout`.
`sessions_spawn` não aceita substituições de tempo limite por chamada; o caminho para o operador é `agents.defaults.subagents.runTimeoutSeconds`. Reinicie o gateway após alterar `timeoutSeconds`.

### Configuração do agente de sondagem de integridade

Quando `/acp doctor` ou a sondagem de inicialização verifica o backend, o plugin `acpx` incluído sonda um agente do harness. Se `acp.allowedAgents` estiver definido, o padrão será o primeiro agente permitido; caso contrário, o padrão será `codex`. Se sua implantação precisar de um agente ACP diferente para verificações de integridade, defina explicitamente o agente de sondagem:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

As sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar solicitações de permissão de gravação em arquivos e execução de comandos no shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões do harness ACPX são separadas das aprovações de execução do OpenClaw e dos sinalizadores de fornecedores para ignorar permissões no backend da CLI, como `--permission-mode bypassPermissions` da CLI do Claude. O `approve-all` do ACPX é o mecanismo emergencial no nível do harness para sessões ACP.

Para uma comparação mais ampla entre `tools.exec.mode` do OpenClaw, as aprovações do Codex Guardian e as permissões do harness ACPX, consulte [Modos de permissão](/pt-BR/tools/permission-modes).

### `permissionMode`

Controla quais operações o agente do harness pode realizar sem solicitar confirmação.

| Valor           | Comportamento                                                                    |
| --------------- | ------------------------------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivos e comandos do shell.      |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e execuções exigem confirmação. |
| `deny-all`      | Nega todas as solicitações de permissão.                                        |

### `nonInteractivePermissions`

Controla o que acontece quando uma solicitação de permissão seria exibida, mas nenhuma TTY interativa está disponível (o que sempre ocorre nas sessões ACP).

| Valor  | Comportamento                                                                  |
| ------ | ----------------------------------------------------------------------------- |
| `fail` | Interrompe a sessão com `PermissionPromptUnavailableError`. **(padrão)**      |
| `deny` | Nega silenciosamente a permissão e continua (degradação gradual).             |

### Configuração

Defina por meio da configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o Gateway após alterar esses valores.

<Warning>
O padrão do OpenClaw é `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer operação de gravação ou execução que acione uma solicitação de permissão pode falhar com `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Se precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões tenham uma redução gradual de funcionalidade em vez de falharem.
</Warning>

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents) — visão geral, manual operacional, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
