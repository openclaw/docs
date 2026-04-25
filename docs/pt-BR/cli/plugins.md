---
read_when:
    - Você quer instalar ou gerenciar Plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas ao carregar o Plugin
summary: Referência da CLI para `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gerencie Plugins do Gateway, pacotes de hooks e pacotes compatíveis.

Relacionado:

- Sistema de Plugin: [Plugins](/pt-BR/tools/plugin)
- Compatibilidade de pacotes: [Pacotes de Plugin](/pt-BR/plugins/bundles)
- Manifesto e schema de Plugin: [Manifesto de Plugin](/pt-BR/plugins/manifest)
- Endurecimento de segurança: [Segurança](/pt-BR/gateway/security)

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

Os Plugins incluídos são fornecidos com o OpenClaw. Alguns são habilitados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o Plugin de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem fornecer `openclaw.plugin.json` com um JSON Schema inline (`configSchema`, mesmo que vazio). Pacotes compatíveis usam seus próprios manifestos de pacote.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info também mostra o subtipo do pacote (`codex`, `claude` ou `cursor`) mais as capacidades detectadas do pacote.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primeiro, depois npm
openclaw plugins install clawhub:<package>              # somente ClawHub
openclaw plugins install <package> --force              # sobrescreve a instalação existente
openclaw plugins install <package> --pin                # fixa a versão
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # caminho local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nomes de pacote sem qualificador são verificados primeiro no ClawHub e depois no npm. Observação de segurança: trate instalações de Plugin como execução de código. Prefira versões fixadas.

Se sua seção `plugins` for baseada em um único arquivo `$include`, `plugins install/update/enable/disable/uninstall` gravará nesse arquivo incluído e deixará `openclaw.json` intacto. Includes na raiz, arrays de include e includes com sobrescritas irmãs falham de forma segura em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

Se a configuração for inválida, `plugins install` normalmente falha de forma segura e informa para você executar `openclaw doctor --fix` primeiro. A única exceção documentada é um caminho estreito de recuperação de Plugin incluído para Plugins que optam explicitamente por `openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza o destino de instalação existente e sobrescreve um Plugin ou pacote de hooks já instalado no local. Use quando você estiver reinstalando intencionalmente o mesmo id a partir de um novo caminho local, arquivo compactado, pacote do ClawHub ou artefato do npm. Para upgrades rotineiros de um Plugin npm já rastreado, prefira `openclaw plugins update <id-or-npm-spec>`.

Se você executar `plugins install` para um id de Plugin que já está instalado, o OpenClaw para e aponta você para `plugins update <id-or-npm-spec>` para um upgrade normal, ou para `plugins install <package> --force` quando você realmente quiser sobrescrever a instalação atual a partir de outra origem.

`--pin` se aplica somente a instalações via npm. Ele não é compatível com `--marketplace`, porque instalações via marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma opção de último recurso para falsos positivos no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo quando o scanner integrado relata achados `critical`, mas **não** ignora bloqueios de política de hooks `before_install` do Plugin e **não** ignora falhas de varredura.

Essa flag da CLI se aplica aos fluxos de instalação/atualização de Plugin. Instalações de dependências de Skills com suporte do Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de download/instalação de Skills do ClawHub.

`plugins install` também é a superfície de instalação para pacotes de hooks que expõem `openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada de hooks e habilitação por hook, não para instalação de pacotes.

Especificações npm são **somente do registro** (nome do pacote + **versão exata** opcional ou **dist-tag**). Especificações git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependência são executadas com `--ignore-scripts` por segurança.

Especificações simples e `@latest` permanecem na linha estável. Se o npm resolver qualquer uma delas para uma pré-versão, o OpenClaw para e pede que você faça a adesão explicitamente com uma tag de pré-versão como `@beta`/`@rc` ou uma versão exata de pré-versão como `@1.2.3-beta.4`.

Se uma especificação de instalação simples corresponder a um id de Plugin incluído (por exemplo `diffs`), o OpenClaw instala o Plugin incluído diretamente. Para instalar um pacote npm com o mesmo nome, use uma especificação com escopo explícito (por exemplo `@scope/diffs`).

Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalações do marketplace do Claude também são compatíveis.

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

O OpenClaw agora também prefere o ClawHub para especificações de Plugin simples compatíveis com npm. Ele só recorre ao npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

O OpenClaw baixa o arquivo do pacote do ClawHub, verifica a API de Plugin anunciada / compatibilidade mínima com o gateway e então o instala pelo caminho normal de arquivo. Instalações registradas mantêm seus metadados de origem do ClawHub para atualizações posteriores.

Use a forma abreviada `plugin@marketplace` quando o nome do marketplace existir no cache do registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser informar a origem do marketplace explicitamente:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

As origens de marketplace podem ser:

- um nome de marketplace conhecido do Claude de `~/.claude/plugins/known_marketplaces.json`
- uma raiz de marketplace local ou um caminho para `marketplace.json`
- uma forma abreviada de repositório do GitHub, como `owner/repo`
- uma URL de repositório do GitHub, como `https://github.com/owner/repo`
- uma URL git

Para marketplaces remotos carregados do GitHub ou git, entradas de Plugin devem permanecer dentro do repositório clonado do marketplace. O OpenClaw aceita origens de caminho relativas desse repositório e rejeita origens de Plugin HTTP(S), de caminho absoluto, git, GitHub e outras origens que não sejam caminho em manifestos remotos.

Para caminhos locais e arquivos, o OpenClaw detecta automaticamente:

- Plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout de componente padrão do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Pacotes compatíveis são instalados na raiz normal de Plugin e participam do mesmo fluxo de list/info/enable/disable. Atualmente, bundle Skills, command-skills do Claude, padrões de `settings.json` do Claude, padrões de Claude `.lsp.json` / `lspServers` declarados em manifesto, command-skills do Cursor e diretórios de hooks compatíveis do Codex são compatíveis; outras capacidades detectadas do pacote aparecem em diagnósticos/info, mas ainda não estão conectadas à execução em tempo de execução.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Use `--enabled` para mostrar apenas Plugins habilitados. Use `--verbose` para trocar da visualização em tabela para linhas de detalhes por Plugin com metadados de source/origin/version/activation. Use `--json` para inventário legível por máquina e diagnósticos do registro.

`plugins list` lê primeiro o registro local persistido de Plugins, com fallback derivado apenas do manifesto quando o registro está ausente ou inválido. Ele é útil para verificar se um Plugin está instalado, habilitado e visível para o planejamento de inicialização a frio, mas não é uma sondagem em tempo real de um processo do Gateway já em execução. Depois de alterar código de Plugin, habilitação, política de hooks ou `plugins.load.paths`, reinicie o Gateway que atende o canal antes de esperar que novo código `register(api)` ou hooks sejam executados. Para implantações remotas/em contêineres, confirme que você está reiniciando o processo filho real `openclaw gateway run`, não apenas um processo wrapper.

Para depuração de hooks em tempo de execução:

- `openclaw plugins inspect <id> --json` mostra hooks registrados e diagnósticos de uma passagem de inspeção com módulo carregado.
- `openclaw gateway status --deep --require-rpc` confirma o Gateway acessível, dicas de serviço/processo, caminho da configuração e integridade do RPC.
- Hooks de conversa não incluídos (`llm_input`, `llm_output`, `agent_end`) exigem `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` não é compatível com `--link`, porque instalações vinculadas reutilizam o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) em `plugins.installs`, mantendo o comportamento padrão sem fixação.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de Plugin de `plugins.entries`, `plugins.installs`, da allowlist de Plugin e de entradas vinculadas em `plugins.load.paths`, quando aplicável. Para Plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

Por padrão, desinstalar também remove o diretório de instalação do Plugin na raiz de plugins do diretório de estado ativo. Use `--keep-files` para manter os arquivos em disco.

`--keep-config` é compatível como alias obsoleto para `--keep-files`.

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

As atualizações se aplicam a instalações rastreadas em `plugins.installs` e a instalações rastreadas de pacotes de hooks em `hooks.internal.installs`.

Quando você informa um id de Plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas continuam sendo usadas em execuções posteriores de `update <id>`.

Para instalações npm, você também pode informar uma especificação explícita de pacote npm com uma dist-tag ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado, atualiza esse Plugin instalado e registra a nova especificação npm para futuras atualizações baseadas em id.

Informar o nome do pacote npm sem versão nem tag também resolve de volta para o registro de Plugin rastreado. Use isso quando um Plugin tiver sido fixado em uma versão exata e você quiser movê-lo de volta para a linha de lançamento padrão do registro.

Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado em relação aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada já corresponderem ao destino resolvido, a atualização será ignorada sem baixar, reinstalar ou regravar `openclaw.json`.

Quando existe um hash de integridade armazenado e o hash do artefato obtido muda,
o OpenClaw trata isso como desvio de artefato npm. O comando interativo
`openclaw plugins update` imprime os hashes esperado e real e pede
confirmação antes de prosseguir. Auxiliares de atualização não interativos
falham de forma segura, a menos que o chamador forneça uma política explícita
de continuação.

`--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma
substituição de último recurso para falsos positivos do scanner integrado de código perigoso durante
atualizações de Plugin. Ainda assim, ele não ignora bloqueios de política `before_install` do Plugin
nem bloqueios por falha de varredura, e se aplica somente a atualizações de Plugin, não a atualizações de pacotes de hooks.

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspecção profunda para um único Plugin. Mostra identidade, status de carregamento, origem,
capacidades registradas, hooks, ferramentas, comandos, serviços, métodos do gateway,
rotas HTTP, flags de política, diagnósticos, metadados de instalação, capacidades do pacote,
e qualquer suporte detectado a servidor MCP ou LSP.

Cada Plugin é classificado pelo que ele realmente registra em tempo de execução:

- **plain-capability** — um tipo de capacidade (por exemplo, um Plugin somente de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — somente hooks, sem capacidades nem superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para mais informações sobre o modelo de capacidades.

A flag `--json` gera um relatório legível por máquina adequado para script e
auditoria.

`inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade,
avisos de compatibilidade, capacidades do pacote e resumo de hooks.

`info` é um alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugin, diagnósticos de manifesto/descoberta e
avisos de compatibilidade. Quando tudo está limpo, imprime `No plugin issues
detected.`

Para falhas de formato de módulo, como exportações `register`/`activate` ausentes, execute novamente
com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exportação na
saída de diagnóstico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

O registro local de Plugins é o modelo de leitura a frio persistido do OpenClaw para
identidade de Plugin instalado, habilitação, metadados de origem e propriedade de contribuições.
A inicialização normal, a busca do proprietário do provedor, a classificação da configuração de canal e o
inventário de Plugins podem lê-lo sem importar módulos de tempo de execução de Plugin.

Use `plugins registry` para inspecionar se o registro persistido está presente,
atual ou desatualizado. Use `--refresh` para reconstruí-lo a partir do ledger durável de instalação,
da política de configuração e dos metadados de manifesto/pacote. Este é um caminho de reparo, não
um caminho de ativação em tempo de execução.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` é uma chave de compatibilidade obsoleta de último recurso
para falhas de leitura do registro. Prefira `plugins registry
--refresh` ou `openclaw doctor --fix`; o fallback por env é apenas para recuperação emergencial
de inicialização enquanto a migração é implantada.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem do marketplace aceita um caminho de marketplace local, um caminho para `marketplace.json`, uma
forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. `--json`
imprime o rótulo da origem resolvida, além do manifesto do marketplace analisado e das
entradas de Plugin.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Plugins da comunidade](/pt-BR/plugins/community)
