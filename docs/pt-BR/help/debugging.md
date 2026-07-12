---
read_when:
    - Você precisa inspecionar a saída bruta do modelo para verificar vazamento de raciocínio
    - Você deseja executar o Gateway no modo de observação enquanto faz alterações iterativas
    - Você precisa de um fluxo de trabalho de depuração reproduzível
summary: 'Ferramentas de depuração: modo de observação, fluxos brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-07-11T23:58:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Auxiliares de depuração para saída em streaming, iteração do Gateway e criação de perfis de inicialização.

## Substituições de depuração em tempo de execução

`/debug` define substituições de configuração **somente em tempo de execução** (na memória, não no disco). Desativado por padrão; ative com `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as substituições e retorna à configuração armazenada em disco.

## Saída de rastreamento da sessão

`/trace` mostra linhas de rastreamento/depuração pertencentes ao plugin para uma sessão, sem ativar o modo totalmente detalhado. Use-o para diagnósticos de plugins, como resumos de depuração da Active Memory; use `/verbose` para a saída normal de status/ferramentas.

```text
/trace
/trace on
/trace off
```

## Rastreamento do ciclo de vida do Plugin

Defina `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obter uma análise fase a fase de metadados, descoberta, registro, espelho de tempo de execução, mutação de configuração e trabalho de atualização dos plugins. A saída é gravada em stderr, portanto a saída JSON dos comandos permanece analisável.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Use isso antes de recorrer a um criador de perfil de CPU. Em um checkout do código-fonte, meça o tempo de execução compilado com `node dist/entry.js ...` após `pnpm build`; `pnpm openclaw ...` também mede a sobrecarga do executor do código-fonte.

## Inicialização da CLI e criação de perfil de comandos

Benchmarks de inicialização versionados:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para uma criação de perfil pontual pelo executor normal do código-fonte, defina `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

O executor do código-fonte adiciona os sinalizadores de perfil de CPU do Node e grava um arquivo `.cpuprofile` para o comando. Use isso antes de adicionar instrumentação temporária ao código do comando.

Para travamentos na inicialização que pareçam trabalho síncrono do sistema de arquivos ou do carregador de módulos, adicione o sinalizador de rastreamento de E/S síncrona do Node por meio do executor do código-fonte:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` mantém esse sinalizador desativado por padrão para o processo filho monitorado do Gateway; defina `OPENCLAW_TRACE_SYNC_IO=1` quando também quiser a saída de rastreamento de E/S síncrona no modo de monitoramento.

## Modo de monitoramento do Gateway

```bash
pnpm gateway:watch
```

Por padrão, isso inicia ou reinicia uma sessão tmux chamada `openclaw-gateway-watch-<profile>` (por exemplo, `openclaw-gateway-watch-main`), com um sufixo de porta, como `openclaw-gateway-watch-dev-19001`, adicionado somente quando `OPENCLAW_GATEWAY_PORT` difere da porta padrão `18789`. A sessão é anexada automaticamente em terminais interativos; shells não interativos, CI e chamadas de execução de agentes permanecem desanexados e exibem instruções de conexão:

```bash
tmux attach -t openclaw-gateway-watch-main
```

O painel do tmux executa o monitor bruto:

```bash
node scripts/watch-node.mjs gateway --force
```

Interrompa um serviço do Gateway instalado antes de monitorar a mesma porta:

```bash
pnpm openclaw gateway stop
```

O `--force` do monitor libera o listener atual, mas não desativa um serviço supervisionado. Caso contrário, um serviço launchd, systemd ou Scheduled Task pode reiniciar e substituir o Gateway monitorado.

Modo em primeiro plano sem tmux:

```bash
pnpm gateway:watch:raw
# ou
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Mantenha o gerenciamento pelo tmux, mas desative a conexão automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Crie um perfil do tempo de CPU do Gateway monitorado ao depurar pontos críticos de inicialização/tempo de execução:

```bash
pnpm gateway:watch --benchmark
```

O wrapper de monitoramento consome `--benchmark` antes de invocar o Gateway e grava um arquivo V8 `.cpuprofile` por encerramento de processo filho do Gateway em `.artifacts/gateway-watch-profiles/`. Interrompa ou reinicie o gateway monitorado para descarregar o perfil atual e depois abra-o com o Chrome DevTools ou o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: grava os perfis em outro local.
- `--benchmark-no-force`: ignora a limpeza padrão da porta feita por `--force` e falha imediatamente se a porta do Gateway já estiver em uso.

Por padrão, o modo de benchmark suprime o excesso de rastreamentos de E/S síncrona. Defina `OPENCLAW_TRACE_SYNC_IO=1` com `--benchmark` para obter tanto os perfis de CPU quanto os rastreamentos de pilha de E/S síncrona; no modo de benchmark, esses blocos de rastreamento são gravados em `gateway-watch-output.log` no diretório do benchmark (filtrados do painel do terminal), enquanto os logs normais do Gateway permanecem visíveis.

O wrapper do tmux transfere seletores comuns e não secretos do tempo de execução para o painel, incluindo `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Coloque as credenciais do provedor no seu perfil/configuração normal ou use o modo bruto em primeiro plano para segredos efêmeros pontuais.

Se o Gateway monitorado encerrar durante a inicialização, o monitor executará `openclaw doctor --fix --non-interactive` uma vez e reiniciará o processo filho do Gateway. Defina `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver a falha de inicialização original sem a etapa de reparo exclusiva para desenvolvimento.

Por padrão, o painel tmux gerenciado exibe logs coloridos do Gateway; defina `FORCE_COLOR=0` ao iniciar `pnpm gateway:watch` para desativar a saída ANSI.

O monitor reinicia quando há alterações em arquivos relevantes para a compilação em `src/`, arquivos-fonte de extensões, metadados `package.json` e `openclaw.plugin.json` das extensões, `tsconfig.json`, `package.json` e `tsdown.config.ts`. Alterações nos metadados das extensões reiniciam o gateway sem forçar uma recompilação; alterações no código-fonte e na configuração ainda recompilam `dist` primeiro.

Adicione sinalizadores da CLI do gateway após `gateway:watch`, e eles serão repassados a cada reinicialização. Executar novamente o mesmo comando de monitoramento recria o painel tmux nomeado; o monitor bruto mantém um bloqueio de monitor único para que processos-pai de monitoramento duplicados sejam substituídos em vez de se acumularem.

## Perfil de desenvolvimento + gateway de desenvolvimento (--dev)

Dois sinalizadores `--dev` **separados**:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e define a porta padrão do gateway como `19001` (as portas derivadas mudam junto com ela).
- **`gateway --dev`:** instrui o Gateway a criar automaticamente uma configuração e um espaço de trabalho padrão quando estiverem ausentes (e ignorar o bootstrap).

Fluxo recomendado (perfil de desenvolvimento + bootstrap de desenvolvimento):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sem uma instalação global, execute a CLI por meio de `pnpm openclaw ...`.

O que isso faz:

1. **Isolamento do perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (as portas do navegador/canvas mudam de acordo)

2. **Bootstrap de desenvolvimento** (`gateway --dev`)
   - Grava uma configuração mínima caso esteja ausente (`gateway.mode=local`, vinculação a local loopback).
   - Define `agents.defaults.workspace` como o espaço de trabalho de desenvolvimento e `agents.defaults.skipBootstrap=true`.
   - Cria os arquivos do espaço de trabalho caso estejam ausentes: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidade padrão: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` também define `OPENCLAW_SKIP_CHANNELS=1` para ignorar os provedores de canais.

Fluxo de redefinição (novo começo):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` é um sinalizador de perfil **global** e é consumido por alguns executores. Se precisar especificá-lo explicitamente, use a forma com variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` apaga a configuração, as credenciais, as sessões e o espaço de trabalho de desenvolvimento (movido para a lixeira, não excluído) e depois recria a configuração de desenvolvimento padrão.

<Tip>
Se um gateway que não seja de desenvolvimento já estiver em execução (launchd ou systemd), interrompa-o primeiro:

```bash
openclaw gateway stop
```

</Tip>

## Registro do stream bruto

O OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação. Essa é a melhor maneira de verificar se o raciocínio está chegando como deltas de texto simples (ou como blocos de pensamento separados).

Ative-o por meio da CLI:

```bash
pnpm gateway:watch --raw-stream
```

Substituição opcional do caminho:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variáveis de ambiente equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Arquivo padrão: `~/.openclaw/logs/raw-stream.jsonl`

## Observações de segurança

- Os logs do stream bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha os logs localmente e exclua-os após a depuração.
- Se compartilhar os logs, remova primeiro os segredos e dados de identificação pessoal.

## Depuração no VSCode

Mapas de código-fonte são necessários porque a compilação aplica hashes aos nomes dos arquivos gerados. O `launch.json` incluído tem como alvo o serviço do Gateway:

1. **Rebuild and Debug Gateway** - exclui `/dist` e recompila com a depuração ativada antes de iniciar o Gateway.
2. **Debug Gateway** - depura uma compilação existente sem alterar `/dist`.

### Configuração

1. Abra **Run and Debug** (na Activity Bar ou com `Ctrl`+`Shift`+`D`).
2. Selecione **Rebuild and Debug Gateway** e pressione **Start Debugging**.

Para gerenciar manualmente o ciclo de compilação/depuração:

1. Ative os mapas de código-fonte em um terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Recompile: `pnpm clean:dist && pnpm build`
3. Selecione **Debug Gateway** e pressione **Start Debugging**.

Defina pontos de interrupção nos arquivos TypeScript em `src/`; o depurador os mapeia para o JavaScript compilado por meio dos mapas de código-fonte.

### Observações

- **Rebuild and Debug Gateway** exclui `/dist` e executa um `pnpm build` completo com mapas de código-fonte em cada inicialização.
- **Debug Gateway** pode ser iniciado/interrompido sem afetar `/dist`, mas você gerencia o ciclo de compilação em um terminal separado.
- Edite os `args` de `launch.json` para depurar outros subcomandos da CLI.
- Para usar a CLI compilada em outras tarefas (por exemplo, `dashboard --no-open` caso sua sessão de depuração gere um novo token de autenticação), execute-a em outro terminal: `node ./openclaw.mjs` ou use um alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Relacionados

- [Solução de problemas](/pt-BR/help/troubleshooting)
- [Perguntas frequentes](/pt-BR/help/faq)
