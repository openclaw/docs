---
read_when:
    - Você quer o loop de desenvolvimento local mais rápido (bun + watch)
    - Você encontrou problemas com instalação, patches ou scripts de ciclo de vida do Bun
summary: 'Fluxo de trabalho do Bun (experimental): instalações e pontos de atenção em comparação com pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-04-30T09:53:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **não é recomendado para runtime do Gateway** (problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

Bun é um runtime local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo `pnpm`, que tem suporte completo e é usado pelo tooling da documentação. Bun não consegue usar `pnpm-lock.yaml` e vai ignorá-lo.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` são ignorados pelo git, então não há alterações no repositório. Para ignorar completamente a gravação de lockfiles:

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

Bun bloqueia scripts de ciclo de vida de dependências, a menos que eles sejam explicitamente confiáveis. Para este repositório, os scripts comumente bloqueados não são necessários:

- `@whiskeysockets/baileys` `preinstall` -- verifica a versão maior do Node >= 20 (OpenClaw usa Node 24 por padrão e ainda oferece suporte ao Node 22 LTS, atualmente `22.14+`)
- `protobufjs` `postinstall` -- emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build)

Se você encontrar um problema de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Ressalvas

Alguns scripts ainda fixam pnpm (por exemplo, `docs:build`, `ui:*`, `protocol:check`). Execute esses via pnpm por enquanto.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualização](/pt-BR/install/updating)
