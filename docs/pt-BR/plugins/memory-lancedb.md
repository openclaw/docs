---
read_when:
    - Você está configurando o plugin memory-lancedb
    - Você quer memória de longo prazo baseada em LanceDB com recuperação automática ou captura automática
    - Você está usando embeddings locais compatíveis com OpenAI, como Ollama
sidebarTitle: Memory LanceDB
summary: Configure o Plugin oficial externo de memória LanceDB, incluindo embeddings locais compatíveis com Ollama
title: Memória LanceDB
x-i18n:
    generated_at: "2026-06-27T17:48:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` é um plugin oficial externo de memória que armazena memória de longo prazo no
LanceDB e usa embeddings para recuperação. Ele pode recuperar automaticamente memórias
relevantes antes de uma rodada do modelo e capturar fatos importantes após uma resposta.

Use-o quando quiser um banco de dados vetorial local para memória, precisar de um
endpoint de embeddings compatível com OpenAI ou quiser manter um banco de dados de memória fora
do armazenamento de memória integrado padrão.

## Instalação

Instale `memory-lancedb` antes de definir `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

O plugin é publicado no npm e não é empacotado na imagem de runtime do OpenClaw.
O instalador grava a entrada do plugin e troca o slot de memória quando nenhum outro
plugin o possui.

<Note>
`memory-lancedb` é um plugin de memória ativa. Habilite-o selecionando o slot de memória
com `plugins.slots.memory = "memory-lancedb"`. Plugins complementares, como
`memory-wiki`, podem ser executados ao lado dele, mas apenas um plugin possui o slot de memória ativa.
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

Reinicie o Gateway depois de alterar a configuração do plugin:

```bash
openclaw gateway restart
```

Em seguida, verifique se o plugin foi carregado:

```bash
openclaw plugins list
```

## Embeddings baseados em provedor

`memory-lancedb` pode usar os mesmos adaptadores de provedor de embeddings de memória que
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

Esse caminho funciona com perfis de autenticação de provedor que expõem credenciais de embeddings.
Por exemplo, o GitHub Copilot pode ser usado quando o perfil/plano do Copilot oferece suporte a
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

OAuth do OpenAI Codex / ChatGPT não é uma credencial de embeddings da OpenAI Platform.
Para embeddings da OpenAI, use um perfil de autenticação com chave de API da OpenAI,
`OPENAI_API_KEY` ou `models.providers.openai.apiKey`. Usuários somente com OAuth podem usar
outro provedor compatível com embeddings, como GitHub Copilot ou Ollama.

## Embeddings do Ollama

Para embeddings do Ollama, prefira o provedor de embeddings Ollama empacotado. Ele usa o
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

Defina `dimensions` para modelos de embeddings não padrão. O OpenClaw conhece as
dimensões de `text-embedding-3-small` e `text-embedding-3-large`; modelos
personalizados precisam do valor na configuração para que o LanceDB possa criar a coluna vetorial.

Para modelos locais pequenos de embeddings, reduza `recallMaxChars` se vir erros de
comprimento de contexto vindos do servidor local.

## Provedores compatíveis com OpenAI

Alguns provedores de embeddings compatíveis com OpenAI rejeitam o parâmetro `encoding_format`,
enquanto outros o ignoram e sempre retornam vetores `number[]`.
Por isso, `memory-lancedb` omite `encoding_format` em solicitações de embeddings e
aceita respostas como arrays de floats ou respostas float32 codificadas em base64.

Se você tiver um endpoint bruto de embeddings compatível com OpenAI que não tenha um
adaptador de provedor empacotado, omita `embedding.provider` (ou deixe-o como `openai`) e
defina `embedding.apiKey` mais `embedding.baseUrl`. Isso preserva o caminho direto do
cliente compatível com OpenAI.

Defina `embedding.dimensions` para provedores cujas dimensões de modelo não estejam integradas.
Por exemplo, o ZhiPu `embedding-3` usa `2048` dimensões:

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

| Configuração      | Padrão | Intervalo | Aplica-se a                                              |
| ----------------- | ------ | --------- | -------------------------------------------------------- |
| `recallMaxChars`  | `1000` | 100-10000 | texto enviado à API de embeddings para recuperação       |
| `captureMaxChars` | `500`  | 100-10000 | tamanho de mensagem qualificado para captura automática  |
| `customTriggers`  | `[]`   | 0-50      | frases literais que fazem a captura automática considerar uma mensagem |

`recallMaxChars` controla a recuperação automática, a ferramenta `memory_recall`, o
caminho de consulta `memory_forget` e `openclaw ltm search`. A recuperação automática prefere a
mensagem mais recente do usuário na rodada e recorre ao prompt completo somente quando nenhuma
mensagem do usuário está disponível. Isso mantém metadados de canal e grandes blocos de prompt
fora da solicitação de embeddings.

`captureMaxChars` controla se uma resposta é curta o suficiente para ser considerada
para captura automática. Ele não limita embeddings de consulta de recuperação.

`customTriggers` permite adicionar frases literais de captura automática sem escrever
expressões regulares. Os gatilhos integrados incluem frases comuns de memória em inglês, tcheco,
chinês, japonês e coreano.

## Comandos

Quando `memory-lancedb` é o plugin de memória ativa, ele registra o namespace de CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

O subcomando `query` executa uma consulta não vetorial diretamente contra a tabela do LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: lista permitida de colunas separadas por vírgulas (o padrão é `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: cláusula WHERE em estilo SQL; limitada a 200 caracteres e restrita a alfanuméricos, operadores de comparação, aspas, parênteses e um pequeno conjunto de pontuação segura.
- `--limit <n>`: inteiro positivo; padrão `10`.
- `--order-by <column>:<asc|desc>`: ordenação em memória aplicada após o filtro; a coluna de ordenação é incluída automaticamente na projeção.

Os agentes também recebem ferramentas de memória do LanceDB do plugin de memória ativa:

- `memory_recall` para recuperação baseada no LanceDB
- `memory_store` para salvar fatos, preferências, decisões e entidades importantes
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

`memory-lancedb` depende do pacote nativo `@lancedb/lancedb`. O OpenClaw empacotado
trata esse pacote como parte do pacote do plugin. A inicialização do Gateway
não repara dependências de plugins; se a dependência estiver ausente, reinstale ou
atualize o pacote do plugin e reinicie o Gateway.

Se uma instalação mais antiga registrar um erro de `dist/package.json` ausente ou
`@lancedb/lancedb` ausente durante o carregamento do plugin, atualize o OpenClaw e reinicie o
Gateway.

Se o plugin registrar que o LanceDB está indisponível em `darwin-x64`, use o backend de
memória padrão nessa máquina, mova o Gateway para uma plataforma compatível ou
desabilite `memory-lancedb`.

## Solução de problemas

### O comprimento da entrada excede o comprimento de contexto

Isso geralmente significa que o modelo de embeddings rejeitou a consulta de recuperação:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Defina um `recallMaxChars` menor e reinicie o Gateway:

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

Para Ollama, verifique também se o servidor de embeddings está acessível pelo host do Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embeddings não compatível

Sem `dimensions`, somente as dimensões integradas de embeddings da OpenAI são conhecidas.
Para modelos locais ou personalizados de embeddings, defina `embedding.dimensions` como o tamanho
do vetor informado por esse modelo.

### O plugin carrega, mas nenhuma memória aparece

Verifique se `plugins.slots.memory` aponta para `memory-lancedb` e execute:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Se `autoCapture` estiver desabilitado, o plugin recuperará memórias existentes, mas não
armazenará novas automaticamente. Use a ferramenta `memory_store` ou habilite
`autoCapture` se quiser captura automática.

## Relacionado

- [Visão geral de memória](/pt-BR/concepts/memory)
- [Active memory](/pt-BR/concepts/active-memory)
- [Busca de memória](/pt-BR/concepts/memory-search)
- [Memory Wiki](/pt-BR/plugins/memory-wiki)
- [Ollama](/pt-BR/providers/ollama)
