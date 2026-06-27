---
read_when:
    - Você quer o ciclo de desenvolvimento local mais rápido (bun + watch)
    - Você encontrou problemas de instalação, patch ou script de ciclo de vida do Bun
summary: 'Fluxo de trabalho com Bun (experimental): instalações e pontos de atenção vs pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-06-27T17:37:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **não é recomendado para o runtime do Gateway** (problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

Bun é um runtime local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo `pnpm`, que tem suporte completo e é usado pelas ferramentas da documentação. Bun não consegue usar `pnpm-lock.yaml` e vai ignorá-lo.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` estão no gitignore, então não há alterações no repo. Para ignorar totalmente gravações de lockfile:

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

Bun bloqueia scripts de ciclo de vida de dependências, a menos que eles sejam explicitamente confiáveis. Para este repo, os scripts comumente bloqueados não são necessários:

- `baileys` `preinstall` -- verifica se a versão principal do Node é >= 20 (OpenClaw usa Node 24 por padrão e ainda oferece suporte ao Node 22 LTS, atualmente `22.19+`)
- `protobufjs` `postinstall` -- emite avisos sobre esquemas de versão incompatíveis (sem artefatos de build)

Se você encontrar um problema de runtime que exija esses scripts, confie neles explicitamente:

```sh
bun pm trust baileys protobufjs
```

## Ressalvas

Alguns scripts ainda têm pnpm fixo no código (por exemplo, `check:docs`, `ui:*`, `protocol:check`). Execute-os via pnpm por enquanto.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualização](/pt-BR/install/updating)
