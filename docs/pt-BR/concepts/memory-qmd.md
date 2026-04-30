---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como reordenação de resultados ou caminhos indexados adicionais
summary: Sidecar de busca com prioridade local, BM25, vetores, reordenação e expansão de consulta
title: Mecanismo de memória QMD
x-i18n:
    generated_at: "2026-04-30T09:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) é um sidecar de busca que prioriza o local e roda
junto com o OpenClaw. Ele combina BM25, busca vetorial e reclassificação em um único
binário, e pode indexar conteúdo além dos arquivos de memória do seu workspace.

## O que ele adiciona em relação ao integrado

- **Reclassificação e expansão de consulta** para melhor recuperação.
- **Indexação de diretórios extras** -- documentação do projeto, notas da equipe, qualquer coisa em disco.
- **Indexação de transcrições de sessões** -- recupere conversas anteriores.
- **Totalmente local** -- roda com o pacote de runtime opcional node-llama-cpp e
  baixa modelos GGUF automaticamente.
- **Fallback automático** -- se o QMD estiver indisponível, o OpenClaw volta para o
  mecanismo integrado sem interrupção.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build do SQLite que permite extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do Gateway.
- macOS e Linux funcionam sem configuração extra. No Windows, o melhor suporte é via WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria uma home autônoma do QMD em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida
do sidecar -- coleções, atualizações e execuções de embedding são tratadas por você.
Ele prefere os formatos atuais de coleção do QMD e consulta MCP, mas ainda recorre a
flags alternativas de padrão de coleção e nomes mais antigos de ferramentas MCP quando necessário.
A reconciliação no boot também recria coleções gerenciadas obsoletas de volta para seus
padrões canônicos quando uma coleção QMD mais antiga com o mesmo nome ainda está
presente.

## Como o sidecar funciona

- O OpenClaw cria coleções a partir dos seus arquivos de memória do workspace e de quaisquer
  `memory.qmd.paths` configurados, depois executa `qmd update` quando o gerenciador QMD é
  aberto e periodicamente depois disso (padrão: a cada 5 minutos). Essas atualizações
  rodam por subprocessos do QMD, não por uma varredura de sistema de arquivos em processo.
  Modos semânticos também executam `qmd embed`.
- A coleção padrão do workspace acompanha `MEMORY.md` mais a árvore `memory/`.
  `memory.md` em minúsculas não é indexado como arquivo de memória raiz.
- O scanner do próprio QMD ignora caminhos ocultos e diretórios comuns de dependências/build,
  como `.git`, `.cache`, `node_modules`, `vendor`, `dist` e
  `build`. A inicialização do Gateway não inicializa o QMD por padrão, então o boot frio
  evita importar o runtime de memória ou criar o watcher de longa duração antes de
  a memória ser usada pela primeira vez.
- Se você quiser uma atualização na inicialização do Gateway mesmo assim, defina
  `memory.qmd.update.startup` como `idle` ou `immediate`. A atualização de inicialização
  opcional usa um caminho de subprocesso QMD de execução única em vez de criar o watcher
  completo de longa duração em processo.
- As buscas usam o `searchMode` configurado (padrão: `search`; também oferece suporte a
  `vsearch` e `query`). `search` é somente BM25, então o OpenClaw pula sondagens de
  prontidão vetorial semântica e manutenção de embeddings nesse modo. Se um modo
  falhar, o OpenClaw tenta novamente com `qmd query`.
- Com versões do QMD que anunciam filtros de múltiplas coleções, o OpenClaw agrupa
  coleções da mesma origem em uma única invocação de busca do QMD. Versões mais antigas do QMD
  mantêm o fallback compatível por coleção.
- Se o QMD falhar completamente, o OpenClaw volta para o mecanismo SQLite integrado.
  Tentativas repetidas em turnos de chat aguardam brevemente após uma falha de abertura para que
  um binário ausente ou dependência quebrada do sidecar não crie uma tempestade de retentativas;
  `openclaw memory status` e sondagens únicas da CLI ainda verificam o QMD diretamente.

<Info>
A primeira busca pode ser lenta -- o QMD baixa automaticamente modelos GGUF (~2 GB) para
reclassificação e expansão de consulta na primeira execução de `qmd query`.
</Info>

## Desempenho de busca e compatibilidade

O OpenClaw mantém o caminho de busca do QMD compatível com instalações atuais e antigas
do QMD.

Na inicialização, o OpenClaw verifica uma vez por gerenciador o texto de ajuda do QMD instalado. Se o
binário anunciar suporte a múltiplos filtros de coleção, o OpenClaw busca em todas as
coleções da mesma origem com um comando:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Isso evita iniciar um subprocesso QMD para cada coleção de memória durável.
Coleções de transcrições de sessão permanecem em seu próprio grupo de origem, então buscas mistas
`memory` + `sessions` ainda fornecem ao diversificador de resultados entradas de ambas as
origens.

Builds mais antigos do QMD aceitam apenas um filtro de coleção. Quando o OpenClaw detecta um
desses builds, ele mantém o caminho de compatibilidade e busca em cada coleção
separadamente antes de mesclar e deduplicar resultados.

Para inspecionar manualmente o contrato instalado, execute:

```bash
qmd --help | grep -i collection
```

A ajuda atual do QMD diz que filtros de coleção podem mirar uma ou mais coleções.
A ajuda mais antiga geralmente descreve uma única coleção.

## Substituições de modelo

As variáveis de ambiente de modelo do QMD são repassadas sem alterações pelo processo do Gateway,
então você pode ajustar o QMD globalmente sem adicionar nova configuração do OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Depois de mudar o modelo de embedding, execute os embeddings novamente para que o índice corresponda ao
novo espaço vetorial.

## Indexação de caminhos extras

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
resultados de busca. `memory_get` entende esse prefixo e lê a partir da raiz correta
da coleção.

## Indexação de transcrições de sessão

Habilite a indexação de sessões para recuperar conversas anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

As transcrições são exportadas como turnos sanitizados de User/Assistant para uma coleção QMD
dedicada em `~/.openclaw/agents/<id>/qmd/sessions/`.

## Escopo de busca

Por padrão, os resultados de busca do QMD são exibidos em sessões diretas e de canal
(não em grupos). Configure `memory.qmd.scope` para mudar isso:

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
enquanto ainda passa o caminho internamente para o agente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reclassificação para resultados de maior qualidade.
- Buscar documentação ou notas do projeto fora do workspace.
- Recuperar conversas de sessões passadas.
- Busca totalmente local sem chaves de API.

Para configurações mais simples, o [mecanismo integrado](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências extras.

## Solução de problemas

**QMD não encontrado?** Garanta que o binário esteja no `PATH` do Gateway. Se o OpenClaw
rodar como um serviço, crie um symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Se `qmd --version` funcionar no seu shell, mas o OpenClaw ainda relatar
`spawn qmd ENOENT`, o processo do Gateway provavelmente tem um `PATH` diferente do seu
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

Use `command -v qmd` no ambiente em que o QMD está instalado e depois verifique novamente
com `openclaw memory status --deep`.

**Primeira busca muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Pré-aqueça
com `qmd query "test"` usando os mesmos diretórios XDG que o OpenClaw usa.

**Muitos subprocessos QMD durante a busca?** Atualize o QMD se possível. O OpenClaw usa
um processo para buscas de múltiplas coleções da mesma origem apenas quando o QMD instalado
anuncia suporte a múltiplos filtros `-c`; caso contrário, mantém o fallback mais antigo
por coleção para preservar a correção.

**QMD somente BM25 ainda tentando compilar llama.cpp?** Defina
`memory.qmd.searchMode = "search"`. O OpenClaw trata esse modo como apenas lexical,
não executa sondagens de status vetorial do QMD nem manutenção de embeddings, e deixa
as verificações de prontidão semântica para configurações `vsearch` ou `query`.

**Busca expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina como `120000` para hardware mais lento.

**Resultados vazios em chats de grupo?** Verifique `memory.qmd.scope` -- o padrão só
permite sessões diretas e de canal.

**A busca de memória raiz ficou ampla demais de repente?** Reinicie o Gateway ou aguarde
a próxima reconciliação de inicialização. O OpenClaw recria coleções gerenciadas obsoletas
de volta para os padrões canônicos `MEMORY.md` e `memory/` quando detecta um conflito
com o mesmo nome.

**Repositórios temporários visíveis no workspace causando `ENAMETOOLONG` ou indexação quebrada?**
A travessia do QMD atualmente segue o comportamento do scanner QMD subjacente, em vez das
regras de symlink integradas do OpenClaw. Mantenha checkouts temporários de monorepos em
diretórios ocultos como `.tmp/` ou fora das raízes QMD indexadas até que o QMD exponha
travessia segura contra ciclos ou controles de exclusão explícitos.

## Configuração

Para a superfície completa de configuração (`memory.qmd.*`), modos de busca, intervalos de atualização,
regras de escopo e todos os outros ajustes, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionado

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Mecanismo de memória integrado](/pt-BR/concepts/memory-builtin)
- [Memória do Honcho](/pt-BR/concepts/memory-honcho)
