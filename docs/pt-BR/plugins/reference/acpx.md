---
read_when:
    - Você está instalando, configurando ou auditando o plugin acpx
summary: Backend de runtime ACP do OpenClaw com gerenciamento de sessão e transporte pelo plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T12:45:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend de runtime ACP do OpenClaw com gerenciamento de sessões e transporte pelo próprio plugin.

## Distribuição

- Pacote: `@openclaw/acpx`
- Método de instalação: npm; ClawHub

## Superfície

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Sessões nativas do Pi

O runtime incluído detecta automaticamente o armazenamento de sessões do Pi no Gateway e nos
nós emparelhados. As sessões armazenadas aparecem no grupo **Pi** da barra lateral de sessões, com
navegação somente leitura pelas transcrições no formato de sessão JSONL documentado pelo Pi. O
catálogo reconhece os diretórios de sessão globais e do projeto `settings.json`, além de
`PI_CODING_AGENT_DIR` e `PI_CODING_AGENT_SESSION_DIR`. Os caminhos relativos são resolvidos
a partir do diretório que contém o arquivo `settings.json` correspondente.

Desative **Pi Session Catalog** em **Config > Plugins > ACPX Runtime** para
desabilitar a descoberta. Ela vem habilitada por padrão.

<!-- openclaw-plugin-reference:manual-end -->

## Documentação relacionada

- [acpx](/pt-BR/tools/acp-agents-setup)
