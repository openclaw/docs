---
read_when:
    - Você quer automação orientada a eventos para /new, /reset, /stop e eventos de ciclo de vida do agente
    - Você quer criar, instalar ou depurar ganchos
summary: 'Hooks: automação orientada a eventos para comandos e eventos de ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-02T20:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Ganchos são pequenos scripts executados quando algo acontece dentro do Gateway. Eles podem ser descobertos em diretórios e inspecionados com `openclaw hooks`. O Gateway carrega ganchos internos somente depois que você habilita ganchos ou configura pelo menos uma entrada de gancho, pacote de ganchos, manipulador legado ou diretório extra de ganchos.

Há dois tipos de ganchos no OpenClaw:

- **Ganchos internos** (esta página): executam dentro do Gateway quando eventos de agentes disparam, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Ganchos também podem ser empacotados dentro de plugins. `openclaw hooks list` mostra tanto ganchos independentes quanto ganchos gerenciados por Plugin.

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
| `session:compact:before` | Antes de a Compaction resumir o histórico                 |
| `session:compact:after`  | Depois que a Compaction é concluída                       |
| `session:patch`          | Quando propriedades da sessão são modificadas             |
| `agent:bootstrap`        | Antes de arquivos de inicialização do workspace serem injetados |
| `gateway:startup`        | Depois que os canais iniciam e os ganchos são carregados  |
| `gateway:shutdown`       | Quando o desligamento do gateway começa                   |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do gateway          |
| `message:received`       | Mensagem recebida de qualquer canal                       |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída             |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links é concluído ou ignorado |
| `message:sent`           | Mensagem enviada entregue                                 |

## Escrevendo ganchos

### Estrutura do gancho

Cada gancho é um diretório que contém dois arquivos:

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

| Campo      | Descrição                                             |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji de exibição para a CLI                          |
| `events`   | Array de eventos a serem observados                   |
| `export`   | Exportação nomeada a usar (padrão: `"default"`)       |
| `os`       | Plataformas exigidas (por exemplo, `["darwin", "linux"]`) |
| `requires` | Caminhos de `bins`, `anyBins`, `env` ou `config` exigidos |
| `always`   | Ignora verificações de elegibilidade (booleano)       |
| `install`  | Métodos de instalação                                 |

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

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (adicione com push para enviar ao usuário) e `context` (dados específicos do evento). Contextos de ganchos de agentes e ferramentas de Plugin também podem incluir `trace`, um contexto de rastreamento diagnóstico somente leitura compatível com W3C que plugins podem passar para logs estruturados para correlação OTEL.

### Destaques do contexto do evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`). `context.content` prefere um corpo de comando não vazio para mensagens parecidas com comandos e, em seguida, recorre ao corpo bruto recebido e ao corpo genérico; ele não inclui enriquecimento exclusivo do agente, como histórico da thread ou resumos de links.

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de inicialização** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (apenas campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de patch.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitindo `/stop`; é ciclo de vida de cancelamento/comando, não um portão de finalização de agente. Plugins que precisam inspecionar uma resposta final natural e pedir ao agente mais uma passada devem usar o gancho tipado de Plugin `before_agent_finalize`. Consulte [Ganchos de Plugin](/pt-BR/plugins/hooks).

**Eventos de ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e dispara quando o desligamento do gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas dispara somente quando o desligamento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o desligamento, cada espera de gancho de ciclo de vida é de melhor esforço e limitada, para que o desligamento continue se um manipulador travar.

## Descoberta de ganchos

Ganchos são descobertos nestes diretórios, em ordem crescente de precedência de substituição:

1. **Ganchos empacotados**: enviados com o OpenClaw
2. **Ganchos de Plugin**: ganchos empacotados dentro de plugins instalados
3. **Ganchos gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham esta precedência.
4. **Ganchos de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem habilitados explicitamente)

Ganchos de workspace podem adicionar novos nomes de gancho, mas não podem substituir ganchos empacotados, gerenciados ou fornecidos por Plugin com o mesmo nome.

O Gateway ignora a descoberta de ganchos internos na inicialização até que ganchos internos sejam configurados. Habilite um gancho empacotado ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de ganchos ou defina `hooks.internal.enabled=true` para aderir. Quando você habilita um gancho nomeado, o Gateway carrega somente o manipulador desse gancho; `hooks.internal.enabled=true`, diretórios extras de ganchos e manipuladores legados aderem à descoberta ampla.

### Pacotes de ganchos

Pacotes de ganchos são pacotes npm que exportam ganchos via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

As especificações Npm são somente de registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/file e intervalos semver são rejeitados.

## Hooks incluídos

| Hook                  | Eventos                        | O que faz                                                |
| --------------------- | ------------------------------ | -------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva o contexto da sessão em `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Injeta arquivos adicionais de bootstrap a partir de padrões glob |
| command-logger        | `command`                      | Registra todos os comandos em `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Executa `BOOT.md` quando o Gateway inicia                |

Habilite qualquer hook incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente, gera um slug de nome de arquivo descritivo via LLM e salva em `<workspace>/memory/YYYY-MM-DD-slug.md` usando a data local do host. Requer que `workspace.dir` esteja configurado.

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

Os caminhos são resolvidos em relação ao workspace. Somente nomes base de bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra todos os comandos de barra em `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o Gateway inicia.

## Hooks de Plugin

Plugins podem registrar hooks tipados por meio do Plugin SDK para integração mais profunda:
interceptar chamadas de ferramentas, modificar prompts, controlar o fluxo de mensagens e muito mais.
Use hooks de Plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks de ciclo de vida em processo.

Para a referência completa de hooks de Plugin, consulte [Hooks de Plugin](/pt-BR/plugins/hooks).

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
O formato legado de configuração de array `hooks.internal.handlers` ainda é compatível para compatibilidade retroativa, mas novos hooks devem usar o sistema baseado em descoberta.
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

## Melhores práticas

- **Mantenha os handlers rápidos.** Hooks são executados durante o processamento de comandos. Execute trabalhos pesados em modo disparar-e-esquecer com `void processInBackground(event)`.
- **Trate erros de forma elegante.** Envolva operações arriscadas em try/catch; não lance erros para que outros handlers possam ser executados.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir a sobrecarga.

## Solução de problemas

### Hook não descoberto

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook não elegível

```bash
openclaw hooks info my-hook
```

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o SO.

### Hook não está executando

1. Verifique se o hook está habilitado: `openclaw hooks list`
2. Reinicie o processo do Gateway para que os hooks sejam recarregados.
3. Verifique os logs do Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionados

- [Referência da CLI: hooks](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/pt-BR/plugins/hooks) — hooks de ciclo de vida de Plugin no processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
