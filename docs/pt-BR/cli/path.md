---
read_when:
    - Você quer ler ou gravar um nó folha dentro de um arquivo do espaço de trabalho pelo terminal
    - Você está criando scripts com base no estado do espaço de trabalho e quer um esquema de endereçamento estável e independente do tipo
    - Você está depurando um caminho `oc://` (valide a sintaxe, veja para o que ele resolve)
summary: Referência da CLI para `openclaw path` (inspecione e edite arquivos do espaço de trabalho por meio do esquema de endereçamento `oc://`)
title: Caminho
x-i18n:
    generated_at: "2026-05-10T19:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Acesso shell fornecido por Plugin ao substrato de endereçamento `oc://`: um
esquema de caminho despachado por tipo para inspecionar e editar arquivos
endereçáveis do workspace (markdown, jsonc, jsonl). Self-hosters, autores de
Plugin e extensões de editor o usam para ler, encontrar ou atualizar um local
restrito sem criar parsers por arquivo manualmente.

A CLI espelha os verbos públicos do substrato:

- `resolve` é concreto e tem correspondência única.
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

O estado do OpenClaw fica distribuído entre markdown editado por humanos, configuração JSONC
com comentários e logs JSONL somente para acréscimo. Scripts shell, hooks e agentes geralmente precisam de um
pequeno valor desses arquivos: uma chave de frontmatter, uma configuração de Plugin, um campo de registro de log
ou um item de bullet sob uma seção nomeada.

`openclaw path` dá a esses chamadores um endereço estável em vez de um grep,
regex ou parser pontual para cada tipo de arquivo. O mesmo caminho `oc://` pode ser validado,
resolvido, pesquisado, simulado e escrito pelo terminal, o que torna automações
restritas mais fáceis de revisar e mais seguras de repetir. Ele é especialmente útil quando
você quer atualizar uma folha preservando o restante dos comentários do arquivo,
finais de linha e formatação ao redor.

Use-o quando o que você quer tem um endereço lógico, mas o formato físico do arquivo
varia:

- Um hook quer ler uma configuração de JSONC com comentários sem perder comentários
  quando escreve o valor de volta.
- Um script de manutenção quer encontrar todos os campos de evento correspondentes em um log JSONL
  sem carregar o log inteiro em um parser personalizado.
- Uma extensão de editor quer saltar para uma seção markdown ou item de bullet por
  slug e então renderizar a linha exata para a qual ele foi resolvido.
- Um agente quer simular uma pequena edição no workspace antes de aplicá-la, com os
  bytes alterados visíveis na revisão.

Você provavelmente não precisa de `openclaw path` para edições comuns de arquivos inteiros, migrações
ricas de configuração ou escritas específicas de memória. Elas devem usar o comando ou Plugin
proprietário. `path` é para pequenas operações de arquivo endereçáveis em que um
comando de terminal repetível é mais claro do que outro parser sob medida.

## Como ele é usado

Leia um valor de um arquivo de configuração editado por humanos:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Pré-visualize uma escrita sem tocar no disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Encontre registros correspondentes em um log JSONL somente para acréscimo:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Enderece uma instrução em markdown por seção e item em vez de por número de
linha:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valide um caminho em CI ou em um script de preflight antes que o script leia ou escreva:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Esses comandos devem ser copiáveis para scripts shell. Use `--json` quando um
chamador precisar de saída estruturada e `--human` quando uma pessoa estiver inspecionando o
resultado.

## Como funciona

`openclaw path` faz quatro coisas:

1. Analisa o endereço `oc://` em slots: arquivo, seção, item, campo e
   sessão opcional.
2. Escolhe o adaptador de tipo de arquivo a partir da extensão de destino (`.md`, `.jsonc`,
   `.jsonl` e aliases relacionados).
3. Resolve os slots contra a AST desse tipo de arquivo: cabeçalhos/itens markdown,
   chaves de objeto/índices de array JSONC ou registros de linha JSONL.
4. Para `set`, emite bytes editados pelo mesmo adaptador para que as partes
   intocadas do arquivo mantenham seus comentários, finais de linha e formatação
   próxima quando o tipo oferecer suporte.

`resolve` e `set` exigem um destino concreto. `find` é o verbo exploratório:
ele expande curingas, uniões, predicados e ordinais para as correspondências
concretas que você pode inspecionar antes de escolher uma para escrever.

## Subcomandos

| Subcomando              | Finalidade                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Imprimir a correspondência concreta no caminho (ou "não encontrado").         |
| `find <pattern>`        | Enumerar correspondências para um caminho com curinga / união / predicado.    |
| `set <oc-path> <value>` | Escrever uma folha ou destino de inserção em um caminho concreto. Suporta `--dry-run`. |
| `validate <oc-path>`    | Apenas analisar; imprimir decomposição estrutural (arquivo / seção / item / campo). |
| `emit <file>`           | Fazer ida e volta de um arquivo por `parseXxx` + `emitXxx` (diagnóstico de fidelidade de bytes). |

## Flags globais

| Flag            | Finalidade                                                              |
| --------------- | ---------------------------------------------------------------------- |
| `--cwd <dir>`   | Resolver o slot de arquivo contra este diretório (padrão: `process.cwd()`). |
| `--file <path>` | Sobrescrever o caminho resolvido do slot de arquivo (acesso absoluto). |
| `--json`        | Forçar saída JSON (padrão quando stdout não é um TTY).                 |
| `--human`       | Forçar saída humana (padrão quando stdout é um TTY).                   |
| `--dry-run`     | (somente em `set`) imprimir os bytes que seriam escritos sem escrever. |

## Sintaxe `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regras de slot: `field` exige `item`, e `item` exige `section`. Em todos os
quatro slots:

- **Segmentos entre aspas** — `"a/b.c"` sobrevive a separadores `/` e `.`.
  O conteúdo é literal em bytes; `"` e `\` não são permitidos dentro das aspas.
  O slot de arquivo também entende aspas: `oc://"skills/email-drafter"/Tools/$last`
  trata `skills/email-drafter` como um único caminho de arquivo.
- **Predicados** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Operadores numéricos exigem que ambos os lados possam ser convertidos para números finitos.
- **Uniões** — `{a,b,c}` corresponde a qualquer uma das alternativas.
- **Curingas** — `*` (um único subsegmento) e `**` (zero ou mais,
  recursivo). `find` os aceita; `resolve` e `set` os rejeitam como
  ambíguos.
- **Posicional** — `$last` resolve para o último índice / última chave declarada.
- **Ordinal** — `#N` para a enésima correspondência em ordem de documento.
- **Marcadores de inserção** — `+`, `+key`, `+nnn` para inserção com chave / indexada
  (use com `set`).
- **Escopo de sessão** — `?session=cron-daily` etc. Ortogonal ao aninhamento de
  slots. Valores de sessão são brutos, não decodificados por percentual; eles não podem conter
  caracteres de controle nem delimitadores de consulta reservados (`?`, `&`, `%`).

Caracteres reservados (`?`, `&`, `%`) fora de segmentos entre aspas, predicado ou união
são rejeitados. Caracteres de controle (U+0000-U+001F, U+007F) são rejeitados
em qualquer lugar, incluindo o valor de consulta `session`.

`formatOcPath(parseOcPath(path)) === path` é garantido para caminhos canônicos.
Parâmetros de consulta não canônicos são ignorados, exceto pelo primeiro valor
`session=` não vazio.

## Endereçamento por tipo de arquivo

| Tipo       | Modelo de endereçamento                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| Markdown   | Seções H2 por slug, itens de bullet por slug ou `#N`, frontmatter via `[frontmatter]`. |
| JSONC/JSON | Chaves de objeto e índices de array; pontos dividem subsegmentos aninhados, exceto quando entre aspas. |
| JSONL      | Endereços de linha de nível superior (`L1`, `L2`, `$last`), depois descida no estilo JSONC dentro da linha. |

`resolve` retorna uma correspondência estruturada: `root`, `node`, `leaf` ou
`insertion-point`, com um número de linha baseado em 1. Valores de folha são expostos como texto
mais um `leafType` para que autores de Plugin possam renderizar pré-visualizações sem depender
do formato de AST por tipo.

## Contrato de mutação

`set` escreve um destino concreto:

- Valores de frontmatter markdown e campos de item `- key: value` são folhas de string.
  Inserções markdown acrescentam seções, chaves de frontmatter ou itens de seção e
  renderizam uma forma markdown canônica para o arquivo alterado.
- Escritas de folha JSONC convertem o valor string para o tipo de folha existente
  (`string`, `number` finito, `true`/`false` ou `null`). Inserções em objetos e arrays
  JSONC analisam `<value>` como JSON e usam o caminho de edição de `jsonc-parser` para
  escritas comuns de folha, preservando comentários e formatação próxima.
- Escritas de folha JSONL convertem como JSONC dentro de uma linha. Substituição de linha inteira e
  acréscimo analisam `<value>` como JSON. JSONL renderizado preserva a convenção dominante
  de fim de linha LF/CRLF do arquivo.

Use `--dry-run` antes de escritas visíveis ao usuário quando os bytes exatos importarem. O
substrato preserva saída idêntica em bytes para idas e voltas de parse/emit, mas uma
mutação pode canonicalizar a região editada ou o arquivo, dependendo do tipo.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Mais exemplos de gramática:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Os mesmos cinco verbos funcionam entre tipos; o esquema de endereçamento despacha com base na
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
corresponde ao cabeçalho `## Tools` via slug, e folhas de item mantêm sua forma de slug
mesmo quando a fonte usa underscores (`send_email` → `send-email`).

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

Edições JSONC passam pelo `jsonc-parser`, portanto comentários e espaços em branco sobrevivem a um
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

## Referência de subcomandos

### `resolve <oc-path>`

Lê uma única folha ou nó. Curingas são rejeitados — use `find` para esses casos.
Sai com `0` em uma correspondência, `1` em uma ausência limpa, `2` em erro de análise ou padrão
recusado.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera cada correspondência para um padrão de curinga / predicado / união. Sai com `0`
em pelo menos uma correspondência, `1` em zero. Curingas no slot de arquivo são rejeitados com
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — passe um arquivo concreto (globbing
de vários arquivos é um recurso futuro).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Grava uma folha. Combine com `--dry-run` para pré-visualizar os bytes que seriam
gravados sem tocar no arquivo. Sai com `0` em uma gravação bem-sucedida, `1` se
o substrato recusar (por exemplo, uma proteção de sentinela acionada), `2` em erros de análise.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

O marcador de inserção `+key` cria o filho nomeado se ele ainda não
existir; `+nnn` e `+` isolado funcionam para inserção indexada e por acréscimo, respectivamente.

### `validate <oc-path>`

Verificação apenas de análise. Sem acesso ao sistema de arquivos. Útil quando você quer confirmar que um
caminho de modelo está bem formado antes de substituir variáveis, ou quando você quer
a decomposição estrutural para depuração:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Sai com `0` quando válido, `1` quando inválido (com um `code` e uma
`message` estruturados), `2` em erros de argumento.

### `emit <file>`

Faz round-trip de um arquivo pelo analisador e emissor por tipo. A saída deve
ser byte a byte idêntica à entrada em um arquivo íntegro — divergência indica um
bug do analisador ou uma sentinela acionada. Útil para depurar o comportamento do substrato em
entradas do mundo real.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Códigos de saída

| Código | Significado                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Sucesso. (`resolve` / `find`: pelo menos uma correspondência. `set`: gravação bem-sucedida.) |
| `1`  | Nenhuma correspondência, ou `set` rejeitado pelo substrato (sem erro no nível do sistema).      |
| `2`  | Erro de argumento ou análise.                                                   |

## Modo de saída

`openclaw path` reconhece TTY: saída legível por humanos em um terminal, JSON quando
stdout é canalizado ou redirecionado. `--json` e `--human` substituem a
detecção automática.

## Observações

- `set` grava bytes pelo caminho de emissão do substrato, que aplica a
  proteção de sentinela de redação automaticamente. Uma folha que contenha
  `__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento da
  gravação.
- A análise JSONC e edições de folhas usam a dependência `jsonc-parser`
  local ao Plugin, portanto comentários e formatação são preservados em gravações comuns de
  folhas, em vez de passar por um caminho de analisador/re-renderização feito à mão.
- `path` não conhece LKG. Se o arquivo for rastreado por LKG, a próxima
  chamada de observação decide se promove / recupera. `set --batch` para
  multi-set atômico pelo ciclo de vida de promoção/recuperação de LKG está planejado
  junto com o substrato de recuperação de LKG.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
