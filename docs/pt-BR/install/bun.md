---
read_when:
    - Você quer o ciclo de desenvolvimento local mais rápido (bun + watch)
    - Você encontrou problemas com scripts de instalação, patch ou ciclo de vida do Bun
summary: 'Fluxo de trabalho com Bun (experimental): instalação e particularidades em comparação com o pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-07-12T00:02:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun não é recomendado para a execução do Gateway (há problemas conhecidos com WhatsApp e Telegram). Use Node em produção.
</Warning>

Bun é um ambiente de execução local opcional para executar TypeScript diretamente (`bun run ...`, `bun --watch ...`). O gerenciador de pacotes padrão continua sendo o `pnpm`, que tem suporte completo e é usado pelas ferramentas de documentação. O Bun não pode usar o `pnpm-lock.yaml` e o ignora.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` são ignorados pelo Git, portanto não há alterações desnecessárias no repositório. Para evitar completamente a gravação do arquivo de lock:

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

O Bun bloqueia scripts de ciclo de vida das dependências, a menos que sejam explicitamente considerados confiáveis. Neste repositório, os scripts normalmente bloqueados não são necessários:

- `baileys` `preinstall`: verifica se a versão principal do Node é >= 20 (o OpenClaw exige Node 22.19+ ou 23.11+, sendo Node 24 recomendado)
- `protobufjs` `postinstall`: emite avisos sobre esquemas de versão incompatíveis (sem artefatos de compilação)

Se você encontrar um problema de execução que exija esses scripts, marque-os explicitamente como confiáveis:

```sh
bun pm trust baileys protobufjs
```

## Ressalvas

Alguns scripts de pacote usam `pnpm` de forma fixa internamente (por exemplo, `check:docs`, `ui:*`, `protocol:check`). Executá-los por meio de `bun run` ainda invoca o `pnpm` em um shell, portanto execute-os diretamente com `pnpm`.

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualização](/pt-BR/install/updating)
