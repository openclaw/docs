---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como rer ranqueamento ou caminhos indexados adicionais
summary: Sidecar de busca local-first com BM25, vetores, rer ranqueamento e expansão de consultas
title: Mecanismo de memória QMD
x-i18n:
    generated_at: "2026-07-16T12:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) é um mecanismo auxiliar de busca local-first que é executado
junto com o OpenClaw. Ele combina BM25, busca vetorial e reranqueamento em um único
binário e pode indexar conteúdo além dos arquivos de memória do seu espaço de trabalho.

## O que ele acrescenta em relação ao mecanismo integrado

- **Reranqueamento e expansão de consultas** para melhorar a recuperação.
- **Indexação de diretórios adicionais** - documentação de projetos, notas da equipe, qualquer conteúdo no disco.
- **Indexação de transcrições de sessões** - recupere conversas anteriores.
- **Totalmente local** - é executado com o plugin oficial do provedor llama.cpp e
  baixa automaticamente os modelos GGUF.
- **Fallback automático** - se o QMD estiver indisponível, o OpenClaw alternará para o
  mecanismo integrado de forma transparente.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Uma compilação do SQLite que permita extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do Gateway.
- O macOS e o Linux funcionam sem configuração adicional. No Windows, o melhor suporte é por meio do WSL2.

### Ativação

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria um diretório inicial autossuficiente do QMD em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida
do mecanismo auxiliar — coleções, atualizações e execuções de embeddings são gerenciadas para você.
Ele dá preferência aos formatos atuais de coleção e consulta MCP do QMD, mas recorre a
flags alternativas de padrão de coleção e nomes antigos de ferramentas MCP quando necessário.
A reconciliação na inicialização também recria coleções gerenciadas obsoletas com seus
padrões canônicos quando uma coleção antiga do QMD com o mesmo nome ainda está
presente.

## Como o mecanismo auxiliar funciona

- O OpenClaw cria coleções a partir dos arquivos de memória do espaço de trabalho e de quaisquer
  `memory.qmd.paths` configurados e, em seguida, executa `qmd update` quando o gerenciador do QMD
  é aberto e periodicamente depois disso (`memory.qmd.update.interval`, padrão:
  `5m`). As atualizações são executadas por meio de subprocessos do QMD, e não por uma varredura
  do sistema de arquivos dentro do processo. Os modos de busca semântica também executam `qmd embed`
  (`memory.qmd.update.embedInterval`, padrão: `60m`).
- A coleção padrão do espaço de trabalho acompanha `MEMORY.md` e a árvore `memory/`.
  `memory.md` em letras minúsculas não é indexado como arquivo de memória raiz.
- O scanner do próprio QMD ignora caminhos ocultos e diretórios comuns de dependências/compilação,
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. Por padrão, a inicialização do Gateway não inicializa o QMD
  (`memory.qmd.update.startup` tem `off` como padrão), portanto, uma inicialização a frio evita
  importar o runtime de memória ou criar o observador de longa duração antes que
  a memória seja usada pela primeira vez.
- Defina `memory.qmd.update.startup` como `idle` ou `immediate` para inicializar o QMD
  na inicialização do Gateway mesmo assim. `memory.qmd.update.onBoot` tem `true` como padrão e
  executa a atualização inicial na inicialização; defina-o como `false` para ignorar essa
  atualização imediata (o gerenciador de longa duração ainda é aberto quando os intervalos de atualização ou
  embedding estão configurados, portanto o QMD continua controlando seu observador e temporizadores regulares).
- As buscas usam o `searchMode` configurado (padrão: `search`; também há suporte a
  `vsearch` e `query`). `search` usa somente BM25, portanto o OpenClaw ignora as
  verificações de prontidão de vetores semânticos e a manutenção de embeddings nesse modo. Se um modo
  falhar, o OpenClaw tentará novamente com `qmd query`.
- Quando `searchMode` for `query`, defina `memory.qmd.rerank` como `false` para usar
  o caminho de consulta híbrida do QMD sem o reranqueador (requer QMD 2.1 ou mais recente).
  O OpenClaw passa `--no-rerank` para o caminho direto da CLI do QMD e
  `rerank: false` para a ferramenta de consulta MCP do QMD.
- Com versões do QMD que anunciam filtros para várias coleções, o OpenClaw agrupa
  coleções da mesma origem em uma única invocação de busca do QMD. Versões mais antigas do QMD
  mantêm o fallback compatível por coleção.
- Se o QMD falhar por completo, o OpenClaw alternará para o mecanismo SQLite integrado.
  Tentativas repetidas em turnos do chat aguardam brevemente após uma falha de abertura, para que
  um binário ausente ou uma dependência com falha do mecanismo auxiliar não crie uma tempestade de novas tentativas;
  `openclaw memory status` e sondagens pontuais da CLI ainda verificam novamente o QMD
  diretamente.

<Info>
A primeira busca pode ser lenta — o QMD baixa automaticamente os modelos GGUF (~2 GB) para
reranqueamento e expansão de consultas na primeira execução de `qmd query`.
</Info>

## Desempenho e compatibilidade da busca

O OpenClaw mantém o caminho de busca do QMD compatível com instalações atuais e antigas
do QMD.

Na inicialização, o OpenClaw verifica uma vez por gerenciador o texto de ajuda do QMD instalado. Se
o binário anunciar suporte a vários filtros de coleção, o OpenClaw
pesquisará todas as coleções da mesma origem com um único comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Isso evita iniciar um subprocesso do QMD para cada coleção de memória persistente.
As coleções de transcrições de sessões permanecem em seu próprio grupo de origem, portanto buscas
mistas de `memory` + `sessions` ainda fornecem ao diversificador de resultados entradas de
ambas as origens.

Compilações antigas do QMD aceitam apenas um filtro de coleção. Quando o OpenClaw detecta uma
dessas compilações, ele mantém o caminho de compatibilidade e pesquisa cada coleção
separadamente antes de mesclar e eliminar resultados duplicados.

Para inspecionar manualmente o contrato instalado, execute:

```bash
qmd --help | grep -i collection
```

A ajuda atual do QMD menciona o direcionamento para uma ou mais coleções. A ajuda antiga
geralmente descreve uma única coleção.

## Substituições de modelos

As variáveis de ambiente de modelos do QMD são repassadas sem alterações pelo processo do Gateway,
portanto é possível ajustar o QMD globalmente sem adicionar novas configurações ao OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Depois de alterar o modelo de embedding, execute novamente os embeddings para que o índice corresponda ao
novo espaço vetorial.

## Indexação de caminhos adicionais

Direcione o QMD para diretórios adicionais a fim de torná-los pesquisáveis:

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
resultados da busca. `memory_get` reconhece esse prefixo e faz a leitura a partir da
raiz correta da coleção.

## Indexação de transcrições de sessões

Ative a indexação de sessões para recuperar conversas anteriores. O QMD precisa tanto da
origem geral de sessões `memorySearch` quanto do exportador de transcrições do QMD:

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

As transcrições são exportadas como turnos higienizados de Usuário/Assistente para uma coleção
dedicada do QMD em `~/.openclaw/agents/<id>/qmd/sessions/`. Definir apenas
`memorySearch.experimental.sessionMemory` não exporta transcrições para
o QMD.

As correspondências de sessões ainda são filtradas por
[`tools.sessions.visibility`](/pt-BR/gateway/config-tools#toolssessions). A
visibilidade padrão `tree` não expõe sessões não relacionadas do mesmo agente. Se uma
sessão despachada pelo Gateway precisar ser recuperável a partir de uma sessão de mensagem direta separada,
defina `tools.sessions.visibility: "agent"` intencionalmente.

## Escopo da busca

Por padrão, os resultados da busca do QMD são apresentados somente em sessões diretas (não
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

O trecho acima é a regra padrão efetiva. Quando o escopo nega uma busca,
o OpenClaw registra um aviso com o canal e o tipo de chat derivados, facilitando a
depuração de resultados vazios.

## Citações

Quando `memory.citations` for `auto` ou `on`, os trechos da busca receberão um
rodapé `Source: <path>#L<line>` (ou `#L<start>-L<end>`). No modo `auto`,
o rodapé é adicionado somente em sessões de chat direto. Defina
`memory.citations = "off"` para omitir o rodapé, mas ainda passar o caminho
internamente ao agente.

## Quando usar

Escolha o QMD quando precisar de:

- Reranqueamento para obter resultados de maior qualidade.
- Pesquisar documentação de projetos ou notas fora do espaço de trabalho.
- Recuperar conversas de sessões anteriores.
- Busca totalmente local sem chaves de API.

Para configurações mais simples, o [mecanismo integrado](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências adicionais.

## Solução de problemas

**QMD não encontrado?** Verifique se o binário está no `PATH` do Gateway. Se o OpenClaw
for executado como serviço, crie um link simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funcionar em seu shell, mas o OpenClaw ainda relatar
`spawn qmd ENOENT`, o processo do Gateway provavelmente terá um `PATH` diferente daquele
do seu shell interativo. Fixe explicitamente o binário:

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

Use `command -v qmd` no ambiente em que o QMD está instalado e, em seguida, verifique novamente
com `openclaw memory status --deep`.

**A primeira busca está muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Faça o pré-aquecimento
com `qmd query "test"`, usando os mesmos diretórios XDG que o OpenClaw usa.

**Muitos subprocessos do QMD durante a busca?** Atualize o QMD, se possível. O OpenClaw
usa um processo para buscas em várias coleções da mesma origem somente quando o
QMD instalado anuncia suporte a vários filtros `-c`; caso contrário, ele
mantém o fallback antigo por coleção para garantir a correção.

**O QMD somente com BM25 ainda está tentando compilar o llama.cpp?** Defina
`memory.qmd.searchMode = "search"`. O OpenClaw trata esse modo como
exclusivamente lexical, ignora as sondagens de status vetorial e a manutenção de embeddings do QMD e
deixa as verificações de prontidão semântica para configurações `vsearch` ou `query`.

**A busca excede o tempo limite?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina um valor maior, por exemplo `120000`, para hardware mais lento. Esse limite se aplica aos
comandos de busca do próprio QMD durante chamadas `memory_search` do agente; configuração, sincronização,
fallback integrado e trabalho suplementar do corpus mantêm seus próprios prazos menores.

**Resultados vazios em chats de grupo ou de canal?** Isso é esperado com o
`memory.qmd.scope` padrão, que permite apenas sessões diretas. Adicione uma
regra `allow` para os tipos de chat `group` ou `channel` se quiser resultados do QMD
nesses chats.

**A busca na memória raiz ficou ampla demais de repente?** Reinicie o Gateway ou aguarde
a próxima reconciliação na inicialização. O OpenClaw recria coleções gerenciadas
obsoletas com os padrões canônicos `MEMORY.md` e `memory/` quando
detecta um conflito com o mesmo nome.

**Repositórios temporários visíveis no espaço de trabalho causando `ENAMETOOLONG` ou falha na indexação?**
A travessia do QMD segue o scanner subjacente do QMD, e não as regras de links simbólicos
do mecanismo integrado do OpenClaw. Mantenha checkouts temporários de monorepositórios em diretórios
ocultos, como `.tmp/`, ou fora das raízes indexadas pelo QMD até que o QMD ofereça
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para consultar toda a superfície de configuração (`memory.qmd.*`), os modos de busca, os intervalos de atualização,
as regras de escopo e todas as demais opções, consulte a
[referência de configuração da memória](/pt-BR/reference/memory-config).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
