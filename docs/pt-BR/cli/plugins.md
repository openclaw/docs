---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou bundles compatíveis
    - Você quer depurar falhas no carregamento de plugins
sidebarTitle: Plugins
summary: Referência da CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, habilitar/desabilitar, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gerencie plugins do Gateway, hook packs e bundles compatíveis.

<CardGroup cols={2}>
  <Card title="Sistema de plugins" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como instalar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Bundles de plugins" href="/pt-BR/plugins/bundles">
    Modelo de compatibilidade de bundles.
  </Card>
  <Card title="Manifesto de plugin" href="/pt-BR/plugins/manifest">
    Campos do manifesto e esquema de configuração.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security">
    Hardening de segurança para instalações de plugins.
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Plugins empacotados acompanham o OpenClaw. Alguns vêm habilitados por padrão (por exemplo, provedores de modelo empacotados, provedores de fala empacotados e o plugin de navegador empacotado); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem incluir `openclaw.plugin.json` com um JSON Schema inline (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) além das capacidades detectadas do bundle.
</Note>

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primeiro, depois npm
openclaw plugins install clawhub:<package>              # somente ClawHub
openclaw plugins install <package> --force              # sobrescreve instalação existente
openclaw plugins install <package> --pin                # fixa a versão
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # caminho local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Nomes de pacote sem qualificador são verificados primeiro no ClawHub e depois no npm. Trate instalações de plugins como execução de código. Prefira versões fixadas.
</Warning>

<AccordionGroup>
  <Accordion title="Includes de configuração e recuperação de configuração inválida">
    Se sua seção `plugins` for baseada em um único `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` grava nesse arquivo incluído e deixa `openclaw.json` intocado. Includes na raiz, arrays de include e includes com substituições irmãs falham de forma segura em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos suportados.

    Se a configuração for inválida, `plugins install` normalmente falha de forma segura e informa para você executar `openclaw doctor --fix` primeiro. A única exceção documentada é um caminho estreito de recuperação para plugin empacotado para plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstalação vs update">
    `--force` reutiliza o destino de instalação existente e sobrescreve no local um plugin ou hook pack já instalado. Use isso quando você quiser intencionalmente reinstalar o mesmo id a partir de um novo caminho local, arquivo compactado, pacote do ClawHub ou artefato npm. Para upgrades rotineiros de um plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

    Se você executar `plugins install` para um id de plugin que já está instalado, o OpenClaw para e direciona você para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de uma fonte diferente.

  </Accordion>
  <Accordion title="Escopo de --pin">
    `--pin` se aplica apenas a instalações npm. Não é suportado com `--marketplace`, porque instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` é uma opção de último recurso para falsos positivos no scanner interno de código perigoso. Ela permite que a instalação continue mesmo quando o scanner interno relata achados `critical`, mas **não** ignora bloqueios de política de hook `before_install` de plugins nem ignora falhas de varredura.

    Essa flag de CLI se aplica aos fluxos de instalação/atualização de plugins. Instalações de dependências de Skills com suporte do Gateway usam a substituição correspondente `dangerouslyForceUnsafeInstall` na requisição, enquanto `openclaw skills install` permanece um fluxo separado de download/instalação de Skills do ClawHub.

  </Accordion>
  <Accordion title="Hook packs e especificações npm">
    `plugins install` também é a superfície de instalação para hook packs que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacote.

    Especificações npm são **somente de registry** (nome do pacote + **versão exata** opcional ou **dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependências são executadas localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu shell tem configurações globais de instalação do npm.

    Especificações sem qualificador e `@latest` permanecem na trilha estável. Se o npm resolver qualquer um deles para uma pré-versão, o OpenClaw para e pede que você faça opt-in explicitamente com uma tag de pré-versão como `@beta`/`@rc` ou uma versão de pré-versão exata como `@1.2.3-beta.4`.

    Se uma especificação de instalação sem qualificador corresponder ao id de um plugin empacotado (por exemplo `diffs`), o OpenClaw instala o plugin empacotado diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo `@scope/diffs`).

  </Accordion>
  <Accordion title="Arquivos compactados">
    Arquivos suportados: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Arquivos compactados de plugins nativos do OpenClaw devem conter um `openclaw.plugin.json` válido na raiz do plugin extraído; arquivos compactados que contêm apenas `package.json` são rejeitados antes que o OpenClaw grave registros de instalação.

    Instalações de marketplace do Claude também são suportadas.

  </Accordion>
</AccordionGroup>

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Agora o OpenClaw também prefere o ClawHub para especificações de plugin sem qualificador compatíveis com npm. Ele só recorre ao npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

O OpenClaw baixa o arquivo compactado do pacote do ClawHub, verifica a compatibilidade anunciada da API de plugin / gateway mínimo e então o instala pelo caminho normal de arquivo compactado. Instalações registradas mantêm seus metadados de origem do ClawHub para atualizações futuras.

#### Forma abreviada de marketplace

Use a forma abreviada `plugin@marketplace` quando o nome do marketplace existir no cache local de registry do Claude em `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Origens de marketplace">
    - um nome de marketplace conhecido do Claude a partir de `~/.claude/plugins/known_marketplaces.json`
    - uma raiz de marketplace local ou caminho para `marketplace.json`
    - uma forma abreviada de repositório GitHub como `owner/repo`
    - uma URL de repositório GitHub como `https://github.com/owner/repo`
    - uma URL git

  </Tab>
  <Tab title="Regras de marketplace remoto">
    Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer dentro do repositório clonado do marketplace. O OpenClaw aceita origens de caminho relativo desse repositório e rejeita origens de plugin HTTP(S), caminho absoluto, git, GitHub e outras origens que não sejam caminho em manifestos remotos.
  </Tab>
</Tabs>

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- bundles compatíveis com Codex (`.codex-plugin/plugin.json`)
- bundles compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão de componentes do Claude)
- bundles compatíveis com Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundles compatíveis são instalados na raiz normal de plugins e participam do mesmo fluxo de list/info/enable/disable. Hoje, são suportados Skills de bundle, command-skills do Claude, padrões do `settings.json` do Claude, padrões do Claude `.lsp.json` / `lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks compatíveis com Codex; outras capacidades detectadas do bundle são mostradas em diagnósticos/info, mas ainda não estão conectadas à execução em runtime.
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
  Troca a visualização em tabela por linhas de detalhe por plugin com metadados de source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventário legível por máquina mais diagnósticos do registry.
</ParamField>

<Note>
`plugins list` lê primeiro o registry local persistido de plugins, com um fallback derivado apenas do manifesto quando o registry está ausente ou inválido. Isso é útil para verificar se um plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sonda de runtime em tempo real de um processo Gateway já em execução. Depois de alterar código de plugin, habilitação, política de hook ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em container, verifique se você está reiniciando o processo filho real `openclaw gateway run`, e não apenas um processo wrapper.
</Note>

Para trabalhar com plugins empacotados dentro de uma imagem Docker empacotada, faça bind-mount do diretório
de código-fonte do plugin sobre o caminho de código-fonte empacotado correspondente, como
`/app/extensions/synology-chat`. O OpenClaw descobrirá esse overlay de código-fonte montado
antes de `/app/dist/extensions/synology-chat`; um diretório de código-fonte simplesmente copiado
permanece inerte, então instalações empacotadas normais continuam usando o dist compilado.

Para depuração de hooks em runtime:

- `openclaw plugins inspect <id> --json` mostra hooks registrados e diagnósticos de uma passada de inspeção com módulo carregado.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway acessível, dicas de serviço/processo, caminho da configuração e saúde do RPC.
- Hooks de conversa não empacotados (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` não é suportado com `--link` porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) no índice de plugins gerenciados, mantendo o comportamento padrão sem fixação.
</Note>

### Índice de plugins

Metadados de instalação de plugins são estado gerenciado pela máquina, não configuração do usuário. Instalações e atualizações os gravam em `plugins/installs.json` no diretório de estado ativo do OpenClaw. Seu mapa de nível superior `installRecords` é a fonte durável dos metadados de instalação, incluindo registros de manifestos de plugin quebrados ou ausentes. O array `plugins` é o cache frio do registry derivado do manifesto. O arquivo inclui um aviso de não edição e é usado por `openclaw plugins update`, desinstalação, diagnósticos e pelo registry frio de plugins.

Quando o OpenClaw encontra registros legados enviados em `plugins.installs` na configuração, ele os move para o índice de plugins e remove a chave de configuração; se qualquer gravação falhar, os registros de configuração são mantidos para que os metadados de instalação não sejam perdidos.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, do índice persistido de plugins, de entradas de allowlist/denylist de plugins e de entradas vinculadas de `plugins.load.paths`, quando aplicável. A menos que `--keep-files` esteja definido, a desinstalação também remove o diretório de instalação gerenciada rastreado quando ele está dentro da raiz de extensões de plugins do OpenClaw. Para plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

<Note>
`--keep-config` é suportado como alias obsoleto para `--keep-files`.
</Note>

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Atualizações se aplicam a instalações rastreadas de plugins no índice gerenciado de plugins e a instalações rastreadas de hook packs em `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolvendo id de plugin vs especificação npm">
    Quando você passa um id de plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

    Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de plugin rastreado, atualiza esse plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

    Passar o nome do pacote npm sem versão nem tag também resolve de volta para o registro de plugin rastreado. Use isso quando um plugin tiver sido fixado em uma versão exata e você quiser movê-lo de volta para a linha de release padrão do registry.

  </Accordion>
  <Accordion title="Verificações de versão e divergência de integridade">
    Antes de uma atualização npm ativa, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registry npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização será ignorada sem download, reinstalação ou regravação de `openclaw.json`.

    Quando existe um hash de integridade armazenado e o hash do artefato buscado muda, o OpenClaw trata isso como divergência de artefato npm. O comando interativo `openclaw plugins update` imprime os hashes esperado e real e pede confirmação antes de prosseguir. Helpers de atualização não interativos falham de forma segura, a menos que o chamador forneça uma política explícita de continuação.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install em update">
    `--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma substituição de último recurso para falsos positivos do scanner interno de código perigoso durante atualizações de plugins. Ainda assim, ele não ignora bloqueios de política de `before_install` de plugins nem o bloqueio por falha de varredura, e se aplica apenas a atualizações de plugins, não a atualizações de hook packs.
  </Accordion>
</AccordionGroup>

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspecção profunda de um único plugin. Mostra identidade, status de carregamento, origem, capacidades registradas, hooks, ferramentas, comandos, serviços, métodos do gateway, rotas HTTP, flags de política, diagnósticos, metadados de instalação, capacidades de bundle e qualquer suporte detectado a servidor MCP ou LSP.

Cada plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo, um plugin apenas de provedor)
- **hybrid-capability** — múltiplos tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades nem superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de plugin](/pt-BR/plugins/architecture#plugin-shapes) para mais detalhes sobre o modelo de capacidades.

<Note>
A flag `--json` gera um relatório legível por máquina adequado para scripts e auditoria. `inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade, avisos de compatibilidade, capacidades de bundle e resumo de hooks. `info` é um alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de plugins, diagnósticos de manifesto/descoberta e avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues detected.`

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na saída de diagnóstico.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registry local de plugins é o modelo persistido de leitura fria do OpenClaw para identidade de plugin instalada, habilitação, metadados de origem e propriedade de contribuições. Inicialização normal, lookup do proprietário do provedor, classificação da configuração de canal e inventário de plugins podem lê-lo sem importar módulos de runtime de plugins.

Use `plugins registry` para inspecionar se o registry persistido está presente, atual ou obsoleto. Use `--refresh` para reconstruí-lo a partir do índice persistido de plugins, da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não um caminho de ativação em runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade de último recurso obsoleta para falhas de leitura do registry. Prefira `plugins registry --refresh` ou `openclaw doctor --fix`; o fallback por env é apenas para recuperação emergencial de inicialização enquanto a migração é implantada.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem de marketplace aceita um caminho local de marketplace, um caminho para `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório GitHub ou uma URL git. `--json` imprime o rótulo da origem resolvida mais o manifesto de marketplace analisado e as entradas de plugin.

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Referência da CLI](/pt-BR/cli)
- [Plugins da comunidade](/pt-BR/plugins/community)
