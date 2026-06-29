---
read_when:
    - Você quer configurar o QMD como seu mecanismo de memória
    - Você quer recursos avançados de memória, como reranking ou caminhos indexados adicionais
summary: Sidecar de busca com prioridade local com BM25, vetores, reordenação e expansão de consultas
title: Mecanismo de memória QMD
x-i18n:
    generated_at: "2026-06-28T22:33:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) é um sidecar de busca local-first que roda
junto com o OpenClaw. Ele combina BM25, busca vetorial e reranking em um único
binário, e pode indexar conteúdo além dos arquivos de memória do seu workspace.

## O que ele adiciona em relação ao embutido

- **Reranking e expansão de consulta** para melhor recall.
- **Indexar diretórios extras** -- documentação do projeto, notas da equipe, qualquer coisa em disco.
- **Indexar transcrições de sessão** -- recupere conversas anteriores.
- **Totalmente local** -- roda com o plugin de provedor llama.cpp oficial e
  baixa modelos GGUF automaticamente.
- **Fallback automático** -- se o QMD estiver indisponível, o OpenClaw volta para o
  motor embutido de forma transparente.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build do SQLite que permite extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do gateway.
- macOS e Linux funcionam imediatamente. Windows tem melhor suporte via WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria uma home QMD autocontida em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia o ciclo de vida do sidecar
automaticamente -- coleções, atualizações e execuções de embedding são tratadas para você.
Ele prefere os formatos atuais de coleção QMD e consulta MCP, mas ainda recorre a
flags de padrão de coleção alternativas e nomes de ferramentas MCP mais antigos quando necessário.
A reconciliação na inicialização também recria coleções gerenciadas obsoletas de volta para seus
padrões canônicos quando uma coleção QMD mais antiga com o mesmo nome ainda está
presente.

## Como o sidecar funciona

- O OpenClaw cria coleções a partir dos arquivos de memória do seu workspace e de quaisquer
  `memory.qmd.paths` configurados, depois executa `qmd update` quando o gerenciador QMD é
  aberto e periodicamente depois disso (padrão: a cada 5 minutos). Essas atualizações
  rodam por subprocessos do QMD, não por uma varredura do sistema de arquivos dentro do processo. Modos
  semânticos também executam `qmd embed`.
- A coleção padrão do workspace acompanha `MEMORY.md` mais a árvore `memory/`.
  `memory.md` em minúsculas não é indexado como arquivo raiz de memória.
- O scanner próprio do QMD ignora caminhos ocultos e diretórios comuns de dependências/build
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. A inicialização do Gateway não inicializa o QMD por padrão, então um boot frio
  evita importar o runtime de memória ou criar o watcher de longa duração antes de
  a memória ser usada pela primeira vez.
- Se você quiser que o QMD seja inicializado no início do gateway mesmo assim, defina
  `memory.qmd.update.startup` como `idle` ou `immediate`. Com
  `memory.qmd.update.onBoot: true`, a inicialização executa a atualização inicial. Com
  `onBoot: false`, a inicialização pula essa atualização imediata, mas ainda abre o
  gerenciador de longa duração quando intervalos de update ou embed estão configurados, para que o QMD possa
  controlar seu watcher e timers regulares.
- As buscas usam o `searchMode` configurado (padrão: `search`; também aceita
  `vsearch` e `query`). `search` é apenas BM25, então o OpenClaw pula sondagens de prontidão
  de vetor semântico e manutenção de embedding nesse modo. Se um modo
  falhar, o OpenClaw tenta novamente com `qmd query`.
- Quando `searchMode` for `query`, defina `memory.qmd.rerank` como `false` para usar o caminho
  de consulta híbrida do QMD sem o reranker. O OpenClaw passa `--no-rerank` para o
  caminho direto da CLI do QMD e `rerank: false` para a ferramenta de consulta MCP do QMD. Essa opção
  exige QMD 2.1 ou mais recente.
- Com versões do QMD que anunciam filtros de múltiplas coleções, o OpenClaw agrupa
  coleções da mesma origem em uma única invocação de busca do QMD. Versões mais antigas do QMD
  mantêm o fallback compatível por coleção.
- Se o QMD falhar completamente, o OpenClaw volta para o motor SQLite embutido.
  Tentativas repetidas em turnos de chat fazem um breve backoff após uma falha de abertura, para que um
  binário ausente ou uma dependência quebrada do sidecar não crie uma tempestade de tentativas;
  `openclaw memory status` e sondagens pontuais da CLI ainda verificam o QMD diretamente.

<Info>
A primeira busca pode ser lenta -- o QMD baixa automaticamente modelos GGUF (~2 GB) para
reranking e expansão de consulta na primeira execução de `qmd query`.
</Info>

## Desempenho de busca e compatibilidade

O OpenClaw mantém o caminho de busca do QMD compatível tanto com instalações atuais quanto com
instalações mais antigas do QMD.

Na inicialização, o OpenClaw verifica o texto de ajuda do QMD instalado uma vez por gerenciador. Se o
binário anunciar suporte a vários filtros de coleção, o OpenClaw busca em todas as
coleções da mesma origem com um comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Isso evita iniciar um subprocesso QMD para cada coleção de memória durável.
Coleções de transcrições de sessão ficam no seu próprio grupo de origem, então buscas mistas
`memory` + `sessions` ainda fornecem entrada de ambas as origens ao diversificador de resultados.

Builds mais antigos do QMD aceitam apenas um filtro de coleção. Quando o OpenClaw detecta um
desses builds, ele mantém o caminho de compatibilidade e busca cada coleção
separadamente antes de mesclar e deduplicar os resultados.

Para inspecionar manualmente o contrato instalado, execute:

```bash
qmd --help | grep -i collection
```

A ajuda atual do QMD diz que filtros de coleção podem mirar uma ou mais coleções.
A ajuda mais antiga geralmente descreve uma única coleção.

## Sobrescritas de modelo

Variáveis de ambiente de modelo do QMD são repassadas sem alteração a partir do processo
do gateway, então você pode ajustar o QMD globalmente sem adicionar nova configuração do OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Depois de alterar o modelo de embedding, execute novamente os embeddings para que o índice corresponda ao
novo espaço vetorial.

## Indexar caminhos extras

Aponte o QMD para diretórios adicionais para torná-los pesquisáveis:

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

Trechos de caminhos extras aparecem como `qmd/<collection>/<relative-path>` nos
resultados da busca. `memory_get` entende esse prefixo e lê a partir da raiz correta
da coleção.

## Indexar transcrições de sessão

Habilite a indexação de sessões para recuperar conversas anteriores. O QMD precisa tanto da origem de sessão geral
`memorySearch` quanto do exportador de transcrições QMD:

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

As transcrições são exportadas como turnos sanitizados de Usuário/Assistente para uma coleção QMD
dedicada em `~/.openclaw/agents/<id>/qmd/sessions/`. Definir apenas
`memorySearch.experimental.sessionMemory` não exporta transcrições para o QMD.

Resultados de sessão ainda são filtrados por
[`tools.sessions.visibility`](/pt-BR/gateway/config-tools#toolssessions). A visibilidade padrão
`tree` não expõe sessões não relacionadas do mesmo agente. Se uma
sessão despachada pelo gateway deve ser recuperável a partir de uma sessão separada de DM, defina
`tools.sessions.visibility: "agent"` intencionalmente.

## Escopo de busca

Por padrão, os resultados de busca do QMD são expostos em sessões diretas e de canal
(não em grupos). Configure `memory.qmd.scope` para alterar isso:

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

Quando o escopo nega uma busca, o OpenClaw registra um aviso com o canal derivado e
o tipo de chat para facilitar a depuração de resultados vazios.

## Citações

Quando `memory.citations` é `auto` ou `on`, os trechos de busca incluem um rodapé
`Source: <path#line>`. Defina `memory.citations = "off"` para omitir o rodapé
e ainda assim passar o caminho internamente para o agente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reranking para resultados de maior qualidade.
- Buscar documentação ou notas do projeto fora do workspace.
- Recuperar conversas de sessões passadas.
- Busca totalmente local sem chaves de API.

Para configurações mais simples, o [motor embutido](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências extras.

## Solução de problemas

**QMD não encontrado?** Garanta que o binário esteja no `PATH` do gateway. Se o OpenClaw
rodar como serviço, crie um symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funcionar no seu shell, mas o OpenClaw ainda relatar
`spawn qmd ENOENT`, o processo do gateway provavelmente tem um `PATH` diferente do seu
shell interativo. Fixe o binário explicitamente:

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

Use `command -v qmd` no ambiente em que o QMD está instalado, depois verifique novamente
com `openclaw memory status --deep`.

**Primeira busca muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Faça um pré-aquecimento
com `qmd query "test"` usando os mesmos diretórios XDG que o OpenClaw usa.

**Muitos subprocessos QMD durante a busca?** Atualize o QMD se possível. O OpenClaw usa
um processo para buscas em múltiplas coleções da mesma origem apenas quando o QMD instalado
anuncia suporte a vários filtros `-c`; caso contrário, ele mantém o fallback mais antigo
por coleção para correção.

**QMD apenas BM25 ainda tentando compilar llama.cpp?** Defina
`memory.qmd.searchMode = "search"`. O OpenClaw trata esse modo como apenas lexical,
não executa sondagens de status vetorial do QMD nem manutenção de embedding, e deixa
verificações de prontidão semântica para configurações `vsearch` ou `query`.

**A busca expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina como `120000` para hardware mais lento.

**Resultados vazios em chats em grupo?** Verifique `memory.qmd.scope` -- o padrão só
permite sessões diretas e de canal.

**A busca de memória raiz ficou ampla demais de repente?** Reinicie o gateway ou aguarde
a próxima reconciliação de inicialização. O OpenClaw recria coleções gerenciadas obsoletas
de volta para os padrões canônicos `MEMORY.md` e `memory/` quando detecta um conflito
com o mesmo nome.

**Repos temporários visíveis no workspace causando `ENAMETOOLONG` ou indexação quebrada?**
A travessia do QMD atualmente segue o comportamento do scanner QMD subjacente, e não
as regras de symlink embutidas do OpenClaw. Mantenha checkouts temporários de monorepo em
diretórios ocultos como `.tmp/` ou fora das raízes QMD indexadas até que o QMD exponha
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para a superfície completa de configuração (`memory.qmd.*`), modos de busca, intervalos de atualização,
regras de escopo e todos os outros ajustes, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionado

- [Visão geral de memória](/pt-BR/concepts/memory)
- [Motor de memória embutido](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
