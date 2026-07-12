---
read_when:
    - Você quer entender o backend de memória padrão
    - Você deseja configurar provedores de embeddings ou busca híbrida
summary: O backend de memória padrão baseado em SQLite, com pesquisa por palavras-chave, vetorial e híbrida
title: Mecanismo de memória integrado
x-i18n:
    generated_at: "2026-07-11T23:52:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

O mecanismo integrado é o backend de memória padrão. Ele armazena o índice de memória
em um banco de dados SQLite por agente e não requer dependências adicionais para
começar.

## O que ele oferece

- **Pesquisa por palavra-chave** por meio da indexação de texto completo FTS5 (pontuação BM25).
- **Pesquisa vetorial** por meio de embeddings de qualquer provedor compatível.
- **Pesquisa híbrida** que combina ambas para obter os melhores resultados.
- **Compatibilidade com CJK** por meio de tokenização por trigramas para chinês, japonês e coreano.
- **Aceleração com sqlite-vec** para consultas vetoriais no banco de dados (opcional).

## Primeiros passos

Por padrão, o mecanismo integrado usa embeddings da OpenAI. Se `OPENAI_API_KEY` ou
`models.providers.openai.apiKey` já estiver configurado, a pesquisa vetorial funcionará
sem nenhuma configuração adicional de memória.

Para definir explicitamente um provedor:

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

Sem um provedor de embeddings, somente a pesquisa por palavra-chave estará disponível.

Para forçar o uso de embeddings GGUF locais, instale o plugin oficial do provedor
llama.cpp e aponte `local.modelPath` para um arquivo GGUF:

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

| Provedor            | ID                  | Observações                                    |
| ------------------- | ------------------- | ---------------------------------------------- |
| Bedrock             | `bedrock`           | Usa a cadeia de credenciais da AWS             |
| DeepInfra           | `deepinfra`         | Padrão: `BAAI/bge-m3`                          |
| Gemini              | `gemini`            | Compatível com multimodalidade (imagem + áudio) |
| GitHub Copilot      | `github-copilot`    | Usa sua assinatura do Copilot                  |
| LM Studio           | `lmstudio`          | Local/auto-hospedado                            |
| Local               | `local`             | `@openclaw/llama-cpp-provider`                 |
| Mistral             | `mistral`           |                                                |
| Ollama              | `ollama`            | Local/auto-hospedado                            |
| OpenAI              | `openai`            | Padrão: `text-embedding-3-small`               |
| Compatível com OpenAI | `openai-compatible` | Endpoint genérico `/v1/embeddings`             |
| Voyage              | `voyage`            |                                                |

Defina `memorySearch.provider` para deixar de usar a OpenAI.

## Como a indexação funciona

O OpenClaw indexa `MEMORY.md` e `memory/*.md` em segmentos (400 tokens com
sobreposição de 80 tokens por padrão) e os armazena em um banco de dados SQLite por agente.

- **Localização do índice:** o banco de dados do agente proprietário em
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Manutenção do armazenamento:** os arquivos auxiliares WAL do SQLite são limitados por checkpoints
  periódicos e no encerramento.
- **Monitoramento de arquivos:** alterações nos arquivos de memória acionam uma reindexação com debounce
  (1,5 s por padrão).
- **Reindexação automática:** o índice é recriado automaticamente quando há alterações no provedor
  de embeddings, no modelo, na configuração de segmentação, nas fontes configuradas ou no escopo.
- **Reindexação sob demanda:** `openclaw memory index --force`

<Info>
Também é possível indexar arquivos Markdown fora do espaço de trabalho com
`memorySearch.extraPaths`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config#additional-memory-paths).
</Info>

## Quando usar

O mecanismo integrado é a escolha certa para a maioria dos usuários:

- Funciona imediatamente, sem dependências adicionais.
- Lida bem com pesquisas por palavra-chave e vetoriais.
- É compatível com todos os provedores de embeddings.
- A pesquisa híbrida combina o melhor das duas abordagens de recuperação.

Considere mudar para o [QMD](/pt-BR/concepts/memory-qmd) se você precisar de reranqueamento, expansão
de consultas ou quiser indexar diretórios fora do espaço de trabalho.

Considere o [Honcho](/pt-BR/concepts/memory-honcho) se você quiser memória entre sessões
com modelagem automática do usuário.

## Solução de problemas

**Pesquisa de memória desativada?** Verifique `openclaw memory status`. Se nenhum provedor for
detectado, defina um explicitamente ou adicione uma chave de API.

**Provedor local não detectado?** Confirme se o caminho local existe e execute:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto os comandos independentes da CLI quanto o Gateway usam o mesmo ID de provedor `local`.
Defina `memorySearch.provider: "local"` quando quiser usar embeddings locais.

**Resultados desatualizados?** Execute `openclaw memory index --force` para recriar o índice. O monitor
pode não detectar alterações em casos extremos raros.

**O sqlite-vec não está sendo carregado?** O OpenClaw recorre automaticamente à similaridade de
cosseno no processo. `openclaw memory status --deep` informa o armazenamento vetorial local
separadamente do provedor de embeddings; portanto, `Vector store:
unavailable` indica o carregamento do sqlite-vec, enquanto `Embeddings: unavailable`
indica problemas de prontidão do provedor/autenticação ou do modelo. Consulte os logs para identificar
o erro específico de carregamento.

## Configuração

Para configurar o provedor de embeddings, ajustar a pesquisa híbrida (pesos, MMR, decaimento
temporal), indexação em lote, memória multimodal, sqlite-vec, caminhos adicionais e todas
as outras opções de configuração, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
- [Active Memory](/pt-BR/concepts/active-memory)
