---
read_when:
    - Você quer automação orientada por eventos para /new, /reset, /stop e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar ganchos
summary: 'Ganchos: automação orientada por eventos para comandos e eventos de ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-03T21:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks são pequenos scripts que são executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você habilita hooks ou configura pelo menos uma entrada de hook, pacote de hooks, manipulador legado ou diretório extra de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): são executados dentro do Gateway quando eventos de agente disparam, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser empacotados dentro de plugins. `openclaw hooks list` mostra tanto hooks avulsos quanto hooks gerenciados por plugins.

## Início rápido

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Tipos de evento

| Evento                   | Quando dispara                                            |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Comando `/new` emitido                                    |
| `command:reset`          | Comando `/reset` emitido                                  |
| `command:stop`           | Comando `/stop` emitido                                   |
| `command`                | Qualquer evento de comando (ouvinte geral)                |
| `session:compact:before` | Antes de a compactação resumir o histórico                |
| `session:compact:after`  | Depois que a compactação é concluída                      |
| `session:patch`          | Quando propriedades da sessão são modificadas             |
| `agent:bootstrap`        | Antes de arquivos de bootstrap do workspace serem injetados |
| `gateway:startup`        | Depois que os canais iniciam e os hooks são carregados    |
| `gateway:shutdown`       | Quando o desligamento do gateway começa                   |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do gateway          |
| `message:received`       | Mensagem de entrada de qualquer canal                     |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída             |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links é concluído ou ignorado |
| `message:sent`           | Mensagem de saída entregue                                |

## Escrevendo hooks

### Estrutura do hook

Cada hook é um diretório que contém dois arquivos:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Campos de metadados** (`metadata.openclaw`):

| Campo      | Descrição                                            |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji de exibição para a CLI                         |
| `events`   | Array de eventos a observar                          |
| `export`   | Exportação nomeada a usar (padrão: `"default"`)      |
| `os`       | Plataformas necessárias (por exemplo, `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` ou caminhos de `config` necessários |
| `always`   | Ignorar verificações de elegibilidade (booleano)     |
| `install`  | Métodos de instalação                                |

### Implementação do manipulador

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (adicione itens para enviar ao usuário) e `context` (dados específicos do evento). Contextos de hooks de agente e Plugin de ferramenta também podem incluir `trace`, um contexto de rastreamento diagnóstico somente leitura compatível com W3C que plugins podem passar para logs estruturados para correlação OTEL.

### Destaques do contexto de eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`). `context.content` prefere um corpo de comando não vazio para mensagens semelhantes a comandos, depois recorre ao corpo bruto de entrada e ao corpo genérico; ele não inclui enriquecimento exclusivo do agente, como histórico da thread ou resumos de links.

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo final enriquecido), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de patch.

**Eventos de compactação**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitindo `/stop`; é ciclo de vida de cancelamento/comando, não uma barreira de finalização do agente. Plugins que precisam inspecionar uma resposta final natural e pedir ao agente mais uma passada devem usar o hook tipado de plugin `before_agent_finalize`. Consulte [Hooks de plugin](/pt-BR/plugins/hooks).

**Eventos de ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e dispara quando o desligamento do gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas dispara apenas quando o desligamento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o desligamento, cada espera de hook de ciclo de vida é de melhor esforço e limitada, para que o desligamento continue se um manipulador travar.

## Descoberta de hooks

Hooks são descobertos destes diretórios, em ordem crescente de precedência de substituição:

1. **Hooks empacotados**: enviados com o OpenClaw
2. **Hooks de plugin**: hooks empacotados dentro de plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Hooks de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem explicitamente habilitados)

Hooks de workspace podem adicionar novos nomes de hooks, mas não podem substituir hooks empacotados, gerenciados ou fornecidos por plugins com o mesmo nome.

O Gateway ignora a descoberta de hooks internos na inicialização até que hooks internos sejam configurados. Habilite um hook empacotado ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de hooks ou defina `hooks.internal.enabled=true` para aderir. Quando você habilita um hook nomeado, o Gateway carrega somente o manipulador desse hook; `hooks.internal.enabled=true`, diretórios extras de hooks e manipuladores legados aderem à descoberta ampla.

### Pacotes de hooks

Pacotes de hooks são pacotes npm que exportam hooks via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Especificações npm aceitam somente registry (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks empacotados

| Hook                  | Eventos                                           | O que faz                                                     |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão em `<workspace>/memory/`           |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos de bootstrap adicionais a partir de padrões glob |
| command-logger        | `command`                                         | Registra todos os comandos em `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa/termina |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` quando o gateway inicia                     |

Habilite qualquer hook empacotado:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente, gera um slug descritivo de nome de arquivo via LLM e salva em `<workspace>/memory/YYYY-MM-DD-slug.md` usando a data local do host. Exige que `workspace.dir` esteja configurado.

<a id="bootstrap-extra-files"></a>

### Configuração de bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Caminhos são resolvidos em relação ao workspace. Somente basenames de bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra todos os comandos de barra em `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalhes de compaction-notifier

Envia mensagens curtas de status para a conversa atual quando o OpenClaw começa e termina de compactar a transcrição da sessão. Isso torna turnos longos menos confusos em superfícies de chat, porque o usuário consegue ver que o assistente está resumindo o contexto e continuará depois da compactação.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o gateway inicia.

## Hooks de plugin

Plugins podem registrar hooks tipados por meio do Plugin SDK para integração mais profunda:
interceptar chamadas de ferramenta, modificar prompts, controlar o fluxo de mensagens e mais.
Use hooks de plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks de ciclo de vida em processo.

Para a referência completa de hooks de plugin, consulte [Hooks de plugin](/pt-BR/plugins/hooks).

## Configuração

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variáveis de ambiente por hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Diretórios extras de hooks:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
O formato legado de configuração em array `hooks.internal.handlers` ainda é compatível para retrocompatibilidade, mas hooks novos devem usar o sistema baseado em descoberta.
</Note>

## Referência da CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Práticas recomendadas

- **Mantenha os manipuladores rápidos.** Ganchos são executados durante o processamento de comandos. Execute trabalhos pesados em segundo plano sem aguardar com `void processInBackground(event)`.
- **Trate erros com elegância.** Envolva operações arriscadas em try/catch; não lance erros para que outros manipuladores possam ser executados.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir a sobrecarga.

## Solução de problemas

### Gancho não descoberto

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Gancho não elegível

```bash
openclaw hooks info my-hook
```

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o SO.

### Gancho não executando

1. Verifique se o gancho está habilitado: `openclaw hooks list`
2. Reinicie seu processo do Gateway para que os ganchos sejam recarregados.
3. Verifique os logs do Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referência da CLI: ganchos](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Ganchos de Plugin](/pt-BR/plugins/hooks) — ganchos de ciclo de vida de Plugin em processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
