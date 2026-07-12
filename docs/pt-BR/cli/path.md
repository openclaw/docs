---
read_when:
    - Você quer ler ou gravar uma folha dentro de um arquivo do workspace pelo terminal
    - Você está criando scripts que interagem com o estado do workspace e quer um esquema de endereçamento estável e independente do tipo
    - Você está depurando um caminho `oc://` (valide a sintaxe e veja para onde ele resolve)
summary: Referência da CLI para `openclaw path` (inspecione e edite arquivos do espaço de trabalho por meio do esquema de endereçamento `oc://`)
title: Caminho
x-i18n:
    generated_at: "2026-07-11T23:51:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acesso via shell ao esquema de endereçamento `oc://`: uma sintaxe de caminho com despacho por tipo para inspecionar e editar arquivos endereçáveis do espaço de trabalho (markdown, jsonc, jsonl, yaml/yml/lobster). Pessoas que hospedam suas próprias instâncias, autores de plugins e extensões de editores usam esse recurso para ler, localizar ou atualizar um local específico sem precisar criar manualmente um analisador para cada tipo de arquivo.

`path` é fornecido pelo plugin opcional integrado `oc-path`. Ative-o antes do primeiro uso:

```bash
openclaw plugins enable oc-path
```

Os verbos da CLI refletem o modelo de endereçamento:

- `resolve` é concreto e corresponde a um único resultado.
- `find` é o verbo para múltiplas correspondências com curingas, uniões, predicados e expansão posicional.
- `set` aceita somente caminhos concretos ou marcadores de inserção; padrões com curingas são rejeitados antes da gravação.
- `validate` analisa um caminho sem acessar o sistema de arquivos.
- `emit` faz o ciclo completo de análise + emissão de um arquivo (diagnóstico de fidelidade de bytes).

## Por que usar

O estado do OpenClaw está distribuído entre arquivos markdown editados por pessoas, configurações JSONC com comentários, logs JSONL somente para acréscimo e arquivos YAML de fluxos de trabalho/especificações. Scripts, hooks e agentes frequentemente precisam de apenas um pequeno valor desses arquivos: uma chave de frontmatter, uma configuração de plugin, um campo de registro de log, uma etapa YAML ou um item de lista sob uma seção nomeada.

`openclaw path` fornece a esses chamadores um endereço estável em vez de um grep, uma expressão regular ou um analisador específico para cada tipo de arquivo. O mesmo caminho `oc://` pode ser validado, resolvido, pesquisado, simulado e gravado pelo terminal, mantendo automações específicas fáceis de revisar e reproduzir. Ele preserva o restante do arquivo, portanto, gravar uma única folha não altera seus comentários, finais de linha ou a formatação próxima.

Use-o quando o elemento desejado tiver um endereço lógico, mas o formato do arquivo variar:

- Um hook lê uma configuração de um JSONC com comentários sem perder os comentários ao gravar o valor de volta.
- Um script de manutenção encontra todos os campos de eventos correspondentes em um log JSONL sem carregar o log inteiro em um analisador personalizado.
- Um editor salta para uma seção ou item de lista em markdown por slug e, em seguida, renderiza a linha exata que foi resolvida.
- Um agente simula uma pequena edição no espaço de trabalho antes de aplicá-la, com os bytes alterados visíveis na revisão.

Não use `openclaw path` para edições comuns de arquivos inteiros, migrações complexas de configuração ou gravações específicas de memória; nesses casos, use o comando ou plugin responsável. `path` destina-se a pequenas operações em arquivos endereçáveis nas quais um comando de terminal reproduzível é preferível a outro analisador sob medida.

## Como é usado

Leia um valor de um arquivo de configuração editado por pessoas:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Visualize uma gravação sem alterar o disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Encontre registros correspondentes em um log JSONL somente para acréscimo:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Enderece uma instrução em markdown por seção e item, em vez de pelo número da linha:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valide um caminho na CI ou em um script de verificação preliminar antes que o script faça uma leitura ou gravação:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Esses comandos foram projetados para serem copiados em scripts de shell. Use `--json` quando um chamador precisar de saída estruturada e `--human` quando uma pessoa estiver inspecionando o resultado.

## Como funciona

1. Analisa o endereço `oc://` em segmentos: arquivo, seção, item, campo e uma consulta opcional de sessão.
2. Escolhe o adaptador do tipo de arquivo com base na extensão do destino (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Resolve os segmentos em relação à estrutura desse tipo de arquivo: títulos/itens markdown, chaves de objetos/índices de arrays JSONC, registros de linhas JSONL ou nós de mapas/sequências YAML.
4. Para `set`, emite os bytes editados pelo mesmo adaptador, para que as partes não alteradas do arquivo mantenham seus comentários, finais de linha e formatação próxima quando houver suporte para isso no tipo de arquivo.

`resolve` e `set` exigem um único destino concreto. `find` é o verbo exploratório: ele expande curingas, uniões, predicados e ordinais nas correspondências concretas que você pode inspecionar antes de escolher uma para gravar.

## Subcomandos

| Subcomando              | Finalidade                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Exibir a correspondência concreta no caminho (ou "não encontrado").                                            |
| `find <pattern>`        | Enumerar correspondências para um caminho com curinga / união / predicado.                                     |
| `set <oc-path> <value>` | Gravar uma folha ou destino de inserção em um caminho concreto. Compatível com `--dry-run`.                     |
| `validate <oc-path>`    | Apenas analisar; exibir a decomposição estrutural (arquivo / seção / item / campo).                             |
| `emit <file>`           | Fazer o ciclo completo de análise + emissão de um arquivo (diagnóstico de fidelidade de bytes).                 |

## Opções globais

| Opção           | Aplica-se a                      | Finalidade                                                                                       |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Resolver o segmento de arquivo em relação a este diretório (padrão: `process.cwd()`).             |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Substituir o caminho resolvido do segmento de arquivo (acesso absoluto).                          |
| `--json`        | todos                            | Forçar saída JSON (padrão quando stdout não é um TTY).                                            |
| `--human`       | todos                            | Forçar saída legível por pessoas (padrão quando stdout é um TTY).                                 |
| `--value-json`  | `set`                            | Analisar `<value>` como JSON para substituir folhas JSON/JSONC/JSONL.                             |
| `--dry-run`     | `set`                            | Exibir os bytes que seriam gravados sem efetuar a gravação.                                       |
| `--diff`        | `set` (requer `--dry-run`)       | Exibir um diff unificado em vez dos bytes completos.                                              |

`validate` aceita somente `--json` / `--human`; ele não acessa o sistema de arquivos, portanto, `--cwd` e `--file` não se aplicam.

## Sintaxe de `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regras dos segmentos: `field` requer `item`, e `item` requer `section`. Em todos os quatro segmentos:

- **Segmentos entre aspas** — `"a/b.c"` preserva os separadores `/` e `.`. O conteúdo é literal em bytes; `"` e `\` não são permitidos dentro das aspas. O segmento de arquivo também reconhece aspas: `oc://"skills/email-drafter"/Tools/$last` trata `skills/email-drafter` como um único caminho de arquivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Operadores numéricos exigem que ambos os lados possam ser convertidos em números finitos.
- **Uniões** — `{a,b,c}` corresponde a qualquer uma das alternativas.
- **Curingas** — `*` (um único subsegmento) e `**` (zero ou mais, recursivo). `find` os aceita; `resolve` e `set` os rejeitam por serem ambíguos.
- **Posicional** — `$first` / `$last` são resolvidos para o primeiro / último índice ou chave declarada.
- **Ordinal** — `#N` para a enésima correspondência pela ordem do documento.
- **Marcadores de inserção** — `+`, `+key`, `+nnn` para inserção por chave / índice (use com `set`).
- **Escopo da sessão** — `?session=cron-daily` etc. É ortogonal ao aninhamento de segmentos. Os valores de sessão são brutos, sem decodificação percentual; eles não podem conter caracteres de controle nem delimitadores de consulta reservados (`?`, `&`, `%`).

Caracteres reservados (`?`, `&`, `%`) fora de segmentos entre aspas, predicados ou uniões são rejeitados. Caracteres de controle (U+0000-U+001F, U+007F) são rejeitados em qualquer lugar, inclusive no valor da consulta `session`.

`formatOcPath(parseOcPath(path)) === path` é garantido para caminhos canônicos. Parâmetros de consulta não canônicos são ignorados, exceto pelo primeiro valor não vazio de `session=`.

Limites rígidos: um caminho tem limite de 4096 bytes, no máximo 4 segmentos (arquivo/seção/item/campo), no máximo 64 subsegmentos separados por pontos em cada segmento e no máximo 256 níveis de travessia aninhada para caminhos JSON profundos. Separadamente, qualquer entrada de arquivo JSONC/JSON com mais de 16 MiB é recusada com um diagnóstico de análise, em vez de ser analisada, para qualquer verbo que carregue esse arquivo.

## Endereçamento por tipo de arquivo

| Tipo          | Extensões de arquivo            | Modelo de endereçamento                                                                                                         |
| ------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                           | Seções H2 por slug, itens de lista por slug ou `#N`, frontmatter por meio de `[frontmatter]`.                                    |
| JSONC/JSON    | `.jsonc`, `.json`               | Chaves de objetos e índices de arrays; pontos dividem subsegmentos aninhados, exceto quando estão entre aspas.                   |
| JSONL         | `.jsonl`, `.ndjson`             | Endereços de linhas de nível superior (`L1`, `L2`, `$first`, `$last`), seguidos por descida no estilo JSONC dentro da linha.    |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`     | Chaves de mapas e índices de sequências; comentários e estilo de fluxo são tratados pela API de documentos YAML.                |

`resolve` retorna uma correspondência estruturada: `root`, `node`, `leaf` ou `insertion-point`, com um número de linha baseado em 1. Os valores de folha são expostos como texto mais um `leafType`, para que autores de plugins possam renderizar visualizações sem depender do formato da AST específico de cada tipo.

## Contrato de mutação

`set` grava um único destino concreto:

- Valores de frontmatter markdown e campos de item `- key: value` são folhas de string. Inserções em markdown acrescentam seções, chaves de frontmatter ou itens de seção e renderizam um formato markdown canônico para o arquivo alterado. Corpos de seções não podem ser gravados integralmente por meio de `set`.
- Gravações de folhas JSONC convertem o valor da string para o tipo existente da folha (`string`, `number` finito, `true`/`false` ou `null`). Use `--value-json` quando a substituição de uma folha JSONC/JSON/JSONL precisar analisar `<value>` como JSON e puder alterar o formato, como ao substituir uma forma abreviada de referência de segredo em string por um objeto. Inserções em objetos e arrays JSONC analisam `<value>` como JSON e usam o caminho de edição do `jsonc-parser` para gravações comuns de folhas, preservando comentários e a formatação próxima.
- Gravações de folhas JSONL fazem a conversão como JSONC dentro de uma linha. A substituição de uma linha inteira e o acréscimo analisam `<value>` como JSON. O JSONL renderizado preserva a convenção predominante de final de linha LF/CRLF do arquivo (votação por maioria entre as quebras de linha do arquivo, de modo que um arquivo predominantemente CRLF continue usando CRLF mesmo com alguns LFs isolados).
- Gravações de folhas YAML convertem para o tipo escalar existente (`string`, `number` finito, `true`/`false` ou `null`). Inserções YAML usam a API de documentos do pacote `yaml` integrado para atualizações de mapas/sequências. Documentos YAML malformados com erros do analisador são recusados antes da mutação com `parse-error`.

Use `--dry-run` antes de gravações visíveis para o usuário quando os bytes exatos forem importantes. Edições JSONC e YAML modificam o documento existente (por meio do `jsonc-parser` ou da API de documentos `yaml`), portanto, os bytes não alterados geralmente são preservados; o markdown reconstrói o arquivo com base em sua estrutura analisada em qualquer edição, o que pode normalizar a formatação incidental fora da folha alterada. Adicione `--diff` quando quiser visualizar uma alteração focada de antes/depois em vez do arquivo renderizado completo.

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
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Receitas por tipo de arquivo

Os mesmos cinco verbos funcionam em todos os tipos; o esquema de endereçamento faz o direcionamento com base na extensão do arquivo.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

O predicado `[frontmatter]` endereça o bloco de frontmatter YAML; `tools`
corresponde ao título `## Tools` por meio do slug, e as folhas dos itens mantêm
sua forma de slug mesmo quando a origem usa sublinhados (`send_email` torna-se
`send-email`).

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
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

As edições em JSONC passam por `jsonc-parser`, portanto comentários e espaços
em branco são preservados após um `set`. Execute primeiro com `--dry-run` para
inspecionar os bytes antes de confirmar a alteração. Arquivos `.json` usam o
mesmo adaptador e caminho de edição que arquivos `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Cada linha é um registro. Enderece por predicado (`[event=action]`) quando você
não souber o número da linha ou pelo segmento canônico `LN` quando souber.
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
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

O YAML usa a API `Document` do pacote `yaml`, em vez de um analisador
implementado manualmente. Assim, ciclos comuns de análise e emissão preservam
comentários e a estrutura de autoria, enquanto os caminhos resolvidos usam o
mesmo modelo de chave de mapa/índice de sequência que o JSONC. O mesmo adaptador
processa arquivos `.yaml`, `.yml` e `.lobster`.

## Referência de subcomandos

### `resolve <oc-path>`

Lê uma única folha ou Node. Curingas são rejeitados — use `find` para eles.
Encerra com `0` quando encontra uma correspondência, `1` quando não encontra
uma correspondência sem erros e `2` em caso de erro de análise ou padrão
recusado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera todas as correspondências de um padrão com curinga, predicado ou união.
Encerra com `0` quando há pelo menos uma correspondência e com `1` quando não há
nenhuma. Curingas no campo de arquivo são rejeitados com
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — forneça um arquivo específico (a expansão
de padrões para vários arquivos é uma funcionalidade futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Grava uma folha. Use com `--dry-run` para visualizar os bytes que seriam
gravados sem alterar o arquivo. Adicione `--diff` para visualizar uma
comparação unificada. Encerra com `0` após uma gravação bem-sucedida, `1` se o
substrato recusar a operação (por exemplo, se uma proteção de sentinela for
acionada) e `2` em caso de erros de análise.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

O marcador de inserção `+key` cria o filho especificado caso ele ainda não
exista; `+nnn` e `+` isolado servem, respectivamente, para inserção por índice
e inserção ao final.

### `validate <oc-path>`

Verificação somente de análise. Não acessa o sistema de arquivos. É útil para
confirmar se um caminho de modelo está bem-formado antes de substituir
variáveis ou para obter a decomposição estrutural durante a depuração:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Encerra com `0` quando válido, `1` quando inválido (com `code` e `message`
estruturados) e `2` em caso de erros nos argumentos.

### `emit <file>`

Processa um arquivo em um ciclo completo pelo analisador e emissor
correspondentes ao tipo. Em um arquivo válido, a saída deve ser idêntica à
entrada em nível de bytes; qualquer divergência indica um erro do analisador ou
o acionamento de uma sentinela. É útil para depurar o comportamento do substrato
com entradas reais.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de saída

| Código | Significado                                                                                  |
| ------ | -------------------------------------------------------------------------------------------- |
| `0`    | Sucesso. (`resolve` / `find`: pelo menos uma correspondência. `set`: gravação bem-sucedida.) |
| `1`    | Nenhuma correspondência, ou `set` rejeitado pelo substrato (sem erro no nível do sistema).   |
| `2`    | Erro de argumento ou análise.                                                                |

## Modo de saída

`openclaw path` detecta TTY: produz uma saída legível para humanos em um
terminal e JSON quando a saída padrão é enviada por pipe ou redirecionada.
`--json` e `--human` substituem a detecção automática.

## Observações

- `set` grava bytes pelo caminho de emissão do substrato, que aplica
  automaticamente a proteção de sentinela de ocultação. Uma folha que contenha
  `__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento
  da gravação.
- A análise de JSONC e as edições de folhas usam a dependência `jsonc-parser`
  local do Plugin, portanto comentários e formatação são preservados em
  gravações comuns de folhas, em vez de passar por um caminho de análise e
  renderização implementado manualmente.
- `path` não reconhece o rastreamento nem a recuperação da última configuração
  válida conhecida (LKG); esse ciclo de vida pertence a outro componente. Se um
  arquivo editado por meio de `path` também for rastreado como LKG, a próxima
  leitura da configuração decidirá se deve promovê-lo ou recuperá-lo; trate uma
  edição feita por `path` da mesma forma que qualquer outra gravação direta
  nesse arquivo.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
