---
read_when:
    - Você precisa inspecionar a saída bruta do modelo em busca de vazamento de raciocínio
    - Você quer executar o Gateway em modo de observação enquanto itera
    - Você precisa de um fluxo de trabalho de depuração repetível
summary: 'Ferramentas de depuração: modo de monitoramento, fluxos brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-04-30T09:52:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

Auxiliares de depuração para saída em streaming, especialmente quando um provedor mistura raciocínio ao texto normal.

## Substituições de depuração em tempo de execução

Use `/debug` no chat para definir substituições de configuração **somente em tempo de execução** (memória, não disco).
`/debug` fica desativado por padrão; habilite com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração em disco.

## Saída de rastreamento da sessão

Use `/trace` quando quiser ver linhas de rastreamento/depuração pertencentes ao plugin em uma sessão
sem ativar o modo verboso completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de plugin, como resumos de depuração de Active Memory.
Continue usando `/verbose` para saída normal verbosa de status/ferramentas, e continue usando
`/debug` para substituições de configuração somente em tempo de execução.

## Rastreamento do ciclo de vida do Plugin

Use `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando comandos de ciclo de vida de plugin parecerem lentos
e você precisar de um detalhamento de fases integrado para metadados de plugin, descoberta, registro,
espelho de runtime, mutação de configuração e trabalho de atualização. O rastreamento é opcional e escreve
em stderr, então a saída JSON do comando permanece analisável.

Exemplo:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Exemplo de saída:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Use isso para investigar o ciclo de vida de plugin antes de recorrer a um perfilador de CPU.
Se o comando estiver sendo executado a partir de um checkout do código-fonte, prefira medir o runtime
compilado com `node dist/entry.js ...` após `pnpm build`; `pnpm openclaw ...`
também mede a sobrecarga do executor de código-fonte.

## Temporização temporária de depuração da CLI

O OpenClaw mantém `src/cli/debug-timing.ts` como um pequeno auxiliar para investigação
local. Ele intencionalmente não é conectado à inicialização da CLI, ao roteamento de comandos
ou a qualquer comando por padrão. Use-o apenas enquanto depura um comando lento, depois
remova a importação e os intervalos antes de entregar a alteração de comportamento.

Use isso quando um comando estiver lento e você precisar de um detalhamento rápido de fases antes
de decidir se deve usar um perfilador de CPU ou corrigir um subsistema específico.

### Adicione intervalos temporários

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

- Prefixe nomes de fases temporárias com `debug:`.
- Adicione apenas alguns intervalos em torno das seções suspeitas de lentidão.
- Prefira fases amplas, como `registry`, `auth_store` ou `rows`, em vez de nomes
  de auxiliares.
- Use `time()` para trabalho síncrono e `timeAsync()` para promessas.
- Mantenha stdout limpo. O auxiliar escreve em stderr, então a saída JSON do comando permanece
  analisável.
- Remova importações e intervalos temporários antes de abrir o PR de correção final.
- Inclua a saída de temporização ou um resumo curto na issue ou no PR que explique
  a otimização.

### Execute com saída legível

O modo legível é melhor para depuração ao vivo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Exemplo de saída de uma investigação temporária de `models list`:

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

| Fase                                     |       Tempo | O que significa                                                                                         |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20,3s | O carregamento do repositório de perfis de autenticação é o maior custo e deve ser investigado primeiro. |
| `debug:models:list:ensure_models_json`   |        5,0s | Sincronizar `models.json` é caro o suficiente para inspecionar cache ou condições de salto.             |
| `debug:models:list:load_model_registry`  |        5,9s | A construção do registro e o trabalho de disponibilidade do provedor também são custos relevantes.       |
| `debug:models:list:read_registry_models` |        2,4s | Ler todos os modelos do registro não é gratuito e pode importar para `--all`.                            |
| fases de anexação de linhas              | 3,2s no total | Construir cinco linhas exibidas ainda leva vários segundos, então o caminho de filtragem merece uma análise mais próxima. |
| `debug:models:list:print_model_table`    |         0ms | A renderização não é o gargalo.                                                                         |

Esses achados são suficientes para orientar o próximo patch sem manter código de temporização em
caminhos de produção.

### Execute com saída JSON

Use o modo JSON quando quiser salvar ou comparar dados de temporização:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Cada linha em stderr é um objeto JSON:

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

### Limpe antes de entregar

Antes de abrir o PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

O comando não deve retornar nenhum local de chamada de instrumentação temporária, a menos que o PR
esteja adicionando explicitamente uma superfície permanente de diagnóstico. Para correções normais de desempenho,
mantenha apenas a alteração de comportamento, os testes e uma nota curta com a evidência de temporização.

Para pontos críticos de CPU mais profundos, use perfilamento do Node (`--cpu-prof`) ou um
perfilador externo em vez de adicionar mais wrappers de temporização.

## Modo de observação do Gateway

Para iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Por padrão, isso inicia ou reinicia uma sessão tmux chamada
`openclaw-gateway-watch-main` (ou uma variante específica de perfil/porta, como
`openclaw-gateway-watch-dev-19001`) e anexa automaticamente a partir de terminais interativos.
Shells não interativos, CI e chamadas exec de agentes permanecem desanexados e imprimem instruções
de anexação. Anexe manualmente quando necessário:

```bash
tmux attach -t openclaw-gateway-watch-main
```

O painel tmux executa o observador bruto:

```bash
node scripts/watch-node.mjs gateway --force
```

Use o modo em primeiro plano quando tmux não for desejado:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Desative a anexação automática enquanto mantém o gerenciamento por tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

O wrapper tmux carrega seletores comuns de runtime não secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS` para dentro do painel. Coloque
credenciais de provedores no seu perfil/configuração normal, ou use o modo bruto em primeiro plano
para segredos efêmeros pontuais.

O observador reinicia em arquivos relevantes para build sob `src/`, arquivos de código-fonte de extensões,
metadados `package.json` e `openclaw.plugin.json` de extensões, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações de metadados de extensões reiniciam o
gateway sem forçar uma rebuild de `tsdown`; alterações de código-fonte e configuração ainda
recompilam `dist` primeiro.

Adicione quaisquer flags da CLI do gateway após `gateway:watch` e elas serão repassadas em
cada reinício. Executar novamente o mesmo comando de observação recria o painel tmux nomeado, e
o observador bruto ainda mantém seu bloqueio de observador único para que processos pais duplicados
sejam substituídos em vez de se acumularem.

## Perfil de desenvolvimento + Gateway de desenvolvimento (--dev)

Use o perfil de desenvolvimento para isolar estado e iniciar uma configuração segura e descartável para
depuração. Há **duas** flags `--dev`:

- **`--dev` global (perfil):** isola estado em `~/.openclaw-dev` e
  define por padrão a porta do gateway como `19001` (portas derivadas mudam junto).
- **`gateway --dev`: informa ao Gateway para criar automaticamente uma configuração +
  workspace padrão** quando ausentes (e ignorar BOOTSTRAP.md).

Fluxo recomendado (perfil de desenvolvimento + bootstrap de desenvolvimento):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (navegador/canvas mudam de acordo)

2. **Bootstrap de desenvolvimento** (`gateway --dev`)
   - Grava uma configuração mínima se ausente (`gateway.mode=local`, bind local loopback).
   - Define `agent.workspace` para o workspace de desenvolvimento.
   - Define `agent.skipBootstrap=true` (sem BOOTSTRAP.md).
   - Inicializa os arquivos do workspace se ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Ignora provedores de canais no modo de desenvolvimento (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de redefinição (início limpo):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` é uma flag de perfil **global** e é consumida por alguns executores. Se precisar explicitá-la, use a forma de variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` apaga configuração, credenciais, sessões e o workspace de desenvolvimento (usando
`trash`, não `rm`), depois recria a configuração padrão de desenvolvimento.

<Tip>
Se um gateway que não é de desenvolvimento já estiver em execução (launchd ou systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

</Tip>

## Registro bruto de stream (OpenClaw)

O OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor forma de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de pensamento separados).

Habilite-o via CLI:

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

## Registro de chunks brutos (pi-mono)

Para capturar **chunks brutos compatíveis com OpenAI** antes que eles sejam analisados em blocos,
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

> Observação: isso é emitido apenas por processos que usam o provedor
> `openai-completions` do pi-mono.

## Observações de segurança

- Logs de fluxo bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha os logs locais e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII primeiro.

## Relacionado

- [Solução de problemas](/pt-BR/help/troubleshooting)
- [Perguntas frequentes](/pt-BR/help/faq)
