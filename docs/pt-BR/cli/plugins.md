---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer criar o esqueleto ou validar um Plugin de ferramenta simples
    - Você quer depurar falhas de carregamento de plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T22:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie Plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/pt-BR/tools/plugin">
    Guia do usuário final para instalar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Manage plugins" href="/pt-BR/plugins/manage-plugins">
    Exemplos rápidos para instalar, listar, atualizar, desinstalar e publicar.
  </Card>
  <Card title="Plugin bundles" href="/pt-BR/plugins/bundles">
    Modelo de compatibilidade de bundles.
  </Card>
  <Card title="Plugin manifest" href="/pt-BR/plugins/manifest">
    Campos do manifesto e esquema de configuração.
  </Card>
  <Card title="Security" href="/pt-BR/gateway/security">
    Reforço de segurança para instalações de plugins.
  </Card>
</CardGroup>

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Para investigar instalação, inspeção, desinstalação ou atualização de registro lentas, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O trace grava os tempos das fases
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), mutadores de ciclo de vida de plugins ficam desabilitados. Use a fonte Nix para esta instalação em vez de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable`; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado ao agente.
</Note>

<Note>
Plugins incluídos são enviados com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem enviar `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de lista/informações também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`), além das capacidades de bundle detectadas.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` cria um plugin de ferramenta TypeScript mínimo por padrão. O primeiro
argumento é o id do plugin; passe `--name` para o nome de exibição. O OpenClaw usa o
id para o diretório de saída padrão e para a nomenclatura do pacote. Scaffolds de ferramenta usam
`defineToolPlugin`.
`plugins build` importa a entrada compilada, lê seus metadados estáticos de ferramenta, grava
`openclaw.plugin.json` e mantém `package.json` `openclaw.extensions` alinhado.
`plugins validate` verifica se o manifesto gerado, os metadados do pacote e a
exportação da entrada atual ainda concordam. Consulte [Plugins de ferramenta](/pt-BR/plugins/tool-plugins) para
o fluxo completo de autoria de ferramentas.

O scaffold grava código-fonte TypeScript, mas gera metadados a partir da entrada compilada
`./dist/index.js`, de modo que o fluxo também funciona com a CLI publicada. Use
`--entry <path>` quando a entrada não for a entrada padrão do pacote. Use
`plugins build --check` em CI para falhar quando os metadados gerados estiverem desatualizados sem
reescrever arquivos.

### Scaffold de provedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Scaffolds de provedor criam um plugin genérico de provedor de texto/modelo com encanamento de
chave de API compatível com OpenAI, um script `npm run validate` integrado para `clawhub package
validate`, metadados de pacote do ClawHub e um fluxo de trabalho do GitHub disparado manualmente
para publicação confiável futura por meio de GitHub Actions OIDC. Scaffolds de provedor
não geram skills e não usam `openclaw plugins build` nem
`openclaw plugins validate`; esses comandos são para o caminho de metadados gerados
do scaffold de ferramenta.

Antes de publicar, substitua a URL base de API de placeholder, o catálogo de modelos, a rota de documentação,
o texto de credenciais e o texto do README por detalhes reais do provedor. Use o
README gerado para a primeira publicação no ClawHub e a configuração de publicador confiável.

### Instalação

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Mantenedores que testam instalações no momento da configuração podem substituir as fontes automáticas de instalação de plugins
com variáveis de ambiente protegidas. Consulte
[Substituições de instalação de plugins](/pt-BR/plugins/install-overrides).

<Warning>
Nomes simples de pacote são instalados do npm por padrão durante a transição de lançamento, a menos que correspondam a um id de plugin oficial. Especificações brutas de pacote `@openclaw/*` que correspondem a plugins incluídos usam a cópia incluída enviada com a compilação atual do OpenClaw. Use `npm:<package>` quando você quiser deliberadamente um pacote npm externo. Use `clawhub:<package>` para ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugin instaláveis e imprime
nomes de pacote prontos para instalação. Ele pesquisa pacotes de code-plugin e bundle-plugin,
não Skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. Npm
continua sendo uma alternativa com suporte e um caminho de instalação direta. Pacotes de plugin
`@openclaw/*` pertencentes ao OpenClaw voltaram a ser publicados no npm; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou no
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível, depois recorrem a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Se a sua seção `plugins` for respaldada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intocado. Includes raiz, arrays de includes e includes com substituições irmãs falham fechados em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha fechado e informa que você deve executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway e o hot reload, configuração de plugin inválida falha fechada como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar a entrada de plugin inválida em quarentena. A única exceção documentada no momento da instalação é um caminho estreito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` reutiliza o destino de instalação existente e sobrescreve no local um plugin ou pacote de hooks já instalado. Use-o quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw para e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma ref git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma fonte fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de fonte do marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` foi descontinuado e agora é um no-op. O OpenClaw não executa mais bloqueio integrado de código perigoso no momento da instalação para instalações de plugins.

    Use a superfície compartilhada `security.installPolicy`, de propriedade do operador, quando uma política de instalação específica do host for necessária. Hooks `before_install` de plugins são hooks de ciclo de vida do runtime do plugin e não são a principal fronteira de política para instalações pela CLI.

    Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma varredura de registro, use as etapas de publicador em [Publicação no ClawHub](/pt-BR/clawhub/publishing). `--dangerously-force-unsafe-install` não solicita que o ClawHub faça uma nova varredura do plugin nem torne pública uma versão bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalações da comunidade do ClawHub verificam o registro de confiança da versão selecionada antes de baixar o pacote. Se o ClawHub desabilitar o download da versão, relatar achados maliciosos de varredura ou colocar a versão em um estado de moderação bloqueante, como quarentena, o OpenClaw recusa a versão. Para status de varredura arriscados não bloqueantes, estados de moderação arriscados ou motivos de registro, o OpenClaw mostra os detalhes de confiança e solicita confirmação antes de continuar.

    Use `--acknowledge-clawhub-risk` somente depois de revisar o aviso do ClawHub e decidir continuar sem um prompt interativo. Registros de confiança limpos pendentes ou obsoletos emitem aviso, mas não exigem reconhecimento. Pacotes oficiais do ClawHub e fontes de plugins incluídos do OpenClaw ignoram este prompt de confiança da versão.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    As especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou **dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. As instalações de dependências rodam em um projeto npm gerenciado por Plugin com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação do npm. Projetos npm gerenciados de Plugins herdam os `overrides` de npm em nível de pacote do OpenClaw, então as fixações de segurança do host também se aplicam às dependências de Plugins içadas.

    Use `npm:<package>` quando quiser tornar a resolução npm explícita. Especificações de pacote simples também instalam diretamente do npm durante a transição de lançamento, a menos que correspondam a um id de Plugin oficial.

    Especificações brutas de pacote `@openclaw/*` que correspondem a Plugins empacotados são resolvidas para a cópia empacotada pertencente à imagem antes do fallback para npm. Por exemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa o Plugin Discord empacotado da build atual do OpenClaw em vez de criar uma substituição npm gerenciada. Para forçar o pacote npm externo, use `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Especificações simples e `@latest` permanecem na trilha estável. Versões de correção com data do OpenClaw, como `2026.5.3-1`, são versões estáveis para esta verificação. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw para e pede que você aceite explicitamente com uma tag de pré-versão como `@beta`/`@rc` ou uma versão exata de pré-versão como `@1.2.3-beta.4`.

    Para instalações npm sem uma versão exata (`npm:<package>` ou `npm:<package>@latest`), o OpenClaw verifica os metadados do pacote resolvido antes da instalação. Se o pacote estável mais recente exigir uma API de Plugin do OpenClaw mais nova ou uma versão mínima de host mais recente, o OpenClaw inspeciona versões estáveis anteriores e instala a versão compatível mais nova. Versões exatas e dist-tags explícitas como `@beta` permanecem estritas: se o pacote selecionado for incompatível, o comando falha e pede que você atualize o OpenClaw ou escolha uma versão compatível.

    Se uma especificação de instalação simples corresponder a um id de Plugin oficial (por exemplo, `diffs`), o OpenClaw instala diretamente a entrada do catálogo. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícita (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Use `git:<repo>` para instalar diretamente de um repositório git. As formas compatíveis incluem URLs de clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações git clonam para um diretório temporário, fazem checkout da ref solicitada quando presente e então usam o instalador normal de diretório de Plugin. Isso significa que validação de manifesto, política de instalação do operador, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/ref de origem mais o commit resolvido para que `openclaw plugins update` possa resolver novamente a origem depois.

    Depois de instalar a partir do git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros em runtime, como métodos de Gateway e comandos CLI. Se o Plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos nativos de Plugin do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do Plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    testar o mesmo caminho de projeto npm gerenciado por Plugin usado por instalações
    de registro, incluindo verificação de `package-lock.json`, varredura de dependências
    içadas e registros de instalação npm. Caminhos de arquivo comuns ainda instalam como arquivos
    locais sob a raiz de extensões do Plugin.

    Instalações do marketplace do Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações de Plugin simples seguras para npm instalam do npm por padrão durante a transição de lançamento, a menos que correspondam a um id de Plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução somente npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a API de Plugin anunciada / compatibilidade mínima do Gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` npm-pack versionado, verifica o cabeçalho de resumo do ClawHub e o resumo do artefato, e então o instala pelo caminho normal de arquivo. Versões mais antigas do ClawHub sem metadados ClawPack ainda instalam pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de resumo ClawPack para atualizações posteriores.
Instalações ClawHub sem versão mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar versões mais novas do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

#### Atalho de marketplace

Use o atalho `plugin@marketplace` quando o nome do marketplace existir no cache de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser passar explicitamente a origem do marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - um nome de marketplace conhecido do Claude de `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho `marketplace.json`
    - um atalho de repositório GitHub, como `owner/repo`
    - uma URL de repositório GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de Plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita origens de Plugin HTTP(S), de caminho absoluto, git, GitHub e outras que não sejam de caminho em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos, o OpenClaw detecta automaticamente:

- Plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Instalações locais gerenciadas devem ser diretórios ou arquivos de Plugin. Arquivos de Plugin
`.js`, `.mjs`, `.cjs` e `.ts` autônomos não são copiados para a raiz de Plugin
gerenciada por `plugins install`; liste-os explicitamente em `plugins.load.paths`.

<Note>
Pacotes compatíveis são instalados na raiz normal de Plugins e participam do mesmo fluxo de listagem/informações/habilitação/desabilitação. Hoje, Skills de pacotes, Skills de comando do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifesto, Skills de comando do Cursor e diretórios de hooks compatíveis do Codex são compatíveis; outros recursos de pacote detectados aparecem em diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
</Note>

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Mostra apenas Plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alterna da visualização em tabela para linhas de detalhe por Plugin com metadados de origem/proveniência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos de registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de Plugins, com um fallback derivado somente do manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um Plugin está instalado, habilitado e visível ao planejamento de inicialização a frio, mas não é uma sondagem de runtime ao vivo de um processo Gateway já em execução. Depois de alterar código de Plugin, habilitação, política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho real `openclaw gateway run`, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada Plugin a partir de `package.json`
`dependencies` e `optionalDependencies`. O OpenClaw verifica se esses nomes de pacote
estão presentes ao longo do caminho normal de consulta `node_modules` do Node do Plugin; ele
não importa código de runtime do Plugin, não executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

Se os logs de inicialização mostrarem `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
execute `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` com um id de Plugin listado para confirmar os ids
de Plugin e copiar ids confiáveis para `plugins.allow` em `openclaw.json`. Quando o
aviso consegue listar todos os Plugins descobertos, ele imprime um trecho
`plugins.allow` pronto para colar que já inclui esses ids. Se um Plugin carregar
sem proveniência de instalação/caminho de carregamento, inspecione esse id de Plugin e então fixe
o id confiável em `plugins.allow` ou reinstale o Plugin a partir de uma origem confiável
para que o OpenClaw registre a proveniência da instalação.

`plugins search` é uma consulta remota ao catálogo ClawHub. Ela não inspeciona estado
local, não altera configuração, não instala pacotes nem carrega código de runtime de Plugin.
Os resultados da busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e
uma dica de instalação como `openclaw plugins install clawhub:<package>`.

Para trabalho em Plugin empacotado dentro de uma imagem Docker empacotada, monte por bind o diretório
de origem do Plugin sobre o caminho de origem empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada
antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado
permanece inerte, então instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou recuperar Plugins baixáveis ausentes que são referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma a URL/perfil do Gateway alcançável, dicas de serviço/processo, caminho de configuração e integridade RPC.
- Hooks de conversa não empacotados (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local de Plugin (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Arquivos de Plugin autônomos devem ser listados em `plugins.load.paths` em vez de
instalados com `plugins install` ou colocados diretamente em `~/.openclaw/extensions`
ou `<workspace>/.openclaw/extensions`. Essas raízes autodetectadas carregam diretórios
de pacote ou pacote compatível de Plugin, enquanto arquivos de script no nível superior são tratados como auxiliares
locais e ignorados.

<Note>
Plugins originados do workspace descobertos a partir de uma raiz de extensões do workspace não são
importados nem executados até serem explicitamente habilitados. Para desenvolvimento local,
execute `openclaw plugins enable <plugin-id>` ou defina
`plugins.entries.<plugin-id>.enabled: true`; se sua configuração usa
`plugins.allow`, inclua o mesmo id de plugin ali também. Essa regra de falha fechada
também se aplica quando a configuração de canal direciona explicitamente um plugin originado do workspace para
carregamento apenas de configuração, portanto o código local de configuração de plugin de canal não será executado enquanto esse
plugin do workspace permanecer desabilitado ou excluído da lista de permissões. Instalações vinculadas
e entradas explícitas de `plugins.load.paths` seguem a política normal para sua
origem de plugin resolvida. Consulte
[Configurar política de plugins](/pt-BR/tools/plugin#configure-plugin-policy)
e [Referência de configuração](/pt-BR/gateway/configuration-reference#plugins).

`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de plugins gerenciados, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de plugins

Metadados de instalação de plugins são estado gerenciado pela máquina, não configuração do usuário. Instalações e atualizações os gravam no banco de dados de estado SQLite compartilhado sob o diretório de estado ativo do OpenClaw. A linha `installed_plugin_index` armazena metadados duráveis de `installRecords`, incluindo registros de manifestos de plugins quebrados ou ausentes, além de um cache frio de registro derivado do manifesto usado por `openclaw plugins update`, desinstalação, diagnósticos e pelo registro frio de plugins.

Quando o OpenClaw encontra registros legados enviados de `plugins.installs` na configuração, as leituras em tempo de execução os tratam como entrada de compatibilidade sem reescrever `openclaw.json`. Gravações explícitas de plugins e `openclaw doctor --fix` movem esses registros para o índice de plugins e removem a chave de configuração quando gravações de configuração são permitidas; se qualquer uma das gravações falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugins de `plugins.entries`, do índice de plugins persistido, das entradas de lista de permissões/bloqueios de plugins e das entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório rastreado de instalação gerenciada quando ele está dentro da raiz de extensões de plugins do OpenClaw. Para plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como um alias obsoleto de `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações de plugins rastreadas no índice de plugins gerenciados e a instalações de hook-packs rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de plugin versus especificação npm">
    Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Durante `update <id> --dry-run`, instalações npm fixadas em uma versão exata permanecem fixadas. Se o OpenClaw também conseguir resolver a linha padrão do registro do pacote e essa linha padrão for mais nova que a versão fixada instalada, a simulação informa a fixação e imprime o comando explícito de atualização de pacote `@latest` para seguir a linha padrão do registro.

    Essa regra de atualização direcionada é diferente do caminho de manutenção em massa `openclaw plugins update --all`. Atualizações em massa ainda respeitam especificações comuns de instalação rastreada, mas registros confiáveis de plugins oficiais do OpenClaw podem sincronizar com o alvo atual do catálogo oficial em vez de permanecer em um pacote oficial exato obsoleto. Use `update <id>` direcionado quando você quiser intencionalmente manter uma especificação oficial exata ou marcada intocada.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem versão ou tag também resolve de volta para o registro de plugin rastreado. Use isso quando um plugin tiver sido fixado em uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update <id-or-npm-spec>` direcionado reutiliza a especificação de plugin rastreada, a menos que você passe uma nova especificação. `openclaw plugins update --all` em massa usa o `update.channel` configurado quando sincroniza registros confiáveis de plugins oficiais com o alvo do catálogo oficial, para que instalações do canal beta possam permanecer na linha de lançamento beta em vez de serem normalizadas silenciosamente para stable/latest.

    `openclaw update` também conhece o canal de atualização ativo do OpenClaw: no canal beta, registros de plugins npm e ClawHub da linha padrão tentam `@beta` primeiro. Eles retornam para a especificação padrão/latest registrada se não existir lançamento beta do plugin; plugins npm também retornam quando o pacote beta existe, mas falha na validação de instalação. Esse fallback é informado como um aviso e não falha a atualização do núcleo. Versões exatas e tags explícitas permanecem fixadas nesse seletor para atualizações direcionadas.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado contra os metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao alvo resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Auxiliares de atualização não interativos falham fechados, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também é aceito em `plugins update` por compatibilidade, mas está obsoleto e não altera mais o comportamento de atualização de plugins. O `security.installPolicy` do operador ainda pode bloquear atualizações; hooks `before_install` de plugins só se aplicam em processos onde hooks de plugins são carregados.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk na atualização">
    Atualizações de plugins da comunidade com suporte do ClawHub executam a mesma verificação de confiança de lançamento exato das instalações antes de baixar o pacote substituto. Use `--acknowledge-clawhub-risk` para automação revisada que deve continuar quando o lançamento selecionado do ClawHub tiver um aviso de confiança arriscado. Pacotes oficiais do ClawHub e fontes de plugins do OpenClaw empacotadas ignoram esse prompt de confiança de lançamento.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identidade, status de carregamento, origem, capacidades do manifesto, sinalizadores de política, diagnósticos, metadados de instalação, capacidades do bundle e qualquer suporte detectado a servidor MCP ou LSP sem importar o runtime do plugin por padrão. A saída JSON inclui os contratos do manifesto do plugin, como `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, para que operadores possam auditar declarações de superfície confiável antes de habilitar ou reiniciar um plugin. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP registrados. A inspeção de runtime relata dependências ausentes do plugin diretamente; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos de CLI pertencentes a plugins geralmente são instalados como grupos de comandos raiz de `openclaw`, mas plugins também podem registrar comandos aninhados sob um pai do núcleo, como `openclaw nodes`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o no caminho listado; por exemplo, um plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado pelo que ele realmente registra em tempo de execução:

- **plain-capability** — um tipo de capacidade (por exemplo, um plugin apenas de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de plugins](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de capacidades.

<Note>
O sinalizador `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, capacidades do bundle e resumo de hooks. `info` é um alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta, avisos de compatibilidade e referências obsoletas de configuração de plugins, como slots de plugins ausentes. Quando a árvore de instalação e a configuração de plugins estão limpas, ele imprime `No plugin issues detected.` Se ainda houver configuração obsoleta, mas a árvore de instalação estiver saudável, o resumo informa isso em vez de sugerir saúde completa dos plugins.

Se um plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do carregador, a validação de configuração mantém a entrada do plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de plugin bloqueado, como propriedade do caminho ou permissões graváveis por todos, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exportação na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo persistido de leitura fria do OpenClaw para identidade de plugins instalados, habilitação, metadados de origem e propriedade de contribuições. Inicialização normal, consulta de proprietário de provedor, classificação de configuração de canal e inventário de plugins podem lê-lo sem importar módulos de runtime de plugins.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice de plugins persistido, da política de configuração e dos metadados de manifesto/pacote. Esse é um caminho de reparo, não um caminho de ativação de runtime.

`openclaw doctor --fix` também repara desvios npm gerenciados adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado sob um projeto npm de plugin gerenciado ou a raiz npm gerenciada plana legada sombrear um plugin empacotado, doctor remove esse pacote obsoleto e reconstrói o registro para que a inicialização valide contra o manifesto empacotado. Doctor também revincula o pacote host `openclaw` a plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que imports de runtime locais ao pacote, como `openclaw/plugin-sdk/*`, resolvam após atualizações ou reparos npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é um interruptor obsoleto de compatibilidade de emergência para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por env serve apenas para recuperação emergencial de inicialização enquanto a migração é distribuída.
</Warning>

### Marketplace

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

`plugins marketplace entries` lista entradas do feed de marketplace configurado do OpenClaw. Por padrão, ele tenta usar o feed hospedado e recorre ao snapshot aceito mais recente ou aos dados incluídos. Use `--feed-profile <name>` para ler um perfil configurado específico, `--feed-url <url>` para ler uma URL explícita de feed hospedado e `--offline` para ler o snapshot aceito mais recente sem buscar o feed.

`plugins marketplace refresh` atualiza o snapshot do feed hospedado configurado e informa se o OpenClaw aceitou dados hospedados, um snapshot hospedado ou dados incluídos como fallback. Use `--expected-sha256` quando um chamador precisar que o comando falhe, a menos que uma carga útil hospedada nova corresponda a uma soma de verificação fixada.

O `list` do marketplace aceita um caminho local de marketplace, um caminho de `marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da fonte resolvida, além do manifesto de marketplace analisado e das entradas de Plugin.

A atualização do marketplace carrega um feed hospedado de marketplace do OpenClaw e persiste a
resposta validada como o snapshot local do feed hospedado. Sem opções, ela usa
o perfil de feed padrão configurado. Use `--feed-profile <name>` para atualizar um
perfil configurado específico, `--feed-url <url>` para atualizar uma URL explícita de
feed hospedado, `--expected-sha256 <sha256>` para exigir uma soma de verificação
correspondente da carga útil (`sha256:<hex>` ou um digest hexadecimal bruto de 64 caracteres)
e `--json` para saída legível por máquina. URLs explícitas de feed hospedado não devem incluir
credenciais, strings de consulta ou fragmentos. Atualizações sem fixação podem relatar um
snapshot hospedado ou resultado de fallback incluído sem fazer o comando falhar. Atualizações
fixadas falham, a menos que aceitem uma carga útil hospedada nova, e atualizações hospedadas
bem-sucedidas falham se o OpenClaw não conseguir persistir o snapshot validado.

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [ClawHub](/pt-BR/clawhub)
