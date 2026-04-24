---
read_when:
    - Você quer o loop local de desenvolvimento mais rápido (bun + watch)
    - Você encontrou problemas de instalação/patch/script de ciclo de vida com Bun
summary: 'Fluxo de trabalho com Bun (experimental): instalações e pegadinhas vs pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-04-24T05:56:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
O Bun **não é recomendado para runtime de gateway** (problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

O Bun é um runtime local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo o `pnpm`, que tem suporte completo e é usado pelas ferramentas de documentação. O Bun não pode usar `pnpm-lock.yaml` e irá ignorá-lo.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` estão em `.gitignore`, então não há ruído no repositório. Para pular completamente gravações de lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build e testes">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de ciclo de vida

O Bun bloqueia scripts de ciclo de vida de dependências, a menos que eles sejam explicitamente confiáveis. Para este repositório, os scripts mais comumente bloqueados não são necessários:

- `@whiskeysockets/baileys` `preinstall` -- verifica se a versão principal do Node é >= 20 (o OpenClaw usa Node 24 por padrão e ainda oferece suporte ao Node 22 LTS, atualmente `22.14+`)
- `protobufjs` `postinstall` -- emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build)

Se você encontrar um problema de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Observações

Alguns scripts ainda usam pnpm fixamente (por exemplo `docs:build`, `ui:*`, `protocol:check`). Por enquanto, execute esses via pnpm.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualizando](/pt-BR/install/updating)
