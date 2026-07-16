---
doc-schema-version: 1
read_when:
    - Instalação ou configuração de plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Trabalho com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Getting Started
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-16T13:00:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Plugins ampliam o OpenClaw com canais, provedores de modelos, estruturas de agentes, ferramentas,
skills, fala, transcrição em tempo real, voz, compreensão de mídia, geração,
busca de conteúdo web, pesquisa na web e outros recursos de runtime.

Use esta página para instalar um plugin, reiniciar o Gateway, verificar se o runtime
o carregou e solucionar falhas comuns de configuração. Para exemplos somente de comandos, consulte
[Gerenciar plugins](/pt-BR/plugins/manage-plugins). Para o inventário gerado de
plugins integrados, externos oficiais e disponíveis somente no código-fonte, consulte
[Inventário de plugins](/pt-BR/plugins/plugin-inventory).

## Requisitos

- um checkout ou uma instalação do OpenClaw com a CLI `openclaw` disponível
- acesso de rede à fonte selecionada (ClawHub, npm ou um host git)
- quaisquer credenciais, chaves de configuração ou ferramentas do sistema operacional específicas do plugin mencionadas pela
  documentação de configuração desse plugin
- permissão para recarregar ou reiniciar o Gateway que atende aos seus canais

## Início rápido

<Steps>
  <Step title="Encontrar o plugin">
    Pesquise pacotes públicos de plugins no [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    O ClawHub é a principal interface de descoberta de plugins da comunidade. Durante a
    transição de lançamento, especificações simples comuns de pacotes ainda são instaladas pelo npm, a menos que
    correspondam ao id de um plugin oficial. Especificações `@openclaw/*` brutas que correspondam a um
    plugin integrado são resolvidas para essa cópia integrada. Use um prefixo explícito de fonte
    quando precisar especificamente de uma fonte.

  </Step>

  <Step title="Instalar o plugin">
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
    instalações reproduzíveis em produção. Os pacotes do ClawHub e o catálogo
    integrado/oficial do OpenClaw são fontes confiáveis. Novas fontes arbitrárias do npm, git,
    caminho/arquivo local, `npm-pack:` ou marketplace exigem
    `--force` em instalações não interativas depois que você
    revisar e confiar na fonte.

  </Step>

  <Step title="Configurar e habilitar">
    Defina as configurações específicas do plugin em `plugins.entries.<id>.config`.
    Habilite o plugin se ele ainda não estiver habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se `plugins.allow` estiver definido, o id do plugin instalado deverá estar nessa lista
    para que o plugin possa ser carregado. `openclaw plugins install` adiciona o
    id instalado a uma lista `plugins.allow` existente e remove o mesmo id de
    `plugins.deny`, permitindo que a instalação explícita seja carregada após a reinicialização.

  </Step>

  <Step title="Permitir que o Gateway recarregue">
    Instalar, atualizar ou desinstalar o código de um plugin exige a reinicialização do
    Gateway. Um Gateway gerenciado com recarregamento de configuração habilitado detecta a alteração
    no registro de instalação do plugin e reinicia automaticamente. Caso contrário, reinicie-o
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    A habilitação/desabilitação atualiza a configuração e o registro a frio. Uma inspeção do runtime
    ainda é a prova mais clara das interfaces ativas do runtime.

  </Step>

  <Step title="Verificar o registro no runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` para comprovar ferramentas, hooks, serviços, métodos do Gateway
    ou comandos da CLI pertencentes ao plugin que foram registrados. `inspect` simples é apenas uma
    verificação a frio do manifesto e do registro.

  </Step>
</Steps>

## Configuração

### Escolher uma fonte de instalação

| Fonte       | Use quando                                                                       | Exemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Você deseja descoberta nativa do OpenClaw, verificações, metadados de versão e dicas de instalação | `openclaw plugins install clawhub:<package>`                   |
| npm         | Você precisa de fluxos diretos do registro npm ou de dist-tags                             | `openclaw plugins install npm:<package>`                       |
| git         | Você precisa de uma branch, tag ou commit de um repositório                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local  | Você está desenvolvendo ou testando um plugin na mesma máquina                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Você está instalando um plugin de marketplace compatível com Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Especificações simples de pacotes têm um comportamento especial de compatibilidade: um nome simples que
corresponda ao id de um plugin integrado usa essa fonte integrada; um nome simples que corresponda
ao id de um plugin externo oficial usa o catálogo oficial de pacotes; qualquer outra
especificação simples é instalada pelo npm durante a transição de lançamento. Especificações `@openclaw/*`
brutas que correspondam a plugins integrados também são resolvidas para a cópia integrada antes do
fallback para o npm. Use `npm:@openclaw/<plugin>@<version>` para instalar deliberadamente o
pacote npm externo em vez da cópia integrada. Use `clawhub:`, `npm:`,
`git:` ou `npm-pack:` para uma seleção determinística da fonte. Consulte
[`openclaw plugins`](/pt-BR/cli/plugins#install) para ver o contrato completo do comando.

Em instalações pelo npm, especificações sem versão fixada e `@latest` selecionam o pacote
estável mais recente que declara compatibilidade com esta compilação do OpenClaw. Se a
versão latest atual do npm declarar um `openclaw.compat.pluginApi` ou
`openclaw.install.minHostVersion` mais recente do que o compatível com esta compilação, o OpenClaw verifica
versões estáveis anteriores e instala a mais recente que seja compatível. Versões exatas
e tags explícitas de canais, como `@beta`, permanecem fixadas no pacote selecionado
e falham quando são incompatíveis.

### Política de instalação do operador

Configure `security.installPolicy` para executar um comando de política local confiável
antes que a instalação ou atualização de um plugin prossiga. A política recebe metadados e
o caminho da fonte preparada e pode permitir ou bloquear a instalação. Ela abrange tanto os caminhos de
instalação/atualização da CLI quanto os baseados no Gateway. Os hooks `before_install` do plugin são executados
posteriormente e somente nos processos do OpenClaw em que os hooks do plugin estão carregados; portanto, use
`security.installPolicy` para decisões de instalação pertencentes ao operador. A
opção obsoleta `--dangerously-force-unsafe-install` é aceita por
compatibilidade, mas não realiza nenhuma ação: ela não ignora a política de instalação nem a lista de bloqueio
integrada do OpenClaw para dependências de plugins.

Consulte [Configuração de Skills](/pt-BR/tools/skills-config#operator-install-policy-securityinstallpolicy)
para ver o esquema compartilhado de execução `security.installPolicy` usado por skills e
plugins.

### Configurar a política de plugins

O formato comum de configuração de plugins é:

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
  Referências obsoletas a plugins permanecem inertes enquanto isso estiver ativo; reabilite os
  plugins antes de executar a limpeza do doctor se quiser remover ids obsoletos.
- `plugins.deny` prevalece sobre a lista de permissões e a habilitação individual dos plugins.
- `plugins.allow` é uma lista de permissões exclusiva. Ferramentas pertencentes a plugins fora da
  lista de permissões permanecem indisponíveis mesmo quando `tools.allow` inclui `"*"`.
- `plugins.entries.<id>.enabled: false` desabilita um plugin sem remover sua
  configuração.
- `plugins.load.paths` adiciona arquivos ou diretórios locais explícitos de plugins.
  Caminhos locais gerenciados em `plugins install` devem ser diretórios ou
  arquivos compactados de plugins; use `plugins.load.paths` para arquivos independentes de plugins.
- Plugins originados do workspace são desabilitados por padrão; habilite-os explicitamente ou
  adicione-os à lista de permissões antes de usar código do workspace local.
- Plugins integrados seguem seus metadados internos de ativação/desativação padrão,
  a menos que a configuração os substitua explicitamente.
- `plugins.slots.<slot>` (`memory` ou `contextEngine`) seleciona um plugin para uma
  categoria exclusiva. A seleção de slot conta como ativação explícita e
  força a habilitação do plugin selecionado para esse slot, mesmo que, de outra forma,
  ele exigisse adesão explícita. `plugins.deny` e `plugins.entries.<id>.enabled: false` ainda
  o bloqueiam.
- Plugins integrados de adesão explícita podem ser ativados automaticamente quando a configuração menciona uma de suas
  interfaces, como uma referência de provedor/modelo, configuração de canal, backend da CLI
  ou runtime de estrutura de agentes.
- O roteamento do Codex da família OpenAI mantém separados os limites do plugin de provedor e de runtime:
  referências legadas de modelos do Codex são configurações legadas que o doctor corrige,
  enquanto o plugin integrado `codex` controla o runtime do servidor de aplicativos do Codex para
  referências canônicas de agentes `openai/*`, `agentRuntime.id: "codex"` explícitas e
  referências legadas `codex/*`.

Quando `plugins.allow` não está definido e plugins não integrados são descobertos automaticamente no
workspace ou nas raízes globais de plugins, a inicialização registra
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
com os ids dos plugins descobertos e, para listas curtas, um trecho mínimo de `plugins.allow`.
Execute [`openclaw plugins list --enabled --verbose`](/pt-BR/cli/plugins#list)
ou [`openclaw plugins inspect <id>`](/pt-BR/cli/plugins#inspect) com o id de plugin listado
antes de copiar plugins confiáveis para `openclaw.json`. A mesma
fixação de confiança se aplica quando os diagnósticos informam que um plugin foi carregado
`without install/load-path provenance`: inspecione esse id de plugin e fixe-o em
`plugins.allow` ou reinstale-o de uma fonte confiável para que o OpenClaw registre a
proveniência da instalação.

Execute `openclaw doctor` ou `openclaw doctor --fix` quando a validação da configuração
informar ids de plugins obsoletos, incompatibilidades entre a lista de permissões e as ferramentas ou caminhos legados de
plugins integrados.

## Entender os formatos de plugins

O OpenClaw reconhece dois formatos de plugins:

| Formato                 | Como é carregado                                                                 | Use quando                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo do OpenClaw | `openclaw.plugin.json` mais um módulo de runtime carregado no processo               | Você está instalando ou criando recursos de runtime específicos do OpenClaw  |
| Pacote compatível      | Layout de plugin do Codex, Claude ou Cursor mapeado para o inventário de plugins do OpenClaw | Você está reutilizando skills, comandos, hooks ou metadados de pacotes compatíveis |

Ambos os formatos aparecem em `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Consulte
[Pacotes de plugins](/pt-BR/plugins/bundles) para conhecer o limite de compatibilidade dos pacotes e
[Criação de plugins](/pt-BR/plugins/building-plugins) para criar plugins nativos.

## Hooks de plugins

Os plugins podem registrar hooks no runtime por meio de duas APIs diferentes:

- `api.on(...)` hooks tipados para eventos do ciclo de vida do runtime. Essa é a
  interface preferencial para middleware, política, reescrita de mensagens, definição
  de prompts e controle de ferramentas.
- `api.registerHook(...)` para o sistema interno de hooks descrito em
  [Hooks](/pt-BR/automation/hooks). Ele é usado principalmente para efeitos colaterais amplos de comandos/ciclo de vida
  e compatibilidade com automações existentes no estilo HOOK.

Regra rápida: se o manipulador precisar de prioridade, semântica de mesclagem ou
comportamento de bloqueio/cancelamento, use hooks tipados. Se ele apenas reagir a `command:new`,
`command:reset`, `message:sent` ou eventos amplos semelhantes, `api.registerHook`
é suficiente.

Hooks internos gerenciados por plugins aparecem em `openclaw hooks list` com
`plugin:<id>`. Não é possível habilitá-los ou desabilitá-los por meio de `openclaw hooks`;
em vez disso, habilite ou desabilite o plugin.

## Verificar o Gateway ativo

`openclaw plugins list` e `openclaw plugins inspect` simples leem o estado frio da configuração,
do manifesto e do registro. Eles não comprovam que um Gateway já em execução
tenha importado o mesmo código do plugin.

Quando um plugin parece instalado, mas o tráfego de chat ao vivo não o utiliza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateways gerenciados reiniciam automaticamente após alterações de instalação,
atualização e desinstalação de plugins que modificam o código-fonte do plugin.
Em instalações em VPS ou contêineres, certifique-se de que qualquer reinicialização
manual tenha como alvo o processo filho `openclaw gateway run` real que atende aos
seus canais, e não apenas um wrapper ou supervisor.

## Solução de problemas

| Sintoma                                                        | Verificação                                                                                                                                      | Correção                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| O plugin aparece em `plugins list`, mas os hooks de runtime não são executados  | Use `openclaw plugins inspect <id> --runtime --json` e confirme o Gateway ativo com `gateway status --deep --require-rpc`             | Reinicie o Gateway ativo após alterações de instalação, atualização, configuração ou código-fonte                               |
| Aparecem diagnósticos de propriedade duplicada de canal ou ferramenta         | Execute `openclaw plugins list --enabled --verbose`, inspecione cada plugin suspeito com `--runtime --json` e compare a propriedade de canais/ferramentas | Desative um dos proprietários, remova instalações obsoletas ou use `preferOver` no manifesto para uma substituição intencional      |
| A configuração informa que um plugin está ausente                                | Consulte o [Inventário de plugins](/pt-BR/plugins/plugin-inventory) para saber se ele é integrado, externo oficial ou disponível apenas como código-fonte                           | Instale o pacote externo, habilite o plugin integrado ou remova a configuração obsoleta                         |
| A configuração é inválida durante a instalação                               | Leia a mensagem de validação e execute `openclaw doctor --fix` se ela indicar um estado obsoleto do plugin                                             | O Doctor pode colocar em quarentena configurações inválidas de plugins desabilitando a entrada e removendo o conteúdo inválido     |
| O caminho do plugin está bloqueado por propriedade ou permissões suspeitas | Inspecione o diagnóstico anterior ao erro de configuração                                                                                             | Corrija a propriedade/permissões do sistema de arquivos e execute `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloqueia comandos de ciclo de vida                | Confirme se a instalação é gerenciada pelo Nix                                                                                                      | Altere a seleção de plugins no código-fonte do Nix em vez de usar comandos que modificam plugins                      |
| A importação de dependência falha no runtime                             | Verifique se o plugin foi instalado por npm/git/ClawHub ou carregado de um caminho local                                                 | Execute `openclaw plugins update <id>`, reinstale a partir da origem ou instale por conta própria as dependências do plugin local |

Quando uma configuração obsoleta de plugin ainda menciona um plugin de canal que
não pode mais ser descoberto, a validação da configuração rebaixa essa chave de
canal para um aviso em vez de uma falha grave, permitindo que a inicialização do
Gateway continue atendendo a todos os outros canais. Execute
`openclaw doctor --fix` para remover entradas obsoletas de plugins e canais. Chaves
de canal desconhecidas sem evidências de plugin obsoleto ainda causam falha na
validação, para que erros de digitação permaneçam visíveis.

Para uma substituição intencional de canal, o plugin preferencial deve declarar
`channelConfigs.<channel-id>.preferOver` com o id do plugin legado ou de menor prioridade.
Se ambos os plugins estiverem explicitamente habilitados, o OpenClaw mantém essa
solicitação e relata diagnósticos de canais/ferramentas duplicados, em vez de
escolher silenciosamente um proprietário.

Se um pacote instalado informar que `requires compiled runtime output for
TypeScript entry ...`, o pacote foi publicado
sem os arquivos JavaScript necessários para o OpenClaw no runtime. Atualize ou
reinstale depois que o publicador disponibilizar o JavaScript compilado, ou
desabilite/desinstale o plugin até lá.

### Propriedade bloqueada do caminho do plugin

Se os diagnósticos informarem
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e a validação vier acompanhada de `plugin present but blocked`, o OpenClaw encontrou
arquivos de plugin pertencentes a um usuário Unix diferente daquele do processo
que os está carregando. Mantenha a configuração do plugin; corrija a propriedade
do sistema de arquivos ou execute o OpenClaw como o mesmo usuário proprietário
do diretório de estado.

Em instalações com Docker, a imagem oficial é executada como
`node` (uid `1000`), portanto, os diretórios de
configuração e workspace do OpenClaw montados por bind no host normalmente devem
pertencer ao uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se você executar intencionalmente o OpenClaw como root, altere a propriedade da
raiz gerenciada dos plugins para root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Depois de corrigir a propriedade, execute novamente `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` para que o registro persistente de plugins corresponda aos
arquivos corrigidos.

### Configuração lenta das ferramentas de plugins

Se as execuções do agente parecerem travar durante a preparação das ferramentas,
habilite o registro de rastreamento e procure linhas de temporização das fábricas
de ferramentas de plugins:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] temporizações das fábricas ...
```

O resumo lista o tempo total das fábricas e as fábricas de ferramentas de plugins
mais lentas, incluindo o id do plugin, os nomes declarados das ferramentas, o
formato do resultado e se a ferramenta é opcional. Linhas lentas são promovidas
a avisos quando uma única fábrica leva pelo menos 1s ou quando a preparação total
das fábricas de ferramentas de plugins leva pelo menos 5s.

O OpenClaw armazena em cache os resultados bem-sucedidos das fábricas de
ferramentas de plugins para resoluções repetidas com o mesmo contexto efetivo de
solicitação. A chave do cache inclui a configuração efetiva do runtime, o
workspace e o id do agente, a política do sandbox, as configurações do navegador,
o contexto de entrega, a identidade do solicitante e o estado de propriedade;
assim, as fábricas que dependem desses campos confiáveis são executadas novamente
quando o contexto muda. Se as temporizações continuarem altas, o plugin pode
estar realizando trabalho dispendioso antes de retornar suas definições de
ferramentas.

Se um plugin dominar a temporização, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Em seguida, atualize, reinstale ou desabilite esse plugin. Autores de plugins devem
adiar o carregamento de dependências dispendiosas para o caminho de execução da
ferramenta, em vez de realizá-lo dentro da fábrica de ferramentas.

Para informações sobre raízes de dependências, validação de metadados de pacotes,
registros do registro, comportamento de recarregamento na inicialização e limpeza
de itens legados, consulte
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
