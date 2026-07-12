---
read_when:
    - Você precisa encontrar algo discutido em uma sessão anterior
    - Você quer entender a privacidade ou a indexação da pesquisa de sessões
summary: Pesquise transcrições de sessões anteriores e reabra o contexto correspondente
title: Pesquisa de sessões
x-i18n:
    generated_at: "2026-07-12T15:06:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Pesquisa de sessões

`sessions_search` pesquisa o texto do usuário e do assistente em suas próprias sessões anteriores. Cada resultado
inclui uma `sessionKey`, um carimbo de data/hora, uma função e um breve trecho correspondente. Passe a
`sessionKey` retornada para `sessions_history` quando precisar do contexto da conversa.

## Visibilidade e saída

A pesquisa usa as mesmas regras de visibilidade de sessão que `sessions_history`. Os resultados fora da árvore de
sessões visível para o chamador são removidos antes da aplicação dos limites de resultados. Agentes em sandbox permanecem limitados
às sessões que iniciaram quando a visibilidade de sessões iniciadas está habilitada.

Os trechos são editados para ocultar informações sensíveis antes de serem retornados ao modelo. Os resultados também são limitados por quantidade, tamanho dos
trechos e tamanho total da resposta.

## Ciclo de vida do índice

O OpenClaw armazena um índice de texto completo junto às linhas da transcrição no banco de dados SQLite de cada agente.
Novas mensagens do usuário e do assistente são indexadas na mesma transação que as persiste, portanto o
índice nunca fica defasado em relação às conversas em andamento; resultados de ferramentas, blocos de raciocínio e imagens são excluídos.
Somente a ramificação ativa da transcrição pode ser pesquisada.

Transcrições anteriores à criação do índice (por exemplo, sessões importadas por `openclaw doctor`) e
sessões cuja ramificação ativa foi retrocedida são reindexadas por uma reconciliação em segundo plano que começa
na próxima pesquisa. Portanto, uma resposta com `indexing: true` pode estar incompleta; tente novamente após
a conclusão da indexação. A exclusão de uma sessão remove suas entradas do índice na mesma transação.

Atualmente, a pesquisa usa o tokenizador de palavras Unicode do SQLite com remoção de diacríticos. A tokenização por trigramas
para correspondência de substrings em CJK é uma melhoria futura.

## Pesquisa de sessões em comparação com pesquisa de memória

Use `sessions_search` para palavras ou frases exatas das transcrições brutas das sessões. Use
[`memory_search`](/pt-BR/concepts/memory-search) para arquivos de memória persistente e recuperação semântica. O
corpus experimental de memória de sessões é o complemento semântico desta pesquisa exata de transcrições.
