---
read_when:
    - Você está conectando superfícies de uso/cota de provider
    - Você precisa explicar o comportamento do rastreamento de uso ou os requisitos de autenticação
summary: Superfícies de rastreamento de uso e requisitos de credenciais
title: Rastreamento de uso
x-i18n:
    generated_at: "2026-04-24T05:49:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## O que é

- Obtém uso/cota do provider diretamente dos endpoints de uso deles.
- Sem custos estimados; apenas as janelas reportadas pelo provider.
- A saída de status legível para humanos é normalizada para `X% left`, mesmo quando uma
  API upstream reporta cota consumida, cota restante ou apenas contagens brutas.
- `/status` no nível da sessão e `session_status` podem usar como fallback a entrada de uso
  mais recente da transcrição quando o snapshot ativo da sessão estiver esparso. Esse
  fallback preenche contadores ausentes de tokens/cache, pode recuperar o rótulo ativo do
  modelo em runtime e prefere o total maior orientado a prompt quando metadados da sessão
  estiverem ausentes ou forem menores. Valores ativos não zero existentes ainda prevalecem.

## Onde isso aparece

- `/status` nos chats: cartão de status rico em emoji com tokens da sessão + custo estimado (apenas chave de API). O uso do provider aparece para o **provider do modelo atual** quando disponível como uma janela normalizada `X% left`.
- `/usage off|tokens|full` nos chats: rodapé de uso por resposta (OAuth mostra apenas tokens).
- `/usage cost` nos chats: resumo local de custos agregado a partir dos logs de sessão do OpenClaw.
- CLI: `openclaw status --usage` imprime um detalhamento completo por provider.
- CLI: `openclaw channels list` imprime o mesmo snapshot de uso junto com a configuração do provider (use `--no-usage` para ignorar).
- Barra de menus do macOS: seção “Uso” em Context (apenas se disponível).

## Providers + credenciais

- **Anthropic (Claude)**: tokens OAuth em perfis de autenticação.
- **GitHub Copilot**: tokens OAuth em perfis de autenticação.
- **Gemini CLI**: tokens OAuth em perfis de autenticação.
  - O uso em JSON usa `stats` como fallback; `stats.cached` é normalizado para
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth em perfis de autenticação (`accountId` é usado quando presente).
- **MiniMax**: chave de API ou perfil de autenticação OAuth do MiniMax. O OpenClaw trata
  `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota do
  MiniMax, prefere OAuth MiniMax armazenado quando presente e, caso contrário, usa como fallback
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  Os campos brutos `usage_percent` / `usagePercent` do MiniMax significam cota
  **restante**, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando
  presentes.
  - Rótulos de janela do plano de coding vêm de campos de horas/minutos do provider quando
    presentes, depois usam como fallback o intervalo `start_time` / `end_time`.
  - Se o endpoint do plano de coding retornar `model_remains`, o OpenClaw prefere a
    entrada do modelo de chat, deriva o rótulo da janela a partir de timestamps quando
    campos explícitos `window_hours` / `window_minutes` estiverem ausentes e inclui o nome do
    modelo no rótulo do plano.
- **Xiaomi MiMo**: chave de API via env/config/armazenamento de autenticação (`XIAOMI_API_KEY`).
- **z.ai**: chave de API via env/config/armazenamento de autenticação.

O uso fica oculto quando nenhuma autenticação utilizável de uso do provider pode ser resolvida. Providers
podem fornecer lógica de autenticação de uso específica de Plugin; caso contrário, o OpenClaw usa como fallback
a correspondência de credenciais OAuth/chave de API de perfis de autenticação, variáveis de ambiente
ou configuração.

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso e custos de API](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
