---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer criar o esqueleto ou validar um Plugin de ferramenta simples
    - Você quer depurar falhas no carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-27T17:20:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/pt-BR/tools/plugin">
    Guia do usuário final para instalar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Gerenciar plugins" href="/pt-BR/plugins/manage-plugins">
    Exemplos rápidos para instalar, listar, atualizar, desinstalar e publicar.
  </Card>
  <Card title="Bundles de Plugin" href="/pt-BR/plugins/bundles">
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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Para investigar instalações, inspeções, desinstalações ou atualizações de registro lentas, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O rastreamento grava os tempos das fases
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), os modificadores do ciclo de vida de plugins são desabilitados. Use a origem Nix para esta instalação em vez de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable`; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
Plugins incluídos são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem incluir `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) mais os recursos de bundle detectados.
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
id para o diretório de saída padrão e a nomenclatura do pacote. Estruturas iniciais de ferramentas usam
`defineToolPlugin`.
`plugins build` importa a entrada compilada, lê seus metadados estáticos de ferramenta, grava
`openclaw.plugin.json` e mantém `openclaw.extensions` em `package.json` alinhado.
`plugins validate` verifica se o manifesto gerado, os metadados do pacote e a
exportação da entrada atual ainda concordam. Consulte [Plugins de ferramenta](/pt-BR/plugins/tool-plugins) para
o fluxo completo de autoria de ferramentas.

A estrutura inicial grava código-fonte TypeScript, mas gera metadados a partir da entrada compilada
`./dist/index.js`, então o fluxo também funciona com a CLI publicada. Use
`--entry <path>` quando a entrada não for a entrada padrão do pacote. Use
`plugins build --check` na CI para falhar quando os metadados gerados estiverem desatualizados sem
reescrever arquivos.

### Estrutura inicial de provedor

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Estruturas iniciais de provedor criam um plugin genérico de provedor de texto/modelo com infraestrutura
de chave de API compatível com OpenAI, um script `npm run validate` embutido para `clawhub package
validate`, metadados de pacote do ClawHub e um fluxo de trabalho do GitHub acionado manualmente
para publicação confiável futura por meio de GitHub Actions OIDC. Estruturas iniciais de provedor
não geram skills e não usam `openclaw plugins build` nem
`openclaw plugins validate`; esses comandos são para o caminho de metadados gerados da estrutura inicial
de ferramenta.

Antes de publicar, substitua a URL base de API de espaço reservado, o catálogo de modelos, a rota de docs,
o texto de credenciais e o texto do README por detalhes reais do provedor. Use o
README gerado para a primeira publicação no ClawHub e a configuração de publicador confiável.

### Instalar

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

Mantenedores que testam instalações em tempo de configuração podem substituir as origens automáticas
de instalação de plugins por variáveis de ambiente protegidas. Consulte
[Substituições de instalação de Plugin](/pt-BR/plugins/install-overrides).

<Warning>
Nomes de pacote simples instalam a partir do npm por padrão durante a transição de lançamento, a menos que correspondam a um id oficial de plugin. Especificações brutas de pacote `@openclaw/*` que correspondem a plugins incluídos usam a cópia incluída distribuída com a compilação atual do OpenClaw. Use `npm:<package>` quando você quiser deliberadamente um pacote npm externo. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e imprime
nomes de pacotes prontos para instalação. Ele pesquisa pacotes de code-plugin e bundle-plugin,
não skills. Use `openclaw skills search` para skills do ClawHub.

<Note>
O ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo uma alternativa compatível e um caminho de instalação direta. Pacotes de plugins
`@openclaw/*` de propriedade do OpenClaw são publicados no npm novamente; consulte a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou o
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível, depois recorrem a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e reparo de configuração inválida">
    Se sua seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intocado. Includes na raiz, arrays de include e includes com substituições irmãs falham de modo fechado em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração estiver inválida durante a instalação, `plugins install` normalmente falha de modo fechado e orienta você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway e o hot reload, configuração inválida de plugin falha de modo fechado como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar a entrada inválida de plugin em quarentena. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalar vs atualizar">
    `--force` reutiliza o destino de instalação existente e sobrescreve no local um plugin ou pacote de hooks já instalado. Use quando estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw interrompe e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma origem diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` aplica-se apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma referência git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma origem fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de origem do marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` está obsoleto e agora é um no-op. O OpenClaw não executa mais bloqueio perigoso de código embutido em tempo de instalação para instalações de plugins.

    Use a superfície compartilhada `security.installPolicy`, de propriedade do operador, quando for necessária uma política de instalação específica do host. Hooks `before_install` de plugins são hooks de ciclo de vida do runtime do plugin e não são a principal fronteira de política para instalações pela CLI.

    Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma varredura de registro, use as etapas de publicador em [Publicação no ClawHub](/pt-BR/clawhub/publishing). `--dangerously-force-unsafe-install` não solicita que o ClawHub reescaneie o plugin nem torne pública uma versão bloqueada.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalações comunitárias do ClawHub verificam o registro de confiança da versão selecionada antes de baixar o pacote. Se o ClawHub desabilitar o download para a versão, relatar achados maliciosos de varredura ou colocar a versão em um estado de moderação bloqueante, como quarentena, o OpenClaw recusa a versão. Para status arriscados de varredura não bloqueantes, estados arriscados de moderação ou motivos de registro, o OpenClaw mostra os detalhes de confiança e solicita confirmação antes de continuar.

    Use `--acknowledge-clawhub-risk` somente depois de revisar o aviso do ClawHub e decidir continuar sem um prompt interativo. Registros de confiança limpos pendentes ou desatualizados avisam, mas não exigem confirmação. Pacotes oficiais do ClawHub e origens de plugins do OpenClaw incluídos ignoram esse prompt de confiança da versão.

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacote.

    Especificações npm são **somente de registro** (nome do pacote + **versão exata** ou **dist-tag** opcional). Especificações Git/URL/file e intervalos semver são rejeitados. Instalações de dependências são executadas em um projeto npm gerenciado por plugin com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm. Projetos npm gerenciados de plugins herdam os `overrides` npm no nível do pacote do OpenClaw, então pins de segurança do host também se aplicam às dependências hoisted de plugins.

    Use `npm:<package>` quando quiser tornar a resolução npm explícita. Especificações simples de pacote também instalam diretamente do npm durante a transição de lançamento, a menos que correspondam a um id oficial de plugin.

    Raw `@openclaw/*` package specs que correspondem a plugins integrados resolvem para a cópia integrada pertencente à imagem antes do fallback do npm. Por exemplo, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa o plugin integrado do Discord da build atual do OpenClaw em vez de criar uma substituição gerenciada do npm. Para forçar o pacote npm externo, use `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Especificações simples e `@latest` permanecem na faixa estável. Versões de correção com data do OpenClaw, como `2026.5.3-1`, são lançamentos estáveis para esta verificação. Se o npm resolver qualquer uma delas para uma prévia, o OpenClaw interrompe e pede que você aceite explicitamente com uma tag de prévia, como `@beta`/`@rc`, ou uma versão exata de prévia, como `@1.2.3-beta.4`.

    Para instalações npm sem uma versão exata (`npm:<package>` ou `npm:<package>@latest`), o OpenClaw verifica os metadados do pacote resolvido antes da instalação. Se o pacote estável mais recente exigir uma API de plugin do OpenClaw mais nova ou uma versão mínima de host mais recente, o OpenClaw inspeciona versões estáveis anteriores e instala a versão compatível mais recente. Versões exatas e dist-tags explícitas, como `@beta`, permanecem estritas: se o pacote selecionado for incompatível, o comando falha e pede que você atualize o OpenClaw ou escolha uma versão compatível.

    Se uma especificação de instalação simples corresponder a um ID de plugin oficial (por exemplo, `diffs`), o OpenClaw instala a entrada do catálogo diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório git. As formas compatíveis incluem URLs de clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações git clonam em um diretório temporário, fazem checkout da ref solicitada quando presente e então usam o instalador normal de diretório de plugins. Isso significa que validação de manifesto, política de instalação do operador, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/ref de origem mais o commit resolvido, para que `openclaw plugins update` possa resolver novamente a origem mais tarde.

    Depois de instalar a partir do git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos de gateway e comandos CLI. Se o plugin registrou uma raiz CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo, `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos nativos de plugin do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    testar o mesmo caminho de projeto npm gerenciado por plugin usado por instalações
    de registro, incluindo verificação de `package-lock.json`, varredura de dependências
    içadas e registros de instalação do npm. Caminhos de arquivo simples ainda são instalados como arquivos locais
    sob a raiz de extensões de plugins.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações simples de plugins seguras para npm instalam a partir do npm por padrão durante a transição de lançamento, a menos que correspondam a um ID de plugin oficial:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução somente pelo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a compatibilidade anunciada da API de plugin / gateway mínimo antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` npm-pack versionado, verifica o cabeçalho de digest do ClawHub e o digest do artefato e então o instala pelo caminho normal de arquivo. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de digest do ClawPack para atualizações posteriores.
Instalações não versionadas do ClawHub mantêm uma especificação registrada não versionada para que `openclaw plugins update` possa acompanhar lançamentos mais recentes do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados a esse seletor.

#### Abreviação de marketplace

Use a abreviação `plugin@marketplace` quando o nome do marketplace existir no cache de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser informar explicitamente a origem do marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou um caminho para `marketplace.json`
    - um atalho de repositório GitHub, como `owner/repo`
    - uma URL de repositório GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita origens HTTP(S), de caminho absoluto, git, GitHub e outras origens de plugin que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos e arquivos locais, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Instalações locais gerenciadas devem ser diretórios de plugin ou arquivos compactados. Arquivos de plugin `.js`,
`.mjs`, `.cjs` e `.ts` independentes não são copiados para a raiz de plugins
gerenciados por `plugins install`; em vez disso, liste-os explicitamente em `plugins.load.paths`.

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listagem/informações/habilitação/desabilitação. Hoje, há suporte a Skills de pacote, command-skills do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks compatíveis com Codex; outros recursos de pacote detectados são mostrados em diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
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
  Mostra apenas plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alterna da visualização em tabela para linhas de detalhes por plugin com metadados de origem/procedência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos de registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com uma alternativa derivada apenas do manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sondagem de runtime em tempo real de um processo Gateway já em execução. Depois de alterar código de plugin, habilitação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho `openclaw gateway run` real, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada plugin de `package.json`
`dependencies` e `optionalDependencies`. O OpenClaw verifica se esses nomes de pacote
estão presentes no caminho normal de consulta `node_modules` do Node para o plugin; ele
não importa código de runtime do plugin, não executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

Se os logs de inicialização mostrarem `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
execute `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` com um id de plugin listado para confirmar os ids de
plugin e copiar ids confiáveis para `plugins.allow` em `openclaw.json`. Quando o
aviso consegue listar todos os plugins descobertos, ele imprime um trecho
`plugins.allow` pronto para colar que já inclui esses ids. Se um plugin for carregado
sem procedência de instalação/caminho de carregamento, inspecione esse id de plugin e então
fixe o id confiável em `plugins.allow` ou reinstale o plugin de uma origem confiável
para que o OpenClaw registre a procedência da instalação.

`plugins search` é uma consulta ao catálogo remoto do ClawHub. Ela não inspeciona o estado
local, não altera a configuração, não instala pacotes nem carrega código de runtime de plugin. Os
resultados da busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e
uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho com plugin empacotado dentro de uma imagem Docker empacotada, monte por bind o diretório
de origem do plugin sobre o caminho de origem empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada
antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado
permanece inerte, de modo que instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks de runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado de dependências legado ou recuperar plugins baixáveis ausentes que são referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma a URL/perfil do Gateway acessível, dicas de serviço/processo, caminho de configuração e integridade do RPC.
- Hooks de conversa não empacotados (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório de plugin local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Arquivos de plugin independentes devem ser listados em `plugins.load.paths` em vez de
instalados com `plugins install` ou colocados diretamente em `~/.openclaw/extensions`
ou `<workspace>/.openclaw/extensions`. Essas raízes descobertas automaticamente carregam
diretórios de pacote ou pacote compatível de plugin, enquanto arquivos de script de nível superior são tratados como
auxiliares locais e ignorados.

<Note>
Plugins originados do workspace descobertos a partir da raiz de extensões de um workspace não são
importados nem executados até que sejam explicitamente habilitados. Para desenvolvimento local,
execute `openclaw plugins enable <plugin-id>` ou defina
`plugins.entries.<plugin-id>.enabled: true`; se sua configuração usa
`plugins.allow`, inclua o mesmo id de Plugin ali também. Essa regra de falha fechada
também se aplica quando a configuração de canal direciona explicitamente um Plugin originado do workspace para
carregamento apenas de configuração, portanto o código local de configuração do Plugin de canal não será executado enquanto esse
Plugin do workspace permanecer desabilitado ou excluído da lista de permissões. Instalações vinculadas
e entradas explícitas de `plugins.load.paths` seguem a política normal para sua
origem de Plugin resolvida. Consulte
[Configurar política de Plugin](/pt-BR/tools/plugin#configure-plugin-policy)
e [Referência de configuração](/pt-BR/gateway/configuration-reference#plugins).

`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de Plugin gerenciado, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de Plugin

Metadados de instalação de Plugin são estado gerenciado pela máquina, não configuração do usuário. Instalações e atualizações os gravam no banco de dados de estado SQLite compartilhado sob o diretório de estado ativo do OpenClaw. A linha `installed_plugin_index` armazena metadados duráveis de `installRecords`, incluindo registros para manifestos de Plugin quebrados ou ausentes, além de um cache frio de registro derivado do manifesto usado por `openclaw plugins update`, desinstalação, diagnósticos e o registro frio de Plugins.

Quando o OpenClaw encontra registros legados enviados de `plugins.installs` na configuração, as leituras em tempo de execução os tratam como entrada de compatibilidade sem reescrever `openclaw.json`. Gravações explícitas de Plugin e `openclaw doctor --fix` movem esses registros para o índice de Plugin e removem a chave de configuração quando gravações de configuração são permitidas; se qualquer uma das gravações falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalação

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, do índice de Plugin persistido, entradas da lista de permissões/negações de Plugin e entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de Plugin do OpenClaw. Para Plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como um alias obsoleto para `--keep-files`.
</Note>

### Atualização

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações de Plugin rastreadas no índice de Plugin gerenciado e a instalações de pacotes de hooks rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução de id de Plugin versus especificação npm">
    Quando você passa um id de Plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões fixadas exatas continuam sendo usadas em execuções posteriores de `update <id>`.

    Essa regra de atualização direcionada é diferente do caminho de manutenção em massa `openclaw plugins update --all`. Atualizações em massa ainda respeitam especificações comuns de instalação rastreadas, mas registros confiáveis de Plugins oficiais do OpenClaw podem sincronizar com o destino atual do catálogo oficial em vez de permanecer em um pacote oficial exato obsoleto. Use `update <id>` direcionado quando você quiser intencionalmente manter uma especificação oficial exata ou marcada intacta.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado, atualiza esse Plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também resolve de volta para o registro de Plugin rastreado. Use isso quando um Plugin foi fixado em uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update <id-or-npm-spec>` direcionado reutiliza a especificação de Plugin rastreada, a menos que você passe uma nova especificação. `openclaw plugins update --all` em massa usa o `update.channel` configurado quando sincroniza registros confiáveis de Plugins oficiais com o destino do catálogo oficial, para que instalações do canal beta possam permanecer na linha de lançamento beta em vez de serem normalizadas silenciosamente para estável/mais recente.

    `openclaw update` também conhece o canal ativo de atualização do OpenClaw: no canal beta, registros de Plugins npm e ClawHub da linha padrão tentam `@beta` primeiro. Eles recorrem à especificação padrão/mais recente registrada se não existir nenhum lançamento beta do Plugin; Plugins npm também recorrem quando o pacote beta existe, mas falha na validação de instalação. Esse fallback é relatado como um aviso e não faz a atualização do core falhar. Versões exatas e tags explícitas permanecem fixadas nesse seletor para atualizações direcionadas.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm em tempo real, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização será ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Auxiliares de atualização não interativos falham fechados, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também é aceito em `plugins update` por compatibilidade, mas está obsoleto e não altera mais o comportamento de atualização de Plugin. O `security.installPolicy` do operador ainda pode bloquear atualizações; hooks `before_install` de Plugin só se aplicam em processos onde hooks de Plugin são carregados.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk na atualização">
    Atualizações de Plugins apoiados pelo ClawHub da comunidade executam a mesma verificação de confiança de lançamento exato que instalações antes de baixar o pacote substituto. Use `--acknowledge-clawhub-risk` para automação revisada que deve continuar quando o lançamento selecionado do ClawHub tiver um aviso de confiança arriscado. Pacotes oficiais do ClawHub e fontes de Plugin do OpenClaw empacotadas ignoram esse prompt de confiança de lançamento.
  </Accordion>
</AccordionGroup>

### Inspeção

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identidade, status de carregamento, origem, capacidades do manifesto, sinalizadores de política, diagnósticos, metadados de instalação, capacidades do pacote e qualquer suporte detectado a servidor MCP ou LSP sem importar o runtime do Plugin por padrão. A saída JSON inclui os contratos de manifesto do Plugin, como `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, para que operadores possam auditar declarações de superfície confiável antes de habilitar ou reiniciar um Plugin. Adicione `--runtime` para carregar o módulo do Plugin e incluir hooks, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP registrados. A inspeção de runtime relata dependências de Plugin ausentes diretamente; instalações e reparos ficam em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos CLI pertencentes a Plugins geralmente são instalados como grupos de comando raiz `openclaw`, mas Plugins também podem registrar comandos aninhados sob um pai do core, como `openclaw nodes`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o no caminho listado; por exemplo, um Plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada Plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo, um Plugin somente de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para mais sobre o modelo de capacidades.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com formato, tipos de capacidade, avisos de compatibilidade, capacidades de pacote e colunas de resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugin, diagnósticos de manifesto/descoberta, avisos de compatibilidade e referências obsoletas de configuração de Plugin, como slots de Plugin ausentes. Quando a árvore de instalação e a configuração de Plugin estão limpas, ele imprime `No plugin issues detected.` Se a configuração obsoleta permanecer, mas a árvore de instalação estiver saudável, o resumo informa isso em vez de sugerir integridade completa de Plugin.

Se um Plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do carregador, a validação de configuração mantém a entrada do Plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de Plugin bloqueado, como propriedade de caminho ou permissões graváveis por todos, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de Plugins é o modelo de leitura fria persistido do OpenClaw para identidade de Plugin instalado, habilitação, metadados de origem e propriedade de contribuições. Inicialização normal, busca de proprietário de provedor, classificação de configuração de canal e inventário de Plugins podem lê-lo sem importar módulos de runtime de Plugin.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice de Plugin persistido, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em runtime.

`openclaw doctor --fix` também repara desvios de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado sob um projeto npm de Plugin gerenciado ou a raiz npm gerenciada plana legada sombreia um Plugin empacotado, o doctor remove esse pacote obsoleto e reconstrói o registro para que a inicialização valide contra o manifesto empacotado. O doctor também revincula o pacote host `openclaw` a Plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que imports de runtime locais ao pacote, como `openclaw/plugin-sdk/*`, resolvam após atualizações ou reparos npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é um interruptor de compatibilidade emergencial obsoleto para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback de env é apenas para recuperação emergencial de inicialização enquanto a migração é distribuída.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A lista do marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, uma abreviação do GitHub como `owner/repo`, uma URL de repositório GitHub ou uma URL git. `--json` imprime o rótulo de origem resolvido, além do manifesto de marketplace analisado e das entradas de Plugin.

## Relacionado

- [Criação de Plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [ClawHub](/pt-BR/clawhub)
