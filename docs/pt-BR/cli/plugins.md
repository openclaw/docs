---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas no carregamento de Plugins
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
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

Para investigar instalações, inspeções, desinstalações ou atualizações de registro lentas, execute o
comando com `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. O trace grava tempos das fases
em stderr e mantém a saída JSON analisável. Consulte [Depuração](/pt-BR/help/debugging#plugin-lifecycle-trace).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), modificadores do ciclo de vida de plugins ficam desabilitados. Use a origem Nix para esta instalação em vez de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable`; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente em primeiro lugar.
</Note>

<Note>
Plugins incluídos são fornecidos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem fornecer `openclaw.plugin.json` com um JSON Schema inline (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo de bundle (`codex`, `claude` ou `cursor`) mais as capacidades de bundle detectadas.
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
Nomes de pacote simples instalam a partir do npm por padrão durante a transição de lançamento. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub por pacotes de plugins instaláveis e imprime
nomes de pacotes prontos para instalação. Ele pesquisa pacotes de code-plugin e bundle-plugin,
não skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo uma alternativa compatível e um caminho de instalação direta. Pacotes de plugins
`@openclaw/*` de propriedade do OpenClaw são publicados no npm novamente; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou o
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível, depois recorrem a `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e reparo de configuração inválida">
    Se a sua seção `plugins` for apoiada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intacto. Includes raiz, arrays de include e includes com substituições irmãs falham de forma fechada em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração estiver inválida durante a instalação, `plugins install` normalmente falha de forma fechada e instrui você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway e recarregamento a quente, configurações de plugin inválidas falham de forma fechada como qualquer outra configuração inválida; `openclaw doctor --fix` pode colocar em quarentena a entrada de plugin inválida. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalar vs atualizar">
    `--force` reutiliza o destino de instalação existente e sobrescreve no lugar um plugin ou pacote de hooks já instalado. Use quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw interrompe e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma origem diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma ref git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma origem fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados de origem do marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo quando o scanner integrado relata achados `critical`, mas **não** contorna bloqueios de política de hook `before_install` do plugin e **não** contorna falhas de varredura.

    Esta flag da CLI se aplica a fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

    Se um plugin que você publicou no ClawHub for bloqueado por uma varredura do registro, use as etapas de publicador em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    Especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou **dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências são executadas localmente ao projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm. Raízes npm de plugins gerenciados herdam os `overrides` npm em nível de pacote do OpenClaw, então pins de segurança do host também se aplicam a dependências de plugins içadas.

    Use `npm:<package>` quando quiser tornar explícita a resolução npm. Especificações de pacote simples também instalam diretamente do npm durante a transição de lançamento.

    Especificações simples e `@latest` permanecem na trilha estável. Versões legadas de correção do OpenClaw, como `2026.5.3-1`, ainda são tratadas como releases estáveis para essa verificação, para que pacotes mais antigos continuem sendo atualizados com segurança. O novo trabalho de linha de suporte mensal está planejado para usar números normais de patch SemVer em vez de sufixos de correção com hífen. Se o npm resolver uma especificação da linha padrão para uma pré-release, o OpenClaw interrompe e pede que você opte explicitamente por uma tag de pré-release, como `@beta`/`@rc`, ou por uma versão exata de pré-release, como `@1.2.3-beta.4`.

    Se uma especificação simples de instalação corresponder a um id oficial de plugin (por exemplo, `diffs`), o OpenClaw instala diretamente a entrada do catálogo. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório git. Formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git` de clone. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações Git clonam para um diretório temporário, fazem checkout da ref solicitada quando presente e então usam o instalador normal de diretório de plugin. Isso significa que validação de manifesto, varredura de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/ref de origem mais o commit resolvido para que `openclaw plugins update` possa resolver novamente a origem depois.

    Depois de instalar a partir de git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros de runtime, como métodos do Gateway e comandos da CLI. Se o plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Use `npm-pack:<path.tgz>` quando o arquivo for um tarball npm-pack e você quiser
    testar o mesmo caminho de instalação de raiz npm gerenciada usado por instalações de registro,
    incluindo verificação de `package-lock.json`, varredura de dependências içadas e
    registros de instalação npm. Caminhos de arquivo simples ainda são instalados como arquivos locais
    sob a raiz de extensões de plugins.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações de plugin simples seguras para npm instalam a partir do npm por padrão durante a transição de lançamento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar explícita a resolução apenas por npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica a API de plugin anunciada / compatibilidade mínima do Gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` versionado de pacote npm, verifica o cabeçalho de digest do ClawHub e o digest do artefato, e então o instala pelo caminho normal de arquivo compactado. Versões mais antigas do ClawHub sem metadados de ClawPack ainda são instaladas pelo caminho legado de verificação de arquivo compactado de pacote. Instalações registradas mantêm os metadados de origem do ClawHub, o tipo de artefato, a integridade npm, o shasum npm, o nome do tarball e os fatos de digest do ClawPack para atualizações posteriores.
Instalações não versionadas do ClawHub mantêm uma especificação registrada não versionada para que `openclaw plugins update` possa acompanhar lançamentos mais novos do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados a esse seletor.

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
  <Tab title="Origens de marketplace">
    - um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho de `marketplace.json`
    - uma abreviação de repositório GitHub, como `owner/repo`
    - uma URL de repositório GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita HTTP(S), caminhos absolutos, git, GitHub e outras origens de plugin que não sejam caminhos em manifests remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listar/informações/habilitar/desabilitar. Hoje, há suporte para Skills de pacote, command-skills do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifest, command-skills do Cursor e diretórios de hooks compatíveis do Codex; outros recursos de pacote detectados são mostrados em diagnósticos/informações, mas ainda não estão conectados à execução em runtime.
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
  Alterna da visualização em tabela para linhas de detalhe por plugin com metadados de origem/procedência/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos de registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com um fallback derivado apenas de manifest quando o registro está ausente ou inválido. Ele é útil para verificar se um plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sondagem de runtime em tempo real de um processo Gateway já em execução. Após alterar código de plugin, habilitação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o processo filho real de `openclaw gateway run`, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada plugin a partir de
`dependencies` e `optionalDependencies` do `package.json`. O OpenClaw verifica se esses nomes de pacote estão presentes ao longo do caminho normal de consulta `node_modules` do Node do plugin; ele não importa código de runtime do plugin, não executa um gerenciador de pacotes nem repara dependências ausentes.
</Note>

`plugins search` é uma consulta remota ao catálogo do ClawHub. Ela não inspeciona o estado local, não altera config, não instala pacotes nem carrega código de runtime de plugin. Os resultados de busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho em plugin integrado dentro de uma imagem Docker empacotada, monte por bind o diretório de origem do plugin sobre o caminho de origem empacotado correspondente, como `/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de origem montada antes de `/app/dist/extensions/synology-chat`; um diretório de origem simplesmente copiado permanece inerte, de modo que instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção de runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou recuperar plugins baixáveis ausentes que são referenciados pela config.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway acessível, dicas de serviço/processo, caminho de config e integridade de RPC.
- Hooks de conversa não integrados (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice gerenciado de plugins, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de plugins

Metadados de instalação de plugin são estado gerenciado por máquina, não config de usuário. Instalações e atualizações os gravam em `plugins/installs.json` sob o diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável de metadados de instalação, incluindo registros de manifests de plugin quebrados ou ausentes. O array `plugins` é o cache de registro a frio derivado de manifest. O arquivo inclui um aviso para não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e o registro de plugins a frio.

Quando o OpenClaw vê registros legados enviados em `plugins.installs` na config, as leituras de runtime os tratam como entrada de compatibilidade sem reescrever `openclaw.json`. Gravações explícitas de plugin e `openclaw doctor --fix` movem esses registros para o índice de plugins e removem a chave de config quando gravações de config são permitidas; se qualquer gravação falhar, os registros de config são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, do índice persistido de plugins, de entradas de listas de permissão/negação de plugin e de entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório rastreado de instalação gerenciada quando ele está dentro da raiz de extensões de plugins do OpenClaw. Para plugins de Active Memory, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é aceito como um alias obsoleto para `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações rastreadas de plugin no índice gerenciado de plugins e a instalações rastreadas de hook-pack em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolver id de plugin vs especificação npm">
    Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem versão ou tag também resolve de volta para o registro de plugin rastreado. Use isso quando um plugin foi fixado a uma versão exata e você quer movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update` reutiliza a especificação de plugin rastreada, a menos que você passe uma nova especificação. `openclaw update` também conhece o canal ativo de atualização do OpenClaw: no canal beta, registros de plugin npm e ClawHub da linha padrão tentam `@beta` primeiro e depois recorrem à especificação padrão/latest registrada se não existir lançamento beta do plugin. Versões exatas e tags explícitas permanecem fixadas a esse seletor.

    O OpenClaw ainda não expõe canais de plugin LTS ou de suporte mensal. O trabalho planejado de linha de suporte precisará que tags de pacote de plugin e do ClawHub sigam a mesma linha de suporte que o pacote principal.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm em tempo real, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade de artefato registrada já corresponderem ao destino resolvido, a atualização é ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma fechada, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da varredura integrada de código perigoso durante atualizações de plugin. Ele ainda não contorna bloqueios de política `before_install` de plugin nem bloqueios por falha de varredura, e só se aplica a atualizações de plugin, não a atualizações de hook-pack.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

A inspeção mostra identidade, status de carregamento, origem, recursos do manifest, flags de política, diagnósticos, metadados de instalação, recursos de pacote e qualquer suporte detectado a servidor MCP ou LSP sem importar o runtime do plugin por padrão. Adicione `--runtime` para carregar o módulo do plugin e incluir hooks registrados, ferramentas, comandos, serviços, métodos de Gateway e rotas HTTP. A inspeção de runtime relata dependências ausentes de plugin diretamente; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos CLI pertencentes a plugins são instalados como grupos de comando raiz `openclaw`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o como `openclaw <command> ...`; por exemplo, um plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo, um plugin somente de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de capacidades.

<Note>
A flag `--json` gera um relatório legível por máquina, adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, capacidades do pacote e resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Se um plugin configurado estiver presente no disco, mas bloqueado pelas verificações de segurança de caminho do loader, a validação da configuração mantém a entrada do plugin e a relata como `present but blocked`. Corrija o diagnóstico anterior de plugin bloqueado, como propriedade do caminho ou permissões graváveis por todos, em vez de remover a configuração `plugins.entries.<id>` ou `plugins.allow`.

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato dos exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo persistido de leitura fria do OpenClaw para identidade de plugins instalados, habilitação, metadados de origem e propriedade de contribuições. A inicialização normal, a busca do proprietário do provedor, a classificação da configuração de canais e o inventário de plugins podem lê-lo sem importar módulos de runtime de plugins.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou desatualizado. Use `--refresh` para reconstruí-lo a partir do índice persistido de plugins, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em runtime.

`openclaw doctor --fix` também repara desvios de npm gerenciado adjacentes ao registro: se um pacote `@openclaw/*` órfão ou recuperado sob a raiz npm gerenciada de plugins ocultar um plugin incluído no pacote, o doctor remove esse pacote obsoleto e reconstrói o registro para que a inicialização valide contra o manifesto incluído no pacote.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade emergencial obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por variável de ambiente é apenas para recuperação emergencial de inicialização enquanto a migração é implantada.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem do marketplace aceita um caminho de marketplace local, um caminho `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo de origem resolvido mais o manifesto do marketplace analisado e as entradas de plugins.

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
