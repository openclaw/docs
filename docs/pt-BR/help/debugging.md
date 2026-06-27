---
read_when:
    - Você precisa inspecionar a saída bruta do modelo para verificar vazamento de raciocínio
    - Você quer executar o Gateway em modo de observação enquanto itera
    - Você precisa de um fluxo de trabalho de depuração repetível
summary: 'Ferramentas de depuração: modo de observação, fluxos brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-06-27T17:35:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Auxiliares de depuração para saída de streaming, especialmente quando um provedor mistura raciocínio ao texto normal.

## Substituições de depuração em runtime

Use `/debug` no chat para definir substituições de configuração **somente em runtime** (memória, não disco).
`/debug` é desativado por padrão; habilite com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração em disco.

## Saída de rastreamento de sessão

Use `/trace` quando quiser ver linhas de rastreamento/depuração pertencentes ao Plugin em uma sessão
sem ativar o modo verboso completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de Plugin, como resumos de depuração de Active Memory.
Continue usando `/verbose` para saída verbosa normal de status/ferramentas, e continue usando
`/debug` para substituições de configuração somente em runtime.

## Rastreamento de ciclo de vida do Plugin

Use `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando comandos de ciclo de vida de Plugin parecerem lentos
e você precisar de uma decomposição de fases integrada para metadados de Plugin, descoberta, registro,
espelho de runtime, mutação de configuração e trabalho de atualização. O rastreamento é opcional e escreve
em stderr, então a saída JSON do comando continua analisável.

Exemplo:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Saída de exemplo:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Use isso para investigação de ciclo de vida de Plugin antes de recorrer a um profiler de CPU.
Se o comando estiver sendo executado a partir de um checkout de código-fonte, prefira medir o runtime
compilado com `node dist/entry.js ...` após `pnpm build`; `pnpm openclaw ...`
também mede a sobrecarga do executor de código-fonte.

## Inicialização da CLI e criação de perfil de comandos

Use o benchmark de inicialização versionado quando um comando parecer lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para criação de perfil pontual pelo executor de código-fonte normal, defina
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

O executor de código-fonte adiciona flags de perfil de CPU do Node e grava um `.cpuprofile` para o
comando. Use isso antes de adicionar instrumentação temporária ao código do comando.

Para travamentos de inicialização que parecem trabalho síncrono de sistema de arquivos ou carregador de módulos,
adicione a flag de rastreamento de E/S síncrona do Node pelo executor de código-fonte:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deixa essa flag desativada por padrão para o filho Gateway
monitorado. Defina `OPENCLAW_TRACE_SYNC_IO=1` quando você quiser explicitamente a saída de rastreamento
de E/S síncrona do Node no modo watch.

## Modo watch do Gateway

Para iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Por padrão, isso inicia ou reinicia uma sessão tmux chamada
`openclaw-gateway-watch-main` (ou uma variante específica de perfil/porta, como
`openclaw-gateway-watch-dev-19001`) e anexa automaticamente a partir de terminais interativos.
Shells não interativos, CI e chamadas de execução de agentes permanecem desanexados e imprimem
instruções de anexação em vez disso. Anexe manualmente quando necessário:

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

Desative a anexação automática mantendo o gerenciamento do tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Crie perfil do tempo de CPU do Gateway monitorado ao depurar pontos críticos de inicialização/runtime:

```bash
pnpm gateway:watch --benchmark
```

O wrapper de watch consome `--benchmark` antes de invocar o Gateway e grava
um `.cpuprofile` V8 por saída de filho Gateway em
`.artifacts/gateway-watch-profiles/`. Pare ou reinicie o gateway monitorado para
liberar o perfil atual, depois abra-o com Chrome DevTools ou Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Use `--benchmark-dir <path>` quando quiser perfis em outro lugar.
Use `--benchmark-no-force` quando quiser que o filho submetido a benchmark ignore a
limpeza de porta padrão `--force` e falhe rápido se a porta do Gateway já estiver em
uso.
O modo benchmark suprime spam de rastreamento de E/S síncrona por padrão. Defina
`OPENCLAW_TRACE_SYNC_IO=1` com `--benchmark` quando quiser explicitamente perfis de CPU
e rastreamentos de pilha de E/S síncrona do Node. No modo benchmark, esses blocos de rastreamento
são gravados em `gateway-watch-output.log` sob o diretório de benchmark e
filtrados do painel do terminal; logs normais do Gateway permanecem visíveis.

O wrapper tmux carrega seletores comuns de runtime não secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS` para dentro do painel. Coloque
credenciais de provedor no seu perfil/configuração normal ou use o modo bruto em primeiro plano
para segredos efêmeros pontuais.
Se o Gateway monitorado sair durante a inicialização, o observador executa
`openclaw doctor --fix --non-interactive` uma vez e reinicia o filho Gateway.
Use `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` quando quiser a falha original de inicialização
sem a etapa de reparo exclusiva de desenvolvimento.
O painel tmux gerenciado também usa por padrão logs coloridos do Gateway para legibilidade;
defina `FORCE_COLOR=0` ao iniciar `pnpm gateway:watch` para desativar a saída ANSI.

O observador reinicia em arquivos relevantes para build sob `src/`, arquivos de código-fonte de extensão,
metadados `package.json` e `openclaw.plugin.json` de extensão, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações em metadados de extensão reiniciam o
gateway sem forçar um rebuild `tsdown`; alterações de código-fonte e configuração ainda
reconstroem `dist` primeiro.

Adicione quaisquer flags da CLI do gateway após `gateway:watch` e elas serão repassadas em
cada reinicialização. Executar novamente o mesmo comando de watch recria o painel tmux nomeado, e
o observador bruto ainda mantém seu bloqueio de observador único para que pais observadores duplicados
sejam substituídos em vez de se acumularem.

## Perfil dev + gateway dev (--dev)

Use o perfil dev para isolar o estado e iniciar uma configuração segura e descartável para
depuração. Há **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define a porta padrão do gateway como `19001` (portas derivadas mudam junto com ela).
- **`gateway --dev`: informa ao Gateway para criar automaticamente uma configuração +
  workspace padrão** quando ausentes (e ignorar BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas mudam conforme necessário)

2. **Bootstrap dev** (`gateway --dev`)
   - Grava uma configuração mínima se ausente (`gateway.mode=local`, bind loopback).
   - Define `agent.workspace` para o workspace dev.
   - Define `agent.skipBootstrap=true` (sem BOOTSTRAP.md).
   - Inicializa os arquivos do workspace se ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3-PO** (droide de protocolo).
   - Ignora provedores de canal no modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de redefinição (início limpo):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` é uma flag de perfil **global** e é consumida por alguns executores. Se você precisar explicitá-la, use a forma de variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` apaga configuração, credenciais, sessões e o workspace dev (usando
`trash`, não `rm`), depois recria a configuração dev padrão.

<Tip>
Se um gateway não dev já estiver em execução (launchd ou systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream bruto (OpenClaw)

OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor maneira de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de pensamento separados).

Habilite via CLI:

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

## Registro de chunks OpenAI compatíveis brutos

Para capturar **chunks OpenAI compatíveis brutos** antes que sejam analisados em blocos,
habilite o registrador de transporte:

```bash
OPENCLAW_RAW_STREAM=1
```

Caminho opcional:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Arquivo padrão:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Notas de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha os logs locais e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII primeiro.

## Depuração no VSCode

Source maps são necessários para habilitar a depuração em IDEs baseadas em VSCode porque muitos dos arquivos gerados acabam com nomes com hash como parte do processo de build. As configurações `launch.json` incluídas têm como alvo o serviço Gateway, mas podem ser adaptadas rapidamente para outros fins:

1. **Rebuild and Debug Gateway** - Depura o serviço Gateway após criar um novo build
2. **Debug Gateway** - Depura o serviço Gateway de um build preexistente

### Configuração

A configuração padrão **Rebuild and Debug Gateway** é completa, ela excluirá automaticamente a pasta `/dist` e reconstruirá o projeto com depuração habilitada:

1. Abra o painel **Run and Debug** na Activity Bar ou pressione `Ctrl`+`Shift`+`D`
2. Na IDE, certifique-se de que **Rebuild and Debug Gateway** esteja selecionado no menu suspenso de configuração e então pressione o botão **Start Debugging**

Como alternativa - se preferir gerenciar manualmente os processos de build e depuração:

1. Abra um terminal e habilite source maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. No mesmo terminal, reconstrua o projeto: `pnpm clean:dist && pnpm build`
3. Na IDE, selecione a opção **Debug Gateway** no menu suspenso de configuração **Run and Debug** e então pressione o botão **Start Debugging**

Agora você pode definir breakpoints nos seus arquivos-fonte TypeScript (diretório `src/`) e o depurador mapeará corretamente os breakpoints para o JavaScript compilado via source maps. Você poderá inspecionar variáveis, percorrer o código passo a passo e examinar call stacks conforme esperado.

### Observações

- Se usar a opção **"Rebuild and Debug Gateway"** - cada vez que o depurador for iniciado, ele excluirá completamente a pasta `/dist` e executará um `pnpm build` completo com source maps habilitados antes de iniciar o Gateway
- Se usar a opção **"Debug Gateway"** - sessões de depuração podem ser iniciadas e interrompidas a qualquer momento sem afetar a pasta `/dist`, mas você deve usar um processo de terminal separado tanto para habilitar a depuração quanto para gerenciar o ciclo de build
- Modifique as configurações `launch.json` de `args` para depurar outras seções do projeto
- Se você precisar usar a CLI OpenClaw compilada para outras tarefas (ou seja, `dashboard --no-open` se sua sessão de depuração gerar um novo token de autenticação), poderá executá-la em outro terminal como `node ./openclaw.mjs` ou criar um alias de shell como `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Relacionados

- [Solução de problemas](/pt-BR/help/troubleshooting)
- [Perguntas frequentes](/pt-BR/help/faq)
