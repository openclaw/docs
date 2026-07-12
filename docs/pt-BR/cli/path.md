---
read_when:
    - Você quer ler ou gravar um nó folha em um arquivo do workspace pelo terminal
    - Você está criando scripts para o estado do workspace e quer um esquema de endereçamento estável e independente de tipo
    - Você está depurando um caminho `oc://` (valide a sintaxe e veja para onde ele é resolvido)
summary: Referência da CLI para `openclaw path` (inspecione e edite arquivos do espaço de trabalho por meio do esquema de endereçamento `oc://`)
title: Caminho
x-i18n:
    generated_at: "2026-07-12T15:02:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acesso pelo shell ao esquema de endereçamento `oc://`: uma sintaxe de caminho
com despacho por tipo para inspecionar e editar arquivos endereçáveis do
workspace (markdown, jsonc, jsonl, yaml/yml/lobster). Administradores de
instalações auto-hospedadas, autores de plugins e extensões de editores a usam
para ler, localizar ou atualizar um local específico sem criar manualmente um
analisador para cada arquivo.

`path` é fornecido pelo plugin opcional incluído `oc-path`. Ative-o antes do
primeiro uso:

```bash
openclaw plugins enable oc-path
```

Os verbos da CLI refletem o modelo de endereçamento:

- `resolve` é concreto e retorna uma única correspondência.
- `find` é o verbo de múltiplas correspondências para curingas, uniões,
  predicados e expansão posicional.
- `set` aceita apenas caminhos concretos ou marcadores de inserção; padrões
  com curingas são rejeitados antes da gravação.
- `validate` analisa um caminho sem acesso ao sistema de arquivos.
- `emit` processa um arquivo em ciclo completo de análise + emissão
  (diagnóstico de fidelidade de bytes).

## Por que usar

O estado do OpenClaw está distribuído entre arquivos markdown editados por
pessoas, configurações JSONC com comentários, logs JSONL somente de acréscimo
e arquivos YAML de fluxos de trabalho/especificações. Scripts, hooks e agentes
frequentemente precisam de um único valor pequeno desses arquivos: uma chave
de frontmatter, uma configuração de plugin, um campo de registro de log, uma
etapa YAML ou um item com marcador sob uma seção nomeada.

`openclaw path` fornece a esses chamadores um endereço estável em vez de um
grep, uma expressão regular ou um analisador específico para cada tipo de
arquivo. O mesmo caminho `oc://` pode ser validado, resolvido, pesquisado,
simulado e gravado pelo terminal, mantendo automações pontuais fáceis de
revisar e reproduzir. Ele preserva o restante do arquivo, portanto gravar uma
única folha não altera seus comentários, finais de linha nem a formatação
próxima.

Use-o quando o que você procura tiver um endereço lógico, mas o formato do
arquivo variar:

- Um hook lê uma configuração de um JSONC com comentários sem perder os
  comentários ao gravar o valor de volta.
- Um script de manutenção localiza todos os campos de eventos correspondentes
  em um log JSONL sem carregar o log inteiro em um analisador personalizado.
- Um editor navega até uma seção ou um item com marcador do markdown pelo
  slug e renderiza a linha exata que foi resolvida.
- Um agente simula uma pequena edição no workspace antes de aplicá-la, com os
  bytes alterados visíveis na revisão.

Não use `openclaw path` para edições comuns de arquivos inteiros, migrações
avançadas de configuração ou gravações específicas de memória; nesses casos,
use o comando ou plugin proprietário do recurso. `path` destina-se a pequenas
operações endereçáveis em arquivos, quando um comando de terminal reproduzível
é melhor que outro analisador personalizado.

## Como usar

Leia um valor de um arquivo de configuração editado por pessoas:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Visualize uma gravação sem alterar o disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Localize registros correspondentes em um log JSONL somente de acréscimo:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Enderece uma instrução no markdown pela seção e pelo item, em vez do número da
linha:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valide um caminho no CI ou em um script de pré-verificação antes de o script
ler ou gravar:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Esses comandos foram projetados para serem copiados em scripts de shell. Use
`--json` quando um chamador precisar de saída estruturada e `--human` quando
uma pessoa estiver inspecionando o resultado.

## Como funciona

1. Analisa o endereço `oc://` em slots: arquivo, seção, item, campo e uma
   consulta de sessão opcional.
2. Escolhe o adaptador do tipo de arquivo com base na extensão de destino
   (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`,
   `.lobster`).
3. Resolve os slots de acordo com a estrutura desse tipo de arquivo:
   cabeçalhos/itens de markdown, chaves de objetos/índices de arrays JSONC,
   registros de linhas JSONL ou nós de mapas/sequências YAML.
4. Para `set`, emite os bytes editados pelo mesmo adaptador para que as partes
   intactas do arquivo mantenham seus comentários, finais de linha e
   formatação próxima quando houver suporte no tipo.

`resolve` e `set` exigem um único destino concreto. `find` é o verbo
exploratório: ele expande curingas, uniões, predicados e ordinais nas
correspondências concretas que podem ser inspecionadas antes de escolher uma
para gravar.

## Subcomandos

| Subcomando               | Finalidade                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `resolve <oc-path>`      | Exibe a correspondência concreta no caminho (ou "não encontrado").                   |
| `find <pattern>`         | Enumera correspondências de um caminho com curinga / união / predicado.              |
| `set <oc-path> <value>`  | Grava uma folha ou um destino de inserção em um caminho concreto. Aceita `--dry-run`. |
| `validate <oc-path>`     | Somente análise; exibe a decomposição estrutural (arquivo / seção / item / campo).    |
| `emit <file>`            | Processa um arquivo em ciclo completo de análise + emissão (fidelidade de bytes).     |

## Opções globais

| Opção           | Aplicável a                      | Finalidade                                                                       |
| --------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Resolve o slot de arquivo em relação a este diretório (padrão: `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Substitui o caminho resolvido do slot de arquivo (acesso absoluto).              |
| `--json`        | todos                            | Força a saída JSON (padrão quando stdout não é um TTY).                          |
| `--human`       | todos                            | Força a saída legível por humanos (padrão quando stdout é um TTY).               |
| `--value-json`  | `set`                            | Analisa `<value>` como JSON para substituir folhas JSON/JSONC/JSONL.             |
| `--dry-run`     | `set`                            | Exibe os bytes que seriam gravados sem realizar a gravação.                      |
| `--diff`        | `set` (requer `--dry-run`)       | Exibe um diff unificado em vez de todos os bytes.                                |

`validate` aceita apenas `--json` / `--human`; ele não acessa o sistema de
arquivos, portanto `--cwd` e `--file` não se aplicam.

## Sintaxe de `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regras dos slots: `field` exige `item`, e `item` exige `section`. Nos quatro
slots:

- **Segmentos entre aspas** — `"a/b.c"` preserva os separadores `/` e `.`. O
  conteúdo é literal em bytes; `"` e `\` não são permitidos dentro das aspas.
  O slot de arquivo também reconhece aspas:
  `oc://"skills/email-drafter"/Tools/$last` trata `skills/email-drafter` como
  um único caminho de arquivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`.
  Operadores numéricos exigem que ambos os lados possam ser convertidos em
  números finitos.
- **Uniões** — `{a,b,c}` corresponde a qualquer uma das alternativas.
- **Curingas** — `*` (um único subsegmento) e `**` (zero ou mais, recursivo).
  `find` os aceita; `resolve` e `set` os rejeitam por serem ambíguos.
- **Posicional** — `$first` / `$last` são resolvidos para o primeiro / último
  índice ou chave declarada.
- **Ordinal** — `#N` para a enésima correspondência pela ordem do documento.
- **Marcadores de inserção** — `+`, `+key`, `+nnn` para inserção por chave /
  índice (use com `set`).
- **Escopo da sessão** — `?session=cron-daily` etc. Independente do
  aninhamento dos slots. Os valores da sessão são brutos, sem decodificação
  percentual; eles não podem conter caracteres de controle nem delimitadores
  reservados de consulta (`?`, `&`, `%`).

Caracteres reservados (`?`, `&`, `%`) fora de segmentos entre aspas,
predicados ou uniões são rejeitados. Caracteres de controle
(U+0000-U+001F, U+007F) são rejeitados em qualquer lugar, inclusive no valor
da consulta `session`.

`formatOcPath(parseOcPath(path)) === path` é garantido para caminhos
canônicos. Parâmetros de consulta não canônicos são ignorados, exceto pelo
primeiro valor não vazio de `session=`.

Limites rígidos: um caminho é limitado a 4096 bytes, no máximo 4 slots
(arquivo/seção/item/campo), no máximo 64 subsegmentos separados por ponto por
slot e no máximo 256 níveis de travessia aninhada para caminhos JSON
profundos. Separadamente, qualquer entrada de arquivo JSONC/JSON com mais de
16 MiB é recusada com um diagnóstico de análise, em vez de ser analisada,
para qualquer verbo que carregue esse arquivo.

## Endereçamento por tipo de arquivo

| Tipo          | Extensões de arquivo         | Modelo de endereçamento                                                                                 |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | Seções H2 por slug, itens com marcador por slug ou `#N`, frontmatter por `[frontmatter]`.               |
| JSONC/JSON    | `.jsonc`, `.json`            | Chaves de objetos e índices de arrays; pontos dividem subsegmentos aninhados, exceto entre aspas.       |
| JSONL         | `.jsonl`, `.ndjson`          | Endereços de linha de nível superior (`L1`, `L2`, `$first`, `$last`) e descida no estilo JSONC na linha. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | Chaves de mapas e índices de sequências; comentários e estilo de fluxo são tratados pela API YAML.      |

`resolve` retorna uma correspondência estruturada: `root`, `node`, `leaf` ou
`insertion-point`, com um número de linha baseado em 1. Os valores das folhas
são apresentados como texto junto com um `leafType`, para que autores de
plugins possam renderizar visualizações sem depender do formato da AST de
cada tipo.

## Contrato de mutação

`set` grava um destino concreto:

- Valores de frontmatter do markdown e campos de item `- key: value` são
  folhas de string. Inserções no markdown acrescentam seções, chaves de
  frontmatter ou itens de seção e renderizam um formato markdown canônico
  para o arquivo alterado. Corpos de seções não podem ser gravados
  integralmente por meio de `set`.
- Gravações de folhas JSONC convertem o valor da string para o tipo da folha
  existente (`string`, `number` finito, `true`/`false` ou `null`). Use
  `--value-json` quando a substituição de uma folha JSONC/JSON/JSONL precisar
  analisar `<value>` como JSON e puder alterar o formato, como ao substituir
  uma forma abreviada de referência de segredo em string por um objeto.
  Inserções em objetos e arrays JSONC analisam `<value>` como JSON e usam o
  caminho de edição do `jsonc-parser` para gravações comuns de folhas,
  preservando comentários e a formatação próxima.
- Gravações de folhas JSONL fazem a conversão como JSONC dentro de uma linha.
  A substituição de uma linha inteira e o acréscimo analisam `<value>` como
  JSON. O JSONL renderizado preserva a convenção predominante de final de
  linha LF/CRLF do arquivo (votação majoritária entre as quebras de linha do
  arquivo, de modo que um arquivo majoritariamente CRLF permaneça CRLF mesmo
  com alguns LFs isolados).
- Gravações de folhas YAML convertem para o tipo escalar existente (`string`,
  `number` finito, `true`/`false` ou `null`). Inserções YAML usam a API de
  documento do pacote `yaml` incluído para atualizações de mapas/sequências.
  Documentos YAML malformados com erros do analisador são recusados antes da
  mutação com `parse-error`.

Use `--dry-run` antes de gravações visíveis ao usuário quando os bytes exatos
forem importantes. Edições JSONC e YAML corrigem o documento existente (por
meio do `jsonc-parser` ou da API de documento do `yaml`), portanto os bytes
intactos geralmente são preservados; o markdown reconstrói o arquivo a partir
de sua estrutura analisada em qualquer edição, o que pode normalizar a
formatação incidental fora da folha alterada. Adicione `--diff` quando quiser
visualizar uma correção focada de antes/depois, em vez do arquivo renderizado
completo.

## Exemplos

```bash
# Validar um caminho (sem acesso ao sistema de arquivos)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Ler uma folha
openclaw path resolve 'oc://gateway.jsonc/version'

# Pesquisa com curinga
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Simular uma gravação
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Simular uma gravação como um diff unificado
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Aplicar a gravação
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Ciclo completo com fidelidade de bytes (diagnóstico)
openclaw path emit ./AGENTS.md
```

Mais exemplos de gramática:

```bash
# Coloque entre aspas as chaves que contêm / ou .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Caminhos JSON/JSONC profundos podem usar segmentos com barras; eles são normalizados como subsegmentos separados por pontos
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Substitua uma folha JSONC por um objeto analisado
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Pesquisa por predicado nos filhos JSONC
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insira em um array JSONC
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insira uma chave de objeto JSONC
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Acrescente um evento JSONL
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolva a última linha de valor JSONL
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolva uma etapa de fluxo de trabalho YAML
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Atualize um escalar YAML
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Enderece o frontmatter do Markdown
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insira frontmatter no Markdown
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Encontre campos de itens do Markdown
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Valide um caminho com escopo de sessão
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Receitas por tipo de arquivo

Os mesmos cinco verbos funcionam em todos os tipos; o esquema de endereçamento
faz o direcionamento com base na extensão do arquivo.

### Markdown

```text
<!-- frontmatter.md -->
---
name: elaborador
description: agente de elaboração de emails
tier: núcleo
---
## Ferramentas
- gh: CLI do GitHub
- curl: cliente HTTP
- send_email: habilitado
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
folha em L4: "núcleo" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
folha em L9: "CLI do GitHub" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 correspondências para oc://x.md/tools/*:
  oc://x.md/tools/gh           →  nó em L9 [md-item]
  oc://x.md/tools/curl         →  nó em L10 [md-item]
  oc://x.md/tools/send-email   →  nó em L11 [md-item]
```

O predicado `[frontmatter]` endereça o bloco de frontmatter YAML; `tools`
corresponde ao cabeçalho `## Tools` por meio do slug, e as folhas dos itens
mantêm sua forma de slug mesmo quando a origem usa sublinhados (`send_email`
torna-se `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
folha em L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: gravaria 142 bytes em /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

As edições de JSONC passam pelo `jsonc-parser`, portanto comentários e espaços
em branco sobrevivem a uma operação `set`. Execute primeiro com `--dry-run`
para inspecionar os bytes antes de confirmar. Arquivos `.json` usam o mesmo
adaptador e caminho de edição que arquivos `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 correspondência para oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  folha em L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
folha em L2: "2" (number)
```

Cada linha é um registro. Enderece por predicado (`[event=action]`) quando não
souber o número da linha, ou pelo segmento canônico `LN` quando souber.
Arquivos `.ndjson` usam o mesmo adaptador que arquivos `.jsonl`.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
folha em L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: gravaria 99 bytes em /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

O YAML usa a API `Document` do pacote `yaml`, em vez de um analisador
desenvolvido manualmente, portanto ciclos comuns de análise/emissão preservam
comentários e a estrutura de autoria, enquanto os caminhos resolvidos usam o
mesmo modelo de chave de mapa/índice de sequência do JSONC. O mesmo adaptador
processa arquivos `.yaml`, `.yml` e `.lobster`.

## Referência de subcomandos

### `resolve <oc-path>`

Lê uma única folha ou nó. Curingas são rejeitados — use `find` para eles.
Encerra com `0` quando há correspondência, `1` quando não há correspondência
sem erros e `2` quando há erro de análise ou o padrão é recusado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera todas as correspondências de um padrão de curinga/predicado/união.
Encerra com `0` quando há pelo menos uma correspondência e `1` quando não há
nenhuma. Curingas no slot de arquivo são rejeitados com
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — forneça um arquivo específico (a
expansão de padrões para vários arquivos é uma funcionalidade futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Grava uma folha. Use com `--dry-run` para visualizar os bytes que seriam
gravados sem alterar o arquivo. Adicione `--diff` para visualizar uma
diferença unificada. Encerra com `0` após uma gravação bem-sucedida, `1` se o
substrato recusar (por exemplo, se uma proteção de sentinela for acionada) e
`2` em caso de erros de análise.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

O marcador de inserção `+key` cria o filho nomeado caso ele ainda não exista;
`+nnn` e `+` isolado funcionam, respectivamente, para inserção indexada e
acréscimo ao final.

### `validate <oc-path>`

Verificação apenas de análise. Sem acesso ao sistema de arquivos. É útil para
confirmar se um caminho de modelo está bem-formado antes de substituir
variáveis ou para obter a decomposição estrutural durante a depuração:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
válido: oc://AGENTS.md/tools/gh
  arquivo:  AGENTS.md
  seção:    tools
  item:     gh
```

Encerra com `0` quando válido, `1` quando inválido (com `code` e `message`
estruturados) e `2` em caso de erros de argumentos.

### `emit <file>`

Executa um ciclo completo de análise e emissão de um arquivo com o analisador
e emissor correspondente ao tipo. A saída deve ser idêntica à entrada em
nível de bytes para um arquivo válido; divergências indicam um bug no
analisador ou o acionamento de uma sentinela. É útil para depurar o
comportamento do substrato com entradas reais.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de saída

| Código | Significado                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| `0`    | Sucesso. (`resolve` / `find`: pelo menos uma correspondência. `set`: gravação bem-sucedida.) |
| `1`    | Nenhuma correspondência ou `set` rejeitado pelo substrato (sem erro no nível do sistema). |
| `2`    | Erro de argumento ou análise.                                                  |

## Modo de saída

`openclaw path` detecta o TTY: apresenta saída legível por humanos em um
terminal e JSON quando stdout é canalizado ou redirecionado. `--json` e
`--human` substituem a detecção automática.

## Observações

- `set` grava bytes pelo caminho de emissão do substrato, que aplica
  automaticamente a proteção de sentinela de ocultação. Uma folha que
  contenha `__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada
  no momento da gravação.
- A análise de JSONC e as edições de folhas usam a dependência
  `jsonc-parser` local do plugin, portanto comentários e formatação são
  preservados em gravações comuns de folhas, em vez de passarem por um
  caminho de análise e renderização desenvolvido manualmente.
- `path` não reconhece o rastreamento nem a recuperação da última configuração
  válida conhecida (LKG); esse ciclo de vida pertence a outro componente. Se
  um arquivo editado por meio de `path` também for rastreado por LKG, a próxima
  leitura da configuração decidirá se deve promovê-lo ou recuperá-lo; trate
  uma edição por `path` da mesma forma que qualquer outra gravação direta
  nesse arquivo.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
