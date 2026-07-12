---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer criar a estrutura inicial ou validar um Plugin de ferramenta simples
    - Você quer depurar falhas no carregamento de plugins
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (inicializar, compilar, validar, listar, instalar, marketplace, desinstalar, habilitar/desabilitar, diagnosticar)
title: Plugins
x-i18n:
    generated_at: "2026-07-12T15:05:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre instalação, ativação e solução de problemas de plugins.
  </Card>
  <Card title="Gerenciar plugins" href="/pt-BR/plugins/manage-plugins">
    Exemplos rápidos de instalação, listagem, atualização, desinstalação e publicação.
  </Card>
  <Card title="Bundles de plugins" href="/pt-BR/plugins/bundles">
    Modelo de compatibilidade de bundles.
  </Card>
  <Card title="Manifesto de plugin" href="/pt-BR/plugins/manifest">
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
openclaw plugins info <id>                    # alias de inspect
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
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O rastreamento grava os tempos das fases
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` é imutável. `install`, `update`, `uninstall`, `enable` e `disable` se recusam a executar. Em vez disso, edite a fonte Nix desta instalação (`programs.openclaw.config` ou `instances.<name>.config` para nix-openclaw) e então reconstrua. Consulte o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
</Note>

<Note>
Os plugins incluídos são distribuídos com o OpenClaw. Alguns são ativados por padrão (por exemplo, provedores de modelos incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw fornecem `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`), além dos recursos detectados do bundle.
</Note>

## Criação

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Por padrão, `plugins init` cria um plugin de ferramenta mínimo em TypeScript. O primeiro
argumento é o id do plugin; `--name` define o nome de exibição. O OpenClaw usa o
id para o diretório de saída padrão e a nomenclatura do pacote. Os modelos de ferramenta usam
`defineToolPlugin` e geram os scripts `plugin:build` e
`plugin:validate` em `package.json`, que compilam e depois chamam `openclaw plugins build`/`validate`.

`plugins build` importa o ponto de entrada compilado, lê os metadados estáticos da ferramenta, grava
`openclaw.plugin.json` e mantém `openclaw.extensions` de `package.json` alinhado.
`plugins validate` verifica se o manifesto gerado, os metadados do pacote e
a exportação atual do ponto de entrada continuam consistentes. Consulte [Plugins de ferramentas](/pt-BR/plugins/tool-plugins) para
conhecer o fluxo de criação completo.

O modelo grava o código-fonte TypeScript, mas gera metadados a partir do ponto de entrada compilado
`./dist/index.js`; portanto, o fluxo também funciona com a CLI publicada. Use
`--entry <path>` quando o ponto de entrada não for o padrão do pacote. Use
`plugins build --check` na CI para falhar quando os metadados gerados estiverem desatualizados, sem
reescrever arquivos.

### Modelo de provedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Os modelos de provedor criam um plugin genérico de provedor de modelos compatível com OpenAI,
com suporte à autenticação por chave de API, um script `npm run validate` que executa
`clawhub package validate`, metadados de pacote do ClawHub e um fluxo de trabalho do
GitHub Actions acionado manualmente para futura publicação confiável por meio do GitHub
OIDC. Os modelos de provedor não geram skills e não usam
`openclaw plugins build`/`validate`; esses comandos se destinam ao caminho de metadados
gerados do modelo de ferramenta.

Antes da publicação, substitua a URL-base de API provisória, o catálogo de modelos, a rota
da documentação, o texto das credenciais e o conteúdo do README por detalhes reais do provedor. Use o
README gerado para a primeira publicação no ClawHub e para configurar o publicador confiável.

## Instalação

```bash
openclaw plugins search "calendar"                      # pesquisa plugins no ClawHub
openclaw plugins install <package>                       # detecção automática da origem
openclaw plugins install clawhub:<package>                # somente ClawHub
openclaw plugins install npm:<package>                    # somente npm
openclaw plugins install npm-pack:<path.tgz>               # tarball npm-pack local
openclaw plugins install git:github.com/<owner>/<repo>     # repositório git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # caminho ou arquivo local
openclaw plugins install -l <path>                         # vincula em vez de copiar
openclaw plugins install <plugin>@<marketplace>             # forma abreviada do marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explícito)
openclaw plugins install <package> --force                  # sobrescreve a instalação existente
openclaw plugins install <package> --pin                    # fixa a versão npm resolvida
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Os mantenedores que testam instalações durante a configuração podem substituir as origens
automáticas de instalação de plugins por variáveis de ambiente protegidas. Consulte
[Substituições de instalação de plugins](/pt-BR/plugins/install-overrides).

<Warning>
Por padrão, nomes de pacote simples são instalados do npm durante a transição de lançamento, a menos que correspondam ao id de um plugin incluído ou oficial; nesse caso, o OpenClaw usa essa cópia local/oficial em vez de acessar o registro npm. Use `npm:<package>` quando quiser deliberadamente um pacote npm externo. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código; prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes `code-plugin` e
`bundle-plugin` instaláveis (não skills; para elas, use `openclaw skills search`).
O valor padrão de `--limit` é 20, limitado a 100. Ele apenas lê o catálogo remoto: não há
inspeção do estado local, alteração de configuração, instalação de pacote nem carregamento do
runtime do plugin. Os resultados incluem o nome do pacote no ClawHub, a família, o canal, a versão,
o resumo e uma sugestão de instalação, como `openclaw plugins install clawhub:<package>`.

<Note>
O ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo uma alternativa compatível e um caminho de instalação direta. Os pacotes de plugins
`@openclaw/*` mantidos pelo OpenClaw voltaram a ser publicados no npm; consulte a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou o
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando disponível,
recorrendo a `latest` caso contrário. No canal estável estendido, plugins npm oficiais
com intenção simples/padrão ou `latest` são resolvidos para a versão exata do núcleo
instalado. Fixações exatas e tags explícitas diferentes de `latest`, pacotes de terceiros e
origens que não sejam npm não são reescritos.
</Note>

<AccordionGroup>
  <Accordion title="Inclusões de configuração e reparo de configuração inválida">
    Se a seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava diretamente nesse arquivo incluído e deixa `openclaw.json` intacto. Inclusões na raiz, arrays de inclusões e inclusões com substituições irmãs falham de forma segura em vez de serem nivelados. Consulte [Inclusões de configuração](/pt-BR/gateway/configuration) para conhecer os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha de forma segura e orienta você a executar primeiro `openclaw doctor --fix`. Durante a inicialização e o recarregamento dinâmico do Gateway, uma configuração de plugin inválida falha de forma segura, como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar a entrada de plugin inválida em quarentena. A única exceção documentada durante a instalação é um caminho restrito de recuperação de plugins incluídos para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação versus atualização">
    `--force` reutiliza o destino de instalação existente e sobrescreve no mesmo local um plugin ou pacote de hooks já instalado. Use-o ao reinstalar intencionalmente o mesmo id por meio de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para atualizações rotineiras de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já esteja instalado, o OpenClaw interromperá a operação e indicará `plugins update <id-or-npm-spec>` para uma atualização normal ou `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual por meio de uma origem diferente. `--force` não é compatível com `--link`.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica somente a instalações npm e registra o `<name>@<version>` exato resolvido. Ele não é compatível com instalações `git:` (em vez disso, fixe a ref na especificação, por exemplo, `git:github.com/acme/plugin@v1.2.3`) nem com `--marketplace` (instalações do marketplace persistem metadados da origem do marketplace em vez de uma especificação npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto e agora não realiza nenhuma operação. O OpenClaw não executa mais o bloqueio integrado de código perigoso durante instalações de plugins.

    Use a superfície `security.installPolicy`, controlada pelo operador, quando uma política de instalação específica do host for necessária. Hooks `before_install` de plugins são hooks do ciclo de vida do runtime do plugin, e não o principal limite de política para instalações pela CLI.

    Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma verificação do registro, siga as etapas para publicadores em [Publicação no ClawHub](/pt-BR/clawhub/publishing). `--dangerously-force-unsafe-install` não solicita que o ClawHub verifique novamente o plugin nem torne pública uma versão bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalações da comunidade no ClawHub verificam o registro de confiança da versão selecionada antes do download. Se o ClawHub desativar o download da versão, relatar descobertas maliciosas na verificação ou colocar a versão em um estado de moderação bloqueador (em quarentena, revogada), o OpenClaw a recusará de forma definitiva, independentemente dessa flag. Para status de verificação arriscados ou estados de moderação não bloqueadores, o OpenClaw mostra os detalhes de confiança e solicita confirmação antes de continuar.

    Use `--acknowledge-clawhub-risk` somente depois de analisar o aviso do ClawHub e decidir continuar sem uma solicitação interativa. Resultados de verificação pendentes ou desatualizados (ainda não considerados limpos) geram um aviso, mas não exigem confirmação. Pacotes oficiais do ClawHub e origens de plugins incluídos do OpenClaw ignoram completamente essa verificação de confiança da versão.

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para obter visibilidade filtrada dos hooks e ativá-los individualmente, não para instalar pacotes.

    As especificações npm são **exclusivas do registro** (nome do pacote mais uma **versão exata** ou **dist-tag** opcional). Especificações Git/URL/arquivo e intervalos semver são rejeitados. As instalações de dependências são executadas em um projeto npm gerenciado por plugin com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação do npm. Os projetos npm gerenciados dos plugins herdam os `overrides` do npm no nível de pacote do OpenClaw, portanto as versões de segurança fixadas pelo host também se aplicam às dependências elevadas dos plugins.

    Use `npm:<package>` para tornar explícita a resolução pelo npm. Especificações de pacote simples também são instaladas diretamente do npm durante a transição de lançamento, a menos que correspondam ao id de um plugin oficial.

    Especificações `@openclaw/*` brutas que correspondem a plugins incluídos resolvem para a cópia incluída pertencente à imagem antes de recorrer ao npm. Por exemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa o plugin Discord incluído da compilação atual do OpenClaw em vez de criar uma substituição npm gerenciada. Para forçar o pacote npm externo, use `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Especificações simples e `@latest` permanecem no canal estável. Versões de correção do OpenClaw com data, como `2026.5.3-1`, contam como estáveis nessa verificação. Se o npm resolver qualquer uma dessas formas para uma pré-versão, o OpenClaw interromperá a operação e solicitará que você aceite explicitamente usando uma tag de pré-versão (`@beta`/`@rc`) ou uma versão prévia exata (`@1.2.3-beta.4`).

    Para instalações npm sem uma versão exata (`npm:<package>` ou `npm:<package>@latest`), o OpenClaw verifica os metadados do pacote resolvido antes da instalação. Se o pacote estável mais recente exigir uma API de plugin do OpenClaw mais nova ou uma versão mínima do host superior, o OpenClaw examina versões estáveis anteriores e instala a versão compatível mais recente. Versões exatas e dist-tags explícitas permanecem estritas: uma seleção incompatível falha e solicita que você atualize o OpenClaw ou escolha uma versão compatível.

    Se uma especificação de instalação simples corresponder ao id de um plugin oficial (por exemplo, `diffs`), o OpenClaw instalará diretamente a entrada do catálogo. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório Git. Formas compatíveis: `git:github.com/owner/repo`, `git:owner/repo`, URLs de clonagem completas `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    As instalações via Git clonam para um diretório temporário, fazem checkout da referência solicitada quando presente e, em seguida, usam o instalador normal de diretórios de plugins; assim, a validação do manifesto, a política de instalação do operador, o trabalho de instalação do gerenciador de pacotes e os registros de instalação se comportam como nas instalações npm. As instalações Git registradas incluem a URL/referência de origem e o commit resolvido, para que `openclaw plugins update` possa resolver novamente a origem mais tarde.

    Após instalar via Git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos do Gateway e comandos da CLI. Se o plugin tiver registrado uma raiz da CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos compactados">
    Arquivos compactados compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos compactados de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contenham apenas `package.json` são rejeitados antes que o OpenClaw grave os registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    o mesmo caminho de projeto npm gerenciado por plugin usado pelas instalações do registro,
    incluindo a verificação de `package-lock.json`, a varredura de dependências elevadas
    e os registros de instalação do npm. Caminhos simples de arquivos compactados ainda são instalados como
    arquivos locais sob a raiz de extensões de plugins.

    Instalações do marketplace do Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

As instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações simples de plugins seguras para npm são instaladas do npm por padrão durante a transição de lançamento, a menos que correspondam ao id de um plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução exclusiva pelo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a compatibilidade anunciada da API do plugin/versão mínima do Gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` npm-pack versionado, verifica o cabeçalho de resumo do ClawHub e o resumo do artefato e, em seguida, instala-o pelo caminho normal de arquivos compactados. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivos de pacote. As instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e dados de resumo do ClawPack para atualizações futuras.
Instalações do ClawHub sem versão mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar versões mais recentes do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

### Forma abreviada de marketplace

Use a forma abreviada `plugin@marketplace` quando o nome do marketplace existir no cache de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` para informar explicitamente a origem do marketplace:

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
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou via Git, as entradas de plugins devem permanecer dentro do repositório clonado do marketplace. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita origens de plugins HTTP(S), de caminho absoluto, Git, GitHub e outras que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude quando esse arquivo de manifesto não está presente)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

As instalações locais gerenciadas devem ser diretórios de plugins ou arquivos compactados. Arquivos de plugin independentes `.js`,
`.mjs`, `.cjs` e `.ts` não são copiados para a raiz gerenciada de plugins por
`plugins install`, nem carregados quando colocados diretamente em
`~/.openclaw/extensions` ou `<workspace>/.openclaw/extensions`; essas
raízes descobertas automaticamente carregam diretórios de pacotes ou conjuntos de plugins e ignoram
arquivos de script no nível superior como auxiliares locais. Liste arquivos independentes explicitamente em
`plugins.load.paths`.

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listar/informações/ativar/desativar. Atualmente, há suporte para Skills de pacotes, Skills de comandos do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude/de `lspServers` declarados no manifesto, Skills de comandos do Cursor e diretórios de hooks compatíveis com Codex; outros recursos de pacotes detectados são mostrados nos diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
</Note>

Use `-l`/`--link` para apontar para um diretório local de plugin sem copiá-lo (adiciona
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` não é compatível com `--force` (plugins vinculados apontam diretamente para o caminho
de origem, portanto não há nada para sobrescrever no local), `--marketplace` ou
instalações `git:`, e exige um caminho local que já exista.

<Note>
Plugins com origem no workspace descobertos em uma raiz de extensões do workspace não são
importados nem executados até serem explicitamente ativados. Para desenvolvimento local,
execute `openclaw plugins enable <plugin-id>` ou defina
`plugins.entries.<plugin-id>.enabled: true`; se sua configuração usar
`plugins.allow`, inclua também o mesmo id de plugin. Essa regra de negação por padrão
também se aplica quando a configuração do canal direciona explicitamente um plugin originado no workspace para
carregamento apenas de configuração, portanto o código de configuração do plugin de canal local não será executado enquanto esse
plugin do workspace permanecer desativado ou excluído da lista de permissões. Instalações vinculadas
e entradas explícitas de `plugins.load.paths` seguem a política normal para sua
origem de plugin resolvida. Consulte
[Configurar a política de plugins](/pt-BR/tools/plugin#configure-plugin-policy)
e a [Referência de configuração](/pt-BR/gateway/configuration-reference#plugins).

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice gerenciado de plugins, mantendo o comportamento padrão sem fixação.
</Note>

## Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Mostra apenas os plugins ativados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alterna da visualização em tabela para linhas de detalhes por plugin, com metadados de formato/origem/procedência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos do registro e estado da instalação das dependências do pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com uma alternativa derivada somente do manifesto quando o registro está ausente ou é inválido. Isso é útil para verificar se um plugin está instalado, ativado e visível para o planejamento de inicialização a frio, mas não é uma sondagem de runtime ao vivo de um processo do Gateway já em execução. Após alterar o código do plugin, a ativação, a política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novos códigos `register(api)` ou hooks sejam executados. Para implantações remotas/em contêineres, verifique se você está reiniciando o processo filho `openclaw gateway run` real, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada plugin obtido de `dependencies`
e `optionalDependencies` no `package.json`. O OpenClaw verifica se esses nomes de pacotes
estão presentes no caminho normal de pesquisa `node_modules` do Node para o plugin; ele
não importa código de runtime do plugin, não executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

Se a inicialização registrar `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
execute `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` com um id de plugin listado para confirmar os ids dos
plugins e copiar ids confiáveis para `plugins.allow` em `openclaw.json`. Quando o
aviso puder listar todos os plugins descobertos, ele imprimirá um trecho de
`plugins.allow` pronto para colar que já inclui esses ids. Se um plugin for carregado
sem procedência de instalação/caminho de carregamento, inspecione esse id de plugin e, em seguida, fixe
o id confiável em `plugins.allow` ou reinstale o plugin de uma origem confiável
para que o OpenClaw registre a procedência da instalação.

Para trabalhar em um plugin incluído dentro de uma imagem Docker empacotada, monte via bind o diretório
de origem do plugin sobre o caminho de origem empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobre essa sobreposição de origem montada
antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado
permanece inerte, portanto as instalações empacotadas normais continuam usando o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com o módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar o estado de dependências legadas ou recuperar plugins ausentes disponíveis para download que sejam referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma a URL/o perfil acessível do Gateway, indicações de serviço/processo, o caminho da configuração e a integridade do RPC.
- Hooks de conversa não incluídos no pacote (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de plugins

Os metadados de instalação de plugins são um estado gerenciado pela máquina, não uma configuração do usuário. Instalações e atualizações os gravam no banco de dados de estado SQLite compartilhado, no diretório de estado ativo do OpenClaw. A linha `installed_plugin_index` armazena metadados duráveis de `installRecords`, incluindo registros de manifestos de plugins corrompidos ou ausentes, além de um cache de registro frio derivado dos manifestos, usado por `openclaw plugins update`, pela desinstalação, pelos diagnósticos e pelo registro frio de plugins.

Quando o OpenClaw encontra registros legados distribuídos de `plugins.installs` na configuração, as leituras de runtime os tratam como entrada de compatibilidade sem regravar `openclaw.json`. Gravações explícitas de plugins e `openclaw doctor --fix` movem esses registros para o índice de plugins e removem a chave da configuração quando gravações na configuração são permitidas; se qualquer uma das gravações falhar, os registros da configuração serão mantidos para que os metadados de instalação não sejam perdidos.

## Desinstalação

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` remove os registros do plugin de `plugins.entries`, do índice persistido de plugins, das entradas das listas de permissão/bloqueio de plugins e das entradas vinculadas de `plugins.load.paths`, quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado que está sendo rastreado, mas somente quando ele é resolvido dentro da raiz de extensões de plugins do OpenClaw. Se o plugin for atualmente o proprietário do slot `memory` ou `contextEngine`, esse slot será redefinido para o padrão (`memory-core` para memória, `legacy` para o mecanismo de contexto).

`uninstall` exibe uma prévia do que será removido e solicita `Uninstall plugin "<id>"?` antes de fazer alterações. Passe `--force` para ignorar a solicitação de confirmação (útil para scripts e execuções não interativas); sem essa opção, a desinstalação exige um TTY interativo. `--dry-run` exibe a mesma prévia e sai sem solicitar confirmação nem alterar nada.

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

As atualizações são aplicadas às instalações de plugins rastreadas no índice gerenciado de plugins e às instalações de pacotes de hooks rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução do ID do plugin em comparação com a especificação npm">
    Quando você passa o ID de um plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Durante `update <id> --dry-run`, instalações npm fixadas em versões exatas permanecem fixadas. Se o OpenClaw também conseguir resolver a linha padrão do registro do pacote e essa linha padrão for mais recente que a versão fixada instalada, a simulação informará a fixação e exibirá o comando explícito de atualização do pacote para `@latest`, para acompanhar a linha padrão do registro.

    Essa regra de atualização direcionada difere do caminho de manutenção em massa `openclaw plugins update --all`. As atualizações em massa ainda respeitam as especificações de instalação rastreadas comuns, mas registros confiáveis de plugins oficiais do OpenClaw podem ser sincronizados com o destino atual do catálogo oficial, em vez de permanecerem em um pacote oficial exato e desatualizado. Use a atualização direcionada `update <id>` quando quiser manter intencionalmente uma especificação oficial exata ou com tag sem alterações.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve o nome desse pacote de volta para o registro rastreado do plugin, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas no ID.

    Passar o nome do pacote npm sem uma versão ou tag também o resolve de volta para o registro rastreado do plugin. Use isso quando um plugin tiver sido fixado em uma versão exata e você quiser movê-lo novamente para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    O comando direcionado `openclaw plugins update <id-or-npm-spec>` reutiliza a especificação rastreada do plugin, a menos que você passe uma nova especificação. O comando em massa `openclaw plugins update --all` usa o `update.channel` configurado quando sincroniza registros confiáveis de plugins oficiais com o destino do catálogo oficial, para que instalações do canal beta possam permanecer na linha de lançamento beta, em vez de serem normalizadas silenciosamente para stable/latest.

    `openclaw update` também conhece o canal de atualização ativo do OpenClaw: no canal beta, os registros de plugins npm e ClawHub da linha padrão tentam `@beta` primeiro. Eles recorrem à especificação padrão/latest registrada se não houver uma versão beta do plugin; plugins npm também recorrem a ela quando o pacote beta existe, mas falha na validação da instalação. Esse fallback é relatado como um aviso e não causa falha na atualização do núcleo. Versões exatas e tags explícitas permanecem fixadas nesse seletor para atualizações direcionadas.

  </Accordion>
  <Accordion title="Verificações de versão e divergência de integridade">
    Antes de uma atualização npm real, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrado já corresponderem ao destino resolvido, a atualização será ignorada sem baixar, reinstalar ou regravar `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como divergência do artefato npm. O comando interativo `openclaw plugins update` exibe os hashes esperado e real e solicita confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma segura, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também é aceito em `plugins update` por compatibilidade, mas está obsoleto e não altera mais o comportamento de atualização de plugins. A `security.installPolicy` do operador ainda pode bloquear atualizações; hooks `before_install` de plugins se aplicam somente a processos em que os hooks de plugins estão carregados.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk na atualização">
    As atualizações de plugins da comunidade provenientes do ClawHub executam a mesma verificação de confiança da versão exata usada nas instalações antes de baixar o pacote substituto. Use `--acknowledge-clawhub-risk` para automações revisadas que devam continuar quando a versão selecionada do ClawHub tiver um aviso de confiança arriscado. Pacotes oficiais do ClawHub e fontes de plugins incluídas no pacote do OpenClaw ignoram essa solicitação de confiança da versão.
  </Accordion>
</AccordionGroup>

## Inspeção

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

A inspeção mostra identidade, status de carregamento, origem, recursos do manifesto, sinalizadores de política, diagnósticos, metadados de instalação, recursos do pacote e qualquer compatibilidade detectada com servidores MCP ou LSP, sem importar o runtime do plugin por padrão. A saída JSON inclui os contratos do manifesto do plugin, como `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, para que operadores possam auditar declarações de superfícies confiáveis antes de habilitar ou reiniciar um plugin. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks, ferramentas, comandos, serviços, métodos do Gateway e rotas HTTP registrados. A inspeção de runtime relata diretamente dependências ausentes de plugins; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos da CLI pertencentes a plugins geralmente são instalados como grupos de comandos raiz de `openclaw`, mas os plugins também podem registrar comandos aninhados sob um pai do núcleo, como `openclaw nodes`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o no caminho listado; por exemplo, um plugin que registre `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado de acordo com o que realmente registra no runtime:

| Formato               | Significado                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `plain-capability`    | exatamente um tipo de recurso (por exemplo, um plugin somente de provedor)        |
| `hybrid-capability`   | mais de um tipo de recurso (por exemplo, texto + fala + imagens)                   |
| `hook-only`           | somente hooks, sem recursos, ferramentas, comandos, serviços ou rotas             |
| `non-capability`      | ferramentas/comandos/serviços, mas sem recursos                                   |

Consulte [Formatos de plugins](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de recursos.

<Note>
O sinalizador `--json` gera um relatório legível por máquina, adequado para scripts e auditorias. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de recursos, avisos de compatibilidade, recursos do pacote e resumo de hooks. `info` é um alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta, avisos de compatibilidade e referências obsoletas da configuração de plugins, como slots de plugins ausentes. Quando a árvore de instalação e a configuração de plugins estão limpas, ele exibe `No plugin issues detected.`. Se ainda houver configuração obsoleta, mas a árvore de instalação estiver íntegra, o resumo informará isso em vez de sugerir integridade total dos plugins.

Se um plugin configurado estiver presente no disco, mas for bloqueado pelas verificações de segurança de caminho do carregador, a validação da configuração manterá a entrada do plugin e o relatará como `present but blocked`. Corrija o diagnóstico anterior do plugin bloqueado, como a propriedade do caminho ou permissões de gravação para todos, em vez de remover `plugins.entries.<id>` ou `plugins.allow` da configuração.

Para falhas de formato de módulo, como exportações `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato das exportações na saída de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo de leitura frio persistido do OpenClaw para identidade, habilitação, metadados de origem e propriedade das contribuições dos plugins instalados. A inicialização normal, a pesquisa do proprietário do provedor, a classificação da configuração de canais e o inventário de plugins podem lê-lo sem importar os módulos de runtime dos plugins.

Use `plugins registry` para verificar se o registro persistido está presente, atualizado ou obsoleto. Use `--refresh` para recriá-lo a partir do índice persistido de plugins, da política de configuração e dos metadados de manifesto/pacote. Esse é um caminho de reparo, não um caminho de ativação de runtime.

`openclaw doctor --fix` também corrige divergências de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado em um projeto npm gerenciado de plugins ou na raiz plana legada do npm gerenciado ocultar um plugin incluído no pacote, o Doctor removerá esse pacote obsoleto e recriará o registro para que a inicialização valide usando o manifesto incluído no pacote. O Doctor também vincula novamente o pacote `openclaw` do host a plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que importações locais de runtime do pacote, como `openclaw/plugin-sdk/*`, sejam resolvidas após atualizações ou reparos do npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma opção de compatibilidade emergencial obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback de ambiente destina-se apenas à recuperação emergencial da inicialização enquanto a migração é implantada.
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

`plugins marketplace entries` lista as entradas do feed de marketplace configurado do OpenClaw. Por padrão, ele tenta usar o feed hospedado e recorre ao snapshot aceito mais recente ou aos dados incluídos como fallback. Use `--feed-profile <name>` para ler um perfil configurado específico, `--feed-url <url>` para ler uma URL explícita de feed hospedado e `--offline` para ler o snapshot aceito mais recente sem buscar o feed.

`plugins marketplace refresh` atualiza o snapshot do feed hospedado configurado e informa se o OpenClaw aceitou dados hospedados, um snapshot hospedado ou dados incluídos como fallback. Use `--expected-sha256` quando um chamador precisar que o comando falhe, a menos que uma carga útil hospedada recém-obtida corresponda a uma soma de verificação fixada.

O comando `list` do marketplace aceita um caminho de marketplace local, um caminho de `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` exibe o rótulo da fonte resolvida, além do manifesto de marketplace analisado e das entradas de plugins.

A atualização do marketplace carrega um feed de marketplace hospedado do OpenClaw e persiste a
resposta validada como o snapshot local do feed hospedado. Sem opções, ela usa
o perfil de feed padrão configurado. Use `--feed-profile <name>` para atualizar
um perfil configurado específico, `--feed-url <url>` para atualizar uma URL
explícita de feed hospedado, `--expected-sha256 <sha256>` para exigir uma soma
de verificação correspondente da carga útil (`sha256:<hex>` ou um resumo
hexadecimal simples de 64 caracteres) e `--json` para uma saída legível por
máquina. URLs explícitas de feeds hospedados não devem incluir
credenciais, strings de consulta ou fragmentos. Atualizações sem fixação podem informar um
snapshot hospedado ou um resultado de fallback incluído sem causar falha no comando. Atualizações
com fixação falham, a menos que aceitem uma carga útil hospedada recém-obtida, e atualizações hospedadas
bem-sucedidas falham se o OpenClaw não conseguir persistir o snapshot validado.

## Relacionado

- [Como criar plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [ClawHub](/pt-BR/clawhub)
