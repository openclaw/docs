---
read_when:
    - Você quer ler ou escrever uma folha dentro de um arquivo do espaço de trabalho a partir do terminal
    - Você está criando scripts com base no estado do espaço de trabalho e quer um esquema de endereçamento estável e independente do tipo
    - Você está depurando um caminho `oc://` (valide a sintaxe, veja para o que ele é resolvido)
summary: Referência da CLI para `openclaw path` (inspecione e edite arquivos do workspace via o esquema de endereçamento `oc://`)
title: Caminho
x-i18n:
    generated_at: "2026-06-27T17:20:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acesso de shell fornecido por Plugin ao substrato de endereçamento `oc://`: um
esquema de caminhos despachado por tipo para inspecionar e editar arquivos
endereçáveis do workspace (markdown, jsonc, jsonl, yaml/yml/lobster). Operadores
self-hosted, autores de Plugin e extensões de editor o usam para ler, localizar
ou atualizar um local restrito sem criar parsers por arquivo manualmente.

A CLI espelha os verbos públicos do substrato:

- `resolve` é concreto e de correspondência única.
- `find` é o verbo de múltiplas correspondências para curingas, uniões, predicados e
  expansão posicional.
- `set` aceita apenas caminhos concretos ou marcadores de inserção; padrões com curinga são
  rejeitados antes da escrita.

`path` é fornecido pelo Plugin opcional incluído `oc-path`. Habilite-o antes
do primeiro uso:

```bash
openclaw plugins enable oc-path
```

## Por que usá-lo

O estado do OpenClaw fica espalhado por markdown editado por humanos, configuração JSONC
comentada, logs JSONL somente de acréscimo e arquivos YAML de workflow/especificação. Scripts
de shell, hooks e agentes frequentemente precisam de um pequeno valor desses arquivos: uma chave
de frontmatter, uma configuração de Plugin, um campo de registro de log, uma etapa YAML ou um
item de lista sob uma seção nomeada.

`openclaw path` dá a esses chamadores um endereço estável em vez de um grep,
regex ou parser pontual para cada tipo de arquivo. O mesmo caminho `oc://` pode ser validado,
resolvido, pesquisado, simulado e escrito pelo terminal, o que torna automações restritas
mais fáceis de revisar e mais seguras de reproduzir. Ele é especialmente útil quando
você quer atualizar uma folha preservando o restante dos comentários, quebras de linha e
formatação adjacente do arquivo.

Use-o quando o que você quer tem um endereço lógico, mas o formato físico do arquivo
varia:

- Um hook quer ler uma configuração de JSONC comentado sem perder comentários
  ao gravar o valor de volta.
- Um script de manutenção quer encontrar todos os campos de evento correspondentes em um log JSONL
  sem carregar o log inteiro em um parser personalizado.
- Uma extensão de editor quer pular para uma seção ou item de lista em markdown por
  slug e então renderizar a linha exata para a qual ele foi resolvido.
- Um agente quer simular uma pequena edição no workspace antes de aplicá-la, com os
  bytes alterados visíveis na revisão.

Você provavelmente não precisa de `openclaw path` para edições comuns de arquivo inteiro, migrações
ricas de configuração ou escritas específicas de memória. Essas devem usar o comando
ou Plugin proprietário. `path` é para operações pequenas e endereçáveis em arquivos, quando um
comando de terminal repetível é mais claro que outro parser sob medida.

## Como ele é usado

Leia um valor de um arquivo de configuração editado por humanos:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Pré-visualize uma escrita sem tocar no disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Encontre registros correspondentes em um log JSONL somente de acréscimo:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Enderece uma instrução em markdown por seção e item em vez de por número
de linha:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valide um caminho no CI ou em um script de preflight antes que o script leia ou escreva:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Esses comandos foram feitos para serem copiáveis em scripts de shell. Use `--json` quando um
chamador precisar de saída estruturada e `--human` quando uma pessoa estiver inspecionando o
resultado.

## Como funciona

`openclaw path` faz quatro coisas:

1. Analisa o endereço `oc://` em slots: arquivo, seção, item, campo e
   sessão opcional.
2. Escolhe o adaptador de tipo de arquivo a partir da extensão do destino (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster` e aliases relacionados).
3. Resolve os slots contra a AST desse tipo de arquivo: cabeçalhos/itens de markdown,
   chaves de objeto/índices de array JSONC, registros de linha JSONL ou nós de mapa/sequência
   YAML.
4. Para `set`, emite bytes editados pelo mesmo adaptador para que as partes intocadas
   do arquivo mantenham comentários, quebras de linha e formatação próxima
   quando o tipo oferecer suporte.

`resolve` e `set` exigem um destino concreto. `find` é o verbo exploratório:
ele expande curingas, uniões, predicados e ordinais nas correspondências concretas
que você pode inspecionar antes de escolher uma para escrever.

## Subcomandos

| Subcomando              | Finalidade                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Imprime a correspondência concreta no caminho (ou "não encontrado").                       |
| `find <pattern>`        | Enumera correspondências para um caminho com curinga / união / predicado.                   |
| `set <oc-path> <value>` | Escreve uma folha ou destino de inserção em um caminho concreto. Suporta `--dry-run`.   |
| `validate <oc-path>`    | Somente análise; imprime a decomposição estrutural (arquivo / seção / item / campo).      |
| `emit <file>`           | Faz round-trip de um arquivo por `parseXxx` + `emitXxx` (diagnóstico de fidelidade de bytes). |

## Flags globais

| Flag            | Finalidade                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Resolve o slot de arquivo contra este diretório (padrão: `process.cwd()`). |
| `--file <path>` | Sobrescreve o caminho resolvido do slot de arquivo (acesso absoluto).                |
| `--json`        | Força saída JSON (padrão quando stdout não é um TTY).                    |
| `--human`       | Força saída humana (padrão quando stdout é um TTY).                       |
| `--dry-run`     | (somente em `set`) imprime os bytes que seriam escritos sem escrever.   |
| `--diff`        | (com `set --dry-run`) imprime um diff unificado em vez dos bytes completos.   |

## Sintaxe `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regras de slot: `field` exige `item`, e `item` exige `section`. Em todos os
quatro slots:

- **Segmentos entre aspas** — `"a/b.c"` sobrevive a separadores `/` e `.`.
  O conteúdo é literal em bytes; `"` e `\` não são permitidos dentro das aspas.
  O slot de arquivo também reconhece aspas: `oc://"skills/email-drafter"/Tools/$last`
  trata `skills/email-drafter` como um único caminho de arquivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Operações numéricas exigem que ambos os lados sejam convertíveis para números finitos.
- **Uniões** — `{a,b,c}` corresponde a qualquer uma das alternativas.
- **Curingas** — `*` (subsegmento único) e `**` (zero ou mais,
  recursivo). `find` aceita estes; `resolve` e `set` os rejeitam como
  ambíguos.
- **Posicional** — `$first` / `$last` resolvem para o primeiro / último índice ou
  chave declarada.
- **Ordinal** — `#N` para a enésima correspondência por ordem do documento.
- **Marcadores de inserção** — `+`, `+key`, `+nnn` para inserção com chave / indexada
  (use com `set`).
- **Escopo de sessão** — `?session=cron-daily` etc. Ortogonal ao aninhamento
  de slots. Valores de sessão são brutos, não decodificados por porcentagem; eles não podem conter
  caracteres de controle nem delimitadores de consulta reservados (`?`, `&`, `%`).

Caracteres reservados (`?`, `&`, `%`) fora de segmentos entre aspas, predicado ou união
são rejeitados. Caracteres de controle (U+0000-U+001F, U+007F) são rejeitados
em qualquer lugar, incluindo o valor de consulta `session`.

`formatOcPath(parseOcPath(path)) === path` é garantido para caminhos canônicos.
Parâmetros de consulta não canônicos são ignorados, exceto pelo primeiro valor
`session=` não vazio.

## Endereçamento por tipo de arquivo

| Tipo              | Modelo de endereçamento                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Seções H2 por slug, itens de lista por slug ou `#N`, frontmatter via `[frontmatter]`.                 |
| JSONC/JSON        | Chaves de objeto e índices de array; pontos dividem subsegmentos aninhados, exceto quando entre aspas.                        |
| JSONL             | Endereços de linha de nível superior (`L1`, `L2`, `$first`, `$last`), depois descida no estilo JSONC dentro da linha. |
| YAML/YML/.lobster | Chaves de mapa e índices de sequência; comentários e estilo de fluxo são tratados pela API de documento YAML.        |

`resolve` retorna uma correspondência estruturada: `root`, `node`, `leaf` ou
`insertion-point`, com um número de linha baseado em 1. Valores folha são expostos como texto
mais um `leafType` para que autores de Plugin possam renderizar prévias sem depender
do formato da AST por tipo.

## Contrato de mutação

`set` escreve um destino concreto:

- Valores de frontmatter em Markdown e campos de item `- key: value` são folhas de string.
  Inserções em Markdown acrescentam seções, chaves de frontmatter ou itens de seção e
  renderizam uma forma markdown canônica para o arquivo alterado.
- Escritas de folhas JSONC convertem o valor de string para o tipo de folha existente
  (`string`, `number` finito, `true`/`false` ou `null`). Use `--value-json`
  quando uma substituição de folha JSONC/JSON/JSONL deve analisar `<value>` como JSON e
  pode mudar de formato, como substituir um atalho SecretRef em string por um
  objeto. Inserções em objetos e arrays JSONC analisam `<value>` como JSON e usam o
  caminho de edição de `jsonc-parser` para escritas comuns de folhas, preservando comentários e
  formatação próxima.
- Escritas de folhas JSONL convertem como JSONC dentro de uma linha. Substituição de linha inteira e
  acréscimo analisam `<value>` como JSON. JSONL renderizado preserva a convenção dominante
  de quebra de linha LF/CRLF do arquivo.
- Escritas de folhas YAML convertem para o tipo escalar existente (`string`, `number`
  finito, `true`/`false` ou `null`). Inserções YAML usam a API de documento
  do pacote `yaml` incluído para atualizações de mapa/sequência. Documentos YAML malformados
  com erros de parser são recusados antes da mutação com `parse-error`.

Use `--dry-run` antes de escritas visíveis ao usuário quando os bytes exatos importarem. O
substrato preserva saída idêntica em bytes para round-trips de análise/emissão, mas uma
mutação pode canonicalizar a região editada ou o arquivo dependendo do tipo.
Adicione `--diff` quando quiser a prévia como um patch antes/depois focado em vez
do arquivo renderizado completo.

## Exemplos

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
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

Os mesmos cinco verbos funcionam em todos os tipos; o esquema de endereçamento despacha com base na
extensão do arquivo. Os exemplos abaixo usam os fixtures da descrição do PR.

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
corresponde ao cabeçalho `## Tools` via slug, e as folhas de itens mantêm sua forma de slug
mesmo quando a origem usa underscores (`send_email` → `send-email`).

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

As edições em JSONC passam por `jsonc-parser`, então comentários e espaços em branco sobrevivem a um
`set`. Execute primeiro com `--dry-run` para inspecionar os bytes antes de confirmar.

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

Cada linha é um registro. Enderece por predicado (`[event=action]`) quando você não
souber o número da linha, ou pelo segmento canônico `LN` quando souber.

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

YAML usa a API `Document` do pacote `yaml`, em vez de um parser feito à mão,
então ciclos comuns de parse/emissão preservam comentários e o formato de autoria, enquanto
os caminhos resolvidos usam o mesmo modelo de chave de mapa / índice de sequência do JSONC. O mesmo
adaptador lida com arquivos `.yaml`, `.yml` e `.lobster`.

## Referência de subcomandos

### `resolve <oc-path>`

Lê uma única folha ou nó. Wildcards são rejeitados — use `find` para eles.
Sai com `0` em uma correspondência, `1` em uma ausência limpa, `2` em um erro de parse ou padrão
recusado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera cada correspondência para um padrão de wildcard / predicado / união. Sai com `0`
em pelo menos uma correspondência, `1` em zero. Wildcards no slot de arquivo são rejeitados com
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — passe um arquivo concreto (globbing de múltiplos arquivos
é um recurso futuro).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Escreve uma folha. Combine com `--dry-run` para visualizar os bytes que seriam
gravados sem tocar no arquivo. Adicione `--diff` para uma prévia de diff unificado.
Sai com `0` em uma gravação bem-sucedida, `1` se o substrato recusar (por exemplo, um
sentinel guard atingido), `2` em erros de parse.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

O marcador de inserção `+key` cria o filho nomeado se ele ainda não
existir; `+nnn` e `+` simples funcionam para inserção indexada e anexação, respectivamente.

### `validate <oc-path>`

Verificação somente de parse. Sem acesso ao sistema de arquivos. Útil quando você quer confirmar que um
caminho de template está bem formado antes de substituir variáveis, ou quando quer
a decomposição estrutural para depuração:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Sai com `0` quando válido, `1` quando inválido (com `code` e
`message` estruturados), `2` em erros de argumentos.

### `emit <file>`

Faz round-trip de um arquivo pelo parser e emissor por tipo. A saída deve
ser idêntica em bytes à entrada em um arquivo válido — divergência indica um
bug de parser ou um sentinel atingido. Útil para depurar o comportamento do substrato em
entradas do mundo real.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de saída

| Código | Significado                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Sucesso. (`resolve` / `find`: pelo menos uma correspondência. `set`: gravação bem-sucedida.) |
| `1`  | Nenhuma correspondência, ou `set` rejeitado pelo substrato (sem erro em nível de sistema).      |
| `2`  | Erro de argumento ou parse.                                                   |

## Modo de saída

`openclaw path` reconhece TTY: saída legível por humanos em um terminal, JSON quando
stdout é encadeado por pipe ou redirecionado. `--json` e `--human` substituem a
detecção automática.

## Observações

- `set` grava bytes pelo caminho de emissão do substrato, que aplica o
  redaction-sentinel guard automaticamente. Uma folha que carrega
  `__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento da gravação.
- O parse de JSONC e as edições de folhas usam a dependência local do Plugin `jsonc-parser`,
  então comentários e formatação são preservados em gravações comuns de folhas,
  em vez de passar por um caminho de parser/re-renderização feito à mão.
- `path` não sabe sobre LKG. Se o arquivo for rastreado por LKG, a próxima chamada
  observe decide se promove / recupera. `set --batch` para
  multi-set atômico pelo ciclo de vida de promoção/recuperação do LKG está planejado
  junto com o substrato de recuperação de LKG.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
