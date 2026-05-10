---
read_when:
    - Você quer o ciclo de desenvolvimento local mais rápido (bun + watch)
    - Você encontrou problemas com scripts de instalação/patch/ciclo de vida do Bun
summary: 'Fluxo de trabalho com Bun (experimental): instalações e pontos de atenção em comparação com pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-05-10T19:38:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **não é recomendado para o runtime do Gateway** (problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

Bun é um runtime local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo `pnpm`, que é totalmente compatível e usado pelo ferramental da documentação. Bun não consegue usar `pnpm-lock.yaml` e o ignorará.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` estão no gitignore, portanto não há rotatividade no repositório. Para ignorar completamente gravações de lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compilar e testar">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de ciclo de vida

Bun bloqueia scripts de ciclo de vida de dependências, a menos que sejam explicitamente confiáveis. Para este repositório, os scripts comumente bloqueados não são necessários:

- `baileys` `preinstall` -- verifica se a versão principal do Node é >= 20 (OpenClaw usa Node 24 por padrão e ainda oferece suporte ao Node 22 LTS, atualmente `22.16+`)
- `protobufjs` `postinstall` -- emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build)

Se você encontrar um problema de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust baileys protobufjs
```

## Ressalvas

Alguns scripts ainda fixam pnpm diretamente no código (por exemplo, `docs:build`, `ui:*`, `protocol:check`). Execute-os via pnpm por enquanto.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualização](/pt-BR/install/updating)
