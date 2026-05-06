---
read_when:
    - Você deseja instalar ou gerenciar Plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas de carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, habilitar/desabilitar, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T17:54:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
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
```

Para investigar instalação, inspeção, desinstalação ou atualização de registro lentas, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O rastreamento grava tempos de fases
em stderr e mantém a saída JSON analisável. Veja [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), mutadores de ciclo de vida de plugins são desabilitados. Use a fonte Nix para esta instalação em vez de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable`; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
Plugins incluídos são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelos incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem distribuir `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) e as capacidades detectadas do bundle.
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

<Warning>
Nomes de pacote simples são instalados do npm por padrão durante a transição de lançamento. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e imprime
nomes de pacote prontos para instalação. Ele pesquisa pacotes code-plugin e bundle-plugin,
não skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. Npm
continua sendo um fallback e caminho de instalação direta compatível. Pacotes de plugins
`@openclaw/*` pertencentes ao OpenClaw voltaram a ser publicados no npm; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou no
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível, depois fazem fallback para `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e reparo de configuração inválida">
    Se sua seção `plugins` for apoiada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` gravará nesse arquivo incluído e deixará `openclaw.json` intocado. Includes raiz, arrays de includes e includes com substituições irmãs falham fechados em vez de serem achatados. Veja [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha fechado e orienta você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway e o hot reload, uma configuração de plugin inválida falha fechada como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar em quarentena a entrada de plugin inválida. A única exceção documentada em tempo de instalação é um caminho restrito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação vs atualização">
    `--force` reutiliza o destino de instalação existente e sobrescreve um plugin ou pacote de hooks já instalado no local. Use quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw interrompe e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma ref git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma fonte fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de origem do marketplace em vez de uma spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo quando o scanner integrado relata achados `critical`, mas **não** ignora bloqueios de política do hook `before_install` do plugin e **não** ignora falhas de varredura.

    Esta flag da CLI se aplica a fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` permanece um fluxo separado de download/instalação de skill do ClawHub.

    Se um plugin que você publicou no ClawHub for bloqueado por uma varredura do registro, use as etapas de publicador em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Pacotes de hooks e specs npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    Specs npm são **somente de registro** (nome do pacote + **versão exata** opcional ou **dist-tag**). Specs Git/URL/file e intervalos semver são rejeitados. Instalações de dependências rodam localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm. Raízes npm de plugins gerenciados herdam os `overrides` npm em nível de pacote do OpenClaw, então pins de segurança do host também se aplicam a dependências de plugin içadas.

    Use `npm:<package>` quando quiser tornar a resolução npm explícita. Specs de pacote simples também são instaladas diretamente do npm durante a transição de lançamento.

    Specs simples e `@latest` permanecem na faixa estável. Versões de correção datadas do OpenClaw, como `2026.5.3-1`, são versões estáveis para esta verificação. Se o npm resolver qualquer uma delas para uma pré-lançamento, o OpenClaw interrompe e pede que você opte explicitamente com uma tag de pré-lançamento como `@beta`/`@rc` ou uma versão exata de pré-lançamento como `@1.2.3-beta.4`.

    Se uma spec de instalação simples corresponder a um id de plugin oficial (por exemplo, `diffs`), o OpenClaw instalará diretamente a entrada do catálogo. Para instalar um pacote npm com o mesmo nome, use uma spec com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório git. Formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e URLs de clone `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações Git clonam em um diretório temporário, fazem checkout da ref solicitada quando presente e então usam o instalador normal de diretório de plugin. Isso significa que validação de manifesto, varredura de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/ref de origem e o commit resolvido para que `openclaw plugins update` possa resolver novamente a fonte depois.

    Depois de instalar a partir de git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros em tempo de execução, como métodos do Gateway e comandos da CLI. Se o plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de plugin nativo do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz do plugin extraído; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    testar o mesmo caminho de instalação de raiz npm gerenciada usado por instalações de registro,
    incluindo verificação de `package-lock.json`, varredura de dependências içadas e
    registros de instalação npm. Caminhos de arquivo simples ainda são instalados como arquivos locais
    sob a raiz de extensões de plugin.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Specs de plugin simples seguras para npm são instaladas do npm por padrão durante a transição de lançamento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar a resolução somente npm explícita:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica a API de plugin anunciada / compatibilidade mínima com o Gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` empacotado pelo npm com versão, verifica o cabeçalho de digest do ClawHub e o digest do artefato e então o instala pelo caminho normal de arquivo. Versões mais antigas do ClawHub sem metadados ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de digest ClawPack para atualizações posteriores.
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
  <Tab title="Origens de marketplace">
    - um nome de marketplace conhecido pelo Claude de `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho para `marketplace.json`
    - um atalho de repositório GitHub, como `owner/repo`
    - uma URL de repositório GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita origens por caminho relativo desse repositório e rejeita origens de plugin HTTP(S), de caminho absoluto, git, GitHub e outras que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos e arquivos locais, o OpenClaw detecta automaticamente:

- plugins OpenClaw nativos (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listagem/informações/ativação/desativação. Hoje, Skills do pacote, Skills de comandos do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifesto, Skills de comandos do Cursor e diretórios de hooks compatíveis com Codex são compatíveis; outras capacidades de pacote detectadas são exibidas em diagnósticos/informações, mas ainda não estão conectadas à execução em runtime.
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
  Mostrar apenas plugins ativados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alternar da visualização em tabela para linhas de detalhes por plugin com metadados de origem/proveniência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos de registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com um fallback derivado apenas do manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um plugin está instalado, ativado e visível ao planejamento de inicialização a frio, mas não é uma sondagem runtime ao vivo de um processo Gateway já em execução. Depois de alterar código de plugin, ativação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho real de `openclaw gateway run`, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada plugin de `package.json`
`dependencies` e `optionalDependencies`. O OpenClaw verifica se esses nomes de pacote
estão presentes ao longo do caminho normal de pesquisa `node_modules` do Node para o plugin; ele
não importa código runtime do plugin, executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

`plugins search` é uma consulta remota ao catálogo do ClawHub. Ela não inspeciona o estado
local, não altera configuração, não instala pacotes nem carrega código runtime de plugin. Os
resultados de busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e
uma dica de instalação como `openclaw plugins install clawhub:<package>`.

Para trabalho em plugin incluído dentro de uma imagem Docker empacotada, monte por bind o diretório
de origem do plugin sobre o caminho de origem empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada
antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado
permanece inerte, então instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção em runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou recuperar plugins baixáveis ausentes que são referenciados pela configuração.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway alcançável, dicas de serviço/processo, caminho de configuração e integridade RPC.
- Hooks de conversa não incluídos (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de plugin gerenciado, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de plugin

Metadados de instalação de plugin são estado gerenciado por máquina, não configuração do usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa `installRecords` de nível superior é a origem durável dos metadados de instalação, incluindo registros de manifestos de plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado do manifesto. O arquivo inclui um aviso de não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e pelo registro frio de plugins.

Quando o OpenClaw vê registros legados enviados em `plugins.installs` na configuração, leituras em runtime os tratam como entrada de compatibilidade sem reescrever `openclaw.json`. Gravações explícitas de plugin e `openclaw doctor --fix` movem esses registros para o índice de plugin e removem a chave de configuração quando gravações de configuração são permitidas; se qualquer uma das gravações falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, do índice persistido de plugins, de entradas de listas de permissão/bloqueio de plugins e de entradas vinculadas em `plugins.load.paths`, quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele fica dentro da raiz de extensões de plugins do OpenClaw. Para plugins de Active Memory, o slot de memória é redefinido para `memory-core`.

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

Atualizações se aplicam a instalações de plugin rastreadas no índice de plugin gerenciado e a instalações de pacotes de hooks rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de plugin versus especificação npm">
    Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação de pacote npm explícita com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também resolve de volta para o registro de plugin rastreado. Use isso quando um plugin foi fixado em uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update` reutiliza a especificação de plugin rastreada, a menos que você passe uma nova especificação. `openclaw update` também conhece o canal ativo de atualização do OpenClaw: no canal beta, registros de plugin npm e ClawHub da linha padrão tentam `@beta` primeiro e depois retornam para a especificação padrão/latest registrada se não existir nenhuma versão beta do plugin. Versões exatas e tags explícitas permanecem fixadas nesse seletor.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade de artefato registrada já corresponderem ao destino resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e solicita confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma fechada, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da verificação interna de código perigoso durante atualizações de plugin. Ele ainda não ignora bloqueios de política `before_install` do plugin nem bloqueio por falha de verificação, e se aplica apenas a atualizações de plugin, não a atualizações de pacotes de hooks.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecionar mostra identidade, estado de carregamento, origem, capacidades do manifesto, flags de política, diagnósticos, metadados de instalação, capacidades de pacote e qualquer suporte detectado a servidores MCP ou LSP sem importar o runtime do plugin por padrão. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP registrados. A inspeção em runtime relata dependências de plugin ausentes diretamente; instalações e reparos ficam em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos CLI pertencentes a plugins são instalados como grupos de comando raiz `openclaw`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o como `openclaw <command> ...`; por exemplo, um plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo, um plugin somente de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — somente hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Veja [formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de capacidades.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, capacidades do pacote e resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Se um plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do carregador, a validação de configuração mantém a entrada do plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de plugin bloqueado, como propriedade de caminho ou permissões graváveis por todos, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exportações `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato das exportações na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo persistido de leitura fria do OpenClaw para identidade de plugins instalados, habilitação, metadados de origem e propriedade de contribuição. A inicialização normal, a consulta do proprietário do provedor, a classificação de configuração de canal e o inventário de plugins podem lê-lo sem importar módulos de runtime de plugins.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice persistido de plugins, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação de runtime.

`openclaw doctor --fix` também repara desvios de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado sob a raiz npm de plugins gerenciados sombrear um plugin incluído no pacote, doctor remove esse pacote obsoleto e reconstrói o registro para que a inicialização valide contra o manifesto incluído no pacote.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade break-glass obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por env serve apenas para recuperação emergencial de inicialização enquanto a migração é implantada.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A lista do Marketplace aceita um caminho de marketplace local, um caminho `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da origem resolvida, além do manifesto de marketplace analisado e das entradas de plugins.

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
