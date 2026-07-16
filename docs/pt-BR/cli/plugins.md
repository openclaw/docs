---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer criar a estrutura básica ou validar um Plugin de ferramenta simples
    - Você quer depurar falhas no carregamento de plugins
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (inicializar, compilar, validar, listar, instalar, marketplace, desinstalar, habilitar/desabilitar, diagnosticar)
title: Plugins
x-i18n:
    generated_at: "2026-07-16T12:21:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/pt-BR/tools/plugin">
    Guia do usuário final para instalar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Gerenciar plugins" href="/pt-BR/plugins/manage-plugins">
    Exemplos rápidos para instalação, listagem, atualização, desinstalação e publicação.
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
no stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` é imutável. `install`, `update`, `uninstall`, `enable` e `disable` se recusam a executar. Em vez disso, edite a fonte Nix desta instalação (`programs.openclaw.config` ou `instances.<name>.config` para nix-openclaw) e recompile. Consulte o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
</Note>

<Note>
Os plugins incluídos são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelos incluídos, provedores de voz incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Os plugins nativos do OpenClaw fornecem `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`), além dos recursos detectados do bundle.
</Note>

## Criação

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` cria um plugin de ferramenta TypeScript mínimo por padrão. O primeiro
argumento é o id do plugin; `--name` define o nome de exibição. O OpenClaw usa o
id para o diretório de saída padrão e a nomenclatura do pacote. Os modelos de ferramenta usam
`defineToolPlugin` e geram scripts `package.json` `plugin:build` e
`plugin:validate`, que compilam e depois chamam `openclaw plugins build`/`validate`.

`plugins build` importa o ponto de entrada compilado, lê os metadados estáticos da ferramenta, grava
`openclaw.plugin.json` e mantém o `openclaw.extensions` de `package.json` alinhado.
`plugins validate` verifica se o manifesto gerado, os metadados do pacote e a
exportação atual do ponto de entrada ainda correspondem. Consulte [Plugins de ferramentas](/pt-BR/plugins/tool-plugins) para
ver o fluxo de criação completo.

O modelo grava o código-fonte TypeScript, mas gera metadados a partir do ponto de entrada
`./dist/index.js` compilado, portanto o fluxo também funciona com a CLI publicada. Use
`--entry <path>` quando o ponto de entrada não for o ponto de entrada padrão do pacote. Use
`plugins build --check` na CI para falhar quando os metadados gerados estiverem desatualizados sem
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
com infraestrutura de autenticação por chave de API, um script `npm run validate` que executa
`clawhub package validate`, metadados de pacote do ClawHub e um fluxo de trabalho do GitHub Actions
acionado manualmente para futura publicação confiável via OIDC do GitHub. Os modelos de provedor
não geram Skills nem usam `openclaw plugins build`/`validate`; esses comandos são destinados
ao caminho de metadados gerados do modelo de ferramenta.

Antes de publicar, substitua a URL-base de API provisória, o catálogo de modelos, a rota da
documentação, o texto das credenciais e o conteúdo do README por detalhes reais do provedor. Use o
README gerado para a primeira publicação no ClawHub e para configurar o publicador confiável.

## Instalação

```bash
openclaw plugins search "calendar"                      # pesquisa plugins no ClawHub
openclaw plugins install @openclaw/<package>            # catálogo oficial confiável
openclaw plugins install <package>                       # pacote npm arbitrário
openclaw plugins install clawhub:<package>                # somente ClawHub
openclaw plugins install npm:<package>                    # somente npm
openclaw plugins install npm-pack:<path.tgz>               # tarball npm-pack local
openclaw plugins install git:github.com/<owner>/<repo>     # repositório git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # caminho ou arquivo local
openclaw plugins install -l <path>                         # vincula em vez de copiar
openclaw plugins install <plugin>@<marketplace>             # forma abreviada do marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explícito)
openclaw plugins install <package> --force                  # confirma a origem / sobrescreve o existente
openclaw plugins install <package> --pin                    # fixa a versão npm resolvida
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Os mantenedores que testam instalações durante a configuração podem substituir as origens
automáticas de instalação de plugins por variáveis de ambiente protegidas. Consulte
[Substituições de instalação de plugins](/pt-BR/plugins/install-overrides).

<Warning>
Durante a transição de lançamento, nomes simples de pacotes são instalados do npm por padrão, a menos que correspondam ao id de um plugin incluído ou oficial; nesse caso, o OpenClaw usa essa cópia local/oficial em vez de acessar o registro npm. Use `npm:<package>` quando quiser deliberadamente um pacote npm externo. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código; prefira versões fixadas.
</Warning>

<Warning>
Os pacotes do ClawHub e o catálogo incluído/oficial do OpenClaw são origens de instalação
confiáveis. Uma nova origem arbitrária de npm, `npm-pack:`, git, caminho/arquivo local ou
marketplace exibe um aviso e solicita confirmação antes de continuar. Instalações arbitrárias
não interativas devem fornecer `--force` depois que a origem for analisada e considerada confiável. A mesma
opção sobrescreve um destino de instalação existente quando necessário. Atualizações normais de uma
instalação já rastreada não exigem essa opção. Essa confirmação é separada de
`--acknowledge-clawhub-risk`, que se aplica somente a avisos de confiança em versões arriscadas do
ClawHub. `--force` não ignora `security.installPolicy` nem as verificações de
segurança de instalação restantes.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes `code-plugin` e
`bundle-plugin` instaláveis (não Skills; use `openclaw skills search` para elas).
O `--limit` padrão é 20, limitado a 100. Ele apenas lê o catálogo remoto: não há
inspeção do estado local, alteração de configuração, instalação de pacote nem carregamento do
runtime do plugin. Os resultados incluem o nome do pacote no ClawHub, a família, o canal, a versão,
o resumo e uma sugestão de instalação como `openclaw plugins install clawhub:<package>`.

<Note>
O ClawHub é a principal plataforma de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo uma alternativa compatível e um caminho de instalação direta. Os pacotes de plugins
`@openclaw/*` pertencentes ao OpenClaw voltaram a ser publicados no npm; consulte a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou o
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando disponível,
recorrendo a `latest` caso contrário. No canal estável estendido, plugins npm oficiais
com intenção simples/padrão ou `latest` são resolvidos para a versão exata instalada do núcleo.
Versões exatas fixadas e tags explícitas diferentes de `latest`, pacotes de terceiros e
origens que não sejam npm não são reescritos.
</Note>

<AccordionGroup>
  <Accordion title="Inclusões de configuração e reparo de configuração inválida">
    Se a seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava diretamente nesse arquivo incluído e deixa `openclaw.json` intacto. Inclusões na raiz, arrays de inclusões e inclusões com substituições no mesmo nível falham de forma segura em vez de serem nivelados. Consulte [Inclusões de configuração](/pt-BR/gateway/configuration) para ver os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha de forma segura e orienta a executar primeiro `openclaw doctor --fix`. Durante a inicialização e o recarregamento dinâmico do Gateway, uma configuração de plugin inválida falha de forma segura como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar em quarentena a entrada de plugin inválida. A única exceção documentada durante a instalação é um caminho restrito de recuperação de plugins incluídos para plugins que aderem explicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Confirmação com --force e reinstalação versus atualização">
    `--force` confirma uma origem que não seja do ClawHub sem solicitar confirmação. Ele não ignora `security.installPolicy` nem as verificações de segurança de instalação restantes. Quando o plugin ou pacote de hooks já está instalado, ele também reutiliza o destino existente e o sobrescreve no local. Use-o após analisar uma origem arbitrária de npm, local, arquivo, git ou marketplace, ou ao reinstalar intencionalmente o mesmo id. Para atualizações rotineiras de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se `plugins install` for executado para o id de um plugin que já está instalado, o OpenClaw interrompe a operação e indica `plugins update <id-or-npm-spec>` para uma atualização normal ou `plugins install <package> --force` quando realmente se deseja sobrescrever a instalação atual usando uma origem diferente. Origens arbitrárias ainda exibem o aviso interativo de procedência; instalações não interativas devem fornecer `--force` após a análise. Origens confiáveis do ClawHub e do catálogo do OpenClaw não precisam dessa opção. Com `--link`, `--force` confirma a origem, mas não altera o modo de instalação por caminho vinculado.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` aplica-se somente a instalações npm e registra o `<name>@<version>` exato resolvido. Não há compatibilidade com instalações `git:` (em vez disso, fixe a referência na especificação, por exemplo, `git:github.com/acme/plugin@v1.2.3`) nem com `--marketplace` (instalações do marketplace persistem metadados da origem do marketplace em vez de uma especificação npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto e agora não realiza nenhuma operação. O OpenClaw não executa mais o bloqueio integrado de código perigoso durante instalações de plugins.

    Use a superfície `security.installPolicy` controlada pelo operador quando uma política de instalação específica do host for necessária. Os hooks `before_install` de Plugin são hooks do ciclo de vida do runtime do plugin, não o principal limite de política para instalações pela CLI.

    Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma verificação do registro, siga as etapas para publicadores em [Publicação no ClawHub](/pt-BR/clawhub/publishing). `--dangerously-force-unsafe-install` não solicita que o ClawHub verifique novamente o plugin nem torne pública uma versão bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    As instalações da comunidade pelo ClawHub verificam o registro de confiança da versão selecionada antes do download. Se o ClawHub desabilitar o download da versão, relatar detecções maliciosas na verificação ou colocar a versão em um estado de moderação bloqueante (em quarentena, revogada), o OpenClaw a recusa terminantemente, independentemente dessa flag. Para status de verificação arriscados ou estados de moderação não bloqueantes, o OpenClaw exibe os detalhes de confiança e solicita confirmação antes de continuar.

    Use `--acknowledge-clawhub-risk` somente após analisar o aviso do ClawHub e decidir continuar sem uma solicitação interativa. Resultados de verificação pendentes ou desatualizados (ainda não considerados limpos) geram um aviso, mas não exigem confirmação. Pacotes oficiais do ClawHub e fontes de plugins incluídas no OpenClaw ignoram completamente essa verificação de confiança da versão.

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada dos hooks e habilitação por hook, não para instalação de pacotes.

    As especificações npm são **exclusivas do registro** (nome do pacote mais uma **versão exata** ou **dist-tag** opcional). Especificações Git/URL/arquivo e intervalos semver são rejeitados. As instalações de dependências são executadas em um projeto npm gerenciado por plugin com `--ignore-scripts` por segurança, mesmo quando o shell tem configurações globais de instalação do npm. Os projetos npm gerenciados dos plugins herdam o `overrides` do npm no nível de pacote do OpenClaw, portanto as restrições de segurança do host também se aplicam às dependências de plugins elevadas.

    Use `npm:<package>` para tornar explícita a resolução pelo npm. Especificações de pacote simples também são instaladas diretamente pelo npm durante a transição de lançamento, a menos que correspondam a um id de plugin oficial.

    Especificações `@openclaw/*` brutas que correspondam a plugins incluídos são resolvidas para a cópia incluída e pertencente à imagem antes do fallback para o npm. Por exemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa o plugin do Discord incluído na compilação atual do OpenClaw em vez de criar uma substituição npm gerenciada. Para forçar o uso do pacote npm externo, use `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Especificações simples e `@latest` permanecem no canal estável. Versões de correção do OpenClaw com data, como `2026.5.3-1`, contam como estáveis nessa verificação. Se o npm resolver qualquer uma das formas para uma pré-versão, o OpenClaw interromperá o processo e solicitará a adesão explícita com uma tag de pré-versão (`@beta`/`@rc`) ou uma versão de pré-lançamento exata (`@1.2.3-beta.4`).

    Para instalações npm sem uma versão exata (`npm:<package>` ou `npm:<package>@latest`), o OpenClaw verifica os metadados do pacote resolvido antes da instalação. Se o pacote estável mais recente exigir uma API de Plugin do OpenClaw mais nova ou uma versão mínima do host superior, o OpenClaw examinará versões estáveis anteriores e instalará a versão compatível mais recente. Versões exatas e dist-tags explícitas permanecem estritas: uma seleção incompatível falha e solicita que você atualize o OpenClaw ou escolha uma versão compatível.

    Se uma especificação de instalação simples corresponder a um id de plugin oficial (por exemplo, `diffs`), o OpenClaw instalará diretamente a entrada do catálogo. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório Git. Formatos compatíveis: `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e URLs de clonagem `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de um branch, uma tag ou um commit antes da instalação.

    As instalações via Git clonam em um diretório temporário, fazem checkout da referência solicitada quando presente e, em seguida, usam o instalador normal de diretórios de plugins; portanto, a validação do manifesto, a política de instalação do operador, o trabalho de instalação do gerenciador de pacotes e os registros de instalação funcionam como nas instalações npm. As instalações via Git registradas incluem a URL/referência de origem e o commit resolvido, para que `openclaw plugins update` possa resolver novamente a origem posteriormente.

    Após instalar via Git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos do gateway e comandos da CLI. Se o plugin registrar uma raiz da CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos compactados">
    Arquivos compactados compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos compactados de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contenham apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    o mesmo caminho de projeto npm gerenciado por plugin usado pelas instalações do registro,
    incluindo verificação de `package-lock.json`, análise de dependências elevadas
    e registros de instalação do npm. Caminhos simples de arquivos compactados ainda são instalados como
    arquivos locais na raiz de extensões de plugins.

    Instalações pelo marketplace do Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

As instalações pelo ClawHub usam um localizador `clawhub:<package>` explícito:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações simples de plugins válidas para npm são instaladas pelo npm por padrão durante a transição de lançamento, a menos que correspondam a um id de plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução exclusiva pelo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a compatibilidade anunciada da API do plugin/versão mínima do gateway antes da instalação. Quando a versão selecionada no ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` npm-pack versionado, verifica o cabeçalho de digest do ClawHub e o digest do artefato e, em seguida, o instala pelo caminho normal de arquivos compactados. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação do arquivo do pacote. As instalações registradas preservam os metadados de origem do ClawHub, o tipo de artefato, a integridade npm, o shasum npm, o nome do tarball e os dados de digest do ClawPack para atualizações posteriores.
Instalações sem versão pelo ClawHub mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar versões mais recentes do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

### Forma abreviada do marketplace

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
  <Tab title="Origens do marketplace">
    - um nome de marketplace conhecido pelo Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou um caminho `marketplace.json`
    - uma forma abreviada de repositório do GitHub, como `owner/repo`
    - uma URL de repositório do GitHub, como `https://github.com/owner/repo`
    - uma URL Git

  </Tab>
  <Tab title="Regras de marketplaces remotos">
    Para marketplaces remotos carregados pelo GitHub ou Git, as entradas de plugins devem permanecer dentro do repositório clonado do marketplace. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita origens de plugins HTTP(S), com caminho absoluto, Git, GitHub e outras que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com o Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com o Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude quando esse arquivo de manifesto não estiver presente)
- pacotes compatíveis com o Cursor (`.cursor-plugin/plugin.json`)

As instalações locais gerenciadas devem ser diretórios ou arquivos compactados de plugins. Arquivos de plugin `.js`,
`.mjs`, `.cjs` e `.ts` independentes não são copiados para a raiz gerenciada de plugins
por `plugins install`, nem carregados quando colocados diretamente em
`~/.openclaw/extensions` ou `<workspace>/.openclaw/extensions`; essas
raízes de descoberta automática carregam diretórios de pacotes ou bundles de plugins e ignoram
arquivos de script de nível superior como auxiliares locais. Liste arquivos independentes explicitamente em
`plugins.load.paths`.

<Note>
Bundles compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listar/informações/habilitar/desabilitar. Atualmente, há compatibilidade com Skills de bundles, Skills de comandos do Claude, padrões `settings.json` do Claude, padrões `.lsp.json` do Claude/padrões `lspServers` declarados no manifesto, Skills de comandos do Cursor e diretórios de hooks compatíveis com o Codex; outros recursos de bundles detectados são exibidos em diagnósticos/informações, mas ainda não estão conectados à execução no runtime.
</Note>

Use `-l`/`--link` para apontar para um diretório local de plugin sem copiá-lo (adiciona
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` não é compatível com instalações `--marketplace` ou `git:` e
exige um caminho local que já exista. Para um link local não interativo,
informe `--force` após analisar a origem; isso confirma a procedência, mas não
copia nem sobrescreve o diretório vinculado.

<Note>
Plugins originados de um workspace e descobertos em uma raiz de extensões do workspace não são
importados nem executados até serem explicitamente habilitados. Para desenvolvimento local,
execute `openclaw plugins enable <plugin-id>` ou defina
`plugins.entries.<plugin-id>.enabled: true`; se a configuração usar
`plugins.allow`, inclua também o mesmo id de plugin nela. Essa regra de falha fechada
também se aplica quando a configuração do canal aponta explicitamente para um plugin originado do workspace para
carregamento exclusivo de configuração; assim, o código de configuração do plugin de canal local não será executado enquanto esse
plugin do workspace permanecer desabilitado ou excluído da lista de permissões. Instalações vinculadas
e entradas explícitas `plugins.load.paths` seguem a política normal para a
origem resolvida do plugin. Consulte
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
  Mostrar somente plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alternar da visualização em tabela para linhas de detalhes por plugin com metadados de formato/origem/procedência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos do registro e estado da instalação das dependências do pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com um fallback derivado somente do manifesto quando o registro está ausente ou é inválido. Isso é útil para verificar se um plugin está instalado, habilitado e visível para o planejamento da inicialização a frio, mas não é uma sondagem do runtime em tempo real de um processo do Gateway que já está em execução. Após alterar o código do plugin, a habilitação, a política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que o novo código ou os hooks de `register(api)` sejam executados. Para implantações remotas/em contêineres, verifique se está reiniciando o processo filho `openclaw gateway run` real, e não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada plugin proveniente de `package.json`
`dependencies` e `optionalDependencies`. O OpenClaw verifica se esses nomes de pacote
estão presentes no caminho normal de busca `node_modules` do Node do plugin; ele
não importa o código de runtime do plugin, não executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

Se a inicialização registrar `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
execute `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` com um id de plugin listado para confirmar os
ids dos plugins e copiar os ids confiáveis para `plugins.allow` em `openclaw.json`. Quando o
aviso puder listar todos os plugins descobertos, ele imprimirá um trecho
`plugins.allow` pronto para colar que já inclui esses ids. Se um plugin for carregado
sem proveniência de instalação/caminho de carregamento, inspecione o id desse plugin e então fixe
o id confiável em `plugins.allow` ou reinstale o plugin de uma fonte confiável
para que o OpenClaw registre a proveniência da instalação.

Para trabalhar em um plugin incluído dentro de uma imagem Docker empacotada, monte com bind o diretório
de origem do plugin sobre o caminho de origem empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobre essa sobreposição de origem montada
antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado
permanece inerte, portanto as instalações empacotadas normais continuam usando o dist compilado.

Para depurar hooks de runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra os hooks registrados e os diagnósticos de uma passagem de inspeção com o módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar o estado de dependências legado ou recuperar plugins ausentes disponíveis para download que sejam referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma a URL/o perfil alcançável do Gateway, indicações de serviço/processo, o caminho da configuração e a integridade do RPC.
- Hooks de conversa não incluídos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Índice de plugins

Os metadados de instalação de plugins são um estado gerenciado pela máquina, não uma configuração do usuário. Instalações e atualizações os gravam no banco de dados de estado SQLite compartilhado, no diretório de estado ativo do OpenClaw. A linha `installed_plugin_index` armazena metadados `installRecords` duráveis, incluindo registros de manifestos de plugins inválidos ou ausentes, além de um cache de registro a frio derivado do manifesto usado por `openclaw plugins update`, pela desinstalação, pelos diagnósticos e pelo registro de plugins a frio.

Quando o OpenClaw encontra registros legados fornecidos `plugins.installs` na configuração, as leituras de runtime os tratam como entrada de compatibilidade sem reescrever `openclaw.json`. Gravações explícitas de plugins e `openclaw doctor --fix` movem esses registros para o índice de plugins e removem a chave de configuração quando gravações na configuração são permitidas; se qualquer uma das gravações falhar, os registros da configuração serão mantidos para que os metadados de instalação não sejam perdidos.

## Desinstalação

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` remove os registros do plugin de `plugins.entries`, do índice de plugins persistido, das entradas das listas de permissão/bloqueio de plugins e das entradas `plugins.load.paths` vinculadas, quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado e rastreado, mas somente quando ele é resolvido dentro da raiz de extensões de plugins do OpenClaw. Se o plugin atualmente ocupar o slot `memory` ou `contextEngine`, esse slot será redefinido para seu padrão (`memory-core` para memória, `legacy` para o mecanismo de contexto).

`uninstall` imprime uma prévia do que será removido e solicita `Uninstall plugin "<id>"?` antes de fazer alterações. Passe `--force` para ignorar a solicitação de confirmação (útil para scripts e execuções não interativas); sem essa opção, a desinstalação exige um TTY interativo. `--dry-run` imprime a mesma prévia e encerra sem solicitar confirmação nem alterar nada.

<Note>
`--keep-config` é compatível como um alias obsoleto de `--keep-files`.
</Note>

## Atualização

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

As atualizações se aplicam às instalações de plugins rastreadas no índice gerenciado de plugins e às instalações de pacotes de hooks rastreadas em `hooks.internal.installs`. Elas reutilizam a fonte que o usuário já escolheu ao instalar o plugin, portanto não exigem uma segunda confirmação da fonte.

<AccordionGroup>
  <Accordion title="Resolução entre id do plugin e especificação npm">
    Ao passar um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Durante `update <id> --dry-run`, instalações npm com versões exatas fixadas permanecem fixadas. Se o OpenClaw também puder resolver a linha padrão do registro do pacote e essa linha padrão for mais recente que a versão fixada instalada, a simulação informará a versão fixada e imprimirá o comando explícito de atualização do pacote `@latest` para acompanhar a linha padrão do registro.

    Essa regra de atualização direcionada difere do caminho de manutenção em massa `openclaw plugins update --all`. As atualizações em massa ainda respeitam as especificações comuns de instalação rastreadas, mas registros confiáveis de plugins oficiais do OpenClaw podem ser sincronizados com o destino atual do catálogo oficial em vez de permanecerem em um pacote oficial exato desatualizado. Use o `update <id>` direcionado quando quiser manter intencionalmente uma especificação oficial exata ou com tag inalterada.

    Para instalações npm, também é possível passar uma especificação explícita de pacote npm com uma dist-tag ou uma versão exata. O OpenClaw resolve esse nome de pacote para o registro de plugin rastreado, atualiza o plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também o resolve para o registro de plugin rastreado. Use isso quando um plugin estiver fixado em uma versão exata e você quiser movê-lo de volta para a linha de versão padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    O `openclaw plugins update <id-or-npm-spec>` direcionado reutiliza a especificação de plugin rastreada, a menos que você passe uma nova especificação. O `openclaw plugins update --all` em massa usa o `update.channel` configurado ao sincronizar registros confiáveis de plugins oficiais com o destino do catálogo oficial, de modo que instalações do canal beta possam permanecer na linha de versão beta em vez de serem normalizadas silenciosamente para stable/latest.

    `openclaw update` também reconhece o canal de atualização ativo do OpenClaw: no canal beta, registros de plugins npm e do ClawHub na linha padrão tentam primeiro `@beta`. Eles retornam à especificação padrão/latest registrada se não existir uma versão beta do plugin; plugins npm também recorrem à alternativa quando o pacote beta existe, mas falha na validação da instalação. Esse fallback é informado como um aviso e não causa falha na atualização do núcleo. Versões exatas e tags explícitas permanecem fixadas nesse seletor para atualizações direcionadas.

  </Accordion>
  <Accordion title="Verificações de versão e divergência de integridade">
    Antes de uma atualização npm real, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade registrada do artefato já corresponderem ao destino resolvido, a atualização será ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como divergência de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e solicita confirmação antes de prosseguir. Auxiliares de atualização não interativos bloqueiam por padrão, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também é aceito em `plugins update` para compatibilidade, mas está obsoleto e não altera mais o comportamento de atualização de plugins. O `security.installPolicy` do operador ainda pode bloquear atualizações; hooks `before_install` de plugins se aplicam somente a processos nos quais os hooks de plugins estão carregados.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk na atualização">
    Atualizações de plugins da comunidade provenientes do ClawHub executam a mesma verificação de confiança da versão exata usada nas instalações antes de baixar o pacote substituto. Use `--acknowledge-clawhub-risk` para automações revisadas que devem continuar quando a versão selecionada no ClawHub apresentar um aviso de confiança arriscado. Pacotes oficiais do ClawHub e fontes de plugins incluídas no OpenClaw ignoram essa solicitação de confiança da versão.
  </Accordion>
</AccordionGroup>

## Inspeção

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

A inspeção mostra identidade, status de carregamento, fonte, capacidades do manifesto, sinalizadores de política, diagnósticos, metadados de instalação, capacidades do pacote e qualquer compatibilidade detectada com servidores MCP ou LSP, sem importar o runtime do plugin por padrão. A saída JSON inclui os contratos do manifesto do plugin, como `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, para que operadores possam auditar as declarações de superfícies confiáveis antes de habilitar ou reiniciar um plugin. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks, ferramentas, comandos, serviços, métodos do Gateway e rotas HTTP registrados. A inspeção de runtime informa diretamente as dependências de plugins ausentes; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Os comandos da CLI pertencentes a plugins geralmente são instalados como grupos de comandos `openclaw` raiz, mas os plugins também podem registrar comandos aninhados sob um comando pai do núcleo, como `openclaw nodes`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o no caminho listado; por exemplo, um plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado pelo que realmente registra em runtime:

| Formato             | Significado                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `plain-capability`  | exatamente um tipo de capacidade (por exemplo, um plugin somente de provedor)   |
| `hybrid-capability` | mais de um tipo de capacidade (por exemplo, texto + fala + imagens)             |
| `hook-only`         | somente hooks, sem capacidades, ferramentas, comandos, serviços ou rotas        |
| `non-capability`    | ferramentas/comandos/serviços, mas sem capacidades                              |

Consulte [Formatos de plugins](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de capacidades.

<Note>
O sinalizador `--json` gera um relatório legível por máquina, adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, capacidades do pacote e resumo de hooks. `info` é um alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta, avisos de compatibilidade e referências obsoletas de configuração de plugins, como slots de plugin ausentes. Quando a árvore de instalação e a configuração de plugins estão íntegras, ele imprime `No plugin issues detected.` Se ainda houver configuração obsoleta, mas a árvore de instalação estiver íntegra nos demais aspectos, o resumo informará isso em vez de sugerir integridade total dos plugins.

Se um plugin configurado estiver presente no disco, mas for bloqueado pelas verificações de segurança de caminho do carregador, a validação da configuração manterá a entrada do plugin e a relatará como `present but blocked`. Corrija o diagnóstico anterior de plugin bloqueado, como a propriedade do caminho ou permissões de gravação para todos, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas no formato do módulo, como exportações `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato das exportações na saída de diagnóstico.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo persistido de leitura a frio do OpenClaw para identidade de plugins instalados, habilitação, metadados de origem e propriedade das contribuições. A inicialização normal, a pesquisa do proprietário do provedor, a classificação da configuração de canais e o inventário de plugins podem lê-lo sem importar módulos de runtime dos plugins.

Use `plugins registry` para verificar se o registro persistido está presente, atualizado ou obsoleto. Use `--refresh` para reconstruí-lo com base no índice persistido de plugins, na política de configuração e nos metadados de manifesto/pacote. Esse é um caminho de reparo, não um caminho de ativação de runtime.

`openclaw doctor --fix` também corrige desvios do npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado em um projeto npm gerenciado de plugin ou na raiz plana legada do npm gerenciado encobrir um plugin integrado, o doctor removerá esse pacote obsoleto e reconstruirá o registro para que a inicialização valide usando o manifesto integrado. O doctor também recria o link do pacote `openclaw` do host nos plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que importações de runtime locais ao pacote, como `openclaw/plugin-sdk/*`, sejam resolvidas após atualizações ou reparos do npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma opção de compatibilidade emergencial obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por variável de ambiente destina-se apenas à recuperação emergencial da inicialização enquanto a migração é implantada.
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

`plugins marketplace entries` lista as entradas do feed configurado do marketplace do OpenClaw. Por padrão, ele tenta usar o feed hospedado e recorre ao snapshot aceito mais recente ou aos dados integrados. Use `--feed-profile <name>` para ler um perfil configurado específico, `--feed-url <url>` para ler uma URL explícita de feed hospedado e `--offline` para ler o snapshot aceito mais recente sem buscar o feed.

`plugins marketplace refresh` atualiza o snapshot configurado do feed hospedado e informa se o OpenClaw aceitou dados hospedados, um snapshot hospedado ou dados integrados de fallback. Use `--expected-sha256` quando o chamador precisar que o comando falhe, a menos que uma carga hospedada recente corresponda a uma soma de verificação fixada.

O `list` do Marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, uma forma abreviada do GitHub, como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da origem resolvida, além do manifesto analisado do marketplace e das entradas de plugins.

A atualização do Marketplace carrega um feed hospedado do marketplace do OpenClaw e persiste a
resposta validada como o snapshot local do feed hospedado. Sem opções, ela usa
o perfil padrão configurado do feed. Use `--feed-profile <name>` para atualizar um
perfil configurado específico, `--feed-url <url>` para atualizar uma URL explícita
de feed hospedado, `--expected-sha256 <sha256>` para exigir uma soma de verificação correspondente da carga
(`sha256:<hex>` ou um resumo hexadecimal simples de 64 caracteres) e `--json` para
uma saída legível por máquina. URLs explícitas de feeds hospedados não podem incluir
credenciais, strings de consulta nem fragmentos. Atualizações sem valor fixado podem relatar um
snapshot hospedado ou um resultado de fallback integrado sem causar falha no comando. Atualizações
com valor fixado falham, a menos que aceitem uma carga hospedada recente, e atualizações hospedadas
bem-sucedidas falham se o OpenClaw não conseguir persistir o snapshot validado.

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [ClawHub](/clawhub)
