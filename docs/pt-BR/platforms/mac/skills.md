---
read_when:
    - Atualizando a interface de configurações de Skills do macOS
    - Alteração do controle de acesso ou do comportamento de instalação de Skills
summary: Interface de configurações de Skills do macOS e status fornecido pelo Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T00:07:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

O aplicativo para macOS disponibiliza as Skills do OpenClaw por meio do Gateway; ele não analisa as Skills localmente.

## Fonte de dados

- `skills.status` (Gateway) retorna todas as Skills, além da elegibilidade e dos requisitos ausentes, incluindo bloqueios da lista de permissões para Skills incluídas.
- Os requisitos vêm de `metadata.openclaw.requires` em cada `SKILL.md`.

## Ações de instalação

- `metadata.openclaw.install` define as opções de instalação (brew/node/go/uv/download).
- O aplicativo chama `skills.install` para executar os instaladores no host do Gateway.
- A `security.installPolicy` (`enabled`, `targets`, `exec`), controlada pelo operador, pode bloquear instalações de Skills realizadas pelo Gateway antes da execução dos metadados do instalador. A verificação integrada de código perigoso (usada para instalações de Plugins) não está conectada ao fluxo de instalação de Skills.
- Se todas as opções de instalação forem `download`, o Gateway disponibiliza todas as opções de download.
- Caso contrário, o Gateway seleciona um instalador preferencial usando as preferências atuais de instalação (`skills.install.preferBrew`, `skills.install.nodeManager`) e os binários do host: primeiro o Homebrew quando `preferBrew` está habilitado e `brew` está presente; depois `uv`; em seguida, o gerenciador de Node configurado; depois o Homebrew novamente, se disponível (mesmo sem `preferBrew`); em seguida, `go`; e, por fim, `download`.
- Os rótulos de instalação do Node refletem o gerenciador de Node configurado, incluindo `yarn`.

## Variáveis de ambiente/chaves de API

- O aplicativo armazena as chaves em `~/.openclaw/openclaw.json`, em `skills.entries.<skillKey>`.
- `skills.update` atualiza parcialmente `enabled`, `apiKey` e `env`.

## Modo remoto

- As atualizações de instalação e configuração ocorrem no host do Gateway, não no Mac local.

## Conteúdo relacionado

- [Skills](/pt-BR/tools/skills)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
