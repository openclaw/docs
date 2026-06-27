---
read_when:
    - Você quer embeddings de busca de memória de um modelo GGUF local
    - Você está configurando memorySearch.provider = "local"
    - Você precisa do Plugin do OpenClaw que é proprietário do runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instale o provedor oficial llama.cpp para embeddings de memória GGUF locais
title: Provedor llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:48:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` é o Plugin provedor externo oficial para embeddings GGUF locais.
Ele possui a dependência de runtime `node-llama-cpp` usada por
`memorySearch.provider: "local"`.

Instale-o antes de usar embeddings de memória locais:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

O pacote npm principal `openclaw` não inclui `node-llama-cpp`. Manter a
dependência nativa neste Plugin impede que atualizações npm normais do OpenClaw
excluam um runtime instalado manualmente dentro do diretório do pacote OpenClaw.

## Configuração

Defina o provedor de busca de memória como `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

O modelo padrão é `embeddinggemma-300m-qat-Q8_0.gguf`. Você também pode apontar
`local.modelPath` para um arquivo `.gguf` local.

## Runtime Nativo

Use Node 24 para o caminho de instalação nativa mais tranquilo. Checkouts de código-fonte usando pnpm
podem precisar aprovar e reconstruir a dependência nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Para embeddings locais com menos atrito, use um provedor de serviço local, como
Ollama ou LM Studio.
