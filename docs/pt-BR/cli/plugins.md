---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas no carregamento de Plugin
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T09:42:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Gerencie Plugins do Gateway, pacotes de hooks e bundles compatíveis.

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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
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

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de lista/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) mais as capacidades de bundle detectadas.
</Note>

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nomes de pacote sem prefixo são verificados primeiro no ClawHub e depois no npm. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

<Note>
ClawHub é a principal superfície de distribuição e descoberta para a maioria dos plugins. O npm
continua sendo um fallback compatível e um caminho de instalação direta. Durante a migração para o
ClawHub, o OpenClaw ainda distribui alguns pacotes de plugin `@openclaw/*` pertencentes ao OpenClaw
no npm; essas versões de pacote podem ficar atrás do código-fonte incluído entre trens de lançamento
de plugins. Se o npm reportar um pacote de plugin pertencente ao OpenClaw como obsoleto, essa
versão publicada é um artefato externo antigo; use o plugin incluído no
OpenClaw atual ou um checkout local até que um pacote npm mais novo seja publicado.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuração e recuperação de configuração inválida">
    Se a sua seção `plugins` for baseada em um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intocado. Includes na raiz, arrays de includes e includes com substituições irmãs falham fechados em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

    Se a configuração for inválida durante a instalação, `plugins install` normalmente falha fechado e orienta você a executar `openclaw doctor --fix` primeiro. Durante a inicialização do Gateway, a configuração inválida de um plugin é isolada para esse plugin, para que outros canais e plugins possam continuar em execução; `openclaw doctor --fix` pode colocar a entrada inválida do plugin em quarentena. A única exceção documentada em tempo de instalação é um caminho estreito de recuperação de plugin incluído para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação vs. atualização">
    `--force` reutiliza o destino de instalação existente e sobrescreve um plugin ou pacote de hooks já instalado no local. Use quando você estiver reinstalando intencionalmente o mesmo id de um novo caminho local, arquivo, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw para e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Ele não é compatível com `--marketplace`, porque instalações de marketplace persistem metadados da fonte do marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo quando o scanner integrado reporta achados `critical`, mas **não** contorna bloqueios de política do hook `before_install` do plugin e **não** contorna falhas de varredura.

    Essa flag da CLI se aplica aos fluxos de instalação/atualização de plugins. Instalações de dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills pelo ClawHub.

    Se um plugin que você publicou no ClawHub for bloqueado por uma varredura de registro, use as etapas de publicador em [ClawHub](/pt-BR/tools/clawhub).

  </Accordion>
  <Accordion title="Pacotes de hooks e especificações npm">
    `plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

    Especificações npm são **somente de registro** (nome do pacote + **versão exata** ou **dist-tag** opcional). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências são executadas localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação npm.

    Use `npm:<package>` quando quiser pular a consulta ao ClawHub e instalar diretamente do npm. Especificações de pacote sem prefixo ainda preferem o ClawHub e só voltam para o npm quando o ClawHub não tem esse pacote ou versão.

    Especificações sem prefixo e `@latest` permanecem na trilha estável. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw para e pede que você opte explicitamente por uma tag de pré-versão, como `@beta`/`@rc`, ou por uma versão de pré-lançamento exata, como `@1.2.3-beta.4`.

    Se uma especificação de instalação sem prefixo corresponder a um id de plugin incluído (por exemplo, `diffs`), o OpenClaw instalará o plugin incluído diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo, `@scope/diffs`).

  </Accordion>
  <Accordion title="Arquivos">
    Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz extraída do plugin; arquivos que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Instalações do marketplace Claude também são compatíveis.

  </Accordion>
</AccordionGroup>

Instalações pelo ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

O OpenClaw agora também prefere o ClawHub para especificações de plugin compatíveis com npm sem prefixo. Ele só volta para o npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

Use `npm:` para forçar a resolução somente via npm, por exemplo quando o ClawHub estiver inacessível ou você souber que o pacote existe apenas no npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

O OpenClaw baixa o arquivo do pacote do ClawHub, verifica a API de plugin anunciada / compatibilidade mínima com o gateway e então o instala pelo caminho normal de arquivo. Instalações registradas mantêm os metadados de fonte do ClawHub para atualizações posteriores.
Instalações do ClawHub sem versão mantêm uma especificação registrada sem versão para que `openclaw plugins update` possa acompanhar lançamentos mais novos do ClawHub; seletores explícitos de versão ou tag, como `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, permanecem fixados nesse seletor.

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
  <Tab title="Fontes de marketplace">
    - um nome de marketplace conhecido do Claude de `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho `marketplace.json`
    - um atalho de repositório do GitHub, como `owner/repo`
    - uma URL de repositório do GitHub, como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer dentro do repositório de marketplace clonado. O OpenClaw aceita fontes de caminho relativo desse repositório e rejeita fontes de plugin HTTP(S), de caminho absoluto, git, GitHub e outras que não sejam de caminho em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- bundles compatíveis com Codex (`.codex-plugin/plugin.json`)
- bundles compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- bundles compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundles compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de lista/info/habilitar/desabilitar. Hoje, Skills de bundle, command-skills do Claude, padrões `settings.json` do Claude, padrões `.lsp.json` / `lspServers` declarados no manifesto do Claude, command-skills do Cursor e diretórios de hooks compatíveis com Codex são compatíveis; outras capacidades de bundle detectadas são mostradas em diagnósticos/info, mas ainda não estão conectadas à execução em runtime.
</Note>

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Mostra apenas plugins habilitados.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Alterna da visualização em tabela para linhas de detalhes por plugin com metadados de fonte/origem/versão/ativação.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina mais diagnósticos de registro.
</ParamField>

<Note>
`plugins list` lê primeiro o registro local persistido de plugins, com uma alternativa derivada apenas do manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sondagem em tempo de execução ao vivo de um processo Gateway já em execução. Depois de alterar código de plugin, habilitação, política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende ao canal antes de esperar que novo código `register(api)` ou novos hooks sejam executados. Para implantações remotas/em contêiner, verifique se você está reiniciando o processo filho real `openclaw gateway run`, não apenas um processo wrapper.
</Note>

Para trabalho em plugin incluído dentro de uma imagem Docker empacotada, monte por bind o diretório
de código-fonte do plugin sobre o caminho de código-fonte empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobrirá essa sobreposição de código-fonte montada
antes de `/app/dist/extensions/synology-chat`; um diretório de código-fonte simplesmente copiado
permanece inerte, então instalações empacotadas normais ainda usam o dist compilado.

Para depuração de hooks em tempo de execução:

- `openclaw plugins inspect <id> --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway alcançável, dicas de serviço/processo, caminho de configuração e integridade de RPC.
- Hooks de conversa não incluídos (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de plugins gerenciados, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de Plugin

Metadados de instalação de plugins são estado gerenciado pela máquina, não configuração do usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável de metadados de instalação, incluindo registros de manifestos de plugin quebrados ou ausentes. O array `plugins` é o cache de registro frio derivado do manifesto. O arquivo inclui um aviso para não editar e é usado por `openclaw plugins update`, desinstalação, diagnósticos e pelo registro frio de plugins.

Quando o OpenClaw encontra registros legados enviados em `plugins.installs` na configuração, ele os move para o índice de plugins e remove a chave de configuração; se qualquer gravação falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Dependências de tempo de execução

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` inspeciona o estágio de dependências de tempo de execução empacotadas para plugins incluídos pertencentes ao OpenClaw selecionados pela configuração de plugins, canais habilitados/configurados, provedores de modelo configurados ou padrões de manifesto incluído. Ele não é o caminho de instalação/atualização para plugins npm de terceiros ou do ClawHub.

Use `--repair` quando uma instalação empacotada relatar dependências de tempo de execução incluídas ausentes durante a inicialização do Gateway ou `plugins doctor`. O reparo instala apenas dependências ausentes de plugins incluídos habilitados, com scripts de ciclo de vida desabilitados. Use `--prune` para remover raízes obsoletas desconhecidas de dependências externas de tempo de execução deixadas por layouts empacotados mais antigos.

### Desinstalação

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, do índice de plugins persistido, de entradas de lista de permissão/bloqueio de plugins e de entradas vinculadas de `plugins.load.paths` quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciado rastreado quando ele está dentro da raiz de extensões de plugins do OpenClaw. Para plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é compatível como alias obsoleto para `--keep-files`.
</Note>

### Atualização

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações de plugin rastreadas no índice de plugins gerenciados e a instalações de pacotes de hooks rastreadas em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolução de id de plugin vs especificação npm">
    Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões fixadas exatas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem uma versão ou tag também resolve de volta para o registro de plugin rastreado. Use isso quando um plugin foi fixado em uma versão exata e você quer movê-lo de volta para a linha de lançamento padrão do registro.

  </Accordion>
  <Accordion title="Verificações de versão e desvio de integridade">
    Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização será ignorada sem baixar, reinstalar ou reescrever `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato obtido muda, o OpenClaw trata isso como desvio de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma fechada, a menos que o chamador forneça uma política de continuação explícita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install na atualização">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de emergência para falsos positivos da varredura integrada de código perigoso durante atualizações de plugin. Ele ainda não contorna bloqueios de política `before_install` do plugin nem bloqueio por falha de varredura, e se aplica apenas a atualizações de plugin, não a atualizações de pacotes de hooks.
  </Accordion>
</AccordionGroup>

### Inspeção

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspecção profunda para um único plugin. Mostra identidade, status de carregamento, origem, recursos registrados, hooks, ferramentas, comandos, serviços, métodos de gateway, rotas HTTP, flags de política, diagnósticos, metadados de instalação, recursos de pacote e qualquer suporte detectado a servidores MCP ou LSP.

Cada plugin é classificado pelo que ele realmente registra em tempo de execução:

- **plain-capability** — um tipo de recurso (por exemplo, um plugin somente de provedor)
- **hybrid-capability** — vários tipos de recurso (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem recursos ou superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem recursos

Consulte [Formatos de plugin](/pt-BR/plugins/architecture#plugin-shapes) para mais informações sobre o modelo de recursos.

<Note>
A flag `--json` emite um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de recurso, avisos de compatibilidade, recursos de pacote e resumo de hooks. `info` é um alias para `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de plugins é o modelo persistido de leitura a frio do OpenClaw para identidade de plugins instalados, habilitação, metadados de origem e propriedade de contribuições. Inicialização normal, consulta de proprietário de provedor, classificação de configuração de canal e inventário de plugins podem lê-lo sem importar módulos de tempo de execução de plugin.

Use `plugins registry` para inspecionar se o registro persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice de plugins persistido, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em tempo de execução.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade obsoleta de emergência para falhas de leitura do registro. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; a alternativa via env é apenas para recuperação emergencial de inicialização enquanto a migração é implantada.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A lista do Marketplace aceita um caminho local de Marketplace, um caminho `marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json` imprime o rótulo de origem resolvido mais o manifesto de Marketplace analisado e as entradas de plugin.

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
