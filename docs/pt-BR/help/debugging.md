---
read_when:
    - É necessário inspecionar a saída bruta do modelo em busca de vazamento de raciocínio
    - Você quer executar o Gateway em modo de monitoramento enquanto faz iterações
    - Você precisa de um fluxo de trabalho de depuração repetível
summary: 'Ferramentas de depuração: modo de observação, fluxos brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-05-06T05:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Auxiliares de depuração para saída de streaming, especialmente quando um provedor mistura raciocínio ao texto normal.

## Substituições de depuração em tempo de execução

Use `/debug` no chat para definir substituições de configuração **somente em tempo de execução** (memória, não disco).
`/debug` é desativado por padrão; ative com `commands.debug: true`.
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
sem ativar o modo detalhado completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de plugins, como resumos de depuração de Active Memory.
Continue usando `/verbose` para saída normal detalhada de status/ferramentas e continue usando
`/debug` para substituições de configuração somente em tempo de execução.

## Rastreamento do ciclo de vida do Plugin

Use `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando os comandos de ciclo de vida de plugins parecerem lentos
e você precisar de uma decomposição de fases integrada para metadados de plugins, descoberta, registro,
espelho de tempo de execução, mutação de configuração e trabalho de atualização. O rastreamento é opcional e grava
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

Use isso para investigar o ciclo de vida de plugins antes de recorrer a um profiler de CPU.
Se o comando estiver sendo executado a partir de um checkout de código-fonte, prefira medir o tempo de execução compilado
com `node dist/entry.js ...` após `pnpm build`; `pnpm openclaw ...`
também mede a sobrecarga do executor de código-fonte.

## Inicialização da CLI e criação de perfil de comandos

Use o benchmark de inicialização incluído no repositório quando um comando parecer lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para criação de perfil pontual por meio do executor de código-fonte normal, defina
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

O executor de código-fonte adiciona flags de perfil de CPU do Node e grava um `.cpuprofile` para o
comando. Use isso antes de adicionar instrumentação temporária ao código do comando.

Para travamentos de inicialização que parecem trabalho síncrono de sistema de arquivos ou carregador de módulos,
adicione a flag de rastreamento de E/S síncrona do Node por meio do executor de código-fonte:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` ativa essa flag por padrão para o processo filho observado do Gateway.
Defina `OPENCLAW_TRACE_SYNC_IO=0` para suprimir a saída de rastreamento de E/S síncrona do Node no modo de observação.

## Modo de observação do Gateway

Para iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Por padrão, isso inicia ou reinicia uma sessão tmux chamada
`openclaw-gateway-watch-main` (ou uma variante específica de perfil/porta, como
`openclaw-gateway-watch-dev-19001`) e anexa automaticamente a partir de terminais interativos.
Shells não interativos, CI e chamadas de execução de agentes permanecem desconectados e imprimem instruções
de anexação em vez disso. Anexe manualmente quando necessário:

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

Desative o anexo automático mantendo o gerenciamento do tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Crie perfil do tempo de CPU do Gateway observado ao depurar pontos críticos de inicialização/tempo de execução:

```bash
pnpm gateway:watch --benchmark
```

O wrapper de observação consome `--benchmark` antes de invocar o Gateway e grava
um `.cpuprofile` do V8 por encerramento de processo filho do Gateway em
`.artifacts/gateway-watch-profiles/`. Pare ou reinicie o gateway observado para
liberar o perfil atual, depois abra-o com Chrome DevTools ou Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Use `--benchmark-dir <path>` quando quiser perfis em outro lugar.
Use `--benchmark-no-force` quando quiser que o processo filho em benchmark pule a
limpeza de porta padrão `--force` e falhe rapidamente se a porta do Gateway já estiver em
uso.
O modo benchmark suprime spam de rastreamento de E/S síncrona por padrão. Defina
`OPENCLAW_TRACE_SYNC_IO=1` com `--benchmark` quando quiser explicitamente tanto perfis de CPU
quanto rastreamentos de pilha de E/S síncrona do Node. No modo benchmark, esses blocos de rastreamento
são gravados em `gateway-watch-output.log` no diretório de benchmark e
filtrados do painel do terminal; os logs normais do Gateway continuam visíveis.

O wrapper tmux leva seletores comuns de tempo de execução não secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`, para dentro do painel. Coloque
credenciais de provedores no seu perfil/configuração normal ou use o modo bruto em primeiro plano
para segredos efêmeros pontuais.
Se o Gateway observado sair durante a inicialização, o observador executa
`openclaw doctor --fix --non-interactive` uma vez e reinicia o processo filho do Gateway.
Use `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` quando quiser a falha de inicialização original
sem a passada de reparo somente para desenvolvimento.
O painel tmux gerenciado também usa logs coloridos do Gateway por padrão para legibilidade;
defina `FORCE_COLOR=0` ao iniciar `pnpm gateway:watch` para desativar a saída ANSI.

O observador reinicia em arquivos relevantes para build em `src/`, arquivos-fonte de extensões,
metadados de `package.json` e `openclaw.plugin.json` de extensões, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações de metadados de extensões reiniciam o
gateway sem forçar uma reconstrução de `tsdown`; alterações de código-fonte e configuração ainda
recompilam `dist` primeiro.

Adicione quaisquer flags da CLI do gateway após `gateway:watch` e elas serão repassadas em
cada reinício. Executar novamente o mesmo comando de observação recria o painel tmux nomeado, e
o observador bruto ainda mantém seu bloqueio de observador único, para que processos pais de observadores duplicados
sejam substituídos em vez de se acumularem.

## Perfil de desenvolvimento + gateway de desenvolvimento (--dev)

Use o perfil de desenvolvimento para isolar o estado e iniciar uma configuração segura e descartável para
depuração. Há **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define a porta padrão do gateway como `19001` (portas derivadas mudam junto).
- **`gateway --dev`: diz ao Gateway para criar automaticamente uma configuração padrão +
  workspace** quando ausentes (e pular BOOTSTRAP.md).

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
   - Grava uma configuração mínima se ausente (`gateway.mode=local`, vincular a loopback).
   - Define `agent.workspace` para o workspace de desenvolvimento.
   - Define `agent.skipBootstrap=true` (sem BOOTSTRAP.md).
   - Popula os arquivos do workspace se ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3-PO** (droide de protocolo).
   - Pula provedores de canais no modo de desenvolvimento (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de redefinição (começo do zero):

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
`trash`, não `rm`) e então recria a configuração de desenvolvimento padrão.

<Tip>
Se um gateway que não é de desenvolvimento já estiver em execução (launchd ou systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream bruto (OpenClaw)

OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor forma de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de pensamento separados).

Ative via CLI:

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

Para capturar **chunks brutos compatíveis com OpenAI** antes que sejam analisados em blocos,
pi-mono expõe um logger separado:

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

## Notas de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha logs locais e exclua-os após a depuração.
- Se compartilhar logs, remova segredos e PII primeiro.

## Depuração no VSCode

Mapas de origem são necessários para permitir depuração em IDEs baseadas em VSCode porque muitos dos arquivos gerados acabam com nomes com hash como parte do processo de build. As configurações `launch.json` incluídas miram o serviço Gateway, mas podem ser adaptadas rapidamente para outros fins:

1. **Recompilar e depurar Gateway** - Depura o serviço Gateway após criar um novo build
2. **Depurar Gateway** - Depura o serviço Gateway de um build pré-existente

### Configuração

A configuração padrão **Recompilar e depurar Gateway** vem pronta para uso; ela excluirá automaticamente a pasta `/dist` e reconstruirá o projeto com depuração ativada:

1. Abra o painel **Executar e Depurar** pela Barra de Atividades ou pressione `Ctrl`+`Shift`+`D`
2. Na IDE, garanta que **Recompilar e depurar Gateway** esteja selecionado no menu suspenso de configuração e então pressione o botão **Iniciar Depuração**

Alternativamente, se preferir gerenciar os processos de build e depuração manualmente:

1. Abra um terminal e ative mapas de origem:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. No mesmo terminal, recompile o projeto: `pnpm clean:dist && pnpm build`
3. Na IDE, selecione a opção **Depurar Gateway** no menu suspenso de configuração **Executar e Depurar** e então pressione o botão **Iniciar Depuração**

Agora você pode definir breakpoints nos seus arquivos-fonte TypeScript (diretório `src/`) e o depurador mapeará corretamente os breakpoints para o JavaScript compilado via mapas de origem. Você poderá inspecionar variáveis, avançar pelo código e examinar pilhas de chamadas como esperado.

### Observações

- Se estiver usando a opção **"Recompilar e depurar Gateway"** - cada vez que o depurador for iniciado, ele excluirá completamente a pasta `/dist` e executará um `pnpm build` completo com mapas de origem ativados antes de iniciar o Gateway
- Se estiver usando a opção **"Depurar Gateway"** - sessões de depuração podem ser iniciadas e interrompidas a qualquer momento sem afetar a pasta `/dist`, mas você deve usar um processo de terminal separado tanto para ativar a depuração quanto para gerenciar o ciclo de build
- Modifique as configurações de `launch.json` para `args` para depurar outras seções do projeto
- Se precisar usar a CLI compilada do OpenClaw para outras tarefas (ou seja, `dashboard --no-open` se sua sessão de depuração gerar um novo token de autenticação), você pode executá-la em outro terminal como `node ./openclaw.mjs` ou criar um alias de shell como `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Relacionado

- [Solução de problemas](/pt-BR/help/troubleshooting)
- [Perguntas frequentes](/pt-BR/help/faq)
