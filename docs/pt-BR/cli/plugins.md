---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas no carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:26:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie Plugins do Gateway, pacotes de hooks e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de Plugin" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre instalação, ativação e solução de problemas de plugins.
  </Card>
  <Card title="Gerenciar plugins" href="/pt-BR/plugins/manage-plugins">
    Exemplos rápidos para instalar, listar, atualizar, desinstalar e publicar.
  </Card>
  <Card title="Bundles de Plugins" href="/pt-BR/plugins/bundles">
    Modelo de compatibilidade de bundles.
  </Card>
  <Card title="Manifesto do Plugin" href="/pt-BR/plugins/manifest">
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
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O trace grava tempos de fase
em stderr e mantém a saída JSON analisável. Veja [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), mutadores de ciclo de vida de plugins ficam desativados. Use a origem Nix para esta instalação em vez de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable`; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente em primeiro lugar.
</Note>

<Note>
Plugins incluídos são distribuídos com o OpenClaw. Alguns são ativados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem distribuir `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`), além das capacidades de bundle detectadas.
</Note>

### Instalar

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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

Mantenedores que testam instalações em tempo de configuração podem substituir automaticamente as origens de instalação de plugins com variáveis de ambiente protegidas. Veja
[Substituições de instalação de plugins](/pt-BR/plugins/install-overrides).

<Warning>
Nomes de pacotes simples instalam do npm por padrão durante a transição de lançamento. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e imprime
nomes de pacotes prontos para instalação. Ele pesquisa pacotes code-plugin e bundle-plugin,
não Skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
O ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo uma alternativa compatível e um caminho de instalação direta. Pacotes de plugins
`@openclaw/*` pertencentes ao OpenClaw voltaram a ser publicados no npm; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou no
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível, depois recorrem a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e reparo de configuração inválida">
    Se sua seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intocado. Includes na raiz, arrays de includes e includes com substituições irmãs falham fechados em vez de serem achatados. Veja [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração estiver inválida durante a instalação, `plugins install` normalmente falha fechado e informa que você deve executar `openclaw doctor --fix` primeiro. Durante a inicialização e o recarregamento automático do Gateway, uma configuração de plugin inválida falha fechada como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar a entrada de plugin inválida em quarentena. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalar versus atualizar">
    `--force` reutiliza o destino de instalação existente e sobrescreve no local um plugin ou pacote de hooks já instalado. Use quando estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para atualizações rotineiras de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw para e aponta você para `plugins update <id-or-npm-spec>` para uma atualização normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma origem diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma referência git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma origem fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de origem de marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no scanner de código perigoso integrado. Ela permite que a instalação continue mesmo quando o scanner integrado relata achados `critical`, mas **não** ignora bloqueios de política de hooks `before_install` do plugin e **não** ignora falhas de varredura.

    Esta flag de CLI se aplica a fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

    Se um plugin que você publicou no ClawHub for bloqueado por uma varredura de registro, use as etapas para publicadores em [ClawHub](/pt-BR/clawhub/security).

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e ativação por hook, não para instalação de pacote.

    Especificações npm são **somente de registro** (nome do pacote + **versão exata** ou **dist-tag** opcional). Especificações git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências executam localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm. Raízes npm gerenciadas de plugins herdam os `overrides` npm no nível de pacote do OpenClaw, portanto os pins de segurança do host também se aplicam a dependências içadas de plugins.

    Use `npm:<package>` quando quiser tornar explícita a resolução npm. Especificações de pacote simples também instalam diretamente do npm durante a transição de lançamento.

    Especificações simples e `@latest` permanecem na trilha estável. Versões de correção datadas do OpenClaw, como `2026.5.3-1`, são versões estáveis para esta verificação. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw para e pede que você opte explicitamente com uma tag de pré-versão, como `@beta`/`@rc`, ou uma versão de pré-lançamento exata, como `@1.2.3-beta.4`.

    Se uma especificação de instalação simples corresponder a um id de plugin oficial (por exemplo, `diffs`), o OpenClaw instala a entrada do catálogo diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios git">
    Use `git:<repo>` para instalar diretamente de um repositório git. Formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e URLs de clone `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações git clonam para um diretório temporário, fazem checkout da referência solicitada quando presente e então usam o instalador normal de diretório de plugin. Isso significa que validação de manifesto, varredura de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/referência de origem mais o commit resolvido para que `openclaw plugins update` possa resolver novamente a origem mais tarde.

    Depois de instalar a partir do git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros em runtime, como métodos de gateway e comandos de CLI. Se o plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de Plugin nativo do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    testar o mesmo caminho gerenciado de instalação de raiz npm usado por instalações de registro,
    incluindo verificação de `package-lock.json`, varredura de dependências içadas e
    registros de instalação npm. Caminhos de arquivo simples ainda instalam como arquivos locais
    sob a raiz de extensões de plugins.

    Instalações de marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações de plugin simples e seguras para npm instalam do npm por padrão durante a transição de lançamento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução somente npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica a API de plugin anunciada / a compatibilidade mínima do gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` npm-pack versionado, verifica o cabeçalho de digest do ClawHub e o digest do artefato e então o instala pelo caminho normal de arquivo. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de digest ClawPack para atualizações posteriores.
Instalações ClawHub sem versão mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar versões mais novas do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

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
  <Tab title="Origens de marketplace">
    - um nome de marketplace conhecido pelo Claude de `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho de `marketplace.json`
    - um atalho de repositório GitHub, como `owner/repo`
    - uma URL de repositório GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita HTTP(S), caminhos absolutos, git, GitHub e outras origens de plugin que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componente do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listagem/informações/ativação/desativação. Hoje, Skills de pacote, command-skills do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` / `lspServers` declarados em manifesto do Claude, command-skills do Cursor e diretórios de hooks compatíveis do Codex são compatíveis; outras capacidades de pacote detectadas são exibidas em diagnósticos/informações, mas ainda não estão conectadas à execução em runtime.
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
  Mostra somente plugins ativados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alterna da visualização em tabela para linhas de detalhes por plugin com metadados de origem/origem inicial/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina mais diagnósticos de registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com um fallback derivado somente de manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um plugin está instalado, ativado e visível ao planejamento de inicialização a frio, mas não é uma sondagem de runtime ativa de um processo Gateway já em execução. Depois de alterar código de plugin, ativação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho `openclaw gateway run` real, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada plugin a partir de
`dependencies` e `optionalDependencies` em `package.json`. O OpenClaw verifica se esses nomes de pacote
estão presentes ao longo do caminho normal de lookup `node_modules` do Node para o plugin; ele
não importa código de runtime do plugin, não executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

`plugins search` é uma consulta remota ao catálogo ClawHub. Ela não inspeciona o estado
local, não modifica configuração, não instala pacotes nem carrega código de runtime do plugin. Os
resultados de busca incluem o nome de pacote ClawHub, família, canal, versão, resumo e
uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho em plugins empacotados dentro de uma imagem Docker empacotada, monte por bind o diretório
de origem do plugin sobre o caminho de origem empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada
antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado
permanece inerte, então instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou recuperar plugins baixáveis ausentes que são referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway alcançável, dicas de serviço/processo, caminho de configuração e saúde RPC.
- Hooks de conversa não empacotados (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de plugins gerenciado, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de plugins

Metadados de instalação de plugins são estado gerenciado por máquina, não configuração de usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa `installRecords` de nível superior é a fonte durável de metadados de instalação, incluindo registros de manifestos de plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado de manifesto. O arquivo inclui um aviso para não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e pelo registro frio de plugins.

Quando o OpenClaw vê registros legados enviados em `plugins.installs` na configuração, leituras de runtime os tratam como entrada de compatibilidade sem reescrever `openclaw.json`. Gravações explícitas de plugin e `openclaw doctor --fix` movem esses registros para o índice de plugins e removem a chave de configuração quando gravações de configuração são permitidas; se qualquer uma das gravações falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, do índice persistido de plugins, de entradas de lista de permissões/negações de plugin e de entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de plugin do OpenClaw. Para plugins de Active Memory, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como um alias obsoleto para `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações de plugins rastreadas no índice gerenciado de plugins e a instalações de hook-packs rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução de id de plugin vs especificação npm">
    Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões fixadas exatas continuam a ser usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também resolve de volta para o registro de plugin rastreado. Use isso quando um plugin foi fixado em uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações de canal beta">
    `openclaw plugins update` reutiliza a especificação de plugin rastreada, a menos que você passe uma nova especificação. `openclaw update` também conhece o canal de atualização ativo do OpenClaw: no canal beta, registros de plugin npm e ClawHub da linha padrão tentam `@beta` primeiro e depois fazem fallback para a especificação padrão/latest registrada se não existir uma versão beta do plugin. Esse fallback é relatado como aviso e não faz a atualização do núcleo falhar. Versões exatas e tags explícitas permanecem fixadas nesse seletor.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ativa, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade de artefato registrada já corresponderem ao alvo resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma fechada, a menos que o chamador forneça uma política de continuação explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install em update">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da varredura integrada de código perigoso durante atualizações de plugin. Ele ainda não contorna bloqueios de política `before_install` de plugin nem bloqueios por falha de varredura, e se aplica apenas a atualizações de plugin, não a atualizações de hook-pack.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

A inspeção mostra identidade, status de carregamento, origem, capacidades de manifesto, flags de política, diagnósticos, metadados de instalação, capacidades de pacote e qualquer suporte detectado a servidor MCP ou LSP sem importar o runtime do plugin por padrão. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks, ferramentas, comandos, serviços, métodos de gateway e rotas HTTP registrados. A inspeção de runtime relata dependências de plugin ausentes diretamente; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos CLI pertencentes a plugins geralmente são instalados como grupos de comandos raiz de `openclaw`, mas plugins também podem registrar comandos aninhados sob um pai do núcleo, como `openclaw nodes`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o no caminho listado; por exemplo, um plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado pelo que realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo, um plugin somente de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de plugin](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de capacidades.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com formato, tipos de capacidade, avisos de compatibilidade, capacidades de bundle e colunas de resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está correto, ele imprime `No plugin issues detected.`

Se um plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do loader, a validação da configuração mantém a entrada do plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de plugin bloqueado, como propriedade do caminho ou permissões graváveis por todos, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exportação na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo persistido de leitura fria do OpenClaw para identidade de plugins instalados, habilitação, metadados de origem e propriedade de contribuições. A inicialização normal, a consulta de proprietário de provedor, a classificação de configuração de canal e o inventário de plugins podem lê-lo sem importar módulos de runtime de plugins.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice persistido de plugins, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em runtime.

`openclaw doctor --fix` também repara desvios de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado sob a raiz npm gerenciada de plugins sombrear um plugin em bundle, o doctor remove esse pacote obsoleto e reconstrói o registro para que a inicialização valide contra o manifesto em bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade break-glass obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback de env é apenas para recuperação emergencial de inicialização enquanto a migração é implementada.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A lista do marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo de origem resolvido, além do manifesto de marketplace analisado e das entradas de plugins.

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [ClawHub](/pt-BR/clawhub)
