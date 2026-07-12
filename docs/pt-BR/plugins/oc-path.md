---
read_when:
    - Você quer inspecionar ou editar um único item terminal dentro de um arquivo de workspace pelo terminal
    - Você está criando scripts que operam sobre o estado do espaço de trabalho e precisa de um esquema de endereçamento estável e independente do tipo
    - Você está decidindo se deve habilitar o Plugin opcional `oc-path` em um Gateway auto-hospedado
summary: 'Plugin `oc-path` incluído: fornece a CLI `openclaw path` para o esquema de endereçamento de arquivos do espaço de trabalho `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T00:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

O Plugin `oc-path` incluído adiciona a CLI [`openclaw path`](/pt-BR/cli/path) para o
esquema de endereçamento de arquivos do espaço de trabalho `oc://`. Ele é
distribuído no repositório do OpenClaw em `extensions/oc-path/`, mas é opcional:
a instalação/compilação o deixa inativo até que você o habilite.

Os endereços `oc://` apontam para uma única folha (ou um conjunto de folhas
definido por curinga) dentro de um arquivo do espaço de trabalho. O Plugin
reconhece quatro tipos de arquivo:

- **markdown** (`.md`): frontmatter, seções, itens, campos
- **jsonc** (`.jsonc`, `.json`): comentários e formatação preservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados a linhas
- **yaml** (`.yaml`, `.yml`, `.lobster`): nós de mapa/sequência/escalar por meio
  da API `Document` do pacote `yaml`

Quem hospeda a própria instância e as extensões de editor usam a CLI para ler
ou gravar uma única folha sem criar scripts diretamente com o SDK; agentes e
hooks a tratam como uma base determinística, para que as operações de ida e
volta com fidelidade de bytes e a proteção por sentinela de redação sejam
aplicadas uniformemente a todos os tipos. Consulte a
[referência da CLI](/pt-BR/cli/path) para ver a gramática completa, a lista de opções
por verbo e exemplos práticos para cada tipo de arquivo; esta página explica
por que e como habilitar o Plugin.

## Por que habilitá-lo

Habilite o `oc-path` quando scripts, hooks ou ferramentas de agente locais
precisarem apontar para uma parte específica do estado do espaço de trabalho
sem um analisador personalizado para cada formato de arquivo. Um único endereço
`oc://` pode identificar uma chave de frontmatter Markdown, um item de seção,
uma folha de configuração JSONC, um campo de evento JSONL ou uma etapa de fluxo
de trabalho YAML.

Isso é importante para fluxos de trabalho de manutenção nos quais a alteração
deve permanecer pequena, auditável e repetível: inspecionar um valor, localizar
registros correspondentes, simular uma gravação e, em seguida, aplicar somente
essa folha, sem alterar comentários, finais de linha ou a formatação próxima.

Motivos comuns para habilitá-lo:

- **Automação local**: scripts de shell resolvem ou atualizam um valor do espaço
  de trabalho com `openclaw path … --json`, em vez de manter códigos de análise
  separados para Markdown, JSONC, JSONL e YAML.
- **Edições visíveis para agentes**: um agente mostra um diff de simulação para
  uma folha endereçada antes da gravação, o que é mais fácil de revisar do que
  uma reescrita livre do arquivo.
- **Integrações com editores**: um editor mapeia `oc://AGENTS.md/tools/gh` para o
  nó Markdown e o número de linha exatos, sem fazer suposições com base no texto
  do título.
- **Diagnóstico**: `emit` faz uma operação de ida e volta do arquivo pelo
  analisador e pelo emissor, permitindo verificar se um tipo de arquivo mantém
  estabilidade de bytes antes de depender de edições automatizadas.

```bash
# O Plugin do GitHub está habilitado nesta configuração?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Quais nomes de chamadas de ferramenta aparecem neste log de sessão?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Quais bytes esta pequena edição de configuração gravaria?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

O `oc-path` intencionalmente não é responsável pela semântica de nível
superior. Os Plugins de memória continuam responsáveis pelas gravações de
memória, os comandos de configuração continuam responsáveis pelo gerenciamento
completo da configuração e a recuperação da última configuração válida (LKG)
continua responsável pela restauração/promoção. O `oc-path` é a camada restrita
de endereçamento e de operações de arquivo com preservação de bytes em torno da
qual essas ferramentas de nível superior podem ser desenvolvidas.

## Onde ele é executado

O Plugin é executado **no mesmo processo da CLI `openclaw`**, no host em que
você invoca o comando. Ele não precisa de um Gateway em execução e não abre
nenhum soquete de rede; cada verbo é uma transformação pura sobre um arquivo
indicado por você.

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

`onStartup: false` mantém o Plugin fora do caminho de inicialização do Gateway.
`commandAliases` e `activation.onCommands` instruem a CLI a carregar o Plugin
sob demanda na primeira vez que você executa `openclaw path …`, portanto,
instalações que nunca usam o verbo não têm custo adicional.

## Habilitar

```bash
openclaw plugins enable oc-path
```

Reinicie o Gateway (se você executar um) para que o snapshot do manifesto
reconheça o novo estado. As invocações diretas de `openclaw path` funcionam
imediatamente no mesmo host; a CLI carrega o Plugin sob demanda.

Desabilite com:

```bash
openclaw plugins disable oc-path
```

## Dependências

Todas as dependências de análise são locais ao Plugin; habilitar o `oc-path`
não adiciona novos pacotes ao runtime principal:

| Dependência    | Finalidade                                                              |
| -------------- | ----------------------------------------------------------------------- |
| `commander`    | Conexão dos subcomandos `resolve`, `find`, `set`, `validate` e `emit`.   |
| `jsonc-parser` | Análise de JSONC e edição de folhas, preservando comentários e vírgulas finais. |
| `markdown-it`  | Tokenização de Markdown para o modelo de seção/item/campo.               |
| `yaml`         | Análise/emissão/edição do `Document` YAML, preservando comentários e estilo de fluxo. |

O JSONL continua sendo implementado manualmente: a análise orientada a linhas é
mais simples do que qualquer dependência, e a análise de cada linha já passa
pelo `jsonc-parser`.

## O que ele oferece

| Superfície                     | Fornecida por                                            |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| Analisador/formatador `oc://`  | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Análise/emissão/edição por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`   |
| Resolução/busca/definição universais | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Proteção por sentinela de redação | `extensions/oc-path/src/oc-path/sentinel.ts`          |

Atualmente, a CLI é a única superfície pública. Os verbos da base são privados
do Plugin; os consumidores usam a CLI (ou desenvolvem seu próprio Plugin com o
SDK).

## Relação com outros Plugins

- **`memory-*`**: as gravações de memória passam pelos Plugins de memória, não
  pelo `oc-path`. O `oc-path` é uma base genérica para arquivos; os Plugins de
  memória adicionam sua própria semântica sobre ela.
- **LKG**: `path` não conhece a restauração da última configuração válida. Se um
  arquivo editado por meio de `path` também for acompanhado pelo LKG, o próximo
  ciclo de observação da configuração decidirá se ele deve ser promovido ou
  recuperado; trate uma edição feita por `path` da mesma forma que qualquer
  outra gravação direta nesse arquivo.

## Segurança

`set` grava bytes brutos por meio do caminho de emissão da base, que aplica
automaticamente a proteção por sentinela de redação. Uma folha que contenha
`__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento
da gravação com `OC_EMIT_SENTINEL`. A CLI também remove a sentinela literal de
toda saída legível por humanos ou em JSON que ela imprime, substituindo-a por
`[REDACTED]`, para que capturas de terminal e pipelines nunca exponham o
marcador.

## Relacionados

- [Referência da CLI `openclaw path`](/pt-BR/cli/path)
- [Gerenciar Plugins](/pt-BR/plugins/manage-plugins)
- [Desenvolvimento de Plugins](/pt-BR/plugins/building-plugins)
