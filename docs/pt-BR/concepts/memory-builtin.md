---
read_when:
    - Você quer entender o backend de memória padrão
    - Você deseja configurar provedores de embeddings ou busca híbrida
summary: O backend de memória padrão baseado em SQLite com busca por palavra-chave, vetorial e híbrida
title: Mecanismo de memória integrado
x-i18n:
    generated_at: "2026-04-30T09:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

O mecanismo integrado é o backend de memória padrão. Ele armazena seu índice de memória em
um banco de dados SQLite por agente e não precisa de dependências extras para começar.

## O que ele oferece

- **Busca por palavra-chave** via indexação de texto completo FTS5 (pontuação BM25).
- **Busca vetorial** via embeddings de qualquer provedor compatível.
- **Busca híbrida** que combina ambas para melhores resultados.
- **Suporte a CJK** via tokenização por trigramas para chinês, japonês e coreano.
- **Aceleração sqlite-vec** para consultas vetoriais dentro do banco de dados (opcional).

## Introdução

Se você tiver uma chave de API para OpenAI, Gemini, Voyage, Mistral ou DeepInfra, o mecanismo
integrado a detecta automaticamente e habilita a busca vetorial. Nenhuma configuração necessária.

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

Para forçar o provedor local de embeddings integrado, instale o pacote de runtime opcional
`node-llama-cpp` ao lado do OpenClaw e aponte `local.modelPath`
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

## Provedores de embeddings compatíveis

| Provedor  | ID          | Detectado automaticamente | Observações                         |
| --------- | ----------- | ------------------------- | ----------------------------------- |
| OpenAI    | `openai`    | Sim                       | Padrão: `text-embedding-3-small`    |
| Gemini    | `gemini`    | Sim                       | Compatível com multimodal (imagem + áudio) |
| Voyage    | `voyage`    | Sim                       |                                     |
| Mistral   | `mistral`   | Sim                       |                                     |
| DeepInfra | `deepinfra` | Sim                       | Padrão: `BAAI/bge-m3`               |
| Ollama    | `ollama`    | Não                       | Local, defina explicitamente        |
| Local     | `local`     | Sim (primeiro)            | Runtime opcional `node-llama-cpp`   |

A detecção automática escolhe o primeiro provedor cuja chave de API possa ser resolvida, na
ordem mostrada. Defina `memorySearch.provider` para substituir.

## Como a indexação funciona

O OpenClaw indexa `MEMORY.md` e `memory/*.md` em chunks (~400 tokens com
sobreposição de 80 tokens) e os armazena em um banco de dados SQLite por agente.

- **Local do índice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Manutenção de armazenamento:** os arquivos auxiliares WAL do SQLite são limitados com checkpoints periódicos e
  no encerramento.
- **Monitoramento de arquivos:** alterações em arquivos de memória acionam uma reindexação com debounce (1,5 s).
- **Reindexação automática:** quando o provedor de embeddings, o modelo ou a configuração de chunking
  muda, todo o índice é recriado automaticamente.
- **Reindexação sob demanda:** `openclaw memory index --force`

<Info>
Você também pode indexar arquivos Markdown fora do workspace com
`memorySearch.extraPaths`. Consulte a
[referência de configuração](/pt-BR/reference/memory-config#additional-memory-paths).
</Info>

## Quando usar

O mecanismo integrado é a escolha certa para a maioria dos usuários:

- Funciona sem configuração inicial e sem dependências extras.
- Lida bem com busca por palavra-chave e vetorial.
- É compatível com todos os provedores de embeddings.
- A busca híbrida combina o melhor das duas abordagens de recuperação.

Considere mudar para [QMD](/pt-BR/concepts/memory-qmd) se precisar de reranking, expansão de consulta
ou quiser indexar diretórios fora do workspace.

Considere [Honcho](/pt-BR/concepts/memory-honcho) se quiser memória entre sessões com
modelagem automática de usuários.

## Solução de problemas

**Busca de memória desabilitada?** Verifique `openclaw memory status`. Se nenhum provedor for
detectado, defina um explicitamente ou adicione uma chave de API.

**Provedor local não detectado?** Confirme se o caminho local existe e execute:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Tanto os comandos CLI autônomos quanto o Gateway usam o mesmo ID de provedor `local`.
Se o provedor estiver definido como `auto`, embeddings locais são considerados primeiro apenas
quando `memorySearch.local.modelPath` aponta para um arquivo local existente.

**Resultados desatualizados?** Execute `openclaw memory index --force` para recriar. O monitor
pode perder alterações em casos extremos raros.

**sqlite-vec não carregando?** O OpenClaw recorre automaticamente à similaridade de cosseno
em processo. Verifique os logs para o erro de carregamento específico.

## Configuração

Para configuração de provedor de embeddings, ajuste de busca híbrida (pesos, MMR, decaimento
temporal), indexação em lote, memória multimodal, sqlite-vec, caminhos extras e todos os
outros controles de configuração, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionados

- [Visão geral de memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Active Memory](/pt-BR/concepts/active-memory)
