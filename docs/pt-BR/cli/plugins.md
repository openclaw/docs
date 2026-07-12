---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer estruturar ou validar um Plugin de ferramenta simples
    - Você quer depurar falhas de carregamento de plugins
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (inicializar, compilar, validar, listar, instalar, marketplace, desinstalar, habilitar/desabilitar, diagnosticar)
title: Plugins
x-i18n:
    generated_at: "2026-07-11T23:49:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie Plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de Plugins" href="/pt-BR/tools/plugin">
    Guia do usuário final para instalar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Gerenciar plugins" href="/pt-BR/plugins/manage-plugins">
    Exemplos rápidos para instalar, listar, atualizar, desinstalar e publicar.
  </Card>
  <Card title="Bundles de Plugins" href="/pt-BR/plugins/bundles">
    Modelo de compatibilidade de bundles.
  </Card>
  <Card title="Manifesto de Plugin" href="/pt-BR/plugins/manifest">
    Campos do manifesto e esquema de configuração.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security">
    Reforço de segurança para instalações de plugins.
  </Card>
</CardGroup>

## Comandos

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Para investigar lentidão na instalação, inspeção, desinstalação ou atualização do registro, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O rastreamento grava as durações das fases
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` é imutável. `install`, `update`, `uninstall`, `enable` e `disable` se recusam a executar. Em vez disso, edite a fonte Nix desta instalação (`programs.openclaw.config` ou `instances.<name>.config` para nix-openclaw) e depois reconstrua. Consulte o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
</Note>

<Note>
Plugins incluídos são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelos incluídos, provedores de fala incluídos e o Plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw incluem `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de listagem/informações também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`), além das funcionalidades detectadas do bundle.
</Note>

## Criação

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Por padrão, `plugins init` cria um Plugin mínimo de ferramenta em TypeScript. O primeiro
argumento é o id do Plugin; `--name` define o nome de exibição. O OpenClaw usa o
id para o diretório de saída padrão e a nomenclatura do pacote. Estruturas de ferramenta usam
`defineToolPlugin` e geram scripts `plugin:build` e
`plugin:validate` no `package.json`, que compilam e depois chamam `openclaw plugins build`/`validate`.

`plugins build` importa o ponto de entrada compilado, lê seus metadados estáticos de ferramenta, grava
`openclaw.plugin.json` e mantém `openclaw.extensions` do `package.json` alinhado.
`plugins validate` verifica se o manifesto gerado, os metadados do pacote e a
exportação atual do ponto de entrada ainda estão de acordo. Consulte [Plugins de ferramenta](/pt-BR/plugins/tool-plugins) para
ver o fluxo completo de criação.

A estrutura grava código-fonte TypeScript, mas gera metadados a partir do ponto de entrada compilado
`./dist/index.js`, portanto o fluxo também funciona com a CLI publicada. Use
`--entry <path>` quando o ponto de entrada não for o ponto de entrada padrão do pacote. Use
`plugins build --check` na CI para falhar quando os metadados gerados estiverem desatualizados, sem
reescrever arquivos.

### Estrutura de provedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Estruturas de provedor criam um Plugin genérico de provedor de modelos compatível com OpenAI,
com integração de autenticação por chave de API, um script `npm run validate` que executa
`clawhub package validate`, metadados de pacote do ClawHub e um fluxo do GitHub Actions
acionado manualmente para futura publicação confiável por meio do OIDC do GitHub.
Estruturas de provedor não geram Skills e não usam
`openclaw plugins build`/`validate`; esses comandos destinam-se ao caminho de metadados gerados
da estrutura de ferramenta.

Antes de publicar, substitua a URL-base de API provisória, o catálogo de modelos, a rota da documentação,
o texto de credenciais e o conteúdo do README pelos dados reais do provedor. Use o
README gerado para a primeira publicação no ClawHub e para configurar o publicador confiável.

## Instalação

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Mantenedores que testam instalações durante a configuração podem substituir as fontes automáticas
de instalação de Plugins por variáveis de ambiente protegidas. Consulte
[Substituições de instalação de Plugins](/pt-BR/plugins/install-overrides).

<Warning>
Durante a transição de lançamento, nomes simples de pacotes são instalados do npm por padrão, a menos que correspondam ao id de um Plugin incluído ou oficial; nesse caso, o OpenClaw usa essa cópia local/oficial em vez de acessar o registro npm. Use `npm:<package>` quando você quiser deliberadamente um pacote npm externo. Use `clawhub:<package>` para o ClawHub. Trate instalações de Plugins como execução de código; prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes `code-plugin` e
`bundle-plugin` instaláveis (não Skills; use `openclaw skills search` para elas).
O `--limit` padrão é 20, com limite máximo de 100. Ele apenas lê o catálogo remoto: não há
inspeção do estado local, alteração da configuração, instalação de pacote nem carregamento do runtime
do Plugin. Os resultados incluem o nome do pacote no ClawHub, a família, o canal, a versão,
o resumo e uma sugestão de instalação, como `openclaw plugins install clawhub:<package>`.

<Note>
O ClawHub é a principal superfície de distribuição e descoberta para a maioria dos Plugins. O npm
continua sendo uma alternativa compatível e um caminho de instalação direta. Os pacotes de Plugins
`@openclaw/*` pertencentes ao OpenClaw voltaram a ser publicados no npm; consulte a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou o
[inventário de Plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando disponível,
recorrendo a `latest` caso contrário. No canal estável estendido, Plugins npm oficiais
com intenção simples/padrão ou `latest` são resolvidos para a versão exata instalada do núcleo.
Fixações exatas e tags explícitas diferentes de `latest`, pacotes de terceiros e
fontes que não sejam npm não são reescritos.
</Note>

<AccordionGroup>
  <Accordion title="Inclusões de configuração e reparo de configuração inválida">
    Se sua seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` gravará diretamente nesse arquivo incluído e deixará `openclaw.json` intacto. Inclusões na raiz, matrizes de inclusões e inclusões com substituições no mesmo nível falham de forma segura, em vez de serem achatadas. Consulte [Inclusões de configuração](/pt-BR/gateway/configuration) para ver os formatos compatíveis.

    Se a configuração estiver inválida durante a instalação, `plugins install` normalmente falha de forma segura e orienta você a executar primeiro `openclaw doctor --fix`. Durante a inicialização e o recarregamento dinâmico do Gateway, uma configuração inválida de Plugin falha de forma segura como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar em quarentena a entrada inválida do Plugin. A única exceção documentada durante a instalação é um caminho restrito de recuperação de Plugins incluídos que aceitam explicitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação versus atualização">
    `--force` reutiliza o destino de instalação existente e sobrescreve no local um Plugin ou pacote de hooks já instalado. Use-o quando quiser reinstalar intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para atualizações rotineiras de um Plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de Plugin que já esteja instalado, o OpenClaw interromperá a operação e indicará `plugins update <id-or-npm-spec>` para uma atualização normal, ou `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente. `--force` não é compatível com `--link`.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` aplica-se apenas a instalações npm e registra o `<name>@<version>` exato resolvido. Não é compatível com instalações `git:` (em vez disso, fixe a referência na especificação, por exemplo, `git:github.com/acme/plugin@v1.2.3`) nem com `--marketplace` (instalações do marketplace persistem metadados da fonte do marketplace em vez de uma especificação npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto e agora não realiza nenhuma operação. O OpenClaw não executa mais o bloqueio interno de código perigoso durante instalações de Plugins.

    Use a superfície `security.installPolicy`, controlada pelo operador, quando for necessária uma política de instalação específica do host. Hooks `before_install` de Plugins são hooks do ciclo de vida do runtime do Plugin, não o principal limite de política para instalações pela CLI.

    Se um Plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma verificação do registro, siga as etapas para publicadores em [Publicação no ClawHub](/pt-BR/clawhub/publishing). `--dangerously-force-unsafe-install` não solicita que o ClawHub verifique novamente o Plugin nem torne pública uma versão bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalações de pacotes da comunidade no ClawHub verificam o registro de confiança da versão selecionada antes do download. Se o ClawHub desabilitar o download da versão, relatar resultados maliciosos na verificação ou colocar a versão em um estado de moderação bloqueante (em quarentena, revogada), o OpenClaw a recusará sem exceção, independentemente dessa opção. Para estados de moderação ou resultados de verificação arriscados, mas não bloqueantes, o OpenClaw mostra os detalhes de confiança e solicita confirmação antes de continuar.

    Use `--acknowledge-clawhub-risk` somente depois de analisar o aviso do ClawHub e decidir continuar sem uma solicitação interativa. Resultados de verificação pendentes ou desatualizados (ainda não considerados limpos) geram um aviso, mas não exigem confirmação. Pacotes oficiais do ClawHub e fontes de Plugins incluídos do OpenClaw ignoram totalmente essa verificação de confiança da versão.

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para obter visibilidade filtrada dos hooks e habilitá-los individualmente, não para instalar pacotes.

    As especificações npm são **exclusivas do registro** (nome do pacote mais uma **versão exata** ou **dist-tag** opcional). Especificações Git/URL/arquivo e intervalos semver são rejeitados. As instalações de dependências são executadas em um projeto npm gerenciado por plugin com `--ignore-scripts` por segurança, mesmo quando o shell tem configurações globais de instalação do npm. Os projetos npm gerenciados dos plugins herdam os `overrides` do npm no nível do pacote do OpenClaw, portanto as versões de segurança fixadas pelo host também se aplicam às dependências içadas dos plugins.

    Use `npm:<package>` para tornar explícita a resolução pelo npm. Especificações de pacote simples também são instaladas diretamente do npm durante a transição de lançamento, a menos que correspondam ao id de um plugin oficial.

    Especificações `@openclaw/*` brutas que correspondem a plugins incluídos são resolvidas para a cópia incluída e pertencente à imagem antes do fallback para npm. Por exemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa o plugin do Discord incluído na compilação atual do OpenClaw em vez de criar uma substituição npm gerenciada. Para forçar o uso do pacote npm externo, use `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Especificações simples e `@latest` permanecem no canal estável. Versões de correção do OpenClaw com data, como `2026.5.3-1`, contam como estáveis para essa verificação. Se o npm resolver qualquer uma das formas para uma versão de pré-lançamento, o OpenClaw interrompe a operação e solicita que você aceite explicitamente usando uma tag de pré-lançamento (`@beta`/`@rc`) ou uma versão exata de pré-lançamento (`@1.2.3-beta.4`).

    Para instalações npm sem uma versão exata (`npm:<package>` ou `npm:<package>@latest`), o OpenClaw verifica os metadados do pacote resolvido antes da instalação. Se o pacote estável mais recente exigir uma API de plugin do OpenClaw mais nova ou uma versão mínima do host superior, o OpenClaw inspeciona versões estáveis anteriores e instala a versão compatível mais recente. Versões exatas e dist-tags explícitas permanecem estritas: uma seleção incompatível falha e solicita que você atualize o OpenClaw ou escolha uma versão compatível.

    Se uma especificação de instalação simples corresponder ao id de um plugin oficial (por exemplo, `diffs`), o OpenClaw instala diretamente a entrada do catálogo. Para instalar um pacote npm com o mesmo nome, use uma especificação explícita com escopo (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório Git. Formatos compatíveis: `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma ramificação, tag ou commit antes da instalação.

    As instalações via Git clonam em um diretório temporário, fazem checkout da referência solicitada quando presente e, em seguida, usam o instalador normal de diretórios de plugin; assim, a validação do manifesto, a política de instalação do operador, o trabalho de instalação do gerenciador de pacotes e os registros de instalação se comportam como nas instalações via npm. As instalações Git registradas incluem a URL/referência da origem e o commit resolvido, para que `openclaw plugins update` possa resolver novamente a origem mais tarde.

    Após instalar via Git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos do Gateway e comandos da CLI. Se o plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos compactados">
    Arquivos compactados compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave os registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    usar o mesmo caminho de projeto npm gerenciado por plugin usado pelas instalações
    do registro, incluindo verificação de `package-lock.json`, varredura de dependências
    içadas e registros de instalação npm. Caminhos simples de arquivos compactados
    continuam sendo instalados como arquivos locais na raiz de extensões de plugins.

    Instalações do marketplace do Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

As instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações simples de plugins válidas para npm são instaladas do npm por padrão durante a transição de lançamento, a menos que correspondam ao id de um plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução exclusiva pelo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a compatibilidade anunciada da API do plugin e da versão mínima do Gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` npm-pack versionado, verifica o cabeçalho de resumo do ClawHub e o resumo do artefato e, em seguida, o instala pelo caminho normal de arquivos compactados. Versões mais antigas do ClawHub sem metadados ClawPack continuam sendo instaladas pelo caminho legado de verificação do arquivo do pacote. As instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e dados de resumo do ClawPack para atualizações posteriores.
Instalações do ClawHub sem versão mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar versões mais novas do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

### Forma abreviada de marketplace

Use a forma abreviada `plugin@marketplace` quando o nome do marketplace existir no cache local de registros do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` para fornecer explicitamente a origem do marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Origens de marketplace">
    - um nome de marketplace conhecido pelo Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou um caminho para `marketplace.json`
    - uma forma abreviada de repositório do GitHub, como `owner/repo`
    - uma URL de repositório do GitHub, como `https://github.com/owner/repo`
    - uma URL Git

  </Tab>
  <Tab title="Regras de marketplaces remotos">
    Para marketplaces remotos carregados do GitHub ou do Git, as entradas de plugins devem permanecer dentro do repositório clonado do marketplace. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita origens de plugins HTTP(S), com caminho absoluto, Git, GitHub e outras origens que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude quando esse arquivo de manifesto está ausente)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Instalações locais gerenciadas devem ser diretórios de plugins ou arquivos compactados. Arquivos de plugin independentes `.js`,
`.mjs`, `.cjs` e `.ts` não são copiados para a raiz gerenciada de plugins
por `plugins install`, nem carregados quando colocados diretamente em
`~/.openclaw/extensions` ou `<workspace>/.openclaw/extensions`; essas
raízes descobertas automaticamente carregam diretórios de pacotes ou pacotes
de plugins e ignoram arquivos de script de nível superior como auxiliares locais.
Em vez disso, liste arquivos independentes explicitamente em `plugins.load.paths`.

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listar/informar/habilitar/desabilitar. Atualmente, há suporte para Skills de pacotes, Skills de comando do Claude, padrões do `settings.json` do Claude, padrões de `.lsp.json` do Claude e de `lspServers` declarados no manifesto, Skills de comando do Cursor e diretórios de hooks compatíveis do Codex; outros recursos de pacote detectados são mostrados nos diagnósticos/informações, mas ainda não estão conectados à execução no runtime.
</Note>

Use `-l`/`--link` para apontar para um diretório de plugin local sem copiá-lo (adiciona
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` não é compatível com `--force` (plugins vinculados apontam diretamente
para o caminho de origem, portanto não há nada para sobrescrever no local),
`--marketplace` ou instalações `git:`, e exige um caminho local que já exista.

<Note>
Plugins originados de um espaço de trabalho e descobertos na raiz de extensões
desse espaço de trabalho não são importados nem executados até serem explicitamente
habilitados. Para desenvolvimento local, execute
`openclaw plugins enable <plugin-id>` ou defina
`plugins.entries.<plugin-id>.enabled: true`; se sua configuração usar
`plugins.allow`, inclua também o mesmo id de plugin. Essa regra de bloqueio
por padrão também se aplica quando a configuração de um canal direciona
explicitamente um plugin originado do espaço de trabalho para carregamento
exclusivo de configuração, portanto o código de configuração do plugin de canal
local não será executado enquanto esse plugin do espaço de trabalho permanecer
desabilitado ou excluído da lista de permissões. Instalações vinculadas e entradas
explícitas de `plugins.load.paths` seguem a política normal para a origem resolvida
do plugin. Consulte
[Configurar a política de plugins](/pt-BR/tools/plugin#configure-plugin-policy)
e [Referência de configuração](/pt-BR/gateway/configuration-reference#plugins).

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice gerenciado de plugins, mantendo o comportamento padrão sem fixação.
</Note>

## Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Mostra apenas plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alterna da visualização em tabela para linhas de detalhes por plugin com metadados de formato/origem/procedência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos do registro e estado da instalação das dependências do pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com um fallback derivado somente do manifesto quando o registro está ausente ou é inválido. É útil para verificar se um plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sondagem em tempo real do runtime de um processo do Gateway que já está em execução. Após alterar o código do plugin, sua habilitação, a política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novos códigos `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o processo filho real `openclaw gateway run`, e não apenas um processo intermediário.

`plugins list --json` inclui o `dependencyStatus` de cada plugin com base em
`dependencies` e `optionalDependencies` do `package.json`. O OpenClaw verifica
se os nomes desses pacotes estão presentes ao longo do caminho normal de busca
de `node_modules` do Node para o plugin; ele não importa código de runtime do
plugin, não executa um gerenciador de pacotes nem repara dependências ausentes.
</Note>

Se a inicialização registrar `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
execute `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` com o id de um plugin listado para confirmar os
ids dos plugins e copie os ids confiáveis para `plugins.allow` em `openclaw.json`.
Quando o aviso puder listar todos os plugins descobertos, ele exibirá um trecho
de `plugins.allow` pronto para colar que já inclui esses ids. Se um plugin for
carregado sem procedência de instalação/caminho de carregamento, inspecione o id
desse plugin e, em seguida, fixe o id confiável em `plugins.allow` ou reinstale
o plugin de uma origem confiável para que o OpenClaw registre a procedência da
instalação.

Para trabalhar em plugins incluídos dentro de uma imagem Docker empacotada,
monte com bind o diretório de origem do plugin sobre o caminho de origem
empacotado correspondente, como `/app/extensions/synology-chat`. O OpenClaw
descobre essa sobreposição de origem montada antes de
`/app/dist/extensions/synology-chat`; um diretório de origem simplesmente
copiado permanece inativo, portanto instalações empacotadas normais continuam
usando o dist compilado.

Para depuração de hooks no runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra os hooks registrados e os diagnósticos de uma passagem de inspeção com o módulo carregado. A inspeção em tempo de execução nunca instala dependências; use `openclaw doctor --fix` para limpar o estado de dependências legadas ou recuperar plugins ausentes disponíveis para download que sejam referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma a URL/o perfil acessível do Gateway, indicações sobre serviço/processo, o caminho da configuração e a integridade do RPC.
- Hooks de conversa não integrados (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de plugins

Os metadados de instalação de plugins são um estado gerenciado pela máquina, não uma configuração do usuário. Instalações e atualizações os gravam no banco de dados de estado SQLite compartilhado, no diretório de estado ativo do OpenClaw. A linha `installed_plugin_index` armazena metadados duráveis de `installRecords`, incluindo registros de manifestos de plugins ausentes ou com problemas, além de um cache de registro frio derivado dos manifestos, usado por `openclaw plugins update`, pela desinstalação, pelos diagnósticos e pelo registro frio de plugins.

Quando o OpenClaw encontra registros legados distribuídos de `plugins.installs` na configuração, as leituras em tempo de execução os tratam como entrada de compatibilidade sem regravar `openclaw.json`. Gravações explícitas de plugins e `openclaw doctor --fix` movem esses registros para o índice de plugins e removem a chave da configuração quando gravações nela são permitidas; se qualquer uma das gravações falhar, os registros da configuração serão mantidos para que os metadados de instalação não sejam perdidos.

## Desinstalação

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` remove os registros do plugin de `plugins.entries`, do índice de plugins persistido, das entradas das listas de permissão/bloqueio de plugins e das entradas vinculadas de `plugins.load.paths`, quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciada rastreado, mas somente quando ele é resolvido dentro da raiz de extensões de plugins do OpenClaw. Se o plugin for atualmente o proprietário do slot `memory` ou `contextEngine`, esse slot será redefinido para seu valor padrão (`memory-core` para memória e `legacy` para o mecanismo de contexto).

`uninstall` exibe uma prévia do que será removido e, em seguida, solicita `Uninstall plugin "<id>"?` antes de fazer alterações. Passe `--force` para ignorar a solicitação de confirmação (útil para scripts e execuções não interativas); sem essa opção, a desinstalação exige um TTY interativo. `--dry-run` exibe a mesma prévia e encerra sem solicitar confirmação nem alterar nada.

<Note>
`--keep-config` é compatível como um alias obsoleto de `--keep-files`.
</Note>

## Atualização

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

As atualizações se aplicam às instalações de plugins rastreadas no índice gerenciado de plugins e às instalações rastreadas de pacotes de hooks em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução entre ID de plugin e especificação npm">
    Quando você passa um ID de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Durante `update <id> --dry-run`, instalações npm fixadas em versões exatas permanecem fixadas. Se o OpenClaw também conseguir resolver a linha padrão do registro do pacote e essa linha padrão for mais recente que a versão fixada instalada, a simulação informa a versão fixada e exibe o comando explícito de atualização do pacote com `@latest` para seguir a linha padrão do registro.

    Essa regra de atualização direcionada é diferente do caminho de manutenção em massa `openclaw plugins update --all`. As atualizações em massa ainda respeitam as especificações comuns de instalação rastreadas, mas registros confiáveis de plugins oficiais do OpenClaw podem ser sincronizados com o destino atual do catálogo oficial, em vez de permanecerem em um pacote oficial exato e desatualizado. Use a atualização direcionada `update <id>` quando quiser intencionalmente manter inalterada uma especificação oficial exata ou com tag.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve o nome desse pacote de volta para o registro do plugin rastreado, atualiza o plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em ID.

    Passar o nome do pacote npm sem uma versão ou tag também o resolve de volta para o registro do plugin rastreado. Use isso quando um plugin tiver sido fixado em uma versão exata e você quiser movê-lo de volta para a linha de versão padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update <id-or-npm-spec>` direcionado reutiliza a especificação de plugin rastreada, a menos que você passe uma nova especificação. `openclaw plugins update --all` em massa usa o `update.channel` configurado ao sincronizar registros confiáveis de plugins oficiais com o destino do catálogo oficial; assim, instalações do canal beta podem permanecer na linha de versões beta, em vez de serem normalizadas silenciosamente para a versão estável/mais recente.

    `openclaw update` também reconhece o canal de atualização ativo do OpenClaw: no canal beta, registros de plugins npm e ClawHub da linha padrão tentam primeiro `@beta`. Eles recorrem à especificação registrada padrão/mais recente se não houver uma versão beta do plugin; plugins npm também recorrem a ela quando o pacote beta existe, mas não passa na validação de instalação. Esse fallback é informado como um aviso e não faz a atualização do núcleo falhar. Versões exatas e tags explícitas permanecem fixadas nesse seletor para atualizações direcionadas.

  </Accordion>
  <Accordion title="Verificações de versão e divergência de integridade">
    Antes de uma atualização npm efetiva, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização será ignorada sem download, reinstalação ou regravação de `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como divergência de artefato npm. O comando interativo `openclaw plugins update` exibe os hashes esperado e real e solicita confirmação antes de continuar. Auxiliares de atualização não interativos interrompem de forma segura, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também é aceito em `plugins update` por compatibilidade, mas está obsoleto e não altera mais o comportamento da atualização de plugins. A `security.installPolicy` do operador ainda pode bloquear atualizações; hooks `before_install` de plugins só se aplicam a processos nos quais os hooks de plugins estejam carregados.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk na atualização">
    As atualizações de plugins da comunidade fornecidos pelo ClawHub executam a mesma verificação de confiança da versão exata usada nas instalações antes de baixar o pacote substituto. Use `--acknowledge-clawhub-risk` em automações revisadas que devam continuar quando a versão selecionada do ClawHub apresentar um aviso de confiança arriscado. Pacotes oficiais do ClawHub e fontes integradas de plugins do OpenClaw ignoram essa solicitação de confiança da versão.
  </Accordion>
</AccordionGroup>

## Inspeção

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

A inspeção mostra identidade, status de carregamento, origem, recursos do manifesto, sinalizadores de política, diagnósticos, metadados de instalação, recursos do pacote e qualquer suporte detectado a servidores MCP ou LSP, sem importar o tempo de execução do plugin por padrão. A saída JSON inclui os contratos do manifesto do plugin, como `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, para que os operadores possam auditar declarações de superfícies confiáveis antes de ativar ou reiniciar um plugin. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks, ferramentas, comandos, serviços, métodos do Gateway e rotas HTTP registrados. A inspeção em tempo de execução informa diretamente as dependências ausentes do plugin; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos da CLI pertencentes a plugins geralmente são instalados como grupos de comandos raiz de `openclaw`, mas os plugins também podem registrar comandos aninhados sob um grupo principal do núcleo, como `openclaw nodes`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o no caminho listado; por exemplo, um plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado pelo que realmente registra em tempo de execução:

| Formato             | Significado                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `plain-capability`  | exatamente um tipo de recurso (por exemplo, um plugin somente de provedor)     |
| `hybrid-capability` | mais de um tipo de recurso (por exemplo, texto + fala + imagens)                |
| `hook-only`         | somente hooks, sem recursos, ferramentas, comandos, serviços ou rotas          |
| `non-capability`    | ferramentas/comandos/serviços, mas sem recursos                                |

Consulte [Formatos de plugins](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de recursos.

<Note>
O sinalizador `--json` gera um relatório legível por máquina, adequado para scripts e auditorias. `inspect --all` renderiza uma tabela de toda a frota, com colunas de formato, tipos de recursos, avisos de compatibilidade, recursos do pacote e resumo de hooks. `info` é um alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` informa erros de carregamento de plugins, diagnósticos de manifesto/descoberta, avisos de compatibilidade e referências obsoletas na configuração de plugins, como slots de plugins ausentes. Quando a árvore de instalação e a configuração de plugins estão limpas, ele exibe `No plugin issues detected.` Se ainda houver configuração obsoleta, mas a árvore de instalação estiver íntegra, o resumo informa isso em vez de sugerir integridade completa dos plugins.

Se um plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do carregador, a validação da configuração manterá a entrada do plugin e a informará como `present but blocked`. Corrija o diagnóstico de plugin bloqueado apresentado anteriormente, como a propriedade do caminho ou permissões de gravação para todos, em vez de remover `plugins.entries.<id>` ou `plugins.allow` da configuração.

Para falhas no formato do módulo, como a ausência das exportações `register`/`activate`, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato das exportações na saída de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo de leitura frio persistido do OpenClaw para identidade de plugins instalados, ativação, metadados de origem e propriedade das contribuições. A inicialização normal, a consulta do proprietário do provedor, a classificação da configuração de canais e o inventário de plugins podem lê-lo sem importar módulos de tempo de execução de plugins.

Use `plugins registry` para verificar se o registro persistido está presente, atualizado ou obsoleto. Use `--refresh` para reconstruí-lo com base no índice de plugins persistido, na política de configuração e nos metadados de manifesto/pacote. Esse é um caminho de reparo, não um caminho de ativação em tempo de execução.

`openclaw doctor --fix` também corrige divergências de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado em um projeto npm de plugin gerenciado ou na raiz npm gerenciada plana legada sobrepuser um plugin integrado, o Doctor removerá esse pacote obsoleto e reconstruirá o registro para que a inicialização valide em relação ao manifesto integrado. O Doctor também recria o vínculo do pacote `openclaw` do host nos plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que importações locais ao pacote em tempo de execução, como `openclaw/plugin-sdk/*`, sejam resolvidas após atualizações ou reparos do npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é um recurso emergencial de compatibilidade obsoleto para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por variável de ambiente destina-se apenas à recuperação emergencial da inicialização enquanto a migração é implantada.
</Warning>

## Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` lista as entradas do feed configurado do marketplace do OpenClaw. Por padrão, ele tenta usar o feed hospedado e recorre ao snapshot aceito mais recente ou aos dados incluídos. Use `--feed-profile <name>` para ler um perfil configurado específico, `--feed-url <url>` para ler uma URL explícita de feed hospedado e `--offline` para ler o snapshot aceito mais recente sem buscar o feed.

`plugins marketplace refresh` atualiza o snapshot do feed hospedado configurado e informa se o OpenClaw aceitou dados hospedados, um snapshot hospedado ou dados alternativos incluídos. Use `--expected-sha256` quando o chamador precisar que o comando falhe, a menos que uma carga útil hospedada recente corresponda a uma soma de verificação fixada.

O comando `list` do marketplace aceita um caminho local do marketplace, um caminho para `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` exibe o rótulo da origem resolvida, além do manifesto do marketplace analisado e das entradas de plugins.

A atualização do marketplace carrega um feed hospedado do marketplace do OpenClaw e persiste a resposta validada como o snapshot local do feed hospedado. Sem opções, ela usa o perfil de feed padrão configurado. Use `--feed-profile <name>` para atualizar um perfil configurado específico, `--feed-url <url>` para atualizar uma URL explícita de feed hospedado, `--expected-sha256 <sha256>` para exigir uma soma de verificação correspondente da carga útil (`sha256:<hex>` ou um resumo hexadecimal simples de 64 caracteres) e `--json` para obter uma saída legível por máquina. URLs explícitas de feeds hospedados não devem incluir credenciais, strings de consulta nem fragmentos. Atualizações sem fixação podem informar um resultado de snapshot hospedado ou de dados alternativos incluídos sem causar falha no comando. Atualizações com fixação falham, a menos que aceitem uma carga útil hospedada recente, e atualizações hospedadas bem-sucedidas falham se o OpenClaw não conseguir persistir o snapshot validado.

## Relacionado

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [ClawHub](/clawhub)
