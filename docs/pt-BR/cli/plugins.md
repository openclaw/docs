---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você deseja depurar falhas no carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T05:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/pt-BR/tools/plugin">
    Guia do usuário final para instalar, habilitar e solucionar problemas de plugins.
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

Para investigar instalações, inspeções, desinstalações ou atualizações de registro lentas, execute o comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O rastreamento grava os tempos de cada fase em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
Plugins incluídos são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem distribuir `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de lista/informações também mostra o subtipo de bundle (`codex`, `claude` ou `cursor`), além das capacidades de bundle detectadas.
</Note>

### Instalar

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
Nomes de pacote simples são verificados primeiro no ClawHub e depois no npm. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub por pacotes de plugins instaláveis e imprime nomes de pacote prontos para instalação. Ele pesquisa pacotes de plugins de código e de plugins de bundle, não Skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm continua sendo um caminho de fallback e instalação direta compatível. Durante a migração para o ClawHub, o OpenClaw ainda distribui alguns pacotes de plugins `@openclaw/*` pertencentes ao OpenClaw no npm; essas versões de pacote podem ficar atrás do código-fonte incluído entre ciclos de lançamento de plugins. Se o npm relatar que um pacote de plugin pertencente ao OpenClaw está obsoleto, essa versão publicada é um artefato externo antigo; use o plugin incluído no OpenClaw atual ou um checkout local até que um pacote npm mais recente seja publicado.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e recuperação de configuração inválida">
    Se a sua seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` gravará nesse arquivo incluído e deixará `openclaw.json` intacto. Includes raiz, arrays de includes e includes com substituições irmãs falham de modo fechado em vez de nivelar. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração estiver inválida durante a instalação, `plugins install` normalmente falha de modo fechado e orienta você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway, a configuração inválida de um plugin é isolada a esse plugin para que outros canais e plugins possam continuar em execução; `openclaw doctor --fix` pode colocar em quarentena a entrada de plugin inválida. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de plugins incluídos para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação vs. atualização">
    `--force` reutiliza o destino de instalação existente e sobrescreve no local um plugin ou pacote de hooks já instalado. Use-o quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote ClawHub ou artefato npm. Para atualizações rotineiras de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw interrompe a operação e aponta para `plugins update <id-or-npm-spec>` para uma atualização normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma referência git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma fonte fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de origem de marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no scanner de código perigoso integrado. Ela permite que a instalação continue mesmo quando o scanner integrado relata achados `critical`, mas **não** ignora bloqueios de política do hook `before_install` do plugin e **não** ignora falhas de verificação.

    Essa flag de CLI se aplica aos fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de requisição correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

    Se um plugin que você publicou no ClawHub for bloqueado por uma verificação de registro, use as etapas de publicador em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    Especificações npm são **somente de registro** (nome do pacote + **versão exata** ou **dist-tag** opcional). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências executam localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm.

    Use `npm:<package>` quando quiser ignorar a consulta ao ClawHub e instalar diretamente do npm. Especificações simples de pacote ainda preferem o ClawHub e só recorrem ao npm quando o ClawHub não tem esse pacote ou versão.

    Especificações simples e `@latest` permanecem na faixa estável. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw interrompe a operação e pede que você opte explicitamente por uma tag de pré-versão, como `@beta`/`@rc`, ou por uma versão de pré-lançamento exata, como `@1.2.3-beta.4`.

    Se uma especificação de instalação simples corresponder a um id de plugin oficial (por exemplo, `diffs`), o OpenClaw instala a entrada do catálogo diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório git. Os formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas de clone `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações git clonam em um diretório temporário, fazem checkout da referência solicitada quando presente e depois usam o instalador normal de diretório de plugins. Isso significa que validação de manifesto, verificação de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/referência de origem mais o commit resolvido para que `openclaw plugins update` possa resolver novamente a origem posteriormente.

    Após instalar via git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos do Gateway e comandos de CLI. Se o plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Agora o OpenClaw também prefere o ClawHub para especificações simples de plugins seguras para npm. Ele só recorre ao npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para forçar resolução somente pelo npm, por exemplo quando o ClawHub estiver inacessível ou você souber que o pacote existe apenas no npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a API de plugin anunciada / compatibilidade mínima do gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o ClawPack versionado, verifica o cabeçalho de digest do ClawHub e o digest do artefato, depois o instala pelo caminho normal de arquivo. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub e fatos de digest do ClawPack para atualizações posteriores.
Instalações do ClawHub sem versão mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar lançamentos mais recentes do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados a esse seletor.

#### Atalho de marketplace

Use o atalho `plugin@marketplace` quando o nome do marketplace existir no cache de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

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
    - uma raiz de marketplace local ou caminho de `marketplace.json`
    - uma abreviação de repositório do GitHub, como `owner/repo`
    - uma URL de repositório do GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de Plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita fontes de caminho relativo desse repositório e rejeita HTTP(S), caminhos absolutos, git, GitHub e outras fontes de Plugin que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- Plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com o Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com o Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com o Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de Plugins e participam do mesmo fluxo de listagem/informações/habilitação/desabilitação. Hoje, Skills de pacote, command-skills do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks compatíveis do Codex têm suporte; outros recursos de pacote detectados são exibidos em diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
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
  Alterna da visualização em tabela para linhas de detalhes por Plugin com metadados de fonte/origem/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina mais diagnósticos de registro.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de Plugins, com um fallback derivado somente de manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um Plugin está instalado, habilitado e visível para o planejamento de inicialização fria, mas não é uma sondagem de runtime ao vivo de um processo Gateway já em execução. Depois de alterar o código do Plugin, habilitação, política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o processo filho real `openclaw gateway run`, não apenas um processo wrapper.
</Note>

`plugins search` é uma consulta remota ao catálogo ClawHub. Ela não inspeciona o estado local, não altera a configuração, não instala pacotes nem carrega código de runtime de Plugins. Os resultados da busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho em Plugin integrado dentro de uma imagem Docker empacotada, monte com bind o diretório-fonte do Plugin sobre o caminho-fonte empacotado correspondente, como `/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de fonte montada antes de `/app/dist/extensions/synology-chat`; um diretório-fonte simplesmente copiado permanece inerte, portanto instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks de runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou instalar Plugins baixáveis configurados ausentes.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway acessível, dicas de serviço/processo, caminho de configuração e integridade de RPC.
- Hooks de conversa não integrados (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho-fonte em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de Plugins gerenciados, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de Plugins

Os metadados de instalação de Plugins são estado gerenciado por máquina, não configuração de usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável de metadados de instalação, incluindo registros de manifestos de Plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado de manifesto. O arquivo inclui um aviso de não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e o registro frio de Plugins.

Quando o OpenClaw encontra registros legados enviados em `plugins.installs` na configuração, ele os move para o índice de Plugins e remove a chave de configuração; se qualquer uma das gravações falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, do índice persistido de Plugins, de entradas de lista de permissão/bloqueio de Plugins e de entradas vinculadas em `plugins.load.paths` quando aplicável. A menos que `--keep-files` seja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de Plugins do OpenClaw. Para Plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como um alias obsoleto para `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

As atualizações se aplicam a instalações de Plugins rastreadas no índice de Plugins gerenciados e a instalações de pacotes de hooks rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de Plugin vs especificação npm">
    Quando você passa um id de Plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões fixadas exatas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado, atualiza esse Plugin instalado e registra a nova especificação npm para atualizações futuras baseadas em id.

    Passar o nome do pacote npm sem versão ou tag também resolve de volta para o registro de Plugin rastreado. Use isso quando um Plugin estava fixado em uma versão exata e você quer movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de continuar. Auxiliares de atualização não interativos falham de forma fechada, a menos que o chamador forneça uma política de continuação explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da verificação integrada de código perigoso durante atualizações de Plugins. Ele ainda não ignora bloqueios de política `before_install` de Plugins nem bloqueio por falha de verificação, e se aplica apenas a atualizações de Plugins, não a atualizações de pacotes de hooks.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identidade, status de carregamento, fonte, recursos de manifesto, sinalizadores de política, diagnósticos, metadados de instalação, recursos de pacote e qualquer suporte detectado a servidor MCP ou LSP sem importar o runtime do Plugin por padrão. Adicione `--runtime` para carregar o módulo do Plugin e incluir hooks, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP registrados. A inspeção de runtime relata diretamente dependências de Plugin ausentes; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos de CLI pertencentes a Plugins são instalados como grupos de comandos raiz `openclaw`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o como `openclaw <command> ...`; por exemplo, um Plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada Plugin é classificado pelo que ele realmente registra em runtime:

- **capacidade simples** — um tipo de capacidade (por exemplo, um Plugin somente de provedor)
- **capacidade híbrida** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **somente hooks** — apenas hooks, sem capacidades ou superfícies
- **sem capacidade** — ferramentas/comandos/serviços, mas sem capacidades

Veja [Formatos de Plugins](/pt-BR/plugins/architecture#plugin-shapes) para mais sobre o modelo de capacidades.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, recursos de pacote e resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de Plugins é o modelo de leitura fria persistido do OpenClaw para identidade, habilitação, metadados de fonte e propriedade de contribuições de Plugins instalados. A inicialização normal, a busca de proprietário de provedor, a classificação de configuração de canal e o inventário de Plugins podem lê-lo sem importar módulos de runtime de Plugins.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice persistido de Plugins, da política de configuração e de metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação de runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade obsoleta de emergência para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por env é apenas para recuperação emergencial de inicialização enquanto a migração é distribuída.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem do Marketplace aceita um caminho de marketplace local, um caminho de `marketplace.json`, uma abreviação do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da fonte resolvida mais o manifesto de marketplace analisado e as entradas de Plugin.

## Relacionado

- [Criação de Plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
