---
read_when:
    - Você quer embeddings de busca de memória de um modelo GGUF local
    - Você está configurando `memorySearch.provider = "local"`
    - Você precisa do plugin do OpenClaw responsável pelo runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Instale o provedor oficial llama.cpp para embeddings de memória GGUF locais
title: Provedor llama.cpp
x-i18n:
    generated_at: "2026-07-12T15:24:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` é o plugin de provedor externo oficial para embeddings GGUF
locais. Ele registra o ID de provedor de embeddings `local` e é responsável pela
dependência de runtime `node-llama-cpp` usada por `memorySearch.provider: "local"`.

Instale-o antes de usar embeddings de memória locais:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

O pacote npm principal `openclaw` não inclui `node-llama-cpp`. Manter a
dependência nativa neste plugin impede que atualizações npm normais do OpenClaw
excluam um runtime instalado manualmente dentro do diretório do pacote OpenClaw.

## Configuração

Defina `memorySearch.provider` como `local`:

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

O valor padrão de `local.modelPath` é o URI `hf:` mostrado acima (`embeddinggemma-300m-qat-Q8_0.gguf`).
Aponte-o para outro URI `hf:` ou para um arquivo `.gguf` local para usar outro
modelo. `local.modelCacheDir` substitui o local onde os modelos baixados são armazenados
em cache (padrão: `~/.node-llama-cpp/models`), e `local.contextSize` aceita um
número inteiro ou `"auto"`.

Quando `local.contextSize` é numérico, o provedor também fornece esse requisito
ao posicionamento automático de camadas na GPU do node-llama-cpp. Isso permite que o node-llama-cpp acomode
o modelo e o contexto de embeddings juntos, mantendo suas verificações de
segurança de memória. Com `"auto"`, o node-llama-cpp mantém seu posicionamento automático normal.

## Runtime nativo

Use o Node 24 para obter o processo de instalação nativa mais simples. Checkouts do código-fonte que usam
pnpm podem precisar aprovar e recompilar a dependência nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnóstico do runtime

Execute `openclaw memory status --deep` depois que o provedor for carregado para inspecionar
o backend e a compilação selecionados, os nomes dos dispositivos, as camadas transferidas para a GPU, o tamanho
de contexto solicitado e o último instantâneo observado de VRAM ou memória unificada. Os valores de VRAM
incluem um carimbo de data e hora da observação, pois leituras passivas de status não
recarregam o modelo nem consultam o dispositivo.

Os mesmos dados mais recentes conhecidos podem aparecer em `openclaw doctor` quando o
Gateway em execução já tiver usado o provedor local. Um comando normal de status ou doctor
não carrega um modelo apenas para coletar diagnósticos.

## Solução de problemas

Se `node-llama-cpp` estiver ausente ou não puder ser carregado, o OpenClaw informará a falha
com:

1. Instale o plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Use o Node 24 para instalações/atualizações nativas.
3. Em um checkout do código-fonte com pnpm: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

Para usar embeddings locais com menos complicações e sem a etapa de compilação nativa, defina
`memorySearch.provider` como um provedor remoto de embeddings, como `lmstudio`,
`ollama`, `openai` ou `voyage`.
