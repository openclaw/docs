---
read_when:
    - Você quer inspecionar ou editar um único item dentro de um arquivo do workspace pelo terminal
    - Você está criando scripts que interagem com o estado do workspace e precisa de um esquema de endereçamento estável e independente do tipo
    - Você está decidindo se deve habilitar o plugin opcional `oc-path` em um Gateway auto-hospedado
summary: 'Plugin `oc-path` incluído: fornece a CLI `openclaw path` para o esquema de endereçamento de arquivos do espaço de trabalho `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T15:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

O plugin `oc-path` incluído adiciona a CLI [`openclaw path`](/pt-BR/cli/path) para o
esquema de endereçamento de arquivos do workspace `oc://`. Ele é distribuído no repositório do OpenClaw em
`extensions/oc-path/`, mas é opcional: a instalação/compilação o mantém inativo até que você
o habilite.

Os endereços `oc://` apontam para uma única folha (ou um conjunto de folhas definido por curinga) dentro
de um arquivo do workspace. O plugin reconhece quatro tipos de arquivo:

- **markdown** (`.md`): frontmatter, seções, itens, campos
- **jsonc** (`.jsonc`, `.json`): comentários e formatação preservados
- **jsonl** (`.jsonl`, `.ndjson`): registros orientados por linha
- **yaml** (`.yaml`, `.yml`, `.lobster`): nós de mapa/sequência/escalar por meio da
  API `Document` do pacote `yaml`

Quem hospeda a própria instância e extensões de editor usam a CLI para ler ou gravar uma única folha
sem criar scripts diretamente com o SDK; agentes e hooks a tratam como uma
base determinística, para que as idas e voltas com fidelidade de bytes e a proteção do
sentinela de redação sejam aplicadas uniformemente a todos os tipos. Consulte a
[referência da CLI](/pt-BR/cli/path) para ver a gramática completa, a lista de flags por verbo e
exemplos práticos para cada tipo de arquivo; esta página explica por que e como habilitar o
plugin.

## Por que habilitá-lo

Habilite o `oc-path` quando scripts, hooks ou ferramentas de agente locais precisarem apontar para
uma parte específica do estado do workspace sem exigir um analisador personalizado para cada formato de arquivo. Um
único endereço `oc://` pode identificar uma chave de frontmatter do markdown, um item de seção, uma
folha de configuração JSONC, um campo de evento JSONL ou uma etapa de workflow YAML.

Isso é importante para workflows de mantenedores nos quais a alteração deve permanecer pequena,
auditável e repetível: inspecione um valor, encontre registros correspondentes, simule
uma gravação e então aplique apenas essa folha, sem alterar comentários, terminações de linha e
a formatação próxima.

Motivos comuns para habilitá-lo:

- **Automação local**: scripts de shell resolvem ou atualizam um valor do workspace
  com `openclaw path … --json`, em vez de manter códigos separados de análise de markdown, JSONC,
  JSONL e YAML.
- **Edições visíveis ao agente**: um agente mostra um diff de simulação para uma folha
  endereçada antes da gravação, o que é mais fácil de revisar do que uma reescrita livre do
  arquivo.
- **Integrações com editores**: um editor mapeia `oc://AGENTS.md/tools/gh` para o
  nó markdown e o número de linha exatos, sem fazer suposições com base no texto do título.
- **Diagnóstico**: `emit` processa um arquivo de ida e volta pelo analisador e pelo emissor,
  permitindo verificar se um tipo de arquivo mantém a estabilidade dos bytes antes de depender de
  edições automatizadas.

```bash
# O plugin do GitHub está habilitado nesta configuração?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Quais nomes de chamadas de ferramenta aparecem neste log de sessão?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Quais bytes esta pequena edição de configuração gravaria?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

O `oc-path` intencionalmente não é responsável pela semântica de nível superior. Os plugins de
memória continuam responsáveis pelas gravações de memória, os comandos de configuração continuam responsáveis pelo gerenciamento
completo da configuração, e a recuperação da última configuração válida (LKG) continua responsável pela
restauração/promoção. O `oc-path` é a camada restrita de endereçamento e operações de arquivo
com preservação de bytes em torno da qual essas ferramentas de nível superior podem ser construídas.

## Onde ele é executado

O plugin é executado **no mesmo processo da CLI `openclaw`** no host em que você
invoca o comando. Ele não precisa de um Gateway em execução nem abre
sockets de rede; cada verbo é uma transformação pura sobre o arquivo indicado.

Os metadados do plugin ficam em `extensions/oc-path/openclaw.plugin.json`:

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

`onStartup: false` mantém o plugin fora do caminho de inicialização do Gateway.
`commandAliases` e `activation.onCommands` instruem a CLI a carregar o plugin
sob demanda na primeira vez que você executa `openclaw path …`, portanto instalações que nunca usam
o verbo não têm nenhum custo.

## Habilitar

```bash
openclaw plugins enable oc-path
```

Reinicie o Gateway (caso execute um) para que o snapshot do manifesto reconheça o novo
estado. Invocações diretas de `openclaw path` funcionam imediatamente no mesmo host;
a CLI carrega o plugin sob demanda.

Desabilite com:

```bash
openclaw plugins disable oc-path
```

## Dependências

Todas as dependências dos analisadores são locais ao plugin; habilitar o `oc-path` não adiciona
novos pacotes ao runtime principal:

| Dependência    | Finalidade                                                                |
| -------------- | ------------------------------------------------------------------------- |
| `commander`    | Vinculação dos subcomandos `resolve`, `find`, `set`, `validate`, `emit`.   |
| `jsonc-parser` | Análise de JSONC e edições de folhas com preservação de comentários e vírgulas finais. |
| `markdown-it`  | Tokenização de Markdown para o modelo de seção/item/campo.                 |
| `yaml`         | Análise/emissão/edição de `Document` YAML com preservação de comentários e estilo de fluxo. |

O JSONL continua sendo implementado manualmente: a análise orientada por linha é mais simples do que qualquer
dependência, e a análise de cada linha já passa pelo `jsonc-parser`.

## O que ele oferece

| Superfície                     | Fornecida por                                            |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| Analisador/formatador `oc://`  | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Análise/emissão/edição por tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`   |
| Resolução/busca/definição universal | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Proteção do sentinela de redação | `extensions/oc-path/src/oc-path/sentinel.ts`             |

Atualmente, a CLI é a única superfície pública. Os verbos da base são privados do
plugin; os consumidores usam a CLI (ou criam seu próprio plugin com o
SDK).

## Relação com outros plugins

- **`memory-*`**: as gravações de memória passam pelos plugins de memória, não pelo
  `oc-path`. O `oc-path` é uma base genérica de arquivos; os plugins de memória adicionam
  sua própria semântica sobre ela.
- **LKG**: `path` não tem conhecimento da restauração da última configuração válida. Se um
  arquivo editado por meio de `path` também for monitorado pelo LKG, o próximo ciclo de observação
  da configuração decidirá se ele deve ser promovido ou recuperado; trate uma edição feita com `path` da
  mesma forma que qualquer outra gravação direta nesse arquivo.

## Segurança

`set` grava bytes brutos pelo caminho de emissão da base, que aplica
automaticamente a proteção do sentinela de redação. Uma folha contendo
`__OPENCLAW_REDACTED__` (literalmente ou como substring) é recusada no momento da gravação
com `OC_EMIT_SENTINEL`. A CLI também remove o sentinela literal de qualquer
saída legível ou JSON que exiba, substituindo-o por `[REDACTED]`, para que capturas
do terminal e pipelines nunca exponham o marcador.

## Relacionado

- [Referência da CLI `openclaw path`](/pt-BR/cli/path)
- [Gerenciar plugins](/pt-BR/plugins/manage-plugins)
- [Como criar plugins](/pt-BR/plugins/building-plugins)
