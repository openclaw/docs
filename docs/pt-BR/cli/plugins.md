---
read_when:
    - Você deseja instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas de carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, habilitar/desabilitar, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T09:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie Plugins do Gateway, pacotes de hooks e bundles compatíveis.

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
```

Para investigar instalações, inspeções, desinstalações ou atualizações de registro lentas, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O rastreamento grava os tempos das fases
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
Plugins empacotados são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo empacotados, provedores de fala empacotados e o Plugin de navegador empacotado); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem incluir `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) além das capacidades de bundle detectadas.
</Note>

### Instalar

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
Nomes de pacote simples são instalados a partir do npm por padrão durante a transição de lançamento. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e imprime
nomes de pacotes prontos para instalação. Ele pesquisa pacotes de Plugin de código e Plugin de bundle,
não Skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo um fallback compatível e um caminho de instalação direta. Pacotes de Plugin
`@openclaw/*` mantidos pelo OpenClaw foram publicados novamente no npm; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou no
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível, depois recorrem a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e reparo de configuração inválida">
    Se sua seção `plugins` for apoiada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intacto. Includes raiz, arrays de includes e includes com substituições irmãs falham de forma fechada em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração estiver inválida durante a instalação, `plugins install` normalmente falha de forma fechada e orienta você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway e o recarregamento a quente, uma configuração de Plugin inválida falha de forma fechada como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar a entrada inválida do Plugin em quarentena. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de Plugin empacotado para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação versus atualização">
    `--force` reutiliza o destino de instalação existente e sobrescreve um Plugin ou pacote de hooks já instalado no lugar. Use quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um Plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de Plugin que já está instalado, o OpenClaw interrompe e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma ref git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma fonte fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de fonte do marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no verificador integrado de código perigoso. Ela permite que a instalação continue mesmo quando o verificador integrado relata achados `critical`, mas **não** ignora bloqueios de política de hook `before_install` do Plugin e **não** ignora falhas de varredura.

    Essa flag da CLI se aplica a fluxos de instalação/atualização de Plugin. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

    Se um Plugin que você publicou no ClawHub for bloqueado por uma varredura de registro, use as etapas para publicadores em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacote.

    Especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou **dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências rodam localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm.

    Use `npm:<package>` quando quiser explicitar a resolução npm. Especificações de pacote simples também instalam diretamente do npm durante a transição de lançamento.

    Especificações simples e `@latest` permanecem na faixa estável. Versões de correção datadas do OpenClaw, como `2026.5.3-1`, são versões estáveis para esta verificação. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw interrompe e pede que você aceite explicitamente com uma tag de pré-versão, como `@beta`/`@rc`, ou uma versão de pré-lançamento exata, como `@1.2.3-beta.4`.

    Se uma especificação de instalação simples corresponder a um id oficial de Plugin (por exemplo, `diffs`), o OpenClaw instala a entrada do catálogo diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório git. Formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git` de clone. Adicione `@<ref>` ou `#<ref>` para fazer checkout de um branch, tag ou commit antes da instalação.

    Instalações Git clonam para um diretório temporário, fazem checkout da ref solicitada quando presente e então usam o instalador normal de diretório de Plugin. Isso significa que validação de manifesto, varredura de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/ref de origem mais o commit resolvido para que `openclaw plugins update` possa resolver novamente a fonte mais tarde.

    Depois de instalar a partir de git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos de gateway e comandos da CLI. Se o Plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de Plugin nativo do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do Plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações de Plugin simples seguras para npm instalam a partir do npm por padrão durante a transição de lançamento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para explicitar a resolução somente por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a API de Plugin anunciada / compatibilidade mínima do gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` versionado do npm-pack, verifica o cabeçalho de digest do ClawHub e o digest do artefato, e então o instala pelo caminho normal de arquivo. Versões antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de digest do ClawPack para atualizações posteriores.
Instalações não versionadas do ClawHub mantêm uma especificação registrada não versionada para que `openclaw plugins update` possa acompanhar versões mais novas do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

#### Atalho de marketplace

Use o atalho `plugin@marketplace` quando o nome do marketplace existir no cache de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser passar a fonte do marketplace explicitamente:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou um caminho `marketplace.json`
    - um atalho de repositório do GitHub, como `owner/repo`
    - uma URL de repositório do GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de Plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita fontes de caminho relativo desse repositório e rejeita HTTP(S), caminhos absolutos, git, GitHub e outras fontes de Plugin que não sejam caminhos em manifests remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- Plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de Plugins e participam do mesmo fluxo de listar/informações/habilitar/desabilitar. Hoje, há suporte a Skills de pacote, Skills de comando do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifest, Skills de comando do Cursor e diretórios de hooks compatíveis do Codex; outros recursos de pacote detectados são mostrados em diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
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
  Alterna da visualização em tabela para linhas detalhadas por Plugin com metadados de fonte/origem/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos de registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de Plugins, com um fallback derivado apenas de manifest quando o registro está ausente ou inválido. Ele é útil para verificar se um Plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sondagem de runtime em tempo real de um processo Gateway já em execução. Depois de alterar código de Plugin, habilitação, política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho real de `openclaw gateway run`, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada Plugin a partir de `dependencies` e `optionalDependencies` de `package.json`. O OpenClaw verifica se esses nomes de pacote estão presentes ao longo do caminho normal de busca `node_modules` do Node do Plugin; ele não importa código de runtime do Plugin, não executa um gerenciador de pacotes nem repara dependências ausentes.
</Note>

`plugins search` é uma consulta remota ao catálogo do ClawHub. Ela não inspeciona o estado local, não altera configuração, não instala pacotes nem carrega código de runtime de Plugin. Os resultados da busca incluem o nome do pacote no ClawHub, família, canal, versão, resumo e uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho com Plugin incluído dentro de uma imagem Docker empacotada, monte o diretório de origem do Plugin sobre o caminho de origem empacotado correspondente, como `/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado permanece inerte, de modo que instalações empacotadas normais continuam usando o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou instalar Plugins baixáveis configurados que estejam ausentes.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway acessível, dicas de serviço/processo, caminho de configuração e integridade de RPC.
- Hooks de conversa não incluídos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de Plugins gerenciado, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de Plugins

Metadados de instalação de Plugin são estado gerenciado pela máquina, não configuração do usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável de metadados de instalação, incluindo registros de manifests de Plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado de manifest. O arquivo inclui um aviso de não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e o registro frio de Plugins.

Quando o OpenClaw vê registros legados enviados de `plugins.installs` na configuração, ele os move para o índice de Plugins e remove a chave de configuração; se qualquer uma das gravações falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, do índice persistido de Plugins, de entradas de lista de permissão/negação de Plugins e de entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de Plugins do OpenClaw. Para Plugins de Active Memory, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como um alias obsoleto de `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações de Plugin rastreadas no índice de Plugins gerenciado e a instalações de pacotes de hooks rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Quando você passa um id de Plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado, atualiza esse Plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem versão ou tag também resolve de volta para o registro de Plugin rastreado. Use isso quando um Plugin tiver sido fixado a uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` reutiliza a especificação de Plugin rastreada, a menos que você passe uma nova especificação. `openclaw update` também conhece o canal de atualização ativo do OpenClaw: no canal beta, registros de Plugin npm e ClawHub da linha padrão tentam `@beta` primeiro e, em seguida, fazem fallback para a especificação padrão/latest registrada se não existir lançamento beta do Plugin. Versões exatas e tags explícitas permanecem fixadas nesse seletor.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Antes de uma atualização npm em tempo real, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de continuar. Auxiliares de atualização não interativos falham em modo fechado, a menos que o chamador forneça uma política de continuação explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da varredura integrada de código perigoso durante atualizações de Plugin. Ele ainda não contorna bloqueios de política `before_install` do Plugin nem bloqueio por falha de varredura, e se aplica apenas a atualizações de Plugin, não a atualizações de pacotes de hooks.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

A inspeção mostra identidade, estado de carregamento, fonte, recursos do manifest, flags de política, diagnósticos, metadados de instalação, recursos de pacote e qualquer suporte detectado a servidores MCP ou LSP sem importar o runtime do Plugin por padrão. Adicione `--runtime` para carregar o módulo do Plugin e incluir hooks, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP registrados. A inspeção de runtime relata dependências ausentes do Plugin diretamente; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos de CLI pertencentes a Plugins são instalados como grupos de comandos raiz `openclaw`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o como `openclaw <command> ...`; por exemplo, um Plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada Plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de recurso (por exemplo, um Plugin apenas de provedor)
- **hybrid-capability** — vários tipos de recurso (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem recursos ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem recursos

Consulte [Formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de recursos.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de recurso, avisos de compatibilidade, recursos de pacote e resumo de hooks. `info` é um alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugin, diagnósticos de manifest/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Se um Plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do loader, a validação de configuração mantém a entrada do Plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de Plugin bloqueado, como propriedade de caminho ou permissões graváveis pelo mundo, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato dos exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de Plugins é o modelo persistido de leitura fria do OpenClaw para identidade de Plugins instalados, habilitação, metadados de fonte e propriedade de contribuição. A inicialização normal, a busca de proprietário de provedor, a classificação de configuração de canal e o inventário de Plugins podem lê-lo sem importar módulos de runtime de Plugin.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice persistido de Plugins, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em tempo de execução.

`openclaw doctor --fix` também repara desvios de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado sob a raiz npm de Plugins gerenciados sombrear um Plugin incluído, o doctor remove esse pacote obsoleto e reconstrói o registro para que a inicialização valide contra o manifesto incluído.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade emergencial obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por env é apenas para recuperação emergencial de inicialização enquanto a migração é distribuída.
</Warning>

### Mercado

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem do mercado aceita um caminho local de mercado, um caminho `marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da fonte resolvida, além do manifesto de mercado analisado e das entradas de Plugin.

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
