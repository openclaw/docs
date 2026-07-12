---
doc-schema-version: 1
read_when:
    - Instalação ou configuração de plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Trabalhando com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Getting Started
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-12T00:26:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com canais, provedores de modelos, ambientes de agentes, ferramentas,
Skills, fala, transcrição em tempo real, voz, compreensão de mídia, geração,
busca de conteúdo na web, pesquisa na web e outros recursos de tempo de execução.

Use esta página para instalar um Plugin, reiniciar o Gateway, verificar se o tempo de execução
o carregou e diagnosticar falhas comuns de configuração. Para exemplos somente de comandos, consulte
[Gerenciar Plugins](/pt-BR/plugins/manage-plugins). Para o inventário gerado de
Plugins integrados, externos oficiais e disponíveis somente no código-fonte, consulte
[Inventário de Plugins](/pt-BR/plugins/plugin-inventory).

## Requisitos

- um checkout ou uma instalação do OpenClaw com a CLI `openclaw` disponível
- acesso de rede à origem selecionada (ClawHub, npm ou um host git)
- quaisquer credenciais, chaves de configuração ou ferramentas do sistema operacional específicas do Plugin indicadas pela
  documentação de configuração desse Plugin
- permissão para recarregar ou reiniciar o Gateway que atende aos seus canais

## Início rápido

<Steps>
  <Step title="Encontre o Plugin">
    Pesquise pacotes públicos de Plugins no [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    O ClawHub é a principal interface de descoberta de Plugins da comunidade. Durante a
    transição de lançamento, especificações comuns de pacotes sem prefixo ainda são instaladas pelo npm, a menos que
    correspondam ao id de um Plugin oficial. Especificações `@openclaw/*` brutas que correspondam a um
    Plugin integrado são resolvidas para essa cópia integrada. Use um prefixo de origem explícito
    quando precisar especificamente de uma origem.

  </Step>

  <Step title="Instale o Plugin">
    ```bash
    # Pelo ClawHub.
    openclaw plugins install clawhub:<package>

    # Pelo npm.
    openclaw plugins install npm:<package>

    # Pelo git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Por um checkout de desenvolvimento local.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Trate instalações de Plugins como execução de código. Prefira versões fixadas para
    instalações reproduzíveis em produção.

  </Step>

  <Step title="Configure e habilite-o">
    Defina as configurações específicas do Plugin em `plugins.entries.<id>.config`.
    Habilite o Plugin se ele ainda não estiver habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se `plugins.allow` estiver definido, o id do Plugin instalado deverá estar nessa lista
    para que o Plugin possa ser carregado. `openclaw plugins install` adiciona o
    id instalado a uma lista `plugins.allow` existente e remove o mesmo id de
    `plugins.deny`, para que a instalação explícita possa ser carregada após a reinicialização.

  </Step>

  <Step title="Permita que o Gateway seja recarregado">
    Instalar, atualizar ou desinstalar o código de um Plugin exige a reinicialização do
    Gateway. Um Gateway gerenciado com recarga de configuração habilitada detecta a alteração
    no registro de instalação do Plugin e reinicia automaticamente. Caso contrário, reinicie-o
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    Habilitar ou desabilitar atualiza a configuração e o registro a frio. Uma inspeção do tempo de execução
    ainda é a comprovação mais clara das interfaces ativas do tempo de execução.

  </Step>

  <Step title="Verifique o registro no tempo de execução">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` para comprovar ferramentas, hooks, serviços e métodos do Gateway
    registrados ou comandos da CLI pertencentes ao Plugin. Um `inspect` simples é apenas uma verificação
    a frio do manifesto e do registro.

  </Step>
</Steps>

## Configuração

### Escolha uma origem de instalação

| Origem      | Use quando                                                                       | Exemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Você quer descoberta nativa do OpenClaw, verificações, metadados de versão e dicas de instalação | `openclaw plugins install clawhub:<package>`                   |
| npm         | Você precisa de fluxos diretos do registro npm ou de dist-tags                             | `openclaw plugins install npm:<package>`                       |
| git         | Você precisa de uma ramificação, tag ou commit de um repositório                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local  | Você está desenvolvendo ou testando um Plugin na mesma máquina                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Você está instalando um Plugin de marketplace compatível com Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Especificações de pacotes sem prefixo têm um comportamento especial de compatibilidade: um nome sem prefixo que
corresponda ao id de um Plugin integrado usa essa origem integrada; um nome sem prefixo que corresponda
ao id de um Plugin externo oficial usa o catálogo oficial de pacotes; qualquer outra
especificação sem prefixo é instalada pelo npm durante a transição de lançamento. Especificações `@openclaw/*`
brutas que correspondam a Plugins integrados também são resolvidas para a cópia integrada antes do
fallback para o npm. Use `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente o
pacote npm externo em vez da cópia integrada. Use `clawhub:`, `npm:`,
`git:` ou `npm-pack:` para uma seleção determinística da origem. Consulte
[`openclaw plugins`](/pt-BR/cli/plugins#install) para ver o contrato completo do comando.

Para instalações pelo npm, especificações sem versão fixada e `@latest` escolhem o pacote estável
mais recente que anuncia compatibilidade com esta compilação do OpenClaw. Se a
versão mais recente atual do npm declarar um `openclaw.compat.pluginApi` ou
`openclaw.install.minHostVersion` mais recente do que esta compilação aceita, o OpenClaw verifica
versões estáveis anteriores e instala a mais recente que seja compatível. Versões exatas
e tags de canal explícitas, como `@beta`, permanecem fixadas no pacote selecionado
e falham quando são incompatíveis.

### Política de instalação do operador

Configure `security.installPolicy` para executar um comando de política local confiável
antes de prosseguir com a instalação ou atualização de um Plugin. A política recebe metadados e
o caminho da origem preparada e pode permitir ou bloquear a instalação. Ela abrange tanto os caminhos de
instalação/atualização pela CLI quanto os operados pelo Gateway. Os hooks `before_install` do Plugin são executados
posteriormente e somente em processos do OpenClaw nos quais os hooks do Plugin estão carregados; portanto, use
`security.installPolicy` para decisões de instalação controladas pelo operador. A
opção obsoleta `--dangerously-force-unsafe-install` é aceita por
compatibilidade, mas não realiza nenhuma ação: ela não ignora a política de instalação nem a
lista interna de dependências de Plugins bloqueadas pelo OpenClaw.

Consulte [Configuração de Skills](/pt-BR/tools/skills-config#operator-install-policy-securityinstallpolicy)
para ver o esquema de execução compartilhado de `security.installPolicy`, usado por Skills e
Plugins.

### Configure a política de Plugins

O formato comum de configuração de Plugins é:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Principais regras da política:

- `plugins.enabled: false` desabilita todos os Plugins e ignora o trabalho de descoberta/carregamento.
  Referências obsoletas a Plugins permanecem inativas enquanto essa opção estiver ativa; reabilite os
  Plugins antes de executar a limpeza do doctor se quiser remover ids obsoletos.
- `plugins.deny` tem precedência sobre `allow` e sobre a habilitação individual de Plugins.
- `plugins.allow` é uma lista exclusiva de permissões. Ferramentas pertencentes a Plugins que não estejam na
  lista de permissões permanecem indisponíveis mesmo quando `tools.allow` inclui `"*"`.
- `plugins.entries.<id>.enabled: false` desabilita um Plugin, preservando sua
  configuração.
- `plugins.load.paths` adiciona arquivos ou diretórios locais explícitos de Plugins.
  Caminhos locais gerenciados por `plugins install` devem ser diretórios ou
  arquivos compactados de Plugins; use `plugins.load.paths` para arquivos independentes de Plugins.
- Plugins originados do espaço de trabalho ficam desabilitados por padrão; habilite-os explicitamente ou
  adicione-os à lista de permissões antes de usar código do espaço de trabalho local.
- Plugins integrados seguem seus metadados internos de ativação/desativação padrão,
  a menos que a configuração os substitua explicitamente.
- `plugins.slots.<slot>` (`memory` ou `contextEngine`) seleciona um Plugin para uma
  categoria exclusiva. A seleção do slot conta como ativação explícita e
  força a habilitação do Plugin selecionado para esse slot, mesmo que normalmente
  ele exigisse adesão explícita. `plugins.deny` e `plugins.entries.<id>.enabled: false` ainda
  o bloqueiam.
- Plugins integrados de adesão explícita podem ser ativados automaticamente quando a configuração nomeia uma de suas
  interfaces controladas, como uma referência de provedor/modelo, configuração de canal, backend da CLI
  ou tempo de execução do ambiente de agentes.
- O roteamento do Codex da família OpenAI mantém separados os limites do provedor e do Plugin de tempo de execução:
  referências legadas de modelos Codex são configurações legadas que o doctor corrige,
  enquanto o Plugin integrado `codex` controla o tempo de execução do servidor de aplicativos Codex para
  referências canônicas de agentes `openai/*`, `agentRuntime.id: "codex"` explícito e
  referências legadas `codex/*`.

Quando `plugins.allow` não está definido e Plugins não integrados são descobertos automaticamente no
espaço de trabalho ou nas raízes globais de Plugins, os logs de inicialização exibem
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
com os ids dos Plugins descobertos e, para listas curtas, um trecho mínimo de `plugins.allow`.
Execute [`openclaw plugins list --enabled --verbose`](/pt-BR/cli/plugins#list)
ou [`openclaw plugins inspect <id>`](/pt-BR/cli/plugins#inspect) no id do
Plugin listado antes de copiar Plugins confiáveis para `openclaw.json`. A mesma
fixação de confiança se aplica quando os diagnósticos informam que um Plugin foi carregado
`without install/load-path provenance`: inspecione o id desse Plugin e depois fixe-o em
`plugins.allow` ou reinstale-o de uma origem confiável para que o OpenClaw registre a
proveniência da instalação.

Execute `openclaw doctor` ou `openclaw doctor --fix` quando a validação da configuração
relatar ids obsoletos de Plugins, incompatibilidades entre listas de permissões e ferramentas ou caminhos legados de Plugins
integrados.

## Entenda os formatos de Plugins

O OpenClaw reconhece dois formatos de Plugins:

| Formato                 | Como é carregado                                                                 | Use quando                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo do OpenClaw | `openclaw.plugin.json` mais um módulo de tempo de execução carregado no processo               | Você está instalando ou criando recursos de tempo de execução específicos do OpenClaw  |
| Pacote compatível      | Estrutura de Plugin do Codex, Claude ou Cursor mapeada para o inventário de Plugins do OpenClaw | Você está reutilizando Skills, comandos, hooks ou metadados de pacotes compatíveis |

Ambos os formatos aparecem em `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Consulte
[Pacotes de Plugins](/pt-BR/plugins/bundles) para conhecer o limite de compatibilidade dos pacotes e
[Criação de Plugins](/pt-BR/plugins/building-plugins) para criar Plugins nativos.

## Hooks de Plugins

Plugins podem registrar hooks no tempo de execução por meio de duas APIs diferentes:

- Hooks tipados `api.on(...)` para eventos do ciclo de vida do tempo de execução. Essa é a
  interface preferencial para middleware, política, reescrita de mensagens, formatação
  de prompts e controle de ferramentas.
- `api.registerHook(...)` para o sistema interno de hooks descrito em
  [Hooks](/pt-BR/automation/hooks). Ele se destina principalmente a efeitos colaterais gerais de comandos/ciclo de vida
  e à compatibilidade com automações existentes no estilo HOOK.

Regra rápida: se o manipulador precisar de prioridade, semântica de mesclagem ou
comportamento de bloqueio/cancelamento, use hooks tipados. Se ele apenas reagir a `command:new`,
`command:reset`, `message:sent` ou eventos gerais semelhantes, `api.registerHook`
é adequado.

Hooks internos gerenciados por Plugins aparecem em `openclaw hooks list` com
`plugin:<id>`. Você não pode habilitá-los nem desabilitá-los por meio de `openclaw hooks`;
em vez disso, habilite ou desabilite o Plugin.

## Verifique o Gateway ativo

`openclaw plugins list` e um `openclaw plugins inspect` simples leem o estado a frio da
configuração, do manifesto e do registro. Eles não comprovam que um Gateway já em execução
importou o mesmo código do Plugin.

Quando um Plugin parece instalado, mas o tráfego de chat ativo não o utiliza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateways gerenciados reiniciam automaticamente após alterações de instalação, atualização e
desinstalação que modifiquem o código-fonte do plugin. Em instalações em VPS ou contêiner, garanta
que qualquer reinicialização manual tenha como destino o processo filho real de `openclaw gateway run`
que atende aos seus canais, e não apenas um wrapper ou supervisor.

## Solução de problemas

| Sintoma                                                        | Verificação                                                                                                                                      | Correção                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| O plugin aparece em `plugins list`, mas os hooks de runtime não são executados  | Use `openclaw plugins inspect <id> --runtime --json` e confirme o Gateway ativo com `gateway status --deep --require-rpc`             | Reinicie o Gateway em execução após alterações de instalação, atualização, configuração ou código-fonte                               |
| Aparecem diagnósticos de propriedade duplicada de canal ou ferramenta         | Execute `openclaw plugins list --enabled --verbose`, inspecione cada plugin suspeito com `--runtime --json` e compare a propriedade dos canais/das ferramentas | Desative um dos proprietários, remova instalações obsoletas ou use `preferOver` no manifesto para uma substituição intencional      |
| A configuração informa que um plugin está ausente                                | Consulte o [inventário de plugins](/pt-BR/plugins/plugin-inventory) para verificar se ele é integrado, externo oficial ou disponível apenas como código-fonte                           | Instale o pacote externo, habilite o plugin integrado ou remova a configuração obsoleta                         |
| A configuração é inválida durante a instalação                               | Leia a mensagem de validação e execute `openclaw doctor --fix` se ela indicar um estado de plugin obsoleto                                             | O Doctor pode colocar a configuração inválida do plugin em quarentena, desabilitando a entrada e removendo o conteúdo inválido     |
| O caminho do plugin está bloqueado devido a propriedade ou permissões suspeitas | Examine o diagnóstico antes do erro de configuração                                                                                             | Corrija a propriedade/as permissões do sistema de arquivos e execute `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloqueia comandos de ciclo de vida                | Confirme que a instalação é gerenciada pelo Nix                                                                                                      | Altere a seleção de plugins no código-fonte do Nix em vez de usar comandos que modificam plugins                      |
| A importação de uma dependência falha no runtime                             | Verifique se o plugin foi instalado por npm/git/ClawHub ou carregado de um caminho local                                                 | Execute `openclaw plugins update <id>`, reinstale o código-fonte ou instale você mesmo as dependências locais do plugin |

Quando a configuração obsoleta de um plugin ainda menciona um plugin de canal que não pode mais ser descoberto,
a validação da configuração rebaixa essa chave de canal para um aviso em vez de uma
falha definitiva, para que a inicialização do Gateway ainda possa atender a todos os outros canais. Execute
`openclaw doctor --fix` para remover entradas obsoletas de plugins e canais. Chaves de
canal desconhecidas sem indícios de plugin obsoleto ainda causam falha na validação, para que erros
de digitação permaneçam visíveis.

Para a substituição intencional de um canal, o plugin preferencial deve declarar
`channelConfigs.<channel-id>.preferOver` com o id do plugin legado ou de menor prioridade.
Se ambos os plugins estiverem explicitamente habilitados, o OpenClaw mantém essa solicitação
e relata diagnósticos de canais/ferramentas duplicados em vez de escolher silenciosamente
um proprietário.

Se um pacote instalado informar que `requires compiled runtime output for
TypeScript entry ...`, o pacote foi publicado sem os arquivos JavaScript
necessários para o OpenClaw no runtime. Atualize ou reinstale depois que o publicador disponibilizar
o JavaScript compilado, ou desabilite/desinstale o plugin até lá.

### Propriedade bloqueada do caminho do plugin

Se os diagnósticos informarem
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e a validação vier acompanhada de `plugin present but blocked`, o OpenClaw encontrou
arquivos de plugin pertencentes a um usuário Unix diferente do processo que os carrega.
Mantenha a configuração do plugin; corrija a propriedade do sistema de arquivos ou execute o OpenClaw
como o mesmo usuário proprietário do diretório de estado.

Para instalações com Docker, a imagem oficial é executada como `node` (uid `1000`), portanto os
diretórios de configuração e de espaço de trabalho do OpenClaw montados no host normalmente devem
pertencer ao uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se você executar intencionalmente o OpenClaw como root, altere a propriedade da raiz gerenciada de plugins
para root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Depois de corrigir a propriedade, execute novamente `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` para que o registro persistente de plugins
corresponda aos arquivos corrigidos.

### Configuração lenta das ferramentas de plugins

Se as interações do agente parecerem travar durante a preparação das ferramentas, habilite os logs de rastreamento
e procure linhas de temporização das fábricas de ferramentas dos plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] factory timings ...
```

O resumo lista o tempo total das fábricas e as fábricas de ferramentas de plugins mais lentas,
incluindo o id do plugin, os nomes de ferramentas declarados, o formato do resultado e se a ferramenta
é opcional. Linhas lentas são promovidas a avisos quando uma única fábrica leva
pelo menos 1 s ou quando a preparação total das fábricas de ferramentas de plugins leva pelo menos 5 s.

O OpenClaw armazena em cache os resultados bem-sucedidos das fábricas de ferramentas de plugins para resoluções
repetidas com o mesmo contexto efetivo da solicitação. A chave do cache inclui
a configuração efetiva do runtime, o espaço de trabalho e o id do agente, a política do sandbox, as configurações
do navegador, o contexto de entrega, a identidade do solicitante e o estado de propriedade, portanto
as fábricas que dependem desses campos confiáveis são executadas novamente quando o contexto
muda. Se os tempos permanecerem altos, o plugin pode estar realizando trabalho dispendioso antes
de retornar as definições de suas ferramentas.

Se um plugin dominar a temporização, examine seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Em seguida, atualize, reinstale ou desabilite esse plugin. Os autores de plugins devem adiar
o carregamento dispendioso de dependências para o caminho de execução da ferramenta, em vez de realizá-lo
dentro da fábrica de ferramentas.

Para raízes de dependências, validação dos metadados dos pacotes, registros do catálogo, comportamento
de recarga na inicialização e limpeza de itens legados, consulte
[Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution).

## Relacionados

- [Gerenciar plugins](/pt-BR/plugins/manage-plugins) - exemplos de comandos para listar, instalar, atualizar, desinstalar e publicar
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Inventário de plugins](/pt-BR/plugins/plugin-inventory) - lista gerada de plugins integrados e externos
- [Referência de plugins](/pt-BR/plugins/reference) - páginas de referência geradas para cada plugin
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta no ClawHub e política de PRs de documentação
- [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution) - raízes de instalação, registros do catálogo e limites do runtime
- [Criação de plugins](/pt-BR/plugins/building-plugins) - guia de criação de plugins nativos
- [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview) - registro no runtime, hooks e campos da API
- [Manifesto de plugin](/pt-BR/plugins/manifest) - manifesto e metadados do pacote
