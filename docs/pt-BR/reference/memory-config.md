---
read_when:
    - Você quer configurar provedores de busca na memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar a busca híbrida, o MMR ou o decaimento temporal
    - Você deseja habilitar a indexação de memória multimodal
sidebarTitle: Memory config
summary: Todas as opções de configuração para busca na memória, provedores de embeddings, QMD, busca híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-07-16T12:54:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página lista todas as opções de configuração da busca de memória do OpenClaw. Para visões gerais conceituais, consulte:

<CardGroup cols={2}>
  <Card title="Visão geral da memória" href="/pt-BR/concepts/memory">
    Como a memória funciona.
  </Card>
  <Card title="Mecanismo integrado" href="/pt-BR/concepts/memory-builtin">
    Backend SQLite padrão.
  </Card>
  <Card title="Mecanismo QMD" href="/pt-BR/concepts/memory-qmd">
    Processo auxiliar local-first.
  </Card>
  <Card title="Busca de memória" href="/pt-BR/concepts/memory-search">
    Pipeline de busca e ajustes.
  </Card>
  <Card title="Active Memory" href="/pt-BR/concepts/active-memory">
    Subagente de memória para sessões interativas.
  </Card>
</CardGroup>

Todas as configurações de busca de memória ficam em `agents.defaults.memorySearch` no `openclaw.json` (ou em uma substituição `agents.list[].memorySearch` por agente), salvo indicação em contrário.

<Note>
Se estiver procurando a opção de ativação do recurso **Active Memory** e a configuração do subagente, elas ficam em `plugins.entries.active-memory`, e não em `memorySearch`.

A Active Memory usa um modelo de duas condições:

1. o Plugin deve estar ativado e direcionado ao ID do agente atual
2. a solicitação deve ser uma sessão de chat persistente, interativa e qualificada

Consulte [Active Memory](/pt-BR/concepts/active-memory) para conhecer o modelo de ativação, a configuração pertencente ao Plugin, a persistência de transcrições e o padrão de implantação segura.
</Note>

---

## Seleção do provedor

| Chave      | Tipo      | Padrão           | Descrição                                                                                                                                                                                                                                                                                  |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`  | `boolean` | `true`           | Ativa ou desativa a busca de memória                                                                                                                                                                                                                                                       |
| `provider` | `string`  | `"openai"`       | ID do adaptador de embeddings, como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` ou `voyage`; também pode ser um `models.providers.<id>` configurado cujo `api` aponte para um adaptador de embeddings de memória ou para uma API de modelo compatível com OpenAI |
| `model`    | `string`  | padrão do provedor | Nome do modelo de embeddings                                                                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | ID do adaptador alternativo quando o principal falhar                                                                                                                                                                                                                                      |

Quando `provider` não está definido, o OpenClaw usa embeddings da OpenAI. Defina `provider`
explicitamente para usar Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, um modelo GGUF local ou um endpoint `/v1/embeddings` compatível com OpenAI.
Configurações legadas que ainda especificam `provider: "auto"` são resolvidas como `openai`.

<Warning>
Alterar o provedor ou modelo de embeddings, as configurações do provedor, as fontes, o escopo,
a segmentação ou o tokenizador pode tornar incompatível o índice vetorial SQLite existente.
O OpenClaw pausa a busca vetorial e informa um aviso de identidade do índice, em vez de
refazer automaticamente os embeddings de todo o conteúdo. Quando estiver tudo pronto, reconstrua com
`openclaw memory status --index --agent <id>` ou
`openclaw memory index --force --agent <id>`.
</Warning>

Quando `provider` não está definido, o `provider: "auto"` legado está presente ou
`provider: "none"` seleciona intencionalmente o modo somente FTS, a recuperação de memória ainda pode
usar a classificação lexical FTS quando os embeddings não estão disponíveis.

Provedores não locais definidos explicitamente falham de forma fechada. Se `memorySearch.provider` for definido como
um provedor concreto com backend remoto, como Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage ou um provedor personalizado
compatível com OpenAI, e esse provedor estiver indisponível em tempo de execução, `memory_search`
retornará um resultado de indisponibilidade em vez de usar silenciosamente a recuperação somente por FTS. Corrija a
configuração do provedor ou da autenticação, mude para um provedor acessível ou defina
`provider: "none"` se quiser usar deliberadamente a recuperação somente por FTS.

### IDs de provedores personalizados

`memorySearch.provider` pode apontar para uma entrada `models.providers.<id>` personalizada para adaptadores de provedor específicos de memória, como `ollama`, ou para APIs de modelos compatíveis com OpenAI, como `openai-responses` / `openai-completions`. O OpenClaw resolve o proprietário `api` desse provedor para o adaptador de embeddings, preservando o ID personalizado do provedor para o tratamento do endpoint, da autenticação e do prefixo do modelo. Isso permite que configurações com várias GPUs ou vários hosts dediquem os embeddings de memória a um endpoint local específico:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Resolução da chave de API

Embeddings remotos exigem uma chave de API. O Bedrock usa a cadeia padrão de credenciais do AWS SDK (funções de instância, SSO, chaves de acesso ou uma chave de API do Bedrock).

| Provedor       | Variável de ambiente                                 | Chave de configuração                |
| -------------- | ---------------------------------------------------- | ------------------------------------ |
| Bedrock        | Cadeia de credenciais da AWS ou `AWS_BEARER_TOKEN_BEDROCK` | Nenhuma chave de API necessária      |
| DeepInfra      | `DEEPINFRA_API_KEY`                                  | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                  | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticação por login no dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (espaço reservado)               | --                                   |
| OpenAI         | `OPENAI_API_KEY`                                  | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                  | `models.providers.voyage.apiKey`    |

<Note>
O OAuth do Codex abrange apenas chat/conclusões e não atende às solicitações de embeddings.
</Note>

---

## Configuração do endpoint remoto

Use `provider: "openai-compatible"` para um servidor `/v1/embeddings`
genérico compatível com OpenAI que não deve herdar as credenciais globais de chat da OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL base personalizada da API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Substituição da chave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Cabeçalhos HTTP adicionais (mesclados com os padrões do provedor).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configuração específica do provedor

<AccordionGroup>
  <Accordion title="Gemini">
    | Chave                  | Tipo     | Padrão                 | Descrição                                  |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Também oferece suporte a `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 ou 3072        |

    <Warning>
    Alterar o modelo ou `outputDimensionality` muda a identidade do índice. O OpenClaw
    pausa a busca vetorial até que o índice de memória seja reconstruído explicitamente.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatíveis com OpenAI">
    Endpoints de embeddings compatíveis com OpenAI podem optar por incluir campos de solicitação `input_type` específicos do provedor. Isso é útil para modelos de embeddings assimétricos que exigem rótulos diferentes para embeddings de consultas e documentos.

    | Chave               | Tipo     | Padrão       | Descrição                                                        |
    | ------------------- | -------- | ------------ | ---------------------------------------------------------------- |
    | `inputType`         | `string` | não definido | `input_type` compartilhado para embeddings de consultas e documentos |
    | `queryInputType`    | `string` | não definido | `input_type` no momento da consulta; substitui `inputType` |
    | `documentInputType` | `string` | não definido | `input_type` do índice/documento; substitui `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Alterar esses valores afeta a identidade do cache de embeddings para indexação em lote pelo provedor e deve ser seguido por uma reindexação da memória quando o modelo upstream tratar os rótulos de maneira diferente.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuração de embeddings do Bedrock

    O Bedrock usa a cadeia padrão de credenciais do AWS SDK junto com um token de portador verificado pelo OpenClaw, portanto nenhuma chave de API é armazenada na configuração. Se o OpenClaw for executado no EC2 com uma função de instância habilitada para o Bedrock, basta definir o provedor e o modelo:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Chave                  | Tipo     | Padrão                          | Descrição                          |
    | ---------------------- | -------- | ------------------------------- | ---------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualquer ID de modelo de embeddings do Bedrock |
    | `outputDimensionality` | `number` | padrão do modelo                 | Para Titan V2: 256, 512 ou 1024    |

    **Modelos compatíveis** (com detecção de família e dimensões padrão):

    | ID do modelo                                | Provedor   | Dimensões padrão | Dimensões configuráveis    |
    | ------------------------------------------- | ---------- | ---------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    As variantes com sufixo de taxa de transferência (por exemplo, `amazon.titan-embed-text-v1:2:8k`) e os IDs de perfil de inferência com prefixo de região (por exemplo, `us.amazon.titan-embed-text-v2:0`) herdam a configuração do modelo base.

    **Região:** resolvida nesta ordem: a substituição `memorySearch.remote.baseUrl`, a configuração `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` e, por fim, o padrão `us-east-1`.

    **Autenticação:** o OpenClaw verifica primeiro `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` ou `AWS_BEARER_TOKEN_BEDROCK` e, em seguida, recorre à cadeia padrão de provedores de credenciais do AWS SDK:

    1. Variáveis de ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), a menos que `AWS_PROFILE` também esteja definida
    2. SSO (somente quando os campos de SSO estão configurados)
    3. Arquivos compartilhados de credenciais e configuração (`fromIni`, inclui `AWS_PROFILE`)
    4. Processo de credenciais (`credential_process` no arquivo de configuração da AWS)
    5. Credenciais de token de identidade da Web
    6. Credenciais de metadados de instância do ECS ou EC2

    **Permissões do IAM:** a função ou o usuário do IAM precisa de:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para aplicar o privilégio mínimo, restrinja `InvokeModel` ao modelo específico:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Chave                 | Tipo               | Padrão                  | Descrição                                                                                                                                                                                                                                                                                                             |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | baixado automaticamente | Caminho para o arquivo do modelo GGUF                                                                                                                                                                                                                                                                                 |
    | `local.modelCacheDir` | `string`           | padrão do node-llama-cpp | Diretório de cache dos modelos baixados                                                                                                                                                                                                                                                                               |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Tamanho da janela de contexto para o contexto de embedding. 4096 abrange segmentos típicos (128-512 tokens), limitando ao mesmo tempo a VRAM não ocupada pelos pesos. Reduza para 1024-2048 em hosts com recursos limitados. `"auto"` usa o máximo para o qual o modelo foi treinado — não recomendado para modelos 8B+ (Qwen3-Embedding-8B: até 40 960 tokens podem elevar o uso de VRAM a ~32 GB). |

    Instale primeiro o provedor oficial do llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, baixado automaticamente). Checkouts do código-fonte ainda exigem aprovação da compilação nativa: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

    Use a CLI independente para verificar o mesmo caminho de provedor usado pelo Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Valores numéricos de `local.contextSize` também orientam o posicionamento automático de camadas na GPU pelo node-llama-cpp, para que os pesos do modelo e o contexto de embedding solicitado sejam acomodados em conjunto. `openclaw memory status --deep` informa os últimos dados conhecidos e registrados com data e hora sobre o backend do llama.cpp, dispositivo, descarregamento, contexto solicitado e memória após o carregamento pelo runtime; o status passivo não carrega um modelo.

    Defina `provider: "local"` explicitamente para embeddings GGUF locais. `hf:` e referências de modelo HTTP(S) são compatíveis com configurações locais explícitas (por meio da resolução de modelos do node-llama-cpp), mas não alteram o provedor padrão.

  </Accordion>
</AccordionGroup>

### Tempo limite de embedding em linha

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Substitui o tempo limite dos lotes de embedding em linha durante a indexação da memória.

Quando não definido, usa o padrão do provedor: 600 segundos para provedores locais/auto-hospedados, como `local`, `ollama` e `lmstudio`, e 120 segundos para provedores hospedados. Aumente esse valor quando os lotes de embedding locais limitados pela CPU estiverem funcionando corretamente, mas lentamente.
</ParamField>

---

## Comportamento da indexação

Todos em `memorySearch.sync`, salvo indicação em contrário:

| Chave                          | Tipo      | Padrão | Descrição                                                               |
| ------------------------------ | --------- | ------ | ----------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Sincroniza o índice da memória quando uma sessão é iniciada              |
| `onSearch`                     | `boolean` | `true`  | Sincroniza de forma tardia durante a busca após detectar alterações no conteúdo |
| `watch`                        | `boolean` | `true`  | Monitora arquivos de memória (chokidar) e agenda a reindexação após alterações |
| `watchDebounceMs`              | `number`  | `1500`  | Janela de debounce para agrupar eventos rápidos de monitoramento de arquivos |
| `intervalMinutes`              | `number`  | `0`     | Intervalo de reindexação periódica em minutos (`0` desativa) |
| `sessions.postCompactionForce` | `boolean` | `true`  | Força a reindexação da sessão após atualizações da transcrição acionadas pela compactação |

<ParamField path="chunking.tokens" type="number">
  Tamanho do segmento em tokens usado ao dividir as fontes de memória antes do embedding (padrão: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Sobreposição de tokens entre segmentos adjacentes para preservar o contexto próximo aos limites de divisão (padrão: 80).
</ParamField>

<Note>
Alterar `chunking.tokens` ou `chunking.overlap` muda os limites dos segmentos e invalida a identidade do índice existente (consulte o Aviso em Seleção do provedor).
</Note>

---

## Configuração da busca híbrida

Tudo em `memorySearch.query`:

| Chave        | Tipo     | Padrão | Descrição                                                   |
| ------------ | -------- | ------ | ----------------------------------------------------------- |
| `maxResults` | `number` | `6`     | Máximo de resultados da memória retornados antes da injeção |
| `minScore`   | `number` | `0.35`  | Pontuação mínima de relevância para incluir um resultado    |

E em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                                      |
| --------------------- | --------- | ------ | ---------------------------------------------- |
| `enabled`             | `boolean` | `true`  | Ativa a busca híbrida BM25 + vetorial           |
| `vectorWeight`        | `number`  | `0.7`   | Peso das pontuações vetoriais (0-1)             |
| `textWeight`          | `number`  | `0.3`   | Peso das pontuações BM25 (0-1)                  |
| `candidateMultiplier` | `number`  | `4`     | Multiplicador do tamanho do conjunto de candidatos |

<Tabs>
  <Tab title="MMR (diversidade)">
    | Chave         | Tipo      | Padrão | Descrição                                  |
    | ------------- | --------- | ------ | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Ativa a reordenação por MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidade máxima, 1 = relevância máxima |
  </Tab>
  <Tab title="Decaimento temporal (recenticidade)">
    | Chave                        | Tipo      | Padrão | Descrição                         |
    | ---------------------------- | --------- | ------ | --------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Ativa o reforço de recenticidade |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | A pontuação cai pela metade a cada N dias |

    Arquivos perenes (`MEMORY.md`, arquivos sem data em `memory/`) nunca sofrem decaimento.

  </Tab>
</Tabs>

### Exemplo completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Caminhos adicionais de memória

| Chave        | Tipo       | Descrição                                      |
| ------------ | ---------- | ---------------------------------------------- |
| `extraPaths` | `string[]` | Diretórios ou arquivos adicionais para indexar |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Os caminhos podem ser absolutos ou relativos ao workspace. Os diretórios são examinados recursivamente em busca de arquivos `.md`. O tratamento de links simbólicos depende do backend ativo: o mecanismo integrado ignora links simbólicos, enquanto o QMD segue o comportamento do scanner QMD subjacente.

Para a busca de transcrições entre agentes com escopo por agente, use `agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`. Essas coleções adicionais seguem o mesmo formato de `{ path, name, pattern? }`, mas são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho aponta para fora do workspace atual. Se o mesmo caminho resolvido aparecer tanto em `memory.qmd.paths` quanto em `memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a duplicata.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando o Gemini Embedding 2:

| Chave                     | Tipo       | Padrão     | Descrição                              |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilita a indexação multimodal        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Tamanho máximo de arquivo para indexação (10 MiB) |

<Note>
Aplica-se somente aos arquivos em `extraPaths`. As raízes de memória padrão continuam aceitando apenas Markdown. Requer `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.
</Note>

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embeddings

| Chave              | Tipo      | Padrão  | Descrição                                      |
| ------------------ | --------- | ------- | ---------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Armazena embeddings de trechos em cache no SQLite |
| `cache.maxEntries` | `number`  | não definido | Limite superior aproximado de embeddings em cache |

Evita gerar novamente embeddings de texto inalterado durante a reindexação ou atualizações de transcrições. Deixe `maxEntries` não definido para um cache ilimitado; defina-o quando o crescimento do uso de disco for mais importante que a velocidade máxima de reindexação. Quando definido, as entradas mais antigas (pelo horário da última atualização) são removidas primeiro assim que o cache excede o limite.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão  | Descrição                            |
| ----------------------------- | --------- | ------- | ------------------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embeddings em linha paralelos        |
| `remote.batch.enabled`        | `boolean` | `false` | Habilita a API de embeddings em lote |
| `remote.batch.concurrency`    | `number`  | `2`     | Trabalhos em lote paralelos          |
| `remote.batch.wait`           | `boolean` | `true`  | Aguarda a conclusão do lote          |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | Intervalo de consulta                 |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | Tempo limite do lote                 |

Disponível para `gemini`, `openai` e `voyage`. O processamento em lote da OpenAI geralmente é a opção mais rápida e econômica para grandes preenchimentos retroativos.

`remote.nonBatchConcurrency` controla as chamadas de embedding em linha usadas por provedores locais/auto-hospedados e provedores hospedados quando as APIs de lote do provedor não estão ativas. O Ollama usa `1` por padrão para indexação sem lote, a fim de evitar sobrecarregar hosts locais menores; defina um valor maior em máquinas mais potentes.

Isso é independente de `sync.embeddingBatchTimeoutSeconds`, que controla o tempo limite das chamadas de embedding em linha.

---

## Pesquisa na memória da sessão (experimental)

Indexe transcrições de sessões e disponibilize-as por meio de `memory_search`:

| Chave                         | Tipo       | Padrão       | Descrição                                      |
| ----------------------------- | ---------- | ------------ | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Habilita a indexação de sessões                |
| `sources`                     | `string[]` | `["memory"]` | Adiciona `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Limite de bytes para reindexação               |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Limite de mensagens para reindexação           |

<Warning>
A indexação de sessões é opcional e executada de forma assíncrona. Os resultados podem estar ligeiramente desatualizados. Os logs das sessões ficam armazenados em disco; portanto, considere o acesso ao sistema de arquivos como o limite de confiança.
</Warning>

Os resultados de transcrições de sessões também respeitam
[`tools.sessions.visibility`](/pt-BR/gateway/config-tools#toolssessions). A visibilidade padrão
`tree` expõe apenas a sessão atual e as sessões que ela iniciou. Para
recuperar, a partir de uma sessão diferente, como uma mensagem direta, uma sessão não relacionada do mesmo agente despachada pelo Gateway,
amplie intencionalmente a visibilidade para `agent` (ou somente para `all`
quando a recuperação entre agentes também for necessária e a política entre agentes permitir).

Os exemplos abaixo colocam essas configurações em `agents.defaults`. Também é possível
aplicar configurações equivalentes de `memorySearch` em uma substituição por agente quando apenas um
agente deve indexar e pesquisar transcrições de sessões.

Para recuperação do Gateway para mensagens diretas no mesmo agente:

<Tabs>
  <Tab title="Backend integrado">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Backend QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Ao usar o QMD, `agents.defaults.memorySearch.experimental.sessionMemory` e
`sources: ["sessions"]` não exportam transcrições para o QMD por si só. Defina também
`memory.qmd.sessions.enabled: true`.

---

## Aceleração vetorial do SQLite (sqlite-vec)

| Chave                        | Tipo      | Padrão     | Descrição                                  |
| ---------------------------- | --------- | ---------- | ------------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | Usa sqlite-vec para consultas vetoriais    |
| `store.vector.extensionPath` | `string`  | incluído   | Substitui o caminho do sqlite-vec          |

Quando o sqlite-vec não está disponível, o OpenClaw recorre automaticamente à similaridade de cosseno no processo.

---

## Armazenamento do índice

Os índices de memória integrados ficam no banco de dados SQLite do OpenClaw de cada agente em
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Chave                 | Tipo     | Padrão      | Descrição                                    |
| --------------------- | -------- | ----------- | -------------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizador FTS5 (`unicode61` ou `trigram`) |

---

## Configuração do backend QMD

Defina `memory.backend = "qmd"` para habilitá-lo. Todas as configurações do QMD ficam em `memory.qmd`:

| Chave                    | Tipo      | Padrão       | Descrição                                                                                                  |
| ------------------------ | --------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Caminho do executável QMD; defina um caminho absoluto quando o `PATH` do serviço for diferente do seu shell |
| `searchMode`             | `string`  | `search` | Comando de pesquisa: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --           | Defina como `false` com `searchMode: "query"` e QMD 2.1+ para ignorar a reclassificação do QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexa automaticamente `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --           | Caminhos adicionais: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Exporta transcrições de sessões para o QMD                                                   |
| `sessions.retentionDays` | `number`  | --           | Retenção de transcrições                                                                  |
| `sessions.exportDir`     | `string`  | --           | Diretório de exportação                                                                      |

`searchMode: "search"` usa apenas pesquisa lexical/BM25. O OpenClaw não executa verificações de prontidão vetorial semântica nem manutenção de embeddings do QMD nesse modo, inclusive durante `memory status --deep`; `vsearch` e `query` continuam exigindo a prontidão vetorial e os embeddings do QMD.

`rerank: false` altera apenas o modo `query` do QMD e requer o QMD 2.1 ou mais recente. No modo CLI direto, o OpenClaw passa `--no-rerank`; no modo MCP com mcporter, passa `rerank: false` para a ferramenta unificada de consulta do QMD. Deixe-o não definido para usar o comportamento padrão de reclassificação de consultas do QMD.

O OpenClaw dá preferência aos formatos atuais de coleções e consultas MCP do QMD, mas mantém versões mais antigas do QMD funcionando ao tentar, quando necessário, sinalizadores compatíveis de padrões de coleções e nomes antigos de ferramentas MCP. Quando o QMD anuncia compatibilidade com vários filtros de coleções, as coleções da mesma fonte são pesquisadas com um único processo do QMD; compilações antigas do QMD mantêm o caminho de compatibilidade por coleção. Mesma fonte significa que as coleções de memória persistente (arquivos de memória padrão mais caminhos personalizados) são agrupadas, enquanto as coleções de transcrições de sessões permanecem em um grupo separado para que a diversificação de fontes continue tendo ambas as entradas.

<Note>
As substituições de modelos do QMD permanecem no lado do QMD, não na configuração do OpenClaw. Caso seja necessário substituir globalmente os modelos do QMD, defina variáveis de ambiente como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` no ambiente de execução do Gateway.
</Note>

### Integração com o mcporter

Tudo em `memory.qmd.mcporter`. Encaminha as pesquisas do QMD por meio de um daemon MCP `mcporter` de longa duração, em vez de iniciar `qmd` a cada consulta, reduzindo a sobrecarga de inicialização a frio para modelos maiores.

| Chave         | Tipo      | Padrão     | Descrição                                                                            |
| ------------- | --------- | ---------- | ------------------------------------------------------------------------------------ |
| `enabled`     | `boolean` | `false` | Encaminha chamadas do QMD pelo mcporter em vez de iniciar `qmd` por solicitação |
| `serverName`  | `string`  | `qmd`   | Nome do servidor mcporter que executa `qmd mcp` com `lifecycle: keep-alive`  |
| `startDaemon` | `boolean` | `true`  | Inicia automaticamente o daemon mcporter quando `enabled` for verdadeiro         |

Requer `mcporter` instalado e disponível no PATH, além de um servidor mcporter configurado que execute `qmd mcp`. Mantenha desabilitado em configurações locais mais simples, nas quais o custo de iniciar um processo por consulta seja aceitável.

<AccordionGroup>
  <Accordion title="Programação de atualizações">
    | Chave                       | Tipo      | Padrão | Descrição                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Intervalo de atualização                      |
    | `update.debounceMs`       | `number`  | `15000` | Aplica debounce às alterações de arquivos                 |
    | `update.onBoot`           | `boolean` | `true`  | Atualiza quando o gerenciador QMD de longa duração é aberto; defina como false para ignorar a atualização imediata na inicialização |
    | `update.startup`          | `string`  | `off`   | Inicialização opcional do QMD ao iniciar o Gateway: `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Atraso antes da execução da atualização de `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Bloqueia a abertura do gerenciador até a conclusão da atualização inicial |
    | `update.embedInterval`    | `string`  | `60m`   | Cadência separada de embeddings                |
    | `update.commandTimeoutMs` | `number`  | `30000` | Tempo limite para comandos de manutenção do QMD (listar/adicionar coleção) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Tempo limite para cada ciclo de `qmd update`   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Tempo limite para cada ciclo de `qmd embed`    |
  </Accordion>
  <Accordion title="Limites">
    | Chave                       | Tipo     | Padrão | Descrição                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Máximo de resultados da busca         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Limita o tamanho do trecho       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Limita o total de caracteres injetados |
    | `limits.timeoutMs`        | `number` | `4000`  | Tempo limite do comando QMD durante buscas apoiadas pelo QMD, incluindo `memory_search`; configuração, sincronização, fallback integrado e trabalho complementar mantêm o prazo padrão da ferramenta |
  </Accordion>
  <Accordion title="Escopo">
    Controla quais sessões podem receber resultados de busca do QMD. Mesmo esquema de [`session.sendPolicy`](/pt-BR/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    O padrão fornecido permite apenas mensagens diretas/sessões diretas, negando grupos e outros tipos de canal. `match.keyPrefix` corresponde à chave normalizada da sessão; `match.rawKeyPrefix` corresponde à chave bruta, incluindo `agent:<id>:`.

  </Accordion>
  <Accordion title="Citações">
    `memory.citations` se aplica a todos os backends:

    | Valor            | Comportamento                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (padrão) | Inclui o rodapé `Source: <path#line>` nos trechos    |
    | `on`             | Sempre inclui o rodapé                               |
    | `off`            | Omite o rodapé (o caminho ainda é passado internamente ao agente) |

  </Accordion>
</AccordionGroup>

Quando a inicialização do QMD ao iniciar o Gateway está habilitada, o OpenClaw inicia o QMD somente para agentes elegíveis. Se `update.onBoot` for true e nenhuma manutenção por intervalo/embedding estiver configurada, a inicialização usará um gerenciador de execução única para a atualização de inicialização e o fechará. Se um intervalo de atualização ou embedding estiver configurado, a inicialização abrirá o gerenciador QMD de longa duração para que ele possa gerenciar o observador e os temporizadores de intervalo; `update.onBoot: false` ignora apenas a atualização imediata de inicialização.

### Exemplo completo de QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming é configurado em `plugins.entries.memory-core.config.dreaming`, não em `agents.defaults.memorySearch`.

Dreaming é executado como uma única varredura agendada e usa fases internas leve/profunda/REM como detalhe de implementação.

Para consultar o comportamento conceitual e os comandos de barra, consulte [Dreaming](/pt-BR/concepts/dreaming).

### Configurações do usuário

| Chave                                    | Tipo      | Padrão       | Descrição                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Habilita ou desabilita completamente o Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Cadência cron opcional para a varredura completa do Dreaming                                                                                |
| `model`                                | `string`  | modelo padrão | Substituição opcional do modelo do subagente Dream Diary                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Máximo de tokens estimados preservados de cada trecho de recordação de curto prazo promovido para `MEMORY.md`; os metadados de proveniência permanecem visíveis |

### Exemplo

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming grava o estado da máquina em `memory/.dreams/`.
- Dreaming grava a saída narrativa legível por humanos em `DREAMS.md` (ou no `dreams.md` existente).
- `dreaming.model` usa o controle de confiança existente para subagentes do plugin; defina `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitá-lo.
- O Dream Diary tenta novamente uma vez com o modelo padrão da sessão quando o modelo configurado não está disponível. Falhas de confiança ou de lista de permissões são registradas e não são repetidas silenciosamente.
- A política e os limites das fases leve/profunda/REM são comportamentos internos, não configurações voltadas ao usuário.

</Note>

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca na memória](/pt-BR/concepts/memory-search)
