---
read_when:
    - Você está instalando, configurando ou auditando o plugin opencode
summary: Adiciona suporte ao provedor de modelos OpenCode no OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T12:46:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Adiciona suporte ao provedor de modelos OpenCode no OpenClaw.

## Distribuição

- Pacote: `@openclaw/opencode-provider`
- Rota de instalação: incluído no OpenClaw

## Superfície

provedores: `opencode`; contratos: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Sessões nativas

O OpenClaw detecta automaticamente a CLI `opencode` no Gateway e nos nodes emparelhados. As sessões
armazenadas aparecem no grupo de sessões **OpenCode** da barra lateral, com navegação
somente leitura pelas transcrições usando os comandos oficiais `opencode --pure db ... --format json`
e `opencode --pure export`. O ambiente restrito e o modo `--pure`
impedem que a navegação pelo catálogo carregue plugins do projeto ou herde credenciais
não relacionadas do Gateway.

Desative **OpenCode Session Catalog** em **Config > Plugins > OpenCode** para
desabilitar a descoberta. Ela é habilitada por padrão.

<!-- openclaw-plugin-reference:manual-end -->

## Documentação relacionada

- [opencode](/pt-BR/providers/opencode)
