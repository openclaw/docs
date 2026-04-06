---
read_when:
    - Você quer entender como o memory_search funciona
    - Você quer escolher um provedor de embeddings
    - Você quer ajustar a qualidade da busca
summary: Como o Memory Search encontra notas relevantes usando embeddings e recuperação híbrida
title: Memory Search
x-i18n:
    generated_at: "2026-04-06T03:06:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6541cd702bff41f9a468dad75ea438b70c44db7c65a4b793cbacaf9e583c7e9
    source_path: concepts/memory-search.md
    workflow: 15
---

# Memory Search

`memory_search` encontra notas relevantes nos seus arquivos de memória, mesmo quando a
redação difere do texto original. Ele funciona indexando a memória em pequenos
trechos e pesquisando neles usando embeddings, palavras-chave ou ambos.

## Início rápido

Se você tiver uma chave de API do OpenAI, Gemini, Voyage ou Mistral configurada, o Memory
Search funciona automaticamente. Para definir um provedor explicitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // ou "gemini", "local", "ollama", etc.
      },
    },
  },
}
```

Para embeddings locais sem chave de API, use `provider: "local"` (requer
node-llama-cpp).

## Provedores compatíveis

| Provedor | ID        | Precisa de chave de API | Observações                                           |
| -------- | --------- | ----------------------- | ----------------------------------------------------- |
| OpenAI   | `openai`  | Sim                     | Detectado automaticamente, rápido                     |
| Gemini   | `gemini`  | Sim                     | Suporta indexação de imagem/áudio                     |
| Voyage   | `voyage`  | Sim                     | Detectado automaticamente                             |
| Mistral  | `mistral` | Sim                     | Detectado automaticamente                             |
| Bedrock  | `bedrock` | Não                     | Detectado automaticamente quando a cadeia de credenciais da AWS é resolvida |
| Ollama   | `ollama`  | Não                     | Local, deve ser definido explicitamente               |
| Local    | `local`   | Não                     | Modelo GGUF, download de ~0.6 GB                      |

## Como a busca funciona

O OpenClaw executa dois caminhos de recuperação em paralelo e mescla os resultados:

```mermaid
flowchart LR
    Q["Query"] --> E["Embedding"]
    Q --> T["Tokenize"]
    E --> VS["Vector Search"]
    T --> BM["BM25 Search"]
    VS --> M["Weighted Merge"]
    BM --> M
    M --> R["Top Results"]
```

- **Busca vetorial** encontra notas com significado semelhante ("gateway host" corresponde a
  "a máquina que executa o OpenClaw").
- **Busca por palavra-chave BM25** encontra correspondências exatas (IDs, strings de erro, chaves de
  configuração).

Se apenas um caminho estiver disponível (sem embeddings ou sem FTS), o outro será executado sozinho.

## Melhorando a qualidade da busca

Dois recursos opcionais ajudam quando você tem um grande histórico de notas:

### Decaimento temporal

Notas antigas perdem gradualmente peso no ranking, para que as informações recentes apareçam primeiro.
Com a meia-vida padrão de 30 dias, uma nota do mês passado pontua com 50% do
seu peso original. Arquivos perenes como `MEMORY.md` nunca sofrem decaimento.

<Tip>
Ative o decaimento temporal se o seu agente tiver meses de notas diárias e informações
desatualizadas continuarem superando o contexto recente no ranking.
</Tip>

### MMR (diversidade)

Reduz resultados redundantes. Se cinco notas mencionarem a mesma configuração de roteador, o MMR
garante que os principais resultados cubram tópicos diferentes em vez de se repetirem.

<Tip>
Ative o MMR se o `memory_search` continuar retornando trechos quase duplicados de
notas diárias diferentes.
</Tip>

### Ativar ambos

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## Memória multimodal

Com Gemini Embedding 2, você pode indexar imagens e arquivos de áudio junto com
Markdown. As consultas de busca continuam sendo texto, mas correspondem a conteúdo visual e de áudio.
Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config) para
a configuração.

## Busca na memória de sessão

Opcionalmente, você pode indexar transcrições de sessão para que o `memory_search` possa recuperar
conversas anteriores. Isso é opt-in via
`memorySearch.experimental.sessionMemory`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config) para detalhes.

## Solução de problemas

**Sem resultados?** Execute `openclaw memory status` para verificar o índice. Se estiver vazio, execute
`openclaw memory index --force`.

**Apenas correspondências por palavra-chave?** Seu provedor de embeddings pode não estar configurado. Verifique
`openclaw memory status --deep`.

**Texto CJK não encontrado?** Reconstrua o índice FTS com
`openclaw memory index --force`.

## Leitura adicional

- [Memory](/pt-BR/concepts/memory) -- layout de arquivos, backends, ferramentas
- [referência de configuração de memória](/pt-BR/reference/memory-config) -- todos os parâmetros de configuração
