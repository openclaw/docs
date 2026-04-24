---
read_when:
    - Você quer configurar provedores de busca de memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar busca híbrida, MMR ou decaimento temporal
    - Você quer habilitar indexação multimodal de memória
summary: Todos os controles de configuração para busca de memória, provedores de embedding, QMD, busca híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-04-24T06:10:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Esta página lista todos os controles de configuração para busca de memória do OpenClaw. Para
visões gerais conceituais, consulte:

- [Visão geral de Memory](/pt-BR/concepts/memory) -- como a memória funciona
- [Mecanismo integrado](/pt-BR/concepts/memory-builtin) -- backend SQLite padrão
- [Mecanismo QMD](/pt-BR/concepts/memory-qmd) -- sidecar local-first
- [Busca de memória](/pt-BR/concepts/memory-search) -- pipeline de busca e ajustes
- [Active Memory](/pt-BR/concepts/active-memory) -- habilitando o subagente de memória para sessões interativas

Todas as configurações de busca de memória ficam em `agents.defaults.memorySearch` em
`openclaw.json`, salvo indicação em contrário.

Se você estiver procurando o toggle do recurso de **Active Memory** e a configuração do subagente,
isso fica em `plugins.entries.active-memory`, e não em `memorySearch`.

A Active Memory usa um modelo de dois portões:

1. o Plugin deve estar habilitado e apontar para o ID do agente atual
2. a solicitação deve ser uma sessão de chat interativa persistente elegível

Consulte [Active Memory](/pt-BR/concepts/active-memory) para o modelo de ativação,
configuração controlada pelo Plugin, persistência da transcrição e padrão seguro de rollout.

---

## Seleção de provedor

| Chave     | Tipo      | Padrão           | Descrição                                                                                                      |
| --------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | detectado automaticamente | ID do adapter de embeddings: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`   | `string`  | padrão do provedor | Nome do modelo de embeddings                                                                                 |
| `fallback` | `string` | `"none"`         | ID do adapter de fallback quando o principal falhar                                                           |
| `enabled` | `boolean` | `true`           | Habilitar ou desabilitar a busca de memória                                                                   |

### Ordem de detecção automática

Quando `provider` não está definido, o OpenClaw seleciona o primeiro disponível:

1. `local` -- se `memorySearch.local.modelPath` estiver configurado e o arquivo existir.
2. `github-copilot` -- se um token do GitHub Copilot puder ser resolvido (variável de ambiente ou perfil de autenticação).
3. `openai` -- se uma chave da OpenAI puder ser resolvida.
4. `gemini` -- se uma chave do Gemini puder ser resolvida.
5. `voyage` -- se uma chave do Voyage puder ser resolvida.
6. `mistral` -- se uma chave do Mistral puder ser resolvida.
7. `bedrock` -- se a cadeia de credenciais do AWS SDK puder ser resolvida (função de instância, chaves de acesso, perfil, SSO, identidade web ou configuração compartilhada).

`ollama` é compatível, mas não é detectado automaticamente (defina-o explicitamente).

### Resolução de chave de API

Embeddings remotos exigem uma chave de API. O Bedrock usa a cadeia padrão de
credenciais do AWS SDK em vez disso (funções de instância, SSO, chaves de acesso).

| Provedor       | Variável de ambiente                              | Chave de configuração              |
| -------------- | ------------------------------------------------- | ---------------------------------- |
| Bedrock        | cadeia de credenciais AWS                         | Nenhuma chave de API necessária    |
| Gemini         | `GEMINI_API_KEY`                                  | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Perfil de autenticação via login no dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                 | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                    | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                  | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                  | `models.providers.voyage.apiKey`   |

OAuth do Codex cobre apenas chat/completions e não atende solicitações de embeddings.

---

## Configuração de endpoint remoto

Para endpoints personalizados compatíveis com OpenAI ou para substituir padrões do provedor:

| Chave            | Tipo     | Descrição                                  |
| ---------------- | -------- | ------------------------------------------ |
| `remote.baseUrl` | `string` | URL base personalizada da API              |
| `remote.apiKey`  | `string` | Substituir chave de API                    |
| `remote.headers` | `object` | Headers HTTP extras (mesclados com os padrões do provedor) |

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

| Chave                  | Tipo     | Padrão                | Descrição                                  |
| ---------------------- | -------- | --------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Também oferece suporte a `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                | Para Embedding 2: 768, 1536 ou 3072        |

<Warning>
Alterar o modelo ou `outputDimensionality` aciona automaticamente uma reindexação completa.
</Warning>

---

## Configuração de embeddings do Bedrock

O Bedrock usa a cadeia padrão de credenciais do AWS SDK -- nenhuma chave de API é necessária.
Se o OpenClaw estiver em execução no EC2 com uma função de instância com Bedrock habilitado, basta definir o
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

| Chave                  | Tipo     | Padrão                        | Descrição                           |
| ---------------------- | -------- | ----------------------------- | ----------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualquer ID de modelo de embedding Bedrock |
| `outputDimensionality` | `number` | padrão do modelo              | Para Titan V2: 256, 512 ou 1024     |

### Modelos compatíveis

Os modelos a seguir são compatíveis (com detecção de família e padrões de dimensão):

| ID do modelo                                 | Provedor   | Dims padrão | Dims configuráveis     |
| -------------------------------------------- | ---------- | ----------- | ---------------------- |
| `amazon.titan-embed-text-v2:0`               | Amazon     | 1024        | 256, 512, 1024         |
| `amazon.titan-embed-text-v1`                 | Amazon     | 1536        | --                     |
| `amazon.titan-embed-g1-text-02`              | Amazon     | 1536        | --                     |
| `amazon.titan-embed-image-v1`                | Amazon     | 1024        | --                     |
| `amazon.nova-2-multimodal-embeddings-v1:0`   | Amazon     | 1024        | 256, 384, 1024, 3072   |
| `cohere.embed-english-v3`                    | Cohere     | 1024        | --                     |
| `cohere.embed-multilingual-v3`               | Cohere     | 1024        | --                     |
| `cohere.embed-v4:0`                          | Cohere     | 1536        | 256-1536               |
| `twelvelabs.marengo-embed-3-0-v1:0`          | TwelveLabs | 512         | --                     |
| `twelvelabs.marengo-embed-2-7-v1:0`          | TwelveLabs | 1024        | --                     |

Variantes com sufixo de throughput (por exemplo, `amazon.titan-embed-text-v1:2:8k`) herdam
a configuração do modelo base.

### Autenticação

A autenticação do Bedrock usa a ordem padrão de resolução de credenciais do AWS SDK:

1. Variáveis de ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache de token SSO
3. Credenciais de token de identidade web
4. Arquivos compartilhados de credenciais e configuração
5. Credenciais de metadados ECS ou EC2

A região é resolvida a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, do
`baseUrl` do provedor `amazon-bedrock`, ou usa `us-east-1` como padrão.

### Permissões IAM

A função ou usuário IAM precisa de:

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

---

## Configuração de embeddings locais

| Chave                 | Tipo                 | Padrão                 | Descrição                                                                                                                                                                                                                                                                                                           |
| --------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`             | baixado automaticamente | Caminho para o arquivo do modelo GGUF                                                                                                                                                                                                                                                                               |
| `local.modelCacheDir` | `string`             | padrão do node-llama-cpp | Diretório de cache para modelos baixados                                                                                                                                                                                                                                                                          |
| `local.contextSize`   | `number \| "auto"`   | `4096`                 | Tamanho da janela de contexto para o contexto de embeddings. 4096 cobre chunks típicos (128–512 tokens) enquanto limita VRAM não ponderada. Reduza para 1024–2048 em hosts restritos. `"auto"` usa o máximo treinado do modelo — não recomendado para modelos 8B+ (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB de VRAM vs ~8,8 GB em 4096). |

Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, baixado automaticamente).
Exige build nativo: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

Use a CLI independente para verificar o mesmo caminho de provedor que o Gateway usa:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Se `provider` for `auto`, `local` será selecionado apenas quando `local.modelPath` apontar
para um arquivo local existente. Referências de modelo `hf:` e HTTP(S) ainda podem ser usadas
explicitamente com `provider: "local"`, mas não fazem `auto` selecionar local
antes de o modelo estar disponível em disco.

---

## Configuração de busca híbrida

Tudo em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                           |
| --------------------- | --------- | ------ | ----------------------------------- |
| `enabled`             | `boolean` | `true` | Habilitar busca híbrida BM25 + vetorial |
| `vectorWeight`        | `number`  | `0.7`  | Peso para pontuações vetoriais (0-1) |
| `textWeight`          | `number`  | `0.3`  | Peso para pontuações BM25 (0-1)     |
| `candidateMultiplier` | `number`  | `4`    | Multiplicador do tamanho do pool de candidatos |

### MMR (diversidade)

| Chave         | Tipo      | Padrão | Descrição                           |
| ------------- | --------- | ------ | ----------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Habilitar reclassificação por MMR   |
| `mmr.lambda`  | `number`  | `0.7`  | 0 = diversidade máxima, 1 = relevância máxima |

### Decaimento temporal (recência)

| Chave                        | Tipo      | Padrão | Descrição                    |
| ---------------------------- | --------- | ------ | ---------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Habilitar boost de recência |
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

## Caminhos adicionais de memória

| Chave       | Tipo       | Descrição                                   |
| ----------- | ---------- | ------------------------------------------- |
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
o mecanismo integrado ignora symlinks, enquanto o QMD segue o comportamento do
scanner QMD subjacente.

Para busca de transcrição entre agentes com escopo por agente, use
`agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`.
Essas coleções extras seguem o mesmo formato `{ path, name, pattern? }`, mas
são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho
aponta para fora do workspace atual.
Se o mesmo caminho resolvido aparecer em `memory.qmd.paths` e
`memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a
duplicata.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando Gemini Embedding 2:

| Chave                     | Tipo       | Padrão     | Descrição                               |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilitar indexação multimodal          |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamanho máximo de arquivo para indexação |

Aplica-se apenas a arquivos em `extraPaths`. As raízes padrão de memória permanecem apenas em Markdown.
Exige `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embeddings

| Chave              | Tipo      | Padrão | Descrição                              |
| ------------------ | --------- | ------ | -------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Armazenar embeddings de chunk em cache no SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings em cache         |

Evita re-embedding de texto inalterado durante reindexação ou atualizações de transcrição.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão | Descrição                   |
| ----------------------------- | --------- | ------ | --------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Habilitar API de embeddings em lote |
| `remote.batch.concurrency`    | `number`  | `2`    | Jobs paralelos em lote      |
| `remote.batch.wait`           | `boolean` | `true` | Esperar conclusão do lote   |
| `remote.batch.pollIntervalMs` | `number`  | --     | Intervalo de polling        |
| `remote.batch.timeoutMinutes` | `number`  | --     | Timeout do lote             |

Disponível para `openai`, `gemini` e `voyage`. O lote do OpenAI normalmente é o
mais rápido e mais barato para grandes backfills.

---

## Busca de memória de sessão (experimental)

Indexe transcrições de sessão e as exponha via `memory_search`:

| Chave                        | Tipo       | Padrão       | Descrição                                  |
| ---------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory` | `boolean`  | `false`      | Habilitar indexação de sessão              |
| `sources`                    | `string[]` | `["memory"]` | Adicione `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Limite em bytes para reindexação           |
| `sync.sessions.deltaMessages` | `number`  | `50`         | Limite em mensagens para reindexação       |

A indexação de sessão é opt-in e roda de forma assíncrona. Os resultados podem ficar
ligeiramente desatualizados. Logs de sessão ficam em disco, então trate o acesso ao sistema de arquivos como limite de confiança.

---

## Aceleração vetorial SQLite (sqlite-vec)

| Chave                        | Tipo      | Padrão | Descrição                            |
| ---------------------------- | --------- | ------ | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true` | Usar sqlite-vec para consultas vetoriais |
| `store.vector.extensionPath` | `string`  | incluído | Substituir caminho do sqlite-vec    |

Quando sqlite-vec não está disponível, o OpenClaw usa automaticamente fallback para
similaridade de cosseno in-process.

---

## Armazenamento do índice

| Chave               | Tipo     | Padrão                               | Descrição                                    |
| ------------------- | -------- | ------------------------------------ | -------------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Local do índice (oferece suporte ao token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                        | Tokenizer FTS5 (`unicode61` ou `trigram`)    |

---

## Configuração do backend QMD

Defina `memory.backend = "qmd"` para habilitar. Todas as configurações de QMD ficam em
`memory.qmd`:

| Chave                    | Tipo      | Padrão   | Descrição                                     |
| ------------------------ | --------- | -------- | --------------------------------------------- |
| `command`                | `string`  | `qmd`    | Caminho do executável QMD                     |
| `searchMode`             | `string`  | `search` | Comando de busca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Autoindexar `MEMORY.md` + `memory/**/*.md`    |
| `paths[]`                | `array`   | --       | Caminhos extras: `{ name, path, pattern? }`   |
| `sessions.enabled`       | `boolean` | `false`  | Indexar transcrições de sessão                |
| `sessions.retentionDays` | `number`  | --       | Retenção de transcrição                       |
| `sessions.exportDir`     | `string`  | --       | Diretório de exportação                       |

O OpenClaw prefere os formatos atuais de coleção QMD e de consulta MCP, mas mantém
versões mais antigas do QMD funcionando usando fallback para flags legadas de coleção `--mask`
e nomes mais antigos de ferramentas MCP quando necessário.

Substituições de modelo QMD permanecem do lado do QMD, não na configuração do OpenClaw. Se você precisar
substituir globalmente os modelos do QMD, defina variáveis de ambiente como
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` no ambiente de runtime do gateway.

### Agenda de atualização

| Chave                     | Tipo      | Padrão | Descrição                             |
| ------------------------- | --------- | ------ | ------------------------------------- |
| `update.interval`         | `string`  | `5m`   | Intervalo de atualização              |
| `update.debounceMs`       | `number`  | `15000` | Debounce de alterações em arquivo    |
| `update.onBoot`           | `boolean` | `true` | Atualizar na inicialização            |
| `update.waitForBootSync`  | `boolean` | `false` | Bloquear a inicialização até a atualização concluir |
| `update.embedInterval`    | `string`  | --     | Cadência separada para embeddings     |
| `update.commandTimeoutMs` | `number`  | --     | Timeout para comandos QMD             |
| `update.updateTimeoutMs`  | `number`  | --     | Timeout para operações de update do QMD |
| `update.embedTimeoutMs`   | `number`  | --     | Timeout para operações de embedding do QMD |

### Limites

| Chave                     | Tipo     | Padrão | Descrição                    |
| ------------------------- | -------- | ------ | ---------------------------- |
| `limits.maxResults`       | `number` | `6`    | Máximo de resultados de busca |
| `limits.maxSnippetChars`  | `number` | --     | Limitar tamanho do snippet   |
| `limits.maxInjectedChars` | `number` | --     | Limitar total de caracteres injetados |
| `limits.timeoutMs`        | `number` | `4000` | Timeout da busca             |

### Escopo

Controla quais sessões podem receber resultados de busca do QMD. Mesmo schema de
[`session.sendPolicy`](/pt-BR/gateway/config-agents#session):

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

O padrão enviado permite sessões diretas e de canal, enquanto ainda nega
grupos.

O padrão é apenas DM. `match.keyPrefix` corresponde à session key normalizada;
`match.rawKeyPrefix` corresponde à chave bruta incluindo `agent:<id>:`.

### Citações

`memory.citations` se aplica a todos os backends:

| Valor            | Comportamento                                         |
| ---------------- | ----------------------------------------------------- |
| `auto` (padrão)  | Inclui rodapé `Source: <path#line>` nos snippets      |
| `on`             | Sempre inclui rodapé                                  |
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

## Dreaming

Dreaming é configurado em `plugins.entries.memory-core.config.dreaming`,
não em `agents.defaults.memorySearch`.

Dreaming roda como uma varredura agendada única e usa fases internas light/deep/REM como
detalhe de implementação.

Para comportamento conceitual e comandos slash, consulte [Dreaming](/pt-BR/concepts/dreaming).

### Configurações do usuário

| Chave       | Tipo      | Padrão      | Descrição                                      |
| ----------- | --------- | ----------- | ---------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Habilitar ou desabilitar totalmente o Dreaming |
| `frequency` | `string`  | `0 3 * * *` | Cadência Cron opcional para a varredura completa de Dreaming |

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

- Dreaming grava estado de máquina em `memory/.dreams/`.
- Dreaming grava saída narrativa legível por humanos em `DREAMS.md` (ou `dreams.md` existente).
- A política e os limites das fases light/deep/REM são comportamento interno, não configuração voltada ao usuário.

## Relacionado

- [Visão geral de Memory](/pt-BR/concepts/memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Referência de Configuração](/pt-BR/gateway/configuration-reference)
