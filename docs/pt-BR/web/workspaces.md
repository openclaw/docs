---
read_when:
    - Criar ou reorganizar abas e widgets do espaço de trabalho
    - Permitindo que um agente componha um espaço de trabalho
    - Revisando o modelo de aprovação e sandbox de widgets personalizados
summary: Espaços de trabalho componíveis por agentes na interface de controle
title: Espaços de trabalho
x-i18n:
    generated_at: "2026-07-12T00:29:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

A aba **Espaços de trabalho** na [interface de controle](/pt-BR/web/control-ui) é uma área que você e seus
agentes organizam em conjunto. Abas, widgets, suas posições em uma grade de 12 colunas e suas
vinculações de dados ficam todos em um único documento. Qualquer recurso capaz de editar esse documento pode compor
o espaço de trabalho: você, a CLI `openclaw workspaces` ou um agente que chame as ferramentas `workspace_*`.

Toda gravação passa pelo mesmo caminho validado, portanto o layout de uma pessoa e o layout de um agente
não podem divergir. Cada gravação aceita incrementa uma versão e transmite
`plugin.workspaces.changed`, fazendo com que a edição de um agente apareça em um navegador já aberto sem
recarregar a página.

## Ativar os espaços de trabalho

O Plugin Espaços de trabalho incluído vem desativado por padrão. Na interface de controle, abra **Plugins**,
localize **Workspaces** e selecione **Enable**. Você também pode ativá-lo pela CLI:

```sh
openclaw plugins enable workspaces
```

Ativar o Plugin adiciona a aba **Espaços de trabalho** e disponibiliza a CLI `openclaw workspaces`
e as ferramentas de agente `workspace_*`. Desativá-lo remove essas interfaces sem
excluir o banco de dados dos espaços de trabalho nem os recursos dos widgets.

## O espaço de trabalho padrão

No primeiro carregamento, você recebe um espaço de trabalho **Visão geral**: cartões de custo e tokens, integridade
das instâncias, sessões, status do cron e um feed de atividades. Trata-se de conteúdo comum do espaço de trabalho — arraste-o,
recolha-o, oculte-o ou exclua-o.

## Widgets integrados

Nove widgets confiáveis são fornecidos com o Plugin e renderizados como interface própria do produto:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Os widgets declaram dados por meio de **vinculações**; eles nunca os buscam por conta própria:

| Vinculação | Resolve para                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `static`   | Um valor literal armazenado no documento (máximo de 8 KB).                                                             |
| `file`     | Um arquivo JSON, Markdown ou CSV em `<stateDir>/workspaces/data/`, opcionalmente delimitado por um ponteiro JSON.       |
| `rpc`      | Um dos métodos somente leitura do Gateway em uma lista fixa de permissões, resolvido pela interface de controle confiável. |

A vinculação `file` é a forma mais simples de inserir seus próprios números em um espaço de trabalho: grave um
arquivo JSON no diretório de dados e aponte um `stat-card` para ele.

## Proveniência

Abas e widgets carregam uma marca `createdBy` — `user`, `system` ou `agent:<id>` — definida com base em
quem realizou a gravação. Ela não pode ser fornecida pelo chamador, portanto um agente não pode atribuir
a você o próprio trabalho, e o indicador "IA" em um widget criado por um agente sempre significa exatamente isso.

## Widgets personalizados

Um agente pode criar um widget HTML real com `workspace_widget_scaffold` (ou você pode fazer isso com
`openclaw workspaces widget-scaffold <name>`). O código criado por agentes é tratado como hostil:

- Um widget recém-criado entra no registro como **pendente**. Nenhum iframe é criado, e a
  rota de recursos retorna 404 para seus arquivos até que um operador o aprove.
- A aprovação é uma decisão separada da edição de um layout: `workspaces.widget.approve`
  exige o escopo `operator.approvals`, o mesmo escopo que protege as aprovações de execução.
- Um widget aprovado é renderizado em um `<iframe sandbox="allow-scripts">` — nunca
  `allow-same-origin` —, portanto sua origem é opaca e ele não pode acessar o DOM,
  o armazenamento nem os cookies da página pai.
- Seus recursos são servidos com `connect-src 'none'`, bloqueando conexões de rede feitas por scripts, como
  `fetch`, XHR e WebSockets. Ele não possui credenciais e nunca se comunica com o Gateway.
- Os dados chegam até ele somente por uma ponte `postMessage` versionada. O código personalizado pode receber
  vinculações `static` declaradas, que já são valores do espaço de trabalho criados por um agente
  ou operador. As vinculações RPC e de arquivo permanecem em widgets integrados confiáveis: os navegadores permitem que um
  elemento filho em sandbox navegue no próprio quadro, portanto dados privilegiados nunca são enviados
  para HTML criado por agentes.

O envio de um prompt ao chat por meio de um widget também exige uma capacidade no manifesto, uma
confirmação por invocação que cite o texto exato e está sujeito a um limite de frequência.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` exige um dispositivo pareado com o escopo `operator.approvals`; a aprovação pela
interface de controle não exige isso, pois o navegador já possui esse escopo.

## Armazenamento

O documento do espaço de trabalho, o registro de widgets personalizados e um histórico de desfazer com 20 entradas ficam em
`<stateDir>/workspaces/workspaces.sqlite`. Os recursos de widgets criados por agentes permanecem no disco em
`<stateDir>/workspaces/widgets/<name>/`, e os dados de vinculação de arquivos ficam em
`<stateDir>/workspaces/data/`, pois um agente os cria com ferramentas comuns de arquivo e
a rota do widget serve seus bytes.
