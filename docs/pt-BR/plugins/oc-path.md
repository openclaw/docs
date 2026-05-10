---
read_when:
    - Você quer inspecionar ou editar uma única folha dentro de um arquivo do espaço de trabalho pelo terminal
    - Você está criando scripts com base no estado do espaço de trabalho e precisa de um esquema de endereçamento estável e independente do tipo
    - Você está decidindo se deve habilitar o Plugin opcional `oc-path` em um Gateway auto-hospedado
summary: 'Plugin `oc-path` incluído: fornece a CLI `openclaw path` para o esquema de endereçamento de arquivos do espaço de trabalho `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-05-10T19:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

O Plugin `oc-path` incluído adiciona a CLI [`openclaw path`](/pt-BR/cli/path) para o
esquema de endereçamento de arquivos de workspace `oc://`. Ele é distribuído no repositório OpenClaw em
`extensions/oc-path/`, mas é opt-in — a instalação/compilação o deixa inativo até que você
o habilite.

Endereços `oc://` apontam para uma única folha (ou um conjunto curinga de folhas) dentro de
um arquivo de workspace. Hoje, o Plugin entende três tipos de arquivo:

- **markdown** (`.md`, `.mdx`): frontmatter, seções, itens, campos
- **jsonc** (`.jsonc`, `.json5`, `.json`): comentários e formatação preservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados por linha

Self-hosters e extensões de editor usam a CLI para ler ou escrever uma única folha
sem criar scripts diretamente contra o SDK; agentes e hooks a tratam como um
substrato determinístico para que round-trips com fidelidade de bytes e a proteção
do sentinela de redação se apliquem uniformemente entre os tipos.

## Por que habilitá-lo

Habilite `oc-path` quando quiser que scripts, hooks ou ferramentas locais de agente apontem
para uma parte precisa do estado do workspace sem inventar um parser para cada formato
de arquivo. Um único endereço `oc://` pode nomear uma chave de frontmatter markdown, um item
de seção, uma folha de configuração JSONC ou um campo de evento JSONL.

Isso importa em workflows de mantenedores nos quais a alteração deve ser pequena,
auditável e repetível: inspecionar um valor, encontrar registros correspondentes, simular uma
escrita, então aplicar apenas essa folha, preservando comentários, quebras de linha e
formatação próxima. Manter isso como um Plugin opt-in dá aos usuários avançados o
substrato de endereçamento sem colocar dependências de parser ou superfície de CLI no
core para instalações que nunca precisam dele.

Motivos comuns para habilitá-lo:

- **Automação local**: scripts shell podem resolver ou atualizar um valor do workspace
  com `openclaw path … --json` em vez de manter código separado para parsing de markdown,
  JSONC e JSONL.
- **Edições visíveis para agentes**: um agente pode mostrar um diff de simulação para uma
  folha endereçada antes de escrever, o que é mais fácil de revisar do que uma reescrita
  de arquivo em formato livre.
- **Integrações com editores**: um editor pode mapear `oc://AGENTS.md/tools/gh` para o
  nó markdown e o número de linha exatos sem adivinhar pelo texto do cabeçalho.
- **Diagnósticos**: `emit` faz o round-trip de um arquivo pelo parser e emissor, para que
  você possa verificar se um tipo de arquivo é estável em bytes antes de depender de
  edições automatizadas.

Exemplos concretos:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

O Plugin não é intencionalmente o proprietário de semânticas de nível mais alto. Plugins de
memória ainda são donos de escritas de memória, comandos de configuração ainda são donos do
gerenciamento completo de configuração, e a lógica LKG ainda é dona de restauração/promoção.
`oc-path` é a camada estreita de endereçamento e operações de arquivo com preservação de bytes
em torno da qual essas ferramentas de nível mais alto podem construir.

## Onde ele é executado

O Plugin é executado **dentro do processo da CLI `openclaw`** no host em que você
invoca o comando. Ele não precisa de um Gateway em execução e não abre nenhum
socket de rede — cada verbo é uma transformação pura sobre um arquivo que você indicar.

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
`openclaw path …`, então instalações que nunca usam o verbo não pagam nenhum custo.

## Ativar

```bash
openclaw plugins enable oc-path
```

Reinicie o Gateway (se você executar um) para que o instantâneo do manifesto capture o novo
estado. Invocações simples de `openclaw path` funcionam imediatamente no mesmo host —
a CLI carrega o plugin sob demanda.

Desative com:

```bash
openclaw plugins disable oc-path
```

## Dependências

Todas as dependências do analisador são locais ao plugin — ativar `oc-path` não puxa
novos pacotes para o runtime principal:

| Dependência    | Finalidade                                                         |
| -------------- | ------------------------------------------------------------------ |
| `commander`    | Conexão de subcomandos para `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Análise de JSONC + edições de folhas preservando comentários e vírgulas finais. |
| `markdown-it`  | Tokenização de Markdown para o modelo de seção / item / campo.     |

JSONL continua implementado manualmente — a análise orientada por linhas é mais simples que qualquer
dependência, e a análise JSONC por linha já passa por `jsonc-parser`.

## O que ele fornece

| Superfície                     | Fornecido por                                           |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Analisador / formatador `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Análise / emissão / edição por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Resolução / busca / definição universal | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Proteção de sentinela de redação | `extensions/oc-path/src/oc-path/sentinel.ts`            |

A CLI é a única superfície pública hoje. Os verbos de substrato são privados do
plugin; consumidores usam a CLI (ou criam seu próprio plugin com o SDK).

## Relação com outros plugins

- **`memory-*`**: gravações de memória passam pelos plugins de memória, não pelo `oc-path`.
  `oc-path` é um substrato genérico de arquivos; plugins de memória colocam suas próprias
  semânticas por cima.
- **LKG**: `path` não conhece a restauração de configuração Last-Known-Good. Se um
  arquivo for rastreado por LKG, a próxima chamada `observe` decide se deve promover ou
  recuperar; `set --batch` para múltiplas definições atômicas pelo ciclo de vida de promoção/recuperação
  de LKG está planejado junto com o substrato de recuperação de LKG.

## Segurança

`set` grava bytes brutos pelo caminho de emissão do substrato, que aplica a
proteção de sentinela de redação automaticamente. Uma folha contendo
`__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento da gravação
com `OC_EMIT_SENTINEL`. A CLI também limpa a sentinela literal de qualquer
saída humana ou JSON que imprime, substituindo-a por `[REDACTED]` para que capturas
de terminal e pipelines nunca vazem o marcador.

## Relacionado

- [Referência da CLI `openclaw path`](/pt-BR/cli/path)
- [Gerenciar plugins](/pt-BR/plugins/manage-plugins)
- [Criar plugins](/pt-BR/plugins/building-plugins)
