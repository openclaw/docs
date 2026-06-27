---
read_when:
    - Você quer configurar provedores de busca de memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar busca híbrida, MMR ou decaimento temporal
    - Você quer habilitar a indexação de memória multimodal
sidebarTitle: Memory config
summary: Todos os controles de configuração para pesquisa de memória, provedores de embeddings, QMD, pesquisa híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-06-27T18:08:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página lista cada controle de configuração para a busca de memória do OpenClaw. Para visões gerais conceituais, consulte:

<CardGroup cols={2}>
  <Card title="Visão geral da memória" href="/pt-BR/concepts/memory">
    Como a memória funciona.
  </Card>
  <Card title="Mecanismo integrado" href="/pt-BR/concepts/memory-builtin">
    Backend SQLite padrão.
  </Card>
  <Card title="Mecanismo QMD" href="/pt-BR/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Busca de memória" href="/pt-BR/concepts/memory-search">
    Pipeline de busca e ajuste.
  </Card>
  <Card title="Active Memory" href="/pt-BR/concepts/active-memory">
    Subagente de memória para sessões interativas.
  </Card>
</CardGroup>

Todas as configurações de busca de memória ficam em `agents.defaults.memorySearch` no `openclaw.json`, salvo indicação em contrário.

<Note>
Se você está procurando o controle de ativação do recurso **Active Memory** e a configuração do subagente, isso fica em `plugins.entries.active-memory` em vez de `memorySearch`.

Active Memory usa um modelo de dois gates:

1. o plugin deve estar habilitado e ter como alvo o id do agente atual
2. a solicitação deve ser uma sessão elegível de chat persistente interativo

Consulte [Active Memory](/pt-BR/concepts/active-memory) para o modelo de ativação, a configuração de propriedade do plugin, a persistência da transcrição e o padrão de implantação segura.
</Note>

---

## Seleção de provedor

| Chave      | Tipo      | Padrão           | Descrição                                                                                                                                                                                                                                                                                    |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | ID do adaptador de embeddings, como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` ou `voyage`; também pode ser um `models.providers.<id>` configurado cujo `api` aponta para um adaptador de embeddings de memória ou uma API de modelo compatível com OpenAI |
| `model`    | `string`  | padrão do provedor | Nome do modelo de embeddings                                                                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`         | ID do adaptador de fallback quando o primário falha                                                                                                                                                                                                                                           |
| `enabled`  | `boolean` | `true`           | Habilita ou desabilita a busca de memória                                                                                                                                                                                                                                                     |

Quando `provider` não está definido, o OpenClaw usa embeddings da OpenAI. Defina `provider`
explicitamente para usar Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, um modelo GGUF local ou um endpoint `/v1/embeddings` compatível com OpenAI.
Configurações legadas que ainda dizem `provider: "auto"` resolvem para `openai`.

<Warning>
Alterar o provedor de embeddings, o modelo, as configurações do provedor, as fontes, o escopo,
a fragmentação ou o tokenizador pode tornar o índice vetorial SQLite existente incompatível.
O OpenClaw pausa a busca vetorial e relata um aviso de identidade do índice em vez de
recriar automaticamente os embeddings de tudo. Recrie quando estiver pronto com
`openclaw memory status --index --agent <id>` ou
`openclaw memory index --force --agent <id>`.
</Warning>

Quando `provider` não está definido, o legado `provider: "auto"` está presente ou
`provider: "none"` seleciona intencionalmente o modo somente FTS, a recuperação de memória ainda pode
usar a classificação lexical FTS quando embeddings não estão disponíveis.

Provedores não locais explícitos falham fechados. Se você definir `memorySearch.provider` como
um provedor concreto com backend remoto, como OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio ou um provedor personalizado
compatível com OpenAI, e esse provedor estiver indisponível em tempo de execução, `memory_search`
retornará um resultado indisponível em vez de usar silenciosamente a recuperação somente FTS. Corrija a
configuração de provedor/autenticação, mude para um provedor acessível ou defina
`provider: "none"` se quiser recuperação deliberadamente somente FTS.

### IDs de provedores personalizados

`memorySearch.provider` pode apontar para uma entrada personalizada `models.providers.<id>` para adaptadores de provedor específicos de memória, como `ollama`, ou para APIs de modelo compatíveis com OpenAI, como `openai-responses` / `openai-completions`. O OpenClaw resolve o proprietário de `api` desse provedor para o adaptador de embeddings enquanto preserva o id de provedor personalizado para tratamento de endpoint, autenticação e prefixo de modelo. Isso permite que configurações com várias GPUs ou vários hosts dediquem embeddings de memória a um endpoint local específico:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

Embeddings remotos exigem uma chave de API. O Bedrock usa a cadeia de credenciais padrão do AWS SDK em vez disso (funções de instância, SSO, chaves de acesso).

| Provedor       | Variável de ambiente                            | Chave de configuração               |
| -------------- | ----------------------------------------------- | ----------------------------------- |
| Bedrock        | cadeia de credenciais da AWS                    | Nenhuma chave de API necessária     |
| DeepInfra      | `DEEPINFRA_API_KEY`                             | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticação via login de dispositivo |
| Mistral        | `MISTRAL_API_KEY`                               | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                  | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                | `models.providers.voyage.apiKey`    |

<Note>
O OAuth do Codex cobre apenas chat/completions e não satisfaz solicitações de embeddings.
</Note>

---

## Configuração de endpoint remoto

Use `provider: "openai-compatible"` para um servidor genérico `/v1/embeddings`
compatível com OpenAI que não deve herdar credenciais globais de chat da OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL base de API personalizada.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sobrescreve a chave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Cabeçalhos HTTP extras (mesclados com os padrões do provedor).
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
    | Chave                  | Tipo     | Padrão                 | Descrição                                      |
    | ---------------------- | -------- | ---------------------- | ---------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Também oferece suporte a `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 ou 3072            |

    <Warning>
    Alterar o modelo ou `outputDimensionality` altera a identidade do índice. O OpenClaw
    pausa a busca vetorial até que você recrie explicitamente o índice de memória.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatíveis com OpenAI">
    Endpoints de embeddings compatíveis com OpenAI podem optar por campos de solicitação `input_type` específicos do provedor. Isso é útil para modelos de embeddings assimétricos que exigem rótulos diferentes para embeddings de consulta e de documento.

    | Chave               | Tipo     | Padrão        | Descrição                                                 |
    | ------------------- | -------- | ------------- | --------------------------------------------------------- |
    | `inputType`         | `string` | não definido  | `input_type` compartilhado para embeddings de consulta e documento |
    | `queryInputType`    | `string` | não definido  | `input_type` no momento da consulta; substitui `inputType` |
    | `documentInputType` | `string` | não definido  | `input_type` de índice/documento; substitui `inputType`   |

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

    Alterar esses valores afeta a identidade do cache de embeddings para indexação em lote do provedor e deve ser seguido por uma reindexação de memória quando o modelo upstream trata os rótulos de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuração de embeddings do Bedrock

    O Bedrock usa a cadeia de credenciais padrão do AWS SDK — nenhuma chave de API necessária. Se o OpenClaw estiver em execução no EC2 com uma função de instância habilitada para Bedrock, basta definir o provedor e o modelo:

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

    | Chave                  | Tipo     | Padrão                         | Descrição                         |
    | ---------------------- | -------- | ------------------------------ | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualquer ID de modelo de embeddings do Bedrock |
    | `outputDimensionality` | `number` | padrão do modelo               | Para Titan V2: 256, 512 ou 1024   |

    **Modelos compatíveis** (com detecção de família e padrões de dimensão):

    | ID do modelo                              | Provedor   | Dimensões padrão | Dimensões configuráveis |
    | ------------------------------------------ | ---------- | ---------------- | ----------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024             | 256, 512, 1024          |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536             | --                      |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536             | --                      |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024             | --                      |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024             | 256, 384, 1024, 3072    |
    | `cohere.embed-english-v3`                  | Cohere     | 1024             | --                      |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024             | --                      |
    | `cohere.embed-v4:0`                        | Cohere     | 1536             | 256-1536                |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512              | --                      |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024             | --                      |

    Variantes com sufixo de throughput (por exemplo, `amazon.titan-embed-text-v1:2:8k`) herdam a configuração do modelo base.

    **Autenticação:** a autenticação do Bedrock usa a ordem padrão de resolução de credenciais do AWS SDK:

    1. Variáveis de ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache de token SSO
    3. Credenciais de token de identidade web
    4. Arquivos compartilhados de credenciais e configuração
    5. Credenciais de metadados do ECS ou EC2

    A região é resolvida a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, do `baseUrl` do provedor `amazon-bedrock`, ou usa `us-east-1` como padrão.

    **Permissões IAM:** a função ou o usuário IAM precisa de:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para privilégio mínimo, limite o escopo de `InvokeModel` ao modelo específico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Chave                 | Tipo               | Padrão                | Descrição                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | baixado automaticamente | Caminho para o arquivo de modelo GGUF                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | padrão do node-llama-cpp | Diretório de cache para modelos baixados                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                | Tamanho da janela de contexto para o contexto de embedding. 4096 cobre chunks típicos (128–512 tokens), limitando a VRAM que não é de pesos. Reduza para 1024–2048 em hosts restritos. `"auto"` usa o máximo treinado do modelo — não recomendado para modelos 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM contra ~8,8 GB em 4096). |

    Instale primeiro o provedor oficial llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, baixado automaticamente). Checkouts de origem ainda exigem aprovação de build nativa: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

    Use a CLI autônoma para verificar o mesmo caminho de provedor que o Gateway usa:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Defina `provider: "local"` explicitamente para embeddings GGUF locais. Referências de modelo `hf:` e HTTP(S) são compatíveis para configurações locais explícitas, mas não alteram o provedor padrão.

  </Accordion>
</AccordionGroup>

### Timeout de embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Substitui o timeout para lotes de embedding inline durante a indexação de memória.

Quando não definido, usa o padrão do provedor: 600 segundos para provedores locais/auto-hospedados, como `local`, `ollama` e `lmstudio`, e 120 segundos para provedores hospedados. Aumente isso quando lotes de embedding locais limitados por CPU estiverem saudáveis, mas lentos.
</ParamField>

---

## Configuração de pesquisa híbrida

Tudo em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                            |
| --------------------- | --------- | ------ | ------------------------------------ |
| `enabled`             | `boolean` | `true` | Ativar pesquisa híbrida BM25 + vetor |
| `vectorWeight`        | `number`  | `0.7`  | Peso para pontuações vetoriais (0-1) |
| `textWeight`          | `number`  | `0.3`  | Peso para pontuações BM25 (0-1)      |
| `candidateMultiplier` | `number`  | `4`    | Multiplicador do tamanho do pool de candidatos |

<Tabs>
  <Tab title="MMR (diversity)">
    | Chave         | Tipo      | Padrão  | Descrição                              |
    | ------------- | --------- | ------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Ativar reordenação MMR                 |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidade máx., 1 = relevância máx. |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Chave                        | Tipo      | Padrão | Descrição                         |
    | ---------------------------- | --------- | ------ | --------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Ativar reforço por recência       |
    | `temporalDecay.halfLifeDays` | `number`  | `30`   | A pontuação cai pela metade a cada N dias |

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

Os caminhos podem ser absolutos ou relativos ao workspace. Diretórios são examinados recursivamente em busca de arquivos `.md`. O tratamento de symlinks depende do backend ativo: o mecanismo integrado ignora symlinks, enquanto o QMD segue o comportamento do scanner QMD subjacente.

Para busca de transcrições entre agentes com escopo de agente, use `agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`. Essas coleções extras seguem o mesmo formato `{ path, name, pattern? }`, mas são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho aponta para fora do workspace atual. Se o mesmo caminho resolvido aparecer tanto em `memory.qmd.paths` quanto em `memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a duplicata.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando Gemini Embedding 2:

| Chave                     | Tipo       | Padrão    | Descrição                             |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilitar indexação multimodal        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamanho máximo de arquivo para indexação |

<Note>
Aplica-se apenas a arquivos em `extraPaths`. As raízes padrão de memória permanecem somente Markdown. Requer `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.
</Note>

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embeddings

| Chave              | Tipo      | Padrão | Descrição                           |
| ------------------ | --------- | ------ | ----------------------------------- |
| `cache.enabled`    | `boolean` | `true` | Armazenar embeddings de chunks em cache no SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings em cache       |

Evita gerar embeddings novamente para texto inalterado durante reindexação ou atualizações de transcrições.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão | Descrição                          |
| ----------------------------- | --------- | ------ | ---------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | Embeddings inline paralelos        |
| `remote.batch.enabled`        | `boolean` | `false` | Habilitar API de embeddings em lote |
| `remote.batch.concurrency`    | `number`  | `2`    | Tarefas em lote paralelas          |
| `remote.batch.wait`           | `boolean` | `true` | Aguardar conclusão do lote         |
| `remote.batch.pollIntervalMs` | `number`  | --     | Intervalo de polling               |
| `remote.batch.timeoutMinutes` | `number`  | --     | Timeout do lote                    |

Disponível para `openai`, `gemini` e `voyage`. O lote da OpenAI geralmente é o mais rápido e barato para grandes preenchimentos retroativos.

`remote.nonBatchConcurrency` controla chamadas inline de embedding usadas por provedores locais/auto-hospedados e provedores hospedados quando as APIs de lote do provedor não estão ativas. Ollama usa `1` como padrão para indexação sem lote para evitar sobrecarregar hosts locais menores; defina um valor maior em máquinas maiores.

Isso é separado de `sync.embeddingBatchTimeoutSeconds`, que controla o timeout para chamadas inline de embedding.

---

## Busca de memória de sessão (experimental)

Indexe transcrições de sessão e exponha-as via `memory_search`:

| Chave                         | Tipo       | Padrão      | Descrição                                  |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Habilitar indexação de sessões             |
| `sources`                     | `string[]` | `["memory"]` | Adicionar `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Limite de bytes para reindexação           |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Limite de mensagens para reindexação       |

<Warning>
A indexação de sessões é opcional e executa de forma assíncrona. Os resultados podem estar ligeiramente desatualizados. Os logs de sessão ficam no disco, então trate o acesso ao sistema de arquivos como o limite de confiança.
</Warning>

---

## Aceleração vetorial SQLite (sqlite-vec)

| Chave                        | Tipo      | Padrão | Descrição                         |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Usa sqlite-vec para consultas vetoriais |
| `store.vector.extensionPath` | `string`  | bundled | Substitui o caminho do sqlite-vec |

Quando sqlite-vec não está disponível, o OpenClaw recorre automaticamente à similaridade de cosseno em processo.

---

## Armazenamento de índices

Os índices de memória integrados ficam no banco de dados SQLite do OpenClaw de cada agente em
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Chave                 | Tipo     | Padrão     | Descrição                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizador FTS5 (`unicode61` ou `trigram`) |

---

## Configuração de backend QMD

Defina `memory.backend = "qmd"` para habilitar. Todas as configurações de QMD ficam em `memory.qmd`:

| Chave                    | Tipo      | Padrão  | Descrição                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Caminho do executável QMD; defina um caminho absoluto quando o `PATH` do serviço for diferente do seu shell |
| `searchMode`             | `string`  | `search` | Comando de busca: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | Defina como `false` com `searchMode: "query"` e QMD 2.1+ para ignorar a reordenação do QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexa automaticamente `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | Caminhos extras: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Indexa transcrições de sessão                                                             |
| `sessions.retentionDays` | `number`  | --       | Retenção de transcrições                                                                  |
| `sessions.exportDir`     | `string`  | --       | Diretório de exportação                                                                      |

`searchMode: "search"` é somente lexical/BM25. O OpenClaw não executa sondagens de prontidão de vetores semânticos nem manutenção de embeddings do QMD nesse modo, inclusive durante `memory status --deep`; `vsearch` e `query` continuam exigindo prontidão vetorial e embeddings do QMD.

`rerank: false` altera apenas o modo `query` do QMD e exige QMD 2.1 ou mais recente. No modo CLI direto, o OpenClaw passa `--no-rerank`; no modo MCP com suporte do mcporter, ele passa `rerank: false` para a ferramenta de consulta unificada do QMD. Deixe sem definir para usar o comportamento padrão de reordenação de consulta do QMD.

O OpenClaw prefere os formatos atuais de coleção QMD e consulta MCP, mas mantém versões mais antigas do QMD funcionando ao tentar flags de padrão de coleção compatíveis e nomes de ferramentas MCP mais antigos quando necessário. Quando o QMD anuncia suporte a múltiplos filtros de coleção, coleções da mesma fonte são pesquisadas com um único processo QMD; builds mais antigos do QMD mantêm o caminho de compatibilidade por coleção. Mesma fonte significa que coleções de memória durável são agrupadas, enquanto coleções de transcrições de sessão permanecem em um grupo separado para que a diversificação de fontes ainda tenha as duas entradas.

<Note>
As substituições de modelo do QMD ficam no lado do QMD, não na configuração do OpenClaw. Se você precisar substituir globalmente os modelos do QMD, defina variáveis de ambiente como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` no ambiente de runtime do gateway.
</Note>

<AccordionGroup>
  <Accordion title="Agenda de atualização">
    | Chave                     | Tipo      | Padrão | Descrição                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Intervalo de atualização                      |
    | `update.debounceMs`       | `number`  | `15000` | Aplica debounce a mudanças de arquivo                 |
    | `update.onBoot`           | `boolean` | `true`  | Atualiza quando o gerenciador QMD de longa duração abre; defina como false para ignorar a atualização imediata na inicialização |
    | `update.startup`          | `string`  | `off`   | Inicialização QMD opcional no início do gateway: `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Atraso antes da atualização de `startup: "idle"` ser executada |
    | `update.waitForBootSync`  | `boolean` | `false` | Bloqueia a abertura do gerenciador até que sua atualização inicial seja concluída |
    | `update.embedInterval`    | `string`  | --      | Cadência separada de embeddings                |
    | `update.commandTimeoutMs` | `number`  | --      | Tempo limite para comandos QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | Tempo limite para operações de atualização QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | Tempo limite para operações de embedding QMD      |
  </Accordion>
  <Accordion title="Limites">
    | Chave                     | Tipo     | Padrão | Descrição                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Máximo de resultados de busca         |
    | `limits.maxSnippetChars`  | `number` | --      | Limita o comprimento do snippet       |
    | `limits.maxInjectedChars` | `number` | --      | Limita o total de caracteres injetados |
    | `limits.timeoutMs`        | `number` | `4000`  | Tempo limite de busca             |
  </Accordion>
  <Accordion title="Escopo">
    Controla quais sessões podem receber resultados de busca QMD. Mesmo esquema que [`session.sendPolicy`](/pt-BR/gateway/config-agents#session):

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

    O padrão enviado permite sessões diretas e de canal, mas ainda nega grupos.

    O padrão é somente DM. `match.keyPrefix` corresponde à chave de sessão normalizada; `match.rawKeyPrefix` corresponde à chave bruta, incluindo `agent:<id>:`.

  </Accordion>
  <Accordion title="Citações">
    `memory.citations` se aplica a todos os backends:

    | Valor            | Comportamento                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (padrão) | Inclui o rodapé `Source: <path#line>` nos snippets    |
    | `on`             | Sempre inclui o rodapé                               |
    | `off`            | Omite o rodapé (o caminho ainda é passado internamente ao agente) |

  </Accordion>
</AccordionGroup>

Quando a inicialização QMD no início do gateway está habilitada, o OpenClaw inicia o QMD apenas para agentes qualificados. Se `update.onBoot` for true e nenhuma manutenção de intervalo/embedding estiver configurada, a inicialização usa um gerenciador de execução única para a atualização de boot e o fecha. Se um intervalo de atualização ou embedding estiver configurado, a inicialização abre o gerenciador QMD de longa duração para que ele possa possuir o watcher e os timers de intervalo; `update.onBoot: false` ignora apenas a atualização imediata de boot.

### Exemplo completo de QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming é executado como uma varredura agendada única e usa fases internas leve/profunda/REM como detalhe de implementação.

Para o comportamento conceitual e comandos de barra, consulte [Dreaming](/pt-BR/concepts/dreaming).

### Configurações do usuário

| Chave                                  | Tipo      | Padrão       | Descrição                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Habilita ou desabilita completamente o dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Cadência cron opcional para a varredura completa do dreaming                                                                                |
| `model`                                | `string`  | modelo padrão | Substituição opcional de modelo do subagente Diário de Sonhos                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Máximo de tokens estimados mantidos de cada snippet de recuperação de curto prazo promovido para `MEMORY.md`; os metadados de proveniência permanecem visíveis |

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
- Dreaming grava estado de máquina em `memory/.dreams/`.
- Dreaming grava saída narrativa legível por humanos em `DREAMS.md` (ou no `dreams.md` existente).
- `dreaming.model` usa o gate de confiança de subagente do plugin existente; defina `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de habilitá-lo.
- O Diário de Sonhos tenta novamente uma vez com o modelo padrão da sessão quando o modelo configurado está indisponível. Falhas de confiança ou allowlist são registradas e não são repetidas silenciosamente.
- A política e os limites das fases leve/profunda/REM são comportamento interno, não configuração voltada ao usuário.

</Note>

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
