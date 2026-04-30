---
read_when:
    - Você quer configurar provedores de busca na memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar a busca híbrida, MMR ou o decaimento temporal
    - Você quer ativar a indexação de memória multimodal
sidebarTitle: Memory config
summary: Todas as opções de configuração para busca na memória, provedores de embeddings, QMD, busca híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-04-30T10:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

Esta página lista todos os ajustes de configuração para a pesquisa de memória do OpenClaw. Para visões gerais conceituais, consulte:

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
  <Card title="Pesquisa de memória" href="/pt-BR/concepts/memory-search">
    Pipeline de pesquisa e ajustes.
  </Card>
  <Card title="Active Memory" href="/pt-BR/concepts/active-memory">
    Subagente de memória para sessões interativas.
  </Card>
</CardGroup>

Todas as configurações de pesquisa de memória ficam em `agents.defaults.memorySearch` no `openclaw.json`, salvo indicação em contrário.

<Note>
Se você está procurando o alternador do recurso **Active Memory** e a configuração do subagente, isso fica em `plugins.entries.active-memory`, em vez de `memorySearch`.

Active Memory usa um modelo de dois portões:

1. o plugin deve estar habilitado e mirar no ID do agente atual
2. a solicitação deve ser uma sessão de chat persistente interativa qualificada

Consulte [Active Memory](/pt-BR/concepts/active-memory) para o modelo de ativação, a configuração pertencente ao plugin, a persistência de transcrição e o padrão de implantação segura.
</Note>

---

## Seleção de provedor

| Chave      | Tipo      | Padrão               | Descrição                                                                                                                                                                                                                         |
| ---------- | --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | detectado automaticamente | ID do adaptador de embeddings, como `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` ou `voyage`; também pode ser um `models.providers.<id>` configurado cujo `api` aponta para um desses adaptadores |
| `model`    | `string`  | padrão do provedor   | Nome do modelo de embeddings                                                                                                                                                                                                      |
| `fallback` | `string`  | `"none"`             | ID do adaptador de fallback quando o primário falha                                                                                                                                                                               |
| `enabled`  | `boolean` | `true`               | Habilita ou desabilita a pesquisa de memória                                                                                                                                                                                      |

### Ordem de detecção automática

Quando `provider` não está definido, o OpenClaw seleciona o primeiro disponível:

<Steps>
  <Step title="local">
    Selecionado se `memorySearch.local.modelPath` estiver configurado e o arquivo existir.
  </Step>
  <Step title="github-copilot">
    Selecionado se um token do GitHub Copilot puder ser resolvido (variável de ambiente ou perfil de autenticação).
  </Step>
  <Step title="openai">
    Selecionado se uma chave da OpenAI puder ser resolvida.
  </Step>
  <Step title="gemini">
    Selecionado se uma chave do Gemini puder ser resolvida.
  </Step>
  <Step title="voyage">
    Selecionado se uma chave do Voyage puder ser resolvida.
  </Step>
  <Step title="mistral">
    Selecionado se uma chave do Mistral puder ser resolvida.
  </Step>
  <Step title="deepinfra">
    Selecionado se uma chave da DeepInfra puder ser resolvida.
  </Step>
  <Step title="bedrock">
    Selecionado se a cadeia de credenciais do AWS SDK resolver (função de instância, chaves de acesso, perfil, SSO, identidade web ou configuração compartilhada).
  </Step>
</Steps>

`ollama` é compatível, mas não é detectado automaticamente (defina-o explicitamente).

### IDs de provedor personalizados

`memorySearch.provider` pode apontar para uma entrada personalizada de `models.providers.<id>`. O OpenClaw resolve o proprietário de `api` desse provedor para o adaptador de embeddings, preservando o ID de provedor personalizado para endpoint, autenticação e tratamento de prefixo de modelo. Isso permite que configurações com várias GPUs ou vários hosts dediquem embeddings de memória a um endpoint local específico:

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

### Resolução de chave de API

Embeddings remotos exigem uma chave de API. Bedrock usa a cadeia de credenciais padrão do AWS SDK em vez disso (funções de instância, SSO, chaves de acesso).

| Provedor       | Variável de ambiente                              | Chave de configuração               |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Cadeia de credenciais da AWS                       | Nenhuma chave de API necessária     |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticação via login do dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
O OAuth do Codex cobre apenas chat/conclusões e não atende a solicitações de embeddings.
</Note>

---

## Configuração de endpoint remoto

Para endpoints personalizados compatíveis com OpenAI ou para substituir padrões do provedor:

<ParamField path="remote.baseUrl" type="string">
  URL base personalizada da API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Substitui a chave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Cabeçalhos HTTP extras (mesclados com os padrões do provedor).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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
    | `model`                | `string` | `gemini-embedding-001` | Também aceita `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 ou 3072        |

    <Warning>
    Alterar o modelo ou `outputDimensionality` aciona uma reindexação completa automática.
    </Warning>

  </Accordion>
  <Accordion title="Tipos de entrada compatíveis com OpenAI">
    Endpoints de embeddings compatíveis com OpenAI podem optar por campos de solicitação `input_type` específicos do provedor. Isso é útil para modelos de embeddings assimétricos que exigem rótulos diferentes para embeddings de consulta e de documento.

    | Chave               | Tipo     | Padrão       | Descrição                                             |
    | ------------------- | -------- | ------------ | ----------------------------------------------------- |
    | `inputType`         | `string` | não definido | `input_type` compartilhado para embeddings de consulta e documento |
    | `queryInputType`    | `string` | não definido | `input_type` no momento da consulta; substitui `inputType` |
    | `documentInputType` | `string` | não definido | `input_type` de índice/documento; substitui `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Alterar esses valores afeta a identidade do cache de embeddings para indexação em lote do provedor e deve ser seguido por uma reindexação da memória quando o modelo upstream trata os rótulos de forma diferente.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock usa a cadeia de credenciais padrão do AWS SDK — nenhuma chave de API é necessária. Se o OpenClaw roda no EC2 com uma função de instância habilitada para Bedrock, basta definir o provedor e o modelo:

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

    | Chave                  | Tipo     | Padrão                        | Descrição                         |
    | ---------------------- | -------- | ----------------------------- | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualquer ID de modelo de embeddings do Bedrock |
    | `outputDimensionality` | `number` | padrão do modelo              | Para Titan V2: 256, 512 ou 1024   |

    **Modelos compatíveis** (com detecção de família e padrões de dimensão):

    | ID do modelo                                | Provedor   | Dimensões padrão | Dimensões configuráveis |
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
    4. Arquivos de credenciais e configuração compartilhados
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

    Para privilégio mínimo, restrinja `InvokeModel` ao modelo específico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Chave                 | Tipo               | Padrão                         | Descrição                                                                                                                                                                                                                                                                                                                                        |
    | --------------------- | ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | baixado automaticamente        | Caminho para o arquivo de modelo GGUF                                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | padrão do node-llama-cpp       | Diretório de cache para modelos baixados                                                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                         | Tamanho da janela de contexto para o contexto de embedding. 4096 cobre chunks típicos (128–512 tokens) enquanto limita a VRAM que não é de pesos. Reduza para 1024–2048 em hosts restritos. `"auto"` usa o máximo treinado do modelo — não recomendado para modelos 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM contra ~8.8 GB em 4096). |

    Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, baixado automaticamente). Requer build nativo: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

    Use a CLI independente para verificar o mesmo caminho de provider usado pelo Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Se `provider` for `auto`, `local` será selecionado apenas quando `local.modelPath` apontar para um arquivo local existente. Referências de modelo `hf:` e HTTP(S) ainda podem ser usadas explicitamente com `provider: "local"`, mas elas não fazem `auto` selecionar local antes que o modelo esteja disponível no disco.

  </Accordion>
</AccordionGroup>

### Timeout de embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Substitua o timeout para lotes de embedding inline durante a indexação de memória.

Quando não definido, usa o padrão do provider: 600 segundos para providers locais/auto-hospedados, como `local`, `ollama` e `lmstudio`, e 120 segundos para providers hospedados. Aumente isso quando lotes de embedding locais limitados por CPU estiverem saudáveis, mas lentos.
</ParamField>

---

## Configuração de pesquisa híbrida

Tudo em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                                      |
| --------------------- | --------- | ------ | ---------------------------------------------- |
| `enabled`             | `boolean` | `true` | Habilitar pesquisa híbrida BM25 + vetorial     |
| `vectorWeight`        | `number`  | `0.7`  | Peso para pontuações vetoriais (0-1)           |
| `textWeight`          | `number`  | `0.3`  | Peso para pontuações BM25 (0-1)                |
| `candidateMultiplier` | `number`  | `4`    | Multiplicador do tamanho do pool de candidatos |

<Tabs>
  <Tab title="MMR (diversidade)">
    | Chave         | Tipo      | Padrão  | Descrição                              |
    | ------------- | --------- | ------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Habilitar reclassificação MMR          |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidade máx., 1 = relevância máx. |
  </Tab>
  <Tab title="Decaimento temporal (recência)">
    | Chave                        | Tipo      | Padrão | Descrição                         |
    | ---------------------------- | --------- | ------ | --------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Habilitar aumento por recência    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`   | A pontuação cai pela metade a cada N dias |

    Arquivos evergreen (`MEMORY.md`, arquivos sem data em `memory/`) nunca sofrem decaimento.

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

## Caminhos de memória adicionais

| Chave        | Tipo       | Descrição                                     |
| ------------ | ---------- | --------------------------------------------- |
| `extraPaths` | `string[]` | Diretórios ou arquivos adicionais a indexar   |

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

Os caminhos podem ser absolutos ou relativos ao workspace. Diretórios são verificados recursivamente em busca de arquivos `.md`. O tratamento de symlinks depende do backend ativo: o mecanismo embutido ignora symlinks, enquanto o QMD segue o comportamento do scanner QMD subjacente.

Para pesquisa de transcrições entre agentes com escopo de agente, use `agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`. Essas coleções extras seguem o mesmo formato `{ path, name, pattern? }`, mas são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho aponta para fora do workspace atual. Se o mesmo caminho resolvido aparecer tanto em `memory.qmd.paths` quanto em `memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a duplicata.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando Gemini Embedding 2:

| Chave                     | Tipo       | Padrão     | Descrição                              |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilitar indexação multimodal         |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]`  |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamanho máximo de arquivo para indexação |

<Note>
Aplica-se apenas a arquivos em `extraPaths`. As raízes de memória padrão continuam somente Markdown. Requer `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.
</Note>

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embeddings

| Chave              | Tipo      | Padrão  | Descrição                          |
| ------------------ | --------- | ------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Armazena embeddings de chunks em cache no SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings em cache      |

Evita gerar embeddings novamente para texto inalterado durante reindexação ou atualizações de transcrições.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão | Descrição                    |
| ----------------------------- | --------- | ------ | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | Embeddings inline paralelos  |
| `remote.batch.enabled`        | `boolean` | `false` | Ativa API de embeddings em lote |
| `remote.batch.concurrency`    | `number`  | `2`    | Trabalhos em lote paralelos  |
| `remote.batch.wait`           | `boolean` | `true` | Aguarda a conclusão do lote  |
| `remote.batch.pollIntervalMs` | `number`  | --     | Intervalo de consulta        |
| `remote.batch.timeoutMinutes` | `number`  | --     | Tempo limite do lote         |

Disponível para `openai`, `gemini` e `voyage`. O lote da OpenAI normalmente é o mais rápido e barato para grandes preenchimentos retroativos.

`remote.nonBatchConcurrency` controla chamadas inline de embedding usadas por provedores locais/auto-hospedados e provedores hospedados quando APIs de lote do provedor não estão ativas. O padrão do Ollama é `1` para indexação sem lote a fim de evitar sobrecarregar hosts locais menores; defina um valor mais alto em máquinas maiores.

Isso é separado de `sync.embeddingBatchTimeoutSeconds`, que controla o tempo limite para chamadas inline de embedding.

---

## Busca de memória de sessão (experimental)

Indexa transcrições de sessão e as expõe via `memory_search`:

| Chave                         | Tipo       | Padrão      | Descrição                                      |
| ----------------------------- | ---------- | ----------- | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Ativa a indexação de sessões                   |
| `sources`                     | `string[]` | `["memory"]` | Adicione `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Limite de bytes para reindexação               |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Limite de mensagens para reindexação           |

<Warning>
A indexação de sessões é opcional e roda de forma assíncrona. Os resultados podem ficar ligeiramente desatualizados. Os logs de sessão ficam no disco, então trate o acesso ao sistema de arquivos como o limite de confiança.
</Warning>

---

## Aceleração vetorial do SQLite (sqlite-vec)

| Chave                        | Tipo      | Padrão | Descrição                         |
| ---------------------------- | --------- | ------ | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | Usa sqlite-vec para consultas vetoriais |
| `store.vector.extensionPath` | `string`  | bundled | Substitui o caminho do sqlite-vec |

Quando sqlite-vec não está disponível, o OpenClaw recorre automaticamente à similaridade de cosseno em processo.

---

## Armazenamento do índice

| Chave                 | Tipo     | Padrão                                | Descrição                                     |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Local do índice (compatível com o token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizador FTS5 (`unicode61` ou `trigram`)   |

---

## Configuração do backend QMD

Defina `memory.backend = "qmd"` para ativar. Todas as configurações de QMD ficam em `memory.qmd`:

| Chave                    | Tipo      | Padrão  | Descrição                                                                           |
| ------------------------ | --------- | ------- | ----------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`   | Caminho do executável QMD; defina um caminho absoluto quando o `PATH` do serviço diferir do seu shell |
| `searchMode`             | `string`  | `search` | Comando de busca: `search`, `vsearch`, `query`                                      |
| `includeDefaultMemory`   | `boolean` | `true`  | Indexa automaticamente `MEMORY.md` + `memory/**/*.md`                               |
| `paths[]`                | `array`   | --      | Caminhos extras: `{ name, path, pattern? }`                                         |
| `sessions.enabled`       | `boolean` | `false` | Indexa transcrições de sessão                                                       |
| `sessions.retentionDays` | `number`  | --      | Retenção de transcrições                                                            |
| `sessions.exportDir`     | `string`  | --      | Diretório de exportação                                                             |

`searchMode: "search"` é somente lexical/BM25. O OpenClaw não executa sondagens de prontidão de vetores semânticos nem manutenção de embeddings do QMD para esse modo, inclusive durante `memory status --deep`; `vsearch` e `query` continuam exigindo prontidão de vetores e embeddings do QMD.

O OpenClaw prefere as formas atuais de coleção do QMD e de consulta MCP, mas mantém versões mais antigas do QMD funcionando ao tentar flags de padrão de coleção compatíveis e nomes de ferramentas MCP mais antigos quando necessário. Quando o QMD anuncia suporte a vários filtros de coleção, coleções da mesma fonte são pesquisadas com um único processo do QMD; compilações mais antigas do QMD mantêm o caminho de compatibilidade por coleção. Mesma fonte significa que coleções de memória durável são agrupadas, enquanto coleções de transcrições de sessão permanecem em um grupo separado para que a diversificação de fontes ainda tenha as duas entradas.

<Note>
As substituições de modelo do QMD ficam do lado do QMD, não na configuração do OpenClaw. Se você precisar substituir os modelos do QMD globalmente, defina variáveis de ambiente como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` no ambiente de runtime do Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Cronograma de atualização">
    | Chave                     | Tipo      | Padrão  | Descrição                             |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Intervalo de atualização              |
    | `update.debounceMs`       | `number`  | `15000` | Debounce de alterações de arquivo     |
    | `update.onBoot`           | `boolean` | `true`  | Atualiza quando o gerenciador QMD de longa duração abre; também controla a atualização de inicialização opcional |
    | `update.startup`          | `string`  | `off`   | Atualização opcional ao iniciar o Gateway: `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Atraso antes de a atualização `startup: "idle"` ser executada |
    | `update.waitForBootSync`  | `boolean` | `false` | Bloqueia a abertura do gerenciador até que a atualização inicial seja concluída |
    | `update.embedInterval`    | `string`  | --      | Cadência separada de embeddings       |
    | `update.commandTimeoutMs` | `number`  | --      | Tempo limite para comandos do QMD     |
    | `update.updateTimeoutMs`  | `number`  | --      | Tempo limite para operações de atualização do QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Tempo limite para operações de embedding do QMD |
  </Accordion>
  <Accordion title="Limites">
    | Chave                     | Tipo     | Padrão | Descrição                         |
    | ------------------------- | -------- | ------- | --------------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Máximo de resultados de pesquisa  |
    | `limits.maxSnippetChars`  | `number` | --      | Limita o tamanho do trecho        |
    | `limits.maxInjectedChars` | `number` | --      | Limita o total de caracteres injetados |
    | `limits.timeoutMs`        | `number` | `4000`  | Tempo limite da pesquisa          |
  </Accordion>
  <Accordion title="Escopo">
    Controla quais sessões podem receber resultados de pesquisa do QMD. Mesmo esquema de [`session.sendPolicy`](/pt-BR/gateway/config-agents#session):

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

    O padrão distribuído permite sessões diretas e de canal, mas ainda nega grupos.

    O padrão é somente DM. `match.keyPrefix` corresponde à chave de sessão normalizada; `match.rawKeyPrefix` corresponde à chave bruta incluindo `agent:<id>:`.

  </Accordion>
  <Accordion title="Citações">
    `memory.citations` se aplica a todos os backends:

    | Valor            | Comportamento                                      |
    | ---------------- | ------------------------------------------------- |
    | `auto` (padrão)  | Inclui o rodapé `Source: <path#line>` em trechos  |
    | `on`             | Sempre inclui o rodapé                            |
    | `off`            | Omite o rodapé (o caminho ainda é passado internamente ao agente) |

  </Accordion>
</AccordionGroup>

As atualizações de inicialização do QMD usam um caminho de subprocesso único durante a inicialização do Gateway. O gerenciador QMD de longa duração ainda controla o observador de arquivos regular e os temporizadores de intervalo quando a pesquisa de memória é aberta para uso interativo.

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

Dreaming é executado como uma varredura agendada única e usa fases internas light/deep/REM como detalhe de implementação.

Para comportamento conceitual e comandos de barra, consulte [Dreaming](/pt-BR/concepts/dreaming).

### Configurações do usuário

| Chave       | Tipo      | Padrão       | Descrição                                      |
| ----------- | --------- | ------------- | ---------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Ativa ou desativa completamente o dreaming     |
| `frequency` | `string`  | `0 3 * * *`   | Cadência cron opcional para a varredura completa de dreaming |
| `model`     | `string`  | modelo padrão | Substituição opcional do modelo do subagente Dream Diary |

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
- Dreaming grava o estado de máquina em `memory/.dreams/`.
- Dreaming grava a saída narrativa legível por humanos em `DREAMS.md` (ou no `dreams.md` existente).
- `dreaming.model` usa o gate de confiança de subagente do Plugin existente; defina `plugins.entries.memory-core.subagent.allowModelOverride: true` antes de ativá-lo.
- O Dream Diary tenta novamente uma vez com o modelo padrão da sessão quando o modelo configurado está indisponível. Falhas de confiança ou allowlist são registradas e não são repetidas silenciosamente.
- A política e os limites das fases light/deep/REM são comportamento interno, não configuração voltada ao usuário.

</Note>

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
