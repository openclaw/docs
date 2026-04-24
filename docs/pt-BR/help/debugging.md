---
read_when:
    - Você precisa inspecionar a saída bruta do modelo em busca de vazamento de reasoning
    - Você quer executar o Gateway em modo watch durante iteração
    - Você precisa de um fluxo de trabalho de depuração reproduzível
summary: 'Ferramentas de depuração: modo watch, streams brutos do modelo e rastreamento de vazamento de reasoning'
title: Depuração
x-i18n:
    generated_at: "2026-04-24T05:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

Esta página cobre auxiliares de depuração para saída em streaming, especialmente quando um
provedor mistura reasoning no texto normal.

## Substituições de depuração em runtime

Use `/debug` no chat para definir substituições de configuração **somente em runtime** (memória, não disco).
`/debug` fica desabilitado por padrão; habilite com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração em disco.

## Saída de trace de sessão

Use `/trace` quando quiser ver linhas de trace/depuração controladas pelo Plugin em uma sessão
sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de Plugin, como resumos de depuração de Active Memory.
Continue usando `/verbose` para saída normal de status/ferramenta em modo detalhado e continue usando
`/debug` para substituições de configuração somente em runtime.

## Temporização temporária de depuração da CLI

O OpenClaw mantém `src/cli/debug-timing.ts` como um pequeno auxiliar para
investigação local. Ele intencionalmente não é conectado à inicialização da CLI, ao roteamento de comandos
nem a nenhum comando por padrão. Use-o apenas enquanto depura um comando lento e então
remova a importação e os spans antes de concluir a alteração de comportamento.

Use isso quando um comando estiver lento e você precisar de uma análise rápida por fase antes de
decidir se deve usar um profiler de CPU ou corrigir um subsistema específico.

### Adicionar spans temporários

Adicione o auxiliar perto do código que você está investigando. Por exemplo, ao depurar
`openclaw models list`, um patch temporário em
`src/commands/models/list.list-command.ts` poderia ficar assim:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Diretrizes:

- Prefixe nomes temporários de fase com `debug:`.
- Adicione apenas alguns spans em torno de seções suspeitas de lentidão.
- Prefira fases amplas como `registry`, `auth_store` ou `rows`, em vez de nomes de helpers.
- Use `time()` para trabalho síncrono e `timeAsync()` para promises.
- Mantenha stdout limpo. O auxiliar grava em stderr, então a saída JSON do comando continua parseável.
- Remova importações e spans temporários antes de abrir o PR final de correção.
- Inclua a saída de temporização ou um breve resumo no issue ou PR que explique a otimização.

### Executar com saída legível

O modo legível é melhor para depuração ao vivo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Saída de exemplo de uma investigação temporária de `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Achados dessa saída:

| Fase                                     |      Tempo | O que significa                                                                                           |
| ---------------------------------------- | ---------: | --------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | O carregamento do store de perfis de autenticação é o maior custo e deve ser investigado primeiro.       |
| `debug:models:list:ensure_models_json`   |       5.0s | A sincronização de `models.json` é cara o bastante para inspecionar cache ou condições de skip.          |
| `debug:models:list:load_model_registry`  |       5.9s | Construção do registro e trabalho de disponibilidade do provedor também têm custo relevante.             |
| `debug:models:list:read_registry_models` |       2.4s | Ler todos os modelos do registro não é gratuito e pode importar para `--all`.                            |
| fases de append de linhas                | 3.2s total | Construir cinco linhas exibidas ainda leva vários segundos, então o caminho de filtragem merece mais atenção. |
| `debug:models:list:print_model_table`    |        0ms | A renderização não é o gargalo.                                                                           |

Esses achados já bastam para orientar o próximo patch sem manter código de temporização
nos caminhos de produção.

### Executar com saída JSON

Use o modo JSON quando quiser salvar ou comparar dados de temporização:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Cada linha de stderr é um objeto JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Limpar antes de concluir

Antes de abrir o PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

O comando não deve retornar nenhum ponto temporário de instrumentação, a menos que o PR
esteja explicitamente adicionando uma superfície permanente de diagnóstico. Para correções normais de desempenho,
mantenha apenas a mudança de comportamento, testes e uma breve observação com a evidência de temporização.

Para hotspots mais profundos de CPU, use profiling do Node (`--cpu-prof`) ou um
profiler externo em vez de adicionar mais wrappers de temporização.

## Modo watch do Gateway

Para iteração rápida, execute o gateway sob o watcher de arquivos:

```bash
pnpm gateway:watch
```

Isso mapeia para:

```bash
node scripts/watch-node.mjs gateway --force
```

O watcher reinicia em arquivos relevantes para build sob `src/`, arquivos de origem de extensões,
metadados `package.json` e `openclaw.plugin.json` de extensões, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações de metadados de extensão reiniciam o
gateway sem forçar um rebuild do `tsdown`; alterações de origem e configuração ainda
reconstroem `dist` primeiro.

Adicione quaisquer flags da CLI do gateway após `gateway:watch` e elas serão repassadas em
cada reinicialização. Executar novamente o mesmo comando watch para o mesmo conjunto de repo/flags agora
substitui o watcher antigo, em vez de deixar watchers duplicados em segundo plano.

## Perfil dev + gateway dev (`--dev`)

Use o perfil dev para isolar estado e iniciar uma configuração segura e descartável para
depuração. Há **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define a porta do gateway por padrão como `19001` (portas derivadas mudam com ela).
- **`gateway --dev`**: faz o Gateway criar automaticamente uma configuração +
  workspace padrão quando estiverem ausentes (e ignora `BOOTSTRAP.md`).

Fluxo recomendado (perfil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se você ainda não tiver uma instalação global, execute a CLI via `pnpm openclaw ...`.

O que isso faz:

1. **Isolamento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas mudam de acordo)

2. **Bootstrap dev** (`gateway --dev`)
   - Grava uma configuração mínima se estiver ausente (`gateway.mode=local`, bind em loopback).
   - Define `agent.workspace` para o workspace dev.
   - Define `agent.skipBootstrap=true` (sem `BOOTSTRAP.md`).
   - Inicializa os arquivos do workspace se estiverem ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Ignora provedores de canal em modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de reset (novo começo):

```bash
pnpm gateway:dev:reset
```

Observação: `--dev` é uma flag de perfil **global** e é consumida por alguns runners.
Se você precisar explicitá-la, use a forma por variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` apaga configuração, credenciais, sessões e o workspace dev (usando
`trash`, não `rm`) e então recria a configuração dev padrão.

Dica: se um gateway não dev já estiver em execução (launchd/systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

## Logging de stream bruto (OpenClaw)

O OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor forma de ver se o reasoning está chegando como deltas de texto simples
(ou como blocos de thinking separados).

Habilite pela CLI:

```bash
pnpm gateway:watch --raw-stream
```

Substituição opcional de caminho:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variáveis de ambiente equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Arquivo padrão:

`~/.openclaw/logs/raw-stream.jsonl`

## Logging de chunks brutos (pi-mono)

Para capturar **chunks brutos compatíveis com OpenAI** antes de serem parseados em blocos,
o pi-mono expõe um logger separado:

```bash
PI_RAW_STREAM=1
```

Caminho opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Arquivo padrão:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Observação: isso só é emitido por processos que usam o
> provedor `openai-completions` do pi-mono.

## Observações de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramenta e dados do usuário.
- Mantenha os logs locais e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII antes.

## Relacionado

- [Solução de problemas](/pt-BR/help/troubleshooting)
- [FAQ](/pt-BR/help/faq)
