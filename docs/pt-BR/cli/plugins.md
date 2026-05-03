---
read_when:
    - Você deseja instalar ou gerenciar Plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas de carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie plugins do Gateway, pacotes de hooks e bundles compatíveis.

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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Para investigar instalações, inspeções, desinstalações ou atualizações de registro lentas, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O trace grava tempos por fase
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
Plugins integrados são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelos integrados, provedores de fala integrados e o Plugin de navegador integrado); outros exigem `plugins enable`.

Plugins OpenClaw nativos devem distribuir `openclaw.plugin.json` com um JSON Schema inline (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de lista/informações também mostra o subtipo de bundle (`codex`, `claude` ou `cursor`) e os recursos de bundle detectados.
</Note>

### Instalação

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nomes de pacote simples são instalados do npm por padrão durante a transição de lançamento. Use `clawhub:<package>` para ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e imprime
nomes de pacotes prontos para instalação. Ele pesquisa pacotes de code-plugin e bundle-plugin,
não Skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
ClawHub é a superfície principal de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo um fallback e caminho de instalação direta compatível. Pacotes de plugins
`@openclaw/*` mantidos pelo OpenClaw voltaram a ser publicados no npm; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou no
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível e, em seguida, fazem fallback para `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Se sua seção `plugins` for apoiada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intacto. Includes raiz, arrays de includes e includes com substituições irmãs falham fechados em vez de serem achatados. Consulte [includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha fechado e informa que você deve executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway e recarregamento a quente, uma configuração de Plugin inválida falha fechada como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar em quarentena a entrada de Plugin inválida. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de Plugin integrado para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` reutiliza o destino de instalação existente e sobrescreve no lugar um Plugin ou pacote de hooks já instalado. Use quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo compactado, pacote ClawHub ou artefato npm. Para atualizações rotineiras de um Plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de Plugin que já está instalado, o OpenClaw interrompe e indica `plugins update <id-or-npm-spec>` para uma atualização normal, ou `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma ref git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma fonte fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de origem do marketplace em vez de uma spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de contingência para falsos positivos no verificador integrado de código perigoso. Ela permite que a instalação continue mesmo quando o verificador integrado relata achados `critical`, mas **não** ignora bloqueios de política do hook `before_install` do Plugin e **não** ignora falhas de verificação.

    Essa flag de CLI se aplica aos fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

    Se um Plugin que você publicou no ClawHub for bloqueado por uma verificação de registro, use as etapas de publicador em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    Specs npm são **apenas de registro** (nome do pacote + **versão exata** ou **dist-tag** opcional). Specs Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências são executadas localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm.

    Use `npm:<package>` quando quiser tornar explícita a resolução npm. Specs de pacote simples também são instaladas diretamente do npm durante a transição de lançamento.

    Specs simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw interrompe e pede que você opte explicitamente por uma tag de pré-versão, como `@beta`/`@rc`, ou por uma versão de pré-lançamento exata, como `@1.2.3-beta.4`.

    Se uma spec simples de instalação corresponder a um id de Plugin oficial (por exemplo, `diffs`), o OpenClaw instala a entrada de catálogo diretamente. Para instalar um pacote npm com o mesmo nome, use uma spec com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Use `git:<repo>` para instalar diretamente de um repositório git. Formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e URLs de clone `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de um branch, tag ou commit antes da instalação.

    Instalações git clonam para um diretório temporário, fazem checkout da ref solicitada quando presente e depois usam o instalador normal de diretório de Plugin. Isso significa que validação de manifesto, verificação de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como em instalações npm. Instalações git registradas incluem a URL/ref de origem e o commit resolvido para que `openclaw plugins update` possa resolver a origem novamente depois.

    Depois de instalar a partir do git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros em runtime, como métodos do Gateway e comandos de CLI. Se o Plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Arquivos compactados compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos compactados de plugins OpenClaw nativos devem conter um `openclaw.plugin.json` válido na raiz extraída do Plugin; arquivos compactados que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Instalações do marketplace do Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Specs de Plugin seguras para npm e sem prefixo instalam do npm por padrão durante a transição de lançamento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução somente por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a API de Plugin anunciada / compatibilidade mínima do Gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` versionado gerado por npm-pack, verifica o cabeçalho de digest do ClawHub e o digest do artefato e então o instala pelo caminho normal de arquivo compactado. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo compactado de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de digest ClawPack para atualizações posteriores.
Instalações não versionadas do ClawHub mantêm uma spec registrada não versionada para que `openclaw plugins update` possa acompanhar lançamentos mais recentes do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

#### Abreviação de marketplace

Use a abreviação `plugin@marketplace` quando o nome do marketplace existir no cache de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser passar a origem do marketplace explicitamente:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Fontes do Marketplace">
    - um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho `marketplace.json`
    - um atalho de repositório do GitHub, como `owner/repo`
    - uma URL de repositório do GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de Plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita HTTP(S), caminhos absolutos, git, GitHub e outras origens de Plugin que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos, o OpenClaw detecta automaticamente:

- Plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de Plugins e participam do mesmo fluxo de listar/informações/habilitar/desabilitar. Hoje, há suporte para Skills de pacote, Skills de comando do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifesto, Skills de comando do Cursor e diretórios de hooks compatíveis com Codex; outros recursos de pacote detectados aparecem em diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
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
  Alterna da visualização em tabela para linhas de detalhes por Plugin com metadados de origem/proveniência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina mais diagnósticos do registro e estado de instalação de dependências do pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de Plugins, com um fallback derivado apenas do manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um Plugin está instalado, habilitado e visível para o planejamento de inicialização fria, mas não é uma sondagem de runtime ao vivo de um processo Gateway que já está em execução. Depois de alterar código do Plugin, habilitação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho real de `openclaw gateway run`, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada Plugin a partir de `dependencies` e `optionalDependencies` de `package.json`. O OpenClaw verifica se esses nomes de pacote estão presentes ao longo do caminho normal de consulta de `node_modules` do Node para o Plugin; ele não importa código de runtime do Plugin, não executa um gerenciador de pacotes nem repara dependências ausentes.
</Note>

`plugins search` é uma consulta remota ao catálogo do ClawHub. Ela não inspeciona o estado local, não modifica config, não instala pacotes nem carrega código de runtime do Plugin. Os resultados da busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho em Plugin integrado dentro de uma imagem Docker empacotada, monte com bind o diretório de origem do Plugin sobre o caminho de origem empacotado correspondente, como `/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado permanece inerte, para que instalações empacotadas normais ainda usem o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com o módulo carregado. A inspeção em runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado de dependências legado ou instalar Plugins baixáveis configurados que estejam ausentes.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway acessível, dicas de serviço/processo, caminho de config e integridade de RPC.
- Hooks de conversa não integrados (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link`, porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar o spec exato resolvido (`name@version`) no índice de Plugins gerenciados, mantendo o comportamento padrão sem pin.
</Note>

### Índice de Plugins

Metadados de instalação de Plugins são estado gerenciado por máquina, não config do usuário. Instalações e atualizações os gravam em `plugins/installs.json` dentro do diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável de metadados de instalação, incluindo registros para manifestos de Plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado do manifesto. O arquivo inclui um aviso de não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e pelo registro frio de Plugins.

Quando o OpenClaw encontra registros legados enviados em `plugins.installs` na config, ele os move para o índice de Plugins e remove a chave de config; se qualquer gravação falhar, os registros de config são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, do índice persistido de Plugins, de entradas de lista de permissão/negação de Plugins e de entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de Plugins do OpenClaw. Para Plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como alias obsoleto para `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações de Plugins rastreadas no índice de Plugins gerenciados e a instalações de hook-packs rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução de id de Plugin vs spec npm">
    Quando você passa um id de Plugin, o OpenClaw reutiliza o spec de instalação registrado para esse Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam a ser usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar um spec explícito de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado, atualiza esse Plugin instalado e registra o novo spec npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também resolve de volta para o registro de Plugin rastreado. Use isso quando um Plugin foi fixado a uma versão exata e você quer movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update` reutiliza o spec de Plugin rastreado, a menos que você passe um novo spec. `openclaw update` também conhece o canal de atualização ativo do OpenClaw: no canal beta, registros de Plugin npm e ClawHub da linha padrão tentam `@beta` primeiro e depois fazem fallback para o spec padrão/latest registrado se não existir uma versão beta do Plugin. Versões exatas e tags explícitas permanecem fixadas nesse seletor.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado contra os metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma fechada, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install em update">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como um override de emergência para falsos positivos da varredura integrada de código perigoso durante atualizações de Plugins. Ele ainda não contorna bloqueios de política `before_install` do Plugin nem bloqueios por falha de varredura, e se aplica apenas a atualizações de Plugins, não a atualizações de hook-packs.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identidade, estado de carregamento, origem, recursos do manifesto, flags de política, diagnósticos, metadados de instalação, recursos de pacote e qualquer suporte detectado a servidores MCP ou LSP sem importar o runtime do Plugin por padrão. Adicione `--runtime` para carregar o módulo do Plugin e incluir hooks, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP registrados. A inspeção em runtime informa dependências ausentes do Plugin diretamente; instalações e reparos ficam em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos CLI pertencentes a Plugins são instalados como grupos de comandos raiz de `openclaw`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o como `openclaw <command> ...`; por exemplo, um Plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada Plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de recurso (por exemplo, um Plugin somente de provedor)
- **hybrid-capability** — vários tipos de recurso (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem recursos ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem recursos

Consulte [Formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de recursos.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de recurso, avisos de compatibilidade, recursos de pacote e resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Se um Plugin configurado está presente no disco, mas bloqueado pelas verificações de segurança de caminho do carregador, a validação de config mantém a entrada do Plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de Plugin bloqueado, como propriedade do caminho ou permissões graváveis por todos, em vez de remover a config `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de Plugins é o modelo de leitura fria persistido do OpenClaw para identidade de Plugins instalados, habilitação, metadados de origem e propriedade de contribuições. A inicialização normal, a consulta de proprietário de provedor, a classificação de configuração de canal e o inventário de Plugins podem lê-lo sem importar módulos de runtime de Plugins.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice de plugins persistido, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em tempo de execução.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade break-glass obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback de env é apenas para recuperação emergencial da inicialização enquanto a migração é implementada.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem do Marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, uma abreviação do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da origem resolvida, além do manifesto de marketplace analisado e das entradas de Plugin.

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
