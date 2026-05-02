---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas de carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T22:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
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
Plugins incluídos são distribuídos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem distribuir `openclaw.plugin.json` com um JSON Schema embutido (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo de bundle (`codex`, `claude` ou `cursor`), além dos recursos de bundle detectados.
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
Nomes de pacote simples instalam a partir do npm por padrão durante a transição de lançamento. Use `clawhub:<package>` para o ClawHub. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e imprime
nomes de pacote prontos para instalação. Ele pesquisa pacotes de plugin de código e de plugin de bundle,
não Skills. Use `openclaw skills search` para Skills do ClawHub.

<Note>
O ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo um fallback e caminho de instalação direta compatível. Pacotes de plugins
`@openclaw/*` pertencentes ao OpenClaw são publicados no npm novamente; veja a lista atual
em [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou no
[inventário de plugins](/pt-BR/plugins/plugin-inventory). Instalações estáveis usam `latest`.
Instalações e atualizações do canal beta preferem a dist-tag `beta` do npm quando essa tag
está disponível e, em seguida, fazem fallback para `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e recuperação de configuração inválida">
    Se sua seção `plugins` for apoiada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` gravam nesse arquivo incluído e deixam `openclaw.json` intocado. Includes raiz, arrays de includes e includes com substituições irmãs falham de forma fechada em vez de achatar. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha de forma fechada e orienta você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway, a configuração inválida de um plugin é isolada a esse plugin para que outros canais e plugins possam continuar em execução; `openclaw doctor --fix` pode colocar a entrada inválida do plugin em quarentena. A única exceção documentada em tempo de instalação é um caminho restrito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalar versus atualizar">
    `--force` reutiliza o destino de instalação existente e substitui no local um plugin ou pacote de hooks já instalado. Use-o quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo, pacote ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw interrompe e direciona você para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser substituir a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` aplica-se apenas a instalações npm. Ele não é compatível com instalações `git:`; use uma ref git explícita, como `git:github.com/acme/plugin@v1.2.3`, quando quiser uma fonte fixada. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados da fonte de marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no verificador integrado de código perigoso. Ela permite que a instalação continue mesmo quando o verificador integrado relata achados `critical`, mas **não** contorna bloqueios de política de hook `before_install` de plugins e **não** contorna falhas de verificação.

    Essa flag da CLI aplica-se aos fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

    Se um plugin que você publicou no ClawHub for bloqueado por uma verificação do registro, use as etapas para publicadores em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    Especificações npm são **somente registro** (nome do pacote + **versão exata** ou **dist-tag** opcional). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências são executadas localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm.

    Use `npm:<package>` quando quiser tornar a resolução npm explícita. Especificações de pacote simples também instalam diretamente do npm durante a transição de lançamento.

    Especificações simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw interrompe e pede que você opte explicitamente por uma tag de pré-versão, como `@beta`/`@rc`, ou por uma versão exata de pré-versão, como `@1.2.3-beta.4`.

    Se uma especificação de instalação simples corresponder a um id de plugin oficial (por exemplo, `diffs`), o OpenClaw instala a entrada do catálogo diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Repositórios Git">
    Use `git:<repo>` para instalar diretamente de um repositório git. Os formatos compatíveis incluem `git:github.com/owner/repo`, `git:owner/repo`, URLs completas `https://`, `ssh://`, `git://`, `file://` e URLs de clone `git@host:owner/repo.git`. Adicione `@<ref>` ou `#<ref>` para fazer checkout de uma branch, tag ou commit antes da instalação.

    Instalações Git clonam em um diretório temporário, fazem checkout da ref solicitada quando presente e, então, usam o instalador normal de diretório de plugin. Isso significa que validação de manifesto, verificação de código perigoso, trabalho de instalação do gerenciador de pacotes e registros de instalação se comportam como instalações npm. Instalações git registradas incluem a URL/ref de origem mais o commit resolvido, para que `openclaw plugins update` possa resolver novamente a origem mais tarde.

    Depois de instalar a partir de git, use `openclaw plugins inspect <id> --runtime --json` para verificar registros em runtime, como métodos de Gateway e comandos da CLI. Se o plugin registrou uma raiz de CLI com `api.registerCli`, execute esse comando diretamente pela CLI raiz do OpenClaw, por exemplo `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz do plugin extraído; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações pelo ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Especificações de plugins simples seguras para npm instalam a partir do npm por padrão durante a transição de lançamento:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para tornar a resolução somente npm explícita:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw verifica a API de plugin anunciada / compatibilidade mínima com o gateway antes da instalação. Quando a versão selecionada do ClawHub publica um artefato ClawPack, o OpenClaw baixa o `.tgz` versionado do pacote npm, verifica o cabeçalho de resumo do ClawHub e o resumo do artefato e, então, instala pelo caminho normal de arquivo. Versões mais antigas do ClawHub sem metadados ClawPack ainda instalam pelo caminho legado de verificação de arquivo de pacote. Instalações registradas mantêm seus metadados de origem do ClawHub, tipo de artefato, integridade npm, shasum npm, nome do tarball e fatos de resumo ClawPack para atualizações posteriores.
Instalações não versionadas do ClawHub mantêm uma especificação registrada não versionada para que `openclaw plugins update` possa acompanhar versões mais novas do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados a esse seletor.

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
  <Tab title="Fontes do marketplace">
    - um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho `marketplace.json`
    - um atalho de repositório GitHub, como `owner/repo`
    - uma URL de repositório GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de Plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita fontes de caminho relativo desse repositório e rejeita HTTP(S), caminhos absolutos, git, GitHub e outras fontes de Plugin que não sejam caminhos em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos e arquivos locais, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com o Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com o Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- pacotes compatíveis com o Cursor (`.cursor-plugin/plugin.json`)

<Note>
Pacotes compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de listar/info/ativar/desativar. Hoje, há suporte a Skills de pacote, command-skills do Claude, padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude / `lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks compatíveis com o Codex; outras capacidades de pacote detectadas aparecem em diagnósticos/info, mas ainda não estão conectadas à execução em runtime.
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
  Alterna da visualização em tabela para linhas de detalhes por Plugin com metadados de fonte/origem/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina, além de diagnósticos do registro e estado de instalação de dependências de pacote.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com uma alternativa derivada apenas de manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um Plugin está instalado, ativado e visível para o planejamento de inicialização fria, mas não é uma sondagem em runtime ao vivo de um processo Gateway já em execução. Depois de alterar código de Plugin, ativação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o filho real de `openclaw gateway run`, não apenas um processo wrapper.

`plugins list --json` inclui o `dependencyStatus` de cada Plugin a partir de
`dependencies` e `optionalDependencies` de `package.json`. O OpenClaw verifica se esses nomes de pacote
estão presentes ao longo do caminho normal de lookup de `node_modules` do Node para o Plugin; ele
não importa código de runtime do Plugin, executa um gerenciador de pacotes nem repara
dependências ausentes.
</Note>

`plugins search` é uma consulta ao catálogo remoto do ClawHub. Ela não inspeciona o estado local, não altera a configuração, não instala pacotes nem carrega código de runtime do Plugin. Os resultados da busca incluem o nome do pacote ClawHub, família, canal, versão, resumo e uma dica de instalação, como `openclaw plugins install clawhub:<package>`.

Para trabalho com Plugin incluído em uma imagem Docker empacotada, monte por bind o diretório de código-fonte do Plugin sobre o caminho de código-fonte empacotado correspondente, como `/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de fonte montada antes de `/app/dist/extensions/synology-chat`; um diretório de fonte simplesmente copiado permanece inerte, então instalações empacotadas normais continuam usando o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado. A inspeção em runtime nunca instala dependências; use `openclaw doctor --fix` para limpar estado legado de dependências ou instalar plugins baixáveis configurados que estejam ausentes.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway alcançável, dicas de serviço/processo, caminho de configuração e integridade de RPC.
- Hooks de conversa não incluídos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um alvo de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de Plugin gerenciado, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de Plugin

Os metadados de instalação de Plugin são estado gerenciado pela máquina, não configuração do usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável dos metadados de instalação, incluindo registros de manifestos de Plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado do manifesto. O arquivo inclui um aviso para não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e o registro frio de plugins.

Quando o OpenClaw encontra registros legados entregues em `plugins.installs` na configuração, ele os move para o índice de Plugin e remove a chave de configuração; se qualquer gravação falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, do índice de Plugin persistido, entradas de lista de permissões/bloqueios de Plugin e entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de Plugin do OpenClaw. Para plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

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

Atualizações se aplicam a instalações de Plugin rastreadas no índice de Plugin gerenciado e a instalações de hook-pack rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução de id de Plugin vs especificação npm">
    Quando você passa um id de Plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado, atualiza esse Plugin instalado e registra a nova especificação npm para atualizações futuras baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também resolve de volta para o registro de Plugin rastreado. Use isso quando um Plugin estava fixado a uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Atualizações do canal beta">
    `openclaw plugins update` reutiliza a especificação de Plugin rastreada, a menos que você passe uma nova especificação. `openclaw update` também conhece o canal de atualização ativo do OpenClaw: no canal beta, registros de Plugin npm e ClawHub da linha padrão tentam `@beta` primeiro e depois recorrem à especificação padrão/latest registrada se não existir lançamento beta do Plugin. Versões exatas e tags explícitas permanecem fixadas a esse seletor.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao alvo resolvido, a atualização é ignorada sem baixar, reinstalar ou regravar `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de continuar. Auxiliares de atualização não interativos falham fechados, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install em update">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da verificação integrada de código perigoso durante atualizações de Plugin. Ele ainda não ignora bloqueios de política `before_install` do Plugin nem bloqueio por falha de verificação, e se aplica apenas a atualizações de Plugin, não a atualizações de hook-pack.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

A inspeção mostra identidade, status de carregamento, fonte, capacidades do manifesto, sinalizadores de política, diagnósticos, metadados de instalação, capacidades de pacote e qualquer suporte detectado a servidores MCP ou LSP sem importar o runtime do Plugin por padrão. Adicione `--runtime` para carregar o módulo do Plugin e incluir hooks, ferramentas, comandos, serviços, métodos do Gateway e rotas HTTP registrados. A inspeção em runtime relata dependências ausentes do Plugin diretamente; instalações e reparos permanecem em `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

Comandos de CLI pertencentes ao Plugin são instalados como grupos de comandos raiz `openclaw`. Depois que `inspect --runtime` mostrar um comando em `cliCommands`, execute-o como `openclaw <command> ...`; por exemplo, um Plugin que registra `demo-git` pode ser verificado com `openclaw demo-git ping`.

Cada Plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo, um Plugin somente de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — somente hooks, sem capacidades ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para saber mais sobre o modelo de capacidades.

<Note>
O sinalizador `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, capacidades de pacote e resumo de hooks. `info` é um alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugin, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo de leitura fria persistido do OpenClaw para identidade de Plugin instalado, ativação, metadados de fonte e propriedade de contribuição. A inicialização normal, lookup de proprietário de provedor, classificação de configuração de canal e inventário de plugins podem lê-lo sem importar módulos de runtime de Plugin.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice de Plugin persistido, política de configuração e metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma opção de compatibilidade emergencial obsoleta para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback de env é apenas para recuperação emergencial da inicialização enquanto a migração é implantada.
</Warning>

### Mercado

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem do mercado aceita um caminho de mercado local, um caminho para `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo da origem resolvida, além do manifesto de mercado analisado e das entradas de Plugin.

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
