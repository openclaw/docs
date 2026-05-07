---
read_when:
    - Você quer o ciclo local de desenvolvimento mais rápido (bun + watch)
    - Você encontrou problemas com instalação, aplicação de patches ou scripts de ciclo de vida do Bun
summary: 'Fluxo de trabalho com Bun (experimental): instalações e cuidados em comparação com pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-05-07T13:19:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **não é recomendado para runtime do Gateway** (problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

Bun é um runtime local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo `pnpm`, que é totalmente compatível e usado pelas ferramentas de documentação. Bun não consegue usar `pnpm-lock.yaml` e irá ignorá-lo.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` são ignorados pelo git, portanto não há alterações desnecessárias no repositório. Para pular completamente a escrita de lockfile:

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

- `@whiskeysockets/baileys` `preinstall` -- verifica Node major >= 20 (OpenClaw usa Node 24 por padrão e ainda oferece suporte a Node 22 LTS, atualmente `22.16+`)
- `protobufjs` `postinstall` -- emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build)

Se você encontrar um problema de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Ressalvas

Alguns scripts ainda fixam pnpm no código (por exemplo, `docs:build`, `ui:*`, `protocol:check`). Execute-os via pnpm por enquanto.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualização](/pt-BR/install/updating)
