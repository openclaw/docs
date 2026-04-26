---
read_when:
    - Você quer configurar provedores de busca de memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar busca híbrida, MMR ou decaimento temporal
    - Você quer ativar a indexação de memória multimodal
sidebarTitle: Memory config
summary: Todos os parâmetros de configuração para busca de memória, provedores de embedding, QMD, busca híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-04-26T11:37:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Esta página lista todos os parâmetros de configuração para a busca de memória do OpenClaw. Para visões gerais conceituais, veja:

<CardGroup cols={2}>
  <Card title="Visão geral da memória" href="/pt-BR/concepts/memory">
    Como a memória funciona.
  </Card>
  <Card title="Mecanismo embutido" href="/pt-BR/concepts/memory-builtin">
    Backend SQLite padrão.
  </Card>
  <Card title="Mecanismo QMD" href="/pt-BR/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Busca de memória" href="/pt-BR/concepts/memory-search">
    Pipeline de busca e ajustes.
  </Card>
  <Card title="Active Memory" href="/pt-BR/concepts/active-memory">
    Subagente de memória para sessões interativas.
  </Card>
</CardGroup>

Todas as configurações de busca de memória ficam em `agents.defaults.memorySearch` em `openclaw.json`, salvo indicação em contrário.

<Note>
Se você está procurando a alternância de recurso de **Active Memory** e a configuração do subagente, isso fica em `plugins.entries.active-memory` em vez de `memorySearch`.

A Active Memory usa um modelo de duas etapas:

1. o plugin deve estar ativado e segmentar o ID atual do agente
2. a solicitação deve ser uma sessão de chat persistente interativa elegível

Veja [Active Memory](/pt-BR/concepts/active-memory) para o modelo de ativação, configuração de propriedade do plugin, persistência de transcrição e padrão de rollout seguro.
</Note>

---

## Seleção de provedor

| Chave      | Tipo      | Padrão          | Descrição                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | detectado automaticamente | ID do adaptador de embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | padrão do provedor | Nome do modelo de embedding                                                                                          |
| `fallback` | `string`  | `"none"`         | ID do adaptador de fallback quando o primário falha                                                                    |
| `enabled`  | `boolean` | `true`           | Ativa ou desativa a busca de memória                                                                               |

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
    Selecionado se uma chave do OpenAI puder ser resolvida.
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
  <Step title="bedrock">
    Selecionado se a cadeia de credenciais do AWS SDK for resolvida (função da instância, chaves de acesso, perfil, SSO, identidade web ou configuração compartilhada).
  </Step>
</Steps>

`ollama` é compatível, mas não é detectado automaticamente (defina-o explicitamente).

### Resolução de chave de API

Embeddings remotos exigem uma chave de API. O Bedrock usa a cadeia de credenciais padrão do AWS SDK no lugar disso (funções da instância, SSO, chaves de acesso).

| Provedor       | Variável de ambiente                             | Chave de configuração              |
| -------------- | ------------------------------------------------ | --------------------------------- |
| Bedrock        | cadeia de credenciais AWS                        | Nenhuma chave de API necessária   |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticação via login por dispositivo     |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                   | --                                |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`  |

<Note>
O OAuth do Codex cobre apenas chat/completions e não atende a solicitações de embedding.
</Note>

---

## Configuração de endpoint remoto

Para endpoints personalizados compatíveis com OpenAI ou para substituir os padrões do provedor:

<ParamField path="remote.baseUrl" type="string">
  URL base da API personalizada.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Substitui a chave de API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Headers HTTP extras (mesclados com os padrões do provedor).
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
    | `model`                | `string` | `gemini-embedding-001` | Também oferece suporte a `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 ou 3072        |

    <Warning>
    Alterar o modelo ou `outputDimensionality` aciona automaticamente uma reindexação completa.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    O Bedrock usa a cadeia de credenciais padrão do AWS SDK — nenhuma chave de API é necessária. Se o OpenClaw for executado no EC2 com uma função de instância com Bedrock habilitado, basta definir o provedor e o modelo:

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

    | Chave                  | Tipo     | Padrão                         | Descrição                     |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualquer ID de modelo de embedding do Bedrock  |
    | `outputDimensionality` | `number` | padrão do modelo               | Para Titan V2: 256, 512 ou 1024 |

    **Modelos compatíveis** (com detecção de família e padrões de dimensão):

    | ID do modelo                                | Provedor   | Dims padrão | Dims configuráveis   |
    | ------------------------------------------- | ---------- | ----------- | -------------------- |
    | `amazon.titan-embed-text-v2:0`              | Amazon     | 1024        | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`                | Amazon     | 1536        | --                   |
    | `amazon.titan-embed-g1-text-02`             | Amazon     | 1536        | --                   |
    | `amazon.titan-embed-image-v1`               | Amazon     | 1024        | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon     | 1024        | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                   | Cohere     | 1024        | --                   |
    | `cohere.embed-multilingual-v3`              | Cohere     | 1024        | --                   |
    | `cohere.embed-v4:0`                         | Cohere     | 1536        | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs | 512         | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs | 1024        | --                   |

    Variantes com sufixo de throughput (por exemplo, `amazon.titan-embed-text-v1:2:8k`) herdam a configuração do modelo base.

    **Autenticação:** a autenticação do Bedrock usa a ordem padrão de resolução de credenciais do AWS SDK:

    1. Variáveis de ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache de token SSO
    3. Credenciais de token de identidade web
    4. Arquivos compartilhados de credenciais e configuração
    5. Credenciais de metadados de ECS ou EC2

    A região é resolvida a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, da `baseUrl` do provedor `amazon-bedrock` ou assume o padrão `us-east-1`.

    **Permissões IAM:** a função ou usuário IAM precisa de:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Para menor privilégio, restrinja `InvokeModel` ao modelo específico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Chave                 | Tipo               | Padrão                 | Descrição                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | baixado automaticamente | Caminho para o arquivo do modelo GGUF                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | padrão do node-llama-cpp | Diretório de cache para modelos baixados                                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Tamanho da janela de contexto para o contexto de embedding. 4096 cobre chunks típicos (128–512 tokens) enquanto limita a VRAM não relacionada a pesos. Reduza para 1024–2048 em hosts com restrição. `"auto"` usa o máximo treinado do modelo — não recomendado para modelos 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM vs ~8,8 GB em 4096). |

    Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, baixado automaticamente). Exige build nativo: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

    Use a CLI independente para verificar o mesmo caminho de provedor que o Gateway usa:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Se `provider` for `auto`, `local` será selecionado somente quando `local.modelPath` apontar para um arquivo local existente. Referências de modelo `hf:` e HTTP(S) ainda podem ser usadas explicitamente com `provider: "local"`, mas elas não fazem `auto` selecionar o provedor local antes de o modelo estar disponível em disco.

  </Accordion>
</AccordionGroup>

### Tempo limite de embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Substitui o tempo limite para lotes de embedding inline durante a indexação de memória.

Se não estiver definido, usa o padrão do provedor: 600 segundos para provedores locais/autohospedados, como `local`, `ollama` e `lmstudio`, e 120 segundos para provedores hospedados. Aumente esse valor quando lotes de embedding locais limitados por CPU estiverem saudáveis, mas lentos.
</ParamField>

---

## Configuração de busca híbrida

Tudo em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                              |
| --------------------- | --------- | ------- | -------------------------------------- |
| `enabled`             | `boolean` | `true`  | Ativa a busca híbrida BM25 + vetorial |
| `vectorWeight`        | `number`  | `0.7`   | Peso para pontuações vetoriais (0-1)  |
| `textWeight`          | `number`  | `0.3`   | Peso para pontuações BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Multiplicador do tamanho do pool de candidatos |

<Tabs>
  <Tab title="MMR (diversidade)">
    | Chave         | Tipo      | Padrão | Descrição                                |
    | ------------- | --------- | ------- | ---------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Ativa a reclassificação por MMR          |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversidade máxima, 1 = relevância máxima |
  </Tab>
  <Tab title="Decaimento temporal (recência)">
    | Chave                        | Tipo      | Padrão | Descrição                     |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Ativa o impulso por recência |
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

| Chave      | Tipo       | Descrição                                  |
| ---------- | ---------- | ------------------------------------------ |
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

Os caminhos podem ser absolutos ou relativos ao workspace. Diretórios são verificados recursivamente em busca de arquivos `.md`. O tratamento de symlink depende do backend ativo: o mecanismo embutido ignora symlinks, enquanto o QMD segue o comportamento do scanner QMD subjacente.

Para busca de transcrição entre agentes com escopo por agente, use `agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`. Essas coleções extras seguem o mesmo formato `{ path, name, pattern? }`, mas são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho aponta para fora do workspace atual. Se o mesmo caminho resolvido aparecer tanto em `memory.qmd.paths` quanto em `memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a duplicata.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando Gemini Embedding 2:

| Chave                     | Tipo       | Padrão     | Descrição                                |
| ------------------------- | ---------- | ---------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Ativa a indexação multimodal             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamanho máximo de arquivo para indexação |

<Note>
Aplica-se apenas a arquivos em `extraPaths`. As raízes de memória padrão continuam sendo apenas Markdown. Exige `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.
</Note>

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embedding

| Chave              | Tipo      | Padrão | Descrição                            |
| ------------------ | --------- | ------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `false` | Armazena em cache embeddings de chunks no SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings em cache        |

Evita reembeddings de texto inalterado durante reindexação ou atualizações de transcrição.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão | Descrição                    |
| ----------------------------- | --------- | ------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Ativa a API de embedding em lote |
| `remote.batch.concurrency`    | `number`  | `2`     | Jobs em lote paralelos       |
| `remote.batch.wait`           | `boolean` | `true`  | Aguarda a conclusão do lote  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Intervalo de polling         |
| `remote.batch.timeoutMinutes` | `number`  | --      | Tempo limite do lote         |

Disponível para `openai`, `gemini` e `voyage`. O lote do OpenAI geralmente é o mais rápido e barato para grandes preenchimentos retroativos.

Isso é separado de `sync.embeddingBatchTimeoutSeconds`, que controla chamadas de embedding inline usadas por provedores locais/autohospedados e por provedores hospedados quando as APIs de lote do provedor não estão ativas.

---

## Busca de memória de sessão (experimental)

Indexe transcrições de sessão e as exponha por meio de `memory_search`:

| Chave                        | Tipo       | Padrão       | Descrição                                |
| ---------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Ativa a indexação de sessões             |
| `sources`                    | `string[]` | `["memory"]` | Adicione `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Limite de bytes para reindexação         |
| `sync.sessions.deltaMessages`| `number`   | `50`         | Limite de mensagens para reindexação     |

<Warning>
A indexação de sessões é opt-in e é executada de forma assíncrona. Os resultados podem estar ligeiramente desatualizados. Os logs de sessão ficam em disco, portanto trate o acesso ao sistema de arquivos como limite de confiança.
</Warning>

---

## Aceleração vetorial SQLite (sqlite-vec)

| Chave                      | Tipo      | Padrão | Descrição                              |
| -------------------------- | --------- | ------- | -------------------------------------- |
| `store.vector.enabled`     | `boolean` | `true`  | Usa sqlite-vec para consultas vetoriais |
| `store.vector.extensionPath` | `string` | agrupado | Substitui o caminho do sqlite-vec      |

Quando o sqlite-vec não está disponível, o OpenClaw recorre automaticamente à similaridade de cosseno em processo.

---

## Armazenamento do índice

| Chave                | Tipo     | Padrão                               | Descrição                                      |
| -------------------- | -------- | ------------------------------------- | ---------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Local do índice (oferece suporte ao token `{agentId}`) |
| `store.fts.tokenizer`| `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` ou `trigram`)      |

---

## Configuração do backend QMD

Defina `memory.backend = "qmd"` para ativar. Todas as configurações de QMD ficam em `memory.qmd`:

| Chave                    | Tipo      | Padrão   | Descrição                                     |
| ------------------------ | --------- | -------- | --------------------------------------------- |
| `command`                | `string`  | `qmd`    | Caminho do executável do QMD                  |
| `searchMode`             | `string`  | `search` | Comando de busca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Autoindexa `MEMORY.md` + `memory/**/*.md`     |
| `paths[]`                | `array`   | --       | Caminhos extras: `{ name, path, pattern? }`   |
| `sessions.enabled`       | `boolean` | `false`  | Indexa transcrições de sessão                 |
| `sessions.retentionDays` | `number`  | --       | Retenção de transcrições                      |
| `sessions.exportDir`     | `string`  | --       | Diretório de exportação                       |

O OpenClaw prefere os formatos atuais de coleção do QMD e de consulta MCP, mas mantém versões mais antigas do QMD funcionando ao recorrer, quando necessário, aos sinalizadores legados de coleção `--mask` e a nomes mais antigos de ferramentas MCP.

<Note>
Substituições de modelo do QMD permanecem no lado do QMD, não na configuração do OpenClaw. Se você precisar substituir os modelos do QMD globalmente, defina variáveis de ambiente como `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` no ambiente de runtime do gateway.
</Note>

<AccordionGroup>
  <Accordion title="Agenda de atualização">
    | Chave                   | Tipo      | Padrão | Descrição                                |
    | ----------------------- | --------- | ------- | ---------------------------------------- |
    | `update.interval`       | `string`  | `5m`    | Intervalo de atualização                 |
    | `update.debounceMs`     | `number`  | `15000` | Debounce para alterações de arquivo      |
    | `update.onBoot`         | `boolean` | `true`  | Atualiza na inicialização                |
    | `update.waitForBootSync`| `boolean` | `false` | Bloqueia a inicialização até a atualização terminar |
    | `update.embedInterval`  | `string`  | --      | Cadência separada para embedding         |
    | `update.commandTimeoutMs` | `number`| --      | Tempo limite para comandos do QMD        |
    | `update.updateTimeoutMs` | `number` | --      | Tempo limite para operações de atualização do QMD |
    | `update.embedTimeoutMs` | `number`  | --      | Tempo limite para operações de embedding do QMD |
  </Accordion>
  <Accordion title="Limites">
    | Chave                  | Tipo     | Padrão | Descrição                    |
    | ---------------------- | -------- | ------- | ---------------------------- |
    | `limits.maxResults`    | `number` | `6`     | Máximo de resultados de busca |
    | `limits.maxSnippetChars` | `number` | --    | Limita o comprimento do snippet |
    | `limits.maxInjectedChars` | `number` | --   | Limita o total de caracteres injetados |
    | `limits.timeoutMs`     | `number` | `4000`  | Tempo limite da busca        |
  </Accordion>
  <Accordion title="Escopo">
    Controla quais sessões podem receber resultados de busca do QMD. Mesmo schema de [`session.sendPolicy`](/pt-BR/gateway/config-agents#session):

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

    O padrão distribuído permite sessões diretas e de canal, enquanto continua negando grupos.

    O padrão é somente DM. `match.keyPrefix` corresponde à chave de sessão normalizada; `match.rawKeyPrefix` corresponde à chave bruta, incluindo `agent:<id>:`.

  </Accordion>
  <Accordion title="Citações">
    `memory.citations` se aplica a todos os backends:

    | Valor            | Comportamento                                         |
    | ---------------- | ----------------------------------------------------- |
    | `auto` (padrão)  | Inclui rodapé `Source: <path#line>` em snippets       |
    | `on`             | Sempre inclui o rodapé                                |
    | `off`            | Omite o rodapé (o caminho ainda é passado internamente ao agente) |

  </Accordion>
</AccordionGroup>

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

O Dreaming é executado como uma única varredura agendada e usa fases internas light/deep/REM como detalhe de implementação.

Para comportamento conceitual e comandos slash, veja [Dreaming](/pt-BR/concepts/dreaming).

### Configurações do usuário

| Chave       | Tipo      | Padrão      | Descrição                                      |
| ----------- | --------- | ----------- | ---------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Ativa ou desativa o Dreaming por completo      |
| `frequency` | `string`  | `0 3 * * *` | Cadência opcional de Cron para a varredura completa de Dreaming |

### Exemplo

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

<Note>
- O Dreaming grava o estado da máquina em `memory/.dreams/`.
- O Dreaming grava saída narrativa legível por humanos em `DREAMS.md` (ou `dreams.md`, se já existir).
- A política e os limites das fases light/deep/REM são comportamento interno, não configuração voltada ao usuário.
</Note>

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
