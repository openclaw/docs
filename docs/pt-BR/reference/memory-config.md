---
read_when:
    - Você quer configurar provedores de busca em memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar busca híbrida, MMR ou decaimento temporal
    - Você quer ativar indexação de memória multimodal
summary: Todos os ajustes de configuração para busca em memória, provedores de embedding, QMD, busca híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-04-06T03:12:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0de0b85125443584f4e575cf673ca8d9bd12ecd849d73c537f4a17545afa93fd
    source_path: reference/memory-config.md
    workflow: 15
---

# Referência de configuração de memória

Esta página lista todos os ajustes de configuração para a busca em memória do OpenClaw. Para
visões gerais conceituais, consulte:

- [Visão geral da memória](/pt-BR/concepts/memory) -- como a memória funciona
- [Mecanismo builtin](/pt-BR/concepts/memory-builtin) -- backend SQLite padrão
- [Mecanismo QMD](/pt-BR/concepts/memory-qmd) -- sidecar local-first
- [Busca em memória](/pt-BR/concepts/memory-search) -- pipeline de busca e ajuste

Todas as configurações de busca em memória ficam em `agents.defaults.memorySearch` no
`openclaw.json`, salvo indicação em contrário.

---

## Seleção de provedor

| Chave      | Tipo      | Padrão         | Descrição                                                                                     |
| ---------- | --------- | -------------- | --------------------------------------------------------------------------------------------- |
| `provider` | `string`  | detectado automaticamente | ID do adaptador de embedding: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | padrão do provedor | Nome do modelo de embedding                                                                  |
| `fallback` | `string`  | `"none"`       | ID do adaptador de fallback quando o primário falha                                          |
| `enabled`  | `boolean` | `true`         | Ativa ou desativa a busca em memória                                                         |

### Ordem de detecção automática

Quando `provider` não está definido, o OpenClaw seleciona o primeiro disponível:

1. `local` -- se `memorySearch.local.modelPath` estiver configurado e o arquivo existir.
2. `openai` -- se uma chave OpenAI puder ser resolvida.
3. `gemini` -- se uma chave Gemini puder ser resolvida.
4. `voyage` -- se uma chave Voyage puder ser resolvida.
5. `mistral` -- se uma chave Mistral puder ser resolvida.
6. `bedrock` -- se a cadeia de credenciais do SDK da AWS puder ser resolvida (role de instância, chaves de acesso, profile, SSO, web identity ou configuração compartilhada).

`ollama` é compatível, mas não é detectado automaticamente (defina-o explicitamente).

### Resolução de chave de API

Embeddings remotos exigem uma chave de API. O Bedrock usa a cadeia padrão de
credenciais do SDK da AWS em vez disso (roles de instância, SSO, chaves de acesso).

| Provedor | Variável env                  | Chave de configuração              |
| -------- | ----------------------------- | ---------------------------------- |
| OpenAI   | `OPENAI_API_KEY`              | `models.providers.openai.apiKey`   |
| Gemini   | `GEMINI_API_KEY`              | `models.providers.google.apiKey`   |
| Voyage   | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey`   |
| Mistral  | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey`  |
| Bedrock  | cadeia de credenciais AWS     | Nenhuma chave de API necessária    |
| Ollama   | `OLLAMA_API_KEY` (placeholder) | --                                |

O OAuth do Codex cobre apenas chat/completions e não atende requisições de embedding.

---

## Configuração de endpoint remoto

Para endpoints custom compatíveis com OpenAI ou para substituir padrões do provedor:

| Chave            | Tipo     | Descrição                                           |
| ---------------- | -------- | --------------------------------------------------- |
| `remote.baseUrl` | `string` | Base URL custom da API                              |
| `remote.apiKey`  | `string` | Substitui a chave de API                            |
| `remote.headers` | `object` | Cabeçalhos HTTP extras (mesclados com os padrões do provedor) |

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

## Configuração específica do Gemini

| Chave                  | Tipo     | Padrão                 | Descrição                                   |
| ---------------------- | -------- | ---------------------- | ------------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Também oferece suporte a `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 ou 3072         |

<Warning>
Alterar `model` ou `outputDimensionality` dispara uma reindexação completa automática.
</Warning>

---

## Configuração de embedding do Bedrock

O Bedrock usa a cadeia padrão de credenciais do SDK da AWS -- nenhuma chave de API é necessária.
Se o OpenClaw estiver sendo executado no EC2 com uma role de instância habilitada para Bedrock, basta definir o
provedor e o modelo:

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

| Chave                  | Tipo     | Padrão                         | Descrição                          |
| ---------------------- | -------- | ------------------------------ | ---------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualquer ID de modelo de embedding do Bedrock |
| `outputDimensionality` | `number` | padrão do modelo               | Para Titan V2: 256, 512 ou 1024    |

### Modelos compatíveis

Os seguintes modelos são compatíveis (com detecção de família e dimensões
padrão):

| ID do modelo                                | Provedor   | Dims padrão | Dims configuráveis    |
| ------------------------------------------- | ---------- | ----------- | --------------------- |
| `amazon.titan-embed-text-v2:0`              | Amazon     | 1024        | 256, 512, 1024        |
| `amazon.titan-embed-text-v1`                | Amazon     | 1536        | --                    |
| `amazon.titan-embed-g1-text-02`             | Amazon     | 1536        | --                    |
| `amazon.titan-embed-image-v1`               | Amazon     | 1024        | --                    |
| `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon     | 1024        | 256, 384, 1024, 3072  |
| `cohere.embed-english-v3`                   | Cohere     | 1024        | --                    |
| `cohere.embed-multilingual-v3`              | Cohere     | 1024        | --                    |
| `cohere.embed-v4:0`                         | Cohere     | 1536        | 256-1536              |
| `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs | 512         | --                    |
| `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs | 1024        | --                    |

Variantes com sufixo de throughput (por exemplo, `amazon.titan-embed-text-v1:2:8k`) herdam
a configuração do modelo base.

### Autenticação

A autenticação do Bedrock usa a ordem padrão de resolução de credenciais do SDK da AWS:

1. Variáveis de ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache de token SSO
3. Credenciais de token de web identity
4. Arquivos compartilhados de credenciais e configuração
5. Credenciais de metadados ECS ou EC2

A região é resolvida a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, da
`baseUrl` do provedor `amazon-bedrock` ou assume o padrão `us-east-1`.

### Permissões IAM

A role ou usuário IAM precisa de:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Para privilégio mínimo, limite `InvokeModel` ao modelo específico:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Configuração de embedding local

| Chave                 | Tipo     | Padrão                 | Descrição                           |
| --------------------- | -------- | ---------------------- | ----------------------------------- |
| `local.modelPath`     | `string` | baixado automaticamente | Caminho para o arquivo de modelo GGUF |
| `local.modelCacheDir` | `string` | padrão do node-llama-cpp | Diretório de cache para modelos baixados |

Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, baixado automaticamente).
Exige build nativa: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

---

## Configuração de busca híbrida

Tudo em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                              |
| --------------------- | --------- | ------ | -------------------------------------- |
| `enabled`             | `boolean` | `true` | Ativa a busca híbrida BM25 + vetorial  |
| `vectorWeight`        | `number`  | `0.7`  | Peso para pontuações vetoriais (0-1)   |
| `textWeight`          | `number`  | `0.3`  | Peso para pontuações BM25 (0-1)        |
| `candidateMultiplier` | `number`  | `4`    | Multiplicador do tamanho do pool de candidatos |

### MMR (diversidade)

| Chave         | Tipo      | Padrão | Descrição                                |
| ------------- | --------- | ------ | ---------------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Ativa reclassificação MMR                |
| `mmr.lambda`  | `number`  | `0.7`  | 0 = diversidade máxima, 1 = relevância máxima |

### Decaimento temporal (recência)

| Chave                        | Tipo      | Padrão | Descrição                         |
| ---------------------------- | --------- | ------ | --------------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Ativa impulso de recência         |
| `temporalDecay.halfLifeDays` | `number`  | `30`   | A pontuação cai pela metade a cada N dias |

Arquivos perenes (`MEMORY.md`, arquivos sem data em `memory/`) nunca sofrem decaimento.

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

| Chave        | Tipo       | Descrição                                 |
| ------------ | ---------- | ----------------------------------------- |
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

Os caminhos podem ser absolutos ou relativos ao workspace. Diretórios são varridos
recursivamente em busca de arquivos `.md`. O tratamento de symlink depende do backend ativo:
o mecanismo builtin ignora symlinks, enquanto o QMD segue o comportamento subjacente
do scanner do QMD.

Para busca de transcrições entre agentes com escopo de agente, use
`agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`.
Essas coleções extras seguem o mesmo formato `{ path, name, pattern? }`, mas
são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho
aponta para fora do workspace atual.
Se o mesmo caminho resolvido aparecer em `memory.qmd.paths` e
`memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a
duplicada.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando Gemini Embedding 2:

| Chave                     | Tipo       | Padrão     | Descrição                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Ativa indexação multimodal                 |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]`      |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamanho máximo de arquivo para indexação   |

Aplica-se apenas a arquivos em `extraPaths`. As raízes de memória padrão continuam apenas com Markdown.
Exige `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embedding

| Chave              | Tipo      | Padrão | Descrição                          |
| ------------------ | --------- | ------ | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Armazena embeddings de chunks em cache no SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings em cache      |

Evita refazer embeddings de texto inalterado durante reindexação ou atualizações de transcrição.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão | Descrição                   |
| ----------------------------- | --------- | ------ | --------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Ativa API de embedding em lote |
| `remote.batch.concurrency`    | `number`  | `2`    | Trabalhos em lote paralelos |
| `remote.batch.wait`           | `boolean` | `true` | Aguarda a conclusão do lote |
| `remote.batch.pollIntervalMs` | `number`  | --     | Intervalo de polling        |
| `remote.batch.timeoutMinutes` | `number`  | --     | Timeout do lote             |

Disponível para `openai`, `gemini` e `voyage`. O lote do OpenAI normalmente é
o mais rápido e barato para grandes preenchimentos retroativos.

---

## Busca em memória de sessão (experimental)

Indexe transcrições de sessão e exponha-as via `memory_search`:

| Chave                       | Tipo       | Padrão       | Descrição                                  |
| --------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`| `boolean`  | `false`      | Ativa indexação de sessão                  |
| `sources`                   | `string[]` | `["memory"]` | Adicione `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`  | `number`   | `100000`     | Limite de bytes para reindexação           |
| `sync.sessions.deltaMessages` | `number` | `50`         | Limite de mensagens para reindexação       |

A indexação de sessão é opt-in e é executada de forma assíncrona. Os resultados podem estar
ligeiramente desatualizados. Os logs de sessão ficam no disco, então trate o acesso ao sistema de arquivos como o
limite de confiança.

---

## Aceleração vetorial SQLite (sqlite-vec)

| Chave                        | Tipo      | Padrão  | Descrição                          |
| ---------------------------- | --------- | ------- | ---------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Usa sqlite-vec para consultas vetoriais |
| `store.vector.extensionPath` | `string`  | empacotado | Substitui o caminho do sqlite-vec  |

Quando o sqlite-vec não está disponível, o OpenClaw recorre automaticamente à
similaridade de cosseno em processo.

---

## Armazenamento do índice

| Chave               | Tipo     | Padrão                               | Descrição                                      |
| ------------------- | -------- | ------------------------------------ | ---------------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Localização do índice (oferece suporte ao token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Tokenizer FTS5 (`unicode61` ou `trigram`)      |

---

## Configuração do backend QMD

Defina `memory.backend = "qmd"` para ativar. Todas as configurações do QMD ficam em
`memory.qmd`:

| Chave                    | Tipo      | Padrão   | Descrição                                    |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Caminho do executável QMD                    |
| `searchMode`             | `string`  | `search` | Comando de busca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexa automaticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Caminhos extras: `{ name, path, pattern? }`  |
| `sessions.enabled`       | `boolean` | `false`  | Indexa transcrições de sessão                |
| `sessions.retentionDays` | `number`  | --       | Retenção de transcrições                     |
| `sessions.exportDir`     | `string`  | --       | Diretório de exportação                      |

O OpenClaw prefere os formatos atuais de coleção do QMD e de consulta MCP, mas mantém
releases mais antigos do QMD funcionando ao recorrer às flags legadas de coleção `--mask`
e a nomes antigos de ferramentas MCP quando necessário.

As substituições de modelo do QMD ficam do lado do QMD, não na configuração do OpenClaw. Se você precisar
substituir os modelos do QMD globalmente, defina variáveis de ambiente como
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` no ambiente de
runtime do gateway.

### Agenda de atualização

| Chave                     | Tipo      | Padrão  | Descrição                                |
| ------------------------- | --------- | ------- | ---------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Intervalo de atualização                 |
| `update.debounceMs`       | `number`  | `15000` | Debounce de alterações de arquivo        |
| `update.onBoot`           | `boolean` | `true`  | Atualiza na inicialização                |
| `update.waitForBootSync`  | `boolean` | `false` | Bloqueia a inicialização até a atualização terminar |
| `update.embedInterval`    | `string`  | --      | Cadência separada de embeddings          |
| `update.commandTimeoutMs` | `number`  | --      | Timeout para comandos QMD                |
| `update.updateTimeoutMs`  | `number`  | --      | Timeout para operações `qmd update`      |
| `update.embedTimeoutMs`   | `number`  | --      | Timeout para operações `qmd embed`       |

### Limites

| Chave                     | Tipo     | Padrão | Descrição                       |
| ------------------------- | -------- | ------ | ------------------------------- |
| `limits.maxResults`       | `number` | `6`    | Máximo de resultados de busca   |
| `limits.maxSnippetChars`  | `number` | --     | Limita o tamanho do trecho      |
| `limits.maxInjectedChars` | `number` | --     | Limita o total de caracteres injetados |
| `limits.timeoutMs`        | `number` | `4000` | Timeout da busca                |

### Escopo

Controla quais sessões podem receber resultados de busca do QMD. Mesmo schema de
[`session.sendPolicy`](/pt-BR/gateway/configuration-reference#session):

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

O padrão é apenas DM. `match.keyPrefix` corresponde à chave de sessão normalizada;
`match.rawKeyPrefix` corresponde à chave bruta incluindo `agent:<id>:`.

### Citações

`memory.citations` aplica-se a todos os backends:

| Valor            | Comportamento                                         |
| ---------------- | ----------------------------------------------------- |
| `auto` (padrão)  | Inclui rodapé `Source: <path#line>` nos trechos       |
| `on`             | Sempre inclui o rodapé                                |
| `off`            | Omite o rodapé (o caminho ainda é passado internamente ao agente) |

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

## Dreaming (experimental)

Dreaming é configurado em `plugins.entries.memory-core.config.dreaming`,
não em `agents.defaults.memorySearch`.

O Dreaming é executado como uma única varredura agendada e usa fases internas light/deep/REM como
detalhe de implementação.

Para comportamento conceitual e comandos slash, consulte [Dreaming](/concepts/dreaming).

### Configurações do usuário

| Chave       | Tipo      | Padrão      | Descrição                                      |
| ----------- | --------- | ----------- | ---------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Ativa ou desativa totalmente o dreaming        |
| `frequency` | `string`  | `0 3 * * *` | Cadência cron opcional para a varredura completa de dreaming |

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

Observações:

- O Dreaming grava o estado da máquina em `memory/.dreams/`.
- O Dreaming grava a saída narrativa legível por humanos em `DREAMS.md` (ou em um `dreams.md` existente).
- A política e os limites das fases light/deep/REM são comportamento interno, não configuração voltada ao usuário.
