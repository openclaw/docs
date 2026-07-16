---
read_when:
    - Você quer instalar dependências ou executar scripts de pacote com o Bun
    - Você encontrou problemas com scripts de instalação, patch ou ciclo de vida do Bun
summary: Fluxo de trabalho com Bun para instalações e scripts de pacotes; o Node é necessário em tempo de execução
title: Bun
x-i18n:
    generated_at: "2026-07-16T12:34:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
O Bun não pode executar a CLI nem o Gateway do OpenClaw porque não fornece a API `node:sqlite` necessária. Instale uma versão compatível do Node para todos os comandos de runtime do OpenClaw.
</Warning>

O Bun continua podendo ser usado como instalador opcional de dependências e executor de scripts de pacote. O gerenciador de pacotes padrão continua sendo `pnpm`, que tem suporte completo e é usado pelas ferramentas de documentação. O Bun não pode usar `pnpm-lock.yaml` e o ignora.

## Instalação

<Steps>
  <Step title="Instalar dependências">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` são ignorados pelo Git, portanto não há alterações desnecessárias no repositório. Para ignorar completamente a gravação de arquivos de lock:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compilar e testar">
    ```sh
    bun run build
    bun run vitest run
    ```

    Os comandos que iniciam o próprio OpenClaw ainda devem ser executados por meio do Node.

  </Step>
</Steps>

## Scripts de ciclo de vida

O Bun bloqueia scripts de ciclo de vida de dependências, a menos que sejam explicitamente considerados confiáveis. Neste repositório, os scripts normalmente bloqueados não são necessários:

- `baileys` `preinstall`: verifica se a versão principal do Node é >= 20 (o OpenClaw requer Node 22.22.3+, 24.15+ ou 25.9+, sendo o Node 24 recomendado)
- `protobufjs` `postinstall`: emite avisos sobre esquemas de versão incompatíveis (sem artefatos de compilação)

Se ocorrer um problema de runtime que exija esses scripts, marque-os explicitamente como confiáveis:

```sh
bun pm trust baileys protobufjs
```

## Ressalvas

Alguns scripts de pacote incluem `pnpm` diretamente no código (por exemplo, `check:docs`, `ui:*`, `protocol:check`). Executá-los por meio de `bun run` ainda invoca `pnpm` em um shell, portanto basta executá-los diretamente por meio de `pnpm`.

## Conteúdo relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Node.js](/pt-BR/install/node)
- [Atualização](/pt-BR/install/updating)
