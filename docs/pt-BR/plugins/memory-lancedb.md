---
read_when:
    - Você está configurando o plugin memory-lancedb
    - Você quer memória de longo prazo baseada em LanceDB com recuperação automática ou captura automática
    - Você está usando embeddings locais compatíveis com a OpenAI, como o Ollama
sidebarTitle: Memory LanceDB
summary: Configure o Plugin oficial externo de memória LanceDB, incluindo embeddings locais compatíveis com o Ollama
title: Memória LanceDB
x-i18n:
    generated_at: "2026-07-16T12:42:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` é um plugin externo oficial que armazena memória de longo prazo no
LanceDB com busca vetorial. Ele pode recuperar automaticamente memórias relevantes antes de um turno
do modelo e capturar automaticamente fatos importantes após uma resposta.

Use-o para um banco de dados vetorial local, um endpoint de embeddings compatível com OpenAI ou
um armazenamento de memória fora do backend de memória integrado padrão.

## Instalação

```bash
openclaw plugins install @openclaw/memory-lancedb
```

O plugin é publicado no npm; ele não está incluído na imagem de runtime do OpenClaw.
A instalação grava a entrada do plugin, habilita-o e altera
`plugins.slots.memory` para `memory-lancedb`. Se outro plugin for atualmente responsável
pelo slot de memória, esse plugin será desabilitado com um aviso.

<Note>
Plugins complementares, como `memory-wiki`, podem ser executados junto com `memory-lancedb`,
mas somente um plugin é responsável pelo slot de memória ativo por vez.
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
usa `openai` como padrão; `model` usa `text-embedding-3-small` como padrão.

| Campo                  | Tipo          | Observações                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | string        | ID do adaptador, por exemplo, `openai`, `github-copilot`, `ollama`. Padrão: `openai`. |
| `embedding.model`      | string        | Padrão: `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | string        | Opcional; oferece suporte à expansão de `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | string        | Opcional; oferece suporte à expansão de `${ENV_VAR}`.                               |
| `embedding.dimensions` | inteiro (>=1) | Obrigatório para modelos que não estão na tabela integrada (veja abaixo).               |

Há dois caminhos de solicitação:

- **Caminho do adaptador do provedor** (padrão): defina `embedding.provider` e omita
  `embedding.apiKey`/`embedding.baseUrl`. O plugin resolve o perfil de autenticação
  configurado do provedor, a variável de ambiente ou
  `models.providers.<provider>.apiKey` por meio dos mesmos adaptadores de embeddings de memória
  usados por `memory-core`. Este é o caminho para `github-copilot`, `ollama`
  e qualquer outro provedor incluído com suporte a embeddings.
- **Caminho do cliente direto compatível com OpenAI**: deixe `embedding.provider` indefinido
  (ou `"openai"`) e defina `embedding.apiKey` junto com `embedding.baseUrl`. Use este
  caminho para um endpoint de embeddings compatível com OpenAI sem um adaptador de provedor
  incluído.

O OAuth do OpenAI Codex/ChatGPT não é uma credencial de embeddings da Plataforma OpenAI.
Para embeddings da OpenAI, use um perfil de autenticação com chave de API da OpenAI, `OPENAI_API_KEY` ou
`models.providers.openai.apiKey`. Usuários que têm apenas OAuth devem escolher outro
provedor compatível com embeddings, como `github-copilot` ou `ollama`.

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

Alguns endpoints de embeddings compatíveis com OpenAI rejeitam o parâmetro `encoding_format`;
outros o ignoram e sempre retornam `number[]`. `memory-lancedb`
omite `encoding_format` nas solicitações e aceita respostas com arrays de números de ponto flutuante ou
float32 codificado em base64, portanto, ambos os formatos de resposta funcionam sem configuração.

### Dimensões

O OpenClaw tem uma dimensão integrada somente para `text-embedding-3-small` (1536) e
`text-embedding-3-large` (3072). Qualquer outro modelo precisa de um
`embedding.dimensions` explícito para que o LanceDB possa criar a coluna vetorial, por exemplo,
o ZhiPu `embedding-3` com 2048 dimensões:

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
Ele chama o endpoint nativo `/api/embed` do Ollama e segue as mesmas regras de autenticação e
URL base do provedor [Ollama](/pt-BR/providers/ollama).

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

`mxbai-embed-large` não está na tabela de dimensões integrada, portanto, `dimensions` é
obrigatório. Para modelos locais pequenos de embeddings, reduza `recallMaxChars` se o
servidor local retornar erros de tamanho de contexto.

## Limites de recuperação e captura

| Configuração           | Padrão | Intervalo                        | Aplica-se a                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Texto enviado à API de embeddings para recuperação.                 |
| `captureMaxChars` | `500`   | 100-10000                    | Tamanho da mensagem elegível para captura automática.                  |
| `customTriggers`  | `[]`    | 0-50 itens, cada um com <=100 caracteres | Frases literais que fazem a captura automática considerar uma mensagem. |

`recallMaxChars` limita a consulta de recuperação automática `before_prompt_build`, a
ferramenta `memory_recall`, o caminho de consulta `memory_forget` e `openclaw ltm
search`. A recuperação automática gera o embedding da mensagem de usuário mais recente do turno e
recorre ao prompt completo somente quando não há uma mensagem do usuário, mantendo os
metadados do canal e grandes blocos do prompt fora da solicitação de embedding.

`captureMaxChars` controla se uma mensagem do usuário proveniente do evento `agent_end`
do turno é curta o suficiente para ser considerada para captura automática; isso não afeta
as consultas de recuperação.

`customTriggers` adiciona frases literais de captura automática sem regex. Os gatilhos
integrados abrangem frases comuns de memória em inglês, tcheco, chinês, japonês e coreano
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` e semelhantes).

A captura automática também rejeita textos que se parecem com metadados de envelope/transporte,
cargas de injeção de prompt ou contexto `<relevant-memories>` já injetado,
e limita a captura a 3 memórias por turno do agente.

Cada memória pertence a um agente. A recuperação, a detecção de duplicatas, a captura,
a listagem, as consultas brutas e a exclusão verificam esse proprietário antes de retornar ou
alterar linhas. Um agente com `memorySearch.enabled: false` (em `agents.list[]`
ou por meio de `agents.defaults`) também não recebe nenhuma das ferramentas `memory_recall`, `memory_store`
ou `memory_forget` e não participa da recuperação ou captura automática,
mesmo quando os sinalizadores `autoRecall`/`autoCapture` no nível do plugin estão ativados.

## Comandos

`memory-lancedb` registra o namespace da CLI `ltm` sempre que está instalado
(não somente quando é responsável pelo slot de memória ativo):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` executa uma consulta não vetorial diretamente na tabela do LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Sinalizador                              | Padrão                                 | Observações                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | agente padrão configurado                | Seleciona o namespace privado do agente. Disponível em `list`, `search`, `query` e `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Lista de colunas permitidas, separadas por vírgulas.                                                                                                         |
| `--filter <condition>`            | nenhum                                    | Uma comparação em uma coluna de saída, como `category = 'preference'` ou `importance >= 0.8`. Valores de string devem estar entre aspas.             |
| `--limit <n>`                     | `10`                                    | Inteiro positivo.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | nenhum                                    | Ordenado na memória após a execução do filtro; a coluna de ordenação é adicionada automaticamente à projeção e removida da saída se não tiver sido solicitada. |

Os agentes recebem três ferramentas do plugin de memória ativo:

- `memory_recall`: busca vetorial nas memórias armazenadas.
- `memory_store`: salva um fato, uma preferência, uma decisão ou uma entidade (rejeita texto
  que pareça uma carga de injeção de prompt; ignora armazenamentos quase duplicados).
- `memory_forget`: exclui por `memoryId` ou por `query` (exclui automaticamente uma única
  correspondência com pontuação acima de 90%; caso contrário, lista os IDs candidatos para desambiguação).

## Armazenamento

Os dados do LanceDB usam `~/.openclaw/memory/lancedb` como padrão. Substitua com `dbPath`:

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

O plugin mantém uma tabela do LanceDB e armazena um proprietário de agente normalizado em cada
linha. Esse é um limite de armazenamento, não um filtro pós-busca: a propriedade do agente é
aplicada antes da classificação vetorial e incluída nos predicados de listagem, consulta, contagem e exclusão.
`ltm query --filter` aceita uma comparação validada sobre as
colunas públicas de saída. O armazenamento cria essa comparação separadamente do
predicado obrigatório de proprietário, portanto, um filtro não pode ampliar a consulta para outro
agente.

Bancos de dados criados antes da propriedade por agente não têm uma procedência confiável das linhas.
Durante a atualização, `openclaw doctor --fix` atribui essas linhas legadas uma única vez ao
agente padrão configurado. O acesso em runtime falha de forma segura até que essa migração seja
concluída; outros agentes nunca herdam as antigas linhas compartilhadas.

`storageOptions` aceita pares de chave/valor do tipo string para backends de armazenamento do LanceDB
(por exemplo, armazenamento de objetos compatível com S3) e oferece suporte à expansão de `${ENV_VAR}`:

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

## Dependências de runtime e compatibilidade com plataformas

`memory-lancedb` depende do pacote nativo `@lancedb/lancedb`, que pertence ao
pacote do plugin (não à distribuição principal do OpenClaw). A inicialização do Gateway não corrige
as dependências do plugin; se a dependência nativa estiver ausente ou não for carregada,
reinstale ou atualize o pacote do plugin e reinicie o Gateway.

`@lancedb/lancedb` não publica uma compilação nativa para `darwin-x64` (Mac
Intel). Nessa plataforma, o plugin registra durante o carregamento que o LanceDB não está disponível;
use o backend de memória padrão, execute o Gateway em uma
plataforma/arquitetura compatível ou desative `memory-lancedb`.

## Solução de problemas

### O tamanho da entrada excede o tamanho do contexto

O modelo de embedding rejeitou a consulta de recuperação:

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

Para o Ollama, verifique também se o servidor de embedding pode ser acessado pelo host do Gateway
usando seu endpoint nativo de embedding:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modelo de embedding não compatível

Sem `embedding.dimensions`, somente as dimensões de embedding integradas da OpenAI
são conhecidas (`text-embedding-3-small`, `text-embedding-3-large`). Para qualquer outro
modelo, defina `embedding.dimensions` como o tamanho do vetor informado por esse modelo.

### O plugin é carregado, mas nenhuma memória aparece

Confirme se `plugins.slots.memory` aponta para `memory-lancedb` e execute:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Se `autoCapture` estiver desativado, o plugin ainda recuperará as memórias existentes, mas
não armazenará novas memórias automaticamente. Use a ferramenta `memory_store` ou ative
`autoCapture`.

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Active Memory](/pt-BR/concepts/active-memory)
- [Pesquisa de memória](/pt-BR/concepts/memory-search)
- [Wiki de memória](/pt-BR/plugins/memory-wiki)
- [Ollama](/pt-BR/providers/ollama)
