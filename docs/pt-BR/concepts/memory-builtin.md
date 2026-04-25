---
read_when:
    - Você quer entender o backend de memória padrão
    - Você quer configurar provedores de embedding ou busca híbrida
summary: O backend de memória padrão baseado em SQLite com busca por palavra-chave, vetorial e híbrida
title: Mecanismo de memória integrado
x-i18n:
    generated_at: "2026-04-25T13:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

O mecanismo integrado é o backend de memória padrão. Ele armazena seu índice de memória em
um banco de dados SQLite por agente e não precisa de dependências extras para começar.

## O que ele oferece

- **Busca por palavra-chave** via indexação de texto completo FTS5 (pontuação BM25).
- **Busca vetorial** via embeddings de qualquer provedor compatível.
- **Busca híbrida** que combina ambas para melhores resultados.
- **Suporte a CJK** via tokenização por trigrama para chinês, japonês e coreano.
- **Aceleração com sqlite-vec** para consultas vetoriais no banco de dados (opcional).

## Primeiros passos

Se você tiver uma chave de API para OpenAI, Gemini, Voyage ou Mistral, o
mecanismo integrado detecta isso automaticamente e habilita a busca vetorial. Nenhuma configuração é necessária.

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

Sem um provedor de embedding, apenas a busca por palavra-chave fica disponível.

Para forçar o provedor de embedding local integrado, instale o pacote opcional de runtime
`node-llama-cpp` ao lado do OpenClaw e, depois, aponte `local.modelPath`
para um arquivo GGUF:

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

## Provedores de embedding compatíveis

| Provedor | ID        | Detectado automaticamente | Observações                          |
| -------- | --------- | ------------------------- | ------------------------------------ |
| OpenAI   | `openai`  | Sim                       | Padrão: `text-embedding-3-small`     |
| Gemini   | `gemini`  | Sim                       | Compatível com multimodal (imagem + áudio) |
| Voyage   | `voyage`  | Sim                       |                                      |
| Mistral  | `mistral` | Sim                       |                                      |
| Ollama   | `ollama`  | Não                       | Local, defina explicitamente         |
| Local    | `local`   | Sim (primeiro)            | Runtime opcional `node-llama-cpp`    |

A detecção automática escolhe o primeiro provedor cuja chave de API pode ser resolvida, na
ordem mostrada. Defina `memorySearch.provider` para substituir isso.

## Como a indexação funciona

O OpenClaw indexa `MEMORY.md` e `memory/*.md` em blocos (~400 tokens com
sobreposição de 80 tokens) e os armazena em um banco de dados SQLite por agente.

- **Local do índice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Monitoramento de arquivos:** alterações em arquivos de memória acionam uma reindexação com debounce (1,5s).
- **Reindexação automática:** quando o provedor de embedding, modelo ou configuração de fragmentação
  muda, o índice inteiro é reconstruído automaticamente.
- **Reindexação sob demanda:** `openclaw memory index --force`

<Info>
Você também pode indexar arquivos Markdown fora do workspace com
`memorySearch.extraPaths`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config#additional-memory-paths).
</Info>

## Quando usar

O mecanismo integrado é a escolha certa para a maioria dos usuários:

- Funciona imediatamente, sem dependências extras.
- Lida bem com busca por palavra-chave e vetorial.
- É compatível com todos os provedores de embedding.
- A busca híbrida combina o melhor das duas abordagens de recuperação.

Considere migrar para [QMD](/pt-BR/concepts/memory-qmd) se você precisar de reranking, expansão
de consulta ou quiser indexar diretórios fora do workspace.

Considere [Honcho](/pt-BR/concepts/memory-honcho) se quiser memória entre sessões com
modelagem automática de usuário.

## Solução de problemas

**Busca de memória desativada?** Verifique `openclaw memory status`. Se nenhum provedor for
detectado, defina um explicitamente ou adicione uma chave de API.

**Provedor local não detectado?** Confirme que o caminho local existe e execute:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto os comandos independentes da CLI quanto o Gateway usam o mesmo id de provedor `local`.
Se o provedor estiver definido como `auto`, embeddings locais são considerados primeiro apenas
quando `memorySearch.local.modelPath` aponta para um arquivo local existente.

**Resultados desatualizados?** Execute `openclaw memory index --force` para reconstruir. O monitor
pode deixar passar alterações em casos raros.

**sqlite-vec não está carregando?** O OpenClaw usa automaticamente similaridade cosseno em processo
como fallback. Verifique os logs para o erro específico de carregamento.

## Configuração

Para configuração de provedor de embedding, ajuste de busca híbrida (pesos, MMR, decaimento
temporal), indexação em lote, memória multimodal, sqlite-vec, caminhos extras e todas
as outras opções de configuração, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Active Memory](/pt-BR/concepts/active-memory)
