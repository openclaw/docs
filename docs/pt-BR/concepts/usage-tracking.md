---
read_when:
    - Você está conectando as superfícies de uso/cota dos provedores
    - Você precisa explicar o comportamento de rastreamento de uso ou os requisitos de autenticação
summary: Superfícies de monitoramento de uso e requisitos de credenciais
title: Rastreamento de uso
x-i18n:
    generated_at: "2026-05-02T05:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## O que é

- Obtém o uso/a cota dos provedores diretamente de seus endpoints de uso.
- Sem custos estimados; apenas as janelas relatadas pelo provedor.
- A saída de status legível por humanos é normalizada para `X% left`, mesmo quando uma
  API upstream relata cota consumida, cota restante ou apenas contagens brutas.
- `/status` em nível de sessão e `session_status` podem recorrer à entrada de uso de
  transcrição mais recente quando o snapshot da sessão em tempo real é esparso. Esse
  fallback preenche contadores ausentes de tokens/cache, pode recuperar o rótulo do modelo
  de runtime ativo e prefere o total maior orientado a prompt quando os metadados da sessão
  estão ausentes ou são menores. Valores em tempo real existentes e diferentes de zero ainda prevalecem.

## Onde aparece

- `/status` em chats: cartão de status rico em emojis com tokens da sessão + custo estimado (somente chave de API). O uso do provedor aparece para o **provedor do modelo atual** quando disponível como uma janela normalizada de `X% left`.
- `/usage off|tokens|full` em chats: rodapé de uso por resposta (OAuth mostra apenas tokens).
- `/usage cost` em chats: resumo de custo local agregado dos logs de sessão do OpenClaw.
- CLI: `openclaw status --usage` imprime uma análise completa por provedor.
- CLI: `openclaw channels list` imprime o mesmo snapshot de uso junto com a configuração do provedor (use `--no-usage` para ignorar).
- Barra de menus do macOS: seção “Uso” em Contexto (somente se disponível).

## Provedores + credenciais

- **Anthropic (Claude)**: tokens OAuth em perfis de autenticação.
- **GitHub Copilot**: tokens OAuth em perfis de autenticação.
- **Gemini CLI**: tokens OAuth em perfis de autenticação.
  - O uso em JSON recorre a `stats`; `stats.cached` é normalizado para
    `cacheRead`.
- **OpenAI Codex**: tokens OAuth em perfis de autenticação (`accountId` usado quando presente).
- **MiniMax**: chave de API ou perfil de autenticação OAuth da MiniMax. O OpenClaw trata
  `minimax`, `minimax-cn` e `minimax-portal` como a mesma superfície de cota da MiniMax,
  prefere o OAuth da MiniMax armazenado quando presente e, caso contrário, recorre
  a `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  A sondagem de uso deriva o host do Coding Plan de `models.providers.minimax-portal.baseUrl`
  ou `models.providers.minimax.baseUrl` quando configurado e, caso contrário, usa o
  host da MiniMax CN.
  Os campos brutos `usage_percent` / `usagePercent` da MiniMax significam cota
  **restante**, então o OpenClaw os inverte antes da exibição; campos baseados em contagem prevalecem quando
  presentes.
  - Os rótulos de janela do plano de codificação vêm dos campos de horas/minutos do provedor quando
    presentes; depois recorrem ao intervalo `start_time` / `end_time`.
  - Se o endpoint do plano de codificação retornar `model_remains`, o OpenClaw prefere a
    entrada do modelo de chat, deriva o rótulo da janela a partir dos timestamps quando os campos explícitos
    `window_hours` / `window_minutes` estão ausentes e inclui o nome do modelo
    no rótulo do plano.
- **Xiaomi MiMo**: chave de API via env/config/armazenamento de autenticação (`XIAOMI_API_KEY`).
- **z.ai**: chave de API via env/config/armazenamento de autenticação.

O uso fica oculto quando nenhuma autenticação utilizável de uso do provedor pode ser resolvida. Provedores
podem fornecer lógica de autenticação de uso específica de Plugin; caso contrário, o OpenClaw recorre a
credenciais OAuth/chave de API correspondentes de perfis de autenticação, variáveis de ambiente
ou configuração.

## Relacionados

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso e custos de API](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
