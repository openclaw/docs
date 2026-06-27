---
read_when:
    - Atualizando a interface de configurações de Skills no macOS
    - Alterando o controle de Skills ou o comportamento de instalação
summary: Interface de configurações de Skills do macOS e status apoiado pelo Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

O aplicativo macOS expõe Skills do OpenClaw via Gateway; ele não analisa Skills localmente.

## Fonte de dados

- `skills.status` (Gateway) retorna todas as Skills, além de elegibilidade e requisitos ausentes
  (incluindo bloqueios de lista de permissões para Skills empacotadas).
- Os requisitos são derivados de `metadata.openclaw.requires` em cada `SKILL.md`.

## Ações de instalação

- `metadata.openclaw.install` define opções de instalação (brew/node/go/uv).
- O aplicativo chama `skills.install` para executar instaladores no host do Gateway.
- `security.installPolicy`, controlado pelo operador, pode bloquear instalações de Skills
  respaldadas pelo Gateway antes que os metadados do instalador sejam executados. O bloqueio integrado de código perigoso em tempo de instalação
  não faz parte do fluxo de instalação de Skills.
- Se todas as opções de instalação forem `download`, o Gateway expõe todas as
  opções de download.
- Caso contrário, o Gateway escolhe um instalador preferencial usando as preferências
  de instalação atuais e os binários do host: Homebrew primeiro quando
  `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o
  gerenciador de Node configurado em `skills.install.nodeManager`, e então
  fallbacks posteriores como `go` ou `download`.
- Os rótulos de instalação de Node refletem o gerenciador de Node configurado, incluindo `yarn`.

## Chaves de env/API

- O aplicativo armazena chaves em `~/.openclaw/openclaw.json` sob `skills.entries.<skillKey>`.
- `skills.update` aplica patches a `enabled`, `apiKey` e `env`.

## Modo remoto

- Instalação e atualizações de configuração acontecem no host do Gateway (não no Mac local).

## Relacionado

- [Skills](/pt-BR/tools/skills)
- [aplicativo macOS](/pt-BR/platforms/macos)
