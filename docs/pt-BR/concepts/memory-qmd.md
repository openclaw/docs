---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como reclassificação ou caminhos indexados adicionais
summary: Sidecar de busca local-first com BM25, vetores, reclassificação e expansão de consultas
title: Mecanismo de memória QMD
x-i18n:
    generated_at: "2026-07-12T15:05:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) é um mecanismo auxiliar de busca local-first executado
junto com o OpenClaw. Ele combina BM25, busca vetorial e reranqueamento em um único
binário e pode indexar conteúdo além dos arquivos de memória do seu workspace.

## O que ele acrescenta em relação ao mecanismo integrado

- **Reranqueamento e expansão de consultas** para melhorar a recuperação.
- **Indexação de diretórios adicionais** — documentação de projetos, notas da equipe, qualquer conteúdo no disco.
- **Indexação de transcrições de sessões** — recupere conversas anteriores.
- **Totalmente local** — funciona com o Plugin de provedor oficial do llama.cpp e
  baixa automaticamente os modelos GGUF.
- **Fallback automático** — se o QMD não estiver disponível, o OpenClaw usa o
  mecanismo integrado de forma transparente.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Uma compilação do SQLite que permita extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do Gateway.
- macOS e Linux funcionam sem configuração adicional. No Windows, a melhor compatibilidade é via WSL2.

### Ativar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria um diretório-base autossuficiente do QMD em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida
do mecanismo auxiliar — coleções, atualizações e execuções de embeddings são processadas para você.
Ele prioriza os formatos atuais de coleção e consulta MCP do QMD, mas recorre a
flags alternativas de padrão de coleção e nomes antigos de ferramentas MCP quando necessário.
A reconciliação na inicialização também recria coleções gerenciadas obsoletas com seus
padrões canônicos quando uma coleção mais antiga do QMD com o mesmo nome ainda
está presente.

## Como o mecanismo auxiliar funciona

- O OpenClaw cria coleções com base nos arquivos de memória do seu workspace e em quaisquer
  `memory.qmd.paths` configurados e, em seguida, executa `qmd update` quando o gerenciador do QMD
  é aberto e periodicamente depois disso (`memory.qmd.update.interval`, padrão:
  `5m`). As atualizações são executadas por subprocessos do QMD, não por uma varredura
  do sistema de arquivos no processo. Os modos de busca semântica também executam `qmd embed`
  (`memory.qmd.update.embedInterval`, padrão: `60m`).
- A coleção padrão do workspace acompanha `MEMORY.md` e a árvore `memory/`.
  O arquivo `memory.md` em letras minúsculas não é indexado como arquivo de memória raiz.
- O scanner do próprio QMD ignora caminhos ocultos e diretórios comuns de dependências/compilação,
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. Por padrão, a inicialização do Gateway não inicializa o QMD
  (`memory.qmd.update.startup` tem `off` como padrão), portanto uma inicialização a frio evita
  importar o runtime de memória ou criar o observador de longa duração antes
  do primeiro uso da memória.
- Defina `memory.qmd.update.startup` como `idle` ou `immediate` para inicializar o QMD
  durante a inicialização do Gateway mesmo assim. `memory.qmd.update.onBoot` tem `true` como padrão e
  executa a atualização inicial na inicialização; defina como `false` para ignorar essa
  atualização imediata (o gerenciador de longa duração ainda é aberto quando intervalos de atualização ou embedding
  estão configurados, portanto o QMD continua gerenciando seu observador e temporizadores regulares).
- As buscas usam o `searchMode` configurado (padrão: `search`; também há suporte a
  `vsearch` e `query`). `search` usa apenas BM25, portanto o OpenClaw ignora
  verificações de prontidão de vetores semânticos e a manutenção de embeddings nesse modo. Se um modo
  falhar, o OpenClaw tenta novamente com `qmd query`.
- Quando `searchMode` for `query`, defina `memory.qmd.rerank` como `false` para usar
  o caminho de consulta híbrida do QMD sem o reranqueador (requer QMD 2.1 ou mais recente).
  O OpenClaw passa `--no-rerank` para o caminho direto da CLI do QMD e
  `rerank: false` para a ferramenta de consulta MCP do QMD.
- Com versões do QMD que anunciam filtros para várias coleções, o OpenClaw agrupa
  coleções da mesma origem em uma única invocação de busca do QMD. Versões mais antigas do QMD
  mantêm o fallback compatível por coleção.
- Se o QMD falhar completamente, o OpenClaw usa como fallback o mecanismo SQLite integrado.
  Tentativas repetidas em turnos de chat aguardam brevemente após uma falha de abertura, para que
  um binário ausente ou uma dependência defeituosa do mecanismo auxiliar não crie uma tempestade de novas tentativas;
  `openclaw memory status` e verificações pontuais da CLI ainda verificam novamente o QMD
  diretamente.

<Info>
A primeira busca pode ser lenta — o QMD baixa automaticamente modelos GGUF (~2 GB) para
reranqueamento e expansão de consultas na primeira execução de `qmd query`.
</Info>

## Desempenho e compatibilidade da busca

O OpenClaw mantém o caminho de busca do QMD compatível tanto com instalações atuais quanto antigas
do QMD.

Na inicialização, o OpenClaw verifica uma vez por gerenciador o texto de ajuda do QMD instalado. Se
o binário anunciar suporte a vários filtros de coleção, o OpenClaw
pesquisará todas as coleções da mesma origem com um único comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Isso evita iniciar um subprocesso do QMD para cada coleção de memória durável.
As coleções de transcrições de sessões permanecem em seu próprio grupo de origem, portanto buscas mistas
de `memory` + `sessions` ainda fornecem ao diversificador de resultados entradas de
ambas as origens.

Compilações antigas do QMD aceitam apenas um filtro de coleção. Quando o OpenClaw detecta uma
dessas compilações, ele mantém o caminho de compatibilidade e pesquisa cada coleção
separadamente antes de mesclar e desduplicar os resultados.

Para inspecionar manualmente o contrato instalado, execute:

```bash
qmd --help | grep -i collection
```

A ajuda atual do QMD menciona o direcionamento para uma ou mais coleções. A ajuda antiga
geralmente descreve uma única coleção.

## Substituições de modelos

As variáveis de ambiente de modelos do QMD são repassadas sem alterações pelo processo do Gateway,
portanto você pode ajustar o QMD globalmente sem adicionar novas configurações do OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Após alterar o modelo de embedding, execute novamente os embeddings para que o índice corresponda ao
novo espaço vetorial.

## Indexação de caminhos adicionais

Direcione o QMD para diretórios adicionais para torná-los pesquisáveis:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Trechos de caminhos adicionais aparecem como `qmd/<collection>/<relative-path>` nos
resultados da busca. `memory_get` entende esse prefixo e lê a partir da
raiz correta da coleção.

## Indexação de transcrições de sessões

Ative a indexação de sessões para recuperar conversas anteriores. O QMD precisa tanto da
origem geral de sessão `memorySearch` quanto do exportador de transcrições do QMD:

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
}
```

As transcrições são exportadas como turnos higienizados de Usuário/Assistente para uma coleção dedicada do QMD
em `~/.openclaw/agents/<id>/qmd/sessions/`. Definir apenas
`memorySearch.experimental.sessionMemory` não exporta transcrições para
o QMD.

Os resultados de sessões ainda são filtrados por
[`tools.sessions.visibility`](/pt-BR/gateway/config-tools#toolssessions). A
visibilidade padrão `tree` não expõe sessões não relacionadas do mesmo agente. Se uma
sessão despachada pelo Gateway precisar ser recuperável em uma sessão de mensagem direta separada,
defina `tools.sessions.visibility: "agent"` intencionalmente.

## Escopo da busca

Por padrão, os resultados da busca do QMD são exibidos apenas em sessões diretas (não
em chats de grupo ou de canal). Configure `memory.qmd.scope` para alterar isso:

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

O trecho acima é a regra padrão real. Quando o escopo nega uma busca,
o OpenClaw registra um aviso com o canal e o tipo de chat determinados, para facilitar
a depuração de resultados vazios.

## Citações

Quando `memory.citations` é `auto` ou `on`, os trechos da busca recebem um
rodapé `Source: <path>#L<line>` (ou `#L<start>-L<end>`). No modo `auto`,
o rodapé é adicionado apenas para sessões de chat direto. Defina
`memory.citations = "off"` para omitir o rodapé e ainda assim repassar o caminho ao
agente internamente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reranqueamento para resultados de maior qualidade.
- Pesquisar documentação de projetos ou notas fora do workspace.
- Recuperar conversas de sessões anteriores.
- Busca totalmente local, sem chaves de API.

Para configurações mais simples, o [mecanismo integrado](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências adicionais.

## Solução de problemas

**QMD não encontrado?** Verifique se o binário está no `PATH` do Gateway. Se o OpenClaw
for executado como serviço, crie um link simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funcionar no seu shell, mas o OpenClaw ainda informar
`spawn qmd ENOENT`, o processo do Gateway provavelmente tem um `PATH` diferente do
seu shell interativo. Fixe o binário explicitamente:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Use `command -v qmd` no ambiente em que o QMD está instalado e verifique novamente
com `openclaw memory status --deep`.

**A primeira busca está muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Faça um pré-aquecimento
com `qmd query "test"` usando os mesmos diretórios XDG utilizados pelo OpenClaw.

**Muitos subprocessos do QMD durante a busca?** Atualize o QMD, se possível. O OpenClaw
usa um único processo para buscas em várias coleções da mesma origem somente quando o
QMD instalado anuncia suporte a vários filtros `-c`; caso contrário, ele
mantém o fallback antigo por coleção para garantir a correção.

**O QMD somente com BM25 ainda está tentando compilar o llama.cpp?** Defina
`memory.qmd.searchMode = "search"`. O OpenClaw trata esse modo como
exclusivamente lexical, ignora verificações de estado de vetores do QMD e a manutenção de embeddings e
deixa as verificações de prontidão semântica para configurações `vsearch` ou `query`.

**A busca expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão:
4000ms). Defina um valor maior, por exemplo `120000`, para hardware mais lento.

**Resultados vazios em chats de grupo ou de canal?** Isso é esperado com o
`memory.qmd.scope` padrão, que permite apenas sessões diretas. Adicione uma regra
`allow` para os tipos de chat `group` ou `channel` se quiser resultados do QMD
nesses contextos.

**A busca da memória raiz ficou ampla demais de repente?** Reinicie o Gateway ou aguarde
a próxima reconciliação na inicialização. O OpenClaw recria coleções gerenciadas obsoletas
com os padrões canônicos de `MEMORY.md` e `memory/` quando
detecta um conflito de mesmo nome.

**Repositórios temporários visíveis no workspace estão causando `ENAMETOOLONG` ou falhas na indexação?**
A travessia do QMD segue o scanner subjacente do QMD, em vez das regras de links simbólicos
do mecanismo integrado do OpenClaw. Mantenha checkouts temporários de monorepositórios em diretórios
ocultos, como `.tmp/`, ou fora das raízes indexadas pelo QMD até que ele ofereça
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para conhecer toda a superfície de configuração (`memory.qmd.*`), os modos de busca, os intervalos de atualização,
as regras de escopo e todas as outras opções, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
