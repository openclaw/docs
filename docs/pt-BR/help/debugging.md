---
read_when:
    - Você precisa inspecionar a saída bruta do modelo em busca de vazamento de raciocínio
    - Você quer executar o Gateway em modo watch enquanto itera
    - Você precisa de um fluxo de depuração reproduzível
summary: 'Ferramentas de depuração: modo watch, streams brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-04-12T23:28:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc31ce9b41e92a14c4309f32df569b7050b18024f83280930e53714d3bfcd5cc
    source_path: help/debugging.md
    workflow: 15
---

# Depuração

Esta página cobre helpers de depuração para saída em streaming, especialmente quando um
provider mistura raciocínio em texto normal.

## Sobrescritas de depuração em runtime

Use `/debug` no chat para definir sobrescritas de configuração **somente em runtime** (memória, não disco).
`/debug` vem desabilitado por padrão; habilite com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as sobrescritas e retorna à configuração em disco.

## Saída de trace da sessão

Use `/trace` quando quiser ver linhas de trace/depuração pertencentes ao plugin em uma sessão
sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Use `/trace` para diagnósticos de plugin, como resumos de depuração de Active Memory.
Continue usando `/verbose` para saída normal de status/ferramentas em modo verbose, e continue usando
`/debug` para sobrescritas de configuração somente em runtime.

## Modo watch do Gateway

Para uma iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Isto mapeia para:

```bash
node scripts/watch-node.mjs gateway --force
```

O observador reinicia em arquivos relevantes para build em `src/`, arquivos-fonte de extensões,
metadados de `package.json` e `openclaw.plugin.json` da extensão, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações nos metadados da extensão reiniciam o
gateway sem forçar um rebuild do `tsdown`; alterações de código-fonte e configuração ainda
reconstroem `dist` primeiro.

Adicione quaisquer flags de CLI do gateway após `gateway:watch` e elas serão repassadas a cada
reinício. Executar novamente o mesmo comando watch para o mesmo conjunto de repo/flags agora
substitui o observador mais antigo em vez de deixar processos pais observadores duplicados.

## Perfil dev + gateway dev (`--dev`)

Use o perfil dev para isolar o estado e iniciar uma configuração segura e descartável para
depuração. Existem **duas** flags `--dev`:

- **`--dev` global (perfil):** isola o estado em `~/.openclaw-dev` e
  define por padrão a porta do gateway como `19001` (as portas derivadas mudam junto).
- **`gateway --dev`:** instrui o Gateway a criar automaticamente uma configuração padrão +
  workspace quando ausentes (e pular `BOOTSTRAP.md`).

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
   - Escreve uma configuração mínima se estiver ausente (`gateway.mode=local`, bind loopback).
   - Define `agent.workspace` para o workspace dev.
   - Define `agent.skipBootstrap=true` (sem `BOOTSTRAP.md`).
   - Popula os arquivos do workspace se estiverem ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Pula providers de canal no modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de reset (novo começo):

```bash
pnpm gateway:dev:reset
```

Observação: `--dev` é uma flag de perfil **global** e é consumida por alguns runners.
Se precisar explicitá-la, use a forma com variável de ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` apaga configuração, credenciais, sessões e o workspace dev (usando
`trash`, não `rm`), depois recria a configuração dev padrão.

Dica: se um gateway não dev já estiver em execução (launchd/systemd), pare-o primeiro:

```bash
openclaw gateway stop
```

## Logging de stream bruto (OpenClaw)

O OpenClaw pode registrar o **stream bruto do assistant** antes de qualquer filtragem/formatação.
Esta é a melhor forma de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de thinking separados).

Habilite via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sobrescrita opcional do caminho:

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

Para capturar **chunks brutos compatíveis com OpenAI** antes de serem analisados em blocos,
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
> provider `openai-completions` do pi-mono.

## Observações de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha os logs locais e exclua-os após a depuração.
- Se compartilhar logs, remova segredos e PII primeiro.
