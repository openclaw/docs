---
read_when:
    - Você quer entender como o memory_search funciona
    - Você quer escolher um provedor de embeddings
    - Você quer ajustar a qualidade da busca
summary: Como a busca de memória encontra notas relevantes usando embeddings e recuperação híbrida
title: Busca na memória
x-i18n:
    generated_at: "2026-04-30T09:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c44d90f49a797bda01b9a575928c128a334f89ae14fc3620e65562a866aa9
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` encontra notas relevantes nos seus arquivos de memória, mesmo quando a
formulação difere do texto original. Ele funciona indexando a memória em pequenos
trechos e pesquisando neles usando embeddings, palavras-chave ou ambos.

## Início rápido

Se você tiver uma assinatura do GitHub Copilot, uma chave de API da OpenAI,
Gemini, Voyage ou Mistral configurada, a pesquisa na memória funciona
automaticamente. Para definir um provedor explicitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", etc.
      },
    },
  },
}
```

Para configurações com múltiplos endpoints, `provider` também pode ser uma
entrada personalizada de `models.providers.<id>`, como `ollama-5080`, quando
esse provedor define `api: "ollama"` ou outro proprietário de adaptador de
embedding.

Para embeddings locais sem chave de API, instale o pacote de runtime opcional
`node-llama-cpp` ao lado do OpenClaw e use `provider: "local"`.

Alguns endpoints de embedding compatíveis com OpenAI exigem rótulos assimétricos,
como `input_type: "query"` para pesquisas e `input_type: "document"` ou
`"passage"` para trechos indexados. Configure-os com
`memorySearch.queryInputType` e `memorySearch.documentInputType`; consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config).

## Provedores compatíveis

| Provedor       | ID               | Precisa de chave de API | Notas                                                       |
| -------------- | ---------------- | ----------------------- | ----------------------------------------------------------- |
| Bedrock        | `bedrock`        | Não                     | Detectado automaticamente quando a cadeia de credenciais da AWS é resolvida |
| Gemini         | `gemini`         | Sim                     | Compatível com indexação de imagem/áudio                    |
| GitHub Copilot | `github-copilot` | Não                     | Detectado automaticamente, usa a assinatura do Copilot      |
| Local          | `local`          | Não                     | Modelo GGUF, download de ~0,6 GB                            |
| Mistral        | `mistral`        | Sim                     | Detectado automaticamente                                   |
| Ollama         | `ollama`         | Não                     | Local, deve ser definido explicitamente                     |
| OpenAI         | `openai`         | Sim                     | Detectado automaticamente, rápido                           |
| Voyage         | `voyage`         | Sim                     | Detectado automaticamente                                   |

## Como a pesquisa funciona

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

- **Pesquisa vetorial** encontra notas com significado semelhante ("gateway host"
  corresponde a "the machine running OpenClaw").
- **Pesquisa por palavra-chave BM25** encontra correspondências exatas (IDs,
  strings de erro, chaves de configuração).

Se apenas um caminho estiver disponível (sem embeddings ou sem FTS), o outro será
executado sozinho.

Quando embeddings não estão disponíveis, o OpenClaw ainda usa ranqueamento lexical
sobre resultados de FTS em vez de recorrer apenas à ordenação bruta por
correspondência exata. Esse modo degradado impulsiona trechos com cobertura mais
forte dos termos da consulta e caminhos de arquivo relevantes, o que mantém a
revocação útil mesmo sem `sqlite-vec` ou um provedor de embedding.

## Melhorando a qualidade da pesquisa

Dois recursos opcionais ajudam quando você tem um grande histórico de notas:

### Decaimento temporal

Notas antigas perdem peso de ranqueamento gradualmente para que informações
recentes apareçam primeiro. Com a meia-vida padrão de 30 dias, uma nota do mês
passado pontua com 50% do seu peso original. Arquivos permanentes como
`MEMORY.md` nunca sofrem decaimento.

<Tip>
Ative o decaimento temporal se o seu agente tiver meses de notas diárias e
informações obsoletas continuarem superando o contexto recente no ranqueamento.
</Tip>

### MMR (diversidade)

Reduz resultados redundantes. Se cinco notas mencionarem a mesma configuração de
roteador, o MMR garante que os principais resultados cubram tópicos diferentes
em vez de repetir.

<Tip>
Ative o MMR se `memory_search` continuar retornando snippets quase duplicados de
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

Com o Gemini Embedding 2, você pode indexar imagens e arquivos de áudio junto com
Markdown. As consultas de pesquisa continuam sendo texto, mas correspondem a
conteúdo visual e de áudio. Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config)
para a configuração.

## Pesquisa na memória da sessão

Opcionalmente, você pode indexar transcrições de sessão para que `memory_search`
consiga recordar conversas anteriores. Isso é opcional via
`memorySearch.experimental.sessionMemory`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config) para detalhes.

## Solução de problemas

**Sem resultados?** Execute `openclaw memory status` para verificar o índice. Se
estiver vazio, execute `openclaw memory index --force`.

**Apenas correspondências por palavra-chave?** Seu provedor de embedding pode não
estar configurado. Verifique `openclaw memory status --deep`.

**Embeddings locais expiram?** `ollama`, `lmstudio` e `local` usam um timeout
inline de lote mais longo por padrão. Se o host for simplesmente lento, defina
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` e execute
`openclaw memory index --force` novamente.

**Texto CJK não encontrado?** Reconstrua o índice FTS com
`openclaw memory index --force`.

## Leitura adicional

- [Active Memory](/pt-BR/concepts/active-memory) -- memória de subagente para sessões de chat interativas
- [Memória](/pt-BR/concepts/memory) -- layout de arquivos, backends, ferramentas
- [Referência de configuração de memória](/pt-BR/reference/memory-config) -- todas as opções de configuração

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
