---
read_when:
    - Instalar ou configurar o harness acpx para Claude Code / Codex / Gemini CLI
    - Ativar a ponte MCP plugin-tools ou OpenClaw-tools
    - Configurar modos de permissão ACP
summary: 'Configurar agentes ACP: configuração do harness acpx, setup de Plugin, permissões'
title: Agentes ACP — configuração
x-i18n:
    generated_at: "2026-04-24T06:13:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Para a visão geral, runbook do operador e conceitos, consulte [Agentes ACP](/pt-BR/tools/acp-agents).
Esta página cobre configuração do harness acpx, setup de Plugin para as pontes MCP e
configuração de permissões.

## Suporte do harness acpx (atual)

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
Se sua instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de mudar o padrão integrado.

O uso direto da CLI do acpx também pode apontar para adaptadores arbitrários via `--agent <command>`, mas essa rota de escape bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

## Configuração obrigatória

Linha de base do core ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o despacho ACP mantendo controles /acp.
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

A configuração de thread binding é específica do adaptador de canal. Exemplo para Discord:

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

Se o spawn de ACP vinculado a thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vinculações à conversa atual não exigem criação de thread filha. Elas exigem um contexto de conversa ativo e um adaptador de canal que exponha vinculações de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Setup de Plugin para backend acpx

Instalações novas já vêm com o Plugin de runtime `acpx` empacotado ativado por padrão, então o ACP
geralmente funciona sem uma etapa manual de instalação de plugin.

Comece com:

```text
/acp doctor
```

Se você desativou `acpx`, o negou via `plugins.allow` / `plugins.deny`, ou quiser
alternar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação local de workspace durante desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin empacotado `acpx` usa seu binário local fixado (`node_modules/.bin/acpx` dentro do pacote do plugin). A inicialização registra o backend como não pronto e um job em segundo plano verifica `acpx --version`; se o binário estiver ausente ou incompatível, ele executa `npm install --omit=dev --no-save acpx@<pinned>` e verifica novamente. O gateway continua não bloqueante o tempo todo.

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
- `expectedVersion: "any"` desativa correspondência estrita de versão.
- Caminhos personalizados de `command` desativam auto-instalação local do plugin.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependência

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente
via um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e relata a dependência ausente por meio de `openclaw acp doctor`.

### Ponte MCP de ferramentas de Plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code possam chamar
ferramentas de Plugin OpenClaw instaladas, como recuperação/armazenamento de memória, ative a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas de plugin já registradas por plugins OpenClaw instalados e ativados.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP recebem acesso apenas às ferramentas de Plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança que permitir que esses plugins executem no
  próprio OpenClaw.
- Revise os plugins instalados antes de ativar.

`mcpServers` personalizados continuam funcionando como antes. A ponte integrada de plugin-tools é
uma conveniência adicional com adesão explícita, não um substituto para a configuração genérica de servidor MCP.

### Ponte MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por MCP. Ative a ponte separada de ferramentas do core quando um agente ACP precisar de ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` no bootstrap da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas do core explícita e desativada por padrão.

### Configuração de timeout de runtime

O plugin empacotado `acpx` usa por padrão um timeout de 120 segundos para
turnos de runtime incorporado. Isso dá tempo suficiente para harnesses mais lentos, como Gemini CLI, concluírem
a inicialização e bootstrap do ACP. Substitua se seu host precisar de um limite diferente de runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar esse valor.

### Configuração do agente de probe de integridade

O plugin empacotado `acpx` sonda um agente de harness ao decidir se o backend de runtime incorporado está pronto. O padrão é `codex`. Se sua implantação usa um agente ACP padrão diferente, defina o agente de probe com o mesmo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

Sessões ACP executam de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões do harness ACPX são separadas de aprovações de exec do OpenClaw e separadas de flags de bypass específicas de fornecedor de backend CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` é a chave de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente do harness pode executar sem prompt.

| Valor           | Comportamento                                              |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                        |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas nenhum TTY interativo está disponível (o que sempre ocorre em sessões ACP).

| Valor  | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**                    |
| `deny` | Nega silenciosamente a permissão e continua (degradação elegante).     |

### Configuração

Defina via configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** o OpenClaw atualmente usa como padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem com elegância em vez de travarem.

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents) — visão geral, runbook do operador, conceitos
- [Subagentes](/pt-BR/tools/subagents)
- [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent)
