---
read_when:
    - Você precisa inspecionar a saída bruta do modelo em busca de vazamento de raciocínio
    - Você quer executar o Gateway em modo watch enquanto itera
    - Você precisa de um fluxo de depuração reproduzível
summary: 'Ferramentas de depuração: modo watch, streams brutos do modelo e rastreamento de vazamento de raciocínio'
title: Depuração
x-i18n:
    generated_at: "2026-04-06T03:07:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bc72e8d6cad3a1acaad066f381c82309583fabf304c589e63885f2685dc704e
    source_path: help/debugging.md
    workflow: 15
---

# Depuração

Esta página cobre auxiliares de depuração para saída em streaming, especialmente quando um
provedor mistura raciocínio no texto normal.

## Sobrescritas de depuração em runtime

Use `/debug` no chat para definir sobrescritas de configuração **somente em runtime** (na memória, não no disco).
`/debug` vem desativado por padrão; ative com `commands.debug: true`.
Isso é útil quando você precisa alternar configurações obscuras sem editar `openclaw.json`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` limpa todas as sobrescritas e retorna à configuração em disco.

## Modo watch do Gateway

Para iteração rápida, execute o gateway sob o observador de arquivos:

```bash
pnpm gateway:watch
```

Isso mapeia para:

```bash
node scripts/watch-node.mjs gateway --force
```

O observador reinicia em arquivos relevantes para build em `src/`, arquivos-fonte de extensões,
metadados de `package.json` e `openclaw.plugin.json` de extensões, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Alterações nos metadados de extensões reiniciam o
gateway sem forçar um rebuild do `tsdown`; alterações em código-fonte e configuração ainda
reconstroem `dist` primeiro.

Adicione quaisquer flags da CLI do gateway após `gateway:watch` e elas serão repassadas a
cada reinício. Executar novamente o mesmo comando watch para o mesmo conjunto de repo/flags agora
substitui o observador anterior em vez de deixar processos pai duplicados do observador para trás.

## Perfil dev + gateway dev (`--dev`)

Use o perfil dev para isolar o estado e iniciar uma configuração segura e descartável para
depuração. Existem **duas** flags `--dev`:

- **Global `--dev` (perfil):** isola o estado em `~/.openclaw-dev` e
  define por padrão a porta do gateway como `19001` (as portas derivadas mudam junto com ela).
- **`gateway --dev`: diz ao Gateway para criar automaticamente uma configuração + workspace padrão**
  quando estiverem ausentes (e ignorar `BOOTSTRAP.md`).

Fluxo recomendado (perfil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se você ainda não tiver uma instalação global, execute a CLI via `pnpm openclaw ...`.

O que isso faz:

1. **Isolamento de perfil** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas mudam de acordo)

2. **Bootstrap dev** (`gateway --dev`)
   - Grava uma configuração mínima se estiver ausente (`gateway.mode=local`, bind loopback).
   - Define `agent.workspace` para o workspace dev.
   - Define `agent.skipBootstrap=true` (sem `BOOTSTRAP.md`).
   - Popula os arquivos do workspace se estiverem ausentes:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidade padrão: **C3‑PO** (droide de protocolo).
   - Ignora provedores de canal no modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Fluxo de reset (recomeço limpo):

```bash
pnpm gateway:dev:reset
```

Observação: `--dev` é uma flag de perfil **global** e é consumida por alguns runners.
Se você precisar explicitá-la, use a forma com variável de ambiente:

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

O OpenClaw pode registrar o **stream bruto do assistente** antes de qualquer filtragem/formatação.
Essa é a melhor maneira de ver se o raciocínio está chegando como deltas de texto simples
(ou como blocos de thinking separados).

Ative via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sobrescrita opcional de caminho:

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
> provedor `openai-completions` do pi-mono.

## Observações de segurança

- Logs de stream bruto podem incluir prompts completos, saída de ferramentas e dados do usuário.
- Mantenha os logs localmente e exclua-os após a depuração.
- Se você compartilhar logs, remova segredos e PII primeiro.
