---
read_when:
    - Instalação ou configuração do harness acpx para Claude Code / Codex / Gemini CLI
    - Ativação da ponte MCP plugin-tools ou OpenClaw-tools
    - Configurando os modos de permissão do ACP
summary: 'Configuração de agentes ACP: configuração do harness acpx, configuração do plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-07-16T13:00:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Para obter uma visão geral, o manual operacional e os conceitos, consulte [agentes ACP](/pt-BR/tools/acp-agents).

Esta página aborda a configuração do harness acpx, a configuração do plugin para as pontes MCP e a configuração de permissões.

Use esta página somente ao configurar a rota ACP/acpx. Para configurar o runtime
nativo do app-server do Codex, use [harness do Codex](/pt-BR/plugins/codex-harness). Para
chaves da API da OpenAI ou configuração do provedor de modelos com OAuth do Codex, use
[OpenAI](/pt-BR/providers/openai).

O Codex tem duas rotas do OpenClaw:

| Rota                       | Configuração/comando                                   | Página de configuração                  |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo do Codex | `/codex ...`, referências de agente `openai/gpt-*`                | [Harness do Codex](/pt-BR/plugins/codex-harness) |
| Adaptador ACP explícito do Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Esta página                             |

Prefira a rota nativa, a menos que precise explicitamente do comportamento de ACP/acpx.

## Suporte ao harness acpx (atual)

Aliases integrados do harness acpx (provenientes da dependência fixada `acpx`):

| Alias        | Encapsula                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [CLI do Codex](https://codex.openai.com)                                                                           |
| `copilot`    | [CLI do GitHub Copilot](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [CLI do Cursor](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [CLI do Gemini](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [CLI do iFlow](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [CLI do Kimi](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [CLI do Kiro](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Ponte ACP do OpenClaw (`openclaw acp` nativo)                                                                     |
| `pi`         | [Agente de programação Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [CLI do Qoder](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI do Trae](https://docs.trae.cn/cli)                                                                            |

`factory-droid` e `factorydroid` também são resolvidos para o adaptador integrado `droid`.

Quando o OpenClaw usa o backend acpx, prefira esses valores para `agentId`, a menos que sua configuração do acpx defina aliases de agente personalizados.
Se sua instalação local do Cursor ainda expuser o ACP como `agent acp`, substitua o comando de agente `cursor` na configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode direcionar adaptadores arbitrários por meio de `--agent <command>`, mas essa válvula de escape bruta é um recurso da CLI do acpx (não o caminho normal `agentId` do OpenClaw).

O controle de modelo depende dos recursos do adaptador. As referências de modelo ACP do Codex são
normalizadas pelo OpenClaw antes da inicialização. Outros harnesses precisam de `models` do ACP e
suporte a `session/set_model`; se um harness não expuser esse recurso do ACP
nem seu próprio sinalizador de modelo na inicialização, o OpenClaw/acpx não poderá impor uma seleção de modelo.

## Configuração obrigatória

Linha de base principal do ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina como false para pausar o despacho do ACP mantendo os controles /acp.
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

A configuração de vinculação de threads é específica do adaptador de canal. Exemplo para o Discord:

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

Se a criação de ACP vinculado à thread não funcionar, verifique primeiro o sinalizador de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

As vinculações à conversa atual não exigem a criação de uma thread filha. Elas exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa do ACP.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do plugin para o backend acpx

As instalações empacotadas usam o plugin de runtime oficial `@openclaw/acpx` para ACP.
Instale-o e habilite-o antes de usar sessões de harness do ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts do código-fonte também podem usar o plugin do workspace local após `pnpm install`.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, negou-o por meio de `plugins.allow` / `plugins.deny` ou deseja
voltar ao plugin empacotado, use o caminho explícito do pacote:

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

O plugin `acpx` incorpora o runtime ACP diretamente (sem um binário ou uma
versão `acpx` separada para configurar). Por padrão, ele registra o backend incorporado durante a
inicialização do Gateway e aguarda uma sondagem de inicialização antes do sinal
`ready` do gateway. Defina `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` ou
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` somente para scripts ou ambientes que
mantenham intencionalmente a sondagem de inicialização desabilitada. Execute `/acp doctor` para uma sondagem
explícita sob demanda.

Substitua o comando de um agente ACP individual por argumentos estruturados quando um caminho
ou valor de sinalizador precisar permanecer como um único token argv:

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

- `agents.<id>.command` é o executável ou a string de comando existente desse agente ACP.
- `agents.<id>.args` é opcional. Cada item do array recebe escape de shell antes de o OpenClaw passá-lo pelo registro atual de strings de comando do acpx.

Consulte [Plugins](/pt-BR/tools/plugin).

### Download automático de adaptadores

`acpx` baixa automaticamente adaptadores ACP (por exemplo, as pontes ACP do Claude e do Codex)
por meio de `npx` no primeiro uso. Não é necessário instalar pacotes de adaptadores
manualmente, e não há uma etapa de pós-instalação separada para o próprio OpenClaw. Se o
download ou a criação de um adaptador falhar, `/acp doctor` relatará a falha.

### Ponte MCP das ferramentas de plugins

Por padrão, as sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao
harness ACP.

Se quiser que agentes ACP, como o Codex ou o Claude Code, chamem ferramentas de
plugins instalados do OpenClaw, como recuperação/armazenamento de memória, habilite a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` na inicialização
  da sessão ACPX.
- Expõe ferramentas de plugins já registradas por plugins instalados e habilitados do OpenClaw.
- Transmite a identidade da sessão ACP ativa às fábricas de ferramentas de plugins, para que
  as ferramentas com escopo de agente permaneçam no namespace desse agente.
- Mantém o recurso explícito e desabilitado por padrão.

Observações sobre segurança e confiança:

- Isso amplia a superfície de ferramentas do harness ACP.
- Os agentes ACP obtêm acesso somente às ferramentas de plugins que já estão ativas no gateway.
- Trate isso como o mesmo limite de confiança de permitir que esses plugins sejam executados no
  próprio OpenClaw.
- Revise os plugins instalados antes de habilitá-lo.

Os `mcpServers` personalizados continuam funcionando como antes. A ponte integrada de ferramentas de plugins é uma
conveniência adicional e opcional, não uma substituição para a configuração genérica de servidores MCP.

### Ponte MCP das ferramentas do OpenClaw

Por padrão, as sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por meio
do MCP. Habilite a ponte separada de ferramentas principais quando um agente ACP precisar de
ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` na inicialização
  da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas principais explícita e desabilitada por padrão.

### Configuração do tempo limite das operações do runtime

O plugin `acpx` concede 120 segundos por padrão às operações de inicialização e controle do
runtime incorporado. Isso dá a harnesses mais lentos, como a CLI do Gemini, tempo suficiente
para concluir a inicialização do ACP. Substitua esse valor se o host precisar de um
limite de operação diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Os turnos do runtime usam os tempos limite de agente/execução do OpenClaw, incluindo `/acp timeout`.
`sessions_spawn` não aceita substituições de tempo limite por chamada; o caminho do operador
é `agents.defaults.subagents.runTimeoutSeconds`. Reinicie o gateway após
alterar `timeoutSeconds`.

### Configuração do agente de sondagem de integridade

Quando `/acp doctor` ou a sondagem de inicialização verifica o backend, o plugin
`acpx` incluído sonda um agente de harness. Se `acp.allowedAgents` estiver definido, o padrão será
o primeiro agente permitido; caso contrário, o padrão será `codex`. Se sua implantação
precisar de outro agente ACP para verificações de integridade, defina explicitamente o agente de sondagem:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

As sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar solicitações de permissão de gravação de arquivos e execução de comandos no shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões do harness ACPX são separadas das aprovações de execução do OpenClaw e dos sinalizadores de bypass de fornecedores do backend da CLI, como Claude CLI `--permission-mode bypassPermissions`. O `approve-all` do ACPX é o mecanismo emergencial no nível do harness para sessões ACP.

Para uma comparação mais ampla entre o `tools.exec.mode` do OpenClaw, as aprovações do Codex Guardian
e as permissões do harness ACPX, consulte
[Modos de permissão](/pt-BR/tools/permission-modes).

### `permissionMode`

Controla quais operações o agente do harness pode executar sem solicitar confirmação.

| Valor           | Comportamento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivos e os comandos do shell.          |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e execuções exigem confirmação. |
| `deny-all`      | Nega todas as solicitações de permissão.                              |

### `nonInteractivePermissions`

Controla o que acontece quando uma solicitação de permissão seria exibida, mas não há uma TTY interativa disponível (o que sempre ocorre nas sessões ACP).

| Valor  | Comportamento                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Encerra a sessão com `PermissionPromptUnavailableError`. **(padrão)** |
| `deny` | Nega silenciosamente a permissão e continua (degradação controlada).        |

### Configuração

Defina por meio da configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o Gateway depois de alterar esses valores.

<Warning>
O padrão do OpenClaw é `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou execução que acione uma solicitação de permissão pode falhar com `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Se for necessário restringir as permissões, defina `nonInteractivePermissions` como `deny` para que as sessões sofram degradação controlada em vez de serem encerradas por falha.
</Warning>

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
