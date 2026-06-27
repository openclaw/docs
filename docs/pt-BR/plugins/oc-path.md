---
read_when:
    - Você quer inspecionar ou editar uma única folha dentro de um arquivo do workspace pelo terminal
    - Você está criando scripts contra o estado do workspace e precisa de um esquema de endereçamento estável e independente de tipo
    - Você está decidindo se deve habilitar o Plugin opcional `oc-path` em um Gateway auto-hospedado
summary: 'Plugin `oc-path` incluído: fornece a CLI `openclaw path` para o esquema de endereçamento de arquivos do espaço de trabalho `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T17:49:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

O Plugin `oc-path` integrado adiciona a CLI [`openclaw path`](/pt-BR/cli/path) para o
esquema de endereçamento de arquivos de workspace `oc://`. Ele é enviado no repositório OpenClaw em
`extensions/oc-path/`, mas é opcional — instalar/compilar o deixa inativo até você
habilitá-lo.

Endereços `oc://` apontam para uma única folha (ou um conjunto curinga de folhas) dentro de
um arquivo de workspace. Hoje, o Plugin entende quatro tipos de arquivos:

- **markdown** (`.md`, `.mdx`): frontmatter, seções, itens, campos
- **jsonc** (`.jsonc`, `.json5`, `.json`): comentários e formatação preservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados por linha
- **yaml** (`.yaml`, `.yml`, `.lobster`): nós de mapa/sequência/escalar por meio da
  API de documento YAML

Operadores auto-hospedados e extensões de editor usam a CLI para ler ou escrever uma única folha
sem criar scripts diretamente contra o SDK; agentes e hooks a tratam como um
substrato determinístico para que round-trips com fidelidade de bytes e a proteção do
sentinela de redação se apliquem uniformemente entre os tipos.

## Por que habilitá-lo

Habilite `oc-path` quando quiser que scripts, hooks ou ferramentas locais de agente apontem
para uma parte precisa do estado do workspace sem inventar um parser para cada formato
de arquivo. Um único endereço `oc://` pode nomear uma chave de frontmatter Markdown, um item
de seção, uma folha de configuração JSONC, um campo de evento JSONL ou uma etapa de workflow YAML.

Isso importa para workflows de mantenedores em que a alteração deve ser pequena,
auditável e repetível: inspecionar um valor, encontrar registros correspondentes, simular uma
gravação e então aplicar apenas essa folha, deixando comentários, finais de linha e
formatação próxima intactos. Manter isso como um Plugin opcional dá a usuários avançados o
substrato de endereçamento sem colocar dependências de parser ou superfície de CLI no
núcleo para instalações que nunca precisam dele.

Motivos comuns para habilitá-lo:

- **Automação local**: scripts de shell podem resolver ou atualizar um valor de workspace
  com `openclaw path … --json` em vez de carregar códigos separados de parsing de Markdown, JSONC,
  JSONL e YAML.
- **Edições visíveis para agentes**: um agente pode mostrar um diff de simulação para uma
  folha endereçada antes de escrever, o que é mais fácil de revisar do que uma reescrita livre de arquivo.
- **Integrações de editor**: um editor pode mapear `oc://AGENTS.md/tools/gh` para o
  nó Markdown exato e o número da linha sem adivinhar a partir do texto do cabeçalho.
- **Diagnósticos**: `emit` faz round-trip de um arquivo pelo parser e emissor, para que
  você possa verificar se um tipo de arquivo é estável em bytes antes de depender de edições
  automatizadas.

Exemplos concretos:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

O Plugin intencionalmente não é o proprietário de semânticas de nível mais alto. Plugins de
memória ainda são proprietários das escritas de memória, comandos de configuração ainda são proprietários do
gerenciamento completo de configuração, e a lógica LKG ainda é proprietária de restauração/promoção. `oc-path` é a camada estreita
de endereçamento e operação de arquivo com preservação de bytes em torno da qual essas ferramentas de nível mais alto
podem construir.

## Onde ele roda

O Plugin roda **em processo dentro da CLI `openclaw`** no host onde você
invoca o comando. Ele não precisa de um Gateway em execução e não abre nenhum
socket de rede — todo verbo é uma transformação pura sobre um arquivo que você aponta.

Os metadados do Plugin ficam em `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` mantém o Plugin fora do caminho quente do Gateway. `onCommands:
["path"]` informa à CLI para carregar o Plugin preguiçosamente na primeira vez que você executar
`openclaw path …`, para que instalações que nunca usam o verbo não paguem nenhum custo.

## Habilitar

```bash
openclaw plugins enable oc-path
```

Reinicie o Gateway (se você executar um) para que o snapshot do manifesto capture o novo
estado. Invocações simples de `openclaw path` funcionam imediatamente no mesmo host —
a CLI carrega o Plugin sob demanda.

Desabilite com:

```bash
openclaw plugins disable oc-path
```

## Dependências

Todas as dependências de parser são locais ao Plugin — habilitar `oc-path` não puxa
novos pacotes para o runtime do núcleo:

| Dependência    | Finalidade                                                             |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Cabeamento de subcomandos para `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parsing JSONC + edições de folhas com comentários e vírgulas finais mantidos. |
| `markdown-it`  | Tokenização Markdown para o modelo de seção / item / campo.            |
| `yaml`         | Parsing / emissão / edição de `Document` YAML com comentários e estilo de fluxo mantidos. |

JSONL permanece feito à mão — parsing orientado por linha é mais simples que qualquer
dependência, e o parsing JSONC por linha já passa por `jsonc-parser`.

## O que ele fornece

| Superfície                     | Fornecido por                                           |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser / formatador `oc://`    | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parsing / emissão / edição por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Resolução / busca / definição universais | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Proteção do sentinela de redação | `extensions/oc-path/src/oc-path/sentinel.ts`            |

A CLI é a única superfície pública hoje. Os verbos do substrato são privados ao
Plugin; consumidores usam a CLI (ou criam seu próprio Plugin contra o SDK).

## Relação com outros Plugins

- **`memory-*`**: escritas de memória passam pelos Plugins de memória, não pelo `oc-path`.
  `oc-path` é um substrato genérico de arquivo; Plugins de memória sobrepõem suas próprias
  semânticas.
- **LKG**: `path` não sabe sobre restauração de configuração Last-Known-Good. Se um
  arquivo é rastreado por LKG, a próxima chamada `observe` decide se promove ou
  recupera; `set --batch` para multi-set atômico pelo ciclo de vida de promoção/recuperação
  de LKG está planejado junto ao substrato de recuperação LKG.

## Segurança

`set` escreve bytes brutos pelo caminho de emissão do substrato, que aplica a
proteção do sentinela de redação automaticamente. Uma folha que carrega
`__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento da escrita
com `OC_EMIT_SENTINEL`. A CLI também remove o sentinela literal de qualquer
saída humana ou JSON que imprime, substituindo-o por `[REDACTED]` para que capturas
de terminal e pipelines nunca vazem o marcador.

## Relacionados

- [Referência da CLI `openclaw path`](/pt-BR/cli/path)
- [Gerenciar Plugins](/pt-BR/plugins/manage-plugins)
- [Criar Plugins](/pt-BR/plugins/building-plugins)
