---
read_when:
    - Você quer entender como memory_search funciona
    - Você quer escolher um provedor de embeddings
    - Você quer ajustar a qualidade da busca
summary: Como a busca na memória encontra notas relevantes usando embeddings e recuperação híbrida
title: Pesquisa de memória
x-i18n:
    generated_at: "2026-06-28T22:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32ffb9d996851566eb92b7812c5425f545ecbb5387a0a445686df35a6c8ae143
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` encontra notas relevantes nos seus arquivos de memória, mesmo quando a
redação difere do texto original. Ele funciona indexando a memória em pequenos
blocos e pesquisando neles usando embeddings, palavras-chave ou ambos.

## Início rápido

A pesquisa de memória usa embeddings da OpenAI por padrão. Para usar outro
backend de embedding, defina um provedor explicitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", "openai-compatible", etc.
      },
    },
  },
}
```

Para configurações com vários endpoints e provedores específicos de memória, `provider` também pode
ser uma entrada personalizada de `models.providers.<id>`, como `ollama-5080`, quando esse
provedor define `api: "ollama"` ou outro proprietário de adaptador de embedding de memória.

Para embeddings locais sem chave de API, instale
`@openclaw/llama-cpp-provider` e defina `provider: "local"`. Checkouts de código-fonte
ainda podem exigir aprovação de build nativo: `pnpm approve-builds` e depois
`pnpm rebuild node-llama-cpp`.

Alguns endpoints de embedding compatíveis com OpenAI exigem rótulos assimétricos, como
`input_type: "query"` para pesquisas e `input_type: "document"` ou `"passage"`
para blocos indexados. Configure-os com `memorySearch.queryInputType` e
`memorySearch.documentInputType`; veja a [referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config).

## Provedores compatíveis

| Provedor          | ID                  | Precisa de chave de API | Observações                         |
| ----------------- | ------------------- | ----------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Não                     | Usa a cadeia de credenciais da AWS  |
| DeepInfra         | `deepinfra`         | Sim                     | Padrão: `BAAI/bge-m3`               |
| Gemini            | `gemini`            | Sim                     | Compatível com indexação de imagem/áudio |
| GitHub Copilot    | `github-copilot`    | Não                     | Usa assinatura do Copilot           |
| Local             | `local`             | Não                     | Modelo GGUF, download de ~0,6 GB    |
| Mistral           | `mistral`           | Sim                     |                                     |
| Ollama            | `ollama`            | Não                     | Local/auto-hospedado                |
| OpenAI            | `openai`            | Sim                     | Padrão                              |
| Compatível com OpenAI | `openai-compatible` | Geralmente              | `/v1/embeddings` genérico           |
| Voyage            | `voyage`            | Sim                     |                                     |

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

- **Pesquisa vetorial** encontra notas com significado semelhante ("gateway host" corresponde a
  "the machine running OpenClaw").
- **Pesquisa por palavra-chave BM25** encontra correspondências exatas (IDs, strings de erro, chaves de
  configuração).

Se apenas um caminho estiver disponível, o outro é executado sozinho. O modo intencional somente FTS
(`provider: "none"`) e a seleção automática/padrão de provedor ainda podem usar
classificação lexical quando embeddings não estão disponíveis.

Provedores explícitos de embedding não locais são diferentes. Se você definir
`memorySearch.provider` como um provedor concreto com backend remoto e esse provedor
não estiver disponível em tempo de execução, `memory_search` relatará a memória como indisponível em vez
de usar silenciosamente resultados somente FTS. Isso mantém visível um provedor semântico
configurado quebrado. Defina `provider: "none"` para recuperação deliberada somente FTS ou corrija
a configuração de provedor/autenticação para restaurar a classificação semântica.

## Melhorando a qualidade da pesquisa

Dois recursos opcionais ajudam quando você tem um grande histórico de notas:

### Decaimento temporal

Notas antigas perdem gradualmente peso na classificação para que informações recentes apareçam primeiro.
Com a meia-vida padrão de 30 dias, uma nota do mês passado pontua 50% do
seu peso original. Arquivos perenes como `MEMORY.md` nunca sofrem decaimento.

<Tip>
Ative o decaimento temporal se o seu agente tiver meses de notas diárias e informações
obsoletas continuarem superando o contexto recente na classificação.
</Tip>

### MMR (diversidade)

Reduz resultados redundantes. Se cinco notas mencionarem a mesma configuração de roteador, o MMR
garante que os principais resultados cubram tópicos diferentes em vez de se repetirem.

<Tip>
Ative o MMR se `memory_search` continuar retornando trechos quase duplicados de
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
Markdown. As consultas de pesquisa continuam sendo texto, mas fazem correspondência com conteúdo
visual e de áudio. Veja a [referência de configuração de memória](/pt-BR/reference/memory-config) para
configuração.

## Pesquisa de memória da sessão

Opcionalmente, você pode indexar transcrições de sessões para que `memory_search` possa recuperar
conversas anteriores. Isso é opcional via
`memorySearch.experimental.sessionMemory` e `sources: ["sessions"]`; a lista padrão
de fontes inclui apenas memória. A flag experimental ativa a indexação de transcrições de sessão,
enquanto `sources` controla se blocos de sessão são pesquisados.

Ocorrências de sessão obedecem a `tools.sessions.visibility`: a configuração padrão `tree` apenas
expõe a sessão atual e as sessões que ela gerou. Para recuperar uma sessão não relacionada
despachada pelo gateway do mesmo agente a partir de uma sessão de DM separada, amplie
intencionalmente a visibilidade para `agent`.

Ao usar QMD, também defina `memory.qmd.sessions.enabled: true` para que as transcrições sejam
exportadas para uma coleção QMD. Veja a
[referência de configuração](/pt-BR/reference/memory-config) para detalhes.

## Solução de problemas

**Sem resultados?** Execute `openclaw memory status` para verificar o índice. Se estiver vazio, execute
`openclaw memory index --force`.

**Apenas correspondências por palavra-chave?** Seu provedor de embedding pode não estar configurado. Verifique
`openclaw memory status --deep`.

**Embeddings locais atingem timeout?** `ollama`, `lmstudio` e `local` usam um timeout de lote inline mais longo
por padrão. Se o host for simplesmente lento, defina
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` e execute novamente
`openclaw memory index --force`.

**Texto CJK não encontrado?** Reconstrua o índice FTS com
`openclaw memory index --force`.

## Leitura adicional

- [Active Memory](/pt-BR/concepts/active-memory) -- memória de subagente para sessões de chat interativas
- [Memória](/pt-BR/concepts/memory) -- layout de arquivos, backends, ferramentas
- [referência de configuração de memória](/pt-BR/reference/memory-config) -- todos os controles de configuração

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
