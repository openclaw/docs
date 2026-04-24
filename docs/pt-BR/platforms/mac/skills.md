---
read_when:
    - Atualizando a UI de configurações de Skills no macOS
    - Alterando a restrição ou o comportamento de instalação de Skills
summary: UI de configurações de Skills no macOS e status respaldado pelo gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-24T06:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

O app macOS expõe Skills do OpenClaw via gateway; ele não analisa Skills localmente.

## Fonte de dados

- `skills.status` (gateway) retorna todas as Skills mais elegibilidade e requisitos ausentes
  (incluindo bloqueios por allowlist para Skills integradas).
- Os requisitos são derivados de `metadata.openclaw.requires` em cada `SKILL.md`.

## Ações de instalação

- `metadata.openclaw.install` define opções de instalação (brew/node/go/uv).
- O app chama `skills.install` para executar instaladores no host do gateway.
- Achados `critical` integrados de código perigoso bloqueiam `skills.install` por padrão; achados suspeitos ainda apenas geram aviso. A substituição perigosa existe na solicitação do gateway, mas o fluxo padrão do app continua falhando de forma fechada.
- Se toda opção de instalação for `download`, o gateway expõe todas as opções
  de download.
- Caso contrário, o gateway escolhe um instalador preferido usando as preferências
  atuais de instalação e os binários do host: Homebrew primeiro quando
  `skills.install.preferBrew` está ativado e `brew` existe, depois `uv`, depois o
  gerenciador de node configurado em `skills.install.nodeManager`, depois
  fallbacks posteriores como `go` ou `download`.
- Os rótulos de instalação de Node refletem o gerenciador de node configurado, incluindo `yarn`.

## Env/chaves de API

- O app armazena chaves em `~/.openclaw/openclaw.json` em `skills.entries.<skillKey>`.
- `skills.update` corrige `enabled`, `apiKey` e `env`.

## Modo remoto

- Instalação + atualizações de configuração acontecem no host do gateway (não no Mac local).

## Relacionado

- [Skills](/pt-BR/tools/skills)
- [app macOS](/pt-BR/platforms/macos)
