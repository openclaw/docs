---
read_when:
    - Você quer entender o backend de memória padrão
    - Você quer configurar provedores de embeddings ou busca híbrida
summary: O backend de memória padrão baseado em SQLite com busca por palavra-chave, vetorial e híbrida
title: Mecanismo de memória integrado
x-i18n:
    generated_at: "2026-06-27T17:24:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

O mecanismo integrado é o backend de memória padrão. Ele armazena seu índice de memória em
um banco de dados SQLite por agente e não precisa de dependências extras para começar.

## O que ele oferece

- **Busca por palavra-chave** via indexação de texto completo FTS5 (pontuação BM25).
- **Busca vetorial** via embeddings de qualquer provedor compatível.
- **Busca híbrida** que combina ambas para obter os melhores resultados.
- **Suporte a CJK** via tokenização por trigramas para chinês, japonês e coreano.
- **Aceleração sqlite-vec** para consultas vetoriais dentro do banco de dados (opcional).

## Primeiros passos

Por padrão, o mecanismo integrado usa embeddings da OpenAI. Se você já tiver
`OPENAI_API_KEY` ou `models.providers.openai.apiKey` configurado, a busca vetorial
funciona sem configuração extra de memória.

Para definir um provedor explicitamente:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Sem um provedor de embeddings, apenas a busca por palavra-chave fica disponível.

Para forçar embeddings GGUF locais, instale o plugin oficial de provedor llama.cpp
e depois aponte `local.modelPath` para um arquivo GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Provedores de embeddings compatíveis

| Provedor          | ID                  | Observações                         |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Usa a cadeia de credenciais da AWS  |
| DeepInfra         | `deepinfra`         | Padrão: `BAAI/bge-m3`               |
| Gemini            | `gemini`            | Compatível com multimodal (imagem + áudio) |
| GitHub Copilot    | `github-copilot`    | Usa assinatura do Copilot           |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Local/auto-hospedado                |
| OpenAI            | `openai`            | Padrão: `text-embedding-3-small`    |
| Compatível com OpenAI | `openai-compatible` | Endpoint genérico `/v1/embeddings` |
| Voyage            | `voyage`            |                                     |

Defina `memorySearch.provider` para mudar da OpenAI para outro provedor.

## Como a indexação funciona

O OpenClaw indexa `MEMORY.md` e `memory/*.md` em partes (~400 tokens com
sobreposição de 80 tokens) e as armazena em um banco de dados SQLite por agente.

- **Local do índice:** o banco de dados do agente proprietário em
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Manutenção do armazenamento:** os sidecars WAL do SQLite são limitados com checkpoints periódicos e
  no desligamento.
- **Monitoramento de arquivos:** alterações em arquivos de memória acionam uma reindexação com debounce (1,5 s).
- **Reindexação automática:** quando o provedor de embeddings, modelo ou configuração de divisão em partes
  muda, todo o índice é reconstruído automaticamente.
- **Reindexação sob demanda:** `openclaw memory index --force`

<Info>
Você também pode indexar arquivos Markdown fora do workspace com
`memorySearch.extraPaths`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config#additional-memory-paths).
</Info>

## Quando usar

O mecanismo integrado é a escolha certa para a maioria dos usuários:

- Funciona imediatamente sem dependências extras.
- Lida bem com busca por palavra-chave e busca vetorial.
- Compatível com todos os provedores de embeddings.
- A busca híbrida combina o melhor das duas abordagens de recuperação.

Considere mudar para [QMD](/pt-BR/concepts/memory-qmd) se você precisar de reranking, expansão de consulta
ou quiser indexar diretórios fora do workspace.

Considere [Honcho](/pt-BR/concepts/memory-honcho) se você quiser memória entre sessões com
modelagem automática de usuário.

## Solução de problemas

**Busca de memória desativada?** Verifique `openclaw memory status`. Se nenhum provedor for
detectado, defina um explicitamente ou adicione uma chave de API.

**Provedor local não detectado?** Confirme que o caminho local existe e execute:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto os comandos CLI independentes quanto o Gateway usam o mesmo id de provedor `local`.
Defina `memorySearch.provider: "local"` quando quiser embeddings locais.

**Resultados obsoletos?** Execute `openclaw memory index --force` para reconstruir. O watcher
pode deixar de detectar alterações em casos extremos raros.

**sqlite-vec não está carregando?** O OpenClaw recorre automaticamente à similaridade de cosseno
em processo. `openclaw memory status --deep` relata o armazenamento vetorial local
separadamente do provedor de embeddings, portanto `Vector store: unavailable` aponta
para o carregamento do sqlite-vec, enquanto `Embeddings: unavailable` aponta para prontidão
do provedor/autenticação ou do modelo. Verifique os logs para o erro de carregamento específico.

## Configuração

Para configuração de provedor de embeddings, ajuste de busca híbrida (pesos, MMR, decaimento
temporal), indexação em lote, memória multimodal, sqlite-vec, caminhos extras e todos
os outros controles de configuração, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Active Memory](/pt-BR/concepts/active-memory)
