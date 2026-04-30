---
read_when:
    - Você está configurando o Plugin memory-lancedb incluído
    - Você quer memória de longo prazo baseada em LanceDB com recuperação automática ou captura automática
    - Você está usando embeddings locais compatíveis com a OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configure o Plugin de memória LanceDB incluído, incluindo embeddings locais compatíveis com Ollama
title: Memória LanceDB
x-i18n:
    generated_at: "2026-04-30T10:00:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` é um Plugin de memória incluído que armazena memória de longo prazo no
LanceDB e usa embeddings para recuperação. Ele pode recuperar automaticamente memórias
relevantes antes de uma rodada do modelo e capturar fatos importantes após uma resposta.

Use-o quando quiser um banco de dados vetorial local para memória, precisar de um
endpoint de embedding compatível com OpenAI ou quiser manter um banco de dados de memória fora
do armazenamento de memória integrado padrão.

<Note>
`memory-lancedb` é um Plugin de Active Memory. Habilite-o selecionando o slot de memória
com `plugins.slots.memory = "memory-lancedb"`. Plugins complementares como
`memory-wiki` podem ser executados ao lado dele, mas apenas um Plugin é dono do slot de Active Memory.
</Note>

## Início rápido

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Reinicie o Gateway após alterar a configuração do Plugin:

```bash
openclaw gateway restart
```

Em seguida, verifique se o Plugin foi carregado:

```bash
openclaw plugins list
```

## Embeddings com suporte de provedor

`memory-lancedb` pode usar os mesmos adaptadores de provedores de embeddings de memória que
`memory-core`. Defina `embedding.provider` e omita `embedding.apiKey` para usar o
perfil de autenticação configurado do provedor, a variável de ambiente ou
`models.providers.<provider>.apiKey`.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

Esse caminho funciona com perfis de autenticação de provedor que expõem credenciais de embedding.
Por exemplo, GitHub Copilot pode ser usado quando o perfil/plano do Copilot oferece suporte a
embeddings:

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) não é uma credencial de embeddings da OpenAI Platform.
Para embeddings da OpenAI, use um perfil de autenticação com chave de API da OpenAI,
`OPENAI_API_KEY` ou `models.providers.openai.apiKey`. Usuários somente com OAuth podem usar
outro provedor com suporte a embeddings, como GitHub Copilot ou Ollama.

## Embeddings do Ollama

Para embeddings do Ollama, prefira o provedor de embeddings Ollama incluído. Ele usa o
endpoint nativo `/api/embed` do Ollama e segue as mesmas regras de autenticação/URL base que
o provedor Ollama documentado em [Ollama](/pt-BR/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Defina `dimensions` para modelos de embedding não padrão. OpenClaw conhece as
dimensões de `text-embedding-3-small` e `text-embedding-3-large`; modelos personalizados
precisam do valor na configuração para que o LanceDB possa criar a coluna vetorial.

Para modelos de embedding locais pequenos, reduza `recallMaxChars` se encontrar erros de
tamanho de contexto vindos do servidor local.

## Provedores compatíveis com OpenAI

Alguns provedores de embeddings compatíveis com OpenAI rejeitam o parâmetro `encoding_format`,
enquanto outros o ignoram e sempre retornam vetores `number[]`.
Por isso, `memory-lancedb` omite `encoding_format` em solicitações de embedding e
aceita respostas em arrays de float ou respostas float32 codificadas em base64.

Se você tiver um endpoint bruto de embeddings compatível com OpenAI que não tenha um
adaptador de provedor incluído, omita `embedding.provider` (ou deixe como `openai`) e
defina `embedding.apiKey` mais `embedding.baseUrl`. Isso preserva o caminho direto
do cliente compatível com OpenAI.

Defina `embedding.dimensions` para provedores cujas dimensões de modelo não estão integradas.
Por exemplo, ZhiPu `embedding-3` usa `2048` dimensões:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Limites de recuperação e captura

`memory-lancedb` tem dois limites de texto separados:

| Configuração      | Padrão | Intervalo | Aplica-se a                                  |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | texto enviado à API de embedding para recuperação |
| `captureMaxChars` | `500`   | 100-10000 | tamanho da mensagem do assistente elegível para captura |

`recallMaxChars` controla a recuperação automática, a ferramenta `memory_recall`, o
caminho de consulta `memory_forget` e `openclaw ltm search`. A recuperação automática prefere a
mensagem mais recente do usuário na rodada e recorre ao prompt completo apenas quando nenhuma
mensagem do usuário está disponível. Isso mantém metadados de canal e grandes blocos de prompt
fora da solicitação de embedding.

`captureMaxChars` controla se uma resposta é curta o suficiente para ser considerada
para captura automática. Ele não limita embeddings de consulta de recuperação.

## Comandos

Quando `memory-lancedb` é o Plugin de memória ativo, ele registra o namespace `ltm` da CLI:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

O Plugin também estende `openclaw memory` com um subcomando `query` não vetorial
que é executado diretamente na tabela do LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: lista permitida de colunas separadas por vírgula (o padrão é `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: cláusula WHERE em estilo SQL; limitada a 200 caracteres e restrita a alfanuméricos, operadores de comparação, aspas, parênteses e um pequeno conjunto de pontuação segura.
- `--limit <n>`: inteiro positivo; padrão `10`.
- `--order-by <column>:<asc|desc>`: ordenação em memória aplicada após o filtro; a coluna de ordenação é incluída automaticamente na projeção.

Agentes também recebem ferramentas de memória do LanceDB a partir do Plugin de memória ativo:

- `memory_recall` para recuperação com suporte do LanceDB
- `memory_store` para salvar fatos importantes, preferências, decisões e entidades
- `memory_forget` para remover memórias correspondentes

## Armazenamento

Por padrão, os dados do LanceDB ficam em `~/.openclaw/memory/lancedb`. Substitua o
caminho com `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` aceita pares chave/valor de string para backends de armazenamento do LanceDB e
oferece suporte à expansão `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Dependências de runtime

`memory-lancedb` depende do pacote nativo `@lancedb/lancedb`. Instalações empacotadas
do OpenClaw primeiro tentam a dependência de runtime incluída e podem reparar a
dependência de runtime do Plugin no estado do OpenClaw quando a importação incluída não está
disponível.

Se uma instalação mais antiga registrar um erro de `dist/package.json` ausente ou
`@lancedb/lancedb` ausente durante o carregamento do Plugin, atualize o OpenClaw e reinicie o
Gateway.

Se o Plugin registrar que o LanceDB não está disponível em `darwin-x64`, use o backend de
memória padrão nessa máquina, mova o Gateway para uma plataforma compatível ou
desabilite `memory-lancedb`.

## Solução de problemas

### O tamanho da entrada excede o tamanho do contexto

Isso geralmente significa que o modelo de embedding rejeitou a consulta de recuperação:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Defina um `recallMaxChars` mais baixo e reinicie o Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Para Ollama, verifique também se o servidor de embedding está acessível pelo host do Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embedding sem suporte

Sem `dimensions`, apenas as dimensões integradas de embedding da OpenAI são conhecidas.
Para modelos de embedding locais ou personalizados, defina `embedding.dimensions` como o tamanho
do vetor informado por esse modelo.

### O Plugin carrega, mas nenhuma memória aparece

Verifique se `plugins.slots.memory` aponta para `memory-lancedb` e execute:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Se `autoCapture` estiver desabilitado, o Plugin recuperará memórias existentes, mas
não armazenará novas automaticamente. Use a ferramenta `memory_store` ou habilite
`autoCapture` se quiser captura automática.

## Relacionado

- [Visão geral de memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Memory Wiki](/pt-BR/plugins/memory-wiki)
- [Ollama](/pt-BR/providers/ollama)
