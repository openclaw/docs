---
read_when:
    - Você precisa inspecionar a saída bruta do modelo para detectar vazamento de raciocínio
    - Você quer executar o Gateway em modo de observação enquanto itera
    - Você precisa de um fluxo de trabalho de depuração repetível
summary: 'Ferramentas de depuração: modo de observação, fluxos brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-05-05T01:47:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Auxiliares de depuração para saída de streaming, especialmente quando um provedor mistura raciocínio ao texto normal.

## Substituições de depuração em runtime

Use `/debug` no chat para definir substituições de configuração **somente em runtime** (memória, não disco).
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

Use `/trace` quando quiser ver linhas de rastreamento/depuração pertencentes ao Plugin em uma sessão
sem ativar o modo detalhado completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de Plugin, como resumos de depuração de Active Memory.
Continue usando `/verbose` para saída detalhada normal de status/ferramentas, e continue usando
`/debug` para substituições de configuração somente em runtime.

## Rastreamento do ciclo de vida do Plugin

Use `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando os comandos de ciclo de vida do Plugin parecerem lentos
e você precisar de uma decomposição de fases integrada para metadados, descoberta, registro,
espelho de runtime, mutação de configuração e trabalho de atualização do Plugin. O rastreamento é opcional e escreve
em stderr, então a saída JSON do comando permanece analisável.

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

Use isso para investigação do ciclo de vida do Plugin antes de recorrer a um criador de perfil de CPU.
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

`pnpm gateway:watch` habilita essa flag por padrão para o filho Gateway observado.
Defina `OPENCLAW_TRACE_SYNC_IO=0` para suprimir a saída de rastreamento de E/S síncrona do Node no modo de observação.

## Modo de observação do Gateway

Para iteração rápida, execute o Gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Por padrão, isso inicia ou reinicia uma sessão tmux chamada
`openclaw-gateway-watch-main` (ou uma variante específica de perfil/porta, como
`openclaw-gateway-watch-dev-19001`) e anexa automaticamente a partir de terminais interativos.
Shells não interativos, CI e chamadas exec de agente permanecem desanexados e imprimem instruções
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
# ou
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Desative a anexação automática mantendo o gerenciamento do tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Crie perfil do tempo de CPU do Gateway observado ao depurar pontos críticos de inicialização/runtime:

```bash
pnpm gateway:watch --benchmark
```

O wrapper de observação consome `--benchmark` antes de invocar o Gateway e grava
um `.cpuprofile` V8 por saída de filho Gateway em
`.artifacts/gateway-watch-profiles/`. Pare ou reinicie o gateway observado para
descarregar o perfil atual, depois abra-o com Chrome DevTools ou Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Use `--benchmark-dir <path>` quando quiser perfis em outro lugar.
Use `--benchmark-no-force` quando quiser que o filho sob benchmark ignore a
limpeza de porta padrão `--force` e falhe rapidamente se a porta do Gateway já estiver em
uso.
O modo benchmark suprime por padrão o excesso de rastreamento de E/S síncrona. Defina
`OPENCLAW_TRACE_SYNC_IO=1` com `--benchmark` quando quiser explicitamente perfis de CPU
e rastreamentos de pilha de E/S síncrona do Node. No modo benchmark, esses blocos de rastreamento
são gravados em `gateway-watch-output.log` no diretório do benchmark e
filtrados do painel do terminal; os logs normais do Gateway continuam visíveis.

O wrapper tmux carrega seletores comuns de runtime não secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`, para dentro do painel. Coloque
credenciais de provedor no seu perfil/configuração normal, ou use o modo bruto em primeiro plano
para segredos efêmeros pontuais.
Se o Gateway observado sair durante a inicialização, o observador executa
`openclaw doctor --fix --non-interactive` uma vez e reinicia o filho Gateway.
Use `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` quando quiser a falha original de inicialização
sem a passagem de reparo exclusiva de desenvolvimento.
O painel tmux gerenciado também usa por padrão logs coloridos do Gateway para legibilidade;
defina `FORCE_COLOR=0` ao iniciar `pnpm gateway:watch` para desativar a saída ANSI.

O observador reinicia em arquivos relevantes para build em `src/`, arquivos de código-fonte de extensão,
metadados `package.json` e `openclaw.plugin.json` de extensão, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações em metadados de extensão reiniciam o
gateway sem forçar uma recompilação `tsdown`; alterações de código-fonte e configuração ainda
recompilam `dist` primeiro.

Adicione quaisquer flags de CLI do gateway após `gateway:watch` e elas serão repassadas em
cada reinicialização. Reexecutar o mesmo comando de observação recria o painel tmux nomeado, e
o observador bruto ainda mantém seu bloqueio de observador único para que pais observadores duplicados
sejam substituídos em vez de se acumularem.

## Perfil de desenvolvimento + gateway de desenvolvimento (--dev)

Use o perfil de desenvolvimento para isolar estado e iniciar uma configuração segura e descartável para
depuração. Há **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define a porta padrão do gateway como `19001` (portas derivadas mudam junto).
- **`gateway --dev`: informa ao Gateway para criar automaticamente uma configuração padrão +
  workspace** quando ausentes (e ignorar BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas mudam de acordo)

2. **Bootstrap de desenvolvimento** (`gateway --dev`)
   - Grava uma configuração mínima se ausente (`gateway.mode=local`, vincula a loopback).
   - Define `agent.workspace` como o workspace de desenvolvimento.
   - Define `agent.skipBootstrap=true` (sem BOOTSTRAP.md).
   - Semeia os arquivos do workspace se ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Ignora provedores de canal no modo de desenvolvimento (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de redefinição (começo limpo):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` é uma flag de perfil **global** e é consumida por alguns executores. Se precisar escrevê-la explicitamente, use a forma de variável de ambiente:

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

## Registro de stream bruto (OpenClaw)

OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Esta é a melhor forma de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de pensamento separados).

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

## Registro de fragmentos brutos (pi-mono)

Para capturar **fragmentos brutos compatíveis com OpenAI** antes que sejam analisados em blocos,
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

> Observação: isso é emitido somente por processos que usam o provedor
> `openai-completions` do pi-mono.

## Notas de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramentas e dados de usuários.
- Mantenha os logs locais e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII primeiro.

## Relacionados

- [Solução de problemas](/pt-BR/help/troubleshooting)
- [Perguntas frequentes](/pt-BR/help/faq)
