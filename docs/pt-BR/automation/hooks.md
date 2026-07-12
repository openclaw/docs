---
read_when:
    - Você quer automação orientada a eventos para /new, /reset, /stop e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar hooks
summary: 'Hooks: automação orientada a eventos para comandos e eventos do ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-07-11T23:43:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks são pequenos scripts executados dentro do Gateway quando eventos do agente são disparados: comandos como `/new`, `/reset`, `/stop`, compactação de sessão, ciclo de vida do Gateway e fluxo de mensagens. Eles são descobertos em diretórios e gerenciados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você habilita hooks ou configura pelo menos uma entrada de hook, um pacote de hooks, um manipulador legado ou um diretório adicional de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): são executados dentro do Gateway quando eventos do agente são disparados.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalhos no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser incluídos em plugins. `openclaw hooks list` mostra tanto hooks independentes quanto hooks gerenciados por plugins (exibidos como `plugin:<id>`).

## Escolha a superfície adequada

O OpenClaw tem várias superfícies de extensão que parecem semelhantes, mas resolvem problemas diferentes:

| Se você quiser...                                                                                                             | Use...                                        | Por quê                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Salvar um instantâneo em `/new`, registrar `/reset`, chamar uma API externa após `message:sent` ou adicionar automação geral do operador | Hooks internos (`HOOK.md`, esta página)       | Hooks baseados em arquivos destinam-se a efeitos colaterais gerenciados pelo operador e à automação de comandos/ciclo de vida |
| Reescrever prompts, bloquear ferramentas, cancelar mensagens de saída ou adicionar middleware/política ordenados              | Hooks tipados de plugin via `api.on(...)`      | Hooks tipados têm contratos explícitos, prioridades, regras de mesclagem e semântica de bloqueio/cancelamento      |
| Adicionar exportação somente de telemetria ou observabilidade                                                                 | Eventos de diagnóstico                         | A observabilidade usa um barramento de eventos separado, não uma superfície de hooks de política                  |

Use hooks internos quando quiser uma automação que se comporte como uma pequena integração instalada. Use hooks tipados de plugin quando precisar controlar o ciclo de vida em tempo de execução.

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

Os hooks assinam uma chave específica desta tabela ou um nome de família isolado
(`command`, `session`, `agent`, `gateway`, `message`) para receber todas as ações
dessa família. O núcleo do OpenClaw não emite nenhum outro evento, portanto qualquer outro nome é quase
sempre um erro de digitação que deixa o hook silenciosamente inativo (somente um plugin que emita um
evento personalizado poderia acioná-lo). O carregador de hooks registra um aviso para esses nomes
(por exemplo, `command:nwe`), e `openclaw hooks info <name>` os sinaliza, portanto é
possível diagnosticar um hook que nunca é executado.

| Evento                   | Quando é disparado                                         |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Quando o comando `/new` é emitido                           |
| `command:reset`          | Quando o comando `/reset` é emitido                         |
| `command:stop`           | Quando o comando `/stop` é emitido                          |
| `command`                | Qualquer evento de comando (ouvinte geral)                 |
| `session:compact:before` | Antes de a Compaction resumir o histórico                   |
| `session:compact:after`  | Depois que a Compaction é concluída                         |
| `session:patch`          | Quando as propriedades da sessão são modificadas            |
| `agent:bootstrap`        | Antes de os arquivos de inicialização do espaço de trabalho serem injetados |
| `gateway:startup`        | Depois que os canais são iniciados e os hooks são carregados |
| `gateway:shutdown`       | Quando o encerramento do Gateway começa                     |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do Gateway            |
| `message:received`       | Mensagem recebida de qualquer canal                         |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída               |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links é concluído ou ignorado |
| `message:sent`           | Tentativa de envio de saída (`context.success` contém o resultado) |

## Como escrever hooks

### Estrutura de um hook

Cada hook é um diretório que contém dois arquivos:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

O arquivo do manipulador pode ser `handler.ts`, `handler.js`, `index.ts` ou `index.js`.

### Formato do HOOK.md

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

| Campo      | Descrição                                                    |
| ---------- | ------------------------------------------------------------ |
| `emoji`    | Emoji de exibição para a CLI                                 |
| `events`   | Matriz de eventos a serem monitorados                        |
| `export`   | Exportação nomeada a ser usada (o padrão é `"default"`)      |
| `os`       | Plataformas obrigatórias (por exemplo, `["darwin", "linux"]`) |
| `requires` | Caminhos obrigatórios de `bins`, `anyBins`, `env` ou `config` |
| `always`   | Ignora verificações de elegibilidade (booleano)              |
| `hookKey`  | Substituição da chave de configuração (o padrão é o nome do hook) |
| `homepage` | URL da documentação exibida por `openclaw hooks info`        |
| `install`  | Métodos de instalação                                        |

### Implementação do manipulador

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` e `context` (dados específicos do evento). Contextos de hooks tipados de plugin para hooks de agente e ferramenta também podem incluir `trace`, um contexto de rastreamento de diagnóstico somente leitura compatível com W3C que os plugins podem repassar para logs estruturados para correlação com OTEL.

As strings adicionadas a `event.messages` são entregues de volta ao chat somente para
`command:new` e `command:reset` (encaminhadas como resposta à conversa de
origem) e para `session:compact:before` / `session:compact:after`
(enviadas como avisos de status da Compaction). Todos os outros eventos, incluindo
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` e
`gateway:*`, ignoram as mensagens adicionadas.

### Destaques do contexto dos eventos

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Eventos de comando** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`). `context.content` dá preferência a um corpo de comando não vazio para mensagens semelhantes a comandos e, em seguida, recorre ao corpo bruto recebido e ao corpo genérico; ele não inclui enriquecimento exclusivo do agente, como histórico da conversa ou resumos de links.

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, além de `context.error` quando o envio falha.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo final enriquecido), `context.from`, `context.channelId`.

**Eventos de inicialização** (`agent:bootstrap`): `context.bootstrapFiles` (matriz mutável), `context.agentId`.

**Eventos de alteração de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente os campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de alteração; o contexto é um clone, portanto os manipuladores não podem modificar a entrada ativa da sessão.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitindo `/stop`; isso faz parte do ciclo de vida do cancelamento/comando,
não é uma barreira de finalização do agente. Plugins que precisam inspecionar uma
resposta final natural e solicitar mais uma passagem ao agente devem usar o hook tipado
de plugin `before_agent_finalize`. Consulte [Hooks de plugin](/pt-BR/plugins/hooks).

**Eventos do ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e é disparado quando o encerramento do Gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas só é disparado quando o encerramento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o encerramento, a espera de cada hook do ciclo de vida é executada em melhor esforço e tem duração limitada, para que o encerramento continue caso um manipulador fique bloqueado. O limite de espera padrão é de 5 segundos para `gateway:shutdown` e 10 segundos para `gateway:pre-restart`.

Use `gateway:pre-restart` para avisos curtos de reinicialização enquanto os canais ainda estiverem disponíveis:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Entre o evento `gateway:shutdown` (ou `gateway:pre-restart`) e o restante da sequência de encerramento, o Gateway também dispara um hook tipado de plugin `session_end` para cada sessão que ainda estava ativa quando o processo foi interrompido. O `reason` do evento é `shutdown` para uma interrupção comum por SIGTERM/SIGINT e `restart` quando o fechamento foi agendado como parte de uma reinicialização esperada. Essa drenagem tem duração limitada para que um manipulador `session_end` lento não bloqueie a saída do processo, e as sessões que já foram finalizadas por substituição / redefinição / exclusão / Compaction são ignoradas para evitar disparos duplicados.

## Descoberta de hooks

Os hooks são descobertos em quatro fontes:

1. **Hooks incluídos**: distribuídos com o OpenClaw
2. **Hooks de plugin**: incluídos nos plugins instalados; podem substituir hooks incluídos com o mesmo nome
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário e compartilhados entre espaços de trabalho); podem substituir hooks incluídos e hooks de plugins. Diretórios adicionais de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Hooks do espaço de trabalho**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem habilitados explicitamente)

Hooks do espaço de trabalho podem adicionar novos nomes de hooks, mas não podem substituir hooks incluídos, gerenciados ou fornecidos por plugins que tenham o mesmo nome.

O Gateway ignora a descoberta de hooks internos durante a inicialização até que eles sejam configurados. Habilite um hook incluído ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de hooks ou defina `hooks.internal.enabled=true` para aceitar esse comportamento. Quando você habilita um hook específico, o Gateway carrega somente o manipulador desse hook; `hooks.internal.enabled=true`, diretórios adicionais de hooks e manipuladores legados habilitam a descoberta ampla.

### Pacotes de hooks

Pacotes de hooks são pacotes npm que exportam hooks por meio de `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

As especificações npm aceitam apenas o registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Os comandos antigos `openclaw hooks install` e `openclaw hooks update` são aliases obsoletos de `openclaw plugins install` / `openclaw plugins update`.

## Hooks incluídos

| Hook                  | Eventos                                           | O que faz                                                                 |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão em `<workspace>/memory/`                        |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos adicionais de inicialização com base em padrões glob      |
| command-logger        | `command`                                         | Registra todos os comandos em `~/.openclaw/logs/commands.log`              |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa/termina |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` quando o Gateway é iniciado                              |

Ative qualquer hook incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas mensagens do usuário/assistente (15 por padrão, configurável com `hooks.internal.entries.session-memory.messages`) e as salva em `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando a data local do host. A captura da memória é executada em segundo plano para que as confirmações de `/new` e `/reset` não sejam atrasadas pela leitura da transcrição ou pela geração opcional de slugs. Defina `hooks.internal.entries.session-memory.llmSlug: true` para gerar slugs descritivos para os nomes dos arquivos e, opcionalmente, defina `hooks.internal.entries.session-memory.model` como um alias configurado, como `sonnet`, um ID de modelo simples no provedor padrão do agente ou uma referência `provider/model`. A geração de slugs usa o modelo padrão do agente quando `model` é omitido e recorre a slugs baseados em carimbo de data e hora quando ele não está disponível. Requer que `workspace.dir` esteja configurado.

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

`patterns` e `files` são aceitos como aliases de `paths`. Os caminhos são resolvidos em relação ao espaço de trabalho e devem permanecer dentro dele. Somente nomes-base de inicialização reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra cada comando com barra como uma linha JSON (carimbo de data e hora, ação, chave da sessão, ID do remetente, origem) em `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalhes de compaction-notifier

Envia mensagens curtas de status para a conversa atual quando o OpenClaw começa e termina de compactar a transcrição da sessão. Isso torna interações longas menos confusas nas interfaces de chat, pois o usuário pode ver que o assistente está resumindo o contexto e continuará após a compactação.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` na inicialização do Gateway para cada escopo de agente configurado, caso o arquivo exista no espaço de trabalho resolvido desse agente.

## Hooks de Plugin

Os Plugins podem registrar hooks tipados por meio do SDK de Plugin para uma integração mais profunda:
interceptar chamadas de ferramentas, modificar prompts, controlar o fluxo de mensagens e muito mais.
Use hooks de Plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks de ciclo de vida em processo.

Hooks internos gerenciados por Plugins são diferentes: eles participam do sistema
de eventos gerais de comandos/ciclo de vida desta página e aparecem em `openclaw hooks list` como
`plugin:<id>`. Use-os para efeitos colaterais e compatibilidade com pacotes de hooks, não
como middleware ordenado nem como pontos de controle de políticas.

Para consultar a referência completa de hooks de Plugin, veja [Hooks de Plugin](/pt-BR/plugins/hooks).

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

Os valores de ambiente específicos de cada hook satisfazem as verificações de elegibilidade `requires.env` do hook (junto com o ambiente do processo), e os manipuladores podem lê-los na entrada de configuração do hook:

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

Diretórios adicionais de hooks:

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
O formato legado de configuração da matriz `hooks.internal.handlers` ainda é compatível com versões anteriores, mas novos hooks devem usar o sistema baseado em descoberta.
</Note>

## Referência da CLI

```bash
# Listar todos os hooks (adicione --eligible, --verbose ou --json)
openclaw hooks list

# Mostrar informações detalhadas sobre um hook
openclaw hooks info <hook-name>

# Mostrar resumo de elegibilidade
openclaw hooks check

# Ativar/desativar
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Práticas recomendadas

- **Mantenha os manipuladores rápidos.** Os hooks são executados durante o processamento dos comandos. Execute tarefas pesadas sem aguardar o resultado com `void processInBackground(event)`.
- **Trate erros de forma adequada.** Envolva operações arriscadas em try/catch; não lance erros, para que outros manipuladores possam ser executados.
- **Filtre os eventos antecipadamente.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` a `"events": ["command"]` para reduzir a sobrecarga.

## Solução de problemas

### Hook não descoberto

```bash
# Verificar a estrutura do diretório
ls -la ~/.openclaw/hooks/my-hook/
# Deve mostrar: HOOK.md, handler.ts

# Listar todos os hooks descobertos
openclaw hooks list
```

### Hook não elegível

```bash
openclaw hooks info my-hook
```

Verifique se há binários ausentes (PATH), variáveis de ambiente, valores de configuração ou incompatibilidade com o sistema operacional.

### Hook não executado

1. Verifique se o hook está ativado: `openclaw hooks list`
2. Reinicie o processo do Gateway para recarregar os hooks.
3. Verifique os logs do Gateway: `openclaw logs --follow | grep -i hook`

## Relacionados

- [Referência da CLI: hooks](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/pt-BR/plugins/hooks) — hooks de ciclo de vida do Plugin em processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
