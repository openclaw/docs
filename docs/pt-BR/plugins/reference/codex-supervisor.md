---
read_when:
    - Você está instalando, configurando ou auditando o plugin codex-supervisor
summary: Supervisione sessões do servidor de aplicativo do Codex a partir do OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T17:51:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin Codex Supervisor

Supervisione sessões do servidor de aplicativo Codex pelo OpenClaw.

## Distribuição

- Pacote: `@openclaw/codex-supervisor`
- Rota de instalação: incluído no OpenClaw

## Superfície

contratos: ferramentas

<!-- openclaw-plugin-reference:manual-start -->

## Listagem de sessões

`codex_sessions_list` usa por padrão apenas sessões Codex carregadas. Defina `include_stored` para incluir o histórico armazenado; o plugin usa o caminho de listagem apenas do banco de dados de estado do servidor de aplicativo Codex e limita os resultados armazenados a 200 por padrão. Passe `max_stored_sessions` para reduzir ou aumentar esse limite, até 1000.

<!-- openclaw-plugin-reference:manual-end -->
