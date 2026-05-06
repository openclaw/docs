---
read_when:
    - Você está integrando as superfícies de uso/cota do provedor
    - Você precisa explicar o comportamento de rastreamento de uso ou os requisitos de autenticação
summary: Superfícies de rastreamento de uso e requisitos de credenciais
title: Rastreamento de uso
x-i18n:
    generated_at: "2026-05-06T05:53:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## O que é

- Obtém o uso/cota do provedor diretamente dos endpoints de uso deles.
- Sem custos estimados; apenas as janelas informadas pelo provedor.
- A saída de status legível por humanos é normalizada para `X% left`, mesmo quando uma
  API upstream informa cota consumida, cota restante ou apenas contagens brutas.
- `/status` no nível da sessão e `session_status` podem recorrer à entrada de uso
  mais recente da transcrição quando o snapshot da sessão ativa está escasso. Esse
  fallback preenche contadores ausentes de tokens/cache, pode recuperar o rótulo do modelo
  de runtime ativo e prefere o total maior orientado a prompt quando os metadados da sessão
  estão ausentes ou são menores. Valores ativos existentes diferentes de zero ainda prevalecem.

## Onde aparece

- `/status` em chats: cartão de status rico em emojis com tokens da sessão + custo estimado (somente chave de API). O uso do provedor aparece para o **provedor do modelo atual** quando disponível como uma janela normalizada `X% left`.
- `/usage off|tokens|full` em chats: rodapé de uso por resposta (OAuth mostra apenas tokens).
- `/usage cost` em chats: resumo de custo local agregado a partir dos logs de sessão do OpenClaw.
- CLI: `openclaw status --usage` imprime um detalhamento completo por provedor.
- CLI: `openclaw channels list` imprime o mesmo snapshot de uso junto da configuração do provedor (use `--no-usage` para ignorar).
- Barra de menus do macOS: seção "Uso" em Contexto (somente se disponível).

## Provedores + credenciais

- **Anthropic (Claude)**: tokens OAuth em perfis de autenticação.
- **GitHub Copilot**: tokens OAuth em perfis de autenticação.
- **Gemini CLI**: tokens OAuth em perfis de autenticação.
  - O uso em JSON recorre a `stats`; `stats.cached` é normalizado em
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth em perfis de autenticação (`accountId` usado quando presente).
- **MiniMax**: chave de API ou perfil de autenticação OAuth da MiniMax. O OpenClaw trata
  `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota da MiniMax,
  prefere o OAuth da MiniMax armazenado quando presente e, caso contrário, recorre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  A sondagem de uso deriva o host do Coding Plan de `models.providers.minimax-portal.baseUrl`
  ou `models.providers.minimax.baseUrl` quando configurado e, caso contrário, usa o
  host CN da MiniMax.
  Os campos brutos `usage_percent` / `usagePercent` da MiniMax significam cota
  **restante**, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando
  presentes.
  - Os rótulos da janela do coding-plan vêm dos campos de horas/minutos do provedor quando
    presentes; depois recorrem ao intervalo `start_time` / `end_time`.
  - Se o endpoint de coding-plan retornar `model_remains`, o OpenClaw prefere a
    entrada do modelo de chat, deriva o rótulo da janela de timestamps quando campos explícitos
    `window_hours` / `window_minutes` estão ausentes e inclui o nome do modelo
    no rótulo do plano.
- **Xiaomi MiMo**: chave de API via env/config/armazenamento de autenticação (`XIAOMI_API_KEY`).
- **z.ai**: chave de API via env/config/armazenamento de autenticação.

O uso fica oculto quando nenhuma autenticação de uso de provedor utilizável pode ser resolvida. Provedores
podem fornecer lógica de autenticação de uso específica do plugin; caso contrário, o OpenClaw recorre a
credenciais OAuth/chave de API correspondentes vindas de perfis de autenticação, variáveis de ambiente
ou configuração.

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso de API e custos](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
