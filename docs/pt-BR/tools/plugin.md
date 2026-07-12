---
doc-schema-version: 1
read_when:
    - Instalação ou configuração de plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Como trabalhar com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Getting Started
summary: Instale, configure e gerencie Plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-12T15:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugins ampliam o OpenClaw com canais, provedores de modelos, ambientes de execução de agentes, ferramentas,
skills, fala, transcrição em tempo real, voz, compreensão de mídia, geração,
busca de conteúdo da web, pesquisa na web e outros recursos de runtime.

Use esta página para instalar um plugin, reiniciar o Gateway, verificar se o runtime
o carregou e encaminhar falhas comuns de configuração. Para exemplos somente de comandos, consulte
[Gerenciar plugins](/pt-BR/plugins/manage-plugins). Para o inventário gerado de
plugins integrados, externos oficiais e disponíveis apenas no código-fonte, consulte
[Inventário de plugins](/pt-BR/plugins/plugin-inventory).

## Requisitos

- um checkout ou uma instalação do OpenClaw com a CLI `openclaw` disponível
- acesso de rede à fonte selecionada (ClawHub, npm ou um host git)
- quaisquer credenciais, chaves de configuração ou ferramentas do sistema operacional específicas do plugin mencionadas pela
  documentação de configuração desse plugin
- permissão para recarregar ou reiniciar o Gateway que atende aos seus canais

## Início rápido

<Steps>
  <Step title="Encontre o plugin">
    Pesquise pacotes públicos de plugins no [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    O ClawHub é a principal interface de descoberta de plugins da comunidade. Durante a
    transição de lançamento, especificações simples de pacotes continuam sendo instaladas pelo npm, a menos que
    correspondam ao id de um plugin oficial. Especificações `@openclaw/*` brutas que correspondem a um
    plugin integrado são resolvidas para essa cópia integrada. Use um prefixo explícito de fonte
    quando precisar especificamente de uma fonte.

  </Step>

  <Step title="Instale o plugin">
    ```bash
    # Do ClawHub.
    openclaw plugins install clawhub:<package>

    # Do npm.
    openclaw plugins install npm:<package>

    # Do git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # De um checkout de desenvolvimento local.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Trate instalações de plugins como execução de código. Prefira versões fixadas para
    instalações de produção reproduzíveis.

  </Step>

  <Step title="Configure e habilite o plugin">
    Defina as configurações específicas do plugin em `plugins.entries.<id>.config`.
    Habilite o plugin se ele ainda não estiver habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se `plugins.allow` estiver definido, o id do plugin instalado deverá estar nessa lista
    para que o plugin possa ser carregado. `openclaw plugins install` adiciona o
    id instalado a uma lista `plugins.allow` existente e remove o mesmo id de
    `plugins.deny`, para que a instalação explícita possa ser carregada após a reinicialização.

  </Step>

  <Step title="Permita que o Gateway recarregue">
    Instalar, atualizar ou desinstalar o código de um plugin exige a reinicialização do Gateway.
    Um Gateway gerenciado com o recarregamento de configuração habilitado detecta a alteração
    no registro de instalação do plugin e reinicia automaticamente. Caso contrário, reinicie-o
    você mesmo:

    ```bash
    openclaw gateway restart
    ```

    Habilitar ou desabilitar atualiza a configuração e o registro frio. Uma inspeção do runtime
    ainda é a comprovação mais clara das interfaces ativas do runtime.

  </Step>

  <Step title="Verifique o registro no runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` para comprovar ferramentas, hooks, serviços, métodos do Gateway
    ou comandos da CLI pertencentes ao plugin que foram registrados. Um `inspect` simples verifica
    apenas o manifesto frio e o registro.

  </Step>
</Steps>

## Configuração

### Escolha uma fonte de instalação

| Fonte       | Use quando                                                                     | Exemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Você quer descoberta nativa do OpenClaw, verificações, metadados de versão e dicas de instalação | `openclaw plugins install clawhub:<package>`                   |
| npm         | Você precisa de fluxos diretos do registro npm ou de dist-tags                 | `openclaw plugins install npm:<package>`                       |
| git         | Você precisa de uma branch, tag ou commit de um repositório                     | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local | Você está desenvolvendo ou testando um plugin na mesma máquina                | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Você está instalando um plugin de marketplace compatível com o Claude          | `openclaw plugins install <plugin> --marketplace <source>`     |

Especificações simples de pacotes têm um comportamento especial de compatibilidade: um nome simples que
corresponda ao id de um plugin integrado usa essa fonte integrada; um nome simples que corresponda
ao id de um plugin externo oficial usa o catálogo oficial de pacotes; qualquer outra
especificação simples é instalada pelo npm durante a transição de lançamento. Especificações `@openclaw/*`
brutas que correspondam a plugins integrados também são resolvidas para a cópia integrada antes do
fallback para o npm. Use `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente o
pacote npm externo em vez da cópia integrada. Use `clawhub:`, `npm:`,
`git:` ou `npm-pack:` para selecionar a fonte de forma determinística. Consulte
[`openclaw plugins`](/pt-BR/cli/plugins#install) para ver o contrato completo do comando.

Para instalações pelo npm, especificações sem versão fixada e `@latest` selecionam o pacote
estável mais recente que anuncia compatibilidade com esta compilação do OpenClaw. Se a
versão latest atual do npm declarar um `openclaw.compat.pluginApi` ou
`openclaw.install.minHostVersion` mais recente do que o suportado por esta compilação, o OpenClaw examina
versões estáveis anteriores e instala a mais recente que seja compatível. Versões exatas
e tags explícitas de canal, como `@beta`, permanecem fixadas no pacote selecionado
e falham quando são incompatíveis.

### Política de instalação do operador

Configure `security.installPolicy` para executar um comando de política local confiável
antes de prosseguir com a instalação ou atualização de um plugin. A política recebe metadados e
o caminho da fonte preparada e pode permitir ou bloquear a instalação. Ela abrange tanto os caminhos
de instalação/atualização da CLI quanto os gerenciados pelo Gateway. Os hooks `before_install` do plugin são executados
posteriormente e somente em processos do OpenClaw nos quais os hooks de plugins estão carregados; portanto, use
`security.installPolicy` para decisões de instalação pertencentes ao operador. A
flag obsoleta `--dangerously-force-unsafe-install` é aceita para
compatibilidade, mas não realiza nenhuma ação: ela não ignora a política de instalação nem a
lista de bloqueio integrada de dependências de plugins do OpenClaw.

Consulte [Configuração de Skills](/pt-BR/tools/skills-config#operator-install-policy-securityinstallpolicy)
para ver o esquema de execução compartilhado de `security.installPolicy`, usado por skills e
plugins.

### Configure a política de plugins

O formato comum da configuração de plugins é:

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

- `plugins.enabled: false` desabilita todos os plugins e ignora o trabalho de descoberta/carregamento.
  Referências obsoletas a plugins permanecem inertes enquanto essa opção estiver ativa; reabilite os
  plugins antes de executar a limpeza do doctor se quiser remover ids obsoletos.
- `plugins.deny` prevalece sobre a lista de permissões e a habilitação individual de plugins.
- `plugins.allow` é uma lista de permissões exclusiva. Ferramentas pertencentes a plugins que estejam fora da
  lista permanecem indisponíveis mesmo quando `tools.allow` inclui `"*"`.
- `plugins.entries.<id>.enabled: false` desabilita um plugin e mantém sua
  configuração.
- `plugins.load.paths` adiciona arquivos ou diretórios locais explícitos de plugins.
  Caminhos locais gerenciados por `plugins install` devem ser diretórios ou
  arquivos compactados de plugins; use `plugins.load.paths` para arquivos avulsos de plugins.
- Plugins originados no workspace ficam desabilitados por padrão; habilite-os explicitamente ou
  adicione-os à lista de permissões antes de usar código do workspace local.
- Plugins integrados seguem seus metadados internos de habilitação/desabilitação padrão,
  a menos que a configuração os substitua explicitamente.
- `plugins.slots.<slot>` (`memory` ou `contextEngine`) seleciona um plugin para uma
  categoria exclusiva. A seleção de slot conta como ativação explícita e
  força a habilitação do plugin selecionado para esse slot, mesmo que, de outra forma,
  ele fosse opcional. `plugins.deny` e `plugins.entries.<id>.enabled: false` ainda
  o bloqueiam.
- Plugins integrados opcionais podem ser ativados automaticamente quando a configuração nomeia uma de suas
  interfaces, como uma referência de provedor/modelo, configuração de canal, backend da CLI
  ou runtime de ambiente de execução de agentes.
- O roteamento do Codex da família OpenAI mantém separados os limites entre o provedor e o plugin de runtime:
  referências legadas de modelos Codex são configurações legadas que o doctor corrige,
  enquanto o plugin `codex` integrado gerencia o runtime do servidor de aplicativos Codex para
  referências canônicas de agentes `openai/*`, `agentRuntime.id: "codex"` explícito e
  referências legadas `codex/*`.

Quando `plugins.allow` não está definido e plugins não integrados são descobertos automaticamente no
workspace ou nas raízes globais de plugins, a inicialização registra
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
com os ids dos plugins descobertos e, para listas curtas, um trecho mínimo de `plugins.allow`.
Execute [`openclaw plugins list --enabled --verbose`](/pt-BR/cli/plugins#list)
ou [`openclaw plugins inspect <id>`](/pt-BR/cli/plugins#inspect) com o id do
plugin listado antes de copiar plugins confiáveis para `openclaw.json`. A mesma
fixação de confiança se aplica quando o diagnóstico informa que um plugin foi carregado
`without install/load-path provenance`: inspecione esse id de plugin e fixe-o em
`plugins.allow` ou reinstale-o de uma fonte confiável para que o OpenClaw registre a
proveniência da instalação.

Execute `openclaw doctor` ou `openclaw doctor --fix` quando a validação da configuração
informar ids obsoletos de plugins, incompatibilidades entre listas de permissões e ferramentas ou caminhos legados de
plugins integrados.

## Entenda os formatos de plugins

O OpenClaw reconhece dois formatos de plugins:

| Formato                 | Como é carregado                                                            | Use quando                                                              |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Plugin nativo do OpenClaw | `openclaw.plugin.json` mais um módulo de runtime carregado no processo       | Você está instalando ou criando recursos de runtime específicos do OpenClaw |
| Pacote compatível       | Layout de plugin do Codex, Claude ou Cursor mapeado para o inventário de plugins do OpenClaw | Você está reutilizando skills, comandos, hooks ou metadados de pacotes compatíveis |

Ambos os formatos aparecem em `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Consulte
[Pacotes de plugins](/pt-BR/plugins/bundles) para conhecer o limite de compatibilidade dos pacotes e
[Criação de plugins](/pt-BR/plugins/building-plugins) para criar plugins nativos.

## Hooks de plugins

Plugins podem registrar hooks no runtime por meio de duas APIs diferentes:

- Hooks tipados `api.on(...)` para eventos do ciclo de vida do runtime. Esta é a
  interface preferencial para middleware, políticas, reescrita de mensagens, modelagem de
  prompts e controle de ferramentas.
- `api.registerHook(...)` para o sistema interno de hooks descrito em
  [Hooks](/pt-BR/automation/hooks). Ele é usado principalmente para efeitos colaterais amplos de comandos/ciclo de vida
  e para compatibilidade com automações existentes no estilo HOOK.

Regra rápida: se o manipulador precisar de prioridade, semântica de mesclagem ou
comportamento de bloqueio/cancelamento, use hooks tipados. Se ele apenas reagir a `command:new`,
`command:reset`, `message:sent` ou eventos amplos semelhantes, `api.registerHook`
é adequado.

Hooks internos gerenciados por plugins aparecem em `openclaw hooks list` com
`plugin:<id>`. Você não pode habilitá-los ou desabilitá-los por meio de `openclaw hooks`;
em vez disso, habilite ou desabilite o plugin.

## Verifique o Gateway ativo

`openclaw plugins list` e um `openclaw plugins inspect` simples leem a configuração fria,
o manifesto e o estado do registro. Eles não comprovam que um Gateway já em execução
importou o mesmo código do plugin.

Quando um plugin parecer instalado, mas o tráfego de conversas em tempo real não o utilizar:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateways gerenciados reiniciam automaticamente após alterações de instalação, atualização e
desinstalação que modifiquem o código-fonte do plugin. Em instalações em VPS ou contêiner,
certifique-se de que qualquer reinicialização manual tenha como alvo o processo filho
`openclaw gateway run` real que atende seus canais, e não apenas um wrapper ou supervisor.

## Solução de problemas

| Sintoma                                                        | Verificação                                                                                                                                      | Correção                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| O plugin aparece em `plugins list`, mas os hooks de runtime não são executados  | Use `openclaw plugins inspect <id> --runtime --json` e confirme o Gateway ativo com `gateway status --deep --require-rpc`             | Reinicie o Gateway em execução após alterações de instalação, atualização, configuração ou código-fonte                               |
| Aparecem diagnósticos de propriedade duplicada de canal ou ferramenta         | Execute `openclaw plugins list --enabled --verbose`, inspecione cada plugin suspeito com `--runtime --json` e compare a propriedade dos canais/das ferramentas | Desative um dos proprietários, remova instalações obsoletas ou use `preferOver` no manifesto para uma substituição intencional      |
| A configuração informa que um plugin está ausente                                | Consulte o [inventário de plugins](/pt-BR/plugins/plugin-inventory) para verificar se ele é integrado, externo oficial ou somente de código-fonte                           | Instale o pacote externo, habilite o plugin integrado ou remova a configuração obsoleta                         |
| A configuração é inválida durante a instalação                               | Leia a mensagem de validação e execute `openclaw doctor --fix` se ela apontar para um estado obsoleto do plugin                                             | O Doctor pode colocar em quarentena uma configuração inválida do plugin, desabilitando a entrada e removendo o conteúdo inválido     |
| O caminho do plugin está bloqueado por propriedade ou permissões suspeitas | Inspecione o diagnóstico anterior ao erro de configuração                                                                                             | Corrija a propriedade/as permissões do sistema de arquivos e execute `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloqueia comandos de ciclo de vida                | Confirme que a instalação é gerenciada pelo Nix                                                                                                      | Altere a seleção de plugins no código-fonte do Nix em vez de usar comandos que modificam plugins                      |
| A importação de dependência falha no runtime                             | Verifique se o plugin foi instalado por npm/git/ClawHub ou carregado de um caminho local                                                 | Execute `openclaw plugins update <id>`, reinstale a origem ou instale você mesmo as dependências locais do plugin |

Quando uma configuração obsoleta de plugin ainda menciona um plugin de canal que não
pode mais ser descoberto, a validação da configuração rebaixa essa chave de canal para
um aviso em vez de uma falha crítica, permitindo que a inicialização do Gateway ainda
atenda todos os outros canais. Execute `openclaw doctor --fix` para remover entradas
obsoletas de plugin e canal. Chaves de canal desconhecidas sem evidências de plugin
obsoleto ainda causam falha na validação, para que erros de digitação permaneçam visíveis.

Para uma substituição intencional de canal, o plugin preferencial deve declarar
`channelConfigs.<channel-id>.preferOver` com o id do plugin legado ou de menor
prioridade. Se ambos os plugins estiverem explicitamente habilitados, o OpenClaw mantém
essa solicitação e relata diagnósticos de canal/ferramenta duplicados, em vez de escolher
silenciosamente um proprietário.

Se um pacote instalado informar que ele `requires compiled runtime output for
TypeScript entry ...`, o pacote foi publicado sem os arquivos JavaScript de que
o OpenClaw precisa no runtime. Atualize ou reinstale depois que o responsável pela
publicação disponibilizar o JavaScript compilado, ou desabilite/desinstale o plugin até lá.

### Propriedade bloqueada do caminho do plugin

Se os diagnósticos informarem
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e a validação for seguida por `plugin present but blocked`, o OpenClaw encontrou
arquivos de plugin pertencentes a um usuário Unix diferente daquele do processo que
os carrega. Mantenha a configuração do plugin; corrija a propriedade no sistema de
arquivos ou execute o OpenClaw como o mesmo usuário que possui o diretório de estado.

Para instalações com Docker, a imagem oficial é executada como `node` (uid `1000`),
portanto os diretórios de configuração e espaço de trabalho do OpenClaw montados no
host por bind normalmente devem pertencer ao uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se você executar intencionalmente o OpenClaw como root, altere a propriedade da raiz
gerenciada de plugins para root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Depois de corrigir a propriedade, execute novamente `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` para que o registro persistido de plugins
corresponda aos arquivos corrigidos.

### Configuração lenta das ferramentas de plugins

Se os turnos do agente parecerem travar durante a preparação das ferramentas, habilite
o registro em nível trace e verifique as linhas de temporização das fábricas de
ferramentas de plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] temporizações das fábricas ...
```

O resumo lista o tempo total das fábricas e as fábricas de ferramentas de plugins mais
lentas, incluindo o id do plugin, os nomes declarados das ferramentas, o formato do
resultado e se a ferramenta é opcional. Linhas lentas são elevadas a avisos quando uma
única fábrica leva pelo menos 1s ou quando a preparação total das fábricas de ferramentas
de plugins leva pelo menos 5s.

O OpenClaw armazena em cache os resultados bem-sucedidos das fábricas de ferramentas
de plugins para resoluções repetidas com o mesmo contexto efetivo da solicitação. A chave
do cache inclui a configuração efetiva do runtime, o espaço de trabalho e o id do agente,
a política de sandbox, as configurações do navegador, o contexto de entrega, a identidade
do solicitante e o estado de propriedade, portanto as fábricas que dependem desses campos
confiáveis são executadas novamente quando o contexto muda. Se as temporizações continuarem
altas, o plugin pode estar realizando trabalho dispendioso antes de retornar suas definições
de ferramentas.

Se um plugin dominar a temporização, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Em seguida, atualize, reinstale ou desabilite esse plugin. Os autores de plugins devem
mover o carregamento dispendioso de dependências para o caminho de execução da ferramenta,
em vez de realizá-lo dentro da fábrica de ferramentas.

Para raízes de dependências, validação de metadados de pacotes, registros do registro,
comportamento de recarregamento na inicialização e limpeza de itens legados, consulte
[Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution).

## Relacionados

- [Gerenciar plugins](/pt-BR/plugins/manage-plugins) - exemplos de comandos para listar, instalar, atualizar, desinstalar e publicar
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Inventário de plugins](/pt-BR/plugins/plugin-inventory) - lista gerada de plugins integrados e externos
- [Referência de plugins](/pt-BR/plugins/reference) - páginas de referência geradas para cada plugin
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta no ClawHub e política de PRs de documentação
- [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution) - raízes de instalação, registros do registro e limites do runtime
- [Criação de plugins](/pt-BR/plugins/building-plugins) - guia de criação de plugins nativos
- [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview) - registro de runtime, hooks e campos da API
- [Manifesto de plugin](/pt-BR/plugins/manifest) - manifesto e metadados do pacote
