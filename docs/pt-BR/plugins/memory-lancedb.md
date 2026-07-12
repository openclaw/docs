---
read_when:
    - Você está configurando o plugin memory-lancedb
    - Você quer memória de longo prazo baseada no LanceDB com recuperação automática ou captura automática
    - Você está usando embeddings locais compatíveis com a OpenAI, como o Ollama
sidebarTitle: Memory LanceDB
summary: Configure o Plugin oficial externo de memória LanceDB, incluindo embeddings locais compatíveis com o Ollama
title: Memória LanceDB
x-i18n:
    generated_at: "2026-07-12T15:28:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` é um plugin externo oficial que armazena memória de longo prazo no
LanceDB com busca vetorial. Ele pode recuperar automaticamente memórias relevantes antes de uma
interação do modelo e capturar automaticamente fatos importantes após uma resposta.

Use-o para um banco de dados vetorial local, um endpoint de embeddings compatível com OpenAI ou
um armazenamento de memória fora do backend de memória integrado padrão.

## Instalação

```bash
openclaw plugins install @openclaw/memory-lancedb
```

O plugin é publicado no npm; ele não vem incluído na imagem de runtime do OpenClaw.
A instalação grava a entrada do plugin, habilita-o e altera
`plugins.slots.memory` para `memory-lancedb`. Se outro plugin for o proprietário atual
do slot de memória, esse plugin será desabilitado com um aviso.

<Note>
Plugins complementares, como `memory-wiki`, podem ser executados junto com `memory-lancedb`,
mas apenas um plugin é proprietário do slot de memória ativo por vez.
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

Reinicie o Gateway após alterar a configuração do plugin e verifique se ele foi carregado:

```bash
openclaw gateway restart
openclaw plugins list
```

## Configuração de embeddings

`embedding` é obrigatório e deve incluir pelo menos um campo. `provider`
usa `openai` por padrão; `model` usa `text-embedding-3-small` por padrão.

| Campo                  | Tipo          | Observações                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------------ |
| `embedding.provider`   | string        | ID do adaptador, por exemplo, `openai`, `github-copilot`, `ollama`. Padrão: `openai`. |
| `embedding.model`      | string        | Padrão: `text-embedding-3-small`.                                              |
| `embedding.apiKey`     | string        | Opcional; aceita expansão de `${ENV_VAR}`.                                     |
| `embedding.baseUrl`    | string        | Opcional; aceita expansão de `${ENV_VAR}`.                                     |
| `embedding.dimensions` | integer (>=1) | Obrigatório para modelos ausentes da tabela integrada (veja abaixo).           |

Existem dois caminhos de solicitação:

- **Caminho do adaptador do provedor** (padrão): defina `embedding.provider` e omita
  `embedding.apiKey`/`embedding.baseUrl`. O plugin resolve o perfil de autenticação
  configurado do provedor, a variável de ambiente ou
  `models.providers.<provider>.apiKey` por meio dos mesmos adaptadores de embeddings
  de memória usados pelo `memory-core`. Esse é o caminho para `github-copilot`, `ollama`
  e qualquer outro provedor incluído com suporte a embeddings.
- **Caminho direto do cliente compatível com OpenAI**: não defina `embedding.provider`
  (ou use `"openai"`) e defina `embedding.apiKey` junto com `embedding.baseUrl`. Use esse
  caminho para um endpoint de embeddings compatível com OpenAI que não tenha um adaptador
  de provedor incluído.

O OAuth do OpenAI Codex / ChatGPT não é uma credencial de embeddings da OpenAI Platform.
Para embeddings da OpenAI, use um perfil de autenticação com chave de API da OpenAI,
`OPENAI_API_KEY` ou `models.providers.openai.apiKey`. Usuários que tenham somente OAuth
devem escolher outro provedor compatível com embeddings, como `github-copilot` ou `ollama`.

```json5
{
  plugins: {
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

Alguns endpoints de embeddings compatíveis com OpenAI rejeitam o parâmetro
`encoding_format`; outros o ignoram e sempre retornam `number[]`. O `memory-lancedb`
omite `encoding_format` nas solicitações e aceita respostas tanto em arrays de números
de ponto flutuante quanto em float32 codificado em base64, portanto ambos os formatos
de resposta funcionam sem configuração.

### Dimensões

O OpenClaw tem uma dimensão integrada apenas para `text-embedding-3-small` (1536) e
`text-embedding-3-large` (3072). Qualquer outro modelo precisa de um valor explícito
em `embedding.dimensions` para que o LanceDB possa criar a coluna vetorial, por exemplo,
o `embedding-3` da ZhiPu com 2048 dimensões:

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

## Embeddings do Ollama

Use o caminho do adaptador do provedor Ollama incluído (`embedding.provider: "ollama"`).
Ele chama o endpoint nativo `/api/embed` do Ollama e segue as mesmas regras de autenticação
e URL base do provedor [Ollama](/pt-BR/providers/ollama).

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

`mxbai-embed-large` não está na tabela de dimensões integrada, portanto `dimensions` é
obrigatório. Para modelos de embeddings locais pequenos, reduza `recallMaxChars` se o
servidor local retornar erros de tamanho do contexto.

## Limites de recuperação e captura

| Configuração       | Padrão  | Intervalo                    | Aplicação                                                  |
| ------------------ | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`   | `1000`  | 100-10000                    | Texto enviado à API de embeddings para recuperação.        |
| `captureMaxChars`  | `500`   | 100-10000                    | Tamanho de mensagem elegível para captura automática.      |
| `customTriggers`   | `[]`    | 0-50 itens, cada um <=100 caracteres | Frases literais que fazem a captura automática considerar uma mensagem. |

`recallMaxChars` limita a consulta de recuperação automática de `before_prompt_build`, a
ferramenta `memory_recall`, o caminho de consulta de `memory_forget` e `openclaw ltm
search`. A recuperação automática gera embeddings da mensagem mais recente do usuário na
interação e recorre ao prompt completo somente quando não há nenhuma mensagem do usuário,
mantendo os metadados do canal e grandes blocos do prompt fora da solicitação de embeddings.

`captureMaxChars` determina se uma mensagem do usuário proveniente do evento `agent_end`
da interação é curta o suficiente para ser considerada para captura automática; ele não
afeta as consultas de recuperação.

`customTriggers` adiciona frases literais de captura automática sem regex. Os gatilhos
integrados abrangem frases comuns relacionadas a memória em inglês, tcheco, chinês,
japonês e coreano (`remember`, `prefer`, `记住`, `覚えて`, `기억해` e semelhantes).

A captura automática também rejeita textos que se pareçam com metadados de
envelope/transporte, cargas de injeção de prompt ou contexto `<relevant-memories>` já
injetado e limita a 3 memórias capturadas por interação do agente.

## Comandos

O `memory-lancedb` registra o namespace `ltm` da CLI sempre que está instalado
(não apenas quando é o proprietário do slot de memória ativo):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` executa uma consulta não vetorial diretamente na tabela do LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Padrão                                  | Observações                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Lista de colunas permitidas, separadas por vírgulas.                                                                                            |
| `--filter <condition>`            | nenhum                                  | Cláusula WHERE no estilo SQL. Máximo de 200 caracteres; somente caracteres alfanuméricos, `_-`, espaços em branco e `='"<>!.,()%*` são permitidos. |
| `--limit <n>`                     | `10`                                    | Número inteiro positivo.                                                                                                                        |
| `--order-by <column>:<asc\|desc>` | nenhum                                  | Ordenação na memória após a execução do filtro; a coluna de ordenação é adicionada automaticamente à projeção e removida da saída se não tiver sido solicitada. |

Os agentes recebem três ferramentas do plugin de memória ativo:

- `memory_recall`: busca vetorial nas memórias armazenadas.
- `memory_store`: salva um fato, uma preferência, uma decisão ou uma entidade (rejeita texto
  que se pareça com uma carga de injeção de prompt; ignora armazenamentos quase duplicados).
- `memory_forget`: exclui por `memoryId` ou por `query` (exclui automaticamente uma única
  correspondência com pontuação acima de 90%; caso contrário, lista IDs candidatos para
  eliminar a ambiguidade).

## Armazenamento

Os dados do LanceDB usam `~/.openclaw/memory/lancedb` por padrão. Substitua com `dbPath`:

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

`storageOptions` aceita pares de chave/valor em string para backends de armazenamento
do LanceDB (por exemplo, armazenamento de objetos compatível com S3) e aceita expansão
de `${ENV_VAR}`:

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

## Dependências de runtime e suporte a plataformas

O `memory-lancedb` depende do pacote nativo `@lancedb/lancedb`, que pertence ao
pacote do plugin (não à distribuição principal do OpenClaw). A inicialização do Gateway
não repara as dependências do plugin; se a dependência nativa estiver ausente ou não
conseguir ser carregada, reinstale ou atualize o pacote do plugin e reinicie o Gateway.

O `@lancedb/lancedb` não publica uma compilação nativa para `darwin-x64` (Mac
Intel). Nessa plataforma, o plugin registra durante o carregamento que o LanceDB está
indisponível; use o backend de memória padrão, execute o Gateway em uma
plataforma/arquitetura compatível ou desabilite o `memory-lancedb`.

## Solução de problemas

### O tamanho da entrada excede o tamanho do contexto

O modelo de embeddings rejeitou a consulta de recuperação:

```text
memory-lancedb: falha na recuperação: Erro: 400 o tamanho da entrada excede o tamanho do contexto
```

Reduza `recallMaxChars` e reinicie o Gateway:

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

Para o Ollama, verifique também se o servidor de embeddings está acessível pelo host do
Gateway usando seu endpoint nativo de embeddings:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embeddings não compatível

Sem `embedding.dimensions`, somente as dimensões integradas de embeddings da OpenAI
são conhecidas (`text-embedding-3-small`, `text-embedding-3-large`). Para qualquer outro
modelo, defina `embedding.dimensions` com o tamanho do vetor informado por esse modelo.

### O plugin é carregado, mas nenhuma memória aparece

Confirme se `plugins.slots.memory` aponta para `memory-lancedb` e, em seguida, execute:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Se `autoCapture` estiver desabilitado, o plugin ainda recuperará as memórias existentes, mas
não armazenará novas memórias automaticamente. Use a ferramenta `memory_store` ou habilite
`autoCapture`.

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
- [Wiki de memória](/pt-BR/plugins/memory-wiki)
- [Ollama](/pt-BR/providers/ollama)
