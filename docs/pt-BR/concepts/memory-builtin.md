---
read_when:
    - Você quer entender o backend de memória padrão
    - Você quer configurar provedores de embeddings ou a busca híbrida
summary: O backend de memória padrão baseado em SQLite, com pesquisa por palavras-chave, vetorial e híbrida
title: Mecanismo de memória integrado
x-i18n:
    generated_at: "2026-07-12T15:09:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

O mecanismo integrado é o backend de memória padrão. Ele armazena o índice da sua memória
em um banco de dados SQLite por agente e não requer dependências adicionais para
começar.

## O que ele oferece

- **Pesquisa por palavras-chave** por meio da indexação de texto completo FTS5 (pontuação BM25).
- **Pesquisa vetorial** por meio de embeddings de qualquer provedor compatível.
- **Pesquisa híbrida** que combina ambas para obter os melhores resultados.
- **Suporte a CJK** por meio de tokenização por trigramas para chinês, japonês e coreano.
- **Aceleração com sqlite-vec** para consultas vetoriais no banco de dados (opcional).

## Primeiros passos

Por padrão, o mecanismo integrado usa embeddings da OpenAI. Se `OPENAI_API_KEY` ou
`models.providers.openai.apiKey` já estiver configurado, a pesquisa vetorial funcionará
sem configuração adicional de memória.

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

Sem um provedor de embeddings, somente a pesquisa por palavras-chave fica disponível.

Para forçar o uso de embeddings GGUF locais, instale o Plugin oficial do provedor
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

| Provedor          | ID                  | Observações                                   |
| ----------------- | ------------------- | --------------------------------------------- |
| Bedrock           | `bedrock`           | Usa a cadeia de credenciais da AWS            |
| DeepInfra         | `deepinfra`         | Padrão: `BAAI/bge-m3`                         |
| Gemini            | `gemini`            | Compatível com multimodalidade (imagem + áudio) |
| GitHub Copilot    | `github-copilot`    | Usa sua assinatura do Copilot                 |
| LM Studio         | `lmstudio`          | Local/auto-hospedado                           |
| Local             | `local`             | `@openclaw/llama-cpp-provider`                |
| Mistral           | `mistral`           |                                               |
| Ollama            | `ollama`            | Local/auto-hospedado                           |
| OpenAI            | `openai`            | Padrão: `text-embedding-3-small`              |
| Compatível com OpenAI | `openai-compatible` | Endpoint genérico `/v1/embeddings`         |
| Voyage            | `voyage`            |                                               |

Defina `memorySearch.provider` para deixar de usar a OpenAI.

## Como funciona a indexação

O OpenClaw indexa `MEMORY.md` e `memory/*.md` em segmentos (400 tokens com
sobreposição de 80 tokens por padrão) e os armazena em um banco de dados SQLite por agente.

- **Local do índice:** o banco de dados do agente proprietário em
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Manutenção do armazenamento:** os arquivos auxiliares WAL do SQLite têm seu tamanho limitado por checkpoints
  periódicos e no encerramento.
- **Monitoramento de arquivos:** alterações nos arquivos de memória acionam uma reindexação com debounce
  (padrão de 1.5s).
- **Reindexação automática:** o índice é reconstruído automaticamente quando há alteração no provedor
  de embeddings, modelo, configuração de segmentação, fontes configuradas ou escopo.
- **Reindexação sob demanda:** `openclaw memory index --force`

<Info>
Você também pode indexar arquivos Markdown fora do espaço de trabalho com
`memorySearch.extraPaths`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config#additional-memory-paths).
</Info>

## Quando usar

O mecanismo integrado é a escolha certa para a maioria dos usuários:

- Funciona imediatamente, sem dependências adicionais.
- Lida bem com pesquisas por palavras-chave e vetoriais.
- É compatível com todos os provedores de embeddings.
- A pesquisa híbrida combina o melhor das duas abordagens de recuperação.

Considere mudar para o [QMD](/pt-BR/concepts/memory-qmd) se você precisar de reclassificação, expansão de
consulta ou quiser indexar diretórios fora do espaço de trabalho.

Considere o [Honcho](/pt-BR/concepts/memory-honcho) se você quiser memória entre sessões
com modelagem automática do usuário.

## Solução de problemas

**A pesquisa de memória está desativada?** Verifique `openclaw memory status`. Se nenhum provedor for
detectado, defina um explicitamente ou adicione uma chave de API.

**O provedor local não foi detectado?** Confirme se o caminho local existe e execute:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto os comandos independentes da CLI quanto o Gateway usam o mesmo ID de provedor `local`.
Defina `memorySearch.provider: "local"` quando quiser usar embeddings locais.

**Resultados desatualizados?** Execute `openclaw memory index --force` para reconstruir. O monitor
pode não detectar alterações em casos extremos raros.

**O sqlite-vec não está carregando?** O OpenClaw recorre automaticamente à similaridade
de cosseno em processo. `openclaw memory status --deep` relata o armazenamento vetorial
local separadamente do provedor de embeddings; portanto, `Vector store:
unavailable` indica o carregamento do sqlite-vec, enquanto `Embeddings: unavailable`
indica a prontidão do provedor/autenticação ou do modelo. Verifique os logs para identificar o erro
específico de carregamento.

## Configuração

Para configurar o provedor de embeddings, ajustar a pesquisa híbrida (pesos, MMR, decaimento
temporal), indexação em lote, memória multimodal, sqlite-vec, caminhos adicionais e todas
as demais opções de configuração, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
- [Active Memory](/pt-BR/concepts/active-memory)
